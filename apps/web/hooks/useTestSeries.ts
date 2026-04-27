"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getTestSeries,
  listMyTestSeries,
  listTestSeries,
  listTestsInSeries,
  type ListTestSeriesQuery,
} from "@/services/testSeriesService";
import { useIsAuthed } from "@/hooks/useIsAuthed";
import type { ApiRequestError } from "@/lib/api/errors";

export const testSeriesKeys = {
  all: ["testSeries"] as const,
  list: (q: ListTestSeriesQuery) => ["testSeries", "list", q] as const,
  mine: (q: ListTestSeriesQuery) => ["testSeries", "mine", q] as const,
  detail: (idOrSlug: string) => ["testSeries", "detail", idOrSlug] as const,
  tests: (seriesId: string) => ["testSeries", "tests", seriesId] as const,
};

export function useTestSeriesList(q: ListTestSeriesQuery = {}) {
  const isAuthed = useIsAuthed();
  return useQuery({
    queryKey: testSeriesKeys.list(q),
    queryFn: () => listTestSeries(q),
    enabled: isAuthed,
  });
}

export function useMyTestSeries(q: ListTestSeriesQuery = {}) {
  const isAuthed = useIsAuthed();
  return useQuery({
    queryKey: testSeriesKeys.mine(q),
    queryFn: () => listMyTestSeries(q),
    enabled: isAuthed,
  });
}

export function useTestSeries(idOrSlug: string | undefined) {
  const isAuthed = useIsAuthed();
  return useQuery({
    queryKey: idOrSlug
      ? testSeriesKeys.detail(idOrSlug)
      : ["testSeries", "detail", "noop"],
    queryFn: () => {
      if (!idOrSlug) throw new Error("Series id or slug required");
      return getTestSeries(idOrSlug);
    },
    enabled: isAuthed && Boolean(idOrSlug),
    retry: (count, err) => {
      const status = (err as ApiRequestError)?.status ?? 0;
      if (status === 404) return false;
      return count < 2;
    },
  });
}

export function useTestsInSeries(seriesId: string | undefined) {
  const isAuthed = useIsAuthed();
  return useQuery({
    queryKey: seriesId
      ? testSeriesKeys.tests(seriesId)
      : ["testSeries", "tests", "noop"],
    queryFn: () => {
      if (!seriesId) throw new Error("seriesId required");
      return listTestsInSeries(seriesId);
    },
    enabled: isAuthed && Boolean(seriesId),
  });
}
