import docker

client=docker.from_env()
global sockets
sockets={}
#add cpu/ram limit to docker
def container():
    image=client.images.get("test_container")
    container=client.containers.run(image, detach=True, tty=True, command="sleep infinity", stdin_open=True)
    exec_id = client.api.exec_create(container.id,cmd="/bin/bash",stdin=True, stdout=True, stderr=True, tty=True)
    sock = client.api.exec_start(exec_id, socket=True)
    sockets[container.id]=[sock,exec_id]#temporary fix for accessing sockets in other functions
    return container.id

def container_size(exec_id,height,width):
    client.api.exec_resize(exec_id,height,width)

def recieve(sock,data):
    data.encode('utf-8')#maybe a bit of decoding problem for both send and recieve?
    sock.sendall(data)
'''(function deprecated, problems listed not.)
def send(sock):#will be an issue of blocking on production scale- not anymore, hopefully
    return sock.recv()#xterm will decode automatically on the frontend?'''