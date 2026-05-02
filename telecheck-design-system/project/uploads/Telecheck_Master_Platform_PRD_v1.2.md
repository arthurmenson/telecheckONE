# Telecheck — Master Platform PRD

**Version:** 1.2
**Status:** Draft for review
**Owner:** Product (Telecheck)
**Companion documents:** v4.2 Contracts Pack (governance), Canonical Data Model, State Machines, OpenAPI, Design System
**Document type:** Master Platform PRD — defines *what* is being built, *for whom*, *why*, and *what success looks like*. Implementation details live downstream.

---

## 1. Executive summary

Telecheck is an AI-powered telehealth, pharmacy, and health-intelligence platform that helps patients get assessed, treated, monitored, and guided through a connected digital care journey. It unifies care delivery, pharmacy fulfillment, lab interpretation, remote monitoring, and AI clinical support into one platform rather than leaving patients and operators to stitch them together.

Telecheck is designed as a global platform and pilots in Ghana. The pilot is a proving environment for the core loop — intake, AI interpretation, clinician review, prescribing, pharmacy fulfillment, delivery, and follow-up — not a market ceiling. Architecture, data residency, consent, and launch flows are jurisdiction-aware from day one.

**v1 anchors on the refill workflow** as the first proving slice because it exercises identity, consent, interaction checks, clinician oversight, pharmacy, and delivery in one loop. v1 also includes RPM/CCM for emerging-market chronic care, and introduces acquisition-oriented modules (food scanning, fitness, pregnancy tracking) that drive platform adoption without requiring a clinical visit. v1.5 adds depth (herb–drug intelligence, fake medication detection, sync consults, subscriptions) and v2 expands into advanced intelligence (AI second opinion, pharmacogenomics, DFPAS, institutional tooling).

**Revenue is direct patient-pay in v1:** per-visit consult fees shown upfront, per-prescription medication payments, and monthly RPM/CCM subscriptions in emerging markets. US market claims-based reimbursement is explicitly deferred. Low-friction modules (food, fitness, pregnancy) drive acquisition rather than primary revenue.

**Four headline pilot metrics:** refill completion rate, time to clinician review, safety-event handling latency, and audit-trail completeness.

---

## 2. How to read this document and its relationship to others

This PRD sits **above** vertical-slice specs and the OpenAPI surface, and **alongside** (slightly above) the v4.2 contracts pack.

| Layer | Document | Question it answers |
|---|---|---|
| Product truth | **This PRD** | What are we building, for whom, in what order, and why? |
| Operational / platform truth | v4.2 Contracts Pack | How must the platform behave safely and consistently? |
| Engineering truth | Domain model, state machines, OpenAPI, ADRs | How do we implement it concretely? |
| Experience truth | Design system, journeys, prototypes | How does it look, feel, and flow? |
| Slice truth | Per-feature PRDs and slice specs | How does *this specific* workflow ship? |

This document deliberately stops short of API schemas, screen layouts, database designs, and legal contract language. Those belong downstream.

Where this PRD and v4.2 appear to conflict, **v4.2 governs runtime behavior** and this PRD is updated to match. Every slice PRD must trace back to a job-to-be-done in §8 and a scope item in §11.

---

## 3. Product vision

**Telecheck is an AI-powered telehealth, pharmacy, and health-intelligence platform that helps patients get assessed, treated, monitored, and guided through a connected digital care journey.**

The shorter form: *Telecheck is a smart digital healthcare platform that combines telemedicine, pharmacy, labs, monitoring, and AI into one system.*

Telecheck is not a telehealth website with extras. It is a unified care, commerce, monitoring, and interpretation platform — designed so a patient can move through one continuous journey:

> Symptom or condition intake → AI guidance and triage → clinician review or live consult → prescription or recommendation → pharmacy fulfillment → delivery or pickup → follow-up monitoring → AI-supported interpretation of new labs, medications, food, and health signals.

Where most digital-health products force the patient (and the operator) to stitch together separate tools, Telecheck is the stitching.

---

## 4. Product thesis

Vision is what we're building toward. Thesis is what we believe that makes this the right bet.

**Belief 1 — Fragmented care is the real clinical problem, not the interface problem.** Most telehealth products compete on smoother booking or better video. The real failure is that medication history, lab trends, conditions, herbal co-medication, and monitoring data don't get reasoned over together. Unifying them wins.

**Belief 2 — AI's value in health is interpretation, not autonomy.** The enduring AI advantage is surfacing patterns across labs, drugs, conditions, and behavior. Attempting autonomous clinical decisions either stays small (narrow chatbots) or breaks (safety incidents). Interpretation under human oversight is where durable value lives.

**Belief 3 — Emerging markets are a feature, not a compromise.** Counterfeit medications, herb–drug realities, chronic disease burden, and multi-generational family care aren't edge cases to handle later. They're defining requirements that push the platform toward capabilities Western-first products skip. Building for them first produces a stronger global product.

**Belief 4 — Modularity is the commercial and clinical advantage.** Refill, consult, labs, herb–drug, RPM, and DFPAS each have independent demand and independent revenue pathways. Designing the platform as cooperating modules lets us sell, pilot, and iterate on each one without betting the company on a single slice working.

**Belief 5 — Trust is the product.** Patients need to see reliable status. Clinicians need to see auditable decisions. Operators need deterministic market behavior. Every feature that erodes trust is a negative-value feature regardless of how well it demos.

---

## 5. The problem

Patients, clinicians, and operators today face three structural problems Telecheck is built to resolve.

**Fragmented care.** Telemedicine, pharmacy, labs, monitoring, and follow-up live in separate systems. The patient carries the integration burden, and clinical context gets lost between handoffs.

**Unsupported decisions.** Lab results, medication lists, herbal remedies, food, fitness data, and patient history are rarely interpreted *together*. Risk signals — interactions, contraindications, abnormal trends — are missed because no system reasons across the full picture.

**Weak fit for chronic and emerging-market care.** Existing telehealth players are built around episodic Western primary-care visits. They are weak at chronic disease management, medication-heavy journeys, regulated cross-border commerce, herb–drug realities, and counterfeit-medication risk.

Telecheck addresses all three by unifying the journey, layering AI interpretation across it, and designing from day one for both global and emerging-market use.

---

## 6. Market and pilot strategy

**Pilot environment:** Ghana. Selected for proximity to clinical and regulatory partners (e.g., Korle Bu, Ghana FDA), real chronic-care demand, real herb–drug intelligence demand, and real counterfeit-medication risk. Ghana is a *proving ground*, not the product ceiling.

**Architectural posture:** global from day one. Cloud-hosted (AWS, Azure, or GCP), jurisdiction-aware behavior baked into the contracts pack, no Ghana-only assumptions in the data model.

**Sequence:**
1. **Pilot (Ghana):** prove the core care + commerce + AI loop in one market with anchor workflows.
2. **Regional expansion:** extend to additional emerging markets where the chronic-care, pharmacy-fulfillment, and herb–drug thesis travels well.
3. **Global rollout (incl. US):** onboard markets where modules like AI second opinion, lab interpretation, RPM, and pharmacogenomics carry independent commercial weight. US market unlocks claims-based reimbursement pathways deferred from v1.

Each market expansion is governed by v4.2's market-launch and country-of-care rules; this PRD does not redefine them.

---

## 7. User groups

Telecheck serves five primary user groups. Each has distinct jobs, success criteria, and trust requirements.

**Patient.** The center of the platform. Wants to feel assessed, treated, and looked after — not interrogated by a form. Needs calm, intelligible AI; clear next steps; trustworthy medication handling; and the ability to bring their own data (labs, photos, history).

**Clinician.** Needs to review intake quickly, see AI-surfaced signals without being overwhelmed, make safe prescription and care decisions, and have every decision auditable. Will not adopt a tool that wastes time or hides liability.

**Pharmacist / pharmacy operator.** Needs a clean queue of validated prescriptions, fulfillment workflows, refill logic, and clear handoffs to delivery or pickup. Needs counterfeit-detection and interaction-check signals visible at the right step.

**Operator / admin.** Runs the business. Needs care operations, AI oversight, prescription review oversight, outreach, reporting, and compliance dashboards. Treats Telecheck as the operating system of a digital health company.

**Family member / delegated caregiver.** Often the real driver of chronic and elderly care, especially in emerging markets where multi-generational care is the norm. Every delegate has their own Telecheck account and is granted scoped access to a patient's account. Family-and-delegate care is a first-class primitive (see §14), not an afterthought.

A sixth group — **regulators and institutional partners** (FDAs, hospitals, insurers) — consumes Telecheck's outputs (audit trails, safety reports, evidence) but is not a direct user in v1.

---

## 8. Jobs to be done

Across user groups, Telecheck must do the following jobs well. These are the canonical job statements all slice PRDs trace back to.

1. **Enroll a patient into a program** (chronic care, GLP-1, diabetes, discreet consumer health) — including consent, intake, eligibility, and clinician sign-off.
2. **Refill a medication safely** — including identity, eligibility, interaction checks, clinician oversight, fulfillment, and delivery.
3. **Upload and interpret a document or lab** — patient brings data in, AI interprets it, clinician validates, results connect back to conditions and medications.
4. **Consult a clinician** — synchronous or asynchronous, with structured intake, AI-prepared summary, and decisions captured as auditable artifacts.
5. **Manage pharmacy fulfillment** — from approved prescription to dispense to delivery or pickup, with refill logic and inventory awareness.
6. **Monitor chronic conditions over time** — ongoing metric collection, adherence tracking, alert and escalation logic (RPM/CCM).
7. **Handle alerts and follow-up** — RPM signals, adverse events, missed refills, lab-driven flags, escalation to clinician.
8. **Act on behalf of someone else** — delegated care with consent and audit at every step, via delegate-to-account permission bridges.
9. **Review and oversee AI suggestions** — clinicians and operators can see, accept, override, and audit AI-generated outputs.
10. **Engage with health independently of clinical visits** — food scanning, fitness tracking, pregnancy tracking, and similar self-directed tools that keep patients active on the platform between clinical events.

Anything that cannot be traced back to one of these jobs is, by default, out of scope for v1 unless explicitly added.

---

## 9. Product principles

These principles are non-negotiable design constraints. They are how Telecheck behaves before any feature is added.

**Calm intelligence.** AI should reduce cognitive load, not add to it. Outputs are short, clear, and ranked. Uncertainty is shown, not hidden.

**Human oversight over AI.** No AI output reaches a patient as a clinical decision without an accountable human in the loop where the v4.2 contracts pack requires it. AI proposes; clinicians dispose. (Operationalized in §12.)

**Auditable medical decisions.** Every clinically meaningful action — prescription, override, refill approval, AI acceptance, delegate action — produces an audit artifact. If it is not auditable, it does not ship.

**Jurisdiction-aware by default.** Country-of-care, regulatory posture, and market-launch rules are honored at the platform level. No feature assumes a single legal regime.

**Family and delegated care by design.** Consent-bound delegation is a first-class primitive (§14), not bolted on later.

**Modularity.** Each capability is a module that can be deployed, paused, or sold independently.

**Safety over feature velocity.** Where safety logic and feature scope conflict, safety wins. Always.

**Emerging-market realism.** The platform is designed for environments where counterfeit medication, herbal co-medication, intermittent connectivity, and limited diagnostic access are real — not edge cases.

**Trust is the product.** Status is honest, actions are reversible where possible, records are never silently altered, and availability is deterministic (§15).

---

## 10. Platform architecture overview

Telecheck is organized as five pillars, each containing one or more modules. This view is *product-level*, not engineering-level.

### Pillar 1 — Telehealth care delivery
Synchronous and asynchronous consults, structured intake, follow-up care, prescription decision support, and care pathways for recurring conditions. Aligned to chronic care, RPM, medication follow-up, and discreet consumer health workflows.

### Pillar 2 — AI clinical support
The interpretation layer that reads across labs, medications, conditions, food, fitness, symptoms, interactions, and history. The "second brain" of the platform. Surfaces signals, warnings, and next-step suggestions to both patient and clinician — always under human oversight per §12.

### Pillar 3 — Pharmacy and prescription commerce
Prescription approval workflows, pharmacy portal, dispensing, refills, delivery, patient purchase flows, and product/treatment management. Telecheck behaves part-clinic, part-regulated-health-commerce.

### Pillar 4 — Remote patient monitoring and chronic care management (RPM/CCM)
Ongoing metric collection, monitoring-based interventions, chronic disease tracking, alert and escalation logic. Monthly-subscription-based in emerging markets; architecturally ready for claims-based reimbursement in later markets.

### Pillar 5 — Advanced health intelligence modules
The defensible, distinctive modules. Two of these — the Medication Interaction & Validation Engine and the Herb–Drug Interaction Engine — are not just modules but **shared clinical-safety services** that other workflows (Refill, Consult, Labs, Pharmacy Portal) call into.

**Medication Interaction & Validation Engine (v1).** The platform's core medication-safety service. Every prescription, refill, and medication-list change is run through it before a clinician decision is finalized. Five check classes:

- **Drug–drug interactions** — pairwise and multi-drug, across the patient's full active medication list. Severity-ranked, mechanism-tagged, accompanied by a recommended action (block, warn, monitor).
- **Drug–condition conflicts** — flags medications contraindicated, cautioned, or dose-adjusted for the patient's known conditions (e.g., metformin in renal impairment, NSAIDs in heart failure).
- **Drug–lab conflicts** — flags medications against current and trending lab values (e.g., potassium-sparing agents with elevated K+, methotrexate with abnormal LFTs, anticoagulants with abnormal INR).
- **Genotype / pharmacogenomic concerns** — flags drugs with known genotype-dependent risk (CYP2C19, CYP2D6, TPMT, etc.). v1 runs on sample/reference data; v2 expands to real PGx pipelines.
- **Special clinical flags** — domain-specific safety logic such as marrow-suppression risk, hemoglobinopathy-aware dosing, pregnancy/lactation flags, pediatric/geriatric adjustments.

Every check produces a structured signal with severity, evidence/source, mechanism, and recommended action. Signals are presented to the clinician at decision time, never silently auto-acted on, and all overrides are audited per v4.2.

**Other Pillar 5 modules:**
- Lab interpretation engine
- **Herb–drug interaction engine** (v1.5; distinctive; phytochemical-aware; consumes the same signal model as the medication engine)
- Food and calorie scanning with condition/medication context (v1, acquisition)
- Fitness and behavior signal integration (v1, acquisition)
- Pregnancy tracking (v1, acquisition)
- AI second opinion
- DFPAS integration (lower-limb circulation biometrics)
- Fake medication detection
- Pharmacogenomics / genotype-aware logic (sample data initially; architecture ready)

Cross-cutting capabilities (not pillars, but everywhere): identity & consent, audit & compliance, notifications & engagement, admin & operations, analytics & reporting.

---

## 11. Scope: v1, v1.5, v2

Scope is deliberately tight. Anything not listed here is **not** in that release.

### v1 — Pilot foundation

The minimum coherent platform that proves the core loop end-to-end plus enables acquisition at scale.

**Core care and commerce**
- Patient identity, consent, and onboarding
- Delegated-access primitive: every user has their own account; delegation is a permission bridge between accounts (see §14)
- Forms / intake engine (configurable per program)
- **Refill workflow** — the first proving slice
- Asynchronous clinician review
- Prescription approval and audit
- Pharmacy portal with dispense + delivery handoff
- AI lab interpretation (read-only assistive; clinician-validated)
- **Medication Interaction & Validation Engine** (shared service — drug–drug, drug–condition, drug–lab)
- Basic adverse-event reporting
- Admin operations console (queues, oversight, audit views)
- Notifications and follow-up nudges
- Reporting basics (operational dashboards, not analytics product)

**Chronic care (emerging markets)**
- RPM / CCM v1 — manual and connected-device intake for selected chronic programs, monthly-subscription billing

**Acquisition modules** (low-friction entry points; see §17)
- Food and calorie scanning with condition/medication context
- Fitness and behavior tracking
- Pregnancy tracking

### v1.5 — Depth and emerging-market differentiators

- **Herb–drug interaction engine** (pilot positioning for Korle Bu / Ghana FDA)
- Fake medication detection
- Synchronous video/audio consult
- Subscription care plans (beyond RPM/CCM)
- Expanded delegated-access (multiple delegates per account, richer consent scopes, delegated consults)
- Patient-side document upload + AI summarization (beyond labs)
- Outreach and engagement automations
- RPM/CCM expansion to additional chronic programs

### v2 — Intelligence and expansion

- AI second opinion module
- Pharmacogenomics / genotype-aware decision support (with real PGx data sources)
- DFPAS integration
- Enterprise / institutional partnership tooling
- US market RPM/CCM with claims-based reimbursement
- Multi-market expansion tooling (jurisdiction-aware launch flows)
- Advanced analytics and outcomes reporting

Each item is governed by v4.2 launch rules and gets its own feature PRD before build.

---

## 12. AI role and limits

AI is a defining capability of Telecheck, so its permissions, constraints, and oversight rules belong at the platform level — not re-decided per slice. Every AI-driven feature must fit into one of four categories below. Slice PRDs declare which category applies and cite this section.

### Four categories of AI action

**Category A — Allowed autonomously.**
AI can act without per-instance human review. Examples: formatting an intake summary for clinician review, ranking search results, generating patient-facing educational content drawn from approved sources, translating clinician-written text between languages. Criterion: no clinical decision is being made and no patient-visible content originates from AI without prior clinician-authored source material.

**Category B — Human-in-the-loop before patient impact.**
AI produces output that a human (clinician, pharmacist, or operator) reviews before it reaches the patient or a downstream action. Examples: AI lab interpretation, medication interaction signals, symptom triage suggestions, refill eligibility recommendations, AI-drafted replies to patient messages. Criterion: the output influences clinical understanding or downstream workflow; a human must accept, edit, or reject it and the review event is audited.

**Category C — Human-required, AI-assistive only.**
AI may surface information or suggestions, but the action itself must be performed by an accountable human with explicit intent. Examples: prescribing decisions, dispense approvals, adverse-event escalations, overriding a safety signal, granting delegate access to sensitive categories. Criterion: the action has direct clinical, legal, or privacy consequence; AI cannot act, only inform.

**Category D — Forbidden.**
AI never does this in any version. Examples: autonomous prescribing, autonomous dispensing, autonomous clinical diagnosis presented as definitive, autonomous consent capture, autonomous revocation of delegate access, autonomous emergency triage decisions without human involvement. These are hard limits, not release-gated.

### Additional AI rules

- **Confidence and uncertainty are visible.** Every Category B output shows a confidence signal and a source rationale. Clinicians see why the AI said what it said.
- **AI-authored content is visually distinct** from clinician-authored content in all UIs (see §16).
- **Every AI output is logged.** Prompt, model version, output, and downstream human action are retained for audit per v4.2.
- **Override is a first-class action.** Clinicians can override AI suggestions, the override is recorded with reasoning, and override rates are tracked as a quality signal (both directions — too-low and too-high override rates both indicate problems).
- **AI is task-bound.** There is no open-ended general-purpose chatbot in v1. Patient-facing AI is scoped to specific tasks (symptom intake, medication questions about their own regimen, food scanning, etc.).

---

## 13. Clinical safety boundaries

Safety rules that apply across all features, independent of product scope.

**When telehealth is insufficient.** Emergency symptoms (chest pain with specified features, stroke symptoms, suicidal ideation with plan, severe allergic reactions, etc.) must trigger immediate escalation to emergency services information, bypassing normal scheduling. The emergency override takes precedence over any in-progress workflow.

**When action must be blocked.** Any clinically meaningful action (prescribing, dispensing, interpretation reaching the patient) is blocked if: consent is missing or revoked; the jurisdiction does not permit the action; the patient identity is unverified to the required level; a Category B AI signal has been produced but not yet reviewed; or a safety signal (severe interaction, contraindication) has been raised and not explicitly overridden by a clinician.

**When escalation to human review is mandatory.** A clinician (or designated human reviewer) must be looped in whenever: AI produces a high-severity interaction or contraindication signal; a patient reports a symptom pattern flagged for escalation; a delegate requests access to sensitive categories; an adverse event is reported; or a refill request involves a medication with special clinical flags (see §10 Pillar 5).

**When emergency information must override normal flow.** If a patient indicates acute risk during any workflow — intake, consult, messaging — the platform exits the normal flow and presents emergency resources and guidance. No amount of in-progress commerce or clinical review blocks this path.

**When the platform degrades gracefully.** Intermittent connectivity is assumed in pilot markets. Critical safety paths (medication lookup, interaction checks, emergency information, existing prescriptions view) must function in degraded-connectivity mode. Optional workflows (new orders, AI interpretation of newly uploaded data) can be deferred, but nothing safety-critical may depend on a live connection.

**Where v4.2 governs.** Every rule here has corresponding enforcement in the v4.2 contracts pack. This section states the product intent; v4.2 states the enforceable behavior.

---

## 14. Consent and delegated access model

Consent and delegation are first-class primitives. Every slice inherits from this section rather than defining its own consent behavior.

### Account model

**Every user has their own Telecheck account.** There are no nested accounts, no guardian accounts that contain child accounts, no account hierarchies. Delegation is a **permission bridge between accounts**, not an account structure.

A parent in Ghana managing their own health, their minor child's care, and their elderly parent's care has:
- One account (their own) where they are the primary holder.
- Delegated access *into* their child's account (with parent-of-minor defaults).
- Delegated access *into* their elderly parent's account (with adult-child defaults, subject to the parent's consent).

All actions taken under delegation are recorded in the *target account* (the child's, the parent's) with the delegate's identity attached.

### Consent types

Consent is not a single boolean. Six distinct types:

1. **Platform consent** — to use Telecheck at all (terms, baseline data handling, identity verification).
2. **Care consent** — to receive clinical care via the platform (consult, prescribing, monitoring). Has clinical legal weight.
3. **Data-use consent** — for specific data flows (AI interpretation, pharmacy partner sharing, hospital sharing, anonymized analytics contribution).
4. **Delegation consent** — granted by the account holder to a delegate to act on their behalf, with scope.
5. **Jurisdictional consent** — market-specific regulatory consents (e.g., Ghana FDA reporting, data residency rights).
6. **Episode consent** — for specific clinical episodes separate from ongoing care (e.g., one-off second opinion).

Each has different revocation semantics, evidence requirements, and downstream consequences.

### What "granted" means

Every consent record carries five attributes:

- **Scope** — what was consented to
- **Granularity** — at what level of detail
- **Duration** — perpetual until revoked, or time-bounded
- **Evidence** — the artifact proving consent (signed form, voice recording, in-app affirmation, clinician attestation, legal document)
- **Versioning** — which version of the terms or scope applied at consent time

Without these five, an action cannot be audited back to a consent basis.

### Delegation as a primitive

**Relationship types** are a first-class attribute of every delegation:
- Parent of minor
- Adult child (managing an elderly parent)
- Spouse / partner
- Professional caregiver (hired, non-family)
- Healthcare proxy with legal documentation

**Suggested defaults by relationship type** (patient-customizable at setup):

| Relationship | Default visible | Default hidden (patient can grant) |
|---|---|---|
| Parent of minor | Everything clinically relevant to caring for the child | Clinician-marked notes (e.g., safeguarding concerns) |
| Adult child managing parent | Appointments, medications, active conditions, recent labs, refill status | Mental health, sexual/reproductive health, substance use, psychiatric diagnoses |
| Spouse / partner | Appointments, medications, active conditions, lab results | Mental health, reproductive health, substance use |
| Professional caregiver | Medication administration schedule, allergies, contraindications, active monitoring alerts | Narrative clinical notes, history beyond task scope |
| Healthcare proxy | Everything (legal authority) | Nothing (but all access is audited) |

**The patient always overrides the defaults.** At delegation setup, the patient reviews the suggested access level for the relationship type and customizes it. This is especially important in emerging-market contexts where family structures may differ from the defaults. The defaults are a starting point; the patient's configuration is the truth.

**Delegate actions are scopable individually**: read records, request refills, attend consults, receive notifications, give consent on behalf of the patient (the riskiest — restricted to parent-of-minor, legal guardian with documentation, and healthcare proxy), make payments.

**A delegate cannot create another delegate.** Delegation chains stop at the first hop.

### Revocation

- **Forward-looking.** Revoking consent does not undo actions already taken; past actions remain in audit.
- **In-flight workflows** stop on revocation, with clinician-overrideable safety holds for cases where abrupt discontinuation is dangerous.
- **Derived data** (AI interpretations produced from consented data) is retained per jurisdictional rules; the model does not assume automatic deletion.
- **Granular.** A patient can revoke one consent type (e.g., data-use for analytics) without revoking others (e.g., care consent).
- **Both directions.** A patient can revoke a delegate. A delegate can also step down from their role.

### Audit commitment

> *Telecheck never takes a clinically meaningful action without a consent artifact that names what was consented to, by whom, when, with what scope, and with what evidence. Every action taken on behalf of someone else carries the chain of authorization back to its source.*

Every consented action carries its consent evidence. Every delegate action is recorded as taken-by-delegate with the delegation evidence. Every revocation is timestamped. Every patient can see a full history of what they consented to, what was done under that consent, and who acted on their behalf.

---

## 15. Trust and data principles

Trust is not a tone; it is a set of product commitments.

**Status is honest.** The platform never shows a patient a status that is aspirational, premature, or softened. "Your prescription is approved" means approved. "Delivery is on the way" means the order has left fulfillment. If the system does not know, it says so.

**Records are not silently altered.** A clinician's note, a prescription, an AI interpretation, or a consent record is never changed without a visible edit history. Corrections produce a new version; they do not overwrite.

**Actions are traceable.** Every clinically or commercially meaningful action has an identifiable actor (patient, delegate, clinician, pharmacist, operator, AI-with-human-reviewer) and a retrievable audit artifact.

**Actions on behalf of others are explicit.** When a delegate acts, the target account's records show it was a delegate action, which delegate, and under what consent basis.

**Market availability is deterministic.** A feature is either available in a market or it is not. Partial, probabilistic, or "mostly works" availability is not a valid state. If a module cannot be safely used in a market, it is hidden there.

**Reversibility is preferred.** Where a mistake can be undone — an unsent message, an unrequested refill — the platform supports undoing it. Irreversible actions (prescription submitted to pharmacy, order delivered) are clearly signalled as such before they commit.

**Data retention is intentional.** What is retained, for how long, and under what jurisdiction is a design decision, not an emergent outcome. v4.2 enforces the runtime.

**Privacy-sensitive categories are handled explicitly.** Mental health, sexual health, reproductive health, and substance use are treated with category-specific access rules (see §14), not rolled into a single "medical record" bucket.

---

## 16. Experience direction and accessibility

Product-level UX intent. Design system specs live downstream.

### Experience principles

**Calm, not sterile.** Telecheck is a clinical platform, but the tone is warm and reassuring. Dense clinical data is surfaced when needed, hidden when not.

**Premium but trustworthy.** The visual language signals quality and care, not luxury marketing. Trust is carried by consistency, honesty in status, and clarity of action — not by polish alone.

**Readable, not decorative.** Typography, color, and spacing serve comprehension first. A clinician under time pressure and a patient under stress both need to understand what the screen is telling them in seconds.

**AI is visually distinct from clinician-authored content.** Every AI-generated piece of content carries a consistent visual signal (icon, treatment, labeling) so users always know what is AI and what is human. This is a hard UX rule, not a style preference.

**Low-friction onboarding.** Patient onboarding is short, explains what is being collected and why, and never gates critical safety information behind an incomplete profile.

**Empty, loading, and failure states are designed, not default.** Every screen has an intentional state for no-data, slow-data, and failed-data. Failure is never a blank screen.

**Degraded connectivity is a first-class design target.** UI must work, and must be useful, on intermittent connectivity. Optimistic UI patterns are used with care, because premature "success" violates §15.

### Accessibility requirements

- Text contrast and sizing meet WCAG AA at minimum for all patient-facing and clinician-facing surfaces.
- The platform supports assistive technologies (screen readers, keyboard navigation) for all core flows.
- Language support is planned per market, not assumed. Ghana pilot supports English at minimum; subsequent markets assess needs individually.
- Literacy-aware writing: patient-facing copy is written at a level appropriate for the general population, with clinical terms explained where they appear.
- Color is never the sole carrier of meaning. Severity, status, and AI/human distinction use shape, text, and position as well.

---

## 17. Business and operating model

Revenue structure affects scope and prioritization. Stating it explicitly prevents invisible economics from driving product choices.

### v1 revenue engines

**Consultation fees (per-visit, patient-pay).** When a patient books a live consult, the price is displayed upfront at scheduling. Payment is collected per visit. Applies to all jurisdictions in v1.

**Medication sales (per-prescription, patient-pay).** OTC and prescription medications are sold through the pharmacy workflow. Prices are displayed. Patient pays per order.

**Refills (medication-cost only).** Refills for established programs (GLP-1, men's health, ED, chronic medications) do not carry a separate consult fee. The patient pays for the medication; the platform's margin comes from the medication transaction. This is deliberate — frictionless refills drive adherence and volume.

**RPM / CCM subscription (emerging markets, patient-pay).** Monthly subscription for ongoing monitoring and chronic-care management. Enables chronic-disease revenue without requiring per-visit consults. Architectured to support claims-based reimbursement when the platform enters US and similar markets in v2.

### Acquisition engines (not primary revenue in v1)

**Food and calorie scanning, fitness tracking, and pregnancy tracking.** These are low-friction tools that bring users onto the platform without requiring a clinical visit. They drive app downloads, account creation, and habitual engagement. Revenue from these modules in v1 is not the point; their role is to feed the consultation, medication, and RPM/CCM engines.

### Deferred

**US market claims-based reimbursement for RPM/CCM.** Out of v1 scope. The architectural work to support it is being done, but the billing integration and regulatory requirements are deferred to v2.

**DFPAS diagnostic interpretation services.** Scoped and visible as a future revenue engine, placed in v2. Potential for institutional contracting and per-interpretation fees.

**Institutional and enterprise partnerships.** v2. Hospitals, insurers, and employers are not direct customers in v1.

### Commercial model principle

In v1, the customer is always the patient. In emerging markets especially, direct patient-pay is the assumption. No institutional payer, employer, or government program is relied on for v1 revenue. This keeps the unit economics simple and the pilot evaluable on its own merits.

---

## 18. Success metrics

Metrics are organized by what the business actually needs to know. Each has an owner pillar.

**Patient activation and retention**
- Onboarding completion rate
- Intake completion rate (per program)
- 30/60/90-day retention by program
- Acquisition-tool-to-clinical-service conversion rate (food/fitness/pregnancy users converting to consults or refills)
- Delegate adoption rate and active delegate count per account

**Clinical throughput and safety**
- Time to clinician review (async)
- Time to clinician decision (sync)
- Prescription approval rate and override rate
- Safety-event handling latency (signal → clinician action)
- AI suggestion acceptance / override rate (quality signal in both directions)

**Pharmacy and commerce**
- Refill completion rate (headline v1 metric)
- Order turnaround time (approval → dispense → delivery)
- Refill adherence over rolling 90 days
- Fulfillment defect rate
- Revenue per active patient per month

**RPM / CCM**
- RPM subscription retention
- Adherence / monitoring completion
- Alert-to-action latency
- Escalation appropriateness (false-positive vs missed-signal balance)

**Operations**
- Support burden per active patient
- Manual-intervention rate per workflow
- Audit-trail completeness (must be ~100%)
- Compliance-event closure time

**Headline v1 metrics** (pilot obsession list):
1. Refill completion rate
2. Time to clinician review
3. Safety-event handling latency
4. Audit-trail completeness

---

## 19. Non-goals

Non-goals are expressed as **workflow exclusions, not capability exclusions**. Telecheck may build data, records, and audit trails that look EHR-ish or research-ish — but it does not build the institutional workflows associated with those systems.

**Telecheck is not a hospital or institutional EHR.** It does not build inpatient workflows (admissions, bed management, ward rounds, nursing notes, discharge summaries, eMAR). It does not build hospital operational systems (OR scheduling, anesthesia records, ICU charting, hospital revenue cycle). It does not attempt to be the system of record for care delivered outside Telecheck. It *does* maintain a longitudinal record of care delivered through Telecheck and accepts external records contributed by patient or partner institutions.

**Telecheck is not a clinical research platform.** It does not build trial management, randomization, eCRFs, IRB workflows, or sponsor reporting. It *does* produce consented, audited, longitudinal data that can feed research pipelines downstream.

**Telecheck is not a general clinician marketplace.** It does not operate open onboarding for arbitrary providers. It *does* onboard credentialed clinicians per market under controlled processes.

**Telecheck is not a direct-to-consumer pharmacy in unregulated markets.** Where regulation does not permit direct pharmacy operations, Telecheck works through partnerships, not unilateral launches.

**Telecheck is not a do-everything chatbot.** Patient-facing AI is task-bound (see §12). There is no open-ended general-purpose conversational agent in v1.

**Telecheck is not an insurance claims engine.** RPM/CCM awareness is not the same as building a claims clearinghouse. US claims processing is v2 at the earliest and works through integrations, not in-house claims infrastructure.

**Telecheck is not a consumer wellness app.** Wellness signals (food, fitness, pregnancy tracking) serve clinical care and acquisition; they are not the product in themselves.

**Telecheck is not a diagnostic device.** AI interpretations are assistive. Clinicians make decisions.

**Telecheck is not a social or community platform.** There is no patient-to-patient social layer in v1 or planned versions.

Anything in this list re-enters scope only through an explicit PRD update.

---

## 20. Dependencies and constraints

**Regulatory.** Each market has its own rules for telehealth, prescribing, pharmacy dispensing, data residency, and AI in clinical decision support. Ghana pilot requires coordination with Ghana FDA and clinical institutions. v4.2 enforces the runtime.

**Partner pharmacy.** v1 depends on at least one partner pharmacy (or owned pharmacy operation) capable of integrating with the pharmacy portal and delivery workflows.

**Clinician supply.** End-to-end care requires a sustainable pool of credentialed clinicians per market. Onboarding velocity gates patient acquisition.

**Data residency.** Cloud provider selection (AWS / Azure / GCP) and regional deployment are constrained by per-market residency requirements.

**AI trust boundaries.** AI operates under the four categories in §12. In v1, no autonomous prescribing or dispensing decisions. This is both a safety and regulatory constraint.

**Connectivity.** Pilot markets include intermittent connectivity. Safety-critical workflows must degrade gracefully (§13, §16).

**Identity infrastructure.** Patient identity verification depends on per-market identity primitives (national ID, phone, etc.).

**Counterfeit-medication data.** Fake medication detection (v1.5) depends on supply-chain data and image-recognition reference sets sourced per market.

**Payment infrastructure.** v1 depends on reliable per-market payment rails (mobile money in Ghana, card processing elsewhere). Subscription billing for RPM/CCM requires recurring-payment support.

---

## 21. Risks

| Risk | Mitigation |
|---|---|
| AI surfaces wrong clinical signal and a clinician acts on it | Category B/C boundaries enforced (§12); human-in-the-loop required; audit captures rationale and override |
| Refill workflow fails in pilot due to pharmacy integration friction | Refill is intentionally the first slice — failure here is cheap and informative |
| Acquisition modules (food, fitness, pregnancy) create expectations Telecheck cannot clinically fulfill | Clear UX separation between acquisition tools and clinical advice; escalation paths from tools into clinical care are explicit |
| Regulatory delay in Ghana FDA engagement on herb–drug module | Herb–drug is v1.5, not v1; pilot positioning runs parallel to v1 build |
| Scope expands toward "general telehealth platform" | Non-goals (§19) and PRD discipline on every new request |
| Delegation defaults don't match emerging-market family structures | Patient-customizable defaults (§14); suggested defaults are a starting point, not a constraint |
| RPM/CCM subscription churn in emerging markets | Monitor retention as a headline metric; adjust value proposition and pricing per market |
| Counterfeit-detection false positives damage pharmacy partner trust | v1.5 launch as advisory; clinician/pharmacist review required before patient impact |
| Clinician adoption stalls because workflow feels slower than current tools | UX explicitly measured on time-to-decision; AI must visibly save clinician time |
| Consent ambiguity between patient and delegate creates privacy incidents | Every delegate action logged with consent basis; patient sees delegate activity; revocation is immediate |

---

## 22. Open questions

Tracked and closed via ADR or PRD update.

1. **Identity primitive for Ghana pilot.** Which combination of national ID, phone verification, and clinician-attested identity is sufficient?
2. **Pharmacy partner model.** Owned, partnered, or hybrid for pilot?
3. **Clinician compensation model.** Per-consult, salaried, or hybrid?
4. **Adult-child-managing-parent sensitive-category default.** v1.2 commits to patient-customizable defaults; the *starting-point* default for sensitive categories in this relationship remains under review per market norms.
5. **Clinician-gated exceptions to delegate visibility.** When can a clinician mark a note as not-for-this-delegate? What is the override mechanism if the patient disagrees?
6. **Consent for AI use of externally contributed data.** Labs uploaded by a hospital, prescription history pulled from external pharmacy — does platform consent cover AI interpretation, or is a separate consent required?
7. **Minor age thresholds by care type.** At what age does a minor consent to their own care vs requiring parental consent, especially for mental health and reproductive care? Varies by jurisdiction.
8. **Cross-border delegation.** A delegate in one country managing care for a patient in another — whose consent regime governs?
9. **Incapacity and emergency override for delegation.** When a patient is incapacitated, what powers does a previously-authorized delegate gain, and what evidence is required?
10. **RPM/CCM pricing model per emerging market.** Flat monthly subscription, tiered by program, or condition-specific?
11. **Adverse-event reporting destination.** Internal only in v1, or Ghana FDA pipeline from day one?
12. **Subscription billing infrastructure.** Build or buy for v1?
13. **DFPAS integration timing.** v2 is the current placement — does any pilot opportunity pull it earlier?

---

## 23. Feature PRD index

Downstream slice PRDs. Each traces to a job in §8 and a scope item in §11.

| # | Feature PRD | Phase | Primary jobs served |
|---|---|---|---|
| 1 | Refill (proving slice) | v1 | Refill safely; pharmacy fulfillment; AI/clinician oversight |
| 2 | **Medication Interaction & Validation Engine** (shared service) | v1 | Drug–drug, drug–condition, drug–lab, genotype, special-flag checks for every prescribing/refill decision |
| 3 | Forms / Intake Engine | v1 | Enroll a patient; consult; intake for any program |
| 4 | Consult (async v1, sync v1.5) | v1 → v1.5 | Consult a clinician |
| 5 | Labs and Document Interpretation | v1 → v1.5 | Upload and interpret a document or lab |
| 6 | Consent & Delegated Access (platform primitive) | v1 | Act on behalf of someone else; all consent flows |
| 7 | Pharmacy Portal | v1 | Manage pharmacy fulfillment |
| 8 | Adverse Event Reporting | v1 | Handle alerts and follow-up |
| 9 | **RPM / CCM v1** | v1 | Monitor chronic conditions; monthly subscription revenue |
| 10 | Food & Calorie Scanning | v1 | Engage independently of clinical visits; acquisition |
| 11 | Fitness & Behavior Tracking | v1 | Engage independently of clinical visits; acquisition |
| 12 | Pregnancy Tracking | v1 | Engage independently of clinical visits; acquisition |
| 13 | Herb–Drug Interaction Engine | v1.5 | Review and oversee AI suggestions; extends interaction-engine signal model |
| 14 | Fake Medication Detection | v1.5 | Pharmacy fulfillment safety |
| 15 | Subscription Care (beyond RPM/CCM) | v1.5 | Enroll a patient; commerce |
| 16 | Expanded Delegation | v1.5 | Act on behalf of someone else (multi-delegate, richer scopes) |
| 17 | AI Second Opinion | v2 | Review and oversee AI suggestions |
| 18 | Pharmacogenomics | v2 | Extends interaction engine with real PGx pipelines |
| 19 | DFPAS Integration | v2 | Handle alerts and follow-up; diagnostic interpretation revenue |
| 20 | US RPM/CCM with Claims | v2 | Chronic care in claims-reimbursement markets |

---

## Document control

- **v1.0** — Initial master PRD synthesized from platform brief and PRD-placement guidance.
- **v1.1** — Promoted Medication Interaction & Validation Engine to a fully described shared clinical-safety service with the five check classes broken out, and added it as item 2 in the Feature PRD index.
- **v1.2** — Surgical expansion, not rewrite. Added Executive Summary (§1), Product Thesis (§4), AI Role and Limits with four-category model (§12), Clinical Safety Boundaries (§13), Consent and Delegated Access Model with account model, consent types, delegation defaults, revocation semantics, and audit commitment (§14), Trust and Data Principles (§15), Experience Direction and Accessibility (§16), and Business and Operating Model (§17). Revised Non-Goals (§19) to a workflow-exclusion framing. Moved RPM/CCM to v1 (from v1.5). Moved Food/Calorie Scanning, Fitness Tracking, and Pregnancy Tracking to v1 (from v2) as acquisition engines. Added "engage independently of clinical visits" as a job to be done (§8). Added delegate adoption, acquisition-to-clinical conversion, and RPM subscription retention to metrics (§18). Expanded Open Questions (§22) with consent, delegation, and pricing questions surfaced during review.
- **Next review:** after v4.2 contracts pack is stabilized and Refill slice PRD is drafted.
- **Change discipline:** every change to scope (§11), non-goals (§19), principles (§9), AI categories (§12), or consent model (§14) requires explicit owner sign-off and a version bump.
