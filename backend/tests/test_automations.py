import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.automation.conditions import condition_evaluator
from app.services.automation.triggers import TriggerEvaluator
from app.services.automation.engine import automation_engine
from app.services.automation.scheduler import automation_scheduler
from app.services.ai.tools.shared_data import (
    in_memory_customers,
    in_memory_leads,
    in_memory_invoices,
)

client = TestClient(app)
AUTH_HEADERS = {"Authorization": "Bearer test-token"}
BIZ_A = "00000000-0000-0000-0000-000000000002"
BIZ_B = "00000000-0000-0000-0000-000000000099"

@pytest.fixture(autouse=True)
def seed_business_data():
    """Seed test data for automation execution."""
    in_memory_customers["cust-auto-1"] = {
        "id": "cust-auto-1",
        "business_id": BIZ_A,
        "name": "Rahul Sharma",
        "company_name": "Rahul Designs",
        "email": "rahul@rahuldesigns.in",
        "phone": "+91 9988776655",
        "status": "active"
    }
    in_memory_leads["lead-auto-1"] = {
        "id": "lead-auto-1",
        "business_id": BIZ_A,
        "customer_id": "cust-auto-1",
        "title": "Turnkey Design Proposal",
        "value": 150000.0,
        "status": "proposal",
        "days_inactive": 8,
        "last_contacted_at": "2026-09-10T10:00:00Z"
    }
    in_memory_invoices["inv-auto-1"] = {
        "id": "inv-auto-1",
        "business_id": BIZ_A,
        "customer_id": "cust-auto-1",
        "invoice_number": "INV-2026-999",
        "status": "overdue",
        "total_amount": 45000.0,
        "due_date": "2026-09-15"
    }


# 1. Condition Evaluator Unit Tests
def test_condition_evaluator_operators():
    context = {
        "lead": {"days_inactive": 10, "status": "proposal", "value": 75000},
        "invoice": {"status": "overdue", "total_amount": 25000.0}
    }

    # Greater than
    assert condition_evaluator.evaluate({"field": "lead.days_inactive", "operator": ">", "value": 7}, context) is True
    assert condition_evaluator.evaluate({"field": "lead.days_inactive", "operator": "<", "value": 5}, context) is False

    # Equals
    assert condition_evaluator.evaluate({"field": "invoice.status", "operator": "==", "value": "overdue"}, context) is True
    assert condition_evaluator.evaluate({"field": "invoice.status", "operator": "!=", "value": "paid"}, context) is True

    # Composite AND
    and_config = {
        "AND": [
            {"field": "lead.days_inactive", "operator": ">", "value": 5},
            {"field": "lead.status", "operator": "==", "value": "proposal"}
        ]
    }
    assert condition_evaluator.evaluate(and_config, context) is True

    # Composite OR
    or_config = {
        "OR": [
            {"field": "lead.status", "operator": "==", "value": "won"},
            {"field": "invoice.status", "operator": "==", "value": "overdue"}
        ]
    }
    assert condition_evaluator.evaluate(or_config, context) is True

    # NOT operator
    not_config = {
        "NOT": {"field": "lead.status", "operator": "==", "value": "won"}
    }
    assert condition_evaluator.evaluate(not_config, context) is True


# 2. Automation CRUD & Lifecycle
def test_automation_crud_lifecycle():
    # 1. Create Automation
    payload = {
        "business_id": BIZ_A,
        "name": "Follow up Inactive Leads",
        "description": "Auto-send email when lead is inactive for 7 days",
        "trigger_type": "lead_inactive",
        "trigger_config": {"inactivity_days": 7},
        "condition_config": {
            "rules": [{"field": "lead.days_inactive", "operator": ">", "value": 7}]
        },
        "agent_type": "sales",
        "action_config": {
            "channel": "email",
            "action_type": "send_email",
            "prompt": "Send a friendly follow-up email.",
            "tone": "friendly"
        },
        "requires_approval": True,
        "status": "active",
        "enabled": True
    }

    create_res = client.post("/api/automations", json=payload, headers=AUTH_HEADERS)
    assert create_res.status_code == 201
    auto = create_res.json()
    auto_id = auto["id"]
    assert auto["name"] == "Follow up Inactive Leads"
    assert auto["business_id"] == BIZ_A

    # 2. List Automations
    list_res = client.get(f"/api/automations?business_id={BIZ_A}", headers=AUTH_HEADERS)
    assert list_res.status_code == 200
    autos = list_res.json()
    assert any(a["id"] == auto_id for a in autos)

    # 3. Get Automation Detail
    get_res = client.get(f"/api/automations/{auto_id}?business_id={BIZ_A}", headers=AUTH_HEADERS)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == auto_id

    # 4. Update Automation
    update_res = client.put(
        f"/api/automations/{auto_id}?business_id={BIZ_A}",
        json={"name": "Follow up Inactive Leads Updated"},
        headers=AUTH_HEADERS
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Follow up Inactive Leads Updated"

    # 5. Disable / Enable
    dis_res = client.post(f"/api/automations/{auto_id}/disable?business_id={BIZ_A}", headers=AUTH_HEADERS)
    assert dis_res.status_code == 200
    assert dis_res.json()["enabled"] is False
    assert dis_res.json()["status"] == "paused"

    en_res = client.post(f"/api/automations/{auto_id}/enable?business_id={BIZ_A}", headers=AUTH_HEADERS)
    assert en_res.status_code == 200
    assert en_res.json()["enabled"] is True
    assert en_res.json()["status"] == "active"


# 3. Approval Workflow Execution & Human-in-the-Loop
def test_automation_run_and_approval_workflow():
    # Create automation requiring approval
    payload = {
        "business_id": BIZ_A,
        "name": "Overdue Invoice Notice",
        "trigger_type": "invoice_overdue",
        "agent_type": "finance",
        "action_config": {
            "channel": "notification",
            "action_type": "send_notification",
            "prompt": "Prepare an overdue invoice alert.",
            "tone": "professional"
        },
        "requires_approval": True,
        "enabled": True,
        "status": "active"
    }
    create_res = client.post("/api/automations", json=payload, headers=AUTH_HEADERS)
    auto_id = create_res.json()["id"]

    # Run automation manually
    run_res = client.post(f"/api/automations/{auto_id}/run?business_id={BIZ_A}", headers=AUTH_HEADERS)
    assert run_res.status_code == 200
    run_data = run_res.json()
    assert run_data["status"] == "waiting_approval"
    assert len(run_data["actions"]) == 1

    action_id = run_data["actions"][0]["id"]
    assert run_data["actions"][0]["status"] == "waiting_approval"

    # Approve action
    app_res = client.post(
        f"/api/automation-actions/{action_id}/approve",
        json={"business_id": BIZ_A, "confirmed": True, "note": "Approved by CFO"},
        headers=AUTH_HEADERS
    )
    assert app_res.status_code == 200
    assert app_res.json()["status"] in ["approved", "executed"]

    # Verify run status is updated to completed
    detail_res = client.get(f"/api/automation-runs/{run_data['id']}?business_id={BIZ_A}", headers=AUTH_HEADERS)
    assert detail_res.status_code == 200
    assert detail_res.json()["status"] == "completed"


# 4. Action Rejection
def test_automation_action_rejection():
    payload = {
        "business_id": BIZ_A,
        "name": "Proposal Follow-up",
        "trigger_type": "lead_inactive",
        "agent_type": "sales",
        "action_config": {
            "channel": "notification",
            "action_type": "send_notification"
        },
        "requires_approval": True,
        "enabled": True,
        "status": "active"
    }
    auto_id = client.post("/api/automations", json=payload, headers=AUTH_HEADERS).json()["id"]
    run_data = client.post(f"/api/automations/{auto_id}/run?business_id={BIZ_A}", headers=AUTH_HEADERS).json()
    action_id = run_data["actions"][0]["id"]

    # Reject
    rej_res = client.post(
        f"/api/automation-actions/{action_id}/reject",
        json={"business_id": BIZ_A, "confirmed": False, "note": "Do not send yet"},
        headers=AUTH_HEADERS
    )
    assert rej_res.status_code == 200
    assert rej_res.json()["status"] == "rejected"

    # Run should now be cancelled
    detail = client.get(f"/api/automation-runs/{run_data['id']}?business_id={BIZ_A}", headers=AUTH_HEADERS).json()
    assert detail["status"] == "cancelled"


# 5. Templates & Analytics Endpoints
def test_templates_and_analytics():
    # Templates
    tpl_res = client.get("/api/automations/templates", headers=AUTH_HEADERS)
    assert tpl_res.status_code == 200
    templates = tpl_res.json()
    assert len(templates) >= 6
    categories = [t["category"] for t in templates]
    assert "sales" in categories
    assert "finance" in categories
    assert "operations" in categories

    # Triggers
    trig_res = client.get("/api/automations/triggers", headers=AUTH_HEADERS)
    assert trig_res.status_code == 200
    assert len(trig_res.json()) >= 6

    # Analytics
    ana_res = client.get(f"/api/automations/analytics?business_id={BIZ_A}", headers=AUTH_HEADERS)
    assert ana_res.status_code == 200
    data = ana_res.json()
    assert "total_runs" in data
    assert "success_rate_percent" in data
    assert "runs_timeline" in data


# 6. Notifications Lifecycle
def test_notifications_lifecycle():
    notif_res = client.get(f"/api/notifications?business_id={BIZ_A}", headers=AUTH_HEADERS)
    assert notif_res.status_code == 200
    notifs = notif_res.json()
    assert isinstance(notifs, list)

    if notifs:
        n_id = notifs[0]["id"]
        read_res = client.post(f"/api/notifications/{n_id}/read?business_id={BIZ_A}", headers=AUTH_HEADERS)
        assert read_res.status_code == 200
        assert read_res.json()["is_read"] is True

    # Read all
    read_all_res = client.post(f"/api/notifications/read-all?business_id={BIZ_A}", headers=AUTH_HEADERS)
    assert read_all_res.status_code == 200
    assert read_all_res.json()["success"] is True


# 7. Multi-Tenant Business Isolation
def test_tenant_isolation():
    # Automations created in BIZ_A should not be retrieved in BIZ_B
    payload = {
        "business_id": BIZ_A,
        "name": "Secret BIZ_A Automation",
        "trigger_type": "daily_summary",
        "agent_type": "supervisor",
        "action_config": {"channel": "notification"},
        "requires_approval": False
    }
    auto_id = client.post("/api/automations", json=payload, headers=AUTH_HEADERS).json()["id"]

    # Request from BIZ_B should fail 404
    res = client.get(f"/api/automations/{auto_id}?business_id={BIZ_B}", headers=AUTH_HEADERS)
    assert res.status_code == 404


# 8. Scheduler Sweep
@pytest.mark.asyncio
async def test_scheduler_sweep():
    sweep_res = await automation_scheduler.run_scheduled_sweeps(business_id=BIZ_A)
    assert sweep_res["business_id"] == BIZ_A
    assert sweep_res["evaluated_count"] >= 1
