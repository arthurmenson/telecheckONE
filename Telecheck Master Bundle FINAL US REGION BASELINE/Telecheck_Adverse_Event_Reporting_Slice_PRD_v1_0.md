# Telecheck — Adverse Event Reporting Slice PRD

**Version:** 1.0
**Status:** Canonical for development
**Owner:** Regulatory & Partner Affairs Lead
**Parent document:** Telecheck Master Platform PRD v1.6, §11.1
**Companion documents:** Medication Interaction & Validation Engine Slice PRD v1.0, Herb–Drug Interaction Engine Slice PRD v1.0, Refill Slice PRD v1.0, AI Clinical Assistant Slice PRD v1.0, Pharmacy Portal Slice PRD v1.0, Market Rollout Cockpit Slice PRD v1.0, v5 Contracts Pack

---

## 1. Purpose and strategic role

Adverse event reporting is the mechanism through which Telecheck detects, documents, escalates, and reports safety incidents — both internally for platform operations and externally to regulatory bodies. It is where the platform's clinical safety architecture meets its regulatory obligations.

In conventional healthcare, adverse event reporting is a paper-driven, retrospective process that happens long after the event. In Telecheck, the platform already knows the patient's medications, lab results, herbal medicines, interaction signals, protocol executions, and AI outputs. This means the platform can detect potential adverse events earlier, document them more completely, and route them faster than manual reporting. That capability is both an advantage and a responsibility — if the platform has the data to detect a signal and fails to act on it, the failure is visible in audit.

This slice defines:
- What constitutes a reportable adverse event in Telecheck
- How adverse events are detected (patient-reported, clinician-identified, system-detected)
- How they are documented and classified
- How they are escalated internally
- How they are reported externally to regulatory bodies
- How they connect to the interaction engine, herb–drug engine, and protocol execution audit
- What the patient, clinician, and operator see

This slice explicitly does not define the clinical management of adverse events (treatment decisions, dose changes, medication discontinuation). Those are clinical workflows handled by the clinician through consult and prescribing pathways. This slice defines the reporting and documentation pathway that runs in parallel with clinical management.

---

## 2. Traceability

| Master PRD reference | This slice addresses |
|---|---|
| §8 Job 7 — Handle alerts and follow-up | Adverse event detection, documentation, and escalation |
| §11.1 Launch scope — Basic adverse-event reporting | Launch capability |
| §11.1 Launch scope — Emergency escalation and routing | Emergency-grade adverse events trigger the escalation pathway |
| §13.4 Platform floor — Always-on behaviors | Audit logging and crisis detection feed adverse event detection |
| §22 Risks | Multiple risks mitigated by adverse event reporting (wrong clinical signal, protocol execution errors, AI chat safety) |
| §23 Q4 — Adverse-event reporting destination | Pre-launch decision this slice helps resolve |

---

## 3. Actors

| Actor | Role in this workflow |
|---|---|
| **Patient** | Reports suspected adverse events through structured reporting or AI Clinical Assistant conversation. Receives follow-up communication. |
| **Delegate** | May report a suspected adverse event on behalf of the patient. |
| **Clinician** | Identifies and documents adverse events during clinical interactions. Reviews system-detected signals. Makes clinical management decisions (outside this slice). Completes clinical sections of adverse event reports. |
| **Pharmacist** | May identify adverse events during dispensing interactions (patient reports at pickup, delivery partner reports). Documents and escalates. |
| **AI Clinical Assistant (Mode 1)** | Detects potential adverse event signals in patient conversation. Escalates to clinician. Does not classify or report autonomously. |
| **Medication Interaction & Validation Engine** | Override history and signal data inform adverse event investigation — was there a relevant interaction signal that was overridden? |
| **Herb–Drug Interaction Engine** | Same role as medication engine — herb–drug signal history informs investigation. |
| **Support & Incident Response Lead** | Manages the adverse event queue. Ensures reporting timelines are met. Coordinates with regulatory lead. |
| **Regulatory & Partner Affairs Lead** | Owns the external reporting relationship with Ghana FDA and other regulatory bodies. Ensures report format, cadence, and content meet regulatory requirements. |

---

## 4. What constitutes a reportable adverse event

### 4.1 Definition

An adverse event in Telecheck is any undesirable medical occurrence in a patient using the platform's clinical services, whether or not it is causally related to a medication, herbal medicine, protocol-authorized action, or AI output. This follows the WHO and ICH-GCP definition: the event is reportable because it occurred, not because causality has been established.

### 4.2 Reportable event categories

**Medication-related adverse events**
- Suspected adverse drug reactions (ADRs) to medications prescribed, refilled, or recommended through Telecheck
- Suspected interactions between prescribed medications (where the interaction engine may or may not have flagged a signal)
- Suspected herb–drug interactions (where the herb–drug engine may or may not have flagged a signal)
- Adverse effects of medication errors (wrong medication, wrong dose, wrong patient) originating from Telecheck workflows

**Protocol-related adverse events**
- Adverse outcomes from protocol-authorized prescribing (a medication auto-renewed under protocol caused harm)
- Adverse outcomes from protocol-authorized dispensing release (a medication released without pharmacist review caused harm)
- Adverse outcomes from AI Mode 2 clinical recommendations that were approved by a physician

**AI-related adverse events**
- AI Clinical Assistant (Mode 1) provided information that led the patient to take a harmful action (e.g., patient misinterpreted AI explanation and modified their own medication regimen)
- AI Clinical Assistant (Mode 2) produced a recommendation that, after physician approval, led to a harmful outcome
- AI lab interpretation was materially incorrect and led to a delayed or incorrect clinical action

**Platform-related adverse events**
- System failure that delayed critical medication delivery
- Notification failure that prevented a patient from receiving an urgent clinical alert
- Data error (incorrect lab value extraction, incorrect medication list) that affected a clinical decision

**Counterfeit-medication-related events**
- Patient received a medication that was subsequently identified as counterfeit or substandard
- Fake medication detection engine failed to flag a counterfeit that caused harm
- Fake medication detection engine flagged a legitimate medication, causing delay in treatment

### 4.3 Severity classification

| Severity | Definition | Reporting timeline |
|---|---|---|
| **Fatal** | Death of the patient | Immediate internal escalation. External report within 24 hours of awareness. |
| **Life-threatening** | Event that placed the patient at immediate risk of death | Immediate internal escalation. External report within 24 hours. |
| **Serious** | Event that resulted in hospitalization, prolonged hospitalization, persistent or significant disability, congenital anomaly, or required medical intervention to prevent one of the above | Internal escalation within 4 hours. External report within 72 hours. |
| **Non-serious** | Clinically notable event that does not meet serious criteria but is medically important | Internal documentation within 24 hours. External report per regulatory cadence (periodic, not individual). |

These timelines are the platform's internal commitments. External reporting timelines are subject to Ghana FDA requirements and may be stricter — the platform adopts whichever is stricter.

---

## 5. Detection pathways

Adverse events enter the reporting system through three detection pathways.

### 5.1 Patient-reported

The patient reports a suspected adverse event through:

**Structured reporting form.** Accessible from the medication detail page ("Report a problem with this medication"), the pharmacy order history ("Report a problem with this order"), or the main menu ("Report a health concern"). The form captures:
- Which medication or treatment is involved
- What happened (symptom description, free text)
- When it started
- Severity from the patient's perspective (mild / moderate / severe / emergency)
- Whether the patient sought emergency care
- Whether the patient stopped taking the medication

**AI Clinical Assistant (Mode 1).** When a patient describes symptoms that may indicate an adverse reaction ("I started feeling dizzy after taking my new medication" or "I've been having stomach pain since I started the herbal tea with my pills"), Mode 1:
- Acknowledges the concern with appropriate seriousness
- Asks clarifying questions to capture key details (which medication, when symptoms started, severity)
- Does not diagnose or classify the event
- Escalates to the clinician
- Creates a draft adverse event record from the conversation, pre-populated with the extracted details, for clinician review
- If symptoms suggest emergency, triggers the emergency escalation pathway immediately

**Phone/messaging.** Patient contacts support via messaging or phone and describes an adverse event. The support team creates the adverse event record.

### 5.2 Clinician-identified

The clinician identifies an adverse event during:

**Clinical review.** During async review, sync consult, refill review, or lab interpretation review, the clinician observes evidence of an adverse event (lab values suggesting drug toxicity, patient-reported symptoms consistent with ADR, clinical findings inconsistent with expected treatment response).

**Protocol fallback review.** When a protocol-authorized action falls back to clinician review, the clinician may identify that the patient has experienced an adverse event related to a previously protocol-authorized action.

**The clinician documents the adverse event directly** through a structured form in their clinical workflow, including: suspected causative agent, clinical description, severity classification, temporal relationship, clinical management actions taken, and whether the event is ongoing or resolved.

### 5.3 System-detected

The platform detects potential adverse event signals through automated monitoring:

**Lab-value-triggered signals.** A confirmed lab upload shows values consistent with drug toxicity or organ damage in a patient taking a medication known to cause that toxicity. Example: elevated creatinine in a patient on metformin; elevated LFTs in a patient on a statin; neutropenia in a patient on a myelosuppressive agent.

The system does not auto-classify these as adverse events. It creates a **potential adverse event signal** routed to the clinician for review. The clinician determines whether the lab finding constitutes a reportable adverse event.

**Interaction engine override correlation.** If a clinician overrode a critical or major interaction signal, and the patient subsequently reports symptoms or lab abnormalities consistent with the overridden interaction, the system creates a potential adverse event signal linking the override to the outcome. This is a high-value safety feedback loop — it catches cases where clinical judgment to override a signal was incorrect.

**Herb–drug correlation.** If a patient reports symptoms and their herb–drug interaction profile includes a relevant signal (even at theoretical evidence quality), the system creates a potential adverse event signal noting the correlation. This feeds the herb–drug engine's knowledge base improvement — a theoretical interaction that correlates with a real adverse event may warrant severity upgrade.

**RPM/CCM monitoring alerts.** Chronic care monitoring may detect deterioration patterns that suggest adverse medication effects (rising blood pressure in a patient recently started on a new medication, worsening glucose control after a medication change).

**Automated signals are never auto-classified as confirmed adverse events.** They are routed to clinician review with the supporting data. The clinician makes the determination.

---

## 6. Adverse event record

Every adverse event — whether patient-reported, clinician-identified, or system-detected — produces a structured adverse event record.

### 6.1 Record structure

| Field | Description | Source |
|---|---|---|
| AE ID | Unique identifier | System-generated |
| Patient ID | Affected patient | System |
| Reporter | Who reported or detected (patient, delegate, clinician, pharmacist, system) | Workflow |
| Detection pathway | Patient-reported / clinician-identified / system-detected | Workflow |
| Date of event onset | When symptoms or the event started | Reporter |
| Date of report | When the event was reported to the platform | System |
| Suspected causative agent(s) | Medication(s), herbal medicine(s), or combination | Reporter / clinician |
| Event description | Clinical description of what happened | Reporter / clinician |
| Severity | Fatal / life-threatening / serious / non-serious | Clinician (may be initially classified by patient, confirmed by clinician) |
| Outcome | Recovered / recovering / not recovered / fatal / unknown | Clinician (updated over time) |
| Causality assessment | Certain / probable / possible / unlikely / unassessable | Clinician |
| Related interaction signals | Interaction engine and herb–drug engine signals active at the time of the causative prescription or refill | System (auto-populated) |
| Related overrides | Any clinician overrides of interaction signals for the causative agent | System (auto-populated) |
| Related protocol executions | Any protocol-authorized actions involved in the causative prescription or refill | System (auto-populated) |
| Related AI outputs | Any AI Mode 1 or Mode 2 outputs related to the event | System (auto-populated) |
| Clinical management | Actions taken by the clinician (medication stopped, dose reduced, alternative prescribed, hospitalization, etc.) | Clinician |
| Reporting status | Internal only / reported to [regulatory body] / report pending | Regulatory lead |
| Follow-up status | Open / follow-up scheduled / closed | Support lead |

### 6.2 Auto-populated context

The adverse event record auto-populates from the patient's platform data:
- Active medication list at the time of the event
- Active herbal medicine list at the time of the event
- Interaction engine signal history for the suspected causative agent (every signal, override, and acknowledgment)
- Herb–drug signal history for the suspected causative agent
- Protocol execution history if the causative prescription or refill was protocol-authorized
- AI Clinical Assistant conversation history if the patient discussed the causative agent or symptoms with Mode 1
- AI Mode 2 recommendation and physician action if the causative prescription was AI-assisted
- Recent lab values relevant to the suspected adverse event
- Refill and adherence history for the causative medication

This auto-population is the platform's key advantage over manual adverse event reporting. Instead of a clinician reconstructing the context from memory or paper records, the record arrives pre-loaded with the relevant history.

---

## 7. Internal escalation

### 7.1 Escalation pathway

| Severity | Internal escalation |
|---|---|
| **Fatal or life-threatening** | Immediate alert to: attending clinician, Clinical Governance Lead, Support & Incident Response Lead, Country Launch Director. Incident created in the Market Rollout Cockpit. |
| **Serious** | Alert within 4 hours to: attending clinician, Clinical Governance Lead, Support & Incident Response Lead. Cockpit incident created if pattern detected. |
| **Non-serious** | Queued for clinician review within 24 hours. Aggregated in periodic reporting. |

### 7.2 Pattern detection

The platform monitors adverse event records for patterns:
- Multiple adverse events involving the same medication or herbal medicine within a defined period
- Multiple adverse events involving the same protocol-authorized pathway
- Adverse events correlated with a specific interaction signal that was overridden
- Adverse events in patients with a specific condition or demographic profile

Pattern detection does not auto-escalate. It surfaces the pattern to the Support & Incident Response Lead and Clinical Governance Lead for investigation. If the pattern suggests a systemic issue (e.g., a protocol producing adverse events at a rate above the expected baseline), it triggers protocol review per §13.5 of the Master PRD.

### 7.3 Protocol and AI feedback loops

**Protocol feedback.** If an adverse event is linked to a protocol-authorized action, the event is tagged to the protocol version. Protocol-linked adverse event rates are tracked as a protocol quality metric. If the rate exceeds a defined threshold, incident-triggered review is activated (§13.5).

**AI feedback.** If an adverse event is linked to an AI Mode 2 recommendation (even if the physician approved it), the event is tagged to the AI model version and the protocol version. This data feeds the auto-approve activation criteria (AI Clinical Assistant Slice §6.4) — a single safety-critical AI-linked adverse event during the 90-day review period blocks auto-approve activation.

**Interaction engine feedback.** If an adverse event correlates with an interaction the engine did not flag (a missed signal), the event is reported to the knowledge base maintenance process for investigation. If an adverse event correlates with an interaction the engine flagged but a clinician overrode, the override and outcome are included in override quality reporting.

**Herb–drug engine feedback.** If an adverse event correlates with an herb–drug interaction — particularly one classified as emerging or theoretical — the event is reported to the herb–drug knowledge base for potential severity upgrade. This is how theoretical interactions accumulate clinical evidence.

---

## 8. External reporting

### 8.1 Ghana FDA reporting (anchor market)

External adverse event reporting for Ghana launch is directed to the Ghana FDA's pharmacovigilance system.

**What is reported externally:**
- All fatal and life-threatening adverse events (within 24 hours of awareness)
- All serious adverse events (within 72 hours)
- Non-serious adverse events in periodic aggregate reports (cadence agreed with Ghana FDA — recommend monthly at launch, adjustable based on volume)

**Report format:** The format and data fields are agreed with the Ghana FDA during pre-launch engagement (§23 Q4). The platform generates reports in the agreed format from the structured adverse event record. Reports are generated, not manually composed — ensuring consistency and completeness.

**What the report includes:**
- Patient demographics (anonymized per regulatory agreement)
- Suspected causative agent
- Event description and severity
- Outcome and causality assessment
- Clinical management actions
- Relevant interaction signals and overrides (this is unique to Telecheck — most adverse event reports from conventional sources do not include interaction-check history)
- Whether the event was protocol-authorized

**What the report does not include (unless required by regulatory agreement):**
- Patient identity
- AI conversation transcripts
- Full medication history (only the relevant agents)

### 8.2 Multi-market reporting (post-launch)

When Telecheck expands to additional markets, each market's adverse event reporting pathway is configured in the Market Rollout Cockpit:
- Reporting destination (which regulatory body)
- Report format
- Reporting cadence
- Severity thresholds for individual vs aggregate reporting
- Data anonymization requirements

The adverse event record structure (§6.1) is designed to support multiple regulatory reporting formats from the same underlying data. The report generation layer adapts to each market's requirements.

---

## 9. Patient-facing experience

### 9.1 Reporting accessibility

The patient can report a suspected adverse event from:
- **Medication detail page** — "Report a problem with this medication" button
- **Order history** — "Report a problem with this order" button
- **Main menu** — "Report a health concern" option
- **AI Clinical Assistant (Mode 1)** — conversational reporting (Mode 1 creates a draft record from the conversation)

Reporting is never more than two taps from any primary surface. The reporting form is short (5 fields for the patient; clinician completes the clinical sections) and written in plain language.

### 9.2 Patient communication after reporting

- **Acknowledgment.** The patient receives immediate confirmation that their report has been received: "Thank you for reporting this. Your care team has been notified and will follow up."
- **Follow-up.** The clinician contacts the patient to assess the event clinically (this is a clinical workflow, not a reporting workflow, but the reporting system triggers it).
- **Status updates.** If the patient asks about their report, Mode 1 can provide status: "Your report is being reviewed by your care team" or "Your doctor has reviewed your report and [next steps]."
- **The patient does not see the regulatory reporting status.** Whether the event has been reported to the Ghana FDA is internal operations information. The patient sees that their care team is aware and acting.

### 9.3 Non-alarming design

The reporting flow should feel like a care interaction, not a legal filing. The language is:
- "Tell us what happened" not "File an adverse event report"
- "Your care team will follow up" not "This will be investigated"
- "We take this seriously" not "This may be reported to regulators"

The patient should feel that reporting is a normal, valued part of their care relationship — not that something has gone wrong with the system.

---

## 10. Clinician-facing experience

### 10.1 Adverse event queue

Clinicians see adverse event records that require their action in a dedicated section of their review queue:
- Patient-reported events requiring clinical assessment and severity classification
- System-detected signals requiring clinical determination (is this a reportable adverse event?)
- Events they are attending that require follow-up documentation

Each record shows: patient summary, event description, suspected agent, auto-populated context (interaction signals, protocol history, AI history, recent labs), and action controls.

### 10.2 Clinician actions

- **Classify severity.** Patient-reported events arrive with the patient's severity estimate. The clinician confirms or reclassifies.
- **Assess causality.** The clinician assesses the causal relationship between the suspected agent and the event (certain / probable / possible / unlikely / unassessable).
- **Document clinical management.** What clinical actions were taken or planned.
- **Link to interaction history.** The clinician can review the full interaction signal and override history for the suspected agent. If the event correlates with an overridden signal, the clinician notes this in the record.
- **Close or schedule follow-up.** Events are tracked until outcome is determined (recovered, recovering, not recovered, fatal).

### 10.3 Clinician burden management

Adverse event documentation adds clinician workload. The system minimizes this through:
- Auto-population of context (the clinician does not re-enter information the platform already has)
- Structured forms with dropdowns and selectable options (not free-text-only documentation)
- Draft records from Mode 1 conversations (patient-reported events via AI chat arrive with key details already extracted)
- Severity classification and causality assessment as single-selection controls
- Clinical management documentation integrated into the existing consult/review workflow (not a separate system)

---

## 11. Operator-facing experience

### 11.1 Adverse event dashboard

The Support & Incident Response Lead sees:
- Active adverse event queue (all open events, sorted by severity and age)
- Events approaching reporting deadlines (24-hour and 72-hour timelines highlighted)
- Events awaiting clinician classification (patient-reported, not yet clinician-reviewed)
- Events awaiting causality assessment
- Pattern detection alerts
- External reporting status (pending, submitted, acknowledged by regulatory body)

### 11.2 Reporting management

The Regulatory & Partner Affairs Lead manages:
- External report generation and submission
- Reporting cadence tracking (are periodic reports on schedule?)
- Regulatory body communication and acknowledgment tracking
- Report quality review (completeness, consistency, timeliness)

### 11.3 Cockpit integration

Fatal, life-threatening, and serious adverse events create incidents in the Market Rollout Cockpit. These incidents are linked to the adverse event record and visible in the cockpit's incident tab with:
- Event severity and category
- Linked protocol (if protocol-authorized)
- Linked AI output (if AI-involved)
- Pack version at event time
- Resolution status

If adverse event patterns trigger protocol review, the cockpit surfaces the review requirement alongside other review cadence alerts.

---

## 12. States and transitions

| State | Description | Next state |
|---|---|---|
| **Reported** | Event received (patient-reported, clinician-identified, or system-detected signal) | Triage |
| **Triage** | Initial severity assessment and routing | Under Review |
| **Under Review** | Clinician assessing severity, causality, and clinical management | Classified |
| **Classified** | Severity and causality determined | Reporting (if reportable) / Monitoring |
| **Reporting** | External report being prepared or submitted | Reported Externally |
| **Reported Externally** | External report submitted to regulatory body | Follow-Up |
| **Monitoring** | Non-serious events being tracked without individual external reporting | Follow-Up |
| **Follow-Up** | Ongoing monitoring of patient outcome | Closed |
| **Closed** | Outcome determined, all reporting complete, follow-up concluded | — |

Every state transition is timestamped. Reporting deadline countdown is visible from the moment of severity classification.

---

## 13. Audit

| Event | What is recorded |
|---|---|
| Event reported/detected | AE ID, reporter, detection pathway, initial description, timestamp |
| Severity classified | Clinician identity, severity, rationale, timestamp |
| Causality assessed | Clinician identity, assessment, supporting evidence referenced, timestamp |
| Context auto-populated | Data sources populated (interaction signals, protocol history, AI outputs, labs), timestamp |
| Internal escalation | Escalation recipients, severity, timestamp |
| Clinical management documented | Clinician identity, actions taken, timestamp |
| External report generated | Report content hash, regulatory destination, timestamp |
| External report submitted | Submission method, confirmation/acknowledgment, timestamp |
| Pattern detected | Pattern description, linked AE IDs, trigger threshold, timestamp |
| Follow-up action | Action type, actor, timestamp |
| Event closed | Outcome, closing actor, timestamp |

Adverse event audit records are retained per the strictest applicable requirement — regulatory retention rules or v5 Contracts Pack retention rules, whichever is longer.

---

## 14. Metrics

**Detection**
- Adverse event reporting rate per 1,000 active patients per month
- Detection pathway distribution (patient-reported vs clinician-identified vs system-detected)
- System-detected signal-to-confirmed-AE conversion rate (what percentage of system-detected signals are classified as actual adverse events by clinicians — calibration signal)
- Time from event onset to report (patient delay)
- Time from report to clinician classification

**Severity and outcomes**
- Severity distribution (fatal / life-threatening / serious / non-serious)
- Outcome distribution (recovered / recovering / not recovered / fatal)
- Causality distribution (certain / probable / possible / unlikely)

**Reporting compliance**
- Reporting deadline adherence (% of fatal/life-threatening events reported within 24 hours, serious within 72 hours)
- Periodic report timeliness
- External report completeness (% of required fields populated)

**Safety feedback**
- Adverse events linked to protocol-authorized actions (rate per protocol)
- Adverse events linked to AI Mode 2 recommendations
- Adverse events correlated with overridden interaction signals
- Adverse events correlated with herb–drug interactions (by evidence quality — are theoretical interactions producing real events?)
- Knowledge base update triggers from adverse event data

**Operational**
- Open adverse event queue size
- Average time to classification
- Average time to closure
- Clinician burden per adverse event (time spent on documentation)

---

## 15. Dependencies

- **Identity & Authentication Spec v1.0.** Authenticated patient, clinician, pharmacist, moderator, admin, and delegate sessions are required for every actor surface this slice uses.
- **Medication Interaction & Validation Engine Slice.** Interaction signal history and override data auto-populate adverse event records. Override correlation detection depends on engine audit data.
- **Herb–Drug Interaction Engine Slice.** Herb–drug signal history auto-populates records. Adverse events feed knowledge base improvement.
- **AI Clinical Assistant Slice.** Mode 1 creates draft adverse event records from patient conversations. Mode 2 recommendation history auto-populates records. AI-linked adverse events feed auto-approve activation criteria.
- **Refill Slice.** Protocol-authorized refill history auto-populates records. Protocol-linked adverse event rates are tracked.
- **Pharmacy Portal Slice.** Dispensing and delivery data auto-populates records. Counterfeit-related adverse events link to fake medication detection history.
- **Labs Slice.** Lab values auto-populate records and trigger system-detected signals.
- **Market Rollout Cockpit Slice.** Fatal, life-threatening, and serious events create cockpit incidents. Adverse event patterns trigger protocol review in the cockpit.
- **Messaging & Inbox Spec v1.0.** Inbox threads and message-delivery expectations govern care-team and patient-visible communication generated by this workflow.
- **Notification infrastructure.** Patient acknowledgments, clinician alerts, and deadline reminders depend on the notification system.
- **Ghana FDA pharmacovigilance system.** External reporting destination. Format and submission method must be agreed pre-launch (§23 Q4).

---

## 16. Open questions (slice-level)

1. **Ghana FDA report format.** What specific format does the Ghana FDA accept for adverse event reports? Is there an electronic submission system, or are reports submitted via email/paper? Can Telecheck propose a structured digital format?
2. **Causality assessment methodology.** Which causality assessment framework does Telecheck use — WHO-UMC system, Naranjo algorithm, or a simplified internal framework? The choice affects clinician workflow and reporting consistency.
3. **Patient consent for external reporting.** Does the patient's care consent cover adverse event reporting to the Ghana FDA, or is a separate consent required? If separate, when is it presented (at onboarding, at event reporting time)?
4. **Anonymization standard.** What level of patient anonymization is required for external reports? De-identified? Pseudonymized? Does the Ghana FDA require re-identification capability?
5. **Herbal medicine adverse event reporting pathway.** Ghana FDA may have a separate reporting pathway for herbal medicine adverse events vs conventional drug adverse events. Does the platform need to route to different destinations based on the causative agent type?
6. **Cross-border adverse events.** When Telecheck operates in multiple markets, how are adverse events involving medications prescribed in one market but used by a patient in another market handled? Which regulatory body receives the report?
7. **Adverse event reporting for AI-only interactions.** If a patient follows AI Clinical Assistant (Mode 1) information and experiences harm — but no prescription or clinical action was involved — is this a reportable adverse event? To whom? This is a novel category that conventional pharmacovigilance frameworks do not address.
8. **Clinician liability documentation.** When a clinician documents an adverse event, is the documentation protected under any quality improvement or peer review privilege, or is it discoverable? This affects how candidly clinicians document.

---

## v1.10 cycle additions (added 2026-05-02 per v1.10.1 hygiene cycle physical merge of Phase5 delta Row 9)

**Cycle C2 — Emerging-markets framing reframe.** External regulatory reporting in §8.1 ("Ghana FDA reporting (anchor market)") and elsewhere is reframed conceptually as **emerging-market regulatory reporting**: the destination authority is resolved per CCR `regulatory.adverse_event_reporting.authority` for the launch market — Ghana FDA at v1.0 Telecheck-Ghana pilot. The platform's external reporting layer is destination-agnostic; format, cadence, severity thresholds, and anonymization standards are configured per market in the Market Rollout Cockpit (already documented in §8.2 Multi-market reporting).

WHO references in this slice (§4 definition, §16 Q2 WHO-UMC causality methodology, partnership-related references) are preserved where partnership-specific — they are methodology and partnership citations, not jurisdictional reporting destinations, and remain valid regardless of CCR posture per the v1.10 cycle Cycle C2 framing.

**Cross-references (v1.10):** ADR-024 (CCR country-driven configuration), CCR `regulatory.adverse_event_reporting.authority`, Master PRD v1.10 §11.1, Market Rollout Cockpit Slice (per-market reporting configuration). Note that AE data may feed Posture A research data flow (`research_permitted_data_domains.pharmacovigilance_signal`) at Release 2 per ADR-028 — see Row 78 / v1.10 cycle Cycle C5 extension treatment in the Phase 5 delta.

**Source delta:** `Telecheck_v1_10_PRD_Update/Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` Row 9 (Cycle C2).

### Row 78 — AE data integration with ADR-028 research data flow (Cycle C5)

**Scope clarification.** AE Reporting at v1.0 is **internal safety surveillance** per the current §1 strategic role. Reportable adverse events are detected, recorded, escalated, and reported to the destination authority resolved per CCR `regulatory.adverse_event_reporting.authority` (Ghana FDA at v1.0 Telecheck-Ghana pilot, per Row 9 framing). **AE Reporting at v1.0 does not feed any external research data flow.**

**Release 2 trajectory under ADR-028 Posture A.** AE data MAY feed pharmacovigilance signal flow at Release 2 via the closed-enum `research_permitted_data_domains.pharmacovigilance_signal` (one of the four ADR-028 permitted domains) under Posture A — **aggregate, audit-trail-driven, and governed by I-029 research export gates**. The Release 2 trajectory is conditional on:

1. **Active DSA** for the patient's `country_of_care` with a research partner organization aligned with `pharmacovigilance_signal` (e.g., WHO/UN at the parent-level partnership).
2. **Active 5th-tier `ResearchConsent`** per Consent & Delegated Access Slice §16; consent-zero-impact on care delivery preserved per I-030 — AE detection, escalation, and internal reporting are unaffected by research consent state.
3. **k-anonymity ≥ CCR `research_export_k_anonymity_minimum`** per I-029. Below-threshold cohorts are rejected at the research export pipeline.
4. **CCR `research_data_partnership_active = active`** for the operating market.
5. **Authorized signers** per CCR `research_export_authorized_signers` (multi-party approval).
6. **Audit envelope** per AUDIT_EVENTS v5.2 §5 research events (audit class `high_pii` per I-031).

**Posture A vs. Posture B distinction (absolute non-goal preserved).** Aggregate, audit-trail-driven pharmacovigilance signal sharing under Posture A is in the Release 2 scope. **Behavior-changing post-market protocols** — i.e., research outputs that modify Telecheck care delivery, prescribing protocols, alert thresholds, or treatment recommendations based on research findings — remain **Posture B (absolute non-goal)** per ADR-028 v0.5. The AE Reporting slice does NOT consume any research output as a behavior modifier; AE-driven internal protocol updates (§7.3 AI feedback loops) are Telecheck-internal and remain unchanged.

**Scope boundary — export pipeline ownership.** As with RPM/CCM (cross-reference RPM/CCM Slice Row 77), any export of AE data into a Posture A research data flow is governed by the **research export pipeline** (a separate platform component, not by the AE Reporting slice directly). The AE Reporting slice is the upstream data producer; export decisions, k-anonymity enforcement, audit governance, and DSA matching are owned by the research export pipeline downstream. AE-record-level transformations into pharmacovigilance signals are performed at the export layer, not in the AE Reporting slice.

**Pre-Release-2 posture.** Until ADR-028 Posture A activates per the MARKET_LAUNCH v5.1 11-condition activation gate, AE data MUST NOT flow to any external research partner. The §8 external reporting layer is restricted to regulatory destinations (Ghana FDA at v1.0; multi-market reporting at §8.2 future) and remains scope-bound per Row 9 framing.

**Cross-references (Row 78):** ADR-028 v0.5 (Research data partnership Posture A — Release 2 goal — §6 permitted-domains list including `pharmacovigilance_signal`); Master PRD v1.10 §15.2; INVARIANTS v5.2 I-029 (research export gates), I-030 (consent-zero-impact on care delivery), I-031 (high_pii audit class); CCR_RUNTIME v5.2 research block; TYPES v5.2 (`DataSharingAgreement`, `ResearchConsent`, `ResearchDataExport`, `CohortDefinition`); AUDIT_EVENTS v5.2 §5 (research events); MARKET_LAUNCH v5.1 (11-condition activation gate); Consent & Delegated Access Slice §16 (5th-tier consent); RPM/CCM Slice Row 77 (parallel research data feed framing); Market Rollout Cockpit Slice Row 76 (Market Pack research block).

**Source delta:** `Telecheck_v1_10_PRD_Update/Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` Row 78 (Cycle C5).

---

## Document control

- **v1.0** — Initial Adverse Event Reporting slice PRD. Defines three detection pathways (patient-reported, clinician-identified, system-detected), severity classification with reporting timelines, structured adverse event record with auto-populated platform context, internal escalation pathway, external reporting to Ghana FDA, protocol and AI feedback loops, pattern detection, and integration with the Market Rollout Cockpit. Derived from Master PRD v1.6 §11.1 and §23 Q4.
- **v1.10 cycle additions (2026-05-02 — v1.10.1 hygiene cycle physical merge of Phase5 delta Rows 9, 78):** Row 9 (Cycle C2) — emerging-markets framing reframe of external regulatory reporting; destination authority resolved per CCR `regulatory.adverse_event_reporting.authority`; WHO references preserved as methodology/partnership citations. Row 78 (Cycle C5) — AE data may feed pharmacovigilance signal flow at Release 2 via `research_permitted_data_domains.pharmacovigilance_signal` under ADR-028 Posture A; aggregate, audit-trail-driven, governed by I-029; behavior-changing post-market protocols remain Posture B (absolute non-goal). Export pipeline ownership boundary clarified (research export pipeline owns export decisions; AE slice is upstream producer). Body unchanged at v1.0 baseline.
- **Next review:** after Ghana FDA report format and submission method are agreed (Q1 above); after causality assessment methodology is selected (Q2); after Consent & Delegated Access slice confirms adverse-event reporting consent coverage (Q3).
- **Change discipline:** changes to severity classification, reporting timelines, external reporting requirements, detection pathway logic, or feedback loop definitions require explicit owner sign-off and must be validated against the v5 Contracts Pack and regulatory agreements.
