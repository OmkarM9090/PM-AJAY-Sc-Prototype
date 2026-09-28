"""Optional OpenAI adapter with a safe deterministic fallback.

The conversation controller keeps consent, turn order and profile persistence in
application code. This adapter improves warmth and code-mixed phrasing when an
OPENAI_API_KEY is configured; it never determines scheme eligibility.
"""
from __future__ import annotations

import os

try:
    from openai import OpenAI
except ImportError:  # pragma: no cover
    OpenAI = None  # type: ignore[misc,assignment]

MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")


def _client():
    api_key = os.getenv("OPENAI_API_KEY")
    return OpenAI(api_key=api_key) if api_key and OpenAI else None


def enabled() -> bool:
    return _client() is not None


def polish_turn(user_text: str, structured_reply: str, language: str) -> str:
    """Return a short natural reply while retaining the required next question.

    If the model/service fails, the structured reply is used. This guarantees a
    complete live demo even under low connectivity or quota issues.
    """
    client = _client()
    if not client:
        return structured_reply
    language_label = {"hi": "Hindi", "en": "English", "mr": "Marathi", "ta": "Tamil", "te": "Telugu", "bn": "Bengali"}.get(language, "Hindi")
    try:
        response = client.chat.completions.create(
            model=MODEL,
            temperature=0.35,
            max_tokens=150,
            messages=[
                {"role": "system", "content": "You are JeevikaSetu, a warm Government of India livelihood-prototype voice assistant. Respond in the requested language, respectfully and simply. Never promise jobs, benefits or eligibility. Give one very short acknowledgement followed by the exact required next question. Return only voice-ready text."},
                {"role": "user", "content": f"Beneficiary said: {user_text}\nRequested language: {language_label}\nRequired next question/reply (keep its meaning): {structured_reply}"},
            ],
        )
        content = response.choices[0].message.content
        return content.strip() if content and len(content.strip()) > 3 else structured_reply
    except Exception:
        return structured_reply
