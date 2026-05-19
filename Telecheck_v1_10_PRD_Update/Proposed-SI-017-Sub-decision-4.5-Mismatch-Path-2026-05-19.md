# PROPOSED SI-017 Sub-decision 4.5 — tenant-claim-mismatch path (A2 + B2 + C; 2026-05-19)

**Status:** PROPOSED — awaiting Evans's ratification of SI-017-OQ-MISMATCH A2+B2+C.
**Target file:** `Telecheck_v1_10_PRD_Update/SI-017-Phase-2-F3-JWT-Liveness-Canonical-Middleware-GUC-Model.md`
**Insertion point:** between current Sub-decision 4 (line ~110 after R2 STOP-and-queue reframe) and Sub-decision 5 (line ~112).
**Authority:** application requires Evans's chat-message ratification per CLAUDE.md hard-floor item 3.

---

## 1. Verbatim text to insert as new Sub-decision 4.5

> ### Sub-decision 4.5: Tenant-claim mismatch path = separate Cat A `identity.session_jwt_tenant_id_mismatch` event, partitioned by session-row-tenant, with merge-blocking regression test
>
> **Adoption:** A2 + B2 + C per `Decision-Memo-SI-017-OQ-MISMATCH-A2-B2-C-Adopted-2026-05-19.md` (ratified per Evans's chat-message confirmation; date filled in at apply time).
>
> **Scenario.** When the authContextPlugin's JWT verify step succeeds AND `auth.sessions.tenant_id IS DISTINCT FROM` JWT `tenant_id` claim. This indicates a JWT-replay-class attack signal: someone replayed a valid JWT against a session_id that belongs to a different tenant.
>
> **Decision (A2 — Cat A category).** The mismatch path emits a NEW dedicated audit event `identity.session_jwt_tenant_id_mismatch` in Cat A (not folded into the routine Cat B `identity.session_liveness_check_failed` event). Cat A elevation makes the event eligible for SOC monitoring + threat-intelligence pipelines that filter Cat B governance noise. The session IS technically "live" — failure is not a state issue — so a separate event is more accurate than overloading the liveness-failure event.
>
> **Decision (B2 — session-row-tenant partition).** The event is partitioned per SI-018 P2 (tenant-governance) keyed on **`auth.sessions.tenant_id` (the legitimately-owning session-row-tenant; NOT the attacker-supplied `tenant_id_claimed`)**. `chain_partition_key = SHA-256("GENESIS:TENANT:<auth.sessions.tenant_id>")`. Rationale: places the attack signal under the legitimate session-owner's audit chain; prevents attacker-controlled partition placement. The legitimate tenant's SOC sees the attack on their chain; the attacker-claimed tenant has no log entry (they aren't the actual session owner).
>
> **Decision (C — merge-blocking regression test).** A merge-blocking integration test (added to §7 below) asserts the category + partition + envelope shape. CI fails the PR if the test fails. Future SECURITY DEFINER procedure additions touching tenant-attribution surfaces inherit this regression-test pattern by reviewer convention.
>
> **Cat A envelope rules.**
>
> - `action_id`: `identity.session_jwt_tenant_id_mismatch`
> - `category`: A
> - `severity`: ELEVATED
> - `target_patient_id`: NULL (governance + attack-signal event; not patient-scope)
> - `tenant_id` envelope field: **`auth.sessions.tenant_id`** (session-row-tenant; per B2)
> - `resource_type`: `'session'`
> - `resource_id`: the JWT `session_id`
> - `chain_partition_key`: `SHA-256("GENESIS:TENANT:<auth.sessions.tenant_id>")` (per B2)
>
> **Detail payload.**
>
> ```json
> {
>   "session_id":            "<JWT session_id>",
>   "account_id":            "<JWT account_id>",
>   "tenant_id_claimed":     "<JWT tenant_id claim — the attacker-supplied value>",
>   "tenant_id_actual":      "<auth.sessions.tenant_id — the session's legitimate owner>",
>   "checked_at":            "<ISO 8601>",
>   "pg_backend_pid":        "<pg_backend_pid()>",
>   "client_ip":             "<request source IP>",
>   "user_agent":            "<request User-Agent>"
> }
> ```
>
> **Audit-emission pattern.** Application-layer audit-writer pool connection (same pattern as Sub-decision 4). The audit INSERT commits BEFORE the 401 response is sent. Audit-write failure → 503 + P0 ops alert (same fail-closed posture as Sub-decision 4).
>
> **Response shape.** The mismatch path returns the SAME 401 + opaque payload as a routine liveness-check failure. No information-leak differentiation. Attacker cannot distinguish "session live but tenant claim wrong" from "session revoked" via response timing or shape. This is intentional: a differentiating response would itself be an information-leak surface that the attacker could probe.
>
> **P0 ops alert.** ALSO raised (in addition to the audit event). Mismatch is an attack-signal-class event worth on-call attention; the alert payload includes `tenant_id_claimed`, `tenant_id_actual`, `session_id`, `account_id`, `client_ip`, `user_agent` for IR triage.
>
> **Mutually exclusive with Sub-decision 4's routine event.** The authContextPlugin MUST NOT emit BOTH `identity.session_liveness_check_failed` AND `identity.session_jwt_tenant_id_mismatch` for the same request. The mismatch path is a TERMINAL branch: if `auth.sessions.tenant_id IS DISTINCT FROM tenant_id_claimed`, emit ONLY the Cat A mismatch event; do NOT also emit the routine Cat B liveness event. (This is enforced by the regression test in §7.)

## 2. Verbatim text to insert into §7 (regression test list)

Append new merge-blocking test entry:

> **Test 7.X (MERGE-BLOCKING) — Tenant-claim mismatch routing (Sub-decision 4.5).**
>
> **Setup.** tenant_A has session S_A with `auth.sessions.tenant_id = tenant_A`. Attacker forges a JWT with valid signature, `session_id = S_A`, `tenant_id = tenant_B`. authContextPlugin processes the request.
>
> **Assertions.**
>
> 1. Request rejected with 401 + opaque payload (matches the response shape of a routine `failure_reason = 'revoked'` liveness failure; assert via byte-level equality of the response body between the two test fixtures).
> 2. `audit_events` table contains EXACTLY ONE new row matching the mismatch event:
>    - `action_id = 'identity.session_jwt_tenant_id_mismatch'`
>    - `category = 'A'`
>    - `severity = 'ELEVATED'`
>    - `tenant_id = tenant_A` (session-row-tenant; NOT tenant_B claim-side)
>    - `chain_partition_key = SHA-256("GENESIS:TENANT:tenant_A")` (assert exact value via hex)
>    - `detail.tenant_id_claimed = tenant_B`
>    - `detail.tenant_id_actual = tenant_A`
>    - `target_patient_id IS NULL`
> 3. `audit_events` table contains ZERO rows with `action_id = 'identity.session_liveness_check_failed'` for this request (the routine Cat B event is suppressed on the mismatch path; mutually exclusive per Sub-decision 4.5).
> 4. P0 ops alert raised exactly once with payload containing `tenant_id_claimed`, `tenant_id_actual`, `session_id`, `account_id`, `client_ip`, `user_agent`.
>
> **Variant tests** (same merge-blocking scope):
>
> - 7.X.1: tenant_B is a real tenant (not just a fabricated string) — assertion that the mismatch event lands in tenant_A's chain, not tenant_B's, even though both partitions exist in audit_events.
> - 7.X.2: tenant_A == tenant_B (no mismatch) — assertion that the routine Cat B liveness event fires (not the Cat A mismatch event); failure reason 'revoked' or equivalent.
> - 7.X.3: session_id doesn't exist (`failure_reason = 'missing'`) — assertion that the routine Cat B liveness event fires (not the Cat A mismatch event); the mismatch path requires session-row-existence as a precondition.

## 3. Status block update (after ratification)

Remove from BLOCKED-PENDING list: `+ EVANS-SI-017-OQ-MISMATCH-RATIFIER-DECISION`.

Add: `+ A2+B2+C ratified per Decision Memo 2026-05-19; OQ-MISMATCH closed; Sub-decision 4.5 + §7 Test 7.X applied.`

Update §6 OQ3 (SI-017-OQ-MISMATCH): mark RESOLVED with pointer to Sub-decision 4.5 + Decision Memo.

## 4. §5 Cross-artifact impact update (after ratification)

Update AUDIT_EVENTS impact: SI-017 ratification now adds **2 action IDs** (was 1):
- `identity.session_liveness_check_failed` (Cat B; original Sub-decision 4)
- `identity.session_jwt_tenant_id_mismatch` (Cat A; new Sub-decision 4.5 + Decision Memo)

Version bump destination unchanged (single ratification ceremony; v5.4 → v5.5 if SI-018 lands v5.3 → v5.4 first).

---

— Claude (Opus 4.7, 1M context), PROPOSED Sub-decision 4.5 + §7 Test text authored 2026-05-19 under non-ratification autonomous-work authorization.
