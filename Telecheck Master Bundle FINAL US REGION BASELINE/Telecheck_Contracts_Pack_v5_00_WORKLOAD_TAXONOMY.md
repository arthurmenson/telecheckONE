# Telecheck — Contracts Pack v5.2 · WORKLOAD_TAXONOMY

**Version:** 5.2 (Phase 6 promoted 2026-05-01 per Evans's "authorized" instruction; promoted from v0.4 DRAFT after Codex Phase 3 group-1 EXIT + Phase 6 plan EXIT v0.4 CLOSED)
**Status:** canonical — new contract added in v1.10 cycle per ADR-029 (AI Workload Taxonomy)
**Owner:** Engineering Lead + Product Lead + Clinical Safety Officer
**Parent documents:** Master PRD v1.10 §13 (workload taxonomy reframe), ADR-029 (AI Workload Taxonomy)
**Companion documents:** AI-LAYERING contract, AUTONOMY_LEVELS contract, AUDIT_EVENTS contract, TYPES contract, INVARIANTS contract
**Format:** Markdown
**Filename note:** retains `v5_00` filename pattern per Contracts Pack convention; header version is the canonical version

---

## Purpose

This contract defines the **AI workload taxonomy** — a discriminator (`ai_workload_type`) that classifies AI invocations by their kind, scope, and governance class. It replaces the binary "AI Mode 1 / AI Mode 2" framing of AI-LAYERING (AI-ARCH-001) with an extensible taxonomy that future workload types (autonomous agents, multi-agent supervisors, tool-using agents) can join without renumbering or rewriting.

**This contract does NOT activate any new workloads at v1.0.** Mode 1 and Mode 2 — the only workloads currently in production — are preserved as labeled values (`conversational_assistant`, `protocol_execution`). Reserved future workload types are namespace placeholders requiring successor ADRs to activate.

## Scope

**In scope:**
- The `ai_workload_type` discriminator and its allowed values
- Four orthogonal properties carried by every workload type: `autonomy_level`, `tool_access`, `memory_scope`, `governance_class`
- Mapping of current Mode 1 / Mode 2 to workload taxonomy values
- Reserved future workload type names and their preconditions for activation

**Out of scope:**
- Implementation of any reserved workload type (covered by future ADRs 030, 031, 032, 033, 034)
- Tool registry contract (covered by AGENT_TOOLS — deferred to vNEXT)
- Agent memory contract (covered by AGENT_MEMORY — deferred to vNEXT)
- Multi-agent orchestration (covered by MULTI_AGENT_ORCHESTRATION — deferred to vNEXT)

---

## 1 · The discriminator

`ai_workload_type` is a string enum carried on every `AIExecution` entity (per CDM v1.2) and every audit event with `actor.type = ai_workload` (per AUDIT_EVENTS v5.1).

**Audit-event nullability rule (v0.2 patch — Codex 2026-04-29 Finding 3):** For new v1.10 AI audit events, `ai_workload_type` and `autonomy_level` are **required** fields (not nullable). They are nullable only for: (a) legacy events backfilled from before v1.10 promotion; (b) non-AI events (where `actor.type ≠ ai_workload`). Reserved agentic-context fields (`agent_id`, `agent_version`, `tool_call_id`, `memory_read_set_id`, `memory_write_set_id`, `supervising_policy_id`, `knowledge_source_versions[]`) remain nullable across all events; they populate only when the corresponding capability activates.

Values are defined exclusively in this contract; no callers may introduce new values without a successor ADR.

**Workload-type vs property-value criteria (v0.2 patch — Codex 2026-04-29 Finding 15):** A new `ai_workload_type` value is warranted when the workload requires a fundamentally different governance class, lifecycle, or accountability primitive (e.g., `autonomous_agent` requires PolicyAuthorization framework that `protocol_execution` does not). Otherwise, a new value of `autonomy_level`, `tool_access`, `memory_scope`, or `governance_class` should be added to the existing workload type. Future ADRs (030-034) document each reserved workload type's specific governance gap.

Type definition (per TYPES contract):

```typescript
type AIWorkloadType =
  | "conversational_assistant"     // active at v1.0 (current Mode 1)
  | "protocol_execution"            // active at v1.0 (current Mode 2)
  | "autonomous_agent"              // RESERVED — requires ADR-030
  | "multi_agent_supervisor"        // RESERVED — requires ADR-033
  | "tool_using_agent";             // RESERVED — requires ADR-031 + ADR-030
```

## 2 · Active workload types (v1.0)

### 2.1 · `conversational_assistant`

**Description:** Patient-facing conversational AI with guardrails. Cannot make clinical decisions. Successor to AI-LAYERING Mode 1.

**Properties:**
| Property | Value |
|---|---|
| `autonomy_level_range` | `[advisory]` only |
| `tool_access` | `[internal_kb_lookup]` (limited; no external tools) |
| `memory_scope` | `[session]` (per-conversation only; no longitudinal memory) |
| `governance_class` | `floor_safety` (subject to crisis detection floor I-019; no decision authority) |

**Activation:** Already active in production at v1.0.

### 2.2 · `protocol_execution`

**Description:** Async clinical preparation engine operating within named, versioned protocols. Successor to AI-LAYERING Mode 2.

**Properties:**
| Property | Value |
|---|---|
| `autonomy_level_range` | `[advisory, suggestion, action_with_confirm]` (active at v1.0); `action_with_audit_only` reserved (requires ADR-030 + PolicyAuthorization framework) |
| `tool_access` | `[protocol_kb, lab_lookup, formulary_lookup, interaction_engine]` (descriptive at v1.0; non-normative until ADR-031 / AGENT_TOOLS contract activates the tool registry — see §4.2) |
| `memory_scope` | `[patient_episode, program_history]` (active at v1.0; bounded to current Mode 2 semantics — see §4.3) |
| `governance_class` | `protocol_authorized` (governed by ADR-005, named protocol with accountable clinician) |

**Activation:** Already active in production at v1.0 with autonomy_level capped at `action_with_confirm` (physician review required per I-012).

**I-012 preservation rule (v0.4 patch — mirrors Master PRD §13.7 v0.3 normative wording):** For `medication_request` (prescription), refill, and medication-order actions governed by I-012 (per the canonical INVARIANTS contract entry "I-012 prescription sign-off"), the `protocol_execution` workload may only reach the `executed` state through `action_with_confirm` with an explicit, audit-recorded clinician confirmation event linked to the action.

State machine validation MUST reject any `executed` transition for these actions UNLESS **all** of the following hold:

1. `autonomy_level == action_with_confirm` (string equality; not membership in a set).
2. An explicit clinician confirmation event exists in the immutable audit chain, scoped to this `action_id`, prior to the transition.
3. The confirming actor holds a role authorized to sign for the action class under RBAC v1.1 / I-012.

Therefore, `executed` MUST be rejected when `autonomy_level ∈ {advisory, suggestion, action_with_audit_only, fully_autonomous}`, when `autonomy_level` is `null` / unknown / absent, or when any required confirmation evidence is missing — including any future enum value not yet authorized by an ADR-029 successor. The reserved levels (`action_with_audit_only`, `fully_autonomous`) cannot reach `executed` for I-012 actions until **both** (a) a successor ADR (ADR-030 or later) explicitly supersedes I-012 for the action class in scope, AND (b) an activation audit event recording the supersession is present in the immutable audit chain. ADR approval alone is never sufficient; the activation audit event is required.

There is no implicit fallback path: enum additions made later default to **rejected** for I-012 transitions until an ADR explicitly authorizes them.

**Single normative source of truth:** Master PRD §13.7 is the canonical source. This contract MUST mirror it exactly; downstream contracts (STATE_MACHINES, AUDIT_EVENTS, AUTONOMY_LEVELS) and tests MUST mirror this rule exactly. Earlier draft wording (v0.1 / v0.2 / v0.3) that limited the rejection set to `{advisory, suggestion}` is **superseded** by this v0.4 patch and must not be referenced.

## 3 · Reserved future workload types

These values are reserved in the type enum but NOT activated. Activation requires the named ADR plus all listed companion contracts.

### 3.1 · `autonomous_agent`

**Description:** Open-ended multi-step clinical agent that reasons across patient history, labs, medications, and prior actions. Not bounded to a single named protocol.

**Status:** RESERVED — requires ADR-030 (Tiered Autonomy Progression Model) plus AGENT_MEMORY contract (ADR-032) plus PolicyAuthorization framework activation.

**Anticipated properties:**
| Property | Anticipated value |
|---|---|
| `autonomy_level_range` | `[action_with_audit_only, fully_autonomous]` |
| `tool_access` | governed subset; tool registry per AGENT_TOOLS (ADR-031) |
| `memory_scope` | `[patient_longitudinal, cross_episode]` (within tenant) |
| `governance_class` | `autonomy_grant_required` (each action traces to a PolicyAuthorization) |

### 3.2 · `multi_agent_supervisor`

**Description:** Orchestrates multiple agents on a coordinated task. Handles handoffs, voting, conflict resolution, escalation.

**Status:** RESERVED — requires ADR-033 (Multi-Agent Service Split) plus MULTI_AGENT_ORCHESTRATION contract.

### 3.3 · `tool_using_agent`

**Description:** Agent specialized for tool invocation against external systems (calculators, knowledge bases, APIs). Tool calls are governed.

**Status:** RESERVED — requires ADR-031 (Agent Tool Contract) plus AGENT_TOOLS contract.

---

## 4 · Orthogonal properties

Every workload type carries four orthogonal properties. These compose freely — adding a new property value (e.g., a new autonomy level) does NOT require a new workload type.

### 4.1 · `autonomy_level`

Defined in AUTONOMY_LEVELS contract. Range per workload type per §2 / §3 above. A workload at v1.0 cannot use a reserved autonomy level even if its workload type allows it; activation requires the autonomy level to also be active in AUTONOMY_LEVELS.

### 4.2 · `tool_access`

Set of tool identifiers the workload may invoke.

**v1.0 status (descriptive, non-normative — Codex 2026-04-29 Finding 7):** `tool_access` values listed in §2.1 / §2.2 are **descriptive labels** documenting what current Mode 1 / Mode 2 implementations call. They are not contract-governed at v1.0; no validator enforces a closed enum, no tool registry lookup occurs. The implementation continues to use its hardcoded list per workload type. **`tool_access` becomes normative when ADR-031 + AGENT_TOOLS contract activate**, at which point this property gains a closed enum, a tool registry, validation rules, an audit envelope, and idempotency semantics. Until then, treat `tool_access` as documentation, not behavior.

### 4.3 · `memory_scope`

Lifetime and scope of memory accessible to the workload.

**Active values at v1.0 (v0.2 patch — Codex Finding 8 + v0.2 follow-up cleanup):** Only `session`, `patient_episode`, and `program_history` are active. Exact definitions:

| Value | Scope | Lifetime | Tenant constraint | Retention |
|---|---|---|---|---|
| `session` | Memory accessible only within a single AI conversation/invocation context | Ends when the AIExecution closes (Mode 1) or the Mode 2 case completes | Single-tenant (per I-023..I-026) | Ephemeral; not persisted beyond the AIExecution lifecycle. May be retained briefly in audit envelope context for reproducibility. |
| `patient_episode` | Memory accessible across AI invocations within a single episode of care for one patient | Until the episode is closed per Consult/Episode lifecycle (State Machines v1.1) | Single-tenant; bounded to the episode's tenant | Per tenant retention policy (CDM v1.2 Episode entity); no separate AI-memory retention rule at v1.0 |
| `program_history` | Memory accessible across AI invocations within the patient's enrollment in a specific program (e.g., GLP-1 program, RPM diabetes program) | Duration of program enrollment + post-enrollment retention per program policy | Single-tenant; bounded to the program's tenant; programs are platform-defined per Master PRD §10.5 but instantiated per tenant via ProgramMarketPolicy | Per program retention policy (CDM v1.2 Program/ProgramEnrollment entities); no separate AI-memory retention rule at v1.0 |

These three active scopes do not require new memory governance contracts — they ride existing PHI-handling rules from CDM v1.2, INVARIANTS contract I-023..I-026, and Tenant Threading Addendum v1.0.

**Reserved values:** `patient_longitudinal` and `cross_episode` are **reserved namespace placeholders only** until AGENT_MEMORY contract activates under ADR-032. Reserved values do NOT yet have boundary, retention, or tenant-constraint definitions; runtime validation rejects them with a clear error pointing at ADR-032.

**`cross_tenant` is permanently forbidden** by I-023..I-026 invariants — never a valid memory_scope value, even reserved.

### 4.4 · `governance_class`

Which gating rules apply. Values:
- `floor_safety` — only platform-floor invariants apply (crisis detection, tenant isolation, audit append-only)
- `protocol_authorized` — bounded by named protocol per ADR-005; clinician accountability via protocol owner
- `autonomy_grant_required` — every action requires a `PolicyAuthorization` reference; multi-party approval chain; rollback trigger; evidence locker entry

---

## 5 · Mapping current Mode 1 / Mode 2

For continuity, current AI-LAYERING terminology maps as follows:

| AI-LAYERING term | Workload taxonomy value | Notes |
|---|---|---|
| Mode 1 | `conversational_assistant` | Identical semantics; relabeled. |
| Mode 2 | `protocol_execution` | Identical semantics; relabeled. ADR-005 protocolized autonomy remains binding for current workloads. |

**AI-ARCH-001 supersession rule (v0.2 patch — single canonical statement, Codex 2026-04-29 Finding 1):** AI-ARCH-001 remains binding only as: **v1.0 has exactly two active workload types, `conversational_assistant` and `protocol_execution`.** AI-ARCH-001 no longer prohibits reserved future workload type names from existing in this contract's enum, but any **activation** of a reserved workload type requires successor ADR approval (ADR-030, 031, 032, 033, 034 as applicable). This is the canonical supersession-scope statement; ADR-029 Decision §3 and Tier2_Matrix_Row_Additions T2-R03 reference this section.

UI / operator-facing terminology may continue to use "Mode 1 / Mode 2" labels where helpful. Code, schema, audit, and config MUST use the workload taxonomy values (`conversational_assistant`, `protocol_execution`).

---

## 6 · Invariants referenced

This contract is bounded by:

- **I-019** Crisis detection (platform-floor): applies to all workload types regardless of autonomy_level
- **I-023, I-024, I-025, I-026** Tenant isolation: applies to all workload types
- **I-027** Audit append-only: every AIExecution emits an audit event with `ai_workload_type` field populated per §1 nullability rule
- **I-012** Clinician sign-off for prescription: binding for current workload types at autonomy_level ≤ `action_with_confirm`. See §2.2 I-012 preservation rule for the validation boundary at v1.0. Higher autonomy levels reserved pending successor invariant language.

(v0.2 patch — Codex 2026-04-29 Finding 6: corrected duplicate listing of I-027. I-027 is audit append-only. Tenant isolation is I-023 through I-026.)

This contract does NOT supersede or relax any invariant. It provides the discriminator under which future invariant successors will be scoped.

---

## 7 · Cross-references

- **AI-LAYERING contract §X "Future Workload Expansion":** documents this contract as the canonical taxonomy
- **AUTONOMY_LEVELS contract:** defines the autonomy_level enum used in §4.1
- **AUDIT_EVENTS contract:** every audit event carries `ai_workload_type` and `autonomy_level` per §1 nullability rule (required for new v1.10 AI events; nullable only for legacy backfill and non-AI events)
- **TYPES contract:** type definition for `AIWorkloadType` and reserved-future stubs
- **CDM v1.2:** `AIExecution` entity uses `ai_workload_type` discriminator (canonical name; aligns with audit envelope, contract enums, and TYPES schemas. Earlier draft references to a bare `workload_type` field name in CDM are superseded — the canonical name is `ai_workload_type` per Master PRD §13.7 single normative source of truth.)
- **State Machines v1.1:** `ProtocolAuthorizedAction` lifecycle gates transitions on `autonomy_level`
- **ADR-029:** the architectural decision authorizing this contract
- **ADR-002:** remains binding for current Mode 1 / Mode 2 until separate successor ADR
- **ADR-005:** remains binding for current `protocol_execution` workload at autonomy_level ≤ `action_with_confirm`

---

## 8 · Document control

- **v0.1 DRAFT — 2026-04-29** — Initial skeleton for v1.10 Tier 2 forward-compatibility adoption.
- **v0.2 DRAFT — 2026-04-29** — Patched per Codex pre-commit review 2026-04-29. Changes: §1 single audit-nullability rule (Finding 3); §1 workload-vs-property criteria (Finding 15); §2.2 I-012 preservation rule for prescription/refill/order actions (Finding 4); §4.2 tool_access marked descriptive/non-normative until ADR-031 (Finding 7); §4.3 memory_scope split into active (`session`, `patient_episode`, `program_history`) vs reserved (`patient_longitudinal`, `cross_episode`) with reserved values runtime-rejected (Finding 8); §5 single canonical AI-ARCH-001 supersession rule (Finding 1); §6 corrected I-023..I-026 / I-027 reference (Finding 6); §7 cross-reference updated to single nullability rule (Finding 3).
- **v0.3 DRAFT — 2026-04-29** — Hotfix per Codex v1.1 verification. §4.3 active memory_scope values now have exact definitions table (scope, lifetime, tenant constraint, retention) — closes Codex Finding 8 PARTIAL.
- **v0.4 DRAFT — 2026-05-01** — Phase 3 reconciliation against canonical Master PRD v1.10 §13.7 v0.3. §2.2 I-012 preservation rule tightened to mirror §13.7 reject-unless three-clause normative wording exactly: (1) string equality `autonomy_level == action_with_confirm`; (2) audit-chain clinician confirmation scoped to `action_id`; (3) confirming actor holds RBAC v1.1 / I-012 authorized role. Explicit rejection of all reserved levels + null/unknown/absent + future-enum-rejected-by-default. Two-condition AND for reserved-level activation (successor ADR + activation audit event). "Single normative source of truth" declaration referencing Master PRD §13.7. Old v0.1/v0.2/v0.3 wording (which only rejected `{advisory, suggestion}`) explicitly superseded.
- **Status:** DRAFT — not canonical until v1.10 promotes. On promotion, this file moves from `Telecheck_v1_10_PRD_Update/` into the spec bundle and bumps to contract version 5.2.
- **Open questions:**
  - Should `tool_access` enumerate tools at v1.0 or remain implicit until AGENT_TOOLS activates? (Working answer: remain implicit at v1.0; document the activation path.)
  - Should `governance_class` values be globally namespaced or per-workload? (Working answer: globally namespaced; per-workload assignment in §2 / §3.)
  - Does the workload taxonomy require a per-tenant overlay for jurisdiction-specific governance? (Working answer: no at v1.0; tenant-specific governance is captured in PolicyAuthorization, not workload type. Revisit if multi-jurisdiction concerns arise.)
