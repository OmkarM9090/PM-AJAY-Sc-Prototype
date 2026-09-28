"""Minimal SQLite repository for local prototype sessions.

Only the data required to continue a livelihood conversation is saved. No
Aadhaar, phone number or biometric identifier is collected by this prototype.
"""
from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).resolve().parents[1] / "jeevikasetu.db"


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialise() -> None:
    with _connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS jeevika_sessions (
                id TEXT PRIMARY KEY,
                channel TEXT NOT NULL,
                language TEXT NOT NULL,
                status TEXT NOT NULL,
                profile_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS jeevika_messages (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                speaker TEXT NOT NULL,
                text TEXT NOT NULL,
                language TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            """
        )


def default_profile(language: str = "hi") -> dict[str, Any]:
    return {
        "name": "",
        "age": None,
        "location": {"village": "", "district": "", "state": ""},
        "education": "",
        "category": "SC",
        "family_occupation": "",
        "current_livelihood": "",
        "identified_skills": [],
        "interests": [],
        "mobility_km": None,
        "physical_constraints": "",
        "employment_preference": "",
        "languages_spoken": [language_name(language)],
        "additional_notes": "",
        "consent_recording": False,
    }


def language_name(code: str) -> str:
    return {"hi": "Hindi", "en": "English", "mr": "Marathi", "ta": "Tamil", "te": "Telugu", "bn": "Bengali"}.get(code, "Hindi")


def create_session(channel: str, language: str, consent_recording: bool = False) -> dict[str, Any]:
    session_id = str(uuid.uuid4())
    profile = default_profile(language)
    profile["consent_recording"] = consent_recording
    timestamp = now()
    with _connection() as connection:
        connection.execute(
            "INSERT INTO jeevika_sessions VALUES (?, ?, ?, ?, ?, ?, ?)",
            (session_id, channel, language, "active", json.dumps(profile), timestamp, timestamp),
        )
    return get_session(session_id)  # type: ignore[return-value]


def get_session(session_id: str) -> dict[str, Any] | None:
    with _connection() as connection:
        row = connection.execute("SELECT * FROM jeevika_sessions WHERE id = ?", (session_id,)).fetchone()
        if not row:
            return None
        messages = connection.execute(
            "SELECT speaker, text, language, created_at FROM jeevika_messages WHERE session_id = ? ORDER BY created_at", (session_id,)
        ).fetchall()
    result = dict(row)
    result["profile"] = json.loads(result.pop("profile_json"))
    result["messages"] = [dict(message) for message in messages]
    return result


def save_profile(session_id: str, profile: dict[str, Any], status: str | None = None) -> None:
    with _connection() as connection:
        if status:
            connection.execute(
                "UPDATE jeevika_sessions SET profile_json = ?, status = ?, updated_at = ? WHERE id = ?",
                (json.dumps(profile), status, now(), session_id),
            )
        else:
            connection.execute(
                "UPDATE jeevika_sessions SET profile_json = ?, updated_at = ? WHERE id = ?",
                (json.dumps(profile), now(), session_id),
            )


def add_message(session_id: str, speaker: str, text: str, language: str) -> None:
    with _connection() as connection:
        connection.execute(
            "INSERT INTO jeevika_messages VALUES (?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), session_id, speaker, text, language, now()),
        )


def list_sessions(limit: int = 50) -> list[dict[str, Any]]:
    with _connection() as connection:
        rows = connection.execute(
            "SELECT id, channel, language, status, profile_json, created_at, updated_at FROM jeevika_sessions ORDER BY created_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
    output: list[dict[str, Any]] = []
    for row in rows:
        session = dict(row)
        profile = json.loads(session.pop("profile_json"))
        # The official prototype view is intentionally de-identified by default.
        output.append({
            "id": session["id"][:8],
            "channel": session["channel"],
            "language": session["language"],
            "status": session["status"],
            "district": profile.get("location", {}).get("district") or "Not captured",
            "skills": profile.get("identified_skills", [])[:3],
            "created_at": session["created_at"],
        })
    return output
