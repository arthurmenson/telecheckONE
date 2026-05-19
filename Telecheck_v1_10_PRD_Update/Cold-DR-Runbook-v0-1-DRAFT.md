# Cold-DR Runbook (us-east-1 → us-west-2 failover)

**Version:** 0.1 DRAFT
**Status:** Pre-Codex-pre-ratification; Track 5 Infra/Ops deliverable per Master Completion Plan §"Track 5 (operates AHEAD of code)"
**Authoring location:** `Telecheck_v1_10_PRD_Update/` (workstream folder; spec-corpus operations deliverable)
**Owner:** SRE Lead + Incident Commander (named per active incident)
**Companion documents:** F-4 Deploy Runbook v0.1 DRAFT, SIEM Integration Spec v0.1 DRAFT, ADR-026 (single-region+cold-DR architecture), Ghana Launch Playbook v1.2, GOVERNANCE_CONTROLS Contracts Pack v5.2
**Authority:** canonical disaster-recovery failover procedure for Telecheck multi-tenant platform.

---

## 1. Purpose + scope

This runbook is the **single-source-of-truth** for executing cold-DR failover from us-east-1 (primary) to us-west-2 (cold DR) per ADR-026 single-region-primary architecture. It is invoked when us-east-1 is unavailable (regional outage, AWS-declared disruption, or chaos drill).

**Scope:** full-stack failover (compute + database + storage + DNS + CDN + KMS + LiveKit + SIEM). Includes back-failover (us-west-2 → us-east-1) procedure when primary recovers.

**Out of scope:** routine maintenance windows (use F-4 deploy runbook); same-region availability issues (handled by service mesh + auto-scaling, not DR failover); non-AWS dependency outages (handled by external service runbooks).

**Audience:**
- Incident Commander (named per active incident; SRE Lead or designated alternate)
- DR Operator (named per failover; not the same human as IC; dual-control per I-015)
- On-call SRE rotation (continuous observation + escalation)
- Communications Lead (tenant + stakeholder comms)

---

## 2. RPO + RTO targets (per ADR-026 canonical posture)

| Target | Value | Source-of-authority |
|---|---|---|
| **RPO** (Recovery Point Objective; max acceptable data loss) | **≤15 minutes** | ADR-026 + RDS snapshot cadence (continuous WAL streaming with logical replication); ≤15 min reflects the worst-case WAL-shipping lag |
| **RTO** (Recovery Time Objective; max acceptable downtime) | **≤4 hours** | ADR-026 cold-DR posture; 4h reflects RDS snapshot restore + S3 cross-region replication validation + DNS cutover + LB reconfig + manifest verification per SIEM Integration Spec §4.5.HC |
| **MTTD** (Mean Time To Detect; outage to failover-decision) | ≤30 minutes | SIEM Integration Spec Sub-decision 3 P0 alerting + on-call escalation |
| **MTTR** (Mean Time To Recover; failover-decision to traffic restored) | ≤3.5 hours | RTO budget minus MTTD |

These targets are operational SLAs, not contractual guarantees. Patient-safety-critical surfaces (crisis detection, emergency information per I-017) MUST be accessible during failover via the canonical I-017 on-device emergency cache (no platform dependency).

---

## 3. Failover trigger criteria (HARD GATES; any one MUST be met for failover declaration)

### 3.1 Hard triggers (automatic failover authorization)

- **AWS-declared us-east-1 regional service event** affecting EKS, RDS, or KMS (one of the three is hard-dependency)
- **Multi-AZ RDS failure in us-east-1** with no within-region recovery path in <2h
- **us-east-1 KMS unavailability** for >30 min (per-tenant KMS keys per ADR-023 are us-east-1-primary; failover required if KMS access fails)
- **EKS control-plane unrecoverable in us-east-1** for >2h

### 3.2 Soft triggers (Incident Commander declaration required)

- **us-east-1 service health degraded** (multiple service P0/P1 alerts simultaneously) with no within-region recovery path in <3h
- **Partial-region failure** affecting critical-path services with no horizontal-scale recovery
- **Chaos drill** (planned, announced 7 days in advance; counts toward RTO measurement)

### 3.3 Trigger NOT permitted as cold-DR rationale

- Routine deploy failure (use F-4 rollback per F-4 Deploy Runbook §5)
- Single-service degradation within us-east-1 (use service-mesh failover; not regional)
- Tenant-specific issues (handled per-tenant; not regional)
- Code bugs or config errors (rollback the change, don't fail over)

---

## 4. Failover procedure

### 4.1 T-0: Failover declaration

**Step 1: Incident Commander declares failover.**

```bash
$ dr-tool declare-failover --incident <id> --ic <github-handle> --trigger <enum>
# Logs declaration with timestamp; pages DR Operator + Communications Lead + secondary SRE
# Emits Cat B audit event dr.failover_declared at SI-018 P2 partition keyed on 'platform' tenant
```

**Step 2: DR Operator acknowledges; dual-control verified.**

DR Operator MUST be a DIFFERENT human from IC per I-015. Acknowledgment within 5 min; otherwise escalation to backup DR Operator + CTO.

**Step 3: Communications Lead initiates tenant comms.**

- Pre-prepared status page update published; canonical message templates per Ghana Launch Playbook v1.2 §Tenant Communications.
- Direct outreach to flagship tenants (Telecheck-US Heros Health + Telecheck-Ghana Heros Health Ghana DBA per Master PRD §17) within 30 min of declaration.

### 4.2 T+0 to T+15: Pre-promotion integrity verification (closes Codex R1 HIGH-1; verification BEFORE promotion, not after)

**Pre-promotion hard gate.** Per R1 HIGH-1 closure: the original draft promoted at Step 6 and ran integrity checks at Steps 7-10 (after promotion + replication-severance). This is reversed — integrity checks now run BEFORE promotion against the read-only replica, so a failed check aborts the failover entirely without leaving the system in an irreversible promoted-with-broken-chain state.

**Step 4: Stop writes to us-east-1 RDS** (if reachable; if not, skip).

```bash
$ dr-tool freeze-primary-writes --session <id>
# Sets all app services to read-only mode; rejects writes with explicit "platform-in-DR-failover" error
# Emits Cat B dr.primary_writes_frozen audit event
```

**Step 5: Verify us-west-2 RDS replica lag.**

```bash
$ dr-tool verify-replica-lag --target us-west-2
# Reports: replica lag in seconds; latest WAL position; estimated data loss window
# Fails if lag > 15 min (RPO breach)
```

**Step 5.5: PRE-PROMOTION integrity verification on the read-only replica (HARD GATE per R1 HIGH-1 closure).**

ALL of the following MUST pass BEFORE Step 6 promotion:

```bash
$ dr-tool pre-promotion-verify --target us-west-2 --read-only
# (a) Schema/extensions/triggers/RLS verification: pg_dump schema diff between us-east-1 (if reachable) and us-west-2 replica; all custom functions present; all triggers active including I-016 + I-013 append-only triggers; all RLS policies enabled per ADR-023; SI-016 semver triggers active; SI-020 form-version analyzer triggers active.
# (b) I-027 audit-chain integrity full-traversal on the read-only replica: every active P1 + P2 partition chain verified from genesis to current head.
# (c) Archived manifest boundary-hash verification per SIEM Integration Spec §4.5.HC: most-recent archived manifest's last-record_hash matches the audit_events table's predecessor-boundary-hash at the WAL position being promoted.
# (d) Multi-region KMS key access spot-check on the replica's auth context (verify that the replica side can decrypt at least 1 sample PHI envelope per tenant cohort without errors).
# (e) Reports each gate's pass/fail with measurement values for retrospective record.
```

**ANY failure of (a)-(d) ABORTS the failover BEFORE Step 6 promotion.** The DR Operator + IC + on-call SRE escalate to: stay in us-east-1 (if reachable) OR declare extended outage + invoke alternate recovery (e.g., point-in-time-recovery from snapshot to a new replica). The read-only replica is NOT promoted with known integrity violations.

**Step 6: Promote us-west-2 RDS replica to primary** (proceeds ONLY after Step 5.5 PASS).

```bash
$ dr-tool promote-replica --target us-west-2 --session <id>
# Promotes the read-replica to a standalone primary; severs replication from us-east-1
# Emits Cat B dr.replica_promoted_to_primary audit event with actual lag at promotion time
```

**Step 7: Verify schema + extension consistency.**

```bash
$ dr-tool verify-schema --target us-west-2
# Runs: pg_dump schema diff between us-east-1 (if reachable) and us-west-2 promoted primary
# Checks: all extensions loaded; all custom functions present; all triggers active; all RLS policies enabled
# Specifically verifies: I-027 audit_events hash chain integrity (latest record_hash + previous_hash continuity)
# Specifically verifies: ai_workflow_handler_registry semver triggers active (per SI-016)
```

### 4.3 T+15 to T+90: Storage + KMS + manifest verification

**Step 8: Verify S3 cross-region replication consistency.**

Per ADR-026 + SIEM Integration Spec §4.5.HC, S3 manifest objects replicate us-east-1 → us-west-2 with Object Lock COMPLIANCE mode. Verification:

```bash
$ dr-tool verify-s3-replication --buckets audit-manifests,phi-encrypted,kms-key-snapshots --target us-west-2
# Lists all objects in each bucket; verifies replication-status = COMPLETED for every object
# Verifies Object Lock retention metadata is preserved on every replicated manifest object
# Verifies manifest signatures (HSM-backed; cross-region key access per multi-region KMS key policy) against the recovery-computed SHA-256 of each manifest's bytes
# Fails if any manifest fails 4-source verification per SIEM §4.5.HC failure-mode coverage matrix
```

**Step 9: Verify KMS key access in us-west-2.**

Per ADR-026, KMS keys are multi-region keys (us-east-1 + us-west-2). Verification:

```bash
$ dr-tool verify-kms-access --target us-west-2 --tenants ALL
# For each active tenant: encrypt-then-decrypt a synthetic payload using the tenant's multi-region key in us-west-2
# Fails if any tenant's key is inaccessible
```

**Step 10: Run I-027 audit-chain integrity verification across promoted primary.**

```bash
$ dr-tool verify-audit-chain --target us-west-2 --tier P1,P2 --partitions ALL
# Traverses every active partition's chain from genesis to current head
# Verifies hash continuity per I-003 + I-027
# Cross-checks live audit-events table against the latest archived manifest's boundary hash per SIEM §4.5.HC
# Fails if any broken chain; triggers P0 + freezes the affected partition
```

### 4.4 T+90 to T+180: DNS + LB + service traffic cutover

**Step 11: Update DNS records to point to us-west-2.**

```bash
$ dr-tool dns-cutover --target us-west-2 --confirm-ic-approver-handles
# Updates Route 53 records for *.heroshealth.com + *.ghana.heroshealth.com + telecheck-app.com to us-west-2 ALB
# TTL on these records is 60s per ADR-026 (low TTL pre-positioned for DR scenarios)
# Verifies DNS propagation via multiple resolvers
```

**Step 11.5: Tenant-routing verification gate BEFORE traffic admission (closes Codex R1 HIGH-2).**

DNS propagation proves DNS records changed; it does NOT prove tenant routing is preserved. Per R1 HIGH-2 closure, the following tenant-routing checks MUST pass BEFORE Step 13 opens traffic:

```bash
$ dr-tool verify-tenant-routing --target us-west-2 --enumerate-all-tenants
# (a) Enumerate canonical tenant domains: heroshealth.com → Telecheck-US; ghana.heroshealth.com → Telecheck-Ghana; any custom-domain mappings per the tenant_custom_domains registry.
# (b) For each tenant domain: send a probe request with the canonical Host header; verify the request resolves to the us-west-2 ALB; verify the ALB listener rules + TLS certificate + host-header routing direct the request to the correct application service + the correct tenant_id is set in the resulting app.tenant_id GUC.
# (c) Cross-tenant isolation probe per F-4 §3.3 Sub-decision: 200 synthetic requests/min across tenant boundaries (tenant_A-authenticated session → tenant_B resources) MUST all receive tenant-blind 404 per I-025.
# (d) Custom-domain certificate validation: every active tenant with a custom domain has a valid TLS cert in us-west-2 (cert manager replication MUST be verified pre-DR; this step validates it took).
# (e) Reports per-tenant routing PASS/FAIL with measurement values.
```

**ANY tenant-routing FAIL before Step 13 BLOCKS traffic admission.** The DR Operator + IC + on-call SRE escalate: investigate the misrouting; do NOT open traffic until all tenants verify PASS.

**Step 12: Bring up app services in us-west-2.**

```bash
$ dr-tool scale-up --target us-west-2 --services ALL
# EKS cluster in us-west-2 scales up from cold (0 replicas) to canonical capacity per Ghana Launch Playbook v1.2 §"Scale Targets"
# Health checks must pass before traffic is admitted
# Per F-4 Deploy Runbook §3.3 service-health probe, missing 2 consecutive intervals = service-not-ready (does NOT promote; differs from F-4 stage promotion)
```

**Step 13: Open traffic incrementally.**

5% → 25% → 50% → 100% over 30 minutes total. Per F-4 Deploy Runbook §3.3 canary-style probing using the canonical canary gates (error rate + p99 latency + I-019/I-023/I-027/cross-tenant-cache/service-health), but with DR-specific thresholds (more relaxed than routine deploy thresholds to account for cold-cache penalty):

| Stage | Traffic % | Min soak | DR error-rate gate | DR latency gate (p99) |
|---|---|---|---|---|
| dr-canary-5pct | 5% | 5 min | < 1.0% | < 3.0× baseline |
| dr-canary-25pct | 25% | 5 min | < 0.5% | < 2.0× baseline |
| dr-canary-50pct | 50% | 5 min | < 0.3% | < 1.5× baseline |
| full | 100% | 15 min | < 0.2% | < 1.3× baseline |

Continuous invariant probes per F-4 §3.3 apply identically (I-019 + I-023 + I-027 + cross-tenant-cache + service-health). I-027 audit-chain integrity probe MUST be GREEN at every stage promotion (per the audit-chain verification job in Step 10).

### 4.5 T+180 to T+240: Post-failover verification + comms

**Step 14: Run full post-failover verification suite.**

```bash
$ dr-tool post-failover-verify --session <id>
# Runs:
#  - Cross-tenant isolation regression on us-west-2
#  - Smoke tests on the 5 pilot-required slices
#  - Compliance dashboard ingestion (SIEM Integration Spec Sub-decision 6) confirms audit pipeline active in us-west-2
#  - Tenant data spot-check (sample 10 tenants; verify their latest records are accessible)
```

**Step 15: Tenant comms update.**

Communications Lead publishes "platform restored in DR region" status page update; direct outreach to flagship tenants; post-incident comms timeline begins.

**Step 16: Mark failover complete.**

```bash
$ dr-tool mark-failover-complete --session <id>
# Emits Cat B dr.failover_completed audit event
# Triggers post-incident retrospective scheduling
```

---

## 5. Back-failover procedure (us-west-2 → us-east-1; idempotent state-machine per R1 MED-1 closure)

Back-failover restores primary-region operation after us-east-1 recovers. Timing: NOT immediate; minimum 7-day soak in us-west-2 before back-failover unless operator + IC + CTO override.

**Per R1 MED-1 closure, back-failover is an explicit state machine with durable session checkpoints. Each step is idempotent + retry-safe. Operators MUST NOT retry by re-running from §4 Step 4 — the canonical retry path is via the dr-tool session checkpoint resume.**

### Back-failover session state machine

States (durable in dr-tool session store):
```
b_initiated → b_health_verified → b_reverse_replication_established →
b_reverse_replication_soaked → b_source_writes_frozen →
b_pre_promotion_verified → b_promoted → b_storage_verified →
b_kms_verified → b_audit_chain_verified → b_dns_cutover_completed →
b_tenant_routing_verified → b_services_scaled →
b_traffic_cutover_completed → b_post_failover_verified →
b_back_failover_completed
```

Each state transition emits a Cat B audit event `dr.back_failover.<state>` at SI-018 P2 partition keyed on `'platform'`. Recovery from interruption resumes from the last successfully-checkpointed state.

**Step B1: `b_initiated → b_health_verified`.** Verify us-east-1 region health.

```bash
$ dr-tool back-failover-step --session <id> --target-state b_health_verified
# All services + RDS + KMS + EKS healthy for ≥48 hours continuous
# AWS has declared the original disruption resolved
# Idempotent: re-running returns the cached health-check result if <1h old
```

**Step B2: `b_health_verified → b_reverse_replication_established`.** Establish replication us-west-2 → us-east-1.

```bash
$ dr-tool back-failover-step --session <id> --target-state b_reverse_replication_established
# Configures us-east-1 RDS as logical replica of us-west-2 primary
# Idempotent: re-running verifies replication is already established + reports lag
# Single-writer assertion: verifies us-west-2 is the SOLE writer (no split-brain)
# Aborts if any us-east-1 write detected since b_initiated (split-brain detected → operator + IC + CTO + Compliance Officer review)
```

**Step B3: `b_reverse_replication_established → b_reverse_replication_soaked`.** 24h replication lag observation window.

Idempotent: re-running checks elapsed time since b_reverse_replication_established; reports remaining wait.

**Steps B4-B14: equivalent to §4 Steps 4-14 with regions swapped (us-west-2 as source; us-east-1 as target).** Each step is idempotent + checkpointed. The §4 pre-promotion integrity gate (Step 5.5) applies: us-east-1 replica MUST PASS schema + I-027 + manifest-boundary verification BEFORE promotion. The §4 tenant-routing gate (Step 11.5) applies: us-east-1 ALB + DNS + tenant routing MUST PASS verification BEFORE traffic admission.

**Step B15: `b_traffic_cutover_completed → b_post_failover_verified`.** Run §4.5 Step 14 post-failover verification.

**Step B16: `b_post_failover_verified → b_back_failover_completed`.** Mark back-failover complete.

```bash
$ dr-tool back-failover-step --session <id> --target-state b_back_failover_completed
# Emits Cat B dr.back_failover_completed audit event
# Triggers post-incident retrospective
# us-east-1 returns to primary; us-west-2 returns to cold-DR posture
# Cross-region replication direction restored (us-east-1 → us-west-2)
```

### Split-brain fencing (R1 MED-1 closure)

Throughout back-failover, the dr-tool enforces a single-writer invariant per session:

- During b_initiated through b_traffic_cutover_completed: us-west-2 is the SOLE writer; any us-east-1 write attempt rejects with `back_failover_split_brain_detected` error + P0 alert + abort.
- After b_traffic_cutover_completed: us-east-1 is the SOLE writer; us-west-2 reverts to read-only replica posture.
- The transition (B14 cutover) is atomic per the dr-tool's write-fence: us-west-2 is frozen to read-only BEFORE us-east-1 begins accepting writes; no overlap window.

### Abort / rollback decision tree

| Failure during back-failover | Action |
|---|---|
| B1-B3 (pre-replication-soak): operator decision is reversible | Abort back-failover; remain in us-west-2 primary; resume B1 after issue resolution |
| B4-B6 (pre-promotion): integrity check fails on us-east-1 replica | Abort; us-west-2 stays primary; investigate replica integrity; do NOT promote |
| B7-B10 (post-promotion, pre-cutover): storage/KMS/audit-chain fails on us-east-1 | Roll back promotion (us-east-1 returns to replica posture); us-west-2 stays primary; investigate |
| B11-B14 (cutover): tenant-routing or traffic-admission fails | Roll back DNS to us-west-2 ALB; us-east-1 returns to replica; investigate |
| B15-B16 (post-cutover verification): post-failover verification fails | Operator + IC + CTO decision: either roll back to us-west-2 OR accept partial-state + open P0 incident |

Each abort path emits Cat B `dr.back_failover_aborted` with reason + last-completed-state.

---

## 6. Communication + audit

All DR events emit Cat B audit events at SI-018 P2 partition keyed on `'platform'` tenant:

- `dr.failover_declared` (with trigger reason)
- `dr.primary_writes_frozen`
- `dr.replica_promoted_to_primary` (with RPO measurement)
- `dr.s3_replication_verified`
- `dr.kms_access_verified`
- `dr.audit_chain_integrity_verified`
- `dr.dns_cutover_completed`
- `dr.service_traffic_cutover_completed`
- `dr.failover_completed`
- `dr.back_failover_initiated`
- `dr.back_failover_completed`

Each event references the incident ID + DR session ID for unified incident timeline reconstruction.

Tenant communications cadence: status page update at T-0, T+90 (mid-failover), T+240 (failover complete), T+24h post-failover.

---

## 7. Patient-safety contingencies (I-017 + I-019 platform floor)

**I-017 emergency information access during failover:** every patient's on-device cache contains local emergency numbers + crisis escalation pathways. The cache is independent of platform availability. Per I-017, emergency information is always accessible — including during the entire failover window.

**I-019 crisis detection during failover:** the crisis-detection-always-on platform floor applies even during DR failover. Specifically:
- During T+0 to T+15 (DB promotion), in-flight crisis-detection signals that were emitted from us-east-1 BEFORE freeze are preserved via WAL replication (per RPO ≤15 min).
- During T+15 to T+90 (cold-start), the platform is in read-only mode; crisis-detection signals can still be emitted via the on-device cache's local-fallback pathway (queued for upload when platform writes resume).
- During T+90 to T+180 (traffic cutover), crisis-detection processing in us-west-2 resumes; the queued signals from the read-only window are processed in order.

**No DR scenario justifies suspending I-019 enforcement.** Any deviation requires Privacy Officer + Compliance Officer + CTO retrospective sign-off.

### I-019 fallback replay hard gate (closes Codex R1 MED-2)

Per R1 MED-2 closure, the failover is NOT COMPLETE until queued crisis-detection signals from the T+15 to T+90 read-only window are verifiably processed in us-west-2 with no loss, no duplication, no reordering, and per-tenant isolation preserved.

**Step 14.5 (HARD GATE between Step 14 post-failover-verify and Step 16 mark-complete): I-019 fallback replay drain.**

```bash
$ dr-tool verify-i019-fallback-replay --target us-west-2 --window T+0 to T+failover_complete
# (a) Inventory queued-on-device crisis-detection signals from the read-only window:
#     each device's local-fallback queue reports its pending-signal count + timestamps to the platform on first successful write after cutover
# (b) Verify replay completeness: every queued signal received by us-west-2 within 60 min of cutover (no signals stuck on devices longer than necessary)
# (c) Verify ordering: replayed signals processed in original emit-timestamp order per tenant + per patient
# (d) Verify deduplication: signals are idempotent on (device_id, local_signal_id, emit_timestamp); duplicate emissions on retry produce a single canonical audit row
# (e) Verify per-tenant isolation: a tenant_A device's queued signals NEVER route to tenant_B audit chain (cross-check against canonical I-023 + I-025)
# (f) Replay latency measurement: P99 replay latency from device emission to platform processing recorded
# (g) Per-tenant queue drain verification: every active tenant's queue reports drained = true before failover marks complete
# Fails if ANY tenant queue not drained within 60 min of cutover OR ANY ordering/dedup/isolation violation
```

**Step 14.5 result interpretation:**
- **All tenants drained + ordered + deduped + isolated within 60 min**: failover proceeds to Step 16 mark-complete.
- **Some queues not drained within 60 min**: extend deadline to 4h; if still not drained, escalate to Incident Commander + Privacy Officer + Compliance Officer review; Step 16 mark-complete BLOCKED until queue resolution.
- **Any ordering / dedup / isolation violation**: P0 alert; quarantine the affected tenant cohort; the failover is not marked complete; named manual review of every affected signal per crisis-response runbook (separate document).

This gate ensures that the T+15 to T+90 read-only window's I-019 local-fallback pathway DOES NOT leak crisis signals — the foundational guarantee of I-019 (crisis-detection-always-on) is preserved across the DR boundary not just by best-effort queue mechanics but by hard verification before failover completion.

---

## 8. Open questions for ratifier

1. **OQ1 — Multi-region active-active vs single-region+cold-DR posture.** ADR-026 canonical decision is single-region+cold-DR. This runbook follows that. Future ADR amendment may evolve to multi-region active-active; this runbook would then be superseded.
2. **OQ2 — KMS multi-region key policy details.** ADR-026 mentions multi-region keys; specific key-policy details (key-policy IAM, cross-region replication, region-pinning per tenant) belong in a separate KMS-Architecture spec. Recommendation: file as follow-up SI.
3. **OQ3 — Chaos drill cadence.** Recommendation: quarterly. ADR-026 + Ghana Launch Playbook should specify; if not, this runbook defaults to quarterly with 30-day advance notice + post-drill retrospective.
4. **OQ4 — Back-failover 7-day soak override criteria.** Recommendation: operator + IC + CTO can override only for documented platform-stability concerns; default 7-day soak holds otherwise.
5. **OQ5 — Codex pre-ratification target for this runbook.** Recommendation: 2-3 rounds. Operations spec.
6. **OQ6 — Cross-SI dependency on SIEM §4.5.HC.** This runbook references SIEM Integration Spec §4.5.HC for S3 manifest verification (Step 8). If §4.5.HC splits into SI-021 per the SIEM Spec R6 close-out observation, this runbook's reference updates to SI-021. Operational dependency unchanged.

---

## 9. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; awaiting Codex R1.

---

— Claude (Opus 4.7, 1M context), Cold-DR Runbook v0.1 DRAFT authored 2026-05-19 under "continue for 24 hrs" autonomous-work authorization. Sprint 7 of the 24h-loop work plan. Track 5 Infra/Ops spec-corpus deliverable. Companion to F-4 Deploy Runbook v0.1 DRAFT.
