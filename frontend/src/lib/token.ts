import { env } from "@/config/env";

/** Small wrapper around localStorage for auth tokens. */
export const tokenStore = {
  get access(): string | null {
    return localStorage.getItem(env.tokenKey);
  },
  get refresh(): string | null {
    return localStorage.getItem(env.refreshKey);
  },
  set(access: string, refresh?: string) {
    localStorage.setItem(env.tokenKey, access);
    if (refresh) localStorage.setItem(env.refreshKey, refresh);
  },
  clear() {
    localStorage.removeItem(env.tokenKey);
    localStorage.removeItem(env.refreshKey);
  },
};
