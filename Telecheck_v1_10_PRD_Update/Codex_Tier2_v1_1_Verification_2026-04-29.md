# C7 (Tier 2 Forward-Compat) v1.1 — Codex Verification Pass

**Review date:** 2026-04-29 (second pass on C7 series)
**Reviewer:** Codex (gpt-5.5 via OpenAI Codex CLI v0.125.0, ChatGPT-account auth)
**Invocation:** Direct `codex exec` with stdin pipe; fed v1.0 pre-commit review + all 4 v1.1 patched documents.
**Tokens used:** 27,403
**Companion artifacts:** Codex_Tier2_PreCommit_Review_2026-04-29.md (v1.0 review).

**Bottom line (verbatim):** *"Do not commit C7 v1.1 as drafted. The high-risk issues are mostly closed, and the bundle is much stronger, but it still needs a v1.2 patch round for the partial closures on memory-scope definitions and cost/avoidance claims, plus the new metadata/source-of-truth/naming inconsistencies. The v1.2 patch should be small and mechanical, not a redesign."*

**Status of v1.0 findings (15):** 12 CLOSED, 3 PARTIAL (Findings 8, 10, 11). **NEW issues introduced by v1.1:** 4 (N1–N4, all small/mechanical).

---

## Verification of v1.0 findings

| # | v1.0 finding | v1.1 status | Verification citation |
|---|---|---|---|
| 1 | Supersession scope inconsistency | **CLOSED** | WORKLOAD_TAXONOMY §5 canonical rule; T2-R03 + ADR-029 §3 reference it |
| 2 | PolicyAuthorization activation logic | **CLOSED** | AUTONOMY_LEVELS Purpose §3 — active levels do not require PolicyAuthorization unless an existing contract requires it; §5 rule 4 reserves it for `action_with_audit_only`/`fully_autonomous` |
| 3 | Audit field nullability | **CLOSED** | T2-R01, WORKLOAD_TAXONOMY §1, ADR-029 Decision §5 all align on required-for-new-AI-events / nullable-for-legacy-or-non-AI |
| 4 | I-012 preservation hole | **CLOSED with cleanup note** | WORKLOAD_TAXONOMY §2.2, AUTONOMY_LEVELS §2.3 + §5 rule 5, T2-R06 all add explicit prescription/refill/order rejection. **AUTONOMY_LEVELS §2.2 still uses a refill example under `suggestion`** — needs clarification |
| 5 | Reserved entity stubs | **CLOSED** | T2-R02, T2-R07, ADR-029 §4 + §6 all mark reserved entities as non-normative names only |
| 6 | I-027 duplicate listing | **CLOSED** | WORKLOAD_TAXONOMY §6 lists I-023..I-026 (tenant) and I-027 (audit append-only) correctly |
| 7 | tool_access status | **CLOSED** | WORKLOAD_TAXONOMY §4.2 explicitly descriptive/non-normative until ADR-031 |
| 8 | memory_scope active values | **PARTIAL** | Reserved scopes handled; active scopes (`session`, `patient_episode`, `program_history`) lack exact definitions — punted to existing PHI rules without specifics |
| 9 | Reserved state machine transitions | **CLOSED** | T2-R06 + ADR-029 §7 mark transitions as non-normative future sketches, not executable code |
| 10 | "No code migration" overclaim | **PARTIAL** | ADR-029 Consequences fixed ("Reduced classification refactor"); **T2 Scope still says "~6-8 weeks avoided"** — stale |
| 11 | "+3% cost" overclaim | **PARTIAL** | T2 Total Cost Summary + ADR-029 Negative both correctly caveated; **T2 Scope opening still says "~+3%" without ONLY-IF assumptions** — stale |
| 12 | Field count math | **CLOSED** | T2-R01 splits required (2 fields) from nullable reserved (7 fields) |
| 13 | Two-stage activation | **CLOSED** | ADR-029 Activation requirements + T2 Dependency tagging both implement two-stage |
| 14 | Posture A noise | **CLOSED** | Removed from ADR-029; replaced with explanatory note |
| 15 | Workload-vs-property criteria | **CLOSED** | WORKLOAD_TAXONOMY §1 adds criteria — new workload type warranted only when fundamentally different governance class, lifecycle, or accountability primitive |

---

## New issues introduced by v1.1

### V1-N1. Version metadata drift

**Issue:** WORKLOAD_TAXONOMY and AUTONOMY_LEVELS document control sections record v0.2 entries, but the file headers still say `Version: 0.1 DRAFT`. Doc-control discipline broken.

**Patch:** Bump headers to `Version: 0.2 DRAFT` to match doc-control.

### V1-N2. Canonical-source ambiguity for AI-ARCH-001 supersession rule

**Issue:** WORKLOAD_TAXONOMY §5 says "this is the canonical supersession statement"; ADR-029 Decision §3 also says "this statement is the single source of truth; WORKLOAD_TAXONOMY §5 references this." Both claim canonical ownership. Text matches, but the ownership rule is inconsistent.

**Patch:** Pick one. Recommend WORKLOAD_TAXONOMY §5 owns (it's the contract that defines the workload taxonomy). ADR-029 references rather than restates.

### V1-N3. Cost/avoidance estimates conflict across 3 places

**Issue:** Three different numbers for the same thing:
- ADR-029 Context: "doing nothing costs 6-12 weeks of refactor"
- T2 Scope: "avoids ~6-8 weeks of agentic-retrofit later"
- T2 Cost Avoided (post-Finding-10 patch): "~3-4 weeks of refactor"

**Patch:** Pick one calibrated number. Recommend ~3-4 weeks (the most caveated estimate). Update ADR-029 Context and T2 Scope to match.

### V1-N4. PolicyAuthorization field naming mismatch

**Issue:** T2-R07 (CDM AIExecution entity) uses `authorized_by (PolicyAuthorization or null)`. ADR-029 Decision §5 + audit envelope nullable list use `supervising_policy_id`. Two field names for the same concept.

**Patch:** Standardize on one. Recommend `supervising_policy_id` since it's already in 3 places (ADR-029 + audit envelope + WORKLOAD_TAXONOMY). Update T2-R07 to match.

---

## Severity-rolled summary

| # | Item | Status | v1.2 patch |
|---|---|---|---|
| 1-7, 9, 12-15 | Original HIGH/MEDIUM/LOW findings | CLOSED | None |
| 4 | I-012 preservation cleanup | CLOSED with cleanup note | Clarify AUTONOMY_LEVELS §2.2 refill example |
| 8 | memory_scope active definitions | PARTIAL | Add exact definitions table for `session`/`patient_episode`/`program_history` |
| 10 | T2 Scope retrofit-cost claim | PARTIAL | Recalibrate to ~3-4 weeks |
| 11 | T2 Scope cost claim | PARTIAL | Add ONLY-IF assumption to opening |
| V1-N1 | Version header drift | NEW | Bump to v0.2 in headers |
| V1-N2 | Canonical-source ambiguity | NEW | Designate WORKLOAD_TAXONOMY §5 as single source |
| V1-N3 | Cost/avoidance conflict | NEW | Standardize to ~3-4 weeks across bundle |
| V1-N4 | Field name mismatch | NEW | Standardize on `supervising_policy_id` |

**Effort:** 15-30 minutes of mechanical edits. No structural rework.

---

## Document control

- **v1.0 — 2026-04-29** — Codex verification pass on C7 v1.1. 12 of 15 prior findings CLOSED, 3 PARTIAL. 4 new issues (V1-N1 through V1-N4 — all small/mechanical). Bottom line: small/mechanical v1.2 hotfix needed before commit. Not a redesign.
- **Companion artifacts:** Codex_Tier2_PreCommit_Review_2026-04-29.md (v1.0 review of C7 v1.0).
- **Status:** Delta artifact. All 3 PARTIAL closures + 4 new issues addressed in C7 v1.2 hotfix.
