"""Optional Twilio-compatible inbound IVR webhook.

Configure a provider to POST to /api/twilio/twiml after placing this prototype
behind HTTPS. The browser IVR screen is the no-account demo fallback.
"""
from __future__ import annotations

from xml.sax.saxutils import escape
from fastapi import APIRouter, Request
from fastapi.responses import Response

router = APIRouter()


@router.post("/twiml")
async def twiml(request: Request) -> Response:
    form = await request.form()
    speech = (form.get("SpeechResult") or "").strip()
    if not speech:
        text = "Namaste. Yeh JeevikaSetu ka prototype IVR demo hai. Kripya Hindi mein apna naam boliye."
    else:
        text = "Dhanyavaad. Prototype mein aapka jawab mila. Poora livelihood interview JeevikaSetu web dashboard par dikhaya ja sakta hai."
    xml = f'<?xml version="1.0" encoding="UTF-8"?><Response><Gather input="speech" language="hi-IN" timeout="5" speechTimeout="auto"><Say voice="Polly.Aditi" language="hi-IN">{escape(text)}</Say></Gather></Response>'
    return Response(content=xml, media_type="application/xml")
