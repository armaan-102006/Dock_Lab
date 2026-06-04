from core.security import create_access_token,create_refresh_token,verify_password,oauth2_scheme,ALGORITHM
from jwt.exceptions import InvalidTokenError
import jwt
from core.config import SECRET_KEY
from fastapi import HTTPException,status, Depends, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from core.database import get_db
from models.user import User
from schemas.user_schema import TokenData
from datetime import timedelta
from typing import Annotated, Optional

def create_user(email,password,db):#integrate database
    if email in db:
        return "Email already present"
    else:
        "save new user to database"

def get_user(email: str, db: Session) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def authenticate_user(email:str, password:str, db: Session ):
    user=get_user(email,db)
    print(f"Authenticating user: {email}, user found: {bool(user)}")
    if user:
        password_valid = verify_password(password,user.hashed_password)
        print(f"Password verification result: {password_valid}")
        if password_valid:
            return user
    return None

def login_for_refresh_token(email,password,db):
    user = authenticate_user(email, password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    refresh_token_expires= timedelta(days=30)
    refresh_token,jti=create_refresh_token(
        data={"sub": user.email}, expires_delta=refresh_token_expires
    )
    db.query(User).filter_by(email=user.email).update({User.jti : jti})
    db.commit()
    access_token_expires= timedelta(minutes=15)
    access_token=create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    user.disabled=False
    return  {
  "access_token": access_token,
  "refresh_token": refresh_token,
  "token_type": "bearer"
}

def renew_tokens(token, db):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email=payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
        jti_token=payload.get('jti')
        jti_data=user.jti
        type_token=payload.get('type')
        if type_token == 'refresh' and jti_token==jti_data :
                user = get_user(email, db=db)
                if not user:
                    raise credentials_exception
                refresh_token_expires= timedelta(days=30)
                refresh_token,jti=create_refresh_token(
                    data={"sub": user.email}, expires_delta=refresh_token_expires
                )           
                db.query(User).filter_by(email=user.email).update({User.jti : jti})
                db.commit()
                access_token_expires = timedelta(minutes=15)
                access_token = create_access_token(
                data={"sub": email}, expires_delta=access_token_expires
            )   
                return  {
  "access_token": access_token,
  "refresh_token": refresh_token,
  "token_type": "bearer"
}
    except InvalidTokenError:
        raise credentials_exception


def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session=Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print("JWT payload:", payload)
        email = payload.get("sub")
        type_token=payload.get('type')
        if email is None:
            raise credentials_exception

    except InvalidTokenError:
        raise credentials_exception
    
    if type_token=="access":
        user = get_user(email=email, db=db)
        print("DB lookup for email:", email, "->", bool(user))
        if user is None:
            raise credentials_exception
        return user
    else:
         raise credentials_exception

def get_current_active_user(current_user: User = Depends(get_current_user)):
    if current_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def logging_out():
    user=get_current_active_user()
    user.disabled=True

async def get_socket_user(token, db: Session=Depends(get_db)):#get_user is not async which is needed for sockets, make aiomysql db session for this
    try:# there wil be two diffeent gb sessions one sync for fastapi and one async for socketio
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print("JWT payload:", payload)
        email = payload.get("sub")
        type_token=payload.get('type')
        if email is None:
            raise  ConnectionRefusedError("unauthorized")
        token_data = TokenData(email=email)

    except InvalidTokenError:
        raise  ConnectionRefusedError("unauthorized")
    
    if type_token=="access":
        user = get_user(email=token_data.email, db=db)
        print("DB lookup for email:", token_data.email, "->", bool(user))
        if user is None:
            raise  ConnectionRefusedError("unauthorized")
        return user
    else:
         raise  ConnectionRefusedError("unauthorized")

