import { api } from "@/lib/api";
import { env } from "@/config/env";
import { tokenStore } from "@/lib/token";
import type { AdminAnalytics, AdminOverview, AdminUser, LiveCounters, Paginated } from "@/types";

export const adminApi = {
  overview: () => api.get<AdminOverview>("/admin/overview").then((r) => r.data),
  counters: () => api.get<LiveCounters>("/admin/counters").then((r) => r.data),
  analytics: (days = 30) =>
    api.get<AdminAnalytics>("/admin/analytics", { params: { days } }).then((r) => r.data),
  users: (page = 1, size = 20, q = "") =>
    api
      .get<Paginated<AdminUser>>("/admin/users", { params: { page, size, q: q || undefined } })
      .then((r) => r.data),
  /** Trigger a CSV download of the users report. */
  exportUsersCsv: async () => {
    const res = await fetch(`${env.apiBase}/admin/reports/users.csv`, {
      headers: { Authorization: `Bearer ${tokenStore.access}` },
    });
    // Without this, a 401/500 body gets saved as a bogus "users_report.csv".
    if (!res.ok) throw new Error(`Export failed (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  },
};
