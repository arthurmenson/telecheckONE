# Phase 1 — F02 ADR Set Index Entries (DRAFT)

**Version:** 1.0 DRAFT
**Date:** 2026-05-01
**Owner:** Evans (workstream lead) + Engineering Lead (audit-B per I-015 pairing recommendation; pending stakeholder ratification per Phase0_Audit_B_Pairing_Ballot)
**Purpose:** Phase 1 deliverable for F02 row of the matrix — placeholder ADR Set index entries for ADR-027, ADR-028, and ADR-029 to be added to `Telecheck_ADR_Set_v1_0.md` (or its addendum). Per planning freeze v1.4 §3 Phase 1, ADR Set index points to ADRs that don't exist in the canonical spec bundle yet (placeholder status acceptable; ADRs land canonically when v1.10 promotes).

**Pre-staging note:** Phase 1 begins after Phase 0 exit. This artifact is pre-authored so it can be applied immediately on Phase 0 exit without authoring delay. No final approval here; status remains "Edited" / draft until Phase 1 walk applies it to the canonical Telecheck_ADR_Set_v1_0.md (or new addendum file) and Phase 1 exits.

---

## Index entries to add

These three index entries get appended to the ADR Set v1.0 supplementary index (or land in a new addendum file `Telecheck_ADR_Addendum_027_to_029.md` per the existing Addendum 016-019 + 020-025 + 026 convention).

### ADR-027 — Country-conditional DTC marketing posture

**Status (target on v1.10 promotion):** Accepted
**Owners:** Product Lead + Regulatory Affairs Lead + Clinical Safety Officer (triple-sign-off)
**Date (target on v1.10 promotion):** v1.10 promotion date
**Decision summary:** Replace Master PRD §21 absolute prohibition on DTC molecule-level marketing with a country-conditional posture governed by CCR `molecule_level_marketing_permitted` (3-state enum: prohibited / pending_evidence / permitted). US: prohibited per FDA + state telehealth advertising rules. Emerging markets: permitted under harm-reduction logic where the safety floor (interaction engine, herb-drug, fake-med, clinician sign-off) gates fulfillment. Per-country activation requires structured evidence (country regulatory contract, marketing copy governance review, marketing copy governance lead designation) and §13.2 Governance review process of first molecule-level copy.

**Supersedes (prospectively):** Master PRD §21 entry on "DTC prescription marketing" — specifically the C4/F01 matrix row that performs the canonical §21 rewrite.

**Companion ADRs:**
- ADR-005 (Protocolized autonomy) — safety floor unchanged
- ADR-024 (Country-driven configuration) — per-country policy mechanism

**Full text:** `Telecheck_ADR_027_Country_Conditional_DTC_Marketing.md` (drops _DRAFT suffix on v1.10 promotion; current **v0.6** draft at `Telecheck_v1_10_PRD_Update/Telecheck_ADR_027_Country_Conditional_DTC_Marketing_DRAFT.md` — Codex-verified Phase-4-ready after Phase 4 propagation pass 2026-05-01: §13.6 → §13.2 Governance review process; CCR Runtime v5.1 → v5.2 marketing block 4-key enumeration).

---

### ADR-028 — Research data partnership (Posture A) as Release 2 goal

**Status (target on v1.10 promotion):** Accepted
**Owners:** Product Lead + Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer (quad-sign-off)
**Date (target on v1.10 promotion):** v1.10 promotion date
**Decision summary:** Adopt Posture A (research data partnership / population observatory; in scope as Release 2 goal). Maintain Posture B (trial execution platform; absolute non-goal). Posture A scope: cohort definition layer, de-identified longitudinal data export under DSAs, aggregation layer for population-level statistics. Three-state activation model (`inactive` / `consent_only` / `active`) per CCR `research_data_partnership_active` enum. New invariants I-029, I-030, I-031 (renumbered from I-024/025/026 to avoid collision with existing canonical IDs per planning freeze v1.4 hotfix). k_min=11 default. Permitted data domains closed enum. Cross-border transfer governed by structured CCR fields. Anchored at Telecheck parent / platform level for WHO/UN partnerships.

**Supersedes (prospectively):** Master PRD §21 entry on "clinical research data collection" — Posture A removed from absolute non-goal list; Posture B remains absolute non-goal.

**Companion ADRs:**
- ADR-026 (Cross-border posture) — research-use transfer leg piggy-backs
- ADR-024 (Country-driven configuration) — per-country research_* CCR keys

**Full text:** `Telecheck_ADR_028_Research_Data_Partnership_Posture_A.md` (drops _DRAFT suffix on v1.10 promotion; current **v0.5** draft at `Telecheck_v1_10_PRD_Update/Telecheck_ADR_028_Research_Data_Partnership_Posture_A_DRAFT.md` — Codex-verified Phase-4-ready after Phase 4 propagation pass 2026-05-01: §X NEW → §15.3 (4 occurrences); contract version refs v5.1 → v5.2; C3 brand framing aligned).

---

### ADR-029 — AI Workload Taxonomy

**Status (target on v1.10 promotion):** Accepted
**Owners:** Product Lead + Engineering Lead + Clinical Safety Officer + Privacy Officer (quad-sign-off)
**Date (target on v1.10 promotion):** v1.10 promotion date
**Decision summary:** Replace binary AI Mode 1 / Mode 2 framing with property-based AI workload taxonomy (`ai_workload_type` discriminator + four orthogonal properties: autonomy_level, tool_access, memory_scope, governance_class). Mode 1 → conversational_assistant; Mode 2 → protocol_execution. Reserved future workload types (autonomous_agent, multi_agent_supervisor, tool_using_agent) are namespace placeholders requiring named successor ADRs (ADR-030, 031, 032, 033, 034) to activate. ADR-002 remains binding for current Mode 1/Mode 2 until separate successor; ADR-005 protocolized autonomy preserved at autonomy_level ≤ action_with_confirm; I-012 prescription sign-off preserved with explicit state machine validation.

**Supersedes (prospectively):** ADR-002 binary mode framing for new workload additions (does NOT retire ADR-002 for current Mode 1/Mode 2).

**Companion ADRs:**
- ADR-002 (binary AI mode) — remains binding for current workloads
- ADR-005 (protocolized autonomy) — remains binding for protocol_execution at autonomy_level ≤ action_with_confirm
- ADR-030 — DEFERRED — Tiered Autonomy Progression Model (required to activate reserved autonomy levels)
- ADR-031 — DEFERRED — Agent Tool Contract (required to activate tool_using_agent workload)
- ADR-032 — DEFERRED — Agent Memory Architecture (required to activate autonomous_agent workload)
- ADR-033 — DEFERRED — Multi-Agent Service Split (required to activate multi_agent_supervisor workload)
- ADR-034 — DEFERRED — Knowledge Source Registry (tightens tool_access / knowledge_source_versions enforcement)

**Full text:** `Telecheck_ADR_029_AI_Workload_Taxonomy.md` (drops _DRAFT suffix on v1.10 promotion; current **v0.4** draft at `Telecheck_v1_10_PRD_Update/Telecheck_ADR_029_AI_Workload_Taxonomy_DRAFT.md` — Codex-verified Phase-4-ready after Phase 4 propagation pass 2026-05-01: Contracts Pack v5.1 → v5.2; Master PRD §13 → §13.7 specificity; CDM AIExecution discriminator name canonical at `ai_workload_type`).

---

## Reserved future ADRs (placeholder entries for namespace reservation)

Per ADR-029 + planning freeze §4 New artifacts to author, the ADR Set index reserves the following future ADR identifiers. Each remains "RESERVED" in the index until its authoring ADR-029 cycle activates the corresponding workload type:

| ADR | Title | Status | Activation gate |
|---|---|---|---|
| ADR-030 | Tiered Autonomy Progression Model | RESERVED | Required to activate `action_with_audit_only` and `fully_autonomous` autonomy levels per AUTONOMY_LEVELS contract |
| ADR-031 | Agent Tool Contract | RESERVED | Required to activate `tool_using_agent` workload type per WORKLOAD_TAXONOMY contract |
| ADR-032 | Agent Memory Architecture | RESERVED | Required to activate `autonomous_agent` workload type |
| ADR-033 | Multi-Agent Service Split | RESERVED | Required to activate `multi_agent_supervisor` workload type |
| ADR-034 | Knowledge Source Registry | RESERVED | Tightens `tool_access` and `knowledge_source_versions` enforcement |

These are namespace reservations only — no architectural commitment beyond the reservation itself. Each becomes a real ADR in a future v1.11+ cycle as the platform progresses toward agentic capability.

---

## Document control

- **v1.0 DRAFT — 2026-05-01** — Phase 1 deliverable pre-staged during Phase 0 walk-staging per Evans's directive 2026-05-01 (Phase 1 begins immediately on Phase 0 exit). Status: "Edited" — applies on Phase 0 exit. Final approval at Phase 1 exit (1-day Phase 1 estimate per planning freeze §3).
- **v1.1 — 2026-05-01** — Phase 4 propagation update: ADR-027 reference bumped v0.5 → v0.6 (§13.6 cleanup + v5.2 propagation); ADR-028 reference bumped v0.4 → v0.5 (§15.3 + v5.2 + C3 brand); ADR-029 reference bumped v0.3 → v0.4 (Contracts Pack v5.2 + §13.7 specificity + ai_workload_type canonical). Decision summary text aligned with v1.10-canonical Master PRD §13.2 (no §13.6 references). All 3 ADRs Codex-verified Phase-4-ready post-propagation pass.
- **Status:** Phase 4 final approval ready. On promotion, this content lands in `Telecheck_ADR_Set_v1_0.md` supplementary index OR new addendum file `Telecheck_ADR_Addendum_027_to_029.md` (decision: addendum filename, matching existing convention of Addendum 016-019, 020-025, 026; landing decision deferred to Phase 1 walk or implicit per existing convention).
- **Approval owner:** Product Lead + Engineering Lead (audit-B per I-015 pairing rules). Async-ratified per Phase 0 ballot path 2026-05-01 (row 3 in matrix; the F02 row).
