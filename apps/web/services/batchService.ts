import { apiGet, apiGetPaginated, apiPost } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type {
  Batch,
  CheckoutResponse,
  FreeEnrollResponse,
} from "@/types/batch";
import type { Schedule } from "@/types/schedule";

export interface ListBatchesQuery {
  page?: number;
  limit?: number;
}

export const listBatches = (q: ListBatchesQuery = {}) =>
  apiGetPaginated<Batch>(endpoints.batches.list, {
    params: { page: q.page ?? 1, limit: q.limit ?? 10 },
  });

export const listMyBatches = (q: ListBatchesQuery = {}) =>
  apiGetPaginated<Batch>(endpoints.batches.mine, {
    params: { page: q.page ?? 1, limit: q.limit ?? 10 },
  });

export const getBatch = (idOrSlug: string) =>
  apiGet<Batch>(endpoints.batches.byIdOrSlug(idOrSlug));

export const getBatchSchedules = (batchId: string) =>
  apiGet<Schedule[]>(endpoints.batches.schedules(batchId));

export const checkoutBatch = (id: string) =>
  apiPost<CheckoutResponse>(endpoints.batches.checkout(id));

export const enrollFreeBatch = (batchId: string) =>
  apiPost<FreeEnrollResponse>(endpoints.batches.enrollFree(batchId));

export interface VerifyPaymentBody {
  orderId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

export const verifyPayment = (body: VerifyPaymentBody) =>
  apiPost<{ success: boolean; enrollmentId: string }, VerifyPaymentBody>(
    endpoints.batches.verifyPayment,
    body
  );
