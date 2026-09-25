from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
from services.llm_engine import process_conversation
import xml.etree.ElementTree as ET

router = APIRouter()

@router.post("/twiml")
async def twilio_webhook(request: Request, db: Session = Depends(get_db)):
    form = await request.form()
    call_sid = form.get("CallSid")
    speech_result = form.get("SpeechResult", "")
    
    session = db.query(models.Session).filter(models.Session.id == call_sid).first()
    
    if not session:
        session = models.Session(id=call_sid, channel="phone")
        db.add(session)
        db.commit()
        db.refresh(session)
        
        db_profile = models.Profile(session_id=session.id)
        db.add(db_profile)
        db.commit()
        
        greeting = "Namaste, main Livelihood Mitra hoon. Main aapke hunar ke anusaar sahi kaam dhoondhne mein madad karunga. Aapki padhai kahan tak hui hai?"
        
        # Save greeting
        db.add(models.Message(session_id=call_sid, speaker="agent", text=greeting))
        db.commit()
        
        return build_twiml(greeting)
        
    # Process user speech
    db.add(models.Message(session_id=call_sid, speaker="user", text=speech_result))
    db.commit()
    
    response_msg = process_conversation(session.messages, session.profile)
    ai_text = response_msg.content or "Main dhundh raha hoon."
    
    db.add(models.Message(session_id=call_sid, speaker="agent", text=ai_text))
    db.commit()
    
    return build_twiml(ai_text)

def build_twiml(text: str):
    root = ET.Element("Response")
    say = ET.SubElement(root, "Say")
    say.set("voice", "Polly.Aditi")
    say.set("language", "hi-IN")
    say.text = text
    
    gather = ET.SubElement(root, "Gather")
    gather.set("input", "speech")
    gather.set("timeout", "5")
    gather.set("speechTimeout", "auto")
    
    return ET.tostring(root, encoding="utf8", method="xml")
