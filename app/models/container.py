from typing import Optional


class ContainerInfo:
    def __init__(self, id: str, name: str, image: str):
        self.id = id
        self.name = name
        self.image = image
        self.status: Optional[str] = None


    def __repr__(self):
        return f"<Container id={self.id} name={self.name}>"
