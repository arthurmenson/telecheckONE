# Telecheck — Contracts Pack v5.2 · AUTONOMY_LEVELS

**Version:** 5.2 (Phase 6 promoted 2026-05-01 per Evans's "authorized" instruction; promoted from v0.4.1 DRAFT after Codex Phase 3 group-1 EXIT + Phase 6 plan EXIT v0.4 CLOSED)
**Status:** canonical — new contract added in v1.10 cycle per ADR-029 (AI Workload Taxonomy)
**Owner:** Engineering Lead + Clinical Safety Officer + Privacy Officer
**Parent documents:** Master PRD v1.10 §13 (workload taxonomy reframe), ADR-029 (AI Workload Taxonomy), ADR-030 (Tiered Autonomy Progression Model — DEFERRED)
**Companion documents:** WORKLOAD_TAXONOMY contract, AI-LAYERING contract, AUDIT_EVENTS contract, GOVERNANCE_CONTROLS contract, INVARIANTS contract
**Format:** Markdown

---

## Purpose

This contract defines the **AI autonomy progression vocabulary** — a 5-level enum (`autonomy_level`) carried by every `AIExecution` and every audit event produced by an AI workload. It defines the activation semantics (which levels are active vs reserved at v1.0) and the sign-off chain required for actions at each level.

**This contract activates only the bottom three levels at v1.0:** `advisory`, `suggestion`, `action_with_confirm`. The upper two levels (`action_with_audit_only`, `fully_autonomous`) are reserved namespace placeholders requiring ADR-030 (Tiered Autonomy Progression Model) to activate.

**Activation conditions (v0.2 patch — Codex 2026-04-29 Finding 2):** A workload may use an autonomy level only if BOTH (a) its workload type allows it (per WORKLOAD_TAXONOMY §2 `autonomy_level_range`), AND (b) the level is activated in this contract. **PolicyAuthorization is required only for levels that explicitly require it** — see §3.1 / §3.2. **At v1.0, `advisory`, `suggestion`, and `action_with_confirm` do NOT require PolicyAuthorization** unless an existing contract independently requires an authorization artifact (e.g., I-012 for prescription/refill/order actions requires clinician confirmation, which is recorded in the action's audit chain rather than a PolicyAuthorization grant).

## Scope

**In scope:**
- The `autonomy_level` enum and its allowed values
- Activation status per level (active / reserved at v1.0)
- Sign-off chain required at each level
- Audit envelope requirements per level
- State machine transitions per level
- Relationship to PolicyAuthorization (the autonomy grant primitive — placeholder until ADR-030)

**Out of scope:**
- Implementation of `PolicyAuthorization` (covered by GOVERNANCE_CONTROLS update — placeholder at v1.0)
- Activation of `action_with_audit_only` or `fully_autonomous` (deferred to ADR-030)
- Per-tenant autonomy overlays (covered by PolicyAuthorization framework when active)

---

## 1 · The enum

`autonomy_level` is a string enum carried alongside `ai_workload_type` on every `AIExecution`. Type definition (per TYPES contract):

```typescript
type AutonomyLevel =
  | "advisory"                      // active at v1.0
  | "suggestion"                    // active at v1.0
  | "action_with_confirm"           // active at v1.0
  | "action_with_audit_only"        // RESERVED — requires ADR-030 + PolicyAuthorization framework
  | "fully_autonomous";             // RESERVED — requires ADR-030 + I-012 successor invariant + multi-party clinical safety case
```

## 2 · Active levels (v1.0)

### 2.1 · `advisory`

**Description:** AI provides information only. No action authority. Patient or clinician interprets and decides.

**Examples:**
- Mode 1 chat answer to a patient question
- Mode 2 lab interpretation summary surfaced to a clinician for decision
- AI-generated educational content shown to a patient pre-intake

**Sign-off chain:** None at execution time. Workload-level sign-off (e.g., guardrail template approval) governs the AI's outputs.

**Audit envelope:** standard audit event with `actor.type = ai_workload`, `ai_workload_type` populated, `autonomy_level = "advisory"`. No PolicyAuthorization reference required.

**State machine:** terminates at `ai_recommended` or `ai_information_provided`; no action transition.

### 2.2 · `suggestion`

**Description:** AI proposes an action. Human selects from options or rejects. AI does not execute.

**Examples:**
- AI suggests a follow-up appointment time; patient confirms
- AI proposes a triage category; clinician confirms or overrides
- Mode 2 presents a list of refill quantity *options* for the clinician to consider — note that the clinician selecting an option here is a *pre-action proposal step*, not the prescription execution itself; the actual refill prescription/medication-order execution still requires `action_with_confirm` per I-012 and §5 rule 5.

**Boundary with I-012 (v0.2 cleanup — Codex Finding 4 follow-up):** `suggestion` autonomy level may surface options for clinician consideration on prescription/refill/medication-order workflows, but cannot itself satisfy the prescription-execution requirement. The human selection in `suggestion` is the act of *selecting an option*, not committing the prescription; commit must flow through `action_with_confirm`.

**Sign-off chain:** Human selection at execution time. The selecting human's identity is recorded as the action actor, with the AI's suggestion as input attribution. For I-012-governed workflows, the selection itself does NOT trigger prescription execution — that is a separate `action_with_confirm` step.

**Audit envelope:** standard audit event for the AI suggestion + a separate audit event for the human selection. The human-selection event is the action actor; the AI suggestion is referenced as input.

**State machine:** `ai_recommended → human_selected → executed`.

### 2.3 · `action_with_confirm`

**Description:** AI proposes a specific action. Human confirms before execution. AI does not execute without confirm.

**Examples:**
- Mode 2 proposes a specific medication request; clinician confirms before transmission to pharmacy
- AI proposes a protocol-authorized refill renewal; clinician confirms
- AI proposes a lab order; clinician confirms

**Sign-off chain:** Single human confirm at execution time. Confirming human's identity is recorded as the action actor, jointly with the AI proposal attribution.

**Audit envelope:** AI proposal event + human confirmation event. Both reference the same action ID. The action's audit chain includes both events.

**State machine:** `ai_recommended → human_confirmed → executed`.

**Default for v1.0 protocol_execution workload:** `action_with_confirm` is the default autonomy level for Mode 2 (current `protocol_execution`).

**I-012 binding (v0.4 patch — mirrors Master PRD §13.7 v0.3 normative wording):** I-012 binds prescription, refill, and medication-order actions (i.e., `medication_request`, refill, and medication-order actions) to clinician sign-off. Within `protocol_execution` workload, these actions may only reach `executed` state through `action_with_confirm` with an explicit, audit-recorded clinician confirmation event linked to the action.

State machine validation MUST reject any `executed` transition for these actions UNLESS **all** of the following hold:

1. `autonomy_level == action_with_confirm` (string equality; not membership in a set).
2. An explicit clinician confirmation event exists in the immutable audit chain, scoped to this `action_id`, prior to the transition.
3. The confirming actor holds a role authorized to sign for the action class under RBAC v1.1 / I-012.

Therefore, `executed` MUST be rejected when `autonomy_level ∈ {advisory, suggestion, action_with_audit_only, fully_autonomous}`, when `autonomy_level` is `null` / unknown / absent, or when any required confirmation evidence is missing — including any future enum value not yet authorized by an ADR-029 successor. See WORKLOAD_TAXONOMY §2.2 and Master PRD §13.7 for the canonical statement; this contract mirrors the §13.7 wording exactly.

---

## 3 · Reserved future levels

These values are reserved in the type enum but NOT activated. Activation requires ADR-030 plus the listed companion contracts/invariants.

### 3.1 · `action_with_audit_only`

**Description:** AI executes the action. Human reviews after-the-fact via audit. No pre-execution confirm.

**Status:** RESERVED. Per Master PRD §13.7 v0.3, activation requires ALL of (mirroring §13.7 line 645 exactly):

- ADR-030 (Tiered Autonomy Progression Model) Accepted
- PolicyAuthorization framework active in GOVERNANCE_CONTROLS
- I-012 successor invariant scoping out current `action_with_confirm` requirement for the specific workload × action × protocol combination
- Dedicated safety case approved for the specific (workload × action × protocol)
- Clinical Safety Officer + Privacy Officer + Regulatory Affairs Lead sign-off (sign-off triad)
- Per-market regulatory clearance specific to this autonomy level

Activation is recorded by an activation audit event in the immutable audit chain referencing the active successor ADR; ADR approval alone is never sufficient.

**Contract-side additional requirement (not part of §13.7 normative wording, but required by GOVERNANCE_CONTROLS / PolicyAuthorization framework):** A defined `rollback_trigger` per PolicyAuthorization is REQUIRED at activation time. This requirement is sourced from the GOVERNANCE_CONTROLS contract's PolicyAuthorization entity definition (per AUTONOMY_LEVELS §6 cross-reference), not from §13.7 itself.

**Anticipated audit envelope:** AI action event with `autonomy_level = "action_with_audit_only"`, `supervising_policy_id` populated. Post-execution review event references the action.

**Anticipated state machine:** `ai_recommended → audit_only_executed → completed`. Reviewer can trigger `escalate_for_review` retroactively if action is concerning.

### 3.2 · `fully_autonomous`

**Description:** AI executes the action without per-action human review (audit chain still mandatory; platform-floor safety gates always apply: crisis detection I-019, interaction engine, tenant isolation, audit).

**Status:** RESERVED. Per Master PRD §13.7 v0.3, activation prerequisites are a **strict superset of `action_with_audit_only`**: all `action_with_audit_only` prerequisites (per §3.1 above) PLUS:

- (a) **Augmented safety case** demonstrating residual-risk acceptability without per-action human gating
- (b) **Per-market regulatory clearance specific to fully-autonomous operation** (cannot inherit `action_with_audit_only` clearance)
- (c) **Clinical Safety Officer + Privacy Officer + Regulatory Affairs Lead triple sign-off** at activation **and on every material change**
- (d) **Named successor invariant** superseding I-012 for the action class in scope
- (e) Any additional gates established by ADR-030 successors

No platform code path may resolve `fully_autonomous` to an executed clinical action until all prerequisites are recorded as satisfied in the activation audit event. ADR approval alone is never sufficient; the activation audit event in the immutable audit chain is required.

**Anticipated audit envelope:** AI action event with `autonomy_level = "fully_autonomous"`, `supervising_policy_id` populated. No human review event.

**Anticipated state machine:** `ai_recommended → autonomous_executed → completed`. Platform-floor safety gates can still suspend (`autonomy_suspended`).

---

## 4 · Activation matrix (v1.0)

| autonomy_level | Active at v1.0? | Workload types allowed |
|---|---|---|
| advisory | ✅ Active | conversational_assistant, protocol_execution |
| suggestion | ✅ Active | protocol_execution (rare; non-default) |
| action_with_confirm | ✅ Active | protocol_execution (default) |
| action_with_audit_only | ❌ Reserved | None until ADR-030 |
| fully_autonomous | ❌ Reserved | None until ADR-030 + safety case |

## 5 · Per-action validation

Every `AIExecution` MUST satisfy ALL of:

1. `workload_type` is a value defined in WORKLOAD_TAXONOMY contract.
2. `autonomy_level` is a value defined in this contract AND activated per §4.
3. The `(workload_type, autonomy_level)` pair is permitted per WORKLOAD_TAXONOMY §2 / §3 `autonomy_level_range`.
4. For `autonomy_level ∈ {action_with_audit_only, fully_autonomous}`: a valid `PolicyAuthorization` reference must be supplied via `supervising_policy_id`. v1.0 enforces this as a hard validation rejection (no PolicyAuthorization framework yet, so these reserved levels cannot pass validation; this enforces the reserved status at runtime).
5. **For I-012-governed actions (`medication_request` / prescription, refill, medication-order) executed by `protocol_execution` workload (mirrors Master PRD §13.7 v0.3):** transition to `executed` state MUST be rejected UNLESS **all** three of the following hold: (a) `autonomy_level == action_with_confirm` (string equality; not membership in a set); (b) an explicit clinician confirmation event exists in the immutable audit chain, scoped to this `action_id`, prior to the transition; (c) the confirming actor holds a role authorized to sign for the action class under RBAC v1.1 / I-012. Therefore `executed` MUST be rejected when `autonomy_level ∈ {advisory, suggestion, action_with_audit_only, fully_autonomous}`, when `autonomy_level` is `null` / unknown / absent, or when any required confirmation evidence is missing — including any future enum value not yet authorized by an ADR-029 successor. The reserved levels cannot reach `executed` for I-012 actions until **both** (i) a successor ADR (ADR-030 or later) explicitly supersedes I-012 for the action class in scope, AND (ii) an activation audit event recording the supersession is present in the immutable audit chain. ADR approval alone is never sufficient. (v0.4 patch — mirrors Master PRD §13.7 v0.3 normative wording exactly.)
6. Platform-floor invariants apply regardless of level (I-019 crisis detection, I-023..I-026 tenant isolation, I-027 audit append-only).

## 6 · Cross-references

- **WORKLOAD_TAXONOMY contract §4.1:** defines per-workload-type `autonomy_level_range`
- **AUDIT_EVENTS contract:** every audit event from an AI workload carries `autonomy_level`
- **GOVERNANCE_CONTROLS contract:** `PolicyAuthorization` skeleton (placeholder at v1.0; activated by ADR-030)
- **INVARIANTS contract:** I-012 (clinician sign-off for prescription) is the current binding invariant on `action_with_confirm` and below; successor language required for higher autonomy levels
- **State Machines v1.1:** `ProtocolAuthorizedAction` lifecycle uses autonomy_level to gate transitions
- **ADR-029:** the architectural decision authorizing this contract
- **ADR-030 (DEFERRED):** the architectural decision required to activate `action_with_audit_only` and `fully_autonomous`
- **ADR-005:** remains binding for `protocol_execution` workload at autonomy_level ≤ `action_with_confirm`

## 7 · Invariants referenced

This contract is bounded by:

- **I-012** — clinician sign-off for prescription/refill/medication-order actions: binding at `action_with_confirm` for `protocol_execution` workload. See §2.3 and §5 rule 5 for the validation boundary. Reserved levels would require successor invariant language.
- **I-019** — crisis detection floor: applies regardless of autonomy_level.
- **I-023..I-026** — tenant isolation: applies regardless of level.
- **I-027** — audit append-only: every level emits standard audit envelope plus level-specific fields per WORKLOAD_TAXONOMY §1 nullability rule.

This contract does NOT supersede or relax any invariant. Reserved levels are gated on successor invariant language landing first.

---

## 8 · Document control

- **v0.1 DRAFT — 2026-04-29** — Initial skeleton for v1.10 Tier 2 forward-compatibility adoption.
- **v0.2 DRAFT — 2026-04-29** — Patched per Codex pre-commit review 2026-04-29. Changes: Purpose §3 PolicyAuthorization activation logic fixed — required only for levels that explicitly require it (Finding 2); §2.3 + §5 rule 5 explicit I-012 preservation rule for prescription/refill/order actions (Finding 4); §5 platform-floor invariants restated with corrected I-023..I-026 / I-027 references (Finding 6); §7 invariants section restructured with I-012 validation boundary cross-reference.
- **v0.3 DRAFT — 2026-04-29** — Hotfix per Codex v1.1 verification (Finding 4 cleanup). §2.2 refill-quantity example clarified — selecting from a list is a *pre-action proposal step*, not the prescription-execution itself; §2.2 gains an explicit "Boundary with I-012" subsection stating that `suggestion` autonomy level cannot satisfy prescription-execution. Triple-sign-off recommended at Phase 3.X review (Engineering Lead, Clinical Safety Officer, Privacy Officer) per I-015.
- **v0.4 DRAFT — 2026-05-01** — Phase 3 reconciliation against canonical Master PRD v1.10 §13.7 v0.3. §2.3 I-012 binding tightened to mirror §13.7 reject-unless three-clause normative wording exactly: string equality `autonomy_level == action_with_confirm`; audit-chain clinician confirmation scoped to `action_id`; confirming actor RBAC v1.1 / I-012 authorized role. §3.1 `action_with_audit_only` prerequisites expanded to enumerate sign-off triad (Clinical Safety Officer + Privacy Officer + Regulatory Affairs Lead) + per-market regulatory clearance. §3.2 `fully_autonomous` rewritten as strict-superset 5-item activation list (augmented safety case; per-market regulatory clearance NOT inheritable from §3.1; triple sign-off at activation AND material change; named successor invariant superseding I-012; ADR-030-successor gates). Both reserved levels gated on both ADR approval AND activation audit event (two-condition AND); ADR approval alone explicitly never sufficient. §5 rule 5 rewritten to match. Old v0.1/v0.2/v0.3 wording (which only rejected `{advisory, suggestion}`) explicitly superseded.
- **v0.4.1 DRAFT — 2026-05-01** — Patch per Codex Phase 3 group-1 review v0.1 MEDIUM-5: §3.1 `action_with_audit_only` prerequisite list reorganized to (a) explicitly mirror §13.7 line 645 normative list (no extras), and (b) factor "rollback_trigger defined per PolicyAuthorization" out as a contract-side additional requirement sourced from GOVERNANCE_CONTROLS / PolicyAuthorization framework rather than §13.7. This preserves the runtime requirement while clarifying the source-of-truth distinction.
- **Status:** DRAFT — not canonical until v1.10 promotes.
- **Open questions:**
  - Should `suggestion` level have a separate audit envelope from `advisory` and `action_with_confirm`? (Working answer: yes — human selection is itself a recorded event.)
  - Should the activation matrix in §4 be tenant-overridable? (Working answer: no at v1.0; per-tenant variation comes via PolicyAuthorization.)
  - Should `autonomy_level` admit progressive escalation within a single AIExecution (e.g., starts as `suggestion`, escalates to `action_with_confirm` if human picks fast path)? (Working answer: no at v1.0 — one autonomy_level per AIExecution; escalation creates a new AIExecution.)
