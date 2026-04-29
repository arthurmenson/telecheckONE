# Telecheck — Async Consult Slice PRD

**Version:** 1.0
**Status:** Canonical for development
**Owner:** Async & Refill Review Lead
**Parent document:** Telecheck Master Platform PRD v1.6, §10 Pillar 1, §11.1
**Companion documents:** AI Clinical Assistant Slice PRD v1.0, Forms/Intake Engine Slice PRD v1.0, Medication Interaction & Validation Engine Slice PRD v1.0, Refill Slice PRD v1.0, Pharmacy Portal Slice PRD v1.0, Consent & Delegated Access Slice PRD v1.0

---

## 1. Purpose and strategic role

Async consult is the primary clinical workflow for Telecheck's launch programs. A patient submits structured intake data, the AI prepares a clinical summary (Mode 2), a clinician reviews and acts, and the patient receives the outcome — all without requiring simultaneous presence. This is the care model that makes Telecheck work at scale in workforce-constrained markets: clinicians review cases when they have capacity, patients submit when they have time, and AI handles the structured preparation in between.

Async consult is also the pathway through which most first-time prescriptions originate. A patient enrolling in a GLP-1 program doesn't book a video call — they complete an intake, the AI prepares the case, and a clinician prescribes. The async model serves the platform's Ghana launch posture: mobile-first, low-friction, led by managed programs where structured intake is well-defined.

Synchronous video consult (Slice #6) serves different needs — complex cases, patient preference, follow-up conversations, and markets where live interaction is required. Async and sync are complements, not competitors.

This slice defines:
- How a patient initiates an async consult
- How intake data flows into AI Mode 2 preparation
- How the clinician reviews, decides, and documents
- How decisions become prescriptions, refills, referrals, or follow-up
- How the patient receives the outcome
- How the async workflow handles edge cases (escalation to sync, incomplete data, disagreement)

---

## 2. Traceability

| Master PRD reference | This slice addresses |
|---|---|
| §8 Job 4 — Consult a clinician asynchronously | End-to-end async consult workflow |
| §8 Job 1 — Enroll a patient into a program | Async consult is the primary enrollment-to-prescribing pathway for managed programs |
| §10 Pillar 1 — Telehealth care delivery | Async consults as a first-class care modality |
| §10 Pillar 2 — AI Mode 2 | Mode 2 prepares clinical summaries for async review |
| §11.1 Launch scope — Asynchronous clinician review | Launch capability |
| §11.4 Critical-path subset | Async clinician review is critical-path |
| §18 Business model — Consultation fees | Per-visit patient-pay for async consults |

---

## 3. Actors

| Actor | Role in this workflow |
|---|---|
| **Patient** | Initiates the consult by completing intake. Receives the clinician's decision and follow-up. May ask clarifying questions via messaging after the decision. |
| **Delegate** | May initiate an async consult on behalf of a patient if granted book-consults scope. May attend (view outcome) if granted attend-consults scope. All delegate-initiated consults are audited. |
| **Clinician** | Reviews AI-prepared summary, interaction signals, and patient data. Makes clinical decisions (prescribe, recommend, refer, follow up, decline). Documents rationale. |
| **AI Clinical Assistant (Mode 2)** | Consumes structured intake, runs eligibility and safety checks, produces clinical summary with recommendation for clinician review. |
| **AI Clinical Assistant (Mode 1)** | May help the patient understand the consult outcome, explain the clinician's decision, and answer follow-up questions. |
| **Medication Interaction & Validation Engine** | Runs as part of Mode 2 preparation if a prescription is being considered. Signals are included in the clinician summary. |
| **Herb-Drug Interaction Engine** | Runs if the patient has reported herbal medicines. Signals included in clinician summary. |
| **Pharmacy Portal** | Receives approved prescriptions from async consult decisions. |

---

## 4. Consult types

Async consults serve two distinct purposes, with different workflows:

### 4.1 Program-pathway consult

The patient is enrolling in or already part of a managed program (GLP-1, ED, chronic care). The intake is structured and program-specific (Forms/Intake Engine §9). Mode 2 prepares a protocol-aware clinical summary. The clinician's decision space is bounded by the program's clinical envelope.

**Characteristics:**
- Structured intake with program-specific template
- AI Mode 2 prepares a clinical summary with eligibility assessment and recommendation
- Clinician decision is typically: prescribe within program formulary, request additional data, or decline/refer
- Payment: per-visit consult fee displayed upfront
- Turnaround target: clinician decision within 24 hours of intake submission

### 4.2 General async consult

The patient has a health question or concern not tied to a specific managed program. The intake is less structured (consult intake template from Forms/Intake Engine §9.4). Mode 2 may or may not be involved depending on whether the concern falls within a structured pathway. The clinician's decision space is broader.

**Characteristics:**
- Semi-structured intake (chief complaint, symptom detail, medication and herbal medicine update, recent changes, patient goals)
- AI Mode 2 may prepare a summary if the concern maps to a supported pathway; otherwise, Mode 1 may prepare a lighter-weight intake summary for the clinician
- Clinician decision may include: advice, prescription, referral, lab order, follow-up consult recommendation, or escalation to sync video
- Payment: per-visit consult fee displayed upfront
- Turnaround target: clinician decision within 24 hours

---

## 5. Async consult workflow

### 5.1 Step 1 — Initiation

The patient initiates an async consult from:
- **Program enrollment flow.** After completing program intake, the consult is initiated automatically — the intake is the consult.
- **Care tab.** "Start a consultation" button leading to consult type selection (program-specific or general).
- **AI Clinical Assistant (Mode 1).** When Mode 1 determines a patient's question requires clinician review, it offers: "I think a doctor should look at this. Would you like me to start a consultation?" If the patient agrees, Mode 1 hands off to the intake flow with relevant context pre-filled.
- **Medication detail page.** "Ask your doctor about this medication" initiates a consult pre-seeded with medication context.
- **RPM/CCM dashboard.** When an alert or trend warrants clinician review, the patient can initiate a consult from the RPM surface.

**At initiation, the patient sees:**
- Consult type (program-pathway or general)
- Expected turnaround time (within 24 hours)
- Consult fee (displayed upfront, per Master PRD §18)
- Payment confirmation before proceeding

### 5.2 Step 2 — Intake

The patient completes the appropriate intake form (Forms/Intake Engine):
- Program-pathway: program-specific template (§9.1, §9.2, §9.3 of Forms Slice)
- General: consult intake template (§9.4 of Forms Slice)

The intake includes:
- Chief complaint or program-specific screening data
- Current medication confirmation (quick reconciliation check)
- Current herbal medicine confirmation
- Recent changes (new symptoms, new medications, hospitalizations, labs)
- Photos if relevant
- The patient's stated goal: "What would help most from this consultation?"

**Intake saves progress and supports resume** (Forms Slice §10.1). If the patient abandons mid-intake, they can return and complete it.

### 5.3 Step 3 — AI preparation

After intake submission, AI processes the case:

**For program-pathway consults (Mode 2):**
- Mode 2 consumes the structured intake data
- Runs eligibility checks against program criteria
- Calls the Medication Interaction & Validation Engine (all five check classes)
- Calls the Herb-Drug Interaction Engine if the patient has reported herbal medicines
- Evaluates protocol criteria (whitelisted formulary, indications, exclusion rules)
- Produces a structured clinical summary (AI Clinical Assistant Slice §6.1, §6.2):
  - Patient profile and program enrollment
  - Intake findings organized clinically
  - Interaction signals (medication + herb-drug), ordered by severity
  - Eligibility assessment with flagged concerns
  - Recommended clinical action with confidence level
  - Clear indication that this is an AI-prepared summary

**For general consults (Mode 1-assisted):**
- Mode 1 prepares a lighter-weight intake summary:
  - Chief complaint and symptom detail (from the patient's words)
  - Relevant medication and herbal medicine context
  - Relevant condition context
  - Interaction signals if the concern involves medications
  - No protocol evaluation or eligibility assessment (no program pathway)
  - No clinical recommendation (Mode 1 does not make recommendations)

**Processing time target:** Mode 2 processing under 30 seconds. Mode 1 summary preparation under 15 seconds.

### 5.4 Step 4 — Clinician review

The AI-prepared case enters the clinician's async review queue.

**Queue prioritization:**
1. Escalated cases (protocol fallback, critical signals, emergency indicators)
2. Time-sensitive cases (approaching turnaround deadline)
3. Program-pathway consults (structured, faster to review)
4. General consults
5. Follow-up reviews

**What the clinician sees:**

For program-pathway consults:
- Patient demographics and program context
- AI Mode 2 clinical summary with recommendation and confidence
- Interaction engine signals (all five check classes), ordered by severity
- Herb-drug signals (if applicable), with evidence quality
- Patient's intake responses (accessible but not the primary view — the AI summary is primary)
- Patient's medication list, condition list, lab summary, and RPM data (if enrolled)
- Delegate context (if delegate-initiated)
- Action controls: prescribe, request additional data, decline with reason, escalate to sync video, refer

For general consults:
- Patient demographics
- Mode 1 intake summary
- Interaction signals (if medication-related)
- Patient's full health profile accessible
- Action controls: advise, prescribe, order labs, recommend follow-up, escalate to sync video, refer

### 5.5 Step 5 — Clinician decision

The clinician takes one of the following actions:

**Prescribe.** The clinician writes a prescription within the program formulary (program-pathway) or the platform's general formulary (general consult). The prescription triggers:
- Medication Interaction & Validation Engine check against the full medication list (if not already run by Mode 2, or if the clinician prescribes something different from the Mode 2 recommendation)
- Herb-Drug Interaction Engine check
- If critical or major signals are present, the clinician must acknowledge or override (Medication Interaction Engine Slice §7.1)
- The approved prescription flows to the Pharmacy Portal for fulfillment
- The patient is notified: "Your doctor has reviewed your consultation and prescribed [medication]. Your prescription has been sent to the pharmacy."

**Advise without prescribing.** The clinician provides clinical advice, lifestyle recommendations, or reassurance without a prescription. The advice is documented as a clinical note. The patient is notified with the advice.

**Request additional data.** The clinician needs more information before making a decision. Options:
- Request specific labs (patient is notified with lab instructions)
- Request additional history or clarification (a structured follow-up question sent to the patient via messaging)
- Request photos (patient is prompted to upload)
The consult status changes to "Awaiting your response" and the turnaround clock pauses until the patient provides the requested data.

**Order labs.** The clinician orders specific lab tests. The patient is notified with instructions on where and when to get labs done. The consult may be held pending lab results or the clinician may proceed with a preliminary decision.

**Escalate to sync video.** The clinician determines the case requires a live conversation — the concern is too complex, the patient history is too nuanced, or the clinician needs to observe the patient. The consult status changes to "Your doctor would like to schedule a video visit." The patient is offered available time slots. The async consult converts to a sync consult (the intake data and AI preparation carry forward — the patient does not repeat the intake).

**Decline with reason.** The clinician determines they cannot help the patient through Telecheck's async pathway. Reasons may include: outside scope of practice, requires in-person examination, requires specialist referral. The patient is notified with the reason and recommended next steps. No consult fee is charged if the clinician declines without providing any clinical value (market-specific policy).

**Refer.** The clinician refers the patient to a specialist, emergency care, or external provider. The referral reason and destination are documented. The patient is notified with referral details.

### 5.6 Step 6 — Decision documentation

Every clinician action is documented as an auditable clinical artifact:
- Decision type (prescribe, advise, request data, order labs, escalate, decline, refer)
- Clinical rationale (structured + free text)
- AI Mode 2 recommendation (if applicable) and whether the clinician agreed, modified, or disagreed
- Interaction signals reviewed and any overrides with rationale
- Prescription details (if prescribing)
- Follow-up plan
- Clinician identity and timestamp

**If the clinician disagrees with Mode 2's recommendation:**
- The disagreement is documented with rationale
- The disagreement is tracked as a Mode 2 quality signal (AI Clinical Assistant Slice §16.2)
- The clinician's decision takes precedence — Mode 2's recommendation is advisory

### 5.7 Step 7 — Patient notification and follow-up

The patient is notified of the clinician's decision via in-app + WhatsApp:
- "Your doctor has reviewed your consultation. Tap to see the results."
- The notification does not include the specific clinical decision — it directs the patient to view the full outcome in-app where context and explanation are present.

**In-app, the patient sees:**
- Clinician's decision in patient-appropriate language
- If prescribing: medication name, why it was prescribed, dosing instructions, side effects to watch for, what to do if they have concerns. Prescription flows to pharmacy.
- If advising: the advice, with explanation
- If requesting data: what the clinician needs and how to provide it
- If escalating to sync: available video consult time slots
- If declining/referring: the reason, next steps, and where to go
- Follow-up plan (when to expect the next touchpoint)
- "Have questions?" → opens Mode 1 pre-seeded with the consult context

---

## 6. Payment model

**Per-visit, patient-pay.** The consult fee is displayed upfront at initiation (Step 1) before the patient commits. Payment is collected at submission of the intake form (before clinician review).

**Fee structure:**
- Program-pathway consults: fixed fee per program (may vary by program complexity)
- General async consults: fixed fee

**Refund policy:**
- If the clinician declines without providing clinical value: full refund
- If the clinician provides advice but no prescription: no refund (clinical value was delivered)
- If the patient cancels before the clinician reviews: full refund
- If the patient does not respond to a request for additional data within 14 days: the consult is closed. Partial refund at platform discretion.

**Delegate payments:** A delegate with make-payments scope can pay the consult fee on the patient's behalf.

**No consult fee on refill reviews.** If the async consult is a refill review (medication renewal for an established program), the refill payment model applies (medication-cost only, no consult fee — Refill Slice §8).

---

## 7. Turnaround and SLA

**Target turnaround: clinician decision within 24 hours of intake submission.** This is the primary patient-facing commitment. It means: from the moment the patient submits their completed intake, a clinician will review and act within 24 hours.

**Internal processing breakdown:**
- AI preparation (Mode 2 or Mode 1 summary): under 30 seconds
- Queue wait time: target under 12 hours
- Clinician review and decision: target under 30 minutes active review time
- Total: under 24 hours end-to-end

**What pauses the clock:**
- Request for additional data from the patient (clock pauses until patient responds)
- Escalation to sync video (clock restarts as a sync consult SLA)
- Platform operational issues (system outage — clock pauses and the patient is notified)

**What does not pause the clock:**
- Weekends and holidays (the clinician panel must provide coverage per the coverage model — Master PRD §23 Q5)
- Queue volume (staffing must match volume — if the queue grows, the panel expands)

**SLA monitoring:** Time-to-clinician-decision is headline launch metric #2 (Master PRD §19). It is tracked per consult, per clinician, per program, and in aggregate. SLA breaches trigger operations alerts.

---

## 8. Clinician review surface

### 8.1 Review queue

The clinician's primary async review surface:
- Pending cases sorted by priority (§5.4)
- Each case shows: patient name, consult type (program/general), submission time, time remaining to SLA, signal summary (interaction + herb-drug signal count by severity), Mode 2 recommendation (if applicable), delegate context
- Claim button to take ownership of a case
- Batch view of the queue with filtering by program, priority, and time

### 8.2 Case review

When the clinician opens a case:
- **Left panel:** AI-prepared summary (Mode 2 or Mode 1), with interaction signals and herb-drug signals displayed below the summary, ordered by severity
- **Right panel:** Patient profile — medication list, condition list, allergy list, herbal medicines, recent labs, RPM data (if enrolled), refill history, consult history
- **Bottom panel:** Action controls — prescribe, advise, request data, order labs, escalate, decline, refer. Each action opens a structured documentation form.
- **Expandable:** Full intake responses, original intake form, AI Mode 1 conversation history (if Mode 1 contributed context), previous consult records

### 8.3 Prescription within the review

If the clinician prescribes:
- Medication search (formulary autocomplete)
- Dose, frequency, duration, quantity
- Indication (auto-populated from program context or clinician-selected)
- Interaction engine check runs immediately on the selected medication
- If signals are produced, they display inline before the clinician confirms
- Special instructions for the patient
- Pharmacy routing (auto-determined by medication/program routing rules)
- Confirm → prescription flows to Pharmacy Portal

---

## 9. Edge cases

### 9.1 Clinician disagrees with Mode 2 recommendation

The clinician may agree, modify, or completely disagree with Mode 2's recommendation. All three are valid clinical actions:
- **Agree:** Clinician approves the AI recommendation. Audited as clinician-approved-AI-recommendation.
- **Modify:** Clinician approves a different medication, dose, or action. Audited as clinician-modified with rationale.
- **Disagree:** Clinician declines what Mode 2 recommended or prescribes the opposite. Audited as clinician-disagreed with rationale. This is a high-value quality signal — it feeds Mode 2 accuracy tracking.

None of these is flagged as an error. Clinical judgment takes precedence over AI recommendation.

### 9.2 Patient submits incomplete intake

If the intake form is submitted with required fields missing (patient bypassed validation — shouldn't happen but might):
- Mode 2 flags the missing data in its summary
- The clinician sees which fields are missing
- The clinician can proceed with available data or request the missing information from the patient
- The consult is not auto-rejected for incomplete data — the clinician decides whether enough information exists

### 9.3 Patient cancels after submission

If the patient cancels the consult after submitting the intake but before the clinician reviews:
- Full refund
- The intake data is retained in the patient's health profile (it's valid health information regardless of the consult outcome)
- The case is removed from the clinician's queue
- If the clinician has already started reviewing (claimed the case), the cancellation still proceeds but the clinician is notified

### 9.4 Clinician identifies an emergency during review

If the clinician, while reviewing an async case, identifies signs of a medical emergency that the patient may not have recognized:
- The clinician triggers the emergency escalation pathway
- The patient is contacted immediately via all available channels (in-app, WhatsApp, SMS, phone if available)
- Emergency guidance is provided
- The async consult is superseded by the emergency pathway
- This is documented as a safety event contributing to headline metric #3

### 9.5 Multiple simultaneous consults

A patient may have an active async consult in one program while requesting a consult in another. The system allows this but:
- The clinician reviewing either consult sees both active consults
- Interaction engine checks consider all active prescriptions and pending prescriptions
- If the two consults produce conflicting prescriptions, the second clinician is alerted

### 9.6 Async-to-sync conversion

When a clinician escalates an async case to sync video:
- All intake data, AI preparation, and interaction signals carry forward to the sync consult
- The patient does not repeat the intake
- The sync consult is scheduled (patient selects from available slots)
- The async consult status shows "Converted to video consult"
- The consult fee applies once (the patient does not pay for both async and sync)
- If the sync consult requires different pricing, the difference is charged or refunded

---

## 10. Delegate-initiated consults

A delegate with **book-consults** scope can initiate an async consult on behalf of the patient.

**What the delegate can do:**
- Initiate the consult and complete the intake form (within their visibility scope)
- Pay the consult fee (if granted make-payments scope)
- View the consult outcome (if granted attend-consults scope)

**What the delegate cannot do:**
- Complete intake sections that reference sensitive-category data they haven't been granted access to
- Override or acknowledge interaction signals
- Make clinical decisions
- Cancel a consult without the patient's confirmation

**Consent blocks in the intake** can only be completed by the patient (or a delegate with give-consent-on-behalf scope). If the consult intake includes a consent block the delegate cannot complete, the delegate is informed and the patient must complete that section.

**Audit:** Every delegate-initiated consult is recorded with delegate identity, relationship type, and delegation scope at the time of initiation.

---

## 11. Post-consult follow-up

### 11.1 Follow-up plan

Every completed async consult has a follow-up plan, even if the plan is "no follow-up needed." The plan includes:
- Next scheduled touchpoint (if any) — follow-up consult, lab check, program check-in
- What the patient should watch for (symptoms, side effects, changes)
- When to seek immediate care
- When to return to the platform

### 11.2 Follow-up messaging

After the consult, the patient and clinician can exchange follow-up messages through the platform's messaging system:
- Patient can ask clarifying questions about the clinician's decision
- Clinician can provide additional instructions or check on the patient
- Messages are threaded to the consult record
- Follow-up messaging is included in the consult (no additional fee for follow-up questions within a reasonable window — recommend 7 days post-decision)

### 11.3 Follow-up nudges

If the clinician specified a follow-up action (get labs, schedule a follow-up consult, start monitoring), the system generates follow-up nudges:
- Lab reminder if labs were ordered (via notification system)
- Follow-up consult reminder if a follow-up was recommended
- Medication start reminder if a new medication was prescribed
- RPM enrollment prompt if the clinician recommended monitoring

---

## 12. States and transitions

| State | Description | Next state |
|---|---|---|
| **Initiated** | Patient has selected consult type and confirmed payment | Intake |
| **Intake** | Patient completing the intake form | Submitted / Abandoned |
| **Abandoned** | Patient started intake but did not complete (48-hour nudge applies) | Resumed → Intake / Expired |
| **Submitted** | Intake completed and submitted; AI processing begins | Processing |
| **Processing** | AI Mode 2 or Mode 1 preparing clinical summary | Queued |
| **Queued** | AI preparation complete; case in clinician review queue | Under Review |
| **Under Review** | Clinician has claimed and is reviewing the case | Decision Made |
| **Decision Made** | Clinician has acted (prescribe, advise, request data, escalate, decline, refer) | Varies by decision type |
| **Prescribed** | Prescription approved and sent to pharmacy | Pharmacy (→ Pharmacy Portal workflow) |
| **Advised** | Clinical advice delivered to patient | Follow-Up / Completed |
| **Awaiting Data** | Clinician requested additional information from patient | Patient Response → Under Review |
| **Escalated to Sync** | Clinician escalated to video consult | Sync Consult workflow |
| **Declined** | Clinician declined; patient notified with reason | Completed |
| **Referred** | Clinician referred to specialist or external provider | Completed |
| **Follow-Up** | Post-decision follow-up period (messaging, monitoring) | Completed |
| **Completed** | Consult concluded; all actions documented | — |

---

## 13. Audit

| Event | What is recorded |
|---|---|
| Consult initiated | Patient/delegate ID, consult type (program/general), program (if applicable), payment amount, timestamp |
| Intake submitted | Template ID, version, all field values, delegate context (if applicable), timestamp |
| AI preparation completed | Mode (Mode 2 / Mode 1), processing time, summary produced, signals generated, recommendation (if Mode 2), AI model version, timestamp |
| Case claimed by clinician | Clinician ID, time in queue, timestamp |
| Clinician decision | Decision type, rationale, AI recommendation agreement/modification/disagreement, interaction signals reviewed, overrides (with rationale), prescription details (if applicable), follow-up plan, timestamp |
| Prescription created | Medication, dose, frequency, quantity, indication, interaction engine check result, pharmacy routing, timestamp |
| Additional data requested | What was requested, patient notification, timestamp |
| Escalation to sync | Reason, sync consult scheduling, timestamp |
| Patient notification sent | Channel, content summary, timestamp |
| Follow-up message | Sender (patient/clinician), message content, timestamp |
| Consult completed | Final status, follow-up plan, timestamp |

---

## 14. Metrics

**Throughput**
- Consult volume per day (program-pathway vs general)
- Time-to-clinician-decision (headline metric #2) — by consult type, by clinician, by program
- AI preparation time (Mode 2 and Mode 1)
- Queue wait time
- Clinician active review time per case

**Clinical quality**
- Mode 2 recommendation acceptance rate (clinician agrees without modification)
- Mode 2 recommendation modification rate
- Mode 2 recommendation disagreement rate
- Prescription rate per consult type
- Interaction signal override rate at prescribing
- Escalation-to-sync rate (how often does async need to become sync?)
- Request-for-additional-data rate (are intakes capturing enough information?)
- Decline/refer rate

**Patient experience**
- Intake completion rate (initiated → submitted)
- Intake abandonment rate
- Post-decision follow-up question rate (are patients understanding the outcome?)
- Patient satisfaction with outcome (if measured)
- Time from decision to patient viewing the outcome

**Commerce**
- Revenue per async consult
- Refund rate
- Async-to-sync conversion rate (revenue impact — single fee or differential?)
- Follow-up consult rate (returning patients)

**Delegation**
- Delegate-initiated consult percentage
- Delegate-initiated consult completion rate vs patient-initiated

---

## 15. Dependencies

- **Identity & Authentication Spec v1.0.** Authenticated patient, clinician, pharmacist, moderator, admin, and delegate sessions are required for every actor surface this slice uses.
- **Forms/Intake Engine Slice.** Intake forms for program-pathway and general consults are defined and rendered by the intake engine.
- **AI Clinical Assistant Slice.** Mode 2 prepares program-pathway summaries. Mode 1 prepares general consult summaries and assists patients pre and post-consult.
- **Medication Interaction & Validation Engine Slice.** Runs during Mode 2 preparation and at prescribing time.
- **Herb-Drug Interaction Engine Slice.** Runs alongside medication engine if patient has reported herbal medicines.
- **Pharmacy Portal Slice.** Receives approved prescriptions from async consults.
- **Refill Slice.** Medications prescribed through async consult become eligible for refills.
- **Consent & Delegated Access Slice.** Care consent required for consult. Delegation scope gates delegate-initiated consults.
- **Labs Slice.** Lab orders from async consults are tracked. Lab results may trigger follow-up.
- **RPM/CCM Slice.** Clinician may recommend RPM enrollment as part of consult outcome.
- **Adverse Event Reporting Slice.** Adverse events identified during consult review feed the reporting system.
- **Payment & Billing Spec v1.0.** Consult fee collection at submission, abandoned-payment recovery, and refund processing for declined consults are governed by the payment specification.
- **Messaging & Inbox Spec v1.0.** Inbox threads and message-delivery expectations govern care-team and patient-visible communication generated by this workflow.
- **Notification infrastructure.** Patient notifications for consult outcome, follow-up reminders.
- **Clinician panel (§23 Q5).** Async consult volume must be serviceable within the clinician coverage model.

---

## 16. Open questions (slice-level)

1. **Follow-up message window.** How long after a consult decision can the patient send follow-up questions without an additional consult fee? 7 days is recommended — is this the right duration?
2. **Async consult for minors.** When a parent-of-minor delegate initiates an async consult for their child, does the clinician review the case differently? Are there specific safeguarding checks in the clinician review flow for minor patients?
3. **Consult history visibility.** How much consult history does the clinician see? All previous consults? Only consults for the same program? Only the last N consults? Too much history is overwhelming; too little loses context.
4. **Clinician assignment.** Are cases assigned to specific clinicians (continuity of care) or distributed to the first available clinician (faster turnaround)? Is this configurable per program?
5. **Second-opinion pathway.** Can a patient request a second opinion on an async consult decision? If so, is this a new consult (new fee) or a built-in right? Second opinion is a post-launch capability (Master PRD §11.2) but the async consult workflow should accommodate it architecturally.
6. **Intake expiry.** If a patient submits an intake but the clinician doesn't review it for 48+ hours (SLA breach), does the intake data become stale? Should the patient be asked to confirm their current status before the clinician reviews?

---

## Document control

- **v1.0** — Initial Async Consult slice PRD. Defines two consult types (program-pathway with Mode 2, general with Mode 1), seven-step workflow from initiation through follow-up, clinician review surface with AI-prepared summaries, six clinician decision types with documentation requirements, async-to-sync conversion, delegate-initiated consults, payment model with refund policy, 24-hour turnaround SLA, and post-consult follow-up with messaging and nudges. Derived from Master PRD v1.6 §10 Pillar 1.
- **Next review:** after clinician coverage model is resolved (§23 Q5) to validate turnaround SLA feasibility; after Sync Video Consult Slice PRD v1.0 is cross-validated against the async-to-sync conversion interface.
- **Change discipline:** changes to the consult workflow steps, clinician decision types, Mode 2 integration, payment model, turnaround SLA, or async-to-sync conversion require explicit owner sign-off.
