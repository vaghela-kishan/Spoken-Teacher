import { Loader2 } from "lucide-react";

import { GlassCard } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function FullPageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background aurora">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm">{label}</p>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="size-11 rounded-xl" />
      </div>
    </GlassCard>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <GlassCard key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
