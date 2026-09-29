from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from app.services.ai.providers import AIProvider

class BaseAgent(ABC):
    """Base class for specialized AI agents in SoloCEO."""
    
    def __init__(self, provider: AIProvider):
        self.provider = provider

    @property
    @abstractmethod
    def agent_id(self) -> str:
        """Identifier for the agent (e.g. 'sales', 'finance')."""
        pass

    @property
    @abstractmethod
    def system_prompt(self) -> str:
        """System prompt defining the agent's persona and responsibilities."""
        pass

    @abstractmethod
    async def process(
        self,
        query: str,
        business_id: str,
        business_name: str,
        context_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process user query with business context and produce structured results."""
        pass
