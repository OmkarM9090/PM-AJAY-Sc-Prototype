"""Speech-to-Text service.

LIVE MODE   : OpenAI Whisper (auto language detection, Hindi/Tamil/Telugu/Marathi/
              Bengali/English supported natively).
OFFLINE MODE: returns ``{"mode": "browser"}`` so the frontend falls back to the
              Web Speech API recogniser running in the browser — the demo keeps
              working with zero keys and zero cost.
"""

from services import llm_service
from services.language import detect_language


def transcribe(audio_bytes: bytes, filename: str = "audio.webm", language_hint: str | None = None):
    result = llm_service.transcribe(audio_bytes, filename, language_hint)
    if result and result.get("text"):
        text = result["text"]
        lang = (result.get("language") or "").lower()
        code_map = {"hindi": "hi", "english": "en", "marathi": "mr", "tamil": "ta",
                    "telugu": "te", "bengali": "bn"}
        code = code_map.get(lang, lang[:2] if lang else None)
        if code not in {"hi", "en", "mr", "ta", "te", "bn"}:
            code = detect_language(text, fallback=language_hint or "hi")
        return {"text": text, "language": code, "engine": "openai-whisper", "mode": "server"}
    return {"text": "", "language": language_hint or "hi", "engine": "browser-web-speech",
            "mode": "browser",
            "note": "Server STT unavailable (no OPENAI_API_KEY). Use browser Web Speech API result."}
