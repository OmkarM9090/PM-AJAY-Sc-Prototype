# Bundled fonts

The Noto Sans faces in this folder are used by `routers/report.py` (via
`services/pdf_fonts.py`) so that the generated PDF report can display
beneficiary names and free-text answers in Devanagari, Tamil, Telugu and
Bengali. ReportLab's built-in fonts are Latin-1 only.

| File | Script | Languages in JeevikaSetu |
|---|---|---|
| NotoSansDevanagari_400Regular / _700Bold | Devanagari (+ Latin) | Hindi, Marathi, English labels |
| NotoSansTamil_400Regular / _700Bold | Tamil | Tamil |
| NotoSansTelugu_400Regular / _700Bold | Telugu | Telugu |
| NotoSansBengali_400Regular / _700Bold | Bengali | Bengali |

Copyright the Noto Project Authors (https://github.com/notofonts).
Licensed under the SIL Open Font License, Version 1.1 —
https://openfontlicense.org

Note: ReportLab does not perform complex-script shaping, so conjuncts and
vowel signs are drawn in logical order. Names and short phrases are legible;
the on-screen UI (which uses the browser's own text shaping) remains the
canonical rendering.
