import json
from typing import Dict, Any, List
from app.services.ai.agents.base_agent import BaseAgent
from app.services.ai.tools.finance_tools import (
    get_overdue_invoices_tool,
    get_financial_summary_tool,
    get_customer_revenue_tool,
    get_invoices_tool
)

class FinanceAgent(BaseAgent):
    """
    Specialized Finance & Cashflow Operations Agent.
    Monitors receivables, calculates revenue benchmarks, identifies overdue balances, and recommends collection steps.
    """

    @property
    def agent_id(self) -> str:
        return "finance"

    @property
    def system_prompt(self) -> str:
        return (
            "You are the SoloCEO Finance Agent, a chief financial advisor for solo entrepreneurs and agencies.\n"
            "Your role is to maximize cash collections, monitor overdue receivables, calculate exact revenue metrics, "
            "and suggest collection workflows.\n"
            "Rules:\n"
            "1. ALWAYS use the real financial numbers provided in the context.\n"
            "2. State amounts clearly in Indian Rupees (₹).\n"
            "3. Provide precise breakdown between collected revenue, outstanding balance, and overdue amounts."
        )

    async def process(
        self,
        query: str,
        business_id: str,
        business_name: str,
        context_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        # 1. Fetch real financial figures
        fin_summary = await get_financial_summary_tool(business_id=business_id)
        overdue_res = await get_overdue_invoices_tool(business_id=business_id)
        top_custs_res = await get_customer_revenue_tool(business_id=business_id, limit=5)

        overdue_invs = overdue_res["overdue_invoices"]
        overdue_amt = overdue_res["total_overdue_amount"]
        collected = fin_summary["revenue_collected"]
        outstanding = fin_summary["total_outstanding"]

        action_cards = []
        for inv in overdue_invs[:3]:
            cname = inv.get("customer", {}).get("name") if isinstance(inv.get("customer"), dict) else "Client"
            action_cards.append({
                "type": "invoice_reminder",
                "title": f"Overdue: {inv.get('invoice_number')} ({cname})",
                "description": f"₹{float(inv.get('remaining_balance', 0)):,.0f} balance due on {inv.get('due_date')}.",
                "primary_action_label": "View Invoice",
                "action_payload": {"invoice_id": inv.get("id"), "action": "VIEW_INVOICE"}
            })

        # Deterministic analysis
        if self.provider.provider_name.startswith("SoloCEO Deterministic"):
            if "overdue" in query.lower() or "owes" in query.lower() or "money" in query.lower() or "unpaid" in query.lower():
                if overdue_invs:
                    msg = (
                        f"You have **₹{overdue_amt:,.0f}** in overdue receivables across **{len(overdue_invs)} delinquent invoices**:\n\n"
                    )
                    for inv in overdue_invs[:4]:
                        cname = inv.get("customer", {}).get("name") if isinstance(inv.get("customer"), dict) else "Client"
                        msg += f"• **{inv.get('invoice_number')}** — {cname}: ₹{float(inv.get('remaining_balance', 0)):,.0f} (Due {inv.get('due_date')})\n"
                    msg += f"\nTotal outstanding balance across all invoices is ₹{outstanding:,.0f}."
                else:
                    msg = f"All active invoices are current! Total collected revenue to date is **₹{collected:,.0f}**, with ₹{outstanding:,.0f} currently within payment terms."
            elif "revenue" in query.lower() or "made" in query.lower() or "sales" in query.lower():
                msg = (
                    f"**Financial Health Overview for {business_name}:**\n\n"
                    f"• **Revenue Collected:** ₹{collected:,.0f}\n"
                    f"• **Outstanding Balance:** ₹{outstanding:,.0f}\n"
                    f"• **Overdue Amount:** ₹{overdue_amt:,.0f} ({len(overdue_invs)} invoices)\n\n"
                )
                if top_custs_res["top_customers"]:
                    msg += "**Top Revenue Contributors:**\n"
                    for c in top_custs_res["top_customers"][:3]:
                        msg += f"• {c.get('name')}: ₹{float(c.get('total_revenue') or 0):,.0f}\n"
            else:
                msg = (
                    f"**Cashflow Summary:**\n"
                    f"You have collected **₹{collected:,.0f}** with **₹{outstanding:,.0f}** outstanding. "
                    f"There are **{len(overdue_invs)} overdue invoices** totaling **₹{overdue_amt:,.0f}** requiring follow-up."
                )

            return {
                "message": msg,
                "agent": "finance",
                "confidence": 0.97,
                "structured_data": {
                    "financial_summary": fin_summary,
                    "overdue_invoices": overdue_invs[:5],
                    "top_customers": top_custs_res["top_customers"]
                },
                "action_cards": action_cards,
                "requires_confirmation": False
            }

        # Generative provider call
        prompt = (
            f"User Question: '{query}'\n\n"
            f"Real Business Financial Context for {business_name}:\n"
            f"- Total Revenue Collected: ₹{collected:,.0f}\n"
            f"- Total Outstanding Balance: ₹{outstanding:,.0f}\n"
            f"- Overdue Amount: ₹{overdue_amt:,.0f} across {len(overdue_invs)} invoices\n"
            f"- Overdue Invoices Details: {json.dumps(overdue_invs[:4], default=str)}\n"
            f"- Top Customers by Revenue: {json.dumps(top_custs_res['top_customers'][:3], default=str)}\n\n"
            f"Produce a structured JSON with 'message' giving sharp, direct cashflow advice."
        )

        try:
            ai_res = await self.provider.generate_response(prompt=prompt, system_instruction=self.system_prompt)
            msg = ai_res.get("message") or str(ai_res)
            return {
                "message": msg,
                "agent": "finance",
                "confidence": 0.95,
                "structured_data": {
                    "financial_summary": fin_summary,
                    "overdue_invoices": overdue_invs[:5]
                },
                "action_cards": action_cards,
                "requires_confirmation": False
            }
        except Exception:
            return {
                "message": f"You currently have ₹{overdue_amt:,.0f} in overdue invoices across {len(overdue_invs)} customers.",
                "agent": "finance",
                "confidence": 0.90,
                "structured_data": {"financial_summary": fin_summary},
                "action_cards": action_cards,
                "requires_confirmation": False
            }
