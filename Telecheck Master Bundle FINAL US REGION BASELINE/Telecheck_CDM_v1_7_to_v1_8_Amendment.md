# CDM v1.7 → v1.8 + AUDIT_EVENTS v5.9 → v5.10 + DOMAIN_EVENTS additive + CCR_RUNTIME v5.3 → v5.4 Amendment (Mode 1 Handler Spec follow-on)

**Version:** 0.8 DRAFT
**Status:** POST-R7 (1 HIGH closed inline: R6's column-level grants to ai_mode1_reader still let dashboard/portal/admin roles directly query base tables and enumerate per-turn timestamps + per-archival entries (rather than seeing only the view's MAX aggregates). Data-minimization boundary bypassed. Fix: replaced security_invoker view with plain view + non-BYPASSRLS owner-only base-table grants + explicit `WHERE tenant_id = current_tenant_id_strict()` in view body. ai_mode1_reader has SELECT on the VIEW ONLY — no base-table access; cannot bypass the aggregation. Tenant isolation enforced explicitly in view body via SI-024.1 JWT-binding canonical helper (uses calling session's GUC even though base-table queries run with owner privileges). Trade-off: superseded Mode 1 spec's R7 HIGH-1 security_invoker form for the data-minimization-priority plain-view form; trust chain documented inline. Previously POST-R6 (1 HIGH closed inline: R5's broad table-level GRANT SELECT to ai_mode1_reader overexposed raw conversation content — that role is granted to clinician dashboard, pharmacy portal, admin roles, so they could bypass the narrow state view and query base tables directly including PHI-bearing user_message + assistant_message columns. Fix: replaced broad table SELECT with column-level least-privilege grants matching exactly the view's SELECT list — ai_mode1_reader CANNOT read raw message content via direct base-table access; that access is reserved for distinct roles (Mode 1 service, audit tooling) granted explicitly out of scope. Previously POST-R5 (1 MED closed inline: SECURITY INVOKER view checks base-table privileges as the invoking role; the amendment granted SELECT on the view to `ai_mode1_reader` but never granted SELECT on the 3 base tables the view reads from. Runtime reads would fail with permission errors despite RLS policies allowing them. Fix: added explicit `GRANT SELECT ON ai_mode1_conversation, ai_mode1_conversation_turn_result, ai_mode1_conversation_archival_event TO ai_mode1_reader` with documentation that RLS on base tables remains enforced via `current_tenant_id_strict()`. Previously POST-R4 (1 HIGH closed inline: `ai_mode1_conversation_turn_result` had two separate composite FKs `(tenant_id, turn_id, patient_id) → admission` + `(tenant_id, conversation_id, patient_id) → conversation` but neither proved that the admission's `conversation_id` matched the result's `conversation_id` — both FKs could pass while admission belonged to conversation A but result claimed conversation B for same tenant+patient. Result row would be valid + immutable + corrupt history attribution. Fix: composite UNIQUE `(tenant_id, id, conversation_id, patient_id)` on admission + single 4-column composite FK from result `(tenant_id, turn_id, conversation_id, patient_id) → admission(tenant_id, id, conversation_id, patient_id)` replaces the two separate FKs; conversation_id propagation conversation → admission → result is now fully closed. Previously POST-R3 (1 MED closed inline: §9 OQ1 said `tenant.ai_provider` update audit event should be registered in a separate amendment cycle — but the R1 MED-2 closure (v0.2) had already registered `ccr.ai_provider_updated` in this amendment + added it to the CHECK constraint + set it as the CCR schema field. Contradiction would have let implementers defer the dedicated Cat B PHI-provider audit. Fix: §9 OQ1 rewritten to CLOSED-AT-R1 with explicit "no separate amendment cycle required". Previously POST-R2 (2 HIGH closed inline: HIGH-1 patient FK references `patient(id)` instead of tenant-scoped `patient(tenant_id, id)` → same cross-tenant referential corruption class as R1 closure on conversation FK; fix: composite tenant-scoped patient FKs on conversation + turn_admission + turn_result. HIGH-2 turn_result.patient_id could diverge from admission/conversation's patient_id since FKs only covered (tenant_id, turn_id) not patient_id; fix: added composite UNIQUE (tenant_id, id, patient_id) on conversation + admission; composite FKs from admission `(tenant_id, conversation_id, patient_id)` to conversation + from result `(tenant_id, turn_id, patient_id)` to admission + `(tenant_id, conversation_id, patient_id)` to conversation; enforces patient identity propagation from conversation through admission through result. Previously POST-R1 (2 HIGH + 2 MED closed inline: HIGH-1 single-column FKs to tenant-scoped parents enabled cross-tenant referential corruption → composite tenant-scoped FKs on turn_admission + detector_result + turn_result with required composite UNIQUE constraints on parents; HIGH-2 crisis_server_signal_id had no FK to i019_enqueue_ack_log → added tenant-scoped composite FK (DEFERRABLE INITIALLY DEFERRED for ordering); MED-1 audit event taxonomy inconsistent (3+0+6 in scope text vs 3+1+5 in §3 table; sampling posture inconsistent across Cat C) → normalized to 11 total events (3 Cat A + 3 Cat B + 5 Cat C) with explicit sampling column for every Cat C; MED-2 CCR `tenant.ai_provider` referenced placeholder audit action → registered real Cat B `ccr.ai_provider_updated` event + updated CHECK constraint + CCR schema field)
**Authoring date:** 2026-05-21
**Trigger:** Promotion Ledger P-035 (AI Service Mode 1 Handler Spec v0.4 RATIFIED; Registry v2.21 → v2.22). Per the established post-P-029 spec-first promotion pattern, Mode 1's canonical content lands in CDM + AUDIT_EVENTS + DOMAIN_EVENTS + CCR_RUNTIME via a separate amendment cycle following SI ratification. **FIFTH instance** of the SI-spec-first promotion pattern (precedents: P-029 SI-021 → CDM v1.4→v1.5; P-032 SI-024.1 → CDM v1.5→v1.6; P-034 SI-019 → CDM v1.6→v1.7 + 4 surfaces; P-035 Mode 1 spec ratification → P-036 mechanical consolidation).
**Owner:** AI Service Lead + Clinical Lead (Mode 1 SI co-owners) + CDM owner + AUDIT_EVENTS owner + DOMAIN_EVENTS owner + CCR_RUNTIME owner.
**Parent SI:** Mode 1 Handler Spec v0.4 RATIFIED (`Telecheck_AI_Service_Mode_1_Handler_Spec_v0_1.md`); P-035 is the ratification authority for this amendment.
**Companion documents:** P-031 (SI-024.1 v0.8 JWT-binding canonical trust anchor); P-032 (CDM v1.6 session_jwt_admission + jwt_migration_entity_status); P-027 (Contracts Pack v5.2 → v5.3 + I-035 introduction); previous follow-on amendment patterns (`Telecheck_CDM_v1_4_to_v1_5_Amendment.md` P-029; `Telecheck_CDM_v1_5_to_v1_6_Amendment.md` P-032; `Telecheck_CDM_v1_6_to_v1_7_Amendment.md` P-034).

---

## 1. Purpose + scope

This amendment promotes the canonical content of Mode 1 Handler Spec v0.4 RATIFIED into:

- **CDM v1.7 → v1.8** (5 new entities + 1 derived view; all 5 entities strict append-only per I-035 + I-027). Post-P-042 cross-slice audit Finding 3 closure 2026-05-22: derived view is a PLAIN view (no `security_invoker` clause) per R7 HIGH-1 closure — see §2.NEW6 + §9 R7 entry. The "SECURITY INVOKER" descriptor that previously appeared here was stale prose from the pre-R7 design.
- **AUDIT_EVENTS v5.9 → v5.10** (R1 MED-1 closure 2026-05-21: normalized count): **11 new action IDs total** = 9 under `ai.mode1.*` namespace (**3 Cat A + 1 Cat B + 5 Cat C**) + 1 cross-cutting `audit.cat_c_drop_observed` Cat B aggregate emitted by audit-pipeline subsystem + 1 new `ccr.ai_provider_updated` Cat B (R1 MED-2 closure for CCR update event)
- **DOMAIN_EVENTS additive** (no version bump; 0 new event types — Mode 1 audit emission is via the canonical AUDIT_EVENTS path; cross-mode handoff is a Cat B audit event NOT a domain event)
- **CCR_RUNTIME v5.3 → v5.4** (1 new CCR key: `tenant.ai_provider` registered with allowed values + dual-control update path)

The amendment is **mechanical consolidation** of already-Codex-converged canonical content from Mode 1 Handler Spec v0.4 RATIFIED (8-round convergence; 10 HIGH + 6 MED + 0 hard-floor escalations closed; APPROVE at R8). Per the established post-P-029 spec-first pattern, the SI authoring + ratification cycle (P-035) closed the architectural questions including the R5-R7 fresh-review-post-major-cycles SI-024.1 alignment closures; this amendment is the canonical bundle landing.

**In scope:**

1. CDM v1.7 → v1.8 with 5 new entities + 1 derived view (continuing CDM numbering from v1.7's 84 active entities + 4 derived views; v1.8 target: 89 active entities + 5 derived views).
2. AUDIT_EVENTS v5.9 → v5.10 with **11 new action IDs** (3 Cat A + 3 Cat B + 5 Cat C) under `ai.mode1.*` (9 IDs) + `audit.*` (1 ID; pipeline-emitter) + `ccr.*` (1 ID; CCR-update-emitter per R1 MED-2 closure) namespaces.
3. DOMAIN_EVENTS additive: 0 new event types (Mode 1 events route entirely through canonical AUDIT_EVENTS path per the Sprint 9 design; no new tenant-scoped domain events introduced).
4. CCR_RUNTIME v5.3 → v5.4 with 1 new key `tenant.ai_provider` (string enum: `anthropic` | `aws_bedrock` | `azure_openai` | `null_local_dev`) + dual-control update path per I-015.
5. `jwt_migration_entity_status` seed population for all 5 new Mode 1 CDM v1.8 RLS-bearing entities (per SI-024.1 OQ8 mandatory seed step + the established post-P-034 R6 closure pattern).
6. RBAC additive: 1 new role `ai_mode1_view_owner` (non-BYPASSRLS owner role for the derived view per Mode 1 spec R7 HIGH-1 closure) + 1 new role `ai_mode1_reader` (read role for the view); both registered without RBAC version bump (additive only).

**Out of scope:**

- Mode 1 implementation in `telecheck-app` code repo (Phase A foundation).
- Mode 2 handler spec / canonical content (sister deliverable; covered by SI-016 ai_workflow_handler_registry separately).
- LLM provider procurement / BAA chain governance (Track 5 Infra).
- INVARIANTS bump (no new platform-floor invariants from Mode 1; all closures align with existing I-019 + I-023 + I-027 + I-035 + I-032 v5.3).
- OpenAPI v0.3 → v0.4 (Mode 1 endpoint is already enumerated in the canonical OpenAPI surface; no additional endpoint contracts beyond what the SI defined).

---

## 2. New CDM entities (5 active + 1 derived view; post-P-042 audit Finding 3 closure 2026-05-22 — "SECURITY INVOKER" descriptor replaced with plain "derived view"; the view is a plain PostgreSQL view per R7 HIGH-1 closure with explicit `current_tenant_id_strict('ai_mode1_conversation_state')` predicate in body + non-BYPASSRLS view-owner privileges for base-table reads)

All 5 active entities are **P1 patient-bound** entities (per SI-018 partition rule). All carry `tenant_id` per I-023 three-layer tenant isolation; all carry strict append-only triggers per I-035 invariant; all RLS policies use `current_tenant_id_strict('<entity_name>')` per the SI-024.1 v0.8 canonical pattern.

### §4.NEW1 — `ai_mode1_conversation` (CDM v1.8 new; Mode 1 spec §6.1 entity 1)

Conversation envelope; 1 row per conversation; durable identity; immutable post-INSERT.

```sql
CREATE TABLE ai_mode1_conversation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    patient_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ai_mode1_conversation_tenant_check CHECK (tenant_id IS NOT NULL),
    -- R2 HIGH-1 closure 2026-05-21: composite tenant-scoped patient FK (assumes canonical
    -- patient(tenant_id, id) UNIQUE constraint; if patient table doesn't yet have it,
    -- the implementation amendment adds it as a baseline prerequisite per the canonical
    -- tenant-isolation discipline).
    CONSTRAINT ai_mode1_conversation_patient_tenant_fk
        FOREIGN KEY (tenant_id, patient_id)
        REFERENCES patient(tenant_id, id),
    CONSTRAINT ai_mode1_conversation_tenant_id_unique UNIQUE (tenant_id, id),
    -- R2 HIGH-2 closure 2026-05-21: composite UNIQUE including patient_id enables downstream
    -- composite FKs from turn_admission + turn_result to enforce patient identity propagation.
    CONSTRAINT ai_mode1_conversation_tenant_id_patient_unique UNIQUE (tenant_id, id, patient_id)
);

ALTER TABLE ai_mode1_conversation ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_mode1_conversation FORCE ROW LEVEL SECURITY;
CREATE POLICY ai_mode1_conversation_tenant_isolation ON ai_mode1_conversation
    USING (tenant_id = current_tenant_id_strict('ai_mode1_conversation'));

CREATE TRIGGER ai_mode1_conversation_append_only
    BEFORE UPDATE OR DELETE ON ai_mode1_conversation
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
```

**Cross-references:** Mode 1 spec §6.1 entity 1; INVARIANTS §I-023/I-027/I-035; SI-018 partition rule (P1 patient-bound).

### §4.NEW2 — `ai_mode1_conversation_archival_event` (CDM v1.8 new; Mode 1 spec §6.1 entity 2)

Append-only archival event log; 1 row per archival event; composite tenant-scoped FK to `ai_mode1_conversation`.

```sql
CREATE TABLE ai_mode1_conversation_archival_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    conversation_id UUID NOT NULL,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived_by_user_id UUID NOT NULL,
    archival_reason TEXT NOT NULL CHECK (archival_reason IN (
        'patient_retention_policy', 'patient_request', 'tenant_disable'
    )),
    CONSTRAINT ai_mode1_conversation_archival_unique UNIQUE (conversation_id),
    CONSTRAINT ai_mode1_conversation_archival_tenant_fk
        FOREIGN KEY (tenant_id, conversation_id)
        REFERENCES ai_mode1_conversation(tenant_id, id)
);

ALTER TABLE ai_mode1_conversation_archival_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_mode1_conversation_archival_event FORCE ROW LEVEL SECURITY;
CREATE POLICY ai_mode1_conversation_archival_event_tenant_isolation
    ON ai_mode1_conversation_archival_event
    USING (tenant_id = current_tenant_id_strict('ai_mode1_conversation_archival_event'));

CREATE TRIGGER ai_mode1_conversation_archival_event_append_only
    BEFORE UPDATE OR DELETE ON ai_mode1_conversation_archival_event
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
```

**Cross-references:** Mode 1 spec §6.1 entity 2 + R4 MED-1 closure (composite FK enforces tenant_id matches conversation's tenant_id).

### §4.NEW3 — `ai_mode1_conversation_turn_admission` (CDM v1.8 new; Mode 1 spec §6.1 entity 3)

Immutable turn admission record; 1 row per turn at admission.

```sql
CREATE TABLE ai_mode1_conversation_turn_admission (
    id UUID PRIMARY KEY,                                      -- = turn_id (client-generated UUID; idempotency key)
    tenant_id tenant_id_t NOT NULL,
    conversation_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    user_message TEXT NOT NULL,                               -- KMS-encrypted at rest per I-026
    request_body_hash BYTEA NOT NULL,                         -- SHA-256 of canonicalized request body
    history_snapshot_high_water_mark TIMESTAMPTZ NOT NULL,
    conversation_history_window INT NOT NULL CHECK (conversation_history_window > 0 AND conversation_history_window <= 50),
    client_capabilities JSONB,
    admitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- R1 HIGH-1 closure 2026-05-21: composite tenant-scoped FK enforces tenant_id matches
    -- conversation's tenant_id.
    -- R2 HIGH-2 closure 2026-05-21: composite (tenant_id, conversation_id, patient_id) FK to
    -- conversation enforces patient_id propagates correctly from conversation row (preventing
    -- admission row claiming a different patient than the conversation it belongs to).
    CONSTRAINT ai_mode1_conversation_turn_admission_conversation_patient_fk
        FOREIGN KEY (tenant_id, conversation_id, patient_id)
        REFERENCES ai_mode1_conversation(tenant_id, id, patient_id),
    -- R2 HIGH-1 closure 2026-05-21: composite tenant-scoped patient FK
    CONSTRAINT ai_mode1_conversation_turn_admission_patient_tenant_fk
        FOREIGN KEY (tenant_id, patient_id)
        REFERENCES patient(tenant_id, id),
    CONSTRAINT ai_mode1_conversation_turn_admission_unique UNIQUE (tenant_id, conversation_id, id),
    -- Composite UNIQUE on (tenant_id, id) needed for downstream composite FKs from detector
    CONSTRAINT ai_mode1_conversation_turn_admission_tenant_id_unique UNIQUE (tenant_id, id),
    -- Composite UNIQUE including patient_id enables downstream turn_result composite FK
    CONSTRAINT ai_mode1_conversation_turn_admission_tenant_id_patient_unique UNIQUE (tenant_id, id, patient_id),
    -- R4 HIGH-1 closure 2026-05-21: composite UNIQUE including conversation_id + patient_id
    -- enables downstream turn_result FK enforcing conversation identity propagation from
    -- admission row through to result row (preventing result row binding turn to a different
    -- conversation for the same patient even when individual (tenant_id, turn_id) +
    -- (tenant_id, conversation_id) FKs would pass).
    CONSTRAINT ai_mode1_conversation_turn_admission_tenant_id_conv_patient_unique
        UNIQUE (tenant_id, id, conversation_id, patient_id)
);
CREATE INDEX ai_mode1_conversation_turn_admission_lookup_idx
    ON ai_mode1_conversation_turn_admission(tenant_id, conversation_id, admitted_at DESC);

ALTER TABLE ai_mode1_conversation_turn_admission ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_mode1_conversation_turn_admission FORCE ROW LEVEL SECURITY;
CREATE POLICY ai_mode1_conversation_turn_admission_tenant_isolation
    ON ai_mode1_conversation_turn_admission
    USING (tenant_id = current_tenant_id_strict('ai_mode1_conversation_turn_admission'));

CREATE TRIGGER ai_mode1_conversation_turn_admission_append_only
    BEFORE UPDATE OR DELETE ON ai_mode1_conversation_turn_admission
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
```

**Cross-references:** Mode 1 spec §6.1 entity 3 + §6.3 R1 MED-2 closure (history_snapshot_high_water_mark column for replay-safe concurrent retries).

### §4.NEW4 — `ai_mode1_conversation_turn_detector_result` (CDM v1.8 new; Mode 1 spec §6.1 entity 4)

Immutable detector result; 1 row per turn after detector completes; the existence of this row IS the canonical "detector_completed" state in the runtime state machine.

```sql
CREATE TABLE ai_mode1_conversation_turn_detector_result (
    turn_id UUID PRIMARY KEY,
    tenant_id tenant_id_t NOT NULL,
    detector_version TEXT NOT NULL,
    severity TEXT CHECK (severity IS NULL OR severity IN ('self_harm', 'imminent_harm', 'medical_emergency')),
    crisis_server_signal_id UUID,                             -- Set IFF severity NOT NULL; tenant-scoped FK to i019_enqueue_ack_log per R1 HIGH-2
    detector_latency_ms INT NOT NULL CHECK (detector_latency_ms >= 0),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- R1 HIGH-1 closure 2026-05-21: composite tenant-scoped FK to admission row
    CONSTRAINT ai_mode1_conversation_turn_detector_result_admission_fk
        FOREIGN KEY (tenant_id, turn_id)
        REFERENCES ai_mode1_conversation_turn_admission(tenant_id, id),
    -- R1 HIGH-2 closure 2026-05-21: tenant-scoped FK to i019_enqueue_ack_log when severity set
    -- (assumes i019_enqueue_ack_log has composite UNIQUE on (tenant_id, id) per existing canonical
    -- I-019 contract; if naming differs from i019_enqueue_ack_log, ratifier confirms canonical
    -- target table name + adjust FK accordingly).
    CONSTRAINT ai_mode1_conversation_turn_detector_result_signal_fk
        FOREIGN KEY (tenant_id, crisis_server_signal_id)
        REFERENCES i019_enqueue_ack_log(tenant_id, id)
        DEFERRABLE INITIALLY DEFERRED,
    -- crisis severity ↔ signal_id correlation invariant:
    CONSTRAINT ai_mode1_conversation_turn_detector_result_signal_iff_severity CHECK (
        (severity IS NULL AND crisis_server_signal_id IS NULL)
        OR (severity IS NOT NULL AND crisis_server_signal_id IS NOT NULL)
    )
);

ALTER TABLE ai_mode1_conversation_turn_detector_result ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_mode1_conversation_turn_detector_result FORCE ROW LEVEL SECURITY;
CREATE POLICY ai_mode1_conversation_turn_detector_result_tenant_isolation
    ON ai_mode1_conversation_turn_detector_result
    USING (tenant_id = current_tenant_id_strict('ai_mode1_conversation_turn_detector_result'));

CREATE TRIGGER ai_mode1_conversation_turn_detector_result_append_only
    BEFORE UPDATE OR DELETE ON ai_mode1_conversation_turn_detector_result
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
```

**Cross-references:** Mode 1 spec §6.1 entity 4 + §4.2 R1 HIGH-1 closure (runtime state-machine: existence of this row before llm.invoke()) + §4.4 R1 HIGH-3 closure (crisis_server_signal_id correlation to i019_enqueue_ack_log).

### §4.NEW5 — `ai_mode1_conversation_turn_result` (CDM v1.8 new; Mode 1 spec §6.1 entity 5)

Immutable turn result; 1 row per turn at completion or failure; the existence of this row IS the canonical terminal state.

```sql
CREATE TABLE ai_mode1_conversation_turn_result (
    turn_id UUID PRIMARY KEY,
    tenant_id tenant_id_t NOT NULL,
    conversation_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    -- R4 HIGH-1 closure 2026-05-21: replaced the two separate composite FKs with a single
    -- 4-column composite FK to admission that ALSO enforces conversation_id propagation
    -- (previous (tenant_id, turn_id, patient_id) FK + (tenant_id, conversation_id, patient_id)
    -- FK could both pass while admission's conversation differed from result's conversation;
    -- new single FK proves admission.id, admission.conversation_id, admission.patient_id all
    -- match the result row in one constraint). Patient_id propagation conversation→admission
    -- is enforced by admission's own FK to conversation (set at R2 HIGH-2 closure), so the
    -- chain conversation→admission→result is now fully closed.
    CONSTRAINT ai_mode1_conversation_turn_result_admission_full_fk
        FOREIGN KEY (tenant_id, turn_id, conversation_id, patient_id)
        REFERENCES ai_mode1_conversation_turn_admission(tenant_id, id, conversation_id, patient_id),
    -- R2 HIGH-1 closure 2026-05-21: composite tenant-scoped patient FK
    CONSTRAINT ai_mode1_conversation_turn_result_patient_tenant_fk
        FOREIGN KEY (tenant_id, patient_id)
        REFERENCES patient(tenant_id, id),
    assistant_message TEXT,                                   -- KMS-encrypted at rest per I-026; null IFF turn_outcome='failed'
    provider TEXT,                                            -- null IFF turn failed pre-LLM
    model_id TEXT,
    prompt_token_count INT CHECK (prompt_token_count IS NULL OR prompt_token_count >= 0),
    completion_token_count INT CHECK (completion_token_count IS NULL OR completion_token_count >= 0),
    total_latency_ms INT NOT NULL CHECK (total_latency_ms >= 0),
    turn_outcome TEXT NOT NULL CHECK (turn_outcome IN ('completed', 'failed')),
    failure_class TEXT CHECK (failure_class IS NULL OR failure_class IN (
        'llm_provider_unavailable', 'crisis_detector_unavailable',
        'internal_error', 'crisis_signal_enqueue_failed'
    )),
    failure_phase TEXT CHECK (failure_phase IS NULL OR failure_phase IN (
        'pre_detector', 'pre_llm', 'during_llm', 'post_llm'
    )),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Outcome ↔ failure correlation invariants
    CONSTRAINT ai_mode1_conversation_turn_result_completed_no_failure CHECK (
        (turn_outcome = 'completed' AND failure_class IS NULL AND failure_phase IS NULL AND assistant_message IS NOT NULL)
        OR
        (turn_outcome = 'failed' AND failure_class IS NOT NULL AND failure_phase IS NOT NULL AND assistant_message IS NULL)
    )
);
CREATE INDEX ai_mode1_conversation_turn_result_history_idx
    ON ai_mode1_conversation_turn_result(tenant_id, conversation_id, completed_at DESC);

ALTER TABLE ai_mode1_conversation_turn_result ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_mode1_conversation_turn_result FORCE ROW LEVEL SECURITY;
CREATE POLICY ai_mode1_conversation_turn_result_tenant_isolation
    ON ai_mode1_conversation_turn_result
    USING (tenant_id = current_tenant_id_strict('ai_mode1_conversation_turn_result'));

CREATE TRIGGER ai_mode1_conversation_turn_result_append_only
    BEFORE UPDATE OR DELETE ON ai_mode1_conversation_turn_result
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
```

**Cross-references:** Mode 1 spec §6.1 entity 5 + R2/R3/R4 closures (split-table model + append-only invariant + outcome correlation).

### §4.NEW6 — `ai_mode1_conversation_state` (CDM v1.8 new derived view; Mode 1 spec §6.1 view; R7 HIGH-1 closure)

SECURITY INVOKER derived view computing `last_turn_at` + `is_archived` + `archived_at` from base tables.

```sql
-- R7 HIGH-1 closure 2026-05-21: SECURITY INVOKER view forced invoking role to have
-- base-table privileges (R5 MED-1), but R6 + R7 showed that even column-level grants on base
-- tables let ai_mode1_reader bypass the view's data-minimization boundary and directly
-- enumerate per-turn timestamps + per-archival entries (rather than seeing only MAX(completed_at)
-- + EXISTS(archival)). Replaced security_invoker with **plain view (no security_invoker
-- clause)** owned by non-BYPASSRLS `ai_mode1_view_owner` which holds the base-table SELECT
-- grants; ai_mode1_reader has SELECT on the VIEW ONLY (no base-table access). Plain views
-- execute base-table queries with the OWNER's privileges. Tenant isolation is enforced
-- explicitly in the view body via `current_tenant_id_strict('ai_mode1_conversation_state')`
-- in the WHERE clause — this uses the CALLING SESSION's GUC (via the SI-024.1 JWT-binding
-- canonical helper), so the view sees only the calling session's tenant rows even though
-- base-table queries run with owner privileges. The Mode 1 spec's R7 HIGH-1 closure
-- specified security_invoker for tenant-binding correctness — this implementation cycle
-- supersedes that with the plain-view + explicit-WHERE pattern because the data-minimization
-- boundary on per-turn data is more critical than the security_invoker form per R7 finding.
CREATE VIEW ai_mode1_conversation_state AS
SELECT
    c.id AS conversation_id,
    c.tenant_id,
    c.patient_id,
    c.created_at,
    (SELECT MAX(r.completed_at) FROM ai_mode1_conversation_turn_result r
     WHERE r.tenant_id = c.tenant_id AND r.conversation_id = c.id) AS last_turn_at,
    EXISTS (SELECT 1 FROM ai_mode1_conversation_archival_event a
            WHERE a.tenant_id = c.tenant_id AND a.conversation_id = c.id) AS is_archived,
    (SELECT MAX(a.archived_at) FROM ai_mode1_conversation_archival_event a
     WHERE a.tenant_id = c.tenant_id AND a.conversation_id = c.id) AS archived_at
FROM ai_mode1_conversation c
WHERE c.tenant_id = current_tenant_id_strict('ai_mode1_conversation_state');

ALTER VIEW ai_mode1_conversation_state OWNER TO ai_mode1_view_owner;  -- non-BYPASSRLS role
REVOKE ALL ON ai_mode1_conversation_state FROM PUBLIC;
GRANT SELECT ON ai_mode1_conversation_state TO ai_mode1_reader;

-- Owner-only base-table grants (R7 HIGH-1 closure 2026-05-21): ai_mode1_view_owner needs full
-- SELECT on the 3 base tables to compute the view body; ai_mode1_reader has NO base-table
-- access (cannot bypass the view's aggregation). Owner has SELECT on the columns the view
-- actually reads; explicitly NOT granted to user_message + assistant_message + other
-- message-bearing columns even at the owner level — least-privilege all the way down.
GRANT SELECT (id, tenant_id, patient_id, created_at) ON ai_mode1_conversation TO ai_mode1_view_owner;
GRANT SELECT (tenant_id, conversation_id, completed_at) ON ai_mode1_conversation_turn_result TO ai_mode1_view_owner;
GRANT SELECT (tenant_id, conversation_id, archived_at) ON ai_mode1_conversation_archival_event TO ai_mode1_view_owner;
-- Defense-in-depth: ai_mode1_reader has SELECT on view ONLY. The view computes aggregates;
-- ai_mode1_reader sees: conversation_id, tenant_id, patient_id, created_at, last_turn_at
-- (MAX), is_archived (EXISTS), archived_at (MAX). ai_mode1_reader CANNOT enumerate
-- per-turn rows or per-archival rows directly; CANNOT see message-bearing columns; CANNOT
-- query base tables at all.
```

**Deployment prerequisite (per Mode 1 spec R7 HIGH-1 closure):** `ai_mode1_view_owner` role MUST be pre-existing at amendment-apply time + MUST NOT have BYPASSRLS attribute. Preflight assertion in §4.5 below.

**Cross-references:** Mode 1 spec §6.1 derived view + R7 HIGH-1 closure (post-R7 PLAIN VIEW with explicit `current_tenant_id_strict()` predicate + non-BYPASSRLS owner; Mode 1 spec's R7 HIGH-1 originally specified `security_invoker` but this CDM implementation R7 supersedes that with plain-view + explicit-WHERE form per the data-minimization-priority trade-off documented in §9 R7 entry; post-P-042 audit Finding 3 closure 2026-05-22 reconciled scope text + RBAC row to match the post-R7 design).

---

## 3. AUDIT_EVENTS v5.9 → v5.10 amendment

**11 new action IDs total** (R1 MED-1 + MED-2 closure 2026-05-21): 9 under `ai.mode1.*` (3 Cat A + 1 Cat B + 5 Cat C) + 1 under `audit.*` + 1 under `ccr.*`. Per Mode 1 spec §3.1 + §3.3 R1 HIGH-2 closure for partition routing.

**9 events under `ai.mode1.*` namespace:**

| # | Action ID | Category | Sampling | Partition | Source |
|---|---|---|---|---|---|
| 1 | `ai.mode1.turn_admitted` | Cat C | high-volume sampled | P1 keyed by patient_id | Mode 1 handler on every turn admission |
| 2 | `ai.mode1.crisis_detector_invoked` | Cat C | high-volume sampled | P1 keyed by patient_id | Mode 1 handler on crisis detector invocation |
| 3 | `ai.mode1.crisis_signal_emitted` | Cat A | not sampled | P1 keyed by patient_id | Mode 1 handler IFF I-019 detector fires; gating Cat A audit per Mode 1 spec §3.2 |
| 4 | `ai.mode1.llm_invoked` | Cat C | high-volume sampled | P1 keyed by patient_id | Mode 1 handler on LLM invocation (post-detector) |
| 5 | `ai.mode1.turn_completed` | Cat C | high-volume sampled | P1 keyed by patient_id | Mode 1 handler on successful turn completion |
| 6 | `ai.mode1.turn_failed` | Cat C | **not sampled** (low-volume per-failure; full retention) | P1 keyed by patient_id | Mode 1 handler IFF turn fails after admission |
| 7 | `ai.mode1.invariant_violation_detector_ordering` | Cat A | not sampled | P1 keyed by patient_id | Mode 1 handler IFF llm.invoke() attempted without detector_completed row (R1 HIGH-1 runtime invariant) |
| 8 | `ai.mode1.crisis_detector_failed` | Cat A | not sampled | P1 keyed by patient_id | Mode 1 handler IFF crisis detector unavailable / timeout |
| 9 | `ai.mode1.mode2_handoff_proposed` | Cat B | not sampled | P2 keyed by tenant_id | Mode 1 handler IFF LLM proposes Mode 2 invocation (handler refuses + emits this) |

**1 event under `audit.*` namespace** (aggregator-emitted, NOT Mode 1 handler):

| # | Action ID | Category | Sampling | Partition | Source |
|---|---|---|---|---|---|
| 10 | `audit.cat_c_drop_observed` | Cat B | not sampled (1 per tenant per minute aggregate) | P2 keyed by tenant_id | Audit pipeline aggregates Cat C drops per (tenant_id, minute_bucket); emits one row per minute-bucket at rollover |

**1 event under `ccr.*` namespace** (R1 MED-2 closure: real audit action for `tenant.ai_provider` updates, replacing the placeholder reference):

| # | Action ID | Category | Sampling | Partition | Source |
|---|---|---|---|---|---|
| 11 | `ccr.ai_provider_updated` | Cat B | not sampled | P2 keyed by tenant_id | Tenant-config admin endpoint on dual-control approval of `tenant.ai_provider` CCR key change (per I-015 dual-control + Mode 1 spec §7.1 PHI-provider enforcement) |

**Counts summary:** 3 Cat A + 3 Cat B + 5 Cat C = 11 total. Cat C sampling posture: 4 high-volume sampled (turn_admitted, crisis_detector_invoked, llm_invoked, turn_completed) + 1 not-sampled (turn_failed, low-volume per-failure for full retention).

**Audit-CHECK constraint amendment:** `audit_events.action_id CHECK` enumerates the 11 new action IDs:

```sql
ALTER TABLE audit_events DROP CONSTRAINT audit_events_action_id_check;
ALTER TABLE audit_events
    ADD CONSTRAINT audit_events_action_id_check CHECK (
        action_id IN (
            -- ... existing v5.9 enumeration preserved ...
            'ai.mode1.turn_admitted',
            'ai.mode1.crisis_detector_invoked',
            'ai.mode1.crisis_signal_emitted',
            'ai.mode1.llm_invoked',
            'ai.mode1.turn_completed',
            'ai.mode1.turn_failed',
            'ai.mode1.invariant_violation_detector_ordering',
            'ai.mode1.crisis_detector_failed',
            'ai.mode1.mode2_handoff_proposed',
            'audit.cat_c_drop_observed',
            'ccr.ai_provider_updated'
        )
    );
```

**Cross-references:** Mode 1 spec §3 + §11 (22 merge-blocking integration tests verify the audit event taxonomy at implementation time).

---

## 4. DOMAIN_EVENTS additive (no version bump)

**0 new event types.** Mode 1 audit emission routes entirely through the canonical AUDIT_EVENTS path; cross-mode handoff is a Cat B audit event (`ai.mode1.mode2_handoff_proposed`), NOT a domain event. The DOMAIN_EVENTS contract is unchanged by this amendment.

**Rationale (Mode 1 spec §3 + §5.2):** Mode 1 audit emission is the canonical observability surface; Mode 2 handoff is signaled via the canonical audit event for governance + ratifier review, not via a separate domain-event subscriber chain. Future Mode 2 ratification (SI-016 ai_workflow_handler_registry) may introduce mode2-specific domain events; those land at SI-016 ratification, not here.

---

## 5. CCR_RUNTIME v5.3 → v5.4 amendment

**1 new CCR key** under `tenant.*` namespace:

```yaml
tenant.ai_provider:
  type: string
  required: true
  allowed_values: [anthropic, aws_bedrock, azure_openai, null_local_dev]
  default: null_local_dev
  description: |
    Per-tenant LLM provider selection for AI Service Mode 1 + Mode 2.
    Mode 1 handler reads this CCR key to route to the correct LLM provider.
    Per Mode 1 spec §7.1 (PHI-provider enforcement):
      - HIPAA-covered tenants MUST be configured with anthropic OR aws_bedrock OR azure_openai
        (all three have signed BAA chains; null_local_dev is dev-only and rejects PHI tenants).
      - Static-analyzer rule TLC-AI-003 verifies the (tenant.has_phi, tenant.ai_provider) tuple at
        PR open; runtime enforcement: tenant-config admission rejects PHI-flagged tenants with
        null_local_dev with Cat A tenant_config.phi_provider_violation audit (per Mode 1 spec
        §7.1 + test M1.17).
  dual_control_update: true
  update_audit_action: ccr.ai_provider_updated  # R1 MED-2 closure 2026-05-21: real Cat B audit event registered in §3 (replaces placeholder reference to medication_interaction.engine_knowledge_base_updated which was a known stale reference)
```

**Cross-references:** Mode 1 spec §7.1 + I-015 (dual-control for tenant-config keys affecting PHI handling) + ADR-029 WORKLOAD_TAXONOMY (LLM provider selection per workload class).

**R1 MED-2 closure 2026-05-21:** the `update_audit_action` field now points to the canonical `ccr.ai_provider_updated` Cat B P2 audit event registered in §3 above. No more placeholder reference; PHI-provider configuration changes are audited under a dedicated event suitable for governance + ratifier review.

---

## 6. RBAC additive (no version bump)

**2 new RBAC roles** registered (additive; no v1.2 → v1.3 bump since the roles are scoped to Mode 1 derived-view access):

| Role | Purpose | Granted to |
|---|---|---|
| `ai_mode1_view_owner` | Owns the `ai_mode1_conversation_state` derived view (non-BYPASSRLS per R7 HIGH-1) | Created by migration; not granted to humans; held by service-account-owner pattern |
| `ai_mode1_reader` | Read access to `ai_mode1_conversation_state` view via plain-view + view-owner privileges; tenant isolation enforced explicitly inside the view body via `current_tenant_id_strict('ai_mode1_conversation_state')` per the post-R7 design. **Post-P-042 audit Finding 3 closure 2026-05-22 — "SECURITY INVOKER semantics" descriptor REMOVED; the post-R7 design uses a plain view (no security_invoker clause). `ai_mode1_reader` has SELECT on the VIEW ONLY — cannot query base tables directly + cannot bypass aggregation + cannot see message-bearing columns even indirectly.** | Mode 1 service account; clinician dashboard role; pharmacy portal role; admin role |

**Preflight assertion (per Mode 1 spec R7 HIGH-1 closure):**

```sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ai_mode1_view_owner') THEN
        RAISE EXCEPTION 'ai_mode1_view_owner role missing (required for Mode 1 derived view ownership per the post-R7 plain-view design: view-owner-privileged base-table reads + explicit current_tenant_id_strict() predicate in view body; post-P-042 audit Finding 3 closure 2026-05-22 — "security_invoker discipline" descriptor REMOVED to match post-R7 design)'
            USING ERRCODE = 'undefined_object';
    END IF;
    IF (SELECT rolbypassrls FROM pg_roles WHERE rolname = 'ai_mode1_view_owner') THEN
        RAISE EXCEPTION 'ai_mode1_view_owner has BYPASSRLS attribute; must be revoked before view ownership assignment per R7 HIGH-1 closure'
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ai_mode1_reader') THEN
        RAISE EXCEPTION 'ai_mode1_reader role missing (required for Mode 1 derived view SELECT grants)'
            USING ERRCODE = 'undefined_object';
    END IF;
END $$;
```

---

## 7. `jwt_migration_entity_status` seed scope (R5 HIGH-2 closure pattern from P-034 + Mode 1 spec R5 HIGH-2; **post-P-036 cross-slice consistency fix 2026-05-22 — Evans Option A**: extended seed scope from 5 → 6 entries to include `ai_mode1_conversation_state` view per the post-R7 plain-view design, matching the canonical pattern from SI-020 P-038 (9 entries / 2 views), SI-022 P-040 (5 entries / 2 views), SI-023 P-042 (7 entries / 3 views) — Mode 1 is no longer the outlier omitting its tenant-scoped view from migration tracking)

**Seed 6 entity names** at amendment-apply time with `phase_4_cutover_eligible=FALSE` AND `raw_guc_fallback_audited=TRUE` defaults (Phase B fail-closed-with-audit posture):

```sql
INSERT INTO jwt_migration_entity_status (entity_name, phase_4_cutover_eligible, raw_guc_fallback_audited)
VALUES
    ('ai_mode1_conversation',                          FALSE, TRUE),
    ('ai_mode1_conversation_archival_event',           FALSE, TRUE),
    ('ai_mode1_conversation_turn_admission',           FALSE, TRUE),
    ('ai_mode1_conversation_turn_detector_result',     FALSE, TRUE),
    ('ai_mode1_conversation_turn_result',              FALSE, TRUE),
    ('ai_mode1_conversation_state',                    FALSE, TRUE);  -- post-P-036 cross-slice fix 2026-05-22 (Evans Option A): view is no longer security_invoker after R7 closure; uses current_tenant_id_strict('ai_mode1_conversation_state') predicate in body; tenant-scoped read surface tracked under migration scope per other-slice canonical pattern (P-038/P-040/P-042 all seed their tenant-scoped views)
```

**cdm_owner sequencing guidance:** flip per-entity `phase_4_cutover_eligible=TRUE` as middleware migration to JWT-required posture completes. The `ai_mode1_conversation_state` view was historically NOT seeded because pre-R7 it was a `security_invoker` view that inherited RLS from base tables (no view-side tenant-binding to migrate). The R7 HIGH-1 closure replaced it with a plain view whose body explicitly calls `current_tenant_id_strict('ai_mode1_conversation_state')` — making the view itself a tenant-binding surface that should be tracked. The post-P-036 cross-slice consistency fix (Evans Option A 2026-05-22) brings Mode 1 into alignment with the other 4 pilot slices that all track their tenant-scoped views. **Post-P-042 cross-slice audit Finding 3 closure 2026-05-22**: stale `security_invoker` references in §1 in-scope item 5 + §2 header + §7 RBAC table row for `ai_mode1_reader` + Cross-references prose + §8 preflight error message have all been scrubbed to match the post-R7 plain-view design (audit Finding 3 closed via hygiene cycle Phase 1; historical R5 MED-1 + R7 cycle-log entries preserved unchanged in §9 as documentation of the closure path).

**Cross-reference:** SI-024.1 v0.8 §Sub-decision 9 (Phase B fallback gate); CDM v1.6 §4.NEW5 (jwt_migration_entity_status entity); P-034 R6 closure precedent (extended seed scope to include MV/view trust-anchor surfaces); P-038 §3 (9-entry seed scope including 2 views); P-040 §1 in-scope item 6 (5-entry seed scope including 2 views); P-042 §7 (7-entry seed scope including 3 views).

---

## 8. Cross-SI alignment

| Cross-SI surface | This amendment's surface | Relationship |
|---|---|---|
| AI Service Mode 1 Handler Spec v0.4 RATIFIED (P-035) | §2.NEW1-NEW6 + §3 + §5 + §6 + §7 | This amendment IS the CDM/AUDIT/CCR consolidation of Mode 1 spec v0.4 |
| SI-024.1 v0.8 JWT-binding (P-031) + CDM v1.6 jwt_migration_entity_status (P-032) | §2.NEW1-NEW5 RLS policies use `current_tenant_id_strict()`; §7 seed scope | All 5 new entities use the canonical JWT-binding trust anchor; seed scope per SI-024.1 OQ8 |
| I-035 append-only invariant (P-027 Contracts Pack v5.3) | All 5 new entities + the derived view | The 5-table split-INSERT-only model + `enforce_append_only()` trigger aligns with I-035 |
| I-019 crisis-detection always-on platform floor | §3 Cat A `ai.mode1.crisis_signal_emitted` + `ai.mode1.crisis_detector_failed` + `ai.mode1.invariant_violation_detector_ordering` | Mode 1's canonical implementation of I-019 |
| SI-018 two-tier hybrid audit-chain partition | §3 partition column per event ID (P1 patient-bound vs P2 tenant-bound) | Mode 1 emits both P1 + P2 events per the canonical partition rule |
| ADR-029 AI workload taxonomy + Contracts Pack v5.3 WORKLOAD_TAXONOMY + AUTONOMY_LEVELS | §5 CCR_RUNTIME `tenant.ai_provider` key + §1 Mode 1 = conversational-assistant workload class L1 | Mode 1 + Mode 2 distinction is the canonical ADR-029 split |
| ADR-002 two-mode AI architecture | §3 Cat B `ai.mode1.mode2_handoff_proposed` audit event | Mode 1 MUST NOT invoke Mode 2 handlers directly; handoff proposed via audit event for clinician review |
| INVARIANTS bump | **NOT in this amendment** | No new platform-floor invariants; all Mode 1 spec closures align with existing I-019 + I-023 + I-027 + I-032 v5.3 + I-035 |

---

## 9. Open questions for ratifier (own ceremony)

1. **~~OQ1 — `tenant.ai_provider` update audit event~~ CLOSED at v0.2 R1 MED-2 (2026-05-21) + reaffirmed at R3 MED-1 (2026-05-21):** the audit event `ccr.ai_provider_updated` (Cat B P2) is registered in this amendment §3 (11th new action ID) + added to the `audit_events_action_id_check` constraint + set as the `update_audit_action` field on the `tenant.ai_provider` CCR key in §5. **No separate amendment cycle required** — earlier OQ text contradicting §3 + §5 has been removed.
2. **OQ2 — Codex pre-ratification target.** Recommendation: 5-8 rounds + ship-it verification. Mechanical consolidation cycle; Mode 1 spec v0.4 already converged the underlying schemas + policies + audit taxonomy; this amendment's defect surface is bundle-file-coherence + cross-artifact consistency + new role-grant chain.

---

## 10. Codex pre-ratification status

**v0.1 DRAFT 2026-05-21:** pre-Codex-review.

**v0.2 DRAFT 2026-05-21 — R1 closures applied (2 HIGH + 2 MED):**
- **R1 HIGH-1 closed:** §2.NEW3 + §2.NEW4 + §2.NEW5 used single-column FKs to tenant-scoped parents (`ai_mode1_conversation_turn_admission.conversation_id REFERENCES ai_mode1_conversation(id)`; detector + result tables similarly). Tenant-id-not-in-FK enabled cross-tenant referential corruption (child row claims tenant_id different from parent row's tenant_id). Fix: composite tenant-scoped FKs on all 3 child tables (`(tenant_id, conversation_id) REFERENCES ai_mode1_conversation(tenant_id, id)`; `(tenant_id, turn_id) REFERENCES ai_mode1_conversation_turn_admission(tenant_id, id)`) + composite UNIQUE constraints on parents required for the FK references.
- **R1 HIGH-2 closed:** `crisis_server_signal_id` documented as referencing `i019_enqueue_ack_log` but the DDL only had CHECK nullability correlation — no FK declared. Rows could claim arbitrary UUID, breaking the I-019 forensic anchor. Fix: added `ai_mode1_conversation_turn_detector_result_signal_fk` composite tenant-scoped FK to `i019_enqueue_ack_log(tenant_id, id)`; DEFERRABLE INITIALLY DEFERRED for INSERT-ordering (signal row written first then detector_result row references it within same transaction).
- **R1 MED-1 closed:** Audit event count/category contract inconsistent across §1 + §3. Scope text said "9 + 1 = 10" with "3 Cat A + 0 Cat B + 6 Cat C"; §3 table actually had 9 `ai.mode1.*` events including 1 Cat B (`mode2_handoff_proposed`) + 1 `audit.*` Cat B = 10 total with 3 Cat A + 2 Cat B + 5 Cat C. Sampling posture ambiguous (5 of 6 Cat C marked sampled in §3.1 spec but uniformly listed without distinction in §3 table). Fix: normalized to **11 new action IDs total** (added `ccr.ai_provider_updated` per MED-2; now 3 Cat A + 3 Cat B + 5 Cat C) with explicit per-event Sampling column (4 Cat C high-volume sampled + 1 Cat C not-sampled-low-volume-per-failure + all Cat A/Cat B not-sampled); aligned §1 scope text + §3 tables + CHECK constraint enumeration.
- **R1 MED-2 closed:** §5 `tenant.ai_provider` CCR key referenced `medication_interaction.engine_knowledge_base_updated` as `update_audit_action` — explicit placeholder defeats governance/audit classification for high-risk PHI-provider configuration changes. Fix: registered real `ccr.ai_provider_updated` Cat B P2 audit event in §3 (11th new action ID); added to CHECK constraint; updated §5 CCR schema field to point to the new canonical action.

Authored on `spec/cdm-v1-8-audit-v5-10-ccr-v5-4-mode-1-followon-2026-05-21` branch off main at `9a1fcd2` (post-P-035 + Addendum 63). v0.2 commit `cba5266`. v0.3 commit `318c37a`. v0.4 commit `c473030`. v0.5 commit `fcd239b`. v0.6 commit `c06bb32`. v0.7 commit `d80c249`. v0.8 commit pending push for R8 ship-it verification.

**v0.8 DRAFT 2026-05-21 — R7 closure applied (1 HIGH):**
- **R7 HIGH-1 closed:** R6's column-level grants to `ai_mode1_reader` on base tables still permitted direct base-table queries — dashboard/portal/admin roles could enumerate ALL per-turn timestamps + per-archival entries rather than seeing only the view's MAX(completed_at) + EXISTS(archival) aggregates. Per-turn timestamps reveal patient-bound interaction history (clinical concern beyond message-content protection). Fix: replaced `WITH (security_invoker = true)` view with plain view (no security_invoker clause) + base-table grants moved to `ai_mode1_view_owner` (non-BYPASSRLS) instead of `ai_mode1_reader` + explicit `WHERE c.tenant_id = current_tenant_id_strict('ai_mode1_conversation_state')` in view body for tenant enforcement (uses calling session's GUC via SI-024.1 JWT-binding canonical helper, even though base-table queries run under owner's privileges). `ai_mode1_reader` has SELECT on the VIEW ONLY — cannot query base tables directly; cannot bypass aggregation; cannot see message-bearing columns even indirectly. The Mode 1 spec's R7 HIGH-1 closure specified security_invoker form for tenant-binding correctness; this implementation cycle's R7 supersedes it with the plain-view + explicit-WHERE form because data-minimization boundary on per-turn data is more critical than the security_invoker form per Codex R7 finding. Trust chain documented inline in §2.NEW6.

**v0.7 DRAFT 2026-05-21 — R6 closure applied (1 HIGH):**
- **R6 HIGH-1 closed:** R5's broad table-level `GRANT SELECT ON <table> TO ai_mode1_reader` overexposed raw conversation content. `ai_mode1_reader` is granted to clinician dashboard, pharmacy portal, admin roles per §6 RBAC table — those principals would bypass the narrow state view and query base tables directly, including PHI-bearing `user_message` (on `turn_admission`) and `assistant_message` (on `turn_result`). RLS enforces tenant scope but not intra-tenant role-based column-level overexposure. Fix: replaced broad table-level SELECT with column-level least-privilege grants matching exactly the view's SELECT list — `GRANT SELECT (id, tenant_id, patient_id, created_at) ON ai_mode1_conversation`; `GRANT SELECT (tenant_id, conversation_id, completed_at) ON ai_mode1_conversation_turn_result`; `GRANT SELECT (tenant_id, conversation_id, archived_at) ON ai_mode1_conversation_archival_event`. `ai_mode1_reader` cannot read raw message content via direct base-table access; that access requires separate roles (Mode 1 service account, audit tooling) granted explicitly out of scope for this amendment.

**v0.6 DRAFT 2026-05-21 — R5 closure applied (1 MED):**
- **R5 MED-1 closed:** SECURITY INVOKER view discipline incomplete — `ai_mode1_conversation_state` was declared `WITH (security_invoker = true)` per the Mode 1 spec R7 HIGH-1 closure (RLS evaluates against calling role not view owner), but the grant chain only granted SELECT on the view to `ai_mode1_reader`. PostgreSQL security-invoker views check base-table privileges as the invoking role, so reads via the view would fail with permission errors despite RLS allowing them. Fix: added `GRANT SELECT ON ai_mode1_conversation`, `ai_mode1_conversation_turn_result`, `ai_mode1_conversation_archival_event TO ai_mode1_reader` (the 3 base tables the view reads from); RLS on the base tables remains the canonical tenant-isolation enforcement layer.

**v0.5 DRAFT 2026-05-21 — R4 closure applied (1 HIGH):**
- **R4 HIGH-1 closed:** `ai_mode1_conversation_turn_result` had two separate composite FKs `(tenant_id, turn_id, patient_id) → admission` + `(tenant_id, conversation_id, patient_id) → conversation` — but neither proved that the admission's `conversation_id` matched the result's `conversation_id`. Both FKs could pass while admission belonged to conversation A but result claimed conversation B for the same tenant+patient. Append-only terminal row would be valid + immutable + corrupt the derived-history attribution. Fix: added composite UNIQUE `(tenant_id, id, conversation_id, patient_id)` on `ai_mode1_conversation_turn_admission` + replaced result's two separate FKs with a single 4-column composite FK `(tenant_id, turn_id, conversation_id, patient_id) → admission(tenant_id, id, conversation_id, patient_id)`. Conversation_id propagation through conversation → admission → result is now fully closed; patient_id propagation enforced by admission's existing FK to conversation. Same pattern as R2 HIGH-2 closure (patient identity propagation) but on the conversation axis.

**v0.4 DRAFT 2026-05-21 — R3 closure applied (1 MED):**
- **R3 MED-1 closed:** §9 OQ1 was internally inconsistent with §3 + §5 — said `tenant.ai_provider` audit event should be registered in a SEPARATE amendment cycle while §3 already enumerated `ccr.ai_provider_updated` + §5 already pointed to it as `update_audit_action`. Risk: implementers reading §9 first could defer the PHI-provider update audit event, creating version-skew in a high-risk path. Fix: rewrote OQ1 to CLOSED-AT-R1 status with explicit "no separate amendment cycle required" + cross-reference to §3 + §5.

**v0.3 DRAFT 2026-05-21 — R2 closures applied (2 HIGH):**
- **R2 HIGH-1 closed:** Patient FK references were `patient(id)` not `patient(tenant_id, id)` on `ai_mode1_conversation`, `ai_mode1_conversation_turn_admission`, `ai_mode1_conversation_turn_result` — same cross-tenant referential corruption class as the R1 conversation-FK closure but on the clinical identity anchor. Fix: added composite tenant-scoped patient FK `FOREIGN KEY (tenant_id, patient_id) REFERENCES patient(tenant_id, id)` on all 3 tables that carry patient_id; assumes canonical `patient(tenant_id, id)` UNIQUE constraint exists (if not, baseline DDL prerequisite for the implementation amendment).
- **R2 HIGH-2 closed:** `ai_mode1_conversation_turn_result.patient_id` could diverge from `ai_mode1_conversation_turn_admission.patient_id` or `ai_mode1_conversation.patient_id` since the existing tenant-scoped FKs only covered `(tenant_id, turn_id)` + `(tenant_id, conversation_id)` — patient_id was independently mutable per row, corrupting the P1 audit/history surface (terminal row could claim different patient than the admitted turn / parent conversation). Fix: added composite UNIQUE `(tenant_id, id, patient_id)` on both `ai_mode1_conversation` + `ai_mode1_conversation_turn_admission` + composite FK `(tenant_id, conversation_id, patient_id) → conversation(tenant_id, id, patient_id)` on admission + composite FKs `(tenant_id, turn_id, patient_id) → admission(tenant_id, id, patient_id)` + `(tenant_id, conversation_id, patient_id) → conversation(tenant_id, id, patient_id)` on result. Patient identity now propagates correctly through conversation → admission → result; mismatches are rejected at FK-constraint-evaluation time.

---

— Claude (Opus 4.7, 1M context), CDM v1.7 → v1.8 + AUDIT_EVENTS v5.9 → v5.10 + DOMAIN_EVENTS additive + CCR_RUNTIME v5.3 → v5.4 Mode 1 Handler Spec follow-on amendment v0.1 DRAFT authored 2026-05-21 per P-035 OQ canonical decision + established post-P-029 SI-spec-first promotion pattern (FIFTH instance after P-029, P-032, P-034) + CLAUDE.md two-pass discipline + auto-proceed rule. R1 Codex review queued.
