import * as React from "react";

/**
 * Browser Web Speech API wrapper (SpeechRecognition).
 * Provides interim + final transcripts and a `supported` flag so the UI can
 * degrade gracefully. This keeps STT latency near-zero on supported browsers.
 */
export interface SpeechRecognitionState {
  supported: boolean;
  listening: boolean;
  interim: string;
  finalTranscript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

type RecognitionCtor = new () => SpeechRecognition;

function getRecognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(
  onFinal?: (text: string, durationSec: number) => void,
): SpeechRecognitionState {
  const Ctor = React.useMemo(getRecognitionCtor, []);
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
  const startedAtRef = React.useRef<number>(0);
  // Keep the latest onFinal in a ref: the recognition instance is bound once
  // (deps [Ctor]) so calling `onFinal` directly would capture the first render's
  // closure — sending a stale conversationId (null) and mode ("free_talk").
  const onFinalRef = React.useRef(onFinal);
  onFinalRef.current = onFinal;
  const [listening, setListening] = React.useState(false);
  const [interim, setInterim] = React.useState("");
  const [finalTranscript, setFinalTranscript] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (interimText) setInterim(interimText);
      if (finalText) {
        const durationSec = (performance.now() - startedAtRef.current) / 1000;
        setFinalTranscript(finalText.trim());
        setInterim("");
        onFinalRef.current?.(finalText.trim(), durationSec);
      }
    };
    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error !== "no-speech" && e.error !== "aborted") setError(e.error);
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
    };
    // onFinal is stable enough; re-binding on each change would drop the session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Ctor]);

  const start = React.useCallback(() => {
    if (!recognitionRef.current || listening) return;
    setError(null);
    setInterim("");
    startedAtRef.current = performance.now();
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {
      /* start() throws if already started — ignore */
    }
  }, [listening]);

  const stop = React.useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const reset = React.useCallback(() => {
    setInterim("");
    setFinalTranscript("");
    setError(null);
  }, []);

  return { supported: !!Ctor, listening, interim, finalTranscript, error, start, stop, reset };
}
