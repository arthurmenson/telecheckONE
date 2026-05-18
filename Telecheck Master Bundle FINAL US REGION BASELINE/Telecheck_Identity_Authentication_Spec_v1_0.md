# Telecheck — Identity & Authentication Specification

**Version:** 1.1
**Status:** Canonical for development
**Owner:** Engineering Lead
**Parent document:** Telecheck Master Platform PRD v1.10, §7, §16
**Companion documents:** Consent & Delegated Access Slice PRD v1.0, RBAC Permissions Matrix v1.0, Contracts Pack v5.4 (AUDIT-EVENTS, CCR-RUNTIME)

**v1.1 amendment (2026-05-18 per SC6 P-023 SI-010 canonical-content-port landing; refined across Codex PR #10 rounds 1–6):** Added §3.6 "Server-side actor context (per SI-010)" closing Phase 2 F-3 (server-side actor identity binding). New `_session_actor_context` table with composite `(pg_backend_pid, txid)` PK + `bind_actor_context()` SECURITY DEFINER procedure + helper functions reading from the table (not GUCs) + cleanup mechanism (COMMIT-only CONSTRAINT TRIGGER + 60s sweeper + 5-min TTL) + `authContextPlugin` wiring + rollback-independent audit-writer pattern (application-side `auditWriterPool` + procedure-side `dblink_exec` loopback) + durable backstop on a dedicated `audit_backstop` PostgreSQL instance (separate WAL-backed deployment in a different AZ; synchronous_commit=on; its own hash-chained `identity_lifecycle_backstop` partition with `identity.audit_recovery_link` checkpoint bridging back to primary on drain) + fail-closed semantics on audit-writer failure + **7-test regression gate**. Filename retained at `_v1_0.md` per Contracts Pack convention (family identifier in filename; header iterates freely). Source-of-truth design doc: `telecheck-app/docs/SI-010-Session-Actor-Context-DB-Binding.md` v0.6.

---

## 1. Purpose

This specification defines patient registration, authentication, session management, clinician credential verification, and identity verification for clinical transactions. Every workflow in the platform depends on knowing who the user is. This is foundational infrastructure.

---

## 2. Patient registration

### 2.1 Registration flow

1. **Phone number entry.** Patient enters their phone number (Ghana format: 0XX XXX XXXX, stored as +233XXXXXXXXX). Phone number is the primary identifier.
2. **OTP verification.** A 6-digit OTP is sent via SMS. Valid for 5 minutes. Maximum 3 attempts before lockout (15-minute cooldown).
3. **Basic profile.** Patient provides: first name, last name, date of birth, gender. All required.
4. **Platform consent.** Patient reviews and grants platform consent (consent type 1 of 6). Presented as a clear, concise agreement — not a wall of text (I-022).
5. **Account created.** `country_of_registration` is set to Ghana (immutable). `locale` defaults to `en-GH` (changeable). Account is active.

### 2.2 Identity fields

| Field | Required | Mutable | Notes |
|---|---|---|---|
| Phone number | Yes | Yes (with re-verification) | Primary identifier and login credential |
| First name | Yes | Yes | Display name |
| Last name | Yes | Yes | Display name |
| Date of birth | Yes | No (immutable after verification) | Clinical relevance (pediatric/geriatric flags) |
| Gender | Yes | Yes | Clinical relevance (pregnancy/lactation flags) |
| Email | No | Yes | Optional secondary contact |
| National ID (Ghana Card) | No | Yes | Optional; may be required for certain programs |
| Profile photo | No | Yes | Optional; helps clinicians identify patients in video consults |

### 2.3 Uniqueness

Phone number is unique per account. A phone number cannot be registered to multiple accounts. If a patient changes their phone number, the old number is released after a 30-day hold period (prevents accidental account loss).

---

## 3. Authentication

### 3.1 Login flow

1. Patient enters phone number
2. OTP sent via SMS (6-digit, 5-minute validity, 3 attempts max)
3. Patient enters OTP
4. Session established

**Biometric unlock (optional):** After first login on a device, the patient can enable biometric authentication (fingerprint/face) for subsequent sessions. Biometric authentication generates a device-bound token — it does not bypass OTP for new devices.

### 3.2 Session management

| Parameter | Value |
|---|---|
| Access token TTL | 15 minutes |
| Refresh token TTL | 30 days |
| Maximum concurrent sessions | 3 devices |
| Session extension | Automatic via refresh token while app is active |
| Inactivity timeout | 10 minutes (foreground), immediate (background after 5 minutes) |
| Re-authentication for sensitive actions | OTP required for: changing phone number, granting delegation, revoking consent |

### 3.3 Token architecture

- **Access token:** Short-lived JWT containing user_id, role, active_delegation (if acting as delegate), country_of_care, session_id. Included in every API request.
- **Refresh token:** Longer-lived opaque token stored securely on device. Used to obtain new access tokens without re-authentication.
- **Device token:** Bound to the device via secure enclave/keychain. Required for biometric authentication.

### 3.4 Multi-device behavior

A patient may be logged in on up to 3 devices simultaneously. Each device has its own session. Actions on one device are reflected on others within the polling/push interval. Exceeding the device limit forces logout of the oldest session.

### 3.5 Account recovery

If a patient loses access to their phone number:
1. Patient contacts support via the support channel
2. Support verifies identity using: full name, date of birth, and one of (email, national ID, recent transaction history)
3. Support initiates a phone number change with the new number
4. OTP verification on the new number
5. 24-hour security hold on sensitive actions after phone number change

### 3.6 Server-side actor context (per SI-010)

**Added v1.1 per SC6 P-023 SI-010 canonical-content-port landing 2026-05-18; refined across Codex PR #10 rounds 1–8.** This section closes Phase 2 F-3 (server-side actor identity binding) and is referenced by Contracts Pack v5.4 AUDIT_EVENTS (**4 net-new Cat B identity binding-lifecycle action IDs**: `identity.actor_context_bound`, `identity.session_liveness_check_failed`, `identity.actor_context_unbound_rejected` (the three binding-path events) + `identity.audit_recovery_link` (chain-bridge checkpoint emitted by `audit_backstop_ingest` worker once per outage window during drain of the dedicated audit-backstop instance back into primary `identity_lifecycle` partition; added per Codex R6 round-6 HIGH-1 closure)).

**Purpose.** Every PHI-touching DB transaction MUST execute under a server-bound actor context — i.e., the DB session knows, by hard reference, which authenticated account is executing the statement, in which tenant, and under which session and request nonce. The mechanism is invariant-grade per I-023 (tenant isolation) and I-027 (audit attribution); it is not a soft "best-effort" attribution layer.

**`_session_actor_context` table.** A PERMANENT (not TEMP) table in the `app_internal` schema. **Primary key is the composite `(pg_backend_pid, txid)` discriminator** (NOT `pg_backend_pid` alone) — this defends against pooled-connection reuse and delayed-cleanup leaks where a backend pid is recycled across requests within the 5-minute TTL. Each row holds: `pg_backend_pid` (PK part 1), `txid` (PK part 2, captured via `txid_current()` at bind time), `account_id`, `tenant_id`, `role`, `admin_home_tenant_id` (NULL for non-admin), `session_id`, `nonce_hash` (SHA-256 of the request nonce captured via `app.request_nonce` GUC; the raw nonce is never stored), `bound_at`, `expires_at` (5-minute TTL from `bound_at`). **Three-role GRANT layering (Codex PR #10 R14 round-14 HIGH closure 2026-05-18; supersedes the prior two-role wording that conflated table-DML privileges with procedure-EXECUTE privileges and would have allowed `telecheck_app_role` to elevate into the table-writer role via membership and directly forge / delete context rows):**
- **`_session_actor_context_owner` (NOLOGIN, no membership grants to other roles):** owns the `_session_actor_context` table; holds INSERT/UPDATE/DELETE/SELECT on it. ALL OTHER ROLES have REVOKE ALL on the table. This is the only role that can directly DML the table; no role is a member of `_session_actor_context_owner`, so no `SET ROLE` path elevates into it.
- **`bind_actor_context_role` (NOLOGIN, no DML on the table):** holds ONLY `EXECUTE` on `bind_actor_context()`. Critically, `bind_actor_context_role` does NOT have INSERT/UPDATE/DELETE on `_session_actor_context` — the procedure performs the DML via `SECURITY DEFINER` running as `_session_actor_context_owner`. Elevating to `bind_actor_context_role` therefore grants ONLY the right to invoke the procedure; it does NOT grant the right to bypass the procedure and write directly to the table.
- **`telecheck_app_role` (LOGIN, request connections):** is a member of `bind_actor_context_role` **with the per-grant `INHERIT FALSE` option** (PostgreSQL 16+ syntax: `GRANT bind_actor_context_role TO telecheck_app_role WITH INHERIT FALSE, SET TRUE;`). The `INHERIT FALSE` flag is mandatory and is the canonical mechanism by which the base role's invocation path is denied while explicit role elevation remains the only authorized invocation path (Codex PR #10 R15 round-15 HIGH closure 2026-05-18 — the prior "inherits ONLY EXECUTE" wording contradicted PostgreSQL's default inheritance semantics, which would have allowed `telecheck_app_role` to CALL `bind_actor_context()` under its base identity without first elevating, contradicting test #1's base-role-rejection gate). Under `INHERIT FALSE`, `telecheck_app_role` can `SET ROLE bind_actor_context_role` but does NOT silently inherit its EXECUTE privilege under its base identity — every invocation MUST pass through the canonical `SET LOCAL ROLE bind_actor_context_role; CALL bind_actor_context(...); RESET ROLE;` pattern. Has SELECT on `_session_actor_context` ONLY via the helper functions (which themselves are `SECURITY DEFINER` and read from the table on the app role's behalf). Test #1 asserts: (a) base-role invocation raises `permission denied` (proves NOINHERIT is enforced); (b) post-`SET LOCAL ROLE` invocation succeeds; (c) `telecheck_app_role` cannot directly DML the table even after `SET LOCAL ROLE bind_actor_context_role` — only the procedure's `SECURITY DEFINER` runtime owner (`_session_actor_context_owner`) can.

The trust anchor is the table-owner separation, NOT a role-membership barrier. Even an attacker that compromises `telecheck_app_role` SQL execution (e.g., via a SQLi vuln in a route handler) cannot directly INSERT into `_session_actor_context` because no `SET ROLE` chain reaches `_session_actor_context_owner`; the attacker can only invoke `bind_actor_context()`, which enforces the JWT-derived inputs server-side.

**`bind_actor_context()` SECURITY DEFINER procedure.** The ONLY write path. Owned by `_session_actor_context_owner` (the table-owner NOLOGIN role with no membership grants out; updated per Codex R14 closure — the prior phrasing "owned by `bind_actor_context_role`" was incorrect, because if the procedure ran as that role rather than the table-owner role it could not perform the DML it needs and the trust-anchor separation would collapse into a single privilege tier). The procedure runs with `SECURITY DEFINER` + `SET search_path = pg_catalog, pg_temp` + schema-qualified references throughout. `EXECUTE` on the procedure is granted ONLY to `bind_actor_context_role`. The procedure:
1. Verifies the session-liveness gate (revoked/missing/expired sessions raise `identity.session_liveness_check_failed` Cat B audit + fail-closed `throw UnauthenticatedError()` ordering — liveness check fires BEFORE the bind row INSERT, never after).
2. Computes `nonce_hash` server-side from the caller-supplied request nonce; the raw nonce is discarded immediately. The same nonce is also published into the session via `SET LOCAL app.request_nonce = <nonce>` so that the helper functions can locate the bound row by `(pg_backend_pid(), txid_current(), app.request_nonce)`.
3. UPSERTs into `_session_actor_context` keyed on the composite `(pg_backend_pid, txid)` with `bound_at = NOW()`, `expires_at = NOW() + INTERVAL '5 minutes'`. The PK choice ensures that a backend pid recycled within the TTL cannot serve a stale row to a different transaction.
4. Emits `identity.actor_context_bound` Cat B audit via a **rollback-independent commit path** that survives request-transaction rollback. Implementation: the audit write is performed on a SEPARATE database connection that opens, writes, and commits the audit row BEFORE control returns to the request-transaction code path that may later roll back. Two concrete patterns are canonical (Codex SC6 PR #10 R2 round-3 HIGH finding closure 2026-05-18 — the previously-specified `pg_notify` path was rolled back to the drawing board because PostgreSQL's NOTIFY delivery is transactional and a NOTIFY issued inside the request transaction is suppressed on rollback):
   - **Application-side path (preferred for events emitted from the Fastify plugin layer — `identity.actor_context_bound` + `identity.session_liveness_check_failed`):** the authContextPlugin holds a dedicated `auditWriterPool` (separate Fastify connection pool, separate transaction lifecycle, authenticated as `audit_writer_role`). After `bind_actor_context()` returns (or after the liveness-check step fails), the plugin acquires a connection from `auditWriterPool`, inserts the audit row, commits, and releases the connection — all before allowing the request transaction to proceed or to roll back. The audit commit is independent of the request transaction's outcome.
   - **Procedure-side path (required for events emitted from inside SECURITY DEFINER procedures whose own transaction will roll back — `identity.actor_context_unbound_rejected`):** the failing procedure uses `dblink_exec('audit_writer_loopback', $$INSERT INTO audit_events ... $$, true)` to write the audit row through a `dblink` loopback connection authenticated as `audit_writer_role` BEFORE raising the exception that causes its enclosing transaction to roll back. `dblink_exec` runs in its own transaction over the loopback connection, so the audit row commits independently of the calling procedure's transaction outcome.

   In both patterns, I-027 attribution is preserved because the audit row's actor/account/session fields are derived from the audit `detail` payload (carried over from the bound context or from the liveness-check JWT claims), NOT from the `audit_writer_role` connection's own identity. The role exists only to scope the audit-writer's grant surface; it is not the audit's authoritative actor.

   **Fail-closed semantics on audit-writer failure (Codex SC6 PR #10 R4 round-4 MEDIUM finding closure 2026-05-18):** if the rollback-independent audit commit fails (connection acquisition fails, INSERT raises, COMMIT fails, dblink_exec raises, etc.), the binding/procedure path MUST fail closed BEFORE any PHI-touching work proceeds. Concrete semantics by emission point:
   - **`identity.actor_context_bound` (application-side):** if the `auditWriterPool` commit fails AFTER the `bind_actor_context()` UPSERT succeeded, the authContextPlugin MUST raise `AuditAnchorUnavailableError` → Fastify error-envelope plugin maps to **tenant-blind 503 per I-025** → the request transaction rolls back (the binding row is discarded by ROLLBACK; no orphan state). PHI-touching work in the route handler never executes because the plugin's error short-circuits the request before `done()` is called.
   - **`identity.session_liveness_check_failed` (application-side, pre-bind) — fail-closed with durable backstop on a dedicated audit-backstop instance (Codex SC6 PR #10 R5 round-5 HIGH + R6 round-6 HIGH closures 2026-05-18):** if the primary `auditWriterPool` commit fails, the plugin MUST fall through to a **durable backstop audit path** before returning the 401. The backstop is **not** local-disk file storage; the prior `audit_backstop.log` file design was rolled back in Codex round 6 because local FS is node-local in multi-instance deployments and acknowledged audit loss windows are not acceptable for regulated platforms. The canonical backstop is a **dedicated `audit_backstop` PostgreSQL instance**: a separate WAL-backed PostgreSQL deployment reachable independently from primary (different network path, different failure domain from the primary audit instance), with `synchronous_commit = on` and a dedicated `auditBackstopPool` in the Fastify app. Each backstop write commits synchronously to the backstop instance's WAL before control returns; the backstop's own hash-chain partition (`identity_lifecycle_backstop`, distinct from primary's `identity_lifecycle`) maintains internal append-only integrity. A separate `audit_backstop_ingest` worker continuously drains the backstop instance into primary `audit_events` once primary connectivity is restored; the drain emits a `recovery_link` checkpoint event (Cat B governance) into the PRIMARY `identity_lifecycle` chain that references the backstop chain head (`backstop_chain_head_audit_id` + `backstop_partition_id` + `backstop_drain_range_start..end`). This preserves primary-chain append-only ordering (no late inserts into the primary chain; the backstop chain is the source-of-truth for events recorded during the outage, and the recovery_link event is the cross-chain bridge auditors walk). If even the backstop instance commit fails (extreme — both audit infrastructures degraded simultaneously), the plugin MUST raise `AuditAnchorUnavailableError` → tenant-blind **503** + critical ops alert. Patient-visible outcome under healthy primary path: 401. Under primary failure + healthy backstop: 401 (backstop durable; recovery_link bridges chains at drain). Under both-fail: 503.
   - **`identity.actor_context_unbound_rejected` (procedure-side, via `dblink_exec`) — fail-closed with durable backstop on the same dedicated `audit_backstop` instance, symmetric to the liveness-failed path:** if `dblink_exec` against the primary audit loopback raises, the SECURITY DEFINER procedure MUST fall through to a second `dblink_exec` invocation against a `audit_backstop_loopback` connection that targets the dedicated `audit_backstop` instance (NOT the unsafe UNLOGGED-table-with-flush-trigger or `COPY ... TO PROGRAM` designs that the prior framing specified — those were rolled back in Codex round 6 because UNLOGGED tables are not WAL-backed, 1-second flush windows allow acknowledged audit loss, and `COPY ... TO PROGRAM` requires elevated server privileges typically disabled in managed Postgres). The backstop `dblink_exec` writes the audit envelope through a `synchronous_commit = on` connection on the dedicated audit-backstop instance. Whether primary OR backstop write succeeds, the procedure THEN raises the original `actor_context_unbound`/`request_nonce_unbound_or_expired` exception so the calling transaction rolls back; the audit row survives independently. If BOTH primary AND backstop `dblink_exec` invocations raise, the procedure raises the original exception WRAPPED with `caused_by audit_anchor_failure` AND the request-envelope plugin maps the wrapped exception to a tenant-blind **503** + critical ops alert (NOT the original procedure-level envelope).

   **Hash-chain ordering across primary + backstop partitions (Codex round-6 R1 HIGH closure 2026-05-18):** events recorded in the backstop instance during a primary outage are NEVER back-inserted into the primary `identity_lifecycle` partition. The backstop's own `identity_lifecycle_backstop` partition is append-only with its own `previous_hash` + `sequence_number` discipline; primary continues its own chain unaffected during the outage. When primary connectivity restores, the `audit_backstop_ingest` worker drains the backstop chain into a quarantined holding area, then emits a single `identity.audit_recovery_link` checkpoint event (added v5.4 patch per Codex round-6 closure; see AUDIT_EVENTS v5.4 amendment) into the PRIMARY `identity_lifecycle` partition. The checkpoint references `backstop_partition_id`, `backstop_chain_head_audit_id`, `backstop_chain_tail_audit_id`, `outage_window_start`, `outage_window_end`, and `recovered_event_count`. Forensic walks across the outage period walk the primary chain → encounter the recovery_link → cross into the backstop chain segment → walk to the backstop chain tail → return to the primary chain after the recovery_link. Append-only integrity holds in both chains; no rewrites; no out-of-order primary inserts. Operational invariant: only one outage window may be active per partition at a time (concurrent outages serialize on the backstop instance's connection-pool admission control).

   **Deployment posture (operational discipline reference for the audit-backstop instance; informational, not normative — referenced from Operational Readiness Tracker v1.5):** the audit-backstop PostgreSQL instance is deployed in a different AZ from the primary audit instance (us-east-1a primary; us-east-1b backstop within us-east-1 per ADR-026), runs with its own RDS/Aurora-class managed configuration, has `synchronous_commit = on` and `synchronous_standby_names = '*'` on its own multi-AZ replication, and is reachable from Fastify via a dedicated `auditBackstopPool` (separate IAM role; separate VPC security group). It does NOT replicate to/from primary; the two are independent durability surfaces. Outage-window detection + drain orchestration are owned by the `audit_backstop_ingest` worker, which is single-writer-per-partition via advisory-lock topology.
   - **Principle:** the audit anchor is treated as part of the request's critical path, not as a fire-and-forget side effect. No PHI mutation can commit unless its audit anchor has already committed independently. This preserves I-003 (audit completeness) + I-027 (audit attribution) under all failure modes.

**Helper functions (read from table, NOT from GUCs for identity).** `current_actor_account_id()`, `current_actor_tenant_id()`, `current_actor_role()`, `current_actor_admin_home_tenant_id()` — each `STABLE` SQL functions that SELECT the binding row for the composite key **`(pg_backend_pid(), txid_current(), current_setting('app.request_nonce'))`** and return the respective column; raise `actor_context_unbound` if no row exists, if the stored `nonce_hash` does not match the SHA-256 of the GUC-supplied nonce, or if `expires_at < NOW()`. `app.request_nonce` is the ONLY GUC the helpers consume — and only as a row-lookup key — because the actual identity columns are read from the locked-down table, not from caller-settable GUCs. Other `SET LOCAL app.*` values are ignored.

**`assert_request_nonce_bound()` helper.** Mutating SECURITY DEFINER procedures MUST call `assert_request_nonce_bound()` as their first statement. The helper validates the composite tuple `(pg_backend_pid(), txid_current(), app.request_nonce)` resolves to an unexpired row with a matching `nonce_hash`; raises `request_nonce_unbound_or_expired` if any component is missing or expired (emitting `identity.actor_context_unbound_rejected` Cat B audit with `procedure_name`, `rejection_code`, `nonce_hash`, `pg_backend_pid`, `txid`, `attempted_at`).

**Cleanup mechanism (defense in depth) — revised v1.1 patch 2026-05-18 per Codex SC6 PR #10 R2 round-2 MEDIUM finding closure to reflect PostgreSQL's actual transaction-trigger semantics (CONSTRAINT TRIGGERs fire at COMMIT only, NOT ROLLBACK):**
1. **COMMIT-time CONSTRAINT TRIGGER** (DEFERRABLE INITIALLY DEFERRED) on `_session_actor_context` that fires at COMMIT and DELETEs the binding row keyed by the composite `(pg_backend_pid, txid)`. Primary cleanup path for the happy commit case; because the PK includes `txid`, a pid recycled into a new transaction cannot inadvertently delete or read a prior transaction's row.
2. **ROLLBACK case requires no explicit cleanup** because PostgreSQL discards the row inserted in the rolled-back transaction automatically. The composite-key discriminator ensures a recycled `pg_backend_pid` on a new transaction resolves to a fresh `(pg_backend_pid, txid)` tuple regardless of what the prior aborted transaction inserted.
3. **60-second background sweeper** (`pg_cron` or equivalent) that DELETEs rows where `expires_at < NOW()`. Catches edge cases the CONSTRAINT TRIGGER missed (backend crash between INSERT and COMMIT-time trigger; manual transaction termination via `pg_terminate_backend()` that bypasses the trigger; rare deferred-trigger ordering edge cases).
4. **5-minute `expires_at` TTL** enforced at helper-function read time (raises `actor_context_unbound` even if rows physically remain). Final defense-in-depth layer regardless of physical-row cleanup state.

**`authContextPlugin` wiring (Fastify) — role-elevation discipline (Codex PR #10 R12 round-12 HIGH closure 2026-05-18; the prior wording "calls `bind_actor_context()` over the request-scoped DB connection" was incomplete and would have caused every authenticated request to fail at the EXECUTE GRANT gate because `telecheck_app_role` has zero EXECUTE on `bind_actor_context()` per Sub-decision #1 + the test #1 GRANT enforcement gate; the canonical invocation path is now explicit below):** the plugin is registered globally and runs as the first `onRequest` hook. It:
1. Extracts and verifies the access-token JWT (signature + expiry + audience).
2. Resolves `account_id` / `tenant_id` / `role` / `admin_home_tenant_id` / `session_id` from the JWT claims + a session-liveness check against the `auth.sessions` table (revoked/expired sessions short-circuit with `UnauthenticatedError` and emit `identity.session_liveness_check_failed`).
3. Calls `bind_actor_context()` via **role elevation on the SAME request-scoped DB connection that will execute the request transaction** (single-connection invariant; the dedicated-bindingPool alternative previously mentioned is REJECTED per Codex PR #10 R13 round-13 HIGH closure 2026-05-18 because the binding row is keyed by the composite `(pg_backend_pid(), txid_current(), app.request_nonce)` — a separate pool connection would insert a row keyed by the binding connection's backend pid/txid, NOT the request handler's, leaving downstream SECURITY DEFINER procedures running on `request.db` unable to find any bound actor context and failing closed). The canonical pattern: `SET LOCAL ROLE bind_actor_context_role; CALL bind_actor_context(...); RESET ROLE;` all on the request-scoped connection and inside the request transaction, BEFORE any PHI-touching statement runs in the route handler. `SET LOCAL ROLE` is scoped to the transaction and reverts automatically on commit/rollback; the explicit `RESET ROLE` after the CALL is defense-in-depth to guarantee the request handler executes under `telecheck_app_role`. The membership grant `GRANT bind_actor_context_role TO telecheck_app_role WITH INHERIT FALSE, SET TRUE;` (PostgreSQL 16+ per-grant options) is created in the SI-010 migration so the `SET LOCAL ROLE` succeeds while base-identity invocation remains denied; the EXECUTE grant on `bind_actor_context()` remains restricted to `bind_actor_context_role` only (so explicit role elevation is the only way the binding fires; the app role cannot invoke the procedure under its base identity even though it is a member of the EXECUTE-holding role, because `INHERIT FALSE` disables silent privilege inheritance).
4. Registers an `onResponse` cleanup hook that confirms the CONSTRAINT TRIGGER fired (defensive belt-and-suspenders; logs an `identity.actor_context_unbound_rejected` if it discovers a leaked binding).

**Mandatory regression test gate (7 tests).** No PR may merge against this contract without all seven green:
1. `bind_actor_context()` rejects calls from any role other than `bind_actor_context_role`. Specifically: a call invoked under `telecheck_app_role` (base identity, no `SET LOCAL ROLE` elevation) raises `permission denied` on the EXECUTE check; a call invoked under `telecheck_app_role` AFTER `SET LOCAL ROLE bind_actor_context_role` succeeds; a call invoked from a hostile role with no `bind_actor_context_role` membership grant cannot elevate (the `SET ROLE` itself fails) and therefore cannot invoke the procedure. The membership grant `GRANT bind_actor_context_role TO telecheck_app_role` is asserted to exist post-migration; the EXECUTE grant on `bind_actor_context()` is asserted to be restricted to `bind_actor_context_role` only. **Three-role layering integrity (Codex R14 round-14 HIGH closure 2026-05-18):** assert that `telecheck_app_role` CANNOT directly INSERT/UPDATE/DELETE `_session_actor_context` even after `SET LOCAL ROLE bind_actor_context_role` — that role has no DML grants on the table; only `_session_actor_context_owner` (the table-owner NOLOGIN role, which has no membership grants out) holds DML. Assert that no `SET ROLE` chain from `telecheck_app_role` reaches `_session_actor_context_owner`. Assert that a SQLi-class attacker holding `telecheck_app_role` SQL execution can only invoke `bind_actor_context()` (not directly write rows); the procedure's JWT-derived input validation is the only authorized write path.
2. Helper functions raise `actor_context_unbound` after `expires_at` passes (5-min TTL).
3. CONSTRAINT TRIGGER deletes the binding row on COMMIT (PostgreSQL's native ROLLBACK behavior discards the row automatically; the test asserts both code paths leave the table empty for the test session's `(pg_backend_pid, txid)` after transaction close).
4. Mutating procedure without `assert_request_nonce_bound()` raises `request_nonce_unbound_or_expired` and emits Cat B audit.
5. Connection-pool reuse: after session A's transaction commits and pgbouncer hands the connection to session B, session B sees `actor_context_unbound` until its own `bind_actor_context()` call completes — validated by composite `(pg_backend_pid, txid)` discrimination (a new transaction on the same backend pid resolves to a different `txid_current()`, so a leaked row from a prior transaction is unreachable via the helpers).
6. **Rollback-durable audit (Codex round-3 closure 2026-05-18):** open a request transaction, successfully bind via `bind_actor_context()` + emit `identity.actor_context_bound` via the application-side audit-writer pool, then ROLLBACK the request transaction; assert the audit row still exists in `audit_events`. Repeat for the procedure-side path: invoke a mutating SECURITY DEFINER procedure under a bound context, force a failure path that emits `identity.actor_context_unbound_rejected` via `dblink_exec`, let the procedure raise + roll back its enclosing transaction; assert the audit row still exists. Both paths MUST persist the audit row after rollback.
7. **Fail-closed on audit-writer failure with durable backstop instance + hash-chain integrity + recovery_link emission resilience (Codex round-4 + round-5 + round-6 + round-7 + round-11 closures 2026-05-18; split into 7A (3 binding-path events) + 7B (recovery_link checkpoint) per round-11 MEDIUM closure to reflect the distinct writer + correlation model):**

   **Test 7A (binding-path events — `identity.actor_context_bound`, `identity.session_liveness_check_failed`, `identity.actor_context_unbound_rejected`):** simulate `auditWriterPool` primary failure (connection pool exhausted, INSERT raises, COMMIT raises) AND simulate `dblink_exec` primary loopback failure (loopback down, `audit_writer_role` grants revoked) across all **three** binding-path identity-lifecycle events. Test in four sub-scenarios per event: (i) **primary path healthy** → audit row commits to primary `audit_events`, `previous_hash`/`sequence_number` extend the primary `identity_lifecycle` chain in arrival order, expected client envelope (200/401/procedure-error). (ii) **primary fails, backstop instance healthy** → audit row commits synchronously to the dedicated audit-backstop PostgreSQL instance (`auditBackstopPool` for plugin-layer; second `dblink_exec` to `audit_backstop_loopback` for procedure-side); the backstop instance's `identity_lifecycle_backstop` partition extends its own chain in arrival order with its own `previous_hash`/`sequence_number`; client envelope unchanged from healthy-path expectation. (iii) **primary recovers; backstop drain emits `identity.audit_recovery_link` checkpoint** into the PRIMARY `identity_lifecycle` partition referencing the backstop chain head + tail + outage window; primary chain remains append-only (no rewrites, no out-of-order inserts); assert a forensic walk from primary chain → recovery_link → backstop chain segment → backstop tail → return to primary post-recovery covers ALL events emitted during the outage. **Concurrent-primary-write coverage:** assert that primary `identity_lifecycle` writes that occur WHILE backstop is active extend the primary chain unaffected (backstop ingest does NOT pause primary writes; recovery_link emits AFTER primary catches up, bridging chains without rewriting either). (iv) **both primary and backstop fail simultaneously** (extreme — both audit infrastructures degraded) → client receives tenant-blind 503 + critical ops alert on the `audit_anchor_failure` channel; no `_session_actor_context` row remains; no PHI-touching mutation in the route handler commits; for procedure-side: original error WRAPPED with `caused_by audit_anchor_failure` mapped to 503 (NOT the original procedure-level envelope). Test 7A gate asserts: (a) I-003 audit completeness holds across all 4 sub-scenarios — no rejection occurs without a durable audit trace on EITHER chain; (b) hash-chain integrity invariants hold on both partitions (each chain's `sequence_number` strictly monotone; each row's `previous_hash` matches the prior row's chain-hash; no rewrites; no out-of-order inserts). Test 7A does NOT assert anything about `identity.audit_recovery_link` — that event has a distinct writer + correlation model + durability path covered by Test 7B below.

   **Test 7B (`identity.audit_recovery_link` checkpoint — distinct writer / correlation / durability model per round-11 closure):** scenario covers ONLY the `audit_backstop_ingest` worker emitting the recovery_link checkpoint into the PRIMARY `identity_lifecycle` partition after backstop drain. The worker is NOT invoked from a request transaction, has NO client envelope, and MUST NOT write the recovery_link to the `identity_lifecycle_backstop` chain (the bridge always lands in primary; otherwise the bridge has no anchor for the next-outage forensic walk). Sub-scenarios: (i) **primary available at drain time** → recovery_link commits to primary `identity_lifecycle` at the end of the partition's current chain head; `previous_hash`/`sequence_number` extend in arrival order; resource_id = **3-part composite `(backstop_partition_id, outage_window_start, partition_key)`** (per Codex R19 round-19 HIGH closure; partition_key = concrete `account_tenant_id` for per-tenant checkpoints, `_PLATFORM_` for the multi-tenant aggregate); backstop chain ranges + outage timestamps populated; worker logs success. (ii) **primary unavailable at recovery_link emission time** (drain ready, but primary `identity_lifecycle` partition's audit-writer surface still in outage) → worker retries with exponential backoff against primary; no write to backstop chain; worker advances retry queue. (iii) **primary recovers mid-retry** → recovery_link commits at end of retry queue against the then-current primary chain head (NOT back-inserted into the historical position; concurrent primary `identity_lifecycle` writes during the retry window are unaffected). (iv) **idempotency on resource_id collision** → a recovery_link for the same **3-part composite `(backstop_partition_id, outage_window_start, partition_key)`** (where `partition_key` is the per-checkpoint tenant discriminator — a concrete `account_tenant_id` or the `_PLATFORM_` sentinel for the multi-tenant aggregate; extended from 2-part to 3-part per Codex R19 round-19 HIGH closure 2026-05-18 to avoid collision across per-distinct-tenant checkpoints emitted for multi-tenant outage windows) already in primary causes the worker to no-op rather than emit a duplicate; multiple worker instances racing on the same outage window converge to one canonical checkpoint set (per-tenant + aggregate `_PLATFORM_`) via advisory-lock serialization + idempotency-on-3-part-resource_id check. Test 7B gate asserts: (a) recovery_link references valid backstop chain endpoints (chain head + tail + outage window); (b) recovery_link lands in PRIMARY `identity_lifecycle` partition, never in `identity_lifecycle_backstop`; (c) advisory-lock topology serializes concurrent ingest attempts (only one drain proceeds per outage window); (d) idempotency-on-resource_id collision prevents duplicate emissions; (e) the worker never invokes `auditWriterPool` or `dblink_exec` to the procedure-side loopback (those are request-path writers; the recovery_link writer uses its own primary-audit connection that is independent of the request-path pools).

**Reference contract.** See `telecheck-app/docs/SI-010-Session-Actor-Context-DB-Binding.md` (v0.6 source-of-truth design doc; the canonical executable contract is the migration set landing in the telecheck-app repo).

---

## 4. Clinician authentication

### 4.1 Clinician registration

Clinicians are onboarded by an operator (not self-service at launch). The onboarding process:

1. Operator creates clinician account with: full name, medical license number, country_of_licensure, specialty, contact details
2. **License verification.** Operator verifies the medical license against the relevant medical council registry (Ghana Medical and Dental Council for Ghana). Verification is recorded in audit (Category B).
3. Clinician receives login credentials via secure channel
4. Clinician completes first login with OTP + password setup
5. Clinician account is active

### 4.2 Clinician session

Clinicians authenticate with phone number + password + OTP (three-factor for clinical accounts). Session parameters:

| Parameter | Value |
|---|---|
| Access token TTL | 15 minutes |
| Refresh token TTL | 8 hours (shift-aligned) |
| Maximum concurrent sessions | 1 (single active session) |
| Inactivity timeout | 5 minutes |
| Re-authentication | Required for every prescribing action, signal override, and protocol-authorized approval |

### 4.3 Credential expiry

Clinician accounts are tied to their medical license. License expiry dates are tracked. 30 days before expiry, the clinician and their operations manager receive a renewal reminder. On expiry day, the clinician's ability to approve clinical actions is suspended until the license is renewed and re-verified.

---

## 5. Delegate authentication

Delegates authenticate with their own account (separate phone number, separate OTP). After authentication, a delegate can switch to a delegated patient's context if they hold an active delegation with appropriate scope.

The delegate's access token includes `active_delegation: { patient_id, scope }` when operating in delegated context. All actions in delegated context carry the delegate's identity (I-018).

---

## 6. Operator and admin authentication

Operators authenticate with email + password + OTP (three-factor). All operator sessions are logged in audit (Category B). Operator accounts are provisioned by the engineering lead or designated admin.

---

## 7. Rate limiting

| Endpoint | Limit | Lockout |
|---|---|---|
| OTP request | 5 per phone number per hour | 1-hour cooldown after limit |
| OTP verification | 3 attempts per OTP | 15-minute cooldown, new OTP required |
| Login attempt | 10 per phone number per hour | 1-hour lockout |
| Password attempt (clinician) | 5 per account per hour | 1-hour lockout, admin notification |
| API requests (authenticated) | 100 per minute per session | 429 response, 60-second cooldown |

---

## 8. Identity verification for clinical transactions

For high-value clinical transactions (first prescription in a program, controlled substance programs if/when added), the platform may require enhanced identity verification:

1. **Photo ID verification.** Patient uploads a photo of their Ghana Card or passport. OCR extracts name and DOB. Compared against account profile.
2. **Liveness check.** Patient takes a selfie. Compared against the photo ID to confirm the person submitting is the person on the ID.

At Ghana launch, enhanced verification is **not required** for standard programs (GLP-1, ED, chronic care). It is designed as an activation for future programs or regulatory requirements.

---

## 9. Audit

| Event | Category | Detail |
|---|---|---|
| Account created | C | patient_id, registration_method, country_of_registration |
| Login successful | C | user_id, device_info, ip_hash |
| Login failed | C | user_identifier, failure_reason, attempt_count |
| OTP sent | C | phone_number_hash, channel (SMS) |
| Phone number changed | B | old_number_hash, new_number_hash, verification_method |
| Clinician license verified | B | clinician_id, license_number, verifying_operator, council_name |
| Clinician license expired | B | clinician_id, expiry_date, suspension_applied |
| Account recovery | B | patient_id, recovery_method, support_agent_id |
| Biometric enabled/disabled | C | user_id, device_id, biometric_type |
| Session forced logout | C | user_id, reason (device limit, admin action) |

---

## 10. Dependencies

- **SMS provider** — OTP delivery (separate from WhatsApp Business API; reliable SMS is critical for authentication)
- **CCR-RUNTIME** — phone number format, country-specific identity requirements
- **RBAC Permissions Matrix** — role assignment after authentication
- **Consent & Delegated Access Slice** — platform consent at registration; delegation context in tokens
- **Notification Spec** — OTP templates, security alert templates

---

## Document control

- **v1.0** — Initial Identity & Authentication specification. Defines patient registration (phone + OTP), authentication (OTP + optional biometric), session management (JWT + refresh token), clinician three-factor auth with license verification, delegate authentication, rate limiting, and identity verification for clinical transactions. Designed for Ghana launch with extensibility for future markets and enhanced verification.
