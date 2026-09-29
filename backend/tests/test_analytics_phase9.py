import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.models.schemas import ReportGenerateRequest

client = TestClient(app)
AUTH_HEADERS = {"Authorization": "Bearer test-token"}
BIZ_A = "00000000-0000-0000-0000-000000000077"
BIZ_B = "00000000-0000-0000-0000-000000000099"

# 1. Analytics Overview
def test_analytics_overview_7d():
    res = client.get(f"/api/analytics/overview?business_id={BIZ_A}&time_frame=7d", headers=AUTH_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert data["time_frame"] == "7d"
    assert "total_revenue" in data
    assert "total_leads" in data
    assert "total_customers" in data
    assert "revenue_trend" in data
    assert isinstance(data["revenue_trend"], list)

def test_analytics_overview_30d():
    res = client.get(f"/api/analytics/overview?business_id={BIZ_A}&time_frame=30d", headers=AUTH_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert data["time_frame"] == "30d"
    assert data["collected_revenue"] >= 0
    assert len(data["top_insights"]) > 0

# 2. Revenue Analytics
def test_revenue_analytics():
    res = client.get(f"/api/analytics/revenue?business_id={BIZ_A}&time_frame=30d", headers=AUTH_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert "total_invoiced" in data
    assert "total_collected" in data
    assert "total_outstanding" in data
    assert "collection_rate_percent" in data
    assert "revenue_by_source" in data
    assert isinstance(data["revenue_by_source"], list)
    assert "top_paying_customers" in data

# 3. Sales Analytics
def test_sales_analytics():
    res = client.get(f"/api/analytics/sales?business_id={BIZ_A}&time_frame=30d", headers=AUTH_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert "total_leads" in data
    assert "won_leads" in data
    assert "win_rate_percent" in data
    assert "funnel_stages" in data
    assert len(data["funnel_stages"]) >= 4
    assert "proposals_summary" in data

# 4. Customer Analytics & Segmentation
def test_customer_analytics():
    res = client.get(f"/api/analytics/customers?business_id={BIZ_A}&time_frame=30d", headers=AUTH_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert "total_customers" in data
    assert "segments" in data
    segments = data["segments"]
    assert "high_value" in segments
    assert "active" in segments
    assert "at_risk" in segments
    assert "growth_trend" in data
    assert "top_customers" in data

# 5. Finance Analytics
def test_finance_analytics():
    res = client.get(f"/api/analytics/finance?business_id={BIZ_A}&time_frame=30d", headers=AUTH_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert "total_invoices" in data
    assert "paid_invoices_count" in data
    assert "overdue_aging" in data
    assert "1_15_days" in data["overdue_aging"]
    assert "status_distribution" in data

# 6. AI Usage Analytics
def test_ai_usage_analytics():
    res = client.get(f"/api/analytics/ai-usage?business_id={BIZ_A}&time_frame=30d", headers=AUTH_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert "credits_total" in data
    assert "credits_used" in data
    assert "credits_remaining" in data
    assert "credits_used_by_agent" in data
    assert "daily_usage_trend" in data

# 7. Automation Analytics
def test_automation_analytics():
    res = client.get(f"/api/analytics/automations?business_id={BIZ_A}&time_frame=30d", headers=AUTH_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert "total_executions" in data
    assert "success_rate_percent" in data
    assert "time_saved_hours_estimated" in data
    assert "workflow_performance" in data

# 8. AI Business Insights
def test_business_insights():
    res = client.get(f"/api/analytics/insights?business_id={BIZ_A}&time_frame=30d", headers=AUTH_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert "insights" in data
    assert "summary_counts" in data
    assert len(data["insights"]) > 0

    # Category filter
    res_fin = client.get(f"/api/analytics/insights?business_id={BIZ_A}&category=finance", headers=AUTH_HEADERS)
    assert res_fin.status_code == 200
    data_fin = res_fin.json()
    for item in data_fin["insights"]:
        assert item["category"] == "finance"

# 9. Report Generation & Exports
def test_report_generation_and_export():
    payload = {
        "business_id": BIZ_A,
        "report_type": "executive_summary",
        "time_frame": "30d",
        "title": "Test Executive Q3 Summary"
    }
    # 9a. Generate
    res = client.post("/api/reports/generate", json=payload, headers=AUTH_HEADERS)
    assert res.status_code == 201
    report = res.json()
    report_id = report["id"]
    assert report["title"] == "Test Executive Q3 Summary"
    assert len(report["sections"]) >= 4
    assert "structured_data" in report

    # 9b. List
    list_res = client.get(f"/api/reports?business_id={BIZ_A}", headers=AUTH_HEADERS)
    assert list_res.status_code == 200
    rep_list = list_res.json()
    assert any(r["id"] == report_id for r in rep_list)

    # 9c. Get Detail
    get_res = client.get(f"/api/reports/{report_id}?business_id={BIZ_A}", headers=AUTH_HEADERS)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == report_id

    # 9d. Export JSON
    exp_json = client.get(f"/api/reports/{report_id}/export?business_id={BIZ_A}&format=json", headers=AUTH_HEADERS)
    assert exp_json.status_code == 200
    assert exp_json.json()["format"] == "json"

    # 9e. Export CSV
    exp_csv = client.get(f"/api/reports/{report_id}/export?business_id={BIZ_A}&format=csv", headers=AUTH_HEADERS)
    assert exp_csv.status_code == 200
    assert exp_csv.json()["format"] == "csv"
    assert "Section,Metric,Value" in exp_csv.json()["content"]

    # 9f. Export Markdown
    exp_md = client.get(f"/api/reports/{report_id}/export?business_id={BIZ_A}&format=markdown", headers=AUTH_HEADERS)
    assert exp_md.status_code == 200
    assert exp_md.json()["format"] == "markdown"
    assert "# Test Executive Q3 Summary" in exp_md.json()["content"]

# 10. AI Supervisor Analytics Query
def test_supervisor_analytics_query():
    query_payload = {
        "prompt": "Give me an executive analytics report and business overview for this month",
        "business_id": BIZ_A
    }
    res = client.post("/api/ai/command", json=query_payload, headers=AUTH_HEADERS)
    assert res.status_code == 200
    resp_data = res.json()
    assert "Collected Revenue" in resp_data["message"] or "Business Intelligence" in resp_data["message"]
    assert len(resp_data["action_cards"]) > 0

