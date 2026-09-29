from typing import Dict, Any, Callable, List, Optional
from app.services.ai.tools.sales_tools import (
    get_leads_tool,
    get_inactive_leads_tool,
    get_pipeline_summary_tool,
    get_lead_activities_tool
)
from app.services.ai.tools.finance_tools import (
    get_invoices_tool,
    get_overdue_invoices_tool,
    get_financial_summary_tool,
    get_customer_revenue_tool,
    get_payments_tool
)
from app.services.ai.tools.proposal_tools import (
    get_proposals_tool,
    get_proposal_tool,
    prepare_proposal_action_tool
)
from app.services.ai.tools.customer_tools import (
    get_customers_tool,
    get_customer_summary_tool
)
from app.services.ai.tools.dashboard_tools import get_business_brief_tool

# Central tool registry dictionary
TOOL_REGISTRY: Dict[str, Dict[str, Any]] = {
    # Sales Tools
    "get_leads": {
        "name": "get_leads",
        "description": "Retrieve leads in the sales pipeline, optionally filtered by status.",
        "type": "READ",
        "handler": get_leads_tool,
        "parameters": {"status": "optional string", "limit": "optional int"}
    },
    "get_inactive_leads": {
        "name": "get_inactive_leads",
        "description": "Find leads that have not been contacted within a specified number of days.",
        "type": "READ",
        "handler": get_inactive_leads_tool,
        "parameters": {"days_threshold": "optional int"}
    },
    "get_pipeline_summary": {
        "name": "get_pipeline_summary",
        "description": "Retrieve summary breakdown of sales pipeline stages and values.",
        "type": "READ",
        "handler": get_pipeline_summary_tool,
        "parameters": {}
    },
    "get_lead_activities": {
        "name": "get_lead_activities",
        "description": "Get interaction timeline history for a specific lead.",
        "type": "READ",
        "handler": get_lead_activities_tool,
        "parameters": {"lead_id": "required string"}
    },

    # Finance Tools
    "get_invoices": {
        "name": "get_invoices",
        "description": "Retrieve invoices list, total amount, paid amount, and outstanding.",
        "type": "READ",
        "handler": get_invoices_tool,
        "parameters": {"status": "optional string", "limit": "optional int"}
    },
    "get_overdue_invoices": {
        "name": "get_overdue_invoices",
        "description": "Retrieve all overdue delinquent invoices and amounts.",
        "type": "READ",
        "handler": get_overdue_invoices_tool,
        "parameters": {}
    },
    "get_financial_summary": {
        "name": "get_financial_summary",
        "description": "Calculate total revenue collected, total outstanding balance, and overdue amounts.",
        "type": "READ",
        "handler": get_financial_summary_tool,
        "parameters": {}
    },
    "get_customer_revenue": {
        "name": "get_customer_revenue",
        "description": "Rank customers by total lifetime revenue.",
        "type": "READ",
        "handler": get_customer_revenue_tool,
        "parameters": {"limit": "optional int"}
    },
    "get_payments": {
        "name": "get_payments",
        "description": "Retrieve recent payment transactions received.",
        "type": "READ",
        "handler": get_payments_tool,
        "parameters": {"limit": "optional int"}
    },

    # Proposal Tools
    "get_proposals": {
        "name": "get_proposals",
        "description": "Retrieve business proposals and total proposed values.",
        "type": "READ",
        "handler": get_proposals_tool,
        "parameters": {"status": "optional string"}
    },
    "get_proposal": {
        "name": "get_proposal",
        "description": "Retrieve single proposal details.",
        "type": "READ",
        "handler": get_proposal_tool,
        "parameters": {"proposal_id": "required string"}
    },
    "prepare_proposal": {
        "name": "prepare_proposal",
        "description": "Draft a proposal and produce an action proposal for user confirmation.",
        "type": "WRITE",
        "handler": prepare_proposal_action_tool,
        "parameters": {
            "title": "required string",
            "customer_name": "optional string",
            "total_value": "optional float",
            "project_overview": "optional string"
        }
    },

    # Customer Tools
    "get_customers": {
        "name": "get_customers",
        "description": "Retrieve customer profiles and total revenues.",
        "type": "READ",
        "handler": get_customers_tool,
        "parameters": {"search": "optional string", "limit": "optional int"}
    },
    "get_customer_summary": {
        "name": "get_customer_summary",
        "description": "Get 360-degree customer details including linked invoices, leads, and proposals.",
        "type": "READ",
        "handler": get_customer_summary_tool,
        "parameters": {"query_name_or_id": "required string"}
    },

    # Dashboard & General Tools
    "get_business_brief": {
        "name": "get_business_brief",
        "description": "Generate an operational daily brief combining sales, finance, and proposals.",
        "type": "READ",
        "handler": get_business_brief_tool,
        "parameters": {}
    },

    # Workspace Integration Tools
    "get_integrations_status": {
        "name": "get_integrations_status",
        "description": "Check connection status of Gmail, Calendar, WhatsApp, and Website Webhooks.",
        "type": "READ",
        "handler": lambda business_id: __import__("app.services.integrations.manager", fromlist=["integration_manager"]).integration_manager.list_integrations_status(business_id),
        "parameters": {}
    },

    # Workflow & Automation Tools
    "get_automations": {
        "name": "get_automations",
        "description": "List all active, paused workflows and plan limits.",
        "type": "READ",
        "handler": lambda business_id: __import__("app.services.ai.tools.automation_tools", fromlist=["get_automations_tool"]).get_automations_tool(business_id),
        "parameters": {}
    },
    "get_automation_failures": {
        "name": "get_automation_failures",
        "description": "Retrieve recent failed automation runs and errors for debugging.",
        "type": "READ",
        "handler": lambda business_id: __import__("app.services.ai.tools.automation_tools", fromlist=["get_automation_failures_tool"]).get_automation_failures_tool(business_id),
        "parameters": {}
    },
    "pause_automation": {
        "name": "pause_automation",
        "description": "Pause an automated workflow by ID or name.",
        "type": "WRITE",
        "handler": lambda business_id, name_or_id: __import__("app.services.ai.tools.automation_tools", fromlist=["pause_automation_tool"]).pause_automation_tool(business_id, name_or_id),
        "parameters": {"name_or_id": "required string"}
    },
    "run_automation": {
        "name": "run_automation",
        "description": "Manually trigger immediate execution of a workflow by ID or name.",
        "type": "WRITE",
        "handler": lambda business_id, name_or_id: __import__("app.services.ai.tools.automation_tools", fromlist=["run_automation_tool"]).run_automation_tool(business_id, name_or_id),
        "parameters": {"name_or_id": "required string"}
    },

    # Analytics & BI Tools
    "get_analytics_overview": {
        "name": "get_analytics_overview",
        "description": "Get high-level business intelligence overview (revenue, leads, customers, trend).",
        "type": "READ",
        "handler": lambda business_id, time_frame="30d": __import__("app.services.ai.tools.analytics_tools", fromlist=["get_analytics_overview_tool"]).get_analytics_overview_tool(business_id, time_frame),
        "parameters": {"time_frame": "optional string (7d, 30d, 90d, 1y)"}
    },
    "get_revenue_analytics": {
        "name": "get_revenue_analytics",
        "description": "Retrieve comprehensive revenue analysis, collected amounts, and customer revenue rankings.",
        "type": "READ",
        "handler": lambda business_id, time_frame="30d": __import__("app.services.ai.tools.analytics_tools", fromlist=["get_revenue_analytics_tool"]).get_revenue_analytics_tool(business_id, time_frame),
        "parameters": {"time_frame": "optional string"}
    },
    "get_sales_analytics": {
        "name": "get_sales_analytics",
        "description": "Retrieve sales pipeline funnel, conversion velocity, win/loss rates, and deal sizes.",
        "type": "READ",
        "handler": lambda business_id, time_frame="30d": __import__("app.services.ai.tools.analytics_tools", fromlist=["get_sales_analytics_tool"]).get_sales_analytics_tool(business_id, time_frame),
        "parameters": {"time_frame": "optional string"}
    },
    "get_customer_analytics": {
        "name": "get_customer_analytics",
        "description": "Retrieve customer segmentation (high-value, active, at-risk, inactive) and growth rates.",
        "type": "READ",
        "handler": lambda business_id, time_frame="30d": __import__("app.services.ai.tools.analytics_tools", fromlist=["get_customer_analytics_tool"]).get_customer_analytics_tool(business_id, time_frame),
        "parameters": {"time_frame": "optional string"}
    },
    "get_business_insights": {
        "name": "get_business_insights",
        "description": "Get AI recommendations, overdue alerts, and business improvement opportunities.",
        "type": "READ",
        "handler": lambda business_id, time_frame="30d", category=None: __import__("app.services.ai.tools.analytics_tools", fromlist=["get_business_insights_tool"]).get_business_insights_tool(business_id, time_frame, category),
        "parameters": {"time_frame": "optional string", "category": "optional string"}
    },
    "generate_business_report": {
        "name": "generate_business_report",
        "description": "Generate an executive business report with multi-section narrative breakdown.",
        "type": "WRITE",
        "handler": lambda business_id, report_type="executive_summary", time_frame="30d": __import__("app.services.ai.tools.analytics_tools", fromlist=["generate_business_report_tool"]).generate_business_report_tool(business_id, report_type, time_frame),
        "parameters": {"report_type": "optional string", "time_frame": "optional string"}
    }
}

async def execute_tool(tool_name: str, business_id: str, **kwargs) -> Dict[str, Any]:
    """Execute a registered tool with multi-tenant isolation and error handling."""
    if tool_name not in TOOL_REGISTRY:
        raise ValueError(f"Unknown tool: {tool_name}")
    
    tool_def = TOOL_REGISTRY[tool_name]
    handler = tool_def["handler"]

    try:
        import inspect
        if inspect.iscoroutinefunction(handler):
            return await handler(business_id=business_id, **kwargs)
        else:
            res = handler(business_id=business_id, **kwargs)
            if inspect.isawaitable(res):
                return await res
            return res
    except Exception as e:
        return {
            "error": True,
            "tool": tool_name,
            "message": str(e)
        }

