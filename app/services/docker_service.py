import docker


class DockerService:
    def __init__(self):
        self.client = docker.from_env()

    def list_containers(self):
        return self.client.containers.list()
