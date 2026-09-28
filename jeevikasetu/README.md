# JeevikaSetu · जीविकासेतु

**AI-Driven Voice Assistant for Livelihood Mapping and NSQF-Aligned Skilling
Recommendations for SC Communities under the GIA component of PM-AJAY**

| | |
|---|---|
| **Smart India Hackathon** | 2026 |
| **Problem Statement ID** | **26097** |
| **Organisation** | Ministry of Social Justice and Empowerment (MoSJE) |
| **Scheme** | PM-AJAY — Grants-in-Aid (GIA) component |
| **Status** | Working prototype (functional, end-to-end) |

> *"आपकी भाषा में, आपके हुनर की पहचान" — Your skills, your language, your future.*

---

## 1. What this prototype actually does (not mockups)

1. A beneficiary opens the portal (or "calls" the IVR line, or sends a WhatsApp
   voice note) and **speaks** — no typing, no forms.
2. The assistant conducts a **9-topic empathetic interview**, one question at a
   time, in the language the person speaks (Hindi, English, Marathi, Tamil,
   Telugu, Bengali — auto-detected mid-conversation).
3. The conversation is converted into a **structured Beneficiary Profile**, with
   informal/traditional work translated into **formal NSQF competencies**
   (e.g. *"पिताजी के साथ चमड़े का काम"* → `leather cutting, leather stitching,
   hide processing, product finishing`).
4. A deterministic, explainable engine scores the profile against **51 NSQF
   Qualification Packs**, computes **skill gaps**, flags **RPL eligibility**,
   picks the **nearest empanelled training centre** within the person's stated
   travel limit and maps the applicable **PM-AJAY GIA financial support**.
5. Everything is rendered as ranked pathway cards + a roadmap + a Leaflet map,
   and can be exported as a **PDF report**.
6. An **official dashboard** aggregates reach by channel/language, informal
   skills surfaced, district demand heat map and indicative GIA utilisation.

---

## 2. Run it (2 terminals, ~2 minutes)

### Backend — FastAPI

```bash
cd jeevikasetu/backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # optional: add OPENAI_API_KEY for live AI mode
python main.py                # → http://localhost:8000  (docs at /docs)
```

### Tests (60 tests, < 3 s)

```bash
cd jeevikasetu/backend && pip install -r requirements.txt && pytest -q
```

| File | What it pins |
|---|---|
| `tests/test_engines.py` | One question per turn in all 6 languages, informal work → NSQF competencies, RPL only when the overlap is real, education / mobility / health constraints respected, reproducible ranking |
| `tests/test_channels.py` | Health probe, DPDP consent + withdrawal erasure, Twilio & Exotel IVR turns, WhatsApp webhook, Vapi & Retell custom-LLM contracts, dropped-call resume, no raw phone numbers in the DB, full journey conversation → profile → recommend → PDF |
| `tests/test_report.py` | PDF renders Devanagari / Tamil / Telugu / Bengali names with embedded fonts, and the download header is RFC 5987-safe |

Each run uses a throw-away SQLite file (`tests/conftest.py`), so results are
deterministic. Bugs these tests actually caught are listed in §11.

### Frontend — React + Vite

```bash
cd jeevikasetu/frontend
npm install
npm run dev                   # → http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://127.0.0.1:8000`, so the UI works
with no extra configuration. On first start the backend seeds 24 anonymised demo
beneficiaries so the official dashboard is populated for the demo.

---

## 3. Two AI modes — the demo never fails

| | **LIVE AI MODE** (`OPENAI_API_KEY` set) | **OFFLINE DEMO MODE** (no key) |
|---|---|---|
| Speech-to-Text | **Bhashini (ULCA)** if credentials are set, else OpenAI **Whisper** | Browser **Web Speech API** |
| Dialogue | **GPT-4o-mini** with the empathetic system prompt | Deterministic multilingual slot-filling engine |
| Profile extraction | GPT-4o-mini JSON extraction + lexicon enrichment | Rule-based parsers + informal-skill lexicon |
| Text-to-Speech | **Bhashini (ULCA)** if credentials are set, else OpenAI **TTS** | Browser **SpeechSynthesis** |
| Recommendations | Same deterministic NSQF matcher (reproducible & explainable) | Same |

**Speech provider order — Bhashini → OpenAI → browser.** Bhashini is the
Government of India's own language stack (MeitY), so it is tried first for STT,
TTS and translation: set `BHASHINI_USER_ID`, `BHASHINI_API_KEY` and optionally
`BHASHINI_PIPELINE_ID` in `.env` (`backend/services/bhashini_service.py`). With
no credentials each layer falls through silently to the next; `GET /api/health`
reports a `providers` block saying exactly which one is live.

The mode is shown as a badge in the header and returned by `GET /api/health`.
Both modes expose identical APIs — the frontend code path never changes. This is
deliberate: **a flaky conference Wi-Fi or a missing key cannot break the
presentation**, and the ranking logic stays auditable for a government use case.

There is additionally a **Demo Mode** toggle in the header: it replays a curated
Hindi conversation (Ramesh Kumar, Varanasi) through the *real* backend engine,
so the flow can be shown even in a noisy hall or with no microphone.

---

## 4. Modules and where the code lives

| Module | Implementation |
|---|---|
| 1 · AI voice calling agent | `frontend/src/components/VoiceAgent.jsx` + `backend/services/dialogue_manager.py` (browser WebRTC/MediaRecorder route, i.e. "Option C"; IVR + WhatsApp channels simulated in-app) |
| 2 · Multilingual speech pipeline | `frontend/src/utils/audioUtils.js`, `backend/services/{whisper_service,tts_service,language}.py` |
| 3 · Profiling & skill extraction | `backend/services/profile_extractor.py`, `backend/services/skill_lexicon.py` |
| 4 · NSQF / RPL mapping & gap analysis | `backend/services/nsqf_matcher.py`, `backend/services/skill_gap_analyzer.py` |
| 5 · Opportunity matching | `backend/services/data_store.py` (haversine distance, mobility & education filters) + `frontend/src/components/OpportunityExplorer.jsx` (jobs / ventures / centres / NSQF catalogue with live filters) |
| 6 · Web application | `frontend/src/pages/*`, `frontend/src/components/*` |
| 7 · Backend API | `backend/main.py`, `backend/routers/*` |
| 8 · WhatsApp voice notes | `frontend/src/components/WhatsAppChat.jsx` (in-app simulation) + `backend/routers/telephony.py` (real Meta Cloud API webhook) |

### Real channel adapters (`backend/routers/telephony.py`)

The IVR and WhatsApp screens in the UI are simulations of the same engine, but
the production webhooks are implemented and can be curled without any provider
credentials:

| Endpoint | Provider contract |
|---|---|
| `POST /api/telephony/twilio/voice` | Inbound call → TwiML language menu (`1 hi, 2 en, 3 mr, 4 ta, 5 te, 6 bn`) |
| `POST /api/telephony/twilio/gather` | Speech result in → next question out as TwiML |
| `POST /api/telephony/exotel/voice` | Exotel Voicebot applet (JSON in, JSON out) |
| `GET  /api/telephony/whatsapp/webhook` | Meta verification handshake |
| `POST /api/telephony/whatsapp/webhook` | Inbound text / voice note → dialogue turn + reply payload |
| `POST /api/telephony/vapi/chat/completions` | Vapi.ai "Custom LLM" provider — OpenAI-shaped in/out |
| `POST /api/telephony/retell/llm-webhook` | Retell.ai custom-LLM contract (incl. `ping_pong`) |
| `GET  /api/telephony/status` | Integration summary and which credentials are configured |

The brief offered three routes for the calling agent; this prototype ships
**Option C** (browser MediaRecorder → backend STT → engine → TTS) as the live
demo *and* **Option A** as a drop-in backup: Vapi and Retell can drive the call
with their own ASR/TTS while delegating the brain to the endpoints above, so
moving to managed telephony needs no dialogue changes.

Every channel calls the **same** `services/dialogue_manager.next_turn`, so the
interview can never drift between web, phone and WhatsApp. A caller whose
network drops mid-interview resumes where they left off on redial (24 h window);
a finished interview starts clean and the old transcript is erased.

### API surface

```
GET  /api/health                         capability + AI-mode probe
POST /api/voice/transcribe               audio blob  → transcript (Whisper / browser)
POST /api/voice/synthesize               text + lang → mp3 (OpenAI TTS / browser)
POST /api/voice/detect-language          script + marker-word language detection
POST /api/conversation/start             open a session (web | ivr | whatsapp)
POST /api/conversation/message           one dialogue turn (+ slot state, progress)
POST /api/conversation/consent           record or withdraw consent (withdrawal erases)
GET  /api/conversation/{id}              full transcript
GET  /api/conversation/demo/script       pre-recorded demo conversation
POST /api/profile/extract                transcript → structured profile JSON
POST /api/profile/save                   persist human corrections
GET  /api/profile/personas               5 curated demo personas
POST /api/recommend                      profile → ranked NSQF pathways + gaps + GIA
GET  /api/nsqf/qualification-packs       51 QPs, filterable by sector/level/RPL
GET  /api/training-centers               22 centres, distance-sorted
GET  /api/opportunities                  30 jobs + 20 self-employment ventures
GET  /api/gia-benefits                   PM-AJAY GIA benefit heads
POST /api/report/generate                PDF recommendation report
GET  /api/dashboard/stats                aggregate programme analytics
GET  /api/dashboard/beneficiaries        filterable beneficiary register
GET  /api/dashboard/scheme-utilisation   indicative GIA outlay by head
POST /api/telephony/{twilio,exotel}/...  real IVR webhooks (TwiML / JSON applet)
ANY  /api/telephony/whatsapp/webhook     Meta Cloud API verification + messages
GET  /api/telephony/status               channel integration status
```

---

## 5. The recommendation engine (explainable by design)

```
score = 0.28·skill_overlap + 0.26·interest_alignment + 0.14·income_potential
      + 0.14·accessibility + 0.08·education_fit + 0.06·preference_fit
      + 0.04·regional_demand
```

* **Hard filter** — a QP whose minimum education is more than one level above the
  beneficiary is never recommended.
* **Constraint awareness** — heavy-physical sectors are down-weighted when a
  physical limitation is mentioned; accessibility decays beyond the stated
  travel radius (haversine distance to real district coordinates).
* **RPL logic** — `rpl_eligible && overlap ≥ 80%` → direct RPL certification;
  `≥ 70%` → RPL + short bridge course; else full training. Training hours are
  recomputed accordingly (this is the "shortened journey" the scheme wants).
* **Every card exposes its score breakdown** and a plain-language "why", because
  a government officer must be able to defend a recommendation.

---

## 6. Curated data (`backend/data/`, regenerate with `python generate_seed_data.py`)

| File | Records |
|---|---|
| `nsqf_database.json` | **51** NSQF Qualification Packs across 15 sectors (Leather, Handicrafts & Carpet, Textile, Agriculture, Construction, Plumbing, Power, Automotive, Electronics, Beauty & Wellness, Food Processing, Healthcare, Retail, IT/ITES, Tourism, Domestic Worker) |
| `training_centers.json` | **22** centres with real district coordinates, courses, batches, hostel availability |
| `opportunities.json` | **30** wage jobs + **20** self-employment ventures (investment, tools, income, GIA head) |
| `gia_benefits.json` | **7** PM-AJAY GIA benefit heads (training, RPL, toolkit, enterprise capital, stipend, travel/hostel, placement) |
| `sample_personas.json` | **5** complete demo personas across UP, Rajasthan, Tamil Nadu, Maharashtra, Bihar |

> Data honesty: QP codes follow the public NSQF/NCVET naming convention; amounts,
> durations, batches and centre details are **indicative prototype values**
> curated for demonstration, and are labelled as such in the UI and the PDF.

---

## 7. Judge demo script (3–5 minutes)

> *"Ramesh, 28, from a village near Varanasi. SC community. Family does leather
> work; he now does daily wage construction labour. Feature phone. Speaks Hindi."*

| # | Action | What the judges see |
|---|---|---|
| 1 | Open `/` | Government-style portal, language selector, three big voice CTAs |
| 2 | Click **बात करें** | Voice screen; press the mic |
| 3 | AI greets in Hindi | *"नमस्ते! मैं जीविकासेतु हूँ…"* — spoken aloud |
| 4 | Speak answers in Hindi | Live transcript appears as subtitles |
| 5 | 3–4 exchanges | Warm acknowledgements + a follow-up probe on the traditional skill |
| 6 | Interview completes | AI summarises everything and asks for confirmation; progress hits 100% |
| 7 | **मेरी जानकारी देखें** | Extracted profile card + skill radar + raw JSON (editable) |
| 8 | **सुझाव तैयार करें** | Ranked NSQF pathways |
| 9 | Expand card 1 | Skill gaps, roadmap, income, explainable score |
| 10 | Card with 🥇/🥈 | **RPL ELIGIBLE** badge on the leather pathway — experience shortens the journey |
| 11 | Scroll down | Leaflet map of nearby empanelled centres with distances |
| 12 | GIA panel | Toolkit grant / enterprise capital / stipend the person qualifies for |
| 13 | **Download report** | Government-formatted PDF |
| 13b | `/opportunities` | Jobs, ventures, centres and the full 51-QP catalogue, filtered by district, radius and eligibility |
| 14 | `/ivr` | Dial pad → language menu → same interview on a feature phone |
| 15 | `/whatsapp` | Voice note in, voice note out |
| 16 | `/dashboard` | Officer view: channel reach, languages, district heat map, GIA outlay |

Tip: switch **Demo Mode** on in the header if the room is noisy — scripted
answers are pushed through the same live engine. Use the floating **Record
demo** button to capture a `.webm` of the run for the PPT.

---

## 8. Documentation for the submission

* `docs/PPT_CONTENT.md` — slide-by-slide copy for the SIH idea submission
* `docs/architecture.png` / `.svg` — slide-ready architecture diagram (1920 px)

## 9. Architecture

```
Beneficiary ──voice──┬── Web (browser mic, WebRTC/MediaRecorder)
                     ├── IVR (feature phone, toll-free)        ─┐
                     └── WhatsApp voice note                    │
                                                                ▼
                       ┌──────────── FastAPI backend ─────────────┐
   STT  Whisper / Web Speech API ─►  language detection           │
                       │            dialogue manager (GPT-4o | rule engine)
                       │            profile extractor (+ informal-skill lexicon)
                       │            NSQF matcher · skill-gap · RPL · GIA mapper
                       │            opportunity/geo engine (haversine)
   TTS  OpenAI TTS / SpeechSynthesis ◄──── reply in same language │
                       └────────────── SQLite (PostgreSQL-ready) ─┘
                                                 │
                        React + Tailwind UI ◄────┴──► Official dashboard
```

**Stack** — React 19 + Vite + Tailwind CSS + Framer Motion + Recharts + Leaflet ·
Python 3.11 + FastAPI + SQLAlchemy + ReportLab · SQLite (Postgres-compatible
schema via `JS_DATABASE_URL`) · OpenAI Whisper / GPT-4o-mini / TTS (optional).

## 10. Privacy & governance notes

* **DPDP Act 2023 consent gate.** The voice interview cannot start until the
  beneficiary agrees to a plain-language notice (`components/ConsentGate.jsx`);
  consent text, scope and timestamp are stored on the session. "Withdraw &
  erase" deletes every stored message, clears the extracted slots and marks the
  session `withdrawn` — verified by a test.
* **Phone numbers are never stored.** IVR and WhatsApp sessions are keyed by a
  salted SHA-256 hash of the number (`ivr…`, `wh…`), so the database holds no
  direct identifier.
* No Aadhaar, bank or caste-certificate numbers are ever requested.
* Voice is transcribed and discarded; only the derived profile is stored.
* The dashboard is aggregate-first and can be served anonymised.
* All scheme amounts are labelled indicative; nothing is presented as an
  official government extract.

---

## 11. Bugs the test suite caught (and how they were fixed)

Kept here because "we wrote tests" means little without evidence they bite.

| Bug | Fix |
|---|---|
| "pattern making" was treated as a synonym of "cutting", inflating skill-match % | Split the lexicon entries; match % recomputed |
| Travel / hostel GIA support did not trigger when a centre was beyond the beneficiary's stated mobility but within 10 km | Support heads now keyed off the gap, not the raw distance |
| The mobility question asked two things in one turn | One question per turn, enforced by a test in all 6 languages |
| A Devanagari name crashed the PDF download (latin-1 `Content-Disposition`) | RFC 5987 `filename*` + ASCII fallback (`routers/report.py::_disposition`) |
| Indic text rendered as black boxes in the PDF | Bundled Noto Sans Devanagari / Tamil / Telugu / Bengali, with per-script font switching (`services/pdf_fonts.py`) |
| A redial reused the caller's session and treated "नमस्ते" as an answer to the pending question | Resume policy + fresh-session detection in `routers/telephony.py`, plus a "welcome back" turn in the dialogue engine |
