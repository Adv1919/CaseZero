from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    theme = Column(String)  # e.g., "Cyberpunk", "1920s Noir"
    backstory = Column(Text) # The crime scene description
    is_solved = Column(Integer, default=0) # 0 for false, 1 for true

    # Relationships to child tables
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
    
    # NEW: The AI decides who did it, but the frontend never sees this until the end!
    is_guilty = Column(Integer, default=0) 

    linked_case = relationship("Case", back_populates="suspects")

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    name = Column(String)
    description = Column(Text)
    
    linked_case = relationship("Case", back_populates="evidence")