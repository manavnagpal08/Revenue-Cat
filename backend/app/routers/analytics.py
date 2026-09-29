import logging
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.core.security import get_current_user
from app.services.analytics.analytics_service import AnalyticsService
from app.models.schemas import (
    AnalyticsOverviewResponse,
    RevenueAnalyticsResponse,
    SalesAnalyticsResponse,
    CustomerAnalyticsResponse,
    FinanceAnalyticsResponse,
    AIUsageAnalyticsResponse,
    AutomationAnalyticsDetailsResponse,
    BusinessInsightsResponse
)

logger = logging.getLogger("soloceo.routers.analytics")
router = APIRouter(prefix="/analytics", tags=["Business Intelligence & Analytics"])

@router.get("/overview", response_model=AnalyticsOverviewResponse)
async def get_analytics_overview(
    business_id: str = Query(..., description="Active workspace ID"),
    time_frame: str = Query("30d", description="Timeframe: 7d, 30d, 90d, 1y, custom"),
    period_start: Optional[datetime] = Query(None),
    period_end: Optional[datetime] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Returns top-level business intelligence overview and sparkline trends."""
    return AnalyticsService.get_overview(
        business_id=business_id,
        time_frame=time_frame,
        period_start=period_start,
        period_end=period_end
    )

@router.get("/revenue", response_model=RevenueAnalyticsResponse)
async def get_revenue_analytics(
    business_id: str = Query(..., description="Active workspace ID"),
    time_frame: str = Query("30d"),
    period_start: Optional[datetime] = Query(None),
    period_end: Optional[datetime] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Returns in-depth revenue analytics, collection rates, and customer rankings."""
    return AnalyticsService.get_revenue_analytics(
        business_id=business_id,
        time_frame=time_frame,
        period_start=period_start,
        period_end=period_end
    )

@router.get("/sales", response_model=SalesAnalyticsResponse)
async def get_sales_analytics(
    business_id: str = Query(..., description="Active workspace ID"),
    time_frame: str = Query("30d"),
    period_start: Optional[datetime] = Query(None),
    period_end: Optional[datetime] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Returns sales pipeline funnel, conversion velocity, and proposal metrics."""
    return AnalyticsService.get_sales_analytics(
        business_id=business_id,
        time_frame=time_frame,
        period_start=period_start,
        period_end=period_end
    )

@router.get("/customers", response_model=CustomerAnalyticsResponse)
async def get_customer_analytics(
    business_id: str = Query(..., description="Active workspace ID"),
    time_frame: str = Query("30d"),
    period_start: Optional[datetime] = Query(None),
    period_end: Optional[datetime] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Returns customer growth, segmentation, and retention stats."""
    return AnalyticsService.get_customer_analytics(
        business_id=business_id,
        time_frame=time_frame,
        period_start=period_start,
        period_end=period_end
    )

@router.get("/finance", response_model=FinanceAnalyticsResponse)
async def get_finance_analytics(
    business_id: str = Query(..., description="Active workspace ID"),
    time_frame: str = Query("30d"),
    period_start: Optional[datetime] = Query(None),
    period_end: Optional[datetime] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Returns finance distributions, invoice aging, and payment velocity."""
    return AnalyticsService.get_finance_analytics(
        business_id=business_id,
        time_frame=time_frame,
        period_start=period_start,
        period_end=period_end
    )

@router.get("/ai-usage", response_model=AIUsageAnalyticsResponse)
async def get_ai_usage_analytics(
    business_id: str = Query(..., description="Active workspace ID"),
    time_frame: str = Query("30d"),
    period_start: Optional[datetime] = Query(None),
    period_end: Optional[datetime] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Returns AI credit consumption, agent usage, and daily trends."""
    return AnalyticsService.get_ai_usage_analytics(
        business_id=business_id,
        time_frame=time_frame,
        period_start=period_start,
        period_end=period_end
    )

@router.get("/automations", response_model=AutomationAnalyticsDetailsResponse)
async def get_automation_analytics(
    business_id: str = Query(..., description="Active workspace ID"),
    time_frame: str = Query("30d"),
    period_start: Optional[datetime] = Query(None),
    period_end: Optional[datetime] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Returns workflow runs, success rates, and estimated hours saved."""
    return AnalyticsService.get_automation_analytics(
        business_id=business_id,
        time_frame=time_frame,
        period_start=period_start,
        period_end=period_end
    )

@router.get("/insights", response_model=BusinessInsightsResponse)
async def get_business_insights(
    business_id: str = Query(..., description="Active workspace ID"),
    time_frame: str = Query("30d"),
    category: Optional[str] = Query(None, description="Filter category: revenue, sales, customers, finance, automations"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Returns automated business intelligence insights and recommendations."""
    return AnalyticsService.get_insights(
        business_id=business_id,
        time_frame=time_frame,
        category=category
    )
