import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        // Light: crisp white field with a clearly visible slate border.
        "flex h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-[15px] text-slate-900 shadow-sm transition-all",
        "placeholder:text-slate-400 hover:border-slate-400",
        "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
        // Dark: subtle translucent field with a visible light border.
        "dark:border-white/15 dark:bg-white/[0.05] dark:text-foreground dark:placeholder:text-muted-foreground/60 dark:hover:border-white/25 dark:focus-visible:border-primary dark:focus-visible:bg-white/[0.07]",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
