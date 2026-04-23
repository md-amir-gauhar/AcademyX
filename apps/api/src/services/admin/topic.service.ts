import { db } from "../../db";
import { topics, chapters, subjects, batches } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { ApiError } from "../../common/response";
import { HTTP_STATUS } from "../../common/constants";
import { CacheManager } from "../cache.service";

interface CreateTopicInput {
  name: string;
  chapterId: string;
  organizationId: string;
}

interface UpdateTopicInput {
  name?: string;
}

/**
 * Create a new topic
 */
export const createTopic = async (input: CreateTopicInput) => {
  // Verify chapter exists and belongs to organization
  const chapter = await db.query.chapters.findFirst({
    where: eq(chapters.id, input.chapterId),
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

  if ((chapter.subject as any).batch.organizationId !== input.organizationId) {
    throw new ApiError("Chapter not found", HTTP_STATUS.NOT_FOUND);
  }

  // Create topic
  const [newTopic] = await db
    .insert(topics)
    .values({
      name: input.name,
      chapterId: input.chapterId,
      updatedAt: new Date(),
    })
    .returning();

  // Invalidate topic list cache for this chapter
  await CacheManager.invalidateTopic(newTopic.id, input.chapterId);

  return newTopic;
};

/**
 * Get all topics for a chapter
 */
export const getTopicsByChapterId = async (
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

  // Get all topics for this chapter
  const topicsList = await db.query.topics.findMany({
    where: eq(topics.chapterId, chapterId),
    orderBy: (topics, { asc }) => [asc(topics.createdAt)],
  });

  return topicsList;
};

/**
 * Get a single topic by ID
 */
export const getTopicById = async (topicId: string, organizationId: string) => {
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

  // Verify topic belongs to organization via chapter -> subject -> batch
  if ((topic.chapter as any).subject.batch.organizationId !== organizationId) {
    throw new ApiError("Topic not found", HTTP_STATUS.NOT_FOUND);
  }

  return topic;
};

/**
 * Update a topic
 */
export const updateTopic = async (
  topicId: string,
  organizationId: string,
  input: UpdateTopicInput
) => {
  // Verify topic exists and belongs to organization
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

  if ((topic.chapter as any).subject.batch.organizationId !== organizationId) {
    throw new ApiError("Topic not found", HTTP_STATUS.NOT_FOUND);
  }

  // Update topic
  const [updatedTopic] = await db
    .update(topics)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(topics.id, topicId))
    .returning();

  // Invalidate topic caches
  await CacheManager.invalidateTopic(topicId, (topic.chapter as any).id);

  return updatedTopic;
};

/**
 * Delete a topic
 */
export const deleteTopic = async (topicId: string, organizationId: string) => {
  // Verify topic exists and belongs to organization
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

  if ((topic.chapter as any).subject.batch.organizationId !== organizationId) {
    throw new ApiError("Topic not found", HTTP_STATUS.NOT_FOUND);
  }

  // Delete topic (cascade will remove contents)
  await db.delete(topics).where(eq(topics.id, topicId));

  // Invalidate topic caches
  await CacheManager.invalidateTopic(topicId, (topic.chapter as any).id);

  return { message: "Topic deleted successfully" };
};
