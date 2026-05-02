# v1.10 Tier 2 Matrix Row Additions — Forward-Compatibility for Agentic Autonomy

**Version:** 1.3 DRAFT (v1.3 hotfix per Codex 2026-04-29 v1.2 verification — closes V1-N3 PARTIAL with explicit ~2-3 + ~1 = ~3-4 week cost decomposition; corrects v1.2 changelog wording)
**Date:** 2026-04-29
**Owner:** Evans (workstream lead)
**Purpose:** Concrete row additions for the v1.10 traceability matrix to adopt the AI workload taxonomy + autonomy-levels framing. Pre-Phase-0 draft; rows to be added during Phase 0 walk per the v1.2 row-count rule (final count locks at Phase 0 exit).

**Scope:** Tier 2 of the agentic forward-compatibility analysis (Codex review 2026-04-29). Adopts the workload taxonomy as canonical AI mode framing without building agentic implementation.

**Cost (calibrated v1.3 — single source of truth across the bundle, per Codex Findings 10 + 11 and v1.3 hotfix V1-N3 closure):**
- +10 matrix rows (T2-R01 through T2-R10)
- ~2-3 weeks extra cycle time on v1.10
- **~+3-5% engineering cost at implementation, ONLY IF** implementation is limited to enum field surface, audit nullability rule, AIExecution entity (without reserved-entity persistence), workload/autonomy validation rejection, AI-LAYERING terminology refresh, Master PRD §13 narrative refresh, and the I-012 preservation validator (single state-machine validator). **Excludes**: full AIExecution-related OpenAPI exposure beyond minimal CRUD; audit consumer downstream changes; reserved-entity schemas/APIs/RBAC/persistence; multi-agent test scenarios; agentic test fixtures.
- **Avoided cost: ~3-4 weeks total when agentic ships**, decomposing as ~2-3 weeks classification refactor (renaming Mode 1/Mode 2 references in code, schema, audit, config) + ~1 week audit-envelope migration. Bulk of agentic engineering work remains for the deferred ADRs.

The cost/avoidance numbers above are the canonical figures; ADR-029 Context, T2 Total Cost Summary, and any glossary/Master PRD cross-references must match.

**New change ID:** **C7 — AI workload taxonomy + autonomy levels (forward-compatibility for agentic autonomy)**. Sits alongside C1-C6.

---

## C7 architectural framing (one paragraph)

Replace the binary AI Mode 1 / Mode 2 framing of AI-LAYERING with a **workload taxonomy** discriminator (`ai_workload_type`) carrying four orthogonal properties: `autonomy_level`, `tool_access`, `memory_scope`, `governance_class`. Current Mode 1 becomes `conversational_assistant` and Mode 2 becomes `protocol_execution` — both labeled as workload type values from day one. Reserved values (`autonomous_agent`, `multi_agent_supervisor`, `tool_using_agent`) are namespace placeholders for future activation under successor ADRs. **Implementation impact:** AIExecution entity uses workload_type discriminator; audit envelope gains nullable agent fields; state machines gain autonomy-progression states (only `human_confirmed` activated at v1.0). Avoids hardcoding "Mode 1 / Mode 2" into code, schema, audit, and config — which would require migration when agentic capability ships.

---

## Row additions (10 rows)

### T2-R01 · AUDIT_EVENTS contract — nullable agent fields

| Field | Value |
|---|---|
| Change | C7 |
| File | F08 (Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md) |
| Phase | 3.3 |
| Edit type | New section + new fields |
| Edit description | Add audit envelope fields per the canonical nullability rule (single source: WORKLOAD_TAXONOMY §1, ADR-029 Decision §5). **Required for new v1.10 AI events** (where `actor.type = ai_workload`): `ai_workload_type`, `autonomy_level`. **Nullable reserved agentic-context fields** (populate only when corresponding capability activates): `agent_id`, `agent_version`, `tool_call_id`, `memory_read_set_id`, `memory_write_set_id`, `supervising_policy_id`, `knowledge_source_versions[]`. Required fields are nullable only for: (a) legacy events backfilled from before v1.10 promotion; (b) non-AI events. Schema additive only — no audit migration. (v1.1 patch — Codex 2026-04-29 Findings 3, 12.) |
| Owner | Engineering Lead + Privacy Officer |
| Audit category | B (dual-control per I-015) |
| Cascade | YES — cascades to AUDIT_EVENTS schema, all audit producers, all audit consumers, evidence locker, regulatory export |
| Dependencies | T2-R02 (TYPES enums must exist before AUDIT_EVENTS references them) |
| Notes | Highest-leverage cheapest item per Codex review. Single most important row in C7. |

### T2-R02 · TYPES contract — AIWorkloadType + AutonomyLevel enums

| Field | Value |
|---|---|
| Change | C7 |
| File | F19 (Telecheck_Contracts_Pack_v5_00_TYPES.md) |
| Phase | 3.5 |
| Edit type | New types |
| Edit description | Add `AIWorkloadType` enum (active: `conversational_assistant`, `protocol_execution`; reserved: `autonomous_agent`, `multi_agent_supervisor`, `tool_using_agent`). Add `AutonomyLevel` enum (active: `advisory`, `suggestion`, `action_with_confirm`; reserved: `action_with_audit_only`, `fully_autonomous`). Add **non-normative reserved name stubs** for `Agent`, `Tool`, `AgentMemory`, `KnowledgeSource`, `PolicyAuthorization`: **reserved names only — no fields, API schema, persistence, RBAC, or validation obligations in v1.10.** Reserved entity schemas land with their authorizing ADRs (031, 032, 034) when those activate. (v1.1 patch — Codex 2026-04-29 Finding 5.) |
| Owner | Engineering Lead + Product Lead |
| Audit category | B |
| Cascade | YES — cascades to AUDIT_EVENTS, WORKLOAD_TAXONOMY, AUTONOMY_LEVELS, CDM, OpenAPI |
| Dependencies | (none — foundational) |
| Notes | Foundational; must land before AUDIT_EVENTS, CDM, OpenAPI references the new enums. |

### T2-R03 · AI-LAYERING contract — Future Workload Expansion section

| Field | Value |
|---|---|
| Change | C7 |
| File | F09 (Telecheck_Contracts_Pack_v5_00_AI_LAYERING.md) |
| Phase | 3.X (new sub-phase between Phase 3 contracts and Phase 4 ADRs) |
| Edit type | Section rewrite |
| Edit description | Apply the **canonical AI-ARCH-001 supersession rule** (single statement; source: WORKLOAD_TAXONOMY §5, ADR-029 Decision §3): AI-ARCH-001 remains binding only as: v1.0 has exactly two active workload types, `conversational_assistant` and `protocol_execution`. AI-ARCH-001 no longer prohibits reserved future workload type names from existing in WORKLOAD_TAXONOMY's enum, but any **activation** of a reserved workload type requires successor ADR approval. Add new §X "Future Workload Expansion" stating: (1) current Mode 1 / Mode 2 are special cases of the workload taxonomy in WORKLOAD_TAXONOMY contract; (2) reserved future workload types named in TYPES; (3) adding new workload types requires successor ADR + autonomy contract + tool contract + memory contract + clinical governance approval. (v1.1 patch — Codex 2026-04-29 Finding 1.) |
| Owner | Engineering Lead + Privacy Officer + Clinical Safety Officer |
| Audit category | B |
| Cascade | YES — cascades to all AI workload code paths, Slice PRDs, Master PRD §13 |
| Dependencies | T2-R02, T2-R04 (WORKLOAD_TAXONOMY must exist), T2-R05 (AUTONOMY_LEVELS must exist) |
| Notes | This is a Tier 3 contract — sign-off-intensive. Triple-sign-off recommended. |

### T2-R04 · New WORKLOAD_TAXONOMY contract

| Field | Value |
|---|---|
| Change | C7 |
| File | F-NEW-WORKLOAD-TAX (Telecheck_Contracts_Pack_v5_00_WORKLOAD_TAXONOMY.md) |
| Phase | 3.X |
| Edit type | New file authoring |
| Edit description | New contract defining `ai_workload_type` discriminator with four orthogonal properties (autonomy_level, tool_access, memory_scope, governance_class). Two values active (`conversational_assistant`, `protocol_execution`). Three values reserved (`autonomous_agent`, `multi_agent_supervisor`, `tool_using_agent`) with status: reserved_future. Skeleton draft already in `Telecheck_Contracts_Pack_v5_00_WORKLOAD_TAXONOMY_DRAFT.md`. |
| Owner | Engineering Lead + Product Lead + Clinical Safety Officer |
| Audit category | B |
| Cascade | YES — referenced by AI-LAYERING, AUTONOMY_LEVELS, CDM, OpenAPI, Slice PRDs |
| Dependencies | T2-R02 |
| Notes | Skeleton draft authored 2026-04-29; needs sign-off review during Phase 3.X. |

### T2-R05 · New AUTONOMY_LEVELS contract

| Field | Value |
|---|---|
| Change | C7 |
| File | F-NEW-AUTONOMY-LVL (Telecheck_Contracts_Pack_v5_00_AUTONOMY_LEVELS.md) |
| Phase | 3.X |
| Edit type | New file authoring |
| Edit description | New contract defining `autonomy_level` enum vocabulary. Activates levels `advisory`, `suggestion`, `action_with_confirm` at v1.0. Reserves `action_with_audit_only` and `fully_autonomous` as reserved_future. Per-level sign-off requirements (current levels: physician review required for action_with_confirm; reserved levels: PolicyAuthorization grant required). Skeleton draft already in `Telecheck_Contracts_Pack_v5_00_AUTONOMY_LEVELS_DRAFT.md`. |
| Owner | Engineering Lead + Clinical Safety Officer + Privacy Officer |
| Audit category | B |
| Cascade | YES — referenced by AI-LAYERING, WORKLOAD_TAXONOMY, State Machines, governance, CDM |
| Dependencies | T2-R02 |
| Notes | Triple-sign-off recommended (touches clinical autonomy semantics). |

### T2-R06 · State Machines v1.1 — ProtocolAuthorizedAction lifecycle

| Field | Value |
|---|---|
| Change | C7 |
| File | F39 (Telecheck_State_Machines_v1_1.md) |
| Phase | 5.4 |
| Edit type | New state machine + extension to existing |
| Edit description | Add new `ProtocolAuthorizedAction` state machine with **only the `human_confirmed` path implemented as executable code** at v1.0: `draft → ai_recommended → human_confirmed → executed → completed`. **Reserved transitions are documented as non-normative future sketches** in the State Machines doc (e.g., `ai_recommended → audit_only_executed`, `ai_recommended → autonomous_executed`, `* → autonomy_suspended → escalated_for_review`) — **NOT implemented as executable code paths in v1.0.** Activating reserved transitions is implementation work owned by ADR-030, not by ADR-029. **Add explicit I-012 preservation validation:** state machine MUST reject `executed` transitions for prescription/refill/medication-order actions when `autonomy_level ∈ {advisory, suggestion}` (single executable validator). Extend existing Refill, Prescription, Consult lifecycle docs to reference `autonomy_level` on relevant transitions (terminology refresh; no behavioral change to those state machines at v1.0). (v1.1 patch — Codex 2026-04-29 Findings 4, 9.) |
| Owner | Engineering Lead + Clinical Safety Officer |
| Audit category | B |
| Cascade | YES — cascades to all action-execution code paths, audit emission, RBAC enforcement |
| Dependencies | T2-R02, T2-R05 (autonomy_level enum must exist) |
| Notes | Reserved transitions defined but not implemented. Code must validate they're rejected at runtime until activated. |

### T2-R07 · CDM v1.2 — AIExecution entity

| Field | Value |
|---|---|
| Change | C7 |
| File | F38 (Telecheck_Canonical_Data_Model_v1_2.md) |
| Phase | 5.4 |
| Edit type | New entity + reserved-future entities |
| Edit description | Add `AIExecution` entity (normative, fully implemented at v1.0) unifying current Mode 1 invocations and Mode 2 cases. Schema: id, workload_type (discriminator, required), workload_version (required), autonomy_level (required), supervising_policy_id (nullable; populated only for levels requiring PolicyAuthorization — none at v1.0; field name standardized across audit envelope, ADR-029, and CDM per v1.2 N4 cleanup), tenant_id (required), patient_id (nullable), agent_id (nullable; reserved — null at v1.0), agent_version (nullable; reserved — null at v1.0), protocol_id (nullable), protocol_version (nullable), knowledge_source_versions[] (nullable), tool_calls[] (nullable; reserved — empty at v1.0), memory_reads[] (nullable; reserved — empty at v1.0), memory_writes[] (nullable; reserved — empty at v1.0), recommendation, confidence, audit_envelope. **Reserved-future entities `Agent`, `AgentRun`, `Tool`, `ToolCall`, `AgentMemory`, `KnowledgeSource`, `PolicyAuthorization`: non-normative reserved names only at v1.0 — no schemas, no persistence, no API surface, no validation obligations. Schemas defined when authorizing ADRs (031, 032, 034) activate.** (v1.1 patch — Codex 2026-04-29 Finding 5; v1.2 patch — Codex N4 field naming standardized to `supervising_policy_id`.) |
| Owner | Engineering Lead + Product Lead |
| Audit category | B |
| Cascade | YES — cascades to OpenAPI, all AI-touching modules, audit emission, state machines |
| Dependencies | T2-R02, T2-R04, T2-R05 |
| Notes | AIExecution is the unification primitive; replaces implicit "Mode 1 invocation" and "Mode 2 case" with a single discriminated entity. Code-wise: existing Mode 1/2 invocation rows migrate cleanly via workload_type label. |

### T2-R08 · Master PRD §13 — Workload taxonomy reframe

| Field | Value |
|---|---|
| Change | C7 |
| File | F01 (Telecheck_Master_Platform_PRD_v1_10.md) |
| Phase | 2.13 (folded into existing C4 §13.6 row) or new 2.15 |
| Edit type | Section rewrite |
| Edit description | Reframe §13 "AI/clinical autonomy framework" from binary mode model to workload taxonomy + autonomy levels. Mode 1 / Mode 2 preserved as labeled special cases (consumer-facing terminology unchanged). Add §13.7 "AI workload taxonomy and autonomy progression" (~20 lines): names workload taxonomy contract, names autonomy levels contract, names ADR-029, names reserved future workload types, states ADR-002 / ADR-005 remain authoritative for current workloads until superseded. |
| Owner | Product Lead + Engineering Lead + Clinical Safety Officer |
| Audit category | B |
| Cascade | YES — cascades to AI Clinical Assistant Slice §3, AI-LAYERING contract, all narrative references to "Mode 1 / Mode 2" |
| Dependencies | T2-R03, T2-R04, T2-R05, T2-R09 (ADR-029 must exist) |
| Notes | Highest-visibility narrative change. Must not be cosmetic — must make the workload taxonomy primitive visible to all readers of the canonical PRD. |

### T2-R09 · New ADR-029 — AI Workload Taxonomy

| Field | Value |
|---|---|
| Change | C7 |
| File | F-NEW-ADR-029 (Telecheck_ADR_029_AI_Workload_Taxonomy.md) |
| Phase | 4 |
| Edit type | New file authoring |
| Edit description | New ADR documenting: (1) decision to replace binary mode framing with workload taxonomy; (2) supersession scope — ADR-029 supersedes ADR-002 prospectively for new workload additions; current Mode 1/Mode 2 remain governed by ADR-002 until separate successor ADR; (3) consequences — new contracts (WORKLOAD_TAXONOMY, AUTONOMY_LEVELS); audit envelope nullable fields; state machine extensions; CDM AIExecution entity; (4) activation requirements — current workloads activate at v1.0; reserved workloads gated on successor ADRs (ADR-030 tiered autonomy, ADR-031 tools, ADR-032 memory, ADR-033 multi-agent, ADR-034 knowledge source registry). Skeleton draft already in `Telecheck_ADR_029_AI_Workload_Taxonomy_DRAFT.md`. |
| Owner | Product Lead + Engineering Lead + Clinical Safety Officer + Privacy Officer |
| Audit category | B |
| Cascade | YES — referenced by Master PRD §13, AI-LAYERING, all C7 contracts and slices |
| Dependencies | T2-R02, T2-R04, T2-R05 |
| Notes | Status: Accepted on v1.10 promotion. Must include explicit non-supersession language for ADR-005 ("ADR-005 protocolized autonomy remains binding for all currently-activated workloads and autonomy levels"). |

### T2-R10 · AI Clinical Assistant Slice §3 — terminology refresh

| Field | Value |
|---|---|
| Change | C7 |
| File | F22 (Telecheck_AI_Clinical_Assistant_Slice_PRD_v1_0.md) |
| Phase | 5.3 |
| Edit type | Terminology rewrite |
| Edit description | Update §3 architecture references from "Mode 1 / Mode 2" to "workload taxonomy" framing. Mode 1 → "conversational_assistant workload"; Mode 2 → "protocol_execution workload". Keep narrative-friendly references to Mode 1 / Mode 2 where appropriate (operator UX language) but anchor each to the workload taxonomy primitive. Add forward reference to reserved workload types and ADR-029. |
| Owner | Product Lead + Engineering Lead |
| Audit category | C |
| Cascade | NO (slice-local terminology refresh) |
| Dependencies | T2-R04, T2-R09 |
| Notes | Lower-risk than other C7 rows; mostly find/replace with anchoring. Does not change behavior. |

### Glossary additions (folded into Phase 1 F13 row — no new row)

Add ~14 new terms to F13 Glossary draft entries:
- **AI workload type** — discriminator for AI workload kinds; replaces binary mode framing per ADR-029
- **conversational_assistant** — workload type for patient-facing chat with guardrails (current Mode 1)
- **protocol_execution** — workload type for async clinical preparation engine (current Mode 2)
- **autonomous_agent** — reserved workload type for open-ended multi-step clinical agent (deferred)
- **autonomy_level** — orthogonal property of an AI workload describing degree of autonomous action authority
- **advisory** — autonomy level: AI provides information only; no action authority
- **suggestion** — autonomy level: AI proposes action; human selects from options
- **action_with_confirm** — autonomy level: AI proposes specific action; human confirms before execution (current Mode 2 default)
- **action_with_audit_only** — reserved autonomy level: AI executes action; human reviews after-the-fact via audit
- **fully_autonomous** — reserved autonomy level: AI executes action without human review (subject to platform-floor safety gates)
- **policy_authorization** — explicit autonomy grant per (workload_type × action_type × tenant × market × protocol); reserved primitive
- **agent_identity** — reserved primitive distinguishing agent actor from human actor in audit/RBAC
- **knowledge_source_registry** — reserved registry of approved AI knowledge bases with version pinning
- **supervising_policy** — reserved reference linking an autonomous action to its authorizing PolicyAuthorization

---

## Dependency tagging (per planning freeze v1.3 Phase 0 requirement)

**Two-stage dependency order (v1.1 patch — Codex 2026-04-29 Finding 13):**

**Stage 1 — ADR-029 baselined first.** ADR-029 (T2-R09) reaches **baselined** status (Accepted-pending-final-confirmation) at the entry to Phase 3.X, *before* dependent contracts and contract amendments enter approval flows. ADR-029 cannot reach final Accepted status until all dependent rows reach Approved.

**Stage 2 — dependent rows.** Once ADR-029 is baselined, the dependency topology is:

```
T2-R09 (ADR-029 baselined)
   ↓
T2-R02 (TYPES enums and reserved name stubs — foundational)
   ↓
T2-R04 (WORKLOAD_TAXONOMY contract)   T2-R05 (AUTONOMY_LEVELS contract)   T2-R01 (AUDIT_EVENTS update)
   ↓                                      ↓                                      ↓
T2-R03 (AI-LAYERING amendment) ←────────────────────────┘                       ↓
   ↓                                                                            ↓
T2-R07 (CDM AIExecution entity)                                                 ↓
   ↓                                                                            ↓
T2-R06 (State Machines: ProtocolAuthorizedAction + I-012 validator)             ↓
   ↓                                                                            ↓
T2-R08 (Master PRD §13 reframe pulling everything together) ←───────────────────┘
   ↓
T2-R10 (Slice terminology refresh)
   ↓
T2-R09 (ADR-029 finally Accepted at v1.10 promotion)
```

All T2-* rows tagged as high-risk (Phase 0 dependency tagging required).

---

## Total cost summary (against v1.3 planning freeze)

**v1.1 patch (Codex 2026-04-29 Finding 11): cost claims recast with explicit assumptions.**

| Dimension | Cost |
|---|---|
| New matrix rows | +10 (T2-R01 through T2-R10) |
| New files in spec bundle | 4 (WORKLOAD_TAXONOMY contract, AUTONOMY_LEVELS contract, ADR-029, plus this row-additions doc) |
| Cycle time delta | +2-3 weeks |
| Engineering cost at implementation | **+3-5% on the 24-week build, ONLY IF implementation is limited to:** enum field surface, audit nullability rule, AIExecution entity (without reserved-entity persistence), workload/autonomy validation rejection, AI-LAYERING terminology refresh, Master PRD §13 narrative refresh, single I-012 preservation validator. **EXCLUDES:** full AIExecution-related OpenAPI exposure beyond minimal CRUD; audit consumer downstream changes (regulatory export, evidence locker, analytics); reserved-entity schemas/APIs/RBAC/persistence; multi-agent test scenarios; agentic test fixtures. Those land with the deferred ADRs. **Confidence: medium; refines through Phase 0 walk + Phase 5 engineering review.** |
| Phase 0 walk delta | +2-3 hours |
| Codex adversarial review cycles | +2-3 expected (per past pattern) |
| Risk profile | Low-medium (touches AI-LAYERING and ADR-002 successor; explicit I-012 preservation rule; no I-012 invariant supersession) |

**Cost AVOIDED later (Codex 2026-04-29 Finding 10 — claim recast; v1.3 hotfix — V1-N3 numeric reconciliation):**
- **Reduced classification refactor: ~2-3 weeks.** Future agentic workloads do not require renaming Mode 1/Mode 2 references in code, schema, audit, config. Saves search-and-replace and downstream test churn.
- **Reduced audit-envelope migration: ~1 week.** Reserved fields exist on day one; future agentic events populate them. Audit consumers still need feature-flag gating.
- **Total cost avoidance: ~3-4 weeks** (classification refactor + audit-envelope migration). This is the canonical figure repeated in T2 Scope and ADR-029 Context.
- **NOT avoided:** full agentic implementation work (persistence, API, RBAC, policy framework, audit consumers, tests for autonomous behavior). The bulk of agentic engineering work remains for the deferred ADR cycles.

---

## Document control

- **v1.0 DRAFT — 2026-04-29** — Initial draft of Tier 2 row additions per Evans's directive 2026-04-29. Codex pre-commit review returned 15 findings (5 HIGH, 8 MEDIUM, 2 LOW); bottom line: do not commit as drafted.
- **v1.1 DRAFT — 2026-04-29** — Patched per all 15 Codex findings (Path A: full patch on Tier 2 scope, no cuts). Changes: T2-R01 audit nullability rule clarified per single canonical statement (Findings 3, 12); T2-R02 reserved entities marked non-normative names only (Finding 5); T2-R03 single canonical AI-ARCH-001 supersession rule (Finding 1); T2-R06 reserved transitions documented as non-normative future sketches not executable code, plus explicit I-012 preservation validator (Findings 4, 9); T2-R07 reserved entities in CDM marked non-normative reserved names only (Finding 5); dependency topology restructured into two-stage activation (Finding 13); cost summary recast with explicit assumptions and exclusions (Findings 10, 11).
- **v1.2 DRAFT — 2026-04-29** — Hotfix per Codex v1.1 verification pass (Codex_Tier2_v1_1_Verification_2026-04-29.md). v1.1 closed 12 of 15 findings; v1.2 closes the 3 PARTIALs + 4 new issues. Changes:
  - **Finding 4 cleanup:** AUTONOMY_LEVELS §2.2 refill-quantity example clarified — selecting from a list is a *pre-action proposal step*, not the prescription execution itself; I-012 boundary stated explicitly.
  - **Finding 8 PARTIAL → CLOSED:** WORKLOAD_TAXONOMY §4.3 active memory_scope values (`session`, `patient_episode`, `program_history`) gain exact definitions table covering scope, lifetime, tenant constraint, and retention.
  - **Finding 10 PARTIAL → CLOSED + Finding 11 PARTIAL → CLOSED:** T2 Scope opening recalibrated to single canonical cost figures: ~+3-5% engineering with explicit ONLY-IF assumption + exclusions; ~3-4 weeks avoided refactor (replaces stale "~6-8 weeks" claim). All cost references in the bundle now match.
  - **N1 (version drift):** WORKLOAD_TAXONOMY and AUTONOMY_LEVELS headers bumped to `Version: 0.3 DRAFT` (initially v0.2 in v1.2 of this row-additions doc; subsequently bumped to v0.3 alongside the v1.3 hotfix for matched cost-decomposition wording across the bundle).
  - **N2 (canonical-source ambiguity):** WORKLOAD_TAXONOMY §5 designated as the single source of truth for the AI-ARCH-001 supersession rule; ADR-029 Decision §3 updated to reference WORKLOAD_TAXONOMY §5 rather than claim its own canonicality.
  - **N3 (cost/avoidance conflict):** ADR-029 Context updated to use the calibrated ~3-4 weeks number; T2 Scope is the canonical figure source.
  - **N4 (field naming mismatch):** T2-R07 schema field `authorized_by` renamed to `supervising_policy_id` to match audit envelope and ADR-029 Decision §5.
- Codex v1.2 verification: 6 of 7 CLOSED, V1-N3 PARTIAL (cost-number internal mismatch).
- **v1.3 DRAFT — 2026-04-29** — Hotfix per Codex v1.2 verification. Changes:
  - **V1-N3 PARTIAL → CLOSED:** Cost-avoidance decomposed into canonical breakdown — ~2-3 weeks classification refactor + ~1 week audit-envelope migration = ~3-4 weeks total. Both T2 Scope and T2 Total Cost Summary now repeat the same decomposition. ADR-029 Context already aligns at ~3-4 weeks total.
  - **V2-N1 stale changelog wording:** Updated this changelog entry's N1 mention to reflect the actual bumped version (v0.3 DRAFT, not v0.2 DRAFT).
- Pending Codex verification pass on v1.3 bundle. Once Codex passes, rows commit to the matrix during Phase 0 walk; four DRAFT files move from `Telecheck_v1_10_PRD_Update/` into the spec bundle on v1.10 promotion.
- **Status:** DRAFT — not committed to matrix. Draft contracts and ADR are skeletons, not finalized text.
