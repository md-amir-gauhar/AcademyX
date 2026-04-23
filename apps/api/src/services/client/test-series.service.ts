import { db } from "../../db";
import {
  testSeries,
  tests,
  userTestSeriesMapping,
  testAttempts,
} from "../../db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { calculateDiscountedPrice } from "../shared/test-series-helpers";

/**
 * Get test series by ID or slug (Client - ACTIVE only)
 */
export async function getTestSeries(
  identifier: string,
  userId: string,
  organizationId: string
) {
  // Check if identifier is UUID or slug
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier
    );

  // Client can only see ACTIVE test series
  const series = await db.query.testSeries.findFirst({
    where: and(
      isUUID ? eq(testSeries.id, identifier) : eq(testSeries.slug, identifier),
      eq(testSeries.organizationId, organizationId),
      eq(testSeries.status, "ACTIVE")
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

  // Check if user has enrolled
  const enrollment = await db.query.userTestSeriesMapping.findFirst({
    where: and(
      eq(userTestSeriesMapping.userId, userId),
      eq(userTestSeriesMapping.testSeriesId, series.id),
      eq(userTestSeriesMapping.organizationId, organizationId)
    ),
  });

  let isEnrolled = false;
  let enrollmentDetails = null;

  if (enrollment) {
    isEnrolled = true;
    enrollmentDetails = {
      enrolledAt: enrollment.enrolledAt,
      startDate: enrollment.startDate,
      endDate: enrollment.endDate,
      isActive: enrollment.isActive,
    };
  }

  return {
    ...series,
    discountedPrice,
    isEnrolled,
    enrollmentDetails,
  };
}

/**
 * Get all test series with pagination (Client - ACTIVE only)
 */
export async function getAllTestSeries(
  organizationId: string,
  userId: string,
  page: number = 1,
  limit: number = 10
) {
  const offset = (page - 1) * limit;

  // Get all ACTIVE test series
  const allSeries = await db.query.testSeries.findMany({
    where: and(
      eq(testSeries.organizationId, organizationId),
      eq(testSeries.status, "ACTIVE")
    ),
    orderBy: [desc(testSeries.createdAt)],
  });

  const totalCount = allSeries.length;
  const totalPages = Math.ceil(totalCount / limit);

  // Get paginated test series
  const paginatedSeries = allSeries.slice(offset, offset + limit);

  // Calculate discounted prices
  const seriesWithPricing = paginatedSeries.map((series) => {
    const discountedPrice = calculateDiscountedPrice(
      series.totalPrice,
      series.discountPercentage
    );
    return {
      ...series,
      discountedPrice,
    };
  });

  // Check enrollment status
  const seriesIds = paginatedSeries.map((s) => s.id);
  const enrollments = await db.query.userTestSeriesMapping.findMany({
    where: and(
      eq(userTestSeriesMapping.userId, userId),
      inArray(userTestSeriesMapping.testSeriesId, seriesIds),
      eq(userTestSeriesMapping.organizationId, organizationId)
    ),
  });

  const enrollmentMap = new Map(enrollments.map((e) => [e.testSeriesId, e]));

  // Filter out purchased test series - only return unpurchased ones
  const unpurchasedSeries = seriesWithPricing.filter(
    (series) => !enrollmentMap.has(series.id)
  );

  return {
    data: unpurchasedSeries.map((series) => ({
      ...series,
      isPurchased: false, // All are unpurchased
    })),
    pagination: {
      page,
      limit,
      totalCount: unpurchasedSeries.length,
      totalPages: Math.ceil(unpurchasedSeries.length / limit),
      hasNextPage: page < Math.ceil(unpurchasedSeries.length / limit),
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Get enrolled test series for a user (Client)
 */
export async function getEnrolledTestSeries(
  organizationId: string,
  userId: string,
  page: number = 1,
  limit: number = 10
) {
  const offset = (page - 1) * limit;

  // Get all enrollments
  const allEnrollments = await db.query.userTestSeriesMapping.findMany({
    where: and(
      eq(userTestSeriesMapping.userId, userId),
      eq(userTestSeriesMapping.organizationId, organizationId)
    ),
    orderBy: [desc(userTestSeriesMapping.enrolledAt)],
  });

  const totalCount = allEnrollments.length;

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

  // Get paginated enrollments
  const paginatedEnrollments = allEnrollments.slice(offset, offset + limit);
  const seriesIds = paginatedEnrollments.map((e) => e.testSeriesId);

  // Fetch test series details
  const seriesData = await db.query.testSeries.findMany({
    where: inArray(testSeries.id, seriesIds),
  });

  const seriesMap = new Map(seriesData.map((s) => [s.id, s]));

  // Combine data
  const result = paginatedEnrollments
    .map((enrollment) => {
      const series = seriesMap.get(enrollment.testSeriesId);
      if (!series) return null;

      const discountedPrice = calculateDiscountedPrice(
        series.totalPrice,
        series.discountPercentage
      );

      return {
        ...series,
        discountedPrice,
        isPurchased: true,
        enrollmentDetails: {
          enrolledAt: enrollment.enrolledAt,
          startDate: enrollment.startDate,
          endDate: enrollment.endDate,
          isActive: enrollment.isActive,
        },
      };
    })
    .filter(Boolean);

  return {
    data: result,
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

/**
 * Get tests in a test series (Client)
 */
export async function getTestsInSeries(
  seriesId: string,
  organizationId: string,
  userId: string
) {
  // Verify series exists and is ACTIVE
  const series = await db.query.testSeries.findFirst({
    where: and(
      eq(testSeries.id, seriesId),
      eq(testSeries.organizationId, organizationId),
      eq(testSeries.status, "ACTIVE")
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

  // Get attempt counts for each test
  const testIds = allTests.map((t) => t.id);
  const attempts = await db.query.testAttempts.findMany({
    where: and(
      eq(testAttempts.userId, userId),
      inArray(testAttempts.testId, testIds)
    ),
  });

  const attemptMap = new Map<string, number>();
  attempts.forEach((attempt) => {
    attemptMap.set(attempt.testId, (attemptMap.get(attempt.testId) || 0) + 1);
  });

  return allTests.map((test) => ({
    ...test,
    attemptCount: attemptMap.get(test.id) || 0,
    hasAttempted: attemptMap.has(test.id),
  }));
}
