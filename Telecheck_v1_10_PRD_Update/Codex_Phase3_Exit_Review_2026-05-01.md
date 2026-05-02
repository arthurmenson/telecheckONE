# Codex Phase 3 EXIT Review — 2026-05-01

**Review fired:** 2026-05-01 (Phase 3 exit gate)
**Reviewer:** Codex (gpt-5.5 via OpenAI Codex CLI v0.125.0)
**Scope:** Full Contracts Pack v1.10 transition — 11 contracts touched (10 v5.1 → v5.2; MARKET_LAUNCH v5.0 → v5.1; ERROR_MODEL + IDEMPOTENCY preserved)
**Cycles:** 2 (v0.1 initial fire + v0.2 verification)

---

## Bottom line (verbatim, v0.2)

> "Yes. v0.2 closes both findings. ... No new HIGH/MEDIUM found. Bottom line: **Phase 3 ready to declare CLOSED.**"

**🟢 STATUS: 0 HIGH / 0 MEDIUM. PHASE 3 CLEARED FOR CLOSURE.**

---

## v0.1 fire — findings

> **HIGH — research export invalidation semantics conflict.** AUDIT_EVENTS says failed `research.export_completed` emission is rejected and no completion event emits; INVARIANTS I-029 says the `research.export_initiated` → `research.export_completed` transition is rejected. But DOMAIN_EVENTS/GOVERNANCE_CONTROLS require an audit-side `research.export_completed` with `status = invalidated` and forbid silent suppression. Also, AUDIT_EVENTS does not define the `status` field that GOVERNANCE_CONTROLS relies on. Patch AUDIT_EVENTS + INVARIANTS to distinguish: domain delivery/successful completion is rejected, but audit completion-attempt may emit with `status = invalidated`, failure reason, and enforcement event.
>
> **MEDIUM — discriminator field-name drift.** Most contracts use `ai_workload_type`, but TYPES `PolicyAuthorization` uses `workload_type`, and WORKLOAD_TAXONOMY cross-reference says CDM `AIExecution` uses `workload_type`. Either rename to `ai_workload_type` everywhere or explicitly define `workload_type` as an internal alias.

## v0.2 patches applied

**HIGH (export invalidation semantics):**
- **INVARIANTS I-029** reworded to distinguish domain-side delivery rejection (no `research_export.delivered` event; no artifact leaves platform) from audit-side completion-attempt (may emit `research.export_completed` with `status = invalidated`).
- **AUDIT_EVENTS §5** export events payload schema formally defines `status` field (`completed | invalidated`) and `invalidation_reason` field (`null | dsa_status_change | k_threshold_violation | permitted_domain_drift | consent_revocation_mid_export | other`). Added explicit "two-event audit pattern for failed exports" subsection clarifying the discipline.
- **DOMAIN_EVENTS** and **GOVERNANCE_CONTROLS** were already aligned on this pattern from group-3 work; v0.2 brought INVARIANTS and AUDIT_EVENTS into the same alignment.

**MEDIUM (discriminator name normalization):**
- TYPES PolicyAuthorization placeholder: `workload_type` → `ai_workload_type`.
- WORKLOAD_TAXONOMY cross-reference to CDM AIExecution updated: explicitly states canonical name is `ai_workload_type`; earlier `workload_type` references superseded.

## v0.2 verification — clearance reasoning (verbatim)

> "Export semantics are now coherent: `research_export.delivered` is domain-side and suppressed on failure; `research.export_completed` is audit-side and may emit `status = invalidated` with `invalidation_reason` plus `signal_enforcement_trigger`."
>
> "`ai_workload_type` is normalized in the patched TYPES placeholder and WORKLOAD_TAXONOMY CDM cross-reference. Remaining `workload type` hits are descriptive, not schema drift."
>
> "No new HIGH/MEDIUM found. Bottom line: **Phase 3 ready to declare CLOSED.**"

## Convergence trajectory — Phase 3 EXIT

| Cycle | Findings | Action |
|---|---|---|
| v0.1 (initial fire) | 1 HIGH (export invalidation cross-contract conflict) + 1 MEDIUM (discriminator name drift) | Both patched |
| **v0.2 (re-verification)** | **0 HIGH / 0 MEDIUM. CLOSED.** | Phase 3 declared closed |

## Phase 3 cumulative summary

| Group | Contracts | Cycles | Final findings | Matrix rows advanced |
|---|---|---|---|---|
| Group 1 | INVARIANTS, AUDIT_EVENTS, WORKLOAD_TAXONOMY (NEW), AUTONOMY_LEVELS (NEW) | 3 | 1 HIGH + 5 MEDIUM → 1 HIGH carry → 0/0 | 6 |
| Group 2 | TYPES, CCR_RUNTIME, GLOSSARY, AI_LAYERING | 3 | 2 HIGH + 4 MEDIUM → 1 MEDIUM count → 0/0 | 7 |
| Group 3 | DOMAIN_EVENTS, FORMS_ENGINE, MARKET_LAUNCH, GOVERNANCE_CONTROLS | 2 | 2 HIGH + 3 MEDIUM → 0/0 + LOW | 5 |
| **EXIT** | **Full set cross-contract review** | **2** | **1 HIGH + 1 MEDIUM → 0/0** | **(no new rows; cross-contract only)** |
| **Total** | **11 contracts** (ERROR_MODEL + IDEMPOTENCY preserved unchanged) | — | — | **18 contract rows** |

Plus 4 F13 glossary rows from Phase 2.X = 22 contract-related rows Approved.

## Phase 3 next-step ordering

Per planning freeze v1.7 §3 Phase 3 exit criteria, Phase 3 is now CLOSED. Next phase per the §1 ordering rule:

→ **Phase 4 — Final ADR text canonicalization.** ADR-027 (Country-Conditional DTC Marketing Posture) is currently at v0.5 Phase-4-baseline-ready with triple sign-off (Product + Regulatory Affairs + Clinical Safety). ADR-028 (Research Data Partnership Posture A) is at v0.4 Phase-4-baseline-ready with quad sign-off (Product + Privacy + Regulatory Affairs + Clinical Safety). ADR-029 (AI Workload Taxonomy) is at v0.3 matrix-commit-ready. Phase 4 work: promote each from DRAFT to Accepted status with final review/approval ceremony. Estimated duration: 1-2 days.

## Document control

- **v1.0 — 2026-05-01** — Codex Phase 3 EXIT review across full Contracts Pack v1.10 transition. 2-cycle convergence: v0.1 (1 HIGH + 1 MEDIUM) → v0.2 (0 HIGH + 0 MEDIUM, CLOSED). Phase 3 declared closed.
- **Companion artifacts:** `Phase3_INVARIANTS_v1_10_Edits_2026-05-01.md`; `Phase3_AUDIT_EVENTS_v1_10_Edits_2026-05-01.md`; `Telecheck_Contracts_Pack_v5_00_WORKLOAD_TAXONOMY_DRAFT.md` v0.4 (with Phase 3 EXIT MEDIUM patch); `Telecheck_Contracts_Pack_v5_00_AUTONOMY_LEVELS_DRAFT.md` v0.4.1; `Phase3_Group2_Contracts_v1_10_Edits_2026-05-01.md` (with Phase 3 EXIT MEDIUM patch); `Phase3_Group3_Contracts_v1_10_Edits_2026-05-01.md`; per-group review delta artifacts.
- **Status:** Final delta artifact for Phase 3 cycle. **Phase 3 CLOSED.** Phase 4 (final ADR text) begins.
