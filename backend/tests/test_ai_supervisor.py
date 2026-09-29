import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.ai.supervisor import supervisor_instance
from app.services.ai.tools.registry import execute_tool, TOOL_REGISTRY
from app.services.ai.actions import execute_confirmed_action
from app.services.ai.tools.shared_data import (
    in_memory_customers,
    in_memory_leads,
    in_memory_invoices,
    in_memory_proposals
)

client = TestClient(app)

TEST_BUSINESS_ID = "00000000-0000-0000-0000-000000000002"
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
AUTH_HEADERS = {"Authorization": "Bearer test-token"}

@pytest.fixture(autouse=True)
def setup_test_business_data():
    """Populate test business records for AI tests."""
    # Seed Customer
    in_memory_customers["cust-ai-1"] = {
        "id": "cust-ai-1",
        "business_id": TEST_BUSINESS_ID,
        "name": "Acme Interiors",
        "company_name": "Acme Corp",
        "email": "contact@acme.com",
        "phone": "+91 9876543210",
        "total_revenue": 120000.0,
        "status": "active"
    }

    # Seed Inactive Lead
    in_memory_leads["lead-ai-1"] = {
        "id": "lead-ai-1",
        "business_id": TEST_BUSINESS_ID,
        "customer_id": "cust-ai-1",
        "title": "Full Brand & Web Redesign",
        "value": 85000.0,
        "status": "proposal",
        "last_contacted_at": "2026-09-10T10:00:00Z",
        "created_at": "2026-09-01T10:00:00Z"
    }

    # Seed Overdue Invoice
    in_memory_invoices["inv-ai-1"] = {
        "id": "inv-ai-1",
        "business_id": TEST_BUSINESS_ID,
        "customer_id": "cust-ai-1",
        "invoice_number": "INV-2026-001",
        "issue_date": "2026-09-01",
        "due_date": "2026-09-15",
        "subtotal": 30000.0,
        "tax_rate": 18.0,
        "tax_amount": 5400.0,
        "total_amount": 35400.0,
        "paid_amount": 0.0,
        "status": "overdue"
    }

    # Seed Proposal
    in_memory_proposals["prop-ai-1"] = {
        "id": "prop-ai-1",
        "business_id": TEST_BUSINESS_ID,
        "customer_id": "cust-ai-1",
        "title": "Mobile App UI Design Sprint",
        "total_value": 75000.0,
        "status": "sent",
        "deliverables": [
            {"title": "Wireframes & User Journey", "cost": 30000.0},
            {"title": "High-Fidelity Components", "cost": 45000.0}
        ]
    }


def test_supervisor_intent_routing():
    """Verify Supervisor routes queries to specialized agents based on deterministic semantics."""
    assert supervisor_instance.route_intent("Which leads haven't replied in 7 days?") == "SALES"
    assert supervisor_instance.route_intent("Show me my overdue invoices and unpaid bills") == "FINANCE"
    assert supervisor_instance.route_intent("Who owes me money?") == "FINANCE"
    assert supervisor_instance.route_intent("Create a proposal for Acme Interiors for ₹75,000") == "PROPOSAL"
    assert supervisor_instance.route_intent("Give me a summary of Acme Interiors and draft a response") == "CUSTOMER_SUPPORT"
    assert supervisor_instance.route_intent("What should I focus on today?") == "GENERAL_BUSINESS"


@pytest.mark.asyncio
async def test_sales_agent_query():
    """Verify Sales Agent analyzes pipeline and identifies inactive opportunities."""
    res = await supervisor_instance.execute_query(
        query="Which leads need follow-up?",
        business_id=TEST_BUSINESS_ID,
        user_id=TEST_USER_ID
    )

    assert res["agent"] == "sales"
    assert res["intent"] == "SALES"
    assert "Full Brand & Web Redesign" in res["message"] or "85,000" in res["message"] or "pipeline" in res["message"]
    assert len(res["action_cards"]) > 0
    assert res["action_cards"][0]["type"] == "lead_followup"


@pytest.mark.asyncio
async def test_finance_agent_query():
    """Verify Finance Agent identifies overdue amounts and delinquent invoices."""
    res = await supervisor_instance.execute_query(
        query="Who owes me money?",
        business_id=TEST_BUSINESS_ID,
        user_id=TEST_USER_ID
    )

    assert res["agent"] == "finance"
    assert res["intent"] == "FINANCE"
    assert "35,400" in res["message"] or "overdue" in res["message"].lower()
    assert len(res["action_cards"]) > 0


@pytest.mark.asyncio
async def test_proposal_agent_write_action_confirmation():
    """Verify Proposal Agent requires user confirmation for proposal creation."""
    res = await supervisor_instance.execute_query(
        query="Create a proposal for Acme Interiors for ₹75,000",
        business_id=TEST_BUSINESS_ID,
        user_id=TEST_USER_ID
    )

    assert res["agent"] == "proposal"
    assert res["requires_confirmation"] is True
    assert res["pending_action"] is not None
    assert res["pending_action"]["action_type"] == "CREATE_PROPOSAL"
    assert res["pending_action"]["payload"]["total_value"] == 75000.0


@pytest.mark.asyncio
async def test_action_execution_engine():
    """Verify confirmed action actually writes record to database."""
    payload = {
        "title": "SEO & Growth Engine",
        "customer_id": "cust-ai-1",
        "total_value": 45000.0,
        "deliverables": [{"title": "Keyword & Link Strategy", "cost": 45000.0}]
    }

    result = await execute_confirmed_action(
        action_type="CREATE_PROPOSAL",
        payload=payload,
        business_id=TEST_BUSINESS_ID,
        user_id=TEST_USER_ID
    )

    assert result["success"] is True
    assert result["resource_id"] in in_memory_proposals
    created = in_memory_proposals[result["resource_id"]]
    assert created["title"] == "SEO & Growth Engine"
    assert created["total_value"] == 45000.0


@pytest.mark.asyncio
async def test_proposal_to_invoice_conversion_action():
    """Verify converting proposal to invoice creates an invoice and marks proposal accepted."""
    result = await execute_confirmed_action(
        action_type="CONVERT_TO_INVOICE",
        payload={"proposal_id": "prop-ai-1"},
        business_id=TEST_BUSINESS_ID,
        user_id=TEST_USER_ID
    )

    assert result["success"] is True
    assert in_memory_proposals["prop-ai-1"]["status"] == "accepted"
    inv_id = result["resource_id"]
    assert inv_id in in_memory_invoices
    assert in_memory_invoices[inv_id]["total_amount"] == 75000.0


def test_api_ai_command_endpoint():
    """Verify /api/ai/command API endpoint returns structured agent responses."""
    response = client.post(
        "/api/ai/command",
        json={
            "business_id": TEST_BUSINESS_ID,
            "prompt": "What should I focus on today?"
        },
        headers=AUTH_HEADERS
    )
    assert response.status_code == 200
    data = response.json()
    assert "conversation_id" in data
    assert data["agent"] == "general_business"
    assert "message" in data
    assert "action_cards" in data


def test_api_ai_business_brief_endpoint():
    """Verify /api/ai/business-brief API endpoint returns real-time brief."""
    response = client.get(
        f"/api/ai/business-brief?business_id={TEST_BUSINESS_ID}",
        headers=AUTH_HEADERS
    )
    assert response.status_code == 200
    data = response.json()
    assert "inactive_leads_count" in data
    assert "overdue_amount" in data
