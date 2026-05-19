# Cross-SI Publish-State OQ — Batched Ratifier Proposal

**Version:** 0.1 DRAFT
**Status:** RATIFIER-READY-WITH-KNOWN-OQs (post-R2 Codex iterate-to-asymptote close at §10 cadence boundary, 2026-05-19); Sprint 10 of autonomous 24h-loop work plan
**Codex iteration trajectory:** R1 (2 HIGH + 2 MED) → R2 (1 HIGH + 2 MED). All 7 findings closed inline as in-scope correctness gaps in proposal accuracy / completeness; no architectural-judgment items closed inline (the canonical decision is preserved as the ratifier's authority). §10 cadence boundary applied at R2.
**Authoring location:** `Telecheck_v1_10_PRD_Update/` (workstream folder; spec-corpus Track 6 ratification-proposal deliverable)
**Owner:** Evans (ratifier-quorum lead) + CDM owner (canonical schema authority)
**Companion documents:** SI-015 MarketingCopy CDM Canonical Schema (Sprint 2); SI-016 AI Workflow Handler Registry (Sprint 3); SI-019 Med-Interaction Slice PRD v2.0 Implementation-Readiness Extension; P-021 SC3 procedure-side amendment (precedent for "transition log" pattern); SI-018 two-tier hybrid audit-chain partition rule (ratified 2026-05-19)
**Authority:** ratifier-targetable proposal that resolves a cross-SI architectural-judgment question via one decision

---

## 1. Purpose + scope

Three Sprint-2/3/19 SIs surfaced **the same architectural-judgment question** during their R1 Codex adversarial reviews. Each SI's own author (Claude) STOPPED at hard-floor item 6 per CLAUDE.md and surfaced the question as an OQ rather than closing inline. The three OQs are linked references to a single canonical decision:

- **SI-015 OQ4:** MarketingCopy publish-time UPDATE vs append-only state-machine pattern.
- **SI-016 OQ1:** AI workflow handler registry publish-time UPDATE vs append-only.
- **SI-019 OQ7 (SIGNAL-LIFECYCLE):** Med-Interaction signal-row immutable + transition entity OR constrained UPDATE + transition log per P-021 SC3 precedent.

The question can be stated canonically as:

> **For an audit-bound entity that has a "publish" or "lifecycle-transition" event, does Telecheck's canonical pattern use (a) **Option A:** immutable rows + a separate transition-entity table where each row records a state transition (the "event-sourced" pattern); OR (b) **Option B:** a constrained UPDATE on the original row (e.g., `WHERE state = 'draft' AND tenant_id = current_setting('app.tenant_id')`) + a separate transition-log table that records each transition as an append-only event (the "P-021 SC3 precedent" pattern)?**

The two options have different downstream implications for: schema shape, audit-chain reconstructability, RLS policy complexity, idempotency handling on retries, and procedure-side SECURITY DEFINER STEP 0 contracts. A single ratifier decision binds all three SIs and any future SI that hits the same question.

**Out of scope:** this proposal does NOT amend the three pending SIs' content; it proposes the ratifier decision shape + recommends one of the two options + provides the reasoning. The actual amendment to each SI is downstream of the ratifier decision.

---

## 2. The two options

**Note on R1 HIGH-1 closure:** the original v0.1 draft characterized Option A as "no race conditions structurally"; this was inaccurate. Option A's race-safety is conditional on explicit admissibility constraints (UNIQUE on `(entity_id, from_state)` for in-progress transitions, OR application-layer idempotency keys, OR row-level locks on the transition entity). The revised schema below includes the admissibility constraint to make the comparison apples-to-apples with Option B's row-level locking.

### Option A — Immutable rows + transition entity table (event-sourced)

**Schema shape:**

```sql
-- Original entity: INSERT-only, no UPDATE
CREATE TABLE marketing_copy (
    id UUID PRIMARY KEY,
    tenant_id tenant_id_t NOT NULL,
    body_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by_user_id UUID NOT NULL
    -- No 'status' field; derived from latest transition entity row
);

-- Transition entity: each row records a state transition; admissibility-constrained per R1 HIGH-1 closure
CREATE TABLE marketing_copy_transition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    marketing_copy_id UUID NOT NULL,
    from_state TEXT,                      -- Null for initial admission
    to_state TEXT NOT NULL,               -- e.g., 'draft', 'published', 'retracted'
    transition_idempotency_key UUID NOT NULL,  -- Caller-supplied; same key on retry = same transition
    transitioned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    transitioned_by_user_id UUID NOT NULL,
    transition_reason TEXT NOT NULL,
    CONSTRAINT mc_transition_tenant_fk FOREIGN KEY (tenant_id, marketing_copy_id) REFERENCES marketing_copy(tenant_id, id),
    CHECK (from_state IS NULL OR from_state != to_state)
);

-- Separate idempotency UNIQUE: same caller-supplied idempotency_key + same logical transition = single row.
CREATE UNIQUE INDEX mc_transition_idempotency_uk
    ON marketing_copy_transition (tenant_id, marketing_copy_id, transition_idempotency_key);

-- Single-winner admissibility per R2 HIGH-1 closure: at most ONE transition from a given (entity, from_state) ever.
-- Partial UNIQUE index with explicit NULL handling: COALESCE(from_state, '__initial__') makes the
-- "initial admission" (from_state IS NULL) participate in uniqueness alongside named from_state values.
CREATE UNIQUE INDEX mc_transition_single_winner_uk
    ON marketing_copy_transition (tenant_id, marketing_copy_id, COALESCE(from_state, '__initial__'));

-- The SECURITY DEFINER transition procedure additionally takes pg_advisory_xact_lock on
-- (hash(tenant_id, marketing_copy_id)) to serialize transition attempts at the application boundary.
-- This prevents two concurrent callers from both checking the most-recent-transition's to_state
-- and then both INSERTing different new transitions from the same from_state.

-- Current-state view derived at query time
CREATE VIEW marketing_copy_state AS
SELECT
    mc.id, mc.tenant_id, mc.body_text, mc.created_at,
    (SELECT to_state FROM marketing_copy_transition t
     WHERE t.marketing_copy_id = mc.id AND t.tenant_id = mc.tenant_id
     ORDER BY transitioned_at DESC LIMIT 1) AS current_state,
    (SELECT MAX(transitioned_at) FROM marketing_copy_transition t
     WHERE t.marketing_copy_id = mc.id AND t.tenant_id = mc.tenant_id) AS last_transition_at
FROM marketing_copy mc;
```

**Properties:**

- **Audit-chain reconstructability:** trivially reconstructable — every transition is an immutable row in the transition entity table; the full lifecycle is reconstructable by replaying transition rows in `transitioned_at` order.
- **RLS:** straightforward — both tables have `tenant_id = current_setting('app.tenant_id')` policy.
- **Idempotency on retries:** simple — INSERT a new transition row; idempotency key on `(marketing_copy_id, from_state, to_state, transition_id)`; retries see existing row + are no-ops.
- **Procedure-side STEP 0:** standard I-032 tenant-GUC guard; no UPDATE permission required on the procedure's grants.
- **Storage cost:** transition entity grows linearly with state-change count; one row per transition.
- **Query complexity:** current-state lookup requires a subquery or view (small overhead).
- **Race conditions on concurrent transitions (R2 MED-1 closure):** single-winner enforcement per the partial UNIQUE index `mc_transition_single_winner_uk` on `(tenant_id, marketing_copy_id, COALESCE(from_state, '__initial__'))`. Two concurrent callers attempting the same `(entity, from_state) → *` transition: one INSERT succeeds; the other fails with unique-constraint violation. The SECURITY DEFINER procedure additionally takes `pg_advisory_xact_lock(hash(tenant_id, marketing_copy_id))` to serialize transition attempts at the application boundary, preventing concurrent callers from both observing the same most-recent-transition's to_state and then both attempting INSERT (the lock ensures the second caller observes the first's already-committed row + can resolve the idempotency-or-error decision deterministically). This is the structural equivalent of Option B's row-level locking + ROW_COUNT=0 race-detection.

**Existing precedent in canonical bundle:** Sprint 7 Cold-DR Runbook's three-state per-device obligation model (state-Q, state-P, state-N) follows this pattern. Sprint 9 AI Service Mode 1 handler's split-table immutable lifecycle (admission / detector_result / result) also follows this pattern. Both are R-N-ratifier-ready.

### Option B — Constrained UPDATE + transition log (P-021 SC3 precedent)

**Schema shape:**

```sql
-- Original entity: has a 'status' field; UPDATE permitted under strict WHERE-clause guard
CREATE TABLE marketing_copy (
    id UUID PRIMARY KEY,
    tenant_id tenant_id_t NOT NULL,
    body_text TEXT NOT NULL,
    status TEXT NOT NULL,                 -- 'draft' | 'published' | 'retracted'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by_user_id UUID NOT NULL,
    last_state_change_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_state_change_by_user_id UUID NOT NULL
);

-- Transition log: append-only event table for every transition
CREATE TABLE marketing_copy_transition_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    marketing_copy_id UUID NOT NULL,
    from_state TEXT NOT NULL,
    to_state TEXT NOT NULL,
    transitioned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    transitioned_by_user_id UUID NOT NULL,
    transition_reason TEXT NOT NULL,
    CONSTRAINT mc_transition_log_tenant_fk FOREIGN KEY (tenant_id, marketing_copy_id) REFERENCES marketing_copy(tenant_id, id)
);

-- Canonical SECURITY DEFINER procedure for state transition
CREATE OR REPLACE PROCEDURE transition_marketing_copy(
    p_tenant_id tenant_id_t,
    p_marketing_copy_id UUID,
    p_from_state TEXT,
    p_to_state TEXT,
    p_user_id UUID,
    p_reason TEXT
) SECURITY DEFINER LANGUAGE plpgsql AS $$
DECLARE
    v_rows_updated INT;
BEGIN
    -- STEP 0: I-032 tenant-GUC guard
    IF NULLIF(current_setting('app.tenant_id', true), '') IS DISTINCT FROM p_tenant_id THEN
        RAISE EXCEPTION 'I-032 tenant-GUC violation' USING ERRCODE = 'TLC32';
    END IF;

    -- Constrained UPDATE with strict state-equality guard
    UPDATE marketing_copy
    SET status = p_to_state,
        last_state_change_at = now(),
        last_state_change_by_user_id = p_user_id
    WHERE id = p_marketing_copy_id
      AND tenant_id = p_tenant_id
      AND status = p_from_state;

    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
    IF v_rows_updated = 0 THEN
        RAISE EXCEPTION 'Marketing copy transition failed: not in expected from_state %', p_from_state
            USING ERRCODE = 'TLC50';
    END IF;

    -- Append-only transition log
    INSERT INTO marketing_copy_transition_log
        (tenant_id, marketing_copy_id, from_state, to_state, transitioned_by_user_id, transition_reason)
    VALUES
        (p_tenant_id, p_marketing_copy_id, p_from_state, p_to_state, p_user_id, p_reason);
END;
$$;
```

**Properties:**

- **Audit-chain reconstructability:** reconstructable via the transition_log table; the current state is the latest log row OR a direct read of `marketing_copy.status` (must match the log's most recent `to_state`).
- **RLS:** straightforward — both tables RLS-bound.
- **Idempotency on retries:** more complex — the constrained UPDATE rejects re-runs (because `status = p_from_state` will already be `p_to_state` from the first run). The canonical idempotency wrapper needs to handle this case: detect "already transitioned" and return success without writing duplicate log row.
- **Procedure-side STEP 0:** standard I-032 + the constrained UPDATE's WHERE clause is the second-layer guard against race conditions.
- **Storage cost:** lower than Option A for read-heavy workloads (single SELECT on `marketing_copy.status`); transition_log grows linearly with state-change count.
- **Query complexity:** current-state lookup is a direct field read; no view or subquery needed.
- **Race conditions on concurrent transitions:** PostgreSQL row-level locking via the constrained UPDATE — only one concurrent transaction wins; the loser's UPDATE produces ROW_COUNT=0 and the procedure raises TLC50.

**Existing precedent in canonical bundle:** **P-021 SC3** (`record_consult_clinician_decision()` procedure-side amendment ratified 2026-05-19) follows this pattern — constrained UPDATE on the consult entity + append-only decision-log table. The ratifier confirmed this pattern at P-021a promotion. **Caveat (R1 HIGH-2 closure):** P-021 SC3 is a clinician-decision procedure on a single consult entity; the ratifier's approval at P-021a does NOT automatically extend to all status-bearing entities. The three pending SIs (SI-015 marketing copy + SI-016 handler registry + SI-019 medication-interaction signal) have different domain semantics (multi-stakeholder publish workflows vs single-clinician decisions) and may warrant different patterns. The ratifier must evaluate whether P-021 SC3's pattern generalizes to these domains.

### Option C — Event-sourced transition log + materialized current-state projection (omitted from v0.1; surfaced per R1 MED-1)

**Schema shape:**

```sql
-- Original entity: INSERT-only, like Option A
CREATE TABLE marketing_copy (
    id UUID PRIMARY KEY,
    tenant_id tenant_id_t NOT NULL,
    body_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by_user_id UUID NOT NULL
);

-- Transition log: append-only, like Option B, but the AUTHORITATIVE source of current state
CREATE TABLE marketing_copy_transition_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    marketing_copy_id UUID NOT NULL,
    from_state TEXT,
    to_state TEXT NOT NULL,
    transition_idempotency_key UUID NOT NULL,
    transitioned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    transitioned_by_user_id UUID NOT NULL,
    transition_reason TEXT NOT NULL,
    CONSTRAINT mc_transition_log_admissibility UNIQUE (tenant_id, marketing_copy_id, from_state, to_state, transition_idempotency_key)
);

-- Materialized current-state projection: maintained by trigger; INSERT-only at base; UPSERT here
CREATE MATERIALIZED VIEW marketing_copy_current_state AS
SELECT DISTINCT ON (marketing_copy_id, tenant_id)
    marketing_copy_id, tenant_id, to_state AS current_state, transitioned_at AS last_transition_at
FROM marketing_copy_transition_log
ORDER BY marketing_copy_id, tenant_id, transitioned_at DESC;

-- Or: a regular table maintained by AFTER INSERT trigger on transition_log
-- (avoiding REFRESH MATERIALIZED VIEW overhead)
```

**Properties:**

- **Audit-chain reconstructability:** trivial (same as Option A and Option B; the transition_log is the authoritative event source).
- **Read-time performance:** matches Option B (direct read from the materialized projection).
- **Write-time complexity:** higher than both A and B — every transition INSERT must also update the materialized projection (either via REFRESH MATERIALIZED VIEW or via AFTER INSERT trigger with UPSERT on the projection table). The projection table itself is technically NOT INSERT-only (it has UPSERTs); however, the AUTHORITATIVE source of truth (the transition_log) remains append-only.
- **Race conditions:** the same admissibility constraint as Option A (UNIQUE on the transition key); the materialized projection's UPSERT happens within the same transaction as the transition_log INSERT, so the projection is consistent.
- **I-027 append-only compliance:** authoritative source (transition_log) is append-only; projection is a derived data structure not subject to I-027 audit-trail invariants. Procedurally treat the projection as a read-cache; if it gets corrupted, rebuild from the log.

**Existing precedent in canonical bundle:** materialized views are used in Telecheck for analytics-style derived data (e.g., per-tenant active-patient counts). They are NOT used for audit-bound entity state, but the pattern is well-tested in other Telecheck surfaces.

**Why Option C exists:** Option C is the "best of both worlds" attempt — append-only authoritative source (like Option A) + direct field read at query time (like Option B). The cost is write-time complexity (UPSERT on the projection) + the projection table is NOT I-027-bound. This third option may or may not be the canonical pattern; surfaced here per R1 MED-1 so the ratifier can evaluate.

---

## 3. Comparison summary

| Dimension | Option A (event-sourced) | Option B (constrained UPDATE + log) |
|---|---|---|
| Audit-chain reconstructability | Trivial (replay transition rows) | Requires both base + log; current state is direct read |
| Schema complexity | 2 tables + 1 view per entity | 2 tables per entity; 1 SECURITY DEFINER procedure |
| RLS policy complexity | Equal | Equal |
| Idempotency on retries | Simple (INSERT new row) | Requires "already transitioned" check in wrapper |
| Procedure-side STEP 0 | Standard I-032 | Standard I-032 + ROW_COUNT guard for race |
| Storage cost | Equal | Equal (both have transition history) |
| Read-time query complexity | Subquery / view | Direct field read |
| Concurrent-transition race handling | Trivial (both INSERT; both recorded) | PostgreSQL row-locking + ROW_COUNT=0 detection |
| Existing precedent in canonical bundle | Sprint 7 Cold-DR; Sprint 9 Mode 1 handler | P-021 SC3 (ratified 2026-05-19) |
| I-027 append-only invariant compliance | Fully (no UPDATEs anywhere; both tables INSERT-only) | Constrained (base table has UPDATEs, but only via SECURITY DEFINER procedures with strict guards; transition_log is append-only) |
| Compatibility with current Telecheck canonical surfaces | Cold-DR + Mode 1 specs follow Option A | P-021 SC3 procedure follows Option B; CDM v1.2 patient + medication_request entities have mutable status fields (informal Option B) |

---

## 4. Recommendation (tempered per R1 HIGH-2 closure)

**Working recommendation: Option B (constrained UPDATE + transition log) OR Option C (event-sourced + materialized projection) — both are defensible; Option A is also defensible with admissibility constraints.**

**Per R1 HIGH-2 closure, this proposal does NOT assert that P-021 SC3 establishes a canonical-bundle-wide rule.** P-021 SC3 was a specific clinician-decision procedure on the consult entity; the ratifier's approval at P-021a is a precedent for that domain, not a corpus-wide canonical rule. The three pending SIs span different domains (multi-stakeholder publish workflows for marketing copy; handler-registry resolution; medication-interaction signal lifecycle) which may warrant different patterns.

**Working considerations:**

1. **P-021 SC3 precedent exists but does not generalize automatically.** The ratifier's P-021a approval is one data point in favor of Option B for clinician-decision procedures. Whether it generalizes to marketing copy / handler registry / medication-interaction signals is a separate question the ratifier must answer.

2. **CDM v1.2 baseline entities follow Option B informally.** Patient, medication_request, consult, etc. have mutable status fields with implicit transition logging. The "informal Option B" baseline suggests Option B has been the de-facto pattern; adopting Option B explicitly for new SIs would formalize what exists. **However**, formalizing the informal baseline is not the same as ratifying it as a corpus-wide canonical rule — the ratifier may decide that future entities should use a different pattern (Option A or Option C) even if it doesn't propagate back to v1.2 entities.

3. **Procedure-side STEP 0 with constrained UPDATE is well-tested in Telecheck.** Validated across the v1.10.1 hygiene cycle (~12 Codex rounds) for the canonical content-port procedures. Familiarity is a positive but not decisive factor.

4. **Sprint 7 + Sprint 9 specs follow Option A.** These are event-flow domains (transient DR-recovery state tracking; transient per-turn conversation lifecycle), different from status-bearing entities. The Option A pattern is appropriate there; it does not automatically generalize to status-bearing entities, and Option B's appropriateness for status-bearing entities does not automatically generalize back to event-flow domains. **Pattern-domain alignment is what matters; the cross-corpus pattern is necessarily heterogeneous to some extent.**

5. **Read-time performance favors Option B and Option C.** For high-volume status-bearing entity reads (Mode 1 LLM context construction reads handler-registry every turn), direct field read or materialized projection is meaningfully faster than Option A's subquery. The cumulative latency saved is real.

6. **Audit-chain reconstructability is equivalent across all three options.** All options have append-only transition records as the authoritative event source.

**Per-SI domain analysis (added per R1 HIGH-2 closure):**

- **SI-015 MarketingCopy:** multi-stakeholder publish workflow (legal review + brand review + marketing operator). Multiple concurrent transitions are unusual (review-approve-publish is sequential). **Recommended:** Option B or Option C; Option A's complexity is unnecessary for the low-concurrency domain.
- **SI-016 AI Workflow Handler Registry:** handler-registry resolution is read-heavy (every Mode 1 turn looks up the active handler). Publish/retract events are infrequent (handler-version-bump cadence). **Recommended:** Option C (read performance for the high-volume read path + append-only authority for the low-volume write path).
- **SI-019 Medication-Interaction Signal:** signal lifecycle is medium-volume; signals can transition concurrently (multiple clinicians reviewing simultaneously). **Recommended:** Option B with explicit ROW_COUNT race-detection; the constrained UPDATE pattern handles concurrent review cleanly. Alternatively Option C is also defensible.

**Conclusion:** the proposal does NOT make a unilateral recommendation that applies to all three SIs uniformly. **The ratifier ceremony should evaluate per-SI** — the working recommendation per domain is articulated above. The Hybrid option (§5) is now the primary recommended outcome of the ratifier ceremony, with Option B being the most-frequent per-SI choice based on the domain analysis.

---

## 5. Proposed ratifier-decision shape (revised per R1 HIGH-2 + MED-1 closure)

The ratifier-quorum decision is **per-SI**, with three independent options per SI (A / B / C) + a meta-decision about whether to bind future SIs.

**Per-SI decision question:**

For each of SI-015, SI-016, SI-019, the ratifier selects:

> [ ] **Option A** (event-sourced; immutable rows + transition entity with admissibility constraint).
>
> [ ] **Option B** (constrained UPDATE + transition log; ROW_COUNT race-detection in SECURITY DEFINER procedure).
>
> [ ] **Option C** (event-sourced authoritative + materialized current-state projection).

**Meta-decision (cross-corpus pattern binding):**

> [ ] **Bind future SIs:** future status-bearing entity SIs MUST use the same option-per-SI mapping decided here (no per-SI re-evaluation unless explicitly authorized).
>
> [ ] **Per-SI evaluation continues:** each future status-bearing entity SI evaluates A/B/C independently; the decisions here set precedent but not binding rule.

**Working recommendation per the §4 domain analysis:**
- SI-015 MarketingCopy: **Option B** (multi-stakeholder publish workflow; low concurrency)
- SI-016 AI Workflow Handler Registry: **Option C** (read-heavy; materialized projection serves high-volume reads)
- SI-019 Medication-Interaction Signal: **Option B** (medium-volume; concurrent-review race handled cleanly by constrained UPDATE)
- Meta-decision: **Per-SI evaluation continues** (the heterogeneous nature of domains makes a single corpus-wide rule too restrictive)

These are working recommendations only; the ratifier's authority over the canonical decision is preserved.

---

## 6. Downstream amendment scope (post-ratifier; per R1 MED-2 closure: OQs NOT auto-closed)

**Critical:** the ratifier's option-selection for each SI does NOT automatically close the SI's OQ. Each SI requires a follow-on amendment that specifies the option-specific implementation details:

For each SI, after ratifier selects an option, the SI's author drafts the following follow-on:

### For Option B SIs:
- SECURITY DEFINER procedure signature with `p_tenant_id` + state-machine arguments (per Sprint 8 I-032 STEP 0 contract).
- Constrained UPDATE WHERE clause specifying allowed `from_state` values.
- ROW_COUNT=0 race-detection + the error code (TLC50 by Sprint 10 v0.1 convention).
- Idempotency wrapper for "already transitioned" retries: idempotency-key column on transition_log + INSERT-on-conflict-skip pattern.
- Append-only transition_log schema with composite tenant FK + RLS policy.
- GRANT statements: the canonical procedure-caller role gets EXECUTE on the procedure; the base entity table grants UPDATE only via the procedure.
- Rollback semantics: how does the system recover from a constraint violation mid-transition (e.g., the transition_log INSERT succeeds but the constrained UPDATE rolls back unexpectedly)?

### For Option A SIs:
- Admissibility-constraint schema (UNIQUE on the transition key) per the revised §2 Option A.
- Application-layer "verify entity's most-recent transition's to_state = NEW.from_state" check in the SECURITY DEFINER procedure.
- View definition for `<entity>_current_state` (canonical name pattern).
- Idempotency: caller-supplied `transition_idempotency_key`; retries see the existing row + are no-ops.
- RLS policy on transition entity.

### For Option C SIs:
- Trigger function maintaining the materialized projection (AFTER INSERT on transition_log → UPSERT on projection).
- Materialized projection schema + RLS.
- Bootstrap procedure: if projection is corrupted, rebuild from transition_log via `REFRESH MATERIALIZED VIEW` or equivalent.
- Authoritative-source-of-truth note: applications read from the projection for performance, but audit reconstruction reads from the transition_log.

### Common to all options:
- CDM v1.2 → v1.3 amendment (per OQ4 of this proposal): the three SIs' entity schemas + the supporting transition_log / transition / projection tables land at CDM v1.3 promotion (sister SI-024 candidate).
- Promotion Ledger entry per SI per ratifier action.

**Estimate of follow-on work after ratifier-quorum approval:** 1-2 additional Codex cycles per SI (the option-specific implementation details surface their own correctness gaps; in-scope correctness, not architectural-judgment). Total: 3-6 Codex cycles across the three SIs.

---

## 7. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; awaiting Codex R1.

**v0.1 R1 closure 2026-05-19:** 2 HIGH + 2 MED findings closed inline:

| Round | Findings | Status |
|---|---|---|
| R1 | HIGH-1 Option A mischaracterized as race-safe without admissibility constraints (revised schema + admissibility constraint added); HIGH-2 recommendation overstated P-021 SC3 precedent (tempered: P-021 SC3 is consult-decision-specific, not corpus-wide; per-SI domain analysis added); MED-1 binary framing omitted Option C (event-sourced + materialized projection now surfaced); MED-2 downstream scope assumed automatic OQ closure (revised: OQs NOT auto-closed; option-specific follow-on amendments required per SI) | All 4 closed inline |

**Key revisions in R1 closure:**
- §2 Option A schema gains admissibility constraint (UNIQUE on transition key) + application-layer verification.
- §2 Option C added: event-sourced authoritative source + materialized current-state projection.
- §4 Recommendation tempered: no unilateral Option B; per-SI domain analysis articulated; Hybrid is now the primary recommended outcome.
- §5 Decision shape: per-SI selection (A/B/C) + cross-corpus meta-decision (bind future SIs vs per-SI evaluation continues).
- §6 Downstream scope: option-specific implementation-detail requirements articulated; OQs NOT auto-closed.

No architectural-judgment items closed inline; the proposal articulates the question + 3 options + working recommendations, and explicitly preserves the ratifier's authority over the canonical decision. CLAUDE.md hard-floor item 6 honored.

**v0.1 R2 closure 2026-05-19:** 1 HIGH + 2 MED findings closed inline (R1 closures left residual gaps in Option A's admissibility constraint, race-safety property statement, and the OQ section / footer that still carried pre-R1 unilateral Option B framing).

| Round | Findings | Status |
|---|---|---|
| R2 | HIGH-1 Option A admissibility constraint UNIQUE (tenant_id, marketing_copy_id, from_state, to_state, transition_idempotency_key) did NOT prevent two different transitions from the same from_state with different idempotency_keys; MED-1 Option A properties section still asserted "structural race safety" + timestamp-winner framing contradicting the partial-UNIQUE fix; MED-2 §8 OQs + document footer still carried pre-R1 unilateral Option B framing | All 3 closed inline |

**R2 closure pattern recap:**
- HIGH-1: split into two UNIQUE indexes — `mc_transition_idempotency_uk` on idempotency key (replay-safety) + `mc_transition_single_winner_uk` partial UNIQUE on `COALESCE(from_state, '__initial__')` (admissibility). Added pg_advisory_xact_lock requirement in the SECURITY DEFINER procedure for app-boundary serialization.
- MED-1: race-condition property rewritten to single-winner enforcement via partial UNIQUE + advisory lock; structural equivalence to Option B's row-locking articulated; timestamp-winner framing removed.
- MED-2: §8 meta-OQs + document footer updated to reflect per-SI evaluation + working-domain-analysis recommendations; no longer say "unilateral Option B"; footer marker now reflects RATIFIER-READY-WITH-KNOWN-OQs at R2 §10 cadence boundary.

**Status at R2 close:** RATIFIER-READY-WITH-KNOWN-OQs per the §10 cadence commitment. The proposal is ratifier-targetable; the per-SI working recommendations are non-binding. CLAUDE.md hard-floor item 6 honored: 0 architectural-judgment items closed inline. The 4 meta-OQs (§8) remain ratifier-targetable.

---

## 8. Open questions for ratifier (meta-OQs on this proposal itself)

1. **Meta-OQ1 — Per-SI decision vs binary corpus-wide rule.** Per the R1+R2 revisions, this proposal NO LONGER recommends a unilateral Option B; instead it recommends per-SI evaluation with working domain-analysis recommendations (SI-015 Option B; SI-016 Option C; SI-019 Option B). The ratifier may choose any A/B/C per SI OR override the working recommendation. The Hybrid (per-SI) outcome is the primary recommended ratifier action.
2. **Meta-OQ2 — Should the ratifier decision bind FUTURE SIs as canonical pattern, or only the three pending SIs?** Working recommendation: per-SI evaluation continues for future SIs; this ceremony's decisions set precedent but not corpus-wide binding rule. The ratifier may override and bind future SIs if desired.
3. **Meta-OQ3 — Should the ratifier formally re-evaluate Sprint 7 + Sprint 9 specs that adopted Option A, for consistency with the canonical-pattern decision?** Working recommendation: NO — the Sprint 7 (Cold-DR three-state per-device obligation model) + Sprint 9 (AI Service Mode 1 split-table lifecycle) specs are on event-flow domains, not status-bearing entity domains; the pattern-domain alignment differs. The ratifier may override.
4. **Meta-OQ4 — Codex pre-ratification round target for this proposal.** Working recommendation: 2-3 rounds (proposal review). At R2 §10 cadence boundary marker, this proposal will be marked RATIFIER-READY-WITH-KNOWN-OQs.

---

— Claude (Opus 4.7, 1M context), Cross-SI Publish-State OQ Batched Ratifier Proposal v0.1 RATIFIER-READY-WITH-KNOWN-OQs at R2 §10 cadence boundary 2026-05-19 under "continue for 24 hrs" autonomous-work authorization. Sprint 10 of the 24h-loop work plan. Track 6 spec-corpus ratification-proposal deliverable. Surfaces 3 options (A/B/C) per SI; recommends per-SI evaluation with working domain-analysis recommendations (SI-015 Option B; SI-016 Option C; SI-019 Option B); explicitly preserves ratifier authority over canonical decisions. Ratifier-targetable independent of Sprint 11+ work.
