from typing import Dict, Any, List, Optional
from datetime import date
from app.core.supabase_client import get_supabase
from app.services.ai.tools.shared_data import in_memory_invoices, in_memory_payments, in_memory_customers

async def get_invoices_tool(business_id: str, status: Optional[str] = None, limit: int = 50) -> Dict[str, Any]:
    """Retrieve invoices for a business."""
    supabase = get_supabase()
    invoices = []
    
    if supabase:
        try:
            query = supabase.table("invoices").select("*, customer:customers(*)").eq("business_id", business_id)
            if status and status != "all":
                query = query.eq("status", status)
            res = query.order("created_at", desc=True).limit(limit).execute()
            invoices = res.data or []
        except Exception:
            invoices = [i for i in in_memory_invoices.values() if i.get("business_id") == business_id]
            if status and status != "all":
                invoices = [i for i in invoices if i.get("status") == status]
    else:
        invoices = [i for i in in_memory_invoices.values() if i.get("business_id") == business_id]
        if status and status != "all":
            invoices = [i for i in invoices if i.get("status") == status]

    total_amount = sum(float(i.get("total_amount") or 0) for i in invoices)
    total_paid = sum(float(i.get("paid_amount") or 0) for i in invoices)

    return {
        "count": len(invoices),
        "total_amount": round(total_amount, 2),
        "total_paid": round(total_paid, 2),
        "total_outstanding": round(max(0.0, total_amount - total_paid), 2),
        "invoices": invoices[:limit]
    }


async def get_overdue_invoices_tool(business_id: str) -> Dict[str, Any]:
    """Retrieve all overdue invoices and calculate total delinquent receivables."""
    all_invs_res = await get_invoices_tool(business_id=business_id, limit=100)
    all_invs = all_invs_res["invoices"]
    today_str = date.today().isoformat()

    overdue = []
    for inv in all_invs:
        total = float(inv.get("total_amount") or 0)
        paid = float(inv.get("paid_amount") or 0)
        balance = max(0.0, total - paid)
        due_date = str(inv.get("due_date", ""))

        if balance > 0 and (inv.get("status") == "overdue" or due_date < today_str):
            overdue.append({
                **inv,
                "remaining_balance": round(balance, 2)
            })

    total_overdue_amount = sum(i["remaining_balance"] for i in overdue)
    return {
        "overdue_count": len(overdue),
        "total_overdue_amount": round(total_overdue_amount, 2),
        "overdue_invoices": overdue
    }


async def get_financial_summary_tool(business_id: str) -> Dict[str, Any]:
    """Calculate real-time financial metrics: revenue collected, outstanding balance, overdue balance."""
    all_invs_res = await get_invoices_tool(business_id=business_id, limit=200)
    invoices = all_invs_res["invoices"]
    today_str = date.today().isoformat()

    total_revenue_collected = 0.0
    total_outstanding = 0.0
    total_overdue = 0.0
    paid_count = 0
    overdue_count = 0

    for inv in invoices:
        total = float(inv.get("total_amount") or 0)
        paid = float(inv.get("paid_amount") or 0)
        balance = max(0.0, total - paid)
        st = inv.get("status")
        due_date = str(inv.get("due_date", ""))

        total_revenue_collected += paid
        if st == "paid":
            paid_count += 1

        if balance > 0 and st != "cancelled":
            total_outstanding += balance
            if st == "overdue" or due_date < today_str:
                total_overdue += balance
                overdue_count += 1

    return {
        "revenue_collected": round(total_revenue_collected, 2),
        "total_outstanding": round(total_outstanding, 2),
        "total_overdue": round(total_overdue, 2),
        "paid_invoices_count": paid_count,
        "overdue_invoices_count": overdue_count,
        "total_invoices_count": len(invoices)
    }


async def get_customer_revenue_tool(business_id: str, limit: int = 10) -> Dict[str, Any]:
    """Rank customers by total lifetime revenue generated."""
    supabase = get_supabase()
    customers = []
    
    if supabase:
        try:
            res = supabase.table("customers").select("*").eq("business_id", business_id).order("total_revenue", desc=True).limit(limit).execute()
            customers = res.data or []
        except Exception:
            customers = [c for c in in_memory_customers.values() if c.get("business_id") == business_id]
            customers.sort(key=lambda x: float(x.get("total_revenue") or 0), reverse=True)
    else:
        customers = [c for c in in_memory_customers.values() if c.get("business_id") == business_id]
        customers.sort(key=lambda x: float(x.get("total_revenue") or 0), reverse=True)

    return {
        "top_customers": customers[:limit]
    }


async def get_payments_tool(business_id: str, limit: int = 20) -> Dict[str, Any]:
    """Retrieve recent payment transactions."""
    supabase = get_supabase()
    payments = []
    
    if supabase:
        try:
            res = supabase.table("payments").select("*").eq("business_id", business_id).order("created_at", desc=True).limit(limit).execute()
            payments = res.data or []
        except Exception:
            payments = [p for p in in_memory_payments.values() if p.get("business_id") == business_id]
    else:
        payments = [p for p in in_memory_payments.values() if p.get("business_id") == business_id]

    total_amount = sum(float(p.get("amount") or 0) for p in payments)
    return {
        "count": len(payments),
        "total_received": round(total_amount, 2),
        "payments": payments[:limit]
    }
