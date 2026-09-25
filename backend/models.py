from sqlalchemy import Column, String, DateTime, JSON, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Session(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True, default=generate_uuid)
    channel = Column(String, default="web") # web or phone
    language = Column(String, default="hi")
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")
    profile = relationship("Profile", back_populates="session", uselist=False, cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("sessions.id"))
    speaker = Column(String) # user, agent, system
    text = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    session = relationship("Session", back_populates="messages")

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("sessions.id"), unique=True)
    education = Column(String, nullable=True)
    employment_preference = Column(String, nullable=True)
    skills = Column(JSON, default=list) # List of strings
    radius = Column(Float, nullable=True)
    location_name = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    
    session = relationship("Session", back_populates="profile")
