import { db } from "../../db";
import {
  userContentProgress,
  contents,
  topics,
  userBatchMapping,
} from "../../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { ApiError } from "../../common/response";
import { HTTP_STATUS } from "../../common/constants";
import { CacheManager } from "../cache.service";

interface TrackProgressInput {
  userId: string;
  contentId: string;
  organizationId: string;
  watchedSeconds: number;
  totalDuration: number;
}

interface WatchStats {
  totalVideosWatched: number;
  completedVideosCount: number;
  totalWatchTimeSeconds: number;
  totalWatchTimeFormatted: string;
  averageCompletionRate: number;
}

/**
 * Helper function to verify content access and batch purchase
 */
const verifyContentAccess = async (contentId: string) => {
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

  const batch = (content.topic as any).chapter.subject.batch;
  return { content, batch };
};

/**
 * Track or update video watch progress
 * Auto-completes when watchPercentage >= 95%
 */
export const trackVideoProgress = async ({
  userId,
  contentId,
  organizationId,
  watchedSeconds,
  totalDuration,
}: TrackProgressInput) => {
  const { content, batch } = await verifyContentAccess(contentId);
  // Calculate watch percentage
  const watchPercentage =
    totalDuration > 0 ? (watchedSeconds / totalDuration) * 100 : 0;
  const isCompleted = watchPercentage >= 95;

  // Check if progress already exists
  const existingProgress = await db.query.userContentProgress.findFirst({
    where: and(
      eq(userContentProgress.userId, userId),
      eq(userContentProgress.contentId, contentId)
    ),
  });

  let progress;

  if (existingProgress) {
    // Update existing progress
    const updateData: any = {
      watchedSeconds,
      totalDuration,
      watchPercentage,
      lastWatchedAt: new Date(),
      updatedAt: new Date(),
      watchCount: existingProgress.watchCount + 1,
    };

    // Mark as completed if threshold reached and not already completed
    if (isCompleted && !existingProgress.isCompleted) {
      updateData.isCompleted = true;
      updateData.completedAt = new Date();
    }

    [progress] = await db
      .update(userContentProgress)
      .set(updateData)
      .where(eq(userContentProgress.id, existingProgress.id))
      .returning();
  } else {
    // Create new progress record
    [progress] = await db
      .insert(userContentProgress)
      .values({
        userId,
        contentId,
        organizationId,
        batchId: batch.id,
        watchedSeconds,
        totalDuration,
        watchPercentage,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        watchCount: 1,
        lastWatchedAt: new Date(),
      })
      .returning();
  }

  // Invalidate cache for recently watched videos
  await CacheManager.invalidate(`recently-watched:${organizationId}:${userId}`);

  return progress;
};

/**
 * Get recently watched videos with progress
 */
export const getRecentlyWatchedVideos = async (
  userId: string,
  organizationId: string,
  filters: {
    page?: number;
    limit?: number;
    batchId?: string;
    completedOnly?: boolean;
  } = {}
) => {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  // Build conditions
  const conditions = [
    eq(userContentProgress.userId, userId),
    eq(userContentProgress.organizationId, organizationId),
  ];

  if (filters.batchId) {
    // Verify user has purchased this batch
    const purchase = await db.query.userBatchMapping.findFirst({
      where: and(
        eq(userBatchMapping.userId, userId),
        eq(userBatchMapping.batchId, filters.batchId),
        eq(userBatchMapping.organizationId, organizationId),
        eq(userBatchMapping.isActive, true)
      ),
    });

    if (!purchase) {
      throw new ApiError(
        "You have not purchased this batch",
        HTTP_STATUS.FORBIDDEN
      );
    }

    conditions.push(eq(userContentProgress.batchId, filters.batchId));
  }

  if (filters.completedOnly) {
    conditions.push(eq(userContentProgress.isCompleted, true));
  }

  // Get progress with content details
  const progressList = await db.query.userContentProgress.findMany({
    where: and(...conditions),
    with: {
      content: {
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
      },
    },
    orderBy: desc(userContentProgress.lastWatchedAt),
    limit,
    offset,
  });

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(userContentProgress)
    .where(and(...conditions));

  // Get watch stats
  const stats = await getWatchStats(userId, organizationId, filters.batchId);

  return {
    videos: progressList.map((progress) => ({
      content: progress.content,
      progress: {
        id: progress.id,
        watchedSeconds: progress.watchedSeconds,
        totalDuration: progress.totalDuration,
        watchPercentage: progress.watchPercentage,
        isCompleted: progress.isCompleted,
        completedAt: progress.completedAt,
        watchCount: progress.watchCount,
        lastWatchedAt: progress.lastWatchedAt,
      },
    })),
    pagination: {
      total: Number(count),
      page,
      limit,
      totalPages: Math.ceil(Number(count) / limit),
      hasNextPage: page < Math.ceil(Number(count) / limit),
      hasPrevPage: page > 1,
    },
    stats,
  };
};

/**
 * Get progress for a specific content
 */
export const getContentProgress = async (
  userId: string,
  contentId: string,
  organizationId: string
) => {
  // Get progress
  const progress = await db.query.userContentProgress.findFirst({
    where: and(
      eq(userContentProgress.userId, userId),
      eq(userContentProgress.contentId, contentId)
    ),
  });

  // Return null if no progress yet, or the progress data
  return progress || null;
};

/**
 * Get watch statistics for user
 */
export const getWatchStats = async (
  userId: string,
  organizationId: string,
  batchId?: string
): Promise<WatchStats> => {
  const conditions = [
    eq(userContentProgress.userId, userId),
    eq(userContentProgress.organizationId, organizationId),
  ];

  if (batchId) {
    conditions.push(eq(userContentProgress.batchId, batchId));
  }

  const [stats] = await db
    .select({
      totalVideosWatched: sql<number>`COUNT(*)`,
      completedVideosCount: sql<number>`SUM(CASE WHEN ${userContentProgress.isCompleted} THEN 1 ELSE 0 END)`,
      totalWatchTimeSeconds: sql<number>`SUM(${userContentProgress.watchedSeconds})`,
      averageCompletionRate: sql<number>`AVG(${userContentProgress.watchPercentage})`,
    })
    .from(userContentProgress)
    .where(and(...conditions));

  // Format watch time
  const totalSeconds = Number(stats.totalWatchTimeSeconds || 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return {
    totalVideosWatched: Number(stats.totalVideosWatched || 0),
    completedVideosCount: Number(stats.completedVideosCount || 0),
    totalWatchTimeSeconds: totalSeconds,
    totalWatchTimeFormatted:
      hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
    averageCompletionRate: Number(stats.averageCompletionRate || 0),
  };
};

/**
 * Mark content as completed manually
 * Frontend ensures batch is purchased before showing this option
 */
export const markAsCompleted = async (
  userId: string,
  contentId: string,
  organizationId: string
) => {
  // Verify content exists and get batch info
  const { content, batch } = await verifyContentAccess(contentId);

  // Check if progress already exists
  const existingProgress = await db.query.userContentProgress.findFirst({
    where: and(
      eq(userContentProgress.userId, userId),
      eq(userContentProgress.contentId, contentId)
    ),
  });

  let result;

  if (existingProgress) {
    // Update existing progress if not already completed
    if (existingProgress.isCompleted) {
      return existingProgress; // Already completed, return as-is
    }

    [result] = await db
      .update(userContentProgress)
      .set({
        isCompleted: true,
        completedAt: new Date(),
        watchPercentage: 100,
        watchedSeconds: content.videoDuration || existingProgress.totalDuration,
        updatedAt: new Date(),
      })
      .where(eq(userContentProgress.id, existingProgress.id))
      .returning();
  } else {
    // Create new progress record marked as completed
    const totalDuration = content.videoDuration || 0;

    [result] = await db
      .insert(userContentProgress)
      .values({
        userId,
        contentId,
        organizationId,
        batchId: batch.id,
        watchedSeconds: totalDuration,
        totalDuration,
        watchPercentage: 100,
        isCompleted: true,
        completedAt: new Date(),
        watchCount: 1,
        lastWatchedAt: new Date(),
      })
      .returning();
  }

  // Invalidate cache
  await CacheManager.invalidate(`recently-watched:${organizationId}:${userId}`);

  return result;
};

/**
 * Get batch progress overview - how many videos completed out of total
 */
export const getBatchProgressOverview = async (
  userId: string,
  batchId: string,
  organizationId: string
) => {
  // Verify user has purchased the batch
  const purchase = await db.query.userBatchMapping.findFirst({
    where: and(
      eq(userBatchMapping.userId, userId),
      eq(userBatchMapping.batchId, batchId),
      eq(userBatchMapping.organizationId, organizationId),
      eq(userBatchMapping.isActive, true)
    ),
  });

  if (!purchase) {
    throw new ApiError(
      "You have not purchased this batch",
      HTTP_STATUS.FORBIDDEN
    );
  }

  // Get total video content count in this batch
  const totalVideos = await db
    .select({ count: sql<number>`count(*)` })
    .from(contents)
    .innerJoin(topics, eq(contents.topicId, topics.id))
    .innerJoin(sql`chapters`, sql`${topics.chapterId} = chapters.id`)
    .innerJoin(sql`subjects`, sql`chapters.subject_id = subjects.id`)
    .where(
      and(sql`subjects.batch_id = ${batchId}`, eq(contents.type, "Lecture"))
    );

  // Get completed videos count
  const [completedStats] = await db
    .select({
      completedCount: sql<number>`COUNT(*)`,
      totalWatchTime: sql<number>`SUM(${userContentProgress.watchedSeconds})`,
    })
    .from(userContentProgress)
    .where(
      and(
        eq(userContentProgress.userId, userId),
        eq(userContentProgress.batchId, batchId),
        eq(userContentProgress.isCompleted, true)
      )
    );

  const total = Number(totalVideos[0]?.count || 0);
  const completed = Number(completedStats.completedCount || 0);
  const progressPercentage = total > 0 ? (completed / total) * 100 : 0;

  return {
    totalVideos: total,
    completedVideos: completed,
    progressPercentage: Math.round(progressPercentage * 100) / 100,
    totalWatchTimeSeconds: Number(completedStats.totalWatchTime || 0),
  };
};
