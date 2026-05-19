# AI Service Mode 2 Handler Specification

**Version:** 0.1 DRAFT
**Status:** Pre-Codex-pre-ratification; Sprint 12 of autonomous 24h-loop work plan
**Authoring location:** `Telecheck_v1_10_PRD_Update/` (workstream folder; spec-corpus Track 2 deliverable)
**Owner:** AI Service Lead + Clinical Lead + Governance Lead (tri-owner per Mode 2's protocol-execution + clinical-safety + governance-gating scope)
**Companion documents:** Sprint 9 AI Service Mode 1 Handler Spec; SI-016 ai_workflow_handler_registry (Sprint 3 APPROVE); SI-017 Identity Spec v1.1 amendment (Sprint 8); ADR-002 two-mode AI architecture; ADR-029 AI Workload Taxonomy; Contracts Pack v5.2 AI_LAYERING + AUTONOMY_LEVELS + WORKLOAD_TAXONOMY + AUDIT_EVENTS v5.5; Cold-DR Runbook (Sprint 7); P-018a + P-019a + P-021a procedure-side STEP 0 amendments.
**Authority:** canonical Mode 2 handler contract for AI Service modular monolith boundary; covers protocol-execution workload class L2-L4 autonomy levels per ADR-029.

---

## 1. Purpose + scope

This specification defines the **canonical HTTP handler contract for AI Service Mode 2** — the protocol-execution workload class per ADR-002 + ADR-029. Mode 2 handlers execute clinical protocols (refill_request, GLP-1_titration, lab_order_request, etc.) under strict governance: every protocol invocation is gated, every state transition is recorded, every clinical side effect is audit-bound + reversible-where-applicable. Mode 2 spans autonomy levels L2 (suggest-and-confirm), L3 (execute-with-review), and L4 (autonomous-with-audit) per Contracts Pack v5.2 AUTONOMY_LEVELS.

**In scope:**

1. The Mode 2 HTTP handler surface (`POST /ai/mode-2/workflow/<workflow_id>`) with per-workflow request/response shapes, error model, idempotency semantics.
2. Handler-registry resolution contract per SI-016 (which registered handler is invoked for a workflow_id at a given time).
3. Autonomy-level gating per ADR-029 + Contracts Pack v5.2 AUTONOMY_LEVELS (L2 / L3 / L4 invocation rules).
4. Per-workflow audit emission contract (Cat A protocol-execution events; partition routing per SI-018).
5. Reversibility contract — which protocol effects are reversible (refill cancellation, lab cancellation) vs irreversible (e.g., a dispensed medication; covered by separate pharmacy slice).
6. Cross-mode boundary enforcement (Mode 2 MUST NOT initiate a new Mode 1 conversation; Mode 2 may emit advisory back-to-Mode-1 hints).
7. Clinician-in-the-loop gating for L2 + L3 invocations.
8. Latency budget (p99 ≤30s for L4 autonomous; longer windows acceptable for L2/L3 with human review).
9. Test coverage commitments with concrete CI gates per SI-017 Sprint 8 precedent.

**Out of scope (deferred):**

- Mode 1 conversational handler (covered by Sprint 9; sister deliverable).
- Per-workflow protocol body definitions (each workflow has its own slice PRD; e.g., GLP-1 program PRD defines the protocol shape; this spec governs the handler envelope, not the protocol body).
- Pharmacy dispense / refill side-effects (covered by Pharmacy + Refill Slice PRD v2.1).
- L1 autonomy (Mode 1 conversational; covered by Sprint 9).
- L5 autonomy (full autonomous without audit) — not authorized in current Telecheck architecture per ADR-002.

---

## 2. Canonical handler surface

### 2.1 Endpoint pattern

```
POST /ai/mode-2/workflow/<workflow_id>
```

Where `<workflow_id>` is the canonical workflow identifier registered in `ai_workflow_handler_registry` per SI-016 (e.g., `refill_request_v1`, `glp1_titration_v1`, `lab_order_request_v1`).

### 2.2 Request shape (generic envelope)

```typescript
type Mode2WorkflowRequest = {
  invocation_id: string;            // UUID; client-generated; idempotency key for the invocation
  patient_id: string;               // Patient on whose behalf the protocol executes
  initiated_by: {                   // Who triggered this invocation
    kind: 'patient' | 'clinician' | 'mode1_handoff' | 'scheduled_job';
    user_id: string;                // The originating user (patient_id for kind='patient'; clinician_id for kind='clinician'; system principal for scheduled_job)
    mode1_conversation_id?: string; // Set iff kind='mode1_handoff'
  };
  workflow_input: object;           // Workflow-specific input (validated against the registered handler's input schema)
  autonomy_level_requested: 'L2' | 'L3' | 'L4';  // Caller declares the autonomy level; gated per §4
  client_capabilities?: {
    markdown_render: boolean;
    rich_links: boolean;
  };
}
```

### 2.3 Response shape (generic envelope)

```typescript
type Mode2WorkflowResponse = {
  invocation_id: string;
  workflow_id: string;
  status: 'completed' | 'pending_clinician_review' | 'pending_patient_confirm' | 'failed';
  workflow_output?: object;         // Workflow-specific output (populated for status='completed')
  pending_review_token?: string;    // Set if status='pending_clinician_review'; clinician later resolves via separate endpoint
  pending_confirm_token?: string;   // Set if status='pending_patient_confirm'; patient later confirms via separate endpoint
  reversibility: 'reversible' | 'partially_reversible' | 'irreversible' | 'not_applicable';
  audit_chain_trail: {              // Forensic anchors per invocation
    invocation_admitted_event_id: string;   // Cat A invocation-admitted audit row
    governance_gate_decision_event_id: string;   // Cat A autonomy-level gate decision row
    workflow_execution_event_id?: string;   // Cat A workflow execution row (post-execution)
    side_effect_event_ids: string[];        // 0+ Cat A side-effect rows
  };
  latency_ms: number;
  handler_resolution: {             // Per SI-016 handler-registry resolution result
    handler_version: string;        // e.g., '1.0.3'
    handler_tenant_id: string;      // Per SI-016 OQ6: must satisfy handler_tenant_id eligibility check
    resolved_at: string;            // ISO-8601 timestamp
  };
}
```

### 2.4 Error model

| Status | Code | Meaning |
|---|---|---|
| 400 | `mode2.invalid_request` | Required field missing / workflow_input schema validation failed |
| 401 | (tenant-blind per I-025) | Authentication failure (per SI-017 §3.7) |
| 403 | `mode2.autonomy_level_not_authorized` | Caller's role does not permit the requested autonomy_level (e.g., patient requesting L4) |
| 404 | (tenant-blind per I-025) | Patient not found OR workflow_id not registered in handler registry |
| 409 | `mode2.invocation_id_conflict` | invocation_id replayed with different request body (idempotency violation) |
| 409 | `mode2.workflow_state_conflict` | Workflow's pre-state guards rejected the invocation (e.g., refill on an already-fulfilled prescription) |
| 422 | `mode2.governance_gate_rejected` | Autonomy-level gate rejected the invocation (e.g., L4 attempted on a workflow restricted to L2+L3) |
| 423 | `mode2.workflow_locked_pending_review` | Workflow is already pending_clinician_review / pending_patient_confirm; cannot re-invoke until resolved |
| 429 | `mode2.rate_limit_exceeded` | Per-patient OR per-tenant Mode 2 invocation rate exceeded |
| 503 | `mode2.handler_unavailable` | Registered handler for this workflow_id is currently disabled (per SI-016 handler-state lifecycle); retry-able |
| 503 | `mode2.audit_unavailable` | Audit chain unavailable; invocation rejected (per FLOOR-020 audit-emission-failure-handling Cat A rule) |
| 500 | `mode2.internal_error` | Unexpected server-side failure (tenant-blind details) |

### 2.5 Idempotency semantics

Per Contracts Pack v5.1 IDEMPOTENCY: the `invocation_id` is the idempotency key per invocation. The idempotency cache key is `(tenant_id, workflow_id, invocation_id)`.

- Same `invocation_id` + same request body: return cached response (200 or the cached pending-state).
- Same `invocation_id` + different request body: return 409 `mode2.invocation_id_conflict`.
- New `invocation_id`: process normally.

**Important:** for pending-review workflows, the invocation_id remains stable through clinician resolution; the resolution endpoint references the same invocation_id. The Cat A audit chain for an invocation is fully reconstructable from `invocation_id`.

---

## 3. Handler-registry resolution (SI-016 integration)

### 3.1 Resolution contract

For each request, the Mode 2 handler envelope:

1. SELECTs the registered handler for `(tenant_id, workflow_id)` from `ai_workflow_handler_registry` where `state = 'published'` (per SI-016 published-state execution check).
2. Verifies the handler's `handler_tenant_id` is eligible to execute for the request's `tenant_id` (per SI-016 OQ6 / P-018b cross-SI scope; resolution path explicitly recorded in the audit chain).
3. Loads the handler's input schema + validates `workflow_input` against it (400 on validation failure).
4. Records the resolution decision in the Cat A audit chain (`ai.mode2.handler_resolved` event with full resolution path).

### 3.2 Registry race-handling

The handler registry's state transitions follow the Sprint 10 batched-ratifier proposal recommendation (Option C for SI-016 per the per-SI domain analysis: event-sourced authoritative source + materialized current-state projection). The Mode 2 envelope reads from the materialized projection at resolution time; for an in-flight invocation, the resolution is locked to the resolved version even if the registry transitions mid-invocation (i.e., handler retraction does not abort in-flight invocations; abortion is a separate operator-gated escalation path).

### 3.3 Unregistered workflow → 404

If `workflow_id` has no `published`-state handler in the registry: 404 (tenant-blind per I-025). The audit chain records a Cat B `ai.mode2.workflow_not_registered` event (P2 keyed by tenant_id; this is a tenant-governance observability event).

---

## 4. Autonomy-level gating

Per ADR-029 + Contracts Pack v5.2 AUTONOMY_LEVELS, every Mode 2 invocation passes through an autonomy-level gate BEFORE workflow execution. The gate enforces:

### 4.1 L2 (suggest-and-confirm) — patient-initiated, patient-confirms

- Workflow generates a proposed action; returns `status = 'pending_patient_confirm'` with `pending_confirm_token`.
- Patient subsequently confirms via `POST /ai/mode-2/workflow/<workflow_id>/confirm` with the token.
- Workflow execution proceeds only after confirmation.
- **Authorized callers:** patient (kind='patient') OR clinician acting on behalf (kind='clinician' with explicit patient consent).
- **Audit events:** `ai.mode2.l2_proposed` Cat A → `ai.mode2.l2_confirmed` Cat A → `ai.mode2.workflow_executed` Cat A.

### 4.2 L3 (execute-with-review) — workflow executes then clinician reviews

- Workflow executes immediately; returns `status = 'pending_clinician_review'` with `pending_review_token`.
- Clinician subsequently approves OR rejects via `POST /ai/mode-2/workflow/<workflow_id>/review` with the token.
- Side effects: depends on workflow; some L3 workflows produce reversible side effects (e.g., draft prescription marked `awaiting_clinician_sign`); others stage the effect without enacting it (e.g., proposed lab order held pending clinician sign-off).
- **Authorized callers:** patient (kind='patient'), clinician (kind='clinician'), mode1_handoff (kind='mode1_handoff' with referring Mode 1 conversation_id).
- **Audit events:** `ai.mode2.l3_executed` Cat A → `ai.mode2.l3_review_pending` Cat A → `ai.mode2.l3_approved` OR `ai.mode2.l3_rejected` Cat A.

### 4.3 L4 (autonomous-with-audit) — workflow executes without human gate

- Workflow executes immediately; effects are committed; returns `status = 'completed'`.
- No human-in-the-loop; the audit chain is the canonical record of execution.
- **Restricted authorization:** only `kind='scheduled_job'` OR `kind='clinician'` with specific role grant `ai_mode2_l4_authorized`. Patient-initiated L4 invocations are rejected with 403 `mode2.autonomy_level_not_authorized`.
- **Restricted workflows:** only workflows tagged `autonomy_max_level = 'L4'` in the handler registry accept L4 invocations. Workflows tagged L2 or L3 reject L4 attempts with 422 `mode2.governance_gate_rejected`.
- **Audit events:** `ai.mode2.l4_executed` Cat A.

### 4.4 Governance-gate decision audit

Every gate decision (admit OR reject) emits a Cat A `ai.mode2.governance_gate_decision` event (P1 keyed by patient_id) recording:
- Requested autonomy level
- Caller role + initiated_by kind
- Workflow's autonomy_max_level from registry
- Decision (`admit` or `reject`)
- Decision reason
- Decision timestamp

The governance-gate-decision audit row is the canonical forensic anchor for "who approved this Mode 2 invocation under what authority."

---

## 5. Side-effect contract + reversibility

### 5.1 Side-effect taxonomy

Mode 2 workflows produce side effects of three classes:

| Class | Meaning | Reversibility | Examples |
|---|---|---|---|
| Reversible | Effect can be cleanly undone | Yes (via canonical undo procedure) | Refill request creation, draft prescription, lab order request |
| Partially reversible | Effect can be undone but with notable state implication | Yes-with-caveat | Notification sent (recipient already saw it; can be retracted but not unseen) |
| Irreversible | Effect cannot be undone | No | Medication dispensed (pharmacy); SMS sent; in-clinic procedure scheduled |

Each registered handler declares its side-effect class in the registry; the response's `reversibility` field reflects this.

### 5.2 Irreversible side-effect gate

Workflows producing irreversible side effects MUST:

1. Be tagged `irreversible = true` in the handler registry.
2. Run through L2 OR L3 gating (NEVER L4 unless explicitly authorized at the tenant + workflow + role level).
3. Emit Cat A `ai.mode2.irreversible_effect_committed` BEFORE the irreversible action.
4. The pre-commit audit row is the durability barrier — if the audit emission fails, the irreversible action MUST NOT execute (per FLOOR-020 Cat A handling).

### 5.3 Reversible side-effect undo

For reversible effects, the canonical undo endpoint is `POST /ai/mode-2/workflow/<workflow_id>/undo` with the original `invocation_id`. The undo:

1. Verifies the invocation was successful (status='completed').
2. Verifies the effect has not been further-acted-upon (e.g., a draft prescription has not been signed).
3. Executes the canonical undo procedure for the workflow.
4. Emits Cat A `ai.mode2.workflow_undone` audit row referencing the original invocation_id.

Workflows that cannot be undone in their current state (e.g., a prescription that has been signed by a clinician) reject undo with 409 `mode2.workflow_state_conflict`.

---

## 6. Cross-mode boundary enforcement

### 6.1 Mode 2 → Mode 1 boundary

Mode 2 MUST NOT:
1. Initiate a new Mode 1 conversation.
2. Mutate Mode 1's conversation state (`ai_mode1_conversation_*` tables).
3. Invoke Mode 1 handlers directly.

Mode 2 MAY:
1. Emit a Cat B `ai.mode2.mode1_advisory_hint` event (P2 keyed by tenant_id) suggesting Mode 1 follow-up. The client routes the user back to Mode 1 if appropriate; Mode 2 does not initiate the handoff itself.

### 6.2 Mode 1 → Mode 2 handoff (recap)

Per Sprint 9 §5.2: Mode 1 emits `ai.mode1.mode2_handoff_proposed` Cat B; client routes user to Mode 2 surface. Mode 2 receives the request with `initiated_by.kind='mode1_handoff'` + `initiated_by.mode1_conversation_id` set. This is the canonical handoff direction.

---

## 7. Clinician-in-the-loop gating

### 7.1 L2/L3 review queue

Workflows that produce L2 (pending_patient_confirm) OR L3 (pending_clinician_review) responses enqueue review tasks into the canonical clinician review queue. The clinician's review-queue UI is downstream of this spec; Mode 2's responsibility ends at enqueueing the review task with `pending_review_token` / `pending_confirm_token`.

### 7.2 Review-token validity

Tokens are valid for 7 days; expired tokens reject resolution with 410 `mode2.review_token_expired`. The workflow's state at expiry is "abandoned" (Cat B `ai.mode2.workflow_abandoned` event).

### 7.3 Review-token tenant-binding

Tokens are tenant-scoped; a token issued under tenant_A cannot resolve under tenant_B (RLS enforced at the resolution endpoint; cross-tenant resolution attempts fail with 404 per I-025).

---

## 8. Latency budget

| Autonomy Level | p50 | p99 | Hard ceiling |
|---|---|---|---|
| L2 (admit → pending_patient_confirm) | 200ms | 1.5s | 5s |
| L3 (admit → execute → pending_clinician_review) | 500ms | 5s | 30s |
| L4 (admit → execute → completed) | 800ms | 10s | 60s |

L4 ceiling is higher to accommodate complex multi-step protocol executions (e.g., GLP-1 titration involves multiple lookups + decision-tree evaluation).

Per-stage breakdown for L4:
- Handler resolution (registry lookup): 5-20ms.
- Governance gate evaluation: 10-50ms.
- Workflow input validation: 5-50ms (depends on schema complexity).
- Workflow execution (varies by workflow): 500-9000ms typical; 60s hard ceiling.
- Audit emission (multiple Cat A events): 5-50ms per event.
- Response construction: 5-20ms.

---

## 9. Rate limiting + per-tenant quota

| Limit | Value | Lockout |
|---|---|---|
| Per-patient Mode 2 invocations | 20/hr (default; CCR-tunable per tenant.ai_mode2_per_patient_hourly_quota) | 429 |
| Per-tenant Mode 2 daily invocations | 100k/day (default; CCR-tunable per tenant.ai_mode2_daily_quota) | 429 |
| Per-workflow per-tenant invocations | Workflow-specific (registered with handler; defaults to no per-workflow limit) | 429 |
| Concurrent invocations per patient | 3 (concurrent Mode 2 invocations beyond this limit queue up to 10; queue depth >10 → 429) | 429 |

Rate-limit state is held per-region; cross-region sync via the multi-region ACK channel (per Cold-DR partition-aware topology).

---

## 10. Open questions for ratifier

1. **OQ1 — Handler registry state-machine pattern (cross-referenced from Sprint 10 OQ).** This spec presumes Option C (event-sourced + materialized projection) per the Sprint 10 working recommendation for SI-016. If ratifier selects a different option (A or B) for SI-016, this spec's §3.2 race-handling needs to be re-aligned. Cross-SI dependency on Sprint 10 ratifier outcome.
2. **OQ2 — Per-workflow undo procedure registration.** Reversible workflows declare their undo procedure in the handler registry (recommended). Ratifier confirms the registration mechanism. Recommendation: undo procedure is a separate handler in the registry tagged `is_undo_for = <original_workflow_id>`; the canonical undo endpoint dispatches to it.
3. **OQ3 — L4 autonomous workflow allow-list.** Recommendation: only `scheduled_job` callers may invoke L4 by default. Specific clinician roles can be granted L4 via the `ai_mode2_l4_authorized` RBAC scope. Ratifier confirms the RBAC scope name + the default-deny posture.
4. **OQ4 — Review-token transit security.** Tokens are tenant-scoped UUIDs; ratifier confirms whether they should be signed (HMAC) or treated as opaque (the tenant-scoped DB lookup is the authoritative authority). Recommendation: opaque + DB-authoritative; HMAC adds no security given RLS already enforces tenant binding.
5. **OQ5 — Codex pre-ratification target.** Recommendation: 3-4 rounds (Engineering Spec with broad surface).
6. **OQ6 — Mode 1 advisory-hint emission rate-limiting.** Cat B advisory-hint events are emitted from Mode 2 back to Mode 1's surface. High-volume L4 scheduled jobs could flood with advisory hints. Recommendation: per-invocation cap (max 1 advisory-hint per Mode 2 invocation); aggregated rate-limit at the audit-pipeline layer.
7. **OQ7 — Workflow-specific failure-class taxonomy.** Each workflow has its own failure modes (e.g., refill workflow fails if pharmacy unavailable; GLP-1 titration fails if lab data missing). The generic `mode2.internal_error` does not capture this. Recommendation: each handler declares its workflow-specific error codes in the registry; the response carries the workflow-specific code in addition to the generic envelope class.

---

## 11. Test coverage commitments (acceptance-criterion-grade)

| Test ID | File location | CI job | Verifies | Section |
|---|---|---|---|---|
| Test M2.1 | `apps/api-server/__integration__/ai/mode2_l4_happy_path.test.ts` | `integration-ai-mode2` | L4 invocation by scheduled_job → governance gate admits → workflow executes → Cat A audit chain complete | §2, §4.3 |
| Test M2.2 | `apps/api-server/__integration__/ai/mode2_l3_pending_review.test.ts` | `integration-ai-mode2` | L3 invocation → execution happens → pending_review_token issued → Cat A `l3_review_pending` event | §4.2 |
| Test M2.3 | `apps/api-server/__integration__/ai/mode2_l3_review_approved.test.ts` | `integration-ai-mode2` | Clinician resolves L3 review with approval → workflow finalized → Cat A `l3_approved` event | §4.2 |
| Test M2.4 | `apps/api-server/__integration__/ai/mode2_l3_review_rejected.test.ts` | `integration-ai-mode2` | Clinician rejects L3 review → workflow effects reverted (where reversible) → Cat A `l3_rejected` event | §4.2, §5.3 |
| Test M2.5 | `apps/api-server/__integration__/ai/mode2_l2_patient_confirm.test.ts` | `integration-ai-mode2` | L2 invocation → pending_confirm_token → patient confirms → workflow executes → Cat A chain complete | §4.1 |
| Test M2.6 | `apps/api-server/__integration__/ai/mode2_patient_l4_denied.test.ts` | `integration-ai-mode2` | Patient attempting L4 → 403 `autonomy_level_not_authorized` + Cat A governance-gate-decision rejection event | §4.3, §4.4 |
| Test M2.7 | `apps/api-server/__integration__/ai/mode2_unregistered_workflow.test.ts` | `integration-ai-mode2` | workflow_id not in registry → 404 tenant-blind + Cat B `workflow_not_registered` P2 event | §3.3 |
| Test M2.8 | `apps/api-server/__integration__/ai/mode2_handler_resolution_audit.test.ts` | `integration-ai-mode2` | Cat A `handler_resolved` event records full resolution path including handler_tenant_id eligibility check (SI-016 OQ6 verification) | §3.1 |
| Test M2.9 | `apps/api-server/__integration__/ai/mode2_idempotency.test.ts` | `integration-ai-mode2` | Same invocation_id + same body → cached response; different body → 409 | §2.5 |
| Test M2.10 | `apps/api-server/__integration__/ai/mode2_irreversible_audit_gate.test.ts` | `integration-ai-mode2` | Irreversible workflow with Cat A audit emission failure → workflow MUST NOT execute the irreversible action; turn fails 503 | §5.2 |
| Test M2.11 | `apps/api-server/__integration__/ai/mode2_undo_happy_path.test.ts` | `integration-ai-mode2` | Reversible workflow undo → original effects undone + Cat A `workflow_undone` event | §5.3 |
| Test M2.12 | `apps/api-server/__integration__/ai/mode2_undo_state_conflict.test.ts` | `integration-ai-mode2` | Undo on signed-prescription → 409 `workflow_state_conflict` (clinician has already acted) | §5.3 |
| Test M2.13 | `apps/api-server/__integration__/ai/mode2_mode1_initiation_denied.test.ts` | `integration-ai-mode2` | Mode 2 handler attempting to initiate Mode 1 conversation (DB INSERT on `ai_mode1_conversation`) → static-analyzer rule TLC-AI-005 fails at PR open | §6.1 |
| Test M2.14 | `apps/api-server/__integration__/ai/mode2_review_token_tenant_isolation.test.ts` | `integration-ai-mode2` | Cross-tenant review-token resolution → 404 tenant-blind per I-025 | §7.3 |
| Test M2.15 | `apps/api-server/__integration__/ai/mode2_review_token_expiry.test.ts` | `integration-ai-mode2` | Expired token → 410 `review_token_expired` + Cat B `workflow_abandoned` event | §7.2 |
| Test M2.16 | `apps/api-server/__integration__/ai/mode2_rate_limit.test.ts` | `integration-ai-mode2` | Per-patient 20/hr → 429; per-tenant daily quota → 429 | §9 |
| Test M2.17 | `apps/api-server/__integration__/ai/mode2_concurrent_invocations.test.ts` | `integration-ai-mode2` | 4th concurrent invocation per patient → queued; 11th → 429 | §9 |

**Static-analyzer rule IDs registered:**
- `TLC-AI-005` — Mode 2 handler INSERTing/UPDATEing on `ai_mode1_*` tables (Mode 2 → Mode 1 boundary).
- `TLC-AI-006` — Workflow tagged irreversible MUST go through L2 or L3 gate (handler-registry declaration consistency).
- `TLC-AI-007` — Mode 2 handler executing irreversible action without preceding `irreversible_effect_committed` Cat A audit row (verified at handler-implementation site).

---

## 12. Cross-SI alignment summary

| Cross-SI surface | Mode 2 Handler Spec surface | Relationship |
|---|---|---|
| SI-016 ai_workflow_handler_registry (Sprint 3) | §3 handler-registry resolution | Mode 2 envelope reads from registry per Sprint 10 Option C recommendation; per-invocation resolution path audited |
| SI-017 Identity Spec v1.1 (Sprint 8) | §2.4 401 tenant-blind; §3 RLS; §7.3 review-token tenant-binding | Mode 2 handler downstream of canonical middleware-GUC; RLS enforces tenant isolation throughout |
| SI-018 partition rule | §3.3 + §4.4 + §6.1 + §7.2 audit events | Cat A patient-bound events P1 keyed by patient_id; Cat B tenant-governance events P2 keyed by tenant_id |
| Sprint 9 AI Service Mode 1 Handler | §6 cross-mode boundary | Mode 1 → Mode 2 handoff via API surface; Mode 2 → Mode 1 only via advisory-hint events; no internal-call escape hatch in either direction |
| ADR-029 AI Workload Taxonomy | §1 + §4 autonomy-level gating | Mode 2 spans L2-L4 per ADR-029; L1 covered by Mode 1; L5 not authorized |
| Cold-DR Runbook (Sprint 7) | §9 rate-limit cross-region sync | Multi-region ACK channel topology applies for rate-limit counter sync |
| Contracts Pack v5.2 AUTONOMY_LEVELS | §4 governance-gate | Canonical autonomy-level definitions + gating contract |
| P-018a/P-019a/P-021a STEP 0 amendments | §3.1 + §4.4 audit-bound procedures | Mode 2 workflow handlers invoke SECURITY DEFINER procedures with I-032 STEP 0 guard per Sprint 8 contract |

---

## 13. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; awaiting Codex R1.

---

— Claude (Opus 4.7, 1M context), AI Service Mode 2 Handler Specification v0.1 DRAFT authored 2026-05-19 under "continue 24 hrs / no more resting" autonomous-work authorization. Sprint 12 of the 24h-loop work plan. Track 2 spec-corpus deliverable. Defines the canonical HTTP handler contract for protocol-execution workload class L2-L4 per ADR-002 + ADR-029. Companion to Sprint 9 Mode 1 Handler Spec; references Sprint 3 SI-016 + Sprint 8 SI-017 + Sprint 7 Cold-DR + ADR-029 + Contracts Pack v5.2 AUTONOMY_LEVELS.
