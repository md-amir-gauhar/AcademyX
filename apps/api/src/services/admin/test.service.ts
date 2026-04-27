import { db } from "../../db";
import {
  tests,
  testSeries,
  testSections,
  testQuestions,
  testQuestionOptions,
} from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { CacheManager } from "../cache.service";
import { generateSlug } from "../shared/slug";

interface CreateTestParams {
  testSeriesId: string;
  organizationId: string;
  title: string;
  description?: any;
  /** Optional. Auto-generated from title when omitted. */
  slug?: string;
  instructions?: any;
  durationMinutes: number;
  totalMarks: number;
  passingMarks?: number;
  isFree?: boolean;
  showAnswersAfterSubmit?: boolean;
  allowReview?: boolean;
  shuffleQuestions?: boolean;
}

interface UpdateTestParams {
  title?: string;
  description?: any;
  slug?: string;
  instructions?: any;
  durationMinutes?: number;
  totalMarks?: number;
  passingMarks?: number;
  isFree?: boolean;
  showAnswersAfterSubmit?: boolean;
  allowReview?: boolean;
  shuffleQuestions?: boolean;
  isPublished?: boolean;
}

/**
 * Create a new test in a test series
 */
export async function createTest(data: CreateTestParams) {
  // Verify test series exists
  const series = await db.query.testSeries.findFirst({
    where: and(
      eq(testSeries.id, data.testSeriesId),
      eq(testSeries.organizationId, data.organizationId)
    ),
  });

  if (!series) {
    throw new Error("Test series not found");
  }

  const slug = data.slug?.trim() || generateSlug(data.title);
  const [test] = await db
    .insert(tests)
    .values({
      testSeriesId: data.testSeriesId,
      organizationId: data.organizationId,
      title: data.title,
      description: data.description,
      slug,
      instructions: data.instructions,
      durationMinutes: data.durationMinutes,
      totalMarks: data.totalMarks,
      passingMarks: data.passingMarks || Math.floor(data.totalMarks * 0.4),
      isFree: data.isFree || false,
      showAnswersAfterSubmit: data.showAnswersAfterSubmit ?? true,
      allowReview: data.allowReview ?? true,
      shuffleQuestions: data.shuffleQuestions ?? false,
      isPublished: false,
    })
    .returning();

  // Update test series test count
  await db
    .update(testSeries)
    .set({
      testCount: series.testCount + 1,
      updatedAt: new Date(),
    })
    .where(eq(testSeries.id, data.testSeriesId));

  await CacheManager.invalidateTest(
    undefined,
    data.testSeriesId,
    data.organizationId
  );
  await CacheManager.invalidateTestSeries(
    data.testSeriesId,
    data.organizationId
  );

  return test;
}

/**
 * Get test by ID or slug
 */
export async function getTest(identifier: string, organizationId: string) {
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier
    );

  const test = await db.query.tests.findFirst({
    where: and(
      isUUID ? eq(tests.id, identifier) : eq(tests.slug, identifier),
      eq(tests.organizationId, organizationId)
    ),
    with: {
      testSeries: true,
    },
  });

  if (!test) {
    throw new Error("Test not found");
  }

  return test;
}

/**
 * Update test
 *
 * Regenerates the slug from the new title when the title changes and the
 * caller did not pass an explicit slug.
 */
export async function updateTest(
  id: string,
  organizationId: string,
  data: UpdateTestParams
) {
  const existing = await db.query.tests.findFirst({
    where: and(eq(tests.id, id), eq(tests.organizationId, organizationId)),
  });

  if (!existing) {
    throw new Error("Test not found");
  }

  const updateData: UpdateTestParams & { updatedAt: Date } = {
    ...data,
    updatedAt: new Date(),
  };

  if (data.title && data.title !== existing.title && !data.slug) {
    updateData.slug = generateSlug(data.title);
  }

  const [updated] = await db
    .update(tests)
    .set(updateData)
    .where(and(eq(tests.id, id), eq(tests.organizationId, organizationId)))
    .returning();

  // Invalidate caches
  await CacheManager.invalidateTest(id, updated.testSeriesId, organizationId);

  return updated;
}

export async function deleteTest(id: string, organizationId: string) {
  const test = await db.query.tests.findFirst({
    where: and(eq(tests.id, id), eq(tests.organizationId, organizationId)),
  });

  if (!test) {
    throw new Error("Test not found");
  }

  await db
    .delete(tests)
    .where(and(eq(tests.id, id), eq(tests.organizationId, organizationId)));

  // Update test series count
  const series = await db.query.testSeries.findFirst({
    where: eq(testSeries.id, test.testSeriesId),
  });

  if (series) {
    await db
      .update(testSeries)
      .set({
        testCount: Math.max(0, series.testCount - 1),
        updatedAt: new Date(),
      })
      .where(eq(testSeries.id, test.testSeriesId));
  }

  // Invalidate caches
  await CacheManager.invalidateTest(id, test.testSeriesId, organizationId);
  await CacheManager.invalidateTestSeries(test.testSeriesId, organizationId);

  return { success: true };
}

export async function publishTest(id: string, organizationId: string) {
  const test = await db.query.tests.findFirst({
    where: and(eq(tests.id, id), eq(tests.organizationId, organizationId)),
  });

  if (!test) {
    throw new Error("Test not found");
  }

  if (test.sectionCount === 0 || test.questionCount === 0) {
    throw new Error(
      "Cannot publish test without sections and questions. Please add at least one section with questions."
    );
  }

  const [published] = await db
    .update(tests)
    .set({
      isPublished: true,
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(tests.id, id), eq(tests.organizationId, organizationId)))
    .returning();

  // Invalidate caches
  await CacheManager.invalidateTest(id, test.testSeriesId, organizationId);

  return published;
}

export async function getTestWithDetails(
  testId: string,
  organizationId: string
) {
  const test = await db.query.tests.findFirst({
    where: and(eq(tests.id, testId), eq(tests.organizationId, organizationId)),
    with: {
      testSeries: true,
      sections: {
        orderBy: [testSections.displayOrder],
        with: {
          questions: {
            orderBy: [testQuestions.displayOrder],
            with: {
              options: {
                orderBy: [testQuestionOptions.displayOrder],
              },
            },
          },
        },
      },
    },
  });

  if (!test) {
    throw new Error("Test not found");
  }

  return test;
}

export async function recalculateTestCounts(testId: string) {
  const sections = await db.query.testSections.findMany({
    where: eq(testSections.testId, testId),
    with: {
      questions: true,
    },
  });

  const sectionCount = sections.length;
  let totalQuestions = 0;
  let totalMarks = 0;

  for (const section of sections) {
    const questionCount = section.questions.length;
    const sectionMarks = section.questions.reduce(
      (sum, q) => sum + (q.marks || 0),
      0
    );

    await db
      .update(testSections)
      .set({
        questionCount,
        totalMarks: sectionMarks,
      })
      .where(eq(testSections.id, section.id));

    totalQuestions += questionCount;
    totalMarks += sectionMarks;
  }

  await db
    .update(tests)
    .set({
      sectionCount,
      questionCount: totalQuestions,
      totalMarks,
      updatedAt: new Date(),
    })
    .where(eq(tests.id, testId));

  const test = await db.query.tests.findFirst({
    where: eq(tests.id, testId),
  });

  if (test) {
    const allTests = await db.query.tests.findMany({
      where: eq(tests.testSeriesId, test.testSeriesId),
    });

    const totalSeriesQuestions = allTests.reduce(
      (sum, t) => sum + (t.questionCount || 0),
      0
    );

    await db
      .update(testSeries)
      .set({
        totalQuestions: totalSeriesQuestions,
        updatedAt: new Date(),
      })
      .where(eq(testSeries.id, test.testSeriesId));
  }

  return { sectionCount, questionCount: totalQuestions, totalMarks };
}
