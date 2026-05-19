# Cross-SI Publish-State OQ — Batched Ratifier Proposal

**Version:** 0.1 DRAFT
**Status:** Pre-Codex-pre-ratification; Sprint 10 of autonomous 24h-loop work plan
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

-- Transition entity: each row records a state transition
CREATE TABLE marketing_copy_transition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    marketing_copy_id UUID NOT NULL,
    from_state TEXT,                      -- Null for initial admission
    to_state TEXT NOT NULL,               -- e.g., 'draft', 'published', 'retracted'
    transitioned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    transitioned_by_user_id UUID NOT NULL,
    transition_reason TEXT NOT NULL,
    CONSTRAINT mc_transition_tenant_fk FOREIGN KEY (tenant_id, marketing_copy_id) REFERENCES marketing_copy(tenant_id, id)
);

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
- **Race conditions on concurrent transitions:** none structurally — concurrent INSERTs produce two transition rows; the "actual" winner is the one with earlier `transitioned_at`; downstream consumers see both as historical.

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

**Existing precedent in canonical bundle:** **P-021 SC3** (`record_consult_clinician_decision()` procedure-side amendment ratified 2026-05-19) follows this pattern — constrained UPDATE on the consult entity + append-only decision-log table. The ratifier confirmed this pattern at P-021a promotion.

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

## 4. Recommendation

**Recommendation: Option B (constrained UPDATE + transition log) — adopt as canonical pattern across SI-015 + SI-016 + SI-019.**

**Reasoning:**

1. **P-021 SC3 precedent is already ratified.** The ratifier sequence for Q2 2026 has already accepted Option B at the P-021a procedure-side amendment. Adopting Option B for the three pending SIs preserves consistency with the ratified P-021 precedent.

2. **CDM v1.2 baseline entities (patient, medication_request, consult, etc.) all have mutable status fields.** These entities follow the informal Option B pattern at CDM v1.2 baseline. Adopting Option A for the three new SIs would create a schema-style inconsistency between v1.2-baseline entities (Option B style) and v1.10-amendment entities (Option A style). Maintaining one canonical pattern across the corpus is preferable to two.

3. **Procedure-side STEP 0 with constrained UPDATE is a well-tested pattern.** The ROW_COUNT=0 race-detection mechanism is canonical in PostgreSQL + has been used in Telecheck consult-decision procedures since canonical content port 2026-05-19. The idempotency-wrapper for "already transitioned" detection is a small additional layer; the v1.10.1 hygiene cycle already validated this pattern across 12 rounds of Codex review.

4. **Sprint 7 + Sprint 9 specs that follow Option A are NEW spec drafts on different domains.** Cold-DR Runbook's three-state per-device obligation model is a transient state tracking concept for a DR scenario; Sprint 9 Mode 1 handler's split-table lifecycle is a transient per-turn lifecycle on conversational data with different semantics from durable status-bearing entities (marketing copy, AI handler registry, medication-interaction signals). The Option A pattern works there because the entities are fundamentally event-flow rather than status-bearing. The three pending SIs (SI-015 / SI-016 / SI-019) are status-bearing entities and align more naturally with Option B.

5. **Read-time performance.** For status-bearing entities accessed frequently at read time (marketing copy display, handler-registry resolution, medication-interaction signal display), Option B's direct field read is meaningfully faster than Option A's subquery / view. The cumulative latency saved is real for high-volume workloads (Mode 1 LLM context construction reads from these entities every turn; the savings compound).

6. **Audit-chain reconstructability is preserved.** Option B's append-only transition_log table provides the same reconstructability as Option A's transition entity table; the canonical replay mechanism is identical (SELECT from transition_log ORDER BY transitioned_at).

**The recommendation is therefore: ratify Option B as the canonical Telecheck pattern for audit-bound status-bearing entities with publish / lifecycle-transition events.**

---

## 5. Proposed ratifier-decision shape

The ratifier-quorum decision is binary on Option A vs Option B. The decision binds three pending SIs simultaneously + sets the canonical pattern for future SIs.

**Decision question (for ratifier-quorum approval):**

> Does Telecheck adopt **Option B (constrained UPDATE + transition log, per P-021 SC3 precedent)** as the canonical pattern for status-bearing audit-bound entities with publish / lifecycle-transition events?
>
> [ ] **Yes, Option B** — adopt across SI-015 + SI-016 + SI-019. Future status-bearing entity SIs use Option B unless explicitly authorized to use Option A.
>
> [ ] **No, Option A** — adopt event-sourced pattern across SI-015 + SI-016 + SI-019. Re-evaluate P-021 SC3 procedure-side amendment for consistency.
>
> [ ] **Hybrid (case-by-case)** — each SI uses the pattern that best fits its domain; ratifier accepts the heterogeneous approach.

**Recommended ratifier action:** **YES on Option B**, per the reasoning in §4.

---

## 6. Downstream amendment scope (post-ratifier)

If ratifier approves Option B:

1. **SI-015 MarketingCopy CDM Canonical Schema (Sprint 2 RATIFIER-READY-WITH-KNOWN-OQs):** OQ4 closed. The Sub-decision 5 schema is finalized as Option B; the constrained UPDATE procedure + transition_log table land at canonical promotion.

2. **SI-016 AI Workflow Handler Registry (Sprint 3 APPROVE):** OQ1 closed. The handler-registry's status field follows Option B; SI-016 already specifies the constrained UPDATE pattern for handler-state transitions (e.g., `draft` → `published` → `retracted`). The post-ratifier closure is documentary only.

3. **SI-019 Med-Interaction Slice PRD v2.0 Implementation-Readiness Extension:** OQ7 (SIGNAL-LIFECYCLE) closed. The signal-row uses Option B with the medication-interaction-signal status field + an append-only signal_transition_log table.

4. **CDM v1.2 → v1.3 amendment:** the three SIs' canonical entity schemas land at CDM v1.3 promotion (sister SI-024 candidate). The amendment is purely additive (no v1.2 entity changes).

If ratifier approves Option A:

1. Re-evaluate SI-015/SI-016/SI-019 with the event-sourced schema model.
2. Open a new SI to re-evaluate P-021a procedure-side amendment for consistency (the existing ratified P-021a would need a follow-on amendment to convert to event-sourced; the ratifier ceremony would need to decide whether to revert P-021a or accept heterogeneous patterns).
3. The downstream scope is larger; the ratification timeline is longer.

If ratifier approves Hybrid:

1. The three SIs proceed with case-by-case decisions (SI-019 might use Option A for signal-row immutability; SI-015 + SI-016 might use Option B). The ratifier ceremony's per-SI decisions are independent.

---

## 7. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; awaiting Codex R1.

---

## 8. Open questions for ratifier (meta-OQs on this proposal itself)

1. **Meta-OQ1 — Is the decision binary, or should ratifier consider a Hybrid approach?** The recommendation here is Option B unilaterally; the ratifier may wish to consider Hybrid as a third option (per §5 voting shape).
2. **Meta-OQ2 — Should the ratifier decision bind FUTURE SIs as canonical pattern, or only the three pending SIs?** Recommendation: bind future SIs as well to prevent pattern-drift.
3. **Meta-OQ3 — Should the ratifier formally re-evaluate Sprint 7 + Sprint 9 specs that adopted Option A, for consistency with the canonical-pattern decision?** Recommendation: NO — the Sprint 7 + Sprint 9 specs are on different domains (event-flow rather than status-bearing); they remain on Option A.
4. **Meta-OQ4 — Codex pre-ratification round target for this proposal.** Recommendation: 2-3 rounds (proposal review; verifies the option comparison is balanced + the recommendation is defensible).

---

— Claude (Opus 4.7, 1M context), Cross-SI Publish-State OQ Batched Ratifier Proposal v0.1 DRAFT authored 2026-05-19 under "continue for 24 hrs" autonomous-work authorization. Sprint 10 of the 24h-loop work plan. Track 6 spec-corpus ratification-proposal deliverable. Resolves SI-015 OQ4 + SI-016 OQ1 + SI-019 OQ7 with a single ratifier decision. Recommendation: Option B (constrained UPDATE + transition log, per P-021 SC3 precedent). Ratifier-targetable independent of Sprint 11+ work.
