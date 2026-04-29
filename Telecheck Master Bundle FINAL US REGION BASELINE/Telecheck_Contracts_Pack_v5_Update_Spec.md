# Telecheck — Contracts Pack v5 Update Specification

**Version:** 5.0
**Status:** Historical — full v5 modular pack now produced
**Owner:** Engineering Lead
**Purpose:** This document originally specified the exact changes needed to each v4.2 file to produce v5. The full v5 modular pack has since been produced as 14 canonical runtime files plus this historical companion document (15 files total in the frozen set). This document is retained for historical reference showing the v4.2 → v5 evolution rationale.

---

## Canonicality declaration

**The canonical Contracts Pack is now v5.0 modular — 14 runtime files, with this Update Specification retained as a historical companion.** The v4.2 modular pack is fully superseded. All v5 contract files are present in this zip. No external file dependencies exist.

---

## Files fully produced in v5 (new or rewritten)

| File | Status | Notes |
|---|---|---|
| `00-AI-LAYERING.md` | **Rewritten** | Produced as `Telecheck_Contracts_Pack_v5_00_AI_LAYERING.md`. Replaces v4.2 version entirely. |
| `00-GOVERNANCE-CONTROLS.md` | **New file** | Produced as `Telecheck_Contracts_Pack_v5_00_GOVERNANCE_CONTROLS.md`. Net-new contracts (CONFIG, INCIDENT, SIGNAL) not in v4.2. |

---

## Files requiring updates (changes specified below)

### README.md — Light update

**Change 1:** Update version references from v4.2 to v5.0.
**Change 2:** Update the file list to include `00-GOVERNANCE-CONTROLS.md` as a new file.
**Change 3:** Replace the description of the pack as "a surgical pass" with: "v5 absorbs architectural decisions from all 17 slice PRDs, the ADR set, and net-new governance controls (configuration validation, incident response, safety-signal enforcement). The pack now serves as the complete runtime governance specification."
**Change 4:** Add to the reading order: "Start with 00-AI-LAYERING.md and 00-GOVERNANCE-CONTROLS.md — these are the most significantly changed files."

---

### 00-GLOSSARY.md — Moderate update

**Add terms:**

| Term | Definition |
|---|---|
| Mode 1 | AI Clinical Assistant operating as patient-facing conversational chat, governed by guardrail templates (§13.2 of Master PRD). |
| Mode 2 | AI Clinical Assistant operating as protocol execution agent for structured async clinical case preparation, governed by clinical protocols (§13.1 of Master PRD). |
| Guardrail template | A versioned, testable configuration that defines what Mode 1 AI may discuss, how it frames uncertainty, when it escalates, and what it refuses. Bounded by the platform floor. |
| Market Pack | A versioned container of policy configuration, protocol library, partner relationships, evidence artifacts, guardrail assignments, moderation policies, and rollout state for a single market. The reasoning and rollback unit for market governance. |
| Activation review | A governance process where a protocol, guardrail template, or moderation policy is evaluated for deployment to a market. Requires multi-party sign-off per PROTO-001 / GUARD-002. |
| Rollback target | A previous version of a configuration object or Market Pack that can be restored in one action. |
| Bridge supply | A limited medication supply (typically 7-14 days taper) authorized by a clinician when consent revocation affects a medication with abrupt-discontinuation risk. A new prescribing action, not a consent continuation. |
| AI scribe | AI-powered real-time transcription and summary during sync video consults. A documentation tool with no clinical authority. |
| Conservative Default | The immutable guardrail template that cannot be modified or deactivated. All markets revert to this in Emergency Safe Mode. |
| Physician agreement | The required field on every Mode 2 case recording whether the reviewing physician agreed, modified, or disagreed with the AI recommendation. |

---

### 00-DOMAIN-EVENTS.md — Major update

**Add event types:**

| Event | Aggregate | Description |
|---|---|---|
| `market_pack.version_created` | MarketPack | New pack version created for a market |
| `market_pack.state_changed` | MarketPack | Pack transitioned between rollout states (PILOT → LIMITED → FULL etc.) |
| `protocol.activated` | Protocol | Protocol activated in a market |
| `protocol.deactivated` | Protocol | Protocol deactivated (one-action rollback or scheduled expiration) |
| `protocol.expired` | Protocol | Protocol auto-expired due to review cadence (PROTO-002) |
| `guardrail.deployed` | GuardrailTemplate | Guardrail template deployed to a market |
| `guardrail.reverted` | GuardrailTemplate | Guardrail template reverted to Conservative Default |
| `moderation_policy.deployed` | ModerationPolicy | Moderation policy deployed to a market |
| `emergency_safe_mode.entered` | MarketPack | Market entered Emergency Safe Mode |
| `emergency_safe_mode.exited` | MarketPack | Market exited Emergency Safe Mode |
| `bridge_supply.authorized` | Refill | Clinician authorized bridge supply after consent revocation |
| `ai.mode2_summary_produced` | Consult | Mode 2 produced a clinical summary for physician review |
| `ai.physician_agreement_recorded` | Consult | Physician recorded agreement/modification/disagreement with Mode 2 |
| `ai.scribe_summary_generated` | Consult | AI scribe produced draft post-visit summary |

---

### 00-AUDIT-EVENTS.md — Major update

**Add audit fields to existing events:**

For all AI-related audit events, add:
- `ai_mode`: enum (mode_1, mode_2, scribe, interpretation, food_scan)
- `guardrail_template_id` and `guardrail_version` (for Mode 1)
- `protocol_id` and `protocol_version` (for Mode 2)
- `physician_agreement`: enum (agreed, modified, disagreed) — required for Mode 2

For protocol execution audit events, add:
- `protocol_activation_date`: when the protocol was activated
- `protocol_review_due_date`: when the next review is due
- `protocol_accountable_clinician`: named clinician

For configuration change audit events, add:
- `config_type`: enum (protocol, guardrail, moderation_policy, market_pack)
- `previous_version` and `new_version`
- `authorization_chain`: list of sign-offs

For bridge supply audit events, add:
- `bridge_supply_reason`: consent revocation + abrupt-discontinuation risk
- `bridge_supply_duration`: days authorized
- `original_consent_id`: the revoked consent
- `bridge_prescribing_rationale`: clinician's clinical justification

---

### 00-INVARIANTS.md — Moderate update

**Add invariants:**

| ID | Invariant | Source |
|---|---|---|
| I-AI-001 | AI operates in exactly two modes; every AI action is attributable to one mode | ADR-002 |
| I-AI-002 | Mode 2 auto-approve requires 90-day track record + zero safety-critical disagreements + formal ADR | ADR-002, Feature PRD #28 |
| I-AI-003 | AI does not post, respond, or generate content within community spaces | ADR-007 |
| I-AI-004 | Conservative Default guardrail template cannot be modified or deactivated | Guardrail Templates v1.0 |
| I-BRIDGE-001 | Bridge supply is a new prescribing action, not a consent continuation | ADR-008 |
| I-CONFIG-001 | Configuration below the platform floor is rejected at validation time | CONFIG-001 |
| I-SIGNAL-001 | Interaction engine is mandatory for every prescribing and refill decision | SIGNAL-001 |

---

### 00-TYPES.md — Moderate update

**Add types:**

```typescript
type AIMode = 'mode_1' | 'mode_2' | 'scribe' | 'interpretation' | 'food_scan';

type PhysicianAgreement = 'agreed' | 'modified' | 'disagreed';

type MarketPackState = 'draft' | 'in_review' | 'pilot' | 'limited_launch' | 'full_launch' | 'restricted' | 'emergency_safe_mode' | 'suspended';

type ConfigObjectType = 'protocol' | 'guardrail_template' | 'moderation_policy';

type ConfigObjectStatus = 'draft' | 'defined' | 'testing' | 'tested' | 'review' | 'approved' | 'deploying' | 'active' | 'rolled_back' | 'review_due' | 'reverted_to_default';

type ProtocolRiskClassification = 'high' | 'standard';

type GuardrailTemplateId = 'conservative_default_v1' | 'glp1_program_v1' | 'ed_program_v1' | 'labs_program_v1' | string;

type BridgeSupplyStatus = 'safety_hold' | 'bridge_authorized' | 'bridge_dispensed' | 'bridge_completed';

interface ProtocolActivation {
  protocol_id: string;
  protocol_version: string;
  market: string;
  risk_classification: ProtocolRiskClassification;
  accountable_clinician_id: string;
  activated_at: Timestamp;
  review_due_at: Timestamp;
  sign_offs: SignOff[];
}

interface SignOff {
  role: string;
  signer_id: string;
  signed_at: Timestamp;
  scope: 'clinical' | 'regulatory' | 'technical' | 'audit_visibility' | 'rollback_tested';
}
```

---

### 00-MARKET-LAUNCH.md — Moderate update

**Add:** Market Pack state machine reference (State Machines v1.0, §11). The Market Pack state transitions (DRAFT → IN_REVIEW → PILOT → LIMITED_LAUNCH → FULL_LAUNCH, with RESTRICTED, EMERGENCY_SAFE_MODE, and SUSPENDED branches) are now fully defined in the State Machines document and should be referenced here rather than duplicated.

**Add:** Blast-radius preview requirement. Before any Market Pack state transition, the Rollout Cockpit must display: what capabilities will change, how many patients are affected, what downstream workflows are impacted, and what the rollback path is.

**Add:** Evidence locker requirement. Every Market Pack maintains an evidence locker containing regulatory sign-offs, clinical approvals, test results, and deployment records. The evidence locker is queryable for regulatory export.

---

### 00-FORMS-ENGINE.md — Light update

**Add:** Reference to progressive consent presentation (Master PRD v1.6 §15). The Forms Engine manages the progressive consent blocks: platform consent at account creation, care consent at program enrollment, data-use consent at first AI interaction, delegation consent at delegate setup. Each consent block is a form section, not a separate form.

---

### 00-SOURCE-OF-TRUTH.md — Light update

**Add to precedence hierarchy:** ADR Set v1.0 at the top (already specified as highest precedence; now the ADR set actually exists with 15 decisions). Reference the ADR Set document explicitly.

**Add:** Artifact Registry v2.3 as the canonicality resolution mechanism. When two versions of any artifact conflict, the Registry resolves it — not recency, not completeness, not review-cycle count.

---

### 00-CCR-RUNTIME.md — Light update

No structural changes needed. Verify that the CCR (Cross-Cutting Runtime) contracts reference the new GOVERNANCE-CONTROLS file for CONFIG, INCIDENT, and SIGNAL contracts.

---

### 00-IDEMPOTENCY.md — No change

v4.2 content remains valid. No slice-level decisions affect idempotency contracts.

---

### 00-ERROR-MODEL.md — No change

v4.2 content remains valid. No slice-level decisions affect error model contracts.

---

## Summary of v5 changes

| File | Change level | Key additions |
|---|---|---|
| README.md | Light | Version bump, new file reference, description update |
| 00-AI-LAYERING.md | **Rewritten** | Two-mode architecture, guardrail governance, AI-not-in-community, scribe, physician agreement |
| 00-GOVERNANCE-CONTROLS.md | **New** | CONFIG-001–003, INCIDENT-001–003, SIGNAL-001–004 |
| 00-GLOSSARY.md | Moderate | 10 new terms |
| 00-DOMAIN-EVENTS.md | Major | 14 new event types |
| 00-AUDIT-EVENTS.md | Major | AI mode fields, protocol activation fields, config change fields, bridge supply fields |
| 00-INVARIANTS.md | Moderate | 7 new invariants |
| 00-TYPES.md | Moderate | 8 new types/interfaces |
| 00-MARKET-LAUNCH.md | Moderate | State machine reference, blast-radius preview, evidence locker |
| 00-FORMS-ENGINE.md | Light | Progressive consent reference |
| 00-SOURCE-OF-TRUTH.md | Light | ADR Set reference, Registry reference |
| 00-CCR-RUNTIME.md | Light | Cross-reference to GOVERNANCE-CONTROLS |
| 00-IDEMPOTENCY.md | None | — |
| 00-ERROR-MODEL.md | None | — |

**Total:** 2 files fully produced, 10 files with specified updates, 2 files unchanged, 1 net-new file (GOVERNANCE-CONTROLS). 15 files in v5 (up from 13 in v4.2).
