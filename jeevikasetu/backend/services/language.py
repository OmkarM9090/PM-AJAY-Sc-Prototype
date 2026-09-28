"""Language detection + the multilingual interview script.

Detection strategy (works with zero external API calls):
  1. Unicode script detection  → Devanagari / Tamil / Telugu / Bengali.
  2. Devanagari disambiguation → Marathi vs Hindi via marker words.
  3. Latin script             → Hinglish marker words vs English.

If OPENAI_API_KEY is configured, Whisper's own language field overrides this.
"""

import re

SCRIPT_RANGES = {
    "devanagari": (0x0900, 0x097F),
    "bengali": (0x0980, 0x09FF),
    "tamil": (0x0B80, 0x0BFF),
    "telugu": (0x0C00, 0x0C7F),
}

MARATHI_MARKERS = ["आहे", "माझं", "माझे", "मला", "काय", "नाही", "तुम्ही", "करतो", "गाव", "शिक्षण"]
HINGLISH_MARKERS = ["hai", "nahi", "mera", "mujhe", "kaam", "gaon", "hun", "kya", "aap", "karta",
                    "padhai", "naam", "chahta", "achha", "bahut", "thoda"]


def detect_language(text: str, fallback: str = "hi") -> str:
    """Return a supported language code for the given utterance."""
    if not text or not text.strip():
        return fallback
    counts = {k: 0 for k in SCRIPT_RANGES}
    latin = 0
    for ch in text:
        cp = ord(ch)
        for name, (lo, hi) in SCRIPT_RANGES.items():
            if lo <= cp <= hi:
                counts[name] += 1
                break
        else:
            if ch.isalpha() and cp < 128:
                latin += 1

    if counts["tamil"] > 2:
        return "ta"
    if counts["telugu"] > 2:
        return "te"
    if counts["bengali"] > 2:
        return "bn"
    if counts["devanagari"] > 2:
        lowered = text
        if any(m in lowered for m in MARATHI_MARKERS):
            return "mr"
        return "hi"
    if latin:
        words = re.findall(r"[a-z]+", text.lower())
        if sum(1 for w in words if w in HINGLISH_MARKERS) >= 1:
            return "hi"   # Hinglish → treat as Hindi, reply in Hindi
        return "en"
    return fallback


# ---------------------------------------------------------------------------
# Interview script — 9 slots, one question at a time, warm and simple.
# ---------------------------------------------------------------------------
SLOT_ORDER = [
    "name",
    "location",
    "education",
    "family_occupation",
    "current_livelihood",
    "interests",
    "employment_preference",
    "mobility",
    "physical_constraints",
]

SLOT_LABELS = {
    "name": {"en": "Name", "hi": "नाम"},
    "location": {"en": "Village / District", "hi": "गाँव / जिला"},
    "education": {"en": "Education", "hi": "शिक्षा"},
    "family_occupation": {"en": "Family occupation", "hi": "पारिवारिक काम"},
    "current_livelihood": {"en": "Current work", "hi": "वर्तमान काम"},
    "interests": {"en": "Interests", "hi": "रुचि"},
    "employment_preference": {"en": "Job or own work", "hi": "नौकरी या स्वरोजगार"},
    "mobility": {"en": "Travel possible", "hi": "यात्रा क्षमता"},
    "physical_constraints": {"en": "Health constraints", "hi": "स्वास्थ्य"},
}

GREETING = {
    "hi": "नमस्ते! मैं जीविकासेतु हूँ, PM-AJAY योजना की आवाज़ सहायक। मैं आपके हुनर को समझकर आपके लिए सही काम और training बताऊँगी। थोड़ी सी बातचीत करेंगे, आराम से बताइएगा। सबसे पहले — आपका नाम क्या है?",
    "en": "Namaste! I am JeevikaSetu, the voice assistant of the PM-AJAY scheme. I will understand your skills and suggest the right training and livelihood for you. Let us talk slowly and simply. First of all — what is your name?",
    "mr": "नमस्कार! मी जीविकासेतु आहे, PM-AJAY योजनेची आवाज सहाय्यक. मी तुमचं कौशल्य समजून घेऊन योग्य प्रशिक्षण सुचवेन. आपण हळूहळू बोलूया. सर्वात आधी — तुमचं नाव काय आहे?",
    "ta": "வணக்கம்! நான் ஜீவிகாசேது, PM-AJAY திட்டத்தின் குரல் உதவியாளர். உங்கள் திறமையைப் புரிந்து சரியான பயிற்சியைச் சொல்வேன். மெதுவாகப் பேசலாம். முதலில் — உங்கள் பெயர் என்ன?",
    "te": "నమస్కారం! నేను జీవికాసేతు, PM-AJAY పథకం వాయిస్ అసిస్టెంట్. మీ నైపుణ్యాలను అర్థం చేసుకుని సరైన శిక్షణ సూచిస్తాను. నిదానంగా మాట్లాడుకుందాం. ముందుగా — మీ పేరు ఏమిటి?",
    "bn": "নমস্কার! আমি জীবিকাসেতু, PM-AJAY প্রকল্পের ভয়েস সহায়ক। আপনার দক্ষতা বুঝে সঠিক প্রশিক্ষণ জানাবো। ধীরে ধীরে কথা বলি। প্রথমে — আপনার নাম কী?",
}

# Spoken when a beneficiary comes back to a half-finished interview (dropped
# IVR call, closed browser tab). Reassures them that nothing was lost.
RESUME_GREETING = {
    "hi": "नमस्ते! आपकी पिछली बातचीत मुझे याद है, हम वहीं से आगे बढ़ते हैं।",
    "en": "Namaste! I remember our earlier conversation, let us continue from where we stopped.",
    "mr": "नमस्कार! आपली आधीची बातचीत मला आठवते, तिथूनच पुढे जाऊया.",
    "ta": "வணக்கம்! நம் முந்தைய உரையாடல் எனக்கு நினைவிருக்கிறது, அங்கிருந்தே தொடரலாம்.",
    "te": "నమస్కారం! మన గత సంభాషణ నాకు గుర్తుంది, అక్కడి నుంచే కొనసాగుదాం.",
    "bn": "নমস্কার! আমাদের আগের কথা মনে আছে, সেখান থেকেই এগোই।",
}

QUESTIONS = {
    "name": {
        "hi": "आपका नाम क्या है?",
        "en": "What is your name?",
        "mr": "तुमचं नाव काय आहे?",
        "ta": "உங்கள் பெயர் என்ன?",
        "te": "మీ పేరు ఏమిటి?",
        "bn": "আপনার নাম কী?",
    },
    "location": {
        "hi": "आप कहाँ रहते हैं? गाँव या शहर, और कौन सा ज़िला?",
        "en": "Where do you live? Village or city, and which district?",
        "mr": "तुम्ही कुठे राहता? गाव की शहर, आणि कोणता जिल्हा?",
        "ta": "நீங்கள் எங்கே வசிக்கிறீர்கள்? கிராமமா நகரமா, எந்த மாவட்டம்?",
        "te": "మీరు ఎక్కడ నివసిస్తున్నారు? గ్రామమా పట్టణమా, ఏ జిల్లా?",
        "bn": "আপনি কোথায় থাকেন? গ্রাম না শহর, কোন জেলা?",
    },
    "education": {
        "hi": "आपने कितनी पढ़ाई की है? कोई भी जवाब ठीक है।",
        "en": "How much have you studied? Any answer is fine.",
        "mr": "तुम्ही किती शिक्षण घेतलं आहे? कोणतंही उत्तर चालेल.",
        "ta": "நீங்கள் எவ்வளவு படித்திருக்கிறீர்கள்? எந்த பதிலும் சரி.",
        "te": "మీరు ఎంత చదువుకున్నారు? ఏ సమాధానం అయినా సరే.",
        "bn": "আপনি কতদূর পড়াশোনা করেছেন? যেকোনো উত্তরই ঠিক আছে।",
    },
    "family_occupation": {
        "hi": "आपके परिवार का काम क्या है? कोई पारंपरिक काम जो घर में होता आया है?",
        "en": "What work does your family do? Any traditional family occupation?",
        "mr": "तुमच्या कुटुंबाचं काम काय आहे? काही पारंपरिक काम?",
        "ta": "உங்கள் குடும்பம் என்ன வேலை செய்கிறது? பாரம்பரிய தொழில் ஏதும் உண்டா?",
        "te": "మీ కుటుంబం ఏ పని చేస్తుంది? సాంప్రదాయ వృత్తి ఏదైనా ఉందా?",
        "bn": "আপনার পরিবার কী কাজ করে? কোনো পারিবারিক ঐতিহ্যবাহী কাজ?",
    },
    "current_livelihood": {
        "hi": "आप अभी क्या काम करते हैं?",
        "en": "What work are you doing now?",
        "mr": "सध्या तुम्ही काय काम करता?",
        "ta": "இப்போது நீங்கள் என்ன வேலை செய்கிறீர்கள்?",
        "te": "ప్రస్తుతం మీరు ఏ పని చేస్తున్నారు?",
        "bn": "এখন আপনি কী কাজ করেন?",
    },
    "interests": {
        "hi": "आपको कौन सा काम करना अच्छा लगता है? क्या सीखना चाहते हैं?",
        "en": "What work do you enjoy? What would you like to learn?",
        "mr": "तुम्हाला कोणतं काम आवडतं? काय शिकायचं आहे?",
        "ta": "உங்களுக்கு எந்த வேலை பிடிக்கும்? என்ன கற்க விரும்புகிறீர்கள்?",
        "te": "మీకు ఏ పని ఇష్టం? ఏమి నేర్చుకోవాలనుకుంటున్నారు?",
        "bn": "আপনার কোন কাজ ভালো লাগে? কী শিখতে চান?",
    },
    "employment_preference": {
        "hi": "क्या आप अपना खुद का काम शुरू करना चाहते हैं, या नौकरी करना चाहते हैं?",
        "en": "Would you like to start your own work, or would you prefer a job?",
        "mr": "तुम्हाला स्वतःचा व्यवसाय करायचा आहे की नोकरी?",
        "ta": "சொந்தமாக தொழில் தொடங்க விரும்புகிறீர்களா அல்லது வேலை வேண்டுமா?",
        "te": "మీరు సొంత పని ప్రారంభించాలనుకుంటున్నారా లేక ఉద్యోగం కావాలా?",
        "bn": "আপনি কি নিজের কাজ শুরু করতে চান, নাকি চাকরি?",
    },
    "mobility": {
        "hi": "प्रशिक्षण के लिए आप घर से कितने किलोमीटर दूर तक जा सकते हैं?",
        "en": "How many kilometres from home can you travel for training?",
        "mr": "प्रशिक्षणासाठी घरापासून किती किलोमीटर दूर जाऊ शकता?",
        "ta": "பயிற்சிக்காக வீட்டிலிருந்து எத்தனை கிலோமீட்டர் தூரம் செல்ல முடியும்?",
        "te": "శిక్షణ కోసం ఇంటి నుండి ఎన్ని కిలోమీటర్ల దూరం వెళ్లగలరు?",
        "bn": "প্রশিক্ষণের জন্য বাড়ি থেকে কত কিলোমিটার দূরে যেতে পারবেন?",
    },
    "physical_constraints": {
        "hi": "क्या आपको कोई शारीरिक दिक्कत या स्वास्थ्य समस्या है, जिसका हमें ध्यान रखना चाहिए?",
        "en": "Do you have any physical difficulty or health issue we should keep in mind?",
        "mr": "तुम्हाला काही शारीरिक अडचण किंवा आरोग्य समस्या आहे का?",
        "ta": "உங்களுக்கு ஏதேனும் உடல் சிரமம் அல்லது உடல்நலப் பிரச்சினை உள்ளதா?",
        "te": "మీకు ఏదైనా శారీరక ఇబ్బంది లేదా ఆరోగ్య సమస్య ఉందా?",
        "bn": "আপনার কি কোনো শারীরিক অসুবিধা বা স্বাস্থ্য সমস্যা আছে?",
    },
}

# Warm acknowledgements — rotated so the agent never sounds robotic.
ACKS = {
    "hi": ["बहुत अच्छा!", "समझ गई।", "ठीक है, धन्यवाद।", "बढ़िया, आगे बढ़ते हैं।", "जी, नोट कर लिया।"],
    "en": ["Very good!", "I understand.", "Thank you.", "That's helpful, let's continue.", "Noted."],
    "mr": ["खूप छान!", "समजलं.", "धन्यवाद.", "छान, पुढे जाऊया.", "नोंद केली."],
    "ta": ["மிக நல்லது!", "புரிந்தது.", "நன்றி.", "சரி, தொடர்வோம்.", "குறித்துக் கொண்டேன்."],
    "te": ["చాలా బాగుంది!", "అర్థమైంది.", "ధన్యవాదాలు.", "సరే, ముందుకు వెళ్దాం.", "నోట్ చేసుకున్నాను."],
    "bn": ["খুব ভালো!", "বুঝেছি।", "ধন্যবাদ।", "বেশ, এগোই।", "লিখে নিলাম।"],
}

# Slot-specific empathetic follow-up lines (shown before the next question).
EMPATHY = {
    "family_occupation": {
        "hi": "यह पारंपरिक हुनर बहुत कीमती है — सरकार इसे औपचारिक पहचान दे सकती है।",
        "en": "This traditional skill is very valuable — the government can give it formal recognition.",
        "mr": "हे पारंपरिक कौशल्य खूप मौल्यवान आहे.",
        "ta": "இந்த பாரம்பரியத் திறமை மிகவும் மதிப்புமிக்கது.",
        "te": "ఈ సాంప్రదాయ నైపుణ్యం చాలా విలువైనది.",
        "bn": "এই ঐতিহ্যবাহী দক্ষতা খুব মূল্যবান।",
    },
    "current_livelihood": {
        "hi": "मेहनत का काम है, इसमें भी बहुत हुनर होता है।",
        "en": "That is hard work, and it carries real skills too.",
        "mr": "हे कष्टाचं काम आहे, यातही कौशल्य असतं.",
        "ta": "இது கடின உழைப்பு, அதிலும் திறமை உண்டு.",
        "te": "ఇది కష్టమైన పని, అందులోనూ నైపుణ్యం ఉంది.",
        "bn": "এটি পরিশ্রমের কাজ, এতেও দক্ষতা আছে।",
    },
    "physical_constraints": {
        "hi": "बताने के लिए धन्यवाद, हम इसका पूरा ध्यान रखेंगे।",
        "en": "Thank you for telling me, we will keep this in mind.",
        "mr": "सांगितल्याबद्दल धन्यवाद, आम्ही याची काळजी घेऊ.",
        "ta": "சொன்னதற்கு நன்றி, இதைக் கவனத்தில் கொள்வோம்.",
        "te": "చెప్పినందుకు ధన్యవాదాలు, దీన్ని గుర్తుంచుకుంటాం.",
        "bn": "জানানোর জন্য ধন্যবাদ, আমরা এটি মনে রাখব।",
    },
}

CLARIFY = {
    "hi": "माफ़ कीजिए, मैं ठीक से समझ नहीं पाई। थोड़ा आसान शब्दों में फिर बताइए —",
    "en": "Sorry, I did not catch that. Could you say it again in simple words —",
    "mr": "माफ करा, मला नीट समजलं नाही. पुन्हा सोप्या शब्दांत सांगा —",
    "ta": "மன்னிக்கவும், சரியாகப் புரியவில்லை. மீண்டும் எளிமையாகச் சொல்லுங்கள் —",
    "te": "క్షమించండి, సరిగ్గా అర్థం కాలేదు. మళ్లీ సులభంగా చెప్పండి —",
    "bn": "দুঃখিত, ঠিক বুঝতে পারিনি। আবার সহজ ভাষায় বলুন —",
}

SUMMARY_INTRO = {
    "hi": "बहुत बढ़िया! मैंने आपकी बात से यह समझा —",
    "en": "Excellent! Here is what I understood from our conversation —",
    "mr": "छान! मी हे समजलं —",
    "ta": "அருமை! நான் புரிந்துகொண்டது இதுதான் —",
    "te": "చాలా బాగుంది! నేను అర్థం చేసుకున్నది ఇదే —",
    "bn": "দারুণ! আমি এটুকু বুঝলাম —",
}

SUMMARY_CONFIRM = {
    "hi": "क्या यह सब सही है? अगर कुछ बदलना हो तो बताइए, वरना मैं आपके लिए सबसे अच्छे काम और training ढूँढती हूँ।",
    "en": "Is all of this correct? Tell me if anything should change, otherwise I will now find the best training and livelihood options for you.",
    "mr": "हे सगळं बरोबर आहे का? काही बदलायचं असेल तर सांगा, अन्यथा मी तुमच्यासाठी पर्याय शोधते.",
    "ta": "இவை அனைத்தும் சரியா? மாற்ற வேண்டுமானால் சொல்லுங்கள், இல்லையெனில் உங்களுக்கான வாய்ப்புகளைத் தேடுகிறேன்.",
    "te": "ఇవన్నీ సరైనవేనా? మార్చాలంటే చెప్పండి, లేకపోతే మీకు తగిన అవకాశాలు వెతుకుతాను.",
    "bn": "সব ঠিক আছে তো? কিছু বদলাতে হলে বলুন, নাহলে আমি আপনার জন্য সুযোগ খুঁজছি।",
}

SUMMARY_LABELS = {
    "hi": {"name": "नाम", "location": "जगह", "education": "पढ़ाई", "family_occupation": "पारिवारिक काम",
           "current_livelihood": "अभी का काम", "interests": "रुचि", "employment_preference": "पसंद",
           "mobility": "यात्रा", "physical_constraints": "स्वास्थ्य"},
    "en": {"name": "Name", "location": "Location", "education": "Education", "family_occupation": "Family work",
           "current_livelihood": "Current work", "interests": "Interest", "employment_preference": "Preference",
           "mobility": "Travel", "physical_constraints": "Health"},
}


def t(mapping, lang, default_lang="en"):
    """Safe translation lookup."""
    return mapping.get(lang) or mapping.get(default_lang) or next(iter(mapping.values()))
