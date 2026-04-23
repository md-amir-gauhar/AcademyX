import { db } from "../../db";
import { contents, topics, userBatchMapping } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { ApiError } from "../../common/response";
import { HTTP_STATUS } from "../../common/constants";

/**
 * Get all contents for a topic (Client - only for purchased batches)
 */
export const getContentsByTopicId = async (
  topicId: string,
  userId: string,
  organizationId: string
) => {
  // Verify topic exists and get its batch
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

  // Verify batch belongs to organization and is ACTIVE
  if (
    (topic.chapter as any).subject.batch.organizationId !== organizationId ||
    (topic.chapter as any).subject.batch.status !== "ACTIVE"
  ) {
    throw new ApiError("Topic not found", HTTP_STATUS.NOT_FOUND);
  }

  const contentsList = await db.query.contents.findMany({
    where: eq(contents.topicId, topicId),
    orderBy: (contents, { asc }) => [asc(contents.createdAt)],
  });

  return contentsList;
};

/**
 * Get a single content by ID (Client - only if batch is purchased)
 */
export const getContentById = async (
  contentId: string,
  userId: string,
  organizationId: string
) => {
  const content = await db.query.contents.findFirst({
    where: eq(contents.id, contentId),
    with: {
      topic: {
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
      },
    },
  });

  if (!content) {
    throw new ApiError("Content not found", HTTP_STATUS.NOT_FOUND);
  }

  // Verify content belongs to organization via batch and is ACTIVE
  if (
    (content.topic as any).chapter.subject.batch.organizationId !==
      organizationId ||
    (content.topic as any).chapter.subject.batch.status !== "ACTIVE"
  ) {
    throw new ApiError("Content not found", HTTP_STATUS.NOT_FOUND);
  }

  return content;
};
