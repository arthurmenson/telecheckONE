# 00 · Audit Events

**Status:** canonical · **Version:** 5.1 · **Owner:** engineering lead + compliance officer · **Consumers:** all services, compliance, clinical safety, patient-access

This document defines the audit event schema, complete action catalog, safety classification matrix, hash chain integrity model, and patient self-access rules. Per I-003, audit records are immutable and append-only. No exceptions.

---

## Audit record schema

Every audit event contains:

```
{
  "audit_id":          "aud_<ULID>",
  "timestamp":         "<ISO 8601 with timezone>",
  "tenant_id":         "tnt_<ULID>",
  "actor_type":        "patient | clinician | pharmacist | operator | delegate | protocol_engine | ai_mode_1 | ai_mode_2 | system | platform_admin",
  "actor_id":          "<authenticated identity ULID>",
  "actor_tenant_id":   "tnt_<ULID> | null (null only for platform_admin actors)",
  "target_patient_id": "<patient this action affects>",
  "delegate_context":  { "delegate_id": "...", "scope": "..." } | null,
  "action":            "<action from the catalog below>",
  "category":          "A | B | C",
  "resource_type":     "<aggregate type>",
  "resource_id":       "<aggregate ID>",
  "detail":            { <action-specific payload> },
  "engine_versions":   { "interaction_engine": "...", "herb_drug_engine": "...", "ai_model": "...", "protocol": "...", "guardrail_template": "...", "knowledge_base": "..." } | null,
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

---

## Document control

- **v5.0** — Initial Audit Events contract.
- **v5.1** — Adds `tenant_id` and `actor_tenant_id` and optional `break_glass` block to the audit envelope per ADR-023 multi-tenancy. Adds tenant-scope rules for retrieval. Adds Anti-patterns specific to multi-tenancy. Adds Platform Admin actor type. Threading remediation per Adversarial Counsel Review v1.0 finding CRITICAL-01. Existing record schema fields preserved; envelope is purely additive.
