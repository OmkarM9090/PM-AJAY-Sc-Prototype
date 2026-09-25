# AGENTS.md — Livelihood Mitra

## Mission
Build a polished, functional SIH PS 26097 submission/demo product, not a generic chatbot.

## Source of truth
Read `prd.md`, `architecture.md`, `design.md`, `instruction.md`, `skills.md` and `/docs/*` before making architectural decisions. Preserve verified vs proposed distinctions.

## Non-negotiables
1. The PS is about SC beneficiaries under PM-AJAY/GIA, low digital literacy, language barriers, livelihood mapping and NSQF-aligned skilling recommendations.
2. Voice/calling is a core access channel, not a decorative microphone.
3. Web is the judge-facing visual interface; phone/voice is the beneficiary-facing accessibility channel.
4. Marathi, Hindi and English are first-class languages.
5. The system must use a hybrid boundary: AI for conversation/understanding; deterministic backend logic for verified policy/rules/calculations.
6. Existing government systems must be acknowledged, not replaced or falsely dismissed.
7. Never invent government APIs, live integrations, benefits, eligibility, grants, jobs or approval.
8. Demo/mock data must be clearly separated from official data.
9. Never expose secrets in frontend code.
10. Every critical user action must work or have a graceful fallback.

## Build discipline
- Inspect the current repo before changing files.
- Prefer reusable typed components.
- Keep external providers behind adapters.
- Keep data models and recommendation logic independent of UI.
- Add error and loading states for every async path.
- Preserve working features when adding new ones.
- Do not introduce unnecessary dependencies.

## Quality gate
Before declaring a feature complete, test desktop + mobile, language switching, voice fallback, profile persistence, recommendation changes, roadmap changes, error handling, and console output.

## Product truth
Livelihood Mitra is a proposed decision-support/orchestration layer connecting beneficiary context to existing skilling/employment/welfare resources. Do not imply it is an official government app.
