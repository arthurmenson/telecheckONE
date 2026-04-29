# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

This is **not a codebase** — it is the **Telecheck specification bundle** ("FINAL US REGION BASELINE"), 75 markdown files describing a multi-tenant AI-powered telehealth platform that has not yet been implemented. All work here is editing, validating, and extending the spec corpus itself.

The actual code repo (TypeScript / Fastify / PostgreSQL+RLS / React / React Native) does not exist yet. When it does, it gets its own CLAUDE.md from the **template in `Telecheck_Engineering_Handoff_Build_Guide_v1_3.md` §13** — do not confuse that template with this file.

All docs live under `Telecheck Master Bundle FINAL US REGION BASELINE/`. There is no `src/`, no package manager, no test runner, no build step.

## Read this first — every session

Before editing anything, follow `Telecheck Master Bundle FINAL US REGION BASELINE/CLAUDE_CODE_BOOT_SEQUENCE.md` in the order it specifies:

1. `Telecheck_Active_Document_Index_v1_0.md` — which file is canonical for each topic
2. `CLAUDE_CODE_BOOT_SEQUENCE.md` — execution rules (this is the source of the rules summarized below)
3. `Telecheck_Artifact_Registry_v2_9.md` §0–§3 — canonicality decisions and inventory
4. `Telecheck_Engineering_Handoff_Build_Guide_v1_3.md` §1–§3, §6, §10a — orientation and build sequencing
5. `Telecheck_Master_Platform_PRD_v1_9.md` §1–§5, §10, §17 — what is being built

Pull slice PRDs (`*_Slice_PRD_v*.md`) on demand for the specific feature you're working on, not upfront.

## Source-of-truth hierarchy (top wins on conflict)

Per `Telecheck_Contracts_Pack_v5_00_SOURCE_OF_TRUTH.md` and the Boot Sequence:

1. **Platform Invariants** (`Telecheck_Contracts_Pack_v5_00_INVARIANTS.md`) — 22 non-negotiable guarantees
2. **Architecture Decision Records** — `Telecheck_ADR_Set_v1_0.md` + Addendums 016–019, 020–025, **026**
3. **Cross-cutting contracts** — Contracts Pack v5.1 files (AUDIT_EVENTS, DOMAIN_EVENTS, ERROR_MODEL, IDEMPOTENCY, GLOSSARY, CCR_RUNTIME, AI_LAYERING, FORMS_ENGINE, MARKET_LAUNCH, GOVERNANCE_CONTROLS, TYPES)
4. **Master Platform PRD v1.9**
5. **Slice PRDs** (17 active)
6. **Engineering specs** — Canonical Data Model v1.2, State Machines v1.1, OpenAPI v0.2, System Architecture v1.2
7. **Experience specs** — Design System v1.1, IA docs, Design Implementation Contract v1.0 (PROVISIONAL)
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
- **Design Implementation Contract v1.0 is PROVISIONAL** until design files arrive — do not treat its visual specs as binding yet.

## What kind of platform this describes

- **Multi-tenant** (ADR-023 Model A): one codebase, one AWS deployment, logical isolation by `tenant_id` on every PHI record. Three-layer enforcement: PostgreSQL Row-Level Security + application-layer filtering + per-tenant KMS keys.
- **Two day-1 tenants:** Heros Health (US, greenfield, zero patients day 1) and Telecheck-Ghana (chronic care). Both share us-east-1 primary, us-west-2 cold DR per ADR-026.
- **Country-driven configuration (CCR)**: `country_of_care` drives protocols, formularies, payment processor, SMS provider, regulatory module. Decoupled from `country_of_residence` (jurisdictional regulatory residency).
- **Two-mode AI architecture (ADR-002):** Mode 1 conversational assistant (no clinical decisions), Mode 2 protocol execution agent (gated, governance-bound).
- **Modular monolith** at launch (15 modules; ADR-001), extraction-ready boundaries, separate AI Service from day one.
- **41 canonical entities, 178 OpenAPI endpoints, 13 state machines, 22 platform invariants, 25 ADRs, 17 slice PRDs.**

## Doc navigation cheatsheet

| If you're looking for… | Open… |
|---|---|
| What is Telecheck / who are users | `Telecheck_Master_Platform_PRD_v1_9.md` |
| Which file is canonical for X | `Telecheck_Active_Document_Index_v1_0.md` |
| Filesystem inventory | `Telecheck_Project_Upload_Manifest_v2.md` |
| What changed in this release | `TELECHECK_RELEASE_NOTES_US_REGION_BASELINE.md` |
| Module map / tenancy enforcement | `Telecheck_System_Architecture_v1_2.md` |
| Entity schemas | `Telecheck_Canonical_Data_Model_v1_2.md` |
| Endpoints | `Telecheck_OpenAPI_v0_2.md` |
| State machines | `Telecheck_State_Machines_v1_1.md` |
| Cross-cutting runtime contracts | `Telecheck_Contracts_Pack_v5_00_*.md` (v5.1 in headers) |
| Architecture decisions | `Telecheck_ADR_Set_v1_0.md` + 3 addendums |
| Build sequence / sprint plan | `Telecheck_Engineering_Handoff_Build_Guide_v1_3.md` |
| Per-feature spec | `Telecheck_*_Slice_PRD_v*.md` |
| Tenant-isolation extension for v1.0 slices | `Telecheck_Tenant_Threading_Addendum_v1_0.md` |
| Glossary / forbidden aliases | `Telecheck_Contracts_Pack_v5_00_GLOSSARY.md` |
| Human reviewer onboarding | `Telecheck_Reviewer_Brief_v1_0.md` |
| CLAUDE.md template for the *future code repo* | `Telecheck_Engineering_Handoff_Build_Guide_v1_3.md` §13 |

## Current canonical versions (cross-check before assuming)

Master PRD v1.9 · Artifact Registry v2.9 · System Architecture v1.2 · CDM v1.2 · State Machines v1.1 · OpenAPI v0.2 · RBAC v1.1 · Contracts Pack v5.1 (MARKET_LAUNCH at v5.0) · Engineering Handoff v1.3 · Operational Readiness v1.5 · Ghana Playbook v1.2 · ADR Set v1.0 + Addendums 016–019, 020–025, 026 · Forms/Intake v2.1 · Pharmacy + Refill v2.1 · Admin Backend v1.1 · all other slice PRDs v1.0.

## No code, no commands

There are no commands to build, test, lint, or run anything. Validation of this corpus is documentary:
- Sanity-check pointers across both notation classes after a version bump.
- Rebuild manifest from filesystem listing (not prose) when files change.
- Append (never overwrite) Promotion Ledger entries per cycle.
- Verify cross-references resolve to current canonical versions.
