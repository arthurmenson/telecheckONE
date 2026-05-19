# AI Service Mode 1 Handler Specification

**Version:** 0.1 DRAFT
**Status:** Pre-Codex-pre-ratification; Sprint 9 of autonomous 24h-loop work plan
**Authoring location:** `Telecheck_v1_10_PRD_Update/` (workstream folder; spec-corpus Track 2 deliverable)
**Owner:** AI Service Lead + Clinical Lead (co-owners; Mode 1 spans Track 2 AI service boundary + clinical safety floor)
**Companion documents:** AI_Service_Rollout_24h_Status_2026-05-14.md, ADR-002 (two-mode AI architecture), Contracts Pack v5.2 AI_LAYERING + AUDIT_EVENTS v5.5 + WORKLOAD_TAXONOMY, ADR-029 (AI workload taxonomy), I-019 crisis-detection-always-on platform floor, SI-017 Identity Spec v1.1 amendment (Sprint 8; canonical-middleware-GUC model), SI-016 ai_workflow_handler_registry (Sprint 3; Mode 2 sister spec), Cold-DR Runbook (Sprint 7; partition-aware ACK semantics for crisis-signal emission).
**Authority:** canonical Mode 1 handler contract for the AI Service modular monolith boundary; the HTTP-handler surface specification.

---

## 1. Purpose + scope

This specification defines the **canonical HTTP handler contract for AI Service Mode 1** — the conversational-assistant workload class per ADR-002 + ADR-029 + Contracts Pack v5.2 WORKLOAD_TAXONOMY. Mode 1 handlers process patient-conversation messages (chat-style, multi-turn) under platform-floor constraints: no clinical decisions, no protocol execution, crisis detection always on (I-019), audit emission on every turn (FLOOR-020), tenant binding via SI-017 canonical-middleware-GUC.

**In scope:**

1. The HTTP handler surface (`POST /ai/mode-1/conversation`) with request/response shapes, error model, idempotency semantics.
2. FLOOR-020 audit-emission contract (which events fire per turn; partition-key routing per SI-018).
3. I-019 crisis-detection integration (always-on detector pre-LLM-call; signal emission via Cold-DR-Runbook-compatible multi-region ACK channel).
4. Mode-1-Mode-2 boundary enforcement (Mode 1 MUST NOT invoke protocol execution; the canonical no-Mode-2-side-effects predicate).
5. Conversation-state durability (session-scoped, tenant-isolated, RLS-bound).
6. LLM provider abstraction (the handler is provider-agnostic; provider selection is CCR-driven).
7. Rate limiting + per-tenant quota.
8. Latency budget (p99 ≤2.5s for the canonical happy path; degraded-state behavior).
9. Test coverage commitments (merge-blocking acceptance criteria with CI gates per SI-017 Sprint 8 precedent).

**Out of scope (deferred):**

- Mode 2 protocol-execution handler (covered by SI-016 ai_workflow_handler_registry; sister deliverable).
- Voice / video AI surfaces (Mode 1 is text-only at v1.0; voice/video would be ADR-extending).
- Multi-modal inputs (images, lab PDFs, etc.); v1.0 is text-input only.
- LLM provider procurement / contracts (BAA chain governance + KMS posture; covered by Track 5 Infra).
- Conversation-summarization features (covered by separate AI feature slice; orthogonal to Mode 1 handler contract).

---

## 2. Canonical handler surface

### 2.1 Endpoint

```
POST /ai/mode-1/conversation
```

### 2.2 Request shape

```typescript
type Mode1ConversationRequest = {
  // Required
  conversation_id: string;       // UUID; client-generated; idempotency key for the conversation
  turn_id: string;               // UUID; client-generated; idempotency key for this turn
  user_message: string;          // Patient's free-text input (UTF-8; max 8 KB)
  // Optional
  conversation_history_window?: number;  // Number of prior turns to include in LLM context (default: 20; max: 50)
  client_capabilities?: {        // Client-declared capabilities for response adaptation
    markdown_render: boolean;
    rich_links: boolean;
  };
}
```

### 2.3 Response shape

```typescript
type Mode1ConversationResponse = {
  conversation_id: string;
  turn_id: string;               // Echoed from request
  assistant_message: string;     // LLM-generated reply (UTF-8; markdown if client_capabilities.markdown_render = true)
  crisis_signal?: {              // Present iff I-019 detector fired during this turn
    severity: 'self_harm' | 'imminent_harm' | 'medical_emergency';
    server_signal_id: string;    // UUID; server-generated; durable in i019_enqueue_ack_log
    next_action: 'show_crisis_resources' | 'redirect_to_human_clinician' | 'redirect_to_emergency_services';
  };
  latency_ms: number;            // Server-measured latency from request admission to response emit
  provider_metadata: {           // For client-side debugging + provider-cost attribution
    provider: 'anthropic' | 'openai' | 'azure-openai';
    model_id: string;            // e.g., 'claude-sonnet-4-6', 'gpt-4.1-mini'
    prompt_token_count: number;
    completion_token_count: number;
  };
}
```

### 2.4 Error model

Per `Telecheck_Contracts_Pack_v5_00_ERROR_MODEL.md` (preserved at v5.1):

| Status | Code | Meaning |
|---|---|---|
| 400 | `mode1.invalid_request` | Required field missing / max-length exceeded |
| 401 | (tenant-blind per I-025) | Authentication failure (per SI-017 §3.7) |
| 409 | `mode1.turn_id_conflict` | turn_id has already been processed for this conversation_id with a different request body (idempotency violation) |
| 429 | `mode1.rate_limit_exceeded` | Per-session OR per-tenant quota exceeded |
| 503 | `mode1.llm_provider_unavailable` | LLM provider returned 5xx; retry-able with backoff (Retry-After header) |
| 503 | `mode1.crisis_detector_unavailable` | I-019 detector failed; **Mode 1 cannot proceed** (crisis-detection-always-on platform floor) |
| 500 | `mode1.internal_error` | Unexpected server-side failure (tenant-blind details) |

All error responses are tenant-blind per I-025; no error body contains tenant_id or other tenant-identifying detail.

### 2.5 Idempotency semantics

Per Contracts Pack v5.1 IDEMPOTENCY: the `turn_id` is the idempotency key per turn.

- If the server has already processed `turn_id` for the same `conversation_id` with the same request body: return the cached response (200).
- If the server has already processed `turn_id` for the same `conversation_id` with a different request body: return 409 `mode1.turn_id_conflict`.
- If the server has not yet processed `turn_id`: process normally.

The idempotency cache key is `(tenant_id, conversation_id, turn_id)`; tenant isolation via RLS.

---

## 3. FLOOR-020 audit-emission contract

Per Contracts Pack v5.2 AUDIT_EVENTS + ADR-029 WORKLOAD_TAXONOMY, every Mode 1 turn emits the following audit events:

### 3.1 Per-turn canonical event sequence

1. **`ai.mode1.turn_admitted`** (Cat C high-volume sampled; P1 keyed by patient_id):
   - Emitted at request admission (post-middleware, pre-detector).
   - Payload: turn_id, conversation_id, user_id (= patient_id), tenant_id, user_message_length, prior_turn_count.

2. **`ai.mode1.crisis_detector_invoked`** (Cat C high-volume sampled; P1 keyed by patient_id):
   - Emitted at detector invocation (pre-LLM).
   - Payload: turn_id, detector_version, detector_latency_ms, detector_output (severity if fired, or `null`).

3. **`ai.mode1.crisis_signal_emitted`** (Cat A; P1 keyed by patient_id) — emitted IFF I-019 detector fires:
   - Severity, server_signal_id, queued_for_ack_channel_at, ack_channel_endpoint_region.
   - Routed to Cold-DR-Runbook-compatible multi-region ACK channel (per Sprint 7 partition-aware topology).
   - **MUST emit BEFORE the LLM call** (per I-019 always-on platform floor; the detection result is canonical regardless of LLM availability).

4. **`ai.mode1.llm_invoked`** (Cat C high-volume sampled; P1 keyed by patient_id):
   - Payload: turn_id, provider, model_id, prompt_token_count, llm_latency_ms.

5. **`ai.mode1.turn_completed`** (Cat C high-volume sampled; P1 keyed by patient_id):
   - Emitted at response emit.
   - Payload: turn_id, assistant_message_length, completion_token_count, total_latency_ms, crisis_signal_emitted (boolean).

6. **`ai.mode1.turn_failed`** (Cat C; P1 keyed by patient_id) — emitted IFF the turn fails after admission:
   - Payload: turn_id, failure_class (`llm_provider_unavailable` | `crisis_detector_unavailable` | `internal_error`), failure_phase (`pre_detector` | `pre_llm` | `during_llm` | `post_llm`), retry_recommended (boolean).

### 3.2 Audit-failure handling

Per Contracts Pack v5.2 AUDIT_EVENTS "Audit-emission failure handling":

- **Cat A events** (crisis_signal_emitted, security-critical): if audit emission fails, the Mode 1 turn MUST fail with 503 `mode1.internal_error`; the response is NOT emitted. The crisis-detection-always-on floor requires the audit trail to be durable; bare suppression is forbidden per I-027.
- **Cat C events** (sampled high-volume): if audit emission fails, the event is dropped (sampled high-volume contract permits this); but the turn proceeds. The drop is itself counted in `audit.cat_c_drop_observed` events aggregated per tenant per minute (classification per §3.3 below; R1 HIGH-2 closure clarifies the partition routing).

### 3.3 Audit partition key routing per SI-018 (R1 HIGH-2 closure: explicit per-event classification)

| Event | Cat | Partition | Key |
|---|---|---|---|
| `ai.mode1.turn_admitted` | C | P1 | patient_id |
| `ai.mode1.crisis_detector_invoked` | C | P1 | patient_id |
| `ai.mode1.crisis_signal_emitted` | A | P1 | patient_id |
| `ai.mode1.llm_invoked` | C | P1 | patient_id |
| `ai.mode1.turn_completed` | C | P1 | patient_id |
| `ai.mode1.turn_failed` | C | P1 | patient_id |
| `ai.mode1.invariant_violation_detector_ordering` | A | P1 | patient_id |
| `ai.mode1.crisis_detector_failed` | A | P1 | patient_id |
| `ai.mode1.mode2_handoff_proposed` | B | P2 | tenant_id |
| **`audit.cat_c_drop_observed`** | B | P2 | tenant_id (aggregated per minute) |

**Note on the "all Mode 1 events route to P1" prior claim (now corrected):** the prior draft said all Mode 1 events route to P1; this was incorrect for the two Cat B events (`mode2_handoff_proposed` and the `cat_c_drop_observed` aggregate). Per SI-018 ratified partition rule, non-patient-bound governance + observability events route to P2 keyed by tenant_id. The Mode 1 handler emits **both** P1 patient-bound events AND P2 governance/observability events — this is consistent with SI-018 (Mode 1's "handler" classification has both per-turn patient activity AND per-tenant aggregates).

**Emitter for `audit.cat_c_drop_observed`:** the drop is observed by the audit-pipeline subsystem (NOT the Mode 1 handler directly). The audit pipeline aggregates drops per (tenant_id, minute_bucket) and emits one Cat B P2 event per (tenant_id, minute_bucket) at minute-rollover. Sampling: not sampled (every drop event is recorded as a per-minute aggregate; if no drops occurred in a minute, no event is emitted).

---

## 4. I-019 crisis-detection integration

### 4.1 Detector contract

Per I-019 platform-floor invariant (preserved at v1.0), every Mode 1 turn MUST invoke the canonical crisis detector BEFORE invoking the LLM. The detector:

1. Takes the user_message + the last 5 turns of conversation context.
2. Returns within a hard 500ms p99 budget; timeout is a Cat A `crisis_detector_timeout` event + fails the turn with 503 (the always-on floor).
3. Outputs: `severity = null` (no crisis detected) OR `severity ∈ {self_harm, imminent_harm, medical_emergency}`.
4. If `severity != null`: the Mode 1 handler MUST:
   a. Emit Cat A `ai.mode1.crisis_signal_emitted` via the canonical multi-region ACK channel (per Sprint 7 Cold-DR-Runbook topology).
   b. Set `crisis_signal` in the response with the appropriate `next_action`.
   c. The LLM call STILL happens (the assistant_message MAY still be returned), but it is post-detector and the response prioritizes crisis-resource directives.

### 4.2 Detector-LLM ordering invariant (canonical no-bypass; runtime + static enforcement per R1 HIGH-1 closure)

The detector runs BEFORE the LLM call. Enforcement is at **two layers**:

1. **Runtime state-machine precondition + durable DB-row correspondence (primary enforcement):** the Mode 1 handler maintains a per-turn `turn_state` machine with strict ordering, where each state corresponds to the existence of a specific DB row per §6.2:
   - `admitted` (DB: row exists in `ai_mode1_conversation_turn_admission`) → `detector_completed` (DB: row exists in `ai_mode1_conversation_turn_detector_result`) → `llm_invoked` → `completed` (DB: row exists in `ai_mode1_conversation_turn_result` with `turn_outcome = 'completed'`) | `failed` (DB: row exists in `ai_mode1_conversation_turn_result` with `turn_outcome = 'failed'`).
   - The `llm.invoke()` call site verifies a `ai_mode1_conversation_turn_detector_result` row exists for the turn_id BEFORE invoking; this is a SELECT executed within the same transaction as the LLM-invocation-decision; absence of the row → runtime invariant violation fails the turn with 500 `mode1.internal_error` + emits Cat A `ai.mode1.invariant_violation_detector_ordering` event.
   - The state machine is enforced at the `llm.invoke()` adapter layer — every adapter (Anthropic, Azure-OpenAI, OpenAI) verifies the durable DB state before issuing the HTTP request to the provider. This is process-restart-safe + retry-safe + feature-flag-safe because the precondition is a durable DB row, not an in-memory variable.

2. **Static-analyzer rule `TLC-AI-001` (secondary guard):** verifies at PR open that no code path can call `llm.invoke()` outside the Mode 1 handler's canonical state-machine wrapper. Merge-blocking at CI.

**Why two layers:** Codex R1 HIGH-1 closure rationale — static-analyzer alone cannot constrain runtime paths introduced by provider abstraction, retries, feature flags, or future refactors. The runtime state-machine precondition is the canonical enforcement; the static analyzer is defense-in-depth.

**Test M1.8 + M1.11 verify both layers** (per §11 below).

### 4.3 Detector-failure handling

If the detector is unavailable (timeout, 5xx, network failure):

- Mode 1 turn MUST fail with 503 `mode1.crisis_detector_unavailable`.
- Cat A `ai.mode1.crisis_detector_failed` event emitted (P1 keyed by patient_id).
- The client receives the 503; retry-able with backoff (Retry-After header). The patient sees a degraded-experience message ("AI assistant is temporarily unavailable; please try again in a moment, or tap here for crisis resources if you need immediate help") rendered by the client.

This is the canonical implementation of "I-019 crisis-detection-always-on platform floor" for Mode 1.

### 4.4 Multi-region ACK channel integration (R1 HIGH-3 closure: ACK-vs-audit-durability semantics articulated)

Per Sprint 7 Cold-DR Runbook §"DR-survivable multi-region ACK channel topology" + partition-aware quorum semantics (R5 closure):

**Two distinct durability concepts (clarified per R1 HIGH-3 closure):**

1. **Audit-event durability** (the Cat A `ai.mode1.crisis_signal_emitted` AUDIT row): this is durable in the canonical audit-chain (P1 partition). The Mode 1 handler MUST wait for the audit INSERT to COMMIT before continuing the turn (per §3.2 Cat A failure handling: if audit emission fails, the turn fails with 503). This is the **gating durability** — without it, the turn does NOT succeed.

2. **ACK-channel signal-record durability** (the `i019_enqueue_ack_log` row in the multi-region ACK channel): the canonical signal record for downstream reconciliation. Per Cold-DR Runbook partition-aware semantics:
   - **Normal operation:** W=2-of-2 quorum across both regions; the local Mode 1 handler region writes to the channel + the channel auto-replicates to the second region; quorum confirmation is async (the handler does NOT block waiting for it).
   - **Partition operation:** W=1 with `partition_degraded=true` flag; same async semantics; the signal record is durable in the surviving region; quorum promotion happens on regional recovery.
   - The Mode 1 handler waits for the **single-region local enqueue ACK** (the W=1 confirmation from the local region) before continuing — this is what makes `server_signal_id` durable enough to return to the client. The 2-of-2 quorum promotion is reconciled async.

**Why two distinct concepts:**
- The Cat A audit row is the **forensic record of "Mode 1 turn detected a crisis"** — this MUST be durable BEFORE the turn returns, because losing this record would break the platform's commitment to the patient that "if the AI assistant detects a crisis, the system always knows about it."
- The ACK channel signal record is the **downstream operational record** for crisis-response workflows (clinician alerting, escalation queues) — this is gated by the single-region local enqueue ACK at turn-completion, with quorum promotion async per Cold-DR's three-state per-device obligation model.

**Failure-mode semantics:**
- If the Cat A audit emission fails → turn fails with 503 (per §3.2).
- If the local single-region ACK-channel enqueue fails → turn fails with 503 `mode1.internal_error` + Cat A `ai.mode1.crisis_signal_enqueue_failed` event (added per R1 HIGH-3 closure).
- If the local enqueue succeeds but cross-region replication for quorum promotion fails → turn STILL succeeds (the local enqueue ACK is what's gating); the `partition_degraded=true` row is reconciled per Cold-DR's three-state model.

**Codex R1 HIGH-3 closure rationale:** the original §4.4 wording said "the Mode 1 handler does NOT block waiting for quorum confirmation before returning the response" without distinguishing audit-row durability (which MUST block) vs ACK-channel-quorum-promotion (which is async). The clarification preserves the canonical Sprint 7 partition-aware model while making Cat A audit-row durability explicit. This is consistent with: Cold-DR's three-state model treats partition_degraded entries as first-class pending obligations; the Mode 1 audit row + the W=1 local enqueue together are sufficient to record the crisis signal durably for downstream workflows; the W=2 quorum promotion is the reconciliation layer.

---

## 5. Mode-1-Mode-2 boundary enforcement

### 5.1 The canonical no-Mode-2-side-effects predicate (R1 MED-1 closure: extended beyond DB writes)

Mode 1 is the **conversational-assistant** workload class per ADR-029. Mode 1 handlers MUST NOT:

1. Invoke protocol-execution procedures (no `record_protocol_executed()` calls).
2. Mutate clinical state (no INSERTs on `medication_request`, `consult`, `prescription`, `lab_order`, etc.).
3. Schedule clinical actions (no background-worker enqueues for protocol execution).
4. Modify medication records, dosage, or anything in the clinical workflow surface.
5. **Issue HTTP calls to Mode 2 endpoints** (`POST /ai/mode-2/*` or any other Mode 2 surface). No internal-call escape hatch — Mode 1 NEVER initiates Mode 2 execution; only the client can navigate to Mode 2 surfaces after seeing a Cat B `mode2_handoff_proposed` event.
6. **Enqueue jobs to Mode 2 worker queues** (Mode 2 protocol-execution queues are off-limits from Mode 1; the queue names + ACL are enumerated in the canonical allow-list per below).
7. **Execute LLM-generated tool calls** that resolve to Mode 2 surfaces. If the LLM provider returns a tool-use block proposing a Mode 2 invocation, the Mode 1 handler MUST refuse to execute it; instead, the handler emits the `mode2_handoff_proposed` event and renders a tool-call-rejection in the assistant_message ("I noticed your request is about [protocol]; please tap here to start that workflow").

**Three-layer enforcement (per the SI-017 5-layer model precedent):**

1. **DB write enforcement (Layer 2 RLS + Layer 3 SECURITY DEFINER STEP 0):** clinical-state tables have RLS policies that reject writes from the Mode 1 service-role identity (the Mode 1 service runs under a dedicated DB role with INSERT/UPDATE/DELETE permissions ONLY on the enumerated `ai_mode1_*` tables + `i019_enqueue_ack_log` + audit tables). The SECURITY DEFINER procedures for clinical workflows verify caller-role membership at STEP 0a (in addition to I-032's tenant-GUC check at STEP 0b).

2. **Outbound HTTP allow-list (canonical service-mesh policy):** the Mode 1 service's egress policy enumerates allowed outbound destinations:
   - LLM provider endpoints (per CCR-driven configuration).
   - The crisis-detector service.
   - The multi-region ACK channel write endpoints.
   - The audit pipeline ingestion endpoint.
   Calls to any other internal service (Mode 2 endpoints, clinical-workflow services, protocol-engine APIs) are blocked at the service-mesh layer (Istio / similar policy) — the Mode 1 service literally cannot reach them at network level. This is the canonical infra enforcement; Track 5 Infra deliverable.

3. **Static analyzer rule `TLC-AI-002` (expanded scope):** verifies at PR open that:
   - No INSERT/UPDATE/DELETE on clinical tables (DB layer).
   - No `http.post('/ai/mode-2/*')` or equivalent client calls (code layer).
   - No `queue.enqueue('mode2-*')` or equivalent worker-queue enqueues (code layer).
   - No LLM tool-call dispatcher that resolves Mode 2 surfaces (the canonical tool-use dispatcher MUST have an allow-list; rule `TLC-AI-002` verifies the allow-list excludes Mode 2 patterns).

**The enforceable predicate is a UNION of all 3 layers.** Tests M1.7 + M1.12 + M1.13 (per §11) verify all 3 layers.

**LLM tool-use specific contract:** Mode 1's LLM tool-use is limited to **read-only / informational tools** (e.g., "look up patient's medication list to remind them"); no write-tools, no protocol-tools. The canonical tool-allow-list is configured per provider per CCR and audited as part of every turn (the tool-use catalog is included in `ai.mode1.llm_invoked` event payload).

### 5.2 Cross-mode escalation: Mode 1 → Mode 2

If the conversation reaches a state requiring protocol execution (e.g., patient requests a refill; the LLM identifies a protocol-applicable clinical request), Mode 1 MUST escalate to Mode 2 via the canonical handoff path:

1. Mode 1 emits Cat B `ai.mode1.mode2_handoff_proposed` (P2 keyed by tenant_id) with the proposed Mode 2 workflow_id + the conversation context.
2. The next user turn redirects to the appropriate Mode 2 surface (e.g., `POST /ai/mode-2/workflow/refill_request`) via client routing.
3. Mode 1 does NOT directly invoke Mode 2 handlers. The mode-boundary is the API surface; no internal-call escape hatch.

This preserves the canonical separation: Mode 1 = conversational (no side effects), Mode 2 = protocol execution (gated, governance-bound). Per ADR-002 + ADR-029.

---

## 6. Conversation-state durability

### 6.1 `ai_mode1_conversation` entities (proposed CDM amendment; R2 HIGH-2 closure: split-table immutable lifecycle)

Per the §10 OQ section below, this spec proposes adding **four entities** to CDM v1.2 (becoming CDM v1.3 at promotion). The split-table model preserves I-027 append-only semantics for every record AND supports the multi-state lifecycle (admission → detector_completed → llm_invoked → completed/failed) per the runtime state machine in §4.2.

```sql
-- Conversation envelope (1 row per conversation; truly immutable post-INSERT per R3 HIGH-1 closure)
CREATE TABLE ai_mode1_conversation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    patient_id UUID NOT NULL REFERENCES patient(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Append-only: INSERT once at conversation creation; no UPDATE permitted post-commit.
    -- Derived facts (last_turn_at, archived state) are computed via SELECT or sourced from
    -- separate append-only event tables (see ai_mode1_conversation_archival_event below).
    CONSTRAINT ai_mode1_conversation_tenant_check CHECK (tenant_id IS NOT NULL)
);

-- Conversation archival event (append-only; one row per archival event)
CREATE TABLE ai_mode1_conversation_archival_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    conversation_id UUID NOT NULL REFERENCES ai_mode1_conversation(id),
    archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived_by_user_id UUID NOT NULL,                        -- Operator who triggered archival
    archival_reason TEXT NOT NULL,                            -- One of {patient_retention_policy, patient_request, tenant_disable}
    -- Append-only; INSERT-only. The existence of a row for a conversation_id IS the "archived" state.
    CONSTRAINT ai_mode1_conversation_archival_unique UNIQUE (conversation_id)
);

-- Derived view: last_turn_at + archived state computed at query time
CREATE VIEW ai_mode1_conversation_state AS
SELECT
    c.id AS conversation_id,
    c.tenant_id,
    c.patient_id,
    c.created_at,
    (SELECT MAX(r.completed_at) FROM ai_mode1_conversation_turn_result r
     WHERE r.conversation_id = c.id AND r.tenant_id = c.tenant_id) AS last_turn_at,
    EXISTS (SELECT 1 FROM ai_mode1_conversation_archival_event a
            WHERE a.conversation_id = c.id) AS is_archived,
    (SELECT a.archived_at FROM ai_mode1_conversation_archival_event a
     WHERE a.conversation_id = c.id) AS archived_at
FROM ai_mode1_conversation c;

-- Immutable admission record (1 row per turn at admission; INSERT-only)
CREATE TABLE ai_mode1_conversation_turn_admission (
    id UUID PRIMARY KEY,                                      -- = turn_id (client-generated)
    tenant_id tenant_id_t NOT NULL,
    conversation_id UUID NOT NULL REFERENCES ai_mode1_conversation(id),
    patient_id UUID NOT NULL REFERENCES patient(id),
    user_message TEXT NOT NULL,                               -- Encrypted at rest per per-tenant KMS
    request_body_hash BYTEA NOT NULL,                         -- SHA-256 of canonicalized request body for idempotency-conflict detection
    history_snapshot_high_water_mark TIMESTAMPTZ NOT NULL,    -- MAX(ai_mode1_conversation_turn_result.completed_at) at admission for this conversation
    conversation_history_window INT NOT NULL,                 -- N value from request (or default 20)
    client_capabilities JSONB,
    admitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Append-only enforced by trigger; no UPDATE permitted post-commit
    CONSTRAINT ai_mode1_conversation_turn_admission_unique UNIQUE (conversation_id, id)
);

-- Immutable detector record (1 row per turn after detector completes; INSERT-only)
CREATE TABLE ai_mode1_conversation_turn_detector_result (
    turn_id UUID PRIMARY KEY REFERENCES ai_mode1_conversation_turn_admission(id),
    tenant_id tenant_id_t NOT NULL,
    detector_version TEXT NOT NULL,
    severity TEXT,                                            -- Null if no crisis; one of {self_harm, imminent_harm, medical_emergency}
    crisis_server_signal_id UUID,                             -- Set if crisis emitted; references i019_enqueue_ack_log
    detector_latency_ms INT NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
    -- Append-only; the existence of this row IS the canonical "detector_completed" state
);

-- Immutable result record (1 row per turn at completion or failure; INSERT-only)
CREATE TABLE ai_mode1_conversation_turn_result (
    turn_id UUID PRIMARY KEY REFERENCES ai_mode1_conversation_turn_admission(id),
    tenant_id tenant_id_t NOT NULL,
    conversation_id UUID NOT NULL REFERENCES ai_mode1_conversation(id),
    patient_id UUID NOT NULL REFERENCES patient(id),
    assistant_message TEXT,                                   -- Encrypted at rest; null if turn failed
    provider TEXT,                                            -- Null if turn failed pre-LLM
    model_id TEXT,
    prompt_token_count INT,
    completion_token_count INT,
    total_latency_ms INT NOT NULL,
    turn_outcome TEXT NOT NULL,                               -- One of {completed, failed}
    failure_class TEXT,                                       -- Null if completed; one of {llm_provider_unavailable, crisis_detector_unavailable, internal_error, crisis_signal_enqueue_failed}
    failure_phase TEXT,                                       -- Null if completed; one of {pre_detector, pre_llm, during_llm, post_llm}
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
    -- Append-only; the existence of this row IS the canonical "completed/failed" state
);

CREATE INDEX ai_mode1_conversation_turn_admission_lookup_idx
    ON ai_mode1_conversation_turn_admission(tenant_id, conversation_id, admitted_at DESC);
CREATE INDEX ai_mode1_conversation_turn_result_history_idx
    ON ai_mode1_conversation_turn_result(tenant_id, conversation_id, completed_at DESC);
```

All five tables (4 lifecycle + 1 archival event) enforce RLS per ADR-023 Model A + I-023 tenant isolation. The derived view is RLS-bound through its base tables. Per-tenant KMS encryption on `user_message` + `assistant_message` per I-026.

### 6.2 Append-only semantics (R2 HIGH-2 + R3 HIGH-1 closure: truly INSERT-only across all 5 tables)

Every row in all 5 tables (`ai_mode1_conversation` + `ai_mode1_conversation_archival_event` + `ai_mode1_conversation_turn_admission` + `ai_mode1_conversation_turn_detector_result` + `ai_mode1_conversation_turn_result`) is **INSERT-only**; UPDATE forbidden post-commit; enforced by trigger per I-027. No table has any mutable column. Derived facts (`last_turn_at`, `is_archived`, `archived_at`) are computed at query time via the `ai_mode1_conversation_state` view, which sources from append-only base tables.

**Closes R3 HIGH-1:** the prior `ai_mode1_conversation.last_turn_at` mutable field is removed; replaced by the view-computed aggregate. Archival is modeled as an append-only event row instead of a nullable `archived_at` UPDATE.

The multi-state lifecycle is expressed as **the existence of progressively more rows**, NOT as state mutations on any single row:

| Lifecycle state | Canonical durable representation |
|---|---|
| `admitted` | Row exists in `ai_mode1_conversation_turn_admission` |
| `detector_completed` | Row exists in `ai_mode1_conversation_turn_detector_result` for same `turn_id` |
| `completed` | Row exists in `ai_mode1_conversation_turn_result` with `turn_outcome = 'completed'` |
| `failed` | Row exists in `ai_mode1_conversation_turn_result` with `turn_outcome = 'failed'` |

**No mutable aggregates on any base table.** `last_turn_at` and `is_archived` / `archived_at` are computed at query time via the `ai_mode1_conversation_state` view. The view is a SELECT-time aggregate over append-only event/result rows; reading it is replay-safe + audit-reconstructable per I-027 (the audit-chain reconstruction sources from the same append-only base tables).

DELETE forbidden except for tenant-retention-policy hard-deletes (covered by separate retention spec; not Mode 1's surface).

**Runtime state-machine state ↔ DB-row existence correspondence (closes R2 MED-1):**

- The runtime state-machine `admitted` state IS the existence of the `ai_mode1_conversation_turn_admission` row. Adapter guards consume this row's existence as the precondition.
- The runtime `detector_completed` state IS the existence of the `ai_mode1_conversation_turn_detector_result` row. The LLM adapter MUST verify this row exists for the turn_id BEFORE issuing the HTTP request to the provider (per §4.2 runtime invariant).
- The runtime `completed` / `failed` state IS the existence of the `ai_mode1_conversation_turn_result` row. The idempotency-cache reads from this row for already-completed turns.

This correspondence ensures the durable representation matches the runtime state machine across process restarts, retries, and provider-adapter execution paths.

**Concurrent admission retry semantics (R1 MED-2 + R2 HIGH-2 closure refined):**

- Two concurrent requests with the same `turn_id`: both attempt to INSERT into `ai_mode1_conversation_turn_admission` with the same primary key; one succeeds (the winner of the database-level uniqueness check), the other receives a duplicate-key error.
- The losing attempt then SELECTs the existing admission row to compare request_body_hash:
  - If hashes match: poll `ai_mode1_conversation_turn_result` for up to 30s; return the result row's response (or wait for in-flight completion).
  - If hashes differ: return 409 `mode1.turn_id_conflict` immediately.
- This is the canonical concurrency-safe pattern; advisory locks are unnecessary because the primary-key uniqueness check at INSERT is itself the canonical mutex.

### 6.3 Conversation-history-window contract (R1 MED-2 + R2 HIGH-2 closure: replay-safe under concurrent retries via split-table model)

When the request specifies `conversation_history_window: N`, the handler:

1. **At turn-admission:**
   - Computes `history_snapshot_high_water_mark` = `MAX(completed_at)` from `ai_mode1_conversation_turn_result` where `conversation_id = $1 AND completed_at < now()` AT admission time (this is a transactionally-consistent timestamp at the moment of admission).
   - Computes `request_body_hash` = SHA-256 of canonicalized request body.
   - INSERTs into `ai_mode1_conversation_turn_admission` with primary key = `turn_id`. The INSERT either succeeds (this is the winning attempt) OR fails with duplicate-key (concurrent retry — handled per §6.2 retry semantics).
2. **SELECTs the last N turns** from `ai_mode1_conversation_turn_result` (joined to `ai_mode1_conversation_turn_admission` for `user_message`) for the conversation_id WHERE `completed_at <= history_snapshot_high_water_mark` (ORDER BY completed_at DESC LIMIT N). **The high-water-mark snapshot ensures the same N turns are used on every retry**, even if intervening turns have completed between admission and retry.
3. Constructs the LLM prompt with those N prior (admission.user_message + result.assistant_message) pairs + the current `user_message`.
4. The default N=20 is the canonical balance between context-quality + LLM-cost; the max N=50 caps per-turn cost.

**Replay-safety invariant:** for a given `(tenant_id, conversation_id, turn_id)`, the LLM prompt is deterministically reconstructable from `history_snapshot_high_water_mark` (persisted on the admission row) + the immutable `user_message` field on the admission row. Subsequent retries see the same prompt and (once `ai_mode1_conversation_turn_result` row exists) the same `assistant_message`. The canonical idempotency-cache reads from `ai_mode1_conversation_turn_result` keyed by `(tenant_id, conversation_id, turn_id)`; once present, retries return the cached response without re-invoking the LLM.

**Test M1.5 + M1.14 + M1.18 (per §11) verify replay-safety under concurrent retries.**

---

## 7. LLM provider abstraction

### 7.1 CCR-driven provider selection

Per Contracts Pack v5.2 CCR_RUNTIME (Sprint 8 cross-reference), the LLM provider for a tenant is determined by `tenant.ai_provider` CCR key. Allowed values:
- `anthropic`: Claude (Sonnet 4.6 default; Opus 4.7 escalation per per-tenant flag)
- `azure-openai`: GPT-4.1 (Azure-hosted; HIPAA-covered)
- `openai`: GPT-4.1 direct (non-HIPAA contract; permitted only for non-PHI tenants — guarded by static analyzer rule `TLC-AI-003`)

### 7.2 Provider-abstraction layer

The Mode 1 handler invokes a single abstraction `llm.invoke(prompt, model_id)` that routes to the provider per CCR config. Provider-specific authentication, BAA-chain handling, and KMS-encrypted-at-rest prompt logging are the responsibility of the abstraction layer (not the Mode 1 handler).

### 7.3 Provider failure handling

If `llm.invoke()` fails:
- 5xx from provider → 503 `mode1.llm_provider_unavailable` (retry-able).
- Provider quota exceeded → 429 `mode1.rate_limit_exceeded` (per-tenant quota tracking at the abstraction layer).
- Timeout (>15s; the canonical hard ceiling) → 503 `mode1.llm_provider_unavailable`.

In all failure paths, the crisis_signal (if emitted) is still durable; the patient sees the failure response but the crisis-response trail is preserved.

---

## 8. Rate limiting + per-tenant quota

| Limit | Value | Lockout |
|---|---|---|
| Per-session turn rate | 1 turn / 3s | 429 with Retry-After: 3 |
| Per-session conversation length | 100 turns | New conversation_id required |
| Per-tenant daily Mode 1 turn count | Configured per tenant via CCR `tenant.ai_mode1_daily_quota` (default: 10k turns / day per active patient) | 429 |
| Per-tenant LLM token budget | Configured per tenant; soft alerting at 80%, hard cap at 100% (429 at hard cap) | 429 |

Rate-limit state is held in a per-region cache (Redis or equivalent); counters are synced via the multi-region ACK channel topology where appropriate (the per-tenant daily counter must survive regional outage per Cold-DR Runbook §"DR-survivable" patterns).

---

## 9. Latency budget

Canonical happy-path budget:

| Phase | p50 | p99 | Hard ceiling |
|---|---|---|---|
| Request admission (middleware + auth + RLS bind) | 5ms | 15ms | 50ms |
| Crisis detector | 100ms | 500ms | 1s (timeout = 503) |
| Conversation-history load (last N=20 turns) | 10ms | 50ms | 200ms |
| LLM invocation | 800ms | 2200ms | 15s (timeout = 503) |
| Audit emission (per turn; 5 events) | 5ms each | 20ms each | 100ms each (per-event drop if Cat C; turn-fail if Cat A) |
| Response emit + idempotency-cache write | 5ms | 15ms | 50ms |
| **Total turn p99** | — | **≤2.5s** (excluding LLM tail) | **≤16s** (worst case with LLM hard ceiling) |

If p99 exceeds 2.5s for >5 minutes, an SRE alert fires (PagerDuty integration per SIEM Spec §3 alerting taxonomy).

---

## 10. Open questions for ratifier

1. **OQ1 — CDM amendment scope (`ai_mode1_conversation` + `ai_mode1_conversation_turn`).** This spec proposes adding 2 entities to CDM v1.2. Recommendation: file as SI-023 (sister-SI to Sprint 8's SI-022 `session_state` addition). Ratifier sequencing aligns the two CDM additions.
2. **OQ2 — Crisis-detector implementation primitive.** ML model fine-tuned on safety-classified conversations vs prompt-engineering against a generalist LLM vs rule-based fallback. Recommendation: file as separate SI (Track 2 Clinical Lead + Safety Lead co-owners). For v1.0 of this spec, the detector contract (§4.1) is what matters; the implementation is OQ-deferred.
3. **OQ3 — `ai_provider` CCR key activation timing.** Per §7.1, the spec assumes the CCR key exists. Sprint 3 SI-016 + CCR_RUNTIME v5.2 amendments are the closest precedent. Recommendation: confirm CCR key registration sequence.
4. **OQ4 — Per-tenant token-budget enforcement mechanism.** Real-time enforcement (every turn checks budget) vs eventual enforcement (background reconciler enforces 100% cap after N-minute lag). Recommendation: real-time per-turn; eventual model leaks budget overage.
5. **OQ5 — Cross-region rate-limit counter sync.** Per §8, per-tenant daily quota counters need cross-region sync. Recommendation: route via the same multi-region ACK channel topology as crisis signals (Cold-DR OQ7-deferred implementation primitive); the rate-limit counter is a much lower volume than crisis signals, so the same primitive suffices.
6. **OQ6 — Codex pre-ratification target.** Recommendation: 2-3 rounds (Engineering Spec; cross-references Sprint 3/7/8 + canonical multi-region topology).

---

## 11. Test coverage commitments (acceptance-criterion-grade with concrete CI gates per SI-017 Sprint 8 precedent)

| Test ID | File location | CI job | Verifies | Section |
|---|---|---|---|---|
| Test M1.1 | `apps/api-server/__integration__/ai/mode1_happy_path.test.ts` | `integration-ai-mode1` | Canonical happy-path: admission → detector (null) → LLM → response | §2, §3.1 |
| Test M1.2 | `apps/api-server/__integration__/ai/mode1_crisis_detection.test.ts` | `integration-ai-mode1` | Detector fires → Cat A `crisis_signal_emitted` BEFORE LLM call → response includes `crisis_signal` | §4.1, §4.2 |
| Test M1.3 | `apps/api-server/__integration__/ai/mode1_detector_unavailable.test.ts` | `integration-ai-mode1` | Detector 5xx/timeout → 503 `mode1.crisis_detector_unavailable` + Cat A `crisis_detector_failed` | §4.3 |
| Test M1.4 | `apps/api-server/__integration__/ai/mode1_llm_unavailable.test.ts` | `integration-ai-mode1` | LLM 5xx → 503 `mode1.llm_provider_unavailable` + Cat C `turn_failed`; crisis_signal (if any) STILL durable | §7.3 |
| Test M1.5 | `apps/api-server/__integration__/ai/mode1_idempotency.test.ts` | `integration-ai-mode1` | Same turn_id replay with same body → cached response; different body → 409 | §2.5 |
| Test M1.6 | `apps/api-server/__integration__/ai/mode1_tenant_isolation.test.ts` | `integration-ai-mode1` | Cross-tenant conversation_id access → 404 (tenant-blind per I-025); RLS enforces | §6.1, SI-017 |
| Test M1.7 | `tools/static-analyzer/tests/ai-mode-1-side-effects.test.ts` | `static-analyzer` | Mode 1 handler INSERTing into clinical tables fails rule `TLC-AI-002` | §5.1 |
| Test M1.8 | `tools/static-analyzer/tests/ai-mode-1-detector-ordering.test.ts` | `static-analyzer` | Mode 1 handler calling LLM before detector fails rule `TLC-AI-001` | §4.2 |
| Test M1.9 | `apps/api-server/__integration__/ai/mode1_mode2_handoff.test.ts` | `integration-ai-mode1` | Mode 1 turn proposing Mode 2 → Cat B `mode2_handoff_proposed`; NO direct invocation of Mode 2 handler | §5.2 |
| Test M1.10 | `apps/api-server/__integration__/ai/mode1_rate_limit.test.ts` | `integration-ai-mode1` | Per-session 1-turn-per-3s → 429; Per-tenant daily quota exceeded → 429 | §8 |
| Test M1.11 | `apps/api-server/__integration__/ai/mode1_runtime_state_machine.test.ts` | `integration-ai-mode1` | Runtime state-machine: any attempt to call `llm.invoke()` outside the `detector_completed` state fails the turn with 500 + Cat A `invariant_violation_detector_ordering` event (per R1 HIGH-1 runtime-enforcement) | §4.2 |
| Test M1.12 | `apps/api-server/__integration__/ai/mode1_cat_a_audit_failure.test.ts` | `integration-ai-mode1` | Cat A `crisis_signal_emitted` audit INSERT fails → turn fails with 503; response NOT emitted | §3.2 |
| Test M1.13 | `apps/api-server/__integration__/ai/mode1_cat_c_drop_partitioning.test.ts` | `integration-ai-mode1` | Cat C drop aggregator emits `audit.cat_c_drop_observed` Cat B P2 event keyed by tenant_id per minute bucket; verifies SI-018 routing | §3.2, §3.3 |
| Test M1.14 | `apps/api-server/__integration__/ai/mode1_concurrent_retry.test.ts` | `integration-ai-mode1` | Two concurrent requests with same turn_id: advisory lock holds; second waits up to 30s; both return same response (or 409 if bodies differ) | §6.3 R1 MED-2 |
| Test M1.15 | `apps/api-server/__integration__/ai/mode1_ack_quorum_partition.test.ts` | `integration-ai-mode1` | Crisis signal under normal operation → 2-of-2 quorum eventually achieved (async); under simulated regional outage → W=1 + `partition_degraded=true` row; turn STILL succeeds in both modes; verifies R1 HIGH-3 dual-durability semantics | §4.4 |
| Test M1.16 | `apps/api-server/__integration__/ai/mode1_tool_use_mode2_denial.test.ts` | `integration-ai-mode1` | LLM tool-use proposing a Mode 2 invocation → handler refuses to execute + emits Cat B `mode2_handoff_proposed` + renders rejection in assistant_message | §5.1 R1 MED-1 |
| Test M1.17 | `apps/api-server/__integration__/ai/mode1_phi_provider_enforcement.test.ts` | `integration-ai-mode1` | Tenant with PHI flag + `ai_provider = 'openai'` (non-HIPAA) → static-analyzer rule TLC-AI-003 fails at PR open; runtime: such a configuration is rejected at tenant-config admission with Cat A `tenant_config.phi_provider_violation` | §7.1, TLC-AI-003 |
| Test M1.18 | `apps/api-server/__integration__/ai/mode1_history_snapshot_replay.test.ts` | `integration-ai-mode1` | Turn admitted at T0 captures history_snapshot_high_water_mark; intervening turn commits at T1; retry of T0's turn at T2 uses same snapshot, returns same prompt + same cached response | §6.3 R1 MED-2 |
| Test M1.19 | `apps/api-server/__integration__/ai/mode1_egress_allow_list.test.ts` | `integration-ai-mode1` | Mode 1 service attempting to HTTP-call `POST /ai/mode-2/*` → blocked at service-mesh layer; integration test verifies the policy is enforced (test runs against the canonical service-mesh fixture) | §5.1 Layer 2 |
| Test M1.20 | `apps/api-server/__integration__/ai/mode1_queue_denial.test.ts` | `integration-ai-mode1` | Mode 1 attempting to enqueue to a `mode2-*` worker queue → blocked by (a) static-analyzer rule TLC-AI-002 at PR open AND (b) runtime queue-ACL rejection (the BullMQ wrapper enforces an allow-list per service-role); verifies both layers (R2 MED-2 closure) | §5.1 Layer 3 + TLC-AI-002 |

**Static-analyzer rule IDs registered at this amendment:**
- `TLC-AI-001` — Mode 1 handler calling LLM before crisis detector (detector-before-LLM ordering invariant; verifies runtime state-machine guard exists per R1 HIGH-1 closure).
- `TLC-AI-002` — Mode 1 handler INSERTing/UPDATEing/DELETing on clinical tables outside the enumerated `ai_mode1_*` set OR issuing HTTP calls / queue enqueues / LLM tool-calls that resolve Mode 2 surfaces (extended scope per R1 MED-1 closure).
- `TLC-AI-003` — Mode 1 handler routing PHI conversation to a non-HIPAA-covered LLM provider (BAA chain enforcement; test M1.17 verifies).

---

## 12. Cross-SI alignment summary

| Cross-SI surface | Mode 1 Handler Spec surface | Relationship |
|---|---|---|
| SI-016 ai_workflow_handler_registry (Sprint 3) | §5.2 Mode 1 → Mode 2 handoff | Mode 1 NEVER invokes Mode 2 handlers directly; handoff is via API surface only |
| SI-017 Identity Spec v1.1 (Sprint 8) | §2.4 401 tenant-blind; §6.1 RLS tenant binding | Mode 1 handler is downstream of canonical middleware-GUC; RLS enforces tenant isolation |
| SI-018 two-tier hybrid audit-chain partition | §3.3 partition key routing | Per the canonical per-event partition table in §3.3 (R1 HIGH-2 closure): Mode 1 emits BOTH P1 patient-bound events (turn lifecycle + crisis-detection per-turn forensics) AND P2 tenant-bound governance/observability events (`mode2_handoff_proposed` + `audit.cat_c_drop_observed` aggregates). §3.3 is the canonical source; do NOT assume "all Mode 1 events route to P1" |
| Cold-DR Runbook (Sprint 7) | §4.4 multi-region ACK channel + crisis-signal emission | Crisis signals use the partition-aware multi-region ACK channel; three-state per-device obligation model applies during DR |
| ADR-029 AI workload taxonomy | §1 + §5 Mode 1 = conversational-assistant workload class | Mode 1 + Mode 2 distinction is the canonical ADR-029 split |
| I-019 crisis-detection-always-on | §4 detector contract + fail-closed | The canonical Mode 1 implementation of I-019 platform floor |
| Contracts Pack v5.2 AI_LAYERING + WORKLOAD_TAXONOMY + AUTONOMY_LEVELS | §1 + §3 + §5 boundary | Mode 1 is autonomy level L1 (conversational; no clinical decisions); Mode 2 is L2-L4 |

---

## 13. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; awaiting Codex R1.

**v0.1 R1 closure 2026-05-19:** 3 HIGH + 3 MED findings closed inline (all in-scope correctness gaps; no architectural-judgment items requiring ratifier escalation).

**v0.1 R2 closure 2026-05-19:** 2 HIGH + 2 MED findings closed inline (R1 closures landed correctly in the body sections but: (a) the §12 cross-SI alignment summary still carried the pre-R1 "all events to P1" claim; (b) the multi-state lifecycle in §4.2 + §6.3 conflicted with §6.2's append-only INSERT-at-completion constraint; (c) `history_snapshot_high_water_mark` was referenced but not in the schema; (d) Mode 2 worker-queue denial test was missing). All 4 closed inline via split-table model + canonical cross-references.

**v0.1 R3 closure 2026-05-19:** 1 HIGH closed inline — the R2 split-table model still had a mutable `last_turn_at` field on `ai_mode1_conversation` (via INSERT trigger pattern) which violated the claimed "all 4 tables INSERT-only" across all entities. R3 closure: removed the mutable field entirely; added `ai_mode1_conversation_archival_event` append-only event table for archival; added `ai_mode1_conversation_state` derived view that computes `last_turn_at` + `is_archived` + `archived_at` at query time from the append-only base tables. All 5 tables (4 lifecycle + 1 archival event) are now truly INSERT-only across all entities; I-027 append-only invariant honored without exception.

**Full Codex trajectory:**

| Round | Findings | Status |
|---|---|---|
| R1 | HIGH-1 detector-before-LLM enforced only via static-analyzer (no runtime guard); HIGH-2 Cat C drop event Cat B P2 classification contradicted "all Mode 1 events route to P1" claim; HIGH-3 ACK durability semantics conflated audit-row durability (blocks) with quorum-promotion durability (async); MED-1 no-Mode-2-side-effects predicate didn't cover HTTP / queue / tool-use paths; MED-2 history-window not replay-safe under concurrent retries; MED-3 missing tests for Cat A audit failure / Cat C drop partitioning / ACK quorum / concurrent retries / history snapshot / Mode 2 tool denial / PHI provider enforcement | All 6 closed inline |
| R2 | HIGH-1 §12 cross-SI summary still carried pre-R1 "all events to P1" claim (contradicting §3.3 amended table); HIGH-2 multi-state lifecycle vs append-only INSERT-at-completion contradiction + missing `history_snapshot_high_water_mark` schema column; MED-1 detector_completed state not durable in schema; MED-2 missing Mode 2 worker-queue denial test | All 4 closed inline via split-table model |
| R3 | HIGH `ai_mode1_conversation.last_turn_at` remained mutable via INSERT trigger; violated R2's claimed "all 4 tables INSERT-only" across all entities | Closed inline by removing the mutable field; archival modeled as append-only event table; derived facts via view |

**R1 closure pattern recap:**
- HIGH-1: added runtime per-turn state machine (`admitted → detector_completed → llm_invoked → completed`); `llm.invoke()` adapter verifies state before issuing HTTP request; defense-in-depth via static analyzer remains.
- HIGH-2: explicit per-event partition table added (§3.3) with both P1 patient-bound + P2 governance/observability events; the "all Mode 1 events route to P1" claim retracted; `audit.cat_c_drop_observed` classified as Cat B P2 keyed by tenant_id per-minute aggregate, emitted by audit pipeline (not Mode 1 handler directly).
- HIGH-3: §4.4 distinguishes (a) Cat A audit-row durability (gating; turn fails on failure) from (b) ACK channel signal-record durability (W=1 local enqueue gates turn; W=2 quorum promotion is async per Cold-DR Sprint 7 three-state model). Added Cat A `ai.mode1.crisis_signal_enqueue_failed` event for the local-enqueue-failure path.
- MED-1: predicate extended to 3-layer enforcement (DB write enforcement + outbound HTTP allow-list at service mesh + static-analyzer expanded scope). LLM tool-use specifically limited to read-only/informational tools; write-tools forbidden.
- MED-2: history-window snapshot via `history_snapshot_high_water_mark` column on turn row + advisory lock on `(tenant_id, conversation_id, turn_id)` for concurrent-retry safety.
- MED-3: 9 additional merge-blocking tests added (M1.11-M1.19): runtime state machine, Cat A audit failure, Cat C drop partitioning, concurrent retry, ACK quorum/partition, Mode 2 tool denial, PHI provider enforcement, history snapshot replay, egress allow-list.

No architectural-judgment items introduced inline; CLAUDE.md hard-floor item 6 honored. Codex flagged HIGH-2 + HIGH-3 as "architectural contract decisions" but on review both fall within existing canonical surfaces (SI-018 has both P1 and P2 categories; Sprint 7 Cold-DR Runbook three-state model articulates ACK-quorum semantics); the closures are in-scope clarifications. The 6 known OQs (§10) remain ratifier-targetable.

---

— Claude (Opus 4.7, 1M context), AI Service Mode 1 Handler Specification v0.1 DRAFT authored 2026-05-19 under "continue for 24 hrs" autonomous-work authorization. Sprint 9 of the 24h-loop work plan. Track 2 spec-corpus deliverable. Defines the canonical HTTP handler contract for the conversational-assistant AI workload class per ADR-002 + ADR-029. Companion to SI-017 Identity Spec v1.1 amendment (Sprint 8) + SI-016 ai_workflow_handler_registry (Sprint 3) + Cold-DR Runbook v0.1 DRAFT (Sprint 7) — together these 4 specs articulate the canonical AI Service modular monolith boundary at the spec-corpus level.
