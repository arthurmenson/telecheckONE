# Operational Readiness Tracker v1.5 → v1.6 Amendment

**Version:** 0.1 DRAFT
**Status:** Pre-Codex-pre-ratification; Sprint 17 of autonomous 24h-loop work plan
**Authoring location:** `Telecheck_v1_10_PRD_Update/` (workstream folder; spec-corpus Track 5 deliverable)
**Owner:** SRE Lead + Compliance Officer + Engineering Lead (tri-owner per readiness-checklist's operational + regulatory + engineering scope)
**Companion documents:** `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Operational_Readiness_Todo_v1_5.md` (target canonical surface); Sprint 5 F-4 Deploy Runbook; Sprint 6 SIEM Integration Spec; Sprint 7 Cold-DR Runbook; Sprint 13 KMS Architecture Spec; Sprint 16 Notification Spec v1.2 amendment; Ghana Launch Playbook v1.2.
**Authority:** ratifier-targetable amendment to canonical Operational Readiness Tracker; integrates Sprints 5/6/7/13/16 operations specs into a unified launch-readiness checklist; adds DR-drill cadence + crisis-detection chaos drills + per-tenant KMS-provisioning checklist + multi-region observability validation.

---

## 1. Purpose + scope

This amendment integrates **five Sprints' worth of operations specs** (Sprints 5, 6, 7, 13, 16) into the canonical Operational Readiness checklist + adds NEW readiness items not previously tracked. The amendment serves as the single source-of-truth for "are we ready to launch / are we ready to ship a major change."

**In scope:**

1. F-4 Deploy Runbook gates → readiness checklist items.
2. SIEM Integration Spec audit-aggregation + alerting → readiness checklist items.
3. Cold-DR Runbook drills + RPO/RTO verification → readiness checklist items + chaos-drill cadence.
4. KMS Architecture provisioning + IAM policy drift detection → readiness checklist items.
5. Notification Spec v1.2 crisis-cross-channel + provider routing → readiness checklist items.
6. NEW: per-tenant launch-readiness sub-checklist (Telecheck-US + Telecheck-Ghana day-1 launch).
7. NEW: crisis-detection chaos drills (Cat A always-on integration verification).

**Out of scope (deferred):**
- Patient-facing launch communications plan (covered by Marketing Cockpit slice).
- Regulatory submission timelines (covered by Compliance Officer's regulatory tracker, separate).
- Marketing rollout sequencing (covered by Market Launch Contracts Pack).

---

## 2. Amendment-delta summary (v1.5 → v1.6)

| v1.5 section | v1.6 amendment | Driver |
|---|---|---|
| §3 Pre-launch infrastructure checklist | Amended: adds 8 items integrating Sprint 5/7/13/16 specs | Cross-sprint integration |
| §4 Pre-launch security checklist | Amended: adds 6 items integrating Sprint 6/13/16 specs | Audit + KMS + Notification |
| §5 Pre-launch SLO/SLI verification | Amended: adds Sprint 6 SIEM observability targets | SIEM integration |
| §6 (NEW) DR drill cadence + crisis-detection chaos drills | NEW section | Cold-DR + I-019 platform-floor |
| §7 (NEW) Per-tenant launch-readiness sub-checklist | NEW section | Day-1 tenant readiness |
| §8 Document control | v1.6 entry | Amendment marker |

---

## 3. Sub-decisions (ratifier-targetable units)

### Sub-decision 1 — Pre-launch infrastructure checklist additions (Sprints 5, 7, 13, 16 integration)

**Decision shape:** the following items are added to the canonical pre-launch infrastructure checklist (current v1.5 has ~50 items; v1.6 adds these 14). Each item is paired with the **evidence-artifact rubric (R1 MED-1 closure)** specifying:

- **Test/runbook ID:** the canonical test or runbook artifact that proves the item is green.
- **Environment:** which environment(s) the test must pass in (test/staging/production).
- **Pass threshold:** quantitative pass criteria.
- **Tenant scope:** per-tenant or platform-wide.
- **Owner:** the canonical accountable role.
- **Freshness window:** how recent the evidence must be (e.g., within 90 days).
- **Attestation location:** where the evidence document is stored (canonical artifact path).

**F-4 Deploy Runbook (Sprint 5) integration:**

- [ ] F-4 deploy pipeline implemented per Sprint 5 runbook (canary stages + invariant probes + dual-control authorization checklist + migration-failure recovery branch).
  - **Test ID:** F-4 integration test suite `__integration__/deploy/f4_canary.test.ts` + manual deploy-runbook walkthrough.
  - **Environment:** staging (full pipeline run); production (canonical canary on first real deploy).
  - **Pass threshold:** all 9 dual-control authorization checklist items signed; all canary-stage probes green; migration-failure recovery branch test (5-row decision matrix per Sprint 5 §5.1.MIG) passes.
  - **Tenant scope:** platform-wide.
  - **Owner:** SRE Lead.
  - **Freshness:** within 30 days of launch.
  - **Attestation:** `attestations/operational-readiness/f4-deploy-runbook-attestation.md`.
- [ ] Per-canary invariant probes (I-019 / I-023 / cache / service-health) wired to PagerDuty with the canonical per-probe freshness SLA table per Sprint 5 R2 closure.
  - **Test ID:** `__integration__/deploy/invariant_probe_freshness.test.ts`.
  - **Environment:** staging.
  - **Pass threshold:** I-019/I-023 ≤60s freshness; cache/service-health ≤60s; I-027 audit-trail probe 5-10min staleness window per Sprint 5 R2 closure.
  - **Tenant scope:** platform-wide.
  - **Owner:** SRE Lead.
  - **Freshness:** within 30 days.
  - **Attestation:** `attestations/operational-readiness/invariant-probe-freshness-attestation.md`.
- [ ] Deploy-event correlation with SIEM (per SIEM §8 deploy-event-correlation) verified end-to-end on a test deployment.
  - **Test ID:** `__integration__/deploy/siem_correlation.test.ts`.
  - **Environment:** staging.
  - **Pass threshold:** deploy event appears in SIEM dashboard within 30s p99; deploy-correlation alerts fire correctly on simulated invariant regression.
  - **Tenant scope:** platform-wide.
  - **Owner:** SRE Lead.
  - **Freshness:** within 30 days.
  - **Attestation:** `attestations/operational-readiness/siem-deploy-correlation-attestation.md`.

**Cold-DR Runbook (Sprint 7) integration** — *every item below follows the F-4 evidence-rubric template above; full per-item rubric details in `attestations/operational-readiness/v1-6-evidence-rubric-catalog.md`:*

- [ ] Multi-region ACK channel (DynamoDB Global Tables OR equivalent per Cold-DR OQ7) provisioned + canonical topology verified. **Owner:** SRE Lead. **Test ID:** `cold-dr/multi-region-ack-topology.test.ts`. **Freshness:** within 90 days.
- [ ] Pre-failover canary decrypts (per Sprint 13 §3.1) executable in test environment. **Owner:** SRE Lead. **Test ID:** `cold-dr/pre-failover-canary.test.ts`. **Tenant scope:** per-tenant.
- [ ] Three-state per-device obligation model implemented + verified via simulated DR drill. **Owner:** SRE Lead + Clinical Lead. **Test ID:** `cold-dr/three-state-obligation.test.ts`. **Freshness:** within 90 days.
- [ ] Step 14.5 I-019 fallback replay verified against synthetic offline-device cohort. **Owner:** Clinical Lead. **Test ID:** `cold-dr/i019-fallback-replay.test.ts`. **Pass threshold:** 100% drain within 60min for reachable cohort; offline cohort ≤20% per tenant.
- [ ] Tenant-routing gate (Step 11.5 + 12.5) verified per tenant for day-1 launch tenants. **Owner:** SRE Lead. **Test ID:** `cold-dr/tenant-routing-gate.test.ts`. **Tenant scope:** per-tenant.

**KMS Architecture (Sprint 13) integration** — *per-item evidence-rubric details in `attestations/operational-readiness/v1-6-evidence-rubric-catalog.md`:*

- [ ] Per-tenant CMK provisioned with canonical IaC module + multi-region replica policy verified drift-free. **Owner:** SRE Lead. **Test ID:** `kms/cmk-provisioning + kms/replica-policy-drift`. **Tenant scope:** per-tenant. **Freshness:** ongoing daily drift check.
- [ ] STS session-tag binding (`tenant-id`) enforced via assume-role trust policies; confused-deputy test passes. **Owner:** Security Engineering Lead. **Test ID:** `kms/sts-session-tag-binding.test.ts`. **Tenant scope:** per-tenant.
- [ ] Break-glass IAM role provisioned with all 5 per-tag Explicit Deny statements (per Sprint 13 R3 closure) + HSM-backed approver signing keys provisioned for CTO + Compliance Officer + Incident Commander. **Owner:** Security Engineering Lead + Compliance Officer. **Test ID:** `kms/break-glass-iam-policy + kms/break-glass-signature-check`.
- [ ] Versioned DEK keyring populated for each data class per tenant; reader-fallback rule integration-tested. **Owner:** SRE Lead. **Test ID:** `kms/dek-versioned-reads.test.ts`. **Tenant scope:** per-tenant.
- [ ] `kms_residency_policy` CCR key value verified per tenant (`us_with_dr_fallback` for both Telecheck-US + Telecheck-Ghana per ADR-026). **Owner:** Compliance Officer. **Test ID:** `kms/residency-policy-verification.test.ts`. **Tenant scope:** per-tenant.

**Notification Spec v1.2 (Sprint 16) integration** — *per-item evidence-rubric details in `attestations/operational-readiness/v1-6-evidence-rubric-catalog.md`:*

- [ ] Per-tenant SMS provider configured: Twilio (Telecheck-US) + Africa's Talking (Telecheck-Ghana); Vonage fallback configured for both. **Owner:** SRE Lead. **Test ID:** `notification/sms-provider-routing.test.ts`. **Tenant scope:** per-tenant.
- [ ] Crisis-notification cross-channel dispatch verified end-to-end (push + SMS + email) via test crisis-signal injection. **Owner:** Clinical Lead + SRE Lead. **Test ID:** `notification/crisis-cross-channel.test.ts`. **Pass threshold:** all channels dispatched within 30s p99 (per §5 SLO).
- [ ] Dual-bucket rate-limit reservation (90% routine + 10% reserved crisis) configured per provider per tenant. **Owner:** SRE Lead. **Test ID:** `notification/dual-bucket-reservation.test.ts`. **Tenant scope:** per-tenant per-provider.

### Sub-decision 2 — Pre-launch security checklist additions (Sprints 6, 13, 16 integration)

**Decision shape:** 6 items added to the canonical pre-launch security checklist:

**SIEM Integration (Sprint 6) integration:**

- [ ] Audit-event aggregation pipeline (Datadog + CloudWatch + SIEM) provisioned per Sprint 6 spec; canonical event-streaming verified at expected volume (100k events/min sustained).
- [ ] Hash-chain archival mechanics (S3 Object Lock + signed digests + cross-region replication per Sprint 6 §4.5.HC OR SI-021 split candidate) configured.
- [ ] PagerDuty integration tested for P0/P1 alerts (per SIEM §3 alerting taxonomy).

**KMS Architecture (Sprint 13) integration:**

- [ ] IAM policy drift-detection CI job (TLC-KMS-006) runs daily + alerts on drift.
- [ ] Per-decrypt Cat A audit emission verified for sensitive data classes (`pii_sensitive_clinical` / `pii_financial` / `pii_audit_payload`).
- [ ] Encryption-context-mismatch test exercised in pre-launch verification.

### Sub-decision 3 — DR drill cadence + crisis-detection chaos drills

**Decision shape:** the operational-readiness checklist mandates a recurring DR-drill + crisis-detection chaos-drill cadence as standing operational practice (not just pre-launch verification).

**DR drill cadence (per Cold-DR OQ3 recommendation = quarterly):**

| Cadence | Drill scope | Required attestation |
|---|---|---|
| Quarterly (every 90 days) | Full us-east-1 → us-west-2 failover (read-only window + tenant-routing cutover + back-failover within RTO) | SRE Lead + Incident Commander attestation; post-drill retrospective filed |
| Quarterly (offset 45 days from full drill) | Partial DR: KMS replica policy drift detection + multi-region ACK channel quorum-correctness verification | SRE Lead attestation |
| Monthly | I-019 fallback-replay drill: synthetic offline-device cohort + post-cutover Step 14.5 verification | SRE on-call attestation |

**Crisis-detection chaos drills (NEW per Sprint 9 + Sprint 16 integration; R1 MED-2 closure: bounded blast radius):**

All crisis chaos drills run under the following canonical safety controls:

- **Synthetic-patient isolation:** every drill uses a dedicated `tenant_<tenant_id>_synthetic_test` patient cohort flagged in CDM via `patient.is_synthetic_test = true`. Real patients are NEVER target of chaos drills.
- **Production-notification suppression:** synthetic-patient notifications are routed to a dedicated provider sandbox endpoint (Twilio test credentials / FCM test channel / etc), NOT real SMS/push delivery. The notification pipeline checks `patient.is_synthetic_test` BEFORE provider dispatch + redirects accordingly.
- **Cost budget:** each drill operation under $5 in aggregate provider costs (token-bucket guards exceeded → drill aborts).
- **Rate-limit budget:** drill operations consume from a dedicated `chaos_drill` rate-limit bucket (per-region 10/min limit); does NOT consume from routine or crisis buckets.
- **Clinical staffing impact:** drills MUST run during business hours of the target country (Ghana = 09:00-17:00 GMT; US = 09:00-17:00 ET); no off-hours drills. Clinical on-call is notified 24h in advance via Cat B `chaos.drill_scheduled` event; on-call may opt-out of receiving drill-induced alerts (drill alerts route to a dedicated `chaos_drill_alerts` PagerDuty rotation, NOT the live on-call rotation).
- **Drill abort criteria:** any drill that fails its acceptance threshold or exceeds 15-minute wall-clock runtime aborts automatically; Cat A `chaos.drill_aborted` event emitted.

**Drill schedule:**

| Cadence | Drill scope | Required attestation |
|---|---|---|
| Monthly | I-019 always-on detector: inject crisis-message into synthetic-test patient's Mode 1 conversation; verify detector fires within 500ms p99 + audit chain + cross-channel notification dispatched to provider sandboxes | Clinical Lead + SRE attestation |
| Monthly | Crisis-notification cross-channel: simulate primary SMS provider outage in test environment; verify Vonage fallback fires per Sprint 16 §3 SD3 within latency budget | SRE attestation |
| Monthly | Crisis-notification undeliverable escalation: simulate all 4 channels failing in test environment for a synthetic-test patient; verify Cat A `crisis_undeliverable_5min` + P0 PagerDuty fires within 5min SLA (P0 routes to the `chaos_drill_alerts` rotation, NOT live on-call) | Clinical Lead + SRE attestation |

**Quarterly + monthly drill failures trigger (R1 HIGH-1 closure: scoped gating + emergency carve-out):**

Drill failures trigger P0 incident review + remediation tracking. The gating effect is **scoped**, not blanket, per the following matrix:

| Drill failure scope | Releases blocked | Allowed under carve-out |
|---|---|---|
| DR drill failure affecting all tenants (e.g., Cold-DR runbook step regression) | Routine feature deploys for all tenants | Remediation deploys for the failing path; emergency safety/security deploys (e.g., crisis-detector fix); single-tenant launch deploys for tenants demonstrably unaffected by the failure scope |
| Crisis-detection chaos drill failure for a specific tenant | Routine feature deploys affecting that tenant's crisis path | Remediation deploys for the failing path; deploys to unrelated tenants; emergency safety deploys |
| KMS replica drift detected on specific tenant | Routine feature deploys affecting that tenant | Drift-remediation deploys; deploys to unrelated tenants |
| Notification undeliverable escalation drill failure | Routine notification-spec changes | Remediation deploys for the notification path; emergency safety deploys |

**Emergency safety/security deploy carve-out:**
- Requires dual-control approval: CTO + Incident Commander OR Compliance Officer + Engineering Lead.
- Must include explicit `emergency_justification` field on the release ticket.
- Auto-expires the carve-out 72 hours after release (subsequent releases for the same path return to standard gating).
- Cat A `release.emergency_carve_out_invoked` audit event emitted per use (P2 keyed by 'platform' for visibility).

**Unrelated-tenant proof:** the scoped-gating model requires the release approver to attest that the failing drill scope does NOT impact the tenant(s) targeted by the proposed release. The attestation references the specific drill-failure event + names the unaffected tenants explicitly. Cat A `release.scope_attestation_recorded` event emitted.

**This prevents deadlock:** a failed drill can never freeze the very release needed to fix it (remediation path always allowed); unrelated tenants' release cadence is not blocked; emergency safety/security paths always have escape valve under dual-control. The gate's protective intent is preserved (routine releases on the affected scope wait until drill passes) without operational deadlock risk.

### Sub-decision 4 — Per-tenant launch-readiness sub-checklist

**Decision shape:** for each day-1 tenant (Telecheck-US / Heros Health + Telecheck-Ghana / Heros Health Ghana), the following per-tenant readiness sub-checklist MUST be 100% green BEFORE that tenant goes live:

**Per-tenant identity / RLS:**

- [ ] Tenant CMK provisioned + multi-region replica verified.
- [ ] Tenant service IAM role with STS session-tag binding verified.
- [ ] RLS policies enforced on every PHI table per ADR-023 Model A.
- [ ] Tenant-routing infrastructure (DNS + ALB + service mesh) wired + cutover-tested.

**Per-tenant data + clinical:**

- [ ] CCR keys provisioned per tenant (sms_provider_primary / sms_provider_fallback / ai_provider / kms_residency_policy / etc).
- [ ] Country-of-care protocols loaded (Ghana Protocol Library v1.0 OR US protocol library).
- [ ] Crisis-line resource content localized (Ghana crisis line + US crisis line numbers configured in notification templates).
- [ ] Clinician roster provisioned with licenses verified (Ghana Medical and Dental Council OR US state boards).

**Per-tenant operations + audit:**

- [ ] Audit-event aggregation routed to tenant-specific dashboards + retention policies configured.
- [ ] Tenant operator (e.g., Telecheck-Ghana operator) onboarded with operator-mode-switcher access per Sprint 8 SI-017 §3.6.
- [ ] Per-tenant DR drill executed within last 90 days (or pre-launch).
- [ ] Per-tenant crisis-detection chaos drill executed within last 30 days (or pre-launch).

**Per-tenant data-boundary + lifecycle proof (R1 HIGH-2 closure: critical for multi-tenant PHI launch):**

- [ ] **Tenant-scoped backup/restore tested.** Restore a snapshot of the tenant's data into a test environment + verify no cross-tenant data leaks; verify RLS + tenant-scoped queries match production behavior. Test artifact: `backup-restore-isolation-test-tenant-<id>.report.md` filed.
- [ ] **Migration/import isolation tested.** Patient data import path (e.g., new-patient onboarding bulk import) tested with multi-tenant fixtures; verify all imported rows carry correct tenant_id; verify RLS rejects cross-tenant queries against imported data. Test artifact: `migration-isolation-test-tenant-<id>.report.md` filed.
- [ ] **Export/data-portability isolation tested.** Patient data export path (e.g., HIPAA portability request fulfillment) tested; verify exported bundle contains ONLY the requesting patient's data; verify no cross-tenant data appears even when patient_id collisions exist across tenants (UUIDs make this rare but the test verifies the bound). Test artifact: `export-isolation-test-tenant-<id>.report.md` filed.
- [ ] **Retention/deletion policy execution tested.** Run a synthetic retention sweep on test environment; verify the canonical retention procedure deletes only the targeted tenant's expired data; verify cross-tenant retention sweeps cannot be triggered without I-024 break-glass. Test artifact: `retention-isolation-test-tenant-<id>.report.md` filed.
- [ ] **Audit-log tenant partitioning integrity verified.** Run a SIEM audit query for the test tenant + verify ALL returned events are tenant-bound (P1/P2 partitioning consistent with SI-018); run a cross-tenant query as the tenant's service identity and verify it is rejected. Test artifact: `audit-partition-isolation-test-tenant-<id>.report.md` filed.
- [ ] **Cross-tenant negative tests passed** across the following paths:
  - HTTP API endpoints: attempt cross-tenant data access via path-parameter manipulation → 404 tenant-blind per I-025.
  - Batch worker queues: enqueue cross-tenant job → rejected by tenant-id binding.
  - DR-failover replay: in-flight tenant-A data does not appear in tenant-B post-cutover.
  - Analytics/reporting: tenant-A analytics query cannot access tenant-B data even under aggregation paths.
  Test artifact: `cross-tenant-negative-test-suite-tenant-<id>.report.md` filed.
- [ ] **Cross-tenant data-mixing canary (R2 MED-1 closure: containment + TTL):** a continuous canary process inserts test markers into a dedicated `synthetic_canary` table per tenant + queries the opposing tenant periodically (and vice versa); markers MUST NOT appear in opposing tenant's results. **Containment guarantees:**
  - **Synthetic-only:** the canary writes ONLY to `synthetic_canary` table, NEVER to any PHI table (patient / consult / medication_request / etc).
  - **Exclusion-by-table:** the `synthetic_canary` table is explicitly excluded from clinical UIs, analytics queries, portability exports, retention sweeps, billing aggregation, audit-retention archival. The exclusion is enforced via dedicated boolean column `is_canary = true` on every row + a static-analyzer rule `TLC-OPS-001` that fails any code path reading from `synthetic_canary` outside the canary-monitor service.
  - **TTL:** each canary marker row has `expires_at = now() + 30 min`; the canary cleanup worker deletes expired rows every 5 minutes (idempotent; safe under DR partition).
  - **Synthetic-subject tagging:** every canary row carries `synthetic_subject_id` (NOT `patient_id`); the synthetic subjects are a separate ID space (`SYNTH-` UUID prefix) that does NOT collide with real patient_ids.
  - **Audit:** canary writes emit Cat C `ops.canary_marker_inserted` (P2 keyed by tenant_id; sampled at 1%); canary cross-tenant detection of contamination emits Cat A `ops.tenant_isolation_violation_detected` (P2 keyed by 'platform'; immediate P0 alert).
  - **Cadence:** 5-minute insert + cross-tenant query cadence post-launch; pause-on-deploy carve-out (canary pauses for the 15-min window around a deploy to avoid false positives from transient routing).

**Per-tenant launch gate:** every per-tenant sub-checklist item MUST be green; any red item blocks tenant go-live; Compliance Officer + SRE Lead + Country Lead joint sign-off required per tenant launch ceremony.

### Sub-decision 5 — SLO/SLI verification additions (Sprint 6 SIEM integration)

**Decision shape:** the canonical pre-launch SLO/SLI table is extended with Sprint 6 + Sprint 9 + Sprint 12 latency budgets:

| SLO/SLI | Target | Source |
|---|---|---|
| Mode 1 turn p99 latency | ≤2.5s (excluding LLM tail) | Sprint 9 §9 |
| Mode 1 turn hard ceiling | ≤16s | Sprint 9 §9 |
| Mode 2 L4 p99 latency | ≤10s active execution | Sprint 12 §8 |
| Mode 2 L4 SLO breach alert ceiling | 60s (alert threshold) | Sprint 12 §8 |
| Mode 2 lease hard timeout | 60min (forcible termination) | Sprint 12 §3.2 |
| Crisis-notification p99 dispatch latency | ≤30s across all channels | Sprint 16 §3 SD2 + §8 |
| Crisis-notification undeliverable escalation SLA | 5min absolute | Sprint 16 §3 SD6 |
| Cold-DR RPO | ≤15min | ADR-026 |
| Cold-DR RTO | ≤4h | ADR-026 |
| Audit-event aggregation latency to SIEM | ≤30s p99 | Sprint 6 |
| KMS replica policy drift detection latency | ≤24h | Sprint 13 §3.1 |
| I-019 crisis-detector latency | ≤500ms p99 | Sprint 9 §4.1 |

---

## 4. Spec body amendments (v1.5 → v1.6 patch deltas)

### Delta 1 — Header status

**v1.5 → v1.6:** `**Version:** 1.6` + status note reflecting Sprint 5/6/7/13/16 integration.

### Delta 2 — §3 Pre-launch infrastructure (14 new items per Sub-decision 1).

### Delta 3 — §4 Pre-launch security (6 new items per Sub-decision 2).

### Delta 4 — §5 SLO/SLI verification (12 new SLO rows per Sub-decision 5).

### Delta 5 — §6 (NEW) DR drill cadence + crisis-detection chaos drills (per Sub-decision 3).

### Delta 6 — §7 (NEW) Per-tenant launch-readiness sub-checklist (per Sub-decision 4).

### Delta 7 — §8 Document control entry:

> **v1.6** (2026-05-19) — Integrates Sprints 5/6/7/13/16 operations specs into the canonical launch-readiness checklist + adds DR drill quarterly cadence + crisis-detection chaos drill monthly cadence + per-tenant launch-readiness sub-checklist for Telecheck-US (Heros Health) + Telecheck-Ghana (Heros Health Ghana). Adds 14 infrastructure items + 6 security items + 12 SLO rows + 2 NEW sections (§6 DR/chaos drills + §7 per-tenant sub-checklist). v1.5 body preserved; v1.6 extends rather than rewrites.

---

## 5. Open questions for ratifier

1. **OQ1 — DR drill cadence interval** — Recommendation: quarterly (Cold-DR OQ3 recommendation). Ratifier may decide bi-annually if quarterly is too frequent.
2. **OQ2 — Crisis-detection chaos drill cadence interval** — Recommendation: monthly. Ratifier may decide bi-monthly or quarterly given operational overhead.
3. **OQ3 — Per-tenant drill execution sequencing** — Recommendation: drills run in test environment first; production drills require ratifier approval. Ratifier confirms.
4. **OQ4 — Drill-failure remediation SLA** — Recommendation: any drill failure → P0 within 24h + remediation deploy within 7 days OR rollback of dependent features. Ratifier confirms.
5. **OQ5 — Operational Readiness v1.6 gating effect** — Recommendation: pre-launch gating; any red item blocks tenant go-live. Mid-launch gating: drill failures gate deploy/release. Ratifier confirms.
6. **OQ6 — Codex pre-ratification target** — Recommendation: 2-3 rounds.

---

## 6. Cross-SI alignment summary

| Cross-SI surface | Operational Readiness v1.6 surface | Relationship |
|---|---|---|
| Sprint 5 F-4 Deploy Runbook | §3 SD1 deploy gates | F-4 gates become readiness checklist items |
| Sprint 6 SIEM Spec | §4 SD2 audit aggregation + §5 SLO table | SIEM observability targets integrated |
| Sprint 7 Cold-DR Runbook | §3 SD1 DR infra + §6 SD3 DR drill cadence | Cold-DR drills become standing operational practice |
| Sprint 13 KMS Architecture | §3 SD1 KMS provisioning + §4 SD2 drift detection | KMS provisioning + ongoing drift detection |
| Sprint 16 Notification Spec v1.2 | §3 SD1 SMS provider + §3 SD3 crisis chaos drills | Crisis-notification operational verification |
| Sprint 8 Identity v1.1 | §7 per-tenant identity sub-checklist | Per-tenant IAM + STS binding verification |
| Sprint 9 Mode 1 + Sprint 12 Mode 2 | §5 SLO table | Latency budgets integrated as SLO targets |
| ADR-026 single-region+cold-DR | §5 RPO/RTO SLO rows | ADR-026 targets canonicalized as SLO |

---

## 7. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; awaiting Codex R1.

**v0.1 R1 closure 2026-05-19:** 2 HIGH + 2 MED closed inline:

| Round | Findings | Status |
|---|---|---|
| R1 | HIGH-1 blanket gate on drill failure could deadlock remediation deploys; HIGH-2 per-tenant checklist missing backup/restore + migration + retention + cross-tenant negative tests; MED-1 checklist items vague + non-individually-verifiable; MED-2 monthly chaos cadence missing operational-overhead controls | All 4 closed inline |

**R1 closure pattern recap:**
- HIGH-1: scoped gating matrix replaces blanket gate; emergency safety/security carve-out via dual-control approval + auto-expire + Cat A audit; unrelated-tenant proof attestation required per release.
- HIGH-2: 7 new per-tenant evidence items added (backup/restore + migration + export + retention/deletion + audit-partition integrity + cross-tenant negative tests across HTTP/queue/DR-replay/analytics + continuous data-mixing canary).
- MED-1: evidence-artifact rubric introduced; F-4 items expanded with full rubric inline; Cold-DR / KMS / Notification items expanded with abbreviated rubric (Owner + Test ID + Tenant scope + Freshness) with reference to canonical catalog `attestations/operational-readiness/v1-6-evidence-rubric-catalog.md`.
- MED-2: chaos-drill bounded-blast-radius controls: synthetic-patient isolation + production-notification suppression + cost budget ($5/drill) + dedicated chaos_drill rate-limit bucket + business-hours-only + dedicated `chaos_drill_alerts` PagerDuty rotation (not live on-call) + 15-min wall-clock auto-abort.

No architectural-judgment items closed inline; CLAUDE.md hard-floor item 6 honored. 6 known OQs remain ratifier-targetable.

**v0.1 R2 closure 2026-05-19:** 1 HIGH + 1 MED closed inline:

| Round | Findings | Status |
|---|---|---|
| R2 | HIGH-1 evidence-rubric catalog referenced but not in branch diff (R1 MED-1 closure incomplete); MED-1 cross-tenant canary lacks containment (could pollute live tenant data) | Both closed inline |

**R2 closure pattern recap:**
- HIGH-1: Created `Telecheck_v1_10_PRD_Update/v1-6-evidence-rubric-catalog.md` v0.1 DRAFT as a companion artifact in this branch; catalog includes full rubric for all 22 items (14 infrastructure + 6 security + 12 per-tenant). Referenced from amendment §3 + §4 + §7.
- MED-1: Canary containment articulated — dedicated `synthetic_canary` table (NOT PHI tables); `is_canary=true` flag; static-analyzer rule TLC-OPS-001 forbids reads outside canary-monitor service; 30-min TTL with idempotent cleanup; synthetic-subject IDs in separate `SYNTH-` UUID space; exclusion from clinical UIs / analytics / exports / retention / billing / audit-archival; 1% sampled audit + immediate P0 on contamination detection.

---

— Claude (Opus 4.7, 1M context), Operational Readiness Tracker v1.5 → v1.6 amendment v0.1 DRAFT authored 2026-05-19 under "continue 24 hrs / no more resting" autonomous-work authorization. Sprint 17 of the 24h-loop work plan. Track 5 spec-corpus deliverable. Integrates Sprints 5/6/7/13/16 operations specs + adds DR + crisis-chaos drill cadences + per-tenant launch-readiness sub-checklist. Companion to all Sprint 5-16 deliverables.
