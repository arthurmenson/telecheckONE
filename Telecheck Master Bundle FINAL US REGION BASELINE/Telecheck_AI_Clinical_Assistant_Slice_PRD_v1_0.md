# Telecheck — AI Clinical Assistant Slice PRD

**Version:** 1.0
**Status:** Canonical for development
**Owner:** AI Safety & Guardrails Lead
**Parent document:** Telecheck Master Platform PRD v1.6, §10 Pillar 2, §13.1, §13.2
**Companion documents:** Medication Interaction & Validation Engine Slice PRD v1.0, Refill Slice PRD v1.0, Herb–Drug Interaction Engine Slice PRD v1.0, v5 Contracts Pack

---

## 1. Purpose and strategic role

The AI Clinical Assistant is Telecheck's most visible AI surface and its highest-risk patient-facing capability. It is the feature patients will interact with most frequently between clinical events, and the feature most likely to create trust or destroy it.

This slice defines two distinct operating modes — **Mode 1 (Conversational Assistant)** and **Mode 2 (Protocol Execution Agent)** — that share infrastructure but operate under different autonomy frameworks, different audit models, and different governance structures. Treating them as a single undifferentiated "AI chat" would produce a system that is either too restricted to be useful or too permissive to be safe.

The AI Clinical Assistant is also the primary **acquisition-to-clinical-care bridge**. Patients who enter the platform through low-friction tools (food scanning, fitness tracking, pregnancy tracking) encounter the assistant first when they have a health question. If the assistant is helpful, clear, and trustworthy, it converts engagement into clinical relationships. If it is unhelpful, evasive, or alarming, it drives patients away before they ever see a clinician.

This slice defines:
- What the assistant can and cannot do in each mode
- How guardrail templates govern Mode 1
- How protocol governance controls Mode 2
- How the assistant interacts with other platform services (interaction engine, labs, refills, community)
- What the patient, clinician, and operator see
- What is audited
- What happens when things go wrong

---

## 2. Traceability

| Master PRD reference | This slice addresses |
|---|---|
| §8 Job 9 — Converse with AI for clinical understanding | Mode 1 — full patient-facing conversational assistant |
| §8 Job 10 — Review and oversee AI suggestions and protocol-authorized actions | Mode 2 — clinician review of AI-prepared clinical summaries |
| §8 Job 2 — Refill a medication safely | Mode 1 can help initiate refills; Mode 2 does not process refills |
| §8 Job 3 — Upload and interpret a document or lab | Mode 1 can explain lab results; references interaction engine signals |
| §10 Pillar 2 — AI clinical support and conversational assistant | Full pillar definition including two-mode framework |
| §11.1 Launch scope — AI Clinical Assistant chat | Global launcher, embedded cards, full workspace |
| §13.1 Protocolized clinical autonomy | Mode 2 governance |
| §13.2 Guardrail-configured conversational autonomy | Mode 1 governance |
| §13.4 Platform floor | Immutable behavioral floor for both modes |
| §14 Admin configuration surfaces | Guardrail template management for Mode 1; protocol governance for Mode 2 |
| §17 Notification architecture | AI-initiated notifications and follow-up nudges |
| §23 Q2 — AI guardrail template count and coverage | Pre-launch decision governing Mode 1 launch behavior |

---

## 3. Actors

| Actor | Role with this service |
|---|---|
| **Patient** | Primary user of Mode 1. Asks questions, receives explanations, initiates workflows, uploads data. Does not interact with Mode 2 directly. |
| **Delegate** | May use Mode 1 on behalf of a patient if granted appropriate access scope. Delegate context is always visible in the conversation. Mode 1 applies the target account's consent and access rules. |
| **Clinician** | Reviews Mode 2 outputs. Sees AI-prepared clinical summaries, interaction signals, and protocol evaluation results. Approves, modifies, or declines. Also sees Mode 1 conversation history when relevant to clinical decisions. |
| **Pharmacist** | Does not interact with the assistant directly. May see AI-referenced interaction signals that originated from Mode 1 patient queries. |
| **Operator / admin** | Configures guardrail templates (Mode 1) and protocol governance (Mode 2) through admin surfaces. Reviews AI performance metrics, refusal rates, escalation rates. |
| **Medication Interaction & Validation Engine** | Mode 1 references engine signals when answering medication questions. Mode 2 calls the engine as part of protocol evaluation. |
| **Herb–Drug Interaction Engine** | Mode 1 references herb–drug signals when patients ask about herbal medicines. Same signal model as medication engine. |
| **Protocol engine** | Mode 2 operates as a protocol execution agent. The protocol engine evaluates eligibility, checks, and gate criteria. |

---

## 4. Two modes — architectural distinction

### 4.1 Mode 1 — Conversational Assistant

**Governed by:** §13.2 (guardrail-configured conversational autonomy)

**What it is:** A patient-facing conversational interface that helps patients understand their health, medications, labs, symptoms, and care options. It explains, summarizes, interprets, helps initiate workflows, and escalates to clinicians when appropriate.

**What it does:**
- Answers patient questions about medications, conditions, symptoms, lab results, and care plans
- Explains interaction engine signals in patient-appropriate language
- Explains herb–drug interaction signals
- Helps patients initiate workflows (refill requests, consult bookings, lab uploads)
- Provides food, fitness, and nutrition guidance connected to the patient's conditions and medications
- Surfaces relevant care program information and adherence reminders
- Escalates to a clinician when a question exceeds its scope or when a safety signal is present
- Refuses with explanation when a question falls outside the active guardrail's scope

**What it does not do:**
- Approve prescriptions, refills, or medication changes
- Make definitive diagnoses
- Provide specific dosing advice outside an authenticated, consented care relationship
- Override or suppress interaction engine signals
- Execute clinical actions or protocol-authorized workflows
- Impersonate a named clinician
- Conceal that the patient is interacting with AI

**Where it appears:**
- **Global launcher.** Accessible from any primary screen. A persistent entry point the patient can reach without navigating away from their current context.
- **Embedded cards.** Contextual AI suggestions embedded in Home, Labs, Pharmacy, and Care surfaces. Example: on the medication detail page, an embedded card might say "Have a question about this medication? Ask me." Tapping opens Mode 1 pre-seeded with the medication context.
- **Full workspace.** A dedicated chat interface where the patient can have extended conversations, review past conversations, and access saved explanations.

**Session model:** Each conversation with Mode 1 is a session. Sessions are logged with timestamps, guardrail version, and conversation content. Sessions are accessible to the patient in their conversation history. Clinicians can review sessions when clinically relevant (e.g., "what did the patient ask about their medication before this refill?").

### 4.2 Mode 2 — Protocol Execution Agent

**Governed by:** §13.1 (protocolized clinical autonomy)

**What it is:** An automated clinical review engine that operates as a protocol executor for structured async care pathways. It is not a conversational agent. It consumes structured intake data and produces structured clinical outputs for physician review.

**What it does:**
- Consumes structured intake data from the Forms/Intake Engine (symptom questionnaires, medical history, current medications, allergies, contraindications)
- Runs eligibility checks against program criteria
- Calls the Medication Interaction & Validation Engine
- Calls the Herb–Drug Interaction Engine where relevant
- Evaluates protocol criteria (whitelisted formulary, whitelisted indications, exclusion rules)
- Produces a structured clinical summary with: patient profile, intake findings, interaction signals, eligibility assessment, protocol evaluation, and a recommended clinical action
- Routes the summary to the physician review queue

**What it does not do:**
- Converse with patients. Mode 2 has no patient-facing interface.
- Auto-approve clinical actions at launch. Every Mode 2 output requires physician action.
- Operate outside explicitly approved protocol envelopes
- Override interaction engine gate rules
- Function without a named accountable clinician for the active protocol

**Where it operates:**
- Behind the scenes in structured async care pathways. The patient interacts with the intake form; Mode 2 processes the intake and routes to the physician. The patient does not see Mode 2 or know it by that name — they experience "your information is being reviewed" followed by "your doctor has reviewed your case."

**Physician decision surface:** The physician receives the Mode 2 summary and takes one of three actions:
- **Approve** — the clinical action proceeds as recommended. Audited as clinician-approved with AI-prepared summary, protocol version, and engine version.
- **Approve with modification** — the physician adjusts the recommendation. Audited as clinician-modified.
- **Decline / escalate** — the case requires manual review, additional data, or is outside the protocol envelope. Audited as clinician-declined-protocol-recommendation with rationale.

### 4.3 What separates the modes

| Dimension | Mode 1 | Mode 2 |
|---|---|---|
| Patient-facing? | Yes — conversational | No — operates behind intake forms |
| Governance framework | §13.2 — guardrail-configured | §13.1 — protocolized clinical autonomy |
| Admin configuration | Guardrail templates | Protocol activation and governance |
| Can execute clinical actions? | No | Yes, with physician sign-off |
| Audit model | Conversation log + guardrail version | Protocol execution audit + engine versions + physician action |
| Scope boundary | What it can discuss | What protocols it can execute |
| Failure mode | Refuses and escalates | Falls back to clinician review |

---

## 5. Guardrail templates (Mode 1)

Mode 1 operates under admin-configurable guardrail templates bounded by the platform floor (§13.4). Templates define what the AI may discuss, how it frames uncertainty, when it escalates, what it refuses, and how it presents itself.

### 5.1 Launch templates

Four guardrail templates ship at launch:

**1. Conservative Default Health Assistant**
- Default for all general patient chat outside specific program contexts
- Scope: general health education, medication explanations, lab result interpretation, symptom understanding, care navigation, workflow initiation (refill, consult booking, lab upload)
- Constraints: no condition-specific clinical advice beyond general education; no medication recommendations; no dosing guidance; escalates to clinician for any question requiring individualized clinical judgment
- Refusal behavior: declines with explanation and offers escalation path. Example: "That's a question your doctor would be best positioned to answer. Would you like me to help you book a consult?"
- Uncertainty framing: always explicit. "Based on general medical information..." or "This is not a diagnosis — your doctor can give you a personalized answer."

**2. GLP-1 Program Agent**
- Active when the patient is enrolled in a GLP-1 program and interacting within that program context
- Scope: everything in Conservative Default plus: GLP-1-specific intake support, titration schedule explanations, common side effect guidance within program parameters, adherence support, dietary guidance within program parameters, escalation for lab needs or contraindications
- Constraints: no dose modification recommendations; no off-protocol guidance; escalates for adverse events, cardiovascular risk factors, or complex comorbidity questions
- Program boundary: if the patient asks about something outside the GLP-1 program scope (e.g., "what about my blood pressure medication?"), the agent reverts to Conservative Default behavior for that question

**3. Men's Health / ED Program Agent**
- Active when the patient is enrolled in a men's health/ED program
- Scope: everything in Conservative Default plus: structured async intake support, contraindication screening within program parameters, refill assistance, common side effect guidance
- Constraints: no cardiovascular risk assessment beyond screening questions; escalates for polypharmacy, nitrate use, complex cardiovascular history, or unclear intake responses
- Sensitivity: maintains matter-of-fact, non-judgmental tone. Discreet program design extends to AI conversation.

**4. Labs & Medication Interpreter**
- Active when the patient is viewing or asking about lab results or medication interactions
- Scope: explains lab value meanings, lab trends and deltas, medication interaction signals from the engine, herb–drug interaction signals, monitoring requirements, what follow-up labs mean
- Constraints: never presents an interpretation as definitive diagnosis; always surfaces clinician review status ("your doctor has reviewed this" vs "this has not been reviewed yet"); escalates for critically abnormal values
- References interaction engine: when explaining a medication interaction, the interpreter uses the engine's signal data (severity, mechanism, recommended action) and presents it in patient-appropriate language

### 5.2 Template structure

Every guardrail template defines:

| Field | Description |
|---|---|
| Template ID | Unique versioned identifier |
| Name | Human-readable name |
| Scope definition | What topics and actions the AI may engage with |
| Refusal taxonomy | What topics trigger a refusal, categorized by reason |
| Escalation triggers | What conditions cause automatic escalation to a clinician |
| Uncertainty framing rules | How the AI expresses confidence, hedging, and limitations |
| Tone and persona rules | How the AI presents itself (warm, clinical, matter-of-fact) |
| Program boundary rules | What happens when a question crosses the template's scope boundary |
| Platform floor compliance | Verification that the template does not violate §13.4 |
| Test suite | Required test cases that must pass before deployment |
| Version | Template version; every change produces a new version |
| Review cadence | 6–12 months per §13.5 |

### 5.3 Template lifecycle

- **Creation.** Templates are created by the AI Safety & Guardrails Lead with clinical review.
- **Testing.** Every template has a test suite covering: happy-path conversations, edge-case questions, refusal behavior, escalation triggers, platform-floor compliance, and adversarial inputs. The test suite must pass before activation.
- **Deployment.** Templates are deployed per market and program through the admin guardrail configuration surface. The conservative default is deployed at launch for all markets.
- **Versioning.** Every change to a deployed template produces a new version. Every AI response logs the active template version.
- **Rollback.** Rollback to the previous template version is a single admin action.
- **Sunset.** Templates have a review cadence (6–12 months). If not renewed, they revert to the conservative default.

---

## 6. Protocol governance (Mode 2)

Mode 2 is governed by the same protocolized clinical autonomy framework as any protocol-authorized action (§13.1). This section defines Mode 2-specific governance.

### 6.1 Launch pathways

At launch, Mode 2 operates in two structured async care pathways:

**GLP-1 Async Intake and Review**
- Consumes the GLP-1 structured intake form
- Evaluates: BMI criteria, contraindication screening, medication history, interaction engine check, allergy check, pregnancy/lactation status, cardiovascular risk factors
- Produces: clinical summary with eligibility assessment, flagged concerns, interaction signals, and recommended action (approve for prescribing, request additional information, decline with reason)
- Routes to physician for approval

**Men's Health / ED Async Intake and Review**
- Consumes the ED structured intake form
- Evaluates: contraindication screening (nitrate use, cardiovascular history, alpha-blocker use), medication history, interaction engine check, blood pressure parameters where available
- Produces: clinical summary with eligibility assessment, flagged concerns, interaction signals, and recommended action
- Routes to physician for approval

### 6.2 Protocol gate rules

Mode 2 follows the same gate rules as any protocol-authorized action:

- **Critical interaction signal:** Mode 2 cannot produce a positive recommendation. Summary routes to physician with critical signal flagged prominently.
- **Major interaction signal:** Mode 2 cannot produce a positive recommendation unless the specific signal class is explicitly addressed in the approved protocol. Otherwise, routes with major signal flagged.
- **Exclusion criteria met:** Mode 2 produces a decline recommendation with the exclusion reason.
- **Incomplete data:** Mode 2 flags the missing data and recommends requesting additional information from the patient before clinical action.
- **Uncertainty threshold exceeded:** Mode 2 flags the uncertainty and recommends clinician review without a positive or negative recommendation.

### 6.3 Physician workflow

The physician sees Mode 2 output in their async review queue with:
- Patient demographics and program enrollment
- Structured intake summary (not raw form data — a clinically organized presentation)
- Interaction engine signals, ordered by severity
- Herb–drug signals, if the patient reported herbal medicines
- Mode 2's eligibility assessment and flagged concerns
- Mode 2's recommended action with confidence level
- A clear indication that this is an AI-prepared summary, not a clinician note
- One-action approve, modify, or decline controls

**Approval speed target:** For straightforward cases with no flagged signals, the physician should be able to review and approve in under 2 minutes. The AI summary is designed to make fast approval safe, not to make approval automatic.

### 6.4 Auto-approve (post-launch)

Auto-approve — where Mode 2 executes the clinical action without per-instance physician review — is explicitly post-launch (Feature PRD Index #28). Activation requires:
- Minimum 90 days of Mode 2 operation with physician review
- Physician override rate below a defined threshold (indicating AI recommendations are consistently aligned with physician judgment)
- Zero safety-critical overrides in the review period (no cases where the physician caught a dangerous AI recommendation)
- Clinical governance review and sign-off
- Activation through the protocol activation and governance admin surface
- Named accountable clinician
- Ongoing audit and incident-triggered review

---

## 7. Platform floor compliance (both modes)

Both modes comply with the immutable platform floor (§13.4). This section restates the floor as it applies specifically to the AI Clinical Assistant.

**The assistant never:**
- Conceals that the patient is interacting with AI when asked directly
- Impersonates a named individual human clinician
- Provides suicide means assistance or other clearly harmful instructions
- Provides specific dosing advice to users outside an authenticated, consented care relationship
- Diagnoses a named condition as definitive without clinician review
- Overrides required consent, identity, jurisdiction, or safety gating
- Bypasses mandatory escalation conditions
- Suppresses or overrides interaction engine signals

**The assistant always:**
- Labels itself as AI
- Indicates whether clinical content has been reviewed by a clinician ("reviewed" vs "not yet reviewed")
- Shows confidence and rationale for clinical claims
- Provides a visible escalation path to a clinician
- Refuses with explanation when a query falls outside the active guardrail's scope
- Surfaces delegate context visibly when operating on behalf of another account
- Logs every conversation with the active guardrail version (Mode 1) or protocol version (Mode 2)
- Triggers crisis detection and escalation if the patient expresses suicidal ideation, self-harm intent, or abuse indicators

---

## 8. Interaction with other platform services

### 8.1 Medication Interaction & Validation Engine

**Mode 1:** When a patient asks "Can I take X with Y?" or "What are the side effects of my medication?", Mode 1 references the engine's signal data for the patient's active medication list. It presents signals in patient-appropriate language, never suppresses them, and offers escalation. Mode 1 does not run the engine — it reads signals already produced by the engine at the last prescribing, refill, or medication-list-change event.

**Mode 2:** Calls the engine as part of protocol evaluation. All five check classes run against the patient's full medication profile. Engine signals are included in the clinical summary for physician review.

### 8.2 Herb–Drug Interaction Engine

Same pattern as the medication engine. Mode 1 explains herb–drug signals in patient-appropriate language. Mode 2 includes herb–drug signals in clinical summaries. Both modes clearly label the signal source (herb–drug engine vs medication engine).

### 8.3 Refill workflow

**Mode 1 only.** When a patient says "I need more of my blood pressure medication," Mode 1 identifies the relevant medication from the patient's active list and initiates the refill flow. Mode 1 pre-fills the refill request with the identified medication and hands off to the refill workflow. Mode 1 does not approve refills.

If the patient's request is ambiguous ("I need my medications"), Mode 1 asks which medication. If the medication is discontinued or declined, Mode 1 explains and directs the patient to book a consult.

### 8.4 Lab interpretation

**Mode 1.** When a patient views lab results or asks about them, Mode 1 explains: what the values mean, how they compare to reference ranges, what the trend looks like (stable, rising, falling), and how they connect to the patient's conditions and medications. Mode 1 always indicates whether the lab interpretation has been reviewed by a clinician. For critically abnormal values, Mode 1 escalates immediately.

### 8.5 Consult booking

**Mode 1.** The assistant can help patients find and book consultations. It can suggest whether an async or sync consult is appropriate based on the patient's question, but does not make the decision — the patient chooses.

### 8.6 Community

**Mode 1 does not participate in community discussions.** The assistant is not a community member and does not post in community groups. It may help patients find relevant community groups based on their conditions or programs. AI-generated content and peer content are always visually distinct (§17 of Master PRD).

### 8.7 Emergency escalation

**Both modes.** If the patient expresses or the intake data indicates: suicidal ideation with plan or imminent risk, chest pain with danger features, stroke-like symptoms, severe shortness of breath, anaphylaxis indicators, severe bleeding, obstetric emergency indicators, or altered mental status — the assistant immediately triggers the emergency escalation pathway. This is platform-floor behavior and cannot be configured away.

In Mode 1, the assistant surfaces emergency resources, contacts, and clear instructions while routing to the emergency pathway. It does not provide reassurance or attempt to assess severity autonomously.

In Mode 2, the protocol halts and the case is routed to immediate clinician review with emergency flags.

---

## 9. Delegate context

When a delegate is using Mode 1 on behalf of a patient:
- The conversation displays "You are chatting on behalf of [patient name]" prominently and persistently
- Mode 1 applies the target patient's consent and access rules to what it may discuss
- Mode 1 does not reveal information in sensitive categories the delegate has not been granted access to
- All conversation is logged in the target patient's account with the delegate's identity attached
- The delegate cannot use Mode 1 to override, suppress, or modify clinical information

---

## 10. Patient-facing experience

### 10.1 Conversation design principles

- **Lead with the answer, not the disclaimer.** When a patient asks a question the assistant can answer, answer it first, then add context or caveats. Do not start with "I'm an AI and I can't provide medical advice" before every response.
- **Short, clear, ranked.** Responses are concise. If multiple points are relevant, they are ranked by importance. Dense clinical data is surfaced when requested, not dumped unprompted.
- **Warm, not clinical.** The tone is that of a knowledgeable health companion, not a medical textbook. Clinical terminology is used when appropriate but always explained.
- **Uncertainty is shown, not hidden.** When the assistant is uncertain, it says so. "I'm not sure about this — your doctor would have a better answer" is always preferable to confident-sounding guesswork.
- **Escalation is a feature, not a failure.** When the assistant escalates to a clinician, the handoff is smooth, the context is preserved, and the patient understands what happens next.

### 10.2 Visible indicators

- **AI label.** Every AI response carries a visible, consistent AI indicator. This is not a first-message-only disclaimer — it is a persistent visual element.
- **Reviewed vs not reviewed.** When clinical content is displayed (lab interpretations, interaction signals), the review status is visible: "Reviewed by Dr. [Name]" or "Not yet reviewed by your doctor."
- **Guardrail refusal.** When the assistant refuses a question, the refusal is clear, non-judgmental, and includes an alternative path: "I can't advise on that specifically, but I can help you book a consult with your doctor."
- **Source attribution.** When the assistant references interaction engine signals, lab data, or program information, the source is identifiable. The patient knows whether information comes from their data, general medical knowledge, or the interaction engine.

### 10.3 Empty and error states

- **No data available.** If the patient asks about their medications but has no medications on file: "I don't have any medications on your profile yet. You can add them in your health profile, or your doctor can update your list during a consult."
- **Service unavailable.** If the AI service is temporarily unavailable: "I'm not available right now, but you can still reach your care team through messaging, or call [emergency number] if this is urgent."
- **Degraded connectivity.** Mode 1 requires connectivity for real-time conversation. In degraded mode, the launcher shows a clear disabled state with explanation, not a spinner.

---

## 11. Clinician-facing experience

### 11.1 Mode 1 conversation visibility

Clinicians can review a patient's Mode 1 conversation history when clinically relevant. The conversation is presented as a read-only log with timestamps, AI responses, and patient messages. Clinicians use this to understand: what the patient has been asking about, whether the patient has concerns the clinician should address, and whether the AI provided accurate information.

Clinicians do not edit or annotate Mode 1 conversations. They are reference material, not clinical notes.

### 11.2 Mode 2 review queue

The Mode 2 physician review queue is designed for speed and safety:
- Cases are ordered by: urgency (critical signals first), then submission time
- Each case shows: patient summary, AI assessment, signals, recommended action, and confidence
- Approve, modify, and decline are single-action controls
- Override of AI recommendation or interaction signal requires rationale
- Batch review is not supported at launch — each case is reviewed individually to prevent rubber-stamping

### 11.3 AI quality signals for clinicians

Clinicians see aggregate AI quality signals in their dashboard:
- Mode 2 recommendation acceptance rate (how often they approve without modification)
- Signal override rate
- Cases where Mode 2 recommended approval but the clinician declined (potential AI accuracy issue)
- Cases where Mode 2 recommended decline but the clinician approved (potential AI over-caution)

---

## 12. Operator-facing experience

### 12.1 Guardrail management (Mode 1)

Through the admin guardrail configuration surface:
- Select from available templates
- Customize scope, refusal taxonomy, escalation triggers, and tone within template bounds
- Run the template's test suite
- Deploy per market and program
- View deployed template version and deployment history
- Rollback to previous version in one action

### 12.2 Protocol management (Mode 2)

Through the admin protocol activation and governance surface:
- View available Mode 2 protocols (GLP-1 async intake, ED async intake)
- Activate per market and program
- Assign accountable clinician
- Configure eligibility criteria and exclusion rules within protocol bounds
- View protocol version, deployment history, and review schedule
- Rollback to previous version

### 12.3 Performance dashboards

- **Mode 1 metrics:** sessions per active patient, escalation-to-clinician rate, guardrail refusal rate, user-reported satisfaction, crisis escalation rate
- **Mode 2 metrics:** cases processed, physician approval rate, modification rate, decline rate, average time-to-physician-decision, signal override rate, protocol fallback rate

---

## 13. Audit

### 13.1 Mode 1 audit

Every Mode 1 conversation is logged with:
- Patient ID (or delegate ID + target patient ID)
- Session ID and timestamps
- Active guardrail template ID and version
- Full conversation content (patient messages and AI responses)
- Any escalation events (escalation reason, destination, timestamp)
- Any workflow initiations (refill, consult booking, lab upload)
- Any crisis detection triggers
- AI model version

### 13.2 Mode 2 audit

Every Mode 2 execution is logged with:
- Patient ID
- Program and protocol ID and version
- Intake data consumed
- Interaction engine signals (all five check classes, with engine version)
- Herb–drug signals (if applicable, with engine version)
- Eligibility assessment results
- AI recommendation and confidence
- Physician action (approve, modify, decline) with rationale if override
- AI model version
- Timestamp chain (intake submitted → Mode 2 processing complete → physician review → physician action)

### 13.3 Audit retention

Audit records are retained per v5 Contracts Pack retention rules. Mode 2 audit records are retained at least as long as any other clinical decision audit (they are clinical decision support artifacts). Mode 1 conversation logs are retained per data-use consent and jurisdictional requirements.

---

## 14. Error and exception handling

### 14.1 Mode 1 failures

- **AI service outage.** Launcher shows disabled state with explanation and alternative paths (messaging, phone).
- **Guardrail version mismatch.** If the active guardrail version cannot be confirmed, Mode 1 falls back to the conservative default template.
- **Escalation failure.** If escalation to a clinician fails (clinician queue unavailable), Mode 1 informs the patient, provides emergency contact information, and logs the failure for operations review.
- **Interaction engine unavailable.** If the interaction engine is unavailable when Mode 1 needs to reference medication signals, Mode 1 states: "I can't check your medication interactions right now. Please talk to your doctor or pharmacist before making any medication changes."

### 14.2 Mode 2 failures

- **Incomplete intake data.** Mode 2 flags the missing data in its summary and recommends requesting additional information. It does not attempt to proceed with incomplete data.
- **Interaction engine unavailable.** Mode 2 cannot proceed without an interaction engine check. The case is held and retried when the engine is available. If the hold exceeds a defined timeout, the case routes to clinician review with a "safety check incomplete" flag.
- **Protocol version mismatch.** If the active protocol version cannot be confirmed, Mode 2 does not execute. The case routes to clinician review.
- **AI confidence below threshold.** If Mode 2's confidence in its assessment falls below the protocol's defined confidence threshold, it does not produce a recommendation. The case routes to clinician review with full data and a "low confidence" flag.

---

## 15. Crisis detection

Crisis detection operates identically in both modes and is platform-floor behavior (§13.4). It cannot be configured away by guardrail templates or protocol governance.

**Triggers (minimum):**
- Suicidal ideation with plan or imminent risk indicators
- Self-harm in progress or imminent
- Abuse disclosure (domestic violence, child abuse, elder abuse)
- Homicidal ideation
- Symptoms consistent with medical emergency (chest pain with danger features, stroke, anaphylaxis, severe bleeding, obstetric emergency, altered mental status)

**Response:**
- Mode 1: immediately surfaces crisis resources (local emergency number, crisis helpline), provides clear instructions ("call [emergency number] now"), and routes to the emergency escalation pathway. Does not provide reassurance, attempt severity assessment, or continue the prior conversation topic.
- Mode 2: halts protocol execution. Routes case to immediate clinician review with emergency flags. Does not produce a standard clinical recommendation.

**Audit:** Every crisis detection trigger is logged with trigger type, patient ID, timestamp, response provided, and escalation destination. Crisis detection triggers are reviewed in aggregate as a safety metric.

---

## 16. Metrics

### 16.1 Mode 1 metrics

**Engagement**
- Chat sessions per active patient (target: healthy engagement, not dependency)
- Repeat session rate (patients returning to the assistant)
- Workflow initiations from chat (refills, consult bookings, lab uploads)
- Acquisition-tool-to-clinical-care conversion via AI (patients who first engage through AI and then enter a clinical program)

**Safety and quality**
- Escalation-to-clinician rate (within expected range — too low suggests unsafe answers, too high suggests unhelpful refusals)
- Guardrail refusal rate (within expected range)
- Crisis detection trigger rate and response-time
- AI-identified safety escalations that proved warranted vs false positives

**Trust**
- User-reported satisfaction / trust signals
- Conversation abandonment rate (patient stops responding — may indicate frustration or confusion)

### 16.2 Mode 2 metrics

**Throughput**
- Cases processed per day
- Time from intake submission to Mode 2 completion
- Time from Mode 2 completion to physician action
- End-to-end time (intake → physician action)

**Quality**
- Physician approval rate without modification (AI recommendation quality signal)
- Physician modification rate
- Physician decline rate
- Signal override rate (physician overrides interaction engine signal flagged in AI summary)
- Cases where physician action contradicted Mode 2 recommendation (tracked bidirectionally)
- Protocol fallback rate (Mode 2 unable to produce recommendation)

**Safety**
- Critical signal detection rate (did Mode 2 correctly flag critical interaction signals?)
- Cases with incomplete data that proceeded vs held
- Confidence-below-threshold rate

---

## 17. Dependencies

- **Identity & Authentication Spec v1.0.** Authenticated patient, clinician, pharmacist, moderator, admin, and delegate sessions are required for every actor surface this slice uses.
- **Medication Interaction & Validation Engine slice.** Mode 1 reads engine signals; Mode 2 calls the engine. Engine must be operational for Mode 2 to function.
- **Herb–Drug Interaction Engine Slice PRD v1.0.** Both modes reference herb–drug signals. Mode 1 can function without it (signals simply absent); Mode 2 may require it if the protocol includes herb–drug screening.
- **Refill slice.** Mode 1 initiates refill workflows. Refill flow must accept AI-initiated requests.
- **Forms / Intake Engine slice.** Mode 2 consumes structured intake data. Intake forms must produce data in the format Mode 2 expects.
- **Consent & Delegated Access slice.** Both modes check consent and delegation status. Mode 2 requires explicit care consent including protocolized actions.
- **Guardrail template content (§23 Q2).** Mode 1 cannot launch without at least the conservative default template fully defined, tested, and approved.
- **Protocol library (§23 Q1).** Mode 2 cannot launch without approved protocols for the target pathways (GLP-1, ED).
- **AI model infrastructure.** Both modes require reliable AI model access with acceptable latency. Target: Mode 1 response under 3 seconds; Mode 2 processing under 30 seconds.
- **Messaging & Inbox Spec v1.0.** Inbox threads and message-delivery expectations govern care-team and patient-visible communication generated by this workflow.
- **Notification infrastructure.** AI-initiated follow-up nudges (e.g., "you mentioned wanting to check in about your side effects — how are you feeling?") depend on the notification system.

---

## 18. Open questions (slice-level)

1. **Mode 1 conversation history retention period.** How long are Mode 1 conversations retained? Should patients be able to delete their conversation history? What are the jurisdictional requirements?
2. **Mode 1 proactive outreach.** Should Mode 1 initiate conversations (e.g., "You haven't checked in about your GLP-1 side effects this week — how are you feeling?"), or only respond when the patient initiates? Proactive outreach drives engagement but risks feeling intrusive.
3. **Mode 2 confidence threshold.** What is the specific confidence threshold below which Mode 2 does not produce a recommendation? Is it program-specific (lower threshold for low-risk programs, higher for higher-risk)?
4. **Mode 1 multilingual support.** At what point does Mode 1 need to support languages beyond English for Ghana launch? Are there high-priority local languages that should be added in the first 6 months?
5. **Mode 1 voice input.** Should Mode 1 accept voice input (speech-to-text) at launch or post-launch? Voice input would reduce friction for patients with low literacy but adds complexity.
6. **Cross-mode data flow.** When a patient uses Mode 1 to ask about their GLP-1 side effects and then submits a structured intake form that triggers Mode 2, should Mode 2 have access to the relevant Mode 1 conversation context? This could improve Mode 2's assessment but raises data-boundary questions.
7. **Mode 2 processing transparency.** Should the patient see any indication that AI processing is happening ("Your information is being reviewed by our clinical system"), or should they only see "Your information has been sent for doctor review"?

---

## Document control

- **v1.0** — Initial AI Clinical Assistant slice PRD, defining the two-mode framework (Mode 1 conversational assistant under §13.2, Mode 2 protocol execution agent under §13.1), four launch guardrail templates, two launch Mode 2 pathways, platform floor compliance, interaction with other platform services, delegate context, crisis detection, clinician and operator surfaces, and audit model. Derived from Master PRD v1.6 §10 Pillar 2 and the Flagged Items Resolution v1.0.
- **Next review:** after guardrail template content (§23 Q2) is resolved; after GLP-1 and ED intake form designs are finalized (Forms/Intake Engine dependency); after Herb–Drug Interaction Engine Slice PRD v1.0 is cross-validated against Mode 1 signal presentation rules.
- **Change discipline:** changes to the two-mode boundary, guardrail template structure, Mode 2 gate rules, platform floor compliance, crisis detection triggers, or auto-approve activation criteria require explicit owner sign-off and must be reflected back into the Master PRD if they alter the platform model.
