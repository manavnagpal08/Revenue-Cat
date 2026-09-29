from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
AUTH_HEADERS = {"Authorization": "Bearer test-token"}
BIZ_ID = "00000000-0000-0000-0000-000000000002"

# 1. CUSTOMERS TESTS
def test_customer_lifecycle():
    # Create customer
    create_payload = {
        "business_id": BIZ_ID,
        "name": "Arjun Patel",
        "company_name": "Patel Architects",
        "email": "arjun@patelarch.in",
        "phone": "+91 9911223344",
        "website": "https://patelarch.in",
        "status": "active"
    }
    res = client.post("/api/customers", json=create_payload, headers=AUTH_HEADERS)
    assert res.status_code == 201
    cust = res.json()
    assert cust["name"] == "Arjun Patel"
    cust_id = cust["id"]

    # List customers
    res = client.get(f"/api/customers?business_id={BIZ_ID}", headers=AUTH_HEADERS)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # Get customer detail
    res = client.get(f"/api/customers/{cust_id}?business_id={BIZ_ID}", headers=AUTH_HEADERS)
    assert res.status_code == 200
    detail = res.json()
    assert "leads" in detail
    assert "invoices" in detail

    # Update customer
    res = client.put(f"/api/customers/{cust_id}", json={"company_name": "Patel Global Architects"}, headers=AUTH_HEADERS)
    assert res.status_code == 200
    assert res.json()["company_name"] == "Patel Global Architects"

# 2. LEADS & CONVERSION TESTS
def test_lead_and_conversion():
    # Create lead
    lead_payload = {
        "business_id": BIZ_ID,
        "title": "Corporate HQ Interior Design",
        "company": "Kiran Tech Labs",
        "contact_name": "Kiran Deshmukh",
        "email": "kiran@kirantech.com",
        "phone": "+91 9877665544",
        "value": 150000.00,
        "source": "referral",
        "status": "qualified",
        "priority": "high",
        "probability": 70
    }
    res = client.post("/api/leads", json=lead_payload, headers=AUTH_HEADERS)
    assert res.status_code == 201
    lead = res.json()
    lead_id = lead["id"]
    assert lead["value"] == 150000.00

    # Add activity
    act_payload = {
        "activity_type": "call",
        "title": "Initial discovery call",
        "description": "Reviewed space requirements and timeline."
    }
    res = client.post(f"/api/leads/{lead_id}/activities?business_id={BIZ_ID}", json=act_payload, headers=AUTH_HEADERS)
    assert res.status_code == 201
    assert res.json()["activity_type"] == "call"

    # Convert Lead to Customer
    res = client.post(f"/api/leads/{lead_id}/convert", json={}, headers=AUTH_HEADERS)
    assert res.status_code == 200
    customer = res.json()
    assert customer["company_name"] == "Kiran Tech Labs"

# 3. INVOICES, TOTALS & PAYMENTS TESTS
def test_invoice_and_payment_flow():
    # Create invoice with line items
    inv_payload = {
        "business_id": BIZ_ID,
        "customer_id": "00000000-0000-0000-0000-000000000001",
        "due_date": "2026-10-25",
        "tax_rate": 18.0,
        "discount_amount": 0.0,
        "items": [
            {"description": "Frontend App Development", "quantity": 1.0, "unit_price": 50000.0, "total_price": 50000.0},
            {"description": "API Integration", "quantity": 1.0, "unit_price": 20000.0, "total_price": 20000.0}
        ]
    }
    res = client.post("/api/invoices", json=inv_payload, headers=AUTH_HEADERS)
    assert res.status_code == 201
    inv = res.json()
    # Math: Subtotal 70,000 + 18% Tax (12,600) = 82,600
    assert inv["subtotal"] == 70000.0
    assert inv["tax_amount"] == 12600.0
    assert inv["total_amount"] == 82600.0
    assert inv["remaining_balance"] == 82600.0
    inv_id = inv["id"]

    # Record partial payment of 30,000
    pmt_payload = {
        "business_id": BIZ_ID,
        "amount": 30000.0,
        "payment_method": "upi",
        "reference_number": "UPI-TXN-112233"
    }
    res = client.post(f"/api/invoices/{inv_id}/payments", json=pmt_payload, headers=AUTH_HEADERS)
    assert res.status_code == 201
    assert res.json()["amount"] == 30000.0

    # Verify invoice status is partially_paid
    res = client.get(f"/api/invoices/{inv_id}", headers=AUTH_HEADERS)
    assert res.status_code == 200

# 4. PROPOSALS & CONVERSION TO INVOICE
def test_proposal_and_conversion():
    prop_payload = {
        "business_id": BIZ_ID,
        "title": "Cloud Infrastructure Migration",
        "project_overview": "Migrate on-premise servers to Supabase and AWS",
        "total_value": 95000.0,
        "deliverables": [
            {"title": "Database Schema & Migration", "cost": 45000.0},
            {"title": "API Backend Deployment", "cost": 50000.0}
        ]
    }
    res = client.post("/api/proposals", json=prop_payload, headers=AUTH_HEADERS)
    assert res.status_code == 201
    prop = res.json()
    prop_id = prop["id"]
    assert prop["total_value"] == 95000.0

    # Accept proposal
    res = client.post(f"/api/proposals/{prop_id}/accept", headers=AUTH_HEADERS)
    assert res.status_code == 200

    # Convert proposal to invoice
    res = client.post(f"/api/proposals/{prop_id}/convert-to-invoice", headers=AUTH_HEADERS)
    assert res.status_code == 201
    inv = res.json()
    assert inv["total_amount"] == 95000.0

# 5. DASHBOARD METRICS TEST
def test_dashboard_metrics():
    res = client.get(f"/api/dashboard/metrics?business_id={BIZ_ID}", headers=AUTH_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert "revenue_this_month" in data
    assert "outstanding_amount" in data
    assert "pipeline_total_value" in data
    assert "active_leads_count" in data
