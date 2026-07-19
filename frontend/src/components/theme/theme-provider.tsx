import * as React from "react";

import { env } from "@/config/env";
import type { ThemePreference } from "@/types";

type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  toggle: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function systemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<ThemePreference>(
    () => (localStorage.getItem(env.themeKey) as ThemePreference) || "dark",
  );
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>(() =>
    theme === "system" ? systemTheme() : (theme as ResolvedTheme),
  );

  React.useEffect(() => {
    const resolved = theme === "system" ? systemTheme() : (theme as ResolvedTheme);
    setResolvedTheme(resolved);
    const root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
    localStorage.setItem(env.themeKey, theme);
  }, [theme]);

  React.useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolvedTheme(systemTheme());
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = React.useCallback((t: ThemePreference) => setThemeState(t), []);
  const toggle = React.useCallback(
    () => setThemeState(resolvedTheme === "dark" ? "light" : "dark"),
    [resolvedTheme],
  );

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggle }),
    [theme, resolvedTheme, setTheme, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
