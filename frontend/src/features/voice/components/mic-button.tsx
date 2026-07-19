import { motion } from "framer-motion";
import { Loader2, Mic, MicOff } from "lucide-react";

import { cn } from "@/lib/utils";

export type MicState = "off" | "listening" | "thinking" | "speaking";

interface MicButtonProps {
  micState: MicState;
  disabled?: boolean;
  onToggle: () => void;
}

/**
 * One button that both toggles the conversation and clearly shows the mic state:
 * - off       → gradient mic ("tap to start")
 * - listening → green, pulsing rings, mic ON (you speak now)
 * - thinking  → grey, spinner (Aria is preparing a reply)
 * - speaking  → grey, mic-OFF icon (mic is off while Aria talks)
 * Tapping it at any active state ends the conversation.
 */
export function MicButton({ micState, disabled, onToggle }: MicButtonProps) {
  const listening = micState === "listening";
  const active = micState !== "off";
  const micIsOff = micState === "thinking" || micState === "speaking";

  return (
    <div className="relative grid place-items-center">
      {/* Pulsing rings only while actually listening */}
      {listening && (
        <>
          <span className="absolute size-24 animate-pulse-ring rounded-full bg-emerald-500/40" />
          <span className="absolute size-24 animate-pulse-ring rounded-full bg-emerald-500/30 [animation-delay:0.5s]" />
        </>
      )}
      <motion.button
        whileTap={{ scale: 0.92 }}
        disabled={disabled}
        onClick={onToggle}
        className={cn(
          "relative grid size-20 place-items-center rounded-full text-white shadow-xl transition-colors duration-300 disabled:opacity-50",
          micState === "off" &&
            "bg-gradient-to-br from-primary to-accent shadow-primary/40 hover:brightness-110",
          listening && "bg-emerald-500 shadow-emerald-500/50",
          micIsOff && "bg-slate-400 shadow-black/20 dark:bg-slate-600",
        )}
        aria-label={active ? "End conversation" : "Start conversation"}
      >
        {micState === "thinking" ? (
          <Loader2 className="size-8 animate-spin" />
        ) : micIsOff ? (
          <MicOff className="size-8" />
        ) : (
          <Mic className="size-8" />
        )}
      </motion.button>
    </div>
  );
}

/** Animated bars used while the mic is picking up speech.
 * Animates `scaleY` (GPU) instead of `height` (layout) for smoothness. */
export function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-8 items-center justify-center gap-1">
      {Array.from({ length: 9 }).map((_, i) => {
        const h = [6, 22, 10, 26, 8][i % 5];
        return (
          <motion.span
            key={i}
            className="w-1 rounded-full bg-emerald-500"
            style={{ height: h, transformOrigin: "center" }}
            animate={active ? { scaleY: [0.35, 1, 0.55, 0.9, 0.35] } : { scaleY: 6 / h }}
            transition={{
              duration: 0.6,
              repeat: active ? Infinity : 0,
              ease: "easeInOut",
              delay: i * 0.06,
            }}
          />
        );
      })}
    </div>
  );
}
