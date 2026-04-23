import { db } from "../../db";
import { chapters, subjects, batches } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { ApiError } from "../../common/response";
import { HTTP_STATUS } from "../../common/constants";
import { CacheManager } from "../cache.service";

interface CreateChapterInput {
  name: string;
  subjectId: string;
  organizationId: string;
  lectureCount?: number;
  lectureDuration?: string;
}

interface UpdateChapterInput {
  name?: string;
  lectureCount?: number;
  lectureDuration?: string;
}

/**
 * Create a new chapter
 */
export const createChapter = async (input: CreateChapterInput) => {
  // Verify subject exists and belongs to organization
  const subject = await db.query.subjects.findFirst({
    where: eq(subjects.id, input.subjectId),
    with: {
      batch: true,
    },
  });

  if (!subject) {
    throw new ApiError("Subject not found", HTTP_STATUS.NOT_FOUND);
  }

  if ((subject.batch as any).organizationId !== input.organizationId) {
    throw new ApiError("Subject not found", HTTP_STATUS.NOT_FOUND);
  }

  // Create chapter
  const [newChapter] = await db
    .insert(chapters)
    .values({
      name: input.name,
      subjectId: input.subjectId,
      lectureCount: input.lectureCount ?? 0,
      lectureDuration: input.lectureDuration,
      updatedAt: new Date(),
    })
    .returning();

  // Invalidate chapter list cache for this subject
  await CacheManager.invalidateChapter(newChapter.id, input.subjectId);

  return newChapter;
};

/**
 * Get all chapters for a subject
 */
export const getChaptersBySubjectId = async (
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

  // Get all chapters for this subject
  const chaptersList = await db.query.chapters.findMany({
    where: eq(chapters.subjectId, subjectId),
    orderBy: (chapters, { asc }) => [asc(chapters.createdAt)],
  });

  return chaptersList;
};

/**
 * Get a single chapter by ID
 */
export const getChapterById = async (
  chapterId: string,
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

  // Verify chapter belongs to organization via subject -> batch
  if ((chapter.subject as any).batch.organizationId !== organizationId) {
    throw new ApiError("Chapter not found", HTTP_STATUS.NOT_FOUND);
  }

  return chapter;
};

/**
 * Update a chapter
 */
export const updateChapter = async (
  chapterId: string,
  organizationId: string,
  input: UpdateChapterInput
) => {
  // Verify chapter exists and belongs to organization
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

  if ((chapter.subject as any).batch.organizationId !== organizationId) {
    throw new ApiError("Chapter not found", HTTP_STATUS.NOT_FOUND);
  }

  // Update chapter
  const [updatedChapter] = await db
    .update(chapters)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(chapters.id, chapterId))
    .returning();

  // Invalidate chapter caches
  await CacheManager.invalidateChapter(chapterId, (chapter.subject as any).id);

  return updatedChapter;
};

/**
 * Delete a chapter
 */
export const deleteChapter = async (
  chapterId: string,
  organizationId: string
) => {
  // Verify chapter exists and belongs to organization
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

  if ((chapter.subject as any).batch.organizationId !== organizationId) {
    throw new ApiError("Chapter not found", HTTP_STATUS.NOT_FOUND);
  }

  // Delete chapter (cascade will remove topics and contents)
  await db.delete(chapters).where(eq(chapters.id, chapterId));

  // Invalidate chapter caches
  await CacheManager.invalidateChapter(chapterId, (chapter.subject as any).id);

  return { message: "Chapter deleted successfully" };
};
