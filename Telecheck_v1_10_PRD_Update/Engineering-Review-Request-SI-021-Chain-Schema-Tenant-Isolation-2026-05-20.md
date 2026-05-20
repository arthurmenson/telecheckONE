# Engineering Review Request — SI-021 Chain-Schema Tenant-Isolation

**Date:** 2026-05-20
**Routed to:** Evans (workstream lead + ratifier-quorum lead) + Engineering Lead + CDM owner
**Author:** Claude (Opus 4.7, 1M context)
**Trigger:** Codex R1 adversarial review on CDM v1.4 → v1.5 amendment artifact (SI-021 follow-on) returned 1 CRITICAL finding proposing net-new canonical schema fields beyond SI-021 v1.0 RATIFIED §2 Sub-decision 1 scope. Per CLAUDE.md hard-floor item 6 discriminator (a), this is a hard STOP requiring ratifier escalation.
**Discipline anchor:** PR #11 worked example (SI-010 trust-anchor rejection). Codex finding NOT closed inline within the amendment artifact; escalation artifact (this ERR) authored to route the architectural-judgment decision to the ratifier quorum.

---

## 1. The question

Should the 4 new SI-021 chain-archival entities (`audit_event_hash_chain` + `audit_event_hash_chain_anchor_intent` + `audit_event_hash_chain_anchor` + `audit_event_hash_chain_anchor_corruption_evidence`) carry a direct `tenant_id` column + RLS policy + per-tenant KMS DEK binding?

**Codex R1 CRITICAL finding (verbatim):**

> Patient-bound chain metadata has no enforceable tenant boundary. The amendment says every PHI-bearing CDM entity gets tenant_id RLS and per-row keying, but the new chain schema immediately exempts audit_event_hash_chain from tenant_id and relies on parent audit_events RLS. That does not cover the anchor_intent, anchor, or corruption_evidence rows, which carry partition/partition_key and may represent P1 patient-bound chains without an audit_event_id parent. Inference: if partition_key contains patient_id for P1 chains, these rows become patient-bound metadata without tenant_id, so RLS and per-tenant KMS enforcement cannot be expressed directly and cross-tenant reads become a schema-level risk.

## 2. Why this is architectural-judgment + hard-floor item 6

**SI-021 v1.0 RATIFIED §2 Sub-decision 1 schema (canonical at P-028):**

```sql
CREATE TABLE audit_event_hash_chain (
    partition TEXT NOT NULL,
    partition_key TEXT NOT NULL,                   -- patient_id (P1) | tenant_id OR 'platform' (P2)
    sequence_no BIGINT NOT NULL,
    audit_event_id UUID NOT NULL,
    row_hash BYTEA NOT NULL,
    chained_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (partition, partition_key, sequence_no)
);
```

No `tenant_id` column. SI-021's RATIFIED §2 Sub-decisions 2-7 schemas for the anchor + intent + corruption-evidence tables similarly omit `tenant_id`.

**The amendment artifact this ERR escalates from:** mechanically reproduces the SI-021 v1.0 RATIFIED schema (faithful consolidation per OQ4 ratification). Codex's CRITICAL proposes net-new canonical schema fields (`tenant_id` + RLS + per-tenant KMS DEK binding) beyond SI-021's ratified scope.

**CLAUDE.md hard-floor item 6 discriminator (a):** "net-new canonical schema fields" beyond the ratified sub-decision scope is a hard STOP requiring ratifier escalation. The proper response is to author this escalation artifact rather than amend the schema inline.

## 3. Three options

### Option A — Add `tenant_id` + RLS to all 4 chain tables

**Schema delta:** add `tenant_id tenant_id_t NOT NULL` column + RLS policy `tenant_id = current_setting('app.tenant_id')::tenant_id_t` + per-tenant KMS DEK binding via Sprint 13 KMS Architecture key-keyring lookup to every chain table.

**Pros:**
- Direct row-level tenant enforcement at the chain projection layer. RLS works without join to parent `audit_events`.
- Aligns with the convergent canonical pattern across all v1.10+ entities (every PHI-bearing entity carries `tenant_id` + RLS).
- I-023 tenant isolation enforced at three layers (RLS + app filter + per-tenant KMS) on the chain itself, not just the parent audit table.
- Cross-tenant read risk eliminated at schema level (defense in depth).
- DR reconstruction can read chain rows directly without parent-table join.
- Platform-scoped P2 chains use sentinel `tenant_id = PLATFORM_TENANT_ID` per I-024 platform-record convention.

**Cons:**
- This is a schema amendment to SI-021's RATIFIED §2 Sub-decision 1 — requires either (a) re-ratifying SI-021 v1.0 → v1.1 OR (b) ratifier mini-review explicitly authorizing the amendment-cycle schema extension.
- Storage overhead: ~16 bytes per chain row (UUID tenant_id) × ~10⁹ audit events/year × 4 tables = ~64 GB/year per platform-instance. Non-trivial but tractable.
- Forces partition_key semantic to differ from the chain's per-(tenant_id, partition) keying — increases join complexity for downstream queries.
- Per-tenant KMS DEK binding on the chain projection requires DEK provisioning for `chained_at` writes — adds latency to the audit-event insert path.

### Option B — Ratify SI-021's tenant-id-less chain schema as canonical with audit_events FK as the sole tenant-binding

**Schema delta:** none beyond SI-021 v1.0 RATIFIED (chain tables remain tenant_id-less; tenant-binding is via FK to `audit_events.id` + parent-row RLS join).

**Pros:**
- Mechanical-consolidation faithful: no architectural amendment to SI-021's ratified scope.
- Storage minimal: no tenant_id column overhead.
- Simpler schema; partition_key remains the chain's primary semantic.
- Per-tenant KMS DEK binding inherited via parent audit_events row.

**Cons:**
- RLS on chain tables requires JOIN to parent audit_events at every read — performance + complexity cost.
- DR reconstruction cannot read chain rows directly; must reconstruct via parent table even if parent table is being rebuilt.
- I-023 tenant isolation depends on the FK + JOIN integrity at the application layer — a JOIN bug OR a parent-table-row deletion (would itself be I-027 violation but...) could open cross-tenant reads via the chain.
- Cross-tenant read defense is single-layer (FK + RLS join), not three-layer (RLS + app filter + per-tenant KMS at the chain itself).
- Verification independence: a third-party auditor reading ONLY the chain rows cannot verify tenant-scoping without consulting `audit_events` parent — weakens the chain's standalone verifiable property.

### Option C — Hybrid: tenant_id on P1 patient-bound chains only; platform-scoped P2 chains use partition_key='platform'

**Schema delta:** add `tenant_id tenant_id_t` column (nullable) + CHECK constraint requiring `tenant_id IS NOT NULL` when `partition = 'P1'` AND `partition_key NOT IN ('platform',)`. P2 chains keyed by 'platform' have `tenant_id = NULL`. RLS policy:

```sql
(tenant_id IS NULL AND partition = 'P2' AND partition_key = 'platform')
OR tenant_id = current_setting('app.tenant_id')::tenant_id_t
OR (current_user_role IS 'platform_operator' AND partition = 'P2')
```

**Pros:**
- Splits the difference: direct tenant enforcement on patient-bound P1 chains where it matters most (PHI exposure); platform-scoped P2 chains use the existing partition_key semantic.
- Storage overhead reduced vs Option A (P2 platform chains carry NULL tenant_id).
- Three-layer enforcement on P1 (which is the actual PHI exposure surface).
- Compatible with platform_operator break-glass reads on P2 chains.

**Cons:**
- More complex schema + RLS policy + CHECK constraint.
- Still a schema amendment to SI-021's RATIFIED §2 Sub-decision 1.
- Cognitive overhead: developers must understand the P1 vs P2 tenant-scoping distinction at the chain layer.
- partition_key semantic remains heterogeneous (patient_id for P1, tenant_id OR 'platform' for P2).

## 4. Recommendation

**Option A** at the canonical floor.

Rationale:
1. The convergent canonical pattern across the v1.10 cycle (per CLAUDE.md "every PHI record carries tenant_id" + I-023 platform-floor + I-027 audit append-only) sets the precedent: every PHI-bearing entity carries `tenant_id` + RLS directly. The chain projection IS PHI-adjacent (it indexes audit events that carry patient PHI). Option B's reliance on parent-table RLS join violates the precedent.
2. DR reconstruction is a first-class concern per SI-021 §2 Sub-decision 8 (DR chain reconstruction procedure). Option B's parent-table dependency makes DR reconstruction fragile.
3. Storage overhead (~64 GB/year) is tractable; defense-in-depth gain (cross-tenant read risk eliminated at schema level) is high-value.
4. P-028 ratified SI-021 v1.0 at working recommendations including OQ4 "file as CDM v1.4 → v1.5 amendment with 4 new entities". The amendment-cycle ratification authority covers "consolidation into CDM" — extending the consolidation to include the convergent canonical pattern (tenant_id + RLS) is within the spirit of the OQ4 working recommendation, though it requires explicit ratifier confirmation per this ERR.

If the ratifier prefers **Option C** (hybrid), I can implement that as an alternative inline closure with comparable rigor.

If the ratifier insists on **Option B** (tenant-id-less faithful consolidation), the amendment proceeds as-is for the CDM v1.5 promotion + an INVARIANTS amendment (new I-036 OR amended I-023) is needed to canonicalize the parent-table-RLS-join-as-sole-tenant-binding pattern for chain projection tables. The audit-trail consequence is that future amendment cycles must explicitly justify deviation from the "every PHI-bearing entity carries tenant_id" pattern when the entity is a projection from a tenant_id-bearing source.

## 5. Ratifier decision required

Evans + Engineering Lead + CDM owner: please choose A / B / C and respond on this ERR.

- **A**: I add `tenant_id` + RLS + per-tenant KMS DEK binding to all 4 chain tables in the amendment artifact + re-run Codex R2.
- **B**: I document the rationale for tenant-id-less chain schema in the amendment artifact + file a new INVARIANTS amendment to canonicalize the parent-table-binding pattern + re-run Codex R2.
- **C**: I implement the hybrid P1-only tenant_id with the conditional CHECK constraint + RLS policy as outlined in §3 above + re-run Codex R2.

**STOP-condition restated:** I will NOT close the CRITICAL inline by amending the schema without ratifier confirmation. This is the PR #11 discipline pattern. Closing this finding inline by iterating with prose changes within the same SI source-file would violate CLAUDE.md hard-floor item 6.

---

## 6. Codex independent recommendation (consult-framing invocation 2026-05-20)

Per the dual-recommendation process codified in CLAUDE.md (commit `f3a6469` on main), Codex was invoked with a consult-framing prompt on this ERR. Codex's full output preserved in task `btxzf4ges` output log.

**Codex's verdict: APPROVE Option A** (converges with Claude's recommendation).

**Codex's strongest argument:** "A is the only option that preserves I-023/I-027 literally: the invariant file says every PHI, audit, patient-identifying, or audit record carries tenant_id and is protected by RLS, app filtering, and per-tenant KMS. SI-021 makes P1 chain partition_key a patient_id and makes DR/discovery read by partition_key directly, so tenant-less chain metadata is not just a mechanical omission; it creates an exception to the platform floor."

**Codex's per-option deal-breaker analysis:**

| Option | Codex deal-breaker |
|---|---|
| A | None technically; only ratification-process cost |
| B | Disqualified unless ratifier amends/waives I-023 + I-027 for chain projections |
| C | Disqualified as written — leaves P2 tenant-governance chains ambiguous (P2 partition_key may be tenant_id OR 'platform'; Claude's Option C framing only covered the 'platform' case) |

**Considerations Claude's ERR missed (per Codex):** Option A must specify **consistency constraints, not just columns**:
1. P1 chain `tenant_id` must match `audit_events.tenant_id` (FK consistency).
2. P2 tenant-keyed chains must have `tenant_id = partition_key`.
3. P2 platform chains must use a platform sentinel or explicit platform-scope policy.

Claude's ERR also missed that Option C needed a third case for P2 tenant-governance chains (the framing collapsed P2 into platform-only, which is incorrect).

---

## 7. Ratifier decision (Evans, 2026-05-20)

**Evans's verbatim chat-message decision:** *"after we go with A consensus recommendation"* — affirmative ratification of **Option A** (consensus of Claude + Codex) following review of the dual-recommendation surfaced in this ERR + chat.

**Authority:** Evans (workstream lead + ratifier-quorum lead per CLAUDE.md). Mini-review ratification per the dual-recommendation process codified at `f3a6469`.

**Ratified canonical decision:** add `tenant_id tenant_id_t NOT NULL` column + RLS policy `tenant_id = current_setting('app.tenant_id')::tenant_id_t` + per-tenant KMS DEK binding to all 4 chain tables (`audit_event_hash_chain` + `audit_event_hash_chain_anchor_intent` + `audit_event_hash_chain_anchor` + `audit_event_hash_chain_anchor_corruption_evidence`).

**Consistency constraints (per Codex's missed-considerations, ratified as part of Option A):**

1. **P1 chain tenant_id matches audit_events.tenant_id** — enforced via FK constraint OR application-layer CHECK on INSERT (FK preferred since `audit_event_hash_chain.audit_event_id` already FKs `audit_events`; the tenant-match becomes a derived consistency rule expressed via paired-INSERT trigger OR application-layer assertion).
2. **P2 tenant-keyed chain tenant_id matches partition_key** — enforced via CHECK constraint: `(partition = 'P2' AND partition_key <> 'platform' AND tenant_id::TEXT = partition_key) OR (partition = 'P2' AND partition_key = 'platform' AND tenant_id = PLATFORM_TENANT_ID) OR (partition = 'P1')`.
3. **P2 platform chains use PLATFORM_TENANT_ID sentinel** — per I-024 platform-record convention (canonical platform-tenant sentinel UUID; same sentinel used across other v1.10-era platform-scoped entities).

**Effect on SI-021 v1.0 RATIFIED:** the chain-schema tenant-isolation amendment lands as an **extension** to SI-021's ratified §2 Sub-decisions 1-7 schemas via the CDM v1.5 amendment cycle's mini-review ratification (this ERR + Promotion Ledger entry P-028a). SI-021 v1.0's existing tenant-id-less schema is **superseded** for canonical implementation purposes; CDM v1.5 amendment artifact is the authoritative source for the chain-table schemas. SI-021 file is not edited (preserved as ratified at P-028 for traceability); supersession is recorded in this ERR + the CDM v1.5 amendment artifact's R1 closure narrative + the Promotion Ledger P-028a supplemental entry.

**R2 UNBLOCKED.** Claude proceeds with Option A implementation + Codex R2 verification.

---

— Claude (Opus 4.7, 1M context), Engineering Review Request authored 2026-05-20 per CLAUDE.md hard-floor item 6 STOP-and-escalate discipline + dual-recommendation process (codification trigger). Option A ratified by Evans 2026-05-20 chat-message "after we go with A consensus recommendation". Implementation + R2 verification proceeding.
