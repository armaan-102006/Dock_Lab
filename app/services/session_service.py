from main import sio
import docker
import asyncio
from auth_service import get_socket_user
from docker_service import (
    recieve,
    sockets
)
from concurrent.futures import ThreadPoolExecutor

#add disconnect, which will remove containerid of the given user from database and from sockets dictionary
client=docker.from_env()
executor = ThreadPoolExecutor(max_workers=200)
@sio.event
async def connect(sid, environ,auth):
    token=auth.get('token')
    user= await get_socket_user(token=token)#most user data from database especially container id, also add database to argument
    asyncio.create_task(send_data(sid))#try to understand
    await sio.emit(user.container_id,to=sid)
    print(sid,"connected")
    await sio.save_session(sid, user)

@sio.event
async def recieve_data(sid,data):
    user= await sio.get_session(sid)
    container_id=user.container_id
    sock=sockets[container_id][0]
    await recieve(sock=sock,data=data)

@sio.event
async def send_data(sid):
    user= await sio.get_session(sid)
    container_id=user.container_id
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
    container_id=user.container_id
    await asyncio.get_event_loop().run_in_executor(
            client.containers.get(container_id).stop(0)
        )
    del sockets[container_id]