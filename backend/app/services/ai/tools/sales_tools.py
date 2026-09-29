from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from app.core.supabase_client import get_supabase
from app.services.ai.tools.shared_data import in_memory_leads, in_memory_activities

async def get_leads_tool(business_id: str, status: Optional[str] = None, limit: int = 50) -> Dict[str, Any]:
    """Retrieve leads for a business, optionally filtered by status."""
    supabase = get_supabase()
    leads = []
    
    if supabase:
        try:
            query = supabase.table("leads").select("*, customer:customers(*)").eq("business_id", business_id)
            if status and status != "all":
                query = query.eq("status", status)
            res = query.order("created_at", desc=True).limit(limit).execute()
            leads = res.data or []
        except Exception as e:
            leads = [l for l in in_memory_leads.values() if l.get("business_id") == business_id]
            if status and status != "all":
                leads = [l for l in leads if l.get("status") == status]
    else:
        leads = [l for l in in_memory_leads.values() if l.get("business_id") == business_id]
        if status and status != "all":
            leads = [l for l in leads if l.get("status") == status]

    total_value = sum(float(l.get("value") or 0) for l in leads)
    return {
        "count": len(leads),
        "total_value": total_value,
        "leads": leads[:limit]
    }


async def get_inactive_leads_tool(business_id: str, days_threshold: int = 7) -> Dict[str, Any]:
    """Find leads that have not been contacted within the specified number of days."""
    all_leads_res = await get_leads_tool(business_id=business_id, limit=100)
    all_leads = all_leads_res["leads"]
    
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=days_threshold)
    inactive_leads = []

    for lead in all_leads:
        # Skip won, lost or converted
        if lead.get("status") in ["won", "lost", "converted"]:
            continue

        last_contact = lead.get("last_contacted_at") or lead.get("created_at")
        days_inactive = days_threshold
        
        if last_contact:
            try:
                dt = datetime.fromisoformat(str(last_contact).replace("Z", "+00:00"))
                days_inactive = (now - dt).days
                if dt < cutoff or days_inactive >= days_threshold:
                    inactive_leads.append({
                        **lead,
                        "days_inactive": max(1, days_inactive)
                    })
            except Exception:
                inactive_leads.append({**lead, "days_inactive": days_threshold})
        else:
            inactive_leads.append({**lead, "days_inactive": days_threshold})

    # Sort by value descending (highest-value inactive leads first)
    inactive_leads.sort(key=lambda x: float(x.get("value") or 0), reverse=True)

    return {
        "days_threshold": days_threshold,
        "inactive_count": len(inactive_leads),
        "total_at_risk_value": sum(float(l.get("value") or 0) for l in inactive_leads),
        "inactive_leads": inactive_leads
    }


async def get_pipeline_summary_tool(business_id: str) -> Dict[str, Any]:
    """Retrieve full pipeline stage distribution and total values."""
    res = await get_leads_tool(business_id=business_id, limit=200)
    leads = res["leads"]

    stages = {"new": 0, "contacted": 0, "qualified": 0, "proposal": 0, "negotiation": 0, "won": 0, "lost": 0}
    stage_values = {"new": 0.0, "contacted": 0.0, "qualified": 0.0, "proposal": 0.0, "negotiation": 0.0, "won": 0.0, "lost": 0.0}

    for l in leads:
        st = l.get("status", "new")
        val = float(l.get("value") or 0)
        if st in stages:
            stages[st] += 1
            stage_values[st] += val

    open_leads = [l for l in leads if l.get("status") not in ["won", "lost", "converted"]]
    open_value = sum(float(l.get("value") or 0) for l in open_leads)

    return {
        "total_leads": len(leads),
        "open_leads_count": len(open_leads),
        "open_pipeline_value": open_value,
        "stage_counts": stages,
        "stage_values": stage_values
    }


async def get_lead_activities_tool(business_id: str, lead_id: str) -> Dict[str, Any]:
    """Retrieve logged timeline activities for a specific lead."""
    supabase = get_supabase()
    activities = []
    
    if supabase:
        try:
            res = supabase.table("lead_activities").select("*").eq("business_id", business_id).eq("lead_id", lead_id).order("created_at", desc=True).execute()
            activities = res.data or []
        except Exception:
            activities = [a for a in in_memory_activities.get(lead_id, [])]
    else:
        activities = [a for a in in_memory_activities.get(lead_id, [])]

    return {
        "lead_id": lead_id,
        "count": len(activities),
        "activities": activities
    }
