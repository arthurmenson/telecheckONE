# Engineering Review Request — I-003 audit-immutability + BAA chain technical-safeguards: DB-side atomic audit inside SECURITY DEFINER procedures vs. application-layer audit emission in the same transaction?

**Date raised:** 2026-05-19
**Raised by:** Autonomous Claude (escalation; no authoring authority over the answer)
**Routed to:** Engineering Lead + Privacy/Compliance (I-003 doc-control signatories per INVARIANTS v5.2 document control §) + BAA chain owner (per System Architecture v1.2 §11 — Telecheck Health LLC + Telecheck parent/platform; if Privacy/Compliance does not also hold the BAA chain, route to them additionally)
**Decision window:** ~24 hours from receipt. The answer gates the rejection / ratification path for SC6 P-023 SI-010 (PR #11 paused at Codex round 1; PR #10 closed-without-merge pending decision).
**Decision form:** **YES / NO** answer to the single question in §1 below, with one sentence of reasoning.

---

## 1. The question

**Does I-003 ("audit trail is immutable and append-only; no exceptions") — in combination with the BAA chain's technical-safeguards posture — require atomic audit emission inside the SECURITY DEFINER procedure (DB-side atomicity of the data write + the audit write in the same DB transaction, with both writes governed by a server-trusted actor identity primitive), OR is application-layer audit emission in the same transaction sufficient (canonical pattern: application code calls the SECURITY DEFINER procedure to perform the data write, then immediately issues the audit-events INSERT from the application layer, both within the same caller-managed DB transaction, with actor identity sourced from JWT-verified application context)?**

- **YES = DB-side atomic audit is required.** The audit row MUST be INSERTed from inside the procedure, in the same transaction as the data change, with the procedure (not the application) authoritative for the audit's actor identity.
- **NO = application-layer audit emission is sufficient.** The audit row MAY be INSERTed from the application code immediately after the procedure returns, in the same transaction the application opened to call the procedure, with the application authoritative for the audit's actor identity (sourced from the JWT-verified context the middleware already resolves).

---

## 2. Why this question is load-bearing

The SC6 sub-ceremony 2026-05-17 ratified SI-010 (Session Actor Context DB Binding) as the substrate for "server-trusted actor identity inside SECURITY DEFINER procedures." Three already-ratified procedure designs (P-018 SI-008 `record_workflow_pointer_swap()`; P-019 SI-009 `record_consult_escalation_target_swap()`; P-021 SI-005 `record_consult_clinician_decision()` + `rotate_consult_clinician_decision_kms()`) all defer their IMPL-readiness gate to SI-010's landing.

In the 30-iteration Codex per-PR adversarial-review cycle on PR #10, the SI-010 design grew into a structural competitor to the canonical `current_setting('app.tenant_id')` middleware-GUC tenant-binding model (System Architecture v1.2 §5; CDM v1.2 line 1016; INVARIANTS I-023 layer 2). Evans rejected SI-010 on 2026-05-19 per the Decision Memo at `Telecheck_v1_10_PRD_Update/Decision-Memo-SC6-P-023-SI-010-Ratify-or-Reject-Unratified-Trust-Anchor-Layer-2026-05-19.md` on two independent grounds: procedural defect (authored without authorizing SI/ADR) + security-posture regression (caller-supplied identity inside the procedure enables platform-bounded SQLi blast radius with audit-chain corruption).

PR #11 (the rejection commit) hit a Codex round-1 finding that exposed the missing engineering premise: the three procedure designs ALREADY documented their SI-010 dependency in the canonical ledger (P-018 line 640; P-019 lines 575–576; P-021 line 491). Rejecting SI-010 without addressing those three entries leaves the corpus internally contradictory.

**The forward path depends entirely on the answer to §1:**

- **If YES (DB-side atomic audit required):** SI-010 (or a properly-ratified equivalent) is genuinely platform-floor; the REJECT recommendation in the Decision Memo §6 was based on a missing engineering premise; pivot to Decision Memo §7 RATIFY branch — convene SI + ADR amendment ceremony for I-023 layer 2 + System Architecture v1.2 §5 + CDM v1.2 RLS contract. Estimated 2–4 weeks before PR #10 can merge. The platform-bounded SQLi blast radius from the Decision Memo §5 becomes an accepted trade certified by the quorum.
- **If NO (application-layer audit emission sufficient):** REJECT is right; the three procedures need lockstep supersession entries P-018a/P-019a/P-021a that move audit emission from inside the procedure to the calling application code, preserving the three-tier audit durability model with Tier 1 reframed as application-issued INSERT after procedure success + Tier 2 + Tier 3 unchanged. Path B from the Decision Memo §6. Estimated 1 week for three parallel single-sub-decision ratifier ceremonies after PR #11 merges.

---

## 3. Evidence pinned (the artifacts you need to consult)

To answer §1, you do NOT need to re-read the Decision Memo or the SI-010 source. The following five artifacts are sufficient:

### 3a. I-003 verbatim — `Telecheck_Contracts_Pack_v5_00_INVARIANTS.md` line 25–29:

> **### I-003 · Audit trail is immutable and append-only**
>
> No audit record is deleted, modified, or overwritten. Corrections are appended as new records referencing the original. The hash chain is never broken. There are no exceptions — not for debugging, not for storage, not for patient requests.
>
> **Why:** Clinical accountability requires knowing exactly what happened, when, and by whom. An audit trail with gaps is not an audit trail.

**What I-003 does NOT explicitly say:** it does not specify the transaction-boundary semantics of audit emission. It states immutability + append-only + no-gaps. It does not state "must be DB-side atomic with the data write." That property may or may not be implied by "no exceptions ... an audit trail with gaps is not an audit trail."

### 3b. P-018 three-tier durability model — `Telecheck_Promotion_Ledger.md` line 642:

> 10. **Three-tier audit durability** (Tier 1 SAVEPOINT-rollback-then-INSERT; Tier 2 `audit_swap_rejection_log` autonomous-transaction backstop survives caller rollback; Tier 3 caller-required-commit-boundary contract).

**What this tells us:** the ratified P-018 design ALREADY has a Tier 3 that depends on the application (the "caller") to honor commit-boundary discipline. The application is already in the durability chain. The question is whether Tier 1 specifically requires DB-side atomicity inside the procedure, or whether application-layer Tier 1 + the existing Tiers 2 + 3 are equivalent for the I-003 + BAA chain compliance posture.

### 3c. P-019 actor-identity derivation — `Telecheck_Promotion_Ledger.md` lines 575–576:

> 3. **`record_consult_escalation_target_swap()` SECURITY DEFINER procedure** is the ONLY write path to `consults.escalation_target_sync_session_id`... **DEFERRED to SI-010 landing** per IMPL-readiness gate (the procedure cannot reference `_session_actor_context` helpers that don't exist; SI-010 sub-ceremony 6 in Evans's ordering provides the infrastructure).
>
> 4. **Server-trusted actor identity** via `SET LOCAL`-bound `_session_actor_context` (R5 + R6 closures): caller-supplied actor identity REMOVED; procedure derives from `current_actor_account_id()` / `current_actor_account_tenant_id()` / `current_actor_role()` / `current_actor_admin_home_tenant_id()`. Tx-scoped binding via `SET LOCAL` prevents cross-request bleed on pooled connections. **DEFERRED to SI-010 landing.**

**What this tells us:** the ratified design language uses "caller-supplied actor identity REMOVED" — i.e., the design deliberately moved AWAY from application-supplied identity. The reason cited is "cross-request bleed on pooled connections." That's an engineering hazard, not a regulatory one. The question is whether the cross-request-bleed hazard rises to the level of an I-003-violating condition.

### 3d. P-021 procedure design — `Telecheck_Promotion_Ledger.md` line 491:

> 8. **`record_consult_clinician_decision()` SECURITY DEFINER procedure** (sub-decision #5; R2 HIGH-2 + R2 MEDIUM closures): 11-step validation including auth-FIRST, advisory-lock for first-use idempotency-key race serialization, idempotent-replay with prior_outcome return tuple, audit-row consult-binding validation, atomic UPDATE + paired consult_events INSERT, unique_violation safety net. 7 rejection codes. **DEFERRED to SI-010 landing** per IMPL-readiness gate.

**What this tells us:** P-021's design specifically calls out "atomic UPDATE + paired consult_events INSERT" — implying DB-side atomicity between the data write and the audit-class write. Note that `consult_events` is a domain-event-class table, not the `audit_events` table itself. So the "atomic" property here may be domain-event atomicity, not audit-event atomicity. (Verify which.)

### 3e. BAA chain — `Telecheck_System_Architecture_v1_2.md` §11 (line 429 onward):

> **Telecheck-US (operated by Telecheck Health LLC; trading as Heros Health DBA):** Standard HIPAA-region posture. Telecheck-US patient data is processed in the United States. The BAA chain — **patch 2026-05-02 per Codex Round-2 Scope 4 HIGH-2 finding (restored Telecheck parent/platform business-associate role that the prior in-place rewrite inadvertently dropped):** **Telecheck Health LLC (Telecheck-US tenant operator; Heros Health DBA consumer surface) → Telecheck parent/platform (business associate; data-plane operator and per-tenant KMS / RLS enforcement layer per ADR-023) → AWS US (subprocessor)** — is the standard HIPAA chain. The Telecheck parent/platform tier is a separate BAA party because it operates the multi-tenant data plane and per-tenant encryption keys; counsel review, subprocessor documentation, and launch-readiness evidence (per OR-303) MUST treat the platform tier as a separate business associate.

**Question for Privacy/Compliance:** does the HIPAA technical-safeguards posture in the BAA chain require audit-trail atomicity at the DB-transaction level (i.e., the audit row's existence MUST be guaranteed inside the same transaction that wrote the protected data), or is application-transaction-level atomicity acceptable (the application opens a transaction, calls the procedure, INSERTs the audit row, commits — same transaction boundary but with the audit INSERT issued from app code rather than procedure code)?

---

## 4. Decision rubric

Mark **YES** if any of the following holds:

- HIPAA technical-safeguards (45 CFR §164.312) or the BAA chain contractual obligations require audit-trail atomicity at the database-transaction level, not just at the application-transaction level.
- I-003 audit-immutability is interpreted (at the doc-control-owners level) to require DB-side atomicity — i.e., audit emission from the calling application code (even within the same transaction) is judged to introduce an audit-gap risk that violates "no exceptions ... an audit trail with gaps is not an audit trail."
- The three procedures' "Three-tier audit durability" model is judged to require Tier 1 specifically inside the SECURITY DEFINER procedure (rather than as an application-issued INSERT immediately after procedure success).

Mark **NO** if all of the following hold:

- HIPAA technical-safeguards + BAA chain contractual obligations are satisfied by application-transaction-level atomicity (audit INSERT issued from app code in the same transaction as the procedure call's data write).
- I-003 audit-immutability is interpreted to be satisfied by application-layer audit emission in the same transaction as the data write, with the application's verified-JWT-bound context providing audit attribution.
- The "Three-tier audit durability" model can be preserved with Tier 1 reframed as application-issued INSERT immediately after procedure success.

If neither side cleanly applies (uncertain / requires further investigation): mark **DEFER** with a note specifying what additional investigation is needed (e.g., "external HIPAA counsel review of the technical-safeguards posture") — but understand that DEFER routes PR #10 + PR #11 to indefinite hold until the deferred investigation completes.

---

## 5. Downstream impact of each answer (for context, not for your decision)

### If YES (DB-side atomic audit required):

1. PR #11 (REJECT) is withdrawn.
2. Pivot to Decision Memo §7 RATIFY branch.
3. Convene §7.1 quorum: Evans + Engineering Lead + CDM owner + Identity slice owner + Privacy/Compliance + clinical safety officer for I-023 amendment.
4. Author SI-017 (I-023 layer 2 amendment), ADR-031 (architectural deviation from System Architecture v1.2 §5 + CDM v1.2 RLS contract), System Architecture v1.2 + CDM v1.2 lockstep amendment commits.
5. Resume PR #10 after the SI-017 + ADR-031 + lockstep amendments ratify, with the Decision Memo §7.2 + §7.3 sub-decisions live (HIGH-1 forgery mitigation + HIGH-2 hazard mitigation each adding their own ADR-class decisions).
6. Estimated 2–4 weeks before PR #10 can merge.
7. Accepted trade: the platform-bounded SQLi blast radius from Decision Memo §5 becomes a quorum-certified acceptable trade-off for the audit-durability gain.

### If NO (application-layer audit emission sufficient):

1. Amend Promotion Ledger entry P-023a to remove the false claim "P-018/P-019/P-021 ratifications stand unchanged"; replace with explicit acknowledgment that the three procedures' designs require lockstep supersession entries.
2. Push P-023a amendment as Codex round 2 of PR #11 (this is round-2 closure of the round-1 finding, not iteration past the discipline floor — round 1 surfaced an architectural-judgment issue, the amendment routes through the discipline correctly).
3. Codex round 2 reviews the amended P-023a (expected APPROVE).
4. Merge PR #11.
5. Close PR #10 unmerged (branch + 30 commits preserved as audit trail).
6. Author three P-018a/P-019a/P-021a supersession entries — each a single-sub-decision ratifier ceremony. Run them in parallel; estimated 1 week.
7. File SI-017 (Phase 2 F-3 within canonical middleware-GUC model) — likely overlaps in scope with the P-018a/P-019a/P-021a work since the JWT-liveness-check belongs to the same canonical-model amendment surface.
8. Propose CLAUDE.md amendment for the net-new-architecture STOP condition, citing this rejection cycle as the worked example.

### If DEFER:

1. PR #10 + PR #11 + the 9 remaining canonical-content-port landings all hold indefinitely until the deferred investigation completes.
2. Specify in the DEFER note: what artifact / counsel review / additional contract reading is required, and an estimated completion date.

---

## 6. How to respond

Reply directly to Evans (workstream lead) with:

- **Answer:** YES / NO / DEFER
- **One-sentence reasoning** citing whichever of the five evidence artifacts in §3 grounds your answer
- **Your name + role** (Engineering Lead / Privacy/Compliance / BAA chain owner)
- If multiple signatories review: separate response per signatory. The answer is the unanimous decision; any DEFER from any signatory routes the whole question to DEFER.

Once Evans has the answer, the autonomous Claude agent proceeds per §5.

---

## 7. What's at stake on the autonomous-work-discipline side (informational)

This engineering review is the worked example for the proposed CLAUDE.md amendment to the Autonomous-work authorization "Hard floor — STOP and surface" list: *"Any Codex finding that proposes net-new architecture, schema, or invariant amendment beyond the ratified sub-decision scope of the SI under review is a hard STOP requiring ratifier escalation. Do not close it inline."*

The PR #10 cycle ran 30 iterations past the first such finding (R3 round-3 HIGH on rollback-independent commit path). PR #11's cycle stopped at iteration 1 — applying the discipline floor properly. The CLAUDE.md amendment will codify "stop at the first such finding" as canonical autonomous-work behavior. This review is the proof that the discipline works when applied.

---

**End of review request.**
