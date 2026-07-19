import { api } from "@/lib/api";
import type {
  Achievement,
  DailyStat,
  Paginated,
  Progress,
  Settings,
  User,
  UserAchievement,
  VoiceRecording,
} from "@/types";

export const progressApi = {
  get: () => api.get<Progress>("/progress").then((r) => r.data),
  achievements: () => api.get<UserAchievement[]>("/progress/achievements").then((r) => r.data),
  catalogue: () =>
    api.get<Achievement[]>("/progress/achievements/catalogue").then((r) => r.data),
  dailyStats: (days = 30) =>
    api.get<DailyStat[]>("/progress/stats/daily", { params: { days } }).then((r) => r.data),
};

export const voiceApi = {
  history: (page = 1, size = 20) =>
    api
      .get<Paginated<VoiceRecording>>("/voice/history", { params: { page, size } })
      .then((r) => r.data),
  capabilities: () =>
    api
      .get<{ server_stt: boolean; server_tts: boolean }>("/voice/capabilities")
      .then((r) => r.data),
};

export const userApi = {
  me: () => api.get<User>("/users/me").then((r) => r.data),
  updateProfile: (data: Record<string, unknown>) =>
    api.patch<User>("/users/me", data).then((r) => r.data),
  getSettings: () => api.get<Settings>("/users/me/settings").then((r) => r.data),
  updateSettings: (data: Partial<Settings>) =>
    api.patch<Settings>("/users/me/settings", data).then((r) => r.data),
  changePassword: (current_password: string, new_password: string) =>
    api.post("/users/me/change-password", { current_password, new_password }).then((r) => r.data),
};

export const metaApi = {
  liveCounters: () => api.get("/stats/live").then((r) => r.data),
  heartbeat: () => api.post("/presence/heartbeat").then((r) => r.data),
};
