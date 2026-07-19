import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, CheckCircle2, Lightbulb, Sparkles, Volume2 } from "lucide-react";

import { ScoreRing } from "@/components/common/score-ring";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { TutorFeedback } from "@/types";

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{Math.round(value)}</span>
      </div>
      <Progress value={value} />
    </div>
  );
}

/** Highlights the incorrect spans inside the original sentence. */
function HighlightedOriginal({ feedback }: { feedback: TutorFeedback }) {
  const text = feedback.original;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  const lower = text.toLowerCase();
  feedback.highlights.forEach((h, idx) => {
    const at = lower.indexOf(h.wrong.toLowerCase(), cursor);
    if (at === -1) return;
    if (at > cursor) parts.push(text.slice(cursor, at));
    parts.push(
      <mark key={idx} className="rounded bg-destructive/20 px-1 font-semibold text-destructive line-through decoration-destructive/60">
        {text.slice(at, at + h.wrong.length)}
      </mark>,
    );
    cursor = at + h.wrong.length;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <p className="text-sm leading-relaxed">{parts.length ? parts : text}</p>;
}

export function FeedbackPanel({ feedback }: { feedback: TutorFeedback | null }) {
  return (
    <AnimatePresence mode="wait">
      {feedback ? (
        <motion.div
          key={feedback.original}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="space-y-4"
        >
          {/* Overall score */}
          <GlassCard className="flex items-center gap-5 p-5">
            <ScoreRing value={feedback.scores.overall} size={104} label="Overall" />
            <div className="flex-1 space-y-2.5">
              <ScoreBar label="Grammar" value={feedback.scores.grammar} />
              <ScoreBar label="Fluency" value={feedback.scores.fluency} />
              <ScoreBar label="Pronunciation" value={feedback.scores.pronunciation} />
              <ScoreBar label="Confidence" value={feedback.scores.confidence} />
            </div>
          </GlassCard>

          {feedback.has_errors ? (
            <GlassCard className="space-y-4 p-5">
              <div>
                <Badge variant="destructive" className="mb-2">
                  Original
                </Badge>
                <HighlightedOriginal feedback={feedback} />
              </div>
              <div>
                <Badge variant="success" className="mb-2">
                  <CheckCircle2 className="size-3" /> Corrected
                </Badge>
                <p className="text-sm font-medium leading-relaxed">{feedback.corrected}</p>
              </div>
              {feedback.native && feedback.native !== feedback.corrected && (
                <div>
                  <Badge variant="default" className="mb-2">
                    <Sparkles className="size-3" /> Native
                  </Badge>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feedback.native}</p>
                </div>
              )}
            </GlassCard>
          ) : (
            <GlassCard className="flex items-center gap-3 border-success/30 bg-success/5 p-5">
              <CheckCircle2 className="size-6 shrink-0 text-success" />
              <p className="text-sm">Great job — that sentence was correct and natural! 🎉</p>
            </GlassCard>
          )}

          {feedback.highlights.length > 0 && (
            <GlassCard className="space-y-3 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Lightbulb className="size-4 text-warning" /> What to fix
              </p>
              {feedback.highlights.map((h, i) => (
                <div key={i} className="rounded-lg bg-muted/40 p-3 text-sm">
                  <span className="text-destructive line-through">{h.wrong}</span>
                  <span className="mx-2 text-muted-foreground">→</span>
                  <span className="font-medium text-success">{h.correction}</span>
                  <p className="mt-1 text-xs text-muted-foreground">{h.reason}</p>
                </div>
              ))}
            </GlassCard>
          )}

          {feedback.grammar_explanation && (
            <GlassCard className="p-5">
              <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="size-4 text-primary" /> Grammar
              </p>
              <p className="text-sm text-muted-foreground">{feedback.grammar_explanation}</p>
            </GlassCard>
          )}

          {feedback.pronunciation_tips && (
            <GlassCard className="p-5">
              <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
                <Volume2 className="size-4 text-accent" /> Pronunciation
              </p>
              <p className="text-sm text-muted-foreground">{feedback.pronunciation_tips}</p>
            </GlassCard>
          )}

          {feedback.vocabulary.length > 0 && (
            <GlassCard className="space-y-2 p-5">
              <p className="text-sm font-semibold">Vocabulary to try</p>
              {feedback.vocabulary.map((v, i) => (
                <div key={i} className="rounded-lg bg-muted/40 p-3 text-sm">
                  <span className="font-semibold text-primary">{v.word}</span> — {v.meaning}
                  <p className="mt-1 text-xs italic text-muted-foreground">“{v.example}”</p>
                </div>
              ))}
            </GlassCard>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid h-full min-h-[300px] place-items-center rounded-2xl border border-dashed text-center"
        >
          <div className="max-w-xs p-6">
            <Sparkles className="mx-auto mb-3 size-8 text-primary/60" />
            <p className="text-sm text-muted-foreground">
              Your live feedback — corrections, scores and tips — will appear here after you speak.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
