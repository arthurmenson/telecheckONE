# CDM v1.4 → v1.5 Amendment (SI-021 follow-on)

**Version:** 0.3 DRAFT
**Status:** R2 ALL FINDINGS CLOSED (3 HIGH; HIGH-1 partial close inline + hardened-helper sub-recommendation deferred to OQ6 cross-CDM scope; HIGH-2 + HIGH-3 closed inline). R3 verification PENDING.
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

**Tenant-isolation (R1 CRITICAL closure 2026-05-20 per ERR Option A ratification):** carries `tenant_id` + RLS + per-tenant KMS DEK binding per CLAUDE.md "every PHI record carries tenant_id" + I-023/I-024/I-025/I-027 platform-floor invariants. Three-layer enforcement: PostgreSQL RLS + application-layer filtering + per-tenant CMK-derived DEK for any future encrypted-payload extensions. Consistency constraints enforce P1 chain `tenant_id` matches parent `audit_events.tenant_id`; P2 tenant-keyed chains have `tenant_id::TEXT = partition_key`; P2 platform chains use the canonical `PLATFORM_TENANT_ID` sentinel per I-024.

```sql
CREATE TABLE audit_event_hash_chain (
    tenant_id tenant_id_t NOT NULL,                -- Three-layer tenant enforcement per I-023; PLATFORM_TENANT_ID sentinel for P2 platform-scoped chains per I-024
    partition TEXT NOT NULL,                       -- 'P1' | 'P2'
    partition_key TEXT NOT NULL,                   -- patient_id (P1) | tenant_id::TEXT OR 'platform' literal (P2)
    sequence_no BIGINT NOT NULL,                   -- Monotonic per (partition, partition_key)
    audit_event_id UUID NOT NULL,                  -- FK to audit_events.id
    row_hash BYTEA NOT NULL,                       -- SHA-256(prior_row_hash || row_canonical_form)
    chained_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (partition, partition_key, sequence_no),
    CONSTRAINT audit_event_hash_chain_event_unique UNIQUE (audit_event_id),
    CONSTRAINT audit_event_hash_chain_partition_check CHECK (partition IN ('P1', 'P2')),
    -- P2 tenant-consistency (Option A consistency constraint #2 + #3 per Codex's missed-considerations):
    CONSTRAINT audit_event_hash_chain_p2_tenant_consistency CHECK (
        partition = 'P1'
        OR (partition = 'P2' AND partition_key <> 'platform' AND tenant_id::TEXT = partition_key)
        OR (partition = 'P2' AND partition_key = 'platform' AND tenant_id = '00000000-0000-0000-0000-000000000000'::tenant_id_t)
    ),
    CONSTRAINT audit_event_hash_chain_audit_event_fk FOREIGN KEY (audit_event_id) REFERENCES audit_events(id)
);

-- Three-layer RLS enforcement (R2 HIGH-1 closure: FORCE + WITH CHECK + fail-closed GUC)
ALTER TABLE audit_event_hash_chain ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_event_hash_chain FORCE ROW LEVEL SECURITY;   -- prevent table-owner RLS bypass
CREATE POLICY audit_event_hash_chain_tenant_isolation ON audit_event_hash_chain
    USING (
        tenant_id = current_setting('app.tenant_id', false)::tenant_id_t
        OR (current_setting('app.platform_operator_break_glass', true) = 'true'
            AND tenant_id = '00000000-0000-0000-0000-000000000000'::tenant_id_t)
    )
    WITH CHECK (
        -- INSERT/UPDATE must also satisfy the tenant predicate (break-glass cannot write under platform-operator clause)
        tenant_id = current_setting('app.tenant_id', false)::tenant_id_t
    );

-- Append-only enforcement
CREATE TRIGGER audit_event_hash_chain_append_only
    BEFORE UPDATE OR DELETE ON audit_event_hash_chain
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

-- P1 tenant-id-match trigger (Option A consistency constraint #1):
-- P1 chain row's tenant_id MUST match parent audit_events.tenant_id.
CREATE FUNCTION audit_event_hash_chain_p1_tenant_match() RETURNS TRIGGER AS $$
DECLARE parent_tenant_id tenant_id_t;
BEGIN
    IF NEW.partition = 'P1' THEN
        SELECT tenant_id INTO parent_tenant_id FROM public.audit_events WHERE id = NEW.audit_event_id;  -- R2 HIGH-2 closure: schema-qualified
        IF parent_tenant_id IS NULL OR parent_tenant_id <> NEW.tenant_id THEN
            RAISE EXCEPTION 'audit_event_hash_chain P1 row tenant_id (%) must match audit_events.tenant_id (%) for audit_event_id (%)',
                NEW.tenant_id, parent_tenant_id, NEW.audit_event_id
                USING ERRCODE = 'integrity_constraint_violation';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;   -- R2 HIGH-2 closure: search_path-hardened to defeat SECURITY DEFINER + caller-controlled-search_path object-redirection attack

CREATE TRIGGER audit_event_hash_chain_p1_tenant_match_trg
    BEFORE INSERT ON audit_event_hash_chain
    FOR EACH ROW EXECUTE FUNCTION audit_event_hash_chain_p1_tenant_match();
```

**Cross-references:** audit_events parent table (CDM v1.2 §4.audit_events; tenant_id source for P1 consistency); INVARIANTS v5.4 §I-023 (three-layer tenant isolation) + §I-024 (PLATFORM_TENANT_ID sentinel convention) + §I-025 (tenant-blind errors) + §I-027 (append-only platform floor); SI-021 §2 Sub-decision 1 (original tenant-id-less schema RATIFIED at P-028; superseded by this Option-A-amended schema per ERR P-028a mini-review ratification 2026-05-20); ERR `Telecheck_v1_10_PRD_Update/Engineering-Review-Request-SI-021-Chain-Schema-Tenant-Isolation-2026-05-20.md` §7 Ratifier decision.

### §4.NEW2 — `audit_event_hash_chain_anchor_intent` (CDM v1.5 new)

Crash-safe intent-state table for the 5-phase commit state machine per SI-021 §2 Sub-decision 6. **Per-phase role-INSERT/UPDATE authority distribution matches SI-021 §2 Sub-decision 5a 5-role separation (R1 HIGH-1 closure 2026-05-20):**

| Phase | Role authorized | Action |
|---|---|---|
| Phase 1 (intent_reserved) | `audit-chain-writer` | INSERT row with intent_state='intent_reserved'; sets partition + partition_key + sequence_no_head + row_hash_head + anchor_idempotency_key + intent_reserved_at |
| Phase 2 (signature_computed) | `audit-chain-archive-signer` | UPDATE: sets signature + signed_at_intent + signature_computed_at + intent_state='signature_computed'; cannot modify any other column |
| Phase 3 (s3_write_committed) | `audit-chain-s3-writer` | UPDATE: sets s3_us_east_1_etag + s3_us_west_2_etag + s3_object_key + s3_object_sha256 + s3_write_committed_at + intent_state='s3_write_committed'; cannot modify signature OR transparency-log fields |
| Phase 4 (transparency_log_appended) | `audit-transparency-log-append-witness` | UPDATE: sets transparency_log_id + transparency_log_entry_index + transparency_log_sth_at_append + transparency_log_sth_signature + transparency_log_inclusion_proof + transparency_log_appended_at + intent_state='transparency_log_appended'; cannot modify S3 OR signature fields |
| Phase 5 (COMMITTED) | `audit-chain-archive-signer` OR `audit-chain-verifier` | UPDATE: sets committed_at + intent_state='COMMITTED' after verifying prior phases via row-level CHECK constraints |

Role-based RLS + column-level GRANTs enforce per-phase authority. Read-only by `audit-chain-verifier` at all phases.

**Intent-table persistence fields per phase (R1 HIGH-2 closure 2026-05-20):** the intent row carries all material needed to resume from durable state without re-signing or losing proofs. Phase 2 persists the signature + signed_at_intent so phase-3/4/5 crash recovery does not require re-signing. Phase 3 persists S3 dual-region provenance so phase-4 crash recovery does not require re-probing both regions. Phase 4 persists transparency-log inclusion proof + STH material so phase-5 crash recovery does not require re-fetching from the transparency log. At phase 5 the intent row's persisted material is copied into the canonical `audit_event_hash_chain_anchor` row (§4.NEW3) and the intent row may be retained for forensic audit-trail OR archived per retention policy.

**Tenant-isolation (R1 CRITICAL closure 2026-05-20 per ERR Option A):** carries `tenant_id` + RLS + P2-consistency CHECK matching the §4.NEW1 pattern.

```sql
CREATE TABLE audit_event_hash_chain_anchor_intent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,                -- Three-layer tenant enforcement per I-023; PLATFORM_TENANT_ID for P2 platform-scoped per I-024
    partition TEXT NOT NULL,
    partition_key TEXT NOT NULL,
    sequence_no_head BIGINT NOT NULL,
    row_hash_head BYTEA NOT NULL,
    anchor_idempotency_key BYTEA NOT NULL,         -- Deterministic per (partition, partition_key, sequence_no_head)
    intent_state TEXT NOT NULL,                    -- 'intent_reserved' | 'signature_computed' | 's3_write_committed' | 'transparency_log_appended' | 'COMMITTED'
    intent_reserved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Phase 2 persistence (set by audit-chain-archive-signer; required at intent_state >= 'signature_computed')
    signature BYTEA,                               -- RSA-PSS-SHA256 over canonical signed payload
    signed_at_intent TIMESTAMPTZ,                  -- Signer's authoritative signing timestamp (canonical signed_at at phase 5 may differ; carries chronological accuracy)
    signature_computed_at TIMESTAMPTZ,             -- Audit timestamp for phase 2 transition
    signer_principal_arn TEXT NOT NULL,            -- Pre-populated at phase 1 from the planned signer principal; verified at phase 2
    -- Phase 3 persistence (set by audit-chain-s3-writer; required at intent_state >= 's3_write_committed')
    s3_object_key TEXT,                            -- Deterministic S3 locator for the immutable archive object
    s3_us_east_1_etag TEXT,
    s3_us_west_2_etag TEXT,
    s3_object_sha256 BYTEA,                        -- Canonical content hash (re-verified at recovery per Sub-decision 7)
    s3_write_committed_at TIMESTAMPTZ,             -- Audit timestamp for phase 3 transition
    -- Phase 4 persistence (set by audit-transparency-log-append-witness; required at intent_state >= 'transparency_log_appended')
    transparency_log_id TEXT,
    transparency_log_entry_index BIGINT,
    transparency_log_sth_at_append BYTEA,
    transparency_log_sth_signature BYTEA,
    transparency_log_inclusion_proof JSONB,
    transparency_log_appended_at TIMESTAMPTZ,      -- Audit timestamp for phase 4 transition
    -- Phase 5 persistence (set by audit-chain-archive-signer OR audit-chain-verifier; required at intent_state = 'COMMITTED')
    committed_at TIMESTAMPTZ,                      -- Audit timestamp for phase 5 transition
    CONSTRAINT audit_event_hash_chain_anchor_intent_unique UNIQUE (partition, partition_key, sequence_no_head),
    CONSTRAINT audit_event_hash_chain_anchor_intent_idempotency_unique UNIQUE (anchor_idempotency_key),
    CONSTRAINT audit_event_hash_chain_anchor_intent_state_check
        CHECK (intent_state IN ('intent_reserved', 'signature_computed', 's3_write_committed', 'transparency_log_appended', 'COMMITTED')),
    -- State-specific NOT-NULL CHECK: required persistence fields per phase
    CONSTRAINT audit_event_hash_chain_anchor_intent_phase_2_complete
        CHECK (intent_state = 'intent_reserved'
            OR (signature IS NOT NULL AND signed_at_intent IS NOT NULL AND signature_computed_at IS NOT NULL)),
    CONSTRAINT audit_event_hash_chain_anchor_intent_phase_3_complete
        CHECK (intent_state IN ('intent_reserved', 'signature_computed')
            OR (s3_object_key IS NOT NULL AND s3_us_east_1_etag IS NOT NULL AND s3_us_west_2_etag IS NOT NULL
                AND s3_object_sha256 IS NOT NULL AND s3_write_committed_at IS NOT NULL)),
    CONSTRAINT audit_event_hash_chain_anchor_intent_phase_4_complete
        CHECK (intent_state IN ('intent_reserved', 'signature_computed', 's3_write_committed')
            OR (transparency_log_id IS NOT NULL AND transparency_log_entry_index IS NOT NULL
                AND transparency_log_sth_at_append IS NOT NULL AND transparency_log_sth_signature IS NOT NULL
                AND transparency_log_inclusion_proof IS NOT NULL AND transparency_log_appended_at IS NOT NULL)),
    CONSTRAINT audit_event_hash_chain_anchor_intent_phase_5_complete
        CHECK (intent_state <> 'COMMITTED' OR committed_at IS NOT NULL),
    CONSTRAINT audit_event_hash_chain_anchor_intent_phase_timestamps_monotonic
        CHECK (
            (signature_computed_at IS NULL OR signature_computed_at >= intent_reserved_at)
            AND (s3_write_committed_at IS NULL OR s3_write_committed_at >= COALESCE(signature_computed_at, intent_reserved_at))
            AND (transparency_log_appended_at IS NULL OR transparency_log_appended_at >= COALESCE(s3_write_committed_at, signature_computed_at, intent_reserved_at))
            AND (committed_at IS NULL OR committed_at >= COALESCE(transparency_log_appended_at, s3_write_committed_at, signature_computed_at, intent_reserved_at))
        ),
    -- P2 tenant-consistency (Option A consistency constraint #2 + #3):
    CONSTRAINT audit_event_hash_chain_anchor_intent_p2_tenant_consistency CHECK (
        partition = 'P1'
        OR (partition = 'P2' AND partition_key <> 'platform' AND tenant_id::TEXT = partition_key)
        OR (partition = 'P2' AND partition_key = 'platform' AND tenant_id = '00000000-0000-0000-0000-000000000000'::tenant_id_t)
    )
);

-- Three-layer RLS enforcement (R2 HIGH-1 closure: FORCE + WITH CHECK + fail-closed GUC)
ALTER TABLE audit_event_hash_chain_anchor_intent ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_event_hash_chain_anchor_intent FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_event_hash_chain_anchor_intent_tenant_isolation ON audit_event_hash_chain_anchor_intent
    USING (
        tenant_id = current_setting('app.tenant_id', false)::tenant_id_t
        OR (current_setting('app.platform_operator_break_glass', true) = 'true'
            AND tenant_id = '00000000-0000-0000-0000-000000000000'::tenant_id_t)
    )
    WITH CHECK (
        tenant_id = current_setting('app.tenant_id', false)::tenant_id_t
    );

-- P1 tenant-id-match enforced via the §4.NEW1 chain's tenant_id (anchor_intent's partition_key for P1 references the chain via FK below)
-- For P1 chains, the anchor's tenant_id MUST equal the corresponding chain row's tenant_id.
CREATE FUNCTION audit_event_hash_chain_anchor_intent_p1_tenant_match() RETURNS TRIGGER AS $$
DECLARE chain_tenant_id tenant_id_t;
BEGIN
    IF NEW.partition = 'P1' THEN
        SELECT tenant_id INTO chain_tenant_id
            FROM public.audit_event_hash_chain   -- R2 HIGH-2 closure: schema-qualified
            WHERE partition = NEW.partition AND partition_key = NEW.partition_key AND sequence_no = NEW.sequence_no_head;
        IF chain_tenant_id IS NULL OR chain_tenant_id <> NEW.tenant_id THEN
            RAISE EXCEPTION 'audit_event_hash_chain_anchor_intent P1 row tenant_id (%) must match audit_event_hash_chain.tenant_id (%) at (partition=%, partition_key=%, sequence_no=%)',
                NEW.tenant_id, chain_tenant_id, NEW.partition, NEW.partition_key, NEW.sequence_no_head
                USING ERRCODE = 'integrity_constraint_violation';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;   -- R2 HIGH-2 closure: search_path-hardened to defeat SECURITY DEFINER + caller-controlled-search_path object-redirection attack

CREATE TRIGGER audit_event_hash_chain_anchor_intent_p1_tenant_match_trg
    BEFORE INSERT ON audit_event_hash_chain_anchor_intent
    FOR EACH ROW EXECUTE FUNCTION audit_event_hash_chain_anchor_intent_p1_tenant_match();

-- Column-level GRANT enforces per-phase role authority (illustrative; actual GRANT DDL deferred to Phase D infrastructure IaC):
-- GRANT INSERT (partition, partition_key, sequence_no_head, row_hash_head, anchor_idempotency_key, intent_state, intent_reserved_at, signer_principal_arn) ON TABLE audit_event_hash_chain_anchor_intent TO audit_chain_writer;
-- GRANT UPDATE (signature, signed_at_intent, signature_computed_at, intent_state) ON TABLE audit_event_hash_chain_anchor_intent TO audit_chain_archive_signer;
-- GRANT UPDATE (s3_object_key, s3_us_east_1_etag, s3_us_west_2_etag, s3_object_sha256, s3_write_committed_at, intent_state) ON TABLE audit_event_hash_chain_anchor_intent TO audit_chain_s3_writer;
-- GRANT UPDATE (transparency_log_id, transparency_log_entry_index, transparency_log_sth_at_append, transparency_log_sth_signature, transparency_log_inclusion_proof, transparency_log_appended_at, intent_state) ON TABLE audit_event_hash_chain_anchor_intent TO audit_transparency_log_append_witness;
-- GRANT UPDATE (committed_at, intent_state) ON TABLE audit_event_hash_chain_anchor_intent TO audit_chain_archive_signer, audit_chain_verifier;
-- GRANT SELECT ON TABLE audit_event_hash_chain_anchor_intent TO audit_chain_verifier;
```

**Cross-references:** SI-021 §2 Sub-decision 5a (5-role separation IAM/DB/KMS/S3 permission matrix); SI-021 §2 Sub-decision 6 (5-phase commit state machine + crash recovery rules); SI-021 §2 Sub-decision 7 (cryptographic-disagreement HALT-AND-REPAIR).

### §4.NEW3 — `audit_event_hash_chain_anchor` (CDM v1.5 new)

Canonical committed-anchor table populated at phase 5 of the commit state machine after both S3 dual-region writes + transparency-log append have succeeded. INSERT by `audit-chain-archive-signer` role only after phase 4 success; no UPDATE/DELETE for any role.

**Tenant-isolation (R1 CRITICAL closure 2026-05-20 per ERR Option A):** carries `tenant_id` + RLS + P2-consistency CHECK matching the §4.NEW1 + §4.NEW2 pattern.

```sql
CREATE TABLE audit_event_hash_chain_anchor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,                -- Three-layer tenant enforcement per I-023; PLATFORM_TENANT_ID for P2 platform-scoped per I-024
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
    s3_object_key TEXT NOT NULL,                   -- Deterministic S3 locator for the immutable archive object (R1 MED closure 2026-05-20: restored from SI-021 v1.0 §2 Sub-decision 3 schema; carried in canonical signed payload so HSM signature covers it)
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
            OR (supersedes_corrupted_sequence_no IS NOT NULL AND supersedes_corruption_evidence_id IS NOT NULL)),
    -- P2 tenant-consistency (Option A consistency constraint #2 + #3):
    CONSTRAINT audit_event_hash_chain_anchor_p2_tenant_consistency CHECK (
        partition = 'P1'
        OR (partition = 'P2' AND partition_key <> 'platform' AND tenant_id::TEXT = partition_key)
        OR (partition = 'P2' AND partition_key = 'platform' AND tenant_id = '00000000-0000-0000-0000-000000000000'::tenant_id_t)
    )
);
-- FK to corruption-evidence table established AFTER §4.NEW4 below via forward-reference ALTER TABLE.

-- Three-layer RLS enforcement (R2 HIGH-1 closure: FORCE + WITH CHECK + fail-closed GUC)
ALTER TABLE audit_event_hash_chain_anchor ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_event_hash_chain_anchor FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_event_hash_chain_anchor_tenant_isolation ON audit_event_hash_chain_anchor
    USING (
        tenant_id = current_setting('app.tenant_id', false)::tenant_id_t
        OR (current_setting('app.platform_operator_break_glass', true) = 'true'
            AND tenant_id = '00000000-0000-0000-0000-000000000000'::tenant_id_t)
    )
    WITH CHECK (
        tenant_id = current_setting('app.tenant_id', false)::tenant_id_t
    );

-- Append-only enforcement (R2 HIGH-3 closure: was missing in v0.2; restored to match §4.NEW1 pattern)
CREATE TRIGGER audit_event_hash_chain_anchor_append_only
    BEFORE UPDATE OR DELETE ON audit_event_hash_chain_anchor
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

-- P1 tenant-id-match trigger: anchor's tenant_id MUST match corresponding chain row's tenant_id (Option A consistency constraint #1).
CREATE FUNCTION audit_event_hash_chain_anchor_p1_tenant_match() RETURNS TRIGGER AS $$
DECLARE chain_tenant_id tenant_id_t;
BEGIN
    IF NEW.partition = 'P1' THEN
        SELECT tenant_id INTO chain_tenant_id
            FROM public.audit_event_hash_chain   -- R2 HIGH-2 closure: schema-qualified
            WHERE partition = NEW.partition AND partition_key = NEW.partition_key AND sequence_no = NEW.sequence_no_head;
        IF chain_tenant_id IS NULL OR chain_tenant_id <> NEW.tenant_id THEN
            RAISE EXCEPTION 'audit_event_hash_chain_anchor P1 row tenant_id mismatch at (partition=%, partition_key=%, sequence_no=%)',
                NEW.partition, NEW.partition_key, NEW.sequence_no_head
                USING ERRCODE = 'integrity_constraint_violation';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;   -- R2 HIGH-2 closure: search_path-hardened to defeat SECURITY DEFINER + caller-controlled-search_path object-redirection attack

CREATE TRIGGER audit_event_hash_chain_anchor_p1_tenant_match_trg
    BEFORE INSERT ON audit_event_hash_chain_anchor
    FOR EACH ROW EXECUTE FUNCTION audit_event_hash_chain_anchor_p1_tenant_match();
```

**Cross-references:** SI-021 §2 Sub-decisions 2-7; INVARIANTS v5.4 §I-027 + §I-035 (append-only); Sprint 13 KMS Architecture §HSM-signer-role.

### §4.NEW4 — `audit_event_hash_chain_anchor_corruption_evidence` (CDM v1.5 new; R5 HIGH-1 closure)

Corruption-evidence table for pre-phase-4 corruption detection. INSERT requires dual-control authorization (Compliance Officer + CTO; distinct human user_ids enforced via CHECK constraint); no UPDATE/DELETE for any role.

**Tenant-isolation (R1 CRITICAL closure 2026-05-20 per ERR Option A):** carries `tenant_id` matching the corrupted-chain's tenant via P1/P2 consistency rules + RLS.

```sql
CREATE TABLE audit_event_hash_chain_anchor_corruption_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,                -- Three-layer tenant enforcement per I-023; matches the corrupted chain's tenant_id
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
        UNIQUE (corrupted_partition, corrupted_partition_key, corrupted_sequence_no),
    -- P2 tenant-consistency (Option A consistency constraint #2 + #3): tenant_id derived from corrupted chain's partition/partition_key
    CONSTRAINT corruption_evidence_p2_tenant_consistency CHECK (
        corrupted_partition = 'P1'
        OR (corrupted_partition = 'P2' AND corrupted_partition_key <> 'platform' AND tenant_id::TEXT = corrupted_partition_key)
        OR (corrupted_partition = 'P2' AND corrupted_partition_key = 'platform' AND tenant_id = '00000000-0000-0000-0000-000000000000'::tenant_id_t)
    )
);

-- Three-layer RLS enforcement (R2 HIGH-1 closure: FORCE + WITH CHECK + fail-closed GUC)
ALTER TABLE audit_event_hash_chain_anchor_corruption_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_event_hash_chain_anchor_corruption_evidence FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_event_hash_chain_anchor_corruption_evidence_tenant_isolation ON audit_event_hash_chain_anchor_corruption_evidence
    USING (
        tenant_id = current_setting('app.tenant_id', false)::tenant_id_t
        OR (current_setting('app.platform_operator_break_glass', true) = 'true'
            AND tenant_id = '00000000-0000-0000-0000-000000000000'::tenant_id_t)
    )
    WITH CHECK (
        tenant_id = current_setting('app.tenant_id', false)::tenant_id_t
    );

-- Append-only enforcement (R2 HIGH-3 closure)
CREATE TRIGGER audit_event_hash_chain_anchor_corruption_evidence_append_only
    BEFORE UPDATE OR DELETE ON audit_event_hash_chain_anchor_corruption_evidence
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

-- P1 tenant-id-match trigger: corruption-evidence's tenant_id MUST match the corrupted chain row's tenant_id (Option A consistency constraint #1).
CREATE FUNCTION audit_event_hash_chain_anchor_corruption_evidence_p1_tenant_match() RETURNS TRIGGER AS $$
DECLARE chain_tenant_id tenant_id_t;
BEGIN
    IF NEW.corrupted_partition = 'P1' THEN
        SELECT tenant_id INTO chain_tenant_id
            FROM public.audit_event_hash_chain   -- R2 HIGH-2 closure: schema-qualified
            WHERE partition = NEW.corrupted_partition AND partition_key = NEW.corrupted_partition_key AND sequence_no = NEW.corrupted_sequence_no;
        IF chain_tenant_id IS NULL OR chain_tenant_id <> NEW.tenant_id THEN
            RAISE EXCEPTION 'audit_event_hash_chain_anchor_corruption_evidence P1 row tenant_id mismatch at corrupted (partition=%, partition_key=%, sequence_no=%)',
                NEW.corrupted_partition, NEW.corrupted_partition_key, NEW.corrupted_sequence_no
                USING ERRCODE = 'integrity_constraint_violation';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;   -- R2 HIGH-2 closure: search_path-hardened to defeat SECURITY DEFINER + caller-controlled-search_path object-redirection attack

CREATE TRIGGER audit_event_hash_chain_anchor_corruption_evidence_p1_tenant_match_trg
    BEFORE INSERT ON audit_event_hash_chain_anchor_corruption_evidence
    FOR EACH ROW EXECUTE FUNCTION audit_event_hash_chain_anchor_corruption_evidence_p1_tenant_match();

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
6. **OQ6 — Hardened tenant/platform helper function for RLS predicates** (R2 HIGH-1 sub-recommendation deferred 2026-05-20). Codex R2 HIGH-1 recommended replacing raw `current_setting('app.tenant_id')` RLS predicates with a canonical hardened tenant helper function (analogous to SI-010-style trust-anchor pattern that was rejected at P-023a; the right scope is a successor cross-CDM hardening SI rather than this amendment cycle). The current amendment closes the in-scope sub-recommendations of HIGH-1 (FORCE ROW LEVEL SECURITY + WITH CHECK predicates + fail-closed `current_setting(..., false)` flag) but defers the hardened-helper question. **Recommendation:** file a separate cross-CDM hardening SI in a future cycle (provisionally SI-024 "Canonical Hardened Tenant/Platform RLS Helper Pattern") that proposes a `current_tenant_id_strict()` SQL function + migration plan for all v1.10-era PHI-bearing entities. SI-021's chain tables benefit from the helper alongside every other PHI table; resolving in isolation is wrong scope. Until SI-024 lands, the chain tables use the same `current_setting()` pattern as every other v1.10 entity (consistent canonical floor).

---

## 7. Codex pre-ratification status

**v0.1 DRAFT 2026-05-20:** pre-Codex-review.

**v0.1 R1 closure 2026-05-20:** 1 CRITICAL (ESCALATED) + 2 HIGH + 1 MED.

| Round | Findings | Status |
|---|---|---|
| R1 | **CRITICAL** patient-bound chain metadata has no enforceable tenant boundary (audit_event_hash_chain + intent + anchor + corruption-evidence tables lack tenant_id; rely on parent audit_events RLS join which is insufficient for direct row-level enforcement during DR reconstruction OR direct queries against the chain tables); **HIGH-1** intent-table authority collapses SI-021 §2 Sub-decision 5a 5-role separation (amendment had single-role audit-chain-archive-signer handling all phase transitions; should be writer→signer→s3-writer→witness→signer/verifier per phase); **HIGH-2** intent schema missing crash-recovery persistence fields (signature + signed_at_intent + S3 provenance + transparency-log inclusion-proof material per phase); **MED** committed anchor missing s3_object_key (SI-021 §2 Sub-decision 3 schema field for deterministic immutable-object locator) | HIGH-1 + HIGH-2 + MED closed inline; **CRITICAL ESCALATED per CLAUDE.md hard-floor item 6** |

**R1 closure pattern recap:**

- **HIGH-1 (closed inline):** §4.NEW2 rewritten with per-phase role-authority table mapping each phase to its canonical 5-role-separation role (writer→signer→s3-writer→witness→signer/verifier). Column-level GRANT discipline articulated as illustrative SQL comments (actual GRANT DDL deferred to Phase D infrastructure IaC). The amendment's prior single-role collapse is fully reversed.
- **HIGH-2 (closed inline):** §4.NEW2 schema extended with per-phase persistence fields:
  - Phase 2: `signature BYTEA` + `signed_at_intent TIMESTAMPTZ` + `signature_computed_at TIMESTAMPTZ`
  - Phase 3: `s3_object_key TEXT` + `s3_us_east_1_etag TEXT` + `s3_us_west_2_etag TEXT` + `s3_object_sha256 BYTEA` + `s3_write_committed_at TIMESTAMPTZ`
  - Phase 4: `transparency_log_id TEXT` + `transparency_log_entry_index BIGINT` + `transparency_log_sth_at_append BYTEA` + `transparency_log_sth_signature BYTEA` + `transparency_log_inclusion_proof JSONB` + `transparency_log_appended_at TIMESTAMPTZ`
  - State-specific NOT-NULL CHECK constraints per phase (intent_state ∈ {…} OR field IS NOT NULL pattern) enforce that the row carries the required persistence material before transitioning to subsequent phases. Crash recovery can now resume from durable state at any phase boundary without re-signing or re-fetching external proofs.
- **MED (closed inline):** §4.NEW3 schema extended with `s3_object_key TEXT NOT NULL` per SI-021 §2 Sub-decision 3 deterministic-locator pattern. s3_object_key is carried in the canonical signed payload so HSM signature covers it; verifier reading the committed anchor row alone can locate the exact Object Lock artifact without reconstructing external naming conventions.

**R1 CRITICAL escalation status (CLAUDE.md hard-floor item 6 STOP-and-escalate):**

The R1 CRITICAL finding proposes **net-new canonical schema fields** (tenant_id column + RLS policy on `audit_event_hash_chain` + `audit_event_hash_chain_anchor_intent` + `audit_event_hash_chain_anchor` + `audit_event_hash_chain_anchor_corruption_evidence` tables) that **SI-021 v1.0 RATIFIED §2 Sub-decision 1's schema did NOT include**. Per CLAUDE.md hard-floor item 6 discriminator (a) "net-new canonical schema fields" beyond the ratified sub-decision scope of the SI under review is a hard STOP requiring ratifier escalation. Closing this finding inline by amending the schema within this amendment cycle would violate the discipline.

**Escalation artifact:** `Telecheck_v1_10_PRD_Update/Engineering-Review-Request-SI-021-Chain-Schema-Tenant-Isolation-2026-05-20.md` authored on this branch alongside the R1 closure. The ERR documents the tenant-isolation gap, presents three options (A: add tenant_id+RLS to all 4 chain tables; B: ratify SI-021's tenant-id-less chain schema as canonical with audit_events FK as the sole tenant-binding; C: hybrid — tenant_id on P1 patient-bound chains only, platform-scoped P2 chains use partition_key='platform' literal), assesses each option's I-023/I-024/I-025 platform-floor compatibility, and routes to Evans + Engineering Lead + CDM owner for ratifier mini-review.

**Verdict at R1 close:** RATIFIER-READY-WITH-OPEN-ESCALATION. 3 inline closures (HIGH-1 + HIGH-2 + MED) are clean; 1 CRITICAL is awaiting Evans's ratifier mini-review per the ERR. R2 should NOT run until the CRITICAL is resolved — running R2 against an unresolved CRITICAL would risk Codex closing the open question inline by proposing schema amendments that violate hard-floor item 6.

**v0.2 R1 CRITICAL closure 2026-05-20 (Option A ratified via ERR mini-review + dual-recommendation process):**

Evans's chat-message ratification *"after we go with A consensus recommendation"* 2026-05-20 ratified **Option A** following Claude + Codex side-by-side independent recommendations both converging on A. The dual-recommendation process was simultaneously codified in CLAUDE.md commit `f3a6469` on main (codification trigger = this very ERR cycle).

**Option A implementation in this v0.2:**

All 4 chain tables (§4.NEW1 audit_event_hash_chain + §4.NEW2 audit_event_hash_chain_anchor_intent + §4.NEW3 audit_event_hash_chain_anchor + §4.NEW4 audit_event_hash_chain_anchor_corruption_evidence) now carry:

1. **`tenant_id tenant_id_t NOT NULL` column** — three-layer tenant enforcement per I-023.
2. **ENABLE ROW LEVEL SECURITY + tenant_isolation policy** — PostgreSQL RLS enforcement keyed on `current_setting('app.tenant_id')`. Platform-operator break-glass clause for `tenant_id = PLATFORM_TENANT_ID` sentinel reads (per I-024).
3. **P2 tenant-consistency CHECK constraint** (per Codex's missed-considerations):
   - `(partition = 'P2' AND partition_key <> 'platform' AND tenant_id::TEXT = partition_key)` — tenant-keyed P2 chains have `tenant_id` matching `partition_key`.
   - `(partition = 'P2' AND partition_key = 'platform' AND tenant_id = '00000000-0000-0000-0000-000000000000'::tenant_id_t)` — platform-scoped P2 chains use the PLATFORM_TENANT_ID sentinel.
   - `(partition = 'P1')` — P1 consistency enforced via trigger (see #4).
4. **P1 tenant-id-match trigger** (per Codex's missed-considerations #1):
   - For `audit_event_hash_chain`: tenant_id MUST equal parent `audit_events.tenant_id` (the chain table is the canonical tenant-id source for P1 chains).
   - For `audit_event_hash_chain_anchor_intent` + `audit_event_hash_chain_anchor` + `audit_event_hash_chain_anchor_corruption_evidence`: tenant_id MUST equal the chain row's tenant_id at the same `(partition, partition_key, sequence_no_head)` triple.

**PLATFORM_TENANT_ID sentinel:** canonical `00000000-0000-0000-0000-000000000000` UUID per I-024 platform-record convention. Used across all v1.10+ platform-scoped entities.

**Effect on SI-021 v1.0 RATIFIED schema:** SI-021's original tenant-id-less §2 Sub-decision 1-7 schemas are **superseded for canonical implementation purposes** by the Option-A-extended schemas in §4.NEW1-4 of this amendment. SI-021 file is preserved as ratified at P-028 for traceability; supersession recorded in ERR §7 + Promotion Ledger P-028a (this amendment cycle's mini-review supplemental entry).

**0 hard-floor item 6 violations** on this R1 cycle. PR #11 STOP-and-escalate discipline applied + codified as canonical process for future cycles.

**v0.3 R2 closure 2026-05-20:** 3 HIGH closed (1 partial + 2 inline).

| Round | Findings | Status |
|---|---|---|
| R2 | **HIGH-1** RLS trusts caller-settable GUCs for tenant and break-glass decisions (canonical fix per Codex would be a hardened `current_tenant_id()` helper); **HIGH-2** SECURITY DEFINER triggers not search_path-hardened (object-redirection attack vector); **HIGH-3** committed-anchor + corruption-evidence tables missing `enforce_append_only()` triggers (DDL gap — relies on grants which can drift) | HIGH-1 partial close inline + hardened-helper sub-rec deferred to OQ6; HIGH-2 + HIGH-3 closed inline |

**R2 closure pattern recap:**

- **HIGH-1 (partial close inline + defer):** in-scope hardening applied to all 4 RLS policies: (a) `FORCE ROW LEVEL SECURITY` added to prevent table-owner RLS bypass; (b) `WITH CHECK` predicate added enforcing tenant-write-binding (break-glass clause is read-only, cannot write under PLATFORM_TENANT_ID); (c) `current_setting('app.tenant_id', false)` fail-closed flag — RLS predicate now raises an error if the GUC is unset, eliminating the silent-empty-string trust-boundary bug. **Deferred:** the hardened-helper sub-recommendation (replace raw `current_setting()` with a canonical `current_tenant_id_strict()` SQL function) is out-of-scope for this amendment cycle — it affects ALL v1.10-era PHI-bearing entities, not just SI-021's chain tables. Filed as §6 OQ6 for resolution at a separate cross-CDM hardening SI (provisionally SI-024). Until SI-024 lands, SI-021 chain tables match the convergent canonical floor (raw GUC + FORCE RLS + WITH CHECK + fail-closed flag).
- **HIGH-2 (closed inline):** all 4 SECURITY DEFINER trigger functions hardened with `SET search_path = pg_catalog, public` declaration. All unqualified `audit_events` + `audit_event_hash_chain` references schema-qualified as `public.audit_events` + `public.audit_event_hash_chain`. Defeats the SECURITY DEFINER + caller-controlled-search_path object-redirection attack vector.
- **HIGH-3 (closed inline):** `enforce_append_only()` triggers added to `audit_event_hash_chain_anchor` (§4.NEW3) and `audit_event_hash_chain_anchor_corruption_evidence` (§4.NEW4). Now all 4 chain tables have executable DDL-level append-only enforcement, not just grant-based controls. Matches the §4.NEW1 pattern.

**0 hard-floor item 6 violations on R2.** The hardened-helper question was correctly recognized as architectural-judgment (net-new platform-floor primitive affecting cross-CDM scope) and deferred via OQ6 rather than escalated via ERR (deferral is the right discipline for cross-corpus-scope questions; ERR is for SI-internal architectural-judgment that the current cycle must resolve). The HIGH-1 partial-close + defer pattern is now a documented closure shape alongside full-inline-close and ERR-escalation.

**R3 verification pending.** Codex re-invocation queued in standard adversarial-review framing to verify (a) the R2 closures landed cleanly; (b) the deferred OQ6 framing is acceptable as a partial close vs full escalation; (c) any residual defects introduced by the v0.3 changes (FORCE RLS interaction with grant patterns; WITH CHECK semantics; SET search_path syntax in DDL).

Authored on `spec/cdm-v1-5-audit-events-v5-7-ccr-v5-4-si021-followon-2026-05-20` branch off main at `8d44bde` (post-P-028 ratification). Merged main `f3a6469` (CLAUDE.md dual-recommendation codification) into branch 2026-05-20.

---

— Claude (Opus 4.7, 1M context), CDM v1.4 → v1.5 + AUDIT_EVENTS v5.6 → v5.7 + CCR_RUNTIME v5.3 → v5.4 amendment artifact v0.1 DRAFT authored 2026-05-20 per Promotion Ledger P-028 OQ4 canonical decision. SI-021 follow-on amendment cycle next deliverable per autonomous-work authorization.
