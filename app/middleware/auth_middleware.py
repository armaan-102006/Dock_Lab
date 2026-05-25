from fastapi import Request, HTTPException


async def auth_middleware(request: Request, call_next):
    # placeholder: implement auth checks here
    response = await call_next(request)
    return response
