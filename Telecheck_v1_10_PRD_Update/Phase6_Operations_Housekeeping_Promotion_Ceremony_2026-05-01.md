# Phase 6 — Operations Housekeeping + v1.10 Promotion Ceremony

**Version:** 1.0 RECONCILED — proposed Phase 6 ceremony plan + control-plane delta artifacts
**Date:** 2026-05-01
**Reconciliation owner:** Workstream lead (Evans) via Claude proxy
**Approval owner (audit-B):** Engineering Lead + Product Lead + Privacy Officer + Clinical Safety Officer (per I-015 dual-control across the multi-domain promotion ceremony)
**Purpose:** Document the v1.10 promotion ceremony — the physical landing of all v1.10 cycle work into the canonical `Telecheck Master Bundle FINAL US REGION BASELINE/`. Phase 6 is the final cycle phase; once executed, v1.10 is canonical and the workstream closes.

---

## ⚠️ Pre-execution authorization gate

The bundle is locked-down ("FINAL US REGION BASELINE"); Phase 6 is the only phase that physically modifies bundle files. Per CLAUDE.md hard editing rules: "v1.10 promotion is a multi-phase ceremony per the planning freeze. Each phase has dual-control sign-off requirements per I-015."

**This artifact authors the ceremony plan + control-plane delta updates (Registry/Index/Ledger/Boot) but does NOT physically modify bundle files.** The substantive content merge (Master PRD rename, contracts merge, ADRs merge, slice PRDs merge, country regulatory placeholders add) requires Evans's explicit "execute promotion" authorization beyond the per-phase advance authorization that has driven Phases 0-5.

The matrix has 107/107 data rows Approved. Phase 6 is mechanical given the documented deltas; the gate is procedural, not analytical.

---

## 1 · Ceremony scope

### 1.1 — Files added to bundle (new artifacts)

| New file | Source delta artifact | Notes |
|---|---|---|
| `Telecheck_ADR_027_Country_Conditional_DTC_Marketing.md` | `Telecheck_ADR_027_Country_Conditional_DTC_Marketing_DRAFT.md` v0.6 | Drop _DRAFT suffix; bump to Status: Accepted |
| `Telecheck_ADR_028_Research_Data_Partnership_Posture_A.md` | `Telecheck_ADR_028_Research_Data_Partnership_Posture_A_DRAFT.md` v0.5 | Drop _DRAFT suffix; bump to Status: Accepted |
| `Telecheck_ADR_029_AI_Workload_Taxonomy.md` | `Telecheck_ADR_029_AI_Workload_Taxonomy_DRAFT.md` v0.4 | Drop _DRAFT suffix; bump to Status: Accepted |
| `Telecheck_Contracts_Pack_v5_00_WORKLOAD_TAXONOMY.md` | `Telecheck_Contracts_Pack_v5_00_WORKLOAD_TAXONOMY_DRAFT.md` v0.4 | Drop _DRAFT suffix; bump header to v5.2 |
| `Telecheck_Contracts_Pack_v5_00_AUTONOMY_LEVELS.md` | `Telecheck_Contracts_Pack_v5_00_AUTONOMY_LEVELS_DRAFT.md` v0.4.1 | Drop _DRAFT suffix; bump header to v5.2 |
| `Telecheck_Master_Platform_PRD_v1_10.md` | `Telecheck_v1_10_PRD_Update/Telecheck_Master_Platform_PRD_v1_10.md` (canonical post-Phase-2) | Move into bundle; v1.9 demoted to Superseded per Active Document Index §4 |
| `Telecheck_Program_Porting_Checklist_GLP1_v1_0.md` | Already authored at `Telecheck_v1_10_PRD_Update/Telecheck_Program_Porting_Checklist_GLP1_v1_0.md` | Move into bundle |
| `Telecheck_Country_Regulatory_Contracts.md` | NEW placeholder per Phase 5 group 5F row 104 | Author at minimal-content-at-launch state per ADR-027 Tier 2 framing |
| `Telecheck_Pharmacy_Council_Guidance.md` | NEW placeholder per Phase 5 group 5F row 105 | Author at minimal-content-at-launch state per ADR-027 Tier 2 framing |
| `Telecheck_DSA_Template.md` | NEW placeholder per Phase 5 group 5F row 106 | Author at minimal-content-at-launch state per ADR-028 §4 framing |
| `Telecheck_REC_IRB_Engagement.md` | NEW placeholder per Phase 5 group 5F row 107 | Author at minimal-content-at-launch state per ADR-028 §2 framing |
| `Telecheck_Design_Implementation_Contract_v1_1.md` | DIC v1.0 → v1.1 promotion per Evans Option B 2026-04-28 (Phase 5.6 / F49) | Status: Canonical for development; v1.0 demoted to Superseded — see §3.5 below for physical convention (rename vs copy+supersede) |

### 1.2 — Files modified in bundle (edits per Phase 3 + Phase 5 deltas)

**Contracts Pack v5.1 → v5.2** (10 existing files; per Phase 3 group-1, group-2, group-3 deltas):

- INVARIANTS — add I-029, I-030, I-031 per `Phase3_INVARIANTS_v1_10_Edits_2026-05-01.md`
- AUDIT_EVENTS — add envelope fields + 6 research events + 2 marketing events + audit_sensitivity_level + new actor_type=ai_workload + I-012 audit-side rule per `Phase3_AUDIT_EVENTS_v1_10_Edits_2026-05-01.md`
- TYPES — add Marketing/Research/AI workload/Program catalog types + 8 new ID prefixes per `Phase3_Group2_Contracts_v1_10_Edits_2026-05-01.md` §TYPES
- CCR_RUNTIME — add 4-key marketing block + 7-key research block + change-control rows + initial values per launch country per `Phase3_Group2_Contracts_v1_10_Edits_2026-05-01.md` §CCR_RUNTIME
- GLOSSARY — fold in 37 new terms across 4 new sections + amendments to existing v5.1 stale entries per `Phase3_Group2_Contracts_v1_10_Edits_2026-05-01.md` §GLOSSARY + `Phase2_F13_Glossary_Reconciled_2026-05-01.md`
- AI_LAYERING — add §10 Future Workload Expansion per `Phase3_Group2_Contracts_v1_10_Edits_2026-05-01.md` §AI_LAYERING
- DOMAIN_EVENTS — add 4 research events + 2 marketing events per `Phase3_Group3_Contracts_v1_10_Edits_2026-05-01.md` §DOMAIN_EVENTS
- FORMS_ENGINE — research consent integration + I-030 enforcement + Master PRD §10.5 cross-ref per `Phase3_Group3_Contracts_v1_10_Edits_2026-05-01.md` §FORMS_ENGINE
- MARKET_LAUNCH — Master PRD §10.5 cross-ref + ADR-027 marketing activation gate (6 conditions) + ADR-028 research activation gate (11 conditions) per `Phase3_Group3_Contracts_v1_10_Edits_2026-05-01.md` §MARKET_LAUNCH (this file goes v5.0 → v5.1)
- GOVERNANCE_CONTROLS — research export CONFIG/INCIDENT/SIGNAL controls + PolicyAuthorization placeholder per `Phase3_Group3_Contracts_v1_10_Edits_2026-05-01.md` §GOVERNANCE_CONTROLS

**ERROR_MODEL + IDEMPOTENCY:** preserved unchanged at v5.1 (no v1.10 cycle deltas per Phase 3 group-3 note).

**Engineering specs (5 existing files; per Phase 5 group 5B):**

- `Telecheck_Canonical_Data_Model_v1_2.md` — tenant entity reference cleanup + research entities + AIExecution entity per Phase 5 5B rows 27, 70, 98
- `Telecheck_State_Machines_v1_1.md` — research state machines + ProtocolAuthorizedAction lifecycle with §13.7 reject-unless three-clause rule per Phase 5 5B rows 71, 97
- `Telecheck_OpenAPI_v0_2.md` — tenant URI cleanup + research endpoints with high_pii audit per Phase 5 5B rows 28, 74
- `Telecheck_RBAC_Permissions_Matrix_v1_1.md` — tenant scoping cleanup + 3 research roles per Phase 5 5B rows 29, 73
- `Telecheck_System_Architecture_v1_2.md` — cross-border posture cleanup + research data module per Phase 5 5B rows 42, 72
- `Telecheck_Tenant_Threading_Addendum_v1_0.md` — `Heros-Health` → `Telecheck-US` sweep per Phase 5 5B row 31

**Slice PRDs (24 row edits across 14 files; per Phase 5 group 5A):**

All slice PRD edits per `Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` §Group 5A. New §N sections in: Acquisition Engagement Tools (country-conditional marketing surface logic), Admin Configuration Surfaces (marketing config admin), Consent & Delegated Access (5th tier), Forms/Intake Engine (research consent block + Program porting workflow). Terminology rewrites in: RPM/CCM, Herb-Drug Interaction Engine, Adverse Event Reporting, Community Platform, Pharmacy + Refill, Market Rollout Cockpit, Admin Backend, Forms/Intake Engine, AI Clinical Assistant.

**Design (3 row edits across 2 files; per Phase 5 group 5C):**

- `Telecheck_Design_System_v1_1.md` — brand tokens cleanup + Heros consumer-brand identity tokens per Phase 5 5C rows 20, 33
- `Telecheck_Design_Implementation_Contract_v1_0.md` → preserved at existing path; new file `Telecheck_Design_Implementation_Contract_v1_1.md` authored at canonical path per copy + supersede convention (see §3.5) — DIC v1.0 → v1.1 promotion (status flip PROVISIONAL → "Canonical for development"; multi-tenant brand variations updated) per Phase 5 5C rows 44, 108

**Operational Readiness (3 row edits in 1 file; per Phase 5 group 5D):**

- `Telecheck_Operational_Readiness_Todo_v1_5.md` — OR-109 wording cleanup + 3 new C4 marketing OR items + 5 new C5 research OR items per Phase 5 5D rows 45, 55, 75

**Other docs (23 row edits across 9 files; per Phase 5 group 5E):**

- `Telecheck_Reviewer_Brief_v1_0.md` — 4 things → 5 things; orienting sections for C3/C4/C5/C6
- `Telecheck_Notification_Spec_v1_1.md` — WhatsApp framing + sender display name cleanup
- `Telecheck_Ghana_Launch_Playbook_v1_2.md` — concrete pilot Ghana refs preserved; brand framing updated
- `Telecheck_Investor_One_Pager.md` — anchor market reframe + brand structure + Posture A as Release 2
- `Telecheck_Patient_App_IA_v1_0.md` — brand presentation distinction
- `Telecheck_Engineering_Handoff_Build_Guide_v1_3.md` — tenant identifier naming + Master PRD §10.5 architectural anchor
- `Telecheck_Messaging_Inbox_Spec_v1_0.md` — sender brand framing
- `Telecheck_Artifact_Registry_v2_9.md` → bumped to v2.10 (see §1.3 below)
- `CLAUDE_CODE_BOOT_SEQUENCE.md` — brand-structure orientation note (see §1.3 below)

### 1.3 — Control-plane updates (4 files)

The 4 control-plane updates that finalize the v1.10 promotion ceremony — these are documented as deltas in §3 below and ready for physical merge:

1. **`Telecheck_Artifact_Registry_v2_9.md` → `Telecheck_Artifact_Registry_v2_10.md`** (rename + content updates per §3.1)
2. **`Telecheck_Active_Document_Index_v1_0.md`** edited in place per §3.2 (add new artifacts; demote v1.9 PRD; add DIC v1.0 to §4 Superseded with successor v1.1)
3. **`Telecheck_Promotion_Ledger.md`** appended with entry P-008 per §3.3 (v1.9 → v1.10 promotion + 3 new ADRs + DIC v1.0 → v1.1 fold-in per Evans Option B 2026-04-28)
4. **`CLAUDE_CODE_BOOT_SEQUENCE.md`** edited in place per §3.4 (canonical version updates; brand-structure orientation note; DIC PROVISIONAL marker removal)

### 1.4 — Files NOT modified in bundle (preserved at current canonical)

- `Telecheck_Contracts_Pack_v5_00_ERROR_MODEL.md` — no v1.10 cycle delta
- `Telecheck_Contracts_Pack_v5_00_IDEMPOTENCY.md` — no v1.10 cycle delta
- `Telecheck_Contracts_Pack_v5_00_SOURCE_OF_TRUTH.md` — no v1.10 cycle delta
- All ADR Addendum files (016-019, 020-025, 026) — preserved
- All other slice PRDs not listed in §1.2 — preserved
- All operational artifacts not listed — preserved

---

## 2 · Promotion ceremony execution order

Once Evans authorizes execution, the merge proceeds in this order. **The bundle is NOT internally consistent during the ceremony** — intermediate states between Step 1 and Step 9 are expected to have temporary inconsistencies (e.g., new ADR files exist on disk before Registry knows them; control-plane docs claim canonical state before Superseded files are physically demoted). **The ceremony is treated as a single atomic operation:** Codex Phase 6 EXIT (Step 10) verifies bundle consistency only after all 9 prior steps complete. If the ceremony is interrupted between steps, the bundle should be considered in a transitional state and the ceremony should be resumed (not re-fired from Step 1) to land at consistent canonical state.

The execution order is designed to land canonical-state declarations (Registry / Index / Ledger / Boot) close to the physical actions they describe, minimizing the duration of any single inconsistency:

### Step 1 — Add new files to bundle

1. ADR-027, ADR-028, ADR-029 (drop _DRAFT, bump Status: Accepted)
2. WORKLOAD_TAXONOMY, AUTONOMY_LEVELS new contracts (drop _DRAFT)
3. Country regulatory placeholder files (4)
4. Program Porting Checklist v1.0
5. Master PRD v1.10 (placed alongside v1.9; v1.9 not deleted yet)

### Step 2 — Edit Contracts Pack files (10 edits)

Per Phase 3 deltas — additive edits; document control entries bumped to v5.2 (or v5.1 for MARKET_LAUNCH).

### Step 3 — Edit engineering specs (6 edits)

Per Phase 5 group 5B deltas.

### Step 4 — Edit slice PRDs (14 files, 24 row edits)

Per Phase 5 group 5A deltas. New §N sections + terminology rewrites + reference updates.

### Step 5 — Edit Design System + DIC

Design System v1.1 edited. DIC v1.0 → v1.1 via copy + supersede convention (per §3.5; v1.0 preserved at existing path; v1.1 authored at canonical path) + status flip + Phase 5.6/F49 substantive edits.

### Step 6 — Edit OR Tracker + Other docs

OR Tracker v1.5 edited. 9 other docs edited per Phase 5 group 5E.

### Step 7 — Control-plane updates (4 files)

In this order:

1. Promotion Ledger appends P-008 (records the promotion)
2. Artifact Registry v2.9 → v2.10 (records new canonical state)
3. Active Document Index v1.0 updated in place (demotes v1.9 PRD to Superseded; adds DIC v1.0 to Superseded with successor v1.1)
4. Boot Sequence updated in place (canonical version bumps; brand-structure note; DIC PROVISIONAL marker removed)

### Step 8 — Demote superseded files

- `Telecheck_Master_Platform_PRD_v1_9.md` — preserved at existing path per copy + supersede convention §3.5; supersession recorded in ADI §4 + Promotion Ledger P-008 + Boot Sequence §3.
- `Telecheck_Design_Implementation_Contract_v1_0.md` — preserved at existing path per copy + supersede convention §3.5; supersession recorded in ADI §4 + Promotion Ledger P-008 + Boot Sequence §7.
- All Superseded files preserved at their existing paths for traceability — neither moved nor renamed; the new canonical files (v1.10 PRD; v1.1 DIC) coexist alongside their predecessors per the bundle's existing supersession convention.

### Step 9 — Project Upload Manifest rebuild

- Rebuild `Telecheck_Project_Upload_Manifest_v2.md` from filesystem inventory (mechanical scan, not hand-edited prose per CLAUDE.md hard rule).

### Step 10 — Final Codex Phase 6 EXIT verification

- Codex verifies bundle internal consistency post-promotion: all cross-references resolve; all canonical-version pointers updated across both notation classes (filename `*_vN_N.md` + body `vN.N`); no stale Heros-as-tenant residue; no §13.6 references; all v5.2 references intact.

---

## 3 · Control-plane delta drafts

### 3.1 — Artifact Registry v2.9 → v2.10

**File rename:** `Telecheck_Artifact_Registry_v2_9.md` → `Telecheck_Artifact_Registry_v2_10.md`.

**Header updates:**
- Version: 2.9 → 2.10
- Date: 2026-04-26 (or whenever last) → 2026-05-01
- Cycle reference: U-002 → v1.10 PRD Update Cycle

**§3 inventory additions:**
- ADR-027 Country-Conditional DTC Marketing (Accepted)
- ADR-028 Research Data Partnership Posture A (Accepted)
- ADR-029 AI Workload Taxonomy (Accepted)
- Contracts Pack: WORKLOAD_TAXONOMY (NEW v5.2), AUTONOMY_LEVELS (NEW v5.2)
- Master PRD v1.10 (canonical; v1.9 demoted to Superseded)
- DIC v1.1 (canonical; v1.0 demoted to Superseded — Evans Option B 2026-04-28 fold-in)
- Country regulatory placeholder files (Country_Regulatory_Contracts, Pharmacy_Council_Guidance, DSA_Template, REC_IRB_Engagement) — placeholder status documented
- Program Porting Checklist v1.0
- MARKET_LAUNCH v5.0 → v5.1

**§7 row counts updated** (corrected per Codex Phase 6 EXIT v0.1 MEDIUM-3):
- Architecture decisions: ADR Set v1.0 + Addendum 016-019 + Addendum 020-025 + Addendum 026 + new ADR-027 + new ADR-028 + new ADR-029 (29 total ADRs through ADR-029)
- Contracts Pack files: existing layer is 13 contract files at v5.1 (INVARIANTS, AUDIT_EVENTS, DOMAIN_EVENTS, ERROR_MODEL, IDEMPOTENCY, GLOSSARY, CCR_RUNTIME, AI_LAYERING, FORMS_ENGINE, MARKET_LAUNCH, GOVERNANCE_CONTROLS, TYPES, SOURCE_OF_TRUTH) + README + Update Spec = 15 in inventory. Adding WORKLOAD_TAXONOMY + AUTONOMY_LEVELS = **17 files in inventory** post-promotion (15 → 17). Of those: **12 at v5.2** (10 existing files amended at v5.2 + 2 new files authored at v5.2 = 12); **2 preserved at v5.1** (ERROR_MODEL, IDEMPOTENCY); **1 at v5.0 → v5.1** (MARKET_LAUNCH); SOURCE_OF_TRUTH preserved at current version; README + Update Spec preserved as ancillary docs (not version-tracked at the v5.x level).
- Slice PRDs: 17 active (unchanged — no new slices, only edits)
- Operational artifacts: include 4 new country regulatory placeholders

**Brand discipline note (added v2.10 per Phase 5 5E row 25):**
- "Operating tenant naming: `Telecheck-{country}` (e.g., `Telecheck-US`, `Telecheck-Ghana`). Consumer DBA: `Heros Health` (country-instanced via subdomains). 'Heros' alone (without 'Health' qualifier) MUST NOT be used as tenant or operator identifier per Master PRD §17."

**Document control entry (v2.10):**
> "v2.10 — 2026-05-01 — Records v1.10 PRD update promotion. Adds 3 new ADRs (027, 028, 029); 2 new contracts (WORKLOAD_TAXONOMY, AUTONOMY_LEVELS) and 10 v5.1 → v5.2 contract bumps; new Master PRD v1.10 (v1.9 demoted to Superseded); DIC v1.0 → v1.1 promotion folded in per Evans's Option B 2026-04-28; Country regulatory placeholder files added; Program Porting Checklist canonicalized. 107/107 v1.10 cycle matrix rows Approved per phase-by-phase Codex EXIT reviews. Brand discipline note added per C3 cycle."

### 3.2 — Active Document Index v1.0 updates (in place)

**Header updates:**
- Version: 1.0 (refreshed 2026-04-26) → 1.0 (refreshed 2026-05-01 per v1.10 PRD update cycle)
- Bundle reference: 75 markdown files → 87 markdown files post-promotion (75 baseline + 12 newly authored = 87; no files removed; Superseded files preserved per §3.5 copy + supersede convention)

**§3 canonical mapping table updates:**
- Master PRD: v1.9 → v1.10
- Contracts Pack: v5.1 → v5.2 (filenames remain `v5_00` legacy pattern; headers v5.2)
- Add WORKLOAD_TAXONOMY, AUTONOMY_LEVELS as new canonical contracts
- Add ADR-027, ADR-028, ADR-029 as canonical ADRs
- DIC: v1.0 PROVISIONAL → v1.1 Canonical
- Add Program Porting Checklist v1.0
- Add 4 country regulatory placeholder files

**§4 Superseded list additions:**
- Master PRD v1.9 — superseded by v1.10 (2026-05-01)
- DIC v1.0 PROVISIONAL — superseded by v1.1 Canonical (2026-05-01, per Evans Option B 2026-04-28)

**Region note (preserved):** Single-region us-east-1 primary / us-west-2 cold DR per ADR-026 — unchanged.

### 3.3 — Promotion Ledger entry P-008 (append-only)

Append at top of §Promotion entries (reverse chronological order):

```markdown
### Entry P-008 — 2026-05-01 — v1.10 PRD Update Cycle (final promotion ceremony)

**User instruction (verbatim):** `[PLACEHOLDER — to be replaced with Evans's verbatim "execute promotion" instruction at ceremony execution time. The phase-advance "yes" authorizations that drove Phases 0-5 do NOT constitute promotion-execution authorization; Phase 6 promotion is a discrete ceremony-execution event requiring its own explicit instruction per CLAUDE.md "v1.10 promotion is a multi-phase ceremony" + risky-action pacing memo. Until that instruction exists, this Promotion Ledger entry remains a draft and the ceremony has not occurred.]`

**Cycle:** v1.10 PRD Update (Phases 0–6)

**Cycle scope:** 7 architectural shifts (C1 §21 non-goals reframe; C2 emerging-markets reframe; C3 brand structure cascade; C4 country-conditional DTC marketing; C5 research data partnership Posture A; C6 program catalog architecture; C7 AI workload taxonomy + autonomy levels — Tier 2 forward-compat). 3 new invariants (I-029 / I-030 / I-031). 6 new audit events (research) + 2 new audit events (marketing). 11 new CCR keys (4 marketing + 7 research). 9+ new types. 3 new state machines. 3 new RBAC roles. 3 new ADRs (027 / 028 / 029). 2 new contracts (WORKLOAD_TAXONOMY / AUTONOMY_LEVELS).

**Workstream lead:** Evans (designated 2026-04-28 per planning freeze §0).

**Adversarial reviewer:** Codex (gpt-5.5 via OpenAI Codex CLI v0.125.0; replaced human-adversarial role per planning freeze v1.0).

**Phase-by-phase Codex EXIT reviews (all 0 HIGH / 0 MEDIUM at closure):**
- Phase 0 exit re-fire 2026-05-01 — async-ratification path closure of audit-B BLOCKER
- Phase 2 mid-cycle (§13.7) — 3-cycle convergence
- Phase 2.X glossary final approval — 2-cycle convergence
- Phase 2 EXIT — 3-cycle convergence
- Phase 3 group-1 (INVARIANTS + AUDIT_EVENTS + WORKLOAD_TAXONOMY + AUTONOMY_LEVELS) — 3-cycle convergence
- Phase 3 group-2 (TYPES + CCR_RUNTIME + GLOSSARY + AI_LAYERING) — 3-cycle convergence
- Phase 3 group-3 (DOMAIN_EVENTS + FORMS_ENGINE + MARKET_LAUNCH + GOVERNANCE_CONTROLS) — 2-cycle convergence
- Phase 3 EXIT — 2-cycle convergence
- Phase 4 EXIT — 2-cycle convergence
- Phase 5 EXIT — 1-cycle convergence (single-fire close)
- Phase 6 EXIT — pending Codex final verification post-merge

**Files newly authored in v1.10 cycle:**
- `Telecheck_Master_Platform_PRD_v1_10.md` (Master PRD canonical text)
- `Telecheck_ADR_027_Country_Conditional_DTC_Marketing.md` (Accepted)
- `Telecheck_ADR_028_Research_Data_Partnership_Posture_A.md` (Accepted)
- `Telecheck_ADR_029_AI_Workload_Taxonomy.md` (Accepted)
- `Telecheck_Contracts_Pack_v5_00_WORKLOAD_TAXONOMY.md` (NEW v5.2)
- `Telecheck_Contracts_Pack_v5_00_AUTONOMY_LEVELS.md` (NEW v5.2)
- `Telecheck_Program_Porting_Checklist_GLP1_v1_0.md` (worked example; Heros Health DBA US GLP-1 → Heros Health Ghana DBA Ghana GLP-1)
- `Telecheck_Country_Regulatory_Contracts.md` (placeholder per ADR-027 Tier 2)
- `Telecheck_Pharmacy_Council_Guidance.md` (placeholder per ADR-027 Tier 2)
- `Telecheck_DSA_Template.md` (placeholder per ADR-028)
- `Telecheck_REC_IRB_Engagement.md` (placeholder per ADR-028)
- `Telecheck_Design_Implementation_Contract_v1_1.md` (DIC v1.0 → v1.1 promotion per Evans Option B 2026-04-28 fold-in)

**Files demoted to Superseded (kept in bundle for traceability):**
- `Telecheck_Master_Platform_PRD_v1_9.md`
- `Telecheck_Design_Implementation_Contract_v1_0.md`

**Files edited in place (no rename, no version bump unless noted):**
- All Contracts Pack v5.1 → v5.2 (10 files; INVARIANTS, AUDIT_EVENTS, TYPES, CCR_RUNTIME, GLOSSARY, AI_LAYERING, DOMAIN_EVENTS, FORMS_ENGINE, MARKET_LAUNCH v5.0 → v5.1, GOVERNANCE_CONTROLS)
- 6 engineering specs (CDM v1.2, State Machines v1.1, OpenAPI v0.2, RBAC v1.1, System Architecture v1.2, Tenant Threading Addendum v1.0)
- 14 slice PRDs (terminology rewrites + reference updates + new §N sections per Phase 5 group 5A)
- Design System v1.1
- OR Tracker v1.5
- 9 other docs (Reviewer Brief, Notification Spec, Ghana Launch Playbook, Investor One Pager, Patient App IA, Engineering Handoff, Messaging Inbox, Artifact Registry, Boot Sequence)
- Active Document Index v1.0 (in place; refreshed metadata)
- Promotion Ledger (this entry + the entry itself)

**Decisions ratified at the same time (folded into v1.10 cycle):**
- ADR-027 (Country-Conditional DTC Marketing Posture) — Accepted
- ADR-028 (Research Data Partnership Posture A) — Accepted
- ADR-029 (AI Workload Taxonomy) — Accepted
- DIC v1.0 → v1.1 promotion per Evans Option B 2026-04-28 (folded into v1.10 cycle as Phase 5.6 / F49 — eliminated standalone DIC promotion path)

**Final bundle (target post-promotion):** `Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip` — bundle name preserved; counts updated per rebuilt Project Upload Manifest. **Expected file count post-promotion: 87 markdown files** (75 baseline + 12 newly authored = 87; Superseded files Master PRD v1.9 + DIC v1.0 PROVISIONAL preserved in bundle for traceability per existing convention; no files removed). The 12 newly authored files: 3 ADRs (027/028/029) + 2 contracts (WORKLOAD_TAXONOMY, AUTONOMY_LEVELS) + Master PRD v1.10 + DIC v1.1 + Program Porting Checklist v1.0 + 4 country regulatory placeholders. Manifest rebuild is mechanical filesystem scan per CLAUDE.md hard rule.

**Codex Phase 6 EXIT verification:** pending post-merge; verifies bundle internal consistency, all cross-references resolve, all canonical-version pointers updated across both notation classes (filename + body), no stale residue.

**Cross-reference:** Registry v2.10 records the canonical state. This ledger entry records the user-authorized intent.
```

### 3.5 — DIC v1.0 → v1.1 physical transition convention (added v0.2 per Codex Phase 6 EXIT v0.1 MEDIUM-4)

**Convention:** **copy + supersede**, NOT rename. The v1.0 file is preserved at its existing path `Telecheck_Design_Implementation_Contract_v1_0.md` (no rename, no move) for traceability per the existing bundle convention for superseded files; a new file `Telecheck_Design_Implementation_Contract_v1_1.md` is authored at the canonical path for v1.1 content.

This matches the existing bundle convention for superseded artifacts (e.g., `Telecheck_Master_Bundle_FINAL_REMEDIATED.zip` was preserved when superseded by `Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip`; the `Project_Upload_Manifest_Post_Remediation.md` is preserved when superseded by `Project_Upload_Manifest_v2.md`). The v1.0 file's body remains unchanged (no in-place edit to a Superseded file per CLAUDE.md hard rule); supersession is recorded in Active Document Index §4 + Promotion Ledger P-008 + Boot Sequence §7.

**ADI §4 Superseded list edit authorization:** The standing CLAUDE.md hard rule "Do NOT edit anything in `Telecheck_Active_Document_Index_v1_0.md` §4 (Superseded)" prohibits editing superseded-FILE bodies, not the §4 index itself. Adding new entries to the §4 index (recording new supersessions) is a normal Index update operation per "Update cadence: Every Registry version bump" in the ADI header. This is the same operation already performed for prior supersession events. **Phase 6 ADI §4 additions are authorized as standard control-plane operations, not as superseded-file edits.**

### 3.4 — Boot Sequence updates (in place)

**§3 Canonical versions block updates:**
- Master Platform PRD: **v1.9** → **v1.10**
- Contracts Pack: **v5.1** → **v5.2** (filenames retain `v5_00` legacy pattern; headers govern)
- Design Implementation Contract: **v1.0 PROVISIONAL** → **v1.1 Canonical for development**
- Artifact Registry: **v2.9** → **v2.10**
- Active Document Index: **v1.0** (refreshed 2026-05-01 per v1.10 PRD update cycle)
- Add: **ADR-027** Country-Conditional DTC Marketing — canonical
- Add: **ADR-028** Research Data Partnership Posture A — canonical
- Add: **ADR-029** AI Workload Taxonomy — canonical
- Architecture decision set: ADR Set v1.0 + Addendum 016-019 + Addendum 020-025 + Addendum 026 + **ADR-027 + ADR-028 + ADR-029**

**§1 Reading order — add brand-structure orientation note as new step or sub-bullet under existing reading order:**

> "**Brand vs identifier discipline:** `Telecheck` = platform/B2B brand only (never consumer-facing); `Heros Health` = global consumer DBA, country-instanced via subdomains (`heroshealth.com` for Telecheck-US; `ghana.heroshealth.com` for Telecheck-Ghana); operating tenants follow `Telecheck-{country}` naming. See Master PRD §17 for the canonical rule and contextual carve-outs (FDA / Stripe / business terminology)."

**§7 DIC status block — entire section rewritten:**

> "## 7. Design Implementation Contract status
>
> - DIC v1.1 is **Canonical for development** per Evans's Option B decision 2026-04-28, folded into v1.10 cycle as Phase 5.6 / F49 (alongside C3 brand-structure cascade).
> - Patient interactive mock v7 at `telecheck-design-system/project/Patient interactive mock v7.html` is the binding visual reference.
> - §4.1 / §4.2 pixel-exact-match clauses are activated; reimplementation cycles begin per the v1.1 canonical text.
> - Substitution flags carry forward (Manrope font, Lucide icons, wordmark, photography placeholders) — replace before customer ship.
> - Pharmacy portal kit gap: not in v1 design system; gap to be filled when pharmacy slice work begins.
> - DIC v1.0 PROVISIONAL is superseded; preserved in bundle for traceability per Active Document Index §4."

**§5 Tenancy block — minor update:**
- "Read `Telecheck_Tenant_Threading_Addendum_v1_0.md` before implementing any v1.0 slice PRD" — preserved unchanged
- Per AUDIT_EVENTS v5.2 + WORKLOAD_TAXONOMY contract, audit envelope now includes `ai_workload_type`, `autonomy_level`, `audit_sensitivity_level`, reserved agentic-context fields per ADR-029

**§9 Conflict resolution — minor row additions:**
- "Older doc references ADR-002 binary AI mode framing for new workload additions" → "ADR-029 wins prospectively for new workload additions; ADR-002 remains binding for current Mode 1 / Mode 2"
- "Older doc references §13.6 marketing copy governance" → "Master PRD v1.10 §13.2 (with internal Governance review process subsection) is canonical; §13.6 is not a v1.10 section heading"
- "Older doc references §X NEW research data governance" → "Master PRD v1.10 §15.3 is canonical"

---

## 4 · Verification checks (post-merge, pre-Codex-EXIT)

After execution but before firing Codex Phase 6 EXIT:

### 4.1 — Cross-reference resolution

- [ ] No file references `Telecheck_Master_Platform_PRD_v1_9` outside Superseded section + historical change-log entries
- [ ] All `Contracts Pack v5.1` references updated to v5.2 (per group-by-group Phase 3 deltas)
- [ ] No file references `§13.6` outside historical change-log entries
- [ ] No file references `§X NEW` (research data governance section)
- [ ] No bare `workload_type` references; all use `ai_workload_type`
- [ ] No bare `Heros` references as tenant/operator identifier outside §17 contextual carve-outs
- [ ] All Phase 5 propagation patches landed (cycle-by-cycle scan)
- [ ] **No `v2.9` / `v2_9` references** to Artifact Registry outside historical change-log entries (post-v2.10 promotion, all live pointers reference v2.10) — added v0.2 per Codex Phase 6 EXIT v0.1 MEDIUM-5
- [ ] **No `DIC v1.0 PROVISIONAL` references** outside historical change-log entries + ADI §4 Superseded list (post-v1.1 promotion, all live pointers reference v1.1 Canonical) — added v0.2 per Codex Phase 6 EXIT v0.1 MEDIUM-5
- [ ] **Registry v2.10 / ADI / Promotion Ledger / Boot Sequence pointer lockstep** — all 4 control-plane docs declare the same canonical-version state (Master PRD v1.10; Contracts Pack v5.2; DIC v1.1; ADRs 027/028/029 Accepted). Mismatch in any pointer between control-plane docs = defect. — added v0.2 per Codex Phase 6 EXIT v0.1 MEDIUM-5
- [ ] **Final manifest count check** — Project Upload Manifest rebuilt from filesystem matches the expected post-promotion count (87 markdown files: 75 baseline + 12 new). Mismatch = either filesystem state ≠ ceremony plan or expected-count math has a defect. — added v0.2 per Codex Phase 6 EXIT v0.1 MEDIUM-5

### 4.2 — Canonical version notation classes

Per CLAUDE.md hard rule: scan both notation classes for every version-bumped file:

- Filename pattern: `*_vN_N.md` matches the document control header version
- Body pattern: `vN.N` references resolve to the same version
- Mismatch in either class = defect

### 4.3 — Promotion Ledger + Registry lockstep

- [ ] Registry v2.10 entries match the Promotion Ledger P-008 entry's listed files
- [ ] Active Document Index entries match Registry inventory
- [ ] Project Upload Manifest rebuilt from filesystem matches the bundle file list

### 4.4 — Invariant integrity

- [ ] I-001 through I-028 preserved unchanged in INVARIANTS contract
- [ ] I-029, I-030, I-031 added at correct positions
- [ ] §13.4 platform floor mapping table preserved unchanged for I-001..I-028 references
- [ ] No invariant has been silently weakened (per CLAUDE.md hard rule)

### 4.5 — DIC v1.1 transition

- [ ] DIC v1.0 file preserved at existing path (NOT moved, NOT renamed) per copy + supersede convention §3.5; supersession recorded in ADI §4 + Promotion Ledger P-008 + Boot Sequence §7
- [ ] DIC v1.1 file present at canonical path
- [ ] DIC v1.1 references Patient mock v7 as binding visual reference
- [ ] Boot Sequence §7 updated per §3.4 above
- [ ] Active Document Index §4 lists DIC v1.0 with successor v1.1

---

## 5 · Codex Phase 6 EXIT verification ask (post-merge)

After execution, fire Codex Phase 6 EXIT review:

1. **Bundle internal consistency** — all cross-references resolve; no stale Heros-as-tenant residue; no §13.6 references; no §X NEW residue; no v5.1 references (except in historical change-log entries); no bare workload_type references
2. **Canonical version notation class consistency** — filename `*_vN_N.md` matches body `vN.N` for every version-bumped file
3. **Promotion Ledger + Registry + Index + Manifest lockstep** — all 4 control-plane docs agree on canonical state
4. **DIC v1.1 transition coherence** — status flip applied; v1.0 demoted; substitution flags preserved
5. **No invariant weakened** — I-001..I-028 preserved unchanged
6. **Phase 5 propagation completeness** — sweep slice PRDs and external docs for any missed propagation hits

Bottom line: is the v1.10 promotion ceremony complete and bundle internally consistent, or are residual hits requiring patch?

---

## Document control (this artifact)

- **v1.0 — 2026-05-01** — Phase 6 ceremony plan + control-plane delta drafts. Documents the v1.10 promotion ceremony scope (files added / modified / preserved), execution order, control-plane updates (Registry/Index/Ledger/Boot), verification checks, and Codex Phase 6 EXIT review ask.
- **v1.0.2 — 2026-05-01** — Patches per Codex Phase 6 EXIT v0.1 (1 HIGH + 4 MEDIUM):
  - **HIGH (P-008 user instruction pre-recorded):** Promotion Ledger entry P-008 user-instruction field replaced with explicit `[PLACEHOLDER]` marker awaiting Evans's verbatim "execute promotion" instruction at ceremony execution time. Phase-advance "yes" authorizations do NOT constitute promotion-execution authorization.
  - **MEDIUM (intermediate-state inconsistency claim):** §2 reframed — bundle is NOT internally consistent during ceremony; intermediate states between Step 1 and Step 9 are expected to have temporary inconsistencies; ceremony treated as single atomic operation; Codex Phase 6 EXIT (Step 10) verifies post-merge.
  - **MEDIUM (file/count math + DIC v1.1 in §1.1):** Expected post-promotion count corrected from "~85" to **87 markdown files** (75 baseline + 12 newly authored, including DIC v1.1). DIC v1.1 added to §1.1 new artifacts table. Contracts Pack inventory clarified (15 → 17 files).
  - **MEDIUM (DIC transition convention):** New §3.5 specifies copy + supersede convention (NOT rename), preserving v1.0 file at existing path per existing bundle convention. ADI §4 Superseded list edit explicitly authorized as standard control-plane operation (not a superseded-FILE edit).
  - **MEDIUM (verification scan additions):** §4.1 expanded with 4 new scan lines: `v2.9`/`v2_9` references; `DIC v1.0 PROVISIONAL` references; Registry/ADI/Ledger/Boot pointer lockstep; final manifest count = 87.
- **Status:** RECONCILED v0.2 — proposed Phase 6 ceremony plan with control-plane defects patched. **Awaiting Codex Phase 6 EXIT v0.2 verification + Evans's explicit "execute promotion" authorization** before physical bundle merge.
- **Lands canonically:** This artifact stays in the workstream folder as the ceremony record. Substantive edits land in the bundle per §1 + §2 + §3 above when execution authorized.
