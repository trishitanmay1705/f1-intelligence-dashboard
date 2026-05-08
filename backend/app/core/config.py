from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):

    app_name: str = "F1 Intelligence Dashboard"
    app_version: str = "0.1.0"
    debug: bool = True


    api_host: str = "0.0.0.0"
    api_port: int = 8000


    jolpica_base_url: str = "https://api.jolpi.ca/ergast/f1"
    openf1_base_url: str = "https://api.openf1.org/v1"
    fastf1_cache_dir: str = "f1_cache"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()