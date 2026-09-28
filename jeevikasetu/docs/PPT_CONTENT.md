# JeevikaSetu — PPT content pack (SIH 2026, PS 26097)

Slide-by-slide copy you can paste into the SIH idea-submission template.
Visual asset: `docs/architecture.png` (1920 px, slide-ready) / `docs/architecture.svg`.

---

## Slide 1 — Title

**JeevikaSetu · जीविकासेतु**
AI-Driven Voice Assistant for Livelihood Mapping and NSQF-Aligned Skilling
Recommendations for SC Communities under the GIA component of PM-AJAY

*"आपकी भाषा में, आपके हुनर की पहचान" — Your skills, your language, your future.*

Problem Statement **26097** · Ministry of Social Justice and Empowerment ·
Category: Software · **Working prototype built and demoable**

---

## Slide 2 — The problem, stated sharply

* PM-AJAY's GIA component funds skilling and income-generation for SC households,
  but the **discovery layer is broken**: eligible people never learn which
  NSQF-aligned trade fits them, or which support they can claim.
* The people the scheme targets are **exactly the people forms exclude** — low
  literacy, low digital literacy, feature phones, regional languages.
* Decades of **informal skill** (leather work, weaving, pottery, masonry, domestic
  care) carry **zero formal recognition**, so a 10-year artisan is enrolled as a
  fresh trainee — wasting both the person's time and public money.
* Officials plan blind: no district-level view of what skills actually exist.

**Consequence:** low GIA absorption, generic training, poor placement, repeat poverty.

---

## Slide 3 — Our solution in one line

> **A voice-first AI field worker that talks to a beneficiary in their own
> language, converts their life's work into formal NSQF competencies, and hands
> back a ranked, constraint-aware livelihood plan linked to PM-AJAY money.**

Three things happen in one 4-minute conversation:
1. **Listen** — a warm, patient interview covering 9 topics, one question at a time.
2. **Recognise** — informal work → NSQF competencies → skill gaps → **RPL shortcut**.
3. **Route** — ranked pathways + nearest empanelled centre + applicable GIA heads
   + a step-by-step roadmap + a downloadable report.

---

## Slide 4 — How it works (use `architecture.png`)

| Stage | What runs |
|---|---|
| Channel | Web voice · IVR toll-free (feature phone) · WhatsApp voice note |
| Speech in | **Bhashini (MeitY)** first → OpenAI Whisper → browser Web Speech API |
| Understanding | Language auto-detection (script + marker words) → dialogue manager (GPT-4o-mini or deterministic engine) |
| Extraction | Beneficiary Profile JSON + **informal-skill lexicon** ("chamde ka kaam" → leather cutting, stitching, hide processing, finishing) |
| Matching | 51 NSQF QPs scored; gaps computed; RPL decided; geo/mobility/education/health filters |
| Support | PM-AJAY GIA heads mapped to the chosen pathway |
| Speech out | Bhashini TTS → OpenAI TTS → browser SpeechSynthesis — **same language the person spoke** |
| Consent | DPDP-compliant consent gate before any recording; one tap to withdraw and erase |

---

## Slide 5 — What makes it different (not another chatbot)

1. **Voice-first, zero typing** — the entire journey, including corrections, is speakable.
2. **Six languages, auto-detected**, including mid-conversation switching.
3. **Empathetic interview, not a form** — warm acknowledgements, follow-up probes on
   traditional skills, clarification when an answer is unclear.
4. **Informal skill recognition** — the core IP: a lexicon + extraction layer that
   converts lived work into the exact vocabulary of NSQF Qualification Packs.
5. **RPL pathway detection** — ≥80% overlap → direct RPL certification; ≥70% → RPL
   plus a short bridge course. A 400-hour course collapses to ~40 hours.
6. **Constraint-aware ranking** — education hard filter, travel radius (haversine
   to real district coordinates), physical limitations down-weight heavy trades.
7. **GIA entitlement linkage** — every pathway shows the money: training support,
   RPL fee, toolkit grant, enterprise capital, stipend, travel/hostel, placement.
8. **Explainable by design** — each card exposes its score breakdown and a
   plain-language "why". A District Officer can defend every recommendation.
9. **Multi-channel last mile** — web, IVR and WhatsApp on one engine, with real
   Twilio / Exotel / Meta webhooks implemented (`/api/telephony/*`), not mocked.
   A dropped rural call resumes on redial instead of restarting the interview.
10. **Officer dashboard** — reach by channel/language, skills surfaced, district
    demand heat map, indicative GIA outlay.

**Plus two things government buyers ask about first**

* **Bhashini-first language stack** — India's own ASR/TTS/NMT is the primary
  provider; OpenAI is only a fallback and the browser engine a last resort, so
  the system can run entirely on sovereign language infrastructure.
* **DPDP Act 2023 by construction** — explicit consent before the mic opens,
  purpose limitation shown in plain Hindi, one-tap withdrawal that erases the
  transcript, and phone numbers stored only as salted hashes.

---

## Slide 6 — The ranking model (show the formula, judges love rigour)

```
score = 0.28·skill_overlap + 0.26·interest_alignment + 0.14·income_potential
      + 0.14·accessibility + 0.08·education_fit + 0.06·preference_fit
      + 0.04·regional_demand
```

* Hard filter: never recommend a QP more than one education level above the person.
* Accessibility decays beyond the stated travel radius; travel/hostel support is
  auto-attached when the centre is beyond 10 km or beyond the person's own limit.
* Deterministic → **the same profile always produces the same ranking** (auditable,
  a requirement for public schemes; LLM output is used for language, not for scoring).

---

## Slide 7 — Live demo walkthrough (3–5 min)

*Persona: Ramesh Kumar, 28, Chandpur village, Varanasi. SC. Family does leather
work; he now does daily-wage construction. 8th pass. Speaks Hindi. Wants his own shop.*

1. Landing page → **बात करें** → AI greets in Hindi and asks his name.
2. He answers by voice; live subtitles appear; the AI acknowledges warmly.
3. On hearing "चमड़े का काम", the AI **asks a follow-up** about his experience.
4. Nine topics covered → AI **summarises and asks for confirmation**.
5. Profile card: 8th pass, Varanasi, 30 km mobility, self-employment preference,
   and skills he never claimed himself — *leather cutting, stitching, hide
   processing, product finishing, basic construction*.
6. **Generate recommendations**:
   * 🥇 **Leather Goods Maker (LSS/Q2301, NSQF L3)** — 100% competency overlap →
     **RPL ELIGIBLE**, assessment + bridge instead of a 400-hour course.
   * 🥈 **Self Employed Tailor (AMH/Q0301, L4)** — 80% overlap, gap: customer handling.
   * 🥉 **Mobile Phone Repair Technician (ELE/Q3104, L4)** — his stated aspiration,
     full training, centre 0 km away, ₹12,000–20,000/month.
7. Roadmap, centre map, GIA panel (toolkit grant + enterprise capital + stipend).
8. **Download PDF report** → switch to **IVR** → **WhatsApp** → **officer dashboard**.

Fallbacks: **Demo Mode** replays a scripted Hindi conversation through the real
engine; a text box mirrors every voice action; the floating **Record demo** button
captures the run as `.webm` for the deck.

---

## Slide 8 — Impact

| Stakeholder | Before | With JeevikaSetu |
|---|---|---|
| Beneficiary | No idea which trade/scheme fits; forms in English | 4-minute voice conversation → a personal, funded plan |
| Experienced artisan | Re-trained from scratch | RPL route: weeks instead of months, earning sooner |
| Training centre | Mismatched, dropout-prone batches | Pre-qualified, interest-aligned, reachable candidates |
| District officer | No skill inventory | Live demand heat map + GIA utilisation projection |
| MoSJE | Low GIA absorption | Traceable pipeline from conversation → certification → livelihood |

Measurable targets: interview completion rate, % profiles with ≥1 RPL pathway,
centre distance served, training-to-placement conversion, GIA disbursal per district.

---

## Slide 9 — Feasibility & viability

* **Built, not conceptual** — FastAPI + React prototype, **57 automated tests**
  (engine, channel webhooks, consent, PDF) passing, runs end-to-end on a laptop
  with no API keys.
* **Cost** — voice-only interaction is ~₹2–4 per beneficiary at scale in live AI
  mode; the deterministic engine costs nothing and is the demo-safe default.
* **Scale path** — SQLite → PostgreSQL by one env var; stateless API behind a load
  balancer; IVR via Exotel/Twilio; WhatsApp Business API; Bhashini for ASR/TTS to
  stay within Indian language infrastructure and government procurement norms.
* **Integration roadmap** — SIDH / Skill India Digital, NCS job feed, NSDC & Sector
  Skill Council assessment agencies, state SC Welfare Department MIS.
* **Risks & mitigation** — noisy ASR → confirmation summary + editable profile;
  dialect variance → lexicon + Bhashini; connectivity → IVR channel; trust →
  no Aadhaar/bank/caste-ID collection, audio discarded after transcription;
  hallucination → scoring is deterministic, the LLM only handles language.

---

## Slide 10 — Tech stack & team ask

**Frontend** React 19 · Vite · Tailwind · Framer Motion · Recharts · Leaflet
**Backend** Python 3.11 · FastAPI · SQLAlchemy · ReportLab · SQLite/PostgreSQL
**AI** Bhashini ULCA ASR/TTS/NMT (primary) · OpenAI Whisper · GPT-4o-mini · OpenAI TTS (fallbacks)
**Channels** Browser WebRTC/MediaRecorder · Exotel/Twilio IVR · WhatsApp Business API

Repository layout: `backend/` (routers, services, prompts, curated data, tests),
`frontend/` (components, pages, data, utils), `docs/`.

Ask for the hackathon round: Bhashini production credentials (the adapter is written), a sandbox NSQF/NCVET QP feed and
an IVR number to move the demo from simulation to a live toll-free line.
