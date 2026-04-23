import { db } from "../../db";
import { subjects, batches, userBatchMapping } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { ApiError } from "../../common/response";
import { HTTP_STATUS } from "../../common/constants";

/**
 * Get all subjects for a batch (Client - only for purchased batches)
 */
export const getSubjectsByBatchId = async (
  batchId: string,
  userId: string,
  organizationId: string
) => {
  // Verify batch exists, belongs to organization, and is ACTIVE
  const batch = await db.query.batches.findFirst({
    where: and(
      eq(batches.id, batchId),
      eq(batches.organizationId, organizationId),
      eq(batches.status, "ACTIVE")
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
 * Get a single subject by ID (Client - only if batch is purchased)
 */
export const getSubjectById = async (
  subjectId: string,
  userId: string,
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

  // Verify batch is ACTIVE
  if ((subject.batch as any).status !== "ACTIVE") {
    throw new ApiError("Subject not found", HTTP_STATUS.NOT_FOUND);
  }

  return {
    ...subject,
    teachers:
      (subject.teacherMappings as any)?.map((m: any) => m.teacher) || [],
    teacherMappings: undefined,
  };
};
