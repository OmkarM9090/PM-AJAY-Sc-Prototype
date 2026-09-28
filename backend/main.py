"""JeevikaSetu FastAPI backend.

Run locally:
    pip install -r requirements.txt
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload

OPENAI_API_KEY is optional. With a key, audio is sent to OpenAI Whisper/TTS and
short acknowledgements use the configured chat model. Without it, the browser
Speech API + deterministic interview controller keep the prototype demoable.
"""
from __future__ import annotations

import io
import os
import tempfile
from pathlib import Path
from typing import Any, Literal

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
from dotenv import load_dotenv

from services.catalog import find_persona, load_catalog
from services.conversation import detect_language, missing_slots, opening_message, progress, reply_for_turn
from api.telephony import router as telephony_router
from services.recommender import filter_opportunities, nearby_centers, recommend
from services.store import add_message, create_session, get_session, initialise, list_sessions, save_profile
from services.llm_service import enabled as llm_enabled, polish_turn

try:  # Kept entirely server-side; never import this key into the browser.
    from openai import OpenAI
except ImportError:  # pragma: no cover - requirements install path
    OpenAI = None  # type: ignore[misc,assignment]

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY and OpenAI else None

app = FastAPI(
    title="JeevikaSetu Prototype API",
    version="1.0.0-demo",
    description="Voice-first livelihood profiling and illustrative NSQF-aligned matching API.",
)
app.include_router(telephony_router, prefix="/api/twilio", tags=["optional-telephony"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "OPTIONS"],
    allow_headers=["*"],
)


class SessionCreate(BaseModel):
    channel: Literal["web", "ivr", "whatsapp", "phone"] = "web"
    language: Literal["hi", "en", "mr", "ta", "te", "bn"] = "hi"
    consent_recording: bool = False


class ConversationMessage(BaseModel):
    session_id: str
    text: str = Field(min_length=1, max_length=3000)
    language: str | None = None


class ProfileExtraction(BaseModel):
    session_id: str | None = None
    transcript: list[dict[str, str]] = Field(default_factory=list)


class ProfileUpdate(BaseModel):
    profile: dict[str, Any]


class RecommendationRequest(BaseModel):
    session_id: str | None = None
    profile: dict[str, Any] | None = None
    limit: int = Field(default=5, ge=1, le=10)


class SynthesisRequest(BaseModel):
    text: str = Field(min_length=1, max_length=3000)
    language: str = "hi"


class ReportRequest(BaseModel):
    session_id: str | None = None
    profile: dict[str, Any] | None = None


@app.on_event("startup")
def startup() -> None:
    initialise()


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "voice_mode": "openai-whisper-tts" if openai_client else "browser-speech-fallback",
        "data_notice": load_catalog()["meta"]["disclaimer"],
    }


@app.post("/api/conversation/session")
def new_session(payload: SessionCreate) -> dict[str, Any]:
    session = create_session(payload.channel, payload.language, payload.consent_recording)
    greeting = opening_message(payload.language)
    add_message(session["id"], "agent", greeting, payload.language)
    session = get_session(session["id"])
    return {
        "session_id": session["id"],
        "greeting": greeting,
        "language": payload.language,
        "profile": session["profile"],
        "progress": progress(session["profile"]),
        "consent_required": not payload.consent_recording,
        "ai_mode": "openai" if llm_enabled() else "local-demo-fallback",
    }


@app.get("/api/conversation/session/{session_id}")
def session_detail(session_id: str) -> dict[str, Any]:
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Conversation session was not found.")
    return {**session, "progress": progress(session["profile"])}


@app.post("/api/conversation/message")
def message(payload: ConversationMessage) -> dict[str, Any]:
    session = get_session(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Conversation session was not found. Please start again.")
    profile = session["profile"]
    detected = detect_language(payload.text, payload.language or session["language"])
    language = payload.language or detected or session["language"]
    # Consistency is maintained when the user has explicitly selected language;
    # language detection is returned for transparency without unexpectedly changing it.
    active_language = session["language"] if session["language"] else language
    awaiting_confirmation = not missing_slots(profile)
    add_message(session["id"], "user", payload.text, detected)
    updated_profile, agent_text, completed, active_slot = reply_for_turn(profile, payload.text, active_language, awaiting_confirmation)
    save_profile(session["id"], updated_profile, "completed" if completed else "active")
    # GPT is optional enhancement only: deterministic question/order remains the
    # source of truth and works without a key or network connection.
    agent_text = polish_turn(payload.text, agent_text, active_language)
    add_message(session["id"], "agent", agent_text, active_language)
    return {
        "agent_text": agent_text,
        "detected_language": detected,
        "response_language": active_language,
        "profile": updated_profile,
        "progress": progress(updated_profile),
        "completed": completed,
        "next_topic": active_slot,
        "ai_mode": "openai-enabled" if llm_enabled() else "structured-local-fallback",
    }


@app.post("/api/profile/extract")
def extract_profile(payload: ProfileExtraction) -> dict[str, Any]:
    if payload.session_id:
        session = get_session(payload.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Conversation session was not found.")
        return {"profile": session["profile"], "progress": progress(session["profile"]), "source": "persisted-turn-by-turn-extraction"}
    # A transcript-only request is intentionally conservative: it is presented as
    # a preview and does not persist unconsented personal data.
    from services.store import default_profile
    from services.conversation import extract_signals
    profile = default_profile("hi")
    for entry in payload.transcript:
        if entry.get("speaker") == "user":
            profile = extract_signals(profile, entry.get("text", ""), None)
    return {"profile": profile, "progress": progress(profile), "source": "local-transcript-preview"}


@app.put("/api/profile/{session_id}")
def update_profile(session_id: str, payload: ProfileUpdate) -> dict[str, Any]:
    if not get_session(session_id):
        raise HTTPException(status_code=404, detail="Conversation session was not found.")
    # Preserve consent flag and category default if the UI omits them.
    current = get_session(session_id)["profile"]
    merged = {**current, **payload.profile}
    merged["consent_recording"] = current.get("consent_recording", False)
    merged["category"] = merged.get("category") or "SC"
    save_profile(session_id, merged)
    return {"profile": merged, "progress": progress(merged)}


@app.post("/api/recommend")
def recommendations(payload: RecommendationRequest) -> dict[str, Any]:
    profile = payload.profile
    if payload.session_id:
        session = get_session(payload.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Conversation session was not found.")
        profile = session["profile"]
    if not profile:
        raise HTTPException(status_code=422, detail="Provide a session_id or beneficiary profile.")
    return {"profile_name": profile.get("name") or "Beneficiary", "recommendations": recommend(profile, payload.limit), "data_notice": load_catalog()["meta"]["disclaimer"]}


@app.get("/api/training-centers")
def training_centers(district: str | None = None, sector: str | None = None) -> dict[str, Any]:
    return {"centers": nearby_centers(district, sector), "data_notice": load_catalog()["meta"]["disclaimer"]}


@app.get("/api/opportunities")
def opportunities(district: str | None = None, type: Literal["job", "self-employment"] | None = Query(default=None)) -> dict[str, Any]:
    return {"opportunities": filter_opportunities(district, type), "data_notice": load_catalog()["meta"]["disclaimer"]}


@app.get("/api/nsqf/qualification-packs")
def qualification_packs(sector: str | None = None) -> dict[str, Any]:
    packs = load_catalog()["qualification_packs"]
    if sector:
        packs = [pack for pack in packs if pack["sector"].lower() == sector.lower()]
    return {"qualification_packs": packs, "data_notice": load_catalog()["meta"]["disclaimer"]}


@app.get("/api/demo/personas")
def personas() -> dict[str, Any]:
    # Personas are explicitly fictional and can be used to recover a live demo.
    return {"personas": load_catalog()["personas"], "demo_only": True}


@app.post("/api/demo/personas/{persona_id}")
def load_demo_persona(persona_id: str, language: str = "hi") -> dict[str, Any]:
    persona = find_persona(persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Demo persona was not found.")
    session = create_session("web", language, True)
    profile = {**persona, "consent_recording": True}
    save_profile(session["id"], profile, "completed")
    lines = [
        ("agent", opening_message(language)),
        ("user", "Main Ramesh Kumar hoon. Main Chandpur, Varanasi se hoon."),
        ("agent", "Aapke paramparik chamde ke kaam aur construction anubhav ko maine note kar liya hai."),
        ("user", "Mujhe mobile repair seekhkar apna kaam shuru karna hai. Main 30 kilometre tak ja sakta hoon."),
        ("agent", "Dhanyavaad. Aapka demo profile aur recommendations tayyar hain."),
    ]
    for speaker, text in lines:
        add_message(session["id"], speaker, text, language)
    return {"session_id": session["id"], "profile": profile, "recommendations": recommend(profile), "greeting": opening_message(language), "demo_only": True}


@app.post("/api/voice/transcribe")
async def transcribe_voice(file: UploadFile = File(...), language: str | None = Form(default=None)) -> dict[str, Any]:
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=415, detail="Please send an audio recording from the microphone.")
    if not openai_client:
        return JSONResponse(status_code=200, content={
            "transcript": "", "language": language or "hi", "mode": "browser-speech-fallback",
            "message": "Server transcription needs OPENAI_API_KEY. Live browser speech recognition remains available when supported by this browser.",
        })
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="The audio recording was empty. Please try again.")
    try:
        result = openai_client.audio.transcriptions.create(
            model="whisper-1",
            file=(file.filename or "recording.webm", audio_bytes, file.content_type),
            response_format="verbose_json",
            language=language if language in {"hi", "en", "mr", "ta", "te", "bn"} else None,
        )
        transcript = getattr(result, "text", "")
        detected = getattr(result, "language", None) or detect_language(transcript, language or "hi")
        return {"transcript": transcript, "language": detected, "mode": "openai-whisper"}
    except Exception:
        raise HTTPException(status_code=502, detail="Voice transcription is temporarily unavailable. Please use the on-screen text fallback or browser speech recognition.")


@app.post("/api/voice/synthesize")
def synthesize_voice(payload: SynthesisRequest) -> Response:
    if not openai_client:
        return JSONResponse(content={"mode": "browser-speech-fallback", "language": payload.language, "text": payload.text})
    try:
        speech = openai_client.audio.speech.create(model="tts-1", voice="alloy", input=payload.text, response_format="mp3")
        audio = getattr(speech, "content", None)
        if audio is None and hasattr(speech, "read"):
            audio = speech.read()
        return Response(content=audio, media_type="audio/mpeg", headers={"Cache-Control": "no-store"})
    except Exception:
        return JSONResponse(status_code=200, content={"mode": "browser-speech-fallback", "language": payload.language, "text": payload.text})


def _safe_pdf(value: Any) -> str:
    return str(value or "Not provided").encode("ascii", "replace").decode("ascii")


@app.post("/api/report/generate")
def generate_report(payload: ReportRequest) -> Response:
    profile = payload.profile
    if payload.session_id:
        session = get_session(payload.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Conversation session was not found.")
        profile = session["profile"]
    if not profile:
        raise HTTPException(status_code=422, detail="Provide a session_id or beneficiary profile.")
    recommendations_list = recommend(profile, 3)
    buffer = io.BytesIO()
    document = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm, topMargin=16 * mm)
    styles = getSampleStyleSheet()
    story = [Paragraph("JeevikaSetu – Livelihood Pathway Summary", styles["Title"]), Spacer(1, 8)]
    story.append(Paragraph("Prototype output. This is an illustrative decision-support summary, not an official approval, referral, benefit sanction or job guarantee.", styles["BodyText"]))
    story.append(Spacer(1, 10))
    location = profile.get("location", {})
    story.append(Paragraph(f"<b>Beneficiary:</b> {_safe_pdf(profile.get('name'))}<br/><b>Location:</b> {_safe_pdf(', '.join(filter(None, [location.get('village'), location.get('district'), location.get('state')]))) }<br/><b>Education:</b> {_safe_pdf(profile.get('education'))}<br/><b>Skills:</b> {_safe_pdf(', '.join(profile.get('identified_skills', [])))}", styles["BodyText"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph("Recommended pathways", styles["Heading2"]))
    for item in recommendations_list:
        qp = item["qualification_pack"]
        centre = item.get("nearest_center") or {}
        body = f"<b>{item['rank']}. {_safe_pdf(qp['qp_name'])}</b> (NSQF Level {_safe_pdf(qp['nsqf_level'])})<br/>Skill match: {_safe_pdf(item['skill_match_percent'])}% | RPL assessment candidate: {'Yes' if item['rpl_eligible'] else 'No'}<br/>Gap to validate: {_safe_pdf(', '.join(item['skill_gaps']))}<br/>Nearest illustrative centre: {_safe_pdf(centre.get('name'))}<br/>Path: {_safe_pdf(item['pathway'])}"
        story.extend([Paragraph(body, styles["BodyText"]), Spacer(1, 8)])
    document.build(story)
    return Response(content=buffer.getvalue(), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=JeevikaSetu-pathway-summary.pdf"})


@app.get("/api/dashboard/stats")
def dashboard_stats() -> dict[str, Any]:
    sessions = list_sessions(200)
    catalog = load_catalog()
    language_labels = {"hi": "Hindi", "en": "English", "mr": "Marathi", "ta": "Tamil", "te": "Telugu", "bn": "Bengali"}
    distribution: dict[str, int] = {label: 0 for label in language_labels.values()}
    for session in sessions:
        distribution[language_labels.get(session["language"], session["language"])] = distribution.get(language_labels.get(session["language"], session["language"]), 0) + 1
    # Illustrative baseline keeps the dashboard useful in a fresh local install.
    baseline = {"Hindi": 128, "Marathi": 46, "Tamil": 31, "English": 18, "Telugu": 24, "Bengali": 14}
    for label, count in baseline.items(): distribution[label] = distribution.get(label, 0) + count
    return {
        "total_beneficiaries": sum(distribution.values()),
        "live_demo_sessions": len(sessions),
        "language_distribution": distribution,
        "top_skills": [{"name": "Leather crafting", "count": 74}, {"name": "Machine stitching", "count": 61}, {"name": "Construction work", "count": 56}, {"name": "Mobile repair", "count": 43}, {"name": "Organic farming", "count": 38}],
        "pathway_demand": [{"name": "Self-employment", "value": 46}, {"name": "RPL / bridge", "value": 29}, {"name": "Job-linked training", "value": 25}],
        "district_demand": [{"district": "Varanasi", "signals": 64}, {"district": "Lucknow", "signals": 51}, {"district": "Pune", "signals": 43}, {"district": "Chennai", "signals": 39}, {"district": "Patna", "signals": 35}],
        "catalogue": {"qualification_packs": len(catalog["qualification_packs"]), "training_centers": len(catalog["training_centers"]), "opportunities": len(catalog["opportunities"])},
        "notice": "Aggregate view uses fictional demo baseline plus de-identified local prototype sessions. It is not live programme monitoring data.",
    }


@app.get("/api/dashboard/beneficiaries")
def dashboard_beneficiaries() -> dict[str, Any]:
    return {"beneficiaries": list_sessions(100), "notice": "De-identified prototype session list. Use appropriate authorisation and data governance before any production deployment."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
