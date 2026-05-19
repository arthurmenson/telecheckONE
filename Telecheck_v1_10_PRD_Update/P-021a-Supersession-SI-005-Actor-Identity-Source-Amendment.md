# Proposed Promotion Ledger entry P-021a — SI-005 actor-identity-source supersession (amends P-021 sub-decisions touching rejected SI-010 primitives onto the canonical middleware-GUC + JWT-verified-context model)

**Version:** 0.1 DRAFT
**Status:** BLOCKED-PENDING-SI-017-RATIFICATION + SI-018-RATIFICATION
**Authoring location:** `Telecheck_v1_10_PRD_Update/`
**Owner:** Engineering Lead + Async Consult slice owner
**Target P-NUM:** P-021a (supersession of P-021 SI-005)
**Related artifacts:**
- Promotion Ledger entry P-023a (SI-010 rejection)
- SI-017 v0.1 DRAFT (Phase 2 F-3 within canonical middleware-GUC model; prerequisite)
- SI-018 v0.2 DRAFT (audit-chain partition rule; prerequisite)
- P-018a + P-019a v0.1 DRAFTs (parallel supersessions; same pattern)
- Existing canonical P-021 entry — SI-005 `record_consult_clinician_decision()` + `rotate_consult_clinician_decision_kms()` SECURITY DEFINER procedures (entry header at line 482 of current ledger; **Sub-decision #5** at line 515 — the only numbered sub-decision that references SI-010; `rotate_consult_clinician_decision_kms()` is implicit in the 8-column KMS envelope per Sub-decision #3 line 522 + the broader SI-005 v0.2 ratified content per P-023 lines 257 + 263). P-021a supersedes the actor-identity-source portion of Sub-decision #5 plus the implicit KMS-rotation-procedure actor-identity-source.

---

## 1. Why this supersession exists

Same trigger as P-018a / P-019a. SI-010 rejection per P-023a requires amending P-021's IMPL-readiness-blocking sub-decisions onto the canonical model. P-021 SI-005 has TWO SECURITY DEFINER procedures (`record_consult_clinician_decision()` + `rotate_consult_clinician_decision_kms()`); both reference SI-010 helpers and both need amending. Same single ratifier ceremony.

**Scope is explicitly narrow:** procedure design sub-decisions amended for actor-identity source + audit-emission location; all OTHER P-021 sub-decisions stand unchanged (including the 8-column flat KMS envelope mirroring SI-005's precedent, FK 6 + FK 7 triple-composite shapes, 5 clinician-decision column groups, two-tier append-only on consults, `consult_events` strict append-only via BEFORE UPDATE + BEFORE DELETE triggers, 11-step validation including auth-FIRST + advisory-lock for first-use idempotency-key race + idempotent-replay + audit-row consult-binding validation + atomic UPDATE + paired `consult_events` INSERT + unique_violation safety net, 7 rejection codes, etc.).

---

## 2. Proposed Promotion Ledger entry text

### Entry P-021a — 2026-05-19 (authored; ratification date TBD) — SI-005 actor-identity-source supersession: amend `record_consult_clinician_decision()` + `rotate_consult_clinician_decision_kms()` to source actor identity from canonical middleware-GUC + JWT-verified-context per SI-017 + SI-018 (supersedes the actor-identity-source portion of P-021 Sub-decision #5 + the implicit KMS-rotation procedure actor-identity-source + the audit-emission-LOCATION portion of Sub-decision #5's 11-step validation framework's audit-durability behavior; preserves all other P-021 sub-decisions unchanged including the 11-step validation framework's idempotency + concurrency + state-consistency primitives)

**Type:** Reconciliation entry (no Registry version bump).

**Status:** **DRAFT / BLOCKED-PENDING-SI-017-RATIFICATION + SI-018-RATIFICATION.** Promotion to RATIFIED IN INTENT requires workstream lead chat-message sign-off; promotion to CANONICAL requires the ratifier ceremony, which cannot run until SI-017 + SI-018 ratify first. **No canonicality claim is made by this DRAFT.**

**Author:** Autonomous Claude (P-021a v0.1 DRAFT authored 2026-05-19).

**Trigger:** Same as P-018a / P-019a — SI-010 trust-anchor layer rejected per P-023a; P-021's references to SI-010 primitives must amend onto the canonical model once SI-017 and SI-018 ratify.

**Promotion class:** reconciliation.

**Sub-decision supersessions** (the only material changes vs the canonical P-021 entry):

1. **P-021 Sub-decision #5 (line 515; `record_consult_clinician_decision()` SECURITY DEFINER procedure with 11-step validation) is AMENDED at the actor-identity-source step:** the procedure receives actor identity as parameters from JWT-verified application context (same pattern as P-018a / P-019a). The 11-step validation framework's auth-FIRST discipline is preserved unchanged at the policy level — the application middleware performs JWT verify + SI-017 liveness check + tenant resolution BEFORE the procedure is invoked, so the procedure's "auth-FIRST" step trusts the application-supplied parameters per I-023 layer 2. The advisory-lock + idempotent-replay + audit-row consult-binding validation + atomic UPDATE + paired `consult_events` INSERT + unique_violation safety net all preserved unchanged.
2. **`rotate_consult_clinician_decision_kms()` SECURITY DEFINER procedure is AMENDED (same actor-identity-source pattern as Sub-decision #5 above; not a separately numbered sub-decision in canonical P-021 but referenced explicitly in P-023 lines 257 + 263 as one of the four SECURITY DEFINER procedures depending on SI-010 helpers).** The KMS-rotation procedure trusts caller-supplied parameters from JWT context; does not re-verify identity at DB layer.
3. **Audit-emission LOCATION (within P-021 Sub-decision #5's 11-step validation framework's audit-durability behavior) is AMENDED:** Audit-event emission moves from inside-procedure to application-layer immediately after procedure-success return per the engineering-review-grounded canonical pattern (per `Telecheck_v1_10_PRD_Update/Engineering-Review-Request-I-003-Atomic-Audit-Inside-vs-Application-Layer-Audit-2026-05-19.md`'s unanimous NO answer). The P-021 audit-durability framework (advisory-lock + idempotent-replay + unique_violation safety net + `audit_swap_rejection_log` autonomous-tx backstop pattern shared with P-018/P-019 per Sub-decision #5's 11-step validation) is preserved; only the audit-emission LOCATION changes. Per SI-018's two-tier audit-chain PARTITION rule, **`record_consult_clinician_decision()`** audit_events record lives in **P1 (patient-bound)** because `target_patient_id` IS NOT NULL (Consult clinician decision is patient-bound clinical evidence): `chain_partition_key = SHA-256("GENESIS:PATIENT:<target_patient_id>")`; Cat A clinical-decision-evidence class. **Distinct from P-018a/P-019a which are P2 (tenant-governance)** because those procedures' events are NOT patient-bound.

4. **`rotate_consult_clinician_decision_kms()` audit-event SI-018 partition tier is NORMATIVELY BOUND TO PROCEDURE-VALIDATED ROTATION SCOPE (closes Codex R1 HIGH-1 + R2 HIGH-1 on PR #18):** SI-018's two-tier partition rule is per-event, so without a binding contract, an implementation could emit a tenant-wide P2 event for a single-patient rotation or a P1 event without `target_patient_id` for a batch rotation. The supersession therefore makes the partition rule normative for the KMS rotation call path with **mandatory procedure-level enum validation and scope-consistency rejection** (not caller-context-derived):
   - **`p_rotation_scope` is a MANDATORY procedure parameter** with closed enum `('single_patient' | 'batch_tenant')` — no default, no optional, no caller-context-derived scope. The procedure rejects on `NULL` or non-enum values with a dedicated rejection code (`invalid_rotation_scope`).
   - **`p_target_patient_id` is a MANDATORY procedure parameter** typed UUID NULLABLE with a scope-consistency CHECK enforced in-procedure BEFORE the KMS-rotation mutation: `IF p_rotation_scope = 'single_patient' AND p_target_patient_id IS NULL THEN reject('scope_target_mismatch')`; `IF p_rotation_scope = 'batch_tenant' AND p_target_patient_id IS NOT NULL THEN reject('scope_target_mismatch')`. The procedure additionally validates that exactly the rows scoped by the parameters were rotated (procedure returns `affected_row_count` + `affected_patient_id_set`; single-patient rotation MUST return exactly 1 row matching `p_target_patient_id`; batch_tenant rotation MUST return >0 rows all within `p_tenant_id` and never include a patient outside the tenant boundary).
   - **Single-patient rationale-envelope rotation** (rotation targets exactly one Consult row's `clinician_decision_rationale_encrypted` envelope; `p_rotation_scope = 'single_patient'` + `p_target_patient_id IS NOT NULL`): audit_events record lives in **P1 (patient-bound)** with `target_patient_id = p_target_patient_id`; `chain_partition_key = SHA-256("GENESIS:PATIENT:<target_patient_id>")`; Cat A.
   - **Batch / tenant-governance rotation** (rotation targets all rationale envelopes for a tenant during a KMS key-version rollover or compliance rotation; `p_rotation_scope = 'batch_tenant'` + `p_target_patient_id IS NULL`): audit_events record lives in **P2 (tenant-governance)** with `target_patient_id IS NULL`; `chain_partition_key = SHA-256("GENESIS:TENANT:<tenant_id>")`; Cat B governance.
   - **Application audit-emission call site contract:** the caller MUST construct the audit envelope from the **procedure's validated and returned scope + affected-row tuple**, NOT from unspecified invocation context. Specifically, the audit envelope's `partition_key` and `target_patient_id` fields derive from the procedure's `(p_rotation_scope, p_target_patient_id, affected_row_count, affected_patient_id_set)` return tuple after the procedure has validated scope-consistency. Callers cannot synthesize partition_key from arbitrary application state. Mixed-scope or ambiguous rotations are rejected by the procedure (not silently mispartitioned at the caller). If a future use case requires multi-patient-but-not-tenant-wide scope, it requires a separate normative amendment introducing a new enum value + new validation rules.
   - **New rejection codes added to P-021's existing 7-code set** (preserved per §"Preserved P-021 sub-decisions" but now extended for the KMS rotation surface): `invalid_rotation_scope` (NULL or non-enum value), `scope_target_mismatch` (scope/target inconsistency), `rotation_scope_violation` (procedure detected rows rotated outside the declared scope, e.g., single-patient scope but >1 row mutated, or batch_tenant but a row outside p_tenant_id was rotated).

**Important preservation note for `consult_events` domain-event INSERT:** the P-021 procedure's "atomic UPDATE + paired `consult_events` INSERT" remains atomic INSIDE the procedure (per the original P-021 ratified design). `consult_events` is a DOMAIN-EVENT table (not the `audit_events` table); domain-event atomicity is a separate property from audit-event emission and stays inside the procedure. The amendment only moves the AUDIT-event emission (the `audit_events` table INSERT) to the application layer. This distinction is critical and matches the engineering-review answer's framing: application-transaction-level atomicity for audit; inside-procedure atomicity for domain events when needed.

**Preserved P-021 sub-decisions** (unchanged from the canonical P-021 entry):

- **CDM §4.27 Consult + §4.28 ConsultEvent entity expansions.**
- **2 triple-composite FKs (FK 6 + FK 7) referencing SI-008's `ai_workflow_executions` + SI-009's `sync_sessions`.**
- **5 clinician-decision column groups** (decided_by + class 5-value enum + at + audit_id + 8-column KMS envelope for rationale).
- **8-column flat KMS envelope mirroring SI-005's existing pattern.**
- **Two-tier append-only on consults clinician-decision columns** (Tier 0 identity immutable from INSERT + Tier 1 payload immutable post-decision; Tier 2 state-machine progression via guarded transitions).
- **CDM state-transition validator + strict append-only triggers** (`consults_state_transition_validator`, `consult_events_strict_append_only_*`).
- **7 rejection codes for the clinician-decision procedure.**
- All P-021 cross-artifact impact: CDM §4.27 + §4.28 entity expansions; AUDIT_EVENTS 3 net-new Cat A action IDs; DOMAIN_EVENTS v5.2 in-place 2 net-new types.

**Cluster B HARD-sequencing implication:** P-021a does NOT affect Cluster B HARD-sequencing closure (which already closed at SC3 P-021 ratification). The FK 6 + FK 7 references to SI-008 + SI-009 row shapes are unchanged.

**Engineering review grounding:** same as P-018a / P-019a — application-layer audit emission satisfies I-003 + HIPAA + BAA chain posture.

**Trust-posture documentation (per SI-017 canonical model; pre-emptive Option B closure of the trust-boundary class of finding flagged on P-019a R1 HIGH-1):**

Both `current_setting('app.tenant_id')` (set via `SET LOCAL` by authContextPlugin) AND the procedure's actor parameters (`p_account_id`, `p_tenant_id`, `p_role`, `p_admin_home_tenant_id`, `p_session_id`) originate from the **same authContextPlugin middleware request scope**. The plugin verifies the JWT once per request, resolves the tuple, and (a) emits `SET LOCAL app.tenant_id = <tenant_id>` on the connection and (b) passes those same values as parameters to any SECURITY DEFINER call within the same request. There is no separate trust path; both surfaces are bound to the same JWT-verified tuple at middleware entry. pgbouncer transaction-mode + `SET LOCAL` (per System Architecture v1.2 §5) guarantee per-request scope on the GUC. The procedure does NOT add a DB-side equality guard between `p_tenant_id` and `current_setting('app.tenant_id')`; that would be a redundant defense-in-depth layer, not an isolation primitive. **The ratifier may choose to add one as a defensive guard at ratification — see §4 Open Question 3.**

**Patient-bound audit-chain partition tier (P1) note:** Unlike P-018a + P-019a which place their audit events in P2 (tenant-governance because they are not patient-bound), P-021a's `record_consult_clinician_decision()` event is patient-bound clinical evidence (Cat A) and therefore lives in P1 (patient-bound) per SI-018's canonical partition rule. The `rotate_consult_clinician_decision_kms()` event partition tier is **normatively bound to rotation scope** per Sub-decision 4 above (P1 for single-patient; P2 for batch/tenant-governance).

**Registry absorption:** No Registry version bump (reconciliation entry).

---

## 3. Sub-decisions for ratifier ceremony

Four sub-decisions, all APPROVED RECOMMENDATION:

### Sub-decision 1: Amend P-021 Sub-decision #5 (record_consult_clinician_decision() procedure actor-identity source)

Procedure receives actor identity as JWT-verified application-supplied parameters; 11-step validation framework preserved unchanged at policy level; auth-FIRST trust boundary is application middleware per I-023 layer 2.

**Recommendation: APPROVE.**

### Sub-decision 2: Amend rotate_consult_clinician_decision_kms() procedure (same pattern)

KMS-rotation procedure trusts caller-supplied parameters from JWT context.

**Recommendation: APPROVE.**

### Sub-decision 3: Amend the audit-emission LOCATION within Sub-decision #5's 11-step validation framework

Audit-event emission moves from inside-procedure to application-layer immediately after procedure-success return. Important: domain-event (`consult_events`) atomicity stays inside procedure (per the unchanged "atomic UPDATE + paired `consult_events` INSERT" step of the 11-step validation); audit-event (`audit_events`) emission moves to application layer. SI-018 partition tier for `record_consult_clinician_decision()` is **P1 (patient-bound)** because `target_patient_id` IS NOT NULL.

**Recommendation: APPROVE.**

### Sub-decision 4: Normatively bind `rotate_consult_clinician_decision_kms()` audit-event partition tier to procedure-validated rotation scope

`p_rotation_scope` is a MANDATORY procedure parameter with closed enum `('single_patient' | 'batch_tenant')`. `p_target_patient_id` is MANDATORY with scope-consistency CHECK enforced IN-PROCEDURE before mutation. Procedure validates that rows actually rotated match the declared scope (returns `affected_row_count` + `affected_patient_id_set`); mismatches rejected with new codes (`invalid_rotation_scope`, `scope_target_mismatch`, `rotation_scope_violation`). P1 (patient-bound) for single_patient; P2 (tenant-governance) for batch_tenant. Application audit-emission call site MUST construct audit envelope from procedure-validated return tuple — not arbitrary caller context.

**Recommendation: APPROVE.**

---

## 4. Open questions for ratifier

### Open Question 1: 11-step validation framework — does any step explicitly require server-trusted identity that the application layer can't satisfy?

The P-021 11-step validation framework's auth-FIRST step originally relied on SI-010 helpers for actor identity. With the supersession, the application performs JWT verify + SI-017 liveness check BEFORE invoking the procedure; the procedure's auth-FIRST step trusts the application-supplied parameters. Is this trust shift acceptable for the safety-critical clinical-decision-recording surface?

**Recommendation:** YES. The application-layer trust boundary is the canonical model's posture for every other clinical-decision-recording call (other slice PRDs follow this pattern). The 11-step validation's value is in the idempotency + concurrency + state-consistency checks (advisory-lock, CAS, append-only triggers), not in re-verifying the actor's identity at the DB layer — that's the application's job.

### Open Question 2: Codex pre-ratification target

**Recommendation:** 2 rounds + 1 verification. STOP-and-escalate per discipline floor.

### Open Question 3: DB-side equality guard on `p_tenant_id` vs `current_setting('app.tenant_id')` (mirrors P-019a OQ3)

Same trust-boundary class of question as P-019a §4 OQ3:

- **Option A (defense-in-depth invariant — canonical-contract amendment; hard-stop architectural judgment per CLAUDE.md hard-floor item 6):** Add a canonical platform-floor invariant requiring all SECURITY DEFINER procedures accepting actor-tenant parameters to reject calls where `p_tenant_id <> current_setting('app.tenant_id')`. Would land in a Contracts Pack INVARIANTS amendment.
- **Option B (document existing posture — within-scope clarification):** Document that the canonical SI-017 authContextPlugin contract binds both `SET LOCAL app.tenant_id` and procedure actor parameters to the same JWT-verified middleware tuple. **§2 trust-posture documentation has applied Option B.**

**Recommendation:** Surface to Evans at the morning review (same question shape as P-019a). Recommendation is Option B (canonical model already binds both surfaces). If Evans wants Option A, escalate to ratifier ceremony with a Decision Memo proposing the new invariant.

### Open Question 4: `rotate_consult_clinician_decision_kms()` audit event partition tier — RESOLVED in §2 Sub-decision 4

Resolved by promoting from §4 to a normative Sub-decision 4 in §2 (closes Codex R1 HIGH-1 on PR #18): partition tier is normatively bound to rotation scope (P1 for single-patient; P2 for batch/tenant-governance). Application audit-emission call site MUST derive partition_key from rotation scope before constructing the audit envelope. No longer an open question.

---

## 5. Cross-artifact impact

Same as P-018a / P-019a — ZERO canonical contract amendments by P-021a directly.

---

## 6. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; **BLOCKED-PENDING-SI-017-RATIFICATION + SI-018-RATIFICATION.**

---

## 7. Sequence for ratification

Same as P-018a / P-019a — runs in parallel after SI-017 + SI-018 ratify.

---

**End of P-021a v0.1 DRAFT.**
