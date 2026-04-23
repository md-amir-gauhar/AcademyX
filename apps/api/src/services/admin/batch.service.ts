import { db } from "../../db";
import {
  batches,
  userBatchMapping,
  batchTeacherMapping,
} from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { ApiError } from "../../common/response";
import { HTTP_STATUS } from "../../common/constants";
import { CacheManager } from "../cache.service";
import {
  generateSlug,
  calculateValidity,
  calculateDiscountedPrice,
  CreateBatchInput,
  UpdateBatchInput,
} from "../shared/batch-helpers";

export async function createBatch(input: CreateBatchInput) {
  const slug = generateSlug(input.name);

  // Convert string dates to Date objects if needed
  const startDate =
    typeof input.startDate === "string"
      ? new Date(input.startDate)
      : input.startDate;
  const endDate =
    typeof input.endDate === "string" ? new Date(input.endDate) : input.endDate;

  const [newBatch] = await db
    .insert(batches)
    .values({
      organizationId: input.organizationId,
      slug,
      name: input.name,
      description: input.description,
      class: input.class,
      exam: input.exam as any,
      imageUrl: input.imageUrl,
      startDate,
      endDate,
      language: input.language,
      totalPrice: input.totalPrice,
      discountPercentage: input.discountPercentage,
      faq: input.faq,
      updatedAt: new Date(),
    })
    .returning();

  // Invalidate batch list caches
  await CacheManager.invalidateBatch(newBatch.id, input.organizationId);

  // Calculate derived fields
  const validity = calculateValidity(newBatch.startDate, newBatch.endDate);
  const discountedPrice = calculateDiscountedPrice(
    newBatch.totalPrice,
    newBatch.discountPercentage
  );

  return {
    ...newBatch,
    validity,
    discountedPrice,
  };
}

export async function updateBatch(
  batchId: string,
  organizationId: string,
  input: UpdateBatchInput
) {
  // Check if batch exists and belongs to organization
  const existingBatch = await db.query.batches.findFirst({
    where: and(
      eq(batches.id, batchId),
      eq(batches.organizationId, organizationId)
    ),
  });

  if (!existingBatch) {
    throw new ApiError("Batch not found", HTTP_STATUS.NOT_FOUND);
  }

  const updateData: any = {
    ...input,
    updatedAt: new Date(),
  };

  // Convert string dates to Date objects if needed
  if (input.startDate) {
    updateData.startDate =
      typeof input.startDate === "string"
        ? new Date(input.startDate)
        : input.startDate;
  }
  if (input.endDate) {
    updateData.endDate =
      typeof input.endDate === "string"
        ? new Date(input.endDate)
        : input.endDate;
  }

  if (input.name && input.name !== existingBatch.name) {
    updateData.slug = generateSlug(input.name);
  }

  const [updatedBatch] = await db
    .update(batches)
    .set(updateData)
    .where(
      and(eq(batches.id, batchId), eq(batches.organizationId, organizationId))
    )
    .returning();

  // Invalidate all related caches
  await CacheManager.invalidateBatch(batchId, organizationId);

  const validity = calculateValidity(
    updatedBatch.startDate,
    updatedBatch.endDate
  );
  const discountedPrice = calculateDiscountedPrice(
    updatedBatch.totalPrice,
    updatedBatch.discountPercentage
  );

  return {
    ...updatedBatch,
    validity,
    discountedPrice,
  };
}

export async function getBatch(identifier: string, organizationId: string) {
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier
    );

  const batchData = await db.query.batches.findFirst({
    where: and(
      isUUID ? eq(batches.id, identifier) : eq(batches.slug, identifier),
      eq(batches.organizationId, organizationId)
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

  return {
    ...batchData,
    validity,
    discountedPrice,
    teachers,
  };
}

export async function getAllBatches(
  organizationId: string,
  page: number = 1,
  limit: number = 10
) {
  const offset = (page - 1) * limit;

  // Get total count (admin sees all batches)
  const allBatches = await db.query.batches.findMany({
    where: eq(batches.organizationId, organizationId),
  });
  const totalCount = allBatches.length;

  // Get paginated batches
  const batchesList = await db.query.batches.findMany({
    where: eq(batches.organizationId, organizationId),
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

  // Get enrollment counts for each batch
  const enrollmentCounts = await db.query.userBatchMapping.findMany({
    where: eq(userBatchMapping.organizationId, organizationId),
    columns: {
      batchId: true,
    },
  });

  const enrollmentCountByBatchId: Record<string, number> = {};
  enrollmentCounts.forEach((enrollment) => {
    enrollmentCountByBatchId[enrollment.batchId] =
      (enrollmentCountByBatchId[enrollment.batchId] || 0) + 1;
  });

  const data = batchesList.map((b) => {
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
      enrollmentCount: enrollmentCountByBatchId[b.id] || 0,
    };
  });

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

export async function deleteBatch(batchId: string, organizationId: string) {
  const result = await db
    .delete(batches)
    .where(
      and(eq(batches.id, batchId), eq(batches.organizationId, organizationId))
    )
    .returning();

  if (result.length === 0) {
    throw new ApiError("Batch not found", HTTP_STATUS.NOT_FOUND);
  }

  // Invalidate all related caches
  await CacheManager.invalidateBatch(batchId, organizationId);

  return { message: "Batch deleted successfully" };
}

export async function getBatchStats(batchId: string, organizationId: string) {
  const batch = await db.query.batches.findFirst({
    where: and(
      eq(batches.id, batchId),
      eq(batches.organizationId, organizationId)
    ),
  });

  if (!batch) {
    throw new ApiError("Batch not found", HTTP_STATUS.NOT_FOUND);
  }

  // Get enrollment stats
  const enrollments = await db.query.userBatchMapping.findMany({
    where: and(
      eq(userBatchMapping.batchId, batchId),
      eq(userBatchMapping.organizationId, organizationId)
    ),
  });

  const totalEnrollments = enrollments.length;
  const activeEnrollments = enrollments.filter((e) => e.isActive).length;
  const totalRevenue = enrollments.reduce((sum, e) => sum + e.finalPrice, 0);

  return {
    batchId,
    batchName: batch.name,
    enrollments: {
      total: totalEnrollments,
      active: activeEnrollments,
    },
    revenue: {
      total: totalRevenue,
      average: totalEnrollments > 0 ? totalRevenue / totalEnrollments : 0,
    },
  };
}
