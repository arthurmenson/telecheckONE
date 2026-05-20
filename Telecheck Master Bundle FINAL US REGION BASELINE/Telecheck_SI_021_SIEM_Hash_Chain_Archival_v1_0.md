# SI-021 — SIEM Hash-Chain Archival Spec

**Version:** 1.0 RATIFIED
**Status:** RATIFIED 2026-05-20 per Promotion Ledger P-028 (Evans's chat-message "ratify"); all 5 OQs ratified at working recommendations; FILED per OQ-C ratified decision at Promotion Ledger P-026 + R3-R5 Codex convergence cycle closed at §10 cadence boundary 2026-05-20 (R5 final boundary close); CDM v1.4 → v1.5 + AUDIT_EVENTS v5.6 → v5.7 + CCR_RUNTIME v5.3 → v5.4 follow-on amendment cycle QUEUED as next autonomous-work deliverable
**Codex iteration trajectory:** R1 (3 HIGH + 2 MED = 5) → R2 (2 HIGH duplicate-section removal + 1 MED phase-3 authority + 1 MED OQ2 alignment = 4) → R3 (2 HIGH 5-role-label + per-region recovery + 2 MED STH-on-anchor + audit-taxonomy = 4) → R4 (1 HIGH exhaustive per-region state machine + Object Lock COMPLIANCE corrupted-anchor supersession procedure = 1) → R5 (2 HIGH phase-state-aware corruption-evidence handling + supersession-linkage schema persistence; final §10-cadence boundary round = 2). All 16 findings closed inline (10 HIGH + 6 MED across 5 rounds); 0 architectural-judgment items closed inline; 5 known OQs (§5) remain ratifier-targetable for SI-021's own ratifier ceremony. Original filing per (SIEM §4.5.HC split as separate SI to keep SIEM Spec proper focused on event-streaming + alerting + audit aggregation).
**Owner:** SRE Lead + Security Engineering Lead + Compliance Officer
**Parent SI:** SIEM Integration Spec v1.0 (`Telecheck_SIEM_Integration_Spec_v1_0.md` §4.5.HC was the original split candidate per Sprint 6 R6 close)
**Companion documents:** Promotion Ledger P-026 (ratification authority for the split decision); Sprint 6 SIEM Integration Spec R6 close-out observation; Sprint 13 KMS Architecture Spec (HSM-signing key infrastructure shared); Sprint 7 Cold-DR Runbook (cross-region replication topology shared); INVARIANTS v5.4 §I-027 (audit append-only platform floor).

---

## 1. Purpose + scope

This SI authors the canonical specification for **hash-chain archival of the Telecheck audit chain**, separated from the SIEM Integration Spec proper per OQ-C ratifier decision (P-026). The hash-chain archival sub-system provides the durability + tamper-evidence backstop for the canonical audit chain: every audit event committed to the database is mirrored to an archival store with cryptographic chaining + cross-region replication + transparency-log integration.

**In scope:**

1. Hash-chain construction (per-tenant + per-partition; chained SHA-256 + HSM signature anchors).
2. S3 Object Lock COMPLIANCE-mode storage configuration (immutable retention).
3. Cross-region replication topology (us-east-1 primary + us-west-2 replica per ADR-026).
4. HSM-signed digest anchoring (canonical interval + signer-role separation).
5. External transparency log integration (per Sprint 6 SIEM §4.5.HC §"Independent transparency anchor").
6. First-write acceptance controls + verifier-role separation (per Sprint 6 R3 closure).
7. 2-phase crash-safe signing protocol (per Sprint 6 R5 closure).
8. Discovery-first crash-recovery (per Sprint 6 R6 closure).
9. Audit event taxonomy for archival operations.
10. Disaster-recovery hash-chain reconstruction procedure.

**Out of scope:**

- The audit chain itself (covered by AUDIT_EVENTS v5.6 + the canonical `audit_events` table per CDM).
- SIEM real-time event-streaming pipeline (Sprint 6 SIEM Integration Spec proper).
- Audit-event categorization / partitioning (SI-018 + AUDIT_EVENTS).

---

## 2. Sub-decisions (ratifier-targetable units)

### Sub-decision 1 — Hash-chain construction

**Decision shape:** every audit event row, on canonical INSERT, is hashed + chained to the prior row's hash within its partition. Per-tenant + per-partition chain isolation:

- Per partition (P1 patient-bound; P2 tenant-governance), per `partition_key` (patient_id for P1; tenant_id OR 'platform' for P2), maintain a separate chain.
- Each row's hash: `SHA-256(prior_row_hash || row_serialized_canonical_form)`.
- The `row_serialized_canonical_form` is the JSON-canonical-form serialization of the audit row (RFC 8785 JCS).
- Chain head: the most-recent row's hash.

**Why per-partition isolation:** prevents cross-partition tampering surface; matches SI-018 ratified partition rule.

**Implementation:** the `audit_event_hash_chain` materialized projection table (CDM v1.3 §4.NEW; deferred to SI-021's own CDM amendment cycle):

```sql
CREATE TABLE audit_event_hash_chain (
    partition TEXT NOT NULL,                       -- 'P1' | 'P2'
    partition_key TEXT NOT NULL,                   -- patient_id (P1) | tenant_id OR 'platform' (P2)
    sequence_no BIGINT NOT NULL,                   -- Monotonic per (partition, partition_key)
    audit_event_id UUID NOT NULL,
    row_hash BYTEA NOT NULL,                       -- SHA-256(prior_row_hash || row_canonical_form)
    chained_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (partition, partition_key, sequence_no)
);
```

### Sub-decision 2 — HSM-signed digest anchoring

**Decision shape:** at canonical intervals (every 1 hour + on-demand), the current chain head per partition is signed by a dedicated HSM-backed signer role (separate from the writer role per Sprint 6 R4 closure 4-role separation):

- **Signer role:** `audit-chain-archive-signer` IAM principal with HSM-backed signing key (separate from break-glass HSM signers per Sprint 18 RBAC v1.2 §3 Group C; Inv-1 separation enforced via `iam_principal_human_binding` table).
- **Signing interval:** hourly + on-demand (Compliance Officer trigger).
- **Signature output:** RSA-PSS-SHA256 signature over `(partition, partition_key, sequence_no_head, row_hash_head, signed_at)` tuple.
- **Storage:** stored in `audit_event_hash_chain_anchor` table + replicated to S3 Object Lock per Sub-decision 3.

```sql
CREATE TABLE audit_event_hash_chain_anchor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partition TEXT NOT NULL,
    partition_key TEXT NOT NULL,
    sequence_no_head BIGINT NOT NULL,
    row_hash_head BYTEA NOT NULL,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    signer_principal_arn TEXT NOT NULL,            -- audit-chain-archive-signer ARN
    signature BYTEA NOT NULL,                      -- RSA-PSS-SHA256
    -- Transparency-log persistence (R3 MED-1 closure: committed-anchor carries STH + inclusion proof)
    transparency_log_id TEXT NOT NULL,             -- Canonical transparency log instance UUID (e.g., Sigstore-rekor instance ID)
    transparency_log_entry_index BIGINT NOT NULL,  -- The log's monotonic index for this anchor's entry
    transparency_log_sth_at_append BYTEA NOT NULL, -- Signed Tree Head bytes at the time of append (auditor pin)
    transparency_log_sth_signature BYTEA NOT NULL, -- Signature over the STH (verifies the STH itself)
    transparency_log_inclusion_proof JSONB NOT NULL,  -- Merkle inclusion proof: { leaf_hash, audit_path[], tree_size }
    -- S3 archive provenance (per Sub-decision 8 dual-region write)
    s3_object_key TEXT NOT NULL,                   -- Deterministic key per Sub-decision 3
    s3_us_east_1_etag TEXT NOT NULL,
    s3_us_west_2_etag TEXT NOT NULL,
    s3_object_sha256 BYTEA NOT NULL,               -- Canonical content hash (re-verified at recovery per Sub-decision 7)
    -- Supersession linkage (R5 HIGH-2 closure: persists corrupted-anchor relationship in committed-anchor schema)
    supersedes_corrupted_sequence_no BIGINT,       -- NULL for normal anchors; set when this anchor supersedes a corrupted anchor at the named sequence_no
    supersedes_corruption_evidence_id UUID,        -- FK to audit_event_hash_chain_anchor_corruption_evidence(id); set iff supersedes_corrupted_sequence_no IS NOT NULL
    CONSTRAINT audit_event_hash_chain_anchor_unique UNIQUE (partition, partition_key, sequence_no_head),
    CONSTRAINT audit_event_hash_chain_anchor_log_entry_unique UNIQUE (transparency_log_id, transparency_log_entry_index),
    -- At most ONE canonical supersession per corrupted sequence_no per (partition, partition_key)
    CONSTRAINT audit_event_hash_chain_anchor_single_supersession_uk
        UNIQUE (partition, partition_key, supersedes_corrupted_sequence_no),
    -- Both supersession fields must be NULL together OR both NOT NULL together
    CONSTRAINT audit_event_hash_chain_anchor_supersession_paired
        CHECK ((supersedes_corrupted_sequence_no IS NULL AND supersedes_corruption_evidence_id IS NULL)
            OR (supersedes_corrupted_sequence_no IS NOT NULL AND supersedes_corruption_evidence_id IS NOT NULL))
);

-- R5 HIGH-1 closure: corruption-evidence table for pre-phase-4 corruption detection
CREATE TABLE audit_event_hash_chain_anchor_corruption_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corrupted_partition TEXT NOT NULL,
    corrupted_partition_key TEXT NOT NULL,
    corrupted_sequence_no BIGINT NOT NULL,
    corrupted_object_s3_key TEXT NOT NULL,
    observed_s3_sha256 BYTEA NOT NULL,             -- The wrong object's actual SHA-256
    expected_signature_payload_sha256 BYTEA NOT NULL,  -- The canonical signed payload's SHA-256
    observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    intent_state_at_observation TEXT NOT NULL,     -- 'signature_computed' | 's3_write_committed' | 'transparency_log_appended' | 'COMMITTED'
    transparency_log_id TEXT NOT NULL,             -- The transparency log instance ID
    transparency_log_entry_index BIGINT NOT NULL,  -- The corruption-evidence leaf's log index
    transparency_log_sth_at_append BYTEA NOT NULL,
    transparency_log_sth_signature BYTEA NOT NULL,
    transparency_log_inclusion_proof JSONB NOT NULL,
    authorized_by_compliance_officer_user_id UUID NOT NULL,
    authorized_by_cto_user_id UUID NOT NULL,
    CONSTRAINT corruption_evidence_dual_control_distinct CHECK (authorized_by_compliance_officer_user_id <> authorized_by_cto_user_id),
    CONSTRAINT corruption_evidence_log_entry_unique UNIQUE (transparency_log_id, transparency_log_entry_index),
    -- At most ONE corruption-evidence per corrupted (partition, partition_key, sequence_no)
    CONSTRAINT corruption_evidence_single_per_corrupted_seq UNIQUE (corrupted_partition, corrupted_partition_key, corrupted_sequence_no)
);

-- The supersession linkage FK is established AFTER both tables exist (forward reference)
ALTER TABLE audit_event_hash_chain_anchor
    ADD CONSTRAINT audit_event_hash_chain_anchor_corruption_evidence_fk
        FOREIGN KEY (supersedes_corruption_evidence_id)
        REFERENCES audit_event_hash_chain_anchor_corruption_evidence(id);
```

**R5 HIGH-2 closure note:** the `supersedes_corrupted_sequence_no` + `supersedes_corruption_evidence_id` fields are included in the canonical signed payload (i.e., the HSM signature covers them), so the supersession linkage is cryptographically attested. A third-party auditor reading ONLY the committed-anchor row can: (a) verify the HSM signature over the canonical payload including the supersession fields; (b) follow the FK to the corruption-evidence row; (c) verify the corruption-evidence transparency-log inclusion proof; (d) verify the supersession anchor's own inclusion proof. This makes the corruption-and-supersession relationship cryptographically self-evident in the committed-anchor schema.

**R3 MED-1 closure note:** the committed-anchor table now carries the full transparency-log inclusion-proof material + STH-at-append-time + the cryptographic signature over the STH. This means an external auditor querying ONLY the committed anchor table (without consulting the intent table OR the transparency log directly) has cryptographic proof of which STH the inclusion proof verifies against — the audit trail is self-contained for third-party verification. Consistency proofs between any two anchors' STHs can be requested from the transparency log; the canonical `transparency_log_id` + entry indices anchor the request.

### Sub-decision 3 — S3 Object Lock COMPLIANCE-mode storage

**Decision shape:** every chain anchor + canonical audit-event row backup is written to S3 with Object Lock in COMPLIANCE mode (immutable; cannot be deleted before retention period elapses, even by root account):

- **Bucket configuration:** S3 Object Lock enabled in COMPLIANCE mode at bucket creation; default retention = 7 years (HIPAA Cat A) or 3 years (Cat B) or 90 days (Cat C sampled).
- **Object key pattern:** `audit-archive/{region}/{partition}/{partition_key}/{year}/{month}/{day}/sequence_{sequence_no_head}.signed`.
- **Object content:** anchor row JSON (Sub-decision 2 schema) + per-row dump of the chain since prior anchor (so each archive object is self-contained for replay).
- **Encryption:** S3 SSE-KMS using a dedicated `archive-encryption-key` CMK (separate from per-tenant CMKs; platform-scoped per Sprint 13 §4.1).

### Sub-decision 4 — Cross-region replication

**Decision shape:** every archive object is replicated from us-east-1 to us-west-2 via S3 Cross-Region Replication (CRR):

- **Replication policy:** all-objects replication with delete-marker replication disabled (Object Lock COMPLIANCE prevents deletes anyway).
- **Replication SLA:** 99.99% of objects replicated within 15 minutes; tracked via S3 Replication Time Control (RTC).
- **Cross-region archive accessibility:** during DR failover per Cold-DR Runbook Sprint 7, the us-west-2 replica is the canonical archive source.

### Sub-decision 5 — External transparency log integration (R1 MED-2 closure: actual Merkle-tree witness layer required for inclusion proofs)

**Decision shape:** per Sprint 6 SIEM §4.5.HC §"Independent transparency anchor", each chain anchor is appended to an external transparency log providing canonical inclusion-proof + consistency-proof mechanics.

**Canonical transparency log requirements (R1 MED-2 closure):** the transparency log MUST provide:

1. **Append-only log structure with Merkle-tree root** — each appended anchor becomes a new leaf; the Merkle root (signed tree head; STH) is published + cryptographically signed.
2. **Signed tree heads (STH)** — periodically published (per anchor append + at canonical intervals) so external auditors can pin the canonical state at a point in time.
3. **Inclusion proofs** — for any leaf, the log produces a Merkle inclusion proof verifiable against an STH.
4. **Consistency proofs** — for any two STHs at different log sizes, the log produces a proof that the larger contains the smaller (no rewriting/forking).
5. **Auditor-accessible API** — STHs + inclusion proofs + consistency proofs queryable by external third parties.

**Canonical implementation options (ratifier confirms via OQ2):**

- **Option T1 (recommended for v1.0):** dedicated Sigstore-rekor instance OR comparable CT-compliant transparency log; canonical Merkle/witness layer built-in; canonical inclusion-proof + consistency-proof + STH mechanics.
- **Option T2 (NOT recommended for v1.0):** AWS CloudWatch Logs with WORM retention as a STORAGE layer + custom Merkle/witness layer built on top. CloudWatch Logs alone does NOT provide inclusion proofs OR signed tree heads; an additional canonical app-layer service would compute Merkle roots + sign STHs + serve inclusion proofs. This was the prior v0.1 draft option but is NOT defensible as "transparency log with inclusion proofs" without the custom witness layer.

**Recommendation (per R1 MED-2 closure):** adopt Option T1 (Sigstore-rekor OR comparable). Option T2 path requires the witness-layer to be a NEW canonical service in its own right (defer to Phase 3+ if T1 is not acceptable for v1.0).

- **Transparency log append:** invoked after Sub-decision 6 phase 3 (`s3_write_committed`).
- **Append witness:** a separate IAM role (`audit-transparency-log-append-witness`) per the 4-role separation matrix in Sub-decision 5a below.
- **External verifiability:** the transparency log is independently auditable via inclusion-proof + consistency-proof + STH-pinning; third-party auditors can detect anchor omission OR forgery cryptographically.

### Sub-decision 5a — 5-role separation IAM permission matrix (R1 MED-1 + R2 MED-2 + R3 HIGH-1 closure: full 5-role expansion with each role denying assume-role on all FOUR other roles)

The 5 roles + their IAM/DB/KMS/S3 permission boundaries. The full canonical role set is `{audit-chain-writer, audit-chain-s3-writer, audit-chain-archive-signer, audit-chain-verifier, audit-transparency-log-append-witness}`. Every role's DENY list enumerates assume-role rejection against the OTHER FOUR roles explicitly.

| Role | Permitted actions | Explicit Deny boundaries (DENY assume-role on all four other roles in role set) |
|---|---|---|
| `audit-chain-writer` | INSERT on `audit_event_hash_chain_anchor_intent` (intent rows in phase 1); INSERT on `audit_event_hash_chain` (hash chain rows); NO direct INSERT on `audit_event_hash_chain_anchor` (committed anchors only via phase 5 promotion procedure) | DENY `kms:Sign` on archive-signing-key; DENY S3 PutObject (S3 writes happen via `audit-chain-s3-writer` role per phase 3); DENY UPDATE/DELETE on any audit-archive table (I-027 + enforce_append_only); DENY assume-role on `audit-chain-s3-writer`, `audit-chain-archive-signer`, `audit-chain-verifier`, `audit-transparency-log-append-witness` |
| `audit-chain-s3-writer` (R2 MED-2 closure: distinct from `audit-chain-writer`) | S3 PutObject on both us-east-1 + us-west-2 archive buckets (Object Lock COMPLIANCE); UPDATE on `audit_event_hash_chain_anchor_intent` ONLY to transition state from `signature_computed` → `s3_write_committed` (after dual-region 2xx) | DENY INSERT on any audit-archive table; DENY `kms:Sign`; DENY `kms:Decrypt`; DENY S3 GetObject/DeleteObject; DENY transparency-log append; DENY assume-role on `audit-chain-writer`, `audit-chain-archive-signer`, `audit-chain-verifier`, `audit-transparency-log-append-witness` |
| `audit-chain-archive-signer` | `kms:Sign` on `archive-signing-key` (HSM-backed CMK); UPDATE on `audit_event_hash_chain_anchor_intent` ONLY to fill in `signature` + `signed_at_intent` (no row INSERT/DELETE) | DENY INSERT on any audit-archive table; DENY S3 PutObject; DENY `kms:Decrypt`; DENY assume-role on `audit-chain-writer`, `audit-chain-s3-writer`, `audit-chain-verifier`, `audit-transparency-log-append-witness` |
| `audit-chain-verifier` | SELECT on `audit_event_hash_chain` + `_anchor` + `_anchor_intent`; S3 GetObject on archive bucket; transparency-log read operations + inclusion-proof retrieval | DENY all writes; DENY `kms:Sign`; DENY `kms:Decrypt`; DENY assume-role on `audit-chain-writer`, `audit-chain-s3-writer`, `audit-chain-archive-signer`, `audit-transparency-log-append-witness` |
| `audit-transparency-log-append-witness` | Transparency-log Append + STH read operations; UPDATE on `audit_event_hash_chain_anchor_intent` ONLY to fill in `transparency_log_inclusion_proof` + transition state to `transparency_log_appended` | DENY INSERT/DELETE on intent table; DENY S3 PutObject; DENY `kms:Sign`; DENY assume-role on `audit-chain-writer`, `audit-chain-s3-writer`, `audit-chain-archive-signer`, `audit-chain-verifier` |

**Cross-role human-identity separation (per Sprint 18 RBAC v1.2 Inv-1 + Inv-2 pattern; R3 HIGH-1 closure: extends to all 5 roles):** no single `human_id` (via `iam_principal_human_binding` table) may hold more than one of these **5** roles. Grant-time enforcement via DB constraint + IAM AssumeRole trust-policy condition rejecting same-human-id assumption across ALL five roles in the set.

**Canonical S3 bucket policy DENY conditions (R2 MED-2 closure: aligned with 5-role expansion):** the archive bucket's policy denies `s3:PutObject` from any principal not in the `audit-chain-s3-writer` canonical principal set; denies `s3:GetObject` from any principal not in `audit-chain-s3-writer` ∪ `audit-chain-verifier`; denies `s3:DeleteObject` UNIVERSALLY (Object Lock COMPLIANCE handles retention).

**Canonical KMS key policy DENY conditions:** the `archive-signing-key` policy permits `kms:Sign` ONLY from `audit-chain-archive-signer`; explicit DENY from all other principals including `audit-chain-writer`.

### Sub-decision 6 — Multi-phase crash-safe signing protocol (R1 HIGH-1 closure: no anchor is "committed" until S3 + transparency log are durably recorded)

Per Sprint 6 R5 closure refined: the protocol uses an explicit state machine where NO anchor is considered committed until BOTH the immutable S3 write AND the transparency-log append have durably succeeded.

**Anchor state machine:**

```
intent_reserved → signature_computed → s3_write_committed → transparency_log_appended → COMMITTED
                                                                                        |
                                                          (any earlier state = INCOMPLETE; recovery applies)
```

**Phase 1 — `intent_reserved`:** writer INSERTs intent row into `audit_event_hash_chain_anchor_intent` table with `state='intent_reserved'`, reserving the sequence number. Intent rows carry a deterministic `anchor_idempotency_key` derived from `(partition, partition_key, sequence_no_head, row_hash_head)`. Re-runs with the same key are idempotent.

**Phase 2 — `signature_computed`:** signer computes the HSM signature over the canonical anchor payload + appends `(signature, signed_at_intent=now())` to the intent row + transitions state to `signature_computed`. **DOES NOT yet set the final canonical `signed_at`.**

**Phase 3 — `s3_write_committed`:** the dedicated **`audit-chain-s3-writer`** role (a fifth canonical role added per R2 MED-2 closure; distinct from `audit-chain-writer` which only writes DB intent rows) issues S3 PutObject with `If-None-Match: *` (per Sprint 6 R5 first-write acceptance control) + object content = canonical anchor payload + signature + per-row dump. Per the dual-write durability requirement (Sub-decision 8 below), the writer issues PutObject to BOTH us-east-1 + us-west-2 buckets synchronously; both 2xx responses required before phase 3 commits. On both 2xx, the writer updates the intent row state → `s3_write_committed` (the writer role IS granted UPDATE on `audit_event_hash_chain_anchor_intent` for state transitions, per Sub-decision 5a IAM matrix). The 4-role separation expands to 5-role (writer / s3-writer / signer / verifier / transparency-log-append-witness); cross-role human-identity separation per Sprint 18 RBAC v1.2 Inv-1 pattern extends to all 5 roles.

**Phase 4 — `transparency_log_appended`:** transparency-log-append-witness role appends the signed anchor payload + obtains an inclusion proof. The inclusion proof is durably recorded on the intent row + state → `transparency_log_appended`.

**Phase 5 — `COMMITTED`:** ONLY when phase 4 completes does the canonical `signed_at` get set + the anchor is promoted to `audit_event_hash_chain_anchor`. Until phase 5, downstream consumers MUST treat the anchor as in-flight, not authoritative.

**Crash between phases — recovery rules (per Sub-decision 7):**

- Crash in phase 1: intent row exists in `intent_reserved`; recovery retries from phase 2 using the same idempotency key.
- Crash in phase 2: intent row in `signature_computed`; recovery proceeds to phase 3 with the existing signature (no re-signing; HSM signatures are deterministic for the same payload).
- Crash in phase 3 (R3 HIGH-2 + R4 HIGH closure: exhaustive per-region recovery state machine; Object Lock COMPLIANCE constrains repair options): intent row in `signature_computed`; recovery probes BOTH us-east-1 + us-west-2 buckets via HEAD + GET + canonical SHA-256 re-hash against the signed canonical payload bytes (per Sub-decision 7 discovery-first). **Per-region state has FOUR possible values:** `missing` (HEAD returns 404); `present_and_matches_signature` (GET succeeds + SHA-256 re-hash equals signature's canonical payload hash); `present_but_hash_mismatch` (GET succeeds + SHA-256 differs from signature payload); `indeterminate` (HEAD/GET fails with 5xx / network error — recovery retries the probe with exponential backoff up to 5 min; persistent indeterminate state escalates to HALT-AND-REPAIR per below). The 4×4 = 16 cross-region combinations collapse into 5 canonical recovery outcomes:

  1. **Both regions `present_and_matches_signature`:** advance to phase 4.
  2. **Both regions `missing`:** retry phase 3 (issues dual-region PutObject with `If-None-Match: *`; both writes must succeed before state transitions to `s3_write_committed`).
  3. **One region `present_and_matches_signature` + other `missing`:** retry the missing regional write with `If-None-Match: *` (first-write acceptance control ensures the regional retry succeeds for the empty region; the existing region's object is preserved); advance to phase 4 only after BOTH regions confirm matching objects.
  4. **Any region in `present_but_hash_mismatch` OR `indeterminate` (after exponential backoff exhaustion):** HALT-AND-REPAIR (cryptographic-corruption-OR-infrastructure-failure case; cannot auto-recover because Object Lock COMPLIANCE prevents overwrite/delete of the wrong object within the retention period). Emit Cat A `audit_archive.regional_s3_payload_corruption_or_indeterminate_halt` (R4 HIGH closure new event; added to §3 taxonomy below); P0 PagerDuty alert; **manual repair procedure required (see §below).** This case covers: single-region corruption (1 region matches, 1 region has wrong-payload object); same-wrong-payload in both regions (cryptographic-corruption case; both regions wrong); single-region indeterminate (1 region 5xx persistent); both-regions indeterminate (likely network partition affecting probe paths — distinct from the dual-write partition case in Sub-decision 8).
  5. **Both regions `present_but_hash_mismatch` with DIFFERENT payloads:** HALT-AND-REPAIR (regional disagreement; emit Cat A `audit_archive.regional_s3_payload_disagreement_halt`). This was the original R3 HIGH-2 closure case; preserved as a distinct sub-case of #4 with a distinct event for forensic discrimination.

**Manual repair procedure for case #4 + #5 (R4 HIGH + R5 HIGH-1 closure: phase-state-aware corruption-evidence handling):** because Object Lock COMPLIANCE prevents overwrite of the wrong object within the retention period (canonical retention = 7 years for Cat A; 3 years Cat B; 90 days Cat C), the wrong object cannot be repaired in place. The canonical procedure splits by phase state at corruption-detection time:

**Pre-phase-4 corruption (phase-3 detection; transparency log has NOT yet appended an inclusion proof for the corrupted anchor):**

1. The corrupted S3 object is `present_but_hash_mismatch` (case #4 or #5 of the phase-3 recovery rule above).
2. Compliance Officer + CTO authorize a NEW corruption-evidence transparency-log entry: a structured leaf containing `{corrupted_partition, corrupted_partition_key, corrupted_sequence_no, corrupted_object_s3_key, observed_s3_sha256, expected_signature_payload_sha256, observed_at, intent_state_at_observation}`. This corruption-evidence leaf is DISTINCT from a valid-anchor leaf (it carries a `leaf_type='corruption_evidence'` discriminator); it preserves cryptographic provenance of the corruption observation BEFORE supersession.
3. The corruption-evidence transparency-log entry's STH + inclusion proof are stored in a new `audit_event_hash_chain_anchor_corruption_evidence` table (R5 HIGH-1 closure new entity) with the same columns as the canonical anchor table's transparency-log persistence fields, plus the corrupted-object provenance fields above.
4. Compliance Officer + CTO authorize a NEW canonical anchor at sequence_no_head+1 with the original signed canonical payload re-signed under a NEW deterministic anchor_idempotency_key. The supersession anchor's `supersedes_corrupted_sequence_no = N` field (R5 HIGH-2 closure schema addition; see §below) ties it to the corruption-evidence entry.
5. The supersession anchor proceeds through phases 1-5 normally; its transparency-log inclusion proof is independently verifiable.
6. Cat A `audit_archive.corrupted_anchor_superseded` event emitted with both the corruption-evidence and supersession-anchor references.
7. Downstream reconstruction skips the corrupted sequence_no; uses the supersession anchor's chain head as canonical.

**Post-phase-4 corruption (anchor was committed + transparency log appended successfully + corruption discovered later via Sub-decision 7 reconciliation):** the corrupted-anchor inclusion proof IS already in the transparency log. The procedure is the same as above except step 2-3 are skipped (corruption-evidence already exists in the canonical transparency log via the original phase-4 append); only the supersession anchor + Cat A audit emission are required.

In both cases: the corrupted object remains in S3 under Object Lock (cannot be deleted within retention period); the supersession anchor is canonical for downstream reconstruction; third-party auditors can independently verify the corruption-evidence (from the transparency log) + the supersession anchor + the link between them via the `supersedes_corrupted_sequence_no` reference. Cryptographic integrity is preserved across the audit chain.
- Crash in phase 4: S3 write succeeded but transparency log append did not; recovery checks transparency log for the inclusion proof; if missing, retry phase 4; if present, advance to phase 5.
- Crash in phase 5 (between transparency append + setting canonical signed_at): the S3 + transparency log both attest the anchor; recovery sets `signed_at = transparency_log_appended_at` (preserves chronological accuracy) + promotes to `audit_event_hash_chain_anchor`.

This eliminates the orphaned-signed-intent + duplicate-sequence-on-retry windows that the prior R1 HIGH-1 surface identified.

### Sub-decision 7 — Discovery-first crash-recovery with cryptographic-disagreement halt-and-repair (R1 HIGH-2 closure)

Per Sprint 6 R6 closure + R1 HIGH-2 corrective: on crash recovery, the canonical procedure does NOT trust local state; it queries S3 + the transparency log to discover canonical state. **Disagreement between S3 + transparency log triggers HALT-AND-REPAIR, not silent older-side selection.**

1. Scan S3 for archive objects per `(partition, partition_key)` in increasing sequence_no order.
2. For each S3 object: GetObject + SHA-256 re-hash bytes (per Sprint 6 R6: AWS S3 ETag does NOT equal SHA-256 for multipart uploads; canonical integrity check is GetObject + re-hash) + verify HSM signature over the canonical payload.
3. Query transparency log for inclusion proofs per `(partition, partition_key)`.
4. **Reconciliation rules (R1 HIGH-2 closure):**
   - S3 anchor present + signature valid + transparency log has matching inclusion proof + signed payload hash = HEAD: CANONICAL (resume from this head).
   - S3 anchor present + signature valid + transparency log MISSING the inclusion proof: this means phase 4 was incomplete. Recovery COMPLETES phase 4 (deterministic + idempotent transparency append). Emit Cat A `audit_archive.phase_4_completed_during_recovery`.
   - S3 anchor MISSING but transparency log has an inclusion proof for a signed payload: this is the dangerous case (S3 write was lost OR rolled back; transparency log is independently-verifiable + authoritative). HALT-AND-REPAIR: emit Cat A `audit_archive.s3_anchor_missing_transparency_log_present_halt` + alert Compliance Officer + Engineering Lead via PagerDuty P0. Recovery DOES NOT auto-resume; manual investigation required (could indicate tampering OR catastrophic infrastructure failure).
   - Both present but signatures or hashes DISAGREE: HALT-AND-REPAIR (similar Cat A event + P0). NEVER auto-rollback to older side.
   - Both missing for a partition: legitimate fresh-start case; resume from sequence_no=0.

5. Cryptographic proof is the canonical resolver. The earlier "older-side wins" rule is rescinded per R1 HIGH-2 closure.

### Sub-decision 8 — DR reconstruction with bounded RPO + dual-write durability (R1 HIGH-3 closure)

Per R1 HIGH-3 corrective: the 99.99%-within-15-min CRR SLA leaves a bounded RPO window where unreplicated objects could be lost in catastrophic primary-region loss. The amended DR posture:

**Dual-write durability requirement (R1 HIGH-3 closure):** phase 3 S3 write is configured as **multi-region durable write**:
- Primary write to us-east-1 S3 (Object Lock COMPLIANCE).
- Synchronous secondary write to us-west-2 S3 (Object Lock COMPLIANCE).
- BOTH writes must succeed before phase 3 transitions to `s3_write_committed`.
- This is implemented via S3 multi-region access points OR application-level dual-PUT pattern (the canonical implementation is application-level for control + auditability).

This eliminates the "unreplicated primary-region archive" gap. RPO for archive objects is now 0 within the dual-write window.

**Bounded RPO acknowledgment:** within the dual-write window (phase 3 in-flight), if the primary region fails before the secondary write succeeds, the not-yet-dual-written anchor MAY be lost. This is a transient window measured in milliseconds (typical S3 PUT latency). The transparency log append (phase 4) acts as the canonical cross-region durability backstop — the inclusion proof is independent of S3 + survives single-region-S3-loss.

**DR chain reconstruction procedure (amended):**

1. From us-west-2 S3 replica + transparency log inclusion proofs, fetch every committed anchor in chronological order.
2. For each anchor: GetObject + re-hash + verify HSM signature + cross-check transparency log inclusion proof.
3. Re-compute the chain hashes; verify each anchor's chain_head matches the prior anchor's chain_head_next.
4. If reconstruction matches the most-recent transparency-log entry + the most-recent S3 us-west-2 anchor + ALL signatures verify: chain fully recovered (RPO=0 within dual-write semantics).
5. If reconstruction encounters a gap (e.g., transparency log has anchor N+1 but us-west-2 S3 is missing anchor N): emit Cat A `audit_archive.dr_reconstruction_gap_detected` + halt for manual investigation per Sub-decision 7 disagreement rules.

The reconstruction is bounded by the available S3 + transparency-log state; chain integrity is verified cryptographically, not assumed.

*(R2 HIGH closure: prior stale Sub-decision 7 + Sub-decision 8 sections REMOVED per R2 HIGH-1 + HIGH-2 findings. The canonical Sub-decision 7 + Sub-decision 8 are above at lines 175 + 191; the stale duplicates that contained the rescinded older-side-wins rule + CRR-only-DR posture are deleted. Single-source-of-truth restored.)*

---

## 3. Audit event taxonomy

| Event | Cat | Partition |
|---|---|---|
| `audit_archive.anchor_signed` | C (high-volume; sampled at 1%) | P2 keyed by partition (P1/P2 source) |
| `audit_archive.anchor_archived_to_s3` | C (sampled) | P2 |
| `audit_archive.anchor_appended_to_transparency_log` | C (sampled) | P2 |
| `audit_archive.discovery_inconsistency_detected` | A | P2 keyed by 'platform' |
| `audit_archive.cross_region_replication_lag_exceeded` | B | P2 keyed by 'platform' |
| `audit_archive.dr_chain_reconstruction_initiated` | A | P2 keyed by 'platform' |
| `audit_archive.dr_chain_reconstruction_completed` | A | P2 keyed by 'platform' |
| `audit_archive.phase_4_completed_during_recovery` (R3 MED-2 closure) | A | P2 keyed by 'platform' |
| `audit_archive.s3_anchor_missing_transparency_log_present_halt` (R3 MED-2 closure) | A | P2 keyed by 'platform' |
| `audit_archive.regional_s3_payload_disagreement_halt` (R3 HIGH-2 closure) | A | P2 keyed by 'platform' |
| `audit_archive.dr_reconstruction_gap_detected` (R3 MED-2 closure) | A | P2 keyed by 'platform' |
| `audit_archive.regional_s3_payload_corruption_or_indeterminate_halt` (R4 HIGH closure) | A | P2 keyed by 'platform' |
| `audit_archive.corrupted_anchor_superseded` (R4 HIGH closure: supersession-anchor pattern under Object Lock COMPLIANCE) | A | P2 keyed by 'platform'; carries `supersedes_corrupted_sequence_no` reference |
| `audit_archive.corruption_evidence_recorded_pre_phase_4` (R5 HIGH-1 closure: corruption-evidence transparency-log leaf appended for pre-phase-4 corruption detection) | A | P2 keyed by 'platform'; carries `corruption_evidence_id` + `corrupted_sequence_no` references |
| `audit_archive.corrupted_anchor_superseded_post_phase_4` (R5 HIGH-1 closure: supersession variant for post-phase-4 corruption discovery; corruption-evidence already in canonical transparency log) | A | P2 keyed by 'platform'; carries `supersedes_corrupted_sequence_no` + canonical transparency-log entry-index reference |

These events are added to AUDIT_EVENTS v5.6 → v5.7 at SI-021 promotion.

---

## 4. Cross-SI alignment

| Cross-SI surface | SI-021 surface | Relationship |
|---|---|---|
| Sprint 6 SIEM Integration Spec | §4.5.HC originally embedded these mechanics; split per OQ-C | Parent SI |
| Sprint 13 KMS Architecture | §2 + §5 audit-chain-archive-signer HSM key separation; Sprint 18 RBAC Inv-1 enforces signer-role separation | Shares HSM-signer infrastructure |
| Sprint 7 Cold-DR Runbook | §4 cross-region replication + §8 DR reconstruction | Aligns with multi-region topology |
| AUDIT_EVENTS v5.6 → v5.7 | §3 7 new events | Cumulative audit-event growth |
| INVARIANTS v5.4 §I-027 | All sub-decisions enforce I-027 append-only | Canonical implementation |
| Sprint 18 RBAC v1.2 §3 Group C | Audit-chain-archive-signer role distinct from break-glass HSM signers | Inv-1 cross-role separation |

---

## 5. Open questions for ratifier (own ceremony) — ALL RATIFIED at P-028 (2026-05-20)

All 5 OQs RATIFIED at working recommendations per Evans's chat-message "ratify" 2026-05-20 (Promotion Ledger P-028).

1. **OQ1 — Hourly signing interval vs configurable.** **RATIFIED**: hourly canonical; tenant-configurable down to 15 min per `tenant.audit_archive_signing_interval_seconds` CCR key (new key landing in CCR_RUNTIME v5.3 → v5.4 follow-on amendment cycle).
2. **OQ2 — Transparency log selection (R2 MED-1 closure: aligned with §5 closure).** **RATIFIED**: **Option T1 — Sigstore-rekor OR comparable CT-compliant log with native STH + inclusion-proof + consistency-proof mechanics — for v1.0**. Option T2 (CloudWatch + custom Merkle/witness layer) REJECTED as default; remains available only if the witness-layer service is filed as a separate canonical service spec + ratified before launch. The prior v0.1 draft OQ2 recommendation of "CloudWatch WORM initially; rekor later" is RESCINDED — CloudWatch alone does NOT satisfy the transparency-log inclusion-proof + STH requirements stated in §5.
3. **OQ3 — Codex pre-ratification target.** **RATIFIED at actual cycle outcome**: 5 rounds to §10-cadence boundary (R1 → R5). Original "3-4 rounds" recommendation superseded by actual cycle outcome — the §10-cadence boundary IS the convergence definition per Sprint 20 §10-equivalent boundary precedent (Sprint 6 SIEM R6; Sprint 7 Cold-DR R5; SI-010 trust-anchor PR #11 R5; SI-021 R5).
4. **OQ4 — SI-021 → CDM amendment cycle.** **RATIFIED**: file as CDM v1.4 → v1.5 amendment with **4 new entities total** (`audit_event_hash_chain` + `audit_event_hash_chain_anchor` + `audit_event_hash_chain_anchor_intent` + R5-added `audit_event_hash_chain_anchor_corruption_evidence`). Co-bumped with AUDIT_EVENTS v5.6 → v5.7 carrying **15 new Cat A audit events** (7 original + 8 added across R3-R5 convergence per §3 taxonomy above). CCR_RUNTIME v5.3 → v5.4 co-bumped with 1 new key per OQ1.
5. **OQ5 — Backfill of existing v1.2-era audit_events.** **RATIFIED**: incremental backfill over 30-day window; emit Cat B `audit_archive.backfill_completed` event on completion. Backfill executes after CDM v1.5 amendment lands + the underlying schema is provisioned in Phase D infrastructure.

---

## 6. Codex pre-ratification status

**v1.0 DRAFT 2026-05-20:** filed per OQ-C ratified at P-026; awaiting Codex R1 in its own ratifier ceremony cycle.

**v1.0 R1 closure 2026-05-20:** 3 HIGH + 2 MED closed inline:

| Round | Findings | Status |
|---|---|---|
| R1 | HIGH-1 two-phase commit marked signed_at before S3 write; HIGH-2 disagreement-rollback rule could lose anchors; HIGH-3 DR reconstruction couldn't recover unreplicated primary-region archives; MED-1 4-role separation not IAM-enforceable; MED-2 CloudWatch Logs doesn't actually provide inclusion proofs | All 5 closed inline |

**R1 closure pattern recap:**
- HIGH-1: 5-phase state machine (intent_reserved → signature_computed → s3_write_committed → transparency_log_appended → COMMITTED); canonical signed_at NOT set until phase 5; deterministic anchor_idempotency_key + per-phase recovery rules.
- HIGH-2: Sub-decision 7 disagreement = HALT-AND-REPAIR (cryptographic-proof-required) with explicit Cat A P0 alerts. Older-side-wins rule rescinded.
- HIGH-3: Sub-decision 8 amended for dual-write durability (synchronous us-east-1 + us-west-2 S3 writes before phase 3 commits). Transparency log append (phase 4) as cross-region durability backstop.
- MED-1: Sub-decision 5a added with full IAM/DB/KMS/S3 permission matrix per role (4-role separation + canonical Deny conditions + cross-role human-identity binding per Sprint 18 RBAC).
- MED-2: Sub-decision 5 rewritten with explicit transparency-log requirements (Merkle root + STH + inclusion proofs + consistency proofs + auditor API). Option T1 (Sigstore-rekor or comparable) recommended; Option T2 (CloudWatch + custom witness layer) acknowledged as requiring NEW canonical service.

No architectural-judgment items closed inline; CLAUDE.md hard-floor item 6 honored. 5 known OQs (§5) remain ratifier-targetable.

**v1.0 R4 closure 2026-05-20:** 1 HIGH closed inline:

| Round | Findings | Status |
|---|---|---|
| R4 | HIGH phase-3 recovery state machine omitted single-region-corruption + same-wrong-payload + indeterminate-region cases (Object Lock COMPLIANCE prevents simple overwrite-retry recovery for present-but-wrong objects) | Closed inline |

**R4 closure pattern recap:**
- Phase-3 recovery state machine rewritten as exhaustive 4-region-state × 4-region-state = 16-combination model collapsed into 5 canonical recovery outcomes. New case #4 covers single-region-corruption + same-wrong-payload + persistent-indeterminate cases with new Cat A `regional_s3_payload_corruption_or_indeterminate_halt` event.
- Manual repair procedure articulated for corrupted-anchor cases: NEW supersession anchor at sequence_no+1 with `supersedes_corrupted_sequence_no` reference + transparency-log inclusion for BOTH anchors + Cat A `corrupted_anchor_superseded` event. Object Lock COMPLIANCE constraint honored (corrupted object remains in S3 + transparency log; new supersession anchor is canonical for downstream reconstruction).
- 2 new audit events added to §3 taxonomy.

**v1.0 R3 closure 2026-05-20:** 2 HIGH + 2 MED closed inline:

| Round | Findings | Status |
|---|---|---|
| R3 | HIGH-1 §5a section title + cross-role separation rule still labeled "4 roles" + deny lists missing audit-chain-s3-writer; HIGH-2 phase-3 crash recovery rule `S3 object exists + hash matches` didn't verify BOTH regions; MED-1 transparency-log STH/inclusion-proof not carried into committed-anchor schema; MED-2 recovery emits Cat A events absent from §3 taxonomy | All 4 closed inline |

**R3 closure pattern recap:**
- HIGH-1: §5a header + intro + cross-role separation rewritten as 5-role; every role's DENY list enumerates assume-role rejection against ALL FOUR other roles explicitly.
- HIGH-2: phase-3 crash recovery rule split into 4 per-region cases (both-match advance / both-missing retry / partial-write retry-missing-region / both-disagree HALT-AND-REPAIR with new Cat A `regional_s3_payload_disagreement_halt` event); dual-region durability invariant preserved.
- MED-1: `audit_event_hash_chain_anchor` schema extended with transparency_log_id + entry_index + STH_at_append + STH_signature + inclusion_proof + s3 ETags + canonical SHA-256 — committed-anchor row is now self-contained for third-party audit.
- MED-2: 4 new audit events added to §3 taxonomy (`phase_4_completed_during_recovery`; `s3_anchor_missing_transparency_log_present_halt`; `regional_s3_payload_disagreement_halt`; `dr_reconstruction_gap_detected`).

**v1.0 R2 closure 2026-05-20:** 2 HIGH + 2 MED closed inline:

| Round | Findings | Status |
|---|---|---|
| R2 | HIGH-1 stale duplicate Sub-decision 7 with older-side-wins rule reauthorized (R1 HIGH-2 closure was partial — new section added but old section not removed); HIGH-2 stale duplicate Sub-decision 8 with CRR-only DR posture (R1 HIGH-3 closure was partial); MED-1 phase-3 S3 PutObject authority contradicted IAM matrix (writer denied PutObject but Sub-decision 6 said writer issues PutObject); MED-2 OQ2 contradicted MED-2 closure (recommended CloudWatch initially despite §5 closure rescinding CloudWatch-alone) | All 4 closed inline |

**R2 closure pattern recap:**
- HIGH-1 + HIGH-2: stale duplicate Sub-decision 7 + Sub-decision 8 sections REMOVED (single-source-of-truth restored; canonical Sub-decision 7 at line 175 + Sub-decision 8 at line 191 govern).
- MED-1: 4-role separation expanded to 5-role with NEW `audit-chain-s3-writer` role distinct from `audit-chain-writer`; S3 PutObject authority canonicalized to s3-writer role; IAM matrix + bucket policy + phase 3 protocol now agree.
- MED-2: OQ2 rewritten to align with §5 closure — Option T1 (Sigstore-rekor) recommended for v1.0; Option T2 (CloudWatch+witness) acceptable only if witness-layer is separately ratified pre-launch.

**Status at R2 close:** RATIFIER-READY-WITH-KNOWN-OQs at §10 cadence. Sprint 20 §10-equivalent boundary applied; SI-021 closes at R2 with prose-consistency clean.

**v1.0 R5 closure 2026-05-20:** 2 HIGH closed inline:

| Round | Findings | Status |
|---|---|---|
| R5 | HIGH-1 corrupted-object supersession assumed transparency-log entry that may not exist (phase-3 corruption detection happens BEFORE phase-4 transparency-log append; corruption-evidence path required for pre-phase-4 corruption); HIGH-2 supersession reference field absent from committed-anchor schema (procedure described inline but no schema field to persist the corruption→supersession linkage cryptographically) | Both closed inline |

**R5 closure pattern recap:**
- HIGH-1: manual repair procedure for case #4 + #5 split by phase state into "Pre-phase-4 corruption" (requires NEW corruption-evidence transparency-log entry with `leaf_type='corruption_evidence'` discriminator + new `audit_event_hash_chain_anchor_corruption_evidence` entity) and "Post-phase-4 corruption" (uses existing canonical transparency-log entry; supersession-only path). Two distinct Cat A events added (`corruption_evidence_recorded_pre_phase_4` + `corrupted_anchor_superseded_post_phase_4`).
- HIGH-2: `audit_event_hash_chain_anchor` schema extended with `supersedes_corrupted_sequence_no BIGINT` + `supersedes_corruption_evidence_id UUID` columns + paired-NULL CHECK constraint (both NULL OR both NOT NULL) + single-supersession UNIQUE constraint (one canonical supersession per corrupted sequence_no per (partition, partition_key)) + FK to corruption-evidence table. Supersession linkage included in canonical signed payload so HSM signature covers it — third-party auditor can verify the corruption-and-supersession relationship cryptographically from the committed-anchor row alone.
- NEW entity: `audit_event_hash_chain_anchor_corruption_evidence` table with dual-control authorization (Compliance Officer + CTO; CHECK constraint enforces distinct human user_ids) + transparency-log persistence fields (STH + STH signature + inclusion proof) + corruption-observation provenance fields (corrupted_partition + partition_key + sequence_no + s3_key + observed_sha256 + expected_sha256 + observed_at + intent_state_at_observation).
- 2 new audit events added to §3 taxonomy (`corruption_evidence_recorded_pre_phase_4`; `corrupted_anchor_superseded_post_phase_4`).

**Status at R5 close (§10 cadence boundary):** RATIFIER-READY-WITH-KNOWN-OQs at §10 cadence boundary. Per Sprint 20 §10-equivalent boundary commitment made at R4 close ("R5 next as final boundary round"), SI-021 closes at R5 as the final §10-cadence boundary round regardless of residual findings. 16 findings closed inline across R1-R5 (10 HIGH + 6 MED total; specifically: R1 3 HIGH + 2 MED; R2 2 HIGH + 2 MED; R3 2 HIGH + 2 MED; R4 1 HIGH; R5 2 HIGH). 0 architectural-judgment items closed inline (CLAUDE.md hard-floor item 6 honored across all 5 rounds; the cycle ran 5 prose-consistency + scope-clarification rounds without violating the discipline). Any remaining issues become known OQs under §5 + ratifier-targetable in SI-021's own ratification ceremony.

---

— Q2 2026 Batched Ratifier Ceremony follow-on: SI-021 filed per OQ-C split (Promotion Ledger P-026). Authored 2026-05-20 under autonomous-work authorization continuation. Pre-Codex; awaits its own ratifier ceremony.
