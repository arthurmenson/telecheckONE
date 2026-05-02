# Phase 2.X — F13 Glossary Reconciliation (v1.10 cycle)

**Version:** 1.0 RECONCILED — supersedes Phase1_Glossary_Drafts_DRAFT.md v1.0 DRAFT 2026-04-30
**Date:** 2026-05-01
**Reconciliation owner:** Workstream lead (Evans) via Claude proxy
**Approval owner (audit-B):** Product Lead + Marketing Lead + Legal — final sign-off pending stakeholder ratification (async path same as Phase 0 audit-B)
**Purpose:** Reconcile 37 drafted glossary terms against now-canonical Master PRD v1.10 §13.2, §13.7, §15.3 + ADR-027 v0.5 + ADR-028 v0.4 + ADR-029 v0.3. Output is the proposed final F13 contribution; lands in `Telecheck_Contracts_Pack_v5_00_GLOSSARY.md` at Phase 5 Contracts Pack edits.

**Total terms:** 37 (unchanged from draft)

**Reconciliation summary:**

| Block | Terms | Reconciliation |
|---|---|---|
| C1 (1) | Future Release marker | Aligned with canonical §21. No edits. |
| C3 (8) | Telecheck, Heros Health, Telecheck-{country}, separately incorporated subsidiary, Telecheck Health LLC, Telecheck-Ghana Ltd., two business lines, consumer DBA | Aligned with canonical §1, §2, §18. No edits. |
| C4 (4) | molecule-level marketing, program-level marketing, harm-reduction marketing posture, marketing copy governance review | **3 edits** — molecule-level "conditional in Ghana" → `pending_evidence`; molecule-/program-level definitions cross-ref to §13.2 working definition; governance review cross-ref normalized to §13.2 (Governance review process is an internal subsection of §13.2, not a separate §13.6 — upstream Master PRD §13.2 also cleaned up to remove stale §13.5/§13.6 self-references) + §7.9 + ADR-027. v0.2 patch — Codex Phase 2.X MEDIUM: §13.6 not a resolvable section heading. |
| C5 (10) | research data partnership, Posture A/B, DSA, de-identification engine, Safe Harbor, k-anonymity, cohort definition layer, aggregation layer, REC, population observatory | **5 edits** — replace "§X NEW" → "§15.3" (2 places); DSA invariant cross-ref I-024/I-026 → I-029/I-031; k-anonymity example k=5 → k=11 with `k_min` default reference; REC entry references structured CCR `research_ethics_review_body` object |
| C7 (14) | AI workload type, conversational_assistant, protocol_execution, autonomous_agent, autonomy_level, advisory, suggestion, action_with_confirm, action_with_audit_only, fully_autonomous, policy_authorization, agent_identity, knowledge_source_registry, supervising_policy | **5 edits** — autonomy_level cross-ref to §13.7 single normative source of truth; action_with_confirm aligned to §13.7 reject-unless three-clause rule; action_with_audit_only prerequisites tightened to canonical §13.7 (sign-off triad + per-market regulatory clearance); fully_autonomous prerequisites tightened to canonical §13.7 strict-superset 5-item list; protocol_execution tool_access carries "(descriptive at v1.0; non-normative until ADR-031)" qualifier |

---

## C1 — §21 Non-goals regulatory-conditional rewrite

### Future Release marker

**Definition:** A non-goal entry marker indicating the item is not in scope for the current release but has a documented activation path or regulatory pathway that may bring it into scope in a future release. Distinguishes regulatory-conditional non-goals (could activate under different posture) from absolute non-goals (will not activate). Used in Master PRD §21 alongside three-axis classification (Regulatory · Architecture · Activation).

**Distinguishes from:** "Phase 2/3+" roadmap language (Phase 2/3+ describes timing-bound items already on the roadmap; Future Release marker describes items that may or may not get on the roadmap depending on regulatory/strategic conditions).

**Cross-reference:** Master PRD §21 (Non-goals); Master PRD §19 (Roadmap beyond launch).

---

## C3 — Brand structure + tenant identifier rename

### Telecheck

**Definition:** Parent company / platform brand / B2B mark. Anchors WHO/UN partnerships, regulatory engagement at the multilateral level, and platform-as-a-service business line. **Never the consumer mark** in any market.

**Cross-reference:** Master PRD §1 Strategic differentiation; Master PRD §18 Business model.

### Heros Health

**Definition:** Global consumer DBA (doing-business-as) for all Telecheck-operated DTC. Country-instanced via subdomains: `heroshealth.com` (US), `ghana.heroshealth.com`, `nigeria.heroshealth.com` (future), `kenya.heroshealth.com` (future), etc. The unified consumer app is "Telecheck Heros." **Heros Health is a DBA, not a separate legal entity.** No "Heros Health Inc."

**Cross-reference:** Master PRD §1; Master PRD §18.3 Telecheck-US operating business.

### Telecheck-{country}

**Definition:** Uniform tenant identifier convention for Telecheck-operated DTC tenants. Each country instance is a separately incorporated subsidiary. Examples: Telecheck-US (operated by Telecheck Health LLC; trades as Heros Health), Telecheck-Ghana (operated by Telecheck-Ghana Ltd.; trades as Heros Health Ghana), Telecheck-Nigeria (future), Telecheck-Kenya (future).

**Cross-reference:** Master PRD §2 Tenant table.

### separately incorporated subsidiary

**Definition:** Each per-country operating tenant is a separately incorporated subsidiary of Telecheck-the-parent, holding its own regulatory entity registration, banking, payment-processor account, and local employer-of-record arrangements. Distinct from the platform tenant identifier (which is logical) and the consumer brand (which is a DBA).

**Cross-reference:** Master PRD §2; Master PRD §18; ADR-023 multi-tenancy.

### Telecheck Health LLC

**Definition:** US legal entity operating the Telecheck-US tenant. Trades patient-facing as Heros Health at `heroshealth.com`.

**Cross-reference:** Master PRD §2; Master PRD §18.3.

### Telecheck-Ghana Ltd.

**Definition:** Ghana legal entity operating the Telecheck-Ghana tenant. Trades patient-facing as Heros Health Ghana at `ghana.heroshealth.com`.

**Cross-reference:** Master PRD §2; Master PRD §18.

### two business lines

**Definition:** The platform supports two distinct business lines:

- **Line 1: Telecheck-operated DTC.** Telecheck operates the consumer DTC business directly under the Heros Health brand, country-instanced via subdomains.
- **Line 2: Platform as a service.** Telecheck licenses the platform to genuinely-external third-party DTC operators in their own markets. Each external tenant brings its own consumer brand and app.

WHO/UN and other multilateral partnerships are anchored at the Telecheck parent level, separate from these business lines.

**Cross-reference:** Master PRD §1; Master PRD §18.

### consumer DBA

**Definition:** A consumer "doing-business-as" name applied to a Telecheck-operated tenant. Patient-facing branding and marketing surfaces use the DBA; operating tenant identifier (Telecheck-{country}) is internal/B2B. Heros Health is the global consumer DBA for Line 1 (Telecheck-operated DTC).

**Cross-reference:** Master PRD §1; Master PRD §18.

---

## C4 — Country-conditional DTC marketing posture

### molecule-level marketing

**Definition:** Marketing copy that names a specific medication (active pharmaceutical ingredient or branded product). Per the working definition in Master PRD §13.2, a surface qualifies as molecule-level if it satisfies any of: names a specific active pharmaceutical ingredient (e.g., "semaglutide", "sildenafil"); names a specific branded product (e.g., "Ozempic", "Wegovy"); names a specific dosage or formulation regime tied to a specific product; compares specific products by name; implies efficacy claims tied to a specific product. Subject to per-country regulatory posture per ADR-027 and the CCR `molecule_level_marketing_permitted` 3-state enum (`prohibited` / `pending_evidence` / `permitted`). At v1.0 launch: `prohibited` in Telecheck-US (FDA + state telehealth advertising rules); `pending_evidence` in Telecheck-Ghana (regulatory engagement underway; molecule-level surfaces remain disabled until `marketing_copy_governance_evidence` fully populated).

**Cross-reference:** ADR-027; Master PRD §7.9 (Harm-reduction marketing posture); Master PRD §13.2 (Marketing copy governance — working definition and Governance review process).

### program-level marketing

**Definition:** Marketing copy that names a clinical category or program without naming a specific medication. Per Master PRD §13.2 working definition, a surface is program-level if it does NOT satisfy any of the molecule-level criteria and instead names a clinical category/program (e.g., "GLP-1 weight management program," "ED program," "diabetes RPM program"). Program-level marketing follows standard marketing review (not the §13.2 Governance review process). Borderline cases default to molecule-level handling under fail-closed rule per §13.2.

**Distinguishes from:** molecule-level marketing.

**Cross-reference:** ADR-027; Master PRD §7.9; Master PRD §13.2 (working definition); Master PRD §25 (Open questions — borderline-case refinement).

### harm-reduction marketing posture

**Definition:** Operational principle (Master PRD §7.9) stating that emerging-market tenants, where regulatory posture permits, may operate molecule-level marketing surfaces under the platform's safety floor (interaction engine, herb-drug, fake-med detection, clinician sign-off, audit trail). The marketing surfaces direct patients into the platform's mediated pathway, reducing harm relative to the counterfactual (unmediated pharmacy purchase). Activation requires CCR `molecule_level_marketing_permitted = permitted` AND fully populated `marketing_copy_governance_evidence` per §13.2.

**Cross-reference:** ADR-027; Master PRD §7.9; Master PRD §13.2; Master PRD §21 (Non-goals — country-conditional rewrite).

### marketing copy governance review

**Definition:** Operator-side governance review apparatus (Master PRD §13.2, including its Governance review process internal subsection) that approves molecule-level marketing copy before publication. Triple sign-off: Marketing copy governance lead + Clinical Safety Officer + Regulatory Affairs Lead. Re-review cadence configured per tenant via CCR `marketing_governance_review_cadence_months` (initial: 6 months for high-risk medication categories like GLP-1; 12 months for lower-risk categories). Marketing copy governance review classifies under workload-taxonomy governance class `protocol_authorized` per §13.7 / ADR-029.

**Cross-reference:** Master PRD §13.2 (Marketing copy governance, including the Governance review process internal subsection); ADR-027; Master PRD §24 (Marketing copy governance lead designation pre-launch decision).

---

## C5 — Research data partnership Posture A

### research data partnership

**Definition:** Strategic relationship with a multilateral body (WHO, UN agency, or analogous), academic research consortium, or population-health authority where Telecheck-the-parent provides de-identified longitudinal data under a Data Sharing Agreement (DSA). Patient consent at the operating-tenant level (5th consent tier per §15.2); data flows through Telecheck parent governance for partnership use. **Anchored at parent level, not at consumer brand level.** Distinct from trial-execution platform (Posture B; remains absolute non-goal). Activation gated by CCR `research_data_partnership_active` 3-state enum (`inactive` / `consent_only` / `active`) per §15.3.

**Cross-reference:** ADR-028; Master PRD §15.3 (Research Data Governance); Master PRD §7.10 (Research data accessibility).

### Posture A / Posture B

**Definition:**

- **Posture A — Research data partner / population observatory.** De-identified longitudinal data export under DSAs to research partners. Aggregation layer for population-level statistics. Permitted data domains are a closed enum: `chronic_disease_longitudinal`, `ncd_surveillance`, `pharmacovigilance_signal`, `population_health_aggregate`. **In scope as Release 2 goal** per ADR-028.
- **Posture B — Trial execution platform.** eCRF-style data collection, IRB-managed protocols, sponsor reporting, randomization, blinding, query resolution, IND/IDE filings, monitoring visits, partner-driven protocolized cohort recruitment, prospective observational studies that alter or instrument care workflows, post-market studies that change prescribing/follow-up behavior, partner requests that alter care workflows. **Remains absolute non-goal** per ADR-028.

The Posture A / Posture B boundary is bright-line. If a proposed feature crosses into Posture B, it requires a separate ADR superseding the relevant scope language in ADR-028.

**Cross-reference:** ADR-028; Master PRD §15.3; Master PRD §21.

### data-sharing agreement (DSA)

**Definition:** Legal instrument authorizing a research partner to receive de-identified data exports from Telecheck under defined scope, duration, de-identification standard, k-anonymity threshold, consent provenance, audit posture, retention rules, and partner obligations. Each DSA has its own activation gate and audit trail per I-029 (research data export requires active DSA + active research consent + k-anonymity threshold ≥ k_min) and I-031 (research data export fully audited with cohort definition, k-threshold actually used, requester identity, DSA reference, audit_sensitivity_level: high_pii). DSA template is legal-reviewed pre-launch (Master PRD §24).

**Cross-reference:** ADR-028; INVARIANTS contract v5.1 (v1.10) I-029, I-031; Master PRD §15.3; Master PRD §24.

### de-identification engine

**Definition:** Platform component that transforms patient-level clinical records into de-identified records meeting the chosen de-identification standard (Safe Harbor + k-anonymity per default, with `k_min` = 11 as v1.10 acceptance default). Implemented as part of the research data export module in System Architecture v1.2. Activated at Release 2 per ADR-028. Per §15.3 export pipeline, the de-identification engine is layer 2 of 4 (cohort definition → de-identification → aggregation → DSA enforcement).

**Cross-reference:** ADR-028; System Architecture v1.2; Master PRD §15.3 (export pipeline); Master PRD §24.

### Safe Harbor de-identification

**Definition:** HIPAA Safe Harbor de-identification standard: removal of 18 specified identifier categories. Combined with k-anonymity threshold for additional protection against re-identification under combination-attack risk. Default standard per CCR `de_identification_standard` enum value.

**Cross-reference:** ADR-028; CCR Runtime contract; Master PRD §15.3.

### k-anonymity

**Definition:** A re-identification protection standard requiring that any combination of quasi-identifying attributes in the released dataset matches at least k records (e.g., k=11 means at least 11 records share each combination of quasi-identifiers). Threshold value (k) is governed by `k_min`, default `k_min = 11` at v1.10 acceptance (HIPAA expert-determination low-risk floor per §15.3). Per-DSA increases above `k_min` are permitted (e.g., k=20 for high-sensitivity domains); decreases below `k_min` are prohibited per I-029. Suppression rule: any cohort cell with count < `k_min` is suppressed in aggregation outputs (not silently merged).

**Cross-reference:** ADR-028; INVARIANTS contract v5.1 (v1.10) I-029; Master PRD §15.3 (export pipeline layer 2).

### cohort definition layer

**Definition:** Platform component where research partners (or their proxies in the platform admin) define cohorts by clinical inclusion/exclusion criteria without seeing PHI. Cohort definitions are versioned, audited via `research.cohort_defined` audit event per AUDIT_EVENTS v5.1, and reviewed against the active DSA's permitted use scope (must match `research_permitted_data_domains` enum). Layer 1 of 4 in the §15.3 export pipeline; feeds the de-identification engine.

**Cross-reference:** ADR-028; System Architecture v1.2; AUDIT_EVENTS contract v5.1; Master PRD §15.3.

### aggregation layer

**Definition:** Platform component that produces population-level statistics (counts, distributions, longitudinal trends, prevalence, adherence rates, AE rates, outcome trajectories) without exposing patient-level data. Used for population-health programs (NCD surveillance, chronic disease registries) where aggregate flow is sufficient. Subject to the same `k_min` floor as the de-identification engine (cells with count < `k_min` are suppressed). Layer 3 of 4 in the §15.3 export pipeline.

**Cross-reference:** ADR-028; System Architecture v1.2; Master PRD §15.3.

### research ethics committee (REC)

**Definition:** External oversight body that reviews and approves research data partnership activations under ethics review. Per CCR structured object `research_ethics_review_body` (`name`, `jurisdiction`, `approval_reference_id`, `approval_validity_from`, `approval_validity_to`, `approval_scope`, `per_dsa_review_required`). Each market has an in-country REC that reviews proposed DSAs and material changes to consent text. Telecheck-Ghana initial designation candidates: Ghana Health Service (GHS) REC or Noguchi Memorial Institute IRB. Future markets onboard analogous bodies alongside country expansion. Designated pre-launch per Master PRD §24. Engaged at per-country activation gate.

**Cross-reference:** ADR-028; Master PRD §15.3 (Ethics oversight); Master PRD §24; Master PRD §22 (Dependencies).

### population observatory

**Definition:** Posture A framing of Telecheck's research data partnership role: an observation platform for population-level chronic-disease data flows, not a trial-execution platform. Distinguishes the platform's research role from interventional research (Posture B; absolute non-goal). Permitted data domains under this framing: `chronic_disease_longitudinal`, `ncd_surveillance`, `pharmacovigilance_signal`, `population_health_aggregate` (closed enum per §15.3).

**Cross-reference:** ADR-028; Master PRD §7.10; Master PRD §15.3.

---

## C7 — AI workload taxonomy + autonomy levels

### AI workload type

**Definition:** Discriminator (`ai_workload_type`) for AI workload kinds. Replaces the binary "AI Mode 1 / AI Mode 2" framing of AI-LAYERING (AI-ARCH-001) with an extensible property-based taxonomy. Values defined exclusively in WORKLOAD_TAXONOMY contract; activation of reserved values requires successor ADR per ADR-029. Carries four orthogonal properties: `autonomy_level`, `tool_access`, `memory_scope`, `governance_class`.

**Cross-reference:** WORKLOAD_TAXONOMY contract; ADR-029; AI-LAYERING contract v5.1; Master PRD §13.7.

### conversational_assistant

**Definition:** AI workload type for patient-facing chat with guardrails. Cannot make clinical decisions. Successor to AI-LAYERING Mode 1; identical semantics, relabeled. Active at v1.0. Properties: `autonomy_level_range = [advisory]`; `tool_access = [internal_kb_lookup]`; `memory_scope = [session]`; `governance_class = floor_safety`.

**Cross-reference:** WORKLOAD_TAXONOMY §2.1; AI-LAYERING contract; Master PRD §13.7.

### protocol_execution

**Definition:** AI workload type for async clinical preparation engine operating within named, versioned protocols. Successor to AI-LAYERING Mode 2; identical semantics, relabeled. Active at v1.0 with `autonomy_level` capped at `action_with_confirm` (clinician confirmation required per I-012 — see §13.7 normative I-012 preservation rule). Properties: `autonomy_level_range = [advisory, suggestion, action_with_confirm]` (active); `action_with_audit_only` reserved; `tool_access = [protocol_kb, lab_lookup, formulary_lookup, interaction_engine]` (descriptive at v1.0; non-normative until ADR-031 / AGENT_TOOLS); `memory_scope = [patient_episode, program_history]`; `governance_class = protocol_authorized`.

**Cross-reference:** WORKLOAD_TAXONOMY §2.2; AI-LAYERING contract; ADR-005 protocolized autonomy; Master PRD §13.7; INVARIANTS v5.1 I-012.

### autonomous_agent

**Definition:** Reserved AI workload type for open-ended multi-step clinical agent that reasons across patient history, labs, medications, and prior actions. Not bounded to a single named protocol. **RESERVED — requires ADR-030 (Tiered Autonomy Progression Model) plus AGENT_MEMORY contract (ADR-032) plus PolicyAuthorization framework activation.** Not implemented at v1.0.

**Cross-reference:** WORKLOAD_TAXONOMY §3.1; ADR-029; reserved ADR-030, ADR-032; Master PRD §13.7.

### autonomy_level

**Definition:** Orthogonal property of an AI workload describing the degree of autonomous action authority. Five values per AUTONOMY_LEVELS contract: `advisory`, `suggestion`, `action_with_confirm` (active at v1.0); `action_with_audit_only`, `fully_autonomous` (reserved). Per-action validation enforces (`workload_type` × `autonomy_level`) compatibility per WORKLOAD_TAXONOMY `autonomy_level_range`. **Master PRD §13.7 is the single normative source of truth for I-012 + autonomy-level interaction**; downstream contracts (STATE_MACHINES, AUDIT_EVENTS, AUTONOMY_LEVELS) and tests MUST mirror §13.7 exactly.

**Cross-reference:** AUTONOMY_LEVELS contract; WORKLOAD_TAXONOMY contract; ADR-029; Master PRD §13.7.

### advisory

**Definition:** Autonomy level: AI provides information only. No action authority. Patient or clinician interprets and decides. Active at v1.0 for both `conversational_assistant` and `protocol_execution` workloads. State machine terminates at `ai_recommended` or `ai_information_provided`; no action transition.

**Cross-reference:** AUTONOMY_LEVELS §2.1; Master PRD §13.7.

### suggestion

**Definition:** Autonomy level: AI proposes an action; human selects from options or rejects. AI does not execute. Active at v1.0 for `protocol_execution` (rare; non-default). Boundary: cannot satisfy I-012 prescription/refill/medication-order execution requirement (selection of options is a pre-action proposal step, not the prescription execution itself). Per §13.7 I-012 preservation rule, `executed` MUST be rejected for I-012 actions when `autonomy_level == suggestion`.

**Cross-reference:** AUTONOMY_LEVELS §2.2; Master PRD §13.7; INVARIANTS v5.1 I-012.

### action_with_confirm

**Definition:** Autonomy level: AI proposes a specific action; human confirms before execution. AI does not execute without confirm. Active at v1.0 default for `protocol_execution`. Per the Master PRD §13.7 I-012 preservation rule, `executed` for I-012 actions (prescription, refill, medication-order) MUST be rejected UNLESS all three of the following hold: (1) `autonomy_level == action_with_confirm` (string equality; not membership in a set), (2) an explicit clinician confirmation event exists in the immutable audit chain scoped to this `action_id` prior to the transition, (3) the confirming actor holds a role authorized to sign for the action class under RBAC v1.1 / I-012. State machine: `ai_recommended` → `human_confirmed` → `executed`.

**Cross-reference:** AUTONOMY_LEVELS §2.3; Master PRD §13.7 (normative source of truth); INVARIANTS contract v5.1 I-012; RBAC v1.1.

### action_with_audit_only

**Definition:** Reserved autonomy level: AI executes the action; human reviews after-the-fact via audit. No pre-execution confirm. **RESERVED — requires ADR-030 (Tiered Autonomy Progression Model) + PolicyAuthorization framework + I-012 successor invariant + dedicated safety case + Clinical Safety Officer + Privacy Officer + Regulatory Affairs Lead sign-off + per-market regulatory clearance.** Per Master PRD §13.7, this level cannot reach `executed` for I-012 actions until a successor ADR (ADR-030 or later) explicitly supersedes I-012 for the action class in scope AND an activation audit event recording the supersession is present in the immutable audit chain. ADR approval alone is never sufficient. Not active at v1.0.

**Cross-reference:** AUTONOMY_LEVELS §3.1; reserved ADR-030; Master PRD §13.7.

### fully_autonomous

**Definition:** Reserved autonomy level: AI executes the action without per-action human review (audit chain still mandatory; platform-floor safety gates always apply). **RESERVED — activation prerequisites are a strict superset of `action_with_audit_only`**: all `action_with_audit_only` prerequisites PLUS (a) augmented safety case demonstrating residual-risk acceptability without per-action human gating, (b) per-market regulatory clearance specific to fully-autonomous operation (cannot inherit `action_with_audit_only` clearance), (c) Clinical Safety Officer + Privacy Officer + Regulatory Affairs Lead **triple sign-off** at activation and on every material change, (d) named successor invariant superseding I-012 for the action class in scope, (e) any additional gates established by ADR-030 successors. No platform code path may resolve `fully_autonomous` to an executed clinical action until all prerequisites are recorded as satisfied in the activation audit event. Not active at v1.0.

**Cross-reference:** AUTONOMY_LEVELS §3.2; reserved ADR-030; Master PRD §13.7.

### policy_authorization

**Definition:** Reserved primitive (PolicyAuthorization entity) representing an explicit autonomy grant per (`workload_type` × `action_type` × `tenant` × `market` × `protocol` × `autonomy_level`). Required for autonomy levels that explicitly require it (`action_with_audit_only`, `fully_autonomous`; NOT `advisory` / `suggestion` / `action_with_confirm` at v1.0). Each grant has `approval_chain`, `effective_from`, `expires`, `evidence_locker_ref`, `rollback_trigger`. Architecture defined under ADR-029; activation under ADR-030 + GOVERNANCE_CONTROLS contract.

**Cross-reference:** AUTONOMY_LEVELS §5; ADR-029; reserved ADR-030; GOVERNANCE_CONTROLS contract v5.1; Master PRD §13.7.

### agent_identity

**Definition:** Reserved primitive distinguishing agent actor from human actor in audit and RBAC. Reserved fields in audit envelope: `agent_id`, `agent_version`. Populates only when an agentic workload type activates (`autonomous_agent`, `multi_agent_supervisor`, `tool_using_agent`). At v1.0: nullable, never populated; reserved for forward-compat per §13.7 audit envelope nullability rule.

**Cross-reference:** AUDIT_EVENTS contract v5.1; ADR-029; reserved ADR-030, ADR-031; Master PRD §13.7.

### knowledge_source_registry

**Definition:** Reserved registry of approved AI knowledge bases with version pinning. Tightens current AI-LAYERING I-004 ("approved knowledge sources only") with explicit registry, citation requirements, retrieval audit, staleness handling, and per-AIExecution version pinning via `knowledge_source_versions[]` audit field. **RESERVED — requires ADR-034 (Knowledge Source Registry).** Reserved fields exist in audit envelope at v1.0 per §13.7; registry implementation deferred.

**Cross-reference:** AUDIT_EVENTS contract v5.1 (`knowledge_source_versions[]` field); reserved ADR-034; Master PRD §13.7.

### supervising_policy

**Definition:** Reserved reference linking an autonomous action to its authorizing PolicyAuthorization. Audit envelope field `supervising_policy_id` (nullable; reserved). Populates only for autonomy levels requiring PolicyAuthorization (`action_with_audit_only`, `fully_autonomous`). At v1.0: nullable, never populated.

**Cross-reference:** AUDIT_EVENTS contract v5.1; AUTONOMY_LEVELS §3.1, §3.2; reserved ADR-030; Master PRD §13.7.

---

## Document control

- **v1.0 RECONCILED — 2026-05-01** — Phase 2.X reconciliation against canonical Master PRD v1.10 §13.2 / §13.7 / §15.3 + ADR-027 v0.5 / ADR-028 v0.4 / ADR-029 v0.3. Supersedes Phase1_Glossary_Drafts_DRAFT.md v1.0. 13 substantive edits across C4 (3), C5 (5), C7 (5); C1 + C3 unchanged. Open questions from draft v1.0 resolved as follows: (a) Posture A/B definition includes Posture B enumerated examples — yes (canonical §15.3 enumerates them explicitly in this terminology). (b) Working definition of "molecule-level marketing" goes in glossary cross-reference, not in glossary body — yes (§13.2 working definition is canonical; glossary cross-references it). (c) Reserved-future terms scoped as glossary entries — yes (with explicit RESERVED status; reviewers encounter the names in audit envelope).
- **Status:** RECONCILED — proposed final F13 contribution. Awaiting audit-B sign-off (Product Lead + Marketing Lead + Legal). Lands in `Telecheck_Contracts_Pack_v5_00_GLOSSARY.md` at Phase 5 Contracts Pack edits.
- **Phase 2.X exit criterion:** This file's reconciliation review by Codex (Phase 2.X mid-cycle fire) returns no HIGH/MEDIUM, AND the F13 matrix rows (4, 18, 53, 67) move from "Edited" → "Approved" in the traceability matrix.
- **Cross-reference:** F13 Glossary contract (`Telecheck_Contracts_Pack_v5_00_GLOSSARY.md`) — Phase 5 landing place.
