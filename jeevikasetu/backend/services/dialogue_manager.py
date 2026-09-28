"""Conversation manager for the JeevikaSetu voice interview.

Two interchangeable brains:

* LLM brain (when OPENAI_API_KEY is set) — GPT-4o-mini with the empathetic
  system prompt, returning {reply, slot_updates, completed} as JSON.
* Offline brain — a deterministic slot-filling dialogue engine with warm
  acknowledgements, dynamic follow-up probes, clarification handling and a
  closing summary, fully translated into 6 languages.

Both return the same ``TurnResult`` so the API contract never changes.
"""

import random
import re
from dataclasses import dataclass, field

from config import read_prompt
from services import llm_service
from services.language import (ACKS, CLARIFY, EMPATHY, GREETING, QUESTIONS,
                               SLOT_ORDER, SUMMARY_CONFIRM, SUMMARY_INTRO,
                               SUMMARY_LABELS, detect_language, t)

# Dynamic follow-up probes: asked once, only when the answer warrants it.
PROBES = {
    "traditional_skill": {
        "after": "family_occupation",
        # stems, so inflected forms (चमड़ा / चमड़े / चमड़ी) all trigger the probe
        "trigger": ["chamd", "चमड़", "leather", "mochi", "मोची", "जूत", "shoe", "bunk", "बुनक",
                    "loom", "करघ", "kumhar", "कुम्ह", "pottery", "मिट्टी", "silai", "सिल",
                    "tailor", "दर्जी", "kadhai", "कढ़", "craft", "बांस", "bamboo", "कालीन",
                    "carpet", "weav", "हस्तशिल्प", "पारंपरिक", "traditional", "artisan"],
        "question": {
            "hi": "क्या आपने भी यह पारंपरिक काम खुद किया है? कितने साल का अनुभव है?",
            "en": "Have you done this traditional work yourself? How many years of experience?",
            "mr": "तुम्ही स्वतः हे पारंपरिक काम केलं आहे का? किती वर्षांचा अनुभव?",
            "ta": "இந்த பாரம்பரிய வேலையை நீங்களே செய்திருக்கிறீர்களா? எத்தனை ஆண்டுகள் அனுபவம்?",
            "te": "ఈ సాంప్రదాయ పనిని మీరే చేశారా? ఎన్ని సంవత్సరాల అనుభవం?",
            "bn": "এই ঐতিহ্যবাহী কাজ আপনি নিজে করেছেন? কত বছরের অভিজ্ঞতা?",
        },
    },
    "interest_depth": {
        "after": "interests",
        "trigger": None,  # always asked once — keeps the interview conversational
        "question": {
            "hi": "अच्छा! क्या आपने यह काम कभी करके देखा है, या बिल्कुल नया सीखना है?",
            "en": "Good! Have you ever tried this work before, or would it be completely new?",
            "mr": "छान! हे काम तुम्ही आधी करून पाहिलं आहे का, की पूर्णपणे नवीन?",
            "ta": "நல்லது! இந்த வேலையை முன்பு செய்திருக்கிறீர்களா, அல்லது முற்றிலும் புதியதா?",
            "te": "బాగుంది! ఈ పనిని ఇంతకుముందు చేశారా, లేక పూర్తిగా కొత్తదా?",
            "bn": "ভালো! এই কাজ আগে করেছেন, নাকি একদম নতুন?",
        },
    },
}

PROBE_SLOTS = {f"probe_{k}": v for k, v in PROBES.items()}

MIN_ANSWER_CHARS = 2
UNCLEAR_TOKENS = {"", "?", "hmm", "uh", "क्या", "pata nahi", "पता नहीं", "samajh nahi aaya"}

# Words that signal "you got something wrong" on the confirmation turn.
CORRECTION_WORDS = ["galat", "गलत", "wrong", "nahi", "नहीं", "change", "badal", "बदल",
                    "चूक", "தவறு", "తప్పు", "ভুল", "चुकीचं"]

CLOSING = {
    "hi": "बहुत बढ़िया, धन्यवाद! अब मैं आपके हुनर को NSQF कौशल से जोड़कर सबसे अच्छे रास्ते तैयार कर रही हूँ। कृपया स्क्रीन पर देखिए।",
    "en": "Wonderful, thank you! I am now mapping your skills to NSQF competencies and preparing the best pathways for you. Please look at the screen.",
    "mr": "छान, धन्यवाद! आता मी तुमचं कौशल्य NSQF शी जोडून सर्वोत्तम मार्ग तयार करत आहे.",
    "ta": "நன்றி! இப்போது உங்கள் திறன்களை NSQF உடன் இணைத்து சிறந்த வழிகளைத் தயாரிக்கிறேன்.",
    "te": "ధన్యవాదాలు! ఇప్పుడు మీ నైపుణ్యాలను NSQF తో అనుసంధానించి ఉత్తమ మార్గాలను సిద్ధం చేస్తున్నాను.",
    "bn": "ধন্যবাদ! এখন আপনার দক্ষতা NSQF-এর সঙ্গে মিলিয়ে সেরা পথ তৈরি করছি।",
}

CORRECTION_ACK = {
    "hi": "कोई बात नहीं, मैं ठीक कर देती हूँ। आप अगली स्क्रीन पर अपनी जानकारी बदल सकते हैं — या मुझे अभी सही बात बता दीजिए।",
    "en": "No problem, I will correct it. You can edit your details on the next screen — or simply tell me the correct answer now.",
    "mr": "काही हरकत नाही, मी दुरुस्त करते. पुढील स्क्रीनवर माहिती बदलू शकता.",
    "ta": "பரவாயில்லை, சரி செய்கிறேன். அடுத்த திரையில் திருத்தலாம்.",
    "te": "ఫర్వాలేదు, సరిచేస్తాను. తదుపరి స్క్రీన్‌లో మార్చుకోవచ్చు.",
    "bn": "সমস্যা নেই, ঠিক করে দিচ্ছি। পরের স্ক্রিনে তথ্য বদলাতে পারবেন।",
}


def _is_correction(text):
    blob = (text or "").lower()
    return any(w in blob for w in CORRECTION_WORDS)


@dataclass
class TurnResult:
    reply: str
    language: str
    next_slot: str | None
    slots: dict = field(default_factory=dict)
    completed: bool = False
    progress: dict = field(default_factory=dict)
    engine: str = "offline-rule-engine"
    summary: str | None = None


def _progress(slots):
    done = [s for s in SLOT_ORDER if slots.get(s)]
    return {
        "answered": done,
        "pending": [s for s in SLOT_ORDER if s not in done],
        "total": len(SLOT_ORDER),
        "completed_count": len(done),
        "percent": round(len(done) / len(SLOT_ORDER) * 100),
    }


def _is_unclear(text):
    cleaned = (text or "").strip().lower()
    return len(cleaned) < MIN_ANSWER_CHARS or cleaned in UNCLEAR_TOKENS


def _next_pending_slot(slots, asked_probes):
    """Walk the script: core slots in order, inserting probes where earned."""
    for slot in SLOT_ORDER:
        if not slots.get(slot):
            return slot
        # after this slot is answered, check if a probe should fire
        for probe_key, cfg in PROBES.items():
            pslot = f"probe_{probe_key}"
            if cfg["after"] != slot or pslot in asked_probes or slots.get(pslot):
                continue
            trig = cfg["trigger"]
            answer = (slots.get(slot) or "").lower()
            if trig is None or any(tk in answer for tk in trig):
                return pslot
    return None


def _question_for(slot, lang):
    if slot in PROBE_SLOTS:
        return t(PROBE_SLOTS[slot]["question"], lang)
    return t(QUESTIONS[slot], lang)


def build_summary(slots, lang):
    labels = SUMMARY_LABELS.get(lang, SUMMARY_LABELS["en"])
    parts = []
    for slot in SLOT_ORDER:
        value = slots.get(slot)
        if value:
            parts.append(f"{labels.get(slot, slot)}: {value}")
    return " | ".join(parts)


def offline_turn(slots, user_text, lang, asked_probes) -> TurnResult:
    """Deterministic empathetic interviewer (no external API needed)."""
    slots = dict(slots or {})
    asked_probes = list(asked_probes or [])
    pending_before = _next_pending_slot(slots, asked_probes)

    # --- Opening turn -------------------------------------------------
    if user_text is None:
        return TurnResult(
            reply=t(GREETING, lang), language=lang, next_slot="name",
            slots=slots, progress=_progress(slots),
        )

    # --- Interview already complete → confirmation / correction turn ---
    if pending_before is None and any(slots.get(s) for s in SLOT_ORDER):
        summary = build_summary(slots, lang)
        if _is_correction(user_text):
            # Beneficiary says something is wrong → invite the correction,
            # the profile screen also allows manual editing.
            reply = t(CORRECTION_ACK, lang)
        else:
            reply = t(CLOSING, lang)
        return TurnResult(reply=reply, language=lang, next_slot=None, slots=slots,
                          completed=True, progress=_progress(slots), summary=summary)

    target = pending_before or "name"

    # --- Unclear answer → gentle clarification, same question again ----
    if _is_unclear(user_text):
        reply = f"{t(CLARIFY, lang)} {_question_for(target, lang)}"
        return TurnResult(reply=reply, language=lang, next_slot=target,
                          slots=slots, progress=_progress(slots))

    # --- Record the answer --------------------------------------------
    slots[target] = user_text.strip()
    if target.startswith("probe_"):
        asked_probes.append(target)

    next_slot = _next_pending_slot(slots, asked_probes)

    ack = random.choice(t(ACKS, lang))
    empathy = ""
    if target in EMPATHY:
        empathy = " " + t(EMPATHY[target], lang)

    # --- All done → summarise and ask for confirmation -----------------
    if next_slot is None:
        summary = build_summary(slots, lang)
        reply = f"{ack} {t(SUMMARY_INTRO, lang)} {summary}. {t(SUMMARY_CONFIRM, lang)}"
        return TurnResult(reply=reply, language=lang, next_slot=None, slots=slots,
                          completed=True, progress=_progress(slots), summary=summary)

    reply = f"{ack}{empathy} {_question_for(next_slot, lang)}"
    return TurnResult(reply=reply, language=lang, next_slot=next_slot, slots=slots,
                      progress=_progress(slots))


# ---------------------------------------------------------------------------
# LLM brain
# ---------------------------------------------------------------------------
def llm_turn(history, slots, user_text, lang) -> TurnResult | None:
    """GPT-driven turn. Returns None if the API is unavailable/failed."""
    if not llm_service.available():
        return None

    system = read_prompt("conversation_system_prompt.txt")
    state = (
        "\nCURRENT INTERVIEW STATE (JSON): "
        + str({k: v for k, v in slots.items() if v})
        + f"\nSLOTS STILL MISSING: {[s for s in SLOT_ORDER if not slots.get(s)]}"
        + f"\nREPLY LANGUAGE CODE: {lang}"
        + "\nReturn STRICT JSON: {\"reply\": str, \"slot_updates\": {slot: value}, "
          "\"completed\": bool, \"summary\": str}"
    )
    messages = [{"role": "system", "content": system + state}]
    for m in history[-14:]:
        messages.append({"role": "assistant" if m["speaker"] == "assistant" else "user",
                         "content": m["text"]})
    if user_text is None:
        messages.append({"role": "user", "content": "[call connected — greet the beneficiary and ask the first question]"})
    else:
        messages.append({"role": "user", "content": user_text})

    data = llm_service.chat_json(messages, temperature=0.6)
    if not data or "reply" not in data:
        return None

    merged = dict(slots)
    for k, v in (data.get("slot_updates") or {}).items():
        if k in SLOT_ORDER and v:
            merged[k] = str(v)
    completed = bool(data.get("completed")) or all(merged.get(s) for s in SLOT_ORDER)
    return TurnResult(
        reply=str(data["reply"]).strip(),
        language=lang,
        next_slot=_next_pending_slot(merged, []),
        slots=merged,
        completed=completed,
        progress=_progress(merged),
        engine="openai-gpt",
        summary=data.get("summary") or (build_summary(merged, lang) if completed else None),
    )


def next_turn(history, slots, user_text, lang=None, asked_probes=None) -> TurnResult:
    """Public entry point used by the API router."""
    language = lang or detect_language(user_text or "", fallback="hi")
    if user_text:
        # Let the beneficiary switch language mid-conversation.
        detected = detect_language(user_text, fallback=language)
        language = detected
    result = llm_turn(history, slots, user_text, language)
    if result is None:
        result = offline_turn(slots, user_text, language, asked_probes)
    return result


# ---------------------------------------------------------------------------
# Pre-recorded demo conversation (Demo Mode fallback for the presentation)
# ---------------------------------------------------------------------------
DEMO_SCRIPT_HI = [
    ("assistant", GREETING["hi"], "name"),
    ("user", "नमस्ते, मेरा नाम रमेश कुमार है।", "name"),
    ("assistant", "बहुत अच्छा! आप कहाँ रहते हैं? गाँव या शहर, और कौन सा ज़िला?", "location"),
    ("user", "मैं चाँदपुर गाँव में रहता हूँ, ज़िला वाराणसी, उत्तर प्रदेश।", "location"),
    ("assistant", "समझ गई। आपने कितनी पढ़ाई की है?", "education"),
    ("user", "आठवीं पास हूँ।", "education"),
    ("assistant", "ठीक है, धन्यवाद। आपके परिवार का काम क्या है? कोई पारंपरिक काम?", "family_occupation"),
    ("user", "हमारे घर में चमड़े का काम होता है, पिताजी जूते बनाते हैं।", "family_occupation"),
    ("assistant", "यह पारंपरिक हुनर बहुत कीमती है। क्या आपने भी यह काम खुद किया है? कितने साल का अनुभव है?",
     "probe_traditional_skill"),
    ("user", "हाँ, बचपन से पिताजी के साथ काम किया है, करीब दस साल।", "probe_traditional_skill"),
    ("assistant", "बढ़िया! आप अभी क्या काम करते हैं?", "current_livelihood"),
    ("user", "अभी मैं बिल्डिंग साइट पर दिहाड़ी मजदूरी करता हूँ।", "current_livelihood"),
    ("assistant", "मेहनत का काम है, इसमें भी बहुत हुनर होता है। आपको क्या सीखना अच्छा लगेगा?", "interests"),
    ("user", "मुझे मोबाइल रिपेयर सीखना है, और गाड़ी चलाना भी आता है।", "interests"),
    ("assistant", "अच्छा! क्या आपने यह काम कभी करके देखा है, या बिल्कुल नया सीखना है?", "probe_interest_depth"),
    ("user", "नया सीखना है, पर मन बहुत है।", "probe_interest_depth"),
    ("assistant", "समझ गई। क्या आप अपना खुद का काम करना चाहते हैं या नौकरी?", "employment_preference"),
    ("user", "अपना खुद का काम, अपनी दुकान खोलना चाहता हूँ।", "employment_preference"),
    ("assistant", "बहुत अच्छा! क्या आप training के लिए गाँव से बाहर जा सकते हैं? कितने किलोमीटर तक?", "mobility"),
    ("user", "हाँ, तीस किलोमीटर तक जा सकता हूँ।", "mobility"),
    ("assistant", "ठीक है। क्या आपको कोई शारीरिक दिक्कत है?", "physical_constraints"),
    ("user", "नहीं, कोई दिक्कत नहीं है।", "physical_constraints"),
]
