import { Navigate, Outlet, useLocation } from "react-router-dom";

import { FullPageLoader } from "@/components/common/loaders";
import { useAuth } from "@/features/auth/auth-context";

/** Requires authentication; redirects to /login preserving the intended path. */
export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader label="Preparing your session…" />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

/** Requires the admin role. */
export function AdminRoute() {
  const { isAdmin, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!isAdmin) return <Navigate to="/app" replace />;
  return <Outlet />;
}

/** For auth pages: if already logged in, bounce to the dashboard. */
export function PublicOnlyRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (isAuthenticated) return <Navigate to="/app" replace />;
  return <Outlet />;
}
