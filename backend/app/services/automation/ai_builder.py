import re
import logging
from typing import Dict, Any, List, Optional
from app.models.schemas import AutomationCreate, AutomationStepPreview, AutomationAIBuilderResponse

logger = logging.getLogger("soloceo_ai_automation_builder")

class AIAutomationBuilder:
    """
    Intelligent NLP-to-Workflow Engine.
    Converts unstructured natural language into structured, safe, validated
    Automation configurations complying with SoloCEO schema without arbitrary code execution.
    """

    def parse_prompt(self, prompt: str, business_id: str) -> AutomationAIBuilderResponse:
        p_lower = prompt.lower().strip()

        # 1. Inactive Leads Workflow
        if any(k in p_lower for k in ["inactive lead", "haven't replied", "havent replied", "no reply", "lead follow-up", "follow up with lead", "follow-up with lead"]):
            days_match = re.search(r'(\d+)\s*days?', p_lower)
            days = int(days_match.group(1)) if days_match else 7

            workflow = AutomationCreate(
                business_id=business_id,
                name=f"Inactive Lead Follow-up ({days} Days)",
                description=f"Auto-detect leads with no activity for {days} days and prepare personalized re-engagement emails.",
                trigger_type="lead_inactive",
                trigger_config={"inactivity_days": days, "check_frequency": "daily"},
                condition_config={
                    "rules": [
                        {"field": "lead.status", "operator": "!=", "value": "lost"},
                        {"field": "lead.status", "operator": "!=", "value": "won"}
                    ],
                    "logic": "AND"
                },
                agent_type="sales",
                action_config={
                    "action_type": "send_email",
                    "channel": "email",
                    "tone": "friendly_persuasive",
                    "template": "reengagement"
                },
                status="active",
                enabled=True,
                requires_approval=True
            )

            steps = [
                AutomationStepPreview(
                    step_number=1,
                    title="Trigger: Lead Inactive",
                    description=f"Checks when lead has no touchpoints for {days} days.",
                    type="trigger"
                ),
                AutomationStepPreview(
                    step_number=2,
                    title="Condition: Pipeline Active",
                    description="Verify lead stage is not Lost or Won.",
                    type="condition"
                ),
                AutomationStepPreview(
                    step_number=3,
                    title="AI Agent: Sales Specialist",
                    description="Analyzes past notes & crafts contextual re-engagement draft.",
                    type="agent",
                    agent_badge="Sales Agent"
                ),
                AutomationStepPreview(
                    step_number=4,
                    title="Action: Send Email (Awaiting Approval)",
                    description="Prepares email draft for one-tap approval.",
                    type="action",
                    requires_approval=True
                )
            ]

            return AutomationAIBuilderResponse(
                success=True,
                summary=f"Created an AI workflow to detect inactive leads after {days} days and draft personalized sales follow-ups.",
                suggested_workflow=workflow,
                steps=steps,
                warnings=[]
            )

        # 2. Overdue Invoices / Payment Reminders
        elif any(k in p_lower for k in ["overdue invoice", "invoice reminder", "payment reminder", "unpaid invoice", "chase payment"]):
            workflow = AutomationCreate(
                business_id=business_id,
                name="Overdue Invoice Payment Reminders",
                description="Monitor unpaid invoices and draft polite payment reminders when past due.",
                trigger_type="invoice_overdue",
                trigger_config={"days_past_due": 1, "schedule_time": "09:00"},
                condition_config={
                    "rules": [
                        {"field": "invoice.status", "operator": "==", "value": "overdue"},
                        {"field": "invoice.remaining_balance", "operator": ">", "value": 0}
                    ],
                    "logic": "AND"
                },
                agent_type="finance",
                action_config={
                    "action_type": "send_email",
                    "channel": "email",
                    "tone": "polite_professional",
                    "template": "payment_reminder"
                },
                status="active",
                enabled=True,
                requires_approval=True
            )

            steps = [
                AutomationStepPreview(
                    step_number=1,
                    title="Trigger: Invoice Becomes Overdue",
                    description="Triggers daily at 9:00 AM when due date has passed.",
                    type="trigger"
                ),
                AutomationStepPreview(
                    step_number=2,
                    title="Condition: Remaining Balance > 0",
                    description="Ensures invoice is not marked paid or cancelled.",
                    type="condition"
                ),
                AutomationStepPreview(
                    step_number=3,
                    title="AI Agent: Finance Specialist",
                    description="Calculates overdue days and prepares formal reminder.",
                    type="agent",
                    agent_badge="Finance Agent"
                ),
                AutomationStepPreview(
                    step_number=4,
                    title="Action: Send Email (Awaiting Approval)",
                    description="Generates email ready for approval before external dispatch.",
                    type="action",
                    requires_approval=True
                )
            ]

            return AutomationAIBuilderResponse(
                success=True,
                summary="Created an automated invoice payment reminder workflow with Finance Agent reasoning and approval protection.",
                suggested_workflow=workflow,
                steps=steps,
                warnings=[]
            )

        # 3. Website Lead Ingestion & Qualification
        elif any(k in p_lower for k in ["website lead", "new lead from website", "web lead", "lead comes from my website", "form submission"]):
            workflow = AutomationCreate(
                business_id=business_id,
                name="Website Lead Ingestion & Follow-up",
                description="Automatically process website inbound leads, create CRM records, and prepare welcome email.",
                trigger_type="website_lead_received",
                trigger_config={"source": "website_form", "auto_enrich": True},
                condition_config={
                    "rules": [
                        {"field": "lead.email", "operator": "!=", "value": ""}
                    ],
                    "logic": "AND"
                },
                agent_type="sales",
                action_config={
                    "action_type": "send_email",
                    "channel": "email",
                    "tone": "warm_welcoming",
                    "auto_create_crm": True
                },
                status="active",
                enabled=True,
                requires_approval=True
            )

            steps = [
                AutomationStepPreview(
                    step_number=1,
                    title="Trigger: Website Lead Received",
                    description="Fires instantly when someone submits your website lead form.",
                    type="trigger"
                ),
                AutomationStepPreview(
                    step_number=2,
                    title="Action: Create Customer & Lead",
                    description="Automatically creates customer and pipeline entry in CRM.",
                    type="action"
                ),
                AutomationStepPreview(
                    step_number=3,
                    title="AI Agent: Sales Specialist",
                    description="Scores lead interest and drafts a customized response email.",
                    type="agent",
                    agent_badge="Sales Agent"
                ),
                AutomationStepPreview(
                    step_number=4,
                    title="Action: Send Email (Requires Approval)",
                    description="Dispatches welcome email via Gmail upon confirmation.",
                    type="action",
                    requires_approval=True
                )
            ]

            return AutomationAIBuilderResponse(
                success=True,
                summary="Configured a complete inbound lead processing pipeline with CRM creation and instant AI response drafting.",
                suggested_workflow=workflow,
                steps=steps,
                warnings=[]
            )

        # 4. Weekly Business Summary & Executive Brief
        elif any(k in p_lower for k in ["weekly business summary", "weekly summary", "monday morning", "business brief", "weekly digest"]):
            workflow = AutomationCreate(
                business_id=business_id,
                name="Weekly Business Performance Summary",
                description="Synthesize revenue, leads, pending invoices, and key operational metrics every Monday morning.",
                trigger_type="daily_summary",
                trigger_config={"schedule": "weekly", "day_of_week": "monday", "time": "09:00"},
                condition_config={"rules": [], "logic": "AND"},
                agent_type="supervisor",
                action_config={
                    "action_type": "send_notification",
                    "channel": "in_app",
                    "include_metrics": True
                },
                status="active",
                enabled=True,
                requires_approval=False
            )

            steps = [
                AutomationStepPreview(
                    step_number=1,
                    title="Trigger: Monday 9:00 AM",
                    description="Weekly scheduled trigger at start of business week.",
                    type="trigger"
                ),
                AutomationStepPreview(
                    step_number=2,
                    title="AI Supervisor Multi-Agent Synthesis",
                    description="Gathers revenue from Finance Agent and pipeline from Sales Agent.",
                    type="agent",
                    agent_badge="AI Supervisor"
                ),
                AutomationStepPreview(
                    step_number=3,
                    title="Action: In-App Executive Briefing",
                    description="Sends rich summary notification to your mobile device.",
                    type="action",
                    requires_approval=False
                )
            ]

            return AutomationAIBuilderResponse(
                success=True,
                summary="Created an executive briefing workflow running every Monday morning at 9:00 AM.",
                suggested_workflow=workflow,
                steps=steps,
                warnings=[]
            )

        # 5. Client Meeting Preparation
        elif any(k in p_lower for k in ["meeting brief", "client meeting", "calendar event", "meeting prep"]):
            workflow = AutomationCreate(
                business_id=business_id,
                name="Pre-Meeting Client Intelligence Brief",
                description="Prepare contextual dossier on client before scheduled calendar meetings.",
                trigger_type="calendar_event_upcoming",
                trigger_config={"minutes_before": 30},
                condition_config={"rules": [], "logic": "AND"},
                agent_type="customer_support",
                action_config={
                    "action_type": "send_notification",
                    "channel": "in_app"
                },
                status="active",
                enabled=True,
                requires_approval=False
            )

            steps = [
                AutomationStepPreview(
                    step_number=1,
                    title="Trigger: Calendar Meeting (30m Before)",
                    description="Monitors Google Calendar for upcoming meetings.",
                    type="trigger"
                ),
                AutomationStepPreview(
                    step_number=2,
                    title="AI Agent: Customer Intelligence",
                    description="Pulls past invoices, open proposals, and communication history.",
                    type="agent",
                    agent_badge="Customer Agent"
                ),
                AutomationStepPreview(
                    step_number=3,
                    title="Action: In-App Briefing Card",
                    description="Sends concise attendee summary directly to your dashboard.",
                    type="action",
                    requires_approval=False
                )
            ]

            return AutomationAIBuilderResponse(
                success=True,
                summary="Created a pre-meeting intelligence workflow that alerts you 30 minutes before client calls.",
                suggested_workflow=workflow,
                steps=steps,
                warnings=[]
            )

        # 6. Proposal Generation for Qualified Leads
        elif any(k in p_lower for k in ["proposal", "qualified lead", "lead is qualified"]):
            workflow = AutomationCreate(
                business_id=business_id,
                name="Auto-Draft Proposal for Qualified Leads",
                description="When a lead moves to Qualified stage, generate an initial scope and proposal draft.",
                trigger_type="lead_qualified",
                trigger_config={"target_stage": "qualified"},
                condition_config={
                    "rules": [
                        {"field": "lead.value", "operator": ">", "value": 0}
                    ],
                    "logic": "AND"
                },
                agent_type="proposal",
                action_config={
                    "action_type": "create_proposal",
                    "channel": "proposal",
                    "auto_publish": False
                },
                status="active",
                enabled=True,
                requires_approval=True
            )

            steps = [
                AutomationStepPreview(
                    step_number=1,
                    title="Trigger: Lead Qualified",
                    description="Fires when lead stage updates to Qualified in CRM.",
                    type="trigger"
                ),
                AutomationStepPreview(
                    step_number=2,
                    title="AI Agent: Proposal Specialist",
                    description="Drafts scope of work and line item pricing from lead notes.",
                    type="agent",
                    agent_badge="Proposal Agent"
                ),
                AutomationStepPreview(
                    step_number=3,
                    title="Action: Create Draft Proposal",
                    description="Stores draft in Proposals hub for your final review.",
                    type="action",
                    requires_approval=True
                )
            ]

            return AutomationAIBuilderResponse(
                success=True,
                summary="Created a proposal generation workflow for leads advancing to Qualified stage.",
                suggested_workflow=workflow,
                steps=steps,
                warnings=[]
            )

        # 7. Generic Fallback Parsing
        else:
            title = " ".join([w.capitalize() for w in prompt.split()[:5]])
            workflow = AutomationCreate(
                business_id=business_id,
                name=title if title else "Custom Business Automation",
                description=prompt,
                trigger_type="custom",
                trigger_config={"raw_prompt": prompt},
                condition_config={"rules": [], "logic": "AND"},
                agent_type="sales",
                action_config={
                    "action_type": "send_notification",
                    "channel": "in_app"
                },
                status="active",
                enabled=True,
                requires_approval=True
            )

            steps = [
                AutomationStepPreview(
                    step_number=1,
                    title="Trigger: Custom Event",
                    description="Monitors business events matching your criteria.",
                    type="trigger"
                ),
                AutomationStepPreview(
                    step_number=2,
                    title="AI Agent: SoloCEO Operations",
                    description="Evaluates context and plans appropriate operational actions.",
                    type="agent",
                    agent_badge="AI Supervisor"
                ),
                AutomationStepPreview(
                    step_number=3,
                    title="Action: Business Action (Requires Review)",
                    description="Prepares action for owner verification.",
                    type="action",
                    requires_approval=True
                )
            ]

            return AutomationAIBuilderResponse(
                success=True,
                summary=f"Synthesized a custom business workflow from your instruction: '{prompt}'",
                suggested_workflow=workflow,
                steps=steps,
                warnings=["Please review trigger and action settings before activating."]
            )

ai_automation_builder = AIAutomationBuilder()
