import { db } from "../../db";
import { contents, topics, chapters, subjects, batches } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { ApiError } from "../../common/response";
import { HTTP_STATUS } from "../../common/constants";
import { CacheManager } from "../cache.service";

interface CreateContentInput {
  name: string;
  topicId: string;
  organizationId: string;
  type: "Lecture" | "PDF";
  pdfUrl?: string;
  videoUrl?: string;
  videoType?: "HLS" | "YOUTUBE";
  videoThumbnail?: string;
  videoDuration?: number;
  isCompleted?: boolean;
}

interface UpdateContentInput {
  name?: string;
  type?: "Lecture" | "PDF";
  pdfUrl?: string;
  videoUrl?: string;
  videoType?: "HLS" | "YOUTUBE";
  videoThumbnail?: string;
  videoDuration?: number;
  isCompleted?: boolean;
}

/**
 * Create a new content
 */
export const createContent = async (input: CreateContentInput) => {
  // Verify topic exists and belongs to organization
  const topic = await db.query.topics.findFirst({
    where: eq(topics.id, input.topicId),
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

  if (
    (topic.chapter as any).subject.batch.organizationId !== input.organizationId
  ) {
    throw new ApiError("Topic not found", HTTP_STATUS.NOT_FOUND);
  }

  // Create content
  const [newContent] = await db
    .insert(contents)
    .values({
      name: input.name,
      topicId: input.topicId,
      type: input.type,
      pdfUrl: input.pdfUrl,
      videoUrl: input.videoUrl,
      videoType: input.videoType,
      videoThumbnail: input.videoThumbnail,
      videoDuration: input.videoDuration,
      isCompleted: input.isCompleted ?? false,
      updatedAt: new Date(),
    })
    .returning();

  // Invalidate content list cache for this topic
  await CacheManager.invalidateContent(newContent.id, input.topicId);

  return newContent;
};

/**
 * Get all contents for a topic
 */
export const getContentsByTopicId = async (
  topicId: string,
  organizationId: string
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

  // Get all contents for this topic
  const contentsList = await db.query.contents.findMany({
    where: eq(contents.topicId, topicId),
    orderBy: (contents, { asc }) => [asc(contents.createdAt)],
  });

  return contentsList;
};

/**
 * Get a single content by ID
 */
export const getContentById = async (
  contentId: string,
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

  // Verify content belongs to organization via topic -> chapter -> subject -> batch
  if (
    (content.topic as any).chapter.subject.batch.organizationId !==
    organizationId
  ) {
    throw new ApiError("Content not found", HTTP_STATUS.NOT_FOUND);
  }

  return content;
};

/**
 * Update a content
 */
export const updateContent = async (
  contentId: string,
  organizationId: string,
  input: UpdateContentInput
) => {
  // Verify content exists and belongs to organization
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

  if (
    (content.topic as any).chapter.subject.batch.organizationId !==
    organizationId
  ) {
    throw new ApiError("Content not found", HTTP_STATUS.NOT_FOUND);
  }

  // Update content
  const [updatedContent] = await db
    .update(contents)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(contents.id, contentId))
    .returning();

  // Invalidate content caches
  await CacheManager.invalidateContent(contentId, (content.topic as any).id);

  return updatedContent;
};

/**
 * Delete a content
 */
export const deleteContent = async (
  contentId: string,
  organizationId: string
) => {
  // Verify content exists and belongs to organization
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

  if (
    (content.topic as any).chapter.subject.batch.organizationId !==
    organizationId
  ) {
    throw new ApiError("Content not found", HTTP_STATUS.NOT_FOUND);
  }

  // Delete content
  await db.delete(contents).where(eq(contents.id, contentId));

  // Invalidate content caches
  await CacheManager.invalidateContent(contentId, (content.topic as any).id);

  return { message: "Content deleted successfully" };
};
