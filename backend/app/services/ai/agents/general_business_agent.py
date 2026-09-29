import json
from typing import Dict, Any, List
from app.services.ai.agents.base_agent import BaseAgent
from app.services.ai.tools.dashboard_tools import get_business_brief_tool
from app.services.ai.tools.sales_tools import get_inactive_leads_tool
from app.services.ai.tools.finance_tools import get_overdue_invoices_tool

class GeneralBusinessAgent(BaseAgent):
    """
    Chief of Staff / General Business Intelligence Agent.
    Coordinates across sales, finance, and proposals to provide executive summaries and prioritized daily focus.
    """

    @property
    def agent_id(self) -> str:
        return "general_business"

    @property
    def system_prompt(self) -> str:
        return (
            "You are the SoloCEO Chief AI Operating Officer.\n"
            "Your role is to analyze all dimensions of the solo entrepreneur's business (pipeline, revenue, collections, proposals) "
            "and produce an executive briefing with top 3 prioritized action items for the day.\n"
            "Rules:\n"
            "1. Be concise, direct, and actionable.\n"
            "2. Rank highest impact items first (overdue collections, high-value inactive deals)."
        )

    async def process(
        self,
        query: str,
        business_id: str,
        business_name: str,
        context_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        brief = await get_business_brief_tool(business_id=business_id)
        inactive_res = await get_inactive_leads_tool(business_id=business_id, days_threshold=5)
        overdue_res = await get_overdue_invoices_tool(business_id=business_id)

        top_opp = brief.get("top_opportunity")
        overdue_amt = brief.get("overdue_amount", 0)
        overdue_cnt = brief.get("overdue_invoices_count", 0)
        inactive_cnt = brief.get("inactive_leads_count", 0)
        proposals_cnt = brief.get("pending_proposals_count", 0)

        action_cards = []
        if top_opp:
            action_cards.append({
                "type": "lead_followup",
                "title": f"Priority 1: Follow up on {top_opp.get('title')}",
                "description": f"₹{float(top_opp.get('value') or 0):,.0f} deal inactive for {top_opp.get('days_inactive')} days.",
                "primary_action_label": "View Deal",
                "action_payload": {"lead_id": top_opp.get("id"), "action": "VIEW_LEAD"}
            })

        if overdue_amt > 0:
            action_cards.append({
                "type": "invoice_reminder",
                "title": f"Priority 2: Collect ₹{overdue_amt:,.0f} Overdue Receivables",
                "description": f"{overdue_cnt} invoices past due date.",
                "primary_action_label": "View Invoices",
                "action_payload": {"action": "VIEW_INVOICES"}
            })

        msg = (
            f"**Today's Executive Focus for {business_name}:**\n\n"
        )

        if top_opp:
            msg += (
                f"1. **High-Value Opportunity at Risk:**\n"
                f"   • **{top_opp.get('title')}** (₹{float(top_opp.get('value') or 0):,.0f}) has been inactive for **{top_opp.get('days_inactive')} days**.\n"
                f"   • *Action:* Send a quick touchpoint message.\n\n"
            )

        if overdue_amt > 0:
            msg += (
                f"2. **Overdue Invoices:**\n"
                f"   • You have **₹{overdue_amt:,.0f}** across {overdue_cnt} invoices needing collection.\n"
                f"   • *Action:* Send invoice reminder statements.\n\n"
            )

        if proposals_cnt > 0:
            msg += (
                f"3. **Pending Proposals:**\n"
                f"   • {proposals_cnt} proposal(s) currently awaiting client approval (₹{brief.get('pending_proposals_value', 0):,.0f}).\n\n"
            )

        msg += f"Total revenue collected to date is **₹{brief.get('revenue_collected', 0):,.0f}**."

        return {
            "message": msg,
            "agent": "general_business",
            "confidence": 0.98,
            "structured_data": {"brief": brief},
            "action_cards": action_cards,
            "requires_confirmation": False
        }
