# CDM v1.5 → v1.6 Amendment (SI-024.1 follow-on)

**Version:** 0.1 DRAFT
**Status:** PRE-CODEX (awaiting Pass-1 source-first independent review per CLAUDE.md two-pass discipline)
**Authoring date:** 2026-05-20
**Trigger:** Promotion Ledger P-031 (SI-024.1 v0.8 RATIFIED + Registry v2.17 → v2.18). Per the established post-P-029 spec-first promotion pattern, SI-024.1's 5 new entities + 10 new Cat A audit events land in CDM + AUDIT_EVENTS via a separate amendment cycle following SI ratification (mirrors P-029's pattern of CDM amendment AFTER SI-021 ratified).
**Owner:** SRE Lead + Security Engineering Lead + CDM owner (same triad as SI-024.1).
**Parent SI:** SI-024.1 v0.8 RATIFIED (`Telecheck_SI_024_1_Cryptographic_JWT_Binding_v1_0.md`); P-031 is the ratification authority for this amendment.
**Companion documents:** SI-024 v0.17 TRANSITIONAL (parent of SI-024.1; CDM v1.5 baseline) + P-030 + P-031 + previous CDM amendment pattern (`Telecheck_CDM_v1_4_to_v1_5_Amendment.md` from SI-021 cycle).

---

## 1. Purpose + scope

This amendment promotes the 5 new entities defined in SI-024.1 v0.8 RATIFIED into CDM v1.5 → v1.6 as canonical entity rows. Co-bumped: AUDIT_EVENTS v5.7 → v5.8 (10 new Cat A events under `tenant_context.*` namespace).

The amendment is mechanical consolidation of already-Codex-converged canonical content from SI-024.1 v0.8 RATIFIED into the canonical contract surfaces. Per the established post-P-029 spec-first pattern, the SI authoring + ratification cycle (P-031, 19 findings closed across 8 cycles) closed the architectural questions; this amendment is the canonical CDM/AUDIT_EVENTS landing.

**In scope:**

1. CDM v1.5 → v1.6 with 5 new entities (continuing CDM numbering from v1.5's 75 active entities + 3 derived views; v1.6 target: 80 active entities + 3 derived views).
2. AUDIT_EVENTS v5.7 → v5.8 with 10 new Cat A events under `tenant_context.*` namespace + Cat B `cdm.entity_jwt_migration_status_added` event.
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

-- Append-only enforcement (admission record is immutable post-INSERT; cleanup via TTL job)
CREATE TRIGGER session_jwt_admission_append_only
    BEFORE UPDATE OR DELETE ON session_jwt_admission
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
-- Exception for cleanup job: DELETE permitted where expires_at < now() - INTERVAL '1 hour' via dedicated cleanup role.
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

-- Append-only (same cleanup-job exception pattern as §4.NEW1)
CREATE TRIGGER session_jwt_replay_set_append_only
    BEFORE UPDATE OR DELETE ON session_jwt_replay_set
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
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

-- INSERT/UPDATE limited to KMS-key-rotation operator role; key-rotation = new row with new key_id + activated_at.
-- Append-only on rotated-out key rows (deactivated_at can be set NULL → timestamp, one-way; same pattern as break_glass_approval.revoked_at).
CREATE TRIGGER jwt_signing_key_public_append_only
    BEFORE UPDATE OF key_id, key_purpose, tenant_id, public_key_pem, kms_key_arn, algorithm, created_at, activated_at
    OR DELETE ON jwt_signing_key_public
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
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

-- Append-only on identity columns; closed_at is mutable (NULL → timestamp, one-way) for session-close.
CREATE TRIGGER break_glass_active_session_append_only
    BEFORE UPDATE OF id, target_tenant_id, operator_user_id, operator_role, bound_jwt_id,
                    session_start, session_expires_at, intended_purpose, approval_id
    OR DELETE ON break_glass_active_session
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
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

-- Platform-scoped table; no tenant_id; readable by all (used by current_tenant_id_strict helper).
-- INSERT/UPDATE limited to CDM-owner role (enforced via column-level GRANTs).
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

**10 new Cat A events** under `tenant_context.*` namespace:

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

Authored on `spec/cdm-v1-6-audit-events-v5-8-si024-1-followon-2026-05-20` branch off main at `18f2fc2` (post-P-031 + Addendum 59).

---

— Claude (Opus 4.7, 1M context), CDM v1.5 → v1.6 + AUDIT_EVENTS v5.7 → v5.8 amendment artifact v0.1 DRAFT authored 2026-05-20 per P-031 OQ canonical decision + established post-P-029 SI-spec-first promotion pattern. SI-024.1 follow-on amendment cycle queued as next autonomous-work deliverable per CLAUDE.md auto-proceed rule. Pass-1 source-first independent review queued.
