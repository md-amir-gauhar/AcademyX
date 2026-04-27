import { Queue, type ConnectionOptions } from "bullmq";

/**
 * Shared BullMQ connection options for every queue/worker in the app.
 *
 * BullMQ explicitly requires `maxRetriesPerRequest: null` on its Redis
 * connection (it asks ioredis to return failed commands rather than throwing,
 * because BullMQ has its own retry/backoff machinery on top). The cache layer
 * uses a separate connection so its tighter retry policy is unaffected.
 */
export const bullConnection: ConnectionOptions = {
  url: process.env.REDIS_URL,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

export const QUEUE_NAMES = {
  mediaTranscode: "media-transcode",
} as const;

export interface MediaTranscodeJobData {
  /** Row id in `media_jobs`. The worker is the source of truth for state. */
  jobRowId: string;
  /** S3 key of the source upload. */
  sourceKey: string;
  organizationId: string;
}

export const mediaTranscodeQueue = new Queue<MediaTranscodeJobData>(
  QUEUE_NAMES.mediaTranscode,
  {
    connection: bullConnection,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "exponential", delay: 30_000 },
      removeOnComplete: { age: 7 * 24 * 3600, count: 1000 },
      removeOnFail: { age: 14 * 24 * 3600 },
    },
  },
);
