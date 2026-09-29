import uuid
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.core.supabase_client import get_supabase_client
from app.models.schemas import ReportResponse, ReportListItemResponse, ReportGenerateRequest

logger = logging.getLogger("soloceo.analytics.reports")

_in_memory_reports: Dict[str, Dict[str, Any]] = {}

class ReportService:
    """Manages AI-generated multi-section business reports and structured exports."""

    @classmethod
    def generate_report(
        cls,
        req: ReportGenerateRequest,
        revenue_data: Dict[str, Any],
        sales_data: Dict[str, Any],
        customer_data: Dict[str, Any],
        finance_data: Dict[str, Any],
        ai_data: Dict[str, Any],
        automation_data: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> ReportResponse:
        """Assembles a rich multi-section business report with narrative summaries and structured telemetry."""
        now = datetime.now(timezone.utc)
        report_id = str(uuid.uuid4())
        
        # Build Title
        title_map = {
            "executive_summary": "Executive Business Operations Briefing",
            "monthly_financial": "Monthly Financial & Cash Collection Report",
            "sales_pipeline": "Sales Pipeline & Conversion Velocity Report",
            "customer_health": "Customer Segmentation & Health Analysis",
            "full_operational": "Comprehensive Full Operational Review"
        }
        report_title = req.title or title_map.get(req.report_type, "SoloCEO Business Report")

        # Compile Narrative Summary
        tot_rev = revenue_data.get("total_collected", 0.0)
        col_rate = revenue_data.get("collection_rate_percent", 0.0)
        overdue_amt = finance_data.get("total_amount_overdue", 0.0)
        pipeline_val = sales_data.get("total_pipeline_value", 0.0)
        total_leads = sales_data.get("total_leads", 0)
        win_rate = sales_data.get("win_rate_percent", 0.0)
        time_saved = automation_data.get("time_saved_hours_estimated", 0.0)

        summary_narrative = (
            f"During the {req.time_frame.upper()} period, total collected revenue reached ₹{tot_rev:,.2f} "
            f"with a {col_rate}% collection rate. The active sales pipeline holds {total_leads} leads valued at ₹{pipeline_val:,.2f} "
            f"with an overall win rate of {win_rate}%. AI Workflows successfully saved approximately {time_saved} hours of manual effort. "
            f"Overdue exposure stands at ₹{overdue_amt:,.2f} requiring targeted follow-ups."
        )

        # Build Sections
        sections = [
            {
                "title": "1. Executive Highlights & Performance",
                "summary": f"Strong operational tempo with ₹{tot_rev:,.2f} collected and {customer_data.get('total_customers', 0)} active client accounts.",
                "metrics": {
                    "Total Revenue Collected": f"₹{tot_rev:,.2f}",
                    "Collection Rate": f"{col_rate}%",
                    "Active Leads": total_leads,
                    "Estimated Pipeline Value": f"₹{pipeline_val:,.2f}"
                }
            },
            {
                "title": "2. Financial Health & Invoice Telemetry",
                "summary": f"Billed ₹{finance_data.get('total_amount_billed', 0.0):,.2f} across {finance_data.get('total_invoices', 0)} invoices. Overdue balance is ₹{overdue_amt:,.2f}.",
                "metrics": {
                    "Paid Invoices": finance_data.get("paid_invoices_count", 0),
                    "Pending Invoices": finance_data.get("pending_invoices_count", 0),
                    "Overdue Invoices": finance_data.get("overdue_invoices_count", 0),
                    "Average Payment Velocity": f"{finance_data.get('payment_velocity_average_days', 0)} days"
                }
            },
            {
                "title": "3. Sales Funnel & Pipeline Velocity",
                "summary": f"Conversion rate is {win_rate}% with {sales_data.get('won_leads', 0)} closed won deals. Average deal size is ₹{sales_data.get('average_deal_size', 0.0):,.2f}.",
                "metrics": {
                    "Total Leads Processed": total_leads,
                    "Deals Won": sales_data.get("won_leads", 0),
                    "Deals Lost": sales_data.get("lost_leads", 0),
                    "Sales Cycle Average": f"{sales_data.get('average_sales_cycle_days', 0)} days"
                }
            },
            {
                "title": "4. Customer Accounts & Retention",
                "summary": f"Total customer base is {customer_data.get('total_customers', 0)} with {customer_data.get('segments', {}).get('high_value', 0)} high-value accounts (>₹100k).",
                "metrics": {
                    "New Customers": customer_data.get("new_customers", 0),
                    "Active Accounts": customer_data.get("active_customers", 0),
                    "At-Risk Accounts": customer_data.get("segments", {}).get("at_risk", 0),
                    "Inactive Accounts": customer_data.get("segments", {}).get("inactive", 0)
                }
            },
            {
                "title": "5. AI Automation & Operations Impact",
                "summary": f"Executed {automation_data.get('total_executions', 0)} workflow triggers with {automation_data.get('success_rate_percent', 100)}% reliability, saving ~{time_saved} hours.",
                "metrics": {
                    "Active Workflows": automation_data.get("active_workflows", 0),
                    "Successful Triggers": automation_data.get("successful_executions", 0),
                    "AI Credits Used": ai_data.get("credits_used", 0),
                    "AI Credits Remaining": ai_data.get("credits_remaining", 0)
                }
            }
        ]

        structured_data = {
            "revenue": revenue_data,
            "sales": sales_data,
            "customers": customer_data,
            "finance": finance_data,
            "ai": ai_data,
            "automation": automation_data
        }

        report_record = {
            "id": report_id,
            "business_id": req.business_id,
            "created_by": user_id,
            "report_type": req.report_type,
            "title": report_title,
            "period_start": req.period_start or revenue_data.get("period_start", now),
            "period_end": req.period_end or revenue_data.get("period_end", now),
            "time_frame": req.time_frame,
            "summary": summary_narrative,
            "sections": sections,
            "structured_data": structured_data,
            "created_at": now
        }

        # Store in Supabase if available
        client = get_supabase_client()
        if client is not None:
            try:
                db_payload = {
                    "id": report_id,
                    "business_id": req.business_id,
                    "created_by": user_id,
                    "report_type": req.report_type,
                    "title": report_title,
                    "period_start": report_record["period_start"].isoformat() if isinstance(report_record["period_start"], datetime) else str(report_record["period_start"]),
                    "period_end": report_record["period_end"].isoformat() if isinstance(report_record["period_end"], datetime) else str(report_record["period_end"]),
                    "time_frame": req.time_frame,
                    "summary": summary_narrative,
                    "sections": sections,
                    "structured_data": structured_data,
                    "created_at": now.isoformat()
                }
                client.table("reports").insert(db_payload).execute()
            except Exception as e:
                logger.warning(f"Error persisting report to Supabase: {e}")

        _in_memory_reports[report_id] = report_record

        return ReportResponse(**report_record)

    @classmethod
    def list_reports(cls, business_id: str) -> List[ReportListItemResponse]:
        """Lists previously generated reports for the business."""
        client = get_supabase_client()
        if client is not None:
            try:
                res = client.table("reports").select("id, business_id, report_type, title, period_start, period_end, time_frame, created_at").eq("business_id", business_id).order("created_at", desc=True).execute()
                if res.data:
                    return [ReportListItemResponse(**item) for item in res.data]
            except Exception as e:
                logger.warning(f"Error listing reports from Supabase: {e}")

        # In-memory fallback
        b_reports = [r for r in _in_memory_reports.values() if r.get("business_id") == business_id]
        if not b_reports:
            # Provide sample recent report
            now = datetime.now(timezone.utc)
            sample_id = "rep_sample_01"
            sample = {
                "id": sample_id,
                "business_id": business_id,
                "report_type": "executive_summary",
                "title": "Monthly Executive Operations Summary",
                "period_start": now,
                "period_end": now,
                "time_frame": "30d",
                "created_at": now
            }
            return [ReportListItemResponse(**sample)]

        return [ReportListItemResponse(**r) for r in sorted(b_reports, key=lambda x: str(x.get("created_at")), reverse=True)]

    @classmethod
    def get_report_by_id(cls, report_id: str, business_id: str) -> Optional[ReportResponse]:
        """Gets full report details."""
        client = get_supabase_client()
        if client is not None:
            try:
                res = client.table("reports").select("*").eq("id", report_id).eq("business_id", business_id).single().execute()
                if res.data:
                    return ReportResponse(**res.data)
            except Exception as e:
                logger.warning(f"Error getting report from Supabase: {e}")

        if report_id in _in_memory_reports:
            return ReportResponse(**_in_memory_reports[report_id])
        return None

    @classmethod
    def export_report(cls, report: ReportResponse, export_format: str) -> Dict[str, str]:
        """Formats the report into the requested export representation (CSV, JSON, Markdown)."""
        fmt = (export_format or "json").lower()
        clean_title = report.title.lower().replace(" ", "_")
        filename = f"{clean_title}_{report.time_frame}.{fmt}"

        if fmt == "csv":
            lines = ["Section,Metric,Value"]
            for s in report.sections:
                s_title = s.get("title", "").replace(",", ";")
                for k, v in s.get("metrics", {}).items():
                    k_clean = str(k).replace(",", ";")
                    v_clean = str(v).replace(",", ";")
                    lines.append(f'"{s_title}","{k_clean}","{v_clean}"')
            content = "\n".join(lines)
            filename = f"{clean_title}_{report.time_frame}.csv"
        elif fmt == "markdown" or fmt == "md":
            lines = [f"# {report.title}", f"**Period:** {report.time_frame.upper()} | **Generated:** {report.created_at.strftime('%Y-%m-%d %H:%M UTC')}", "", f"### Executive Summary", report.summary, ""]
            for s in report.sections:
                lines.append(f"## {s.get('title')}")
                lines.append(s.get('summary', ''))
                lines.append("")
                lines.append("| Metric | Value |")
                lines.append("| :--- | :--- |")
                for k, v in s.get("metrics", {}).items():
                    lines.append(f"| {k} | {v} |")
                lines.append("")
            content = "\n".join(lines)
            filename = f"{clean_title}_{report.time_frame}.md"
        else: # JSON
            content = json.dumps(report.model_dump(), default=str, indent=2)
            filename = f"{clean_title}_{report.time_frame}.json"

        return {
            "report_id": report.id,
            "format": fmt,
            "content": content,
            "filename": filename
        }
