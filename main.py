from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import numpy as np
import joblib
import shap
import json
import os
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import Response
import time
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST

ml_model = {}

# ==============================================================================
# Prometheus Metrics Collectors
# ==============================================================================
PREDICTIONS_TOTAL = Counter(
    'credit_predictions_total',
    'Total count of credit risk predictions evaluated',
    ['decision']
)

DEFAULT_PROBABILITY_HIST = Histogram(
    'credit_default_probability',
    'Distribution of calibrated default probabilities',
    buckets=[0.02, 0.05, 0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 0.95, 1.0]
)

INFERENCE_LATENCY_SECONDS = Histogram(
    'credit_inference_duration_seconds',
    'Time spent computing credit risk prediction and adverse reasons',
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0]
)

PSI_FEATURE_GAUGE = Gauge(
    'credit_feature_psi_score',
    'Population Stability Index (PSI) drift score per feature',
    ['feature']
)

FAIRNESS_DIR_GAUGE = Gauge(
    'credit_four_fifths_dir',
    'ECOA Four-Fifths Disparate Impact Ratio per demographic group',
    ['cohort_type', 'group']
)

REASON_CODE_MAP = {
    'loan_percent_income': 'High debt-to-income / loan-to-income ratio',
    'loan_int_rate': 'High interest rate tier based on risk assessment',
    'cb_person_default_on_file': 'Derogatory credit record / prior default on file',
    'cb_person_cred_hist_length': 'Limited length of established credit history',
    'person_income': 'Insufficient verified gross annual income',
    'loan_grade': 'Low assigned credit risk grade tier',
    'person_emp_length': 'Short duration of current employment tenure',
    'person_age': 'Limited credit profile maturity',
    'person_home_ownership': 'Residential tenure / housing status risk',
    'loan_amnt': 'Requested loan amount exceeds current capacity',
    'loan_intent': 'Loan purpose / intent category'
}

INFERENCE_LOG_PATH = "data/production_inferences.jsonl"

def log_inference_request(data_dict: dict):
    """Appends inference request to production log for PSI drift monitoring."""
    try:
        os.makedirs("data", exist_ok=True)
        with open(INFERENCE_LOG_PATH, "a") as f:
            f.write(json.dumps(data_dict) + "\n")
    except Exception as e:
        print(f"[!] Warning: Could not log inference request: {e}")

def extract_adverse_action_reasons(input_df: pd.DataFrame, top_n: int = 3):
    """Uses SHAP TreeExplainer to extract top regulatory adverse action reason codes."""
    try:
        preprocessor = ml_model['preprocessor']
        explainer = ml_model['explainer']
        X_trans = preprocessor.transform(input_df)
        feature_names = preprocessor.get_feature_names_out()

        shap_vals = explainer.shap_values(X_trans)[0]

        # Aggregate positive SHAP values (risk push towards default) back to root feature names
        feature_impacts = {}
        for feat, val in zip(feature_names, shap_vals):
            root_feature = feat.replace('num__', '').replace('cat__', '')
            for key in REASON_CODE_MAP.keys():
                if key in feat:
                    root_feature = key
                    break
            feature_impacts[root_feature] = feature_impacts.get(root_feature, 0.0) + max(0.0, float(val))

        # Sort features with positive risk contributions
        sorted_reasons = sorted(feature_impacts.items(), key=lambda x: x[1], reverse=True)
        top_reasons = [REASON_CODE_MAP.get(feat, feat) for feat, impact in sorted_reasons[:top_n] if impact > 0]
        
        if not top_reasons:
            top_reasons = ["Elevated risk metrics across applicant profile"]
        return top_reasons
    except Exception as e:
        print(f"[!] SHAP extraction warning: {e}")
        return ["Elevated debt-to-income ratio", "Risk grade tier evaluation"]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model and threshold
    ml_model['model']     = joblib.load('credit_risk_model.pkl')
    ml_model['threshold'] = float(joblib.load('best_threshold.pkl'))

    # Extract base pipeline components for high-speed SHAP TreeExplainer
    base_pipeline = ml_model['model'].calibrated_classifiers_[0].estimator
    ml_model['preprocessor'] = base_pipeline.named_steps['preprocessor']
    ml_model['xgb']          = base_pipeline.named_steps['classifier']
    ml_model['explainer']    = shap.TreeExplainer(ml_model['xgb'])

    yield

    ml_model.clear()

app = FastAPI(lifespan=lifespan)

# Allow CORS for external API integrations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoanApplication(BaseModel):
    person_age                  : int
    person_income               : float
    person_home_ownership       : str
    person_emp_length           : float
    loan_intent                 : str
    loan_grade                  : str
    loan_amnt                   : float
    loan_int_rate               : float
    loan_percent_income         : float
    cb_person_default_on_file   : str
    cb_person_cred_hist_length  : int

@app.post('/predict')
def predict(data: LoanApplication):
    start_time = time.time()
    input_dict   = data.dict()
    input_df     = pd.DataFrame([input_dict])
    probability  = float(ml_model['model'].predict_proba(input_df)[:, 1][0])
    
    # High risk condition: exceeds calibrated threshold or default probability >= 0.50
    is_high_risk = bool(probability >= ml_model["threshold"] or probability >= 0.50)
    prediction   = int(1 if is_high_risk else 0)

    # Extract SHAP adverse action codes if high risk
    adverse_reasons = extract_adverse_action_reasons(input_df, top_n=3) if is_high_risk else []

    # Log incoming request asynchronously for PSI data drift monitoring
    log_inference_request(input_dict)

    # Prometheus Metric Observations
    decision_tag = "High_Risk" if is_high_risk else "Approved"
    PREDICTIONS_TOTAL.labels(decision=decision_tag).inc()
    DEFAULT_PROBABILITY_HIST.observe(probability)
    INFERENCE_LATENCY_SECONDS.observe(time.time() - start_time)

    return {
        "default_probability"       : probability,
        "default_prediction"        : prediction,
        "threshold"                 : ml_model["threshold"],
        "Result"                    : "High Risk" if is_high_risk else "Low Risk",
        "adverse_action_reasons"    : adverse_reasons
    }

@app.post('/recourse')
def recourse(data: LoanApplication):
    """
    Algorithmic Recourse Simulator:
    Finds the maximum loan amount that flips a High Risk application to Approved.
    """
    input_dict  = data.dict()
    input_df    = pd.DataFrame([input_dict])
    orig_prob   = float(ml_model['model'].predict_proba(input_df)[:, 1][0])
    orig_amount = input_dict['loan_amnt']
    income      = input_dict['person_income']

    # If already low risk, no reduction needed
    if orig_prob < 0.50 and orig_prob < ml_model['threshold']:
        return {
            "recourse_available": False,
            "status": "Already Approved",
            "message": "Application already qualifies for standard approval."
        }

    # Binary search for maximum approved loan amount
    low = 500.0
    high = orig_amount
    best_approved_amount = None
    best_prob = orig_prob

    for _ in range(12):
        mid = round((low + high) / 2.0, -2)  # Round to nearest $100
        candidate_dict = input_dict.copy()
        candidate_dict['loan_amnt'] = mid
        candidate_dict['loan_percent_income'] = round(mid / income, 2)

        prob = float(ml_model['model'].predict_proba(pd.DataFrame([candidate_dict]))[:, 1][0])
        if prob < 0.50 and prob < ml_model['threshold']:
            best_approved_amount = mid
            best_prob = prob
            low = mid + 100.0  # Search for larger approved amount
        else:
            high = mid - 100.0

    if best_approved_amount:
        new_ratio = round(best_approved_amount / income, 2)
        return {
            "recourse_available": True,
            "original_amount": orig_amount,
            "recommended_amount": best_approved_amount,
            "reduced_by": orig_amount - best_approved_amount,
            "new_probability": float(best_prob),
            "new_loan_percent_income": new_ratio,
            "recommendation": f"Reducing requested loan from ${orig_amount:,.0f} to ${best_approved_amount:,.0f} (lowering debt-to-income to {int(new_ratio*100)}%) flips the decision to Approved!"
        }
    else:
        return {
            "recourse_available": False,
            "original_amount": orig_amount,
            "recommended_amount": None,
            "reduced_by": 0,
            "new_probability": orig_prob,
            "recommendation": "Loan amount reduction alone is insufficient due to historical risk factors. Adding a qualified co-signer is recommended."
        }

@app.get('/metrics/psi')
def get_psi_metrics():
    """Runs or returns the live Population Stability Index check."""
    try:
        from monitor_psi import evaluate_psi
        return evaluate_psi()
    except Exception as e:
        return {"error": f"Failed to compute PSI: {str(e)}"}

@app.get('/metrics/fairness')
def get_fairness_metrics():
    """Returns the latest fairness and disparate impact audit report."""
    report_file = "fairness_audit_report.json"
    if os.path.exists(report_file):
        with open(report_file, "r") as f:
            return json.load(f)
    try:
        from audit_fairness import run_fairness_audit
        return run_fairness_audit()
    except Exception as e:
        return {"error": f"Failed to load fairness audit: {str(e)}"}

@app.get('/metrics')
def prometheus_metrics():
    """Exposes Prometheus exposition format metrics for scraping."""
    try:
        if os.path.exists("psi_drift_report.json"):
            with open("psi_drift_report.json", "r") as f:
                psi_data = json.load(f)
                for feat, info in psi_data.get("features", {}).items():
                    PSI_FEATURE_GAUGE.labels(feature=feat).set(float(info.get("psi", 0.0)))
        if os.path.exists("fairness_audit_report.json"):
            with open("fairness_audit_report.json", "r") as f:
                fair_data = json.load(f)
                for grp, info in fair_data.get("age_cohort_audit", {}).items():
                    FAIRNESS_DIR_GAUGE.labels(cohort_type="age", group=grp).set(float(info.get("disparate_impact_ratio", 0.0)))
                for grp, info in fair_data.get("housing_cohort_audit", {}).items():
                    FAIRNESS_DIR_GAUGE.labels(cohort_type="housing", group=grp).set(float(info.get("disparate_impact_ratio", 0.0)))
    except Exception as e:
        print(f"[!] Warning updating prometheus gauges: {e}")

    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

# Mount frontend static directory
app.mount("/", StaticFiles(directory="static", html=True), name="static")