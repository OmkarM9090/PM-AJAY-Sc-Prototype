# ARCHITECTURE — Livelihood Mitra
## Functional SIH Submission/Demo Architecture

### 1. Architecture principle
Use one common decision engine behind three access channels:

```text
                LIVELIHOOD MITRA
                       |
         +-------------+-------------+
         |             |             |
      PHONE          WEB         WHATSAPP
      / IVR        DASHBOARD       VOICE
         |             |             |
         +-------------+-------------+
                       |
                VOICE / API LAYER
                       |
                ASR + LANGUAGE
                       |
               CONVERSATION AI
                       |
             STRUCTURED PROFILE
                       |
        +--------------+---------------+
        |              |               |
      SKILLS         GOALS       CONSTRAINTS
        +--------------+---------------+
                       |
                 NSQF / RPL KB
                       |
                  SKILL GAP
                       |
          COURSE / JOB / ENTERPRISE
                       |
             HARD RULE FILTERS
                       |
            SEMANTIC + LEXICAL MATCH
                       |
                RANKING LAYER
                       |
              EXPLANATION LAYER
                       |
             LIVELIHOOD ROADMAP
                    /      \
                  TTS      WEB UI
                    |        |
                 User      Judge/Admin
```

### 2. Recommended application architecture
**Frontend:** Next.js/React + TypeScript + Tailwind CSS.

**Backend:** FastAPI/Python.

**Database:** PostgreSQL + pgvector for production-like relational + semantic retrieval. A local JSON/SQLite seed can be retained for development/fallback.

**Realtime:** WebSocket/SSE from backend to judge dashboard for transcript/profile/recommendation events.

**Voice:** Prefer a real telephony + voice-agent provider path for the phone demo. Current documented options include Sarvam Voice Agents with Exotel/Twilio telephony; Sarvam's documentation explicitly describes inbound phone agents using telephony plus STT/LLM/TTS. Keep provider adapters so Bhashini or another speech provider can be substituted.

### 3. Live phone call path
```text
Caller
  ↓
Exotel / Twilio number
  ↓
Voice-agent runtime
  ↓
STT / language detection
  ↓
Conversation controller
  ↓
Backend tool calls
  ├─ profile update
  ├─ NSQF/RPL lookup
  ├─ skill-gap calculation
  ├─ opportunity retrieval
  ├─ eligibility/constraint rules
  └─ recommendation
  ↓
TTS
  ↓
Caller hears response
```

The phone provider carries the call; the voice-agent layer handles speech/reasoning; the application backend remains the source of truth for profile, matching and policy logic.

### 4. Web judge path
```text
Browser Mic
  ↓
Browser/voice adapter
  ↓
ASR
  ↓
Backend session
  ↓
Profile + matching + roadmap
  ↓
WebSocket events
  ↓
Live judge dashboard
```

### 5. AI responsibilities
**ASR:** speech → text.

**Language layer:** detect/switch language, normalize code-mixing where supported.

**LLM:** conversational questions, understanding, structured slot extraction, clarification, user-friendly explanation wording.

**Semantic retrieval:** match spoken skills/experience to occupations/QPs/courses/jobs.

**Rules engine:** verified policy conditions, distance/constraint logic, eligibility checks and calculations.

**Recommendation engine:** combines hard filters + semantic/lexical relevance + user preferences.

**TTS:** response text → spoken response in the user's selected language.

### 6. Hybrid safety boundary
Never let the LLM be the source of truth for scheme rules, benefit amounts, eligibility or calculations.

`LLM understands → backend tools retrieve/compute → validator checks → LLM explains.`

### 7. Data model
Core entities:
- beneficiary_session
- beneficiary_profile
- skill
- occupation
- qpnOS
- rpl_mapping
- course
- training_centre
- job
- self_employment_path
- location
- scheme_reference
- recommendation
- roadmap

### 8. Recommendation pipeline
```text
Profile
 ↓
Hard filters
  - verified eligibility metadata
  - user-stated mobility/travel limits
  - availability/status
 ↓
Candidate retrieval
  - lexical BM25-style match
  - semantic embedding match
 ↓
Soft ranking
  - skills
  - qualification
  - interest
  - skill gap
  - location
  - duration
  - work preference
  - opportunity relevance
 ↓
Why-this explanation
 ↓
Roadmap
```

Weights must be configurable and treated as proposed tuning unless validated on the target dataset. Do not blindly hardcode research-paper benchmarks as product guarantees.

### 9. Low-connectivity strategy
For the beneficiary, phone access should not require mobile-data access when using a telephone call. The backend still needs connectivity to the telephony/voice service.

Fallbacks:
- web text fallback;
- cached/curated knowledge data;
- provider retry;
- predefined clarification flow;
- safe no-result pathway;
- human escalation/contact option.

Do not call the entire system "fully offline" unless a truly offline implementation exists.

### 10. Government data integration
Design an adapter layer for:
- PM-AJAY reference information;
- NCVET/NSQF/QP/NOS data;
- NCS opportunity data where permitted;
- Bhashini language services;
- state/UT sources later.

Use versioned, curated data for demo when live government API/write access is not available.

### 11. Admin insight architecture
Only aggregate/anonymize for the dashboard:
`profile signals → anonymous aggregation → skill/need trends → training/opportunity demand`.

Do not expose individual caste, phone or other sensitive profile data in analytics.

### 12. Deployment recommendation
- Web frontend: Vercel or equivalent.
- Backend: managed Python host/container platform.
- Database: managed PostgreSQL.
- Telephony: Exotel or Twilio-compatible provider.
- Voice agent: provider API/runtime with server-side secrets.
- HTTPS required for public webhooks.

Keep every external integration behind an adapter interface.
