from fastapi import APIRouter, Depends
from services  import auth_service
from typing import Annotated, Optional
from core.database import get_db
from sqlalchemy.orm import Session
from fastapi import HTTPException,status, Depends, OAuth2PasswordRequestForm
from core.security import oauth2_scheme

router = APIRouter(prefix="/", tags=["auth"])

@router.post("/login")
def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(get_db)):
    return auth_service.login_for_refresh_token(email=form_data.username,password=form_data.password,db=db)

@router.post("/renew")
def renew(token: Annotated[str, Depends(oauth2_scheme)], db: Session=Depends(get_db)):
    return auth_service.renew_tokens(token=token,db=db)