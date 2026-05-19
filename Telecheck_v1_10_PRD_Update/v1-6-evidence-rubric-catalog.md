# Operational Readiness v1.6 — Evidence Rubric Catalog

**Version:** 0.1 DRAFT
**Status:** Companion to Operational Readiness Tracker v1.5 → v1.6 amendment (Sprint 17); pre-Codex-pre-ratification
**Owner:** SRE Lead + Compliance Officer
**Purpose:** the canonical per-item evidence rubric for every checklist item in Operational Readiness v1.6 §3 (pre-launch infrastructure) + §4 (pre-launch security) + §7 (per-tenant launch-readiness sub-checklist). Referenced from the amendment file; this catalog is the authoritative source for evidence-artifact verification at launch gate.

---

## 1. Evidence rubric template

Every checklist item has the following fields:

| Field | Description |
|---|---|
| **Test ID** | Canonical test or runbook artifact identifier |
| **Environment** | Where the test must pass: `staging` / `production` / `staging+production` |
| **Pass threshold** | Quantitative pass criteria |
| **Tenant scope** | `per-tenant` / `platform-wide` / `per-tenant per-provider` |
| **Owner** | Accountable role for green status |
| **Freshness** | How recent the evidence must be (e.g., "within 30 days") |
| **Attestation** | Canonical path where the attestation document is stored |

---

## 2. §3 Pre-launch infrastructure (14 items)

### F-4 Deploy Runbook integration (Sprint 5)

**Item 1: F-4 deploy pipeline implemented per Sprint 5 runbook.**
- Test ID: `__integration__/deploy/f4_canary.test.ts` + manual runbook walkthrough.
- Environment: staging (full pipeline run); production (canonical canary on first real deploy).
- Pass threshold: all 9 dual-control authorization checklist items signed; canary-stage probes green; migration-failure recovery branch test (5-row decision matrix) passes.
- Tenant scope: platform-wide.
- Owner: SRE Lead.
- Freshness: within 30 days of launch.
- Attestation: `attestations/operational-readiness/f4-deploy-runbook-attestation.md`.

**Item 2: Per-canary invariant probes wired to PagerDuty.**
- Test ID: `__integration__/deploy/invariant_probe_freshness.test.ts`.
- Environment: staging.
- Pass threshold: I-019/I-023 ≤60s freshness; cache/service-health ≤60s; I-027 audit-trail probe 5-10min staleness.
- Tenant scope: platform-wide.
- Owner: SRE Lead.
- Freshness: within 30 days.
- Attestation: `attestations/operational-readiness/invariant-probe-freshness-attestation.md`.

**Item 3: Deploy-event correlation with SIEM.**
- Test ID: `__integration__/deploy/siem_correlation.test.ts`.
- Environment: staging.
- Pass threshold: deploy event in SIEM ≤30s p99; correlation alerts fire on simulated invariant regression.
- Tenant scope: platform-wide.
- Owner: SRE Lead.
- Freshness: within 30 days.
- Attestation: `attestations/operational-readiness/siem-deploy-correlation-attestation.md`.

### Cold-DR Runbook integration (Sprint 7)

**Item 4: Multi-region ACK channel provisioned + topology verified.**
- Test ID: `__integration__/cold-dr/multi-region-ack-topology.test.ts`.
- Environment: staging+production.
- Pass threshold: BOTH regions accept writes; quorum-correctness verified via simulated partition drill; partition_degraded=true flag fires correctly.
- Tenant scope: platform-wide.
- Owner: SRE Lead.
- Freshness: within 90 days; ongoing weekly canary.
- Attestation: `attestations/operational-readiness/multi-region-ack-attestation.md`.

**Item 5: Pre-failover canary decrypts executable.**
- Test ID: `__integration__/cold-dr/pre-failover-canary.test.ts`.
- Environment: staging+production.
- Pass threshold: per-tenant canary decrypt against us-west-2 CMK replica succeeds within 2s p99.
- Tenant scope: per-tenant.
- Owner: SRE Lead.
- Freshness: within 7 days; ongoing daily.
- Attestation: `attestations/operational-readiness/pre-failover-canary-tenant-<id>.md`.

**Item 6: Three-state per-device obligation model implemented.**
- Test ID: `__integration__/cold-dr/three-state-obligation.test.ts`.
- Environment: staging.
- Pass threshold: simulated DR drill produces correct state-Q/state-P/state-N distribution per Sprint 7 §"Three-state"; reconciliation pass works post-recovery.
- Tenant scope: platform-wide.
- Owner: SRE Lead + Clinical Lead.
- Freshness: within 90 days; ongoing quarterly DR drill.
- Attestation: `attestations/operational-readiness/three-state-obligation-attestation.md`.

**Item 7: Step 14.5 I-019 fallback replay verified.**
- Test ID: `__integration__/cold-dr/i019-fallback-replay.test.ts`.
- Environment: staging.
- Pass threshold: 100% drain within 60min for reachable cohort; offline cohort ≤20% per tenant.
- Tenant scope: per-tenant.
- Owner: Clinical Lead.
- Freshness: within 30 days; ongoing monthly drill per §6 cadence.
- Attestation: `attestations/operational-readiness/i019-fallback-replay-tenant-<id>.md`.

**Item 8: Tenant-routing gate verified per tenant.**
- Test ID: `__integration__/cold-dr/tenant-routing-gate.test.ts`.
- Environment: staging+production.
- Pass threshold: Step 11.5 infra-only gate + Step 12.5 app-level post-scale-up gate both pass; tenant_routing_gate_passed=true Cat A audit event emitted.
- Tenant scope: per-tenant.
- Owner: SRE Lead.
- Freshness: within 30 days per tenant.
- Attestation: `attestations/operational-readiness/tenant-routing-gate-tenant-<id>.md`.

### KMS Architecture integration (Sprint 13)

**Item 9: Per-tenant CMK provisioned + multi-region replica drift-free.**
- Test ID: `__integration__/kms/cmk-provisioning.test.ts` + `__integration__/kms/replica-policy-drift.test.ts`.
- Environment: staging+production.
- Pass threshold: CMK ARN bound to tenant.cmk_arn; replica policy matches primary policy per canonical IaC artifact.
- Tenant scope: per-tenant.
- Owner: SRE Lead.
- Freshness: ongoing daily drift check.
- Attestation: `attestations/operational-readiness/kms-cmk-tenant-<id>.md`.

**Item 10: STS session-tag binding enforced.**
- Test ID: `__integration__/kms/sts-session-tag-binding.test.ts`.
- Environment: staging.
- Pass threshold: confused-deputy test denies cross-tenant role assumption; Cat A audit event emitted.
- Tenant scope: per-tenant.
- Owner: Security Engineering Lead.
- Freshness: within 30 days; ongoing CI gate.
- Attestation: `attestations/operational-readiness/kms-sts-binding-tenant-<id>.md`.

**Item 11: Break-glass IAM role with 5 per-tag Explicit Deny + HSM signing keys.**
- Test ID: `__integration__/kms/break-glass-iam-policy.test.ts` + `__integration__/kms/break-glass-signature-check.test.ts`.
- Environment: staging+production.
- Pass threshold: each per-tag Deny verified (KMS.7b expansion); HSM signing keys for CTO+CO+IC provisioned + accessible only by approval-broker role.
- Tenant scope: platform-wide.
- Owner: Security Engineering Lead + Compliance Officer.
- Freshness: within 30 days.
- Attestation: `attestations/operational-readiness/break-glass-iam-attestation.md`.

**Item 12: Versioned DEK keyring populated.**
- Test ID: `__integration__/kms/dek-versioned-reads.test.ts`.
- Environment: staging+production.
- Pass threshold: mixed old+new DEK rows decrypt via dek_version_id dispatch; rotation interruption tested + resumable.
- Tenant scope: per-tenant.
- Owner: SRE Lead.
- Freshness: ongoing quarterly DEK rotation verification.
- Attestation: `attestations/operational-readiness/dek-keyring-tenant-<id>.md`.

**Item 13: kms_residency_policy CCR value verified.**
- Test ID: `__integration__/kms/residency-policy-verification.test.ts`.
- Environment: staging+production.
- Pass threshold: `us_with_dr_fallback` configured per Telecheck-US + Telecheck-Ghana; us_only-exception path tested.
- Tenant scope: per-tenant.
- Owner: Compliance Officer.
- Freshness: within 30 days.
- Attestation: `attestations/operational-readiness/kms-residency-policy-tenant-<id>.md`.

### Notification Spec v1.2 integration (Sprint 16)

**Item 14: Per-tenant SMS provider configured.**
- Test ID: `__integration__/notification/sms-provider-routing.test.ts`.
- Environment: staging+production.
- Pass threshold: Twilio (Telecheck-US) primary, Vonage fallback; Africa's Talking (Telecheck-Ghana) primary, Vonage fallback; provider fallback test exercises attempt_seq=2 path.
- Tenant scope: per-tenant.
- Owner: SRE Lead.
- Freshness: within 30 days.
- Attestation: `attestations/operational-readiness/sms-provider-tenant-<id>.md`.

**Item 15: Crisis-notification cross-channel dispatch.**
- Test ID: `__integration__/notification/crisis-cross-channel.test.ts`.
- Environment: staging+production (synthetic-patient).
- Pass threshold: all 4 channels dispatched within 30s p99 (per §5 SLO); Cat A audit chain complete.
- Tenant scope: per-tenant.
- Owner: Clinical Lead + SRE Lead.
- Freshness: within 30 days; ongoing monthly chaos drill.
- Attestation: `attestations/operational-readiness/crisis-cross-channel-tenant-<id>.md`.

**Item 16: Dual-bucket rate-limit reservation.**
- Test ID: `__integration__/notification/dual-bucket-reservation.test.ts`.
- Environment: staging.
- Pass threshold: routine cannot consume crisis bucket; crisis can borrow routine; starvation test passes.
- Tenant scope: per-tenant per-provider.
- Owner: SRE Lead.
- Freshness: within 30 days.
- Attestation: `attestations/operational-readiness/dual-bucket-tenant-<id>-provider-<name>.md`.

---

## 3. §4 Pre-launch security (6 items)

### SIEM Integration (Sprint 6)

**Item 17: Audit-event aggregation pipeline provisioned.**
- Test ID: `__integration__/siem/event-streaming.test.ts`.
- Environment: staging+production.
- Pass threshold: 100k events/min sustained; ≤30s p99 aggregation latency to SIEM.
- Tenant scope: platform-wide.
- Owner: SRE Lead.
- Freshness: within 30 days.
- Attestation: `attestations/operational-readiness/siem-pipeline-attestation.md`.

**Item 18: Hash-chain archival mechanics configured.**
- Test ID: `__integration__/siem/hash-chain-archival.test.ts`.
- Environment: staging+production.
- Pass threshold: S3 Object Lock COMPLIANCE-mode enabled; cross-region replication verified; HSM-signed digests verifiable.
- Tenant scope: platform-wide.
- Owner: SRE Lead + Security Engineering Lead.
- Freshness: within 30 days.
- Attestation: `attestations/operational-readiness/hash-chain-archival-attestation.md`.

**Item 19: PagerDuty integration tested for P0/P1.**
- Test ID: `__integration__/siem/pagerduty-routing.test.ts`.
- Environment: staging.
- Pass threshold: simulated P0/P1 alerts fire correctly per SIEM §3 taxonomy.
- Tenant scope: platform-wide.
- Owner: SRE Lead.
- Freshness: within 30 days.
- Attestation: `attestations/operational-readiness/pagerduty-routing-attestation.md`.

### KMS Architecture (Sprint 13)

**Item 20: IAM policy drift-detection CI job runs daily.**
- Test ID: `infrastructure/policy-as-code/tests/key_policy_drift.test.ts`.
- Environment: production (live drift detection).
- Pass threshold: daily run; alerts on detected drift; mean-time-to-detect <24h.
- Tenant scope: per-tenant.
- Owner: Security Engineering Lead.
- Freshness: ongoing daily.
- Attestation: `attestations/operational-readiness/iam-drift-detection-attestation.md`.

**Item 21: Per-decrypt Cat A audit emission for sensitive classes.**
- Test ID: `__integration__/kms/sensitive_class_no_sampling.test.ts`.
- Environment: staging.
- Pass threshold: pii_sensitive_clinical + pii_financial + pii_audit_payload decrypts always emit Cat A (no sampling).
- Tenant scope: per-tenant.
- Owner: SRE Lead + Compliance Officer.
- Freshness: within 30 days.
- Attestation: `attestations/operational-readiness/per-decrypt-audit-tenant-<id>.md`.

**Item 22: Encryption-context-mismatch test exercised.**
- Test ID: `__integration__/kms/encryption_context_mismatch.test.ts`.
- Environment: staging.
- Pass threshold: deliberate wrong-context decrypt → InvalidCiphertextException + Cat A `kms.decrypt_failed`.
- Tenant scope: per-tenant.
- Owner: Security Engineering Lead.
- Freshness: within 30 days.
- Attestation: `attestations/operational-readiness/encryption-context-mismatch-tenant-<id>.md`.

---

## 4. §7 Per-tenant launch-readiness sub-checklist (full rubric per item; R3 HIGH closure)

The per-tenant sub-checklist applies independently to each day-1 tenant (Telecheck-US / Heros Health + Telecheck-Ghana / Heros Health Ghana). Each item below MUST be green per-tenant BEFORE that tenant goes live.

### §7.1 Per-tenant identity / RLS

**Item P-1: Tenant CMK provisioned + multi-region replica verified.**
- Test ID: cross-reference Item 9 above (`__integration__/kms/cmk-provisioning.test.ts` + `replica-policy-drift.test.ts`).
- Environment: staging+production.
- Pass threshold: CMK ARN bound to `tenant.cmk_arn`; us-east-1 + us-west-2 replicas drift-free per IaC artifact.
- Tenant scope: per-tenant.
- Owner: SRE Lead.
- Freshness: ongoing daily drift check; pre-launch verification within 14 days.
- Attestation: `attestations/operational-readiness/per-tenant/p1-cmk-tenant-<id>.md`.

**Item P-2: Tenant service IAM role with STS session-tag binding verified.**
- Test ID: cross-reference Item 10 (`__integration__/kms/sts-session-tag-binding.test.ts`).
- Environment: staging+production.
- Pass threshold: confused-deputy negative test denies cross-tenant assume-role; positive test succeeds with matching tenant tag.
- Tenant scope: per-tenant.
- Owner: Security Engineering Lead.
- Freshness: within 14 days of launch.
- Attestation: `attestations/operational-readiness/per-tenant/p2-sts-binding-tenant-<id>.md`.

**Item P-3: RLS policies enforced on every PHI table per ADR-023 Model A.**
- Test ID: `__integration__/rls/full-table-coverage.test.ts` + `rls/tenant-binding-enforcement.test.ts`.
- Environment: staging+production.
- Pass threshold: every PHI table (from CDM v1.2 inventory) has RLS policy `tenant_id = current_setting('app.tenant_id')`; cross-tenant SELECT returns 0 rows; cross-tenant INSERT/UPDATE/DELETE rejected.
- Tenant scope: per-tenant (verified by running tests under that tenant's service identity).
- Owner: Engineering Lead.
- Freshness: within 14 days of launch.
- Attestation: `attestations/operational-readiness/per-tenant/p3-rls-tenant-<id>.md`.

**Item P-4: Tenant-routing infrastructure wired + cutover-tested.**
- Test ID: `__integration__/routing/tenant-dns-alb-mesh.test.ts`.
- Environment: staging+production.
- Pass threshold: DNS resolves to correct ALB; ALB routes to tenant-scoped service mesh; cutover test exercises full traffic switch in <5min without dropped requests.
- Tenant scope: per-tenant.
- Owner: SRE Lead.
- Freshness: within 7 days of launch.
- Attestation: `attestations/operational-readiness/per-tenant/p4-routing-tenant-<id>.md`.

### §7.2 Per-tenant data + clinical

**Item P-5: CCR keys provisioned per tenant.**
- Test ID: `__integration__/ccr/per-tenant-key-completeness.test.ts`.
- Environment: production.
- Pass threshold: all required CCR keys present per tenant: `sms_provider_primary`, `sms_provider_fallback`, `ai_provider`, `kms_residency_policy`, `country_of_care`, `ai_mode1_daily_quota`, `ai_mode2_daily_quota`, `ai_mode2_per_patient_hourly_quota` + slice-specific keys (Forms Engine + Pharmacy + Refill).
- Tenant scope: per-tenant.
- Owner: Compliance Officer + SRE Lead.
- Freshness: within 7 days of launch.
- Attestation: `attestations/operational-readiness/per-tenant/p5-ccr-keys-tenant-<id>.md`.

**Item P-6: Country-of-care protocols loaded.**
- Test ID: `__integration__/protocols/country-protocol-loaded.test.ts`.
- Environment: production.
- Pass threshold: Ghana Protocol Library v1.0 OR US protocol library loaded; per-protocol acceptance test passes (synthetic patient case progression through each registered protocol).
- Tenant scope: per-tenant.
- Owner: Clinical Lead.
- Freshness: within 14 days of launch.
- Attestation: `attestations/operational-readiness/per-tenant/p6-protocols-tenant-<id>.md`.

**Item P-7: Crisis-line resource content localized.**
- Test ID: `__integration__/crisis/localized-resource-content.test.ts`.
- Environment: production.
- Pass threshold: country-specific crisis-line phone numbers configured + verified callable; localized safety language per WHO crisis-line guidelines; rendered correctly in Mode 1 crisis_signal response.
- Tenant scope: per-tenant.
- Owner: Clinical Lead.
- Freshness: within 14 days of launch.
- Attestation: `attestations/operational-readiness/per-tenant/p7-crisis-content-tenant-<id>.md`.

**Item P-8: Clinician roster provisioned with licenses verified.**
- Test ID: `__integration__/clinician-roster/license-verification.test.ts`.
- Environment: production.
- Pass threshold: every clinician in roster has valid + non-expired license verified against Ghana Medical and Dental Council OR US state medical board; license expiry monitoring configured.
- Tenant scope: per-tenant.
- Owner: Compliance Officer + Clinical Lead.
- Freshness: within 30 days of launch; ongoing per-license expiry tracking.
- Attestation: `attestations/operational-readiness/per-tenant/p8-clinician-roster-tenant-<id>.md`.

### §7.3 Per-tenant operations + audit

**Item P-9: Audit-event aggregation + retention configured.**
- Test ID: `__integration__/audit/per-tenant-dashboard-routing.test.ts` + `audit/retention-policy.test.ts`.
- Environment: production.
- Pass threshold: tenant-specific Datadog/SIEM dashboards live + showing real events; retention policy per AUDIT_EVENTS spec configured (Cat A = 7y; Cat B = 3y; Cat C = 90d sampled).
- Tenant scope: per-tenant.
- Owner: SRE Lead + Compliance Officer.
- Freshness: within 14 days of launch.
- Attestation: `attestations/operational-readiness/per-tenant/p9-audit-tenant-<id>.md`.

**Item P-10: Tenant operator onboarded with operator-mode-switcher.**
- Test ID: `__integration__/identity/operator-mode-switch.test.ts`.
- Environment: production.
- Pass threshold: tenant operator account provisioned with SI-017 §6 operator-mode-switcher access; switching between tenant-scoped + platform-scope emits Cat B `identity.operator_mode_switched` event.
- Tenant scope: per-tenant.
- Owner: Compliance Officer + Engineering Lead.
- Freshness: within 14 days of launch.
- Attestation: `attestations/operational-readiness/per-tenant/p10-operator-tenant-<id>.md`.

**Item P-11: Per-tenant DR drill executed within last 90 days.**
- Test ID: full DR drill walkthrough per Cold-DR Runbook + tests `cold-dr/three-state-obligation.test.ts` + `cold-dr/i019-fallback-replay.test.ts` for this tenant.
- Environment: staging (full drill); production (canary verification).
- Pass threshold: RPO ≤15min + RTO ≤4h verified; tenant-specific replay drained per Step 14.5.
- Tenant scope: per-tenant.
- Owner: SRE Lead + Incident Commander.
- Freshness: within 90 days (per quarterly cadence § Sub-decision 3).
- Attestation: `attestations/operational-readiness/per-tenant/p11-dr-drill-tenant-<id>.md`.

**Item P-12: Per-tenant crisis-detection chaos drill executed within last 30 days.**
- Test ID: full chaos drill per § Sub-decision 3 monthly cadence; tenant-specific synthetic-test patient cohort.
- Environment: staging (drill execution); production (acknowledgment of drill outcome).
- Pass threshold: I-019 detector fires within 500ms p99; cross-channel dispatch within 30s p99; undeliverable escalation fires within 5min SLA — all under bounded blast-radius controls per § Sub-decision 3.
- Tenant scope: per-tenant.
- Owner: Clinical Lead + SRE Lead.
- Freshness: within 30 days (per monthly cadence).
- Attestation: `attestations/operational-readiness/per-tenant/p12-chaos-drill-tenant-<id>.md`.

### §7.4 Per-tenant data-boundary + lifecycle proof (R1 HIGH-2 closure items)

**Item P-13: Tenant-scoped backup/restore tested.**
- Test ID: `__integration__/data-lifecycle/backup-restore-isolation.test.ts`.
- Environment: staging.
- Pass threshold: snapshot restored into test env; cross-tenant queries return zero rows; RLS behavior matches production.
- Tenant scope: per-tenant.
- Owner: SRE Lead.
- Freshness: within 30 days of launch; ongoing quarterly.
- Attestation: `attestations/operational-readiness/per-tenant/p13-backup-restore-tenant-<id>.md`.

**Item P-14: Migration/import isolation tested.**
- Test ID: `__integration__/data-lifecycle/migration-isolation.test.ts`.
- Environment: staging.
- Pass threshold: multi-tenant import fixture; all rows carry correct tenant_id; cross-tenant queries rejected.
- Tenant scope: per-tenant.
- Owner: Engineering Lead.
- Freshness: within 30 days of launch.
- Attestation: `attestations/operational-readiness/per-tenant/p14-migration-tenant-<id>.md`.

**Item P-15: Export/data-portability isolation tested.**
- Test ID: `__integration__/data-lifecycle/export-isolation.test.ts`.
- Environment: staging.
- Pass threshold: export bundle contains ONLY requesting patient's data; no cross-tenant leakage; UUID-collision-edge-case test passes.
- Tenant scope: per-tenant.
- Owner: Compliance Officer + Engineering Lead.
- Freshness: within 30 days of launch.
- Attestation: `attestations/operational-readiness/per-tenant/p15-export-tenant-<id>.md`.

**Item P-16: Retention/deletion policy execution tested.**
- Test ID: `__integration__/data-lifecycle/retention-isolation.test.ts`.
- Environment: staging.
- Pass threshold: synthetic retention sweep deletes only target tenant's expired data; cross-tenant retention sweep blocked without I-024 break-glass.
- Tenant scope: per-tenant.
- Owner: Compliance Officer.
- Freshness: within 30 days of launch; ongoing per-retention-cycle verification.
- Attestation: `attestations/operational-readiness/per-tenant/p16-retention-tenant-<id>.md`.

**Item P-17: Audit-log tenant partitioning integrity verified.**
- Test ID: `__integration__/audit/partition-isolation.test.ts`.
- Environment: production.
- Pass threshold: SIEM query for tenant returns ALL tenant-bound events (P1/P2 partitioning consistent with SI-018); cross-tenant query rejected.
- Tenant scope: per-tenant.
- Owner: SRE Lead + Compliance Officer.
- Freshness: within 30 days of launch.
- Attestation: `attestations/operational-readiness/per-tenant/p17-audit-partition-tenant-<id>.md`.

**Item P-18: Cross-tenant negative test suite passed.**
- Test ID: `__integration__/cross-tenant-negative-tests/full-suite.test.ts` covering HTTP API path-parameter manipulation + batch worker queues + DR-failover replay + analytics/reporting paths.
- Environment: staging.
- Pass threshold: every cross-tenant attempt rejected with tenant-blind 404 (HTTP) OR canonical denial (queue/replay/analytics).
- Tenant scope: per-tenant (suite runs as tenant_A's service identity against tenant_B and vice versa).
- Owner: Engineering Lead + Security Engineering Lead.
- Freshness: within 30 days of launch.
- Attestation: `attestations/operational-readiness/per-tenant/p18-cross-tenant-negative-tenant-<id>.md`.

**Item P-19: Cross-tenant data-mixing canary running.**
- Test ID: `infrastructure/canary/tenant-isolation-canary.test.ts` (the canary itself; not a one-time test).
- Environment: production.
- Pass threshold: canary running at 5-min cadence; zero contamination detected; canary follows containment per § Sub-decision 4 (synthetic_canary table + 30-min TTL + SYNTH- ID space + exclusion-by-table + pause-on-deploy).
- Tenant scope: per-tenant (separate canary pair per tenant).
- Owner: SRE Lead.
- Freshness: ongoing post-launch (5-min cadence); pre-launch readiness = canary operational + zero contamination over 7-day staging soak.
- Attestation: `attestations/operational-readiness/per-tenant/p19-canary-tenant-<id>.md` (rolling attestation; updated weekly).

---

**Total per-tenant items: 19** (P-1 through P-19). Every item required per tenant before that tenant goes live; Compliance Officer + SRE Lead + Country Lead joint sign-off references this catalog at the tenant launch ceremony.

---

## 5. Document control

**v0.1** (2026-05-19) — Initial catalog. Companion to Operational Readiness Tracker v1.5 → v1.6 amendment (Sprint 17). Pre-Codex-pre-ratification.

— Claude (Opus 4.7, 1M context), v1-6-evidence-rubric-catalog v0.1 DRAFT authored 2026-05-19 to close Sprint 17 R2 HIGH-1 finding (missing evidence-rubric catalog referenced from amendment).
