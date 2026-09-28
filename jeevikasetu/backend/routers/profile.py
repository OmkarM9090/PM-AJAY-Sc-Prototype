"""Profile extraction & persistence endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import BeneficiaryProfile, ConversationSession, dumps, get_db
from services.data_store import personas
from services.profile_extractor import extract_profile

router = APIRouter(prefix="/api/profile", tags=["profile"])


class ExtractRequest(BaseModel):
    session_id: str | None = None
    transcript: list | None = None          # [{speaker, text}] when running client-side
    slots: dict | None = None
    language: str = "hi"


class SaveRequest(BaseModel):
    session_id: str | None = None
    profile: dict


def _persist(db, session_id, profile, channel="web"):
    loc = profile.get("location") or {}
    row = None
    if session_id:
        row = db.query(BeneficiaryProfile).filter(BeneficiaryProfile.session_id == session_id).first()
    if not row:
        row = BeneficiaryProfile(session_id=session_id)
        db.add(row)
    row.name = profile.get("name")
    row.age = profile.get("age")
    row.gender = profile.get("gender")
    row.village = loc.get("village")
    row.district = loc.get("district")
    row.state = loc.get("state")
    row.education = profile.get("education")
    row.category = profile.get("category", "SC")
    row.family_occupation = profile.get("family_occupation")
    row.current_livelihood = profile.get("current_livelihood")
    row.identified_skills_json = dumps(profile.get("identified_skills", []))
    row.interests_json = dumps(profile.get("interests", []))
    row.employment_preference = profile.get("employment_preference")
    row.mobility_range_km = profile.get("mobility_range_km") or 10
    row.physical_constraints = profile.get("physical_constraints")
    row.languages_json = dumps(profile.get("languages_spoken", []))
    row.channel = channel
    db.commit()
    db.refresh(row)
    return row


@router.post("/extract")
def extract(req: ExtractRequest, db: Session = Depends(get_db)):
    """Build the structured Beneficiary Profile JSON from a conversation."""
    slots = req.slots or {}
    messages = req.transcript or []
    channel = "web"

    if req.session_id:
        session = db.query(ConversationSession).filter(
            ConversationSession.id == req.session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        channel = session.channel
        slots = slots or session.slots.get("slots", {})
        if not messages:
            messages = [{"speaker": m.speaker, "text": m.text} for m in session.messages]

    if not slots and not messages:
        raise HTTPException(status_code=400, detail="Provide session_id, slots or transcript")

    profile = extract_profile(slots, messages, req.language)
    row = _persist(db, req.session_id, profile, channel)
    profile["profile_id"] = row.id
    profile["session_id"] = req.session_id
    return profile


@router.post("/save")
def save(req: SaveRequest, db: Session = Depends(get_db)):
    """Persist user edits from the profile dashboard (AI can get things wrong)."""
    row = _persist(db, req.session_id, req.profile)
    return row.to_dict()


@router.get("/personas")
def sample_personas():
    """5 curated demo personas — used by Demo Mode and by judges to compare outputs."""
    return {"personas": personas()}


@router.get("/list")
def list_profiles(db: Session = Depends(get_db), limit: int = 100):
    rows = db.query(BeneficiaryProfile).order_by(BeneficiaryProfile.id.desc()).limit(limit).all()
    return {"count": len(rows), "profiles": [r.to_dict() for r in rows]}
