import uuid
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.services.integrations.base import IntegrationProvider
from app.services.integrations.google.oauth import in_memory_integrations
from app.core.config import settings
from app.core.supabase_client import get_supabase
from app.models.schemas import WebsiteLeadWebhookPayload
from app.routers.leads import _local_leads, _local_activities
from app.routers.customers import _local_customers

logger = logging.getLogger("soloceo_website_webhook")

class WebsiteLeadsIntegrationProvider(IntegrationProvider):
    """Website Lead Capture / Inbound Webhook Provider."""

    @property
    def provider_id(self) -> str:
        return "website_leads"

    @property
    def display_name(self) -> str:
        return "Website Leads Webhook"

    @property
    def description(self) -> str:
        return "Automatically ingest new inquiries, contact form submissions, and quotes from your website."

    async def get_auth_url(self, business_id: str, redirect_uri: str, state: str) -> str:
        # Returns the endpoint documentation / webhook URL
        return f"{settings.GOOGLE_REDIRECT_URI.replace('/api/integrations/google/callback', '')}/api/integrations/webhooks/leads/{business_id}"

    async def handle_oauth_callback(self, business_id: str, code: str, redirect_uri: str) -> Dict[str, Any]:
        return {"status": "connected", "provider": "website_leads"}

    async def get_status(self, business_id: str) -> Dict[str, Any]:
        supabase = get_supabase()
        if supabase:
            try:
                res = supabase.table("integrations").select("*").eq("business_id", business_id).eq("provider", "website_leads").single().execute()
                if res.data:
                    return res.data
            except Exception:
                pass

        record = in_memory_integrations.get(f"{business_id}:website_leads")
        if record:
            return record

        return {
            "business_id": business_id,
            "provider": "website_leads",
            "status": "connected",
            "account_name": "Inbound Website Webhook",
            "account_email": None,
            "webhook_secret": settings.WEBHOOK_SIGNING_SECRET,
            "last_error": None
        }

    async def disconnect(self, business_id: str) -> bool:
        record_id = f"{business_id}:website_leads"
        if record_id in in_memory_integrations:
            in_memory_integrations[record_id]["status"] = "disconnected"
        return True

    async def sync(self, business_id: str) -> Dict[str, Any]:
        return {
            "success": True,
            "provider": "website_leads",
            "status": "connected",
            "message": "Webhook listener is active."
        }

    async def health_check(self, business_id: str) -> Dict[str, Any]:
        return {
            "provider": "website_leads",
            "status": "connected",
            "healthy": True
        }

    async def ingest_lead(self, business_id: str, payload: WebsiteLeadWebhookPayload) -> Dict[str, Any]:
        """
        Processes inbound webhook payload, creates a real Lead, associates Customer, and logs activity.
        """
        supabase = get_supabase()
        lead_id = str(uuid.uuid4())
        cust_id = None

        # 1. Search or create customer
        if payload.email or payload.name:
            if supabase:
                try:
                    c_res = supabase.table("customers").select("id").eq("business_id", business_id).eq("email", payload.email).execute() if payload.email else None
                    if c_res and c_res.data:
                        cust_id = c_res.data[0]["id"]
                    else:
                        # Create customer
                        new_c = {
                            "id": str(uuid.uuid4()),
                            "business_id": business_id,
                            "name": payload.name,
                            "company_name": payload.company,
                            "email": payload.email,
                            "phone": payload.phone,
                            "status": "lead"
                        }
                        supabase.table("customers").insert(new_c).execute()
                        cust_id = new_c["id"]
                except Exception as e:
                    logger.warning(f"Error handling customer in webhook: {e}")

        # 2. Create Lead
        lead_title = f"Inquiry from {payload.name}" + (f" ({payload.company})" if payload.company else "")
        lead_record = {
            "id": lead_id,
            "business_id": business_id,
            "customer_id": cust_id,
            "title": lead_title,
            "contact_name": payload.name,
            "email": payload.email,
            "phone": payload.phone,
            "company": payload.company,
            "value": payload.estimated_budget or 25000.0,
            "source": payload.source or "website_contact_form",
            "status": "new",
            "priority": "high",
            "probability": 25,
            "notes": payload.message,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

        if supabase:
            try:
                supabase.table("leads").insert(lead_record).execute()
                # Log Activity
                supabase.table("lead_activities").insert({
                    "id": str(uuid.uuid4()),
                    "business_id": business_id,
                    "lead_id": lead_id,
                    "activity_type": "inbound_webhook",
                    "title": "Website Form Submission",
                    "description": payload.message or "Received inquiry from website contact form."
                }).execute()
                # Record integration event
                supabase.table("integration_events").insert({
                    "id": str(uuid.uuid4()),
                    "business_id": business_id,
                    "event_type": "website_lead_created",
                    "external_event_id": f"web_{lead_id}",
                    "payload": payload.model_dump(),
                    "processed": True
                }).execute()
            except Exception as e:
                logger.warning(f"Error persisting webhook lead in Supabase: {e}")

        _local_leads[lead_id] = lead_record

        # 3. Trigger active automations matching 'website_lead_received'
        try:
            from app.services.automation.engine import automation_engine
            active_autos = await automation_engine.list_automations(business_id=business_id)
            for a in active_autos:
                if a.get("enabled") and a.get("trigger_type") == "website_lead_received":
                    await automation_engine.execute_automation_run(
                        automation_id=a["id"],
                        business_id=business_id,
                        event_data={
                            "lead_id": lead_id,
                            "customer_id": cust_id,
                            "contact_name": payload.name,
                            "email": payload.email,
                            "value": payload.estimated_budget or 25000.0,
                            "notes": payload.message
                        },
                        event_dedup_key=f"website_lead_{lead_id}_{a['id']}"
                    )
        except Exception as e:
            logger.warning(f"Error triggering automation for website lead: {e}")

        return {
            "success": True,
            "lead_id": lead_id,
            "customer_id": cust_id,
            "lead": lead_record,
            "message": f"Inbound lead '{lead_title}' captured and added to pipeline."
        }

