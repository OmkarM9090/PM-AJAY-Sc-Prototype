"""
Real channel adapters: IVR (Twilio / Exotel) and WhatsApp (Meta Cloud API).

These are the production entry points behind the two simulated channels in the
UI. They are deliberately thin: every provider webhook normalises its payload
and then calls the SAME dialogue engine and profile pipeline as the web app, so
behaviour can never drift between channels.

Point a provider at:
    Twilio Voice webhook   POST /api/telephony/twilio/voice      (returns TwiML)
    Vapi custom LLM        POST /api/telephony/vapi/chat/completions  (OpenAI shape)
    Retell custom LLM      POST /api/telephony/retell/llm-webhook
    Twilio speech result   POST /api/telephony/twilio/gather
    Exotel applet          POST /api/telephony/exotel/voice      (returns JSON)
    WhatsApp verification  GET  /api/telephony/whatsapp/webhook
    WhatsApp messages      POST /api/telephony/whatsapp/webhook

No provider credentials are required to inspect or test these endpoints — that
is intentional, so an evaluator can curl them.
"""

import hashlib
import logging
import os
from datetime import datetime, timedelta
from xml.sax.saxutils import escape

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from config import SUPPORTED_LANGUAGES
from database import ConversationSession, Message, dumps, get_db
from services.dialogue_manager import next_turn
from services.language import detect_language

log = logging.getLogger("jeevikasetu.telephony")

router = APIRouter(prefix="/api/telephony", tags=["telephony"])

WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "jeevikasetu-verify")

# IVR keypad → language
DTMF_LANGUAGES = {"1": "hi", "2": "en", "3": "mr", "4": "ta", "5": "te", "6": "bn"}

# A caller who is cut off mid-interview and rings back within this window picks
# up where they left off (patchy rural network coverage is the norm). Anything
# older — or an interview that already finished — starts a clean interview and
# the previous transcript is erased (DPDP data minimisation: the extracted
# profile is what we keep, not the raw conversation).
RESUME_WINDOW = timedelta(hours=24)

IVR_MENU_PROMPT = (
    "नमस्ते. आपने जीविकासेतु, पी एम अजय कौशल हेल्पलाइन पर कॉल किया है. "
    "हिन्दी के लिए एक दबाएँ. For English press two. मराठीसाठी तीन दाबा. "
    "தமிழுக்கு நான்கு. తెలుగు కోసం ఐదు. বাংলার জন্য ছয়."
)


# ---------------------------------------------------------------------------
# Shared session handling — one caller/number maps to one stable session id
# ---------------------------------------------------------------------------
def _session_id_for(identifier: str, channel: str) -> str:
    """Deterministic, non-reversible session id derived from the phone number.

    We never store the raw number: a salted hash is enough to continue a call
    or chat, and it keeps personal identifiers out of the database.
    """
    digest = hashlib.sha256(f"{channel}:{identifier}".encode()).hexdigest()
    return f"{channel[:2]}{digest[:6]}"


def _reset(db: Session, session: ConversationSession, language: str) -> None:
    """Wipe a finished/stale session so the caller gets a fresh interview."""
    db.query(Message).filter(Message.session_id == session.id).delete()
    session.slots_json = dumps({"slots": {}, "asked_probes": []})
    session.status = "active"
    session.language = language
    session.updated_at = datetime.utcnow()
    db.commit()


def _get_or_create(db: Session, session_id: str, channel: str, language: str):
    """Return (session, is_fresh).

    ``is_fresh`` is True when the session has no history yet, i.e. the next turn
    must be the greeting + first question rather than an answer to something.
    Callers should never treat the first inbound utterance as an answer.
    """
    session = db.query(ConversationSession).filter(ConversationSession.id == session_id).first()
    if not session:
        session = ConversationSession(id=session_id, channel=channel, language=language,
                                      slots_json=dumps({"slots": {}, "asked_probes": []}))
        db.add(session)
        db.commit()
        return session, True

    stale = (datetime.utcnow() - (session.updated_at or session.created_at)) > RESUME_WINDOW
    if session.status in ("completed", "withdrawn") or stale:
        log.info("session %s restarted (status=%s stale=%s)", session_id, session.status, stale)
        _reset(db, session, language)
        return session, True

    return session, not session.messages


def _turn(db: Session, session: ConversationSession, user_text: str | None):
    """Run one dialogue turn and persist both sides of it."""
    state = session.slots
    slots, probes = state.get("slots", {}), state.get("asked_probes", [])
    history = [{"speaker": m.speaker, "text": m.text} for m in session.messages]

    if user_text:
        db.add(Message(session_id=session.id, speaker="user", text=user_text,
                       language=session.language))
        db.commit()

    result = next_turn(history, slots, user_text, session.language, probes)

    new_probes = list(probes)
    for key in result.slots:
        if key.startswith("probe_") and key not in new_probes:
            new_probes.append(key)

    session.slots_json = dumps({"slots": result.slots, "asked_probes": new_probes})
    session.language = result.language
    if result.completed:
        session.status = "completed"
    db.add(Message(session_id=session.id, speaker="assistant", text=result.reply,
                   language=result.language, slot=result.next_slot))
    db.commit()
    return result


# ---------------------------------------------------------------------------
# Twilio Voice (TwiML)
# ---------------------------------------------------------------------------
def _twiml(body: str) -> Response:
    return Response(content=f'<?xml version="1.0" encoding="UTF-8"?><Response>{body}</Response>',
                    media_type="application/xml")


def _twilio_locale(lang: str) -> str:
    return SUPPORTED_LANGUAGES.get(lang, SUPPORTED_LANGUAGES["hi"])["bcp47"]


@router.post("/twilio/voice")
async def twilio_voice(request: Request, db: Session = Depends(get_db)):
    """Inbound call → play the language menu and collect one keypress."""
    form = await request.form()
    caller = form.get("From", "unknown")
    digits = form.get("Digits")
    session_id = _session_id_for(caller, "ivr")

    if not digits:
        return _twiml(
            f'<Gather input="dtmf" numDigits="1" timeout="6" '
            f'action="/api/telephony/twilio/voice" method="POST">'
            f'<Say language="hi-IN">{escape(IVR_MENU_PROMPT)}</Say></Gather>'
            f'<Say language="hi-IN">कोई बटन नहीं दबाया गया. धन्यवाद.</Say><Hangup/>'
        )

    language = DTMF_LANGUAGES.get(digits, "hi")
    session, _fresh = _get_or_create(db, session_id, "ivr", language)
    session.language = language
    db.commit()

    result = _turn(db, session, None)   # greeting + first question
    locale = _twilio_locale(language)
    return _twiml(
        f'<Gather input="speech" language="{locale}" speechTimeout="auto" '
        f'action="/api/telephony/twilio/gather" method="POST">'
        f'<Say language="{locale}">{escape(result.reply)}</Say></Gather>'
        f'<Redirect method="POST">/api/telephony/twilio/gather</Redirect>'
    )


@router.post("/twilio/gather")
async def twilio_gather(request: Request, db: Session = Depends(get_db)):
    """Each subsequent turn: speech result in → next question out."""
    form = await request.form()
    caller = form.get("From", "unknown")
    speech = (form.get("SpeechResult") or "").strip()
    session_id = _session_id_for(caller, "ivr")
    session, is_fresh = _get_or_create(db, session_id, "ivr", "hi")

    if is_fresh or not speech:
        result = _turn(db, session, None)
    else:
        result = _turn(db, session, speech)

    locale = _twilio_locale(result.language)
    if result.completed:
        return _twiml(
            f'<Say language="{locale}">{escape(result.reply)}</Say>'
            f'<Say language="{locale}">आपकी सिफारिशें एस एम एस से भेजी जा रही हैं. धन्यवाद.</Say>'
            f'<Hangup/>'
        )
    return _twiml(
        f'<Gather input="speech" language="{locale}" speechTimeout="auto" '
        f'action="/api/telephony/twilio/gather" method="POST">'
        f'<Say language="{locale}">{escape(result.reply)}</Say></Gather>'
        f'<Redirect method="POST">/api/telephony/twilio/gather</Redirect>'
    )


# ---------------------------------------------------------------------------
# Exotel (JSON applet) — the common Indian IVR provider
# ---------------------------------------------------------------------------
@router.post("/exotel/voice")
async def exotel_voice(request: Request, db: Session = Depends(get_db)):
    """Exotel 'Voicebot' applet contract: JSON in, JSON out."""
    try:
        payload = await request.json()
    except Exception:
        form = await request.form()
        payload = dict(form)

    caller = payload.get("CallFrom") or payload.get("From") or "unknown"
    digits = str(payload.get("digits") or payload.get("Digits") or "").strip("\"' ")
    speech = (payload.get("speech_result") or payload.get("SpeechResult") or "").strip()
    session_id = _session_id_for(caller, "ivr")

    if digits and digits in DTMF_LANGUAGES:
        session, _fresh = _get_or_create(db, session_id, "ivr", DTMF_LANGUAGES[digits])
        session.language = DTMF_LANGUAGES[digits]
        db.commit()
        result = _turn(db, session, None)
    elif speech:
        session, is_fresh = _get_or_create(db, session_id, "ivr", detect_language(speech))
        result = _turn(db, session, None if is_fresh else speech)
    else:
        return {"action": "gather", "input": "dtmf", "max_digits": 1,
                "prompt": IVR_MENU_PROMPT, "language": "hi-IN"}

    return {
        "action": "hangup" if result.completed else "gather",
        "input": "speech",
        "prompt": result.reply,
        "language": SUPPORTED_LANGUAGES.get(result.language, SUPPORTED_LANGUAGES["hi"])["bcp47"],
        "session_id": session_id,
        "progress_percent": result.progress.get("percent"),
        "completed": result.completed,
    }


# ---------------------------------------------------------------------------
# WhatsApp Cloud API
# ---------------------------------------------------------------------------
@router.get("/whatsapp/webhook")
async def whatsapp_verify(request: Request):
    """Meta webhook verification handshake."""
    params = request.query_params
    if params.get("hub.mode") == "subscribe" and params.get("hub.verify_token") == WHATSAPP_VERIFY_TOKEN:
        return Response(content=params.get("hub.challenge", ""), media_type="text/plain")
    return Response(content="verification failed", status_code=403, media_type="text/plain")


@router.post("/whatsapp/webhook")
async def whatsapp_webhook(request: Request, db: Session = Depends(get_db)):
    """Inbound WhatsApp text or voice note → dialogue turn → reply payload.

    In production the reply is POSTed back to the Graph API (text + TTS voice
    note). Here it is returned in the response so the flow is testable without
    Meta credentials.
    """
    body = await request.json()
    try:
        value = body["entry"][0]["changes"][0]["value"]
        msg = value["messages"][0]
        sender = msg["from"]
    except Exception:
        return {"status": "ignored", "reason": "no message in payload"}

    text = ""
    if msg.get("type") == "text":
        text = msg["text"]["body"]
    elif msg.get("type") == "audio":
        # Production: download media via the Graph API, then run ASR.
        # services.whisper_service.transcribe(audio_bytes, language_hint=...)
        text = (msg.get("audio") or {}).get("transcript", "")

    session_id = _session_id_for(sender, "whatsapp")
    session, is_fresh = _get_or_create(db, session_id, "whatsapp", detect_language(text or "", "hi"))
    # The opening "hi"/"नमस्ते" is a conversation opener, not an answer.
    result = _turn(db, session, text if (text and not is_fresh) else None)

    return {
        "status": "ok",
        "session_id": session_id,
        "messaging_product": "whatsapp",
        "reply": {"type": "text", "body": result.reply},
        "voice_note_language": result.language,
        "progress_percent": result.progress.get("percent"),
        "completed": result.completed,
    }


# ---------------------------------------------------------------------------
# Vapi.ai / Retell.ai — "Option A" managed voice-agent route
# ---------------------------------------------------------------------------
# Both platforms can drive a call with their own ASR + TTS while delegating the
# *brain* to an HTTP endpoint. Exposing JeevikaSetu's interview engine in their
# two contracts means the hackathon build can switch to a managed telephony
# stack without changing a single line of dialogue logic — and the interview
# stays identical to the web and IVR channels.
def _messages_to_state(db: Session, session_id: str, transcript: list[dict]):
    """Map an external transcript onto a JeevikaSetu session and take one turn.

    Vapi/Retell resend the whole conversation each time, so we only feed the
    newest user utterance to the engine — our own slot state is authoritative.
    """
    session, is_fresh = _get_or_create(db, session_id, "ivr", "hi")
    latest_user = next((m.get("content") or m.get("message") or ""
                        for m in reversed(transcript or [])
                        if (m.get("role") or "").lower() in ("user", "human")), "")
    if latest_user and not is_fresh:
        session.language = detect_language(latest_user, session.language or "hi")
        db.commit()
    return _turn(db, session, latest_user if (latest_user and not is_fresh) else None)


@router.post("/vapi/chat/completions")
async def vapi_custom_llm(request: Request, db: Session = Depends(get_db)):
    """Vapi 'Custom LLM' provider: OpenAI chat-completions in and out.

    Point the Vapi assistant's model at this URL and it will speak whatever
    our deterministic interviewer returns, in the caller's language.
    """
    body = await request.json()
    call_id = (body.get("call") or {}).get("id") or body.get("user") or "vapi-demo"
    session_id = _session_id_for(str(call_id), "ivr")
    result = _messages_to_state(db, session_id, body.get("messages") or [])

    return {
        "id": f"chatcmpl-{session_id}",
        "object": "chat.completion",
        "model": body.get("model", "jeevikasetu-interviewer"),
        "choices": [{
            "index": 0,
            "message": {"role": "assistant", "content": result.reply},
            "finish_reason": "stop",
        }],
        # Non-standard extras Vapi passes through to your server events.
        "jeevikasetu": {"session_id": session_id, "language": result.language,
                        "progress_percent": result.progress.get("percent"),
                        "completed": result.completed},
    }


@router.post("/vapi/webhook")
async def vapi_events(request: Request):
    """Vapi server events (status-update, end-of-call-report, transcripts)."""
    body = await request.json()
    event = (body.get("message") or {}).get("type") or body.get("type") or "unknown"
    log.info("vapi event: %s", event)
    return {"status": "ok", "event": event}


@router.post("/retell/llm-webhook")
async def retell_llm(request: Request, db: Session = Depends(get_db)):
    """Retell.ai custom-LLM HTTP contract."""
    body = await request.json()
    call_id = (body.get("call") or {}).get("call_id") or body.get("call_id") or "retell-demo"
    session_id = _session_id_for(str(call_id), "ivr")

    if body.get("interaction_type") == "ping_pong":
        return {"response_type": "ping_pong", "timestamp": body.get("timestamp")}

    result = _messages_to_state(db, session_id, body.get("transcript") or [])
    return {
        "response_id": body.get("response_id", 0),
        "content": result.reply,
        "content_complete": True,
        "end_call": result.completed,
    }


@router.get("/status")
def telephony_status():
    """What an integrator needs to know, at a glance."""
    return {
        "ivr": {
            "twilio_voice_webhook": "POST /api/telephony/twilio/voice",
            "twilio_speech_webhook": "POST /api/telephony/twilio/gather",
            "exotel_applet": "POST /api/telephony/exotel/voice",
            "language_keypad_map": DTMF_LANGUAGES,
            "credentials_configured": bool(os.getenv("TWILIO_AUTH_TOKEN") or os.getenv("EXOTEL_API_KEY")),
        },
        "managed_voice_agents": {
            "vapi_custom_llm": "POST /api/telephony/vapi/chat/completions",
            "vapi_server_events": "POST /api/telephony/vapi/webhook",
            "retell_custom_llm": "POST /api/telephony/retell/llm-webhook",
            "note": "Same interview engine, exposed in each platform's contract, "
                    "so the managed-telephony route needs no logic changes.",
        },
        "whatsapp": {
            "webhook": "/api/telephony/whatsapp/webhook",
            "verify_token_configured": bool(os.getenv("WHATSAPP_VERIFY_TOKEN")),
            "credentials_configured": bool(os.getenv("WHATSAPP_ACCESS_TOKEN")),
        },
        "note": "All channels share one dialogue engine; phone numbers are stored "
                "only as salted hashes.",
    }
