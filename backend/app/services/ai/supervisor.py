import uuid
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.core.supabase_client import get_supabase
from app.services.ai.providers import get_ai_provider
from app.services.ai.agents.sales_agent import SalesAgent
from app.services.ai.agents.finance_agent import FinanceAgent
from app.services.ai.agents.proposal_agent import ProposalAgent
from app.services.ai.agents.customer_support_agent import CustomerSupportAgent
from app.services.ai.agents.general_business_agent import GeneralBusinessAgent
from app.services.ai.agents.integration_agent import IntegrationAgent

logger = logging.getLogger("soloceo_ai_supervisor")

# In-memory storage for conversations and messages (for fallback and test isolation)
_in_memory_conversations: Dict[str, Dict[str, Any]] = {}
_in_memory_messages: List[Dict[str, Any]] = []
_in_memory_usage: List[Dict[str, Any]] = []

class AISupervisor:
    """
    Central AI Supervisor of SoloCEO.
    Classifies user intent, selects specialized agents, passes business context,
    enforces tenant isolation, manages conversation state, and records usage.
    """

    def __init__(self):
        self.provider = get_ai_provider()
        self.sales_agent = SalesAgent(self.provider)
        self.finance_agent = FinanceAgent(self.provider)
        self.proposal_agent = ProposalAgent(self.provider)
        self.support_agent = CustomerSupportAgent(self.provider)
        self.general_agent = GeneralBusinessAgent(self.provider)
        self.integration_agent = IntegrationAgent(self.provider)

    def route_intent(self, query: str) -> str:
        """
        Deterministic intent classifier for specialized agent routing.
        """
        q = query.lower()

        # Automation & Workflow intent
        if any(w in q for w in ["automation", "automate", "workflow", "trigger", "runs"]):
            return "AUTOMATIONS"

        # External Integration intent (Email, Calendar, WhatsApp, Integrations)
        if any(w in q for w in ["gmail", "email", "calendar", "meeting", "schedule", "whatsapp", "integration", "connect"]):
            return "INTEGRATIONS"

        # Proposal intent
        if any(w in q for w in ["proposal", "quote", "scope", "deliverable", "contract", "pitch"]):
            return "PROPOSAL"

        # Finance intent
        if any(w in q for w in ["invoice", "overdue", "owe", "owes", "revenue", "payment", "paid", "unpaid", "money", "cash", "billing"]):
            return "FINANCE"

        # Sales intent
        if any(w in q for w in ["lead", "pipeline", "deal", "inactive", "follow up", "followup", "opportunity", "contacted"]):
            return "SALES"

        # Customer support intent
        if any(w in q for w in ["customer", "client", "draft a response", "summary of", "email to", "message to"]):
            return "CUSTOMER_SUPPORT"

        # Analytics & Reporting intent
        if any(w in q for w in ["report", "analytics", "bi", "metric", "insight", "funnel", "growth", "breakdown", "executive summary", "kpi"]):
            return "ANALYTICS"

        # General business intent
        return "GENERAL_BUSINESS"

    async def execute_query(
        self,
        query: str,
        business_id: str,
        user_id: str,
        conversation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Main query orchestration pipeline.
        """
        # 0. Enforce AI Credit Limit
        from app.services.billing.usage_service import usage_service
        has_credits, remaining_credits, total_credits = usage_service.check_ai_credits(business_id=business_id, credits_needed=1)
        if not has_credits:
            conv_id = conversation_id or str(uuid.uuid4())
            return {
                "conversation_id": conv_id,
                "agent": "supervisor",
                "intent": "EXHAUSTED",
                "message": f"AI_CREDITS_EXHAUSTED: You have used all {total_credits} monthly AI credits on your current plan. Upgrade to Business or Pro to continue using SoloCEO AI.",
                "structured_data": {
                    "code": "AI_CREDITS_EXHAUSTED",
                    "upgrade_required": True,
                    "remaining_credits": remaining_credits,
                    "total_credits": total_credits
                },
                "action_cards": [
                    {
                        "type": "upgrade_prompt",
                        "title": "AI Credits Exhausted",
                        "description": "Upgrade your plan to unlock 250+ AI credits, advanced automations, and priority reasoning.",
                        "primary_action_label": "View Plans",
                        "action_payload": {"route": "/paywall"}
                    }
                ],
                "requires_confirmation": False,
                "pending_action": None,
                "credits_remaining": remaining_credits
            }

        # 1. Fetch business name
        business_name = "My Business"
        supabase = get_supabase()
        if supabase:
            try:
                b_res = supabase.table("businesses").select("name").eq("id", business_id).single().execute()
                if b_res.data:
                    business_name = b_res.data.get("name", "My Business")
            except Exception:
                pass

        # 2. Ensure conversation exists
        conv_id = conversation_id or str(uuid.uuid4())
        await self._ensure_conversation(conv_id=conv_id, business_id=business_id, user_id=user_id, title=query[:40])

        # 3. Store user message
        await self._save_message(
            conversation_id=conv_id,
            sender="user",
            agent="user",
            content=query,
            structured_data=None
        )

        # 4. Route intent & execute specialized agent
        intent = self.route_intent(query)
        agent_result = {}

        if intent == "AUTOMATIONS":
            from app.services.ai.tools.automation_tools import (
                get_automations_tool,
                get_automation_failures_tool,
                pause_automation_tool,
                run_automation_tool
            )
            from app.services.automation.ai_builder import ai_automation_builder
            q_lower = query.lower()

            if any(w in q_lower for w in ["create", "build", "new automation", "set up"]):
                builder_res = ai_automation_builder.parse_prompt(prompt=query, business_id=business_id)
                wf = builder_res.suggested_workflow
                agent_result = {
                    "agent": "supervisor",
                    "message": f"I've drafted a new workflow: **{wf.name}**.\n\n{wf.description}\n\nReview the proposed steps below and activate whenever you're ready.",
                    "structured_data": {
                        "type": "workflow_preview",
                        "workflow": wf.model_dump(),
                        "steps": [s.model_dump() for s in builder_res.steps]
                    },
                    "action_cards": [
                        {
                            "type": "workflow_card",
                            "title": wf.name,
                            "description": wf.description,
                            "primary_action_label": "Save & Activate",
                            "action_payload": {"route": "/automations/create"}
                        }
                    ]
                }
            elif any(w in q_lower for w in ["fail", "error", "broken", "issue"]):
                failures = await get_automation_failures_tool(business_id=business_id)
                agent_result = {
                    "agent": "supervisor",
                    "message": f"Found {failures.get('failed_runs_count', 0)} recent failed workflow run(s).",
                    "structured_data": failures,
                    "action_cards": []
                }
            elif "pause" in q_lower:
                pause_res = await pause_automation_tool(business_id=business_id, name_or_id=query)
                agent_result = {
                    "agent": "supervisor",
                    "message": f"Workflow updated: {pause_res.get('name', 'Automation')} is now {pause_res.get('status', 'paused')}." if pause_res.get("success") else pause_res.get("error", "Failed to pause workflow."),
                    "structured_data": pause_res,
                    "action_cards": []
                }
            elif "run" in q_lower:
                run_res = await run_automation_tool(business_id=business_id, name_or_id=query)
                agent_result = {
                    "agent": "supervisor",
                    "message": f"Triggered execution for '{run_res.get('name', 'workflow')}'. Run ID: {run_res.get('run_id')}." if run_res.get("success") else run_res.get("error", "Failed to run workflow."),
                    "structured_data": run_res,
                    "action_cards": []
                }
            else:
                auto_data = await get_automations_tool(business_id=business_id)
                agent_result = {
                    "agent": "supervisor",
                    "message": f"You currently have {auto_data.get('active_count', 0)} active workflows out of your plan limit of {auto_data.get('max_limit', 2)} ({auto_data.get('plan_tier', 'free').capitalize()} plan).",
                    "structured_data": auto_data,
                    "action_cards": [
                        {
                            "type": "navigation",
                            "title": "Open Automations Hub",
                            "description": "View and manage all automated business workflows.",
                            "primary_action_label": "View Automations",
                            "action_payload": {"route": "/automations"}
                        }
                    ]
                }
        elif intent == "ANALYTICS":
            from app.services.analytics.analytics_service import AnalyticsService
            overview = AnalyticsService.get_overview(business_id=business_id, time_frame="30d")
            insights = AnalyticsService.get_insights(business_id=business_id, time_frame="30d")
            top_ins = insights.insights[0].description if insights.insights else "All systems performing smoothly."
            agent_result = {
                "agent": "analytics_supervisor",
                "message": f"Here is your 30-day Business Intelligence overview for {business_name}:\n\n• Collected Revenue: ₹{overview.collected_revenue:,.2f} ({overview.revenue_growth_percent}% growth)\n• Active Pipeline: {overview.total_leads} leads\n• Customer Base: {overview.total_customers} clients ({overview.active_customers} active)\n\nKey Strategic Insight:\n{top_ins}",
                "structured_data": overview.model_dump(),
                "action_cards": [
                    {
                        "type": "navigation",
                        "title": "Open Analytics Hub",
                        "description": "View deep interactive charts, customer segmentation, and financial telemetry.",
                        "primary_action_label": "View Analytics",
                        "action_payload": {"route": "/analytics"}
                    },
                    {
                        "type": "navigation",
                        "title": "Generate Formal Report",
                        "description": "Compile an executive PDF/CSV business report with narrative breakdowns.",
                        "primary_action_label": "Create Report",
                        "action_payload": {"route": "/analytics/reports"}
                    }
                ]
            }
        elif intent == "INTEGRATIONS":
            agent_result = await self.integration_agent.process(query=query, business_id=business_id, business_name=business_name, context_data={})
        elif intent == "SALES":
            agent_result = await self.sales_agent.process(query=query, business_id=business_id, business_name=business_name, context_data={})
        elif intent == "FINANCE":
            agent_result = await self.finance_agent.process(query=query, business_id=business_id, business_name=business_name, context_data={})
        elif intent == "PROPOSAL":
            agent_result = await self.proposal_agent.process(query=query, business_id=business_id, business_name=business_name, context_data={})
        elif intent == "CUSTOMER_SUPPORT":
            agent_result = await self.support_agent.process(query=query, business_id=business_id, business_name=business_name, context_data={})
        else:
            agent_result = await self.general_agent.process(query=query, business_id=business_id, business_name=business_name, context_data={})

        # 5. Store AI assistant message
        await self._save_message(
            conversation_id=conv_id,
            sender="assistant",
            agent=agent_result.get("agent", "supervisor"),
            content=agent_result.get("message", ""),
            structured_data=agent_result.get("structured_data")
        )

        # 6. Record usage and consume credits
        usage_res = usage_service.consume_ai_credits(
            business_id=business_id,
            user_id=user_id,
            action_type=f"{agent_result.get('agent', 'general')}_query",
            credits=1
        )

        await self._record_usage(
            business_id=business_id,
            user_id=user_id,
            action_type=f"{agent_result.get('agent')}_query",
            credits=1
        )

        return {
            "conversation_id": conv_id,
            "agent": agent_result.get("agent", "supervisor"),
            "intent": intent,
            "message": agent_result.get("message", ""),
            "structured_data": agent_result.get("structured_data"),
            "action_cards": agent_result.get("action_cards", []),
            "requires_confirmation": agent_result.get("requires_confirmation", False),
            "pending_action": agent_result.get("pending_action"),
            "credits_remaining": usage_res.get("credits_remaining", max(0, remaining_credits - 1))
        }

    async def _ensure_conversation(self, conv_id: str, business_id: str, user_id: str, title: str):
        supabase = get_supabase()
        if supabase:
            try:
                res = supabase.table("ai_conversations").select("id").eq("id", conv_id).execute()
                if not res.data:
                    supabase.table("ai_conversations").insert({
                        "id": conv_id,
                        "business_id": business_id,
                        "user_id": user_id,
                        "title": title
                    }).execute()
            except Exception as e:
                logger.warning(f"Error persisting ai_conversation: {e}")

        if conv_id not in _in_memory_conversations:
            _in_memory_conversations[conv_id] = {
                "id": conv_id,
                "business_id": business_id,
                "user_id": user_id,
                "title": title,
                "created_at": datetime.now(timezone.utc).isoformat()
            }

    async def _save_message(self, conversation_id: str, sender: str, agent: str, content: str, structured_data: Optional[Dict[str, Any]]):
        msg_id = str(uuid.uuid4())
        msg_data = {
            "id": msg_id,
            "conversation_id": conversation_id,
            "sender": sender,
            "agent": agent,
            "content": content,
            "structured_data": structured_data,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        supabase = get_supabase()
        if supabase:
            try:
                supabase.table("ai_messages").insert(msg_data).execute()
            except Exception as e:
                logger.warning(f"Error persisting ai_message: {e}")

        _in_memory_messages.append(msg_data)

    async def _record_usage(self, business_id: str, user_id: str, action_type: str, credits: int = 1):
        usage_data = {
            "id": str(uuid.uuid4()),
            "business_id": business_id,
            "user_id": user_id,
            "action_type": action_type,
            "tokens_used": 150,
            "credits_consumed": credits,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        supabase = get_supabase()
        if supabase:
            try:
                supabase.table("ai_usage").insert(usage_data).execute()
            except Exception as e:
                logger.warning(f"Error persisting ai_usage: {e}")

        _in_memory_usage.append(usage_data)

# Singleton instance
supervisor_instance = AISupervisor()
