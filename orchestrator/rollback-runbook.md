# Agentic Workforce — Rollback Runbook

**Status:** Authored Day-1 of pilot (post-P-043). Day-0 dry-run obligation per design v0.2 §4.3.
**Owner:** Ratifier (Evans / Engineering Lead) + Orchestrator Agent (execution)
**Scope:** Pilot rollback (3 agents → 0); post-expansion rollback (7 agents → reduced or 0)

---

## When this runbook fires

ANY of the following triggers a rollback decision per design v0.2 §7.3:

- Failure on 2+ pilot success criteria at Day 14 evaluation
- ANY hard-stop expansion gate fires (HSG-1 through HSG-7 per design v0.2 §7.2)
- ANY P0 invariant breach with platform impact (consider Option C pivot)
- Ratifier convening + decision to pause (Evans's chat-message authority)

## Decision tree

```
                Trigger fires
                     │
                     ▼
     Orchestrator emits workforce_pause_invoked event
                     │
                     ▼
       All agents observe pause (≤ 30 min via heartbeat)
                     │
                     ▼
                Snapshot state
                     │
                     ▼
            Ratifier convenes (≤ 48h)
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   PATH A          PATH B        PATH C
   Partial         Full          Pivot to
   rollback        rollback      humans
                     │
                     ▼
              Per-path execution
                     │
                     ▼
        Promotion Ledger entry + Addendum
```

## Path A — Partial rollback (1 agent fails, others continue)

**When:** Single agent stall / repeated CR rejection / scope-too-large signal. Other agents healthy.

**Steps:**
1. Orchestrator emits `workforce_pause_invoked` event with `scope: "agent: <agent-id>"`.
2. Other agents continue normal operation; affected agent stops at next heartbeat.
3. Ratifier reviews affected agent's recent PRs + Codex round history + reasoning trace.
4. Ratifier issues `ratification_decision` with outcome = `modify`: refined agent CLAUDE.md template (tighter scope, different prompt, etc.).
5. Affected agent restarts with new CLAUDE.md.
6. Pilot continues; Day 14 evaluation deferred by 3–5 days if necessary.

**Recovery time:** 1–3 days.

## Path B — Full rollback (all 3 pilot agents pause, consolidate)

**When:** Multiple agents struggling, canonical event log integrity questionable, architectural-judgment finding requires rethink.

**Steps:**
1. Orchestrator emits `workforce_pause_invoked` event with `scope: "all"`.
2. ALL agents observe pause within 30 min.
3. **Snapshot:** `canonical-events/` directory + `canonical.json` + each repo's git state → S3 versioned bucket. Commit hash + event-log sha256 captured as `pre_rollback_state` event.
4. Ratifier convenes (Evans + Engineering Lead + any domain expert) within 48h.
5. Ratifier reviews: which hard-stop gate fired, what's recoverable, what's lost, what's the consolidation path.
6. **Per-repo work retained:** each repo's git history is preserved. `consolidation-ready` git tags at every PR merge are guaranteed-safe rollback points (typecheck + tests pass).
7. **Coordination state retained:** canonical event log is append-only — nothing lost. `canonical.json` rebuilt by `npx telecheck-orchestrator replay-events` after corrective events appended.
8. **What's lost:** agent runtime state (in-progress reasoning, partial PRs not yet committed).
9. **Resume:** either restart workforce with fixes, OR proceed to Path C.

**Recovery time:** 3–7 days.

## Path C — Pivot to humans (workforce paused indefinitely)

**When:** Architectural questions exceed agent judgment. Multiple unrecoverable failures. Investor/clinical/regulatory pressure to humanize the workflow.

**Steps:**
1. Workforce paused indefinitely via `workforce_pause_invoked` event with `scope: "all", resume_pending: "human_team_hire"`.
2. Per-repo work retained (each repo persists as standalone slice repo OR folds back into `telecheck-app` monorepo at maintainer choice).
3. Each repo's `consolidation-ready` tag becomes the new pre-human-takeover baseline.
4. Hire 4–5 humans per Option C from the original recommendation (Senior backend × 2 + Senior frontend × 2 + DevOps × 1 + QA × 1).
5. Canonical event log + `canonical.json` retained for forensic analysis + future restart.
6. Cockpit retained as human-facing operations dashboard (humans use the same Cockpit / Work / Spec Corpus tabs).
7. Promotion Ledger entry recording the pivot decision + rationale.

**Recovery time:** 4–8 weeks (hiring delay).

## Per-path Promotion Ledger entry

Every rollback execution gets a Promotion Ledger entry (the workforce architecture rollback is itself a meta-architecture decision per P-043 precedent):

```markdown
### Entry P-XXX — YYYY-MM-DD — Agentic Workforce rollback executed (Path A | B | C)

**Classification:** Reconciliation / meta-architecture entry.
**Trigger:** <hard-stop gate or success criteria that fired>
**Path:** <A | B | C>
**Pre-rollback state snapshot:** canonical-events sha256 + repo HEAD commits + S3 snapshot URL
**Ratifier convening:** <date + names>
**Rationale:** <2–3 sentences>
**Recovery target:** <date when workforce expected to resume OR "indefinite pause">
**Resume path:** <path-specific resume rule>
```

## Day-0 dry-run (BLOCKING for pilot start)

Per design v0.2 §4.3, the rollback runbook MUST be tested by dry-run before Day-4 pilot agent firing. Dry-run sequence:

1. Bootstrap 3 pilot agents on test bench (not production canonical event log; use `canonical-events-test/` directory).
2. Have each agent emit 1 heartbeat to confirm event log writes work.
3. Orchestrator invokes `workforce_pause_invoked` event manually.
4. Confirm all 3 agents observe pause within 30 min via next heartbeat.
5. Confirm S3 snapshot succeeds (event log + canonical.json + repo HEAD commits captured).
6. Confirm last `consolidation-ready` tag exists in pilot repo (or scaffolded so it can be created).
7. Mark dry-run complete in pilot Day-3 deliverables.

**If dry-run fails:** Day-4 pilot start is delayed until rollback mechanics are proven.

## References

- Architecture: `Telecheck_v1_10_PRD_Update/Telecheck_Agentic_Workforce_Architecture_v0_1_DRAFT.md` v0.2 §4.3 (rollback runbook) + §7.2 (hard-stop expansion gates) + §7.3 (failure-mode response)
- Ratification: `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Promotion_Ledger.md` Entry P-043
- Orchestrator escalation triggers: `agents/orchestrator-agent.md` §"Escalation triggers"
- Cockpit consumption: `arthurmenson/telecheck-cockpit` (Cockpit hero metrics surface hard-stop gate status + ratifier queue depth)
