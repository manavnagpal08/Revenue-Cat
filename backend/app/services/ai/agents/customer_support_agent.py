import json
from typing import Dict, Any, List
from app.services.ai.agents.base_agent import BaseAgent
from app.services.ai.tools.customer_tools import (
    get_customer_summary_tool,
    get_customers_tool
)

class CustomerSupportAgent(BaseAgent):
    """
    Specialized Customer Intelligence & Communication Agent.
    Synthesizes relationship history, drafts high-context client communications, and audits client value.
    """

    @property
    def agent_id(self) -> str:
        return "customer_support"

    @property
    def system_prompt(self) -> str:
        return (
            "You are the SoloCEO Customer Intelligence Agent.\n"
            "Your role is to summarize customer relationships, review lifetime financial engagement, "
            "and draft professional, empathetic, and effective customer communications.\n"
            "Rules:\n"
            "1. Ground all summaries in actual invoices, deals, and proposals associated with the customer.\n"
            "2. When drafting a message, maintain a polished, executive tone."
        )

    async def process(
        self,
        query: str,
        business_id: str,
        business_name: str,
        context_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        # 1. Identify which customer is queried
        cust_res = await get_customers_tool(business_id=business_id, limit=50)
        customers = cust_res["customers"]

        target_cust = None
        for c in customers:
            if c.get("name", "").lower() in query.lower() or (c.get("company_name") and c.get("company_name", "").lower() in query.lower()):
                target_cust = c
                break

        if not target_cust and customers:
            target_cust = customers[0]

        if not target_cust:
            return {
                "message": "No customers found in your workspace yet. You can create a customer to begin tracking their history.",
                "agent": "customer_support",
                "confidence": 0.85,
                "structured_data": {},
                "action_cards": [],
                "requires_confirmation": False
            }

        # 2. Fetch full 360 profile
        summary = await get_customer_summary_tool(business_id=business_id, query_name_or_id=target_cust["id"])
        fin = summary.get("financial_summary", {})
        invoices = summary.get("invoices", [])
        leads = summary.get("leads", [])

        action_cards = [
            {
                "type": "customer_card",
                "title": f"Profile: {target_cust.get('name')}",
                "description": f"₹{float(target_cust.get('total_revenue') or 0):,.0f} lifetime revenue • {len(invoices)} invoices",
                "primary_action_label": "View Customer",
                "action_payload": {"customer_id": target_cust.get("id"), "action": "VIEW_CUSTOMER"}
            }
        ]

        if "draft" in query.lower() or "reply" in query.lower() or "message" in query.lower() or "email" in query.lower():
            draft_msg = (
                f"**Draft Communication for {target_cust.get('name')}:**\n\n"
                f"*Subject: Update on our ongoing milestones & next steps*\n\n"
                f"Hi {target_cust.get('name').split()[0]},\n\n"
                f"I hope you're having a productive week! I wanted to follow up on our recent project discussions. "
                f"We are ready to move forward with the next milestone and ensure all deliverables align with your goals.\n\n"
                f"Let me know when you'd like to sync for 10 minutes this week.\n\n"
                f"Best regards,\n"
                f"{business_name}"
            )
            return {
                "message": draft_msg,
                "agent": "customer_support",
                "confidence": 0.96,
                "structured_data": {"customer": target_cust, "summary": summary},
                "action_cards": action_cards,
                "requires_confirmation": False
            }

        msg = (
            f"**Customer Overview: {target_cust.get('name')}** ({target_cust.get('company_name') or 'Individual'})\n\n"
            f"• **Lifetime Revenue:** ₹{fin.get('lifetime_revenue', 0):,.0f}\n"
            f"• **Total Invoiced:** ₹{fin.get('total_invoiced', 0):,.0f} ({fin.get('invoice_count', 0)} invoices)\n"
            f"• **Outstanding Balance:** ₹{fin.get('outstanding_balance', 0):,.0f}\n"
            f"• **Active Pipeline Deals:** {len(leads)}\n"
        )
        if target_cust.get("email"):
            msg += f"• **Email:** {target_cust.get('email')}\n"
        if target_cust.get("phone"):
            msg += f"• **Phone:** {target_cust.get('phone')}\n"

        return {
            "message": msg,
            "agent": "customer_support",
            "confidence": 0.95,
            "structured_data": {"customer": target_cust, "summary": summary},
            "action_cards": action_cards,
            "requires_confirmation": False
        }
