import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db";
import { mediaJobs } from "../../db/schema";
import { ApiError } from "../../common/response";
import { HTTP_STATUS } from "../../common/constants";
import { mediaTranscodeQueue } from "../../workers/queue";

export interface CreateMediaJobInput {
  organizationId: string;
  userId: string;
  sourceKey: string;
  sourceContentType?: string;
}

/**
 * Create a media job row + enqueue the BullMQ transcode job atomically.
 *
 * Atomically here is best-effort: if Redis is unreachable, we surface the
 * error to the caller and the row is rolled back so we don't end up with
 * orphan PENDING rows that nobody will ever pick up.
 */
export async function createMediaJob(input: CreateMediaJobInput) {
  const [row] = await db
    .insert(mediaJobs)
    .values({
      organizationId: input.organizationId,
      userId: input.userId,
      sourceKey: input.sourceKey,
      sourceContentType: input.sourceContentType,
      status: "PENDING",
    })
    .returning();

  try {
    await mediaTranscodeQueue.add(
      "transcode",
      {
        jobRowId: row.id,
        sourceKey: input.sourceKey,
        organizationId: input.organizationId,
      },
      { jobId: row.id },
    );
  } catch (err) {
    // Roll back the row so the system stays consistent.
    await db.delete(mediaJobs).where(eq(mediaJobs.id, row.id));
    throw new ApiError(
      "Failed to enqueue transcode job",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      err,
    );
  }

  return row;
}

export async function getMediaJob(id: string, organizationId: string) {
  const row = await db.query.mediaJobs.findFirst({
    where: and(
      eq(mediaJobs.id, id),
      eq(mediaJobs.organizationId, organizationId),
    ),
  });
  if (!row) {
    throw new ApiError("Media job not found", HTTP_STATUS.NOT_FOUND);
  }
  return row;
}

export interface ListMediaJobsArgs {
  organizationId: string;
  page?: number;
  limit?: number;
}

export async function listMediaJobs({
  organizationId,
  page = 1,
  limit = 20,
}: ListMediaJobsArgs) {
  const offset = (page - 1) * limit;
  const rows = await db.query.mediaJobs.findMany({
    where: eq(mediaJobs.organizationId, organizationId),
    orderBy: [desc(mediaJobs.createdAt)],
    limit,
    offset,
  });
  const all = await db.query.mediaJobs.findMany({
    where: eq(mediaJobs.organizationId, organizationId),
    columns: { id: true },
  });
  const totalCount = all.length;
  return {
    data: rows,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1,
    },
  };
}
