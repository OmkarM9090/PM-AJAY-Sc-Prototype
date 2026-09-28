"""Skill normalisation + gap analysis between a beneficiary and an NSQF QP."""

import re

# Synonym groups let "silai" == "machine stitching" == "sewing" during matching.
SYNONYMS = [
    {"machine stitching", "sewing", "stitching", "leather stitching", "seam finishing"},
    {"manual labor", "manual labour", "physical work", "helper work"},
    {"basic construction", "brick laying", "masonry", "mortar mixing"},
    {"tool handling", "hand tools", "tool usage", "basic maintenance"},
    {"customer handling", "client handling", "communication", "empathy and communication"},
    {"fault diagnosis", "fault detection", "circuit diagnosis", "troubleshooting"},
    {"cooking", "food preparation", "ingredient preparation"},
    {"hygiene practices", "food hygiene", "household hygiene", "salon hygiene", "shed hygiene"},
    {"driving", "vehicle checks", "road safety"},
    {"computer basics", "typing", "data accuracy", "digital services", "digital payments"},
    {"billing", "basic accounting", "inventory management", "record keeping"},
    {"leather cutting", "cutting", "fabric cutting"},
    {"design creation", "design reading", "design mapping", "design tracing"},
    {"weaving", "loom setting", "warping", "weft insertion", "knotting"},
]


def _norm(skill: str) -> str:
    return re.sub(r"\s+", " ", (skill or "").strip().lower())


def _equivalent(a: str, b: str) -> bool:
    a, b = _norm(a), _norm(b)
    if a == b:
        return True
    if a and b and (a in b or b in a):
        return True
    for group in SYNONYMS:
        if a in group and b in group:
            return True
    return False


def analyse(user_skills, required_skills):
    """Return match percentage, matched competencies and the concrete gaps."""
    required = [r for r in (required_skills or [])]
    if not required:
        return {"match_pct": 0, "matched": [], "gaps": [], "transferable": []}

    matched, gaps = [], []
    for req in required:
        hit = next((u for u in user_skills or [] if _equivalent(u, req)), None)
        if hit:
            matched.append({"competency": req, "evidence_skill": hit})
        else:
            gaps.append(req)

    # Skills the beneficiary has that are useful but not in the QP core list.
    transferable = [u for u in user_skills or []
                    if not any(_equivalent(u, r) for r in required)][:5]

    return {
        "match_pct": round(len(matched) / len(required) * 100),
        "matched": matched,
        "gaps": gaps,
        "transferable": transferable,
    }
