"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getBatch,
  getBatchSchedules,
  listBatches,
  listMyBatches,
  type ListBatchesQuery,
} from "@/services/batchService";
import { useAuthStore } from "@/store/authStore";
import type { ApiRequestError } from "@/lib/api/errors";

export const batchKeys = {
  all: ["batches"] as const,
  list: (q: ListBatchesQuery) => ["batches", "list", q] as const,
  mine: (q: ListBatchesQuery) => ["batches", "mine", q] as const,
  detail: (idOrSlug: string) => ["batches", "detail", idOrSlug] as const,
  schedules: (batchId: string) =>
    ["batches", "schedules", batchId] as const,
};

export function useBatches(q: ListBatchesQuery = {}) {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken && s.user));
  return useQuery({
    queryKey: batchKeys.list(q),
    queryFn: () => listBatches(q),
    enabled: isAuthed,
    staleTime: 60_000,
  });
}

export function useMyBatches(q: ListBatchesQuery = {}) {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken && s.user));
  return useQuery({
    queryKey: batchKeys.mine(q),
    queryFn: () => listMyBatches(q),
    enabled: isAuthed,
    staleTime: 60_000,
  });
}

export function useBatch(idOrSlug: string | undefined) {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken && s.user));
  return useQuery({
    queryKey: idOrSlug ? batchKeys.detail(idOrSlug) : ["batches", "detail", "noop"],
    queryFn: () => {
      if (!idOrSlug) throw new Error("Batch id or slug required");
      return getBatch(idOrSlug);
    },
    enabled: isAuthed && Boolean(idOrSlug),
    staleTime: 60_000,
    retry: (count, err) => {
      const status = (err as ApiRequestError)?.status ?? 0;
      if (status === 404 || status === 403) return false;
      return count < 2;
    },
  });
}

export function useBatchSchedules(batchId: string | undefined) {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken && s.user));
  return useQuery({
    queryKey: batchId
      ? batchKeys.schedules(batchId)
      : ["batches", "schedules", "noop"],
    queryFn: () => {
      if (!batchId) throw new Error("batchId required");
      return getBatchSchedules(batchId);
    },
    enabled: isAuthed && Boolean(batchId),
  });
}
