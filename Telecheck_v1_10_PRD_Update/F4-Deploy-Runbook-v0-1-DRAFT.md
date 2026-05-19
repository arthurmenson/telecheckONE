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

**Per-stage soak gates (MUST pass before next stage):**

| Stage | Traffic % | Min soak | Error-rate gate | Latency gate (p99) | Cross-check |
|---|---|---|---|---|---|
| canary-5pct | 5% | 10 min | < 0.5% | < 1.5× baseline | I-019 crisis-detection emits at expected rate |
| canary-25pct | 25% | 10 min | < 0.3% | < 1.3× baseline | Audit-chain integrity check passes on a sample |
| canary-50pct | 50% | 15 min | < 0.2% | < 1.2× baseline | Cross-tenant isolation check on a sample request set |
| full | 100% | 30 min | < 0.1% | < 1.1× baseline | Full Operational Readiness v1.5 spot-check passes |

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

## 4. Canary gates (deep-dive on §3.3)

Each canary gate is checked at the end of every 1-minute window during the stage's soak period:

```
gate_pass = (
  error_rate_1min < stage.error_rate_threshold
  AND latency_p99_1min < stage.latency_p99_threshold * baseline.latency_p99
  AND no_i019_signals_dropped
  AND audit_chain_hash_check_passed
  AND no_cross_tenant_data_leak_signals
  AND no_p0_alerts
)
```

**Stage promotion criterion:** all 1-min windows in the soak period pass.

**Stage demotion criterion (auto-rollback):** ≥2 consecutive 1-min windows fail.

**Stage stretch criterion:** soak period extended +5 min if any 1-min window fails but the next succeeds (allows transient blips without triggering rollback).

**Stage abort criterion:** approver manually decides to abort the stage (e.g., a non-quantitative signal — a Slack escalation from a clinician noticing an issue).

---

## 5. Rollback procedure

### 5.1 Rollback decision matrix

| Trigger | Action | Approver required |
|---|---|---|
| Auto-rollback (canary gate fail) | App rollback to prior commit; migrations remain applied (forward-compatible by design) | No (automatic; logged) |
| Operator manually triggers rollback during canary | App rollback to prior commit | Yes (approver consent in ticket) |
| Operator triggers rollback after full deploy + verification failure | App rollback to prior commit + migration rollback if applicable | Yes (named approver) |
| P0 incident raised post-deploy | App rollback IMMEDIATELY; migration rollback per incident type | On-call SRE can authorize during active P0 |

### 5.2 App rollback

```bash
$ deploy-tool app-rollback --session <id> --target-commit <prior-deploy-sha>
# Rolls back app to prior commit; traffic ramps from current % → 0 → prior commit at 100% over 2 minutes
# Emits deploy.rollback_started + deploy.rollback_completed Cat B audit events
```

App rollback target time: **< 5 minutes from rollback initiation to 100% prior commit traffic**.

### 5.3 Migration rollback

For deploys that included migrations: migrations are designed to be forward-compatible (additive); rollback strategy is **DO NOT REVERT migrations by default** — instead, the app rollback runs against the new schema (the new schema's additive changes are transparent to the prior app version).

**Migration revert is permitted only when:**
- The migration is provably destructive (e.g., introduced a NOT NULL column with no default that the prior app version writes NULLs to)
- AND the prior app version cannot run against the new schema
- AND the approver explicitly authorizes the migration revert

Migration revert process:
- Execute the migration-rollback script (each migration ships with a `down.sql` reverse migration)
- Verify the reverted schema is consistent
- Run app rollback per §5.2 to align app + schema versions

**Default:** app rolls back; migrations stay applied. The new schema's additive design is the safety mechanism.

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
2. **OQ2 — Migration revert authorization.** §5.3 currently allows operator + approver to authorize a destructive migration revert. Should this require additional sign-off (e.g., CTO or Compliance Officer for migrations touching PHI-bearing tables)? Recommendation: YES for PHI-bearing tables; the operator + approver pair is sufficient for non-PHI migrations.
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
