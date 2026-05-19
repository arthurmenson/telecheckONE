# Proposed Promotion Ledger entry P-018a — SI-008 actor-identity-source supersession (amends P-018 sub-decisions touching rejected SI-010 primitives onto the canonical middleware-GUC + JWT-verified-context model)

**Version:** 0.1 DRAFT
**Status:** BLOCKED-PENDING-SI-017-RATIFICATION + SI-018-RATIFICATION (the proposed supersession entry cites SI-017's canonical Phase 2 F-3 liveness pattern + SI-018's audit-chain partition rule; cannot ratify before its prerequisites ratify)
**Authoring location:** `Telecheck_v1_10_PRD_Update/` (workstream folder; the proposed entry text will be appended to `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Promotion_Ledger.md` when ratified)
**Owner:** Engineering Lead + Async Consult slice owner + AI Workflow Engine slice owner
**Target P-NUM:** P-018a (supersession of P-018 SI-008; appended below P-018 in the canonical ledger per append-only discipline)
**Related artifacts:**
- Promotion Ledger entry P-023a (SI-010 rejection; explicitly queued P-018a/P-019a/P-021a supersession entries in §"Open follow-ups")
- SI-017 v0.1 DRAFT (Phase 2 F-3 within canonical middleware-GUC model; prerequisite)
- SI-018 v0.2 DRAFT (audit-chain partition rule; prerequisite)
- Existing canonical Promotion Ledger entry P-018 — SI-008 `record_workflow_pointer_swap()` SECURITY DEFINER procedure (line 640 of current ledger; the entry P-018a supersedes specific sub-decisions of)

---

## 1. Why this supersession exists

The canonical P-018 SI-008 entry was ratified at sub-ceremony 2 of the Q2 2026 ratifier ceremony (Cluster B HARD-sequenced; chat-message "ratify" 2026-05-17). At that time, P-018 sub-decisions reasonably referenced SI-010's `_session_actor_context` helpers as the actor-identity-source for the `record_workflow_pointer_swap()` SECURITY DEFINER procedure ("DEFERRED to SI-010 landing per IMPL-readiness gate" — line 640 of canonical ledger).

SI-010 was subsequently REJECTED via Promotion Ledger entry P-023a (2026-05-19). The procedure's design itself stands — KMS envelope, CAS-and-supersession protocol, bidirectional pointer invariant, three-tier audit durability framework, 5 rejection codes, etc., all remain ratified. But the specific sub-decision tying the procedure's actor-identity source to SI-010 helpers must be amended onto the canonical middleware-GUC + JWT-verified-context model.

P-018a is that amendment. **Scope is explicitly narrow:** two P-018 sub-decisions are amended — Sub-decision 8 (procedure design) for actor-identity-source, and Sub-decision 10 (audit durability) for audit-emission location. All other P-018 sub-decisions stand unchanged. The two amendments are tightly coupled because the audit-emission-location change is a direct downstream consequence of moving actor identity out of the procedure (the audit envelope's actor fields come from the same JWT-verified application context as the procedure parameters).

---

## 2. Proposed Promotion Ledger entry text (this will append to the canonical ledger when ratified)

### Entry P-018a — 2026-05-19 (authored; ratification date TBD) — SI-008 actor-identity-source supersession: amend `record_workflow_pointer_swap()` to source actor identity from canonical middleware-GUC + JWT-verified-context per SI-017 + SI-018 (supersedes P-018 Sub-decisions 8 + 10 portions; preserves all other P-018 sub-decisions unchanged)

**Type:** Reconciliation entry (no Registry version bump; supersedes specific sub-decisions of an existing canonical entry without introducing new canonical content beyond what SI-017 and SI-018 already establish).

**Status:** **DRAFT / BLOCKED-PENDING-SI-017-RATIFICATION + SI-018-RATIFICATION.** Promotion to RATIFIED IN INTENT requires workstream lead chat-message sign-off; promotion to CANONICAL requires the ratifier ceremony, which cannot run until SI-017 + SI-018 ratify first. **No canonicality claim is made by this DRAFT.**

**Author:** Autonomous Claude (P-018a v0.1 DRAFT authored 2026-05-19 in workstream folder; Decision Brief artifact to follow after SI-017 + SI-018 ratify; ratifier ceremony scheduled after prerequisites complete).

**Trigger:** SI-010 trust-anchor layer rejected per Promotion Ledger entry P-023a 2026-05-19. The P-018 SI-008 procedure design referenced SI-010 helpers for actor-identity derivation; that reference must be amended onto the canonical model once SI-017 (Phase 2 F-3 within canonical middleware-GUC) and SI-018 (audit-chain partition rule) ratify. P-018a is BLOCKED-PENDING those prerequisites.

**Promotion class:** reconciliation — supersedes a specific sub-decision of P-018, preserves all other P-018 sub-decisions, no new canonical content beyond what SI-017 + SI-018 already establish.

**Sub-decision supersessions** (the only material change vs the canonical P-018 entry):

1. **P-018 Sub-decision 8 (record_workflow_pointer_swap() SECURITY DEFINER procedure) is AMENDED:** the procedure's actor-identity source changes from "SI-010 `current_actor_*()` helpers reading from `_session_actor_context` table" (rejected per P-023a) to **"caller-supplied actor identity parameters (p_account_id, p_tenant_id, p_role, p_admin_home_tenant_id, p_session_id) sourced from the authContextPlugin's JWT-verified middleware-resolved actor context per SI-017."** The application bears the trust-boundary responsibility for these parameters (same as every RPC the platform issues per the canonical model); the procedure does NOT re-verify identity (no procedure-side trust anchor; SI-010 rejected).
2. **P-018 Sub-decision 10 (three-tier audit durability) is AMENDED:** The audit-emission-LOCATION changes; the three-tier durability FRAMEWORK is preserved. Specifically, **durability tier D1** (formerly "Tier 1") audit emission moves from inside-procedure (rejected per P-023a) to **application-layer immediately after procedure-success return per the engineering-review-grounded canonical pattern** (per `Telecheck_v1_10_PRD_Update/Engineering-Review-Request-I-003-Atomic-Audit-Inside-vs-Application-Layer-Audit-2026-05-19.md`'s unanimous NO answer). **Durability tier D2** (`audit_swap_rejection_log` autonomous-transaction backstop) and **durability tier D3** (caller-required-commit-boundary contract) are unchanged. The relabeling D1/D2/D3 (durability tiers) vs SI-018's P1/P2 (partition tiers) is a notational disambiguation — the underlying P-018 framework is preserved; it is renamed in this entry only to avoid collision with SI-018's two-tier partition vocabulary. Per SI-018, this procedure's `audit_events` record is **partition tier P2 (tenant-governance)**: `target_patient_id` IS NULL; `tenant_id` is the operating tenant; `chain_partition_key = SHA-256("GENESIS:TENANT:<tenant_id>")`; Cat B governance-class.

**Preserved P-018 sub-decisions** (unchanged from the canonical P-018 entry):

- P-018 Sub-decisions 1–7: 5-state vocab for `ai_workflow_executions.status`; Pattern A protocol-versioning pin (`activated_protocol_version_at_execution`); TOAST-BYTEA `recommendation` storage at v1.0; 8-column flat KMS envelope (`recommendation_*`); composite FK rules; bidirectional pointer invariant; CAS-and-supersession protocol.
- P-018 Sub-decision 9: `supersedes_execution_id` IMMUTABLE post-INSERT via BEFORE UPDATE trigger.
- P-018 Sub-decision 11: 5 rejection codes (`cas_mismatch | supersession_pointer_mismatch | chain_cycle | state_invalid | unauthenticated`).
- All P-018 cross-artifact impact: CDM §4.23 AiWorkflowExecution entity expansion; AUDIT_EVENTS additions for AI workflow audit events (per SI-008 canonical content port); DOMAIN_EVENTS amend-in-place additions.

**Changes (to be ratified at P-018a ratifier ceremony; ratifier-quorum required per CLAUDE.md hard-floor item 3):**

The actor-identity-source change for `record_workflow_pointer_swap()`:

```
BEFORE (referenced SI-010, now rejected):
  Procedure derives actor identity from:
    current_actor_account_id()
    current_actor_account_tenant_id()
    current_actor_role()
    current_actor_admin_home_tenant_id()
  (helpers reading from _session_actor_context table; SI-010 trust-anchor)

AFTER (canonical middleware-GUC model per SI-017):
  Procedure accepts as parameters:
    p_account_id          UUID NOT NULL
    p_tenant_id           VARCHAR NOT NULL  -- matches current_setting('app.tenant_id')
    p_role                VARCHAR NOT NULL
    p_admin_home_tenant_id VARCHAR NULL
    p_session_id          UUID NOT NULL
    (other operational params unchanged)

  Caller (application) is responsible for supplying these parameters
  from the authContextPlugin's JWT-verified middleware-resolved context.
  Per SI-017's Phase 2 F-3 canonical liveness check, the application
  middleware verifies the session is live BEFORE invoking the procedure.
  Same trust boundary as every other application-to-DB call per I-023
  layer 2: "every data-access function in the codebase resolves the
  requesting user's authorized tenant context from the session before
  constructing any query."

  Procedure does NOT re-verify identity at the DB layer (no procedure-
  side trust anchor; SI-010 rejected). RLS policies enforce tenant
  isolation via current_setting('app.tenant_id') GUC per the canonical
  CDM v1.2 RLS contract.
```

The audit-emission change:

```
BEFORE (referenced SI-010, now rejected):
  Tier 1 audit INSERT inside the SECURITY DEFINER procedure after the
  data UPDATE succeeds. Procedure derives audit envelope identity from
  SI-010 helpers.

AFTER (canonical application-layer pattern per engineering review):
  Procedure performs only the data UPDATE + returns success/failure
  tuple. Application code (the caller) issues the audit INSERT
  immediately after the procedure returns, in the same application-
  managed transaction. Audit envelope identity comes from the
  JWT-verified application context.

  The three-tier audit DURABILITY framework is preserved (renamed
  D1/D2/D3 in this entry to disambiguate from SI-018's partition tiers):
  - D1: application-issued audit INSERT (was inside-procedure pre-P-023a)
  - D2: audit_swap_rejection_log autonomous-transaction backstop
        (unchanged; survives caller rollback)
  - D3: caller-required-commit-boundary contract (unchanged)

  Independently, per SI-018's two-tier audit-chain PARTITION rule, this
  procedure's audit_events record lives in P2 (tenant-governance):
    target_patient_id IS NULL
    tenant_id         = operating tenant
    chain_partition_key = SHA-256("GENESIS:TENANT:<tenant_id>")
    category          = Cat B governance-class
  Durability tiers and partition tiers are orthogonal axes.
```

**Engineering review grounding** (per the engineering-review prompt at `Telecheck_v1_10_PRD_Update/Engineering-Review-Request-I-003-Atomic-Audit-Inside-vs-Application-Layer-Audit-2026-05-19.md`): unanimous NO answer confirmed that application-layer audit emission within the same application-managed transaction satisfies I-003 audit-immutability + HIPAA technical-safeguards + the BAA chain contractual posture. DB-side atomic audit inside the SECURITY DEFINER procedure is NOT required. P-018a applies that engineering-review answer to SI-008's procedure design.

**Cross-references:**

- P-023a: SI-010 trust-anchor layer rejection (the trigger for P-018a).
- SI-017 ratification (prerequisite): establishes canonical Phase 2 F-3 liveness pattern within middleware-GUC model.
- SI-018 ratification (prerequisite): establishes canonical audit-chain partition rule (this procedure's audit event is tier 2).
- Engineering Review Request: `Telecheck_v1_10_PRD_Update/Engineering-Review-Request-I-003-Atomic-Audit-Inside-vs-Application-Layer-Audit-2026-05-19.md`.

**Cluster B HARD-sequencing implication:** P-018a authoring does NOT affect Cluster B HARD-sequencing (which closed at SC3 P-021). SI-008's `ai_workflow_executions` entity is canonical and SI-005's FK 6 references it; that cross-SI dependency is unchanged. P-018a, P-019a, P-021a can run in parallel because each amends a procedure-internal sub-decision; cross-SI references at the row-shape level are unaffected.

**Registry absorption:** No Registry version bump (reconciliation entry). P-018a appends to the Promotion Ledger; no canonical contract surfaces (CDM, AUDIT_EVENTS, DOMAIN_EVENTS, State Machines, RBAC, System Architecture, Identity Spec, INVARIANTS) are amended by P-018a directly. SI-017 + SI-018 ratifications carry their own contract amendments; P-018a uses them by reference.

---

## 3. Sub-decisions for ratifier ceremony

Two sub-decisions, both APPROVED RECOMMENDATION:

### Sub-decision 1: Amend P-018 Sub-decision 8 (actor-identity source)

Per §2's BEFORE / AFTER comparison: procedure receives actor identity as parameters from JWT-verified application context (canonical model); does NOT use SI-010 helpers (rejected); does NOT re-verify identity at DB layer.

**Recommendation: APPROVE.**

### Sub-decision 2: Amend P-018 Sub-decision 10 (audit-emission location)

Per §2's BEFORE / AFTER comparison: Tier 1 audit INSERT moves from inside-procedure to application-layer immediately after procedure-success; Tiers 2 + 3 preserved unchanged; audit event partition tier is tier 2 per SI-018.

**Recommendation: APPROVE.**

---

## 4. Open questions for ratifier

### Open Question 1: Should the parameter list be more constrained?

The supersession lists `p_account_id`, `p_tenant_id`, `p_role`, `p_admin_home_tenant_id`, `p_session_id` as the procedure parameters. Is any of these optional or unnecessary at this procedure's level? E.g., `p_admin_home_tenant_id` is only relevant for platform_admin actors; should it be NULL for non-admin?

**Recommendation:** parameter list as proposed (consistent with canonical model where these fields are always available from JWT context). NULL for non-admin actors on `p_admin_home_tenant_id` is the canonical pattern.

### Open Question 2: Codex pre-ratification target

**Recommendation:** 2 rounds + 1 verification = 3 total. STOP-and-escalate per the discipline floor.

---

## 5. Cross-artifact impact

**ZERO canonical contract amendments by P-018a directly.** P-018a uses SI-017 + SI-018 by reference; those carry the contract amendments.

- AUDIT_EVENTS: NO direct amendment by P-018a (SI-018 establishes the partition rule).
- CDM: NO changes.
- State Machines: NO changes.
- Identity Spec: NO changes (SI-017 establishes the liveness check).
- RBAC: NO changes.
- System Architecture: NO changes.
- INVARIANTS: NO changes.
- Promotion Ledger: 1 new entry (P-018a appended after P-018 per append-only discipline).
- Registry: NO version bump (reconciliation entry).

---

## 6. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; **BLOCKED-PENDING-SI-017-RATIFICATION + SI-018-RATIFICATION.**

The Codex pre-ratification cycle can begin on this PR (the v0.1 DRAFT artifact). The ratifier ceremony, however, CANNOT run until SI-017 and SI-018 ratify because P-018a references their canonical surfaces; ratifying P-018a before its prerequisites would be the same out-of-scope-architecture defect that landed SI-010 in trouble.

---

## 7. Sequence for ratification

1. SI-018 ratifier ceremony (PR #14 + Decision Brief artifact authored; ratifier-quorum required; ~25 min review). → SI-018 canonical-content-port lands on `main`. → AUDIT_EVENTS v5.4 + Registry v2.13.
2. SI-017 ratifier ceremony (PR #13 paused at R1; needs amendment to cite SI-018's tier-2 rule + Codex round 2; then Decision Brief; ~30 min review). → SI-017 canonical-content-port lands. → AUDIT_EVENTS v5.4 → v5.5 + Identity Spec v1.0 → v1.1 + Registry v2.13 → v2.14.
3. P-018a + P-019a + P-021a ratifier ceremonies in parallel (each cites SI-017 + SI-018; each ~15-20 min review). → Each appends a supersession entry to the canonical Promotion Ledger.
4. Each procedure's IMPL-readiness gate (the merge-blocking implementation PR) can then proceed.

---

**End of P-018a v0.1 DRAFT.**
