import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.automation.registry import (
    in_memory_automations,
    in_memory_runs,
    in_memory_actions,
    in_memory_logs,
    in_memory_dedup_events,
)
from app.services.billing.usage_service import in_memory_subscriptions
from app.models.schemas import SubscriptionResponse

client = TestClient(app)
AUTH_HEADERS = {"Authorization": "Bearer test-token"}
BIZ_A = "00000000-0000-0000-0000-000000000088"
BIZ_B = "00000000-0000-0000-0000-000000000089"

@pytest.fixture(autouse=True)
def clean_test_state():
    """Ensure clean state for Phase 8 automation tests."""
    in_memory_automations.clear()
    in_memory_runs.clear()
    in_memory_actions.clear()
    in_memory_logs.clear()
    in_memory_dedup_events.clear()

    # Give BIZ_A a starter subscription (allows 5 automations)
    in_memory_subscriptions[BIZ_A] = {
        "id": "sub-test-biz-a",
        "business_id": BIZ_A,
        "user_id": "00000000-0000-0000-0000-000000000001",
        "tier": "starter",
        "status": "active",
        "provider": "revenuecat",
        "provider_customer_id": "rc_cust_88"
    }
    # Give BIZ_B a free subscription (allows 2 automations)
    in_memory_subscriptions[BIZ_B] = {
        "id": "sub-test-biz-b",
        "business_id": BIZ_B,
        "user_id": "00000000-0000-0000-0000-000000000001",
        "tier": "free",
        "status": "active"
    }


# 1. Test AI Automation Builder with different natural language prompts
def test_ai_automation_builder():
    # Prompt A: Inactive leads
    res = client.post(
        "/api/automations/ai-builder",
        json={"prompt": "Follow up with leads who haven't replied for 7 days", "business_id": BIZ_A},
        headers=AUTH_HEADERS
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "Inactive Lead" in data["suggested_workflow"]["name"]
    assert data["suggested_workflow"]["trigger_type"] == "lead_inactive"
    assert len(data["steps"]) >= 3

    # Prompt B: Overdue invoices
    res2 = client.post(
        "/api/automations/ai-builder",
        json={"prompt": "Every morning check overdue invoices and send reminders", "business_id": BIZ_A},
        headers=AUTH_HEADERS
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["suggested_workflow"]["trigger_type"] == "invoice_overdue"
    assert data2["suggested_workflow"]["agent_type"] == "finance"

    # Prompt C: Website leads
    res3 = client.post(
        "/api/automations/ai-builder",
        json={"prompt": "When a new website lead arrives, create customer, lead and draft email", "business_id": BIZ_A},
        headers=AUTH_HEADERS
    )
    assert res3.status_code == 200
    data3 = res3.json()
    assert data3["suggested_workflow"]["trigger_type"] == "website_lead_received"

    # Prompt D: Weekly summary
    res4 = client.post(
        "/api/automations/ai-builder",
        json={"prompt": "Every Monday morning generate my weekly business summary", "business_id": BIZ_A},
        headers=AUTH_HEADERS
    )
    assert res4.status_code == 200
    assert res4.json()["suggested_workflow"]["agent_type"] == "supervisor"


# 2. Test Plan Automation Limits Enforcement
def test_automation_plan_limits_enforcement():
    # Check initial limits for Free plan (BIZ_B)
    res_lim = client.get(f"/api/automations/limits?business_id={BIZ_B}", headers=AUTH_HEADERS)
    assert res_lim.status_code == 200
    lim_data = res_lim.json()
    assert lim_data["plan_tier"] == "free"
    assert lim_data["limit"] == 2
    assert lim_data["can_create"] is True

    # Create 2 automations for BIZ_B (reaches limit)
    for i in range(2):
        res_create = client.post(
            "/api/automations",
            json={
                "business_id": BIZ_B,
                "name": f"Workflow {i+1}",
                "trigger_type": "invoice_overdue",
                "trigger_config": {},
                "condition_config": {},
                "agent_type": "finance",
                "action_config": {},
                "enabled": True
            },
            headers=AUTH_HEADERS
        )
        assert res_create.status_code == 201

    # 3rd creation should fail due to plan limit
    res_overflow = client.post(
        "/api/automations",
        json={
            "business_id": BIZ_B,
            "name": "Overflow Workflow",
            "trigger_type": "lead_inactive",
            "trigger_config": {},
            "condition_config": {},
            "agent_type": "sales",
            "action_config": {},
            "enabled": True
        },
        headers=AUTH_HEADERS
    )
    assert res_overflow.status_code == 400
    assert "AUTOMATION_LIMIT_REACHED" in res_overflow.json()["detail"]


# 3. Test Activate & Pause Endpoints
def test_activate_and_pause_endpoints():
    res_create = client.post(
        "/api/automations",
        json={
            "business_id": BIZ_A,
            "name": "Pausable Workflow",
            "trigger_type": "lead_inactive",
            "trigger_config": {},
            "condition_config": {},
            "agent_type": "sales",
            "action_config": {},
            "enabled": True
        },
        headers=AUTH_HEADERS
    )
    auto_id = res_create.json()["id"]

    # Pause
    res_pause = client.post(f"/api/automations/{auto_id}/pause?business_id={BIZ_A}", headers=AUTH_HEADERS)
    assert res_pause.status_code == 200
    assert res_pause.json()["enabled"] is False
    assert res_pause.json()["status"] == "paused"

    # Activate
    res_act = client.post(f"/api/automations/{auto_id}/activate?business_id={BIZ_A}", headers=AUTH_HEADERS)
    assert res_act.status_code == 200
    assert res_act.json()["enabled"] is True
    assert res_act.json()["status"] == "active"


# 4. Test Manual Execution, Runs, and Step Audit Logs
def test_manual_execution_and_audit_logs():
    res_create = client.post(
        "/api/automations",
        json={
            "business_id": BIZ_A,
            "name": "Payment Reminder Workflow",
            "trigger_type": "invoice_overdue",
            "trigger_config": {"days_past_due": 1},
            "condition_config": {},
            "agent_type": "finance",
            "action_config": {"channel": "email", "action_type": "send_email"},
            "requires_approval": True,
            "enabled": True
        },
        headers=AUTH_HEADERS
    )
    auto_id = res_create.json()["id"]

    # Run Now
    res_run = client.post(f"/api/automations/{auto_id}/run?business_id={BIZ_A}", headers=AUTH_HEADERS)
    assert res_run.status_code == 200
    run_data = res_run.json()
    run_id = run_data["id"]
    assert run_data["status"] == "waiting_approval"

    # Verify Runs endpoint
    res_runs = client.get(f"/api/automations/runs?business_id={BIZ_A}", headers=AUTH_HEADERS)
    assert res_runs.status_code == 200
    assert len(res_runs.json()) >= 1

    # Verify Logs endpoint
    res_logs = client.get(f"/api/automations/{auto_id}/logs?business_id={BIZ_A}&run_id={run_id}", headers=AUTH_HEADERS)
    assert res_logs.status_code == 200
    logs = res_logs.json()
    assert len(logs) >= 3
    event_types = [l["event_type"] for l in logs]
    assert "trigger_detected" in event_types
    assert "agent_executed" in event_types


# 5. Test Pending Action Approvals and Rejections
def test_action_approval_and_rejection():
    res_create = client.post(
        "/api/automations",
        json={
            "business_id": BIZ_A,
            "name": "Lead Approval Test",
            "trigger_type": "lead_inactive",
            "trigger_config": {},
            "condition_config": {},
            "agent_type": "sales",
            "action_config": {"channel": "email"},
            "requires_approval": True,
            "enabled": True
        },
        headers=AUTH_HEADERS
    )
    auto_id = res_create.json()["id"]

    # Trigger run
    client.post(f"/api/automations/{auto_id}/run?business_id={BIZ_A}", headers=AUTH_HEADERS)

    # Fetch pending approvals
    res_pending = client.get(f"/api/automation-actions/pending?business_id={BIZ_A}", headers=AUTH_HEADERS)
    assert res_pending.status_code == 200
    pending_list = res_pending.json()
    assert len(pending_list) >= 1
    action_id = pending_list[0]["id"]

    # Approve action
    res_approve = client.post(
        f"/api/automation-actions/{action_id}/approve",
        json={"business_id": BIZ_A, "confirmed": True, "note": "Looks great!"},
        headers=AUTH_HEADERS
    )
    assert res_approve.status_code == 200
    assert res_approve.json()["success"] is True


# 6. Test Website Lead Ingestion Automatically Triggers Automation
def test_website_lead_ingestion_triggers_automation():
    # Set up active website lead automation
    res_create = client.post(
        "/api/automations",
        json={
            "business_id": BIZ_A,
            "name": "Auto Website Lead Welcome",
            "trigger_type": "website_lead_received",
            "trigger_config": {},
            "condition_config": {},
            "agent_type": "sales",
            "action_config": {"channel": "notification", "action_type": "send_notification"},
            "requires_approval": False,
            "enabled": True
        },
        headers=AUTH_HEADERS
    )
    auto_id = res_create.json()["id"]

    # Ingest lead via public website webhook
    res_lead = client.post(
        f"/api/integrations/webhooks/leads/{BIZ_A}",
        json={
            "name": "Sarah Jenkins",
            "company": "Jenkins Architecture",
            "email": "sarah@jenkinsarch.com",
            "message": "Interested in turnkey commercial interior project.",
            "estimated_budget": 500000.0,
            "source": "website_contact_form"
        }
    )
    assert res_lead.status_code == 200
    assert res_lead.json()["success"] is True

    # Check that the automation executed
    res_runs = client.get(f"/api/automations/{auto_id}/runs?business_id={BIZ_A}", headers=AUTH_HEADERS)
    assert res_runs.status_code == 200
    runs = res_runs.json()
    assert len(runs) >= 1
    assert runs[0]["status"] == "completed"


# 7. Test AI Supervisor Automation Commands
def test_ai_supervisor_automation_commands():
    # Create an automation
    client.post(
        "/api/automations",
        json={
            "business_id": BIZ_A,
            "name": "Supervisor Inactive Lead Flow",
            "trigger_type": "lead_inactive",
            "trigger_config": {},
            "condition_config": {},
            "agent_type": "sales",
            "action_config": {},
            "enabled": True
        },
        headers=AUTH_HEADERS
    )

    # Ask AI: "Show my active automations"
    res_ai = client.post(
        "/api/ai/command",
        json={"prompt": "Show my active automations", "business_id": BIZ_A},
        headers=AUTH_HEADERS
    )
    assert res_ai.status_code == 200
    ai_data = res_ai.json()
    assert "active workflows" in ai_data["message"].lower() or "automations" in ai_data["message"].lower()

    # Ask AI to draft a new workflow
    res_ai_create = client.post(
        "/api/ai/command",
        json={"prompt": "Create an automation that follows up with inactive leads", "business_id": BIZ_A},
        headers=AUTH_HEADERS
    )
    assert res_ai_create.status_code == 200
    assert "drafted a new workflow" in res_ai_create.json()["message"].lower() or "workflow" in res_ai_create.json()["message"].lower()


# 8. Test Multi-tenant Workspace Isolation
def test_workspace_isolation_on_automations():
    # Create automation in BIZ_A
    res_a = client.post(
        "/api/automations",
        json={
            "business_id": BIZ_A,
            "name": "Secret BIZ_A Workflow",
            "trigger_type": "invoice_overdue",
            "trigger_config": {},
            "condition_config": {},
            "agent_type": "finance",
            "action_config": {},
            "enabled": True
        },
        headers=AUTH_HEADERS
    )
    auto_a_id = res_a.json()["id"]

    # BIZ_B list should not see BIZ_A workflow
    res_b_list = client.get(f"/api/automations?business_id={BIZ_B}", headers=AUTH_HEADERS)
    b_ids = [a["id"] for a in res_b_list.json()]
    assert auto_a_id not in b_ids

    # BIZ_B detail query for auto_a_id should 404
    res_b_get = client.get(f"/api/automations/{auto_a_id}?business_id={BIZ_B}", headers=AUTH_HEADERS)
    assert res_b_get.status_code == 404
