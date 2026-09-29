import urllib.parse
import httpx
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from app.core.config import settings
from app.core.supabase_client import get_supabase

logger = logging.getLogger("soloceo_google_oauth")

GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

# Scopes required for Gmail and Google Calendar operations
GMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
]

CALENDAR_SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
]

# In-memory storage for active integration records (fallback and offline testability)
in_memory_integrations: Dict[str, Dict[str, Any]] = {}

def get_google_auth_url(business_id: str, provider: str, redirect_uri: str, state: str) -> str:
    """Builds standard Google OAuth authorization URL."""
    client_id = settings.GOOGLE_CLIENT_ID
    if not client_id:
        return f"https://accounts.google.com/o/oauth2/v2/auth?client_id=CONFIGURE_GOOGLE_CLIENT_ID&state={state}"

    scopes = GMAIL_SCOPES if provider == "gmail" else CALENDAR_SCOPES
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri or settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(scopes),
        "access_type": "offline",
        "prompt": "consent",
        "state": f"{business_id}:{provider}:{state}"
    }
    return f"{GOOGLE_AUTH_BASE}?{urllib.parse.urlencode(params)}"


async def exchange_google_code(business_id: str, provider: str, code: str, redirect_uri: str) -> Dict[str, Any]:
    """Exchanges authorization code for Google access and refresh tokens."""
    client_id = settings.GOOGLE_CLIENT_ID
    client_secret = settings.GOOGLE_CLIENT_SECRET
    
    if not client_id or not client_secret:
        raise ValueError("Google OAuth credentials are not configured in environment (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).")

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri or settings.GOOGLE_REDIRECT_URI,
            }
        )

        if token_res.status_code != 200:
            logger.error(f"Google token exchange failed: {token_res.text}")
            raise ValueError(f"Google token exchange failed: {token_res.text}")

        token_data = token_res.json()
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        expires_in = token_data.get("expires_in", 3600)
        token_expiry = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

        # Get user profile from Google
        profile_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        user_info = profile_res.json() if profile_res.status_code == 200 else {}
        account_email = user_info.get("email")
        account_name = user_info.get("name")

        # Save to database
        record_id = f"{business_id}:{provider}"
        integration_record = {
            "id": record_id,
            "business_id": business_id,
            "provider": provider,
            "status": "connected",
            "account_name": account_name,
            "account_email": account_email,
            "external_account_id": user_info.get("id"),
            "access_token_encrypted": access_token,
            "refresh_token_encrypted": refresh_token,
            "token_expiry": token_expiry.isoformat(),
            "scopes": GMAIL_SCOPES if provider == "gmail" else CALENDAR_SCOPES,
            "last_synced_at": datetime.now(timezone.utc).isoformat(),
            "last_error": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

        supabase = get_supabase()
        if supabase:
            try:
                supabase.table("integrations").upsert(integration_record).execute()
            except Exception as e:
                logger.warning(f"Error persisting integration in Supabase: {e}")

        in_memory_integrations[record_id] = integration_record
        return integration_record
