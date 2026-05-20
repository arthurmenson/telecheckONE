# SI-021 — SIEM Hash-Chain Archival Spec

**Version:** 1.0 DRAFT (authored 2026-05-20; pending its own Codex pre-ratification + ratifier ceremony)
**Status:** FILED per OQ-C ratified decision at Promotion Ledger P-026 (SIEM §4.5.HC split as separate SI to keep SIEM Spec proper focused on event-streaming + alerting + audit aggregation)
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
    CONSTRAINT audit_event_hash_chain_anchor_unique UNIQUE (partition, partition_key, sequence_no_head)
);
```

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

### Sub-decision 5 — External transparency log integration

**Decision shape:** per Sprint 6 SIEM §4.5.HC §"Independent transparency anchor", each chain anchor is additionally appended to an external transparency log (Certificate-Transparency-style append-only verifiable log; e.g., AWS CloudWatch Logs in dedicated `audit-transparency-log` log group with immutable retention OR external Sigstore-rekor instance):

- **Transparency log append:** invoked after Sub-decision 2 signing completes + Sub-decision 3 S3 write succeeds.
- **Append witness:** a separate IAM role (`audit-transparency-log-append-witness`) writes to the transparency log; the writer + signer + verifier + transparency-log-append-witness are 4 distinct IAM identities per Sprint 6 R4 closure.
- **External verifiability:** the transparency log is independently auditable; third-party auditors can detect anchor omission OR forgery via the log's inclusion-proof mechanism.

### Sub-decision 6 — 2-phase crash-safe signing protocol

**Decision shape (per Sprint 6 R5 closure):** signing protocol is 2-phase to handle crashes between Sub-decision 2 sign + Sub-decision 3 S3 write:

- **Phase 1 (intent):** writer INSERTs intent row into `audit_event_hash_chain_anchor_intent` table with `signed_at=NULL`. Intent rows are reserved sequence numbers.
- **Phase 2 (commit):** signer signs the chain head; writes signature back to intent row + sets `signed_at=now()`. S3 write happens AFTER signed_at is set.
- **Crash between phases:** discovery-first crash-recovery per Sub-decision 7 reconciles intent rows without committed signatures.

### Sub-decision 7 — Discovery-first crash-recovery

**Decision shape (per Sprint 6 R6 closure):** on crash recovery, the canonical procedure does NOT trust local state; it queries S3 + the transparency log to discover canonical state:

1. Scan S3 for the most-recent committed archive object per `(partition, partition_key)`.
2. GetObject + re-hash bytes to verify integrity (per Sprint 6 R6: webhook returns ETag not SHA-256, so we re-hash).
3. Query transparency log for the most-recent inclusion proof per `(partition, partition_key)`.
4. Reconcile: if S3 + transparency log agree, that's canonical; if they disagree, the older of the two is canonical + the discrepancy emits Cat A `audit_archive.discovery_inconsistency_detected` event.
5. Resume signing/archiving from the discovered canonical head + sequence_no.

### Sub-decision 8 — Disaster-recovery hash-chain reconstruction

**Decision shape:** in catastrophic primary-region data loss, the hash chain can be reconstructed from:

1. The S3 us-west-2 replica (canonical archive source post-failover).
2. The transparency log (independent verifiability anchor).
3. The hourly anchor signatures (canonical chain heads).

The procedure walks every anchor in sequence order, fetches the per-row dump from each archive object, re-computes the chain hashes, + verifies each anchor's HSM signature. If reconstruction matches the most-recent transparency-log entry, the chain is fully recovered.

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

## 5. Open questions for ratifier (own ceremony)

1. **OQ1 — Hourly signing interval vs configurable.** Recommendation: hourly canonical; tenant-configurable down to 15 min per `tenant.audit_archive_signing_interval_seconds` CCR key.
2. **OQ2 — Transparency log selection.** Recommendation: AWS CloudWatch Logs with `WORM` retention initially; evaluate external Sigstore-rekor at Phase 3+.
3. **OQ3 — Codex pre-ratification target.** Recommendation: 3-4 rounds.
4. **OQ4 — SI-021 → CDM amendment cycle.** Recommendation: file as CDM v1.3 → v1.4 amendment with 2 new entities (`audit_event_hash_chain` + `audit_event_hash_chain_anchor` + `audit_event_hash_chain_anchor_intent`).
5. **OQ5 — Backfill of existing v1.2-era audit_events.** Recommendation: incremental backfill over 30-day window; emit Cat B `audit_archive.backfill_completed` on completion.

---

## 6. Codex pre-ratification status

**v1.0 DRAFT 2026-05-20:** filed per OQ-C ratified at P-026; awaiting Codex R1 in its own ratifier ceremony cycle.

---

— Q2 2026 Batched Ratifier Ceremony follow-on: SI-021 filed per OQ-C split (Promotion Ledger P-026). Authored 2026-05-20 under autonomous-work authorization continuation. Pre-Codex; awaits its own ratifier ceremony.
