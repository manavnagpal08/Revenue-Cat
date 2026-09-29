import logging
from typing import Dict, Any, Optional
from app.services.analytics.analytics_service import AnalyticsService
from app.services.analytics.report_service import ReportService
from app.models.schemas import ReportGenerateRequest

logger = logging.getLogger("soloceo.ai.tools.analytics")

def get_analytics_overview_tool(business_id: str, time_frame: str = "30d") -> Dict[str, Any]:
    """Retrieves business intelligence overview metrics, revenue, leads, and customer growth."""
    res = AnalyticsService.get_overview(business_id=business_id, time_frame=time_frame)
    return res.model_dump()

def get_revenue_analytics_tool(business_id: str, time_frame: str = "30d") -> Dict[str, Any]:
    """Retrieves detailed revenue breakdown, collected amounts, outstanding invoices and top paying accounts."""
    res = AnalyticsService.get_revenue_analytics(business_id=business_id, time_frame=time_frame)
    return res.model_dump()

def get_sales_analytics_tool(business_id: str, time_frame: str = "30d") -> Dict[str, Any]:
    """Retrieves sales funnel conversion rates, win/loss stats, deal cycle and pipeline valuation."""
    res = AnalyticsService.get_sales_analytics(business_id=business_id, time_frame=time_frame)
    return res.model_dump()

def get_customer_analytics_tool(business_id: str, time_frame: str = "30d") -> Dict[str, Any]:
    """Retrieves customer segmentation (high-value, at-risk, active, inactive) and growth rates."""
    res = AnalyticsService.get_customer_analytics(business_id=business_id, time_frame=time_frame)
    return res.model_dump()

def get_business_insights_tool(business_id: str, time_frame: str = "30d", category: Optional[str] = None) -> Dict[str, Any]:
    """Retrieves AI-calculated business health recommendations and actionable alerts."""
    res = AnalyticsService.get_insights(business_id=business_id, time_frame=time_frame, category=category)
    return res.model_dump()

def generate_business_report_tool(business_id: str, report_type: str = "executive_summary", time_frame: str = "30d") -> Dict[str, Any]:
    """Generates a comprehensive executive business report with multi-section narrative analysis."""
    req = ReportGenerateRequest(business_id=business_id, report_type=report_type, time_frame=time_frame)
    start_dt = None
    end_dt = None
    from app.services.analytics.data_fetcher import get_time_range_bounds, fetch_business_data
    from app.services.analytics.revenue_analytics import calculate_revenue_analytics
    from app.services.analytics.sales_analytics import calculate_sales_analytics
    from app.services.analytics.customer_analytics import calculate_customer_analytics
    from app.services.analytics.finance_analytics import calculate_finance_analytics
    from app.services.analytics.ai_analytics import calculate_ai_analytics
    from app.services.analytics.automation_analytics import calculate_automation_analytics

    start_dt, end_dt = get_time_range_bounds(time_frame)
    raw = fetch_business_data(business_id, start_dt, end_dt)

    rev = calculate_revenue_analytics(raw["invoices"], raw["customers"], start_dt, end_dt, time_frame)
    sales = calculate_sales_analytics(raw["leads"], raw["proposals"], start_dt, end_dt, time_frame)
    cust = calculate_customer_analytics(raw["customers"], raw["invoices"], start_dt, end_dt, time_frame)
    fin = calculate_finance_analytics(raw["invoices"], start_dt, end_dt, time_frame)
    ai = calculate_ai_analytics(business_id, raw["ai_usage"], start_dt, end_dt, time_frame)
    auto = calculate_automation_analytics(business_id, raw["automation_runs"], start_dt, end_dt, time_frame)

    report = ReportService.generate_report(
        req=req,
        revenue_data=rev,
        sales_data=sales,
        customer_data=cust,
        finance_data=fin,
        ai_data=ai,
        automation_data=auto,
        user_id="ai_agent"
    )
    return report.model_dump()
