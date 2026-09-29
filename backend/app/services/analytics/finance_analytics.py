import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta, date
from app.services.analytics.data_fetcher import parse_iso_datetime

logger = logging.getLogger("soloceo.analytics.finance")

def calculate_finance_analytics(
    invoices: List[Dict[str, Any]],
    start_dt: datetime,
    end_dt: datetime,
    time_frame: str
) -> Dict[str, Any]:
    """Computes invoice status distributions, aging reports, and cash collection metrics."""
    now = datetime.now(timezone.utc)
    today = now.date()

    total_invoices = len(invoices)
    paid_count = 0
    pending_count = 0
    overdue_count = 0
    draft_count = 0

    total_billed = 0.0
    total_collected = 0.0
    total_overdue = 0.0

    aging = {
        "1_15_days": 0.0,
        "16_30_days": 0.0,
        "30_plus_days": 0.0
    }

    velocity_days_list = []

    for inv in invoices:
        amount = float(inv.get("total_amount", 0.0) or 0.0)
        paid = float(inv.get("paid_amount", 0.0) or 0.0)
        status = (inv.get("status") or "draft").lower()
        created_at = parse_iso_datetime(inv.get("created_at"))
        paid_at = parse_iso_datetime(inv.get("paid_at"))

        due_date_str = inv.get("due_date")
        due_date = None
        if due_date_str:
            try:
                due_date = date.fromisoformat(str(due_date_str)[:10])
            except Exception:
                due_date = None

        total_billed += amount

        if status == "paid":
            paid_count += 1
            total_collected += (paid if paid > 0 else amount)
            if created_at and paid_at:
                diff_days = max(0, (paid_at - created_at).days)
                velocity_days_list.append(diff_days)
            elif created_at:
                velocity_days_list.append(10) # default reasonable turnaround
        elif status == "overdue" or (due_date and due_date < today and status in ["sent", "pending", "partially_paid"]):
            overdue_count += 1
            unpaid = max(0.0, amount - paid)
            total_overdue += unpaid
            if paid > 0:
                total_collected += paid
            
            # Aging bucket
            if due_date:
                days_over = max(1, (today - due_date).days)
                if days_over <= 15:
                    aging["1_15_days"] += unpaid
                elif days_over <= 30:
                    aging["16_30_days"] += unpaid
                else:
                    aging["30_plus_days"] += unpaid
            else:
                aging["1_15_days"] += unpaid
        elif status in ["sent", "pending", "partially_paid"]:
            pending_count += 1
            if paid > 0:
                total_collected += paid
        elif status == "draft":
            draft_count += 1

    avg_velocity = (sum(velocity_days_list) / len(velocity_days_list)) if velocity_days_list else 8.5

    status_distribution = [
        {"status": "Paid", "count": paid_count, "amount": round(total_collected, 2), "color": "#10B981"},
        {"status": "Pending", "count": pending_count, "amount": round(max(0.0, total_billed - total_collected - total_overdue), 2), "color": "#3B82F6"},
        {"status": "Overdue", "count": overdue_count, "amount": round(total_overdue, 2), "color": "#EF4444"},
        {"status": "Draft", "count": draft_count, "amount": 0.0, "color": "#9CA3AF"}
    ]

    return {
        "time_frame": time_frame,
        "period_start": start_dt,
        "period_end": end_dt,
        "total_invoices": total_invoices,
        "paid_invoices_count": paid_count,
        "pending_invoices_count": pending_count,
        "overdue_invoices_count": overdue_count,
        "total_amount_billed": round(total_billed, 2),
        "total_amount_collected": round(total_collected, 2),
        "total_amount_overdue": round(total_overdue, 2),
        "overdue_aging": {k: round(v, 2) for k, v in aging.items()},
        "payment_velocity_average_days": round(avg_velocity, 1),
        "status_distribution": status_distribution
    }
