# ADR-029 — AI Workload Taxonomy (DRAFT)

**Status:** v0.4 DRAFT — Proposed for Acceptance on v1.10 promotion. Phase 4 propagation pass applied 2026-05-01: Contracts Pack version references bumped v5.1 → v5.2 (Phase 3 cleanup); Master PRD §13 reference clarified to §13.7 (the actual new section); §13.7 v0.3 reject-unless three-clause rule explicitly cross-referenced.
**Date:** 2026-04-29 (drafted); v0.2 + v0.3 patches 2026-04-29 per Codex Tier2 review series; v0.4 Phase 4 propagation 2026-05-01.
**Owners:** Product Lead + Engineering Lead + Clinical Safety Officer + Privacy Officer (quad-sign-off)
**Supersedes:** ADR-002 (prospectively, for new AI workload additions); ADR-002 remains binding for current Mode 1 / Mode 2 until separate successor ADR
**Companion ADRs:**
- ADR-005 (Protocolized autonomy) — remains binding for `protocol_execution` workload at autonomy_level ≤ `action_with_confirm`
- ADR-030 (Tiered Autonomy Progression Model) — DEFERRED; required to activate reserved autonomy levels
- ADR-031 (Agent Tool Contract) — DEFERRED; required to activate `tool_using_agent` workload type
- ADR-032 (Agent Memory Architecture) — DEFERRED; required to activate `autonomous_agent` workload type
- ADR-033 (Multi-Agent Service Split) — DEFERRED; required to activate `multi_agent_supervisor` workload type
- ADR-034 (Knowledge Source Registry) — DEFERRED; tightens `tool_access` / `knowledge_source_versions` enforcement

---

## Context

Telecheck's AI architecture today is governed by AI-LAYERING (AI-ARCH-001) and ADR-002, which together establish a binary "two-mode" framing: Mode 1 (conversational guardrails, no clinical decisions) and Mode 2 (protocol execution agent, gated by ADR-005 protocolized autonomy). ADR-002 explicitly considered adding a third mode for autonomous AI and rejected it as premature.

Two pressures push back on the binary mode framing:

1. **Forward-compatibility for agentic autonomy.** Future workloads — open-ended autonomous agents, multi-agent supervisors, tool-using agents — do not fit cleanly into "Mode 3" / "Mode 4" / "Mode 5" numbering. Each new workload would arrive with its own contract, its own state machines, its own audit shape. A numbered-mode model inflates without bound and forces every workload to declare a new mode rather than compose existing primitives.

2. **Regulatory mapping.** Regulators (FDA SaMD, EU AI Act, MDC) classify AI systems by *property* — autonomy class, decision authority, action class, risk tier — not by mode number. A property-based taxonomy maps onto regulatory frameworks naturally; mode numbering does not.

The cost of doing nothing is real: implementation today bakes "Mode 1 / Mode 2" into code, schema, audit, and config. When agentic capability ships, every reference must be migrated. The classification-refactor portion of that work is on the order of **~3-4 weeks** (Tier2 calibrated estimate, single source of truth — see Tier2_Matrix_Row_Additions §Scope). The full agentic implementation cost (persistence, API, RBAC, policy, audit consumers, tests) is a separate, larger workstream owned by deferred ADRs 030-034 and is not avoided by ADR-029.

The cost of a numbered-mode expansion is also real: each new mode is a new contract from scratch, with its own state machines and its own governance class, and the relationship between modes is opaque to readers and reviewers.

## Decision

**Replace the binary "Mode 1 / Mode 2" framing of AI-LAYERING with a property-based AI workload taxonomy** (`ai_workload_type` discriminator) carrying four orthogonal properties: `autonomy_level`, `tool_access`, `memory_scope`, `governance_class`.

The taxonomy is defined in a new contract (`WORKLOAD_TAXONOMY`) with companion contract `AUTONOMY_LEVELS`. Mode 1 maps to `conversational_assistant`; Mode 2 maps to `protocol_execution`. Reserved future workload types (`autonomous_agent`, `multi_agent_supervisor`, `tool_using_agent`) are namespace placeholders requiring named successor ADRs to activate.

This ADR supersedes ADR-002 **prospectively** for new workload additions. ADR-002 remains binding for the two currently-active workload types (Mode 1 / Mode 2) until and unless a separate successor ADR explicitly retires it. **No relaxation of ADR-005** (protocolized autonomy): `protocol_execution` workload remains bounded by ADR-005 at autonomy_level ≤ `action_with_confirm`.

### Specifically

1. **WORKLOAD_TAXONOMY contract** is added to Contracts Pack v5.2, defining the discriminator and current/reserved values.
2. **AUTONOMY_LEVELS contract** is added to Contracts Pack v5.2, defining the autonomy progression vocabulary.
3. **AI-LAYERING contract** is amended with a "Future Workload Expansion" section pointing at WORKLOAD_TAXONOMY as the canonical taxonomy. **The canonical AI-ARCH-001 supersession statement lives in WORKLOAD_TAXONOMY §5** (single source of truth per v0.2 patch — Codex N2 follow-up). This ADR-029 Decision §3 simply references that statement: ADR-029 authorizes the supersession; WORKLOAD_TAXONOMY §5 states the binding rule. T2-R03 in the Tier2 row additions also references WORKLOAD_TAXONOMY §5.
4. **TYPES contract** adds `AIWorkloadType` and `AutonomyLevel` enums. Adds **non-normative reserved name stubs** for `Agent`, `Tool`, `AgentMemory`, `KnowledgeSource`, `PolicyAuthorization` — **reserved names only; no fields, API schema, persistence, or validation obligations in v1.10** (Codex 2026-04-29 Finding 5). Reserved-future entity schemas land with their respective deferred ADRs (031, 032, 034) when those activate.
5. **AUDIT_EVENTS contract audit-field rule (canonical statement — Codex 2026-04-29 Finding 3):** For new v1.10 AI audit events, `ai_workload_type` and `autonomy_level` are **required** fields. They are nullable only for: legacy/backfilled events from before v1.10 promotion, and non-AI events. **Nullable reserved agentic-context fields:** `agent_id`, `agent_version`, `tool_call_id`, `memory_read_set_id`, `memory_write_set_id`, `supervising_policy_id`, `knowledge_source_versions[]` — these populate only when the corresponding capability activates (Codex 2026-04-29 Finding 12 — clarified field grouping).
6. **CDM v1.2** adds the `AIExecution` entity unifying current Mode 1 invocations and Mode 2 cases under the workload taxonomy. **Reserved-future entities (`Agent`, `AgentRun`, `Tool`, `ToolCall`, `AgentMemory`, `KnowledgeSource`, `PolicyAuthorization`) are non-normative reserved names only** at v1.0 — schemas defined when their authorizing ADRs activate (Codex 2026-04-29 Finding 5).
7. **State Machines v1.1** adds the `ProtocolAuthorizedAction` lifecycle gated on `autonomy_level`. Current Mode 2 path (`ai_recommended → human_confirmed → executed`) remains the only active path. **Reserved transitions are documented as non-normative future sketches in the State Machines doc, NOT implemented as executable code paths in v1.0** (Codex 2026-04-29 Finding 9). Activating reserved transitions is implementation work owned by ADR-030, not by ADR-029.
8. **Master PRD §13.7** added as a new section "AI workload taxonomy and autonomy progression (per ADR-029)" — the canonical Master PRD narrative for the workload taxonomy primitive. The §13.7 v0.3 section is the **single normative source of truth for the I-012 reject-unless three-clause rule** governing `protocol_execution` workload + I-012 actions; WORKLOAD_TAXONOMY §2.2, AUTONOMY_LEVELS §2.3 + §5 rule 5, and AUDIT_EVENTS §3 mirror §13.7 exactly. v0.4 patch — Phase 4 propagation: §13 → §13.7 specificity per Phase 2 close.

### What is NOT decided here

- Activation of any reserved workload type or autonomy level (each requires its own successor ADR).
- Tool registry, agent memory architecture, multi-agent orchestration, knowledge source registry — covered by deferred ADRs 030-034.
- Per-tenant autonomy overlays — handled via future PolicyAuthorization framework.
- Successor invariant language for I-012 to permit higher autonomy levels — explicitly out of scope for ADR-029; required as a precondition for ADR-030.

## Consequences

**Positive (v0.2 patch — claims recast with explicit assumptions per Codex 2026-04-29 Findings 10 / 11):**

- **Reduced discriminator/schema migration for workload classification when agentic ships.** Day-one code uses `ai_workload_type` discriminator and required audit fields; future workload types plug in without renaming Mode 1/Mode 2 references. **NOT no-migration:** future agentic workloads still require persistence schemas, API surface, RBAC additions, policy framework, audit-consumer code, and test expansion. ADR-029 reduces the *classification refactor* portion of that work, not the entire agentic build.
- **Reduced audit-envelope migration.** Nullable reserved fields are added to schema at v1.0; future agentic events populate them. Historical events stay null. **Caveat:** audit consumers (regulatory export, evidence locker, analytics) still need feature-flag gating and consumer-side handling when those fields begin populating.
- **State machine reserved transitions are non-normative documentation, NOT executable code paths.** Activating a reserved transition is implementation work in ADR-030; ADR-029 reserves the names only.
- **Regulatory mapping is property-based.** Workload × autonomy_level × tool_access × memory_scope × governance_class composes onto FDA SaMD risk classes, EU AI Act risk tiers, MDC tiers without translation.
- **Future ADR work is bounded.** ADR-030 / 031 / 032 / 033 / 034 each have a clear scope (one workload type or one capability); the taxonomy provides the namespace.

**Negative / costs (v0.2 patch — costs recast with explicit assumptions per Codex 2026-04-29 Finding 11):**

- **Spec corpus cost: +10 matrix rows in v1.10 cycle** (per Tier 2 row additions DRAFT). ~2-3 weeks added to v1.10 cycle time.
- **Engineering implementation cost estimate: ~+3-5% on the 24-week build, *only if implementation is limited to:* enum field surface, audit nullability rule, AIExecution entity (without reserved-entity persistence), workload/autonomy validation rejection, AI-LAYERING terminology refresh, and Master PRD §13 narrative refresh.** This estimate **excludes**: full AIExecution-related OpenAPI exposure beyond minimal CRUD, audit consumer downstream changes (regulatory export, evidence locker, analytics), reserved-entity schemas/APIs/RBAC/persistence, multi-agent test scenarios, agentic test fixtures. Those land with the deferred ADRs.
- **Estimate confidence:** medium. Refines through Phase 0 walk + Phase 5 engineering review. Re-estimation expected at Engineering Lead Phase 5 sign-off.
- **Reviewer cognitive load.** Reviewers must now think in terms of (workload × autonomy_level) rather than "Mode N." Glossary additions and §13 narrative mitigate this.
- **Risk of namespace drift.** Reserved workload types and reserved autonomy levels create vocabulary that the codebase must reject at runtime. Test coverage required to ensure reserved values cannot accidentally activate.

**Mitigation:**

- Each reserved value carries explicit "RESERVED — requires ADR-XXX" status text.
- Runtime validation rejects reserved values with clear error messages.
- Codex adversarial review at every phase exit catches drift.
- Current Mode 1 / Mode 2 narrative is preserved (relabeled, not deleted), so operators and reviewers retain familiar terms.

## Activation requirements

**Two-stage activation (v0.2 patch — Codex 2026-04-29 Finding 13):** ADR-029 activates in two stages because contracts cannot be Approved before the authorizing ADR is at least baselined.

### Stage 1 — ADR-029 baselined (entry to Phase 3.X)

ADR-029 is **baselined** (status: Accepted-pending-final-confirmation) at the entry to Phase 3.X. Baselining authorizes the dependent contracts (WORKLOAD_TAXONOMY, AUTONOMY_LEVELS) and contract amendments (AI-LAYERING, AUDIT_EVENTS, TYPES) to enter their own approval flows.

Stage 1 requirements:
- ADR-029 quad-sign-off: Product Lead + Engineering Lead + Clinical Safety Officer + Privacy Officer
- ADR text frozen for the cycle (no further substantive edits without re-baselining)

### Stage 2 — ADR-029 finally Accepted (v1.10 promotion)

ADR-029 is **finally Accepted** at v1.10 promotion after all dependent rows have completed their own approval cycles.

Stage 2 requirements (each must reach Approved status before ADR-029 final):
- WORKLOAD_TAXONOMY contract Approved (Phase 3.X)
- AUTONOMY_LEVELS contract Approved (Phase 3.X)
- AI-LAYERING contract amended with §X "Future Workload Expansion" (Phase 3.X)
- TYPES contract updated with new enums and reserved name stubs (Phase 3.5)
- AUDIT_EVENTS contract updated with nullable agentic fields and required-field rule (Phase 3.3)
- CDM v1.2 updated with AIExecution entity (Phase 5.4)
- State Machines v1.1 updated with ProtocolAuthorizedAction lifecycle (Phase 5.4)
- Master PRD v1.10 §13 reframed (Phase 2.13 or 2.15)
- AI Clinical Assistant Slice §3 terminology refresh (Phase 5.3)
- Each cross-reference resolves to canonical text

Activation of reserved workload types (`autonomous_agent`, `multi_agent_supervisor`, `tool_using_agent`) requires the named ADRs (030, 031, 032, 033) plus PolicyAuthorization framework — explicitly NOT in scope for v1.10.

## Activation mechanism

This ADR is activated by:

1. v1.10 promotion ceremony executing all rows above
2. ADR-029 written into ADR Set v1.0 supplementary index entry
3. Promotion Ledger entry (with v1.10's P-XXX entry, or its own P-009)
4. Artifact Registry v2.10 inventory listing ADR-029
5. Active Document Index v1.0 referencing ADR-029 in §3 architecture section
6. Boot Sequence reading order including ADR-029 in §1 list

(v0.2 patch — Codex 2026-04-29 Finding 14: removed unrelated "Posture A scope" section that was leaked from a stale prior Codex N2 patch instruction concerning ADR-028. ADR-029 has no research data partnership scope; that distinction lives exclusively in ADR-028.)

## References

- **AI-LAYERING contract** §X Future Workload Expansion (amended in this cycle)
- **WORKLOAD_TAXONOMY contract** (new in this cycle)
- **AUTONOMY_LEVELS contract** (new in this cycle)
- **AUDIT_EVENTS contract** v5.2 (Phase 3 amended — workload-taxonomy envelope fields, audit_sensitivity_level, new actor_type=ai_workload, full enum coverage including reserved values)
- **TYPES contract** v5.2 (Phase 3 amended — AIWorkloadType + AutonomyLevel + PolicyAuthorization placeholder)
- **CDM v1.2** `AIExecution` entity using `ai_workload_type` discriminator (canonical name; aligns with audit envelope, contract enums, and TYPES schemas)
- **State Machines v1.1** §ProtocolAuthorizedAction (new)
- **Master PRD v1.10** §13.7 "AI workload taxonomy and autonomy progression (per ADR-029)" — single normative source of truth for I-012 reject-unless three-clause rule
- **AI Clinical Assistant Slice PRD** §3 (terminology refresh)
- **ADR-002** — remains binding for current Mode 1 / Mode 2 until separate successor
- **ADR-005** — remains binding for `protocol_execution` workload at autonomy_level ≤ `action_with_confirm`
- **Codex Forward-Compatibility Review (2026-04-29)** — review that surfaced the workload taxonomy reframe

## Document control

- **v0.1 DRAFT — 2026-04-29** — Initial skeleton for v1.10 Tier 2 forward-compatibility adoption.
- **v0.2 DRAFT — 2026-04-29** — Patched per Codex pre-commit review of C7 bundle (`Codex_Tier2_PreCommit_Review_2026-04-29.md`). Changes:
  - Decision §3: single canonical AI-ARCH-001 supersession statement (Finding 1)
  - Decision §4: TYPES additions clarified — reserved name stubs only, no fields/schema/persistence/validation in v1.10 (Finding 5)
  - Decision §5: single canonical audit-field nullability rule with explicit field grouping (Findings 3, 12)
  - Decision §6: CDM AIExecution + reserved entities clarified — non-normative reserved names only (Finding 5)
  - Decision §7: state machine reserved transitions are non-normative documentation, not executable code (Finding 9)
  - Consequences Positive: claims recast (Findings 10, 11)
  - Consequences Negative: cost claim recast with explicit assumptions (Finding 11)
  - Activation requirements: two-stage activation (baselined → finally Accepted) per Finding 13
  - Posture A section removed (Finding 14)
- **v0.3 DRAFT — 2026-04-29** — Hotfix per Codex v1.1 verification. Changes:
  - Context: stale "6-12 weeks" claim updated to calibrated "~3-4 weeks" classification refactor (Codex N3)
  - Decision §3: AI-ARCH-001 canonical statement attribution updated to point at WORKLOAD_TAXONOMY §5 as single source of truth; ADR-029 references rather than restates (Codex N2)
- **v0.4 DRAFT — 2026-05-01** — Phase 4 propagation pass per Phase 2 + Phase 3 canonicalization cleanup. Changes:
  - **Contracts Pack v5.1 → v5.2** (3 occurrences in Decision §1, §2, §4) per Phase 3 close.
  - **AUDIT_EVENTS v5.1 → v5.2** in References per Phase 3 group-1.
  - **TYPES v5.1 → v5.2** in References per Phase 3 group-2.
  - **Decision §8 expanded:** `Master PRD §13` reference clarified to **§13.7** (the actual new section name per Phase 2 close); §13.7 v0.3 named as the **single normative source of truth for the I-012 reject-unless three-clause rule**; downstream contracts (WORKLOAD_TAXONOMY §2.2, AUTONOMY_LEVELS §2.3 + §5 rule 5, AUDIT_EVENTS §3) explicitly named as mirroring §13.7 exactly.
  - **CDM v1.2 reference clarified:** `AIExecution` entity uses `ai_workload_type` discriminator (canonical name); the bare `workload_type` references in earlier drafts are superseded per Phase 3 EXIT MEDIUM cleanup.
- Quad sign-off required at Phase 4.
- **Status:** DRAFT — not canonical until v1.10 promotes. On promotion, this file moves into the spec bundle as `Telecheck_ADR_029_AI_Workload_Taxonomy.md` (drop _DRAFT) and bumps to Status: Accepted.
- **Open questions:**
  - Does "supersedes ADR-002 prospectively" need a separate ADR for retiring ADR-002 entirely later, or is the prospective-supersession framing sufficient for the v1.10 cycle? (Working answer: prospective supersession is sufficient; full retirement is a separate decision when reserved workloads activate.)
  - Should ADR-029 explicitly enumerate which AI-LAYERING contract sections are reframed vs preserved? (Working answer: yes — §3 above lists. AI-LAYERING amendments specify exact sub-section deltas.)
  - Should the binding language of ADR-005 be repeated in this ADR for safety? (Working answer: yes — see Decision §5.)
