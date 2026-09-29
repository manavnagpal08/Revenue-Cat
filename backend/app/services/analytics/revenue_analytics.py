import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from app.services.analytics.data_fetcher import parse_iso_datetime

logger = logging.getLogger("soloceo.analytics.revenue")

def calculate_revenue_analytics(
    invoices: List[Dict[str, Any]],
    customers: List[Dict[str, Any]],
    start_dt: datetime,
    end_dt: datetime,
    time_frame: str
) -> Dict[str, Any]:
    """Computes revenue analytics for the given time frame."""
    total_invoiced = 0.0
    total_collected = 0.0
    total_outstanding = 0.0
    total_overdue = 0.0
    invoice_count = 0

    customer_paid_map: Dict[str, Dict[str, Any]] = {}
    # Pre-populate customer map
    for c in customers:
        c_id = c.get("id", "")
        customer_paid_map[c_id] = {
            "customer_id": c_id,
            "customer_name": c.get("name") or c.get("company_name") or "Unknown Client",
            "company_name": c.get("company_name") or "",
            "total_paid": 0.0,
            "invoice_count": 0
        }

    # Revenue by source map
    source_map: Dict[str, float] = {
        "Direct Invoicing": 0.0,
        "Website Leads": 0.0,
        "Proposal Conversions": 0.0,
        "Referrals": 0.0,
        "Other": 0.0
    }

    # Timeline buckets (e.g. 7 buckets or by date)
    timeline_dict: Dict[str, Dict[str, float]] = {}
    
    # Initialize timeline points between start and end
    num_days = max(1, (end_dt - start_dt).days)
    step_days = max(1, num_days // 7) if num_days > 7 else 1
    
    curr = start_dt
    while curr <= end_dt:
        date_key = curr.strftime("%b %d")
        timeline_dict[date_key] = {"date": date_key, "invoiced": 0.0, "collected": 0.0}
        curr += timedelta(days=step_days)

    for inv in invoices:
        created_at = parse_iso_datetime(inv.get("created_at"))
        amount = float(inv.get("total_amount", 0.0) or 0.0)
        paid = float(inv.get("paid_amount", 0.0) or 0.0)
        status = (inv.get("status") or "draft").lower()
        c_id = inv.get("customer_id", "")

        # Only count invoices created or active in period
        in_period = True
        if created_at:
            in_period = (start_dt <= created_at <= end_dt)

        if in_period:
            total_invoiced += amount
            invoice_count += 1
            
            # Map into timeline
            if created_at:
                # Find closest date key
                key = created_at.strftime("%b %d")
                if key not in timeline_dict:
                    timeline_dict[key] = {"date": key, "invoiced": 0.0, "collected": 0.0}
                timeline_dict[key]["invoiced"] += amount

        # Track collection
        if status == "paid":
            total_collected += (paid if paid > 0 else amount)
            if created_at:
                key = created_at.strftime("%b %d")
                if key in timeline_dict:
                    timeline_dict[key]["collected"] += (paid if paid > 0 else amount)
            # Source attribute
            source_map["Direct Invoicing"] += (paid if paid > 0 else amount)
        elif status == "overdue":
            total_overdue += max(0.0, amount - paid)
            total_outstanding += max(0.0, amount - paid)
        elif status in ["sent", "partially_paid", "pending"]:
            total_outstanding += max(0.0, amount - paid)
            if paid > 0:
                total_collected += paid

        # Top paying customer calculation
        if c_id:
            if c_id not in customer_paid_map:
                cust_name = "Client"
                if isinstance(inv.get("customer"), dict):
                    cust_name = inv["customer"].get("name", "Client")
                customer_paid_map[c_id] = {
                    "customer_id": c_id,
                    "customer_name": cust_name,
                    "company_name": "",
                    "total_paid": 0.0,
                    "invoice_count": 0
                }
            if status == "paid":
                customer_paid_map[c_id]["total_paid"] += (paid if paid > 0 else amount)
            elif paid > 0:
                customer_paid_map[c_id]["total_paid"] += paid
            customer_paid_map[c_id]["invoice_count"] += 1

    collection_rate = (total_collected / total_invoiced * 100.0) if total_invoiced > 0 else 0.0
    avg_invoice = (total_invoiced / invoice_count) if invoice_count > 0 else 0.0

    # Top paying customers list
    top_paying = sorted(
        [c for c in customer_paid_map.values() if c["total_paid"] > 0 or c["invoice_count"] > 0],
        key=lambda x: x["total_paid"],
        reverse=True
    )[:5]

    # Source breakdown list
    total_rev_source = sum(source_map.values())
    revenue_by_source = []
    if total_rev_source > 0:
        for src, val in source_map.items():
            if val > 0:
                revenue_by_source.append({
                    "source": src,
                    "amount": round(val, 2),
                    "percentage": round((val / total_rev_source) * 100.0, 1)
                })
    else:
        revenue_by_source = [
            {"source": "Direct Invoicing", "amount": 0.0, "percentage": 100.0}
        ]

    revenue_over_time = list(timeline_dict.values())

    return {
        "time_frame": time_frame,
        "period_start": start_dt,
        "period_end": end_dt,
        "total_invoiced": round(total_invoiced, 2),
        "total_collected": round(total_collected, 2),
        "total_outstanding": round(total_outstanding, 2),
        "total_overdue": round(total_overdue, 2),
        "collection_rate_percent": round(collection_rate, 1),
        "average_invoice_value": round(avg_invoice, 2),
        "revenue_over_time": revenue_over_time,
        "revenue_by_source": revenue_by_source,
        "top_paying_customers": top_paying
    }
