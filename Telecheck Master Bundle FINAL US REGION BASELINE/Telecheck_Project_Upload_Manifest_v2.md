# Telecheck — Project Upload Manifest v2

**Version:** 2 (mechanically generated from filesystem inventory in Cycle U-004; regenerated in Round 3 after F-U004-R2-01/02/03 fixes applied to control-plane docs)
**Generated:** 2026-04-27 (Round 3 regeneration; filesystem unchanged from Round 2 — 75 files; only in-place content edits to Boot Sequence, Validation Report, Release Notes, Promotion Ledger)
**Bundle:** `Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip`
**Workstream:** Telecheck — Single-Region US Primary Baseline Finalization (cycle-ID prefix retains "US Region Migration" for audit-trail continuity; current-state framing is "baseline finalization")
**Cycle:** U-004 Round 3 (final cycle of workstream; in-flight at time of this regeneration)
**Final file count:** 75 markdown files (mechanically counted from `ls *.md | wc -l`)
**Source bundle:** `Telecheck_Master_Bundle_U003_R2_FOR_CODEX_REVIEW.zip` (md5 `09c9941fd3360806e5a47407dcc5c42f`; U-003 Codex-verified PASS)
**Format:** Markdown
**Generation method:** This manifest is generated mechanically from `os.listdir('.')` filtered to `.md` files, then sorted alphabetically. It is not hand-edited prose. Per workstream methodology learning #2 (manifests must be rebuilt from filesystem, not hand-edited), this manifest reflects filesystem reality at bundle-build time. Drift between this manifest and the bundle filesystem is a defect.
**Filename note:** Contracts Pack files retain legacy `v5_00` filename pattern; document headers declare v5.1 as canonical. Headers govern; filenames are stable for cross-reference continuity.

---

## Manifest provenance

| Field | Value |
|---|---|
| Source bundle | `Telecheck_Master_Bundle_U003_R2_FOR_CODEX_REVIEW.zip` |
| Source bundle md5 | `09c9941fd3360806e5a47407dcc5c42f` |
| Cycle producing this manifest | U-004 Round 3 |
| Generation timestamp | 2026-04-27 (Round 3 regeneration) |
| Total files | 75 |
| New files added in U-004 | 3 (this manifest, release notes, validation report) |
| Files renamed in U-004 Round 2 | 2 (`..._US_REGION_MIGRATION.md` → `..._US_REGION_BASELINE.md` for both validation report and release notes) |
| Files renamed in U-004 Round 3 | 0 |
| Files demoted to historical in U-004 | 2 (`..._FINAL_REMEDIATED.md` release notes, `..._Post_Remediation.md` manifest) |
| Files deleted in U-004 | 0 |
| Files edited in place in U-004 Round 3 | 4 (CLAUDE_CODE_BOOT_SEQUENCE.md, TELECHECK_VALIDATION_REPORT_US_REGION_BASELINE.md, TELECHECK_RELEASE_NOTES_US_REGION_BASELINE.md, Telecheck_Promotion_Ledger.md) |

---

## Inventory (alphabetical by filename)

| # | Filename | Status |
|---|---|---|
| 1 | `CLAUDE_CODE_BOOT_SEQUENCE.md` | canonical |
| 2 | `TELECHECK_RELEASE_NOTES_FINAL_REMEDIATED.md` | historical (superseded by TELECHECK_RELEASE_NOTES_US_REGION_BASELINE.md) |
| 3 | `TELECHECK_RELEASE_NOTES_US_REGION_BASELINE.md` | canonical |
| 4 | `TELECHECK_VALIDATION_REPORT_US_REGION_BASELINE.md` | canonical |
| 5 | `Telecheck_ADR_Addendum_016_to_019.md` | canonical |
| 6 | `Telecheck_ADR_Addendum_020_to_025.md` | canonical |
| 7 | `Telecheck_ADR_Addendum_026.md` | canonical |
| 8 | `Telecheck_ADR_Set_v1_0.md` | canonical |
| 9 | `Telecheck_AI_Clinical_Assistant_Slice_PRD_v1_0.md` | canonical |
| 10 | `Telecheck_Acquisition_Engagement_Tools_Slice_PRD_v1_0.md` | canonical |
| 11 | `Telecheck_Active_Document_Index_v1_0.md` | canonical |
| 12 | `Telecheck_Admin_Backend_Slice_PRD_v1_1.md` | canonical |
| 13 | `Telecheck_Admin_Configuration_Surfaces_Slice_PRD_v1_0.md` | canonical |
| 14 | `Telecheck_Admin_Operator_IA_v1_1.md` | canonical |
| 15 | `Telecheck_Adversarial_Counsel_Review_Sessions_1_to_3.md` | canonical |
| 16 | `Telecheck_Adversarial_Counsel_Review_Sessions_1_to_3_Post_Remediation.md` | canonical |
| 17 | `Telecheck_Adverse_Event_Reporting_Slice_PRD_v1_0.md` | canonical |
| 18 | `Telecheck_Artifact_Registry_v2_9.md` | canonical |
| 19 | `Telecheck_Async_Consult_Slice_PRD_v1_0.md` | canonical |
| 20 | `Telecheck_Canonical_Data_Model_v1_2.md` | canonical |
| 21 | `Telecheck_Clinician_Portal_IA_v1_0.md` | canonical |
| 22 | `Telecheck_Community_Platform_Slice_PRD_v1_0.md` | canonical |
| 23 | `Telecheck_Consent_Delegated_Access_Slice_PRD_v1_0.md` | canonical |
| 24 | `Telecheck_Consolidated_Launch_Tracker_v1_0.md` | canonical |
| 25 | `Telecheck_Contracts_Pack_v5_00_AI_LAYERING.md` | canonical |
| 26 | `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md` | canonical |
| 27 | `Telecheck_Contracts_Pack_v5_00_CCR_RUNTIME.md` | canonical |
| 28 | `Telecheck_Contracts_Pack_v5_00_DOMAIN_EVENTS.md` | canonical |
| 29 | `Telecheck_Contracts_Pack_v5_00_ERROR_MODEL.md` | canonical |
| 30 | `Telecheck_Contracts_Pack_v5_00_FORMS_ENGINE.md` | canonical |
| 31 | `Telecheck_Contracts_Pack_v5_00_GLOSSARY.md` | canonical |
| 32 | `Telecheck_Contracts_Pack_v5_00_GOVERNANCE_CONTROLS.md` | canonical |
| 33 | `Telecheck_Contracts_Pack_v5_00_IDEMPOTENCY.md` | canonical |
| 34 | `Telecheck_Contracts_Pack_v5_00_INVARIANTS.md` | canonical |
| 35 | `Telecheck_Contracts_Pack_v5_00_MARKET_LAUNCH.md` | canonical |
| 36 | `Telecheck_Contracts_Pack_v5_00_SOURCE_OF_TRUTH.md` | canonical |
| 37 | `Telecheck_Contracts_Pack_v5_00_TYPES.md` | canonical |
| 38 | `Telecheck_Contracts_Pack_v5_README.md` | canonical |
| 39 | `Telecheck_Contracts_Pack_v5_Update_Spec.md` | canonical |
| 40 | `Telecheck_Design_Implementation_Contract_v1_0.md` | canonical |
| 41 | `Telecheck_Design_System_v1_1.md` | canonical |
| 42 | `Telecheck_Engineering_Handoff_Build_Guide_v1_3.md` | canonical |
| 43 | `Telecheck_Fake_Medication_Detection_Slice_PRD_v1_0.md` | canonical |
| 44 | `Telecheck_Flagged_Items_Resolution_v1_0.md` | canonical |
| 45 | `Telecheck_Forms_Intake_Engine_Slice_PRD_v2_1.md` | canonical |
| 46 | `Telecheck_Future_Scope_USSD_AI_Bridge_v0_1.md` | canonical |
| 47 | `Telecheck_Ghana_Launch_Playbook_v1_2.md` | canonical |
| 48 | `Telecheck_Guardrail_Templates_v1_0.md` | canonical |
| 49 | `Telecheck_Herb_Drug_Interaction_Engine_Slice_PRD_v1_0.md` | canonical |
| 50 | `Telecheck_Identity_Authentication_Spec_v1_0.md` | canonical |
| 51 | `Telecheck_Investor_One_Pager.md` | canonical |
| 52 | `Telecheck_Labs_Document_Interpretation_Slice_PRD_v1_0.md` | canonical |
| 53 | `Telecheck_Market_Rollout_Cockpit_Slice_PRD_v1_0.md` | canonical |
| 54 | `Telecheck_Master_Platform_PRD_v1_9.md` | canonical |
| 55 | `Telecheck_Medication_Interaction_Engine_Slice_PRD_v1_0.md` | canonical |
| 56 | `Telecheck_Messaging_Inbox_Spec_v1_0.md` | canonical |
| 57 | `Telecheck_Notification_Spec_v1_1.md` | canonical |
| 58 | `Telecheck_OpenAPI_v0_2.md` | canonical |
| 59 | `Telecheck_Operational_Readiness_Todo_v1_5.md` | canonical |
| 60 | `Telecheck_Patient_App_IA_v1_0.md` | canonical |
| 61 | `Telecheck_Payment_Billing_Spec_v1_0.md` | canonical |
| 62 | `Telecheck_Pharmacy_Refill_Slice_PRD_v2_1.md` | canonical |
| 63 | `Telecheck_Project_Upload_Manifest_Post_Remediation.md` | historical (superseded by Telecheck_Project_Upload_Manifest_v2.md) |
| 64 | `Telecheck_Project_Upload_Manifest_v2.md` | canonical |
| 65 | `Telecheck_Promotion_Ledger.md` | canonical |
| 66 | `Telecheck_Protocol_Library_Ghana_v1_0.md` | canonical |
| 67 | `Telecheck_RBAC_Permissions_Matrix_v1_1.md` | canonical |
| 68 | `Telecheck_RPM_CCM_Slice_PRD_v1_0.md` | canonical |
| 69 | `Telecheck_Red_Team_Review.md` | canonical |
| 70 | `Telecheck_Reviewer_Brief_v1_0.md` | canonical |
| 71 | `Telecheck_State_Machines_v1_1.md` | canonical |
| 72 | `Telecheck_Sync_Video_Consult_Slice_PRD_v1_0.md` | canonical |
| 73 | `Telecheck_System_Architecture_v1_2.md` | canonical |
| 74 | `Telecheck_Tenant_Threading_Addendum_v1_0.md` | canonical |
| 75 | `Telecheck_Unified_Admin_Sidebar_v1_0.md` | canonical |

---

## File count by category

| Category | Count |
|---|---|
| Master PRD | 1 |
| Registry | 1 |
| Active Document Index | 1 |
| Reviewer Brief | 1 |
| Manifest (current + historical) | 2 |
| Release Notes (current + historical) | 2 |
| Validation Report | 1 |
| Promotion Ledger | 1 |
| Boot / Tooling | 1 |
| Architecture decisions (ADR Set + 3 Addenda) | 4 |
| System Architecture | 1 |
| Canonical Data Model | 1 |
| State Machines | 1 |
| OpenAPI | 1 |
| RBAC Permissions Matrix | 1 |
| Contracts Pack (modular, v5.1 with legacy v5_00 filenames) | 15 |
| Engineering Handoff & Build Guide | 1 |
| Operational Readiness Tracker | 1 |
| Tenant Threading Addendum | 1 |
| Unified Admin Sidebar | 1 |
| Design System | 1 |
| Design Implementation Contract | 1 |
| Information Architecture (Patient + Clinician + Admin Operator) | 3 |
| Notification Spec | 1 |
| Payment & Billing Spec | 1 |
| Identity & Authentication Spec | 1 |
| Messaging & Inbox Spec | 1 |
| Slice PRDs | 17 |
| Ghana Launch Playbook | 1 |
| Protocol Library Ghana | 1 |
| Guardrail Templates | 1 |
| Consolidated Launch Tracker | 1 |
| External Communications (Investor One Pager) | 1 |
| Red Team Review | 1 |
| Flagged Items Resolution | 1 |
| Future Scope | 1 |
| Adversarial Counsel Reviews | 2 |
| **Total** | **75** |

---

## Canonical version map (current versions in this bundle)

| Artifact | Canonical version |
|---|---|
| Master Platform PRD | v1.9 |
| Artifact Registry | v2.9 |
| Active Document Index | v1.0 (refreshed 2026-04-26 for U-002; bundle reference finalized 2026-04-27 in U-004; supersession table corrected in U-004 Round 2) |
| Reviewer Brief | v1.0 (refreshed 2026-04-26 for U-003; Ghana Launch Playbook pointer corrected in U-004 Round 2) |
| Boot Sequence | (no version; refreshed 2026-04-27 in U-003 for ADR-026; EHBG version-name pointer corrected in U-004 Round 2; EHBG and Master PRD filename-notation pointers on lines 15-16 corrected in U-004 Round 3) |
| ADR Set | v1.0 |
| ADR Addendum 016–019 | v1.0 |
| ADR Addendum 020–025 | v1.0 (with ADR-025 superseded by ADR-026 on 2026-04-26) |
| ADR Addendum 026 | v1.0 (NEW; ratifies single-region us-east-1 primary, us-west-2 cold DR; supersedes ADR-025) |
| System Architecture | v1.2 |
| Canonical Data Model | v1.2 |
| State Machines | v1.1 |
| OpenAPI | v0.2 |
| RBAC Permissions Matrix | v1.1 |
| Contracts Pack | v5.1 (modular; 13 files at v5.1 + MARKET_LAUNCH at v5.0 + Update_Spec) |
| Engineering Handoff & Build Guide | v1.3 |
| Operational Readiness Tracker | v1.5 |
| Tenant Threading Addendum | v1.0 (refreshed 2026-04-26 for U-003) |
| Unified Admin Sidebar | v1.0 |
| Design System | v1.1 |
| Design Implementation Contract | v1.0 (PROVISIONAL pending design file delivery) |
| Patient App IA | v1.0 |
| Clinician Portal IA | v1.0 |
| Admin Operator IA | v1.1 |
| Notification Spec | v1.1 |
| Payment & Billing Spec | v1.0 |
| Identity & Authentication Spec | v1.0 |
| Messaging & Inbox Spec | v1.0 |
| Forms / Intake Engine Slice PRD | v2.1 |
| Pharmacy + Refill Slice PRD | v2.1 |
| Admin Backend Slice PRD | v1.1 |
| AI Clinical Assistant Slice PRD | v1.0 |
| Async Consult Slice PRD | v1.0 |
| Sync Video Consult Slice PRD | v1.0 |
| RPM/CCM Slice PRD | v1.0 |
| Community Platform Slice PRD | v1.0 |
| Adverse Event Reporting Slice PRD | v1.0 |
| Consent & Delegated Access Slice PRD | v1.0 |
| Medication Interaction Engine Slice PRD | v1.0 |
| Herb-Drug Interaction Engine Slice PRD | v1.0 |
| Labs Document Interpretation Slice PRD | v1.0 |
| Fake Medication Detection Slice PRD | v1.0 |
| Acquisition & Engagement Tools Slice PRD | v1.0 |
| Admin Configuration Surfaces Slice PRD | v1.0 |
| Market Rollout Cockpit Slice PRD | v1.0 |
| Ghana Launch Playbook | v1.2 |
| Protocol Library Ghana | v1.0 |
| Guardrail Templates | v1.0 |
| Consolidated Launch Tracker | v1.0 |
| Future Scope: USSD + AI Bridge | v0.1 |
| Promotion Ledger | v1.0 |
| Adversarial Counsel Review (Sessions 1-3) | v1.0 |
| Adversarial Counsel Review (Sessions 1-3 Post-Remediation) | v1.0 |

---

## Document control

- **v2 (regenerated 2026-04-27 Round 6)** — Regenerated mechanically from `os.listdir('.')` after Round 6 narrow metadata cleanup. Filesystem unchanged at 75 files; no renames or deletions. Round 6 fixed: Registry §3 row 64 "Through P-011 / P-001 through P-011 entries" → "Through P-007 / P-001 through P-007 entries" with explicit F-U004-01 anomaly note; ADI §3 "Promotion Ledger (P-001 through P-011)" → "P-001 through P-007"; Validation Report §11 closing statement stale "Round 4 follows" / "rebuilt Round 4 bundle" → "Round 5 follows" / "rebuilt Round 5 bundle" (and Round 6 doc-control entry added).
- **v2 (regenerated 2026-04-27 Round 5)** — Regenerated mechanically from `os.listdir('.')` after Round 5 narrow metadata cleanup per Codex Round 4 findings F-U004-R4-01/02/03. Filesystem unchanged at 75 files; no renames or deletions. Round 5 fixed: Registry §7 line 366 ("Release Notes US Region Migration, Validation Report US Region Migration" → BASELINE names per actual file inventory), Release Notes methodology count (11 → 13 with new entries #12 and #13 added to numbered list), Handoff packet methodology-count inconsistencies (lines 43/94/262 stale "11") and stale "Round 3 PASS" claims (lines 44/228) and incorrect bit-identical math (line 63: 69 → 67 with explicit list of 5 edited files including Boot Sequence and Reviewer Brief).
- **v2 (regenerated 2026-04-27 Round 4)** — Regenerated mechanically from `os.listdir('.')` after Round 4 full control-plane packaging cleanup pass per user directive. Filesystem unchanged at 75 files; no renames or deletions in Round 4. Round 4 scope: (a) verified Round 3 fixes were correctly persisted on disk (author-gate found Boot Sequence lines 15–16 already correct, Release Notes already consistent, Validation Report Section 6 already rewritten); (b) ran broader-scope scan across all 8 files in Round 4 mandatory scope (CLAUDE_CODE_BOOT_SEQUENCE.md, Registry, ADI, Validation Report, Release Notes, this Manifest, Promotion Ledger, Codex handoff packet) in BOTH notation classes (filename `*.md` AND version-name `vN.N`); (c) classified every hit per directive's classification rule; (d) confirmed zero current-truth defects (all hits acceptable historical/changelog/supersession/prior-round-audit-trail); (e) stripped premature PASS language from Validation Report Sections 1–6 per directive's strict no-PASS-pre-Codex rule; (f) updated Release Notes U-004 cycle history row to Round 4 status. Authored under standing §10 decision-owner ruling (2026-04-27).
- **v2 (regenerated 2026-04-27 Round 3)** — Regenerated mechanically from `os.listdir('.')` after Round 3 fixes to Boot Sequence (lines 15–16 stale filename pointers per Codex F-U004-R2-01), Validation Report Section 6 (rewrite per Codex F-U004-R2-02), Release Notes line 40 cycle-history-table U-004 entry (corrected internal inconsistency per Codex F-U004-R2-03), and Promotion Ledger P-007 entry (Round 3 disposition). Filesystem unchanged at 75 files; no renames or deletions in Round 3. Per Round 2 self-finding F-U004-R2-self-01, Round 3 broader-scope scan covered both notation classes (filename `*.md` AND version-name `vN.N`) for same canonical references.
- **v2 (regenerated 2026-04-27 Round 2 post-rename)** — Earlier regeneration after the validation report and release notes files were renamed from `..._US_REGION_MIGRATION.md` to `..._US_REGION_BASELINE.md` per framing-correction directive. Codex Round 2 returned 3 findings; superseded by Round 3 regeneration above.
- **v2 (regenerated 2026-04-27 post-validation-report-write)** — Earlier regeneration after all three new U-004 files existed on disk. Superseded.
- **v2 (initial draft)** — Earlier provisional draft. Superseded.
- **Generation rule:** Every Cycle U-NNN that touches the bundle file set must regenerate this manifest from filesystem, not edit it as prose. This is binding methodology.
