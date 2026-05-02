# 00 · Audit Events

**Status:** canonical · **Version:** 5.2 · **Owner:** engineering lead + compliance officer · **Consumers:** all services, compliance, clinical safety, patient-access

This document defines the audit event schema, complete action catalog, safety classification matrix, hash chain integrity model, and patient self-access rules. Per I-003, audit records are immutable and append-only. No exceptions.

---

## Audit record schema

Every audit event contains:

```
{
  "audit_id":          "aud_<ULID>",
  "timestamp":         "<ISO 8601 with timezone>",
  "tenant_id":         "tnt_<ULID>",
  "actor_type":        "patient | clinician | pharmacist | operator | delegate | protocol_engine | ai_workload | ai_mode_1 | ai_mode_2 | system | platform_admin",
  "actor_id":          "<authenticated identity ULID>",
  "actor_tenant_id":   "tnt_<ULID> | null (null only for platform_admin actors)",
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
  "ai_workload_type":  "conversational_assistant | protocol_execution | autonomous_agent | multi_agent_supervisor | tool_using_agent | null",
  // Active at v1.0: advisory, suggestion, action_with_confirm. Reserved: action_with_audit_only, fully_autonomous.
  "autonomy_level":    "advisory | suggestion | action_with_confirm | action_with_audit_only | fully_autonomous | null",
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
- Reserved agentic-context fields (`agent_id`, `agent_version`, `tool_call_id`, `memory_read_set_id`, `memory_write_set_id`, `supervising_policy_id`, `knowledge_source_versions[]`) are nullable across all events. They populate only when the corresponding capability activates (per ADR-030/031/032/033/034 as applicable).
- Schema additive only — no audit migration required; legacy records receive `null` for these fields.

**Enum coverage rule (added v5.2):** The schema enum lists the full set of values defined in the source-of-truth contract (WORKLOAD_TAXONOMY for `ai_workload_type`; AUTONOMY_LEVELS for `autonomy_level`), including reserved values. Values being present in the schema does NOT activate them — runtime validation per the source contract rejects reserved values unless their activation prerequisites are recorded in the audit chain (ADR + activation audit event two-condition AND). This avoids cross-contract enum drift while preserving the runtime gate.

**Actor type addition (added v5.2):** New `actor_type = ai_workload` is the canonical actor type for AI events going forward. Aliases `ai_mode_1` and `ai_mode_2` are preserved for backward-compat (Mode 1 ≡ `actor_type = ai_workload, ai_workload_type = conversational_assistant`; Mode 2 ≡ `actor_type = ai_workload, ai_workload_type = protocol_execution`). New v1.10+ emitters MUST use `actor_type = ai_workload`. Audit retrieval queries that filter by AI workload SHOULD use `ai_workload_type` rather than the actor_type aliases.

**I-012 preservation rule — audit-side enforcement (added v5.2; mirrors Master PRD §13.7 v0.3 normative wording):** The audit envelope MUST support the §13.7 reject-unless three-clause rule. For action records governed by I-012 (prescription, refill, medication-order), the state machine integration MUST emit an audit record only when ALL three of the following are present in the audit chain for that `action_id`:

1. The action's `autonomy_level` field equals `action_with_confirm` (string equality; not membership in a set).
2. An explicit clinician confirmation event (`prescribing.approved` or equivalent) exists in the immutable audit chain prior to the `*.executed` transition, scoped to the same `action_id`.
3. The confirming actor's `actor_id` resolves to a role authorized to sign for the action class under RBAC v1.1 / I-012.

If any of the three conditions is unmet, the state machine rejects the `executed` transition before any audit record is emitted. Reserved autonomy levels (`action_with_audit_only`, `fully_autonomous`) and null/unknown/absent values are explicitly rejected by this rule. Reserved levels can reach `executed` for I-012 actions ONLY when **both** (a) a successor ADR (ADR-030 or later) explicitly supersedes I-012 for the action class in scope, AND (b) an activation audit event recording the supersession is present in the immutable audit chain. ADR approval alone is never sufficient. Future enum values not yet authorized by an ADR-029 successor default to **rejected**.

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
| `prescribing.initiated` | clinician, ai_mode_2 | medication, patient, program_id |
| `prescribing.approved` | clinician | medication_request_id, medication, dosing, approval_pathway, interaction_signals[], overrides[] |
| `prescribing.declined` | clinician | medication_request_id, reason_code, reason_text, recommended_action |
| `prescribing.modified` | clinician | medication_request_id, original_dose, modified_dose, modification_reason |
| `refill.approved` | clinician, protocol_engine | refill_id, approval_pathway, clinician_id or protocol_version, interaction_signals[], overrides[] |
| `refill.declined` | clinician, protocol_engine | refill_id, declined_by, reason_code, reason_text |
| `protocol_authorized_prescribing` | protocol_engine | medication_request_id, protocol_version, accountable_clinician_id, engine_versions, all_signals[], gate_check_results |
| `protocol_authorized_refill_renewal` | protocol_engine | refill_id, protocol_version, accountable_clinician_id, engine_versions, all_signals[], gate_check_results |
| `protocol_authorized_dispensing_release` | protocol_engine | pharmacy_order_id, protocol_version, accountable_clinician_id |
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
| `research.dsa_activated` | privacy_officer + approver (dual-control per I-015) | dsa_id, dsa_version, partner_id, partner_name, dsa_validity_from, dsa_validity_to, permitted_data_domains[], k_min_required, ethics_review_body_reference | standard |
| `research.cohort_defined` | operator | cohort_definition_id, cohort_version, dsa_id, dsa_version, inclusion_criteria_artifact_id, exclusion_criteria_artifact_id, requested_data_domains[], k_threshold_target | standard |
| `research.export_initiated` | system, operator | cohort_definition_id, cohort_version, dsa_id, dsa_version, dsa_status_at_export (`active`), permitted_data_domains_at_export[], requester_id, requester_role, requester_partner_id, requested_field_set, k_min_required, k_threshold_target, consent_cohort_snapshot_hash (SHA-256), export_started_at, status (`initiated`) | **high_pii** (per I-031) |
| `research.export_completed` | system | cohort_definition_id, cohort_version, dsa_id, dsa_version, dsa_status_at_export (`active` if delivery succeeded; `expired`/`suspended`/`retired` if invalidation triggered per I-029), permitted_data_domains_at_export[] (snapshot at completion), requester_id, requester_role, requester_partner_id, exported_field_set, k_threshold_actual, k_min_required, suppressed_cell_count, export_completed_at, export_artifact_hash (null if invalidated), retention_class, consent_cohort_snapshot_hash, status (`completed` or `invalidated`), invalidation_reason (null if `status=completed`; one of `dsa_status_change`, `k_threshold_violation`, `permitted_domain_drift`, `consent_revocation_mid_export`, `other`) | **high_pii** (per I-031) |

**I-029 binding for `research.export_completed` (per I-029 + GOVERNANCE_CONTROLS v5.2 incident discipline):** Per I-029, the **domain-side delivery** (`research_export.delivered` event + actual export artifact leaving the platform) MUST be rejected if any I-029 condition is unmet (DSA inactive, k-anonymity below k_min_required, permitted-domain drift, consent-cohort change). However, the **audit-side completion-attempt** (`research.export_completed` event in the immutable audit chain) is governed by a different rule — bare suppression of the audit record is forbidden per I-003 (audit gap = audit defect).

The two-event audit pattern for failed exports:

1. `research.export_completed` MAY emit with `status = invalidated`, the violated state recorded in payload (e.g., `dsa_status_at_export = expired`, `k_threshold_actual` showing the violation, etc.), `invalidation_reason` populated, and `export_artifact_hash = null` (no artifact was delivered).
2. Concurrent `signal_enforcement_trigger` Category B audit (per existing v5.1 catalog) captures the enforcement action: artifact destruction, partner notification per DSA terms, engineering review trigger.

This pattern preserves I-003 (audit completeness) while enforcing I-029 (delivery rejection). The `status` field on the export events is the authoritative discriminator: `completed` = delivery succeeded; `invalidated` = delivery rejected, audit captured.

**I-030 binding (audit-side cross-check):** Audit retrieval surfaces that filter records by `research_consent_status` MUST NOT influence any care-delivery surface response. This is enforced upstream at the application layer per I-030; audit retrieval itself is read-only and serves cohort definition and reconciliation only.

**Research export tenant-scope rule (added v5.2):** Research data export events (the `research.export_*` family above) carry `tenant_id` of the **operating tenant** where consent was collected (e.g., Telecheck-Ghana for Heros Health Ghana DBA patients), even though the research partnership is anchored at the Telecheck parent / platform level per Master PRD §15.3. The DSA reference (`dsa_id`) on the event identifies the parent-level partnership; the tenant scope identifies the data origin. This dual identification supports the §15.3 partnership-level governance model without losing tenant-scoped accountability per I-027. Cohort definitions and de-identified cohort outputs that span multiple tenants emit one audit record per contributing tenant (not a single multi-tenant record), each scoped to that tenant's contribution.

#### Marketing events (added v5.2 per ADR-027)

| Action | Actor types | Detail payload | audit_sensitivity_level |
|---|---|---|---|
| `marketing.surface_rendered` | system | tenant_id, country_of_care, surface_id, surface_type, ccr_marketing_policy_version_id, marketing_copy_version_id, governance_review_reference_id (the §13.2 Governance review process artifact ID for this copy version), governance_review_reviewer_ids[], governance_review_approval_timestamp, governance_review_approval_validity_until (per `marketing_governance_review_cadence_months` per §13.2), rendered_claim_classes[], patient_id (per tenant-isolation), session_id | standard |
| `marketing.surface_drift` | system | tenant_id, country_of_care, surface_id, ccr_marketing_policy_version_id, expected_marketing_copy_version_id, observed_marketing_copy_version_id, drift_type (`copy_version` / `policy_version` / `approval_lapsed`), suspension_action_taken | standard |

**Auto-suspension binding (per Master PRD §13.2):** A `marketing.surface_drift` event MUST be accompanied by an immediate platform action that suspends the affected surface. The surface is re-enabled only after a fresh re-review under the §13.2 Governance review process. The suspension itself is audited as a Category B governance event (`signal_enforcement_trigger` with appropriate `enforcement_action_taken` payload).

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
- **Bare suppression of failed `research.export_completed` (added v5.2).** Per I-029 + I-003 audit-completeness, failed exports MAY emit `research.export_completed` with `status = invalidated` plus concurrent `signal_enforcement_trigger`. Silent invalidation is forbidden.

---

## Document control

- **v5.2 (2026-05-02 per v1.10.1 hygiene cycle physical merge of v1.10 PRD Update Cycle delta artifact)** — Adds workload-taxonomy envelope fields (`ai_workload_type`, `autonomy_level`) per ADR-029; reserved nullable agentic-context fields (`agent_id`, `agent_version`, `tool_call_id`, `memory_read_set_id`, `memory_write_set_id`, `supervising_policy_id`, `knowledge_source_versions[]`); `audit_sensitivity_level` field with `standard` / `high_pii` enum (`high_pii` for research exports per I-031); new `actor_type = ai_workload` (with `ai_mode_1` / `ai_mode_2` preserved as backward-compat aliases); 6 new research events (`research.consent_granted`, `research.consent_revoked`, `research.dsa_activated`, `research.cohort_defined`, `research.export_initiated`, `research.export_completed`) — the `export_*` family at `audit_sensitivity_level = high_pii` per I-031, carrying `status` enum (`completed | invalidated`) + `invalidation_reason` for failed-completion audit per I-003; 2 new marketing events (`marketing.surface_rendered`, `marketing.surface_drift`) per ADR-027; research-export tenant-scope rule (operating-tenant ID, parent-level DSA reference); I-012 preservation rule mirroring Master PRD §13.7 v0.3 reject-unless three-clause normative wording. Per ADR-027, ADR-028, ADR-029. No existing fields modified or removed; v5.2 is purely additive. Substantive content originally documented in `Telecheck_v1_10_PRD_Update/Phase3_AUDIT_EVENTS_v1_10_Edits_2026-05-01.md`; physical merge applied 2026-05-02 per v1.10.1 hygiene cycle.
- **v5.0** — Initial Audit Events contract.
- **v5.1** — Adds `tenant_id` and `actor_tenant_id` and optional `break_glass` block to the audit envelope per ADR-023 multi-tenancy. Adds tenant-scope rules for retrieval. Adds Anti-patterns specific to multi-tenancy. Adds Platform Admin actor type. Threading remediation per Adversarial Counsel Review v1.0 finding CRITICAL-01. Existing record schema fields preserved; envelope is purely additive.
