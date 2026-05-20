# 00 · Domain Events

**Status:** canonical · **Version:** 5.3 · **Owner:** engineering lead · **Consumers:** all backend services, event consumers, observability

**v5.3 hygiene cycle 2026-05-20 (P-027 Phase B):** 6 new consent domain events added per Sprint 14 §3 SD1 same-tx outbox pattern: `ConsentGrantedDomainEvent` (none → granted); `ConsentRevokedDomainEvent` (granted → revoked); `ConsentScopeAmendedDomainEvent` (granted → scope_amended); `DelegationGrantedDomainEvent`; `DelegationRevokedDomainEvent`; `ConsentExpiredDomainEvent` (auto-transition at expires_at). Subscribers per Sprint 14 §3 SD6: ai-service-mode1, ai-service-mode2, forms-engine, research-pipeline. Full subscriber-registration + delivery-ledger semantics in `Telecheck_Contracts_Pack_v5_2_to_v5_3_Amendment.md` §4. v1.10.1 hygiene-cycle pattern preserved (filename stable; header bumps).

**v5.2 amendment (2026-05-11 under P-011 / SI-001 closure; no version bump — additive enum extension only, no normative-rule change):** 4 net-new tenant-scoped event types added: `medication_request.discontinued`, `medication_request.superseded`, `medication_request.expired`, `medication_request.interaction_safety_hold_triggered`. The existing canonical `medication_request.approved.v1` event is REUSED for the activation handoff in BOTH execution routes (`clinician_approve` AND `protocol_authorized_prescribing`) — its `approval_pathway: "clinician_reviewed | protocol_authorized"` field discriminates the route; no new event needed for activation.

This document defines the domain event envelope, naming conventions, payload schemas for key events, aggregate catalog, ordering guarantees, and consumer contracts. Per I-016, domain events are immutable once emitted. Corrections are compensating events.

---

## Event envelope

Every domain event contains:

```
{
  "event_id":        "<ULID>",
  "event_type":      "<aggregate>.<action>.<version>",
  "aggregate_type":  "<canonical aggregate name per Glossary>",
  "aggregate_id":    "<aggregate instance ID>",
  "tenant_id":       "Telecheck-{country}",                       // operating-tenant identifier per CDM v1.2 §4.1 + Master PRD v1.10 §17 (e.g., 'Telecheck-US', 'Telecheck-Ghana'); NOT a ULID
  "partition_key":   "<aggregate_id by default; patient_id for cross-aggregate projections>",
  "timestamp":       "<ISO 8601 UTC>",
  "actor":           { "type": "patient | clinician | pharmacist | operator | delegate | protocol_engine | ai_mode_1 | ai_mode_2 | system | platform_admin", "id": "<ULID>", "tenant_id": "Telecheck-{country} | null" },
  "delegate_context": { "delegate_id": "<ULID>", "patient_id": "<ULID>", "scope": "<scope>" } | null,
  "payload":         { <event-specific data — see schemas below> },
  "metadata": {
    "correlation_id":  "<request correlation ID — shared across all events from one user action>",
    "causation_id":    "<event_id of the event that caused this event>",
    "audit_id":        "<linked audit record ID>",
    "schema_version":  "<payload schema version, e.g. 1>"
  }
}
```

**Tenant-scope rules (added v5.1):**
- `tenant_id` is required on every event; it identifies the tenant whose data the event affects.
- `actor.tenant_id` identifies the tenant the actor belongs to. For Platform Admin actors, this is null. When `actor.tenant_id != tenant_id`, the action is cross-tenant and a corresponding audit record with break-glass context must exist.
- Events are not delivered to consumers outside their `tenant_id` scope by default. Consumers that need cross-tenant aggregation (e.g., platform-wide metrics) explicitly opt in to multi-tenant streams; default behavior is single-tenant filtering.
- `partition_key` for tenant-scoped aggregates is composite (`tenant_id:aggregate_id`) at the streaming layer to ensure single-tenant ordering and prevent accidental cross-tenant fan-out.

---

## Naming convention

`<aggregate>.<action>.<version>`

- Aggregate: canonical name from Glossary (e.g., `refill`, `medication_request`, `intake_response`)
- Action: past-tense verb (e.g., `initiated`, `approved`, `declined`, `fulfilled`)
- Version: schema version (e.g., `v1`)

Examples: `refill.initiated.v1`, `medication_request.approved.v1`, `interaction_signal.produced.v1`, `ai_session.crisis_detected.v1`

---

## Ordering guarantees

- Events within a single aggregate (same `aggregate_id`) are strictly ordered by `timestamp`
- Events across different aggregates have no ordering guarantee
- The `causation_id` field creates a causal chain — if event B was caused by event A, `B.metadata.causation_id = A.event_id`
- Consumers that need cross-aggregate ordering use derived projection streams, not raw event ordering

---

## Key event payload schemas

### refill.initiated.v1

```json
{
  "refill_id":          "rfl_<ULID>",
  "patient_id":         "pat_<ULID>",
  "medication_request_id": "mrx_<ULID>",
  "medication":         { "code": "...", "name": "...", "strength": "...", "formulation": "..." },
  "initiation_source":  "medication_detail | pharmacy_tab | ai_mode_1",
  "pre_auth_window":    { "start": "<ISO 8601>", "end": "<ISO 8601>" },
  "delivery_preference": "delivery | pickup"
}
```

### refill.approved.v1

```json
{
  "refill_id":          "rfl_<ULID>",
  "approval_pathway":   "clinician_reviewed | protocol_authorized",
  "clinician_id":       "cli_<ULID>" | null,
  "protocol_version":   "<version>" | null,
  "accountable_clinician_id": "cli_<ULID>",
  "interaction_signals": [ { "signal_id": "sig_<ULID>", "severity": "...", "check_class": "..." } ],
  "overrides":          [ { "signal_id": "sig_<ULID>", "rationale": "..." } ],
  "modification":       { "original_dose": "...", "modified_dose": "...", "reason": "..." } | null
}
```

### refill.declined.v1

```json
{
  "refill_id":          "rfl_<ULID>",
  "declined_by":        "clinician | protocol_engine | eligibility_check",
  "clinician_id":       "cli_<ULID>" | null,
  "reason_code":        "interaction_critical | eligibility_expired | monitoring_stale | clinical_judgment",
  "reason_text":        "<human-readable reason>",
  "recommended_action": "book_consult | upload_labs | contact_care_team"
}
```

### interaction_signal.produced.v1

```json
{
  "signal_id":          "sig_<ULID>",
  "patient_id":         "pat_<ULID>",
  "trigger":            "prescribing | refill | medication_change | lab_update | protocol_evaluation",
  "trigger_id":         "<ULID of triggering aggregate>",
  "check_class":        "drug_drug | drug_condition | drug_lab | pharmacogenomic | special_clinical",
  "severity":           "critical | major | moderate | minor",
  "mechanism":          "<description>",
  "evidence_source":    "<knowledge base entry ref>",
  "recommended_action": "block | warn | monitor",
  "affected_entities":  [ { "type": "medication | condition | lab", "id": "...", "name": "..." } ],
  "confidence":         "high | medium | low",
  "source_engine":      "medication",
  "engine_version":     "<version>",
  "knowledge_base_version": "<version>"
}
```

### herb_drug_signal.produced.v1

Same as `interaction_signal.produced.v1` with:
- `source_engine`: `"herb_drug"`
- Additional field: `"evidence_quality": "established | emerging | theoretical"`
- `check_class` values: `"herb_drug_pharmacokinetic | herb_drug_pharmacodynamic | herb_condition"`

### medication_request.approved.v1

```json
{
  "medication_request_id": "mrx_<ULID>",
  "patient_id":         "pat_<ULID>",
  "prescriber_id":      "cli_<ULID>",
  "approval_pathway":   "clinician_reviewed | protocol_authorized",
  "medication":         { "code": "...", "name": "...", "strength": "...", "formulation": "..." },
  "dosing":             { "instructions": "...", "frequency": "...", "quantity": "..." },
  "interaction_signals": [ { "signal_id": "sig_<ULID>", "severity": "..." } ],
  "overrides":          [ { "signal_id": "sig_<ULID>", "rationale": "..." } ],
  "pre_auth_window":    { "months": 3 | 6 }
}
```

**Reuse note (added 2026-05-11 under P-011 / SI-001 closure):** This event is emitted for BOTH `pending_clinician_review → active` execution routes per State Machines v1.2 §19 — `clinician_approve` (with `approval_pathway = "clinician_reviewed"`) and `protocol_authorized_prescribing` (with `approval_pathway = "protocol_authorized"`). No parallel `medication_request.activated` event exists; subscribers (Subscription, Notification, Adverse Events) consume this single event and branch on `approval_pathway` when route-specific behavior is required. `partition_key = tenant_id:medication_request_id` (tenant-scoped per the canonical partition-key composition rule).

### medication_request.discontinued.v1 (added 2026-05-11 under P-011 / SI-001 closure)

```json
{
  "medication_request_id":  "mrx_<ULID>",
  "patient_id":             "pat_<ULID>",
  "discontinued_reason":    "clinical_decision | adverse_event | patient_request | replaced_by_new_prescription | expired | safety_hold",
  "discontinued_at":        "<ISO 8601>",
  "discontinued_by_actor":  { "actor_type": "clinician | patient | system", "actor_id": "<ULID>" }
}
```

`partition_key = tenant_id:medication_request_id`. Subscribers: Subscription (cancels binding); Notification (patient + clinician notifications); Adverse Events (subscribes for discontinuation triggered by adverse-event reports).

### medication_request.superseded.v1 (added 2026-05-11 under P-011 / SI-001 closure)

```json
{
  "old_medication_request_id": "mrx_<ULID>",
  "new_medication_request_id": "mrx_<ULID>",
  "patient_id":                "pat_<ULID>",
  "supersession_reason":       "...",
  "superseded_at":             "<ISO 8601>"
}
```

`partition_key = tenant_id:old_medication_request_id`. Subscribers: Subscription (rebinds to new prescription); Notification (informs patient + clinician of supersession).

### medication_request.expired.v1 (added 2026-05-11 under P-011 / SI-001 closure)

```json
{
  "medication_request_id":  "mrx_<ULID>",
  "patient_id":             "pat_<ULID>",
  "expired_at":             "<ISO 8601>",
  "expires_at_window_end":  "<ISO 8601>"
}
```

`partition_key = tenant_id:medication_request_id`. Subscribers: Subscription (terminates binding); Notification (informs patient + clinician of expiry; prompts renewal flow if applicable). Emitted by a scheduled job; not a human action.

### medication_request.interaction_safety_hold_triggered.v1 (added 2026-05-11 under P-011 / SI-001 closure)

```json
{
  "medication_request_id":      "mrx_<ULID>",
  "patient_id":                 "pat_<ULID>",
  "prescriber_id":              "cli_<ULID>",
  "interaction_signals":        [ { "signal_id": "sig_<ULID>", "severity": "...", "check_class": "..." } ],
  "interaction_signals_status": "safety_hold",
  "engine_version":             "<semver>",
  "knowledge_base_version":     "<semver>",
  "triggered_at":               "<ISO 8601>"
}
```

`partition_key = tenant_id:medication_request_id`. Subscribers: Med Interaction Engine (closes the override loop via its own override workflow + override table — clean module-boundary separation per ADR-001 Path 1); Notification (clinician alert). This event is the MedicationRequest → Med Interaction Engine integration mechanism in lieu of an `interaction_override_id` FK column on the MedicationRequest row.

### pharmacy_order.released.v1

```json
{
  "pharmacy_order_id":  "pha_<ULID>",
  "release_type":       "pharmacist_reviewed | protocol_authorized_dispensing",
  "pharmacist_id":      "usr_<ULID>" | null,
  "stock_unit":         { "batch_number": "...", "expiry": "<ISO 8601>", "manufacturer": "..." },
  "fake_med_status":    "clear | flagged_advisory | not_checked",
  "new_signals_since_approval": true | false,
  "delivery_method":    "delivery | pickup"
}
```

### consent.revoked.v1

```json
{
  "consent_id":         "con_<ULID>",
  "patient_id":         "pat_<ULID>",
  "consent_type":       "platform | care | data_use | episode | delegation | jurisdictional",
  "scope":              "<what was consented to>",
  "program_id":         "<program>" | null,
  "revocation_reason":  "<patient-provided reason>" | null,
  "bridge_supply_triggered": true | false,
  "affected_medications": [ { "medication_request_id": "mrx_<ULID>", "abrupt_discontinuation_risk": true | false } ]
}
```

### ai_session.crisis_detected.v1

```json
{
  "ai_session_id":      "ais_<ULID>",
  "patient_id":         "pat_<ULID>",
  "crisis_type":        "suicidal_ideation | self_harm | abuse_disclosure | medical_emergency",
  "detection_source":   "ai_mode_1 | community | forms | messaging",
  "guardrail_template_version": "<version>",
  "response_provided":  "<crisis response text>",
  "escalation_destination": "emergency_services | crisis_helpline | care_team",
  "ai_model_version":   "<version>"
}
```

### safety_hold.activated.v1

```json
{
  "patient_id":         "pat_<ULID>",
  "medication_request_id": "mrx_<ULID>",
  "reason":             "consent_revocation | adverse_event | clinical_hold",
  "bridge_supply":      { "authorized": true, "quantity": "...", "taper_days": 14 } | null,
  "clinician_notified": "cli_<ULID>",
  "notification_timestamp": "<ISO 8601>"
}
```

---

## Research domain events (added v5.2 per ADR-028)

| Event name | Producer | Subscribers | Payload (key fields) | Notes |
|---|---|---|---|---|
| `research_consent.granted` | Consent module (5th-tier consent grant per Master PRD §15.2) | Audit pipeline (emits `research.consent_granted` per AUDIT_EVENTS v5.2 §5); Cohort definition module (eligible-patient-set update); Notifications module (no patient-facing notification; internal only) | consent_id, tenant_id, patient_id, **consent_type** (`research_data_use`), **scope**, **version_presented** (consent text version per CCR `research_ethics_review_body.approval_reference_id`), granted_at | Per I-016 immutable. Per I-030 MUST NOT cascade to any care-delivery event subscriber. Payload mirrors AUDIT_EVENTS v5.2 §5 `research.consent_granted` event fields. |
| `research_consent.revoked` | Consent module | Audit pipeline (`research.consent_revoked`); Cohort definition module (eligible-patient-set update — patient excluded from future cohorts; already-shared aggregate data not retracted per §15.2 asymmetry); Export pipeline (suspend any in-flight cohort that depends on this patient) | consent_id, tenant_id, patient_id, **consent_type** (`research_data_use`), **scope**, **version_presented**, revocation_reason, revoked_at, revocation_effective_at, **asymmetric_retraction_acknowledgment** (boolean — patient has acknowledged that aggregate data already shared cannot be retracted per §15.2) | Per I-016 immutable. Per I-030 MUST NOT cascade to any care-delivery event subscriber. Payload mirrors AUDIT_EVENTS v5.2 §5 `research.consent_revoked` event fields. |
| `research_export.requested` | Operator surface (cohort definition layer) | Audit pipeline (`research.export_initiated` per AUDIT_EVENTS v5.2 §5); Export pipeline (begins de-identification + k-anonymity computation) | export_id, tenant_id, country_of_care, cohort_definition_id, cohort_version, dsa_id, dsa_version, dsa_status_at_export, permitted_data_domains_at_export, requester_id, requester_role, requester_partner_id, requested_field_set, k_min_required, k_threshold_target, consent_cohort_snapshot_hash, grant_artifact_id, grant_artifact_type, grant_artifact_validity_to, grant_signer_chain_attestation_hash, grant_validation_at_initiated_at, requested_at | Per I-016 immutable. Audit at `audit_sensitivity_level: high_pii` per I-031. **Grant artifact fields added v5.2 patch 2026-05-02 per Codex post-merge verify-r3 HIGH-1 finding aligning DOMAIN_EVENTS payload with AUDIT_EVENTS `research.export_initiated` + TYPES `ResearchDataExport.grant_artifact_*` + OpenAPI v0.2 6-condition initiation guard.** |
| `research_export.delivered` | Export pipeline (6-condition I-029 gate verified per AUDIT_EVENTS v5.2 / TYPES v5.2 / STATE_MACHINES v1.1 / OpenAPI v0.2 / GOVERNANCE_CONTROLS v5.2: DSA active + k-anonymity verified + permitted-domain match + consent_cohort_snapshot_hash match + every contributing patient active ResearchConsent + per-export grant artifact unexpired/ID-hash-matched/signer-chain-attesting) | Audit pipeline (`research.export_completed` per AUDIT_EVENTS v5.2 §5); Notifications module (partner notification per DSA terms); Retention scheduler (export artifact retention class) | export_id, tenant_id, country_of_care, cohort_definition_id, cohort_version, dsa_id, dsa_version, dsa_status_at_export, permitted_data_domains_at_export, requester_id, requester_role, requester_partner_id, exported_field_set, k_threshold_actual (≥ k_min per I-029), k_min_required, suppressed_cell_count, consent_cohort_snapshot_hash, grant_artifact_id, grant_artifact_validity_to_at_completion, grant_artifact_signer_chain_attestation_at_completion, export_artifact_hash, retention_class, delivered_at | Per I-016 immutable. Per I-029 invariant binding: any of the 6 conditions unmet → **the domain event `research_export.delivered` is NOT emitted** (delivery did not occur). Distinct from the audit-side `research.export_completed` event (AUDIT_EVENTS v5.2 §5), which **MUST** emit with `status = invalidated` and `invalidation_reason` populated to record the attempted-and-failed completion per the audit-path discipline in GOVERNANCE_CONTROLS v5.2 §7.2 (MAY → MUST 2026-05-02 per Codex Round-6 Scope 2 HIGH-2 finding aligning with AUDIT_EVENTS / GOVERNANCE_CONTROLS; expanded to 6-condition 2026-05-02 per Codex Round-12 Scope 3 HIGH-1 + post-merge adversarial review HIGH-1). The paired `signal_enforcement_trigger` Category B audit MUST also be emitted on rejection. Audit at `audit_sensitivity_level: high_pii` per I-031. |

---

## Marketing domain events (added v5.2 per ADR-027)

| Event name | Producer | Subscribers | Payload (key fields) | Notes |
|---|---|---|---|---|
| `marketing.surface_published` | Marketing copy governance review (status `approved` reached per §13.2) | Audit pipeline; Marketing surface rendering services; CCR cache invalidation | marketing_copy_id, tenant_id, country_of_care, version, classification, governance_review_reference_id, approval_validity_until | Per I-016 immutable. Required precondition for any `marketing.surface_rendered` audit event per AUDIT_EVENTS v5.2 §6. |
| `marketing.surface_suspended` | Drift detector (per §13.2 auto-suspension) OR governance review (cadence lapse) OR operator action | Audit pipeline (`marketing.surface_drift` per AUDIT_EVENTS v5.2 §6 if drift-driven); Marketing surface rendering services (immediate suspension); Notifications module | marketing_copy_id, tenant_id, country_of_care, version, suspension_reason, suspension_effective_at | Per I-016 immutable. Surface re-enabled only via fresh `marketing.surface_published` event after re-review. |

### Tenant-scope rule for research and marketing events (added v5.2)

Mirroring the AUDIT_EVENTS v5.2 §4 research-export tenant-scope rule: research and marketing domain events carry `tenant_id` of the **operating tenant** where consent (research) or copy approval (marketing) was collected. Cohort definitions or marketing copies that span multiple tenants emit one event per contributing tenant (not a single multi-tenant event), each scoped to that tenant's contribution.

---

## Aggregate catalog (v5)

| Aggregate | Key events | Partition key |
|---|---|---|
| `patient` | created, identity_verified, consent_granted, consent_revoked, delegate_added, delegate_removed | patient_id |
| `medication_request` | approved.v1 (BOTH `clinician_approve` AND `protocol_authorized_prescribing` routes via `approval_pathway` field), discontinued.v1, superseded.v1, expired.v1, interaction_safety_hold_triggered.v1 (4 net-new event types added 2026-05-11 under P-011 / SI-001 closure; in-place at v5.2 — additive enum extension only, no version bump) | **tenant_id:medication_request_id** (tenant-scoped per canonical partition-key composition rule; updated 2026-05-11 under P-011 from prior bare `medication_request_id` to align with the tenant-scoped partition-key rule for tenant-bound aggregates) |
| `refill` | initiated, eligible, ineligible, checking, reviewed, approved, declined, protocol_approved, protocol_fallback, pharmacy_queued, fulfilled, delivered, completed | refill_id |
| `interaction_signal` | produced, overridden, cleared | patient_id |
| `herb_drug_signal` | produced, overridden, cleared | patient_id |
| `intake_response` | submitted, ai_evaluated, physician_reviewed, approved, declined | intake_response_id |
| `pharmacy_order` | queued, claimed, fulfilling, release_checked, released, held, escalated, dispatched, delivered, delivery_failed, picked_up, completed | pharmacy_order_id |
| `consult` | booked, started, completed, cancelled, converted_to_sync | consult_id |
| `lab_document` | uploaded, ocr_completed, ai_interpreted, clinician_reviewed | lab_document_id |
| `community_post` | created, flagged, moderated, removed, crisis_detected | community_post_id |
| `rpm_metric` | submitted, alert_triggered, alert_acknowledged, alert_resolved | rpm_enrollment_id |
| `adverse_event` | reported, investigated, resolved, regulatory_reported | adverse_event_id |
| `market_pack` | created, gate_approved, launched, paused, retired | market_id |
| `ai_session` | started, message_sent, message_received, escalated, crisis_detected, ended | ai_session_id |
| `safety_hold` | activated, bridge_supply_dispensed, resolved | patient_id |
| `config_object` | drafted, validated, approved, deployed, rolled_back | config_object_id |
| `research_consent` (added v5.2) | granted, revoked | tenant_id:patient_id |
| `research_export` (added v5.2) | requested, delivered | tenant_id:export_id |
| `marketing_surface` (added v5.2) | published, suspended | tenant_id:marketing_copy_id |

---

## Derived projection streams

For cross-aggregate queries (e.g., "all events for patient X across all aggregates"), services consume derived projection streams, not raw event streams. Projections are eventually consistent and explicitly labeled as such.

Key projections:
- **Patient timeline:** all events for a patient across all aggregates, ordered by timestamp. Consumer: clinician patient view, audit trail.
- **Pharmacy queue:** all pharmacy_order events across all patients, filtered by pharmacy and status. Consumer: pharmacy portal.
- **Safety signal feed:** all interaction_signal and herb_drug_signal events, filtered by severity. Consumer: operations dashboard.
- **Adherence feed:** refill events filtered by timing (on-time, late, missed). Consumer: RPM/CCM dashboard.

---

## Consumer contracts

### At-least-once delivery

Event consumers must be designed for at-least-once delivery. The same event may be delivered multiple times. Consumers must be idempotent — processing the same event twice must produce the same result as processing it once. Use `event_id` for deduplication.

### Schema evolution

Payload schemas evolve via the version suffix in `event_type`. When a schema changes:
- New fields are added as optional with defaults — existing consumers continue to work
- Breaking changes produce a new version (e.g., `refill.approved.v2`)
- Old versions are emitted concurrently with new versions for a migration period (minimum 90 days)
- Consumers must tolerate unknown fields in payloads

### Consumer lag monitoring

Each consumer group tracks its lag (latest event processed vs latest event emitted). Lag exceeding 5 minutes for critical consumers (pharmacy queue, safety signal feed) pages on-call.

---

## Anti-patterns

- **Modifying or deleting emitted events.** Emit a compensating event instead. I-016.
- **Ordering assumptions across aggregates.** Use derived projections.
- **Putting UI display text in event payloads.** Events carry data; display is a consumer concern.
- **Using non-canonical aggregate names.** Glossary terms only. I-014.
- **Processing events without deduplication.** At-least-once delivery means duplicates happen.
- **Omitting `tenant_id` from event envelopes (added v5.1).** Required field. Null only for the `tenant.created` event itself, where the tenant being created IS the tenant_id (the chicken-and-egg case). I-027 in spirit (audit-side); applies symmetrically to events.
- **Cross-tenant event consumption without explicit opt-in (added v5.1).** Consumers default to single-tenant filtering. A consumer that needs cross-tenant aggregation must declare it explicitly at registration time and produce a Category B audit record per consumer-group setup.
- **Composite `partition_key` collapsed to just `aggregate_id` for tenant-scoped aggregates (added v5.1).** Use `tenant_id:aggregate_id` for tenant-scoped streams; this prevents accidental cross-tenant fan-out when an `aggregate_id` happens to clash across tenants (rare with ULIDs, but the contract is conservative).

---

## Document control

- **v5.0** — Initial Domain Events contract.
- **v5.1** — Adds `tenant_id` to event envelope, `tenant_id` to actor block, composite `partition_key` rules for tenant-scoped streams, single-tenant consumer-default rules, anti-patterns specific to multi-tenancy. Adds Platform Admin actor type. Threading remediation per Adversarial Counsel Review v1.0 finding CRITICAL-01. Existing envelope fields preserved; envelope is purely additive.
- **v5.2 (2026-05-02 per v1.10.1 hygiene cycle physical merge of v1.10 PRD Update Cycle delta artifact `Phase3_Group3_Contracts_v1_10_Edits_2026-05-01.md` §DOMAIN_EVENTS)** — Adds 4 research domain events (`research_consent.granted`, `research_consent.revoked`, `research_export.requested`, `research_export.delivered`) per ADR-028 with full payload definitions including `consent_type`, `version_presented`, `scope`, `asymmetric_retraction_acknowledgment` for consent events, and complete cohort + DSA + k-anonymity + audit-pairing fields for export events. Adds 2 marketing domain events (`marketing.surface_published`, `marketing.surface_suspended`) per ADR-027. Adds tenant-scope rule for research and marketing events (operating-tenant scoped; multi-tenant cohorts/copies emit one event per contributing tenant). Adds 3 new aggregates to the catalog (`research_consent`, `research_export`, `marketing_surface`) with composite `tenant_id:aggregate_id` partition keys. Per I-029 binding: failed-export `research_export.delivered` is NOT emitted (audit-side `research.export_completed` records the attempted-and-failed completion per `status = invalidated`). Per I-030: research consent events MUST NOT cascade to care-delivery subscribers. Existing events preserved without modification; v5.2 is purely additive.
