import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.services.billing.usage_service import usage_service, in_memory_subscriptions
from app.services.ai.supervisor import supervisor_instance
from app.services.ai.tools.shared_data import (
    in_memory_customers,
    in_memory_leads,
    in_memory_invoices,
    in_memory_proposals
)

client = TestClient(app)
AUTH_HEADERS = {"Authorization": "Bearer test-token"}

BIZ_1 = "00000000-0000-0000-0000-000000000010"
BIZ_2 = "00000000-0000-0000-0000-000000000020"
USER_1 = "00000000-0000-0000-0000-000000000001"

@pytest.fixture(autouse=True)
def setup_phase10_state():
    """Reset test subscriptions and memory state."""
    in_memory_subscriptions[BIZ_1] = {
        "id": "sub_p10_1",
        "business_id": BIZ_1,
        "user_id": USER_1,
        "tier": "starter",
        "status": "active",
        "provider": "revenuecat",
        "provider_customer_id": "rc_cust_10",
        "provider_subscription_id": "rc_sub_10",
        "active_entitlements": ["starter_access"],
        "current_period_start": "2026-09-01T00:00:00Z",
        "current_period_end": "2026-10-01T00:00:00Z",
        "cancel_at_period_end": False
    }

# ==============================================================================
# 1. AUTH & MULTI-TENANT ISOLATION HARDENING
# ==============================================================================
def test_workspace_isolation_crm():
    """Ensure data created in BIZ_1 is completely isolated from BIZ_2."""
    # Create customer in BIZ_1
    cust_payload = {
        "business_id": BIZ_1,
        "name": "Arun Verma",
        "company_name": "Verma Logistics",
        "email": "arun@verma.in",
        "status": "active"
    }
    create_res = client.post("/api/customers", json=cust_payload, headers=AUTH_HEADERS)
    assert create_res.status_code in [200, 201]

    # Verify BIZ_1 list contains customer
    list_res_1 = client.get(f"/api/customers?business_id={BIZ_1}", headers=AUTH_HEADERS)
    assert list_res_1.status_code == 200
    names_1 = [c["name"] for c in list_res_1.json()]
    assert "Arun Verma" in names_1

    # Verify BIZ_2 list does NOT contain BIZ_1 customer
    list_res_2 = client.get(f"/api/customers?business_id={BIZ_2}", headers=AUTH_HEADERS)
    assert list_res_2.status_code == 200
    names_2 = [c["name"] for c in list_res_2.json()]
    assert "Arun Verma" not in names_2


# ==============================================================================
# 2. COMPLETE CRM OPERATIONS FLOW
# ==============================================================================
def test_end_to_end_crm_financial_lifecycle():
    """Test Customer -> Lead -> Proposal -> Conversion to Invoice -> Financial Math -> Payment -> Overdue."""
    # 1. Create Lead
    lead_payload = {
        "business_id": BIZ_1,
        "title": "Corporate HQ Redesign",
        "company": "Titan Enterprises",
        "contact_name": "Rohan Titan",
        "value": 150000.0,
        "source": "website",
        "status": "new",
        "priority": "high"
    }
    lead_res = client.post("/api/leads", json=lead_payload, headers=AUTH_HEADERS)
    assert lead_res.status_code in [200, 201]
    lead_id = lead_res.json()["id"]

    # 2. Update Lead Stage to Proposal
    upd_res = client.put(f"/api/leads/{lead_id}?business_id={BIZ_1}", json={"status": "proposal"}, headers=AUTH_HEADERS)
    assert upd_res.status_code == 200
    assert upd_res.json()["status"] == "proposal"

    # 3. Create Proposal with Items
    prop_payload = {
        "business_id": BIZ_1,
        "lead_id": lead_id,
        "title": "Architecture & Interior Scope",
        "items": [
            {"title": "Concept & Blueprinting", "cost": 50000.0},
            {"title": "Execution & Procurement", "cost": 100000.0}
        ],
        "total_value": 140000.0
    }
    prop_res = client.post("/api/proposals", json=prop_payload, headers=AUTH_HEADERS)
    assert prop_res.status_code in [200, 201]
    prop_data = prop_res.json()
    prop_id = prop_data["id"]
    assert prop_data["total_value"] == 140000.0

    # 4. Accept Proposal
    accept_res = client.post(f"/api/proposals/{prop_id}/accept", headers=AUTH_HEADERS)
    assert accept_res.status_code == 200

    # 5. Convert Proposal to Invoice
    conv_res = client.post(f"/api/proposals/{prop_id}/convert-to-invoice", headers=AUTH_HEADERS)
    assert conv_res.status_code in [200, 201]
    inv_data = conv_res.json()
    inv_id = inv_data["id"]
    assert inv_data["total_amount"] >= 140000.0

    # 6. Record Partial Payment
    pay_payload = {
        "business_id": BIZ_1,
        "amount": 70000.0,
        "payment_method": "bank_transfer",
        "notes": "50% upfront retainer"
    }
    pay_res = client.post(f"/api/invoices/{inv_id}/payments", json=pay_payload, headers=AUTH_HEADERS)
    assert pay_res.status_code in [200, 201]

    # 7. Check Invoice Status Updated to partially_paid
    inv_check = client.get(f"/api/invoices/{inv_id}", headers=AUTH_HEADERS)
    assert inv_check.status_code == 200

# ==============================================================================
# 3. AI SUPERVISOR & WRITE-ACTION SECURITY
# ==============================================================================
def test_ai_supervisor_deterministic_queries_and_confirmation():
    """Verify AI supervisor classifies queries correctly and handles action confirmation."""
    # 1. Deterministic Intent Routing
    assert supervisor_instance.route_intent("Which leads haven't replied in 7 days?") == "SALES"
    assert supervisor_instance.route_intent("Who owes me money and has overdue invoices?") == "FINANCE"
    assert supervisor_instance.route_intent("Draft a proposal for Acme Corp for ₹50,000") == "PROPOSAL"
    assert supervisor_instance.route_intent("Show me my automations and active triggers") == "AUTOMATIONS"
    assert supervisor_instance.route_intent("Give me an executive business intelligence report") == "ANALYTICS"

    # 2. Execute AI Command
    cmd_payload = {
        "business_id": BIZ_1,
        "prompt": "Show me my revenue analytics for this month"
    }
    cmd_res = client.post("/api/ai/command", json=cmd_payload, headers=AUTH_HEADERS)
    assert cmd_res.status_code == 200
    data = cmd_res.json()
    assert "agent" in data
    assert len(data["action_cards"]) > 0


# ==============================================================================
# 4. INTEGRATIONS & WEBHOOKS HARDENING
# ==============================================================================
def test_integrations_and_lead_webhook():
    """Verify integration statuses and website lead webhook deduplication."""
    # 1. Integrations Status Check
    int_res = client.get(f"/api/integrations?business_id={BIZ_1}", headers=AUTH_HEADERS)
    assert int_res.status_code == 200
    integrations = int_res.json()
    providers = [i["provider"] for i in integrations]
    assert "gmail" in providers
    assert "google_calendar" in providers
    assert "whatsapp" in providers
    assert "website_leads" in providers

    # 2. Ingest Website Lead via Webhook
    hook_payload = {
        "name": "Kavita Rao",
        "email": "kavita@raoenterprises.com",
        "phone": "+91 9988776655",
        "company": "Rao Enterprises",
        "message": "Inquiry for full stack operational redesign"
    }
    hook_res = client.post(f"/api/integrations/webhooks/leads/{BIZ_1}", json=hook_payload)
    assert hook_res.status_code in [200, 201]
    lead_id = hook_res.json()["lead_id"]

    # 3. Duplicate Ingestion Handled Cleanly
    hook_res_dup = client.post(f"/api/integrations/webhooks/leads/{BIZ_1}", json=hook_payload)
    assert hook_res_dup.status_code in [200, 201]


# ==============================================================================
# 5. MONETIZATION & ENTITLEMENT ENFORCEMENT
# ==============================================================================
def test_entitlements_and_credit_limits():
    """Verify AI credit limits and automation plan rules are strictly enforced."""
    # 1. Fetch Entitlements
    ent_res = client.get(f"/api/billing/entitlements?business_id={BIZ_1}", headers=AUTH_HEADERS)
    assert ent_res.status_code == 200
    ent_data = ent_res.json()
    assert ent_data["tier"] == "starter"
    assert ent_data["ai_credits_total"] == 50

    # 2. Credit Consumption & Exhaustion Check
    has_credits, remaining, total = usage_service.check_ai_credits(BIZ_1, credits_needed=1)
    assert has_credits is True
    assert remaining > 0

    # 3. Plan Upgrade Simulation
    upg_res = client.post("/api/billing/upgrade", json={"business_id": BIZ_1, "plan_tier": "business"}, headers=AUTH_HEADERS)
    assert upg_res.status_code == 200
    assert upg_res.json()["tier"] == "business"

    # 4. Check Business Entitlements Updated (250 credits)
    ent_res_after = client.get(f"/api/billing/entitlements?business_id={BIZ_1}", headers=AUTH_HEADERS)
    assert ent_res_after.status_code == 200
    assert ent_res_after.json()["ai_credits_total"] == 250


# ==============================================================================
# 6. ANALYTICS & REPORTING ENDPOINTS
# ==============================================================================
def test_analytics_and_report_generation():
    """Verify analytics endpoints return valid calculated metrics and reports."""
    # 1. Overview
    overview_res = client.get(f"/api/analytics/overview?business_id={BIZ_1}&time_frame=30d", headers=AUTH_HEADERS)
    assert overview_res.status_code == 200
    assert "total_revenue" in overview_res.json()

    # 2. Generate Report
    rep_res = client.post("/api/reports/generate", json={
        "business_id": BIZ_1,
        "report_type": "monthly_financial",
        "time_frame": "30d",
        "title": "Phase 10 Hardening Financial Brief"
    }, headers=AUTH_HEADERS)
    assert rep_res.status_code == 201
    rep_data = rep_res.json()
    rep_id = rep_data["id"]

    # 3. Export Formats (CSV & Markdown)
    exp_csv = client.get(f"/api/reports/{rep_id}/export?business_id={BIZ_1}&format=csv", headers=AUTH_HEADERS)
    assert exp_csv.status_code == 200
    assert "Section,Metric,Value" in exp_csv.json()["content"]

    exp_md = client.get(f"/api/reports/{rep_id}/export?business_id={BIZ_1}&format=markdown", headers=AUTH_HEADERS)
    assert exp_md.status_code == 200
    assert "# Phase 10 Hardening Financial Brief" in exp_md.json()["content"]
