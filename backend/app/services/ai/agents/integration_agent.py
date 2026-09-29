import json
from typing import Dict, Any, List
from app.services.ai.agents.base_agent import BaseAgent
from app.services.integrations.manager import integration_manager
from app.services.integrations.google.gmail import GmailIntegrationProvider
from app.services.integrations.google.calendar import GoogleCalendarIntegrationProvider
from app.services.integrations.website.webhook import WebsiteLeadsIntegrationProvider

class IntegrationAgent(BaseAgent):
    """
    Connected Workspace & External Integrations Agent.
    Coordinates email intelligence (Gmail), scheduling (Google Calendar), WhatsApp, and website lead capture.
    """

    def __init__(self, provider):
        super().__init__(provider)
        self.gmail = GmailIntegrationProvider()
        self.calendar = GoogleCalendarIntegrationProvider()

    @property
    def agent_id(self) -> str:
        return "integrations"

    @property
    def system_prompt(self) -> str:
        return (
            "You are the SoloCEO Connected Workspace Agent.\n"
            "Your role is to check external application connections (Gmail, Calendar, WhatsApp, Website Webhooks), "
            "summarize communication threads, schedule meetings, and prepare outreach drafts.\n"
            "Rules:\n"
            "1. If a requested integration is not connected, clearly inform the user with a 'Connect' action.\n"
            "2. Never send emails or book calendar slots without user confirmation."
        )

    async def process(
        self,
        query: str,
        business_id: str,
        business_name: str,
        context_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        q = query.lower()

        # 1. Calendar intent
        if any(w in q for w in ["calendar", "meeting", "schedule", "tomorrow", "events"]):
            cal_status = await self.calendar.get_status(business_id)
            is_connected = cal_status.get("status") == "connected"

            if not is_connected:
                msg = (
                    "**Google Calendar is currently not connected.**\n\n"
                    "Connect your Google Calendar in **More → Integrations** to allow SoloCEO to check your schedule, "
                    "detect conflicts, and book client meetings automatically."
                )
                return {
                    "message": msg,
                    "agent": "integrations",
                    "confidence": 0.98,
                    "structured_data": {"provider": "google_calendar", "status": cal_status.get("status")},
                    "action_cards": [
                        {
                            "type": "integration_card",
                            "title": "Connect Google Calendar",
                            "description": "Enable automated schedule syncing and meeting booking.",
                            "primary_action_label": "Connect",
                            "action_payload": {"provider": "google_calendar", "action": "NAVIGATE_INTEGRATION"}
                        }
                    ],
                    "requires_confirmation": False
                }

            events = await self.calendar.get_events(business_id=business_id, limit=5)
            msg = f"You have **{len(events)} upcoming events** on your connected Google Calendar."
            return {
                "message": msg,
                "agent": "integrations",
                "confidence": 0.95,
                "structured_data": {"events": events},
                "action_cards": [],
                "requires_confirmation": False
            }

        # 2. Email / Gmail intent
        if any(w in q for w in ["email", "gmail", "inbox", "emailed"]):
            gmail_status = await self.gmail.get_status(business_id)
            is_connected = gmail_status.get("status") == "connected"

            if not is_connected:
                msg = (
                    "**Gmail is currently not connected.**\n\n"
                    "Connect your Gmail in **More → Integrations** to enable email intelligence, "
                    "track customer message threads, and draft AI follow-ups."
                )
                return {
                    "message": msg,
                    "agent": "integrations",
                    "confidence": 0.98,
                    "structured_data": {"provider": "gmail", "status": gmail_status.get("status")},
                    "action_cards": [
                        {
                            "type": "integration_card",
                            "title": "Connect Gmail",
                            "description": "Enable email thread tracking and automated response drafting.",
                            "primary_action_label": "Connect",
                            "action_payload": {"provider": "gmail", "action": "NAVIGATE_INTEGRATION"}
                        }
                    ],
                    "requires_confirmation": False
                }

            messages = await self.gmail.get_recent_emails(business_id=business_id, limit=5)
            msg = f"Found **{len(messages)} recent emails** in your connected Gmail account ({gmail_status.get('account_email')})."
            return {
                "message": msg,
                "agent": "integrations",
                "confidence": 0.95,
                "structured_data": {"emails": messages},
                "action_cards": [],
                "requires_confirmation": False
            }

        # 3. Integrations status overview
        statuses = await integration_manager.list_integrations_status(business_id=business_id)
        msg = f"**Connected Workspace Integrations for {business_name}:**\n\n"
        for s in statuses:
            status_text = s['status'].upper().replace('_', ' ')
            msg += f"• **{s['display_name']}**: [{status_text}]\n"

        return {
            "message": msg,
            "agent": "integrations",
            "confidence": 0.95,
            "structured_data": {"integrations": statuses},
            "action_cards": [
                {
                    "type": "integration_hub",
                    "title": "Manage Integrations",
                    "description": "Configure Gmail, Calendar, WhatsApp, and Website Webhooks.",
                    "primary_action_label": "Open Hub",
                    "action_payload": {"action": "NAVIGATE_INTEGRATIONS_HUB"}
                }
            ],
            "requires_confirmation": False
        }
