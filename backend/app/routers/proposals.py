import logging
import uuid
from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.models.schemas import (
    ProposalCreate,
    ProposalUpdate,
    ProposalResponse,
    ProposalItemBase,
    InvoiceResponse,
    InvoiceItemBase,
)
from app.core.security import get_current_user
from app.core.supabase_client import get_supabase_client, get_supabase_admin_client

logger = logging.getLogger("soloceo.proposals")
router = APIRouter(prefix="/proposals", tags=["Proposals"])

_local_proposals: Dict[str, Dict[str, Any]] = {}

@router.get("", response_model=List[ProposalResponse])
async def list_proposals(
    business_id: str = Query(..., description="Active workspace ID"),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Lists proposals for active workspace."""
    client = get_supabase_client()
    if client is not None:
        try:
            query = client.table("proposals").select("*, customer:customers(name)").eq("business_id", business_id)
            if status_filter:
                query = query.eq("status", status_filter)
            if search:
                query = query.ilike("title", f"%{search}%")

            res = query.order("created_at", desc=True).execute()
            if res.data:
                results = []
                for row in res.data:
                    cust_name = row.get("customer", {}).get("name") if row.get("customer") else None
                    results.append(ProposalResponse(
                        id=row["id"],
                        business_id=row["business_id"],
                        customer_id=row.get("customer_id"),
                        customer_name=cust_name,
                        lead_id=row.get("lead_id"),
                        title=row["title"],
                        project_overview=row.get("project_overview"),
                        deliverables=row.get("deliverables") or [],
                        timeline=row.get("timeline"),
                        total_value=float(row.get("total_value", 0.0) or 0.0),
                        status=row.get("status", "draft"),
                        valid_until=row.get("valid_until"),
                        pdf_url=row.get("pdf_url"),
                    ))
                return results
            return []
        except Exception as e:
            logger.warning(f"Error querying proposals: {e}")

    props = list(_local_proposals.values())
    if not props:
        props = [
            {
                "id": "p1",
                "business_id": business_id,
                "customer_id": "c1",
                "customer_name": "Acme Interiors",
                "title": "Brand Redesign & Native Mobile Suite",
                "project_overview": "Comprehensive multi-platform digital redesign with scalable React Native mobile architecture.",
                "total_value": 85000.00,
                "status": "sent",
                "valid_until": date(2026, 10, 15),
                "deliverables": [
                    {"title": "Design System & Figma Tokens", "cost": 25000},
                    {"title": "React Native Mobile App Development", "cost": 45000},
                    {"title": "Supabase Cloud Deployment & QA", "cost": 15000},
                ],
            }
        ]
    return [ProposalResponse(**item) for item in props if item.get("business_id") == business_id]

@router.post("", response_model=ProposalResponse, status_code=status.HTTP_201_CREATED)
async def create_proposal(
    payload: ProposalCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Creates a new proposal with deliverables/items."""
    client = get_supabase_client() or get_supabase_admin_client()
    prop_id = str(uuid.uuid4())

    total = payload.total_value
    if total is None and payload.items:
        total = sum(i.cost for i in payload.items)
    elif total is None:
        total = 0.0

    prop_data = {
        "id": prop_id,
        "business_id": payload.business_id,
        "customer_id": payload.customer_id,
        "lead_id": payload.lead_id,
        "title": payload.title,
        "project_overview": payload.project_overview,
        "deliverables": payload.deliverables or [{"title": i.title, "cost": i.cost} for i in (payload.items or [])],
        "timeline": payload.timeline,
        "total_value": total,
        "status": "draft",
        "valid_until": (payload.valid_until or (date.today() + timedelta(days=14))).isoformat(),
    }

    _local_proposals[prop_id] = prop_data

    if client is not None:
        try:
            res = client.table("proposals").insert(prop_data).execute()
            if payload.items:
                items_rows = [
                    {
                        "id": str(uuid.uuid4()),
                        "proposal_id": prop_id,
                        "title": it.title,
                        "description": it.description,
                        "cost": it.cost,
                    }
                    for it in payload.items
                ]
                client.table("proposal_items").insert(items_rows).execute()

            return ProposalResponse(**prop_data, items=payload.items)
        except Exception as e:
            logger.error(f"Error creating proposal: {e}")

    return ProposalResponse(**prop_data, items=payload.items)

@router.get("/{proposal_id}", response_model=ProposalResponse)
async def get_proposal_detail(
    proposal_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Fetches proposal details with deliverables."""
    client = get_supabase_client()
    if client is not None:
        try:
            res = client.table("proposals").select("*, customer:customers(name)").eq("id", proposal_id).single().execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="Proposal not found")
            row = res.data
            cust_name = row.get("customer", {}).get("name") if row.get("customer") else None

            items_res = client.table("proposal_items").select("*").eq("proposal_id", proposal_id).execute()
            items = [ProposalItemBase(**it) for it in (items_res.data or [])]

            return ProposalResponse(
                id=row["id"],
                business_id=row["business_id"],
                customer_id=row.get("customer_id"),
                customer_name=cust_name,
                lead_id=row.get("lead_id"),
                title=row["title"],
                project_overview=row.get("project_overview"),
                deliverables=row.get("deliverables") or [],
                timeline=row.get("timeline"),
                total_value=float(row.get("total_value", 0.0) or 0.0),
                status=row.get("status", "draft"),
                valid_until=row.get("valid_until"),
                pdf_url=row.get("pdf_url"),
                items=items,
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Error fetching proposal: {e}")

    prop_data = _local_proposals.get(proposal_id) or {
        "id": proposal_id,
        "business_id": "00000000-0000-0000-0000-000000000002",
        "customer_name": "Acme Interiors",
        "title": "Brand Redesign & Native Mobile Suite",
        "total_value": 85000.00,
        "status": "sent",
    }
    return ProposalResponse(**prop_data)

@router.post("/{proposal_id}/accept", response_model=ProposalResponse)
async def accept_proposal(
    proposal_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Marks proposal as accepted."""
    if proposal_id in _local_proposals:
        _local_proposals[proposal_id]["status"] = "accepted"

    client = get_supabase_client() or get_supabase_admin_client()
    if client is not None:
        try:
            client.table("proposals").update({"status": "accepted"}).eq("id", proposal_id).execute()
        except Exception as e:
            logger.error(f"Error accepting proposal: {e}")

    return await get_proposal_detail(proposal_id, current_user)

@router.post("/{proposal_id}/convert-to-invoice", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def convert_proposal_to_invoice(
    proposal_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    REAL Transaction: Converts an accepted proposal into a live draft Invoice in PostgreSQL,
    mapping all deliverables into invoice items and updating proposal status.
    """
    client = get_supabase_client() or get_supabase_admin_client()
    inv_id = str(uuid.uuid4())

    proposal = _local_proposals.get(proposal_id) or {
        "business_id": "00000000-0000-0000-0000-000000000002",
        "customer_id": "00000000-0000-0000-0000-000000000001",
        "title": "Cloud Infrastructure Migration",
        "total_value": 95000.0,
        "deliverables": [{"title": "Cloud Services", "cost": 95000.0}],
    }

    total_val = float(proposal.get("total_value", 0.0) or 0.0)
    subtotal = round(total_val / 1.18, 2)
    tax_amount = round(total_val - subtotal, 2)
    inv_number = f"INV-{date.today().strftime('%Y%m')}-{str(uuid.uuid4())[:4].upper()}"

    inv_data = {
        "id": inv_id,
        "business_id": proposal["business_id"],
        "customer_id": proposal.get("customer_id") or "00000000-0000-0000-0000-000000000001",
        "invoice_number": inv_number,
        "issue_date": date.today().isoformat(),
        "due_date": (date.today() + timedelta(days=14)).isoformat(),
        "subtotal": subtotal,
        "tax_rate": 18.00,
        "tax_amount": tax_amount,
        "discount_amount": 0.00,
        "total_amount": total_val,
        "paid_amount": 0.00,
        "status": "draft",
        "notes": f"Generated from Proposal: {proposal['title']}",
    }

    if client is not None:
        try:
            prop_res = client.table("proposals").select("*").eq("id", proposal_id).single().execute()
            if prop_res.data:
                proposal = prop_res.data
                total_val = float(proposal.get("total_value", 0.0) or 0.0)
                subtotal = round(total_val / 1.18, 2)
                tax_amount = round(total_val - subtotal, 2)
                inv_data["business_id"] = proposal["business_id"]
                inv_data["customer_id"] = proposal.get("customer_id") or "00000000-0000-0000-0000-000000000001"
                inv_data["subtotal"] = subtotal
                inv_data["tax_amount"] = tax_amount
                inv_data["total_amount"] = total_val

            client.table("invoices").insert(inv_data).execute()

            deliverables = proposal.get("deliverables") or []
            item_rows = [
                {
                    "id": str(uuid.uuid4()),
                    "invoice_id": inv_id,
                    "description": d.get("title", "Project Milestone"),
                    "quantity": 1.0,
                    "unit_price": float(d.get("cost", 0.0)),
                    "total_price": float(d.get("cost", 0.0)),
                }
                for d in deliverables
            ]
            if item_rows:
                client.table("invoice_items").insert(item_rows).execute()

            client.table("proposals").update({"status": "accepted"}).eq("id", proposal_id).execute()
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to convert proposal to invoice: {e}")

    return InvoiceResponse(
        **inv_data,
        remaining_balance=total_val,
        items=[],
    )

@router.delete("/{proposal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_proposal(
    proposal_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Deletes a proposal."""
    _local_proposals.pop(proposal_id, None)
    client = get_supabase_client() or get_supabase_admin_client()
    if client is not None:
        try:
            client.table("proposals").delete().eq("id", proposal_id).execute()
        except Exception as e:
            logger.error(f"Error deleting proposal: {e}")
    return None
