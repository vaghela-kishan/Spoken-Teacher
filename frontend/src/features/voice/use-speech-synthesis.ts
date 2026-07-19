import * as React from "react";

import { env } from "@/config/env";

/**
 * Speaks the AI reply and drives the avatar's mouth.
 *
 * Lip-sync: reads the **actual audio loudness** in real time (Web Audio
 * analyser) so the mouth opens on syllables and closes on the pauses between
 * words — i.e. it moves *with the words*. If the analyser can't read the audio
 * (some proxy/browser setups), it falls back to a natural talking wobble so the
 * mouth still moves. Playback also falls back to the browser voice if the audio
 * file can't play.
 */
export function useSpeechSynthesis(rate = 1) {
  const [speaking, setSpeaking] = React.useState(false);
  const [amplitude, setAmplitude] = React.useState(0);
  const rafRef = React.useRef<number>(0);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const audioElRef = React.useRef<HTMLAudioElement | null>(null);

  const stopLoop = React.useCallback(() => cancelAnimationFrame(rafRef.current), []);

  const stop = React.useCallback(() => {
    window.speechSynthesis?.cancel();
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current = null;
    }
    stopLoop();
    setSpeaking(false);
    setAmplitude(0);
  }, [stopLoop]);

  // Fallback "talking" mouth when we can't read the real audio.
  const runWobble = React.useCallback(() => {
    const start = performance.now();
    const loop = () => {
      const t = (performance.now() - start) / 1000;
      const fast = Math.abs(Math.sin(t * 10) * 0.6 + Math.sin(t * 17) * 0.3);
      const envelope = 0.4 + ((Math.sin(t * 3) + 1) / 2) * 0.6;
      setAmplitude(Math.min(1, 0.12 + fast * envelope));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const speakWithBrowser = React.useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) return;
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = rate;
      utter.pitch = 1.05;
      utter.lang = "en-US";
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find(
          (v) => /female|zira|samantha|aria|jenny|natasha/i.test(v.name) && v.lang.startsWith("en"),
        ) ?? voices.find((v) => v.lang.startsWith("en"));
      if (preferred) utter.voice = preferred;

      utter.onstart = () => {
        setSpeaking(true);
        runWobble(); // browser TTS gives us no waveform, so wobble
      };
      const end = () => {
        stopLoop();
        setSpeaking(false);
        setAmplitude(0);
      };
      utter.onend = end;
      utter.onerror = end;
      window.speechSynthesis.speak(utter);
    },
    [rate, runWobble, stopLoop],
  );

  const speakWithAudio = React.useCallback(
    (url: string, text: string) => {
      const src = url.startsWith("http") ? url : `${env.apiUrl}${url}`;
      const audio = new Audio(src);
      audio.preload = "auto";
      audioElRef.current = audio;

      const done = () => {
        stopLoop();
        setSpeaking(false);
        setAmplitude(0);
      };
      audio.onended = done;
      audio.onerror = () => {
        done();
        speakWithBrowser(text); // audio file failed → browser voice
      };

      // Try real amplitude-driven lip-sync via the Web Audio analyser.
      try {
        const ctx = (audioCtxRef.current ??= new AudioContext());
        void ctx.resume();
        const source = ctx.createMediaElementSource(audio);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        const data = new Uint8Array(analyser.fftSize);
        let sawSignal = false;

        audio.onplay = () => {
          setSpeaking(true);
          const start = performance.now();
          const tick = () => {
            analyser.getByteTimeDomainData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) sum += Math.abs(data[i] - 128);
            const real = Math.min(1, sum / data.length / 22); // audio envelope → mouth
            if (real > 0.06) sawSignal = true;
            if (sawSignal) {
              // Real word-synced movement: open on sound, close on pauses.
              setAmplitude(real);
            } else {
              // Analyser producing nothing yet → gentle wobble so it isn't frozen.
              const t = (performance.now() - start) / 1000;
              setAmplitude(0.15 + Math.abs(Math.sin(t * 10) * 0.5) * 0.4);
            }
            rafRef.current = requestAnimationFrame(tick);
          };
          tick();
        };
        audio.play().catch(() => {
          done();
          speakWithBrowser(text);
        });
      } catch {
        // Web Audio unavailable → plain playback + wobble
        audio.onplay = () => {
          setSpeaking(true);
          runWobble();
        };
        audio.play().catch(() => {
          done();
          speakWithBrowser(text);
        });
      }
    },
    [runWobble, stopLoop, speakWithBrowser],
  );

  const speak = React.useCallback(
    (text: string, audioUrl?: string | null) => {
      stop();
      if (audioUrl) speakWithAudio(audioUrl, text);
      else speakWithBrowser(text);
    },
    [stop, speakWithAudio, speakWithBrowser],
  );

  React.useEffect(() => () => stop(), [stop]);

  return { speak, stop, speaking, amplitude };
}
