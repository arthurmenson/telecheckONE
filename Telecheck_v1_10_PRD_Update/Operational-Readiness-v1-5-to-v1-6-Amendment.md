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

**Decision shape:** the following items are added to the canonical pre-launch infrastructure checklist (current v1.5 has ~50 items; v1.6 adds these 14):

**F-4 Deploy Runbook (Sprint 5) integration:**

- [ ] F-4 deploy pipeline implemented per Sprint 5 runbook (canary stages + invariant probes + dual-control authorization checklist + migration-failure recovery branch).
- [ ] Per-canary invariant probes (I-019 / I-023 / cache / service-health) wired to PagerDuty with the canonical per-probe freshness SLA table per Sprint 5 R2 closure.
- [ ] Deploy-event correlation with SIEM (per SIEM §8 deploy-event-correlation) verified end-to-end on a test deployment.

**Cold-DR Runbook (Sprint 7) integration:**

- [ ] Multi-region ACK channel (DynamoDB Global Tables OR equivalent per Cold-DR OQ7) provisioned + canonical topology verified.
- [ ] Pre-failover canary decrypts (per Sprint 13 §3.1) executable in test environment.
- [ ] Three-state per-device obligation model implemented + verified via simulated DR drill.
- [ ] Step 14.5 I-019 fallback replay verified against synthetic offline-device cohort.
- [ ] Tenant-routing gate (Step 11.5 + 12.5) verified per tenant for day-1 launch tenants.

**KMS Architecture (Sprint 13) integration:**

- [ ] Per-tenant CMK provisioned with canonical IaC module + multi-region replica policy verified drift-free.
- [ ] STS session-tag binding (`tenant-id`) enforced via assume-role trust policies; confused-deputy test passes.
- [ ] Break-glass IAM role provisioned with all 5 per-tag Explicit Deny statements (per Sprint 13 R3 closure) + HSM-backed approver signing keys provisioned for CTO + Compliance Officer + Incident Commander.
- [ ] Versioned DEK keyring populated for each data class per tenant; reader-fallback rule integration-tested.
- [ ] `kms_residency_policy` CCR key value verified per tenant (`us_with_dr_fallback` for both Telecheck-US + Telecheck-Ghana per ADR-026).

**Notification Spec v1.2 (Sprint 16) integration:**

- [ ] Per-tenant SMS provider configured: Twilio (Telecheck-US) + Africa's Talking (Telecheck-Ghana); Vonage fallback configured for both.
- [ ] Crisis-notification cross-channel dispatch verified end-to-end (push + SMS + email) via test crisis-signal injection.
- [ ] Dual-bucket rate-limit reservation (90% routine + 10% reserved crisis) configured per provider per tenant.

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

**Crisis-detection chaos drills (NEW per Sprint 9 + Sprint 16 integration):**

| Cadence | Drill scope | Required attestation |
|---|---|---|
| Monthly | I-019 always-on detector: inject crisis-message into test patient's Mode 1 conversation; verify detector fires within 500ms p99 + audit chain + cross-channel notification dispatched | Clinical Lead + SRE attestation |
| Monthly | Crisis-notification cross-channel: simulate primary SMS provider outage; verify Vonage fallback fires per Sprint 16 §3 SD3 within latency budget | SRE attestation |
| Monthly | Crisis-notification undeliverable escalation: simulate all 4 channels failing for a test patient; verify Cat A `crisis_undeliverable_5min` + P0 PagerDuty fires within 5min SLA | Clinical Lead + SRE attestation |

**Quarterly + monthly drill failures trigger:** P0 incident review; pre-launch checklist item rolled back; remediation tracking until drill passes; gating effect on any deploy/release until resolved.

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

---

— Claude (Opus 4.7, 1M context), Operational Readiness Tracker v1.5 → v1.6 amendment v0.1 DRAFT authored 2026-05-19 under "continue 24 hrs / no more resting" autonomous-work authorization. Sprint 17 of the 24h-loop work plan. Track 5 spec-corpus deliverable. Integrates Sprints 5/6/7/13/16 operations specs + adds DR + crisis-chaos drill cadences + per-tenant launch-readiness sub-checklist. Companion to all Sprint 5-16 deliverables.
