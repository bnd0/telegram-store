"""
config.py — Centralised settings loaded from .env
Pydantic-settings validates every variable at startup so the app
fails fast with a clear error rather than a runtime KeyError later.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Postgres
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/tgstore"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Security / misc
    secret_key: str = "dev-secret-change-me"
    environment: str = "development"
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
