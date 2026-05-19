# PROPOSED Decision Brief — SI-017 (Phase 2 F-3 JWT session-liveness check within canonical `app.tenant_id` middleware-GUC model)

**Status:** PROPOSED — awaiting Evans's ratification of SI-017-OQ-MISMATCH A2+B2+C (Decision Memo) AND SI-018 ratifier ceremony (PR #14 R5 APPROVE).
**Authoring date:** 2026-05-19
**Authority:** PROPOSED only; application to canonical Promotion Ledger requires Evans's chat-message ratification per CLAUDE.md hard-floor item 3.
**Ratifier-input artifact:** `Telecheck_v1_10_PRD_Update/SI-017-Phase-2-F3-JWT-Liveness-Canonical-Middleware-GUC-Model.md` v0.2 (Codex R2 STOP-and-queue 2026-05-19, escalation resolved via Decision Memo).

---

## 1. Single yes/no ratifier question

**Ratify SI-017 (Phase 2 F-3 JWT session-liveness check within canonical middleware-GUC model) including Sub-decisions 1–5 + new Sub-decision 4.5 (mismatch path per A2+B2+C adoption)?**

## 2. Scope

SI-017 establishes the canonical JWT session-liveness verification flow within the `app.tenant_id` middleware-GUC tenant-binding model that the rejected SI-010 trust-anchor design was supposed to provide. After SI-010's rejection (P-023a), SI-017 fills the canonical-middleware-GUC gap with a simpler design: authContextPlugin verifies JWT once per request, performs per-request session-liveness check (revoked/expired/missing/account_disabled), emits `SET LOCAL app.tenant_id = <tenant_id>` on the connection, and passes actor-tenant parameters to any SECURITY DEFINER procedure within the same request.

**In scope:**
- Phase 2 F-3 canonical session-liveness check flow (Sub-decisions 1–4)
- Sub-decision 4.5: tenant-claim mismatch path (A2 separate Cat A event + B2 session-row-tenant partition + C merge-blocking regression test)
- AUDIT_EVENTS amendment: 2 new action IDs (Cat B liveness-failed + Cat A jwt-tenant-mismatch)
- §7 regression tests (including new merge-blocking Test 7.X for the mismatch path)

**Out of scope:**
- Procedure-side trust anchor (rejected per P-023a; SI-010-class design not introduced)
- Any new platform-floor invariant (I-032 lives in the parallel cross-PR OQ3 ratification, not SI-017)
- Multi-region session-replication design (deferred to future SI)

## 3. Sub-decisions (5 + 1 = 6 total)

Per the canonical SI-017 source file:

1. **Sub-decision 1:** Liveness check fires within authContextPlugin per-request (after JWT verify, before route handler).
2. **Sub-decision 2:** Liveness check reads `auth.sessions` directly (no cache at v1.0; Sub-decision 5 covers performance).
3. **Sub-decision 3:** Liveness check is fail-closed (`UnauthenticatedError` on any failure; 401 response).
4. **Sub-decision 4:** Audit event `identity.session_liveness_check_failed` Cat B emitted on failure. P2 partition tier per SI-018 (keyed on `tenant_id_claimed`).
5. **Sub-decision 4.5** (NEW per A2+B2+C adoption): Mismatch path = separate Cat A `identity.session_jwt_tenant_id_mismatch` event, partitioned by session-row-tenant (`auth.sessions.tenant_id`), with merge-blocking regression test.
6. **Sub-decision 5:** Performance — no cache at v1.0; revisit in v1.1 if liveness check latency exceeds SLO.

## 4. Change list (canonical artifacts)

If ratified, the lockstep PR-A2-class commit lands:

- **AUDIT_EVENTS** v5.X → v5.X+1: 2 new action IDs (Cat B + Cat A). Canonical text per `Proposed-AUDIT_EVENTS-Amendments-2026-05-19.md`.
- **Promotion Ledger** P-025 — SI-017 ratification entry (full text per future Proposed-Promotion-Ledger-Entries file).
- **Artifact Registry** v2.12 → v2.13 (consolidated with SI-018 + supersessions in single lockstep commit).
- **No CDM changes.** SI-017 reads existing `auth.sessions` row shape; no new columns.
- **No State Machines changes.** Session lifecycle states already exist.
- **No INVARIANTS changes.** (I-032 is cross-PR OQ3's contribution, not SI-017's.)

## 5. Open questions (status at ratifier ceremony)

- OQ1 (503 on audit-DB failure vs local-FS backstop) — recommendation: keep 503 + P0 alert for v1.0; revisit if 503 rate is unacceptable.
- OQ2 (interaction with `account_active = false`) — recommendation: treat `account_disabled` failure_reason as fail-closed (same as revoked/expired/missing).
- OQ3 / SI-017-OQ-MISMATCH — RESOLVED via Sub-decision 4.5 per the parallel Decision Memo.
- OQ4 (Codex pre-ratification rounds) — RESOLVED: 2 rounds + R3 STOP-and-queue + A2+B2+C ratification = converged.
- OQ5 (P-018a/P-019a/P-021a referencing SI-017) — supersessions cite SI-017 as the canonical authContextPlugin contract; downstream.

## 6. Codex pre-ratification trail

- R1 (review-mpckt9xo-nbawh9): NO-SHIP; HIGH-1 tenant-keyed audit hash chain primitive. → Closed by spawning parallel SI-018 (audit-chain partition rule) which authorizes the P2 partition canonically.
- R2 (review-mpcpoqbq-qjpw0j): needs-attention; HIGH-1 tenant-claim-mismatch path unresolved (architectural-judgment per hard-floor item 6). → Iteration HALTED at R2 per §10-escalation cadence; escalated to ratifier as SI-017-OQ-MISMATCH; resolved via A2+B2+C Decision Memo.
- R3 (TO RUN post-Sub-decision 4.5 application): expected to APPROVE the closure.

## 7. Recommendation

**APPROVE.** SI-017 is the canonical-middleware-GUC contract that fills the SI-010 trust-anchor gap with a simpler, ADR-aligned design. Sub-decision 4.5 closes the tenant-claim-mismatch architectural-judgment cleanly with A2+B2+C (separate Cat A event partitioned by session-row-tenant + merge-blocking regression test). All open questions resolved or recommended-with-rationale. AUDIT_EVENTS additions are bounded (2 action IDs); no CDM/State Machine/INVARIANTS impact from SI-017 itself.

## 8. Dependencies

- **SI-018 ratification** must precede or land lockstep with SI-017 (SI-017's audit events use SI-018's canonical partition rule).
- **I-032 ratification** (cross-PR OQ3) lands in the same lockstep PR but is independent of SI-017's content.

---

— Claude (Opus 4.7, 1M context), PROPOSED Decision Brief authored 2026-05-19 under non-ratification autonomous-work authorization.
