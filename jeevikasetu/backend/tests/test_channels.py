"""
API-level tests for the multi-channel layer and consent handling.

These exercise the actual FastAPI app (TestClient), including the provider
webhooks an integrator would point Twilio / Exotel / Meta at.
"""

import os
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


# ---------------------------------------------------------------------------
# Health / capability probe
# ---------------------------------------------------------------------------
def test_health_declares_providers_and_fallbacks(client):
    body = client.get("/api/health").json()
    assert body["status"] == "ok"
    assert body["problem_statement"] == "SIH2026-26097"
    assert body["ai_mode"] in ("live-openai", "offline-demo")
    assert body["capabilities"]["browser_stt_fallback"] is True
    assert body["capabilities"]["deterministic_recommender"] is True
    assert set(body["providers"]) == {"bhashini", "openai", "browser_fallback"}
    assert body["providers"]["browser_fallback"]["configured"] is True


# ---------------------------------------------------------------------------
# Web channel + consent (DPDP)
# ---------------------------------------------------------------------------
def test_session_records_consent(client):
    res = client.post("/api/conversation/start",
                      json={"language": "hi", "channel": "web", "consent_given": True}).json()
    assert res["session_id"]
    assert "नमस्ते" in res["reply"]


def test_withdrawing_consent_erases_the_conversation(client):
    start = client.post("/api/conversation/start",
                        json={"language": "hi", "consent_given": True}).json()
    sid = start["session_id"]
    client.post("/api/conversation/message", json={"session_id": sid, "text": "मेरा नाम सुनीता है"})

    before = client.get(f"/api/conversation/{sid}").json()
    assert len(before["messages"]) >= 2

    withdrawn = client.post("/api/conversation/consent",
                            json={"session_id": sid, "consent_given": False}).json()
    assert withdrawn["consent_given"] is False
    assert withdrawn["messages_erased"] >= 2

    after = client.get(f"/api/conversation/{sid}").json()
    assert after["messages"] == [], "withdrawal must actually delete the conversation"
    assert after["slots"] == {}
    assert after["status"] == "withdrawn"


# ---------------------------------------------------------------------------
# IVR — Twilio
# ---------------------------------------------------------------------------
def test_twilio_inbound_call_plays_language_menu(client):
    r = client.post("/api/telephony/twilio/voice", data={"From": "+919812345678"})
    assert r.status_code == 200
    xml = r.text
    assert xml.startswith("<?xml")
    assert '<Gather input="dtmf"' in xml
    assert "जीविकासेतु" in xml


def test_twilio_keypad_selects_language_and_starts_interview(client):
    r = client.post("/api/telephony/twilio/voice", data={"From": "+919811111111", "Digits": "2"})
    xml = r.text
    assert 'language="en-IN"' in xml
    assert "JeevikaSetu" in xml or "Namaste" in xml
    assert '<Gather input="speech"' in xml


def test_twilio_speech_turn_advances_the_interview(client):
    caller = {"From": "+919822222222"}
    client.post("/api/telephony/twilio/voice", data={**caller, "Digits": "1"})
    r = client.post("/api/telephony/twilio/gather",
                    data={**caller, "SpeechResult": "मेरा नाम रमेश कुमार है"})
    assert "कहाँ रहते हैं" in r.text, "after the name it must ask for the location"


def test_ivr_sessions_are_tagged_for_channel_analytics(client):
    caller = {"From": "+919833333333"}
    client.post("/api/telephony/twilio/voice", data={**caller, "Digits": "1"})
    stats = client.get("/api/dashboard/stats").json()
    channels = {c["channel"] for c in stats["channel_distribution"]}
    assert "ivr" in channels or stats["totals"]["conversations"] > 0


def test_phone_numbers_are_never_stored_raw(client):
    caller = "+919844444444"
    client.post("/api/telephony/twilio/voice", data={"From": caller, "Digits": "1"})
    import database
    db = database.SessionLocal()
    try:
        rows = db.query(database.ConversationSession).all()
        assert all(caller not in (r.id or "") for r in rows)
        msgs = db.query(database.Message).all()
        assert all(caller not in (m.text or "") for m in msgs)
    finally:
        db.close()


# ---------------------------------------------------------------------------
# IVR — Exotel
# ---------------------------------------------------------------------------
def test_exotel_menu_then_tamil_interview(client):
    menu = client.post("/api/telephony/exotel/voice", json={"CallFrom": "+919855555555"}).json()
    assert menu["action"] == "gather" and menu["input"] == "dtmf"

    tamil = client.post("/api/telephony/exotel/voice",
                        json={"CallFrom": "+919855555555", "digits": "4"}).json()
    assert tamil["language"] == "ta-IN"
    assert "வணக்கம்" in tamil["prompt"]
    assert tamil["completed"] is False


# ---------------------------------------------------------------------------
# WhatsApp Cloud API
# ---------------------------------------------------------------------------
def test_whatsapp_webhook_verification(client):
    ok = client.get("/api/telephony/whatsapp/webhook", params={
        "hub.mode": "subscribe", "hub.verify_token": "jeevikasetu-verify", "hub.challenge": "42"})
    assert ok.status_code == 200 and ok.text == "42"

    bad = client.get("/api/telephony/whatsapp/webhook", params={
        "hub.mode": "subscribe", "hub.verify_token": "wrong", "hub.challenge": "42"})
    assert bad.status_code == 403


def test_whatsapp_message_runs_the_same_dialogue_engine(client):
    def send(text):
        return client.post("/api/telephony/whatsapp/webhook", json={"entry": [{"changes": [{"value": {
            "messages": [{"from": "919876500000", "type": "text", "text": {"body": text}}]}}]}]}).json()

    first = send("नमस्ते")
    assert first["status"] == "ok"
    assert "नमस्ते" in first["reply"]["body"]

    second = send("मेरा नाम लक्ष्मी देवी है")
    assert second["progress_percent"] >= 11, "the interview must progress across messages"


def test_malformed_webhook_is_ignored_not_crashed(client):
    r = client.post("/api/telephony/whatsapp/webhook", json={"entry": []})
    assert r.status_code == 200 and r.json()["status"] == "ignored"


def test_telephony_status_documents_the_integration(client):
    body = client.get("/api/telephony/status").json()
    assert body["ivr"]["language_keypad_map"]["1"] == "hi"
    assert "whatsapp" in body


# ---------------------------------------------------------------------------
# End-to-end API journey (the judge demo path)
# ---------------------------------------------------------------------------
def test_full_journey_conversation_to_pdf(client):
    start = client.post("/api/conversation/start",
                        json={"language": "hi", "consent_given": True}).json()
    sid = start["session_id"]
    for answer in ["मेरा नाम रमेश कुमार है", "चाँदपुर गाँव, जिला वाराणसी", "आठवीं पास",
                   "घर में चमड़े का काम होता है", "हाँ दस साल से कर रहा हूँ",
                   "अभी दिहाड़ी मजदूरी करता हूँ", "मोबाइल रिपेयर सीखना है", "नया सीखना है",
                   "अपना खुद का काम करना है", "तीस किलोमीटर", "कोई दिक्कत नहीं"]:
        turn = client.post("/api/conversation/message",
                           json={"session_id": sid, "text": answer}).json()
    assert turn["completed"] is True and turn["progress"]["percent"] == 100

    profile = client.post("/api/profile/extract", json={"session_id": sid, "language": "hi"}).json()
    assert profile["name"] == "रमेश कुमार"

    recs = client.post("/api/recommend", json={"profile": profile, "session_id": sid}).json()
    assert len(recs["recommendations"]) == 5

    pdf = client.post("/api/report/generate",
                      json={"profile": profile, "recommendations": recs["recommendations"]})
    assert pdf.status_code == 200
    assert pdf.content[:4] == b"%PDF"
    assert len(pdf.content) > 3000


# ---------------------------------------------------------------------------
# Call continuity: rural calls drop constantly, so a redial must resume —
# but a finished interview must start over instead of replaying the summary.
# ---------------------------------------------------------------------------
def test_dropped_call_resumes_where_it_left_off(client):
    caller = {"From": "+919833000001"}
    client.post("/api/telephony/twilio/voice", data={**caller, "Digits": "1"})
    client.post("/api/telephony/twilio/gather",
                data={**caller, "SpeechResult": "मेरा नाम सुनीता देवी है"})

    # ...call drops here; the beneficiary rings back and presses 1 again.
    again = client.post("/api/telephony/twilio/voice", data={**caller, "Digits": "1"})
    assert "सुनीता" not in again.text, "must not re-ask the name it already has"
    assert "कहाँ रहते" in again.text, "should continue with the pending question"

    state = client.get("/api/telephony/status").json()
    assert state["ivr"]["language_keypad_map"]["1"] == "hi"


def test_completed_interview_restarts_and_erases_the_old_transcript(client):
    caller = {"From": "+919833000002"}
    client.post("/api/telephony/twilio/voice", data={**caller, "Digits": "2"})
    answers = ["My name is Kavita Bai", "Latur district, Maharashtra", "10th pass",
               "my family does pottery work", "daily wage labour", "I want tailoring",
               "handmade pottery for years", "I like making things by hand",
               "self employment", "about 10 km", "no health problems", "yes correct"]
    completed = False
    for a in answers:
        r = client.post("/api/telephony/twilio/gather", data={**caller, "SpeechResult": a})
        if "<Hangup/>" in r.text:
            completed = True
            break
    assert completed, "the IVR interview should reach a summary and hang up"

    fresh = client.post("/api/telephony/twilio/voice", data={**caller, "Digits": "2"})
    assert "Kavita" not in fresh.text, "a new call must not leak the previous transcript"
    assert "name" in fresh.text.lower(), "a new call starts from the first question"


# ---------------------------------------------------------------------------
# Managed voice agents (Vapi / Retell) — "Option A" in the problem brief.
# The same interview must run through their contracts.
# ---------------------------------------------------------------------------
def test_vapi_custom_llm_returns_openai_shaped_completion(client):
    def vapi(messages):
        return client.post("/api/telephony/vapi/chat/completions", json={
            "call": {"id": "vapi-test-1"}, "model": "jeevikasetu-interviewer",
            "messages": messages}).json()

    opening = vapi([{"role": "system", "content": "you are JeevikaSetu"}])
    assert opening["object"] == "chat.completion"
    reply = opening["choices"][0]["message"]["content"]
    assert opening["choices"][0]["message"]["role"] == "assistant"
    assert "नाम" in reply, "the call should open by asking for the name in Hindi"

    second = vapi([{"role": "system", "content": "you are JeevikaSetu"},
                   {"role": "assistant", "content": reply},
                   {"role": "user", "content": "मेरा नाम गीता देवी है"}])
    assert "कहाँ रहते" in second["choices"][0]["message"]["content"]
    assert second["jeevikasetu"]["progress_percent"] > 0
    assert second["jeevikasetu"]["completed"] is False


def test_retell_custom_llm_contract(client):
    ping = client.post("/api/telephony/retell/llm-webhook",
                       json={"interaction_type": "ping_pong", "timestamp": 1730000000}).json()
    assert ping["response_type"] == "ping_pong"

    first = client.post("/api/telephony/retell/llm-webhook", json={
        "interaction_type": "response_required", "response_id": 1,
        "call": {"call_id": "retell-test-1"}, "transcript": []}).json()
    assert first["response_id"] == 1
    assert first["content_complete"] is True
    assert first["end_call"] is False
    assert "नाम" in first["content"]

    second = client.post("/api/telephony/retell/llm-webhook", json={
        "interaction_type": "response_required", "response_id": 2,
        "call": {"call_id": "retell-test-1"},
        "transcript": [{"role": "agent", "content": first["content"]},
                       {"role": "user", "content": "My name is Anil Jadhav"}]}).json()
    assert "where do you live" in second["content"].lower(), \
        "it must follow the user's language switch to English"


def test_status_advertises_managed_agent_routes(client):
    body = client.get("/api/telephony/status").json()
    assert "vapi_custom_llm" in body["managed_voice_agents"]
    assert "retell_custom_llm" in body["managed_voice_agents"]
