from fastapi import APIRouter
from fastapi import Depends
from app.services.auth_service import get_current_active_user
from app.services.docker_service import *
from app.core.collections import users_collection
from app.models.user import User

router = APIRouter(prefix="/session", tags=["sessions"])


@router.get("/")
def create_session(user: User= Depends(get_current_active_user)):#create a socketio session with frontend
    if user.container_id:
        return "session already in progress"
    else:
        container_id=container()#add container id to database of related user
        print(container_id)
        users_collection.update_one({"email": user.email}, {"$set": {"container_id": container_id}})
        return container_id

@router.post("/resize")
def session_resize(height,width):
    user=get_current_active_user()
    container_id=user.container_id#get containerid from database
    exec_id=sockets[container_id][1]
    container_size(exec_id,height,width)