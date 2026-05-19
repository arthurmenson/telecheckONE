# SI-017 — Identity & Authentication Specification v1.0 → v1.1 Amendment

**Version:** 0.1 DRAFT
**Status:** Pre-Codex-pre-ratification; Sprint 8 of autonomous 24h-loop work plan
**Authoring location:** `Telecheck_v1_10_PRD_Update/` (workstream folder; spec-corpus Track 1 + Track 5 deliverable)
**Target canonical surface:** `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Identity_Authentication_Spec_v1_0.md` (to be bumped to v1.1 at ratifier-promotion)
**Companion documents:** Cold-DR Runbook v0.1 DRAFT (Sprint 7); SI-018 two-tier hybrid audit-chain partition (ratified 2026-05-19); P-018a/P-019a/P-021a procedure-side STEP 0 amendments (ratified 2026-05-19); SC6 P-023a SI-010 rejection (audit trail at PR #11 merge 1b49db7)
**Authority:** ratifier-targetable amendment scope for the canonical Identity Spec; sub-decisions enumerated in §3 below.

---

## 1. Purpose + scope

This amendment integrates **two ratified architectural shifts** into the canonical Identity & Authentication Specification:

1. **SI-017 canonical content port** — Phase 2 F-3 JWT session-liveness check anchored within the canonical `app.tenant_id` middleware-GUC model. Ratified 2026-05-19 via Sub-decision 4.5 (A2+B2+C) including Cat A audit event `identity.session_jwt_tenant_id_mismatch` and merge-blocking Test 7.X.
2. **I-032 STEP 0 SECURITY DEFINER pattern** — Tenant-GUC equality guard ratified as a new platform-floor invariant 2026-05-19. INVARIANTS v5.2→v5.3 + AUDIT_EVENTS v5.3→v5.5 + procedure-side amendments on P-018a/P-019a/P-021a all landed in the canonical content port lockstep commit. This amendment integrates the Identity-Spec-side surface: how the middleware sets `app.tenant_id`, how the JWT session-liveness check feeds the GUC, and how the mismatch-path audit event interacts with the I-032 invariant guard.

**Out of scope (deferred):**
- SI-010 session actor-context DB binding (REJECTED via P-023a; trust-anchor infrastructure withdrawn). This amendment uses the canonical-middleware-GUC model directly; no DB-side session-actor table introduced.
- Multi-region session replication topology (overlap with Cold-DR Runbook OQ7 implementation-primitive selection; out of scope for Identity Spec proper).
- SSO / SAML / OAuth-broker integration (Phase 3+; not v1.1).

---

## 2. Amendment-delta summary (for reviewers scanning v1.0 vs v1.1)

| v1.0 section | v1.1 amendment | Driver |
|---|---|---|
| §3.3 Token architecture | Amended to add `tenant_id` claim + middleware-GUC binding rules | SI-017 canonical content port |
| §3.6 (NEW) Tenant-GUC middleware-resolved binding | NEW section | SI-017 canonical content port |
| §3.7 (NEW) JWT session-liveness check | NEW section (Phase 2 F-3 + Sub-decision 4.5 mismatch path) | SI-017 Sub-decision 4.5 ratified |
| §3.8 (NEW) Session-revocation propagation | NEW section | SI-017 Phase 2 F-3 + Sub-decision 4.5 mismatch-path interaction |
| §4.2 Clinician session | Amended re-authentication clause to reference I-032 guard for prescribing actions | I-032 invariant ratification |
| §6 Operator and admin authentication | Amended to require tenant-GUC binding (operators MAY operate in platform-scope only when explicitly required; never in tenant-scope without an explicit `app.tenant_id` set) | I-032 + I-024 cross-tenant break-glass |
| §9 Audit | NEW events: `identity.middleware_guc_set` (Cat C high-volume sampled), `identity.patient_session_revoked` (Cat A P1), `identity.clinician_session_revoked` (Cat B P2), `identity.operator_session_revoked` (Cat B P2), `identity.tenant_session_revocation_cascade` (Cat B P2 summary), `identity.tenant_session_revocation_batch_completed` (Cat B P2 per-batch progress), `identity.dr_failover_session_freeze_cascade` (Cat B P2 summary), `identity.session_jwt_tenant_id_mismatch` (Cat A P1), `identity.session_liveness_check_failed_*` (Cat C), `identity.security_definer_tenant_guc_mismatch` (Cat A P2 platform-floor), `identity.operator_mode_switched` (Cat B P2). Classification split by actor type per R1 MED-2 closure. | SI-017 + I-032 + SI-018 partition rule |
| §11 (NEW) I-032 STEP 0 contract for SECURITY DEFINER call sites | NEW section | I-032 invariant ratification |
| §12 (NEW) Open questions for ratifier | NEW section | Sprint 8 ratifier-targetable scope |

No section is **removed**. v1.0 content is preserved; v1.1 adds the SI-017 + I-032 surface alongside.

---

## 3. Sub-decisions (ratifier-targetable units)

The amendment is decomposed into 6 sub-decisions, each independently ratifier-targetable.

### Sub-decision 1 — Middleware-resolved `app.tenant_id` GUC binding contract (SI-017 canonical content port surface for Identity Spec)

**Decision shape:** Every authenticated request flowing through the Telecheck application MUST pass through a single canonical middleware that:

1. Parses + verifies the JWT signature.
2. Performs the JWT session-liveness check (Sub-decision 2 below).
3. Resolves the `tenant_id` from the JWT claim.
4. Sets `app.tenant_id` via `SET LOCAL app.tenant_id = $1` for the connection's open transaction BEFORE any application code or DB query executes.
5. Emits a Cat C audit event `identity.middleware_guc_set` (high-volume; sampled per AUDIT_EVENTS Cat C policy) with the tenant_id, session_id, request_id, and middleware-version trail.

**Why middleware-resolved (canonical) instead of every-handler-resolves:**

- The application has exactly one entry point per request type (HTTP middleware, gRPC interceptor, background-worker dispatcher). Per-handler resolution proliferates the binding logic to N+1 surfaces; middleware-resolution keeps it at one surface auditable in code review.
- The I-032 invariant guard (Sub-decision 5) verifies tenant-GUC equality at the DB-procedure boundary; this provides defense-in-depth — if middleware fails or is bypassed, I-032 fires.
- Aligns with the canonical-middleware-GUC model adopted in P-018a/P-019a/P-021a procedure-side amendments (ratified 2026-05-19).

**Binding boundary:** the middleware sets `app.tenant_id` per **transaction-scoped** GUC (SET LOCAL), not session-scoped. This means:
- The GUC is auto-cleared at COMMIT/ROLLBACK.
- A subsequent request on the same connection must re-set the GUC via its own middleware pass.
- A misuse where one request's tenant_id leaks into another's transaction is structurally impossible because SET LOCAL scopes to the transaction.

**Enforceable entry-point enumeration (R1 HIGH-3 closure):**

The canonical enforcement model has FIVE layers (defense-in-depth):

1. **Application-layer (canonical middleware):** HTTP middleware (Fastify hook), gRPC interceptor, background-worker dispatcher (BullMQ wrapper), CLI tooling wrapper, migration runner wrapper. Every entry point MUST be one of these five paths. The canonical helper for non-HTTP paths is `@telecheck/auth-core/with_tenant_scope.ts` (location pinned at code-repo bootstrap per OQ3; the helper accepts a tenant_id parameter + a callback + opens a transaction with `SET LOCAL app.tenant_id = $1` before invoking the callback).

2. **PostgreSQL RLS (primary defense):** every PHI table has an RLS policy that requires `tenant_id = current_setting('app.tenant_id')` for SELECT/INSERT/UPDATE/DELETE. The RLS policy is enforced at the row-fetch boundary, regardless of how SQL reached the table (procedure, raw query, ORM). RLS is the primary protection; the middleware-GUC contract is the canonical SOURCE of the GUC; I-032 STEP 0 is defense-in-depth on SECURITY DEFINER procedures specifically.

3. **I-032 STEP 0 on SECURITY DEFINER procedures:** any procedure marked SECURITY DEFINER that touches PHI MUST include the canonical STEP 0 block per Sub-decision 5 below.

4. **Static-analyzer check (canonical CI gate `tenant-scope-binding`):** the CI pipeline runs a static analyzer that:
   - Parses every TypeScript/SQL file at PR open.
   - Identifies every PHI-table access (SELECT/INSERT/UPDATE/DELETE/EXECUTE).
   - Verifies each access path is downstream of either (a) the canonical HTTP middleware, (b) a gRPC interceptor, (c) a background-worker dispatcher, (d) a `with_tenant_scope()` wrapper, or (e) a SECURITY DEFINER procedure with the canonical STEP 0 block.
   - FAILS CI on any unscoped access path (merge-blocking; see §5 Test 7.U for the canonical merge-blocking test).
   - The static analyzer's name, location, and rule IDs are pinned at code-repo bootstrap (Track 1); the analyzer's existence + merge-blocking status is canonical at this amendment.

5. **Operator + admin entry-point enumeration:** raw psql access by operators is the ONE entry path that cannot be enforced via application code. Per Telecheck operational policy, raw psql is forbidden in production; operators use the canonical admin tooling which wraps every PHI query in a `with_tenant_scope()` block. Break-glass raw psql access requires an operator-gated DBA-emergency procedure with audit + dual-control (per I-024 break-glass invariant).

**Acceptance:**
- Every PHI-touching code path MUST satisfy at least Layer 4 (static-analyzer pass) + Layer 2 (RLS); SECURITY DEFINER procedures MUST additionally satisfy Layer 3.
- The static-analyzer check is merge-blocking on every PR; bypass paths require an explicit annotation `// @telecheck-canonical-bypass: <reason + reviewer signoff>` that is reviewed at PR open.
- Layer 1 (canonical middleware) is the canonical SOURCE of `app.tenant_id`; Layer 2 (RLS) is the canonical ENFORCER at the table boundary; Layer 3 (I-032 STEP 0) is defense-in-depth on SECURITY DEFINER procedures specifically. Defense-in-depth is the design rationale.

---

### Sub-decision 2 — JWT session-liveness check (Phase 2 F-3)

**Decision shape:** the middleware (Sub-decision 1) performs a session-liveness check on every request:

1. Extract `session_id` claim from the JWT.
2. Look up the session in the canonical `session_state` table (a single canonical source of session liveness; rows are insert-on-login, update-on-refresh, delete-on-logout).
3. Verify:
   - `session_state.session_id = jwt.session_id`
   - `session_state.user_id = jwt.user_id`
   - `session_state.tenant_id = jwt.tenant_id` (the critical equality check; mismatch path per Sub-decision 4.5 below)
   - `session_state.revoked_at IS NULL` (not revoked)
   - `session_state.expires_at > now()` (not expired)
4. If all checks pass: proceed to Sub-decision 1 step 4 (set GUC).
5. If any check fails: short-circuit the request with a tenant-blind 401 (per I-025) AND emit the appropriate Cat A audit event (Sub-decisions 3/4 below).

**Why F-3 anchored within the middleware** (vs in the JWT verifier alone or in a separate API gateway): the session-liveness check needs the canonical session state, which lives in the application-managed DB transaction. A JWT-verifier-only check would let a revoked session continue running until the JWT TTL expired (15-min access token); a session-liveness-in-middleware design closes that window to the next request (typically <1 min).

**Performance posture:** the session-liveness check is a single indexed lookup on `session_state` by `session_id` primary key. Expected p99 latency: <2ms. Caching is permitted at the per-request scope (the middleware can reuse the lookup result within the same request) but NOT across requests (the cache window would re-introduce the revocation lag this design closes).

**In-flight request semantics under concurrent revocation (R1 HIGH-2 closure):**

The session-liveness check is performed exactly once per request, at request admission. Once admitted, a request runs to completion under its admission-time session state, even if revocation occurs during the request's execution. This is the canonical contract:

1. **Admitted-before-revocation requests complete normally.** A request that passed the liveness check at admission MAY perform PHI mutations until completion. The middleware does NOT recheck liveness mid-request.
2. **Subsequent requests under revoked sessions are rejected.** The very next request on the same session (after revocation propagates to `session_state.revoked_at`) is short-circuited at admission per §3.7 step 6.
3. **Cascade lag is bounded by the slowest individual revocation INSERT** (millisecond-scale per `session_state` row update under contention; tenant_disabled cascade for high-volume tenants uses per-batch progress checkpoints per OQ4).
4. **Audit trail:** every admitted request emits Cat C `identity.middleware_guc_set` at admission (per §3.6); every revocation emits the actor-typed revocation event per §3.8 / Sub-decision 3 (e.g., Cat A `identity.patient_session_revoked` for patients, Cat B `identity.clinician_session_revoked` for clinicians). The forensic trail allows reconstruction of "request admitted at T1, session revoked at T2 > T1" sequences for any in-flight overlap.
5. **No procedure-level liveness recheck.** SECURITY DEFINER procedures do NOT recheck `session_state` mid-transaction; the canonical contract is admission-time liveness only. (Closes R1 HIGH-2.)

**Why this in-flight semantic** (vs row-locking, revocation-epoch checking, or procedure-level liveness recheck):

- **Row-locking on session_state for every PHI mutation** would serialize all requests for the same session, eliminating concurrent device usage (multi-device patient sessions, multi-tab clinician portal). The performance cost outweighs the revocation-window-closure benefit.
- **Revocation-epoch checked at write boundaries** would require every PHI procedure to recheck liveness; this proliferates the binding logic + introduces N+1 lookup overhead.
- **Procedure-level liveness recheck** has the same N+1 problem + couples each procedure to session_state, breaking the canonical-middleware-only binding contract.
- **The accepted semantic** (admission-time-only check) is the standard model in well-engineered systems. The revocation-window for in-flight requests is bounded by the request's own execution time (typically <1 second for PHI mutations). The Cat A audit trail provides forensic reconstruction if a revocation race causes user-visible inconsistency.

**Explicit revocation-emergency-stop exception:** if a session must be stopped mid-request (e.g., compromise detection, regulatory order), the operator uses the admin force-logout endpoint which:
1. Sets `session_state.revoked_at` immediately (cascades the actor-typed revocation event per §3.8 / Sub-decision 3 — Cat A `identity.patient_session_revoked` for patient targets, Cat B `identity.clinician_session_revoked` or `identity.operator_session_revoked` for non-patient targets).
2. Optionally invokes the `kill_in_flight_session_requests($session_id)` operator procedure which terminates all open transactions for that session at the PostgreSQL level (via `pg_terminate_backend` on the connection holding the open transaction). This is an operator-gated escape hatch; not the standard revocation path.

**SI-017 Phase 2 F-3 contract:** ratified 2026-05-19; this Sub-decision integrates that ratified contract into the Identity Spec. The in-flight semantic is the canonical implementation of Phase 2 F-3.

---

### Sub-decision 3 — Session-revocation propagation (`identity.session_revoked` Cat A event)

**Decision shape (R1 MED-2 closure: classification split by actor type per SI-018 partition rule):**

Session-revocation events are classified by **the actor whose session is being revoked**, with the partition key determined by whether the actor has a valid patient-bound key:

| Actor type | Cat | Partition | Partition key | Event name |
|---|---|---|---|---|
| Patient session | A | P1 | user_id (= patient_id; the user_id IS the patient_id in this case) | `identity.patient_session_revoked` |
| Clinician session | B | P2 | tenant_id (clinician is not a patient; per-tenant operations governance) | `identity.clinician_session_revoked` |
| Operator/admin session | B | P2 | tenant_id OR `'platform'` (depending on operator-mode at revocation; per Sub-decision 6) | `identity.operator_session_revoked` |
| Tenant-disable cascade | B | P2 | tenant_id (one summary event per tenant; individual session-level events suppressed in favor of the summary; per-batch progress events emitted) | `identity.tenant_session_revocation_cascade` |
| DR failover session freeze | B | P2 | `'platform'` (platform-wide cascade; one summary event per region) | `identity.dr_failover_session_freeze_cascade` |
| JWT-tenant-mismatch | A | P1 | user_id (the user is known from session_state) | `identity.session_jwt_tenant_id_mismatch` (already canonical per Sub-decision 4) |

**Why split classification:**
- Per SI-018 ratified partition rule (2026-05-19): P1 is patient-bound; P2 is tenant-governance + platform-floor. Only events that have a valid patient-identifier partition key route to P1.
- Patient session revocation IS patient-bound (the user IS the patient).
- Clinician + operator + admin sessions are NOT patient-bound; routing them to P1 would either pollute patient audit chains with non-patient activity OR cause partition-key violations.
- Tenant-disable + DR cascades are tenant-wide / platform-wide; per-session events would flood P1 with millions of non-patient-bound rows; the summary-event pattern at P2 is the canonical approach (with per-batch Cat B progress events per OQ4).
- The forensic trail per actor type remains reconstructable: patient session-liveness trail at P1; clinician/operator session-liveness trail at P2 (tenant_id-keyed); platform cascade trail at P2 (`'platform'`-keyed).

**Cross-reference to Sub-decision 4 (JWT-mismatch path):** the mismatch event remains Cat A P1 keyed by user_id because the user_id is known from `session_state` regardless of the JWT's claimed tenant. This is consistent with the table above.

**Audit trail completeness invariant:** for every session revocation, exactly ONE primary event emits per the table above. Cascade summary events (tenant_session_revocation_cascade, dr_failover_session_freeze_cascade) do NOT additionally emit per-session events — the summary IS the canonical audit trail for the cascade; the per-session revocation is implicit from `session_state.revoked_at` rows.

---

### Sub-decision 4 — JWT-tenant-mismatch path (Sub-decision 4.5 of SI-017 ratified 2026-05-19)

**Decision shape:** if the JWT session-liveness check (Sub-decision 2 step 3) detects `session_state.tenant_id != jwt.tenant_id`, the middleware:

1. Short-circuits the request with a tenant-blind 401 (no detail about which tenant the JWT claimed; per I-025).
2. Emits a Cat A audit event `identity.session_jwt_tenant_id_mismatch` with: session_id (from session_state), jwt_claimed_tenant_id (NOT echoed back in response; logged for forensic trail only), user_id, request_id, middleware-version.
3. Revokes the session immediately (cascades to Sub-decision 3 — actor-typed revocation event per §3.8 with reason `jwt_tenant_id_mismatch`; for patient sessions this is Cat A `identity.patient_session_revoked`; for clinician/operator it is Cat B).
4. **Merge-blocking Test 7.X** (ratified at canonical content port 2026-05-19): an integration test in the canonical test suite verifies that:
   - Forging a JWT with `tenant_id = tenant_B` on a session bound to `tenant_A` results in 401 + the Cat A event + session revocation.
   - The 401 response body contains NO tenant_id reference (tenant-blind per I-025).
   - The Cat A event lands in the patient-bound partition (P1) keyed by user_id, NOT in the platform partition (P2). The user is identifiable; the mismatched tenant_id is not the partition key.

**Why Cat A (patient-bound) and not Cat B (platform-governance):** the event is bound to a specific user (the user_id is known from `session_state`); per SI-018 partition rule, user-bound events go to P1. The tenant-mismatch is a forensic detail logged in the event payload but NOT used as the partition key.

**Why "Sub-decision 4.5" naming convention:** preserves the cross-reference to the SI-017 canonical content port ratification cycle, where this exact path was the Sub-decision 4.5 mismatch-path component of A2+B2+C.

---

### Sub-decision 5 — I-032 STEP 0 tenant-GUC equality guard for SECURITY DEFINER procedures (Identity-Spec-side contract)

**Decision shape:** every SECURITY DEFINER procedure that touches PHI MUST, as STEP 0 of its body, verify:

```sql
IF NULLIF(current_setting('app.tenant_id', true), '') IS DISTINCT FROM p_tenant_id THEN
    RAISE EXCEPTION 'I-032 tenant-GUC equality violation: app.tenant_id=% does not match procedure p_tenant_id=%',
        NULLIF(current_setting('app.tenant_id', true), ''), p_tenant_id
        USING ERRCODE = 'TLC32';
END IF;
```

**Named-parameter convention (R1 MED-1 closure):** every PHI-touching SECURITY DEFINER procedure MUST declare an explicitly named `p_tenant_id` parameter of type `tenant_id_t` (CDM-canonical tenant identifier type). `p_tenant_id` MUST be present in the procedure signature; positional `$1` is forbidden because:

1. Procedures whose first argument is not tenant_id would silently compare against the wrong value.
2. Overloaded procedures with different parameter orders would have inconsistent guard behavior.
3. Wrappers calling subprocedures need to pass `p_tenant_id` by name (`CALL inner_proc(p_tenant_id => v_tenant_id)`) to make the contract verifiable.

**Nested procedure call contract:**
- A SECURITY DEFINER procedure that invokes another SECURITY DEFINER subprocedure MUST pass `p_tenant_id => <value>` by name (named parameter, not positional). The subprocedure's STEP 0 guard re-verifies independently.
- A SECURITY DEFINER procedure that invokes a SECURITY INVOKER subprocedure does NOT require the subprocedure to have STEP 0 (the SECURITY INVOKER subprocedure inherits the caller's role + the RLS policy on PHI tables enforces tenant binding at the row boundary; defense-in-depth via Layer 2 RLS).
- SAVEPOINT + ROLLBACK TO SAVEPOINT semantics: an inner SAVEPOINT rollback does NOT reset `app.tenant_id` (the GUC was set by SET LOCAL at the outer transaction's start; SAVEPOINT rollback only rolls back data changes, not GUCs). The STEP 0 guard remains valid across SAVEPOINT cycles.
- Exception handlers (`EXCEPTION WHEN OTHERS THEN`) MUST NOT swallow the TLC32 error. The canonical exception-handler pattern is `EXCEPTION WHEN SQLSTATE 'TLC32' THEN RAISE; WHEN OTHERS THEN ...`; the TLC32-specific re-raise is mandatory.
- Overloaded procedures: the static-analyzer (Layer 4 above) verifies that every overload of a procedure has consistent `p_tenant_id` placement + STEP 0 block.

**The canonical STEP 0 block** (preserved across the procedure-side amendments P-018a / P-019a / P-021a 2026-05-19):

**NULLIF normalization** (R5 closure from canonical-content-port iteration): PostgreSQL custom GUCs return empty string when RESET or blank, not NULL. The NULLIF normalization treats blank/RESET as NULL for the comparison; an explicit `tenant_id = NULL` mismatches any concrete tenant_id parameter, which is the desired semantic (no caller may invoke a procedure with a NULL or unset GUC).

**ERRCODE `TLC32`** (custom PostgreSQL error code): allows client-side discrimination between I-032 violations and other PL/pgSQL errors. Reserved as canonical at the I-032 ratification 2026-05-19.

**Mode 1 + Mode 2** (canonical content port nomenclature; **R1 HIGH-1 closure refined: audit durability via application-layer catch-and-emit pattern, NOT in-procedure emission**):

- **Mode 1 (procedure-side RAISE only):** the procedure raises the TLC32 exception; the transaction aborts; the caller (application middleware error-handler) receives a tenant-blind error per I-025.
- **Mode 2 (RAISE + application-layer audit emission in a SEPARATE transaction):** the procedure raises the TLC32 exception (Mode 1); the application's canonical middleware error-handler catches TLC32 specifically, opens a **fresh, separate transaction**, INSERTs the Cat A `identity.security_definer_tenant_guc_mismatch` audit row, COMMITs that transaction, then propagates the tenant-blind error to the caller. **The audit row is durable because it lives in a fresh transaction that succeeds; the original aborted transaction is unrelated.**

**R1 HIGH-1 closure rationale (engineering-review-pattern consistent):** the PR #11 cycle engineering review (Engineering-Review-Request-I-003-Atomic-Audit-Inside-vs-Application-Layer-Audit-2026-05-19, unanimous NO answer) confirmed that application-layer audit emission in a transaction governed by the application's BEGIN/COMMIT boundary satisfies I-003 + I-013 + HIPAA technical-safeguards. The Mode 2 pattern here applies the same principle: the audit row is emitted by the application after catching the procedure's raise, in a fresh transaction. The original transaction's rollback does not affect the audit row's durability. The procedure does NOT emit the audit; only the application does. (Closes R1 HIGH-1.)

**Why Mode 2** (application-layer catch-and-emit) for identity-platform-floor SECURITY DEFINER procedures: identity-related procedures are platform-floor; a tenant-GUC mismatch is a high-severity forensic event. The application-layer catch-and-emit pattern ensures the audit lands durably without coupling audit durability to the procedure's transaction outcome.

**Application-layer error-handler contract** (canonical):

```pseudocode
try {
  call_security_definer_procedure(...)
} catch (PostgresError e) {
  if (e.errcode == 'TLC32') {
    # Open fresh transaction, emit Cat A audit, COMMIT
    db.transaction(() => {
      audit.emit_cat_a('identity.security_definer_tenant_guc_mismatch', {
        procedure_name: e.procedure_name,
        expected_tenant_id: e.expected_tenant_id_from_message,
        observed_tenant_id_or_null: e.observed_tenant_id_from_message,
        caller_session_id: current_session_id,
      })
    })
  }
  throw new TenantBlindError(401)  # per I-025
}
```

The application's middleware error-handler is the canonical home for TLC32 catch-and-emit; per-handler catch-and-emit is forbidden (would proliferate the logic + violate single-canonical-path).

**Cross-references:**
- INVARIANTS v5.3 §I-032 (canonical statement).
- AUDIT_EVENTS v5.5 `identity.security_definer_tenant_guc_mismatch` (Cat A).
- P-018a/P-019a/P-021a STEP 0 amendments (procedure-side surfaces).

---

### Sub-decision 6 — Operator + platform-scope tenant-GUC binding rules (I-032 + I-024 interaction)

**Decision shape:** operator + admin sessions MAY operate in two distinct modes:

1. **Tenant-scoped operator mode:** the operator authenticated and explicitly selected a tenant context (via the admin UI tenant-switcher). The middleware sets `app.tenant_id = <selected_tenant>`. All I-032 STEP 0 guards apply.
2. **Platform-scope operator mode:** the operator is operating on platform-floor data (audit chain inspection, cross-tenant analytics, DR failover orchestration). The middleware sets `app.tenant_id = 'platform'` (canonical sentinel). I-032 STEP 0 guards on platform-scope procedures verify `$1 = 'platform'` matches.

**I-024 break-glass cross-tenant operations:** explicitly NOT permitted under normal middleware-set-GUC operation. I-024 break-glass is a separate operator-gated procedure with its own STEP 0 contract (a dedicated `with_break_glass_authorization()` wrapper that requires an active named-operator session + dual-control approval + audit emission BEFORE any cross-tenant read). I-024 is platform-floor and out-of-scope for the standard middleware pass.

**Audit:** transition between tenant-scoped and platform-scope modes (via operator-mode-switcher) emits a Cat B audit event `identity.operator_mode_switched` with operator_id, from_mode, to_mode, target_tenant_id (if entering tenant-scoped), session_id.

**Acceptance:** the canonical operator-mode-switcher is the only path that toggles between modes; direct mutation of `app.tenant_id` from an operator session without going through the canonical switcher is a code-review-blocking violation.

---

## 4. Spec body amendments (v1.0 → v1.1 patch deltas)

The following deltas apply against the existing v1.0 body. The amendments are written as concrete text-replacement / insertion blocks for the canonical bundle file `Telecheck_Identity_Authentication_Spec_v1_0.md` (to be renamed to `_v1_1.md` at ratifier-promotion).

### Delta 1 — Header status block

**v1.0:**
```
**Version:** 1.0
**Status:** Canonical for development
**Companion documents:** Consent & Delegated Access Slice PRD v1.0, RBAC Permissions Matrix v1.0, Contracts Pack v5 (AUDIT-EVENTS, CCR-RUNTIME)
```

**v1.1:**
```
**Version:** 1.1
**Status:** Canonical for development (v1.0 → v1.1 amendment integrates SI-017 canonical content port + I-032 STEP 0 SECURITY DEFINER pattern, both ratified 2026-05-19)
**Companion documents:** Consent & Delegated Access Slice PRD v1.0, RBAC Permissions Matrix v1.1, Contracts Pack v5.3 (INVARIANTS v5.3 §I-032; AUDIT_EVENTS v5.5; CCR_RUNTIME v5.2), Cold-DR Runbook v0.1 DRAFT, P-018a + P-019a + P-021a procedure-side STEP 0 amendments
```

### Delta 2 — §3.3 Token architecture (amended)

**v1.0:**
> Access token: Short-lived JWT containing user_id, role, active_delegation (if acting as delegate), country_of_care, session_id. Included in every API request.

**v1.1:**
> Access token: Short-lived JWT containing user_id, role, active_delegation (if acting as delegate), country_of_care, session_id, **tenant_id** (the user's home-tenant for tenant-scoped users; `'platform'` sentinel for platform-scope operators). Included in every API request. The `tenant_id` claim is the canonical binding source for the middleware-resolved `app.tenant_id` PostgreSQL GUC per §3.6. The JWT signature MUST cover the `tenant_id` claim (HMAC-SHA256 or RSA per SECURITY contract); any forgery attempt that mutates the `tenant_id` claim without re-signing fails signature verification BEFORE the session-liveness check (§3.7).

### Delta 3 — §3.6 (NEW) Tenant-GUC middleware-resolved binding

**Insertion after v1.0 §3.5:**

> ### 3.6 Tenant-GUC middleware-resolved binding (SI-017 canonical content port)
>
> Every authenticated request flows through a single canonical middleware that, BEFORE any application code or DB query executes:
>
> 1. Verifies the JWT signature (rejects on signature failure with tenant-blind 401 per I-025).
> 2. Performs the session-liveness check per §3.7.
> 3. Resolves `tenant_id` from the verified JWT claim.
> 4. Sets `app.tenant_id` via `SET LOCAL app.tenant_id = $1` for the request's open transaction.
> 5. Emits Cat C `identity.middleware_guc_set` audit event (sampled per AUDIT_EVENTS v5.5 Cat C policy).
>
> The GUC is transaction-scoped (SET LOCAL); it auto-clears at COMMIT/ROLLBACK. Code paths that bypass the middleware (admin tooling, migration runners, background workers) MUST set `app.tenant_id` explicitly via the canonical `with_tenant_scope()` helper. Bypass paths are linted by the static analyzer per the canonical content port acceptance criterion.

### Delta 4 — §3.7 (NEW) JWT session-liveness check

**Insertion after §3.6:**

> ### 3.7 JWT session-liveness check (Phase 2 F-3 per SI-017 Sub-decision 4.5 ratified 2026-05-19)
>
> On every authenticated request, the middleware (§3.6) performs a session-liveness check against the canonical `session_state` table:
>
> 1. Extract `session_id`, `user_id`, `tenant_id` from the JWT claims.
> 2. SELECT from `session_state` WHERE `session_id = $1` (indexed primary-key lookup).
> 3. Verify: `session_state.user_id = jwt.user_id`, `session_state.tenant_id = jwt.tenant_id`, `revoked_at IS NULL`, `expires_at > now()`.
> 4. If all checks pass: proceed to §3.6 step 4.
> 5. If `session_state.tenant_id != jwt.tenant_id`: short-circuit with tenant-blind 401; emit Cat A `identity.session_jwt_tenant_id_mismatch` (with jwt_claimed_tenant_id logged in payload, NOT echoed in response per I-025); revoke the session (cascade to §3.8 actor-typed revocation event with reason `jwt_tenant_id_mismatch` — `identity.patient_session_revoked` Cat A for patient sessions, `identity.clinician_session_revoked` Cat B for clinician sessions, `identity.operator_session_revoked` Cat B for operator/admin sessions). Merge-blocking Test 7.X verifies this path.
> 6. If `revoked_at IS NOT NULL`: short-circuit with tenant-blind 401; emit Cat C `identity.session_liveness_check_failed_revoked`.
> 7. If `expires_at <= now()`: short-circuit with tenant-blind 401; emit Cat C `identity.session_liveness_check_failed_expired`.
>
> Performance: single indexed lookup; expected p99 <2ms. Per-request caching is permitted (within the same request scope only); cross-request caching is forbidden (would re-introduce revocation lag).

### Delta 5 — §3.8 (NEW) Session-revocation propagation (classification split by actor type per R1 MED-2 closure)

**Insertion after §3.7:**

> ### 3.8 Session-revocation propagation
>
> Session-revocation events are classified by the **actor whose session is being revoked**. The partition key is determined by whether the actor has a valid patient-bound key (per SI-018 ratified partition rule 2026-05-19).
>
> | Actor type | Cat | Partition | Partition key | Event name |
> |---|---|---|---|---|
> | Patient session | A | P1 | user_id (= patient_id) | `identity.patient_session_revoked` |
> | Clinician session | B | P2 | tenant_id | `identity.clinician_session_revoked` |
> | Operator/admin session | B | P2 | tenant_id OR `'platform'` (per operator-mode) | `identity.operator_session_revoked` |
> | Tenant-disable cascade | B | P2 | tenant_id (one summary event per tenant) | `identity.tenant_session_revocation_cascade` |
> | DR failover session freeze | B | P2 | `'platform'` (one summary event per region) | `identity.dr_failover_session_freeze_cascade` |
> | JWT-tenant-mismatch | A | P1 | user_id (from session_state) | `identity.session_jwt_tenant_id_mismatch` |
>
> **Trigger paths:**
>
> | Trigger | Cascade events emitted |
> |---|---|
> | `POST /auth/logout` (patient) | `identity.patient_session_revoked` |
> | `POST /auth/logout` (clinician) | `identity.clinician_session_revoked` |
> | `POST /auth/logout` (operator) | `identity.operator_session_revoked` |
> | Admin force-logout (target = patient) | `identity.patient_session_revoked` |
> | Admin force-logout (target = clinician/operator) | `identity.clinician_session_revoked` / `identity.operator_session_revoked` |
> | Patient password / phone change | `identity.patient_session_revoked` |
> | Clinician password change | `identity.clinician_session_revoked` |
> | Tenant disable | ONE `identity.tenant_session_revocation_cascade` summary + per-batch Cat B `identity.tenant_session_revocation_batch_completed` progress events |
> | Clinician license expiry | `identity.clinician_session_revoked` (per-clinician; not a cascade summary because typically one clinician at a time) |
> | Device-limit exceeded (§3.4) | `identity.patient_session_revoked` (oldest patient session dropped) |
> | DR session freeze (Cold-DR Runbook §4 Step 1) | ONE `identity.dr_failover_session_freeze_cascade` summary keyed by `'platform'`; per-session events NOT emitted |
> | JWT-tenant-mismatch (§3.7 step 5) | `identity.session_jwt_tenant_id_mismatch` + actor-typed revocation event per the actor's role |
>
> **Audit-trail completeness invariant:** for every session revocation, exactly ONE primary event emits per the table above. Cascade summary events do NOT additionally emit per-session events — the summary IS the canonical audit trail for the cascade; the per-session revocation is implicit from `session_state.revoked_at` rows.

### Delta 6 — §9 Audit (amended)

**Append to v1.0 §9 table:**

| Event | Category | Detail |
|---|---|---|
| `identity.middleware_guc_set` | C (high-volume, sampled) | session_id, user_id, tenant_id, request_id, middleware_version | P1 if user is patient; P2 otherwise (keyed by tenant_id) |
| `identity.patient_session_revoked` | A | session_id, user_id (= patient_id), tenant_id, revocation_reason | P1 keyed by patient_id |
| `identity.clinician_session_revoked` | B | session_id, user_id (clinician), tenant_id, revocation_reason | P2 keyed by tenant_id |
| `identity.operator_session_revoked` | B | session_id, user_id (operator/admin), tenant_id OR 'platform', revocation_reason | P2 keyed by tenant_id OR 'platform' per operator-mode |
| `identity.tenant_session_revocation_cascade` | B | tenant_id, total_sessions_revoked, started_at, completed_at | P2 keyed by tenant_id (summary; one per tenant disable) |
| `identity.tenant_session_revocation_batch_completed` | B | tenant_id, batch_id, sessions_in_batch, total_batches, started_at, completed_at | P2 keyed by tenant_id (per-batch progress per OQ4) |
| `identity.dr_failover_session_freeze_cascade` | B | region (us-east-1 or us-west-2), total_sessions_frozen, freeze_initiated_at, freeze_completed_at | P2 keyed by 'platform' (summary; one per region) |
| `identity.session_jwt_tenant_id_mismatch` | A | session_id, user_id, jwt_claimed_tenant_id, request_id, middleware_version | P1 keyed by user_id |
| `identity.session_liveness_check_failed_revoked` | C | session_id, user_id | P1 if user is patient; P2 otherwise |
| `identity.session_liveness_check_failed_expired` | C | session_id, user_id | P1 if user is patient; P2 otherwise |
| `identity.security_definer_tenant_guc_mismatch` | A | procedure_name, expected_tenant_id, observed_tenant_id_or_null, caller_session_id | P2 keyed by expected_tenant_id (platform-floor forensic) |
| `identity.operator_mode_switched` | B | operator_id, from_mode, to_mode, target_tenant_id (nullable), session_id | P2 keyed by tenant_id OR 'platform' |

### Delta 7 — §11 (NEW) I-032 STEP 0 contract for SECURITY DEFINER call sites

**Insertion after §10 Dependencies:**

> ### 11. I-032 STEP 0 contract for SECURITY DEFINER call sites
>
> Per I-032 (INVARIANTS v5.3, ratified 2026-05-19), every SECURITY DEFINER procedure that touches PHI MUST verify tenant-GUC equality as STEP 0 of its body. The canonical STEP 0 block is:
>
> ```sql
> IF NULLIF(current_setting('app.tenant_id', true), '') IS DISTINCT FROM $1 THEN
>     RAISE EXCEPTION 'I-032 tenant-GUC equality violation: app.tenant_id=% does not match procedure tenant_id=%',
>         NULLIF(current_setting('app.tenant_id', true), ''), $1
>         USING ERRCODE = 'TLC32';
> END IF;
> ```
>
> NULLIF normalization is required because PostgreSQL custom GUCs return empty string when RESET/blank, not NULL.
>
> Mode 2 procedures (identity-platform-floor) MUST additionally emit Cat A `identity.security_definer_tenant_guc_mismatch` BEFORE raising. If the audit emission itself fails, the procedure still raises I-032 but logs the audit-emission-failure to error-stream fallback per AUDIT_EVENTS v5.5 §"Audit-emission failure handling".
>
> Reference procedures (already amended via P-018a/P-019a/P-021a 2026-05-19):
> - `record_workflow_pointer_swap()` (P-018a / SI-008)
> - `record_consult_escalation_target_swap()` (P-019a / SI-009)
> - `record_consult_clinician_decision()` (P-021a / SI-005)
> - `rotate_consult_clinician_decision_kms()` (P-021a / SI-005)

### Delta 8 — §12 (NEW) Open questions for ratifier

**Insertion after §11:**

> ### 12. Open questions for ratifier (v1.1 amendment)
>
> 1. **OQ1 — `session_state` table canonical home (CDM v1.2 vs Identity Spec v1.1).** The session-liveness check requires a canonical `session_state` table. Recommendation: file as SI-022 to add `session_state` entity to CDM v1.2 (becomes CDM v1.3 at promotion). Identity Spec v1.1 references the entity but does not redefine the schema. *Cross-SI dependency for ratifier sequencing.*
> 2. **OQ2 — Session-state replication topology under DR.** Cold-DR Runbook v0.1 DRAFT §"DR session freeze" presumes session_state replicates to us-west-2 via standard RDS logical replication. The session-liveness check during DR failover would read from the promoted us-west-2 RDS. Recommendation: confirm via ratifier. If session_state requires multi-region active-active (vs single-region+cold-DR), file as follow-up SI overlapping with Cold-DR OQ7.
> 3. **OQ3 — `with_tenant_scope()` canonical helper home.** Background workers and migration runners need a canonical helper. Recommendation: file as a Track 5 (Infra) deliverable; helper lives in `@telecheck/auth-core` shared library at code-repo bootstrap.
> 4. **OQ4 — Session-revocation cascade ordering on tenant_disabled.** When a tenant is disabled, the cascade emits exactly ONE Cat B `identity.tenant_session_revocation_cascade` summary event (per R1 MED-2 closure; per-session events suppressed). For high-tenant-volume tenants (10k+ active sessions), per-batch Cat B `identity.tenant_session_revocation_batch_completed` progress events emit at 1k-session checkpoints. The per-session `session_state.revoked_at` rows still update individually; the summary + per-batch progress provide the canonical audit trail. Ratifier confirms the per-batch checkpoint cadence (recommended 1k); if a different cadence (e.g., 5k for higher-throughput tenants) is desired, file as follow-up SI.
> 5. **OQ5 — Codex pre-ratification target for this v1.1 amendment.** Recommendation: 3-4 rounds (Engineering Spec amendment; multiple cross-SI surfaces).
> 6. **OQ6 — Cross-SI dependency: P-018b scope (cross-referenced from SI-016 OQ6).** The ai_workflow_executions BEFORE INSERT trigger requires reading `app.tenant_id` from the executing session's GUC. This Identity Spec amendment defines the GUC is always set by middleware (per §3.6); SI-016's trigger therefore can rely on a non-null GUC. Recommendation: ratifier confirms cross-SI alignment; no further amendment to Identity Spec needed.

### Delta 9 — Document control (v1.1 entry)

**Append to v1.0 Document control section:**

> **v1.1** (2026-05-19) — Integrates SI-017 canonical content port (Phase 2 F-3 JWT session-liveness check anchored within canonical `app.tenant_id` middleware-GUC model + Sub-decision 4.5 mismatch path A2+B2+C with Cat A `identity.session_jwt_tenant_id_mismatch` event + merge-blocking Test 7.X) + I-032 STEP 0 SECURITY DEFINER tenant-GUC equality guard (canonical STEP 0 block with NULLIF normalization + ERRCODE TLC32 + Mode 1/Mode 2 distinction). Adds §§3.6, 3.7, 3.8 (middleware-GUC binding + session-liveness + revocation propagation), §11 (I-032 STEP 0 contract), §12 (open questions). Amends §3.3 (tenant_id claim), §9 (7 new audit events). v1.0 body preserved; v1.1 extends rather than rewrites.

---

## 5. Test coverage commitments (acceptance-criterion-grade with concrete CI gates per R1 MED-3 closure)

Merge-blocking integration tests at code-repo implementation (Track 1). The canonical test-suite architecture is the existing `apps/api-server/__integration__/` directory in `arthurmenson/telecheckONE` (already established for SI-007 / SI-008 / SI-011 / TLC-021 integration tests). Each test below names the canonical file location, the CI job that runs it, and the merge-blocking gate that fails the PR if the test fails or is missing.

| Test ID | File location | CI job | Verifies | Sub-decision | Merge-blocking gate |
|---|---|---|---|---|---|
| Test 7.X | `apps/api-server/__integration__/identity/jwt_tenant_mismatch.test.ts` | `integration-identity` | JWT-tenant-mismatch → 401 + Cat A `identity.session_jwt_tenant_id_mismatch` + session revoked + Cat A `identity.patient_session_revoked` cascade | §3.7 + Sub-decision 4 | CI job `integration-identity` MUST PASS; the test asserts response status 401, response body MUST NOT contain any tenant_id, audit table MUST contain the Cat A event |
| Test 7.Y | `apps/api-server/__integration__/identity/missing_jwt.test.ts` | `integration-identity` | Missing JWT → 401 (tenant-blind per I-025) | §3.7 | CI job `integration-identity` MUST PASS |
| Test 7.Z | `apps/api-server/__integration__/identity/revoked_session.test.ts` | `integration-identity` | Revoked session → 401 + Cat C `identity.session_liveness_check_failed_revoked` | §3.7 | CI job `integration-identity` MUST PASS |
| Test 7.W | `apps/api-server/__integration__/identity/expired_session.test.ts` | `integration-identity` | Expired session → 401 + Cat C `identity.session_liveness_check_failed_expired` | §3.7 | CI job `integration-identity` MUST PASS |
| Test 7.V | `apps/api-server/__integration__/security_definer/i032_step0_guard.test.ts` | `integration-security-definer` | SECURITY DEFINER procedure with mismatched `app.tenant_id` → ERRCODE TLC32 + Cat A `identity.security_definer_tenant_guc_mismatch` emitted by application catch-handler in fresh transaction | §11 + Sub-decision 5 | CI job `integration-security-definer` MUST PASS; test asserts the audit row's transaction completes successfully even though the procedure transaction rolled back |
| Test 7.U | `tools/static-analyzer/tests/tenant-scope-binding.test.ts` | `static-analyzer` | Bypass middleware on PHI handler → static-analyzer rule ID `TLC-SCOPE-001` fails the build | §3.6 + Sub-decision 1 | CI job `static-analyzer` MUST PASS; this is the canonical Layer 4 enforcement gate per Sub-decision 1 |
| Test 7.T | `apps/api-server/__integration__/identity/operator_mode_switch.test.ts` | `integration-identity` | Operator-mode-switcher → Cat B `identity.operator_mode_switched` | §6 + Sub-decision 6 | CI job `integration-identity` MUST PASS |
| Test 7.S | `apps/api-server/__integration__/dr/session_freeze_cascade.test.ts` | `integration-dr-failover` | DR failover session freeze → ONE Cat B `identity.dr_failover_session_freeze_cascade` summary event keyed by `'platform'`; per-session events NOT emitted (per R1 MED-2 cascade-summary pattern); `session_state.revoked_at` set on all rows | §3.8 | CI job `integration-dr-failover` MUST PASS; test asserts exactly ONE summary event + N session_state rows updated |

**CI job pipeline mapping:** the four CI jobs above are added to the canonical PR CI pipeline (`.github/workflows/ci.yml`) at code-repo bootstrap. The PR cannot merge unless all four jobs pass. The static-analyzer rule `TLC-SCOPE-001` is added to `tools/static-analyzer/rules/` as a TypeScript AST-walker that identifies unscoped PHI access paths.

**Static-analyzer rule IDs registered at this amendment:**
- `TLC-SCOPE-001` — PHI access path not downstream of canonical middleware OR `with_tenant_scope()` wrapper OR SECURITY DEFINER procedure (Layer 4 enforcement).
- `TLC-SCOPE-002` — SECURITY DEFINER procedure missing canonical STEP 0 block (verified by parsing the procedure body for the canonical NULLIF + RAISE pattern; Layer 3 enforcement).
- `TLC-SCOPE-003` — SECURITY DEFINER procedure parameter list missing named `p_tenant_id` (verified by parsing function signature; Sub-decision 5 named-parameter convention).
- `TLC-SCOPE-004` — Exception handler swallows TLC32 without re-raising (verified by AST walk of EXCEPTION blocks; Sub-decision 5 nested call contract).

Each rule's existence + merge-blocking status is canonical at this amendment. Rule implementation lives in `tools/static-analyzer/rules/tlc-scope-*.ts` at code-repo bootstrap.

**Acceptance for ratifier promotion:** the canonical CI pipeline + the four static-analyzer rules MUST exist (with passing test coverage) BEFORE this v1.1 amendment can be promoted to canonical bundle status. The Sprint 8 deliverable is the spec; the Track 1 deliverable is the CI + analyzer implementation. The spec is ratifier-targetable independently; the CI gate is acceptance-criterion-grade at code-repo implementation.

---

## 6. Cross-SI alignment summary

| Cross-SI surface | Identity v1.1 surface | Relationship |
|---|---|---|
| SI-018 two-tier hybrid audit-chain partition | §3.7/§3.8/§11 audit events | Per R1 MED-2 closure: Cat A patient-bound events route to P1 keyed by patient_id; Cat B non-patient-bound events (clinician/operator/cascade summaries) route to P2 keyed by tenant_id OR `'platform'`; classification split by actor type with explicit partition keys per the §3.8 table |
| SI-016 ai_workflow_executions BEFORE INSERT trigger (OQ6 P-018b) | §3.6 middleware-GUC binding | Trigger reads `app.tenant_id` from middleware-set GUC; no separate trigger-level resolution |
| P-018a/P-019a/P-021a procedure STEP 0 amendments | §11 I-032 STEP 0 contract | Identity Spec §11 codifies the canonical STEP 0 block; procedure-side amendments reference this canonical surface |
| Cold-DR Runbook §4 Step 1 session-freeze | §3.8 dr_failover_session_freeze reason | Cold-DR cascade triggers session-revocation propagation |
| RBAC Permissions Matrix v1.1 | §6 operator + admin authentication | RBAC governs role-claim in JWT; Identity v1.1 governs how the role-claim is consumed at middleware + GUC |

---

## 7. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; awaiting Codex R1.

**v0.1 R1 closure 2026-05-19:** 3 HIGH + 3 MED findings closed inline (no architectural-judgment items; all in-scope correctness gaps in own draft):

| Round | Findings | Status |
|---|---|---|
| R1 | HIGH-1 Mode 2 audit durability (procedure raise aborts the audit emission's transaction); HIGH-2 single-shot session-liveness check + in-flight revocation race; HIGH-3 entry-point enforcement across HTTP/gRPC/worker/admin/migration bypass paths; MED-1 STEP 0 `$1` brittleness for non-tenant-first-arg + overloaded + nested-call procedures; MED-2 Cat A/P1 classification overreach for non-patient-bound revocation cascades; MED-3 merge-blocking tests not actually merge-blocking-able without canonical CI gate definitions | All 6 closed inline |

**R1 closure pattern recap:**
- HIGH-1: Mode 2 moved from in-procedure audit emission to application-layer catch-and-emit in a fresh transaction (consistent with PR #11 engineering-review-grounded answer that application-layer audit emission satisfies I-003 + HIPAA technical-safeguards).
- HIGH-2: in-flight revocation semantics specified explicitly (admission-time check only; admitted requests complete; subsequent requests rejected; cascade lag bounded; emergency-stop escape hatch documented).
- HIGH-3: 5-layer enforcement model articulated (canonical middleware + RLS + I-032 STEP 0 + static analyzer + operator-tooling); `with_tenant_scope()` canonical location pinned (`@telecheck/auth-core`); CI rule IDs registered.
- MED-1: `$1` replaced with named `p_tenant_id` convention; nested call + SAVEPOINT + EXCEPTION handler + overloaded procedure contracts specified.
- MED-2: classification split by actor type (patient/clinician/operator/cascade) with explicit partition keys per SI-018 partition rule.
- MED-3: 4 CI jobs named + 4 static-analyzer rule IDs registered (`TLC-SCOPE-001..004`); canonical test-suite location pinned (`apps/api-server/__integration__/`).

No architectural-judgment items introduced inline; CLAUDE.md hard-floor item 6 honored. The 6 known OQs (§12) remain ratifier-targetable.

---

— Claude (Opus 4.7, 1M context), SI-017 Identity Spec v1.0 → v1.1 amendment v0.1 DRAFT authored 2026-05-19 under "continue for 24 hrs" autonomous-work authorization. Sprint 8 of the 24h-loop work plan. Track 1 + Track 5 spec-corpus deliverable. Integrates the ratified SI-017 canonical content port + I-032 STEP 0 SECURITY DEFINER pattern into the canonical Identity Spec. Companion to Cold-DR Runbook v0.1 DRAFT (Sprint 7) + P-018a/P-019a/P-021a procedure-side amendments (canonical content port 2026-05-19).
