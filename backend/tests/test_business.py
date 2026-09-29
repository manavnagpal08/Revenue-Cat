from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_my_businesses():
    headers = {"Authorization": "Bearer test-token"}
    response = client.get("/api/business/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "name" in data[0]
    assert "currency" in data[0]

def test_create_business():
    headers = {"Authorization": "Bearer test-token"}
    payload = {
        "name": "Zenith Ventures",
        "industry": "Consulting",
        "currency": "INR",
        "currency_symbol": "₹",
        "phone": "+91 9988776655",
        "website": "https://zenithventures.io"
    }
    response = client.post("/api/business", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Zenith Ventures"
    assert data["role"] == "owner"

def test_profile_me():
    headers = {"Authorization": "Bearer test-token"}
    response = client.get("/api/profile/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "email" in data
    assert "full_name" in data

def test_update_profile():
    headers = {"Authorization": "Bearer test-token"}
    response = client.put("/api/profile/me", json={"full_name": "Alex R. Founder"}, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Alex R. Founder"
