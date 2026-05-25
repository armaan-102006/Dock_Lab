from fastapi import APIRouter, Depends

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login():
    return {"msg": "login placeholder"}
