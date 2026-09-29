from typing import Dict, Any
from app.services.ai.tools.sales_tools import get_inactive_leads_tool, get_pipeline_summary_tool
from app.services.ai.tools.finance_tools import get_overdue_invoices_tool, get_financial_summary_tool
from app.services.ai.tools.proposal_tools import get_proposals_tool

async def get_business_brief_tool(business_id: str) -> Dict[str, Any]:
    """
    Generate an operational synthesis across all modules:
    - Top opportunity / inactive lead
    - Overdue collections alert
    - Proposals waiting for client signature
    - Key action item for the day
    """
    inactive_res = await get_inactive_leads_tool(business_id=business_id, days_threshold=5)
    finance_res = await get_financial_summary_tool(business_id=business_id)
    overdue_res = await get_overdue_invoices_tool(business_id=business_id)
    proposals_res = await get_proposals_tool(business_id=business_id, status="sent")

    top_opportunity = None
    if inactive_res["inactive_leads"]:
        top_opportunity = inactive_res["inactive_leads"][0]

    return {
        "top_opportunity": top_opportunity,
        "inactive_leads_count": inactive_res["inactive_count"],
        "inactive_leads_value": inactive_res["total_at_risk_value"],
        "overdue_invoices_count": overdue_res["overdue_count"],
        "overdue_amount": overdue_res["total_overdue_amount"],
        "revenue_collected": finance_res["revenue_collected"],
        "pending_proposals_count": proposals_res["count"],
        "pending_proposals_value": proposals_res["total_value"],
        "generated_at_summary": "Synthesized from live database records."
    }
