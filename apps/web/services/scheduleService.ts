import { apiGet, apiGetPaginated } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { Schedule, ScheduleQuery } from "@/types/schedule";

export const listSchedules = (q: ScheduleQuery = {}) =>
  apiGetPaginated<Schedule>(endpoints.schedules.feed, {
    params: {
      page: q.page ?? 1,
      limit: q.limit ?? 10,
      ...(q.status ? { status: q.status } : {}),
      ...(q.batchId ? { batchId: q.batchId } : {}),
      ...(q.teacherId ? { teacherId: q.teacherId } : {}),
      ...(q.date ? { date: q.date } : {}),
      ...(q.upcoming ? { upcoming: "true" } : {}),
    },
  });

export const getSchedule = (id: string) =>
  apiGet<Schedule>(endpoints.schedules.byId(id));

export const listSchedulesByTopic = (topicId: string) =>
  apiGet<Schedule[]>(endpoints.schedules.byTopic(topicId));

export const listSchedulesByBatch = (batchId: string) =>
  apiGet<Schedule[]>(endpoints.schedules.byBatch(batchId));
