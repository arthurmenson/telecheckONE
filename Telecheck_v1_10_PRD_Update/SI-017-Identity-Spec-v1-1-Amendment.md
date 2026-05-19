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
| §9 Audit | NEW events: `identity.session_jwt_tenant_id_mismatch` (Cat A), `identity.session_revoked` (Cat A), `identity.middleware_guc_set` (Cat C high-volume) | SI-017 + I-032 |
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

**Acceptance:**
- Every request handler that touches PHI MUST be downstream of the middleware pass.
- Code paths that bypass the middleware (e.g., admin tooling, migration runners) MUST set `app.tenant_id` explicitly via the canonical `with_tenant_scope()` helper OR run with `app.tenant_id = 'platform'` for platform-scope operations (per I-032's NULLIF normalization handling of blank/RESET).
- Static-analyzer check (added at canonical content port): every Track 1+2+3+4 module's middleware-pass MUST be on the canonical path; bypass paths are linted.

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

**SI-017 Phase 2 F-3 contract:** ratified 2026-05-19; this Sub-decision integrates that ratified contract into the Identity Spec.

---

### Sub-decision 3 — Session-revocation propagation (`identity.session_revoked` Cat A event)

**Decision shape:** session revocation paths emit a Cat A audit event `identity.session_revoked` with: session_id, user_id, tenant_id, revocation_reason (`user_logout`, `admin_force`, `password_change`, `tenant_disabled`, `clinician_license_expired`, `phone_changed`, `device_limit_exceeded`, `dr_failover_session_freeze`).

**Trigger paths:**
- `POST /auth/logout` → user_logout
- Admin force-logout → admin_force
- Password / phone change → password_change / phone_changed
- Tenant disable → tenant_disabled (cascade to all sessions in that tenant)
- Clinician license expiry → clinician_license_expired (cascade to all that clinician's sessions)
- Device-limit exceeded → device_limit_exceeded (oldest session dropped)
- DR session freeze (Cold-DR Runbook §4 Step 1) → dr_failover_session_freeze (cascade to all sessions)

**Cat A justification:** revocation is a security-critical state transition; it MUST land in the patient-bound audit-chain partition (P1 per SI-018) so that the canonical session-liveness trail is reconstructable per-patient. Aligns with I-013 + I-016 append-only audit invariants.

---

### Sub-decision 4 — JWT-tenant-mismatch path (Sub-decision 4.5 of SI-017 ratified 2026-05-19)

**Decision shape:** if the JWT session-liveness check (Sub-decision 2 step 3) detects `session_state.tenant_id != jwt.tenant_id`, the middleware:

1. Short-circuits the request with a tenant-blind 401 (no detail about which tenant the JWT claimed; per I-025).
2. Emits a Cat A audit event `identity.session_jwt_tenant_id_mismatch` with: session_id (from session_state), jwt_claimed_tenant_id (NOT echoed back in response; logged for forensic trail only), user_id, request_id, middleware-version.
3. Revokes the session immediately (cascades to Sub-decision 3 `identity.session_revoked` Cat A event with reason `jwt_tenant_id_mismatch`).
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
IF NULLIF(current_setting('app.tenant_id', true), '') IS DISTINCT FROM $1 THEN
    RAISE EXCEPTION 'I-032 tenant-GUC equality violation: app.tenant_id=% does not match procedure tenant_id=%',
        NULLIF(current_setting('app.tenant_id', true), ''), $1
        USING ERRCODE = 'TLC32';
END IF;
```

Where `$1` is the procedure's tenant_id parameter.

**NULLIF normalization** (R5 closure from canonical-content-port iteration): PostgreSQL custom GUCs return empty string when RESET or blank, not NULL. The NULLIF normalization treats blank/RESET as NULL for the comparison; an explicit `tenant_id = NULL` mismatches any concrete tenant_id parameter, which is the desired semantic (no caller may invoke a procedure with a NULL or unset GUC).

**ERRCODE `TLC32`** (custom PostgreSQL error code): allows client-side discrimination between I-032 violations and other PL/pgSQL errors. Reserved as canonical at the I-032 ratification 2026-05-19.

**Mode 1 + Mode 2** (canonical content port nomenclature):
- **Mode 1 (RAISE):** the procedure raises the exception, the transaction aborts, the caller receives a tenant-blind error per I-025.
- **Mode 2 (RAISE + audit emission):** the procedure emits a Cat A audit event `identity.security_definer_tenant_guc_mismatch` BEFORE raising (within the same transaction; if the audit emission itself fails, the procedure still raises the I-032 exception but logs the audit-emission-failure to an error-stream fallback).

**Why Mode 2** (with audit emission) for Identity-spec-side SECURITY DEFINER procedures: identity-related procedures are platform-floor; a tenant-GUC mismatch in this layer is a high-severity forensic event. The audit emission MUST happen so the event lands in the canonical audit-chain.

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
> 5. If `session_state.tenant_id != jwt.tenant_id`: short-circuit with tenant-blind 401; emit Cat A `identity.session_jwt_tenant_id_mismatch` (with jwt_claimed_tenant_id logged in payload, NOT echoed in response per I-025); revoke the session (cascade to §3.8 Cat A `identity.session_revoked` with reason `jwt_tenant_id_mismatch`). Merge-blocking Test 7.X verifies this path.
> 6. If `revoked_at IS NOT NULL`: short-circuit with tenant-blind 401; emit Cat C `identity.session_liveness_check_failed_revoked`.
> 7. If `expires_at <= now()`: short-circuit with tenant-blind 401; emit Cat C `identity.session_liveness_check_failed_expired`.
>
> Performance: single indexed lookup; expected p99 <2ms. Per-request caching is permitted (within the same request scope only); cross-request caching is forbidden (would re-introduce revocation lag).

### Delta 5 — §3.8 (NEW) Session-revocation propagation

**Insertion after §3.7:**

> ### 3.8 Session-revocation propagation
>
> Session revocation paths emit Cat A `identity.session_revoked` with: session_id, user_id, tenant_id, revocation_reason. Trigger paths:
>
> | Reason | Path |
> |---|---|
> | `user_logout` | `POST /auth/logout` |
> | `admin_force` | Admin force-logout endpoint |
> | `password_change` | Password change flow (clinician/operator) |
> | `phone_changed` | Phone-number change flow |
> | `tenant_disabled` | Tenant disable cascade (all sessions in tenant) |
> | `clinician_license_expired` | License-expiry cascade (all that clinician's sessions) |
> | `device_limit_exceeded` | §3.4 device-limit oldest-session-drop |
> | `dr_failover_session_freeze` | Cold-DR Runbook §4 Step 1 (cascade to all sessions) |
> | `jwt_tenant_id_mismatch` | §3.7 step 5 cascade |
>
> Cat A justification: revocation is security-critical; lands in patient-bound audit-chain partition (P1) per SI-018 for per-user session-liveness trail reconstruction.

### Delta 6 — §9 Audit (amended)

**Append to v1.0 §9 table:**

| Event | Category | Detail |
|---|---|---|
| `identity.middleware_guc_set` | C (high-volume, sampled) | session_id, user_id, tenant_id, request_id, middleware_version |
| `identity.session_revoked` | A | session_id, user_id, tenant_id, revocation_reason |
| `identity.session_jwt_tenant_id_mismatch` | A | session_id, user_id, jwt_claimed_tenant_id, request_id, middleware_version |
| `identity.session_liveness_check_failed_revoked` | C | session_id, user_id |
| `identity.session_liveness_check_failed_expired` | C | session_id, user_id |
| `identity.security_definer_tenant_guc_mismatch` | A | procedure_name, expected_tenant_id, observed_tenant_id_or_null, caller_session_id |
| `identity.operator_mode_switched` | B | operator_id, from_mode, to_mode, target_tenant_id (nullable), session_id |

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
> 4. **OQ4 — Session-revocation cascade ordering on tenant_disabled.** When a tenant is disabled, all that tenant's sessions get `identity.session_revoked` Cat A events. For high-tenant-volume tenants (10k+ active sessions), the cascade may take minutes. Recommendation: process via background job with per-batch (1k sessions) progress checkpoints; emit per-batch Cat B `identity.tenant_session_revocation_batch_completed` progress events.
> 5. **OQ5 — Codex pre-ratification target for this v1.1 amendment.** Recommendation: 3-4 rounds (Engineering Spec amendment; multiple cross-SI surfaces).
> 6. **OQ6 — Cross-SI dependency: P-018b scope (cross-referenced from SI-016 OQ6).** The ai_workflow_executions BEFORE INSERT trigger requires reading `app.tenant_id` from the executing session's GUC. This Identity Spec amendment defines the GUC is always set by middleware (per §3.6); SI-016's trigger therefore can rely on a non-null GUC. Recommendation: ratifier confirms cross-SI alignment; no further amendment to Identity Spec needed.

### Delta 9 — Document control (v1.1 entry)

**Append to v1.0 Document control section:**

> **v1.1** (2026-05-19) — Integrates SI-017 canonical content port (Phase 2 F-3 JWT session-liveness check anchored within canonical `app.tenant_id` middleware-GUC model + Sub-decision 4.5 mismatch path A2+B2+C with Cat A `identity.session_jwt_tenant_id_mismatch` event + merge-blocking Test 7.X) + I-032 STEP 0 SECURITY DEFINER tenant-GUC equality guard (canonical STEP 0 block with NULLIF normalization + ERRCODE TLC32 + Mode 1/Mode 2 distinction). Adds §§3.6, 3.7, 3.8 (middleware-GUC binding + session-liveness + revocation propagation), §11 (I-032 STEP 0 contract), §12 (open questions). Amends §3.3 (tenant_id claim), §9 (7 new audit events). v1.0 body preserved; v1.1 extends rather than rewrites.

---

## 5. Test coverage commitments (acceptance-criterion-grade)

Merge-blocking integration tests at code-repo implementation (Track 1):

| Test | Verifies | Sub-decision |
|---|---|---|
| Test 7.X | JWT-tenant-mismatch → 401 + Cat A + session revoked | §3.7 + Sub-decision 4 |
| Test 7.Y | Missing JWT → 401 (tenant-blind per I-025) | §3.7 |
| Test 7.Z | Revoked session → 401 + Cat C `identity.session_liveness_check_failed_revoked` | §3.7 |
| Test 7.W | Expired session → 401 + Cat C `identity.session_liveness_check_failed_expired` | §3.7 |
| Test 7.V | SECURITY DEFINER procedure with mismatched `app.tenant_id` → ERRCODE TLC32 + Cat A `identity.security_definer_tenant_guc_mismatch` | §11 + Sub-decision 5 |
| Test 7.U | Bypass middleware on PHI handler → static-analyzer lint failure (merge-blocking) | §3.6 |
| Test 7.T | Operator-mode-switcher → Cat B `identity.operator_mode_switched` | §6 + Sub-decision 6 |
| Test 7.S | DR failover session freeze (Cold-DR Runbook §4 Step 1) → cascade Cat A `identity.session_revoked` with reason `dr_failover_session_freeze` per session | §3.8 |

---

## 6. Cross-SI alignment summary

| Cross-SI surface | Identity v1.1 surface | Relationship |
|---|---|---|
| SI-018 two-tier hybrid audit-chain partition | §3.7/§3.8/§11 audit events | All Cat A events route to P1; Cat B operator events route to P2 |
| SI-016 ai_workflow_executions BEFORE INSERT trigger (OQ6 P-018b) | §3.6 middleware-GUC binding | Trigger reads `app.tenant_id` from middleware-set GUC; no separate trigger-level resolution |
| P-018a/P-019a/P-021a procedure STEP 0 amendments | §11 I-032 STEP 0 contract | Identity Spec §11 codifies the canonical STEP 0 block; procedure-side amendments reference this canonical surface |
| Cold-DR Runbook §4 Step 1 session-freeze | §3.8 dr_failover_session_freeze reason | Cold-DR cascade triggers session-revocation propagation |
| RBAC Permissions Matrix v1.1 | §6 operator + admin authentication | RBAC governs role-claim in JWT; Identity v1.1 governs how the role-claim is consumed at middleware + GUC |

---

## 7. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; awaiting Codex R1.

---

— Claude (Opus 4.7, 1M context), SI-017 Identity Spec v1.0 → v1.1 amendment v0.1 DRAFT authored 2026-05-19 under "continue for 24 hrs" autonomous-work authorization. Sprint 8 of the 24h-loop work plan. Track 1 + Track 5 spec-corpus deliverable. Integrates the ratified SI-017 canonical content port + I-032 STEP 0 SECURITY DEFINER pattern into the canonical Identity Spec. Companion to Cold-DR Runbook v0.1 DRAFT (Sprint 7) + P-018a/P-019a/P-021a procedure-side amendments (canonical content port 2026-05-19).
