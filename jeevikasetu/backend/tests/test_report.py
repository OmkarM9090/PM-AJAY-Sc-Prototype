"""
PDF report tests.

Two real bugs are locked down here:

1. ``Content-Disposition`` is a latin-1 header, so a Devanagari name used to
   raise UnicodeEncodeError and the download 500'd.
2. ReportLab's default fonts are Latin-1 only, so Indic text rendered as black
   boxes. The report now embeds Noto Sans faces (see services/pdf_fonts.py).
"""

import os
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app  # noqa: E402
from services.pdf_fonts import BASE_FONT, markup  # noqa: E402

PROFILE = {
    "name": "रमेश कुमार",
    "age": 32,
    "category": "SC",
    "education": "8th pass",
    "location": {"village": "सरैया", "district": "Varanasi", "state": "Uttar Pradesh"},
    "family_occupation": "चमड़े का काम",
    "current_livelihood": "दिहाड़ी मजदूरी",
    "identified_skills": ["leather cutting", "stitching"],
    "interests": ["जूते बनाना"],
    "languages_spoken": ["hi", "en"],
    "mobility_range_km": 30,
    "employment_preference": "self_employment",
    "physical_constraints": "none",
}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def recommendations(client):
    return client.post("/api/recommend", json={"profile": PROFILE}).json()["recommendations"]


def _generate(client, name, recs):
    return client.post("/api/report/generate",
                       json={"profile": dict(PROFILE, name=name), "recommendations": recs})


def test_unicode_fonts_are_registered():
    assert BASE_FONT != "Helvetica", "bundled Noto faces must load (assets/fonts)"


@pytest.mark.parametrize("name", [
    "रमेश कुमार",        # Devanagari
    "முருகன் ராஜா",      # Tamil
    "রহিম দাস",          # Bengali
    "రాము గౌడ్",          # Telugu
    "Ramesh Kumar",      # Latin
])
def test_report_generates_for_every_supported_script(client, recommendations, name):
    r = _generate(client, name, recommendations)
    assert r.status_code == 200
    assert r.content[:4] == b"%PDF"
    assert len(r.content) > 2000
    # The header must survive latin-1 encoding by the ASGI layer.
    r.headers["content-disposition"].encode("latin-1")


def test_non_latin_filename_uses_rfc5987(client, recommendations):
    cd = _generate(client, "रमेश कुमार", recommendations).headers["content-disposition"]
    assert 'filename="JeevikaSetu' in cd, "ASCII fallback for legacy clients"
    assert "filename*=UTF-8''" in cd, "percent-encoded UTF-8 name for modern browsers"
    assert "%E0%A4%B0" in cd, "the original Devanagari name is preserved"


def test_devanagari_text_is_embedded_not_boxed(client, recommendations):
    pypdf = pytest.importorskip("pypdf")
    r = _generate(client, "रमेश कुमार", recommendations)
    reader = pypdf.PdfReader(__import__("io").BytesIO(r.content))
    fonts = [v.get_object().get("/BaseFont") for v in reader.pages[0]["/Resources"]["/Font"].values()]
    assert any("NotoSansDevanagari" in str(f) for f in fonts), "font must be embedded"
    text = reader.pages[0].extract_text()
    assert "रमेश कुमार" in text
    assert "सरैया" in text
    assert "■" not in text and "\ufffd" not in text


def test_markup_switches_font_per_script():
    tamil = markup("Name: முருகன்")
    assert 'font name="NotoTaml"' in tamil
    assert "Name:" in tamil
    # Devanagari is the base face, so it needs no font switch...
    assert "font name=" not in markup("रमेश कुमार")
    # ...and XML metacharacters from user answers must be escaped, not injected.
    assert markup("Tools & <dies>") == "Tools &amp; &lt;dies&gt;"
