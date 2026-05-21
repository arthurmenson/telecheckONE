# CDM v1.6 → v1.7 + AUDIT_EVENTS v5.8 → v5.9 + OpenAPI v0.2 → v0.3 + State Machines v1.1 → v1.2 + RBAC v1.1 → v1.2 Amendment (SI-019 follow-on)

**Version:** 0.4 DRAFT
**Status:** POST-R3 (1 HIGH closed inline: recursive defect on R2 closure. R2's GUC-supplied actor_role pattern still trusted caller-controlled mutable state — a compromised/buggy caller with EXECUTE could SET `app.actor_role` to any target role and pass `pg_has_role(actor_role, '<required>', 'MEMBER')`. Fix: SUPERSEDED the GUC-only pattern with SI-024.1 v0.8 RATIFIED JWT-binding model (P-031) as canonical trust anchor. Wrapper STEP 4 reads actor_role from JWT-verified claims via `verify_session_jwt_and_extract_claims()` (SI-024.1 helper that performs EXISTS check against `session_jwt_admission` bound to current backend via admission-binding invariant). Phase B fallback to GUC pattern permitted IF AND ONLY IF entity's `phase_4_cutover_eligible=FALSE` AND `raw_guc_fallback_audited=TRUE` (per jwt_migration_entity_status); fallback emits `tenant_context.raw_guc_fallback_used` audit per SI-024.1 contract. Cryptographic trust chain: JWT signature + admission-binding invariant → actor identity cannot be self-asserted by EXECUTE-only caller (forging requires JWT signature + admission to current backend). Rule applies to all 7 procedure bodies — wrappers are trust boundary; raw writer relies on wrapper enforcement.)
**Authoring date:** 2026-05-21
**Trigger:** Promotion Ledger P-033 (SI-019 Medication Interaction & Validation Engine Slice PRD v1.0 → v2.0 RATIFIED via Option A canonical Phase B append-only-only lifecycle persistence; Registry v2.19 → v2.20). Per the established post-P-029 spec-first promotion pattern, SI-019's canonical content lands in CDM + AUDIT_EVENTS + OpenAPI + State Machines + RBAC via a separate amendment cycle following SI ratification (mirrors P-029's pattern of CDM amendment AFTER SI-021 ratified; mirrors P-032's pattern of CDM amendment AFTER SI-024.1 ratified).
**Owner:** Clinical Governance Lead (SI-019 v1.0 owner) + Async Consult slice owner (cross-cutting consumer) + CDM owner + AUDIT_EVENTS owner + OpenAPI owner + State Machines owner + RBAC owner.
**Parent SI:** SI-019 v0.8 RATIFIED (`Telecheck_Medication_Interaction_Engine_Slice_PRD_v2_0.md`); P-033 is the ratification authority for this amendment.
**Companion documents:** P-027 (I-035 introduction via Contracts Pack v5.2 → v5.3 + CDM v1.2 → v1.3 Phase B batched promotion); P-021 (SI-005 SC3 grandfathered consult precedent); previous follow-on amendment patterns (`Telecheck_CDM_v1_4_to_v1_5_Amendment.md` from SI-021 cycle; `Telecheck_CDM_v1_5_to_v1_6_Amendment.md` from SI-024.1 cycle).

---

## 1. Purpose + scope

This amendment promotes the canonical content of SI-019 v0.8 RATIFIED into:
- CDM v1.6 → v1.7 (4 new entities + **7 new SECURITY DEFINER procedures** [1 raw transition writer + 5 reason-specific lifecycle wrappers + 1 override wrapper] + 1 SECURITY BARRIER view + 1 SECURITY DEFINER access function + 1 optional materialized view)
- AUDIT_EVENTS v5.8 → v5.9 (6 new action IDs under `medication_interaction.*` namespace)
- DOMAIN_EVENTS additive (no version bump; 5 new event types under `medication_interaction.*` namespace)
- OpenAPI v0.2 → v0.3 (8 new endpoints under `/v1/medication-interaction/*`)
- State Machines v1.1 → v1.2 (1 new state machine `interaction_signal_lifecycle`)
- RBAC v1.1 → v1.2 (4 new RBAC roles + 6 SECURITY DEFINER wrapper owner roles + 2 service-level owner roles)

The amendment is **mechanical consolidation** of already-Codex-converged canonical content from SI-019 v0.8 RATIFIED (7-round convergence; 6 HIGH + 5 MED + 1 CORRECT hard-floor item 6 invocation closed; APPROVE at R7). Per the established post-P-029 spec-first pattern, the SI authoring + ratification cycle (P-033) closed the architectural questions including the OQ7 Option A ratification; this amendment is the canonical bundle landing.

**In scope:**

1. CDM v1.6 → v1.7 with 4 new entities + **7 SECURITY DEFINER procedures (1 raw transition writer + 5 reason-specific lifecycle wrappers + 1 override wrapper)** + 1 SECURITY BARRIER view + 1 SECURITY DEFINER access function + 1 optional materialized view (R1 MED-2 closure 2026-05-21: procedure count normalized to 7 throughout — earlier "6 procedures" mention conflated the lifecycle wrapper count with the total procedure count). Continuing CDM numbering from v1.6's 80 active entities + 3 derived views; v1.7 target: 84 active entities + 4 derived views.
2. AUDIT_EVENTS v5.8 → v5.9 with 6 new action IDs (4 Cat A + 2 Cat B) under `medication_interaction.*` namespace.
3. DOMAIN_EVENTS additive: 5 new event types under `medication_interaction.*` namespace.
4. OpenAPI v0.2 → v0.3 with 8 new endpoints under `/v1/medication-interaction/*`.
5. State Machines v1.1 → v1.2 with `interaction_signal_lifecycle` (described as DERIVED from append-only `interaction_signal_lifecycle_transition` rows per Option A; CHECK constraint + 6 reason-specific SECURITY DEFINER wrappers enforce allowed transitions).
6. RBAC v1.1 → v1.2 with 4 new application roles + 6 wrapper owner roles + 2 service-level owner roles.
7. `jwt_migration_entity_status` seed population for all 4 new CDM v1.7 RLS-bearing entities (per SI-024.1 OQ8 mandatory seed step + SI-019 four new entities × `tenant_id`-bearing).

**Out of scope:**

- SI-019 Phase A foundation implementation (`telecheck-app` code repo).
- Knowledge base vendor selection (SI-019 §5 OQ deferred to procurement evaluation).
- Pediatric/geriatric criteria localization (SI-019 §5 OQ deferred to clinical governance review).
- Engine versioning cadence policy (SI-019 §5 OQ deferred to operational decision).
- Pharmacogenomic real PGx integration (SI-019 §5 stub; needs separate slice OR future SI).
- INVARIANTS bump (no new platform-floor invariants from SI-019; all closures align with I-035 + I-023 + I-027 already canonical).

---

## 2. New CDM entities (4 active + 1 SECURITY BARRIER view + 1 optional MV)

All 4 active entities are **P1 patient-bound** entities (per SI-018 partition rule: patient-bound clinical-evidence belongs in P1). All carry `tenant_id` per I-023 three-layer tenant isolation; all carry strict append-only triggers per I-035 invariant.

### §4.NEW1 — `interaction_engine_evaluation` (CDM v1.7 new; SI-019 Sub-decision 1 entity 1)

One row per engine invocation. Strict append-only per I-035; row records the engine evaluation context (medication/condition/lab snapshots, knowledge base version, engine version, trigger source).

```sql
CREATE TABLE interaction_engine_evaluation (
    id ULID PRIMARY KEY,
    tenant_id tenant_id_t NOT NULL,
    patient_id ULID NOT NULL REFERENCES patients(id),
    triggered_by TEXT NOT NULL CHECK (triggered_by IN (
        'prescribing', 'refill', 'protocol_gate', 'manual_recheck',
        'lab_update', 'adverse_event_investigation'
    )),
    triggered_by_resource_id ULID NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    evaluation_window_ms INTEGER NOT NULL CHECK (evaluation_window_ms >= 0),
    engine_version TEXT NOT NULL,        -- semver
    knowledge_base_version TEXT NOT NULL, -- semver
    medication_set_snapshot JSONB NOT NULL,
    condition_set_snapshot JSONB NOT NULL,
    lab_set_snapshot JSONB NOT NULL,     -- includes lab_freshness_status_at_evaluation per signal
    CONSTRAINT interaction_engine_evaluation_tenant_patient_id_uniq
        UNIQUE (tenant_id, patient_id, id)
);
CREATE INDEX interaction_engine_evaluation_patient_evaluated_at
    ON interaction_engine_evaluation (tenant_id, patient_id, evaluated_at DESC);

-- Three-layer RLS enforcement
ALTER TABLE interaction_engine_evaluation ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_engine_evaluation FORCE ROW LEVEL SECURITY;
CREATE POLICY interaction_engine_evaluation_tenant_isolation ON interaction_engine_evaluation
    USING (tenant_id = current_tenant_id_strict('interaction_engine_evaluation'));

-- Strict append-only per I-035
CREATE TRIGGER interaction_engine_evaluation_append_only
    BEFORE UPDATE OR DELETE ON interaction_engine_evaluation
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

-- INSERT restricted to engine evaluator role
REVOKE INSERT ON interaction_engine_evaluation FROM PUBLIC;
GRANT INSERT ON interaction_engine_evaluation TO medication_interaction_engine_evaluator;
GRANT SELECT ON interaction_engine_evaluation TO
    medication_interaction_engine_evaluator,
    medication_interaction_signal_viewer;
```

**Cross-references:** SI-019 §Sub-decision 1 entity 1; INVARIANTS v5.4 §I-023/I-027/I-035; SI-018 partition rule (P1 patient-bound).

### §4.NEW2 — `interaction_signal` (CDM v1.7 new; SI-019 Sub-decision 1 entity 2)

One row per signal produced by an evaluation. **Strict append-only per I-035** — NO state column; current lifecycle state is DERIVED from `interaction_signal_lifecycle_transition` rows (per SI-019 OQ7 Option A ratification).

```sql
CREATE TABLE interaction_signal (
    id ULID PRIMARY KEY,
    tenant_id tenant_id_t NOT NULL,
    evaluation_id ULID NOT NULL,
    check_class TEXT NOT NULL CHECK (check_class IN (
        'drug_drug', 'drug_condition', 'drug_lab',
        'pharmacogenomic', 'special_clinical_flag'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'major', 'moderate', 'minor')),
    recommended_action TEXT NOT NULL CHECK (recommended_action IN ('block', 'warn', 'monitor')),
    medications_involved ULID[] NOT NULL,
    evidence_sources JSONB NOT NULL,    -- knowledge base citations
    signal_payload JSONB NOT NULL,      -- structured signal per SI-019 v1.0 §5.1
    CONSTRAINT interaction_signal_evaluation_fk
        FOREIGN KEY (tenant_id, evaluation_id)
        REFERENCES interaction_engine_evaluation (tenant_id, id)
        -- composite tenant-scoped FK per I-023 layer 2
);
CREATE INDEX interaction_signal_tenant_evaluation
    ON interaction_signal (tenant_id, evaluation_id);
CREATE INDEX interaction_signal_severity_check_class
    ON interaction_signal (tenant_id, severity, check_class);

-- Three-layer RLS enforcement
ALTER TABLE interaction_signal ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_signal FORCE ROW LEVEL SECURITY;
CREATE POLICY interaction_signal_tenant_isolation ON interaction_signal
    USING (tenant_id = current_tenant_id_strict('interaction_signal'));

-- Strict append-only per I-035 (NO state column — current state DERIVED from transition log per Option A)
CREATE TRIGGER interaction_signal_append_only
    BEFORE UPDATE OR DELETE ON interaction_signal
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

-- INSERT restricted to engine evaluator role
REVOKE INSERT ON interaction_signal FROM PUBLIC;
GRANT INSERT ON interaction_signal TO medication_interaction_engine_evaluator;
GRANT SELECT ON interaction_signal TO
    medication_interaction_engine_evaluator,
    medication_interaction_signal_viewer,
    medication_interaction.override_recorder;
```

**Cross-references:** SI-019 §Sub-decision 1 entity 2 + §OQ7 Option A ratification (immutable signal row; state DERIVED); INVARIANTS v5.4 §I-023/I-027/I-035.

### §4.NEW3 — `interaction_signal_override` (CDM v1.7 new; SI-019 Sub-decision 1 entity 3)

One row per clinician override of a signal's enforcement action. Strict append-only per I-035. KMS-encrypted rationale per same envelope pattern as SI-005's consult clinician decision rationale.

```sql
CREATE TABLE interaction_signal_override (
    id ULID PRIMARY KEY,
    tenant_id tenant_id_t NOT NULL,
    signal_id ULID NOT NULL,
    override_by_clinician_account_id ULID NOT NULL REFERENCES accounts(id),
    override_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    override_rationale TEXT NOT NULL,   -- plaintext only in transit; persisted via KMS envelope below
    -- 8-column flat KMS envelope (mirrors SI-005 record_consult_clinician_decision pattern)
    override_rationale_kms_envelope_ciphertext BYTEA NOT NULL,
    override_rationale_kms_envelope_dek_id ULID NOT NULL,
    override_rationale_kms_envelope_iv BYTEA NOT NULL,
    override_rationale_kms_envelope_tag BYTEA NOT NULL,
    override_rationale_kms_envelope_alg TEXT NOT NULL,
    override_rationale_kms_envelope_alg_version TEXT NOT NULL,
    override_rationale_kms_envelope_aad BYTEA NOT NULL,
    override_rationale_kms_envelope_encrypted_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT interaction_signal_override_signal_fk
        FOREIGN KEY (tenant_id, signal_id)
        REFERENCES interaction_signal (tenant_id, id)
);
CREATE INDEX interaction_signal_override_tenant_signal
    ON interaction_signal_override (tenant_id, signal_id);
CREATE INDEX interaction_signal_override_clinician_recent
    ON interaction_signal_override (tenant_id, override_by_clinician_account_id, override_at DESC);

-- Three-layer RLS enforcement
ALTER TABLE interaction_signal_override ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_signal_override FORCE ROW LEVEL SECURITY;
CREATE POLICY interaction_signal_override_tenant_isolation ON interaction_signal_override
    USING (tenant_id = current_tenant_id_strict('interaction_signal_override'));

-- Strict append-only per I-035
CREATE TRIGGER interaction_signal_override_append_only
    BEFORE UPDATE OR DELETE ON interaction_signal_override
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

-- INSERT restricted to override wrapper procedure owner (Sub-decision 8)
REVOKE INSERT ON interaction_signal_override FROM PUBLIC;
GRANT INSERT ON interaction_signal_override TO override_wrapper_owner;
GRANT SELECT ON interaction_signal_override TO
    medication_interaction_signal_viewer,
    override_wrapper_owner;
```

**Cross-references:** SI-019 §Sub-decision 1 entity 3 + §Sub-decision 8 procedure; INVARIANTS v5.4 §I-023/I-027/I-035; SI-005 KMS envelope pattern precedent.

### §4.NEW4 — `interaction_signal_lifecycle_transition` (CDM v1.7 new; SI-019 Sub-decision 1 entity 4; Option A append-only transition log)

One row per lifecycle state transition. **Option A append-only-only persistence per I-035** — replaces the UPDATE-on-signal-row pattern that Codex R1 STOP rejected; ratified at SI-019 OQ7 Option A 2026-05-20.

```sql
CREATE TABLE interaction_signal_lifecycle_transition (
    id ULID PRIMARY KEY,
    tenant_id tenant_id_t NOT NULL,
    signal_id ULID NOT NULL,
    from_state TEXT NOT NULL CHECK (from_state IN (
        'none',          -- sentinel; ONLY used by initial emission transition
        'emitted', 'active',
        'overridden', 'superseded', 'resolved', 'expired'
    )),
    to_state TEXT NOT NULL CHECK (to_state IN (
        'emitted', 'active',
        'overridden', 'superseded', 'resolved', 'expired'
        -- 'none' is NEVER a valid to_state (no transition ends in pre-existence)
    )),
    transition_reason TEXT NOT NULL CHECK (transition_reason IN (
        'emission', 'activation', 'override',
        'superseded_by_evaluation', 'resolution_event', 'time_expiry'
    )),
    transition_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    transition_by_actor_id ULID,   -- NULL for system-driven transitions
    transition_by_actor_role TEXT NOT NULL CHECK (transition_by_actor_role IN (
        'clinician', 'system', 'engine_evaluator', 'scheduler'
    )),
    metadata JSONB NOT NULL,       -- override_id / superseded_by_evaluation_id / discontinuation_event_id / time_window_basis

    CONSTRAINT interaction_signal_lifecycle_transition_signal_fk
        FOREIGN KEY (tenant_id, signal_id)
        REFERENCES interaction_signal (tenant_id, id),

    -- CHECK enforces only allowed (transition_reason, from_state, to_state) triples per SI-019 Sub-decision 5
    CONSTRAINT interaction_signal_lifecycle_transition_valid_triple CHECK (
        (transition_reason = 'emission'                 AND from_state = 'none'    AND to_state = 'emitted')
     OR (transition_reason = 'activation'               AND from_state = 'emitted' AND to_state = 'active')
     OR (transition_reason = 'override'                 AND from_state = 'active'  AND to_state = 'overridden')
     OR (transition_reason = 'superseded_by_evaluation' AND from_state = 'active'  AND to_state = 'superseded')
     OR (transition_reason = 'resolution_event'         AND from_state = 'active'  AND to_state = 'resolved')
     OR (transition_reason = 'time_expiry'              AND from_state = 'active'  AND to_state = 'expired')
    ),

    -- UNIQUE prevents duplicate INSERT races; advisory-lock pattern at write time per SI-019 Sub-decision 8.5
    CONSTRAINT interaction_signal_lifecycle_transition_uniq
        UNIQUE (tenant_id, signal_id, transition_at, id)
);
CREATE INDEX interaction_signal_lifecycle_transition_signal_latest
    ON interaction_signal_lifecycle_transition (tenant_id, signal_id, transition_at DESC, id DESC);

-- Three-layer RLS enforcement
ALTER TABLE interaction_signal_lifecycle_transition ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_signal_lifecycle_transition FORCE ROW LEVEL SECURITY;
CREATE POLICY interaction_signal_lifecycle_transition_tenant_isolation
    ON interaction_signal_lifecycle_transition
    USING (tenant_id = current_tenant_id_strict('interaction_signal_lifecycle_transition'));

-- Strict append-only per I-035
CREATE TRIGGER interaction_signal_lifecycle_transition_append_only
    BEFORE UPDATE OR DELETE ON interaction_signal_lifecycle_transition
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

-- INSERT restricted to lifecycle_transition_writer_owner (the raw SECURITY DEFINER procedure's owner)
-- App roles call reason-specific wrappers (see §6 below); raw writer is owner-only per SI-019 R4 HIGH-2 closure.
REVOKE INSERT ON interaction_signal_lifecycle_transition FROM PUBLIC;
GRANT INSERT ON interaction_signal_lifecycle_transition TO lifecycle_transition_writer_owner;
GRANT SELECT ON interaction_signal_lifecycle_transition TO
    medication_interaction_engine_evaluator,
    medication_interaction_signal_viewer,
    override_wrapper_owner,
    lifecycle_transition_writer_owner,
    mv_refresh_owner;
```

**Cross-references:** SI-019 §Sub-decision 1 entity 4 + §Sub-decision 5 (state machine derived from transition log) + §OQ7 Option A ratification; INVARIANTS v5.4 §I-023/I-027/I-035.

**Current-state derivation contract** (per SI-019 Sub-decision 5; R6 MED-1 closure: tenant-scoped):

```sql
SELECT to_state
FROM interaction_signal_lifecycle_transition
WHERE tenant_id = $tenant_id AND signal_id = $signal_id
ORDER BY transition_at DESC, id DESC
LIMIT 1;
```

Guaranteed to return exactly one row for any existing signal because the override wrapper (Sub-decision 8) and engine evaluator's signal-INSERT path atomically INSERT the initial `none → emitted` row alongside every `interaction_signal` row.

### §4.NEW5 — `interaction_signal_current_state_mv` (CDM v1.7 new optional materialized view; SI-019 Sub-decision 9)

OPTIONAL rebuildable materialized view for read-path optimization. Non-authoritative; the transition table is the source of truth per I-035. Permitted only for non-authoritative hot-path display (clinician dashboard, pharmacy portal, patient mobile app summary, admin reporting); STRICT-FRESHNESS consumers (override procedure, prescribing decision gates, refill release checks, protocol gates, pharmacy enforcement) MUST query `interaction_signal_lifecycle_transition` directly per SI-019 Sub-decision 9 read-path consumer classification table.

```sql
CREATE MATERIALIZED VIEW interaction_signal_current_state_mv AS
SELECT DISTINCT ON (tenant_id, signal_id)
    tenant_id, signal_id, to_state AS current_state, transition_at AS as_of, transition_reason
FROM interaction_signal_lifecycle_transition
ORDER BY tenant_id, signal_id, transition_at DESC, id DESC;

CREATE UNIQUE INDEX interaction_signal_current_state_mv_pk
    ON interaction_signal_current_state_mv (tenant_id, signal_id);

-- MV access restricted: PostgreSQL materialized views do not natively enforce RLS, so direct GRANT
-- SELECT on the MV is a tenant-isolation bypass (per SI-019 R2 HIGH-2 closure). Direct access
-- limited to mv_refresh_owner only; app roles read via SECURITY BARRIER view or SECURITY DEFINER
-- access function (defined below).
REVOKE ALL ON interaction_signal_current_state_mv FROM PUBLIC;
GRANT SELECT ON interaction_signal_current_state_mv TO mv_refresh_owner;

-- SECURITY BARRIER view: app roles read this view (tenant predicate enforced at view level per I-023 layer 2)
CREATE VIEW interaction_signal_current_state_v
    WITH (security_barrier = true) AS
SELECT tenant_id, signal_id, current_state, as_of, transition_reason
FROM interaction_signal_current_state_mv
WHERE tenant_id = current_setting('app.tenant_id', false)::tenant_id_t;

REVOKE ALL ON interaction_signal_current_state_v FROM PUBLIC;
GRANT SELECT ON interaction_signal_current_state_v TO medication_interaction_signal_viewer;

-- SECURITY DEFINER access function: alternate pattern for singleton lookups.
-- R1 MED-1 closure 2026-05-21: explicit casts on text-typed MV columns to the declared
-- return-type domains. The CHECK-constrained text columns (to_state, transition_reason) in the
-- underlying transition table propagate through the MV as text; the access function declares
-- canonical domains (interaction_signal_state_t, interaction_signal_transition_reason_t) for the
-- app-facing contract. Without explicit casts, SQL functions enforce strict type-match between
-- declared return types and SELECT-list types — would fail at CREATE FUNCTION time.
-- A separate (future) TYPES amendment cycle should formalize these as DOMAIN types backed by
-- equivalent CHECK constraints and migrate the columns from TEXT to the domain types so the casts
-- become no-ops; for this amendment cycle, the casts are the spec-compliant closure.
CREATE FUNCTION get_interaction_signal_current_state(p_signal_id ulid_t)
RETURNS TABLE(
    signal_id ulid_t,
    current_state interaction_signal_state_t,
    as_of TIMESTAMPTZ,
    transition_reason interaction_signal_transition_reason_t
) AS $$
    SELECT
        mv.signal_id,
        mv.current_state::interaction_signal_state_t,
        mv.as_of,
        mv.transition_reason::interaction_signal_transition_reason_t
    FROM public.interaction_signal_current_state_mv mv
    WHERE mv.tenant_id = current_setting('app.tenant_id', false)::tenant_id_t
      AND mv.signal_id = p_signal_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = pg_catalog, pg_temp;

ALTER FUNCTION public.get_interaction_signal_current_state(ulid_t) OWNER TO mv_refresh_owner;
REVOKE EXECUTE ON FUNCTION public.get_interaction_signal_current_state(ulid_t) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_interaction_signal_current_state(ulid_t) TO medication_interaction_signal_viewer;
```

**Refresh model** (per SI-019 Sub-decision 9):
- `REFRESH MATERIALIZED VIEW CONCURRENTLY interaction_signal_current_state_mv` on 30s schedule OR incrementally via `medication_interaction.signal_lifecycle_transition_emitted.v1` domain-event subscriber.
- Reconciliation hourly cron raises Cat B `interaction_engine_projection_divergence_detected` on divergence (compared to derived-from-transition-rows).
- MV can be dropped + rebuilt at any time without data loss.

**Read-path consumer classification** (per SI-019 Sub-decision 9 + R2 MED-1 closure):

| Consumer class | Read source | Examples |
|---|---|---|
| **STRICT-FRESHNESS** | `interaction_signal_lifecycle_transition` direct + advisory lock | override procedure STEP 4; prescribing decision gates; refill release checks; protocol gates; pharmacy enforcement; cross-prescriber concern |
| **HOT-PATH DISPLAY** | MV via SECURITY BARRIER view or access function; stale-state labeling required | clinician dashboard; pharmacy portal active-signals indicator; patient mobile app summary; admin reporting |
| **PUSH NOTIFICATION** | `signal_lifecycle_transition_emitted.v1` domain event subscriber | real-time lifecycle-change push |

**Cross-references:** SI-019 §Sub-decision 9 + §R2 HIGH-2 closure (MV RLS implementability) + §R2 MED-1 closure (read-path consumer classification) + §R3 MED-1 closure (RETURNS TABLE) + §R6 MED-1 closure (tenant-scoped DISTINCT ON).

---

## 3. New SECURITY DEFINER procedures (7 total: 1 raw transition writer + 5 reason-specific lifecycle wrappers + 1 override wrapper)

### §6.NEW1 — `record_interaction_signal_lifecycle_transition()` (raw canonical transition writer)

The SINGLE canonical write path for ALL 6 transition reasons. Owner-only EXECUTE; app roles call reason-specific wrappers (§6.NEW2-NEW6 below).

```sql
CREATE PROCEDURE record_interaction_signal_lifecycle_transition(
    p_tenant_id tenant_id_t,
    p_signal_id ulid_t,
    p_to_state interaction_signal_state_t,
    p_transition_reason interaction_signal_transition_reason_t,
    p_actor_id ULID,
    p_actor_role interaction_signal_actor_role_t,
    p_metadata JSONB
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE
    v_latest_to_state interaction_signal_state_t;
    v_lock_acquired BOOLEAN;
    v_tenant_guc TEXT;
BEGIN
    -- STEP 0: tenant GUC guard per I-032 v5.3 (R4 MED-1 closure)
    v_tenant_guc := current_setting('app.tenant_id', true);  -- missing_ok=true
    IF v_tenant_guc IS NULL OR length(trim(v_tenant_guc)) = 0 THEN
        RAISE EXCEPTION 'tenant_guc_missing'
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF v_tenant_guc::tenant_id_t IS DISTINCT FROM p_tenant_id THEN
        RAISE EXCEPTION 'tenant_guc_mismatch'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- STEP 1: advisory-lock on (tenant_id, signal_id); re-entrant within same xact.
    -- R1 HIGH-1 closure 2026-05-21: use the BIGINT single-argument overload with a stable 64-bit
    -- hash key (hashtextextended returns bigint; casting to int4 can overflow). Lock key is
    -- derived from a stable canonical-namespace + composite-id text so different lifecycle
    -- subsystems on the same tenant/signal pair would not collide (the namespace prefix
    -- discriminates).
    v_lock_acquired := pg_try_advisory_xact_lock(
        hashtextextended(
            'interaction_signal_lifecycle_transition:' || p_tenant_id::text || ':' || p_signal_id::text,
            0
        )
    );
    IF NOT v_lock_acquired THEN
        RAISE EXCEPTION 'advisory_lock_unavailable'
            USING ERRCODE = 'lock_not_available';
    END IF;

    -- STEP 2: read latest transition's to_state under lock
    SELECT to_state INTO v_latest_to_state
        FROM public.interaction_signal_lifecycle_transition
        WHERE tenant_id = p_tenant_id AND signal_id = p_signal_id
        ORDER BY transition_at DESC, id DESC
        LIMIT 1;

    -- STEP 3: validate state continuity
    IF v_latest_to_state IS NULL THEN
        IF p_transition_reason <> 'emission' THEN
            RAISE EXCEPTION 'signal_has_no_prior_transition'
                USING ERRCODE = 'check_violation';
        END IF;
    ELSIF v_latest_to_state IN ('overridden', 'superseded', 'resolved', 'expired') THEN
        RAISE EXCEPTION 'signal_state_terminal: latest_to_state=%, attempted to_state=%',
            v_latest_to_state, p_to_state
            USING ERRCODE = 'check_violation';
    END IF;

    -- STEP 3.5 (R5 HIGH closure): activation rejects if override evidence row exists under lock
    IF p_transition_reason = 'activation' THEN
        IF EXISTS (
            SELECT 1 FROM public.interaction_signal_override
            WHERE tenant_id = p_tenant_id AND signal_id = p_signal_id
        ) THEN
            RAISE EXCEPTION 'activation_blocked_by_override_evidence: signal_id=%', p_signal_id
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;

    -- STEP 4: INSERT the new transition row; row-level CHECK validates the triple.
    -- R1 HIGH-2 closure 2026-05-21: schema-qualify public.gen_ulid() — SECURITY DEFINER
    -- search_path is intentionally restricted to (pg_catalog, pg_temp) so non-pg_catalog helpers
    -- MUST be schema-qualified to resolve.
    INSERT INTO public.interaction_signal_lifecycle_transition (
        id, tenant_id, signal_id,
        from_state, to_state, transition_reason,
        transition_at, transition_by_actor_id, transition_by_actor_role,
        metadata
    ) VALUES (
        public.gen_ulid(), p_tenant_id, p_signal_id,
        COALESCE(v_latest_to_state, 'none'), p_to_state, p_transition_reason,
        now(), p_actor_id, p_actor_role,
        p_metadata
    );

    -- (Domain event medication_interaction.signal_lifecycle_transition_emitted.v1 emitted via
    --  application-layer outbox after this procedure returns + transaction commits)
END;
$$;

ALTER PROCEDURE record_interaction_signal_lifecycle_transition(
    tenant_id_t, ulid_t, interaction_signal_state_t, interaction_signal_transition_reason_t,
    ULID, interaction_signal_actor_role_t, JSONB
) OWNER TO lifecycle_transition_writer_owner;

REVOKE EXECUTE ON PROCEDURE record_interaction_signal_lifecycle_transition(...) FROM PUBLIC;
-- EXECUTE granted to wrapper owners ONLY (per SI-019 R4 HIGH-2 closure)
GRANT EXECUTE ON PROCEDURE record_interaction_signal_lifecycle_transition(...) TO
    emission_wrapper_owner,
    activation_wrapper_owner,
    override_wrapper_owner,
    superseded_wrapper_owner,
    resolution_wrapper_owner,
    expiry_wrapper_owner;
```

**Rejection codes:** `tenant_guc_missing`, `tenant_guc_mismatch`, `advisory_lock_unavailable`, `signal_has_no_prior_transition`, `signal_state_terminal`, `activation_blocked_by_override_evidence`, plus row-level CHECK violations.

**Cross-references:** SI-019 §Sub-decision 8.5 + §R3 HIGH-1 closure + §R4 HIGH-2 closure + §R4 MED-1 closure + §R5 HIGH-1 closure.

### §6.NEW2-NEW6 — Reason-specific wrappers (5 procedures)

Each wrapper performs reason-specific evidence validation BEFORE invoking the raw writer (§6.NEW1). All SECURITY DEFINER owned by `*_wrapper_owner` with `search_path = pg_catalog, pg_temp`. Granted EXECUTE to one specific app role per reason.

| Procedure | Owner role | App-role caller | Reason-specific evidence check |
|---|---|---|---|
| `record_signal_emission(...)` | `emission_wrapper_owner` | `medication_interaction_engine_evaluator` | Validates: paired `interaction_signal` row exists; `engine_version`/`knowledge_base_version` match active config; `evaluation_id` matches an `interaction_engine_evaluation` row |
| `record_signal_activation(...)` | `activation_wrapper_owner` | `medication_interaction_engine_evaluator` | Validates: signal's current state is `emitted`; no override recorded between emission and activation (defense-in-depth with §6.NEW1 STEP 3.5) |
| `record_signal_supersession(p_signal_id, p_replacement_evaluation_id)` | `superseded_wrapper_owner` | `medication_interaction_engine_evaluator` | Validates: replacement evaluation exists for same tenant+patient+`check_class` with overlapping `medications_involved`; post-emission timestamp |
| `record_signal_resolution(p_signal_id, p_discontinuation_event_id)` | `resolution_wrapper_owner` | `medication_interaction_resolution_subscriber` | Validates: discontinuation event exists in medication-discontinuation domain-event log; affects one of `medications_involved`; protocol-specific washout period elapsed |
| `record_signal_expiry(p_signal_id)` | `expiry_wrapper_owner` | `medication_interaction_engine_evaluator` (scheduler) | Validates: `signal_payload.time_window_basis` non-NULL; window end-time has actually elapsed (`now() > emission_time + time_window`); rejects premature expiry |

Each wrapper raises a reason-specific structured rejection on evidence failure (e.g., `replacement_evaluation_not_found`, `washout_period_not_elapsed`, `expiry_premature`) before invoking the raw writer.

**Cross-references:** SI-019 §Sub-decision 8.5 (R4 HIGH-2 closure table); §R5 HIGH-1 closure (activation evidence-check defense-in-depth).

### §6.NEW7 — `record_interaction_signal_override()` (override wrapper)

SECURITY DEFINER wrapper that atomically INSERTs override row FIRST (Step 5) then calls the raw transition writer (Step 6) — order inverted per SI-019 R4 HIGH-1 closure to prevent terminal-transition-without-evidence-row failures.

```sql
-- 8-step procedure body summarized per SI-019 Sub-decision 8 v0.8 final + R2 HIGH-1 closure
-- 2026-05-21 (caller-identity check under SECURITY DEFINER):
-- STEP 0: I-032 Mode 1+2 tenant-GUC guard (current_setting('app.tenant_id') vs p_tenant_id)
-- STEP 1: auth-FIRST per I-023 layer 2
-- STEP 2: idempotency-key validation
-- STEP 4: clinician-role check via GUC-supplied actor-role (NOT current_user — see R2 HIGH-1 below)
-- STEP 3: medication-still-on-active-list state check
-- STEP 4.5 (R5 HIGH closure): acquire (tenant_id, signal_id) advisory lock BEFORE Step 5
-- STEP 5: generate v_new_override_id := public.gen_ulid(); INSERT interaction_signal_override FIRST
--         (failure here → no transition row written; transaction aborts cleanly)
-- STEP 6: call record_interaction_signal_lifecycle_transition(..., metadata={override_id: v_new_override_id})
--         (failure here → override row INSERT rolls back atomically)
-- STEP 7: unique_violation safety net on both INSERTs
-- STEP 8: COMMIT (caller-managed); rejection emission via application-layer outbox

-- R2 HIGH-1 closure 2026-05-21 + R3 HIGH-1 closure 2026-05-21: SECURITY DEFINER caller-identity check.
--
-- R2 Problem: SECURITY DEFINER procedures execute as the procedure OWNER (override_wrapper_owner),
-- not the calling app role. PostgreSQL `current_user` inside the procedure body resolves to the
-- owner, NOT the original caller. A clinician-role check written as
-- `pg_has_role(current_user, 'medication_interaction.override_recorder', 'MEMBER')` would always
-- pass (the owner is whatever the migration created it as), defeating the gate.
--
-- R3 Problem (recursive defect on R2's fix): reading `current_setting('app.actor_role')` and
-- validating via `pg_has_role(actor_role::regrole, '<required>', 'MEMBER')` proves the NAMED
-- role is a member of the required role, but does NOT prove the caller is entitled to claim that
-- role. A compromised/buggy caller with EXECUTE on the procedure can SET `app.actor_role` to any
-- target role name they want and pass the check. The GUC is caller-controlled mutable state, not
-- a verified trust anchor.
--
-- Canonical resolution per SI-024.1 v0.8 RATIFIED JWT-binding model (P-031):
--
-- The trust anchor for caller identity in Telecheck v1.7+ is the JWT admission record
-- (`session_jwt_admission` per CDM v1.6 §4.NEW1) cryptographically bound to the PostgreSQL
-- backend via (backend_pid, backend_start_at, jwt_id) admission-binding invariant. Verified
-- claims (actor_human_id, actor_role, tenant_id) are extracted via the SI-024.1 helper
-- `verify_session_jwt_and_extract_claims()` which performs a read-only EXISTS check against
-- the admission table — guaranteeing the claims originate from a JWT that was admitted to the
-- current backend.
--
-- Spec normatively requires: wrapper STEP 4 reads actor_role from JWT-verified claims (via
-- verify_session_jwt_and_extract_claims), NOT from `app.actor_role` GUC. The GUC pattern in
-- the R2 closure is SUPERSEDED by this R3 closure; for backward compatibility during the
-- jwt_migration_entity_status Phase B fallback window (per SI-024.1 Sub-decision 9), the GUC
-- pattern MAY be used IF AND ONLY IF the entity's `phase_4_cutover_eligible=FALSE` AND
-- `raw_guc_fallback_audited=TRUE`; in that case the wrapper additionally emits
-- `tenant_context.raw_guc_fallback_used` audit per SI-024.1 v0.8 contract.
--
-- IMPORTANT: spec FORBIDS the use of `current_user` for caller authorization inside SECURITY
-- DEFINER bodies in this amendment cycle (R2 closure) AND FORBIDS using `app.actor_role` GUC
-- as the sole trust source (R3 closure). ALL wrappers (Sub-decision 6.NEW2-NEW7) that depend
-- on app-role membership MUST validate via JWT-verified claims OR (during Phase B fallback) via
-- audited GUC. The raw transition writer (§6.NEW1) does NOT do role validation — it relies on
-- the per-reason wrapper having validated; wrappers are the trust-boundary.
--
-- Reference body pattern for STEP 4 in the override wrapper (R3-canonical):
--
--   DECLARE
--       v_claims jwt_session_claims_t;  -- struct from verify_session_jwt_and_extract_claims
--       v_actor_role TEXT;
--   BEGIN
--       -- Phase 4 cutover path: trusted JWT-verified claims (canonical)
--       v_claims := public.verify_session_jwt_and_extract_claims();  -- SI-024.1 v0.8 helper
--       IF v_claims IS NULL THEN
--           -- Phase B fallback path: GUC-supplied actor role, audited per jwt_migration_entity_status
--           IF NOT public.is_jwt_required_for_entity('interaction_signal_override') THEN
--               v_actor_role := current_setting('app.actor_role', true);
--               IF v_actor_role IS NULL OR length(trim(v_actor_role)) = 0 THEN
--                   RAISE EXCEPTION 'actor_role_missing'
--                       USING ERRCODE = 'insufficient_privilege';
--               END IF;
--               IF public.is_raw_guc_fallback_audited_for_entity('interaction_signal_override') THEN
--                   PERFORM public.emit_raw_guc_fallback_audit(
--                       'interaction_signal_override',
--                       v_actor_role
--                   );
--               END IF;
--           ELSE
--               RAISE EXCEPTION 'jwt_required_no_admission_record'
--                   USING ERRCODE = 'insufficient_privilege';
--           END IF;
--       ELSE
--           v_actor_role := v_claims.actor_role;  -- JWT-verified
--       END IF;
--       -- Authorization gate: validate the (now-verified) actor role has required membership
--       IF NOT pg_has_role(v_actor_role::regrole,
--                           'medication_interaction.override_recorder',
--                           'MEMBER') THEN
--           RAISE EXCEPTION 'unauthorized_role: actor_role=% lacks medication_interaction.override_recorder membership',
--               v_actor_role
--               USING ERRCODE = 'insufficient_privilege';
--       END IF;
--   END;
--
-- The same pattern (substituting the appropriate role name) applies to:
-- - record_signal_emission / record_signal_activation / record_signal_supersession /
--   record_signal_expiry: validate `medication_interaction_engine_evaluator` membership
-- - record_signal_resolution: validate `medication_interaction_resolution_subscriber` membership
--
-- Cryptographic trust chain: middleware presents JWT to admit_session_jwt() at session start
-- → session_jwt_admission row INSERTed bound to current backend → verify_session_jwt_and_extract_claims
-- returns the verified claims under EXISTS check on the admission row. The actor identity is
-- therefore bound to the JWT signature (SI-024.1 v0.8 cryptographic binding) + the current
-- backend (admission-binding invariant), NOT to a mutable GUC. Compromised callers with EXECUTE
-- on the wrapper cannot self-assert because they would need to forge a JWT signature AND
-- successfully admit it to their backend.

ALTER PROCEDURE record_interaction_signal_override(...) OWNER TO override_wrapper_owner;
REVOKE EXECUTE ON PROCEDURE record_interaction_signal_override(...) FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE record_interaction_signal_override(...) TO medication_interaction.override_recorder;
-- Note: even though the PostgreSQL-level GRANT EXECUTE restricts callers to those with the
-- override_recorder role (or members thereof), the runtime STEP 4 GUC + pg_has_role check is
-- defense-in-depth and provides a structured rejection (unauthorized_role) that callers can map
-- to HTTP responses; without it, mistakenly broad GRANT EXECUTE elsewhere in the deployment chain
-- would silently authorize override writes.
```

**New rejection codes (R2 HIGH-1):** `actor_role_missing` (Mode 1 — GUC absent or blank); `unauthorized_role` (Mode 2 — GUC present but actor role lacks the required role membership). Both use `insufficient_privilege` SQLSTATE for consistent caller handling.

**Updated 10-rejection-code total for override wrapper:** `tenant_guc_missing`, `tenant_guc_mismatch`, `actor_role_missing`, `idempotency_replay_outcome_mismatch`, `signal_not_active`, `signal_state_terminal`, `medication_not_on_list`, `unauthorized_role`, `unique_violation`, `advisory_lock_unavailable`.

**Rejection codes (9 total):** `tenant_guc_mismatch`, `tenant_guc_missing`, `idempotency_replay_outcome_mismatch`, `signal_not_active`, `signal_state_terminal`, `medication_not_on_list`, `unauthorized_role`, `unique_violation`, `advisory_lock_unavailable`.

**Caller transaction discipline:** procedure raises on any internal failure; callers MUST NOT swallow exceptions (would commit partial work); procedure MUST NOT issue COMMIT/ROLLBACK internally.

**Cross-references:** SI-019 §Sub-decision 8 + §R4 HIGH-1 closure + §R5 HIGH-1 closure.

---

## 4. AUDIT_EVENTS v5.8 → v5.9 amendment

**6 new action IDs** under `medication_interaction.*` namespace:

| # | Action ID | Category | Source |
|---|---|---|---|
| 1 | `medication_interaction.engine_evaluation_completed` | Cat A | engine evaluator on every evaluation row INSERT (success or no-signals) |
| 2 | `medication_interaction.signal_emitted` | Cat A | engine evaluator on every signal row INSERT (one per signal) |
| 3 | `medication_interaction.engine_evaluation_failed` | Cat B | engine evaluator on evaluation failure (timeout, KB unreachable, schema mismatch) |
| 4 | `medication_interaction.engine_knowledge_base_updated` | Cat B | admin endpoint on dual-control KB version bump (per I-015) |
| 5 | `medication_interaction.engine_signal_enforcement_override` | Cat B | dual-control safety pathway on critical/major-block override |
| 6 | `medication_interaction.engine_projection_divergence_detected` | Cat B | hourly reconciliation cron on MV-vs-transition-table divergence (Sub-decision 9) |

**Preserved (already in canonical AUDIT_EVENTS v5.5):** `interaction_signal_override` Cat A — preserved unchanged; envelope payload may need expansion per the new signal-override entity (out of scope for this amendment; addressed at implementation time).

**Audit-CHECK constraint amendment:** `audit_events.action_id CHECK` constraint enumerates the 6 new action IDs to satisfy I-012 closure rule:

```sql
ALTER TABLE audit_events DROP CONSTRAINT audit_events_action_id_check;
ALTER TABLE audit_events
    ADD CONSTRAINT audit_events_action_id_check CHECK (
        action_id IN (
            -- ... existing v5.8 enumeration preserved ...
            'medication_interaction.engine_evaluation_completed',
            'medication_interaction.signal_emitted',
            'medication_interaction.engine_evaluation_failed',
            'medication_interaction.engine_knowledge_base_updated',
            'medication_interaction.engine_signal_enforcement_override',
            'medication_interaction.engine_projection_divergence_detected'
        )
    );
```

**OQ for ratifier (preserved from SI-019 Sub-decision 2):** Is `engine_evaluation_completed` Cat A or Cat C? Recommendation: Cat A (clinical-evidence-of-evaluation; operational latency metrics are observable from the row shape but not the categorization criterion).

---

## 5. DOMAIN_EVENTS additive amendment (no version bump)

**5 new event types** under `medication_interaction.*` namespace (tenant-scoped per DOMAIN_EVENTS v5.2; additive enum extension):

| # | Event type | partition_key | Subscribers |
|---|---|---|---|
| 1 | `medication_interaction.evaluation_completed.v1` | `tenant_id:patient_id` | Async Consult clinician-decision branch; Pharmacy portal; Adverse Event Reporting correlation engine |
| 2 | `medication_interaction.signal_emitted.v1` | `tenant_id:patient_id` | Async Consult; Pharmacy portal (active signals indicator); Adverse Event Reporting; patient mobile app |
| 3 | `medication_interaction.signal_override_recorded.v1` | `tenant_id:patient_id` | Adverse Event Reporting; patient mobile app; pharmacy portal |
| 4 | `medication_interaction.evaluation_failed.v1` | `tenant_id:patient_id` | engine ops dashboard; SRE escalation |
| 5 | `medication_interaction.signal_lifecycle_transition_emitted.v1` | `tenant_id:patient_id` | MV refresh (Sub-decision 9); patient-facing push notifications |

**Cross-references:** SI-019 §Sub-decision 3 + §Sub-decision 9 (Option A transition-event for MV refresh).

---

## 6. OpenAPI v0.2 → v0.3 amendment

**8 new endpoints** under `/v1/medication-interaction/*` (tenant-scoped per ADR-023; RLS-enforced):

| # | Method | Path | Caller role | Purpose |
|---|---|---|---|---|
| 1 | POST | `/v1/medication-interaction/evaluations` | clinician / pharmacist / engine | Trigger engine evaluation; body: trigger + patient_id + optional medication_set override; returns `evaluation_id` |
| 2 | GET | `/v1/medication-interaction/evaluations/:evaluation_id` | clinician / pharmacist / AI Mode 1+2 / admin | Read evaluation + its signals |
| 3 | GET | `/v1/medication-interaction/signals/:signal_id` | clinician / pharmacist / AI / admin | Read single signal (cross-reference from audit row) |
| 4 | POST | `/v1/medication-interaction/signals/:signal_id/overrides` | clinician (override_recorder) | Record override (SECURITY DEFINER procedure §6.NEW7) |
| 5 | GET | `/v1/medication-interaction/patients/:patient_id/active-signals` | clinician / pharmacist | List currently-active signals for patient (clinician + pharmacy dashboards; HOT-PATH DISPLAY consumer — uses SECURITY BARRIER view) |
| 6 | GET | `/v1/medication-interaction/knowledge-base/version` | engine / monitoring / admin | Query active KB version |
| 7 | POST | `/v1/medication-interaction/knowledge-base/updates` | admin (knowledge_base_updater; dual-control per I-015) | KB version update |
| 8 | GET | `/v1/medication-interaction/health` | monitoring | Engine health check (KB connectivity + latency observability) |

**Idempotency:** endpoints 1 + 4 + 7 use `Idempotency-Key` header per canonical IDEMPOTENCY contract.

**Cross-references:** SI-019 §Sub-decision 4.

---

## 7. State Machines v1.1 → v1.2 amendment

**1 new state machine: `interaction_signal_lifecycle`**

Per Option A canonical (Evans-ratified at SI-019 OQ7 2026-05-20), this state machine is described as **DERIVED from append-only `interaction_signal_lifecycle_transition` rows**. The state machine specification documents the allowed transitions; the CHECK constraint on the transition entity + the 6 reason-specific SECURITY DEFINER wrappers + the raw transition writer's state-continuity validation enforce them at the DB layer.

```
States: emitted → active → (overridden | superseded | resolved | expired)
Terminal: overridden, superseded, resolved, expired

Initial transition: none → emitted (transition_reason='emission'; atomic with interaction_signal INSERT)
Allowed transitions (6 triples per Sub-decision 5 CHECK):
    (emission,                  none     → emitted)
    (activation,                emitted  → active)
    (override,                  active   → overridden)
    (superseded_by_evaluation,  active   → superseded)
    (resolution_event,          active   → resolved)
    (time_expiry,               active   → expired)

Current-state derivation contract:
    SELECT to_state
    FROM interaction_signal_lifecycle_transition
    WHERE tenant_id = $tenant_id AND signal_id = $signal_id
    ORDER BY transition_at DESC, id DESC
    LIMIT 1

Persistence model: Option A append-only-only per I-035
    - interaction_signal row IMMUTABLE post-INSERT (no state column)
    - Each transition recorded as new INSERT into interaction_signal_lifecycle_transition
    - Optional rebuildable materialized view interaction_signal_current_state_mv for read-path
```

**Cross-references:** SI-019 §Sub-decision 5 + §OQ7 Option A ratification.

---

## 8. RBAC v1.1 → v1.2 amendment

**4 new application roles + 6 SECURITY DEFINER wrapper owner roles + 2 service-level owner roles = 12 new roles total.**

### Application roles (4)

| Role | Purpose | Granted to (via Admin Backend role-assignment surface) |
|---|---|---|
| `medication_interaction_engine_evaluator` | Engine service writes evaluation + signal rows; calls emission/activation/supersession/expiry wrappers | engine service account; AI Mode 2 protocol execution agent |
| `medication_interaction_signal_viewer` | Read-only access to evaluation + signal + override + lifecycle-transition rows; reads via SECURITY BARRIER view + access function | clinician; pharmacist; AI Mode 1+2; admin |
| `medication_interaction.override_recorder` | Write override (calls §6.NEW7 procedure); requires audit emission | clinician role only |
| `medication_interaction.knowledge_base_updater` | KB version dual-control update (per I-015) | admin (granted via Admin Backend slice; subject to dual-control approval workflow) |

### SECURITY DEFINER wrapper owner roles (6)

These are NOT granted to humans; they OWN the wrapper procedures and are the only roles whose EXECUTE on the raw transition writer is permitted.

| Role | Owns procedure |
|---|---|
| `emission_wrapper_owner` | `record_signal_emission(...)` |
| `activation_wrapper_owner` | `record_signal_activation(...)` |
| `override_wrapper_owner` | `record_interaction_signal_override(...)` (§6.NEW7) |
| `superseded_wrapper_owner` | `record_signal_supersession(...)` |
| `resolution_wrapper_owner` | `record_signal_resolution(...)` |
| `expiry_wrapper_owner` | `record_signal_expiry(...)` |

### Service-level owner roles (2)

| Role | Purpose |
|---|---|
| `lifecycle_transition_writer_owner` | OWNS the raw `record_interaction_signal_lifecycle_transition()` procedure; sole grantee of INSERT on `interaction_signal_lifecycle_transition` table |
| `mv_refresh_owner` | OWNS the materialized view + SECURITY DEFINER access function; runs the REFRESH scheduler + reconciliation cron |

**Subscriber role (referenced but defined elsewhere):** `medication_interaction_resolution_subscriber` — defined in domain-event subscriber RBAC (Async Consult slice domain-event subscription registry); included in the EXECUTE grant table on §6.NEW1-NEW6 for completeness.

**Cross-references:** SI-019 §Sub-decision 6 + §Sub-decision 8.5.

---

## 9. Cross-SI alignment

| Cross-SI surface | This amendment's surface | Relationship |
|---|---|---|
| SI-019 v0.8 RATIFIED 9 sub-decisions + OQ7 Option A | §2.NEW1-5 + §3.NEW1-7 + §4 + §5 + §6 + §7 + §8 | This amendment IS the CDM/AUDIT/DOMAIN_EVENTS/OpenAPI/State Machines/RBAC consolidation of SI-019 v0.8 |
| SI-024.1 v0.8 RATIFIED `jwt_migration_entity_status` seed step (P-031 OQ8) | All 4 new entities seeded at amendment-apply time | All 4 new CDM v1.7 RLS-bearing entities added to `jwt_migration_entity_status` seed |
| INVARIANTS v5.4 §I-023/I-027/I-032/I-035 | All 4 new entities + raw writer + override wrapper | Three-layer tenant isolation + append-only platform floor + Tenant-GUC Mode 1+2 guard + state-machine append-only-only per I-035 |
| SI-005 KMS envelope pattern (P-021) | §2.NEW3 interaction_signal_override 8-column flat envelope | Mirrors clinician_decision_rationale_encrypted pattern |
| Async Consult clinician-decision branch | §5 medication_interaction.signal_emitted.v1 subscriber | New-critical/major-signal re-evaluation on prescribing commit |
| Pharmacy portal | §5 signal_emitted.v1 + signal_lifecycle_transition_emitted.v1 subscribers | Active-signal indicator + lifecycle-change push |
| Adverse Event Reporting | §5 evaluation_completed.v1 + signal_emitted.v1 + signal_override_recorded.v1 subscribers | Correlation engine for missed-signal analysis |
| AUDIT_EVENTS v5.8 → v5.9 | §4 6 new action IDs | Co-bumped per amendment cycle |
| DOMAIN_EVENTS additive | §5 5 new event types | No version bump per established additive-extension pattern |
| OpenAPI v0.2 → v0.3 | §6 8 new endpoints | Co-bumped per amendment cycle |
| State Machines v1.1 → v1.2 | §7 1 new state machine | Co-bumped per amendment cycle |
| RBAC v1.1 → v1.2 | §8 12 new roles | Co-bumped per amendment cycle |
| INVARIANTS bump | **NOT in this amendment** | No new platform-floor invariants; all SI-019 closures align with existing I-023/I-027/I-032/I-035 |

---

## 10. Open questions for ratifier (own ceremony)

1. **OQ1 — `jwt_migration_entity_status` initial seed scope for v1.7 entities.** Recommendation: seed all 4 new CDM v1.7 RLS-bearing entities (interaction_engine_evaluation, interaction_signal, interaction_signal_override, interaction_signal_lifecycle_transition) at amendment-apply time with `phase_4_cutover_eligible=FALSE` default. Cdm_owner flips per-entity as policies migrate to parameterized helper.
2. **OQ2 — `engine_evaluation_completed` Cat A vs Cat C** (preserved from SI-019 Sub-decision 2). Recommendation: Cat A (clinical-evidence-of-evaluation).
3. **OQ3 — SECURITY BARRIER view vs SECURITY DEFINER access function for MV access** (preserved from SI-019 R2 HIGH-2 closure). Recommendation: permit both; SECURITY BARRIER view for set queries (clinician dashboard list-all-active); SECURITY DEFINER function for single-signal lookups (cross-reference from audit row).
4. **OQ4 — Codex pre-ratification target.** Recommendation: 3-5 rounds + 1 ship-it verification. Mechanical consolidation cycle; SI-019 already converged the underlying schemas + procedures (7 rounds; 11 findings closed); this amendment's defect surface is bundle-file-coherence + cross-artifact consistency.

---

## 11. Codex pre-ratification status

**v0.1 DRAFT 2026-05-21:** pre-Codex-review.

**v0.2 DRAFT 2026-05-21 — R1 closures applied (2 HIGH + 2 MED):**
- **R1 HIGH-1 closed:** Advisory-lock key derivation used `hashtextextended()::int` which can overflow casting 64-bit hash to int4 → nondeterministic failure before continuity checks. Fix: switched to `pg_try_advisory_xact_lock(BIGINT)` single-argument overload with namespace-prefixed stable 64-bit hash key (`'interaction_signal_lifecycle_transition:' || tenant_id || ':' || signal_id`); namespace prefix discriminates from other lifecycle subsystems on the same tenant/signal pair.
- **R1 HIGH-2 closed:** SECURITY DEFINER bodies set `search_path = pg_catalog, pg_temp` but called `gen_ulid()` unqualified — would fail to resolve at execution since `gen_ulid()` lives in `public` (or extension) schema. Fix: schema-qualified as `public.gen_ulid()`.
- **R1 MED-1 closed:** SECURITY DEFINER access function `get_interaction_signal_current_state()` declared return types `interaction_signal_state_t` + `interaction_signal_transition_reason_t` but MV columns inherit as TEXT from the transition table's TEXT+CHECK column types. Fix: explicit casts `mv.current_state::interaction_signal_state_t` + `mv.transition_reason::interaction_signal_transition_reason_t` in the return query. Future TYPES amendment cycle should formalize these as DOMAIN types backed by equivalent CHECK constraints and migrate the columns from TEXT to the domain types — at which point the casts become no-ops; for this amendment cycle the casts are the spec-compliant closure.
- **R1 MED-2 closed:** Procedure count inconsistency — §1 scope said 6 procedures but section §3 defined 7 (1 raw + 5 lifecycle wrappers + 1 override wrapper). RBAC §8 already correctly listed 6 wrapper owner roles + 1 service-level role + 1 raw writer owner = 8 owner roles. Fix: normalized scope + §1 in-scope item 1 + §3 heading to "7 SECURITY DEFINER procedures (1 raw transition writer + 5 reason-specific lifecycle wrappers + 1 override wrapper)" — matches §3 body + §8 RBAC roles.

Authored on `spec/cdm-v1-7-audit-v5-9-openapi-v0-3-sm-v1-2-rbac-v1-2-si019-followon-2026-05-21` branch off main at `af66412` (post-P-033 + Addendum 61). v0.2 commit `dc54ce1`. v0.3 commit `0c1177b`. v0.4 commit pending push for R4 verification.

**v0.3 DRAFT 2026-05-21 — R2 closure applied (1 HIGH):**
- **R2 HIGH-1 closed:** SECURITY DEFINER caller-identity check defect. Override wrapper STEP 4 clinician-role check would evaluate `current_user` against `override_wrapper_owner` (the procedure owner under SECURITY DEFINER semantics) rather than the actual app-role caller. Any role holding EXECUTE on the procedure would silently pass the role gate. Fix: spec normatively requires GUC-supplied actor-role validation pattern (`current_setting('app.actor_role') + pg_has_role(actor_role::regrole, '<role>', 'MEMBER')`) for ALL 6 reason-specific wrappers + the override wrapper; FORBIDS `current_user` for caller authorization inside SECURITY DEFINER bodies in this amendment cycle; defense-in-depth alongside the PostgreSQL-level GRANT EXECUTE chain. Added rejection codes `actor_role_missing` (Mode 1; GUC absent/blank) + `unauthorized_role` (Mode 2; actor lacks required role membership). Raw transition writer (§6.NEW1) does NOT do role validation — wrappers are the trust boundary; raw writer relies on owner-only EXECUTE chain. Pattern is identical to the I-032 v5.3 tenant-GUC Mode 1+2 guard pattern applied to actor_role instead of tenant_id.

**v0.4 DRAFT 2026-05-21 — R3 closure applied (1 HIGH — recursive defect on R2):**
- **R3 HIGH-1 closed:** R2's GUC-only pattern still trusted caller-controlled mutable state. A compromised/buggy caller with EXECUTE on the wrapper could `SET app.actor_role = 'medication_interaction.override_recorder'` and pass `pg_has_role(actor_role::regrole, '<required>', 'MEMBER')` — the GUC is caller-set, so the check proves the named role's membership but does NOT prove the caller is entitled to claim that role. Same defect-class as direct-DB-role spoofing. Fix per canonical SI-024.1 v0.8 RATIFIED JWT-binding model (P-031): SUPERSEDED the GUC-only pattern with JWT-verified-claims pattern. Wrapper STEP 4 reads actor_role from JWT-verified claims via `verify_session_jwt_and_extract_claims()` — the SI-024.1 helper that performs a read-only EXISTS check against `session_jwt_admission` (CDM v1.6 §4.NEW1) which is cryptographically bound to the current PostgreSQL backend via the (backend_pid, backend_start_at, jwt_id) admission-binding invariant. Phase B fallback to GUC pattern permitted IF AND ONLY IF the entity's `phase_4_cutover_eligible=FALSE` AND `raw_guc_fallback_audited=TRUE` (per `jwt_migration_entity_status` per SI-024.1 Sub-decision 9); the fallback emits `tenant_context.raw_guc_fallback_used` audit per SI-024.1 contract. The cryptographic trust chain: middleware presents JWT → `admit_session_jwt()` INSERTs admission row bound to current backend → `verify_session_jwt_and_extract_claims()` returns verified claims under EXISTS check → actor identity bound to JWT signature + current backend. Compromised callers cannot self-assert because they would need to forge a JWT signature AND admit it to their backend. Cross-reference: SI-024.1 v0.8 §Sub-decision 1 (admission-binding invariant); CDM v1.6 §4.NEW1 (session_jwt_admission entity); CDM v1.6 §4.NEW5 (jwt_migration_entity_status fallback gate).

---

— Claude (Opus 4.7, 1M context), CDM v1.6 → v1.7 + AUDIT_EVENTS v5.8 → v5.9 + OpenAPI v0.2 → v0.3 + State Machines v1.1 → v1.2 + RBAC v1.1 → v1.2 SI-019 follow-on amendment v0.1 DRAFT authored 2026-05-21 per P-033 OQ canonical decision + established post-P-029 SI-spec-first promotion pattern + CLAUDE.md two-pass discipline + auto-proceed rule. R1 Codex review queued.
