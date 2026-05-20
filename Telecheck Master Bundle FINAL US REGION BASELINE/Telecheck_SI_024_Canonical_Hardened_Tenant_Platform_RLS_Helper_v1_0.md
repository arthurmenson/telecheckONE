# SI-024 — Canonical Hardened Tenant/Platform RLS Helper Pattern

**Version:** 1.0 v0.9 DRAFT — RATIFIER-READY at §10-cadence boundary + pre-merge cycles 1+2+3+4 corrections applied + OQ-NEW1/2 ratification inline + lockstep complete
**Status:** Pre-merge cycle-4: 1 HIGH + 2 MED closed inline (OQ-NEW1 SI-024.1 ratifier commitment recorded inline via auto-proceed + AUDIT_EVENTS count reconciled to 6 + Sub-decision 5a stale audit requirement deferred to SI-024.1). Pre-merge cycle-5 re-verification queued under two-pass.
**Authoring date:** 2026-05-20
**Trigger:** OQ6 cross-CDM deferral from CDM v1.5 amendment cycle (P-029 Pass-2 conditions §2 + Codex cycle-3 deferral approval). SI-024 closes the deferred hardened-helper question at corpus-wide scope.
**Owner:** SRE Lead + Security Engineering Lead + CDM owner
**Parent SIs / precedents:** P-023a (SI-010 trust-anchor rejection — establishes "canonical floor is middleware-GUC after SI-010 rejection"); P-028a (Option A chain-schema tenant-isolation mini-review — first SI to address tenant-isolation discipline post-SI-010); P-029 (CDM v1.5 SI-021 follow-on amendment — first SI to introduce FORCE ROW LEVEL SECURITY + WITH CHECK + fail-closed `current_setting('app.tenant_id', false)` hardening at table level without the cross-corpus helper).
**Companion documents:** Codex Pass-1 R5 finding "tenant RLS still trusts caller-settable session state" (CDM v1.5 amendment cycle); CLAUDE.md commits `f3a6469` + `4f42a00` + `16d7244` + `f483535` (dual-recommendation + two-pass + auto-proceed process novelties).

---

## 1. Purpose + scope

**Problem statement (NARROWED at R1 Pass-2 closure 2026-05-20 per CRITICAL-2):** the canonical v1.10-era tenant-isolation pattern across all PHI-bearing CDM entities is:

```sql
CREATE POLICY <table>_tenant_isolation ON <table>
    USING (tenant_id = current_setting('app.tenant_id')::VARCHAR);
```

PostgreSQL custom GUCs (`app.tenant_id`, `app.platform_operator_break_glass`) are **session-settable by any role that can issue SQL** unless explicitly constrained. **SI-024 v1.0 addresses ONE class of this weakness: direct-DB-role spoofing.** A database role with direct PHI-table grants but NOT in the canonical middleware-context-writer allowlist can today set `app.tenant_id` to any value and read/write across tenants. SI-024 v1.0 closes this by requiring the canonical hardened helper functions to verify the **caller's role identity** against the middleware-writer allowlist before trusting the GUC.

**OUT OF SCOPE for SI-024 v1.0 (explicit residual risk):** a compromised application-tier credential that **already possesses the `app_middleware_writer` role** can still spoof `app.tenant_id` to bypass tenant isolation. Closing this stronger threat model requires cryptographic binding between the verified JWT context and the DB-level tenant_id assertion. **SI-024 v1.0 does NOT claim to close this class of threat.** Cryptographic-binding closure is queued as **SI-024.1 — Cryptographic Tenant-Context Binding for Hardened RLS Helper** (provisional title) as the immediate follow-on cycle; see §6 OQ-NEW1 below.

**SI-024 v1.0 authors the canonical role-constrained-GUC hardened tenant/platform RLS helper pattern** to replace raw `current_setting()` predicates across the entire canonical schema. The pattern hardens the trust boundary by adding (a) role-identity verification against an explicit middleware-writer allowlist and (b) executable DDL-level defense-in-depth (FORCE RLS + WITH CHECK + SECURITY INVOKER + search_path hardening) on top of the existing role-grant model.

**Threat model coverage matrix:**

| Threat | SI-024 v1.0 (B-1 role-constrained-GUC) closes? | SI-024.1 (B-2 cryptographic binding) closes? |
|---|---|---|
| Non-allowlisted DB role with direct PHI grants sets `app.tenant_id` to spoof | YES (helper rejects via role-check) | YES |
| Allowlisted middleware role (`app_middleware_writer`) compromised → attacker sets `app.tenant_id` | NO (residual risk; explicit in v1.0) | YES (JWT signature verification prevents forgery) |
| Table-owner / superuser bypass of RLS | Mitigated by FORCE ROW LEVEL SECURITY | Same |
| Object-redirection attack via attacker-controlled search_path | Closed by SET search_path = pg_catalog, public on helper | Same |
| Break-glass abuse (operator setting platform_operator_break_glass GUC) | Closed by role-based break-glass detection (not GUC-trusting) | Same |

**Explicit residual-risk acknowledgment (Pass-2 closure §C condition):** Adopting SI-024 v1.0 WITHOUT SI-024.1 means the compromised-middleware-credential threat remains open. Operational compensating controls (middleware-credential rotation discipline, anomaly detection on cross-tenant query patterns, audit-trail review per §sub-decision-8) reduce but do not eliminate this residual risk. **SI-024 v1.0 promotion to canonical REQUIRES explicit ratifier acceptance of this residual risk + a committed SI-024.1 ratifier date/owner.**

**In scope:**

1. Canonical hardened helper function shape (`current_tenant_id_strict()` + `is_platform_operator_break_glass_active()` SQL functions).
2. Trust-anchor for the helper (table-bound vs. JWT-claim-bound vs. role-bound; coordination with the SI-010-rejected `_session_actor_context` pattern; coordination with the canonical middleware-GUC model that survived P-023a).
3. Migration scope (which entities migrate; in what order; coexistence period).
4. Backward-compatibility path (raw `current_setting()` predicates coexist during migration; cutover discipline).
5. Break-glass posture (platform_operator break-glass clause in the new helper; role-based authorization vs. GUC-based).
6. Performance / caching implications (helper invocation per row vs. per query; SECURITY DEFINER vs. SECURITY INVOKER).
7. SECURITY DEFINER + `search_path = pg_catalog, public` discipline (R2 HIGH-2 closure from CDM v1.5 amendment cycle is canonical).
8. Test coverage (negative-path coverage proving compromised role cannot spoof tenant identity).
9. Cross-SI alignment with the four CDM v1.5 amendment-cycle chain tables (which already use raw `current_setting()` per OQ6 deferral) + the broader v1.5 canonical entity set.
10. Audit event taxonomy for helper invocation + spoofing-attempt detection.

**Out of scope:**

- SI-010 trust-anchor architecture (rejected at P-023a; SI-024 does NOT propose a permanent `_session_actor_context` table).
- Per-tenant KMS DEK derivation (covered by Sprint 13 KMS Architecture; SI-024's helper consumes the KMS layer, doesn't replace it).
- Application-layer middleware design (Track 2 implementation; SI-024 specifies the SQL/PostgreSQL layer + the contract the middleware must satisfy).
- Quantum-resistance migration (Phase 3+ per OQ-I).

---

## 2. Sub-decisions (ratifier-targetable units)

### Sub-decision 1 — Hardened helper function shape

**Decision shape:** define canonical SQL functions for tenant-identity resolution + platform-operator break-glass detection. **R1 CRITICAL-1 closure 2026-05-20:** helpers use `SECURITY INVOKER` (default) — NOT `SECURITY DEFINER` — because `current_user` inside a `SECURITY DEFINER` function returns the function OWNER's role, not the calling role. `SECURITY INVOKER` ensures `current_user` correctly identifies the actual caller for the role-allowlist check. Search_path hardening still applies via `SET search_path = pg_catalog, public` declaration (defeats unrelated object-redirection attacks).

```sql
-- Canonical hardened helper for tenant_id resolution.
-- Returns: tenant_id_t of the current session's verified tenant context, OR NULL if the caller is not in the
--          middleware-context-writer membership set. Raises ONLY if the caller IS in the membership set but
--          the app.tenant_id GUC is unset (legitimate middleware bug; fail loudly).
-- Trust-anchor: Option B-1 (middleware-GUC with role-binding hardening) — see Sub-decision 2.
-- Security: SECURITY INVOKER so current_user reports the actual caller's role (not the function owner).
-- R2 MED closure 2026-05-20: pg_has_role-based membership check covers connection-pool role-switching +
-- role-inheritance scenarios. Apps using middleware-writer membership via grants (not SET ROLE) are still admitted.
-- R2 HIGH-2 closure 2026-05-20: returns NULL (instead of RAISE) when caller lacks middleware-writer membership.
-- This allows RLS predicates that OR-combine current_tenant_id_strict() with break-glass branches to evaluate
-- the break-glass branch when current_user is a platform_operator_* role (which is not in the middleware membership).
-- NULL = anything in PostgreSQL returns UNKNOWN, which RLS treats as FALSE for policy admission — so the
-- tenant-equality predicate is fail-closed even with NULL return; it just doesn't abort the outer predicate.
CREATE FUNCTION current_tenant_id_strict() RETURNS tenant_id_t AS $$
DECLARE
    resolved_tenant_id tenant_id_t;
BEGIN
    -- Role-membership check via pg_has_role (handles inherited memberships + connection-pool role-switching).
    -- The middleware-writer membership is granted to the actual login/connection role; pg_has_role(current_user, ...,
    -- 'USAGE') returns TRUE iff the current role has the membership transitively.
    IF NOT pg_has_role(current_user, 'app_middleware_writer', 'USAGE')
        AND NOT pg_has_role(current_user, 'app_middleware_reader_via_writer_proxy', 'USAGE') THEN
        -- Caller is NOT in the middleware-writer membership; return NULL so RLS OR-branches can still evaluate.
        -- NOT a hard error because non-middleware callers (e.g., platform_operator_* roles invoking RLS via break-glass)
        -- legitimately reach this helper through the RLS predicate's first OR branch.
        RETURN NULL;
    END IF;
    -- Fail-closed GUC resolution for middleware-membership callers: current_setting(..., false) raises if GUC unset.
    -- Reaching this point means the caller IS authorized to set app.tenant_id; unset GUC is a middleware bug.
    resolved_tenant_id := current_setting('app.tenant_id', false)::tenant_id_t;
    RETURN resolved_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = pg_catalog, public;

-- Canonical break-glass detection.
-- Returns: TRUE iff session has membership in any platform-operator break-glass role.
-- Trust-anchor: role-membership-based via pg_has_role (covers inherited memberships + connection-pool role-switching).
-- Never relies on caller-settable GUC. SECURITY INVOKER preserves caller-role semantics.
-- R2 MED closure 2026-05-20: pg_has_role-based membership check.
CREATE FUNCTION is_platform_operator_break_glass_active() RETURNS BOOLEAN AS $$
BEGIN
    RETURN pg_has_role(current_user, 'platform_operator_break_glass', 'USAGE')
        OR pg_has_role(current_user, 'platform_operator_dr_recovery', 'USAGE')
        OR pg_has_role(current_user, 'platform_operator_compliance_audit', 'USAGE');
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = pg_catalog, public;
```

**Role-membership convention (R2 MED closure 2026-05-20):** the canonical convention for app middleware connection pools is to grant `app_middleware_writer` membership to the LOGIN role (the role connection pools log in as) WITHOUT requiring explicit `SET ROLE` per query. `pg_has_role(current_user, ..., 'USAGE')` returns TRUE because membership is transitive. This is the **default deployment pattern**. Alternative pattern (explicit SET ROLE) is also supported — `pg_has_role` returns TRUE for the explicitly set role too.

**What is FORBIDDEN:** granting `app_middleware_writer` membership to a role that ALSO has direct PHI-table grants outside the middleware-context-writer envelope. The membership convention assumes that a role holding `app_middleware_writer` membership only accesses PHI through middleware-mediated query paths. Direct PHI access by an `app_middleware_writer`-holding role bypasses the threat-model assumptions; deployments MUST audit that the membership set + direct-PHI-grant set are disjoint.

Canonical RLS policy pattern post-SI-024:

```sql
CREATE POLICY <table>_tenant_isolation ON <table>
    USING (
        tenant_id = current_tenant_id_strict()
        OR (is_platform_operator_break_glass_active()
            AND tenant_id = '00000000-0000-0000-0000-000000000000'::tenant_id_t)
    )
    WITH CHECK (
        tenant_id = current_tenant_id_strict()
    );
```

**Why this shape:**
- Single canonical resolver function → consistent enforcement across all entities; cannot be bypassed by varying GUC names per table.
- SECURITY DEFINER + hardened `search_path` defeats object-redirection attacks (per R2 HIGH-2 closure pattern in CDM v1.5 amendment).
- Break-glass is **role-based** (caller's `current_user`), not GUC-settable. Even if GUC `app.platform_operator_break_glass` is set, the helper ignores it; only the role identity counts.
- STABLE function declaration enables PostgreSQL to cache the result per query for performance.
- Trust-anchor selection (Sub-decision 2) is the architectural choice; the helper shape is decoupled from that choice.

### Sub-decision 2 — Trust-anchor for the helper (THE architectural-judgment surface)

**Decision shape:** choose between three trust-anchor patterns for `current_tenant_id_strict()`:

#### Option B-1 — Middleware-GUC with role-binding hardening (RECOMMENDED for v1.0)

The application middleware sets `app.tenant_id` GUC per request after JWT verification. The helper trusts the GUC **only when the current_user role is in an allowlisted set** of middleware-context-writer roles.

```sql
CREATE FUNCTION current_tenant_id_strict() RETURNS tenant_id_t AS $$
BEGIN
    IF current_user NOT IN ('app_middleware_writer', 'app_middleware_reader_via_writer_proxy') THEN
        RAISE EXCEPTION 'tenant context not bound (current_user=% lacks tenant-context-write authority)', current_user
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN current_setting('app.tenant_id', false)::tenant_id_t;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;
```

**Pros:** consistent with the canonical floor (middleware-GUC) that survived P-023a; backwards-compatible with existing RLS predicates; no new infrastructure required; deployable in a single migration.

**Cons:** trust-anchor is still the role-grant model (a compromised `app_middleware_writer` role can still spoof). Defense-in-depth depth = 1 (role-grant enforcement).

#### Option B-2 — JWT-claim-derived GUC with cryptographic binding

The application middleware passes the verified JWT itself (or a signed binding token) to the DB as the GUC value. The helper verifies the JWT signature server-side before extracting `tenant_id`.

```sql
CREATE FUNCTION current_tenant_id_strict() RETURNS tenant_id_t AS $$
DECLARE
    jwt TEXT;
    verified_tenant_id tenant_id_t;
BEGIN
    jwt := current_setting('app.tenant_jwt', false);
    -- Verify JWT signature using a DB-stored public key (managed via Sprint 13 KMS)
    -- Extract tenant_id claim from verified payload
    verified_tenant_id := verify_and_extract_tenant_id_from_jwt(jwt);
    RETURN verified_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;
```

**Pros:** trust-anchor is cryptographic (compromised role cannot forge a valid JWT without the signing key). Defense-in-depth depth = 2 (role-grant + cryptographic).

**Cons:** requires new infrastructure (`verify_and_extract_tenant_id_from_jwt` SQL function + DB-stored verification public key + KMS-managed key rotation); ~2× per-query overhead from JWT verification; migration complexity high; coordination with Sprint 13 KMS Architecture needed.

#### Option B-3 — Permanent `_session_actor_context` table-bound trust anchor

Re-litigates the SI-010 trust-anchor architecture that was rejected at P-023a.

**Pros:** strongest trust-anchor (DB-table-bound; role-grant-locked; explicit audit trail per session).

**Cons:** **EXPLICITLY REJECTED at P-023a.** Re-proposing requires Evans's explicit re-litigation authorization. Documented for completeness but NOT recommended in this SI.

### Sub-decision 3 — Migration scope + sequencing

**Decision shape:** the migration covers all v1.5-era PHI-bearing entities + their RLS policies. Sequencing:

1. **Phase 1 (foundation):** create the canonical hardened helper functions (Sub-decision 1) + provision the trust-anchor (Sub-decision 2) + grant `EXECUTE` to all roles that currently can use raw `current_setting('app.tenant_id')` in RLS. No RLS policy changes yet; helpers coexist with raw GUC.
2. **Phase 2 (RESTRICTIVE parallel policy):** for each PHI-bearing entity, ADD a parallel RLS policy using the hardened helper **with `AS RESTRICTIVE`** so the new policy intersects (AND-combines) with the existing permissive raw-GUC policy. **R1 HIGH-1 closure 2026-05-20:** prior wording said "must satisfy BOTH" implying intersection; but PostgreSQL permissive RLS policies OR-combine by default. Using `AS RESTRICTIVE` explicitly produces the intersection (a row satisfies the table policy iff ALL permissive policies' USING/WITH CHECK is true AND ALL restrictive policies' USING/WITH CHECK is true).

   Canonical Phase 2 DDL pattern (pre-merge HIGH-2 closure 2026-05-20: target-tenant break-glass branch added so legitimate DR/compliance access survives the coexistence window):
   ```sql
   CREATE POLICY <table>_tenant_isolation_hardened_intersection
       ON <table>
       AS RESTRICTIVE
       USING (
           tenant_id = current_tenant_id_strict()
           OR is_target_tenant_break_glass_active(tenant_id)
           OR (is_platform_operator_break_glass_active()
               AND tenant_id = '00000000-0000-0000-0000-000000000000'::tenant_id_t)
       )
       WITH CHECK (
           tenant_id = current_tenant_id_strict()
           OR is_target_tenant_break_glass_active(tenant_id)
       );
   ```
   This ensures: (a) a row admitted under raw-GUC but rejected by the hardened helper is REJECTED during Phase 2 (catches spoofing attempts in telemetry); (b) a row admitted by both is allowed (no false negatives for legitimate traffic); (c) **legitimate target-tenant break-glass reads survive the coexistence window** (closed pre-merge HIGH-2; DR/compliance investigation paths are not denied during the migration meant to harden them); (d) platform-sentinel break-glass reads also survive. The Phase 2 RESTRICTIVE policy MIRRORS the final canonical policy from Sub-decision 5a §3.

3. **Phase 3 (telemetry):** run the dual-policy state for a tenant-launch-readiness window (suggested 30 days per Sprint 17 cadence) collecting telemetry on hardened-helper invocations + any spoofing-attempt audit events. **Required test before Phase 4:** integration test demonstrating that a row admitted under the raw-GUC permissive policy + rejected by the hardened-helper restrictive policy is actually denied during Phase 2 (validates the RESTRICTIVE intersection semantics in production).
4. **Phase 4 (cutover):** for each entity, DROP the raw-GUC permissive RLS policy; the hardened-helper RESTRICTIVE policy + any other permissive policies become the canonical enforcement. (Note: at cutover, the hardened-helper policy may be DROPPED and re-CREATED as permissive instead of restrictive, since it's the sole tenant-isolation policy — restrictive is only needed during the dual-coexistence window.)
5. **Phase 5 (deprecation):** raw `current_setting('app.tenant_id')` predicates are forbidden in new CDM amendments post-Phase 4. INVARIANTS bumped to add I-036 ("RLS predicates MUST use the canonical hardened helper functions; raw `current_setting()` is forbidden for tenant/platform-context resolution").

### Sub-decision 4 — Backward-compatibility + coexistence

**Decision shape:** during Phases 1-3, raw `current_setting()` predicates coexist with the hardened helper. Phase 4 cutover is per-entity, not corpus-wide atomic. CDM v1.5 amendment-cycle chain tables (audit_event_hash_chain + 3 siblings) participate in the same migration on their own per-entity timeline; OQ6 in the CDM v1.5 amendment §6 is resolved by SI-024 ratification + Phase 4 cutover for those tables.

### Sub-decision 5 — Break-glass posture (role-based detection)

**Decision shape:** platform-operator break-glass uses `is_platform_operator_break_glass_active()` role-based check (Sub-decision 1 helper). The session-GUC `app.platform_operator_break_glass` referenced in CDM v1.5 amendment §4.NEW1-4 RLS policies is **DEPRECATED at Phase 4 cutover**. All future break-glass access uses dedicated `platform_operator_*` roles per Sub-decision 1's role-set enumeration. Cross-tenant break-glass access still requires I-024 platform-floor approval (operator-gated; not auto-proceedable per CLAUDE.md hard-floor item 5).

### Sub-decision 5a — Target-tenant break-glass binding (R1 HIGH-2 closure 2026-05-20)

**Decision shape:** the canonical RLS policy under SI-024 (shown in Sub-decision 1) only permits break-glass access to the PLATFORM_TENANT_ID sentinel row, NOT to a target tenant's PHI rows. This is insufficient for legitimate cross-tenant break-glass per I-024 (e.g., DR recovery operator needs to read victim-tenant PHI to validate DR completeness; compliance auditor needs to inspect a specific tenant's audit chain during regulatory investigation).

**Target-tenant break-glass binding contract:**

1. **Approval mechanism (out-of-RLS-policy):** target-tenant break-glass requires a dedicated `break_glass_approval` table entry (CDM v1.5+ entity; canonical schema deferred to Sub-decision 5a follow-on detail OR a separate companion SI):
   ```sql
   CREATE TABLE break_glass_approval (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       operator_role TEXT NOT NULL,            -- 'platform_operator_break_glass' | etc. (Sub-decision 5 enum)
       operator_user_id UUID NOT NULL,         -- The human-identity per iam_principal_human_binding (Sprint 18 RBAC)
       target_tenant_id tenant_id_t NOT NULL,
       approval_reason TEXT NOT NULL,          -- Free-text + structured tags
       authorized_by_compliance_officer_user_id UUID NOT NULL,
       authorized_by_cto_user_id UUID NOT NULL,
       CONSTRAINT break_glass_approval_dual_control CHECK (authorized_by_compliance_officer_user_id <> authorized_by_cto_user_id),
       approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
       expires_at TIMESTAMPTZ NOT NULL,        -- Time-bound; canonical max 4 hours per request
       revoked_at TIMESTAMPTZ,                 -- Compliance Officer or CTO can revoke before expires_at
       CONSTRAINT break_glass_approval_time_bound CHECK (expires_at > approved_at AND expires_at <= approved_at + INTERVAL '4 hours')
   );
   ```

2. **RLS helper extension (current canonical design as of pre-merge cycle-2 closure 2026-05-20: SECURITY INVOKER + EXECUTE TO PUBLIC + inline `pg_has_role` check + defense-in-depth break_glass_approval RLS).**

   **Design-evolution note (pre-merge cycle-2 HIGH-1 closure 2026-05-20):** prior R3 split-helper (had direct-invocation bypass) and R4 EXECUTE-GRANT-only-to-platform-operator (broke normal RLS access for middleware roles) are both SUPERSEDED. The canonical v1.0 design below is the single source of truth; prior design narratives in this file are removed to eliminate ratifier ambiguity. Negative-path test expectation: direct invocation by non-platform-operator role returns FALSE (NOT permission-denied) because EXECUTE is granted to PUBLIC for RLS compatibility; the inline `pg_has_role` check + break_glass_approval RLS provide the fail-closed behavior.

   Rationale for the v0.6 design: under PostgreSQL `SECURITY DEFINER`, neither `session_user` (LOGIN role) nor `current_user` (function OWNER) reports the post-`SET ROLE` effective role of the caller. Under `SECURITY INVOKER`, `current_user` correctly reports the post-`SET ROLE` effective role. Therefore the function uses INVOKER for correct role-identity semantics. EXECUTE is granted to PUBLIC because PostgreSQL checks EXECUTE permission before invoking — if the function is referenced in an RLS predicate that ALL middleware roles must evaluate (USING + WITH CHECK on every PHI table), restricting EXECUTE would cause normal tenant reads to fail with permission-denied. The trust anchor is therefore the **inline `pg_has_role` role-membership check + defense-in-depth RLS on `break_glass_approval`**.

   ```sql
   -- Pre-merge HIGH-1 closure 2026-05-20: SECURITY INVOKER + EXECUTE TO PUBLIC pattern.
   -- The function is callable by ALL roles (no EXECUTE-denial inside RLS predicates).
   -- The function body checks pg_has_role(current_user, 'platform_operator_*', 'USAGE') and returns FALSE
   -- for non-platform-operator callers. Under INVOKER, current_user is the post-SET-ROLE effective role.
   -- Lookup against break_glass_approval runs under INVOKER privileges — the caller's RLS on
   -- break_glass_approval applies (Policy 3 grants platform-operator self-service SELECT on own active
   -- approvals; non-operator callers see zero rows even if the role-check were bypassed).
   CREATE FUNCTION is_target_tenant_break_glass_active(target_tenant_id tenant_id_t) RETURNS BOOLEAN AS $$
   DECLARE
       caller_human_id UUID;
   BEGIN
       -- Role-membership check on the post-SET-ROLE effective role (under INVOKER current_user is correct).
       IF NOT (pg_has_role(current_user, 'platform_operator_break_glass', 'USAGE')
           OR pg_has_role(current_user, 'platform_operator_dr_recovery', 'USAGE')
           OR pg_has_role(current_user, 'platform_operator_compliance_audit', 'USAGE')) THEN
           RETURN FALSE;
       END IF;
       -- Human-identity resolution via session GUC populated by middleware at session-start.
       BEGIN
           caller_human_id := current_setting('app.actor_human_id', false)::UUID;
       EXCEPTION
           WHEN OTHERS THEN
               -- Operator's human-id not bound → break-glass check fails closed.
               RETURN FALSE;
       END;
       -- Approval lookup runs under INVOKER privileges — break_glass_approval RLS policies (declared below)
       -- enforce row visibility: Policy 3 grants platform-operator self-service SELECT on own active approvals.
       -- Match by (target_tenant_id, operator_user_id, active-window); does NOT match by operator_role
       -- (v1.0 simplification; SI-024.1 cryptographic JWT-binding closes this).
       RETURN EXISTS (
           SELECT 1 FROM public.break_glass_approval
           WHERE break_glass_approval.target_tenant_id = is_target_tenant_break_glass_active.target_tenant_id
               AND operator_user_id = caller_human_id
               AND approved_at <= now()
               AND expires_at > now()
               AND revoked_at IS NULL
       );
   END;
   $$ LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = pg_catalog, public;

   -- Function grants:
   -- GRANT EXECUTE ON FUNCTION is_target_tenant_break_glass_active(tenant_id_t) TO PUBLIC;
   -- The EXECUTE-TO-PUBLIC grant is REQUIRED so that RLS predicates (which call this function for every PHI
   -- table read/write across all middleware-writer + platform-operator roles) do not fail with permission-denied.
   -- The fail-closed behavior is enforced INSIDE the function body via pg_has_role + early-return for
   -- non-platform-operator callers. Defense-in-depth: even if the role-check were bypassed (e.g., via a
   -- pg_has_role implementation defect), the break_glass_approval RLS policies prevent non-operators from
   -- seeing approval rows — EXISTS would return FALSE regardless.

   -- Table grants:
   -- GRANT SELECT ON TABLE break_glass_approval
   --   TO platform_operator_break_glass, platform_operator_dr_recovery, platform_operator_compliance_audit;
   -- These grants are REQUIRED so that platform-operator roles invoking the function can reach the table;
   -- the break_glass_approval Policy 3 RLS filters which rows they actually see (only their own active).
   ```

   **Defense-in-depth posture (R4 HIGH + pre-merge HIGH-1 closure 2026-05-20):** the design uses THREE independent layers — (a) inline `pg_has_role` role-check returning FALSE for non-platform-operators; (b) break_glass_approval table FORCE ROW LEVEL SECURITY + Policy 3 restricting platform-operator visibility to their own active approvals; (c) `operator_user_id = caller_human_id` predicate binding to the middleware-verified human-id. Bypassing any single layer doesn't grant unauthorized break-glass access. Acknowledged residual: app.actor_human_id GUC is middleware-trusted (not cryptographically bound in v1.0; SI-024.1 closes via JWT signature verification).

   **Negative-path tests required for SI-024 v1.0 promotion:** (1) Non-platform-operator role direct invocation returns FALSE (role-check fail-closed). (2) Platform-operator role invocation with no `app.actor_human_id` GUC set returns FALSE (GUC exception fail-closed). (3) Platform-operator role invocation with a forged human-id (mismatched against any approval) returns FALSE (no matching approval). (4) Normal middleware role invoking from RLS predicate succeeds without permission-denied + returns FALSE (the OR-branch short-circuit isn't relied on; the function itself returns FALSE).

   **break_glass_approval table access model (R2 HIGH-1 closure):**

   ```sql
   ALTER TABLE break_glass_approval ENABLE ROW LEVEL SECURITY;
   ALTER TABLE break_glass_approval FORCE ROW LEVEL SECURITY;

   -- Policy 1: sec_break_glass_lookup (the function-owner role) can read all rows for the helper's EXISTS lookup.
   CREATE POLICY break_glass_approval_lookup_owner ON break_glass_approval
       FOR SELECT
       TO sec_break_glass_lookup
       USING (TRUE);

   -- Policy 2: Compliance Officer + CTO can SELECT approvals they authorized + revoke them (UPDATE narrow).
   -- R3 HIGH-2 closure 2026-05-20: split FOR ALL into FOR SELECT + FOR UPDATE with tight WITH CHECK preserving
   -- authorization invariants (no insert/delete via this policy; updates only allowed on revoked_at column).
   CREATE POLICY break_glass_approval_authorizer_select ON break_glass_approval
       FOR SELECT
       TO compliance_officer, cto_role
       USING (
           authorized_by_compliance_officer_user_id = current_setting('app.actor_human_id', false)::UUID
           OR authorized_by_cto_user_id = current_setting('app.actor_human_id', false)::UUID
       );

   CREATE POLICY break_glass_approval_authorizer_revoke ON break_glass_approval
       FOR UPDATE
       TO compliance_officer, cto_role
       USING (
           authorized_by_compliance_officer_user_id = current_setting('app.actor_human_id', false)::UUID
           OR authorized_by_cto_user_id = current_setting('app.actor_human_id', false)::UUID
       )
       WITH CHECK (
           -- WITH CHECK: the post-update row must preserve all identity + authorization fields unchanged.
           -- The revoked_at transition trigger below enforces the NULL → timestamp directionality.
           authorized_by_compliance_officer_user_id = current_setting('app.actor_human_id', false)::UUID
           OR authorized_by_cto_user_id = current_setting('app.actor_human_id', false)::UUID
       );

   -- Policy 3: Operator can SELECT only their own active approval rows (for self-service status check).
   CREATE POLICY break_glass_approval_operator_self ON break_glass_approval
       FOR SELECT
       USING (
           is_platform_operator_break_glass_active()
           AND operator_user_id = current_setting('app.actor_human_id', false)::UUID
           AND revoked_at IS NULL
           AND expires_at > now()
       );

   -- Append-only enforcement on all IMMUTABLE columns: prevents tampering with approval rows post-INSERT.
   CREATE TRIGGER break_glass_approval_append_only
       BEFORE UPDATE OF id, operator_role, operator_user_id, target_tenant_id, approval_reason,
                       authorized_by_compliance_officer_user_id, authorized_by_cto_user_id, approved_at, expires_at
       OR DELETE ON break_glass_approval
       FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

   -- R3 HIGH-2 closure: canonical revoked_at-transition trigger.
   -- Enforces: revoked_at can transition ONLY NULL → timestamp (one-way; non-reversible).
   -- Forbids: NULL → NULL noop (no actual change attempted; harmless but rejected for tight semantics);
   --          timestamp → NULL (re-activating a revoked approval — direct tampering vector);
   --          timestamp → different timestamp (rewriting the revocation moment — audit-trail tampering vector).
   CREATE FUNCTION break_glass_approval_revoked_at_transition_guard() RETURNS TRIGGER AS $$
   BEGIN
       -- Only meaningful when revoked_at is the changing column.
       IF NEW.revoked_at IS DISTINCT FROM OLD.revoked_at THEN
           IF OLD.revoked_at IS NOT NULL THEN
               -- Already revoked; reject ANY change (re-clear or timestamp rewrite).
               RAISE EXCEPTION 'break_glass_approval.revoked_at is immutable once set (attempted change: old=%, new=%)',
                   OLD.revoked_at, NEW.revoked_at
                   USING ERRCODE = 'invalid_column_reference';
           END IF;
           -- Transitioning from NULL to NOT NULL — must be a valid timestamp.
           IF NEW.revoked_at IS NULL THEN
               RAISE EXCEPTION 'break_glass_approval.revoked_at cannot transition NULL → NULL via UPDATE (no-op forbidden)'
                   USING ERRCODE = 'invalid_column_reference';
           END IF;
           -- NEW.revoked_at must be >= now() - small_skew_tolerance (allow up to 60s clock skew).
           IF NEW.revoked_at < now() - INTERVAL '60 seconds' OR NEW.revoked_at > now() + INTERVAL '60 seconds' THEN
               RAISE EXCEPTION 'break_glass_approval.revoked_at must be set to current timestamp (±60s); attempted: %',
                   NEW.revoked_at
                   USING ERRCODE = 'invalid_column_reference';
           END IF;
       END IF;
       RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public;

   CREATE TRIGGER break_glass_approval_revoked_at_transition_trg
       BEFORE UPDATE OF revoked_at ON break_glass_approval
       FOR EACH ROW EXECUTE FUNCTION break_glass_approval_revoked_at_transition_guard();
   ```

   **Mutability summary (R3 HIGH-2 closure):** the ONLY column mutable post-INSERT on `break_glass_approval` is `revoked_at`, and only via the NULL → current-timestamp transition (single-shot). All other columns are append-only via the BEFORE UPDATE trigger. DELETE is forbidden for all roles. This makes the table effectively WORM (write-once read-many) with a single sanctioned mutation path (revocation).

3. **Canonical RLS policy under SI-024 v1.0 (revised for target-tenant break-glass):**
   ```sql
   CREATE POLICY <table>_tenant_isolation ON <table>
       USING (
           tenant_id = current_tenant_id_strict()
           OR is_target_tenant_break_glass_active(tenant_id)
           OR (is_platform_operator_break_glass_active()
               AND tenant_id = '00000000-0000-0000-0000-000000000000'::tenant_id_t)
       )
       WITH CHECK (
           tenant_id = current_tenant_id_strict()
           OR is_target_tenant_break_glass_active(tenant_id)
       );
   ```

4. **Audit emission (revised at pre-merge cycle-4 MED-2 closure 2026-05-20):** ~~every invocation of `is_target_tenant_break_glass_active()` that returns TRUE emits Cat A audit event~~ — **DEFERRED to SI-024.1** per acknowledged simplification #8. PostgreSQL STABLE functions used in RLS predicates cannot perform side-effecting INSERTs. SI-024 v1.0 audit trail for cross-tenant break-glass access comes from **`tenant_context.break_glass_approval_created`** (Cat A; records authorization at INSERT to break_glass_approval) and **`tenant_context.break_glass_approval_revoked`** (Cat A; records revocation at revoked_at UPDATE). Per-invocation audit (one event per RLS-predicate-pass) is the explicit known gap; SI-024.1 will route break-glass through an explicit `begin_target_tenant_break_glass_session()` SECURITY DEFINER procedure (VOLATILE; emits audit at session start; the RLS helper then checks active-session vs. active-approval). The implementer contract for SI-024 v1.0: **do NOT attempt RLS-side audit emission from the STABLE helper** — it will fail (PostgreSQL refuses side-effecting writes from STABLE functions) and would represent reimplementing a defect that R3-R4 + cycle-2 closures already rejected.

5. **Time-bound enforcement:** max 4-hour approval window per request; renewal requires a NEW dual-control authorization. The `expires_at` check is encoded in `is_target_tenant_break_glass_active()`, so expiry is enforced at query-time, not just at approval-time.

6. **Compensating control:** post-action review — every break_glass_approval row triggers an after-the-fact Compliance Officer review within 24h. The review record is a child entity of `break_glass_approval` (schema deferred to follow-on detail).

**Why this shape:** addresses Pass-1 HIGH-2 finding that the canonical policy only exposed platform-sentinel rows. Target-tenant break-glass is now first-class in the canonical pattern with explicit approval + time-bound + audit + dual-control. Operators cannot bypass RLS via raw SQL because the FORCE ROW LEVEL SECURITY discipline (Sub-decision 1's canonical policy) applies to break-glass roles too.

### Sub-decision 6 — Performance + caching

**Decision shape:** helpers are `STABLE` so PostgreSQL caches results per execution context. Per-query overhead expected < 100ns on modern hardware (function-call + role-check). RLS policy invocations inline the helper into the query plan; no per-row helper call. Telemetry from Phase 3 validates the assumption.

### Sub-decision 7 — Test coverage

**Decision shape:** negative-path test suite required for SI-024 promotion:

- Test 1: `app_middleware_writer` role can set GUC + helper returns the bound value.
- Test 2 (corrected at pre-merge cycle-3 MED closure 2026-05-20): Role NOT in the middleware-writer membership returns **NULL** from `current_tenant_id_strict()` (NOT a `RAISE insufficient_privilege` — that was the pre-R2-HIGH-2 design; v0.6+ returns NULL so RLS OR-branches can evaluate). Verify RLS predicate using this helper correctly fails closed (treats NULL = anything as UNKNOWN → FALSE for policy admission).
- Test 2a (added at pre-merge cycle-3 MED closure 2026-05-20): Role IN middleware-writer membership but `app.tenant_id` GUC unset → `current_tenant_id_strict()` raises (fails loudly because this represents a legitimate middleware bug, not unauthorized access).
- Test 3: Setting GUC `app.platform_operator_break_glass = 'true'` from a non-`platform_operator_*` role does NOT trigger break-glass clause.
- Test 4: Cross-tenant read attempt by a compromised `app_middleware_writer` setting GUC to victim tenant_id — RLS still enforces the helper's verified context (if Option B-2 with cryptographic binding) OR demonstrates the residual risk (if Option B-1).
- Test 5: SECURITY DEFINER + `search_path` discipline — helper invocation under attacker-controlled `search_path` does not redirect to attacker-controlled tables.

### Sub-decision 8 — Audit event taxonomy

**Decision shape:** new audit events under `tenant_context.*` namespace (added to AUDIT_EVENTS at SI-024 promotion):

- `tenant_context.hardened_helper_role_check_rejected` (Cat A; P2 keyed by 'platform') — fires when `current_tenant_id_strict()` rejects a non-allowlisted role.
- `tenant_context.platform_operator_break_glass_invoked` (Cat A; P2 keyed by 'platform') — fires when `is_platform_operator_break_glass_active()` returns TRUE.
- ~~`tenant_context.target_tenant_break_glass_invoked`~~ — **REMOVED at pre-merge cycle-2 HIGH-2 closure 2026-05-20.** The original design called for an audit event on every TRUE return from `is_target_tenant_break_glass_active()`, but PostgreSQL STABLE functions (required for RLS predicate use) cannot perform side-effecting INSERTs. Per-invocation audit emission is **deferred to SI-024.1** (cryptographic JWT-binding follow-on) which will route break-glass access through an explicit operator-initiated `begin_target_tenant_break_glass_session()` SECURITY DEFINER procedure (VOLATILE; emits audit at session start; RLS helper then checks active session). For SI-024 v1.0, the audit trail for cross-tenant break-glass access is constructed from: (a) `break_glass_approval_created` (records authorization); (b) `break_glass_approval_revoked` (records revocation). Per-access invocation audit is a known gap covered by SI-024.1. This is acknowledged simplification #8 in §5 cycle metrics.
- `tenant_context.guc_set_without_role_authority_attempt` (Cat A; P2 keyed by 'platform') — fires when a role lacking write-authority attempts to SET `app.tenant_id` (requires PostgreSQL session-trigger or event-trigger to detect; implementation deferred to Sub-decision 9).
- `tenant_context.cross_tenant_read_blocked_by_hardened_helper` (Cat A; P2 keyed by 'platform') — fires when the hardened-helper RESTRICTIVE policy blocks a read that would have been permitted under raw-GUC permissive policy (telemetry for Phase 3 dual-policy state).
- `tenant_context.break_glass_approval_created` (Cat A; P2 keyed by 'platform') — fires on INSERT to `break_glass_approval` table; carries operator + authorizing-officers + target_tenant_id + reason + time-bound.
- `tenant_context.break_glass_approval_revoked` (Cat A; P2 keyed by 'platform') — fires on `revoked_at` UPDATE; carries who-revoked + reason.

### Sub-decision 9 — INVARIANTS amendment

**Decision shape:** at SI-024 Phase 4 cutover, INVARIANTS bumps with new I-036:

> **I-036 — Canonical hardened tenant/platform-context resolution.** All RLS predicates resolving tenant_id or platform-context from session state MUST invoke the canonical hardened helpers `current_tenant_id_strict()` and `is_platform_operator_break_glass_active()`. Direct use of `current_setting('app.tenant_id')` or `current_setting('app.platform_operator_break_glass')` in RLS predicates is FORBIDDEN post-Phase 4 cutover. New CDM amendments authoring RLS policies MUST use the canonical helpers from the start.

---

## 3. Cross-SI alignment

| Cross-SI surface | SI-024 surface | Relationship |
|---|---|---|
| P-023a SI-010 rejection | Sub-decision 2 Option B-3 documented as REJECTED | SI-024 honors the P-023a precedent; Option B-3 is for completeness only |
| P-028a Option A chain-schema tenant-isolation | Sub-decision 3 Phase 2/4 covers CDM v1.5 amendment chain tables | OQ6 cross-CDM deferral resolved here |
| P-029 CDM v1.5 amendment cycle | Sub-decision 3 Phase 4 cutover for `audit_event_hash_chain` + 3 sibling chain tables | OQ6 deferral closure |
| Sprint 13 KMS Architecture | Sub-decision 2 Option B-2 requires Sprint 13 KMS infrastructure for JWT verification key | Coordination if B-2 selected |
| Sprint 18 RBAC v1.2 | Sub-decision 5 break-glass role set must match Sprint 18 role grants | Role-set canonical source |
| CDM v1.5 + every v1.5 PHI-bearing entity | Sub-decision 3 corpus-wide migration | Cross-corpus scope |
| INVARIANTS v5.5 → v5.6 (post-SI-024) | Sub-decision 9 new I-036 | Platform-floor invariant addition |

---

## 4. Open questions for ratifier (own ceremony)

1. **OQ1 — Trust-anchor selection (Sub-decision 2).** Recommendation: **Option B-1 (middleware-GUC with role-binding hardening)** for v1.0; Option B-2 (cryptographic JWT-claim) queued for SI-024.1 follow-on cycle if defense-in-depth depth = 2 is required pre-GA. Option B-3 rejected per P-023a.
2. **OQ2 — Phase 4 cutover sequencing.** Recommendation: per-entity rollout in dependency order (audit-chain projection tables LAST since they're cross-cutting; tenant-bound PHI entities FIRST since they have the highest exposure). Ratifier confirms.
3. **OQ3 — Phase 3 telemetry window duration.** Recommendation: 30 days minimum + per-tenant launch-readiness verification per Sprint 17 P-15.
4. **OQ4 — Break-glass role-set enumeration (Sub-decision 5).** Recommendation: 3 roles (`platform_operator_break_glass` + `platform_operator_dr_recovery` + `platform_operator_compliance_audit`). Ratifier confirms vs. consolidation to fewer roles.
5. **OQ5 — I-036 platform-floor invariant (Sub-decision 9) — timing.** Recommendation: **I-036 lands at INVARIANTS v5.5 co-bumped with the FIRST Phase 4 entity cutover, NOT at SI-024 v1.0 ratification.** This avoids declaring an invariant that no entity yet satisfies. **Pre-merge MED closure 2026-05-20:** the SI-024 v1.0 merge ceremony (P-030 + Registry v2.16 → v2.17 content-change promotion) does NOT include INVARIANTS bump. INVARIANTS bump is queued as a separate co-bump with first Phase 4 entity cutover (post-merge milestone). This aligns sources: the SI body, OQ5 timing, and the merge ceremony all reference Phase 4 as the I-036 trigger.
6. **OQ6 — Codex pre-ratification target.** Recommendation: 3-4 rounds under two-pass discipline (per CLAUDE.md `16d7244` standard cadence; OQ-I quantum-resistance roadmap precedent).
7. **OQ7 — Application-middleware contract.** Recommendation: SI-024 specifies the SQL-layer contract; the Track 2 application-middleware implementation files a separate spec stipulating how the middleware satisfies the contract. The middleware spec is OUT-OF-SCOPE for SI-024 promotion; SI-024 promotion does NOT block on it.
8. **OQ-NEW1 — SI-024.1 cryptographic-binding follow-on ratifier date/owner (R1 CRITICAL-2 closure 2026-05-20).** Recommendation: SI-024 v1.0 promotion is CONDITIONAL on Evans committing to a SI-024.1 ratifier date + owner-triad. Suggested commitment: SI-024.1 v0.1 DRAFT authored within 30 days of SI-024 v1.0 promotion; ratifier ceremony within 90 days. Without this commitment, SI-024 v1.0 should NOT be promoted — the residual compromised-middleware-credential risk is too high to leave open indefinitely.
9. **OQ-NEW2 — Phase 4 cutover gating on SI-024.1 readiness (R1 CRITICAL-2 closure 2026-05-20).** Recommendation: Phase 4 cutover of SI-024 v1.0 (removing raw-GUC permissive policy; hardened helper becomes sole canonical enforcement) gates on SI-024.1 ratification + implementation. RATIONALE: Phase 4 commits the corpus to the role-constrained-GUC pattern as canonical floor; if SI-024.1 ratifies cryptographic binding mid-Phase-4, the SI-024 v1.0 RLS policies would need a second migration. Better to align: complete SI-024 v1.0 Phases 1-3 (foundation + RESTRICTIVE coexistence + telemetry) WHILE SI-024.1 is being authored + ratified; cutover (Phase 4) when SI-024.1 lands and its cryptographic binding is integrated into the helper.

---

## 5. Codex pre-ratification status

**v1.0 v0.1 DRAFT 2026-05-20:** pre-Codex-review; authored under auto-proceed continuation per CLAUDE.md `f483535`.

**v0.1 R1 Pass-1 + Pass-2 closure 2026-05-20:** 2 CRITICAL + 2 HIGH closed inline (Pass-2 synthesis: scope-narrowing on CRITICAL-2 is legitimate inline closure, not hard-floor item 6).

| Round | Findings | Status |
|---|---|---|
| R1 Pass-1 | CRITICAL-1 SECURITY DEFINER current_user gates on definer not caller; CRITICAL-2 Option B-1 doesn't close compromised-middleware-credential threat; HIGH-1 dual-policy migration doesn't enforce intersection (PG RLS policies OR-combine by default); HIGH-2 break-glass policy only allows platform-sentinel rows | All 4 surfaced |
| R1 Pass-2 synthesis | Confirmed CRITICAL-1 + HIGH-1 + HIGH-2 inline-closeable per Claude classification; **DIVERGED on CRITICAL-2**: Claude classified as hard-floor item 6 (B-2 promotion would be net-new architecture); Pass-2 reframed as inline-closeable via scope-narrowing — narrowing the SI's own scope claim is NOT hard-floor item 6 (only B-2 promotion would be). Synthesis: hybrid C path (narrow scope + queue SI-024.1) is the legitimate inline closure. | All 4 closed inline |

**R1 closure pattern recap:**

- **CRITICAL-1 (closed inline):** helpers changed from `SECURITY DEFINER` to `SECURITY INVOKER`. `current_user` now correctly reports the actual caller's role under INVOKER semantics (not the function owner). Search_path hardening preserved via `SET search_path = pg_catalog, public`. Negative-path test specified in Sub-decision 7 to validate that non-allowlisted roles cannot pass.
- **CRITICAL-2 (closed inline via scope-narrowing — Pass-2 synthesis Option C hybrid):** problem statement narrowed: SI-024 v1.0 closes the **direct-DB-role spoofing** class only; does NOT claim to close compromised-middleware-credential spoofing. Threat-model coverage matrix added making the residual risk explicit. Promotion of SI-024 v1.0 CONDITIONAL on Evans committing to SI-024.1 ratifier date/owner (new OQ-NEW1). Phase 4 cutover gating on SI-024.1 readiness (new OQ-NEW2) avoids two-migration churn.
- **HIGH-1 (closed inline):** Phase 2 RLS policy changed to `CREATE POLICY ... AS RESTRICTIVE` so the new policy intersects (AND-combines) with the existing permissive raw-GUC policy. Canonical Phase 2 DDL pattern documented. Integration test required before Phase 4 cutover validating the intersection semantics in production.
- **HIGH-2 (closed inline):** new Sub-decision 5a authoring target-tenant break-glass binding. `break_glass_approval` table with dual-control authorization + time-bound (4-hour max) + revocation. New helper `is_target_tenant_break_glass_active(target_tenant_id)` checks: caller's role is platform_operator + active approval row exists for (operator_role, operator_user_id, target_tenant_id). Canonical RLS policy revised to call the new helper. 2 new audit events (`target_tenant_break_glass_invoked` + `break_glass_approval_created` + `break_glass_approval_revoked`).

**Pass-2 verdict:** the closure path is converged between Claude + Pass-2 (synthesis). Both agree on the next concrete step: inline closures + OQ-NEW1/2 for SI-024.1 follow-on. **Auto-proceed per CLAUDE.md `f483535`**: Claude executes the closures inline; surfaces three-way as informational post-action report.

**Discipline observation:** Pass-2 refined Claude's hard-floor item 6 classification of CRITICAL-2. Claude treated "B-2 promotion to v1.0" as the only possible response to CRITICAL-2; Pass-2 showed that scope-narrowing of the SI's own claim is a third option that is NOT hard-floor item 6 (the discriminator is "net-new architecture" — narrowing scope adds no architecture). This is exactly the kind of framing-defect catch the two-pass discipline is designed to surface. Pass-1's independent finding + Pass-2's synthesis together produced a closure path Claude alone would have escalated unnecessarily.

**R2 verification queued.** Codex re-invocation in standard adversarial-review framing on the v0.2 (post-R1-closures) state.

**v0.3 R2 closure 2026-05-20:** 2 HIGH + 1 MED closed inline.

| Round | Findings | Status |
|---|---|---|
| R2 | **HIGH-1** break_glass_approval lookup non-functional under FORCE RLS + SECURITY INVOKER (caller may lack SELECT or be blocked by RLS); **HIGH-2** Phase 2 RESTRICTIVE policy raises exception when platform_operator_* roles invoke `current_tenant_id_strict()` (no membership in middleware-writer set → role-check RAISE → aborts entire RLS predicate); **MED** role-allowlist via `current_user` literal equality breaks under role-inheritance / SET ROLE / connection-pool scenarios | All 3 closed inline |

**R2 closure pattern recap:**

- **HIGH-2 (closed inline first because HIGH-1 depended on its closure pattern):** `current_tenant_id_strict()` now **returns NULL** when caller lacks middleware-writer membership (instead of `RAISE EXCEPTION`). NULL = anything in PostgreSQL returns UNKNOWN which RLS treats as FALSE for policy admission — so the tenant-equality predicate is fail-closed for non-middleware roles. The break-glass branches (`is_target_tenant_break_glass_active()` + sentinel) can now evaluate independently without the OR predicate being aborted by an exception. GUC-unset case still raises (legitimate middleware-writer with unset GUC is a bug; fails loudly per existing policy).
- **HIGH-1 (closed inline):** `is_target_tenant_break_glass_active()` changed to `SECURITY DEFINER` owned by a dedicated `sec_break_glass_lookup` role that has SELECT on `break_glass_approval` + RLS policy permitting its reads. Caller identity captured via `session_user` BEFORE the DEFINER context swap (so the role-check correctly identifies the actual caller's session role, not the DEFINER owner). `search_path` hardening preserved. Explicit `break_glass_approval` access model documented: Policy 1 grants `sec_break_glass_lookup` full SELECT for the helper's EXISTS lookup; Policy 2 grants Compliance Officer + CTO access to approvals they authorized + ability to revoke; Policy 3 grants operator self-service SELECT on their own active approvals. Append-only trigger on `break_glass_approval` prevents tampering (only `revoked_at` transitions NULL → timestamp are permitted).
- **MED (closed inline):** all role-membership checks now use `pg_has_role(current_user, 'role_name', 'USAGE')` instead of `current_user = 'role_name'` literal equality. This covers (a) middleware connection pools where the LOGIN role is granted `app_middleware_writer` MEMBERSHIP (membership is transitive; `pg_has_role` returns TRUE); (b) explicit `SET ROLE` usage; (c) role-inheritance chains. Convention documented: middleware-writer membership MUST be disjoint from direct-PHI-grant set (deployment audit requirement to prevent threat-model bypass).

**Cumulative cycle metrics:**
- R1-R2: 2 CRITICAL + 4 HIGH + 1 MED = **7 findings closed** across 2 rounds.
- **0 hard-floor item 6 violations.**
- **0 ERR escalations** (Pass-2 framing-defect catch at R1 saved one unnecessary escalation).
- **1 cross-CDM deferral** (SI-024.1 cryptographic-binding follow-on per OQ-NEW1/2).

**R3 verification queued.** Per OQ6 working recommendation 3-4 rounds, R3 should converge or surface only minor residual.

**v0.4 R3 closure 2026-05-20:** 2 HIGH closed inline.

| Round | Findings | Status |
|---|---|---|
| R3 | **HIGH-1** `session_user` in SECURITY DEFINER captures the LOGIN role, not the post-SET-ROLE effective role (contradicts pg_has_role convention claiming SET ROLE support; emergency DR/compliance access can be denied for pooled-operator pattern); **HIGH-2** authorizer policy `FOR ALL WITH CHECK (TRUE)` permits arbitrary `revoked_at` mutation; the promised `revoked_at` transition trigger was prose-only, not canonical DDL | Both closed inline |

**R3 closure pattern recap:**

- **HIGH-1 (closed inline — split-helper pattern):** `is_target_tenant_break_glass_active()` SPLIT into INVOKER outer wrapper + DEFINER inner privileged-lookup. Under INVOKER, `current_user` correctly reports the post-`SET ROLE` effective role of the caller (PostgreSQL semantics: `current_user` follows SET ROLE in INVOKER mode but reports the function OWNER in DEFINER mode). The outer wrapper does role-membership check via `pg_has_role(current_user, ...)` on the effective role + extracts human-id from session GUC + calls the DEFINER inner function passing the verified effective_role + human_id as parameters. The inner DEFINER function (owned by `sec_break_glass_lookup`) trusts those parameters and performs the privileged `break_glass_approval` lookup. SET-ROLE / connection-pool patterns now work correctly because `current_user` in INVOKER mode is the post-SET-ROLE effective role.
- **HIGH-2 (closed inline — canonical DDL):** `revoked_at`-transition trigger authored as canonical DDL (no longer prose-only). Trigger enforces three rules: (a) `OLD.revoked_at IS NOT NULL → reject ANY change` (immutable once revoked); (b) `NEW.revoked_at IS NULL` → reject (no NULL → NULL noop UPDATE); (c) `NEW.revoked_at` must be within ±60s of `now()` (no timestamp rewrites). Authorizer policy split from `FOR ALL WITH CHECK (TRUE)` into `FOR SELECT` + `FOR UPDATE` with explicit `WITH CHECK` preserving authorization-identity invariants. Result: `break_glass_approval` is effectively WORM (write-once-read-many) with a single sanctioned mutation path (revocation by an authorized officer, one-way, current-timestamp-bound).

**0 hard-floor item 6 violations** on R3. Both findings were in-scope correctness/PostgreSQL-semantics fixes to R2-introduced surface.

**Cumulative cycle metrics:**
- R1-R3: **9 findings closed** (2 CRITICAL + 6 HIGH + 1 MED) across 3 rounds.
- 0 hard-floor item 6 violations.
- 0 ERR escalations (Pass-2 framing-defect catch at R1 saved one).
- 1 cross-CDM deferral (SI-024.1 cryptographic-binding follow-on per OQ-NEW1/2).

**R4 verification queued.** Per OQ6 working recommendation 3-4 rounds, R4 should be the boundary (convergence or only-minor-residual).

**v0.5 R4 closure 2026-05-20 (§10-cadence boundary):** 1 HIGH closed inline.

| Round | Findings | Status |
|---|---|---|
| R4 | **HIGH** R3 split-helper pattern had a direct-invocation bypass — `_internal_check_break_glass_approval` granted EXECUTE to PUBLIC let any SQL role call it directly with forged identity parameters, defeating the outer wrapper's role-membership + human-id checks | Closed inline |

**R4 closure pattern recap:**

- **HIGH (closed inline — consolidated single-DEFINER design):** R3 split-helper REPLACED with single SECURITY DEFINER function using EXECUTE-GRANT as the trust anchor. The function is GRANTed EXECUTE ONLY to the three platform-operator roles; PostgreSQL's EXECUTE check is performed against the caller's POST-`SET ROLE` effective role, so the EXECUTE-gate catches the post-SET-ROLE effective role correctly. The function does NOT trust caller-supplied parameters (only takes `target_tenant_id` from RLS context); reads `caller_human_id` from `app.actor_human_id` session GUC (populated by middleware post-JWT-verification). Approvals matched by `(target_tenant_id, operator_user_id, active-window)` — does NOT bind to a specific `operator_role` at lookup time (acknowledged v1.0 simplification; SI-024.1 cryptographic JWT-binding closes this by carrying the verified role-claim in the JWT). Negative-path test required: SQL role not in platform-operator membership set receives `permission denied for function` when attempting direct invocation, proving the EXECUTE-grant trust-anchor mechanism is active.

**Status at R4 close (§10-cadence boundary):** **RATIFIER-READY-AT-§10-CADENCE-BOUNDARY**. Per OQ6 working recommendation of 3-4 rounds for this mechanical-hardening amendment cycle, R4 IS the §10-cadence boundary. Per SI-021's R5-precedent (close at the boundary regardless of residual findings), SI-024 closes at R4. Any residual findings become known OQs for SI-024.1 cycle.

**Cumulative cycle metrics (final):**
- R1-R4: **10 findings closed** (2 CRITICAL + 7 HIGH + 1 MED) across 4 rounds.
- 0 hard-floor item 6 violations.
- 0 ERR escalations (Pass-2 framing-defect catch at R1 saved one).
- 1 cross-CDM deferral (SI-024.1 cryptographic-binding follow-on per OQ-NEW1/2).
- 8 acknowledged v1.0 simplifications:
  - Compromised middleware-credential spoofing NOT closed (scope-narrowed at R1; SI-024.1 closes via JWT signature verification).
  - Approval matching by human_id only, not by specific operator_role (R4 simplification; SI-024.1 closes via JWT role-claim).
  - Middleware-writer membership MUST be disjoint from direct-PHI-grant set (deployment audit requirement).
  - app.actor_human_id session GUC trusted as middleware-populated post-JWT (SI-024.1 closes via cryptographic binding).
  - SET ROLE convention: connection pools may use either LOGIN-role-with-membership or explicit SET ROLE (both supported via pg_has_role).
  - break_glass_approval table is WORM with single sanctioned mutation path (revoked_at NULL → current-timestamp, one-way).
  - Phase 4 cutover gated on SI-024.1 readiness (per OQ-NEW2).
  - **#8 (added at pre-merge cycle-2 HIGH-2 closure 2026-05-20):** per-invocation audit emission on `is_target_tenant_break_glass_active()` TRUE result is DEFERRED to SI-024.1 (STABLE function constraint prevents side-effecting audit INSERTs from RLS predicate). SI-024 v1.0 audit trail comes from `break_glass_approval_created` + `break_glass_approval_revoked` events; per-access audit will use an explicit `begin_target_tenant_break_glass_session()` SECURITY DEFINER procedure introduced in SI-024.1.

**Next gates (corrected at pre-merge cycle-2 MED closure 2026-05-20 to align with OQ5 deferral):**
- Pre-merge two-pass consult per CLAUDE.md `16d7244` (canonical for ratifier-question gates).
- **Merge ceremony artifacts:** Promotion Ledger P-030 + Artifact Registry v2.16 → v2.17 (content-change promotion). **INVARIANTS v5.4 → v5.5 (I-036) is EXPLICITLY DEFERRED to the first Phase 4 entity cutover per OQ5** — NOT lockstep with SI-024 merge. This avoids declaring I-036 as canonical floor before any entity satisfies it.
- Phase 1 (foundation) implementation begins post-merge in `telecheck-app` code repo: helper functions + `break_glass_approval` table + RLS policies created; helpers coexist with raw GUC (no entity migrations yet).
- Phase 2 (RESTRICTIVE coexistence) per-entity rollout in Sub-decision 3 sequence (tenant-bound PHI entities first; audit-chain projection tables last per OQ2).
- Phase 3 (30-day telemetry per OQ3) collecting hardened-helper invocations + spoofing-attempt audit events.
- Phase 4 (cutover) per-entity in OQ2 sequence — **THIS is when I-036 lands at INVARIANTS v5.5 co-bumped with the first Phase 4 entity**.
- SI-024.1 cryptographic JWT-binding follow-on cycle (OQ-NEW1/2 + acknowledged simplification #8 per-invocation audit emission).

Authored on `spec/si-024-hardened-tenant-platform-rls-helper-2026-05-20` branch off main at `5afdc82` (post-P-029 + Addendum 57 cockpit refresh).

---

— Claude (Opus 4.7, 1M context), SI-024 v0.1 DRAFT authored 2026-05-20 per auto-proceed continuation (CLAUDE.md commit `f483535`) of the OQ6 cross-CDM deferral from P-029 Pass-2 conditions §2. Per Evans's standing-authorization directive, Claude continues critical-path work without explicit per-cycle confirmation. Pass-1 source-first independent review queued as next action.
