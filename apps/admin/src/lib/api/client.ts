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

let getToken: (() => string | null) | null = null;
let onUnauthorized: (() => void) | null = null;

export function configureAuthBridge(bridge: {
  getToken: () => string | null;
  onUnauthorized: () => void;
}) {
  getToken = bridge.getToken;
  onUnauthorized = bridge.onUnauthorized;
}

export const adminClient: AxiosInstance = axios.create({
  baseURL: `${env.apiUrl.replace(/\/$/, "")}/admin`,
  timeout: 20_000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

adminClient.interceptors.request.use((config) => {
  const token = getToken?.();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

adminClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry) {
      onUnauthorized?.();
    }

    return Promise.reject(error);
  },
);

export async function apiGet<T>(path: string, config?: AxiosRequestConfig) {
  try {
    const res = await adminClient.get<ApiSuccess<T>>(path, config);
    return res.data.data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function apiGetPaginated<T>(
  path: string,
  config?: AxiosRequestConfig,
) {
  try {
    const res = await adminClient.get<ApiPaginatedSuccess<T>>(path, config);
    return { items: res.data.data, pagination: res.data.pagination };
  } catch (err) {
    throw toApiError(err);
  }
}

export async function apiGetRaw<T>(path: string, config?: AxiosRequestConfig) {
  try {
    const res = await adminClient.get<T>(path, config);
    return res.data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function apiPost<T, Body = unknown>(
  path: string,
  body?: Body,
  config?: AxiosRequestConfig,
) {
  try {
    const res = await adminClient.post<ApiSuccess<T>>(path, body, config);
    return res.data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function apiPut<T, Body = unknown>(
  path: string,
  body?: Body,
  config?: AxiosRequestConfig,
) {
  try {
    const res = await adminClient.put<ApiSuccess<T>>(path, body, config);
    return res.data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function apiPatch<T, Body = unknown>(
  path: string,
  body?: Body,
  config?: AxiosRequestConfig,
) {
  try {
    const res = await adminClient.patch<ApiSuccess<T>>(path, body, config);
    return res.data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function apiDelete<T>(
  path: string,
  config?: AxiosRequestConfig,
) {
  try {
    const res = await adminClient.delete<ApiSuccess<T>>(path, config);
    return res.data;
  } catch (err) {
    throw toApiError(err);
  }
}
