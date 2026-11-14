from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/.env, found relative to this file so it works from any folder.
ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    """App settings, read once at startup from the environment and backend/.env."""

    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore")

    # Required. Generate one with: openssl rand -hex 32
    secret_key: str = Field(min_length=32)
    # Optional. Without it the app uses a local SQLite file.
    database_url: str = "sqlite:///tripledger.db"


settings = Settings() # pyright: ignore[reportCallIssue] # fields come from the environment
