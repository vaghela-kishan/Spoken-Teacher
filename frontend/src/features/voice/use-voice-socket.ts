import * as React from "react";

import { env } from "@/config/env";
import { tokenStore } from "@/lib/token";
import type { ConversationMode, Message, TutorFeedback } from "@/types";

export type SocketStatus = "connecting" | "open" | "closed";

interface VoiceSocketHandlers {
  onThinking?: () => void;
  onUserMessage?: (m: Message) => void;
  onFeedback?: (f: TutorFeedback) => void;
  onAssistantMessage?: (m: Message, audioUrl: string | null) => void;
  onDone?: (conversationId: string) => void;
  onError?: (message: string) => void;
}

/**
 * Persistent WebSocket to the backend voice endpoint. Auto-reconnects with
 * backoff, sends periodic heartbeats (drives the online counter), and supports
 * interrupting an in-flight AI turn.
 */
export function useVoiceSocket(handlers: VoiceSocketHandlers) {
  const wsRef = React.useRef<WebSocket | null>(null);
  const handlersRef = React.useRef(handlers);
  handlersRef.current = handlers;
  const reconnectRef = React.useRef<number>(0);
  const reconnectTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  // Set on unmount so a socket we deliberately close doesn't schedule a
  // reconnect that outlives the component (zombie sockets after navigation).
  const closedRef = React.useRef(false);
  const [status, setStatus] = React.useState<SocketStatus>("connecting");

  const connect = React.useCallback(() => {
    const token = tokenStore.access;
    if (!token) return;
    setStatus("connecting");
    const ws = new WebSocket(`${env.wsUrl}/ws/voice?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("open");
      reconnectRef.current = 0;
      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
      }, 25_000);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const h = handlersRef.current;
      switch (data.type) {
        case "thinking":
          h.onThinking?.();
          break;
        case "user_message":
          h.onUserMessage?.(data.message);
          break;
        case "feedback":
          h.onFeedback?.(data.feedback);
          break;
        case "assistant_message":
          h.onAssistantMessage?.(data.message, data.reply_audio_url ?? null);
          break;
        case "done":
          h.onDone?.(data.conversation_id);
          break;
        case "error":
          h.onError?.(data.message);
          break;
      }
    };

    ws.onclose = () => {
      setStatus("closed");
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      // Don't reconnect a socket that was closed on unmount.
      if (closedRef.current) return;
      // Exponential backoff reconnect (max ~10s).
      const delay = Math.min(10_000, 500 * 2 ** reconnectRef.current++);
      reconnectTimerRef.current = setTimeout(() => {
        if (!closedRef.current && tokenStore.access) connect();
      }, delay);
    };

    ws.onerror = () => ws.close();
  }, []);

  React.useEffect(() => {
    closedRef.current = false;
    connect();
    return () => {
      closedRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendTurn = React.useCallback(
    (text: string, conversationId: string | null, mode: ConversationMode, opts?: { confidence?: number; seconds?: number }) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      ws.send(
        JSON.stringify({
          type: "user_text",
          text,
          conversation_id: conversationId,
          mode,
          confidence: opts?.confidence ?? null,
          seconds: opts?.seconds ?? 0,
        }),
      );
    },
    [],
  );

  const interrupt = React.useCallback(() => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "interrupt" }));
  }, []);

  return { status, sendTurn, interrupt };
}
