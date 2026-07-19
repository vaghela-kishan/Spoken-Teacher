import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Download,
  MessageSquare,
  Mic,
  Radio,
  SpellCheck,
  UserPlus,
  Users,
} from "lucide-react";
import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { adminApi } from "@/features/admin/api";
import { qk } from "@/lib/queryClient";
import { compactNumber, formatDuration, getInitials, timeAgo } from "@/lib/utils";

const chartTooltip = {
  contentStyle: {
    background: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 12,
    fontSize: 12,
  },
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <GlassCard className="p-5">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </GlassCard>
  );
}

export default function AdminPage() {
  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState("");
  const [search, setSearch] = React.useState("");

  const overviewQ = useQuery({
    queryKey: qk.adminOverview,
    queryFn: adminApi.overview,
    refetchInterval: 10_000,
  });
  const analyticsQ = useQuery({ queryKey: qk.adminAnalytics(30), queryFn: () => adminApi.analytics(30) });
  const usersQ = useQuery({ queryKey: qk.adminUsers(page, search), queryFn: () => adminApi.users(page, 12, search) });

  const o = overviewQ.data;
  const a = analyticsQ.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Platform health, growth and engagement at a glance."
        actions={
          <Button
            variant="outline"
            onClick={() =>
              adminApi.exportUsersCsv().catch(() => toast.error("Couldn't export the CSV report"))
            }
          >
            <Download className="size-4" /> Export CSV
          </Button>
        }
      />

      {/* Live counters strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={compactNumber(o?.total_users ?? 0)} icon={Users} accent="from-violet-500 to-purple-500" />
        <StatCard
          label="Online now"
          value={o?.online_users ?? 0}
          icon={Radio}
          hint="Live"
          accent="from-emerald-500 to-green-500"
        />
        <StatCard label="Active today" value={o?.active_today ?? 0} icon={Activity} accent="from-sky-500 to-cyan-500" />
        <StatCard
          label="Avg session"
          value={formatDuration(o?.avg_session_seconds ?? 0)}
          icon={UserPlus}
          accent="from-orange-500 to-red-500"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Conversations" value={compactNumber(o?.total_conversations ?? 0)} icon={MessageSquare} accent="from-indigo-500 to-blue-500" />
        <StatCard label="Voice messages" value={compactNumber(o?.total_voice_messages ?? 0)} icon={Mic} accent="from-pink-500 to-rose-500" />
        <StatCard label="Corrections" value={compactNumber(o?.total_corrections ?? 0)} icon={SpellCheck} accent="from-amber-500 to-yellow-500" />
      </div>

      {/* Analytics */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="User growth (30d)">
          <AreaChart data={a?.user_growth ?? []} margin={{ left: -18 }}>
            <defs>
              <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" hide />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip {...chartTooltip} />
            <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#ug)" />
          </AreaChart>
        </ChartCard>

        <ChartCard title="Conversations per day">
          <BarChart data={a?.conversations_per_day ?? []} margin={{ left: -18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" hide />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip {...chartTooltip} cursor={{ fill: "hsl(var(--primary) / 0.08)" }} />
            <Bar dataKey="value" fill="hsl(var(--accent))" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Corrections per day">
          <BarChart data={a?.corrections_per_day ?? []} margin={{ left: -18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" hide />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip {...chartTooltip} cursor={{ fill: "hsl(var(--primary) / 0.08)" }} />
            <Bar dataKey="value" fill="hsl(var(--warning))" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Average score per day">
          <LineChart data={a?.avg_score_per_day ?? []} margin={{ left: -18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" hide />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip {...chartTooltip} />
            <Line type="monotone" dataKey="value" stroke="hsl(var(--success))" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ChartCard>
      </div>

      {/* Users table */}
      <GlassCard className="p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-semibold">Users</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(q);
            }}
            className="flex gap-2"
          >
            <Input placeholder="Search email or name…" value={q} onChange={(e) => setQ(e.target.value)} className="sm:w-64" />
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 font-medium">User</th>
                <th className="pb-2 font-medium">Role</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 text-right font-medium">Sessions</th>
                <th className="pb-2 text-right font-medium">Level</th>
                <th className="pb-2 text-right font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {usersQ.data?.items.map((u) => (
                <tr key={u.id} className="hover:bg-accent/5">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-8 text-xs">
                        <AvatarFallback>{getInitials(u.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{u.full_name ?? "—"}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                  </td>
                  <td>
                    <Badge variant={u.is_verified ? "success" : "warning"}>
                      {u.is_verified ? "Verified" : "Pending"}
                    </Badge>
                  </td>
                  <td className="text-right tabular-nums">{u.total_sessions}</td>
                  <td className="text-right tabular-nums">{u.level}</td>
                  <td className="text-right text-xs text-muted-foreground">{timeAgo(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {usersQ.data && usersQ.data.pages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {usersQ.data.pages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= usersQ.data.pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
