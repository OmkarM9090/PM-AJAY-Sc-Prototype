"""
JeevikaSetu engine test suite.

Run:  cd backend && pytest -q

These tests pin down the behaviour a government evaluator would challenge:
 * does the dialogue actually fill the 9 slots, one question at a time?
 * does informal work really map to formal NSQF competencies?
 * is RPL only offered when experience genuinely overlaps?
 * are education / mobility / physical constraints respected?
 * is the ranking reproducible (same input → same output)?
"""

import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.data_store import (centers_near, gia_benefits, haversine_km,  # noqa: E402
                                 nsqf_packs, opportunities, training_centers)
from services.dialogue_manager import offline_turn  # noqa: E402
from services.language import SLOT_ORDER, detect_language  # noqa: E402
from services.nsqf_matcher import recommend  # noqa: E402
from services.profile_extractor import offline_extract  # noqa: E402
from services.skill_gap_analyzer import analyse  # noqa: E402
from services.skill_lexicon import infer_interest_sectors, infer_skills  # noqa: E402

RAMESH_ANSWERS = [
    "मेरा नाम रमेश कुमार है",
    "मैं चाँदपुर गाँव में रहता हूँ, जिला वाराणसी",
    "आठवीं पास हूँ",
    "हमारे घर में चमड़े का काम होता है, पिताजी जूते बनाते हैं",
    "हाँ बचपन से पिताजी के साथ, दस साल का अनुभव",
    "अभी बिल्डिंग साइट पर दिहाड़ी मजदूरी करता हूँ",
    "मुझे मोबाइल रिपेयर सीखना है",
    "बिल्कुल नया सीखना है",
    "अपना खुद का काम, दुकान खोलनी है",
    "तीस किलोमीटर तक जा सकता हूँ",
    "नहीं कोई दिक्कत नहीं है",
]


def run_interview(answers, lang="hi"):
    """Drive the offline dialogue engine through a full interview."""
    slots, probes = {}, []
    turn = offline_turn(slots, None, lang, probes)     # greeting
    replies = [turn.reply]
    for answer in answers:
        turn = offline_turn(turn.slots, answer, lang, probes)
        probes = [k for k in turn.slots if k.startswith("probe_")]
        replies.append(turn.reply)
    return turn, replies


# ---------------------------------------------------------------------------
# Reference data integrity
# ---------------------------------------------------------------------------
def test_datasets_meet_the_problem_statement_minimums():
    assert len(nsqf_packs()) >= 40, "at least 40 NSQF qualification packs required"
    assert len(training_centers()) >= 20
    jobs = [o for o in opportunities() if o["type"] == "job"]
    ventures = [o for o in opportunities() if o["type"] == "self-employment"]
    assert len(jobs) >= 30 and len(ventures) >= 20
    assert len({q["sector"] for q in nsqf_packs()}) >= 10
    assert len(gia_benefits()["benefit_heads"]) >= 4


def test_every_qp_is_well_formed():
    required = {"qp_code", "qp_name", "sector", "nsqf_level", "required_skills",
                "required_education", "duration_hours", "certification_body",
                "rpl_eligible", "self_employment_potential", "avg_monthly_income_range"}
    codes = set()
    for qp in nsqf_packs():
        assert required <= qp.keys(), f"{qp.get('qp_code')} missing fields"
        assert 1 <= qp["nsqf_level"] <= 8
        assert qp["required_skills"], "a QP must list competencies"
        assert qp["qp_code"] not in codes, "duplicate QP code"
        codes.add(qp["qp_code"])


def test_every_opportunity_links_to_a_real_qp():
    codes = {q["qp_code"] for q in nsqf_packs()}
    for o in opportunities():
        assert o["linked_qp"] in codes, f"{o['opportunity_id']} points at an unknown QP"


# ---------------------------------------------------------------------------
# Language detection
# ---------------------------------------------------------------------------
@pytest.mark.parametrize("text,expected", [
    ("मेरा नाम रमेश कुमार है", "hi"),
    ("mera naam ramesh hai", "hi"),                 # Hinglish → Hindi
    ("My name is Ramesh and I work in construction", "en"),
    ("माझं नाव सुनीता आहे, मी पुण्यात राहते", "mr"),  # Marathi vs Hindi
    ("என் பெயர் முருகன்", "ta"),
    ("నా పేరు రమేష్", "te"),
    ("আমার নাম রমেশ", "bn"),
])
def test_language_detection(text, expected):
    assert detect_language(text) == expected


# ---------------------------------------------------------------------------
# Dialogue engine
# ---------------------------------------------------------------------------
def test_interview_fills_every_slot_and_completes():
    turn, replies = run_interview(RAMESH_ANSWERS)
    assert turn.completed is True
    assert turn.progress["percent"] == 100
    for slot in SLOT_ORDER:
        assert turn.slots.get(slot), f"slot '{slot}' was never captured"
    assert "नमस्ते" in replies[0], "the interview must open with a greeting"


def test_agent_covers_one_topic_per_turn_and_stays_voice_short():
    """One topic per turn (a clarifying sub-phrase like "village or city?" is
    allowed), and replies must stay short enough to be spoken aloud."""
    turn, replies = run_interview(RAMESH_ANSWERS)
    for reply in replies[:-1]:                      # the closing summary is longer by design
        assert reply.count("?") <= 2, f"turn asks about two topics: {reply}"
        assert len(reply) <= 260, f"reply too long for voice output: {reply}"

    # Each turn must target exactly one new slot, in script order.
    slots, probes, targeted = {}, [], []
    t = offline_turn(slots, None, "hi", probes)
    for answer in RAMESH_ANSWERS:
        before = set(k for k, v in t.slots.items() if v)
        t = offline_turn(t.slots, answer, "hi", probes)
        probes = [k for k in t.slots if k.startswith("probe_")]
        new = set(k for k, v in t.slots.items() if v) - before
        assert len(new) <= 1, f"more than one slot filled in a single turn: {new}"
        targeted.extend(new)
    core = [s for s in targeted if not s.startswith("probe_")]
    assert core == SLOT_ORDER, "the interview must follow the 9-topic script in order"


def test_traditional_skill_triggers_a_follow_up_probe():
    turn, _ = run_interview(RAMESH_ANSWERS)
    assert "probe_traditional_skill" in turn.slots, "leather work must earn a follow-up question"


def test_unclear_answer_is_re_asked_not_recorded():
    slots, probes = {}, []
    turn = offline_turn(slots, None, "hi", probes)
    turn = offline_turn(turn.slots, "?", "hi", probes)
    assert not turn.slots.get("name"), "garbage must not be stored as an answer"
    assert turn.next_slot == "name", "the same question should be asked again"


def test_conversation_survives_extra_turns_after_completion():
    turn, _ = run_interview(RAMESH_ANSWERS)
    name_before = turn.slots["name"]
    after = offline_turn(turn.slots, "हाँ सब सही है", "hi", [])
    assert after.completed is True
    assert after.slots["name"] == name_before, "a confirmation must not overwrite the name"


def test_interview_runs_in_every_supported_language():
    for lang in ("hi", "en", "mr", "ta", "te", "bn"):
        turn = offline_turn({}, None, lang, [])
        assert turn.reply and len(turn.reply) > 20


# ---------------------------------------------------------------------------
# Informal skill recognition + extraction
# ---------------------------------------------------------------------------
def test_informal_work_maps_to_formal_competencies():
    skills = infer_skills("पिताजी के साथ चमड़े का काम करता हूँ")
    assert "leather cutting" in skills and "leather stitching" in skills
    assert "mobile repair" not in skills


def test_interest_sector_inference():
    assert "Electronics & Hardware" in infer_interest_sectors("मुझे मोबाइल रिपेयर सीखना है")
    assert "Agriculture & Allied" in infer_interest_sectors("dairy and kheti work")


def test_profile_extraction_from_a_full_interview():
    turn, _ = run_interview(RAMESH_ANSWERS)
    profile = offline_extract(turn.slots, "", "hi")
    assert profile["name"] == "रमेश कुमार"
    assert profile["location"]["district"] == "Varanasi"
    assert profile["location"]["state"] == "Uttar Pradesh"
    assert profile["education"] == "8th pass"
    assert profile["employment_preference"] == "self-employment"
    assert profile["mobility_range_km"] == 30
    assert profile["physical_constraints"] == "none"
    assert "leather stitching" in profile["identified_skills"]
    assert profile["category"] == "SC"


# ---------------------------------------------------------------------------
# Skill gap analysis
# ---------------------------------------------------------------------------
def test_gap_analysis_uses_synonyms_and_reports_gaps():
    result = analyse(["sewing", "cutting"], ["machine stitching", "cutting", "pattern making"])
    assert result["match_pct"] == 67          # sewing ≡ machine stitching
    assert result["gaps"] == ["pattern making"]


def test_no_skills_means_no_false_match():
    result = analyse([], ["soldering", "circuit diagnosis"])
    assert result["match_pct"] == 0
    assert len(result["gaps"]) == 2


# ---------------------------------------------------------------------------
# Recommendation engine
# ---------------------------------------------------------------------------
@pytest.fixture
def ramesh():
    turn, _ = run_interview(RAMESH_ANSWERS)
    return offline_extract(turn.slots, "", "hi")


def test_recommendations_are_ranked_and_explained(ramesh):
    out = recommend(ramesh, top_n=5)
    recs = out["recommendations"]
    assert len(recs) == 5
    assert [r["rank"] for r in recs] == [1, 2, 3, 4, 5]
    scores = [r["score"] for r in recs]
    assert scores == sorted(scores, reverse=True), "results must be ranked by score"
    for r in recs:
        assert r["why"], "every recommendation must be explainable"
        assert r["roadmap"] and r["roadmap"][0]["step"] == 1
        assert r["gia_benefits"], "every pathway must map to PM-AJAY support"
        assert set(r["score_breakdown"]) >= {"skill_overlap", "interest_alignment", "weights"}


def test_leather_experience_produces_an_rpl_pathway(ramesh):
    out = recommend(ramesh, top_n=5)
    leather = [r for r in out["recommendations"] if r["sector"] == "Leather"]
    assert leather, "traditional leather work should surface a leather pathway"
    assert leather[0]["rpl_eligible"] is True
    assert leather[0]["pathway"] in ("rpl", "training_plus_rpl")
    assert leather[0]["training_hours"] < 400, "RPL must shorten the journey"


def test_stated_interest_reaches_the_shortlist(ramesh):
    out = recommend(ramesh, top_n=5)
    names = [r["qp_name"] for r in out["recommendations"]]
    assert any("Mobile Phone Repair" in n for n in names), "the aspiration must be honoured"


def test_recommendations_are_deterministic(ramesh):
    a = recommend(ramesh, top_n=5)["recommendations"]
    b = recommend(ramesh, top_n=5)["recommendations"]
    assert [r["qp_code"] for r in a] == [r["qp_code"] for r in b]
    assert [r["score"] for r in a] == [r["score"] for r in b]


def test_education_hard_filter(ramesh):
    low = dict(ramesh, education="No formal education")
    out = recommend(low, top_n=10)
    for r in out["recommendations"]:
        assert r["required_education"] not in ("10th pass", "12th pass", "Graduate"), \
            "a QP two levels above the beneficiary must be filtered out"


def test_physical_constraint_deprioritises_heavy_trades(ramesh):
    injured = dict(ramesh, physical_constraints="कमर में दर्द है, भारी वजन नहीं उठा सकता")
    baseline = {r["qp_code"]: r["score"] for r in recommend(ramesh, top_n=40)["recommendations"]}
    adjusted = {r["qp_code"]: r["score"] for r in recommend(injured, top_n=40)["recommendations"]}
    shared = [c for c in baseline if c in adjusted]
    heavy = [c for c in shared if c.startswith(("CON/", "LSS/", "AGR/"))]
    assert heavy, "expected some heavy-physical QPs in the comparison"
    assert all(adjusted[c] < baseline[c] for c in heavy)


def test_mobility_is_respected_in_accessibility_scoring(ramesh):
    homebound = dict(ramesh, mobility_range_km=2)
    out = recommend(homebound, top_n=5)
    for r in out["recommendations"]:
        centre = r["nearest_center"]
        if centre and not centre["within_mobility"]:
            heads = {b["id"] for b in r["gia_benefits"]}
            assert "travel_hostel_support" in heads, \
                "if the centre is far, travel/hostel support must be offered"


def test_self_employment_preference_unlocks_enterprise_support(ramesh):
    out = recommend(dict(ramesh, employment_preference="self-employment"), top_n=5)
    heads = {b["id"] for r in out["recommendations"] for b in r["gia_benefits"]}
    assert {"toolkit_grant", "enterprise_capital"} & heads


def test_wage_preference_unlocks_placement_support(ramesh):
    out = recommend(dict(ramesh, employment_preference="wage-employment"), top_n=5)
    heads = {b["id"] for r in out["recommendations"] for b in r["gia_benefits"]}
    assert "placement_linkage" in heads


# ---------------------------------------------------------------------------
# Geo / opportunity matching
# ---------------------------------------------------------------------------
def test_distance_and_centre_sorting():
    assert haversine_km((25.3176, 82.9739), (25.3811, 83.0217)) < 15   # Varanasi → Sarnath
    centres = centers_near("Varanasi")
    assert centres[0]["distance_km"] <= centres[-1]["distance_km"]


def test_mobility_filter_excludes_distant_centres():
    near = centers_near("Varanasi", max_km=20)
    assert near, "there must be centres inside 20 km of Varanasi"
    assert all(c["distance_km"] <= 20 for c in near)
