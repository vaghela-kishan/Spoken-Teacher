import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, X } from "lucide-react";
import * as React from "react";
import { NavLink, useLocation } from "react-router-dom";

import { Brand } from "@/components/layout/brand";
import { navItems } from "@/components/layout/nav-items";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";

export function Topbar() {
  const [open, setOpen] = React.useState(false);
  const { isAdmin, logout } = useAuth();
  const location = useLocation();
  const items = navItems.filter((i) => !i.adminOnly || isAdmin);

  React.useEffect(() => setOpen(false), [location.pathname]);

  const title = items.find((i) => i.to === location.pathname)?.label ?? "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
          <Menu className="size-5" />
        </Button>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
      </div>

      {/* Mobile slide-over nav */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 240 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-card p-4 shadow-2xl lg:hidden"
            >
              <div className="mb-4 flex items-center justify-between">
                <Brand />
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <X className="size-5" />
                </Button>
              </div>
              <nav className="flex-1 space-y-1">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/app"}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-gradient-to-r from-primary/20 to-accent/10 text-primary ring-1 ring-inset ring-primary/25"
                          : "text-muted-foreground hover:bg-accent/15 hover:text-foreground",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className="size-5" />
                        {item.label}
                        {isActive && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
              <Button variant="outline" onClick={logout} className="w-full">
                <LogOut className="size-4" /> Log out
              </Button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
