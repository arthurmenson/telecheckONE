# CDM v1.5 → v1.6 Amendment (SI-024.1 follow-on)

**Version:** 0.8 DRAFT
**Status:** POST-PASS-2 R6 (R7 HIGH-9 closed: Pass-2 R6 caught that the R5 fix of GRANT SELECT TO PUBLIC on §4.NEW5 overexposed the fallback-gate state — every connectable role could enumerate which entities still allow raw-GUC fallback and whether fallback audit is enabled, giving an attacker a reconnaissance channel on the least-hardened surfaces. Fix per Pass-2 R6 verbatim recommendation: replace PUBLIC table grant with two SECURITY DEFINER helper functions (`is_jwt_required_for_entity` + `is_raw_guc_fallback_audited_for_entity`) owned by cdm_owner with locked search_path; GRANT EXECUTE on the helpers to PUBLIC; keep table SELECT restricted to cdm_owner only. Underlying table row state is now opaque to non-cdm_owner roles. Awaiting Pass-2 R7 verification.)
**Authoring date:** 2026-05-20
**Trigger:** Promotion Ledger P-031 (SI-024.1 v0.8 RATIFIED + Registry v2.17 → v2.18). Per the established post-P-029 spec-first promotion pattern, SI-024.1's 5 new entities + 10 new audit events (9 Cat A + 1 Cat B) land in CDM + AUDIT_EVENTS via a separate amendment cycle following SI ratification (mirrors P-029's pattern of CDM amendment AFTER SI-021 ratified).
**Owner:** SRE Lead + Security Engineering Lead + CDM owner (same triad as SI-024.1).
**Parent SI:** SI-024.1 v0.8 RATIFIED (`Telecheck_SI_024_1_Cryptographic_JWT_Binding_v1_0.md`); P-031 is the ratification authority for this amendment.
**Companion documents:** SI-024 v0.17 TRANSITIONAL (parent of SI-024.1; CDM v1.5 baseline) + P-030 + P-031 + previous CDM amendment pattern (`Telecheck_CDM_v1_4_to_v1_5_Amendment.md` from SI-021 cycle).

---

## 1. Purpose + scope

This amendment promotes the 5 new entities defined in SI-024.1 v0.8 RATIFIED into CDM v1.5 → v1.6 as canonical entity rows. Co-bumped: AUDIT_EVENTS v5.7 → v5.8 (10 new Cat A events under `tenant_context.*` namespace).

The amendment is mechanical consolidation of already-Codex-converged canonical content from SI-024.1 v0.8 RATIFIED into the canonical contract surfaces. Per the established post-P-029 spec-first pattern, the SI authoring + ratification cycle (P-031, 19 findings closed across 8 cycles) closed the architectural questions; this amendment is the canonical CDM/AUDIT_EVENTS landing.

**In scope:**

1. CDM v1.5 → v1.6 with 5 new entities (continuing CDM numbering from v1.5's 75 active entities + 3 derived views; v1.6 target: 80 active entities + 3 derived views).
2. AUDIT_EVENTS v5.7 → v5.8 with 10 new audit events (9 Cat A under `tenant_context.*` namespace + 1 Cat B `cdm.entity_jwt_migration_status_added` under `cdm.*` namespace).
3. Forward-reference FK constraints (`break_glass_active_session.approval_id` → `break_glass_approval.id` per SI-024.1 Sub-decision 7).
4. RLS policy + audit-bound trigger application per the convergent canonical pattern (every PHI-bearing CDM entity carries `tenant_id` + RLS per I-023; append-only entities carry `enforce_append_only()` per I-027).
5. Cross-reference into SI-024.1 v0.8 + SI-024 v0.17 TRANSITIONAL + Sprint 13 KMS Architecture + INVARIANTS v5.4 §I-023/I-024/I-025/I-027.
6. `jwt_migration_entity_status` seed population for all CDM v1.5 + v1.6 RLS-bearing entities (per SI-024.1 Pass-2 HIGH-2 closure mandatory seed step + OQ8/9 ratification).

**Out of scope:**

- SI-024.1 procedure-side implementation (Phase A foundation; `telecheck-app` code repo).
- Phase D telemetry-clean window operational verification.
- INVARIANTS v5.4 → v5.5 (I-036) — lands separately at first Phase 4 entity cutover per SI-024 OQ5 (NOT co-bumped here).
- Hypothetical SI-024.2 cryptographic per-statement fallback audit enforcement (Phase 3+; simplification #10).

---

## 2. New CDM entities (5)

All 5 entities are P2 governance-partition entities (per SI-018 partition rule: tenant-context infrastructure is platform-scoped, not patient-bound). All carry `tenant_id` where applicable per I-023 three-layer tenant isolation; the `_legacy_v017_caller_` sentinel + platform-wide entries use `PLATFORM_TENANT_ID` sentinel per I-024.

### §4.NEW1 — `session_jwt_admission` (CDM v1.6 new; SI-024.1 Sub-decision 1)

Admission-binding record table; pure-STABLE `verify_session_jwt_and_extract_claims()` performs read-only EXISTS check against this table to prove `admit_session_jwt()` was called in the current PostgreSQL backend.

```sql
CREATE TABLE session_jwt_admission (
    -- Composite primary identity bound to specific PostgreSQL backend process.
    backend_pid INTEGER NOT NULL,                  -- pg_backend_pid() at admission time
    backend_start_at TIMESTAMPTZ NOT NULL,         -- current_backend_start_at() — protects against pid reuse
    jwt_id UUID NOT NULL,
    tenant_id tenant_id_t NOT NULL,
    actor_human_id UUID NOT NULL,
    actor_role TEXT NOT NULL,
    key_id UUID NOT NULL,
    key_purpose TEXT NOT NULL CHECK (key_purpose IN ('platform_tenant_jwt', 'tenant_break_glass_jwt')),
    admitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (backend_pid, backend_start_at, jwt_id)
);
CREATE INDEX session_jwt_admission_active_lookup
    ON session_jwt_admission (backend_pid, backend_start_at, jwt_id, expires_at);

-- Three-layer RLS enforcement
ALTER TABLE session_jwt_admission ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_jwt_admission FORCE ROW LEVEL SECURITY;
CREATE POLICY session_jwt_admission_tenant_isolation ON session_jwt_admission
    USING (tenant_id = current_tenant_id_strict('session_jwt_admission'));

-- Cleanup-role DELETE policy (R3 HIGH closure 2026-05-20: Pass-2 R2 caught a FORCE-RLS gap — the
-- tenant-isolation policy above applies to ALL commands, so the platform-scoped cleanup job running as
-- sec_jwt_cleanup without per-tenant context would fail RLS before reaching the TTL trigger. Add a
-- permissive FOR DELETE policy scoped to sec_jwt_cleanup on expired rows; composes as OR with the
-- tenant-isolation policy at DELETE time). Cleanup execution context: platform-wide background job (NOT
-- per-tenant), runs as sec_jwt_cleanup role with no app.* GUC tenant context set; relies on this policy
-- to cross tenant boundaries for TTL cleanup. The trigger predicate remains as defense-in-depth.
CREATE POLICY session_jwt_admission_cleanup ON session_jwt_admission
    FOR DELETE TO sec_jwt_cleanup
    USING (expires_at < now() - INTERVAL '1 hour');

-- Append-only enforcement with TTL-cleanup carve-out (R2 HIGH closure 2026-05-20:
-- Pass-2 caught a SECURITY DEFINER + current_user pitfall — under SECURITY DEFINER, current_user resolves
-- to the function owner, not the caller, breaking caller-identity authorization. Fix: trigger function is
-- SECURITY INVOKER (default — omit the qualifier) so current_user equals the actual role performing the
-- DML. Complemented by explicit GRANT/REVOKE DDL below to make sec_jwt_cleanup the only role permitted to
-- DELETE — defense-in-depth: PostgreSQL-level privilege check denies non-sec_jwt_cleanup callers BEFORE the
-- trigger fires; the trigger then enforces the TTL slack predicate on permitted callers).
CREATE FUNCTION session_jwt_admission_append_only_with_ttl_cleanup() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'session_jwt_admission is append-only; UPDATE forbidden'
            USING ERRCODE = 'invalid_column_reference';
    END IF;
    IF TG_OP = 'DELETE' THEN
        -- Permit DELETE only for the dedicated cleanup role on rows past their TTL+slack window.
        -- current_user is the invoking role here because the function is SECURITY INVOKER (default).
        IF current_user = 'sec_jwt_cleanup' AND OLD.expires_at < now() - INTERVAL '1 hour' THEN
            RETURN OLD;
        END IF;
        RAISE EXCEPTION 'session_jwt_admission DELETE only permitted for sec_jwt_cleanup role on expired rows (expires_at < now() - 1 hour); attempted by role=% on row expires_at=%',
            current_user, OLD.expires_at
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;
-- Note: no SECURITY DEFINER qualifier — function executes as SECURITY INVOKER (default), so
-- current_user resolves correctly to the role invoking the DML.

CREATE TRIGGER session_jwt_admission_append_only_with_ttl
    BEFORE UPDATE OR DELETE ON session_jwt_admission
    FOR EACH ROW EXECUTE FUNCTION session_jwt_admission_append_only_with_ttl_cleanup();

-- Defense-in-depth privilege DDL (R5 HIGH-8 closure 2026-05-20: Pass-2 R5 caught that deferring INSERT
-- privilege to the SI-024.1 procedure-side artifact left the table under FORCE RLS with no explicit
-- INSERT grant for the admit role — admission INSERT could fail or rely on inherited table-owner
-- privileges, which is exactly the class of gap this cycle has been closing. Define the canonical
-- admit write role here and grant INSERT explicitly). The existing tenant-isolation policy (no FOR
-- clause = all commands) implicitly applies its USING expression as the WITH CHECK for INSERT, so
-- RLS-wise the admit path is already covered — only the table privilege grant was missing.
REVOKE INSERT, DELETE ON session_jwt_admission FROM PUBLIC;
GRANT INSERT ON session_jwt_admission TO admit_session_jwt_owner;
GRANT DELETE ON session_jwt_admission TO sec_jwt_cleanup;
```

**Cross-references:** SI-024.1 §Sub-decision 1 (split verifier + admission-binding invariant); INVARIANTS v5.4 §I-023/I-027 (three-layer tenant isolation + append-only platform floor).

### §4.NEW2 — `session_jwt_replay_set` (CDM v1.6 new; SI-024.1 Sub-decision 5)

Anti-replay tracking for JWT IDs (`jti` claim); INSERT by `admit_session_jwt()` per first-seen JWT; conflict-detection distinguishes same-backend idempotent retry from cross-backend replay.

```sql
CREATE TABLE session_jwt_replay_set (
    jwt_id UUID PRIMARY KEY,
    tenant_id tenant_id_t NOT NULL,
    backend_pid INTEGER NOT NULL,                  -- pg_backend_pid() at first admission
    backend_start_at TIMESTAMPTZ NOT NULL,         -- current_backend_start_at() — protects against pid reuse
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL                -- = JWT's expires_at claim
);

-- Three-layer RLS enforcement
ALTER TABLE session_jwt_replay_set ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_jwt_replay_set FORCE ROW LEVEL SECURITY;
CREATE POLICY session_jwt_replay_set_tenant_isolation ON session_jwt_replay_set
    USING (tenant_id = current_tenant_id_strict('session_jwt_replay_set'));

-- Cleanup-role DELETE policy (R3 HIGH closure 2026-05-20: same FORCE-RLS gap as §4.NEW1). Higher-cost
-- here: failed cleanup would grow the anti-replay set without bound and stale rows would eventually
-- cause JWT admission failures (legitimate JWTs with reused jti within retention window get rejected).
CREATE POLICY session_jwt_replay_set_cleanup ON session_jwt_replay_set
    FOR DELETE TO sec_jwt_cleanup
    USING (expires_at < now() - INTERVAL '1 hour');

-- Append-only enforcement with TTL-cleanup carve-out (R2 HIGH closure 2026-05-20: same SECURITY INVOKER +
-- explicit GRANT/REVOKE defense-in-depth pattern as §4.NEW1 per Pass-2 finding). Replay-set is the higher-
-- cost case: failed TTL deletion grows the table without bound; over-permissive deletion erases replay
-- evidence. Both failure modes are unacceptable, so caller-identity authorization MUST resolve correctly.
CREATE FUNCTION session_jwt_replay_set_append_only_with_ttl_cleanup() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'session_jwt_replay_set is append-only; UPDATE forbidden'
            USING ERRCODE = 'invalid_column_reference';
    END IF;
    IF TG_OP = 'DELETE' THEN
        -- Permit DELETE only for the dedicated cleanup role on rows past their TTL+slack window.
        -- current_user is the invoking role here because the function is SECURITY INVOKER (default).
        IF current_user = 'sec_jwt_cleanup' AND OLD.expires_at < now() - INTERVAL '1 hour' THEN
            RETURN OLD;
        END IF;
        RAISE EXCEPTION 'session_jwt_replay_set DELETE only permitted for sec_jwt_cleanup role on expired rows (expires_at < now() - 1 hour); attempted by role=% on row expires_at=%',
            current_user, OLD.expires_at
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;
-- Note: no SECURITY DEFINER qualifier — function executes as SECURITY INVOKER (default), so
-- current_user resolves correctly to the role invoking the DML.

CREATE TRIGGER session_jwt_replay_set_append_only_with_ttl
    BEFORE UPDATE OR DELETE ON session_jwt_replay_set
    FOR EACH ROW EXECUTE FUNCTION session_jwt_replay_set_append_only_with_ttl_cleanup();

-- Defense-in-depth privilege DDL (R5 HIGH-8 closure 2026-05-20: same FORCE-RLS + missing-INSERT-grant
-- gap as §4.NEW1; same fix — define canonical admit role and grant INSERT explicitly). Replay-set
-- INSERT failure mode is especially urgent: if admit cannot record the jti in the replay set, the
-- anti-replay invariant breaks open (legitimate JWTs may double-admit).
REVOKE INSERT, DELETE ON session_jwt_replay_set FROM PUBLIC;
GRANT INSERT ON session_jwt_replay_set TO admit_session_jwt_owner;
GRANT DELETE ON session_jwt_replay_set TO sec_jwt_cleanup;
```

**Cross-references:** SI-024.1 §Sub-decision 5; INVARIANTS v5.4 §I-023/I-027.

### §4.NEW3 — `jwt_signing_key_public` (CDM v1.6 new; SI-024.1 Sub-decision 4)

KMS-backed signing-key registry; public-key cached in DB for low-latency verification; private-key half lives in AWS KMS HSM (referenced by `kms_key_arn`); per SI-024.1 Sub-decision 2 two-key model: `platform_tenant_jwt` rows have `tenant_id IS NULL`, `tenant_break_glass_jwt` rows have specific `tenant_id`.

```sql
CREATE TABLE jwt_signing_key_public (
    key_id UUID PRIMARY KEY,
    key_purpose TEXT NOT NULL CHECK (key_purpose IN ('platform_tenant_jwt', 'tenant_break_glass_jwt')),
    tenant_id tenant_id_t,                         -- NULL for platform_tenant_jwt; specific for tenant_break_glass_jwt
    public_key_pem TEXT NOT NULL,
    kms_key_arn TEXT NOT NULL,                     -- AWS KMS key ARN for private-key half
    algorithm TEXT NOT NULL CHECK (algorithm = 'RSA-PSS-SHA256'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    activated_at TIMESTAMPTZ NOT NULL,
    deactivated_at TIMESTAMPTZ,                    -- NULL = currently active
    CONSTRAINT jwt_signing_key_purpose_tenant CHECK (
        (key_purpose = 'platform_tenant_jwt' AND tenant_id IS NULL)
        OR (key_purpose = 'tenant_break_glass_jwt' AND tenant_id IS NOT NULL)
    )
);

-- RLS: two-mode policy. Platform keys are readable by all (signing-key verification is a global lookup).
-- Tenant break-glass keys are tenant-isolated.
ALTER TABLE jwt_signing_key_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE jwt_signing_key_public FORCE ROW LEVEL SECURITY;
CREATE POLICY jwt_signing_key_public_read ON jwt_signing_key_public
    FOR SELECT
    USING (
        key_purpose = 'platform_tenant_jwt'  -- platform keys readable by all
        OR (key_purpose = 'tenant_break_glass_jwt'
            AND tenant_id = current_tenant_id_strict('jwt_signing_key_public'))
    );

-- Write-path RLS for KMS rotation operator role (R3 HIGH-4 closure 2026-05-20: Pass-2 R3 caught that
-- FORCE RLS + SELECT-only policy blocks all writes; KMS rotation INSERT and key-deactivation UPDATE
-- need explicit role-scoped policies). INSERT permits the rotation operator to add new key rows.
-- UPDATE policy is column-scoped to deactivated_at only (the only mutable field; identity columns are
-- locked by the append-only trigger below).
CREATE POLICY jwt_signing_key_public_rotation_insert ON jwt_signing_key_public
    FOR INSERT TO kms_rotation_operator
    WITH CHECK (deactivated_at IS NULL);  -- new rows always start active
CREATE POLICY jwt_signing_key_public_rotation_deactivate ON jwt_signing_key_public
    FOR UPDATE TO kms_rotation_operator
    USING (deactivated_at IS NULL)        -- only active rows are eligible for deactivation
    WITH CHECK (deactivated_at IS NOT NULL);  -- update must set deactivated_at (one-way NULL → timestamp)

-- Defense-in-depth privilege DDL
REVOKE INSERT, UPDATE, DELETE ON jwt_signing_key_public FROM PUBLIC;
GRANT INSERT, UPDATE ON jwt_signing_key_public TO kms_rotation_operator;

-- Append-only on identity columns; deactivated_at is the only mutable lifecycle field (NULL → timestamp,
-- one-way; same pattern as break_glass_approval.revoked_at).
CREATE TRIGGER jwt_signing_key_public_append_only
    BEFORE UPDATE OF key_id, key_purpose, tenant_id, public_key_pem, kms_key_arn, algorithm, created_at, activated_at
    OR DELETE ON jwt_signing_key_public
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

-- One-way lifecycle enforcement for deactivated_at (R3 HIGH-5 closure 2026-05-20: Pass-2 R3 caught that
-- deactivated_at was documented as one-way but no trigger enforced it — once UPDATE was granted, an
-- operator could reactivate a retired key by setting deactivated_at back to NULL or to a different
-- timestamp. Enforce NULL → non-NULL only; reject non-NULL → NULL and non-NULL → different timestamp).
CREATE FUNCTION jwt_signing_key_public_one_way_deactivated_at() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.deactivated_at IS NOT NULL AND NEW.deactivated_at IS DISTINCT FROM OLD.deactivated_at THEN
        RAISE EXCEPTION 'jwt_signing_key_public.deactivated_at is one-way (NULL → timestamp); cannot change once set: was % is %',
            OLD.deactivated_at, NEW.deactivated_at
            USING ERRCODE = 'invalid_column_reference';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;
CREATE TRIGGER jwt_signing_key_public_one_way_deactivated_at
    BEFORE UPDATE OF deactivated_at ON jwt_signing_key_public
    FOR EACH ROW EXECUTE FUNCTION jwt_signing_key_public_one_way_deactivated_at();
```

**Cross-references:** SI-024.1 §Sub-decision 2 (two-key model) + §Sub-decision 4 (KMS HSM); Sprint 13 KMS Architecture §HSM-signer-role.

### §4.NEW4 — `break_glass_active_session` (CDM v1.6 new; SI-024.1 Sub-decision 7)

Per-access break-glass session tracking; INSERT by `begin_target_tenant_break_glass_session()`; canonical authority for `is_target_tenant_break_glass_active()` helper's RLS gate.

```sql
CREATE TABLE break_glass_active_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_tenant_id tenant_id_t NOT NULL,
    operator_user_id UUID NOT NULL,
    operator_role TEXT NOT NULL,
    bound_jwt_id UUID NOT NULL,                    -- Binds session to specific JWT (prevents stolen-session-id reuse)
    session_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    session_expires_at TIMESTAMPTZ NOT NULL,
    intended_purpose TEXT NOT NULL,
    approval_id UUID NOT NULL REFERENCES break_glass_approval(id),
    closed_at TIMESTAMPTZ,
    CONSTRAINT break_glass_active_session_unique_per_jwt
        UNIQUE (bound_jwt_id, target_tenant_id)
);
CREATE INDEX break_glass_active_session_helper_lookup
    ON break_glass_active_session (bound_jwt_id, target_tenant_id, operator_user_id, operator_role, closed_at)
    WHERE closed_at IS NULL;

-- Three-layer RLS enforcement (operator self-service + platform-operator break-glass)
ALTER TABLE break_glass_active_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE break_glass_active_session FORCE ROW LEVEL SECURITY;
CREATE POLICY break_glass_active_session_operator_self ON break_glass_active_session
    FOR SELECT
    USING (
        is_platform_operator_break_glass_active()
        AND operator_user_id = current_setting('app.actor_human_id', false)::UUID
        AND closed_at IS NULL
        AND session_expires_at > now()
    );

-- Write-path RLS for break-glass procedure role (R3 HIGH-4 closure 2026-05-20: Pass-2 R3 caught that
-- FORCE RLS + SELECT-only policy blocks INSERT by begin_target_tenant_break_glass_session() and UPDATE
-- by session-close path; needs explicit role-scoped policies). The break_glass_procedure_owner role is
-- the privilege-holder for the SI-024.1 begin/close procedures; it's the only role that can write rows.
CREATE POLICY break_glass_active_session_procedure_insert ON break_glass_active_session
    FOR INSERT TO break_glass_procedure_owner
    WITH CHECK (closed_at IS NULL);  -- new sessions always start open
CREATE POLICY break_glass_active_session_procedure_close ON break_glass_active_session
    FOR UPDATE TO break_glass_procedure_owner
    USING (closed_at IS NULL)        -- only open sessions are eligible for close
    WITH CHECK (closed_at IS NOT NULL);  -- update must set closed_at (one-way NULL → timestamp)

-- Defense-in-depth privilege DDL
REVOKE INSERT, UPDATE, DELETE ON break_glass_active_session FROM PUBLIC;
GRANT INSERT, UPDATE ON break_glass_active_session TO break_glass_procedure_owner;

-- Append-only on identity columns; closed_at is the only mutable lifecycle field (NULL → timestamp,
-- one-way) for session-close.
CREATE TRIGGER break_glass_active_session_append_only
    BEFORE UPDATE OF id, target_tenant_id, operator_user_id, operator_role, bound_jwt_id,
                    session_start, session_expires_at, intended_purpose, approval_id
    OR DELETE ON break_glass_active_session
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

-- One-way lifecycle enforcement for closed_at (R3 HIGH-5 closure 2026-05-20: same pattern as
-- §4.NEW3.deactivated_at — without this trigger, once UPDATE was granted, an operator could reopen
-- a closed session by setting closed_at back to NULL or to a different timestamp).
CREATE FUNCTION break_glass_active_session_one_way_closed_at() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.closed_at IS NOT NULL AND NEW.closed_at IS DISTINCT FROM OLD.closed_at THEN
        RAISE EXCEPTION 'break_glass_active_session.closed_at is one-way (NULL → timestamp); cannot change once set: was % is %',
            OLD.closed_at, NEW.closed_at
            USING ERRCODE = 'invalid_column_reference';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;
CREATE TRIGGER break_glass_active_session_one_way_closed_at
    BEFORE UPDATE OF closed_at ON break_glass_active_session
    FOR EACH ROW EXECUTE FUNCTION break_glass_active_session_one_way_closed_at();
```

**Cross-references:** SI-024.1 §Sub-decision 7 (per-access break-glass session); INVARIANTS v5.4 §I-023/I-024/I-027.

### §4.NEW5 — `jwt_migration_entity_status` (CDM v1.6 new; SI-024.1 Sub-decision 9 Phase B)

Per-entity Phase B fallback gate control table; populated by Phase A foundation migration seed step + maintained by CDM owner per OQ9 ratification.

```sql
CREATE TABLE jwt_migration_entity_status (
    entity_name TEXT PRIMARY KEY,
    phase_4_cutover_eligible BOOLEAN NOT NULL DEFAULT TRUE,        -- TRUE = JWT required; raw-GUC fallback denied
    production_break_glass_surface BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE = JWT required regardless of phase_4 flag
    raw_guc_fallback_audited BOOLEAN NOT NULL DEFAULT TRUE,        -- TRUE = emit raw_guc_fallback_used on fallback
    migrated_at TIMESTAMPTZ,                                       -- timestamp of per-entity policy migration to parameterized helper
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Platform-scoped fallback-gate control table; no tenant_id. SELECT is NOT broadly granted (R6 HIGH-9
-- closure 2026-05-20: PUBLIC read leaks per-entity fallback/cutover state to attackers). Reads happen
-- only via the SECURITY DEFINER helpers below; the underlying table is opaque to non-cdm_owner roles.
-- Write-path RLS for CDM-owner role (R4 HIGH-6 closure 2026-05-20: Pass-2 R4 caught that this
-- security-critical fallback-gate control table had NO RLS/privilege DDL despite the prose stating
-- "INSERT/UPDATE limited to CDM-owner role". Without executable RLS + REVOKE/GRANT, the fallback gate
-- would depend on unspecified external grants — a role with inherited owner privileges or accidental
-- broad grant could silently disable JWT-required cutover or fallback auditing).
ALTER TABLE jwt_migration_entity_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE jwt_migration_entity_status FORCE ROW LEVEL SECURITY;
CREATE POLICY jwt_migration_entity_status_cdm_owner_read ON jwt_migration_entity_status
    FOR SELECT TO cdm_owner
    USING (true);  -- cdm_owner sees all rows (only cdm_owner has table SELECT privilege)
CREATE POLICY jwt_migration_entity_status_cdm_owner_insert ON jwt_migration_entity_status
    FOR INSERT TO cdm_owner
    WITH CHECK (true);
CREATE POLICY jwt_migration_entity_status_cdm_owner_update ON jwt_migration_entity_status
    FOR UPDATE TO cdm_owner
    USING (true)
    WITH CHECK (true);

-- Defense-in-depth privilege DDL (R6 HIGH-9 closure 2026-05-20: Pass-2 R6 caught that GRANT SELECT TO
-- PUBLIC overexposed the fallback-gate state — every connectable role could enumerate which entities
-- still allow raw-GUC fallback and whether fallback audit is enabled, giving an attacker a
-- reconnaissance channel on the least-hardened/least-observable surfaces. Fix per Pass-2 R6 verbatim
-- recommendation: keep table SELECT restricted to cdm_owner; expose only narrow boolean decision
-- helpers via SECURITY DEFINER functions; grant EXECUTE on helpers to PUBLIC). INSERT/UPDATE
-- restricted to cdm_owner. Column-level UPDATE grants restrict mutable fields to the documented set
-- (the append-only trigger below also enforces entity_name + production_break_glass_surface immutability).
REVOKE ALL ON jwt_migration_entity_status FROM PUBLIC;
GRANT SELECT, INSERT ON jwt_migration_entity_status TO cdm_owner;
GRANT UPDATE (phase_4_cutover_eligible, raw_guc_fallback_audited, migrated_at, updated_at)
    ON jwt_migration_entity_status TO cdm_owner;

-- SECURITY DEFINER helper functions (owned by cdm_owner) expose only the minimal boolean decision
-- interface needed by current_tenant_id_strict() and the fallback-audit emission path. Locked
-- search_path prevents search-path injection. PUBLIC gets EXECUTE on the helpers ONLY — the
-- underlying table row state remains opaque to non-cdm_owner roles.
CREATE FUNCTION is_jwt_required_for_entity(p_entity_name TEXT) RETURNS BOOLEAN AS $$
DECLARE
    v_phase_4_cutover BOOLEAN;
    v_production_break_glass BOOLEAN;
BEGIN
    SELECT phase_4_cutover_eligible, production_break_glass_surface
        INTO v_phase_4_cutover, v_production_break_glass
        FROM jwt_migration_entity_status
        WHERE entity_name = p_entity_name;
    IF NOT FOUND THEN
        -- Conservative default: unknown entities require JWT (fail-closed).
        RETURN TRUE;
    END IF;
    RETURN v_phase_4_cutover OR v_production_break_glass;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = pg_catalog, public;

CREATE FUNCTION is_raw_guc_fallback_audited_for_entity(p_entity_name TEXT) RETURNS BOOLEAN AS $$
DECLARE
    v_audited BOOLEAN;
BEGIN
    SELECT raw_guc_fallback_audited INTO v_audited
        FROM jwt_migration_entity_status
        WHERE entity_name = p_entity_name;
    IF NOT FOUND THEN
        -- Conservative default: unknown entities emit fallback audit (fail-loud).
        RETURN TRUE;
    END IF;
    RETURN v_audited;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = pg_catalog, public;

REVOKE EXECUTE ON FUNCTION is_jwt_required_for_entity(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION is_raw_guc_fallback_audited_for_entity(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_jwt_required_for_entity(TEXT) TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_raw_guc_fallback_audited_for_entity(TEXT) TO PUBLIC;

-- Append-only on entity_name + production_break_glass_surface (those are determined by entity classification at creation).
CREATE TRIGGER jwt_migration_entity_status_append_only
    BEFORE UPDATE OF entity_name, production_break_glass_surface OR DELETE
    ON jwt_migration_entity_status
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
```

**Initial seed (per SI-024.1 OQ8):** Phase A migration seeds one row per existing CDM v1.5 + v1.6 RLS-bearing entity + `_legacy_v017_caller_` sentinel. Default phase_4_cutover_eligible=FALSE during Phase B; flipped to TRUE per-entity as policies migrate.

**Cross-references:** SI-024.1 §Sub-decision 9 (per-entity fallback gate) + OQ8/9 (initial seed + maintenance authority).

---

## 3. AUDIT_EVENTS v5.7 → v5.8 amendment

**10 new audit events** (9 Cat A under `tenant_context.*` namespace + 1 Cat B under `cdm.*` namespace):

| # | Event | Source |
|---|---|---|
| 1 | `tenant_context.target_tenant_break_glass_session_started` | begin_target_tenant_break_glass_session() — per-access audit |
| 2 | `tenant_context.target_tenant_break_glass_session_closed` | session closure (explicit or expiry-driven via cleanup job) |
| 3 | `tenant_context.jwt_signature_verification_failed` | verify_session_jwt_and_extract_claims() raise on invalid signature |
| 4 | `tenant_context.jwt_replay_attempt_detected` | replay detection in anti-replay set |
| 5 | `tenant_context.jwt_signing_key_rotated` | new row in jwt_signing_key_public |
| 6 | `tenant_context.break_glass_approval_proposed` | propose_break_glass_approval() — phase 1 of dual-control |
| 7 | `tenant_context.break_glass_approval_co_authorized` | co_authorize_break_glass_approval() — phase 2 → 'active' |
| 8 | `tenant_context.break_glass_approval_rejected` | explicit rejection by co-authorizer (future reject_break_glass_approval procedure) |
| 9 | `tenant_context.raw_guc_fallback_used` | emit_raw_guc_fallback_audit() — middleware-contract-mandatory fallback telemetry |
| 10 | **Cat B** `cdm.entity_jwt_migration_status_added` | new entity added to jwt_migration_entity_status (CDM-amendment-authoring discipline per OQ9) |

**Audit-CHECK constraint amendment:** `audit_events.action_id CHECK` constraint must enumerate the 10 new action IDs to satisfy I-012 closure rule:

```sql
ALTER TABLE audit_events DROP CONSTRAINT audit_events_action_id_check;
ALTER TABLE audit_events
    ADD CONSTRAINT audit_events_action_id_check CHECK (
        action_id IN (
            -- ... existing v5.7 enumeration preserved ...
            'tenant_context.target_tenant_break_glass_session_started',
            'tenant_context.target_tenant_break_glass_session_closed',
            'tenant_context.jwt_signature_verification_failed',
            'tenant_context.jwt_replay_attempt_detected',
            'tenant_context.jwt_signing_key_rotated',
            'tenant_context.break_glass_approval_proposed',
            'tenant_context.break_glass_approval_co_authorized',
            'tenant_context.break_glass_approval_rejected',
            'tenant_context.raw_guc_fallback_used',
            'cdm.entity_jwt_migration_status_added'
        )
    );
```

---

## 4. Cross-SI alignment

| Cross-SI surface | This amendment's surface | Relationship |
|---|---|---|
| SI-024.1 v0.8 RATIFIED Sub-decisions 1-10 | §4.NEW1-5 + §3 | This amendment IS the CDM/AUDIT_EVENTS consolidation of SI-024.1 v0.8 |
| SI-024 v0.17 TRANSITIONAL (parent) | §4.NEW4 break_glass_active_session FK to break_glass_approval (added in SI-024 v0.17 CDM amendment cycle — needs CDM v1.5 baseline) | Prerequisite: SI-024 v0.17 break_glass_approval entity must already be in CDM v1.5 |
| INVARIANTS v5.4 §I-023/I-024/I-025/I-027 | All 5 new entities | Three-layer tenant isolation + platform-record convention + tenant-blind errors + append-only platform floor |
| Sprint 13 KMS Architecture | §4.NEW3 jwt_signing_key_public.kms_key_arn | Shared KMS HSM infrastructure |
| Sprint 18 RBAC v1.2 | §4.NEW4 + §4.NEW5 platform-operator role set | Role-set canonical source |
| AUDIT_EVENTS v5.7 → v5.8 | §3 10 new events | Co-bumped per amendment cycle |
| INVARIANTS v5.4 → v5.5 (I-036) | **NOT in this amendment** | Deferred to first Phase 4 entity cutover per SI-024 OQ5 + SI-024.1 Sub-decision 9 Phase F |

---

## 5. Open questions for ratifier (own ceremony)

1. **OQ1 — `jwt_migration_entity_status` initial seed scope.** Recommendation: seed all CDM v1.5 + v1.6 RLS-bearing entities (count expected: ~75 v1.5 + 5 v1.6 new = ~80 entities) + `_legacy_v017_caller_` sentinel. Phase A migration step generates seed from canonical CDM inventory.
2. **OQ2 — Cleanup job ownership for admission + replay tables.** Recommendation: dedicated `sec_jwt_cleanup` role with DELETE permission on `session_jwt_admission` + `session_jwt_replay_set` where `expires_at < now() - INTERVAL '1 hour'`. Hourly schedule via pg_cron OR external scheduler per Sprint 13 ops cadence.
3. **OQ3 — jwt_signing_key_public RLS for tenant break-glass keys.** Recommendation: tenant-isolated read (operator can only see their own tenant's break-glass keys); platform-wide keys readable by all (verification lookup is a global path).
4. **OQ4 — Codex pre-ratification target.** Recommendation: 2-3 rounds (mechanical amendment cycle; SI-024.1 already converged on the underlying schemas).

---

## 6. Codex pre-ratification status

**v0.1 DRAFT 2026-05-20:** pre-Codex-review.

**v0.2 DRAFT 2026-05-20 — Pass-1 R1 closure:**
- **HIGH-1 closed (initial)** — both `session_jwt_admission` (§4.NEW1) and `session_jwt_replay_set` (§4.NEW2) replaced the comment-only TTL exception with executable DDL: SECURITY DEFINER `*_append_only_with_ttl_cleanup()` functions that reject UPDATE always and permit DELETE only for `sec_jwt_cleanup` role on rows past `expires_at + INTERVAL '1 hour'` slack. Pass-1 verbatim recommendation applied to both tables ("both admission and replay tables, not just one of them").
- **MED-1 closed** — audit event taxonomy prose swept from "10 new Cat A events" to "9 new Cat A + 1 new Cat B" throughout §1, §2 (in-scope item 2), and §3 header to reflect the actual mix (`cdm.entity_jwt_migration_status_added` is Cat B as already correctly labeled in the §3 table).

**v0.3 DRAFT 2026-05-20 — Pass-2 R1 closure (SECURITY DEFINER caller-identity defect):**
- **HIGH-2 closed** — Pass-2 caught a real PostgreSQL semantics defect in the v0.2 HIGH-1 closure: under `SECURITY DEFINER`, `current_user` resolves to the function owner, not the invoking role. So the `current_user = 'sec_jwt_cleanup'` check was either (a) always-false (if function owner ≠ sec_jwt_cleanup) → TTL cleanup blocked, OR (b) bypassable (if function owner == sec_jwt_cleanup) → any role reaching DELETE could satisfy it. Both broken. Fix applied to BOTH §4.NEW1 and §4.NEW2: remove `SECURITY DEFINER` qualifier so the function executes as `SECURITY INVOKER` (default) and `current_user` resolves to the actual invoking role; add explicit defense-in-depth `REVOKE DELETE ... FROM PUBLIC` + `GRANT DELETE ... TO sec_jwt_cleanup` DDL so PostgreSQL-level privilege check denies non-`sec_jwt_cleanup` callers BEFORE the trigger fires, with the trigger then enforcing the TTL slack predicate on permitted callers. This makes the authorization layer enforceable at both the privilege layer AND the trigger predicate layer. The replay-set is the higher-cost case (failed cleanup → unbounded growth; over-permissive → erased replay evidence), so caller-identity correctness on §4.NEW2 was especially urgent.

**v0.4 DRAFT 2026-05-20 — Pass-2 R2 closure (FORCE-RLS cleanup gap):**
- **HIGH-3 closed** — Pass-2 R2 caught a second real PostgreSQL semantics defect: with `FORCE ROW LEVEL SECURITY` enabled and only a tenant-isolation policy defined (no `FOR` clause → applies to ALL commands including DELETE), a platform-scoped cleanup job running as `sec_jwt_cleanup` would have no `app.actor_tenant_id` GUC set and would either fail RLS entirely OR only clean the currently-selected tenant. The GRANT DELETE privilege + trigger predicate from R1 closure couldn't help because RLS filters rows BEFORE the trigger fires. Fix applied to BOTH §4.NEW1 and §4.NEW2: add a permissive `FOR DELETE TO sec_jwt_cleanup USING (expires_at < now() - INTERVAL '1 hour')` policy. PostgreSQL RLS composes permissive policies via OR, so the cleanup policy permits cross-tenant DELETE for `sec_jwt_cleanup` on expired rows without breaking the tenant-isolation rule for other roles. Defense-in-depth is now three-layer: privilege grant (REVOKE PUBLIC + GRANT sec_jwt_cleanup) + RLS DELETE policy (sec_jwt_cleanup + expired-only) + trigger predicate (current_user check + expires_at slack). Cleanup execution context explicitly documented: platform-wide background job, NOT per-tenant, runs as `sec_jwt_cleanup` with no `app.*` GUC tenant context.

**v0.5 DRAFT 2026-05-20 — Pass-2 R3 closure (write-path RLS + one-way lifecycle enforcement):**
- **HIGH-4 closed** — Pass-2 R3 caught that §4.NEW3 `jwt_signing_key_public` and §4.NEW4 `break_glass_active_session` had FORCE RLS + SELECT-only policies. Required write paths (KMS rotation INSERT/UPDATE on NEW3; procedure-driven INSERT/UPDATE on NEW4) would fail under RLS or require undocumented BYPASSRLS escapes. Fix: explicit role-scoped FOR INSERT + FOR UPDATE RLS policies on both tables for the canonical write-path roles named in SI-024.1 (`kms_rotation_operator` for NEW3 per Sub-decision 4; `break_glass_procedure_owner` for NEW4 per Sub-decision 7). WITH CHECK clauses constrain inserts to active state (`deactivated_at IS NULL` / `closed_at IS NULL`) and updates to one-way close transition (`USING (... IS NULL) WITH CHECK (... IS NOT NULL)`). Defense-in-depth privilege DDL added.
- **HIGH-5 closed** — Pass-2 R3 caught that `deactivated_at` (NEW3) and `closed_at` (NEW4) were documented as one-way lifecycle fields but the append-only triggers excluded those columns (correctly — they need to mutate once), and no separate trigger enforced the one-way constraint. Once UPDATE was granted (HIGH-4), an operator could reactivate retired keys (`deactivated_at` non-NULL → NULL) or reopen closed sessions (`closed_at` non-NULL → NULL) or shift the timestamp (non-NULL → different non-NULL). Fix: dedicated BEFORE UPDATE column-scoped triggers (`*_one_way_*()`) that reject non-NULL → NULL and non-NULL → different non-NULL transitions while permitting NULL → non-NULL. The RLS UPDATE policy WITH CHECK clause adds a second layer of enforcement (only sets to non-NULL permitted).

**v0.6 DRAFT 2026-05-20 — Pass-2 R4 closure (§4.NEW5 RLS + privilege DDL):**
- **HIGH-6 closed** — Pass-2 R4 caught that §4.NEW5 `jwt_migration_entity_status` had NO RLS or REVOKE/GRANT DDL despite being a security-critical fallback-gate control table. The prose said "INSERT/UPDATE limited to CDM-owner role" but no DDL backed that claim, so a role with inherited owner privileges or accidental broad grant could silently disable JWT-required cutover (flip `phase_4_cutover_eligible`) or fallback auditing (flip `raw_guc_fallback_audited`) without violating any trigger. Fix: `ENABLE/FORCE ROW LEVEL SECURITY` + permissive SELECT policy (platform-wide read required by `current_tenant_id_strict` helper from any tenant context) + role-scoped `FOR INSERT/UPDATE TO cdm_owner` policies + `REVOKE INSERT, UPDATE, DELETE FROM PUBLIC` + column-level `GRANT UPDATE (phase_4_cutover_eligible, raw_guc_fallback_audited, migrated_at, updated_at) TO cdm_owner`. Combined with the existing append-only trigger (entity_name + production_break_glass_surface immutable), the table now has three-layer enforcement matching the rest of the §4 entities.
- **Follow-on flagged for R5:** Pass-2 R4 also flagged §4.NEW1 + §4.NEW2 admit-path INSERT under FORCE RLS — admit_session_jwt() needs a writable path for the admission/replay rows. Defer to R5 verification to confirm whether the existing tenant-isolation policy permits INSERT or if a dedicated FOR INSERT policy is required.

**v0.7 DRAFT 2026-05-20 — Pass-2 R5 closure (table-privilege grants for SELECT on NEW5 + INSERT on NEW1/NEW2):**
- **HIGH-7 closed** — Pass-2 R5 caught that the `FOR SELECT USING (true)` policy on §4.NEW5 alone is not sufficient: PostgreSQL RLS policies do not grant table privileges. A role still needs `SELECT` on the table before any permissive policy can match. Since `current_tenant_id_strict()` executes from arbitrary tenant-helper roles, explicit `GRANT SELECT ON jwt_migration_entity_status TO PUBLIC` is required.
- **HIGH-8 closed** — Pass-2 R5 caught that deferring INSERT privilege on §4.NEW1 + §4.NEW2 to the SI-024.1 procedure-side artifact left both tables under FORCE RLS with no explicit INSERT grant for the admit role. Admission INSERT could either fail outright or rely on inherited table-owner privileges — exactly the class of gap this cycle has been closing. Fix: define the canonical admit write role (`admit_session_jwt_owner`) here in the CDM amendment and add explicit `REVOKE INSERT FROM PUBLIC` + `GRANT INSERT TO admit_session_jwt_owner` on both tables. Replay-set is the higher-cost case: failure to INSERT the replay jti breaks the anti-replay invariant open (legitimate JWTs may double-admit). Existing tenant-isolation RLS policy (no FOR clause = all commands) already implicitly applies USING as WITH CHECK for INSERT, so RLS-wise the admit path was already covered — only the table privilege grant was missing.

**v0.8 DRAFT 2026-05-20 — Pass-2 R6 closure (SECURITY DEFINER helper interface instead of PUBLIC SELECT on fallback-gate table):**
- **HIGH-9 closed** — Pass-2 R6 caught that the v0.7 fix of GRANT SELECT TO PUBLIC overexposed the §4.NEW5 fallback-gate state. The table is explicitly the Phase B raw-GUC fallback gate; world-readability lets any low-privilege DB foothold enumerate which entities still allow fallback (`phase_4_cutover_eligible` / `production_break_glass_surface`) and whether fallback audit is enabled (`raw_guc_fallback_audited`), then target the least-hardened/least-observable surfaces. Fix per Pass-2 R6 verbatim recommendation: replace the PUBLIC table grant with two narrow SECURITY DEFINER helpers (`is_jwt_required_for_entity(p_entity_name TEXT) RETURNS BOOLEAN` returning `phase_4_cutover_eligible OR production_break_glass_surface`; `is_raw_guc_fallback_audited_for_entity(p_entity_name TEXT) RETURNS BOOLEAN`). Both helpers are owned by cdm_owner with locked `search_path = pg_catalog, public`. GRANT EXECUTE to PUBLIC on helpers; keep table SELECT restricted to cdm_owner only. Underlying table row state is now opaque — non-cdm_owner roles see only the boolean decisions for entity names they explicitly query, never the migration timeline or entity inventory. Helpers fail-closed/fail-loud on unknown entities (return TRUE).

Authored on `spec/cdm-v1-6-audit-events-v5-8-si024-1-followon-2026-05-20` branch off main at `18f2fc2` (post-P-031 + Addendum 59). v0.2 commit `3b7df56`. v0.3 commit `68909a8`. v0.4 commit `99ec59c`. v0.5 commit `24a6a21`. v0.6 commit `781731a`. v0.7 commit `d76b24c`. v0.8 commit pending push for Pass-2 R7 verification.

---

— Claude (Opus 4.7, 1M context), CDM v1.5 → v1.6 + AUDIT_EVENTS v5.7 → v5.8 amendment artifact v0.8 DRAFT (Pass-2 R6 closure applied: SECURITY DEFINER narrow-helper interface replaces PUBLIC SELECT on §4.NEW5 fallback-gate table) 2026-05-20 per P-031 OQ canonical decision + established post-P-029 SI-spec-first promotion pattern + CLAUDE.md two-pass discipline + auto-proceed rule. Pass-2 R7 verification queued.
