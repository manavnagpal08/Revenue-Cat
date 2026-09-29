from typing import Dict, Any, List

PLANS_CONFIG: Dict[str, Dict[str, Any]] = {
    "free": {
        "id": "free",
        "name": "Free Trial",
        "price_monthly": 0.0,
        "currency": "INR",
        "currency_symbol": "₹",
        "ai_credits_monthly": 15,
        "automations_limit": 2,
        "included_integrations": ["website_leads"],
        "features": [
            "15 AI Credits / month",
            "2 Active Automated Workflows",
            "Sales & Finance AI Agents",
            "Website Lead Ingestion Webhook",
            "Basic Pipeline & Invoicing",
        ],
        "description": "Get started with fundamental AI business assistance.",
        "is_popular": False,
        "revenuecat_product_id": None,
    },
    "starter": {
        "id": "starter",
        "name": "Starter",
        "price_monthly": 499.0,
        "currency": "INR",
        "currency_symbol": "₹",
        "ai_credits_monthly": 50,
        "automations_limit": 5,
        "included_integrations": ["gmail", "google_calendar", "website_leads"],
        "features": [
            "50 AI Credits / month",
            "5 Active Automated Workflows",
            "All AI Agents (Sales, Finance, Proposals, Support)",
            "Gmail & Calendar Integrations",
            "Human-in-the-Loop Safe Approvals",
            "Customer & Pipeline Management",
        ],
        "description": "Essential operations and AI automation for solo freelancers.",
        "is_popular": False,
        "revenuecat_product_id": "soloceo_starter_monthly",
    },
    "business": {
        "id": "business",
        "name": "Business",
        "price_monthly": 1499.0,
        "currency": "INR",
        "currency_symbol": "₹",
        "ai_credits_monthly": 250,
        "automations_limit": 25,
        "included_integrations": ["gmail", "google_calendar", "whatsapp", "website_leads"],
        "features": [
            "250 AI Credits / month",
            "25 Active Automated Workflows",
            "WhatsApp Business Cloud API",
            "Executive Morning Briefings",
            "Proposal to Invoice Automated Pipeline",
            "Priority AI Supervisor Reasoning",
            "Advanced Analytics & Trends",
        ],
        "description": "Complete AI business operating suite for growing agencies.",
        "is_popular": True,
        "revenuecat_product_id": "soloceo_business_monthly",
    },
    "pro": {
        "id": "pro",
        "name": "Pro",
        "price_monthly": 2999.0,
        "currency": "INR",
        "currency_symbol": "₹",
        "ai_credits_monthly": 1000,
        "automations_limit": 250,
        "included_integrations": ["gmail", "google_calendar", "whatsapp", "website_leads", "crm"],
        "features": [
            "1,000 AI Credits / month",
            "Unlimited Workflow Rules (250+)",
            "Dedicated High-Throughput AI Agents",
            "Multi-Channel Automated Campaigns",
            "White-Label Invoices & Estimates",
            "Real-Time Webhook Dispatches",
            "VIP Dedicated Support",
        ],
        "description": "Maximum power, highest credit allowances, and unlimited workflows.",
        "is_popular": False,
        "revenuecat_product_id": "soloceo_pro_monthly",
    },
}

def get_all_plans() -> List[Dict[str, Any]]:
    return list(PLANS_CONFIG.values())

def get_plan_by_tier(tier: str) -> Dict[str, Any]:
    return PLANS_CONFIG.get(tier.lower(), PLANS_CONFIG["free"])

def map_product_id_to_tier(product_id: str) -> str:
    for tier, cfg in PLANS_CONFIG.items():
        if cfg.get("revenuecat_product_id") == product_id:
            return tier
    return "starter"
