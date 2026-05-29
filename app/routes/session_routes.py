from fastapi import APIRouter
from services.auth_service import get_current_active_user
from services.docker_service import *
router = APIRouter(prefix="/session", tags=["sessions"])


@router.get("/")
def create_session():#create a socketio session with frontend
    user=get_current_active_user()
    if user.container_id:#check for containerid existance in database
        return "session already in progress"
    else:
        container_id=container()#add container id to database of related user
        return container_id
    
@router.post("/resize")
def session_resize(height,width):
    user=get_current_active_user()
    container_id=user.container_id#get containerid from database
    exec_id=sockets[container_id][1]
    container_size(exec_id,height,width)