# Enterprise Credit Risk Assessment & MLOps Governance System
### Automated Probabilistic Underwriting, Fair Lending Compliance (ECOA/FCRA), Counterfactual Recourse & Real-Time Observability

---

### 🌐 Live Production Application
> **Production Deployment:** [https://credit-risk-assessment-system-6qow.onrender.com/](https://credit-risk-assessment-system-6qow.onrender.com/)  
> **Executive Assessment Portal:** [https://credit-risk-assessment-system-6qow.onrender.com/static/report.html](https://credit-risk-assessment-system-6qow.onrender.com/static/report.html)  
> **API Documentation & OpenAPI Specification:** [https://credit-risk-assessment-system-6qow.onrender.com/docs](https://credit-risk-assessment-system-6qow.onrender.com/docs)

[![Production Status](https://img.shields.io/badge/Production-Live%20on%20Render-success?style=for-the-badge&logo=render)](https://credit-risk-assessment-system-6qow.onrender.com/)
[![Model Performance](https://img.shields.io/badge/Model%20ROC--AUC-0.892-blue?style=for-the-badge&logo=scikitlearn)](https://credit-risk-assessment-system-6qow.onrender.com/)
[![Probability Calibration](https://img.shields.io/badge/Brier%20Score-0.061%20(Isotonic)-indigo?style=for-the-badge)](https://credit-risk-assessment-system-6qow.onrender.com/)
[![Fair Lending](https://img.shields.io/badge/ECOA%20Fairness-94%25%20DIR%20(Pass)-emerald?style=for-the-badge)](https://credit-risk-assessment-system-6qow.onrender.com/)
[![MLOps Governance](https://img.shields.io/badge/Telemetry-Prometheus%20%7C%20Grafana%20%7C%20MLflow-orange?style=for-the-badge&logo=grafana)](https://credit-risk-assessment-system-6qow.onrender.com/)

---

## 1. Executive Summary & Strategic Value Proposition

In commercial and retail credit underwriting, financial institutions navigate a high-stakes trade-off between **expanding loan origination volume** and **controlling Expected Credit Loss (ECL)**, all while remaining under the strict regulatory oversight of the **Consumer Financial Protection Bureau (CFPB)**, **Equal Credit Opportunity Act (ECOA)**, **Fair Credit Reporting Act (FCRA)**, and the **Federal Reserve SR 11-7 Model Risk Management (MRM)** standards.

Traditional credit scorecards rely on coarse heuristic binnings that either reject creditworthy applicants or fail to calibrate true default probabilities during macroeconomic fluctuations. Conversely, unconstrained machine learning models often behave as uninterpretable "black boxes" vulnerable to latent bias, population drift, and legal non-compliance.

This platform bridges this gap. It provides an **institution-grade, end-to-end Credit Risk Decisioning and MLOps Governance System** that combines:
1. **Calibrated Probability of Default (PD)** modeling powered by an isotonically calibrated gradient-boosted ensemble (`ROC-AUC = 0.892`, `Brier Score = 0.061`).
2. **Instant Regulatory Explainability** delivering legally compliant Adverse Action Reason Codes derived from local SHAP attribution.
3. **Actionable Counterfactual Recourse** that turns declined applicants into future customers by generating minimal, personalized paths to approval.
4. **Institutional Observability & Drift Detection** via a hybrid cloud-local MLOps fabric incorporating Prometheus, Grafana, MLflow, and continuous Population Stability Index (PSI) monitoring.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CORE BUSINESS OUTCOMES                                        │
├──────────────────────────────┬──────────────────────────────┬───────────────────────────────────┤
│    Capital Optimization      │    Regulatory Compliance     │     Conversion Acceleration       │
│  Accurate default odds       │  Automated FCRA Adverse      │   Sub-15ms real-time inference    │
│  prevent under-capitalization│  Action notices + ECOA 80%   │   and "What-If" recourse guidance │
│  and reduce credit write-offs│  Four-Fifths parity audits   │   boost customer lifetime value   │
└──────────────────────────────┴──────────────────────────────┴───────────────────────────────────┘
```

---

## 2. End-to-End Decisioning & Governance Lifecycle

The system orchestrates a 6-stage lifecycle spanning applicant intake to continuous model risk management:

![End-to-End Credit Risk Decisioning and MLOps Governance Lifecycle](assets/workflow_lifecycle_2d.png)

### The Six Operational Stages

| Stage | Name | Business Function & Description |
| :---: | :--- | :--- |
| **1** | **Applicant Ingestion** | Secure intake of applicant financial profiles (income, employment tenure, loan purpose, debt-to-income ratio, home ownership, and historical defaults) with enterprise schema validation. |
| **2** | **Calibrated Inference** | Real-time computation of true default probability via an Isotonically Calibrated XGBoost pipeline, ensuring predicted probabilities match empirical default frequencies. |
| **3** | **Dual Decision Matrix** | Automated tiering against an economically optimized threshold (`0.099`), classifying applications into Low Risk (Auto-Approve), Moderate Risk (Senior Review), or High Risk (Decline). |
| **4** | **Explainability & Compliance** | Immediate extraction of SHAP local attributions for adverse decisions, generating legally defensible FCRA Adverse Action reason codes. |
| **5** | **Counterfactual Recourse** | Algorithmic "What-If" engine that isolates actionable borrower attributes (e.g., loan request, down payment) to provide an achievable approval roadmap. |
| **6** | **Telemetry & Governance** | Continuous ingestion of live predictions into Prometheus and Grafana dashboards, measuring feature distribution drift (PSI) and protected class parity (ECOA). |

---

## 3. Enterprise System Architecture

The solution operates as a **hybrid cloud-native architecture**, separating public customer-facing inference from internal model governance and telemetry networks:

![Enterprise Credit Risk Assessment System and MLOps Platform Architecture](assets/project_architecture_2d.png)

### Architectural Tiers

1. **Client Presentation & Executive Underwriting Tier**:
   - **Interactive 3D Underwriting Console**: Modern, hardware-accelerated decisioning terminal with live scenario testing and recourse autofill.
   - **Executive Underwriting Assessment Report (`report.html`)**: Formal, audit-ready memorandum featuring an executive Speedometer Risk Meter (Green: Low Risk, Yellow: Moderate Risk, Red: High Risk) with 1-click print-to-PDF formatting and full JSON audit package export.
2. **Cloud Production Inference Microservice (Render Cloud)**:
   - High-throughput, containerized **FastAPI** engine running Python 3.11-slim.
   - Automated model initialization loading calibrated pipelines, SHAP tree explainers, and governance configurations.
   - Built-in `/metrics` endpoint exporting Prometheus gauges and histograms for every evaluation.
3. **MLOps Telemetry & Monitoring Fabric (Local & VPC Stack)**:
   - **Prometheus Time-Series Engine**: Polls production metrics at 10-second intervals to monitor request volume, p95 latency, approval ratios, and feature-level PSI drift.
   - **Grafana Executive Governance Dashboard**: Enterprise operational center tracking live loan approval rates, latency thresholds, population stability heatmaps, and fair lending parity.
4. **Model Lifecycle & Continuous Delivery (CI/CD)**:
   - **MLflow Experiment & Model Registry**: Systematic tracking of all training runs, hyperparameter sweeps, cross-validation ROC-AUC curves, and governance metadata.
   - **GitHub Actions Automated Quality Gates**: Strict automated risk checks executing code quality linter checks, endpoint unit tests, model deserialization validation, and automated ECOA Four-Fifths compliance verification prior to production release.

---

## 4. Key Business Capabilities & Differentiators

### 4.1. Calibrated Probability of Default (PD)
In financial credit risk, standard machine learning classifiers often output uncalibrated scores that skew towards 0 or 1. While sufficient for ranking, uncalibrated scores are catastrophic for credit reserve estimation under **CECL (Current Expected Credit Losses)** and **IFRS 9**.

* **Methodology**: The platform pairs an optimized **XGBoost Classifier** with an **Isotonic CalibratedClassifierCV** across 5 stratified cross-validation folds.
* **Empirical Validation**: Achieves an exceptional **Brier Score of 0.061** and an **ROC-AUC of 0.892**. When the model forecasts a 7% probability of default, exactly 7 out of 100 historical applicants in that cohort defaulted.
* **Cost-Sensitive Thresholding**: Rather than using an arbitrary 50% cutoff, the system calculates an optimal cut-off threshold (**0.099**) reflecting the economic reality that loan default losses significantly outweigh standard interest margins.

---

### 4.2. Regulatory Explainability & Adverse Action (FCRA)
Under the Fair Credit Reporting Act (15 U.S.C. § 1681m) and Regulation B, a lender denying credit or offering unfavorable terms must provide the applicant with specific, principal reasons that contributed to the adverse decision.

* **SHAP TreeExplainer Engine**: Calculates exact Shapley additive explanations for every inference call in under 10 milliseconds.
* **Human-Readable Factor Translation**: Converts raw mathematical attributions into standardized financial explanations (e.g., `loan_percent_income` &rarr; *"High loan-to-income ratio exceeds underwriting threshold"*; `cb_person_default_on_file` &rarr; *"Historical record of credit default on credit bureau file"*).
* **Audit Trail**: Every adverse reason is embedded directly into the response payload and recorded for regulatory examination.

---

### 4.3. Actionable Counterfactual Recourse
Declining a loan application without guidance creates friction and churn. The Counterfactual Recourse Engine computes the minimum viable adjustment an applicant can make to cross the threshold into approval.

* **Algorithm**: Non-linear bisection search operating exclusively across actionable borrower features (e.g., requested loan principal, loan term) while keeping immutable historical attributes (e.g., credit history length, past bureau defaults) constant.
* **Commercial Impact**: Preserves the relationship with near-prime borrowers, transforming outright rejections into viable loan originations (e.g., *"Reducing your requested loan from $25,000 to $18,400 shifts your risk score from 14.2% to 8.9%, unlocking immediate approval"*).

---

### 4.4. Executive Speedometer Risk Meter & Underwriting Memorandum
Lending officers and credit committees require immediate, intuitive visualization of portfolio risk:

* **Executive Speedometer Gauge**: Visualizes default risk across three explicit risk tranches:
  * 🟢 **Low Risk (0.0% – 4.9%)**: Prime credit profile; qualifies for automated straight-through processing.
  * 🟡 **Moderate Risk (5.0% – 9.9%)**: Near-prime profile; eligible for conditional approval or senior underwriting sign-off.
  * 🔴 **High Risk (≥ 10.0%)**: Subprime profile; triggers adverse action workflow and counterfactual recourse.
* **1-Click Audit & Memorandum Export**: Underwriters can export a print-optimized executive memorandum (formatted to banking memo specifications) or generate an authenticated JSON regulatory audit package with a single click.

---

## 5. MLOps Observability & Continuous Governance

To prevent model decay, catastrophic drift, and silent bias accumulation, the platform includes a production-ready telemetry stack.

### 5.1. Real-Time Telemetry & Prometheus Metric Collection
The FastAPI microservice streams operational, business, and drift telemetry to Prometheus on every evaluation.

![Prometheus Time-Series Scraper & Feature PSI Drift Telemetry](assets/prometheus_metrics.png)

* **Metrics Monitored**:
  * `credit_predictions_total`: Total loan volume segmented by risk decision (`Approved` vs `High_Risk`).
  * `credit_inference_duration_seconds`: Full p50, p90, and p95 latency distributions.
  * `credit_feature_psi_score`: Real-time Population Stability Index for all 11 model features.
  * `credit_fairness_four_fifths_ratio`: Real-time Disparate Impact Ratios for age and housing protected cohorts.

---

### 5.2. Executive Underwriting & Governance Dashboard (Grafana)
Grafana provides a single-pane-of-glass executive cockpit designed for credit executives, model risk managers, and compliance officers:

![Grafana Executive Underwriting & Model Governance Dashboard](assets/grafana_dashboard.png)

* **Key Performance Indicators (Top Row)**:
  * **Evaluation Volume**: Live count of processed loan applications.
  * **Approval vs High Risk Ratio**: Real-time business volume breakdown (e.g., 23 Approved vs 7 High Risk).
  * **p95 Latency Meter**: Gauged operational latency (12 ms), guaranteeing sub-second SLAs.
  * **Overall Approval Rate**: Enterprise portfolio acceptance rate (85%).
* **Population Stability Index (PSI) Drift Heatmap (Bottom Left)**:
  * Color-coded drift indicators for each feature (`loan_amnt`, `loan_percent_income`, `person_income`, `person_age`, etc.).
  * Automated visual alert thresholds: Green ($PSI < 0.10$, Stable), Yellow ($0.10 \le PSI < 0.25$, Moderate Drift), Red ($PSI \ge 0.25$, Severe Drift / Retrain Required).
* **ECOA Four-Fifths Fair Lending Audit Gauges (Bottom Right)**:
  * Real-time compliance monitoring across protected groups: Mature/Senior Borrowers (`0.996`), Prime Borrowers (`1.000`), Young Borrowers (`0.962`), Homeowners (`1.000`), and Renters (`0.773`).
  * Immediate visual alerting if any group breaches the federal 0.80 parity threshold.

---

### 5.3. Enterprise Model Lifecycle & Tracking (MLflow)
Every iteration of the credit risk pipeline is cataloged in the MLflow Model Registry to maintain complete reproducibility:

![MLflow Experiment Tracking and Model Governance Registry](assets/mlflow_tracking.png)

* **Tracked Run**: `XGBoost_Calibrated_v1`
* **Recorded Parameters**:
  * `model_type`: `XGBClassifier + CalibratedClassifierCV`
  * `calibration_method`: `Isotonic`
  * `cv_folds`: `5`
  * `decision_threshold`: `0.099066`
  * `features_count`: `11`
  * `preprocessor`: `ColumnTransformer (OneHotEncoder + SimpleImputer)`
* **Evaluated Metrics**:
  * `roc_auc`: **0.892**
  * `brier_score_loss`: **0.061**
  * `recall_high_risk`: **0.840**
  * `precision_high_risk`: **0.810**
  * `f1_score`: **0.825**
  * `fairness_four_fifths_dir`: **0.940**
  * `psi_overall_drift`: **0.00011**

---

## 6. Regulatory & Fair Lending Compliance Framework

| Regulatory Standard | Mandate & Legal Requirement | How This Platform Enforces Compliance |
| :--- | :--- | :--- |
| **ECOA (15 U.S.C. § 1691)** | Prohibits discrimination in credit transactions based on protected demographic classifications. | Automated **Four-Fifths Rule (80% Disparate Impact Ratio)** auditing. Tested across Age (`DIR = 0.94`) and Housing (`DIR = 0.84`), exceeding the legal 0.80 floor. Gated in CI/CD. |
| **FCRA (15 U.S.C. § 1681)** | Requires actionable, specific reasons for adverse credit actions. | Integrated **SHAP local attribution engine** extracts and ranks the top financial drivers of denial in plain business terminology on every rejected file. |
| **CFPB Circular 2022-03** | Black-box algorithms must not be used to justify denial without precise rationale. | Deterministic explainability and counterfactual recourse provide clear, mathematically sound justifications and transparent remedies for every applicant. |
| **Federal Reserve SR 11-7** | Rigorous Model Risk Management (MRM), calibration validation, and continuous monitoring. | End-to-end versioning via **MLflow**, automated **Population Stability Index (PSI)** telemetry, and reproducible calibration curves. |

---

## 7. Hybrid Deployment & Infrastructure Playbook

The platform utilizes a modern hybrid topology: high-availability cloud serving for live underwriting combined with secure local or private cloud infrastructure for governance telemetry.

### 7.1. Cloud Production Deployment (Render)
The primary underwriting microservice is deployed as a containerized web service:
* **Base Image**: `python:3.11-slim` with multi-stage compilation.
* **Orchestration**: `render.yaml` infrastructure-as-code specification.
* **Public Endpoint**: `https://credit-risk-assessment-system-6qow.onrender.com/`
* **Health & Metrics**: Built-in `/health`, `/metrics`, and `/docs` routes.

### 7.2. Monitoring & Governance Stack (Docker Compose)
The local and private cloud telemetry network runs as an isolated multi-container stack:

```bash
# Launch the private MLOps telemetry stack
docker compose -f docker-compose.monitoring.yml up -d
```

| Container Service | External Port | Functionality |
| :--- | :---: | :--- |
| **`credit-risk-mlflow`** | `:5000` | Experiment tracking, hyperparameter versioning & model artifact registry. |
| **`credit-risk-prometheus`** | `:9090` | Time-series scraper collecting performance, drift, and fairness metrics. |
| **`credit-risk-grafana`** | `:3000` | Executive Underwriting & Model Risk Management dashboards. |

### 7.3. Continuous Delivery & Quality Assurance (CI/CD)
The `.github/workflows/ci-cd.yml` pipeline automatically enforces enterprise standards before deployment:
1. **Static Analysis & Linting**: Validates Python code style via `flake8`.
2. **Automated Unit & Integration Testing**: Executes 7 comprehensive test suites in `pytest` covering health, prediction, SHAP explainability, and recourse calculations.
3. **Automated Fair Lending Gate**: Re-evaluates ECOA Four-Fifths compliance on new candidate models; builds fail if the Disparate Impact Ratio drops below 0.80.
4. **Zero-Downtime Deployment**: Dispatches production deployment triggers upon successful gate completion.

---

## 8. Summary & Business Impact

This system transforms credit scoring from a static, vulnerable cost center into an **auditable, profit-optimizing, and customer-centric competitive advantage**. By unifying calibrated machine learning, automated compliance, and real-time MLOps telemetry, financial institutions can safely expand credit access, mitigate portfolio loss, and satisfy the strictest global regulatory mandates.

* **Live Demo Portal**: [Explore the Production System](https://credit-risk-assessment-system-6qow.onrender.com/)  
* **Executive Assessment Memo**: [View Underwriting Report](https://credit-risk-assessment-system-6qow.onrender.com/static/report.html)  
* **Architecture & Inquiries**: Maintained by the Model Risk Management & Enterprise AI Engineering Team.
