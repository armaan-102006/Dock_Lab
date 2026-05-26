import docker

client=docker.from_env()

async def container():
    image=client.images.get("test_container")
    client.containers.run(image, detach=True, tty=True, command="sleep infinity", stdin_open=True)
    exec_id = client.api.exec_create(container.id,cmd="/bin/bash",stdin=True, stdout=True, stderr=True, tty=True)
    sock = client.api.exec_start(exec_id, socket=True)
