# 00 · Platform Invariants

**Status:** canonical · **Version:** 5.1 · **Owner:** engineering lead + clinical safety officer · **Consumers:** everyone

Platform invariants are non-negotiable structural guarantees. They are not configurable, not market-specific, and not overridable by any feature, admin surface, protocol activation, or operator action. They are the floor beneath the floor.

Every feature spec, every code review, every AI prompt, every protocol activation, and every admin configuration must comply with all invariants. If a feature appears to require violating an invariant, the feature is wrong — rework the feature, not the invariant.

---

## The invariants

### I-001 · No LLM decides whether a market goes live

Market launch decisions are governance actions made by named humans through the Market Launch workflow (`00-MARKET-LAUNCH.md`). An LLM may surface data to inform the decision. It does not make the decision.

**Why:** A market go-live affects every patient in that market. Stochastic systems do not make population-level governance decisions.

### I-002 · No LLM bypasses clinical exclusion rules

Layer 1 exclusion checks (contraindications, hard stops, age/weight gates, pregnancy flags) are deterministic. An LLM does not evaluate them, override them, or decide whether to apply them. Layer 1 runs before the LLM sees the case.

**Why:** Exclusion rules exist to prevent harm. They are not suggestions.

### I-003 · Audit trail is immutable and append-only

No audit record is deleted, modified, or overwritten. Corrections are appended as new records referencing the original. The hash chain is never broken. There are no exceptions — not for debugging, not for storage, not for patient requests.

**Why:** Clinical accountability requires knowing exactly what happened, when, and by whom. An audit trail with gaps is not an audit trail.

### I-004 · AI agents use only approved knowledge sources

Specialty agents and protocol execution (Mode 2) operate against approved, versioned knowledge bases only. They do not search the open internet, consult unapproved databases, or generate clinical recommendations from general training data alone. Mode 1 conversational responses draw on general medical knowledge but are bounded by guardrail templates.

**Why:** Clinical decision support requires traceable evidence sources. "The AI said so" is not a source.

### I-005 · Full attribution on every clinical AI output

Every AI output that influences a clinical decision carries: which AI mode produced it, which model version, which knowledge base version, which guardrail template (Mode 1) or protocol version (Mode 2), the input data consumed, and the timestamp. If attribution cannot be produced, the output is not used.

**Why:** A clinician reviewing an AI recommendation must know exactly what produced it.

### I-006 · Forms Engine layers have separate permissions

The four layers of the Forms Engine (presentation_content, branching_logic, eligibility_logic, approval_governance) have separate edit permissions, separate approvers, and separate audit categories. A content author cannot edit eligibility logic. A product author cannot edit clinical exclusion rules.

**Why:** A marketing copywriter must not accidentally (or intentionally) change a clinical screening question.

### I-007 · Consent records are individually versioned and revocable

Each consent type (platform, care, data-use, episode, delegation, jurisdictional) is a separate record with its own version, scope, grant timestamp, and revocation capability. Consent is never a single checkbox. Revocation of one consent type does not revoke others unless explicitly scoped.

**Why:** Patients must be able to understand and control what they consented to.

### I-008 · Patient data does not cross jurisdiction boundaries without explicit consent

Patient data generated in one jurisdiction is not transferred to, stored in, or processed in another jurisdiction without the patient's explicit jurisdictional consent and compliance with both jurisdictions' data protection requirements.

**Why:** Regulatory compliance is not optional.

### I-009 · No hardcoded country assumptions

No service, API, UI, or business rule assumes a single country. Country-specific behavior is resolved through the CCR (`00-CCR-RUNTIME.md`) at runtime. Hardcoded country checks are a code review rejection.

**Why:** Telecheck is a global platform. Hardcoded country logic prevents market expansion.

### I-010 · Medication list is never silently modified

No automated process adds, removes, or modifies a medication on a patient's active list without either the patient's action or a clinician's documented decision. Protocol-authorized actions may modify the list but are audited as clinical actions, not silent updates.

**Why:** Patients and clinicians must be able to trust the medication list as accurate.

### I-011 · Hard-stop safety checks run before AI

Layer 1 checks (exclusions, contraindications, interaction engine critical signals) execute before AI Mode 2 processes a case. If Layer 1 blocks, Mode 2 never runs. The AI cannot override a Layer 1 block.

**Why:** Deterministic safety must not depend on stochastic assessment.

### I-012 · Clinician sign-off required for prescribing at launch

At launch, every prescription requires a named clinician's approval. Protocol-authorized prescribing (where the protocol executes without per-instance clinician review) is a post-launch activation requiring governance review, accuracy track record, and named accountability. Auto-approve requires 90 days of clinician-reviewed operation with zero safety-critical overrides.

**Why:** Until the protocol's safety record is established, every prescription has a human accountable.

### I-013 · Published content versions are immutable

Once a form version, protocol version, guardrail template version, or knowledge base version is published, it is never modified. Changes produce new versions. Patients, clinicians, and audit records reference specific version identifiers that never change meaning.

**Why:** "The form changed after the patient submitted it" is not an acceptable state.

### I-014 · Canonical vocabulary is enforced

The Glossary (`00-GLOSSARY.md`) defines the only permitted terms for code, schemas, APIs, events, and audit. Forbidden aliases are listed. Code review rejects non-canonical terms.

**Why:** Vocabulary drift creates bugs, miscommunication, and audit gaps.

### I-015 · Dual control for safety-critical configuration

Safety-critical configuration changes (protocol activation, guardrail template deployment, market launch approval, clinical exclusion rule changes) require two separate authorized individuals: an author and an approver. The author and approver must be different people.

**Why:** No single person should be able to unilaterally change a safety-critical parameter.

### I-016 · Domain events are immutable

Once emitted, a domain event is never modified or deleted. Corrections are emitted as new compensating events. The event log is the system of record for what happened.

**Why:** Event-driven systems fail when events can be retroactively changed.

### I-017 · Emergency information is always accessible

Emergency contact information, local emergency numbers, and crisis escalation pathways are cached on-device and available even when the platform is offline or degraded. No feature, error state, or connectivity failure may prevent a patient from accessing emergency information.

**Why:** A health platform that becomes inaccessible during a health emergency is worse than no platform.

### I-018 · Delegate actions are always attributed

Every action taken by a delegate on behalf of a patient carries the delegate's identity, the target patient's identity, and the delegation scope under which the action was authorized. Delegate context is never collapsed or hidden.

**Why:** Delegated care requires knowing who did what for whom.

### I-019 · Crisis detection cannot be configured away

Crisis detection (suicidal ideation, self-harm, abuse disclosure, medical emergency indicators) is always active across all platform surfaces — AI chat, community, forms, messaging. No guardrail template, moderation policy, or admin configuration can disable crisis detection.

**Why:** Patients in crisis must never encounter a surface that ignores their crisis.

### I-020 · Market Launch is the sole offerability authority

`00-MARKET-LAUNCH.md` is the sole authority for whether a program is available in a market. Forms Engine, AI Layering, and Protocol Pack market lists are compatibility constraints, not offerability decisions. If Market Launch says "not available," the program is not available regardless of what other systems say.

**Why:** Split-brain offerability (where two systems disagree about whether a program is live) causes false blocks and silent drift.

### I-021 · Bridge supply on consent revocation for abrupt-discontinuation medications

When a patient revokes care consent for a medication in an abrupt-discontinuation category (insulin, anticoagulants, anticonvulsants, beta-blockers, corticosteroids, SSRIs/SNRIs, opioids under clinical management), the platform authorizes a bridge supply sufficient for safe tapering. The clinician is notified immediately. The bridge supply follows the standard pharmacy workflow.

**Why:** Abrupt discontinuation of certain medications is medically dangerous. Consent revocation must not create a safety hazard.

### I-022 · Consent is presented progressively, never as a wall

Consent types are presented at the point in the patient journey where they become relevant: platform consent at account creation, care consent at program enrollment, delegation consent at delegate setup, jurisdictional consent at market-specific triggers. No flow presents all consent types simultaneously.

**Why:** A wall of consent text is not informed consent. It is a checkbox the patient clicks without reading.

---

### I-023 · Tenant isolation is enforced at three layers

Every record that contains PHI, payment data, clinical data, consent records, audit records, or any patient-identifying information carries a `tenant_id` column. Every query that reads or writes such records is filtered by `tenant_id`. Three independent enforcement layers apply:

1. **Database layer** — PostgreSQL Row-Level Security policies on every PHI-touching table reject queries that omit `tenant_id` or supply a `tenant_id` the requesting session is not authorized for.
2. **Application layer** — every data-access function in the codebase resolves the requesting user's authorized tenant context from the session before constructing any query. Bypassing this resolution is a code-review-blocking violation.
3. **Encryption layer** — per-tenant KMS keys ensure that even direct database backup access does not yield cross-tenant readable data.

A change that bypasses any of the three layers — including for "convenience," "performance," "internal admin only," or "temporary debug" — is forbidden. Performance tuning that requires cross-tenant query access uses break-glass per RBAC v1.1 with full audit, never query-level shortcuts.

**Why:** Multi-tenant platforms with single-layer isolation eventually leak. Three layers make any single-layer compromise a non-event.

---

### I-024 · Cross-tenant access requires break-glass and audit

Platform Admin and other privileged roles per RBAC v1.1 may access tenant data only via explicit break-glass procedure: stated reason, time-bound session, tenant Owner/Admin notification, full audit capture of what was accessed, post-session review by Privacy Officer within 7 days. The break-glass session does not silently elevate privileges; the operator visibly transitions into a tenant-context session with banner indication.

**Why:** Privileged access without friction normalizes cross-tenant inspection. Friction-by-design preserves the meaningful boundary.

---

### I-025 · Information-leak prevention in error envelopes

Error responses do not differentiate between "the requested resource does not exist anywhere on the platform" and "the requested resource exists in another tenant the requestor is not authorized for." Both yield the same not-found-style error envelope. This applies to all resource lookups by ID, all user/patient lookups, all subscription/refill/consult lookups, and all tenant-scoped resource references.

**Why:** Differential error responses leak the existence of other tenants and their resources. Engineering implementation that distinguishes "404 wrong tenant" from "404 doesn't exist" is a tenant-isolation bug.

---

### I-026 · Tenant configuration changes are governance events

Changes to tenant.country, tenant.brand, tenant.adapter selections, tenant CCR overrides, and tenant payment processor configuration are governance events captured in AUDIT_EVENTS Category B. Some changes (country attribute change in particular) are blocked at launch — only Platform Admin may execute them, only via break-glass, and only with documented rationale. Tenant Admin may not change their own tenant's country.

**Why:** Country drives regulatory module, payment processor, and integration adapters. A casual change at the tenant level cascades into clinical and legal consequences.

---

### I-027 · Audit envelope carries tenant context

Every audit record carries `tenant_id`, including audit records created by Platform Admin actions on a specific tenant (those records carry the target tenant's ID, not a null or platform-scope ID). Audit retrieval by Tenant Admin returns only their tenant's records. Audit retrieval by Platform Admin returns the requested scope (single tenant, multi-tenant, or platform-scope) but the request itself is audited.

**Why:** Tenant-scoped audit is the foundation of tenant-scoped accountability. Aggregated audit without tenant context cannot answer "what happened in our tenant."

---

### I-028 · Single physical region, single database, single schema; tenant isolation by logical means

The Telecheck platform runs in **one AWS region** (us-east-1 at launch per ADR-026) with **one PostgreSQL cluster** and **one logical schema**. Per-tenant isolation is enforced by `tenant_id` on every record (per I-023), Row-Level Security policies, application-layer query filtering, and per-tenant KMS encryption keys (per ADR-024) — **not** by physical separation. Per-region, per-tenant-database, or per-tenant-schema separation is explicitly out of scope at launch and requires a new ADR superseding the relevant clauses of ADR-026.

**Why:** Locking the architectural posture as an invariant prevents drift toward physical-separation patterns under operational pressure (which often arises when a regulator or a customer requests "in-country data residency"). The country-driven jurisdictional residency abstractions in CCR (`country_of_residence` driving consent, retention, DPC obligations) are sufficient for jurisdictional compliance; they do not require physical region separation. If a regulator's requirements cannot be met under the country-driven jurisdictional model — for example, if Ghana DPC requires Ghana data physically resident in Ghana — that is an ADR-superseding event, not a quiet architecture change.

---

## Operating with the invariants

### When writing a feature spec
Read the invariants first. Identify which apply. The spec must respect them. If the spec appears to require violating an invariant, the spec is wrong.

### When writing code
Linting and code review enforce invariants where automatable (I-014 vocabulary, I-009 no hardcoded country, I-016 event immutability). Where not automatable, they are part of the engineering review checklist.

### When designing an AI prompt
Read I-001, I-002, I-004, I-005, I-011, I-012. The prompt design lives within these bounds.

### When something goes wrong
The first question in any incident review is which invariant was violated. If no invariant was violated and the failure was still serious, the incident review proposes a new invariant.

---

## Adding a new invariant

1. Author writes the proposed invariant (numbered, declarative, operative, with "why")
2. Engineering lead, clinical safety officer, and compliance officer review and sign
3. Impact assessment identifies which contracts, features, and code must change
4. Invariant is added with the next number; existing numbers never change

Invariants are not removed. If genuinely no longer applicable, an invariant is marked deprecated with a successor noted, and the original remains visible.

---

## Relationship to the Master PRD §13.4 platform floor

The Master PRD §13.4 defines the "non-negotiable platform floor" — 7 clinical safety guarantees. These are a **subset** of the full invariant set, focused specifically on AI and clinical safety behavior visible to patients and clinicians.

| §13.4 platform floor item | Corresponding invariant(s) |
|---|---|
| No open-ended autonomous prescribing | I-002, I-011, I-012 |
| No concealment of AI identity | I-005 |
| No impersonation of human clinicians | I-005 |
| No suicide means assistance | I-019 |
| No diagnosis presented as definitive | (guardrail template governance, not a structural invariant) |
| No platform-tolerated peer medication sale | (community moderation policy, not a structural invariant) |
| Crisis detection always on | I-019 |

Invariants I-001, I-003, I-004, I-006–I-018, I-020–I-022 are **equally non-negotiable** but address engineering, data, governance, and consent guarantees rather than clinical safety floor items. The distinction is audience, not enforceability: §13.4 tells clinicians and regulators what the platform will never do. The invariants tell engineers what the architecture must always enforce.

---

## Anti-patterns

- **Treating invariants as defaults that can be overridden case-by-case.** They are not defaults. They are non-negotiable.
- **Embedding invariant logic inline rather than at the architectural layer.** Invariants are enforced by architecture (linting, layer separation, deterministic gates). Inline checks are brittle.
- **Violating an invariant "temporarily" for expedience.** There is no temporary invariant violation.
- **Adding feature-specific overrides to invariants.** Features adapt to invariants, never the other way around.

---

## Document control

- **v5.1 (refreshed 2026-04-26 per ADR-026, US Region Migration Cycle U-003)** — Adds I-028 (Single physical region, single database, single schema; tenant isolation by logical means). Locks the single-region/single-DB/single-schema architectural posture as an invariant per ADR-026 locked decisions. No existing invariants modified or removed; additive only. No version bump (v5.1 retained; entry-level addition consistent with v5.1 additive discipline).
- **v5.0** — Initial Platform Invariants. 22 invariants codified.
- **v5.1** — Adds tenant-isolation invariants I-023 through I-027 per ADR-023 multi-tenancy Model A and ADR-024 country-driven configuration. Threading remediation per Adversarial Counsel Review v1.0 finding CRITICAL-01. No invariants modified or removed; v5.1 is purely additive.
