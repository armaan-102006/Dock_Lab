from app.models.session import Session


class SessionService:
    def create(self, user_id: int) -> Session:
        # placeholder implementation
        return Session(id=1, user_id=user_id)
