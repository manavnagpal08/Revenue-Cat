import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from app.services.analytics.data_fetcher import parse_iso_datetime

logger = logging.getLogger("soloceo.analytics.sales")

def calculate_sales_analytics(
    leads: List[Dict[str, Any]],
    proposals: List[Dict[str, Any]],
    start_dt: datetime,
    end_dt: datetime,
    time_frame: str
) -> Dict[str, Any]:
    """Computes sales pipeline, conversion funnels, and proposal performance."""
    total_leads = 0
    won_leads = 0
    lost_leads = 0
    total_pipeline_val = 0.0
    total_won_val = 0.0
    sales_cycle_days_list = []

    # Funnel stage counts
    stage_counts = {
        "new": {"count": 0, "value": 0.0, "name": "New Leads"},
        "contacted": {"count": 0, "value": 0.0, "name": "Contacted"},
        "qualified": {"count": 0, "value": 0.0, "name": "Qualified"},
        "proposal": {"count": 0, "value": 0.0, "name": "Proposal Sent"},
        "negotiation": {"count": 0, "value": 0.0, "name": "In Negotiation"},
        "won": {"count": 0, "value": 0.0, "name": "Closed Won"},
        "lost": {"count": 0, "value": 0.0, "name": "Closed Lost"}
    }

    # Lead sources map
    sources_map: Dict[str, Dict[str, Any]] = {}

    for lead in leads:
        created_at = parse_iso_datetime(lead.get("created_at"))
        status = (lead.get("status") or "new").lower()
        val = float(lead.get("estimated_value", 0.0) or 0.0)
        source = (lead.get("source") or "Direct").capitalize()

        in_period = True
        if created_at:
            in_period = (start_dt <= created_at <= end_dt)

        if in_period:
            total_leads += 1
            total_pipeline_val += val

            # Source tracking
            if source not in sources_map:
                sources_map[source] = {"source": source, "count": 0, "won_count": 0, "total_value": 0.0}
            sources_map[source]["count"] += 1
            sources_map[source]["total_value"] += val

            # Stage categorization
            if status in stage_counts:
                stage_counts[status]["count"] += 1
                stage_counts[status]["value"] += val
            else:
                stage_counts["new"]["count"] += 1
                stage_counts["new"]["value"] += val

            if status == "won":
                won_leads += 1
                total_won_val += val
                if source in sources_map:
                    sources_map[source]["won_count"] += 1
                # Estimate sales cycle
                if created_at:
                    updated_at = parse_iso_datetime(lead.get("updated_at")) or datetime.now(timezone.utc)
                    days = max(1, (updated_at - created_at).days)
                    sales_cycle_days_list.append(days)
            elif status == "lost":
                lost_leads += 1

    win_rate = (won_leads / total_leads * 100.0) if total_leads > 0 else 0.0
    avg_deal_size = (total_pipeline_val / total_leads) if total_leads > 0 else 0.0
    avg_cycle = (sum(sales_cycle_days_list) / len(sales_cycle_days_list)) if sales_cycle_days_list else 14.0

    # Build Funnel Stages
    funnel_stages = []
    ordered_keys = ["new", "qualified", "proposal", "negotiation", "won"]
    prev_count = total_leads if total_leads > 0 else 1
    for k in ordered_keys:
        item = stage_counts.get(k, {"count": 0, "value": 0.0, "name": k.title()})
        c = item["count"]
        v = item["value"]
        conv_rate = (c / prev_count * 100.0) if prev_count > 0 else 0.0
        funnel_stages.append({
            "stage": item["name"],
            "count": c,
            "value": round(v, 2),
            "conversion_rate": round(conv_rate, 1)
        })

    # Build Sources List
    leads_by_source = []
    for s_name, s_data in sources_map.items():
        s_cnt = s_data["count"]
        s_won = s_data["won_count"]
        c_rate = (s_won / s_cnt * 100.0) if s_cnt > 0 else 0.0
        leads_by_source.append({
            "source": s_name,
            "count": s_cnt,
            "won_count": s_won,
            "conversion_rate": round(c_rate, 1),
            "total_value": round(s_data["total_value"], 2)
        })

    # Proposals Summary
    prop_total = len(proposals)
    prop_accepted = sum(1 for p in proposals if (p.get("status") or "").lower() == "accepted")
    prop_pending = sum(1 for p in proposals if (p.get("status") or "").lower() in ["sent", "draft", "viewed"])
    prop_rejected = sum(1 for p in proposals if (p.get("status") or "").lower() in ["rejected", "expired"])
    prop_val = sum(float(p.get("total_amount", 0.0) or 0.0) for p in proposals)
    prop_acc_rate = (prop_accepted / prop_total * 100.0) if prop_total > 0 else 0.0

    proposals_summary = {
        "total": prop_total,
        "accepted": prop_accepted,
        "pending": prop_pending,
        "rejected": prop_rejected,
        "total_value": round(prop_val, 2),
        "acceptance_rate": round(prop_acc_rate, 1)
    }

    return {
        "time_frame": time_frame,
        "period_start": start_dt,
        "period_end": end_dt,
        "total_leads": total_leads,
        "won_leads": won_leads,
        "lost_leads": lost_leads,
        "win_rate_percent": round(win_rate, 1),
        "total_pipeline_value": round(total_pipeline_val, 2),
        "average_deal_size": round(avg_deal_size, 2),
        "average_sales_cycle_days": round(avg_cycle, 1),
        "funnel_stages": funnel_stages,
        "leads_by_source": leads_by_source,
        "proposals_summary": proposals_summary
    }
