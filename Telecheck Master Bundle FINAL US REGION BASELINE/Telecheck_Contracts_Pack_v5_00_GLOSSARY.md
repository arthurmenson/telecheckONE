# 00 · Glossary

**Status:** canonical · **Version:** 5.1 · **Owner:** product · **Consumers:** all engineering, design, clinical, ops

The single source of truth for terminology across Telecheck. Every document, UI string, database column, API field, and prompt uses these terms exactly as defined here. Drift is a defect.

If a term you need is not here, propose an addition before using it. Do not invent a synonym.

---

## How to use this document

- **Canonical term** is the only word permitted in code, specs, and UI (unless an alias is explicitly marked "permitted in UI").
- **Aliases (forbidden)** are words that mean the same thing but are banned — they exist here only so reviewers can catch them.
- **Notes** clarify usage.

---

## Clinical and care terms

### medication_request
The canonical aggregate for a clinician's decision to prescribe or authorize a medication for a patient. Contains medication identity, dosing, quantity, approval pathway, and clinical context.
- **Aliases (forbidden in code/schemas/events/audit):** prescription, Rx, script, order
- **Notes:** `prescription` is permitted in patient-facing UI text and in the Master PRD's section titles as a product-language term. In schemas, events, API fields, and database columns: always `medication_request`. See vocabulary resolution note at bottom.

### refill
A patient-initiated request to renew an existing medication_request within its pre-authorization window. Refills may be clinician-reviewed or protocol-authorized.
- **Aliases (forbidden):** renewal, reorder, re-prescription

### pre_authorization_window
The period during which a patient can request a refill without a new consultation. Configurable per program and medication class (3 months or 6 months).
- **Aliases (forbidden):** prescription validity period, Rx window

### interaction_signal
A structured output from the Medication Interaction & Validation Engine or the Herb–Drug Interaction Engine describing a detected risk. Has severity (critical/major/moderate/minor), recommended action (block/warn/monitor), source engine, and mechanism.
- **Aliases (forbidden in code):** alert, warning, flag
- **Notes:** "flag" is acceptable in casual documentation and conversation. In code: always `interaction_signal` or `signal`.

### protocol_authorized_action
A clinical action (prescribing, refill renewal, dispensing release) executed by the protocol engine without per-instance clinician review, within a governance-bound protocol envelope with a named accountable clinician.
- **Aliases (forbidden):** auto-approved, automated prescription, AI-prescribed, robot prescription

### bridge_supply
A medication supply authorized when a patient revokes care consent for an abrupt-discontinuation medication (per I-021). Sufficient for safe tapering. Follows standard pharmacy workflow.

### SAFETY_HOLD
A state on a medication record indicating that the medication cannot be refilled through normal channels due to a safety concern (consent revocation for abrupt-discontinuation medication, pending clinical review after adverse event, etc.).

### clinical_release_check
The pharmacist's final safety review before medication leaves the pharmacy. Checks correct medication, label accuracy, new signals since prescribing, fake medication detection status, and allergy/contraindication review.
- **Aliases (forbidden):** dispensing check, final check, release review

### protocol_authorized_dispensing_release
A pharmacy release executed by the protocol engine without per-instance pharmacist clinical review, for approved low-risk medication classes. Separate activation from protocol-authorized prescribing.

### medication_reconciliation
The structured process of identifying and documenting all medications a patient is currently taking, including prescribed, OTC, and herbal medicines. Occurs during intake and at clinical touchpoints.
- **Aliases (forbidden):** med rec, medication review (when referring to the intake process)

### completeness_confidence
A tag applied to a patient's medication list indicating how complete the list is believed to be: high (structured entry + AI review + photo verification), medium (structured entry + AI review), low (partial entry only).

### abrupt_discontinuation_risk
A medication classification indicating that stopping the medication suddenly poses a safety risk. Categories: insulin, anticoagulants, anticonvulsants, beta-blockers, corticosteroids, SSRIs/SNRIs, opioids under clinical management.

---

## AI terms

### Mode 1 (Conversational Assistant)
The patient-facing AI chat operating under §13.2 guardrail-configured conversational autonomy. Explains, summarizes, interprets, helps initiate workflows, escalates. Does not make clinical decisions.
- **Governed by:** Guardrail templates
- **Aliases (forbidden):** chatbot, AI doctor, virtual doctor

### Mode 2 (Protocol Execution Agent)
The automated clinical review engine operating under §13.1 protocolized clinical autonomy. Consumes structured intake data, evaluates protocol criteria, produces clinical summaries for physician review. Not patient-facing.
- **Governed by:** Protocol activation and governance
- **Aliases (forbidden):** AI prescriber, auto-prescriber, robot doctor

### guardrail_template
An admin-configurable definition of what Mode 1 may discuss, how it frames uncertainty, when it escalates, and what it refuses. Four launch templates: Conservative Default, GLP-1 Program Agent, Men's Health/ED Program Agent, Labs & Medication Interpreter.

### decision_confidence_score
The calibrated confidence score produced by Mode 2 for its clinical recommendation. Includes calibration status and calibration evidence reference.
- **Notes:** Replaces the uncalibrated `confidence` field from v3. Must always carry `calibration_status` (calibrated/uncalibrated).

### escalation
When Mode 1 determines a conversation requires clinician involvement and transfers the patient to a human care pathway. Triggers include clinical urgency, scope boundary, patient request, and crisis detection.
- **Aliases (forbidden):** handoff, transfer (in code — acceptable in UI)

---

## Forms Engine terms

### intake_form
The top-level form definition for a treatment program's intake. Has a stable code, multiple versions, and bindings to a program.
- **Aliases (forbidden):** quiz, survey, questionnaire

### intake_form_version
An immutable snapshot of an IntakeForm at publication. Patients complete intakes against a specific version. Forward-only per I-013.

### intake_form_version_id
The canonical, globally unique identifier for an immutable IntakeFormVersion. ULID prefixed `frv_`. The only operative reference for runtime lookups, audit attribution, and ProgramMarketPolicy bindings.

### form_layer
One of four architectural layers: presentation_content, branching_logic, eligibility_logic, approval_governance. Per I-006, each has separate permissions, approvers, and audit categories.

### intake_response
The patient's completed submission against a specific intake_form_version. Contains answers, timestamps, and medication reconciliation data. Immutable once submitted.
- **Aliases (forbidden):** form submission, quiz result, application

---

## Geographic and configuration terms

### country_of_care
The country in which the patient receives clinical services. Determines which protocols, formularies, regulatory requirements, and clinical governance apply. Resolved by CCR.
- **Aliases (forbidden):** country (when used alone without qualifier)

### country_of_residence
The country where the patient resides. May differ from country_of_care. Determines **jurisdictional regulatory residency** (consent requirements, retention rules, DPC obligations, sub-processor disclosure obligations). Per ADR-026, **physical hosting region** at launch is single-region us-east-1 for all tenants and is **not** driven by country_of_residence; the country abstractions govern jurisdictional and contractual mechanism only.

### data residency (jurisdictional)
The set of regulatory and contractual obligations that follow from a patient's `country_of_residence` (consent regime, retention rules, DPC registration, cross-border processing mechanism, sub-processor disclosure). Driven by CCR per country. Distinct from physical hosting region. Per ADR-026, jurisdictional residency varies by country; physical hosting region is single us-east-1 for all tenants.

### data residency (physical) / hosting region
The physical AWS region in which Telecheck data is processed and stored. Per ADR-026 (supersedes ADR-025), the platform runs in single-region us-east-1 (Virginia) primary with us-west-2 (Oregon) cold DR. All tenants share the same physical hosting region at launch. Future per-country physical-region routing is out of scope at launch and requires a new ADR superseding ADR-026.

### cross-border processing posture
The platform-default operational posture under ADR-026: patient data of tenants whose `country_of_residence` is outside the United States (e.g., Telecheck-Ghana patients) is processed in us-east-1, which constitutes cross-border processing under that tenant's home regime. Triggers jurisdictional obligations (DPC registration, sub-processor disclosure, patient-facing privacy notice with US-processing disclosure) — see Ghana Launch Playbook v1.2 §"Data residency and cross-border posture" for the Ghana-specific operational treatment.

### country_of_registration
The country where the patient's Telecheck account is registered. Immutable.

### country_of_licensure
The country in which a clinician holds their medical license. Determines which patients they can serve.

### locale
The patient's language and formatting preference. Not a country concept — a patient in Ghana may prefer French locale.

---

## Market Launch terms

### program_market_policy
The canonical record of whether a program is available in a market, under what conditions, and with what configuration. Owned solely by Market Launch per I-020.
- **Aliases (forbidden):** market config, launch record, availability record

### launch_gate
One of seven governance gates a program must pass before going live in a market: regulatory, clinical, technical, operational, financial, legal, executive.

### market_pack
A versioned container of all configuration for a specific market: ProgramMarketPolicies, protocol assignments, formulary scope, guardrail templates, moderation policy, partner relationships, evidence artifacts.

---

## Pharmacy terms

### pharmacy_order
The aggregate representing a medication to be fulfilled by a pharmacy. Created when a medication_request or refill is approved and handed off to the pharmacy workflow.
- **Aliases (forbidden):** pharmacy request, dispensing order, fulfillment order

### stock_unit
A specific physical instance of a medication in the pharmacy's inventory, identified by batch number, expiry date, and manufacturer.

### fake_medication_flag
An advisory signal raised by the fake medication detection system against a specific stock unit. Advisory-only at launch (ADR-011) — does not block dispensing.

---

## Delegation terms

### delegate
A user who acts on behalf of another patient with scoped, consent-bound access. Every delegate has their own account. Delegation is a permission bridge, not an identity merge.

### delegation_scope
The set of actions a delegate is authorized to perform on behalf of a patient. Configured per delegate with relationship-typed defaults. Sensitive-category data is default-hidden from delegates (ADR-009).
- **Notes:** Sensitive categories include mental health, sexual health, substance use, and reproductive health.

---

## Platform infrastructure terms

### platform_floor
The set of non-negotiable safety guarantees that no configuration, protocol, or operator action can override. Defined in Master PRD §13.4 (clinical safety subset) and in 00-INVARIANTS.md (full set including engineering guarantees). See invariants-to-floor mapping in 00-INVARIANTS.md.

### idempotency_key
A client-generated ULID included in every state-changing API request to prevent duplicate processing. See 00-IDEMPOTENCY.md.

### domain_event
An immutable record of something that happened in the system. Per I-016, never modified or deleted. See 00-DOMAIN-EVENTS.md.

### audit_record
An immutable, append-only record of an action taken in the system. Per I-003, never deleted or modified. Categorized A/B/C by safety classification. See 00-AUDIT-EVENTS.md.

### hash_chain
The per-patient SHA-256 chain of audit records providing tamper detection. See 00-AUDIT-EVENTS.md.

---

## Error and state terms

### hold
A workflow state indicating that an action cannot proceed until a dependency is resolved (e.g., interaction engine unavailable, payment failed, required labs overdue). Holds are time-limited and escalate if not resolved within a configurable timeout.

### fallback
When a protocol-authorized pathway cannot execute (due to critical/major signals, missing data, or edge cases), the workflow falls back to clinician review with all context preserved.

### degraded_mode
The platform's behavior when a non-critical dependency is unavailable. Core safety functions continue; affected features display honest status. See CCR-RUNTIME degraded mode and individual slice error handling sections.

---

## Tenancy and platform-isolation terms (added v5.1)

### tenant
A logically isolated organizational unit on the Telecheck platform. Each tenant has its own brand, its own patients, its own clinicians, its own data, and its own integration adapter selections. At launch, two tenants exist: Heros Health (US) and Telecheck-Ghana (GH). Per ADR-023, all tenants share a single deployment with logical separation enforced at three layers (PostgreSQL Row-Level Security, application-layer filtering, per-tenant KMS encryption keys). The same person cannot have a single identity that spans tenants; the same person who uses both Heros and Telecheck-Ghana has two independent accounts (one per tenant).

### tenant_id
The ULID-format identifier prefixed `tnt_`. Required on every PHI-touching record. Required on every audit and domain event. Required on every query against PHI tables.

### tenant scope / tenant-scoped
A resource is "tenant-scoped" if it carries `tenant_id` and is accessible only within that tenant's authorized context. Almost all resources are tenant-scoped. The exceptions are listed under "platform-scoped" below.

### platform scope / platform-scoped
A resource that is not tenant-scoped because it is shared across all tenants by design. Examples: CountryProfile, ADR set, Contracts Pack, Design System tokens (the platform defaults), Protocol Library Ghana (when a tenant in Ghana adopts it). Platform-scoped resources are managed by Platform Admin role hierarchy; Tenant Admins consume but do not modify them.

### tenant boundary
The logical line of separation between tenants. Crossing it requires explicit authorization (Platform Admin role) and explicit mechanism (break-glass session). No code path silently crosses tenant boundaries.

### cross-tenant access
Any read or write operation that touches data in a tenant other than the actor's `actor_tenant_id`. By definition, requires break-glass per RBAC v1.1 break-glass procedure. By I-024, must produce an audit record with break_glass block populated. By I-025, error responses do not leak cross-tenant existence.

### break-glass session
A time-bounded, reason-documented, Privacy-Officer-reviewed session in which Platform Admin or other privileged roles per RBAC v1.1 access tenant data. The session has a banner indicator visible throughout, an explicit expiration, and a post-session review requirement. Not a casual privilege escalation; a friction-by-design mechanism.

### tenant brand
The visual and textual identity a tenant presents to its patients. Comprises: brand name, logo, primary/secondary/accent colors, typography overrides (within Design System tenant-overridable token list), notification copy variant overrides, custom domain. Configured by Tenant Admin via Admin Backend Slice §5.8. Renders at runtime via Design System v1.X tenant brand token overlay.

### country profile
The platform-scoped CountryProfile object (per CDM v1.2 §4.3) defining everything country-specific that is shared across tenants in that country: regulatory module reference, available adapter lists per integration domain, format settings, default emergency information. Tenant-specific selections from these defaults live in the tenant's CCRConfig.

### tenant configuration
The composite of tenant attributes (id, country, brand, status), tenant brand, tenant CCRConfig (per-country override layer), tenant adapter selections, and tenant user roster. Resolved at request time by the Tenant Configuration module per System Architecture v1.2 §13.

### platform admin / tenant admin / dual hierarchy
Per RBAC v1.1, two parallel role hierarchies exist:
- **Platform Admin hierarchy** — Telecheck operators (Platform Owner, Platform Admin, Platform Operator, Platform Support, Platform Clinical Governance, Platform AI Safety, Platform Privacy Officer, Platform Security Officer). Default no PHI access; break-glass for tenant data access.
- **Tenant Admin hierarchy** — Per-tenant operators (Tenant Owner, Tenant Admin, Tenant Operator, Tenant Billing, Tenant Clinical Lead, Tenant Marketing, Tenant Support). Authorized only within their tenant's scope.

A single human may hold roles in both hierarchies (e.g., a Telecheck employee assisting a tenant for support purposes), but each role's authority is independently scoped and audited.

### tenant-overridable token vs platform-fixed token
Per Design System v1.X and Design Implementation Contract v1.0 §5.3:
- Tenant-overridable tokens may be customized per tenant brand (brand colors, logo, typography overrides within scale)
- Platform-fixed tokens may not be tenant-overridden (severity colors, content source colors, semantic colors, accessibility floor sizes — these encode safety conventions and accessibility floors)

---

## Vocabulary resolution note

The Glossary governs technical vocabulary (code, schemas, events, APIs, audit). Product-language terms in the Master PRD and patient-facing UI may use common words (e.g., "prescription" in §10 section titles, "refill" in patient UI) where the technical term would be confusing to the audience. When a product-language term differs from the canonical technical term, the mapping is documented here (see `medication_request` entry above).

In cases of conflict: the Glossary governs code. The Master PRD governs product language. The Source-of-Truth hierarchy (00-SOURCE-OF-TRUTH.md) governs everything else.

---

## Anti-patterns

- **Using `prescription` in code, schemas, events, or audit.** Use `medication_request`.
- **Using `country` without a qualifier.** Always specify which of the five country concepts you mean.
- **Inventing a term without checking the Glossary first.** If it's not here, propose an addition.
- **Using `auto-approved` or `AI-prescribed`.** The canonical term is `protocol_authorized_action`.
- **Using `chatbot` for Mode 1.** The canonical term is `AI Clinical Assistant (Mode 1)` or `Conversational Assistant`.
- **Using `alert` or `warning` in code for interaction signals.** The canonical term is `interaction_signal` with a `severity` field.
- **Using `tenant` casually for platform-scope or as a synonym for "customer" (added v5.1).** Tenant has a precise meaning: a logically isolated organizational unit on the platform per ADR-023. Customers of a tenant are patients of that tenant; tenants are not customers.
- **Calling the Telecheck-Ghana brand and the Telecheck platform by the same word in the same sentence (added v5.1).** Both are named "Telecheck" — disambiguated by context: "Telecheck (the platform)" vs "Telecheck-Ghana (the tenant)" or "Telecheck-Ghana brand". When context is ambiguous, use the disambiguator explicitly.
- **Treating cross-tenant access as a coding shortcut (added v5.1).** Cross-tenant access is a break-glass workflow with audit and Privacy Officer review. Not a code-level convenience.

---

## Document control

- **v5.1 (refreshed 2026-04-26 per ADR-026, US Region Migration Cycle U-003)** — Clarified `country_of_residence` definition to distinguish jurisdictional regulatory residency from physical hosting region (per ADR-026 the two are decoupled at launch). Added new entries: `data residency (jurisdictional)`, `data residency (physical) / hosting region`, `cross-border processing posture`. Additive entries plus narrow clarification only; no terms removed or redefined. No version bump (v5.1 retained as the contract version; entry-level refresh consistent with the contracts-pack version-discipline).
- **v5.0** — Initial Glossary contract.
- **v5.1** — Adds Tenancy and platform-isolation terms section: tenant, tenant_id, tenant scope, platform scope, tenant boundary, cross-tenant access, break-glass session, tenant brand, country profile, tenant configuration, platform admin / tenant admin / dual hierarchy, tenant-overridable vs platform-fixed token. Adds anti-patterns specific to multi-tenancy. Threading remediation per Adversarial Counsel Review v1.0 finding CRITICAL-01. Existing terms preserved without modification.
