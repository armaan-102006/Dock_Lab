from pydantic import BaseModel
from typing import Optional


class SessionCreate(BaseModel):
    user_id: int
    image: Optional[str] = None


class SessionRead(BaseModel):
    id: int
    user_id: int
    container_id: Optional[str]

    class Config:
        orm_mode = True
