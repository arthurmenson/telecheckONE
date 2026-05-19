# PROPOSED Contracts Pack INVARIANTS Amendment — I-032 (Tenant-GUC equality guard on SECURITY DEFINER procedures with actor-tenant parameters)

**Status:** PROPOSED — awaiting Evans's ratification of cross-PR OQ3 Option A per the Decision Memo.
**Target file:** `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Contracts_Pack_v5_00_INVARIANTS.md`
**Version bump:** current → current +1 minor (apply at lockstep commit time; verify current state of INVARIANTS at apply time).
**Authority:** application requires Evans's chat-message ratification per CLAUDE.md hard-floor item 3.

---

## 1. Where to insert in the canonical INVARIANTS file

After the last existing invariant block (I-031 per v1.10 cycle additions), insert a new section:

```
---

## I-032 — Tenant-GUC equality guard on SECURITY DEFINER procedures with actor-tenant parameters
```

Update the §"Invariant inventory" table at the top of the file to include the new row.

## 2. Canonical text to insert verbatim

> **I-032 — Tenant-GUC equality guard on SECURITY DEFINER procedures with actor-tenant parameters**
>
> **Statement.** Any `SECURITY DEFINER` procedure that accepts an actor-tenant parameter (`p_tenant_id` or any equivalently-named parameter holding the caller's authenticated tenant identifier) MUST reject the call where `p_tenant_id` IS DISTINCT FROM `current_setting('app.tenant_id', true)` BEFORE performing any data mutation, idempotency lookup, advisory-lock acquisition, or state read.
>
> **Rejection contract.**
> - The rejection MUST be **step 0** of the procedure's validation sequence (i.e., it precedes all other validation steps including the existing auth-FIRST patterns).
> - The rejection MUST use the canonical rejection code `tenant_guc_mismatch`.
> - The procedure MUST return the rejection tuple WITHOUT raising a SQL exception (the application call site needs to receive structured rejection data so it can emit the canonical audit event + P0 alert; raising would abort the application transaction prematurely).
>
> **Audit-event emission contract.**
> - The application call site (NOT the procedure) MUST emit a Cat B audit event with `action_id = 'security.security_definer_tenant_guc_mismatch'` immediately after receiving the rejection tuple, BEFORE responding to the upstream request.
> - The audit event envelope MUST use **`tenant_id = current_setting('app.tenant_id', true)`** (the GUC-side value; NOT the caller-supplied `p_tenant_id`). Placing the audit signal under the session's actually-active tenant rather than the claimed-tenant prevents attacker-controlled partition placement — the legitimate tenant whose session/GUC is in use sees the mismatch in their audit chain; the attacker-claimed tenant does not.
> - The audit event MUST be partitioned per **SI-018 P2 (tenant-governance)** with `chain_partition_key = SHA-256("GENESIS:TENANT:<current_setting('app.tenant_id', true)>")`.
> - The audit event severity MUST be ELEVATED (mismatch is an attack-signal-class event, not routine).
>
> **Operational contract.**
> - On `tenant_guc_mismatch` rejection the application MUST raise a P0 ops alert with sufficient context (procedure name, GUC value, claim value, session_id, account_id) for an on-call engineer to triage.
> - The canonical SI-017 authContextPlugin contract guarantees that `SET LOCAL app.tenant_id` and procedure actor parameters are sourced from the SAME JWT-verified middleware tuple at request entry. I-032 enforces this invariant at the DB layer as defense-in-depth: a `tenant_guc_mismatch` in production indicates a middleware bug or confused-deputy path and is treated as a system bug (not user error).
>
> **Scope of application.**
> - I-032 applies to ALL existing SECURITY DEFINER procedures that accept an actor-tenant parameter: `record_workflow_pointer_swap()` (SI-008), `record_consult_escalation_target_swap()` (SI-009), `record_consult_clinician_decision()` (SI-005), `rotate_consult_clinician_decision_kms()` (SI-005). Each procedure's source code amendment lands in the same lockstep commit as I-032 per the lockstep invariant.
> - I-032 applies to ALL future SECURITY DEFINER procedures that accept an actor-tenant parameter. Reviewers MUST flag any new SECURITY DEFINER procedure that omits the STEP 0 equality guard.
>
> **Rationale.**
> SECURITY DEFINER procedures bypass RLS via PostgreSQL `SECURITY DEFINER` privilege. Tenant-isolation enforcement therefore moves from RLS-layer (where the GUC enforces automatically via row-level policies) to procedure-layer (where the procedure must enforce explicitly). The canonical SI-017 authContextPlugin contract treats application middleware as the single trust anchor for both `SET LOCAL app.tenant_id` and procedure actor parameters. I-032 codifies the parallel-trust-path equality as a DB-layer MUST, eliminating the class of "middleware bug or confused-deputy path" failure mode that Codex flagged on PR #17 P-019a R1 (review-mpcmsk90-zopinx) and PR #18 P-021a R3 (review-mpcn6wag-llvapb). Per the Decision Memo `Decision-Memo-Cross-PR-OQ3-Trust-Boundary-Equality-Guard-Option-A-Adopted-2026-05-19.md`: clinical-decision-recording + KMS-rotation + AI-workflow-execution + sync-session-escalation surfaces are safety-critical enough to justify the slim defense-in-depth cost.
>
> **Verification.**
> Each amended SECURITY DEFINER procedure ships with a regression test asserting:
> 1. Call with `p_tenant_id = current_setting('app.tenant_id')` → succeeds (or proceeds past STEP 0 to existing validation).
> 2. Call with `p_tenant_id <> current_setting('app.tenant_id')` → returns `tenant_guc_mismatch` rejection tuple WITHOUT mutating any row.
> 3. Application call site emits exactly one `security.security_definer_tenant_guc_mismatch` Cat B audit event partitioned per SI-018 P2 keyed on the GUC value (NOT the claim value).
> 4. P0 ops alert raised exactly once per mismatch.
>
> **Originated:** v1.10 ratification cycle, 2026-05-19. Ratified per `Decision-Memo-Cross-PR-OQ3-Trust-Boundary-Equality-Guard-Option-A-Adopted-2026-05-19.md` (pending Evans's chat-message confirmation as of authoring time).
>
> **Related:** I-023 (3-layer tenant-isolation enforcement); SI-017 (authContextPlugin contract — the trust anchor I-032 is defense-in-depth for); SI-018 (audit-chain partition rule — the partition contract I-032's audit event uses); P-018a/P-019a/P-021a (the supersession entries that apply I-032 to each affected procedure).

## 3. Invariant inventory table row to add

Append to the inventory table near the top of INVARIANTS file:

```markdown
| I-032 | Tenant-GUC equality guard on SECURITY DEFINER procedures with actor-tenant parameters | v1.10 ratification cycle 2026-05-19 | Application |
```

(Adjust column shape to match the existing table's actual columns at commit time; current canonical INVARIANTS file's exact column shape should be the source of truth.)

## 4. Doc-control update

If the INVARIANTS file uses a header doc-control block, add a row:

```
| 2026-05-19 | v5.X | I-032 added per Decision Memo Cross-PR OQ3 Option A ratification. Codifies tenant-GUC equality guard on SECURITY DEFINER procedures with actor-tenant parameters as defense-in-depth on top of SI-017 authContextPlugin trust anchor. |
```

(`v5.X` filled in at apply time based on current INVARIANTS version.)

---

— Claude (Opus 4.7, 1M context), PROPOSED I-032 text authored 2026-05-19 under non-ratification autonomous-work authorization.
