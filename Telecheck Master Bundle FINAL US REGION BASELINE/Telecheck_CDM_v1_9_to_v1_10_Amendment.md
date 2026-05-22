# CDM v1.9 → v1.10 + AUDIT_EVENTS v5.11 → v5.12 + OpenAPI v0.4 → v0.5 + State Machines v1.3 → v1.4 + RBAC v1.3 → v1.4 Amendment (SI-022 Crisis Response follow-on)

**Version:** 0.4 DRAFT
**Status:** POST-R1 (3 HIGH closed inline: R1 HIGH-1 backfill path could not satisfy NOT NULL FK on existing P-027 rows — added explicit legacy-row migration coverage preflight assertion class (E0a/b/c) checking dispatch_ledger + provider_attempt + escalation_obligation orphan-row resolvability via (tenant_id, server_signal_id) → crisis_event.id lookup before Phase 3 NOT NULL ALTER; if any orphan row lacks resolvable match, deploy MUST author legacy-source synthesis migration first. For day-1 pilot tenants Telecheck-US (Heros-US greenfield) + Telecheck-Ghana, the assertion passes trivially because there are zero existing notification_crisis_* rows; the assertion exists as defense for any future environment migration. R1 HIGH-2 crisis_event_reader role was over-broadly granted to both clinicians AND patients/delegates — DB-level grant didn't enforce the patient/delegate predicate, so any SQL client or future endpoint using the role could read tenant-wide crisis state with only tenant RLS protection. Fix: split reader-view pair per P-038 R5 HIGH-1 pattern. Added §4.NEW4a crisis_event_patient_summary_v patient/delegate self-scoped view with verify_session_jwt_and_extract_claims() + consent_grant predicate enforcing per-row visibility to caller's own patient_id OR delegated patient_ids only. Roles: crisis_event_staff_reader (clinician + care-team + admin; tenant-wide view) and crisis_event_patient_reader (patient + delegate; predicate-restricted view). 3-layer enforcement: RBAC + view predicate + RLS. RBAC count 13 → 15 net-new roles. R1 HIGH-3 view DDL had WITH (security_barrier=true) but missing security_invoker=true — only in prose. Without security_invoker the view would run under owner privileges, bypassing caller-scoped RLS on underlying tables. Fix: corrected DDL to WITH (security_invoker = true, security_barrier = true) on both views (current_state_v + patient_summary_v); added §8.1 preflight assertion class (F) verifying both views have security_invoker=true in pg_class.reloptions after CREATE VIEW.)
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

1. **CDM v1.9 → v1.10:** +3 new entities (`crisis_event`, `crisis_event_lifecycle_transition`, `crisis_sweep_execution`) + additive column extensions to 3 P-027 §4.66-4.68 entities (`notification_crisis_dispatch_ledger`, `notification_crisis_provider_attempt`, `notification_crisis_escalation_obligation`) + 2 OPTIONAL canonical views per R1 HIGH-2 closure 2026-05-21 data-minimization split (`crisis_event_current_state_v` staff tenant-wide reader + `crisis_event_patient_summary_v` patient/delegate self-scoped reader — DERIVED from append-only lifecycle transitions) + **6 SECURITY DEFINER procedures owned by 5 distinct owner roles**: the 7 procedures are (1) raw `record_crisis_event_lifecycle_transition()` owned by `crisis_event_lifecycle_transition_writer_owner`; (2)–(6) five wrapper procedures owned by 4 wrapper-owner roles: `record_crisis_initiation()` (crisis_initiation_wrapper_owner), `record_crisis_acknowledgement_claim()` (crisis_acknowledgement_wrapper_owner), `record_crisis_response()` (crisis_response_wrapper_owner), `record_crisis_resolution()` (crisis_resolution_wrapper_owner), and `execute_crisis_no_acknowledgement_sweep()` (crisis_sweep_wrapper_owner). Total: 1 raw procedure + 5 wrapper procedures = 6 procedures; 1 raw owner + 4 wrapper owners = 5 procedure-owner roles. Continuing CDM numbering from v1.9's 96 active entities + 7 derived views + 1 optional MV; v1.10 target: 99 active entities + 8 derived views + 1 optional MV.
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
WITH (security_invoker = true, security_barrier = true) AS
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
-- R1 HIGH-3 closure 2026-05-21: `security_invoker = true` is now in the executable DDL above
-- (NOT just prose). Without it the view would run under the owner's privileges and bypass
-- caller-scoped RLS on the underlying tables. The §8.1 deployment preflight DO block asserts
-- the view has security_invoker=true after creation (see §8.1 assertion class F).
-- View owner is crisis_event_current_state_view_owner (non-BYPASSRLS).
-- R1 HIGH-2 closure 2026-05-21: GRANT SELECT split between two distinct reader roles —
-- `crisis_event_staff_reader` for tenant-wide clinician/care-team access, and
-- `crisis_event_patient_reader` for predicate-restricted patient/delegate access via a
-- SEPARATE patient-summary view (`crisis_event_patient_summary_v`, see §4.NEW4a). Patient/delegate
-- principals do NOT receive SELECT on this tenant-wide view; they receive SELECT only on the
-- predicate-restricted view. Same data-minimization split pattern as P-038 R5 HIGH-1.
```

### §4.NEW4a — `crisis_event_patient_summary_v` (CDM v1.10 NEW per R1 HIGH-2 closure 2026-05-21; patient/delegate self-scoped view)

```sql
CREATE VIEW crisis_event_patient_summary_v
WITH (security_invoker = true, security_barrier = true) AS
WITH vc AS (
    SELECT verified_tenant_id, verified_patient_id, verified_delegate_id
    FROM verify_session_jwt_and_extract_claims()
)
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
    obligation.escalation_tier,
    obligation.sweep_cycle_counter,
    obligation.final_tier_exhausted_at,
    obligation.undeliverable_deadline
FROM crisis_event ce
JOIN vc ON ce.tenant_id = vc.verified_tenant_id
LEFT JOIN LATERAL (
    SELECT to_state, transition_at
    FROM crisis_event_lifecycle_transition lt
    WHERE lt.tenant_id = ce.tenant_id AND lt.crisis_event_id = ce.id
    ORDER BY lt.transition_at DESC, lt.id DESC
    LIMIT 1
) latest ON TRUE
LEFT JOIN notification_crisis_escalation_obligation obligation
    ON obligation.tenant_id = ce.tenant_id AND obligation.crisis_event_id = ce.id
WHERE
    -- Patient principal path: caller IS the patient
    ce.patient_id = vc.verified_patient_id
    -- Delegate principal path: caller IS a delegate WITH active emergency_contact_share consent
    OR (vc.verified_delegate_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM consent_grant cg
            WHERE cg.tenant_id = ce.tenant_id
              AND cg.delegate_principal_id = vc.verified_delegate_id
              AND cg.patient_id = ce.patient_id
              AND cg.scope_name = 'emergency_contact_share'
              AND cg.status = 'active'
              AND (cg.expires_at IS NULL OR cg.expires_at > now())
        ));

ALTER VIEW crisis_event_patient_summary_v OWNER TO crisis_event_patient_summary_view_owner;
REVOKE ALL ON crisis_event_patient_summary_v FROM PUBLIC;
GRANT SELECT ON crisis_event_patient_summary_v TO crisis_event_patient_reader;
```

**R1 HIGH-2 closure 2026-05-21 (data-minimization split per P-038 R5 HIGH-1 pattern):** the two reader-view pairs are:

| View | Owner role | Reader role | Caller-class | Visibility |
|---|---|---|---|---|
| `crisis_event_current_state_v` | `crisis_event_current_state_view_owner` | `crisis_event_staff_reader` | clinician + care-team-member + admin | tenant-wide (clinical triage queue) |
| `crisis_event_patient_summary_v` | `crisis_event_patient_summary_view_owner` | `crisis_event_patient_reader` | patient + delegate (IFF active emergency_contact_share consent) | self-scoped — caller's own patient_id OR delegated patient_ids only, enforced in view predicate via verify_session_jwt_and_extract_claims() + consent_grant join |

Patient/delegate principals do NOT receive `crisis_event_staff_reader` membership; staff principals do NOT receive `crisis_event_patient_reader` membership. The endpoint dispatch table is updated: `/v1/crisis/active` reads `crisis_event_current_state_v` (staff reader role required); `/v1/crisis/mine` reads `crisis_event_patient_summary_v` (patient reader role required). DB-level grants enforce the role-class boundary; the view predicate enforces the per-row patient/delegate scope; tenant RLS on underlying tables enforces tenant isolation. Three layers of enforcement (RBAC + view predicate + RLS) — no single-layer bypass can leak crisis state across patients.

---

## 3. New SECURITY DEFINER procedures (6 procedures owned by 5 owner roles)

Six SECURITY DEFINER procedures land at v1.10 — one raw append-only writer to `crisis_event_lifecycle_transition` plus five caller-class wrappers. All procedures are schema-qualified + locked search_path per the canonical P-034 R7 hardening pattern + the canonical P-038 R4 invariant-trigger hardening pattern. EXECUTE grants on the raw writer are restricted exclusively to the 5 wrapper-owner roles enumerated below — no other roles receive EXECUTE on the raw writer (anti-bypass enforcement; matches the canonical anti-bypass discipline established at P-034 §3 + P-038 §3 R9 MED-1 closure).

### §3.1 — `record_crisis_event_lifecycle_transition()` (RAW writer; owner: `crisis_event_lifecycle_transition_writer_owner`)

```sql
CREATE FUNCTION record_crisis_event_lifecycle_transition(
    p_tenant_id tenant_id_t,
    p_crisis_event_id UUID,
    p_from_state TEXT,
    p_to_state TEXT,
    p_transition_reason TEXT,
    p_actor_principal_id UUID,
    p_transition_payload JSONB
) RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_transition_id BIGINT;
BEGIN
    INSERT INTO public.crisis_event_lifecycle_transition (
        tenant_id, crisis_event_id, from_state, to_state, transition_reason,
        transition_at, actor_principal_id, transition_payload
    ) VALUES (
        p_tenant_id, p_crisis_event_id, p_from_state, p_to_state, p_transition_reason,
        now(), p_actor_principal_id, p_transition_payload
    )
    RETURNING id INTO v_transition_id;
    RETURN v_transition_id;
END;
$$;

ALTER FUNCTION record_crisis_event_lifecycle_transition(
    tenant_id_t, UUID, TEXT, TEXT, TEXT, UUID, JSONB
) OWNER TO crisis_event_lifecycle_transition_writer_owner;

REVOKE EXECUTE ON FUNCTION record_crisis_event_lifecycle_transition(
    tenant_id_t, UUID, TEXT, TEXT, TEXT, UUID, JSONB
) FROM PUBLIC;

-- EXECUTE granted to EXACTLY the 5 wrapper-owner roles enumerated below.
-- No other roles receive EXECUTE on the raw writer (P-034 + P-038 anti-bypass discipline).
GRANT EXECUTE ON FUNCTION record_crisis_event_lifecycle_transition(
    tenant_id_t, UUID, TEXT, TEXT, TEXT, UUID, JSONB
) TO crisis_initiation_wrapper_owner,
     crisis_acknowledgement_wrapper_owner,
     crisis_response_wrapper_owner,
     crisis_resolution_wrapper_owner,
     crisis_sweep_wrapper_owner;
```

The raw writer is the canonical append-only state-transition boundary. The 11-triple CHECK constraint (per §4.NEW2) + the BEFORE INSERT continuity/monotonic trigger together enforce that no invalid or backdated transition can land regardless of caller. The raw writer is therefore the SOLE INSERT path into `crisis_event_lifecycle_transition`; direct INSERTs by application roles are rejected at the privilege boundary (no role other than these 5 wrapper owners has INSERT privilege via the writer; base-table INSERTs are also revoked from PUBLIC).

### §3.2 — `record_crisis_initiation()` (wrapper; owner: `crisis_initiation_wrapper_owner`)

Called by Mode 1 handler in the same atomic transaction as the FLOOR-020 `crisis_detection_trigger` Cat A emit + the `crisis_event` INSERT + the `(none → detected / initial_detection)` lifecycle transition + the `crisis.detected` Cat A emit. Enforces 3-layer tenant config validation per R63/R65: asserts fanout_channels[] non-empty + clinical_on_call_channel/recipient/principal_id non-null + (IFF regulatory_reporting=true) operator_escalation_channel/recipient/principal_id non-null + (IFF emergency_contact_consent_enabled=true) emergency_contact_channel non-null; fail-closed emits `crisis.dispatch_attempt_failed` Cat C with payload `runtime_validation_failed=true` + the specific missing key list. Allocates the `notification_crisis_escalation_obligation` row with `sweep_cycle_counter = 1` + `escalation_tier = 'care_team'` + the initial `undeliverable_deadline`. Returns the new `crisis_event_id`.

Signature: `record_crisis_initiation(p_tenant_id, p_patient_id, p_server_signal_id, p_crisis_type, p_severity, p_regulatory_reporting_enabled, p_intake_payload_envelope) RETURNS UUID`.

### §3.3 — `record_crisis_acknowledgement_claim()` (wrapper; owner: `crisis_acknowledgement_wrapper_owner`)

Caller MUST pass `Idempotency-Key` per IDEMPOTENCY contract. Tier-derived-from-JWT-principal per SI-022 R35+R36: NO caller-supplied tier parameter — the wrapper looks up the caller's `recipient_role` by joining `notification_crisis_provider_attempt` on `recipient_principal_id = (verify_session_jwt_and_extract_claims()).principal_id`, derives `acknowledging_tier` from recipient_role per the canonical mapping (care_team → 'care_team' tier; clinical_on_call → 'clinical_on_call' tier; operator_escalation → 'regulatory' tier), and rejects (raises `tier_ownership_unauthorized`) if no eligible provider_attempt row exists. Additional R36 HIGH-1 guard: rejects (raises `tier_ownership_below_current_tier`) if `acknowledging_tier < current_escalation_tier` (prevents lower-tier acknowledgement from repeatedly resetting deadlines + suppressing escalation pressure). On success: (a) INSERTs `crisis_event_lifecycle_transition` via raw writer with reason `clinician_acknowledgement` (from_state derived from current state); (b) UPDATEs `notification_crisis_escalation_obligation` resetting `undeliverable_deadline = now() + INTERVAL_for_severity_response_window` + `escalation_tier = GREATEST(current, acknowledging_tier)` per R34 HIGH-2; (c) emits `crisis.acknowledged` Cat A audit in same tx.

Signature: `record_crisis_acknowledgement_claim(p_tenant_id, p_crisis_event_id, p_idempotency_key) RETURNS VOID`.

### §3.4 — `record_crisis_response()` (wrapper; owner: `crisis_response_wrapper_owner`)

Same tier-derivation discipline as §3.3. Idempotent. INSERTs lifecycle transition with reason `clinician_response` (from `acknowledged → responded`); resets `undeliverable_deadline = now() + INTERVAL_for_severity_resolution_window`; sets `escalation_tier = GREATEST(current, responding_tier)`. Emits `crisis.responded` Cat A audit.

Signature: `record_crisis_response(p_tenant_id, p_crisis_event_id, p_response_type, p_response_payload, p_idempotency_key) RETURNS VOID`.

### §3.5 — `record_crisis_resolution()` (wrapper; owner: `crisis_resolution_wrapper_owner`)

**SOLE terminalization path** per SI-022 R11 closure. Same tier-derivation discipline. Idempotent. INSERTs lifecycle transition with reason `clinician_resolution` (from `responded → resolved` OR `escalated → resolved`); atomically sets `notification_crisis_escalation_obligation.escalation_tier = NULL` to drop the row from sweep eligibility (R10 BACKSTOP). Emits `crisis.resolved` Cat A audit.

Signature: `record_crisis_resolution(p_tenant_id, p_crisis_event_id, p_resolution_outcome, p_resolution_payload, p_idempotency_key) RETURNS VOID`.

### §3.6 — `execute_crisis_no_acknowledgement_sweep()` (wrapper; owner: `crisis_sweep_wrapper_owner`)

Per-row STEP A→F atomic transaction per SI-022 Sub-decision 6 canonical contract:

- **STEP A** (R53 guarded UPDATE): atomic eligibility-revalidation + sweep_cycle_counter increment via UPDATE-RETURNING on `notification_crisis_escalation_obligation`. Predicates: `now() > undeliverable_deadline AND escalation_key IS NULL AND escalation_tier IS NOT NULL AND lifecycle.current_state IN (4 valid states) AND sweep_cycle_counter+1 = $execution.scheduled_for_obligation_generation`. ROW_COUNT=0 → ROLLBACK + emit `crisis.sweep_stale_eligibility_dropped` Cat C in separate autocommit tx + mark execution completed-as-stale-no-op + EXIT.
- **STEP B**: INSERT `crisis_event_lifecycle_transition` via raw writer with 4-way reason mapping from current_state (R12 HIGH-2).
- **STEP C**: INSERT `notification_crisis_provider_attempt` rows via `INSERT...SELECT...FROM compute_crisis_recipient_mapping(crisis_event_id, severity, target_tier) ON CONFLICT ON CONSTRAINT notification_crisis_provider_attempt_idempotency_uk DO NOTHING` (R28+R39+R64). Then EXISTENCE invariant verification: `SELECT COUNT(*) FROM provider_attempt WHERE tenant_id+crisis_event_id+sweep_cycle_id matches` MUST equal mapping cardinality (R60 HIGH-1). Zero-recipients fail-closed for target_tier ∈ {care_team, clinical_on_call, regulatory} per R63 HIGH-2 + R64 HIGH-2: ROLLBACK + `crisis.dispatch_attempt_failed` Cat C with `zero_recipients_for_required_tier=true`.
- **STEP D**: emit `crisis.no_acknowledgement_escalation` Cat A audit co-transactional.
- **STEP E**: tier ADVANCE UPDATE on `notification_crisis_escalation_obligation`: `escalation_tier = next_tier(current_tier, severity, regulatory_reporting)`; reschedule `undeliverable_deadline = now() + INTERVAL_for_severity_and_tier(next, severity)`; on `next_tier(...) IS NULL` (terminal), preserve escalation_tier + set `final_tier_exhausted_at = now()` (R13 HIGH-1) + emit `crisis.final_tier_reached` Cat A once.
- **STEP F**: final guarded UPDATE on `crisis_sweep_execution`: sets `completed_at = now()` + `sweep_cycle_id_committed = v_sweep_cycle_id` atomically; predicate `WHERE sweep_execution_id=$ AND claimed_by_worker_id=$ AND fencing_token=$captured AND completed_at IS NULL AND claim_expires_at > now()` (triple-guard per R46 + R47 + R51). 0 rows → takeover occurred mid-tx → raise `sweep_fencing_token_mismatch_at_commit` + ROLLBACK.

Signature: `execute_crisis_no_acknowledgement_sweep(p_sweep_execution_id, p_worker_id, p_captured_fencing_token) RETURNS VOID`.

**Anti-bypass discipline:** the 5 wrapper-owner roles + the 1 raw-writer-owner role = exactly 6 distinct owner roles. No other procedure-owner roles receive EXECUTE on `record_crisis_event_lifecycle_transition()`. Application roles (crisis_initiator, crisis_acknowledger, crisis_responder, crisis_resolver, crisis_sweep_scheduler) receive EXECUTE on the corresponding wrapper procedure ONLY (NOT on the raw writer). The wrapper procedures are the SOLE entry points into the crisis state machine; the CHECK constraint on `crisis_event_lifecycle_transition` (11 triples) provides defense-in-depth at the schema layer even if a privilege boundary is bypassed.

---

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

## 7. New RBAC roles (v1.3 → v1.4: +13 net-new roles)

Final enumeration reconciled against §3 procedure spec + §8 deployment preflight:

### Application roles (6)

| Role | Granted to | Permissions |
|---|---|---|
| `crisis_initiator` | Mode 1 AI Service handler service account | EXECUTE on `record_crisis_initiation()` |
| `crisis_acknowledger` | clinician role + care-team-member role | EXECUTE on `record_crisis_acknowledgement_claim()` |
| `crisis_responder` | clinician role + care-team-member role | EXECUTE on `record_crisis_response()` |
| `crisis_resolver` | clinician role + care-team-member role | EXECUTE on `record_crisis_resolution()` |
| `crisis_sweep_scheduler` | scheduled-job service account | EXECUTE on `execute_crisis_no_acknowledgement_sweep()` + INSERT on `crisis_sweep_execution` (for scheduling new sweep work items) + UPDATE on `crisis_sweep_execution` columns `(claimed_by_worker_id, claim_expires_at, fencing_token, heartbeat_at)` ONLY (NOT on `completed_at` or `sweep_cycle_id_committed` — those are set by the sweep wrapper itself under SECURITY DEFINER context) |
| `crisis_event_staff_reader` | clinician + care-team-member + admin | SELECT on `crisis_event_current_state_v` (tenant-wide; clinical triage queue) — R1 HIGH-2 closure 2026-05-21 split |
| `crisis_event_patient_reader` | patient + delegate (latter IFF active emergency_contact_share consent grant) | SELECT on `crisis_event_patient_summary_v` (self-scoped predicate-restricted view) — R1 HIGH-2 closure 2026-05-21 split |

### Wrapper-owner roles (5; non-application)

| Role | Owns procedure | Holds EXECUTE on raw writer |
|---|---|---|
| `crisis_initiation_wrapper_owner` | `record_crisis_initiation()` | YES |
| `crisis_acknowledgement_wrapper_owner` | `record_crisis_acknowledgement_claim()` | YES |
| `crisis_response_wrapper_owner` | `record_crisis_response()` | YES |
| `crisis_resolution_wrapper_owner` | `record_crisis_resolution()` | YES |
| `crisis_sweep_wrapper_owner` | `execute_crisis_no_acknowledgement_sweep()` | YES |

### Raw-writer-owner role (1)

| Role | Owns | Notes |
|---|---|---|
| `crisis_event_lifecycle_transition_writer_owner` | `record_crisis_event_lifecycle_transition()` raw writer | Non-BYPASSRLS; the writer itself runs SECURITY DEFINER so the writer's tenant-context binding is the JWT-verified context of the caller, not the role's own. EXECUTE granted to exactly the 5 wrapper-owner roles above — no other roles. |

### View-owner roles (2; per R1 HIGH-2 closure 2026-05-21 split)

| Role | Owns | Notes |
|---|---|---|
| `crisis_event_current_state_view_owner` | `crisis_event_current_state_v` (staff tenant-wide) | Non-BYPASSRLS; view uses `security_invoker=true` + `security_barrier=true` so RLS on underlying tables is enforced against the caller's privileges. GRANT SELECT only to `crisis_event_staff_reader`. |
| `crisis_event_patient_summary_view_owner` | `crisis_event_patient_summary_v` (patient/delegate self-scoped) | Non-BYPASSRLS; same security_invoker+security_barrier flags; view body uses verify_session_jwt_and_extract_claims() + consent_grant predicate to restrict per-row visibility to caller's own patient_id OR delegated patient_ids only. GRANT SELECT only to `crisis_event_patient_reader`. |

**Total: 15 net-new roles** (7 application + 5 wrapper-owner + 1 raw-writer-owner + 2 view-owner; per R1 HIGH-2 closure 2026-05-21 the 6-application count becomes 7 because `crisis_event_reader` is split into `crisis_event_staff_reader` + `crisis_event_patient_reader`, AND the 1-view-owner count becomes 2 because the views are split). Matches §1 enumeration (updated). RBAC v1.3 → v1.4 count: prior 13 cycle baseline (P-038) + 15 net-new = bundle RBAC v1.4 total to be reconciled at §8 deployment preflight against canonical RBAC v1.3 enumeration.

---

## 8. Deployment preflight + cutover sequencing

### §8.1 — Deployment preflight DO block

Fail-closed assertions at deployment time per the canonical post-P-034 R7 SECURITY DEFINER hardening pattern + the SI-022 §7 Part A + Part B + Part C enforcement contract (per R63 + R65 closures). Implementer MUST run the following DO block as part of the deploy gate; any FAILED assertion blocks the deploy:

```sql
DO $$
DECLARE
    v_role_missing TEXT;
    v_entity_seed_missing TEXT;
    v_tenant_config_missing JSONB;
BEGIN
    -- (A) Verify the 15 net-new RBAC roles exist (R1 HIGH-2 closure 2026-05-21:
    -- crisis_event_reader split into crisis_event_staff_reader + crisis_event_patient_reader;
    -- 1 view-owner becomes 2: crisis_event_current_state_view_owner + crisis_event_patient_summary_view_owner)
    FOR v_role_missing IN
        SELECT unnest(ARRAY[
            'crisis_initiator', 'crisis_acknowledger', 'crisis_responder', 'crisis_resolver',
            'crisis_sweep_scheduler',
            'crisis_event_staff_reader', 'crisis_event_patient_reader',
            'crisis_initiation_wrapper_owner', 'crisis_acknowledgement_wrapper_owner',
            'crisis_response_wrapper_owner', 'crisis_resolution_wrapper_owner',
            'crisis_sweep_wrapper_owner', 'crisis_event_lifecycle_transition_writer_owner',
            'crisis_event_current_state_view_owner', 'crisis_event_patient_summary_view_owner'
        ])
        EXCEPT SELECT rolname FROM pg_roles
    LOOP
        RAISE EXCEPTION 'crisis-rbac-role-missing: %', v_role_missing;
    END LOOP;

    -- (B) Verify the 4 jwt_migration_entity_status seed rows exist with the canonical defaults
    FOR v_entity_seed_missing IN
        SELECT unnest(ARRAY[
            'crisis_event', 'crisis_event_lifecycle_transition',
            'crisis_sweep_execution', 'crisis_event_current_state_v'
        ])
        EXCEPT SELECT entity_name FROM public.jwt_migration_entity_status
        WHERE phase_4_cutover_eligible = FALSE AND raw_guc_fallback_audited = TRUE
    LOOP
        RAISE EXCEPTION 'crisis-jwt-migration-seed-missing-or-incorrect: %', v_entity_seed_missing;
    END LOOP;

    -- (C) Tenant config Part A (every tenant; R22+R63 every-tenant rule):
    SELECT jsonb_agg(jsonb_build_object('tenant_id', tenant_id, 'missing', missing_keys))
    INTO v_tenant_config_missing
    FROM (
        SELECT tenant_id,
               array_remove(ARRAY[
                   CASE WHEN cardinality(crisis_fanout_channels) = 0 THEN 'crisis.fanout_channels[]' END,
                   CASE WHEN crisis_clinical_on_call_channel IS NULL THEN 'crisis.clinical_on_call_channel' END,
                   CASE WHEN NOT (crisis_clinical_on_call_channel = ANY(crisis_fanout_channels))
                        THEN 'crisis.clinical_on_call_channel-not-in-fanout' END,
                   CASE WHEN crisis_clinical_on_call_recipient IS NULL
                        THEN 'crisis.clinical_on_call_recipient' END,
                   CASE WHEN crisis_clinical_on_call_principal_id IS NULL
                        THEN 'crisis.clinical_on_call_principal_id' END,
                   CASE WHEN crisis_clinical_on_call_principal_id IS NOT NULL
                        AND NOT EXISTS (SELECT 1 FROM principal p
                                        WHERE p.tenant_id = t.tenant_id
                                          AND p.id = crisis_clinical_on_call_principal_id)
                        THEN 'crisis.clinical_on_call_principal_id-no-principal' END
               ], NULL) AS missing_keys
        FROM tenant_config t
    ) per_tenant
    WHERE cardinality(missing_keys) > 0;
    IF v_tenant_config_missing IS NOT NULL THEN
        RAISE EXCEPTION 'crisis-tenant-config-part-a-violations: %', v_tenant_config_missing::TEXT;
    END IF;

    -- (D) Tenant config Part B (regulatory_reporting=true only; R19+R65):
    SELECT jsonb_agg(jsonb_build_object('tenant_id', tenant_id, 'missing', missing_keys))
    INTO v_tenant_config_missing
    FROM (
        SELECT tenant_id,
               array_remove(ARRAY[
                   CASE WHEN crisis_operator_escalation_channel IS NULL
                        THEN 'crisis.operator_escalation_channel' END,
                   CASE WHEN crisis_operator_escalation_recipient IS NULL
                        THEN 'crisis.operator_escalation_recipient' END,
                   CASE WHEN crisis_operator_escalation_principal_id IS NULL
                        THEN 'crisis.operator_escalation_principal_id' END,
                   CASE WHEN crisis_operator_escalation_channel IS NOT NULL
                        AND NOT (crisis_operator_escalation_channel = ANY(crisis_fanout_channels))
                        THEN 'crisis.operator_escalation_channel-not-in-fanout' END,
                   CASE WHEN crisis_operator_escalation_principal_id IS NOT NULL
                        AND NOT EXISTS (SELECT 1 FROM principal p
                                        WHERE p.tenant_id = t.tenant_id
                                          AND p.id = crisis_operator_escalation_principal_id)
                        THEN 'crisis.operator_escalation_principal_id-no-principal' END
               ], NULL) AS missing_keys
        FROM tenant_config t
        WHERE regulatory_reporting_enabled = TRUE
    ) per_tenant
    WHERE cardinality(missing_keys) > 0;
    IF v_tenant_config_missing IS NOT NULL THEN
        RAISE EXCEPTION 'crisis-tenant-config-part-b-violations: %', v_tenant_config_missing::TEXT;
    END IF;

    -- (R1 HIGH-1 closure 2026-05-21 — legacy-row migration coverage assertion):
    -- This amendment's Phase 3 backfills `crisis_event_id` onto P-027 §4.66-4.68 rows via
    -- (tenant_id, server_signal_id) -> crisis_event.id lookup BEFORE the NOT NULL ALTER.
    -- For the day-1 pilot tenants (Telecheck-US / Heros-US greenfield + Telecheck-Ghana),
    -- there are ZERO existing notification_crisis_* rows. If any environment ever attempts
    -- this cutover with pre-existing rows lacking corresponding crisis_event rows, the
    -- NOT NULL ALTER would either fail (column null) or strand orphaned rows (column
    -- backfilled to placeholder uuid). Preflight asserts coverage:
    -- (E0a) all dispatch_ledger rows have either crisis_event_id set OR can resolve via
    --       (tenant_id, server_signal_id) -> crisis_event.id;
    -- (E0b) same for provider_attempt;
    -- (E0c) same for escalation_obligation.
    -- If coverage is incomplete, the deploy MUST author legacy-source synthesis migration
    -- creating audited crisis_event rows for each orphan BEFORE proceeding to Phase 3.
    PERFORM 1 FROM public.notification_crisis_dispatch_ledger d
    WHERE d.crisis_event_id IS NULL
      AND NOT EXISTS (
          SELECT 1 FROM public.crisis_event ce
          WHERE ce.tenant_id = d.tenant_id AND ce.server_signal_id = d.server_signal_id
      )
    LIMIT 1;
    IF FOUND THEN
        RAISE EXCEPTION 'crisis-backfill-coverage-violation: dispatch_ledger has orphan rows with no resolvable crisis_event match — author legacy-source synthesis migration before Phase 3 NOT NULL ALTER';
    END IF;
    PERFORM 1 FROM public.notification_crisis_provider_attempt p
    WHERE p.crisis_event_id IS NULL
      AND NOT EXISTS (
          SELECT 1 FROM public.crisis_event ce
          WHERE ce.tenant_id = p.tenant_id AND ce.server_signal_id = p.server_signal_id
      )
    LIMIT 1;
    IF FOUND THEN
        RAISE EXCEPTION 'crisis-backfill-coverage-violation: provider_attempt has orphan rows with no resolvable crisis_event match';
    END IF;
    PERFORM 1 FROM public.notification_crisis_escalation_obligation o
    WHERE o.crisis_event_id IS NULL
      AND NOT EXISTS (
          SELECT 1 FROM public.crisis_event ce
          WHERE ce.tenant_id = o.tenant_id AND ce.server_signal_id = o.server_signal_id
      )
    LIMIT 1;
    IF FOUND THEN
        RAISE EXCEPTION 'crisis-backfill-coverage-violation: escalation_obligation has orphan rows with no resolvable crisis_event match';
    END IF;

    -- (F) R1 HIGH-3 closure 2026-05-21 — view security_invoker assertion. The DDL specifies
    -- WITH (security_invoker = true, security_barrier = true); verify the reloptions actually
    -- materialized that way after CREATE VIEW. Without security_invoker=true the view would
    -- run under owner privileges and bypass caller-scoped RLS on underlying crisis_event +
    -- crisis_event_lifecycle_transition + notification_crisis_escalation_obligation tables.
    PERFORM 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('crisis_event_current_state_v', 'crisis_event_patient_summary_v')
      AND c.relkind = 'v'
      AND NOT ('security_invoker=true' = ANY(c.reloptions));
    IF FOUND THEN
        RAISE EXCEPTION 'crisis-view-security-invoker-missing: at least one of {crisis_event_current_state_v, crisis_event_patient_summary_v} is missing security_invoker=true; re-create the view with WITH (security_invoker = true, security_barrier = true)';
    END IF;

    -- (E) Tenant config Part C (emergency_contact_consent_enabled=true only; R31+R32):
    SELECT jsonb_agg(jsonb_build_object('tenant_id', tenant_id, 'missing', missing_keys))
    INTO v_tenant_config_missing
    FROM (
        SELECT tenant_id,
               array_remove(ARRAY[
                   CASE WHEN crisis_emergency_contact_channel IS NULL
                        THEN 'crisis.emergency_contact_channel' END,
                   CASE WHEN crisis_emergency_contact_channel IS NOT NULL
                        AND NOT (crisis_emergency_contact_channel = ANY(crisis_fanout_channels))
                        THEN 'crisis.emergency_contact_channel-not-in-fanout' END
               ], NULL) AS missing_keys
        FROM tenant_config t
        WHERE emergency_contact_consent_enabled = TRUE
    ) per_tenant
    WHERE cardinality(missing_keys) > 0;
    IF v_tenant_config_missing IS NOT NULL THEN
        RAISE EXCEPTION 'crisis-tenant-config-part-c-violations: %', v_tenant_config_missing::TEXT;
    END IF;
END;
$$;
```

### §8.2 — Cutover sequencing (per P-036 R6 tables-first-views-last cdm_owner seeding pattern)

1. **Phase 1 — RBAC + ownership setup:** Create the 13 net-new RBAC roles via the canonical migration framework. Set role passwords via the canonical KMS-bound credential vault (no plaintext role passwords in migration scripts).
2. **Phase 2 — Tables first:** Create `crisis_event` + `crisis_event_lifecycle_transition` + `crisis_sweep_execution` tables. ALTER existing `notification_crisis_dispatch_ledger` + `notification_crisis_provider_attempt` + `notification_crisis_escalation_obligation` with the additive column extensions (nullable initially per §4.EXT1/EXT2/EXT3).
3. **Phase 3 — Backfill:** For each existing P-027 row (dispatch_ledger / provider_attempt / escalation_obligation), backfill `crisis_event_id` via the per-row `(tenant_id, server_signal_id)` → `crisis_event.id` lookup. (Backfill is a no-op on a greenfield deploy with zero pre-existing crisis_event rows.) After backfill verifies 100% coverage, ALTER `crisis_event_id` columns to `NOT NULL`.
4. **Phase 4 — Triggers:** Create the 2 invariant triggers (`crisis_event_append_only`, `crisis_event_lifecycle_transition_continuity` + monotonic-ordering trigger). All trigger functions schema-qualified + locked search_path per P-034 R7. crisis_sweep_execution's `enforce_terminal_row_immutable` trigger.
5. **Phase 5 — RLS policies:** Enable RLS + create policies on the 3 net-new tables (per §4.NEW1/NEW2/NEW3 above).
6. **Phase 6 — Procedures:** Deploy the 6 SECURITY DEFINER procedures via the canonical procedure-deploy gate (verify SECURITY DEFINER + locked search_path on each); set ownership; grant EXECUTE per §3.1-3.6.
7. **Phase 7 — Views (LAST per P-036 R6):** Create `crisis_event_current_state_v` with `security_invoker=true` + `security_barrier=true`. Set ownership to `crisis_event_current_state_view_owner`. Grant SELECT to `crisis_event_reader`.
8. **Phase 8 — JWT migration entity seed:** INSERT 4 rows into `jwt_migration_entity_status` for the 3 net-new tables + 1 derived view with `phase_4_cutover_eligible=FALSE` + `raw_guc_fallback_audited=TRUE` defaults.
9. **Phase 9 — Audit events registration:** Insert the 12 new `crisis.*` action IDs into the canonical `audit_events_action_definition` table per AUDIT_EVENTS v5.12 schema; verify CHECK constraint accepts the new action IDs (no schema CHECK enumeration change required if AUDIT_EVENTS v5.11→v5.12 was an additive enum extension, which is the established pattern).
10. **Phase 10 — Deployment preflight gate:** Run the §8.1 DO block. Any FAILED assertion BLOCKS cutover. Roll back via `BEGIN; <undo>; COMMIT;` on a per-phase basis if any assertion fails; do NOT proceed to Phase 11.
11. **Phase 11 — OpenAPI endpoint deployment:** Deploy the 6 net-new endpoints under `/v1/crisis/*` via the canonical route-deploy gate. Endpoint 6 (`/v1/crisis/resources`) MUST be registered with the canonical IP-rate-limit middleware at 60 req/min on the unauthenticated path; do NOT register the unauthenticated path without the rate-limit middleware.

### §8.3 — Rollback discipline

On any Phase N failure during cutover, rollback discards Phase N's changes via the transaction context; Phases 1–(N–1) remain. If post-deploy a Phase ≤ 10 defect is detected, a fresh hygiene-cycle PR (P-040.1 pattern matching P-009 v1.10.1 hygiene cycle) closes the defect via additive correction; do NOT attempt destructive rollback of canonical schema once Phase 11 has completed (the OpenAPI endpoints may have served production traffic; rollback would require coordinated data-migration + audit-trail preservation).

---

## 9. Cycle log

**v0.1 DRAFT 2026-05-21:** pre-Codex-review skeleton. Contains §1 purpose + scope + §2 new entities (3 net-new + 3 additive column extensions to P-027 §4.66-4.68 + 1 OPTIONAL derived view) with executable DDL. §3-8 are stubs to be filled in v0.2 against SI-022 §3/§5/§7 normative content. Authored on `spec/P-040-cdm-v1.10-si-022-follow-on-2026-05-21` branch off main at `520565a` (post-P-039 merge). Commit `2f88322`.

**v0.2 DRAFT 2026-05-21:** §4 audit events normative table filled in vs SI-022 v1.0 §3 normative content; §5 OpenAPI 6 endpoints filled in vs SI-022 v1.0 §5; §6 state machine 11 transition triples filled in vs SI-022 v1.0 §6 (post-R8+R11 expansion). §1 AUDIT_EVENTS scope reconciled: per-row category labels (7 Cat A + 0 Cat B + 5 Cat C; total 12) are authoritative; SI-022 v1.0 §3 summary tally drift ("8 Cat A + 4 Cat C") flagged for downstream prose-correction PR after P-040 lands. §3 (procedures), §7 (RBAC), §8 (preflight) remain stubs to be filled in v0.3. Commit `90d8387`.

**v0.4 DRAFT 2026-05-21 — R1 closures applied (3 HIGH):**
- **R1 HIGH-1 closed:** added §8.1 preflight assertion class (E0a/b/c) checking that all existing P-027 dispatch_ledger + provider_attempt + escalation_obligation rows have either crisis_event_id set OR resolvable via (tenant_id, server_signal_id) → crisis_event.id lookup BEFORE Phase 3 NOT NULL ALTER; deploy MUST author legacy-source synthesis migration if any orphan rows exist. Day-1 pilot tenants pass trivially (zero existing rows); assertion is defense-in-depth for future environment migrations.
- **R1 HIGH-2 closed:** split crisis_event_reader role into crisis_event_staff_reader (tenant-wide; clinician/care-team/admin) + crisis_event_patient_reader (self-scoped; patient/delegate); added §4.NEW4a crisis_event_patient_summary_v view with verify_session_jwt_and_extract_claims() + consent_grant predicate enforcing per-row visibility to caller's own patient_id OR delegated patient_ids only. Three-layer enforcement (RBAC role split + view predicate + tenant RLS). RBAC net-new count 13 → 15. P-038 R5 HIGH-1 pattern application.
- **R1 HIGH-3 closed:** corrected view DDL from WITH (security_barrier=true) to WITH (security_invoker = true, security_barrier = true) on both views; added §8.1 preflight assertion class (F) verifying both views have security_invoker=true in pg_class.reloptions after CREATE VIEW. Without security_invoker the view would have bypassed caller-scoped RLS by running under owner privileges.

**v0.3 DRAFT 2026-05-21:** §3 procedures fully detailed: 6 SECURITY DEFINER procedures (1 raw `record_crisis_event_lifecycle_transition()` writer + 5 wrapper procedures `record_crisis_initiation` / `_acknowledgement_claim` / `_response` / `_resolution` / `execute_crisis_no_acknowledgement_sweep`); raw writer DDL with explicit EXECUTE-grants restricted to exactly the 5 wrapper-owner roles (anti-bypass discipline per P-034 + P-038); wrapper signatures + behavior contracts referencing SI-022 R34/R35/R36/R10/R11/R13 + R28/R39/R46/R47/R51/R53/R60/R63/R64 closure points. §7 RBAC fully enumerated: 13 net-new roles split as 6 application + 5 wrapper-owner + 1 raw-writer-owner + 1 view-owner. §8 deployment preflight contains a complete `DO $$ ... $$;` block with 5 assertion classes (RBAC roles exist + JWT migration seed rows + Part A every-tenant config + Part B regulatory_reporting=true config + Part C emergency_contact_consent_enabled=true config); §8.2 cutover sequencing enumerates 11 phases (RBAC → tables → backfill → triggers → RLS → procedures → views LAST per P-036 R6 → JWT seed → audit events → preflight DO block → OpenAPI endpoints last); §8.3 rollback discipline. Document is now complete and ready for first Codex adversarial review round.
