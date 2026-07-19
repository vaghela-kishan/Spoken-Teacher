import axios, { AxiosError, type AxiosRequestConfig } from "axios";

import { env } from "@/config/env";
import { tokenStore } from "@/lib/token";

/**
 * Central Axios instance.
 * - Attaches the access token to every request.
 * - Transparently refreshes an expired access token once, then retries.
 * - Normalises backend error envelopes into thrown `ApiError`s.
 */
export const api = axios.create({
  baseURL: env.apiBase,
  headers: { "Content-Type": "application/json" },
});

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

api.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStore.refresh;
  if (!refresh) return null;
  try {
    const res = await axios.post(`${env.apiBase}/auth/refresh`, { refresh_token: refresh });
    const access = res.data.access_token as string;
    tokenStore.set(access);
    return access;
  } catch {
    tokenStore.clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<any>) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Attempt a single transparent refresh on 401 (expired access token).
    if (error.response?.status === 401 && !original._retry && tokenStore.refresh) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return api(original);
      }
      // refresh failed → force logout
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }

    const data = error.response?.data;
    const message = data?.error?.message ?? data?.detail ?? error.message ?? "Request failed";
    const code = data?.error?.code ?? "error";
    return Promise.reject(new ApiError(message, code, error.response?.status ?? 0));
  },
);
