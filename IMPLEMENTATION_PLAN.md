# Livelihood Mitra - Implementation Plan

## 1. Audit Results (KEEP / REFACTOR / REBUILD / ADD / REMOVE)

**KEEP:**
- `package.json` setup (Next.js, Zustand, Tailwind, Framer Motion, Lucide, React-Leaflet).
- Base folder structure (`src/app`, `src/components`, `src/core`, `src/store`, `src/lib`).
- Base UI tokens if present.

**REFACTOR:**
- `src/app/page.tsx`: Landing page needs to follow the exact new copy and design requirements.
- `src/core/models/types.ts`: Needs significant extension to match the full schema required (schemas for `ConversationSession`, `ConversationMessage`, `SkillMapping`, `RoadmapStep`, etc.).
- `src/store/useAppStore.ts`: Needs to be expanded to handle real-time events, session management, and robust state for Judge Mode.
- `src/core/engine/*`: Expand the placeholder engines to handle genuine slot filling, geographic filtering (Haversine), and deterministic mapping.

**REBUILD:**
- All `src/app/*` pages (`/interview`, `/judge`, `/profile`, `/recommendations`, `/roadmap`, `/skills`). They need a full design rebuild to feel like a premium, public-service product.
- The voice interaction layer. It must be a truly stateful, bidirectional system without rigid forms.

**ADD:**
- **Domain Schemas**: Typed definitions for `ConversationSession`, `Skill`, `Roadmap`, `Location`, `Notification`, `SavedOpportunity`, etc.
- **Core Intelligence Modules**: 
  - `ConversationEngine.ts` (Stateful dialog manager)
  - `ProfileEngine.ts` (Slot filling & extraction)
  - `SkillEngine.ts` (Normalization)
  - `MappingEngine.ts` (NSQF/RPL reference mapping)
  - `SkillGapEngine.ts` (Deterministic skill gap calculation)
  - `RecommendationEngine.ts` (Matching & ranking)
  - `GeoEngine.ts` (Location resolution & radius filtering)
  - `RoadmapEngine.ts` (Step generation)
- **Service Adapters**: `voice/sarvam`, `voice/browser`, `telephony/exotel`, `maps/google`.
- **UI Components**: Interactive map, Voice waveforms, Call modals, Live Judge Dashboard.
- **API Routes**: Endpoints for handling telephony webhooks and LLM extraction.

**REMOVE:**
- Any rigid questionnaire flows (e.g., "Question 1 of 10").
- Fake visual progress bars (progress must be based on actual slots filled).
- Fabricated official qualification mappings.

## 2. Implementation Order

1. **Build the core state/domain architecture:** Typed schemas and comprehensive Zustand store.
2. **Build bidirectional web voice:** Browser voice adapter, waveform UI, conversational turns.
3. **Build automatic conversational profile extraction:** LLM prompts to extract slots dynamically.
4. **Build skill normalization & mapping:** `SkillEngine` and `MappingEngine`.
5. **Build skill gap:** `SkillGapEngine` using structured data comparison.
6. **Build recommendation engine:** Deterministic scoring based on profile, skills, and preferences.
7. **Build location + radius filtering & interactive map:** `GeoEngine`, integration with `react-leaflet`.
8. **Build opportunity details, roadmap, and notifications.**
9. **Build Judge Mode realtime synchronization:** Live dashboard reacting to conversation state.
10. **Build real Sarvam & telephony integration:** Adapters for external services.
11. **Build full navigation, footer, and polish.**
12. **QA & Final Check.**
