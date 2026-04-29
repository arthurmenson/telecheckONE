# Telecheck — Protocol Library: Ghana Launch

**Version:** 1.0
**Status:** Canonical for development; clinical content review required before deployment
**Owner:** Clinical Governance Lead
**Parent documents:** Master PRD v1.6 §13.1, Refill Slice PRD v1.0, Admin Configuration Surfaces Slice PRD v1.0, Contracts Pack 00-INVARIANTS.md
**Launch blocker:** Master PRD §23 Q1

---

## 1. Purpose

This document defines the actual protocol content for Ghana launch — the clinical logic that the protocol engine executes. Without this, protocol-authorized pathways cannot activate, and every refill and every dispensing action requires explicit clinician review.

**What this document is:** The complete protocol specification including eligibility criteria, check gates, approved actions, exception handling, and accountability assignments.

**What this document is not:** A clinical guideline. These protocols are not clinical recommendations — they are automation rules for actions that a clinician has already established as appropriate for a patient. The clinical judgment was made at the initial prescribing decision. The protocol handles the routine repetition.

---

## 2. Protocol governance rules (from Contracts Pack)

Every protocol in this library must comply with:

- **PROTO-001:** Activation requires clinical approval, regulatory sign-off (MDC/PCN), test suite pass, audit visibility, and rollback capability
- **PROTO-002:** Review cadence: 6 months for high-risk, 12 months for standard. Expired protocols auto-deactivate.
- **PROTO-003:** Incident rate crossing threshold triggers off-cycle review
- **PROTO-004:** One-action deactivation, effective within 60 seconds
- **SIGNAL-004:** Critical interaction signals block protocol execution (fallback to clinician review)
- **FLOOR-001:** No protocol may prescribe outside its bounded scope

---

## 3. Ghana launch protocol set

### 3.1 Protocol: Refill Renewal — Metformin (Diabetes)

| Field | Value |
|---|---|
| **Protocol ID** | `refill_renewal_metformin_v1` |
| **Version** | 1.0 |
| **Risk classification** | Standard |
| **Review cadence** | 12 months |
| **Accountable clinician** | [Named clinician — to be assigned at activation] |

**Eligibility criteria (all must be true):**
- Patient has an active prescription for metformin written by a Telecheck clinician
- Prescription has remaining refills (refills_used < refills_allowed)
- Patient has had at least one clinician-reviewed consult in the past 6 months
- Patient has confirmed their medication list within the past 90 days
- Patient's most recent HbA1c (if available) is ≤ 10% (if >10%, clinician review required)
- Patient has no active critical or major interaction signals involving metformin
- Patient has not reported a new adverse event in the past 30 days
- Patient's renal function (eGFR if available) is ≥ 30 mL/min (if <30, clinician review)

**Check gates (run at protocol execution time):**
1. Interaction engine: run all 5 check classes against current medication list + herbal medicines
2. If any critical signal: BLOCK → fallback to clinician review
3. If any major signal not previously addressed: BLOCK → fallback to clinician review
4. If any new moderate signal since last refill: FLAG → include in approval record but do not block
5. Herb-drug engine: run herb-drug checks if herbal medicines are reported
6. If any herb-drug critical signal: BLOCK → fallback to clinician review

**Approved action on pass:**
- Approve refill for the same medication, strength, formulation, and quantity as the active prescription
- Transmit to pharmacy for fulfillment
- Notify patient: "Your metformin refill has been approved under your care program"
- Log: protocol_id, protocol_version, all check results, patient context snapshot

**Exception handling:**
- If eligibility check fails: queue for clinician review with reason
- If interaction engine unavailable: queue for clinician review (never auto-approve without check, per SIGNAL-001)
- If patient has changed herbal medicine list since last refill: queue for clinician review

**Pre-authorization window:** 3 months (protocol re-evaluates eligibility at each refill within the window; a fresh prescribing decision resets the window)

---

### 3.2 Protocol: Refill Renewal — Antihypertensives (Amlodipine, Lisinopril)

| Field | Value |
|---|---|
| **Protocol ID** | `refill_renewal_antihypertensive_v1` |
| **Version** | 1.0 |
| **Risk classification** | Standard |
| **Review cadence** | 12 months |
| **Accountable clinician** | [To be assigned] |

**Eligibility criteria:**
- Active prescription for amlodipine or lisinopril from Telecheck clinician
- Remaining refills
- Clinician-reviewed consult in past 6 months
- Medication list confirmed within 90 days
- Most recent blood pressure (if RPM enrolled): systolic ≤ 180 and diastolic ≤ 110 (if higher, clinician review)
- No active critical or major interaction signals
- No new adverse event in past 30 days
- For lisinopril: pregnancy status confirmed as not_pregnant (if pregnant or unknown, clinician review)
- For lisinopril: most recent potassium (if available) < 5.5 mEq/L (if ≥ 5.5, clinician review)

**Check gates:** Same pattern as metformin protocol (interaction engine + herb-drug engine)

**Approved action:** Same pattern (approve same medication/strength/quantity, transmit, notify, log)

**Exception handling:** Same pattern (eligibility fail → clinician, engine unavailable → clinician)

---

### 3.3 Protocol: Refill Renewal — Statins (Atorvastatin)

| Field | Value |
|---|---|
| **Protocol ID** | `refill_renewal_statin_v1` |
| **Version** | 1.0 |
| **Risk classification** | Standard |
| **Review cadence** | 12 months |
| **Accountable clinician** | [To be assigned] |

**Eligibility criteria:**
- Active prescription for atorvastatin from Telecheck clinician
- Remaining refills
- Clinician-reviewed consult in past 6 months
- Medication list confirmed within 90 days
- No active critical or major interaction signals
- No new adverse event in past 30 days
- Most recent liver function (ALT if available): < 3x upper limit of normal (if ≥ 3x, clinician review)
- Patient has not reported new unexplained muscle pain (if reported, clinician review for rhabdomyolysis risk)

**Check gates, approved action, exception handling:** Same pattern as above protocols.

---

### 3.4 Protocol: GLP-1 Renewal

| Field | Value |
|---|---|
| **Protocol ID** | `refill_renewal_glp1_v1` |
| **Version** | 1.0 |
| **Risk classification** | High |
| **Review cadence** | 6 months |
| **Accountable clinician** | [To be assigned] |

**Eligibility criteria:**
- Active prescription for approved GLP-1 agonist from Telecheck clinician
- Remaining refills
- Clinician-reviewed consult in past 3 months (shorter window for high-risk)
- Medication list confirmed within 60 days
- No active critical or major interaction signals
- No new adverse event in past 30 days
- Patient has not reported persistent nausea/vomiting lasting >2 weeks
- Patient has not reported signs of pancreatitis (severe abdominal pain)
- If weight-management indication: weight recorded within past 30 days

**Check gates:** Same interaction engine + herb-drug pattern, with additional:
- Check for new contraindications (personal or family history of medullary thyroid carcinoma, MEN 2)
- If patient has reported GI symptoms in check-in: FLAG (do not block, but include in record)

**Approved action:** Same pattern.

**Note:** GLP-1 is classified as high-risk because of the pancreatitis concern and the narrower monitoring window. 6-month review cadence reflects this.

---

### 3.5 Protocol: ED Medication Renewal

| Field | Value |
|---|---|
| **Protocol ID** | `refill_renewal_ed_v1` |
| **Version** | 1.0 |
| **Risk classification** | Standard |
| **Review cadence** | 12 months |
| **Accountable clinician** | [To be assigned] |

**Eligibility criteria:**
- Active prescription for approved ED medication (sildenafil, tadalafil) from Telecheck clinician
- Remaining refills
- Clinician-reviewed consult in past 6 months
- Medication list confirmed within 90 days
- No active critical or major interaction signals
- No new adverse event in past 30 days
- Patient not currently taking nitrates (absolute contraindication — if nitrate detected in medication list, BLOCK)
- Patient has not reported cardiovascular symptoms (chest pain, syncope, palpitations) since last consult

**Check gates:** Interaction engine must specifically verify no nitrate interaction (critical block).

**Sensitive-category note:** ED prescriptions are sensitive-category (sexual_health). Protocol must respect FLOOR-006 for delegate visibility.

---

### 3.6 Protocol: Low-Risk Dispensing Release

| Field | Value |
|---|---|
| **Protocol ID** | `dispensing_release_low_risk_v1` |
| **Version** | 1.0 |
| **Risk classification** | Standard |
| **Review cadence** | 12 months |
| **Accountable clinician** | [To be assigned — may be pharmacist for this protocol] |

**Scope:** Authorizes pharmacy release of approved refills without a second pharmacist sign-off, for medications classified as low-risk for dispensing errors.

**Eligible medication classes:**
- Oral tablets/capsules with standard packaging (no cold-chain, no controlled substance)
- Metformin, amlodipine, atorvastatin, lisinopril, omeprazole, multivitamins

**Not eligible (always require pharmacist release check):**
- Injectables (including GLP-1)
- Controlled substances
- Cold-chain medications
- Narrow therapeutic index medications (warfarin, lithium, digoxin, phenytoin)
- Medications with active counterfeit flags

**Check gates:**
1. Medication is in the low-risk dispensing class list
2. No new interaction signals since approval
3. No counterfeit detection signal on the stock unit
4. Labeling generated from approved content (not manually written)
5. Quantity matches the prescription

**Approved action:** Release medication for delivery/pickup without additional pharmacist review step.

---

### 3.7 Protocol: Emergency Routing

| Field | Value |
|---|---|
| **Protocol ID** | `emergency_routing_v1` |
| **Version** | 1.0 |
| **Risk classification** | High |
| **Review cadence** | 6 months |
| **Accountable clinician** | [To be assigned] |

**Trigger conditions:**
- AI assistant detects emergency keywords or crisis content (FLOOR-021)
- RPM metric crosses critical threshold
- Patient selects "I need emergency help" in any surface
- Community crisis detection triggers

**Protocol action (not clinical — routing only):**
1. Display emergency contact numbers (Ghana emergency services, patient's emergency contact)
2. Display patient's cached medications, allergies, and conditions (for emergency responders)
3. If RPM critical: notify accountable clinician immediately via SMS
4. If community crisis: notify safety team via SMS
5. Log the emergency routing event
6. Do NOT provide clinical advice, triage, or reassurance (FLOOR-003)

**This protocol never makes a clinical determination.** It routes to appropriate human responders.

---

## 4. Protocol activation sequence for Ghana

| Order | Protocol | Activation timing |
|---|---|---|
| 1 | Emergency Routing | T-0 (launch day, always active) |
| 2 | Refill Renewal — Metformin | T+8 weeks (after 60 days of clinician-review data) |
| 3 | Refill Renewal — Antihypertensives | T+8 weeks (same batch) |
| 4 | Refill Renewal — Statins | T+8 weeks (same batch) |
| 5 | Low-Risk Dispensing Release | T+8 weeks (same batch, contingent on pharmacy readiness) |
| 6 | Refill Renewal — ED | T+12 weeks (90-day review, after initial protocols prove stable) |
| 7 | GLP-1 Renewal | T+12 weeks (90-day review, high-risk classification) |

**Rationale:** Emergency routing is always on. Refill renewal protocols activate after 60 days of clinician-review data establishes baseline override rates and adverse event patterns. High-risk protocols (GLP-1) and sensitive-category protocols (ED) wait for 90 days.

---

## 5. Protocol test suite requirements

Each protocol must pass the following test categories before activation:

| Test category | Description | Minimum cases |
|---|---|---|
| Happy path | Eligible patient, no signals, approval proceeds | 10 |
| Signal blocking | Critical signal present, protocol correctly falls back to clinician | 5 |
| Eligibility failure | Each eligibility criterion fails individually, protocol correctly rejects | 1 per criterion |
| Engine unavailable | Interaction engine timeout, protocol correctly falls back | 3 |
| Boundary conditions | Values at exact thresholds (HbA1c = 10.0, eGFR = 30, BP = 180/110) | 1 per threshold |
| Concurrent modification | Patient medication list changes during protocol execution | 3 |
| Delegation context | Delegate-initiated refill processed correctly with audit trail | 3 |
| Audit completeness | Every execution produces complete audit record | Verified on all cases |

---

## 6. Clinical content requiring domain expert review

The following items in this document require review and sign-off by a licensed clinician before protocol activation:

| Item | Requires |
|---|---|
| Lab value thresholds (HbA1c ≤ 10%, eGFR ≥ 30, ALT < 3x ULN, K+ < 5.5) | Clinician review — are these the right thresholds for protocol-authorized renewal? |
| Blood pressure thresholds (systolic ≤ 180, diastolic ≤ 110) | Clinician review — should the threshold be tighter for protocol automation? |
| Consultation recency windows (3 months for GLP-1, 6 months for others) | Clinician review — are these clinically appropriate? |
| Medication list confirmation windows (60 days for GLP-1, 90 days for others) | Clinician review — adequate for safety? |
| Low-risk dispensing class list | Pharmacist + clinician review — is the class list appropriate? |
| GLP-1 symptom flags (nausea, pancreatitis signs) | Clinician review — are the right symptoms flagged? |
| ED nitrate contraindication check | Clinician review — complete contraindication list? |
| Pre-authorization windows (3 months standard, implicit in criteria) | Clinician review — appropriate duration? |

---

## Document control

- **v1.0** — Initial Protocol Library for Ghana launch. 7 protocols defined: 5 refill renewal (metformin, antihypertensives, statins, GLP-1, ED), 1 dispensing release, 1 emergency routing. Activation sequence defined. Test suite requirements specified. Clinical content items flagged for domain expert review.
- **Next review:** Clinical Governance Lead reviews all clinical thresholds and eligibility criteria. MDC/PCN regulatory sign-off before activation. Test suites authored and executed per §5 before any protocol activates.
- **Change discipline:** Changes to eligibility criteria, check gates, or approved actions require Clinical Governance Lead sign-off and protocol version bump. Threshold changes require clinician review.
