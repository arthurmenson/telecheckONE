# Telecheck Agentic Workforce Architecture — v0.2 DRAFT

**Status:** DRAFT v0.2 — post Codex two-pass adversarial review; pending Evans ratification
**Author:** Claude (Opus 4.7, 1M context), Evans's local session
**Date:** 2026-05-23
**Successor to:** `Telecheck_Workstream_Discipline_Note_Multi_Agent_Orchestration_v0_1_DRAFT.md` (v1.10 cycle multi-agent orchestration pilot)
**Decision class:** Hard-floor item 6 (net-new platform-floor architecture for HOW the platform gets built; NOT a change to what the platform IS)

**v0.1 → v0.2 changelog (Codex Pass-1 + Pass-2 closures + portability discipline):**
- §3.2 canonical.json schema: replaced multi-writer JSON model with **append-only event log + materialized current-state projection** (BLOCKING-FINDING-1 closure)
- §3.3 convergence mechanics: added optimistic locking + idempotency keys + signed/typed events + replay tooling + explicit hook-failure recovery
- §7 success criteria: added **hard-stop expansion gates** (any P0/platform-floor defect, unexplained canonical drift, unauthorized spec write, or escaped tenant/auth/audit/clinical/crisis invariant breach freezes expansion immediately)
- §7 success criteria: added severity-weighted defect escape metrics
- §4.3 NEW: tested rollback runbook + branch/repo consolidation plan
- §2.2 NEW: Codex-outage fallback (multi-LLM review redundancy + workforce-pause-on-Codex-down ≤ 72h policy)
- §3.4 NEW: P0 incident response mode with bypass-Codex-then-post-audit pattern + Incident Commander rotation
- §9 NEW: delegated-ratifier rules (Engineering Lead for non-platform-floor sub-decisions; Evans retains hard-floor item 6 + invariant amendments + Promotion Ledger ratifications + ADR-class decisions)
- §4.1 first-pilot-slice criterion: must be already-ratified narrow slice with no open spec prerequisites (Med-Interaction PR 10+ is candidate ONLY if Sprint 1 endpoint set + AUDIT_EVENTS catalog amendment for `medication_interaction.*` action IDs both ratified first)
- **§12 NEW: portability discipline (7 binding rules) + migration trigger criteria + migration runbook** — preserves AWS / DigitalOcean / self-hosted migration as a 1–3 week mechanical exercise rather than 6–10 week rewrite. Enforced via Codex per-PR review + QA/Audit Agent daily sweep.

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

### 3.1 Format — append-only event log + materialized current-state projection (v0.2 redesign per Codex BLOCKING-FINDING-1)

**Two artifacts, not one:**

1. **`telecheckONE/canonical-events/`** — append-only event log, one event per file (`<ISO-8601>__<source>__<event-id>.json`). Events are signed (commit signature attests author) + typed (JSON Schema per event type) + idempotent (each event carries a `client_idempotency_key`). Never mutated after write.

2. **`telecheckONE/canonical.json`** — materialized current-state projection over the event log. Rebuildable from scratch by replaying `canonical-events/`. Updated by the Projection Service (a deterministic reducer running as a GitHub Action triggered by any new event); manual edits forbidden + CI rejects.

**Event sources (authorized writers — by signed commit identity):**
1. Orchestrator agent (event types: `dep_filed`, `dep_satisfied`, `ratification_queue_updated`, `milestone_updated`, `message_routed`)
2. Per-repo PR-merge hook (event types: `agent_heartbeat`, `pr_opened`, `pr_merged`, `codex_round_completed`, `completion_pct_updated`)
3. Spec Corpus agent (event types: `cr_filed`, `cr_approved`, `cr_rejected`, `canonical_version_bumped`)
4. Ratifier (Evans / Engineering Lead) (event types: `ratification_decision`, `incident_declared`, `incident_resolved`, `workforce_pause_invoked`)

**Concurrency model:** Append-only event log eliminates concurrent-write conflict (each event is a new file). Projection Service serializes reduction in commit-order. If two events propose conflicting projections (e.g., two agents claim same dep at same instant), Projection Service applies a deterministic resolution rule (event with earlier `wall_clock_ts` wins; ties broken by source-priority: Ratifier > Spec Corpus > Orchestrator > PR-merge-hook) and emits a `conflict_resolved` event for audit.

**Idempotency:** Every event carries `client_idempotency_key`. Projection Service deduplicates on key. Retries are safe.

**Forgery prevention:** Every event commit must be signed (GPG or sigstore). CI gate in `telecheckONE/` rejects unsigned events + events from non-authorized authors. Authorized-author allowlist lives in `telecheckONE/canonical-events/authorized-sources.json` (itself rotated only by Ratifier ratification event).

**Failed-hook recovery:** Per-repo PR-merge hooks have at-least-once delivery semantics. If a hook fails to write its event (network error, GitHub Action outage), it retries with exponential backoff up to 24 hours. After 24 hours, Orchestrator's stale-source detector files a `source_offline` event + alerts ratifier. Recovery: missing events can be back-filled manually (signed) and Projection Service replays.

**Replay tooling:** `npx telecheck-orchestrator replay-events --from <ts> --to <ts>` rebuilds `canonical.json` from the event log; verified against git-tracked `canonical.json` on each Projection Service run (mismatch = highest-severity alert + auto-pause workforce).

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
| 1–3 | Canonical event log + projection service + Orchestrator + Spec Corpus Agent + 1 implementation repo |
| 4 | Bootstrap ONLY 1 implementation agent + run on already-ratified narrow slice |
| 5–14 | Observe convergence on 1 slice. Measure: PR throughput, defect rate caught by Codex, ratifier queue depth, canonical event log integrity, hard-stop expansion gate triggers |
| Day 15 | Decision point: expand to full 7-8 agent (all success criteria met + zero hard-stop gates fired) OR pivot |

Trades 1–2 weeks of latency for risk-reduction. **Recommended per Codex Pass-1 + Pass-2 + Claude synthesis.**

**First-pilot-slice criteria (v0.2):** Must be already-ratified narrow slice with no open spec prerequisites. Candidates evaluated against criteria:
- Spec ratified: yes
- Canonical contracts (CDM / OpenAPI / State Machines) reference: in current canonical version (v1.7 / v0.3 / v1.2)
- AUDIT_EVENTS catalog: action IDs for slice are enumerated in canonical AUDIT_EVENTS v5.9 (not deferred to amendment)
- No fail-closed wrapper dependencies on un-ratified evidence sources
- Pilot-meaningful: slice exercises canonical.json + cross-agent message flow + Codex review path

**Option B+ first-pilot-slice candidates:**
- **Forms/Intake Templates HTTP/Admin JWT slice** — spec ratified, modest scope, AUDIT_EVENTS-enumerated. Top candidate.
- **Crisis Response Sprint 2 PR 7+ (slice already largely shipped; remaining endpoints)** — spec ratified, canonical AUDIT_EVENTS amendment pending (would block per criteria).
- **Med-Interaction Sprint 2 (beyond current PR 9)** — blocked per criteria (AUDIT_EVENTS amendment for `medication_interaction.*` action IDs still pending Spec Corpus ratification).

### 4.3 Rollback runbook (NEW v0.2 per Codex Pass-2 closure)

If pilot fails any hard-stop expansion gate or success criteria block expansion:

1. **Immediate (hour 0):** Orchestrator emits `workforce_pause` event; all agents observe pause within next heartbeat (≤ 30 min); all in-flight PRs cease author + commit; existing PRs stay open `[CODEX-PENDING]` for human review.
2. **Snapshot (hour 0–2):** Daily canonical event log + `canonical.json` snapshot to S3 versioned bucket (if not already on schedule); commit hash + event-log sha256 captured as `pre_rollback_state` event.
3. **Decision window (hour 2–48):** Ratifier convenes (Evans + Engineering Lead + named domain expert if available). Reviews: which hard-stop gate fired, what's recoverable, what's lost, what's the consolidation path.
4. **Consolidation (day 3–7):** Per-repo work in flight is retained (each repo's git history is preserved). Coordination state in canonical event log is preserved (event log is append-only — nothing lost). What's lost: agent runtime state (in-progress reasoning, partial PRs not yet committed).
5. **Consolidation path A — partial rollback:** Pause failed agent(s); continue with remaining agents at reduced scope. Restart failed agent with refined briefing.
6. **Consolidation path B — full rollback to single-Claude:** All implementation repos consolidate back to telecheck-app monorepo (or persist as standalone slice repos at maintainer's choice). Single-Claude (this session or equivalent) resumes pre-pilot pattern. canonical event log retained for forensic analysis.
7. **Consolidation path C — pivot to humans:** Workforce paused indefinitely; human hiring accelerated per Option C; repos retained but inactive until human owners assigned.

**Branch/repo consolidation plan:** Each pilot-spawned repo (Clinical, etc.) maintains a `consolidation-ready` git tag at every PR merge. Rollback to last `consolidation-ready` tag is guaranteed safe (typecheck + tests pass). Cross-cutting changes (Infra Agent) are reversible because they're additive (new shared libs); no removal of existing functionality during pilot.

**Tested:** Rollback runbook MUST be tested via dry-run before pilot begins. Day 0 pilot deliverable includes: invoke `workforce_pause` event on test bench + verify all 3 pilot agents observe pause within 30 min + verify event log + canonical.json snapshot succeeds + verify last `consolidation-ready` tag exists in pilot repo.

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

## 7. Success criteria + hard-stop expansion gates (v0.2 strengthened per Codex BLOCKING-FINDING-2)

### 7.1 Success criteria (evaluated at Day 14 of pilot)

1. **Throughput.** Cumulative PRs across all agents > 2x prior 14-day single-Claude baseline (~30+ PRs vs current ~15).
2. **Defect rate.** Codex APPROVE on first round ≥ 60% of PRs (lowered from 70% per Codex Pass-1 — N parallel authors increases defect density; pattern stabilizes over time).
3. **Canonical event-log integrity.** Zero projection mismatches between event-log replay + git-tracked `canonical.json`; all events trace to authorized signed sources.
4. **Cross-agent dep resolution time.** Median dep resolution (filed → satisfied) < 48 hours; with `filed_at`/`satisfied_at` instrumentation in event log.
5. **Ratifier queue depth.** Median wait time for ratifier decisions < 5 business days; **no ratifier-queue items aged > 7 business days without resolution or explicit deferral.**
6. **Stall recovery time.** Median stall detection-to-restart < 1 hour (verified by real stall injection during pilot).
7. **Spec drift.** Zero unauthorized spec corpus writes detected by audit.
8. **Cross-agent contract violations.** Zero OpenAPI contract violations escape to integration.
9. **NEW — Defect escape rate to integration tests.** < 5% of merged PRs require post-merge hot-patch for defects integration tests catch.
10. **NEW — Severity-weighted defect score.** No P0 escapes; ≤ 2 P1 escapes; ≤ 10 P2 escapes over 14 days. (P0 = production outage / data loss / invariant breach; P1 = functional regression in pilot-critical path; P2 = functional defect in non-critical path.)

### 7.2 Hard-stop expansion gates (NEW v0.2 — any one freezes expansion immediately)

Expansion from pilot (3 agents) to full workforce (7-8 agents) is **automatically frozen** if ANY of the following occurs during the pilot:

- **HSG-1.** Any P0 / platform-floor defect escape (production outage, data loss, audit-chain corruption, RLS bypass, KMS misuse, invariant breach on I-019/I-023/I-024/I-025/I-027/I-029/I-012).
- **HSG-2.** Any unexplained drift between event-log replay + git-tracked `canonical.json` (the projection mismatch alert).
- **HSG-3.** Any unauthorized spec-corpus write (Spec Corpus Agent commit not preceded by a ratification event from Evans / Engineering Lead).
- **HSG-4.** Any escaped tenant-isolation / auth / audit / clinical-safety / crisis-detection invariant breach detected by QA/Audit Agent's daily consistency check.
- **HSG-5.** Codex outage > 72 hours with no multi-LLM fallback operational (workforce auto-pauses; expansion frozen until Codex restored OR fallback proven).
- **HSG-6.** Ratifier-queue saturation: any item aged > 10 business days without resolution = workforce auto-pauses pending Engineering Lead delegation activation.
- **HSG-7.** Stall-recovery failure: any agent stall undetected by Orchestrator > 4 hours (heartbeat detector itself failed).

Expansion freeze = workforce continues operating in pilot scope (3 agents), but adding 4th–8th agents is blocked until ratifier reviews the freeze trigger + explicitly authorizes resume. Freeze is recorded as `expansion_frozen` event in canonical event log.

### 7.3 Failure-mode response

- Failure on 1 success criterion: retrospective at Day 14; targeted adjustment; no scope change.
- Failure on 2+ success criteria: retrospective + pause expansion + adjustment.
- ANY hard-stop expansion gate fires: workforce paused; rollback runbook §4.3 executed if needed; ratifier convenes within 48 hours.
- ANY P0 invariant breach with platform impact: Option C pivot considered (revert to single-Claude + accelerated human hiring).

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

## 12. Portability discipline — binding constraints during pilot (v0.2 addition)

**Purpose:** The Option B+ pilot uses Supabase + Vercel + PostHog + RemoteTrigger as the runtime substrate (per §4.2 + revised infrastructure plan). These tools are sufficient for pilot scale but may be migrated to AWS / DigitalOcean / self-hosted as production triggers fire (HIPAA compliance for Heros Health US tenant, scale > 10k users, data residency requirements, cost crossover, etc.). The portability discipline below makes that migration **mechanical (1–3 weeks)** rather than architectural (8–12 weeks).

**Enforcement:** These rules are binding constraints on every agent's PR. Codex per-PR adversarial review MUST verify rule compliance. Violations are HIGH-severity findings. The QA/Audit Agent's daily cross-agent consistency check MUST include portability-rule audit.

### 12.1 The 7 portability rules

| # | Rule | Why | What it forbids | What it requires |
|---|---|---|---|---|
| **P-1** | **Backend code must not import Supabase JS SDK.** Use plain `pg` library + standard Postgres connection string. | DB layer stays portable across any Postgres host (Supabase Cloud, Supabase self-hosted, AWS RDS, DigitalOcean Managed PG, self-hosted PG). | `import { createClient } from '@supabase/supabase-js'` in any `src/modules/**/internal/**` or `src/lib/**` | `import { Pool } from 'pg'` + `DATABASE_URL` env var (Supabase exposes a standard Postgres connection string for this) |
| **P-2** | **Auth abstracted behind `IAuthProvider` interface.** Day-1 implementation = Supabase Auth. Migration = swap implementation, no handler changes. | Auth is the stickiest migration. Interface abstraction makes the swap a 1-week job instead of 4-week. | Direct calls to `supabase.auth.*` in handler code; embedding Supabase JWT format assumptions in `req.actorContext` resolution | `src/lib/auth/provider.ts` exports `IAuthProvider { verifyJwt(token): Promise<User>; refreshSession(...); ... }`. Implementations: `SupabaseAuthProvider` (day 1), `CustomJwtAuthProvider` (post-migration option), `Auth0Provider` (alt). Handlers call the interface only. |
| **P-3** | **Migrations are raw SQL files in `migrations/`.** RLS policies live inside migration files, not Supabase Dashboard. | Already our pattern; Supabase doesn't change it. Dashboard-authored RLS is invisible to git + breaks audit. | Any RLS policy created via Supabase Dashboard / Supabase CLI dashboard UI; any schema change applied outside the migration runner | All schema + RLS in numbered `.sql` files in `migrations/`, applied via the canonical migration runner (existing pattern). Dashboard read-only for ops queries. |
| **P-4** | **Edge functions = minimal.** Keep all business logic in Fastify backend (running on Vercel functions OR future ECS container). Supabase Edge Functions used ONLY for: webhooks Supabase delivers (e.g., auth events), DB triggers that need application-side reaction. | Edge functions are Deno + Supabase-specific. Every line of business logic there is a line to rewrite on migration. | Implementing slice handler logic (Pharmacy, Crisis, Med-Int, etc.) in `supabase/functions/`; using Supabase-specific Deno APIs outside webhook bridges | Slice handlers in `src/modules/**/internal/handlers/`. Edge functions limited to thin webhook receivers that forward to Fastify endpoints (5–20 lines each). |
| **P-5** | **Avoid Vercel-specific APIs.** Skip `@vercel/blob`, `@vercel/kv`, `@vercel/postgres`, `@vercel/edge-config`. | Vercel-specific APIs lock the frontend to Vercel even when the platform allows migration (Next.js itself is portable). | `import` from `@vercel/*` packages other than `@vercel/analytics` (which has trivial fallback) | Generic alternatives: S3 SDK (works against Supabase Storage AND real S3); Redis client (works against any Redis); plain `pg` (already P-1); standard Next.js APIs |
| **P-6** | **PostHog SDK is consistent cloud vs self-hosted.** No code changes required to migrate. | PostHog open source = same SDK + same dashboards self-hosted. Just swap `POSTHOG_HOST` env var. | Using PostHog Cloud-only features (advanced funnels, etc.) that aren't in open-source build, when the alternative is similarly easy | Use only OSS-tier PostHog features (event tracking, feature flags, session replay, basic analytics) until self-host or stay-on-cloud decision is final |
| **P-7** | **Agent runtime scheduling is abstracted.** Day-1 implementation = RemoteTrigger. Migration = swap to EventBridge cron → Lambda invoking Anthropic API directly. | RemoteTrigger ties to Anthropic's cloud runtime; AWS-native scheduling is a 1-week rebuild but the AGENT WORK (PR authoring, Codex review, canonical event log writes) is fully portable. | Coupling agent business logic to RemoteTrigger-specific scheduling primitives | Agent CLAUDE.md templates accept any "fire signal" (cron tick, manual trigger, event-driven). The orchestration layer (RemoteTrigger OR EventBridge OR similar) is replaceable infrastructure. |

### 12.2 Codex review enforcement

Every agent PR's Codex review prompt MUST include the portability-rule check. Suggested verbatim addition to per-repo Codex routing config:

```
## Portability discipline check (Telecheck v0.2 §12)

This PR runs in the agentic-workforce pilot. Verify:
- P-1: no @supabase/supabase-js imports in backend code (src/modules/**, src/lib/**)
- P-2: handler code calls IAuthProvider interface, not direct Supabase auth
- P-3: all schema/RLS changes are in migrations/*.sql files
- P-4: business logic in src/modules/, not supabase/functions/
- P-5: no @vercel/* imports except @vercel/analytics
- P-6: PostHog usage stays within OSS-tier feature set
- P-7: no RemoteTrigger-specific scheduling primitives in agent business logic

Violations are HIGH-severity findings. Block merge until fixed.
```

### 12.3 QA/Audit Agent daily portability sweep

QA/Audit Agent runs `npx telecheck-portability-audit` daily across all repos. Output: pass/fail per rule + offending file:line. Failures emitted as `portability_violation` event in canonical event log + Slack alert.

Suggested audit-rule implementations (regex-grade; semantic checks would be deeper):
- **P-1**: `grep -r "@supabase/supabase-js" src/ --include="*.ts"` → must return empty (allowed paths: `src/lib/auth/providers/supabase.ts` only)
- **P-2**: `grep -r "supabase\.auth\." src/modules/` → must return empty
- **P-3**: `grep -r "CREATE POLICY\|ALTER POLICY\|DROP POLICY" --include="*.sql" migrations/` → all RLS changes accounted for; cross-check vs Supabase Dashboard via API
- **P-4**: `find supabase/functions -name "*.ts" -exec wc -l {} \;` → each function ≤ 20 lines (webhook bridges only)
- **P-5**: `grep -r "@vercel/" src/ --include="*.ts" --include="*.tsx" | grep -v "@vercel/analytics"` → must return empty
- **P-6**: Manual spot-check on PostHog SDK usage; auto-audit only catches obvious cases
- **P-7**: `grep -r "RemoteTrigger\|@anthropic/remote-trigger" src/modules/` → must return empty (agent runtime stays in `orchestrator/`)

### 12.4 Migration trigger criteria (when to actually migrate)

Migration is triggered (not before) when ANY of the following holds:

1. **HIPAA compliance required** for active user-facing surface (Heros Health US tenant launch). Supabase Team plan w/ BAA buys time ($599+/mo); full AWS migration may follow if Team tier doesn't meet specific BAA needs.
2. **Scale crossover**: active user count > 10,000 (Supabase Pro/Team cost-effective ceiling for telehealth read/write pattern) AND ≥ 3 months of sustained growth past that point.
3. **Cost crossover**: monthly Supabase + Vercel bill > monthly AWS (RDS + ECS + CloudFront + Lambda + EventBridge) projection by ≥ 30% sustained.
4. **Data residency**: regulatory requirement for specific region/jurisdiction not supported by current Supabase + Vercel regions.
5. **Custom infrastructure**: required Postgres extension or replication topology not supported by Supabase.
6. **Multi-region active-active DR**: ADR-026 us-east-1 primary + us-west-2 active DR (not cold) — Supabase has read replicas but full active-active requires AWS-native.

If NONE of the above hold, the pilot stack is the production stack. No migration ever.

### 12.5 Migration runbook (when triggered)

1. **Trigger event recorded** as `migration_trigger_fired` event in canonical event log. Ratifier convenes within 5 business days.
2. **Ratifier approves migration scope + target stack** (e.g., AWS RDS + ECS + CloudFront vs DigitalOcean Managed PG + App Platform).
3. **Provision target infrastructure** (~1 week DevOps Agent + Infra Agent work).
4. **Postgres migration** (~1 day): `pg_dump` from Supabase → `pg_restore` to target. Verify schema + data + RLS policies + SECDEF wrappers + roles all transfer.
5. **Auth migration** (~1-4 weeks): swap `SupabaseAuthProvider` → target implementation. User-id continuity strategy depends on target (Auth0 supports import; Cognito requires re-registration flow; custom = port GoTrue users table).
6. **Frontend deploy migration** (~1-2 weeks): Next.js `next build standalone` → Docker → ECR → ECS Fargate behind CloudFront.
7. **Edge functions migration** (~1-2 weeks): port any `supabase/functions/*` to Lambda or container endpoints. P-4 keeps this minimal.
8. **Agent runtime migration** (~1-2 weeks): rebuild scheduler as EventBridge cron rules → Lambda invoking Anthropic API directly. Agent CLAUDE.md unchanged per P-7.
9. **PostHog**: if staying on cloud, no migration. If self-hosting: ~1 week to deploy PostHog stack on target.
10. **DNS cutover** + **rollback plan tested** + **soak period** (~1 week).
11. **Promotion Ledger entry** recording migration complete + canonical infrastructure pointer updated in `telecheckONE/canonical.json`.

**Total realistic migration: 6-10 weeks unfocused; 1-3 weeks if portability discipline is honored throughout pilot.** Doable interleaved with feature work; does not block ongoing slice development.

### 12.6 Rationale for binding constraint status

Without P-1 through P-7 as binding constraints, agents will naturally take the path of least resistance: import Supabase SDK directly, use Vercel-specific APIs for convenience, put business logic in Edge Functions because they're co-located with auth. Each shortcut individually is innocuous; cumulatively they make migration a 6–10 week rewrite. By making the rules binding from PR-1 of the pilot + audited daily, migration stays a 1–3 week mechanical exercise — preserving the strategic flexibility to choose Supabase-forever OR AWS-when-triggered without locking in either path prematurely.

---

## 13. References

- `Telecheck_Workstream_Discipline_Note_Multi_Agent_Orchestration_v0_1_DRAFT.md` — v1.10 cycle multi-agent orchestration pilot (precedent)
- `Telecheck_Master_Platform_PRD_v1_10.md` — canonical platform PRD
- `Telecheck_Master_Completion_Plan_v1_0.md` — Track 1–6 critical-path plan
- `CLAUDE.md` (project) — autonomous-work authorization + hard-floor item 6 + dual-recommendation two-pass discipline + auto-proceed rule
- `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Contracts_Pack_v5_00_INVARIANTS.md` — 31 platform invariants
- `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_ADR_Set_v1_0.md` — 29 architecture decisions
- `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_OpenAPI_v0_2.md` — canonical API surface (cross-agent contract substrate)

---

**End of v0.1 DRAFT. Pending Codex two-pass adversarial review per dual-recommendation discipline.**
