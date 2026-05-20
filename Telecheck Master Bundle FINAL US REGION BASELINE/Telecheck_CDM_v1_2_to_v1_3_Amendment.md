# Canonical Data Model v1.2 → v1.3 Batched Amendment (Phase B)

**Version:** 1.3 amendment v0.1 (canonical-pending physical body merge per v1.10.1 hygiene-cycle precedent)
**Status:** RATIFIED 2026-05-20 via Promotion Ledger P-027 (Phase B batched-promotion ceremony per OQ2 Path B1; Sprint 20 Master Completion Plan v1.1 §3 Phase B exit gate)
**Owner:** CDM owner + Engineering Lead + ratifier-quorum
**Parent document:** `Telecheck_Canonical_Data_Model_v1_2.md` (existing canonical)
**Companion documents:** Sprint 8 SI-017 (session_state); Sprint 9 (ai_mode1_conversation entities); Sprint 12 (ai_mode2_* entities); Sprint 13 KMS Architecture (kms_dek_keyring); Sprint 14 (consent_revocation_event + consent_domain_event_*); Sprint 16 (notification_crisis_*); Sprint 17 (synthetic_canary + kms_residency_dr_override); Sprint 18 RBAC (iam_principal_human_binding + operator_active_mode_lease + hsm_signer_binding); Sprint 20 Master Completion Plan v1.1 §3 Phase B; Promotion Ledger P-026 + P-027.

---

## 1. Purpose + scope

This amendment integrates **23 new canonical entities + 3 derived views** introduced across Sprints 8-18 of the autonomous 24h-loop work cycle into the canonical Telecheck Canonical Data Model. Per OQ2 Path B1 (batched promotion per ratifier ceremony 2026-05-20), all 23 entities + 3 views land in a single CDM v1.2 → v1.3 promotion (vs incremental per-SI promotions).

**v1.2 baseline:** 48 active canonical entities + 7 reserved-future (per Master PRD v1.10 §10).
**v1.3 target:** 71 active canonical entities + 7 reserved-future + 3 derived views.

Entities are organized by source Sprint + section number (§4.49 through §4.71 in CDM body; numbering continues from §4.48 v1.2 baseline).

---

## 2. New entities by Sprint

### §4.49 — `session_state` (Sprint 8 SI-017; SI-022 candidate)

Canonical session-liveness state per Sprint 8 SI-017 §3.7 (JWT session-liveness check + middleware-GUC binding + Sub-decision 4.5 mismatch path).

```sql
CREATE TABLE session_state (
    session_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    tenant_id tenant_id_t NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    mode_version BIGINT NOT NULL DEFAULT 1,                -- Per Sprint 18 RBAC v1.2 Inv-3 closure
    revocation_reason TEXT,                                -- e.g., 'user_logout', 'admin_force', 'jwt_tenant_id_mismatch'
    CONSTRAINT session_state_tenant_check CHECK (tenant_id IS NOT NULL)
);

CREATE INDEX session_state_user_lookup_idx ON session_state(tenant_id, user_id) WHERE revoked_at IS NULL;
CREATE INDEX session_state_expires_idx ON session_state(expires_at) WHERE revoked_at IS NULL;
```

RLS: `tenant_id = current_setting('app.tenant_id')`. KMS encryption per I-026 on user-bound fields not needed (session_id is opaque, no PHI).

### §4.50-§4.54 — AI Mode 1 conversation entities (Sprint 9; SI-023 candidate)

Split-table immutable lifecycle per Sprint 9 §6.1 R3 HIGH-1 closure. Five tables + one view; all INSERT-only enforced by `enforce_append_only()` trigger.

- **§4.50 `ai_mode1_conversation`** (envelope; INSERT once at conversation creation)
- **§4.51 `ai_mode1_conversation_archival_event`** (append-only archival events)
- **§4.52 `ai_mode1_conversation_turn_admission`** (immutable admission record per turn)
- **§4.53 `ai_mode1_conversation_turn_detector_result`** (immutable detector result per turn)
- **§4.54 `ai_mode1_conversation_turn_result`** (immutable result record per turn)
- **View `ai_mode1_conversation_state`** (derived: last_turn_at + is_archived + archived_at)

Schema details: see canonical `Telecheck_AI_Service_Mode_1_Handler_Spec_v1_0.md` §6.1.

### §4.55-§4.59 — AI Mode 2 protocol-execution entities (Sprint 12)

Per Sprint 12 §6.3 split state machine + per-attempt provider tracking.

- **§4.55 `ai_mode2_invocation`** (per-invocation record; carries dispatch_obligation_state + handler_resolution + governance_gate_decision_event_id)
- **§4.56 `ai_workflow_handler_registry`** (per OQ-A Option C: event-sourced + materialized projection; see canonical `Telecheck_SI_016_AI_Workflow_Handler_Registry_v1_0.md`)
- **§4.57 `ai_workflow_executions`** (per Sprint 3 SI-016 + Sprint 12 §3.1; BEFORE INSERT trigger validates handler_tenant_id eligibility per OQ-B P-018b cross-SI scope)
- **§4.58 `ai_mode2_pending_token`** (per Sprint 12 §7.2 R1 MED-2 closure: hashed-at-rest + single-use + multi-bound)
- **§4.59 `ai_mode2_workflow_state_transition`** (append-only state transition log per Sprint 12 §2.5 invocation state machine)

### §4.60 — `kms_dek_keyring` (Sprint 13 §6.4 R1 MED-1 closure: versioned DEK reads)

Per Sprint 13 §6.4 append-only keyring + 90-day post-retirement retention.

```sql
CREATE TABLE kms_dek_keyring (
    tenant_id tenant_id_t NOT NULL,
    data_class TEXT NOT NULL,                              -- 'pii_demographic' | 'pii_clinical' | 'pii_sensitive_clinical' | 'pii_financial' | 'pii_conversation' | 'pii_audit_payload' | 'pii_research_consented'
    dek_version_id UUID NOT NULL,
    encrypted_dek_blob BYTEA NOT NULL,                     -- DEK encrypted under tenant CMK
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    retired_at TIMESTAMPTZ,                                -- Set when rotation completes + verification passes
    purged_at TIMESTAMPTZ,                                 -- Set 90+ days post-retired_at when DEK is removed from keyring
    PRIMARY KEY (tenant_id, data_class, dek_version_id)
);
```

Plus per-PHI-row `dek_version_id` column added across CDM v1.2 PHI tables (rolling migration; see Sprint 13 §6.4 implementation note).

### §4.61 — `kms_residency_dr_override` (Sprint 13 §8.3 R1 MED-2 closure)

Structured regulatory-decision record for us_only residency policy DR overrides per ADR-026 + ADR-028.

Schema: see canonical `Telecheck_KMS_Architecture_Spec_v1_0.md` §8.3.

### §4.62-§4.65 — Consent v1.1 entities (Sprint 14)

Per Sprint 14 §3 SD1 + SD2 R1 HIGH-1 + HIGH-2 closures.

- **§4.62 `consent_revocation_event`** (append-only event table; epoch-versioned revocation per R1 HIGH-1)
- **§4.63 `consent_domain_event_outbox`** (event log with monotonic event_sequence_no)
- **§4.64 `consent_domain_event_delivery`** (per-subscriber delivery ledger per R1 HIGH-2)
- **§4.65 `consent_domain_event_subscriber`** (declarative subscriber registry per OQ-J)
- **View `consent_research_active`** (derived: most-recent active tier-6 consent per (tenant_id, patient_id))

Schema details: see canonical `Telecheck_Consent_Delegated_Access_Slice_PRD_v1_1.md` §3.

### §4.66-§4.68 — Notification crisis-dispatch entities (Sprint 16)

Per Sprint 16 R1 HIGH-1 + HIGH-3 + R2 + R3 closures.

- **§4.66 `notification_crisis_dispatch_ledger`** (channel-scoped obligation; UNIQUE on (tenant_id, patient_id, server_signal_id, channel))
- **§4.67 `notification_crisis_provider_attempt`** (per-attempt detail; R2 HIGH closure)
- **§4.68 `notification_crisis_escalation_obligation`** (persisted undeliverable_deadline + escalation_key per R1 HIGH-3)

Schema details: see canonical `Telecheck_Notification_Spec_v1_2.md` §3.

### §4.69 — `synthetic_canary` (Sprint 17 §7.4 P-19 R2 MED-1 closure)

Per Sprint 17 R2 MED-1 closure: dedicated synthetic-only table for cross-tenant data-mixing canary.

```sql
CREATE TABLE synthetic_canary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    synthetic_subject_id TEXT NOT NULL,                    -- SYNTH- UUID prefix; separate ID space from real patient_id
    canary_marker_value TEXT NOT NULL,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,                       -- 30 minutes post-insert; cleanup worker drains expired
    is_canary BOOLEAN NOT NULL DEFAULT true CHECK (is_canary = true),
    CONSTRAINT synthetic_canary_subject_prefix CHECK (synthetic_subject_id LIKE 'SYNTH-%')
);

CREATE INDEX synthetic_canary_expires_idx ON synthetic_canary(expires_at);
```

Static-analyzer rule TLC-OPS-001 forbids reads from this table outside the canary-monitor service.

### §4.70-§4.72 — RBAC v1.2 entities (Sprint 18)

Per Sprint 18 R1 HIGH-1 + HIGH-2 + R3 HIGH closures.

- **§4.70 `iam_principal_human_binding`** (canonical IAM principal → human_id binding for cross-role SoD enforcement)
- **§4.71 `operator_active_mode_lease`** (server-side single-active-mode lease with monotonic mode_version)
- **§4.72 `hsm_signer_binding`** (normalized HSM signer membership; supports COUNT(DISTINCT stakeholder_role_bucket) ≤ 1 per human_id invariant)

Schema details: see canonical `Telecheck_RBAC_Permissions_Matrix_v1_2.md` §4.

---

## 3. Updated cross-entity invariants (CDM-level enforcement)

The following invariants gain CDM-level enforcement via DB constraints + triggers in v1.3:

- **All v1.3-new PHI-bearing entities** carry the canonical `tenant_id tenant_id_t NOT NULL` + RLS policy `tenant_id = current_setting('app.tenant_id')` per ADR-023 Model A.
- **All append-only v1.3-new entities** carry the `enforce_append_only()` BEFORE UPDATE OR DELETE trigger per Sprint 9 §6.2 R4 HIGH-1 closure (canonical I-027 enforcement).
- **Composite FK pattern** (R4 MED-1 closure from Sprint 9): wherever a child table references a parent table by `(parent_id)`, the canonical pattern is composite `(tenant_id, parent_id)` FK referencing parent's composite UNIQUE `(tenant_id, id)`.
- **Per-PHI-row `dek_version_id` column** added to all CDM v1.2 PHI tables (rolling migration) per Sprint 13 §6.4 versioned-read semantics.

---

## 4. Reserved-future bumps

The 7 reserved-future entities from CDM v1.2 §4 inventory remain reserved at v1.3 (no changes). Total active count: 48 → 71 (+23).

---

## 5. Cross-references

- **Promotion Ledger P-027** — canonical ratification authority for this CDM v1.2 → v1.3 promotion.
- **Sprint 20 Master Completion Plan v1.1 §3 Phase B** — gating criteria + Path B1 (batched) selection rationale.
- Each new entity's source-Sprint spec is the authoritative source for column shapes, constraints, indexes, RLS policies, and trigger definitions. This amendment provides the canonical CDM inventory + cross-references; physical body merge of entity definitions into `Telecheck_Canonical_Data_Model_v1_2.md` (renamed to `_v1_3.md` at hygiene cycle) is deferred to a future hygiene cycle per v1.10.1 precedent.

---

## 6. Document control

- **v1.3 amendment v0.1** (2026-05-20) — Phase B batched promotion ratified via P-027. 23 new entities + 3 derived views consolidated from Sprints 8-18. Per-entity schema definitions remain authoritative at their source-Sprint specs (Telecheck_AI_Service_Mode_1/2_Handler_Spec_v1_0.md, Telecheck_KMS_Architecture_Spec_v1_0.md, Telecheck_Consent_Delegated_Access_Slice_PRD_v1_1.md, Telecheck_Notification_Spec_v1_2.md, Telecheck_RBAC_Permissions_Matrix_v1_2.md, Telecheck_SI_016_AI_Workflow_Handler_Registry_v1_0.md). Body merge into renamed `Telecheck_Canonical_Data_Model_v1_3.md` deferred to future hygiene cycle.

— Q2 2026 Batched Ratifier Ceremony, Phase B promotion, 2026-05-20 per Promotion Ledger P-027.
