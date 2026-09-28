"""Text-to-Speech service.

LIVE MODE   : OpenAI TTS returns base64 mp3 that the browser plays.
OFFLINE MODE: returns mode="browser" with the BCP-47 locale so the frontend
              speaks the same text with SpeechSynthesis in the user's language.
"""

from config import SUPPORTED_LANGUAGES
from services import bhashini_service, llm_service


def synthesize(text: str, language: str = "hi", voice: str | None = None):
    locale = SUPPORTED_LANGUAGES.get(language, SUPPORTED_LANGUAGES["hi"])["bcp47"]

    # Preference order: Bhashini (Govt of India stack) → OpenAI TTS → browser.
    bhashini_audio = bhashini_service.synthesize(text, language)
    if bhashini_audio:
        return {"mode": "server", "engine": "bhashini-tts", "audio_base64": bhashini_audio,
                "mime": "audio/wav", "language": language, "locale": locale}

    audio_b64 = llm_service.synthesize(text, voice)
    if audio_b64:
        return {"mode": "server", "engine": "openai-tts", "audio_base64": audio_b64,
                "mime": "audio/mpeg", "language": language, "locale": locale}
    return {"mode": "browser", "engine": "browser-speech-synthesis", "audio_base64": None,
            "text": text, "language": language, "locale": locale,
            "note": "No server TTS configured (Bhashini/OpenAI). Speak via Web Speech API."}
