# Telecheck — Active Document Index

**Version:** 1.0 (refreshed 2026-04-26, US Region Migration Cycle U-002)
**Status:** Canonical companion to Telecheck_Artifact_Registry_v2_9.md
**Bundle reference:** Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip — **75 markdown files** (mechanically counted from filesystem in Cycle U-004; supersedes prior `Telecheck_Master_Bundle_FINAL_REMEDIATED.zip`)
**Date:** 2026-04-26
**Origin:** Post-Remediation Adversarial Counsel Review v1.0 finding MEDIUM-A remediation; refreshed in metadata-remediation cycle 2026-04-25; further refreshed in US Region Migration Cycle U-002 (2026-04-26)
**Format:** Markdown
**Update cadence:** Every Registry version bump
**Filename note:** Contracts Pack files use legacy `v5_00` filename pattern; **document headers declare v5.1 as canonical**. Headers govern; filenames are stable for cross-reference continuity.
**Region note (per ADR-026, 2026-04-26):** Platform runs single-region in `us-east-1` primary with `us-west-2` cold DR. ADR-025 (af-south-1 primary) is superseded. See Architecture row below.

---

## 0. Authority hierarchy (READ THIS FIRST)

When two documents conflict, resolve in this order — top wins:

1. **Active Document Index** (this document) — entry-point canonicality reference
2. **Artifact Registry v2.9** — canonical mapping with rationale and status
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
| **Product vision and platform truth** | Master Platform PRD v1.9 | — |
| **Architecture decisions** | ADR Set v1.0 + ADR Addendum 016-019 + ADR Addendum 020-025 (with ADR-025 superseded) + **ADR Addendum 026** (us-east-1 primary, us-west-2 cold DR; supersedes ADR-025) | — |
| **System architecture** | System Architecture v1.2 | — |
| **Canonical data model** | Canonical Data Model v1.2 | — |
| **State machines** | State Machines v1.1 | — |
| **API surface** | OpenAPI v0.2 | — |
| **Cross-cutting contracts** | Contracts Pack v5.1 (12 contracts at v5.1; MARKET_LAUNCH at v5.0; README, Update Spec) | — |
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
| **Design Implementation Contract** | Design Implementation Contract v1.0 (PROVISIONAL) | — |
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
| **Artifact Registry** | Artifact Registry v2.9 | — |
| **Promotion Ledger** | Promotion Ledger (P-001 through P-007) | — |
| **Tenant Threading Addendum** | Tenant Threading Addendum v1.0 | — |
| **Adversarial Counsel Review** | Adversarial Counsel Review Sessions 1-3 v1.0 + Post-Remediation Review v1.0 | — |

---

## 4. Superseded artifacts — DO NOT IMPLEMENT FROM THESE

These files exist in the corpus for traceability but are NOT canonical. If you find yourself reading one, stop and read the canonical successor instead.

| Superseded file | Status | Read this instead |
|---|---|---|
| Telecheck_Master_Platform_PRD_v1_6.md | SUPERSEDED | Master Platform PRD v1.9 |
| Telecheck_Master_Platform_PRD_v1_7.md | SUPERSEDED | Master Platform PRD v1.9 |
| Telecheck_Master_Platform_PRD_v1_8.md | SUPERSEDED 2026-04-26 | Master Platform PRD v1.9 (region migration per ADR-026) |
| Telecheck_Canonical_Data_Model_v1_0.md | SUPERSEDED | Canonical Data Model v1.2 |
| Telecheck_Canonical_Data_Model_v1_1.md | SUPERSEDED | Canonical Data Model v1.2 |
| Telecheck_State_Machines_v1_0.md | SUPERSEDED | State Machines v1.1 |
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
| Telecheck_Artifact_Registry_v2_7.md (and earlier versions) | SUPERSEDED | Artifact Registry v2.9 |
| Telecheck_Artifact_Registry_v2_8.md | SUPERSEDED 2026-04-26 | Artifact Registry v2.9 (US Region Migration Cycle U-002) |
| Telecheck_Contracts_Pack_v5_*.md at v5.0 | SUPERSEDED | Same files at v5.1 (12 of 13) |

---

## 5. Document control

- **v1.0 (refreshed 2026-04-26, US Region Migration Cycle U-002)** — Refreshed to reflect ADR-026 ratification: Architecture row updated to add ADR Addendum 026; System Architecture row bumped v1.1→v1.2; Master Platform PRD row bumped v1.8→v1.9; Registry companion reference updated to v2.9; supersession list updated for Master PRD v1.8, System Architecture v1.1, Registry v2.8. Bundle file count not reasserted in U-002 — to be recomputed in Cycle U-004 from rebuilt bundle.
- **v1.0 (refreshed 2026-04-27, US Region Migration Cycle U-004)** — Bundle reference finalized: `Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip` with **75 markdown files** mechanically counted from filesystem. Placeholder from U-002 refresh replaced with actual values. No semantic content changes.
- **v1.0 (refreshed 2026-04-25, metadata-remediation cycle)** — Added §0 Authority hierarchy. Added bundle count and Contracts filename note in header.
- **v1.0 (original)** — NEW Active Document Index produced as remediation for Post-Remediation Adversarial Counsel Review finding MEDIUM-A. Provides single-page reference for canonicality of every Telecheck artifact. Companion to Artifact Registry v2.9.
- **Update cadence:** Every Registry version bump produces a corresponding Active Document Index update.
- **Authority:** This Index is canonical for *which* documents are active. The Registry is canonical for *what* the documents contain and how they relate. In conflict, Registry governs.
