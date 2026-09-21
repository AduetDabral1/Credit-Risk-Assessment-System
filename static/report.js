/**
 * Credit Risk Assessment System - Dedicated Report Logic
 * Features:
 * 1. Session Storage Deserialization with Graceful Fallback
 * 2. Animated Circular Probability Gauge with Threshold Mapping
 * 3. 11-Feature Underwriting Matrix Builder
 * 4. Regulatory Adverse Action & Recourse Injectors
 * 5. High-Resolution PDF Print Engine Integration
 * 6. Machine-Readable JSON Audit Data Exporter
 */

document.addEventListener('DOMContentLoaded', () => {
  initReportView();
  initExportActions();
});

function initReportView() {
  // 1. Retrieve Assessment from SessionStorage or use Fallback Demo
  let reportData = null;
  const rawSession = sessionStorage.getItem('credit_risk_assessment');

  if (rawSession) {
    try {
      reportData = JSON.parse(rawSession);
    } catch (e) {
      console.warn('Failed to parse session report data:', e);
    }
  }

  // Graceful Demo Fallback if visited directly without prior prediction
  if (!reportData || !reportData.prediction) {
    reportData = getDemoReportData();
    const demoBanner = document.createElement('div');
    demoBanner.className = 'no-print';
    demoBanner.style.cssText = `
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: #fbbf24;
      font-size: 0.85rem;
      padding: 10px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;
    demoBanner.innerHTML = `
      <span><strong>Sample Report Mode:</strong> Displaying representative model assessment data. Submit the application form to evaluate a live applicant.</span>
      <a href="index.html" style="color: #ffffff; text-decoration: underline; margin-left: 12px; font-weight: 600;">Go to Application Form &rarr;</a>
    `;
    const container = document.querySelector('.report-container');
    container.insertBefore(demoBanner, container.querySelector('.report-doc-header'));
  }

  const { prediction, recourse, payload, latencyMs, timestamp, refId } = reportData;

  // 2. Set Header Metadata
  const refEl = document.getElementById('report-ref-id');
  const timeEl = document.getElementById('report-timestamp');
  const latencyEl = document.getElementById('report-latency');
  const certDateEl = document.getElementById('cert-date-val');

  if (refEl) refEl.textContent = `REF: ${refId || 'CR-2026-9842'}`;
  if (timeEl) timeEl.textContent = `Timestamp: ${timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'}`;
  if (latencyEl) latencyEl.textContent = `Model Latency: ${latencyMs || 14} ms \u2022 Fast-Path Inference`;
  if (certDateEl) certDateEl.textContent = (timestamp || new Date().toISOString()).substring(0, 10);

  // 3. Evaluate Decision
  const prob = prediction.default_probability || 0;
  const isHighRisk = prediction.default_prediction === 1 || prediction.Result === 'High Risk' || prob >= 0.50;
  const probPct = (prob * 100).toFixed(2);
  const cutoffPct = ((prediction.threshold || 0.99966) * 100).toFixed(2);

  // 4. Animate Speedometer Risk Meter & Needle
  const needleGroup = document.getElementById('meter-needle-group');
  const needleTip = document.getElementById('meter-needle-tip');
  const hubInner = document.getElementById('meter-hub-inner');
  const gaugeProbText = document.getElementById('gauge-prob-percent');
  const gaugeTierPill = document.getElementById('gauge-tier-pill');

  const clampedProb = Math.max(0, Math.min(1, prob));
  // Needle swings from -90deg (0% Green zone) to +90deg (100% Red zone)
  const targetDeg = -90 + (clampedProb * 180);

  // Dynamic Zone Classification & Color Scheme
  let riskColor = '#10b981';
  let tierClass = 'tier-low';
  let tierText = 'TIER: LOW DEFAULT RISK (< 20%)';

  if (clampedProb < 0.20) {
    riskColor = '#10b981';
    tierClass = 'tier-low';
    tierText = 'TIER: LOW DEFAULT RISK (< 20%)';
  } else if (clampedProb < 0.50) {
    riskColor = '#f59e0b';
    tierClass = 'tier-mid';
    tierText = 'TIER: MODERATE DEFAULT RISK (20% - 50%)';
  } else {
    riskColor = '#ef4444';
    tierClass = 'tier-high';
    tierText = 'TIER: ELEVATED / HIGH RISK (\u2265 50%)';
  }

  // Animate needle rotation
  setTimeout(() => {
    if (needleGroup) {
      needleGroup.style.transform = `rotate(${targetDeg}deg)`;
    }
  }, 120);

  if (needleTip) {
    needleTip.style.fill = riskColor;
    needleTip.style.filter = `drop-shadow(0 0 6px ${riskColor})`;
  }
  if (hubInner) {
    hubInner.style.fill = riskColor;
  }
  if (gaugeTierPill) {
    gaugeTierPill.className = `gauge-tier-pill ${tierClass}`;
    gaugeTierPill.textContent = tierText;
  }

  // Number Counter Animation
  if (gaugeProbText) {
    let startVal = 0;
    const duration = 1200;
    const startTime = performance.now();

    function stepCounter(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const cur = (startVal + (prob * 100 - startVal) * easeProgress).toFixed(2);
      gaugeProbText.textContent = `${cur}%`;

      if (progress < 1) {
        requestAnimationFrame(stepCounter);
      } else {
        gaugeProbText.textContent = `${probPct}%`;
      }
    }
    requestAnimationFrame(stepCounter);
  }

  // 5. Update Decision Outcome Banner
  const banner = document.getElementById('decision-banner');
  const decisionTitle = document.getElementById('decision-title');
  const decisionDesc = document.getElementById('decision-desc');
  const decisionIcon = document.getElementById('decision-icon');

  if (banner && decisionTitle && decisionDesc) {
    if (isHighRisk) {
      banner.className = 'decision-hero-banner status-high';
      decisionTitle.textContent = 'FLAGGED - HIGH RISK / ADVERSE ACTION';
      decisionDesc.textContent = 'Applicant default probability exceeds the risk tolerance cutoff. Application is declined or flagged for adverse action under underwriting standards.';
      if (decisionIcon) {
        decisionIcon.innerHTML = `
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        `;
      }
    } else {
      banner.className = 'decision-hero-banner status-low';
      decisionTitle.textContent = 'APPROVED - LOW RISK';
      decisionDesc.textContent = 'Borrower default probability is strictly below the calibrated decision cutoff. The application satisfies primary credit criteria and credit policy.';
      if (decisionIcon) {
        decisionIcon.innerHTML = `
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;
      }
    }
  }

  // 6. Populate Top 4 Metric Tiles
  const metricProb = document.getElementById('metric-prob');
  const metricCutoff = document.getElementById('metric-cutoff');
  const metricDti = document.getElementById('metric-dti');
  const metricGrade = document.getElementById('metric-grade');

  if (metricProb) metricProb.textContent = `${probPct}%`;
  if (metricCutoff) metricCutoff.textContent = `${cutoffPct}%`;
  if (metricDti) metricDti.textContent = `${Math.round((payload.loan_percent_income || 0) * 100)}%`;
  if (metricGrade) metricGrade.textContent = `Grade ${payload.loan_grade || 'A'}`;

  // 7. Populate 11-Feature Matrix
  const matrixContainer = document.getElementById('applicant-matrix');
  if (matrixContainer) {
    const attributes = [
      { label: 'Applicant Age', val: `${payload.person_age || 0} years` },
      { label: 'Annual Income', val: `$${(payload.person_income || 0).toLocaleString()}` },
      { label: 'Employment Length', val: `${payload.person_emp_length || 0} years` },
      { label: 'Home Ownership', val: payload.person_home_ownership || 'RENT' },
      { label: 'Loan Purpose', val: payload.loan_intent || 'PERSONAL' },
      { label: 'Credit Grade', val: `Grade ${payload.loan_grade || 'A'}` },
      { label: 'Loan Amount', val: `$${(payload.loan_amnt || 0).toLocaleString()}` },
      { label: 'Interest Rate', val: `${payload.loan_int_rate || 0}%` },
      { label: 'Loan % of Income', val: `${Math.round((payload.loan_percent_income || 0) * 100)}%` },
      { label: 'Historical Default', val: (payload.cb_person_default_on_file === 'Y' || payload.cb_person_default_on_file === '1') ? 'YES (Default on File)' : 'NO (Clean History)' },
      { label: 'Credit History', val: `${payload.cb_person_cred_hist_length || 0} years` }
    ];

    matrixContainer.innerHTML = attributes.map(item => `
      <div class="attr-item">
        <span class="attr-label">${item.label}</span>
        <span class="attr-value">${item.val}</span>
      </div>
    `).join('');
  }

  // 8. Populate 3D Credit Card Token Showcase
  const tokenCard = document.getElementById('report-token-card');
  const tokenStatusPill = document.getElementById('token-status-pill');
  const tokenHolderName = document.getElementById('token-holder-name');
  const tokenAmount = document.getElementById('token-amount');

  if (tokenCard && tokenStatusPill && tokenHolderName && tokenAmount) {
    tokenCard.className = `token-credit-card ${isHighRisk ? 'token-card-high' : 'token-card-low'}`;
    tokenStatusPill.textContent = isHighRisk ? 'HIGH RISK' : 'APPROVED';
    tokenStatusPill.style.background = isHighRisk ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)';
    tokenStatusPill.style.color = isHighRisk ? '#f87171' : '#34d399';

    tokenHolderName.textContent = `APPLICANT \u2022 ${payload.person_home_ownership || 'PROFILE'}`;
    tokenAmount.textContent = `$${(payload.loan_amnt || 0).toLocaleString()}`;
  }

  // 9. SHAP Adverse Action Reasons (ECOA / FCRA)
  const adverseSection = document.getElementById('adverse-action-section');
  const adverseContainer = document.getElementById('adverse-reasons-container');

  if (isHighRisk && prediction.adverse_action_reasons && prediction.adverse_action_reasons.length > 0) {
    if (adverseSection) adverseSection.style.display = 'block';
    if (adverseContainer) {
      adverseContainer.innerHTML = prediction.adverse_action_reasons.map((reason, idx) => `
        <div class="adverse-item-row">
          <div class="adverse-code-label">
            <span class="adverse-code-num">CODE 0${idx + 1}</span>
            <span>${reason}</span>
          </div>
          <span style="font-family: var(--font-mono); font-size: 0.75rem; color: #f87171;">Significant SHAP Impact</span>
        </div>
      `).join('');
    }
  } else if (adverseSection) {
    adverseSection.style.display = 'none';
  }

  // 10. Recourse Guidance (What-If Simulator)
  const recourseSection = document.getElementById('recourse-section');
  const recourseText = document.getElementById('recourse-text');
  const btnApplyRecourse = document.getElementById('btn-apply-recourse');

  if (isHighRisk && recourse) {
    if (recourseSection) recourseSection.style.display = 'block';
    if (recourseText) recourseText.textContent = recourse.recommendation;

    if (btnApplyRecourse) {
      if (recourse.recourse_available && recourse.recommended_amount) {
        btnApplyRecourse.style.display = 'inline-flex';
        btnApplyRecourse.onclick = () => {
          // Store applied recourse parameters for index.html to pick up
          sessionStorage.setItem('credit_risk_applied_recourse', JSON.stringify({
            loan_amnt: recourse.recommended_amount,
            loan_percent_income: recourse.new_loan_percent_income
          }));
          window.location.href = 'index.html#classification';
        };
      } else {
        btnApplyRecourse.style.display = 'none';
      }
    }
  } else if (recourseSection) {
    recourseSection.style.display = 'none';
  }
}

/**
 * PDF Print & JSON Data Export Handlers
 */
function initExportActions() {
  const btnPdf = document.getElementById('btn-download-pdf');
  const btnJson = document.getElementById('btn-export-json');

  if (btnPdf) {
    btnPdf.addEventListener('click', () => {
      const originalTitle = document.title;
      const refId = document.getElementById('report-ref-id')?.textContent.replace(/[^a-zA-Z0-9_-]/g, '') || 'CR-2026';
      document.title = `Credit_Risk_Assessment_Report_${refId}`;
      window.print();
      document.title = originalTitle;
    });
  }

  if (btnJson) {
    btnJson.addEventListener('click', () => {
      let reportData = null;
      const rawSession = sessionStorage.getItem('credit_risk_assessment');
      if (rawSession) {
        try { reportData = JSON.parse(rawSession); } catch(e) {}
      }
      if (!reportData) reportData = getDemoReportData();

      const exportBundle = {
        metadata: {
          system: "Credit Risk Assessment System",
          version: "1.0.0",
          model_architecture: "XGBoost Classifier with Isotonic CalibratedClassifierCV (5-Fold)",
          export_timestamp: new Date().toISOString(),
          reference_id: reportData.refId || 'CR-2026-9842'
        },
        applicant_input_parameters: reportData.payload,
        model_inference: {
          default_probability: reportData.prediction.default_probability,
          calibrated_cutoff_threshold: reportData.prediction.threshold,
          decision: reportData.prediction.Result,
          adverse_action_codes: reportData.prediction.adverse_action_reasons || [],
          latency_ms: reportData.latencyMs || 14
        },
        counterfactual_recourse: reportData.recourse || null
      };

      const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `credit_risk_assessment_${reportData.refId || 'CR-2026'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }
}

/**
 * Fallback Demonstration Data
 */
function getDemoReportData() {
  return {
    refId: 'CR-2026-DEMO',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
    latencyMs: 11,
    payload: {
      person_age: 32,
      person_income: 72000,
      person_home_ownership: 'MORTGAGE',
      person_emp_length: 6,
      loan_intent: 'PERSONAL',
      loan_grade: 'A',
      loan_amnt: 10000,
      loan_int_rate: 8.5,
      loan_percent_income: 0.14,
      cb_person_default_on_file: 'N',
      cb_person_cred_hist_length: 8
    },
    prediction: {
      default_probability: 0.0215,
      default_prediction: 0,
      threshold: 0.99966,
      Result: 'Low Risk',
      adverse_action_reasons: []
    },
    recourse: null
  };
}
