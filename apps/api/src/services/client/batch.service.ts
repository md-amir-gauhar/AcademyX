import { db } from "../../db";
import {
  batches,
  userBatchMapping,
  batchTeacherMapping,
} from "../../db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { ApiError } from "../../common/response";
import { HTTP_STATUS } from "../../common/constants";
import {
  calculateValidity,
  calculateDiscountedPrice,
} from "../shared/batch-helpers";

export async function getBatch(
  identifier: string,
  userId: string,
  organizationId: string
) {
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier
    );

  // Client can only see ACTIVE batches
  const batchData = await db.query.batches.findFirst({
    where: and(
      isUUID ? eq(batches.id, identifier) : eq(batches.slug, identifier),
      eq(batches.organizationId, organizationId),
      eq(batches.status, "ACTIVE")
    ),
  });

  if (!batchData) {
    throw new ApiError("Batch not found", HTTP_STATUS.NOT_FOUND);
  }

  const validity = calculateValidity(batchData.startDate, batchData.endDate);
  const discountedPrice = calculateDiscountedPrice(
    batchData.totalPrice,
    batchData.discountPercentage
  );

  const teacherMappings = await db.query.batchTeacherMapping.findMany({
    where: eq(batchTeacherMapping.batchId, batchData.id),
    with: {
      teacher: true,
    },
  });

  const teachers = teacherMappings.map((mapping: any) => mapping.teacher);

  // Check if user has purchased this batch
  let isPurchased = false;
  let purchasedAt = null;

  const purchase = await db.query.userBatchMapping.findFirst({
    where: and(
      eq(userBatchMapping.userId, userId),
      eq(userBatchMapping.batchId, batchData.id),
      eq(userBatchMapping.organizationId, organizationId)
    ),
  });

  if (purchase) {
    isPurchased = true;
    purchasedAt = purchase.startDate;
  }

  return {
    ...batchData,
    validity,
    discountedPrice,
    teachers,
    isPurchased,
    purchasedAt,
  };
}

export async function getAllBatches(
  organizationId: string,
  userId: string,
  page: number = 1,
  limit: number = 10
) {
  const offset = (page - 1) * limit;

  // Client can only see ACTIVE batches
  const allBatches = await db.query.batches.findMany({
    where: and(
      eq(batches.organizationId, organizationId),
      eq(batches.status, "ACTIVE")
    ),
  });
  const totalCount = allBatches.length;

  // Get paginated batches
  const batchesList = await db.query.batches.findMany({
    where: and(
      eq(batches.organizationId, organizationId),
      eq(batches.status, "ACTIVE")
    ),
    orderBy: (batches, { desc }) => [desc(batches.createdAt)],
    limit,
    offset,
  });

  const batchIds = batchesList.map((b) => b.id);

  // Get all teacher mappings for these batches
  const teacherMappings = await db.query.batchTeacherMapping.findMany({
    where: eq(batchTeacherMapping.organizationId, organizationId),
    with: {
      teacher: true,
    },
  });

  // Group teachers by batchId
  const teachersByBatchId: Record<string, any[]> = {};
  teacherMappings.forEach((mapping: any) => {
    if (batchIds.includes(mapping.batchId)) {
      if (!teachersByBatchId[mapping.batchId]) {
        teachersByBatchId[mapping.batchId] = [];
      }
      teachersByBatchId[mapping.batchId].push(mapping.teacher);
    }
  });

  // Check which batches the user has purchased
  const purchasedBatches = await db.query.userBatchMapping.findMany({
    where: and(
      eq(userBatchMapping.userId, userId),
      eq(userBatchMapping.organizationId, organizationId),
      inArray(userBatchMapping.batchId, batchIds)
    ),
    columns: {
      batchId: true,
    },
  });
  const purchasedBatchIds = purchasedBatches.map((pb) => pb.batchId);

  // Filter out purchased batches - only return unpurchased ones
  const unpurchasedBatches = batchesList.filter(
    (b) => !purchasedBatchIds.includes(b.id)
  );

  const data = unpurchasedBatches.map((b) => {
    const validity = calculateValidity(b.startDate, b.endDate);
    const discountedPrice = calculateDiscountedPrice(
      b.totalPrice,
      b.discountPercentage
    );

    return {
      ...b,
      validity,
      discountedPrice,
      teachers: teachersByBatchId[b.id] || [],
      isPurchased: false, // All are unpurchased
    };
  });

  return {
    data,
    pagination: {
      page,
      limit,
      totalCount: unpurchasedBatches.length,
      totalPages: Math.ceil(unpurchasedBatches.length / limit),
      hasNextPage: page < Math.ceil(unpurchasedBatches.length / limit),
      hasPrevPage: page > 1,
    },
  };
}

export async function getPurchasedBatches(
  organizationId: string,
  userId: string,
  page: number = 1,
  limit: number = 10
) {
  const offset = (page - 1) * limit;

  // Get all purchased batch IDs with purchase info
  const allPurchasedMappings = await db.query.userBatchMapping.findMany({
    where: and(
      eq(userBatchMapping.userId, userId),
      eq(userBatchMapping.organizationId, organizationId)
    ),
    orderBy: (userBatchMapping, { desc }) => [desc(userBatchMapping.startDate)],
  });

  const totalCount = allPurchasedMappings.length;

  if (totalCount === 0) {
    return {
      data: [],
      pagination: {
        page,
        limit,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  // Get paginated purchased mappings
  const paginatedMappings = allPurchasedMappings.slice(offset, offset + limit);
  const purchasedBatchIds = paginatedMappings.map((pm) => pm.batchId);

  // Get batch details (only active batches)
  const purchasedBatches = await db.query.batches.findMany({
    where: and(
      eq(batches.organizationId, organizationId),
      inArray(batches.id, purchasedBatchIds)
    ),
  });

  // Get all teacher mappings for these batches
  const teacherMappings = await db.query.batchTeacherMapping.findMany({
    where: eq(batchTeacherMapping.organizationId, organizationId),
    with: {
      teacher: true,
    },
  });

  // Group teachers by batchId
  const teachersByBatchId: Record<string, any[]> = {};
  teacherMappings.forEach((mapping: any) => {
    if (purchasedBatchIds.includes(mapping.batchId)) {
      if (!teachersByBatchId[mapping.batchId]) {
        teachersByBatchId[mapping.batchId] = [];
      }
      teachersByBatchId[mapping.batchId].push(mapping.teacher);
    }
  });

  // Filter and map batches
  const data = paginatedMappings
    .map((mapping) => {
      const batch = purchasedBatches.find((b) => b.id === mapping.batchId);
      if (!batch) return null;

      const validity = calculateValidity(batch.startDate, batch.endDate);
      const discountedPrice = calculateDiscountedPrice(
        batch.totalPrice,
        batch.discountPercentage
      );

      return {
        ...batch,
        validity,
        discountedPrice,
        teachers: teachersByBatchId[batch.id] || [],
        isPurchased: true,
        purchasedAt: mapping.startDate,
        expiresAt: mapping.expiresAt,
      };
    })
    .filter((batch) => batch !== null);

  return {
    data,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1,
    },
  };
}
