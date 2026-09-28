"""Thin OpenAI wrapper used by dialogue, extraction, STT and TTS.

Every function degrades gracefully: if no API key is configured (or the call
fails), it returns ``None`` and the caller falls back to the deterministic
offline engine. That is what makes the prototype demo-safe.
"""

import base64
import json
import logging

import httpx

from config import (LLM_MODEL, OPENAI_API_KEY, OPENAI_BASE_URL, STT_MODEL,
                    TTS_MODEL, TTS_VOICE)

log = logging.getLogger("jeevikasetu.llm")

TIMEOUT = httpx.Timeout(45.0, connect=10.0)


def available() -> bool:
    return bool(OPENAI_API_KEY)


def _headers():
    return {"Authorization": f"Bearer {OPENAI_API_KEY}"}


def chat(messages, temperature=0.6, json_mode=False, max_tokens=700):
    """Call the chat completions API. Returns the assistant string or None."""
    if not available():
        return None
    payload = {
        "model": LLM_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}
    try:
        with httpx.Client(timeout=TIMEOUT) as client:
            r = client.post(f"{OPENAI_BASE_URL}/chat/completions", headers=_headers(), json=payload)
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]
    except Exception as exc:  # pragma: no cover - network dependent
        log.warning("LLM chat failed, falling back to offline engine: %s", exc)
        return None


def chat_json(messages, **kwargs):
    """Chat call that parses a JSON object response."""
    raw = chat(messages, json_mode=True, **kwargs)
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        start, end = raw.find("{"), raw.rfind("}")
        if start >= 0 and end > start:
            try:
                return json.loads(raw[start:end + 1])
            except json.JSONDecodeError:
                return None
    return None


def transcribe(audio_bytes: bytes, filename: str = "audio.webm", language: str | None = None):
    """Whisper speech-to-text. Returns {'text', 'language'} or None."""
    if not available():
        return None
    data = {"model": STT_MODEL, "response_format": "verbose_json"}
    if language:
        data["language"] = language
    try:
        with httpx.Client(timeout=TIMEOUT) as client:
            r = client.post(
                f"{OPENAI_BASE_URL}/audio/transcriptions",
                headers=_headers(),
                data=data,
                files={"file": (filename, audio_bytes, "application/octet-stream")},
            )
            r.raise_for_status()
            body = r.json()
            return {"text": body.get("text", "").strip(), "language": body.get("language")}
    except Exception as exc:  # pragma: no cover
        log.warning("Whisper transcription failed: %s", exc)
        return None


def synthesize(text: str, voice: str | None = None):
    """OpenAI TTS. Returns base64 mp3 string or None."""
    if not available():
        return None
    try:
        with httpx.Client(timeout=TIMEOUT) as client:
            r = client.post(
                f"{OPENAI_BASE_URL}/audio/speech",
                headers=_headers(),
                json={"model": TTS_MODEL, "voice": voice or TTS_VOICE, "input": text, "format": "mp3"},
            )
            r.raise_for_status()
            return base64.b64encode(r.content).decode("ascii")
    except Exception as exc:  # pragma: no cover
        log.warning("TTS synthesis failed: %s", exc)
        return None
