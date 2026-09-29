from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime

class IntegrationProvider(ABC):
    """Abstract base class for all SoloCEO external application integrations."""

    @property
    @abstractmethod
    def provider_id(self) -> str:
        """Unique identifier for the provider (e.g. 'gmail', 'google_calendar', 'whatsapp')."""
        pass

    @property
    @abstractmethod
    def display_name(self) -> str:
        """Human readable name for the integration."""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """Brief summary of the integration's capabilities."""
        pass

    @abstractmethod
    async def get_auth_url(self, business_id: str, redirect_uri: str, state: str) -> str:
        """Constructs OAuth authorization URL."""
        pass

    @abstractmethod
    async def handle_oauth_callback(self, business_id: str, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchanges OAuth authorization code for tokens and updates integration record."""
        pass

    @abstractmethod
    async def get_status(self, business_id: str) -> Dict[str, Any]:
        """Returns the current connection status and account metadata."""
        pass

    @abstractmethod
    async def disconnect(self, business_id: str) -> bool:
        """Revokes tokens and sets integration status to disconnected."""
        pass

    @abstractmethod
    async def sync(self, business_id: str) -> Dict[str, Any]:
        """Performs data synchronization."""
        pass

    @abstractmethod
    async def health_check(self, business_id: str) -> Dict[str, Any]:
        """Validates token freshness and connectivity."""
        pass
