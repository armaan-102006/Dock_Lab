from fastapi import APIRouter,Body
from fastapi import Depends
from core.collections import users_collection
from models.user import User
from services.host_services import node_url_update
from services.auth_service import authenticate_token
from services.auth_service import get_current_active_user

router = APIRouter(prefix="/session", tags=["sessions"])

@router.get('/node')
def get_node_list(user: User= Depends(get_current_active_user)):
    #for now return 5 random node urls from database, later intake prefrances of ram , cpu and vram to give the list accordingly
    return list(#i am using container_id for both checking if a user is using a host's services while also using it to check if a host is actually active, this could be conflicting definietly 
        users_collection.find(
            {"container_id": "active", "url": {"$exists": True}},
            {"_id": 0, "url": 1, "email": 1},
        )
    )

@router.post('/register')
def node_register(url:str = Body(...,embed=True), user: User= Depends(get_current_active_user)):
    email = user.email
    users_collection.update_one({"email": user.email}, {"$set": {"container_id": "active","url": url}})
    print(email,":", url)

@router.post("/remove")
def remove_session(user_token:str = Body(...,embed=True), user: User= Depends(get_current_active_user)):
    email=authenticate_token(user_token)
    users_collection.update_one({"email": email}, {"$set": {"container_id": "inactive"}})

@router.post("/remove_host")
def remove_session(user: User= Depends(get_current_active_user)):
    users_collection.update_one({"email": user.email}, {"$set": {"container_id": "inactive","url":None}})
