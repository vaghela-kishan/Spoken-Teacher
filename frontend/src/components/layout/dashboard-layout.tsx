import * as React from "react";
import { Outlet } from "react-router-dom";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { usePresenceHeartbeat } from "@/hooks/use-presence";

export function DashboardLayout() {
  const [collapsed, setCollapsed] = React.useState(
    () => localStorage.getItem("aet.sidebar") === "collapsed",
  );
  usePresenceHeartbeat();

  const toggle = React.useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("aet.sidebar", next ? "collapsed" : "expanded");
      return next;
    });
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="relative flex-1 overflow-x-hidden">
          <div className="pointer-events-none absolute inset-0 aurora opacity-60" />
          <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
