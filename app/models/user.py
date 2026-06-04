from typing import Optional


class User:

    def __init__(
        self,
        email: str,
        hashed_password: str,
        container_id: Optional[str] = None,
        jti: Optional[str] = None,
        disabled: bool = False
    ):

        self.email = email
        self.hashed_password = hashed_password
        self.container_id = container_id
        self.jti = jti
        self.disabled = disabled

    def __repr__(self):

        return f"<User email={self.email}>"