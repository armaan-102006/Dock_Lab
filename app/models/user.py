from typing import Optional


class User:

    def __init__(
        self,
        email: str,
        hashed_password: str ,
        _id: int = None,#is _id an int in database, fix accordingly
        container_id: Optional[str] = None,
        jti: Optional[str] = None,
        disabled: bool = False,
    ):
        self._id= _id
        self.email = email
        self.hashed_password = hashed_password
        self.container_id = container_id
        self.jti = jti
        self.disabled = disabled

    def __repr__(self):

        return f"<User email={self.email}>"