# Telecheck — Project Upload Manifest (FINAL REMEDIATED)

**Version:** Final Remediated
**Date:** 2026-04-25
**Bundle:** Telecheck_Master_Bundle_FINAL_REMEDIATED.zip — **69 markdown files**
**Status:** Metadata remediation cycle complete; bundle ready for project upload as Claude Code control plane
**Filename note:** Contracts Pack files retain legacy `v5_00` filenames; **document headers declare v5.1 as canonical**.

---

## Authority hierarchy

When two documents conflict, resolve in this order (top wins):

1. **Active Document Index v1.0** — entry-point canonicality reference
2. **Artifact Registry v2.8** — canonical mapping with rationale
3. **Project Upload Manifest** (this document) — bundle inventory
4. **Engineering Handoff & Build Guide v1.2** — execution guide
5. All other documents — substantive specs

---

## Purpose of this manifest

This is the canonical inventory of files in the FINAL REMEDIATED Master Bundle. The bundle reflects the corpus state after:

1. Sessions 1–3 of multi-tenancy + Tier-1 ecom + dual-market scope expansion (Promotion Ledger P-005, P-006, P-007)
2. Adversarial Counsel Review v1.0 (23 findings: 5 CRITICAL, 7 HIGH, 7 MEDIUM, 4 LOW) — all closed
3. Post-Remediation Adversarial Counsel Review (gate PASSED: 0 CRITICAL, 0 HIGH residual)
4. **External reviewer follow-up metadata-remediation cycle** (this cycle) — Registry §3 staleness, count reconciliation, EHBG header parents, contracts filename convention, ADI as read-first anchor

**Three product decisions taken during remediation cycle:**

- **HIGH-11:** Design Implementation Contract v1.0 marked PROVISIONAL pending design file delivery
- **HIGH-12:** Heros migration removed from scope; Heros launches greenfield within Telecheck
- **Contracts filename convention:** Files retain `v5_00` naming for cross-reference stability; headers govern (v5.1)

---

## How to upload

1. Delete prior project knowledge contents (if doing a fresh load)
2. Upload all 69 files from the FINAL REMEDIATED bundle to the Claude project
3. **First read:** `Telecheck_Active_Document_Index_v1_0.md` — identifies canonical file for each topic
4. **Second read (for Claude Code):** `CLAUDE_CODE_BOOT_SEQUENCE.md` — execution rules and reading order
5. **Third read (for humans):** `Telecheck_Reviewer_Brief_v1_0.md` — 30-min orientation
6. **Fourth read:** `Telecheck_Artifact_Registry_v2_8.md` — canonical mapping with full rationale

---

## File inventory (69 files in FINAL REMEDIATED bundle)

### Cross-cutting / orientation (6 files)
- Telecheck_Active_Document_Index_v1_0.md — **READ FIRST** (canonicality reference)
- Telecheck_Artifact_Registry_v2_8.md
- Telecheck_Promotion_Ledger.md (P-001 through P-011)
- Telecheck_Reviewer_Brief_v1_0.md
- Telecheck_Adversarial_Counsel_Review_Sessions_1_to_3.md
- Telecheck_Adversarial_Counsel_Review_Sessions_1_to_3_Post_Remediation.md

### Product truth (6 files)
- Telecheck_Master_Platform_PRD_v1_8.md
- Telecheck_Red_Team_Review.md
- Telecheck_Flagged_Items_Resolution_v1_0.md
- Telecheck_Consolidated_Launch_Tracker_v1_0.md
- Telecheck_Operational_Readiness_Todo_v1_4.md
- Telecheck_Future_Scope_USSD_AI_Bridge_v0_1.md

### Architecture (4 files)
- Telecheck_ADR_Set_v1_0.md
- Telecheck_ADR_Addendum_016_to_019.md
- Telecheck_ADR_Addendum_020_to_025.md
- Telecheck_System_Architecture_v1_1.md

### Engineering specs (5 files)
- Telecheck_Canonical_Data_Model_v1_2.md
- Telecheck_State_Machines_v1_1.md
- Telecheck_OpenAPI_v0_2.md
- Telecheck_RBAC_Permissions_Matrix_v1_1.md
- Telecheck_Engineering_Handoff_Build_Guide_v1_2.md

### Domain specs (3 files)
- Telecheck_Identity_Authentication_Spec_v1_0.md
- Telecheck_Payment_Billing_Spec_v1_0.md
- Telecheck_Messaging_Inbox_Spec_v1_0.md

### Cross-cutting contracts (13 files)
- Telecheck_Contracts_Pack_v5_README.md
- Telecheck_Contracts_Pack_v5_00_INVARIANTS.md (v5.1)
- Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md (v5.1)
- Telecheck_Contracts_Pack_v5_00_DOMAIN_EVENTS.md (v5.1)
- Telecheck_Contracts_Pack_v5_00_ERROR_MODEL.md (v5.1)
- Telecheck_Contracts_Pack_v5_00_CCR_RUNTIME.md (v5.1)
- Telecheck_Contracts_Pack_v5_00_GLOSSARY.md (v5.1)
- Telecheck_Contracts_Pack_v5_00_TYPES.md (v5.1)
- Telecheck_Contracts_Pack_v5_00_IDEMPOTENCY.md (v5.1)
- Telecheck_Contracts_Pack_v5_00_AI_LAYERING.md (v5.1)
- Telecheck_Contracts_Pack_v5_00_FORMS_ENGINE.md (v5.1)
- Telecheck_Contracts_Pack_v5_00_GOVERNANCE_CONTROLS.md (v5.1)
- Telecheck_Contracts_Pack_v5_00_SOURCE_OF_TRUTH.md (v5.1)

### Slice PRDs (15 files)
- Telecheck_AI_Clinical_Assistant_Slice_PRD_v1_0.md (+ Tenant Threading Addendum §3.1)
- Telecheck_Async_Consult_Slice_PRD_v1_0.md (+ Addendum §3.2)
- Telecheck_Sync_Video_Consult_Slice_PRD_v1_0.md (+ Addendum §3.3)
- Telecheck_Pharmacy_Refill_Slice_PRD_v2_1.md
- Telecheck_Forms_Intake_Engine_Slice_PRD_v2_1.md
- Telecheck_Medication_Interaction_Engine_Slice_PRD_v1_0.md (+ Addendum §3.8)
- Telecheck_Herb_Drug_Interaction_Engine_Slice_PRD_v1_0.md (+ Addendum §3.9)
- Telecheck_Adverse_Event_Reporting_Slice_PRD_v1_0.md (+ Addendum §3.6)
- Telecheck_Consent_Delegated_Access_Slice_PRD_v1_0.md (+ Addendum §3.7)
- Telecheck_Labs_Document_Interpretation_Slice_PRD_v1_0.md (+ Addendum §3.10)
- Telecheck_RPM_CCM_Slice_PRD_v1_0.md (+ Addendum §3.4)
- Telecheck_Community_Platform_Slice_PRD_v1_0.md (+ Addendum §3.5)
- Telecheck_Acquisition_Engagement_Tools_Slice_PRD_v1_0.md (+ Addendum §3.12)
- Telecheck_Fake_Medication_Detection_Slice_PRD_v1_0.md (+ Addendum §3.11)
- Telecheck_Tenant_Threading_Addendum_v1_0.md

### Admin (4 files)
- Telecheck_Admin_Backend_Slice_PRD_v1_1.md
- Telecheck_Admin_Configuration_Surfaces_Slice_PRD_v1_0.md
- Telecheck_Market_Rollout_Cockpit_Slice_PRD_v1_0.md
- Telecheck_Admin_Operator_IA_v1_1.md
- Telecheck_Unified_Admin_Sidebar_v1_0.md

### Experience (4 files)
- Telecheck_Patient_App_IA_v1_0.md (+ Addendum §3.13)
- Telecheck_Clinician_Portal_IA_v1_0.md (+ Addendum §3.14)
- Telecheck_Design_System_v1_1.md
- Telecheck_Design_Implementation_Contract_v1_0.md (PROVISIONAL)

### Operations (4 files)
- Telecheck_Ghana_Launch_Playbook_v1_1.md
- Telecheck_Protocol_Library_Ghana_v1_0.md
- Telecheck_Guardrail_Templates_v1_0.md
- Telecheck_Notification_Spec_v1_1.md

### Investor / external (1 file)
- Telecheck_Investor_One_Pager.md

---

## What changed from prior Master Bundle

Compared to the bundle produced at end of Session 3 (Registry v2.7):

**Version bumps (15 files):**
- Master PRD v1.8 → v1.8
- CDM v1.1 → v1.2
- State Machines v1.1 → v1.1
- OpenAPI v0.2 → v0.2
- Pharmacy + Refill v2.1 → v2.1
- Forms Engine v2.1 → v2.1
- Admin Backend v1.1 → v1.1
- Admin Operator IA v1.1 → v1.1
- Notification Spec v1.1 → v1.1
- Ghana Launch Playbook v1.1 → v1.1
- Design System v1.1 → v1.1
- EHBG v1.1 → v1.2
- Registry v2.7 → v2.8
- Promotion Ledger updated (P-009, P-010, P-011)
- OR Tracker v1.4 → v1.4

**Contract pack updates (12 files at v5.1):**
INVARIANTS, AUDIT_EVENTS, DOMAIN_EVENTS, ERROR_MODEL, CCR_RUNTIME, GLOSSARY, TYPES, IDEMPOTENCY, AI_LAYERING, FORMS_ENGINE, GOVERNANCE_CONTROLS, SOURCE_OF_TRUTH (MARKET_LAUNCH unchanged at v5.0)

**New artifacts (5 files):**
- Tenant Threading Addendum v1.0 (per CRITICAL-05)
- Unified Admin Sidebar v1.0 (per HIGH-10)
- Active Document Index v1.0 (per Post-Remediation MEDIUM-A)
- Adversarial Counsel Review Sessions 1–3 v1.0
- Adversarial Counsel Review Sessions 1–3 Post-Remediation v1.0

**Status change (1 file):**
- Design Implementation Contract v1.0 status changed to PROVISIONAL (per HIGH-11 product decision)

**Scope removal:**
- Heros migration removed entirely from scope per HIGH-12 product decision. OR-235, OR-311 marked removed in OR Tracker v1.4. EHBG v1.2 sprint plan reduced from 26 weeks to 24 weeks. Master PRD v1.8 reframes "Heros migrating from Rimo" → "Heros launches greenfield."

---

## Files NO LONGER in the Master Bundle (superseded — see Active Document Index v1.0 §4)

These files were in prior Master Bundles and are now superseded. They should NOT be uploaded as project knowledge:

- Master PRD v1.6, v1.7
- Canonical Data Model v1.0, v1.1
- State Machines v1.1
- OpenAPI v0.2
- System Architecture v1.0
- RBAC Permissions Matrix v1.0
- Refill Slice PRD v1.0 (consolidated into Pharmacy + Refill v2.1)
- Pharmacy Portal Slice PRD v1.0 (consolidated into Pharmacy + Refill v2.1)
- Forms Intake Engine Slice PRD v1.0, v2.0
- Pharmacy + Refill Slice PRD v2.1
- Admin Backend Slice PRD v1.1
- Admin Operator IA v1.1
- Notification Spec v1.1
- Ghana Launch Playbook v1.1
- Design System v1.1
- Engineering Handoff Build Guide v1.0, v1.1
- Artifact Registry v2.4, v2.5, v2.6, v2.7
- OR Tracker v1.0, v1.1, v1.2, v1.3
- Contracts Pack v5.0 versions of the 12 updated contracts

---

## Verification

This Master Bundle was produced after the verification gate per remediation prompt §7 PASSED (0 CRITICAL, 0 HIGH residual findings). The 5 MEDIUM and 3 LOW residual findings from the Post-Remediation Review are explicitly enumerated in P-011 with remediation plans for next cycle; none block zip production per the prompt's threshold.

The Adversarial Counsel Review v1.0 and its Post-Remediation companion are included in the bundle as historical record of the remediation cycle.
