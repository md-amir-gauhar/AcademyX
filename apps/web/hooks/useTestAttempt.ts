"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  startAttempt,
  getAttempt,
  submitAnswer,
  submitAttempt,
  getAttemptResults,
  getAttemptSolutions,
  listMyAttempts,
  listLeaderboard,
  listRecentCompleted,
  getAttemptStats,
  type RecentCompletedQuery,
} from "@/services/testAttemptService";
import { useAuthStore } from "@/store/authStore";
import type { SubmitAnswerPayload } from "@/types/test";

export const attemptKeys = {
  all: ["attempts"] as const,
  detail: (id: string) => ["attempts", "detail", id] as const,
  results: (id: string) => ["attempts", "results", id] as const,
  solutions: (id: string) => ["attempts", "solutions", id] as const,
  myAttempts: (testId: string) => ["attempts", "myAttempts", testId] as const,
  leaderboard: (testId: string, q?: object) =>
    ["attempts", "leaderboard", testId, q] as const,
  recentCompleted: (q?: object) => ["attempts", "recentCompleted", q] as const,
  stats: (seriesId?: string) => ["attempts", "stats", seriesId] as const,
};

export function useStartAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (testId: string) => startAttempt(testId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attemptKeys.all });
    },
  });
}

export function useAttempt(attemptId: string | undefined) {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken && s.user));
  return useQuery({
    queryKey: attemptId ? attemptKeys.detail(attemptId) : ["attempts", "noop"],
    queryFn: () => {
      if (!attemptId) throw new Error("attemptId required");
      return getAttempt(attemptId);
    },
    enabled: isAuthed && Boolean(attemptId),
    refetchOnWindowFocus: false,
  });
}

export function useSubmitAnswer(attemptId: string) {
  return useMutation({
    mutationFn: (payload: SubmitAnswerPayload) =>
      submitAnswer(attemptId, payload),
  });
}

export function useSubmitTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attemptId: string) => submitAttempt(attemptId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attemptKeys.all });
    },
  });
}

export function useAttemptResults(attemptId: string | undefined) {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken && s.user));
  return useQuery({
    queryKey: attemptId
      ? attemptKeys.results(attemptId)
      : ["attempts", "results", "noop"],
    queryFn: () => {
      if (!attemptId) throw new Error("attemptId required");
      return getAttemptResults(attemptId);
    },
    enabled: isAuthed && Boolean(attemptId),
  });
}

export function useAttemptSolutions(attemptId: string | undefined) {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken && s.user));
  return useQuery({
    queryKey: attemptId
      ? attemptKeys.solutions(attemptId)
      : ["attempts", "solutions", "noop"],
    queryFn: () => {
      if (!attemptId) throw new Error("attemptId required");
      return getAttemptSolutions(attemptId);
    },
    enabled: isAuthed && Boolean(attemptId),
  });
}

export function useMyAttempts(testId: string | undefined) {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken && s.user));
  return useQuery({
    queryKey: testId
      ? attemptKeys.myAttempts(testId)
      : ["attempts", "myAttempts", "noop"],
    queryFn: () => {
      if (!testId) throw new Error("testId required");
      return listMyAttempts(testId);
    },
    enabled: isAuthed && Boolean(testId),
  });
}

export function useLeaderboard(
  testId: string | undefined,
  q: { page?: number; limit?: number } = {}
) {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken && s.user));
  return useQuery({
    queryKey: testId
      ? attemptKeys.leaderboard(testId, q)
      : ["attempts", "leaderboard", "noop"],
    queryFn: () => {
      if (!testId) throw new Error("testId required");
      return listLeaderboard(testId, q);
    },
    enabled: isAuthed && Boolean(testId),
  });
}

export function useRecentCompleted(q: RecentCompletedQuery = {}) {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken && s.user));
  return useQuery({
    queryKey: attemptKeys.recentCompleted(q),
    queryFn: () => listRecentCompleted(q),
    enabled: isAuthed,
  });
}

export function useAttemptStats(testSeriesId?: string) {
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken && s.user));
  return useQuery({
    queryKey: attemptKeys.stats(testSeriesId),
    queryFn: () => getAttemptStats(testSeriesId),
    enabled: isAuthed,
  });
}
