# SI-024 — Canonical Hardened Tenant/Platform RLS Helper Pattern

**Version:** 1.0 v0.1 DRAFT
**Status:** PRE-CODEX (awaiting Pass-1 source-first independent review per CLAUDE.md two-pass discipline)
**Authoring date:** 2026-05-20
**Trigger:** OQ6 cross-CDM deferral from CDM v1.5 amendment cycle (P-029 Pass-2 conditions §2 + Codex cycle-3 deferral approval). SI-024 closes the deferred hardened-helper question at corpus-wide scope.
**Owner:** SRE Lead + Security Engineering Lead + CDM owner
**Parent SIs / precedents:** P-023a (SI-010 trust-anchor rejection — establishes "canonical floor is middleware-GUC after SI-010 rejection"); P-028a (Option A chain-schema tenant-isolation mini-review — first SI to address tenant-isolation discipline post-SI-010); P-029 (CDM v1.5 SI-021 follow-on amendment — first SI to introduce FORCE ROW LEVEL SECURITY + WITH CHECK + fail-closed `current_setting('app.tenant_id', false)` hardening at table level without the cross-corpus helper).
**Companion documents:** Codex Pass-1 R5 finding "tenant RLS still trusts caller-settable session state" (CDM v1.5 amendment cycle); CLAUDE.md commits `f3a6469` + `4f42a00` + `16d7244` + `f483535` (dual-recommendation + two-pass + auto-proceed process novelties).

---

## 1. Purpose + scope

**Problem statement:** the canonical v1.10-era tenant-isolation pattern across all PHI-bearing CDM entities is:

```sql
CREATE POLICY <table>_tenant_isolation ON <table>
    USING (tenant_id = current_setting('app.tenant_id')::VARCHAR);
```

PostgreSQL custom GUCs (`app.tenant_id`, `app.platform_operator_break_glass`) are **session-settable by any role that can issue SQL** unless explicitly constrained. A compromised application-tier credential OR a database role with direct table grants can set the GUC to satisfy RLS and read/write outside its real tenant context. This is a corpus-wide trust-boundary weakness that affects every PHI-bearing entity in CDM v1.5 (75 entities + the audit-chain projection tables).

**SI-024 authors the canonical hardened tenant/platform RLS helper pattern** to replace raw `current_setting()` predicates across the entire canonical schema. The pattern hardens the trust boundary by binding tenant-identity to a verified middleware-context-binding mechanism rather than caller-settable GUCs.

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

**Decision shape:** define canonical SQL functions for tenant-identity resolution + platform-operator break-glass detection:

```sql
-- Canonical hardened helper for tenant_id resolution.
-- Returns: tenant_id_t of the current session's verified tenant context, OR raises exception.
-- Trust-anchor: see Sub-decision 2.
-- Performance: stable function, query-result-cacheable per execution context.
CREATE FUNCTION current_tenant_id_strict() RETURNS tenant_id_t AS $$
DECLARE
    resolved_tenant_id tenant_id_t;
BEGIN
    -- Implementation per Sub-decision 2's selected trust-anchor pattern.
    -- For Option B-1 (middleware-GUC with role-binding hardening):
    --   IF current_user IS NOT IN (the set of roles permitted to set app.tenant_id):
    --     RAISE EXCEPTION 'tenant context not bound (current_user=% lacks tenant-context-write authority)', current_user
    --     USING ERRCODE = 'insufficient_privilege';
    --   END IF;
    --   resolved_tenant_id := current_setting('app.tenant_id', false)::tenant_id_t;
    --   RETURN resolved_tenant_id;
    -- For Option B-2 (JWT-claim-derived GUC with cryptographic-binding):
    --   See Sub-decision 2.
    RAISE EXCEPTION 'current_tenant_id_strict() implementation pending Sub-decision 2 ratification'
        USING ERRCODE = 'feature_not_supported';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;

-- Canonical break-glass detection.
-- Returns: TRUE iff session is operating under a platform-operator break-glass context.
-- Trust-anchor: role-based (current_user IN platform_operator_break_glass_role_set).
-- Never relies on caller-settable GUC alone.
CREATE FUNCTION is_platform_operator_break_glass_active() RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_user IN (
        'platform_operator_break_glass',
        'platform_operator_dr_recovery',
        'platform_operator_compliance_audit'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public;
```

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
2. **Phase 2 (additive policy):** for each PHI-bearing entity, ADD a parallel RLS policy using the hardened helper, leaving the existing raw-GUC policy active. Reads/writes must satisfy BOTH (intersection semantics; CREATE POLICY semantics use OR by default — see implementation note). This ensures the hardened helper is exercised in production WITHOUT removing the existing safety net.
3. **Phase 3 (telemetry):** run the dual-policy state for a tenant-launch-readiness window (suggested 30 days per Sprint 17 cadence) collecting telemetry on hardened-helper invocations + any spoofing-attempt audit events.
4. **Phase 4 (cutover):** for each entity, DROP the raw-GUC RLS policy; the hardened-helper policy becomes the sole canonical enforcement.
5. **Phase 5 (deprecation):** raw `current_setting('app.tenant_id')` predicates are forbidden in new CDM amendments post-Phase 4. INVARIANTS bumped to add I-036 ("RLS predicates MUST use the canonical hardened helper functions; raw `current_setting()` is forbidden for tenant/platform-context resolution").

### Sub-decision 4 — Backward-compatibility + coexistence

**Decision shape:** during Phases 1-3, raw `current_setting()` predicates coexist with the hardened helper. Phase 4 cutover is per-entity, not corpus-wide atomic. CDM v1.5 amendment-cycle chain tables (audit_event_hash_chain + 3 siblings) participate in the same migration on their own per-entity timeline; OQ6 in the CDM v1.5 amendment §6 is resolved by SI-024 ratification + Phase 4 cutover for those tables.

### Sub-decision 5 — Break-glass posture

**Decision shape:** platform-operator break-glass uses `is_platform_operator_break_glass_active()` role-based check (Sub-decision 1 helper). The session-GUC `app.platform_operator_break_glass` referenced in CDM v1.5 amendment §4.NEW1-4 RLS policies is **DEPRECATED at Phase 4 cutover**. All future break-glass access uses dedicated `platform_operator_*` roles per Sub-decision 1's role-set enumeration. Cross-tenant break-glass access still requires I-024 platform-floor approval (operator-gated; not auto-proceedable per CLAUDE.md hard-floor item 5).

### Sub-decision 6 — Performance + caching

**Decision shape:** helpers are `STABLE` so PostgreSQL caches results per execution context. Per-query overhead expected < 100ns on modern hardware (function-call + role-check). RLS policy invocations inline the helper into the query plan; no per-row helper call. Telemetry from Phase 3 validates the assumption.

### Sub-decision 7 — Test coverage

**Decision shape:** negative-path test suite required for SI-024 promotion:

- Test 1: `app_middleware_writer` role can set GUC + helper returns the bound value.
- Test 2: Role NOT in the allowlist cannot pass the helper's role-check (raises `insufficient_privilege`).
- Test 3: Setting GUC `app.platform_operator_break_glass = 'true'` from a non-`platform_operator_*` role does NOT trigger break-glass clause.
- Test 4: Cross-tenant read attempt by a compromised `app_middleware_writer` setting GUC to victim tenant_id — RLS still enforces the helper's verified context (if Option B-2 with cryptographic binding) OR demonstrates the residual risk (if Option B-1).
- Test 5: SECURITY DEFINER + `search_path` discipline — helper invocation under attacker-controlled `search_path` does not redirect to attacker-controlled tables.

### Sub-decision 8 — Audit event taxonomy

**Decision shape:** new audit events under `tenant_context.*` namespace (added to AUDIT_EVENTS at SI-024 promotion):

- `tenant_context.hardened_helper_role_check_rejected` (Cat A; P2 keyed by 'platform') — fires when `current_tenant_id_strict()` rejects a non-allowlisted role.
- `tenant_context.platform_operator_break_glass_invoked` (Cat A; P2 keyed by 'platform') — fires when `is_platform_operator_break_glass_active()` returns TRUE.
- `tenant_context.guc_set_without_role_authority_attempt` (Cat A; P2 keyed by 'platform') — fires when a role lacking write-authority attempts to SET `app.tenant_id` (requires PostgreSQL session-trigger or event-trigger to detect; implementation deferred to Sub-decision 9).
- `tenant_context.cross_tenant_read_blocked_by_hardened_helper` (Cat A; P2 keyed by 'platform') — fires when the hardened-helper policy blocks a read that would have been permitted under raw GUC (telemetry for Phase 3 dual-policy state).

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
5. **OQ5 — I-036 platform-floor invariant (Sub-decision 9) — timing.** Recommendation: I-036 lands at INVARIANTS v5.6 co-bumped with the FIRST Phase 4 entity cutover, not at SI-024 ratification itself (avoids declaring an invariant that no entity yet satisfies).
6. **OQ6 — Codex pre-ratification target.** Recommendation: 3-4 rounds under two-pass discipline (per CLAUDE.md `16d7244` standard cadence; OQ-I quantum-resistance roadmap precedent).
7. **OQ7 — Application-middleware contract.** Recommendation: SI-024 specifies the SQL-layer contract; the Track 2 application-middleware implementation files a separate spec stipulating how the middleware satisfies the contract. The middleware spec is OUT-OF-SCOPE for SI-024 promotion; SI-024 promotion does NOT block on it.

---

## 5. Codex pre-ratification status

**v1.0 v0.1 DRAFT 2026-05-20:** pre-Codex-review; awaiting Pass-1 source-first independent review per CLAUDE.md `16d7244` two-pass discipline.

Authored on `spec/si-024-hardened-tenant-platform-rls-helper-2026-05-20` branch off main at `5afdc82` (post-P-029 + Addendum 57 cockpit refresh).

---

— Claude (Opus 4.7, 1M context), SI-024 v0.1 DRAFT authored 2026-05-20 per auto-proceed continuation (CLAUDE.md commit `f483535`) of the OQ6 cross-CDM deferral from P-029 Pass-2 conditions §2. Per Evans's standing-authorization directive, Claude continues critical-path work without explicit per-cycle confirmation. Pass-1 source-first independent review queued as next action.
