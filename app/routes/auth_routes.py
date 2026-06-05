from fastapi import APIRouter, Depends
from services  import auth_service
from typing import Annotated, Optional
from core.database import get_db
from sqlalchemy.orm import Session
from fastapi import HTTPException,status, Depends, OAuth2PasswordRequestForm
from core.security import oauth2_scheme

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/create")
def create(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    auth_service.create_user(email=form_data.username,password=form_data.password)
    return auth_service.login_for_refresh_token(email=form_data.username,password=form_data.password)

@router.post("/login")
def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    return auth_service.login_for_refresh_token(email=form_data.username,password=form_data.password)

@router.post("/renew")
def renew(token: Annotated[str, Depends(oauth2_scheme)]):
    return auth_service.renew_tokens(token=token)

@router.post("/logout")
def logout():
    auth_service.logging_out()