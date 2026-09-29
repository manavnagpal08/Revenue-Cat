import uuid
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone, timedelta
from app.services.billing.plan_config import get_plan_by_tier
from app.core.supabase_client import get_supabase_client

logger = logging.getLogger("soloceo_usage_service")

# In-memory stores for multi-tenant billing and usage
in_memory_subscriptions: Dict[str, Dict[str, Any]] = {}
in_memory_usage_records: List[Dict[str, Any]] = []
in_memory_billing_history: List[Dict[str, Any]] = []

def get_now_utc() -> datetime:
    return datetime.now(timezone.utc)

class UsageService:
    """
    Manages AI credit consumption, automation limits, and usage calculation for multi-tenant workspaces.
    """

    @classmethod
    def get_or_create_subscription(cls, business_id: str, user_id: Optional[str] = "00000000-0000-0000-0000-000000000001") -> Dict[str, Any]:
        """Retrieves or creates initial business subscription."""
        if business_id in in_memory_subscriptions:
            return in_memory_subscriptions[business_id]

        client = get_supabase_client()
        if client:
            try:
                res = client.table("subscriptions").select("*").eq("business_id", business_id).single().execute()
                if res.data:
                    in_memory_subscriptions[business_id] = res.data
                    return res.data
            except Exception:
                pass

        now = get_now_utc()
        default_sub = {
            "id": str(uuid.uuid4()),
            "business_id": business_id,
            "user_id": user_id,
            "tier": "starter",
            "status": "active",
            "provider": "revenuecat",
            "provider_customer_id": f"rc_cust_{business_id[:8]}",
            "provider_subscription_id": f"rc_sub_{business_id[:8]}",
            "active_entitlements": ["starter_access"],
            "current_period_start": now.isoformat(),
            "current_period_end": (now + timedelta(days=30)).isoformat(),
            "cancel_at_period_end": False,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        in_memory_subscriptions[business_id] = default_sub
        return default_sub

    @classmethod
    def get_used_ai_credits_for_period(cls, business_id: str, start_date: Optional[datetime] = None) -> int:
        """Calculates total AI credits consumed in the current period."""
        if start_date is None:
            sub = cls.get_or_create_subscription(business_id)
            period_str = sub.get("current_period_start")
            start_date = datetime.fromisoformat(period_str) if period_str else get_now_utc() - timedelta(days=30)

        records = [
            r for r in in_memory_usage_records
            if r.get("business_id") == business_id and r.get("created_at") >= start_date
        ]
        return sum(r.get("credits_consumed", 1) for r in records)

    @classmethod
    def check_ai_credits(cls, business_id: str, credits_needed: int = 1) -> Tuple[bool, int, int]:
        """
        Returns (has_sufficient_credits, remaining_credits, total_limit).
        """
        sub = cls.get_or_create_subscription(business_id)
        tier = sub.get("tier", "starter")
        status = sub.get("status", "active")

        if status not in ["active", "trialing"]:
            return False, 0, 0

        plan = get_plan_by_tier(tier)
        total_credits = plan.get("ai_credits_monthly", 50)
        used_credits = cls.get_used_ai_credits_for_period(business_id)
        remaining = max(0, total_credits - used_credits)

        return (remaining >= credits_needed), remaining, total_credits

    @classmethod
    def consume_ai_credits(
        cls,
        business_id: str,
        user_id: Optional[str],
        action_type: str,
        credits: int = 1,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Consumes AI credits and logs the usage record.
        Raises ValueError if credits are exhausted.
        """
        has_credits, remaining, total = cls.check_ai_credits(business_id, credits_needed=credits)
        if not has_credits:
            raise ValueError(
                f"AI_CREDITS_EXHAUSTED: You have {remaining} credits remaining out of {total}. Upgrade your plan to continue using SoloCEO AI."
            )

        now = get_now_utc()
        record_id = str(uuid.uuid4())
        usage_record = {
            "id": record_id,
            "business_id": business_id,
            "user_id": user_id,
            "action_type": action_type,
            "credits_consumed": credits,
            "metadata": metadata or {},
            "created_at": now
        }
        in_memory_usage_records.append(usage_record)

        # Persist to Supabase if available
        client = get_supabase_client()
        if client:
            try:
                client.table("ai_usage").insert({
                    "id": record_id,
                    "business_id": business_id,
                    "user_id": user_id,
                    "action_type": action_type,
                    "credits_consumed": credits
                }).execute()
            except Exception as e:
                logger.warning(f"Error persisting ai_usage in Supabase: {e}")

        new_remaining = remaining - credits
        return {
            "success": True,
            "credits_consumed": credits,
            "credits_remaining": new_remaining,
            "total_limit": total
        }

    @classmethod
    def check_automation_limit(cls, business_id: str, active_count: int) -> Tuple[bool, int]:
        """Checks whether the business has reached its automation workflows limit."""
        sub = cls.get_or_create_subscription(business_id)
        tier = sub.get("tier", "starter")
        plan = get_plan_by_tier(tier)
        limit = plan.get("automations_limit", 5)
        return (active_count < limit), limit

    @classmethod
    def get_usage_summary(cls, business_id: str) -> Dict[str, Any]:
        """Returns structured summary of AI credits and automation usage."""
        sub = cls.get_or_create_subscription(business_id)
        tier = sub.get("tier", "starter")
        plan = get_plan_by_tier(tier)

        period_start_str = sub.get("current_period_start")
        period_start = datetime.fromisoformat(period_start_str) if period_start_str else get_now_utc() - timedelta(days=30)
        period_end_str = sub.get("current_period_end")
        period_end = datetime.fromisoformat(period_end_str) if period_end_str else get_now_utc() + timedelta(days=30)

        total_credits = plan.get("ai_credits_monthly", 50)
        used_credits = cls.get_used_ai_credits_for_period(business_id, start_date=period_start)
        remaining_credits = max(0, total_credits - used_credits)
        credit_pct = round((used_credits / total_credits) * 100.0, 1) if total_credits > 0 else 0.0

        # Import locally to avoid circular import
        from app.services.automation.registry import in_memory_automations
        active_autos = sum(1 for a in in_memory_automations.values() if a.get("business_id") == business_id and a.get("enabled"))
        auto_limit = plan.get("automations_limit", 5)
        auto_pct = round((active_autos / auto_limit) * 100.0, 1) if auto_limit > 0 else 0.0

        # Breakdown by action type
        by_action: Dict[str, int] = {}
        for r in in_memory_usage_records:
            if r.get("business_id") == business_id and r.get("created_at") >= period_start:
                act = r.get("action_type", "general_ai")
                by_action[act] = by_action.get(act, 0) + r.get("credits_consumed", 1)

        recent_items = [
            {
                "id": r["id"],
                "business_id": r["business_id"],
                "user_id": r.get("user_id"),
                "action_type": r["action_type"],
                "credits_consumed": r["credits_consumed"],
                "created_at": r["created_at"]
            }
            for r in reversed(in_memory_usage_records)
            if r.get("business_id") == business_id
        ][:15]

        return {
            "business_id": business_id,
            "plan_tier": tier,
            "period_start": period_start,
            "period_end": period_end,
            "ai_credits_total": total_credits,
            "ai_credits_used": used_credits,
            "ai_credits_remaining": remaining_credits,
            "ai_credits_percent": credit_pct,
            "automations_limit": auto_limit,
            "automations_active": active_autos,
            "automations_percent": auto_pct,
            "usage_by_action": by_action,
            "recent_usage_records": recent_items
        }


usage_service = UsageService()
