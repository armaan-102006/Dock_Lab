from fastapi import APIRouter,Body
from fastapi import Depends
from app.services.auth_service import get_current_active_user
from app.services.server_setup.docker_service import *
from app.core.collections import users_collection
from app.models.user import User
from app.services.host_services import node_url_update
from app.services.auth_service import authenticate_token

router = APIRouter(prefix="/session", tags=["sessions"])

@router.get('/node')
def get_node_list(user: User= Depends(get_current_active_user)):
    #for now return 5 random node urls from database, later intake prefrances of ram , cpu and vram to give the list accordingly
    pass

@router.get('/register')
def node_register(url:str = Body(...,embed=True), user: User= Depends(get_current_active_user)):
    node_url_update(url,user=user)

@router.get("/remove")
def remove_session(user_token:str = Body(...,embed=True), user: User= Depends(get_current_active_user)):#create a socketio session with frontend
    email=authenticate_token(user_token)
    users_collection.update_one({"email": user.email}, {"$set": {"container_id": "inactive"}})

@router.post("/resize")
def session_resize(height,width):
    user=get_current_active_user()
    container_id=user.container_id#get containerid from database
    exec_id=sockets[container_id][1]
    container_size(exec_id,height,width)