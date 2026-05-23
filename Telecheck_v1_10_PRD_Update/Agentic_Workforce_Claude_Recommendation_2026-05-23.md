# Claude's Recommendation — Agentic Workforce Architecture v0.1 DRAFT

**Date:** 2026-05-23
**Author:** Claude (Opus 4.7, 1M context), Evans's local session
**Companion to:** `Telecheck_Agentic_Workforce_Architecture_v0_1_DRAFT.md`
**Discipline:** Held separately per the dual-recommendation two-pass discipline codified in CLAUDE.md (2026-05-20). Surfaced to Evans only AFTER Codex Pass-1 (source-first independent) completes.

## Recommendation: **Option B** (3-agent pilot then expand)

## Rationale

The agentic workforce architecture is the right end-state but it's novel. The risks I'd want to retire before committing all 8 agents are:

1. **canonical.json convergence under contention.** The per-repo PR-merge hook design has concurrent-write risk. Optimistic locking + retry needs to be proven, not assumed. With 8 agents this happens hourly; with 3 it happens daily — easier to debug.

2. **The Wave-3 silent-stall failure mode is not solved yet.** Heartbeat + auto-restart are in the design but unproven at sustained 14-day pace. Pilot with 3 reveals whether the recovery mechanics work before betting 8.

3. **Cross-agent message routing via canonical.json `messages[]`.** Adequate in theory but untested at scale. With 3 agents the message flow is observable + debuggable; with 8 it's a graph.

4. **Spec Corpus Agent as single-writer of canonical contracts is load-bearing.** If it hallucinates a CR approval that ratifier rubber-stamps, the whole platform inherits the defect. The pilot validates whether the Spec Corpus Agent + Codex pre-approval (added per Q8) + ratifier triple-gate is tight.

5. **Codex usage-limit dependency is unresolved.** At time of design Codex is paused until May 26. If the workforce stalls every time Codex is rate-limited, the architecture has a single point of failure that wasn't fully analyzed. Pilot scope reveals real Codex-pause-blast-radius before scaling.

6. **The 8 success criteria are unproven as measurable.** Some (e.g., "median cross-agent dep resolution time < 48 hours") may not be cleanly measurable without instrumentation work that itself takes days. Pilot reveals which criteria are real vs aspirational.

Option B costs ~1–2 weeks of additional calendar latency vs Option A. Against a 12–18 month full-platform timeline, this is negligible. The information value of the pilot (does the architecture actually work?) exceeds the cost of the delay.

Option C (single-Claude + hire humans) is too slow + doesn't fix the actual bottleneck. The bottleneck isn't authoring speed; it's coordination + serial review. Adding humans without parallelizing repos + adding canonical-state infrastructure leaves you with the same shape, just more bodies. Humans are valuable but only after Option B's infrastructure is in place — at which point hybrid (Option B + 2 humans) is the best end-state.

## Answers to the 12 open questions

### Q1. Is the 8-agent topology the right partition?

Mostly yes. Two refinements:

- **Merge QA/Audit + Orchestrator initially.** Both are control-plane (no platform code writes). Split when QA scope demands it (likely month 2–3). Reduces day-1 complexity.
- **Spec Corpus must stay separate from Orchestrator.** Different responsibilities (canonical contract writes vs cross-agent routing). Combining creates a write-permission entanglement that increases drift risk.

Net: **7 agents at day 1 (Spec Corpus, Clinical, Crisis/AI, Admin/Ops, Web, Infra, Orchestrator+QA), splitting to 8 when QA scope demands.**

### Q2. Is canonical.json single-write-owner enforceable in practice?

Conditionally yes. Required additions:

- **Optimistic locking** on canonical.json (`version` field; PR-merge hook does compare-and-swap; retries on conflict).
- **CI gate** in `telecheckONE/` rejects any PR touching canonical.json that doesn't originate from one of the 3 sanctioned sources (Orchestrator agent, per-repo PR-merge hook, Spec Corpus agent). Verified via commit author + signed commits.
- **Audit log** of every canonical.json change is itself stored in canonical.json `audit_log[]` (recursive). Tamper-detected on hash chain.
- **Schema validator** runs on every PR; malformed canonical.json blocks merge.

Without these 4 protections, single-write-owner is unenforceable.

Attack surface of per-repo PR-merge hook: any contributor with merge permission in a project repo can poison canonical.json via crafted commit. Mitigation: hook only updates fields scoped to that repo's agent; cross-cutting fields (cross_project_deps, ratification_queue) are Orchestrator-only.

### Q3. Cross-agent comms via canonical.json adequate?

For async: yes. For sync: no.

Add to design:
- **Synchronous fallback channel** for incident response (Q11) — likely Slack MCP or direct human-in-loop.
- **Routing latency expectation:** Orchestrator runs every 5 min in steady state, so cross-agent message routing has ~5 min p50 latency. Acceptable for most coordination; unacceptable for hot-path coordination.

### Q4. Per-repo Codex routing scalable? Codex as SPOF acceptable?

Codex single-point-of-failure is the most concerning gap in the design. Current usage-limit pause is exactly this scenario. Mitigations:

- **Multi-LLM review.** Add a second adversarial reviewer (e.g., GPT-4 via different API, or Claude Sonnet via different account) for redundancy. Codex remains primary; secondary kicks in when Codex is down.
- **Codex pause = workforce pause is acceptable for 1-3 days** (current pause shape). Codex pause > 1 week needs the multi-LLM fallback.
- **Per-repo Codex routing** is fine technically; the rate-limit is per-account, not per-repo, so total review throughput is bounded by Codex API quota.

### Q5. Bootstrap Day 1–10 realistic?

Aggressive. Realistic:

- **Day 5 end-to-end test will take 2 attempts.** First attempt likely fails on canonical.json contention or repo-permissions plumbing. Add 1-day buffer.
- **Day 6–10 "onboard remaining 4 agents one at a time"** is ambitious; realistic is 1 agent every 2 days = 8 days for the remaining agents.
- **Realistic full Option A bootstrap: 12–14 days, not 10.**

Under Option B, day 5 end-to-end test on Clinical Agent + Orchestrator + Spec Corpus is the validation gate. Plan for 2 attempts.

### Q6. Success criteria measurable + meaningful?

Mostly. Adjustments:

- **Lower the Codex APPROVE on first round target from 70% → 60%** for the first 30 days. N parallel authors increases defect density; pattern stabilizes over time.
- **Cross-agent dep resolution time (< 48 hours)** is hard to measure cleanly. Add instrumentation: every dep gets `filed_at` + `satisfied_at` timestamps in canonical.json.
- **Stall recovery time (< 1 hour)** is reasonable if heartbeat interval is 30 min and Orchestrator runs every 5 min. Verify with real stall injection during pilot.

Add a 9th criterion: **No ratifier-queue items aged > 7 business days without resolution or explicit deferral.** Catches Evans-as-bottleneck early.

### Q7. Hybrid model coordination overhead?

Real concern. The right human role is **Engineering Lead + 1 Senior IC**:
- **Engineering Lead (1 hire):** Ratifier-delegate for non-platform-floor sub-decisions; weekly review of canonical.json; spec corpus CR triage before ratifier sees them.
- **Senior IC (1 hire):** Security + regulatory compliance + clinical safety reviews. Reviews any PR touching auth/JWT, KMS, clinical safety paths, PHI handling.

Avoid: humans doing the same work as agents. That creates tangle. Humans do what agents can't (judgment, ratification, novel decisions). Agents do what humans don't need to (pattern execution, repetition, 24/7 work).

### Q8. Spec Corpus Agent hallucinating CDM amendment?

Real risk. Add to design:

- **Codex pre-approval review on every CR before ratifier sees it.** Spec Corpus Agent drafts CR; Codex runs adversarial review on the proposed change; only CRs that pass Codex get into the ratifier queue.
- **Ratifier sees Codex's review attached to every CR.** Ratifier is final approver, not first-pass reviewer.
- **QA/Audit Agent runs nightly schema-drift detector** comparing canonical contracts against all agents' assumptions (e.g., does every CDM entity field referenced in a slice repo exist in the canonical CDM?).

### Q9. Evans unavailable for extended period?

Designate **Engineering Lead with delegated authority** for non-platform-floor sub-decisions (matches Q7 hire). Evans retains exclusive authority on:
- Hard-floor item 6 architectural-judgment escalations
- Invariant amendments (I-001 through I-031)
- Promotion Ledger P-NN ratifications
- New ADR-class decisions
- Spec corpus major-version bumps (e.g., CDM v1.7 → v1.8)

Delegated to Engineering Lead:
- CR triage + within-scope sub-decisions
- Cross-project conflict resolution (when both agents have ratified working analyses)
- Workforce scaling decisions (add/remove agent)
- Routine ratification ceremonies (per-PR canonical.json bumps)

If both Evans + Engineering Lead unavailable > 7 days: workforce auto-pauses; canonical.json captures state; resumes on return.

### Q10. Cost analysis realistic?

Estimates are likely **1.5–2x understated** due to coordination overhead, re-reads of canonical.json, and Codex back-and-forth iterations. Realistic full Option A steady-state: **~$500k–800k/yr compute** (vs design's $300k–550k).

Bootstrap cost: ~$5–15k in compute (vs design's $2–10k) given the 2 attempts on day 5.

Hybrid model (7 agents + 2 humans) realistic: **~$750k–950k/yr total** — still ~75% of pure-human cost with 8–12x velocity. ROI holds.

### Q11. Production incident response?

The async PR flow is inadequate for P0 incidents. Add:

- **Incident response mode** for any agent: bypasses normal Codex review for hot-patches; post-incident audit retroactively reviews the patch within 48 hours.
- **Single "incident commander" role** rotates among agents (or stays with Infra Agent permanently). When incident declared, commander coordinates sync via Slack MCP + canonical.json `incident[]` field.
- **Rollback authority** to last known-good main per repo is pre-authorized for Incident Commander.
- **Evans is the only declarer** of an incident (or Engineering Lead if delegated).

### Q12. Migration path if Option A fails at Day 14?

Hard. Mitigation:

- **Daily canonical.json snapshot** to immutable storage (S3 versioned bucket or similar). Rollback = revert to last known-good snapshot + freeze workforce.
- **Per-repo work is recoverable** since each repo retains git history. Cross-cutting state (deps, ratifier queue) is the loss.
- **Defined retreat path:** workforce paused; canonical.json snapshot frozen; each repo continues as standalone with last-known-good state; humans or single-Claude resume single-Claude pattern on each repo.
- **No work is lost** under rollback; coordination state is lost (rebuilt within 1–2 days by human walkthrough of git logs).

Under Option B, rollback is much cheaper: 3 agents pause, 1 implementation repo gets folded back into telecheck-app or kept as a standalone slice repo. Probably ~1 day of cleanup.

## Framing concerns Codex may catch (self-flagged)

1. The design doc lists Codex as a "review service, not an agent" but Codex has autonomy (decides verdict, drafts findings). The boundary may need clarification.

2. The "hybrid model" cost analysis in §5.4 is optimistic about the human roles' compatibility with agent workflows. Real coordination cost between humans + agents is unknown.

3. The QA/Audit Agent's daily cross-agent consistency check assumes the consistency rules can be expressed in code. Some invariants (e.g., I-019 crisis-floor) are semantic + may not be machine-checkable without false positives.

4. The 8-agent topology doesn't include a dedicated **Pharmacy** agent even though Pharmacy + Med-Interaction + Refill are 3 slices folded into Clinical. If Clinical Agent's scope is too broad, may need to split. Pilot reveals this.

5. The design doesn't address **how agents discover what they should work on next**. The Orchestrator routes cross-project deps but per-agent work prioritization (which of N possible PRs to author next) is left to each agent's own judgment. May produce thrashing or local-optimum behavior.

6. The cost analysis doesn't account for **Codex token spend per PR**. Per-PR Codex review is itself $5–20 in API cost; at 30 PRs/day across 6 agents that's $30–120/day in Codex alone.

7. The success criteria don't include **defect escape rate to integration tests** — the metric that actually matters for production quality.

## Strongest argument FOR Option A

If Evans's window of attention is itself a constrained resource and the 1-week pilot would consume his attention without significantly different information than Option A's full bootstrap, Option A may be better. The pilot's information value is high only if Evans can use that information to make a better decision; if his decision is "ship the workforce regardless," then Option B costs latency without benefit.

This is the argument I'd want Codex to either confirm or refute.

## Strongest argument FOR Option C

If the failure mode of the agentic workforce is "subtle, late-stage spec drift that doesn't surface for 4-8 weeks," then any agentic pilot under-tests the architecture. Humans + Claude continue to work, slower but predictably, until a domain expert (an experienced Distinguished Engineer who has built a multi-agent platform before) is hired to lead Option A bootstrap. This trades 4–8 weeks of velocity for radically reduced architectural risk.

This is the second-strongest counterargument and I'd want Codex to weigh it.

## What I'd want to see in Codex Pass-1

- Codex's independent option choice (A / B / C) without anchoring on my recommendation
- Codex's independent option enumeration (does it propose a D? E?)
- Codex's challenge to the 8-agent partition (Q1)
- Codex's analysis of the canonical.json contention risk (Q2)
- Codex's analysis of the Codex-as-SPOF concern (Q4)
- Codex's challenge to the cost analysis (Q10) — am I undercounting?
- Any failure mode I missed

## Final recommendation to Evans (synthesis-ready)

**Option B (3-agent pilot then expand).** Cost: ~1 week additional latency vs Option A. Benefit: validates novel architecture on 1 slice before committing 8 agents. Expansion at day 14–15 if success criteria met. Pivot to Option C if failed.

Concrete next step if Evans approves Option B: I begin Day 1–3 deliverables (canonical.json schema + 3 agent prompts + Spec Corpus CR protocol + first repo bootstrap for Clinical) immediately. End of week 1 you have something concrete to react to.

Final answer surfaced to Evans only AFTER Codex Pass-1 returns + Pass-2 synthesis completes.

---

**End of Claude's Pass-2-ready recommendation. Held until Codex Pass-1 returns.**
