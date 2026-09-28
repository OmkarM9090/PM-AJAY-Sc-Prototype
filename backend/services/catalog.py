"""Small, versioned demo catalogue loader.

The catalogue deliberately carries an illustrative-data notice. It is not a live
NCVET, job-board, training-provider or PM-AJAY eligibility integration.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

CATALOG_PATH = Path(__file__).resolve().parents[1] / "data" / "catalog.json"


@lru_cache(maxsize=1)
def load_catalog() -> dict[str, Any]:
    with CATALOG_PATH.open(encoding="utf-8") as catalog_file:
        return json.load(catalog_file)


def find_persona(persona_id: str) -> dict[str, Any] | None:
    return next((item for item in load_catalog()["personas"] if item["id"] == persona_id), None)


def education_rank(value: str | None) -> int:
    """Compare education conservatively. Unknown values never block a demo match."""
    normalised = (value or "").lower()
    if "graduate" in normalised or "diploma" in normalised:
        return 6
    if "iti" in normalised or "12" in normalised:
        return 5
    if "10" in normalised:
        return 4
    if "8" in normalised:
        return 3
    if "5" in normalised:
        return 2
    if "no" in normalised:
        return 1
    return 2
