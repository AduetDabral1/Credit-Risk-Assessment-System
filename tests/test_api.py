import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client

def test_home_page_renders(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "Credit Risk Assessment System" in response.text

def test_report_page_renders(client):
    response = client.get("/report.html")
    assert response.status_code == 200
    assert "speedometer-svg" in response.text or "riskMeterGradient" in response.text
    assert "btn-download-pdf" in response.text

def test_predict_low_risk(client):
    payload = {
        "person_age": 35,
        "person_income": 95000,
        "person_home_ownership": "MORTGAGE",
        "person_emp_length": 8.0,
        "loan_intent": "PERSONAL",
        "loan_grade": "A",
        "loan_amnt": 5000,
        "loan_int_rate": 7.5,
        "loan_percent_income": 0.05,
        "cb_person_default_on_file": "N",
        "cb_person_cred_hist_length": 10
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "default_probability" in data
    assert data["default_prediction"] == 0
    assert data["Result"] == "Low Risk"

def test_predict_high_risk_and_adverse_action(client):
    payload = {
        "person_age": 22,
        "person_income": 18000,
        "person_home_ownership": "RENT",
        "person_emp_length": 1.0,
        "loan_intent": "DEBTCONSOLIDATION",
        "loan_grade": "D",
        "loan_amnt": 16000,
        "loan_int_rate": 18.5,
        "loan_percent_income": 0.89,
        "cb_person_default_on_file": "Y",
        "cb_person_cred_hist_length": 2
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["default_prediction"] == 1
    assert data["Result"] == "High Risk"
    assert len(data.get("adverse_action_reasons", [])) >= 2

def test_recourse_counterfactual(client):
    payload = {
        "person_age": 28,
        "person_income": 45000,
        "person_home_ownership": "RENT",
        "person_emp_length": 4.0,
        "loan_intent": "PERSONAL",
        "loan_grade": "C",
        "loan_amnt": 28000,
        "loan_int_rate": 13.5,
        "loan_percent_income": 0.62,
        "cb_person_default_on_file": "N",
        "cb_person_cred_hist_length": 5
    }
    response = client.post("/recourse", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "recourse_available" in data
    assert "recommendation" in data

def test_prometheus_metrics_endpoint(client):
    response = client.get("/metrics")
    assert response.status_code == 200
    text = response.text
    assert "credit_predictions_total" in text
    assert "credit_default_probability" in text
    assert "credit_inference_duration_seconds" in text
    assert "credit_feature_psi_score" in text
    assert "credit_four_fifths_dir" in text

def test_governance_psi_and_fairness_endpoints(client):
    psi_resp = client.get("/metrics/psi")
    assert psi_resp.status_code == 200
    assert "features" in psi_resp.json()

    fair_resp = client.get("/metrics/fairness")
    assert fair_resp.status_code == 200
    assert "age_cohort_audit" in fair_resp.json()
