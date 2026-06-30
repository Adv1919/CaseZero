from pydantic import BaseModel
from typing import List, Optional
from fastapi import APIRouter
from sqlalchemy.orm import joinedload
from api.models import Suspect, Evidence
from api.deps import db_dependency, user_dependency

router = APIRouter(
    prefix='/evidence',
    tags=['evidence']
)

class EvidenceBase(BaseModel):
    name: str
    description: str
    found_location: str

class EvidenceCreate(EvidenceBase):
    suspects: List[int] = [] 

@router.get("/")
def get_evidence(db: db_dependency, user: user_dependency):
    return db.query(Evidence).options(joinedload(Evidence.suspects)).filter(Evidence.user_id == user.get('id')).all()

@router.post("/")
def create_evidence(db: db_dependency, user: user_dependency, evidence: EvidenceCreate):
    db_evidence = Evidence(
        name=evidence.name, 
        description=evidence.description, 
        found_location=evidence.found_location,
        user_id=user.get('id')
    )
    
    for suspect_id in evidence.suspects:
        suspect = db.query(Suspect).filter(Suspect.id == suspect_id).first()
        if suspect:
            db_evidence.suspects.append(suspect)
            
    db.add(db_evidence)
    db.commit()
    db.refresh(db_evidence)
    
    return db.query(Evidence).options(joinedload(Evidence.suspects)).filter(Evidence.id == db_evidence.id).first()