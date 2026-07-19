import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Gauge,
  MessageSquare,
  Mic,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-context";
import { metaApi } from "@/features/progress/api";
import { compactNumber } from "@/lib/utils";
import type { LiveCounters } from "@/types";

const features = [
  { icon: Mic, title: "Speak naturally", desc: "Just talk. Aria listens and replies in ~1–2 seconds, like a real teacher." },
  { icon: Sparkles, title: "Instant corrections", desc: "See the fix, the native phrasing, grammar notes and pronunciation tips." },
  { icon: Gauge, title: "Live scoring", desc: "Confidence, pronunciation, fluency, grammar and an overall speaking score." },
  { icon: TrendingUp, title: "Track progress", desc: "Streaks, XP, levels and beautiful analytics keep you motivated." },
  { icon: MessageSquare, title: "ChatGPT-style chat", desc: "Every conversation is saved so you can review and replay it any time." },
  { icon: Trophy, title: "Earn achievements", desc: "Unlock badges as you hit milestones and build a daily speaking habit." },
];

function CounterPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold tabular-nums sm:text-4xl">{compactNumber(value)}</p>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const { data } = useQuery<LiveCounters>({
    queryKey: ["stats", "live"],
    queryFn: metaApi.liveCounters,
    refetchInterval: 15_000,
  });

  return (
    <div className="min-h-screen bg-background aurora">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
        <Brand />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to={isAuthenticated ? "/app" : "/login"}>
            <Button variant="ghost">{isAuthenticated ? "Dashboard" : "Log in"}</Button>
          </Link>
          <Link to={isAuthenticated ? "/app/voice" : "/register"}>
            <Button variant="gradient">Get started</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-10 text-center sm:px-6 sm:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            <Sparkles className="size-4" /> Powered by Google Gemini
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
            Speak English fluently with your <span className="gradient-text">AI teacher</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Practise real conversations out loud. Get instant corrections, pronunciation tips and
            speaking scores — and watch your confidence grow every day.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to={isAuthenticated ? "/app/voice" : "/register"}>
              <Button variant="gradient" size="lg" className="w-full sm:w-auto">
                Start speaking free <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                I already have an account
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Live counters */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mx-auto mt-14 max-w-3xl"
        >
          <GlassCard className="p-6">
            <div className="mb-4 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-success" />
              </span>
              Live community activity
            </div>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <CounterPill label="Total learners" value={data?.total_users ?? 0} />
              <CounterPill label="Online now" value={data?.online_users ?? 0} />
              <CounterPill label="Active today" value={data?.active_today ?? 0} />
              <CounterPill label="New this week" value={data?.new_this_week ?? 0} />
            </div>
          </GlassCard>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <GlassCard className="card-hover h-full p-6">
                <div className="mb-4 grid size-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg">
                  <f.icon className="size-6" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <Brand />
          <div className="flex items-center gap-2">
            <Users className="size-4" /> Join {compactNumber(data?.total_users ?? 0)}+ learners today
          </div>
          <p>© 2026 AI English Speaking Tutor</p>
        </div>
      </footer>
    </div>
  );
}
