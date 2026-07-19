import { LogOut, Mic, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { navItems } from "@/components/layout/nav-items";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/features/auth/auth-context";
import { cn, getInitials } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, isAdmin, logout } = useAuth();
  const items = navItems.filter((i) => !i.adminOnly || isAdmin);

  return (
    <aside
      className={cn(
        // Always-dark premium sidebar (works over light or dark main content)
        "sticky top-0 z-30 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-white/[0.08]",
        "bg-gradient-to-b from-[#191630] to-[#100e1d] text-slate-300 transition-[width] duration-300 ease-in-out lg:flex",
        collapsed ? "w-[72px]" : "w-[264px]",
      )}
    >
      {/* Ambient top glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-primary/[0.12] to-transparent" />

      {/* ---- Header: brand + toggle ---- */}
      <div
        className={cn(
          "relative flex h-16 items-center px-4",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <Link to="/app" className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30">
              <Mic className="size-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold text-white">AI English</span>
              <span className="block text-[11px] font-medium text-slate-400">Speaking Tutor</span>
            </span>
          </Link>
        )}
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.07] hover:text-white"
        >
          {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
        </button>
      </div>

      {/* ---- Navigation ---- */}
      <nav className="relative flex-1 overflow-y-auto px-3 py-2 no-scrollbar">
        {!collapsed && (
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Menu
          </p>
        )}
        <ul className="space-y-1">
          {items.map((item) => {
            const link = (
              <NavLink
                to={item.to}
                end={item.to === "/app"}
                className={({ isActive }) =>
                  cn(
                    "group relative flex h-11 items-center rounded-xl outline-none transition-colors duration-200",
                    "focus-visible:ring-2 focus-visible:ring-primary/60",
                    isActive
                      ? "bg-gradient-to-r from-primary/30 to-primary/10 font-semibold text-white"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-white",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-opacity duration-200",
                        isActive ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="grid w-12 shrink-0 place-items-center">
                      <item.icon
                        className={cn(
                          "size-5 transition-transform duration-200 group-hover:scale-110",
                          isActive && "text-primary-foreground",
                        )}
                      />
                    </span>
                    {!collapsed && <span className="truncate pr-3 text-sm">{item.label}</span>}
                  </>
                )}
              </NavLink>
            );
            return (
              <li key={item.to}>
                {collapsed ? (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  link
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ---- User card ---- */}
      <div className="relative border-t border-white/[0.08] p-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Link to="/app/profile">
                  <Avatar className="size-9 ring-2 ring-primary/40 transition-transform hover:scale-105">
                    <AvatarImage src={user?.profile?.avatar_url ?? undefined} />
                    <AvatarFallback>{getInitials(user?.full_name)}</AvatarFallback>
                  </Avatar>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{user?.full_name ?? "Profile"}</TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={logout}
                  aria-label="Log out"
                  className="grid size-9 place-items-center rounded-lg text-slate-400 outline-none transition-colors hover:bg-red-500/15 hover:text-red-400 focus-visible:ring-2 focus-visible:ring-primary/60"
                >
                  <LogOut className="size-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Log out</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-2.5">
            <Link to="/app/profile">
              <Avatar className="size-10 ring-2 ring-primary/40 transition-transform hover:scale-105">
                <AvatarImage src={user?.profile?.avatar_url ?? undefined} />
                <AvatarFallback>{getInitials(user?.full_name)}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {user?.full_name ?? "Learner"}
              </p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              aria-label="Log out"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 outline-none transition-colors hover:bg-red-500/15 hover:text-red-400 focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
