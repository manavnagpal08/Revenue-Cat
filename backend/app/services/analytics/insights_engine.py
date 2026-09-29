import uuid
import logging
from typing import Dict, Any, List
from datetime import datetime, timezone
from app.models.schemas import BusinessInsightItem

logger = logging.getLogger("soloceo.analytics.insights")

def generate_business_insights(
    revenue_data: Dict[str, Any],
    sales_data: Dict[str, Any],
    customer_data: Dict[str, Any],
    finance_data: Dict[str, Any],
    ai_data: Dict[str, Any],
    automation_data: Dict[str, Any]
) -> List[BusinessInsightItem]:
    """Evaluates business operational metrics against heuristics to generate actionable insights."""
    now = datetime.now(timezone.utc)
    insights: List[BusinessInsightItem] = []

    # 1. Finance / Overdue Invoices
    overdue_val = finance_data.get("total_amount_overdue", 0.0)
    overdue_count = finance_data.get("overdue_invoices_count", 0)
    if overdue_count > 0:
        insights.append(BusinessInsightItem(
            id=f"ins_fin_{uuid.uuid4().hex[:6]}",
            category="finance",
            severity="high",
            title=f"{overdue_count} Overdue Invoice{'s' if overdue_count > 1 else ''} Need Attention",
            description=f"You have ₹{overdue_val:,.2f} in past-due payments. Automated payment reminders can accelerate recovery.",
            action_label="Review Invoices",
            action_route="/(tabs)/invoices",
            metric_impact=f"₹{overdue_val:,.0f} pending",
            calculated_at=now
        ))

    # 2. Sales Pipeline / High Value Deals
    pipeline_val = sales_data.get("total_pipeline_value", 0.0)
    funnel_stages = sales_data.get("funnel_stages", [])
    nego_stage = next((s for s in funnel_stages if "Negotiation" in s.get("stage", "")), None)
    if nego_stage and nego_stage.get("count", 0) > 0:
        insights.append(BusinessInsightItem(
            id=f"ins_sales_{uuid.uuid4().hex[:6]}",
            category="sales",
            severity="medium",
            title=f"{nego_stage['count']} High-Value Deals in Negotiation",
            description=f"Closing deals currently in negotiation could unlock up to ₹{nego_stage.get('value', 0):,.2f} in fresh revenue.",
            action_label="View Pipeline",
            action_route="/(tabs)/leads",
            metric_impact=f"₹{nego_stage.get('value', 0):,.0f} value",
            calculated_at=now
        ))

    # 3. Proposals Pending
    prop_summary = sales_data.get("proposals_summary", {})
    prop_pending = prop_summary.get("pending", 0)
    if prop_pending > 0:
        insights.append(BusinessInsightItem(
            id=f"ins_prop_{uuid.uuid4().hex[:6]}",
            category="sales",
            severity="medium",
            title=f"{prop_pending} Proposal{'s' if prop_pending > 1 else ''} Awaiting Client Decision",
            description=f"Follow up with clients on pending proposals to maintain deal momentum and increase win rate.",
            action_label="Check Proposals",
            action_route="/proposals",
            metric_impact=f"{prop_pending} open",
            calculated_at=now
        ))

    # 4. Customer Segmentation / High Value Accounts
    segments = customer_data.get("segments", {})
    high_val_count = segments.get("high_value", 0)
    at_risk_count = segments.get("at_risk", 0)
    if at_risk_count > 0:
        insights.append(BusinessInsightItem(
            id=f"ins_cust_{uuid.uuid4().hex[:6]}",
            category="customers",
            severity="medium",
            title=f"{at_risk_count} Customer{'s' if at_risk_count > 1 else ''} Identified as At-Risk",
            description="Accounts with pending invoices or no interaction in 30+ days. Schedule a check-in to preserve retention.",
            action_label="View Customers",
            action_route="/(tabs)/customers",
            metric_impact=f"{at_risk_count} accounts",
            calculated_at=now
        ))

    # 5. Revenue Health & Collection Rate
    col_rate = revenue_data.get("collection_rate_percent", 0.0)
    tot_collected = revenue_data.get("total_collected", 0.0)
    if col_rate >= 70.0:
        insights.append(BusinessInsightItem(
            id=f"ins_rev_{uuid.uuid4().hex[:6]}",
            category="revenue",
            severity="positive",
            title=f"Healthy Collection Rate of {col_rate}%",
            description=f"Collected ₹{tot_collected:,.2f} smoothly this period with strong payment adherence.",
            action_label="View Revenue",
            action_route="/analytics/revenue",
            metric_impact=f"{col_rate}% collected",
            calculated_at=now
        ))

    # 6. Automation & Efficiency
    time_saved = automation_data.get("time_saved_hours_estimated", 0.0)
    success_rate = automation_data.get("success_rate_percent", 100.0)
    if time_saved > 0:
        insights.append(BusinessInsightItem(
            id=f"ins_auto_{uuid.uuid4().hex[:6]}",
            category="automations",
            severity="positive",
            title=f"Automations Saved ~{time_saved} Hours of Admin Time",
            description=f"Your workflows achieved a {success_rate}% success rate across {automation_data.get('total_executions', 0)} triggers.",
            action_label="Manage Workflows",
            action_route="/(tabs)/automations",
            metric_impact=f"{time_saved} hrs saved",
            calculated_at=now
        ))

    # 7. AI Credits Monitoring
    credits_remaining = ai_data.get("credits_remaining", 10)
    credits_total = ai_data.get("credits_total", 50)
    if credits_total > 0 and (credits_remaining / credits_total) <= 0.2:
        insights.append(BusinessInsightItem(
            id=f"ins_ai_{uuid.uuid4().hex[:6]}",
            category="general",
            severity="high",
            title="AI Credits Running Low",
            description=f"Only {credits_remaining} of {credits_total} AI credits remaining this month. Upgrade to avoid interruption.",
            action_label="Upgrade Plan",
            action_route="/billing",
            metric_impact=f"{credits_remaining} left",
            calculated_at=now
        ))

    return insights
