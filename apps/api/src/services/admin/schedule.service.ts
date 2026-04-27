import { db } from "../../db";
import { schedules, topics, batches, contents, mediaJobs } from "../../db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { ApiError } from "../../common/response";
import { HTTP_STATUS } from "../../common/constants";
import { CacheManager } from "../cache.service";

interface CreateScheduleInput {
  organizationId: string;
  topicId: string;
  batchId: string;
  subjectId: string;
  title: string;
  description?: string;
  subjectName: string;
  /** Provide exactly one of youtubeLink / mediaJobId. */
  youtubeLink?: string;
  mediaJobId?: string;
  scheduledAt: Date | string;
  duration: number;
  teacherId?: string;
  thumbnailUrl?: string;
  notifyBeforeMinutes?: number;
  tags?: string[];
}

interface UpdateScheduleInput {
  title?: string;
  description?: string;
  subjectName?: string;
  youtubeLink?: string;
  mediaJobId?: string;
  scheduledAt?: Date | string;
  duration?: number;
  teacherId?: string | null;
  thumbnailUrl?: string;
  notifyBeforeMinutes?: number;
  tags?: string[];
}

/**
 * Resolve the `hlsUrl` for a schedule from a linked media job. Returns null
 * if the job is not yet ready, throws if it doesn't belong to this org.
 */
async function resolveHlsFromJob(
  mediaJobId: string,
  organizationId: string,
): Promise<string | null> {
  const job = await db.query.mediaJobs.findFirst({
    where: and(
      eq(mediaJobs.id, mediaJobId),
      eq(mediaJobs.organizationId, organizationId),
    ),
  });
  if (!job) {
    throw new ApiError("Media job not found", HTTP_STATUS.NOT_FOUND);
  }
  return job.hlsUrl ?? null;
}

/**
 * Create a new schedule
 */
export const createSchedule = async (input: CreateScheduleInput) => {
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

  if (!input.youtubeLink && !input.mediaJobId) {
    throw new ApiError(
      "Provide either a YouTube link or a media job for the schedule",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  // If a media job is provided, snapshot its current hlsUrl. The job may
  // still be PROCESSING — that's fine, the cron / status update will copy
  // the URL once it's ready.
  let hlsUrl: string | null = null;
  if (input.mediaJobId) {
    hlsUrl = await resolveHlsFromJob(input.mediaJobId, input.organizationId);
  }

  // Create schedule
  const [newSchedule] = await db
    .insert(schedules)
    .values({
      organizationId: input.organizationId,
      topicId: input.topicId,
      batchId: input.batchId,
      subjectId: input.subjectId,
      title: input.title,
      description: input.description,
      subjectName: input.subjectName,
      youtubeLink: input.youtubeLink,
      mediaJobId: input.mediaJobId,
      hlsUrl,
      scheduledAt: new Date(input.scheduledAt),
      duration: input.duration,
      teacherId: input.teacherId,
      thumbnailUrl: input.thumbnailUrl,
      notifyBeforeMinutes: input.notifyBeforeMinutes ?? 30,
      tags: input.tags,
      status: "SCHEDULED",
      reminderSent: false,
      updatedAt: new Date(),
    })
    .returning();

  // Invalidate schedule caches
  await CacheManager.invalidateSchedule(newSchedule.id, input.topicId);

  return newSchedule;
};

/**
 * Get all schedules with optional filters
 */
export const getAllSchedules = async (
  organizationId: string,
  filters: {
    page?: number;
    limit?: number;
    status?: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
    batchId?: string;
    teacherId?: string;
    date?: string;
    upcoming?: boolean;
  } = {}
) => {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions = [eq(schedules.organizationId, organizationId)];

  if (filters.status) {
    conditions.push(eq(schedules.status, filters.status));
  }

  if (filters.teacherId) {
    conditions.push(eq(schedules.teacherId, filters.teacherId));
  }

  if (filters.date) {
    const startOfDay = new Date(filters.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(filters.date);
    endOfDay.setHours(23, 59, 59, 999);

    conditions.push(
      gte(schedules.scheduledAt, startOfDay),
      lte(schedules.scheduledAt, endOfDay)
    );
  }

  if (filters.upcoming) {
    conditions.push(gte(schedules.scheduledAt, new Date()));
    conditions.push(eq(schedules.status, "SCHEDULED"));
  }

  // If batchId filter is provided, use direct batchId field
  if (filters.batchId) {
    conditions.push(eq(schedules.batchId, filters.batchId));
  }

  // Get schedules with related data
  const schedulesList = await db.query.schedules.findMany({
    where: and(...conditions),
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
      teacher: true,
      content: true,
    },
    orderBy: (schedules, { desc }) => [desc(schedules.scheduledAt)],
    limit,
    offset,
  });

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schedules)
    .where(and(...conditions));

  return {
    schedules: schedulesList,
    pagination: {
      total: Number(count),
      page,
      limit,
      totalPages: Math.ceil(Number(count) / limit),
      hasNextPage: page < Math.ceil(Number(count) / limit),
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Get schedules by topic ID
 */
export const getSchedulesByTopicId = async (
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

  // Get all schedules for this topic
  const schedulesList = await db.query.schedules.findMany({
    where: eq(schedules.topicId, topicId),
    with: {
      teacher: true,
      content: true,
    },
    orderBy: (schedules, { desc }) => [desc(schedules.scheduledAt)],
  });

  return schedulesList;
};

/**
 * Get a single schedule by ID
 */
export const getScheduleById = async (
  scheduleId: string,
  organizationId: string
) => {
  const schedule = await db.query.schedules.findFirst({
    where: eq(schedules.id, scheduleId),
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
      teacher: true,
      content: true,
    },
  });

  if (!schedule) {
    throw new ApiError("Schedule not found", HTTP_STATUS.NOT_FOUND);
  }

  // Verify schedule belongs to organization
  if (
    (schedule.topic as any).chapter.subject.batch.organizationId !==
    organizationId
  ) {
    throw new ApiError("Schedule not found", HTTP_STATUS.NOT_FOUND);
  }

  return schedule;
};

/**
 * Update a schedule
 */
export const updateSchedule = async (
  scheduleId: string,
  organizationId: string,
  input: UpdateScheduleInput
) => {
  // Verify schedule exists and belongs to organization
  const schedule = await getScheduleById(scheduleId, organizationId);

  // Prevent updating if already completed or cancelled
  if (schedule.status === "COMPLETED" || schedule.status === "CANCELLED") {
    throw new ApiError(
      `Cannot update a ${schedule.status.toLowerCase()} schedule`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // If switching to / re-pointing at a media job, refresh the cached hlsUrl.
  let hlsUrlPatch: string | null | undefined;
  if (input.mediaJobId) {
    hlsUrlPatch = await resolveHlsFromJob(input.mediaJobId, organizationId);
  }

  // Update schedule
  const [updatedSchedule] = await db
    .update(schedules)
    .set({
      ...input,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
      hlsUrl: hlsUrlPatch,
      updatedAt: new Date(),
    })
    .where(eq(schedules.id, scheduleId))
    .returning();

  // Invalidate caches
  await CacheManager.invalidateSchedule(scheduleId, schedule.topicId);

  return updatedSchedule;
};

/**
 * Update schedule status with auto-create content on completion
 */
export const updateScheduleStatus = async (
  scheduleId: string,
  organizationId: string,
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED"
) => {
  // Verify schedule exists and belongs to organization
  const schedule = await getScheduleById(scheduleId, organizationId);

  // Update status
  const [updatedSchedule] = await db
    .update(schedules)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(schedules.id, scheduleId))
    .returning();

  // Auto-create content when status is COMPLETED. Prefer the transcoded
  // HLS URL when available (uploaded recordings); fall back to the original
  // YouTube link for live broadcasts.
  if (status === "COMPLETED" && !schedule.contentId) {
    // Refresh hlsUrl from the job in case it finished after schedule create.
    let resolvedHlsUrl = schedule.hlsUrl ?? null;
    if (!resolvedHlsUrl && schedule.mediaJobId) {
      resolvedHlsUrl = await resolveHlsFromJob(
        schedule.mediaJobId,
        organizationId,
      );
      if (resolvedHlsUrl) {
        await db
          .update(schedules)
          .set({ hlsUrl: resolvedHlsUrl, updatedAt: new Date() })
          .where(eq(schedules.id, scheduleId));
      }
    }

    const useHls = Boolean(resolvedHlsUrl);
    const [newContent] = await db
      .insert(contents)
      .values({
        name: schedule.title,
        topicId: schedule.topicId,
        type: "Lecture",
        videoUrl: useHls ? resolvedHlsUrl! : schedule.youtubeLink ?? "",
        videoType: useHls ? "HLS" : "YOUTUBE",
        videoThumbnail: schedule.thumbnailUrl,
        videoDuration: schedule.duration,
        isCompleted: false,
        updatedAt: new Date(),
      })
      .returning();

    // Link the content to the schedule
    await db
      .update(schedules)
      .set({
        contentId: newContent.id,
        updatedAt: new Date(),
      })
      .where(eq(schedules.id, scheduleId));

    // Invalidate content caches
    await CacheManager.invalidateContent(newContent.id, schedule.topicId);
  }

  // Invalidate schedule caches
  await CacheManager.invalidateSchedule(scheduleId, schedule.topicId);

  return updatedSchedule;
};

/**
 * Delete a schedule
 */
export const deleteSchedule = async (
  scheduleId: string,
  organizationId: string
) => {
  // Verify schedule exists and belongs to organization
  const schedule = await getScheduleById(scheduleId, organizationId);

  // Delete schedule
  await db.delete(schedules).where(eq(schedules.id, scheduleId));

  // Invalidate caches
  await CacheManager.invalidateSchedule(scheduleId, schedule.topicId);

  return { message: "Schedule deleted successfully" };
};

/**
 * Get schedules by batch ID
 */
export const getSchedulesByBatchId = async (
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

  // Get all schedules for this batch
  const schedulesList = await db.query.schedules.findMany({
    where: eq(schedules.batchId, batchId),
    with: {
      topic: {
        with: {
          chapter: {
            with: {
              subject: true,
            },
          },
        },
      },
      batch: true,
      subject: true,
      teacher: true,
      content: true,
    },
    orderBy: (schedules, { desc }) => [desc(schedules.scheduledAt)],
  });

  return schedulesList;
};
