# Telecheck — Active Document Index

**Version:** 1.1 (refreshed 2026-05-20, Q2 2026 Batched Ratifier Ceremony per Evans's "Ratified" instruction — Promotion Ledger P-026; Artifact Registry v2.12 → v2.13)
**Status:** Canonical companion to Artifact Registry v2.13 (file at `Telecheck_Artifact_Registry_v2_10.md` per established header-bump-without-rename pattern; header inside declares v2.13)
**Bundle reference:** Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip — **~105 markdown files post-Q2-2026-batched-ratification** (87 prior + 18 newly added at P-026: 11 NEW canonical artifacts + 7 supersession-version artifacts superseding prior versions preserved at existing paths)
**Date:** 2026-05-20 (Q2 2026 Batched Ratifier Ceremony; P-026)
**v1.1 ratifier ceremony summary:** 13 architectural-judgment OQ-groups (OQ-A..OQ-M) RATIFIED per Sprint 20 Master Completion Plan v1.0 → v1.1 amendment §10 + §11; 19 ratifier-ready spec drafts (Sprints 1-20) promoted to canonical bundle; Cold-DR OQ2 RESOLVED via Sprint 13 KMS Architecture Spec; Phase A spec-corpus exit gate SATISFIED. **New canonical files added:** `Telecheck_AI_Service_Mode_1_Handler_Spec_v1_0.md`; `Telecheck_AI_Service_Mode_2_Handler_Spec_v1_0.md`; `Telecheck_KMS_Architecture_Spec_v1_0.md`; `Telecheck_F4_Deploy_Runbook_v1_0.md`; `Telecheck_SIEM_Integration_Spec_v1_0.md`; `Telecheck_Cold_DR_Runbook_v1_0.md`; `Telecheck_Cross_SI_Publish_State_Decision_Record_v1_0.md`; `Telecheck_Operational_Readiness_v1_6_Evidence_Rubric_Catalog_v1_0.md`; `Telecheck_SI_015_MarketingCopy_v1_0.md` (Option B per OQ-A); `Telecheck_SI_016_AI_Workflow_Handler_Registry_v1_0.md` (Option C per OQ-A); `Telecheck_SI_020_Forms_Engine_I030_Static_Analyzer_v1_0.md` (with SI-011b filing). **Supersession files added:** `Telecheck_Identity_Authentication_Spec_v1_1.md` (supersedes v1.0); `Telecheck_Consent_Delegated_Access_Slice_PRD_v1_1.md` (supersedes v1.0); `Telecheck_Notification_Spec_v1_2.md` (supersedes v1.1); `Telecheck_RBAC_Permissions_Matrix_v1_2.md` (supersedes v1.1); `Telecheck_Operational_Readiness_Todo_v1_6.md` (supersedes v1.5); `Telecheck_Master_Completion_Plan_v1_1.md` (supersedes v1.0); `Telecheck_Medication_Interaction_Engine_Slice_PRD_v2_0.md` (supersedes v1.0; Option B per OQ-A). **4 follow-up SIs filed (NOT promoted in this entry):** SI-021 SIEM hash-chain archival per OQ-C split; SI-022 session_state CDM v1.3 entity per OQ-F; SI-023 ai_mode1_conversation CDM v1.3 entities per OQ-G; Quantum-resistance migration roadmap SI Phase 3+ per OQ-I. **Phase B = CDM v1.2 → v1.3 batched promotion (Path B1 per OQ2) is the next gating ceremony.** Previously refreshed 2026-05-01 (v1.10 PRD Update Cycle Phase 6 promotion per Evans's "authorized" instruction)
**Previous date:** 2026-05-01
**Origin:** Post-Remediation Adversarial Counsel Review v1.0 finding MEDIUM-A remediation; refreshed in metadata-remediation cycle 2026-04-25; further refreshed in US Region Migration Cycle U-002 (2026-04-26); refreshed in v1.10 PRD Update Cycle Phase 6 (2026-05-01)
**Format:** Markdown
**Update cadence:** Every Registry version bump
**Filename note:** Contracts Pack files use legacy `v5_00` filename pattern; **document headers declare v5.2 as canonical** for the **v1.10 cycle's amended/new files** (8 amended Phase 3 — INVARIANTS, DOMAIN_EVENTS (amended in-place at v5.2 under P-011 / SI-001 closure 2026-05-11), CCR_RUNTIME, GLOSSARY, TYPES, AI_LAYERING, FORMS_ENGINE, GOVERNANCE_CONTROLS + 2 NEW: WORKLOAD_TAXONOMY, AUTONOMY_LEVELS); **AUDIT_EVENTS declares v5.3** (bumped v5.2 → v5.3 at P-011 / SI-001 closure 2026-05-11: 7 net-new Category A action IDs + §I-012 closure-rule amendment); ERROR_MODEL + IDEMPOTENCY + SOURCE_OF_TRUTH preserved at v5.1; MARKET_LAUNCH v5.0 → v5.1. Headers govern; filenames are stable for cross-reference continuity. Live-emission references for the new I-012 confirmation action MUST resolve against AUDIT_EVENTS v5.3 or later.
**Region note (per ADR-026, 2026-04-26):** Platform runs single-region in `us-east-1` primary with `us-west-2` cold DR. ADR-025 (af-south-1 primary) is superseded. See Architecture row below.
**Brand discipline note (added v1.10 cycle 2026-05-01 per C3 cycle):** Operating tenant naming: `Telecheck-{country}` (e.g., `Telecheck-US`, `Telecheck-Ghana`). Consumer DBA: `Heros Health` (country-instanced via subdomains: `heroshealth.com` for Telecheck-US; `ghana.heroshealth.com` for Telecheck-Ghana). "Heros" alone (without "Health" qualifier) MUST NOT be used as tenant or operator identifier per Master PRD v1.10 §17 contextual carve-out rules.

---

## 0. Authority hierarchy (READ THIS FIRST)

When two documents conflict, resolve in this order — top wins:

1. **Active Document Index** (this document) — entry-point canonicality reference
2. **Artifact Registry v2.11** — canonical mapping with rationale and status
3. **Project Upload Manifest** — bundle inventory
4. **Engineering Handoff & Build Guide v1.3** — execution guide with sprint plan
5. **All other documents** — substantive specs in their domain

Any conflict between control-plane documents (1-4) is a remediation defect; report and escalate. Substantive specs (5) are governed by their domain ownership per Registry §3.

---

## 1. Purpose

This document is the **first read** for any engineer or operator joining the Telecheck project. It lists every document that is currently canonical and active, and identifies every document that has been superseded.

The motivation is honest-status: the Telecheck corpus has accumulated multiple versions of many documents over the project's lifecycle. The Artifact Registry tracks canonicality, but engineers who open `/mnt/project/Telecheck_Refill_Slice_PRD_v1_0.md` directly (without first reading the Registry) might mistake superseded scope for current scope. This Index provides a one-page reference identifying which file is canonical for each topic.

If this Index conflicts with the Registry, the Registry governs. If both are silent on a document, that document is not part of the canonical corpus.

---

## 2. How to use this document

When you need to find the canonical specification for a topic:

1. Look up the topic in §3 below
2. Read the file listed under "Canonical artifact"
3. Do NOT read files listed under "Superseded versions" unless you are doing version-history archaeology

When you encounter a Telecheck document file:

1. Search §4 below for its filename
2. If listed as "Active": that file is canonical — read it
3. If listed as "Superseded": that file is NOT canonical — read the listed canonical successor instead
4. If not listed at all: not part of the canonical corpus — verify with Registry v2.9 §3 inventory

---

## 3. Active artifacts by topic

| Topic | Canonical artifact | Companion documents |
|---|---|---|
| **Product vision and platform truth** | Master Platform PRD v1.10 | — |
| **Architecture decisions** | ADR Set v1.0 + ADR Addendum 016-019 + ADR Addendum 020-025 (with ADR-025 superseded) + ADR Addendum 026 (us-east-1 primary, us-west-2 cold DR; supersedes ADR-025) + **ADR-027 Country-Conditional DTC Marketing Posture** + **ADR-028 Research Data Partnership Posture A** + **ADR-029 AI Workload Taxonomy** (all 3 Accepted at v1.10 promotion 2026-05-01) | — |
| **System architecture** | System Architecture v1.2 | — |
| **Canonical data model** | Canonical Data Model **v1.3** (bumped v1.2 → v1.3 at P-011 / SI-001 closure 2026-05-11: §4.16 MedicationRequest added; audit_events CHECK amended) | v1.0, v1.1, v1.2 superseded |
| **State machines** | State Machines **v1.2** (bumped v1.1 → v1.2 at P-011 / SI-001 closure 2026-05-11: §19 MedicationRequest lifecycle added) | v1.0 and v1.1 superseded |
| **API surface** | OpenAPI v0.2 | — |
| **Cross-cutting contracts** | Contracts Pack v5.2/v5.3 (**12 files** — 9 amended at v5.2 in v1.10 cycle; **AUDIT_EVENTS bumped to v5.3 at P-011 / SI-001 closure 2026-05-11** with 7 net-new Category A action IDs + §I-012 closure-rule amendment; DOMAIN_EVENTS amended in-place at v5.2 with 4 net-new event types; 2 NEW at v5.2: WORKLOAD_TAXONOMY, AUTONOMY_LEVELS; ERROR_MODEL + IDEMPOTENCY + SOURCE_OF_TRUTH preserved at v5.1; MARKET_LAUNCH v5.0 → v5.1; README, Update Spec ancillary) | — |
| **RBAC / permissions** | RBAC Permissions Matrix v1.1 | — |
| **AI Clinical Assistant** | AI Clinical Assistant Slice PRD v1.0 | Tenant Threading Addendum v1.0 §3.1 |
| **Async consult** | Async Consult Slice PRD v1.0 | Tenant Threading Addendum v1.0 §3.2 |
| **Sync video consult** | Sync Video Consult Slice PRD v1.0 | Tenant Threading Addendum v1.0 §3.3 |
| **Pharmacy + Refill** | Pharmacy + Refill Slice PRD v2.1 | — |
| **Forms / Intake Engine** | Forms / Intake Engine Slice PRD v2.1 | — |
| **Med Interaction Engine** | Medication Interaction Engine Slice PRD v1.0 | Tenant Threading Addendum v1.0 §3.8 |
| **Herb-Drug Engine** | Herb-Drug Interaction Engine Slice PRD v1.0 | Tenant Threading Addendum v1.0 §3.9 |
| **Adverse Event Reporting** | Adverse Event Reporting Slice PRD v1.0 | Tenant Threading Addendum v1.0 §3.6 |
| **Consent + Delegated Access** | Consent Delegated Access Slice PRD v1.0 | Tenant Threading Addendum v1.0 §3.7 |
| **Labs & Documents** | Labs Document Interpretation Slice PRD v1.0 | Tenant Threading Addendum v1.0 §3.10 |
| **RPM/CCM** | RPM CCM Slice PRD v1.0 | Tenant Threading Addendum v1.0 §3.4 |
| **Community Platform** | Community Platform Slice PRD v1.0 | Tenant Threading Addendum v1.0 §3.5 |
| **Acquisition & Engagement** | Acquisition Engagement Tools Slice PRD v1.0 | Tenant Threading Addendum v1.0 §3.12 |
| **Fake Med Detection** | Fake Medication Detection Slice PRD v1.0 | Tenant Threading Addendum v1.0 §3.11 |
| **Admin: tenant-side ecom** | Admin Backend Slice PRD v1.1 | — |
| **Admin: governance configuration** | Admin Configuration Surfaces Slice PRD v1.0 | Unified Admin Sidebar v1.0 §3.A (sidebar layout) |
| **Admin: market launch** | Market Rollout Cockpit Slice PRD v1.0 | — |
| **Admin: information architecture** | Admin Operator IA v1.1 | Unified Admin Sidebar v1.0 (sidebar layout supersedes IA's §3) |
| **Admin: unified sidebar** | Unified Admin Sidebar v1.0 | — |
| **Patient app IA** | Patient App IA v1.0 | Tenant Threading Addendum v1.0 §3.13 |
| **Clinician portal IA** | Clinician Portal IA v1.0 | Tenant Threading Addendum v1.0 §3.14 |
| **Design System** | Design System v1.1 | — |
| **Design Implementation Contract** | Design Implementation Contract v1.1 (Canonical for development; Patient mock v7 binding visual reference per Evans Option B 2026-04-28 fold-in into v1.10 cycle) | — |
| **Notification Spec** | Notification Spec v1.1 | — |
| **Identity & Auth Spec** | Identity Authentication Spec v1.0 | — |
| **Payment & Billing Spec** | Payment Billing Spec v1.0 | — |
| **Messaging & Inbox Spec** | Messaging Inbox Spec v1.0 | — |
| **Ghana Launch Playbook** | Ghana Launch Playbook v1.2 | — |
| **Protocol Library Ghana** | Protocol Library Ghana v1.0 | — |
| **Guardrail Templates** | Guardrail Templates v1.0 | — |
| **Engineering Handoff Build Guide** | Engineering Handoff Build Guide v1.3 | — |
| **Operational Readiness Tracker** | Operational Readiness To-Do v1.5 (canonical tracker) — Consolidated Launch Tracker v1.0 is the support artifact | — |
| **Investor Pitch / One-Pager** | Investor One Pager (current) | — |
| **Reviewer Brief** | Reviewer Brief v1.0 | — |
| **Red Team Review** | Red Team Review (latest) | — |
| **Flagged Items Resolution** | Flagged Items Resolution v1.0 | — |
| **Artifact Registry** | Artifact Registry v2.11 | — |
| **Promotion Ledger** | Promotion Ledger (P-001 through **P-011**; P-008 records v1.10 PRD Update Cycle Phase 6 promotion 2026-05-01; P-009 v1.10.1 hygiene cycle physical merge 2026-05-02; P-010 CDM §4.1 SPEC ISSUE resolution 2026-05-02; **P-011 SI-001 closure: MedicationRequest canonical schema 2026-05-11** — content-change promotion bumping Registry v2.10 → v2.11) | — |
| **Country regulatory contracts (placeholder)** | Telecheck_Country_Regulatory_Contracts.md (placeholder per ADR-027 Tier 2; populated per per-country activation gate) | — |
| **Pharmacy Council guidance (placeholder)** | Telecheck_Pharmacy_Council_Guidance.md (placeholder per ADR-027 Tier 2) | — |
| **Data Sharing Agreement template (placeholder)** | Telecheck_DSA_Template.md (placeholder per ADR-028; legal-reviewed pre-launch per Master PRD §24 row 13) | — |
| **REC / IRB Engagement (placeholder)** | Telecheck_REC_IRB_Engagement.md (placeholder per ADR-028; per-market REC partnership designated per Master PRD §24 row 11) | — |
| **Program Porting Checklist (worked example)** | Telecheck_Program_Porting_Checklist_GLP1_v1_0.md (Telecheck-US Heros Health DBA GLP-1 → Telecheck-Ghana Heros Health Ghana DBA GLP-1) | — |
| **Workload taxonomy (NEW v1.10)** | Telecheck_Contracts_Pack_v5_00_WORKLOAD_TAXONOMY.md v5.2 | — |
| **Autonomy levels (NEW v1.10)** | Telecheck_Contracts_Pack_v5_00_AUTONOMY_LEVELS.md v5.2 | — |
| **Tenant Threading Addendum** | Tenant Threading Addendum v1.0 | — |
| **Adversarial Counsel Review** | Adversarial Counsel Review Sessions 1-3 v1.0 + Post-Remediation Review v1.0 | — |

---

## 4. Superseded artifacts — DO NOT IMPLEMENT FROM THESE

These files exist in the corpus for traceability but are NOT canonical. If you find yourself reading one, stop and read the canonical successor instead.

| Superseded file | Status | Read this instead |
|---|---|---|
| Telecheck_Master_Platform_PRD_v1_6.md | SUPERSEDED | Master Platform PRD v1.10 |
| Telecheck_Master_Platform_PRD_v1_7.md | SUPERSEDED | Master Platform PRD v1.10 |
| Telecheck_Master_Platform_PRD_v1_8.md | SUPERSEDED 2026-04-26 | Master Platform PRD v1.10 (region migration per ADR-026; succeeded by v1.10 PRD update 2026-05-01) |
| Telecheck_Master_Platform_PRD_v1_9.md | SUPERSEDED 2026-05-01 | Master Platform PRD v1.10 (v1.10 PRD Update Cycle: 7 architectural shifts C1-C7; new sections §7.9 / §7.10 / §10.5 / §13.2 / §13.7 / §15.3; 3 new invariants I-029/030/031; per Phase 6 promotion ceremony) |
| Telecheck_Design_Implementation_Contract_v1_0.md | SUPERSEDED 2026-05-01 (PROVISIONAL → Canonical for development per Evans Option B 2026-04-28 fold-in into v1.10 cycle as Phase 5.6 / F49) | Design Implementation Contract v1.1 (Patient mock v7 binding visual reference) |
| Telecheck_Canonical_Data_Model_v1_0.md | SUPERSEDED | Canonical Data Model v1.3 |
| Telecheck_Canonical_Data_Model_v1_1.md | SUPERSEDED | Canonical Data Model v1.3 |
| Canonical Data Model v1.2 (body of `Telecheck_Canonical_Data_Model_v1_2.md` pre-2026-05-11) | SUPERSEDED 2026-05-11 (P-011 / SI-001 closure: §4.16 MedicationRequest added; audit_events CHECK amended) | Canonical Data Model v1.3 (filename preserved; header bumped per v1.10 cycle precedent) |
| Telecheck_State_Machines_v1_0.md | SUPERSEDED | State Machines v1.2 |
| State Machines v1.1 (body of `Telecheck_State_Machines_v1_1.md` pre-2026-05-11) | SUPERSEDED 2026-05-11 (P-011 / SI-001 closure: §19 MedicationRequest lifecycle added) | State Machines v1.2 (filename preserved; header bumped per v1.10 cycle precedent) |
| AUDIT_EVENTS v5.2 (body of `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md` pre-2026-05-11) | SUPERSEDED 2026-05-11 for live-emission references to the I-012 closure rule (P-011 / SI-001 closure: 7 net-new Category A IDs + §I-012 authoritative set amendment) | AUDIT_EVENTS v5.3 (filename preserved; header bumped) |
| Artifact Registry v2.10 (body of `Telecheck_Artifact_Registry_v2_10.md` pre-2026-05-11) | SUPERSEDED 2026-05-11 (P-011 / SI-001 closure) | Artifact Registry v2.11 (filename preserved; header bumped per v1.10 cycle precedent) |
| Telecheck_OpenAPI_v0_1.md | SUPERSEDED | OpenAPI v0.2 |
| Telecheck_System_Architecture_v1_0.md | SUPERSEDED | System Architecture v1.2 |
| Telecheck_System_Architecture_v1_1.md | SUPERSEDED 2026-04-26 | System Architecture v1.2 (region migration per ADR-026) |
| Telecheck_RBAC_Permissions_Matrix_v1_0.md | SUPERSEDED | RBAC Permissions Matrix v1.1 |
| Telecheck_Refill_Slice_PRD_v1_0.md | SUPERSEDED — content carried forward | Pharmacy + Refill Slice PRD v2.1 |
| Telecheck_Pharmacy_Portal_Slice_PRD_v1_0.md | SUPERSEDED — content carried forward | Pharmacy + Refill Slice PRD v2.1 |
| Telecheck_Forms_Intake_Engine_Slice_PRD_v1_0.md (if present) | SUPERSEDED | Forms / Intake Engine Slice PRD v2.1 |
| Telecheck_Forms_Intake_Engine_Slice_PRD_v2_0.md | SUPERSEDED | Forms / Intake Engine Slice PRD v2.1 |
| Telecheck_Pharmacy_Refill_Slice_PRD_v2_0.md | SUPERSEDED | Pharmacy + Refill Slice PRD v2.1 |
| Telecheck_Admin_Backend_Slice_PRD_v1_0.md | SUPERSEDED | Admin Backend Slice PRD v1.1 |
| Telecheck_Admin_Operator_IA_v1_0.md | SUPERSEDED — note Unified Admin Sidebar v1.0 also supersedes §3 | Admin Operator IA v1.1 + Unified Admin Sidebar v1.0 |
| Telecheck_Notification_Spec_v1_0.md | SUPERSEDED | Notification Spec v1.1 |
| Telecheck_Ghana_Launch_Playbook_v1_0.md | SUPERSEDED | Ghana Launch Playbook v1.2 |
| Telecheck_Design_System_v1_0.md | SUPERSEDED | Design System v1.1 |
| Telecheck_Engineering_Handoff_Build_Guide_v1_0.md | SUPERSEDED | Engineering Handoff Build Guide v1.3 |
| Telecheck_Engineering_Handoff_Build_Guide_v1_1.md | SUPERSEDED | Engineering Handoff Build Guide v1.3 |
| Telecheck_Engineering_Handoff_Build_Guide_v1_2.md | SUPERSEDED 2026-04-27 | Engineering Handoff Build Guide v1.3 (Cycle U-003: ADR-026 region updates + parent-doc bumps) |
| Telecheck_Operational_Readiness_Todo_v1_4.md | SUPERSEDED 2026-04-27 | Operational Readiness To-Do v1.5 (Cycle U-003: OR-103/OR-111/OR-302/OR-303 reframed under ADR-026) |
| Telecheck_Ghana_Launch_Playbook_v1_1.md | SUPERSEDED 2026-04-27 | Ghana Launch Playbook v1.2 (Cycle U-003: new "Data residency and cross-border posture" section per ADR-026) |
| Telecheck_Artifact_Registry_v2_7.md (and earlier versions) | SUPERSEDED | Artifact Registry v2.11 |
| Telecheck_Artifact_Registry_v2_9.md | SUPERSEDED 2026-05-01 (v2.9 → v2.10 in v1.10 PRD Update Cycle Phase 6 promotion ceremony) | Artifact Registry v2.11 |
| Telecheck_Artifact_Registry_v2_8.md | SUPERSEDED 2026-04-26 | Artifact Registry v2.9 (Cycle U-002 historical successor; further superseded by v2.10 in v1.10 PRD update 2026-05-01) |
| Telecheck_Contracts_Pack_v5_*.md at v5.0 | SUPERSEDED | Same files at v5.1 (12 of 13) |

---

## 5. Document control

- **v1.0 (refreshed 2026-05-11, P-011 / SI-001 closure)** — Refreshed to reflect P-011 promotion: §3 Canonical Data Model row bumped v1.2 → v1.3 (added §4.16 MedicationRequest; audit_events CHECK amended); State Machines row bumped v1.1 → v1.2 (added §19 MedicationRequest lifecycle); Cross-cutting Contracts row updated to reflect AUDIT_EVENTS v5.2 → v5.3 (7 net-new Category A action IDs + §I-012 closure-rule amendment) and DOMAIN_EVENTS in-place amendment with 4 net-new event types; Registry companion v2.10 → v2.11. §4 Superseded gains: CDM v1.2 → v1.3; State Machines v1.1 → v1.2; Registry v2.10 → v2.11. Promotion Ledger references updated to include P-011.
- **v1.0 (refreshed 2026-05-01, v1.10 PRD Update Cycle Phase 6 promotion ceremony per Evans's "authorized" instruction)** — Refreshed to reflect v1.10 promotion: §3 Master PRD row bumped v1.9 → v1.10; ADR row updated to add ADR-027/028/029 Accepted; Contracts Pack row v5.1 → v5.2 (**11 files at v5.2** = 9 amended + 2 NEW WORKLOAD_TAXONOMY/AUTONOMY_LEVELS); DIC row v1.0 PROVISIONAL → v1.1 Canonical for development; Registry companion v2.9 → v2.10; Promotion Ledger references updated to include P-008. §3 gains rows for: Country regulatory contracts (placeholder); Pharmacy Council guidance (placeholder); DSA Template (placeholder); REC/IRB Engagement (placeholder); Program Porting Checklist (worked example); Workload taxonomy (NEW v1.10); Autonomy levels (NEW v1.10). §4 Superseded gains: Master PRD v1.9 → v1.10; DIC v1.0 PROVISIONAL → v1.1 Canonical; Registry v2.9 → v2.10. Header Filename note updated for v5.2 transition; new Brand discipline note added per C3 cycle (operating tenant `Telecheck-{country}`; consumer DBA `Heros Health`).
- **v1.0 (refreshed 2026-04-26, US Region Migration Cycle U-002)** — Refreshed to reflect ADR-026 ratification: Architecture row updated to add ADR Addendum 026; System Architecture row bumped v1.1→v1.2; Master Platform PRD row bumped v1.8→v1.9; Registry companion reference updated to v2.9; supersession list updated for Master PRD v1.8, System Architecture v1.1, Registry v2.8. Bundle file count not reasserted in U-002 — to be recomputed in Cycle U-004 from rebuilt bundle.
- **v1.0 (refreshed 2026-04-27, US Region Migration Cycle U-004)** — Bundle reference finalized: `Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip` with **75 markdown files** mechanically counted from filesystem. Placeholder from U-002 refresh replaced with actual values. No semantic content changes.
- **v1.0 (refreshed 2026-04-25, metadata-remediation cycle)** — Added §0 Authority hierarchy. Added bundle count and Contracts filename note in header.
- **v1.0 (original)** — NEW Active Document Index produced as remediation for Post-Remediation Adversarial Counsel Review finding MEDIUM-A. Provides single-page reference for canonicality of every Telecheck artifact. Companion to Artifact Registry v2.11.
- **Update cadence:** Every Registry version bump produces a corresponding Active Document Index update.
- **Authority:** This Index is canonical for *which* documents are active. The Registry is canonical for *what* the documents contain and how they relate. In conflict, Registry governs.
