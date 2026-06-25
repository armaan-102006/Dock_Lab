import socketio
import docker
import asyncio
import functools
import httpx
import keyring
from server_setup.docker_service import (
    recieve,
    sockets
)
from concurrent.futures import ThreadPoolExecutor

origins = [
    "https://test-frontend-ashy-zeta.vercel.app"
]
sio = socketio.AsyncServer(async_mode="asgi", 
    cors_allowed_origins=origins
)
app = socketio.ASGIApp(sio)

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
    host_token = await asyncio.to_thread(keyring.get_password('dock_lab','access_token'))
    async with httpx.AsyncClient() as cli:
        response = await cli.post(
            "server_url/auth/user_auth",#there will be a route at central backend where the user_tokens will be will be authenticated and if the user exists then the route will return true else false
            headers={"Authorization": f"Bearer {host_token}"},#put host's own tokens here not the client token
            json={'user_token': token}
        )
        if response.status_code != 200:
            raise ConnectionRefusedError("Authentication failed")
        user=response.json()
    print(user)
    #await sio.emit('connect',user['container_id'],to=sid)
    print(sid,"connected")
    await sio.save_session(sid, user)
    asyncio.create_task(send_data(sid))#try to understand

@sio.event
async def recieve_data(sid,data):
    user= await sio.get_session(sid)
    container_id=user['container_id']
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
    container_id=user['container_id']
    await asyncio.get_event_loop().run_in_executor(
        None,
            functools.partial(client.containers.get(container_id).stop)#this is bullshit
        )
    #async_users_collection.update_one({"email": user['email']}, {"$set": {"container_id": None}})        dont think i need container id's after they have are working on different host machines, will later need updates on when a user disconencted tho for data
    print("disconnected")
    del sockets[container_id]

