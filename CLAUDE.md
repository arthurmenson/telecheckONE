# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

This is **not a codebase** — it is the **Telecheck specification bundle** ("FINAL US REGION BASELINE"), **87 markdown files** (75 baseline + 12 newly authored at v1.10 promotion 2026-05-01) describing a multi-tenant AI-powered telehealth platform that has not yet been implemented. All work here is editing, validating, and extending the spec corpus itself.

The actual code repo (TypeScript / Fastify / PostgreSQL+RLS / React / React Native) does not exist yet. When it does, it gets its own CLAUDE.md from the **template in `Telecheck_Engineering_Handoff_Build_Guide_v1_3.md` §13** — do not confuse that template with this file.

All docs live under `Telecheck Master Bundle FINAL US REGION BASELINE/`. There is no `src/`, no package manager, no test runner, no build step.

A **UI design handoff** also lives at `telecheck-design-system/` (sibling to the spec bundle) — HTML/CSS/JSX prototypes from Claude Design, intended as a visual reference for the future code repo. See the "UI design handoff" section below.

A **v1.10 PRD update workstream** lives at `Telecheck_v1_10_PRD_Update/` (sibling to the spec bundle) — **COMPLETE** as of 2026-05-02. v1.10 was promoted to canonical in the bundle 2026-05-01 per Evans's Phase 6 "authorized" instruction. The follow-on **v1.10.1 hygiene cycle** physically merged the v1.10 delta artifacts into bundle file bodies + ran 12 rounds of Codex adversarial verification (~95 findings closed); the cycle exited 2026-05-02 and merged to `main` as `9389ef7`. The workstream folder is preserved as the authoritative reference for v1.10 cycle delta artifacts + the v1.10.1 hygiene cycle status doc + Promotion Ledger entry P-009. See the "v1.10 PRD update workstream" section below.

## Read this first — every session

Before editing anything, follow `Telecheck Master Bundle FINAL US REGION BASELINE/CLAUDE_CODE_BOOT_SEQUENCE.md` in the order it specifies:

1. `Telecheck_Active_Document_Index_v1_0.md` — which file is canonical for each topic
2. `CLAUDE_CODE_BOOT_SEQUENCE.md` — execution rules (this is the source of the rules summarized below)
3. `Telecheck_Artifact_Registry_v2_10.md` §0–§3 — canonicality decisions and inventory
4. `Telecheck_Engineering_Handoff_Build_Guide_v1_3.md` §1–§3, §6, §10a — orientation and build sequencing
5. `Telecheck_Master_Platform_PRD_v1_10.md` §1–§5, §10.5, §13.7, §15.3, §17 — what is being built (v1.10 adds program catalog architecture §10.5; AI workload taxonomy §13.7; research data governance §15.3; brand-structure rules §17)

Pull slice PRDs (`*_Slice_PRD_v*.md`) on demand for the specific feature you're working on, not upfront.

## Source-of-truth hierarchy (top wins on conflict)

Per `Telecheck_Contracts_Pack_v5_00_SOURCE_OF_TRUTH.md` and the Boot Sequence:

1. **Platform Invariants** (`Telecheck_Contracts_Pack_v5_00_INVARIANTS.md`) — 22 non-negotiable guarantees
2. **Architecture Decision Records** — `Telecheck_ADR_Set_v1_0.md` + Addendums 016–019, 020–025, **026**
3. **Cross-cutting contracts** — Contracts Pack v5.2 files (INVARIANTS, AUDIT_EVENTS, DOMAIN_EVENTS, CCR_RUNTIME, GLOSSARY, TYPES, AI_LAYERING, FORMS_ENGINE, GOVERNANCE_CONTROLS amended in v1.10 cycle; WORKLOAD_TAXONOMY, AUTONOMY_LEVELS NEW v5.2; ERROR_MODEL + IDEMPOTENCY + SOURCE_OF_TRUTH preserved at v5.1; MARKET_LAUNCH v5.0 → v5.1)
4. **Master Platform PRD v1.10** (canonical post-v1.10 promotion 2026-05-01; v1.9 superseded preserved)
5. **Slice PRDs** (17 active)
6. **Engineering specs** — Canonical Data Model v1.2, State Machines v1.1, OpenAPI v0.2, System Architecture v1.2
7. **Experience specs** — Design System v1.1, IA docs, Design Implementation Contract **v1.1 Canonical for development** (Patient mock v7 binding visual reference; DIC v1.0 PROVISIONAL superseded post-v1.10 promotion 2026-05-01)
8. **Operations** — Ghana Launch Playbook v1.2, Operational Readiness Tracker v1.5, Guardrails, Protocols

**Conflict resolution:** Slice PRD vs CDM v1.2 → CDM wins. Slice PRD vs OpenAPI v0.2 → OpenAPI wins. Slice PRD vs State Machines v1.1 → State Machines wins. ADR-025 vs ADR-026 → ADR-026 wins (us-east-1 primary, us-west-2 cold DR).

If two control-plane docs (Active Document Index, Artifact Registry, Project Upload Manifest, EHBG) disagree: **STOP. Report. Do not pick a winner.**

## Hard editing rules

- **Do NOT edit anything in `Telecheck_Active_Document_Index_v1_0.md` §4 (Superseded).** Those files exist only for traceability.
- **Do NOT silently fork.** When a slice PRD disagrees with CDM / OpenAPI / State Machines, open a Spec Issue (per EHBG §12); do not edit the engineering spec to match the slice.
- **Manifest must be rebuilt from filesystem, not hand-edited prose** (`Telecheck_Project_Upload_Manifest_v2.md`). Drift between manifest and bundle filesystem is a defect.
- **Release notes reflect actual state at write time, not projected outcome.**
- When updating canonical-version pointers, **scan both notation classes**: filename `*_vN_N.md` and version-name `vN.N` in body text. Missing one is a known failure mode.
- **Do NOT relax invariants.** Contracts Pack invariants (especially I-023…I-027 tenant isolation, I-019 crisis detection, I-027 audit append-only) are platform-floor.
- The **Promotion Ledger is append-only** (`Telecheck_Promotion_Ledger.md`). Never edit prior entries.
- **Glossary terms are canonical.** Use `medication_request` (not `prescription`), `Mode 1` / `Mode 2` (not `chatbot`), `tenant` (not `customer`). Forbidden aliases are listed in `Telecheck_Contracts_Pack_v5_00_GLOSSARY.md`.
- **Design Implementation Contract v1.1 is now Canonical for development** (post-v1.10 promotion 2026-05-01; Evans's Option B fold-in 2026-04-28 executed). Patient mock **v7** at `telecheck-design-system/` is the binding visual reference. DIC v1.0 PROVISIONAL is superseded; do not implement from v1.0.

## What kind of platform this describes

- **Multi-tenant** (ADR-023 Model A): one codebase, one AWS deployment, logical isolation by `tenant_id` on every PHI record. Three-layer enforcement: PostgreSQL Row-Level Security + application-layer filtering + per-tenant KMS keys.
- **Two day-1 operating tenants** (per Master PRD v1.10 §17 + Glossary v5.2 C3 brand structure): **Telecheck-US** (operated by Telecheck Health LLC; trading patient-facing as **Heros Health** consumer DBA at heroshealth.com; greenfield, zero patients day 1) and **Telecheck-Ghana** (operated by Telecheck-Ghana Ltd.; trading patient-facing as **Heros Health Ghana** consumer DBA at ghana.heroshealth.com; chronic-care anchor). Both share us-east-1 primary, us-west-2 cold DR per ADR-026. Operating-tenant identifiers (`Telecheck-{country}`) are internal/B2B; consumer DBAs source from `tenant.consumer_dba`, never from `tenant.id`. Bare `Heros` is forbidden as a tenant or operator identifier outside §17 contextual carve-outs.
- **Country-driven configuration (CCR)**: `country_of_care` drives protocols, formularies, payment processor, SMS provider, regulatory module. Decoupled from `country_of_residence` (jurisdictional regulatory residency).
- **Two-mode AI architecture (ADR-002):** Mode 1 conversational assistant (no clinical decisions), Mode 2 protocol execution agent (gated, governance-bound).
- **Modular monolith** at launch (15 modules; ADR-001), extraction-ready boundaries, separate AI Service from day one.
- **48 active canonical entities + 7 reserved-future, 187 OpenAPI endpoints across 22 modules, 18 active state machines + 4 reserved-future transitions, 25 platform invariants (I-001..I-028 + I-029/030/031 added v1.10 cycle), 28 ADRs (ADR-001 set + Addenda 016–019, 020–025 with ADR-025 superseded, 026, 027, 028, 029), 17 slice PRDs.**

## Doc navigation cheatsheet

| If you're looking for… | Open… |
|---|---|
| What is Telecheck / who are users | `Telecheck_Master_Platform_PRD_v1_10.md` (v1.9 superseded but preserved at existing path for traceability) |
| Which file is canonical for X | `Telecheck_Active_Document_Index_v1_0.md` |
| Filesystem inventory | `Telecheck_Project_Upload_Manifest_v2.md` |
| What changed in this release | `TELECHECK_RELEASE_NOTES_US_REGION_BASELINE.md` |
| Module map / tenancy enforcement | `Telecheck_System_Architecture_v1_2.md` |
| Entity schemas | `Telecheck_Canonical_Data_Model_v1_2.md` |
| Endpoints | `Telecheck_OpenAPI_v0_2.md` |
| State machines | `Telecheck_State_Machines_v1_1.md` |
| Cross-cutting runtime contracts | `Telecheck_Contracts_Pack_v5_00_*.md` (v5.2 in headers for 11 amended/new files post-v1.10 cycle: INVARIANTS, AUDIT_EVENTS, DOMAIN_EVENTS, CCR_RUNTIME, GLOSSARY, TYPES, AI_LAYERING, FORMS_ENGINE, GOVERNANCE_CONTROLS amended + WORKLOAD_TAXONOMY + AUTONOMY_LEVELS new; ERROR_MODEL + IDEMPOTENCY + SOURCE_OF_TRUTH preserved at v5.1; MARKET_LAUNCH v5.0 → v5.1) |
| Architecture decisions | `Telecheck_ADR_Set_v1_0.md` + 3 addendums |
| Build sequence / sprint plan | `Telecheck_Engineering_Handoff_Build_Guide_v1_3.md` |
| Per-feature spec | `Telecheck_*_Slice_PRD_v*.md` |
| Tenant-isolation extension for v1.0 slices | `Telecheck_Tenant_Threading_Addendum_v1_0.md` |
| Glossary / forbidden aliases | `Telecheck_Contracts_Pack_v5_00_GLOSSARY.md` |
| Human reviewer onboarding | `Telecheck_Reviewer_Brief_v1_0.md` |
| CLAUDE.md template for the *future code repo* | `Telecheck_Engineering_Handoff_Build_Guide_v1_3.md` §13 |
| UI design system / visual foundations | `telecheck-design-system/project/README.md` |
| Design tokens (colors, type, spacing, radii, shadows) | `telecheck-design-system/project/colors_and_type.css` |
| Patient mobile UI kit (React) | `telecheck-design-system/project/ui_kits/patient_app/` |
| Clinician console UI kit (React) | `telecheck-design-system/project/ui_kits/clinician_console/` |
| v1.10 workstream — execution plan (CLOSED 2026-05-01) | `Telecheck_v1_10_PRD_Update/Telecheck_v1_10_Planning_Freeze.md` |
| v1.10 workstream — drafted PRD (now canonical at bundle path post-promotion) | `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Master_Platform_PRD_v1_10.md` |
| v1.10 workstream — 108-row traceability matrix (final) | `Telecheck_v1_10_PRD_Update/Telecheck_PRD_v1_10_Traceability_Matrix.xlsx` |
| v1.10.1 hygiene cycle — status doc + 12-round Codex convergence trajectory | `Telecheck_v1_10_PRD_Update/v1_10_1_Hygiene_Cycle_Status_2026-05-02.md` |
| Workstream-discipline note (multi-agent orchestration pilot) | `Telecheck_v1_10_PRD_Update/Telecheck_Workstream_Discipline_Note_Multi_Agent_Orchestration_v0_1_DRAFT.md` |
| Program porting worked example (Telecheck-US GLP-1 [Heros Health DBA] → Telecheck-Ghana GLP-1 [Heros Health Ghana DBA]) | `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Program_Porting_Checklist_GLP1_v1_0.md` |

## UI design handoff

`telecheck-design-system/` is a **Claude Design** (claude.ai/design) handoff bundle: HTML/CSS/JSX **prototypes**, not production code. The medium is HTML/CSS/JS — when implementation begins, **recreate the visual output pixel-perfectly** in the target stack (React for web, React Native for mobile per ADR-022); do not copy the prototype's internal structure.

### Layout
- `telecheck-design-system/README.md` — outer handoff README (entry point — read first)
- `telecheck-design-system/project/README.md` — full design system: voice, palette, typography, spacing, motion, components
- `telecheck-design-system/project/SKILL.md` — agent-skill metadata; the bundle can also be installed at `~/.claude/skills/telecheck-design/` to invoke the designer skill outside this project
- `telecheck-design-system/project/colors_and_type.css` — design tokens (colors, type, spacing, radii, shadows)
- `telecheck-design-system/project/Patient interactive mock v*.html|jsx|css` — iterative mocks v1 → v7
- `telecheck-design-system/project/ui_kits/patient_app/` — patient mobile UI kit (React)
- `telecheck-design-system/project/ui_kits/clinician_console/` — clinician desktop UI kit (React)
- `telecheck-design-system/project/preview/` — review cards (colors, type, spacing, components, brand)
- `telecheck-design-system/project/assets/` — `ai-spark.svg` + placeholder logo
- `telecheck-design-system/project/uploads/` — PRDs the designer worked from. **NOT canonical.**

### Hard rules for the design handoff
- **The canonical PRD is the spec bundle's `Telecheck_Master_Platform_PRD_v1_10.md`** (post v1.10 promotion 2026-05-01; v1.9 superseded preserved at existing path). The PRDs inside `telecheck-design-system/project/uploads/` (v1.2, v1.4, v1.6, v1.9) are historical inputs to the design process; do not treat them as authoritative. Source-of-truth hierarchy still applies.
- **Substitutions are flagged, not final.** Manrope (font), Lucide (icons), the wordmark in `assets/logo/`, and all photography are placeholders. Replace before customer ship.
- **No Pharmacy portal kit.** Scoped out of v1 of this design system. When pharmacy slice work begins, this gap must be filled.
- **AI / human distinction is enforced by three cues** (color + glyph + label) per Master PRD §12 and §16 — never relax to color-only. Iris (`#6E5BD6`) is reserved exclusively for AI-authored content; the `ai-spark` glyph and "Telecheck AI" label always accompany it on first reveal.
- **No emoji in product UI** (cross-market reliability rule, not style).
- **Honest status:** never aspirational, softened, or hedge-slop copy. "Submit prescription" not "Send for review" if the action commits.
- **Design Implementation Contract v1.1 is Canonical for development** (post-v1.10 promotion 2026-05-01; Evans's Option B fold-in 2026-04-28 executed via the v1.10 traceability matrix). DIC v1.0 PROVISIONAL is superseded; do not implement from v1.0. The C3 brand-structure cascade landed alongside the v1.0→v1.1 bump (per Adversarial Review Finding 1).
- **Don't render in a browser or screenshot** unless explicitly asked. Read the HTML/CSS source directly; everything you need is spelled out there.
- **Authoritative mock: `Patient interactive mock v7.html`** plus its sibling `v7 - *.jsx` companions and `v7.css`. Earlier versions (v1 → v6) are kept for traceability — do not implement from them.

## v1.10 PRD update workstream

`Telecheck_v1_10_PRD_Update/` holds the **now-completed** v1.10 PRD update workstream. **Master PRD v1.10 is canonical in the spec bundle** (promoted 2026-05-01 per Evans's Phase 6 "authorized" instruction; Promotion Ledger P-008). The follow-on **v1.10.1 hygiene cycle** physically merged the v1.10 cycle delta artifacts into bundle file bodies + ran 12 rounds of Codex adversarial verification (~95 findings closed); the cycle exited 2026-05-02 and merged to `main` as `9389ef7` (Promotion Ledger P-009). The workstream folder is preserved as the authoritative reference for v1.10 cycle delta artifacts (Phase 3 + Phase 5 deltas), Phase 0 walk artifacts, ADR drafts, Codex review series, and the v1.10.1 hygiene cycle status doc.

### What's there
- `Telecheck_v1_10_Planning_Freeze.md` — single planning artifact (**v2.0 — ALL PHASES 0–6 CLOSED 2026-05-01**; matrix at 108/108 data rows Approved). Cycle versions: v1.0–v1.3 (planning), v1.4 (I-029/030/031 renumbering hotfix), v1.5 (audit-B count hotfix), v1.6 (Phase 0+1 exit), v1.7 (Phase 2 exit), v1.8 (Phase 3 exit — Contracts Pack v5.1 → v5.2), v1.9 (Phase 4 exit — 3 ADRs final-text), v2.0 (Phase 5 exit — 70 rows single-fire close + Phase 6 exit). Executed: 6 phases, 108 final matrix rows, 7 architectural shifts (C1–C7 with C7 added 2026-04-29 for Tier 2 forward-compat), 3 new ADRs (027, 028, 029), 3 new invariants (I-029, I-030, I-031), 11 new CCR keys (4 marketing + 7 research), 8 new audit events (6 research + 2 marketing), 9+ new types (Marketing + Research + AI workload + Program catalog), 3 new state machines, 3 new RBAC roles.
- `Telecheck_Master_Platform_PRD_v1_10.md` — the drafted v1.10 PRD that became canonical at Phase 6 promotion. **The canonical bundle copy now lives at `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Master_Platform_PRD_v1_10.md`** — read the bundle copy, not this draft.
- `Telecheck_Master_Platform_PRD_v1_10.html` — styled rendering for visual review (preview only; preserved for traceability).
- `Telecheck_PRD_v1_10_Traceability_Matrix.xlsx` — 108-row matrix tracking edits across the bundle. Final state: 108/108 Approved at Phase 5 exit.
- `v1_10_1_Hygiene_Cycle_Status_2026-05-02.md` — v1.10.1 hygiene cycle status doc (12-round Codex convergence trajectory; ~95 findings closed; long-tail asymptote pattern documented; cycle EXIT commit `33898ec`; merged to main as `9389ef7`).
- `Telecheck_Workstream_Discipline_Note_Multi_Agent_Orchestration_v0_1_DRAFT.md` — workstream-discipline note (multi-agent orchestration pilot lessons from the Codex round-robin).
- **Phase delta artifacts (authoritative for v1.10 cycle changes during the v1.10 → v1.10.1 transition):** `Phase3_Contracts_Pack_Delta_*.md` and `Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md`. *Note:* the v1.10.1 hygiene cycle physically merged these deltas into bundle file bodies, so engineers consulting bundle files for v1.10 content no longer need to read deltas alongside; the delta artifacts are preserved for traceability and audit-trail purposes.
- **Adversarial review series (Codex):**
  - Planning freeze: `Codex_Adversarial_Review_2026-04-29.md` → `_v1_1_verification.md` → `_v1_2_verification.md` → `_v1_3_verification.md` (convergence 9 → 7 → 4 → 0).
  - ADR-027/028: `Codex_ADR_027_028_PreAcceptance_Review_2026-04-30.md` → `_v0_2_Verification_*.md` → `_v0_3_Verification_*.md` → `_v0_4_Verification_*.md` (convergence 24 → 15 → 4 → 1 → 0).
  - C7/Tier2: `Codex_Tier2_PreCommit_Review_*.md` → `_v1_1_Verification_*.md` → `_v1_2_Verification_*.md` → `_v1_3_Verification_*.md` (convergence 15 → 7 → 1 → 0).
  - v1.10.1 hygiene cycle: 12 rounds documented in the hygiene cycle status doc.
- `Adversarial_Review_Findings.md` — 9-finding pre-Phase-0 review of the matrix; all 9 reconciled during the cycle.
- **Phase 0 walk artifacts:** `Phase0_Walk_Packet_2026-04-30.md` (convening doc), `Phase1_Glossary_Drafts_DRAFT.md` (37 glossary entries — final-approved at Phase 2.X), `Tier2_Matrix_Row_Additions_DRAFT.md` (C7's 10 rows — committed at Phase 0 walk).
- **ADR + contract drafts (final-text Phase 4; promoted into bundle at Phase 6):**
  - `Telecheck_ADR_027_Country_Conditional_DTC_Marketing_DRAFT.md` v0.5 → bundle ADR-027 Accepted
  - `Telecheck_ADR_028_Research_Data_Partnership_Posture_A_DRAFT.md` v0.4 → bundle ADR-028 Accepted
  - `Telecheck_ADR_029_AI_Workload_Taxonomy_DRAFT.md` → bundle ADR-029 Accepted (prospectively supersedes ADR-002; ADR-005 + I-012 preserved at v1.0 active levels)
  - `Telecheck_Contracts_Pack_v5_00_WORKLOAD_TAXONOMY_DRAFT.md` → bundle Contracts Pack v5.2 file
  - `Telecheck_Contracts_Pack_v5_00_AUTONOMY_LEVELS_DRAFT.md` → bundle Contracts Pack v5.2 file
- `Telecheck_Program_Porting_Checklist_GLP1_v1_0.md` — worked example (Telecheck-US GLP-1 [Heros Health DBA] → Telecheck-Ghana GLP-1 [Heros Health Ghana DBA]). **Now also a bundle artifact** at `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Program_Porting_Checklist_GLP1_v1_0.md` per Phase 6 promotion. Referenced from canonical Master PRD v1.10 §10.5.

### Six v1.10 architectural shifts (in execution order per planning freeze §1)
1. **C3 — Brand structure + tenant identifier rename.** "Telecheck" = platform/B2B brand only. "Heros Health" = global consumer DBA, country-instanced via subdomains. US tenant: `Heros-Health` → `Telecheck-US`. **29 rows; biggest cascade.**
2. **C2 — Emerging-markets framing reframe.** Category-level "Ghana" claims → "emerging markets"; concrete pilot citations preserved. 11 rows.
3. **C1 — §21 Non-goals regulatory-conditional rewrite.** Three-axis classification per non-goal. 4 rows.
4. **C6 — Program catalog architecture canonicalization.** Master PRD §10.5 makes platform-level program + ProgramMarketPolicy + four-layer Forms Engine + Pattern A + CCR runtime explicit. 10 rows.
5. **C4 — Country-conditional DTC marketing posture (new ADR-027).** 11 rows.
6. **C5 — Research data partnership Posture A as Release 2 goal (new ADR-028).** WHO/UN partnership at parent level. 5th consent tier. **25 rows; largest single block.**

### Workstream lead and adversarial reviewer

- **Workstream lead:** Evans — designated 2026-04-28 per planning freeze Phase 0 single-named-owner requirement.
- **Adversarial reviewer:** **Codex** (OpenAI Codex via the `codex@openai-codex` plugin, installed at `~/.claude/plugins/cache/openai-codex/codex/1.0.4/`). Replaces the human-adversarial role on this workstream.

### Codex adversarial-review cadence (per-phase exit gate)

After each v1.10 phase exits (Phase 0 matrix walk → Phase 6 operations housekeeping), run an adversarial review before advancing:

```
/codex:adversarial-review --base main Telecheck_v1_10_PRD_Update/
```

Tighten the scope per phase as needed (focus text after the flags). The Stop hook (`stop-review-gate-hook.mjs`, 15-min timeout) is wired and acts as a backstop review gate at end of every Claude turn — does not replace per-phase invocation.

**Authorized autoinvocation:** Per Evans's directive 2026-04-28, future Claude sessions are authorized to trigger Codex adversarial review automatically at every phase/milestone exit on the v1.10 workstream — no need to ask first. Since the plugin's slash commands are user-invocation-only (`disable-model-invocation: true`), invoke the underlying companion script directly via Bash:

```bash
node "C:/Users/menso/.claude/plugins/cache/openai-codex/codex/1.0.4/scripts/codex-companion.mjs" adversarial-review "--background --base main Telecheck_v1_10_PRD_Update/"
```

This preserves the plugin's adversarial framing (challenges design choices, not just defects) while bypassing the model-invocation guardrail on the slash-command wrapper. Use `--background` for long reviews so they run out-of-turn; check progress with `codex-companion.mjs status` or surface `/codex:status` to Evans. Tighten scope per phase by adding focus text after the flags.

### Post-cycle rules (workstream is COMPLETE; rules below are now historical / read-only)
- **v1.9 is now Superseded; v1.10 is canonical in the bundle** (Phase 6 promotion 2026-05-01; Promotion Ledger P-008). The file `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Master_Platform_PRD_v1_9.md` remains preserved at its original path for traceability — do **not** edit it (the standard "do not edit Superseded files" rule applies).
- **The drafted PRD at `Telecheck_v1_10_PRD_Update/Telecheck_Master_Platform_PRD_v1_10.md` is the working draft that became canonical** — the canonical engineering reference is the bundle copy (`Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Master_Platform_PRD_v1_10.md`).
- **Companion artifacts moved into the bundle at Phase 6 promotion:** Program Porting Checklist v1.0 became a bundle artifact; ADR-027, ADR-028, ADR-029 were authored fresh and Accepted; Artifact Registry bumped v2.9 → v2.10; Promotion Ledger received entries P-008 (v1.10 promotion) and P-009 (v1.10.1 hygiene cycle).
- **DIC v1.0 → v1.1 was promoted at Phase 6** (Evans's Option B fold-in 2026-04-28 executed via the v1.10 matrix). DIC v1.0 PROVISIONAL is superseded; DIC v1.1 is Canonical for development.
- **Future v1.10.x hygiene cycles** (if needed): follow the v1.10.1 cycle's discipline — branch off main, run multi-round Codex adversarial verification until convergence, exit with a status doc, merge `--no-ff` to main with a Promotion Ledger entry.

## Current canonical versions (cross-check before assuming)

**Post-v1.10 promotion 2026-05-01 (Phase 6 promotion ceremony per Evans's "authorized" instruction):**

Master PRD **v1.10** · Artifact Registry **v2.10** · System Architecture v1.2 · CDM v1.2 · State Machines v1.1 · OpenAPI v0.2 · RBAC v1.1 · Contracts Pack **v5.2** (11 files at v5.2: 9 amended + 2 NEW WORKLOAD_TAXONOMY/AUTONOMY_LEVELS; ERROR_MODEL + IDEMPOTENCY + SOURCE_OF_TRUTH preserved at v5.1; MARKET_LAUNCH v5.0 → v5.1) · Engineering Handoff v1.3 · Operational Readiness v1.5 · Ghana Playbook v1.2 · ADR Set v1.0 + Addendums 016–019, 020–025, 026 + **ADR-027 Country-Conditional DTC Marketing** + **ADR-028 Research Data Partnership Posture A** + **ADR-029 AI Workload Taxonomy** (all 3 Accepted at v1.10 promotion) · DIC **v1.1 Canonical for development** (Patient mock v7 binding visual reference per Evans Option B 2026-04-28 fold-in) · Forms/Intake v2.1 · Pharmacy + Refill v2.1 · Admin Backend v1.1 · all other slice PRDs v1.0.

**v1.10 cycle additions:** 3 new invariants (I-029/030/031); 11 new CCR keys (4 marketing + 7 research); 8 new audit events (6 research + 2 marketing); Program Porting Checklist v1.0; 4 country regulatory placeholder files (Country_Regulatory_Contracts, Pharmacy_Council_Guidance, DSA_Template, REC_IRB_Engagement).

**v1.10 cycle delta-artifact convention (now historical):** During the v1.10 promotion ceremony 2026-05-01, the Phase 6 housekeeping bumped existing bundle file *headers* to v5.2 with a doc-control entry pointing to the delta artifacts at `Telecheck_v1_10_PRD_Update/Phase3_*` (Contracts Pack) and `Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` (Slice PRDs + Engineering specs + OR Tracker + Other docs); the file *bodies* remained at their pre-v1.10 baseline. **The follow-on v1.10.1 hygiene cycle (exit 2026-05-02, merged to main as `9389ef7`) physically merged those deltas into the bundle file bodies**, so engineers reading bundle files now get the v1.10 cycle content directly. The delta artifacts under `Telecheck_v1_10_PRD_Update/Phase3_*` and `Phase5_*` are preserved for traceability and audit-trail purposes only.

## No code, no commands

There are no commands to build, test, lint, or run anything. Validation of this corpus is documentary:
- Sanity-check pointers across both notation classes after a version bump.
- Rebuild manifest from filesystem listing (not prose) when files change.
- Append (never overwrite) Promotion Ledger entries per cycle.
- Verify cross-references resolve to current canonical versions.

## Autonomous-work authorization (Evans standing directive, 2026-05-16+)

When the Master Completion Plan v1.0 has open Phase A / Phase B items (see `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Master_Completion_Plan_v1_0.md`), Claude is **authorized to work continuously** through the Codex-per-PR adversarial-review cycle without per-action confirmation prompts.

### What this authorization covers

- **Build:** author new modules / handlers / migrations / specs against the Plan's tracks (Track 1 Clinical Care, Track 2 AI Service, Track 3 Consent + Forms-Intake, Track 4 Mobile + UI, Track 5 Infra & Ops, Track 6 Spec-corpus ratification).
- **Per-PR adversarial review:** autoinvoke Codex (`codex@openai-codex` plugin via the companion script — see "Codex adversarial-review cadence" above) at every PR open; iterate through findings round-by-round until APPROVE.
- **Merge:** squash-merge any PR with Codex APPROVE + green CI without asking.
- **Document:** append an Addendum to `Telecheck_v1_10_PRD_Update/AI_Service_Rollout_24h_Status_2026-05-14.md` and bump `progress.json` revision per merged PR.
- **Schedule next iteration:** when running under `/loop` with dynamic pacing, self-pace the next firing via `ScheduleWakeup` to continue picking up the next critical-path item.

### Hard floor — STOP and surface

The authorization does NOT cover, and these still require explicit user input mid-cycle:

1. **Codex CRITICAL findings that turn on a policy / regulatory / architectural judgment** (security posture, FDA / HIPAA classification, novel ADR-class decisions, multi-tenant isolation invariants).
2. **Prohibited actions per the global safety rules** — financial transactions, permission / access-control changes, deletions, secret handling, sharing data with external systems.
3. **Spec-corpus ratification ceremonies** — Track 6 work that requires the spec-corpus ratifier (Evans + Engineering Lead + CDM owner) to sign off on a Promotion Ledger entry. Claude can file SIs and propose row shapes for ratification; Claude CANNOT execute the ratification unilaterally.
4. **Production deploys** — F-4 deploy runbook execution requires explicit operator action on the AWS / DB side.
5. **Cross-tenant break-glass operations** — I-024 platform-floor; always operator-gated.
6. **Any Codex finding that proposes net-new architecture, schema, or invariant amendment beyond the ratified sub-decision scope of the SI under review is a hard STOP requiring ratifier escalation. Do not close it inline.** (Added 2026-05-19 per the SI-010 trust-anchor rejection cycle worked example: PR #10 ran 30 iterations past the first architectural-judgment finding (R3 round-3 HIGH on rollback-independent commit path), each new iteration extending unratified architecture. PR #11 STOPPED at R1 architectural-judgment finding, escalated via Engineering Review Request artifact, returned with the unanimous NO answer in ~24h, and converged to APPROVE in 5 rounds. The contrast IS the worked example: same Codex tool, same iteration mechanism, two different cycle outcomes driven by whether STOP-and-escalate was honored. Discriminator: a finding is architectural-judgment when it proposes (a) net-new canonical schema fields, (b) net-new canonical invariants or invariant amendments, (c) net-new platform-floor primitives (DB roles, audit-chain partitions, role-elevation patterns, dedicated infrastructure instances, etc.), or (d) any amendment to a canonical contract surface that the SI under review has not already scoped as a sub-decision. Closing it inline by iterating with prose changes within the same SI source-file violates the discipline. The proper response is to author an escalation artifact — Decision Memo, Engineering Review Request, or ratifier mini-review — and route to the appropriate quorum. Prose-consistency findings, within-scope clarifications, and SUPERSEDED-annotation discipline closures DO NOT trigger this hard floor; they remain closeable inline within the standard 2-rounds-then-§10-escalation cadence per v1.10.1 hygiene-cycle precedent.)

### Discipline floor (always-on, even under loop)

- **Codex APPROVE is mandatory before any merge.** No exceptions for time pressure.
- **Spec ratification leads implementation by ≥1 sprint.** Do not author canonical schemas; file an SI and route to Track 6.
- **Audit invariants (I-003 append-only, I-019 crisis-floor, I-023 tenancy, I-025 tenant-blind errors, I-027 audit attribution) are platform-floor.** Bare suppression on audit failure forbidden.
- **Glossary terms canonical** (`medication_request` not `prescription`, `Mode 1` / `Mode 2` not `chatbot`, `tenant` not `customer`).
- **Addendum-trail discipline:** every merged PR gets an Addendum + cockpit bump. The Addendum-trail in the status doc is the cross-session continuity mechanism that lets future sessions (or new instances under `/schedule`) reconstruct "where we are."

### Loop / schedule operating modes

- **`/loop` (dynamic pacing)** is the canonical in-session mechanism for autonomous work. Pass the same prompt back via `ScheduleWakeup`; the loop continues until stopped or until the Plan's Phase F (multi-tenant launch) ships.
- **`/schedule` (cron)** is the canonical cross-session mechanism. Each firing reads the latest Addendum, picks the next critical-path item, ships through Codex, appends the next Addendum.

The combination is what operationalizes "work nonstop until the project is completed." Stop conditions: explicit user "stop" / "pause," a hard-floor item from above firing, or Plan completion.
