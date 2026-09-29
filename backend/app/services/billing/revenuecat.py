import uuid
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from app.core.config import settings
from app.services.billing.plan_config import map_product_id_to_tier, get_plan_by_tier
from app.services.billing.usage_service import (
    in_memory_subscriptions,
    in_memory_billing_history,
    get_now_utc
)
from app.core.supabase_client import get_supabase_client

logger = logging.getLogger("soloceo_revenuecat")

class RevenueCatService:
    """
    Handles RevenueCat webhook events, subscription lifecycle, and customer mapping.
    """

    @classmethod
    def verify_webhook_auth(cls, auth_header: Optional[str]) -> bool:
        """Verifies the RevenueCat Webhook authorization header."""
        secret = settings.REVENUECAT_WEBHOOK_SECRET
        if not secret:
            # If not configured, allow local testing
            return True
        if not auth_header:
            return False
        # Match 'Bearer <secret>' or raw '<secret>'
        clean_header = auth_header.replace("Bearer ", "").strip()
        return clean_header == secret.strip()

    @classmethod
    async def process_webhook_event(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes inbound RevenueCat webhook payload:
        INITIAL_PURCHASE, RENEWAL, PRODUCT_CHANGE, CANCELLATION, EXPIRATION, etc.
        """
        event = payload.get("event", {})
        event_type = event.get("type", "UNKNOWN")
        app_user_id = event.get("app_user_id", "")
        product_id = event.get("product_id", "")
        purchased_at_ms = event.get("purchased_at_ms")
        expiration_at_ms = event.get("expiration_at_ms")

        logger.info(f"Processing RevenueCat event: {event_type} for user: {app_user_id}")

        # Resolve Business ID from app_user_id (e.g. 'biz_00000000-0000-0000-0000-000000000002')
        business_id = "00000000-0000-0000-0000-000000000002"
        if app_user_id.startswith("biz_"):
            business_id = app_user_id.replace("biz_", "")
        elif ":" in app_user_id:
            business_id = app_user_id.split(":")[0]

        tier = map_product_id_to_tier(product_id)
        plan = get_plan_by_tier(tier)

        now = get_now_utc()
        period_start = datetime.fromtimestamp(purchased_at_ms / 1000.0, timezone.utc) if purchased_at_ms else now
        period_end = datetime.fromtimestamp(expiration_at_ms / 1000.0, timezone.utc) if expiration_at_ms else (now + timedelta(days=30))

        sub = in_memory_subscriptions.get(business_id, {})
        sub["business_id"] = business_id
        sub["tier"] = tier
        sub["provider"] = "revenuecat"
        sub["provider_customer_id"] = app_user_id
        sub["provider_subscription_id"] = event.get("id", str(uuid.uuid4()))
        sub["current_period_start"] = period_start.isoformat()
        sub["current_period_end"] = period_end.isoformat()
        sub["updated_at"] = now.isoformat()

        if event_type in ["INITIAL_PURCHASE", "RENEWAL", "PRODUCT_CHANGE"]:
            sub["status"] = "active"
            sub["cancel_at_period_end"] = False
            sub["active_entitlements"] = [f"{tier}_access"]

            # Record Billing Invoice
            invoice_record = {
                "id": str(uuid.uuid4()),
                "business_id": business_id,
                "amount": plan.get("price_monthly", 499.0),
                "currency": "INR",
                "status": "paid",
                "plan_tier": tier,
                "billing_period_start": period_start,
                "billing_period_end": period_end,
                "provider": "revenuecat",
                "provider_event_id": event.get("id"),
                "invoice_pdf_url": None,
                "created_at": now
            }
            in_memory_billing_history.append(invoice_record)

        elif event_type == "CANCELLATION":
            sub["cancel_at_period_end"] = True
            sub["status"] = "active"  # Remains active until expiration_at_ms

        elif event_type == "EXPIRATION":
            sub["status"] = "expired"
            sub["tier"] = "free"
            sub["active_entitlements"] = ["free_access"]

        in_memory_subscriptions[business_id] = sub

        # Persist to Supabase if available
        client = get_supabase_client()
        if client:
            try:
                client.table("subscriptions").upsert({
                    "business_id": business_id,
                    "tier": sub["tier"],
                    "status": sub["status"],
                    "revenuecat_customer_id": app_user_id,
                    "active_entitlements": sub["active_entitlements"],
                    "current_period_start": sub["current_period_start"],
                    "current_period_end": sub["current_period_end"],
                    "updated_at": now.isoformat()
                }).execute()
            except Exception as e:
                logger.warning(f"Error persisting RevenueCat subscription in Supabase: {e}")

        return {
            "success": True,
            "business_id": business_id,
            "event_type": event_type,
            "tier": sub.get("tier"),
            "status": sub.get("status")
        }


revenuecat_service = RevenueCatService()
