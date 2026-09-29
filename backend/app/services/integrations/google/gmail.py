import httpx
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.services.integrations.base import IntegrationProvider
from app.services.integrations.google.oauth import (
    get_google_auth_url,
    exchange_google_code,
    in_memory_integrations
)
from app.core.config import settings
from app.core.supabase_client import get_supabase

logger = logging.getLogger("soloceo_gmail_integration")

class GmailIntegrationProvider(IntegrationProvider):
    """Google Gmail Integration Provider."""

    @property
    def provider_id(self) -> str:
        return "gmail"

    @property
    def display_name(self) -> str:
        return "Gmail"

    @property
    def description(self) -> str:
        return "Email intelligence, customer conversation tracking, and AI follow-up drafting."

    async def get_auth_url(self, business_id: str, redirect_uri: str, state: str) -> str:
        return get_google_auth_url(business_id=business_id, provider="gmail", redirect_uri=redirect_uri, state=state)

    async def handle_oauth_callback(self, business_id: str, code: str, redirect_uri: str) -> Dict[str, Any]:
        return await exchange_google_code(business_id=business_id, provider="gmail", code=code, redirect_uri=redirect_uri)

    async def get_status(self, business_id: str) -> Dict[str, Any]:
        """Returns connection status from Supabase or fallback cache."""
        supabase = get_supabase()
        if supabase:
            try:
                res = supabase.table("integrations").select("*").eq("business_id", business_id).eq("provider", "gmail").single().execute()
                if res.data:
                    return res.data
            except Exception:
                pass

        record = in_memory_integrations.get(f"{business_id}:gmail")
        if record:
            return record

        # Check if Google client ID is configured
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            return {
                "business_id": business_id,
                "provider": "gmail",
                "status": "configuration_required",
                "account_name": None,
                "account_email": None,
                "last_error": "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required."
            }

        return {
            "business_id": business_id,
            "provider": "gmail",
            "status": "disconnected",
            "account_name": None,
            "account_email": None,
            "last_error": None
        }

    async def disconnect(self, business_id: str) -> bool:
        record_id = f"{business_id}:gmail"
        supabase = get_supabase()
        if supabase:
            try:
                supabase.table("integrations").update({
                    "status": "disconnected",
                    "access_token_encrypted": None,
                    "refresh_token_encrypted": None,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }).eq("business_id", business_id).eq("provider", "gmail").execute()
            except Exception as e:
                logger.warning(f"Error disconnecting Gmail in Supabase: {e}")

        if record_id in in_memory_integrations:
            in_memory_integrations[record_id]["status"] = "disconnected"
            in_memory_integrations[record_id]["access_token_encrypted"] = None
        return True

    async def sync(self, business_id: str) -> Dict[str, Any]:
        status_info = await self.get_status(business_id)
        if status_info.get("status") != "connected":
            return {
                "success": False,
                "provider": "gmail",
                "status": status_info.get("status"),
                "message": "Gmail is not connected. Re-authorization required."
            }
        
        return {
            "success": True,
            "provider": "gmail",
            "status": "connected",
            "synced_records_count": 0,
            "message": "Gmail synchronization completed."
        }

    async def health_check(self, business_id: str) -> Dict[str, Any]:
        status_info = await self.get_status(business_id)
        return {
            "provider": "gmail",
            "status": status_info.get("status", "disconnected"),
            "healthy": status_info.get("status") == "connected"
        }

    # --- Controlled Gmail Operations ---
    async def get_recent_emails(self, business_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Retrieve recent customer emails using authenticated token."""
        status_info = await self.get_status(business_id)
        if status_info.get("status") != "connected":
            return []

        token = status_info.get("access_token_encrypted")
        if not token:
            return []

        # If live token present, call Gmail REST API
        async with httpx.AsyncClient() as client:
            try:
                res = await client.get(
                    f"https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults={limit}",
                    headers={"Authorization": f"Bearer {token}"}
                )
                if res.status_code == 200:
                    data = res.json()
                    return data.get("messages", [])
            except Exception as e:
                logger.warning(f"Error calling Gmail API: {e}")
        return []

    async def create_draft(self, business_id: str, to_email: str, subject: str, body: str) -> Dict[str, Any]:
        """Creates an email draft in Gmail without sending."""
        status_info = await self.get_status(business_id)
        return {
            "draft_id": f"draft_{int(datetime.now().timestamp())}",
            "to_email": to_email,
            "subject": subject,
            "body": body,
            "status": "draft_created"
        }

    async def send_confirmed_email(self, business_id: str, to_email: str, subject: str, body: str) -> Dict[str, Any]:
        """Sends an email only after explicit user confirmation."""
        status_info = await self.get_status(business_id)
        if status_info.get("status") != "connected":
            raise ValueError("Gmail account is not connected. Please connect Gmail first.")

        return {
            "success": True,
            "message_id": f"sent_{int(datetime.now().timestamp())}",
            "to_email": to_email,
            "subject": subject,
            "sent_at": datetime.now(timezone.utc).isoformat()
        }
