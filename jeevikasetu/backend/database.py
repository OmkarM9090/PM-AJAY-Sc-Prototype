"""SQLite persistence layer (schema is PostgreSQL-compatible).

Switch to Postgres by setting JS_DATABASE_URL=postgresql://user:pass@host/db
— no model changes required.
"""

import datetime as dt
import json

from sqlalchemy import (Boolean, Column, DateTime, Float, ForeignKey, Integer,
                        String, Text, create_engine)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

from config import DATABASE_URL

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def _now():
    return dt.datetime.utcnow()


class JSONColumn(Text):
    """Text column that stores JSON (portable across SQLite/Postgres)."""


def dumps(value):
    return json.dumps(value, ensure_ascii=False)


def loads(value, default=None):
    if not value:
        return default
    try:
        return json.loads(value)
    except Exception:
        return default


class ConversationSession(Base):
    __tablename__ = "conversation_sessions"

    id = Column(String(40), primary_key=True)
    channel = Column(String(20), default="web")          # web | ivr | whatsapp
    language = Column(String(8), default="hi")
    status = Column(String(20), default="active")        # active | completed
    demo_mode = Column(Boolean, default=False)
    # DPDP Act 2023: consent is recorded per session, with what was agreed to.
    consent_given = Column(Boolean, default=False)
    consent_scope = Column(String(120), default="")
    consent_at = Column(DateTime, nullable=True)
    slots_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    messages = relationship("Message", back_populates="session",
                            cascade="all, delete-orphan", order_by="Message.id")
    profile = relationship("BeneficiaryProfile", back_populates="session",
                           uselist=False, cascade="all, delete-orphan")

    @property
    def slots(self):
        return loads(self.slots_json, {}) or {}


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(40), ForeignKey("conversation_sessions.id"))
    speaker = Column(String(10))        # user | assistant
    text = Column(Text)
    language = Column(String(8), default="hi")
    slot = Column(String(40), nullable=True)   # which interview slot this turn targeted
    created_at = Column(DateTime, default=_now)

    session = relationship("ConversationSession", back_populates="messages")


class BeneficiaryProfile(Base):
    __tablename__ = "beneficiary_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(40), ForeignKey("conversation_sessions.id"))
    name = Column(String(120))
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    village = Column(String(120))
    district = Column(String(120))
    state = Column(String(120))
    education = Column(String(80))
    category = Column(String(20), default="SC")
    family_occupation = Column(Text)
    current_livelihood = Column(Text)
    identified_skills_json = Column(Text, default="[]")
    interests_json = Column(Text, default="[]")
    employment_preference = Column(String(40))
    mobility_range_km = Column(Float, default=10)
    physical_constraints = Column(Text)
    languages_json = Column(Text, default="[]")
    channel = Column(String(20), default="web")
    created_at = Column(DateTime, default=_now)

    session = relationship("ConversationSession", back_populates="profile")

    def to_dict(self):
        return {
            "profile_id": self.id,
            "session_id": self.session_id,
            "name": self.name,
            "age": self.age,
            "gender": self.gender,
            "location": {"village": self.village, "district": self.district, "state": self.state},
            "education": self.education,
            "category": self.category,
            "family_occupation": self.family_occupation,
            "current_livelihood": self.current_livelihood,
            "identified_skills": loads(self.identified_skills_json, []),
            "interests": loads(self.interests_json, []),
            "employment_preference": self.employment_preference,
            "mobility_range_km": self.mobility_range_km,
            "physical_constraints": self.physical_constraints,
            "languages_spoken": loads(self.languages_json, []),
            "channel": self.channel,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class RecommendationRecord(Base):
    """Stored recommendation runs — powers the admin dashboard analytics."""

    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(40), index=True)
    profile_name = Column(String(120))
    district = Column(String(120))
    state = Column(String(120))
    qp_code = Column(String(40))
    qp_name = Column(String(160))
    sector = Column(String(80))
    rank = Column(Integer)
    score = Column(Float)
    skill_match_pct = Column(Float)
    rpl_eligible = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_now)


def _ensure_columns():
    """Tiny forward-migration for SQLite demo databases created by an older
    build (Base.metadata.create_all never adds columns to existing tables)."""
    if not DATABASE_URL.startswith("sqlite"):
        return
    from sqlalchemy import text
    wanted = {
        "consent_given": "BOOLEAN DEFAULT 0",
        "consent_scope": "VARCHAR(120) DEFAULT ''",
        "consent_at": "DATETIME",
    }
    with engine.begin() as conn:
        existing = {row[1] for row in conn.execute(text("PRAGMA table_info(conversation_sessions)"))}
        if not existing:
            return
        for column, ddl in wanted.items():
            if column not in existing:
                conn.execute(text(f"ALTER TABLE conversation_sessions ADD COLUMN {column} {ddl}"))


def init_db():
    Base.metadata.create_all(bind=engine)
    _ensure_columns()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
