import { db } from "../../db";
import { chapters, subjects, userBatchMapping } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { ApiError } from "../../common/response";
import { HTTP_STATUS } from "../../common/constants";

/**
 * Get all chapters for a subject (Client - only for purchased batches)
 */
export const getChaptersBySubjectId = async (
  subjectId: string,
  userId: string,
  organizationId: string
) => {
  // Verify subject exists and get its batch
  const subject = await db.query.subjects.findFirst({
    where: eq(subjects.id, subjectId),
    with: {
      batch: true,
    },
  });

  if (!subject) {
    throw new ApiError("Subject not found", HTTP_STATUS.NOT_FOUND);
  }

  // Verify batch belongs to organization and is ACTIVE
  if (
    (subject.batch as any).organizationId !== organizationId ||
    (subject.batch as any).status !== "ACTIVE"
  ) {
    throw new ApiError("Subject not found", HTTP_STATUS.NOT_FOUND);
  }

  // Get all chapters for this subject
  const chaptersList = await db.query.chapters.findMany({
    where: eq(chapters.subjectId, subjectId),
    orderBy: (chapters, { asc }) => [asc(chapters.createdAt)],
  });

  return chaptersList;
};

/**
 * Get a single chapter by ID (Client - only if batch is purchased)
 */
export const getChapterById = async (
  chapterId: string,
  userId: string,
  organizationId: string
) => {
  const chapter = await db.query.chapters.findFirst({
    where: eq(chapters.id, chapterId),
    with: {
      subject: {
        with: {
          batch: true,
        },
      },
    },
  });

  if (!chapter) {
    throw new ApiError("Chapter not found", HTTP_STATUS.NOT_FOUND);
  }

  // Verify chapter belongs to organization via batch and is ACTIVE
  if (
    (chapter.subject as any).batch.organizationId !== organizationId ||
    (chapter.subject as any).batch.status !== "ACTIVE"
  ) {
    throw new ApiError("Chapter not found", HTTP_STATUS.NOT_FOUND);
  }

  return chapter;
};
