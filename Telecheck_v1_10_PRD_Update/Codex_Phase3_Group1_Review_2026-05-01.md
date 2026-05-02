# Codex Phase 3 GROUP-1 Review — 2026-05-01

**Review fired:** 2026-05-01 (Phase 3 — Contracts Pack edits, group 1 of N)
**Reviewer:** Codex (gpt-5.5 via OpenAI Codex CLI v0.125.0)
**Scope:** 4 contracts — INVARIANTS v1.10 delta + AUDIT_EVENTS v1.10 delta + WORKLOAD_TAXONOMY draft v0.4 + AUTONOMY_LEVELS draft v0.4
**Cycles:** 3 (v0.1 initial fire + v0.2 verification + v0.3 micro-patch verification)

---

## Bottom line (verbatim, v0.3)

> "Yes. v0.3 closes the remaining HIGH for `research.export_completed`: it now captures completion-time DSA status and permitted-domain snapshot, with invalidation/rollback if either fails. Assuming the other three contracts remain as previously verified, all 4 contracts are ready for matrix advance to **Approved**."

**🟢 STATUS: 0 HIGH / 0 MEDIUM. PHASE 3 GROUP-1 CLOSED.**

---

## v0.1 fire — findings

> **HIGH — AUDIT_EVENTS export payload does not satisfy I-031.** I-031 requires `cohort_version`, `dsa_version`, and `requester_role` in the immutable export audit record, but `research.export_initiated` / `research.export_completed` only carry `cohort_definition_id`, `dsa_id`, `requester_id`, `requester_partner_id`, etc.
>
> **MEDIUM-1 — AUDIT_EVENTS I-012 mirror is incomplete.** §3 rejects reserved levels "until ADR-030+ successors activate," but omits the Master PRD's explicit two-condition AND: successor ADR plus activation audit event.
>
> **MEDIUM-2 — AUDIT_EVENTS schema enum is narrower than the taxonomy contracts.** `ai_workload_type` lists only active values and `autonomy_level` lists only active lower-three values, while WORKLOAD_TAXONOMY/AUTONOMY_LEVELS define reserved enum values too.
>
> **MEDIUM-3 — Research export events lack enough evidence for after-the-fact I-029 verification.** Add DSA status/version/domain snapshot, consent-cohort snapshot/hash or equivalent, `k_min_required`, and cohort version.
>
> **MEDIUM-4 — Marketing rendered event is slightly under-specified vs §13.2.** Lacks explicit governance review reference and approval timestamp.
>
> **MEDIUM-5 — AUTONOMY_LEVELS §3.1 adds `Rollback trigger defined` as an activation prerequisite.** Stricter than the Master PRD §13.7 list; if "exact mirror" is required, patch or source it.
>
> "**Ready:** INVARIANTS and WORKLOAD_TAXONOMY can advance. **Patch round needed:** AUDIT_EVENTS; AUTONOMY_LEVELS if exactness is mandatory."

## v0.2 patches applied

**HIGH (export payload):** Added to both `research.export_initiated` and `research.export_completed`: `cohort_version`, `dsa_version`, `requester_role`, `dsa_status_at_export`, `permitted_data_domains_at_export[]`, `k_min_required`, `consent_cohort_snapshot_hash` (immutable across export lifecycle).

**MEDIUM-1:** AUDIT_EVENTS §3 reproduces §13.7 v0.3 two-condition AND for reserved-level activation (successor ADR + activation audit event; ADR approval alone never sufficient).

**MEDIUM-2:** §1 audit envelope schema lists full enum for `ai_workload_type` (5 values: 2 active + 3 reserved) and `autonomy_level` (5 values: 3 active + 2 reserved); enum-coverage rule clarifies that schema presence ≠ activation.

**MEDIUM-3:** Closed by HIGH fix.

**MEDIUM-4:** `marketing.surface_rendered` carries `governance_review_reference_id`, `governance_review_approval_timestamp`, `governance_review_approval_validity_until`.

**MEDIUM-5:** AUTONOMY_LEVELS §3.1 list mirrors §13.7 line 645 exactly; `rollback_trigger defined per PolicyAuthorization` factored out as contract-side additional requirement sourced from GOVERNANCE_CONTROLS, not §13.7.

## v0.2 verification — residual finding

Codex caught that the v0.2 patch claim "both events carry the new fields" was false for `research.export_completed` — patch only landed on `research.export_initiated`, not on `research.export_completed`. Specifically `dsa_status_at_export` and `permitted_data_domains_at_export[]` were missing from `research.export_completed`.

## v0.3 micro-patch

Added to `research.export_completed` payload: `dsa_status_at_export` (verified at completion time per I-029; if status changed during export, the completion event records the change and the export is invalidated/rolled back); `permitted_data_domains_at_export[]` (snapshot at completion; MUST match the `research.export_initiated` value or the export is invalidated).

## v0.3 verification — clearance reasoning

> "Yes. v0.3 closes the remaining HIGH for `research.export_completed`: it now captures completion-time DSA status and permitted-domain snapshot, with invalidation/rollback if either fails. Assuming the other three contracts remain as previously verified, all 4 contracts are ready for matrix advance to **Approved**."

## Convergence trajectory — Phase 3 group-1

| Cycle | Findings | Action |
|---|---|---|
| v0.1 (initial fire) | 1 HIGH (I-031 export payload) + 5 MEDIUM (I-012 mirror, schema enum drift, I-029 evidence, marketing under-specified, AUTONOMY §3.1 extra item) | All 6 patched |
| v0.2 (verification fire) | 1 HIGH carry-forward (export_completed missing 2 fields claimed in patch note) | Micro-patch on those 2 fields |
| **v0.3 (re-verification)** | **0 HIGH / 0 MEDIUM. CLOSED.** | All 6 matrix rows advanced |

## Matrix update applied

6 contract rows advanced from "Not started" → **Approved**:

| Row | File | Cycle | Edit Type |
|---|---|---|---|
| 54 | INVARIANTS | C4 | Reference update — verify floor still holds (no relaxation) |
| 64 | AUDIT_EVENTS | C5 | New entry — 6 research events |
| 69 | INVARIANTS | C5 | New entry — I-029, I-030, I-031 |
| 92 | AUDIT_EVENTS | C7 | New section + new fields — workload-taxonomy envelope |
| 95 | WORKLOAD_TAXONOMY | C7 | New file authoring |
| 96 | AUTONOMY_LEVELS | C7 | New file authoring |

Sentinel row 109 updated. Cumulative matrix progress: 17 Approved, 3 Edited, 87 Not started, 1 None.

## Phase 3 next groups

Per planning freeze §3 Phase 3, remaining contract groups to address:

- **Group 2 — TYPES + CCR_RUNTIME + GLOSSARY + AI_LAYERING.** TYPES adds new entity types (ProgramMarketPolicy, ProgramCatalogEntry, MarketingCopy, MarketingCopyGovernanceEvidence, ResearchDataExport, ResearchEthicsReviewBody, DataSharingAgreement, AIWorkloadType, AutonomyLevel). CCR_RUNTIME adds 6 new keys per §13.2 + §15.3 + Master PRD §10.5. GLOSSARY folds in 37 reconciled terms from Phase 2.X. AI_LAYERING adds §X supersession scope clause per ADR-029.

- **Group 3 — DOMAIN_EVENTS + ERROR_MODEL + IDEMPOTENCY + FORMS_ENGINE + MARKET_LAUNCH + GOVERNANCE_CONTROLS.** Minor edits per cycle cascade for most; GOVERNANCE_CONTROLS gets PolicyAuthorization skeleton placeholder (per AUTONOMY_LEVELS §6 cross-ref).

## Document control

- **v1.0 — 2026-05-01** — Codex Phase 3 group-1 review across 4 contracts. 3-cycle convergence: v0.1 (1 HIGH + 5 MEDIUM) → v0.2 (1 HIGH carry-forward) → v0.3 (0 HIGH + 0 MEDIUM, CLOSED). 6 matrix rows advanced to Approved.
- **Companion artifacts:** `Phase3_INVARIANTS_v1_10_Edits_2026-05-01.md`; `Phase3_AUDIT_EVENTS_v1_10_Edits_2026-05-01.md`; `Telecheck_Contracts_Pack_v5_00_WORKLOAD_TAXONOMY_DRAFT.md` v0.4; `Telecheck_Contracts_Pack_v5_00_AUTONOMY_LEVELS_DRAFT.md` v0.4.1.
- **Status:** Delta artifact. **Phase 3 group-1 CLOSED.** Group 2 begins next.
