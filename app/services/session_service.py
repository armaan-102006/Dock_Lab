from main import sio
import asyncio
from auth_service import get_socket_user
from docker_service import (
    send,
    sockets
)
from concurrent.futures import ThreadPoolExecutor


executor = ThreadPoolExecutor(max_workers=200)
@sio.event
async def connect(sid, environ,auth):
    token=auth.get('token')
    print(sid,"connected")
    user=get_socket_user(token=token)#most user data from database especially container id, also add database to argument
    asyncio.create_task(send_data(sid))#try to understand
    sio.emit(user.container_id,to=sid)
    sio.save_session(sid, user)

@sio.event
async def recieve_data(sid,data):
    user=sio.get_session(sid)
    container_id=user.container_id
    sock=sockets[container_id][0]
    await recieve_data(sock=sock,data=data)

@sio.event
async def send_data(sid):
    user=sio.get_session(sid)
    container_id=user.container_id
    sock=sockets[container_id][0]
    while True:
        data = await asyncio.get_event_loop().run_in_executor(
            executor, sock.recv, 1024
        )
        if not data:
            break
        await sio.emit("result", data, to=sid)