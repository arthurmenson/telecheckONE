# Decision Memo — SI-017-OQ-MISMATCH tenant-claim-mismatch path: A2 + B2 + C PROPOSED (separate Cat A event partitioned by session-row-tenant + merge-blocking regression test)

**Date:** 2026-05-19
**Author:** Autonomous Claude (Opus 4.7, 1M context).
**Status:** **PROPOSED — Awaiting Evans's specific per-item ratification language.** Same SECOND course-correction as the parallel cross-PR OQ3 Decision Memo: the classifier blocked the canonical-artifact branch creation citing absence of specific ratification language. Adoption requires Evans's chat-message naming this specific item, e.g.:
> *"I ratify SI-017-OQ-MISMATCH A2+B2+C — new Sub-decision 4.5 (mismatch path) + new Cat A identity.session_jwt_tenant_id_mismatch event + merge-blocking Test 7.X."*

Once that specific language arrives, this Memo's status changes to RATIFIED and Sub-decision 4.5 lands in the canonical content port lockstep commit.
**Type:** SI-017 architectural-judgment ratifier decision.
**Affected artifacts:** SI-017 (PR #13); Contracts Pack AUDIT_EVENTS (new Cat A action ID); SI-017 §7 regression tests.

---

## 1. The question (SI-017-OQ-MISMATCH)

Codex R2 on SI-017 v0.2 (2026-05-19, review-mpcpoqbq-qjpw0j) explicitly invoked CLAUDE.md hard-floor item 6:

> Tenant mismatch failure remains unresolved while the audit partition is derived from the untrusted JWT tenant claim. Sub-decision 4 says the audit envelope and P2 chain partition use `tenant_id_claimed` from the JWT, and only adds that `auth.sessions.tenant_id = tenant_id_claimed` is verified if the session row exists. But a mismatch is not part of the concrete failure conditions, not in the regression obligations, and is deferred to Open Question 3 as a possible separate Cat A event. This is architectural judgment, so it should stop and queue per the stated hard-floor.

**The scenario:** JWT verifies successfully, but the JWT's `tenant_id` claim ≠ `auth.sessions.tenant_id` for the JWT's `session_id`. JWT-replay-class attack signal (someone replayed a JWT from one tenant's account against another tenant's session ID).

**Three architectural decisions surfaced (Evans must pick combination):**

**A. Audit category:** A1 Cat B / A2 Cat A / A3 Both
**B. Partition routing:** B1 claimed-tenant / B2 session-row-tenant / B3 Both
**C. Merge-blocking regression test:** required per Codex R2

## 2. Proposed decision: A2 + B2 + C (PROPOSED — awaiting Evans's confirmation)

**A2 + B2 + C is the proposed combination.** Reasoning:

### A2 (Cat A — separate event)

- JWT-replay-class attacks deserve dedicated audit-chain entries. A routine `identity.session_liveness_check_failed` Cat B event is for failed liveness (session revoked / expired / missing — legitimate states). A tenant-claim mismatch is an active-attack signal — fundamentally different audit category.
- Cat A elevation makes the event eligible for SOC monitoring + threat-intelligence pipelines that don't typically inspect Cat B governance noise.
- Future SIEM rule additions can filter on `action_id = identity.session_jwt_tenant_id_mismatch` directly.
- A3 (both Cat A + Cat B) doubles the audit row count for a relatively rare event and creates ambiguity at SIEM query time ("which row do I count?"); A1 (only Cat B) hides the attack signal in routine noise.

### B2 (session-row-tenant partition)

- **Codex R2's exact concern:** "routing the event to `SHA-256('GENESIS:TENANT:<tenant_id_claimed>')` can place an attack signal in the claimed tenant partition rather than the session row's canonical tenant partition." B2 prevents this by routing the attack signal to the legitimately-owning tenant's audit chain (the tenant who actually owns the session_id that's being attacked) rather than the attacker-claimed tenant.
- B1 (claimed-tenant) is attacker-influenced partition placement; rejected.
- B3 (both partitions) creates double-counting and audit-chain integrity ambiguity (which chain is canonical?); rejected.
- B2 is the unique correct routing: the legitimate session-owner sees the attack on their chain; the attacker's claimed tenant has no chain entry (they aren't an actual tenant who owned the session).

### C (merge-blocking regression test)

- Non-negotiable per Codex R2's explicit demand.
- The test pins the contract: an implementation that emits the wrong category or to the wrong partition fails CI.

## 3. Concretization

### 3.1 New SI-017 Sub-decision 4.5: Tenant-claim mismatch path

Authored as a new Sub-decision between current 4 and 5. Sub-decision 4.5 text:

> **Sub-decision 4.5: Tenant-claim mismatch path is a separate Cat A event partitioned by session-row-tenant.**
>
> When the JWT verifies successfully (`failure_reason` ∉ {`revoked`, `expired`, `missing`, `account_disabled`}) AND `auth.sessions.tenant_id` IS DISTINCT FROM JWT `tenant_id` claim, the authContextPlugin MUST:
>
> 1. NOT emit the routine `identity.session_liveness_check_failed` Cat B event. (The session IS live; the mismatch is a separate condition.)
> 2. Emit a NEW `identity.session_jwt_tenant_id_mismatch` Cat A audit event.
> 3. Reject the request with the SAME 401 envelope shape as a liveness-check failure (no information-leak surface differentiation; attacker cannot distinguish "session live but tenant claim wrong" from "session revoked" via response timing or shape — both return 401 with the same opaque payload).
> 4. P0 ops alert SHALL also be raised (mismatch = attack signal worth on-call attention).
>
> **Cat A envelope rules for the mismatch event:**
>
> - `action_id`: `identity.session_jwt_tenant_id_mismatch`
> - `category`: Cat A
> - `target_patient_id`: NULL (this is a platform-scope governance + attack-signal event, not patient-scope)
> - `tenant_id` envelope field: **`auth.sessions.tenant_id` (the session-row-tenant; NOT `tenant_id_claimed`)** — the legitimate session owner.
> - `resource_type`: `'session'`
> - `resource_id`: the JWT `session_id`
> - `chain_partition_key`: **`SHA-256("GENESIS:TENANT:<auth.sessions.tenant_id>")`** (SI-018 P2 keyed on session-row-tenant; codified per Codex R2 B2 reasoning).
> - `severity`: ELEVATED (attack-signal-class event)
> - **Detail payload:**
>   ```json
>   {
>     "session_id":            "<JWT session_id>",
>     "account_id":            "<JWT account_id>",
>     "tenant_id_claimed":     "<JWT tenant_id claim — the attacker-supplied value>",
>     "tenant_id_actual":      "<auth.sessions.tenant_id — the session's legitimate owner>",
>     "checked_at":            "<ISO 8601>",
>     "pg_backend_pid":        "<pg_backend_pid()>",
>     "client_ip":             "<request source IP>",
>     "user_agent":            "<request User-Agent>"
>   }
>   ```
>
> **Audit emission pattern:** same as Sub-decision 4 (application-layer audit-writer pool connection; commits before 401 response; audit-write failure → 503 + P0 alert).

### 3.2 New AUDIT_EVENTS Cat A action ID

`identity.session_jwt_tenant_id_mismatch` — Cat A, ELEVATED severity. Lands in the same SI-017 ratification ceremony as the original Cat B `identity.session_liveness_check_failed`.

### 3.3 Merge-blocking regression test (added to §7)

New test entry:

> **Test 7.X (merge-blocking) — Tenant-claim mismatch routing.**
>
> Setup: tenant_A has session S_A; attacker forges JWT with valid signature, `session_id = S_A`, `tenant_id = tenant_B`. authContextPlugin processes the request.
>
> Assertions:
> 1. Request rejected with 401 + opaque payload (matches routine liveness-check failure shape).
> 2. `audit_events` table contains EXACTLY ONE new row with:
>    - `action_id = 'identity.session_jwt_tenant_id_mismatch'`
>    - `category = 'A'`
>    - `tenant_id = tenant_A` (the session-row-tenant, NOT tenant_B)
>    - `chain_partition_key = SHA-256("GENESIS:TENANT:tenant_A")`
>    - `detail.tenant_id_claimed = tenant_B`
>    - `detail.tenant_id_actual = tenant_A`
> 3. `audit_events` table contains ZERO `identity.session_liveness_check_failed` rows for this request.
> 4. P0 ops alert raised exactly once.

This test is **merge-blocking** — CI fails the PR if it doesn't pass. Future SECURITY DEFINER procedure additions that touch tenant-attribution surfaces inherit this regression-test pattern by reviewer convention.

### 3.4 Cross-artifact impact (updated)

- **Contracts Pack AUDIT_EVENTS:** SI-017 ratification adds **2 action IDs** (was 1):
  - `identity.session_liveness_check_failed` (Cat B; original)
  - `identity.session_jwt_tenant_id_mismatch` (Cat A; per Sub-decision 4.5)
  - Version bump shape unchanged (still single ratification ceremony; v5.4 → v5.5 destination assuming SI-018 lands first).
- **SI-017 scope expanded** from 1 new Cat B event to 1 Cat B + 1 Cat A (2 total new action IDs). Ratifier ceremony complexity unchanged (single combined ratification).
- **SI-017 Status block** updated: remove `+ EVANS-SI-017-OQ-MISMATCH-RATIFIER-DECISION` from BLOCKED-PENDING list (resolved); add `+ A2+B2+C adopted per Decision Memo 2026-05-19`.

## 4. Authority basis — RETRACTED; see parallel OQ3 Memo §4

Same retraction as the parallel cross-PR OQ3 Decision Memo. The de facto-delegation claim is RETRACTED; PROPOSED is the actual status; explicit on-the-record ratification by Evans is required.

## 5. Next steps — AWAITING Evans's explicit ratification

1. Evans reads this Memo + the parallel cross-PR OQ3 Memo.
2. Evans confirms or rejects (chat-message: "ratify SI-017-OQ-MISMATCH A2+B2+C"; or proposes amendments; or rejects).
3. Only on explicit confirmation does Claude proceed with the canonical-artifact amendments + lockstep PR-A2-class canonical content port.

— Claude (Opus 4.7, 1M context), Decision Memo authored 2026-05-19 under Evans's chat-message delegation.
