import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Header, Request, status
from app.models.schemas import (
    PlanConfigResponse,
    SubscriptionResponse,
    EntitlementsResponse,
    UsageSummaryResponse,
    BillingHistoryItemResponse,
    RestoreSubscriptionRequest,
    RestoreSubscriptionResponse,
    SubscriptionUpgradeRequest,
)
from app.core.security import get_current_user_id
from app.services.billing.billing_service import billing_service
from app.services.billing.revenuecat import revenuecat_service

logger = logging.getLogger("soloceo_billing_router")

router = APIRouter(prefix="/billing", tags=["Billing & Monetization"])

@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription(
    business_id: str = Query(..., description="Active workspace ID"),
    user_id: str = Depends(get_current_user_id)
):
    """Retrieves current subscription status for the active business workspace."""
    return await billing_service.get_subscription(business_id=business_id, user_id=user_id)


@router.get("/plans", response_model=List[PlanConfigResponse])
async def list_plans():
    """Returns all available commercial pricing plans."""
    return await billing_service.get_plans()


@router.get("/entitlements", response_model=EntitlementsResponse)
async def get_entitlements(
    business_id: str = Query(..., description="Active workspace ID"),
    user_id: str = Depends(get_current_user_id)
):
    """Calculates feature access and remaining credit / workflow allowances."""
    return await billing_service.get_entitlements(business_id=business_id)


@router.get("/usage", response_model=UsageSummaryResponse)
async def get_usage(
    business_id: str = Query(..., description="Active workspace ID"),
    user_id: str = Depends(get_current_user_id)
):
    """Returns AI credits and automation usage breakdown."""
    return await billing_service.get_usage_summary(business_id=business_id)


@router.get("/history", response_model=List[BillingHistoryItemResponse])
async def get_billing_history(
    business_id: str = Query(..., description="Active workspace ID"),
    user_id: str = Depends(get_current_user_id)
):
    """Returns billing invoices and payment receipts."""
    return await billing_service.get_billing_history(business_id=business_id)


@router.post("/restore", response_model=RestoreSubscriptionResponse)
async def restore_subscription(
    payload: RestoreSubscriptionRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Restores existing subscription purchases and synchronizes active entitlements."""
    return await billing_service.restore_purchases(
        business_id=payload.business_id,
        app_user_id=payload.app_user_id
    )


@router.post("/upgrade", response_model=SubscriptionResponse)
async def upgrade_plan(
    payload: SubscriptionUpgradeRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Applies a plan tier upgrade for the active business workspace."""
    return await billing_service.upgrade_plan_tier(
        business_id=payload.business_id,
        new_tier=payload.plan_tier
    )


@router.post("/webhook/revenuecat")
async def revenuecat_webhook(
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """
    Receives and processes server-to-server subscription webhook events from RevenueCat.
    Verifies authorization header and synchronizes subscription state.
    """
    if not revenuecat_service.verify_webhook_auth(authorization):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing RevenueCat webhook authorization header"
        )

    try:
        body = await request.json()
        result = await revenuecat_service.process_webhook_event(payload=body)
        return {"success": True, "result": result}
    except Exception as e:
        logger.error(f"Error handling RevenueCat webhook: {e}")
        raise HTTPException(status_code=400, detail=str(e))
