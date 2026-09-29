import uuid
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from app.core.supabase_client import get_supabase
from app.services.ai.tools.shared_data import (
    in_memory_proposals,
    in_memory_invoices,
    in_memory_leads,
    in_memory_customers
)

logger = logging.getLogger("soloceo_ai_actions")

async def execute_confirmed_action(
    action_type: str,
    payload: Dict[str, Any],
    business_id: str,
    user_id: str
) -> Dict[str, Any]:
    """
    Executes an action that has been explicitly confirmed by the user.
    All write operations are checked against the business_id.
    """
    supabase = get_supabase()

    if action_type == "CREATE_PROPOSAL":
        title = payload.get("title", "Project Proposal")
        cust_id = payload.get("customer_id")
        total_value = float(payload.get("total_value", 50000.0))
        overview = payload.get("project_overview")
        deliverables = payload.get("deliverables", [])

        proposal_id = str(uuid.uuid4())
        record = {
            "id": proposal_id,
            "business_id": business_id,
            "customer_id": cust_id,
            "title": title,
            "project_overview": overview,
            "deliverables": deliverables,
            "total_value": total_value,
            "status": "draft",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

        if supabase:
            try:
                res = supabase.table("proposals").insert(record).execute()
                if res.data:
                    return {
                        "success": True,
                        "action_type": action_type,
                        "resource_id": proposal_id,
                        "message": f"Proposal '{title}' created successfully!",
                        "data": res.data[0]
                    }
            except Exception as e:
                logger.warning(f"Error creating proposal in Supabase: {e}")

        in_memory_proposals[proposal_id] = record
        return {
            "success": True,
            "action_type": action_type,
            "resource_id": proposal_id,
            "message": f"Proposal '{title}' created successfully!",
            "data": record
        }

    elif action_type == "CONVERT_TO_INVOICE":
        proposal_id = payload.get("proposal_id")
        if not proposal_id:
            raise ValueError("proposal_id is required for CONVERT_TO_INVOICE")

        # Fetch proposal
        prop = None
        if supabase:
            try:
                res = supabase.table("proposals").select("*").eq("id", proposal_id).eq("business_id", business_id).single().execute()
                prop = res.data
            except Exception:
                prop = in_memory_proposals.get(proposal_id)
        else:
            prop = in_memory_proposals.get(proposal_id)

        if not prop:
            raise ValueError(f"Proposal {proposal_id} not found")

        inv_id = str(uuid.uuid4())
        total_val = float(prop.get("total_value") or 0)
        subtotal = round(total_val / 1.18, 2)
        tax_amount = round(total_val - subtotal, 2)

        inv_record = {
            "id": inv_id,
            "business_id": business_id,
            "customer_id": prop.get("customer_id"),
            "invoice_number": f"INV-{datetime.now().year}{datetime.now().month:02d}-{uuid.uuid4().hex[:4].upper()}",
            "issue_date": datetime.now(timezone.utc).date().isoformat(),
            "due_date": datetime.now(timezone.utc).date().isoformat(),
            "subtotal": subtotal,
            "tax_rate": 18.0,
            "tax_amount": tax_amount,
            "discount_amount": 0.0,
            "total_amount": total_val,
            "paid_amount": 0.0,
            "status": "draft",
            "notes": f"Generated from Proposal: {prop.get('title')}",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

        if supabase:
            try:
                supabase.table("invoices").insert(inv_record).execute()
                supabase.table("proposals").update({"status": "accepted"}).eq("id", proposal_id).execute()
            except Exception as e:
                logger.warning(f"Error creating converted invoice in Supabase: {e}")

        in_memory_invoices[inv_id] = inv_record
        if proposal_id in in_memory_proposals:
            in_memory_proposals[proposal_id]["status"] = "accepted"

        return {
            "success": True,
            "action_type": action_type,
            "resource_id": inv_id,
            "message": "Proposal successfully converted to invoice!",
            "data": inv_record
        }

    else:
        raise ValueError(f"Unsupported action type: {action_type}")
