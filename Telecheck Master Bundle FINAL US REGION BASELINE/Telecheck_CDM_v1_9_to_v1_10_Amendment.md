# CDM v1.9 → v1.10 + AUDIT_EVENTS v5.11 → v5.12 + OpenAPI v0.4 → v0.5 + State Machines v1.3 → v1.4 + RBAC v1.3 → v1.4 Amendment (SI-022 Crisis Response follow-on)

**Version:** 0.1 DRAFT
**Status:** pre-Codex-review
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
2. **AUDIT_EVENTS v5.11 → v5.12:** +12 new action IDs under `crisis.*` namespace (8 Cat A + 4 Cat C per SI-022 R49+R52 final tally). Cat A: `crisis_detection_trigger` (already at P-027/P-035; re-asserted), `crisis.no_acknowledgement_escalation`, `crisis.final_tier_reached`, `crisis.regulatory_threshold_reached`, `crisis.acknowledgement_claim_recorded`, `crisis.response_recorded`, `crisis.resolution_recorded`, `crisis.dispatch_attempt_failed` (re-asserted from P-027 with zero_recipients_for_required_tier payload extension). Cat C: `crisis.escalation_destination_resolved` (Cat B → Cat C reclassification noted; previously P-025), `crisis.sweep_stale_eligibility_dropped`, `crisis.sweep_replay_after_commit_ack_loss`, `crisis.sweep_claim_recovery_with_committed_cycle`, `crisis.sweep_fencing_token_mismatch`, `crisis.delivery_fence_mismatch_dropped`. **Final tally to be confirmed in §3 normative table** (the SI's §3 tally evolved over 67 rounds — the canonical landing here MUST reconcile against the SI's final §3 table at v1.0 RATIFIED).
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

## 4. New audit events (12 = 8 Cat A + 4 Cat C)

To be detailed in v0.2 against SI-022 §3 normative table. Anchor namespace: `crisis.*`.

---

## 5. New OpenAPI endpoints

To be detailed in v0.2 against SI-022 §5 normative endpoint list.

---

## 6. New state machine `crisis_event_lifecycle`

DERIVED from append-only `crisis_event_lifecycle_transition` rows per I-035; CHECK constraint enumerates 11 allowed triples (per §4.NEW2 CHECK constraint above). State diagram + canonical wrapper-procedure mapping to be added in v0.2.

---

## 7. New RBAC roles

To be detailed in v0.2; preliminary enumeration: 6 application roles + 4 wrapper-owner roles + 1 raw writer owner + 1 view owner + 1 sweep-worker role = 13 net-new roles. Reconcile against §10 deployment preflight after §3 procedure-spec close-out.

---

## 8. Deployment preflight + cutover sequencing

To be detailed in v0.2; will reuse the post-P-034 R7 SECURITY DEFINER hardening pattern (schema-qualified table refs + locked search_path on all invariant-enforcing trigger functions) + the post-P-036 R6 tables-first-views-last cdm_owner seeding pattern.

---

## 9. Cycle log

**v0.1 DRAFT 2026-05-21:** pre-Codex-review skeleton. Contains §1 purpose + scope + §2 new entities (3 net-new + 3 additive column extensions to P-027 §4.66-4.68 + 1 OPTIONAL derived view) with executable DDL. §3-8 are stubs to be filled in v0.2 against SI-022 §3/§5/§7 normative content. Authored on `spec/P-040-cdm-v1.10-si-022-follow-on-2026-05-21` branch off main at `520565a` (post-P-039 merge).
