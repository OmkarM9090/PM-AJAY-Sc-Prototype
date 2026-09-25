import asyncio
import json
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import engine, Base, get_db
import models
from services.llm_engine import process_conversation
from services.opportunity_engine import generate_recommendations
from api.telephony import router as telephony_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Livelihood Mitra API")

app.include_router(telephony_router, prefix="/api/twilio")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global event queues for SSE
session_queues = {}

class ChatRequest(BaseModel):
    session_id: str
    text: str

@app.post("/api/session")
def create_session(db: Session = Depends(get_db)):
    db_session = models.Session()
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    db_profile = models.Profile(session_id=db_session.id)
    db.add(db_profile)
    db.commit()
    
    return {"session_id": db_session.id}

@app.post("/api/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    # 1. Save user message
    user_msg = models.Message(session_id=request.session_id, speaker="user", text=request.text)
    db.add(user_msg)
    db.commit()
    
    # 2. Get history and profile
    session = db.query(models.Session).filter(models.Session.id == request.session_id).first()
    
    if not session:
        session = models.Session(id=request.session_id, channel="web")
        db.add(session)
        db.commit()
        db.refresh(session)
        db_profile = models.Profile(session_id=session.id)
        db.add(db_profile)
        db.commit()
        db.refresh(session)
    
    # 3. Process LLM
    response_msg = process_conversation(session.messages, session.profile)
    
    ai_text = response_msg.content
    tool_calls = getattr(response_msg, "tool_calls", None)
    
    # 4. Handle tools
    if tool_calls:
        for tool_call in tool_calls:
            if tool_call.function.name == "update_profile":
                args = json.loads(tool_call.function.arguments)
                if "education" in args and args["education"]: session.profile.education = args["education"]
                if "employment_preference" in args and args["employment_preference"]: session.profile.employment_preference = args["employment_preference"]
                if "radius" in args and args["radius"]: session.profile.radius = args["radius"]
                if "skills" in args and args["skills"]: 
                    current_skills = list(session.profile.skills) if session.profile.skills else []
                    session.profile.skills = list(set(current_skills + args["skills"]))
                
                db.commit()
                # Notify SSE
                await dispatch_event(request.session_id, "PROFILE_UPDATED", {
                    "education": session.profile.education,
                    "employmentPreference": session.profile.employment_preference,
                    "radius": session.profile.radius,
                    "skills": session.profile.skills
                })
                
                if ai_text is None:
                    ai_text = "Main aapki details samajh gaya. Kya aapko kuch aur batana hai?"
                    
            elif tool_call.function.name == "search_opportunities":
                recs = generate_recommendations(session.profile)
                await dispatch_event(request.session_id, "RECOMMENDATIONS_UPDATED", recs)
                
                if ai_text is None:
                    ai_text = f"Maine aapke {session.profile.radius} km ke andar options dhundh liye hain. Ab screen par dekhein."

    if not ai_text:
        ai_text = "Theek hai."

    # 5. Save AI message
    agent_msg = models.Message(session_id=request.session_id, speaker="agent", text=ai_text)
    db.add(agent_msg)
    db.commit()
    
    await dispatch_event(request.session_id, "TRANSCRIPT_UPDATED", {"text": ai_text, "speaker": "agent"})
    
    return {"text": ai_text}

async def dispatch_event(session_id: str, event_type: str, data: dict):
    if session_id in session_queues:
        for q in session_queues[session_id]:
            await q.put({"event": event_type, "data": json.dumps(data)})

@app.get("/api/events/{session_id}")
async def get_events(session_id: str, request: Request):
    if session_id not in session_queues:
        session_queues[session_id] = []
    
    q = asyncio.Queue()
    session_queues[session_id].append(q)
    
    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                event = await q.get()
                yield dict(event=event["event"], data=event["data"])
        except asyncio.CancelledError:
            pass
        finally:
            session_queues[session_id].remove(q)
            
    return EventSourceResponse(event_generator())
