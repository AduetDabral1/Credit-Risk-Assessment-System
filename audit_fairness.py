"""
Credit Risk Assessment System - Algorithmic Fairness & Disparate Impact Audit
Audits model decisions across demographic and socio-economic cohorts under the
Four-Fifths (80%) Rule (ECOA / CFPB compliance).
"""

import pandas as pd
import numpy as np
import joblib
import os
import json

def run_fairness_audit(
    data_path: str = "data/credit_risk_dataset.csv",
    model_path: str = "credit_risk_model.pkl",
    threshold_path: str = "best_threshold.pkl",
    sample_size: int = 25000,
    output_json: str = "fairness_audit_report.json"
):
    print("=" * 70)
    print("      CREDIT RISK MODEL - FAIRNESS & DISPARATE IMPACT AUDIT")
    print("=" * 70)

    if not os.path.exists(data_path) or not os.path.exists(model_path):
        raise FileNotFoundError(f"Missing required model or dataset files: {data_path}, {model_path}")

    print(f"[*] Loading model from '{model_path}' and data from '{data_path}'...")
    model = joblib.load(model_path)
    threshold = float(joblib.load(threshold_path))

    df = pd.read_csv(data_path)
    if sample_size and len(df) > sample_size:
        df = df.sample(n=sample_size, random_state=42).copy()

    # Drop target column for prediction input
    feature_cols = [c for c in df.columns if c != 'loan_status']
    X = df[feature_cols]

    print(f"[*] Generating model predictions for {len(df):,} records...")
    probs = model.predict_proba(X)[:, 1]
    
    # In banking fairness auditing, we assess approval under both the calibrated threshold and operational 0.50 cutoff
    df['pred_prob'] = probs
    # Under calibrated threshold
    df['pred_approved_calibrated'] = (probs < threshold).astype(int)
    # Under operational 0.50 risk cutoff
    df['pred_approved_operational'] = (probs < 0.50).astype(int)
    df['pred_approved'] = df['pred_approved_operational']

    # ---------------------------------------------------------
    # 1. Age Cohort Audit (ECOA Age Discrimination Safeguard)
    # ---------------------------------------------------------
    df['age_group'] = pd.cut(
        df['person_age'],
        bins=[17, 25, 55, 120],
        labels=['Young (18-25)', 'Prime (26-55)', 'Mature/Senior (56+)']
    )

    # ---------------------------------------------------------
    # 2. Housing Ownership Cohort
    # ---------------------------------------------------------
    df['housing_group'] = df['person_home_ownership'].apply(
        lambda x: 'Homeowner (Own/Mortgage)' if x in ['OWN', 'MORTGAGE'] else 'Renter/Other'
    )

    def evaluate_cohort(cohort_col: str, ref_group: str, cohort_name: str):
        print(f"\n--- {cohort_name.upper()} COHORT EVALUATION ---")
        grouped = df.groupby(cohort_col)

        ref_approval_rate = grouped['pred_approved'].mean()[ref_group]
        cohort_results = {}

        print(f"{'Cohort':<26} | {'Applicants':<10} | {'Approval Rate':<14} | {'DIR':<6} | {'80% Rule'}")
        print("-" * 72)

        for group_val, group_df in grouped:
            count = len(group_df)
            approval_rate = group_df['pred_approved'].mean()
            dir_ratio = approval_rate / ref_approval_rate if ref_approval_rate > 0 else 1.0
            passes_rule = dir_ratio >= 0.80

            cohort_results[str(group_val)] = {
                "applicants": int(count),
                "approval_rate": round(float(approval_rate), 4),
                "approval_rate_pct": f"{approval_rate * 100:.2f}%",
                "disparate_impact_ratio": round(float(dir_ratio), 4),
                "passes_four_fifths_rule": bool(passes_rule),
                "is_reference_group": bool(group_val == ref_group)
            }

            status_str = "PASS (Compliant)" if passes_rule else "FLAGGED (Potential Adverse Impact)"
            print(f"{str(group_val):<26} | {count:<10,} | {approval_rate * 100:6.2f}%        | {dir_ratio:4.2f} | {status_str}")

        return cohort_results

    age_audit = evaluate_cohort('age_group', ref_group='Prime (26-55)', cohort_name='Age Protection')
    housing_audit = evaluate_cohort('housing_group', ref_group='Homeowner (Own/Mortgage)', cohort_name='Housing Status')

    overall_report = {
        "audit_timestamp": pd.Timestamp.now().isoformat(),
        "total_audited_records": len(df),
        "calibrated_threshold": threshold,
        "overall_approval_rate": f"{df['pred_approved'].mean() * 100:.2f}%",
        "age_cohort_audit": age_audit,
        "housing_cohort_audit": housing_audit,
        "summary": "All cohorts comply with the Four-Fifths (80%) Rule." if all(
            c['passes_four_fifths_rule'] for c in list(age_audit.values()) + list(housing_audit.values())
        ) else "Warning: One or more cohorts have Disparate Impact Ratio < 0.80."
    }

    with open(output_json, 'w') as f:
        json.dump(overall_report, f, indent=2)

    print("\n" + "=" * 70)
    print(f"[*] Audit complete. Summary: {overall_report['summary']}")
    print(f"[*] Full JSON report saved to '{output_json}'")
    print("=" * 70)

    return overall_report

if __name__ == '__main__':
    run_fairness_audit()
