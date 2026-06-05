from typing import Optional
from datetime import datetime


class Session:
    def __init__(self, id: int, user_id: int, container_id: Optional[str] = None):
        self.id = id
        self.user_id = user_id
        self.container_id = container_id
        self.created_at = datetime.utcnow()


    def __repr__(self):
        return f"<Session id={self.id} user_id={self.user_id}>"
