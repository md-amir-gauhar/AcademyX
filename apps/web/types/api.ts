export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiPaginatedSuccess<T> {
  success: true;
  data: T[];
  message?: string;
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  totalCount?: number;
  total?: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
  error?: {
    limit?: number;
    windowMs?: number;
    retryAfter?: string;
    resetAt?: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
