# Phase 1 Glossary Drafts — F13 entries for v1.10 cycle

**Version:** 1.0 DRAFT
**Date:** 2026-04-30
**Owner:** Evans (workstream lead) + Marketing Lead + Legal (for terminology)
**Purpose:** Draft glossary entries for the F13 Glossary contract (Telecheck_Contracts_Pack_v5_00_GLOSSARY.md) covering all v1.10 cycle vocabulary additions across C1, C3, C4, C5, C7. **Status: drafts only — parked at "Edited" status in matrix per planning freeze v1.3 Phase 1 ordering rule. Final approval moves to Phase 2.X reconciliation step after Master PRD canonical text exists.**

**Total terms:** 37 (1 from C1 + 8 from C3 + 4 from C4 + 10 from C5 + 14 from C7)

**Why drafts only at Phase 1:** Many definitions reference Master PRD language that becomes canonical only at Phase 2. Approving terms in Phase 1 against pre-canonical PRD wording forces re-approval the moment Phase 2 lands. Drafts park at "Edited" status; Phase 2.X reconciles and approves.

---

## C1 — §21 Non-goals regulatory-conditional rewrite

### Future Release marker

**Definition:** A non-goal entry marker indicating that the item is not in scope for the current release but has a documented activation path or regulatory pathway that may bring it into scope in a future release. Distinguishes regulatory-conditional non-goals (could activate under different posture) from absolute non-goals (will not activate). Used in Master PRD §21 alongside three-axis classification (Regulatory · Architecture · Activation).

**Distinguishes from:** "Phase 2/3+" roadmap language (Phase 2/3+ describes timing-bound items already on the roadmap; Future Release marker describes items that may or may not get on the roadmap depending on regulatory/strategic conditions).

**Cross-reference:** Master PRD §21 (Non-goals); Master PRD §19 (Roadmap beyond launch).

---

## C3 — Brand structure + tenant identifier rename

### Telecheck

**Definition:** Parent company / platform brand / B2B mark. Anchors WHO/UN partnerships, regulatory engagement at the multilateral level, and platform-as-a-service business line. **Never the consumer mark** in any market. Per planning freeze §2.1 brand-structure framing locked 2026-04-28.

**Cross-reference:** Master PRD §1 Strategic differentiation; Master PRD §18 Business model.

### Heros Health

**Definition:** Global consumer DBA (doing-business-as) for all Telecheck-operated DTC. Country-instanced via subdomains: heroshealth.com (US), ghana.heroshealth.com, nigeria.heroshealth.com (future), kenya.heroshealth.com (future), etc. The unified consumer app is "Telecheck Heros." **Heros Health is a DBA, not a separate legal entity.** No "Heros Health Inc."

**Cross-reference:** Master PRD §1; Master PRD §18.3 Telecheck-US operating business.

### Telecheck-{country}

**Definition:** Uniform tenant identifier convention for Telecheck-operated DTC tenants. Each country instance is a separately incorporated subsidiary. Examples: Telecheck-US (operated by Telecheck Health LLC; trades as Heros Health), Telecheck-Ghana (operated by Telecheck-Ghana Ltd.; trades as Heros Health Ghana), Telecheck-Nigeria (future), Telecheck-Kenya (future).

**Cross-reference:** Master PRD §2 Tenant table.

### separately incorporated subsidiary

**Definition:** Each per-country operating tenant is a separately incorporated subsidiary of Telecheck-the-parent, holding its own regulatory entity registration, banking, payment-processor account, and local employer-of-record arrangements. Distinct from the platform tenant identifier (which is logical) and the consumer brand (which is a DBA).

**Cross-reference:** Master PRD §2; Master PRD §18; ADR-023 multi-tenancy.

### Telecheck Health LLC

**Definition:** US legal entity operating the Telecheck-US tenant. Trades patient-facing as Heros Health at heroshealth.com.

**Cross-reference:** Master PRD §2; Master PRD §18.3.

### Telecheck-Ghana Ltd.

**Definition:** Ghana legal entity operating the Telecheck-Ghana tenant. Trades patient-facing as Heros Health Ghana at ghana.heroshealth.com.

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

**Definition:** Marketing copy that names a specific medication (active pharmaceutical ingredient or branded product). E.g., naming semaglutide, naming Ozempic, naming sildenafil. Subject to per-country regulatory posture per ADR-027 and CCR `molecule_level_marketing_permitted` key. In v1.0 active markets: prohibited in US, conditional in Ghana (per regulatory engagement + governance review).

**Cross-reference:** ADR-027; Master PRD §7.9 (Harm-reduction marketing posture); Master PRD §13.6 (Marketing copy governance).

### program-level marketing

**Definition:** Marketing copy that names a clinical program or category without naming a specific medication. E.g., "GLP-1 weight management program," "ED program," "diabetes RPM program." Distinguishable from molecule-level marketing in that it does not require regulatory engagement under DTC drug-marketing rules. Subject to standard marketing review (not §13.6 governance review).

**Distinguishes from:** molecule-level marketing.

**Working definition open question:** Master PRD §25 — exact line between program-level and molecule-level needs working definition once first emerging-market marketing copy is reviewed.

**Cross-reference:** ADR-027; Master PRD §7.9; Master PRD §25 (Open questions).

### harm-reduction marketing posture

**Definition:** Operational principle (Master PRD §7.9) stating that emerging-market tenants, where regulatory posture permits, may operate molecule-level marketing surfaces under the platform's safety floor (interaction engine, herb-drug, fake-med, clinician sign-off, audit trail). The marketing surfaces direct patients into the platform's mediated pathway, reducing harm relative to the counterfactual (unmediated pharmacy purchase).

**Cross-reference:** ADR-027; Master PRD §7.9; Master PRD §21 (Non-goals — country-conditional rewrite).

### marketing copy governance review

**Definition:** Operator-side governance review apparatus (Master PRD §13.6) that approves molecule-level marketing copy before publication. Review cadence configured per tenant via CCR `marketing_governance_review_cadence_months`. Triple-sign-off: Marketing copy governance lead + Clinical Safety Officer + Regulatory Affairs Lead. Same cadence-class as guardrail templates and clinical protocols.

**Cross-reference:** Master PRD §13.6; ADR-027; Master PRD §24 row 16 (Marketing copy governance lead designation pre-launch decision).

---

## C5 — Research data partnership Posture A

### research data partnership

**Definition:** Strategic relationship with a multilateral body (WHO, UN agency, or analogous), academic research consortium, or population-health authority where Telecheck-the-parent provides de-identified longitudinal data under a Data Sharing Agreement (DSA). Patient consent at the operating-tenant level (5th consent tier); data flows through Telecheck parent governance for partnership use. **Anchored at parent level, not at consumer brand level.** Distinct from trial-execution platform (Posture B; remains absolute non-goal).

**Cross-reference:** ADR-028; Master PRD §X NEW (Research Data Governance); Master PRD §7.10 (Research data accessibility).

### Posture A / Posture B

**Definition:**
- **Posture A — Research data partner / population observatory.** De-identified longitudinal data export under DSAs to research partners. Aggregation layer for population-level statistics. **In scope as Release 2 goal** per ADR-028.
- **Posture B — Trial execution platform.** eCRF-style data collection, IRB-managed protocols, sponsor reporting, randomization, blinding, query resolution, IND/IDE filings, monitoring visits. **Remains absolute non-goal** per ADR-028.

The Posture A / Posture B boundary is bright-line. If a proposed feature crosses into Posture B, it requires a separate ADR superseding the relevant scope language in ADR-028.

**Cross-reference:** ADR-028; Master PRD §X NEW; Master PRD §21.

### data-sharing agreement (DSA)

**Definition:** Legal instrument authorizing a research partner to receive de-identified data exports from Telecheck under defined scope, duration, de-identification standard, k-anonymity threshold, consent provenance, audit posture, retention rules, and partner obligations. Each DSA has its own activation gate and audit trail per I-024 / I-026. DSA template is legal-reviewed pre-launch (Master PRD §24 row 13).

**Cross-reference:** ADR-028; INVARIANTS contract v5.1 I-024, I-026; Master PRD §24 row 13.

### de-identification engine

**Definition:** Platform component that transforms patient-level clinical records into de-identified records meeting the chosen de-identification standard (Safe Harbor + k-anonymity per default). Implemented as part of the research data export module in System Architecture v1.2. Activated at Release 2 per ADR-028.

**Cross-reference:** ADR-028; System Architecture v1.2; Master PRD §24 row 14.

### Safe Harbor de-identification

**Definition:** HIPAA Safe Harbor de-identification standard: removal of 18 specified identifier categories. Combined with k-anonymity threshold for additional protection against re-identification under combination-attack risk. Default standard per planning freeze §3.1 CCR `de_identification_standard` enum value.

**Cross-reference:** ADR-028; CCR Runtime contract.

### k-anonymity

**Definition:** A re-identification protection standard requiring that any combination of quasi-identifying attributes in the released dataset matches at least k records (e.g., k=5 means at least 5 records share each combination of quasi-identifiers). Threshold value (k) is a deployment parameter; specific value chosen at de-identification engine implementation per Master PRD §24 row 14.

**Cross-reference:** ADR-028; INVARIANTS contract v5.1 I-024.

### cohort definition layer

**Definition:** Platform component where research partners specify inclusion/exclusion criteria; platform produces a matching de-identified cohort. Feeds the de-identification engine and aggregation layer. Each cohort definition is recorded with `research.cohort_defined` audit event per AUDIT_EVENTS v5.1.

**Cross-reference:** ADR-028; System Architecture v1.2; AUDIT_EVENTS contract v5.1.

### aggregation layer

**Definition:** Platform component that produces population-level statistics (counts, distributions, longitudinal trends) without exposing patient-level data. Used for population-health programs (NCD surveillance, chronic disease registries) where aggregate flow is sufficient.

**Cross-reference:** ADR-028; System Architecture v1.2.

### research ethics committee (REC)

**Definition:** External oversight body that reviews and approves research data partnership activations under ethics review. Ghana: Ghana Health Service (GHS) REC or Noguchi Memorial Institute IRB (alternative candidates). Future markets: analogous bodies. Designated pre-launch per Master PRD §24 row 11. Engaged at per-country activation gate.

**Cross-reference:** ADR-028; Master PRD §24 row 11; Master PRD §22 (Dependencies).

### population observatory

**Definition:** Posture A framing of Telecheck's research data partnership role: an observation platform for population-level chronic-disease data flows, not a trial-execution platform. Distinguishes the platform's research role from interventional research (Posture B; non-goal).

**Cross-reference:** ADR-028; Master PRD §7.10.

---

## C7 — AI workload taxonomy + autonomy levels

### AI workload type

**Definition:** Discriminator (`ai_workload_type`) for AI workload kinds. Replaces the binary "AI Mode 1 / AI Mode 2" framing of AI-LAYERING with an extensible taxonomy. Values defined exclusively in WORKLOAD_TAXONOMY contract; activation of reserved values requires successor ADR per ADR-029. Carries four orthogonal properties: autonomy_level, tool_access, memory_scope, governance_class.

**Cross-reference:** WORKLOAD_TAXONOMY contract; ADR-029; AI-LAYERING contract v5.1.

### conversational_assistant

**Definition:** AI workload type for patient-facing chat with guardrails. Cannot make clinical decisions. Successor to AI-LAYERING Mode 1; identical semantics, relabeled. Active at v1.0. Properties: autonomy_level_range = [advisory]; tool_access = [internal_kb_lookup]; memory_scope = [session]; governance_class = floor_safety.

**Cross-reference:** WORKLOAD_TAXONOMY §2.1; AI-LAYERING contract.

### protocol_execution

**Definition:** AI workload type for async clinical preparation engine operating within named, versioned protocols. Successor to AI-LAYERING Mode 2; identical semantics, relabeled. Active at v1.0 with autonomy_level capped at action_with_confirm (physician review required per I-012). Properties: autonomy_level_range = [advisory, suggestion, action_with_confirm] (active); action_with_audit_only reserved; tool_access = [protocol_kb, lab_lookup, formulary_lookup, interaction_engine]; memory_scope = [patient_episode, program_history]; governance_class = protocol_authorized.

**Cross-reference:** WORKLOAD_TAXONOMY §2.2; AI-LAYERING contract; ADR-005 protocolized autonomy.

### autonomous_agent

**Definition:** Reserved AI workload type for open-ended multi-step clinical agent that reasons across patient history, labs, medications, and prior actions. Not bounded to a single named protocol. **RESERVED — requires ADR-030 (Tiered Autonomy Progression Model) plus AGENT_MEMORY contract (ADR-032) plus PolicyAuthorization framework activation.** Not implemented at v1.0.

**Cross-reference:** WORKLOAD_TAXONOMY §3.1; ADR-029; reserved ADR-030, ADR-032.

### autonomy_level

**Definition:** Orthogonal property of an AI workload describing the degree of autonomous action authority. Five values per AUTONOMY_LEVELS contract: advisory, suggestion, action_with_confirm (active at v1.0); action_with_audit_only, fully_autonomous (reserved). Per-action validation enforces (workload_type × autonomy_level) compatibility per WORKLOAD_TAXONOMY autonomy_level_range.

**Cross-reference:** AUTONOMY_LEVELS contract; WORKLOAD_TAXONOMY contract; ADR-029.

### advisory

**Definition:** Autonomy level: AI provides information only. No action authority. Patient or clinician interprets and decides. Active at v1.0 for both conversational_assistant and protocol_execution workloads. State machine terminates at ai_recommended or ai_information_provided; no action transition.

**Cross-reference:** AUTONOMY_LEVELS §2.1.

### suggestion

**Definition:** Autonomy level: AI proposes an action. Human selects from options or rejects. AI does not execute. Active at v1.0 for protocol_execution (rare; non-default). Boundary: cannot satisfy I-012 prescription/refill/medication-order execution requirement (selection of options is a pre-action proposal step, not the prescription execution itself).

**Cross-reference:** AUTONOMY_LEVELS §2.2.

### action_with_confirm

**Definition:** Autonomy level: AI proposes a specific action. Human confirms before execution. AI does not execute without confirm. Active at v1.0 default for protocol_execution Mode 2. I-012 binds: every prescription/refill/medication-order decision flows through this level. State machine: ai_recommended → human_confirmed → executed.

**Cross-reference:** AUTONOMY_LEVELS §2.3; INVARIANTS contract v5.1 I-012.

### action_with_audit_only

**Definition:** Reserved autonomy level: AI executes the action. Human reviews after-the-fact via audit. No pre-execution confirm. **RESERVED — requires ADR-030 + PolicyAuthorization framework + I-012 successor invariant + per-(workload × action × protocol) safety case.** Not active at v1.0.

**Cross-reference:** AUTONOMY_LEVELS §3.1; reserved ADR-030.

### fully_autonomous

**Definition:** Reserved autonomy level: AI executes the action without human review (subject to platform-floor safety gates). **RESERVED — requires all action_with_audit_only preconditions PLUS long safety track record, triple sign-off, per-market regulatory clearance.** Not active at v1.0.

**Cross-reference:** AUTONOMY_LEVELS §3.2; reserved ADR-030.

### policy_authorization

**Definition:** Reserved primitive (PolicyAuthorization entity) representing an explicit autonomy grant per (workload_type × action_type × tenant × market × protocol × autonomy_level). Required for autonomy_levels that explicitly require it (action_with_audit_only, fully_autonomous; NOT advisory/suggestion/action_with_confirm at v1.0). Each grant has approval_chain, effective_from, expires, evidence_locker_ref, rollback_trigger. Architecture defined under ADR-029; activation under ADR-030 + GOVERNANCE_CONTROLS contract.

**Cross-reference:** AUTONOMY_LEVELS §5; ADR-029; reserved ADR-030; GOVERNANCE_CONTROLS contract v5.1.

### agent_identity

**Definition:** Reserved primitive distinguishing agent actor from human actor in audit and RBAC. Reserved fields in audit envelope: agent_id, agent_version. Populates only when an agentic workload type activates (autonomous_agent, multi_agent_supervisor, tool_using_agent). At v1.0: nullable, never populated; reserved for forward-compat per audit envelope nullability rule.

**Cross-reference:** AUDIT_EVENTS contract v5.1; ADR-029; reserved ADR-030, ADR-031.

### knowledge_source_registry

**Definition:** Reserved registry of approved AI knowledge bases with version pinning. Tightens current AI-LAYERING I-004 ("approved knowledge sources only") with explicit registry, citation requirements, retrieval audit, staleness handling, and per-AIExecution version pinning via knowledge_source_versions[] audit field. **RESERVED — requires ADR-034 (Knowledge Source Registry).** Reserved fields exist in audit envelope at v1.0; registry implementation deferred.

**Cross-reference:** AUDIT_EVENTS contract v5.1 (knowledge_source_versions[] field); reserved ADR-034.

### supervising_policy

**Definition:** Reserved reference linking an autonomous action to its authorizing PolicyAuthorization. Audit envelope field `supervising_policy_id` (nullable; reserved). Populates only for autonomy_levels requiring PolicyAuthorization (action_with_audit_only, fully_autonomous). At v1.0: nullable, never populated.

**Cross-reference:** AUDIT_EVENTS contract v5.1; AUTONOMY_LEVELS §3.1, §3.2; reserved ADR-030.

---

## Document control

- **v1.0 DRAFT — 2026-04-30** — Initial drafts authored as Phase 1 prep per Evans's directive 2026-04-30 (parallel-track to Phase 0 walk). 37 terms covering C1, C3, C4, C5, C7 cycle vocabulary additions. Park at "Edited" status in matrix per planning freeze v1.3 Phase 1 ordering rule.
- **Status:** DRAFT — not approved. Final approval moves to Phase 2.X reconciliation step after Master PRD canonical text exists.
- **Approval owner:** Product Lead + Marketing Lead + Legal (audit-B; sign-off recommended at Phase 2.X exit).
- **Open questions:**
  - Should Posture A / Posture B definition include enumerated examples of features in each? (Working answer: yes — the bright-line is part of the definition; examples in ADR-028 §Posture A scope can be referenced.)
  - Does the working definition of "molecule-level marketing" need to be in the glossary (vs. parked as Master PRD §25 open question)? (Working answer: not at v1.0; parked. Add to glossary once first emerging-market marketing copy is reviewed.)
  - Are reserved-future terms (autonomous_agent, action_with_audit_only, fully_autonomous, policy_authorization, agent_identity, supervising_policy, knowledge_source_registry) correctly scoped as glossary entries, or should they live only in their reserving contracts? (Working answer: include in glossary with explicit RESERVED status. Reviewers will encounter the names in audit envelope and reserved-future tables; glossary entry prevents misinterpretation.)

**Cross-reference:** F13 Glossary contract (Telecheck_Contracts_Pack_v5_00_GLOSSARY.md) — final landing place after Phase 2.X approval.
