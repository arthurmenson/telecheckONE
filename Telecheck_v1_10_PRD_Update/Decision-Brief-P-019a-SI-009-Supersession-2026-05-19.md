# PROPOSED Decision Brief — P-019a SI-009 actor-identity-source supersession (with I-032 STEP 0)

**Status:** PROPOSED — awaiting Evans's ratification of cross-PR OQ3 Option A (I-032) + SI-017 + SI-018.
**Authoring date:** 2026-05-19
**Authority:** PROPOSED only; application to canonical Promotion Ledger requires Evans's chat-message ratification.
**Ratifier-input artifact:** `Telecheck_v1_10_PRD_Update/P-019a-Supersession-SI-009-Actor-Identity-Source-Amendment.md` v0.1 (Codex R2 APPROVE 2026-05-19; retroactive OQ3 alignment commit 6298f8e).

---

## 1. Single yes/no ratifier question

**Ratify P-019a (SI-009 `record_consult_escalation_target_swap()` actor-identity-source supersession with I-032 STEP 0 equality guard) as a Promotion Ledger reconciliation entry amending the canonical P-019 Sub-decisions 3 + 4 + three-tier audit-durability portion?**

## 2. Scope

P-019a supersedes three portions of canonical P-019 (line 575 + Sub-decisions 3 at line 599 + Sub-decision 4 at line 600 of `Telecheck_Promotion_Ledger.md`):

- **P-019 Sub-decision 3** (procedure design): actor identity sourced from JWT-verified application-supplied parameters per SI-017; `current_actor_*()` helpers (SI-010, rejected) NOT used.
- **P-019 Sub-decision 4** (Server-trusted actor identity via SET LOCAL-bound `_session_actor_context`): SUPERSEDED ENTIRELY — the `_session_actor_context` table + helpers + SET LOCAL binding pattern are SI-010 primitives that don't exist post-rejection. Replaced with canonical SI-017 authContextPlugin contract: pgbouncer transaction-mode + middleware SET LOCAL `app.tenant_id` per request is the trust boundary; procedure trusts caller-supplied parameters.
- **P-019 three-tier audit-durability sub-decision** (Sub-decision number per canonical P-019): audit-emission LOCATION moves to application-layer; D1/D2/D3 relabel to avoid SI-018 P1/P2 collision; P2 partition tier.
- **NEW STEP 0 — I-032 Tenant-GUC equality guard** (per cross-PR OQ3 Option A): same shape as P-018a.

**Out of scope:**
- 13-column SyncSession schema + 7-column `livekit_room_id` KMS envelope + four-predicate atomic UPDATE + 4-value cancellation_reason enum + triple-composite UNIQUE shape + FK 7 row shape from SI-005 — all preserved unchanged from canonical P-019.

## 3. Sub-decisions for ratification (4)

1. **Amend P-019 Sub-decision 3** for actor-identity-source per SI-017 — **APPROVE**
2. **Supersede P-019 Sub-decision 4 ENTIRELY** (SI-010 primitives gone) — **APPROVE**
3. **Amend three-tier audit-durability sub-decision** for audit-emission location (D1 to application-layer; P2 partition) — **APPROVE**
4. **Apply I-032 STEP 0** to the procedure — **APPROVE**

## 4. Change list (canonical artifacts)

- **Entry P-019a** — full text per future `Proposed-Promotion-Ledger-Entries-2026-05-19.md` §P-019a.
- **No Registry bump from P-019a alone** (consolidated into the single lockstep bump v2.12 → v2.13).

## 5. Open questions

- OQ1 (SI-009.1 successor SI alignment) — recommendation: flag for SI-009.1 ratifier ceremony; not gated on P-019a.
- OQ2 (Codex pre-ratification target) — RESOLVED: R2 APPROVE.
- OQ3 (cross-PR trust-boundary equality-guard) — RESOLVED via cross-PR OQ3 Option A (I-032 STEP 0 added per Sub-decision 4).

## 6. Codex pre-ratification trail

- R1 (review-mpcmsk90-zopinx): NO-SHIP; HIGH-1 trust-boundary gap (architectural-judgment), MED-1 line citations 575-576 vs 599-600. HIGH-1 initially closed via Option B framing inline; MED-1 closed inline. (Closure commit 9bc3011.)
- R2 (review-mpcmxa8p-ku5oac): APPROVE clean under Option B framing.
- Retroactive OQ3 alignment commit 6298f8e: Option B framing RETRACTED after Codex R3 on P-021a clarified Option B closure was itself architectural-judgment; cross-PR OQ3 STOP-and-queue posture applied; resolved via Option A (I-032) per Decision Memo.

## 7. Recommendation

**APPROVE.** P-019a brings P-019 procedure into alignment with the post-SI-010-rejection canonical model. The Sub-decision 4 ENTIRELY-superseded path is the correct treatment (SI-010 primitives can't be partially amended). I-032 STEP 0 adds defense-in-depth.

## 8. Dependencies

- **SI-017 ratification** must precede or lockstep with P-019a.
- **SI-018 ratification** must precede or lockstep with P-019a.
- **I-032 ratification** (cross-PR OQ3) must precede or lockstep with P-019a.

---

— Claude (Opus 4.7, 1M context), PROPOSED Decision Brief authored 2026-05-19 under non-ratification autonomous-work authorization.
