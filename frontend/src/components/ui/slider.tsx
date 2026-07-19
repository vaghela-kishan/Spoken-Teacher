import * as React from "react";

import { cn } from "@/lib/utils";

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  /** Fires continuously while dragging — keep this cheap (local state only). */
  onValueChange: (value: number) => void;
  /** Fires once when the drag ends — use this for network saves. */
  onValueCommit?: (value: number) => void;
  className?: string;
  "aria-label"?: string;
}

/**
 * Smooth, gradient-filled range slider.
 *
 * The key to smoothness: `onValueChange` updates local state on every frame
 * (instant, no network), while `onValueCommit` fires only on release — so
 * dragging never spams the API. Styling lives in `.ui-range` (index.css).
 */
export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  onValueCommit,
  className,
  "aria-label": ariaLabel,
}: SliderProps) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  const commit = (e: React.SyntheticEvent<HTMLInputElement>) =>
    onValueCommit?.(Number((e.target as HTMLInputElement).value));

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onValueChange(Number(e.target.value))}
      onMouseUp={commit}
      onTouchEnd={commit}
      onKeyUp={commit}
      className={cn("ui-range", className)}
      style={{ ["--range-pct" as string]: `${pct}%` } as React.CSSProperties}
    />
  );
}
