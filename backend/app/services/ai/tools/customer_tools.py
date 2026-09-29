from typing import Dict, Any, List, Optional
from app.core.supabase_client import get_supabase
from app.services.ai.tools.shared_data import (
    in_memory_customers,
    in_memory_invoices,
    in_memory_leads,
    in_memory_proposals
)

async def get_customers_tool(business_id: str, search: Optional[str] = None, limit: int = 50) -> Dict[str, Any]:
    """Retrieve customers for a business with optional name search."""
    supabase = get_supabase()
    customers = []
    
    if supabase:
        try:
            query = supabase.table("customers").select("*").eq("business_id", business_id)
            if search:
                query = query.ilike("name", f"%{search}%")
            res = query.order("total_revenue", desc=True).limit(limit).execute()
            customers = res.data or []
        except Exception:
            customers = [c for c in in_memory_customers.values() if c.get("business_id") == business_id]
            if search:
                customers = [c for c in customers if search.lower() in c.get("name", "").lower()]
    else:
        customers = [c for c in in_memory_customers.values() if c.get("business_id") == business_id]
        if search:
            customers = [c for c in customers if search.lower() in c.get("name", "").lower()]

    total_revenue = sum(float(c.get("total_revenue") or 0) for c in customers)
    return {
        "count": len(customers),
        "total_revenue": round(total_revenue, 2),
        "customers": customers[:limit]
    }


async def get_customer_summary_tool(business_id: str, query_name_or_id: str) -> Dict[str, Any]:
    """Retrieve a comprehensive 360-degree customer profile with all related deals, invoices, and proposals."""
    all_custs_res = await get_customers_tool(business_id=business_id, limit=100)
    customers = all_custs_res["customers"]

    target_customer = None
    for c in customers:
        if c.get("id") == query_name_or_id or query_name_or_id.lower() in c.get("name", "").lower() or query_name_or_id.lower() in (c.get("company_name") or "").lower():
            target_customer = c
            break

    if not target_customer:
        return {"found": False, "query": query_name_or_id, "customer": None}

    cid = target_customer["id"]

    # Gather related records
    supabase = get_supabase()
    invoices = []
    leads = []
    proposals = []

    if supabase:
        try:
            inv_res = supabase.table("invoices").select("*").eq("business_id", business_id).eq("customer_id", cid).execute()
            invoices = inv_res.data or []
            lead_res = supabase.table("leads").select("*").eq("business_id", business_id).eq("customer_id", cid).execute()
            leads = lead_res.data or []
            prop_res = supabase.table("proposals").select("*").eq("business_id", business_id).eq("customer_id", cid).execute()
            proposals = prop_res.data or []
        except Exception:
            invoices = [i for i in in_memory_invoices.values() if i.get("customer_id") == cid]
            leads = [l for l in in_memory_leads.values() if l.get("customer_id") == cid]
            proposals = [p for p in in_memory_proposals.values() if p.get("customer_id") == cid]
    else:
        invoices = [i for i in in_memory_invoices.values() if i.get("customer_id") == cid]
        leads = [l for l in in_memory_leads.values() if l.get("customer_id") == cid]
        proposals = [p for p in in_memory_proposals.values() if p.get("customer_id") == cid]

    total_billed = sum(float(i.get("total_amount") or 0) for i in invoices)
    total_paid = sum(float(i.get("paid_amount") or 0) for i in invoices)
    outstanding = max(0.0, total_billed - total_paid)

    return {
        "found": True,
        "customer": target_customer,
        "financial_summary": {
            "lifetime_revenue": float(target_customer.get("total_revenue") or 0),
            "total_invoiced": round(total_billed, 2),
            "total_paid": round(total_paid, 2),
            "outstanding_balance": round(outstanding, 2),
            "invoice_count": len(invoices)
        },
        "invoices": invoices,
        "leads": leads,
        "proposals": proposals
    }
