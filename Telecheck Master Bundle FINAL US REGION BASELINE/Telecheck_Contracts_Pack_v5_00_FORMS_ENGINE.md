# 00 · Forms Engine

**Status:** canonical · **Version:** 5.2 · **Owner:** product lead + clinical safety officer · **Consumers:** intake authoring, provider review, operator tooling

This document defines the four-layer architecture of the Forms Engine, the intake lifecycle, provider feedback model, and patient visibility rules. Per I-006, form layers have separate permissions. Per I-013, published versions are immutable.

---

## Four-layer architecture

Every intake form is composed of four distinct layers. Each layer has its own edit permissions, approvers, and audit category. A change to one layer does not require re-approval of other layers.

### Layer 1: presentation_content
Reassurance copy, testimonials, statistics, education excerpts, conversion content blocks. UX-facing.
- **Edited by:** content_author
- **Approved by:** medical_director (clinical claims) or marketing_lead (non-clinical)
- **Audit category:** C (non-clinical content edits)

### Layer 2: branching_logic
Conditional question display, ordering, skip logic, page flow. Determines what the patient sees and in what order.
- **Edited by:** product_author
- **Approved by:** product_lead
- **Audit category:** C

### Layer 3: eligibility_logic
Clinical screening, contraindication detection, hard exclusions. Maps directly to Layer 1 deterministic checks in the AI architecture. This is the safety-critical layer.
- **Edited by:** clinical_content_author
- **Approved by:** clinical_safety_officer for the specialty
- **Audit category:** B (governance)
- **Dual control required per I-015**

### Layer 4: approval_governance
Pricing, country availability, launch gating. Binds a form version to markets, programs, and commercial configuration.
- **Edited by:** operator
- **Approved by:** market operations lead
- **Audit category:** B

---

## Form versioning

### Pattern A: one version per market (ADR-004)

Each market gets its own form version for a given program. Ghana's GLP-1 intake form may differ from Nigeria's. The canonical identifier is `intake_form_version_id` (ULID prefixed `frv_`).

Published versions are immutable (I-013). Changes produce new versions. Patients complete intakes against a specific version. The version used is recorded in the intake response and in audit.

### Version lifecycle
1. **Draft** — being authored; not visible to patients
2. **Published** — live; patients can complete intakes against it
3. **Superseded** — a newer version is published; this version is no longer offered to new intakes but existing in-progress intakes complete against it
4. **Archived** — no longer used; retained for audit reference

---

## Intake lifecycle

1. Patient begins intake → assigned the current published `intake_form_version_id` for their market and program
2. Patient completes questions → answers saved as `intake_response` against that version
3. Eligibility logic (Layer 3) evaluates → eligible, ineligible, or needs-clarification
4. If eligible → intake proceeds to AI Mode 2 evaluation (if applicable) or clinician review
5. Provider feedback may be attached (advisory or blocking)
6. Clinician reviews intake with AI summary, interaction signals, and eligibility result
7. Outcome recorded in audit with full version chain

---

## Provider feedback model

After intake submission, a clinician or the AI Mode 2 agent may attach feedback:

- **Advisory feedback:** informational note visible to the reviewing clinician but not blocking. Example: "Patient's BMI is borderline — consider additional assessment."
- **Blocking feedback:** prevents the intake from proceeding to the next step until resolved. Example: "Contraindication detected — manual clinician review required."

Feedback is linked to specific intake answers and recorded in audit.

---

## Medication reconciliation in intake (v5 addition)

The intake flow includes a structured medication reconciliation step (per Forms/Intake Engine Slice PRD):
- Structured entry with formulary autocomplete
- AI-assisted conversational reconciliation (Mode 1 prompts for common omissions)
- Photo upload for medication identification via OCR
- Completeness confidence tagging (high/medium/low)

The herbal medicine reporting step is explicitly included as a dedicated, prominent question (per Herb–Drug Interaction Engine Slice PRD §7.2).

---

## Tenant scoping (added v5.1)

Per ADR-023 multi-tenancy Model A and CRITICAL-01 remediation, every form artifact in the Forms Engine is tenant-scoped:

- **Form templates are tenant-scoped.** A template authored in Tenant A is not visible to Tenant B. Cross-tenant template sharing as a productized feature is post-launch (per Forms Engine v2.X §5.1).
- **Form deployments are tenant-scoped.** A deployed template version serves only patients in its tenant.
- **Form submissions are tenant-scoped.** Submissions carry `tenant_id`; submission retrieval is tenant-filtered.
- **Form snapshots are tenant-scoped.** The immutable record of what a patient saw is tied to the tenant context at submission time.
- **Form variants (A/B test) are tenant-scoped.** Variant assignment, statistical significance computation, and winner promotion happen within a single tenant.
- **Form Resume State is tenant-scoped.** Per Forms Engine v2.X §8, paused submissions resume only within the tenant they were initiated in.
- **JSON import/export is tenant-scoped at export time.** Exported JSON is provided to the requesting tenant admin; importing into another tenant requires the importing tenant's admin to upload independently. There is no cross-tenant template marketplace at launch.
- **Form Engine audit records carry `tenant_id`** per AUDIT_EVENTS v5.1.

The four-layer separation rule (Template, Deployment, Submission, Snapshot) is preserved, with Variant and Resume State added as additional scoped layers per Forms Engine v2.X §4.

---

## Research consent integration (added v5.2 per ADR-028)

When a Forms Engine intake or care-touch flow includes the 5th consent tier (research data-use), the consent block is rendered per the L1 (presentation) layer for the active country (CCR `default_locale`) and tracked per the L4 (approval governance) layer. The L4 approval governance for forms containing research consent blocks MUST verify that:

1. The active CCR `research_data_partnership_active` ≠ `inactive` for the form's `country_of_care` (else the consent block MUST NOT render — patients are not asked to consent when the partnership is inactive in their country).
2. The `research_consent_text_version` rendered matches the approved text version per CCR `research_ethics_review_body.approval_reference_id` and `approval_validity_to >= now`.
3. Per I-030, **no Forms Engine layer (L1 presentation, L2 branching, L3 eligibility, L4 approval) may produce care-touching behavior that depends on `research_consent_status`**. Static analysis at form-version-publish time MUST reject all of:
   - L2 BranchingLogic rules whose path selection depends on `research_consent_status` (no care-flow branching on research consent)
   - L3 Eligibility rules whose outcome depends on `research_consent_status` (no eligibility gating on research consent)
   - L4 ApprovalGovernance rules whose pathway selection depends on `research_consent_status` (no approval-pathway differentiation on research consent)
   - L1 PresentationContent variation conditioned on `research_consent_status` for any non-consent-block surface (consent block itself is rendered from CCR `research_data_partnership_active` state per condition 1 above; all other patient-facing copy MUST NOT vary by consent status)
   - Intake-flow gating (skipping or inserting flow steps) conditioned on `research_consent_status`
   - Surface visibility (showing or hiding any non-consent surface) conditioned on `research_consent_status`

   The single permitted dependency is rendering the research-consent block itself from CCR state per condition 1 above (and re-rendering on consent grant/revoke). Form-version-publish-time static analysis is the Forms-Engine-side enforcement of I-030; runtime CCR validation provides the cross-check.

---

## Cross-reference to Master PRD §10.5 (added v5.2)

**Pattern A and four-layer architecture cross-reference.** Master PRD v1.10 §10.5 is the canonical source for the platform-level program catalog architecture. It explicitly references this contract's four-layer Forms Engine model (L1 presentation, L2 branching, L3 eligibility, L4 approval) and Pattern A versioning rule (every market gets its own immutable form version even when the underlying clinical structure is byte-identical — the price of regulatory provenance). FORMS_ENGINE v5.1 four-layer model and Pattern A are preserved without modification; §10.5 documents how they compose with the platform-level Program entity (per ProgramCatalogEntry type, TYPES v5.2) + ProgramMarketPolicy (per MARKET_LAUNCH v5.1) + CCR Runtime resolution (CCR_RUNTIME v5.2) to produce per-tenant, per-country form deployments.

---

## Document control

- **v5.0** — Initial Forms Engine contract.
- **v5.1** — Adds Tenant scoping section per ADR-023. All four (now six) form artifact layers tenant-scoped. Threading remediation per Adversarial Counsel Review v1.0 finding CRITICAL-01. Existing four-layer architecture, form versioning, intake lifecycle, provider feedback model, and v5 medication reconciliation addition preserved without modification.
- **v5.2 (2026-05-02 per v1.10.1 hygiene cycle physical merge of v1.10 PRD Update Cycle delta artifact `Phase3_Group3_Contracts_v1_10_Edits_2026-05-01.md` §FORMS_ENGINE)** — Adds Research consent integration section per ADR-028: L1 rendering gate based on CCR `research_data_partnership_active != inactive`; L4 approval governance verification of `research_consent_text_version` against CCR `research_ethics_review_body.approval_reference_id`; static analysis at form-version-publish time rejects 6 categories of dependency on `research_consent_status` (L2 BranchingLogic, L3 Eligibility, L4 ApprovalGovernance, L1 PresentationContent variation excluding the consent block itself, intake-flow gating, surface visibility) per I-030 enforcement. Adds Cross-reference to Master PRD §10.5 program catalog architecture (Pattern A immutable per-market form versions; four-layer architecture composes with Program entity + ProgramMarketPolicy + CCR Runtime to produce per-tenant per-country form deployments). Per ADR-028 + Master PRD v1.10 §10.5 + §15.2/§15.3 + INVARIANTS v5.2 I-030. Existing four-layer architecture, Pattern A versioning, form versioning, intake lifecycle, provider feedback model, medication reconciliation addition, and §Tenant scoping preserved without modification. v5.2 is purely additive.
