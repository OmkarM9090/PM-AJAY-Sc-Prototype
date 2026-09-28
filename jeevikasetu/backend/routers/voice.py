"""Voice I/O endpoints: /api/voice/transcribe and /api/voice/synthesize."""

from fastapi import APIRouter, File, Form, UploadFile
from pydantic import BaseModel

from config import AI_MODE, SUPPORTED_LANGUAGES
from services import tts_service, whisper_service
from services.language import detect_language

router = APIRouter(prefix="/api/voice", tags=["voice"])


class SynthesizeRequest(BaseModel):
    text: str
    language: str = "hi"
    voice: str | None = None


class DetectRequest(BaseModel):
    text: str


@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...), language: str | None = Form(default=None)):
    """Accept an audio blob from MediaRecorder and return the transcript."""
    audio = await file.read()
    result = whisper_service.transcribe(audio, file.filename or "audio.webm", language)
    result["bytes_received"] = len(audio)
    result["ai_mode"] = AI_MODE
    return result


@router.post("/synthesize")
def synthesize(req: SynthesizeRequest):
    """Return spoken audio (server TTS) or a browser-TTS instruction."""
    return tts_service.synthesize(req.text, req.language, req.voice)


@router.post("/detect-language")
def detect(req: DetectRequest):
    code = detect_language(req.text)
    return {"language": code, **SUPPORTED_LANGUAGES.get(code, {})}


@router.get("/languages")
def languages():
    return {"languages": [{"code": c, **meta} for c, meta in SUPPORTED_LANGUAGES.items()],
            "ai_mode": AI_MODE}
