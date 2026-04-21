import { apiClient } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import { endpoints } from "@/lib/api/endpoints";
import type { Order, OrderHistoryPagination, PaymentStatus } from "@/types/order";

export interface OrderHistoryQuery {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
}

export interface OrderHistoryResponse {
  items: Order[];
  pagination: OrderHistoryPagination;
}

/**
 * Order history uses a non-standard pagination envelope (`currentPage` /
 * `hasPreviousPage` instead of `page` / `hasPrevPage`), so we reach into the
 * raw response rather than using the shared `apiGetPaginated` helper.
 */
export async function listOrders(
  q: OrderHistoryQuery = {}
): Promise<OrderHistoryResponse> {
  try {
    const res = await apiClient.get<{
      success: true;
      data: Order[];
      pagination: OrderHistoryPagination;
    }>(endpoints.orders.history, {
      params: {
        page: q.page ?? 1,
        limit: q.limit ?? 10,
        ...(q.status ? { status: q.status } : {}),
      },
    });
    return { items: res.data.data, pagination: res.data.pagination };
  } catch (err) {
    throw toApiError(err);
  }
}
