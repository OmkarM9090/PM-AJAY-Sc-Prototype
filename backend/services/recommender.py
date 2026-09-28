"""Explainable, deterministic NSQF-aligned demo recommendation engine."""
from __future__ import annotations

import math
import re
from typing import Any

from .catalog import education_rank, load_catalog

DISTRICT_COORDS = {
    "Varanasi": (25.3176, 82.9739), "Lucknow": (26.8467, 80.9462), "Chennai": (13.0827, 80.2707),
    "Hyderabad": (17.3850, 78.4867), "Pune": (18.5204, 73.8567), "Jaipur": (26.9124, 75.7873),
    "Patna": (25.5941, 85.1376), "Nagpur": (21.1458, 79.0882), "Bengaluru Urban": (12.9716, 77.5946),
    "Kolkata": (22.5726, 88.3639), "Bhopal": (23.2599, 77.4126), "Ranchi": (23.3441, 85.3096),
    "Madurai": (9.9252, 78.1198), "Ahmedabad": (23.0225, 72.5714),
}


def _normalise(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def _distance_km(a: tuple[float, float], b: tuple[float, float]) -> float:
    radius = 6371
    lat1, lon1, lat2, lon2 = map(math.radians, [a[0], a[1], b[0], b[1]])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    hav = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(hav), math.sqrt(1 - hav))


def _education_needed(value: str) -> int:
    lookup = {"no minimum": 1, "5th": 2, "8th": 3, "10th": 4}
    lower = value.lower()
    return next((rank for needle, rank in lookup.items() if needle in lower), 2)


def _interest_score(profile: dict[str, Any], qp: dict[str, Any]) -> float:
    corpus = _normalise(" ".join([qp["qp_name"], qp["sector"], *qp["required_skills"]]))
    interests = [_normalise(value) for value in profile.get("interests", [])]
    exact_phrase = any(value and len(value.split()) > 1 and value in corpus for value in interests)
    partial_phrase = any(value and any(token in corpus for token in value.split() if len(token) > 3) for value in interests)
    return 1.0 if exact_phrase else 0.5 if partial_phrase else 0.0


def _skill_result(profile: dict[str, Any], qp: dict[str, Any]) -> tuple[int, list[str], list[str]]:
    user_skills = {_normalise(skill) for skill in profile.get("identified_skills", [])}
    required = qp["required_skills"]
    already, gaps = [], []
    for skill in required:
        normal = _normalise(skill)
        if normal in user_skills:
            already.append(skill)
        else:
            gaps.append(skill)
    current = _normalise(profile.get("current_livelihood", ""))
    family = _normalise(profile.get("family_occupation", ""))
    sector = _normalise(qp["sector"])
    experience_bonus = 0
    # Transparent inferencing for informal work. Never silently declares certification.
    if "leather" in sector and ("leather" in current or "leather" in family or "leather crafting" in user_skills): experience_bonus = 10
    if "construction" in sector and ("construction" in current or "basic construction" in user_skills or "manual labor" in user_skills): experience_bonus = 60
    if "electronics" in sector and ("mobile repair" in user_skills or ("mobile repair" in {_normalise(item) for item in profile.get("interests", [])} and "construction" in current)):
        # Transferable hands-on experience is only a screening signal, not proof of competence.
        experience_bonus = 35
    overlap = round((len(already) / max(1, len(required))) * 100)
    # Experience is a transparent *screening* boost for informal work, not a
    # certificate. Formal RPL assessment remains required.
    overlap = min(100, overlap + experience_bonus)
    if experience_bonus and "informal experience" not in already:
        already.append("relevant informal experience")
    return overlap, already, gaps


def _nearest_center(profile: dict[str, Any], sector: str) -> dict[str, Any] | None:
    catalog = load_catalog()
    district = profile.get("location", {}).get("district", "")
    coordinates = DISTRICT_COORDS.get(district)
    candidates = [center for center in catalog["training_centers"] if sector in center["sectors"]]
    if not candidates:
        return None
    if coordinates:
        candidates.sort(key=lambda center: _distance_km(coordinates, (center["lat"], center["lng"])))
        selected = dict(candidates[0])
        selected["estimated_distance_km"] = round(_distance_km(coordinates, (selected["lat"], selected["lng"])), 1)
    else:
        selected = dict(candidates[0])
        selected["estimated_distance_km"] = None
    return selected


def _benefits(qp: dict[str, Any], preference: str) -> list[dict[str, str]]:
    benefits = load_catalog()["gia_benefits"]
    relevant: list[dict[str, str]] = []
    for benefit in benefits:
        applies = benefit["applies_to"]
        if preference == "self-employment" and "self-employment" in applies:
            relevant.append(benefit)
        elif qp["sector"] in applies or (qp["rpl_eligible"] and "rpl" in applies):
            relevant.append(benefit)
    return relevant[:3]


def recommend(profile: dict[str, Any], limit: int = 5) -> list[dict[str, Any]]:
    catalog = load_catalog()
    preference = profile.get("employment_preference", "")
    mobility = profile.get("mobility_km")
    output: list[dict[str, Any]] = []
    for qp in catalog["qualification_packs"]:
        overlap, already, gaps = _skill_result(profile, qp)
        interest = _interest_score(profile, qp)
        education_fit = 1.0 if education_rank(profile.get("education")) >= _education_needed(qp["required_education"]) else 0.35
        centre = _nearest_center(profile, qp["sector"])
        distance = centre.get("estimated_distance_km") if centre else None
        mobility_fit = 1.0 if distance is None or mobility is None or distance <= mobility else 0.25
        preference_fit = 1.0 if preference == "self-employment" and qp["self_employment_potential"] in ("high", "medium") else 0.75 if preference == "wage-employment" else 0.65
        local_fit = 1.0 if centre and centre.get("district") == profile.get("location", {}).get("district") else 0.5
        current_work = _normalise(profile.get("current_livelihood", ""))
        progression_bonus = 0.12 if "construction" in _normalise(qp["sector"]) and "construction" in current_work and qp["nsqf_level"] >= 5 else 0
        score = (overlap / 100) * 0.30 + interest * 0.34 + education_fit * 0.10 + mobility_fit * 0.08 + preference_fit * 0.13 + local_fit * 0.05 + progression_bonus
        rpl_eligible = bool(qp["rpl_eligible"] and overlap >= 80)
        pathway = "RPL assessment → short bridge module → certification" if rpl_eligible else f"Training → certification → {'enterprise setup' if preference == 'self-employment' else 'placement / local job search'}"
        roadmap = [
            "Verify current eligibility and training-centre availability with the district team.",
            "Attend counselling and skill assessment.",
            "RPL assessment and bridge module." if rpl_eligible else f"Complete the {qp['duration_hours']} hour training pathway.",
            "Receive certification and connect to the selected livelihood pathway.",
        ]
        output.append({
            "qualification_pack": qp,
            "rank_score": round(score * 100),
            "skill_match_percent": overlap,
            "interest_match": "HIGH" if interest >= 1 else "MEDIUM" if overlap >= 50 else "EXPLORATORY",
            "already_have": already,
            "skill_gaps": gaps or ["Assessment will validate competence against current QP/NOS."],
            "rpl_eligible": rpl_eligible,
            "nearest_center": centre,
            "mobility_match": "Within stated range" if mobility_fit == 1 else "Check travel support / closer batch",
            "gia_benefits": _benefits(qp, preference),
            "pathway": pathway,
            "roadmap": roadmap,
            "data_notice": "Illustrative recommendation. Verify current QP/NOS, provider availability, eligibility and benefits before referral.",
        })
    output.sort(key=lambda item: (item["rank_score"], item["skill_match_percent"]), reverse=True)
    # Present a diverse first set of pathways so the counsellor can compare
    # alternatives instead of seeing five near-identical QPs from one sector.
    selected: list[dict[str, Any]] = []
    represented: set[str] = set()
    for item in output:
        sector = item["qualification_pack"]["sector"]
        if sector not in represented:
            selected.append(item)
            represented.add(sector)
        if len(selected) >= limit:
            break
    if len(selected) < limit:
        for item in output:
            if item not in selected:
                selected.append(item)
            if len(selected) >= limit:
                break
    return [{**item, "rank": index + 1} for index, item in enumerate(selected[:limit])]


def nearby_centers(district: str | None = None, sector: str | None = None) -> list[dict[str, Any]]:
    centers = load_catalog()["training_centers"]
    result = [center for center in centers if (not district or center["district"].lower() == district.lower()) and (not sector or sector in center["sectors"])]
    return result


def filter_opportunities(district: str | None = None, opportunity_type: str | None = None) -> list[dict[str, Any]]:
    result = load_catalog()["opportunities"]
    return [item for item in result if (not district or item["district"].lower() == district.lower()) and (not opportunity_type or item["type"] == opportunity_type)]
