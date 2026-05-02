# C7 (Tier 2 Forward-Compat) — Codex Pre-Commit Review

**Review date:** 2026-04-29
**Reviewer:** Codex (gpt-5.5 via OpenAI Codex CLI v0.125.0, ChatGPT-account auth)
**Invocation:** Direct `codex exec` with stdin pipe; fed the 4-document C7 bundle (matrix rows + 2 contracts + ADR-029).
**Tokens used:** 21,395
**Companion artifacts:** Tier2_Matrix_Row_Additions_DRAFT.md, Telecheck_Contracts_Pack_v5_00_WORKLOAD_TAXONOMY_DRAFT.md, Telecheck_Contracts_Pack_v5_00_AUTONOMY_LEVELS_DRAFT.md, Telecheck_ADR_029_AI_Workload_Taxonomy_DRAFT.md.

**Bottom line (verbatim):** *"Evans should not commit C7 to the matrix as drafted. The direction is viable, but the bundle needs pre-commit revisions around supersession scope, audit required/nullability rules, PolicyAuthorization activation, I-012 preservation, and the forward-compat boundary. As written, it claims low implementation impact while adding normative surface across audit, CDM, state machines, tools, memory, governance, and reserved entities. Tighten C7 to discriminator/enums/audit metadata plus explicit rejection rules, or budget it as a larger architectural change rather than a low-risk Tier 2 addition."*

**Status:** All 15 findings (5 HIGH, 8 MEDIUM, 2 LOW) addressed in v1.1 patches per Evans's Path A directive. v1.1 verification pass to follow.

---

## Findings (verbatim from Codex)

### HIGH

1. **HIGH — ADR-029 Decision §3; WORKLOAD_TAXONOMY §5; Row Additions T2-R03.** AI-ARCH-001 / ADR-002 supersession scope inconsistent across the bundle (three different governance positions). **Patch:** single canonical statement: "AI-ARCH-001 remains binding only as: v1.0 has exactly two active workload types, `conversational_assistant` and `protocol_execution`. It no longer prohibits reserved future workload type names, but any activation requires successor ADR approval."

2. **HIGH — AUTONOMY_LEVELS Purpose; §5 Per-action validation; T2-R05.** PolicyAuthorization activation logic broken — required for all levels but not defined at v1.0. **Patch:** Purpose condition (c) → "for levels requiring PolicyAuthorization." Then explicitly: "At v1.0, `advisory`, `suggestion`, and `action_with_confirm` do not require PolicyAuthorization unless an existing contract independently requires an authorization artifact."

3. **HIGH — T2-R01; ADR-029 Decision §5; WORKLOAD_TAXONOMY §1 / §7.** Audit field nullability inconsistent across 3 docs. **Patch:** "For new v1.10 AI audit events, `ai_workload_type` and `autonomy_level` are required. They are nullable only for legacy/backfilled events and non-AI events. Reserved agentic fields remain nullable."

4. **HIGH — WORKLOAD_TAXONOMY §2.2; AUTONOMY_LEVELS §2.3 / §7; ADR-029 What is NOT decided.** I-012 preservation hole — protocol_execution allows `[advisory, suggestion, action_with_confirm]`, prescription workflow could be labeled advisory/suggestion and bypass I-012. **Patch:** "For prescription/refill/order actions governed by I-012, `protocol_execution` may only reach execution through `action_with_confirm` with clinician confirmation. `advisory`/`suggestion` may support pre-action recommendations but cannot satisfy prescription execution."

6. **HIGH — T2-R02 / T2-R07; ADR-029 Decision §4 / §6.** Reserved-future stub entities create unintended contract surface. **Patch:** "If kept, mark them 'non-normative reserved names only; no fields, API schema, persistence, or validation obligations in v1.10.'"

### MEDIUM

5. **MEDIUM — WORKLOAD_TAXONOMY §6.** I-027 listed twice with different meanings (tenant isolation AND audit append-only). **Patch:** Correct to canonical names: I-023..I-026 tenant isolation, I-027 audit append-only.

7. **MEDIUM — WORKLOAD_TAXONOMY §4.2; T2-R04 / T2-R07.** `tool_access` declared orthogonal property but "implicit and hardcoded" at v1.0. **Patch:** Either define minimal closed enum for v1.0, or explicitly state `tool_access` is descriptive/non-normative until ADR-031.

8. **MEDIUM — WORKLOAD_TAXONOMY §4.3; ADR-029 Consequences.** `memory_scope` values include `program_history`, `patient_longitudinal`, `cross_episode` without contract-defined boundaries/retention/tenant constraints. **Patch:** Add exact definitions for active scopes only: `session`, `patient_episode`, `program_history`. Mark `patient_longitudinal` and `cross_episode` reserved until ADR-032.

9. **MEDIUM — T2-R06; ADR-029 Decision §7.** "Reserved transitions defined but rejected at runtime validation" is implementation work, not just specification. **Patch:** Either remove reserved transitions from executable state machines (document them as non-normative future sketches), or add explicit implementation/test rows for reserved-transition rejection.

10. **MEDIUM — T2-R07; ADR-029 Consequences.** "No code migration when agentic ships" is overstated. **Patch:** Replace with "Reduced discriminator/schema migration for workload classification" and "activation requires successor ADR implementation of tools, memory, governance, API, audit consumers, and tests."

11. **MEDIUM — Cost Summary; ADR-029 Negative / costs.** +3% engineering cost not defensible from artifact text. **Patch:** Recast as estimate with explicit assumptions: "+3% only if implementation is limited to enum fields, audit nullability, and validation rejection; excludes full AIExecution persistence, audit consumer changes, OpenAPI exposure, and reserved entity schemas."

13. **MEDIUM — ADR-029 Activation requirements; Dependency tagging.** Contracts cannot be approved before authorizing ADR is accepted/baselined. **Patch:** Two-stage activation: "ADR-029 draft accepted-for-contracting before Phase 3.X; ADR-029 final Accepted at promotion after dependent rows complete."

15. **MEDIUM — Mode 2 vs Mode 3 framing.** Reserved workload names still behave like discrete modes. **Patch:** Add criteria for when a new workload type is warranted versus when a new property value (autonomy_level / tool_access / memory_scope / governance_class) is sufficient.

### LOW

12. **LOW — T2-R01 vs ADR-029 Decision §5.** "9 nullable fields" easy to misread. **Patch:** Split into "Required for new AI events" vs "Nullable reserved context fields."

14. **LOW — ADR-029 "Posture A scope" section.** Unrelated noise leaked from a stale prior Codex N2 patch instruction concerning ADR-028. **Patch:** Delete the section.

---

## v1.1 patch summary (status: applied 2026-04-29 per Evans Path A)

| Finding | File(s) patched | Patch summary |
|---|---|---|
| 1 | WORKLOAD_TAXONOMY §5; ADR-029 Decision §3; T2-R03 | Single canonical AI-ARCH-001 supersession rule established in WORKLOAD_TAXONOMY §5; ADR-029 and T2-R03 reference it. |
| 2 | AUTONOMY_LEVELS Purpose; §5 | PolicyAuthorization required only for levels that explicitly require it. v1.0 active levels do not require PolicyAuthorization. |
| 3 | WORKLOAD_TAXONOMY §1; ADR-029 Decision §5; T2-R01 | Single canonical audit-nullability rule: `ai_workload_type` + `autonomy_level` required for new AI events; reserved agentic fields nullable. |
| 4 | WORKLOAD_TAXONOMY §2.2; AUTONOMY_LEVELS §2.3 + §5 + §7; T2-R06 | Explicit I-012 preservation: prescription/refill/medication-order transitions to `executed` rejected at autonomy_level ∈ {advisory, suggestion}. State machine validator added to T2-R06 scope. |
| 5 | TYPES (T2-R02), CDM (T2-R07), ADR-029 §4 + §6 | Reserved entities marked non-normative names only — no fields, schema, persistence, RBAC, validation in v1.10. Schemas land with authorizing ADRs. |
| 6 | WORKLOAD_TAXONOMY §6 | I-027 listed once (audit append-only); I-023..I-026 listed for tenant isolation. |
| 7 | WORKLOAD_TAXONOMY §4.2 | tool_access marked descriptive/non-normative at v1.0; becomes normative when ADR-031 + AGENT_TOOLS contract activate. |
| 8 | WORKLOAD_TAXONOMY §4.3 | memory_scope active values (`session`, `patient_episode`, `program_history`) governed by current PHI rules; reserved values (`patient_longitudinal`, `cross_episode`) runtime-rejected until ADR-032. |
| 9 | T2-R06; ADR-029 Decision §7 | Reserved transitions documented as non-normative future sketches in State Machines doc, NOT implemented as executable code paths in v1.0. Activation owned by ADR-030. |
| 10 | ADR-029 Consequences | "No code migration" replaced with "Reduced classification refactor" + explicit caveat that consumer-side and feature-flag gating still required. |
| 11 | T2 Cost Summary; ADR-029 Negative/costs | +3-5% cost claim recast with explicit "ONLY IF" assumption + explicit exclusions (OpenAPI exposure, audit consumers, reserved-entity schemas, multi-agent fixtures). |
| 12 | T2-R01 | Audit fields split into "Required for new AI events" (2 fields) vs "Nullable reserved" (7 fields). |
| 13 | ADR-029 Activation requirements; T2 Dependency tagging | Two-stage activation: Stage 1 ADR-029 baselined → Stage 2 dependent rows Approved → ADR-029 finally Accepted at promotion. |
| 14 | ADR-029 | Posture A scope section deleted; replaced with explanatory note about origin. |
| 15 | WORKLOAD_TAXONOMY §1 | Workload-type vs property-value criteria added: new workload type warranted only when fundamentally different governance class, lifecycle, or accountability primitive is required. |

---

## Document control

- **v1.0 — 2026-04-29** — Codex pre-commit review of C7 bundle. 15 findings (5 HIGH, 8 MEDIUM, 2 LOW). Direction viable; do not commit as drafted. Evans selected Path A (full patch on Tier 2 scope, no cuts) as remediation path.
- **Companion artifacts:** Codex_Adversarial_Review_2026-04-29.md (planning freeze v1.0); Codex_Adversarial_Review_2026-04-29_v1_1_verification.md (planning freeze v1.1); Codex_Adversarial_Review_2026-04-29_v1_2_verification.md (planning freeze v1.2); Codex_Adversarial_Review_2026-04-29_v1_3_verification.md (planning freeze v1.3 final). This file is the C7 (Tier 2) review series first artifact.
- **Status:** Delta artifact. All 15 findings patched into the C7 bundle as v1.1. v1.1 verification pass pending.
