import { db } from "../db";
import {
  orders,
  batches,
  userBatchMapping,
  testSeries,
  userTestSeriesMapping,
  organizationConfig,
} from "../db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import Razorpay from "razorpay";
import crypto from "crypto";
import { CacheManager } from "./cache.service";
import { decryptRazorpayKey } from "../utils/encryption";

/**
 * Get organization-specific Razorpay instance
 * Each organization has its own Razorpay keys for true multi-tenancy
 * Keys are encrypted in database and decrypted on-the-fly for security
 */
async function getRazorpayForOrg(organizationId: string): Promise<{
  instance: Razorpay;
  keyId: string;
  keySecret: string;
}> {
  // Fetch organization config with encrypted Razorpay keys
  const config = await db.query.organizationConfig.findFirst({
    where: eq(organizationConfig.organizationId, organizationId),
    columns: {
      razorpayKeyId: true,
      razorpayKeySecret: true,
    },
  });

  if (!config?.razorpayKeyId || !config?.razorpayKeySecret) {
    throw new Error(
      "Razorpay credentials not configured for this organization. Please contact administrator."
    );
  }

  // Decrypt Razorpay credentials
  const decryptedKeyId = decryptRazorpayKey(config.razorpayKeyId);
  const decryptedKeySecret = decryptRazorpayKey(config.razorpayKeySecret);

  // Create new Razorpay instance with decrypted org-specific keys
  const instance = new Razorpay({
    key_id: decryptedKeyId,
    key_secret: decryptedKeySecret,
  });

  return {
    instance,
    keyId: decryptedKeyId, // Return decrypted key for frontend
    keySecret: decryptedKeySecret, // Return decrypted secret for signature verification
  };
}

interface CreateBatchOrderParams {
  userId: string;
  batchId: string;
  organizationId: string;
}

interface CreateTestSeriesOrderParams {
  userId: string;
  testSeriesId: string;
  organizationId: string;
}

interface VerifyPaymentParams {
  orderId: string;
  userId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

/**
 * Create an order for batch purchase
 */
export async function createBatchOrder({
  userId,
  batchId,
  organizationId,
}: CreateBatchOrderParams) {
  const batch = await db.query.batches.findFirst({
    where: and(
      eq(batches.id, batchId),
      eq(batches.organizationId, organizationId)
    ),
  });

  if (!batch) {
    throw new Error("Batch not found");
  }

  if (batch.status !== "ACTIVE") {
    throw new Error("Batch is not active");
  }

  // 2. Check if user already purchased
  const existingPurchase = await db.query.userBatchMapping.findFirst({
    where: and(
      eq(userBatchMapping.userId, userId),
      eq(userBatchMapping.batchId, batchId),
      eq(userBatchMapping.organizationId, organizationId)
    ),
  });

  if (existingPurchase) {
    throw new Error("You have already purchased this batch");
  }

  // 3. Calculate pricing
  const originalPrice = batch.totalPrice;
  const discountAmount = (originalPrice * batch.discountPercentage) / 100;
  const finalPrice = originalPrice - discountAmount;

  // 4. Check if it's a free batch
  if (finalPrice === 0) {
    throw new Error("This is a free batch. Use free enrollment endpoint");
  }

  // 5. Create order in database
  const [order] = await db
    .insert(orders)
    .values({
      userId,
      organizationId,
      entityType: "BATCH",
      entityId: batchId,
      amount: finalPrice,
      currency: "INR",
      paymentProvider: "RAZORPAY",
      paymentStatus: "PENDING",
    })
    .returning();

  // 6. Get organization-specific Razorpay instance
  const { instance: razorpay, keyId } = await getRazorpayForOrg(organizationId);

  // 7. Create Razorpay order
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(finalPrice * 100), // Convert to paise
    currency: "INR",
    receipt: `B-${order.id.substring(0, 8)}-${Date.now()}`.substring(0, 40), // Max 40 chars
    notes: {
      orderId: order.id,
      userId,
      batchId,
      entityType: "BATCH",
    },
  });

  // 8. Update order with Razorpay order ID
  await db
    .update(orders)
    .set({
      providerOrderId: razorpayOrder.id,
      receiptId: razorpayOrder.receipt,
      transactionData: razorpayOrder,
    })
    .where(eq(orders.id, order.id));

  return {
    orderId: order.id,
    razorpayOrderId: razorpayOrder.id,
    amount: finalPrice,
    currency: "INR",
    key: keyId, // Organization-specific Razorpay key
    batchName: batch.name,
    originalPrice,
    discountAmount,
    finalPrice,
  };
}

/**
 * Create an order for test series purchase
 */
export async function createTestSeriesOrder({
  userId,
  testSeriesId,
  organizationId,
}: CreateTestSeriesOrderParams) {
  // 1. Fetch test series details
  const series = await db.query.testSeries.findFirst({
    where: and(
      eq(testSeries.id, testSeriesId),
      eq(testSeries.organizationId, organizationId)
    ),
  });

  if (!series) {
    throw new Error("Test series not found");
  }

  if (series.status !== "ACTIVE") {
    throw new Error("Test series is not active");
  }

  // 2. Check if user already enrolled
  const existingEnrollment = await db.query.userTestSeriesMapping.findFirst({
    where: and(
      eq(userTestSeriesMapping.userId, userId),
      eq(userTestSeriesMapping.testSeriesId, testSeriesId),
      eq(userTestSeriesMapping.organizationId, organizationId)
    ),
  });

  if (existingEnrollment) {
    throw new Error("You have already enrolled in this test series");
  }

  // 3. Calculate pricing
  const originalPrice = series.totalPrice;
  const discountAmount = (originalPrice * series.discountPercentage) / 100;
  const finalPrice = originalPrice - discountAmount;

  // 4. Check if it's free
  if (finalPrice === 0 || series.isFree) {
    throw new Error("This is a free test series. Use free enrollment endpoint");
  }

  // 5. Create order in database
  const [order] = await db
    .insert(orders)
    .values({
      userId,
      organizationId,
      entityType: "TEST_SERIES",
      entityId: testSeriesId,
      amount: finalPrice,
      currency: "INR",
      paymentProvider: "RAZORPAY",
      paymentStatus: "PENDING",
    })
    .returning();

  // 6. Get organization-specific Razorpay instance
  const { instance: razorpay, keyId } = await getRazorpayForOrg(organizationId);

  // 7. Create Razorpay order
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(finalPrice * 100), // Convert to paise
    currency: "INR",
    receipt: `T-${order.id.substring(0, 8)}-${Date.now()}`.substring(0, 40), // Max 40 chars
    notes: {
      orderId: order.id,
      userId,
      testSeriesId,
      entityType: "TEST_SERIES",
    },
  });

  // 8. Update order with Razorpay order ID
  await db
    .update(orders)
    .set({
      providerOrderId: razorpayOrder.id,
      receiptId: razorpayOrder.receipt,
      transactionData: razorpayOrder,
    })
    .where(eq(orders.id, order.id));

  return {
    orderId: order.id,
    razorpayOrderId: razorpayOrder.id,
    amount: finalPrice,
    currency: "INR",
    key: keyId, // Organization-specific Razorpay key
    seriesName: series.title,
    originalPrice,
    discountAmount,
    finalPrice,
  };
}

/**
 * Verify Razorpay payment and complete enrollment
 */
export async function verifyPayment({
  orderId,
  userId,
  razorpayPaymentId,
  razorpayOrderId,
  razorpaySignature,
}: VerifyPaymentParams) {
  // 1. Fetch order
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.paymentStatus === "SUCCESS") {
    throw new Error("Payment already verified");
  }

  // 2. Get organization-specific Razorpay secret for signature verification
  const { keySecret } = await getRazorpayForOrg(order.organizationId);

  // 3. Verify Razorpay signature using organization-specific secret
  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (generatedSignature !== razorpaySignature) {
    // Update order as failed
    await db
      .update(orders)
      .set({
        paymentStatus: "FAILED",
        failureReason: "Invalid signature",
        failedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    throw new Error("Invalid payment signature");
  }

  // 4. Update order status
  await db
    .update(orders)
    .set({
      paymentStatus: "SUCCESS",
      providerPaymentId: razorpayPaymentId,
      providerSignature: razorpaySignature,
      completedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  // 5. Create enrollment based on entity type
  if (order.entityType === "BATCH") {
    await enrollUserInBatch(order);
    // Invalidate batch-related caches for this user
    await CacheManager.invalidateBatch(order.entityId, order.organizationId);
  } else if (order.entityType === "TEST_SERIES") {
    await enrollUserInTestSeries(order);
    // Invalidate test series-related caches for this user
    await CacheManager.invalidateTestSeries(
      order.entityId,
      order.organizationId
    );
  }

  return {
    success: true,
    orderId: order.id,
    paymentId: razorpayPaymentId,
  };
}

/**
 * Enroll user in batch after successful payment
 */
async function enrollUserInBatch(order: any) {
  // Fetch batch to get validity period
  const batch = await db.query.batches.findFirst({
    where: eq(batches.id, order.entityId),
  });

  if (!batch) {
    throw new Error("Batch not found");
  }

  // Calculate expiry (batch endDate)
  const expiresAt = batch.endDate;

  // Create enrollment
  const [enrollment] = await db
    .insert(userBatchMapping)
    .values({
      userId: order.userId,
      batchId: order.entityId,
      organizationId: order.organizationId,
      originalPrice: batch.totalPrice,
      discountAmount: (batch.totalPrice * batch.discountPercentage) / 100,
      finalPrice: order.amount,
      orderId: order.id,
      startDate: new Date(),
      expiresAt,
      isActive: true,
    })
    .returning();

  return enrollment;
}

/**
 * Enroll user in test series after successful payment
 */
async function enrollUserInTestSeries(order: any) {
  // Fetch test series to get duration
  const series = await db.query.testSeries.findFirst({
    where: eq(testSeries.id, order.entityId),
  });

  if (!series) {
    throw new Error("Test series not found");
  }

  // Calculate expiry date (startDate + durationDays)
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + (series.durationDays || 365));

  // Create enrollment
  const [enrollment] = await db
    .insert(userTestSeriesMapping)
    .values({
      userId: order.userId,
      testSeriesId: order.entityId,
      organizationId: order.organizationId,
      originalPrice: series.totalPrice,
      discountAmount: (series.totalPrice * series.discountPercentage) / 100,
      finalPrice: order.amount,
      orderId: order.id,
      startDate,
      endDate,
      isActive: true,
    })
    .returning();

  return enrollment;
}

/**
 * Free batch enrollment
 */
export async function enrollInFreeBatch({
  userId,
  batchId,
  organizationId,
}: CreateBatchOrderParams) {
  // 1. Fetch batch details
  const batch = await db.query.batches.findFirst({
    where: and(
      eq(batches.id, batchId),
      eq(batches.organizationId, organizationId)
    ),
  });

  if (!batch) {
    throw new Error("Batch not found");
  }

  if (batch.status !== "ACTIVE") {
    throw new Error("Batch is not active");
  }

  // 2. Check if user already enrolled
  const existingEnrollment = await db.query.userBatchMapping.findFirst({
    where: and(
      eq(userBatchMapping.userId, userId),
      eq(userBatchMapping.batchId, batchId),
      eq(userBatchMapping.organizationId, organizationId)
    ),
  });

  if (existingEnrollment) {
    throw new Error("You have already enrolled in this batch");
  }

  // 3. Verify it's free
  const originalPrice = batch.totalPrice;
  const discountAmount = (originalPrice * batch.discountPercentage) / 100;
  const finalPrice = originalPrice - discountAmount;

  if (finalPrice > 0) {
    throw new Error("This batch is not free. Please use checkout endpoint");
  }

  // 4. Create enrollment
  const [enrollment] = await db
    .insert(userBatchMapping)
    .values({
      userId,
      batchId,
      organizationId,
      originalPrice: 0,
      discountAmount: 0,
      finalPrice: 0,
      orderId: null, // No payment for free enrollment
      startDate: new Date(),
      expiresAt: batch.endDate,
      isActive: true,
    })
    .returning();

  // Invalidate batch-related caches for this user
  await CacheManager.invalidateBatch(batchId, organizationId);

  return {
    success: true,
    enrollmentId: enrollment.id,
    expiresAt: enrollment.expiresAt,
  };
}

/**
 * Free test series enrollment
 */
export async function enrollInFreeTestSeries({
  userId,
  testSeriesId,
  organizationId,
}: CreateTestSeriesOrderParams) {
  // 1. Fetch test series details
  const series = await db.query.testSeries.findFirst({
    where: and(
      eq(testSeries.id, testSeriesId),
      eq(testSeries.organizationId, organizationId)
    ),
  });

  if (!series) {
    throw new Error("Test series not found");
  }

  if (series.status !== "ACTIVE") {
    throw new Error("Test series is not active");
  }

  // 2. Check if user already enrolled
  const existingEnrollment = await db.query.userTestSeriesMapping.findFirst({
    where: and(
      eq(userTestSeriesMapping.userId, userId),
      eq(userTestSeriesMapping.testSeriesId, testSeriesId),
      eq(userTestSeriesMapping.organizationId, organizationId)
    ),
  });

  if (existingEnrollment) {
    throw new Error("You have already enrolled in this test series");
  }

  // 3. Verify it's free
  const originalPrice = series.totalPrice;
  const discountAmount = (originalPrice * series.discountPercentage) / 100;
  const finalPrice = originalPrice - discountAmount;

  if (!series.isFree && finalPrice > 0) {
    throw new Error(
      "This test series is not free. Please use checkout endpoint"
    );
  }

  // 4. Calculate expiry
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + (series.durationDays || 365));

  // 5. Create enrollment
  const [enrollment] = await db
    .insert(userTestSeriesMapping)
    .values({
      userId,
      testSeriesId,
      organizationId,
      originalPrice: 0,
      discountAmount: 0,
      finalPrice: 0,
      orderId: null, // No payment for free enrollment
      startDate,
      endDate,
      isActive: true,
    })
    .returning();

  // Invalidate test series-related caches for this user
  await CacheManager.invalidateTestSeries(testSeriesId, organizationId);

  return {
    success: true,
    enrollmentId: enrollment.id,
    startDate: enrollment.startDate,
    endDate: enrollment.endDate,
  };
}

/**
 * Get order history for a user with pagination
 * Includes both successful and failed orders for batches and test series
 */
export async function getOrderHistory(
  userId: string,
  organizationId: string,
  page: number = 1,
  limit: number = 10,
  status?: "SUCCESS" | "FAILED" | "PENDING" | "PROCESSING" | "REFUNDED"
) {
  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions = [
    eq(orders.userId, userId),
    eq(orders.organizationId, organizationId),
  ];

  if (status) {
    whereConditions.push(eq(orders.paymentStatus, status));
  }

  // Get total count for pagination
  const [{ value: totalCount }] = await db
    .select({ value: count() })
    .from(orders)
    .where(and(...whereConditions));

  // Fetch orders with entity details
  const ordersList = await db
    .select({
      id: orders.id,
      entityType: orders.entityType,
      entityId: orders.entityId,
      amount: orders.amount,
      currency: orders.currency,
      paymentProvider: orders.paymentProvider,
      paymentStatus: orders.paymentStatus,
      providerOrderId: orders.providerOrderId,
      providerPaymentId: orders.providerPaymentId,
      receiptId: orders.receiptId,
      failureReason: orders.failureReason,
      refundId: orders.refundId,
      refundAmount: orders.refundAmount,
      refundedAt: orders.refundedAt,
      initiatedAt: orders.initiatedAt,
      completedAt: orders.completedAt,
      failedAt: orders.failedAt,
      createdAt: orders.createdAt,
      // Batch details
      batchName: batches.name,
      batchDescription: batches.description,
      batchStartDate: batches.startDate,
      batchEndDate: batches.endDate,
      // Test series details
      testSeriesTitle: testSeries.title,
      testSeriesDescription: testSeries.description,
      testSeriesDuration: testSeries.durationDays,
    })
    .from(orders)
    .leftJoin(
      batches,
      and(eq(orders.entityId, batches.id), eq(orders.entityType, "BATCH"))
    )
    .leftJoin(
      testSeries,
      and(
        eq(orders.entityId, testSeries.id),
        eq(orders.entityType, "TEST_SERIES")
      )
    )
    .where(and(...whereConditions))
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  // Format the response
  const formattedOrders = ordersList.map((order) => {
    const baseOrder = {
      id: order.id,
      entityType: order.entityType,
      entityId: order.entityId,
      amount: order.amount,
      currency: order.currency,
      paymentProvider: order.paymentProvider,
      paymentStatus: order.paymentStatus,
      providerOrderId: order.providerOrderId,
      providerPaymentId: order.providerPaymentId,
      receiptId: order.receiptId,
      failureReason: order.failureReason,
      refundId: order.refundId,
      refundAmount: order.refundAmount,
      refundedAt: order.refundedAt,
      initiatedAt: order.initiatedAt,
      completedAt: order.completedAt,
      failedAt: order.failedAt,
      createdAt: order.createdAt,
    };

    // Add entity-specific details
    if (order.entityType === "BATCH") {
      return {
        ...baseOrder,
        entityDetails: {
          name: order.batchName,
          description: order.batchDescription,
          startDate: order.batchStartDate,
          endDate: order.batchEndDate,
        },
      };
    } else {
      return {
        ...baseOrder,
        entityDetails: {
          title: order.testSeriesTitle,
          description: order.testSeriesDescription,
          durationDays: order.testSeriesDuration,
        },
      };
    }
  });

  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: formattedOrders,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
