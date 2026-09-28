"""NSQF recommendation, opportunity matching and reference-data endpoints."""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import RecommendationRecord, get_db
from services.data_store import (centers_near, gia_benefits, nsqf_packs,
                                 opportunities_near, qp_by_code)
from services.nsqf_matcher import recommend as run_recommender

router = APIRouter(tags=["recommendations"])


class RecommendRequest(BaseModel):
    profile: dict
    session_id: str | None = None
    top_n: int = 5


@router.post("/api/recommend")
def recommend(req: RecommendRequest, db: Session = Depends(get_db)):
    """Rank NSQF pathways for a beneficiary profile with full skill-gap analysis."""
    result = run_recommender(req.profile, req.top_n)

    # Store for the official dashboard analytics.
    loc = req.profile.get("location") or {}
    for rec in result["recommendations"]:
        db.add(RecommendationRecord(
            session_id=req.session_id, profile_name=req.profile.get("name"),
            district=loc.get("district"), state=loc.get("state"),
            qp_code=rec["qp_code"], qp_name=rec["qp_name"], sector=rec["sector"],
            rank=rec["rank"], score=rec["score"], skill_match_pct=rec["skill_match_pct"],
            rpl_eligible=rec["rpl_eligible"]))
    db.commit()
    return result


@router.get("/api/nsqf/qualification-packs")
def qualification_packs(sector: str | None = None, level: int | None = None,
                        rpl_only: bool = False, q: str | None = None):
    packs = nsqf_packs()
    if sector:
        packs = [p for p in packs if p["sector"].lower() == sector.lower()]
    if level:
        packs = [p for p in packs if p["nsqf_level"] == level]
    if rpl_only:
        packs = [p for p in packs if p["rpl_eligible"]]
    if q:
        needle = q.lower()
        packs = [p for p in packs if needle in p["qp_name"].lower() or needle in p["qp_code"].lower()]
    return {"count": len(packs), "sectors": sorted({p["sector"] for p in nsqf_packs()}),
            "qualification_packs": packs}


@router.get("/api/nsqf/{qp_code:path}")
def qualification_pack(qp_code: str):
    return qp_by_code(qp_code) or {"error": "not found"}


@router.get("/api/training-centers")
def training_centers(district: str | None = None, sector: str | None = None,
                     qp_code: str | None = None, max_km: float | None = Query(default=None)):
    centers = centers_near(district, qp_code=qp_code, sector=sector, max_km=max_km)
    return {"count": len(centers), "district": district, "centers": centers}


@router.get("/api/opportunities")
def opportunities(district: str | None = None, state: str | None = None,
                  type: str | None = Query(default=None, pattern="^(job|self-employment)$"),
                  sector: str | None = None, qp_code: str | None = None,
                  max_km: float | None = None):
    items = opportunities_near(district=district, state=state, otype=type,
                               sector=sector, qp_code=qp_code, max_km=max_km)
    return {"count": len(items), "opportunities": items}


@router.get("/api/gia-benefits")
def benefits():
    return gia_benefits()
