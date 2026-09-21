/**
 * Credit Risk Assessment System - Interactive Frontend Engine
 * Features:
 * 1. Ambient Background Frame Animation (Canvas looping 200 3D frames with IntersectionObserver)
 * 2. 3D Card Mouse Tilt & Parallax Physics
 * 3. Real-Time Form Calculations & Ratio Synchronization
 * 4. Sample Values Populator
 * 5. On-Demand FastAPI Prediction with Gauge Animation
 * 6. "Make Another Assessment" Reset Workflow
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeroCanvasAnimation();
  init3DParallax();
  initFormSync();
  initSampleValuesButton();
  initPredictionEngine();
  initResetFlow();
  initAuditModals();
  initSessionReportCheck();
});

/* ==========================================================================
   1. Landing Page Background Frame Animation (Canvas Loop)
   ========================================================================== */
function initHeroCanvasAnimation() {
  const canvas = document.getElementById('hero-bg-canvas');
  const heroSection = document.getElementById('intro-hero');
  if (!canvas || !heroSection) return;

  const ctx = canvas.getContext('2d');
  const totalFrames = 200;
  const frameImages = new Array(totalFrames);
  let loadedCount = 0;
  let currentFrame = 0;
  let isVisible = true;
  let animationFrameId = null;

  function resizeCanvas() {
    canvas.width = heroSection.offsetWidth || window.innerWidth;
    canvas.height = heroSection.offsetHeight || window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function getFramePath(idx) {
    const padded = String(idx).padStart(3, '0');
    return `background/ezgif-frame-${padded}.jpg`;
  }

  function drawFrame(img) {
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Center cover logic
    const scale = Math.max(cw / iw, ch / ih);
    const nw = iw * scale;
    const nh = ih * scale;
    const ox = (cw - nw) / 2;
    const oy = (ch - nh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, ox, oy, nw, nh);
  }

  // Preload frames progressively
  let startedLoop = false;
  const initialBatch = 15;

  function loadNext(idx) {
    if (idx > totalFrames) return;
    const img = new Image();
    img.src = getFramePath(idx);
    img.onload = () => {
      frameImages[idx - 1] = img;
      loadedCount++;
      if (loadedCount >= initialBatch && !startedLoop) {
        startedLoop = true;
        startLoop();
      }
      loadNext(idx + 1);
    };
    img.onerror = () => {
      loadedCount++;
      loadNext(idx + 1);
    };
  }

  // Start preloading initial frames in parallel
  for (let i = 1; i <= 8; i++) {
    loadNext(i);
  }

  let lastTime = 0;
  const fps = 32; // ~32 fps for silky cinematic background loop
  const interval = 1000 / fps;

  function startLoop() {
    function loop(timestamp) {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      if (!lastTime) lastTime = timestamp;
      const delta = timestamp - lastTime;

      if (delta >= interval) {
        lastTime = timestamp - (delta % interval);

        const img = frameImages[currentFrame];
        if (img) {
          drawFrame(img);
        }

        currentFrame = (currentFrame + 1) % totalFrames;
      }

      animationFrameId = requestAnimationFrame(loop);
    }
    animationFrameId = requestAnimationFrame(loop);
  }

  // Pause canvas rendering when scrolled away to save GPU/CPU
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;
      });
    }, { threshold: 0.1 });
    observer.observe(heroSection);
  }
}

/* ==========================================================================
   2. 3D Card Mouse Parallax & Gyro Physics
   ========================================================================== */
function init3DParallax() {
  const stage = document.querySelector('.card-stage-container');
  const stack = document.getElementById('card-stack');
  const topCard = document.getElementById('top-interactive-card');

  if (!stage || !stack) return;

  let targetRotX = 12;
  let targetRotY = -20;
  let currentRotX = 12;
  let currentRotY = -20;

  function handleMouseMove(e) {
    const rect = stage.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = (x / rect.width) * 2 - 1; // -1 to +1
    const normY = (y / rect.height) * 2 - 1;

    // Specular lighting follow on top card
    if (topCard) {
      topCard.style.setProperty('--mouse-x', `${((normX + 1) / 2) * 100}%`);
      topCard.style.setProperty('--mouse-y', `${((normY + 1) / 2) * 100}%`);
    }

    targetRotY = -20 + normX * 16;
    targetRotX = 12 - normY * 16;
  }

  function handleMouseLeave() {
    targetRotX = 12;
    targetRotY = -20;
  }

  stage.addEventListener('mousemove', handleMouseMove);
  stage.addEventListener('mouseleave', handleMouseLeave);

  // Smooth lerp rendering loop
  function renderTilt() {
    currentRotX += (targetRotX - currentRotX) * 0.08;
    currentRotY += (targetRotY - currentRotY) * 0.08;

    stack.style.transform = `rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg)`;
    requestAnimationFrame(renderTilt);
  }
  requestAnimationFrame(renderTilt);
}

/* ==========================================================================
   3. Form Synchronization & Auto-Calculations
   ========================================================================== */
function initFormSync() {
  const incomeInput = document.getElementById('person_income');
  const loanAmntInput = document.getElementById('loan_amnt');
  const percentInput = document.getElementById('loan_percent_income');
  const percentRange = document.getElementById('loan_percent_income_range');
  const percentBadge = document.getElementById('loan_percent_badge');

  const defaultToggleN = document.getElementById('toggle-default-n');
  const defaultToggleY = document.getElementById('toggle-default-y');
  const defaultHidden = document.getElementById('cb_person_default_on_file');

  // Auto-sync loan percent of income
  function syncLoanPercent() {
    const income = parseFloat(incomeInput.value) || 0;
    const loan = parseFloat(loanAmntInput.value) || 0;

    if (income > 0 && loan > 0) {
      let ratio = loan / income;
      ratio = Math.min(1.0, Math.max(0.01, parseFloat(ratio.toFixed(2))));
      percentInput.value = ratio;
      percentRange.value = ratio;
      if (percentBadge) percentBadge.textContent = `${(ratio * 100).toFixed(0)}%`;
    }
  }

  incomeInput.addEventListener('input', syncLoanPercent);
  loanAmntInput.addEventListener('input', syncLoanPercent);

  // Manual range slider sync
  percentRange.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    percentInput.value = val;
    if (percentBadge) percentBadge.textContent = `${(val * 100).toFixed(0)}%`;
  });

  percentInput.addEventListener('input', (e) => {
    let val = parseFloat(e.target.value) || 0;
    val = Math.min(1.0, Math.max(0.01, val));
    percentRange.value = val;
    if (percentBadge) percentBadge.textContent = `${(val * 100).toFixed(0)}%`;
  });

  // Default on File Toggle
  defaultToggleN.addEventListener('click', () => {
    defaultToggleN.classList.add('active');
    defaultToggleY.classList.remove('active', 'toggle-danger');
    defaultHidden.value = 'N';
  });

  defaultToggleY.addEventListener('click', () => {
    defaultToggleY.classList.add('active', 'toggle-danger');
    defaultToggleN.classList.remove('active');
    defaultHidden.value = 'Y';
  });
}

/* ==========================================================================
   4. "Test with Sample Values" Button
   ========================================================================== */
function initSampleValuesButton() {
  const btnSample = document.getElementById('btn-sample-values');
  if (!btnSample) return;

  const sampleProfiles = [
    {
      person_age: 29,
      person_income: 68000,
      person_home_ownership: 'MORTGAGE',
      person_emp_length: 5.5,
      loan_intent: 'PERSONAL',
      loan_grade: 'A',
      loan_amnt: 10000,
      loan_int_rate: 7.9,
      loan_percent_income: 0.15,
      cb_person_default_on_file: 'N',
      cb_person_cred_hist_length: 7,
      applicant_name: 'ALEX VANCE'
    },
    {
      person_age: 24,
      person_income: 32000,
      person_home_ownership: 'RENT',
      person_emp_length: 1.5,
      loan_intent: 'DEBTCONSOLIDATION',
      loan_grade: 'E',
      loan_amnt: 16000,
      loan_int_rate: 19.5,
      loan_percent_income: 0.50,
      cb_person_default_on_file: 'Y',
      cb_person_cred_hist_length: 2,
      applicant_name: 'JORDAN REED'
    }
  ];

  let sampleIndex = 0;

  btnSample.addEventListener('click', () => {
    const profile = sampleProfiles[sampleIndex % sampleProfiles.length];
    sampleIndex++;

    document.getElementById('person_age').value = profile.person_age;
    document.getElementById('person_income').value = profile.person_income;
    document.getElementById('person_home_ownership').value = profile.person_home_ownership;
    document.getElementById('person_emp_length').value = profile.person_emp_length;
    document.getElementById('loan_intent').value = profile.loan_intent;
    document.getElementById('loan_grade').value = profile.loan_grade;
    document.getElementById('loan_amnt').value = profile.loan_amnt;
    document.getElementById('loan_int_rate').value = profile.loan_int_rate;

    const percentInput = document.getElementById('loan_percent_income');
    const percentRange = document.getElementById('loan_percent_income_range');
    const percentBadge = document.getElementById('loan_percent_badge');

    percentInput.value = profile.loan_percent_income;
    percentRange.value = profile.loan_percent_income;
    if (percentBadge) percentBadge.textContent = `${(profile.loan_percent_income * 100).toFixed(0)}%`;

    // Default toggle
    const toggleN = document.getElementById('toggle-default-n');
    const toggleY = document.getElementById('toggle-default-y');
    const defaultHidden = document.getElementById('cb_person_default_on_file');

    defaultHidden.value = profile.cb_person_default_on_file;
    if (profile.cb_person_default_on_file === 'Y') {
      toggleY.classList.add('active', 'toggle-danger');
      toggleN.classList.remove('active');
    } else {
      toggleN.classList.add('active');
      toggleY.classList.remove('active', 'toggle-danger');
    }

    document.getElementById('cb_person_cred_hist_length').value = profile.cb_person_cred_hist_length;

    // Update 3D card name
    const cardDisplayName = document.getElementById('card-display-name');
    if (cardDisplayName) cardDisplayName.textContent = profile.applicant_name;

    // Visual pulse on submit button
    const submitBtn = document.getElementById('btn-submit-form');
    if (submitBtn) {
      submitBtn.style.transform = 'scale(1.02)';
      setTimeout(() => { submitBtn.style.transform = ''; }, 250);
    }
  });
}

/* ==========================================================================
   5. Prediction Engine (Only Predicts on User Submission)
   ========================================================================== */
function initPredictionEngine() {
  const form = document.getElementById('credit-risk-form');
  const submitBtn = document.getElementById('btn-submit-form');
  const waitingState = document.getElementById('waiting-state');
  const activeResultsState = document.getElementById('active-results-state');

  const gaugeValEl = document.getElementById('gauge-value');
  const gaugeFillEl = document.getElementById('gauge-fill');
  const decisionBanner = document.getElementById('decision-banner');
  const decisionTitle = document.getElementById('decision-title');
  const decisionDesc = document.getElementById('decision-desc');
  const metricRisk = document.getElementById('metric-risk-val');
  const metricProb = document.getElementById('metric-prob-val');
  const metricThreshold = document.getElementById('metric-threshold-val');

  const cardTop = document.getElementById('top-interactive-card');
  const cardStatusPill = document.getElementById('card-status-pill');
  const cardExpiryStatus = document.getElementById('card-expiry-status');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      person_age: parseInt(document.getElementById('person_age').value, 10),
      person_income: parseFloat(document.getElementById('person_income').value),
      person_home_ownership: document.getElementById('person_home_ownership').value,
      person_emp_length: parseFloat(document.getElementById('person_emp_length').value),
      loan_intent: document.getElementById('loan_intent').value,
      loan_grade: document.getElementById('loan_grade').value,
      loan_amnt: parseFloat(document.getElementById('loan_amnt').value),
      loan_int_rate: parseFloat(document.getElementById('loan_int_rate').value),
      loan_percent_income: parseFloat(document.getElementById('loan_percent_income').value),
      cb_person_default_on_file: document.getElementById('cb_person_default_on_file').value,
      cb_person_cred_hist_length: parseInt(document.getElementById('cb_person_cred_hist_length').value, 10)
    };

    // UI Loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="spin-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10"/>
      </svg>
      Evaluating Model &amp; Generating Report...
    `;

    const startTime = performance.now();

    try {
      const response = await fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const result = await response.json();
      const latency = Math.round(performance.now() - startTime);

      let recourseData = null;
      const isHighRisk = result.default_prediction === 1 || result.Result === 'High Risk' || (result.default_probability || 0) >= 0.50;

      if (isHighRisk) {
        try {
          const recRes = await fetch('/recourse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (recRes.ok) {
            recourseData = await recRes.json();
          }
        } catch (recErr) {
          console.warn('Recourse fetch error:', recErr);
        }
      }

      // Save complete assessment bundle to sessionStorage
      const assessmentBundle = {
        refId: `CR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        latencyMs: latency,
        payload: payload,
        prediction: result,
        recourse: recourseData
      };
      sessionStorage.setItem('credit_risk_assessment', JSON.stringify(assessmentBundle));

      const existingReportBtn = document.getElementById('btn-view-existing-report');
      if (existingReportBtn) existingReportBtn.style.display = 'inline-flex';

      // Transition from Waiting Animation to Active Results
      if (waitingState) waitingState.style.display = 'none';
      if (activeResultsState) activeResultsState.style.display = 'flex';

      renderPredictionResult(result, latency, payload);

      // Smoothly navigate to dedicated report page
      setTimeout(() => {
        window.location.href = 'report.html';
      }, 650);
    } catch (err) {
      console.error('Inference error:', err);
      if (waitingState) waitingState.style.display = 'none';
      if (activeResultsState) activeResultsState.style.display = 'flex';

      decisionTitle.textContent = 'Inference Error';
      decisionDesc.textContent = 'Could not retrieve prediction from /predict endpoint. Verify FastAPI is running.';
      decisionBanner.className = 'decision-banner status-high';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
        Run Assessment &amp; Generate Report
      `;
    }
  });

  function renderPredictionResult(res, latencyMs, payload) {
    const prob = res.default_probability;
    const isHighRisk = res.default_prediction === 1 || res.Result === 'High Risk' || prob >= 0.50;
    const probPct = (prob * 100).toFixed(2);
    const thresholdPct = (res.threshold * 100).toFixed(2);

    const adverseContainer = document.getElementById('adverse-action-container');
    const adverseList = document.getElementById('adverse-reasons-list');
    const recourseContainer = document.getElementById('recourse-container');
    const recourseText = document.getElementById('recourse-text');
    const btnApplyRecourse = document.getElementById('btn-apply-recourse');

    // Animate counter from 0 to calculated percentage
    let startVal = 0;
    const animDuration = 900;
    const animStart = performance.now();

    function stepCount(time) {
      const elapsed = time - animStart;
      const progress = Math.min(1, elapsed / animDuration);
      const current = (startVal + (prob * 100 - startVal) * progress).toFixed(2);
      gaugeValEl.textContent = `${current}%`;

      if (progress < 1) {
        requestAnimationFrame(stepCount);
      }
    }
    requestAnimationFrame(stepCount);

    // Animate Circular Gauge
    // Circumference r=70 is 2 * PI * 70 ≈ 440
    const circumference = 440;
    const offset = circumference - (prob * circumference);
    gaugeFillEl.style.strokeDashoffset = offset;

    if (isHighRisk) {
      gaugeFillEl.style.stroke = 'var(--accent-crimson)';
      decisionBanner.className = 'decision-banner status-high';
      decisionTitle.textContent = 'FLAGGED - HIGH RISK';
      decisionDesc.textContent = `Default probability (${probPct}%) exceeds calibrated cutoff threshold. Loan application flagged for review.`;

      // Hero 3D card update
      if (cardTop) {
        cardTop.classList.remove('status-low-risk');
        cardTop.classList.add('status-high-risk');
      }
      if (cardStatusPill) {
        cardStatusPill.className = 'card-status-pill status-flagged';
        cardStatusPill.textContent = 'HIGH RISK';
      }
      if (cardExpiryStatus) cardExpiryStatus.textContent = 'FLAGGED';

      metricRisk.textContent = 'High Risk';
      metricRisk.style.color = 'var(--accent-crimson)';

      // 1. Render SHAP Adverse Action Reason Codes
      if (adverseContainer && adverseList) {
        adverseContainer.style.display = 'flex';
        const reasons = res.adverse_action_reasons || [];
        adverseList.innerHTML = reasons.map((r, i) => `
          <div class="adverse-reason-item">
            <span class="adverse-num">0${i + 1}</span>
            <span>${r}</span>
          </div>
        `).join('');
      }

      // 2. Query What-If Recourse Simulator
      if (recourseContainer && recourseText && payload) {
        recourseContainer.style.display = 'flex';
        recourseText.innerHTML = '<em>Calculating algorithmic recourse...</em>';
        if (btnApplyRecourse) btnApplyRecourse.style.display = 'none';

        fetch('/recourse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        .then(r => r.json())
        .then(data => {
          recourseText.textContent = data.recommendation;
          if (data.recourse_available && data.recommended_amount) {
            if (btnApplyRecourse) {
              btnApplyRecourse.style.display = 'inline-flex';
              btnApplyRecourse.onclick = () => {
                const loanInput = document.getElementById('loan_amnt');
                const percentInput = document.getElementById('loan_percent_income');
                const percentRange = document.getElementById('loan_percent_income_range');
                const percentBadge = document.getElementById('loan_percent_badge');

                loanInput.value = data.recommended_amount;
                percentInput.value = data.new_loan_percent_income;
                if (percentRange) percentRange.value = data.new_loan_percent_income;
                if (percentBadge) percentBadge.textContent = `${(data.new_loan_percent_income * 100).toFixed(0)}%`;

                form.dispatchEvent(new Event('submit', { cancelable: true }));
              };
            }
          }
        })
        .catch(err => {
          console.error('Recourse error:', err);
          recourseText.textContent = 'Could not evaluate recourse recommendation.';
        });
      }

    } else {
      gaugeFillEl.style.stroke = 'var(--accent-emerald)';
      decisionBanner.className = 'decision-banner status-low';
      decisionTitle.textContent = 'APPROVED - LOW RISK';
      decisionDesc.textContent = `Default probability (${probPct}%) is well below calibrated threshold (${thresholdPct}%). Loan approved.`;

      // Hero 3D card update
      if (cardTop) {
        cardTop.classList.remove('status-high-risk');
        cardTop.classList.add('status-low-risk');
      }
      if (cardStatusPill) {
        cardStatusPill.className = 'card-status-pill status-approved';
        cardStatusPill.textContent = 'APPROVED';
      }
      if (cardExpiryStatus) cardExpiryStatus.textContent = 'PASSED';

      metricRisk.textContent = 'Low Risk';
      metricRisk.style.color = 'var(--accent-emerald)';

      if (adverseContainer) adverseContainer.style.display = 'none';
      if (recourseContainer) recourseContainer.style.display = 'none';
    }

    metricProb.textContent = `${probPct}%`;
    metricThreshold.textContent = `${thresholdPct}%`;
  }
}

/* ==========================================================================
   6. "Make Another Assessment" Reset Flow
   ========================================================================== */
function initResetFlow() {
  const btnReset = document.getElementById('btn-make-another');
  const form = document.getElementById('credit-risk-form');
  const waitingState = document.getElementById('waiting-state');
  const activeResultsState = document.getElementById('active-results-state');

  const adverseContainer = document.getElementById('adverse-action-container');
  const recourseContainer = document.getElementById('recourse-container');

  const cardTop = document.getElementById('top-interactive-card');
  const cardStatusPill = document.getElementById('card-status-pill');
  const cardExpiryStatus = document.getElementById('card-expiry-status');
  const cardDisplayName = document.getElementById('card-display-name');

  if (!btnReset || !form) return;

  btnReset.addEventListener('click', () => {
    // Reset form inputs
    form.reset();

    // Reset default toggle
    const toggleN = document.getElementById('toggle-default-n');
    const toggleY = document.getElementById('toggle-default-y');
    const defaultHidden = document.getElementById('cb_person_default_on_file');
    if (toggleN && toggleY && defaultHidden) {
      toggleN.classList.add('active');
      toggleY.classList.remove('active', 'toggle-danger');
      defaultHidden.value = 'N';
    }

    // Reset range slider badge
    const percentRange = document.getElementById('loan_percent_income_range');
    const percentBadge = document.getElementById('loan_percent_badge');
    if (percentRange) percentRange.value = 0.15;
    if (percentBadge) percentBadge.textContent = '15%';

    // Reset 3D Card
    if (cardTop) {
      cardTop.classList.remove('status-low-risk', 'status-high-risk');
    }
    if (cardStatusPill) {
      cardStatusPill.className = 'card-status-pill';
      cardStatusPill.textContent = 'AWAITING EVALUATION';
    }
    if (cardExpiryStatus) cardExpiryStatus.textContent = 'STANDBY';
    if (cardDisplayName) cardDisplayName.textContent = 'LOAN APPLICANT';

    // Hide adverse & recourse boxes
    if (adverseContainer) adverseContainer.style.display = 'none';
    if (recourseContainer) recourseContainer.style.display = 'none';

    // Switch back to Waiting Animation State
    if (activeResultsState) activeResultsState.style.display = 'none';
    if (waitingState) waitingState.style.display = 'flex';

    // Focus first input
    const firstInput = document.getElementById('person_age');
    if (firstInput) {
      firstInput.focus();
      firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

/* ==========================================================================
   7. Governance & Drift Monitoring Modals (PSI & Fairness Audit)
   ========================================================================== */
function initAuditModals() {
  const btnPsi = document.getElementById('btn-view-psi');
  const btnFairness = document.getElementById('btn-view-fairness');
  const backdrop = document.getElementById('audit-modal-backdrop');
  const btnClose = document.getElementById('btn-close-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');

  if (!backdrop) return;

  function closeModal() {
    backdrop.classList.remove('open');
  }

  if (btnClose) btnClose.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  // 1. PSI Modal
  if (btnPsi) {
    btnPsi.addEventListener('click', async () => {
      modalTitle.textContent = 'Population Stability Index (PSI) Drift Report';
      modalBody.innerHTML = '<p style="color: var(--text-muted);">Evaluating PSI feature drift against training baseline...</p>';
      backdrop.classList.add('open');

      try {
        const res = await fetch('/metrics/psi');
        const data = await res.json();
        const features = data.features || {};

        let rowsHtml = '';
        for (const [feat, info] of Object.entries(features)) {
          const isStable = info.status === 'STABLE';
          const badgeClass = isStable ? 'audit-pill-pass' : 'audit-pill-warn';
          rowsHtml += `
            <tr>
              <td><strong>${feat}</strong></td>
              <td>${info.type}</td>
              <td style="font-family: var(--font-mono);">${info.psi.toFixed(4)}</td>
              <td><span class="${badgeClass}">${info.status}</span></td>
            </tr>
          `;
        }

        modalBody.innerHTML = `
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">
            Benchmarking current inference requests against baseline training population (${data.baseline_records.toLocaleString()} records).
            Thresholds: <em>&lt; 0.10 Stable</em>, <em>0.10 - 0.25 Moderate Shift</em>, <em>&ge; 0.25 Severe Drift</em>.
          </p>
          <div style="overflow-x: auto;">
            <table class="audit-table">
              <thead>
                <tr>
                  <th>Feature Name</th>
                  <th>Type</th>
                  <th>PSI Score</th>
                  <th>Stability Status</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        `;
      } catch (err) {
        modalBody.innerHTML = '<p style="color: #f87171;">Error loading PSI metrics.</p>';
      }
    });
  }

  // 2. Fairness & Disparate Impact Modal
  if (btnFairness) {
    btnFairness.addEventListener('click', async () => {
      modalTitle.textContent = 'Algorithmic Fairness & Disparate Impact Audit';
      modalBody.innerHTML = '<p style="color: var(--text-muted);">Loading ECOA Four-Fifths compliance audit report...</p>';
      backdrop.classList.add('open');

      try {
        const res = await fetch('/metrics/fairness');
        const data = await res.json();
        const ageCohort = data.age_cohort_audit || {};
        const housingCohort = data.housing_cohort_audit || {};

        function renderRows(cohortMap) {
          return Object.entries(cohortMap).map(([name, info]) => {
            const isPass = info.passes_four_fifths_rule;
            const badgeClass = isPass ? 'audit-pill-pass' : 'audit-pill-warn';
            const statusText = isPass ? 'PASS (80% Rule)' : 'POTENTIAL DISPARATE IMPACT';
            return `
              <tr>
                <td><strong>${name}</strong></td>
                <td>${info.applicants.toLocaleString()}</td>
                <td style="font-family: var(--font-mono);">${info.approval_rate_pct}</td>
                <td style="font-family: var(--font-mono);">${info.disparate_impact_ratio.toFixed(2)}</td>
                <td><span class="${badgeClass}">${statusText}</span></td>
              </tr>
            `;
          }).join('');
        }

        modalBody.innerHTML = `
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">
            Auditing model approvals under the <strong>Four-Fifths (80%) Rule</strong> (Disparate Impact Ratio &ge; 0.80).
            Audited records: ${data.total_audited_records.toLocaleString()}.
          </p>
          <h4 style="color: var(--accent-amber); font-size: 0.9rem; margin: 10px 0 6px;">Age Cohort Audit (ECOA Age Safeguard)</h4>
          <div style="overflow-x: auto; margin-bottom: 16px;">
            <table class="audit-table">
              <thead>
                <tr>
                  <th>Age Cohort</th>
                  <th>Sample Size</th>
                  <th>Approval Rate</th>
                  <th>DIR Ratio</th>
                  <th>Compliance</th>
                </tr>
              </thead>
              <tbody>
                ${renderRows(ageCohort)}
              </tbody>
            </table>
          </div>

          <h4 style="color: var(--accent-amber); font-size: 0.9rem; margin: 10px 0 6px;">Housing Status Audit</h4>
          <div style="overflow-x: auto;">
            <table class="audit-table">
              <thead>
                <tr>
                  <th>Housing Cohort</th>
                  <th>Sample Size</th>
                  <th>Approval Rate</th>
                  <th>DIR Ratio</th>
                  <th>Compliance</th>
                </tr>
              </thead>
              <tbody>
                ${renderRows(housingCohort)}
              </tbody>
            </table>
          </div>
        `;
      } catch (err) {
        modalBody.innerHTML = '<p style="color: #f87171;">Error loading fairness audit metrics.</p>';
      }
    });
  }
}

/* ==========================================================================
   8. Session Report & Recourse Auto-Fill Check
   ========================================================================== */
function initSessionReportCheck() {
  // 1. Show 'View Report' pill if assessment exists in session
  const existingReportBtn = document.getElementById('btn-view-existing-report');
  const sessionAssessment = sessionStorage.getItem('credit_risk_assessment');
  if (existingReportBtn && sessionAssessment) {
    existingReportBtn.style.display = 'inline-flex';
  }

  // 2. Check if applicant returned from Report page with applied recourse
  const appliedRecourseRaw = sessionStorage.getItem('credit_risk_applied_recourse');
  if (appliedRecourseRaw) {
    try {
      const rec = JSON.parse(appliedRecourseRaw);
      sessionStorage.removeItem('credit_risk_applied_recourse');

      if (rec.loan_amnt) {
        const loanAmntEl = document.getElementById('loan_amnt');
        if (loanAmntEl) {
          loanAmntEl.value = rec.loan_amnt;
          loanAmntEl.style.borderColor = 'var(--accent-emerald)';
        }
      }
      if (rec.loan_percent_income) {
        const dtiEl = document.getElementById('loan_percent_income');
        const rangeEl = document.getElementById('loan_percent_income_range');
        const badgeEl = document.getElementById('loan_percent_badge');
        if (dtiEl) dtiEl.value = rec.loan_percent_income;
        if (rangeEl) rangeEl.value = rec.loan_percent_income;
        if (badgeEl) badgeEl.textContent = `${Math.round(rec.loan_percent_income * 100)}%`;
      }

      const notifBanner = document.getElementById('recourse-banner-notification');
      if (notifBanner) {
        notifBanner.className = 'recourse-applied-alert';
        notifBanner.style.display = 'flex';
        notifBanner.innerHTML = `
          <span><strong>Actionable Recourse Applied:</strong> Loan amount adjusted to $${Number(rec.loan_amnt || 0).toLocaleString()} (${Math.round(Number(rec.loan_percent_income || 0) * 100)}% of income). Click &ldquo;Run Assessment &amp; Generate Report&rdquo; to verify approval!</span>
          <button type="button" onclick="this.parentElement.style.display='none'" style="background:none; border:none; color:inherit; font-size:1.2rem; cursor:pointer; padding-left:12px;">&times;</button>
        `;
        setTimeout(() => {
          notifBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);
      }
    } catch (e) {
      console.warn('Error applying recourse from session:', e);
    }
  }
}


