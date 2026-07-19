import { createBrowserRouter } from "react-router-dom";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AdminRoute, ProtectedRoute, PublicOnlyRoute } from "@/router/guards";

import AchievementsPage from "@/pages/achievements";
import AdminPage from "@/pages/admin";
import DashboardPage from "@/pages/dashboard";
import ForgotPasswordPage from "@/pages/auth/forgot-password";
import HistoryPage from "@/pages/history";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/auth/login";
import NotFoundPage from "@/pages/not-found";
import ProfilePage from "@/pages/profile";
import ProgressPage from "@/pages/progress";
import RegisterPage from "@/pages/auth/register";
import ResetPasswordPage from "@/pages/auth/reset-password";
import SettingsPage from "@/pages/settings";
import VerifyEmailPage from "@/pages/auth/verify-email";
import VoiceChatPage from "@/pages/voice";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
    ],
  },
  // Verify email works whether or not the user is logged in.
  { path: "/verify-email", element: <VerifyEmailPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/app",
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "voice", element: <VoiceChatPage /> },
          { path: "history", element: <HistoryPage /> },
          { path: "progress", element: <ProgressPage /> },
          { path: "achievements", element: <AchievementsPage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "settings", element: <SettingsPage /> },
          {
            element: <AdminRoute />,
            children: [{ path: "admin", element: <AdminPage /> }],
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
