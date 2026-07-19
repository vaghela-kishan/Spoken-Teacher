/** Centralised runtime configuration derived from Vite env vars. */
const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

function resolveWsUrl(): string {
  const explicit = import.meta.env.VITE_WS_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  // Same-origin (dev proxy or single-domain prod): derive ws:// from location.
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
