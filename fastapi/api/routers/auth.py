from datetime import timedelta, datetime, timezone
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt
from dotenv import load_dotenv
import os
from deps import db_dependency, bcrypt_context, get_current_user
from models import User

load_dotenv()

router = APIRouter(
    prefix='/auth',
    tags=['auth']
)

SECRET_KEY = os.getenv("AUTH_SECRET_KEY")
ALGORITHM = os.getenv("AUTH_ALGORITHM")

class UserCreateRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    detective_name: str | None = None
    avatar_id: str | None = None
    profile_complete: int


def authenticate_user(username: str, password: str, db):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return False
    if not bcrypt_context.verify(password, user.hashed_password):
        return False
    return user

def create_access_token(username: str, user_id: int, expires_delta: timedelta):
    encode = {'sub': username, 'id': user_id}
    expires = datetime.now(timezone.utc) + expires_delta
    encode.update({'exp': expires})
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_user(db: db_dependency, create_user_request: UserCreateRequest):
    existing = db.query(User).filter(User.username == create_user_request.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken.")
    create_user_model = User(
        username=create_user_request.username,
        hashed_password=bcrypt_context.hash(create_user_request.password)
    )
    db.add(create_user_model)
    db.commit()

@router.post('/token', response_model=Token)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: db_dependency):
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate user")
    token = create_access_token(user.username, user.id, timedelta(hours=12))

    return {
        'access_token': token,
        'token_type': 'bearer',
        'detective_name': user.detective_name,
        'avatar_id': user.avatar_id,
        'profile_complete': user.profile_complete
    }

class ProfileUpdateRequest(BaseModel):
    detective_name: str
    avatar_id: str

@router.patch("/profile")
async def update_profile(
    request: ProfileUpdateRequest,
    db: db_dependency,
    current_user: dict = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == current_user['id']).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.detective_name = request.detective_name
    user.avatar_id = request.avatar_id
    user.profile_complete = 1
    db.commit()
    return {
        "detective_name": user.detective_name,
        "avatar_id": user.avatar_id,
        "profile_complete": user.profile_complete
    }

@router.get("/me")
async def get_me(db: db_dependency, current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.id == current_user['id']).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "username": user.username,
        "detective_name": user.detective_name,
        "avatar_id": user.avatar_id,
        "profile_complete": user.profile_complete,
        "rating": user.rating,
        "cases_solved": user.cases_solved,
        "cases_failed": user.cases_failed
    }