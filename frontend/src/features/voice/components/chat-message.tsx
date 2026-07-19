import { motion } from "framer-motion";
import { Sparkles, Volume2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
  onReplay?: (text: string, audioUrl: string | null) => void;
}

export function ChatMessage({ message, onReplay }: ChatMessageProps) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className={cn("text-xs", isUser ? "from-slate-500 to-slate-700" : "from-primary to-accent")}>
          {isUser ? "You" : <Sparkles className="size-4" />}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "group max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-card",
        )}
      >
        <p>{message.content}</p>
        {!isUser && onReplay && (
          <button
            onClick={() => onReplay(message.content, message.audio_url)}
            className="mt-1 flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Volume2 className="size-3" /> Replay
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function TypingBubble() {
  return (
    <div className="flex gap-3">
      <Avatar className="size-8">
        <AvatarFallback className="from-primary to-accent">
          <Sparkles className="size-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-card px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-2 rounded-full bg-muted-foreground/60"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}
