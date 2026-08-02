from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base  

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    detective_name = Column(String, nullable=True)
    avatar_id = Column(String, nullable=True)
    profile_complete = Column(Integer, default=0)
    rating = Column(Integer, default=100)
    cases_solved = Column(Integer, default=0)
    cases_failed = Column(Integer, default=0)

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    theme = Column(String)
    backstory = Column(Text)
    is_solved = Column(Integer, default=0)
    cover_image_url = Column(String, nullable=True)

    suspects = relationship("Suspect", back_populates="linked_case", cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="linked_case", cascade="all, delete-orphan")

class Suspect(Base):
    __tablename__ = "suspects"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    name = Column(String, index=True)
    description = Column(Text)
    alibi = Column(Text)
    threat_level = Column(Integer)
    
    # The AI decides who did it, but the frontend never sees this until the end!
    is_guilty = Column(Integer, default=0) 

    linked_case = relationship("Case", back_populates="suspects")

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    name = Column(String)
    description = Column(Text)
    cipher_word = Column(String)
    hint = Column(Text)

    linked_case = relationship("Case", back_populates="evidence")

# ==========================================
# NEW PERSISTENCE TABLES (Don't delete these!)
# ==========================================

class CaseProgress(Base):
    __tablename__ = "case_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    case_id = Column(Integer, index=True)
    evidence_id = Column(Integer)
    unlocked_at = Column(DateTime, default=datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    case_id = Column(Integer, index=True)
    suspect_id = Column(Integer, index=True)
    role = Column(String)  # Will store either 'user' or 'suspect'
    text = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class UserCaseStatus(Base):
    __tablename__ = "user_case_status"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    case_id = Column(Integer, index=True)
    accused_suspect_id = Column(Integer, nullable=True)
    success = Column(Boolean, default=False)
    wrong_attempts = Column(Integer, default=0)
    narrative = Column(Text)
    resolved_at = Column(DateTime, default=datetime.utcnow)