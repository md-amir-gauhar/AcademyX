import type { ApiResponse } from "./api";

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;
