import json
from typing import Dict, Any, List
from app.services.ai.agents.base_agent import BaseAgent
from app.services.ai.tools.sales_tools import get_inactive_leads_tool, get_pipeline_summary_tool, get_leads_tool

class SalesAgent(BaseAgent):
    """
    Specialized Sales & Pipeline Operations Agent.
    Analyzes deals, detects stalled opportunities, crafts follow-ups, and computes pipeline metrics.
    """

    @property
    def agent_id(self) -> str:
        return "sales"

    @property
    def system_prompt(self) -> str:
        return (
            "You are the SoloCEO Sales Agent, an elite AI sales operations advisor for solo entrepreneurs.\n"
            "Your role is to analyze sales pipelines, identify high-priority opportunities, flag inactive deals, "
            "recommend timely follow-up actions, and draft high-converting outreach.\n"
            "Rules:\n"
            "1. ALWAYS base your numbers and deal names directly on the provided real business context.\n"
            "2. Never fabricate deals or customer names.\n"
            "3. Provide concise, direct, high-value advice with specific numbers (₹) and timeframes.\n"
            "4. Suggest concrete next steps."
        )

    async def process(
        self,
        query: str,
        business_id: str,
        business_name: str,
        context_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        # 1. Fetch real sales data
        inactive_res = await get_inactive_leads_tool(business_id=business_id, days_threshold=5)
        pipeline_res = await get_pipeline_summary_tool(business_id=business_id)

        inactive_leads = inactive_res["inactive_leads"]
        open_value = pipeline_res["open_pipeline_value"]
        open_count = pipeline_res["open_leads_count"]

        # Action cards list
        action_cards = []
        for lead in inactive_leads[:3]:
            action_cards.append({
                "type": "lead_followup",
                "title": f"Follow Up: {lead.get('title')}",
                "description": f"₹{float(lead.get('value') or 0):,.0f} opportunity inactive for {lead.get('days_inactive', 5)} days.",
                "primary_action_label": "View Lead",
                "action_payload": {"lead_id": lead.get("id"), "action": "VIEW_LEAD"}
            })

        # Check if provider can run generative response or deterministic fallback
        if self.provider.provider_name.startswith("SoloCEO Deterministic"):
            # Synthesize deterministic high-accuracy response
            if "inactive" in query.lower() or "follow" in query.lower() or "attention" in query.lower() or "need" in query.lower():
                if inactive_leads:
                    top = inactive_leads[0]
                    msg = (
                        f"I analyzed your pipeline and found {len(inactive_leads)} opportunities requiring immediate follow-up "
                        f"(totaling ₹{inactive_res['total_at_risk_value']:,.0f} at risk).\n\n"
                        f"• Top Priority: **{top.get('title')}** (₹{float(top.get('value') or 0):,.0f}) — inactive for {top.get('days_inactive')} days.\n"
                    )
                    if len(inactive_leads) > 1:
                        second = inactive_leads[1]
                        msg += f"• Second Priority: **{second.get('title')}** (₹{float(second.get('value') or 0):,.0f}) — inactive for {second.get('days_inactive')} days.\n"
                    msg += "\nRecommended Action: Send a brief progress check-in to reactivate the conversation."
                else:
                    msg = f"Great news! All {open_count} active leads in your pipeline (₹{open_value:,.0f} total value) have recent interactions logged."
            else:
                msg = (
                    f"Your sales pipeline currently has **{open_count} open deals** valued at **₹{open_value:,.0f}**.\n\n"
                    f"• Qualified Deals: {pipeline_res['stage_counts'].get('qualified', 0)} (₹{pipeline_res['stage_values'].get('qualified', 0):,.0f})\n"
                    f"• Proposal Sent: {pipeline_res['stage_counts'].get('proposal', 0)} (₹{pipeline_res['stage_values'].get('proposal', 0):,.0f})\n"
                    f"• In Negotiation: {pipeline_res['stage_counts'].get('negotiation', 0)} (₹{pipeline_res['stage_values'].get('negotiation', 0):,.0f})"
                )

            return {
                "message": msg,
                "agent": "sales",
                "confidence": 0.96,
                "structured_data": {
                    "pipeline_summary": pipeline_res,
                    "inactive_leads": inactive_leads[:5]
                },
                "action_cards": action_cards,
                "requires_confirmation": False
            }

        # Generative provider call
        prompt = (
            f"User Question: '{query}'\n\n"
            f"Real Business Pipeline Context for {business_name}:\n"
            f"- Open Deals: {open_count} (Total Value: ₹{open_value:,.0f})\n"
            f"- Inactive Leads: {json.dumps(inactive_leads[:5], default=str)}\n"
            f"- Pipeline Stages: {json.dumps(pipeline_res['stage_counts'])}\n\n"
            f"Produce a structured JSON with 'message' (detailed advice) and 'recommended_action'."
        )

        try:
            ai_res = await self.provider.generate_response(prompt=prompt, system_instruction=self.system_prompt)
            msg = ai_res.get("message") or str(ai_res)
            return {
                "message": msg,
                "agent": "sales",
                "confidence": 0.94,
                "structured_data": {"pipeline_summary": pipeline_res, "inactive_leads": inactive_leads[:5]},
                "action_cards": action_cards,
                "requires_confirmation": False
            }
        except Exception:
            # Fallback gracefully
            return {
                "message": f"Found {len(inactive_leads)} inactive opportunities in your pipeline worth ₹{inactive_res['total_at_risk_value']:,.0f}.",
                "agent": "sales",
                "confidence": 0.90,
                "structured_data": {"inactive_leads": inactive_leads},
                "action_cards": action_cards,
                "requires_confirmation": False
            }
