import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquareOff, Sparkles, TriangleAlert } from "lucide-react";
import * as React from "react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { GlassCard } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { userApi } from "@/features/progress/api";
import { AvatarFace, type AvatarState } from "@/features/voice/components/avatar-face";
import { ChatMessage, TypingBubble } from "@/features/voice/components/chat-message";
import { FeedbackPanel } from "@/features/voice/components/feedback-panel";
import { MicButton, type MicState, Waveform } from "@/features/voice/components/mic-button";
import { useSpeechRecognition } from "@/features/voice/use-speech-recognition";
import { useSpeechSynthesis } from "@/features/voice/use-speech-synthesis";
import { useVoiceSocket } from "@/features/voice/use-voice-socket";
import { qk } from "@/lib/queryClient";
import type { ConversationMode, Message, TutorFeedback } from "@/types";

const MODES: { value: ConversationMode; label: string }[] = [
  { value: "free_talk", label: "Free talk" },
  { value: "roleplay", label: "Role-play" },
  { value: "interview", label: "Interview" },
  { value: "pronunciation", label: "Pronunciation" },
  { value: "grammar_drill", label: "Grammar drill" },
];

const GREETING: Message = {
  id: "greeting",
  role: "assistant",
  content: "Hi! I'm Aria, your English speaking partner. Press the mic and tell me about your day — let's chat!",
  audio_url: null,
  transcript_confidence: null,
  created_at: new Date().toISOString(),
  correction: null,
};

export default function VoiceChatPage() {
  const { data: settings } = useQuery({ queryKey: qk.settings, queryFn: userApi.getSettings });
  const [messages, setMessages] = React.useState<Message[]>([GREETING]);
  const [feedback, setFeedback] = React.useState<TutorFeedback | null>(null);
  const [phase, setPhase] = React.useState<"idle" | "thinking">("idle");
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<ConversationMode>("free_talk");
  // Continuous "hands-free" mode: press once → it keeps listening/replying in a loop.
  const [conversationActive, setConversationActive] = React.useState(false);
  const activeRef = React.useRef(false);
  activeRef.current = conversationActive;
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const synth = useSpeechSynthesis(settings?.speech_rate ?? 1);

  const socket = useVoiceSocket({
    onThinking: () => setPhase("thinking"),
    onUserMessage: (m) =>
      setMessages((prev) => {
        // replace the optimistic user bubble with the persisted one (has correction)
        const idx = prev.findIndex((x) => x.id.startsWith("temp-") && x.content === m.content);
        if (idx === -1) return [...prev, m];
        const next = [...prev];
        next[idx] = m;
        return next;
      }),
    onFeedback: (f) => setFeedback(f),
    onAssistantMessage: (m, audioUrl) => {
      setPhase("idle");
      setMessages((prev) => [...prev, m]);
      // Don't speak a reply that arrived after the user already stopped/interrupted.
      if ((settings?.auto_play_replies ?? true) && activeRef.current)
        synth.speak(m.content, audioUrl);
    },
    onDone: (cid) => setConversationId(cid),
    onError: (msg) => {
      setPhase("idle");
      toast.error(msg);
    },
  });

  const handleFinal = React.useCallback(
    (text: string, seconds: number) => {
      if (!text.trim()) return;
      const temp: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: text,
        audio_url: null,
        transcript_confidence: null,
        created_at: new Date().toISOString(),
        correction: null,
      };
      setMessages((prev) => [...prev, temp]);
      setPhase("thinking");
      socket.sendTurn(text, conversationId, mode, { seconds });
    },
    [conversationId, mode, socket],
  );

  const speech = useSpeechRecognition(handleFinal);
  const speechStartRef = React.useRef(speech.start);
  speechStartRef.current = speech.start;

  // Auto-scroll to newest message.
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, phase]);

  // Continuous loop: whenever the conversation is active and we're idle
  // (not listening, not thinking, not speaking), start listening again after a
  // short pause — so it feels like a natural back-and-forth without re-tapping.
  React.useEffect(() => {
    if (!conversationActive) return;
    const ready = !speech.listening && phase === "idle" && !synth.speaking;
    if (!ready) return;
    const t = setTimeout(() => {
      if (activeRef.current) speechStartRef.current();
    }, 650);
    return () => clearTimeout(t);
  }, [conversationActive, speech.listening, phase, synth.speaking]);

  const startConversation = () => {
    if (synth.speaking) {
      synth.stop();
      socket.interrupt();
    }
    setPhase("idle"); // clear any leftover "thinking" so the loop isn't deadlocked
    setConversationActive(true); // the loop effect starts listening
  };

  const stopConversation = () => {
    setConversationActive(false);
    speech.stop();
    synth.stop();
    socket.interrupt();
    setPhase("idle"); // a dropped/interrupted turn must not leave us stuck "thinking"
  };

  const avatarState: AvatarState = speech.listening
    ? "listening"
    : phase === "thinking"
      ? "thinking"
      : synth.speaking
        ? "speaking"
        : "idle";

  const statusLabel = conversationActive
    ? {
        listening: "Listening… speak now",
        thinking: "Aria is thinking…",
        speaking: "Aria is speaking…",
        idle: "Getting ready…",
      }[avatarState]
    : "Tap the mic to start talking";

  // Mic on/off state: ON (green) while you speak, OFF (grey) while Aria replies.
  const micState: MicState = !conversationActive
    ? "off"
    : speech.listening
      ? "listening"
      : phase === "thinking"
        ? "thinking"
        : synth.speaking
          ? "speaking"
          : "listening"; // brief gap before it re-opens the mic

  const micHint = !conversationActive
    ? "Tap the mic once to start talking"
    : micState === "listening"
      ? "🎤 Mic is ON — speak now · tap to end"
      : micState === "thinking"
        ? "Aria is thinking… · tap to end"
        : "🔇 Mic is OFF while Aria speaks · tap to end";

  return (
    <div>
      <PageHeader
        title="Voice Chat with Aria"
        subtitle="Speak naturally — get instant corrections and speaking scores."
        actions={
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                socket.status === "open" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
              }`}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {socket.status === "open" ? "Connected" : "Reconnecting…"}
            </span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as ConversationMode)}
              className="h-9 rounded-lg border border-input bg-background/60 px-3 text-sm outline-none"
            >
              {MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {!speech.supported && (
        <GlassCard className="mb-4 flex items-center gap-3 border-warning/30 bg-warning/5 p-4 text-sm">
          <TriangleAlert className="size-5 shrink-0 text-warning" />
          Your browser doesn't support speech recognition. Please use Chrome or Edge for the full
          voice experience.
        </GlassCard>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left: avatar + chat */}
        <div className="flex flex-col gap-4">
          <GlassCard className="relative flex flex-col items-center gap-4 overflow-hidden p-6">
            {/* Stage backdrop */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-transparent to-accent/[0.06]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_80%_at_50%_0%,hsl(var(--primary)/0.14),transparent)]" />
            <div className="relative">
              <AvatarFace
                state={avatarState}
                amplitude={synth.amplitude}
                size={220}
                variant={settings?.avatar_style ?? "female"}
              />
              {/* Soft floor shadow under the character */}
              <div className="mx-auto -mt-2 h-3 w-32 rounded-[50%] bg-black/25 blur-md dark:bg-black/50" />
            </div>
            <div className="relative text-center">
              <p className="text-sm font-medium text-muted-foreground">{statusLabel}</p>
              <AnimatePresence>
                {speech.interim && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-1 max-w-md text-sm italic text-foreground"
                  >
                    “{speech.interim}”
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            {speech.listening ? <Waveform active /> : <div className="h-8" />}
            <MicButton
              micState={micState}
              disabled={!speech.supported}
              onToggle={conversationActive ? stopConversation : startConversation}
            />
            <p className="relative text-center text-xs font-medium text-muted-foreground">
              {micHint}
            </p>
          </GlassCard>

          <GlassCard className="flex min-h-[280px] flex-1 flex-col p-4">
            <div className="mb-2 flex items-center gap-2 px-2 text-sm font-semibold">
              <Sparkles className="size-4 text-primary" /> Conversation
            </div>
            <div ref={scrollRef} className="h-[340px] overflow-y-auto pr-1">
              <div className="space-y-4 p-2">
                {messages.map((m) => (
                  <ChatMessage key={m.id} message={m} onReplay={(t, a) => synth.speak(t, a)} />
                ))}
                {phase === "thinking" && <TypingBubble />}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right: live feedback */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          {feedback === null && messages.length <= 1 ? (
            <EmptyState
              icon={MessageSquareOff}
              title="No feedback yet"
              description="Start speaking and Aria will show corrections, native phrasing and your speaking scores here."
            />
          ) : (
            <FeedbackPanel feedback={feedback} />
          )}
        </div>
      </div>
    </div>
  );
}
