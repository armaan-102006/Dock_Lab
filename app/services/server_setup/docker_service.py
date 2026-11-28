import docker
import os,sys
from docker.errors import ImageNotFound,APIError

client=docker.from_env()
global sockets
sockets={}
#add cpu/ram limit to docker
def container(email):
    device_request=[docker.types.DeviceRequest(count=-1, capabilities=[["gpu"]])]
    client_dir = os.path.join(os.getenv('LOCALAPPDATA'), 'DOCK_LAB',email)
    os.makedirs(client_dir, exist_ok=True)
    #base_dir = os.path.dirname(sys.executable)
    base_dir=os.path.dirname(os.path.abspath(__file__))
    try:
        image=client.images.get("dock_lab:latest")
    except ImageNotFound:
        image,log=client.images.build(path=base_dir,tag="dock_lab:latest")

    try:
        container=client.containers.run(image, detach=True, working_dir="/workspace",#configure all this bullshit in dockerfile next time
            tty=True, command="sleep infinity", stdin_open=True,shm_size="2g",
            mem_limit="8g", device_requests=device_request,
            volumes={client_dir: {"bind": "/workspace", "mode": "rw"}})

    except APIError:
        container=client.containers.run(image, detach=True, working_dir="/workspace",tty=True,
            command="sleep infinity", stdin_open=True,shm_size="2g",
            mem_limit="8g", volumes={client_dir: {"bind": "/workspace", "mode": "rw"}})
        
    exec_id = client.api.exec_create(container.id,cmd="/bin/bash",stdin=True, stdout=True, stderr=True, tty=True, environment={"TERM": "xterm"})
    sock = client.api.exec_start(exec_id, socket=True)
    sockets[container.id]=[sock,exec_id]#temporary fix for accessing sockets in other functions
    container_size(exec_id,height=24,width=80)
    return container.id

def container_size(exec_id,height,width):
    client.api.exec_resize(exec_id,height,width)

def recieve(sock,data):
    print(data)
    data=data.encode('utf-8')#maybe a bit of decoding problem for both send and recieve?
    print(data)
    sock.sendall(data)
    
'''(function deprecated, problems listed not.)
def send(sock):#will be an issue of blocking on production scale- not anymore, hopefully
    return sock.recv()#xterm will decode automatically on the frontend?'''