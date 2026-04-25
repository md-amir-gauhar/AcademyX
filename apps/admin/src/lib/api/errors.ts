import { AxiosError } from "axios";
import type { ApiError as ApiErrorResponse } from "@/types/api";

export class ApiRequestError extends Error {
  status: number;
  fields?: Array<{ field: string; message: string }>;
  retryAfter?: string;

  constructor(
    message: string,
    status: number,
    fields?: Array<{ field: string; message: string }>,
    retryAfter?: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.fields = fields;
    this.retryAfter = retryAfter;
  }
}

export function toApiError(err: unknown): ApiRequestError {
  if (err instanceof ApiRequestError) return err;

  if (err && typeof err === "object" && "isAxiosError" in err) {
    const axiosErr = err as AxiosError<ApiErrorResponse>;
    const status = axiosErr.response?.status ?? 0;
    const data = axiosErr.response?.data;
    const message =
      data?.message ||
      axiosErr.message ||
      (status === 0
        ? "Network error. Please check your connection."
        : "Something went wrong.");
    return new ApiRequestError(
      message,
      status,
      data?.errors,
      data?.error?.retryAfter,
    );
  }

  if (err instanceof Error) return new ApiRequestError(err.message, 0);
  return new ApiRequestError("Unknown error", 0);
}
