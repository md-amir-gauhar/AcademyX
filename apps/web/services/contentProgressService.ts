import { apiGet, apiGetPaginated, apiPost } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type {
  BatchProgressOverview,
  ContentProgress,
  RecentlyWatchedItem,
  WatchStats,
} from "@/types/course";

export interface RecentlyWatchedQuery {
  page?: number;
  limit?: number;
  batchId?: string;
  completedOnly?: boolean;
}

export const getRecentlyWatched = (q: RecentlyWatchedQuery = {}) =>
  apiGetPaginated<RecentlyWatchedItem>(endpoints.contentProgress.recentlyWatched, {
    params: {
      page: q.page ?? 1,
      limit: q.limit ?? 20,
      ...(q.batchId ? { batchId: q.batchId } : {}),
      ...(q.completedOnly ? { completedOnly: true } : {}),
    },
  });

export const trackProgress = (
  contentId: string,
  body: { watchedSeconds: number; totalDuration: number }
) => apiPost<ContentProgress>(endpoints.contentProgress.track(contentId), body);

export const getProgress = (contentId: string) =>
  apiGet<ContentProgress | null>(endpoints.contentProgress.get(contentId));

export const getWatchStats = (batchId?: string) =>
  apiGet<WatchStats>(endpoints.contentProgress.stats, {
    params: batchId ? { batchId } : undefined,
  });

export const markComplete = (contentId: string) =>
  apiPost<ContentProgress>(endpoints.contentProgress.complete(contentId));

export const getBatchProgress = (batchId: string) =>
  apiGet<BatchProgressOverview>(endpoints.contentProgress.batchProgress, {
    params: { batchId },
  });
