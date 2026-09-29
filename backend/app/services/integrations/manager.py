import logging
from typing import Dict, Any, List, Optional
from app.services.integrations.base import IntegrationProvider
from app.services.integrations.google.gmail import GmailIntegrationProvider
from app.services.integrations.google.calendar import GoogleCalendarIntegrationProvider
from app.services.integrations.meta.whatsapp import WhatsAppIntegrationProvider
from app.services.integrations.website.webhook import WebsiteLeadsIntegrationProvider

logger = logging.getLogger("soloceo_integration_manager")

class IntegrationManager:
    """Central registry and lifecycle manager for all external workspace integrations."""

    def __init__(self):
        self._providers: Dict[str, IntegrationProvider] = {}
        self.register_provider(GmailIntegrationProvider())
        self.register_provider(GoogleCalendarIntegrationProvider())
        self.register_provider(WhatsAppIntegrationProvider())
        self.register_provider(WebsiteLeadsIntegrationProvider())

    def register_provider(self, provider: IntegrationProvider):
        self._providers[provider.provider_id] = provider

    def get_provider(self, provider_id: str) -> Optional[IntegrationProvider]:
        return self._providers.get(provider_id)

    async def list_integrations_status(self, business_id: str) -> List[Dict[str, Any]]:
        """Returns connection status for all registered integrations."""
        statuses = []
        for pid, provider in self._providers.items():
            st = await provider.get_status(business_id)
            statuses.append({
                "id": f"{business_id}:{pid}",
                "business_id": business_id,
                "provider": pid,
                "display_name": provider.display_name,
                "description": provider.description,
                "status": st.get("status", "disconnected"),
                "account_name": st.get("account_name"),
                "account_email": st.get("account_email"),
                "last_synced_at": st.get("last_synced_at"),
                "last_error": st.get("last_error")
            })
        return statuses

    async def get_auth_url(self, business_id: str, provider_id: str, redirect_uri: str, state: str) -> str:
        provider = self.get_provider(provider_id)
        if not provider:
            raise ValueError(f"Unknown integration provider: {provider_id}")
        return await provider.get_auth_url(business_id=business_id, redirect_uri=redirect_uri, state=state)

    async def handle_callback(self, business_id: str, provider_id: str, code: str, redirect_uri: str) -> Dict[str, Any]:
        provider = self.get_provider(provider_id)
        if not provider:
            raise ValueError(f"Unknown integration provider: {provider_id}")
        return await provider.handle_oauth_callback(business_id=business_id, code=code, redirect_uri=redirect_uri)

    async def disconnect(self, business_id: str, provider_id: str) -> bool:
        provider = self.get_provider(provider_id)
        if not provider:
            raise ValueError(f"Unknown integration provider: {provider_id}")
        return await provider.disconnect(business_id=business_id)

    async def sync(self, business_id: str, provider_id: str) -> Dict[str, Any]:
        provider = self.get_provider(provider_id)
        if not provider:
            raise ValueError(f"Unknown integration provider: {provider_id}")
        return await provider.sync(business_id=business_id)

# Singleton manager
integration_manager = IntegrationManager()
