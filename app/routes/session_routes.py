from fastapi import APIRouter

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/")
def create_session():
    return {"msg": "create session placeholder"}
