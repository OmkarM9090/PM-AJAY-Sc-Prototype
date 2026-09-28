"""Turns a raw conversation into a structured Beneficiary Profile.

LLM mode uses the extraction prompt with GPT-4o-mini (JSON mode).
Offline mode uses deterministic parsers + the informal-skill lexicon, so
the demo produces an identical-looking profile with no API key.
"""

import re

from config import read_prompt
from services import llm_service
from services.data_store import DISTRICT_COORDS
from services.language import SLOT_ORDER, detect_language
from services.skill_lexicon import infer_interest_sectors, infer_skills

STATE_BY_DISTRICT = {
    "varanasi": "Uttar Pradesh", "chandauli": "Uttar Pradesh", "bhadohi": "Uttar Pradesh",
    "mirzapur": "Uttar Pradesh", "lucknow": "Uttar Pradesh", "kanpur": "Uttar Pradesh",
    "agra": "Uttar Pradesh", "unnao": "Uttar Pradesh", "patna": "Bihar", "bhagalpur": "Bihar",
    "ranchi": "Jharkhand", "chennai": "Tamil Nadu", "kanchipuram": "Tamil Nadu",
    "tiruppur": "Tamil Nadu", "vellore": "Tamil Nadu", "hyderabad": "Telangana",
    "medak": "Telangana", "pune": "Maharashtra", "nagpur": "Maharashtra", "nashik": "Maharashtra",
    "jaipur": "Rajasthan", "ajmer": "Rajasthan", "kolkata": "West Bengal",
    "ludhiana": "Punjab", "guwahati": "Assam", "surat": "Gujarat",
}

# Devanagari / regional aliases for the demo districts.
DISTRICT_ALIASES = {
    "वाराणसी": "varanasi", "बनारस": "varanasi", "काशी": "varanasi", "banaras": "varanasi",
    "लखनऊ": "lucknow", "कानपुर": "kanpur", "आगरा": "agra", "पटना": "patna",
    "रांची": "ranchi", "चेन्नई": "chennai", "सेन्नई": "chennai", "ஹைதராபாத்": "hyderabad",
    "हैदराबाद": "hyderabad", "पुणे": "pune", "पुना": "pune", "नागपुर": "nagpur",
    "नासिक": "nashik", "जयपुर": "jaipur", "अजमेर": "ajmer", "कोलकाता": "kolkata",
    "भदोही": "bhadohi", "चंदौली": "chandauli", "भागलपुर": "bhagalpur", "மதுரை": "chennai",
}

EDUCATION_PATTERNS = [
    (r"(graduat|स्नातक|डिग्री|degree|b\.?a|b\.?sc|b\.?com)", "Graduate"),
    (r"(12|बारह|बारहवीं|twelfth|inter|इंटर|hsc)", "12th pass"),
    (r"(10|दस|दसवीं|tenth|matric|मैट्रिक|ssc)", "10th pass"),
    (r"(9|नौवीं|ninth)", "9th pass"),
    (r"(8|आठ|आठवीं|eighth|आठवी)", "8th pass"),
    (r"(7|सात|सातवीं|seventh)", "7th pass"),
    (r"(6|छठ|छठी|sixth)", "6th pass"),
    (r"(5|पाँच|पांच|पाँचवीं|पांचवी|fifth|प्राइमरी|primary)", "5th pass"),
    (r"(नहीं पढ़|अनपढ़|never|no school|निरक्षर|not stud|illiterate)", "No formal education"),
]

SELF_EMP_WORDS = ["khud", "खुद", "apna", "अपना", "own", "self", "dukan", "दुकान", "business",
                  "व्यापार", "उद्यम", "स्वयं", "சொந்த", "సొంత", "स्वतःचा", "নিজের"]
WAGE_WORDS = ["naukri", "नौकरी", "job", "salary", "तनख्वाह", "company", "कंपनी", "वेतन",
              "வேலை", "ఉద్యోగం", "চাকরি"]

NO_CONSTRAINT_WORDS = ["nahi", "नहीं", "no ", "none", "koi nahi", "कोई नहीं", "theek", "ठीक",
                       "இல்லை", "లేదు", "নেই", "नाही"]

NUM_WORDS = {"das": 10, "दस": 10, "bees": 20, "बीस": 20, "pachas": 50, "पचास": 50,
             "tees": 30, "तीस": 30, "chalis": 40, "चालीस": 40, "paanch": 5, "पाँच": 5,
             "sau": 100, "सौ": 100, "pandrah": 15, "पंद्रह": 15, "pachchis": 25, "पच्चीस": 25}

LANG_NAME = {"hi": "Hindi", "en": "English", "mr": "Marathi", "ta": "Tamil",
             "te": "Telugu", "bn": "Bengali"}


def _clean_name(raw: str) -> str:
    if not raw:
        return "Beneficiary"
    text = raw.strip()
    # NOTE: patterns are escaped — "." must not be treated as a regex wildcard.
    for junk in ["मेरा नाम", "my name is", "naam", "नाम", "है", "hai", r"\bis\b", r"\bi am\b",
                 "मैं", "என் பெயர்", "నా పేరు", "माझं नाव", "আমার নাম", "।", r"\.", ","]:
        pattern = junk if junk.startswith("\\") or junk.startswith(r"\b") else re.escape(junk)
        text = re.sub(pattern, " ", text, flags=re.IGNORECASE)
    text = " ".join(text.split())
    words = text.split()
    return " ".join(words[:3]).title() if words else "Beneficiary"


def _parse_location(raw: str):
    blob = (raw or "").lower()
    district = None
    for alias, key in DISTRICT_ALIASES.items():
        if alias.lower() in blob:
            district = key
            break
    if not district:
        for key in DISTRICT_COORDS:
            if key in blob:
                district = key
                break
    village = None
    m = re.search(r"([A-Za-z\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\u0980-\u09FF]+)\s*(गाँव|गांव|village|gaon|गाव)", raw or "")
    if m:
        village = m.group(1).strip().title()
    if not village:
        m2 = re.search(r"(?:गाँव|गांव|village|gaon)\s+([A-Za-z\u0900-\u097F]+)", raw or "", re.IGNORECASE)
        if m2:
            village = m2.group(1).strip().title()
    return {
        "village": village or "—",
        "district": district.title() if district else "Varanasi",
        "state": STATE_BY_DISTRICT.get(district or "varanasi", "Uttar Pradesh"),
    }


def _parse_education(raw: str) -> str:
    blob = (raw or "").lower()
    for pattern, label in EDUCATION_PATTERNS:
        if re.search(pattern, blob):
            return label
    return "Not specified"


def _parse_preference(raw: str) -> str:
    blob = (raw or "").lower()
    self_emp = any(w in blob for w in SELF_EMP_WORDS)
    wage = any(w in blob for w in WAGE_WORDS)
    if self_emp and not wage:
        return "self-employment"
    if wage and not self_emp:
        return "wage-employment"
    return "either"


def _parse_mobility(raw: str) -> float:
    blob = (raw or "").lower()
    m = re.search(r"(\d{1,3})\s*(km|कि\.?मी|किलोमीटर|kilometre|kilometer)?", blob)
    if m and m.group(1):
        val = int(m.group(1))
        if 1 <= val <= 300:
            return float(val)
    for word, val in NUM_WORDS.items():
        if word in blob:
            return float(val)
    if any(w in blob for w in NO_CONSTRAINT_WORDS):
        return 5.0
    if any(w in blob for w in ["haan", "हाँ", "yes", "ho", "आहे", "ஆம்", "అవును", "হ্যাঁ"]):
        return 25.0
    return 10.0


def _parse_constraints(raw: str) -> str:
    blob = (raw or "").lower().strip()
    if not blob:
        return "none"
    if any(w in blob for w in NO_CONSTRAINT_WORDS) and len(blob) < 40:
        return "none"
    return raw.strip()


def _age_from_text(blob: str):
    m = re.search(r"(?:उम्र|umar|age|वर्ष|साल का|years old)\D{0,6}(\d{2})", blob, re.IGNORECASE)
    if m:
        age = int(m.group(1))
        if 14 <= age <= 70:
            return age
    return None


INTEREST_FILLERS = ["मुझे", "मैं", "सीखना है", "सीखना", "चाहता हूँ", "चाहती हूँ", "करना है",
                    "अच्छा लगता है", "i want to", "i like", "learn", "काम", "भी", "आता है",
                    "would like", "to do", "करना", "पसंद है"]


def _parse_interests(raw: str) -> list:
    """Split a free-form aspiration sentence into short interest phrases."""
    chunks = re.split(r"[,।;/]| और | and | aur | या | or ", raw or "")
    out = []
    for chunk in chunks:
        text = chunk
        for filler in INTEREST_FILLERS:
            text = re.sub(filler, " ", text, flags=re.IGNORECASE)
        text = " ".join(text.split()).strip(" .,।")
        if len(text) > 2:
            out.append(text)
    return out[:4]


def offline_extract(slots: dict, transcript: str, language: str = "hi") -> dict:
    """Rule-based structured extraction (no API key required)."""
    slots = slots or {}
    joined = " ".join(str(v) for v in slots.values() if v) or transcript or ""

    family = slots.get("family_occupation", "")
    current = slots.get("current_livelihood", "")
    probe = slots.get("probe_traditional_skill", "")
    interests_raw = slots.get("interests", "")

    skills = infer_skills(family, current, probe, slots.get("education", ""))
    if not skills:
        skills = ["manual labor", "communication"]

    interest_sectors = infer_interest_sectors(interests_raw, slots.get("probe_interest_depth", ""))
    interests = _parse_interests(interests_raw)

    langs = sorted({LANG_NAME.get(language, "Hindi"),
                    LANG_NAME.get(detect_language(joined, language), "Hindi")})

    return {
        "name": _clean_name(slots.get("name", "")),
        "age": _age_from_text(joined),
        "gender": None,
        "location": _parse_location(slots.get("location", "")),
        "education": _parse_education(slots.get("education", "")),
        "category": "SC",
        "family_occupation": family or "Not specified",
        "current_livelihood": current or "Not specified",
        "identified_skills": skills,
        "interests": interests or ["general work"],
        "interest_sectors": interest_sectors,
        "employment_preference": _parse_preference(slots.get("employment_preference", "")),
        "mobility_range_km": _parse_mobility(slots.get("mobility", "")),
        "physical_constraints": _parse_constraints(slots.get("physical_constraints", "")),
        "languages_spoken": langs,
        "experience_note": probe or None,
        "extraction_engine": "offline-rule-extractor",
    }


def llm_extract(transcript: str, language: str = "hi"):
    """GPT-based extraction; returns None when unavailable."""
    if not llm_service.available():
        return None
    prompt = read_prompt("profile_extraction_prompt.txt")
    data = llm_service.chat_json(
        [{"role": "system", "content": prompt},
         {"role": "user", "content": f"CONVERSATION TRANSCRIPT:\n{transcript}"}],
        temperature=0.2, max_tokens=900,
    )
    if not data or not data.get("name"):
        return None
    loc = data.get("location") or {}
    district = (loc.get("district") or "Varanasi").strip()
    data["location"] = {
        "village": loc.get("village") or "—",
        "district": district.title(),
        "state": loc.get("state") or STATE_BY_DISTRICT.get(district.lower(), "Uttar Pradesh"),
    }
    data.setdefault("category", "SC")
    data.setdefault("identified_skills", [])
    data.setdefault("interests", [])
    data["interest_sectors"] = infer_interest_sectors(" ".join(map(str, data.get("interests", []))))
    data.setdefault("employment_preference", "either")
    try:
        data["mobility_range_km"] = float(str(data.get("mobility_range_km", 10)).split()[0])
    except Exception:
        data["mobility_range_km"] = 10.0
    data.setdefault("physical_constraints", "none")
    data.setdefault("languages_spoken", [LANG_NAME.get(language, "Hindi")])
    data["extraction_engine"] = "openai-gpt"
    return data


def extract_profile(slots: dict, messages: list, language: str = "hi") -> dict:
    transcript = "\n".join(
        f"{'AI' if m['speaker'] == 'assistant' else 'Beneficiary'}: {m['text']}" for m in (messages or [])
    )
    profile = llm_extract(transcript, language) if transcript else None
    if not profile:
        profile = offline_extract(slots, transcript, language)
    # Always enrich with lexicon-derived skills — GPT often misses informal ones.
    lex = infer_skills(profile.get("family_occupation", ""), profile.get("current_livelihood", ""),
                       " ".join(map(str, profile.get("identified_skills", []))))
    merged = list(dict.fromkeys(list(profile.get("identified_skills", [])) + lex))
    profile["identified_skills"] = merged
    profile["slots_captured"] = {s: slots.get(s) for s in SLOT_ORDER if slots.get(s)}
    return profile
