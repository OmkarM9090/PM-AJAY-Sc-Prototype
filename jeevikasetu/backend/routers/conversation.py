"""Conversation endpoints — stateful voice interview across web / IVR / WhatsApp."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from config import AI_MODE
from database import ConversationSession, Message, dumps, get_db, loads
from services.dialogue_manager import DEMO_SCRIPT_HI, next_turn
from services.language import SLOT_LABELS, SLOT_ORDER

router = APIRouter(prefix="/api/conversation", tags=["conversation"])


class StartRequest(BaseModel):
    language: str = "hi"
    channel: str = "web"
    demo_mode: bool = False


class MessageRequest(BaseModel):
    session_id: str
    text: str
    language: str | None = None


def _serialise(session: ConversationSession):
    return {
        "session_id": session.id,
        "language": session.language,
        "channel": session.channel,
        "status": session.status,
        "slots": session.slots.get("slots", {}),
        "messages": [{"speaker": m.speaker, "text": m.text, "language": m.language,
                      "slot": m.slot, "at": m.created_at.isoformat()} for m in session.messages],
    }


def _state(session):
    raw = session.slots
    return raw.get("slots", {}), raw.get("asked_probes", [])


def _save_state(session, slots, probes):
    session.slots_json = dumps({"slots": slots, "asked_probes": probes})


@router.get("/script")
def script():
    """The 9-question interview script + labels, used by the progress tracker."""
    return {"slots": [{"key": s, "labels": SLOT_LABELS[s]} for s in SLOT_ORDER],
            "total": len(SLOT_ORDER), "ai_mode": AI_MODE}


@router.post("/start")
def start(req: StartRequest, db: Session = Depends(get_db)):
    session = ConversationSession(id=str(uuid.uuid4())[:8], language=req.language,
                                  channel=req.channel, demo_mode=req.demo_mode,
                                  slots_json=dumps({"slots": {}, "asked_probes": []}))
    db.add(session)
    db.commit()

    turn = next_turn([], {}, None, req.language)
    msg = Message(session_id=session.id, speaker="assistant", text=turn.reply,
                  language=turn.language, slot=turn.next_slot)
    db.add(msg)
    db.commit()

    return {"session_id": session.id, "reply": turn.reply, "language": turn.language,
            "next_slot": turn.next_slot, "progress": turn.progress, "completed": False,
            "engine": turn.engine, "ai_mode": AI_MODE}


@router.post("/message")
def message(req: MessageRequest, db: Session = Depends(get_db)):
    """One conversational turn: user utterance in → assistant reply out."""
    session = db.query(ConversationSession).filter(ConversationSession.id == req.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    slots, probes = _state(session)
    history = [{"speaker": m.speaker, "text": m.text} for m in session.messages]

    db.add(Message(session_id=session.id, speaker="user", text=req.text,
                   language=req.language or session.language))
    db.commit()

    turn = next_turn(history, slots, req.text, req.language or session.language, probes)

    new_probes = list(probes)
    for key in turn.slots:
        if key.startswith("probe_") and key not in new_probes:
            new_probes.append(key)

    _save_state(session, turn.slots, new_probes)
    session.language = turn.language
    if turn.completed:
        session.status = "completed"
    db.add(Message(session_id=session.id, speaker="assistant", text=turn.reply,
                   language=turn.language, slot=turn.next_slot))
    db.commit()

    return {"session_id": session.id, "reply": turn.reply, "language": turn.language,
            "next_slot": turn.next_slot, "slots": turn.slots, "progress": turn.progress,
            "completed": turn.completed, "summary": turn.summary, "engine": turn.engine,
            "ai_mode": AI_MODE}


@router.get("/{session_id}")
def get_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(ConversationSession).filter(ConversationSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return _serialise(session)


@router.get("/demo/script")
def demo_script():
    """Pre-recorded Hindi conversation used by Demo Mode during the presentation."""
    return {"language": "hi",
            "turns": [{"speaker": s, "text": t, "slot": slot} for s, t, slot in DEMO_SCRIPT_HI]}
