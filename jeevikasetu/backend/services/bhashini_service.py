"""
Bhashini (ULCA) adapter — the Government of India language stack.

Why this exists: for a MoSJE deployment, Indian-language speech should run on
Bhashini rather than a foreign API. This adapter implements the real ULCA
two-step flow (pipeline config → compute) behind the same interface as the
OpenAI services, so the resolution order becomes:

    Bhashini  →  OpenAI  →  browser Web Speech API

Set these to activate it (nothing else changes anywhere in the codebase):

    BHASHINI_USER_ID, BHASHINI_API_KEY, BHASHINI_PIPELINE_ID
    (optional) BHASHINI_AUTH_TOKEN, BHASHINI_CONFIG_URL

With no credentials every function returns None and the caller falls through —
which is exactly how the prototype stays runnable with zero keys.
"""

import base64
import logging
import os
from functools import lru_cache

import httpx

log = logging.getLogger("jeevikasetu.bhashini")

CONFIG_URL = os.getenv(
    "BHASHINI_CONFIG_URL",
    "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline",
)
USER_ID = os.getenv("BHASHINI_USER_ID", "").strip()
API_KEY = os.getenv("BHASHINI_API_KEY", "").strip()
PIPELINE_ID = os.getenv("BHASHINI_PIPELINE_ID", "64392f96daac500b55c543cd").strip()
AUTH_TOKEN = os.getenv("BHASHINI_AUTH_TOKEN", "").strip()

TIMEOUT = httpx.Timeout(40.0, connect=10.0)

# Bhashini speaks ISO-639-1 codes; ours already match.
SUPPORTED = {"hi", "en", "mr", "ta", "te", "bn", "kn", "ml", "gu", "pa", "or", "as"}


def available() -> bool:
    return bool(USER_ID and API_KEY)


@lru_cache(maxsize=8)
def _pipeline(task: str, source: str, target: str = ""):
    """Resolve the ULCA service id + callback endpoint for a task."""
    if not available():
        return None
    languages = {"sourceLanguage": source}
    if target:
        languages["targetLanguage"] = target
    payload = {
        "pipelineTasks": [{"taskType": task, "config": {"language": languages}}],
        "pipelineRequestConfig": {"pipelineId": PIPELINE_ID},
    }
    try:
        with httpx.Client(timeout=TIMEOUT) as client:
            r = client.post(CONFIG_URL, json=payload,
                            headers={"userID": USER_ID, "ulcaApiKey": API_KEY})
            r.raise_for_status()
            body = r.json()
        config = body["pipelineResponseConfig"][0]["config"][0]
        endpoint = body["pipelineInferenceAPIEndPoint"]
        return {
            "service_id": config["serviceId"],
            "url": endpoint["callbackUrl"],
            "auth_key": endpoint["inferenceApiKey"]["name"],
            "auth_value": AUTH_TOKEN or endpoint["inferenceApiKey"]["value"],
        }
    except Exception as exc:  # pragma: no cover - network dependent
        log.warning("Bhashini pipeline config failed (%s/%s): %s", task, source, exc)
        return None


def _compute(pipe, task_config, payload):
    try:
        with httpx.Client(timeout=TIMEOUT) as client:
            r = client.post(
                pipe["url"],
                headers={pipe["auth_key"]: pipe["auth_value"], "Content-Type": "application/json"},
                json={"pipelineTasks": [task_config], "inputData": payload},
            )
            r.raise_for_status()
            return r.json()
    except Exception as exc:  # pragma: no cover
        log.warning("Bhashini compute failed: %s", exc)
        return None


def transcribe(audio_bytes: bytes, language: str = "hi"):
    """ASR. Returns {'text', 'language', 'engine'} or None."""
    if not available() or language not in SUPPORTED:
        return None
    pipe = _pipeline("asr", language)
    if not pipe:
        return None
    result = _compute(
        pipe,
        {"taskType": "asr",
         "config": {"language": {"sourceLanguage": language},
                    "serviceId": pipe["service_id"],
                    "audioFormat": "wav", "samplingRate": 16000}},
        {"audio": [{"audioContent": base64.b64encode(audio_bytes).decode("ascii")}]},
    )
    try:
        text = result["pipelineResponse"][0]["output"][0]["source"].strip()
        return {"text": text, "language": language, "engine": "bhashini-asr"} if text else None
    except Exception:
        return None


def synthesize(text: str, language: str = "hi", gender: str = "female"):
    """TTS. Returns base64 audio or None."""
    if not available() or language not in SUPPORTED:
        return None
    pipe = _pipeline("tts", language)
    if not pipe:
        return None
    result = _compute(
        pipe,
        {"taskType": "tts",
         "config": {"language": {"sourceLanguage": language},
                    "serviceId": pipe["service_id"], "gender": gender}},
        {"input": [{"source": text}]},
    )
    try:
        return result["pipelineResponse"][0]["audio"][0]["audioContent"]
    except Exception:
        return None


def translate(text: str, source: str, target: str = "en"):
    """NMT — used when the engine needs English internally but the user spoke
    a regional language (e.g. skill extraction on a Tamil transcript)."""
    if not available() or source == target or source not in SUPPORTED:
        return None
    pipe = _pipeline("translation", source, target)
    if not pipe:
        return None
    result = _compute(
        pipe,
        {"taskType": "translation",
         "config": {"language": {"sourceLanguage": source, "targetLanguage": target},
                    "serviceId": pipe["service_id"]}},
        {"input": [{"source": text}]},
    )
    try:
        return result["pipelineResponse"][0]["output"][0]["target"].strip()
    except Exception:
        return None


def status():
    return {
        "configured": available(),
        "pipeline_id": PIPELINE_ID if available() else None,
        "supported_languages": sorted(SUPPORTED) if available() else [],
    }
