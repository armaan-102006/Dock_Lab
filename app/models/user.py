from typing import Optional


class User:
    def __init__(self, id: int, username: str, email: str, hashed_password: str):
        self.id = id
        self.username = username
        self.email = email
        self.hashed_password = hashed_password


    def __repr__(self):
        return f"<User id={self.id} username={self.username}>"
