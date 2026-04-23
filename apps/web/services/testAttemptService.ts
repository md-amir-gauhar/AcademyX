import { apiGet, apiGetPaginated, apiPost } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type {
  LeaderboardEntry,
  RecentCompletedAttempt,
  SubmitAnswerPayload,
  TestAnswer,
  TestAttempt,
  TestAttemptResult,
  TestAttemptRunner,
  TestAttemptStats,
} from "@/types/test";

export const startAttempt = (testId: string) =>
  apiPost<TestAttempt>(endpoints.attempts.start(testId));

export const getAttempt = (attemptId: string) =>
  apiGet<TestAttemptRunner>(endpoints.attempts.byId(attemptId));

export const submitAnswer = (
  attemptId: string,
  payload: SubmitAnswerPayload
) =>
  apiPost<TestAnswer, SubmitAnswerPayload>(
    endpoints.attempts.answer(attemptId),
    payload
  );

export const submitAttempt = (attemptId: string) =>
  apiPost<TestAttempt>(endpoints.attempts.submit(attemptId));

export const getAttemptResults = (attemptId: string) =>
  apiGet<TestAttemptResult>(endpoints.attempts.results(attemptId));

export const getAttemptSolutions = (attemptId: string) =>
  apiGet<TestAttemptResult>(endpoints.attempts.solutions(attemptId));

export const listMyAttempts = (testId: string) =>
  apiGet<TestAttempt[]>(endpoints.attempts.myAttempts(testId));

export const listLeaderboard = (
  testId: string,
  q: { page?: number; limit?: number } = {}
) =>
  apiGetPaginated<LeaderboardEntry>(endpoints.attempts.leaderboard(testId), {
    params: { page: q.page ?? 1, limit: q.limit ?? 10 },
  });

export interface RecentCompletedQuery {
  page?: number;
  limit?: number;
  testSeriesId?: string;
  isPassed?: boolean;
}

export const listRecentCompleted = (q: RecentCompletedQuery = {}) =>
  apiGetPaginated<RecentCompletedAttempt>(endpoints.attempts.recentCompleted, {
    params: {
      page: q.page ?? 1,
      limit: q.limit ?? 20,
      ...(q.testSeriesId ? { testSeriesId: q.testSeriesId } : {}),
      ...(typeof q.isPassed === "boolean"
        ? { isPassed: q.isPassed ? "true" : "false" }
        : {}),
    },
  });

export const getAttemptStats = (testSeriesId?: string) =>
  apiGet<TestAttemptStats>(endpoints.attempts.stats, {
    params: testSeriesId ? { testSeriesId } : undefined,
  });
