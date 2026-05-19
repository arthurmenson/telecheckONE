# PROPOSED Decision Brief — P-018a SI-008 actor-identity-source supersession (with I-032 STEP 0)

**Status:** PROPOSED — awaiting Evans's ratification of cross-PR OQ3 Option A (I-032) + SI-017 + SI-018.
**Authoring date:** 2026-05-19
**Authority:** PROPOSED only; application to canonical Promotion Ledger requires Evans's chat-message ratification.
**Ratifier-input artifact:** `Telecheck_v1_10_PRD_Update/P-018a-Supersession-SI-008-Actor-Identity-Source-Amendment.md` v0.1 (Codex R2 APPROVE 2026-05-19; retroactive OQ3 alignment commit f65069f).

---

## 1. Single yes/no ratifier question

**Ratify P-018a (SI-008 `record_workflow_pointer_swap()` actor-identity-source supersession with I-032 STEP 0 equality guard) as a Promotion Ledger reconciliation entry amending the canonical P-018 sub-decisions touching SI-010 primitives?**

## 2. Scope

P-018a is a **narrow reconciliation entry** that supersedes specific sub-decisions of the canonical P-018 entry (line 640 of `Telecheck_Promotion_Ledger.md`) which deferred actor-identity-derivation to SI-010. With SI-010 rejected (P-023a), P-018a amends:

- **P-018 Sub-decision 8** (procedure design): actor identity sourced from JWT-verified application-supplied parameters per SI-017 canonical middleware-GUC; `current_actor_*()` helpers (SI-010, rejected) NOT used.
- **P-018 Sub-decision 10** (three-tier audit durability): audit-emission LOCATION moves to application-layer immediately after procedure-success return per the engineering-review-grounded canonical pattern; durability framework relabeled D1/D2/D3 to avoid SI-018 P1/P2 partition-tier collision; audit-event partition tier is P2 (tenant-governance) per SI-018.
- **NEW STEP 0 — I-032 Tenant-GUC equality guard** (per cross-PR OQ3 Option A): procedure rejects calls where `p_tenant_id <> current_setting('app.tenant_id', true)` BEFORE any other validation; emits `tenant_guc_mismatch` rejection code; application call site emits canonical Cat B audit event + P0 alert.

**Out of scope:**
- All other P-018 sub-decisions (5-state vocab for `ai_workflow_executions.status`; Pattern A protocol-versioning; TOAST-BYTEA `recommendation` storage; 8-column flat KMS envelope; composite FK rules; bidirectional pointer invariant; CAS-and-supersession protocol; 5 rejection codes; etc.) — all preserved unchanged from canonical P-018.

## 3. Sub-decisions for ratification (3)

1. **Amend P-018 Sub-decision 8** for actor-identity-source per SI-017 + I-032 STEP 0 — **APPROVE**
2. **Amend P-018 Sub-decision 10** for audit-emission location (D1 moves to application-layer; D2 + D3 preserved; P2 partition) — **APPROVE**
3. **Apply I-032 STEP 0** to the procedure (added per cross-PR OQ3 Option A ratification) — **APPROVE**

## 4. Change list (canonical artifacts)

If ratified, the lockstep PR-A2-class commit appends to the Promotion Ledger:

- **Entry P-018a** — full text per future `Proposed-Promotion-Ledger-Entries-2026-05-19.md` §P-018a.
- **No Registry version bump from P-018a alone** (reconciliation entry). The same lockstep PR also lands I-032 + SI-018 partition rule + SI-017 events; the Registry bump (v2.12 → v2.13) is single-bump consolidated.

## 5. Open questions

- OQ1 (parameter list constraint per Sub-decision 8) — recommendation: parameter list as proposed (consistent with canonical SI-017 model).
- OQ2 (Codex pre-ratification target) — RESOLVED: R2 APPROVE.

## 6. Codex pre-ratification trail

- R1 (review-mpcmmsqv-32kzls): NO-SHIP; 3 in-scope findings (scope-statement inconsistency; tier-nomenclature collision; premature canonicality). All closed inline (commit 81457b5).
- R2 (review-mpcmq9ia-03qm9v): APPROVE clean. Three closures verified.
- Retroactive OQ3 alignment commit f65069f: added cross-PR OQ3 reference after Codex R3 on P-021a clarified the trust-boundary closure is architectural-judgment.

## 7. Recommendation

**APPROVE.** P-018a is a tightly-scoped reconciliation entry that brings the canonical P-018 procedure design into alignment with the post-SI-010-rejection canonical model. I-032 STEP 0 adds defense-in-depth without changing the procedure's other behavior. Codex R2 APPROVE; all findings closed.

## 8. Dependencies

- **SI-017 ratification** must precede or lockstep with P-018a (procedure cites SI-017 authContextPlugin contract).
- **SI-018 ratification** must precede or lockstep with P-018a (audit event uses SI-018 P2 partition).
- **I-032 ratification** (cross-PR OQ3) must precede or lockstep with P-018a (Sub-decision 3 applies I-032 STEP 0).

---

— Claude (Opus 4.7, 1M context), PROPOSED Decision Brief authored 2026-05-19 under non-ratification autonomous-work authorization.
