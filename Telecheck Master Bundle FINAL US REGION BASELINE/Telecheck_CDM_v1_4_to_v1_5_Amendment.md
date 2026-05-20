# CDM v1.4 → v1.5 Amendment (SI-021 follow-on)

**Version:** 0.1 DRAFT
**Status:** RATIFIER-READY-PENDING-CODEX-CONVERGENCE (pre-Codex; targets ~2-3 rounds)
**Authoring date:** 2026-05-20
**Trigger:** Promotion Ledger P-028 (SI-021 v1.0 RATIFIED) OQ4 canonical decision — file SI-021's 4 new audit-chain-archival entities as a CDM v1.4 → v1.5 amendment cycle co-bumped with AUDIT_EVENTS v5.6 → v5.7 + CCR_RUNTIME v5.3 → v5.4.
**Owner:** SRE Lead + Security Engineering Lead + Compliance Officer (same as SI-021 owner triad).
**Parent SI:** SI-021 v1.0 RATIFIED (`Telecheck_SI_021_SIEM_Hash_Chain_Archival_v1_0.md`); P-028 is the ratification authority for this amendment.
**Companion documents:** AUDIT_EVENTS v5.6 → v5.7 amendment (`Telecheck_Contracts_Pack_v5_6_to_v5_7_AUDIT_EVENTS_Amendment.md`) + CCR_RUNTIME v5.3 → v5.4 amendment (covered inline in this file's §3 since 1 key only). Artifact Registry v2.15 → v2.16 on amendment-cycle promotion.

---

## 1. Purpose + scope

This amendment promotes the 4 new audit-chain-archival entities defined in SI-021 v1.0 into CDM v1.4 → v1.5 as canonical entity rows. Co-bumped: AUDIT_EVENTS v5.6 → v5.7 (15 new Cat A events) + CCR_RUNTIME v5.3 → v5.4 (1 new key). The amendment is mechanical consolidation of already-Codex-converged canonical content from SI-021 v1.0 RATIFIED into the canonical contract surfaces.

**In scope:**

1. CDM v1.4 → v1.5 with 4 new entities at sections §4.NEW1 through §4.NEW4 (continuing CDM numbering from v1.4's 71 active entities + 3 derived views; v1.5 target: 75 active entities + 3 derived views).
2. AUDIT_EVENTS v5.6 → v5.7 with 15 new Cat A events under the `audit_archive.*` namespace.
3. CCR_RUNTIME v5.3 → v5.4 with 1 new key (`tenant.audit_archive_signing_interval_seconds`).
4. Forward-reference FK constraints (the supersession FK from `audit_event_hash_chain_anchor` to `audit_event_hash_chain_anchor_corruption_evidence` per SI-021 R5 closure schema design).
5. RLS policy + audit-bound trigger application per the convergent canonical pattern (every PHI-bearing CDM entity carries `enforce_append_only()` + `tenant_id` RLS + per-row encryption-key reference per Sprint 13 KMS Architecture).
6. Cross-reference into AUDIT_EVENTS v5.7 + CCR_RUNTIME v5.4 + INVARIANTS v5.4 §I-027 + Sprint 13 KMS DEK keyring.

**Out of scope:**

- SI-021 procedure-side implementation (Phase C; `telecheck-app` code repo).
- Phase D infrastructure provisioning (S3 Object Lock buckets + transparency log selection + IAM role provisioning).
- Audit-chain backfill execution (per OQ5; runs after CDM v1.5 + Phase D).
- Quantum-resistance migration roadmap (Phase 3+; OQ-I deferred).

---

## 2. New CDM entities (4)

All 4 entities are P2 governance-partition entities (per SI-018 partition rule: audit-chain governance is platform-scoped, not patient-bound). All carry `tenant_id` for tenant-scoping where applicable; the chain itself is per-(partition, partition_key) keyed where partition_key may be patient_id (P1 chains) OR tenant_id OR 'platform' (P2 chains). Storage of CHAIN CONTENT references audit_events.id which is P1-keyed when patient-bound; per-row RLS still applies via the parent audit_event's tenant_id binding.

### §4.NEW1 — `audit_event_hash_chain` (CDM v1.5 new)

Per-row hash-chain projection table maintaining the cryptographic chain of audit events within each (partition, partition_key) namespace. INSERT-only by the `audit-chain-writer` IAM role; no UPDATE/DELETE permissions for any role.

```sql
CREATE TABLE audit_event_hash_chain (
    partition TEXT NOT NULL,                       -- 'P1' | 'P2'
    partition_key TEXT NOT NULL,                   -- patient_id (P1) | tenant_id OR 'platform' (P2)
    sequence_no BIGINT NOT NULL,                   -- Monotonic per (partition, partition_key)
    audit_event_id UUID NOT NULL,                  -- FK to audit_events.id
    row_hash BYTEA NOT NULL,                       -- SHA-256(prior_row_hash || row_canonical_form)
    chained_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (partition, partition_key, sequence_no),
    CONSTRAINT audit_event_hash_chain_event_unique UNIQUE (audit_event_id),
    CONSTRAINT audit_event_hash_chain_partition_check CHECK (partition IN ('P1', 'P2'))
);

-- RLS: enforced at parent audit_events row level (no direct tenant_id on this projection)
-- Append-only: enforce_append_only() trigger applied at v1.5 promotion
```

**Cross-references:** audit_events parent table (CDM v1.2 §4.audit_events); INVARIANTS v5.4 §I-027 (append-only platform floor); SI-021 §2 Sub-decision 1.

### §4.NEW2 — `audit_event_hash_chain_anchor_intent` (CDM v1.5 new)

Crash-safe intent-state table for the 5-phase commit state machine per SI-021 Sub-decision 6. INSERT by `audit-chain-archive-signer` role at phase 1; UPDATE-of-state-only by the same role through deterministic state transitions; INSERT/UPDATE by no other role. Read-only by `audit-chain-verifier`.

```sql
CREATE TABLE audit_event_hash_chain_anchor_intent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partition TEXT NOT NULL,
    partition_key TEXT NOT NULL,
    sequence_no_head BIGINT NOT NULL,
    row_hash_head BYTEA NOT NULL,
    anchor_idempotency_key BYTEA NOT NULL,         -- Deterministic per (partition, partition_key, sequence_no_head)
    intent_state TEXT NOT NULL,                    -- 'intent_reserved' | 'signature_computed' | 's3_write_committed' | 'transparency_log_appended' | 'COMMITTED'
    intent_reserved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    signature_computed_at TIMESTAMPTZ,
    s3_write_committed_at TIMESTAMPTZ,
    transparency_log_appended_at TIMESTAMPTZ,
    committed_at TIMESTAMPTZ,
    signer_principal_arn TEXT NOT NULL,
    CONSTRAINT audit_event_hash_chain_anchor_intent_unique UNIQUE (partition, partition_key, sequence_no_head),
    CONSTRAINT audit_event_hash_chain_anchor_intent_idempotency_unique UNIQUE (anchor_idempotency_key),
    CONSTRAINT audit_event_hash_chain_anchor_intent_state_check
        CHECK (intent_state IN ('intent_reserved', 'signature_computed', 's3_write_committed', 'transparency_log_appended', 'COMMITTED')),
    CONSTRAINT audit_event_hash_chain_anchor_intent_phase_timestamps_monotonic
        CHECK (
            (signature_computed_at IS NULL OR signature_computed_at >= intent_reserved_at)
            AND (s3_write_committed_at IS NULL OR s3_write_committed_at >= COALESCE(signature_computed_at, intent_reserved_at))
            AND (transparency_log_appended_at IS NULL OR transparency_log_appended_at >= COALESCE(s3_write_committed_at, signature_computed_at, intent_reserved_at))
            AND (committed_at IS NULL OR committed_at >= COALESCE(transparency_log_appended_at, s3_write_committed_at, signature_computed_at, intent_reserved_at))
        )
);
```

**Cross-references:** SI-021 §2 Sub-decision 6 (5-phase commit state machine + crash recovery rules); SI-021 §2 Sub-decision 7 (cryptographic-disagreement HALT-AND-REPAIR).

### §4.NEW3 — `audit_event_hash_chain_anchor` (CDM v1.5 new)

Canonical committed-anchor table populated at phase 5 of the commit state machine after both S3 dual-region writes + transparency-log append have succeeded. INSERT by `audit-chain-archive-signer` role only after phase 4 success; no UPDATE/DELETE for any role.

```sql
CREATE TABLE audit_event_hash_chain_anchor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partition TEXT NOT NULL,
    partition_key TEXT NOT NULL,
    sequence_no_head BIGINT NOT NULL,
    row_hash_head BYTEA NOT NULL,
    signed_at TIMESTAMPTZ NOT NULL,                -- Set at phase 5 to transparency_log_appended_at (chronological accuracy)
    signer_principal_arn TEXT NOT NULL,
    signature BYTEA NOT NULL,                      -- RSA-PSS-SHA256 over canonical signed payload
    -- Transparency-log persistence (R3 MED-1 closure)
    transparency_log_id TEXT NOT NULL,
    transparency_log_entry_index BIGINT NOT NULL,
    transparency_log_sth_at_append BYTEA NOT NULL,
    transparency_log_sth_signature BYTEA NOT NULL,
    transparency_log_inclusion_proof JSONB NOT NULL,
    s3_us_east_1_etag TEXT NOT NULL,
    s3_us_west_2_etag TEXT NOT NULL,
    s3_object_sha256 BYTEA NOT NULL,
    -- Supersession linkage (R5 HIGH-2 closure)
    supersedes_corrupted_sequence_no BIGINT,
    supersedes_corruption_evidence_id UUID,
    CONSTRAINT audit_event_hash_chain_anchor_unique UNIQUE (partition, partition_key, sequence_no_head),
    CONSTRAINT audit_event_hash_chain_anchor_log_entry_unique UNIQUE (transparency_log_id, transparency_log_entry_index),
    CONSTRAINT audit_event_hash_chain_anchor_single_supersession_uk
        UNIQUE (partition, partition_key, supersedes_corrupted_sequence_no),
    CONSTRAINT audit_event_hash_chain_anchor_supersession_paired
        CHECK ((supersedes_corrupted_sequence_no IS NULL AND supersedes_corruption_evidence_id IS NULL)
            OR (supersedes_corrupted_sequence_no IS NOT NULL AND supersedes_corruption_evidence_id IS NOT NULL))
);
-- FK to corruption-evidence table established AFTER §4.NEW4 below via forward-reference ALTER TABLE.
```

**Cross-references:** SI-021 §2 Sub-decisions 2-7; INVARIANTS v5.4 §I-027 + §I-035 (append-only); Sprint 13 KMS Architecture §HSM-signer-role.

### §4.NEW4 — `audit_event_hash_chain_anchor_corruption_evidence` (CDM v1.5 new; R5 HIGH-1 closure)

Corruption-evidence table for pre-phase-4 corruption detection. INSERT requires dual-control authorization (Compliance Officer + CTO; distinct human user_ids enforced via CHECK constraint); no UPDATE/DELETE for any role.

```sql
CREATE TABLE audit_event_hash_chain_anchor_corruption_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corrupted_partition TEXT NOT NULL,
    corrupted_partition_key TEXT NOT NULL,
    corrupted_sequence_no BIGINT NOT NULL,
    corrupted_object_s3_key TEXT NOT NULL,
    observed_s3_sha256 BYTEA NOT NULL,
    expected_signature_payload_sha256 BYTEA NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    intent_state_at_observation TEXT NOT NULL,
    transparency_log_id TEXT NOT NULL,
    transparency_log_entry_index BIGINT NOT NULL,
    transparency_log_sth_at_append BYTEA NOT NULL,
    transparency_log_sth_signature BYTEA NOT NULL,
    transparency_log_inclusion_proof JSONB NOT NULL,
    authorized_by_compliance_officer_user_id UUID NOT NULL,
    authorized_by_cto_user_id UUID NOT NULL,
    CONSTRAINT corruption_evidence_dual_control_distinct
        CHECK (authorized_by_compliance_officer_user_id <> authorized_by_cto_user_id),
    CONSTRAINT corruption_evidence_log_entry_unique
        UNIQUE (transparency_log_id, transparency_log_entry_index),
    CONSTRAINT corruption_evidence_single_per_corrupted_seq
        UNIQUE (corrupted_partition, corrupted_partition_key, corrupted_sequence_no)
);

-- Forward-reference FK from §4.NEW3 anchor to this corruption-evidence table
ALTER TABLE audit_event_hash_chain_anchor
    ADD CONSTRAINT audit_event_hash_chain_anchor_corruption_evidence_fk
        FOREIGN KEY (supersedes_corruption_evidence_id)
        REFERENCES audit_event_hash_chain_anchor_corruption_evidence(id);
```

**Cross-references:** SI-021 §2 Sub-decision 7 (phase-state-aware corruption-evidence handling); Sprint 18 RBAC v1.2 §3 Group C (dual-control roles for break-glass-class operations); SI-021 §3 Cat A audit events `corruption_evidence_recorded_pre_phase_4`.

---

## 3. AUDIT_EVENTS v5.6 → v5.7 amendment

**15 new Cat A events** added under the `audit_archive.*` namespace:

| Event | Partition | Source |
|---|---|---|
| `audit_archive.anchor_signed` | P2 keyed by `partition` source (P1/P2 of the anchored chain) | SI-021 §3 (original) |
| `audit_archive.anchor_archived_to_s3` | P2 | SI-021 §3 (original) |
| `audit_archive.anchor_appended_to_transparency_log` | P2 | SI-021 §3 (original) |
| `audit_archive.discovery_inconsistency_detected` | P2 keyed by 'platform' | SI-021 §3 (original) |
| `audit_archive.cross_region_replication_lag_exceeded` | P2 keyed by 'platform' | SI-021 §3 (original; Cat B in SI-021 but promoted to Cat A here per amendment-cycle reconciliation) |
| `audit_archive.dr_chain_reconstruction_initiated` | P2 keyed by 'platform' | SI-021 §3 (original) |
| `audit_archive.dr_chain_reconstruction_completed` | P2 keyed by 'platform' | SI-021 §3 (original) |
| `audit_archive.phase_4_completed_during_recovery` | P2 keyed by 'platform' | SI-021 R3 MED-2 closure |
| `audit_archive.s3_anchor_missing_transparency_log_present_halt` | P2 keyed by 'platform' | SI-021 R3 MED-2 closure |
| `audit_archive.regional_s3_payload_disagreement_halt` | P2 keyed by 'platform' | SI-021 R3 HIGH-2 closure |
| `audit_archive.dr_reconstruction_gap_detected` | P2 keyed by 'platform' | SI-021 R3 MED-2 closure |
| `audit_archive.regional_s3_payload_corruption_or_indeterminate_halt` | P2 keyed by 'platform' | SI-021 R4 HIGH closure |
| `audit_archive.corrupted_anchor_superseded` | P2 keyed by 'platform' + carries `supersedes_corrupted_sequence_no` | SI-021 R4 HIGH closure |
| `audit_archive.corruption_evidence_recorded_pre_phase_4` | P2 keyed by 'platform' + carries `corruption_evidence_id` + `corrupted_sequence_no` | SI-021 R5 HIGH-1 closure |
| `audit_archive.corrupted_anchor_superseded_post_phase_4` | P2 keyed by 'platform' + carries `supersedes_corrupted_sequence_no` + canonical transparency-log entry-index | SI-021 R5 HIGH-1 closure |

**Amendment-cycle reconciliation note (Cat B → Cat A promotion):** `audit_archive.cross_region_replication_lag_exceeded` was labeled Cat B in SI-021 §3 but is promoted to Cat A here per amendment-cycle reconciliation: cross-region replication-lag exceedance is a P0 SLA-violation event that affects the durability guarantee + warrants the higher retention class. Documented for ratifier-trail; Codex round will validate this reconciliation against I-033 multi-region partition-degraded provenance (Contracts Pack v5.4 INVARIANTS new invariant).

**Audit-CHECK constraint amendment:** `audit_events.action_id CHECK` constraint must enumerate the 15 new action IDs to satisfy I-012 closure rule. Specifically, the CHECK becomes (showing only the audit_archive namespace additions; existing CHECK content preserved):

```sql
ALTER TABLE audit_events
    DROP CONSTRAINT audit_events_action_id_check;

ALTER TABLE audit_events
    ADD CONSTRAINT audit_events_action_id_check CHECK (
        action_id IN (
            -- ... existing v5.6 enumeration preserved ...
            'audit_archive.anchor_signed',
            'audit_archive.anchor_archived_to_s3',
            'audit_archive.anchor_appended_to_transparency_log',
            'audit_archive.discovery_inconsistency_detected',
            'audit_archive.cross_region_replication_lag_exceeded',
            'audit_archive.dr_chain_reconstruction_initiated',
            'audit_archive.dr_chain_reconstruction_completed',
            'audit_archive.phase_4_completed_during_recovery',
            'audit_archive.s3_anchor_missing_transparency_log_present_halt',
            'audit_archive.regional_s3_payload_disagreement_halt',
            'audit_archive.dr_reconstruction_gap_detected',
            'audit_archive.regional_s3_payload_corruption_or_indeterminate_halt',
            'audit_archive.corrupted_anchor_superseded',
            'audit_archive.corruption_evidence_recorded_pre_phase_4',
            'audit_archive.corrupted_anchor_superseded_post_phase_4'
        )
    );
```

---

## 4. CCR_RUNTIME v5.3 → v5.4 amendment

**1 new tenant config key** added:

| Key | Type | Default | Range | Source |
|---|---|---|---|---|
| `tenant.audit_archive_signing_interval_seconds` | INTEGER | 3600 (1 hour canonical) | 900 (15 min) — 86400 (24 hour) | P-028 OQ1 ratification |

**Validation rule:** value MUST be in [900, 86400] inclusive. Values outside range REJECT at admin-write endpoint with `audit_archive_signing_interval_out_of_range` error code (Cat A audit event emitted on rejection per I-007 admin-write validation pattern).

**Default behavior:** if key not set, tenant inherits the platform default of 3600 (1 hour canonical) per OQ1 working-recommendation ratification.

**Tenant-configurability rationale:** higher-compliance tenants (e.g., research-data tenants per ADR-028; financial-services-class tenants if added in Phase 3+) may require sub-hourly signing to satisfy regulatory-audit-trail latency requirements; lower-throughput tenants benefit from the canonical hourly default to minimize signing-volume costs.

---

## 5. Cross-SI alignment

| Cross-SI surface | This amendment's surface | Relationship |
|---|---|---|
| SI-021 v1.0 RATIFIED §2 Sub-decisions 1-7 | §4.NEW1-4 + §3 + §4 | This amendment IS the CDM/contracts consolidation of SI-021 v1.0 |
| INVARIANTS v5.4 §I-027 (append-only) | All 4 new entities | Append-only enforced via trigger + role-based IAM |
| INVARIANTS v5.4 §I-035 (append-only for ratification + audit-bound state machines) | §4.NEW1-4 | Convergent canonical pattern |
| Sprint 13 KMS Architecture §HSM-signer-role | §4.NEW2-3 signer_principal_arn | HSM-backed signing per Sprint 13 |
| Sprint 18 RBAC v1.2 §3 Group C dual-control | §4.NEW4 dual-control CHECK constraint | Convergent pattern |
| AUDIT_EVENTS v5.6 → v5.7 | §3 15 new events | Co-bumped per amendment cycle |
| CCR_RUNTIME v5.3 → v5.4 | §4 1 new key | Co-bumped per amendment cycle |

---

## 6. Open questions for ratifier (own ceremony)

1. **OQ1 — Cat B → Cat A promotion for `cross_region_replication_lag_exceeded`.** Recommendation: PROMOTE to Cat A per amendment-cycle reconciliation (durability-class event warranting higher retention). SI-021 §3 had it as Cat B sampled; this amendment promotes it.
2. **OQ2 — Forward-reference FK ordering.** Recommendation: declare §4.NEW3 first, then §4.NEW4, then ALTER TABLE for the corruption-evidence FK. Alternative: declare both tables with deferred FK constraint. Recommendation: ALTER TABLE pattern (matches SI-021 R5 closure schema authoring).
3. **OQ3 — Cat A retention for hash-chain anchor table.** Recommendation: 7 years (HIPAA Cat A standard) for `audit_event_hash_chain_anchor` + `audit_event_hash_chain_anchor_corruption_evidence`; 7 years for `audit_event_hash_chain_anchor_intent` (intent table preserves crash-recovery audit-trail); 7 years for `audit_event_hash_chain` (chain projection).
4. **OQ4 — Whether INVARIANTS v5.4 needs I-036 for audit-chain anchor-supersession.** Recommendation: NO new invariant — supersession is constrained at schema-level (single-supersession UNIQUE + paired-NULL CHECK + dual-control authorization) without needing platform-floor invariant elevation. The existing I-035 append-only invariant covers the underlying invariant.
5. **OQ5 — Codex pre-ratification target.** Recommendation: 2-3 rounds (mechanical amendment cycle; lower complexity than SI-021 v1.0 itself).

---

## 7. Codex pre-ratification status

**v0.1 DRAFT 2026-05-20:** pre-Codex-review; awaiting R1.

Authored on `spec/cdm-v1-5-audit-events-v5-7-ccr-v5-4-si021-followon-2026-05-20` branch off main at `8d44bde` (post-P-028 ratification).

---

— Claude (Opus 4.7, 1M context), CDM v1.4 → v1.5 + AUDIT_EVENTS v5.6 → v5.7 + CCR_RUNTIME v5.3 → v5.4 amendment artifact v0.1 DRAFT authored 2026-05-20 per Promotion Ledger P-028 OQ4 canonical decision. SI-021 follow-on amendment cycle next deliverable per autonomous-work authorization.
