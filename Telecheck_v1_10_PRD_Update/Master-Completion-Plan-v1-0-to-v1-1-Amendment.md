# Master Completion Plan v1.0 → v1.1 Amendment

**Version:** 0.1 DRAFT
**Status:** Pre-Codex-pre-ratification; Sprint 20 of autonomous 24h-loop work plan
**Authoring location:** `Telecheck_v1_10_PRD_Update/` (workstream folder; spec-corpus Track 6 deliverable)
**Owner:** Evans (workstream lead) + Engineering Lead + SRE Lead + Compliance Officer
**Companion documents:** `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Master_Completion_Plan_v1_0.md` (target canonical surface); all Sprints 1-19 deliverables in `Telecheck_v1_10_PRD_Update/` workstream folder; cockpit Addenda 50, 51, 52, 53.
**Authority:** ratifier-targetable amendment to canonical Master Completion Plan; incorporates the 17 ratifier-ready spec drafts from Sprints 1-18 + 19 cockpit addenda into the master plan's Phase A-F gating; reflects ~12 architectural-judgment OQ-groups queued for batched ratifier ceremony.

---

## 1. Purpose + scope

This amendment updates the canonical Master Completion Plan v1.0 with **18 sprints of autonomous-work cycle output** completed between 2026-05-18 and 2026-05-20 under Evans's "continue 24 hrs / no more resting" directive. The cycle produced 17 ratifier-ready spec drafts spanning Tracks 1-6, all with 0 hard-floor item 6 violations + ~145+ Codex in-scope correctness closures + ~12 architectural-judgment OQ-groups properly escalated for batched ratifier ceremony.

**In scope:**

1. New spec inventory: 17 ratifier-ready drafts mapped to their respective tracks + their effect on phase gating.
2. Resolved OQ: Cold-DR OQ2 (multi-region key policy details) RESOLVED via Sprint 13 KMS Architecture Spec.
3. New OQ catalog: ~12 architectural-judgment OQ-groups queued, each tagged with the relevant ratifier-ceremony-priority bucket.
4. Updated cross-track dependency graph: which Sprint 1-18 deliverables unblock which downstream tracks/phases.
5. Updated Phase A-F gating: what's now ratifier-ready, what still requires ratifier ceremony, what remains pending.

**Out of scope (deferred):**

- Per-deliverable canonical-promotion timeline (driven by ratifier ceremony sequencing; not pre-determinable).
- Implementation milestones (depends on ratifier-approved schemas + procedures).
- Resource allocation / staffing plans (tracked separately).

---

## 2. Amendment-delta summary (v1.0 → v1.1)

| v1.0 section | v1.1 amendment | Driver |
|---|---|---|
| §3 Phase A-F gating | Amended: 17 specs added to phase inventory; Cold-DR OQ2 RESOLVED; ~12 new OQ-groups queued | Sprints 1-18 cycle |
| §5 Track 1 deliverables | Amended: SI-017 Identity v1.1 + RBAC v1.2 + Identity Spec amendment added | Sprints 8 + 18 |
| §6 Track 2 deliverables | Amended: AI Mode 1 Handler + AI Mode 2 Handler + Notification v1.2 amendment added | Sprints 9 + 12 + 16 |
| §7 Track 3 deliverables | Amended: Consent v1.1 amendment added; Forms-Intake v2.2 pending Sprint 10 ratifier | Sprints 14 + 4 |
| §8 Track 5 deliverables | Amended: F-4 Deploy Runbook + SIEM Spec + Cold-DR Runbook + KMS Architecture + Operational Readiness v1.6 + Evidence Rubric Catalog added | Sprints 5 + 6 + 7 + 13 + 17 |
| §9 Track 6 deliverables | Amended: Cross-SI Publish-State Batched-Ratifier Proposal + Master Completion Plan v1.1 amendment (this doc) added | Sprints 10 + 20 |
| §10 (NEW) Ratifier ceremony recommended sequence | NEW section | Sprint 19 Addendum 53 sequence canonicalized |
| §11 (NEW) Architectural-judgment OQ-group catalog | NEW section | ~12 OQs queued |
| §12 (NEW) Cross-track dependency graph | NEW section | Visualizes Sprint 1-18 interlocks |

---

## 3. Updated Phase A-F gating

### Phase A — Spec Corpus Foundation (RATIFIER-READY)

| Item | Status | Source |
|---|---|---|
| 17 ratifier-ready spec drafts | RATIFIER-READY | Sprints 1-18 |
| Cold-DR OQ2 (multi-region key policy) | **RESOLVED** | Sprint 13 |
| Cross-SI publish-state OQ batched-ratifier proposal | RATIFIER-READY | Sprint 10 |
| ~12 architectural-judgment OQ-groups | QUEUED FOR RATIFIER | Cumulative |

**Phase A exit gate:** all 17 specs reviewed + ratifier-approved (per the canonical batched-ratifier ceremony per §10); OQ-groups resolved per their respective option-selections.

### Phase B — CDM v1.2 → v1.3 Promotion (BLOCKED ON RATIFIER)

| Item | Status | Driver |
|---|---|---|
| SI-022 session_state entity (from Sprint 8) | DRAFTED; pending CDM v1.3 promotion | Sprint 8 OQ1 |
| SI-023 ai_mode1_conversation entities (4 tables from Sprint 9) | DRAFTED; pending CDM v1.3 promotion | Sprint 9 OQ1 |
| Sprint 12 ai_mode2_* entities (from Sprint 12 §6.1; multiple tables for handler + invocations) | DRAFTED; pending CDM v1.3 promotion | Sprint 12 |
| Sprint 14 consent_revocation_event + consent_research_active view + outbox/delivery tables | DRAFTED; pending CDM v1.3 promotion | Sprint 14 |
| Sprint 16 notification_crisis_dispatch_ledger + notification_crisis_provider_attempt + notification_crisis_escalation_obligation | DRAFTED; pending CDM v1.3 promotion | Sprint 16 |
| Sprint 17 synthetic_canary + kms_residency_dr_override + chaos-drill tables | DRAFTED; pending CDM v1.3 promotion | Sprint 17 |
| Sprint 18 iam_principal_human_binding + operator_active_mode_lease + hsm_signer_binding | DRAFTED; pending CDM v1.3 promotion | Sprint 18 |

**Phase B exit gate:** all draft schemas reviewed + ratifier-approved as a single CDM v1.3 batched promotion (sister-SI batched approach per Addendum 51 + 53 recommendation).

### Phase C — Procedure-Side Implementation (Track 1+2+5; PENDING)

Track 1 procedures pending Phase B CDM v1.3:
- I-032 STEP 0 + SECURITY DEFINER STEP 0a caller-role check across all new procedures (canonical pattern per Sprint 8 §11 + Sprint 14 §3 SD5 + Sprint 18 §6).
- Mode 1 + Mode 2 handler implementations (Sprint 9 + 12 specs).
- Consent v1.1 outbox dispatcher + AI-service propagation (Sprint 14 §3 SD4 + SD6).
- Notification v1.2 dispatcher + multi-region ACK channel (Sprint 16 §3 SD2 + SD3).
- RBAC v1.2 grant procedures + separation-of-duties enforcement (Sprint 18 §5).

### Phase D — Infrastructure Provisioning (Track 5; PENDING)

| Item | Status |
|---|---|
| Multi-region ACK channel (DynamoDB Global Tables OR equivalent per Cold-DR OQ7) | PENDING ratifier decision on OQ7 primitive |
| KMS multi-region keys + IAM policies-as-code (Sprint 13) | RATIFIER-READY; provision after Phase A |
| SIEM event-streaming pipeline + hash-chain archival (Sprint 6; §4.5.HC potential SI-021 split) | RATIFIER-READY; provision after Phase A |
| F-4 deploy pipeline (Sprint 5) | RATIFIER-READY; provision after Phase A |
| Notification SMS providers + dispatch infrastructure (Sprint 16) | PROVISIONED; per-tenant CCR keys per Sprint 17 P-5 |
| Chaos-drill infrastructure (Sprint 17 §6 + RBAC R-11) | PROVISIONED per Phase D |

### Phase E — Internal Alpha + Per-Tenant Readiness Verification (PENDING)

Per Sprint 17 §7 per-tenant launch-readiness sub-checklist: 19 P-items per tenant MUST be green; canonical evidence-rubric catalog at `Telecheck_v1_10_PRD_Update/v1-6-evidence-rubric-catalog.md` is authoritative source.

### Phase F — GA Launch Per Tenant (PENDING)

| Tenant | Status | Gating |
|---|---|---|
| Telecheck-US (Heros Health) | PENDING Phase E completion | All 19 P-items + cross-tenant negative test suite + canary running |
| Telecheck-Ghana (Heros Health Ghana) | PENDING Phase E completion | All 19 P-items + Ghana-specific protocol library + Africa's Talking SMS provider + crisis-line content |

---

## 4. Resolved OQ tracking

**Resolved during the Sprints 1-18 cycle:**

| OQ | Resolution | Sprint |
|---|---|---|
| Cold-DR OQ2 (multi-region key policy details) | Sprint 13 KMS Architecture Spec defines the canonical IAM policy + STS session-tag binding + replica-policy-as-code + drift detection | Sprint 13 |

**Still queued for ratifier ceremony (~12 OQ-groups):**

See §11 below.

---

## 5. Updated cross-track dependency graph

```
Sprint 8 SI-017 Identity v1.1
   ├── Unblocks → Sprint 18 RBAC v1.2 (operator-mode-switcher; platform_operator)
   ├── Unblocks → Sprint 14 Consent v1.1 (I-032 STEP 0 contract)
   ├── Unblocks → Sprint 12 Mode 2 Handler (canonical middleware-GUC)
   └── Unblocks → Sprint 16 Notification v1.2 (tenant-scoped preferences)

Sprint 9 Mode 1 Handler
   ├── Unblocks → Sprint 12 Mode 2 Handler (cross-mode boundary)
   ├── Unblocks → Sprint 16 Notification v1.2 (crisis-signal-emitted subscriber)
   └── Unblocks → Sprint 17 chaos drill cadence (I-019 detector verification)

Sprint 7 Cold-DR Runbook
   ├── Resolves Cold-DR OQ2 via → Sprint 13 KMS Architecture Spec
   ├── Unblocks → Sprint 16 Notification v1.2 (DR-survivable multi-region ACK delivery)
   └── Unblocks → Sprint 17 DR drill cadence

Sprint 13 KMS Architecture
   ├── Unblocks → Sprint 14 Consent v1.1 (KMS access lock for revoked research consent)
   ├── Unblocks → Sprint 16 Notification v1.2 (payload encryption at rest)
   ├── Unblocks → Sprint 18 RBAC v1.2 (break-glass roles + HSM signers)
   └── Unblocks → Sprint 17 ops readiness (KMS provisioning checklist)

Sprint 10 Cross-SI Publish-State Proposal
   ├── BLOCKS → Sprint 4 SI-020 Forms-Engine I-030 (publish-state pattern)
   ├── BLOCKS → SI-015 MarketingCopy + SI-016 handler registry + SI-019 signal lifecycle
   └── BLOCKS → CDM v1.3 promotion (depends on ratifier per-SI option selection)

Sprint 17 Operational Readiness v1.6 + Evidence Rubric Catalog
   └── Authoritative for → Phase E + Phase F per-tenant launch-readiness

Sprint 18 RBAC v1.2
   ├── Unblocks → Phase C procedure-side STEP 0a caller-role check
   └── Unblocks → Phase D infrastructure IAM provisioning
```

---

## 6. Spec body amendments (v1.0 → v1.1 patch deltas)

### Delta 1 — Header

**v1.0 → v1.1:** Version 1.1; status note reflecting Sprints 1-18 cycle integration.

### Delta 2 — §3 Phase A-F gating

Existing phase content extended with §3 above.

### Delta 3 — §5 Track 1 deliverables (amended)

Added rows for SI-017 Identity v1.1 + RBAC v1.2 + canonical content port (already ratified 2026-05-19).

### Delta 4 — §6 Track 2 deliverables (amended)

Added rows for AI Mode 1 Handler + AI Mode 2 Handler + Notification v1.2.

### Delta 5 — §7 Track 3 deliverables (amended)

Added Consent v1.1; noted Forms-Intake v2.2 pending Sprint 10 ratifier resolution.

### Delta 6 — §8 Track 5 deliverables (amended)

Added F-4 Deploy Runbook + SIEM Integration Spec + Cold-DR Runbook + KMS Architecture + Operational Readiness v1.6 + Evidence Rubric Catalog.

### Delta 7 — §9 Track 6 deliverables (amended)

Added Cross-SI Publish-State Batched-Ratifier Proposal + this v1.1 amendment (Sprint 20).

### Delta 8 — §10 (NEW) Ratifier ceremony recommended sequence

Per Addendum 53 §"Recommended ratifier sequence":

1. Cross-SI publish-state batched-ratifier ceremony (Sprint 10) — highest leverage; resolves 3 SIs simultaneously.
2. CDM v1.2 → v1.3 amendment ceremony — sister SIs batched (SI-022 + SI-023 + all Sprint 12-18 schema additions).
3. Cold-DR OQ7/OQ8 + KMS OQs — infrastructure-related OQs grouped.
4. Sprint 12 (Mode 2) + Sprint 14 (Consent v1.1) OQs.
5. Sprint 16 (Notification v1.2) + Sprint 18 (RBAC v1.2) OQs.
6. Sprint 17 (Operational Readiness v1.6) OQs.
7. SIEM §4.5.HC SI-021 split confirmation.
8. Sprint 6-18 deliverables canonical promotion (in batched waves).

### Delta 9 — §11 (NEW) Architectural-judgment OQ-group catalog

Per Addendum 53, ~12 OQ-groups across 13 enumerated items. Each item retains its source Sprint reference + working recommendation. The catalog is the canonical inventory; ratifier ceremony agenda is built from this catalog.

### Delta 10 — §12 (NEW) Cross-track dependency graph

Per §5 above.

### Delta 11 — Document control entry

> **v1.1** (2026-05-19/20) — Incorporates Sprints 1-18 autonomous-work cycle output: 17 ratifier-ready spec drafts mapped to phase gating; Cold-DR OQ2 RESOLVED via Sprint 13; ~12 architectural-judgment OQ-groups catalogued; recommended ratifier ceremony sequence canonicalized; cross-track dependency graph added. v1.0 body preserved; v1.1 extends rather than rewrites.

---

## 7. Open questions for ratifier

1. **OQ1 — Master Completion Plan v1.1 promotion timing relative to ratifier ceremony.** Recommendation: promote v1.1 to canonical at Phase A exit (after Sprint 10 cross-SI publish-state ceremony), so the canonical plan reflects the ratifier-resolved per-SI options. Ratifier confirms.
2. **OQ2 — Whether to file Phase B as a single CDM v1.3 batched promotion vs incremental per-SI promotions.** Recommendation: single batched promotion (consistent with Sprint 10 batched-ratifier model). Ratifier confirms.
3. **OQ3 — Phase E + F per-tenant launch-readiness gating: who owns the launch ceremony.** Recommendation: SRE Lead + Compliance Officer + Country Lead joint sign-off (per Sprint 17 §7); ratifier confirms.
4. **OQ4 — Cycle-end retrospective scheduling.** Recommendation: after Phase A ratifier ceremony completes, schedule a cycle retrospective covering autonomous-work discipline lessons (workstream-discipline note candidate). Ratifier confirms.
5. **OQ5 — Codex pre-ratification target for this amendment.** Recommendation: 2 rounds (Track 6 ratification-planning deliverable; meta-documentation).

---

## 8. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; awaiting Codex R1.

---

— Claude (Opus 4.7, 1M context), Master Completion Plan v1.0 → v1.1 amendment v0.1 DRAFT authored 2026-05-19/20 under "continue 24 hrs / no more resting" autonomous-work authorization. Sprint 20 of the 24h-loop work plan. Track 6 spec-corpus deliverable. Incorporates Sprints 1-18 cycle output into the canonical Master Completion Plan + canonicalizes the recommended ratifier ceremony sequence + catalogues ~12 architectural-judgment OQ-groups.
