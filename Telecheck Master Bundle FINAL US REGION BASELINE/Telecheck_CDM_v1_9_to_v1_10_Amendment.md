# CDM v1.9 → v1.10 + AUDIT_EVENTS v5.11 → v5.12 + OpenAPI v0.4 → v0.5 + State Machines v1.3 → v1.4 + RBAC v1.3 → v1.4 Amendment (SI-022 Crisis Response follow-on)

**Version:** 0.2 DRAFT
**Status:** pre-Codex-review (sections 4 + 5 + 6 filled in vs SI normative content; §3 procedures and §7-8 RBAC/preflight still stubs to be filled in v0.3)
**Authoring date:** 2026-05-21
**Trigger:** Promotion Ledger P-039 (SI-022 Crisis Response Slice v1.0 RATIFIED 2026-05-21 via Codex R67 ship-it APPROVE; Registry v2.25 → v2.26). Per the established post-P-029 SI-spec-first promotion pattern, SI-022's canonical content lands in CDM + AUDIT_EVENTS + OpenAPI + State Machines + RBAC via a separate amendment cycle following SI ratification. **EIGHTH instance** of the SI-spec-first promotion pattern (P-029, P-032, P-034, P-036, P-038, P-040 — note P-035 was SI-only, and P-037 was followed by P-038 as its CDM follow-on; this P-040 is the 6th follow-on amendment in the post-P-029 lineage).
**Owner:** Crisis Response slice owner + Platform AI Safety + Mode 1 AI Service owner + Notification slice owner + Adverse-Event slice owner + Audit owner + CDM owner + AUDIT_EVENTS owner + OpenAPI owner + State Machines owner + RBAC owner.
**Parent SI:** SI-022 v1.0 RATIFIED (`Telecheck_SI_022_Crisis_Response_v1_0.md`); P-039 is the ratification authority for this amendment.
**Companion documents:** P-031 (SI-024.1 v0.8 JWT-binding canonical trust anchor); P-027 (Contracts Pack v5.3 + I-035 + §4.66-4.68 notification_crisis_* baseline entities); P-035 (AI Service Mode 1 Handler Spec v0.4 FLOOR-020 crisis-detection emit); previous follow-on amendment patterns (`Telecheck_CDM_v1_8_to_v1_9_Amendment.md` P-038; `Telecheck_CDM_v1_7_to_v1_8_Amendment.md` P-036; `Telecheck_CDM_v1_6_to_v1_7_Amendment.md` P-034; `Telecheck_CDM_v1_5_to_v1_6_Amendment.md` P-032; `Telecheck_CDM_v1_4_to_v1_5_Amendment.md` P-029).
**Companion invariants:** I-019 (crisis-detection-always-on platform-floor invariant); I-027 (audit append-only); I-035 (append-only invariant for ratification + audit-bound state machines); FLOOR-020 (Cat A fail-closed audit emission discipline).

---

## 1. Purpose + scope

Mechanical consolidation of SI-022 v1.0 RATIFIED (P-039) canonical content into named bundle file sections. EIGHTH instance of the established post-P-029 SI-spec-first promotion pattern.

**In scope:**

1. **CDM v1.9 → v1.10:** +3 new entities (`crisis_event`, `crisis_event_lifecycle_transition`, `crisis_sweep_execution`) + additive column extensions to 3 P-027 §4.66-4.68 entities (`notification_crisis_dispatch_ledger`, `notification_crisis_provider_attempt`, `notification_crisis_escalation_obligation`) + 1 OPTIONAL canonical view (`crisis_event_current_state_v` — DERIVED from append-only lifecycle transitions) + **6 SECURITY DEFINER procedures owned by 5 distinct owner roles**: the 7 procedures are (1) raw `record_crisis_event_lifecycle_transition()` owned by `crisis_event_lifecycle_transition_writer_owner`; (2)–(6) five wrapper procedures owned by 4 wrapper-owner roles: `record_crisis_initiation()` (crisis_initiation_wrapper_owner), `record_crisis_acknowledgement_claim()` (crisis_acknowledgement_wrapper_owner), `record_crisis_response()` (crisis_response_wrapper_owner), `record_crisis_resolution()` (crisis_resolution_wrapper_owner), and `execute_crisis_no_acknowledgement_sweep()` (crisis_sweep_wrapper_owner). Total: 1 raw procedure + 5 wrapper procedures = 6 procedures; 1 raw owner + 4 wrapper owners = 5 procedure-owner roles. Continuing CDM numbering from v1.9's 96 active entities + 7 derived views + 1 optional MV; v1.10 target: 99 active entities + 8 derived views + 1 optional MV.
2. **AUDIT_EVENTS v5.11 → v5.12:** +12 new action IDs under `crisis.*` namespace per SI-022 v1.0 §3 normative table. **Authoritative per-row category labels: 7 Cat A + 0 Cat B + 5 Cat C** (see §4 of this amendment for the full per-row table). **Tally-drift reconciliation note:** SI-022 v1.0 §3 summary line says "8 Cat A + 0 Cat B + 4 Cat C" — this is a 1-row off-by-one tally vs the per-row labels in the SI's own §3 table (the row labels are authoritative). The per-row count (7A + 5C) governs this amendment's normative content; the SI's summary tally drift will be patched in a downstream prose-correction PR after P-040 lands. Cat A: `crisis.detected`, `crisis.acknowledged`, `crisis.responded`, `crisis.resolved`, `crisis.no_acknowledgement_escalation`, `crisis.regulatory_threshold_reached`, `crisis.final_tier_reached`. Cat C: `crisis.dispatch_attempt_failed`, `crisis.sweep_replay_after_commit_ack_loss`, `crisis.sweep_claim_recovery_with_committed_cycle`, `crisis.delivery_fence_mismatch_dropped`, `crisis.sweep_stale_eligibility_dropped`. **Existing audits preserved unchanged**: `crisis_detection_trigger` Cat A (FLOOR-020 platform-floor at P-035 — distinct from the new lifecycle-bound `crisis.detected` Cat A; the trigger is emitted by the Mode 1 handler at FLOOR-020 BEFORE the crisis_event INSERT; `crisis.detected` is emitted by `record_crisis_initiation()` AFTER crisis_event INSERT completes the same atomic transaction); `crisis.escalation_destination_resolved` Cat B from P-025 (CCR resolver outcome).
3. **OpenAPI v0.4 → v0.5:** +5-10 new endpoints under `/v1/crisis-events/*` (initiation surface OAuth-bound; acknowledge/respond/resolve wrappers; unauthenticated-emergency fallback per Sub-decision 3 logical recipient 1). Exact endpoint count TBD against SI's §5 normative endpoint list.
4. **State Machines v1.3 → v1.4:** +1 new state machine `crisis_event_lifecycle` described as DERIVED from append-only `crisis_event_lifecycle_transition` rows per I-035; CHECK constraint enumerates 11 allowed `(from_state, to_state, transition_reason)` triples per SI-022 Sub-decision 4 + §6 normative table (post-R8+R11 expansion: 9 → 11 triples).
5. **RBAC v1.3 → v1.4:** +13 new role definitions (estimated; reconcile against SI's §7+§8 enumeration): application roles (crisis_initiator, crisis_acknowledger, crisis_responder, crisis_resolver, crisis_sweep_scheduler, crisis_event_reader) + 5 wrapper-owner roles enumerated in §1 above + 1 raw writer owner + view owner (crisis_event_current_state_view_owner) + sweep-worker role.
6. **`jwt_migration_entity_status` seed scope:** 4 entries (3 RLS-bearing crisis_* tables + 1 derived view `crisis_event_current_state_v`) with `phase_4_cutover_eligible=FALSE` + `raw_guc_fallback_audited=TRUE` defaults per established post-P-032 seeding pattern.

**Out of scope:**

- SI-022 implementation in `telecheck-app` code repo (Phase A foundation).
- CCR slice canonical entities (referenced via P-025 `ccr_crisis_helpline_resolution` Cat B → Cat C audit; entity defined in CCR canonical scope).
- Mode 1 AI Service handler internals (referenced via FLOOR-020 emit at handler completion; covered by P-035 + P-036).
- Adverse-Event slice (referenced via `crisis.regulatory_threshold_reached` Cat A; downstream consumer; covered separately).
- INVARIANTS bump (no new platform-floor invariants from SI-022; all closures align with I-019 + I-023 + I-026 + I-027 + I-032 v5.3 + I-035 + FLOOR-020).

---

## 2. New CDM entities (3 active + additive column extensions to 3 existing P-027 entities + 1 OPTIONAL derived view)

All 3 net-new active entities are **tenant-scoped** with composite identity propagation chain: `crisis_event → crisis_event_lifecycle_transition` (append-only log; Option A canonical pattern per I-035); `crisis_event → crisis_sweep_execution` (durable per-sweep execution row with fencing-token + lease-takeover semantics).

**Composite identity propagation chain:** crisis_event → lifecycle_transition (append-only); crisis_event → escalation_obligation (P-027 §4.68 baseline + additive columns); crisis_event → provider_attempt (P-027 §4.67 baseline + additive crisis_event_id FK + recipient_principal_id + sweep_cycle_id columns); escalation_obligation → sweep_execution (1-to-N per generation, partial UNIQUE constraint on uncompleted rows).

**KMS encryption (I-026)** on PHI-bearing column groups in crisis_event (intake_payload + clinical_summary) using the 8-column flat envelope pattern (mirrors SI-005 P-021 pattern).

### §4.NEW1 — `crisis_event` (CDM v1.10 new; SI-022 Sub-decision 2 STEP 2a entity 1)

```sql
CREATE TABLE crisis_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    patient_id UUID NOT NULL,
    server_signal_id UUID NOT NULL,    -- FK to Mode 1 server-signal envelope per P-035 FLOOR-020
    crisis_type TEXT NOT NULL CHECK (crisis_type IN (
        'suicidal_ideation', 'self_harm', 'violence_threat', 'medical_emergency',
        'severe_psychological_distress', 'protocol_safety_floor_breach'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('non_imminent', 'imminent', 'life_threatening')),
    regulatory_reporting_enabled BOOLEAN NOT NULL,   -- snapshot of tenant config at detection time
    detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- KMS envelope for intake_payload + clinical_summary PHI columns (8-column flat envelope per P-021):
    intake_payload_ciphertext BYTEA NULL,
    intake_payload_dek_id UUID NULL,
    intake_payload_dek_version INTEGER NULL,
    intake_payload_iv BYTEA NULL,
    intake_payload_auth_tag BYTEA NULL,
    intake_payload_kek_id UUID NULL,
    intake_payload_kek_version INTEGER NULL,
    intake_payload_algorithm TEXT NULL,
    -- Composite tenant-scoped FKs
    CONSTRAINT crisis_event_patient_tenant_fk
        FOREIGN KEY (tenant_id, patient_id) REFERENCES patient(tenant_id, id),
    CONSTRAINT crisis_event_server_signal_unique UNIQUE (tenant_id, server_signal_id),
    CONSTRAINT crisis_event_tenant_id_unique UNIQUE (tenant_id, id)
);

ALTER TABLE crisis_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_event FORCE ROW LEVEL SECURITY;
CREATE POLICY crisis_event_tenant_isolation ON crisis_event
    USING (tenant_id = current_tenant_id_strict('crisis_event'));
CREATE TRIGGER crisis_event_append_only
    BEFORE UPDATE OR DELETE ON crisis_event
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

CREATE INDEX crisis_event_patient_detection_idx
    ON crisis_event (tenant_id, patient_id, detected_at DESC);
CREATE INDEX crisis_event_severity_detection_idx
    ON crisis_event (tenant_id, severity, detected_at DESC);
```

**Tenant-threading:** `current_tenant_id_strict('crisis_event')` enforces JWT-verified tenant binding per SI-024.1 v0.8 (P-031) canonical pattern. `enforce_append_only()` trigger forbids UPDATE/DELETE per I-035 (the entity is the canonical immutable record of crisis detection).

**KMS encryption:** intake_payload may contain PHI (the Mode 1 user message that triggered detection); encrypted with the per-tenant DEK envelope. Composite 8-column flat envelope mirrors SI-005 P-021 pattern. clinical_summary column omitted from this v1.10 draft pending SI-022 OQ confirmation on whether the Crisis Response Card's hydrated CCR-resolved content is persisted (vs derived at render time).

**`jwt_migration_entity_status` seed entry:** name='crisis_event'; phase_4_cutover_eligible=FALSE; raw_guc_fallback_audited=TRUE.

### §4.NEW2 — `crisis_event_lifecycle_transition` (CDM v1.10 new; append-only Option A per I-035)

```sql
CREATE TABLE crisis_event_lifecycle_transition (
    id BIGSERIAL PRIMARY KEY,
    tenant_id tenant_id_t NOT NULL,
    crisis_event_id UUID NOT NULL,
    from_state TEXT NOT NULL CHECK (from_state IN (
        'none', 'detected', 'escalated', 'acknowledged', 'responded', 'resolved'
    )),
    to_state TEXT NOT NULL CHECK (to_state IN (
        'detected', 'escalated', 'acknowledged', 'responded', 'resolved'
    )),
    transition_reason TEXT NOT NULL CHECK (transition_reason IN (
        'initial_detection',
        'no_acknowledgement_timeout',
        'tier_progression_no_acknowledgement',
        'acknowledged_no_response_timeout',
        'responded_no_resolution_timeout',
        'response_failed',
        'clinician_acknowledgement',
        'clinician_response',
        'clinician_resolution'
    )),
    transition_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor_principal_id UUID NULL,
    transition_payload JSONB NULL,
    -- 11 allowed (from_state, to_state, transition_reason) triples per SI-022 Sub-decision 4 + §6:
    CONSTRAINT crisis_lifecycle_valid_transition CHECK (
        (from_state = 'none' AND to_state = 'detected' AND transition_reason = 'initial_detection')
        OR (from_state = 'detected' AND to_state = 'escalated' AND transition_reason = 'no_acknowledgement_timeout')
        OR (from_state = 'escalated' AND to_state = 'escalated' AND transition_reason = 'tier_progression_no_acknowledgement')
        OR (from_state = 'acknowledged' AND to_state = 'escalated' AND transition_reason = 'acknowledged_no_response_timeout')
        OR (from_state = 'responded' AND to_state = 'escalated' AND transition_reason = 'responded_no_resolution_timeout')
        OR (from_state = 'responded' AND to_state = 'escalated' AND transition_reason = 'response_failed')
        OR (from_state = 'detected' AND to_state = 'acknowledged' AND transition_reason = 'clinician_acknowledgement')
        OR (from_state = 'escalated' AND to_state = 'acknowledged' AND transition_reason = 'clinician_acknowledgement')
        OR (from_state = 'acknowledged' AND to_state = 'responded' AND transition_reason = 'clinician_response')
        OR (from_state = 'responded' AND to_state = 'resolved' AND transition_reason = 'clinician_resolution')
        OR (from_state = 'escalated' AND to_state = 'resolved' AND transition_reason = 'clinician_resolution')
    ),
    CONSTRAINT crisis_lifecycle_crisis_event_tenant_fk
        FOREIGN KEY (tenant_id, crisis_event_id) REFERENCES crisis_event(tenant_id, id)
);

ALTER TABLE crisis_event_lifecycle_transition ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_event_lifecycle_transition FORCE ROW LEVEL SECURITY;
CREATE POLICY crisis_lifecycle_tenant_isolation ON crisis_event_lifecycle_transition
    USING (tenant_id = current_tenant_id_strict('crisis_event_lifecycle_transition'));
CREATE TRIGGER crisis_lifecycle_append_only
    BEFORE UPDATE OR DELETE ON crisis_event_lifecycle_transition
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

CREATE INDEX crisis_lifecycle_event_transition_idx
    ON crisis_event_lifecycle_transition (tenant_id, crisis_event_id, transition_at DESC, id DESC);
```

**Monotonic-ordering invariant** (per P-038 R2 + R4 patterns): BEFORE INSERT trigger enforces `NEW.transition_at >= (SELECT MAX(transition_at) FROM crisis_event_lifecycle_transition WHERE tenant_id = NEW.tenant_id AND crisis_event_id = NEW.crisis_event_id)` to prevent backdated row corruption of current-state derivation; future-dating tolerated up to `now() + 5s` clock-skew window. To be detailed in trigger function spec in §3.

### §4.NEW3 — `crisis_sweep_execution` (CDM v1.10 new; durable per-sweep work-item table with fencing-token + lease-takeover semantics)

```sql
CREATE TABLE crisis_sweep_execution (
    sweep_execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    crisis_event_id UUID NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    scheduled_for_obligation_generation INTEGER NOT NULL,   -- R52 per-generation uniqueness
    claimed_by_worker_id TEXT NULL,
    claim_expires_at TIMESTAMPTZ NULL,
    fencing_token BIGINT NOT NULL DEFAULT 1,   -- monotonic per-takeover token (R45)
    heartbeat_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    sweep_cycle_id_committed INTEGER NULL,   -- set atomically with completed_at at STEP F (R47)
    -- Composite tenant-scoped FK
    CONSTRAINT crisis_sweep_execution_event_tenant_fk
        FOREIGN KEY (tenant_id, crisis_event_id) REFERENCES crisis_event(tenant_id, id)
);

-- R52 per-obligation-generation uniqueness invariant: partial UNIQUE constraint covers only
-- un-completed rows so multiple completed sweeps for the same logical generation can coexist
-- in the table (audit-trail durability) while concurrent scheduling attempts for the same
-- open generation are rejected at the constraint level.
CREATE UNIQUE INDEX crisis_sweep_execution_open_uk
    ON crisis_sweep_execution (tenant_id, crisis_event_id, scheduled_for_obligation_generation)
    WHERE completed_at IS NULL;

CREATE INDEX crisis_sweep_execution_scheduling_idx
    ON crisis_sweep_execution (scheduled_at)
    WHERE completed_at IS NULL;

CREATE INDEX crisis_sweep_execution_event_lookup_idx
    ON crisis_sweep_execution (tenant_id, crisis_event_id, scheduled_at DESC);

ALTER TABLE crisis_sweep_execution ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_sweep_execution FORCE ROW LEVEL SECURITY;
CREATE POLICY crisis_sweep_execution_tenant_isolation ON crisis_sweep_execution
    USING (tenant_id = current_tenant_id_strict('crisis_sweep_execution'));
-- crisis_sweep_execution is intentionally MUTABLE on claim/heartbeat/completion columns (NOT
-- append-only) per SI-022 Sub-decision 6 lease-takeover + STEP F triple-guarded final UPDATE
-- semantics. The R47 closure makes `completed_at` + `sweep_cycle_id_committed` the durable
-- replay-detection marker; once committed, the row remains in the table but `completed_at IS
-- NOT NULL` means it's terminal and no further mutation is permitted (enforced by BEFORE UPDATE
-- trigger asserting completed_at unchanged + sweep_cycle_id_committed unchanged when both are
-- already non-NULL).
CREATE TRIGGER crisis_sweep_execution_terminal_immutable
    BEFORE UPDATE ON crisis_sweep_execution
    FOR EACH ROW
    WHEN (OLD.completed_at IS NOT NULL)
    EXECUTE FUNCTION enforce_terminal_row_immutable();
```

### §4.EXT1 — `notification_crisis_dispatch_ledger` additive column extensions (P-027 §4.66 baseline)

```sql
ALTER TABLE notification_crisis_dispatch_ledger
    ADD COLUMN crisis_event_id UUID NULL;    -- transitional NULL during migration; backfilled then set NOT NULL

-- After backfill of existing rows via crisis_event lookup by (tenant_id, server_signal_id):
ALTER TABLE notification_crisis_dispatch_ledger
    ALTER COLUMN crisis_event_id SET NOT NULL;

ALTER TABLE notification_crisis_dispatch_ledger
    ADD CONSTRAINT notification_crisis_dispatch_ledger_event_tenant_fk
    FOREIGN KEY (tenant_id, crisis_event_id) REFERENCES crisis_event(tenant_id, id);
```

### §4.EXT2 — `notification_crisis_provider_attempt` additive column extensions (P-027 §4.67 baseline)

```sql
ALTER TABLE notification_crisis_provider_attempt
    ADD COLUMN crisis_event_id UUID NULL,    -- transitional; backfilled
    ADD COLUMN recipient_principal_id UUID NULL,  -- nullable for emergency_contact; non-null for all other recipient_roles (R37)
    ADD COLUMN sweep_cycle_id INTEGER NULL;  -- deterministic per-sweep value captured at STEP A (R39)

-- After backfill:
ALTER TABLE notification_crisis_provider_attempt
    ALTER COLUMN crisis_event_id SET NOT NULL,
    ALTER COLUMN sweep_cycle_id SET NOT NULL;

ALTER TABLE notification_crisis_provider_attempt
    ADD CONSTRAINT notification_crisis_provider_attempt_event_tenant_fk
        FOREIGN KEY (tenant_id, crisis_event_id) REFERENCES crisis_event(tenant_id, id),
    ADD CONSTRAINT notification_crisis_provider_attempt_principal_required_for_addressable_roles
        CHECK (
            recipient_principal_id IS NOT NULL
            OR recipient_role = 'emergency_contact'
        ),
    -- R28 canonical idempotency UNIQUE constraint (named so ON CONFLICT can target it explicitly):
    ADD CONSTRAINT notification_crisis_provider_attempt_idempotency_uk
        UNIQUE (tenant_id, crisis_event_id, channel, recipient_role, recipient_address, attempt_sequence);
```

### §4.EXT3 — `notification_crisis_escalation_obligation` additive column extensions (P-027 §4.68 baseline)

```sql
ALTER TABLE notification_crisis_escalation_obligation
    ADD COLUMN crisis_event_id UUID NULL,    -- transitional; backfilled
    ADD COLUMN severity TEXT NULL CHECK (severity IN ('non_imminent', 'imminent', 'life_threatening')),
    ADD COLUMN escalation_tier TEXT NULL CHECK (escalation_tier IN ('care_team', 'clinical_on_call', 'regulatory')),
    ADD COLUMN sweep_cycle_counter INTEGER NOT NULL DEFAULT 1,  -- R40 DEFAULT=1; initial detection establishes counter=1
    ADD COLUMN final_tier_exhausted_at TIMESTAMPTZ NULL;  -- R13 exhaustion-recheck timestamp

-- After backfill:
ALTER TABLE notification_crisis_escalation_obligation
    ALTER COLUMN crisis_event_id SET NOT NULL,
    ALTER COLUMN severity SET NOT NULL,
    ALTER COLUMN escalation_tier SET NOT NULL;

ALTER TABLE notification_crisis_escalation_obligation
    ADD CONSTRAINT notification_crisis_escalation_obligation_event_tenant_fk
        FOREIGN KEY (tenant_id, crisis_event_id) REFERENCES crisis_event(tenant_id, id);

-- BEFORE UPDATE trigger enforcing the canonical SI-022 mutation discipline (R10 + R55 + R57):
-- escalation_tier MAY be set NULL only by record_crisis_resolution() wrapper (R10 BACKSTOP);
-- escalation_key MUST remain NULL (R55-R57 always-NULL invariant);
-- sweep_cycle_counter MAY only be incremented by R53 single guarded UPDATE inside sweep transaction;
-- final_tier_exhausted_at MAY only be set by sweep STEP E for terminal-tier exhaustion (R13).
CREATE TRIGGER notification_crisis_escalation_obligation_mutation_discipline
    BEFORE UPDATE ON notification_crisis_escalation_obligation
    FOR EACH ROW
    EXECUTE FUNCTION enforce_crisis_escalation_obligation_mutation_discipline();
```

### §4.NEW4 — `crisis_event_current_state_v` (CDM v1.10 new; DERIVED view from append-only lifecycle transitions per I-035)

```sql
CREATE VIEW crisis_event_current_state_v
WITH (security_barrier = true) AS
SELECT
    ce.tenant_id,
    ce.id AS crisis_event_id,
    ce.patient_id,
    ce.server_signal_id,
    ce.crisis_type,
    ce.severity,
    ce.regulatory_reporting_enabled,
    ce.detected_at,
    latest.to_state AS current_state,
    latest.transition_at AS current_state_at,
    latest.actor_principal_id AS current_state_actor_principal_id,
    obligation.escalation_tier,
    obligation.sweep_cycle_counter,
    obligation.final_tier_exhausted_at,
    obligation.undeliverable_deadline
FROM crisis_event ce
LEFT JOIN LATERAL (
    SELECT to_state, transition_at, actor_principal_id
    FROM crisis_event_lifecycle_transition lt
    WHERE lt.tenant_id = ce.tenant_id AND lt.crisis_event_id = ce.id
    ORDER BY lt.transition_at DESC, lt.id DESC
    LIMIT 1
) latest ON TRUE
LEFT JOIN notification_crisis_escalation_obligation obligation
    ON obligation.tenant_id = ce.tenant_id AND obligation.crisis_event_id = ce.id;
-- View executes with security_invoker=true (caller's privileges); tenant isolation enforced
-- by RLS on underlying crisis_event + crisis_event_lifecycle_transition +
-- notification_crisis_escalation_obligation tables. View owner is crisis_event_current_state_view_owner
-- (non-BYPASSRLS); GRANT SELECT to crisis_event_reader role only.
```

---

## 3. New SECURITY DEFINER procedures (6 procedures owned by 5 owner roles)

To be detailed in v0.2: (1) raw `record_crisis_event_lifecycle_transition()` writer (owner: `crisis_event_lifecycle_transition_writer_owner`; EXECUTE granted to exactly the 4 wrapper-owner roles below + crisis_sweep_wrapper_owner — no other roles); (2) `record_crisis_initiation()` (owner: crisis_initiation_wrapper_owner; called by Mode 1 handler after FLOOR-020 emit + crisis_event INSERT; enforces 3-layer tenant config validation Part A+B+C per R63/R65); (3) `record_crisis_acknowledgement_claim()` (owner: crisis_acknowledgement_wrapper_owner; tier-derived-from-JWT-principal per R35+R36; resets deadline + escalation_tier = GREATEST(current, acknowledging_tier) per R34); (4) `record_crisis_response()` (owner: crisis_response_wrapper_owner); (5) `record_crisis_resolution()` (owner: crisis_resolution_wrapper_owner; SOLE terminalization path per R11); (6) `execute_crisis_no_acknowledgement_sweep()` (owner: crisis_sweep_wrapper_owner; STEP A→F atomic transaction with R53 guarded UPDATE + STEP F triple-guard).

---

## 4. New audit events (12 = 7 Cat A + 0 Cat B + 5 Cat C per SI-022 v1.0 §3 authoritative per-row labels)

Normative landing of the SI-022 v1.0 §3 normative audit table into AUDIT_EVENTS v5.12. All 12 actions live under the `crisis.*` namespace. **Two pre-existing audits remain unchanged**: `crisis_detection_trigger` Cat A (Mode 1 FLOOR-020 platform-floor at P-035 — distinct from the new lifecycle-bound `crisis.detected` Cat A in this amendment); `crisis.escalation_destination_resolved` Cat B (CCR resolver outcome from P-025).

| # | Action ID | Category | Sampling | Partition | Emit site |
|---|---|---|---|---|---|
| 1 | `crisis.detected` | Cat A | NOT sampled (safety-floor) | P1 keyed by patient_id | `record_crisis_initiation()` wrapper — emitted in same atomic transaction as crisis_event INSERT + initial lifecycle transition `(none → detected / initial_detection)`. Distinct from Mode 1 `crisis_detection_trigger` FLOOR-020 emit (which fires BEFORE crisis_event INSERT). |
| 2 | `crisis.acknowledged` | Cat A | NOT sampled | P1 keyed by patient_id | `record_crisis_acknowledgement_claim()` wrapper — emitted in same atomic tx as the `detected → acknowledged / clinician_acknowledgement` lifecycle transition. |
| 3 | `crisis.responded` | Cat A | NOT sampled | P1 keyed by patient_id | `record_crisis_response()` wrapper. |
| 4 | `crisis.resolved` | Cat A | NOT sampled | P1 keyed by patient_id | `record_crisis_resolution()` wrapper — SOLE terminalization path; also sets `notification_crisis_escalation_obligation.escalation_tier = NULL` to drop the row from sweep eligibility. |
| 5 | `crisis.no_acknowledgement_escalation` | Cat A | NOT sampled (safety-floor escalation per SI R1 MED-1 closure) | P1 keyed by patient_id | `execute_crisis_no_acknowledgement_sweep()` wrapper STEP D — emitted in same atomic tx as the sweep transaction (STEP A→F); payload includes `is_final_tier_recheck` flag distinguishing initial tier advance from final-tier recheck per R13. |
| 6 | `crisis.regulatory_threshold_reached` | Cat A | NOT sampled (safety-floor) | P1 keyed by patient_id | `record_crisis_initiation()` IFF `severity='life_threatening' AND tenant.regulatory_reporting_enabled=true` (downstream consumer: Adverse-Event slice). |
| 7 | `crisis.final_tier_reached` | Cat A | NOT sampled (safety-floor; emitted exactly once per crisis_event the first time escalation_tier reaches a terminal tier per R13 HIGH-1 closure) | P1 keyed by patient_id | `execute_crisis_no_acknowledgement_sweep()` STEP E — first time `next_tier(escalation_tier, severity, regulatory_reporting) IS NULL` for this crisis_event; sets `final_tier_exhausted_at = now()`. |
| 8 | `crisis.dispatch_attempt_failed` | Cat C | high-volume sampled | P2 governance-partition | STEP 4 outbox worker on per-recipient dispatch failure OR STEP C zero-recipients-for-required-tier fail-closed (payload `zero_recipients_for_required_tier=true` + `target_tier` value + `recipient_role` missing list per R63/R64 closure). |
| 9 | `crisis.sweep_replay_after_commit_ack_loss` | Cat C | NOT sampled (governance recovery; R43 HIGH-1 + R45 MED-1 closure) | P2 governance-partition | Scheduler-side replay detection when a crisis_sweep_execution row already has `completed_at IS NOT NULL` — skip re-execution + return success. Payload: sweep_execution_id, sweep_cycle_id_committed, original_completed_at, replay_at, scheduler_id. |
| 10 | `crisis.sweep_claim_recovery_with_committed_cycle` | Cat C | NOT sampled (governance recovery tripwire; R44 HIGH-1 + R45 MED-1 closure; per R47 this code path is architecturally impossible under canonical contract — retained ONLY as tripwire for database integrity defects) | P2 governance-partition | Claim-acquisition path observing impossible-but-bounded state `completed_at IS NULL AND sweep_cycle_id_committed IS NOT NULL` — heal terminal mark to now() without re-executing STEP A→F. Payload: sweep_execution_id, sweep_cycle_id_committed, previous_worker_id, recovery_worker_id, fencing_token_before, fencing_token_after, recovery_at. |
| 11 | `crisis.delivery_fence_mismatch_dropped` | Cat C | NOT sampled (governance recovery; R49 HIGH-1 closure — fencing-token recheck on every outbox dispatch) | P2 governance-partition | Downstream notification-delivery worker pre-dispatch recheck detecting fencing_token mismatch — outbox row dropped + delivery suppressed to prevent stale/non-authoritative external sends from a worker whose lease was taken over mid-fan-out. Payload: outbox_row_id, sweep_execution_id, sweep_cycle_id, expected_fencing_token, observed_fencing_token, observed_completed_at, delivery_worker_id, dropped_at. |
| 12 | `crisis.sweep_stale_eligibility_dropped` | Cat C | NOT sampled (governance recovery; R52 HIGH-1 closure — STEP A guarded UPDATE ROW_COUNT=0 path) | P2 governance-partition | Sweep transaction STEP A obligation-eligibility revalidation finding the sweep is stale (another generation advanced obligation, OR lifecycle changed, OR deadline reset by ack/respond/resolve, OR sweep_cycle_counter mismatched scheduled_for_obligation_generation) — sweep correctly marked completed-as-stale-no-op without fan-out/audit/tier-advance. Payload: sweep_execution_id, scheduled_for_obligation_generation, current_obligation_sweep_cycle_counter, current_undeliverable_deadline, current_escalation_key_status, current_escalation_tier, current_lifecycle_state, dropped_at. |

**Total: 12 new action IDs (7 Cat A + 0 Cat B + 5 Cat C).** SI-022 §3 summary tally drift (claimed "8 Cat A + 4 Cat C") flagged for downstream prose-correction PR after P-040 lands; per-row labels are authoritative.

**Existing audit events preserved unchanged from prior baselines:**
- `crisis_detection_trigger` Cat A (Mode 1 FLOOR-020 platform-floor; emitted BEFORE crisis_event INSERT by Mode 1 handler per P-035)
- `crisis.escalation_destination_resolved` Cat B (CCR resolver outcome; P-025)

**Co-transactional discipline:** all Cat A audits in this amendment are emitted INSIDE the same atomic transaction as the corresponding state change (canonical FLOOR-020 audit-co-transactional pattern). On rollback the audit row is NOT committed; on commit both the audit and the state change land atomically. Cat C audits are emitted in separate post-transaction autocommit txs (governance/recovery events MAY emit even on the rollback-recovery path; tolerated sampling loss).

---

## 5. New OpenAPI endpoints (6 net-new endpoints under `/v1/crisis/*`)

Normative landing of the SI-022 v1.0 §5 normative endpoint list into OpenAPI v0.5.

| # | Method | Path | Caller role | SECURITY DEFINER wrapper | Purpose |
|---|---|---|---|---|---|
| 1 | GET | `/v1/crisis/active` | clinician / care-team-member | (no wrapper; reads `crisis_event_current_state_v` filtered by RLS) | List active crisis events in tenant (paginated; caller-class staff-summary view; tenant-wide visibility for clinical triage) |
| 2 | GET | `/v1/crisis/mine` | patient / delegate | (no wrapper; reads `crisis_event_current_state_v` filtered by JWT-verified principal predicate) | List caller's own crisis events; predicate `tenant_id = current_tenant_id_strict('crisis_event_current_state_v') AND patient_id IN (jwt-verified-patient OR consent_grant.delegate_principal_id IF scope='emergency_contact_share' active)` per SI-024.1 + Consent slice integration |
| 3 | POST | `/v1/crisis/:crisis_event_id/acknowledge` | clinician / care-team-member | `record_crisis_acknowledgement_claim()` | Claim acknowledgement; tier-derived-from-JWT-principal per R35+R36 — caller-supplied tier parameter REMOVED; wrapper derives acknowledging_tier by lookup against the provider_attempt rows for the calling JWT-verified principal; raises `tier_ownership_unauthorized` if no eligible provider_attempt row OR `tier_ownership_below_current_tier` if derived tier < current escalation_tier. Idempotent via `Idempotency-Key` header. |
| 4 | POST | `/v1/crisis/:crisis_event_id/response` | clinician / care-team-member | `record_crisis_response()` | Record response action; same tier-derivation discipline as endpoint 3. Idempotent. |
| 5 | POST | `/v1/crisis/:crisis_event_id/resolve` | clinician / care-team-member | `record_crisis_resolution()` | Mark resolved (SOLE terminalization path; sets `escalation_tier = NULL` on obligation, dropping row from sweep eligibility); INSERTs `(escalated|responded → resolved / clinician_resolution)` lifecycle transition. Idempotent. |
| 6 | GET | `/v1/crisis/resources` | patient / delegate / **unauthenticated-emergency** | (no wrapper; calls 3 CCR resolvers) | Resource lookup endpoint; calls country_of_care + country_of_residence + country_default CCR resolvers per P-025; returns Crisis Response Card payload (helplines + emergency_number + helpline text); **ONLY platform endpoint accessible without JWT-verified session** per I-019 safety-floor concession — IP-rate-limited 60 req/min; returns ONLY country-default crisis_helplines + emergency_number for unauthenticated calls (NO patient-specific data); does NOT emit Cat A audit on unauthenticated path (no patient identity to bind to). |

**Idempotency:** endpoints 3 + 4 + 5 require `Idempotency-Key` header per canonical IDEMPOTENCY contract (Contracts Pack v5.1).

**Endpoint 6 unauthenticated-emergency posture** (per SI-022 OQ2 + Sub-decision 3 logical recipient 1): deliberate I-019 safety-floor concession. A patient whose session has expired must still be able to retrieve emergency numbers without re-authenticating. Tenant-anonymous fallback path (NOT subject to I-024 tenant isolation; deliberately returns country-default content keyed only by IP geo-lookup or query param `?country=<iso-alpha-2>`). Rate-limited per IP at 60 req/min via canonical rate-limit middleware. No Cat A audit emission on the unauthenticated path; audit emission only when a JWT-verified principal calls the same endpoint.

---

## 6. New state machine `crisis_event_lifecycle` (v1.3 → v1.4)

**1 new state machine** `crisis_event_lifecycle`, DERIVED from append-only `crisis_event_lifecycle_transition` rows per Option A (I-035 conformant; mirrors SI-019 + SI-020 patterns).

### States (5 active + 1 sentinel)

`none` (sentinel; pre-detection bootstrap state used by initial transition only) → `detected` → `acknowledged` → `responded` → `resolved` (terminal); orthogonal escalation tier sub-state `escalated` reachable from any non-resolved state via no_acknowledgement/no_response/response_failed timeouts (and self-loop on `escalated` for multi-tier sweep advances).

### Allowed transition triples (11 enumerated via CHECK constraint per §4.NEW2)

| # | from_state | to_state | transition_reason | Canonical caller |
|---|---|---|---|---|
| 1 | `none` | `detected` | `initial_detection` | `record_crisis_initiation()` wrapper (sole emit site for initial transition) |
| 2 | `detected` | `escalated` | `no_acknowledgement_timeout` | sweep STEP B (first care-team timeout) |
| 3 | `escalated` | `escalated` | `tier_progression_no_acknowledgement` | sweep STEP B (multi-tier advance; care_team → clinical_on_call → regulatory; R8 HIGH-1 closure) |
| 4 | `acknowledged` | `escalated` | `acknowledged_no_response_timeout` | sweep STEP B (clinician acknowledged but did not respond within INTERVAL_for_severity_response_window; R11 HIGH-1 NEW triple) |
| 5 | `responded` | `escalated` | `responded_no_resolution_timeout` | sweep STEP B (clinician responded but crisis not resolved within INTERVAL_for_severity_resolution_window; R11 HIGH-1 NEW triple; distinct from `response_failed`) |
| 6 | `responded` | `escalated` | `response_failed` | clinician-initiated retry path |
| 7 | `detected` | `acknowledged` | `clinician_acknowledgement` | `record_crisis_acknowledgement_claim()` wrapper |
| 8 | `escalated` | `acknowledged` | `clinician_acknowledgement` | `record_crisis_acknowledgement_claim()` wrapper |
| 9 | `acknowledged` | `responded` | `clinician_response` | `record_crisis_response()` wrapper |
| 10 | `responded` | `resolved` | `clinician_resolution` | `record_crisis_resolution()` wrapper |
| 11 | `escalated` | `resolved` | `clinician_resolution` | `record_crisis_resolution()` wrapper (resolution from any non-resolved state; the wrapper does NOT require pre-transition to `responded`) |

**CHECK constraint** materialized on `crisis_event_lifecycle_transition` table (per §4.NEW2 above) — implementer MUST verify all 11 triples are enumerated and ONLY these 11 are accepted. Any transition not in this set raises a CHECK constraint violation at INSERT time (defense-in-depth alongside the BEFORE INSERT trigger continuity check).

**Current-state derivation:** the `current_state` for any crisis_event is the `to_state` of the row with `MAX(transition_at)` (tie-broken by `MAX(id)` for same-tx ordering) per the LATERAL JOIN pattern in `crisis_event_current_state_v` (§4.NEW4 above). Monotonic transition_at invariant enforced by the BEFORE INSERT trigger (per P-038 R2 pattern; backdated rows rejected, future-dated tolerated within `now() + 5s` clock-skew window).

**Terminal state semantics:** `resolved` is terminal; no transitions out. The `notification_crisis_escalation_obligation` row has `escalation_tier = NULL` set by `record_crisis_resolution()` in the same atomic tx, dropping the row from sweep eligibility. `final_tier_exhausted_at` set by sweep STEP E (R13) is orthogonal — it marks terminal-tier-reached-but-not-resolved; the crisis_event remains in `escalated` state with continuing INTERVAL_final_tier_recheck_window sweeps until `record_crisis_resolution()` runs.

---

## 7. New RBAC roles

To be detailed in v0.2; preliminary enumeration: 6 application roles + 4 wrapper-owner roles + 1 raw writer owner + 1 view owner + 1 sweep-worker role = 13 net-new roles. Reconcile against §10 deployment preflight after §3 procedure-spec close-out.

---

## 8. Deployment preflight + cutover sequencing

To be detailed in v0.2; will reuse the post-P-034 R7 SECURITY DEFINER hardening pattern (schema-qualified table refs + locked search_path on all invariant-enforcing trigger functions) + the post-P-036 R6 tables-first-views-last cdm_owner seeding pattern.

---

## 9. Cycle log

**v0.1 DRAFT 2026-05-21:** pre-Codex-review skeleton. Contains §1 purpose + scope + §2 new entities (3 net-new + 3 additive column extensions to P-027 §4.66-4.68 + 1 OPTIONAL derived view) with executable DDL. §3-8 are stubs to be filled in v0.2 against SI-022 §3/§5/§7 normative content. Authored on `spec/P-040-cdm-v1.10-si-022-follow-on-2026-05-21` branch off main at `520565a` (post-P-039 merge). Commit `2f88322`.

**v0.2 DRAFT 2026-05-21:** §4 audit events normative table filled in vs SI-022 v1.0 §3 normative content; §5 OpenAPI 6 endpoints filled in vs SI-022 v1.0 §5; §6 state machine 11 transition triples filled in vs SI-022 v1.0 §6 (post-R8+R11 expansion). §1 AUDIT_EVENTS scope reconciled: per-row category labels (7 Cat A + 0 Cat B + 5 Cat C; total 12) are authoritative; SI-022 v1.0 §3 summary tally drift ("8 Cat A + 4 Cat C") flagged for downstream prose-correction PR after P-040 lands. §3 (procedures), §7 (RBAC), §8 (preflight) remain stubs to be filled in v0.3.
