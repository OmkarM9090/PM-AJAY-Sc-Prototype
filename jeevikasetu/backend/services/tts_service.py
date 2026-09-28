"""Text-to-Speech service.

LIVE MODE   : OpenAI TTS returns base64 mp3 that the browser plays.
OFFLINE MODE: returns mode="browser" with the BCP-47 locale so the frontend
              speaks the same text with SpeechSynthesis in the user's language.
"""

from config import SUPPORTED_LANGUAGES
from services import llm_service


def synthesize(text: str, language: str = "hi", voice: str | None = None):
    audio_b64 = llm_service.synthesize(text, voice)
    locale = SUPPORTED_LANGUAGES.get(language, SUPPORTED_LANGUAGES["hi"])["bcp47"]
    if audio_b64:
        return {"mode": "server", "engine": "openai-tts", "audio_base64": audio_b64,
                "mime": "audio/mpeg", "language": language, "locale": locale}
    return {"mode": "browser", "engine": "browser-speech-synthesis", "audio_base64": None,
            "text": text, "language": language, "locale": locale,
            "note": "Server TTS unavailable (no OPENAI_API_KEY). Speak via Web Speech API."}
