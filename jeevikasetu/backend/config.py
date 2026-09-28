"""Central configuration for the JeevikaSetu backend.

The prototype is designed to run in TWO modes:

1. LIVE AI MODE  — when OPENAI_API_KEY is present in the environment/.env.
   Whisper (STT), GPT-4o (dialogue + extraction) and OpenAI TTS are used.

2. OFFLINE DEMO MODE — no API key required. A deterministic, multilingual
   dialogue engine runs the same interview, browser Web Speech API handles
   speech-in/speech-out, and a rule-based extractor builds the profile.

Both modes expose identical APIs, so the frontend never changes. This keeps
the judge demo working even with no internet / no key on the presentation
machine.
"""

import os
from pathlib import Path

try:  # optional dependency, loaded if available
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).parent / ".env")
except Exception:  # pragma: no cover
    pass

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
PROMPTS_DIR = BASE_DIR / "prompts"

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
LLM_MODEL = os.getenv("JS_LLM_MODEL", "gpt-4o-mini")
STT_MODEL = os.getenv("JS_STT_MODEL", "whisper-1")
TTS_MODEL = os.getenv("JS_TTS_MODEL", "gpt-4o-mini-tts")
TTS_VOICE = os.getenv("JS_TTS_VOICE", "alloy")

DATABASE_URL = os.getenv("JS_DATABASE_URL", f"sqlite:///{BASE_DIR / 'jeevikasetu.db'}")

# Feature flag surfaced to the UI so judges can see which mode is running.
AI_MODE = "live-openai" if OPENAI_API_KEY else "offline-demo"

SUPPORTED_LANGUAGES = {
    "hi": {"name": "हिन्दी", "english_name": "Hindi", "bcp47": "hi-IN"},
    "en": {"name": "English", "english_name": "English", "bcp47": "en-IN"},
    "mr": {"name": "मराठी", "english_name": "Marathi", "bcp47": "mr-IN"},
    "ta": {"name": "தமிழ்", "english_name": "Tamil", "bcp47": "ta-IN"},
    "te": {"name": "తెలుగు", "english_name": "Telugu", "bcp47": "te-IN"},
    "bn": {"name": "বাংলা", "english_name": "Bengali", "bcp47": "bn-IN"},
}


def read_prompt(name: str) -> str:
    """Load a prompt template from backend/prompts/."""
    path = PROMPTS_DIR / name
    return path.read_text(encoding="utf-8") if path.exists() else ""
