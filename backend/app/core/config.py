import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    REVENUECAT_API_KEY: Optional[str] = None
    REVENUECAT_WEBHOOK_SECRET: Optional[str] = None

    JWT_SECRET: str = "soloceo-secret-key-12345"

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()
