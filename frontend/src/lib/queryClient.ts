import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Centralised query keys to avoid string drift. */
export const qk = {
  me: ["me"] as const,
  settings: ["settings"] as const,
  progress: ["progress"] as const,
  achievements: ["achievements"] as const,
  achievementCatalogue: ["achievements", "catalogue"] as const,
  dailyStats: (days: number) => ["stats", "daily", days] as const,
  conversations: (page: number) => ["conversations", page] as const,
  conversation: (id: string) => ["conversation", id] as const,
  voiceHistory: (page: number) => ["voice", "history", page] as const,
  liveCounters: ["stats", "live"] as const,
  adminOverview: ["admin", "overview"] as const,
  adminAnalytics: (days: number) => ["admin", "analytics", days] as const,
  adminUsers: (page: number, q: string) => ["admin", "users", page, q] as const,
};
