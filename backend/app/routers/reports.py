import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.core.security import get_current_user
from app.services.analytics.data_fetcher import get_time_range_bounds, fetch_business_data
from app.services.analytics.revenue_analytics import calculate_revenue_analytics
from app.services.analytics.sales_analytics import calculate_sales_analytics
from app.services.analytics.customer_analytics import calculate_customer_analytics
from app.services.analytics.finance_analytics import calculate_finance_analytics
from app.services.analytics.ai_analytics import calculate_ai_analytics
from app.services.analytics.automation_analytics import calculate_automation_analytics
from app.services.analytics.report_service import ReportService
from app.models.schemas import (
    ReportGenerateRequest,
    ReportResponse,
    ReportListItemResponse,
    ReportExportResponse
)

logger = logging.getLogger("soloceo.routers.reports")
router = APIRouter(prefix="/reports", tags=["AI Business Reports & Exports"])

@router.post("/generate", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def generate_report(
    req: ReportGenerateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Generates and persists a structured multi-section business intelligence report."""
    start_dt, end_dt = get_time_range_bounds(req.time_frame, req.period_start, req.period_end)
    raw_data = fetch_business_data(req.business_id, start_dt, end_dt)

    rev = calculate_revenue_analytics(raw_data["invoices"], raw_data["customers"], start_dt, end_dt, req.time_frame)
    sales = calculate_sales_analytics(raw_data["leads"], raw_data["proposals"], start_dt, end_dt, req.time_frame)
    cust = calculate_customer_analytics(raw_data["customers"], raw_data["invoices"], start_dt, end_dt, req.time_frame)
    fin = calculate_finance_analytics(raw_data["invoices"], start_dt, end_dt, req.time_frame)
    ai = calculate_ai_analytics(req.business_id, raw_data["ai_usage"], start_dt, end_dt, req.time_frame)
    auto = calculate_automation_analytics(req.business_id, raw_data["automation_runs"], start_dt, end_dt, req.time_frame)

    user_id = current_user.get("id") or current_user.get("sub")

    report = ReportService.generate_report(
        req=req,
        revenue_data=rev,
        sales_data=sales,
        customer_data=cust,
        finance_data=fin,
        ai_data=ai,
        automation_data=auto,
        user_id=user_id
    )
    return report

@router.get("", response_model=List[ReportListItemResponse])
async def list_reports(
    business_id: str = Query(..., description="Active workspace ID"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Lists past generated reports for the active business."""
    return ReportService.list_reports(business_id=business_id)

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    business_id: str = Query(..., description="Active workspace ID"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Retrieves full details of a specific report."""
    report = ReportService.get_report_by_id(report_id=report_id, business_id=business_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.get("/{report_id}/export", response_model=ReportExportResponse)
async def export_report(
    report_id: str,
    business_id: str = Query(..., description="Active workspace ID"),
    format: str = Query("json", description="Export format: json, csv, markdown"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Exports a generated report into CSV, Markdown, or JSON."""
    report = ReportService.get_report_by_id(report_id=report_id, business_id=business_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    exported = ReportService.export_report(report=report, export_format=format)
    return ReportExportResponse(**exported)
