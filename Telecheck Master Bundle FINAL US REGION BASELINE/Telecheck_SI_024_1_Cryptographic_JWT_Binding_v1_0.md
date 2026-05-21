# SI-024.1 — Cryptographic JWT-Binding for Hardened Tenant/Platform RLS Helper Pattern

**Version:** 1.0 v0.1 DRAFT
**Status:** PRE-CODEX (awaiting Pass-1 source-first independent review per CLAUDE.md two-pass discipline)
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

### Sub-decision 1 — Cryptographic JWT verification function

**Decision shape:** add a canonical SQL function `verify_session_jwt_and_extract_claims()` that takes the JWT from `app.session_jwt` GUC, verifies the signature against the KMS-stored public key, and returns the verified claims as a typed record. The helper functions then consume the verified-claims record instead of trusting raw session GUCs.

```sql
-- Canonical JWT verification function (SECURITY DEFINER owned by sec_jwt_verifier role).
-- Returns: verified claims record OR raises on signature failure / expired / malformed JWT.
-- KMS-backed public-key lookup; per-tenant signing key OR platform-wide signing key per Sub-decision 2.
CREATE TYPE verified_jwt_claims_t AS (
    tenant_id tenant_id_t,
    actor_human_id UUID,
    actor_role TEXT,
    session_id UUID,
    issued_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    jwt_id UUID  -- unique per session; used for replay detection
);

CREATE FUNCTION verify_session_jwt_and_extract_claims() RETURNS verified_jwt_claims_t AS $$
DECLARE
    jwt TEXT;
    claims verified_jwt_claims_t;
BEGIN
    jwt := current_setting('app.session_jwt', false);  -- fail-loud on unset
    -- Signature verification via pgcrypto + KMS-stored public key (see Sub-decision 4).
    -- Implementation detail deferred to canonical infrastructure spec; pseudocode shape:
    --   1. Extract header + payload + signature from JWT
    --   2. Lookup signing-key public component from KMS-managed table
    --   3. Verify signature (RSA-PSS-SHA256 OR Ed25519 per Sub-decision 3)
    --   4. Verify expires_at > now() AND issued_at <= now() (anti-replay)
    --   5. Verify jwt_id not in session_jwt_replay_set table (anti-replay; bounded LRU)
    --   6. Extract claims into typed record
    -- Raises on any failure: invalid signature, expired, malformed, replay.
    RETURN claims;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;
```

**Why STABLE SECURITY DEFINER:**
- STABLE → query-result-cacheable per execution; one verification per query, not per row.
- SECURITY DEFINER → owned by `sec_jwt_verifier` role with SELECT on KMS public-key table; EXECUTE granted to PUBLIC (analogous to SI-024 v1.0 `is_target_tenant_break_glass_active`); body does its own caller-checks (not relying on EXECUTE-grant gating).

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
CREATE TABLE session_jwt_replay_set (
    jwt_id UUID PRIMARY KEY,
    tenant_id tenant_id_t NOT NULL,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL  -- = JWT's expires_at claim; row deletable after this
);
-- Cleanup: scheduled job deletes rows where expires_at < now() - 1 hour (slack window).
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
    -- Approval lookup matches on (target_tenant_id, operator_user_id from verified claims, operator_role from verified claims, active-window).
    -- Closes SI-024 v1.0 simplification #2: now matches by specific operator_role, not just human_id.
    RETURN EXISTS (
        SELECT 1 FROM public.break_glass_approval
        WHERE break_glass_approval.target_tenant_id = is_target_tenant_break_glass_active.target_tenant_id
            AND operator_user_id = claims.actor_human_id
            AND operator_role = claims.actor_role
            AND state = 'active'  -- two-phase workflow per Sub-decision 8 below
            AND approved_at <= now()
            AND expires_at > now()
            AND revoked_at IS NULL
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
BEGIN
    claims := verify_session_jwt_and_extract_claims();  -- raises on invalid
    -- Verify caller has platform-operator role + active approval for target_tenant_id.
    IF NOT is_target_tenant_break_glass_active(target_tenant_id) THEN
        RAISE EXCEPTION 'no active break-glass approval for target_tenant_id=% by operator_user_id=% operator_role=%',
            target_tenant_id, claims.actor_human_id, claims.actor_role
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    -- Record session-start; subsequent helper invocations check this active-session row.
    INSERT INTO public.break_glass_active_session (
        id, target_tenant_id, operator_user_id, operator_role,
        session_start, session_expires_at, intended_purpose, approval_id
    )
    SELECT
        gen_random_uuid(), target_tenant_id, claims.actor_human_id, claims.actor_role,
        now(), least(now() + INTERVAL '1 hour', approval.expires_at), intended_purpose, approval.id
    FROM public.break_glass_approval approval
    WHERE approval.target_tenant_id = begin_target_tenant_break_glass_session.target_tenant_id
        AND approval.operator_user_id = claims.actor_human_id
        AND approval.operator_role = claims.actor_role
        AND approval.state = 'active'
        AND approval.revoked_at IS NULL
        AND approval.expires_at > now()
    RETURNING break_glass_active_session.id INTO session_record_id;

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
    session_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    session_expires_at TIMESTAMPTZ NOT NULL,
    intended_purpose TEXT NOT NULL,
    approval_id UUID NOT NULL REFERENCES break_glass_approval(id),
    closed_at TIMESTAMPTZ
);
-- Active iff closed_at IS NULL AND session_expires_at > now().
```

The `is_target_tenant_break_glass_active()` helper post-SI-024.1 checks for an active session row (not just approval); approval-without-session no longer admits cross-tenant reads — operator MUST explicitly open a session first.

### Sub-decision 8 — Two-phase dual-control approval workflow

**Decision shape:** replace SI-024 v0.17's self-attested single-INSERT pattern with a two-phase workflow using `break_glass_approval.state` enum:

```sql
ALTER TABLE break_glass_approval
    ADD COLUMN state TEXT NOT NULL DEFAULT 'pending_co_auth'
        CHECK (state IN ('pending_co_auth', 'active', 'rejected'));

-- Procedures:
CREATE PROCEDURE propose_break_glass_approval(
    target_tenant_id tenant_id_t,
    operator_user_id UUID,
    operator_role TEXT,
    approval_reason TEXT,
    expires_at TIMESTAMPTZ
) AS $$
-- Caller must be compliance_officer OR cto_role (verified via JWT claims, not role-membership).
-- INSERTs row with state='pending_co_auth' + the caller's own authorizer field populated.
$$;

CREATE PROCEDURE co_authorize_break_glass_approval(approval_id UUID) AS $$
-- Caller must be the OTHER dual-control role (compliance_officer if proposer was cto_role, and vice versa).
-- UPDATEs row: populates other authorizer field + sets state='active'.
-- Verifies distinct human_id (no self-co-authorization).
$$;
```

This closes SI-024 v0.17 simplification #9 — no longer requires out-of-band trust + self-attestation.

### Sub-decision 9 — Migration from SI-024 v0.17 to SI-024.1

**Decision shape:** zero-downtime migration via helper-name versioning:

- **Phase A (SI-024.1 foundation):** create `verify_session_jwt_and_extract_claims()` + `jwt_signing_key_public` table + `session_jwt_replay_set` table + `break_glass_active_session` table + `propose_break_glass_approval()` + `co_authorize_break_glass_approval()` procedures. New helpers coexist with SI-024 v0.17 helpers (under same names — function bodies updated; semantics extended).
- **Phase B (middleware cutover):** middleware starts populating `app.session_jwt` GUC alongside (NOT instead of) `app.tenant_id`. Helpers prefer JWT when present + fall back to raw GUC for backwards compatibility.
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

8 new Cat A events added to AUDIT_EVENTS at SI-024.1 promotion.

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

---

## 5. Codex pre-ratification status

**v1.0 v0.1 DRAFT 2026-05-20:** authored per OQ-NEW1 commitment at P-030 (30-day target was 2026-06-19; delivered on day 0 under autonomous-work continuation). Awaiting Pass-1 source-first independent review per CLAUDE.md `16d7244` two-pass discipline.

Authored on `spec/si-024-1-cryptographic-jwt-binding-2026-05-20` branch off main at `245a629` (post-SI-024 v0.17 TRANSITIONAL merge + Addendum 58).

---

— Claude (Opus 4.7, 1M context), SI-024.1 v0.1 DRAFT authored 2026-05-20 per auto-proceed continuation of SI-024 OQ-NEW1/2 commitments at P-030. Per Evans's standing-authorization directive, Claude continues critical-path work without explicit per-cycle confirmation. Pass-1 source-first independent review queued as next action under two-pass discipline.
