# 00 · Glossary

**Status:** canonical · **Version:** 5.4 · **Owner:** product · **Consumers:** all engineering, design, clinical, ops

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
- **Workload taxonomy mapping (added v5.2):** Per ADR-029, Mode 1 is the workload-taxonomy value `conversational_assistant`. Code, schema, audit, and config use `conversational_assistant`; UI / operator-facing text may continue to use "Mode 1". Cross-reference: Master PRD §13.7 (v1.10), AI_LAYERING §10 (v5.2), WORKLOAD_TAXONOMY §2.1 (v5.2).
- **Aliases (forbidden):** chatbot, AI doctor, virtual doctor

### Mode 2 (Protocol Execution Agent)
The automated clinical review engine operating under §13.1 protocolized clinical autonomy. Consumes structured intake data, evaluates protocol criteria, produces clinical summaries for physician review. Not patient-facing.
- **Governed by:** Protocol activation and governance
- **Workload taxonomy mapping (added v5.2):** Per ADR-029, Mode 2 is the workload-taxonomy value `protocol_execution`. ADR-005 protocolized autonomy remains binding for current `protocol_execution` workloads at autonomy_level ≤ `action_with_confirm` per the I-012 preservation rule (Master PRD §13.7 single normative source). Cross-reference: AUTONOMY_LEVELS contract (v5.2), WORKLOAD_TAXONOMY §2.2 (v5.2).
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
- **v1.10 extension (added v5.2):** Master PRD §13.7 (v1.10) extends the AI portion of the platform floor with the AI workload taxonomy supersession scope; AI-ARCH-001 / AI-ARCH-002 / I-012 remain binding without modification. New invariants I-029 (research data export gates), I-030 (consent-zero-impact on care delivery), I-031 (high_pii audit_sensitivity_level for research export events) extend the floor for research data partnership activation per ADR-028.

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
A logically isolated organizational unit on the Telecheck platform. Each tenant has its own brand, its own patients, its own clinicians, its own data, and its own integration adapter selections. **At launch, two operating tenants exist: Telecheck-US (operated by Telecheck Health LLC, trading patient-facing as Heros Health DBA) and Telecheck-Ghana (operated by Telecheck-Ghana Ltd., trading patient-facing as Heros Health Ghana DBA)** (amended v5.2 per C3 brand structure; cross-reference Master PRD §1, §2, §18.3 v1.10). Per ADR-023, all tenants share a single deployment with logical separation enforced at three layers (PostgreSQL Row-Level Security, application-layer filtering, per-tenant KMS encryption keys). The same person cannot have a single identity that spans tenants; the same person who uses both Telecheck-US (Heros Health) and Telecheck-Ghana (Heros Health Ghana) has two independent accounts (one per tenant).

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
- **Using `Heros` alone (without `Health` qualifier) as a tenant or operator identifier (added v5.2).** Operating tenant naming is `Telecheck-{country}` (e.g., `Telecheck-US`, `Telecheck-Ghana`). Consumer DBA is `Heros Health` (country-instanced via subdomains). "Heros" alone is forbidden in code, schemas, audit, contracts, and prose.
- **Using `chatbot` for any AI workload (added v5.2; superseded broader v5.1 anti-pattern).** Forbidden across all contexts (no carve-outs). Use `conversational_assistant` workload type or "Mode 1" UI label. The forbidden alias applies to schemas, code, events, audit, prose.
- **Activating a reserved AI workload type or autonomy level without successor ADR + activation audit event (added v5.2).** Reserved workload types (`autonomous_agent`, `multi_agent_supervisor`, `tool_using_agent`) and reserved autonomy levels (`action_with_audit_only`, `fully_autonomous`) require both a successor ADR (ADR-030, 031, 032, 033, 034 as applicable) AND an activation audit event in the immutable audit chain. ADR approval alone is never sufficient. Per Master PRD §13.7.
- **Branching care-delivery surfaces on research consent or `research_data_partnership_active` (added v5.2; reinforced by I-030).** Research consent is opt-in 5th tier; care delivery is identical for opted-in vs opted-out patients. Care surfaces MUST NOT branch on research consent or partnership status.
- **Emitting `research.export_*` events without the `audit_sensitivity_level = high_pii` field (added v5.2).** Per I-031, research export events emit at high_pii sensitivity. Missing the field is a defect.

---

## Brand and tenant terms (added v5.2)

### Telecheck
Parent company / platform brand / B2B mark. Anchors WHO/UN partnerships, regulatory engagement at the multilateral level, and platform-as-a-service business line. **Never the consumer mark** in any market.
- **Cross-reference:** Master PRD §1 Strategic differentiation; Master PRD §18 Business model.

### Heros Health
Global consumer DBA (doing-business-as) for all Telecheck-operated DTC. Country-instanced via subdomains: `heroshealth.com` (US), `ghana.heroshealth.com`, `nigeria.heroshealth.com` (future), `kenya.heroshealth.com` (future), etc. The unified consumer app is "Telecheck Heros." **Heros Health is a DBA, not a separate legal entity.** No "Heros Health Inc."
- **Cross-reference:** Master PRD §1; Master PRD §18.3 Telecheck-US operating business.

### Telecheck-{country}
Uniform tenant identifier convention for Telecheck-operated DTC tenants. Each country instance is a separately incorporated subsidiary. Examples: Telecheck-US (operated by Telecheck Health LLC; trades as Heros Health), Telecheck-Ghana (operated by Telecheck-Ghana Ltd.; trades as Heros Health Ghana), Telecheck-Nigeria (future), Telecheck-Kenya (future).
- **Cross-reference:** Master PRD §2 Tenant table.

### separately incorporated subsidiary
Each per-country operating tenant is a separately incorporated subsidiary of Telecheck-the-parent, holding its own regulatory entity registration, banking, payment-processor account, and local employer-of-record arrangements. Distinct from the platform tenant identifier (which is logical) and the consumer brand (which is a DBA).
- **Cross-reference:** Master PRD §2; Master PRD §18; ADR-023 multi-tenancy.

### Telecheck Health LLC
US legal entity operating the Telecheck-US tenant. Trades patient-facing as Heros Health at `heroshealth.com`.
- **Cross-reference:** Master PRD §2; Master PRD §18.3.

### Telecheck-Ghana Ltd.
Ghana legal entity operating the Telecheck-Ghana tenant. Trades patient-facing as Heros Health Ghana at `ghana.heroshealth.com`.
- **Cross-reference:** Master PRD §2; Master PRD §18.

### two business lines
The platform supports two distinct business lines:
- **Line 1: Telecheck-operated DTC.** Telecheck operates the consumer DTC business directly under the Heros Health brand, country-instanced via subdomains.
- **Line 2: Platform as a service.** Telecheck licenses the platform to genuinely-external third-party DTC operators in their own markets. Each external tenant brings its own consumer brand and app.

WHO/UN and other multilateral partnerships are anchored at the Telecheck parent level, separate from these business lines.
- **Cross-reference:** Master PRD §1; Master PRD §18.

### consumer DBA
A consumer "doing-business-as" name applied to a Telecheck-operated tenant. Patient-facing branding and marketing surfaces use the DBA; operating tenant identifier (Telecheck-{country}) is internal/B2B. Heros Health is the global consumer DBA for Line 1 (Telecheck-operated DTC).
- **Cross-reference:** Master PRD §1; Master PRD §18.

### Future Release marker
A non-goal entry marker indicating the item is not in scope for the current release but has a documented activation path or regulatory pathway that may bring it into scope in a future release. Distinguishes regulatory-conditional non-goals (could activate under different posture) from absolute non-goals (will not activate). Used in Master PRD §21 alongside three-axis classification (Regulatory · Architecture · Activation).
- **Distinguishes from:** "Phase 2/3+" roadmap language (Phase 2/3+ describes timing-bound items already on the roadmap; Future Release marker describes items that may or may not get on the roadmap depending on regulatory/strategic conditions).
- **Cross-reference:** Master PRD §21 (Non-goals); Master PRD §19 (Roadmap beyond launch).

---

## Marketing terms (added v5.2)

### molecule-level marketing
Marketing copy that names a specific medication (active pharmaceutical ingredient or branded product). Per the working definition in Master PRD §13.2, a surface qualifies as molecule-level if it satisfies any of: names a specific active pharmaceutical ingredient (e.g., "semaglutide", "sildenafil"); names a specific branded product (e.g., "Ozempic", "Wegovy"); names a specific dosage or formulation regime tied to a specific product; compares specific products by name; implies efficacy claims tied to a specific product. Subject to per-country regulatory posture per ADR-027 and the CCR `molecule_level_marketing_permitted` 3-state enum (`prohibited` / `pending_evidence` / `permitted`). At v1.0 launch: `prohibited` in Telecheck-US (FDA + state telehealth advertising rules); `pending_evidence` in Telecheck-Ghana (regulatory engagement underway; molecule-level surfaces remain disabled until `marketing_copy_governance_evidence` fully populated).
- **Cross-reference:** ADR-027; Master PRD §7.9 (Harm-reduction marketing posture); Master PRD §13.2 (Marketing copy governance — working definition and Governance review process).

### program-level marketing
Marketing copy that names a clinical category or program without naming a specific medication. Per Master PRD §13.2 working definition, a surface is program-level if it does NOT satisfy any of the molecule-level criteria and instead names a clinical category/program (e.g., "GLP-1 weight management program," "ED program," "diabetes RPM program"). Program-level marketing follows standard marketing review (not the §13.2 Governance review process). Borderline cases default to molecule-level handling under fail-closed rule per §13.2.
- **Distinguishes from:** molecule-level marketing.
- **Cross-reference:** ADR-027; Master PRD §7.9; Master PRD §13.2 (working definition); Master PRD §25 (Open questions — borderline-case refinement).

### harm-reduction marketing posture
Operational principle (Master PRD §7.9) stating that emerging-market tenants, where regulatory posture permits, may operate molecule-level marketing surfaces under the platform's safety floor (interaction engine, herb-drug, fake-med detection, clinician sign-off, audit trail). The marketing surfaces direct patients into the platform's mediated pathway, reducing harm relative to the counterfactual (unmediated pharmacy purchase). Activation requires CCR `molecule_level_marketing_permitted = permitted` AND fully populated `marketing_copy_governance_evidence` per §13.2.
- **Cross-reference:** ADR-027; Master PRD §7.9; Master PRD §13.2; Master PRD §21 (Non-goals — country-conditional rewrite).

### marketing copy governance review
Operator-side governance review apparatus (Master PRD §13.2, including its Governance review process internal subsection) that approves molecule-level marketing copy before publication. Triple sign-off: Marketing copy governance lead + Clinical Safety Officer + Regulatory Affairs Lead. Re-review cadence configured per tenant via CCR `marketing_governance_review_cadence_months` (initial: 6 months for high-risk medication categories like GLP-1; 12 months for lower-risk categories). Marketing copy governance review classifies under workload-taxonomy governance class `protocol_authorized` per §13.7 / ADR-029.
- **Cross-reference:** Master PRD §13.2 (Marketing copy governance, including the Governance review process internal subsection); ADR-027; Master PRD §24 (Marketing copy governance lead designation pre-launch decision).

---

## Research data terms (added v5.2)

### research data partnership
Strategic relationship with a multilateral body (WHO, UN agency, or analogous), academic research consortium, or population-health authority where Telecheck-the-parent provides de-identified longitudinal data under a Data Sharing Agreement (DSA). Patient consent at the operating-tenant level (5th consent tier per §15.2); data flows through Telecheck parent governance for partnership use. **Anchored at parent level, not at consumer brand level.** Distinct from trial-execution platform (Posture B; remains absolute non-goal). Activation gated by CCR `research_data_partnership_active` 3-state enum (`inactive` / `consent_only` / `active`) per §15.3.
- **Cross-reference:** ADR-028; Master PRD §15.3 (Research Data Governance); Master PRD §7.10 (Research data accessibility).

### Posture A / Posture B
- **Posture A — Research data partner / population observatory.** De-identified longitudinal data export under DSAs to research partners. Aggregation layer for population-level statistics. Permitted data domains are a closed enum: `chronic_disease_longitudinal`, `ncd_surveillance`, `pharmacovigilance_signal`, `population_health_aggregate`. **In scope as Release 2 goal** per ADR-028.
- **Posture B — Trial execution platform.** eCRF-style data collection, IRB-managed protocols, sponsor reporting, randomization, blinding, query resolution, IND/IDE filings, monitoring visits, partner-driven protocolized cohort recruitment, prospective observational studies that alter or instrument care workflows, post-market studies that change prescribing/follow-up behavior, partner requests that alter care workflows. **Remains absolute non-goal** per ADR-028.

The Posture A / Posture B boundary is bright-line. If a proposed feature crosses into Posture B, it requires a separate ADR superseding the relevant scope language in ADR-028.
- **Cross-reference:** ADR-028; Master PRD §15.3; Master PRD §21.

### data-sharing agreement (DSA)
Legal instrument authorizing a research partner to receive de-identified data exports from Telecheck under defined scope, duration, de-identification standard, k-anonymity threshold, consent provenance, audit posture, retention rules, and partner obligations. Each DSA has its own activation gate and audit trail per I-029 (research data export requires active DSA + active research consent + k-anonymity threshold ≥ k_min) and I-031 (research data export fully audited with cohort definition, k-threshold actually used, requester identity, DSA reference, audit_sensitivity_level: high_pii). DSA template is legal-reviewed pre-launch (Master PRD §24).
- **Cross-reference:** ADR-028; INVARIANTS contract v5.2 I-029, I-031; Master PRD §15.3; Master PRD §24.

### de-identification engine
Platform component that transforms patient-level clinical records into de-identified records meeting the chosen de-identification standard (Safe Harbor + k-anonymity per default, with `k_min` = 11 as v1.10 acceptance default). Implemented as part of the research data export module in System Architecture v1.2. Activated at Release 2 per ADR-028. Per §15.3 export pipeline, the de-identification engine is layer 2 of 4 (cohort definition → de-identification → aggregation → DSA enforcement).
- **Cross-reference:** ADR-028; System Architecture v1.2; Master PRD §15.3 (export pipeline); Master PRD §24.

### Safe Harbor de-identification
HIPAA Safe Harbor de-identification standard: removal of 18 specified identifier categories. Combined with k-anonymity threshold for additional protection against re-identification under combination-attack risk. Default standard per CCR `de_identification_standard` enum value.
- **Cross-reference:** ADR-028; CCR Runtime contract; Master PRD §15.3.

### k-anonymity
A re-identification protection standard requiring that any combination of quasi-identifying attributes in the released dataset matches at least k records (e.g., k=11 means at least 11 records share each combination of quasi-identifiers). Threshold value (k) is governed by `k_min`, default `k_min = 11` at v1.10 acceptance (HIPAA expert-determination low-risk floor per §15.3). Per-DSA increases above `k_min` are permitted (e.g., k=20 for high-sensitivity domains); decreases below `k_min` are prohibited per I-029. Suppression rule: any cohort cell with count < `k_min` is suppressed in aggregation outputs (not silently merged).
- **Cross-reference:** ADR-028; INVARIANTS contract v5.2 I-029; Master PRD §15.3 (export pipeline layer 2).

### cohort definition layer
Platform component where research partners (or their proxies in the platform admin) define cohorts by clinical inclusion/exclusion criteria without seeing PHI. Cohort definitions are versioned, audited via `research.cohort_defined` audit event per AUDIT_EVENTS v5.2, and reviewed against the active DSA's permitted use scope (must match `research_permitted_data_domains` enum). Layer 1 of 4 in the §15.3 export pipeline; feeds the de-identification engine.
- **Cross-reference:** ADR-028; System Architecture v1.2; AUDIT_EVENTS contract v5.2; Master PRD §15.3.

### aggregation layer
Platform component that produces population-level statistics (counts, distributions, longitudinal trends, prevalence, adherence rates, AE rates, outcome trajectories) without exposing patient-level data. Used for population-health programs (NCD surveillance, chronic disease registries) where aggregate flow is sufficient. Subject to the same `k_min` floor as the de-identification engine (cells with count < `k_min` are suppressed). Layer 3 of 4 in the §15.3 export pipeline.
- **Cross-reference:** ADR-028; System Architecture v1.2; Master PRD §15.3.

### research ethics committee (REC)
External oversight body that reviews and approves research data partnership activations under ethics review. Per CCR structured object `research_ethics_review_body` (`name`, `jurisdiction`, `approval_reference_id`, `approval_validity_from`, `approval_validity_to`, `approval_scope`, `per_dsa_review_required`). Each market has an in-country REC that reviews proposed DSAs and material changes to consent text. Telecheck-Ghana initial designation candidates: Ghana Health Service (GHS) REC or Noguchi Memorial Institute IRB. Future markets onboard analogous bodies alongside country expansion. Designated pre-launch per Master PRD §24. Engaged at per-country activation gate.
- **Cross-reference:** ADR-028; Master PRD §15.3 (Ethics oversight); Master PRD §24; Master PRD §22 (Dependencies).

### population observatory
Posture A framing of Telecheck's research data partnership role: an observation platform for population-level chronic-disease data flows, not a trial-execution platform. Distinguishes the platform's research role from interventional research (Posture B; absolute non-goal). Permitted data domains under this framing: `chronic_disease_longitudinal`, `ncd_surveillance`, `pharmacovigilance_signal`, `population_health_aggregate` (closed enum per §15.3).
- **Cross-reference:** ADR-028; Master PRD §7.10; Master PRD §15.3.

---

## AI taxonomy terms (added v5.2)

### AI workload type
Discriminator (`ai_workload_type`) for AI workload kinds. Replaces the binary "AI Mode 1 / AI Mode 2" framing of AI-LAYERING (AI-ARCH-001) with an extensible property-based taxonomy. Values defined exclusively in WORKLOAD_TAXONOMY contract; activation of reserved values requires successor ADR per ADR-029. Carries four orthogonal properties: `autonomy_level`, `tool_access`, `memory_scope`, `governance_class`.
- **Cross-reference:** WORKLOAD_TAXONOMY contract; ADR-029; AI-LAYERING contract v5.2; Master PRD §13.7.

### conversational_assistant
AI workload type for patient-facing chat with guardrails. Cannot make clinical decisions. Successor to AI-LAYERING Mode 1; identical semantics, relabeled. Active at v1.0. Properties: `autonomy_level_range = [advisory]`; `tool_access = [internal_kb_lookup]`; `memory_scope = [session]`; `governance_class = floor_safety`.
- **Cross-reference:** WORKLOAD_TAXONOMY §2.1; AI-LAYERING contract; Master PRD §13.7.

### protocol_execution
AI workload type for async clinical preparation engine operating within named, versioned protocols. Successor to AI-LAYERING Mode 2; identical semantics, relabeled. Active at v1.0 with `autonomy_level` capped at `action_with_confirm` (clinician confirmation required per I-012 — see §13.7 normative I-012 preservation rule). Properties: `autonomy_level_range = [advisory, suggestion, action_with_confirm]` (active); `action_with_audit_only` reserved; `tool_access = [protocol_kb, lab_lookup, formulary_lookup, interaction_engine]` (descriptive at v1.0; non-normative until ADR-031 / AGENT_TOOLS); `memory_scope = [patient_episode, program_history]`; `governance_class = protocol_authorized`.
- **Cross-reference:** WORKLOAD_TAXONOMY §2.2; AI-LAYERING contract; ADR-005 protocolized autonomy; Master PRD §13.7; INVARIANTS v5.2 I-012.

### autonomous_agent
Reserved AI workload type for open-ended multi-step clinical agent that reasons across patient history, labs, medications, and prior actions. Not bounded to a single named protocol. **RESERVED — requires ADR-030 (Tiered Autonomy Progression Model) plus AGENT_MEMORY contract (ADR-032) plus PolicyAuthorization framework activation.** Not implemented at v1.0.
- **Cross-reference:** WORKLOAD_TAXONOMY §3.1; ADR-029; reserved ADR-030, ADR-032; Master PRD §13.7.

### autonomy_level
Orthogonal property of an AI workload describing the degree of autonomous action authority. Five values per AUTONOMY_LEVELS contract: `advisory`, `suggestion`, `action_with_confirm` (active at v1.0); `action_with_audit_only`, `fully_autonomous` (reserved). Per-action validation enforces (`workload_type` × `autonomy_level`) compatibility per WORKLOAD_TAXONOMY `autonomy_level_range`. **Master PRD §13.7 is the single normative source of truth for I-012 + autonomy-level interaction**; downstream contracts (STATE_MACHINES, AUDIT_EVENTS, AUTONOMY_LEVELS) and tests MUST mirror §13.7 exactly.
- **Cross-reference:** AUTONOMY_LEVELS contract; WORKLOAD_TAXONOMY contract; ADR-029; Master PRD §13.7.

### advisory
Autonomy level: AI provides information only. No action authority. Patient or clinician interprets and decides. Active at v1.0 for both `conversational_assistant` and `protocol_execution` workloads. State machine terminates at `ai_recommended` or `ai_information_provided`; no action transition.
- **Cross-reference:** AUTONOMY_LEVELS §2.1; Master PRD §13.7.

### suggestion
Autonomy level: AI proposes an action; human selects from options or rejects. AI does not execute. Active at v1.0 for `protocol_execution` (rare; non-default). Boundary: cannot satisfy I-012 prescription/refill/medication-order execution requirement (selection of options is a pre-action proposal step, not the prescription execution itself). Per §13.7 I-012 preservation rule, `executed` MUST be rejected for I-012 actions when `autonomy_level == suggestion`.
- **Cross-reference:** AUTONOMY_LEVELS §2.2; Master PRD §13.7; INVARIANTS v5.2 I-012.

### action_with_confirm
Autonomy level: AI proposes a specific action; human confirms before execution. AI does not execute without confirm. Active at v1.0 default for `protocol_execution`. Per the Master PRD §13.7 I-012 preservation rule, `executed` for I-012 actions (prescription, refill, medication-order) MUST be rejected UNLESS all three of the following hold: (1) `autonomy_level == action_with_confirm` (string equality; not membership in a set), (2) an explicit clinician confirmation event exists in the immutable audit chain scoped to this `action_id` prior to the transition, (3) the confirming actor holds a role authorized to sign for the action class under RBAC v1.1 / I-012. State machine: `ai_recommended` → `human_confirmed` → `executed`.
- **Cross-reference:** AUTONOMY_LEVELS §2.3; Master PRD §13.7 (normative source of truth); INVARIANTS contract v5.2 I-012; RBAC v1.1.

### action_with_audit_only
Reserved autonomy level: AI executes the action; human reviews after-the-fact via audit. No pre-execution confirm. **RESERVED — requires ADR-030 (Tiered Autonomy Progression Model) + PolicyAuthorization framework + I-012 successor invariant + dedicated safety case + Clinical Safety Officer + Privacy Officer + Regulatory Affairs Lead sign-off + per-market regulatory clearance.** Per Master PRD §13.7, this level cannot reach `executed` for I-012 actions until a successor ADR (ADR-030 or later) explicitly supersedes I-012 for the action class in scope AND an activation audit event recording the supersession is present in the immutable audit chain. ADR approval alone is never sufficient. Not active at v1.0.
- **Cross-reference:** AUTONOMY_LEVELS §3.1; reserved ADR-030; Master PRD §13.7.

### fully_autonomous
Reserved autonomy level: AI executes the action without per-action human review (audit chain still mandatory; platform-floor safety gates always apply). **RESERVED — activation prerequisites are a strict superset of `action_with_audit_only`**: all `action_with_audit_only` prerequisites PLUS (a) augmented safety case demonstrating residual-risk acceptability without per-action human gating, (b) per-market regulatory clearance specific to fully-autonomous operation (cannot inherit `action_with_audit_only` clearance), (c) Clinical Safety Officer + Privacy Officer + Regulatory Affairs Lead **triple sign-off** at activation and on every material change, (d) named successor invariant superseding I-012 for the action class in scope, (e) any additional gates established by ADR-030 successors. No platform code path may resolve `fully_autonomous` to an executed clinical action until all prerequisites are recorded as satisfied in the activation audit event. Not active at v1.0.
- **Cross-reference:** AUTONOMY_LEVELS §3.2; reserved ADR-030; Master PRD §13.7.

### policy_authorization
Reserved primitive (PolicyAuthorization entity) representing an explicit autonomy grant per (`workload_type` × `action_type` × `tenant` × `market` × `protocol` × `autonomy_level`). Required for autonomy levels that explicitly require it (`action_with_audit_only`, `fully_autonomous`; NOT `advisory` / `suggestion` / `action_with_confirm` at v1.0). Each grant has `approval_chain`, `effective_from`, `expires`, `evidence_locker_ref`, `rollback_trigger`. Architecture defined under ADR-029; activation under ADR-030 + GOVERNANCE_CONTROLS contract.
- **Cross-reference:** AUTONOMY_LEVELS §5; ADR-029; reserved ADR-030; GOVERNANCE_CONTROLS contract v5.1; Master PRD §13.7.

### agent_identity
Reserved primitive distinguishing agent actor from human actor in audit and RBAC. Reserved fields in audit envelope: `agent_id`, `agent_version`. Populates only when an agentic workload type activates (`autonomous_agent`, `multi_agent_supervisor`, `tool_using_agent`). At v1.0: nullable, never populated; reserved for forward-compat per §13.7 audit envelope nullability rule.
- **Cross-reference:** AUDIT_EVENTS contract v5.2; ADR-029; reserved ADR-030, ADR-031; Master PRD §13.7.

### knowledge_source_registry
Reserved registry of approved AI knowledge bases with version pinning. Tightens current AI-LAYERING I-004 ("approved knowledge sources only") with explicit registry, citation requirements, retrieval audit, staleness handling, and per-AIExecution version pinning via `knowledge_source_versions[]` audit field. **RESERVED — requires ADR-034 (Knowledge Source Registry).** Reserved fields exist in audit envelope at v1.0 per §13.7; registry implementation deferred.
- **Cross-reference:** AUDIT_EVENTS contract v5.2 (`knowledge_source_versions[]` field); reserved ADR-034; Master PRD §13.7.

### supervising_policy
Reserved reference linking an autonomous action to its authorizing PolicyAuthorization. Audit envelope field `supervising_policy_id` (nullable; reserved). Populates only for autonomy levels requiring PolicyAuthorization (`action_with_audit_only`, `fully_autonomous`). At v1.0: nullable, never populated.
- **Cross-reference:** AUDIT_EVENTS contract v5.2; AUTONOMY_LEVELS §3.1, §3.2; reserved ADR-030; Master PRD §13.7.

---

## Forbidden-alias updates (added v5.2)

- **"Heros" alone** (without the qualifier "Health" or DBA framing) MUST NOT be used as a tenant or operator identifier. Operating-tenant naming is `Telecheck-{country}`; consumer DBA is `Heros Health` (country-instanced via subdomains).
- **§17 contextual carve-outs** in Master PRD v1.10 apply: "prescription" is permitted in (a) the canonical INVARIANTS contract entry name "I-012 prescription sign-off"; (b) FDA / regulatory literal phrases ("prescription drug marketing"); (c) Stripe payment-platform "prescription history" / "Customer" entity terms — outside these carve-outs, use `medication_request`. "customer" is permitted in (a) Stripe / Paystack admin literal entity; (b) standard business terms ("customer acquisition cost", "before customer ship") — outside these, use `tenant` or `patient`.
- **"chatbot"** remains forbidden across all contexts (no carve-outs); use `conversational_assistant` workload type or "Mode 1" UI label as documented.

---

## Document control

- **v5.1 (refreshed 2026-04-26 per ADR-026, US Region Migration Cycle U-003)** — Clarified `country_of_residence` definition to distinguish jurisdictional regulatory residency from physical hosting region (per ADR-026 the two are decoupled at launch). Added new entries: `data residency (jurisdictional)`, `data residency (physical) / hosting region`, `cross-border processing posture`. Additive entries plus narrow clarification only; no terms removed or redefined. No version bump (v5.1 retained as the contract version; entry-level refresh consistent with the contracts-pack version-discipline).
- **v5.0** — Initial Glossary contract.
- **v5.1** — Adds Tenancy and platform-isolation terms section: tenant, tenant_id, tenant scope, platform scope, tenant boundary, cross-tenant access, break-glass session, tenant brand, country profile, tenant configuration, platform admin / tenant admin / dual hierarchy, tenant-overridable vs platform-fixed token. Adds anti-patterns specific to multi-tenancy. Threading remediation per Adversarial Counsel Review v1.0 finding CRITICAL-01. Existing terms preserved without modification.
- **v5.2 (2026-05-02 per v1.10.1 hygiene cycle physical merge of v1.10 PRD Update Cycle delta artifacts `Phase3_Group2_Contracts_v1_10_Edits_2026-05-01.md` §GLOSSARY + `Phase2_F13_Glossary_Reconciled_2026-05-01.md`)** — Adds 37 new glossary terms across 4 new sections: **Brand and tenant terms** (8 entries from C3 — Telecheck, Heros Health, Telecheck-{country}, separately incorporated subsidiary, Telecheck Health LLC, Telecheck-Ghana Ltd., two business lines, consumer DBA + 1 entry from C1 — Future Release marker); **Marketing terms** (4 entries from C4 — molecule-level marketing, program-level marketing, harm-reduction marketing posture, marketing copy governance review); **Research data terms** (10 entries from C5 — research data partnership, Posture A/B, DSA, de-identification engine, Safe Harbor, k-anonymity, cohort definition layer, aggregation layer, REC, population observatory); **AI taxonomy terms** (14 entries from C7 — AI workload type, conversational_assistant, protocol_execution, autonomous_agent, autonomy_level, advisory, suggestion, action_with_confirm, action_with_audit_only, fully_autonomous, policy_authorization, agent_identity, knowledge_source_registry, supervising_policy). Amendments to existing v5.1 stale entries (wording-only, semantic preserved): `tenant` (operating-tenant naming with Telecheck-US/Telecheck-Ghana + DBA framing), `Mode 1 (Conversational Assistant)` (workload taxonomy mapping line added), `Mode 2 (Protocol Execution Agent)` (workload taxonomy mapping line added; ADR-005 preservation), `platform_floor` (§13.7 v1.10 extension + I-029/I-030/I-031 floor extension). Forbidden-alias updates: "Heros" alone forbidden as tenant/operator identifier; §17 contextual carve-outs from Master PRD v1.10 referenced; "chatbot" forbidden across all contexts (no carve-outs). 6 new anti-patterns added. Per ADR-027, ADR-028, ADR-029, Master PRD v1.10 §13.2 + §13.7 + §15.3 + §17 + §21. v5.2 is purely additive — existing v5.1 terms preserved (amendments are wording-only).
