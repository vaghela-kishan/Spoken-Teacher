import { Mic } from "lucide-react";

import { cn } from "@/lib/utils";

export function Brand({ collapsed, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30">
        <Mic className="size-5" />
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-tight">AI English</p>
          <p className="text-[11px] font-medium text-muted-foreground">Speaking Tutor</p>
        </div>
      )}
    </div>
  );
}
