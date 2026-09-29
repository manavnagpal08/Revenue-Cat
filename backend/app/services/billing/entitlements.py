import logging
from typing import Dict, Any, List
from app.services.billing.plan_config import get_plan_by_tier

logger = logging.getLogger("soloceo_entitlements")

FEATURE_MATRIX: Dict[str, List[str]] = {
    "free": [
        "AI_COMMAND_CENTER",
        "AI_SALES_AGENT",
        "AI_FINANCE_AGENT",
        "AUTOMATIONS",
        "WEBSITE_LEADS_INTEGRATION"
    ],
    "starter": [
        "AI_COMMAND_CENTER",
        "AI_SALES_AGENT",
        "AI_FINANCE_AGENT",
        "AI_PROPOSAL_AGENT",
        "AI_CUSTOMER_AGENT",
        "AUTOMATIONS",
        "GMAIL_INTEGRATION",
        "CALENDAR_INTEGRATION",
        "WEBSITE_LEADS_INTEGRATION"
    ],
    "business": [
        "AI_COMMAND_CENTER",
        "AI_SALES_AGENT",
        "AI_FINANCE_AGENT",
        "AI_PROPOSAL_AGENT",
        "AI_CUSTOMER_AGENT",
        "AI_INTEGRATION_AGENT",
        "AUTOMATIONS",
        "ADVANCED_AUTOMATIONS",
        "GMAIL_INTEGRATION",
        "CALENDAR_INTEGRATION",
        "WHATSAPP_INTEGRATION",
        "WEBSITE_LEADS_INTEGRATION",
        "ADVANCED_ANALYTICS"
    ],
    "pro": [
        "AI_COMMAND_CENTER",
        "AI_SALES_AGENT",
        "AI_FINANCE_AGENT",
        "AI_PROPOSAL_AGENT",
        "AI_CUSTOMER_AGENT",
        "AI_INTEGRATION_AGENT",
        "AUTOMATIONS",
        "ADVANCED_AUTOMATIONS",
        "GMAIL_INTEGRATION",
        "CALENDAR_INTEGRATION",
        "WHATSAPP_INTEGRATION",
        "WEBSITE_LEADS_INTEGRATION",
        "CRM_INTEGRATION",
        "ADVANCED_ANALYTICS",
        "PRIORITY_AGENT_REASONING"
    ]
}

class EntitlementService:
    """Central service for checking feature access according to business plan tier."""

    @classmethod
    def get_tier_features(cls, tier: str) -> List[str]:
        return FEATURE_MATRIX.get(tier.lower(), FEATURE_MATRIX["free"])

    @classmethod
    def check_feature_access(cls, tier: str, feature_key: str) -> bool:
        features = cls.get_tier_features(tier)
        return feature_key.upper() in features


entitlement_service = EntitlementService()
