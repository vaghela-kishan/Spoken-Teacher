import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import { PageHeader } from "@/components/common/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/auth-context";
import { userApi } from "@/features/progress/api";
import { qk } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils";
import type { ProficiencyLevel } from "@/types";

const LEVELS: ProficiencyLevel[] = [
  "beginner",
  "elementary",
  "intermediate",
  "upper_intermediate",
  "advanced",
];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const qc = useQueryClient();
  const meQ = useQuery({ queryKey: qk.me, queryFn: userApi.me });

  const [form, setForm] = React.useState({
    full_name: "",
    bio: "",
    native_language: "",
    country: "",
    proficiency: "beginner" as ProficiencyLevel,
    target_accent: "us",
    daily_goal_minutes: 15,
    avatar_url: "",
  });

  React.useEffect(() => {
    const u = meQ.data;
    if (!u) return;
    setForm({
      full_name: u.full_name ?? "",
      bio: u.profile?.bio ?? "",
      native_language: u.profile?.native_language ?? "",
      country: u.profile?.country ?? "",
      proficiency: u.profile?.proficiency ?? "beginner",
      target_accent: u.profile?.target_accent ?? "us",
      daily_goal_minutes: u.profile?.daily_goal_minutes ?? 15,
      avatar_url: u.profile?.avatar_url ?? "",
    });
  }, [meQ.data]);

  const save = useMutation({
    mutationFn: () => userApi.updateProfile(form),
    onSuccess: async () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: qk.me });
      await refreshUser();
    },
    onError: () => toast.error("Could not save profile"),
  });

  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Profile" subtitle="Tell Aria about yourself so lessons fit you better." />

      <GlassCard className="mb-5 flex items-center gap-4 p-6">
        <Avatar className="size-16 text-lg">
          <AvatarImage src={form.avatar_url || undefined} />
          <AvatarFallback>{getInitials(form.full_name || user?.full_name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-lg font-semibold">{form.full_name || "Your name"}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <div className="mt-1 flex gap-2">
            <Badge variant={user?.is_verified ? "success" : "warning"}>
              {user?.is_verified ? "Verified" : "Unverified"}
            </Badge>
            <Badge variant="secondary">{user?.role}</Badge>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Full name</Label>
            <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
          </div>
          <div>
            <Label>Avatar URL</Label>
            <Input value={form.avatar_url} onChange={(e) => set("avatar_url", e.target.value)} placeholder="https://…" />
          </div>
          <div>
            <Label>Native language</Label>
            <Input value={form.native_language} onChange={(e) => set("native_language", e.target.value)} placeholder="e.g. Gujarati" />
          </div>
          <div>
            <Label>Country</Label>
            <Input value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="e.g. India" />
          </div>
          <div>
            <Label>Proficiency</Label>
            <select
              value={form.proficiency}
              onChange={(e) => set("proficiency", e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-background/60 px-3 text-sm outline-none"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Target accent</Label>
            <select
              value={form.target_accent}
              onChange={(e) => set("target_accent", e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-background/60 px-3 text-sm outline-none"
            >
              <option value="us">American (US)</option>
              <option value="uk">British (UK)</option>
              <option value="au">Australian (AU)</option>
            </select>
          </div>
        </div>
        <div>
          <Label>Bio</Label>
          <Textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="A few words about your goals…" />
        </div>
        <div>
          <Label>Daily goal: {form.daily_goal_minutes} minutes</Label>
          <div className="mt-3">
            <Slider
              value={form.daily_goal_minutes}
              min={5}
              max={120}
              step={5}
              aria-label="Daily goal in minutes"
              onValueChange={(v) => set("daily_goal_minutes", v)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="gradient" loading={save.isPending} onClick={() => save.mutate()}>
            Save changes
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
