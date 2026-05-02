# Phase 5 — Slice PRDs + Engineering specs + DIC + Operational Readiness + Other docs (v1.10 cycle delta)

**Version:** 1.0 RECONCILED — proposed delta covering 70 matrix rows across 6 groups
**Date:** 2026-05-01
**Reconciliation owner:** Workstream lead (Evans) via Claude proxy
**Approval owner (audit-B):** Engineering Lead + Product Lead + Clinical Safety Officer + Privacy Officer (per I-015 dual-control across the multi-domain edit set)
**Purpose:** Document v1.10 cycle propagation edits across non-Master-PRD, non-Contracts-Pack, non-ADR artifacts: 17 active slice PRDs, 6 engineering specs (CDM/State Machines/OpenAPI/RBAC/SystemArch/Tenant Threading), Design System + DIC v1.0 → v1.1 promotion (Phase 5.6 / F49), Operational Readiness Tracker, plus control-plane and external-facing artifacts (Boot, Index, Registry, Reviewer, Investor, Patient App IA, Notification Spec, Messaging Inbox, Engineering Handoff, Ghana Launch Playbook). Plus 4 NEW operational-evidence placeholder files referenced by ADR-027 and ADR-028.

---

## Group 5A — Slice PRDs (24 matrix rows; 14 distinct slice files)

### Cycle C2 — Emerging-markets framing reframe (5 slice rows)

**Row 7 — RPM/CCM Slice §4.2 + §17:** Reframe "At Ghana launch, RPM/CCM activates..." → "At launch (Telecheck-Ghana via Heros Health Ghana DBA pilot in Ghana, plus future emerging markets per ADR-024 country-driven configuration), RPM/CCM activates...". Concrete pilot citation (Ghana DPA, FDA Ghana, MDC) preserved where the reference is to the actual pilot.

**Row 8 — Herb-Drug Interaction Engine Slice §1 + traceability:** "Ghana differentiator" + "institutional positioning" reframed as "emerging-markets differentiator (piloting in Ghana via Telecheck-Ghana; expandable per CCR herb-drug knowledge base scope)". Master PRD §3 Pillar reference verified.

**Row 9 — Adverse Event Reporting Slice multiple sections referencing Ghana FDA / WHO:** Reframe "Ghana FDA reporting" → "emerging-market regulatory reporting (per CCR `regulatory.adverse_event_reporting.authority` for the launch market — Ghana FDA at v1.0 Telecheck-Ghana pilot)". WHO references preserved where partnership-specific.

**Row 10 — Community Platform Slice § launch posture + community group framing:** "Ghana-launch initially" + 3 Ghana groups reframed: launch posture "emerging-market pilot in Ghana via Telecheck-Ghana"; group naming retains Ghana-specific identifiers since these are operational facts about the actual community (Heros Health Ghana community groups).

**Row 11 — Pharmacy + Refill Slice (bridge supply, mobile money, WhatsApp framing):** Mobile-money + WhatsApp + motorcycle-courier references reframed. The CCR `operational.notification_channels.primary_engagement` and `operational.payment_rails` already abstract per-country; slice documentation now states "channel/rail selection is CCR-driven; the Telecheck-Ghana pilot uses WhatsApp + mobile money + motorcycle courier per CCR Ghana profile".

### Cycle C3 — Brand structure cascade (5 slice-related rows; 4 slice-PRD-targeted matrix rows + 1 verification-only marker)

**Row 21 — Market Rollout Cockpit Slice (Market Pack — brand metadata):** Market Pack metadata field set updated: `tenant_identifier` = `Telecheck-{country}`; `consumer_dba` = `Heros Health` (or country-instance as `Heros Health {Country}`); `legal_entity` = e.g., `Telecheck Health LLC` for US, `Telecheck-Ghana Ltd.` for GH; `consumer_subdomain` = `heroshealth.com` / `ghana.heroshealth.com`. Drops bare "operating entity" / "brand" fields in favor of the structured C3 vocabulary.

**Row 39 — Admin Backend Slice §17 prose:** "Heros team running Heros, Telecheck-Ghana team running Telecheck-Ghana" → "Telecheck-US tenant operator team (Heros Health DBA) running Telecheck-US, Telecheck-Ghana tenant operator team running Telecheck-Ghana". Tenant directory + per-tenant prose framed in operating-tenant naming.

**Row 40 — Forms / Intake Engine Slice §437:** "Particularly relevant for the Telecheck-Ghana tenant" preserved as-is — this reference is operationally accurate (Telecheck-Ghana is the operating tenant identifier per C3). No edit needed; verified consistent with C3 vocabulary.

**Row 41 — Pharmacy + Refill Slice §112:** "Telecheck-Ghana operated pharmacy infrastructure (where applicable)" — verified consistent with C3 vocabulary; no edit needed.

(Note: rows 40 and 41 are verified-consistent reference updates. No substantive content edit; sentinel marks the verification per C3 cycle.)

### Cycle C4 — Country-conditional DTC marketing posture (4 slice rows)

**Row 50 — Acquisition Engagement Tools Slice (NEW SECTION — country-conditional marketing surface logic):**

Add `§N. Country-conditional marketing surface logic` (per ADR-027). Specifies:

- Surface-rendering services consult CCR `marketing.molecule_level_marketing_permitted` before rendering any molecule-level marketing surface. Default behavior when state ≠ `permitted`: render program-level surface only.
- Marketing surfaces classified per Master PRD §13.2 working definition (5 criteria for molecule-level; fail-closed for borderline cases per ADR-027 v0.6 Decision §7).
- Every rendered molecule-level surface emits `marketing.surface_rendered` audit event per AUDIT_EVENTS v5.2 §6 (CCR marketing policy version, MarketingCopy version, governance review reference, approval timestamp, approval validity, claim classes, patient_id).
- Drift detection: surface auto-suspend on `marketing.surface_drift` event per Master PRD §13.2.
- Marketing copy registration: copy authored, governance-reviewed under §13.2 Governance review process (triple sign-off per ADR-027 v0.6), then registered in MarketingCopy entity (per TYPES v5.2) before rendering.
- Cross-references: ADR-027, Master PRD §7.9, §13.2; AUDIT_EVENTS v5.2 §6; CCR_RUNTIME v5.2 marketing block; MARKET_LAUNCH v5.1 marketing posture activation gate.

**Row 51 — Forms/Intake Engine Slice (marketing copy in intake flow):** Add reference: Forms Engine four-layer architecture handles marketing copy in L1 (presentation) layer. Marketing copy classification at L1 must distinguish program-level (no governance review) from molecule-level (requires §13.2 Governance review process per Decision §4 of ADR-027). L4 approval governance verifies that any L1 copy classified as molecule-level resolves to a `MarketingCopy` entity in `approved` status before publication.

**Row 52 — Admin Configuration Surfaces Slice (NEW SECTION — marketing config admin):** Add `§N. Marketing copy governance admin surface`. Tenant Admin / Marketing copy governance lead surface for: drafting marketing copy, classifying as program-level or molecule-level, submitting to §13.2 Governance review process, viewing review status, viewing approval validity expiry, suspending/republishing surfaces. References ADR-027 v0.6, MARKET_LAUNCH v5.1 activation gate.

**Row 56 — Market Rollout Cockpit Slice (marketing config in Market Pack):** Market Pack updated to include marketing block: `molecule_level_marketing_permitted` 3-state enum + structured `marketing_copy_governance_evidence` object + `marketing_governance_review_cadence_months` + `marketing_governance_lead_designation_artifact_id`. Country pack ships with default state `prohibited` (or `pending_evidence` for emerging markets where regulatory engagement is underway).

### Cycle C5 — Research data partnership Posture A (5 slice rows)

**Row 60 — Consent & Delegated Access Slice (NEW SECTION — 5th consent tier):**

Add `§N. Research data-use consent (5th tier)` per ADR-028 + Master PRD §15.2. Specifies:

- 5th tier presented at intake/care-touchpoints when CCR `research_data_partnership_active ∈ {consent_only, active}` for the patient's `country_of_care`.
- Consent text: per CCR `research_ethics_review_body.approval_reference_id` + version-pinned per Master PRD §15.2 patient-facing text.
- Optional, separately revocable, no care impact (per I-030).
- Asymmetric retraction: aggregate data already shared cannot be retracted — patient explicitly acknowledges before grant.
- Audit per AUDIT_EVENTS v5.2 §5 `research.consent_granted` / `research.consent_revoked`.
- Cross-references: ADR-028 v0.5, Master PRD §15.2, INVARIANTS v5.2 I-029/I-030/I-031, AUDIT_EVENTS v5.2 §5.

**Row 61 — Forms/Intake Engine Slice (NEW SECTION — research consent block):** Add new field type/consent block variant: `research_data_use_consent_block`. Renders only when CCR `research_data_partnership_active ≠ inactive` for `country_of_care` (per FORMS_ENGINE v5.2 form lifecycle research consent integration). Static analysis at form-version-publish time rejects 6 categories of dependency on `research_consent_status` per FORMS_ENGINE v5.2 I-030 enforcement.

**Row 76 — Market Rollout Cockpit Slice (research partnership in Market Pack):** Market Pack updated to include research block: `research_data_partnership_active` 3-state enum + 7-key research configuration (per CCR_RUNTIME v5.2 research block). Country pack ships with default state `inactive` for new markets, `consent_only` for markets that have completed REC engagement.

**Row 77 — RPM/CCM Slice (research data feed potential):** Note: RPM/CCM produces longitudinal chronic disease data — the highest-value research data source for Posture A. Per ADR-028 Decision §6, the RPM/CCM data domain intersects with `research_permitted_data_domains.chronic_disease_longitudinal`. Slice updated with cross-reference to ADR-028; explicit statement that any export of RPM/CCM data is governed by the research export pipeline (not by RPM/CCM slice directly) and requires active DSA + active 5th-tier consent + k-anonymity ≥ k_min per I-029.

**Row 78 — AE Reporting Slice (research data integration):** Clarify: AE Reporting is internal safety surveillance per current scope. AE data may feed pharmacovigilance signal flow at Release 2 (via `research_permitted_data_domains.pharmacovigilance_signal`) under Posture A — aggregate, audit-trail-driven, governed by I-029. Behavior-changing post-market protocols remain Posture B (absolute non-goal) per ADR-028.

### Cycle C6 — Program catalog architecture canonicalization (3 slice rows)

**Row 86 — Market Rollout Cockpit Slice (Master PRD cross-reference):** Add cross-reference to Master PRD §10.5 (Program catalog architecture). Verify Cockpit slice's Market Pack abstraction is consistent with Master PRD §10.5's 4-layer model: Program → ProgramMarketPolicy → Forms Engine instantiation → CCR Runtime resolution.

**Row 87 — RPM/CCM Slice (Master PRD cross-reference + porting):** Update slice scope from "Ghana launch" to "Per Master PRD §10.5 program catalog architecture: RPM/CCM is a Program (platform-level catalog entry per ProgramCatalogEntry type, TYPES v5.2). Per-market activation via ProgramMarketPolicy. Initial market activation: Telecheck-Ghana via Heros Health Ghana DBA (chronic care anchor)."

**Row 88 — Forms Engine Slice (NEW SECTION — Program porting workflow):** Add `§N. Program porting workflow`. Documents how a program defined for one market ports to another via ProgramMarketPolicy + Pattern A (immutable per-market form versions). Cross-references the `Telecheck_Program_Porting_Checklist_GLP1_v1_0.md` worked example (Telecheck-US GLP-1 Heros Health DBA → Telecheck-Ghana GLP-1 Heros Health Ghana DBA). Master PRD §10.5 cited as canonical source.

### Cycle C7 — AI workload taxonomy + autonomy levels (3 slice rows)

**Row 101 — AI Clinical Assistant Slice §3 (terminology rewrite):** Update §3 architecture references from "Mode 1 / Mode 2" to "workload taxonomy" terminology per ADR-029. Code, schema, audit, and config references use `conversational_assistant` / `protocol_execution`. UI / operator-facing prose may continue to use "Mode 1 / Mode 2". Cross-reference to Master PRD §13.7 (single normative source of truth) + WORKLOAD_TAXONOMY contract v5.2 + AUTONOMY_LEVELS contract v5.2 + AI_LAYERING contract v5.2 §10.

**Row 102 — Consent & Delegated Access Slice §X (consent additions for ADR-028):** Verify F28 Consent & Delegated Access Slice covers ADR-028 5th-tier consent additions (already covered in Row 60). Cross-reference: ADR-028 v0.5; Master PRD §15.2.

**Row 103 — AI Clinical Assistant Slice §13 alignment:** Confirm AI Clinical Assistant Slice §13 references Master PRD §13.7 + WORKLOAD_TAXONOMY contract + AUTONOMY_LEVELS contract. I-012 reject-unless three-clause rule mirroring required for any slice-side state machine references to executed transitions on prescription/refill/medication-order actions. Cross-reference to AI_LAYERING contract v5.2 §10 (Future workload expansion).

---

## Group 5B — Engineering specs (12 matrix rows; 6 distinct files)

### CDM v1.2 (3 rows)

**Row 27 — Tenant entity reference update:** Verify `tenant.id` naming convention uses `Telecheck-{country}` format. Update tenant table examples: US → `Telecheck-US`; GH → `Telecheck-Ghana`. Tenant table includes `consumer_dba`, `legal_entity`, `consumer_subdomain` columns per C3 brand structure.

**Row 70 — Research entities (NEW):** Add per ADR-028 + TYPES v5.2:
- `ResearchConsent` — links to ConsentRecord with `consent_type = research_data_use`
- `CohortDefinition` (per TYPES v5.2)
- `DataSharingAgreement` (per TYPES v5.2)
- `ResearchEthicsReviewBody` (per TYPES v5.2)
- `ResearchPartner` (lightweight; identifies external research partner organization)
- `ResearchDataExport` (per TYPES v5.2; carries tenant_id + country_of_care)

All entities tenant-scoped per I-023; export entity carries the operating-tenant ID where consent was collected (parent-level partnership reference via DSA).

**Row 98 — AIExecution entity + reserved-future entities (NEW per ADR-029):** Add `AIExecution` entity (normative, fully implemented at v1.0) unifying current Mode 1 invocations and Mode 2 cases under workload taxonomy. Discriminator: `ai_workload_type` (canonical name per Phase 3 EXIT MEDIUM cleanup). Reserved-future entities (`Agent`, `AgentRun`, `Tool`, `ToolCall`, `AgentMemory`, `KnowledgeSource`, `PolicyAuthorization`) are non-normative reserved names only at v1.0 — schemas defined when their authorizing ADRs activate (per ADR-029 Decision §6).

### State Machines v1.1 (2 rows)

**Row 71 — Research consent + export state machines (NEW per ADR-028):**
- `ResearchConsent`: `pending → granted → revoked` (no `revoked → granted` transition per asymmetric retraction; new grant after revoke creates new ResearchConsent entity per consent immutability)
- `DataSharingAgreement`: `draft → in_review → active → expired | suspended → renewed (creates new DSA version)`
- `ResearchExportRequest`: `queued → processing → ready → delivered → expired | invalidated`. Per I-029, `ready → delivered` MUST be rejected (and `delivered` MUST NOT be reached) when any of: `dsa_status_at_export ≠ active`, `k_threshold_actual < k_min_required`, `permitted_data_domains_at_export` drift, consent-cohort change. Audit-side `research.export_completed` MAY emit with `status = invalidated` per AUDIT_EVENTS v5.2 §5 + GOVERNANCE_CONTROLS v5.2 incident discipline.

**Row 97 — ProtocolAuthorizedAction lifecycle (NEW per ADR-029):** Add new `ProtocolAuthorizedAction` state machine with **only the `human_confirmed` path implemented as executable code** at v1.0: `draft → ai_recommended → human_confirmed → executed → completed`. Reserved transitions (`ai_recommended → audit_only_executed`, `ai_recommended → autonomous_executed`, `* → autonomy_suspended → escalated_for_review`) documented as **non-normative future sketches** in the State Machines doc — NOT implemented as executable code paths in v1.0. Activation lands with ADR-030. **I-012 preservation rule (mirrors Master PRD §13.7 v0.3):** state machine validation MUST reject `executed` transitions for I-012 actions UNLESS all 3 conditions hold (string equality `autonomy_level == action_with_confirm`; audit-chain clinician confirmation event scoped to action_id; confirming actor RBAC v1.1 / I-012 authorized role). Reserved levels gated on successor ADR + activation audit event two-condition AND.

### OpenAPI v0.2 (2 rows)

**Row 28 — Tenant identifier in URI patterns:** Verify any OpenAPI paths or payload examples using `Heros-Health` as tenant identifier are renamed to `Telecheck-US`. Sweep `/tenants/{tenant_id}/...` paths and example values.

**Row 74 — Research endpoints (NEW per ADR-028):** Add OpenAPI definitions for:
- `POST /research/consents/grant` and `/revoke` (5th tier consent; tenant-scoped per I-023)
- `POST /research/cohort-definitions` (operator surface; tenant-scoped)
- `POST /research/exports/initiate` and `/complete` (system + operator surfaces; high_pii audit per I-031)
- `GET /research/dsas/{dsa_id}` and `POST /research/dsas/activate` (Privacy Officer + RA Lead + CSO + PL quad sign-off per ADR-028)
- `GET /research/audit/exports` (audit retrieval at high_pii sensitivity level; restricted to ethics review boards, regulators, partner organizations per I-031)

All endpoints tenant-scoped per I-023; export endpoints emit at `audit_sensitivity_level = high_pii` per I-031.

### RBAC Permissions Matrix v1.1 (2 rows)

**Row 29 — Tenant scoping examples:** Update examples from `Heros tenant admin` to `Telecheck-US tenant admin` (Heros Health DBA scope clarification in role description). Tenant admin scope examples reframed.

**Row 73 — Research roles (NEW per ADR-028):** Add 3 new roles:
- `Research Data Steward` — operator-side; defines cohorts, manages DSA lifecycle, initiates exports. Bound by I-029 / I-031 audit obligations.
- `Research Ethics Committee Member` — read-only oversight; can review research export audit chain (high_pii sensitivity) and consent text history; cannot modify state.
- `External Research Partner` — highly scoped; receives delivered exports; cannot access patient-level data, cannot navigate to other partners' DSAs, cannot modify cohort definitions.

### System Architecture v1.2 (2 rows)

**Row 42 — Cross-border posture references:** §427 ("Both Heros (US tenant) and Telecheck-Ghana (Ghana tenant) data are processed in us-east-1 per ADR-026") updated to "Both Telecheck-US (Heros Health DBA — operating tenant) and Telecheck-Ghana data are processed in us-east-1 per ADR-026 single-region posture (I-028)". C3 brand-structure cleanup applied.

**Row 72 — Research data module (NEW per ADR-028):** Add research data export module to system architecture diagram. Document the §15.3 4-layer pipeline:
1. Cohort definition layer
2. De-identification engine (Safe Harbor + k-anonymity per CCR `de_identification_standard`)
3. Aggregation layer (population-level statistics with `k_min` floor)
4. DSA enforcement (every external partner has signed DSA; access gated on DSA validity)

Module is positioned alongside Care Delivery and Governance modules. Tenant-scoped per I-023; export records carry operating-tenant ID + parent-level DSA reference per AUDIT_EVENTS v5.2 §4 research-export tenant-scope rule.

### Tenant Threading Addendum v1.0 (1 row)

**Row 31 — Tenant ID examples sweep:** All §3.x slice addenda using `Heros-Health` as US tenant ID example renamed to `Telecheck-US` (with parenthetical "Heros Health DBA" qualifier where consumer-brand context applies).

---

## Group 5C — DIC v1.0 → v1.1 promotion + Design System (4 matrix rows)

### Row 20 — Design System v1.1 brand tokens (Reference update — C3)

Verify Design System per-tenant theming via design tokens accommodates the C3 brand-structure cascade:

- Per-tenant theming variables work with consumer DBA at runtime (Heros Health for US, Heros Health Ghana for GH)
- Operating-tenant identifiers are not patient-facing — design tokens key off the consumer DBA, not the operating tenant ID
- `tenant_brand` design token namespace updated per the structured C3 vocabulary (consumer_dba, consumer_subdomain, primary_color, secondary_color, etc.)

### Row 33 — Design System Heros brand tokens (New section — C3)

Add new §N. Heros consumer-brand identity tokens. Specifies: logo, colors, typography, voice, photography placeholder substitution rules. Authoritative visual reference: `telecheck-design-system/project/Patient interactive mock v7.html` per Patient mock v7 authoritative declaration in CLAUDE.md.

### Row 44 — Design Implementation Contract (Reference update — multi-tenant)

§103 ("multi-tenant brand variations: at minimum, neutral default + Heros brand") updated to:

> "Multi-tenant brand variations: at minimum, the neutral platform default + the Heros Health consumer DBA (country-instanced; primary surface is `heroshealth.com` for Telecheck-US and `ghana.heroshealth.com` for Telecheck-Ghana). Future tenants surface their own consumer brand at country subdomains; all share the Telecheck platform infrastructure."

### Row 108 — DIC v1.0 → v1.1 promotion (Phase 5.6 / F49 — Section rewrite)

**Per Evans Option B 2026-04-28 (folded into v1.10 cycle):**

DIC bumps from v1.0 to v1.1 with:

- Status header flip: PROVISIONAL → "Canonical for development" (with the v7 Patient mock as binding visual reference)
- §4.1 / §4.2 pixel-exact-match clauses activated (no longer marked "PROVISIONAL")
- Substitution flags carry forward: Manrope (font), Lucide (icons), wordmark (placeholder logo), photography (placeholder images) — all to be replaced before customer ship
- Pharmacy portal kit gap noted: not in v1 design system; gap to be filled when pharmacy slice work begins
- C3 brand-structure cascade applied: §103 multi-tenant brand variations updated per Row 44
- Cross-reference to `telecheck-design-system/` design handoff bundle

**v1.1 Document control entry:** "v1.1 — 2026-XX-XX (per v1.10 promotion). Status flip from PROVISIONAL to Canonical for development. Per Evans's Option B decision 2026-04-28: DIC v1.0 → v1.1 folded into v1.10 cycle as Phase 5.6 / F49 alongside C3 brand-structure cascade. Patient mock v7 authoritative visual reference. Substitution flags preserved. v1.0 PROVISIONAL framing deprecated — DIC is now binding for development against the v7 mock pixel-exactly."

---

## Group 5D — Operational Readiness Tracker (3 matrix rows)

### Row 45 — OR-109 wording update (C3 brand)

OR-109 currently references "per-tenant unit economics (Heros + Telecheck-Ghana)". Update to "per-tenant unit economics (Telecheck-US [Heros Health DBA] + Telecheck-Ghana [Heros Health Ghana DBA])". Operating-tenant naming with consumer-DBA qualifier.

### Row 55 — OR Tracker new pre-launch decision items (C4 marketing)

Add 3 new OR items per ADR-027 v0.6:

- `OR-XXX-MKT-1` — Marketing copy governance lead designation (per Master PRD §24 row 16). Owner: Product Lead + Regulatory Affairs Lead. Required for emerging-market tenants.
- `OR-XXX-MKT-2` — First molecule-level marketing copy approval — Ghana (per Master PRD §24 row 17). Owner: Marketing copy governance lead + Clinical Safety Officer + Regulatory Affairs Lead. Per §13.2 Governance review process.
- `OR-XXX-MKT-3` — CCR marketing key initial values per country (per Master PRD §24 row 18). Owner: Engineering + Regulatory Affairs Lead. US: `prohibited` permanent; Ghana: `pending_evidence` pending regulatory engagement + `marketing_copy_governance_evidence` population per ADR-027 v0.6 + CCR_RUNTIME v5.2.

### Row 75 — OR Tracker research data pre-launch items (C5)

Add 5 new OR items per ADR-028 v0.5:

- `OR-XXX-RES-1` — Research Ethics Committee (REC) partnership designation — Ghana (per Master PRD §24 row 11). Owner: Privacy Officer + Telecheck-Ghana team. Candidates: Ghana Health Service REC, Noguchi Memorial Institute IRB.
- `OR-XXX-RES-2` — Research data-use consent text — drafted + ethics-reviewed (per Master PRD §24 row 12). Owner: Privacy Officer + Legal + REC partner. Required pre-launch (5th consent tier active at launch per §15.2).
- `OR-XXX-RES-3` — Data Sharing Agreement (DSA) template — legal-reviewed (per Master PRD §24 row 13). Owner: Legal + Privacy Officer. Required before first DSA activation (Release 2).
- `OR-XXX-RES-4` — De-identification standard — chosen + documented (per Master PRD §24 row 14). Owner: Engineering + Privacy Officer. Default: Safe Harbor + k-anonymity, k_min = 11 per CCR_RUNTIME v5.2 + I-029.
- `OR-XXX-RES-5` — Initial WHO/UN partner identification (per Master PRD §24 row 15). Owner: Product Lead + External Comms. Strategic — first partnership scope shapes Release 2 architecture priorities.

---

## Group 5E — Other docs (control-plane, external, IA, notification, messaging, build guide) (23 matrix rows)

Concise summary of edits — most are C2/C3/C5 propagation that mirror earlier groups:

- **Row 5, 14, 24, 79, 89** — `Telecheck_Reviewer_Brief_v1_0.md`: 4 things-that-matter expanded to 5 (Program catalog architecture per C6 + Brand structure per C3 + Research data partnership per C5 + Country-conditional marketing per C4 added as new orienting sections). Anchor market framing reframed: "Ghana is the anchor market" → "Telecheck-Ghana is the pilot market within emerging markets".
- **Row 12, 43** — `Telecheck_Notification_Spec_v1_1.md`: "WhatsApp-primary in Ghana" → "WhatsApp-primary in emerging markets (piloting with Telecheck-Ghana on 360dialog)". Sender display name examples updated: `'Heros' vs 'Telecheck-Ghana'` → `'Heros Health' (consumer DBA, US) vs 'Heros Health Ghana' (consumer DBA, GH)`.
- **Row 13, 22, 34** — `Telecheck_Ghana_Launch_Playbook_v1_2.md`: Concrete operational pilot artifact — Ghana references preserved as-is (this artifact is rightly Ghana-specific). Brand framing updated: "Telecheck Ghana" (consumer) → "Heros Health Ghana" (consumer DBA); operating tenant remains "Telecheck-Ghana".
- **Row 15, 23, 80** — `Telecheck_Investor_One_Pager.md`: "Anchor market: Ghana" → "Pilot market: Ghana, within emerging markets". Brand structure made explicit: emerging markets vertically integrated under Heros Health; B2B platform line under Telecheck. Posture A research data partnership added as Release 2 strategic capability.
- **Row 16, 25, 81, 90** — `Telecheck_Artifact_Registry_v2_9.md`: New entries per v1.10 cycle — registry change log v2.10 entry; brand discipline note (operating tenant `Telecheck-{country}` vs consumer DBA `Heros Health` distinction); research data artifacts (ADR-028, §15.3, new contracts); program catalog architecture artifacts (Master PRD §10.5, ProgramCatalogEntry type, ProgramMarketPolicy entity, Program Porting Checklist).
- **Row 19, 32** — `Telecheck_Patient_App_IA_v1_0.md`: Patient App displays consumer brand (Heros Health). IA documents brand-presentation distinction: app surfaces consumer DBA; operating tenant identifier is internal/B2B only. App naming: Heros Health (or unified app brand).
- **Row 26** — `CLAUDE_CODE_BOOT_SEQUENCE.md`: Add brand-structure note for reviewers. New paragraph in §1 reading order: "Brand vs identifier discipline: `Telecheck` = platform/B2B brand only (never consumer-facing); `Heros Health` = global consumer DBA (country-instanced via subdomains); operating tenants follow `Telecheck-{country}` naming. See Master PRD §17 for the canonical rule."
- **Row 30, 91** — `Telecheck_Engineering_Handoff_Build_Guide_v1_3.md`: Tenant identifier naming convention documented (`Telecheck-{country}` operating tenants; consumer DBA Heros Health country-instanced via subdomains). Reference to Master PRD §10.5 as architectural anchor for program catalog work.
- **Row 35** — `Telecheck_Messaging_Inbox_Spec_v1_0.md`: Verify patient-facing messages surface as Heros Health (or Heros Health Ghana, country-instanced). Sender brand framing aligned with C3 vocabulary.

---

## Group 5F — Country regulatory placeholders (4 matrix rows; 4 NEW files)

Per Phase 0 scope-reconciliation rows F-NEW-CRC, F-NEW-PCG, F-NEW-DSA, F-NEW-REC. All 4 are placeholder authoring tasks — minimal content at v1.10 acceptance; populated at per-country activation gate.

### Row 104 — `Telecheck_Country_Regulatory_Contracts.md` (NEW)

Document country regulatory contract evidence referenced in ADR-027 v0.6 Tier 2 activation requirements. Initial scope: Telecheck-Ghana entry (Ghana FDA + Pharmacy Council guidance review) populated when Tier 2 activation engages. US entry: not applicable (US `molecule_level_marketing_permitted = prohibited` permanent).

### Row 105 — `Telecheck_Pharmacy_Council_Guidance.md` (NEW)

Document Pharmacy Council (Ghana) guidance referenced in ADR-027 Tier 2 activation. Placeholder until Telecheck-Ghana per-country activation engages.

### Row 106 — `Telecheck_DSA_Template.md` (NEW)

Author DSA template referenced in ADR-028 v0.5 Activation requirements §4 + Master PRD §24 row 13. Legal-reviewed at pre-launch decision; first DSA activation post-Release-2.

### Row 107 — `Telecheck_REC_IRB_Engagement.md` (NEW)

Document REC/IRB partnership designation referenced in ADR-028 v0.5 Activation requirements §2 + Master PRD §24 row 11. Initial scope: Telecheck-Ghana → Ghana Health Service REC or Noguchi Memorial Institute IRB candidate; analogous bodies for future markets onboard with country expansion.

---

## Promotion process (Phase 6)

At v1.10 promotion, each row's edits land in the corresponding canonical bundle file. All slice PRDs, engineering specs, design artifacts, OR Tracker, and external/control-plane docs receive v1.10 cycle update entries in their respective document control sections.

The 4 country-regulatory placeholder files are added to the bundle at v1.10 promotion as new artifacts, listed in Artifact Registry v2.10 inventory.

---

## Document control (this delta artifact)

- **v1.0 — 2026-05-01** — Phase 5 reconciliation across 70 matrix rows in 6 groups (5A Slice PRDs / 5B Engineering specs / 5C DIC + Design / 5D OR Tracker / 5E Other docs / 5F Country regulatory placeholders). Documents proposed v1.10 cycle propagation edits per C2-C7 cycle cascades + DIC v1.0 → v1.1 promotion (Phase 5.6 / F49 fold-in per Evans Option B 2026-04-28).
- **Status:** RECONCILED — proposed Phase 5 contribution. Awaiting Codex Phase 5 EXIT review.
- **Lands canonically:** Phase 6 promotion folds each row's edits into the respective canonical bundle file.
