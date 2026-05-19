# PROPOSED Decision Brief — P-021a SI-005 actor-identity-source supersession (with I-032 STEP 0 + Sub-decision 4 procedure-validated rotation-scope partition rule)

**Status:** PROPOSED — awaiting Evans's ratification of cross-PR OQ3 Option A (I-032) + SI-017 + SI-018.
**Authoring date:** 2026-05-19
**Authority:** PROPOSED only; application to canonical Promotion Ledger requires Evans's chat-message ratification.
**Ratifier-input artifact:** `Telecheck_v1_10_PRD_Update/P-021a-Supersession-SI-005-Actor-Identity-Source-Amendment.md` v0.1 (Codex R3 STOP-and-queue 2026-05-19; cross-PR OQ3 reframed).

---

## 1. Single yes/no ratifier question

**Ratify P-021a (SI-005 `record_consult_clinician_decision()` + `rotate_consult_clinician_decision_kms()` actor-identity-source supersession with I-032 STEP 0 + procedure-validated rotation-scope partition rule per Sub-decision 4) as a Promotion Ledger reconciliation entry amending the canonical P-021 Sub-decision #5 + audit-emission-location?**

## 2. Scope

P-021a supersedes portions of canonical P-021 (entry header line 482 + Sub-decision #5 at line 515 of `Telecheck_Promotion_Ledger.md`):

- **P-021 Sub-decision #5** (procedure design): actor identity from JWT-verified application-supplied parameters per SI-017; `current_actor_*()` helpers (SI-010, rejected) NOT used.
- **Implicit second procedure** `rotate_consult_clinician_decision_kms()` (per P-023 lines 257 + 263): same actor-identity-source pattern.
- **Audit-emission LOCATION within Sub-decision #5's 11-step validation framework**: moves to application-layer; D1/D2/D3 relabel; `record_consult_clinician_decision()` audit lives in P1 (patient-bound; `target_patient_id IS NOT NULL`).
- **Sub-decision 4** (NEW, in P-021a §2): `rotate_consult_clinician_decision_kms()` audit partition tier is NORMATIVELY BOUND to procedure-validated rotation scope. `p_rotation_scope` MANDATORY closed enum (`'single_patient' | 'batch_tenant'`); `p_target_patient_id` MANDATORY with scope-consistency CHECK; procedure returns `affected_row_count` + `affected_patient_id_set` for application-layer validation. 3 new rejection codes (`invalid_rotation_scope`, `scope_target_mismatch`, `rotation_scope_violation`).
- **NEW STEP 0 — I-032 Tenant-GUC equality guard** (per cross-PR OQ3 Option A): added to BOTH procedures; precedes Sub-decision 4's `p_rotation_scope` enum validation on the rotate procedure.

**Out of scope:**
- 11-step validation framework's idempotency + concurrency + state-consistency primitives (advisory-lock, CAS, append-only triggers, `consult_events` strict append-only via BEFORE UPDATE + BEFORE DELETE triggers)
- 5 clinician-decision column groups, 8-column KMS envelope, FK 6 + FK 7 triple-composite shapes, 5-value clinician_decision_class enum, state-transition validator, 7 original rejection codes, decision-class state transition CHECK constraint
- All other P-021 sub-decisions (#1, #2, #3, #4, #6) — preserved unchanged.

**Critical preservation note:** The `consult_events` paired INSERT (Sub-decision #5's "atomic UPDATE + paired `consult_events` INSERT" step) remains atomic INSIDE the procedure. `consult_events` is a DOMAIN-EVENT table, not the `audit_events` table; domain-event atomicity is a separate property from audit-event emission and stays inside the procedure.

## 3. Sub-decisions for ratification (4)

1. **Amend P-021 Sub-decision #5** (`record_consult_clinician_decision` actor-identity source) — **APPROVE**
2. **Amend `rotate_consult_clinician_decision_kms()` procedure** (same actor-identity-source pattern; not separately numbered in canonical P-021 but per P-023 lines 257 + 263 enumeration) — **APPROVE**
3. **Amend audit-emission LOCATION** within Sub-decision #5's 11-step validation framework (D1 moves to application-layer; P1 partition tier for the patient-bound Consult event) — **APPROVE**
4. **Normatively bind `rotate_consult_clinician_decision_kms()` audit-event partition tier to procedure-validated rotation scope** (closes Codex R1+R2 HIGH-1 inline; in-scope tightening of audit-emission amendment) — **APPROVE**
5. **Apply I-032 STEP 0** to BOTH procedures (cross-PR OQ3 Option A) — **APPROVE**

## 4. Change list (canonical artifacts)

- **Entry P-021a** — full text per future `Proposed-Promotion-Ledger-Entries-2026-05-19.md` §P-021a.
- **No Registry bump from P-021a alone** (consolidated into single lockstep bump v2.12 → v2.13).

## 5. Open questions

- OQ1 (11-step validation framework server-trusted identity requirement) — RESOLVED: application-layer trust boundary is canonical-model posture for every other clinical-decision-recording call.
- OQ2 (Codex pre-ratification target) — RESOLVED: R3 STOP-and-queue triggered hard-floor item 6 escalation; OQ3 + OQ4 both resolved.
- OQ3 (cross-PR trust-boundary equality-guard) — RESOLVED via cross-PR OQ3 Option A (I-032).
- OQ4 (rotate_kms partition tier per-event) — RESOLVED inline in §2 Sub-decision 4 (normative binding to procedure-validated rotation scope).

## 6. Codex pre-ratification trail

- R1 (review-mpcn1rjq-fib6ix): NO-SHIP; HIGH-1 rotate_kms partition non-normative. → Closed inline by promoting §4 OQ4 to normative Sub-decision 4 (commit bbeefb7).
- R2 (review-mpcn4lcr-87c3ja): NO-SHIP; HIGH-1 Sub-decision 4 escape hatch ("procedure parameter or invocation context"). → Closed inline by tightening: mandatory enum + scope-consistency CHECK in-procedure + procedure-validated return tuple (commit 4497668).
- R3 (review-mpcn6wag-llvapb): NO-SHIP; HIGH-1 trust-boundary closure framing reads as inline closure of architectural-judgment item. → STOP-and-queue per hard-floor item 6; OQ3 reframed to ratifier-decision item (commit 018ef75); resolved via Option A Decision Memo.

## 7. Recommendation

**APPROVE.** P-021a is the largest of the three supersessions due to SI-005 having two SECURITY DEFINER procedures + an 11-step validation framework + patient-bound P1 audit chain (vs P-018a/P-019a P2). Sub-decision 4's procedure-validated rotation-scope partition rule was the Codex R1/R2 closure-of-record; I-032 STEP 0 closes OQ3 via cross-PR Decision Memo. All 4 Codex rounds (R1/R2/R3 + post-Sub-decision-4-application verification) converge.

## 8. Dependencies

- **SI-017 ratification** must precede or lockstep with P-021a.
- **SI-018 ratification** must precede or lockstep with P-021a (P1 partition tier).
- **I-032 ratification** (cross-PR OQ3) must precede or lockstep with P-021a.

---

— Claude (Opus 4.7, 1M context), PROPOSED Decision Brief authored 2026-05-19 under non-ratification autonomous-work authorization.
