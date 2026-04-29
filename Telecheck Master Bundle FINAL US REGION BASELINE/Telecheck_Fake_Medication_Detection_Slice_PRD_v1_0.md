# Telecheck — Fake Medication Detection Slice PRD

**Version:** 1.0
**Status:** Canonical for development
**Owner:** Pharmacy Operations Lead
**Parent document:** Telecheck Master Platform PRD v1.6, §10 Pillar 5, §11.1, §11.3
**Companion documents:** Pharmacy Portal Slice PRD v1.0, Adverse Event Reporting Slice PRD v1.0, Market Rollout Cockpit Slice PRD v1.0

---

## 1. Purpose and strategic role

Counterfeit and substandard medications are a public health crisis in West Africa and across emerging markets. The WHO estimates that 1 in 10 medical products in low- and middle-income countries is substandard or falsified. In sub-Saharan Africa, the rate is higher. Patients receive medications that contain the wrong active ingredient, the wrong dose, no active ingredient at all, or toxic contaminants. The consequences range from treatment failure to death.

Telecheck cannot solve the global counterfeit medication problem. But it can build a detection layer into its pharmacy workflow that flags suspicious stock before it reaches the patient. This module operates as an **advisory signal** at launch — it surfaces concerns to the pharmacist and clinician for human review, never to the patient as a definitive verdict. This advisory posture reflects the real false-positive risk in counterfeit detection systems and protects pharmacy-partner trust while the reference data matures.

Over time, as the reference data strengthens and false-positive rates are validated, the module can expand: patient-visible signals, automated hold-for-investigation, and supply chain intelligence reporting to regulatory bodies. But at launch, the priority is building the detection foundation without creating false alarms that damage pharmacy operations or patient trust.

This slice defines:
- What the module detects and how
- What signals it produces and who sees them
- How it integrates with the pharmacy workflow
- How the reference data is built and maintained
- What happens when a detection flag is confirmed or dismissed
- Why patient-facing signals are deferred

---

## 2. Traceability

| Master PRD reference | This slice addresses |
|---|---|
| §10 Pillar 5 — Fake medication detection | Module definition |
| §11.1 Launch scope — Fake medication detection | Launch capability (advisory) |
| §11.3 Launch activation — Patient-visible fake-med signals | Patient-visible signals activate after false-positive rates validated |
| §13.4 Platform floor | Safety-critical detection feeds the always-on audit trail |
| §22 Risks — Counterfeit-detection false positives | Advisory posture mitigates pharmacy-partner trust damage |
| Pharmacy Portal Slice §7.4 | Counterfeit flag handling in the pharmacy workflow |
| Adverse Event Reporting Slice §4.2 | Counterfeit-medication-related adverse events |

---

## 3. Actors

| Actor | Role with this module |
|---|---|
| **Pharmacist** | Primary consumer of detection signals. Reviews flags during fulfillment, decides whether to proceed, hold, or reject the stock unit. Documents decisions. |
| **Pharmacy Operations Lead** | Reviews detection metrics, manages reference data partnerships, escalates confirmed counterfeits to regulatory authorities. |
| **Clinician** | Notified if a detection flag leads to medication unavailability or substitution. May be involved if a patient has already received a subsequently-flagged medication. |
| **Patient** | Does **not** see detection signals at launch. Post-launch, patient-visible signals activate after false-positive rate validation. |
| **Regulatory & Partner Affairs Lead** | Reports confirmed counterfeits to Ghana FDA. Manages the regulatory reporting relationship for counterfeit medication data. |
| **Market Rollout Cockpit** | Detection metrics and confirmed-counterfeit incidents are visible in the cockpit. Patient-visible signal activation is managed through the cockpit's activation review flow. |

---

## 4. Detection methods

The module uses multiple detection methods. No single method is definitive — signals from multiple methods are combined to produce a confidence-weighted detection flag.

### 4.1 Product verification codes

Many pharmaceutical manufacturers include verification mechanisms on packaging: scratch-off codes revealing a unique identifier, SMS verification codes, QR codes linking to manufacturer databases, or RFID/NFC tags.

**How it works in Telecheck:**
- During fulfillment (Pharmacy Portal Slice §5.3), the pharmacist or technician scans or enters the verification code from the packaging
- The platform queries the manufacturer's verification database (where available and integrated)
- Response: verified (code is valid and matches the product), unverified (code is invalid, already used, or not in the database), or unavailable (no verification database for this manufacturer)

**Launch posture:** Verification code checking is available for manufacturers with accessible verification databases. Coverage depends on manufacturer partnerships. Not all medications in the launch formulary will have verification code support.

### 4.2 Visual packaging inspection

The pharmacist or technician photographs the medication packaging. The image is compared against a reference image library of legitimate packaging for the specific medication, manufacturer, and batch.

**What the comparison checks:**
- Logo and branding consistency (color, font, placement)
- Packaging quality indicators (print quality, material quality, hologram presence and quality)
- Batch number format consistency
- Expiry date format consistency
- Barcode/serial number format consistency
- Known counterfeit packaging patterns (documented fakes)

**Launch posture:** The reference image library is built for the launch formulary's most-prescribed medications. Coverage is limited to medications where sufficient legitimate packaging images are available. The comparison produces a similarity score, not a binary real/fake verdict.

### 4.3 Batch number validation

The platform maintains a database of known legitimate batch numbers for medications in the formulary, sourced from manufacturers and distributors.

**How it works:**
- The pharmacist enters or scans the batch number during fulfillment
- The platform checks the batch number against the known-legitimate database
- Response: known (batch number is in the database), unknown (batch number is not in the database — may be legitimate but not yet recorded, or may be counterfeit), or flagged (batch number matches a known-counterfeit batch)

**Launch posture:** Batch number databases are built through manufacturer and distributor partnerships. Coverage is partial — not all manufacturers share batch data. An "unknown" batch number is not treated as a counterfeit signal; it produces a data-gap signal similar to the interaction engine's coverage-gap signal.

### 4.4 Supply chain provenance

For medications procured through the platform pharmacy's own supply chain, provenance tracking records the chain of custody from manufacturer or authorized distributor to the platform pharmacy.

**What is tracked:**
- Procurement source (manufacturer direct, authorized distributor, secondary distributor)
- Chain of custody documentation
- Storage conditions during transit (where cold-chain monitoring is available)
- Receipt inspection results

**Launch posture:** Provenance tracking applies to the platform pharmacy's inventory only. Partner pharmacy provenance is the partner's responsibility — the platform does not audit partner supply chains at launch (though the partner pharmacy agreement may include supply chain quality commitments).

### 4.5 Pharmacovigilance signal correlation

If adverse event reports correlate with a specific batch number, manufacturer, or medication source, the module flags other stock units from the same batch or source.

**How it works:**
- The Adverse Event Reporting system (Adverse Event Reporting Slice §7.3) tags confirmed counterfeit-related adverse events with batch numbers and sources
- The detection module cross-references active inventory against flagged batches/sources
- Matching stock units are flagged for pharmacist review

**Launch posture:** This method depends on accumulating adverse event data, so its value increases over time. At launch, it provides a feedback loop from harm to prevention.

---

## 5. Signal model

### 5.1 Detection signal structure

Each detection produces a signal:

| Field | Description |
|---|---|
| Signal ID | Unique identifier |
| Stock unit identifier | Which specific unit of medication is flagged (batch number, serial number if available) |
| Medication | Medication name, formulation, strength, manufacturer |
| Detection method(s) | Which method(s) produced the signal (verification code, visual, batch, provenance, pharmacovigilance) |
| Confidence | High / medium / low — weighted by the number of methods contributing and the strength of each method's result |
| Detail | Specific finding per method (e.g., "verification code invalid," "visual similarity score 62%," "batch number unknown") |
| Recommended action | Review (pharmacist should inspect), hold (pharmacist should not release until investigated), or reject (known counterfeit batch) |
| Timestamp | When the signal was generated |
| Engine version | Module version and reference data version |

### 5.2 Confidence weighting

Multiple methods contributing to the same signal increase confidence:
- Single method with weak signal (e.g., unknown batch number alone): **low confidence** → recommended action: review
- Single method with strong signal (e.g., verification code invalid): **medium confidence** → recommended action: hold
- Multiple methods with consistent signals (e.g., verification code invalid + visual anomaly + unknown batch): **high confidence** → recommended action: reject
- Pharmacovigilance correlation (batch linked to an adverse event): **medium-high confidence** regardless of other methods → recommended action: hold

### 5.3 What the signal does NOT say

The signal never says "this medication is counterfeit." It says "this stock unit has been flagged for review based on [detection methods]." The distinction is critical for:
- Legal protection (a definitive counterfeit claim has legal consequences)
- Pharmacy-partner trust (false accusations damage relationships)
- Patient trust (premature counterfeit claims cause panic)

---

## 6. Who sees what

### 6.1 Pharmacist (at launch)

The pharmacist sees detection signals during the fulfillment workflow (Pharmacy Portal Slice §5.3 pick step and §5.4 release check):
- A flag on the specific stock unit being picked, with confidence level and detection method detail
- Recommended action: review, hold, or reject
- The pharmacist inspects the medication (physically examines packaging, checks codes, compares to reference)
- The pharmacist decides: proceed with release, hold for investigation, or reject and source alternative stock
- The pharmacist's decision is documented with rationale

### 6.2 Clinician (at launch)

The clinician is notified only if a detection flag leads to:
- Medication unavailability (the flagged stock was rejected and no alternative is available)
- Substitution requirement (the clinician must approve a substitute)
- Patient impact (a patient has already received medication from a batch subsequently flagged)

The clinician does not routinely see detection signals — they are a pharmacy workflow concern unless they affect clinical care.

### 6.3 Patient (NOT at launch)

The patient does **not** see detection signals at launch. This is a deliberate, documented decision (Master PRD §11.3):

**Why patient-visible signals are deferred:**
- False-positive risk. If the module flags a legitimate medication as suspicious, and the patient sees the flag, the patient may refuse to take a safe medication. This is a direct patient safety risk — a diabetic patient who refuses their metformin because of a false flag is worse off than a patient who takes unverified metformin.
- Trust damage. A patient who sees a counterfeit flag on their medication loses trust in the pharmacy, the platform, and potentially the healthcare system. If the flag was false, the trust damage is unrecoverable.
- Panic and confusion. Patients are not equipped to evaluate counterfeit detection signals. "Your medication may not be authentic" without clinical context creates panic, not informed decision-making.

**When patient-visible signals activate:**
- After the module has operated for a sufficient period (recommend minimum 6 months) to establish false-positive rates
- After false-positive rates are below a defined threshold (recommend < 2% of flagged stock units are confirmed legitimate after investigation)
- After the patient-facing language and experience have been designed and tested
- After activation through the Market Rollout Cockpit's activation review flow with clinical governance and regulatory sign-off

**What patient-visible signals will look like (post-launch):**
- Not "your medication is counterfeit" but "your medication has been verified" (positive framing for verified stock) or "we were unable to verify this medication and are investigating" (for flagged stock that has not been resolved)
- Verification status appears on the medication detail page
- The patient is never given a definitive counterfeit verdict — only verification status

### 6.4 Operator / Regulatory

The Pharmacy Operations Lead and Regulatory & Partner Affairs Lead see:
- Aggregate detection metrics (flag rate, confidence distribution, outcome distribution)
- Confirmed-counterfeit incidents
- Manufacturer and batch patterns
- Detection method effectiveness per medication
- Data for regulatory reporting to Ghana FDA

---

## 7. Integration with pharmacy workflow

The detection module integrates at two points in the Pharmacy Portal workflow:

### 7.1 At pick (Step 5.3 of Pharmacy Portal)

When the pharmacist or technician picks a specific stock unit for fulfillment:
- The stock unit's batch number is checked against the batch number database
- If a verification code is available, the pharmacist scans/enters it
- If visual inspection reference images are available, the pharmacist can photograph the packaging for comparison
- Any detection signals are displayed before the pick is confirmed

If signals are present:
- **Review signal:** the pharmacist is alerted but can proceed after inspection. The signal is logged.
- **Hold signal:** the pharmacist should not proceed. The stock unit is set aside for investigation. An alternative stock unit is sourced if available.
- **Reject signal:** the stock unit is confirmed from a known-counterfeit batch. It is quarantined immediately. An alternative is sourced. The incident is logged.

### 7.2 At release check (Step 5.4 of Pharmacy Portal)

Before the pharmacist releases the medication:
- A summary of any detection signals on the specific stock unit is displayed
- If signals were present at pick and the pharmacist chose to proceed, the signals are shown again at release as a second review opportunity
- If new signals have appeared since pick (e.g., a pharmacovigilance correlation was identified between pick and release), they are displayed as new signals

---

## 8. Reference data

### 8.1 Data sources for Ghana launch

Per the Flagged Items Resolution:

**Ghana FDA product register.** The Ghana FDA maintains a register of approved pharmaceutical products. This serves as the baseline for identifying which medications are legitimately registered for the market.

**Manufacturer verification partnerships.** For high-volume medications in the launch formulary, direct verification channels with manufacturers for batch numbers, packaging specifications, and serial numbers. Priority manufacturers: those supplying the GLP-1, ED, metformin, statin, and antihypertensive medications in the launch formulary.

**Reference image library.** Built by photographing legitimate packaging from verified supply chain sources. For launch, the library covers the top 20–30 medications by dispensing volume. Each entry includes multiple angles, multiple batches (to capture batch-to-batch packaging variation), and hologram/security feature documentation.

**Mobile verification code databases.** Where manufacturers use SMS or app-based verification codes, the platform integrates with these systems. Coverage is manufacturer-dependent.

### 8.2 Reference data maintenance

- **New medication additions.** When a new medication enters the formulary, its packaging is photographed, its manufacturer's verification system (if any) is integrated, and its batch numbers are added to the database as received from procurement.
- **Batch updates.** New batch numbers are added to the database as stock is procured from verified sources.
- **Image updates.** When manufacturers change packaging (rebranding, design updates), the reference image library is updated. Failure to update creates false positives (legitimate new packaging flagged as anomalous).
- **Known-counterfeit additions.** When a counterfeit is confirmed (through investigation or regulatory alert), the batch number, packaging images, and identifying features are added to the known-counterfeit database.

### 8.3 Reference data governance

Reference data updates follow the same governance model as other knowledge base updates (parallel to Medication Interaction Engine Slice §9.3):
- Changes are reviewed before deployment
- Versioned — signals include the reference data version that produced them
- Rollback capability if an update introduces excessive false positives
- Audit visibility — every reference data change is logged

---

## 9. Investigation workflow

When a detection flag leads to a hold or reject decision, an investigation workflow begins:

### 9.1 Investigation steps

1. **Physical inspection.** The pharmacist physically inspects the stock unit — packaging quality, hologram presence, tablet/capsule appearance, smell, markings.
2. **Documentation.** The pharmacist photographs the stock unit and documents inspection findings in a structured investigation form.
3. **Manufacturer verification.** If possible, the manufacturer is contacted to verify the batch number and packaging.
4. **Distributor trace.** The supply chain for the specific stock unit is traced to identify where the suspicious product entered.
5. **Resolution.** The investigation produces one of three outcomes:
   - **Confirmed counterfeit.** The stock unit is quarantined and destroyed per regulatory requirements. The batch number is added to the known-counterfeit database. Ghana FDA is notified. If other patients received medication from the same batch, they are identified and their clinicians are notified.
   - **Confirmed legitimate.** The stock unit is cleared for release. The detection signal is logged as a false positive. False-positive data feeds detection algorithm calibration.
   - **Inconclusive.** The stock unit cannot be definitively verified or rejected. It is not released. It is held pending additional investigation or replaced with verified stock.

### 9.2 Patient impact assessment

If a confirmed-counterfeit batch has already been partially dispensed (some units released to patients before the batch was flagged):
- All patients who received medication from the flagged batch are identified
- Their clinicians are notified with the counterfeit confirmation and clinical guidance
- Patients are contacted (by their clinician or care team, not by an automated system) with: information about the issue, clinical guidance (stop taking the medication, get a replacement, watch for specific symptoms), and a replacement prescription
- The event is reported through the Adverse Event Reporting system
- An incident is created in the Market Rollout Cockpit

---

## 10. Metrics

**Detection**
- Detection flag rate (% of dispensed stock units flagged — should be low; high rates suggest reference data problems)
- Flag rate by detection method (which methods are producing the most signals?)
- Confidence distribution of flags (mostly low, mostly high?)
- Detection method coverage (% of formulary medications with each detection method available)

**Investigation outcomes**
- Confirmed-counterfeit rate (% of flagged stock units confirmed counterfeit)
- Confirmed-legitimate rate (false-positive rate — critical metric for patient-visible signal activation)
- Inconclusive rate
- Average investigation time (flag → resolution)

**Impact**
- Patients exposed to confirmed-counterfeit medication (should approach zero)
- Batch-level counterfeit detection rate (catching a counterfeit batch before or after patient exposure)
- Regulatory reports filed (confirmed counterfeits reported to Ghana FDA)

**Reference data health**
- Reference image library coverage (% of high-volume medications with reference images)
- Batch number database coverage (% of active inventory with batch numbers in the database)
- Verification code integration coverage (% of formulary manufacturers with integrated verification)
- Reference data update frequency
- Time from new medication in formulary to reference data available

**Operational**
- Pharmacist time per detection investigation
- Stock units quarantined per month
- Replacement sourcing time for rejected stock

---

## 11. Post-launch expansion roadmap

### 11.1 Patient-visible verification status

After false-positive rates are validated (target: < 2% over 6+ months), patient-visible verification status activates:
- Verified medications show a "Verified" indicator on the medication detail page
- Unverifiable medications (no detection method available) show no indicator (absence of verification is not an alarm)
- Flagged-and-investigating medications show "Verification in progress" (not "suspicious" or "potentially counterfeit")

### 11.2 Supply chain intelligence

Aggregated detection data becomes a supply chain intelligence asset:
- Patterns in counterfeit detection by source, distributor, region, or medication class
- Intelligence shared with Ghana FDA and pharmaceutical industry partners (anonymized where required)
- Supply chain risk scoring for procurement decisions

### 11.3 Advanced detection methods

Post-launch additions to the detection toolkit:
- Spectroscopic analysis integration (handheld Raman or NIR spectrometers for content verification)
- Blockchain-based supply chain tracking (manufacturer-to-patient provenance)
- AI-powered packaging anomaly detection (training on the growing reference image library)
- Cross-market detection signal sharing (when Telecheck operates in multiple markets, counterfeit patterns detected in one market inform detection in others)

---

## 12. Audit

| Event | What is recorded |
|---|---|
| Detection signal generated | Signal ID, stock unit, medication, detection method(s), confidence, recommended action, reference data version, timestamp |
| Pharmacist decision on flag | Pharmacist ID, signal ID, decision (proceed/hold/reject), rationale, timestamp |
| Investigation initiated | Signal ID, stock unit, investigation steps planned, timestamp |
| Investigation finding | Finding type (confirmed counterfeit/confirmed legitimate/inconclusive), evidence, investigator, timestamp |
| Stock unit quarantined | Stock unit ID, batch, reason, quarantine location, timestamp |
| Stock unit cleared | Stock unit ID, signal ID, clearing pharmacist, timestamp |
| Patient impact assessment | Batch number, patients identified, clinicians notified, replacements issued, timestamp |
| Reference data updated | Data type (image/batch/verification), change description, reviewer, version, timestamp |
| Regulatory report filed | Report destination, batch number, confirmation details, timestamp |

---

## 13. Dependencies

- **Identity & Authentication Spec v1.0.** Authenticated patient, clinician, pharmacist, moderator, admin, and delegate sessions are required for every actor surface this slice uses.
- **Pharmacy Portal Slice.** Detection signals integrate at pick and release check steps. The pharmacy workflow must support signal display and pharmacist decision recording.
- **Adverse Event Reporting Slice.** Counterfeit-related adverse events feed pharmacovigilance correlation. Confirmed counterfeits trigger adverse event reports.
- **Market Rollout Cockpit Slice.** Confirmed-counterfeit incidents are cockpit incidents. Patient-visible signal activation is managed through the cockpit's activation review flow.
- **Ghana FDA relationship.** Regulatory reporting for confirmed counterfeits. Ghana FDA product register as a reference data source.
- **Manufacturer partnerships.** Verification code database access, batch number sharing, packaging specification access. Partnership development is on the launch critical path for high-volume formulary medications.
- **Reference image library.** Photography and cataloguing of legitimate packaging. This is an operational task that must be completed for launch formulary medications before the module is useful.
- **Inventory management (platform pharmacy).** Batch number tracking and provenance documentation feed detection methods. The platform pharmacy must track batch-level inventory.

---

## 14. Open questions (slice-level)

1. **Manufacturer partnership priority.** Which manufacturers are prioritized for verification partnerships at Ghana launch? Is prioritization by dispensing volume, counterfeit risk, or partnership feasibility?
2. **Partner pharmacy detection.** How does the detection module work with partner pharmacies? Does the partner pharmacy use the same detection workflow, or does detection only apply to platform pharmacy inventory? If partner pharmacies participate, what is the integration requirement?
3. **Regulatory reporting format.** What format does Ghana FDA require for counterfeit medication reports? Is there an established reporting system, or does Telecheck propose a format?
4. **Cost of detection.** Some detection methods (verification code queries, spectroscopic analysis) have per-use costs. How are these costs absorbed — platform operating expense, or passed to the pharmacy partner?
5. **Legal liability for detection errors.** If the module incorrectly flags a legitimate medication as suspicious and the pharmacist withholds it from a patient, causing treatment delay, what is the liability framework? This needs legal review.
6. **Detection for herbal preparations.** Should the detection module extend to herbal medicine products (checking for adulteration with undisclosed pharmaceutical ingredients)? The Herb-Drug Engine Slice §14 Q4 raised this question. If yes, what reference data is available?
7. **Cross-border counterfeit intelligence.** When Telecheck operates in multiple markets, should confirmed-counterfeit data from one market inform detection in others? What data-sharing agreements are needed?
8. **Whistleblower pathway.** Should pharmacy staff or delivery partners have a way to report suspected counterfeits outside the normal workflow (anonymous tip line)? This is common in pharmaceutical anti-counterfeiting programs.

---

## Document control

- **v1.0** — Initial Fake Medication Detection slice PRD. Defines five detection methods (verification codes, visual inspection, batch validation, supply chain provenance, pharmacovigilance correlation), confidence-weighted signal model, advisory-only launch posture with deferred patient-visible signals, pharmacy workflow integration at pick and release check, investigation workflow with three outcomes, reference data sources and governance for Ghana launch, and post-launch expansion roadmap. Derived from Master PRD v1.6 §10 Pillar 5 and Flagged Items Resolution v1.0.
- **Next review:** after manufacturer partnership priorities are confirmed (Q1); after reference image library is built for launch formulary; after Ghana FDA counterfeit reporting format is agreed.
- **Change discipline:** changes to detection methods, signal model, advisory-only posture, patient-visible signal activation criteria, or reference data governance require explicit owner sign-off and must be validated against the Pharmacy Portal Slice PRD and the Market Rollout Cockpit activation review requirements.
