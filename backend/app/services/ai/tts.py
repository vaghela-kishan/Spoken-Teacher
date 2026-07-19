"""Text-to-speech service.

Supports Piper (default) and Kokoro local neural voices, producing a WAV file
served from /media. When no engine is installed (`TTS_ENGINE=browser` or missing
binaries), `synthesize` returns None and the frontend speaks the reply with the
browser SpeechSynthesis API — keeping latency low and the app fully functional.
"""

from __future__ import annotations

import asyncio
import uuid
from pathlib import Path

from app.core.config import settings
from app.core.logging import logger

MEDIA_DIR = Path("media/tts")


class TextToSpeech:
    def __init__(self) -> None:
        self.engine = settings.TTS_ENGINE.lower()
        MEDIA_DIR.mkdir(parents=True, exist_ok=True)
        self._piper = self._load_piper() if self.engine == "piper" else None
        if self.engine == "browser":
            logger.info("TTS engine = browser (client-side SpeechSynthesis).")

    def _load_piper(self):  # pragma: no cover - depends on local model files
        try:
            from piper.voice import PiperVoice  # type: ignore

            model_path = Path("models") / f"{settings.PIPER_VOICE}.onnx"
            config_path = Path("models") / f"{settings.PIPER_VOICE}.onnx.json"
            if not model_path.exists():
                logger.warning(f"Piper model {model_path} missing; using browser TTS.")
                return None
            voice = PiperVoice.load(
                str(model_path), str(config_path) if config_path.exists() else None
            )
            logger.info(f"Piper TTS ready (voice={settings.PIPER_VOICE}).")
            return voice
        except Exception as exc:
            logger.warning(f"Piper unavailable ({exc}); using browser TTS.")
            return None

    @property
    def server_side(self) -> bool:
        return self._piper is not None

    async def synthesize(self, text: str) -> str | None:
        """Return a public URL to a synthesized WAV, or None for browser TTS."""
        if self._piper is None:
            return None
        filename = f"{uuid.uuid4().hex}.wav"
        out_path = MEDIA_DIR / filename
        await asyncio.to_thread(self._synth_sync, text, out_path)
        return f"/media/tts/{filename}"

    def _synth_sync(self, text: str, out_path: Path) -> None:  # pragma: no cover
        import wave

        with wave.open(str(out_path), "wb") as wav:
            # piper-tts >=1.4 uses synthesize_wav(text, wave_write)
            self._piper.synthesize_wav(text, wav)


text_to_speech = TextToSpeech()
