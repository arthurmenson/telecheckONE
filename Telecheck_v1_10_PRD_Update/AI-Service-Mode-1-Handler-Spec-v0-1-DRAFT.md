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
- **Cat C events** (sampled high-volume): if audit emission fails, the event is dropped (sampled high-volume contract permits this); but the turn proceeds. The drop is itself counted in a Cat B `audit.cat_c_drop_observed` event aggregated per minute per tenant.

### 3.3 Audit partition key routing per SI-018

All Mode 1 audit events route to P1 (patient-bound partition) keyed by patient_id (= user_id), per SI-018 ratified partition rule. There are no Mode 1 audit events that route to P2 — Mode 1 is patient-conversation; no platform-governance events are emitted from the Mode 1 handler. (Operator + admin AI tooling, if added later, would route to P2 separately.)

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

### 4.2 Detector-LLM ordering invariant (canonical no-bypass)

The detector runs BEFORE the LLM call. The handler MUST NOT short-circuit the detector to "save latency" — the always-on floor takes precedence over latency budgets. Codex / static-analyzer rule `TLC-AI-001` enforces detector-before-LLM ordering at PR open (merge-blocking).

### 4.3 Detector-failure handling

If the detector is unavailable (timeout, 5xx, network failure):

- Mode 1 turn MUST fail with 503 `mode1.crisis_detector_unavailable`.
- Cat A `ai.mode1.crisis_detector_failed` event emitted (P1 keyed by patient_id).
- The client receives the 503; retry-able with backoff (Retry-After header). The patient sees a degraded-experience message ("AI assistant is temporarily unavailable; please try again in a moment, or tap here for crisis resources if you need immediate help") rendered by the client.

This is the canonical implementation of "I-019 crisis-detection-always-on platform floor" for Mode 1.

### 4.4 Multi-region ACK channel integration

Per Sprint 7 Cold-DR Runbook §"DR-survivable multi-region ACK channel topology" + partition-aware quorum semantics (R5 closure):

- `ai.mode1.crisis_signal_emitted` writes are durable per the channel's normal-operation 2-of-2 quorum (both regions accept).
- During a declared regional outage, writes degrade to single-region W=1 with `partition_degraded=true` flag.
- The Mode 1 handler does NOT block waiting for quorum confirmation before returning the response; the response includes the `server_signal_id` immediately after the local enqueue, and the platform's reconciliation flow guarantees eventual durability + Step 14.5 inventory completeness (per Cold-DR Runbook §"Three-state per-device obligation model").

---

## 5. Mode-1-Mode-2 boundary enforcement

### 5.1 The canonical no-Mode-2-side-effects predicate

Mode 1 is the **conversational-assistant** workload class per ADR-029. Mode 1 handlers MUST NOT:

1. Invoke protocol-execution procedures (no `record_protocol_executed()` calls).
2. Mutate clinical state (no INSERTs on `medication_request`, `consult`, `prescription`, `lab_order`, etc.).
3. Schedule clinical actions (no background-worker enqueues for protocol execution).
4. Modify medication records, dosage, or anything in the clinical workflow surface.

The canonical predicate: a Mode 1 turn's database-side effect is LIMITED to:
- `ai_mode1_conversation_turn` INSERT (recording the turn).
- `ai_mode1_conversation_state` UPDATE (advancing the conversation state machine; idempotent on turn_id).
- `i019_enqueue_ack_log` INSERT (crisis-signal emission, when applicable).
- Audit events per §3.

Any INSERT/UPDATE/DELETE outside this enumerated set is a CI-blocking violation (static analyzer rule `TLC-AI-002`).

### 5.2 Cross-mode escalation: Mode 1 → Mode 2

If the conversation reaches a state requiring protocol execution (e.g., patient requests a refill; the LLM identifies a protocol-applicable clinical request), Mode 1 MUST escalate to Mode 2 via the canonical handoff path:

1. Mode 1 emits Cat B `ai.mode1.mode2_handoff_proposed` (P2 keyed by tenant_id) with the proposed Mode 2 workflow_id + the conversation context.
2. The next user turn redirects to the appropriate Mode 2 surface (e.g., `POST /ai/mode-2/workflow/refill_request`) via client routing.
3. Mode 1 does NOT directly invoke Mode 2 handlers. The mode-boundary is the API surface; no internal-call escape hatch.

This preserves the canonical separation: Mode 1 = conversational (no side effects), Mode 2 = protocol execution (gated, governance-bound). Per ADR-002 + ADR-029.

---

## 6. Conversation-state durability

### 6.1 `ai_mode1_conversation` entity (proposed CDM amendment)

Per the §10 OQ section below, this spec proposes adding two entities to CDM v1.2 (becoming CDM v1.3 at promotion):

```sql
CREATE TABLE ai_mode1_conversation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    patient_id UUID NOT NULL REFERENCES patient(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_turn_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived_at TIMESTAMPTZ,
    -- RLS: tenant_id = current_setting('app.tenant_id')
    CONSTRAINT ai_mode1_conversation_tenant_check CHECK (tenant_id IS NOT NULL)
);

CREATE TABLE ai_mode1_conversation_turn (
    id UUID PRIMARY KEY,                                      -- = turn_id (client-generated)
    tenant_id tenant_id_t NOT NULL,
    conversation_id UUID NOT NULL REFERENCES ai_mode1_conversation(id),
    patient_id UUID NOT NULL REFERENCES patient(id),
    user_message TEXT NOT NULL,                               -- Encrypted at rest per per-tenant KMS
    assistant_message TEXT,                                   -- Encrypted at rest; null if turn failed
    crisis_severity TEXT,                                     -- Null if no crisis; one of {self_harm, imminent_harm, medical_emergency}
    crisis_server_signal_id UUID,                             -- Null if no crisis; references i019_enqueue_ack_log
    provider TEXT NOT NULL,                                   -- LLM provider ID
    model_id TEXT NOT NULL,
    prompt_token_count INT NOT NULL,
    completion_token_count INT,                               -- Null if turn failed pre-LLM
    total_latency_ms INT NOT NULL,
    turn_status TEXT NOT NULL,                                -- One of {admitted, llm_called, completed, failed}
    failure_class TEXT,                                       -- Null if not failed
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- RLS: tenant_id = current_setting('app.tenant_id')
    CONSTRAINT ai_mode1_conversation_turn_unique UNIQUE (conversation_id, id)
);

CREATE INDEX ai_mode1_conversation_turn_lookup_idx
    ON ai_mode1_conversation_turn(tenant_id, conversation_id, created_at DESC);
```

Both tables enforce RLS per ADR-023 Model A + I-023 tenant isolation. Per-tenant KMS encryption on `user_message` + `assistant_message` per I-026.

### 6.2 Append-only semantics

`ai_mode1_conversation_turn` is append-only per I-027:
- INSERT only; UPDATE forbidden post-commit (enforced by trigger).
- DELETE forbidden except for tenant-retention-policy hard-deletes (covered by separate retention spec; not Mode 1's surface).
- The `assistant_message` and `turn_status` are written at turn-completion in the SAME transaction as the INSERT (not a subsequent UPDATE) — the canonical pattern is: build the row in-memory, INSERT once at turn-completion.

### 6.3 Conversation-history-window contract

When the request specifies `conversation_history_window: N`, the handler:
1. SELECTs the last N turns of `ai_mode1_conversation_turn` for the conversation_id (ORDER BY created_at DESC LIMIT N).
2. Constructs the LLM prompt with those N prior turns + the current `user_message`.
3. The default N=20 is the canonical balance between context-quality + LLM-cost; the max N=50 caps per-turn cost.

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

**Static-analyzer rule IDs registered at this amendment:**
- `TLC-AI-001` — Mode 1 handler calling LLM before crisis detector (detector-before-LLM ordering invariant).
- `TLC-AI-002` — Mode 1 handler INSERTing/UPDATEing/DELETing on clinical tables outside the enumerated `ai_mode1_*` set (no-Mode-2-side-effects predicate).
- `TLC-AI-003` — Mode 1 handler routing PHI conversation to a non-HIPAA-covered LLM provider (BAA chain enforcement).

---

## 12. Cross-SI alignment summary

| Cross-SI surface | Mode 1 Handler Spec surface | Relationship |
|---|---|---|
| SI-016 ai_workflow_handler_registry (Sprint 3) | §5.2 Mode 1 → Mode 2 handoff | Mode 1 NEVER invokes Mode 2 handlers directly; handoff is via API surface only |
| SI-017 Identity Spec v1.1 (Sprint 8) | §2.4 401 tenant-blind; §6.1 RLS tenant binding | Mode 1 handler is downstream of canonical middleware-GUC; RLS enforces tenant isolation |
| SI-018 two-tier hybrid audit-chain partition | §3.3 partition key routing | All Mode 1 audit events route to P1 keyed by patient_id |
| Cold-DR Runbook (Sprint 7) | §4.4 multi-region ACK channel + crisis-signal emission | Crisis signals use the partition-aware multi-region ACK channel; three-state per-device obligation model applies during DR |
| ADR-029 AI workload taxonomy | §1 + §5 Mode 1 = conversational-assistant workload class | Mode 1 + Mode 2 distinction is the canonical ADR-029 split |
| I-019 crisis-detection-always-on | §4 detector contract + fail-closed | The canonical Mode 1 implementation of I-019 platform floor |
| Contracts Pack v5.2 AI_LAYERING + WORKLOAD_TAXONOMY + AUTONOMY_LEVELS | §1 + §3 + §5 boundary | Mode 1 is autonomy level L1 (conversational; no clinical decisions); Mode 2 is L2-L4 |

---

## 13. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; awaiting Codex R1.

---

— Claude (Opus 4.7, 1M context), AI Service Mode 1 Handler Specification v0.1 DRAFT authored 2026-05-19 under "continue for 24 hrs" autonomous-work authorization. Sprint 9 of the 24h-loop work plan. Track 2 spec-corpus deliverable. Defines the canonical HTTP handler contract for the conversational-assistant AI workload class per ADR-002 + ADR-029. Companion to SI-017 Identity Spec v1.1 amendment (Sprint 8) + SI-016 ai_workflow_handler_registry (Sprint 3) + Cold-DR Runbook v0.1 DRAFT (Sprint 7) — together these 4 specs articulate the canonical AI Service modular monolith boundary at the spec-corpus level.
