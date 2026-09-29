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

    # Google OAuth & APIs
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/integrations/google/callback"

    # Meta / WhatsApp Cloud API
    META_APP_ID: Optional[str] = None
    META_APP_SECRET: Optional[str] = None
    META_ACCESS_TOKEN: Optional[str] = None
    WHATSAPP_PHONE_NUMBER_ID: Optional[str] = None
    WHATSAPP_VERIFY_TOKEN: str = "soloceo-whatsapp-verify-token-xyz"

    # Webhook signature secret
    WEBHOOK_SIGNING_SECRET: str = "soloceo-webhook-secret-key-12345"

    JWT_SECRET: str = "soloceo-secret-key-12345"

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()
