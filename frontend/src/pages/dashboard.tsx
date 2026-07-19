import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  Flame,
  Mic,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { StatCard } from "@/components/common/stat-card";
import { StatCardSkeleton } from "@/components/common/loaders";
import { ScoreRing } from "@/components/common/score-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/features/auth/auth-context";
import { progressApi } from "@/features/progress/api";
import { chatApi } from "@/features/chat/api";
import { qk } from "@/lib/queryClient";
import { compactNumber, formatDuration, timeAgo } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const progressQ = useQuery({ queryKey: qk.progress, queryFn: progressApi.get });
  const statsQ = useQuery({ queryKey: qk.dailyStats(14), queryFn: () => progressApi.dailyStats(14) });
  const convosQ = useQuery({ queryKey: qk.conversations(1), queryFn: () => chatApi.list(1, 5) });
  const achQ = useQuery({ queryKey: qk.achievements, queryFn: progressApi.achievements });

  const p = progressQ.data;
  const xpIntoLevel = p ? p.xp % 500 : 0;
  const firstName = user?.full_name?.split(" ")[0] ?? "there";

  const chartData = (statsQ.data ?? []).map((s) => ({
    date: s.date.slice(5),
    score: s.avg_overall,
    minutes: s.minutes,
  }));

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard className="relative overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Welcome back 👋</p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                Ready to practise, <span className="gradient-text">{firstName}</span>?
              </h1>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {p?.current_streak_days
                  ? `You're on a ${p.current_streak_days}-day streak — keep it alive!`
                  : "Speak for a few minutes today to start a streak."}
              </p>
              <Link to="/app/voice" className="mt-5 inline-block">
                <Button variant="gradient" size="lg">
                  <Mic className="size-4" /> Start speaking <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-6">
              <ScoreRing value={p?.avg_overall ?? 0} size={130} label="Avg score" />
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {progressQ.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Speaking turns"
              value={compactNumber(p?.total_sessions ?? 0)}
              icon={Mic}
              accent="from-violet-500 to-purple-500"
              delay={0}
            />
            <StatCard
              label="Current streak"
              value={`${p?.current_streak_days ?? 0} days`}
              icon={Flame}
              hint={`Longest: ${p?.longest_streak_days ?? 0} days`}
              accent="from-orange-500 to-red-500"
              delay={0.05}
            />
            <StatCard
              label="Time practised"
              value={formatDuration((p?.total_minutes ?? 0) * 60)}
              icon={Clock}
              accent="from-sky-500 to-cyan-500"
              delay={0.1}
            />
            <StatCard
              label="Words spoken"
              value={compactNumber(p?.total_words_spoken ?? 0)}
              icon={TrendingUp}
              accent="from-emerald-500 to-teal-500"
              delay={0.15}
            />
          </>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Trend chart */}
        <GlassCard className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Your speaking score</h3>
              <p className="text-sm text-muted-foreground">Last 14 days</p>
            </div>
            <Badge variant="success">
              <TrendingUp className="size-3" /> {Math.round(p?.avg_overall ?? 0)} avg
            </Badge>
          </div>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ left: -20, right: 8 }}>
                <defs>
                  <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fill="url(#scoreFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-[220px] place-items-center text-center text-sm text-muted-foreground">
              <div>
                <Sparkles className="mx-auto mb-2 size-6 text-primary/60" />
                Speak a little to see your score trend appear here.
              </div>
            </div>
          )}
        </GlassCard>

        {/* Level + achievements */}
        <div className="space-y-5">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
                  <Star className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Level</p>
                  <p className="text-xl font-bold">{p?.level ?? 1}</p>
                </div>
              </div>
              <Badge>{compactNumber(p?.xp ?? 0)} XP</Badge>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Progress to level {(p?.level ?? 1) + 1}</span>
                <span>{xpIntoLevel}/500 XP</span>
              </div>
              <Progress value={(xpIntoLevel / 500) * 100} />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold">
                <Trophy className="size-4 text-yellow-500" /> Achievements
              </h3>
              <Link to="/app/achievements" className="text-xs font-medium text-primary hover:underline">
                View all
              </Link>
            </div>
            {achQ.data && achQ.data.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {achQ.data.slice(0, 4).map((ua) => (
                  <Badge key={ua.achievement.code} variant={ua.achievement.tier as never}>
                    {ua.achievement.title}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="size-4" /> Keep practising to unlock your first badge!
              </p>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Recent conversations */}
      <GlassCard className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Recent conversations</h3>
          <Link to="/app/history" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {convosQ.data && convosQ.data.items.length > 0 ? (
          <div className="divide-y divide-border/60">
            {convosQ.data.items.map((c) => (
              <Link
                key={c.id}
                to="/app/history"
                className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-accent/10"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.message_count} messages · {timeAgo(c.updated_at)}
                  </p>
                </div>
                {c.avg_overall_score != null && (
                  <Badge variant={c.avg_overall_score >= 80 ? "success" : "warning"}>
                    {Math.round(c.avg_overall_score)}
                  </Badge>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No conversations yet — your practice sessions will show up here.
          </p>
        )}
      </GlassCard>
    </div>
  );
}
