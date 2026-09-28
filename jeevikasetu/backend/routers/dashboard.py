"""Government official dashboard — aggregate, anonymisable programme analytics."""

from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from config import AI_MODE
from database import (BeneficiaryProfile, ConversationSession, Message,
                      RecommendationRecord, get_db, loads)
from services.data_store import nsqf_packs, opportunities, training_centers

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    profiles = db.query(BeneficiaryProfile).all()
    recs = db.query(RecommendationRecord).all()
    sessions = db.query(ConversationSession).all()

    languages = Counter()
    for p in profiles:
        for lang in loads(p.languages_json, []) or []:
            languages[lang] += 1

    skills = Counter()
    for p in profiles:
        for s in loads(p.identified_skills_json, []) or []:
            skills[s] += 1

    districts = Counter(p.district for p in profiles if p.district)
    channels = Counter(p.channel or "web" for p in profiles)
    education = Counter(p.education or "Not specified" for p in profiles)
    preference = Counter(p.employment_preference or "either" for p in profiles)

    pathways = Counter(r.qp_name for r in recs if r.rank <= 3)
    sectors = Counter(r.sector for r in recs if r.rank <= 3)
    rpl_count = sum(1 for r in recs if r.rpl_eligible and r.rank == 1)

    # District-level skill demand heat values (top recommended sector per district).
    heat = {}
    for r in recs:
        if not r.district:
            continue
        entry = heat.setdefault(r.district, {"district": r.district, "count": 0, "sectors": Counter()})
        entry["count"] += 1
        entry["sectors"][r.sector] += 1
    heatmap = [{"district": v["district"], "beneficiary_matches": v["count"],
                "top_sector": v["sectors"].most_common(1)[0][0] if v["sectors"] else None}
               for v in heat.values()]

    return {
        "ai_mode": AI_MODE,
        "totals": {
            "beneficiaries_profiled": len(profiles),
            "conversations": len(sessions),
            "completed_conversations": sum(1 for s in sessions if s.status == "completed"),
            "recommendations_generated": len(recs),
            "rpl_flagged": rpl_count,
            "nsqf_packs_in_catalogue": len(nsqf_packs()),
            "training_centers": len(training_centers()),
            "opportunities": len(opportunities()),
            "messages_exchanged": db.query(Message).count(),
        },
        "language_distribution": [{"language": k, "count": v} for k, v in languages.most_common()],
        "channel_distribution": [{"channel": k, "count": v} for k, v in channels.most_common()],
        "education_distribution": [{"education": k, "count": v} for k, v in education.most_common()],
        "preference_distribution": [{"preference": k, "count": v} for k, v in preference.most_common()],
        "top_skills": [{"skill": k, "count": v} for k, v in skills.most_common(12)],
        "popular_pathways": [{"qp_name": k, "count": v} for k, v in pathways.most_common(8)],
        "sector_demand": [{"sector": k, "count": v} for k, v in sectors.most_common(10)],
        "district_distribution": [{"district": k, "count": v} for k, v in districts.most_common(12)],
        "skill_demand_heatmap": sorted(heatmap, key=lambda x: -x["beneficiary_matches"]),
    }


@router.get("/beneficiaries")
def beneficiaries(db: Session = Depends(get_db), district: str | None = None,
                  state: str | None = None, channel: str | None = None, limit: int = 200):
    q = db.query(BeneficiaryProfile)
    if district:
        q = q.filter(BeneficiaryProfile.district == district)
    if state:
        q = q.filter(BeneficiaryProfile.state == state)
    if channel:
        q = q.filter(BeneficiaryProfile.channel == channel)
    rows = q.order_by(BeneficiaryProfile.id.desc()).limit(limit).all()

    out = []
    for r in rows:
        top = (db.query(RecommendationRecord)
               .filter(RecommendationRecord.session_id == r.session_id,
                       RecommendationRecord.rank == 1).first())
        d = r.to_dict()
        d["top_recommendation"] = top.qp_name if top else None
        d["top_match_pct"] = top.skill_match_pct if top else None
        d["rpl_flag"] = bool(top.rpl_eligible) if top else False
        out.append(d)
    return {"count": len(out), "beneficiaries": out}


@router.get("/scheme-utilisation")
def scheme_utilisation(db: Session = Depends(get_db)):
    """Indicative GIA head utilisation derived from generated top recommendations."""
    recs = db.query(RecommendationRecord).filter(RecommendationRecord.rank == 1).all()
    heads = Counter()
    for r in recs:
        heads["skill_training_support" if not r.rpl_eligible else "rpl_assessment_support"] += 1
        heads["toolkit_grant"] += 1 if r.sector in ("Leather", "Handicrafts & Carpet",
                                                    "Textile & Apparel", "Beauty & Wellness") else 0
        heads["placement_linkage"] += 1 if r.sector in ("Healthcare", "Retail", "Construction",
                                                        "IT/ITES") else 0
    unit_cost = {"skill_training_support": 40000, "rpl_assessment_support": 7500,
                 "toolkit_grant": 50000, "placement_linkage": 6000}
    return {"heads": [{"head": k, "beneficiaries": v,
                       "indicative_outlay_inr": v * unit_cost.get(k, 0)}
                      for k, v in heads.items() if v],
            "note": "Indicative prototype figures for demonstration only."}
