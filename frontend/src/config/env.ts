/** Centralised runtime configuration derived from Vite env vars. */

// Preferred: build-time override. Empty in dev => same-origin (Vite proxy).
const EXPLICIT = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

/**
 * Production fallback when VITE_API_URL wasn't provided at build time.
 * The frontend (…-web.onrender.com) and backend (…-api.onrender.com) are
 * separate Render services, so derive the API host from the current web host.
 */
function derivedApiUrl(): string {
  if (typeof window === "undefined") return "";
  const { protocol, hostname } = window.location;
  if (hostname.endsWith(".onrender.com") && hostname.includes("-web")) {
    return `${protocol}//${hostname.replace("-web", "-api")}`;
  }
  return "";
}

const API_URL = EXPLICIT || derivedApiUrl();

function resolveWsUrl(): string {
  const explicit = import.meta.env.VITE_WS_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  // Derive ws:// from the API host so voice chat hits the backend, not the
  // static frontend. Falls back to same-origin (dev proxy / single domain).
  if (API_URL) return API_URL.replace(/^http/, "ws");
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}`;
}

export const env = {
  apiUrl: API_URL, // "" => same-origin (Vite proxy / NGINX)
  apiBase: `${API_URL}/api/v1`,
  get wsUrl(): string {
    return resolveWsUrl();
  },
  tokenKey: "aet.access_token",
  refreshKey: "aet.refresh_token",
  themeKey: "aet.theme",
};
