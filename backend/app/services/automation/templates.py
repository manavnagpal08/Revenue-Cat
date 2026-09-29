from typing import List, Dict, Any

SYSTEM_AUTOMATION_TEMPLATES: List[Dict[str, Any]] = [
    {
        "id": "tpl-sales-inactive-lead",
        "name": "Follow up inactive leads",
        "description": "Auto-send personalized follow-up emails to leads who haven't replied in 7 days.",
        "category": "sales",
        "trigger_type": "lead_inactive",
        "is_system_template": True,
        "configuration": {
            "trigger_config": {
                "inactivity_days": 7,
                "check_interval": "daily"
            },
            "condition_config": {
                "rules": [
                    {"field": "lead.status", "operator": "!=", "value": "lost"},
                    {"field": "lead.status", "operator": "!=", "value": "won"},
                    {"field": "lead.status", "operator": "!=", "value": "converted"}
                ],
                "match_type": "all"
            },
            "agent_type": "sales",
            "action_config": {
                "channel": "email",
                "action_type": "send_email",
                "prompt": "Write a friendly and professional follow-up email for a lead who hasn't replied in 7 days. Reference their project requirements and suggest a brief 10-minute touchpoint.",
                "tone": "friendly",
                "requires_approval": True,
                "notify_on_complete": True
            },
            "requires_approval": True
        }
    },
    {
        "id": "tpl-finance-overdue-invoice",
        "name": "Invoice reminders",
        "description": "Send automated payment reminders when an invoice becomes overdue.",
        "category": "finance",
        "trigger_type": "invoice_overdue",
        "is_system_template": True,
        "configuration": {
            "trigger_config": {
                "days_past_due": 1,
                "repeat_interval_days": 7
            },
            "condition_config": {
                "rules": [
                    {"field": "invoice.status", "operator": "==", "value": "overdue"},
                    {"field": "invoice.total_amount", "operator": ">", "value": 0}
                ],
                "match_type": "all"
            },
            "agent_type": "finance",
            "action_config": {
                "channel": "email",
                "action_type": "send_email",
                "prompt": "Generate a polite but clear payment reminder email for an overdue invoice with bank transfer details and due date.",
                "tone": "professional",
                "requires_approval": True,
                "notify_on_complete": True
            },
            "requires_approval": True
        }
    },
    {
        "id": "tpl-sales-new-lead-flow",
        "name": "New website lead flow",
        "description": "Create lead, qualify customer interest with AI, and notify you instantly.",
        "category": "sales",
        "trigger_type": "website_lead_received",
        "is_system_template": True,
        "configuration": {
            "trigger_config": {
                "source": "website_contact_form"
            },
            "condition_config": {
                "rules": [
                    {"field": "lead.email", "operator": "is_not_empty", "value": None}
                ],
                "match_type": "all"
            },
            "agent_type": "sales",
            "action_config": {
                "channel": "notification",
                "action_type": "send_notification",
                "prompt": "Analyze incoming inquiry, score the priority (low/medium/high), extract budget expectations, and draft an immediate response.",
                "tone": "professional",
                "requires_approval": False,
                "notify_on_complete": True
            },
            "requires_approval": False
        }
    },
    {
        "id": "tpl-customer-welcome",
        "name": "New customer welcome",
        "description": "Send a warm welcome email to new clients and generate onboarding tasks.",
        "category": "customer",
        "trigger_type": "new_lead",
        "is_system_template": True,
        "configuration": {
            "trigger_config": {
                "event": "customer_created"
            },
            "condition_config": {
                "rules": [
                    {"field": "customer.status", "operator": "==", "value": "active"}
                ],
                "match_type": "all"
            },
            "agent_type": "customer_support",
            "action_config": {
                "channel": "email",
                "action_type": "send_email",
                "prompt": "Draft a personalized onboarding welcome email outlining timeline, kickoff steps, and contact points.",
                "tone": "friendly",
                "requires_approval": True,
                "notify_on_complete": True
            },
            "requires_approval": True
        }
    },
    {
        "id": "tpl-ops-meeting-prep",
        "name": "Meeting preparation",
        "description": "Get an AI briefing and past interaction summary 30 mins before customer meetings.",
        "category": "operations",
        "trigger_type": "calendar_event_upcoming",
        "is_system_template": True,
        "configuration": {
            "trigger_config": {
                "minutes_before": 30
            },
            "condition_config": {
                "rules": [
                    {"field": "event.attendees_count", "operator": ">", "value": 0}
                ],
                "match_type": "all"
            },
            "agent_type": "supervisor",
            "action_config": {
                "channel": "notification",
                "action_type": "send_notification",
                "prompt": "Synthesize client project status, open invoices, active proposals, and recent email discussions into a 1-minute executive meeting brief.",
                "tone": "direct",
                "requires_approval": False,
                "notify_on_complete": True
            },
            "requires_approval": False
        }
    },
    {
        "id": "tpl-ops-daily-brief",
        "name": "Daily business brief",
        "description": "Receive an executive morning brief with today's appointments, urgent invoices, and leads.",
        "category": "operations",
        "trigger_type": "daily_summary",
        "is_system_template": True,
        "configuration": {
            "trigger_config": {
                "time": "09:00",
                "timezone": "Asia/Kolkata"
            },
            "condition_config": {},
            "agent_type": "supervisor",
            "action_config": {
                "channel": "notification",
                "action_type": "send_notification",
                "prompt": "Generate a concise daily business overview highlighting 3 top revenue-generating actions for today.",
                "tone": "professional",
                "requires_approval": False,
                "notify_on_complete": True
            },
            "requires_approval": False
        }
    },
    {
        "id": "tpl-proposal-from-lead",
        "name": "Qualified Lead → Proposal Preparation",
        "description": "When a lead is marked qualified with high value, automatically generate a draft proposal.",
        "category": "proposals",
        "trigger_type": "lead_qualified",
        "is_system_template": True,
        "configuration": {
            "trigger_config": {
                "stage": "qualified"
            },
            "condition_config": {
                "rules": [
                    {"field": "lead.value", "operator": ">=", "value": 25000}
                ],
                "match_type": "all"
            },
            "agent_type": "proposal",
            "action_config": {
                "channel": "task",
                "action_type": "create_proposal",
                "prompt": "Draft an initial proposal outline with scope of deliverables and milestone pricing based on lead notes.",
                "tone": "persuasive",
                "requires_approval": True,
                "notify_on_complete": True
            },
            "requires_approval": True
        }
    },
    {
        "id": "tpl-finance-payment-received",
        "name": "Payment received thank-you",
        "description": "Send an official thank-you receipt and payment confirmation when invoice is paid.",
        "category": "finance",
        "trigger_type": "payment_received",
        "is_system_template": True,
        "configuration": {
            "trigger_config": {
                "event": "payment_recorded"
            },
            "condition_config": {},
            "agent_type": "finance",
            "action_config": {
                "channel": "email",
                "action_type": "send_email",
                "prompt": "Draft a receipt acknowledgment thanking the customer for timely payment and offering support.",
                "tone": "friendly",
                "requires_approval": True,
                "notify_on_complete": True
            },
            "requires_approval": True
        }
    }
]

def get_system_templates() -> List[Dict[str, Any]]:
    return SYSTEM_AUTOMATION_TEMPLATES

def get_template_by_id(template_id: str) -> Dict[str, Any]:
    for tpl in SYSTEM_AUTOMATION_TEMPLATES:
        if tpl["id"] == template_id:
            return tpl
    return None
