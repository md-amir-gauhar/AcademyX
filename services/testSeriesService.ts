import { apiGet, apiGetPaginated, apiPost } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type {
  TestSeries,
  TestSeriesCheckoutResponse,
  TestSummary,
} from "@/types/test";
import type { VerifyPaymentPayload } from "@/types/order";

export interface ListTestSeriesQuery {
  page?: number;
  limit?: number;
}

export const listTestSeries = (q: ListTestSeriesQuery = {}) =>
  apiGetPaginated<TestSeries>(endpoints.testSeries.list, {
    params: { page: q.page ?? 1, limit: q.limit ?? 10 },
  });

export const listMyTestSeries = (q: ListTestSeriesQuery = {}) =>
  apiGetPaginated<TestSeries>(endpoints.testSeries.mine, {
    params: { page: q.page ?? 1, limit: q.limit ?? 10 },
  });

export const getTestSeries = (idOrSlug: string) =>
  apiGet<TestSeries>(endpoints.testSeries.byIdOrSlug(idOrSlug));

export const listTestsInSeries = (seriesId: string) =>
  apiGet<TestSummary[]>(endpoints.testSeries.tests(seriesId));

export const checkoutTestSeries = (seriesId: string) =>
  apiPost<TestSeriesCheckoutResponse>(endpoints.testSeries.checkout(seriesId));

export const enrollFreeTestSeries = (seriesId: string) =>
  apiPost<{ success: boolean; enrollmentId: string; startDate: string; endDate: string }>(
    endpoints.testSeries.enrollFree(seriesId)
  );

export const verifyTestSeriesPayment = (body: VerifyPaymentPayload) =>
  apiPost<{ success: boolean; orderId: string; paymentId: string }, VerifyPaymentPayload>(
    endpoints.testSeries.verifyPayment,
    body
  );
