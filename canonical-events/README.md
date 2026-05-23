# `canonical-events/` — Append-Only Event Log

**Status:** Bootstrap (post-P-043 ratification 2026-05-23)
**Authority:** Telecheck Agentic Workforce Architecture v0.2 §3 (append-only event log + materialized current-state projection)
**Owner:** Orchestrator Agent + Spec Corpus Agent + per-repo PR-merge hooks + Ratifier (Evans / Engineering Lead) — authorized sources only

## Purpose

The canonical event log is the **single source of truth** for the Telecheck agentic workforce. Every state change — agent heartbeats, PR merges, Codex round completions, ratification decisions, dependency filings, message routings, incident declarations, workforce pauses — is recorded as an append-only event in this directory.

`canonical.json` (project root) is the **materialized current-state projection** over this event log, rebuilt by the Projection Service (`orchestrator/projection-service.mjs`, lands separately) on every new event commit. The two artifacts together replace the v0.1 design's multi-writer JSON model (which Codex Pass-1 flagged as BLOCKING-FINDING-1).

## File layout

```
canonical-events/
├── README.md                    ← this file
├── _schemas/                    ← JSON Schema per event type (signed + typed events)
│   ├── agent_heartbeat.schema.json
│   ├── pr_opened.schema.json
│   ├── pr_merged.schema.json
│   ├── codex_round_completed.schema.json
│   ├── ratification_decision.schema.json
│   ├── dep_filed.schema.json
│   ├── dep_satisfied.schema.json
│   ├── cr_filed.schema.json
│   ├── canonical_version_bumped.schema.json
│   ├── incident_declared.schema.json
│   ├── workforce_pause_invoked.schema.json
│   ├── expansion_frozen.schema.json
│   ├── conflict_resolved.schema.json
│   ├── portability_violation.schema.json
│   └── human_orchestrator_dialogue.schema.json
├── authorized/                  ← signed-commit authorized-author allowlist
│   └── sources.json             ← rotated only by Ratifier-signed events
└── <ISO-8601>__<source>__<event-id>.json   ← one event per file, append-only
```

Example event filename: `2026-05-23T18-15-23Z__orchestrator__01HXP7MN3K4D5Q.json`

## Event file format

Every event file is JSON conforming to its event-type schema in `_schemas/`. Required base fields (all events):

```json
{
  "schema_version": "v1",
  "event_id": "ULID (26 chars, sortable)",
  "event_type": "agent_heartbeat | pr_opened | pr_merged | ...",
  "source": "orchestrator | spec_corpus | <repo>-pr-merge-hook | ratifier",
  "wall_clock_ts": "2026-05-23T18:15:23.421Z",
  "client_idempotency_key": "uuid-or-stable-hash (Projection Service deduplicates on this)",
  "project_id": "telecheck",
  "payload": {
    "...": "event-type-specific fields per schema"
  }
}
```

## Concurrency model

Append-only event log eliminates concurrent-write conflict (each event is a new file at a unique path; git's append-only commit semantics naturally serialize). The Projection Service reduces in **commit-order** (`git log`-derived); ties broken by event-source priority: **Ratifier > Spec Corpus > Orchestrator > PR-merge-hook**. Conflicts (e.g., two agents claim same dep at same instant) emit a `conflict_resolved` event for audit.

## Idempotency

Every event carries `client_idempotency_key`. Projection Service deduplicates on key + event_type. Retries (network failures, hook re-fires) are safe.

## Forgery prevention

Every event commit must be **signed** (GPG signature attests author identity). CI gate at `.github/workflows/canonical-events-verify.yml` (lands separately) rejects:
- Unsigned commits touching `canonical-events/`
- Events from non-authorized authors (allowlist in `authorized/sources.json`)
- Events failing JSON Schema validation against `_schemas/<event-type>.schema.json`
- Events with duplicate `event_id` (must be unique across log)

`authorized/sources.json` is itself rotated **only** by Ratifier-signed events (`source: "ratifier"` with `event_type: "authorized_sources_rotated"`). Self-bootstrap rotation requires Evans's signed commit.

## Failed-hook recovery

Per-repo PR-merge hooks have at-least-once delivery semantics with exponential backoff up to 24h. After 24h without successful delivery, Orchestrator's stale-source detector emits a `source_offline` event + alerts ratifier via Slack. Recovery: missing events can be back-filled manually (signed by Engineering Lead or Ratifier) and Projection Service replays.

## Replay + integrity verification

```bash
# Rebuild canonical.json from the event log (deterministic)
npx telecheck-orchestrator replay-events --from <ts> --to <ts>

# Verify git-tracked canonical.json matches event-log replay (CI runs hourly)
npx telecheck-orchestrator verify-projection
```

Mismatch between replay + git-tracked `canonical.json` = **highest-severity alert** (HSG-2 hard-stop expansion gate per design v0.2 §7.2) + auto-pause workforce + ratifier convene within 48h.

## References

- Design doc: `Telecheck_v1_10_PRD_Update/Telecheck_Agentic_Workforce_Architecture_v0_1_DRAFT.md` v0.2 §3 (canonical event log architecture)
- Ratification: `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Promotion_Ledger.md` Entry P-043 (2026-05-23)
- Operator cockpit (consumer of this log): `arthurmenson/telecheck-cockpit` (separate repo)
- Codex Pass-1 BLOCKING-FINDING-1 closure (the architectural rationale for this directory existing): captured in design doc v0.2 §3.1 + changelog
