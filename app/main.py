from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth_routes import router as auth_router 
from app.routes.session_routes import router as session_router 

fapp = FastAPI()

origins = [
    "https://test-frontend-ashy-zeta.vercel.app"
]

fapp.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

fapp.include_router(auth_router)
fapp.include_router(session_router)