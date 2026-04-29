# Telecheck — Medication Interaction & Validation Engine Slice PRD

**Version:** 1.0
**Status:** Canonical for development
**Owner:** Clinical Governance Lead
**Parent document:** Telecheck Master Platform PRD v1.6, §10 Pillar 5, §11.1
**Companion documents:** Refill Slice PRD v1.0, Herb–Drug Interaction Engine Slice PRD v1.0, AI Clinical Assistant Slice PRD v1.0, Pharmacy Portal Slice PRD v1.0, Labs Slice PRD v1.0, Adverse Event Reporting Slice PRD v1.0, Contracts Pack v5

---

## 1. Purpose and strategic role

The Medication Interaction & Validation Engine is Telecheck's core medication-safety service. It is not a feature — it is infrastructure. Every prescribing decision, every refill, every protocol-authorized action, and every medication list change passes through this engine. If the engine is down, refills stop. If the engine misses a signal, patients are at risk. If the engine over-signals, clinicians lose trust and start ignoring alerts.

The engine checks the patient's full active medication list — plus conditions, labs, and special clinical factors — and produces structured signals that clinicians, protocol engines, pharmacy workflows, and the AI Clinical Assistant consume. It is the shared safety layer that makes every other clinical workflow trustworthy.

This slice defines:
- What the engine checks (five check classes)
- What signals it produces and how they are structured
- How signals are consumed by clinicians, protocol engines, pharmacy, and AI
- How overrides work and are audited
- How the knowledge base is maintained
- How the engine handles incomplete or stale data
- How it interacts with the Herb–Drug Interaction Engine

---

## 2. Traceability

| Master PRD reference | This slice addresses |
|---|---|
| §8 Job 2 — Refill a medication safely | Engine runs at refill Step 4 (safety gate) |
| §8 Job 10 — Review and oversee AI suggestions and protocol-authorized actions | Engine signals are reviewed by clinicians at every decision point |
| §10 Pillar 5 — Medication Interaction & Validation Engine | Full engine definition |
| §11.1 Launch scope — Pharmacy intelligence (shared services) | Engine is a launch capability |
| §11.4 Critical-path subset | Engine is critical-path — its absence means the platform cannot serve a patient safely |
| §13.1 Protocolized clinical autonomy | Engine signals gate protocol-authorized actions |
| §13.4 Platform floor | Engine signals cannot be silently suppressed |

---

## 3. Actors

| Actor | Role with this engine |
|---|---|
| **Clinician** | Primary consumer. Sees engine signals at every prescribing and refill decision point. Can override signals with documented rationale. |
| **Pharmacist** | Secondary consumer. Sees engine signals at the pharmacy release check. Escalates if new signals appeared since prescribing. |
| **Protocol engine** | Automated consumer. Protocol-authorized actions check engine signals before execution. Critical and major signals block protocol execution. |
| **AI Clinical Assistant (Mode 1)** | References engine signals when answering patient questions about medications. Reads signals — does not run the engine. |
| **AI Clinical Assistant (Mode 2)** | Calls the engine as part of protocol evaluation for structured async care pathways. Engine signals are included in the clinical summary. |
| **Herb–Drug Interaction Engine** | Peer service. Produces additive signals in the same format. Independent execution — neither engine blocks the other. |
| **Patient** | Sees engine signals on the medication detail page in patient-appropriate language. Does not see override details. |

---

## 4. Five check classes

The engine performs five distinct check classes. All five run on every evaluation — there is no partial check. This ensures the clinician sees the complete safety picture, not a filtered subset.

### 4.1 Drug–drug interactions

Checks every medication on the patient's active list against every other medication for known pharmacokinetic and pharmacodynamic interactions.

Pharmacokinetic: CYP450 enzyme induction or inhibition (CYP3A4, CYP2D6, CYP1A2, CYP2C9, CYP2C19, CYP2E1), P-glycoprotein transporter interactions, absorption interference, protein binding displacement, renal clearance competition.

Pharmacodynamic: additive toxicity (QT prolongation, serotonin syndrome risk, CNS depression, bleeding risk, nephrotoxicity), antagonistic effects (beta-blocker + beta-agonist), and potentiation (ACE inhibitor + potassium supplement → hyperkalemia risk).

The engine checks pairwise across the full medication list. For a patient on N medications, this is N×(N-1)/2 pairwise checks. The engine must handle polypharmacy patients (10+ medications) within the latency target.

### 4.2 Drug–condition conflicts

Checks each medication against the patient's known conditions for contraindications and cautions.

Examples: metformin contraindicated in severe renal impairment; NSAIDs cautioned in heart failure, renal disease, and GI bleeding history; beta-blockers cautioned in asthma; ACE inhibitors contraindicated in bilateral renal artery stenosis; statins cautioned in active liver disease.

Condition data comes from the patient's condition list (entered via Forms/Intake Engine and updated at clinical touchpoints).

### 4.3 Drug–lab conflicts

Checks each medication against the patient's most recent relevant lab values for values that indicate risk.

Examples: metformin and elevated creatinine/low GFR (renal function); warfarin and elevated INR; statins and elevated LFTs (liver function); potassium-sparing diuretics and elevated potassium; lithium and renal function/thyroid function.

Lab data comes from the Labs Slice. The engine evaluates both current values (is the value in a dangerous range?) and trending values (is the value approaching a dangerous threshold?). If the most recent lab value is older than a configurable staleness threshold, the engine produces a data-quality signal (§10.3).

### 4.4 Pharmacogenomic concerns

At launch, this check class uses reference population data, not individual patient genotype data. It flags medications with known pharmacogenomic variability that may affect efficacy or safety based on population-level prevalence.

Examples: codeine and CYP2D6 ultra-rapid metabolizer risk (particularly relevant in certain West African populations with higher CYP2D6 ultrarapid metabolizer prevalence); warfarin and CYP2C9/VKORC1 variability; clopidogrel and CYP2C19 variability.

Post-launch, real pharmacogenomic data from PGx testing can be integrated. The engine's architecture supports individual genotype data as an input — at launch, it uses population-level flags as a clinical awareness signal rather than a patient-specific dosing recommendation.

### 4.5 Special clinical flags

Checks for clinical scenarios that cross-cut the other four classes:

- **Marrow suppression risk.** Multiple myelosuppressive agents prescribed concurrently.
- **Hemoglobinopathy-aware dosing.** Medications where sickle cell disease or G6PD deficiency affects safety or dosing (relevant for West African patient population).
- **Pregnancy and lactation.** Medications contraindicated or cautioned in pregnancy/lactation, checked against the patient's reported pregnancy/lactation status.
- **Pediatric flags.** Age-inappropriate medications or dosing for patients under 18.
- **Geriatric flags.** Beers Criteria or STOPP/START equivalent flags for patients over 65 — medications that are inappropriate or require dose adjustment in elderly patients.
- **Polypharmacy flag.** When the patient has 5+ active medications, a general polypharmacy alert is produced. This is an awareness signal, not a specific interaction — it prompts the clinician to review the overall medication burden.

---

## 5. Signal model

Every engine evaluation produces zero or more **signals** — structured artifacts that describe a detected risk. The signal model is the contract between the engine and every downstream consumer.

### 5.1 Signal structure

| Field | Description |
|---|---|
| Signal ID | Unique identifier |
| Check class | Which of the five check classes produced this signal |
| Severity | Critical / major / moderate / minor (§5.2) |
| Mechanism | Plain-language and clinical description of why this signal fired |
| Evidence source | Reference to the knowledge base entry, clinical guideline, or dataset |
| Recommended action | Block / warn / monitor (§5.3) |
| Affected entities | Which medications, conditions, lab values, or clinical factors are involved |
| Confidence | High / medium / low |
| Timestamp | When the signal was generated |
| Engine version | Which version of the engine and knowledge base produced the signal |
| Source engine | "medication" (always labeled; distinguishes from herb–drug engine signals) |

### 5.2 Severity definitions

**Critical.** The interaction or conflict poses an immediate, life-threatening, or clinically dangerous risk. Examples: concurrent MAOIs and serotonergic agents (serotonin syndrome); methotrexate and trimethoprim (pancytopenia); warfarin and a strong CYP2C9 inhibitor without dose adjustment (life-threatening bleeding).

**Major.** The interaction or conflict poses clinically significant risk that requires active management. Examples: ACE inhibitor and potassium supplement (hyperkalemia); NSAID and anticoagulant (increased bleeding risk); QT-prolonging drug combination; statin and strong CYP3A4 inhibitor (myopathy/rhabdomyolysis risk).

**Moderate.** The interaction or conflict exists but is manageable with monitoring or dose adjustment. Examples: metformin and alcohol (lactic acidosis risk, monitoring warranted); thiazide diuretic and lithium (lithium toxicity risk, level monitoring); SSRI and NSAID (GI bleeding risk, monitor).

**Minor.** The interaction is theoretical or low-probability based on mechanism of action. Clinical significance is possible but not established. Examples: minor CYP interactions with minimal clinical effect; theoretical pharmacodynamic additive effects below clinical threshold.

### 5.3 Recommended actions

**Block.** The engine recommends that the action should not proceed without clinician review and override. Reserved for critical-severity signals. Protocol-authorized actions cannot execute against a block recommendation.

**Warn.** The engine recommends clinician awareness and active management. The action may proceed with clinician acknowledgment. Protocol-authorized actions may or may not proceed depending on whether the specific signal class is addressed in the approved protocol.

**Monitor.** The engine recommends ongoing monitoring (lab values, symptoms, clinical follow-up). The action may proceed. Signal is visible and logged.

### 5.4 Example signals

These illustrate what clinicians actually see. Each is a real signal the engine would produce for common Ghana-launch medication combinations.

**Example 1 — Critical (drug-drug)**
> **Severity:** Critical · **Action:** Block
> **Sildenafil + Isosorbide mononitrate**
> Mechanism: Concurrent PDE5 inhibitor and nitrate — risk of severe, potentially fatal hypotension. Pharmacodynamic potentiation of vasodilation.
> Recommendation: Do not co-prescribe. If patient requires both, consult cardiology.

**Example 2 — Major (drug-lab)**
> **Severity:** Major · **Action:** Warn
> **Metformin · Patient's GFR = 28 mL/min (lab from 14 days ago)**
> Mechanism: Metformin is contraindicated when GFR < 30 mL/min due to lactic acidosis risk. Current GFR is below threshold.
> Recommendation: Discontinue metformin or obtain updated renal function. If GFR confirmed < 30, switch to alternative.

**Example 3 — Moderate (drug-drug)**
> **Severity:** Moderate · **Action:** Monitor
> **Amlodipine + Atorvastatin (high dose)**
> Mechanism: Amlodipine inhibits CYP3A4, increasing atorvastatin exposure. At atorvastatin doses > 40mg, myopathy/rhabdomyolysis risk increases.
> Recommendation: Limit atorvastatin to 40mg daily when co-prescribed with amlodipine. Monitor for muscle pain.

**Example 4 — Special clinical flag (polypharmacy)**
> **Severity:** Minor · **Action:** Monitor
> **Patient has 7 active medications**
> Mechanism: Polypharmacy (≥5 active medications) increases the risk of adverse drug events, medication errors, and reduced adherence. Seven medications warrant a comprehensive medication review.
> Recommendation: Consider a structured medication review to assess whether all medications are still indicated.

**Example 5 — Special clinical flag (hemoglobinopathy)**
> **Severity:** Major · **Action:** Warn
> **Dapsone · Patient condition: G6PD deficiency**
> Mechanism: Dapsone causes oxidative hemolysis in G6PD-deficient patients. Prevalence of G6PD deficiency is ~15-25% in Ghanaian males.
> Recommendation: Avoid dapsone if G6PD status is confirmed deficient. If G6PD status is unknown and patient is male of West African descent, consider testing before prescribing.

### 5.5 Polypharmacy signal management

When a patient has many active medications, the engine may produce a large number of signals. Signal fatigue is a real clinical risk — if a clinician sees 15 moderate signals, they may dismiss all of them.

**Consolidation rules:**
- If the same drug pair produces signals in multiple check classes (e.g., both pharmacokinetic and pharmacodynamic), the signals are **grouped** under a single presentation card with the highest severity
- The polypharmacy flag (§4.5) is always shown last — it is awareness context, not a specific interaction
- Critical and major signals are always shown individually (never consolidated)
- Moderate and minor signals may be grouped by affected medication: "Atorvastatin has 3 moderate interactions" with expand-to-see-detail

**Signal count limits:** If the engine produces more than 20 signals for a single evaluation, the clinician sees the top signals by severity plus a "View all [N] signals" control. This is a display concern, not a suppression — all signals are logged in audit regardless of display.

---

## 6. When the engine runs

The engine evaluates when:

- **Prescribing.** Before a clinician commits to a medication choice. The engine runs as the clinician selects a medication, not after approval — the clinician sees signals before deciding, not as an after-the-fact warning (ADR-006).
- **Refill.** At Refill Slice Step 4, before clinician review or protocol evaluation.
- **Medication list change.** When a patient or clinician adds, removes, or modifies a medication on the patient's active list. The engine re-evaluates all active medications, not just the changed one.
- **Lab data update.** When new lab values are confirmed (Labs Slice §5.3), the engine re-evaluates drug–lab checks for active medications. New drug–lab signals may appear.
- **Protocol evaluation.** When AI Mode 2 evaluates a structured async care pathway, the engine runs as part of the protocol evaluation pipeline.

### 6.1 Engine timing: before clinician decision

This is a locked architectural decision (ADR-006). The interaction engine runs **before** the clinician commits to a medication choice, not after. The clinician sees "if you prescribe medication X, these are the interaction signals" while they are making the decision, not "you just prescribed medication X and here are the problems." This allows the clinician to adjust their choice before any order enters the system.

### 6.2 Protocol gate rules

Protocol-authorized actions (refill renewals, protocol-authorized prescribing, protocol-authorized dispensing release) consume engine signals as gate criteria:

- **Critical signal with block recommendation:** protocol cannot execute. Falls back to clinician review with the signal prominently flagged.
- **Major signal with warn recommendation:** protocol cannot execute unless the specific signal class is explicitly addressed in the approved protocol. Otherwise falls back to clinician review.
- **Moderate or minor signals:** protocol may execute. All signals are logged in the protocol execution audit.

These gate rules are immutable platform floor behavior. No protocol configuration can relax them.

---

## 7. Signal consumption

### 7.1 Clinician decision surface

At prescribing or refill review, the clinician sees all engine signals for the patient's medication profile, ordered by severity (critical first). For each signal:
- Severity indicator (color-coded: critical red, major orange, moderate yellow, minor gray)
- Mechanism summary (one sentence: what is interacting and why)
- Recommended action (block / warn / monitor)
- Affected medications, conditions, or lab values
- Link to full evidence entry for clinical detail

**Override mechanism.** The clinician can override any signal to proceed with the prescribing or refill decision. Override requires:
- Clinician identity (authenticated)
- Rationale text (free text, minimum 10 characters — prevents empty overrides)
- Acknowledgment of the signal (confirm they have read and understood the risk)

Override is recorded as: clinician ID, signal ID, engine version, rationale text, timestamp. Critical-signal overrides are flagged in the operations dashboard and feed the adverse event correlation system.

### 7.2 Pharmacy decision surface

At the pharmacy release check (Pharmacy Portal Slice §5.4), the pharmacist sees all engine signals that were active at approval time. If the patient's medication list changed between approval and dispensing, the engine may have re-run and produced new signals. New signals since approval are highlighted — the pharmacist escalates if new critical or major signals appeared.

### 7.3 AI Clinical Assistant

**Mode 1:** When a patient asks about their medications ("Can I take X with Y?" or "What are the side effects of my medication?"), Mode 1 references the engine's signal data. It does not run the engine — it reads signals already produced at the last evaluation. It presents signals in patient-appropriate language, never suppresses them, and offers escalation to a clinician.

**Mode 2:** Calls the engine as part of protocol evaluation. All five check classes run against the patient's full medication profile. Engine signals are included in the clinical summary for physician review.

### 7.4 Patient-facing signals

Patients see interaction signals on their medication detail page. The presentation is calm and informative, not alarming:
- "This medication may interact with [other medication]. Your doctor is aware."
- "Your doctor reviewed this interaction and approved your medication." (when overridden)

Patients do not see override rationale or severity classifications. They see the outcome: reviewed and approved, or flagged for discussion.

---

## 8. Interaction with the Herb–Drug Interaction Engine

The Herb–Drug Interaction Engine is a peer service that produces signals in the same format as this engine. The relationship is defined here as the authoritative statement.

**Shared signal model.** Both engines produce signals with the same structure (§5.1). The Herb–Drug Engine adds an evidence-quality field (established/emerging/theoretical) that this engine does not need (drug–drug interaction evidence is generally well-characterized).

**Signals are additive.** A herb–drug signal does not cancel or modify a medication engine signal. Both are presented side by side. If a medication has both a drug–drug interaction signal and a herb–drug interaction signal, the clinician sees both.

**Source labeling.** Every signal is labeled with its source engine ("medication" or "herb-drug"). Clinicians always know which engine produced the signal.

**Independent execution.** The two engines run independently. A failure in the herb–drug engine does not prevent the medication engine from running. If the herb–drug engine is unavailable, the medication engine still runs normally and the patient's herbal medicine list is flagged as "not checked — herb–drug engine unavailable."

**Combined reporting.** In dashboards and aggregate metrics, signals can be reported per engine or combined. Override rates, signal rates, and severity distributions are tracked per engine.

---

## 9. Knowledge base

### 9.1 Data sources

The engine's knowledge base draws from:
- Peer-reviewed drug interaction databases (e.g., Lexicomp, Clinical Pharmacology, or equivalent)
- Regulatory agency databases (FDA, WHO)
- Published clinical guidelines for condition-specific contraindications
- Pharmacogenomic reference data (CPIC, PharmGKB)
- Ghana-specific formulary data for market-relevant medication coverage

### 9.2 Coverage scope

At launch, the knowledge base covers all medications in the Ghana launch formulary plus common global medications patients may report from prior care. The formulary database used by the Forms/Intake Engine for medication autocomplete defines the coverage boundary.

Medications not in the knowledge base produce a coverage-gap signal: "No interaction data available for [medication]. Clinician review recommended." This signal is visible to the clinician and does not block the workflow.

### 9.3 Knowledge base governance

Updates follow the protocolized governance model (Master PRD §13.5):

- **Clinical review required.** Every new interaction entry and every severity change requires review by a qualified clinical pharmacist or pharmacologist.
- **Versioning.** Every update is versioned. Signals produced under version N can be traced to the rules active at that time.
- **Test coverage.** Knowledge base changes are tested against a validation suite before deployment. Changes that alter the severity or recommended action of existing signals trigger review of active patients affected.
- **Rollback capability.** A knowledge base update can be rolled back to the previous version if issues are discovered.
- **Review cadence.** 12-month cycle for the full knowledge base. High-severity entries (critical/major) reviewed on a 6-month cycle. New entries reviewed at 3 months after deployment.

---

## 10. Edge cases

### 10.1 Incomplete medication list

If the patient's medication list has a low completeness confidence tag (Forms/Intake Engine Slice §6.1 Step 4), the engine runs on available data and produces a data-quality signal: "Medication list may be incomplete. Interaction check was performed on reported medications only. Additional interactions are possible if the patient is taking unreported medications."

This signal is visible to the clinician. It does not block the workflow but alerts the clinician to exercise additional caution. Protocol-authorized actions can still execute if the completeness tag is medium or higher — they cannot execute if the tag is "not reported."

### 10.2 Duplicate medications

If the patient's medication list contains duplicate entries (same medication listed twice, possibly from different sources), the engine flags the duplication: "Possible duplicate: [medication] appears twice on the active list. Verify with the patient."

### 10.3 Stale lab data

If the most recent lab value relevant to a drug–lab check is older than a configurable staleness threshold (recommend 90 days for most labs, 30 days for INR/anticoagulation monitoring), the engine flags the staleness: "Lab value for [test] is [X days] old. Current value may differ. Consider ordering updated labs."

This signal is informational — it does not block the workflow but alerts the clinician that the drug–lab check is based on potentially outdated data.

### 10.4 New medication added to existing regimen

When a new medication is added, the engine re-evaluates the entire active list, not just the new medication. This ensures that three-way or multi-drug interaction patterns are caught (e.g., adding drug C creates a dangerous combination with existing drugs A and B that was not dangerous when only A and B were present).

### 10.5 Medication discontinued

When a medication is discontinued, the engine re-evaluates the remaining active list. Signals that were produced by the now-discontinued medication are cleared. The re-evaluation may also clear signals on other medications that were only flagged because of the discontinued medication.

---

## 11. Performance

### 11.1 Latency target

The engine must complete a full five-class evaluation within **2 seconds** for a typical patient profile (5–10 active medications, 3–5 active conditions, recent lab values available). This is measured from request to signal response, not including network latency to the calling service.

For polypharmacy patients (15+ medications), the target extends to 5 seconds. If the engine exceeds the timeout, it returns partial results with a flag indicating which check classes completed and which timed out. Timed-out classes are retried asynchronously and results are delivered when available.

### 11.2 Availability target

The engine is critical-path infrastructure. Target availability: 99.9% uptime during operating hours. Downtime procedures: if the engine is unavailable, refill and prescribing workflows hold and retry (§9.1 of Refill Slice). The platform does not allow medication decisions to bypass the engine.

---

## 12. Audit

Every engine evaluation is audited:

| Event | What is recorded |
|---|---|
| Engine invoked | Trigger (prescribing, refill, medication change, lab update, protocol evaluation), patient ID, timestamp |
| Input data | Full medication list (with versions), condition list, lab values consumed, pregnancy/lactation status, age |
| Evaluation completed | Engine version, knowledge base version, duration, all signals produced (signal IDs, severity, check class) |
| No signals | Explicitly recorded — "engine ran, no signals produced" is a positive result, not missing data |
| Override | Clinician ID, signal ID overridden, rationale, timestamp |
| Engine unavailable | Timestamp, duration, calling service, fallback action taken |

Audit records are retained per Contracts Pack v5 retention rules. Engine audit is clinical decision support data and retained at the strictest applicable requirement.

---

## 13. Metrics

**Signal quality**
- Signal rate per evaluation (by severity and check class) — calibration signal for knowledge base quality
- Override rate (clinician overrides of signals, by severity) — if override rate is too high, signals may be over-sensitive; if too low, signals may not be surfacing real issues
- Override rate for critical signals specifically — should be very low; high critical override rate is a safety concern
- False-positive rate (signals that clinicians consistently override without clinical concern — tracked over time to recalibrate)
- Missed-signal rate (adverse events that correlate with medications the engine did not flag — tracked via adverse event reporting feedback loop)

**Coverage**
- Formulary coverage rate (% of patient-reported medications in the knowledge base)
- Coverage-gap signal rate (how often patients report medications not in the knowledge base)
- Check class completion rate (% of evaluations where all five classes completed within timeout)

**Performance**
- Average evaluation latency (target: under 2 seconds)
- P95 evaluation latency
- Timeout rate
- Availability (uptime %)

**Clinical impact**
- Prescribing decisions changed after seeing engine signals (tracked when clinician changes medication selection post-signal display)
- Refills declined or modified due to engine signals
- Protocol fallback rate due to engine signals
- Adverse events in patients with active engine signals (correlation tracking)

---

## 14. Dependencies

- **Identity & Authentication Spec v1.0.** Authenticated patient, clinician, pharmacist, moderator, admin, and delegate sessions are required for every actor surface this slice uses.
- **Refill Slice.** Engine runs at refill Step 4. Refill cannot proceed without engine evaluation.
- **Pharmacy Portal Slice.** Engine signals are visible at the pharmacy release check. New signals since approval trigger pharmacist escalation.
- **AI Clinical Assistant Slice.** Mode 1 reads engine signals. Mode 2 calls the engine. Engine must be operational for Mode 2.
- **Herb–Drug Interaction Engine Slice.** Peer service producing additive signals in the same format. Independent execution.
- **Labs Slice.** Lab data feeds drug–lab checks. Engine re-evaluates when new lab data is confirmed.
- **Forms / Intake Engine Slice.** Medication list and condition list from intake feed the engine. Completeness tags inform engine behavior.
- **Adverse Event Reporting Slice.** Override correlation detection depends on engine audit data. Missed-signal analysis depends on engine evaluation records.
- **RPM/CCM Slice.** Medication changes from RPM clinical reviews trigger engine re-evaluation. Drug–lab signals are visible in RPM dashboards.
- **Consent & Delegated Access Slice.** Engine operates within the patient's consent boundary — it does not evaluate medications the patient has not consented to share.
- **Formulary database.** Medication names, formulations, and interaction profiles come from the knowledge base which depends on a structured formulary.
- **Contracts Pack v5.** Override rules, audit retention, and signal enforcement are governed by the contracts pack.

---

## 15. Open questions (slice-level)

1. **Knowledge base vendor.** Which drug interaction database powers the engine at launch? Lexicomp, Clinical Pharmacology, or a combination? What is the licensing model and Ghana-market coverage?
2. **Signal deduplication.** When a drug pair triggers both a pharmacokinetic and a pharmacodynamic interaction, are these presented as two signals or consolidated into one? Two signals is more precise; one signal is less noisy.
3. **Weight-based dosing.** Should the engine flag weight-based dosing concerns (e.g., medication dose appears high for the patient's weight)? This crosses into dosing validation beyond interaction checking.
4. **Multi-prescriber visibility.** When signals involve medications prescribed by different clinicians, should both prescribers be notified, or only the clinician currently prescribing/reviewing?
5. **Patient-reported OTC medications.** How are patient-reported OTC medications (aspirin, ibuprofen, antacids) handled? Are they treated identically to prescribed medications for interaction checking purposes?
6. **Signal fatigue threshold.** At what point does signal volume for a single patient become counterproductive? Should the engine consolidate or prioritize signals when a polypharmacy patient generates 10+ moderate/minor signals?
7. **Pediatric and geriatric dosing databases.** What are the data sources for age-specific dosing flags? Are standard Western geriatric criteria (Beers Criteria) applicable to the Ghana patient population, or do Ghana-specific criteria need to be developed?
8. **Engine versioning cadence.** How often are engine updates deployed? Is there a freeze period around launch, or does the engine update continuously?

---

## Document control

- **v1.0** — Initial Medication Interaction & Validation Engine Slice PRD. Defines five check classes (drug–drug, drug–condition, drug–lab, pharmacogenomic, special clinical flags), structured signal model with severity (critical/major/moderate/minor) and recommended action (block/warn/monitor), signal consumption by clinicians, pharmacists, protocol engines, and AI, override mechanism with audit, knowledge base governance, interaction with Herb–Drug Interaction Engine (shared signal model, additive signals, independent execution), edge case handling (incomplete lists, stale labs, duplicates, multi-drug patterns), performance targets (2-second latency, 99.9% availability), and protocol gate rules as immutable platform floor. Derived from Master PRD v1.6 §10 Pillar 5 and ADR-006.
- **Next review:** after knowledge base vendor is selected (Q1); after first 90 days of operation provide signal quality data for calibration; after pharmacogenomic data sources are identified for real PGx integration.
- **Change discipline:** changes to the five check classes, signal model, severity definitions, protocol gate rules, override mechanism, or knowledge base governance require explicit owner sign-off and must be validated against the Refill Slice PRD, the Herb–Drug Interaction Engine Slice PRD (shared signal model compatibility), and the Contracts Pack v5.
