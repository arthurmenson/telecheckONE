# SI-017 — Phase 2 F-3 JWT session-liveness check within the canonical `app.tenant_id` middleware-GUC tenant-binding model

**Version:** 0.2 DRAFT (R1 closure 2026-05-19; cites SI-018 P2 partition rule. R2 needs-attention 2026-05-19 with STOP-and-queue verdict on tenant-claim-mismatch path; iteration HALTED at R2 per CLAUDE.md hard-floor item 6 + §10-escalation cadence)
**Status:** **DRAFT / BLOCKED-PENDING-SI-018-RATIFICATION + EVANS-SI-017-OQ-MISMATCH-RATIFIER-DECISION.** SI-017 ratification cannot proceed until: (1) SI-018 ratifies (PR #14 Codex R5 APPROVE; Decision Brief authored); (2) Evans decides the SI-017 tenant-claim-mismatch architectural judgment (audit category Cat A vs Cat B for mismatch path; partition routing to claimed-tenant vs session-row-tenant; see §6 Open Question 3 / SI-017-OQ-MISMATCH below).
**Authoring location:** `Telecheck_v1_10_PRD_Update/` (spec-repo workstream folder; to be ported to `arthurmenson/telecheck-app:docs/` after Codex pre-ratification cycle stabilizes the design, per established SI source-file precedent from SI-005/SI-007/SI-008/SI-009/SI-010/SI-013)
**Owner:** Identity slice owner
**Related artifacts:**
- Decision Memo: `Telecheck_v1_10_PRD_Update/Decision-Memo-SC6-P-023-SI-010-Ratify-or-Reject-Unratified-Trust-Anchor-Layer-2026-05-19.md` (SI-010 rejection that prompted SI-017)
- Engineering Review Request: `Telecheck_v1_10_PRD_Update/Engineering-Review-Request-I-003-Atomic-Audit-Inside-vs-Application-Layer-Audit-2026-05-19.md` (established that application-layer audit emission is canonical)
- Promotion Ledger entry P-023a (rejection of SI-010 trust-anchor layer)
- **SI-018 v0.2 DRAFT** (audit-chain partition rule; prerequisite for SI-017 — establishes the canonical P1/P2 partition contract that this SI's audit event depends on): `Telecheck_v1_10_PRD_Update/SI-018-Audit-Chain-Partition-Rule-for-Non-Patient-Governance-Events.md`
- Decision Brief SI-018: `Telecheck_v1_10_PRD_Update/Decision-Brief-SI-018-Audit-Chain-Partition-Rule-2026-05-19.md`

---

## 1. Purpose

Close Phase 2 follow-on F-3 (JWT session-liveness check) entirely within the canonical `current_setting('app.tenant_id')` middleware-GUC tenant-binding model established in System Architecture v1.2 §5 + CDM v1.2 line 1016 + INVARIANTS v5.2 I-023 layer 2 + ADR-023.

**Scope is explicitly narrow.** SI-017 introduces no new platform-floor primitive, no procedure-side actor-context table, no role-elevation pattern, no caller-supplied tenant primitive, no dedicated audit-backstop instance, and no audit-chain bridge events. The single concrete change is a behavioral addition to the existing tenant-resolution middleware step: verify session revocation/expiry against the `auth.sessions` table BEFORE issuing `SET LOCAL app.tenant_id`, and fail-closed with `UnauthenticatedError` if the session is not live.

SI-017 explicitly does NOT amend any of the four canonical-model contracts (System Arch v1.2, CDM v1.2, INVARIANTS v5.2 I-023, RBAC v1.1). It operates entirely within the existing surfaces.

---

## 2. Trigger / problem statement

The Phase 2 admin JWT cycle deferred F-3 (JWT session-liveness check) approximately 8 weeks ago because the canonical middleware did not yet verify whether a session had been revoked mid-flight. The risk: a JWT issued for a now-revoked session would still pass JWT signature/expiry/audience verification at the middleware boundary and would be processed as authenticated. Revocations would not take effect until the JWT's natural expiry (up to 15 minutes for patient access tokens; 8 hours for clinician access tokens per Identity & Authentication Spec v1.0 §3.2 + §4.2 — but session revocation is typically required to take effect within seconds for security incidents, account compromise responses, and clinician credential withdrawals).

The SI-010 rejected design folded the liveness check into a procedure-side actor-context binding path, which was rejected per P-023a. SI-017 puts the liveness check back in its natural home: the application middleware that already resolves the tenant and sets `app.tenant_id` per connection.

---

## 3. Design decision (the single substantive sub-decision)

**The authContextPlugin (Fastify `onRequest` hook, registered globally) verifies session liveness against the `auth.sessions` table between JWT verification and `SET LOCAL app.tenant_id`.** Specifically:

1. **JWT verification** (existing): signature + expiry + audience checked. Failure → `UnauthenticatedError` → tenant-blind 401 per I-025; existing canonical flow.
2. **Session-liveness check (NEW, this SI's addition):** `SELECT revoked_at, expires_at, account_active FROM auth.sessions WHERE id = :jwt_session_id` against the canonical auth schema. Three failure conditions trigger fail-closed `UnauthenticatedError`:
   - `revoked_at IS NOT NULL` → reason = `'revoked'`
   - `expires_at < NOW()` → reason = `'expired'`
   - row not found (session purged from `auth.sessions`) → reason = `'missing'`
   - `account_active = false` → reason = `'account_disabled'` (added per Codex pre-ratification round to come, if reviewers surface this as a separate condition; for v0.1 DRAFT, included in the liveness gate by analogy)
3. **`SET LOCAL app.tenant_id`** (existing): only fires after JWT verification AND liveness check pass.
4. **Audit emission** (NEW, this SI's addition): on any of the three (or four) failure conditions, the plugin emits an `identity.session_liveness_check_failed` Cat B audit event from the application layer (via the canonical `audit_events` INSERT pattern; same transaction as the request handler's own tx if one is open, or a standalone audit-only transaction if the request is being rejected before any data transaction is opened — see Sub-decision 3.4 for the precise pattern).
5. **Fail-closed response**: tenant-blind 401 envelope per I-025. The `failure_reason` is NOT exposed in the response body (information-leak-safe per I-025); only the audit chain records the specific reason.

**That is the entire substantive design.** Everything else in this SI is either operational detail, regression-test specification, or open-question scoping for ratifier review.

---

## 4. Sub-decisions

### Sub-decision 1: Liveness check placement = middleware, before `SET LOCAL app.tenant_id`

The check fires after JWT signature/expiry/audience verification and BEFORE the tenant GUC is set. Rationale: a revoked session must not have its tenant_id propagated into the RLS-filtering layer; revoked sessions should hit the fail-closed boundary before any tenant-scoped query can execute on the connection.

**APPROVED RECOMMENDATION** — straightforward placement; no alternative considered.

### Sub-decision 2: Source-of-truth = `auth.sessions` table; columns checked

The canonical `auth.sessions` schema (per CDM v1.2 — Identity & Account module entity `Session`) is the only source of truth for liveness state. Columns checked at the liveness gate:
- `id` (PK; matched against JWT `session_id` claim)
- `revoked_at` (TIMESTAMPTZ NULL; non-null = revoked)
- `expires_at` (TIMESTAMPTZ NOT NULL; compared to `NOW()`)
- `account_id` (FK to `accounts`; used to join for `account_active` check)
- `account_active` (joined from `accounts` table via `account_id` FK; BOOLEAN NOT NULL; false = account disabled regardless of session state)

The query is a single read with one join. No caching at this initial design — see Sub-decision 5 for performance discussion.

**APPROVED RECOMMENDATION** — pin to canonical schema; reject any cache-first design until p95 latency profiling demonstrates it's needed.

### Sub-decision 3: Fail-closed response = tenant-blind 401 per I-025

Per Identity & Authentication Spec v1.0 §3 + INVARIANTS v5.2 I-025 (information-leak prevention in error envelopes), the response body MUST NOT differentiate among the four failure reasons (`revoked`, `expired`, `missing`, `account_disabled`). All four map to the same generic `UnauthenticatedError` envelope. The `failure_reason` is captured in the audit chain only.

**Why this matters:** differential error responses leak which sessions are revoked-but-not-expired (information about admin intervention timing), or which accounts are disabled-but-not-deleted (information about account-status transitions). The information-leak surface is patient-visible if not gated. I-025 is platform-floor.

**APPROVED RECOMMENDATION** — strict tenant-blind envelope; no per-reason differentiation in response.

### Sub-decision 4: Audit event = `identity.session_liveness_check_failed` Cat B

New AUDIT_EVENTS action ID under §Category-B (governance auth-proof events). Detail payload:

```
{
  "session_id":            "<JWT session_id>",
  "account_id":            "<JWT account_id; nullable if JWT verify failed before this step — but this step runs AFTER JWT verify so account_id is always present here>",
  "tenant_id_claimed":     "<JWT tenant_id claim>",
  "failure_reason":        "revoked | expired | missing | account_disabled",
  "checked_at":            "<ISO 8601>",
  "pg_backend_pid":        "<pg_backend_pid() at check time; captured server-side via the audit-writer connection>",
  "client_ip":             "<request source IP>",
  "user_agent":            "<request User-Agent>"
}
```

**Envelope rules** (mirror the I-027 audit-envelope pattern):
- `target_patient_id`: NULL (this is a platform-scope governance event, not patient-scope; same treatment as the rejected SI-010's identity-lifecycle events).
- `resource_type`: `'session'`.
- `resource_id`: the JWT `session_id` (which is also the table PK).
- `tenant_id` envelope field: `tenant_id_claimed` from JWT (same value as detail.tenant_id_claimed); if the session row exists, it is verified that `auth.sessions.tenant_id = tenant_id_claimed` matches — if mismatch, that is a separate `tenant_id_claim_mismatch` failure mode. **The mismatch path is now a STOP-CONDITION awaiting Evans's ratifier decision per Codex R2 HIGH-1 hard-floor item 6 escalation (see §6 Open Question 3 / SI-017-OQ-MISMATCH below).** The mismatch path affects audit-partition routing (claimed-tenant partition vs session-row-tenant partition), audit category (Cat A potential-attack-signal vs Cat B failed-liveness), and is therefore a canonical-contract decision that cannot be closed inline within SI-017 v0.2.
- Hash-chain partition: **SI-018 partition tier P2 (tenant-governance)** per the SI-018 v0.2 canonical audit-chain partition rule (PR #14 Codex R5 APPROVE; Decision Brief at `Telecheck_v1_10_PRD_Update/Decision-Brief-SI-018-Audit-Chain-Partition-Rule-2026-05-19.md`). Concretely: `chain_partition_key = SHA-256("GENESIS:TENANT:<tenant_id_claimed>")`; Cat B governance-class. SI-018 authorizes the two-tier hybrid partition (P1 patient-bound for `target_patient_id IS NOT NULL` events; P2 tenant-governance for `target_patient_id IS NULL` events) as the canonical AUDIT_EVENTS partition contract amendment. This SI's `identity.session_liveness_check_failed` event is P2 because it has no patient subject. **Closes Codex SI-017 R1 HIGH-1 finding** ("Tenant-keyed audit hash chain is a new audit primitive" was correctly flagged; this revision now cites the SI-018 canonical authorization rather than asserting the partition independently). The rejected SI-010's `identity_lifecycle` partition is NOT introduced; SI-018's P2 (tenant-governance) is a more general, canonical-contract-authorized partition that covers this event and other Cat B governance events alongside.

**Audit emission pattern (application-layer, per engineering review answer):** the authContextPlugin issues the `INSERT INTO audit_events ...` over a dedicated application-tier audit-writer pool connection (NOT the request-handler's tenant-scoped connection — the rejected request has no tenant context to write under). The audit INSERT commits before the 401 response is sent. If the audit INSERT itself fails (audit DB unreachable), the plugin still raises `UnauthenticatedError` AND additionally raises a P0 ops alert; the request is rejected with 503 instead of 401 in that case. The information-leak surface is acceptable because 503 = service unavailable conveys nothing about session state.

**Failure modes:**
- Primary audit DB unreachable → 503 + P0 ops alert (audit completeness preserved by alert + retry queue).
- Primary audit DB write rejects (e.g., schema mismatch) → 503 + P0 ops alert.
- Primary audit DB write succeeds → 401 envelope returned to client.

**Open question for ratifier (see §6 Open Question 1):** is the 503 fail-over on audit failure acceptable, or should there be a degraded mode (e.g., write to local FS audit-backstop file for later batch-import; not the rejected SI-010 dedicated-backstop-instance pattern but a much simpler local-FS append)? For v0.1 DRAFT, choose the simpler 503 + P0 alert design and defer the local-FS backstop to a follow-up SI if operational profiling shows the 503 rate is unacceptable.

### Sub-decision 5: Performance — no cache at v1.0

The liveness query is one SELECT with one join, both indexed (`auth.sessions.id` is PK; `auth.accounts.id` is PK + FK target). Estimated p95 latency on the live `auth` schema: <2ms. With the JWT verify already adding ~1-3ms and the rest of request processing typically 50-200ms, the liveness check is well under noise threshold.

**Cache decision: NONE at v1.0.** Adding a cache (e.g., Redis with 1-second TTL) would create a stale-revocation window. Security-relevant revocations should take effect within seconds; a 1-second cache TTL means up to 1s of revocation latency. Per Identity & Authentication Spec v1.0 §3.2 inactivity-timeout discipline ("immediate" on background per device after 5 minutes), the platform's existing posture is "revocations take effect on next request"; a cache violates that posture.

**Cache decision is revisit-able at v1.x.** If p95 latency profiling under load shows the liveness DB hit is a bottleneck, a cache with explicit invalidation-on-revocation (via Redis pub/sub from the revocation endpoint to all middleware instances) can be added. The invalidation pattern is straightforward but requires Redis pub/sub plumbing that doesn't exist at v1.0; deferring keeps SI-017 scope tight.

**APPROVED RECOMMENDATION** — no cache at v1.0; defer to v1.x if profiling shows it's needed.

### Sub-decision 6: Cross-tenant break-glass interaction (I-024)

Platform Admin break-glass sessions (per I-024) are scoped via `X-Tenant-Id` header at the System Architecture v1.2 §5 line 130 platform-admin endpoint path. These sessions:
- Have their own `account.role = 'platform_admin'` and `account.platform_admin = true`.
- Are NOT revoked-by-tenant-admin (only by another Platform Admin or by Privacy Officer per the break-glass review process).
- Are subject to the same liveness check as any other session.

**Interaction:** if a Platform Admin's session is revoked mid-break-glass-session, the same liveness check fires and the break-glass session terminates. No special-case logic.

**APPROVED RECOMMENDATION** — no special-case branch for platform_admin sessions in the liveness check; the canonical I-024 break-glass discipline already handles the audit and review flow.

---

## 5. Cross-artifact impact summary

**Prerequisite SI-018:** SI-017 is structurally downstream of SI-018. SI-018's AUDIT_EVENTS partition-rule amendment lands FIRST (the canonical P1/P2 two-tier hybrid partition is the contract surface that SI-017's `identity.session_liveness_check_failed` event sits in). SI-017's own AUDIT_EVENTS bump only adds the single new action ID + envelope; the partition contract itself is SI-018's.

### AUDIT_EVENTS impact

**Contracts Pack `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md`** (currently v5.3 canonical; SI-018 bumps v5.3 → v5.4 to land the partition-rule amendment):

- **1 new Cat B action ID:** `identity.session_liveness_check_failed`. Detail payload + envelope rules per Sub-decision 4 above. Hash-chain partition: **SI-018 partition tier P2 (tenant-governance)** per the SI-018 canonical partition rule; `chain_partition_key = SHA-256("GENESIS:TENANT:<tenant_id_claimed>")`. SI-017 ratification is BLOCKED-PENDING SI-018 ratification (SI-018 establishes the canonical partition-rule amendment to AUDIT_EVENTS that SI-017 depends on).
- Version bump: **v5.4 → v5.5** (assuming SI-018 lands v5.3 → v5.4 first per the prerequisite ordering). The version sequence is: (a) SI-018 ratifier ceremony lands AUDIT_EVENTS v5.3 → v5.4 with the partition-rule amendment; (b) SI-017 ratifier ceremony then lands AUDIT_EVENTS v5.4 → v5.5 with the single new Cat B action ID. If SI-017 + SI-018 were to be consolidated into a single ratifier ceremony, the combined bump would be v5.3 → v5.4 directly (partition rule + single new action ID in one amendment). Default is separate ceremonies per Codex SI-017 R1 HIGH-1's explicit "STOP and escalate to ratifier" instruction on the partition-rule decision.
- **Note on prior PR #10 v5.4:** The first attempt at AUDIT_EVENTS v5.4 was in SI-010 trust-anchor PR #10 (rejected per P-023a) and included 4 new Cat B IDs. Those changes never landed on main. The version number v5.4 is freely available for SI-018's partition-rule amendment.

### CDM impact

**Canonical Data Model `Telecheck_Canonical_Data_Model_v1_2.md`** (currently v1.3 canonical post-SI-001):

- **NO entity additions.** `auth.sessions` already exists at CDM §4.2 (or wherever the Session entity ratified at the v1.10 promotion). SI-017 reads existing columns; no new columns; no new entities.
- Version bump: NONE. CDM stays at v1.3.

### State Machines impact

**State Machines `Telecheck_State_Machines_v1_1.md`** (currently v1.2 canonical post-SI-001):

- **NO state machine additions or modifications.** Session lifecycle states (`active → revoked → expired`) already exist. SI-017 reads the state; doesn't change it.
- Version bump: NONE. State Machines stays at v1.2.

### Identity & Authentication Spec impact

**Identity Spec `Telecheck_Identity_Authentication_Spec_v1_0.md`** (currently v1.0 canonical):

- **Modify §3 authentication wiring** to insert the liveness check between JWT verify and tenant-resolution middleware. Specifically a new §3.5a "Session-liveness check (per SI-017)" subsection between the existing §3.4 multi-device behavior and §3.5 account recovery. Content: the Sub-decision 1-6 design above.
- **NO new §3.6 "Server-side actor context"** (that was the rejected SI-010 content; do not re-introduce).
- Version bump: v1.0 → v1.1 — with v1.1 amendment block referencing SI-017 only, NOT SI-010. (This is the SECOND attempt at Identity Spec v1.1 — the first attempt, in PR #10, was rejected. The version number v1.1 may be re-used since the prior PR #10's v1.1 never landed on main.)

### Registry impact

**Artifact Registry `Telecheck_Artifact_Registry_v2_10.md`** (currently v2.12 canonical):

- Version bump: v2.12 → v2.13. Same bump number as the rejected PR #10 attempted, but the substance is entirely different (SI-017 + 1 audit event + Identity Spec §3.5a, vs SI-010 + 4 audit events + Identity Spec §3.6 + role-topology + audit-backstop instance + chain-bridge events).
- §3 row 64 (Promotion Ledger inventory) updated: P-NUM for SI-017 ratification slot to be assigned by ratifier ceremony.
- §8 changelog row for the SI-017 canonical-content-port landing.

### RBAC impact

**RBAC Permissions Matrix `Telecheck_RBAC_Permissions_Matrix_v1_1.md`** (currently v1.1 canonical):

- **NO new DB roles.** SI-017 introduces no new DB roles (the rejected SI-010 introduced `_session_actor_context_owner` + `bind_actor_context_role`; both rejected). The existing `telecheck_app_role` performs the liveness query against `auth.sessions` (it already has SELECT privilege on that table per the existing canonical model).
- **One new application-tier audit-writer pool** for the rejection-path audit emission — this is application-layer config, NOT a new DB role; the pool authenticates as `audit_writer_role` (which already exists in the canonical RBAC matrix for the existing audit-writer pattern across all 17 v1.10-promoted slice PRDs).
- Version bump: NONE. RBAC stays at v1.1.

### System Architecture impact

**System Architecture `Telecheck_System_Architecture_v1_2.md`** (currently v1.2 canonical):

- **NO architectural changes.** SI-017 operates entirely within §5's existing tenant-resolution middleware. The Sub-decision 1 wiring fits between §5 line 124-129 (the existing 4-step middleware flow) without altering the surrounding contract.
- Version bump: NONE. System Architecture stays at v1.2.

---

## 6. Open questions (for Codex pre-ratification + ratifier review)

### Open Question 1: 503 on audit-DB failure vs local-FS audit-backstop?

Sub-decision 4 specifies 503 + P0 ops alert if the audit INSERT fails. Alternative: write to a local-FS append-only audit-backstop file (NOT the rejected SI-010 dedicated PostgreSQL instance design; just a local file that a separate worker batches into the audit chain). The local-FS option preserves the 401 response under audit-DB degradation but adds a local-FS reliability path.

**Recommendation for ratifier:** start with 503 + P0 alert at v1.0 (simpler, single failure mode); add local-FS backstop in v1.x if operational profiling shows 503 rate is unacceptable. Per the rejected SI-010's R5/R6/R7 closures, the local-FS pattern is workable; SI-017 doesn't need to invent it from scratch when needed.

### Open Question 2: How does the liveness check interact with `account_active = false`?

Sub-decision 2 includes `account_active` as a checked column. But the `accounts` table's `active` flag is a separate concept from session revocation — an account being disabled doesn't automatically revoke its sessions. Should the liveness check treat them as the same failure surface (single `failure_reason = 'account_disabled'`), or as separate gates with separate audit events?

**Recommendation for ratifier:** single failure surface at the liveness gate; the `failure_reason` discriminates. Simpler audit-chain shape. Could split later if reviewers want separate `identity.session_account_disabled` event.

### Open Question 3 (SI-017-OQ-MISMATCH): `tenant_id_claim_mismatch` audit category, partition routing, and merge-blocking regression test — **STOP-CONDITION; HARD-FLOOR ITEM 6 ESCALATION; AWAITING EVANS'S RATIFIER DECISION**

**Trigger:** Codex R2 on SI-017 v0.2 (2026-05-19, review-mpcpoqbq-qjpw0j) explicitly invoked CLAUDE.md hard-floor item 6 on this question. R2 verdict: "Tenant mismatch failure remains unresolved while the audit partition is derived from the untrusted JWT tenant claim... This is architectural judgment, so it should stop and queue per the stated hard-floor." Iteration HALTED at R2 per the §10-escalation cadence.

**The scenario:** JWT verifies successfully, but the JWT's `tenant_id` claim ≠ `auth.sessions.tenant_id` for the JWT's `session_id`. This is a JWT-replay-class attack signal (someone replayed a JWT from one tenant's account against another tenant's session ID).

**Three architectural decisions required (any path Evans picks must concretize ALL three):**

**A. Audit category for the mismatch event:**
- Option A1: Cat B (same as routine `identity.session_liveness_check_failed`; mismatch is a failure-mode variant)
- Option A2: Cat A (separate `identity.session_jwt_tenant_id_mismatch` event; JWT-replay-class attack signal deserves elevated severity + separate audit-chain entry)
- Option A3: Both (Cat B for the liveness failure + Cat A for the attack signal; two audit rows per failed request)

**B. Partition routing for the mismatch event:**
- Option B1: P2 keyed by `tenant_id_claimed` (JWT-claim-derived). **Risk Codex flagged:** "routing the event to SHA-256('GENESIS:TENANT:<tenant_id_claimed>') can place an attack signal in the claimed tenant partition rather than the session row's canonical tenant partition" — attacker may control which tenant partition gets the audit log.
- Option B2: P2 keyed by `auth.sessions.tenant_id` (session-row-derived; canonical-tenant partition). The mismatch event lands in the partition of the tenant that legitimately owns the session_id, not the partition the attacker claimed.
- Option B3: Two audit rows (one to each partition) for cross-tenant attack-detection redundancy.

**C. Merge-blocking regression test:**
- Required regression test pinning the audit envelope + partition for the mismatch path; without it the implementation can drift. Codex R2 explicitly required this.

**Claude's advisory recommendation (advisory only; ratifier decides):** Combination A2 + B2 + C — separate Cat A event partitioned by `auth.sessions.tenant_id` (session-row-tenant). Reasoning: (a) attack signals justify Cat A; (b) the legitimately-owning tenant should see the attack signal in their audit chain, not the attacker-claimed tenant; (c) the merge-blocking regression test is non-negotiable per Codex R2's explicit requirement.

**Implementation impact if A2 + B2 + C chosen:**
- SI-017 scope expands from 1 new Cat B action ID to 2 (1 Cat B `identity.session_liveness_check_failed` + 1 Cat A `identity.session_jwt_tenant_id_mismatch`).
- AUDIT_EVENTS version bump shape unchanged (still adds 2 action IDs in one ratification ceremony).
- Mismatch path Sub-decision needs to be authored as a new Sub-decision 4.5 (between current 4 and 5) with exact envelope fields + partition key source + regression test obligation.
- §7 regression test list needs new entry: "Mismatch path emits Cat A event with `chain_partition_key = SHA-256('GENESIS:TENANT:<auth.sessions.tenant_id>')`; replay across tenants asserts the audit row lands in legitimate-owner tenant partition."

**Alternative: defer to a separate SI** (SI-019 or similar) if Evans prefers scope discipline. Risk: leaves SI-017 with an undefined mismatch behavior at ratification; implementers may use any of the 9 (A1/A2/A3) × (B1/B2/B3) combinations.

**Recommendation:** decide all three (A + B + C) at the SI-017 ratifier ceremony (single combined decision). Do not defer.

### Open Question 4: Codex pre-ratification rounds — how many before ratifier ceremony?

The SI source's Codex pre-ratification cycle should converge before the Decision Brief is authored. SI-005 went through 3 rounds; SI-010 went through 6 rounds. SI-017's scope is narrower than either; estimate 2-3 rounds.

**Recommendation:** target 2 rounds + 1 verification round = 3 total. STOP and escalate to ratifier if any round surfaces an architectural-judgment finding (per the discipline floor encoded in the proposed CLAUDE.md amendment).

### Open Question 5: Will the three P-018a/P-019a/P-021a supersession entries reference SI-017's canonical surface, or operate independently?

The three supersession entries amend P-018/P-019/P-021's actor-identity-source sub-decisions onto the canonical middleware-GUC + JWT-verified-context model. If SI-017 ratifies first, the supersession entries can cite SI-017's authoritative Phase 2 F-3 liveness pattern as the source of "verified JWT-bound actor context." If SI-017 ratifies AFTER the supersessions, each supersession has to re-establish that pattern locally.

**Recommendation:** ratify SI-017 FIRST. Decision Brief → ratifier ceremony → bundle canonical-content-port → THEN run P-018a/P-019a/P-021a supersession ceremonies in parallel, each citing the freshly-ratified SI-017 surface.

---

## 7. Regression test obligations (merge-blocking for the SI-017 implementation PR)

1. **Revoked session test:** issue JWT for a session, revoke that session via the admin endpoint, attempt to use the JWT — assert 401 + audit event `identity.session_liveness_check_failed` with `failure_reason = 'revoked'`.
2. **Expired session test:** issue JWT for a session, set `expires_at` to a past timestamp, attempt to use the JWT — assert 401 + audit with `failure_reason = 'expired'`.
3. **Missing session test:** issue JWT for a session, delete the session row from `auth.sessions`, attempt to use the JWT — assert 401 + audit with `failure_reason = 'missing'`.
4. **Account-disabled test:** issue JWT for a session whose account has `active = true`, set `active = false`, attempt to use the JWT — assert 401 + audit with `failure_reason = 'account_disabled'`.
5. **Tenant-blind envelope test:** for each of the four failure conditions, assert the 401 response body is identical (no `failure_reason` exposed; same generic envelope).
6. **Audit-DB failure test:** simulate primary audit DB unreachable during the rejection path; assert 503 + P0 ops alert (NOT 401, NOT 500 with leaked detail).
7. **Healthy session test:** issue JWT for a live session; attempt to use it; assert 200 + `app.tenant_id` correctly set on the connection + RLS-scoped query returns expected tenant data.
8. **Performance test:** under load (target: 1000 RPS), measure p95 latency added by the liveness check; assert <5ms p95 added latency.

All 8 are merge-blocking on the SI-017 implementation PR (not on the SI-017 ratification commit; ratification ratifies the design, implementation lands the code).

---

## 8. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review. Codex pre-ratification cycle to run before Decision Brief authoring + ratifier ceremony.

**Estimated rounds:** 2 + 1 verification = 3 total. STOP-and-escalate at any architectural-judgment finding per discipline-floor cadence.

---

## 9. Relationship to rejected SI-010

SI-017 is what F-3 "should have been" if SI-010 had not been authored. The rejected SI-010 design's substantive engineering wins (Phase 2 F-3 closure + actor-attribution-inside-SECURITY-DEFINER + pooled-connection-bleed defense) are addressed in SI-017 + the three P-018a/P-019a/P-021a supersession entries:

| SI-010 want | SI-017 + supersessions answer |
|---|---|
| Phase 2 F-3 JWT session-liveness check | SI-017 Sub-decision 1 (liveness check at middleware) |
| Actor attribution inside SECURITY DEFINER procedures | Procedure receives actor identity as parameters from application's JWT-verified context (P-018a/P-019a/P-021a) |
| Pooled-connection bleed defense | pgbouncer transaction-mode + middleware that ALWAYS issues `SET LOCAL app.tenant_id` per request (canonical model's existing guarantee, formalized in P-018a/P-019a/P-021a) |
| Audit-attribution inside SECURITY DEFINER | Application-layer audit emission in same transaction (engineering review's answer; preserved in P-018a/P-019a/P-021a) |
| Server-trusted actor identity primitive | NOT INTRODUCED — security-posture trade rejected; application-layer trust boundary is canonical |

SI-017's narrow scope is the discipline floor at work: each substantive engineering need is addressed in its own narrow SI (or supersession), not bundled into a platform-floor primitive.

---

## 10. What ratifier needs to decide at SI-017 ceremony

Six sub-decisions enumerated in §4 are pre-recommended (APPROVED RECOMMENDATION marker on each). Ratifier reviews and either accepts all six as-recommended (the expected outcome) or surfaces specific overrides on any sub-decision.

Five open questions enumerated in §6 require ratifier direction:
- OQ1: 503 vs local-FS backstop on audit-DB failure
- OQ2: account-disabled as separate failure surface
- OQ3: tenant_id_claim_mismatch as separate Cat A event in SI-017, or defer to SI-018
- OQ4: Codex pre-ratification round count target
- OQ5: SI-017 ratify-first ordering vs parallel-with-supersessions

Decision Brief format: 6 sub-decisions × 5 open questions = 11 ratifier decisions in the SI-017 ceremony Decision Brief. Estimated review time: ~30 minutes.

---

**End of SI-017 v0.1 DRAFT.**
