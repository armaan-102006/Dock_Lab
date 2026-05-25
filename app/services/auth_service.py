from app.core.security import hash_password, verify_password


class AuthService:
    def hash(self, password: str) -> str:
        return hash_password(password)

    def verify(self, password: str, hashed: str) -> bool:
        return verify_password(password, hashed)
