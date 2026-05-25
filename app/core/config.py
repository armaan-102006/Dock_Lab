from pydantic import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Dock Lab"
    debug: bool = False
    database_url: str = "sqlite:///./docklab.db"

    class Config:
        env_file = ".env"


settings = Settings()
