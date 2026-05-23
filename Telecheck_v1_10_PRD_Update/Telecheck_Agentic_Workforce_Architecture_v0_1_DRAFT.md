# Telecheck Agentic Workforce Architecture — v0.1 DRAFT

**Status:** DRAFT — pending Codex two-pass adversarial review + Evans ratification
**Author:** Claude (Opus 4.7, 1M context), Evans's local session
**Date:** 2026-05-23
**Successor to:** `Telecheck_Workstream_Discipline_Note_Multi_Agent_Orchestration_v0_1_DRAFT.md` (v1.10 cycle multi-agent orchestration pilot)
**Decision class:** Hard-floor item 6 (net-new platform-floor architecture for HOW the platform gets built; NOT a change to what the platform IS)

## 1. Motivation

The current Telecheck development trajectory is rate-limited by serial single-Claude authoring + a per-PR Codex review gate. At sustained pace (~10 days of observed throughput), the platform is at ~10–12% of full v1.0 surface area + ~15–18% of Ghana-pilot MVP. Realistic single-Claude trajectory: 16–24 weeks to Ghana pilot, 12–18 months to full v1.0.

This document proposes a multi-agent workforce architecture: N specialized Claude agents, each owning a domain repo + subset of spec corpus, converging via an Orchestrator agent + machine-readable canonical state file. The pattern is operationalization of the v1.10 cycle's `Telecheck_Workstream_Discipline_Note_Multi_Agent_Orchestration_v0_1_DRAFT.md` pilot.

The decision Evans must make:
- **Option A:** Bootstrap full 8-agent workforce per this design (Day 1–10 bootstrap, then steady-state).
- **Option B:** Bootstrap minimal 3-agent pilot (Spec + Orchestrator + 1 implementation agent), validate convergence mechanics on 1 slice, expand to full 8-agent on successful pilot.
- **Option C:** Reject; continue current single-Claude serial pattern + hire 4–5 human engineers per prior recommendation.

This document presents the design at a level of detail sufficient for adversarial review + Option choice. Implementation deferred to post-ratification.

## 2. Agent topology

### 2.1 Eight agents + Codex (review service) + Evans (ratifier)

```
              EVANS — ratifier, scope owner, hard-floor item 6 final call
                              ↕
                  ORCHESTRATOR AGENT
                              ↕
   ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
   ↓         ↓         ↓         ↓         ↓         ↓         ↓
  SPEC    CLINICAL  CRISIS/AI ADMIN/OPS  WEB     INFRA    QA/AUDIT
  CORPUS
                              ↓
                          CODEX — per-PR adversarial review per repo
```

### 2.2 Per-agent role + boundaries

| Agent | Repo owned | Reads | Writes | Special discipline |
|---|---|---|---|---|
| **Spec Corpus** | `telecheckONE/` | itself + change requests from other agents | `telecheckONE/` ONLY after ratifier approval | Single-owner for CDM/OpenAPI/State Machines/RBAC/INVARIANTS/AUDIT_EVENTS/Contracts Pack; no other agent writes to canonical contracts |
| **Clinical** | `telecheck-clinical/` | spec corpus, infra contracts, canonical.json | own repo | Owns Pharmacy + Med-Interaction + Refill + Forms/Intake slices; enforces I-002 + I-012 |
| **Crisis/AI** | `telecheck-crisis-ai/` | spec corpus, infra contracts, canonical.json | own repo | Owns Crisis Response + Crisis Detection + AI Service Mode 1/2 slices; enforces I-019 platform-floor + ADR-029 workload taxonomy |
| **Admin/Ops** | `telecheck-admin-ops/` | spec corpus, infra contracts, canonical.json | own repo | Owns Admin Backend + Tenant Admin + Patient Onboarding slices; enforces RBAC v1.1 matrix |
| **Web** | `telecheck-web/` | spec corpus OpenAPI, design system tokens, all backend APIs, canonical.json | own repo | Owns Patient + Clinician web (Next.js); DIC v1.1 + Patient mock v7 binding |
| **Infra** | `telecheck-infra/` | all repos read-only, canonical.json | own repo + CI configs in each repo | Single-owner for cross-cutting platform code (auth/JWT, KMS adapter, observability, deploy, shared libs); only agent permitted to write CI configs across repos |
| **QA/Audit** | shared test infra in each repo | all repos, canonical.json | test directories in each repo | Cross-cutting; runs daily cross-agent consistency audits + invariant-compliance audits (I-019, I-023, I-027, I-029, I-012); maintains integration test harness |
| **Orchestrator** | `telecheckONE/orchestrator/` + canonical.json | all (read), canonical.json (exclusive write) | canonical.json + orchestrator workflow code | Control plane; never writes platform code; routes cross-agent work; heartbeat monitoring; daily digest |

### 2.3 Agent autonomy floor

Every agent operates under the existing CLAUDE.md autonomous-work authorization (Evans's standing directive 2026-05-16+) including the hard-floor item 6 architectural-judgment escalation. Agent-specific extensions:

- **No agent may write outside its repo.** CI gates reject cross-repo writes by non-Infra agents.
- **No agent may edit canonical contracts (CDM/OpenAPI/etc.).** Change requests file to Spec Corpus Agent.
- **No agent may merge its own PR without Codex APPROVE.** Discipline floor unchanged.
- **No agent may resolve a hard-floor item 6 finding inline.** Escalation to Orchestrator → ratifier queue.

## 3. canonical.json — single source of truth

### 3.1 Format

Machine-readable JSON, git-tracked in `telecheckONE/canonical.json`. Updated exclusively by:
1. Orchestrator agent (cross-project state, deps, ratifier queue, milestones)
2. Per-repo GitHub Action on PR-merge (agent heartbeat, PR count, completion %)
3. Spec Corpus agent (canonical versions, pending change requests)

Manual edits forbidden. CI rejects PRs to `telecheckONE/` that touch `canonical.json` without one of the above origins.

### 3.2 Schema (proposed)

```json
{
  "$schema": "https://telecheck.com/schemas/canonical-workforce-v0.1.json",
  "version": "0.1",
  "last_updated": "2026-05-23T20:00:00Z",
  "last_updated_by": "orchestrator-agent",
  "agents": [
    {
      "id": "clinical",
      "claude_session_id": "...",
      "repo": "arthurmenson/telecheck-clinical",
      "status": "active | idle | stalled | offline",
      "last_heartbeat": "2026-05-23T19:55:00Z",
      "active_prs": 3,
      "codex_queue_size": 2,
      "completion_pct_of_assigned_scope": 35,
      "current_focus": "Pharmacy clinician-commit Sprint 1",
      "blockers": [
        {"id": "BLK-001", "description": "awaiting SI-024.1 JWT-binding ratification", "blocks_pr": ["telecheck-clinical#42"]}
      ],
      "owners": {"primary_ratifier": "evans@telecheck.com", "engineering_lead": "tbd"}
    }
  ],
  "spec_corpus": {
    "canonical_versions": {
      "master_prd": "v1.10",
      "cdm": "v1.7",
      "openapi": "v0.3",
      "state_machines": "v1.2",
      "rbac": "v1.2",
      "contracts_pack": "v5.2",
      "design_implementation_contract": "v1.1"
    },
    "pending_change_requests": [
      {"id": "CR-001", "from_agent": "clinical", "target_artifact": "AUDIT_EVENTS", "summary": "add med_interaction.* action IDs to catalog", "status": "drafted | under_ratifier_review | approved | rejected"}
    ],
    "ratification_queue": [
      {"id": "P-043", "type": "hard_floor_6 | sub_decision | promotion_ceremony", "from_agent": "clinical", "summary": "SI-024.1 JWT-binding helper architectural shape", "filed_at": "...", "blocker_for": ["..."]}
    ]
  },
  "cross_project_deps": [
    {"from_agent": "web", "to_agent": "clinical", "contract": "OpenAPI:GET /v0/medications", "contract_version": "v0.3", "status": "satisfied | pending | breaking_change_proposed"}
  ],
  "milestones": {
    "ghana_pilot_target": "2026-08-15",
    "v1_0_target": "2026-11-15",
    "current_phase": "Phase A.1 — pilot slice foundations"
  },
  "messages": [
    {"id": "M-001", "from_agent": "web", "to_agent": "clinical", "type": "contract_clarification | dep_request | conflict", "summary": "...", "filed_at": "...", "status": "open | acknowledged | resolved"}
  ],
  "audit_log": [
    {"timestamp": "...", "actor": "orchestrator-agent | per-repo-hook | spec-corpus-agent", "change_summary": "..."}
  ]
}
```

### 3.3 Convergence mechanics

1. **OpenAPI as cross-agent contract.** When Web Agent calls Clinical Agent's API, the contract is canonical OpenAPI. Breaking changes detected by Web Agent (or any consumer) → automatic ratifier escalation via `cross_project_deps[].status = breaking_change_proposed`.

2. **Spec corpus = single dependency hub.** All agents depend on canonical CDM/OpenAPI/State Machines. Spec Corpus Agent is single-writer; other agents file CRs in `telecheckONE/change-requests/`. Ratifier reviews CRs weekly (batched).

3. **Cross-agent communication exclusively via `canonical.json.messages[]`.** No direct agent-to-agent comms. Orchestrator routes + acknowledges. This eliminates tangled cross-agent dependencies.

4. **Per-PR Codex review per repo.** Adversarial review catches defects + invariant violations at the agent boundary, not at integration time. Codex routing config per repo (each repo has its own `.codex/config`).

5. **QA/Audit Agent runs daily cross-agent consistency check.** Verifies: every canonical CDM entity has at least one storage agent + one CRUD-handler agent; every canonical OpenAPI endpoint is implemented in exactly one repo; every Cat A audit event has at least one emission site; every invariant (I-019 / I-023 / I-027 / I-029 / I-012) is enforced in at least one code path per relevant repo.

6. **Heartbeat + stall detection.** Each agent writes `last_heartbeat` every cycle (default: 30 min). Orchestrator detects stalls (heartbeat age > 2 hours) + alerts ratifier; optionally auto-restarts via cron.

7. **Hard-floor item 6 enforced per agent.** Any architectural-judgment finding inside an agent → agent stops, files ratifier escalation in `canonical.json.spec_corpus.ratification_queue`, blocks dependent PRs, awaits ratifier decision. Orchestrator does NOT decide; only routes.

## 4. Bootstrap sequence

### 4.1 Day 1–10 bootstrap plan (full Option A)

| Day | Deliverable | Owner |
|---|---|---|
| 1 | `canonical.json` v0.1 schema + JSON Schema validator + render-to-markdown utility | Claude (this session) |
| 1 | Per-agent CLAUDE.md templates (8 templates, one per role) | Claude |
| 2 | Orchestrator agent prompt + workflow definition (`telecheckONE/orchestrator/orchestrator-agent.md`) | Claude |
| 2 | Cross-agent message protocol spec + `canonical.json.messages[]` schema | Claude |
| 3 | Repo bootstrap: 5 new GitHub repos (clinical, crisis-ai, admin-ops, web, infra) with templated CI + per-repo Codex routing | Claude + Evans (org admin) |
| 3 | Spec corpus change-request protocol + Spec Corpus Agent prompt + `telecheckONE/change-requests/` directory + CR template | Claude |
| 4 | QA/Audit Agent prompt + initial cross-agent consistency check suite (10–15 rules) | Claude |
| 4 | Heartbeat + stall-detection infrastructure (cron + canonical.json staleness alert) | Claude |
| 5 | First end-to-end test: 2 agents (Clinical + Infra) running in parallel, with Orchestrator routing a cross-project dep (Clinical needs JWT helper from Infra) | Claude + Evans (oversight) |
| 6–10 | Iterate based on day-5 test breakage; onboard remaining 4 agents one at a time (Crisis/AI → Admin/Ops → Web → QA/Audit) | Claude |
| End of Week 2 | Full 8-agent workforce live + first cross-agent PRs flowing + first weekly Orchestrator digest to Evans | All |

### 4.2 Option B alternative — minimal 3-agent pilot

If Evans prefers de-risked path:

| Day | Deliverable |
|---|---|
| 1–3 | Same Day 1–3 as Option A (canonical.json + Orchestrator + Spec Corpus Agent + 1 implementation repo) |
| 4 | Bootstrap ONLY Clinical Agent + run on 1 slice (Med-Interaction Sprint 2) |
| 5–14 | Observe convergence on 1 slice. Measure: PR throughput, defect rate caught by Codex, ratifier queue depth, canonical.json drift incidents |
| Day 15 | Decision point: expand to full 8-agent (success criteria met) OR pivot |

Trades 1–2 weeks of latency for risk-reduction. Recommended if Evans is uncertain.

## 5. Cost analysis

### 5.1 Compute (per agent, steady state)

Per agent at sustained autonomous pace: ~10–30 PRs/day × ~30k tokens per PR cycle (including Codex back-and-forth) = ~300k–1M tokens/day. At Claude Opus pricing tier:
- 6 working agents: ~$200–1000/day in Claude compute
- Codex review: ~$100–500/day (per-repo per-PR)
- Total steady-state: **~$300–1500/day = ~$110k–550k/year**

### 5.2 Human cost comparison

Equivalent productivity via human engineers: 6 senior engineers @ ~$170k/yr loaded = **~$1M/yr**. Agentic ~10–55% the cost.

### 5.3 Bootstrap cost

~2 weeks of focused Claude time + Evans's ratifier attention (~5 hours/week during bootstrap). Cash cost ~$2–10k in compute. Opportunity cost: 2 weeks of foregone code authoring at current rate (~10–20 PRs not shipped during bootstrap).

### 5.4 Hybrid model (agents + 1–2 humans)

Best-of-both: agents do bulk; humans on highest-risk surfaces (security, regulatory, clinical safety).
- 6 agents @ ~$300k/yr compute + 2 senior humans @ ~$340k/yr loaded = **~$640k/yr**
- ~64% of pure-human cost; ~2–3x velocity of pure-human at parity headcount

Recommended once budget allows.

## 6. Risks + mitigations

### R1. Compound hallucination across N agents
Each agent ~95% correct rate; 6 agents on related work compounds error rate. **Mitigation:** Codex adversarial review per PR + QA/Audit Agent runs daily cross-agent consistency check + Orchestrator monitors drift indicators (canonical.json schema validation failures, OpenAPI contract test failures, invariant violations caught in audit).

### R2. Spec drift (highest-severity failure mode)
If two agents both assume different versions of a contract, integration breaks late + expensively. **Mitigation:** Spec corpus single-write-owner (Spec Corpus Agent only); all other agents READ ONLY; OpenAPI contract tests in CI per repo; QA/Audit Agent runs nightly contract-drift detector.

### R3. Ratifier (Evans) becomes the bottleneck
6 agents firing fills ratifier queue faster than human throughput. **Mitigation:** weekly batched ratifications (not per-decision) + designate an Engineering Lead (human or senior contractor) to handle non-platform-floor sub-decisions + canonical.json `ratification_queue` ordered by urgency + downstream-blocker count.

### R4. Agent stalls (the Wave-3 silent-agent failure mode)
Agents went silent at ~120+ min in Wave 3a. **Mitigation:** heartbeat protocol + Orchestrator stall detection (>2 hour heartbeat age = alert) + auto-restart via cron + smaller per-agent task scope (1 handler per agent vs 4 reduces blast radius on stall).

### R5. Genuine ambiguity needs humans
Novel architectural decisions, regulatory edge cases, clinical safety questions exceed agent judgment. **Mitigation:** hard-floor item 6 escalation per agent + hybrid model with 1–2 senior humans on high-risk surfaces + Evans as final ratifier on architectural-judgment.

### R6. Observability degrades across 8 agents
When something goes wrong, debugging is harder than 1 agent. **Mitigation:** structured logging per agent (writes to canonical.json `audit_log[]`) + Orchestrator daily digest surfaces anomalies + per-repo Sentry/CloudWatch integration + QA/Audit Agent runs hourly health check.

### R7. No customer feedback loop pre-pilot
Agents build blind until Ghana pilot launches. **Mitigation:** ship pilot fast (target 8 weeks under Option A) + instrument heavily from day 1 + iterate v1.1+ on real user data.

### R8. Canonical.json corruption / drift
If canonical.json stops matching reality, the whole convergence mechanism collapses. **Mitigation:** automated PR-merge updates (no manual edits) + CI rejects PRs with malformed canonical.json + Orchestrator runs hourly consistency check (canonical.json claims vs git reality) + immutable audit log of all canonical.json changes.

### R9. Cross-project breaking changes
Change touching 3 repos requires 3 coordinated PRs. Today's single-repo monolith has 1 PR. **Mitigation:** OpenAPI contracts as the explicit interface (breaking changes detected automatically); Infra Agent owns cross-cutting changes; RFC pattern for any change touching 2+ repos.

### R10. Initial bootstrap cost is real
2 weeks of focused setup work + Evans's attention is non-trivial during a time when shipping seems urgent. **Mitigation:** Option B (3-agent pilot) de-risks; even Option A's 2-week cost amortizes against the 12–18 month timeline of the current trajectory.

## 7. Success criteria

For Evans to evaluate at end of Day 14 (Option A) or Day 14 of pilot (Option B):

1. **Throughput.** Cumulative PRs across all agents > 2x prior 14-day single-Claude baseline (~30+ PRs vs current ~15).
2. **Defect rate.** Codex APPROVE on first round ≥ 70% of PRs (matches or exceeds single-Claude rate).
3. **Canonical.json integrity.** Zero unexplained drift incidents over 14 days; all updates trace to known sources.
4. **Cross-agent dep resolution time.** Median dep resolution (filed → satisfied) < 48 hours.
5. **Ratifier queue depth.** Median wait time for ratifier decisions < 5 business days.
6. **Stall recovery time.** Median stall detection-to-restart < 1 hour.
7. **Spec drift.** Zero unauthorized spec corpus writes detected by audit.
8. **Cross-agent contract violations.** Zero OpenAPI contract violations escape to integration.

Failure on 2+ criteria triggers retrospective + adjustment (not necessarily termination). Failure on 4+ criteria triggers pivot consideration.

## 8. Open questions for Codex review

The following are explicit open questions for adversarial review. Codex is invited to challenge any of these (or anything else in the design):

1. **Q1.** Is the 8-agent topology the right partition, or does it create more coordination overhead than the parallelism wins back? Specifically, should QA/Audit be merged into Orchestrator? Should Spec Corpus + Orchestrator be one agent?

2. **Q2.** Is canonical.json's single-write-owner discipline enforceable in practice? What attack surface does the per-repo PR-merge hook open? What happens if two hooks fire concurrently on the same canonical.json field?

3. **Q3.** Is the cross-agent communication-via-canonical.json model adequate, or do we need richer agent-to-agent comms (e.g., direct RPC, shared message queue)? What's the latency cost of routing every cross-agent ping through Orchestrator?

4. **Q4.** Is the per-repo Codex routing scalable? Does Codex's authorization model + rate-limit support 5+ parallel review streams? If Codex is on usage-limit pause (as it is at time of design), the whole workforce stalls — is this an acceptable single point of failure?

5. **Q5.** Is the bootstrap day-1-to-10 sequence realistic? Day 5's "first end-to-end test with 2 agents + Orchestrator routing a cross-project dep" assumes a lot of plumbing works on first try; what's the realistic recovery if it doesn't?

6. **Q6.** Are the 8 success criteria measurable + meaningful? Does the 70% Codex-APPROVE-on-first-round target account for the increased defect density from N parallel authors?

7. **Q7.** Does the hybrid model (agents + 1–2 humans) introduce coordination overhead that erases the cost savings vs pure-human? What's the right human role: senior IC, tech lead, or both?

8. **Q8.** Are there agent-specific failure modes the design misses? E.g., what if Spec Corpus Agent itself drifts or hallucinates a CDM amendment that ratifier inadvertently approves? Does the ratifier need a separate adversarial review on CR approvals?

9. **Q9.** Does the design adequately handle the case where Evans (sole ratifier) is unavailable for an extended period? Is there a delegated-authority fallback or do all agents stall on ratifier dependency?

10. **Q10.** Is the cost analysis realistic? Are Claude Opus token-rate estimates per PR plausible, or do agents in practice burn 2–3x the tokens expected from coordination overhead, re-reads, and Codex back-and-forth?

11. **Q11.** Does the architecture handle production incidents (e.g., a P0 in prod after pilot launches) where multiple agents need to converge on a single hot-patch under time pressure? The current design assumes async PR flow; incident response requires sync coordination.

12. **Q12.** What's the migration path if Option A fails the success criteria at Day 14? Is there a clean rollback to single-Claude that doesn't lose the work the agents have shipped?

## 9. Decision matrix for Evans

| Criterion | Option A (Full 8-agent) | Option B (3-agent pilot) | Option C (Single-Claude + humans) |
|---|---|---|---|
| Bootstrap latency | 2 weeks | 1 week + 2 weeks pilot | 0 (continue current) |
| Cost (Year 1) | ~$300k–550k compute | ~$100k–200k compute + pivot | ~$1M salaries + ~$50k compute |
| Velocity multiplier vs today | 8–12x at steady state | 2–3x during pilot, 8–12x post-expand | 2–4x (depends on hire speed) |
| Risk profile | High (novel architecture) | Medium (de-risked via pilot) | Low (proven pattern but slow) |
| Time to Ghana pilot | ~8 weeks | ~10–12 weeks | ~14–20 weeks |
| Single-point-of-failure surface | Codex review service + Orchestrator + canonical.json | Same but smaller blast radius during pilot | Evans (ratifier) + me (single Claude) |
| Recoverability if it fails | Medium (rollback complex) | High (small pivot cost) | N/A (no change) |

## 10. Recommendation (deferred to Codex Pass-1 / Claude Pass-1 separation)

Per the dual-recommendation two-pass discipline codified in CLAUDE.md (2026-05-20), Claude's recommendation on Option A/B/C is held in a separate artifact (`Agentic_Workforce_Claude_Recommendation_2026-05-23.md`) and surfaced to Evans only AFTER Codex Pass-1 (source-first independent) completes. This document is the source material Codex Pass-1 reviews without Claude's framing.

## 11. References

- `Telecheck_Workstream_Discipline_Note_Multi_Agent_Orchestration_v0_1_DRAFT.md` — v1.10 cycle multi-agent orchestration pilot (precedent)
- `Telecheck_Master_Platform_PRD_v1_10.md` — canonical platform PRD
- `Telecheck_Master_Completion_Plan_v1_0.md` — Track 1–6 critical-path plan
- `CLAUDE.md` (project) — autonomous-work authorization + hard-floor item 6 + dual-recommendation two-pass discipline + auto-proceed rule
- `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Contracts_Pack_v5_00_INVARIANTS.md` — 31 platform invariants
- `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_ADR_Set_v1_0.md` — 29 architecture decisions
- `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_OpenAPI_v0_2.md` — canonical API surface (cross-agent contract substrate)

---

**End of v0.1 DRAFT. Pending Codex two-pass adversarial review per dual-recommendation discipline.**
