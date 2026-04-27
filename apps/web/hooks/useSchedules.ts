"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getSchedule,
  listSchedules,
  listSchedulesByBatch,
  listSchedulesByTopic,
} from "@/services/scheduleService";
import type { ScheduleQuery } from "@/types/schedule";
import { useIsAuthed } from "@/hooks/useIsAuthed";

export const scheduleKeys = {
  feed: (q: ScheduleQuery) => ["schedules", "feed", q] as const,
  detail: (id: string) => ["schedules", "detail", id] as const,
  byBatch: (batchId: string) =>
    ["schedules", "batch", batchId] as const,
  byTopic: (topicId: string) =>
    ["schedules", "topic", topicId] as const,
};

export function useSchedules(q: ScheduleQuery = {}) {
  const isAuthed = useIsAuthed();
  return useQuery({
    queryKey: scheduleKeys.feed(q),
    queryFn: () => listSchedules(q),
    enabled: isAuthed,
    staleTime: 30_000,
  });
}

export function useSchedule(id: string | undefined) {
  const isAuthed = useIsAuthed();
  return useQuery({
    queryKey: id ? scheduleKeys.detail(id) : ["schedules", "detail", "noop"],
    queryFn: () => {
      if (!id) throw new Error("id required");
      return getSchedule(id);
    },
    enabled: isAuthed && Boolean(id),
  });
}

export function useSchedulesByBatch(batchId: string | undefined) {
  const isAuthed = useIsAuthed();
  return useQuery({
    queryKey: batchId
      ? scheduleKeys.byBatch(batchId)
      : ["schedules", "batch", "noop"],
    queryFn: () => {
      if (!batchId) throw new Error("batchId required");
      return listSchedulesByBatch(batchId);
    },
    enabled: isAuthed && Boolean(batchId),
  });
}

export function useSchedulesByTopic(topicId: string | undefined) {
  const isAuthed = useIsAuthed();
  return useQuery({
    queryKey: topicId
      ? scheduleKeys.byTopic(topicId)
      : ["schedules", "topic", "noop"],
    queryFn: () => {
      if (!topicId) throw new Error("topicId required");
      return listSchedulesByTopic(topicId);
    },
    enabled: isAuthed && Boolean(topicId),
  });
}
