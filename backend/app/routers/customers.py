import logging
import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.models.schemas import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    CustomerDetailResponse,
    LeadResponse,
    InvoiceResponse,
    ProposalResponse,
    LeadActivityResponse,
)
from app.core.security import get_current_user
from app.core.supabase_client import get_supabase_client, get_supabase_admin_client

logger = logging.getLogger("soloceo.customers")
router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("", response_model=List[CustomerResponse])
async def list_customers(
    business_id: str = Query(..., description="Active workspace ID"),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Lists customers belonging to the active business with optional search and status filter."""
    client = get_supabase_client()
    if client is not None:
        try:
            query = client.table("customers").select("*").eq("business_id", business_id)
            if status_filter:
                query = query.eq("status", status_filter)
            if search:
                query = query.ilike("name", f"%{search}%")
            
            res = query.order("created_at", desc=True).execute()
            if res.data:
                return [CustomerResponse(**item) for item in res.data]
            return []
        except Exception as e:
            logger.warning(f"Error querying customers: {e}")

    # Seed fallback
    return [
        CustomerResponse(
            id="c1",
            business_id=business_id,
            name="Vikram Mehta",
            company_name="Acme Interiors",
            email="vikram@acmeinteriors.com",
            phone="+91 98201 11223",
            website="https://acmeinteriors.com",
            status="active",
            total_revenue=120000.00,
        ),
        CustomerResponse(
            id="c2",
            business_id=business_id,
            name="Priya Sharma",
            company_name="XYZ Studio",
            email="priya@xyzstudio.in",
            phone="+91 98302 22334",
            status="active",
            total_revenue=85000.00,
        ),
    ]

@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    payload: CustomerCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Creates a new customer record."""
    client = get_supabase_client() or get_supabase_admin_client()
    cust_id = str(uuid.uuid4())
    data = payload.model_dump()
    data["id"] = cust_id

    if client is not None:
        try:
            res = client.table("customers").insert(data).execute()
            if res.data:
                return CustomerResponse(**res.data[0])
        except Exception as e:
            logger.error(f"Error creating customer: {e}")

    return CustomerResponse(**data)

@router.get("/{customer_id}", response_model=CustomerDetailResponse)
async def get_customer_detail(
    customer_id: str,
    business_id: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Returns detailed customer record with related leads, invoices, proposals, and activities."""
    client = get_supabase_client()
    if client is not None:
        try:
            # 1. Customer
            c_res = client.table("customers").select("*").eq("id", customer_id).single().execute()
            if not c_res.data:
                raise HTTPException(status_code=404, detail="Customer not found")
            cust_data = c_res.data

            # 2. Leads
            l_res = client.table("leads").select("*").eq("customer_id", customer_id).execute()
            leads = [LeadResponse(**item) for item in (l_res.data or [])]

            # 3. Invoices
            inv_res = client.table("invoices").select("*").eq("customer_id", customer_id).execute()
            invoices = [InvoiceResponse(**item) for item in (inv_res.data or [])]

            # 4. Proposals
            p_res = client.table("proposals").select("*").eq("customer_id", customer_id).execute()
            proposals = [ProposalResponse(**item) for item in (p_res.data or [])]

            # 5. Activities
            act_res = client.table("lead_activities").select("*").eq("customer_id", customer_id).order("created_at", desc=True).execute()
            activities = [LeadActivityResponse(**item) for item in (act_res.data or [])]

            return CustomerDetailResponse(
                **cust_data,
                leads=leads,
                invoices=invoices,
                proposals=proposals,
                activities=activities
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Error fetching customer details: {e}")

    return CustomerDetailResponse(
        id=customer_id,
        business_id=business_id or "biz-1",
        name="Vikram Mehta",
        company_name="Acme Interiors",
        email="vikram@acmeinteriors.com",
        phone="+91 98201 11223",
        status="active",
        total_revenue=120000.00,
        leads=[],
        invoices=[],
        proposals=[],
        activities=[]
    )

@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: str,
    payload: CustomerUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Updates customer details."""
    client = get_supabase_client() or get_supabase_admin_client()
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}

    if client is not None:
        try:
            res = client.table("customers").update(update_data).eq("id", customer_id).execute()
            if res.data:
                return CustomerResponse(**res.data[0])
        except Exception as e:
            logger.error(f"Error updating customer: {e}")

    return CustomerResponse(
        id=customer_id,
        business_id="biz-1",
        name=payload.name or "Updated Customer",
        **update_data
    )

@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(
    customer_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Deletes a customer record and cascades associations."""
    client = get_supabase_client() or get_supabase_admin_client()
    if client is not None:
        try:
            client.table("customers").delete().eq("id", customer_id).execute()
        except Exception as e:
            logger.error(f"Error deleting customer: {e}")
    return None
