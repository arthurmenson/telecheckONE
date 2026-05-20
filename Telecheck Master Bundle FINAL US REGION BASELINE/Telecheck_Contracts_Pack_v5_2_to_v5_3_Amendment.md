# Contracts Pack v5.2 → v5.3 Batched Amendment

**Version:** Contracts Pack v5.3 (canonical-pending physical body merge per v1.10.1 hygiene-cycle precedent)
**Status:** RATIFIED 2026-05-20 via Promotion Ledger P-027 (Phase B batched-promotion ceremony; co-bumped with CDM v1.2 → v1.3)
**Owner:** Engineering Lead + Compliance Officer + ratifier-quorum
**Parent documents:** All `Telecheck_Contracts_Pack_v5_00_*.md` files (declared at v5.2 in headers post-v1.10 cycle; this amendment bumps headers to v5.3 across affected files)
**Companion documents:** Sprints 8-18 deliverables (source for all amendments below); Promotion Ledger P-026 + P-027.

---

## 1. Purpose + scope

This amendment consolidates **all Contracts Pack updates** introduced across Sprints 8-18 into a v5.2 → v5.3 batched promotion. Five contract files receive amendments:

1. **INVARIANTS** v5.3 → v5.4 (3 new invariants)
2. **AUDIT_EVENTS** v5.5 → v5.6 (~30 new events from cycle)
3. **DOMAIN_EVENTS** v5.2 → v5.3 (6 new consent domain events)
4. **CCR_RUNTIME** v5.2 → v5.3 (11 new tenant config keys)
5. **TYPES** v5.2 → v5.3 (4 new canonical types)

Per OQ2 Path B1, all 5 contract-file updates land in a single batched ratifier ceremony.

---

## 2. INVARIANTS v5.3 → v5.4 (3 new invariants)

### I-033 — Multi-region ACK channel partition-degraded provenance (Sprint 7 + Sprint 16)

Per Sprint 7 R5 HIGH-1 closure (Cold-DR partition-aware ACK quorum) + Sprint 16 R1 HIGH-2 (notification dispatch DR semantics).

**Statement:** any write to the canonical multi-region ACK channel under partition operation (W=1 fallback when one region is unreachable) MUST be tagged `partition_degraded=true` + recorded as a first-class pending obligation. The device-side / client-side perceived "ACK received" signal MUST NOT fire for partition_degraded writes until either (a) cross-region replication backfill promotes the write to quorum-ACKed, OR (b) the device/client first-reconnect reconciliation supplies a matching local entry.

**Enforcement:** at the canonical ACK channel write boundary (DynamoDB Global Tables per OQ-D); audited via Cat A `ack.partition_degraded_write` events.

### I-034 — Synthetic-test isolation from production PHI workflows (Sprint 17 + Sprint 18)

Per Sprint 17 §6 SD3 + Sprint 18 RBAC v1.2 Inv-8.

**Statement:** any operation tagged `is_synthetic_test=true` (synthetic patients, canary markers, chaos drill events) MUST be isolated from production PHI workflows: (a) cannot mutate production clinical tables; (b) routed to provider sandbox endpoints (not real SMS/push/email); (c) excluded from production analytics, exports, retention, billing, audit-archival; (d) operates under dedicated chaos_drill_operator role per Sprint 18 RBAC Inv-8.

**Enforcement:** static-analyzer rule TLC-OPS-001; runtime role-check at SECURITY DEFINER STEP 0a; service-mesh egress policy.

### I-035 — Append-only invariant for ratification + audit-bound state machines (Sprint 7 + Sprint 9 + Sprint 12 + Sprint 14 + Sprint 16)

Per the convergent pattern across Sprints 7/9/12/14/16: state-machine lifecycle is expressed as the EXISTENCE of progressively more rows in append-only tables, NOT as state mutations on a single row.

**Statement:** any canonical state machine for audit-bound or ratifier-authored entities MUST use the canonical event-sourced pattern (append-only base rows + derived current-state view). The enforce_append_only() trigger (per Sprint 9 §6.2 R4 HIGH-1) is the canonical implementation. Mutable status fields on canonical entities are permitted ONLY at CDM v1.2-baseline entities or where explicitly ratified via the Sprint 10 Cross-SI Publish-State Decision Record's Option B pattern (constrained UPDATE + transition log).

**Enforcement:** enforce_append_only() trigger on CDM v1.3-new tables; static-analyzer rule TLC-CDM-APPEND-ONLY.

---

## 3. AUDIT_EVENTS v5.5 → v5.6 (~30 new events)

Cumulative new events across the cycle. Each event tagged with source Sprint + canonical Cat + SI-018 partition routing.

### Sprint 8 SI-017 Identity v1.1 events (8 events)

| Event | Cat | Partition |
|---|---|---|
| `identity.middleware_guc_set` | C (sampled) | P1 if patient; P2 keyed by tenant_id otherwise |
| `identity.patient_session_revoked` | A | P1 keyed by patient_id |
| `identity.clinician_session_revoked` | B | P2 keyed by tenant_id |
| `identity.operator_session_revoked` | B | P2 keyed by tenant_id OR 'platform' |
| `identity.tenant_session_revocation_cascade` | B | P2 keyed by tenant_id |
| `identity.tenant_session_revocation_batch_completed` | B | P2 keyed by tenant_id |
| `identity.dr_failover_session_freeze_cascade` | B | P2 keyed by 'platform' |
| `identity.session_jwt_tenant_id_mismatch` | A | P1 keyed by user_id |
| `identity.session_liveness_check_failed_revoked` | C | P1 if patient; P2 otherwise |
| `identity.session_liveness_check_failed_expired` | C | P1 if patient; P2 otherwise |
| `identity.security_definer_tenant_guc_mismatch` | A | P2 keyed by expected_tenant_id (platform-floor) |
| `identity.operator_mode_switched` | B | P2 keyed by tenant_id OR 'platform' |

### Sprint 9 AI Mode 1 Handler events (8 events)

| Event | Cat | Partition |
|---|---|---|
| `ai.mode1.turn_admitted` | C | P1 keyed by patient_id |
| `ai.mode1.crisis_detector_invoked` | C | P1 keyed by patient_id |
| `ai.mode1.crisis_signal_emitted` | A | P1 keyed by patient_id |
| `ai.mode1.llm_invoked` | C | P1 keyed by patient_id |
| `ai.mode1.turn_completed` | C | P1 keyed by patient_id |
| `ai.mode1.turn_failed` | C | P1 keyed by patient_id |
| `ai.mode1.mode2_handoff_proposed` | B | P2 keyed by tenant_id |
| `audit.cat_c_drop_observed` | B | P2 keyed by tenant_id (per-minute aggregate) |

### Sprint 12 AI Mode 2 Handler events (~10 events)

L2/L3/L4 path events (admitted/proposed/executed/pending_review/approved/rejected/abandoned_expired/etc), governance-gate-decision, handler_resolved, irreversible_effect_committed, undo_invoked, etc. Cat A patient-bound for invocation-level events; Cat B governance for boundary events.

### Sprint 13 KMS Architecture events (~6 events)

`kms.decrypt_invoked` (Cat A unsampled for sensitive classes; Cat C 1% for others); `kms.decrypt_failed` (Cat A); `kms.cmk_rotated` (Cat A); `kms.dek_rotation_started`/`completed` (Cat A); `kms.break_glass_decrypt` (Cat A P2 + Cat A P1 mirror); `kms.cross_tenant_decrypt_attempted` (Cat A); `kms.consent_revocation_research_data_lock` (Cat A per Sprint 14); `kms.replica_policy_drift_detected` (Cat A P2).

### Sprint 14 Consent v1.1 events (6 domain + audit events)

`consent.domain_event_emitted` (Cat C); `consent.outbox_consumed` (Cat C); `consent.outbox_drain_failed` (Cat A P2); `consent.research_re_grant` (Cat A); `ai.consent_revocation_propagated` (Cat A); `consent.dispatcher_leadership_transferred` (Cat A P2).

### Sprint 16 Notification v1.2 events (~8 events)

`notification.crisis_dispatched` (Cat A P1); `notification.crisis_delivery_confirmed` (Cat A P1); `notification.crisis_delivery_failed` (Cat A P1); `notification.opt_out_override_for_emergency` (Cat A P1); `notification.crisis_undeliverable_5min` (Cat A P1 + P2 mirror); `notification.dr_channel_degraded` (Cat B P2); `notification.crisis_redispatch_admitted` (Cat A P1; per R3 closure); `notification.crisis_state_transition` (Cat A per state-machine transition).

### Sprint 17 Operational Readiness events (~3 events)

`ops.canary_marker_inserted` (Cat C 1%); `ops.tenant_isolation_violation_detected` (Cat A P2 platform); `chaos.drill_initiated`/`completed`/`aborted` (Cat B P2).

### Sprint 18 RBAC v1.2 events (5 events)

`rbac.role_granted` (Cat A); `rbac.role_revoked` (Cat A); `rbac.role_assumed_privileged` (Cat A unsampled); `rbac.role_assumed_routine` (Cat C sampled); `rbac.role_separation_violation_detected` (Cat A P2).

---

## 4. DOMAIN_EVENTS v5.2 → v5.3 (6 new consent domain events)

Per Sprint 14 §3 SD1 same-tx outbox pattern.

| Event type | Source transition |
|---|---|
| `ConsentGrantedDomainEvent` | none → granted |
| `ConsentRevokedDomainEvent` | granted → revoked |
| `ConsentScopeAmendedDomainEvent` | granted → scope_amended |
| `DelegationGrantedDomainEvent` | granted → delegation_granted |
| `DelegationRevokedDomainEvent` | delegation_granted → delegation_revoked |
| `ConsentExpiredDomainEvent` | granted → expired (auto-transition at expires_at) |

Subscribers per Sprint 14 §3 SD6: ai-service-mode1 + ai-service-mode2 + forms-engine + research-pipeline.

---

## 5. CCR_RUNTIME v5.2 → v5.3 (11 new tenant config keys)

### Sprint 13 KMS keys (1 key)

- `tenant.kms_residency_policy`: `'us_only' | 'us_with_dr_fallback' | 'multi_region_active_active'`

### Sprint 16 Notification keys (2 keys)

- `tenant.sms_provider_primary`: provider ID (e.g., `twilio`, `africas_talking`)
- `tenant.sms_provider_fallback`: provider ID (e.g., `vonage`)

### Sprint 9 / 12 AI quotas (5 keys)

- `tenant.ai_provider`: `'anthropic' | 'azure-openai' | 'openai'`
- `tenant.ai_mode1_daily_quota`: integer (turns/day per active patient; default 10k)
- `tenant.ai_mode2_daily_quota`: integer (invocations/day per tenant; default 100k)
- `tenant.ai_mode2_per_patient_hourly_quota`: integer (default 20/hr)
- `tenant.ai_provider_phi_allowed`: boolean (gates non-HIPAA providers per Sprint 9 §7.1 TLC-AI-003)

### Sprint 14 Consent + Sprint 17 chaos (3 keys)

- `tenant.consent_outbox_propagation_sla_seconds`: integer (default 5)
- `tenant.chaos_drill_enabled`: boolean (must be true for chaos drills to dispatch)
- `tenant.l4_pause_kill_switch`: boolean (Sprint 12 §4.4 L4 pre-state guard kill switch)

---

## 6. TYPES v5.2 → v5.3 (4 new canonical types)

- `dispatch_obligation_state` enum: per Sprint 16 §3 SD2 8-state machine.
- `mode2_autonomy_level` enum: `L2 | L3 | L4` (per ADR-029 + Sprint 12).
- `mode2_workflow_outcome` enum: `completed | failed | reverted | cancelled | abandoned_expired`.
- `data_class` enum: `pii_demographic | pii_clinical | pii_sensitive_clinical | pii_financial | pii_conversation | pii_audit_payload | pii_research_consented` (per Sprint 13 §2.2 7-class taxonomy).

---

## 7. Cross-references

- **Promotion Ledger P-027** — canonical ratification authority.
- **CDM v1.2 → v1.3 Amendment** (`Telecheck_CDM_v1_2_to_v1_3_Amendment.md`) — co-bumped artifact.
- **Sprint 20 Master Completion Plan v1.1 §3 Phase B** — gating criteria.
- Each canonical event / type / invariant's authoritative content lives in its source-Sprint spec. This amendment is the consolidated change-list + cross-reference table; physical body merge into renamed Contracts Pack files (`Telecheck_Contracts_Pack_v5_00_*.md` → `_v5_03_*.md`) deferred to future hygiene cycle per v1.10.1 precedent.

---

## 8. Document control

- **v5.3 amendment v0.1** (2026-05-20) — Phase B batched promotion ratified via P-027. 3 new invariants + ~30 new audit events + 6 new domain events + 11 new CCR keys + 4 new types consolidated from Sprints 8-18. Per-element authoritative content remains at source-Sprint specs.

— Q2 2026 Batched Ratifier Ceremony, Phase B promotion, 2026-05-20 per Promotion Ledger P-027.
