# F-4 Production Deploy Runbook

**Version:** 0.1 DRAFT
**Status:** Pre-Codex-pre-ratification; Track 5 Infra/Ops deliverable per Master Completion Plan v1.0 §"Track 5 (operates AHEAD of code)"
**Authoring location:** `Telecheck_v1_10_PRD_Update/` (workstream folder; spec-corpus operations deliverable)
**Owner:** Operations Lead + SRE on-call rotation (named accountable engineers per deploy event)
**Companion documents:** Ghana Launch Playbook v1.2, Operational Readiness Tracker v1.5, GOVERNANCE_CONTROLS Contracts Pack v5.2, ADR-026 (US Region Migration Cycle / single-region+cold-DR architecture)
**Authority:** This runbook is the canonical production deploy procedure for the Telecheck multi-tenant platform. Any deploy that deviates from this runbook requires named approver sign-off + a follow-up retrospective.

---

## 1. Purpose + audience

This runbook is the **single-source-of-truth** for executing a production deploy of the Telecheck platform from staging to production. It is used by:
- The named deploy operator (one engineer per deploy event; not the author of the code being deployed)
- The named deploy approver (different engineer; must be different from operator per I-015 dual-control discipline)
- The on-call SRE rotation (passive observation + escalation contact)
- The post-deploy verification reviewer (operator role, post-deploy)

The runbook is **adversarial-reviewed** before every production deploy per Master Completion Plan §"Acceleration tactics" — Codex review on the runbook itself catches "what happens if step 3 fails" gaps before they hit production.

**Scope:** application code rollout, database migrations, infrastructure changes that affect tenant data, KMS key rotations, RBAC updates, feature-flag rollouts that change canary surface.

**Out of scope:** dev/staging deploys (separate informal procedure), CI/CD pipeline maintenance (separate runbook), incident response (separate runbook).

---

## 2. Pre-deploy prerequisites (HARD GATES; all MUST pass before deploy proceeds)

### 2.1 Code-side prerequisites

- **CI green on the deploy commit.** The full CI matrix passes on the exact commit being deployed; no `[skip-ci]` overrides; no manually-merged PRs without CI.
- **Codex pre-deploy review on the deploy diff.** Run Codex against the deploy diff (`main` → `<deploy_commit>`); verdict MUST be APPROVE or only non-blocking nits. Architectural-judgment findings BLOCK deploy.
- **Migration safety review.** For any deploy including database migrations: explicit migration-safety review verifying (a) no DROP / no destructive ALTER without dual-control approval; (b) backward-compatible schema changes (additive only, except via approved zero-downtime patterns); (c) data-migration scripts idempotent + safely re-runnable; (d) rollback path defined per migration.
- **Feature-flag inventory.** Document every flag being flipped this deploy; include flag name + canary cohort + rollback flip.

### 2.2 Operations-side prerequisites

- **Deploy operator + approver named.** Two different humans, both on the deploy-authorized roster per RBAC; operator's GitHub handle + approver's GitHub handle recorded in the deploy ticket.
- **Maintenance window posted.** If applicable per the change's blast radius; per Ghana Launch Playbook v1.2 + Operational Readiness v1.5 guidance.
- **On-call SRE acknowledged.** On-call engineer pinged + acknowledged via Slack/PagerDuty before deploy start.
- **Tenant impact estimate.** For any deploy affecting tenant data: estimate which tenants are impacted + percentage of tenant population.
- **Rollback rehearsed in staging.** The rollback procedure for this specific deploy was executed in staging within the last 7 days; rollback time measured + recorded.

### 2.3 Infrastructure-side prerequisites

- **us-east-1 primary healthy.** All EKS nodes ready; RDS Postgres readreplica lag < 60s; KMS healthy; LiveKit healthy; SIEM (CloudWatch + Datadog) green.
- **us-west-2 cold DR snapshot current.** Most recent RDS snapshot ≤ 24h old per ADR-026; cold-DR runbook confirmed accessible.
- **Backup confirmed.** Database backup taken within 4h of deploy start; backup verified restorable in a sandbox environment (the verification can be batched daily; ≤ 24h staleness acceptable).
- **No active incidents.** No P0/P1 open incidents in the deploy window per the incident tracker. P2/P3 incidents acceptable but flagged.

---

## 3. Deploy sequence

### 3.1 T-0: Deploy initiation

Operator opens the deploy ticket; approver reviews + approves in the ticket; on-call SRE is paged-acknowledged.

```bash
# Operator runs from deploy host (not local dev machine):
$ deploy-tool init --commit <sha> --operator <github-handle> --approver <github-handle> --ticket <jira-id>
# Outputs: deploy_session_id + initiation timestamp + pre-deploy state hash
```

### 3.2 T+0: Migration apply (if applicable)

For deploys including DB migrations:

```bash
$ deploy-tool migrate-apply --session <id> --migration-set <list>
# Applies migrations in order with per-migration transaction; logs each migration's apply duration + row counts; halts on first failure
```

**Migration apply rules:**
- Each migration runs in its own transaction (no batch-transactions across migrations).
- Migration apply emits a Cat B audit event per migration: `deploy.migration_applied`.
- On migration failure: HALT deploy; do not roll forward to app deploy; do not auto-rollback the partial migration set (rollback requires named approver decision + executed via §5 rollback procedure).
- Migration apply duration logged; deploys exceeding 60-second migration time on a single migration require approver re-confirmation before proceeding.

### 3.3 T+M (post-migration): App rollout via canary

Canary rollout strategy: 5% → 25% → 50% → 100% over 4 stages. Each stage has a soak period + auto-rollback trigger.

```bash
$ deploy-tool app-rollout --session <id> --stage canary-5pct --commit <sha>
# Rolls out new app version to 5% of traffic; emits deploy.canary_stage_started Cat B audit
```

**Per-stage soak gates (MUST pass at every stage; R1 HIGH-2 closure makes invariant probes mandatory at EVERY stage, not stage-conditional):**

| Stage | Traffic % | Min soak | Error-rate gate | Latency gate (p99) |
|---|---|---|---|---|
| canary-5pct | 5% | 10 min | < 0.5% | < 1.5× baseline |
| canary-25pct | 25% | 10 min | < 0.3% | < 1.3× baseline |
| canary-50pct | 50% | 15 min | < 0.2% | < 1.2× baseline |
| full | 100% | 30 min | < 0.1% | < 1.1× baseline |

**Mandatory continuous invariant probes (run at EVERY stage; R1 HIGH-2 closure):**

The following probes run continuously during every canary stage (not stage-conditional). Missing telemetry on any probe at any stage = gate failure (treat absence of signal as failed probe, not as silent success).

**I-019 crisis-detection-always-on probe (runs every 60s; sample size 100% of crisis-detection-eligible requests):**
- Definition: every request that traverses a crisis-detection path emits a `crisis_detection_evaluated` event regardless of whether a crisis signal fired. Missing events = probe fail.
- Coverage: 100% of crisis-eligible request paths (Mode 1 conversational + intake-flow + clinical messaging surfaces).
- Freshness window: events must reach SIEM within 30 seconds of request completion.
- Gate failure: zero `crisis_detection_evaluated` events for 2 consecutive 60s windows across the canary cohort.

**I-023 cross-tenant isolation probe (runs every 60s; sample size 200 synthetic requests per minute):**
- Definition: a synthetic-request set issues 200 requests/min across tenant boundaries (e.g., tenant_A-authenticated session attempts to read tenant_B resources) using the canonical break-glass-required surfaces. All 200 MUST receive tenant-blind 404 per I-025; zero responses may leak the existence or shape of cross-tenant data.
- Coverage: includes all 5 pilot-required slices' canonical authenticated endpoints.
- Freshness window: probe results aggregated within 30s.
- Gate failure: any cross-tenant leak signal in any 60s window.

**I-027 audit-chain integrity probe (runs every 5 min; full-chain verification on the canary tenant cohort):**
- Definition: for every active P1 (patient-bound) chain in the canary tenant cohort + every active P2 (tenant-governance) chain, traverse the chain from genesis to current head; verify hash continuity per I-003.
- Coverage: 100% of active partitions in the canary tenant cohort (not sampled).
- Freshness window: completion within 5 min.
- Gate failure: any broken hash chain (gap, mismatch, missing previous_hash linkage).

**Cross-tenant cache/state-leakage probe (runs every 60s):**
- Definition: synthetic session-switch tests verify that per-request `SET LOCAL app.tenant_id` correctly isolates connection state per I-032 + System Architecture §5.
- Coverage: 50 connection-pool-reuse pattern requests/min across all canary tenants.
- Gate failure: any persistent-state-leak signal (e.g., a query returns rows from the previously-bound tenant).

**Service-health probe baseline (P0-alert source):**
- Datadog + CloudWatch monitor: all canary-cohort services emit health-check responses every 30s; missing 2 consecutive = P0 alert (which triggers auto-rollback per §3.3).

**Stage-promotion criterion (extended):** all 1-min-window error/latency gates pass AND all continuous invariant probes have green at every observed window during the soak period.

**Stage-demotion criterion (extended):** ≥2 consecutive 1-min windows with ANY gate or probe failure.

**Per-probe freshness semantics (closes Codex R2 HIGH-1 — probes have different SLAs; the global "60s = failure" rule is replaced by per-probe SLA windows):**

| Probe | Result-freshness SLA | Gate-check cadence | "Missing telemetry" definition |
|---|---|---|---|
| I-019 crisis-detection | 30s freshness window | Every 60s | No event in 2 consecutive 60s windows for the canary cohort |
| I-023 cross-tenant isolation | 30s freshness window | Every 60s | No synthetic-probe result in 2 consecutive 60s windows |
| Cross-tenant cache/state-leakage | 30s freshness window | Every 60s | No probe result in 2 consecutive 60s windows |
| Service-health (Datadog/CloudWatch) | 30s freshness window | Every 30s | 2 consecutive missing health-check responses |
| **I-027 audit-chain integrity** | **5-min SLA** (chain-traversal completion within 5 min) | **At every stage-promotion checkpoint** + every 5-min interval during soak | **Most-recent successful result is older than 10 min (i.e., 2× SLA) at any check, OR most-recent result reports a chain failure** |

The I-027 probe's longer cadence reflects the cost of full-chain traversal across active partitions; per-stage-promotion-checkpoint enforcement ensures every promotion has a fresh successful result within the SLA window. Continuous 1-min canary windows DO NOT require a fresh I-027 result every 60s — only the per-stage-promotion checkpoints do.

**Stage-promotion criterion (refined per R2 HIGH-1):** all 1-min-window error/latency/short-SLA-probe gates pass during the soak period AND a successful I-027 audit-chain result is observed within 10 min of the promotion attempt AND no probe reports an explicit failure.

**Stage-demotion criterion (refined per R2 HIGH-1):** ≥2 consecutive 1-min windows with ANY short-SLA gate or probe failure, OR an explicit I-027 chain-failure report (not staleness alone within the 10-min window).

**Missing-telemetry rule (refined per R2 HIGH-1):** for short-SLA probes (I-019, I-023, cache/state, service-health), 2 consecutive 60s windows without a probe result = failed probe. For the I-027 probe, staleness beyond 10 min (2× SLA) = failed probe. The telemetry pipeline's health is part of the canary gate, but each probe has its own SLA window — not all probes share a 60s definition.

**Auto-rollback triggers (any one fires → automatic rollback per §5):**

- Error rate exceeds the stage's gate for 2 consecutive 1-minute windows.
- p99 latency exceeds the stage's gate for 2 consecutive 1-minute windows.
- Any I-019 crisis-detection signal is dropped (zero-tolerance per I-019 + crisis-detection-always-on platform floor).
- Any audit-chain integrity check failure (broken hash chain per I-003 + I-027).
- Any cross-tenant data-leak signal (per I-023 + I-025 information-leak prevention).
- P0 ops alert raised by any service in the canary window.

### 3.4 T+(M+app): Post-deploy verification

After full rollout:

```bash
$ deploy-tool post-deploy-verify --session <id>
# Runs the post-deploy verification suite:
#  - Audit-chain integrity check (full P1 + P2 chain verification on a sampled tenant set)
#  - Cross-tenant isolation regression test set (read attempts across tenant boundaries with the canonical break-glass auth model)
#  - Smoke tests on the 5 pilot-required slices (Med-Interaction, Async-Consult, AI Service Mode 1, Crisis Response, Admin Backend)
#  - SIEM aggregation: confirm Datadog/CloudWatch ingestion is current
#  - Feature-flag state: confirm all flipped flags are at their target state
```

Verification suite MUST pass before the deploy is marked CANONICAL. Failed verification triggers rollback (§5) unless the approver explicitly accepts the partial state (RARE; requires retrospective).

---

## 4. Canary gates (deep-dive on §3.3; closes Codex R3 HIGH-1 by aligning with §3.3 per-probe SLA semantics)

**Section 3.3's per-probe SLA table is the BINDING source of canary-gate semantics.** This §4 deep-dive describes the algorithmic mechanics that implement those semantics; any apparent conflict is resolved by §3.3's table.

**Short-SLA probe gate (checked every 1-minute window during the stage's soak period):**

```
short_sla_gate_pass(window) = (
  error_rate_1min < stage.error_rate_threshold
  AND latency_p99_1min < stage.latency_p99_threshold * baseline.latency_p99
  AND no_i019_signals_dropped_in_last_60s
  AND no_cross_tenant_isolation_probe_failures_in_last_60s
  AND no_cross_tenant_cache_state_leakage_in_last_60s
  AND service_health_check_responses_received_in_last_30s
  AND no_p0_alerts
)
```

Note: `audit_chain_hash_check_passed` is NOT in the short-SLA gate. I-027 audit-chain integrity is a separate longer-cadence probe (see I-027 promotion-checkpoint gate below).

**I-027 audit-chain integrity probe (separate 5-min cadence; checked at every stage-promotion checkpoint + every 5 min during soak):**

```
i027_gate_pass(checkpoint_time) = (
  most_recent_audit_chain_verification_result IS NOT NULL
  AND most_recent_audit_chain_verification_result.completed_at >= checkpoint_time - 10 minutes  -- 2x SLA staleness limit
  AND most_recent_audit_chain_verification_result.outcome == 'pass'
)
```

I-027 staleness alone within the 10-min window does NOT trigger demotion; only an explicit `outcome == 'fail'` (broken chain detected) does.

**Stage-promotion criterion (refined per R3 HIGH-1):**
- ALL 1-min windows in the soak period: `short_sla_gate_pass(window) = true`
- AND at the promotion-checkpoint moment: `i027_gate_pass(promotion_time) = true`
- AND no probe missing-telemetry per the per-probe SLA table in §3.3

**Stage-demotion criterion (auto-rollback; refined per R3 HIGH-1):**
- ≥2 consecutive 1-min windows where `short_sla_gate_pass = false` (short-SLA probe failures), **OR**
- Any explicit I-027 chain-failure report (`outcome == 'fail'`) at any cadence point (NOT staleness alone within the 10-min window — staleness blocks promotion but doesn't auto-rollback)

**Stage stretch criterion (refined):** soak period extended +5 min if any short-SLA 1-min window fails but the next succeeds (transient blip tolerance). Does NOT apply to I-027 chain-failure reports (those are immediate auto-rollback).

**Stage abort criterion:** approver manually decides to abort the stage (e.g., a non-quantitative signal — a Slack escalation from a clinician noticing an issue).

**§3.3 vs §4 reconciliation rule:** §3.3's per-probe SLA table is canonical. §4's pseudocode is the algorithmic representation. If a future amendment introduces inconsistency, §3.3 binds.

---

## 5. Rollback procedure

### 5.1 Rollback decision matrix

| Trigger | Action | Approver required |
|---|---|---|
| Auto-rollback (canary gate fail) | App rollback to prior commit; migrations remain applied (forward-compatible by design) | No (automatic; logged) |
| Operator manually triggers rollback during canary | App rollback to prior commit | Yes (approver consent in ticket) |
| Operator triggers rollback after full deploy + verification failure | App rollback to prior commit + migration rollback if applicable | Yes (named approver) |
| P0 incident raised post-deploy | App rollback IMMEDIATELY; migration rollback per incident type | On-call SRE can authorize during active P0 |
| **Migration-apply failure mid-set (pre-app-rollout; R1 HIGH-1 closure)** | **§5.1.MIG explicit branch below** | **See §5.1.MIG** |

### 5.1.MIG — Migration-apply failure recovery branch (closes Codex R1 HIGH-1)

When `deploy-tool migrate-apply` halts mid-set, the partially-applied schema MAY differ from both the pre-deploy and the post-deploy expected states. The operator faces a 4-option decision tree:

**Step 1 — Validate the partial-set state:**

```bash
$ deploy-tool migration-partial-validate --session <id>
# Reports: applied_migrations[], failed_migration_id, schema_drift_summary,
# pre_deploy_schema_compatible (does the prior app version work against the
# partial schema?), post_deploy_schema_compatible (does the new app version
# work?)
```

**Step 2 — Apply the decision matrix per validation result:**

| Validation result | Canonical action | Authorization required |
|---|---|---|
| `pre_deploy_schema_compatible = true` AND `failed_migration_id` retry-eligible (transient error: connection drop, lock timeout, etc.) | Retry the failed migration ONCE; if it succeeds, continue migration-apply forward | Operator alone (one retry permitted) |
| `pre_deploy_schema_compatible = true` AND failed migration NOT retry-eligible (semantic error: constraint violation, data conflict) | HALT deploy; partial-set REMAINS applied; open incident; resume on next deploy after failed migration is fixed | Operator alone; incident filed |
| `pre_deploy_schema_compatible = false` AND `post_deploy_schema_compatible = false` (production stuck in undefined schema state) | EMERGENCY revert applied migrations via `down.sql` to restore pre-deploy state | **DUAL-CONTROL: Operator + Approver + CTO sign-off + incident filed with P0 severity** |
| `pre_deploy_schema_compatible = false` AND `post_deploy_schema_compatible = true` (the prior app can't read the new schema; the new app can) | FORCE-FORWARD: complete migration apply + proceed with app rollout (the prior-app rollback is no longer viable; the deploy MUST proceed forward) | Operator + Approver sign-off + incident filed |
| Any data-loss possibility detected in `schema_drift_summary` (e.g., DROP COLUMN already applied, partial table truncation) | EMERGENCY restore from backup per §5.3.MIG snapshot procedure | **DUAL-CONTROL: Operator + Approver + CTO + Compliance Officer (if PHI-bearing) + incident filed with P0 severity** |

**Step 3 — Authorization gates per §5.3 dual-control discipline.** No migration revert proceeds without:
- Exact list of migration IDs to revert
- Data-loss impact assessment (what rows / columns / constraints lost)
- Backup/snapshot reference (which RDS snapshot ID will be used for verification or restore)
- Restore plan (how the operator verifies the restore succeeded)
- Explicit prohibition on revert when data restoration is not proven (a destructive revert without a verified restore plan is REJECTED at this checkpoint)
- Per Master Completion Plan Track 6 ratifier-quorum analog: the approver MUST be a different human from the operator + (for PHI-bearing migrations) the Compliance Officer must additionally sign off per I-015 dual-control extended

**Step 4 — Emit audit + incident.** Every migration-failure recovery action emits:
- Cat B `deploy.migration_recovery_initiated` audit event with the decision-matrix outcome
- Cat B `deploy.migration_recovery_completed` audit event on completion
- Incident ticket linked to the deploy session
- Slack `#deploys` + `#incidents` channel notification

### 5.2 App rollback

```bash
$ deploy-tool app-rollback --session <id> --target-commit <prior-deploy-sha>
# Rolls back app to prior commit; traffic ramps from current % → 0 → prior commit at 100% over 2 minutes
# Emits deploy.rollback_started + deploy.rollback_completed Cat B audit events
```

App rollback target time: **< 5 minutes from rollback initiation to 100% prior commit traffic**.

### 5.3 Migration rollback

For deploys that included migrations: migrations are designed to be forward-compatible (additive); rollback strategy is **DO NOT REVERT migrations by default** — instead, the app rollback runs against the new schema (the new schema's additive changes are transparent to the prior app version).

**Migration revert is permitted only when ALL of the following are true:**
- The migration is provably destructive or schema-incompatible (e.g., introduced a NOT NULL column with no default that the prior app version writes NULLs to; OR added a CHECK constraint that rejects rows the prior app version inserts)
- AND the prior app version cannot run against the new schema (verified by `deploy-tool schema-compatibility-check --version <prior>`)
- AND the dual-control authorization checklist in §5.3.AUTH below is fully completed

### §5.3.AUTH — Migration revert hard authorization checklist (R1 MED-1 closure)

EVERY migration revert (destructive OR non-destructive) MUST complete this checklist BEFORE `down.sql` execution. Skipping any item REJECTS the revert.

| Item | Requirement | Verification command / artifact |
|---|---|---|
| **1. Operator identity** | Named operator with deploy-authorized RBAC | `deploy-tool whoami --session <id>` returns operator GitHub handle from §3.1 init |
| **2. Approver identity** | Named approver, DIFFERENT human from operator, with deploy-authorized RBAC | Approver explicitly types `APPROVE <session_id>` in the deploy ticket; tool verifies role + human-distinctness from operator |
| **3. CTO sign-off (destructive revert only)** | For any revert that loses data or schema state irrecoverably from the post-deploy state alone | CTO explicitly types `CTO-APPROVE <session_id>` in the deploy ticket |
| **4. Compliance Officer sign-off (PHI-bearing revert only)** | For reverts touching any table flagged PHI in the canonical PHI inventory (per Master PRD §6 + CDM v1.X PHI tagging) | Compliance Officer explicitly types `COMPLIANCE-APPROVE <session_id>` |
| **5. Exact migration ID list** | Comma-separated list of migration IDs to revert (in reverse-apply order) | Recorded in deploy ticket; matches `deploy-tool migration-partial-validate` output |
| **6. Data-loss impact assessment** | Written assessment: which rows/columns/constraints are lost; which tenants impacted; estimated row count loss | 1-paragraph minimum; attached to deploy ticket as `impact_assessment.md` |
| **7. Backup/snapshot reference** | RDS snapshot ID that captures the pre-deploy state | `aws rds describe-db-snapshots ...` output attached; snapshot age MUST be ≤ 4h |
| **8. Restore plan** | Step-by-step restore procedure if revert fails | `restore_plan.md` attached; MUST include the verification step that confirms restore succeeded |
| **9. Restore-verified flag** | Pre-revert dry-run: execute `down.sql` against a sandbox restored from the backup snapshot; verify schema matches expected pre-deploy state | `deploy-tool dry-run-revert --session <id> --sandbox-restore-from <snapshot>` returns success |

**Hard prohibition (R1 MED-1 closure):** any migration revert WITHOUT a verified restore plan (item 9 NOT completed) is **REJECTED at the canonical authorization gate**. The operator cannot bypass this — the tool enforces it.

**Revert execution (only after §5.3.AUTH complete):**
- Execute the migration-rollback script (each migration ships with a `down.sql` reverse migration)
- Verify the reverted schema is consistent (`deploy-tool schema-validate`)
- Run app rollback per §5.2 to align app + schema versions
- Emit Cat B audit events: `deploy.migration_reverted` per migration + `deploy.migration_revert_completed` overall + `deploy.migration_revert_audit_checklist_completed` with the §5.3.AUTH checklist hash for audit reproducibility

**Default reminder:** app rolls back; migrations stay applied. The new schema's additive design is the safety mechanism. §5.3.AUTH applies only to the exceptional cases.

### 5.4 Post-rollback verification

After rollback:

```bash
$ deploy-tool post-rollback-verify --session <id>
# Runs:
#  - Same post-deploy-verify suite from §3.4
#  - Additional check: tenant-data-integrity comparison against pre-deploy snapshot
#  - Audit chain integrity confirmed continuous through the deploy + rollback window
```

If post-rollback verification fails → escalate to incident-response runbook + page CTO.

---

## 6. Communication + audit

### 6.1 Deploy events as audit records

Every deploy emits Cat B audit events at SI-018 P2 partition (tenant-governance; keyed on `'platform'` tenant for platform-wide deploys per the AUDIT_EVENTS §Hash chain §Partitioning canonical rule):

- `deploy.initiated`
- `deploy.migration_applied` (per migration)
- `deploy.canary_stage_started` (per stage)
- `deploy.canary_stage_promoted` / `deploy.canary_stage_demoted`
- `deploy.fully_deployed`
- `deploy.rollback_started` / `deploy.rollback_completed`
- `deploy.post_deploy_verification_passed` / `deploy.post_deploy_verification_failed`

### 6.2 Slack + ticket comms

- Pre-deploy: `#deploys` Slack channel ping with operator + approver + commit SHA + scheduled time + tenants impacted estimate
- During deploy: every stage transition pinged
- Post-deploy: deploy result (success / rolled back / partial) pinged + ticket updated + retrospective scheduled if rollback occurred

### 6.3 Retrospective triggers

A post-deploy retrospective is mandatory when:
- Rollback occurred
- Any canary gate stretched > 2× its base soak time
- Post-deploy verification flagged issues but operator/approver elected to accept partial state
- Any deploy duration exceeds 2× the baseline for that deploy class

Retrospective output: blameless writeup + action items + runbook amendments if applicable.

---

## 7. Open questions for ratifier review

1. **OQ1 — Deploy frequency policy.** Recommendation: weekly cadence at launch with on-demand exceptions for safety-critical fixes; multi-deploy-per-day allowed only with operator + approver consent. Should this be canonical or operator-discretion?
2. **OQ2 — Migration revert authorization (RESOLVED via §5.3.AUTH R1 closure; closes Codex R2 MED-1):** the prior OQ2 framing asked "should this require additional sign-off?" §5.3.AUTH now codifies the canonical binding rule: destructive reverts require CTO sign-off; PHI-bearing reverts require Compliance Officer sign-off; operator+approver alone is INSUFFICIENT for those cases. This OQ is RESOLVED; future ratifier review may revisit the matrix but the current rule is binding.
3. **OQ3 — Cross-region failover (us-east-1 → us-west-2 cold-DR) in this runbook?** Recommendation: separate runbook (cold-DR runbook); this runbook is for primary-region deploys only.
4. **OQ4 — Codex pre-ratification target for the runbook itself.** Recommendation: 2 rounds + 1 verification = 3 total. Runbook is operations spec; less architectural-risk than SIs.
5. **OQ5 — Adversarial-review-the-runbook-itself cadence.** Recommendation: per-deploy (cheap; Codex runs in ~1 min). Master Completion Plan §"Acceleration tactics" explicitly calls this out.

---

## 8. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; awaiting Codex R1.

---

## 9. Sequence for ratification + first use

1. Codex pre-ratification cycle on this runbook (target 2-3 rounds; operations spec; lower architectural risk than SIs).
2. Operations Lead reviews + signs off.
3. Adversarial review on the runbook itself before first production use.
4. First staging deploy executes the runbook (rehearsal).
5. First production deploy executes the runbook with full audit trail.
6. Post-first-production-deploy retrospective amends the runbook with field-tested lessons.

---

— Claude (Opus 4.7, 1M context), F-4 Deploy Runbook v0.1 DRAFT authored 2026-05-19 under "continue for 24 hrs" autonomous-work authorization. Sprint 5 of the 24h-loop work plan. Track 5 Infra/Ops spec-corpus deliverable per Master Completion Plan §"Track 5 (operates AHEAD of code)".
