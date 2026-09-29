import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)
AUTH_HEADERS = {"Authorization": "Bearer test-token"}
BIZ_ID = "00000000-0000-0000-0000-000000000002"

def test_list_integrations():
    """Verify that all registered integration providers are listed with honest disconnected / configuration status."""
    res = client.get(f"/api/integrations?business_id={BIZ_ID}", headers=AUTH_HEADERS)
    assert res.status_code == 200
    providers = res.json()
    assert isinstance(providers, list)
    assert len(providers) >= 4

    provider_ids = [p["provider"] for p in providers]
    assert "gmail" in provider_ids
    assert "google_calendar" in provider_ids
    assert "whatsapp" in provider_ids
    assert "website_leads" in provider_ids

    for p in providers:
        assert "status" in p
        assert p["status"] in ["connected", "disconnected", "configuration_required", "error"]


def test_get_individual_integration_status():
    """Verify detailed status retrieval for specific providers."""
    for provider in ["gmail", "google_calendar", "whatsapp", "website_leads"]:
        res = client.get(f"/api/integrations/{provider}/status?business_id={BIZ_ID}", headers=AUTH_HEADERS)
        assert res.status_code == 200
        data = res.json()
        assert data["provider"] == provider
        assert "status" in data
        assert data["status"] in ["connected", "disconnected", "configuration_required", "error"]


def test_website_lead_webhook_ingestion():
    """Verify inbound website lead ingestion creates real records."""
    webhook_payload = {
        "name": "Vikram Sethi",
        "email": "vikram.sethi@example.com",
        "phone": "+91 9876543210",
        "company": "Sethi Enterprises",
        "project_type": "Retail Brand Expansion",
        "budget": 250000.0,
        "message": "We need a complete turnkey project management solution for 3 new stores in Mumbai.",
        "utm_source": "google_ads",
        "utm_campaign": "q4_expansion"
    }

    # Test with valid secret or no secret when unset
    headers = {}
    if settings.WEBHOOK_SIGNING_SECRET:
        headers["X-SoloCEO-Secret"] = settings.WEBHOOK_SIGNING_SECRET

    res = client.post(
        f"/api/integrations/webhooks/leads/{BIZ_ID}",
        json=webhook_payload,
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "lead_id" in data
    assert "customer_id" in data
    assert data["lead_id"] is not None


def test_website_lead_webhook_invalid_secret():
    """Verify rejected webhook when incorrect secret is provided."""
    webhook_payload = {
        "name": "Spam Lead",
        "email": "spam@example.com"
    }
    res = client.post(
        f"/api/integrations/webhooks/leads/{BIZ_ID}",
        json=webhook_payload,
        headers={"X-SoloCEO-Secret": "invalid_wrong_secret_12345"}
    )
    assert res.status_code == 401


def test_whatsapp_webhook_verification_handshake():
    """Verify Meta WhatsApp Webhook challenge-response handshake."""
    verify_token = settings.WHATSAPP_VERIFY_TOKEN
    challenge = "random_challenge_string_987654"

    res = client.get(
        f"/api/integrations/whatsapp/webhook?hub.mode=subscribe&hub.verify_token={verify_token}&hub.challenge={challenge}"
    )
    assert res.status_code == 200
    assert res.text == challenge


def test_whatsapp_webhook_invalid_handshake():
    """Verify failed verification when token does not match."""
    res = client.get(
        "/api/integrations/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=123"
    )
    assert res.status_code == 403


def test_sync_and_disconnect_integration():
    """Test manual sync and disconnect flows."""
    sync_res = client.post(f"/api/integrations/website_leads/sync?business_id={BIZ_ID}", headers=AUTH_HEADERS)
    assert sync_res.status_code == 200
    sync_data = sync_res.json()
    assert sync_data["provider"] == "website_leads"
    assert "status" in sync_data

    disconnect_res = client.post(f"/api/integrations/gmail/disconnect?business_id={BIZ_ID}", headers=AUTH_HEADERS)
    assert disconnect_res.status_code == 200
    disconnect_data = disconnect_res.json()
    assert disconnect_data["provider"] == "gmail"
    assert disconnect_data["status"] == "disconnected"


def test_ai_supervisor_integration_routing():
    """Verify that AI Command Center routes external integration requests to IntegrationAgent."""
    res = client.post(
        "/api/ai/command",
        json={
            "business_id": BIZ_ID,
            "prompt": "Check my unread emails from clients and summarize them."
        },
        headers=AUTH_HEADERS
    )
    assert res.status_code == 200
    data = res.json()
    assert data["agent"] == "integrations"
    assert "message" in data
