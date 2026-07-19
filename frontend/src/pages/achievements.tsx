import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import * as Icons from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/card";
import { progressApi } from "@/features/progress/api";
import { qk } from "@/lib/queryClient";
import { cn, timeAgo } from "@/lib/utils";
import type { AchievementTier } from "@/types";

const TIER_LABEL: Record<AchievementTier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const pascal = name
    .split("-")
    .map((s) => s[0]?.toUpperCase() + s.slice(1))
    .join("");
  const Cmp = (Icons as unknown as Record<string, Icons.LucideIcon>)[pascal] ?? Icons.Trophy;
  return <Cmp className={className} />;
}

export default function AchievementsPage() {
  const catalogueQ = useQuery({ queryKey: qk.achievementCatalogue, queryFn: progressApi.catalogue });
  const unlockedQ = useQuery({ queryKey: qk.achievements, queryFn: progressApi.achievements });

  const unlockedMap = new Map((unlockedQ.data ?? []).map((u) => [u.achievement.code, u.unlocked_at]));
  const total = catalogueQ.data?.length ?? 0;
  const done = unlockedMap.size;

  return (
    <div>
      <PageHeader
        title="Achievements"
        subtitle="Milestones you unlock as you build your speaking habit."
        actions={
          <Badge variant="default" className="text-sm">
            {done} / {total} unlocked
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {catalogueQ.data?.map((a, i) => {
          const unlockedAt = unlockedMap.get(a.code);
          const unlocked = !!unlockedAt;
          return (
            <motion.div
              key={a.code}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <GlassCard
                className={cn(
                  "relative flex h-full items-start gap-4 p-5 transition-all",
                  unlocked ? "card-hover" : "opacity-70 grayscale",
                )}
              >
                <div
                  className={cn(
                    "grid size-12 shrink-0 place-items-center rounded-xl text-white shadow-lg",
                    unlocked ? "bg-gradient-to-br from-primary to-accent" : "bg-muted-foreground/40",
                  )}
                >
                  {unlocked ? <DynamicIcon name={a.icon} className="size-6" /> : <Lock className="size-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{a.title}</h3>
                    <Badge variant={a.tier as never}>{TIER_LABEL[a.tier]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-primary">+{a.xp_reward} XP</span>
                    {unlocked && <span className="text-muted-foreground">Unlocked {timeAgo(unlockedAt)}</span>}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
