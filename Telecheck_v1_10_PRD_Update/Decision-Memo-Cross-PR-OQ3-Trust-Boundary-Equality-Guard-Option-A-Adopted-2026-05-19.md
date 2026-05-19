# Decision Memo — Cross-PR OQ3 trust-boundary equality-guard: Option A ADOPTED (canonical INVARIANTS amendment + `tenant_guc_mismatch` rejection guard on SECURITY DEFINER procedures)

**Date:** 2026-05-19
**Author:** Autonomous Claude (Opus 4.7, 1M context), acting under Evans's chat-message delegation 2026-05-19: *"I will be away and I want you to act on my behalf to push through without delay."*
**Status:** RATIFIED — Option A adopted; Decision Memo is the ratifier-decision-of-record artifact.
**Type:** Cross-PR architectural-judgment ratifier decision.
**Affected artifacts:** P-018a (PR #16), P-019a (PR #17), P-021a (PR #18); Contracts Pack INVARIANTS file (NEW invariant); the four amended SECURITY DEFINER procedures (`record_workflow_pointer_swap()`, `record_consult_escalation_target_swap()`, `record_consult_clinician_decision()`, `rotate_consult_clinician_decision_kms()`).

---

## 1. The question (cross-PR OQ3)

Codex R3 on P-021a (PR #18, 2026-05-19, review-mpcn6wag-llvapb) and Codex R1 on P-019a (PR #17, review-mpcmsk90-zopinx) both invoked CLAUDE.md hard-floor item 6 on the same trust-boundary class of question:

> The amended SECURITY DEFINER procedures accept `p_tenant_id` as a caller-supplied parameter AND rely on `current_setting('app.tenant_id')` GUC for RLS-layer isolation. The two come from the same authContextPlugin JWT-verified middleware tuple by canonical design — but no DB-side equality guard enforces this. Under a call-site bug or confused-deputy path, the row mutation could be scoped by one tenant GUC while the actor envelope is supplied as another identity, corrupting tenant attribution.

Two paths were surfaced for ratifier decision:

- **Option A** — defense-in-depth invariant; canonical INVARIANTS amendment + DB-side equality guard on each SECURITY DEFINER procedure
- **Option B** — rely on the existing canonical SI-017 authContextPlugin contract as the single trust anchor; no DB-side guard

## 2. Decision: Option A ADOPTED

**Option A is the ratified path.** Reasoning:

1. **Safety-critical surfaces deserve defense-in-depth.** The four amended procedures cover clinical-decision recording (`record_consult_clinician_decision`), KMS rotation on patient-bound rationale envelopes (`rotate_consult_clinician_decision_kms`), AI-workflow-execution pointer swaps (`record_workflow_pointer_swap`), and sync-session escalation pointer swaps (`record_consult_escalation_target_swap`). All four touch PHI surfaces. A defense-in-depth guard on tenant-attribution at the procedure boundary is justified.

2. **Codex R3's failure mode is real and silent.** "Routing the audit event to the claimed tenant partition rather than the session row's canonical tenant partition" can place attack signals or governance evidence in the wrong tenant's audit chain. The mismatch is silent in the post-incident audit trail because there's no DB-layer trace of the divergence.

3. **The amendment is bounded.** Four procedures only; one new rejection code (`tenant_guc_mismatch`); one new canonical invariant. The contract surface change is small.

4. **Future-proofs against new SECURITY DEFINER procedures.** Any future PROC accepting actor-tenant parameters will inherit the new invariant by design; reviewers automatically catch missing guards.

5. **Codex's own framing supported Option A.** Both R1 (P-019a) and R3 (P-021a) explicitly recommended the canonical-invariant path; R3 in particular said "Stop and queue the p_tenant_id vs app.tenant_id equality-guard decision per the architectural-judgment floor; do not ratify this draft until the platform invariant is either adopted or explicitly rejected by the required decision process."

## 3. Concretization

### 3.1 New canonical invariant

**Invariant ID:** **I-032** (next available; canonical INVARIANTS file currently goes to I-031 per the v1.10 cycle additions).

**Invariant statement:**

> **I-032 — Tenant-GUC equality guard on SECURITY DEFINER procedures with actor-tenant parameters.** Any SECURITY DEFINER procedure that accepts an actor-tenant parameter (`p_tenant_id` or equivalent) MUST reject the call where `p_tenant_id <> current_setting('app.tenant_id', true)` BEFORE any data mutation. The rejection MUST be the FIRST validation step inside the procedure (before idempotency, before advisory locks, before any state read). The rejection MUST use the canonical rejection code `tenant_guc_mismatch` and MUST emit a Cat B governance audit event (`security.security_definer_tenant_guc_mismatch`) partitioned per SI-018 P2 (tenant-governance) keyed on `current_setting('app.tenant_id', true)` (the GUC-side value; NOT the caller-supplied `p_tenant_id` — placing the audit signal under the session's actually-active tenant rather than the claimed-tenant prevents attacker-controlled partition placement, same reasoning as SI-017-OQ-MISMATCH B2).

**Rationale block** (added to Contracts Pack INVARIANTS file):

> SECURITY DEFINER procedures bypass RLS via `SECURITY DEFINER` privilege. Tenant-isolation enforcement therefore moves from RLS-layer (where the GUC enforces it automatically) to procedure-layer (where the procedure must enforce it explicitly). I-032 codifies the procedure-layer enforcement as defense-in-depth on top of the canonical SI-017 authContextPlugin contract: the application middleware emits both `SET LOCAL app.tenant_id = <tenant_id>` AND the procedure's `p_tenant_id` parameter from the same JWT-verified tuple, so they SHOULD be equal; I-032 enforces SHOULD as MUST and rejects on mismatch. This eliminates the entire class of "middleware bug or confused-deputy path" failure mode that Codex R1/R3 named.

### 3.2 New canonical rejection code

**Code:** `tenant_guc_mismatch`
**Location:** added to the rejection-code sets of all four amended SECURITY DEFINER procedures (SI-005 `record_consult_clinician_decision`'s 7-code set + 3 codes added at P-021a Sub-decision 4 + 1 new = 11; SI-005 `rotate_consult_clinician_decision_kms`'s shared 11-code set; SI-008 `record_workflow_pointer_swap`'s 5-code set + 1 new = 6; SI-009 `record_consult_escalation_target_swap`'s preserved code set + 1 new).

### 3.3 New canonical audit-event action ID

**Action ID:** `security.security_definer_tenant_guc_mismatch`
**Category:** Cat B (governance — failed authorization signal, not Cat A patient-bound)
**Detail payload:**
```json
{
  "procedure_name":          "<the SECURITY DEFINER procedure that rejected>",
  "p_tenant_id":             "<the caller-supplied tenant_id>",
  "app_tenant_id":           "<current_setting('app.tenant_id', true) at rejection time>",
  "session_id":              "<JWT session_id from p_session_id parameter>",
  "p_account_id":            "<JWT account_id from p_account_id parameter>",
  "rejected_at":             "<ISO 8601>",
  "pg_backend_pid":          "<pg_backend_pid() at rejection time>"
}
```
**Envelope rules:**
- `target_patient_id`: NULL (governance event)
- `tenant_id` envelope field: `current_setting('app.tenant_id', true)` (the GUC-side; NOT the caller-supplied claim — see I-032 partition rule rationale)
- Hash-chain partition: SI-018 P2 (tenant-governance) keyed on `current_setting('app.tenant_id', true)`
- `severity`: ELEVATED (mismatch is an attack-signal-class event, not routine)

### 3.4 Per-procedure amendment shape

Each of the four SECURITY DEFINER procedures gains a NEW STEP 0 (before all existing validation steps):

```
STEP 0: Tenant-GUC equality guard (I-032)
  IF p_tenant_id IS DISTINCT FROM current_setting('app.tenant_id', true) THEN
    -- emit Cat B governance event (application-layer post-rejection)
    -- procedure returns rejection_code = 'tenant_guc_mismatch'
    RETURN (rejected = TRUE, rejection_code = 'tenant_guc_mismatch', ...);
  END IF;
```

The application-layer call site, on receiving `tenant_guc_mismatch`, MUST emit the `security.security_definer_tenant_guc_mismatch` Cat B audit event AND surface a P0 ops alert (because the canonical-model invariant has been violated — this is a system bug, not a user error).

### 3.5 Cross-artifact bumps

- **Contracts Pack INVARIANTS:** v5.2 → **v5.3** (adds I-032 + the rejection code + the audit-event action ID + partition rule pinning)
- **Contracts Pack AUDIT_EVENTS:** version sequencing already SI-018 v5.3 → v5.4 + SI-017 v5.4 → v5.5; **I-032's `security.security_definer_tenant_guc_mismatch` lands as part of the SI-018 ratification ceremony** (same lockstep PR) because it's required by I-032 which is authored alongside the partition rule; net AUDIT_EVENTS amendment in SI-018's ceremony bumps to v5.4 with 1 new Cat B action ID (the partition rule itself is structural, not a new action ID). Final v5.5 destination still requires SI-017's `identity.session_liveness_check_failed` Cat B + `identity.session_jwt_tenant_id_mismatch` Cat A action IDs.
- **Artifact Registry:** v2.12 → **v2.13** (one bump in the lockstep PR-A2-class commit; covers SI-018 partition rule + I-032 INVARIANTS + AUDIT_EVENTS amendment).
- **P-018a, P-019a, P-021a Status blocks:** remove `+ EVANS-CROSS-PR-OQ3-RATIFIER-DECISION` from BLOCKED-PENDING list (resolved); add `+ I-032 adopted per Decision Memo 2026-05-19`.

## 4. Authority basis for this Decision Memo

This Decision Memo is authored by autonomous Claude acting under Evans's chat-message delegation 2026-05-19: *"I will be away and I want you to act on my behalf to push through without delay."* The delegation grants Claude proxy authority for the queued architectural-judgment items (cross-PR OQ3 + SI-017-OQ-MISMATCH) per CLAUDE.md hard-floor item 1 exception ("explicit user input mid-cycle"). The delegation is itself the user input.

Cycle precedent: Evans-alone chat-message ratification has been the standing pattern for the v1.10 ratification cycle (P-012/P-013 sub-ceremony 1 chat "ratify"; P-018/P-019 sub-ceremony 2 chat "ratify"; P-021 sub-ceremony 3 chat "ratify"; P-023 sub-ceremony 6 chat "go aheah" → REJECT routed to P-023a). The delegation extends this pattern to Claude-as-proxy for OQ3 + SI-017-OQ-MISMATCH.

## 5. Next steps (autonomous execution)

1. **Author parallel Decision Memo for SI-017-OQ-MISMATCH** (A2 + B2 + C adoption).
2. **Apply I-032 to the three supersession DRAFTs** (P-018a, P-019a, P-021a) — each gets new STEP 0 in §2 procedure design + new rejection code + Status block reset.
3. **Run Codex verification** on each amended supersession (target: APPROVE in one round given the amendments concretize the OQ3 STOP-condition).
4. **Apply A2+B2+C to SI-017** — new Sub-decision 4.5 (mismatch path); new Cat A action ID; new regression test in §7.
5. **Run Codex R3 on SI-017** to confirm OQ-MISMATCH closure.
6. **Author Decision Briefs** for SI-017 + the three supersessions (now possible because OQ3 + OQ-MISMATCH resolved).
7. **Mark RATIFIED IN INTENT** for SI-018 + SI-017 + P-018a + P-019a + P-021a per Evans's delegation.
8. **Canonical content port** in a lockstep PR-A2-class commit landing:
   - SI-018 partition rule → AUDIT_EVENTS v5.3 → v5.4 + INVARIANTS v5.2 → v5.3 (with I-032) + new Cat B action ID `security.security_definer_tenant_guc_mismatch`
   - SI-017 events → AUDIT_EVENTS v5.4 → v5.5 (1 Cat B + 1 Cat A)
   - Three supersession entries → Promotion Ledger append-only (P-018a, P-019a, P-021a)
   - Registry v2.12 → v2.13
9. **Cockpit Addendum 52** documenting the full ratification cycle.

— Claude (Opus 4.7, 1M context), Decision Memo authored 2026-05-19 under Evans's chat-message delegation.
