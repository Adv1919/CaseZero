from pydantic import BaseModel
from typing import Optional
from fastapi import APIRouter, status
from api.models import Suspect
from api.deps import db_dependency, user_dependency

router = APIRouter(
    prefix='/suspects',
    tags=['suspects']
)

class SuspectBase(BaseModel):
    name: str
    description: str
    alibi: str
    threat_level: int

class SuspectCreate(SuspectBase):
    pass

@router.get('/')
def get_suspects(db: db_dependency, user: user_dependency):
    return db.query(Suspect).filter(Suspect.user_id == user.get('id')).all()

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_suspect(db: db_dependency, user: user_dependency, suspect: SuspectCreate):
    db_suspect = Suspect(**suspect.model_dump(), user_id=user.get('id'))
    db.add(db_suspect)
    db.commit()
    db.refresh(db_suspect)
    return db_suspect