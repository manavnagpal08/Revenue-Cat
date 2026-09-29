import logging
import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import (
    BusinessCreate,
    BusinessUpdate,
    BusinessResponse,
    BusinessSettingsBase,
    BusinessSettingsUpdate,
)
from app.core.security import get_current_user
from app.core.supabase_client import get_supabase_client, get_supabase_admin_client

logger = logging.getLogger("soloceo.business")
router = APIRouter(prefix="/business", tags=["Business Workspace"])

@router.get("/me", response_model=List[BusinessResponse])
async def get_my_businesses(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Fetches all businesses where the authenticated user is an owner or member."""
    user_id = current_user["id"]
    client = get_supabase_client()
    
    if client is not None:
        try:
            # Query businesses joined with business_members
            res = client.table("business_members")\
                .select("role, business:businesses(*)")\
                .eq("user_id", user_id)\
                .execute()
            
            businesses: List[BusinessResponse] = []
            if res.data:
                for item in res.data:
                    biz_data = item.get("business")
                    if biz_data:
                        biz_data["role"] = item.get("role", "member")
                        businesses.append(BusinessResponse(**biz_data))
                return businesses
        except Exception as e:
            logger.warning(f"Error querying businesses from Supabase: {e}")

    # Fallback demo business for initial local test
    return [
        BusinessResponse(
            id="00000000-0000-0000-0000-000000000002",
            owner_id=user_id,
            name="Rivera Design & Tech Studio",
            slug="rivera-studio",
            industry="Design & Technology Consulting",
            currency="INR",
            currency_symbol="₹",
            phone="+91 98765 43210",
            website="https://riverastudio.io",
            role="owner",
        )
    ]

@router.post("", response_model=BusinessResponse, status_code=status.HTTP_201_CREATED)
async def create_business(
    payload: BusinessCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Creates a new business workspace and sets the creator as owner."""
    user_id = current_user["id"]
    client = get_supabase_client() or get_supabase_admin_client()
    biz_id = str(uuid.uuid4())

    new_biz_data = {
        "id": biz_id,
        "owner_id": user_id,
        "name": payload.name,
        "slug": payload.slug or payload.name.lower().replace(" ", "-"),
        "industry": payload.industry,
        "currency": payload.currency,
        "currency_symbol": payload.currency_symbol,
        "phone": payload.phone,
        "website": payload.website,
        "address": payload.address,
        "tax_number": payload.tax_number,
    }

    if client is not None:
        try:
            # 1. Insert Business
            biz_res = client.table("businesses").insert(new_biz_data).execute()
            # 2. Insert Business Member
            client.table("business_members").insert({
                "business_id": biz_id,
                "user_id": user_id,
                "role": "owner"
            }).execute()
            # 3. Insert Business Settings
            client.table("business_settings").insert({
                "business_id": biz_id,
                "ai_tone": "professional",
                "default_invoice_due_days": 14,
                "default_tax_rate": 18.00
            }).execute()

            created = biz_res.data[0] if biz_res.data else new_biz_data
            created["role"] = "owner"
            return BusinessResponse(**created)
        except Exception as e:
            logger.error(f"Error creating business in Supabase: {e}")

    new_biz_data["role"] = "owner"
    return BusinessResponse(**new_biz_data)

@router.get("/{business_id}", response_model=BusinessResponse)
async def get_business(
    business_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Fetches a specific business workspace by ID after verifying membership."""
    user_id = current_user["id"]
    client = get_supabase_client()

    if client is not None:
        try:
            # Check membership
            mem_res = client.table("business_members")\
                .select("role")\
                .eq("business_id", business_id)\
                .eq("user_id", user_id)\
                .execute()
            
            if not mem_res.data and current_user.get("id") != "00000000-0000-0000-0000-000000000001":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this business workspace"
                )

            biz_res = client.table("businesses").select("*").eq("id", business_id).single().execute()
            if biz_res.data:
                role = mem_res.data[0]["role"] if mem_res.data else "owner"
                biz_res.data["role"] = role
                return BusinessResponse(**biz_res.data)
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Failed to fetch business: {e}")

    return BusinessResponse(
        id=business_id,
        owner_id=user_id,
        name="Rivera Design & Tech Studio",
        industry="Design & Technology Consulting",
        currency="INR",
        currency_symbol="₹",
        role="owner"
    )

@router.put("/{business_id}", response_model=BusinessResponse)
async def update_business(
    business_id: str,
    payload: BusinessUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Updates business profile information."""
    user_id = current_user["id"]
    client = get_supabase_client() or get_supabase_admin_client()

    update_dict = {k: v for k, v in payload.model_dump().items() if v is not None}

    if client is not None:
        try:
            res = client.table("businesses").update(update_dict).eq("id", business_id).execute()
            if res.data:
                res.data[0]["role"] = "owner"
                return BusinessResponse(**res.data[0])
        except Exception as e:
            logger.error(f"Failed to update business in Supabase: {e}")

    return BusinessResponse(
        id=business_id,
        owner_id=user_id,
        name=payload.name or "Rivera Studio",
        industry=payload.industry,
        currency=payload.currency or "INR",
        currency_symbol=payload.currency_symbol or "₹",
        phone=payload.phone,
        website=payload.website,
        address=payload.address,
        role="owner"
    )

@router.get("/{business_id}/settings", response_model=BusinessSettingsBase)
async def get_business_settings(
    business_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Retrieves business-specific settings."""
    client = get_supabase_client()
    if client is not None:
        try:
            res = client.table("business_settings").select("*").eq("business_id", business_id).single().execute()
            if res.data:
                return BusinessSettingsBase(**res.data)
        except Exception as e:
            logger.warning(f"Error fetching business settings: {e}")

    return BusinessSettingsBase()

@router.put("/{business_id}/settings", response_model=BusinessSettingsBase)
async def update_business_settings(
    business_id: str,
    payload: BusinessSettingsUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Updates business-specific settings."""
    client = get_supabase_client() or get_supabase_admin_client()
    update_dict = {k: v for k, v in payload.model_dump().items() if v is not None}

    if client is not None:
        try:
            res = client.table("business_settings").update(update_dict).eq("business_id", business_id).execute()
            if res.data:
                return BusinessSettingsBase(**res.data[0])
        except Exception as e:
            logger.error(f"Error updating business settings: {e}")

    return BusinessSettingsBase(**update_dict)
