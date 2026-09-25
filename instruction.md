# INSTRUCTIONS — Implementation Order

## Phase 1 — Understand
Read all root docs and `/docs/*`. Inspect the repository. Produce a short implementation checklist before coding.

## Phase 2 — Foundation
Set up the app shell, design tokens, typography, routing, state model, translation system and reusable UI components.

## Phase 3 — Beneficiary Web Flow
Implement Welcome → Language → Consent → Interview → Profile → Skills → NSQF/RPL → Gap → Opportunities → Recommendations → Why → Roadmap → Save/Share.

## Phase 4 — Voice
Implement browser voice where supported. Add a reliable demo voice fallback. Ensure every voice action has text fallback and safe failure states.

## Phase 5 — Backend + Real Calling
Implement the minimal backend needed for live calls, session state, profile updates, retrieval, recommendation tools and WebSocket events. Integrate one telephony/voice provider through adapters. Never put provider secrets in the frontend.

## Phase 6 — Data
Seed curated/verified reference data and clearly labelled demo records. Do not scrape or call restricted government systems without an allowed interface.

## Phase 7 — Recommendation
Implement hard filters first, then candidate retrieval, then ranking, then explanation and roadmap generation. Make recommendation changes observable when profile fields change.

## Phase 8 — Multilingual QA
Test Marathi, Hindi and English on every user-facing screen. Test mixed-language input and fallback when a speech provider fails.

## Phase 9 — Judge Mode + Admin
Build a clear Judge Mode with the demo persona and a minimal anonymized insight dashboard.

## Phase 10 — Security
Move secrets to server-side environment variables; validate input; restrict admin routes; avoid unnecessary PII; sanitize displayed content.

## Phase 11 — Full QA
Run through at least these scenarios:
- normal user;
- poor ASR;
- silence;
- incomplete profile;
- contradictory answers;
- no matching training;
- no nearby opportunity;
- API timeout;
- language switch;
- changed employment goal;
- changed mobility limit;
- microphone unavailable;
- human-help request.

## Phase 12 — Demo polish
Remove placeholders. Fix visual inconsistencies. Verify all routes, buttons, loading/error states, mobile responsiveness and console output. Prepare a clean 3–5 minute judge journey.
