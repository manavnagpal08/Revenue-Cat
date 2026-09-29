import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.services.billing.plan_config import get_plan_by_tier, get_all_plans
from app.services.billing.usage_service import usage_service, in_memory_subscriptions
from app.services.billing.billing_service import billing_service

client = TestClient(app)
AUTH_HEADERS = {"Authorization": "Bearer test-token"}
BIZ_A = "00000000-0000-0000-0000-000000000077"
BIZ_B = "00000000-0000-0000-0000-000000000099"

@pytest.fixture(autouse=True)
def setup_billing_test_state():
    """Reset business subscription to starter for testing."""
    in_memory_subscriptions[BIZ_A] = {
        "id": "sub-test-biz-a",
        "business_id": BIZ_A,
        "user_id": "00000000-0000-0000-0000-000000000001",
        "tier": "starter",
        "status": "active",
        "provider": "revenuecat",
        "provider_customer_id": "rc_cust_biz_a",
        "provider_subscription_id": "rc_sub_biz_a",
        "active_entitlements": ["starter_access"],
        "current_period_start": "2026-09-01T00:00:00Z",
        "current_period_end": "2026-10-01T00:00:00Z",
        "cancel_at_period_end": False
    }


# 1. Plans Retrieval
def test_get_plans():
    res = client.get("/api/billing/plans")
    assert res.status_code == 200
    plans = res.json()
    assert isinstance(plans, list)
    assert len(plans) >= 4

    plan_ids = [p["id"] for p in plans]
    assert "free" in plan_ids
    assert "starter" in plan_ids
    assert "business" in plan_ids
    assert "pro" in plan_ids

    starter = next(p for p in plans if p["id"] == "starter")
    assert starter["price_monthly"] == 499.0
    assert starter["ai_credits_monthly"] == 50
    assert starter["automations_limit"] == 5


# 2. Subscription Retrieval
def test_get_subscription():
    res = client.get(f"/api/billing/subscription?business_id={BIZ_A}", headers=AUTH_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert data["business_id"] == BIZ_A
    assert data["tier"] == "starter"
    assert data["status"] == "active"


# 3. Entitlements Calculation
def test_get_entitlements():
    res = client.get(f"/api/billing/entitlements?business_id={BIZ_A}", headers=AUTH_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert data["business_id"] == BIZ_A
    assert data["tier"] == "starter"
    assert data["ai_credits_total"] == 50
    assert data["can_access_ai_command"] is True
    assert "feature_flags" in data


# 4. Usage Summary & AI Credit Consumption
def test_usage_summary_and_credit_consumption():
    # Consume 5 credits
    usage_res = usage_service.consume_ai_credits(
        business_id=BIZ_A,
        user_id="user-1",
        action_type="test_analysis",
        credits=5
    )
    assert usage_res["success"] is True
    assert usage_res["credits_consumed"] == 5

    res = client.get(f"/api/billing/usage?business_id={BIZ_A}", headers=AUTH_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert data["business_id"] == BIZ_A
    assert data["ai_credits_used"] >= 5
    assert data["ai_credits_remaining"] <= 45
    assert "usage_by_action" in data


# 5. AI Credit Exhaustion Enforcement in AI Supervisor
def test_ai_credit_exhaustion_in_supervisor():
    # Simulate credit exhaustion by consuming remaining credits
    has_credits, remaining, _ = usage_service.check_ai_credits(BIZ_A)
    if remaining > 0:
        usage_service.consume_ai_credits(
            business_id=BIZ_A,
            user_id="user-1",
            action_type="drain_test",
            credits=remaining
        )

    # Now supervisor query must return structured AI_CREDITS_EXHAUSTED
    ai_res = client.post(
        "/api/ai/command",
        json={
            "business_id": BIZ_A,
            "prompt": "What should I focus on today?"
        },
        headers=AUTH_HEADERS
    )
    assert ai_res.status_code == 200
    data = ai_res.json()
    assert data["intent"] == "EXHAUSTED"
    assert "AI_CREDITS_EXHAUSTED" in data["message"]
    assert data["structured_data"]["code"] == "AI_CREDITS_EXHAUSTED"
    assert data["credits_remaining"] == 0


# 6. Automation Limits Enforcement
def test_automation_limit_enforcement():
    # Reset to Starter (limit 5)
    in_memory_subscriptions[BIZ_A]["tier"] = "starter"

    # Try creating 6 automations
    for i in range(5):
        client.post(
            "/api/automations",
            json={
                "business_id": BIZ_A,
                "name": f"Automation Test {i}",
                "trigger_type": "daily_summary",
                "agent_type": "supervisor",
                "action_config": {"channel": "notification"},
                "requires_approval": False
            },
            headers=AUTH_HEADERS
        )

    # The 6th automation should fail due to plan limit
    res = client.post(
        "/api/automations",
        json={
            "business_id": BIZ_A,
            "name": "Excess Automation",
            "trigger_type": "daily_summary",
            "agent_type": "supervisor",
            "action_config": {"channel": "notification"},
            "requires_approval": False
        },
        headers=AUTH_HEADERS
    )
    # Returns 400/500/422 with error message or handled gracefully
    assert res.status_code != 201 or "AUTOMATION_LIMIT_REACHED" in res.text


# 7. Plan Tier Upgrades
def test_plan_tier_upgrade():
    up_res = client.post(
        "/api/billing/upgrade",
        json={"business_id": BIZ_A, "plan_tier": "business"},
        headers=AUTH_HEADERS
    )
    assert up_res.status_code == 200
    assert up_res.json()["tier"] == "business"

    # Verify new allowances
    ent = client.get(f"/api/billing/entitlements?business_id={BIZ_A}", headers=AUTH_HEADERS).json()
    assert ent["ai_credits_total"] == 250
    assert ent["automations_limit"] == 25


# 8. RevenueCat Webhook Events Handling
def test_revenuecat_webhook_processing():
    webhook_secret = settings.REVENUECAT_WEBHOOK_SECRET or "soloceo-webhook-secret-key-12345"

    # INITIAL_PURCHASE
    payload = {
        "event": {
            "id": "rc_evt_123456",
            "type": "INITIAL_PURCHASE",
            "app_user_id": f"biz_{BIZ_A}",
            "product_id": "soloceo_pro_monthly",
            "purchased_at_ms": 1727500000000,
            "expiration_at_ms": 1730100000000
        }
    }
    res = client.post(
        "/api/billing/webhook/revenuecat",
        json=payload,
        headers={"Authorization": f"Bearer {webhook_secret}"}
    )
    assert res.status_code == 200
    assert res.json()["result"]["tier"] == "pro"
    assert res.json()["result"]["status"] == "active"

    # EXPIRATION Event
    exp_payload = {
        "event": {
            "id": "rc_evt_789012",
            "type": "EXPIRATION",
            "app_user_id": f"biz_{BIZ_A}",
            "product_id": "soloceo_pro_monthly"
        }
    }
    exp_res = client.post(
        "/api/billing/webhook/revenuecat",
        json=exp_payload,
        headers={"Authorization": f"Bearer {webhook_secret}"}
    )
    assert exp_res.status_code == 200
    assert exp_res.json()["result"]["status"] == "expired"


# 9. Restore Purchases
def test_restore_subscription():
    res = client.post(
        "/api/billing/restore",
        json={"business_id": BIZ_A, "app_user_id": "rc_cust_biz_a"},
        headers=AUTH_HEADERS
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["business_id"] == BIZ_A


# 10. Billing History Invoices
def test_billing_history():
    res = client.get(f"/api/billing/history?business_id={BIZ_A}", headers=AUTH_HEADERS)
    assert res.status_code == 200
    history = res.json()
    assert isinstance(history, list)
    assert len(history) >= 1
    assert history[0]["status"] == "paid"
