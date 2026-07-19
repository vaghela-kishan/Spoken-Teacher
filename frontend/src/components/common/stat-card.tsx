import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { GlassCard } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  accent?: string; // tailwind gradient classes for the icon chip
  delay?: number;
}

export function StatCard({ label, value, icon: Icon, hint, accent = "from-primary to-accent", delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <GlassCard className="card-hover p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div className={cn("grid size-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg", accent)}>
            <Icon className="size-5" />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
