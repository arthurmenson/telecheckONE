# Engineering Review Request — P-040 R15: CTAS Categorical Block Scope (Hard-Floor Item 6)

**Date:** 2026-05-21
**Workstream:** P-040 CDM v1.9 → v1.10 + AUDIT_EVENTS v5.11 → v5.12 + OpenAPI v0.4 → v0.5 + State Machines v1.3 → v1.4 + RBAC v1.3 → v1.4 (SI-022 Crisis Response follow-on amendment)
**Spec branch:** `spec/P-040-cdm-v1.10-si-022-follow-on-2026-05-21` (HEAD `0d0cdcc` at v0.17 DRAFT POST-R14)
**Cycle round:** R15 (15 Codex adversarial-review rounds; 23 HIGH + 1 MED closures applied through R14; R15 surfaces a hard-floor item 6 architectural-judgment finding requiring ratifier escalation)
**Author:** Claude (Opus 4.7, 1M context)
**Adversarial reviewer:** Codex (codex@openai-codex)

---

## Hard-floor item 6 finding (Codex R15 verbatim)

**Verdict:** needs-attention; 1 HIGH

**Finding:** "Database-wide CTAS ban is introduced without platform-floor escalation. The R14 closure changes the event trigger from crisis-domain provenance control into a categorical database-wide block: every CREATE TABLE AS, SELECT INTO, and CREATE MATERIALIZED VIEW by any non-breakglass role is rejected regardless of whether the statement touches crisis data. That does close the SECDEF wrapper indirection class, but it also changes the authorization contract for the entire database, including unrelated analytics, migrations, reporting jobs, and future non-crisis slices. The document still states there are no new platform-floor invariants and treats this as an inline P-040 amendment. Inference: because the trigger is registered globally on ddl_command_start and filtered only by command tag, not schema/domain, this is a platform-wide DDL invariant, not a crisis-view-local guard. Shipping without ratifier/platform-floor escalation risks silently breaking non-crisis workloads and bypassing the governance process for global DB DDL policy."

**Codex's recommendation:** "Either obtain explicit ratifier/platform-floor approval and document the new database-wide CTAS/SELECT INTO/CREATE MV invariant, including impacted roles and migration/analytics exception process, or narrow the control back to crisis-domain objects with a separately proven authorization design."

---

## Why this triggers hard-floor item 6

Per CLAUDE.md "Autonomous-work authorization" hard-floor:

> "Any Codex finding that proposes net-new architecture, schema, or invariant amendment beyond the ratified sub-decision scope of the SI under review is a hard STOP requiring ratifier escalation. Do not close it inline."

The R14 closure changed a crisis-domain-local trigger into a cluster-wide DDL policy. Per the discriminator:

> "(c) net-new platform-floor primitives (DB roles, audit-chain partitions, role-elevation patterns, dedicated infrastructure instances, etc.)" — the categorical CTAS block IS a cluster-wide DDL-policy primitive.
> "(d) any amendment to a canonical contract surface that the SI under review has not already scoped as a sub-decision" — SI-022's Sub-decisions 1-7 do not include cluster-wide CTAS authorization.

The pattern matches PR #11 SI-010 R1 STOP-to-ratifier (CLAUDE.md `f3a6469` codified precedent): when Codex flags architectural-judgment beyond ratified scope, the response is escalate-to-ratifier, NOT iterate-inline.

---

## Cycle context (privilege-bypass closure thread)

The §8.1 deployment preflight DO block has accumulated ~14 distinct privilege-bypass assertion classes (A through M plus secondary G.2/G.3/H/I/J/K/L) across R1-R14 closures. The privilege-bypass closure thread is what produced the R14 categorical-block conclusion:

| Round | Finding class | Closure |
|---|---|---|
| R1 HIGH-2 | crisis_event_reader over-broad grant | split into staff_reader + patient_reader + 2 views; data-minimization split per P-038 R5 |
| R2 | endpoint dispatch + Phase 7 grant matrix incomplete | rewrote §5 endpoint table + Phase 7 split-grant |
| R3 HIGH-1 | grant matrix 5-point check missed PUBLIC | class G.1 allowlist |
| R4 HIGH-1 | grant allowlist missed pg_auth_members inheritance | class G.2 role-membership closure |
| R5 HIGH-1+2 | G.2 used undefined table + one-hop only | hardcoded allowlist + WITH RECURSIVE transitive closure |
| R6 HIGH-1+2 | preflight ignored pg_read_all_data + BYPASSRLS + SECDEF view deps | classes H + I |
| R7 HIGH-1+2+3 | class I missed dynamic SQL + no derived-relation check + view-owner not asserted | classes J + K + L |
| R8 HIGH-1+2 | class K catalog-wrong + no view-def integrity | class K rewrite + Phase 7.1 CTAS event trigger + class M view-def text scan |
| R9 HIGH-1 | CTAS trigger spec non-implementable (wrong PG API) | executable trigger DDL + behavioral preflight + Phase 7.1.a synthetic test role |
| R10 HIGH-1 | pg_temp not valid MV target | scratch schema `crisis_preflight_scratch` |
| R11 HIGH-1 | SET ROLE precondition unsatisfied | GRANT test_role TO cdm_owner + pg_has_role precondition |
| R12 HIGH-1 | false-positive via PG normal view perm check | dedicated SQLSTATE CR022 + Phase 7.1.a step (3a) minimal SELECT |
| R13 HIGH-1+2 | function-indirection bypass + Phase 7.1.a sequencing | trigger dual-detection + Phase 7.2 reorder |
| R14 HIGH-1 | SECDEF wrapper indirection bypasses both detection branches | **categorical CTAS block (THE escalation trigger)** |

The cycle has reached the architectural-judgment boundary: closing R14 inline via narrower detection (function resolution + body walk) is brittle and incomplete; the categorical block IS the right technical answer but exceeds the SI's scope.

---

## Options for ratifier (Evans + Engineering Lead + CDM owner)

### Option A — Ratify R14 categorical CTAS block as a new platform-floor invariant

Add I-036 (or next available) to Contracts Pack v5.3 INVARIANTS:

> **I-036: CTAS / SELECT INTO / CREATE MATERIALIZED VIEW are restricted to break-glass-admin roles only.** Non-breakglass roles MUST NOT use these 3 DDL commands in any database where I-036 is in effect. Enforced via the `crisis_view_ctas_provenance_block` event trigger at `ddl_command_start` (renamed to `ctas_categorical_block` once promoted to invariant scope). Rationale: prevents persistent copies of any sensitive data outside the canonical grant/RLS boundary via CTAS-class commands, where statement-level + caller-capability + SECDEF-indirection detection is structurally incomplete.

**Pros:**
- Strictly stronger; closes SECDEF wrapper indirection cleanly + structurally.
- Future-proofs against bypass classes Codex hasn't yet found.
- Symmetric with existing platform-floor invariants on audit-trail / RLS / I-019 crisis detection.

**Cons:**
- Scope creep beyond P-040 SI-022 follow-on into platform-wide invariant amendment.
- Affects ALL workloads cluster-wide: analytics jobs, reporting MV refreshes, migration utilities, future slice work that wants CTAS.
- Requires break-glass-admin operator to perform all routine analytics MV refreshes (operational burden + audit-trail volume).
- Trigger must be promoted from P-040 amendment scope into a Contracts Pack invariant artifact + cross-bundle cascade.

**Migration / analytics exception process** (if Option A chosen): all CTAS-class commands route through break-glass-admin role via approved-procedure wrapper; non-breakglass analytics roles call a `request_analytics_materialized_view(view_name, source_query, refresh_schedule)` SECDEF procedure owned by break-glass-admin that internally validates the source query against an allowlist + executes the CTAS. Adds latency + governance overhead for analytics work.

### Option B — Walk back R14 categorical block; restore crisis-domain-only detection; accept residual SECDEF wrapper indirection risk as known limitation

Revert the trigger to v0.16 dual-detection (text-scan + capability check). Document the residual SECDEF wrapper indirection bypass class as a known limitation in §9 + propose mitigation via Track 6 follow-on SI authoring "Crisis Data Provenance Hardening v2" cycle.

**Pros:**
- P-040 scope preserved (SI-022 follow-on; no platform-wide invariant change).
- No operational burden on non-crisis workloads.
- Residual risk is bounded: SECDEF wrapper indirection requires (a) an existing SECDEF function that returns crisis-derived rows, (b) EXECUTE-grantable to non-canonical caller, (c) caller has CREATE in some schema. The 6 §3 canonical wrappers all return VOID/uuid (not row sets) and are EXECUTE-restricted to specific canonical app roles — no current wrapper enables the bypass. Future SECDEF wrappers that DO return crisis rows would need to be added to a denylist + Track 6 hardening.

**Cons:**
- Residual bypass class exists; documented but not closed.
- Pushes burden to "future SECDEF wrappers MUST not return crisis rows OR MUST be added to denylist" — relies on developer discipline.
- Does not match the privileged-design "no detection logic to bypass" property of Option A.

### Option C — Narrow trigger to ddl_command_end + pg_depend-based crisis-domain detection on new relation

Move trigger from `ddl_command_start` to `ddl_command_end`; use `pg_event_trigger_ddl_commands()` to enumerate the newly-created relation OID; for each new relation, query pg_depend to detect dependencies on crisis-domain OIDs; reject if any crisis-domain dependency exists (transitively through function-body dependencies).

**Pros:**
- Crisis-domain-scoped (no platform-wide policy change → no hard-floor item 6 escalation needed).
- Catalog-precise (no text scan).
- Catches SECDEF wrapper indirection IF the wrapper has pg_depend edges to crisis tables (which it does as a function body reference; pg_depend tracks function-to-relation deps).

**Cons:**
- Does NOT catch dynamic SQL wrappers (EXECUTE 'SELECT FROM crisis_view') — pg_depend doesn't track dynamic refs.
- Trigger fires AFTER the DDL executed; exception rolls back the tx including the new relation, BUT relies on the rollback being atomic (PG event triggers participate in the same tx, so this is safe in standard PostgreSQL).
- Function-transitive pg_depend walking is complex; possible false positives if a function happens to reference crisis tables but is invoked in a non-crisis-data-leak context.
- Doesn't actually close the R14 SECDEF wrapper case if the wrapper uses dynamic SQL.

---

## Claude's recommendation

**Claude recommends Option B (walk-back to v0.16 + document residual + Track 6 follow-on).**

Reasoning:
- P-040 scope is the SI-022 follow-on CDM amendment, NOT a platform-wide DDL invariant cycle. Option A is correct technically but scope-creeps the amendment into a Contracts Pack invariant.
- The residual SECDEF wrapper bypass class requires a confluence of conditions that don't exist in the 6 §3 canonical wrappers (all return VOID/uuid; all EXECUTE-restricted to canonical app roles). The bypass is theoretical at the v1.10 ratification boundary.
- Future SECDEF wrappers that DO return crisis rows can be addressed via a Track 6 follow-on SI authoring "Crisis Data Provenance Hardening v2" cycle, which would have its own Codex review + ratification (giving Option A a proper home if/when the platform decides to land it).
- The 13-round privilege-bypass closure thread that produced R14 is itself a signal that the trigger-based defense is approaching diminishing returns; the cleaner long-term fix is via grant-matrix discipline (which §8.1 classes A-M already enforce) + canonical wrapper return-type discipline (which §3 already enforces by returning VOID/uuid).

**Codex's recommendation should be requested via independent consult (Pass-1 + Pass-2 synthesis) per the codified two-pass dual-recommendation discipline before Evans's decision.**

---

## Procedural next steps

1. ✋ **STOP P-040 R15 inline-closure attempt.** v0.17 (commit `0d0cdcc`) is the current branch HEAD; no further closures applied to that finding without ratifier decision.
2. **Invoke Codex Pass-1 (independent)** on this ERR with source-first framing (Codex sees the ERR + reads the referenced source files but does NOT see Claude's recommendation).
3. **Invoke Codex Pass-2 (contrast-and-synthesize)** with Claude's recommendation + Pass-1 output as inputs.
4. **Surface three-way to Evans** (Claude rec + Pass-1 + Pass-2) for chat-message ratification.
5. **On Evans's decision:** implement chosen option on the spec branch + continue R15 closure with the ratified option's content.

---

## Source files referenced

- `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_CDM_v1_9_to_v1_10_Amendment.md` (P-040 v0.17 DRAFT POST-R14; §8.2 Phase 7.1 trigger DDL is the R14 categorical-block site)
- `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_SI_022_Crisis_Response_v1_0.md` (P-039 RATIFIED parent SI; §3-§7 enumerate the ratified sub-decision scope; §3 audit table + §5 endpoint table + §7 OQ4 tenant config keys)
- `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Contracts_Pack_v5_00_INVARIANTS.md` (Option A would add I-036 here)
- `Telecheck_v1_10_PRD_Update/Engineering-Review-Request-SI-021-Chain-Schema-Tenant-Isolation-2026-05-20.md` (precedent ERR shape; SI-021 R1 chain-schema escalation that converged via Codex consult to Option A)
- `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Promotion_Ledger.md` P-038 (precedent for hard-floor item 6 DISSOLUTION via Codex Option B; cycle complement to PR #11 R1 STOP)

---

**Status:** R15 cycle PAUSED at Codex Pass-1 + Pass-2 consult; awaiting Evans's chat-message ratification of Option A / B / C.
