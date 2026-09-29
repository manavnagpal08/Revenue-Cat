from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class CRMProvider(ABC):
    """Abstract generic CRM provider for external platforms like HubSpot, Zoho, Salesforce."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    async def get_contacts(self, business_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_deals(self, business_id: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def sync_contacts_to_soloceo(self, business_id: str) -> Dict[str, Any]:
        pass
