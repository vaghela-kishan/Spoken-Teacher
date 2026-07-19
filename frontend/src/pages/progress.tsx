import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/common/page-header";
import { ScoreRing } from "@/components/common/score-ring";
import { GlassCard } from "@/components/ui/card";
import { progressApi } from "@/features/progress/api";
import { qk } from "@/lib/queryClient";

export default function ProgressPage() {
  const progressQ = useQuery({ queryKey: qk.progress, queryFn: progressApi.get });
  const statsQ = useQuery({ queryKey: qk.dailyStats(30), queryFn: () => progressApi.dailyStats(30) });
  const p = progressQ.data;

  const radar = [
    { skill: "Grammar", value: p?.avg_grammar ?? 0 },
    { skill: "Fluency", value: p?.avg_fluency ?? 0 },
    { skill: "Pronunciation", value: p?.avg_pronunciation ?? 0 },
    { skill: "Confidence", value: p?.avg_confidence ?? 0 },
  ];
  const daily = (statsQ.data ?? []).map((s) => ({ date: s.date.slice(5), minutes: s.minutes, xp: s.xp_earned }));

  return (
    <div className="space-y-6">
      <PageHeader title="Learning Progress" subtitle="A detailed look at how your English is improving." />

      <div className="grid gap-5 lg:grid-cols-3">
        <GlassCard className="flex flex-col items-center justify-center p-6">
          <ScoreRing value={p?.avg_overall ?? 0} size={150} label="Overall" />
          <p className="mt-3 text-sm text-muted-foreground">Average speaking score</p>
        </GlassCard>

        <GlassCard className="p-6 lg:col-span-2">
          <h3 className="mb-2 font-semibold">Skill breakdown</h3>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={radar}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.35} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h3 className="mb-4 font-semibold">Daily practice minutes</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={daily} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                cursor={{ fill: "hsl(var(--primary) / 0.08)" }}
              />
              <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                {daily.map((_, i) => (
                  <Cell key={i} fill="hsl(var(--primary))" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="grid grid-cols-2 gap-4 p-6">
          {[
            { label: "Total sessions", value: p?.total_sessions ?? 0 },
            { label: "Corrections learned", value: p?.total_corrections ?? 0 },
            { label: "Longest streak", value: `${p?.longest_streak_days ?? 0}d` },
            { label: "Total minutes", value: p?.total_minutes ?? 0 },
            { label: "Words spoken", value: p?.total_words_spoken ?? 0 },
            { label: "Level", value: p?.level ?? 1 },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-muted/40 p-4">
              <p className="text-2xl font-bold tabular-nums">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </GlassCard>
      </div>
    </div>
  );
}
