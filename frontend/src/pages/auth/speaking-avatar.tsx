import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import * as React from "react";

import { AvatarFace, type AvatarVariant } from "@/features/voice/components/avatar-face";

const EXAMPLES = [
  { wrong: "I goes market yesterday", right: "I went to the market yesterday.", score: 92 },
  { wrong: "She don't like coffee", right: "She doesn't like coffee.", score: 88 },
  { wrong: "I am agree with you", right: "I agree with you.", score: 90 },
];

const TEACHERS: { v: AvatarVariant; label: string }[] = [
  { v: "female", label: "Aria" },
  { v: "male", label: "Leo" },
  { v: "professor", label: "Prof. Ray" },
  { v: "madam", label: "Ms. Eve" },
];

/** Voice equalizer — always-moving bars that read as "speaking".
 * Animates `scaleY` (GPU-composited) rather than `height` (layout each frame). */
function Equalizer() {
  const bars = [16, 30, 22, 40, 26, 44, 20, 34, 24, 38, 18, 30, 14];
  return (
    <div className="flex h-9 items-end justify-center gap-[5px]" aria-hidden>
      {bars.map((h, i) => (
        <motion.span
          key={i}
          className="w-[5px] rounded-full bg-gradient-to-t from-primary to-accent"
          style={{ height: h, transformOrigin: "bottom" }}
          animate={{ scaleY: [0.2, 1, 0.35, 0.75, 0.2] }}
          transition={{
            duration: 0.9 + (i % 4) * 0.12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.05,
          }}
        />
      ))}
    </div>
  );
}

/**
 * The auth "hero": a half-body teacher who visibly talks (animated lip-sync),
 * a live voice-wave equalizer, and — below her, never covering the face — a
 * card that demos a real-time correction. Communicates at a glance that this
 * is an AI *speaking* tutor.
 */
export function SpeakingAvatar() {
  const [amp, setAmp] = React.useState(0.25);
  const [ex, setEx] = React.useState(0);

  React.useEffect(() => {
    let raf = 0;
    let last = 0;
    const start = performance.now();
    const loop = () => {
      const now = performance.now();
      // ~13fps is plenty for a decorative talking mouth (framer springs smooth
      // between frames) and keeps the login page light on re-renders.
      if (now - last > 75) {
        last = now;
        const t = (now - start) / 1000;
        const speech = Math.abs(Math.sin(t * 6) * 0.5 + Math.sin(t * 11.3) * 0.3);
        const envelope = 0.35 + ((Math.sin(t * 0.8) + 1) / 2) * 0.65;
        setAmp(Math.min(1, speech * envelope));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  React.useEffect(() => {
    const id = setInterval(() => setEx((i) => (i + 1) % EXAMPLES.length), 4200);
    return () => clearInterval(id);
  }, []);

  const example = EXAMPLES[ex];

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Avatar + live badge (nothing overlaps the face) */}
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-1 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          Speaking live
        </motion.div>

        <div className="pointer-events-none absolute inset-x-6 bottom-6 top-10 rounded-[40%] bg-gradient-to-b from-primary/25 to-accent/25 blur-3xl" />

        <AvatarFace state="speaking" amplitude={amp} size={168} variant="female" />
      </div>

      {/* Voice waves */}
      <Equalizer />

      {/* Live-correction card — BELOW the avatar, fixed height to avoid jumps */}
      <div className="flex h-[86px] w-[280px] items-start">
        <AnimatePresence mode="wait">
          <motion.div
            key={ex}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.35 }}
            className="w-full rounded-2xl border border-white/15 bg-white/90 p-3.5 shadow-xl backdrop-blur-xl dark:bg-slate-900/80"
          >
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="size-3" /> Live correction
              </span>
              <span className="grid size-7 place-items-center rounded-full bg-success/15 text-[11px] font-bold text-success">
                {example.score}
              </span>
            </div>
            <p className="text-sm text-destructive line-through decoration-destructive/50">
              {example.wrong}
            </p>
            <p className="mt-1 flex items-start gap-1 text-sm font-medium text-foreground">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
              {example.right}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Teacher line-up */}
      <div>
        <p className="mb-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-white/60">
          4 teachers to speak with
        </p>
        <div className="flex items-end justify-center gap-2">
          {TEACHERS.map((t) => (
            <div key={t.v} className="flex flex-col items-center">
              <div className="grid size-12 place-items-center overflow-hidden rounded-xl border border-white/15 bg-white/5">
                <div className="translate-y-0.5">
                  <AvatarFace state="idle" size={46} variant={t.v} />
                </div>
              </div>
              <span className="mt-0.5 text-[10px] font-medium text-white/70">{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
