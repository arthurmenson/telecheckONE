# 00 · Market Launch

**Status:** canonical · **Version:** 5.1 · **Owner:** market operations lead + regulatory lead · **Consumers:** all program activation, all patient-facing surfaces

This document defines the Market Launch governance model — the sole authority for whether a program is available in a market. Per I-020, no other system overrides Market Launch's offerability decisions.

---

## Core principle

**Market Launch is the sole offerability authority.** Forms Engine, AI Layering, and Protocol Pack market lists are compatibility constraints, not offerability decisions. If Market Launch says "not available," the program is not available regardless of what other systems say.

---

## ProgramMarketPolicy

The canonical record for a program's availability in a market:

```
{
  "policy_id":          "pmp_<ULID>",
  "program_id":         "<program>",
  "market_code":        "<country_of_care>",
  "status":             "draft | pending_approval | approved | live | paused | retired",
  "launch_gates":       { <gate statuses> },
  "required_form_version": "frv_<ULID>",
  "required_protocol_version": "prt_<ULID>" | null,
  "required_agent_version": "agt_<ULID>" | null,
  "pricing_bundle_id":  "prb_<ULID>",
  "approved_by":        "<operator_id>",
  "approved_at":        "<ISO 8601>",
  "pause_reason":       null | { "code": "...", "detail": "..." },
  "retire_reason":      null | { "code": "...", "detail": "..." }
}
```

---

## Seven launch gates

A program must pass all seven gates before going live in a market:

| Gate | What it verifies | Approver |
|---|---|---|
| **Regulatory** | Regulatory clearance for this program in this market (pharmacy council, medical council, FDA equivalent) | Regulatory & Partner Affairs Lead |
| **Clinical** | Protocol library approved, clinician panel staffed, clinical safety review complete | Clinical Governance Lead |
| **Technical** | Required form version published, interaction engine coverage verified, notification channels configured | Engineering Lead |
| **Operational** | Pharmacy partners onboarded (or platform pharmacy ready), delivery partner contracted, support team briefed | Operations Lead |
| **Financial** | Pricing bundle configured, payment rails tested, unit economics reviewed | Finance Lead |
| **Legal** | Terms of service localized, consent copy reviewed, data processing agreements signed | Legal Lead |
| **Executive** | Final go/no-go sign-off | Country Launch Director |

All gates must be `approved` for the status to transition to `live`. Any gate can be `revoked` after approval, which forces the program back to `paused`.

---

## Status transitions

```
draft → pending_approval → approved → live → paused → live (resume)
                                          → retired
                                    paused → retired
```

### Pause

A program can be paused by any gate owner or the Country Launch Director. Pause takes effect immediately. Active patients in the program receive notification: "This program is temporarily paused. Your care team will contact you about next steps."

**Pause obligations:**
- Patients with active prescriptions continue to receive refills for the bridge period
- In-progress consultations complete
- Scheduled appointments are honored or rescheduled
- The platform does not accept new enrollments

If a pause exceeds a configurable hold duration (recommend 30 days), it auto-escalates to the Country Launch Director for retire-or-resume decision.

### Retire

Retirement is permanent for the current market activation. A retired program can be re-launched only through a new ProgramMarketPolicy with fresh gate approvals. Retire obligations include all pause obligations plus a sunset plan for existing patients (transfer to alternative programs or graceful exit with bridge supply).

---

## Compatibility checks (not offerability)

After Market Launch confirms a program is offerable, compatibility checks verify that the required infrastructure exists:

| Check | What it verifies |
|---|---|
| Form version | The required `intake_form_version_id` is published and not archived |
| Protocol version | The required protocol version is active and has a named accountable clinician |
| Agent version | The required AI agent version (guardrail template for Mode 1, protocol config for Mode 2) is deployed |
| Pricing bundle | The pricing bundle is configured for this market with valid payment rails |

**Missing compatibility is a deployment defect** — it pages on-call and shows the patient "we're temporarily unable to offer this; we've notified our team." It does not silently block the patient.

---

## Market Pack

Each market is represented as a structured Market Pack — a versioned container of:
- ProgramMarketPolicies for all programs in the market
- Protocol library assignments
- Formulary scope
- Guardrail template assignments
- Moderation policy configuration
- Partner relationships
- Evidence artifacts (regulatory approvals, clinical safety reviews)
- Rollout state

The Market Pack is managed through the Market Rollout Cockpit (Admin — Market Rollout Cockpit Slice PRD).

---

## Cross-reference to Master PRD §10.5 (added v5.1)

**Program catalog architecture cross-reference.** ProgramMarketPolicy (this contract's central entity) is one of the four layers in Master PRD v1.10 §10.5's program catalog architecture, alongside Program (platform-level catalog entry), Forms Engine four-layer instantiation, and CCR Runtime resolution. §10.5 makes the relationship explicit:

- **Program** — platform-defined catalog entry per ProgramCatalogEntry type (TYPES v5.2). Defines clinical template, default protocol, default guardrail, intended market classes.
- **ProgramMarketPolicy** — per-(tenant, country) instantiation of a Program. Defines per-market overrides: formulary, protocol selection, eligibility, pricing, approval pathway, marketing classification per CCR `molecule_level_marketing_permitted`.
- **Forms Engine instantiation** — Pattern A immutable per-market form version per FORMS_ENGINE v5.2.
- **CCR Runtime** — country-specific runtime resolution per CCR_RUNTIME v5.2.

MARKET_LAUNCH governs the activation gate that brings a (Program, country) pair to live status. It does not redefine ProgramMarketPolicy — it is the entity's lifecycle authority.

---

## Marketing posture activation gate (added v5.1 per ADR-027)

For any (Program, country) pair where the program involves prescription medication and the country supports molecule-level marketing per CCR `molecule_level_marketing_permitted = permitted`, the activation gate MUST verify ALL of:

1. The CCR `marketing_copy_governance_evidence` structured object (per CCR_RUNTIME v5.2 marketing block) is fully populated with all required sub-fields per ADR-027 / Master PRD §13.2 (regulatory_jurisdiction, regulatory_authority, regulatory_interpretation_artifact_id, interpretation_date, scope, prohibited_claim_classes, governance_lead_designation_artifact_id; ethics_review_concurrence_artifact_id where local jurisdiction requires).
2. **Tier-2 regulatory evidence** present for the country where applicable: e.g., for Telecheck-Ghana, Pharmacy Council guidance review artifact and Ghana FDA interpretation artifact are referenced from `regulatory_interpretation_artifact_id`. For other future markets, the analogous regulatory body's interpretation/clearance artifact MUST be present. (Country-specific Tier-2 evidence requirements drive from regulatory_authority; the governance review classifies as `protocol_authorized` per workload taxonomy §13.7.)
3. At least one approved `MarketingCopy` (per TYPES v5.2) for that program × country pair exists, classification = `molecule_level`, `status = approved`, and `approval_validity_until >= now`. The copy's governance review reference resolves to the §13.2 Governance review process artifact.
4. The Marketing copy governance lead, Clinical Safety Officer, and Regulatory Affairs Lead triple sign-off per ADR-027 v0.5 is recorded in the activation audit chain.
5. **Country Launch Director activation sign-off** per Market Launch contract (separate from triple sign-off; Country Launch Director owns per-country launch authority and authorizes the activation transition per the standard MARKET_LAUNCH lifecycle).
6. AUDIT_EVENTS v5.2 `marketing.surface_rendered` and `marketing.surface_drift` event emission paths are operational (governance review reference + approval timestamp + approval validity until populated; drift detector active; auto-suspension wiring per Master PRD §13.2).

If ANY condition is unmet, the activation gate REJECTS the launch for that (Program, country) pair. This rejection is independent of (and additional to) all other Market Launch gate criteria. A failed activation attempt produces a Category B audit record naming the failed condition.

---

## Research data partnership activation gate (added v5.1 per ADR-028)

When a country's CCR `research_data_partnership_active` transitions from `consent_only` to `active`, the activation gate MUST verify ALL of:

1. CCR `research_ethics_review_body` is populated and `approval_validity_to >= now`.
2. CCR `research_permitted_data_domains` is non-empty (at least one closed-enum domain selected for the country) and is a subset of the closed enum (`chronic_disease_longitudinal | ncd_surveillance | pharmacovigilance_signal | population_health_aggregate`) — per ADR-028 Decision §6, expansion of the enum requires ADR amendment.
3. CCR `cross_border_research_transfer_permitted` is set with appropriate companion evidence per `cross_border_research_transfer_evidence` structured object (counsel artifact ID, transfer mechanism, recipient country, onward transfer policy, DSA alignment artifact ID — all populated where the enum value requires).
4. At least one DataSharingAgreement (per TYPES v5.2) is in `active` status with `validity_to >= now`, partner organization registered, AND `permitted_data_domains` (per DSA) is a subset of CCR `research_permitted_data_domains` (DSA cannot exceed country domain scope).
5. DSA `k_min_required` ≥ CCR `k_min_default` (per-DSA may require higher k_min; never lower per I-029).
6. **5th consent tier deployment verified:** the research data-use consent text version per CCR `research_ethics_review_body.approval_reference_id` is populated, ethics-reviewed, and rendered to live patient-facing intake/care surfaces. Forms Engine static analysis at form-version-publish time has confirmed I-030 compliance for all forms in the country (per FORMS_ENGINE v5.2 enforcement).
7. **De-identification engine readiness verified:** the export pipeline implementation (cohort definition layer, de-identification engine producing Safe Harbor + k-anonymity output, aggregation layer, DSA enforcement) is deployed and operational in this country's tenant deployment per ADR-028 Decision §3 / Master PRD §15.3 4-layer pipeline.
8. **Audit pipeline at high_pii sensitivity verified:** AUDIT_EVENTS v5.2 `audit_sensitivity_level = high_pii` retention/access discipline is operational for `research.export_*` event family; storage tier and access controls match per I-031.
9. Per ADR-028 v0.4 quad sign-off: Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer + Product Lead is recorded in the activation audit chain.
10. REC concurrence per `research_ethics_review_body.per_dsa_review_required` if applicable.
11. Country Launch Director activation sign-off per Market Launch contract (separate from the quad sign-off; Country Launch Director owns the per-country launch authority).

If ANY condition is unmet, the activation gate REJECTS the transition. The country remains in `consent_only` state (5th consent tier active; no exports). A failed activation attempt produces a Category B audit record naming the failed condition.

---

## Document control

- **v5.0** — Initial Market Launch contract.
- **v5.1 (2026-05-02 per v1.10.1 hygiene cycle physical merge of v1.10 PRD Update Cycle delta artifact `Phase3_Group3_Contracts_v1_10_Edits_2026-05-01.md` §MARKET_LAUNCH)** — Adds Cross-reference to Master PRD §10.5 program catalog architecture (Program → ProgramMarketPolicy → Forms Engine instantiation → CCR Runtime resolution four-layer composition). Adds Marketing posture activation gate per ADR-027 (6 conditions including Tier-2 regulatory evidence, Country Launch Director activation sign-off, AUDIT_EVENTS v5.2 marketing surface event emission paths operational). Adds Research data partnership activation gate per ADR-028 (11 conditions including REC partnership designation, closed-enum `research_permitted_data_domains` country gate, DSA permitted-domain subset check, k_min_required ≥ k_min_default, 5th consent tier deployment verification with Forms Engine I-030 compliance, de-identification engine readiness, audit pipeline at high_pii sensitivity verified, ADR-028 quad sign-off, REC concurrence, Country Launch Director sign-off). Per ADR-027 + ADR-028 + Master PRD v1.10 §10.5 + §13.2 + §15.3 + INVARIANTS v5.2 I-029 / I-030 / I-031 + AUDIT_EVENTS v5.2 + FORMS_ENGINE v5.2 + CCR_RUNTIME v5.2 + TYPES v5.2 (MarketingCopy / DataSharingAgreement / ProgramCatalogEntry). Existing ProgramMarketPolicy entity, Seven launch gates, Status transitions, Compatibility checks, and Market Pack sections preserved without modification. v5.1 is purely additive.
