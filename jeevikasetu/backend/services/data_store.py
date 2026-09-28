"""Loads and indexes the curated reference datasets (NSQF, centres, jobs, GIA)."""

import json
import math
from functools import lru_cache

from config import DATA_DIR


def _load(name):
    with open(DATA_DIR / name, "r", encoding="utf-8") as fh:
        return json.load(fh)


@lru_cache(maxsize=1)
def nsqf_packs():
    return _load("nsqf_database.json")


@lru_cache(maxsize=1)
def training_centers():
    return _load("training_centers.json")


@lru_cache(maxsize=1)
def opportunities():
    return _load("opportunities.json")


@lru_cache(maxsize=1)
def gia_benefits():
    return _load("gia_benefits.json")


@lru_cache(maxsize=1)
def personas():
    return _load("sample_personas.json")


def qp_by_code(code):
    return next((q for q in nsqf_packs() if q["qp_code"] == code), None)


# --------------------------------------------------------------------------
# Geography — district centroids used for haversine distance / mobility filter
# --------------------------------------------------------------------------
DISTRICT_COORDS = {
    "varanasi": (25.3176, 82.9739),
    "chandauli": (25.2575, 83.2686),
    "bhadohi": (25.3949, 82.5703),
    "mirzapur": (25.1337, 82.5644),
    "lucknow": (26.8467, 80.9462),
    "kanpur": (26.4499, 80.3319),
    "agra": (27.1767, 78.0081),
    "unnao": (26.5393, 80.4878),
    "patna": (25.5941, 85.1376),
    "bhagalpur": (25.2425, 86.9842),
    "ranchi": (23.3441, 85.3096),
    "chennai": (13.0827, 80.2707),
    "kanchipuram": (12.8342, 79.7036),
    "tiruppur": (11.1085, 77.3411),
    "vellore": (12.9165, 79.1325),
    "hyderabad": (17.3850, 78.4867),
    "medak": (18.0463, 78.2646),
    "pune": (18.5204, 73.8567),
    "nagpur": (21.1458, 79.0882),
    "nashik": (19.9975, 73.7898),
    "jaipur": (26.9124, 75.7873),
    "ajmer": (26.4499, 74.6399),
    "kolkata": (22.5726, 88.3639),
    "ludhiana": (30.9010, 75.8573),
    "guwahati": (26.1445, 91.7362),
    "surat": (21.1702, 72.8311),
}


def district_coords(district):
    if not district:
        return None
    return DISTRICT_COORDS.get(district.strip().lower())


def haversine_km(a, b):
    """Great-circle distance in km between (lat, lon) tuples."""
    if not a or not b:
        return None
    lat1, lon1, lat2, lon2 = map(math.radians, [a[0], a[1], b[0], b[1]])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return round(2 * 6371 * math.asin(math.sqrt(h)), 1)


def centers_near(district, qp_code=None, sector=None, max_km=None):
    """Training centres sorted by distance from the beneficiary's district."""
    origin = district_coords(district)
    results = []
    for c in training_centers():
        if qp_code and qp_code not in c["courses_offered"]:
            continue
        if sector and sector not in c["sectors"]:
            continue
        dist = haversine_km(origin, (c["latitude"], c["longitude"]))
        if dist is None:
            dist = 0.0 if c["district"].lower() == (district or "").lower() else 999.0
        if max_km is not None and dist > max_km:
            continue
        item = dict(c)
        item["distance_km"] = dist
        results.append(item)
    return sorted(results, key=lambda x: x["distance_km"])


def opportunities_near(district=None, state=None, otype=None, sector=None, qp_code=None, max_km=None):
    origin = district_coords(district)
    out = []
    for o in opportunities():
        if otype and o["type"] != otype:
            continue
        if sector and o["sector"] != sector:
            continue
        if qp_code and o["linked_qp"] != qp_code:
            continue
        dist = haversine_km(origin, district_coords(o["district"]))
        item = dict(o)
        item["distance_km"] = dist if dist is not None else None
        if max_km is not None and dist is not None and dist > max_km:
            continue
        if state and not district and o["state"].lower() != state.lower():
            continue
        out.append(item)
    return sorted(out, key=lambda x: (x["distance_km"] if x["distance_km"] is not None else 9999))


def benefit_head(head_id):
    return next((b for b in gia_benefits()["benefit_heads"] if b["id"] == head_id), None)
