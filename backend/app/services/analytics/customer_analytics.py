import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from app.services.analytics.data_fetcher import parse_iso_datetime

logger = logging.getLogger("soloceo.analytics.customers")

def calculate_customer_analytics(
    customers: List[Dict[str, Any]],
    invoices: List[Dict[str, Any]],
    start_dt: datetime,
    end_dt: datetime,
    time_frame: str
) -> Dict[str, Any]:
    """Computes customer growth, segmentation, retention and top accounts."""
    now = datetime.now(timezone.utc)
    total_customers = len(customers)
    new_customers = 0
    active_count = 0
    inactive_count = 0

    segments = {
        "high_value": 0,
        "active": 0,
        "at_risk": 0,
        "inactive": 0,
        "new": 0
    }

    # Map customer invoice stats
    cust_invoices_map: Dict[str, List[Dict[str, Any]]] = {}
    for inv in invoices:
        c_id = inv.get("customer_id", "")
        if c_id not in cust_invoices_map:
            cust_invoices_map[c_id] = []
        cust_invoices_map[c_id].append(inv)

    customer_items = []

    # Timeline buckets
    growth_dict: Dict[str, int] = {}
    curr = start_dt
    step_days = max(1, (end_dt - start_dt).days // 6)
    while curr <= end_dt:
        growth_dict[curr.strftime("%b %d")] = 0
        curr += timedelta(days=step_days)

    for c in customers:
        c_id = c.get("id", "")
        created_at = parse_iso_datetime(c.get("created_at")) or (now - timedelta(days=45))
        last_interaction = parse_iso_datetime(c.get("last_interaction_at")) or created_at
        
        # Calculate true customer spent from invoices or record
        cust_invs = cust_invoices_map.get(c_id, [])
        spent_from_invs = sum(float(i.get("paid_amount", 0.0) or (i.get("total_amount", 0.0) if i.get("status") == "paid" else 0.0)) for i in cust_invs)
        total_spent = max(float(c.get("total_revenue", 0.0) or 0.0), spent_from_invs)
        has_overdue = any(i.get("status") == "overdue" for i in cust_invs)

        # New in period check
        is_new = (start_dt <= created_at <= end_dt)
        if is_new:
            new_customers += 1
            segments["new"] += 1
            key = created_at.strftime("%b %d")
            if key in growth_dict:
                growth_dict[key] += 1

        # Segmentation rules
        days_since_interaction = (now - last_interaction).days

        if total_spent >= 100000.0:
            assigned_segment = "high_value"
            segments["high_value"] += 1
            active_count += 1
        elif has_overdue or (30 <= days_since_interaction <= 60):
            assigned_segment = "at_risk"
            segments["at_risk"] += 1
        elif days_since_interaction > 60:
            assigned_segment = "inactive"
            segments["inactive"] += 1
            inactive_count += 1
        elif is_new:
            assigned_segment = "new"
            active_count += 1
        else:
            assigned_segment = "active"
            segments["active"] += 1
            active_count += 1

        customer_items.append({
            "id": c_id,
            "name": c.get("name") or "Unnamed Client",
            "company": c.get("company_name") or "",
            "total_spent": round(total_spent, 2),
            "invoice_count": len(cust_invs),
            "status": c.get("status", "active"),
            "segment": assigned_segment,
            "last_interaction_at": last_interaction.isoformat()
        })

    # Sort top customers by total spent
    top_customers = sorted(customer_items, key=lambda x: x["total_spent"], reverse=True)[:10]

    # Growth trend accumulation
    running_total = max(0, total_customers - new_customers)
    growth_trend = []
    for d_str, count in growth_dict.items():
        running_total += count
        growth_trend.append({
            "date": d_str,
            "new_count": count,
            "total_count": running_total
        })

    return {
        "time_frame": time_frame,
        "period_start": start_dt,
        "period_end": end_dt,
        "total_customers": total_customers,
        "new_customers": new_customers,
        "active_customers": active_count,
        "churn_or_inactive_count": inactive_count,
        "growth_trend": growth_trend,
        "segments": segments,
        "top_customers": top_customers
    }
