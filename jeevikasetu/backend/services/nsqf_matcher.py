"""NSQF/RPL recommendation engine.

Deterministic, explainable and fast (no LLM required). Every recommendation
carries its own score breakdown so judges can see *why* it was ranked there.

Ranking formula (weights exposed in the API response):
    0.28 * skill_overlap
  + 0.26 * interest_alignment
  + 0.14 * income_potential
  + 0.14 * accessibility (distance vs stated mobility)
  + 0.08 * education_fit
  + 0.06 * employment_preference_fit
  + 0.04 * regional_demand
"""

import re

from services.data_store import (benefit_head, centers_near, nsqf_packs,
                                 opportunities_near)
from services.skill_gap_analyzer import analyse
from services.skill_lexicon import infer_interest_sectors

WEIGHTS = {
    "skill_overlap": 0.28,
    "interest_alignment": 0.26,
    "income_potential": 0.14,
    "accessibility": 0.14,
    "education_fit": 0.08,
    "preference_fit": 0.06,
    "regional_demand": 0.04,
}

EDUCATION_RANK = {
    "no formal education": 0,
    "not specified": 1,
    "5th pass": 1,
    "6th pass": 1,
    "7th pass": 1,
    "8th pass": 2,
    "9th pass": 2,
    "10th pass": 3,
    "12th pass": 4,
    "graduate": 5,
}

RPL_THRESHOLD = 70          # % overlap at which RPL becomes the recommended route
RPL_STRONG_THRESHOLD = 80


def _edu_rank(label):
    return EDUCATION_RANK.get((label or "").strip().lower(), 1)


def _income_mid(rng):
    nums = [int(x) for x in re.findall(r"\d+", rng or "")]
    return sum(nums) / len(nums) if nums else 0


def _accessibility(center_distance, mobility_km):
    """1.0 if comfortably reachable, decaying beyond the stated mobility."""
    if center_distance is None:
        return 0.3
    mobility = max(mobility_km or 10, 3)
    if center_distance <= mobility:
        return 1.0
    if center_distance <= mobility * 2:
        return 0.55
    if center_distance <= mobility * 4:
        return 0.25
    return 0.1


def _interest_alignment(qp, interest_sectors, interests_text):
    if qp["sector"] in interest_sectors:
        return 1.0
    name = qp["qp_name"].lower()
    for word in re.findall(r"[a-z\u0900-\u097F]{4,}", (interests_text or "").lower()):
        if word in name:
            return 0.95
    return 0.25


def _preference_fit(qp, preference):
    potential = qp.get("self_employment_potential", "low")
    if preference == "self-employment":
        return {"high": 1.0, "medium": 0.6, "low": 0.2}[potential]
    if preference == "wage-employment":
        return {"high": 0.6, "medium": 0.8, "low": 1.0}[potential]
    return 0.8


def _gia_benefits(pathway, qp, profile, nearest_km):
    ids = []
    if pathway in ("training", "training_plus_rpl"):
        ids += ["skill_training_support", "wage_compensation"]
    if pathway in ("rpl", "training_plus_rpl"):
        ids.append("rpl_assessment_support")
    if profile.get("employment_preference") in ("self-employment", "either"):
        if qp.get("self_employment_potential") in ("high", "medium"):
            ids += ["toolkit_grant", "enterprise_capital"]
    if profile.get("employment_preference") in ("wage-employment", "either"):
        ids.append("placement_linkage")
    if nearest_km and nearest_km > 10:
        ids.append("travel_hostel_support")
    out, seen = [], set()
    for bid in ids:
        if bid in seen:
            continue
        seen.add(bid)
        b = benefit_head(bid)
        if b:
            out.append({"id": b["id"], "name": b["name"], "name_hi": b["name_hi"],
                        "indicative_amount_inr": b["indicative_amount_inr"]})
    return out


def _roadmap(pathway, qp, gap_count, center, profile):
    weeks = max(4, round(qp["duration_hours"] / 30))
    steps = []
    if pathway == "rpl":
        steps = [
            {"step": 1, "title": "RPL Assessment Registration",
             "detail": f"Register for RPL under {qp['qp_code']} at {center['name'] if center else 'nearest empanelled centre'}",
             "duration": "1 week"},
            {"step": 2, "title": "Bridge / Orientation Module",
             "detail": f"Short {min(60, max(12, gap_count * 12))}-hour module covering: "
                       + ", ".join(qp['required_skills'][:3]),
             "duration": "1-2 weeks"},
            {"step": 3, "title": "Assessment & Certification",
             "detail": f"Skill assessment by {qp['certification_body']}; NSQF Level {qp['nsqf_level']} certificate issued",
             "duration": "1 week"},
        ]
    else:
        steps = [
            {"step": 1, "title": "Counselling & Enrolment",
             "detail": f"Enrol at {center['name'] if center else 'nearest PM-AJAY empanelled centre'} "
                       f"(next batch {center['next_batch_start'] if center else 'on request'})",
             "duration": "1 week"},
            {"step": 2, "title": f"NSQF Training — {qp['qp_name']}",
             "detail": f"{qp['duration_hours']} hours covering {', '.join(qp['required_skills'][:4])}",
             "duration": f"{weeks} weeks"},
            {"step": 3, "title": "Assessment & Certification",
             "detail": f"Certified by {qp['certification_body']} at NSQF Level {qp['nsqf_level']}",
             "duration": "1 week"},
        ]
    if profile.get("employment_preference") == "self-employment":
        steps.append({"step": len(steps) + 1, "title": "Enterprise Setup with GIA Support",
                      "detail": "Apply for PM-AJAY toolkit grant / enterprise capital, register udyam, start unit",
                      "duration": "4-6 weeks"})
    else:
        steps.append({"step": len(steps) + 1, "title": "Placement Linkage",
                      "detail": "Placement drive through NCS + post-placement support for 3 months",
                      "duration": "2-4 weeks"})
    return steps


def recommend(profile: dict, top_n: int = 5) -> dict:
    """Score every QP against the profile and return the ranked shortlist."""
    district = (profile.get("location") or {}).get("district")
    mobility = float(profile.get("mobility_range_km") or 10)
    user_skills = profile.get("identified_skills") or []
    preference = profile.get("employment_preference") or "either"
    interests_text = " ".join(map(str, profile.get("interests") or []))
    interest_sectors = profile.get("interest_sectors") or infer_interest_sectors(interests_text)
    user_edu = _edu_rank(profile.get("education"))
    constraints = (profile.get("physical_constraints") or "none").lower()
    heavy_constraint = any(w in constraints for w in ["back", "कमर", "lift", "भारी", "heavy", "pain", "दर्द"])

    incomes = [_income_mid(q["avg_monthly_income_range"]) for q in nsqf_packs()]
    income_max = max(incomes) or 1

    scored = []
    for qp in nsqf_packs():
        gap = analyse(user_skills, qp["required_skills"])
        req_edu = _edu_rank(qp["required_education"])

        # ---- hard filter: education more than one level short -------------
        if user_edu < req_edu - 1:
            continue

        centers = centers_near(district, qp_code=qp["qp_code"])
        nearest = centers[0] if centers else None
        nearest_km = nearest["distance_km"] if nearest else None

        s_skill = gap["match_pct"] / 100
        s_interest = _interest_alignment(qp, interest_sectors, interests_text)
        s_income = _income_mid(qp["avg_monthly_income_range"]) / income_max
        s_access = _accessibility(nearest_km, mobility)
        s_edu = 1.0 if user_edu >= req_edu else 0.45
        s_pref = _preference_fit(qp, preference)
        s_demand = 1.0 if district and district in qp.get("high_demand_districts", []) else 0.5

        score = (WEIGHTS["skill_overlap"] * s_skill + WEIGHTS["interest_alignment"] * s_interest
                 + WEIGHTS["income_potential"] * s_income + WEIGHTS["accessibility"] * s_access
                 + WEIGHTS["education_fit"] * s_edu + WEIGHTS["preference_fit"] * s_pref
                 + WEIGHTS["regional_demand"] * s_demand)

        # Constraint awareness: de-prioritise heavy physical trades.
        if heavy_constraint and qp["sector"] in ("Construction", "Leather", "Agriculture & Allied"):
            score *= 0.75

        # ---- pathway decision (RPL vs training) ---------------------------
        if qp["rpl_eligible"] and gap["match_pct"] >= RPL_STRONG_THRESHOLD:
            pathway, pathway_label = "rpl", "RPL Assessment → Certification"
        elif qp["rpl_eligible"] and gap["match_pct"] >= RPL_THRESHOLD:
            pathway, pathway_label = "training_plus_rpl", "RPL Assessment → Short bridge course → Certification"
        else:
            pathway, pathway_label = "training", "Training → Certification → Work"

        effective_hours = qp["duration_hours"]
        if pathway == "rpl":
            effective_hours = min(60, max(12, len(gap["gaps"]) * 12))
        elif pathway == "training_plus_rpl":
            effective_hours = round(qp["duration_hours"] * 0.4)

        jobs = opportunities_near(district=district, qp_code=qp["qp_code"], otype="job")
        ventures = opportunities_near(district=district, qp_code=qp["qp_code"], otype="self-employment")

        scored.append({
            "qp_code": qp["qp_code"],
            "qp_name": qp["qp_name"],
            "sector": qp["sector"],
            "nsqf_level": qp["nsqf_level"],
            "certification_body": qp["certification_body"],
            "score": round(score, 4),
            "score_percent": round(score * 100),
            "score_breakdown": {
                "skill_overlap": round(s_skill, 2), "interest_alignment": round(s_interest, 2),
                "income_potential": round(s_income, 2), "accessibility": round(s_access, 2),
                "education_fit": round(s_edu, 2), "preference_fit": round(s_pref, 2),
                "regional_demand": round(s_demand, 2), "weights": WEIGHTS,
            },
            "skill_match_pct": gap["match_pct"],
            "matched_competencies": gap["matched"],
            "skill_gaps": gap["gaps"],
            "transferable_skills": gap["transferable"],
            "rpl_eligible": qp["rpl_eligible"] and gap["match_pct"] >= RPL_THRESHOLD,
            "rpl_strong": qp["rpl_eligible"] and gap["match_pct"] >= RPL_STRONG_THRESHOLD,
            "pathway": pathway,
            "pathway_label": pathway_label,
            "training_hours": effective_hours,
            "training_duration_label": (f"{max(1, round(effective_hours / 160))} month(s)"
                                        if effective_hours > 80 else f"{max(1, round(effective_hours / 20))} week(s)"),
            "required_education": qp["required_education"],
            "income_range": qp["avg_monthly_income_range"],
            "self_employment_potential": qp["self_employment_potential"],
            "nearest_center": ({
                "center_id": nearest["center_id"], "name": nearest["name"],
                "district": nearest["district"], "state": nearest["state"],
                "distance_km": nearest["distance_km"], "latitude": nearest["latitude"],
                "longitude": nearest["longitude"], "next_batch_start": nearest["next_batch_start"],
                "hostel_available": nearest["hostel_available"], "contact": nearest["contact"],
                "within_mobility": nearest["distance_km"] <= mobility,
            } if nearest else None),
            "all_centers": [{"center_id": c["center_id"], "name": c["name"], "district": c["district"],
                             "latitude": c["latitude"], "longitude": c["longitude"],
                             "distance_km": c["distance_km"], "next_batch_start": c["next_batch_start"]}
                            for c in centers[:4]],
            "linked_jobs": jobs[:3],
            "linked_ventures": ventures[:3],
            "gia_benefits": _gia_benefits(pathway, qp, profile, nearest_km),
            "roadmap": _roadmap(pathway, qp, len(gap["gaps"]), nearest, profile),
            "why": _explain(gap, s_interest, nearest_km, mobility, pathway, qp),
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    top = scored[:top_n]
    for i, rec in enumerate(top, start=1):
        rec["rank"] = i
        rec["medal"] = {1: "🥇", 2: "🥈", 3: "🥉"}.get(i, "⭐")

    return {
        "profile_name": profile.get("name"),
        "district": district,
        "generated_count": len(top),
        "considered_qps": len(scored),
        "weights": WEIGHTS,
        "recommendations": top,
        "engine": "deterministic-nsqf-matcher-v1",
    }


def _explain(gap, s_interest, nearest_km, mobility, pathway, qp):
    bits = []
    if gap["match_pct"] >= 70:
        bits.append(f"You already demonstrate {gap['match_pct']}% of the competencies required for this QP "
                    f"through your existing work experience.")
    elif gap["match_pct"] > 0:
        bits.append(f"{gap['match_pct']}% of the required competencies overlap with skills you already use "
                    f"({', '.join(m['evidence_skill'] for m in gap['matched'][:3])}).")
    else:
        bits.append("This is a fresh-start pathway — no prior experience required.")
    if s_interest >= 0.9:
        bits.append("It directly matches the work you said you want to do.")
    if nearest_km is not None:
        bits.append(f"Nearest empanelled training centre is {nearest_km} km away"
                    + (" — within your stated travel limit." if nearest_km <= mobility else
                       " — slightly beyond your travel limit, hostel/travel support may apply."))
    if pathway == "rpl":
        bits.append("Because your experience is strong, RPL can certify you without a full course.")
    if gap["gaps"]:
        bits.append("Gaps to close: " + ", ".join(gap["gaps"][:4]) + ".")
    bits.append(f"Expected income after certification: ₹{qp['avg_monthly_income_range']} per month.")
    return " ".join(bits)
