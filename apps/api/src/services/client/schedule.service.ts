import { db } from "../../db";
import { schedules, topics, userBatchMapping, batches } from "../../db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { ApiError } from "../../common/response";
import { HTTP_STATUS } from "../../common/constants";

/**
 * Get all schedules for user's purchased batches
 */
export const getAllSchedules = async (
  userId: string,
  organizationId: string,
  filters: {
    page?: number;
    limit?: number;
    status?: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
    batchId?: string;
    upcoming?: boolean;
  } = {}
) => {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;

  // Get all batch IDs the user has purchased
  const userBatches = await db.query.userBatchMapping.findMany({
    where: and(
      eq(userBatchMapping.userId, userId),
      eq(userBatchMapping.organizationId, organizationId),
      eq(userBatchMapping.isActive, true)
    ),
    columns: { batchId: true },
  });

  const purchasedBatchIds = userBatches.map((ub) => ub.batchId);

  if (purchasedBatchIds.length === 0) {
    return {
      schedules: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  // Build where conditions - use batchId directly instead of topicId
  const conditions = [sql`${schedules.batchId} = ANY(${purchasedBatchIds})`];

  // If specific batchId is provided, verify user has purchased it
  if (filters.batchId) {
    if (!purchasedBatchIds.includes(filters.batchId)) {
      throw new ApiError(
        "You have not purchased this batch",
        HTTP_STATUS.FORBIDDEN
      );
    }
    conditions.push(eq(schedules.batchId, filters.batchId));
  }

  if (filters.status) {
    conditions.push(eq(schedules.status, filters.status));
  }

  if (filters.upcoming) {
    conditions.push(gte(schedules.scheduledAt, new Date()));
    conditions.push(eq(schedules.status, "SCHEDULED"));
  }

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
      batch: true,
      subject: true,
      teacher: true,
      content: true,
    },
    orderBy: (schedules, { asc }) => [asc(schedules.scheduledAt)],
    limit,
    offset,
  });

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

export const getScheduleById = async (
  scheduleId: string,
  userId: string,
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

  const batch = (schedule.topic as any).chapter.subject.batch;
  if (batch.organizationId !== organizationId || batch.status !== "ACTIVE") {
    throw new ApiError("Schedule not found", HTTP_STATUS.NOT_FOUND);
  }

  const purchase = await db.query.userBatchMapping.findFirst({
    where: and(
      eq(userBatchMapping.userId, userId),
      eq(userBatchMapping.batchId, batch.id),
      eq(userBatchMapping.organizationId, organizationId)
    ),
  });

  if (!purchase) {
    throw new ApiError(
      "You have not purchased this batch",
      HTTP_STATUS.FORBIDDEN
    );
  }

  return schedule;
};

export const getSchedulesByTopicId = async (
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

  const batch = (topic.chapter as any).subject.batch;
  if (batch.organizationId !== organizationId || batch.status !== "ACTIVE") {
    throw new ApiError("Topic not found", HTTP_STATUS.NOT_FOUND);
  }

  const purchase = await db.query.userBatchMapping.findFirst({
    where: and(
      eq(userBatchMapping.userId, userId),
      eq(userBatchMapping.batchId, batch.id),
      eq(userBatchMapping.organizationId, organizationId)
    ),
  });

  if (!purchase) {
    throw new ApiError(
      "You have not purchased this batch",
      HTTP_STATUS.FORBIDDEN
    );
  }

  const schedulesList = await db.query.schedules.findMany({
    where: eq(schedules.topicId, topicId),
    with: {
      teacher: true,
      content: true,
    },
    orderBy: (schedules, { asc }) => [asc(schedules.scheduledAt)],
  });

  return schedulesList;
};

export const getSchedulesByBatchId = async (
  batchId: string,
  userId: string,
  organizationId: string
) => {
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

  const purchase = await db.query.userBatchMapping.findFirst({
    where: and(
      eq(userBatchMapping.userId, userId),
      eq(userBatchMapping.batchId, batchId),
      eq(userBatchMapping.organizationId, organizationId)
    ),
  });

  if (!purchase) {
    return [];
  }

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
    orderBy: (schedules, { asc }) => [asc(schedules.scheduledAt)],
  });

  const now = new Date();
  const schedulesWithStatus = schedulesList.map((schedule) => {
    let computedStatus = schedule.status;

    if (schedule.status !== "CANCELLED") {
      const scheduledTime = new Date(schedule.scheduledAt);
      const endTime = new Date(
        scheduledTime.getTime() + schedule.duration * 60 * 1000
      );

      if (now < scheduledTime) {
        computedStatus = "SCHEDULED";
      } else if (now >= scheduledTime && now < endTime) {
        computedStatus = "LIVE";
      } else {
        computedStatus = "COMPLETED";
      }
    }

    return {
      ...schedule,
      status: computedStatus,
    };
  });

  return schedulesWithStatus;
};
