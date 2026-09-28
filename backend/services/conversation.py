"""Conversation orchestration with a deterministic local fallback.

When OPENAI_API_KEY is configured, OpenAI is used for a warm acknowledgement;
the required interview slots and profile persistence remain deterministic so a
live demo does not depend on a model making a tool call correctly.
"""
from __future__ import annotations

import os
import re
from copy import deepcopy
from typing import Any

from .store import language_name

LANGUAGE_HINTS = {
    "hi": ["है", "मेरा", "नाम", "गांव", "काम", "करता", "करती", "हिंदी", "ji", "hai", "mera", "gaon", "kaam"],
    "mr": ["आहे", "माझे", "मी ", "मराठी", "aahe", "majhe", "marathi"],
    "ta": ["என்", "நான்", "தமிழ", "irukk", "tamil"],
    "te": ["నా", "నేను", "తెలుగు", "telugu"],
    "bn": ["আমার", "আমি", "বাংলা", "bangla"],
}

QUESTIONS: dict[str, dict[str, str]] = {
    "hi": {
        "greeting": "Namaste! Main JeevikaSetu hoon. Main aapke hunar aur agle rozgaar ke kadam ko samajhne mein madad karungi. Aapka naam kya hai?",
        "location": "Dhanyavaad. Aap kahan rehte hain? Apna gaon ya sheher, zila aur rajya bataiye.",
        "education": "Bahut achha. Aapne kitni padhai ki hai?",
        "family_occupation": "Aapke parivaar ka paramparik kaam kya raha hai?",
        "current_livelihood": "Aur aap abhi kya kaam karte hain ya kis kaam mein madad karte hain?",
        "interests": "Aapko kaunsa kaam achha lagta hai? Aap kya seekhna ya karna chahte hain?",
        "employment_preference": "Aap apna khud ka kaam shuru karna chahte hain ya naukri karna pasand karenge?",
        "mobility_km": "Training ke liye aap apne gaon se kitni door tak ja sakte hain? Kilometre mein andaza bata dijiye.",
        "physical_constraints": "Kya koi shaaririk dikkat ya zimmedari hai jiska humein dhyan rakhna chahiye? Agar nahi, bas ‘nahi’ keh dijiye.",
        "summary": "Maine jo samjha hai: {summary}. Kya yeh jaankari sahi hai?",
        "confirmed": "Dhanyavaad. Aapka profile tayyar hai. Ab hum aapke liye skill aur rozgaar ke raaste dekh sakte hain.",
    },
    "en": {
        "greeting": "Hello! I am JeevikaSetu. I will understand your skills and help find your next livelihood step. What is your name?",
        "location": "Thank you. Where do you live? Please tell me your village or city, district and state.",
        "education": "That is helpful. How far did you study?",
        "family_occupation": "What traditional work has your family done?",
        "current_livelihood": "And what work do you do now, or help with?",
        "interests": "What kind of work do you enjoy? What would you like to learn or do?",
        "employment_preference": "Would you prefer your own work or a job with an employer?",
        "mobility_km": "How far can you travel from your home for training? Please share an approximate distance in kilometres.",
        "physical_constraints": "Is there any physical difficulty or responsibility we should keep in mind? You can simply say no if there is none.",
        "summary": "This is what I understood: {summary}. Is that correct?",
        "confirmed": "Thank you. Your profile is ready. We can now look at suitable skill and livelihood pathways.",
    },
    "mr": {
        "greeting": "Namaskar! Mi JeevikaSetu aahe. Tumche kaushalya samjun pudhil rojgaracha marg shodhayla mi madat karin. Tumche nav kay aahe?",
        "location": "Dhanyavaad. Tumhi kuthe rahata? Gaav kinva shahar, jilha ani rajya sanga.",
        "education": "Chhan. Tumche shikshan kiti zale aahe?",
        "family_occupation": "Tumchya kutumbacha paramparik vyavasay kay aahe?",
        "current_livelihood": "Ata tumhi konte kaam karta kinva madat karta?",
        "interests": "Tumhala konta kaam avadte? Tumhala kay shikayche aahe?",
        "employment_preference": "Tumhala swatacha vyavasay karaycha aahe ki nokri karaychi aahe?",
        "mobility_km": "Prashikshanasathi tumhi gharapasun kiti kilometre jau shakta?",
        "physical_constraints": "Aamhi lakshat ghyavi ashi sharirik adchan kinva jababdari aahe ka? Nasel tar nahi mhanun sanga.",
        "summary": "Mala ase samajale: {summary}. Hi mahiti barobar aahe ka?",
        "confirmed": "Dhanyavaad. Tumche profile tayyar aahe. Ata yogya marg pahuya.",
    },
    "ta": {
        "greeting": "Vanakkam! Naan JeevikaSetu. Ungal thirangalai purindhukondu adutha vaazhvaadhaara vazhiyai kandariya uthavuven. Ungal peyar enna?",
        "location": "Nandri. Neengal engu vaazhgireergal? Ungal oor, maavattam matrum maanilam sollungal.",
        "education": "Nalladhu. Neengal evvalavu padithirukkireergal?",
        "family_occupation": "Ungal kudumbathin paarampariya thozhil enna?",
        "current_livelihood": "Ippodhu neengal enna velai seygireergal?",
        "interests": "Ungalukku enna velai pidikkum? Enna katrukkolla virumbugireergal?",
        "employment_preference": "Suyathozhil seiya virumbugireergalaa alladhu velai virumbugireergalaa?",
        "mobility_km": "Payirchikku veettilirundhu evvalavu kilometre sellamudiyum?",
        "physical_constraints": "Naangal karuthil kolla vendiya udal nilai alladhu poruppu ulladhaa? Illai endraal illai endru sollungal.",
        "summary": "Naan purindhukondadhu: {summary}. Idhu sariyaa?",
        "confirmed": "Nandri. Ungal profile thayaar. Ippodhu poruthamaana vazhigalai paarkkalaam.",
    },
    "te": {
        "greeting": "Namaskaram! Nenu JeevikaSetu. Mee naipunyalu ardham chesukoni mee tadupiri upadhi maarganni kanugonadaniki sahayam chestanu. Mee peru emiti?",
        "location": "Dhanyavaadalu. Meeru ekkada untaru? Mee ooru, jilla mariyu raashtram cheppandi.",
        "education": "Bagundi. Meeru entha varaku chadivaaru?",
        "family_occupation": "Mee kutumba saampradaaya pani emiti?",
        "current_livelihood": "Ippudu meeru emi pani chestunnaru?",
        "interests": "Meeku ye pani ishtam? Emi nerchukovalani anukuntunnaru?",
        "employment_preference": "Sonta pani cheyalanukuntunnara leka udyogam kavala?",
        "mobility_km": "Shikshanam kosam intinundi enni kilometarlu vellagalaru?",
        "physical_constraints": "Memu pariganinchalsina sharirika ibbandi leda baadhyata emaina undaa? Ledu ani cheppavacchu.",
        "summary": "Nenu ardham chesukunnadi: {summary}. Idi sariyenaa?",
        "confirmed": "Dhanyavaadalu. Mee profile siddham. Ippudu tagina maargalanu chooddam.",
    },
    "bn": {
        "greeting": "Nomoskar! Ami JeevikaSetu. Apnar dokkhota bujhe porer jibikar poth khujte sahajjo korbo. Apnar naam ki?",
        "location": "Dhonnobad. Apni kothay thaken? Gram ba shohor, jela ebong rajyo bolun.",
        "education": "Bhalo. Apni koto dur porashona korechen?",
        "family_occupation": "Apnar poribarer paramparik kaj ki?",
        "current_livelihood": "Ekhon apni ki kaj koren?",
        "interests": "Kon kaj apnar bhalo lage? Ki shikhte chan?",
        "employment_preference": "Nijer kaj korte chan na chakri korte chan?",
        "mobility_km": "Training-er jonno bari theke koto kilometre jete parben?",
        "physical_constraints": "Amader mone rakhar moto kono sharirik oshubidha ba dayitto ache? Na thakle na bolun.",
        "summary": "Ami ja bujhechi: {summary}. Eta ki thik?",
        "confirmed": "Dhonnobad. Apnar profile toiri. Ebar upojukto poth dekha jak.",
    },
}

SLOTS = ["name", "location", "education", "family_occupation", "current_livelihood", "interests", "employment_preference", "mobility_km", "physical_constraints"]


def detect_language(text: str, fallback: str = "hi") -> str:
    lower = text.lower()
    if re.search(r"[\u0B80-\u0BFF]", text): return "ta"
    if re.search(r"[\u0C00-\u0C7F]", text): return "te"
    if re.search(r"[\u0980-\u09FF]", text): return "bn"
    # Hindi and Marathi share Devanagari. Marathi needs explicit hints.
    if re.search(r"[\u0900-\u097F]", text):
        return "mr" if any(word in lower for word in LANGUAGE_HINTS["mr"]) else "hi"
    if any(word in lower for word in LANGUAGE_HINTS["hi"]): return "hi"
    if any(word in lower for word in LANGUAGE_HINTS["mr"]): return "mr"
    return "en" if re.search(r"[a-zA-Z]", text) else fallback


def _add_unique(profile: dict[str, Any], key: str, values: list[str]) -> None:
    existing = profile.setdefault(key, [])
    for value in values:
        if value and value not in existing:
            existing.append(value)


def _location_from_text(text: str) -> dict[str, str]:
    lower = text.lower()
    villages = {"chandpur": "Chandpur", "mohanlalganj": "Mohanlalganj", "tambaram": "Tambaram", "hadapsar": "Hadapsar", "phulwari": "Phulwari"}
    districts = {"varanasi": "Varanasi", "lucknow": "Lucknow", "chennai": "Chennai", "hyderabad": "Hyderabad", "pune": "Pune", "jaipur": "Jaipur", "patna": "Patna", "nagpur": "Nagpur", "bengaluru": "Bengaluru Urban", "bangalore": "Bengaluru Urban", "kolkata": "Kolkata", "bhopal": "Bhopal", "ranchi": "Ranchi", "madurai": "Madurai", "ahmedabad": "Ahmedabad"}
    states = {"up": "Uttar Pradesh", "uttar pradesh": "Uttar Pradesh", "tamil nadu": "Tamil Nadu", "telangana": "Telangana", "maharashtra": "Maharashtra", "rajasthan": "Rajasthan", "bihar": "Bihar", "karnataka": "Karnataka", "west bengal": "West Bengal", "madhya pradesh": "Madhya Pradesh", "jharkhand": "Jharkhand", "gujarat": "Gujarat"}
    return {
        "village": next((name for needle, name in villages.items() if needle in lower), ""),
        "district": next((name for needle, name in districts.items() if needle in lower), ""),
        "state": next((name for needle, name in states.items() if needle in lower), ""),
    }


def _skills_from_text(text: str) -> list[str]:
    lower = text.lower()
    dictionary = {
        "leather": ["leather crafting", "leather cutting", "leather stitching"], "chamda": ["leather crafting", "leather cutting", "leather stitching"],
        "construction": ["basic construction", "manual labor"], "mazdoor": ["manual labor", "basic construction"], "masonry": ["brick masonry"],
        "mobile repair": ["mobile repair"], "phone repair": ["mobile repair"], "driving": ["safe driving"], "driver": ["safe driving"],
        "tailor": ["machine stitching", "fabric cutting"], "silai": ["machine stitching"], "stitch": ["machine stitching"],
        "farming": ["organic farming", "irrigation"], "kheti": ["organic farming", "irrigation"], "dairy": ["animal care", "milking"],
        "electric": ["basic wiring", "electrical safety"], "plumb": ["pipe fitting", "leak repair"],
        "computer": ["computer basics"], "data entry": ["data entry"], "beauty": ["basic beauty services"],
        "caregiver": ["elder care", "patient support"], "elder care": ["elder care", "hygiene"], "cooking": ["food handling"],
        "bamboo": ["bamboo craft"], "weaving": ["weaving", "loom operation"], "embroidery": ["hand embroidery"],
    }
    output: list[str] = []
    for phrase, skills in dictionary.items():
        if phrase in lower:
            output.extend(skills)
    return list(dict.fromkeys(output))


def _interests_from_text(text: str) -> list[str]:
    lower = text.lower()
    labels = ["mobile repair", "driving", "two-wheeler repair", "own garage", "beauty services", "boutique work", "healthcare", "computer work", "poultry farming", "food business", "tailoring", "farming", "plumbing"]
    found = [item for item in labels if item in lower]
    hindi_map = {"mobile": "mobile repair", "gaadi": "driving", "silai": "tailoring", "kheti": "farming", "murga": "poultry farming", "beauty": "beauty services", "computer": "computer work"}
    found.extend(label for word, label in hindi_map.items() if word in lower)
    return list(dict.fromkeys(found))


def _extract_name(text: str) -> str:
    patterns = [r"(?:my name is|i am|i'm|mera naam|mera nam|naam hai|name is)\s+([A-Za-zÀ-ÿ\u0900-\u097F ]{2,40})", r"(?:main|mai)\s+([A-Za-z\u0900-\u097F ]{2,30})\s+(?:hoon|hun)"]
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            name = re.sub(r"\b(?:hai|hoon|hun|from|se|ka|ki)\b.*", "", match.group(1), flags=re.IGNORECASE).strip(" .,!")
            if len(name) > 1: return name.title()
    words = text.strip().split()
    return " ".join(words[:3]).title() if 1 <= len(words) <= 4 else ""


def extract_signals(profile: dict[str, Any], text: str, active_slot: str | None) -> dict[str, Any]:
    """Update a profile using both the active answer and signals mentioned freely."""
    updated = deepcopy(profile)
    lower = text.lower().strip()
    location = _location_from_text(text)
    if any(location.values()):
        for field, value in location.items():
            if value: updated["location"][field] = value
    skills = _skills_from_text(text)
    if skills: _add_unique(updated, "identified_skills", skills)
    interests = _interests_from_text(text)
    if interests: _add_unique(updated, "interests", interests)
    if active_slot == "name" and not updated.get("name"):
        updated["name"] = _extract_name(text)
    if active_slot == "education":
        education_patterns = [(r"\b(iti)\b", "ITI"), (r"\b(12th|12)\b", "12th pass"), (r"\b(10th|10)\b", "10th pass"), (r"\b(8th|8)\b", "8th pass"), (r"\b(5th|5)\b", "5th pass"), (r"no (formal )?education", "No formal education")]
        for pattern, value in education_patterns:
            if re.search(pattern, lower): updated["education"] = value
        if not updated.get("education") and text: updated["education"] = text.strip()[:90]
    if active_slot == "family_occupation" and text:
        updated["family_occupation"] = text.strip()[:150]
    if active_slot == "current_livelihood" and text:
        updated["current_livelihood"] = text.strip()[:150]
    if active_slot == "interests" and text:
        if not updated["interests"]: _add_unique(updated, "interests", [text.strip()[:100]])
    if active_slot == "employment_preference":
        if any(word in lower for word in ["self", "business", "own", "apna", "khud", "swayam", "स्वयं"]): updated["employment_preference"] = "self-employment"
        elif any(word in lower for word in ["job", "naukri", "wage", "salary", "नौकरी"]): updated["employment_preference"] = "wage-employment"
        elif text: updated["employment_preference"] = text.strip()[:60]
    if active_slot == "mobility_km":
        match = re.search(r"(\d{1,3})\s*(?:km|kilomet(?:er|re)?|किलोमीटर)?", lower)
        if match: updated["mobility_km"] = min(int(match.group(1)), 250)
    if active_slot == "physical_constraints":
        no_constraint = any(word in lower for word in ["no", "none", "nahi", "nahin", "koi nahi", "नहीं", "nahi hai"])
        updated["physical_constraints"] = "None mentioned" if no_constraint else text.strip()[:150]
    # Extract preference even if it was volunteered early.
    if any(word in lower for word in ["self employment", "own business", "apna kaam", "khud ka kaam"]): updated["employment_preference"] = "self-employment"
    if any(word in lower for word in ["naukri", "job chahiye", "wage employment"]): updated["employment_preference"] = "wage-employment"
    return updated


def missing_slots(profile: dict[str, Any]) -> list[str]:
    checks = {
        "name": bool(profile.get("name")),
        "location": bool(profile.get("location", {}).get("district") or profile.get("location", {}).get("village")),
        "education": bool(profile.get("education")),
        "family_occupation": bool(profile.get("family_occupation")),
        "current_livelihood": bool(profile.get("current_livelihood")),
        "interests": bool(profile.get("interests")),
        "employment_preference": bool(profile.get("employment_preference")),
        "mobility_km": profile.get("mobility_km") is not None,
        "physical_constraints": bool(profile.get("physical_constraints")),
    }
    return [slot for slot in SLOTS if not checks[slot]]


def profile_summary(profile: dict[str, Any]) -> str:
    location = profile.get("location", {})
    place = ", ".join(value for value in [location.get("village"), location.get("district"), location.get("state")] if value) or "aapka kshetra"
    fragments = [
        f"naam {profile.get('name') or 'nahi bataya'}",
        f"jagah {place}",
        f"padhai {profile.get('education') or 'nahi batayi'}",
        f"kaushal {', '.join(profile.get('identified_skills', [])[:4]) or 'nahi bataye'}",
        f"pasand {', '.join(profile.get('interests', [])[:3]) or 'nahi batayi'}",
    ]
    return "; ".join(fragments)


def is_confirmation(text: str) -> bool:
    lower = text.lower().strip()
    return any(word in lower for word in ["yes", "haan", "ha", "sahi", "correct", "right", "barobar", "ஆம்", "avunu", "হ্যাঁ"])


def reply_for_turn(profile: dict[str, Any], text: str, language: str, awaiting_confirmation: bool) -> tuple[dict[str, Any], str, bool, str | None]:
    """Create next guided question. Returns updated profile, reply, complete, active slot."""
    language = language if language in QUESTIONS else "hi"
    if awaiting_confirmation and is_confirmation(text):
        return profile, QUESTIONS[language]["confirmed"], True, None
    active_slot = missing_slots(profile)[0] if missing_slots(profile) else None
    updated = extract_signals(profile, text, active_slot)
    remaining = missing_slots(updated)
    if not remaining:
        return updated, QUESTIONS[language]["summary"].format(summary=profile_summary(updated)), False, "confirmation"
    next_slot = remaining[0]
    acknowledgement = {"hi": "Samajh gaya. ", "en": "Thank you. ", "mr": "Samajale. ", "ta": "Nandri. ", "te": "Dhanyavaadalu. ", "bn": "Dhonnobad. "}.get(language, "")
    # Greeting is special and should not be prefixed after a first answer.
    return updated, acknowledgement + QUESTIONS[language][next_slot], False, next_slot


def opening_message(language: str) -> str:
    return QUESTIONS.get(language, QUESTIONS["hi"])["greeting"]


def progress(profile: dict[str, Any]) -> dict[str, Any]:
    complete = len(SLOTS) - len(missing_slots(profile))
    return {"completed": complete, "total": len(SLOTS), "covered": [slot for slot in SLOTS if slot not in missing_slots(profile)]}
