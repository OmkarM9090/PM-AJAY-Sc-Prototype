"""
JeevikaSetu — AI-Driven Voice Assistant for Livelihood Mapping and
NSQF-Aligned Skilling Recommendations for SC Communities (PM-AJAY · GIA).

Smart India Hackathon 2026 · Problem Statement 26097
Ministry of Social Justice and Empowerment.

Run:  python main.py        (or)  uvicorn main:app --reload --port 8000
Docs: http://localhost:8000/docs
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import AI_MODE, SUPPORTED_LANGUAGES
from database import init_db
from routers import conversation, dashboard, profile, recommend, report, voice
from seed_demo_data import seed

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("jeevikasetu")

app = FastAPI(
    title="JeevikaSetu API",
    description=("Voice-first livelihood mapping and NSQF/RPL skilling recommendation engine "
                 "for SC beneficiaries under the PM-AJAY Grants-in-Aid component."),
    version="1.0.0",
)

# The frontend dev server proxies /api, but CORS stays open for direct testing.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(voice.router)
app.include_router(conversation.router)
app.include_router(profile.router)
app.include_router(recommend.router)
app.include_router(dashboard.router)
app.include_router(report.router)


@app.on_event("startup")
def startup():
    init_db()
    result = seed()
    log.info("JeevikaSetu backend ready — AI mode: %s | demo seed: %s", AI_MODE, result)


@app.get("/api/health")
def health():
    """Health + capability probe. The UI badge reads `ai_mode` from here."""
    return {
        "status": "ok",
        "service": "JeevikaSetu",
        "problem_statement": "SIH2026-26097",
        "ai_mode": AI_MODE,
        "capabilities": {
            "server_stt": AI_MODE == "live-openai",
            "server_tts": AI_MODE == "live-openai",
            "llm_dialogue": AI_MODE == "live-openai",
            "browser_stt_fallback": True,
            "browser_tts_fallback": True,
            "deterministic_dialogue_engine": True,
            "deterministic_recommender": True,
        },
        "languages": list(SUPPORTED_LANGUAGES.keys()),
    }


@app.get("/")
def root():
    return {"service": "JeevikaSetu API", "docs": "/docs", "health": "/api/health"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
