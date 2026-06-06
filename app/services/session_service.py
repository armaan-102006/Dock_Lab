import socketio
import docker
import asyncio
import functools
from app.core.async_collections import async_users_collection
from app.services.auth_service import get_socket_user
from app.services.docker_service import (
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
#add disconnect, which will remove containerid of the given user from database and from sockets dictionary
client=docker.from_env()
executor = ThreadPoolExecutor(max_workers=200)
@sio.event
async def connect(sid, environ,auth):
    print("connected")
    token=auth.get('token')
    user= await get_socket_user(token=token)#most user data from database especially container id, also add database to argument
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
    async_users_collection.update_one({"email": user['email']}, {"$set": {"container_id": None}})
    print("disconnected")
    del sockets[container_id]