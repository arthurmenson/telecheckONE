# CLAUDE_CODE_BOOT_SEQUENCE

**Purpose:** Deterministic execution rules for any Claude (incl. Claude Code) operating against this Telecheck corpus.
**Audience:** Claude. (Humans: read `Telecheck_Reviewer_Brief_v1_0.md` instead.)
**Date:** 2026-05-01 (refreshed at v1.10 PRD Update Cycle Phase 6 promotion ceremony per Evans's "authorized" instruction)
**Status:** Canonical

---

## 1. Reading order (strict)

1. `Telecheck_Active_Document_Index_v1_0.md` — identifies canonical file for each topic
2. THIS FILE — execution rules
3. `Telecheck_Artifact_Registry_v2_10.md` §0–§3 — canonicality decisions and inventory
4. `Telecheck_Engineering_Handoff_Build_Guide_v1_3.md` §1–§3, §6, §10a — orientation, build sequencing, Sprint 0
5. `Telecheck_Master_Platform_PRD_v1_10.md` §1–§5, §10, §13.7, §15.3, §17 — what is being built (v1.10 adds program catalog architecture §10.5; AI workload taxonomy §13.7; research data governance §15.3; brand-structure rules §17)
6. Read the slice PRD for the work item only when starting that work item.

**Brand vs identifier discipline (added v1.10 cycle 2026-05-01 per C3 cycle):** `Telecheck` = platform/B2B brand only (never consumer-facing); `Heros Health` = global consumer DBA, country-instanced via subdomains (`heroshealth.com` for Telecheck-US; `ghana.heroshealth.com` for Telecheck-Ghana); operating tenants follow `Telecheck-{country}` naming. See Master PRD §17 for the canonical rule and contextual carve-outs (FDA / Stripe / business terminology).

Do NOT read every document upfront. Pull on demand.

---

## 2. Authority hierarchy (top wins on conflict)

1. Active Document Index v1.0
2. Artifact Registry v2.10
3. Project Upload Manifest
4. Engineering Handoff & Build Guide v1.3
5. All other documents

If two of (1)–(4) conflict: STOP. Report the conflict. Do not pick a winner.

---

## 3. Canonical versions (memorize)

- Master Platform PRD: **v1.10** (v1.10 PRD Update Cycle promoted 2026-05-01)
- Canonical Data Model: **v1.2** (41 entities; v1.10 cycle adds research entities + AIExecution per Phase 5 group 5B; substantive edits per `Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md`)
- State Machines: **v1.1** (14 state machines + ProtocolAuthorizedAction lifecycle for AI workload taxonomy per ADR-029; substantive edits per Phase 5 group 5B)
- OpenAPI: **v0.2** (178 endpoints + research endpoints per Phase 5 group 5B)
- RBAC: **v1.1** (dual hierarchy + 3 new research roles per Phase 5 group 5B)
- System Architecture: **v1.2** (15 modules; us-east-1 primary, us-west-2 cold DR per ADR-026; v1.10 cycle adds research data module per Phase 5 group 5B)
- Engineering Handoff: **v1.3**
- OR Tracker: **v1.5** (v1.10 cycle adds 3 marketing OR items + 5 research OR items per Phase 5 group 5D)
- Contracts Pack: **v5.2** (filenames retain `v5_00` legacy pattern; headers govern. **11 files at v5.2** — 9 amended (INVARIANTS, AUDIT_EVENTS, DOMAIN_EVENTS, CCR_RUNTIME, GLOSSARY, TYPES, AI_LAYERING, FORMS_ENGINE, GOVERNANCE_CONTROLS) + 2 NEW (WORKLOAD_TAXONOMY, AUTONOMY_LEVELS); ERROR_MODEL + IDEMPOTENCY + SOURCE_OF_TRUTH preserved at v5.1; MARKET_LAUNCH v5.0 → v5.1)
- Pharmacy + Refill: **v2.1**
- Forms / Intake Engine: **v2.1**
- Admin Backend: **v1.1**
- Admin Operator IA: **v1.1**
- Notification Spec: **v1.1**
- Ghana Launch Playbook: **v1.2**
- Design System: **v1.1**
- Design Implementation Contract: **v1.1 Canonical for development** (Patient mock v7 binding visual reference per Evans Option B 2026-04-28 fold-in into v1.10 cycle as Phase 5.6 / F49)
- Artifact Registry: **v2.10**
- Active Document Index: **v1.0** (refreshed 2026-05-01 for v1.10 PRD Update Cycle Phase 6)

**Architecture decision set (canonical, v1.10):** ADR Set v1.0 + ADR Addendum 016–019 + ADR Addendum 020–025 (with **ADR-025 superseded by ADR-026**) + ADR Addendum 026 (single-region us-east-1 primary, us-west-2 cold DR) + **ADR-027 Country-Conditional DTC Marketing Posture** (Accepted 2026-05-01) + **ADR-028 Research Data Partnership Posture A** (Accepted 2026-05-01) + **ADR-029 AI Workload Taxonomy** (Accepted 2026-05-01).

**v1.10 new files:** Master PRD v1.10, ADR-027/028/029 Accepted, Contracts Pack WORKLOAD_TAXONOMY + AUTONOMY_LEVELS at v5.2, DIC v1.1, Program Porting Checklist v1.0, 4 country regulatory placeholders (Country_Regulatory_Contracts, Pharmacy_Council_Guidance, DSA_Template, REC_IRB_Engagement).

If a document references a version not on this list, treat the reference as historical (change log, supersession statement) — not as a current canonical pointer.

---

## 4. Schema authority (do NOT fork)

All canonical schemas live in:
- `Telecheck_Canonical_Data_Model_v1_2.md` §3, §4, §4-bis (+ v1.10 cycle research entities + AIExecution entity per Phase 5 group 5B)
- `Telecheck_State_Machines_v1_1.md` §1–§16 (+ ProtocolAuthorizedAction lifecycle per Phase 5 group 5B + ADR-029)
- `Telecheck_OpenAPI_v0_2.md` (endpoint shapes; v1.10 cycle adds research endpoints with `audit_sensitivity_level=high_pii` per I-031)
- `Telecheck_Contracts_Pack_v5_00_*.md` (cross-cutting invariants, types, error model; v1.10 cycle bumps **9 amended files to v5.2** + adds **2 new contracts at v5.2** (WORKLOAD_TAXONOMY, AUTONOMY_LEVELS per ADR-029) = **11 at v5.2 total**; plus MARKET_LAUNCH v5.0 → v5.1; ERROR_MODEL + IDEMPOTENCY + SOURCE_OF_TRUTH preserved at v5.1)

Slice PRDs reference these. If a slice PRD appears to define a schema that disagrees with CDM v1.2: **CDM wins.** Open a Spec Issue (per EHBG §12) — do not fork.

---

## 5. Tenancy (non-negotiable)

- Every PHI-touching record carries `tenant_id`.
- Every query filters by `tenant_id` (RLS + application + KMS — three layers).
- Cross-tenant access requires break-glass per RBAC v1.1 + audit per AUDIT_EVENTS v5.2.
- Error envelopes do NOT leak cross-tenant existence (per I-025).
- Read `Telecheck_Tenant_Threading_Addendum_v1_0.md` before implementing any v1.0 slice PRD.

---

## 6. Telecheck-US tenant (Heros Health DBA) — HIGH-12 product decision

*(Section retitled and rewritten in place 2026-05-02 per Codex Round-3 Scope 4 HIGH-1 finding — the prior `Heros tenant` heading and `Heros launches greenfield` / `Heros migration` phrasing violated the C3 brand-structure rule that bare `Heros` MUST NOT be used as a tenant or operator identifier. Per Master PRD v1.10 §17 + Glossary v5.2 §Brand and tenant terms.)*

- **Telecheck-US (Heros Health DBA — operating tenant)** launches **greenfield**. ZERO existing patients on day 1.
- No migration tooling. No bulk-import-from-Rimo. No patient data import.
- The bulk-import endpoint in ProductCatalog and CSV import in Forms Engine are tenant-onboarding tools for catalog/forms — NOT patient data migration.
- If a doc references `Heros migration` or `Heros/Rimo migration` (using bare `Heros` as a tenant or operator identifier outside §17 contextual carve-outs) — that's stale; treat as removed and use `Telecheck-US tenant migration` (operating-tenant identifier) or `Heros Health DBA migration` (consumer-DBA scope) per the C3 vocabulary depending on context.

---

## 7. Design Implementation Contract status (Evans Option B 2026-04-28 fold-in into v1.10 cycle as Phase 5.6 / F49 — replaces v1.0 PROVISIONAL HIGH-11 framing 2026-05-01)

- DIC v1.1 is **Canonical for development** as of v1.10 PRD Update Cycle Phase 6 promotion 2026-05-01.
- **Patient interactive mock v7** at `telecheck-design-system/project/Patient interactive mock v7.html` (and its sibling `v7 - *.jsx` companions and `v7.css` files) is the **binding visual reference**. Reimplementation cycles begin against the v7 mock pixel-exactly.
- §4.1 / §4.2 pixel-exact-match clauses are ACTIVATED (no longer marked PROVISIONAL).
- Substitution flags carry forward: Manrope (font), Lucide (icons), wordmark, photography placeholders — replace before customer ship. The substitution-flag carry-forward does NOT relax the pixel-exact-match requirement against the v7 mock.
- Pharmacy portal kit gap: not in v1 design system; gap to be filled when pharmacy slice work begins.
- Multi-tenant brand variations: neutral platform default + Heros Health consumer DBA (country-instanced; primary surface is `heroshealth.com` for Telecheck-US and `ghana.heroshealth.com` for Telecheck-Ghana). Future tenants surface their own consumer brand at country subdomains; all share the Telecheck platform infrastructure.
- DIC v1.0 PROVISIONAL is superseded; v1.0 file preserved at existing path for traceability per copy + supersede convention.
- Architecture, data model, state machines, API contracts, backend logic are NOT affected by DIC status.

---

## 8. Files to ignore

Do NOT implement from any file listed in `Telecheck_Active_Document_Index_v1_0.md` §4 (Superseded). They exist for traceability only.

If you encounter a `/mnt/project/Telecheck_*_v1_0.md` reference (or earlier version) and a newer version exists in this bundle: read the newer version. The path in /mnt/project/ may be stale.

---

## 9. Conflict resolution

| Conflict type | Resolution |
|---|---|
| Two control-plane docs disagree (ADI vs Registry vs Manifest vs EHBG) | STOP. Report. Do not pick. |
| Slice PRD vs CDM v1.2 schema | CDM wins. Open Spec Issue. |
| Slice PRD vs OpenAPI v0.2 endpoint shape | OpenAPI wins. Open Spec Issue. |
| Slice PRD vs State Machines v1.1 transition | State Machines wins. Open Spec Issue. |
| Tenant Threading Addendum vs slice PRD content | Threading Addendum extends — both apply; addendum binds for tenant-isolation semantics. |
| Unified Admin Sidebar vs Admin Operator IA / Admin Configuration Surfaces / Admin Backend (sidebar layout) | Unified Admin Sidebar wins for sidebar layout only; predecessor docs win for substantive workflow content. |
| Filename `v5_00` vs header `v5.2` (Contracts Pack) | Header wins (v5.2 is canonical for **11 files**: 9 amended + 2 new — WORKLOAD_TAXONOMY, AUTONOMY_LEVELS; ERROR_MODEL + IDEMPOTENCY + SOURCE_OF_TRUTH preserved at v5.1; MARKET_LAUNCH v5.0 → v5.1). |
| Older doc references ADR-025 (af-south-1 primary, us-east-1 DR) | **ADR-026 wins.** ADR-025 is superseded. Region of record: us-east-1 primary, us-west-2 cold DR. |
| Older doc references ADR-002 binary AI mode framing for **new** workload additions | **ADR-029 wins prospectively** for new workload additions; ADR-002 remains binding for current Mode 1 / Mode 2 (now relabeled `conversational_assistant` / `protocol_execution`) until separate successor ADR. Master PRD §13.7 single normative source of truth for I-012 + autonomy-level interaction. |
| Older doc references `§13.6` marketing copy governance | **Master PRD v1.10 §13.2 wins** (with internal "Governance review process" subsection); §13.6 is not a v1.10 section heading. ADR-027 is canonical for country-conditional DTC marketing. |
| Older doc references `§X NEW` research data governance | **Master PRD v1.10 §15.3 wins** (Research data governance). ADR-028 is canonical for Posture A. |
| Older doc uses bare `Heros` as tenant/operator identifier | **C3 cycle wins.** Operating tenant naming `Telecheck-{country}`; consumer DBA `Heros Health` (country-instanced). "Heros" alone forbidden as tenant identifier per Master PRD §17. |
| Older doc uses bare `workload_type` field name | **`ai_workload_type` is canonical** per Phase 3 EXIT MEDIUM cleanup. Master PRD §13.7 single source of truth. |
| Older doc references DIC v1.0 PROVISIONAL | **DIC v1.1 Canonical for development wins** (Patient mock v7 binding visual reference per Evans Option B 2026-04-28 fold-in into v1.10 cycle Phase 5.6 / F49). |
| Older doc references Contracts Pack v5.1 | **v5.2 wins** for the **11 v1.10-amended-or-new files** (9 amended in Phase 3: INVARIANTS, AUDIT_EVENTS, DOMAIN_EVENTS, CCR_RUNTIME, GLOSSARY, TYPES, AI_LAYERING, FORMS_ENGINE, GOVERNANCE_CONTROLS + 2 NEW: WORKLOAD_TAXONOMY, AUTONOMY_LEVELS); ERROR_MODEL + IDEMPOTENCY + SOURCE_OF_TRUTH preserved at v5.1; MARKET_LAUNCH v5.0 → v5.1. |
| TBD / placeholder text remains in document | Do not invent. Open Spec Issue. |

---

## 10. Workstream entry rules

Before writing code for a slice or feature:

1. Read the slice PRD in full
2. Read the corresponding Tenant Threading Addendum §3.X (if v1.0 slice)
3. Read CDM v1.2 entity definitions for the entities in scope
4. Read State Machines v1.1 §X for the state machines in scope
5. Read OpenAPI v0.2 endpoints for the API surface in scope
6. Read relevant Contracts Pack v5.2 invariants (especially I-003 audit append-only, I-024 break-glass, I-025 information-leak prevention, I-027 tenant isolation; v1.10 cycle adds I-029/030/031 research data partnership invariants — see INVARIANTS contract v5.2 + delta artifact `Phase3_INVARIANTS_v1_10_Edits_2026-05-01.md`)
7. Check Operational Readiness Tracker v1.5 for any open Tier-1/Tier-2 items in scope (v1.10 cycle adds 3 marketing OR items per ADR-027 + 5 research OR items per ADR-028 — see Phase 5 group 5D delta artifact)
8. Check `Telecheck_Adversarial_Counsel_Review_Sessions_1_to_3.md` for any review findings on this slice (now closed but informative)

If steps 1–8 surface conflicts: STOP and open a Spec Issue.

---

## 11. What this file does NOT do

- It does NOT replace the EHBG. Sprint plans, hard rules, CLAUDE.md template, and risk register live in EHBG v1.3.
- It does NOT replace the Reviewer Brief. Human onboarding context lives there.
- It does NOT cover product decisions. Those live in Master PRD v1.10 and the ADR Set (including ADR Addendum 026 + new v1.10 ADR-027 / ADR-028 / ADR-029 Accepted at Phase 6 promotion 2026-05-01).

This file's only job: tell Claude how to navigate the corpus deterministically without inventing or guessing.
