import logging
from datetime import datetime, timezone, timedelta, date
from typing import Dict, Any, List, Optional, Tuple
from app.core.supabase_client import get_supabase_client
from app.routers.invoices import _local_invoices
from app.routers.customers import _local_customers
from app.routers.leads import _local_leads
from app.routers.proposals import _local_proposals
from app.services.automation.registry import in_memory_logs
from app.services.billing.usage_service import in_memory_usage_records

logger = logging.getLogger("soloceo.analytics.data_fetcher")

def parse_iso_datetime(dt_val: Any) -> Optional[datetime]:
    if not dt_val:
        return None
    if isinstance(dt_val, datetime):
        if dt_val.tzinfo is None:
            return dt_val.replace(tzinfo=timezone.utc)
        return dt_val
    if isinstance(dt_val, date):
        return datetime(dt_val.year, dt_val.month, dt_val.day, tzinfo=timezone.utc)
    if isinstance(dt_val, str):
        try:
            # Replace Z with +00:00
            clean_str = dt_val.replace("Z", "+00:00")
            dt = datetime.fromisoformat(clean_str)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except Exception:
            try:
                # Try simple date parse
                d = date.fromisoformat(dt_val[:10])
                return datetime(d.year, d.month, d.day, tzinfo=timezone.utc)
            except Exception:
                return None
    return None

def get_time_range_bounds(time_frame: str, period_start: Optional[datetime] = None, period_end: Optional[datetime] = None) -> Tuple[datetime, datetime]:
    """Calculates start and end datetime bounds for standard or custom timeframe."""
    now = datetime.now(timezone.utc)
    tf = (time_frame or "30d").lower()

    if tf == "custom" and period_start and period_end:
        start = parse_iso_datetime(period_start) or (now - timedelta(days=30))
        end = parse_iso_datetime(period_end) or now
        return start, end

    if tf == "7d":
        return now - timedelta(days=7), now
    elif tf == "30d":
        return now - timedelta(days=30), now
    elif tf == "90d":
        return now - timedelta(days=90), now
    elif tf == "1y":
        return now - timedelta(days=365), now
    else:
        return now - timedelta(days=30), now

def fetch_business_data(business_id: str, start_dt: datetime, end_dt: datetime) -> Dict[str, List[Dict[str, Any]]]:
    """
    Fetches raw business entities (invoices, customers, leads, proposals, automation logs, ai usage)
    scoped to business_id.
    """
    client = get_supabase_client()
    invoices: List[Dict[str, Any]] = []
    customers: List[Dict[str, Any]] = []
    leads: List[Dict[str, Any]] = []
    proposals: List[Dict[str, Any]] = []
    automation_runs: List[Dict[str, Any]] = []
    ai_usage: List[Dict[str, Any]] = []

    if client is not None:
        try:
            inv_res = client.table("invoices").select("*, customer:customers(name)").eq("business_id", business_id).execute()
            if inv_res.data:
                invoices = inv_res.data
        except Exception as e:
            logger.warning(f"Error fetching invoices: {e}")

        try:
            cust_res = client.table("customers").select("*").eq("business_id", business_id).execute()
            if cust_res.data:
                customers = cust_res.data
        except Exception as e:
            logger.warning(f"Error fetching customers: {e}")

        try:
            lead_res = client.table("leads").select("*").eq("business_id", business_id).execute()
            if lead_res.data:
                leads = lead_res.data
        except Exception as e:
            logger.warning(f"Error fetching leads: {e}")

        try:
            prop_res = client.table("proposals").select("*").eq("business_id", business_id).execute()
            if prop_res.data:
                proposals = prop_res.data
        except Exception as e:
            logger.warning(f"Error fetching proposals: {e}")

        try:
            auto_res = client.table("automation_logs").select("*").eq("business_id", business_id).execute()
            if auto_res.data:
                automation_runs = auto_res.data
        except Exception as e:
            logger.warning(f"Error fetching automation logs: {e}")

    # Fallback to in-memory stores if empty/offline
    if not invoices:
        invoices = [inv for inv in _local_invoices.values() if inv.get("business_id") == business_id]
        if not invoices:
            # Seed fallback for default demo business
            invoices = [
                {
                    "id": "inv_1",
                    "business_id": business_id,
                    "customer_id": "c1",
                    "invoice_number": "INV-2026-001",
                    "status": "paid",
                    "total_amount": 120000.0,
                    "paid_amount": 120000.0,
                    "due_date": (datetime.now(timezone.utc) - timedelta(days=10)).date().isoformat(),
                    "created_at": (datetime.now(timezone.utc) - timedelta(days=25)).isoformat(),
                    "paid_at": (datetime.now(timezone.utc) - timedelta(days=15)).isoformat(),
                    "customer": {"name": "Acme Interiors"}
                },
                {
                    "id": "inv_2",
                    "business_id": business_id,
                    "customer_id": "c2",
                    "invoice_number": "INV-2026-002",
                    "status": "sent",
                    "total_amount": 45000.0,
                    "paid_amount": 0.0,
                    "due_date": (datetime.now(timezone.utc) + timedelta(days=5)).date().isoformat(),
                    "created_at": (datetime.now(timezone.utc) - timedelta(days=12)).isoformat(),
                    "customer": {"name": "Zenith Corp"}
                },
                {
                    "id": "inv_3",
                    "business_id": business_id,
                    "customer_id": "c3",
                    "invoice_number": "INV-2026-003",
                    "status": "overdue",
                    "total_amount": 85000.0,
                    "paid_amount": 0.0,
                    "due_date": (datetime.now(timezone.utc) - timedelta(days=5)).date().isoformat(),
                    "created_at": (datetime.now(timezone.utc) - timedelta(days=20)).isoformat(),
                    "customer": {"name": "Apex Global"}
                }
            ]

    if not customers:
        customers = [c for c in _local_customers.values() if c.get("business_id") == business_id]
        if not customers:
            customers = [
                {
                    "id": "c1",
                    "business_id": business_id,
                    "name": "Vikram Mehta",
                    "company_name": "Acme Interiors",
                    "email": "vikram@acmeinteriors.com",
                    "status": "active",
                    "total_revenue": 120000.0,
                    "last_interaction_at": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
                    "created_at": (datetime.now(timezone.utc) - timedelta(days=40)).isoformat()
                },
                {
                    "id": "c2",
                    "business_id": business_id,
                    "name": "Pooja Hegde",
                    "company_name": "Zenith Corp",
                    "email": "pooja@zenith.in",
                    "status": "active",
                    "total_revenue": 45000.0,
                    "last_interaction_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
                    "created_at": (datetime.now(timezone.utc) - timedelta(days=25)).isoformat()
                },
                {
                    "id": "c3",
                    "business_id": business_id,
                    "name": "Arjun Singhal",
                    "company_name": "Apex Global",
                    "email": "arjun@apex.com",
                    "status": "active",
                    "total_revenue": 85000.0,
                    "last_interaction_at": (datetime.now(timezone.utc) - timedelta(days=35)).isoformat(),
                    "created_at": (datetime.now(timezone.utc) - timedelta(days=60)).isoformat()
                }
            ]

    if not leads:
        leads = [l for l in _local_leads.values() if l.get("business_id") == business_id]
        if not leads:
            leads = [
                {
                    "id": "l1",
                    "business_id": business_id,
                    "title": "Brand Redesign & Suite",
                    "company": "Acme Interiors",
                    "status": "won",
                    "estimated_value": 120000.0,
                    "source": "website",
                    "created_at": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
                },
                {
                    "id": "l2",
                    "business_id": business_id,
                    "title": "AI Workflow Automation Suite",
                    "company": "Zenith Corp",
                    "status": "proposal",
                    "estimated_value": 75000.0,
                    "source": "referral",
                    "created_at": (datetime.now(timezone.utc) - timedelta(days=15)).isoformat()
                },
                {
                    "id": "l3",
                    "business_id": business_id,
                    "title": "E-Commerce App & Payment Ops",
                    "company": "Apex Global",
                    "status": "negotiation",
                    "estimated_value": 180000.0,
                    "source": "direct",
                    "created_at": (datetime.now(timezone.utc) - timedelta(days=8)).isoformat()
                },
                {
                    "id": "l4",
                    "business_id": business_id,
                    "title": "Custom CRM Portal",
                    "company": "Nova Labs",
                    "status": "qualified",
                    "estimated_value": 90000.0,
                    "source": "website",
                    "created_at": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
                }
            ]

    if not proposals:
        proposals = [p for p in _local_proposals.values() if p.get("business_id") == business_id]
        if not proposals:
            proposals = [
                {
                    "id": "p1",
                    "business_id": business_id,
                    "title": "Brand Strategy & App Implementation",
                    "total_amount": 120000.0,
                    "status": "accepted",
                    "created_at": (datetime.now(timezone.utc) - timedelta(days=28)).isoformat()
                },
                {
                    "id": "p2",
                    "business_id": business_id,
                    "title": "Operations Automation Engine",
                    "total_amount": 75000.0,
                    "status": "sent",
                    "created_at": (datetime.now(timezone.utc) - timedelta(days=10)).isoformat()
                }
            ]

    if not automation_runs:
        automation_runs = [log for log in in_memory_logs if log.get("business_id") == business_id]
        if not automation_runs:
            automation_runs = [
                {
                    "id": "log_1",
                    "business_id": business_id,
                    "workflow_id": "wf_1",
                    "workflow_name": "Overdue Invoice Follow-up",
                    "status": "success",
                    "triggered_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
                    "execution_time_ms": 420
                },
                {
                    "id": "log_2",
                    "business_id": business_id,
                    "workflow_id": "wf_2",
                    "workflow_name": "Inbound Lead Auto-Responder",
                    "status": "success",
                    "triggered_at": (datetime.now(timezone.utc) - timedelta(days=4)).isoformat(),
                    "execution_time_ms": 310
                },
                {
                    "id": "log_3",
                    "business_id": business_id,
                    "workflow_id": "wf_3",
                    "workflow_name": "Weekly Briefing Dispatch",
                    "status": "success",
                    "triggered_at": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat(),
                    "execution_time_ms": 890
                }
            ]

    ai_usage = [rec for rec in in_memory_usage_records if rec.get("business_id") == business_id]

    return {
        "invoices": invoices,
        "customers": customers,
        "leads": leads,
        "proposals": proposals,
        "automation_runs": automation_runs,
        "ai_usage": ai_usage,
    }
