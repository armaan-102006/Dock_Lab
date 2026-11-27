from fastapi import APIRouter, Depends
from services import auth_service
from typing import Annotated, Optional
from fastapi import HTTPException,status
from fastapi.security import OAuth2PasswordRequestForm  
from core.security import oauth2_scheme
from models.user import User
from services.auth_service import get_current_active_user,authenticate_token
from fastapi import Body
from core.async_collections import async_users_collection

router = APIRouter(prefix="/auth", tags=["auth"])
@router.post('/user_auth')
async def authenticate(user_token:str = Body(...,embed=True), user: User=Depends(get_current_active_user)):#here the dependency is sync in an async function, i might need to make an async version of this function
    email=authenticate_token(user_token)
    user_record = await async_users_collection.find_one(
        {"email": email},
        {"_id": 0, "container_id": 1},
    )
    if user_record is None:
        return {"exists": False, "container": None}
    
    container_status = user_record.get("container_id")
    if container_status == "inactive":
        await async_users_collection.update_one(
            {"email": email, "container_id": "inactive"},
            {"$set": {"container_id": "active"}},
        )

    return {"exists": True, "container": container_status}
    #check for the email in database asynchronously if it exists, return active or inactive container, else False and put container_id as active in database - format = {exists: (true/false), container : active/inactive}
    #this function is being used by the host to authenticate the user and check if the user is already actively using a container or not

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

@router.get("/logout")
def logout(user : User = Depends(get_current_active_user)):
    return auth_service.logging_out(user)