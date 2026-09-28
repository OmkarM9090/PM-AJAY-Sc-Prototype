"""Beneficiary recommendation report (PDF via ReportLab)."""

import io
from datetime import datetime

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (Paragraph, SimpleDocTemplate, Spacer, Table,
                                TableStyle)

router = APIRouter(prefix="/api/report", tags=["report"])

NAVY = colors.HexColor("#1a237e")
SAFFRON = colors.HexColor("#FF9933")
GREEN = colors.HexColor("#138808")


class ReportRequest(BaseModel):
    profile: dict
    recommendations: list = []


@router.post("/generate")
def generate(req: ReportRequest):
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=18 * mm, bottomMargin=16 * mm,
                            leftMargin=16 * mm, rightMargin=16 * mm,
                            title="JeevikaSetu Livelihood Recommendation Report")
    ss = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=ss["Title"], textColor=NAVY, fontSize=18, spaceAfter=4)
    sub = ParagraphStyle("sub", parent=ss["Normal"], fontSize=9, textColor=colors.grey)
    h2 = ParagraphStyle("h2", parent=ss["Heading2"], textColor=NAVY, fontSize=12, spaceBefore=10)
    body = ParagraphStyle("body", parent=ss["Normal"], fontSize=9, leading=13)

    p = req.profile or {}
    loc = p.get("location") or {}
    story = [
        Paragraph("JeevikaSetu — Livelihood &amp; Skilling Recommendation Report", h1),
        Paragraph("PM-AJAY (Grants-in-Aid component) | Ministry of Social Justice &amp; Empowerment | "
                  f"Generated {datetime.now().strftime('%d %b %Y, %I:%M %p')}", sub),
        Spacer(1, 8),
        Paragraph("Beneficiary Profile", h2),
    ]

    prof_rows = [
        ["Name", p.get("name", "—"), "Category", p.get("category", "SC")],
        ["Village / District", f"{loc.get('village', '—')} / {loc.get('district', '—')}",
         "State", loc.get("state", "—")],
        ["Education", p.get("education", "—"), "Age", str(p.get("age") or "—")],
        ["Family occupation", p.get("family_occupation", "—")[:48], "Current work",
         (p.get("current_livelihood") or "—")[:48]],
        ["Preference", p.get("employment_preference", "—"), "Mobility",
         f"{p.get('mobility_range_km', '—')} km"],
        ["Languages", ", ".join(p.get("languages_spoken", [])) or "—", "Constraints",
         (p.get("physical_constraints") or "none")[:40]],
    ]
    t = Table(prof_rows, colWidths=[32 * mm, 55 * mm, 28 * mm, 53 * mm])
    t.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("TEXTCOLOR", (0, 0), (0, -1), NAVY),
        ("TEXTCOLOR", (2, 0), (2, -1), NAVY),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#eef1fa")),
        ("BACKGROUND", (2, 0), (2, -1), colors.HexColor("#eef1fa")),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#c5cae9")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5), ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story += [t, Spacer(1, 6)]
    story.append(Paragraph("<b>Identified skills (incl. informal / traditional):</b> "
                           + ", ".join(p.get("identified_skills", [])) or "—", body))
    story.append(Paragraph("<b>Interests / aspirations:</b> " + ", ".join(map(str, p.get("interests", []))), body))

    story.append(Paragraph("Recommended NSQF Pathways", h2))
    for rec in (req.recommendations or [])[:5]:
        centre = rec.get("nearest_center") or {}
        gia = ", ".join(b["name"] for b in rec.get("gia_benefits", [])) or "—"
        rows = [[Paragraph(f"<b>{rec.get('rank', '')}. {rec.get('qp_name')}</b> "
                           f"({rec.get('qp_code')}, NSQF L{rec.get('nsqf_level')})", body),
                 Paragraph(f"<b>Match {rec.get('skill_match_pct')}%</b>"
                           + ("  |  <font color='#138808'><b>RPL ELIGIBLE</b></font>"
                              if rec.get("rpl_eligible") else ""), body)],
                [Paragraph(f"Pathway: {rec.get('pathway_label')}<br/>"
                           f"Training: {rec.get('training_duration_label')} "
                           f"({rec.get('training_hours')} hrs) | Income: Rs. {rec.get('income_range')}/month<br/>"
                           f"Centre: {centre.get('name', '—')} ({centre.get('distance_km', '—')} km)<br/>"
                           f"Skill gaps: {', '.join(rec.get('skill_gaps', [])[:5]) or 'none'}<br/>"
                           f"GIA support: {gia}", body), ""]]
        rt = Table(rows, colWidths=[118 * mm, 50 * mm])
        rt.setStyle(TableStyle([
            ("SPAN", (0, 1), (1, 1)),
            ("BOX", (0, 0), (-1, -1), 0.6, NAVY),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eef1fa")),
            ("LINEBELOW", (0, 0), (-1, 0), 0.4, SAFFRON),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6), ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story += [rt, Spacer(1, 6)]

    story += [Spacer(1, 6),
              Paragraph("This report is generated by the JeevikaSetu prototype (SIH 2026, PS 26097). "
                        "Qualification packs, benefit amounts and centre data are indicative "
                        "demonstration values.", sub)]
    doc.build(story)
    buf.seek(0)
    filename = f"JeevikaSetu_{(p.get('name') or 'beneficiary').replace(' ', '_')}.pdf"
    return StreamingResponse(buf, media_type="application/pdf",
                             headers={"Content-Disposition": f'attachment; filename="{filename}"'})
