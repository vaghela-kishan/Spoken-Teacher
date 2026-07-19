import { api } from "@/lib/api";
import type { Tokens, User } from "@/types";

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    api.post<User>("/auth/register", payload).then((r) => r.data),

  login: (email: string, password: string) =>
    api.post<Tokens>("/auth/login", { email, password }).then((r) => r.data),

  me: () => api.get<User>("/auth/me").then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }).then((r) => r.data),

  resetPassword: (token: string, new_password: string) =>
    api.post("/auth/reset-password", { token, new_password }).then((r) => r.data),

  verifyEmail: (token: string) =>
    api.post("/auth/verify-email", { token }).then((r) => r.data),

  resendVerification: (email: string) =>
    api.post("/auth/resend-verification", { email }).then((r) => r.data),
};
