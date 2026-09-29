import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from app.core.supabase_client import get_supabase_client
from app.services.ai.tools.shared_data import (
    in_memory_customers,
    in_memory_leads,
    in_memory_invoices,
    in_memory_proposals,
)

logger = logging.getLogger("soloceo_automation_triggers")

SUPPORTED_TRIGGERS = [
    {
        "type": "lead_inactive",
        "category": "sales",
        "title": "Lead is inactive",
        "description": "No reply or contact for a specified number of days.",
        "icon": "user-x"
    },
    {
        "type": "website_lead_received",
        "category": "sales",
        "title": "New website lead",
        "description": "A new inquiry or quote request is captured from your website.",
        "icon": "globe"
    },
    {
        "type": "new_lead",
        "category": "sales",
        "title": "New customer / lead created",
        "description": "A new customer or prospect record is added to SoloCEO.",
        "icon": "user-plus"
    },
    {
        "type": "lead_qualified",
        "category": "sales",
        "title": "Lead marked qualified",
        "description": "A prospect moves to qualified or high-probability stage.",
        "icon": "check-circle"
    },
    {
        "type": "invoice_overdue",
        "category": "finance",
        "title": "Invoice is overdue",
        "description": "An invoice passes its payment due date without full settlement.",
        "icon": "alert-circle"
    },
    {
        "type": "payment_received",
        "category": "finance",
        "title": "Payment received",
        "description": "A client makes a full or partial invoice payment.",
        "icon": "dollar-sign"
    },
    {
        "type": "gmail_message_received",
        "category": "integrations",
        "title": "Email received",
        "description": "A new email from a client arrives in Gmail.",
        "icon": "mail"
    },
    {
        "type": "whatsapp_message_received",
        "category": "integrations",
        "title": "WhatsApp message",
        "description": "A new WhatsApp message is received from a customer.",
        "icon": "message-circle"
    },
    {
        "type": "calendar_event_upcoming",
        "category": "operations",
        "title": "Calendar event",
        "description": "Before an upcoming client meeting starts.",
        "icon": "calendar"
    },
    {
        "type": "daily_summary",
        "category": "operations",
        "title": "Daily business summary",
        "description": "Scheduled morning briefing of operations and metrics.",
        "icon": "sun"
    }
]

def get_supported_triggers() -> List[Dict[str, Any]]:
    return SUPPORTED_TRIGGERS


class TriggerEvaluator:
    """Evaluates whether an automation's trigger is matched by incoming events or data state."""

    @staticmethod
    def extract_trigger_context(trigger_type: str, business_id: str, event_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Builds a comprehensive business context dictionary for condition evaluation and AI agent prompts.
        """
        context: Dict[str, Any] = {
            "business_id": business_id,
            "trigger_type": trigger_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "lead": {},
            "customer": {},
            "invoice": {},
            "proposal": {},
            "event": event_data or {}
        }

        if event_data:
            if "lead" in event_data:
                context["lead"] = event_data["lead"]
            if "customer" in event_data:
                context["customer"] = event_data["customer"]
            if "invoice" in event_data:
                context["invoice"] = event_data["invoice"]
            if "proposal" in event_data:
                context["proposal"] = event_data["proposal"]

        # If data is not in event, pull from in-memory / DB for the business
        if not context["lead"] and trigger_type in ["lead_inactive", "lead_qualified", "new_lead"]:
            for _, lead in in_memory_leads.items():
                if lead.get("business_id") == business_id:
                    context["lead"] = lead
                    cust_id = lead.get("customer_id")
                    if cust_id and cust_id in in_memory_customers:
                        context["customer"] = in_memory_customers[cust_id]
                    break

        if not context["invoice"] and trigger_type in ["invoice_overdue", "payment_received"]:
            for _, inv in in_memory_invoices.items():
                if inv.get("business_id") == business_id and (inv.get("status") == "overdue" or trigger_type == "invoice_overdue"):
                    context["invoice"] = inv
                    cust_id = inv.get("customer_id")
                    if cust_id and cust_id in in_memory_customers:
                        context["customer"] = in_memory_customers[cust_id]
                    break

        return context
