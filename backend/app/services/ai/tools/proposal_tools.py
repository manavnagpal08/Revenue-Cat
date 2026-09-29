from typing import Dict, Any, List, Optional
from app.core.supabase_client import get_supabase
from app.services.ai.tools.shared_data import in_memory_proposals, in_memory_customers

async def get_proposals_tool(business_id: str, status: Optional[str] = None, limit: int = 50) -> Dict[str, Any]:
    """Retrieve proposals for a business."""
    supabase = get_supabase()
    proposals = []
    
    if supabase:
        try:
            query = supabase.table("proposals").select("*, customer:customers(*)").eq("business_id", business_id)
            if status and status != "all":
                query = query.eq("status", status)
            res = query.order("created_at", desc=True).limit(limit).execute()
            proposals = res.data or []
        except Exception:
            proposals = [p for p in in_memory_proposals.values() if p.get("business_id") == business_id]
            if status and status != "all":
                proposals = [p for p in proposals if p.get("status") == status]
    else:
        proposals = [p for p in in_memory_proposals.values() if p.get("business_id") == business_id]
        if status and status != "all":
            proposals = [p for p in proposals if p.get("status") == status]

    total_value = sum(float(p.get("total_value") or 0) for p in proposals)
    return {
        "count": len(proposals),
        "total_value": round(total_value, 2),
        "proposals": proposals[:limit]
    }


async def get_proposal_tool(business_id: str, proposal_id: str) -> Dict[str, Any]:
    """Get detailed proposal data."""
    supabase = get_supabase()
    if supabase:
        try:
            res = supabase.table("proposals").select("*, customer:customers(*)").eq("id", proposal_id).eq("business_id", business_id).single().execute()
            if res.data:
                return {"found": True, "proposal": res.data}
        except Exception:
            pass

    prop = in_memory_proposals.get(proposal_id)
    if prop and prop.get("business_id") == business_id:
        return {"found": True, "proposal": prop}
    return {"found": False, "proposal": None}


async def prepare_proposal_action_tool(
    business_id: str,
    title: str,
    customer_name: Optional[str] = None,
    customer_id: Optional[str] = None,
    total_value: float = 50000.0,
    project_overview: Optional[str] = None,
    deliverables: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Prepare a structured proposal action for user confirmation.
    Does NOT write directly without confirmation (Write Action separation).
    """
    if not customer_id and customer_name:
        # Search for customer by name
        supabase = get_supabase()
        if supabase:
            try:
                res = supabase.table("customers").select("id, name").eq("business_id", business_id).ilike("name", f"%{customer_name}%").limit(1).execute()
                if res.data:
                    customer_id = res.data[0]["id"]
            except Exception:
                for c in in_memory_customers.values():
                    if c.get("business_id") == business_id and customer_name.lower() in c.get("name", "").lower():
                        customer_id = c.get("id")
                        break
        else:
            for c in in_memory_customers.values():
                if c.get("business_id") == business_id and customer_name.lower() in c.get("name", "").lower():
                    customer_id = c.get("id")
                    break

    delivs = deliverables or [
        {"title": f"Phase 1: Project Kickoff & Scoping ({title})", "cost": round(total_value * 0.4, 2)},
        {"title": f"Phase 2: Execution & Implementation", "cost": round(total_value * 0.6, 2)}
    ]

    return {
        "action_type": "CREATE_PROPOSAL",
        "requires_confirmation": True,
        "payload": {
            "business_id": business_id,
            "customer_id": customer_id,
            "customer_name": customer_name or "Client",
            "title": title,
            "project_overview": project_overview or f"Full scope of services for {title}.",
            "deliverables": delivs,
            "total_value": total_value,
            "valid_until": None
        }
    }
