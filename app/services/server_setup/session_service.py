import socketio
import docker
import asyncio
import functools
import httpx
import keyring,os
from fastapi.responses import FileResponse
from fastapi import FastAPI,Depends
from typing import Annotated
from fastapi.security import OAuth2PasswordBearer
import shutil
import tempfile
from fastapi.middleware.cors import CORSMiddleware
from docker_service import (
    recieve,
    sockets,
    container
)
from concurrent.futures import ThreadPoolExecutor

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

origins = [
    "https://test-frontend-ashy-zeta.vercel.app"
]
sio = socketio.AsyncServer(async_mode="asgi", 
    cors_allowed_origins=origins
)

fapp = FastAPI()
fapp.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app = socketio.ASGIApp(sio,other_asgi_app=fapp)

'''the host will need to send his own tokens along with the client tokens to get the client details for that i will need to access
the storage where the host frontend stored it's tokens. Also the client side tokens are mostly working but there might be some issue on
the frontend.'''
#add disconnect, which will remove containerid of the given user from database and from sockets dictionary
client=docker.from_env()
executor = ThreadPoolExecutor(max_workers=200)

@sio.event
async def connect(sid, environ,auth):
    print("connected")
    token=auth.get('token')
    host_token = await asyncio.to_thread(keyring.get_password, 'dock_lab', 'access_token')
    async with httpx.AsyncClient() as cli:
        response = await cli.post(
            "https://testproduct.tech/auth/user_auth",#there will be a route at central backend where the user_tokens will be will be authenticated and if the user exists then the route will return true else false
            headers={"Authorization": f"Bearer {host_token}"},#put host's own tokens here not the client token
            json={'user_token': token}
        )
        if response.status_code != 200:
            raise ConnectionRefusedError("Authentication failed")
        user=response.json()
        if not user['exists']:
            raise ConnectionRefusedError("Authentication failed") 
    if user['container']=='active':
        raise ConnectionRefusedError("Container already running") 
    print(user)
    print(sid,"connected")
    container_id = await asyncio.get_event_loop().run_in_executor(
            executor, container, user['email']
        )
    user['client_token']=token
    user['container_id']=container_id#here i am making a local user dictionary which saves container_id which is used to detect whom the information is coming from and who is sending it
    await sio.save_session(sid, user)
    asyncio.create_task(send_data(sid))#try to understand

@sio.event
async def recieve_data(sid,data):
    user = await sio.get_session(sid)
    container_id = user['container_id']
    sock=sockets[container_id][0]
    data=data.encode('utf-8')
    await asyncio.get_event_loop().run_in_executor(
            executor, sock.sendall, data
        )

@sio.event
async def send_data(sid):
    print("sending data")
    user= await sio.get_session(sid)
    container_id=user['container_id']
    sock=sockets[container_id][0]
    while True:
        data = await asyncio.get_event_loop().run_in_executor(
            executor, sock.recv, 1024
        )
        if not data:
            break
        await sio.emit("result", data, to=sid)
        
@sio.event
async def disconnect(sid):
    user= await sio.get_session(sid)
    token= user['client_token']
    container_id=user['container_id']
    await asyncio.get_event_loop().run_in_executor(#try to_thread
        None,
            functools.partial(client.containers.get(container_id).stop)#this is bullshit.
        )
    await asyncio.to_thread(client.containers.get(container_id).remove)
    host_token = await asyncio.to_thread(keyring.get_password, 'dock_lab', 'access_token')
    async with httpx.AsyncClient() as cli:
        response = await cli.post(
            "https://testproduct.tech/session/remove",
            headers={"Authorization": f"Bearer {host_token}"},
            json={'user_token': token}
        )
    print("disconnected")
    del sockets[container_id]

#change the system of container_id being inactive and active on user side to give actual in use container or none
@fapp.get('/download')
async def download_file(token: Annotated[str, Depends(oauth2_scheme)]):
    host_token = await asyncio.to_thread(keyring.get_password, 'dock_lab', 'access_token')
    async with httpx.AsyncClient() as cli:
        response = await cli.post(
            "https://testproduct.tech/auth/user_auth",
            headers={"Authorization": f"Bearer {host_token}"},
            json={'user_token': token}
        )
        if response.status_code != 200:
            raise ConnectionRefusedError("Authentication failed")
        user=response.json()
        if not user['exists']:
            raise ConnectionRefusedError("Authentication failed") 

        app_dir = os.path.join(os.getenv('LOCALAPPDATA'), 'DOCK_LAB')
        os.makedirs(app_dir, exist_ok=True)
        output_path = os.path.join(app_dir, user['email'])

        #packaging all the stuff related to user to send as a zip file
        zip_base = os.path.join(tempfile.gettempdir(), f"{user['email']}_files")
        zip_path = await asyncio.to_thread(shutil.make_archive, zip_base, 'zip', output_path)
        #add a delete folder function after download, also delete the output.txt each session
        return FileResponse(zip_path, filename=f"{user['email']}_dock_lab_files.zip", media_type="application/zip")