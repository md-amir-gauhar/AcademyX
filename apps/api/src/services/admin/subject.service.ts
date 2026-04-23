import { db } from "../../db";
import { subjects, batches, teacherSubjectMapping } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { ApiError } from "../../common/response";
import { HTTP_STATUS } from "../../common/constants";
import { CacheManager } from "../cache.service";

interface CreateSubjectInput {
  name: string;
  batchId: string;
  organizationId: string;
  thumbnailUrl?: string;
}

interface UpdateSubjectInput {
  name?: string;
  thumbnailUrl?: string;
}

/**
 * Create a new subject (Admin)
 */
export const createSubject = async (input: CreateSubjectInput) => {
  // Verify batch exists and belongs to organization
  const batch = await db.query.batches.findFirst({
    where: and(
      eq(batches.id, input.batchId),
      eq(batches.organizationId, input.organizationId)
    ),
  });

  if (!batch) {
    throw new ApiError("Batch not found", HTTP_STATUS.NOT_FOUND);
  }

  // Create subject
  const [newSubject] = await db
    .insert(subjects)
    .values({
      name: input.name,
      batchId: input.batchId,
      thumbnailUrl: input.thumbnailUrl,
      updatedAt: new Date(),
    })
    .returning();

  // Invalidate subject list cache for this batch
  await CacheManager.invalidateSubject(newSubject.id, input.batchId);

  return newSubject;
};

/**
 * Get all subjects for a batch (Admin)
 */
export const getSubjectsByBatchId = async (
  batchId: string,
  organizationId: string
) => {
  // Verify batch exists and belongs to organization
  const batch = await db.query.batches.findFirst({
    where: and(
      eq(batches.id, batchId),
      eq(batches.organizationId, organizationId)
    ),
  });

  if (!batch) {
    throw new ApiError("Batch not found", HTTP_STATUS.NOT_FOUND);
  }

  // Get all subjects for this batch with teachers
  const subjectsList = await db.query.subjects.findMany({
    where: eq(subjects.batchId, batchId),
    with: {
      teacherMappings: {
        with: {
          teacher: true,
        },
      },
    },
    orderBy: (subjects, { asc }) => [asc(subjects.createdAt)],
  });

  // Format response to include teachers array
  return subjectsList.map((subject: any) => ({
    ...subject,
    teachers: subject.teacherMappings?.map((m: any) => m.teacher) || [],
    teacherMappings: undefined,
  }));
};

/**
 * Get a single subject by ID (Admin)
 */
export const getSubjectById = async (
  subjectId: string,
  organizationId: string
) => {
  const subject = await db.query.subjects.findFirst({
    where: eq(subjects.id, subjectId),
    with: {
      batch: true,
      teacherMappings: {
        with: {
          teacher: true,
        },
      },
    },
  });

  if (!subject) {
    throw new ApiError("Subject not found", HTTP_STATUS.NOT_FOUND);
  }

  // Verify subject belongs to organization via batch
  if ((subject.batch as any).organizationId !== organizationId) {
    throw new ApiError("Subject not found", HTTP_STATUS.NOT_FOUND);
  }

  return {
    ...subject,
    teachers:
      (subject.teacherMappings as any)?.map((m: any) => m.teacher) || [],
    teacherMappings: undefined,
  };
};

/**
 * Update a subject (Admin)
 */
export const updateSubject = async (
  subjectId: string,
  organizationId: string,
  input: UpdateSubjectInput
) => {
  // Verify subject exists and belongs to organization
  const subject = await db.query.subjects.findFirst({
    where: eq(subjects.id, subjectId),
    with: {
      batch: true,
    },
  });

  if (!subject) {
    throw new ApiError("Subject not found", HTTP_STATUS.NOT_FOUND);
  }

  if ((subject.batch as any).organizationId !== organizationId) {
    throw new ApiError("Subject not found", HTTP_STATUS.NOT_FOUND);
  }

  // Update subject
  const [updatedSubject] = await db
    .update(subjects)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(subjects.id, subjectId))
    .returning();

  // Invalidate subject caches
  await CacheManager.invalidateSubject(subjectId, subject.batchId);

  return updatedSubject;
};

/**
 * Delete a subject (Admin)
 */
export const deleteSubject = async (
  subjectId: string,
  organizationId: string
) => {
  // Verify subject exists and belongs to organization
  const subject = await db.query.subjects.findFirst({
    where: eq(subjects.id, subjectId),
    with: {
      batch: true,
    },
  });

  if (!subject) {
    throw new ApiError("Subject not found", HTTP_STATUS.NOT_FOUND);
  }

  if ((subject.batch as any).organizationId !== organizationId) {
    throw new ApiError("Subject not found", HTTP_STATUS.NOT_FOUND);
  }

  // Delete subject (cascade will remove teacher mappings and chapters)
  await db.delete(subjects).where(eq(subjects.id, subjectId));

  // Invalidate subject caches
  await CacheManager.invalidateSubject(subjectId, subject.batchId);

  return { message: "Subject deleted successfully" };
};
