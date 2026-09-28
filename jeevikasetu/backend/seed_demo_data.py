"""Seeds the SQLite DB with anonymised demo beneficiaries.

Purpose: the official dashboard must show meaningful aggregates during the
judge demo, even before anyone has used the system. Rows created here are
flagged as channel-tagged demo records generated from the 5 curated personas
with realistic variation across 8 districts.
"""

import random
import uuid

from database import (BeneficiaryProfile, ConversationSession, Message,
                      RecommendationRecord, SessionLocal, dumps, init_db)
from services.data_store import personas
from services.nsqf_matcher import recommend

DISTRICTS = [
    ("Varanasi", "Uttar Pradesh"), ("Lucknow", "Uttar Pradesh"), ("Patna", "Bihar"),
    ("Chennai", "Tamil Nadu"), ("Hyderabad", "Telangana"), ("Pune", "Maharashtra"),
    ("Jaipur", "Rajasthan"), ("Ranchi", "Jharkhand"),
]
CHANNELS = ["web", "web", "ivr", "ivr", "whatsapp"]
LANG_BY_STATE = {
    "Uttar Pradesh": ["Hindi"], "Bihar": ["Hindi"], "Tamil Nadu": ["Tamil", "English"],
    "Telangana": ["Telugu", "Hindi"], "Maharashtra": ["Marathi", "Hindi"],
    "Rajasthan": ["Hindi"], "Jharkhand": ["Hindi"],
}
FIRST = ["Ramesh", "Sunita", "Lakshmi", "Murugan", "Bipin", "Kavita", "Anil", "Meena",
         "Suresh", "Pooja", "Rajesh", "Savita", "Dinesh", "Rekha", "Vikas", "Geeta",
         "Manoj", "Asha", "Prakash", "Nirmala", "Santosh", "Radha", "Kishan", "Usha"]
LAST = ["Kumar", "Devi", "Pawar", "Manjhi", "Ram", "Bai", "Kamble", "Paswan", "Murmu", "Valmiki"]


def seed(count: int = 24):
    init_db()
    db = SessionLocal()
    try:
        if db.query(BeneficiaryProfile).count() > 0:
            return {"seeded": 0, "note": "database already populated"}

        random.seed(26097)  # reproducible demo dataset (SIH problem statement id)
        base_personas = personas()
        created = 0

        for i in range(count):
            base = dict(base_personas[i % len(base_personas)])
            district, state = DISTRICTS[i % len(DISTRICTS)]
            channel = CHANNELS[i % len(CHANNELS)]
            name = f"{FIRST[i % len(FIRST)]} {LAST[(i * 3) % len(LAST)]}"
            langs = LANG_BY_STATE.get(state, ["Hindi"])

            sid = str(uuid.uuid4())[:8]
            sess = ConversationSession(id=sid, channel=channel, language="hi",
                                       status="completed", demo_mode=True,
                                       slots_json=dumps({"slots": {}, "asked_probes": []}))
            db.add(sess)
            db.add(Message(session_id=sid, speaker="assistant", text="[seeded demo conversation]",
                           language="hi"))
            db.add(Message(session_id=sid, speaker="user", text="[seeded demo response]", language="hi"))

            skills = list(base["identified_skills"])
            random.shuffle(skills)
            skills = skills[: max(3, len(skills) - random.randint(0, 2))]
            mobility = random.choice([5, 10, 15, 25, 30, 40, 50])
            pref = random.choice(["self-employment", "wage-employment", "either"])

            profile = {
                "name": name,
                "age": random.randint(19, 45),
                "location": {"village": base["location"]["village"], "district": district, "state": state},
                "education": random.choice(["No formal education", "5th pass", "8th pass",
                                            "10th pass", "12th pass"]),
                "category": "SC",
                "family_occupation": base["family_occupation"],
                "current_livelihood": base["current_livelihood"],
                "identified_skills": skills,
                "interests": base["interests"],
                "employment_preference": pref,
                "mobility_range_km": mobility,
                "physical_constraints": base["physical_constraints"],
                "languages_spoken": langs,
            }

            row = BeneficiaryProfile(
                session_id=sid, name=name, age=profile["age"],
                village=profile["location"]["village"], district=district, state=state,
                education=profile["education"], category="SC",
                family_occupation=profile["family_occupation"],
                current_livelihood=profile["current_livelihood"],
                identified_skills_json=dumps(skills), interests_json=dumps(profile["interests"]),
                employment_preference=pref, mobility_range_km=mobility,
                physical_constraints=profile["physical_constraints"],
                languages_json=dumps(langs), channel=channel)
            db.add(row)

            for rec in recommend(profile, top_n=3)["recommendations"]:
                db.add(RecommendationRecord(
                    session_id=sid, profile_name=name, district=district, state=state,
                    qp_code=rec["qp_code"], qp_name=rec["qp_name"], sector=rec["sector"],
                    rank=rec["rank"], score=rec["score"], skill_match_pct=rec["skill_match_pct"],
                    rpl_eligible=rec["rpl_eligible"]))
            created += 1

        db.commit()
        return {"seeded": created}
    finally:
        db.close()


if __name__ == "__main__":
    print(seed())
