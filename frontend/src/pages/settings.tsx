import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Monitor, Moon, Sun } from "lucide-react";
import * as React from "react";

import { PageHeader } from "@/components/common/page-header";
import { useTheme } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import { userApi } from "@/features/progress/api";
import { AvatarFace } from "@/features/voice/components/avatar-face";
import { ApiError } from "@/lib/api";
import { qk } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { AvatarStyle, Settings, ThemePreference } from "@/types";

const AVATARS: { value: AvatarStyle; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "professor", label: "Professor" },
  { value: "madam", label: "Madam" },
];

function Row({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const { theme, setTheme } = useTheme();
  const settingsQ = useQuery({ queryKey: qk.settings, queryFn: userApi.getSettings });

  const update = useMutation({
    mutationFn: (patch: Partial<Settings>) => userApi.updateSettings(patch),
    onSuccess: (data) => {
      qc.setQueryData(qk.settings, data);
      toast.success("Settings saved");
    },
  });

  const s = settingsQ.data;
  const [pw, setPw] = React.useState({ current: "", next: "" });

  // Local mirror of the speech-rate slider so dragging is instant; the API save
  // only fires on release (onValueCommit) instead of on every drag frame.
  const [rate, setRate] = React.useState(1);
  React.useEffect(() => {
    if (s) setRate(s.speech_rate);
  }, [s?.speech_rate]); // eslint-disable-line react-hooks/exhaustive-deps

  const changePw = useMutation({
    mutationFn: () => userApi.changePassword(pw.current, pw.next),
    onSuccess: () => {
      toast.success("Password changed");
      setPw({ current: "", next: "" });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to change password"),
  });

  const themeOptions: { value: ThemePreference; icon: typeof Sun; label: string }[] = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Settings" subtitle="Customise your experience and voice preferences." />

      {/* Appearance */}
      <GlassCard className="p-6">
        <h3 className="mb-4 font-semibold">Appearance</h3>
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((o) => (
            <button
              key={o.value}
              onClick={() => {
                setTheme(o.value);
                update.mutate({ theme: o.value });
              }}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors",
                theme === o.value ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent/10",
              )}
            >
              <o.icon className="size-5" />
              <span className="text-sm font-medium">{o.label}</span>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Avatar / teacher character */}
      {s && (
        <GlassCard className="p-6">
          <h3 className="font-semibold">Your teacher</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Choose who greets you in Voice Chat. Your pick speaks and lip-syncs during conversations.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {AVATARS.map((a) => (
              <button
                key={a.value}
                onClick={() => update.mutate({ avatar_style: a.value })}
                className={cn(
                  "group flex flex-col items-center gap-1 overflow-hidden rounded-2xl border p-3 transition-all",
                  s.avatar_style === a.value
                    ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                    : "border-border hover:border-primary/40 hover:bg-accent/10",
                )}
              >
                <div className="pointer-events-none h-[120px] overflow-hidden">
                  <AvatarFace state="idle" variant={a.value} size={110} />
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    s.avatar_style === a.value ? "text-primary" : "text-foreground",
                  )}
                >
                  {a.label}
                </span>
              </button>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Voice */}
      {s && (
        <GlassCard className="p-6">
          <h3 className="mb-2 font-semibold">Voice & practice</h3>
          <div className="divide-y divide-border/60">
            <Row title="Auto-play replies" desc="Aria speaks her responses out loud automatically.">
              <Switch checked={s.auto_play_replies} onCheckedChange={(v) => update.mutate({ auto_play_replies: v })} />
            </Row>
            <Row title="Live corrections" desc="Show grammar corrections as you speak.">
              <Switch checked={s.show_corrections_live} onCheckedChange={(v) => update.mutate({ show_corrections_live: v })} />
            </Row>
            <Row title="Interrupt (barge-in)" desc="Let you cut in while Aria is speaking.">
              <Switch checked={s.interrupt_enabled} onCheckedChange={(v) => update.mutate({ interrupt_enabled: v })} />
            </Row>
            <div className="py-3">
              <Label>Speech rate: {rate.toFixed(1)}x</Label>
              <div className="mt-3">
                <Slider
                  value={rate}
                  min={0.5}
                  max={2}
                  step={0.1}
                  aria-label="Speech rate"
                  onValueChange={setRate}
                  onValueCommit={(v) => update.mutate({ speech_rate: v })}
                />
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Notifications */}
      {s && (
        <GlassCard className="p-6">
          <h3 className="mb-2 font-semibold">Notifications</h3>
          <div className="divide-y divide-border/60">
            <Row title="Email notifications" desc="Product updates and weekly summaries.">
              <Switch checked={s.email_notifications} onCheckedChange={(v) => update.mutate({ email_notifications: v })} />
            </Row>
            <Row title="Daily reminder" desc="A gentle nudge to keep your streak alive.">
              <Switch checked={s.daily_reminder} onCheckedChange={(v) => update.mutate({ daily_reminder: v })} />
            </Row>
          </div>
        </GlassCard>
      )}

      {/* Security */}
      <GlassCard className="p-6">
        <h3 className="mb-4 font-semibold">Change password</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Current password</Label>
            <PasswordInput value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} />
          </div>
          <div>
            <Label>New password</Label>
            <PasswordInput value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            loading={changePw.isPending}
            disabled={pw.current.length < 1 || pw.next.length < 8}
            onClick={() => changePw.mutate()}
          >
            Update password
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
