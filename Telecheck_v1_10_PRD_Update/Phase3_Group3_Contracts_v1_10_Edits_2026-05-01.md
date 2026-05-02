# Phase 3 — Group 3 Contracts v1.10 edits (DOMAIN_EVENTS + FORMS_ENGINE + MARKET_LAUNCH + GOVERNANCE_CONTROLS)

**Version:** 1.0 RECONCILED — proposed delta to canonical v5.1 contracts
**Date:** 2026-05-01
**Reconciliation owner:** Workstream lead (Evans) via Claude proxy
**Approval owner (audit-B):** Engineering Lead + Product Lead + Privacy Officer (per I-015 dual-control); Clinical Safety Officer for FORMS_ENGINE clinical-impact rows.
**Purpose:** Reconcile v1.10 cycle additions for DOMAIN_EVENTS, FORMS_ENGINE, MARKET_LAUNCH, GOVERNANCE_CONTROLS against canonical Master PRD v1.10 §10.5 + §13.2 + §13.7 + §15.3 + ADRs 027 / 028 / 029 + group-1/group-2 contract deltas already approved.

**Note on ERROR_MODEL and IDEMPOTENCY:** No matrix rows targeting these contracts in v1.10 cycle. They are preserved from v5.1 unchanged. Their semantics (error envelope structure per I-025; idempotency keys per I-007) compose cleanly with the new research / marketing / workload-taxonomy events without requiring v5.2 edits.

---

## DOMAIN_EVENTS v1.10 additions (canonical v5.1 → v5.2)

Insert into the existing event catalog as new entries, retaining alphabetical / topical organization:

### New domain events (added v5.2 per ADR-028)

| Event name | Producer | Subscribers | Payload (key fields) | Notes |
|---|---|---|---|---|
| `research_consent.granted` | Consent module (5th-tier consent grant per Master PRD §15.2) | Audit pipeline (emits `research.consent_granted` per AUDIT_EVENTS v5.2 §5); Cohort definition module (eligible-patient-set update); Notifications module (no patient-facing notification; internal only) | consent_id, tenant_id, patient_id, **consent_type** (`research_data_use`), **scope**, **version_presented** (consent text version per CCR `research_ethics_review_body.approval_reference_id`), granted_at | Per I-016 immutable. Per I-030 MUST NOT cascade to any care-delivery event subscriber. Payload mirrors AUDIT_EVENTS v5.2 §5 `research.consent_granted` event fields. |
| `research_consent.revoked` | Consent module | Audit pipeline (`research.consent_revoked`); Cohort definition module (eligible-patient-set update — patient excluded from future cohorts; already-shared aggregate data not retracted per §15.2 asymmetry); Export pipeline (suspend any in-flight cohort that depends on this patient) | consent_id, tenant_id, patient_id, **consent_type** (`research_data_use`), **scope**, **version_presented**, revocation_reason, revoked_at, revocation_effective_at, **asymmetric_retraction_acknowledgment** (boolean — patient has acknowledged that aggregate data already shared cannot be retracted per §15.2) | Per I-016 immutable. Per I-030 MUST NOT cascade to any care-delivery event subscriber. Payload mirrors AUDIT_EVENTS v5.2 §5 `research.consent_revoked` event fields. |
| `research_export.requested` | Operator surface (cohort definition layer) | Audit pipeline (`research.export_initiated` per AUDIT_EVENTS v5.2 §5); Export pipeline (begins de-identification + k-anonymity computation) | export_id, tenant_id, country_of_care, cohort_definition_id, cohort_version, dsa_id, dsa_version, dsa_status_at_export, permitted_data_domains_at_export, requester_id, requester_role, requester_partner_id, requested_field_set, k_min_required, k_threshold_target, consent_cohort_snapshot_hash, requested_at | Per I-016 immutable. Audit at `audit_sensitivity_level: high_pii` per I-031. |
| `research_export.delivered` | Export pipeline (k-anonymity verified + de-identification complete + DSA still active + permitted-domain still in scope) | Audit pipeline (`research.export_completed` per AUDIT_EVENTS v5.2 §5); Notifications module (partner notification per DSA terms); Retention scheduler (export artifact retention class) | export_id, tenant_id, country_of_care, cohort_definition_id, cohort_version, dsa_id, dsa_version, dsa_status_at_export, permitted_data_domains_at_export, requester_id, requester_role, requester_partner_id, exported_field_set, k_threshold_actual (≥ k_min per I-029), k_min_required, suppressed_cell_count, consent_cohort_snapshot_hash, export_artifact_hash, retention_class, delivered_at | Per I-016 immutable. Per I-029 invariant binding: any condition unmet → **the domain event `research_export.delivered` is NOT emitted** (delivery did not occur). Distinct from the audit-side `research.export_completed` event (AUDIT_EVENTS v5.2 §5), which MAY emit with `status = invalidated` to record the attempted-and-failed completion per the audit-path discipline below in GOVERNANCE_CONTROLS §Research export INCIDENT controls. Audit at `audit_sensitivity_level: high_pii` per I-031. |

### New domain events (added v5.2 per ADR-027)

| Event name | Producer | Subscribers | Payload (key fields) | Notes |
|---|---|---|---|---|
| `marketing.surface_published` | Marketing copy governance review (status `approved` reached per §13.2) | Audit pipeline; Marketing surface rendering services; CCR cache invalidation | marketing_copy_id, tenant_id, country_of_care, version, classification, governance_review_reference_id, approval_validity_until | Per I-016 immutable. Required precondition for any `marketing.surface_rendered` audit event per AUDIT_EVENTS v5.2 §6. |
| `marketing.surface_suspended` | Drift detector (per §13.2 auto-suspension) OR governance review (cadence lapse) OR operator action | Audit pipeline (`marketing.surface_drift` per AUDIT_EVENTS v5.2 §6 if drift-driven); Marketing surface rendering services (immediate suspension); Notifications module | marketing_copy_id, tenant_id, country_of_care, version, suspension_reason, suspension_effective_at | Per I-016 immutable. Surface re-enabled only via fresh `marketing.surface_published` event after re-review. |

### Tenant-scope rule for research and marketing events (added v5.2)

Mirroring the AUDIT_EVENTS v5.2 §4 research-export tenant-scope rule: research and marketing domain events carry `tenant_id` of the **operating tenant** where consent (research) or copy approval (marketing) was collected. Cohort definitions or marketing copies that span multiple tenants emit one event per contributing tenant (not a single multi-tenant event), each scoped to that tenant's contribution.

---

## FORMS_ENGINE v1.10 additions (canonical v5.1 → v5.2)

### Form lifecycle — research consent integration (added v5.2)

Insert into the existing form lifecycle / approval governance section:

> **Research data-use consent block (added v5.2 per ADR-028 / Master PRD §15.2 / §15.3).** When a Forms Engine intake or care-touch flow includes the 5th consent tier (research data-use), the consent block is rendered per the L1 (presentation) layer for the active country (CCR `default_locale`) and tracked per the L4 (approval governance) layer. The L4 approval governance for forms containing research consent blocks MUST verify that:
>
> 1. The active CCR `research_data_partnership_active` ≠ `inactive` for the form's `country_of_care` (else the consent block MUST NOT render — patients are not asked to consent when the partnership is inactive in their country).
> 2. The `research_consent_text_version` rendered matches the approved text version per CCR `research_ethics_review_body.approval_reference_id` and `approval_validity_to >= now`.
> 3. Per I-030, **no Forms Engine layer (L1 presentation, L2 branching, L3 eligibility, L4 approval) may produce care-touching behavior that depends on `research_consent_status`**. Static analysis at form-version-publish time MUST reject all of:
>    - L2 BranchingLogic rules whose path selection depends on `research_consent_status` (no care-flow branching on research consent)
>    - L3 Eligibility rules whose outcome depends on `research_consent_status` (no eligibility gating on research consent)
>    - L4 ApprovalGovernance rules whose pathway selection depends on `research_consent_status` (no approval-pathway differentiation on research consent)
>    - L1 PresentationContent variation conditioned on `research_consent_status` for any non-consent-block surface (consent block itself is rendered from CCR `research_data_partnership_active` state per condition 1 above; all other patient-facing copy MUST NOT vary by consent status)
>    - Intake-flow gating (skipping or inserting flow steps) conditioned on `research_consent_status`
>    - Surface visibility (showing or hiding any non-consent surface) conditioned on `research_consent_status`
>
>    The single permitted dependency is rendering the research-consent block itself from CCR state per condition 1 above (and re-rendering on consent grant/revoke). Form-version-publish-time static analysis is the Forms-Engine-side enforcement of I-030; runtime CCR validation provides the cross-check.

### Cross-reference to Master PRD §10.5 (added v5.2)

Insert into the existing cross-references section:

> **Pattern A and four-layer architecture cross-reference (added v5.2 per Master PRD §10.5).** Master PRD v1.10 §10.5 is the canonical source for the platform-level program catalog architecture. It explicitly references this contract's four-layer Forms Engine model (L1 presentation, L2 branching, L3 eligibility, L4 approval) and Pattern A versioning rule (every market gets its own immutable form version even when the underlying clinical structure is byte-identical — the price of regulatory provenance). FORMS_ENGINE v5.1 four-layer model and Pattern A are preserved without modification; §10.5 documents how they compose with the platform-level Program entity + ProgramMarketPolicy + CCR Runtime to produce per-tenant, per-country form deployments.

---

## MARKET_LAUNCH v1.10 additions (canonical v5.0 → v5.1)

### Cross-reference to Master PRD §10.5 (added v5.1)

Insert into the existing cross-references section:

> **Program catalog architecture cross-reference (added v5.1 per Master PRD §10.5).** ProgramMarketPolicy (this contract's central entity) is one of the four layers in Master PRD v1.10 §10.5's program catalog architecture, alongside Program (platform-level catalog entry), Forms Engine four-layer instantiation, and CCR Runtime resolution. §10.5 makes the relationship explicit:
>
> - **Program** — platform-defined catalog entry per ProgramCatalogEntry type (TYPES v5.2). Defines clinical template, default protocol, default guardrail, intended market classes.
> - **ProgramMarketPolicy** — per-(tenant, country) instantiation of a Program. Defines per-market overrides: formulary, protocol selection, eligibility, pricing, approval pathway, marketing classification per CCR `molecule_level_marketing_permitted`.
> - **Forms Engine instantiation** — Pattern A immutable per-market form version per FORMS_ENGINE v5.2.
> - **CCR Runtime** — country-specific runtime resolution per CCR_RUNTIME v5.2.
>
> MARKET_LAUNCH governs the activation gate that brings a (Program, country) pair to live status. It does not redefine ProgramMarketPolicy — it is the entity's lifecycle authority.

### Marketing posture activation gate (added v5.1 per ADR-027)

For any (Program, country) pair where the program involves prescription medication and the country supports molecule-level marketing per CCR `molecule_level_marketing_permitted = permitted`, the activation gate MUST verify ALL of:

1. The CCR `marketing_copy_governance_evidence` structured object (per CCR_RUNTIME v5.2 marketing block) is fully populated with all required sub-fields per ADR-027 / Master PRD §13.2 (regulatory_jurisdiction, regulatory_authority, regulatory_interpretation_artifact_id, interpretation_date, scope, prohibited_claim_classes, governance_lead_designation_artifact_id; ethics_review_concurrence_artifact_id where local jurisdiction requires).
2. **Tier-2 regulatory evidence** present for the country where applicable: e.g., for Telecheck-Ghana, Pharmacy Council guidance review artifact and Ghana FDA interpretation artifact are referenced from `regulatory_interpretation_artifact_id`. For other future markets, the analogous regulatory body's interpretation/clearance artifact MUST be present. (Country-specific Tier-2 evidence requirements drive from regulatory_authority; the governance review classifies as `protocol_authorized` per workload taxonomy §13.7.)
3. At least one approved `MarketingCopy` (per TYPES v5.2) for that program × country pair exists, classification = `molecule_level`, `status = approved`, and `approval_validity_until >= now`. The copy's governance review reference resolves to the §13.2 Governance review process artifact.
4. The Marketing copy governance lead, Clinical Safety Officer, and Regulatory Affairs Lead triple sign-off per ADR-027 v0.5 is recorded in the activation audit chain.
5. **Country Launch Director activation sign-off** per Market Launch contract (separate from triple sign-off; Country Launch Director owns per-country launch authority and authorizes the activation transition per the standard MARKET_LAUNCH lifecycle).
6. AUDIT_EVENTS v5.2 `marketing.surface_rendered` and `marketing.surface_drift` event emission paths are operational (governance review reference + approval timestamp + approval validity until populated; drift detector active; auto-suspension wiring per Master PRD §13.2).

If ANY condition is unmet, the activation gate REJECTS the launch for that (Program, country) pair. This rejection is independent of (and additional to) all other Market Launch gate criteria. A failed activation attempt produces a Category B audit record naming the failed condition.

### Research data partnership activation gate (added v5.1 per ADR-028)

When a country's CCR `research_data_partnership_active` transitions from `consent_only` to `active`, the activation gate MUST verify ALL of:

1. CCR `research_ethics_review_body` is populated and `approval_validity_to >= now`.
2. CCR `research_permitted_data_domains` is non-empty (at least one closed-enum domain selected for the country) and is a subset of the closed enum (`chronic_disease_longitudinal | ncd_surveillance | pharmacovigilance_signal | population_health_aggregate`) — per ADR-028 Decision §6, expansion of the enum requires ADR amendment.
3. CCR `cross_border_research_transfer_permitted` is set with appropriate companion evidence per `cross_border_research_transfer_evidence` structured object (counsel artifact ID, transfer mechanism, recipient country, onward transfer policy, DSA alignment artifact ID — all populated where the enum value requires).
4. At least one DataSharingAgreement (per TYPES v5.2) is in `active` status with `validity_to >= now`, partner organization registered, AND `permitted_data_domains` (per DSA) is a subset of CCR `research_permitted_data_domains` (DSA cannot exceed country domain scope).
5. DSA `k_min_required` ≥ CCR `k_min_default` (per-DSA may require higher k_min; never lower per I-029).
6. **5th consent tier deployment verified:** the research data-use consent text version per CCR `research_ethics_review_body.approval_reference_id` is populated, ethics-reviewed, and rendered to live patient-facing intake/care surfaces. Forms Engine static analysis at form-version-publish time has confirmed I-030 compliance for all forms in the country (per FORMS_ENGINE v5.2 enforcement above).
7. **De-identification engine readiness verified:** the export pipeline implementation (cohort definition layer, de-identification engine producing Safe Harbor + k-anonymity output, aggregation layer, DSA enforcement) is deployed and operational in this country's tenant deployment per ADR-028 Decision §3 / Master PRD §15.3 4-layer pipeline.
8. **Audit pipeline at high_pii sensitivity verified:** AUDIT_EVENTS v5.2 `audit_sensitivity_level = high_pii` retention/access discipline is operational for `research.export_*` event family; storage tier and access controls match per I-031.
9. Per ADR-028 v0.4 quad sign-off: Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer + Product Lead is recorded in the activation audit chain.
10. REC concurrence per `research_ethics_review_body.per_dsa_review_required` if applicable.
11. Country Launch Director activation sign-off per Market Launch contract (separate from the quad sign-off; Country Launch Director owns the per-country launch authority).

If ANY condition is unmet, the activation gate REJECTS the transition. The country remains in `consent_only` state (5th consent tier active; no exports). A failed activation attempt produces a Category B audit record naming the failed condition.

---

## GOVERNANCE_CONTROLS v1.10 additions (canonical v5.1 → v5.2)

### Research data export control envelope (added v5.2 per ADR-028)

Insert as a new section after existing CONFIG/INCIDENT/SIGNAL contract sections:

#### Research export CONFIG controls

| Config control | Bound by | Owner |
|---|---|---|
| Activation state of research data partnership | CCR `research_data_partnership_active` 3-state enum | Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer + Product Lead (quad sign-off per ADR-028 v0.4) |
| Permitted data domains for export | CCR `research_permitted_data_domains` closed enum (subset of `chronic_disease_longitudinal | ncd_surveillance | pharmacovigilance_signal | population_health_aggregate`) | Same quad sign-off + REC concurrence per `research_ethics_review_body.per_dsa_review_required` |
| K-anonymity threshold | CCR `k_min_default` (default 11; per-DSA increases permitted; decreases below `k_min_default` prohibited per I-029) | Privacy Officer + Engineering Lead + REC concurrence |
| Cross-border transfer mechanism | CCR `cross_border_research_transfer_permitted` enum + `cross_border_research_transfer_evidence` companion structured object | Privacy Officer + Legal counsel artifact (per Master PRD §22.3) |
| DSA activation | DataSharingAgreement entity (per TYPES v5.2) | Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer + Product Lead quad sign-off + partner organization sign |

#### Research export INCIDENT controls

**Incident response audit-path discipline (aligned with AUDIT_EVENTS v5.2 §5 export event family):** When an incident triggers export invalidation, the audit chain MUST capture the failure transparently. Per AUDIT_EVENTS v5.2 §5: `research.export_completed` MAY emit with the violated state recorded in payload (e.g., `dsa_status_at_export = expired`, `permitted_data_domains_at_export` showing drift, `k_threshold_actual < k_min_required`); the event's `status` field carries `invalidated` to mark the failed completion. Concurrently, the export pipeline MUST emit a `signal_enforcement_trigger` Category B audit event capturing the enforcement action (export artifact destruction; partner notification; engineering review trigger). The two records compose to give a complete audit trail of "what happened" + "what we did about it." Bare suppression of the completion event (no record at all) is forbidden — silent invalidation is an audit gap per I-003.

| Incident type | Triggers | Response |
|---|---|---|
| DSA expiry mid-export | `dsa_status_at_export` ≠ `active` at completion-time check | Per I-029: `research.export_completed` MAY emit with `dsa_status_at_export = expired/suspended/retired` and `status = invalidated`; export artifact destroyed; `signal_enforcement_trigger` Category B audit emitted with enforcement action detail; partner notified per DSA terms. |
| K-anonymity threshold violation | `k_threshold_actual < k_min_required` at de-identification | Per I-029: `research.export_completed` MAY emit with `k_threshold_actual` value recorded and `status = invalidated`; export artifact destroyed; `signal_enforcement_trigger` Category B audit emitted; engineering review of cohort definition required before re-attempt. |
| Permitted-domain drift | `permitted_data_domains_at_export` does not match the `research.export_initiated` snapshot at completion time | Per I-029: `research.export_completed` MAY emit with `permitted_data_domains_at_export` showing drift and `status = invalidated`; export artifact destroyed; `signal_enforcement_trigger` Category B audit emitted; CCR audit triggered to determine whether enum was modified mid-export (governance violation if so). |
| Consent revocation mid-export | `research_consent.revoked` event for any patient in the cohort during the export window | Cohort suspended; `signal_enforcement_trigger` Category B audit emitted; if k-anonymity remains satisfiable after exclusion, cohort can recompute and re-export under new `consent_cohort_snapshot_hash` (new `research.export_initiated` event with new snapshot); if not satisfiable, export invalidated per the standard discipline above. |

#### Research export SIGNAL controls

The platform emits dashboard / monitoring signals on:

- DSA expiry within 30 days (warning) / 7 days (urgent escalation)
- REC approval expiry within 30 days
- Cohort cell suppression rate exceeding 25% (potential cohort design issue)
- Marketing copy governance review approaching cadence expiry (per `marketing_governance_review_cadence_months`)
- Cross-border transfer evidence approaching counsel artifact expiry

### PolicyAuthorization framework — placeholder (added v5.2 per ADR-029 / future ADR-030)

Insert as a new section:

> **PolicyAuthorization placeholder.** The PolicyAuthorization entity (per TYPES v5.2 placeholder skeleton; AUTONOMY_LEVELS contract §6 cross-reference) is the autonomy-grant primitive for AI workloads operating at autonomy levels above `action_with_confirm`. **At v1.0, PolicyAuthorization is NOT activated** — no AI workload may invoke an autonomy level requiring it. The skeleton exists to:
>
> 1. Document the data shape that future ADR-030 implementations will consume.
> 2. Reserve the `pau_` ID prefix and the placeholder schema in TYPES v5.2.
> 3. Provide the runtime validator with a target type to reject (per AUTONOMY_LEVELS §5 rule 4 — reserved autonomy levels MUST be rejected for lack of a valid PolicyAuthorization reference at v1.0).
>
> When ADR-030 (Tiered Autonomy Progression Model) activates, the PolicyAuthorization skeleton becomes operative. Activation prerequisites per AUTONOMY_LEVELS contract §3.1 / §3.2 (including triple sign-off, per-market regulatory clearance, named successor invariant superseding I-012, augmented safety case for `fully_autonomous`, activation audit event in immutable audit chain).

This contract does NOT implement PolicyAuthorization at v1.0 — only documents the placeholder. Implementation lands when ADR-030 is accepted and a follow-on GOVERNANCE_CONTROLS revision is authored.

---

## Document control update for each contract (Phase 6 promotion)

Add v5.2 (or v5.1 for MARKET_LAUNCH which is at v5.0) entries to each contract's Document control section:

- **DOMAIN_EVENTS v5.2:** Adds 4 research events (`research_consent.granted`, `research_consent.revoked`, `research_export.requested`, `research_export.delivered`) per ADR-028; 2 marketing events (`marketing.surface_published`, `marketing.surface_suspended`) per ADR-027. Tenant-scope rule for research and marketing events. Existing events preserved; v5.2 is purely additive.
- **FORMS_ENGINE v5.2:** Adds research consent integration into form lifecycle (L1 rendering gate; L4 approval verification; static analysis preventing L3/L4 dependency on `research_consent_status` per I-030). Cross-reference to Master PRD §10.5 program catalog architecture. Four-layer model and Pattern A preserved without modification.
- **MARKET_LAUNCH v5.1:** Adds program catalog architecture cross-reference per Master PRD §10.5; marketing posture activation gate per ADR-027; research data partnership activation gate per ADR-028. Existing ProgramMarketPolicy lifecycle authority preserved without modification.
- **GOVERNANCE_CONTROLS v5.2:** Adds Research data export control envelope (CONFIG / INCIDENT / SIGNAL controls per ADR-028); PolicyAuthorization framework placeholder per ADR-029 / future ADR-030. Existing CONFIG/INCIDENT/SIGNAL contracts preserved.

---

## Document control (this delta artifact)

- **v1.0 — 2026-05-01** — Phase 3 group-3 reconciliation against canonical Master PRD v1.10 §10.5 + §13.2 + §13.7 + §15.3 + ADRs 027 / 028 / 029 + group-1/group-2 contract deltas. 4 contracts (DOMAIN_EVENTS, FORMS_ENGINE, MARKET_LAUNCH, GOVERNANCE_CONTROLS) updated additively at v5.2 / v5.1.
- **v1.0.2 — 2026-05-01** — Patches per Codex Phase 3 group-3 review v0.1 (2 HIGH + 3 MEDIUM):
  - **HIGH-1 (FORMS_ENGINE I-030 under-enforced):** Static analysis at form-version-publish time now rejects 6 categories of dependency on `research_consent_status` — L2 BranchingLogic, L3 Eligibility, L4 ApprovalGovernance, L1 PresentationContent variation (except the consent block itself), intake-flow gating, surface visibility. Single permitted dependency: rendering the research-consent block from CCR state.
  - **HIGH-2 (MARKET_LAUNCH research active gate incomplete):** Activation gate expanded from 5 to 11 conditions: added DSA permitted-domain subset check (DSA cannot exceed country domain scope); k_min_required ≥ CCR k_min_default check; 5th consent tier deployment verification (consent text rendered + Forms Engine I-030 compliance); de-identification engine readiness (4-layer pipeline operational); audit pipeline at high_pii sensitivity verified; Country Launch Director activation sign-off (separate from quad sign-off).
  - **MEDIUM-1 (DOMAIN_EVENTS consent payload incomplete):** Added `consent_type`, `version_presented` to both consent events; added `scope` and `asymmetric_retraction_acknowledgment` to revoke event. Payload now mirrors AUDIT_EVENTS v5.2 §5 fully.
  - **MEDIUM-2 (MARKET_LAUNCH marketing gate compressed):** Marketing activation gate expanded from 3 to 6 conditions: added Tier-2 regulatory evidence requirement (Pharmacy Council guidance for Ghana; analogous bodies for future markets); Country Launch Director activation sign-off; AUDIT_EVENTS marketing surface event emission paths operational.
  - **MEDIUM-3 (GOVERNANCE_CONTROLS incident semantics conflict with group-1):** Incident response audit-path discipline section added — `research.export_completed` MAY emit with violated state recorded + `status = invalidated`; concurrent `signal_enforcement_trigger` Category B audit captures enforcement action. Bare suppression of completion event forbidden — silent invalidation is an audit gap per I-003. All 4 incident types reworded to align.
- **Note:** ERROR_MODEL and IDEMPOTENCY require no v1.10 edits per matrix scan; semantics compose cleanly with new events.
- **Status:** RECONCILED v0.2 — proposed Phase 3 group-3 contribution. Codex Phase 3 group-3 v0.2 verification pending.
- **Lands canonically:** Phase 6 promotion.
