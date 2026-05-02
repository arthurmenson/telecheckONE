# Telecheck — Consent & Delegated Access Slice PRD

**Version:** 1.0
**Status:** Canonical for development
**Owner:** Clinical Governance Lead
**Parent document:** Telecheck Master Platform PRD v1.6, §15
**Companion documents:** All launch slice PRDs (this is a platform primitive consumed by every workflow), v5 Contracts Pack

---

## 1. Purpose and strategic role

Consent and delegation are the invisible load-bearing walls of Telecheck. Every clinical action, every data use, every delegate interaction, and every protocol-authorized execution traces back to a consent artifact. Every action taken on behalf of another person traces back to a delegation record. If these primitives are wrong — incomplete, ambiguous, or unauditable — every downstream workflow inherits the error.

This slice is a **platform primitive**, not a feature. It does not have its own patient-facing screens in the way a refill or lab upload does. Instead, it defines the consent and delegation behaviors that other slices inherit. When the Refill Slice checks consent at Step 2, it calls into the model defined here. When the AI Clinical Assistant checks delegate context, it uses the rules defined here. When a clinician authorizes a bridge supply after consent revocation, the revocation semantics come from here.

This slice defines:
- The account model (every user has their own account; delegation is a permission bridge)
- The six consent types and their attributes
- The progressive consent presentation model
- How consent is captured, stored, versioned, and revoked
- The delegation primitive — relationship types, scoped permissions, defaults, customization
- How revocation works across in-flight workflows
- What is audited

---

## 2. Traceability

| Master PRD reference | This slice addresses |
|---|---|
| §8 Job 8 — Act on behalf of someone else | Delegation primitive, scoped permissions, audit |
| §15 Consent and delegated access model | Full model definition |
| §15 Progressive consent presentation | Consent timing and UX |
| §13.4 Platform floor — consent and delegation rules | No autonomous consent capture, no autonomous delegate modification, no sensitive-category bypass |
| §16 Trust and data principles | Records never silently altered, actions on behalf of others explicit |
| Every launch slice PRD | Every workflow checks consent and delegation status via this primitive |

---

## 3. Actors

| Actor | Role in this model |
|---|---|
| **Patient (account holder)** | Grants and revokes consent. Creates and manages delegations. Customizes delegate access levels. Reviews delegate activity. |
| **Delegate** | Acts on behalf of a patient within granted scope. Has their own Telecheck account. Cannot create sub-delegates. |
| **Clinician** | Relies on consent status for clinical decisions. May mark specific notes as not-for-delegate. May authorize bridge supply after consent revocation. |
| **Operator / admin** | Does not modify individual consent or delegation records. Configures consent presentation flows per market and program. Reviews consent compliance in audit dashboards. |
| **Protocol engine** | Checks consent before executing protocol-authorized actions. Requires explicit care consent that includes protocolized actions. |
| **System** | Enforces consent and delegation rules at runtime. Blocks actions that lack consent basis. Logs all consent events. |

---

## 4. Account model

**Every user has their own Telecheck account.** There are no nested accounts, no guardian accounts containing child accounts, no account hierarchies. This is a hard architectural constraint, not a design preference.

A parent in Ghana managing their own health, their minor child's care, and their elderly parent's care has:
- One account (their own) as primary holder
- Delegated access into their child's account with parent-of-minor defaults
- Delegated access into their elderly parent's account with adult-child defaults, subject to the parent's consent

All actions taken under delegation are recorded in the **target account** (the patient being cared for), with the delegate's identity attached. The delegate's own account contains a record that they performed the action, but the clinical record lives in the target account.

**Account creation requirements:**
- Unique identifier (email, phone number, or market-specific identity primitive)
- Identity verification to the market's required level
- Platform consent (§5.1)
- Age verification (to determine minor status per jurisdiction)

---

## 5. Six consent types

### 5.1 Platform consent

**What it covers:** Agreement to use Telecheck — terms of service, baseline data handling, identity verification, platform communications.

**When presented:** At account creation. Required before any platform interaction.

**Revocation:** Revoking platform consent is equivalent to account closure. No further platform interaction is possible. Historical records are retained per jurisdictional requirements and data retention policy.

**Evidence:** In-app affirmation with timestamp, terms version, and device/session identifier.

### 5.2 Care consent

**What it covers:** Agreement to receive clinical care through Telecheck — consultations, prescribing, medication management, monitoring, protocolized actions. Has clinical and legal weight.

**When presented:** At first program enrollment. Presented as part of the enrollment flow, clearly separated from data-use consent (§5.3). The patient sees:
- What clinical services are covered (consultation, prescribing, refill, monitoring)
- That protocolized actions may be used for their program (explained in plain language: "Some routine medication renewals may be processed automatically under your care program, with your care team overseeing the process")
- That they can revoke care consent at any time, and what revocation means for in-flight workflows

**Scope specificity:** Care consent is granted per program. A patient enrolled in both a GLP-1 program and a diabetes management program has two separate care consent records. Revoking care consent for GLP-1 does not affect the diabetes program.

**Revocation:** See §8.

**Evidence:** In-app affirmation with timestamp, program identifier, consent version, and terms text version.

### 5.3 Data-use consent

**What it covers:** Agreement to specific data flows beyond baseline platform operation — AI interpretation of clinical data, pharmacy partner data sharing, hospital partner data sharing, anonymized analytics, community participation data use.

**When presented:** At first program enrollment, presented alongside but visually separated from care consent. The patient sees each data-use category individually and can consent or decline each one:
- AI interpretation of my labs, medications, and health data (required for AI Clinical Assistant and interaction engine functionality)
- Sharing my prescription data with pharmacy partners for fulfillment (required for pharmacy workflow)
- Anonymized data for platform improvement and research (optional)
- Community participation data (required for community features)

**Granularity:** Data-use consent is per category, not all-or-nothing. A patient can consent to AI interpretation and pharmacy sharing while declining anonymized analytics.

**Impact of declining specific categories:** If a patient declines AI interpretation, the AI Clinical Assistant and lab interpretation features operate in reduced mode (general information only, not personalized to the patient's data). If a patient declines pharmacy sharing, the pharmacy workflow cannot operate for that patient. These consequences are explained at consent time.

**Revocation:** Forward-looking. AI interpretations already produced from consented data are retained per jurisdictional rules. New AI interpretations are not generated after revocation.

**Evidence:** In-app affirmation with timestamp, category-level consent decisions, consent version.

### 5.4 Delegation consent

**What it covers:** The patient grants a specific delegate permission to act on their behalf, with defined scope.

**When presented:** When the patient initiates delegation setup — not at onboarding. The patient:
1. Invites a delegate (by email, phone, or in-person invitation code)
2. Selects the relationship type (parent-of-minor, adult-child, spouse/partner, professional caregiver, healthcare proxy)
3. Reviews the suggested defaults for that relationship type (§6.3)
4. Customizes the access level (grants or restricts specific scopes)
5. Confirms the delegation

**Scope:** Delegation consent is specific to each delegate-patient pair. A patient with three delegates has three separate delegation consent records.

**Revocation:** Either direction — the patient can revoke a delegate, and a delegate can step down. See §8.

**Evidence:** In-app affirmation with timestamp, delegate identifier, relationship type, granted scopes, and any customizations from defaults.

### 5.5 Jurisdictional consent

**What it covers:** Market-specific regulatory consent requirements that go beyond platform, care, and data-use consent. Examples: Ghana FDA adverse event reporting consent, data residency acknowledgment, country-specific research data consent.

**When presented:** At the point of the relevant action, not front-loaded at onboarding. Example: if Ghana FDA requires consent for adverse event data to be shared with the regulatory body, this consent is presented when the patient enrolls in a clinical program — not at account creation, and not at adverse event reporting time (by then it may be too late or too stressful to present a consent decision).

**Market configuration:** Jurisdictional consent requirements are defined per market in the Market Rollout Cockpit. Each market specifies: what jurisdictional consents are required, when in the patient journey they are presented, and what happens if the patient declines.

**Evidence:** In-app affirmation with timestamp, jurisdiction, regulatory reference, consent version.

### 5.6 Episode consent

**What it covers:** Consent for a specific clinical episode separate from the patient's ongoing care relationship. Example: a one-off second opinion from a specialist not part of the patient's regular care team.

**When presented:** At the initiation of the specific episode.

**Scope:** Limited to the episode. Does not grant ongoing care access. Does not modify existing care consent.

**Launch relevance:** Episode consent is defined in the model but its primary use case (second opinion) is a post-launch capability. The model is present at launch so the consent infrastructure supports it when the capability ships.

**Evidence:** In-app affirmation with timestamp, episode identifier, clinician/provider identifier, scope limitations.

---

## 6. Delegation primitive

### 6.1 Core rules

- **A delegate has their own Telecheck account.** Delegation is a permission bridge between two accounts, not an account hierarchy.
- **A delegate cannot create another delegate.** Delegation chains stop at the first hop. A parent cannot delegate their delegation of grandparent care to a sibling.
- **All delegate actions are recorded in the target account** with the delegate's identity attached. The patient sees who did what on their behalf.
- **Delegate access is scopable individually.** Each permission is an independent grant. The patient does not grant "full access" or "no access" — they configure specific scopes.

### 6.2 Delegate scopes

| Scope | What it allows | Notes |
|---|---|---|
| **View records** | See the patient's health records within granted visibility categories | The foundation scope — most other scopes require this |
| **Request refills** | Initiate a refill request on the patient's behalf | Does not approve or modify refills |
| **Book consults** | Schedule consultations on the patient's behalf | Does not attend consults unless also granted attend-consults scope |
| **Attend consults** | Join the patient's consultation (as an observer or participant) | Patient is notified when a delegate attends |
| **Receive notifications** | Receive notification copies for the patient's clinical events | Notification content respects visibility scope |
| **Make payments** | Pay for the patient's services and medications | Payment is recorded as delegate-paid |
| **Upload documents** | Upload labs, documents, and files on the patient's behalf | Delegate performs the confirmation step |
| **Give consent on behalf** | Consent to care or data-use on the patient's behalf | **Highest-risk scope. Restricted to: parent-of-minor, legal guardian with documentation, and healthcare proxy. Requires additional evidence.** |
| **View community** | See the patient's community participation | Delegate sees but does not participate as the patient |

**What no delegate can do regardless of scope:**
- See medications or conditions in sensitive categories they haven't been granted access to
- Override or acknowledge interaction engine signals (clinician-only)
- Modify dosing, quantity, or treatment instructions
- Create another delegate
- Revoke another delegate's access
- Access the patient's AI Clinical Assistant conversation history (patient-private unless clinician reviews)
- Participate in community groups as the patient (delegates participate under their own account)

### 6.3 Suggested defaults by relationship type

These are starting-point defaults that the patient reviews and customizes at delegation setup. The defaults are informed by common care patterns and privacy expectations. The patient always overrides the defaults.

**Parent of minor**
- Default visible: everything clinically relevant to caring for the child
- Default hidden (patient can grant): clinician-marked safeguarding notes
- Default scopes: view records, request refills, book consults, attend consults, receive notifications, make payments, upload documents, give consent on behalf
- Rationale: parent is the primary caregiver and legal decision-maker

**Adult child managing elderly parent**
- Default visible: appointments, medications, active conditions, recent labs, refill status
- Default hidden (patient can grant): mental health, sexual/reproductive health, substance use, psychiatric diagnoses
- Default scopes: view records, request refills, book consults, receive notifications, make payments, upload documents
- Not granted by default: attend consults (elderly parent may want privacy), give consent on behalf (requires healthcare proxy documentation)

**Spouse / partner**
- Default visible: appointments, medications, active conditions, lab results
- Default hidden (patient can grant): mental health, reproductive health, substance use
- Default scopes: view records, request refills, receive notifications, make payments
- Not granted by default: book consults, attend consults, upload documents, give consent on behalf

**Professional caregiver**
- Default visible: medication administration schedule, allergies, contraindications, active monitoring alerts
- Default hidden (patient can grant): narrative clinical notes, history beyond task scope
- Default scopes: view records (limited to visible categories), receive notifications (medication and appointment reminders only)
- Not granted by default: request refills, book consults, attend consults, make payments, upload documents, give consent on behalf

**Healthcare proxy**
- Default visible: everything (legal authority)
- Default hidden: nothing (but all access is audited)
- Default scopes: all scopes including give consent on behalf
- Requires: legal documentation (healthcare proxy form, power of attorney, court order) uploaded and verified
- Rationale: healthcare proxy has legal authority equivalent to or exceeding the patient's own decision-making

### 6.4 Sensitive-category rules

Sensitive categories are: mental health, sexual health, reproductive health, substance use, and psychiatric diagnoses. These categories have explicit visibility rules:

- By default, sensitive categories are hidden from all delegates except parent-of-minor (where clinician safeguarding notes may still be hidden) and healthcare proxy (legal authority)
- The patient can explicitly grant access to specific sensitive categories for specific delegates
- **No guardrail, protocol, moderation policy, or admin configuration can autonomously bypass sensitive-category defaults.** Changing sensitive-category visibility requires explicit patient confirmation. This is a platform floor rule (§13.4).
- Clinician-marked notes: a clinician can mark a specific note as not visible to a specific delegate type (e.g., a safeguarding concern note hidden from a parent). The mechanism for this is a clinician action on the note, not a system-wide rule. If the patient disagrees, the patient can override (the patient's visibility decision is authoritative over the clinician's marking, but the clinician's marking is preserved in audit as a clinical concern flag).

---

## 7. Consent record structure

Every consent record — regardless of type — carries five attributes (Master PRD §15):

| Attribute | Description |
|---|---|
| **Scope** | What was consented to — program, data-use category, delegation, jurisdiction, episode |
| **Granularity** | At what level of detail — per-program, per-data-category, per-delegate, per-episode |
| **Duration** | Perpetual until revoked, or time-bounded (e.g., episode consent expires when the episode concludes) |
| **Evidence** | The artifact proving consent — in-app affirmation timestamp + device/session ID, uploaded signed form, voice recording, clinician attestation, legal document |
| **Versioning** | Which version of the terms, scope definition, or consent flow applied at consent time |

**Without all five attributes, an action cannot be audited back to a consent basis.**

### 7.1 Consent storage

Consent records are stored as immutable, append-only records. A consent is never modified — it is either active or superseded/revoked by a newer record. The full history is preserved:
- Original consent (with all five attributes)
- Any modifications (new consent record superseding the previous one)
- Revocation (timestamped, with revocation type and downstream consequences)

### 7.2 Consent checking at runtime

When any workflow checks consent (refill checking care consent, AI checking data-use consent, delegation checking delegation consent), the check is a runtime query against the current consent state:
- Is there an active consent of the required type, for the required scope, with valid evidence?
- If yes: proceed, and log the consent record ID in the action audit
- If no: block the action, notify the user of what consent is needed, and offer a path to consent

Consent checks are synchronous and blocking. A workflow cannot proceed on the assumption that consent will be obtained later.

---

## 8. Revocation

### 8.1 General revocation rules

- **Forward-looking.** Revoking consent does not undo actions already taken. Past actions remain in audit with their original consent basis.
- **Granular.** A patient can revoke one consent type without revoking others. Revoking data-use consent for anonymized analytics does not affect care consent.
- **Both directions for delegation.** A patient can revoke a delegate. A delegate can step down from their role.
- **Immediate effect.** Revocation takes effect at the timestamp of the revocation action. No grace period for ongoing access (but see §8.2 for in-flight workflows).

### 8.2 In-flight workflow handling

When consent is revoked while a workflow is in progress, the behavior depends on the workflow state. The following rules apply to care consent revocation (the most impactful type):

| Workflow state at revocation | Behavior |
|---|---|
| Before clinical approval (e.g., refill requested but not yet approved) | Workflow stops. Patient is notified. No clinical action is taken. |
| After clinical approval but before fulfillment (e.g., refill approved but not yet dispensed) | Workflow stops. Pharmacy is notified. No medication is released. |
| After fulfillment and in delivery (e.g., medication dispatched) | Delivery completes (medication already released). No future refill or clinical action is initiated. |
| Abrupt discontinuation danger | Clinician-overrideable safety hold. The clinician is notified and may authorize a bridge supply to prevent harm from abrupt discontinuation. The bridge supply is a time-limited clinical safety action, not a continuation of care consent. Default bridge window: 14 days, adjustable per medication class by the Clinical Governance Lead. |

**Delegation revocation while a delegate-initiated workflow is in progress:**
- The workflow continues to completion if it has already entered clinical review or pharmacy fulfillment (revoking delegation mid-fulfillment does not stop medication the patient needs)
- The delegate loses access to tracking and status immediately
- No new delegate-initiated actions are possible after revocation
- The patient is notified that the delegation has ended and any in-flight workflow continues under the patient's own consent

### 8.3 Data-use consent revocation

- **AI interpretation:** New AI interpretations are not generated. Existing interpretations (already produced under valid consent) are retained per jurisdictional data retention rules.
- **Pharmacy sharing:** Pharmacy can no longer receive new orders for this patient. Existing fulfilled orders and their records are retained.
- **Anonymized analytics:** Patient's data is excluded from future analytics. Already-computed anonymized aggregates are not retroactively modified (the data is anonymized and not practically reversible).

### 8.4 Derived data handling

When consent is revoked, derived data (AI interpretations, interaction engine signals, herb-drug signals produced from consented data) is retained per jurisdictional rules. The model does not assume automatic deletion of derived data — jurisdictional requirements vary, and some derived data has clinical safety value (e.g., an interaction signal that prevented a dangerous prescription should not be deleted because the patient revoked analytics consent).

The patient can request deletion of specific derived data through a data rights request. The request is evaluated against jurisdictional requirements and clinical safety considerations. The evaluation and decision are logged.

---

## 9. Progressive consent presentation

### 9.1 Presentation flow

Consent is granular in the system but progressive in presentation. The patient encounters consent decisions at the natural moments in their care journey, not all at once:

| Journey moment | Consent presented | Target time |
|---|---|---|
| Account creation | Platform consent | Under 2 minutes |
| First program enrollment | Care consent (for this program) + data-use consent (AI + pharmacy, with optional analytics) | Under 3 minutes |
| Adding a delegate | Delegation consent (for this specific delegate) | Under 3 minutes |
| Market-specific trigger | Jurisdictional consent | Under 1 minute |
| Specific clinical episode | Episode consent | Under 1 minute |
| Total onboarding to first program enrollment | Platform consent + care consent + data-use consent | Under 5 minutes on mobile |

### 9.2 Presentation design principles

- Each consent screen explains what is being consented to in plain language, at the literacy level appropriate for the market
- Each consent screen explains what happens if the patient declines ("You can still use Telecheck, but you won't be able to use [specific feature]")
- Consent is never a single "agree to everything" checkbox
- Consent screens are never more than one scroll-length on a mobile device
- Clinical terminology is explained where it appears
- The patient can revisit and modify their consent decisions at any time from Settings
- The progressive flow is configurable per market and program through the Forms/Intake Engine

### 9.3 Consent review in Settings

The patient's Settings screen includes a **Consent & Privacy** section showing:
- All active consents with their scope and grant date
- All active delegations with their scope and relationship type
- Revocation controls for each consent and delegation
- Consent history (what was granted, when, what was revoked, when)
- Data rights options (request data export, request data deletion)

---

## 10. Audit

### 10.1 Consent audit

Every consent event is logged:

| Event | What is recorded |
|---|---|
| Consent granted | Consent type, scope, granularity, duration, evidence, terms version, timestamp, device/session ID |
| Consent modified | Previous consent record ID, new consent record ID, what changed, timestamp |
| Consent revoked | Consent record ID, revocation type (patient-initiated / delegate step-down / system-enforced), downstream consequences triggered, timestamp |
| Consent checked at runtime | Consent record ID referenced, workflow that checked, action that proceeded, timestamp |
| Consent declined | What was offered, what was declined, consequences explained, timestamp |

### 10.2 Delegation audit

| Event | What is recorded |
|---|---|
| Delegation created | Delegate ID, target patient ID, relationship type, granted scopes, defaults vs customizations, evidence, timestamp |
| Delegation scope modified | Delegation ID, scopes added/removed, modifier (patient), timestamp |
| Delegation revoked | Delegation ID, revoker (patient or delegate), reason (if provided), in-flight workflow handling, timestamp |
| Delegate action performed | Delegation ID, delegate ID, target patient ID, action type, workflow, timestamp |
| Sensitive-category access granted/revoked | Delegation ID, category, patient confirmation evidence, timestamp |

### 10.3 Audit commitment

> *Telecheck never takes a clinically meaningful action without a consent artifact that names what was consented to, by whom, when, with what scope, and with what evidence. Every action taken on behalf of someone else carries the chain of authorization back to its source. Every protocol-authorized action carries the protocol version and accountable role.*

This commitment is enforced at runtime. If a consent check fails (no valid consent, expired consent, revoked consent), the action is blocked. The block is logged. The patient or delegate is informed of what consent is needed.

---

## 11. Platform floor compliance

The following rules are immutable (Master PRD §13.4):

- **No autonomous consent capture for actions with clinical or legal weight.** The system cannot auto-consent on behalf of a patient. Consent must be an affirmative patient (or authorized delegate) action.
- **No autonomous modification or revocation of a delegate's access.** Only the patient (or the delegate stepping down) can modify delegation scope or revoke delegation.
- **No bypass of sensitive-category visibility rules for delegates without explicit patient confirmation.** No admin config, no guardrail, no protocol can override sensitive-category defaults without the patient explicitly confirming.
- **"Give consent on behalf" scope is restricted.** Only parent-of-minor, legal guardian with documentation, and healthcare proxy may hold this scope. It is never granted by default to other relationship types.

---

## 12. Edge cases

### 12.1 Minor reaching age of majority

When a minor patient reaches the age of majority (per jurisdiction):
- The parent-of-minor delegation does not automatically terminate (this would disrupt ongoing care)
- The now-adult patient is notified that they can review and modify their parent's delegation scope
- The platform suggests the patient review sensitive-category visibility settings
- If the now-adult patient takes no action, the existing delegation continues with a periodic reminder to review

### 12.2 Patient incapacity

When a patient is incapacitated and cannot make consent or delegation decisions:
- A previously authorized healthcare proxy can act using their existing delegation
- If no healthcare proxy exists, the platform cannot create one — legal processes outside the platform must establish proxy authority
- Emergency clinical care (emergency escalation pathway) does not require per-instance consent — it operates under the platform's emergency care obligations
- This edge case is noted in Master PRD §24 Q7 as an open question with jurisdictional variation

### 12.3 Conflicting delegate actions

If two delegates with overlapping scopes take conflicting actions (e.g., both request a refill for the same medication):
- The first action received is processed; the second is flagged as a duplicate
- Both delegates see the status of the processed action
- The patient is notified of both actions

### 12.4 Cross-border delegation

A delegate in one country managing care for a patient in another country:
- The patient's consent regime (country of care) governs. The delegate operates under the patient's market rules, not their own market rules.
- This is noted in Master PRD §24 Q6 as an open question for detailed resolution per market pair

### 12.5 Delegate with no digital access

In emerging-market contexts, a delegate may have limited digital literacy or intermittent connectivity:
- The delegation setup can be initiated by the patient (who adds the delegate by phone number)
- The delegate receives a simplified invitation flow
- The delegate's interface may be a reduced-functionality view optimized for low-bandwidth/low-literacy use (post-launch UX consideration)

---

## 13. Metrics

**Consent**
- Platform consent rate (should be ~100% of account creators)
- Care consent rate per program (what percentage of enrolled patients have active care consent)
- Data-use consent acceptance rate per category (which categories do patients decline most?)
- Consent revocation rate by type (are patients revoking care consent? Data-use consent? Why?)
- Progressive consent flow completion time (is the under-5-minute target met?)
- Consent check failure rate at runtime (how often does a workflow block on missing consent — should decrease as onboarding matures)

**Delegation**
- Delegate adoption rate (% of patients with at least one active delegate)
- Average delegates per patient
- Relationship type distribution
- Scope customization rate (how often do patients modify defaults?)
- Sensitive-category grant rate (how often do patients grant access to sensitive categories — should be relatively low)
- Delegate-initiated action rate by scope type
- Delegation revocation rate and reason distribution
- "Give consent on behalf" scope usage (should be very low — only parent-of-minor, guardian, proxy)

**Trust**
- Patient review of consent settings (how often do patients visit Consent & Privacy in Settings?)
- Delegate activity transparency (how often do patients review delegate activity logs?)

---

## 14. Dependencies

- **Identity & Authentication Spec v1.0.** Authenticated patient, clinician, pharmacist, moderator, admin, and delegate sessions are required for every actor surface this slice uses.
- **Every launch slice PRD.** Every workflow checks consent and delegation status via this primitive. The Refill Slice, AI Clinical Assistant, Labs, Pharmacy Portal, Adverse Event Reporting, Community, and RPM/CCM all depend on consent and delegation infrastructure.
- **Forms / Intake Engine Slice.** The progressive consent presentation flow is implemented in the intake engine. Consent screens, decline paths, and per-program consent variations are defined there.
- **Identity infrastructure.** Account creation and identity verification are prerequisites for consent capture. Delegate identity verification is required for delegation setup.
- **v5 Contracts Pack.** Runtime consent enforcement rules. The contracts pack governs how consent checks behave at runtime.
- **Market Rollout Cockpit.** Jurisdictional consent requirements are configured per market in the cockpit. Consent compliance is visible in the cockpit's readiness checklist.
- **Messaging & Inbox Spec v1.0.** Inbox threads and message-delivery expectations govern care-team and patient-visible communication generated by this workflow.
- **Notification infrastructure.** Delegation invitations, consent reminders, revocation notifications, and delegate activity alerts depend on the notification system.

---

## 15. Open questions (slice-level)

1. **Consent for minors by age band.** At what age can a minor consent to their own care for specific categories (mental health, reproductive health) without parental consent? This varies by jurisdiction and care type. Ghana-specific thresholds need legal and clinical review.
2. **Delegation evidence verification.** For healthcare proxy, the patient (or their legal representative) uploads legal documentation. Who verifies this documentation — automated check, manual review, clinician attestation? What happens if verification fails?
3. **Consent withdrawal and data deletion interaction.** When a patient revokes data-use consent and requests data deletion, how does this interact with clinical safety data (interaction signals, adverse event records) that may need to be retained for safety or regulatory reasons? Is there a "retained for safety" exception, and how is it communicated to the patient?
4. **Offline consent.** Can consent be captured when the patient is offline (e.g., in-person consent at a clinic using the platform)? What evidence standard applies to offline consent capture (witnessed signature, clinician attestation)?
5. **Consent translation.** For markets with multiple languages, are consent screens translated? Who validates the translation for clinical and legal accuracy? Is the English version authoritative in case of translation discrepancy?
6. **Delegation for community participation.** The current model says delegates participate in community under their own account, not the patient's. Should a delegate be able to post in a community group on behalf of a patient (e.g., a caregiver asking questions in a diabetes support group about their elderly parent's care)?

---

## v1.10 cycle additions (added 2026-05-02 per v1.10.1 hygiene cycle physical merge of Phase5 delta Row 60)

### 16. Research data-use consent (5th tier) — per ADR-028 + Master PRD §15.2 (Row 60 — Cycle C5)

**Position relative to existing six consent types (§5).** Research data-use consent is a fifth *tier* of presentation atop the existing data-use consent type (§5.3) — it is recorded as a separately-revocable `ConsentRecord` with `consent_type = research_data_use` (per CDM v1.2 / TYPES v5.2 `ResearchConsent`). It does NOT alter the six consent types defined in §5.

**Presentation gate.** The 5th tier is presented at intake and at care-touchpoint moments only when CCR `research_data_partnership_active ∈ {consent_only, active}` for the patient's `country_of_care`. When CCR is `inactive`, the 5th tier is NOT presented and no `ResearchConsent` record exists for the patient.

**Consent text sourcing.** Consent text is per CCR `research_ethics_review_body.approval_reference_id` (per CCR_RUNTIME v5.2 research block) and version-pinned per Master PRD v1.10 §15.2 patient-facing text rules. The pinned version is recorded on the `ConsentRecord` per existing five-attribute schema (§7.1).

**Optionality and care-impact prohibition (I-030).** Research data-use consent is optional, separately revocable, and MUST NOT impact care delivery — neither the presence nor the absence of a research consent grant alters any clinical pathway, eligibility, prioritization, or treatment recommendation. This is enforced by Forms Engine static analysis at form-version-publish time (six dependency categories rejected per FORMS_ENGINE v5.2 I-030 enforcement; see Forms/Intake Engine Slice §25.2 / Row 61) and at runtime by GOVERNANCE_CONTROLS v5.2 §7.

**Asymmetric retraction acknowledgement.** At grant time, the patient explicitly acknowledges that aggregate research data already shared (e.g., included in a prior `ResearchDataExport`) cannot be retracted retroactively — only future inclusion is stopped on revocation. The acknowledgement is captured as a structured attestation on the `ResearchConsent` record (not free text).

**Audit.** Grant and revocation events emit AUDIT_EVENTS v5.2 §5 `research.consent_granted` and `research.consent_revoked` (audit class `high_pii` per I-031). Audit payload records the `country_of_care`, `research_ethics_review_body.approval_reference_id`, pinned consent-text version, and the asymmetric-retraction acknowledgement.

**Cross-references (v1.10):** ADR-028 v0.5 (Research data partnership Posture A — Release 2 goal); Master PRD v1.10 §15.2 (research data governance); INVARIANTS v5.2 I-029 (research export gates), I-030 (consent-zero-impact on care delivery), I-031 (high_pii audit class); AUDIT_EVENTS v5.2 §5 (research events); CCR_RUNTIME v5.2 research block (`research_data_partnership_active`, `research_ethics_review_body`, `research_permitted_data_domains`); TYPES v5.2 (`ResearchConsent`, `DataSharingAgreement`, `ResearchEthicsReviewBody`); FORMS_ENGINE v5.2 (research consent integration); Forms/Intake Engine Slice §25.2 (research_data_use_consent_block field type); Market Rollout Cockpit Slice §X (Market Pack research block).

**Source delta:** `Telecheck_v1_10_PRD_Update/Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` Row 60 (Cycle C5).

### 17. Row 102 verification marker — per Cycle C7 / D5 batch (added 2026-05-02 per v1.10.1 hygiene cycle physical merge of Phase5 delta Row 102)

Row 102 is a verification-only row in the Phase 5 delta (Cycle C7 — AI workload taxonomy + autonomy levels). It confirms that ADR-028 5th-tier research consent additions to this slice are covered upstream and now physically present in this file.

**Verification statement.** Row 102 verified: ADR-028 5th-tier consent additions are covered in §16 above (added per Row 60 / v1.10 cycle). The 5th tier (`consent_type = research_data_use`) is presented as a separately-revocable `ConsentRecord` gated on CCR `research_data_partnership_active`, with I-030 enforcing zero impact on care delivery.

**Cross-references (v1.10):**
- ADR-028 v0.5 — Research Data Partnership Posture A (Accepted at v1.10 promotion 2026-05-01)
- Master PRD v1.10 §15.2 — research data governance / consent surface
- INVARIANTS v5.2 §I-029 / §I-030 / §I-031 — research export gates / consent-zero-impact on care / high_pii audit classification
- §16 of this slice — substantive 5th-tier body added via Row 60 (sibling D4 batch)
- ADR-029 — workload taxonomy (the C7 cycle this verification row belongs to; no direct edit obligation on this slice from C7 itself)

**Source delta:** `Telecheck_v1_10_PRD_Update/Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` Row 102 (Cycle C7).

---

## Document control

- **v1.0** — Initial Consent & Delegated Access slice PRD. Defines the account model, six consent types with five-attribute records, progressive consent presentation, delegation primitive with scoped permissions and relationship-typed defaults, sensitive-category rules, revocation semantics with in-flight workflow handling, platform floor compliance, and edge cases including minor-to-adult transition and incapacity. Derived from Master PRD v1.6 §15 and Flagged Items Resolution v1.0.
- **v1.10 cycle addition (2026-05-02 — v1.10.1 hygiene cycle physical merge of Phase5 delta Row 60):** Added §16 Research data-use consent (5th tier) per ADR-028 + Master PRD v1.10 §15.2. Five-attribute consent records and the six consent types in §5 are preserved unchanged; the 5th tier is recorded as a `ConsentRecord` with `consent_type = research_data_use` and gated on CCR `research_data_partnership_active`. I-030 enforces zero impact on care delivery; I-029 governs downstream export pipeline; I-031 governs audit classification.
- **v1.10 cycle addition (2026-05-02 — v1.10.1 hygiene cycle physical merge of Phase5 delta Row 102):** Added §17 Row 102 verification marker per Cycle C7 / D5 batch. Verifies that ADR-028 5th-tier research consent additions are covered in §16 (added per Row 60). No body edits beyond the §17 marker; verification-only row.
- **Next review:** after Forms/Intake Engine slice defines the progressive consent presentation flows; after Ghana-specific minor consent thresholds are resolved with legal and clinical review (Q1); after healthcare proxy documentation verification process is defined (Q2).
- **Change discipline:** changes to consent types, delegation scopes, sensitive-category rules, revocation semantics, or platform floor compliance rules require explicit owner sign-off and must be reflected in the Master PRD §15 if they alter the platform model. Changes to delegation defaults require validation against emerging-market family structure research.
