# Codex Phase 3 GROUP-2 Review — 2026-05-01

**Review fired:** 2026-05-01 (Phase 3 — Contracts Pack edits, group 2 of 3)
**Reviewer:** Codex (gpt-5.5 via OpenAI Codex CLI v0.125.0)
**Scope:** 4 contracts — TYPES + CCR_RUNTIME + GLOSSARY + AI_LAYERING (v5.1 → v5.2 deltas)
**Cycles:** 3 (v0.1 initial fire + v0.2 verification + v0.3 micro-patch verification)

---

## Bottom line (verbatim, v0.3 final)

> "Yes. Bottom line: ready. All 4 contracts ready for matrix advance to Approved."

**🟢 STATUS: 0 HIGH / 0 MEDIUM. PHASE 3 GROUP-2 CLOSED.**

---

## v0.1 fire — findings

> **HIGH-1 — CCR research block omits `research_permitted_data_domains`.** ADR-028 / PRD §15.3 require this as the closed-enum country gate for DSA/cohort/export scope. Without it, CCR cannot enforce the §15.3 domain boundary.
>
> **HIGH-2 — CCR marketing evidence is modeled as `MarketingCopyGovernanceEvidence ID | null`** (bare ID), but ADR-027 / PRD §13.2 require a structured object with completeness gating before `permitted`. A bare ID weakens the activation gate.
>
> **MEDIUM-1 — GLOSSARY cannot be purely additive:** existing v5.1 entries say launch tenants include "Heros Health (US)" and Mode 1 is governed by old §13.2 AI semantics. v5.2 additions would contradict stale existing entries unless those entries are amended.
>
> **MEDIUM-2 — `ResearchDataExport` lacks explicit `tenant_id` / `country_of_care`** despite export audit and PHI/high-PII tenant-scope obligations.
>
> **MEDIUM-3 — CCR change-control signers drift from ADR-027/028 activation language:** marketing uses Product Lead instead of Marketing copy governance lead / Country Launch Director path; research uses Product Lead instead of the per-country activation signer set.
>
> **MEDIUM-4 — Counts/shape internally inconsistent:** artifact says 6 CCR keys / 3 marketing + 5 research, but the schema has 4 marketing keys and 6 research keys, while missing the required permitted-domain key.

## v0.2 patches applied

**HIGH-1:** Added closed-enum `research_permitted_data_domains` field to `research` block — country-level upper bound for DSA / cohort / export domain scope (`chronic_disease_longitudinal | ncd_surveillance | pharmacovigilance_signal | population_health_aggregate`). Per-DSA scope MUST be a subset.

**HIGH-2:** Replaced bare ID with embedded structured object (regulatory_jurisdiction, regulatory_authority, regulatory_interpretation_artifact_id, interpretation_date, scope, prohibited_claim_classes[], governance_lead_designation_artifact_id required; ethics_review_concurrence_artifact_id optional). Runtime validator MUST reject any `prohibited`/`pending_evidence` → `permitted` transition if any required sub-field is null.

**MEDIUM-1:** Added "Amendments to existing v5.1 GLOSSARY entries" subsection with wording-only updates to `tenant`, `Mode 1`, `Mode 2`, `platform_floor` entries. Existing terms preserved; stale-content updates per Phase 6 promotion.

**MEDIUM-2:** Added `tenant_id` and `country_of_care` to ResearchDataExport type schema.

**MEDIUM-3:** Marketing change-control signers aligned to ADR-027 v0.5 activation chain (Marketing copy governance lead + Clinical Safety Officer + Regulatory Affairs Lead triple sign-off; Country Launch Director on activation transitions). Research change-control signers aligned to ADR-028 v0.4 activation chain (Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer + Product Lead quad sign-off; REC concurrence on `consent_only` → `active`).

**MEDIUM-4:** Document control updated to state actual counts: 4 marketing + 6 research = 10 total. Initial-values table updated to add `research_permitted_data_domains` row.

## v0.2 verification — residual finding

> "v0.2 closes HIGH-1, HIGH-2, MEDIUM-1, MEDIUM-2, and MEDIUM-3. One MEDIUM remains / is re-created: CCR_RUNTIME counts are still inconsistent. The schema has 4 marketing properties and 7 research properties because `cross_border_research_transfer_evidence` is a separate top-level research key, not a sub-field of `cross_border_research_transfer_permitted`. Document control says 4 + 6 = 10 total, but the actual shape is 11 properties."

## v0.3 micro-patch

CCR_RUNTIME v5.2 document control entry updated to **4 marketing + 7 research = 11 total new keys**, with explanatory note that `cross_border_research_transfer_evidence` is a sibling top-level companion key (not nested) so the companion artifact references can be set independently while the enum drives gating. Delta-artifact MEDIUM-4 changelog line updated to match.

## v0.3 verification (verbatim)

> "Yes. ... Bottom line: ready. All 4 contracts ready for matrix advance to Approved."

## Convergence trajectory — Phase 3 group-2

| Cycle | Findings | Action |
|---|---|---|
| v0.1 (initial fire) | 2 HIGH (research_permitted_data_domains missing; marketing evidence bare-ID weakening) + 4 MEDIUM (GLOSSARY stale entries, ResearchDataExport missing tenant context, CCR signer drift, count inconsistency) | All 6 patched |
| v0.2 (verification fire) | 1 residual MEDIUM-4 (count inconsistency re-created — schema vs doc control) | Micro-patch on doc control + delta changelog |
| **v0.3 (re-verification)** | **0 HIGH / 0 MEDIUM. CLOSED.** | All 7 matrix rows advanced |

## Matrix update applied

7 contract rows advanced from "Not started" → **Approved**:

| Row | File | Cycle | Edit Type |
|---|---|---|---|
| 38 | CCR_RUNTIME | C3 | Reference update — tenant identifier examples (per Phase 2 §1/§2 cleanup) |
| 49 | CCR_RUNTIME | C4 | New entry — marketing policy keys (3-state enum + structured evidence) |
| 62 | CCR_RUNTIME | C5 | New entry — research data policy keys (7 keys) |
| 66 | TYPES | C5 | New entry — research data types |
| 85 | CCR_RUNTIME | C6 | Reference update — Master PRD §10.5 cross-reference |
| 93 | TYPES | C7 | New entry — AIWorkloadType + AutonomyLevel enums + PolicyAuthorization placeholder |
| 94 | AI_LAYERING | C7 | Section rewrite — §10 Future workload expansion |

Sentinel row 109 updated. Cumulative matrix progress: 24 Approved, 3 Edited, 80 Not started, 1 None.

## Phase 3 next group

**Group 3 — DOMAIN_EVENTS + ERROR_MODEL + IDEMPOTENCY + FORMS_ENGINE + MARKET_LAUNCH + GOVERNANCE_CONTROLS.** Most of these expect minimal edits per cycle cascade; GOVERNANCE_CONTROLS gets the PolicyAuthorization skeleton placeholder per AUTONOMY_LEVELS §6 cross-reference.

## Document control

- **v1.0 — 2026-05-01** — Codex Phase 3 group-2 review across 4 contracts. 3-cycle convergence: v0.1 (2 HIGH + 4 MEDIUM) → v0.2 (1 residual MEDIUM count) → v0.3 (0 HIGH + 0 MEDIUM, CLOSED). 7 matrix rows advanced to Approved.
- **Companion artifacts:** `Phase3_Group2_Contracts_v1_10_Edits_2026-05-01.md` (delta artifact, v0.3 patched).
- **Status:** Delta artifact. **Phase 3 group-2 CLOSED.** Group 3 begins next.
