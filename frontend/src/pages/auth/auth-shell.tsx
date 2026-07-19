import { motion } from "framer-motion";
import { Gauge, Mic, Sparkles, Zap } from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";

import { Brand } from "@/components/layout/brand";
import { GlassCard } from "@/components/ui/card";
import { AvatarFace } from "@/features/voice/components/avatar-face";
import { SpeakingAvatar } from "@/pages/auth/speaking-avatar";

const chips = [
  { icon: Zap, label: "Replies in ~1–2s" },
  { icon: Gauge, label: "Live speaking scores" },
  { icon: Sparkles, label: "Instant corrections" },
];

/** Branded logo mark rendered in white for the dark hero panel. */
function BrandWhite() {
  return (
    <div className="flex items-center gap-2.5 text-white">
      <div className="grid size-9 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
        <Mic className="size-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold">AI English</p>
        <p className="text-[11px] font-medium text-white/70">Speaking Tutor</p>
      </div>
    </div>
  );
}

/** Small talking avatar shown above the form on mobile (left panel is hidden). */
function SpeakingAvatarMini() {
  const [amp, setAmp] = React.useState(0.2);
  React.useEffect(() => {
    let raf = 0;
    let last = 0;
    const start = performance.now();
    const loop = () => {
      const now = performance.now();
      if (now - last > 60) {
        last = now;
        const t = (now - start) / 1000;
        setAmp(Math.min(1, Math.abs(Math.sin(t * 6) * 0.6 + Math.sin(t * 10) * 0.3)));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <AvatarFace state="speaking" amplitude={amp} size={150} variant="female" />;
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  // Auth screens are always light (the branded left panel is dark by design).
  // Drop the global `dark` class while mounted (layout effect = no flash), restore on leave.
  React.useLayoutEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => {
      if (wasDark) root.classList.add("dark");
    };
  }, []);

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ---------- Left: branded speaking-avatar stage ---------- */}
      <div className="relative hidden flex-col justify-between overflow-hidden px-10 py-6 lg:flex">
        <div className="absolute inset-0 bg-[linear-gradient(150deg,#2a1f6b_0%,#4c2f9e_38%,#7c3aed_72%,#3b1d73_100%)]" />
        <motion.div
          className="absolute -left-20 top-10 size-72 rounded-full bg-fuchsia-500/40 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-16 bottom-20 size-80 rounded-full bg-indigo-500/40 blur-3xl"
          animate={{ x: [0, -24, 0], y: [0, -18, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:36px_36px]" />

        <div className="relative z-10">
          <Link to="/">
            <BrandWhite />
          </Link>
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-2">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4 max-w-md text-center text-2xl font-bold leading-tight tracking-tight text-white xl:text-3xl"
          >
            Talk to a real{" "}
            <span className="bg-gradient-to-r from-fuchsia-200 to-indigo-200 bg-clip-text text-transparent">
              AI teacher
            </span>{" "}
            and speak English with confidence
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <SpeakingAvatar />
          </motion.div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2">
          {chips.map((c) => (
            <span
              key={c.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur"
            >
              <c.icon className="size-3.5" /> {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* ---------- Right: form ---------- */}
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-background px-6 py-5 sm:px-10 lg:min-h-0">
        {/* Soft ambient orbs fill the empty corners so the panel feels intentional */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 size-80 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-28 -left-20 size-80 rounded-full bg-accent/15 blur-3xl" />
          <div className="absolute -bottom-16 right-6 size-56 rounded-full bg-primary/10 blur-3xl" />
        </div>
        {/* Top bar — brand (mobile only; auth is always light so no theme toggle) */}
        <header className="relative flex h-8 shrink-0 items-center lg:hidden">
          <Link to="/">
            <Brand />
          </Link>
        </header>

        {/* Centered card */}
        <main className="relative flex flex-1 items-center justify-center py-3">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg"
          >
            <div className="mb-2 flex justify-center lg:hidden">
              <div className="relative">
                <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-2xl" />
                <div className="relative overflow-hidden" style={{ height: 96 }}>
                  <SpeakingAvatarMini />
                </div>
              </div>
            </div>

            {/* Glow behind the card for extra presence */}
            <div className="relative">
              <div className="pointer-events-none absolute -inset-4 rounded-[32px] bg-gradient-to-br from-primary/20 via-transparent to-accent/20 blur-2xl" />
              <GlassCard className="relative p-7 shadow-2xl shadow-primary/25 sm:p-8">
                <div className="mb-5 text-center">
                  <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/40 ring-1 ring-white/20">
                    <Mic className="size-6" />
                  </div>
                  <h2 className="text-[26px] font-bold leading-tight tracking-[-0.02em] sm:text-[28px]">
                    {title}
                  </h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    {subtitle}
                  </p>
                </div>
                {children}
                {footer && (
                  <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>
                )}
              </GlassCard>
            </div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="relative flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>© 2026 AI English Speaking Tutor</span>
          <span className="hidden sm:inline">·</span>
          <Link to="/" className="transition-colors hover:text-foreground">
            Back to home
          </Link>
        </footer>
      </div>
    </div>
  );
}
