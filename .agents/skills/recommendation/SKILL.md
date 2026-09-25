# Recommendation Skill

## Goal
Turn a confirmed beneficiary profile into explainable livelihood pathways.

## Pipeline
1. Normalize profile.
2. Apply hard filters using verified metadata and user constraints.
3. Retrieve candidate occupations/courses/jobs/enterprise paths.
4. Combine lexical and semantic relevance.
5. Rank candidates with configurable weights.
6. Generate reason codes.
7. Build the pathway/roadmap from verified records.

## Safety
- Never invent policy conditions.
- Never promise a job, salary or grant.
- Never treat an unverified distance or policy threshold as universal.
- If the evidence is incomplete, say so and offer a next step.

## Explainability
Store reason codes such as:
`SKILL_MATCH`, `INTEREST_MATCH`, `LOCATION_MATCH`, `MOBILITY_MATCH`, `SKILL_GAP_COVERED`, `PREFERENCE_MATCH`.

## Demo quality
Changing skills, goal, location or mobility should change candidate ranking when the data supports it.
