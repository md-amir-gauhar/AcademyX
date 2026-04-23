import { db } from "../../db";
import { topics, chapters, userBatchMapping } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { ApiError } from "../../common/response";
import { HTTP_STATUS } from "../../common/constants";

/**
 * Get all topics for a chapter (Client - only for purchased batches)
 */
export const getTopicsByChapterId = async (
  chapterId: string,
  userId: string,
  organizationId: string
) => {
  // Verify chapter exists and get its batch
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

  // Verify batch belongs to organization and is ACTIVE
  if (
    (chapter.subject as any).batch.organizationId !== organizationId ||
    (chapter.subject as any).batch.status !== "ACTIVE"
  ) {
    throw new ApiError("Chapter not found", HTTP_STATUS.NOT_FOUND);
  }

  // Verify user has purchased this batch
  const purchase = await db.query.userBatchMapping.findFirst({
    where: and(
      eq(userBatchMapping.userId, userId),
      eq(userBatchMapping.batchId, (chapter.subject as any).batchId),
      eq(userBatchMapping.organizationId, organizationId)
    ),
  });

  if (!purchase) {
    throw new ApiError(
      "You have not purchased this batch",
      HTTP_STATUS.FORBIDDEN
    );
  }

  // Get all topics for this chapter
  const topicsList = await db.query.topics.findMany({
    where: eq(topics.chapterId, chapterId),
    orderBy: (topics, { asc }) => [asc(topics.createdAt)],
  });

  return topicsList;
};

/**
 * Get a single topic by ID (Client - only if batch is purchased)
 */
export const getTopicById = async (
  topicId: string,
  userId: string,
  organizationId: string
) => {
  const topic = await db.query.topics.findFirst({
    where: eq(topics.id, topicId),
    with: {
      chapter: {
        with: {
          subject: {
            with: {
              batch: true,
            },
          },
        },
      },
    },
  });

  if (!topic) {
    throw new ApiError("Topic not found", HTTP_STATUS.NOT_FOUND);
  }

  // Verify topic belongs to organization via batch and is ACTIVE
  if (
    (topic.chapter as any).subject.batch.organizationId !== organizationId ||
    (topic.chapter as any).subject.batch.status !== "ACTIVE"
  ) {
    throw new ApiError("Topic not found", HTTP_STATUS.NOT_FOUND);
  }

  // Verify user has purchased this batch
  const purchase = await db.query.userBatchMapping.findFirst({
    where: and(
      eq(userBatchMapping.userId, userId),
      eq(userBatchMapping.batchId, (topic.chapter as any).subject.batchId),
      eq(userBatchMapping.organizationId, organizationId)
    ),
  });

  if (!purchase) {
    throw new ApiError(
      "You have not purchased this batch",
      HTTP_STATUS.FORBIDDEN
    );
  }

  return topic;
};
