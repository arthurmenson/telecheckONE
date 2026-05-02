# Phase 3 — AUDIT_EVENTS contract v1.10 edits

**Version:** 1.0 RECONCILED — proposed delta to canonical `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md` v5.1
**Date:** 2026-05-01
**Reconciliation owner:** Workstream lead (Evans) via Claude proxy
**Approval owner (audit-B):** Engineering Lead + Privacy Officer + Clinical Safety Officer (per I-015 dual-control for audit envelope changes)
**Purpose:** Reconcile v1.10 cycle additions to AUDIT_EVENTS contract — workload taxonomy envelope fields, 6 research events, 2 marketing events, new actor type, audit_sensitivity_level escalation per I-031.

---

## Edit summary

| # | Edit | Source |
|---|---|---|
| 1 | Add `ai_workload_type` and `autonomy_level` to audit envelope as required fields for new v1.10 AI events | WORKLOAD_TAXONOMY §1; ADR-029 |
| 2 | Add reserved nullable agentic-context fields to envelope: `agent_id`, `agent_version`, `tool_call_id`, `memory_read_set_id`, `memory_write_set_id`, `supervising_policy_id`, `knowledge_source_versions[]` | WORKLOAD_TAXONOMY §1; reserved per ADR-029 |
| 3 | Add `audit_sensitivity_level` field; values: `standard` (default), `high_pii` (research exports per I-031), reserved future levels namespace | I-031; Master PRD §15.3 |
| 4 | Add new actor type `ai_workload` (forward-compatible name); deprecate aliases `ai_mode_1` / `ai_mode_2` (preserved as backward-compat aliases) | ADR-029 §5; WORKLOAD_TAXONOMY §5 |
| 5 | Add 6 new research events: `research.cohort_defined`, `research.export_initiated`, `research.export_completed`, `research.consent_granted`, `research.consent_revoked`, `research.dsa_activated` | ADR-028 v0.4; Master PRD §15.3; I-029, I-030, I-031 |
| 6 | Add 2 new marketing events: `marketing.surface_rendered`, `marketing.surface_drift` | ADR-027 v0.5; Master PRD §13.2 |
| 7 | Update tenant-scope rules: research export events carry `tenant_id` of the operating tenant where consent was collected (not Telecheck-the-parent), even though the partnership is anchored at parent level | I-027; Master PRD §15.3 partnership-level rule |

---

## 1 · Audit envelope additions

Insert into the `Audit record schema` block (after the existing `compliance_flags` field, before `country_of_care`):

```
  "audit_sensitivity_level": "standard | high_pii",     // active values; reserved levels added with ADR amendment
  // ai_workload_type — full enum per WORKLOAD_TAXONOMY contract (active + reserved). Active at v1.0:
  //   conversational_assistant, protocol_execution. Reserved (require successor ADR):
  //   autonomous_agent, multi_agent_supervisor, tool_using_agent.
  "ai_workload_type":     "conversational_assistant | protocol_execution | autonomous_agent | multi_agent_supervisor | tool_using_agent | null",
  // autonomy_level — full enum per AUTONOMY_LEVELS contract (active + reserved). Active at v1.0:
  //   advisory, suggestion, action_with_confirm. Reserved (require ADR-030 + activation audit event):
  //   action_with_audit_only, fully_autonomous.
  "autonomy_level":       "advisory | suggestion | action_with_confirm | action_with_audit_only | fully_autonomous | null",

  // Reserved agentic-context fields (nullable; populate only when corresponding capability activates)
  "agent_id":             "<ULID> | null",
  "agent_version":        "<semver> | null",
  "tool_call_id":         "<ULID> | null",
  "memory_read_set_id":   "<ULID> | null",
  "memory_write_set_id":  "<ULID> | null",
  "supervising_policy_id":"<ULID> | null",
  "knowledge_source_versions": [ { "knowledge_base_id": "...", "version": "..." } ] | null,
```

**Enum coverage rule (added v0.2 patch — Codex Phase 3 group-1 MEDIUM-2):** The schema enum lists the full set of values defined in the source-of-truth contract (WORKLOAD_TAXONOMY for `ai_workload_type`; AUTONOMY_LEVELS for `autonomy_level`), including reserved values. Values being present in the schema does NOT activate them — runtime validation per the source contract rejects reserved values unless their activation prerequisites are recorded in the audit chain (ADR + activation audit event two-condition AND). This avoids cross-contract enum drift while preserving the runtime gate.

**Nullability rules (additive to existing v5.1 tenant-scope rules):**

- `audit_sensitivity_level` is required on every record. Default value `standard`. Records emitted by the research data export pipeline (events listed in §5 below in the `research.export_*` family) carry `audit_sensitivity_level = high_pii` per I-031. Other future high-sensitivity event classes may be added with corresponding ADR amendment.
- `ai_workload_type` and `autonomy_level` are **required** for new v1.10 AI events where `actor_type = ai_workload`. They are nullable in two cases only: (a) legacy events backfilled from before v1.10 promotion; (b) non-AI events (where `actor_type ≠ ai_workload`).
- Reserved agentic-context fields (`agent_id`, `agent_version`, `tool_call_id`, `memory_read_set_id`, `memory_write_set_id`, `supervising_policy_id`, `knowledge_source_versions[]`) are nullable across all events. They populate only when the corresponding capability activates (per ADR-030, ADR-031, ADR-032, ADR-033, ADR-034 as applicable).
- Schema additive only — no audit migration required; legacy records receive `null` for these fields.

## 2 · Actor type addition

Update the `actor_type` enum in the schema:

```
  "actor_type": "patient | clinician | pharmacist | operator | delegate | protocol_engine | ai_workload | ai_mode_1 | ai_mode_2 | system | platform_admin",
```

**Forward-compatibility convention:**

- New v1.10 AI audit events (and all post-v1.10 AI events) use `actor_type = ai_workload` with the workload identified via `ai_workload_type`.
- The aliases `ai_mode_1` and `ai_mode_2` are preserved as backward-compat values for existing audit records and any pre-v1.10 emitters that have not yet migrated to the workload-taxonomy envelope. They are equivalent to `actor_type = ai_workload, ai_workload_type = conversational_assistant` and `actor_type = ai_workload, ai_workload_type = protocol_execution` respectively.
- Audit retrieval queries that filter by AI workload SHOULD use the `ai_workload_type` field rather than the `actor_type` aliases. Aliases are deprecated for new code; not removed (audit immutability per I-003).

## 3 · I-012 preservation rule (audit-side enforcement, mirroring Master PRD §13.7 v0.3)

The audit envelope MUST support the §13.7 reject-unless three-clause rule. For action records governed by I-012 (prescription, refill, medication-order), the state machine integration MUST emit an audit record only when ALL three of the following are present in the audit chain for that `action_id`:

1. The action's `autonomy_level` field equals `action_with_confirm` (string equality; not membership).
2. An explicit clinician confirmation event (`prescribing.approved` or equivalent) exists in the immutable audit chain prior to the `*.executed` transition, scoped to the same `action_id`.
3. The confirming actor's `actor_id` resolves to a role authorized to sign for the action class under RBAC v1.1 / I-012 (verified at write time).

If any of the three conditions is unmet, the state machine rejects the `executed` transition before any audit record is emitted. Reserved autonomy levels (`action_with_audit_only`, `fully_autonomous`) and null/unknown/absent values are explicitly rejected by this rule. Reserved levels can reach `executed` for I-012 actions ONLY when **both** (a) a successor ADR (ADR-030 or later) explicitly supersedes I-012 for the action class in scope, AND (b) an activation audit event recording the supersession is present in the immutable audit chain. ADR approval alone is never sufficient; the activation audit event is required. Future enum values not yet authorized by an ADR-029 successor default to **rejected**.

**Source of truth:** Master PRD §13.7 (single normative source of truth for I-012 + autonomy-level interaction). This audit-side rule mirrors the §13.7 normative wording exactly, including the two-condition AND for reserved-level activation.

## 4 · Tenant-scope rule for research exports

Add to the existing tenant-scope rules block:

> **Research export tenant-scope rule (added v5.2 / v1.10).** Research data export events (the `research.export_*` family in §5 below) carry `tenant_id` of the **operating tenant** where consent was collected (e.g., Telecheck-Ghana for Heros Health Ghana patients), even though the research partnership is anchored at the Telecheck parent / platform level per Master PRD §15.3. The DSA reference (`dsa_id`) on the event identifies the parent-level partnership; the tenant scope identifies the data origin. This dual identification supports the §15.3 partnership-level governance model without losing tenant-scoped accountability per I-027. Cohort definitions and de-identified cohort outputs that span multiple tenants emit one audit record per contributing tenant (not a single multi-tenant record), each scoped to that tenant's contribution.

## 5 · New Category B / high-sensitivity events — research

Add to the **Category B — Governance and configuration actions** table (with the noted high-sensitivity escalation for the export events):

| Action | Actor types | Detail payload | audit_sensitivity_level |
|---|---|---|---|
| `research.consent_granted` | patient | consent_id, consent_type ("research_data_use"), scope, version_presented, consent_text_version | standard |
| `research.consent_revoked` | patient | consent_id, consent_type ("research_data_use"), scope, revocation_reason, revocation_effective_at, asymmetric_retraction_acknowledgment | standard |
| `research.dsa_activated` | privacy_officer + approver (dual-control per I-015) | dsa_id, dsa_version, partner_id, partner_name, dsa_validity_from, dsa_validity_to, permitted_data_domains[], k_min_required, ethics_review_body_reference | standard |
| `research.cohort_defined` | operator | cohort_definition_id, cohort_version, dsa_id, dsa_version, inclusion_criteria_artifact_id, exclusion_criteria_artifact_id, requested_data_domains[], k_threshold_target | standard |
| `research.export_initiated` | system, operator | cohort_definition_id, **cohort_version**, dsa_id, **dsa_version**, **dsa_status_at_export** (`active`), **permitted_data_domains_at_export[]**, requester_id, **requester_role**, requester_partner_id, requested_field_set, **k_min_required**, k_threshold_target, **consent_cohort_snapshot_hash** (SHA-256 of the consenting-patient set used for cohort definition), export_started_at, **status** (`initiated`) | **high_pii** (per I-031) |
| `research.export_completed` | system | cohort_definition_id, **cohort_version**, dsa_id, **dsa_version**, **dsa_status_at_export** (`active` if delivery succeeded; `expired` / `suspended` / `retired` if invalidation triggered per I-029), **permitted_data_domains_at_export[]** (snapshot at completion), requester_id, **requester_role**, requester_partner_id, exported_field_set, k_threshold_actual, **k_min_required**, suppressed_cell_count, export_completed_at, export_artifact_hash (null if invalidated), retention_class, **consent_cohort_snapshot_hash**, **status** (`completed` if delivery succeeded; `invalidated` if I-029 conditions failed at completion-time check), **invalidation_reason** (null if `status = completed`; one of `dsa_status_change`, `k_threshold_violation`, `permitted_domain_drift`, `consent_revocation_mid_export`, `other` if `status = invalidated`) | **high_pii** (per I-031) |

**I-029 binding and audit-side completion discipline (mirrors I-029 v1.0 + GOVERNANCE_CONTROLS v5.2 incident response):** Per I-029, the **domain-side delivery** (`research_export.delivered` event + actual export artifact leaving the platform) MUST be rejected if any I-029 condition is unmet (DSA inactive, k-anonymity below k_min_required, permitted-domain drift, consent-cohort change). However, the **audit-side completion-attempt** (`research.export_completed` event in the immutable audit chain) is governed by a different rule — bare suppression of the audit record is forbidden per I-003 (audit gap = audit defect).

The two-event audit pattern for failed exports:

1. `research.export_completed` MAY emit with `status = invalidated`, the violated state recorded in payload (e.g., `dsa_status_at_export = expired`, `k_threshold_actual` showing the violation, etc.), `invalidation_reason` populated, and `export_artifact_hash = null` (no artifact was delivered).
2. Concurrent `signal_enforcement_trigger` Category B audit (per existing v5.1 catalog) captures the enforcement action: artifact destruction, partner notification per DSA terms, engineering review trigger.

This pattern preserves I-003 (audit completeness) while enforcing I-029 (delivery rejection). The `status` field on the export events is the authoritative discriminator: `completed` = delivery succeeded; `invalidated` = delivery rejected, audit captured.

**I-030 binding (audit-side cross-check):** Audit retrieval surfaces that filter records by `research_consent_status` MUST NOT influence any care-delivery surface response. This is enforced upstream at the application layer per I-030; audit retrieval itself is read-only and serves cohort definition and reconciliation only.

## 6 · New Category B events — marketing copy governance

Add to the **Category B — Governance and configuration actions** table:

| Action | Actor types | Detail payload | audit_sensitivity_level |
|---|---|---|---|
| `marketing.surface_rendered` | system | tenant_id, country_of_care, surface_id, surface_type, ccr_marketing_policy_version_id, marketing_copy_version_id, **governance_review_reference_id** (the §13.2 Governance review process artifact ID for this copy version), governance_review_reviewer_ids[], **governance_review_approval_timestamp**, **governance_review_approval_validity_until** (per `marketing_governance_review_cadence_months` per §13.2), rendered_claim_classes[], patient_id (per tenant-isolation), session_id | standard |
| `marketing.surface_drift` | system | tenant_id, country_of_care, surface_id, ccr_marketing_policy_version_id, expected_marketing_copy_version_id, observed_marketing_copy_version_id, drift_type ("copy_version" / "policy_version" / "approval_lapsed"), suspension_action_taken | standard |

**Auto-suspension binding (per Master PRD §13.2):** A `marketing.surface_drift` event MUST be accompanied by an immediate platform action that suspends the affected surface. The surface is re-enabled only after a fresh re-review under the §13.2 Governance review process. The suspension itself is audited as a Category B governance event (`signal_enforcement_trigger` with appropriate `enforcement_action_taken` payload).

## 7 · Update to existing Category A events (workload taxonomy alignment)

The following existing Category A events have `actor_types` updated to add `ai_workload` alongside the existing `ai_mode_1` / `ai_mode_2` aliases. No semantic change; the alias mapping per §2 above means existing records remain valid:

- `prescribing.initiated`: `clinician, ai_mode_2` → `clinician, ai_mode_2, ai_workload`
- `crisis_detection_trigger`: `ai_mode_1, system` → `ai_mode_1, ai_workload, system`
- `emergency_escalation`: `ai_mode_1, system` → `ai_mode_1, ai_workload, system`
- `ai_mode_2_evaluation`: `ai_mode_2` → `ai_mode_2, ai_workload`
- `ai_mode_2_physician_*`: clinician (unchanged)
- `interaction_engine_evaluation`: `system` (unchanged — not an AI workload action)
- `herb_drug_engine_evaluation`: `system` (unchanged — not an AI workload action)

**Forward-rule:** New v1.10+ emitters MUST emit `actor_type = ai_workload` with `ai_workload_type` populated. The mode aliases are preserved for backward-compat, not removed (per I-003 audit immutability — existing records cannot be retroactively modified).

## 8 · Anti-patterns added

Add to the existing Anti-patterns block:

- **Emitting an AI audit event with null `ai_workload_type` or `autonomy_level` (added v5.2 / v1.10).** New v1.10+ AI events require both fields populated per WORKLOAD_TAXONOMY §1 nullability rule. Null is reserved for legacy backfill and non-AI events only.
- **Confusing `audit_sensitivity_level` with the safety-classification matrix Categories A/B/C (added v5.2 / v1.10).** They are orthogonal: `audit_sensitivity_level` governs retention/access/query treatment within a category; the A/B/C category governs which retention rule applies. An export event is Category B (governance) AND `audit_sensitivity_level = high_pii` (elevated treatment within Category B).
- **Using the `ai_mode_1` / `ai_mode_2` actor type aliases in new v1.10+ code (added v5.2 / v1.10).** Use `actor_type = ai_workload` with `ai_workload_type` set. Aliases are deprecated for new code (preserved for existing records per I-003).

## 9 · Document control update for AUDIT_EVENTS contract

**Add as the most-recent v5.2 entry in §Document control:**

> - **v5.2 (refreshed 2026-XX-XX per v1.10 promotion)** — Adds workload-taxonomy envelope fields (`ai_workload_type`, `autonomy_level`); reserved nullable agentic-context fields (`agent_id`, `agent_version`, `tool_call_id`, `memory_read_set_id`, `memory_write_set_id`, `supervising_policy_id`, `knowledge_source_versions[]`); `audit_sensitivity_level` field with `standard` / `high_pii` enum (`high_pii` for research exports per I-031); new `actor_type = ai_workload` (with `ai_mode_1` / `ai_mode_2` preserved as backward-compat aliases); 6 new research events (`research.consent_granted`, `research.consent_revoked`, `research.dsa_activated`, `research.cohort_defined`, `research.export_initiated`, `research.export_completed`) — the `export_*` family at `audit_sensitivity_level = high_pii` per I-031; 2 new marketing events (`marketing.surface_rendered`, `marketing.surface_drift`); research-export tenant-scope rule (operating-tenant ID, parent-level DSA reference); I-012 preservation rule mirroring Master PRD §13.7 v0.3 normative wording. Per ADR-027 (Country-conditional DTC marketing posture), ADR-028 (Research data partnership Posture A), ADR-029 (AI Workload Taxonomy). No existing fields modified or removed; v5.2 is purely additive.

---

## Document control (this delta artifact)

- **v1.0 — 2026-05-01** — Phase 3 reconciliation against canonical Master PRD v1.10 §13.2 + §13.7 + §15.3 + ADRs 027 / 028 / 029. Audit envelope expanded for workload taxonomy + audit_sensitivity_level + 6 research + 2 marketing events.
- **v1.0.2 — 2026-05-01** — Patches per Codex Phase 3 group-1 review v0.1 (1 HIGH + 4 MEDIUM):
  - **HIGH (export payload missing I-031 fields):** `research.export_initiated` + `research.export_completed` payloads now carry `cohort_version`, `dsa_version`, `requester_role`, `dsa_status_at_export`, `permitted_data_domains_at_export[]`, `k_min_required`, `consent_cohort_snapshot_hash` (immutable across export lifecycle).
  - **MEDIUM-1 (I-012 mirror incomplete):** §3 now reproduces §13.7 v0.3 two-condition AND for reserved-level activation (successor ADR + activation audit event; ADR approval alone never sufficient).
  - **MEDIUM-2 (schema enum drift):** §1 audit envelope schema now lists full enum for `ai_workload_type` and `autonomy_level` (active + reserved) per the source-of-truth contracts; added enum-coverage rule clarifying that schema presence ≠ activation.
  - **MEDIUM-3 (export evidence for I-029 verification):** Already covered by HIGH fix above (`dsa_status_at_export`, `permitted_data_domains_at_export[]`, `k_min_required`, `consent_cohort_snapshot_hash`).
  - **MEDIUM-4 (marketing rendered event under-specified):** `marketing.surface_rendered` now carries `governance_review_reference_id`, `governance_review_approval_timestamp`, `governance_review_approval_validity_until` (per `marketing_governance_review_cadence_months` per §13.2).
- **Status:** RECONCILED v0.2 — proposed Phase 3 contribution. Codex Phase 3 group-1 v0.2 verification pending.
- **Lands canonically:** `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md` v5.2 at Phase 6 promotion.
