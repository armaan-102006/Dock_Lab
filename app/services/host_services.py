from app.services.auth_service import get_current_active_user
from fastapi import Depends
from app.models.user import User

def node_url_update(url, user: User= Depends(get_current_active_user)):
    #change the tokens to be issued to both the host and client users differently
    #update the url to respective user
    pass