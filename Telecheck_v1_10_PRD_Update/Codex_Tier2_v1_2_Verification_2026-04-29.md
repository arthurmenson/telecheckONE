# C7 (Tier 2 Forward-Compat) v1.2 — Codex Verification Pass

**Review date:** 2026-04-29 (third pass on C7 series)
**Reviewer:** Codex (gpt-5.5 via OpenAI Codex CLI v0.125.0, ChatGPT-account auth)
**Tokens used:** 27,402
**Companion artifacts:** Codex_Tier2_PreCommit_Review_2026-04-29.md (v1.0); Codex_Tier2_v1_1_Verification_2026-04-29.md (v1.1).

**Bottom line (verbatim):** *"C7 v1.2 is very close, but I would not call it fully clean for matrix commit yet if the standard is 'all 7 remaining items closed.' Six are closed; V1-N3 remains PARTIAL because the cost/avoidance estimate still has a small internal mismatch. This needs a tiny v1.3 metadata/cost wording hotfix, not redesign."*

**Status:** 6 of 7 v1.1 carry-forward items CLOSED. V1-N3 PARTIAL. v1.3 hotfix in progress.

---

## Verification of v1.1 carry-forward items

| Item | Status | Citation |
|---|---|---|
| Finding 8 — memory_scope active definitions | **CLOSED** | WORKLOAD_TAXONOMY §4.3 defines `session`, `patient_episode`, `program_history` with scope, lifetime, tenant constraint, retention. Reserved values runtime-rejected. |
| Finding 10 — retrofit-cost overclaim | **CLOSED** | T2 Scope replaces "~6-8 weeks avoided" with "~3-4 weeks classification refactor"; ADR-029 Context aligns. |
| Finding 11 — "+3% cost" overclaim | **CLOSED** | T2 Scope says "~+3-5% engineering cost… ONLY IF" with explicit exclusions. |
| V1-N1 — version metadata drift | **CLOSED** | Headers bumped to v0.3 DRAFT in WORKLOAD_TAXONOMY and AUTONOMY_LEVELS. |
| V1-N2 — canonical-source ambiguity | **CLOSED** | WORKLOAD_TAXONOMY §5 designated single source of truth; ADR-029 Decision §3 references rather than restates. |
| V1-N3 — cost/avoidance estimate conflict | **PARTIAL** | T2 Scope: "~3-4 weeks classification refactor"; T2 Total Cost Summary: "~2-3 weeks classification + (audit envelope)" → "Total cost-avoidance is ~3-4 weeks". Same number eventually but inconsistent decomposition. |
| V1-N4 — field naming mismatch | **CLOSED** | T2-R07, ADR-029 §5, AUTONOMY_LEVELS §3.1/§3.2 all use `supervising_policy_id`. |

## New issues introduced by v1.2

**V2-N1 (minor, non-blocking):** Tier2 Document Control says N1 bumped headers to v0.2 DRAFT, but they're now v0.3 DRAFT. Stale changelog wording.

**V2-N2 (same root as V1-N3):** Cost source-of-truth still slightly inconsistent. Bundle says canonical references must match; classification refactor is ~3-4 weeks in T2 Scope but ~2-3 weeks in T2 Total Cost Summary.

## v1.3 patch summary (status: applied 2026-04-29)

| Item | File | Patch |
|---|---|---|
| V1-N3 PARTIAL → CLOSED | Tier2_Matrix_Row_Additions §Scope and §Total Cost Summary | Decomposed: ~2-3 weeks classification refactor + ~1 week audit-envelope migration = ~3-4 weeks total. Both sections now state the same decomposition. |
| V2-N1 stale changelog | Tier2_Matrix_Row_Additions §Document control | Changelog entry for N1 (v1.2 patches) updated to reflect actual bumped version (v0.3 DRAFT, not v0.2 DRAFT). |

---

## Document control

- **v1.0 — 2026-04-29** — Codex verification pass on C7 v1.2. 6 of 7 carry-forward items CLOSED, V1-N3 PARTIAL. Bottom line: tiny v1.3 hotfix needed; no redesign.
- **Companion artifacts:** Codex_Tier2_PreCommit_Review_2026-04-29.md, Codex_Tier2_v1_1_Verification_2026-04-29.md.
- **Status:** Delta artifact. V1-N3 closure + V2-N1 stale wording fix incorporated in C7 v1.3 hotfix; v1.3 verified clean by Codex 2026-04-29 (Codex_Tier2_v1_3_Verification_2026-04-29.md). C7 ready for matrix commit.
