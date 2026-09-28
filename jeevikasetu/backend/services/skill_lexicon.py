"""Informal-work → formal-competency lexicon.

This is the heart of "informal skill recognition": a villager says
"main apne pita ke saath chamde ka kaam karta hoon" and the system infers
the NSQF competencies *leather cutting, leather stitching, hide processing,
product finishing* — the same vocabulary used by the Qualification Packs.

Keys are trigger keywords (English + romanised Hindi + Devanagari + a few
Tamil/Telugu/Marathi/Bengali words). Values are canonical skill tokens that
match the ``required_skills`` vocabulary of nsqf_database.json.
"""

SKILL_LEXICON = {
    # ---- Leather ----
    ("leather", "chamda", "chamde", "चमड़ा", "चमड़े", "मोची", "mochi", "தோல்", "చర్మం"): [
        "leather cutting", "leather stitching", "hide processing", "product finishing", "hand tooling",
    ],
    ("shoe", "footwear", "jutha", "juta", "जूता", "chappal", "चप्पल"): [
        "leather cutting", "machine stitching", "upper assembly", "product finishing",
    ],
    # ---- Construction ----
    ("construction", "mistri", "मिस्त्री", "rajmistri", "राजमिस्त्री", "nirman", "निर्माण",
     "building", "site", "mazdoori", "मजदूरी", "labour", "labor", "majdoor", "मजदूर", "கட்டிடம்"): [
        "manual labor", "basic construction", "brick laying", "mortar mixing", "tool handling",
    ],
    ("plaster", "पलस्तर", "concrete", "cement", "सीमेंट"): ["plastering", "concrete work", "levelling"],
    ("carpenter", "badhai", "बढ़ई", "lakdi", "लकड़ी", "wood"): ["carpentry", "measurement", "tool handling"],
    ("paint", "painter", "पेंट", "rangai", "रंगाई"): ["surface preparation", "finishing", "tool handling"],
    # ---- Agriculture ----
    ("farm", "kheti", "खेती", "किसान", "kisan", "agriculture", "fasal", "फसल", "வேளாண்", "వ్యవసాయం", "शेती"): [
        "crop planning", "soil testing", "pest management", "manual labor", "field operations",
    ],
    ("cow", "buffalo", "gaay", "गाय", "bhains", "भैंस", "dairy", "doodh", "दूध", "पशु", "cattle"): [
        "cattle feeding", "milking", "animal health monitoring", "record keeping",
    ],
    ("murgi", "मुर्गी", "poultry", "chicken", "bird"): ["bird handling", "feed management", "shed hygiene"],
    ("tractor", "ट्रैक्टर"): ["tractor driving", "basic maintenance", "field operations"],
    ("sabzi", "सब्ज़ी", "vegetable", "organic", "compost", "खाद"): [
        "organic farming", "compost preparation", "crop planning",
    ],
    # ---- Textile ----
    ("sil", "silai", "सिलाई", "tailor", "darzi", "दर्जी", "stitch", "sewing", "தையல்", "కుట్టు", "शिवण"): [
        "machine stitching", "measurement taking", "cutting", "pattern making", "seam finishing",
    ],
    ("bunkar", "बुनकर", "weav", "loom", "करघा", "handloom", "साड़ी", "saree", "நெசவு"): [
        "loom setting", "warping", "weft insertion", "design reading", "yarn handling",
    ],
    ("kadhai", "कढ़ाई", "embroider", "zari", "ज़री", "chikan", "चिकन"): [
        "hand embroidery", "thread work", "design tracing", "finishing",
    ],
    ("carpet", "kaleen", "कालीन", "dari", "दरी"): ["knotting", "colour matching", "design mapping"],
    ("rangai", "dye", "dyeing", "printing", "chhapai", "छपाई"): ["dye mixing", "block printing", "colour fastness check"],
    # ---- Crafts ----
    ("pottery", "kumhar", "कुम्हार", "mitti", "मिट्टी", "clay", "terracotta"): [
        "clay preparation", "wheel throwing", "kiln firing", "surface decoration",
    ],
    ("bamboo", "baans", "बांस", "cane", "tokri", "टोकरी", "basket"): [
        "bamboo splitting", "weaving", "product shaping", "natural finishing",
    ],
    # ---- Automotive / mechanical ----
    ("mechanic", "mistry", "garage", "गैराज", "bike", "motorcycle", "scooter", "गाड़ी", "gaadi",
     "मोटर", "வண்டி"): [
        "engine servicing", "brake adjustment", "tool handling", "fault diagnosis", "basic servicing",
    ],
    ("drive", "driver", "driving", "chalak", "चालक", "ड्राइवर", "gadi chalana", "truck", "tempo", "auto"): [
        "driving", "route planning", "vehicle checks", "road safety",
    ],
    # ---- Electrical / electronics ----
    ("electric", "bijli", "बिजली", "wiring", "वायरिंग", "மின்", "విద్యుత్"): [
        "house wiring", "switchboard fitting", "fault detection", "electrical safety",
    ],
    ("mobile", "मोबाइल", "phone repair", "फोन", "solder", "टीवी", "tv", "fridge", "appliance"): [
        "soldering", "fault diagnosis", "screen replacement", "appliance repair",
    ],
    ("computer", "कंप्यूटर", "typing", "टाइपिंग", "data entry", "csc", "internet", "online"): [
        "computer basics", "typing", "data accuracy", "digital services",
    ],
    # ---- Plumbing ----
    ("plumb", "nal", "नल", "pipe", "पाइप", "tanki", "टंकी"): [
        "pipe fitting", "leak repair", "fixture installation", "tool handling",
    ],
    # ---- Food ----
    ("cook", "khana", "खाना", "rasoi", "रसोई", "halwai", "हलवाई", "chef", "canteen", "dhaba",
     "சமையல்", "వంట", "स्वयंपाक"): [
        "cooking", "food hygiene", "ingredient preparation", "packaging",
    ],
    ("achar", "अचार", "pickle", "papad", "पापड़", "masala", "मसाला"): [
        "preservation", "ingredient preparation", "packaging", "food hygiene",
    ],
    ("bakery", "bread", "cake", "बेकरी"): ["dough preparation", "oven handling", "cooking"],
    # ---- Beauty ----
    ("salon", "nai", "नाई", "barber", "hair", "बाल", "parlour", "parlor", "beauty", "ब्यूटी"): [
        "hair cutting", "shaving", "hair styling", "salon hygiene", "customer handling",
    ],
    ("mehendi", "मेहंदी", "henna", "nail"): ["mehendi application", "design creation", "customer handling"],
    # ---- Care / domestic ----
    ("safai", "सफाई", "clean", "jhaadu", "झाड़ू", "housekeep", "domestic", "bai", "घरकाम"): [
        "cleaning", "household hygiene", "time management",
    ],
    ("bacche", "बच्चे", "child care", "aaya", "आया", "creche"): ["child care", "hygiene practices", "empathy and communication"],
    ("nurse", "hospital", "अस्पताल", "patient", "मरीज", "asha", "आशा", "anganwadi", "आंगनवाड़ी"): [
        "patient handling", "hygiene practices", "first aid", "communication",
    ],
    ("budhe", "बुज़ुर्ग", "elderly", "care taker", "caretaker"): ["elderly care", "personal hygiene support", "empathy and communication"],
    # ---- Retail / hospitality ----
    ("shop", "dukan", "दुकान", "kirana", "किराना", "retail", "selling", "bech", "बेच", "vyapar", "व्यापार"): [
        "customer handling", "billing", "stock arrangement", "inventory management",
    ],
    ("hotel", "होटल", "restaurant", "waiter", "tourist", "guest", "पर्यटक"): [
        "table service", "customer handling", "hygiene practices", "communication",
    ],
    # ---- Generic capabilities ----
    ("hisab", "हिसाब", "account", "paisa", "पैसा", "calculation", "ganit", "गणित"): ["basic accounting", "billing"],
    ("padhna", "पढ़ना", "likhna", "लिखना", "read", "write", "literate"): ["basic literacy"],
    ("mobile pay", "upi", "phonepe", "paytm", "google pay", "gpay"): ["digital payments"],
}


def infer_skills(*texts) -> list:
    """Return canonical NSQF-style skills implied by free-form text."""
    blob = " ".join([t.lower() for t in texts if t])
    found = []
    for triggers, skills in SKILL_LEXICON.items():
        if any(trigger in blob for trigger in triggers):
            for s in skills:
                if s not in found:
                    found.append(s)
    return found


# Interest keyword → sector, used for interest-alignment scoring.
INTEREST_SECTOR_MAP = {
    ("mobile", "मोबाइल", "phone", "electronic", "tv", "fridge", "cctv", "solder"): "Electronics & Hardware",
    ("drive", "driver", "ड्राइवर", "गाड़ी", "truck", "taxi", "auto"): "Automotive",
    ("bike", "mechanic", "garage", "गैराज", "engine"): "Automotive",
    ("silai", "सिलाई", "tailor", "दर्जी", "boutique", "kapda", "कपड़ा"): "Textile & Apparel",
    ("kheti", "खेती", "farm", "dairy", "गाय", "murgi", "मुर्गी", "mushroom", "honey", "मधुमक्खी"): "Agriculture & Allied",
    ("beauty", "parlour", "parlor", "ब्यूटी", "salon", "नाई", "mehendi", "मेहंदी", "hair"): "Beauty & Wellness",
    ("computer", "कंप्यूटर", "data entry", "csc", "online", "typing"): "IT/ITES",
    ("dukan", "दुकान", "shop", "kirana", "किराना", "retail", "business", "व्यापार"): "Retail",
    ("hospital", "अस्पताल", "nurse", "care", "मरीज", "patient"): "Healthcare",
    ("plumb", "नल", "pipe", "पाइप"): "Plumbing",
    ("bijli", "बिजली", "electric", "solar", "सोलर", "wiring"): "Power & Electrical",
    ("khana", "खाना", "cook", "bakery", "बेकरी", "achar", "अचार", "food", "hotel"): "Food Processing",
    ("mistri", "मिस्त्री", "construction", "निर्माण", "building", "supervisor"): "Construction",
    ("chamda", "चमड़ा", "leather", "shoe", "जूता"): "Leather",
    ("bunkar", "बुनकर", "handloom", "करघा", "carpet", "कालीन", "craft", "pottery", "कुम्हार", "bamboo"): "Handicrafts & Carpet",
    ("hotel", "होटल", "tourism", "guest", "homestay", "पर्यटन"): "Tourism & Hospitality",
    ("safai", "सफाई", "housekeeping", "domestic", "घरकाम"): "Domestic Worker",
}


def infer_interest_sectors(*texts) -> list:
    blob = " ".join([t.lower() for t in texts if t])
    sectors = []
    for triggers, sector in INTEREST_SECTOR_MAP.items():
        if any(tr in blob for tr in triggers) and sector not in sectors:
            sectors.append(sector)
    return sectors
