import { db } from "../../db";
import {
  testSeries,
  tests,
  userTestSeriesMapping,
  testAttempts,
} from "../../db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { CacheManager } from "../cache.service";
import {
  CreateTestSeriesParams,
  UpdateTestSeriesParams,
  calculateDiscountedPrice,
} from "../shared/test-series-helpers";
import { generateSlug } from "../shared/slug";

/**
 * Create a new test series (Admin)
 */
export async function createTestSeries(data: CreateTestSeriesParams) {
  const slug = data.slug?.trim() || generateSlug(data.title);
  const [series] = await db
    .insert(testSeries)
    .values({
      organizationId: data.organizationId,
      exam: data.exam,
      title: data.title,
      description: data.description,
      slug,
      imageUrl: data.imageUrl,
      faq: data.faq,
      totalPrice: data.totalPrice,
      discountPercentage: data.discountPercentage || 0,
      isFree: data.isFree || false,
      durationDays: data.durationDays || 365,
      status: "ACTIVE",
    })
    .returning();

  // Invalidate test series list cache
  await CacheManager.invalidateTestSeries(undefined, data.organizationId);

  return series;
}

/**
 * Get test series by ID or slug (Admin)
 */
export async function getTestSeries(
  identifier: string,
  organizationId: string
) {
  // Check if identifier is UUID or slug
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier
    );

  const series = await db.query.testSeries.findFirst({
    where: and(
      isUUID ? eq(testSeries.id, identifier) : eq(testSeries.slug, identifier),
      eq(testSeries.organizationId, organizationId)
    ),
  });

  if (!series) {
    throw new Error("Test series not found");
  }

  // Calculate discounted price
  const discountedPrice = calculateDiscountedPrice(
    series.totalPrice,
    series.discountPercentage
  );

  return {
    ...series,
    discountedPrice,
  };
}

/**
 * Get all test series with pagination (Admin)
 */
export async function getAllTestSeries(
  organizationId: string,
  page: number = 1,
  limit: number = 10
) {
  const offset = (page - 1) * limit;

  // Get all test series (admin sees all)
  const allSeries = await db.query.testSeries.findMany({
    where: eq(testSeries.organizationId, organizationId),
    orderBy: [desc(testSeries.createdAt)],
  });

  const totalCount = allSeries.length;
  const totalPages = Math.ceil(totalCount / limit);

  // Get paginated test series
  const paginatedSeries = allSeries.slice(offset, offset + limit);

  // Calculate discounted prices and get enrollment counts
  const seriesIds = paginatedSeries.map((s) => s.id);
  const enrollments = await db.query.userTestSeriesMapping.findMany({
    where: inArray(userTestSeriesMapping.testSeriesId, seriesIds),
    columns: {
      testSeriesId: true,
    },
  });

  const enrollmentCountMap = new Map<string, number>();
  enrollments.forEach((e) => {
    enrollmentCountMap.set(
      e.testSeriesId,
      (enrollmentCountMap.get(e.testSeriesId) || 0) + 1
    );
  });

  const seriesWithPricing = paginatedSeries.map((series) => {
    const discountedPrice = calculateDiscountedPrice(
      series.totalPrice,
      series.discountPercentage
    );
    return {
      ...series,
      discountedPrice,
      enrollmentCount: enrollmentCountMap.get(series.id) || 0,
    };
  });

  return {
    data: seriesWithPricing,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Update test series (Admin)
 *
 * If the title changes and no explicit slug was provided, the slug is
 * regenerated from the new title to keep them aligned (mirrors the batch
 * service behavior).
 */
export async function updateTestSeries(
  id: string,
  organizationId: string,
  data: UpdateTestSeriesParams
) {
  const existing = await db.query.testSeries.findFirst({
    where: and(
      eq(testSeries.id, id),
      eq(testSeries.organizationId, organizationId)
    ),
  });

  if (!existing) {
    throw new Error("Test series not found");
  }

  const updateData: UpdateTestSeriesParams & { updatedAt: Date } = {
    ...data,
    updatedAt: new Date(),
  };

  if (data.title && data.title !== existing.title && !data.slug) {
    updateData.slug = generateSlug(data.title);
  }

  const [updated] = await db
    .update(testSeries)
    .set(updateData)
    .where(
      and(eq(testSeries.id, id), eq(testSeries.organizationId, organizationId))
    )
    .returning();

  // Invalidate cache
  await CacheManager.invalidateTestSeries(id, organizationId);

  return updated;
}

/**
 * Delete test series (Admin)
 */
export async function deleteTestSeries(id: string, organizationId: string) {
  const deleted = await db
    .delete(testSeries)
    .where(
      and(eq(testSeries.id, id), eq(testSeries.organizationId, organizationId))
    )
    .returning();

  if (!deleted.length) {
    throw new Error("Test series not found");
  }

  // Invalidate cache
  await CacheManager.invalidateTestSeries(id, organizationId);

  return { success: true };
}

/**
 * Get tests in a test series (Admin)
 */
export async function getTestsInSeries(
  seriesId: string,
  organizationId: string
) {
  // Verify series exists and belongs to organization
  const series = await db.query.testSeries.findFirst({
    where: and(
      eq(testSeries.id, seriesId),
      eq(testSeries.organizationId, organizationId)
    ),
  });

  if (!series) {
    throw new Error("Test series not found");
  }

  // Get all tests in series
  const allTests = await db.query.tests.findMany({
    where: eq(tests.testSeriesId, seriesId),
    orderBy: [desc(tests.createdAt)],
  });

  return allTests;
}

/**
 * Get test series statistics (Admin)
 */
export async function getTestSeriesStats(
  seriesId: string,
  organizationId: string
) {
  const series = await db.query.testSeries.findFirst({
    where: and(
      eq(testSeries.id, seriesId),
      eq(testSeries.organizationId, organizationId)
    ),
  });

  if (!series) {
    throw new Error("Test series not found");
  }

  // Get enrollment count
  const enrollments = await db.query.userTestSeriesMapping.findMany({
    where: eq(userTestSeriesMapping.testSeriesId, seriesId),
  });

  const totalEnrollments = enrollments.length;
  const activeEnrollments = enrollments.filter((e) => e.isActive).length;
  const freeEnrollments = enrollments.filter((e) => e.finalPrice === 0).length;
  const paidEnrollments = enrollments.filter((e) => e.finalPrice > 0).length;

  // Calculate revenue
  const totalRevenue = enrollments.reduce((sum, e) => sum + e.finalPrice, 0);

  // Get test count
  const allTests = await db.query.tests.findMany({
    where: eq(tests.testSeriesId, seriesId),
  });

  const totalTests = allTests.length;
  const publishedTests = allTests.filter((t) => t.isPublished).length;

  // Get total attempts across all tests
  const testIds = allTests.map((t) => t.id);
  const attempts = await db.query.testAttempts.findMany({
    where: inArray(testAttempts.testId, testIds),
  });

  const totalAttempts = attempts.length;
  const completedAttempts = attempts.filter((a) => a.isCompleted).length;

  return {
    seriesId,
    seriesTitle: series.title,
    enrollments: {
      total: totalEnrollments,
      active: activeEnrollments,
      free: freeEnrollments,
      paid: paidEnrollments,
    },
    revenue: {
      total: totalRevenue,
      average: totalEnrollments > 0 ? totalRevenue / totalEnrollments : 0,
    },
    tests: {
      total: totalTests,
      published: publishedTests,
    },
    attempts: {
      total: totalAttempts,
      completed: completedAttempts,
      averagePerTest: totalTests > 0 ? totalAttempts / totalTests : 0,
    },
  };
}
