"""Unicode font support for the PDF report.

ReportLab's built-in Type-1 fonts (Helvetica & co.) are Latin-1 only, so a
beneficiary called "रमेश कुमार" would either raise or come out as blank boxes.
Since JeevikaSetu is a voice-first product for Hindi / Marathi / Tamil / Telugu /
Bengali speakers, the certificate-style report MUST render their own script.

We therefore bundle the Noto Sans family (SIL Open Font License 1.1, see
assets/fonts/LICENSE.md) and register the ones we need with ReportLab:

* Noto Sans Devanagari  -> Hindi, Marathi + Latin (used as the base font,
                           it ships full Basic-Latin coverage)
* Noto Sans Tamil / Telugu / Bengali -> the remaining supported languages

ReportLab has no automatic font fallback, so :func:`markup` splits a string into
runs by Unicode block and wraps each non-Devanagari run in a ``<font name=...>``
tag that the platypus Paragraph parser understands.
"""

from __future__ import annotations

import os
from xml.sax.saxutils import escape

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

FONT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                        "assets", "fonts")

# logical name -> (regular file, bold file)
_FONT_FILES = {
    "NotoDeva": ("NotoSansDevanagari_400Regular.ttf", "NotoSansDevanagari_700Bold.ttf"),
    "NotoTaml": ("NotoSansTamil_400Regular.ttf", "NotoSansTamil_700Bold.ttf"),
    "NotoTelu": ("NotoSansTelugu_400Regular.ttf", "NotoSansTelugu_700Bold.ttf"),
    "NotoBeng": ("NotoSansBengali_400Regular.ttf", "NotoSansBengali_700Bold.ttf"),
}

# Unicode block -> logical font name. Anything not listed uses the base font.
_SCRIPT_RANGES = (
    (0x0900, 0x097F, "NotoDeva"),   # Devanagari
    (0x0980, 0x09FF, "NotoBeng"),   # Bengali
    (0x0B80, 0x0BFF, "NotoTaml"),   # Tamil
    (0x0C00, 0x0C7F, "NotoTelu"),   # Telugu
)

#: Font actually used for body text; downgraded to Helvetica if the TTFs are
#: missing (e.g. a slim deployment) so report generation never hard-fails.
BASE_FONT = "Helvetica"
BASE_BOLD = "Helvetica-Bold"

_registered: set[str] = set()


def register_fonts() -> bool:
    """Register the bundled Noto faces once. Returns True if Unicode is available."""
    global BASE_FONT, BASE_BOLD
    if _registered:
        return BASE_FONT != "Helvetica"

    for name, (regular, bold) in _FONT_FILES.items():
        reg_path = os.path.join(FONT_DIR, regular)
        bold_path = os.path.join(FONT_DIR, bold)
        if not os.path.exists(reg_path):
            continue
        try:
            pdfmetrics.registerFont(TTFont(name, reg_path))
            if os.path.exists(bold_path):
                pdfmetrics.registerFont(TTFont(name + "-Bold", bold_path))
            else:  # bold falls back to the regular weight
                pdfmetrics.registerFont(TTFont(name + "-Bold", reg_path))
            pdfmetrics.registerFontFamily(name, normal=name, bold=name + "-Bold",
                                          italic=name, boldItalic=name + "-Bold")
            _registered.add(name)
        except Exception:  # pragma: no cover - corrupt/missing font file
            continue

    if "NotoDeva" in _registered:
        BASE_FONT, BASE_BOLD = "NotoDeva", "NotoDeva-Bold"
    return BASE_FONT != "Helvetica"


def _font_for_char(ch: str) -> str | None:
    cp = ord(ch)
    for lo, hi, name in _SCRIPT_RANGES:
        if lo <= cp <= hi:
            return name if name in _registered else None
    return None


def markup(text, bold: bool = False) -> str:
    """XML-escape ``text`` and wrap non-base-script runs in <font> tags.

    Use for every value that originates from a beneficiary (names, occupations,
    free-text answers) before putting it inside a Paragraph.
    """
    s = "" if text is None else str(text)
    if not s:
        return ""
    register_fonts()

    base = BASE_FONT if not bold else BASE_BOLD
    out, run, run_font = [], [], None

    def flush():
        if not run:
            return
        chunk = escape("".join(run))
        # The base font already covers Latin + Devanagari; only switch when the
        # run needs a different script face.
        if run_font and run_font != ("NotoDeva" if base.startswith("NotoDeva") else None):
            face = run_font + ("-Bold" if bold else "")
            out.append(f'<font name="{face}">{chunk}</font>')
        else:
            out.append(chunk)
        run.clear()

    for ch in s:
        font = _font_for_char(ch)
        if ch.isspace():          # keep whitespace in the current run
            run.append(ch)
            continue
        if font != run_font:
            flush()
            run_font = font
        run.append(ch)
    flush()
    return "".join(out)


def can_render(text) -> bool:
    """True when every character of ``text`` has a glyph in a registered font."""
    register_fonts()
    if BASE_FONT == "Helvetica":
        return all(ord(c) < 256 for c in str(text or ""))
    return True


# Register at import time so modules doing ``from services.pdf_fonts import
# BASE_FONT`` capture the Unicode face rather than the Helvetica placeholder.
register_fonts()
