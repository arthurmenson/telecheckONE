# PROPOSED SECURITY DEFINER procedure amendments — STEP 0 equality guard for I-032 (2026-05-19)

**Status:** PROPOSED — awaiting Evans's ratification of cross-PR OQ3 Option A.
**Authority:** application requires Evans's chat-message ratification per CLAUDE.md hard-floor item 3.
**Scope:** four SECURITY DEFINER procedures across SI-005, SI-008, SI-009. Each gets a NEW STEP 0 inserted before all existing validation steps.

---

## 1. Common STEP 0 specification (applied to all four procedures)

All four procedures gain this identical STEP 0 inserted as the FIRST validation block, before any existing step (idempotency, advisory lock, state read, auth-FIRST, etc.):

```sql
-- STEP 0: I-032 Tenant-GUC equality guard
-- Reject the call if the caller-supplied actor-tenant parameter disagrees with the
-- session's bound app.tenant_id GUC. The canonical SI-017 authContextPlugin contract
-- guarantees both surfaces derive from the same JWT-verified middleware tuple, so a
-- mismatch indicates a middleware bug or confused-deputy path (system bug, not user
-- error). The rejection is structured (not RAISE) so the application call site receives
-- the rejection tuple and can emit the canonical security.security_definer_tenant_guc_mismatch
-- Cat B audit event + P0 ops alert.

IF p_tenant_id IS DISTINCT FROM current_setting('app.tenant_id', true) THEN
  RETURN ROW(
    TRUE,                                   -- rejected
    'tenant_guc_mismatch'::text,            -- rejection_code
    NULL::uuid,                             -- prior_outcome_audit_id (N/A for I-032 rejection)
    -- ... remaining return tuple fields filled with NULL/default for the procedure's signature
  )::<procedure_return_type>;
END IF;
```

The `<procedure_return_type>` placeholder is the existing return-tuple type of each procedure; the I-032 rejection tuple fills with the rejection flag + rejection_code + NULLs for all other fields. Per-procedure return-type details below.

## 2. Per-procedure application

### §SI-008 — `record_workflow_pointer_swap()`

**File:** apply within P-018a §2 Sub-decision 8 procedure design block.

**Existing 11-step validation order** (preserved per P-018a Sub-decision 8 preservation note): auth-FIRST → idempotency → advisory-lock → CAS → supersession-chain-cycle → state validation → atomic UPDATE → paired domain-event INSERT → audit-row consult-binding (NOTE: this procedure is for AI workflow executions, not consults; "consult-binding" is from SI-005 — SI-008 has its own analogous binding) → unique_violation safety net → rejection emission.

**After amendment:** STEP 0 (I-032 equality guard) inserted before existing step 1 (auth-FIRST). Re-numbered to 12-step validation.

**Rejection code set update:** add `tenant_guc_mismatch` to P-018's preserved 5-code set → now 6 codes:
- `cas_mismatch`, `supersession_pointer_mismatch`, `chain_cycle`, `state_invalid`, `unauthenticated`, **`tenant_guc_mismatch`**.

### §SI-009 — `record_consult_escalation_target_swap()`

**File:** apply within P-019a §2 Sub-decision 3 procedure design block.

**Existing four-predicate atomic UPDATE flow + R5/R6 closures** (preserved per P-019 Sub-decisions 3 + 4 ratified content): caller-supplied actor params (per P-019a supersession) → atomic UPDATE with four predicates (CAS + consult-state + new-session-existence + new-session-state-actionable) → audit emission → return tuple.

**After amendment:** STEP 0 (I-032 equality guard) inserted before the four-predicate UPDATE block.

**Rejection code set update:** add `tenant_guc_mismatch` to P-019's existing rejection code set. (P-019 canonical entry doesn't enumerate rejection codes as cleanly as P-018; verify exact set at apply time and append `tenant_guc_mismatch`.)

### §SI-005 — `record_consult_clinician_decision()` (one of two procedures)

**File:** apply within P-021a §2 Sub-decision 1 procedure design block (was Sub-decision #5 in canonical P-021; P-021a renames it Sub-decision 1).

**Existing 11-step validation order** (preserved per P-021a Sub-decision 1 preservation note): auth-FIRST → idempotency-key-validation → advisory-lock-for-first-use-idempotency-key-race → idempotent-replay-with-prior_outcome → state-machine-consistency-CHECK → audit-row-consult-binding-validation → atomic-UPDATE-with-state-transition → paired `consult_events` INSERT → unique_violation safety net → rejection emission → audit emission.

**After amendment:** STEP 0 (I-032 equality guard) inserted before existing step 1 (auth-FIRST). Re-numbered to 12-step validation.

**Rejection code set update:** add `tenant_guc_mismatch` to P-021's 7-code set → now 8 codes:
- `cas_mismatch`, `state_invalid`, `state_consistency_violation`, `idempotency_replay_outcome_mismatch`, `audit_consult_binding_mismatch`, `unauthenticated`, `unique_violation` (existing 7), + **`tenant_guc_mismatch`**.

### §SI-005-rotate — `rotate_consult_clinician_decision_kms()` (second of two procedures)

**File:** apply within P-021a §2 Sub-decision 2 procedure design block.

**Existing flow** (per P-021a Sub-decision 4 normative binding): MANDATORY `p_rotation_scope` enum validation → scope-consistency CHECK between `p_rotation_scope` and `p_target_patient_id` → KMS rotation mutation → return tuple with `(p_rotation_scope, p_target_patient_id, affected_row_count, affected_patient_id_set)`.

**After amendment:** STEP 0 (I-032 equality guard) inserted BEFORE the `p_rotation_scope` enum validation. Sub-decision 4's three new rejection codes (`invalid_rotation_scope`, `scope_target_mismatch`, `rotation_scope_violation`) remain unchanged.

**Rejection code set update:** add `tenant_guc_mismatch` to P-021a Sub-decision 4's extended set → 4 codes total for this procedure (`invalid_rotation_scope`, `scope_target_mismatch`, `rotation_scope_violation`, **`tenant_guc_mismatch`**).

## 3. Application-layer call site amendments

Each of the four procedures' application-layer call sites (in the Async Consult slice handler / AI Workflow Engine handler / Sync Consult slice handler / KMS rotation worker) gain a unified rejection-handler:

```typescript
// Pseudocode — actual TypeScript awaits the future code repo
const result = await db.callSecurityDefiner(<procedureName>, params);
if (result.rejected && result.rejection_code === 'tenant_guc_mismatch') {
  // I-032 rejection contract: emit canonical Cat B audit event + P0 alert
  await auditWriter.emit({
    action_id: 'security.security_definer_tenant_guc_mismatch',
    category: 'B',
    severity: 'ELEVATED',
    target_patient_id: null,
    tenant_id: appTenantIdGuc,  // GUC-side value, NOT params.p_tenant_id
    resource_type: 'security_definer_procedure',
    resource_id: <procedureName>,
    chain_partition_key: sha256(`GENESIS:TENANT:${appTenantIdGuc}`),
    detail: {
      procedure_name: <procedureName>,
      p_tenant_id: params.p_tenant_id,
      app_tenant_id: appTenantIdGuc,
      session_id: params.p_session_id,
      p_account_id: params.p_account_id,
      rejected_at: result.rejected_at,
      pg_backend_pid: result.pg_backend_pid,
    },
  });
  await opsAlerter.raiseP0(`I-032 tenant_guc_mismatch in ${<procedureName>}`, { ...detail... });
  // Respond to upstream with 500 (internal server error — system bug, not user error)
  throw new InternalSystemError('Tenant context inconsistency; on-call notified.');
}
// Otherwise process the procedure's normal return tuple
```

## 4. Codex verification scope (Scope B per the master Bundle file)

> Verify that all four SECURITY DEFINER procedure specs (P-018a SI-008, P-019a SI-009, P-021a SI-005 record + P-021a SI-005 rotate) have STEP 0 equality guard as the FIRST validation step (before idempotency, advisory lock, state read) per I-032; that `tenant_guc_mismatch` is in each procedure's rejection code set; that the rejection emits the audit event via application-layer call site post-rejection (NOT in-procedure RAISE); that the audit event uses `current_setting('app.tenant_id', true)` for the envelope `tenant_id` and partition_key (NOT the caller-supplied `p_tenant_id`); that P0 ops alert is required on `tenant_guc_mismatch`; that the regression tests pin these contract points.

---

— Claude (Opus 4.7, 1M context), PROPOSED procedure amendments authored 2026-05-19 under non-ratification autonomous-work authorization.
