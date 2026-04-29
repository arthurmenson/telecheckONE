# Telecheck — RPM / CCM Slice PRD

**Version:** 1.0
**Status:** Canonical for development
**Owner:** Clinical Governance Lead
**Parent document:** Telecheck Master Platform PRD v1.6, §10 Pillar 4, §11.1
**Companion documents:** Refill Slice PRD v1.0, Medication Interaction & Validation Engine Slice PRD v1.0, Labs Slice PRD v1.0, AI Clinical Assistant Slice PRD v1.0, Forms/Intake Engine Slice PRD v1.0, Adverse Event Reporting Slice PRD v1.0, Consent & Delegated Access Slice PRD v1.0

---

## 1. Purpose and strategic role

RPM/CCM is how Telecheck turns episodic care into continuous care. A patient who sees a doctor once and gets a prescription is a transaction. A patient whose blood glucose, blood pressure, medication adherence, lab trends, and symptoms are monitored over months and years — with alerts when things drift, nudges when adherence drops, and clinician intervention when signals cross thresholds — is a relationship. That relationship is where chronic disease outcomes actually improve, and where subscription revenue sustains the platform between clinical events.

RPM (Remote Patient Monitoring) is the data collection and alert layer: ongoing patient metrics, device readings, manual entries, and system-generated signals. CCM (Chronic Care Management) is the clinical coordination layer: care plans, check-ins, adherence tracking, clinician-led interventions, and program milestones. They operate together as a single capability in Telecheck — the patient experiences one program, not two acronyms.

This slice defines:
- How patients enroll in RPM/CCM programs
- How health data is collected (manual entry, connected devices, labs, AI assistant)
- How alerts and escalation work
- How care plans and milestones track progress
- How clinicians monitor and intervene
- How subscription billing works
- What the patient, clinician, and delegate see

---

## 2. Traceability

| Master PRD reference | This slice addresses |
|---|---|
| §8 Job 6 — Monitor chronic conditions over time | Ongoing metric collection, adherence tracking, alert and escalation logic |
| §8 Job 7 — Handle alerts and follow-up | RPM signals, missed inputs, lab-driven flags, escalation to clinician |
| §8 Job 1 — Enroll a patient into a program | Program enrollment for RPM/CCM |
| §10 Pillar 4 — Remote patient monitoring and chronic care management | Full pillar definition |
| §11.1 Launch scope — RPM/CCM | Manual and connected-device intake, monthly-subscription billing |
| §11.4 Critical-path subset | RPM/CCM is 30-day-tolerant (can launch with first program shortly after core care flows) |
| §18 Business model — RPM/CCM subscription | Monthly subscription, patient-pay at launch |
| §23 Q6 — Subscription billing infrastructure | Pre-launch decision on billing vendor |

---

## 3. Actors

| Actor | Role in this workflow |
|---|---|
| **Patient** | Enrolled in one or more RPM/CCM programs. Reports metrics (manual or device), completes check-ins, follows care plan, receives alerts and nudges. |
| **Delegate** | May view the patient's RPM dashboard, receive monitoring alerts, and prompt the patient to report metrics. Cannot modify care plans or acknowledge clinical alerts. |
| **Clinician** | Monitors patient panels, reviews alerts, adjusts care plans, intervenes when thresholds are crossed, conducts periodic program reviews. |
| **AI Clinical Assistant (Mode 1)** | Helps patients report metrics conversationally, explains trends, reminds about check-ins, escalates concerning patterns to clinician. |
| **Medication Interaction & Validation Engine** | Lab values from RPM monitoring feed drug-lab checks. Medication changes from RPM clinical reviews trigger engine re-evaluation. |
| **Labs Slice** | Lab uploads feed RPM trend tracking. Lab schedule adherence is monitored. |
| **Refill Slice** | Medication adherence from RPM informs refill timing. RPM-required labs gate refill eligibility. |

---

## 4. Program model

### 4.1 What a program is

An RPM/CCM program is a structured, subscription-based chronic care pathway with:
- A defined condition or condition cluster (diabetes, hypertension, diabetes + hypertension, etc.)
- A set of monitored metrics (blood glucose, blood pressure, weight, HbA1c, etc.)
- A monitoring schedule (how often each metric should be reported)
- Clinical thresholds (values that trigger alerts or clinician review)
- A care plan with milestones (targets, check-in cadence, review cadence)
- A subscription price (monthly, patient-pay)
- An accountable clinician (named per patient or per program cohort)

### 4.2 Launch programs

At Ghana launch, RPM/CCM activates with a focused set of programs. The specific programs are determined by protocol library scope (Master PRD §23 Q1), but the architecture supports any chronic condition. Indicative launch programs:

**Diabetes Management**
- Monitored metrics: blood glucose (fasting and post-prandial), HbA1c (quarterly lab), weight, blood pressure
- Devices: glucometer (connected or manual), blood pressure monitor (connected or manual)
- Key thresholds: fasting glucose > 180 mg/dL or < 70 mg/dL → clinician alert; HbA1c > 8% → care plan review; blood pressure > 160/100 → clinician alert
- Care plan elements: medication adherence tracking, dietary guidance, exercise goals, quarterly lab reminders, annual complication screening

**Hypertension Management**
- Monitored metrics: blood pressure (systolic/diastolic), heart rate, weight, sodium intake (self-reported)
- Devices: blood pressure monitor (connected or manual)
- Key thresholds: BP > 160/100 → clinician alert; BP > 180/120 → urgent alert; sustained BP > 140/90 over 2 weeks → care plan review
- Care plan elements: medication adherence, dietary sodium awareness, exercise goals, lab monitoring (renal function, electrolytes)

**GLP-1 Weight Management (monitoring component)**
- Monitored metrics: weight (weekly), waist circumference (monthly), side effects (structured check-in), blood pressure
- Devices: scale (connected or manual)
- Key thresholds: weight gain after initial loss period → care plan review; severe side effects reported → clinician alert; no weight entry for 2+ weeks → adherence nudge
- Care plan elements: medication adherence, titration schedule tracking, dietary guidance, exercise goals

Additional programs activate post-launch as protocols, clinician supply, and device availability align (Master PRD §11.3).

### 4.3 Program enrollment

Enrollment follows the Forms/Intake Engine flow (Forms Slice §5, §9.3):
1. Patient selects or is recommended for an RPM/CCM program
2. Program-specific intake captures baseline data, device availability, and monitoring preferences
3. Care consent includes acknowledgment of monitoring and subscription
4. Subscription billing is initiated
5. Care plan is generated with initial targets and milestones
6. Monitoring schedule begins

---

## 5. Data collection

### 5.1 Collection methods

**Manual entry.** The patient enters metrics directly in the app. The RPM dashboard shows the monitoring schedule with entry fields for each due metric. Manual entry is the primary method at Ghana launch — not all patients will have connected devices.

Entry flow: patient opens RPM dashboard → sees which metrics are due → enters value(s) → system validates (plausible range check) → value is saved with timestamp and "manual" source tag.

**Connected devices.** The platform supports data from Bluetooth-enabled monitoring devices (glucometers, blood pressure monitors, scales). At launch, connected-device support is limited to a defined device compatibility list per market.

Device flow: patient pairs device via Bluetooth → device takes reading → reading is transmitted to the app → value appears in the RPM dashboard with "device" source tag and device identifier → patient confirms or flags the reading.

**Lab uploads.** Lab results uploaded through the Labs Slice feed RPM monitoring automatically. When a patient uploads a lab report containing a monitored metric (e.g., HbA1c for a diabetes program), the confirmed value populates the RPM timeline at its collection date.

**AI Clinical Assistant.** When a patient tells Mode 1 about a reading ("My blood sugar was 145 this morning"), Mode 1 can offer to enter it: "Would you like me to log that as today's fasting glucose?" If the patient confirms, the value is entered with "AI-assisted" source tag.

**Clinician entry.** During a consult or program review, the clinician can enter or update metric values. Clinician-entered values are tagged as "clinician-entered" and distinguished from patient-entered values.

### 5.2 Monitoring schedule

Each program defines a monitoring schedule — how often each metric should be reported. The schedule is visible to the patient as a structured calendar:

| Metric | Frequency | Example |
|---|---|---|
| Fasting blood glucose | Daily | Every morning before breakfast |
| Post-prandial blood glucose | 3x per week | After lunch on Mon/Wed/Fri |
| Blood pressure | Daily | Morning and evening |
| Weight | Weekly | Every Monday morning |
| HbA1c | Quarterly | Lab upload every 3 months |
| Check-in questionnaire | Biweekly | Every other Friday |

**Schedule flexibility.** The schedule is the target, not a rigid mandate. Patients will miss entries. The system distinguishes between:
- **On-time entry:** metric reported within the expected window
- **Late entry:** metric reported outside the expected window (accepted, timestamped as late)
- **Missed entry:** no metric reported for the period. Generates adherence data but does not block anything.

### 5.3 Adherence tracking

Adherence is calculated as: (on-time entries + late entries) / expected entries over a rolling period (7-day, 30-day, 90-day).

Adherence is visible to:
- The patient (on their RPM dashboard — "You've logged your blood pressure 85% of the time this month")
- The clinician (on the patient's program dashboard — adherence is a key signal for care plan review)
- The delegate (if granted view-records scope)

Adherence thresholds trigger nudges and alerts:
- Adherence drops below 70% over 14 days → patient nudge via WhatsApp ("We haven't seen your blood pressure readings recently — logging helps your care team keep you on track")
- Adherence drops below 50% over 30 days → clinician alert ("Patient adherence has declined significantly — consider outreach")
- Adherence drops to 0% for 7+ days → clinician alert + patient nudge

### 5.4 Check-in questionnaires

Periodic structured check-ins collect qualitative data alongside quantitative metrics:
- Symptom changes ("Any new symptoms since your last check-in?")
- Side effects ("How are you tolerating your medication?")
- Lifestyle updates ("Have there been changes to your diet, exercise, or stress levels?")
- Herbal medicine update ("Have you started or stopped any herbal medicines?")
- Wellbeing ("How are you feeling overall on a scale of 1-5?")

Check-ins are delivered through the Forms/Intake Engine as lightweight forms (under 2 minutes). Responses feed the clinician's program dashboard and the AI Clinical Assistant's patient context.

---

## 6. Alerts and escalation

### 6.1 Alert types

| Alert type | Trigger | Recipient | Urgency |
|---|---|---|---|
| **Critical threshold** | Metric crosses a danger threshold (e.g., glucose < 50, BP > 180/120) | Clinician immediately, patient with emergency guidance | Urgent — within 15 minutes |
| **Warning threshold** | Metric crosses a concerning threshold (e.g., glucose > 180, BP > 160/100) | Clinician within 4 hours, patient with guidance | High |
| **Trend alert** | Metric trending toward a threshold over multiple readings (e.g., steadily rising BP over 2 weeks) | Clinician at next review, patient with awareness | Standard |
| **Adherence alert** | Monitoring adherence drops below threshold | Clinician if sustained, patient with nudge | Standard |
| **Lab schedule alert** | Required lab is overdue (e.g., quarterly HbA1c not uploaded for 4+ months) | Clinician, patient with reminder | Standard |
| **Medication adherence alert** | Refill not requested on schedule, or refill adherence drops (Refill Slice §11) | Clinician, patient with reminder | Standard |
| **Check-in alert** | Patient reports concerning symptoms or side effects in a check-in | Clinician | Priority based on content |

### 6.2 Alert processing

**Critical alerts** trigger the emergency escalation pathway (Master PRD §13.1). The patient sees immediate guidance ("Your blood glucose reading is very low. If you feel dizzy or confused, eat something sugary immediately and call [emergency number]"). The clinician is notified immediately. The alert is logged as a safety event contributing to the safety-event handling latency metric (headline launch metric #3).

**Warning and trend alerts** enter the clinician's monitoring queue. The clinician reviews the alert with full patient context (recent readings, medication list, interaction signals, adherence data, last check-in) and takes action: adjust care plan, schedule a consult, modify medication, or acknowledge and continue monitoring.

**Adherence and schedule alerts** generate patient nudges and clinician awareness. They do not trigger clinical escalation unless combined with concerning metric values.

### 6.3 Alert fatigue prevention

Alert fatigue is a real clinical risk — too many alerts and clinicians stop paying attention to any of them. Mitigation:

- **Severity-based filtering.** The clinician's monitoring queue shows critical and warning alerts prominently. Trend and adherence alerts are visible but not interruptive.
- **Aggregation.** If a patient generates multiple warning alerts for the same metric in the same day (e.g., three high glucose readings), they are aggregated into one alert with all readings attached, not three separate alerts.
- **Configurable thresholds.** Alert thresholds are configurable per program and per patient. A clinician can adjust a patient's warning threshold from 180 to 200 if the patient's baseline is higher and 180 generates too many alerts. Threshold adjustments are audited.
- **Snooze with justification.** A clinician can snooze a non-critical recurring alert for a defined period (7/14/30 days) with documented rationale. Snoozed alerts are logged. Snooze does not apply to critical alerts.
- **Alert volume monitoring.** The operations dashboard tracks alert volume per clinician. If alert volume exceeds a threshold, it signals that thresholds may need recalibration or the clinician panel needs expansion.

---

## 7. Care plans and milestones

### 7.1 Care plan structure

Each enrolled patient has a care plan that defines:

| Component | Description |
|---|---|
| **Targets** | Clinical goals (e.g., HbA1c < 7%, BP < 140/90, weight loss of 5% in 6 months) |
| **Monitoring schedule** | Which metrics, how often (§5.2) |
| **Medication plan** | Active medications, refill schedule, titration plan (for GLP-1 or other titrated medications) |
| **Lifestyle plan** | Dietary, exercise, and behavioral goals (brief, achievable, patient-agreed) |
| **Lab schedule** | Required labs and their cadence |
| **Check-in cadence** | How often check-in questionnaires are delivered |
| **Review cadence** | How often the clinician reviews the full program (recommend monthly at launch) |
| **Milestones** | Defined checkpoints (e.g., "Month 3: HbA1c recheck", "Month 6: program review and renewal decision") |

### 7.2 Care plan creation

The initial care plan is created by the clinician (or AI-assisted with clinician approval) after program enrollment:
1. Enrollment intake data provides the baseline
2. AI Mode 2 or the clinician sets initial targets based on clinical guidelines and patient context
3. The monitoring schedule and lab schedule are derived from the program template
4. The clinician reviews and customizes the plan
5. The plan is presented to the patient for review (not consent — care consent was already captured at enrollment; this is informational)
6. The plan is activated

### 7.3 Care plan updates

Care plans are living documents. They are updated when:
- A clinician adjusts targets, medications, or schedule during a program review
- A milestone is reached (or missed) and the plan is recalibrated
- The patient's condition changes (new comorbidity, medication change, lab result shift)
- The patient requests a change (e.g., wants to change monitoring frequency)

Every care plan update is versioned. The patient and clinician can see the update history. Updates that change clinical targets require clinician action — they are not auto-adjusted by the system.

### 7.4 Patient-facing milestones

Milestones give the patient a sense of progression, not just an endless monitoring loop:
- "Month 1: Establish your monitoring routine" (adherence target)
- "Month 3: First program review — see how your numbers are trending"
- "Month 6: HbA1c recheck — are we on track?"
- "Month 12: Annual comprehensive review"

Milestone completion is visible on the patient's program dashboard. Completed milestones feel like achievements. Missed milestones are presented without judgment — "Your 3-month review is overdue. Let's schedule it."

---

## 8. Clinician monitoring surface

### 8.1 Patient panel

The clinician's RPM/CCM surface shows their patient panel:
- All enrolled patients, sorted by alert severity and recency
- Each patient shows: name, program, latest metric values, alert status, adherence score, last clinician review date, next milestone
- Filter by: program, alert status, adherence level, review overdue
- Drill into any patient for the full program dashboard

### 8.2 Patient program dashboard (clinician view)

When the clinician opens a patient's program:
- **Metric timeline.** Charted readings over time with threshold bands. Multiple metrics on one view (e.g., systolic BP, diastolic BP, and heart rate together). Medication overlay showing start/stop/dose changes.
- **Alert history.** All alerts generated, with clinician actions taken.
- **Care plan.** Current plan with targets, schedule, and milestone status. Previous versions accessible.
- **Lab summary.** Most recent relevant labs with trends (from Labs Slice).
- **Adherence.** Monitoring adherence (metric entry rate), medication adherence (refill rate from Refill Slice), lab schedule adherence.
- **Check-in history.** Responses from periodic check-ins, flagging concerning answers.
- **Interaction signals.** Active medication and herb-drug interaction signals relevant to this program's medications.
- **AI context.** What the AI Clinical Assistant has discussed with this patient about their program (Mode 1 conversation references, not full transcripts).
- **Actions:** Adjust care plan, schedule consult, send message, modify alert thresholds, order labs.

### 8.3 Program-level views

Beyond individual patients, the clinician sees program-level aggregates:
- Total enrolled patients by program
- Average adherence by program
- Alert volume by program
- Patients due for review
- Program-level outcome trends (e.g., average HbA1c change across all diabetes patients over 6 months)

---

## 9. Patient-facing experience

### 9.1 RPM dashboard

The patient's RPM dashboard is their daily health companion:

**Today's tasks.** What metrics are due today, which have been entered, which are still pending. A simple checklist feel — "Blood pressure: done ✓ | Blood glucose: due | Weight: not due until Monday."

**Recent readings.** Last 7 days of readings with inline trend indicators (up/down/stable arrows). Abnormal values are highlighted with patient-appropriate explanation.

**Trends.** Charts showing metric history over selectable periods (1 week, 1 month, 3 months, 6 months). Threshold bands visible. Medication overlay available.

**Care plan summary.** Current targets, next milestone, adherence score, next scheduled review or lab.

**Quick entry.** One-tap access to enter a metric. The entry flow is 2 taps for a simple metric (open → enter value → save).

**AI assistant entry point.** "Have a question about your readings?" → opens Mode 1 pre-seeded with RPM context.

### 9.2 Notifications

RPM generates several notification types:

| Notification | Channel | Timing |
|---|---|---|
| Daily metric reminder | WhatsApp | Morning (configurable) |
| Missed metric nudge | WhatsApp | Evening if day's readings not entered |
| Check-in due | In-app + WhatsApp | On scheduled check-in day |
| Lab reminder | In-app + WhatsApp | 2 weeks before and on due date |
| Milestone approaching | In-app | 1 week before milestone |
| Clinician message | In-app + WhatsApp | When clinician sends a program-related message |
| Alert acknowledgment | In-app | When clinician reviews a patient's alert |

**Notification fatigue prevention.** Patients can configure reminder timing and can mute non-critical reminders for a period (e.g., "mute daily reminders for 3 days" — useful during travel or illness). Critical threshold guidance is never mutable.

### 9.3 Delegate view

A delegate with view-records scope sees:
- The patient's RPM dashboard (read-only)
- Recent readings and trends
- Alert status (but not alert details that reference sensitive-category data)
- Adherence score

A delegate with receive-notifications scope receives copies of adherence nudges (not metric values — "Your [relationship] hasn't logged their readings today" not "Their blood pressure was 180/110"). Critical threshold notifications are sent to the delegate if the patient has granted this scope: "[Patient name] may need urgent care — please check on them."

---

## 10. Subscription billing

### 10.1 Billing model

RPM/CCM is a monthly patient-pay subscription. The subscription covers:
- Ongoing metric monitoring and alert system
- Access to the RPM dashboard and trend views
- Periodic check-ins
- Clinician monitoring of the patient's panel (background monitoring, not per-visit consults)
- Care plan management and milestone tracking
- Lab schedule tracking and reminders
- AI Clinical Assistant context awareness for the patient's program

The subscription does **not** cover:
- Per-visit consult fees (if the patient or clinician schedules a consult, the consult fee applies separately)
- Medication costs (separate per the Refill Slice)
- Lab costs (patient pays for labs at the testing facility)
- Connected devices (patient provides their own or purchases separately)

### 10.2 Pricing

Pricing is set per market and per program. For Ghana launch, pricing is a single monthly rate per program. Tiered pricing (by program complexity or number of monitored metrics) is a post-launch consideration (Master PRD §24 Q8).

Price is displayed at program enrollment before the patient commits. No hidden fees.

### 10.3 Billing mechanics

Monthly billing is handled through the subscription billing infrastructure (Master PRD §23 Q6). Requirements:
- **Subscription creation** at program enrollment
- **Recurring charge** on the monthly anniversary of enrollment
- **Failed payment handling:** retry logic (3 attempts over 7 days). If all retries fail, patient is notified. Monitoring continues for a grace period (recommend 14 days). If payment is not resolved within the grace period, the subscription is paused — monitoring data collection stops but historical data is preserved and the patient can reactivate.
- **Subscription pause:** patient-initiated pause (e.g., for travel or financial reasons). Monitoring pauses. Historical data preserved. Paused for up to 90 days; after 90 days, subscription is cancelled.
- **Subscription cancellation:** patient can cancel at any time. Remaining prepaid period (if any) is honored. Monitoring stops at period end. Historical data preserved. Patient can re-enroll later.
- **Proration:** if the patient upgrades (adds a second program) or downgrades mid-cycle, billing is prorated.
- **Receipts:** monthly receipt/invoice generated and accessible in the patient's payment history.

### 10.4 Subscription status visibility

The patient sees their subscription status on their RPM dashboard and in Settings:
- Active (next billing date, amount)
- Payment failed (retry in progress, what to do)
- Paused (resume date or manual resume option)
- Grace period (monitoring continues but payment is overdue)
- Cancelled (historical data accessible, re-enroll option)

---

## 11. Connected device support

### 11.1 Launch posture

Connected-device support at launch is limited to a defined compatibility list. The platform supports Bluetooth-enabled devices that transmit standard health metrics (glucose, blood pressure, weight). The specific device models are validated per market based on availability, reliability, and data format.

### 11.2 Device pairing and data flow

1. Patient selects "Add device" from RPM dashboard
2. Selects device type and model from the compatibility list
3. Follows Bluetooth pairing instructions
4. Device takes a reading
5. Reading is transmitted to the app
6. Patient sees the reading in the RPM dashboard with "device" source tag
7. Patient confirms or flags the reading ("This reading doesn't seem right")

### 11.3 Manual entry fallback

Connected-device support is not required for RPM participation. Manual entry is always available. Many Ghana launch patients will use manual entry as their primary method, with connected devices as an aspirational upgrade. The platform never makes connected devices feel mandatory — manual entry patients receive the same monitoring quality.

### 11.4 Device data quality

Device readings are subject to plausibility checks (same as manual entry). Implausible device readings (e.g., blood pressure of 0/0, glucose of 999) are flagged for patient review rather than silently accepted. The patient can confirm, retry, or enter manually.

---

## 12. Integration with other slices

### 12.1 Labs Slice

- Lab results feed RPM metric tracking (HbA1c, renal function, lipids, etc.)
- Lab schedule adherence is monitored by RPM
- Lab-driven alerts (e.g., HbA1c rising above target) generate RPM alerts
- The RPM dashboard links to the full lab timeline for drill-down

### 12.2 Refill Slice

- Medication adherence from refill data (is the patient refilling on time?) feeds RPM adherence tracking
- RPM-required labs gate refill eligibility (Refill Slice §5.1 Step 3)
- RPM-identified medication concerns (e.g., blood pressure not controlled despite medication adherence) may trigger clinician-initiated medication review

### 12.3 Interaction Engine

- Medication changes from RPM clinical reviews trigger interaction engine re-evaluation
- Drug-lab conflict signals from the interaction engine are visible in the RPM clinician dashboard
- RPM lab trends inform the interaction engine's trending awareness (Medication Interaction Engine Slice §4.3)

### 12.4 AI Clinical Assistant

- Mode 1 helps patients understand their RPM data, explains trends, reminds about entries, and escalates concerning patterns
- Mode 1 can accept metric entries conversationally
- Mode 1 has context about the patient's program, targets, and adherence
- Mode 2 may consume RPM data as input for protocol evaluation in future expanded pathways

### 12.5 Adverse Event Reporting

- RPM-detected deterioration patterns that suggest adverse medication effects are flagged as potential adverse event signals (Adverse Event Reporting Slice §5.3)
- RPM data provides context for adverse event investigation

---

## 13. States and transitions

### 13.1 Program enrollment states

| State | Description | Next state |
|---|---|---|
| **Eligible** | Patient meets program criteria (from intake) | Enrolling |
| **Enrolling** | Intake in progress, consent pending, billing setup | Active / Enrollment Failed |
| **Active** | Monitoring underway, subscription billing active | Paused / Cancelled / Completed |
| **Paused** | Patient-initiated pause or payment grace period | Active (resumed) / Cancelled |
| **Cancelled** | Subscription ended by patient or payment failure | Re-enrolled (new enrollment) |
| **Completed** | Program reached its defined end point (if time-bounded) | — |

### 13.2 Metric entry states

| State | Description |
|---|---|
| **Due** | Metric is expected per the monitoring schedule |
| **Entered** | Metric value recorded (manual, device, lab, or AI-assisted) |
| **Late** | Metric entered after the expected window |
| **Missed** | No entry for the expected period |
| **Flagged** | Entry is plausibility-flagged or patient-disputed |

---

## 14. Audit

| Event | What is recorded |
|---|---|
| Program enrollment | Patient ID, program, consent record, subscription creation, initial care plan version, timestamp |
| Metric entry | Patient/delegate/clinician/device ID, metric, value, source tag, timestamp, plausibility check result |
| Alert generated | Alert type, trigger condition, metric values involved, recipient, timestamp |
| Alert acknowledged | Clinician ID, action taken, rationale, timestamp |
| Care plan created/updated | Plan version, changes made, clinician ID, timestamp |
| Threshold adjusted | Metric, old threshold, new threshold, clinician ID, rationale, timestamp |
| Alert snoozed | Alert type, snooze duration, clinician ID, rationale, timestamp |
| Subscription event | Creation, charge, failure, retry, pause, resume, cancellation, timestamp |
| Check-in completed | Check-in template version, responses, timestamp |
| Milestone reached/missed | Milestone ID, status, timestamp |
| Device paired/unpaired | Device type, model, patient ID, timestamp |

---

## 15. Metrics

**Patient engagement**
- Program enrollment rate (eligible patients who enroll)
- Monitoring adherence rate (metric entries / expected entries) by program, rolling 30/90 day
- Check-in completion rate
- RPM dashboard daily active usage
- AI Clinical Assistant RPM-related conversation rate

**Clinical quality**
- Alert-to-action latency (alert generated → clinician action) — feeds headline metric #3
- False-positive alert rate (alerts clinician dismisses without action — calibration signal)
- Escalation appropriateness (false-positive vs missed-signal balance)
- Care plan review cadence adherence (are clinicians reviewing on schedule?)
- Outcome trends (HbA1c change, BP change, weight change over enrollment period)

**Subscription**
- RPM subscription retention (monthly, 3-month, 6-month, 12-month)
- Payment failure rate
- Pause rate and resume-from-pause rate
- Cancellation rate and reason distribution
- Revenue per subscriber per month

**Operations**
- Patients per clinician (panel size)
- Alert volume per clinician per day
- Average clinician time per patient per month (monitoring burden)
- Device pairing success rate
- Device data quality (plausibility flag rate)

---

## 16. Dependencies

- **Identity & Authentication Spec v1.0.** Authenticated patient, clinician, pharmacist, moderator, admin, and delegate sessions are required for every actor surface this slice uses.
- **Forms/Intake Engine Slice.** Program enrollment intake, check-in questionnaires, and care plan presentation use the intake engine.
- **Labs Slice.** Lab data feeds RPM monitoring. Lab schedule adherence is tracked.
- **Refill Slice.** Medication adherence from refill timing feeds RPM tracking. RPM-required labs gate refill eligibility.
- **Medication Interaction & Validation Engine Slice.** Medication changes from RPM reviews trigger engine re-evaluation. Drug-lab signals visible in RPM clinician dashboard.
- **AI Clinical Assistant Slice.** Mode 1 assists with metric entry and patient education. RPM context feeds AI conversations.
- **Consent & Delegated Access Slice.** Program enrollment requires care consent. Delegate RPM access is scope-gated.
- **Adverse Event Reporting Slice.** RPM-detected deterioration feeds adverse event signal detection.
- **Messaging & Inbox Spec v1.0.** Inbox threads and message-delivery expectations govern care-team and patient-visible communication generated by this workflow.
- **Notification infrastructure.** Daily reminders, adherence nudges, and alert notifications depend on WhatsApp/SMS/in-app channels.
- **Payment & Billing Spec v1.0.** Monthly recurring billing, payment failure handling, and pause/resume/cancel behavior for subscription-billed programs are defined in the payment specification.
- **Connected-device compatibility list.** Device models validated for each market. Vendor relationships for device sourcing or recommendation.

---

## 17. Open questions (slice-level)

1. **Launch program selection.** Which specific programs activate on day one in Ghana? Is diabetes management sufficient as the single launch program, or do hypertension and GLP-1 monitoring also activate on day one?
2. **Connected-device availability in Ghana.** What Bluetooth glucometers and blood pressure monitors are reliably available and affordable in Accra? Should the platform recommend or sell specific devices, or remain device-agnostic?
3. **Clinician panel sizing for RPM.** How many RPM patients can one clinician safely monitor? What is the maximum panel size before monitoring quality degrades? This determines how quickly the program can scale.
4. **Offline metric entry.** Should the app support offline metric entry with queued submission (consistent with the degraded connectivity model)? This seems necessary for Ghana but adds complexity to timestamp handling.
5. **Family/community support features.** In emerging markets, chronic disease management is often a family activity. Beyond delegation, should the RPM dashboard support family-visible features (e.g., a shared medication reminder that pings the patient and their caregiver simultaneously)?
6. **Program graduation or long-term retention.** Is RPM/CCM enrollment indefinite, or do programs have defined end points? Can a well-managed diabetes patient "graduate" to a lower-intensity monitoring tier? What does the revenue model look like for graduated patients?
7. **Gamification.** Should milestones and adherence tracking include gamification elements (streaks, badges, progress celebrations)? This drives engagement but must be calibrated to avoid trivializing chronic disease management.

---

## Document control

- **v1.0** — Initial RPM/CCM slice PRD. Defines program model with indicative launch programs (diabetes, hypertension, GLP-1 monitoring), five data collection methods (manual, connected device, lab, AI-assisted, clinician), six alert types with severity-based escalation and alert fatigue prevention, care plan structure with milestones, clinician monitoring surface with patient panel and program-level views, monthly subscription billing model, connected-device support with manual entry fallback, and integration with Labs, Refill, Interaction Engine, AI Clinical Assistant, and Adverse Event Reporting slices. Derived from Master PRD v1.6 §10 Pillar 4.
- **Next review:** after launch program selection is confirmed (Q1); after subscription billing vendor is selected (§23 Q6); after connected-device compatibility list is established for Ghana.
- **Change discipline:** changes to alert thresholds, escalation logic, subscription billing model, care plan structure, or connected-device requirements require explicit owner sign-off and must be validated against the Refill Slice (lab-gated eligibility) and the Medication Interaction Engine Slice (drug-lab integration).
