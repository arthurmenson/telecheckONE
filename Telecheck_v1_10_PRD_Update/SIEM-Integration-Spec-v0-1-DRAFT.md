# SIEM Integration Spec

**Version:** 0.1 DRAFT
**Status:** Pre-Codex-pre-ratification; Track 5 Infra/Ops deliverable per Master Completion Plan §"Track 5 (operates AHEAD of code)"
**Authoring location:** `Telecheck_v1_10_PRD_Update/` (workstream folder; spec-corpus operations deliverable)
**Owner:** SRE Lead + Compliance Officer + Operations Lead
**Companion documents:** F-4 Deploy Runbook v0.1 DRAFT, GOVERNANCE_CONTROLS Contracts Pack v5.2, AUDIT_EVENTS Contracts Pack v5.5, ADR-026 (single-region+cold-DR), Ghana Launch Playbook v1.2
**Authority:** canonical spec for security information and event management (SIEM) integration. Any deviation from this spec requires named approver sign-off + retrospective.

---

## 1. Purpose

This spec defines the canonical event-streaming pipeline, audit-event aggregation, alerting rules, and retention discipline for the Telecheck platform's SIEM integration. SIEM coverage is mandatory before production launch per Master Completion Plan §"Track 5 (operates AHEAD of code) — When code is ready, infra cannot be the critical-path blocker."

**Coverage:**
- Streaming pipeline from application services → CloudWatch / Datadog → SIEM (the SIEM platform itself is OQ1 — Datadog SIEM vs Splunk vs alternative; pending procurement)
- Audit-event aggregation respecting SI-018 P1 (patient-bound) + P2 (tenant-governance) partition rule
- PagerDuty / on-call integration for P0/P1 alerts
- Retention policy alignment with AUDIT_EVENTS v5.5 §Retention (Cat A max(10y, regulatory), Cat B 7y, Cat C per CCR)
- Compliance evidence: HIPAA technical safeguards, SOC 2 Type II readiness, per-tenant SOC 3 report-ability

**Scope:**
- Event sources + transports
- SIEM data model + index design (per-tier partitioning)
- Alerting rule taxonomy (P0/P1/P2/P3 + their triage SLAs)
- Retention + archival
- Access controls + tenant-isolation in the SIEM surface
- Operational runbook integration with F-4 Deploy Runbook + Incident Response runbook (separate)

**Out of scope:**
- Application-side telemetry instrumentation (covered by individual slice PRDs; SIEM integration is the AGGREGATION side, not the EMISSION side)
- Internal Datadog/CloudWatch dashboard layouts (operator-discretionary; not canonical)
- Vendor procurement (OQ1)

---

## 2. Architecture overview

```
                  Application services
                          │
                          │ (1) Structured-log emit
                          ▼
         ┌─────────────────────────────────┐
         │   Per-pod log forwarder (Vector │
         │   or equivalent; sidecar agent) │
         └─────────────┬───────────────────┘
                       │
                       │ (2) Forward to ingestion
                       ▼
         ┌─────────────────────────────────┐
         │   Ingestion tier                │
         │   - Datadog (metrics + traces)  │
         │   - CloudWatch Logs (raw logs)  │
         │   - Audit DB → CDC stream       │
         │     (audit_events replication)  │
         └─────────────┬───────────────────┘
                       │
                       │ (3) SIEM ingestion
                       ▼
         ┌─────────────────────────────────┐
         │   SIEM platform (OQ1)           │
         │   - Index per partition tier    │
         │   - Alerting rules              │
         │   - Retention policies          │
         │   - Compliance dashboards       │
         └─────────────┬───────────────────┘
                       │
                       │ (4) Alert routing
                       ▼
         ┌─────────────────────────────────┐
         │   PagerDuty (P0/P1)             │
         │   Slack (P2/P3 informational)   │
         │   Compliance archive (audit)    │
         └─────────────────────────────────┘
```

**Three event-source streams** flow into the SIEM:
1. **Application metrics + traces** (Datadog APM): latency, error rates, throughput, service-health probes
2. **Application logs** (CloudWatch Logs → SIEM): structured logs from all services
3. **Audit DB replication** (CDC stream from `audit_events` table → SIEM): canonical audit records per SI-018 P1/P2 partitioning, hash-chain-verified

Streams 1+2 are best-effort observability; stream 3 is the canonical compliance evidence (Cat A / Cat B / Cat C events per AUDIT_EVENTS v5.5).

---

## 3. Proposed sub-decisions (8; APPROVED RECOMMENDATION status varies)

### Sub-decision 1: Event-source canonical schemas

**(1.1) Datadog metrics schema:** standard Datadog tagging convention applied to all metrics:
- `tenant_id` (REQUIRED on every metric emit) — Telecheck-{country} per ADR-023; metric series partitioned by tenant for per-tenant dashboards
- `service` (REQUIRED) — service name (e.g., `auth-service`, `forms-engine`, `interaction-engine`)
- `environment` (REQUIRED) — `production` | `staging` | `dev`
- `region` — `us-east-1` (primary) | `us-west-2` (cold DR)
- `deployment_id` — ULID of the deploy session that emitted this metric (correlates to F-4 runbook §3.1 deploy_session_id)
- `country_of_care` (when relevant) — ISO 3166-1 alpha-2 per CCR

**(1.2) CloudWatch Logs schema:** every log line emitted in structured JSON with REQUIRED fields. Per Codex R1 HIGH-1 closure, **the scope field is MANDATORY on every record**:
- `timestamp` ISO 8601 with timezone (REQUIRED)
- `scope` (REQUIRED; closes Codex R1 HIGH-1) — enum `tenant | platform`. EVERY record carries this; no record may enter SIEM ingestion without it.
- `tenant_id` (REQUIRED when `scope = tenant`; MUST BE NULL when `scope = platform`) — Telecheck-{country} per ADR-023; presence is enforced by scope-aware validation at ingestion time (see Sub-decision 1.5 below).
- `service` (REQUIRED)
- `severity` (REQUIRED) — `DEBUG` | `INFO` | `WARN` | `ERROR` | `FATAL`
- `trace_id` (REQUIRED for request-scoped logs; correlates to Datadog APM trace)
- `account_id` (when known) — actor account
- `request_id` — ULID
- `event_class` — enum (`request` | `audit` | `health_check` | `migration` | `deploy` | `incident`)

### Sub-decision 1.5: Ingestion-time scope-validation gate (closes Codex R1 HIGH-1)

A pre-ingestion validator runs on every record entering the SIEM pipeline:

```
validate(record) = {
  reject if record.scope is missing or not in {'tenant', 'platform'}
  reject if record.scope = 'tenant' and (tenant_id is missing or tenant_id is not in the active-tenants registry)
  reject if record.scope = 'platform' and tenant_id is non-null
  reject if record.scope = 'platform' and the emitting service is not in the platform-services allowlist (e.g., deploy-tool, migration-runner, infrastructure-monitor; tenant-application services are NOT permitted to emit platform-scope records)
}
```

Rejected records are quarantined to a separate index (`siem_validation_quarantine`) for SRE triage; the emitting service is paged via P1 alert (per Sub-decision 3) because a missing/malformed scope is a system bug. Quarantine retention = 90 days for triage; quarantined records are NOT visible in routine SIEM queries.

**Scope-aware index routing:**
- `scope = tenant` records → indexed in tenant-queryable indexes (`audit_events_p1`, `audit_events_p2`, application_logs_tenant, etc.)
- `scope = platform` records → indexed in a separate platform-only index (`platform_logs`) that requires platform_admin role for queries; tenant operators cannot query this index (returns tenant-blind no-results per I-025)

This makes tenant isolation provable at ingestion time, not just at query time. Every record's scope is canonical metadata; routing follows scope deterministically.

**(1.3) Audit DB CDC stream schema:** identical to canonical `audit_events` row shape per AUDIT_EVENTS v5.5 (§Audit record schema + §Hash chain partitioning + 3 new 2026-05-19 action IDs); replicated 1:1 from the audit DB to the SIEM via Postgres CDC (logical replication or Debezium).

**Promotion class:** content-change addition to a SIEM contract (new in this spec).

### Sub-decision 2: SIEM index design (per-tier partitioning per SI-018)

The SIEM creates 3 canonical indexes for audit events to honor the SI-018 partition rule + enable per-tier query patterns:

1. **`audit_events_p1`** — Cat A patient-bound events; partition_key = SHA-256("GENESIS:PATIENT:<target_patient_id>"); indexed by (tenant_id, target_patient_id, action_id, timestamp)
2. **`audit_events_p2`** — Cat B + Cat C tenant-governance events; partition_key = SHA-256("GENESIS:TENANT:<tenant_id>"); indexed by (tenant_id, action_id, timestamp)
3. **`audit_events_p_platform`** — reserved for the platform-scope partition tier deferred per AUDIT_EVENTS §Hash chain §Partitioning open-question note (currently unused; placeholder for future SI ratification of the platform-scope partition)

**Cross-tier query rule:** queries spanning P1 + P2 (e.g., compliance reports needing all events for a tenant) execute against both indexes; query latency targets are stated separately per index.

**Per-tenant access control on SIEM queries:** SIEM role-based access enforces that operators querying with a `tenant_id` filter receive only that tenant's data; cross-tenant queries require break-glass authorization per I-024. Audit-DB CDC stream carries the `tenant_id` per row; SIEM indexes index it.

### Sub-decision 3: Alerting rule taxonomy

**P0 (page on-call immediately; <5 min ack):**
- I-019 crisis-detection signal dropped
- I-023 cross-tenant data-leak signal
- I-027 audit-chain integrity broken
- Production deploy auto-rollback triggered (per F-4 §3.3)
- Service-health check missing >2 consecutive intervals for any critical-path service
- Database backup failed for >24h
- KMS key access failure on any tenant

**P1 (page on-call; <30 min ack):**
- Service error rate >0.5% sustained for 5 min
- p99 latency >2× baseline sustained for 5 min
- Audit-event emission lag >10 min on any tenant
- `security.security_definer_tenant_guc_mismatch` (I-032) any occurrence — system bug per canonical I-032

**P2 (Slack #ops; review during business hours):**
- Error rate elevation below P1 threshold
- Latency elevation below P1 threshold
- Authentication failure rate elevation
- Migration apply duration >60s (per F-4 §3.2)

**P3 (informational; #ops-firehose):**
- All Cat C operational events
- Routine deploy lifecycle events
- Non-alerting health-check fluctuations

**Alerting rule canonical text:**
- Each rule has a canonical name, severity, trigger condition (metric/event query), notification target, runbook link, escalation chain.
- Rules are versioned: each rule update produces a new immutable version per I-013 (immutable published content). Old versions retained for audit.
- Rule changes require dual-control per I-015 (rule author + SRE lead approver).

### Sub-decision 4: Retention + archival policy

Per AUDIT_EVENTS v5.5 §Retention canonical policy:

| Audit category | Hot retention | Warm retention (queryable, archived) | Cold archive | Total minimum |
|---|---|---|---|---|
| Cat A (safety-critical clinical) | 1 year SIEM | 2 years archived | 7+ years cold storage | max(10 years, applicable medical records retention law, applicable regulatory requirement) |
| Cat B (governance + config) | 1 year SIEM | 2 years archived | 4+ years cold storage | 7 years |
| Cat C (operational + engagement) | 6 months SIEM | per CCR `retention_years_engagement` | per CCR | per CCR |

**Hot retention** = full-text searchable in SIEM with sub-second query latency.
**Warm retention** = queryable with elevated latency (sub-minute); archived to S3 + indexed.
**Cold archive** = retrievable within 72 hours for regulatory inquiry; not indexed.

**Hash chain preservation (extended per Codex R1 HIGH-2 closure):** the canonical audit-chain hash linkages per I-003 + I-027 are preserved across all retention tiers via the following hard archival mechanics:

**4.5.HC — Hash-chain archival contract (R1 HIGH-2 closure):**

1. **Per-partition ordered manifests.** Each partition (P1 patient-bound + P2 tenant-governance + future platform-scope) maintains an immutable ordered manifest file in each retention tier listing: `(sequence_number, record_id, record_hash, previous_hash, timestamp)` for every event in the partition.
2. **Boundary hashes at every tier transition.** When a partition's events age from hot → warm, the last hot-tier `record_hash` is also recorded as the "boundary hash" of the hot→warm transition + as the "predecessor boundary hash" of the warm-tier manifest's first event. Same for warm → cold. Boundary hashes prove unbroken chain continuity across tier boundaries.
3. **Tier-transition attestations.** Each tier transition emits a Cat B audit event `audit_retention.tier_transition_executed` with payload: `partition_key, source_tier, target_tier, transition_record_range, boundary_hash, attesting_operator_id, attestation_timestamp`. The attestation itself becomes part of the canonical audit chain.
4. **Retention of link dependencies for full legal period.** All hash linkages (predecessor/successor pointers) are retained across the full retention period (per the table above; up to max(10y, regulatory) for Cat A) — even if intermediate events have been archived to cold storage. A chain verification at year-9 must traverse all hot/warm/cold tiers without gaps.
5. **Scheduled chain-verification job.** A weekly background job traverses every active partition's chain across all tiers (hot → warm → cold) and reports any broken link. Job results published to the SIEM as Cat B audit events; failures trigger P0 alerts (per Sub-decision 3).
6. **Manifest immutability.** Per-tier manifests are append-only; once a manifest entry is written it is never modified. Manifest checksum is itself part of the manifest header for tamper detection.

These archival mechanics ensure that I-027 chain verification remains valid when archived Cat A/Cat B evidence is retrieved for regulatory inquiry, including across the hot/warm/cold tier boundaries that are the highest-risk integrity surface.

**Retention is per-tenant configurable above the minimum:** tenants may extend retention for their own compliance needs but cannot reduce below the canonical minimum.

### Sub-decision 5: PagerDuty + on-call integration

- PagerDuty rotation: 2 engineers on primary + secondary rotation; 12-hour shifts; rotation per Operational Readiness Tracker v1.5
- P0 → primary; if no ack in 5 min → secondary; if no ack in another 5 min → escalation to SRE Lead
- P1 → primary; if no ack in 30 min → secondary
- P2 → Slack #ops; no paging
- P3 → Slack #ops-firehose; no paging

**On-call must have:** SIEM access, F-4 Deploy Runbook access, incident-response runbook access, KMS break-glass authorization, on-call MFA token.

### Sub-decision 6: Compliance dashboards

Canonical compliance dashboards built on the SIEM:

1. **HIPAA technical-safeguards dashboard:** audit-trail completeness (per I-003 hash chain coverage); per-tenant access logs; PHI access patterns; break-glass usage per I-024.
2. **SOC 2 Type II readiness dashboard:** change-management evidence (deploys + approvals); access-control logs; vulnerability response time.
3. **Per-tenant SOC 3 report-ability:** tenant-scoped audit reports queryable by tenant operators for their own customers (with tenant-isolation enforced).

Dashboards are READ-ONLY for non-Compliance roles; modification requires dual-control per I-015.

### Sub-decision 7: SIEM tenant-isolation per ADR-023 + I-023 + I-025

- SIEM role-based access carries the same tenant scope as application RBAC
- Cross-tenant SIEM queries require break-glass per I-024 (Privacy Officer authorization + audit emission)
- Tenant operators see only their tenant's logs/events/metrics
- Platform operators have cross-tenant visibility only via break-glass; routine ops uses tenant-scoped sessions
- Information-leak rule per I-025: SIEM search results never leak the existence of cross-tenant data to unauthorized queriers (queries for non-accessible tenants return tenant-blind "no results" not "permission denied")

### Sub-decision 8: SIEM deploy-event correlation

Per F-4 Deploy Runbook §6 canonical deploy audit events, the SIEM has a canonical deploy-event correlation view:

- Every deploy_session_id is queryable as a unified timeline (`deploy.initiated → deploy.migration_applied → deploy.canary_stage_started → ... → deploy.fully_deployed | deploy.rollback_completed`)
- Service metrics + logs tagged with `deployment_id` filterable to the deploy session
- Post-deploy retrospectives generate from the unified timeline

**Auto-rollback routing (closes Codex R1 MED-1; P0 PagerDuty routing is BINDING per Sub-decision 3, not chat-only):**

A `deploy.rollback_started` or `deploy.rollback_completed` audit event triggers the canonical Sub-decision 3 P0 PagerDuty alert. Slack `#deploys` + `#incidents` notifications are ADDITIONAL — never replacement — for the P0 PagerDuty rule. The correlation view links to the active PagerDuty incident ID for the rollback (not just to the SIEM dashboard URL).

**Concrete routing:**
- `deploy.rollback_started` (auto-rollback OR manual rollback during canary): P0 PagerDuty alert (primary on-call paged + secondary escalation per Sub-decision 5 ladder) + Slack #deploys + Slack #incidents (with PagerDuty incident URL embedded)
- `deploy.rollback_completed`: P0 PagerDuty alert auto-acknowledged on completion (or escalated if rollback itself fails) + Slack #deploys + Slack #incidents (with PagerDuty incident URL embedded)
- `deploy.fully_deployed` (success path): Slack #deploys notification only; no PagerDuty

This makes Sub-decision 3's "production deploy auto-rollback triggered" P0 rule and Sub-decision 8's correlation view consistent: rollback events always page on-call; the correlation view links to the page.

---

## 4. Cross-artifact impact

This spec is operations-side; minimal canonical-bundle impact:

- **AUDIT_EVENTS:** no changes (this spec consumes the canonical schema; doesn't extend it)
- **CDM:** no changes
- **Registry:** +1 minor bump if SIEM integration spec becomes canonical (versioning new operations spec); OR no bump if treated as workstream-folder operations deliverable (similar to F-4 runbook treatment)
- **Promotion Ledger:** 1 new entry if SIEM spec promoted to canonical bundle

**Decision for ratifier (OQ7):** promote SIEM spec to canonical bundle artifact OR retain as workstream-folder operations spec? Recommendation: canonical bundle (consistent with Ghana Launch Playbook + Operational Readiness Tracker treatment).

---

## 5. Open questions for ratifier

1. **OQ1 — SIEM platform selection.** Datadog SIEM, Splunk, Sumo Logic, or alternative? Procurement decision; recommendation: Datadog (already in stack; minimizes vendor sprawl).
2. **OQ2 — Per-tenant SIEM index OR shared index with tenant_id partitioning?** Recommendation: shared index with tenant_id partitioning (better query economics; tenant-isolation enforced via SIEM RBAC).
3. **OQ3 — Audit DB CDC vs scheduled-replication frequency.** Recommendation: real-time CDC (sub-second lag) for compliance evidence freshness; scheduled replication acceptable for non-audit log streams.
4. **OQ4 — PagerDuty primary+secondary rotation size.** Recommendation: 2 engineers per shift at launch; expand as team grows.
5. **OQ5 — On-call paging hours (24/7 or business hours initially).** Recommendation: 24/7 from day 1 (clinical platform; patient safety implications).
6. **OQ6 — Tenant configurable retention extension (above minimum) implementation.** Recommendation: per-tenant retention config in CCR; SIEM honors tenant CCR retention setting on archival timing.
7. **OQ7 — Promote SIEM spec to canonical bundle artifact?** Recommendation: YES (consistency with Ghana Launch Playbook + OR Tracker treatment).
8. **OQ8 — Codex pre-ratification target.** Recommendation: 2-3 rounds. Operations spec; lower architectural risk than SIs.

---

## 6. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; awaiting Codex R1.

---

## 7. Sequence for ratification

1. Codex pre-ratification cycle on this spec (target 2-3 rounds).
2. Operations Lead + SRE Lead + Compliance Officer review.
3. Ratifier ceremony (Evans-led; chat-message ratification per cycle precedent).
4. Vendor procurement decisions (OQ1) authorized post-ratification.
5. Infrastructure provisioning in us-east-1 + us-west-2 cold-DR.
6. First staging deploy executes the F-4 runbook + SIEM aggregation verified.

---

— Claude (Opus 4.7, 1M context), SIEM Integration Spec v0.1 DRAFT authored 2026-05-19 under "continue for 24 hrs" autonomous-work authorization. Sprint 6 of the 24h-loop work plan. Track 5 Infra/Ops spec-corpus deliverable.
