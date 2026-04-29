# 00 · Domain Events

**Status:** canonical · **Version:** 5.1 · **Owner:** engineering lead · **Consumers:** all backend services, event consumers, observability

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
  "tenant_id":       "tnt_<ULID>",
  "partition_key":   "<aggregate_id by default; patient_id for cross-aggregate projections>",
  "timestamp":       "<ISO 8601 UTC>",
  "actor":           { "type": "patient | clinician | pharmacist | operator | delegate | protocol_engine | ai_mode_1 | ai_mode_2 | system | platform_admin", "id": "<ULID>", "tenant_id": "tnt_<ULID> | null" },
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

## Aggregate catalog (v5)

| Aggregate | Key events | Partition key |
|---|---|---|
| `patient` | created, identity_verified, consent_granted, consent_revoked, delegate_added, delegate_removed | patient_id |
| `medication_request` | initiated, approved, modified, declined, fulfilled, cancelled | medication_request_id |
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
