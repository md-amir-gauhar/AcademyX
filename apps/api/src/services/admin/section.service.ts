import { db } from "../../db";
import { testSections, tests } from "../../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { recalculateTestCounts } from "./test.service";
import { CacheManager } from "../cache.service";

interface CreateSectionParams {
  testId: string;
  organizationId: string;
  name: string;
  description?: string;
  displayOrder?: number;
}

interface UpdateSectionParams {
  name?: string;
  description?: string;
  displayOrder?: number;
}

/**
 * Create a new section in a test
 */
export async function createSection(data: CreateSectionParams) {
  // Verify test exists
  const test = await db.query.tests.findFirst({
    where: and(
      eq(tests.id, data.testId),
      eq(tests.organizationId, data.organizationId)
    ),
  });

  if (!test) {
    throw new Error("Test not found");
  }

  // Get next display order
  const lastSection = await db.query.testSections.findFirst({
    where: eq(testSections.testId, data.testId),
    orderBy: [sql`${testSections.displayOrder} DESC`],
  });

  const displayOrder =
    data.displayOrder ?? (lastSection?.displayOrder ?? 0) + 1;

  const [section] = await db
    .insert(testSections)
    .values({
      testId: data.testId,
      name: data.name,
      description: data.description,
      displayOrder,
      questionCount: 0,
      totalMarks: 0,
    })
    .returning();

  // Update test section count
  await recalculateTestCounts(data.testId);

  // Invalidate caches
  await CacheManager.invalidateSection(undefined, data.testId);
  await CacheManager.invalidateTest(data.testId);

  return section;
}

/**
 * Get section by ID
 */
export async function getSection(id: string, organizationId: string) {
  const section = await db.query.testSections.findFirst({
    where: eq(testSections.id, id),
    with: {
      test: true,
      questions: {
        orderBy: [sql`display_order ASC`],
        with: {
          options: {
            orderBy: [sql`display_order ASC`],
          },
        },
      },
    },
  });

  if (!section) {
    throw new Error("Section not found");
  }

  // Verify organization through test
  if (section.test.organizationId !== organizationId) {
    throw new Error("Section not found");
  }

  return section;
}

/**
 * Get all sections in a test
 */
export async function getSectionsInTest(
  testId: string,
  organizationId: string
) {
  // Verify test belongs to organization
  const test = await db.query.tests.findFirst({
    where: and(eq(tests.id, testId), eq(tests.organizationId, organizationId)),
  });

  if (!test) {
    throw new Error("Test not found");
  }

  const sections = await db.query.testSections.findMany({
    where: eq(testSections.testId, testId),
    orderBy: [testSections.displayOrder],
  });

  return sections;
}

/**
 * Update section
 */
export async function updateSection(
  id: string,
  organizationId: string,
  data: UpdateSectionParams
) {
  // Get section and verify organization
  const section = await db.query.testSections.findFirst({
    where: eq(testSections.id, id),
    with: {
      test: true,
    },
  });

  if (!section || section.test.organizationId !== organizationId) {
    throw new Error("Section not found");
  }

  const [updated] = await db
    .update(testSections)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(testSections.id, id))
    .returning();

  if (!updated) {
    throw new Error("Section not found");
  }

  // Invalidate caches
  await CacheManager.invalidateSection(id, section.testId);
  await CacheManager.invalidateTest(section.testId);

  return updated;
}

/**
 * Delete section
 */
export async function deleteSection(id: string, organizationId: string) {
  // Get section to verify organization
  const section = await db.query.testSections.findFirst({
    where: eq(testSections.id, id),
    with: {
      test: true,
    },
  });

  if (!section || section.test.organizationId !== organizationId) {
    throw new Error("Section not found");
  }

  const testId = section.testId;

  // Delete section (cascade will handle questions)
  await db.delete(testSections).where(eq(testSections.id, id));

  // Recalculate test counts
  await recalculateTestCounts(testId);

  // Invalidate caches
  await CacheManager.invalidateSection(id, testId);
  await CacheManager.invalidateTest(testId);

  return { success: true };
}

/**
 * Reorder sections
 */
export async function reorderSections(
  testId: string,
  organizationId: string,
  sectionOrders: { id: string; displayOrder: number }[]
) {
  // Verify test exists
  const test = await db.query.tests.findFirst({
    where: and(eq(tests.id, testId), eq(tests.organizationId, organizationId)),
  });

  if (!test) {
    throw new Error("Test not found");
  }

  // Update each section's display order
  for (const { id, displayOrder } of sectionOrders) {
    await db
      .update(testSections)
      .set({
        displayOrder,
        updatedAt: new Date(),
      })
      .where(and(eq(testSections.id, id), eq(testSections.testId, testId)));
  }

  // Invalidate caches
  await CacheManager.invalidateSection(undefined, testId);
  await CacheManager.invalidateTest(testId);

  return { success: true };
}
