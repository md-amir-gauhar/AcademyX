import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { env } from "@/lib/env";
import { toApiError } from "./errors";
import type { ApiSuccess, ApiPaginatedSuccess } from "@/types/api";

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let pendingRefresh: Promise<string | null> | null = null;
let onUnauthorized: (() => void) | null = null;
let getTokens: (() => { accessToken?: string | null; refreshToken?: string | null }) | null = null;
let setAccessToken: ((token: string) => void) | null = null;

/**
 * Wire the auth store callbacks after the store is created. Called once from
 * the client-side providers module to avoid circular imports.
 */
export function configureAuthBridge(bridge: {
  getTokens: () => { accessToken?: string | null; refreshToken?: string | null };
  setAccessToken: (token: string) => void;
  onUnauthorized: () => void;
}) {
  getTokens = bridge.getTokens;
  setAccessToken = bridge.setAccessToken;
  onUnauthorized = bridge.onUnauthorized;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${env.apiUrl.replace(/\/$/, "")}/api`,
  timeout: 20_000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = getTokens?.().accessToken;
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry) {
      const refreshToken = getTokens?.().refreshToken;
      if (!refreshToken) {
        onUnauthorized?.();
        return Promise.reject(error);
      }

      original._retry = true;
      try {
        if (!pendingRefresh) {
          pendingRefresh = refreshAccessToken(refreshToken);
        }
        const newToken = await pendingRefresh;
        pendingRefresh = null;
        if (!newToken) {
          onUnauthorized?.();
          return Promise.reject(error);
        }
        setAccessToken?.(newToken);
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization =
          `Bearer ${newToken}`;
        return apiClient(original);
      } catch (refreshErr) {
        pendingRefresh = null;
        onUnauthorized?.();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

async function refreshAccessToken(refreshToken: string) {
  try {
    const res = await axios.post<ApiSuccess<{ accessToken: string }>>(
      `${env.apiUrl.replace(/\/$/, "")}/api/auth/refresh-token`,
      { refreshToken },
      { headers: { "Content-Type": "application/json" } }
    );
    return res.data?.data?.accessToken ?? null;
  } catch {
    return null;
  }
}

/* ----------------------- Typed helpers ------------------------------------ */

export async function apiGet<T>(path: string, config?: AxiosRequestConfig) {
  try {
    const res = await apiClient.get<ApiSuccess<T>>(path, config);
    return res.data.data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function apiGetPaginated<T>(
  path: string,
  config?: AxiosRequestConfig
) {
  try {
    const res = await apiClient.get<ApiPaginatedSuccess<T>>(path, config);
    return { items: res.data.data, pagination: res.data.pagination };
  } catch (err) {
    throw toApiError(err);
  }
}

export async function apiPost<T, Body = unknown>(
  path: string,
  body?: Body,
  config?: AxiosRequestConfig
) {
  try {
    const res = await apiClient.post<ApiSuccess<T>>(path, body, config);
    return res.data.data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function apiPut<T, Body = unknown>(
  path: string,
  body?: Body,
  config?: AxiosRequestConfig
) {
  try {
    const res = await apiClient.put<ApiSuccess<T>>(path, body, config);
    return res.data.data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function apiDelete<T>(path: string, config?: AxiosRequestConfig) {
  try {
    const res = await apiClient.delete<ApiSuccess<T>>(path, config);
    return res.data.data;
  } catch (err) {
    throw toApiError(err);
  }
}
