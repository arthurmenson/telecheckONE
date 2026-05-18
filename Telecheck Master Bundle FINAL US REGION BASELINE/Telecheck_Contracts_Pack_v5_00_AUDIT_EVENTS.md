# 00 · Audit Events

**Status:** canonical · **Version:** 5.4 · **Owner:** engineering lead + compliance officer · **Consumers:** all services, compliance, clinical safety, patient-access

**v5.4 amendments (2026-05-18, P-023 / SC6 SI-010 canonical-content-port landing):** 3 net-new Category B action IDs added under a new "Identity binding-lifecycle events" subsection of §Category-B: `identity.actor_context_bound` (emitted by `bind_actor_context()` SECURITY DEFINER procedure on every successful authContextPlugin invocation), `identity.session_liveness_check_failed` (emitted on revoked / missing / expired session check at the authContextPlugin Step 2 fail-closed point per SI-010 R3 HIGH-2 closure 2026-05-15), `identity.actor_context_unbound_rejected` (emitted by dependent SECURITY DEFINER procedures when `assert_request_nonce_bound()` raises `actor_context_unbound` or `request_nonce_unbound_or_expired`). All 3 carry `actor_account_id` + `session_id` + `nonce_hash` (SHA-256 of binding nonce; never plaintext) + ratification context per SI-010 source `detail` schema. Closes Phase 2 F-3 (JWT session-liveness check) by virtue of folding the liveness check into the binding path; unblocks SI-005 + SI-008 + SI-009 SECURITY DEFINER procedures' IMPL-readiness gate. Lockstep paired with Identity & Authentication Spec v1.0 §3.6 NEW "Server-side actor context (per SI-010)" section landing in this same PR-A2/A3 commit. CDM-exempt (Identity-slice procedure-only; no new entity rows). DOMAIN_EVENTS-exempt (binding lifecycle is audit-only Cat B; no domain events). All carry-forward enums from v5.3 preserved unchanged.

**v5.3 amendments (2026-05-11, P-011 / SI-001 closure):** (a) §I-012 closure rule authoritative I-012 action-class set amended — `prescribing.protocol_authorization_granted` added to the exact list; future-extension carve-out broadened to include `prescribing.*` confirmation actions added by an I-012-amending SI promotion. (b) §Category-A enum extended with 7 net-new action IDs (`medication_request.{drafted, submitted_for_review, interaction_evaluation_completed, discontinued, superseded, expired}` + `prescribing.protocol_authorization_granted`). All carry-forward enums from v5.2 preserved unchanged. Live emission and cross-artifact references for the new I-012 confirmation action MUST resolve against v5.3 or later. CDM v1.3 `audit_events.audit_i012_workload_evidence_required` CHECK constraint amended in lockstep to add the new action to its `action NOT IN (...)` list (database-level enforcement of the same authoritative set).

This document defines the audit event schema, complete action catalog, safety classification matrix, hash chain integrity model, and patient self-access rules. Per I-003, audit records are immutable and append-only. No exceptions.

---

## Audit record schema

Every audit event contains:

```
{
  "audit_id":          "aud_<ULID>",
  "timestamp":         "<ISO 8601 with timezone>",
  "tenant_id":         "Telecheck-{country}",                     // operating-tenant identifier per CDM v1.3 §4.1 + Master PRD v1.10 §17 (e.g., 'Telecheck-US', 'Telecheck-Ghana'); NOT a ULID
  "actor_type":        "patient | clinician | pharmacist | operator | delegate | protocol_engine | ai_workload | ai_mode_1 | ai_mode_2 | system | platform_admin",
  "actor_id":          "<authenticated identity ULID>",
  "actor_tenant_id":   "Telecheck-{country} | null (null only for platform_admin actors)",
  "target_patient_id": "<patient this action affects>",
  "delegate_context":  { "delegate_id": "...", "scope": "..." } | null,
  "action":            "<action from the catalog below>",
  "category":          "A | B | C",
  "audit_sensitivity_level": "standard | high_pii",     // active values; reserved levels added with ADR amendment (added v5.2 per I-031)
  "resource_type":     "<aggregate type>",
  "resource_id":       "<aggregate ID>",
  "detail":            { <action-specific payload> },
  "engine_versions":   { "interaction_engine": "...", "herb_drug_engine": "...", "ai_model": "...", "protocol": "...", "guardrail_template": "...", "knowledge_base": "..." } | null,
  // Workload-taxonomy fields (added v5.2 per ADR-029 / WORKLOAD_TAXONOMY contract).
  // Full enum lists active + reserved values; reserved values are runtime-rejected per source contract until activation audit event recorded.
  // Active at v1.0: conversational_assistant, protocol_execution. Reserved: autonomous_agent, multi_agent_supervisor, tool_using_agent.
  // Sentinel `rejected_invalid_attempt` (v5.2 patch 2026-05-02 per Codex Round-5 Scope 1 MEDIUM) is VALID ONLY in the audit envelope of `*.execution_rejected` events
  //   (`prescribing.execution_rejected`, `refill.execution_rejected`, `medication_order.execution_rejected`); runtime validation MUST reject the sentinel everywhere else
  //   (any successful AIExecution record, any non-rejection action audit). Per AUDIT_EVENTS v5.3 §I-012 closure rule (carries forward v5.2 prose plus P-011 amendment adding prescribing.protocol_authorization_granted) + execution_rejected exception.
  "ai_workload_type":  "conversational_assistant | protocol_execution | autonomous_agent | multi_agent_supervisor | tool_using_agent | rejected_invalid_attempt (only on *.execution_rejected events) | n/a (only on I-012 clinician-only approval audit records where no AI workload was upstream — patch 2026-05-02 per Codex Round-6 Scope 1 MEDIUM-1) | null",
  // Active at v1.0: advisory, suggestion, action_with_confirm. Reserved: action_with_audit_only, fully_autonomous. Sentinel rejected_invalid_attempt — same carve-out as above. n/a — same I-012 clinician-only carve-out as above.
  "autonomy_level":    "advisory | suggestion | action_with_confirm | action_with_audit_only | fully_autonomous | rejected_invalid_attempt (only on *.execution_rejected events) | n/a (only on I-012 clinician-only approval audit records where no AI workload was upstream) | null",
  // Reserved nullable agentic-context fields (added v5.2; populate only when corresponding capability activates per ADR-030/031/032/033/034).
  "agent_id":          "<ULID> | null",
  "agent_version":     "<semver> | null",
  "tool_call_id":      "<ULID> | null",
  "memory_read_set_id":  "<ULID> | null",
  "memory_write_set_id": "<ULID> | null",
  "supervising_policy_id": "<ULID> | null",
  "knowledge_source_versions": [ { "knowledge_base_id": "...", "version": "..." } ] | null,
  "signals":           [ { "signal_id": "...", "severity": "...", "source_engine": "...", "check_class": "..." } ] | null,
  "override":          { "signal_id": "...", "rationale": "...", "clinician_id": "..." } | null,
  "linked_events":     [ "<domain_event_id>" ],
  "compliance_flags":  [ "<flag from catalog>" ],
  "country_of_care":   "<ISO 3166-1 alpha-2>",
  "break_glass":       { "session_id": "...", "reason": "...", "authorized_until": "...", "privacy_officer_review_status": "pending | reviewed" } | null,
  "hash_chain": {
    "partition":       "<partition key = target_patient_id>",
    "sequence_number": "<monotonically increasing within partition>",
    "previous_hash":   "<SHA-256 of previous record in this partition>",
    "record_hash":     "<SHA-256 of this record (all fields except hash_chain)>"
  }
}
```

**Workload-taxonomy nullability + sensitivity rules (added v5.2 per ADR-029 + I-031):**

- `audit_sensitivity_level` is required on every record. Default value `standard`. Records emitted by the research data export pipeline (events listed below in the `research.export_*` family) carry `audit_sensitivity_level = high_pii` per I-031.
- `ai_workload_type` and `autonomy_level` are **required** for new v1.10 AI events where `actor_type = ai_workload`. They are nullable in two cases only: (a) legacy events backfilled from before v1.10 promotion; (b) non-AI events (where `actor_type ≠ ai_workload`).
- **I-012 closure rule (added v5.2 patch 2026-05-02 per Codex Scope 1 HIGH-1 finding; authoritative I-012 action-class set declared 2026-05-02 per Codex Round-9 Scope 1 HIGH-1 finding; v5.3 amendment 2026-05-11 per P-011 / SI-001 closure adds `prescribing.protocol_authorization_granted` and broadens the future-extension carve-out to include `prescribing.*` confirmation actions added by an I-012-amending SI promotion):** For any audit record whose action class is governed by I-012, the fields `ai_workload_type` and `autonomy_level` are **required regardless of `actor_type`**. The **authoritative I-012 action-class set** (this contract is the single source of truth; WORKLOAD_TAXONOMY, AUTONOMY_LEVELS, STATE_MACHINES, and TYPES MUST point here, not redeclare) consists of: `prescribing.initiated`, `prescribing.approved`, `prescribing.declined`, `prescribing.modified`, `prescribing.protocol_authorization_granted` [added at v5.3 under P-011], `refill.approved`, `refill.declined`, `protocol_authorized_prescribing`, `protocol_authorized_refill_renewal`, `protocol_authorized_dispensing_release`, `prescribing.execution_rejected`, `refill.execution_rejected`, `medication_order.execution_rejected`, AND any future medication_request / refill / medication-order action class explicitly added to this list by an I-012-amending ADR, AND any future `prescribing.*` confirmation action explicitly added by an I-012-amending SI promotion (carve-out added at v5.3 under P-011). The previous nullability carve-out for non-AI actors does NOT apply to any item in this set. The legacy `protocol_engine` actor_type, when emitting any I-012 action-class record, MUST be mapped at emission time to `actor_type = ai_workload, ai_workload_type = protocol_execution` (this is the canonical mapping per AI_LAYERING v5.2 §10.2). Clinician-only approval/confirmation records in this set (where no AI workload was upstream) populate the envelope fields per the §clinician-only carve-out using the `n/a` sentinel from WORKLOAD_TAXONOMY + AUTONOMY_LEVELS enums. Schema-driven implementations that retain `protocol_engine` as the literal actor_type for any I-012 action-class record are non-compliant. This closure prevents an I-012 prescription/refill from passing schema validation with null workload/autonomy fields, defeating the §13.7 three-clause evidence requirement.
- **Exception for `*.execution_rejected` events (added v5.2 patch 2026-05-02 per Codex Round-3 Scope 1 MEDIUM-1 finding):** The I-012 closure rule above applies to *successful* execution audit records. For the rejection-audit-event family (`prescribing.execution_rejected`, `refill.execution_rejected`, `medication_order.execution_rejected`), the envelope-level `ai_workload_type` and `autonomy_level` are populated from the **attempted** values in the rejection payload (`attempted_ai_workload_type` and `attempted_autonomy_level`). Specifically: at emit time the validator sets envelope `ai_workload_type = payload.attempted_ai_workload_type` and envelope `autonomy_level = payload.attempted_autonomy_level`; if either attempted value is null/unknown/reserved, the envelope value MUST be set to the literal sentinel string `"rejected_invalid_attempt"` (a reserved enum value added to both WORKLOAD_TAXONOMY and AUTONOMY_LEVELS schema enums for this purpose). This carve-out is necessary because a rejection event captures invalid/null/reserved attempts by definition; without the carve-out, a schema-driven validator applying the I-012 closure rule literally would reject the rejection-audit event itself, recreating the bare-suppression audit gap that the Round-2 MEDIUM-1 patch was designed to close. Mirror in STATE_MACHINES v1.1 ProtocolAuthorizedAction §10.4 and AUTONOMY_LEVELS contract.
- Reserved agentic-context fields (`agent_id`, `agent_version`, `tool_call_id`, `memory_read_set_id`, `memory_write_set_id`, `supervising_policy_id`, `knowledge_source_versions[]`) are nullable across all events. They populate only when the corresponding capability activates (per ADR-030/031/032/033/034 as applicable).
- Schema additive only — no audit migration required; legacy records receive `null` for these fields.

**Enum coverage rule (added v5.2):** The schema enum lists the full set of values defined in the source-of-truth contract (WORKLOAD_TAXONOMY for `ai_workload_type`; AUTONOMY_LEVELS for `autonomy_level`), including reserved values. Values being present in the schema does NOT activate them — runtime validation per the source contract rejects reserved values unless their activation prerequisites are recorded in the audit chain (ADR + activation audit event two-condition AND). This avoids cross-contract enum drift while preserving the runtime gate.

**Actor type addition (added v5.2):** New `actor_type = ai_workload` is the canonical actor type for AI events going forward. Aliases `ai_mode_1` and `ai_mode_2` are preserved for backward-compat (Mode 1 ≡ `actor_type = ai_workload, ai_workload_type = conversational_assistant`; Mode 2 ≡ `actor_type = ai_workload, ai_workload_type = protocol_execution`). New v1.10+ emitters MUST use `actor_type = ai_workload`. Audit retrieval queries that filter by AI workload SHOULD use `ai_workload_type` rather than the actor_type aliases.

**I-012 preservation rule — audit-side enforcement (added v5.2; mirrors Master PRD §13.7 v0.3 normative wording):** The audit envelope MUST support the §13.7 reject-unless three-clause rule. For action records governed by I-012 (prescription, refill, medication-order), the state machine integration MUST emit an audit record only when ALL three of the following are present in the audit chain for that `action_id`:

1. The action's `autonomy_level` field equals `action_with_confirm` (string equality; not membership in a set).
2. An explicit clinician confirmation event (`prescribing.approved` or equivalent) exists in the immutable audit chain prior to the `*.executed` transition, scoped to the same `action_id`.
3. The confirming actor's `actor_id` resolves to a role authorized to sign for the action class under RBAC v1.1 / I-012.

If any of the three conditions is unmet, the state machine rejects the `executed` transition. **No success `*.executed` audit record is emitted.** Reserved autonomy levels (`action_with_audit_only`, `fully_autonomous`) and null/unknown/absent values are explicitly rejected by this rule. Reserved levels can reach `executed` for I-012 actions ONLY when **both** (a) a successor ADR (ADR-030 or later) explicitly supersedes I-012 for the action class in scope, AND (b) an activation audit event recording the supersession is present in the immutable audit chain. ADR approval alone is never sufficient. Future enum values not yet authorized by an ADR-029 successor default to **rejected**.

**Reject-unless rejection audit event (added v5.2 patch 2026-05-02 per Codex Scope 1 MEDIUM-1 finding — closes the bare-suppression audit gap):** When a state machine rejects an I-012 `*.executed` transition under the three-clause rule above, the platform MUST emit an immutable Category A audit event of type `<action_class>.execution_rejected` (e.g., `prescribing.execution_rejected`, `refill.execution_rejected`, `medication_order.execution_rejected`) capturing the attempted action context. **Bare suppression — no audit record at all on rejection — is forbidden per I-003**, mirroring the failed-export discipline used in §5 research events.

Required payload fields on the rejection event:
- `action_id` — the same ULID that the rejected `*.executed` would have carried.
- `action_class` — the I-012 action class (`prescribing`, `refill`, `medication_order`).
- `attempted_actor_id`, `attempted_actor_type`, `attempted_ai_workload_type`, `attempted_autonomy_level` — the actor and workload/autonomy fields the requester proposed (may be the reserved/forbidden values that triggered rejection).
- `violated_clauses` — array of one or more of `autonomy_level_string_equality`, `audit_chain_confirmation_event_missing`, `confirming_actor_rbac_unauthorized`, `reserved_level_without_activation_audit_event`. Captures which clause(s) of the §13.7 three-clause rule were unsatisfied.
- `confirmation_event_state` — present-with-defect / absent / present-but-mismatched-action_id / present-but-mismatched-actor.
- `rbac_role_check_result` — `authorized | unauthorized | role_not_found`.
- `audit_sensitivity_level` — `standard` (the rejection itself is not high_pii unless the action class is high_pii independently).

Like all Category A records, rejection events are tenant-scoped per `tenant_id`, immutable per I-016, hash-chained per I-003, and retained per the standard audit retention policy. They surface to monitoring (reserved-transition probing alarms; integration-bug detection; safety-case validation evidence) and feed incident review per GOVERNANCE_CONTROLS v5.1 §3.

**Source of truth:** Master PRD §13.7 (single normative source of truth for I-012 + autonomy-level interaction). This audit-side rule mirrors the §13.7 normative wording exactly, including the two-condition AND for reserved-level activation.

**Tenant-scope rules (added v5.1):**
- `tenant_id` is the tenant whose data the action affects. Required on every audit record. Null only for platform-scope actions that have no tenant target (e.g., a Platform Admin creating a new tenant — that audit record has `tenant_id` set to the new tenant being created).
- `actor_tenant_id` is the tenant the actor belongs to. For Platform Admin actors operating across tenants, this is null. For Tenant-side actors, this matches `tenant_id` except in the case of a delegate from one tenant acting in another (currently disallowed at launch per ADR-023).
- When `actor_tenant_id != tenant_id`, the action is by definition cross-tenant and MUST carry a non-null `break_glass` block per I-024.
- Audit retrieval by Tenant Admin returns only records where `tenant_id` matches their authorized tenant context.
- Audit retrieval by Platform Admin may span tenants but the retrieval request itself produces a Category B audit record.

---

## Safety classification matrix

### Category A — Safety-critical clinical actions
**Retention:** maximum legal requirement (minimum 10 years). **Access:** clinical safety officer, compliance, named clinician, patient (via self-access). **Alerting:** critical-severity actions trigger real-time monitoring dashboard notifications.

### Category B — Governance and configuration actions
**Retention:** 7 years. **Access:** operator, compliance.

### Category C — Operational and engagement actions
**Retention:** per data-use consent and jurisdiction requirements. **Access:** standard operational access.

---

## Complete action catalog

### Category A — Safety-critical clinical actions

| Action | Actor types | Detail payload |
|---|---|---|
| `prescribing.initiated` | clinician, **ai_workload (ai_workload_type=protocol_execution)** [v1.10+]; legacy alias `ai_mode_2` permitted only for pre-v1.10 backfill records | medication, patient, program_id, **autonomy_level (required for I-012 actions per §I-012 closure rule)**, ai_workload_type |
| `prescribing.approved` | clinician (human signer per I-012 three-clause rule) | medication_request_id, medication, dosing, approval_pathway, interaction_signals[], overrides[], **ai_workload_type, autonomy_level (required for all I-012-scoped approvals per §I-012 closure rule — patch 2026-05-02 per Codex Round-6 Scope 1 MEDIUM-1; for clinician-only approvals where the upstream AI workload was `protocol_execution` at `action_with_confirm`, the envelope inherits the action_id's preceding workload/autonomy values; for purely human-driven approvals with no AI involvement, the fields are populated as `ai_workload_type = "n/a"` and `autonomy_level = "n/a"` — this prevents schema-driven implementations from omitting the fields and recreating the protocol_engine bypass)** |
| `prescribing.declined` | clinician | medication_request_id, reason_code, reason_text, recommended_action, ai_workload_type, autonomy_level |
| `prescribing.modified` | clinician | medication_request_id, original_dose, modified_dose, modification_reason, ai_workload_type, autonomy_level |
| `refill.approved` | clinician, **ai_workload (ai_workload_type=protocol_execution)** [v1.10+]; legacy alias `protocol_engine` permitted only for pre-v1.10 backfill records | refill_id, approval_pathway, clinician_id or protocol_version, interaction_signals[], overrides[], **autonomy_level (required for I-012 actions per §I-012 closure rule)**, ai_workload_type, supervising_policy_id |
| `refill.declined` | clinician, **ai_workload (ai_workload_type=protocol_execution)** [v1.10+]; legacy alias `protocol_engine` permitted only for pre-v1.10 backfill records | refill_id, declined_by, reason_code, reason_text, autonomy_level, ai_workload_type |
| `protocol_authorized_prescribing` | **ai_workload (ai_workload_type=protocol_execution)** [v1.10+]; legacy alias `protocol_engine` permitted only for pre-v1.10 backfill records | medication_request_id, protocol_version, accountable_clinician_id, engine_versions, all_signals[], gate_check_results, **autonomy_level (required for I-012 actions per §I-012 closure rule)**, ai_workload_type, supervising_policy_id |
| `protocol_authorized_refill_renewal` | **ai_workload (ai_workload_type=protocol_execution)** [v1.10+]; legacy alias `protocol_engine` permitted only for pre-v1.10 backfill records | refill_id, protocol_version, accountable_clinician_id, engine_versions, all_signals[], gate_check_results, **autonomy_level (required for I-012 actions per §I-012 closure rule)**, ai_workload_type, supervising_policy_id |
| `protocol_authorized_dispensing_release` | **ai_workload (ai_workload_type=protocol_execution)** [v1.10+]; legacy alias `protocol_engine` permitted only for pre-v1.10 backfill records | pharmacy_order_id, protocol_version, accountable_clinician_id, autonomy_level, ai_workload_type |
| `prescribing.execution_rejected` (added v5.2 patch 2026-05-02) | system (state machine validator) | action_id, action_class=prescribing, attempted_actor_id, attempted_actor_type, attempted_ai_workload_type, attempted_autonomy_level, violated_clauses[], confirmation_event_state, rbac_role_check_result, audit_sensitivity_level=standard. Per §I-012 reject-unless rejection-audit-event rule. |
| `refill.execution_rejected` (added v5.2 patch 2026-05-02) | system (state machine validator) | action_id, action_class=refill, attempted_actor_id, attempted_actor_type, attempted_ai_workload_type, attempted_autonomy_level, violated_clauses[], confirmation_event_state, rbac_role_check_result, audit_sensitivity_level=standard. Per §I-012 reject-unless rejection-audit-event rule. |
| `medication_order.execution_rejected` (added v5.2 patch 2026-05-02) | system (state machine validator) | action_id, action_class=medication_order, attempted_actor_id, attempted_actor_type, attempted_ai_workload_type, attempted_autonomy_level, violated_clauses[], confirmation_event_state, rbac_role_check_result, audit_sensitivity_level=standard. Per §I-012 reject-unless rejection-audit-event rule. |
| `prescribing.protocol_authorization_granted` (added v5.3 under P-011 / SI-001 closure 2026-05-11) | clinician | medication_request_id, protocol_id, protocol_version, consult_id, patient_account_id, accountable_clinician_id, authorization_window_minutes, **ai_workload_type, autonomy_level** (required per §I-012 closure rule; populated as `'n/a'` / `'n/a'` for purely human-driven authorization with no upstream AI advice, OR inherited from upstream `action_id`'s `protocol_execution` / `action_with_confirm` values if upstream AI advice contributed). This is the canonical "or equivalent" I-012 confirmation event referenced by §I-012 preservation rule (line 78); REQUIRED as the clinician-confirmation prerequisite for any subsequent `protocol_authorized_prescribing` success audit on the same `action_id`. Distinct from `prescribing.approved` (which is the clinician-only success route's terminal audit). |
| `medication_request.drafted` (added v5.3 under P-011) | clinician | medication_request_id, patient_account_id, product_catalog_id. Informational (no I-012 enforcement); useful for click-through-rate metrics. |
| `medication_request.submitted_for_review` (added v5.3 under P-011) | clinician | medication_request_id, patient_account_id. Emitted on `draft → pending_interaction_check`. |
| `medication_request.interaction_evaluation_completed` (added v5.3 under P-011) | system (interaction engine) | medication_request_id, interaction_signals_status (one of: clean / caution / safety_hold), interaction_signals[], engine_version, knowledge_base_version. Links engine output to the prescribing record. |
| `medication_request.discontinued` (added v5.3 under P-011) | clinician, patient, system | medication_request_id, discontinued_reason (one of: clinical_decision / adverse_event / patient_request / replaced_by_new_prescription / expired / safety_hold), patient_account_id. |
| `medication_request.superseded` (added v5.3 under P-011) | clinician | old_medication_request_id, new_medication_request_id, patient_account_id, supersession_reason. Paired with the new row's `prescribing.approved` (or `protocol_authorized_prescribing`) emission. |
| `medication_request.expired` (added v5.3 under P-011) | system (scheduled job) | medication_request_id, patient_account_id, expired_at, expires_at_window_end. Not a human action. |
| `interaction_signal_override` | clinician | signal_id, severity, check_class, rationale_text, engine_version |
| `herb_drug_signal_override` | clinician | signal_id, severity, evidence_quality, rationale_text, engine_version |
| `dispensing_release` | pharmacist | pharmacy_order_id, stock_unit, batch_number, release_decision, new_signals_since_approval, fake_med_status |
| `adverse_event_reported` | patient, clinician, pharmacist | adverse_event_id, type, severity, suspected_medications[], reporter_type |
| `adverse_event_investigated` | clinician | adverse_event_id, investigation_findings, correlated_overrides[], correlated_signals[] |
| `adverse_event_regulatory_reported` | system | adverse_event_id, regulatory_authority, report_format, submission_timestamp |
| `emergency_escalation` | ai_mode_1, system | patient_id, escalation_type, escalation_destination, trigger_source |
| `crisis_detection_trigger` | ai_mode_1, system | patient_id, crisis_type, detection_source, response_provided, escalation_destination |
| `safety_hold_activated` | system | patient_id, medication_request_id, reason, bridge_supply_authorized, clinician_notified |
| `safety_hold_resolved` | clinician | patient_id, medication_request_id, resolution_detail |
| `bridge_supply_authorized` | system, clinician | patient_id, medication_request_id, quantity, taper_days, clinician_id |
| `interaction_engine_evaluation` | system | patient_id, trigger, engine_version, knowledge_base_version, signals_produced[], duration_ms |
| `herb_drug_engine_evaluation` | system | patient_id, trigger, engine_version, knowledge_base_version, signals_produced[], duration_ms |
| `ai_mode_2_evaluation` | ai_mode_2 | patient_id, protocol_id, protocol_version, intake_response_id, recommendation, decision_confidence_score, calibration_status, flagged_concerns[], ai_model_version |
| `ai_mode_2_physician_approve` | clinician | evaluation_id, clinician_id |
| `ai_mode_2_physician_modify` | clinician | evaluation_id, clinician_id, modifications[], rationale |
| `ai_mode_2_physician_decline` | clinician | evaluation_id, clinician_id, decline_reason |

### Category B — Governance and configuration actions

| Action | Actor types | Detail payload |
|---|---|---|
| `protocol_activated` | operator + approver | protocol_id, protocol_version, market_code, accountable_clinician_id, activation_scope |
| `protocol_deactivated` | operator + approver | protocol_id, reason, affected_patients_count |
| `guardrail_template_deployed` | operator + approver | template_id, template_version, market_code, test_suite_result |
| `guardrail_template_rolled_back` | operator | template_id, rollback_reason, previous_version_restored |
| `guardrail_template_test_run` | operator | template_id, test_suite_id, pass_count, fail_count, failures[] |
| `moderation_policy_changed` | operator + approver | policy_id, change_type, market_code |
| `market_launch_approved` | country_launch_director | market_code, program_id, gate_statuses{} |
| `market_paused` | gate_owner | market_code, program_id, pause_reason, pausing_gate |
| `market_retired` | country_launch_director | market_code, program_id, retire_reason, sunset_plan |
| `forms_eligibility_logic_edited` | clinical_content_author + approver | form_version_id, changes[], clinical_impact_assessment |
| `forms_approval_governance_edited` | operator + approver | form_version_id, changes[] |
| `knowledge_base_updated` | clinical_pharmacist + approver | engine_type, version_from, version_to, entries_added, entries_modified, severity_changes[] |
| `clinical_exclusion_rule_changed` | clinical_safety_officer + approver | rule_id, change_type, affected_programs[] |
| `dual_control_approval` | approver | action_approved, author_id, approver_id |
| `fake_med_flag_raised` | system | stock_unit, flag_type, confidence_score |
| `fake_med_flag_resolved` | pharmacist | stock_unit, resolution_decision, rationale |
| `config_change_validated` | system | config_object_id, validation_result, constraints_checked[] |
| `incident_opened` | operator | incident_id, severity, affected_services[], patient_impact_estimate |
| `incident_resolved` | operator | incident_id, resolution_detail, root_cause, preventive_actions[] |
| `signal_enforcement_trigger` | system | signal_type, threshold_exceeded, enforcement_action_taken |

#### Research events (added v5.2 per ADR-028)

| Action | Actor types | Detail payload | audit_sensitivity_level |
|---|---|---|---|
| `research.consent_granted` | patient | consent_id, consent_type ("research_data_use"), scope, version_presented, consent_text_version | standard |
| `research.consent_revoked` | patient | consent_id, consent_type ("research_data_use"), scope, revocation_reason, revocation_effective_at, asymmetric_retraction_acknowledgment | standard |

**Audit sensitivity reconciliation (added v5.2 patch 2026-05-02 per Codex Round-10 Scope 3 MEDIUM-1 finding):** Research consent grant/revoke events (`research.consent_granted`, `research.consent_revoked`) carry `audit_sensitivity_level = standard`, NOT `high_pii`. Rationale: consent state itself is not high-PII (it records that a patient gave/revoked permission for a defined scope; the patient identity is already tenant-scope-protected per I-023). The high-PII audit class per I-031 is reserved for **research export events** (`research.export_initiated`, `research.export_completed`) where actual de-identified longitudinal data leaves the platform — that is the data-leakage-risk surface, not the consent record. Access controls: research consent records are tenant-scoped per I-023 + retrievable by the patient (per their own consent records) + Privacy Officer + Research Data Steward (within tenant scope) + Research Ethics Committee Member (read-only oversight, scoped per `per_dsa_review_required`). The Consent slice and any cross-references stating `standard` for these events are correct; previous wording suggesting `high_pii` for consent events was an error.
| `research.dsa_activated` | privacy_officer + approver (dual-control per I-015) | dsa_id, dsa_version, partner_id, partner_name, dsa_validity_from, dsa_validity_to, permitted_data_domains[], k_min_required, ethics_review_body_reference | standard |
| `research.cohort_defined` | operator | cohort_definition_id, cohort_version, dsa_id, dsa_version, inclusion_criteria_artifact_id, exclusion_criteria_artifact_id, requested_data_domains[], k_threshold_target | standard |
| `research.export_initiated` | system, operator | cohort_definition_id, cohort_version, dsa_id, dsa_version, dsa_status_at_export (`active`), permitted_data_domains_at_export[], requester_id, requester_role, requester_partner_id, requested_field_set, k_min_required, k_threshold_target, consent_cohort_snapshot_hash (SHA-256), grant_artifact_id (per TYPES v5.2 `ResearchDataExport.grant_artifact_id`; required at `status=initiated` per OpenAPI v0.2 6-condition initiation guard), grant_artifact_type (`policy_authorization | signers_attestation | <future grant types>` per TYPES v5.2), grant_artifact_validity_to (ISO 8601 grant expiry timestamp at initiation), grant_signer_chain_attestation_hash (SHA-256 hash of multi-party signer chain attested at initiation; re-validated at completion to ensure no signer was rescinded), grant_validation_at_initiated_at (ISO 8601 grant validation timestamp at initiation), export_started_at, status (`initiated`) — **grant artifact fields added v5.2 patch 2026-05-02 per Codex post-merge verify-r3 HIGH-1 finding to align AUDIT_EVENTS with TYPES + OpenAPI + STATE_MACHINES; without these fields the audit chain cannot verify the 6th I-029 condition at completion-time, leaving condition 6 unverifiable from immutable audit history** | **high_pii** (per I-031) |
| `research.export_completed` | system | cohort_definition_id, cohort_version, dsa_id, dsa_version, dsa_status_at_export (`active` if delivery succeeded; `expired`/`suspended`/`retired` if invalidation triggered per I-029), permitted_data_domains_at_export[] (snapshot at completion), requester_id, requester_role, requester_partner_id, exported_field_set, k_threshold_actual, k_min_required, suppressed_cell_count, export_completed_at, export_artifact_hash (null if invalidated), retention_class, consent_cohort_snapshot_hash_initiated, consent_cohort_snapshot_hash_completed (null if invalidation aborted before completion-time check), grant_artifact_id, grant_artifact_validity_to_at_completion, grant_artifact_signer_chain_attestation_at_completion, status (`completed` or `invalidated`), invalidation_reason (null if `status=completed`; one of `dsa_inactive`, `k_anonymity_violation`, `permitted_domain_drift`, `consent_cohort_change`, `consent_revocation_mid_export`, `grant_artifact_invalidated`) — **shared canonical 6-value enum with TYPES.ResearchDataExport.invalidation_reason and STATE_MACHINES v1.1 ResearchExportRequest reject-unless rule; the three contracts MUST stay aligned (patch 2026-05-02 per Codex Round-2 Scope 2 HIGH-1 finding closes prior enum drift; expanded to 6-value 2026-05-02 per Codex Round-12 Scope 3 HIGH-1 + post-merge adversarial review HIGH-1 finding)** | **high_pii** (per I-031) |

**I-029 binding for `research.export_completed` (per I-029 + GOVERNANCE_CONTROLS v5.2 incident discipline; updated v5.2 patch 2026-05-02 per Codex Round-3 Scope 2 HIGH finding to enumerate all OpenAPI/state-machine completion conditions; expanded to 6 conditions 2026-05-02 per Codex Round-12 Scope 3 HIGH-1 + post-merge adversarial review HIGH-1 finding):** Per I-029, the **domain-side delivery** (`research_export.delivered` event + actual export artifact leaving the platform) MUST be rejected if **any of the 6 OpenAPI v0.2 / STATE_MACHINES v1.1 ResearchExportRequest completion conditions** is unmet:

1. `dsa_status_at_export ≠ active` (DSA expired, suspended, or retired during the export window) → `invalidation_reason = dsa_inactive`.
2. `k_threshold_actual < k_min_required` (k-anonymity floor violation) → `invalidation_reason = k_anonymity_violation`.
3. `permitted_data_domains_at_export` differs from the `research.export_initiated` snapshot (CCR drift mid-export) → `invalidation_reason = permitted_domain_drift`.
4. `consent_cohort_snapshot_hash_completed ≠ consent_cohort_snapshot_hash_initiated` (cohort changed mid-export) → `invalidation_reason = consent_cohort_change`.
5. **Per-patient active-consent failure: any contributing patient's `ResearchConsent` is not active at completion-time evaluation** (`consent_type = research_data_use`, `granted_at` non-null, `revoked_at` null all required; mid-export revocation events AND pre-existing stale/invalid consent records both fail this gate) → `invalidation_reason = consent_revocation_mid_export`.
6. **Per-export grant artifact invalidation (added v5.2 patch 2026-05-02 per Codex Round-12 Scope 3 HIGH-1 finding):** the per-export grant artifact (PolicyAuthorization or named-equivalent per CCR_RUNTIME v5.2 + Cockpit research block) MUST exist, MUST be unexpired at completion-time, MUST match the export by ID/hash binding, AND MUST still attest the same multi-party signer chain (ADR-028 v0.4 quad + REC concurrence per `per_dsa_review_required`). Grant expiry, revocation, or signer-chain-attestation invalidation between initiation and completion fails this condition → `invalidation_reason = grant_artifact_invalidated`.

The `invalidation_reason` enum is canonical and shared exactly with TYPES.ResearchDataExport.invalidation_reason and STATE_MACHINES v1.1 ResearchExportRequest reject-unless rule. A schema-driven implementation that consumes any of these three contracts to derive completion behavior MUST observe the same 6-condition gate; a "fallthrough other" bucket is forbidden.

However, the **audit-side completion-attempt** (`research.export_completed` event in the immutable audit chain) is governed by a different rule — bare suppression of the audit record is forbidden per I-003 (audit gap = audit defect).

The two-event audit pattern for failed exports (**MAY → MUST 2026-05-02 per Codex Round-5 Scope 2 HIGH finding** — the prior MAY framing left a permission ambiguity that conflicted with the bare-suppression-forbidden discipline; both events are now mandatory whenever delivery is rejected):

1. `research.export_completed` **MUST** emit with `status = invalidated`, the violated state recorded in payload (e.g., `dsa_status_at_export = expired`, `k_threshold_actual` showing the violation, `grant_artifact_validity_to_at_completion = <expired-timestamp>`, etc.), `invalidation_reason` populated to one of the canonical 6-value enum (`dsa_inactive | k_anonymity_violation | permitted_domain_drift | consent_cohort_change | consent_revocation_mid_export | grant_artifact_invalidated`), and `export_artifact_hash = null` (no artifact was delivered).
2. Concurrent `signal_enforcement_trigger` Category B audit (per existing v5.1 catalog) **MUST** be emitted to capture the enforcement action: artifact destruction, partner notification per DSA terms, engineering review trigger.

This pattern preserves I-003 (audit completeness) while enforcing I-029 (delivery rejection). The `status` field on the export events is the authoritative discriminator: `completed` = delivery succeeded; `invalidated` = delivery rejected, audit captured. Mirror the MUST language in STATE_MACHINES v1.1 ResearchExportRequest reject-unless block and the prohibited-pattern note below.

**I-030 binding (audit-side cross-check):** Audit retrieval surfaces that filter records by `research_consent_status` MUST NOT influence any care-delivery surface response. This is enforced upstream at the application layer per I-030; audit retrieval itself is read-only and serves cohort definition and reconciliation only.

**Research export tenant-scope rule (added v5.2):** Research data export events (the `research.export_*` family above) carry `tenant_id` of the **operating tenant** where consent was collected (e.g., Telecheck-Ghana for Heros Health Ghana DBA patients), even though the research partnership is anchored at the Telecheck parent / platform level per Master PRD §15.3. The DSA reference (`dsa_id`) on the event identifies the parent-level partnership; the tenant scope identifies the data origin. This dual identification supports the §15.3 partnership-level governance model without losing tenant-scoped accountability per I-027. Cohort definitions and de-identified cohort outputs that span multiple tenants emit one audit record per contributing tenant (not a single multi-tenant record), each scoped to that tenant's contribution.

#### Marketing events (added v5.2 per ADR-027)

| Action | Actor types | Detail payload | audit_sensitivity_level |
|---|---|---|---|
| `marketing.surface_rendered` | system | tenant_id, country_of_care, surface_id, surface_type, ccr_marketing_policy_version_id, marketing_copy_version_id, governance_review_reference_id (the §13.2 Governance review process artifact ID for this copy version), governance_review_reviewer_ids[], governance_review_approval_timestamp, governance_review_approval_validity_until (per `marketing_governance_review_cadence_months` per §13.2), rendered_claim_classes[], patient_id (per tenant-isolation), session_id | standard |
| `marketing.surface_drift` | system | tenant_id, country_of_care, surface_id, ccr_marketing_policy_version_id, expected_marketing_copy_version_id, observed_marketing_copy_version_id, drift_type (`copy_version` / `policy_version` / `approval_lapsed`), suspension_action_taken | standard |

**Auto-suspension binding (per Master PRD §13.2):** A `marketing.surface_drift` event MUST be accompanied by an immediate platform action that suspends the affected surface. The surface is re-enabled only after a fresh re-review under the §13.2 Governance review process. The suspension itself is audited as a Category B governance event (`signal_enforcement_trigger` with appropriate `enforcement_action_taken` payload).

#### Identity binding-lifecycle events (added v5.4 per SC6 P-023 SI-010 canonical-content-port landing)

| Action | Actor types | Detail payload | audit_sensitivity_level |
|---|---|---|---|
| `identity.actor_context_bound` | system (invoked by `bind_actor_context()` SECURITY DEFINER procedure on every successful authContextPlugin invocation; actor identity derived from JWT-verified context, not caller-supplied) | actor_account_id, account_tenant_id, role, admin_home_tenant_id (null except for platform_admin actors), session_id, nonce_hash (SHA-256 of the binding nonce; never plaintext), bound_at, expires_at, pg_backend_pid, txid | standard |
| `identity.session_liveness_check_failed` | system (emitted on revoked / missing / expired session check at the authContextPlugin Step 2 fail-closed point per SI-010 R3 HIGH-2 closure 2026-05-15; paired with `throw UnauthenticatedError()` → Fastify error-envelope plugin maps to tenant-blind 401 per I-025) | session_id, account_id (best-effort from JWT; may be null if JWT verify itself failed first), tenant_id_claimed (from JWT; may differ from actor's actual tenant_id if revocation occurred mid-session), failure_reason (`revoked` | `missing` | `expired`), checked_at | standard |
| `identity.actor_context_unbound_rejected` | system (emitted by dependent SECURITY DEFINER procedures when `assert_request_nonce_bound()` raises `actor_context_unbound` or `request_nonce_unbound_or_expired`; defense-in-depth audit-chain entry for failed procedure invocations) | procedure_name (e.g., `record_consult_clinician_decision`, `record_workflow_pointer_swap`, `record_consult_escalation_target_swap`), rejection_code (`actor_context_unbound` | `request_nonce_unbound_or_expired`), nonce_hash (SHA-256 of the GUC value if present; may be null if GUC missing), pg_backend_pid, txid, attempted_at | standard |

**Cross-references for the Identity binding-lifecycle events:**

- **Identity & Authentication Spec v1.0 §3.6** — "Server-side actor context (per SI-010)" — defines the `_session_actor_context` table + `bind_actor_context()` SECURITY DEFINER procedure + `current_actor_*()` helpers + `assert_request_nonce_bound()` + authContextPlugin wiring + GRANT model + cleanup mechanism. Landed in lockstep with this AUDIT_EVENTS v5.4 amendment per the SC6 P-023 SI-010 canonical-content-port commit (2026-05-18).
- **Phase 2 F-3 closure:** the JWT session-liveness check follow-on (deferred 8+ weeks per Phase 2 admin JWT scope cycle) closes as a byproduct of SI-010's authContextPlugin wiring change; `identity.session_liveness_check_failed` is the audit-chain evidence for the fail-closed step.
- **PHI guarantee:** all 3 Identity binding-lifecycle events reference identifiers by ID or hash (`session_id` ULID, `account_id` ULID, `nonce_hash` SHA-256, `pg_backend_pid` numeric, `txid` numeric); never plaintext PHI per the AUDIT_EVENTS Cat B governance discipline.

### Category C — Operational and engagement actions

| Action | Actor types | Detail payload |
|---|---|---|
| `patient_account_created` | patient | patient_id, country_of_registration, registration_method |
| `patient_identity_verified` | system | patient_id, verification_method, verification_result |
| `consent_granted` | patient | consent_id, consent_type, scope, version_presented |
| `consent_revoked` | patient | consent_id, consent_type, scope, revocation_reason |
| `delegation_setup` | patient | delegation_id, delegate_id, relationship, scope[] |
| `delegation_revoked` | patient | delegation_id, revocation_reason |
| `message_sent` | patient, clinician, system | message_id, channel, message_type |
| `consult_booked` | patient | consult_id, consult_type, program_id |
| `consult_started` | clinician | consult_id, clinician_id |
| `consult_completed` | clinician | consult_id, duration_minutes, outcome |
| `consult_converted_to_sync` | patient, clinician | consult_id, conversion_reason, data_preserved |
| `lab_uploaded` | patient | lab_document_id, upload_method, file_type |
| `lab_ai_interpreted` | ai_mode_2 | lab_document_id, interpretation_version, abnormal_values[] |
| `lab_clinician_reviewed` | clinician | lab_document_id, clinician_id, review_outcome |
| `community_post_created` | patient | post_id, content_type |
| `community_post_flagged` | patient, system | post_id, flag_reason, flagger_type |
| `community_moderation_action` | moderator | post_id, action_taken, reason |
| `notification_sent` | system | notification_id, channel, notification_type, delivery_status |
| `payment_processed` | system | payment_id, amount, currency, payment_rail, status |
| `payment_failed` | system | payment_id, failure_reason, retry_scheduled |
| `delivery_status_updated` | system | pharmacy_order_id, status, delivery_partner |
| `rpm_metric_submitted` | patient | rpm_enrollment_id, metric_type, value |
| `rpm_alert_triggered` | system | rpm_enrollment_id, alert_type, threshold_exceeded |
| `ai_mode_1_session_started` | ai_mode_1 | ai_session_id, guardrail_template_version |
| `ai_mode_1_escalation` | ai_mode_1 | ai_session_id, escalation_reason, escalation_destination |
| `refill_reminder_sent` | system | patient_id, medication_request_id, reminder_sequence |
| `login_successful` | patient, clinician, operator | user_id, device_info, ip_hash |
| `login_failed` | system | user_identifier, failure_reason, attempt_count |

---

## Hash chain

### Partitioning

Audit records are partitioned by `target_patient_id`. Each partition is an independent, ordered chain. This means:
- Tamper detection is per-patient — modifying any record in a patient's chain breaks the chain for that patient
- There is no cross-partition serialization bottleneck
- A single patient's audit chain can be verified independently

### Chain construction

For each new audit record in a partition:
1. Compute `record_hash` = SHA-256 of all fields except `hash_chain`
2. Set `previous_hash` = `record_hash` of the most recent existing record in this partition
3. Increment `sequence_number` from the most recent record
4. For the first record in a partition, `previous_hash` = `SHA-256("GENESIS:<patient_id>")`

### Verification

Chain verification runs:
- **On every read** of a patient's audit trail — if a hash gap is detected, the read returns an integrity error and pages on-call
- **Nightly batch** for all active patient partitions — a background job walks each chain and reports any broken links
- **On-demand** for regulatory inquiry or compliance audit

### Cross-partition checkpoint

Every 24 hours, a checkpoint record is emitted that hashes across all active partitions:
```
checkpoint_hash = SHA-256(sorted_concat(latest_record_hash for each active partition))
```
This checkpoint is stored separately and provides a global integrity anchor. If any partition's chain is tampered with, the checkpoint hash will not match.

---

## "No signals" is a positive result

When the interaction engine or herb-drug engine runs and produces zero signals, this is explicitly recorded:

```json
{
  "action": "interaction_engine_evaluation",
  "detail": {
    "signals_produced": [],
    "signal_count": 0,
    "all_checks_passed": true,
    "engine_version": "...",
    "knowledge_base_version": "..."
  }
}
```

The absence of a record is suspicious. The presence of a record with zero signals is a positive safety result. This distinction matters for compliance.

---

## Patient self-access

Patients have the right to view their own audit records (Category A and C). The patient self-access surface shows:

| What patients see | What patients do not see |
|---|---|
| What actions were taken on their account | Override rationale text (clinician-to-clinician) |
| Who took them (actor type; clinician name for clinical actions) | Raw engine signal detail (shown on medication detail page instead) |
| When they occurred | Internal system identifiers beyond what's meaningful |
| For clinical actions: what the outcome was | Category B governance actions (admin operations) |
| Their consent history (grants and revocations) | Other patients' audit records |

Patient self-access is read-only. A patient cannot modify, delete, or dispute audit records through the self-access surface. Disputes are handled through the support channel.

---

## Retention

| Category | Minimum retention | Archive behavior |
|---|---|---|
| A | Maximum of: 10 years, applicable medical records retention law, applicable regulatory requirement | Archived to cold storage after 3 years; retrievable within 72 hours for regulatory inquiry |
| B | 7 years | Archived to cold storage after 2 years |
| C | Per data-use consent and jurisdiction (CCR determines) | Archived per CCR retention_years_engagement |

Records past retention are archived, not deleted. Archived records are retrievable for regulatory inquiry but not surfaced in standard operational views. The hash chain is preserved across archival — archived records remain verifiable.

---

## Anti-patterns

- **Logging audit events to a mutable store.** Audit records go to the append-only audit store. Not to application logs. Not to a database table with UPDATE permissions. I-003.
- **Omitting the "no signals" record.** A missing evaluation record is ambiguous — did the check not run, or did it run with no signals? Always record the evaluation, even when no signals are produced.
- **Collapsing delegate context.** Every delegate action must carry both identities. Auditing "patient did X" when a delegate did X on their behalf is a compliance violation. I-018.
- **Relying on hash chain for ordering.** The hash chain detects tampering. Ordering is determined by `timestamp` and `sequence_number`. They serve different purposes.

- **Omitting `tenant_id` from audit records (added v5.1).** Every record carries `tenant_id`. A null `tenant_id` is reserved for platform-level meta-events with no tenant target; almost every operational audit has a tenant target. I-027.
- **Differentiating cross-tenant access from same-tenant access only via `actor_tenant_id` comparison (added v5.1).** Cross-tenant access requires the `break_glass` block to be populated with reason, time bound, and Privacy Officer review status. The comparison alone is not the audit; the break-glass session is. I-024.
- **Returning audit records to a Tenant Admin that span multiple tenants (added v5.1).** Tenant Admin retrieval is filtered to their authorized tenant scope at the query layer, not just the UI layer. I-023.
- **Emitting an AI audit event with null `ai_workload_type` or `autonomy_level` (added v5.2).** New v1.10+ AI events require both fields populated per WORKLOAD_TAXONOMY §1 nullability rule. Null is reserved for legacy backfill and non-AI events only.
- **Confusing `audit_sensitivity_level` with the safety-classification matrix Categories A/B/C (added v5.2).** They are orthogonal: `audit_sensitivity_level` governs retention/access/query treatment within a category; the A/B/C category governs which retention rule applies. An export event is Category B (governance) AND `audit_sensitivity_level = high_pii` (elevated treatment within Category B).
- **Using the `ai_mode_1` / `ai_mode_2` actor type aliases in new v1.10+ code (added v5.2).** Use `actor_type = ai_workload` with `ai_workload_type` set. Aliases are deprecated for new code (preserved for existing records per I-003).
- **Bare suppression of failed `research.export_completed` (added v5.2; MAY → MUST 2026-05-02 per Codex Round-5 Scope 2 HIGH; enum expanded to 6-value 2026-05-02 per Codex Round-12 Scope 3 HIGH-1 + post-merge adversarial review HIGH-1).** Per I-029 + I-003 audit-completeness, failed exports **MUST** emit `research.export_completed` with `status = invalidated` and `invalidation_reason` populated to one of the canonical 6-value enum (`dsa_inactive | k_anonymity_violation | permitted_domain_drift | consent_cohort_change | consent_revocation_mid_export | grant_artifact_invalidated`), **MUST** be paired with concurrent `signal_enforcement_trigger` Category B audit. Silent invalidation is forbidden; the prior MAY framing is superseded.

---

## Document control

- **v5.2 (2026-05-02 per v1.10.1 hygiene cycle physical merge of v1.10 PRD Update Cycle delta artifact)** — Adds workload-taxonomy envelope fields (`ai_workload_type`, `autonomy_level`) per ADR-029; reserved nullable agentic-context fields (`agent_id`, `agent_version`, `tool_call_id`, `memory_read_set_id`, `memory_write_set_id`, `supervising_policy_id`, `knowledge_source_versions[]`); `audit_sensitivity_level` field with `standard` / `high_pii` enum (`high_pii` for research exports per I-031); new `actor_type = ai_workload` (with `ai_mode_1` / `ai_mode_2` preserved as backward-compat aliases); 6 new research events (`research.consent_granted`, `research.consent_revoked`, `research.dsa_activated`, `research.cohort_defined`, `research.export_initiated`, `research.export_completed`) — the `export_*` family at `audit_sensitivity_level = high_pii` per I-031, carrying `status` enum (`completed | invalidated`) + `invalidation_reason` for failed-completion audit per I-003; 2 new marketing events (`marketing.surface_rendered`, `marketing.surface_drift`) per ADR-027; research-export tenant-scope rule (operating-tenant ID, parent-level DSA reference); I-012 preservation rule mirroring Master PRD §13.7 v0.3 reject-unless three-clause normative wording. Per ADR-027, ADR-028, ADR-029. No existing fields modified or removed; v5.2 is purely additive. Substantive content originally documented in `Telecheck_v1_10_PRD_Update/Phase3_AUDIT_EVENTS_v1_10_Edits_2026-05-01.md`; physical merge applied 2026-05-02 per v1.10.1 hygiene cycle.
- **v5.0** — Initial Audit Events contract.
- **v5.1** — Adds `tenant_id` and `actor_tenant_id` and optional `break_glass` block to the audit envelope per ADR-023 multi-tenancy. Adds tenant-scope rules for retrieval. Adds Anti-patterns specific to multi-tenancy. Adds Platform Admin actor type. Threading remediation per Adversarial Counsel Review v1.0 finding CRITICAL-01. Existing record schema fields preserved; envelope is purely additive.
