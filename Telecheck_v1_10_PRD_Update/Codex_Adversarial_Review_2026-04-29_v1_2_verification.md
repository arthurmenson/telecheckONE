# v1.10 Planning Freeze v1.2 — Codex Verification Pass

**Review date:** 2026-04-29 (third pass)
**Reviewer:** Codex (gpt-5.5 via OpenAI Codex CLI v0.125.0, ChatGPT-account auth)
**Invocation:** Direct `codex exec` with stdin pipe; fed both the v1.1 verification review and the v1.2 patched planning freeze.
**Tokens used:** 23,674
**Companion artifacts:** [Codex_Adversarial_Review_2026-04-29.md](Codex_Adversarial_Review_2026-04-29.md) (v1.0 review), [Codex_Adversarial_Review_2026-04-29_v1_1_verification.md](Codex_Adversarial_Review_2026-04-29_v1_1_verification.md) (v1.1 verification). This file is the verification pass on the v1.2 patches.

**Bottom line (verbatim):** *"v1.2 is substantially cleaner and closes the ADR gate, frozen/mutable distinction, revalidation coverage, and deferred-scope semantics. However, it should not proceed to Phase 0 walk without a tiny v1.3 patch or hotfix: replace the remaining fixed '90 rows' gates in §7 and §3 with 'Phase-0-locked matrix rows/count.' This is a small consistency patch, not a structural blocker, but Phase 0 should not start with the primary sign-off gate contradicting the new row-count rule."*

**Status of v1.1 open items (7):** 5 CLOSED, 2 PARTIAL — both PARTIALs share the same root cause (residual hardcoded "90 rows" in §3 and §7 contradicting the new v1.2 row-count rule in §1/§8).

---

## Verification of v1.1 open items

| Item | Status | Verification |
|---|---|---|
| Finding 5 PARTIAL / ADR gate | **CLOSED** | §3 Phase 2 now aligns prerequisites and exit criteria. The exit criteria explicitly require ADR-027/028 drafts to include `Status, Context, Decision, Consequences, Activation requirements, and Posture A scope / activation mechanism`. This closes the prior mismatch. |
| Finding 6 PARTIAL / row-count scope | **PARTIAL** | §1 and §8 now correctly define 90 rows as a v1.0 baseline and say the count locks at Phase 0 exit. However, §7 still says "All 90 matrix rows reach status Approved," which reintroduces a fixed-count gate after the document says the count may change. |
| N1 / scope count unstable | **PARTIAL** | Mostly fixed by §1 "v1.2 row-count rule" and §8 "provisional 90 rows," but not fully closed because §7 still hardcodes "All 90 matrix rows." That gate must become "all Phase-0-locked matrix rows." |
| N2 / ADR draft gate inconsistent | **CLOSED** | §3 Phase 2 exit criteria now explicitly include activation requirements and Posture A scope / ADR-027 activation mechanism. The prerequisite and exit gate now match. |
| N3 / "Frozen" conflicts with matrix mutation | **CLOSED** | Header and "Scope of Frozen" paragraph clearly distinguish frozen execution plan from mutable traceability matrix under Phase 0 controls. |
| N4 / revalidation coverage overstated | **CLOSED** | §7 now states deterministic dependency-triggered revalidation applies only to Phase-0-tagged rows, while non-tagged rows rely on manual reviewer responsibility. That removes the prior coverage overstatement. |
| N5 / deferred-vs-in-scope blur | **CLOSED** | §5 is now split into truly out-of-scope, deferred-to-walk but in-cycle, and reclassified active items. Findings 7 and 8 are correctly listed in §5.B as in-cycle work, not truly out of scope. |

---

## New issues introduced by v1.2

### V2-N1. §7 still hardcodes "All 90 matrix rows" despite the v1.2 row-count rule

This is the main remaining control defect. §1 and §8 say the count is provisional and locks at Phase 0 exit, but §7's sign-off gate still assumes exactly 90 approved rows. If Phase 0 adds rows, §7 becomes wrong; if no rows are added, §7 is accidentally correct but still contradicts the rule.

**Recommended patch:** §7 first checkbox "All 90 matrix rows reach status 'Approved'" → "All Phase-0-locked matrix rows reach status 'Approved' (final count established at Phase 0 exit per §1 row-count rule)."

### V2-N2. §3 opening sentence also still speaks as if 90 is fixed

§3 says, "The matrix has 90 rows," while §1 says 90 is only the baseline. Lower severity than §7, but it should say "The matrix starts from a 90-row baseline" or similar.

**Recommended patch:** §3 opening sentence → "The matrix starts from a 90-row baseline (final count locks at Phase 0 exit per §1)."

---

## Severity-rolled summary

| # | Item | Status | v1.3 patch |
|---|---|---|---|
| Finding 5 PARTIAL | ADR gate | CLOSED | None |
| Finding 6 PARTIAL | Row-count scope | PARTIAL | §7 + §3 hardcoded "90 rows" replaced |
| N1 | Row count unstable | PARTIAL | Same as Finding 6 |
| N2 | ADR draft gate | CLOSED | None |
| N3 | "Frozen" semantics | CLOSED | None |
| N4 | Revalidation coverage | CLOSED | None |
| N5 | §5 deferred blur | CLOSED | None |
| V2-N1 | §7 hardcoded 90 | NEW | §7 first checkbox rephrased |
| V2-N2 | §3 hardcoded 90 | NEW | §3 opening sentence rephrased |

**Effort to v1.3:** ~2 minutes. Two text replacements; pure consistency hotfix.

---

## Document control

- **v1.0 — 2026-04-29** — Verification pass on Planning Freeze v1.2. Confirms 5 of 7 prior open items closed, 2 PARTIAL (Finding 6 / N1 — same root cause); flags 2 new issues (V2-N1, V2-N2 — also same root cause: residual hardcoded "90 rows" gates). Bottom line: needs v1.3 hotfix (~2 minutes) before Phase 0 walk; not a structural blocker but the primary sign-off gate must not contradict the row-count rule.
- **Companion artifacts:** Codex_Adversarial_Review_2026-04-29.md (v1.0 review); Codex_Adversarial_Review_2026-04-29_v1_1_verification.md (v1.1 verification); Telecheck_v1_10_Planning_Freeze.md (the v1.2 document under verification, in-place edited; v1.3 patches incoming).
- **Status:** All 4 remaining open items (Finding 6 PARTIAL, N1 PARTIAL, V2-N1, V2-N2) closed in Planning Freeze v1.3 (2026-04-29) per Evans's directive 2026-04-29. v1.3 verified Phase-0-ready in `Codex_Adversarial_Review_2026-04-29_v1_3_verification.md`. This delta artifact is preserved as the audit trail.
