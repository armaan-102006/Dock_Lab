from app.core.security import get_password_hash,create_access_token,create_refresh_token,verify_password,oauth2_scheme,ALGORITHM
from app.core.collections import users_collection
from jwt.exceptions import InvalidTokenError
import jwt
from app.core.config import SECRET_KEY
from fastapi import HTTPException,status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.models.user import User
from app.schemas.user_schema import TokenData
from datetime import timedelta
from typing import Annotated, Optional

def create_user(email,password,db):#integrate database
    hash_password=get_password_hash(password)
    existing_user = users_collection.find_one({"email": email})
    if existing_user:
        return "Email already present"
    user = User(email=email, hashed_password=hash_password)
    users_collection.insert_one(user.__dict__)
    return "User created successfully"

def get_user(email: str):
    user_data = users_collection.find_one({"email": email})
    return User(**user_data)#user model should have _id in it

def authenticate_user(email: str, password: str):
    user = get_user(email)
    print(f"Authenticating user: {email}, user found: {bool(user)}")
    if user:
        password_valid = verify_password(password, user.hashed_password)
        print(f"Password verification result: {password_valid}")
        if password_valid:
            return user
    return None

def login_for_refresh_token(email,password):
    user = authenticate_user(email, password)
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
    users_collection.update_one({"email": user.email}, {"$set": {"jti": jti}})
    access_token_expires = timedelta(minutes=15)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    users_collection.update_one({"email": user.email}, {"$set": {"disabled": False}})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

def renew_tokens(token):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        user = users_collection.find_one({"email": email})
        if not user:
            raise credentials_exception
        jti_token = payload.get("jti")
        jti_data = user["jti"]
        type_token = payload.get("type")
        if type_token == "refresh" and jti_token == jti_data:
            refresh_token_expires = timedelta(days=30)
            refresh_token, jti = create_refresh_token(
                data={"sub": user.email},
                expires_delta=refresh_token_expires
            )
            users_collection.update_one({"email": user.email}, {"$set": {"jti": jti}})
            access_token_expires = timedelta(minutes=15)
            access_token = create_access_token(
                data={"sub": email},
                expires_delta=access_token_expires
            )
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer"
            }
    except InvalidTokenError:
        raise credentials_exception

def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)]
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        print("JWT payload:", payload)
        email = payload.get("sub")
        type_token = payload.get("type")
        if email is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception
    if type_token == "access":
        user = get_user(email=email)
        print(
            "DB lookup for email:",
            email,
            "->",
            bool(user)
        )
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
    user = get_current_active_user()
    users_collection.update_one({"email": user.email}, {"$set": {"disabled": True}})
    return {
        "message": "Logged out successfully"
    }

async def get_socket_user(token):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        print("JWT payload:", payload)
        email = payload.get("sub")
        type_token = payload.get("type")
        if email is None:
            raise ConnectionRefusedError("unauthorized")
    except InvalidTokenError:
        raise ConnectionRefusedError("unauthorized")
    if type_token == "access":
        user = get_user(email=email)
        print(
            "DB lookup for email:",
            email,
            "->",
            bool(user)
        )
        if user is None:
            raise ConnectionRefusedError("unauthorized")
        return user
    else:
        raise ConnectionRefusedError("unauthorized")

