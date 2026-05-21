# SI-024.1 — Cryptographic JWT-Binding for Hardened Tenant/Platform RLS Helper Pattern

**Version:** 1.0 v0.8 DRAFT — RATIFIER-READY at §10-cadence boundary + pre-merge cycles 1+2+3 closures applied
**Status:** Pre-merge cycle-3 closed inline (1 HIGH + 1 MED): single-authority audit emission for break-glass lifecycle (procedure-internal INSERT canonical for SI-024.1-managed; v0.17 trigger continues for v0.17-era rows where state='active'; both authorities produce ONE event per state transition — no duplication); fallback audit hardened from advisory ("middleware SHOULD") to mandatory contract + Phase D telemetry-clean gate enforcement mechanism + acknowledged simplification #10 for DB-side cryptographic enforcement deferred to future SI-024.2. 19 findings closed cumulative.
**Authoring date:** 2026-05-20
**Trigger:** SI-024 v0.17 TRANSITIONAL ratification at Promotion Ledger P-030 (committed via auto-proceed merge `3fcbef8` on main). SI-024.1 closes the cryptographic-binding gap deferred from SI-024 v1.0 — specifically the compromised-middleware-credential threat class that the role-constrained-GUC pattern explicitly does NOT close. Per OQ-NEW1/2 commitments at P-030: SI-024.1 v0.1 DRAFT target 2026-06-19 (30 days from P-030); ratifier ceremony target 2026-08-18 (90 days from P-030). SI-024.1 IS the gate that lifts the "production target-tenant break-glass BLOCKED" + "Phase 4 cutover BLOCKED" + "INVARIANTS I-036 BLOCKED" constraints carried in SI-024 v1.0 TRANSITIONAL.
**Owner:** SRE Lead + Security Engineering Lead + CDM owner (same triad as SI-024).
**Parent SI:** SI-024 v0.17 TRANSITIONAL (`Telecheck_SI_024_Canonical_Hardened_Tenant_Platform_RLS_Helper_v1_0.md`). SI-024 v1.0 specifies the role-constrained-GUC baseline; SI-024.1 EXTENDS that baseline with cryptographic JWT-binding so the helpers can verify the caller's tenant + role assertions against a verifiable signed token rather than trusting session-GUC + role-membership.
**Companion documents:** Sprint 13 KMS Architecture Spec (`Telecheck_KMS_Architecture_Spec_v1_0.md` §HSM-signing-key infrastructure — SI-024.1 reuses the KMS layer for JWT signing-key management); SI-024 §Sub-decision 2 Option B-2 (the original cryptographic-binding option scoped at SI-024 but deferred per scope-narrowing); SI-024 9 acknowledged simplifications #1, #2, #4, #8, #9 — SI-024.1 closes all five.

---

## 1. Purpose + scope

**Problem statement carried forward from SI-024 v1.0:** the role-constrained-GUC pattern closes the direct-DB-role spoofing threat but explicitly does NOT close the compromised-middleware-credential threat — a compromised `app_middleware_writer` role can still SET `app.tenant_id` to any value and bypass tenant isolation. Similarly, `app.actor_human_id` (used by the break-glass helpers + audit triggers) is middleware-trusted post-JWT-verification but not cryptographically bound to the DB session.

**SI-024.1 closes these gaps via cryptographic JWT-binding:** the application middleware passes the verified JWT itself (or a derived signed binding token) into a session GUC; the helper functions verify the JWT signature server-side before extracting `tenant_id` + `actor_human_id` + role claims. A compromised middleware credential cannot forge a valid JWT without the signing private key, so the threat class is closed at the cryptographic layer.

**In scope:**

1. **`current_tenant_id_strict()` helper extension** with JWT-signature verification: caller passes verified-JWT in `app.session_jwt` GUC; helper extracts + verifies signature + extracts `tenant_id` claim.
2. **JWT signing-key infrastructure** in KMS (HSM-backed; rotation cadence; key-derivation contract).
3. **`is_target_tenant_break_glass_active()` extension** with cryptographic `operator_role` + `operator_user_id` claims from the verified JWT (replaces SI-024 v1.0 simplification #2: approval matching by human_id only → now by cryptographically verified role + human_id).
4. **`begin_target_tenant_break_glass_session()` SECURITY DEFINER procedure** (VOLATILE; emits per-access audit; closes SI-024 v1.0 simplification #8). Operator-initiated session-start; emits `tenant_context.target_tenant_break_glass_session_started` Cat A audit event; RLS helpers then check active-session table vs. active-approval.
5. **Two-phase dual-control approval workflow** with `break_glass_approval.state` enum (closes SI-024 v1.0 simplification #9 — replaces self-attestation + out-of-band with two distinct procedure calls from Compliance Officer + CTO).
6. **Production target-tenant break-glass UNBLOCK** — SI-024.1 ratification is the gate that lifts the SI-024 v1.0 TRANSITIONAL production-break-glass block.
7. **Phase 4 cutover authorization** — SI-024.1 ratification + Phase 1-3 telemetry completion together unblock Phase 4 (drop the raw-GUC permissive policy; hardened helper becomes sole canonical enforcement).
8. **INVARIANTS I-036 platform-floor invariant** — declared canonical at the first Phase 4 entity cutover (per SI-024 OQ5).
9. **Migration discipline from SI-024 v0.17 (role-constrained-GUC) to SI-024.1 (cryptographic JWT-binding)** — zero-downtime migration path; helpers coexist; cutover per entity.
10. **Performance + caching analysis** — JWT verification adds ~2× per-query overhead; STABLE function caching strategy; Phase 3 telemetry quantifies actual impact before Phase 4 commits.
11. **Audit event taxonomy extension** — new Cat A events for per-access break-glass + JWT verification failures.

**Out of scope:**

- Middleware-side JWT minting (`telecheck-app` Track 2 implementation concern; SI-024.1 specifies the verification contract DB-side).
- KMS signing-key root-of-trust ceremony (Sprint 13 KMS Architecture covers this).
- Quantum-resistance migration of the JWT signing algorithm (Phase 3+ per OQ-I from earlier cycle).
- Cross-region JWT key replication (Sprint 7 Cold-DR Runbook + Sprint 13 KMS govern this).

---

## 2. Sub-decisions (ratifier-targetable units)

### Sub-decision 1 — Cryptographic JWT verification (SPLIT: pure-STABLE claim verifier + VOLATILE admission path; R1 CRITICAL closure 2026-05-20)

**Decision shape:** the JWT verification responsibility is SPLIT into two functions to satisfy PostgreSQL STABLE-vs-VOLATILE constraints:

1. **`verify_session_jwt_and_extract_claims()` — pure STABLE** (RLS-safe): performs signature verification + claim extraction; performs NO writes (no replay-set INSERT). Safe to call from RLS predicates + STABLE helper bodies.
2. **`admit_session_jwt(jwt TEXT)` — VOLATILE** (NOT RLS-safe): performs replay-set INSERT + session admission; MUST be called by middleware at the start of each DB session/request BEFORE any RLS-protected query.

The middleware's responsibility per the canonical session-management contract: at session-start, call `admit_session_jwt(<jwt>)` once; on success, set `app.session_jwt` GUC; subsequent RLS-protected queries trigger pure-STABLE `verify_session_jwt_and_extract_claims()` from helpers; replay-detection happens at admission-time, NOT at every RLS evaluation.

```sql
-- Canonical claims type (referenced by both functions).
CREATE TYPE verified_jwt_claims_t AS (
    tenant_id tenant_id_t,
    actor_human_id UUID,
    actor_role TEXT,
    session_id UUID,        -- DB session identifier; bound to the JWT at admission
    issued_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    jwt_id UUID,            -- The `jti` claim; bound to (session_id, jwt_id) pair at admission
    key_id UUID,            -- The signing key's `kid` claim; binds to jwt_signing_key_public.key_id
    key_purpose TEXT        -- 'platform_tenant_jwt' | 'tenant_break_glass_jwt'; per R1 missing-consideration: prevents JWT-purpose confusion
);

-- Admission record table (R2 Pass-2 CRITICAL closure 2026-05-20: STABLE verifier validates
-- THIS record was created in the current DB backend, not just that app.session_jwt holds a valid signature).
-- Without this binding, any path that can set app.session_jwt (e.g., a compromised middleware credential)
-- bypasses admit_session_jwt() + replay enforcement entirely.
CREATE TABLE session_jwt_admission (
    -- Composite primary identity bound to the specific PostgreSQL backend process.
    backend_pid INTEGER NOT NULL,                  -- pg_backend_pid() at admission time
    backend_start_at TIMESTAMPTZ NOT NULL,         -- current_backend_start_at() — protects against pid reuse after backend restart
    jwt_id UUID NOT NULL,
    tenant_id tenant_id_t NOT NULL,
    actor_human_id UUID NOT NULL,
    actor_role TEXT NOT NULL,
    key_id UUID NOT NULL,
    key_purpose TEXT NOT NULL,
    admitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (backend_pid, backend_start_at, jwt_id)
);
-- R3 HIGH-2 closure 2026-05-20: partial-index predicate cannot reference `now()` (PostgreSQL requires
-- IMMUTABLE predicates; now() is STABLE). Use normal btree index covering expires_at; the verifier filters
-- with expires_at > now() at query time + scheduled cleanup deletes expired rows hourly.
CREATE INDEX session_jwt_admission_active_lookup
    ON session_jwt_admission (backend_pid, backend_start_at, jwt_id, expires_at);

-- R3 MED closure 2026-05-20: canonical helper to retrieve current backend's start time from pg_stat_activity.
-- PostgreSQL does not expose a zero-arg current_backend_start_at() built-in; this helper bridges the gap.
-- SECURITY DEFINER required because pg_stat_activity is restricted (requires pg_read_all_stats or superuser
-- on PG >= 14 for full visibility). The helper limits its scope to ONLY the current backend's row.
CREATE FUNCTION current_backend_start_at() RETURNS TIMESTAMPTZ AS $$
DECLARE
    result TIMESTAMPTZ;
BEGIN
    SELECT backend_start INTO result
        FROM pg_catalog.pg_stat_activity
        WHERE pid = pg_backend_pid()
        LIMIT 1;
    IF result IS NULL THEN
        RAISE EXCEPTION 'pg_stat_activity has no row for current backend (pid=%)', pg_backend_pid()
            USING ERRCODE = 'internal_error';
    END IF;
    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;
-- ALTER FUNCTION current_backend_start_at() OWNER TO sec_jwt_verifier;
-- REVOKE EXECUTE ON FUNCTION current_backend_start_at() FROM PUBLIC;
-- GRANT EXECUTE ON FUNCTION current_backend_start_at() TO PUBLIC;  -- callable from RLS predicates

-- VOLATILE admission path: middleware calls ONCE per DB session/request.
-- R2 MED closure 2026-05-20: idempotent under same-backend same-jwt retries
-- (UPSERT semantics; returns existing claims if already admitted for this backend+jwt).
CREATE FUNCTION admit_session_jwt(jwt TEXT) RETURNS verified_jwt_claims_t AS $$
DECLARE
    claims verified_jwt_claims_t;
    inserted_rows INTEGER;
BEGIN
    -- 1. Extract header + payload + signature from JWT.
    -- 2. Lookup public key from jwt_signing_key_public by header.kid; verify it's currently active.
    -- 3. Verify signature (RSA-PSS-SHA256 per Sub-decision 3).
    -- 4. Verify expires_at > now() AND issued_at <= now() AND not-before <= now() (clock-skew tolerance ±60s).
    -- 5. Extract claims into typed record.
    -- 6. R3 HIGH-1 closure: cross-backend replay detection via extended session_jwt_replay_set schema
    --    (now includes backend_pid + backend_start_at).
    --    INSERT INTO session_jwt_replay_set (jwt_id, tenant_id, backend_pid, backend_start_at, expires_at)
    --        VALUES (claims.jwt_id, claims.tenant_id, pg_backend_pid(), current_backend_start_at(), claims.expires_at)
    --    ON CONFLICT (jwt_id) DO NOTHING;
    --    GET DIAGNOSTICS inserted_rows = ROW_COUNT;
    --    IF inserted_rows = 0 THEN
    --        SELECT backend_pid, backend_start_at INTO existing_pid, existing_start
    --            FROM session_jwt_replay_set WHERE jwt_id = claims.jwt_id;
    --        IF existing_pid = pg_backend_pid() AND existing_start = current_backend_start_at() THEN
    --            -- Same-backend idempotent retry: return claims (caller already got admission earlier in this backend).
    --        ELSE
    --            RAISE EXCEPTION 'JWT replay detected (jwt_id=% previously admitted by backend %/%)',
    --                claims.jwt_id, existing_pid, existing_start
    --                USING ERRCODE = 'invalid_authorization_specification';
    --        END IF;
    --    END IF;
    -- 7. UPSERT into session_jwt_admission (backend_pid, backend_start_at, jwt_id, ...) — idempotent for same-backend.
    --    ON CONFLICT (backend_pid, backend_start_at, jwt_id) DO NOTHING.
    -- 8. Bind claims to current DB session: SET LOCAL app.session_jwt = <jwt> + SET LOCAL app.session_jwt_admitted_backend = pg_backend_pid()::TEXT.
    RAISE EXCEPTION 'admit_session_jwt() implementation pending Phase A infrastructure';
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = pg_catalog, public;

-- Pure STABLE claim verifier: RLS-safe; called from STABLE helpers + RLS predicates.
-- R2 Pass-2 CRITICAL closure 2026-05-20: validates the current DB backend has an active admission record
-- for the JWT in app.session_jwt. Without this check, app.session_jwt could be set by a path that
-- bypassed admit_session_jwt() entirely (e.g., compromised middleware credential setting GUC directly).
CREATE FUNCTION verify_session_jwt_and_extract_claims() RETURNS verified_jwt_claims_t AS $$
DECLARE
    jwt TEXT;
    claims verified_jwt_claims_t;
    admission_exists BOOLEAN;
BEGIN
    jwt := current_setting('app.session_jwt', false);  -- fail-loud on unset
    -- 1. Extract header + payload + signature from JWT.
    -- 2. Lookup public key from jwt_signing_key_public by header.kid.
    -- 3. Verify signature (RSA-PSS-SHA256).
    -- 4. Verify expires_at > now().
    -- 5. Extract claims into typed record.
    -- 6. R2 Pass-2 CRITICAL closure: validate admission record exists for current backend + jwt_id.
    --    This is a READ-ONLY EXISTS check (STABLE-safe; no writes).
    SELECT EXISTS (
        SELECT 1 FROM public.session_jwt_admission
        WHERE backend_pid = pg_backend_pid()
            AND backend_start_at = current_backend_start_at()
            AND jwt_id = claims.jwt_id
            AND expires_at > now()
    ) INTO admission_exists;
    IF NOT admission_exists THEN
        -- Bypass attempt: app.session_jwt populated but no admission record for current backend.
        -- This catches the case where a compromised middleware credential set the GUC directly,
        -- bypassing admit_session_jwt() + replay enforcement.
        RAISE EXCEPTION 'session JWT not admitted on current backend (backend_pid=%, jwt_id=%); call admit_session_jwt() first',
            pg_backend_pid(), claims.jwt_id
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    -- Pre-merge Pass-1 MED closure 2026-05-20: claim-consistency check between admission record + parsed JWT.
    -- Without this, an attacker who collided on jwt_id (extreme edge case) or who corrupted admission metadata
    -- could have the verifier return claims that differ from what was admitted.
    PERFORM 1 FROM public.session_jwt_admission a
        WHERE a.backend_pid = pg_backend_pid()
            AND a.backend_start_at = current_backend_start_at()
            AND a.jwt_id = claims.jwt_id
            AND a.tenant_id = claims.tenant_id
            AND a.actor_human_id = claims.actor_human_id
            AND a.actor_role = claims.actor_role
            AND a.key_id = claims.key_id
            AND a.key_purpose = claims.key_purpose
            AND a.expires_at = claims.expires_at;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'admission claims mismatch for jwt_id=% (admitted claims differ from parsed claims); possible jti-collision or admission-metadata corruption',
            claims.jwt_id
            USING ERRCODE = 'data_corrupted';
    END IF;
    RETURN claims;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;
```

**Cleanup discipline:** `session_jwt_admission` rows are bounded by `expires_at`; a scheduled job deletes expired rows hourly (mirrors `session_jwt_replay_set` cleanup per Sub-decision 5). Connection-pool backends that reset their state via `DISCARD ALL` between requests should NOT lose admission records (the table is independent of session-local GUCs); but connection-pool backends that explicitly close + reopen connections will leave stale admission records that the cleanup job reaps.

**Replay-window unit (R1 HIGH-2 closure 2026-05-20):** the JWT is **per-DB-session admission unit**, NOT per-query. `admit_session_jwt()` is called ONCE at session-start; the same `app.session_jwt` is reused across multiple queries within that session. Replay-detection runs at admission only; the second admission of the same `jwt_id` (whether from the same session or a different one) raises REPLAY. This means:
- A single middleware connection per request → one admission per request → one JWT per request → no replay-within-session ambiguity.
- A connection-pool session reused across N requests → N admissions with N distinct JWTs (middleware mints a fresh JWT per request) → no replay-within-session ambiguity.
- Multiple DB sessions trying to use the same JWT → second admission raises REPLAY → blocked.

**Why split:**
- STABLE → query-result-cacheable per execution; helpers + RLS predicates can call freely without triggering side-effects.
- VOLATILE admission path → can perform writes (replay-set INSERT); called only at request-boundary by middleware.
- Both SECURITY DEFINER → owned by `sec_jwt_verifier` role with SELECT on `jwt_signing_key_public` + INSERT on `session_jwt_replay_set`; EXECUTE granted to PUBLIC for the STABLE helper, to middleware roles for the VOLATILE admission.

### Sub-decision 2 — Per-tenant vs. platform-wide signing key

**Decision shape:** **two-key model** — platform-wide signing key for ordinary tenant-bound JWTs (high-volume; minimizes KMS operations); per-tenant signing key for break-glass JWTs (low-volume; per-tenant key isolation = compromise of one tenant's key doesn't compromise others' break-glass authority).

**Rationale:** the platform-wide key handles 99.9% of traffic (every middleware-issued tenant-bound request); break-glass is rare (< 100 events/year per tenant in expected ops); the dual model balances KMS-operation cost against blast-radius isolation.

**Open question (OQ3 below):** ratifier may choose to override this to single-key model OR full per-tenant model.

### Sub-decision 3 — Signature algorithm

**Decision shape:** **RSA-PSS-SHA256** for v1.0. Industry-standard; supported natively by pgcrypto + AWS KMS HSM modules; matches SI-021 HSM-signing pattern from CDM v1.5 audit-chain.

**Why not Ed25519:** smaller signatures + faster verification + matches modern best practice, BUT pgcrypto Ed25519 support requires PG 14+ extensions; SI-021 chose RSA-PSS-SHA256 for the audit chain to match KMS HSM module availability. SI-024.1 v1.0 matches that choice for consistency.

**Out of scope:** quantum-resistant algorithms (Dilithium, Falcon) — Phase 3+ per OQ-I.

### Sub-decision 4 — KMS signing-key management

**Decision shape:** signing keys live in AWS KMS HSM (matches Sprint 13 KMS Architecture). Private key NEVER leaves the HSM; signing happens via KMS API. Public key cached in a DB-stored `jwt_signing_key_public` table for low-latency verification:

```sql
CREATE TABLE jwt_signing_key_public (
    key_id UUID PRIMARY KEY,
    key_purpose TEXT NOT NULL CHECK (key_purpose IN ('platform_tenant_jwt', 'tenant_break_glass_jwt')),
    tenant_id tenant_id_t,  -- NULL for platform_tenant_jwt; specific for tenant_break_glass_jwt
    public_key_pem TEXT NOT NULL,
    kms_key_arn TEXT NOT NULL,  -- AWS KMS key ARN for the private-key half
    algorithm TEXT NOT NULL CHECK (algorithm = 'RSA-PSS-SHA256'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    activated_at TIMESTAMPTZ NOT NULL,
    deactivated_at TIMESTAMPTZ,  -- NULL = currently active
    CONSTRAINT jwt_signing_key_purpose_tenant CHECK (
        (key_purpose = 'platform_tenant_jwt' AND tenant_id IS NULL)
        OR (key_purpose = 'tenant_break_glass_jwt' AND tenant_id IS NOT NULL)
    )
);
-- Append-only via enforce_append_only() trigger; rotation = new row with new key_id + activated_at.
```

**Key-rotation cadence:** platform signing key rotated quarterly; tenant break-glass key rotated annually OR on suspected compromise.

### Sub-decision 5 — Anti-replay protection

**Decision shape:** `session_jwt_replay_set` table tracks recently-seen JWT IDs (`jti` claim); JWT verification rejects if `jti` already in set within the JWT's validity window. Bounded LRU to prevent table growth; expired JWT IDs eligible for eviction.

```sql
-- R3 HIGH-1 closure 2026-05-20: schema extended with backend_pid + backend_start_at so admit_session_jwt()
-- can distinguish same-backend idempotent retry from cross-backend replay (per R2 MED idempotency closure).
CREATE TABLE session_jwt_replay_set (
    jwt_id UUID PRIMARY KEY,
    tenant_id tenant_id_t NOT NULL,
    backend_pid INTEGER NOT NULL,                  -- pg_backend_pid() at first admission
    backend_start_at TIMESTAMPTZ NOT NULL,         -- current_backend_start_at() — protects against pid reuse
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL                -- = JWT's expires_at claim; row deletable after this
);
-- Cleanup: scheduled job deletes rows where expires_at < now() - 1 hour (slack window).
-- Conflict-handling semantics in admit_session_jwt():
--   ON CONFLICT (jwt_id) DO NOTHING; if rows_affected = 0, SELECT the existing row.
--   IF existing.backend_pid = pg_backend_pid() AND existing.backend_start_at = current_backend_start_at()
--     → same-backend idempotent retry → return claims.
--   ELSE → genuine cross-backend replay → raise REPLAY DETECTED.
```

**Performance:** JWT verification adds 1 INSERT to `session_jwt_replay_set` per first-seen JWT + PK-conflict-detection on replay attempts. Estimated <1ms per verification on modern hardware.

### Sub-decision 6 — Helper extension to use verified claims

**Decision shape:** `current_tenant_id_strict()` + `is_platform_operator_break_glass_active()` + `is_target_tenant_break_glass_active()` all updated to consume `verify_session_jwt_and_extract_claims()` output instead of raw GUCs:

```sql
-- Post-SI-024.1 canonical helper (replaces SI-024 v0.17 INVOKER + raw current_setting() pattern):
CREATE FUNCTION current_tenant_id_strict() RETURNS tenant_id_t AS $$
DECLARE
    claims verified_jwt_claims_t;
BEGIN
    claims := verify_session_jwt_and_extract_claims();  -- raises on invalid/expired/replay
    -- The verified JWT proves the caller's tenant_id (cryptographically bound; compromised role cannot forge).
    RETURN claims.tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = pg_catalog, public;

CREATE FUNCTION is_target_tenant_break_glass_active(target_tenant_id tenant_id_t) RETURNS BOOLEAN AS $$
DECLARE
    claims verified_jwt_claims_t;
BEGIN
    claims := verify_session_jwt_and_extract_claims();
    -- Cryptographic role check: claims.actor_role is verified from JWT signature, not from session role.
    IF claims.actor_role NOT IN (
        'platform_operator_break_glass',
        'platform_operator_dr_recovery',
        'platform_operator_compliance_audit'
    ) THEN
        RETURN FALSE;
    END IF;
    -- R1 HIGH-1 closure 2026-05-20: helper now requires an ACTIVE break_glass_active_session row
    -- (NOT just an active approval). Approval-only without explicit session-start does NOT admit cross-tenant reads.
    -- Operator MUST explicitly call begin_target_tenant_break_glass_session() to start a session that
    -- emits the canonical tenant_context.target_tenant_break_glass_session_started Cat A audit event.
    -- The session row is bound to (target_tenant_id, operator_user_id, operator_role, jwt_id/session_id, approval_id, expiry).
    RETURN EXISTS (
        SELECT 1 FROM public.break_glass_active_session bgas
        WHERE bgas.target_tenant_id = is_target_tenant_break_glass_active.target_tenant_id
            AND bgas.operator_user_id = claims.actor_human_id
            AND bgas.operator_role = claims.actor_role
            AND bgas.closed_at IS NULL
            AND bgas.session_expires_at > now()
            -- Session bound to the current verified JWT (prevents stolen-session-id reuse across JWTs)
            AND bgas.bound_jwt_id = claims.jwt_id
            -- Underlying approval still active (revocation propagates)
            AND EXISTS (
                SELECT 1 FROM public.break_glass_approval bga
                WHERE bga.id = bgas.approval_id
                    AND bga.state = 'active'
                    AND bga.revoked_at IS NULL
                    AND bga.expires_at > now()
            )
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = pg_catalog, public;
```

### Sub-decision 7 — Per-access break-glass session procedure

**Decision shape:** new `begin_target_tenant_break_glass_session()` SECURITY DEFINER procedure (VOLATILE; emits audit) that operators MUST call before performing target-tenant PHI reads:

```sql
CREATE PROCEDURE begin_target_tenant_break_glass_session(
    target_tenant_id tenant_id_t,
    intended_purpose TEXT
) AS $$
DECLARE
    claims verified_jwt_claims_t;
    session_record_id UUID;
    approval_record_id UUID;
BEGIN
    claims := verify_session_jwt_and_extract_claims();  -- raises on invalid
    -- R2 Pass-2 HIGH closure 2026-05-20: validate caller's verified claims + active approval DIRECTLY (NOT via
    -- is_target_tenant_break_glass_active() — that helper now requires the session row this procedure is about to create;
    -- using it as precondition creates a chicken-and-egg deadlock on first session-start).
    -- Cryptographic role check from verified JWT claims:
    IF claims.actor_role NOT IN (
        'platform_operator_break_glass',
        'platform_operator_dr_recovery',
        'platform_operator_compliance_audit'
    ) THEN
        RAISE EXCEPTION 'caller role (%) not in platform-operator set; break-glass session-start denied',
            claims.actor_role
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    -- Active-approval check (direct, NOT via the post-session helper):
    SELECT id INTO approval_record_id
        FROM public.break_glass_approval
        WHERE target_tenant_id = begin_target_tenant_break_glass_session.target_tenant_id
            AND operator_user_id = claims.actor_human_id
            AND operator_role = claims.actor_role
            AND state = 'active'
            AND approved_at <= now()
            AND expires_at > now()
            AND revoked_at IS NULL
        LIMIT 1;
    IF approval_record_id IS NULL THEN
        RAISE EXCEPTION 'no active break-glass approval for target_tenant_id=% by operator_user_id=% operator_role=%',
            target_tenant_id, claims.actor_human_id, claims.actor_role
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    -- Record session-start; subsequent helper invocations check this active-session row.
    -- R2 MED closure 2026-05-20: idempotent UPSERT for same-(bound_jwt_id, target_tenant_id) retries.
    -- Duplicate session-start from a middleware retry returns the existing session row (no replay error,
    -- no double-audit) instead of failing hard. The UNIQUE(bound_jwt_id, target_tenant_id) constraint catches
    -- the conflict; ON CONFLICT DO NOTHING + the follow-up SELECT returns the existing row.
    INSERT INTO public.break_glass_active_session (
        id, target_tenant_id, operator_user_id, operator_role,
        bound_jwt_id, session_start, session_expires_at, intended_purpose, approval_id
    )
    VALUES (
        gen_random_uuid(), target_tenant_id, claims.actor_human_id, claims.actor_role,
        claims.jwt_id,
        now(),
        least(now() + INTERVAL '1 hour',
              (SELECT expires_at FROM public.break_glass_approval WHERE id = approval_record_id)),
        intended_purpose, approval_record_id
    )
    ON CONFLICT (bound_jwt_id, target_tenant_id) DO NOTHING
    RETURNING break_glass_active_session.id INTO session_record_id;

    -- Idempotent retry: existing row not returned by INSERT (DO NOTHING); fetch it.
    IF session_record_id IS NULL THEN
        SELECT id INTO session_record_id
            FROM public.break_glass_active_session
            WHERE bound_jwt_id = claims.jwt_id
                AND target_tenant_id = begin_target_tenant_break_glass_session.target_tenant_id
                AND closed_at IS NULL
                AND session_expires_at > now();
        IF session_record_id IS NULL THEN
            -- Genuine failure: row neither inserted nor found (e.g., conflict with a closed/expired row).
            RAISE EXCEPTION 'break-glass session-start failed for target_tenant_id=% (conflicting closed/expired session row exists for jwt_id=%)',
                target_tenant_id, claims.jwt_id
                USING ERRCODE = 'invalid_transaction_state';
        END IF;
        -- Idempotent return: existing session reused; skip duplicate audit emission.
        RETURN;
    END IF;

    -- Emit per-access audit (closes SI-024 v1.0 simplification #8).
    INSERT INTO public.audit_events (
        action_id, partition, partition_key,
        actor_role, actor_user_id,
        subject_tenant_id, subject_entity_type, subject_entity_id,
        event_metadata, occurred_at
    )
    VALUES (
        'tenant_context.target_tenant_break_glass_session_started', 'P2', 'platform',
        claims.actor_role, claims.actor_human_id,
        target_tenant_id, 'break_glass_active_session', session_record_id,
        jsonb_build_object(
            'intended_purpose', intended_purpose,
            'jwt_id', claims.jwt_id,
            'session_id', claims.session_id
        ),
        now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
```

`break_glass_active_session` table schema:

```sql
CREATE TABLE break_glass_active_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_tenant_id tenant_id_t NOT NULL,
    operator_user_id UUID NOT NULL,
    operator_role TEXT NOT NULL,
    bound_jwt_id UUID NOT NULL,  -- R1 HIGH-1 closure: binds session row to specific JWT (prevents stolen-session-id reuse)
    session_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    session_expires_at TIMESTAMPTZ NOT NULL,
    intended_purpose TEXT NOT NULL,
    approval_id UUID NOT NULL REFERENCES break_glass_approval(id),
    closed_at TIMESTAMPTZ,
    -- One active session per (jwt_id, target_tenant_id) tuple to prevent multi-session-from-one-JWT abuse
    CONSTRAINT break_glass_active_session_unique_per_jwt
        UNIQUE (bound_jwt_id, target_tenant_id)
);
-- Active iff closed_at IS NULL AND session_expires_at > now() AND bound_jwt_id matches caller's current verified JWT.
-- Indexed on (bound_jwt_id) + (operator_user_id, target_tenant_id, closed_at) for helper-EXISTS lookup performance.
CREATE INDEX break_glass_active_session_helper_lookup
    ON break_glass_active_session (bound_jwt_id, target_tenant_id, operator_user_id, operator_role, closed_at)
    WHERE closed_at IS NULL;
```

The `is_target_tenant_break_glass_active()` helper post-SI-024.1 checks for an active session row (not just approval); approval-without-session no longer admits cross-tenant reads — operator MUST explicitly open a session first.

### Sub-decision 8 — Two-phase dual-control approval workflow

**Decision shape:** replace SI-024 v0.17's self-attested single-INSERT pattern with a two-phase workflow using `break_glass_approval.state` enum:

```sql
ALTER TABLE break_glass_approval
    ADD COLUMN state TEXT NOT NULL DEFAULT 'pending_co_auth'
        CHECK (state IN ('pending_co_auth', 'active', 'rejected'));

-- Procedures (R4 HIGH closure 2026-05-20: deployable PL/pgSQL bodies with verified-claims checks +
-- atomic state transitions + audit emission. SECURITY DEFINER + search_path hardened per SI-024 pattern.)

-- propose_break_glass_approval: phase 1 of dual-control workflow.
-- Caller must hold either compliance_officer OR cto_role (verified via JWT claims, NOT role-membership).
-- INSERTs row with state='pending_co_auth' + the caller's OWN authorizer field populated.
-- The OTHER authorizer field is left NULL pending co-authorization.
CREATE PROCEDURE propose_break_glass_approval(
    p_target_tenant_id tenant_id_t,
    p_operator_user_id UUID,
    p_operator_role TEXT,
    p_approval_reason TEXT,
    p_expires_at TIMESTAMPTZ
) AS $$
DECLARE
    claims verified_jwt_claims_t;
    new_approval_id UUID := gen_random_uuid();
BEGIN
    claims := verify_session_jwt_and_extract_claims();  -- raises on invalid/missing-admission
    -- Caller role verification: must be a dual-control authorizer role.
    IF claims.actor_role NOT IN ('compliance_officer', 'cto_role') THEN
        RAISE EXCEPTION 'caller role (%) not in dual-control authorizer set; propose_break_glass_approval denied',
            claims.actor_role
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    -- Time-bound check: expires_at must be in the future + within canonical 4-hour cap per SI-024 Sub-decision 5a.
    IF p_expires_at <= now() OR p_expires_at > now() + INTERVAL '4 hours' THEN
        RAISE EXCEPTION 'expires_at (%) must be within (now(), now()+4 hours]', p_expires_at
            USING ERRCODE = 'invalid_parameter_value';
    END IF;
    -- Target operator role validation.
    IF p_operator_role NOT IN (
        'platform_operator_break_glass',
        'platform_operator_dr_recovery',
        'platform_operator_compliance_audit'
    ) THEN
        RAISE EXCEPTION 'p_operator_role (%) not in platform-operator set', p_operator_role
            USING ERRCODE = 'invalid_parameter_value';
    END IF;
    -- INSERT pending approval with caller's authorizer field populated.
    INSERT INTO public.break_glass_approval (
        id, target_tenant_id, operator_user_id, operator_role,
        approval_reason, expires_at, state,
        authorized_by_compliance_officer_user_id,
        authorized_by_cto_user_id,
        approved_at
    )
    VALUES (
        new_approval_id, p_target_tenant_id, p_operator_user_id, p_operator_role,
        p_approval_reason, p_expires_at, 'pending_co_auth',
        CASE WHEN claims.actor_role = 'compliance_officer' THEN claims.actor_human_id ELSE NULL END,
        CASE WHEN claims.actor_role = 'cto_role' THEN claims.actor_human_id ELSE NULL END,
        NULL  -- approved_at set at co-authorization, not at proposal
    );
    -- Emit Cat A audit event: break_glass_approval_proposed.
    INSERT INTO public.audit_events (
        action_id, partition, partition_key,
        actor_role, actor_user_id,
        subject_tenant_id, subject_entity_type, subject_entity_id,
        event_metadata, occurred_at
    )
    VALUES (
        'tenant_context.break_glass_approval_proposed', 'P2', 'platform',
        claims.actor_role, claims.actor_human_id,
        p_target_tenant_id, 'break_glass_approval', new_approval_id,
        jsonb_build_object(
            'operator_user_id', p_operator_user_id,
            'operator_role', p_operator_role,
            'approval_reason', p_approval_reason,
            'expires_at', p_expires_at,
            'proposer_role', claims.actor_role
        ),
        now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

-- co_authorize_break_glass_approval: phase 2 of dual-control workflow.
-- Caller must hold the OTHER role (compliance_officer if proposer was cto_role, and vice versa).
-- Must be a distinct human_id from the proposer (no self-co-authorization).
-- Atomically UPDATEs row: populates other authorizer field + sets state='active' + approved_at = now().
CREATE PROCEDURE co_authorize_break_glass_approval(p_approval_id UUID) AS $$
DECLARE
    claims verified_jwt_claims_t;
    existing_approval RECORD;
BEGIN
    claims := verify_session_jwt_and_extract_claims();
    -- Caller role verification.
    IF claims.actor_role NOT IN ('compliance_officer', 'cto_role') THEN
        RAISE EXCEPTION 'caller role (%) not in dual-control authorizer set', claims.actor_role
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    -- Lock the pending approval row for atomic state transition (prevents concurrent co-auth race).
    SELECT
        id, state,
        authorized_by_compliance_officer_user_id,
        authorized_by_cto_user_id,
        target_tenant_id, operator_user_id, operator_role,
        expires_at
    INTO existing_approval
    FROM public.break_glass_approval
    WHERE id = p_approval_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'break_glass_approval id=% not found', p_approval_id
            USING ERRCODE = 'no_data_found';
    END IF;
    IF existing_approval.state <> 'pending_co_auth' THEN
        RAISE EXCEPTION 'break_glass_approval id=% is in state=%; can only co-authorize from pending_co_auth',
            p_approval_id, existing_approval.state
            USING ERRCODE = 'invalid_transaction_state';
    END IF;
    IF existing_approval.expires_at <= now() THEN
        RAISE EXCEPTION 'break_glass_approval id=% has expired; cannot co-authorize', p_approval_id
            USING ERRCODE = 'invalid_transaction_state';
    END IF;
    -- Caller must be the OTHER dual-control role + distinct human_id from proposer.
    IF claims.actor_role = 'compliance_officer' THEN
        IF existing_approval.authorized_by_compliance_officer_user_id IS NOT NULL THEN
            RAISE EXCEPTION 'proposer was already compliance_officer; co-authorizer must be cto_role'
                USING ERRCODE = 'insufficient_privilege';
        END IF;
        IF existing_approval.authorized_by_cto_user_id = claims.actor_human_id THEN
            RAISE EXCEPTION 'co-authorizer human_id (%) must be distinct from proposer human_id', claims.actor_human_id
                USING ERRCODE = 'insufficient_privilege';
        END IF;
        UPDATE public.break_glass_approval
            SET authorized_by_compliance_officer_user_id = claims.actor_human_id,
                state = 'active',
                approved_at = now()
            WHERE id = p_approval_id;
    ELSIF claims.actor_role = 'cto_role' THEN
        IF existing_approval.authorized_by_cto_user_id IS NOT NULL THEN
            RAISE EXCEPTION 'proposer was already cto_role; co-authorizer must be compliance_officer'
                USING ERRCODE = 'insufficient_privilege';
        END IF;
        IF existing_approval.authorized_by_compliance_officer_user_id = claims.actor_human_id THEN
            RAISE EXCEPTION 'co-authorizer human_id (%) must be distinct from proposer human_id', claims.actor_human_id
                USING ERRCODE = 'insufficient_privilege';
        END IF;
        UPDATE public.break_glass_approval
            SET authorized_by_cto_user_id = claims.actor_human_id,
                state = 'active',
                approved_at = now()
            WHERE id = p_approval_id;
    END IF;
    -- Emit Cat A audit event: break_glass_approval_co_authorized.
    INSERT INTO public.audit_events (
        action_id, partition, partition_key,
        actor_role, actor_user_id,
        subject_tenant_id, subject_entity_type, subject_entity_id,
        event_metadata, occurred_at
    )
    VALUES (
        'tenant_context.break_glass_approval_co_authorized', 'P2', 'platform',
        claims.actor_role, claims.actor_human_id,
        existing_approval.target_tenant_id, 'break_glass_approval', p_approval_id,
        jsonb_build_object(
            'operator_user_id', existing_approval.operator_user_id,
            'operator_role', existing_approval.operator_role,
            'co_authorizer_role', claims.actor_role,
            'state_transition', 'pending_co_auth → active'
        ),
        now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;
```

This closes SI-024 v0.17 simplification #9 — no longer requires out-of-band trust + self-attestation.

### Sub-decision 9 — Migration from SI-024 v0.17 to SI-024.1

**Decision shape:** zero-downtime migration via helper-name versioning:

- **Phase A (SI-024.1 foundation; pre-merge HIGH-1 closure 2026-05-20: explicit ordered DDL migration with prerequisites + guarded ALTERs):**

  **Prerequisite:** SI-024 v0.17 TRANSITIONAL must already be deployed in the target schema (i.e., `break_glass_approval` table exists with its v0.17 columns: `id`, `target_tenant_id`, `operator_user_id`, `operator_role`, `approval_reason`, `authorized_by_compliance_officer_user_id`, `authorized_by_cto_user_id`, `approved_at`, `expires_at`, `revoked_at`). SI-024.1 Phase A migration WILL FAIL if executed against a schema without SI-024 v0.17 baseline.

  **Ordered migration steps:**

  1. **ALTER break_glass_approval** (Sub-decision 8 prep): `ALTER TABLE break_glass_approval ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('pending_co_auth', 'active', 'rejected'));`. The DEFAULT 'active' preserves backward-compat — existing rows admitted at SI-024 v0.17 self-attested INSERT path remain 'active' without re-authorization. Going forward, all new rows come via `propose_break_glass_approval()` with state='pending_co_auth' until co-authorized.
  2. **Create jwt_signing_key_public + session_jwt_replay_set + session_jwt_admission + jwt_migration_entity_status** tables (independent of break_glass_approval; no FK dependencies).
  3. **Create break_glass_active_session** table (FK to break_glass_approval(id) — now safe because Step 1 ensured break_glass_approval exists + the FK only references `id` which is in the SI-024 baseline).
  4. **Create canonical helper functions**: `current_backend_start_at()`, `admit_session_jwt()`, `verify_session_jwt_and_extract_claims()`, `is_target_tenant_break_glass_active()` (updated body), `is_platform_operator_break_glass_active()` (updated body), `current_tenant_id_strict(p_entity_name TEXT)` (updated signature per Sub-decision 9 closure below).
  5. **Create procedures**: `begin_target_tenant_break_glass_session()`, `propose_break_glass_approval()`, `co_authorize_break_glass_approval()`.
  6. **Audit trigger functions (pre-merge cycle-3 HIGH closure 2026-05-20: single-authority emission to prevent duplication):**
     - **SI-024.1-managed lifecycle events** (`tenant_context.break_glass_approval_proposed` + `_co_authorized` + `_rejected`): emitted **EXCLUSIVELY from inside the procedure bodies** (`propose_break_glass_approval` + `co_authorize_break_glass_approval` + future `reject_break_glass_approval`). NO trigger-based emission for these — the procedure-internal INSERT is the canonical authority. Reason: procedure-level emission is tightly bound to the state transition + has access to all parameters (operator details, reason, state_transition) without re-querying.
     - **SI-024 v0.17-era `break_glass_approval_created`**: continues to fire from the AFTER-INSERT trigger established at SI-024 v0.17 (Sub-decision 5a). This trigger applies ONLY when `state='active'` was set at INSERT time (the v0.17 self-attested pattern). New SI-024.1-managed rows enter at `state='pending_co_auth'` and DO NOT fire the v0.17 trigger (the trigger condition `state='active'` excludes them); the procedure-internal audit covers them.
     - **`break_glass_approval_revoked`**: continues from the SI-024 v0.17 AFTER-UPDATE-of-revoked_at trigger. Both v0.17-era and SI-024.1-managed rows fire this trigger when revoked — single source of truth.
     - Net effect: each state transition emits exactly ONE Cat A audit event, regardless of which authoring SI created the row.

  **Idempotency discipline:** all CREATE statements use `IF NOT EXISTS` where syntactically valid; CREATE OR REPLACE for functions/procedures. Phase A migration is re-runnable.

  **New helpers coexist** with SI-024 v0.17 helpers under same names — function bodies updated; semantics extended.
- **Phase B (middleware cutover; pre-merge HIGH-2 closure 2026-05-20: enforceable per-entity fallback via entity_name parameter):** middleware starts populating `app.session_jwt` GUC alongside (NOT instead of) `app.tenant_id`. Helpers prefer JWT when present + fall back to raw GUC ONLY for entities marked Phase-4-INELIGIBLE in `jwt_migration_entity_status`.

  **Helper signature change:** `current_tenant_id_strict()` becomes `current_tenant_id_strict(p_entity_name TEXT)`. RLS policies pass the entity name as a literal at policy-creation time:

  ```sql
  -- Per-entity policy passes the literal entity name at CREATE POLICY time:
  CREATE POLICY medication_request_tenant_isolation ON medication_request
      USING (tenant_id = current_tenant_id_strict('medication_request'));
  ```

  **`jwt_migration_entity_status` table:**

  ```sql
  CREATE TABLE jwt_migration_entity_status (
      entity_name TEXT PRIMARY KEY,
      phase_4_cutover_eligible BOOLEAN NOT NULL DEFAULT TRUE,  -- TRUE = JWT required; raw-GUC fallback denied
      production_break_glass_surface BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE = JWT required regardless of phase_4 flag
      raw_guc_fallback_audited BOOLEAN NOT NULL DEFAULT TRUE,  -- TRUE = emit tenant_context.raw_guc_fallback_used on fallback
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  -- Default posture: phase_4_cutover_eligible = TRUE → JWT required → no fallback. Entities explicitly flipped to FALSE during Phase B opt out per-entity.
  -- All break_glass_* entities + Phase-4-bound PHI entities default-locked to JWT-only.
  ```

  **Helper body shape (pre-merge Pass-2 closures 2026-05-20: zero-arg transitional wrapper preserves v0.17 contract; STABLE helper is side-effect-free; fallback audit moved to admission/wrapper path):**

  ```sql
  -- Parameterized helper: STABLE + read-only. Per-entity fallback gate via jwt_migration_entity_status lookup
  -- (READ ONLY; no audit INSERT — that would violate STABLE per the same constraint that SPLIT the JWT verifier).
  CREATE FUNCTION current_tenant_id_strict(p_entity_name TEXT) RETURNS tenant_id_t AS $$
  DECLARE
      claims verified_jwt_claims_t;
      entity_status RECORD;
      jwt_present BOOLEAN;
  BEGIN
      jwt_present := current_setting('app.session_jwt', true) IS NOT NULL
                     AND current_setting('app.session_jwt', true) <> '';
      IF jwt_present THEN
          claims := verify_session_jwt_and_extract_claims();
          RETURN claims.tenant_id;
      END IF;
      -- No JWT: check whether this entity permits raw-GUC fallback.
      SELECT phase_4_cutover_eligible, production_break_glass_surface
        INTO entity_status
        FROM public.jwt_migration_entity_status
        WHERE entity_name = p_entity_name;
      IF NOT FOUND OR entity_status.phase_4_cutover_eligible = TRUE
         OR entity_status.production_break_glass_surface = TRUE THEN
          RAISE EXCEPTION 'current_tenant_id_strict(%) requires JWT; raw-GUC fallback denied (entity Phase-4-bound, production-break-glass, or unknown)',
              p_entity_name
              USING ERRCODE = 'insufficient_privilege';
      END IF;
      -- Fallback permitted; audit emission deferred to VOLATILE wrapper or admission-path tracking (Pass-2 MED closure).
      RETURN current_setting('app.tenant_id', false)::tenant_id_t;
  END;
  $$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;

  -- Zero-arg transitional wrapper: preserves SI-024 v0.17 contract during Phase B coexistence.
  -- Pre-merge Pass-2 HIGH-1 closure 2026-05-20: PostgreSQL treats current_tenant_id_strict() and
  -- current_tenant_id_strict(TEXT) as DIFFERENT overloads — they don't replace each other. Existing v0.17
  -- policies call the zero-arg form; without this wrapper, they would break at Phase A deploy.
  -- The wrapper hardcodes a sentinel entity_name = '_legacy_v017_caller_'; jwt_migration_entity_status MUST
  -- contain a seed row for that sentinel with phase_4_cutover_eligible = FALSE during Phase A-B,
  -- flipped to TRUE only when all v0.17 policies have been migrated to the parameterized form.
  CREATE OR REPLACE FUNCTION current_tenant_id_strict() RETURNS tenant_id_t AS $$
  BEGIN
      RETURN current_tenant_id_strict('_legacy_v017_caller_');
  END;
  $$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;

  -- VOLATILE fallback-audit emitter: called by middleware OR by per-statement triggers.
  -- Pre-merge Pass-2 MED closure 2026-05-20: moved out of the STABLE helper. Middleware that issues
  -- a query in Phase B coexistence path SHOULD call this function explicitly at request-start if
  -- raw-GUC fallback is expected (i.e., app.session_jwt is unset). Alternative: a statement-level
  -- audit trigger on entities permitting fallback (deferred to Phase A implementation detail).
  CREATE FUNCTION emit_raw_guc_fallback_audit(p_entity_name TEXT) RETURNS VOID AS $$
  BEGIN
      INSERT INTO public.audit_events (action_id, partition, partition_key, event_metadata, occurred_at)
      VALUES ('tenant_context.raw_guc_fallback_used', 'P2', 'platform',
              jsonb_build_object('entity_name', p_entity_name, 'caller_role', current_user),
              now());
  END;
  $$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = pg_catalog, public;
  ```

  **Initial seed (pre-merge Pass-2 HIGH-2 closure 2026-05-20):** Phase A migration MUST include a seed step populating `jwt_migration_entity_status` from the canonical RLS-entity inventory in CDM v1.5 (and CDM v1.4 inherited entities). Each existing v0.17 entity gets a seed row with:
  - `entity_name` = the canonical entity name
  - `phase_4_cutover_eligible = FALSE` (default during Phase B; permits fallback)
  - `production_break_glass_surface = FALSE` (default; entities explicitly in break-glass surface flipped to TRUE)
  - `_legacy_v017_caller_` sentinel row with `phase_4_cutover_eligible = FALSE` (allows the zero-arg transitional wrapper to function during Phase B)

  **Ownership + maintenance authority (per pre-merge Pass-2 HIGH-2 OQ):** the table is maintained by the CDM owner. New entities added to CDM amendments MUST include a `jwt_migration_entity_status` seed row in the same amendment commit (enforced by Phase A onward as a CDM-amendment authoring discipline; tracked by the audit_events.action_id `cdm.entity_jwt_migration_status_added` Cat B event added to AUDIT_EVENTS at SI-024.1 promotion). See OQ8/9 below.

  - **Production-break-glass surface:** `is_target_tenant_break_glass_active()` + `begin_target_tenant_break_glass_session()` REQUIRE JWT — NO raw-GUC fallback EVER (enforced by the `production_break_glass_surface = TRUE` default for these entities + by the unconditional `verify_session_jwt_and_extract_claims()` call in the helper body which raises on missing JWT).
  - **Audit emission for fallback usage (pre-merge cycle-3 MED closure 2026-05-20: mandatory middleware contract + Phase D telemetry-clean gate as enforcement mechanism):** raw-GUC fallback audit is a **MANDATORY** middleware-contract responsibility:
    - **Middleware contract:** if `app.session_jwt` is unset at request-start AND the request will touch a fallback-eligible entity, middleware MUST call `emit_raw_guc_fallback_audit(<entity_name>)` BEFORE the first RLS-protected query. This emits the Cat A `tenant_context.raw_guc_fallback_used` event.
    - **Enforcement mechanism (DB-side):** the canonical helper cannot enforce this from the STABLE RLS path (STABLE constraint blocks side effects — Pass-2 MED closure pattern). Instead, enforcement is via the **Phase D telemetry-clean gate**: Phase 4 cutover for any entity REQUIRES `>0 raw_guc_fallback_used events in the prior 30 days FOR THAT ENTITY` (proves middleware is calling the fallback audit correctly). Entities with NO observed fallback events during Phase B = either middleware is correctly using JWT (good) OR middleware is skipping the audit (bad; manual investigation required before flipping `phase_4_cutover_eligible=TRUE`).
    - **Defense-in-depth (mandatory):** Phase A migration MUST install a session-start hook OR connection-pool middleware shim that calls `emit_raw_guc_fallback_audit()` automatically when JWT is absent. Non-compliant deployments (skipping the hook) are detectable via the telemetry-clean gate inversion (entities marked `phase_4_cutover_eligible=FALSE` but with zero observed fallback events).
    - **Acknowledged simplification #10:** DB-side cryptographic enforcement of per-statement fallback audit is deferred to a hypothetical future SI-024.2 (would require per-statement triggers per entity OR a new audit-attestation primitive). SI-024.1 v1.0 relies on the middleware contract + Phase D telemetry-clean gate as the enforcement mechanism.
  - **Migration discipline:** all NEW RLS policies authored post-SI-024.1 MUST use the entity_name-parameterized helper. Existing SI-024 v0.17 policies (using the old zero-arg helper) are migrated via a sweep: per-entity policy DROPs old policy + CREATEs new policy with entity_name literal. Sweep tracked in `jwt_migration_entity_status` via a `migrated_at TIMESTAMPTZ` column added at Phase B begin.
- **Phase C (telemetry):** 30-day window measuring JWT-verification overhead + failure modes.
- **Phase D (raw-GUC deprecation):** middleware stops populating raw `app.tenant_id`; helpers fail-closed if JWT absent.
- **Phase E (SI-024 v0.17 Phase 4 cutover unlock):** with SI-024.1 in production, SI-024 v0.17's Phase 4 (drop raw-GUC permissive policy) is unblocked.
- **Phase F (INVARIANTS I-036):** lands at INVARIANTS v5.5 with the first SI-024 Phase 4 entity cutover.

### Sub-decision 10 — Audit event taxonomy extension

**Decision shape:** new Cat A events under `tenant_context.*` namespace:

| Event | Source |
|---|---|
| `tenant_context.target_tenant_break_glass_session_started` | begin_target_tenant_break_glass_session() — per-access audit |
| `tenant_context.target_tenant_break_glass_session_closed` | session closure (explicit or expiry) |
| `tenant_context.jwt_signature_verification_failed` | verify_session_jwt_and_extract_claims() raise on invalid signature |
| `tenant_context.jwt_replay_attempt_detected` | replay detection in anti-replay set |
| `tenant_context.jwt_signing_key_rotated` | new row in jwt_signing_key_public |
| `tenant_context.break_glass_approval_proposed` | propose_break_glass_approval() — phase 1 |
| `tenant_context.break_glass_approval_co_authorized` | co_authorize_break_glass_approval() — phase 2 → 'active' |
| `tenant_context.break_glass_approval_rejected` | explicit rejection by co-authorizer |
| `tenant_context.raw_guc_fallback_used` | R1 MED closure: helper fell back to raw-GUC during Phase B coexistence (entity-name + caller-role + reason in event_metadata; telemetry-tracked for Phase 4 migration discipline) |

9 new Cat A events added to AUDIT_EVENTS at SI-024.1 promotion.

---

## 3. Cross-SI alignment

| Cross-SI surface | SI-024.1 surface | Relationship |
|---|---|---|
| SI-024 v0.17 TRANSITIONAL | All sub-decisions | SI-024.1 EXTENDS SI-024 v1.0; helpers updated in-place via Sub-decision 6 |
| Sprint 13 KMS Architecture | Sub-decision 4 KMS signing-key management | SI-024.1 reuses KMS layer; coordinates on key-derivation contract |
| SI-021 v1.0 RATIFIED (CDM v1.5 amendment) | Sub-decision 3 signature algorithm (RSA-PSS-SHA256 matches SI-021 HSM-signing pattern) | Consistency with audit-chain HSM-signing |
| Sprint 18 RBAC v1.2 | Sub-decision 8 two-phase workflow + Sub-decision 7 session procedures | Role-set canonical source (compliance_officer + cto_role) |
| INVARIANTS v5.4 → v5.5 (post-SI-024.1) | Sub-decision 9 Phase F: I-036 lands at first Phase 4 cutover (per SI-024 OQ5) | Platform-floor invariant addition gates on SI-024.1 |
| SI-024 v0.17 simplifications #1, #2, #4, #8, #9 | Sub-decisions 1, 6, 7, 8 close all 5 | Explicit closure of acknowledged residual risks |

---

## 4. Open questions for ratifier (own ceremony)

1. **OQ1 — JWT signing-key architecture (Sub-decision 2).** Recommendation: **two-key model** (platform-wide for tenant JWTs + per-tenant for break-glass JWTs). Ratifier may override to single-key OR full per-tenant.
2. **OQ2 — Signature algorithm (Sub-decision 3).** Recommendation: RSA-PSS-SHA256 for v1.0 (consistency with SI-021 + KMS HSM availability). Ed25519 deferred to SI-024.2 (when PG version upgrade lands).
3. **OQ3 — JWT expiration window.** Recommendation: 15 minutes default; tenant-configurable down to 5 minutes (high-compliance tenants) OR up to 30 minutes (low-throughput tenants). New CCR key `tenant.session_jwt_expiration_seconds`.
4. **OQ4 — Anti-replay set retention.** Recommendation: keep JWT IDs in `session_jwt_replay_set` until expires_at + 1 hour slack. Cleanup job runs hourly.
5. **OQ5 — Phase D timing.** Recommendation: 60-day window between Phase B (middleware cutover begin) and Phase D (raw-GUC deprecation) to allow full middleware fleet rollout + telemetry.
6. **OQ6 — Phase E SI-024 v0.17 Phase 4 cutover authorization.** Recommendation: AUTOMATIC unlock at SI-024.1 Phase D completion + 30-day telemetry-clean window. No separate ratifier ceremony needed.
7. **OQ7 — Codex pre-ratification target.** Recommendation: 4-5 rounds (higher than SI-024 OQ6's 3-4 target because SI-024.1 adds new infrastructure surface; the per-tenant key model + JWT verification logic + two-phase workflow each have multiple ways to be wrong).
8. **OQ8 — jwt_migration_entity_status initial population (pre-merge Pass-2 HIGH-2 closure 2026-05-20).** Recommendation: Phase A migration includes seed step populating one row per existing v0.17 RLS entity (sourced from canonical CDM v1.5 entity inventory) + `_legacy_v017_caller_` sentinel row for the zero-arg transitional wrapper. Default posture: phase_4_cutover_eligible=FALSE during Phase B coexistence; flipped to TRUE per-entity as policies are migrated to the parameterized helper.
9. **OQ9 — jwt_migration_entity_status ongoing maintenance authority (pre-merge Pass-2 HIGH-2 closure 2026-05-20).** Recommendation: CDM owner owns the table. CDM amendments adding new RLS entities MUST include a `jwt_migration_entity_status` seed row in the same amendment commit. Enforced via amendment-authoring discipline + Cat B `cdm.entity_jwt_migration_status_added` audit event at every new-entity addition. SI-024.1 promotion adds this discipline as a canonical contract authoring requirement.

---

## 5. Codex pre-ratification status

**v1.0 v0.1 DRAFT 2026-05-20:** authored per OQ-NEW1 commitment at P-030 (30-day target was 2026-06-19; delivered on day 0 under autonomous-work continuation). Awaiting Pass-1 source-first independent review per CLAUDE.md `16d7244` two-pass discipline.

Authored on `spec/si-024-1-cryptographic-jwt-binding-2026-05-20` branch off main at `245a629` (post-SI-024 v0.17 TRANSITIONAL merge + Addendum 58).

---

— Claude (Opus 4.7, 1M context), SI-024.1 v0.1 DRAFT authored 2026-05-20 per auto-proceed continuation of SI-024 OQ-NEW1/2 commitments at P-030. Per Evans's standing-authorization directive, Claude continues critical-path work without explicit per-cycle confirmation. Pass-1 source-first independent review queued as next action under two-pass discipline.
