# ADR-028 — Research data partnership (Posture A) as Release 2 goal

**Status:** Accepted (v1.0 — Phase 6 promoted 2026-05-01 per Evans's "authorized" instruction; promoted from v0.5 DRAFT after Codex Phase 4 EXIT v0.2 verification CLOSED. Quad sign-off: Product Lead + Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer.)
**Date:** 2026-04-30 (drafted v0.1, patched v0.2 same-day); v0.3 cleanup 2026-05-01; v0.4 micro-cleanup 2026-05-01 per Codex v0.3 verification residue findings; v0.5 Phase 4 propagation 2026-05-01.
**Owners:** Product Lead + Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer (quad-sign-off)
**Supersedes:** Master PRD §21 entry on "clinical research data collection" — specifically, the matrix C5/F01 row that performs the canonical §21 rewrite (regulatory-conditional rewrite per planning freeze §3 Phase 2.8). Prior wording: "Clinical research data collection — absolute non-goal." Replacement wording (per C5 row): "Posture A research data partnership (de-identified longitudinal data export under DSAs to research partners) — in scope as Release 2 goal per ADR-028. Posture B trial execution platform (eCRF, IRB-managed protocols, sponsor reporting, randomization, blinding, query resolution, IND/IDE filings, monitoring visits) — remains absolute non-goal." (v0.3 patch — Codex finding cross-coherence LOW + new-v0.2-issue 7: explicit supersession scope replaces "implicitly amends" language to match ADR-027 quote-style.)
**Companion documents:**
- Master PRD §7.10 (Research data accessibility) — operational principle this ADR formalizes
- Master PRD §15.2 (Research data-use consent — fifth tier) — patient-facing consent mechanism
- Master PRD §15.3 (Research data governance) — full architectural detail canonicalized at Phase 2 close 2026-05-01 (was framed as "§X NEW" in pre-Phase-2 drafts; resolved to §15.3 at canonicalization)
- Master PRD §22 (Dependencies) — REC/IRB partnership + cross-border posture for research-use transfer
- Master PRD §24 (Pre-launch decisions) — rows 11, 12, 13, 14, 15 (REC partnership, consent text, DSA template, de-id standard, initial WHO/UN partner)
- INVARIANTS contract v5.2 — new I-029, I-030, I-031 (per Phase 3 group-1)
- AUDIT_EVENTS contract v5.2 — new research.* audit events (6 new: research.consent_granted/revoked, research.dsa_activated, research.cohort_defined, research.export_initiated, research.export_completed; export_* family at audit_sensitivity_level=high_pii per I-031; per Phase 3 group-1)
- DOMAIN_EVENTS, TYPES, GOVERNANCE_CONTROLS contracts v5.2 — new types and events (per Phase 3 group-2 + group-3)
- CDM v1.2 — new ResearchConsent, ResearchCohort, DataSharingAgreement, ResearchPartner, ResearchExportRequest entities
- ADR-024 (Country-driven configuration) — research-related CCR keys per country
- WORKLOAD_TAXONOMY contract — research-data export and aggregation workloads classify under governance class **`autonomy_grant_required`** per WORKLOAD_TAXONOMY §4.4 (each export/aggregation action requires a PolicyAuthorization-equivalent grant; in this case the active DSA + consent + I-029 k-threshold check + REC engagement; multi-party approval chain; rollback trigger = consent revocation or DSA expiry). v0.3 patch — Codex finding cross-coherence LOW-5: governance class named directly, not deferred.

---

## Context

Telecheck's strategic positioning includes partnership with WHO, UN agencies, and analogous multilateral bodies for emerging-market chronic-disease data. This is anchored at the Telecheck parent / platform level rather than at the Heros consumer brand level — partnership is institutional, not consumer-marketing.

The v1.6–v1.9 Master PRD §21 listed "clinical research data collection" as an absolute non-goal of the platform. That framing assumed a single research-platform model — trial-execution / sponsor-managed clinical research — and prohibited the platform from supporting research data flows in any form.

Three pressures push back on that absolute framing:

1. **Two distinct postures get conflated.** Trial execution (Posture B) and research data partnership (Posture A) are architecturally different:
   - **Posture A — Research data partner / population observatory.** De-identified longitudinal data export under Data Sharing Agreements (DSAs) to research partners. Aggregation layer for population-level statistics. Consent-driven, revocable, no care impact if declined. Partner uses the data; Telecheck is not the trial sponsor.
   - **Posture B — Trial execution platform.** eCRF-style data collection, IRB-managed protocols, sponsor reporting, randomization, blinding, query resolution, IND/IDE filings, monitoring visits. Telecheck would be the trial-execution platform.

   Posture B is a fundamentally different product with different regulatory and operational obligations. The platform's clinical-care thesis does not extend to trial execution. **Posture B remains an absolute non-goal.**

   Posture A is achievable on top of the existing platform substrate (audit append-only, tenant isolation, consent infrastructure, CDM, governance review). It is also strategically aligned with the WHO/UN partnership thesis. **Posture A is in scope as a Release 2 goal.**

2. **WHO/UN partnership requires a research data partner posture.** Multilateral bodies fund and operate population-health programs (NCD surveillance, chronic disease registries, pharmacovigilance signals) that need de-identified data flows under formal data-sharing arrangements. Without Posture A, Telecheck cannot deliver on the WHO/UN partnership thesis at the parent level.

3. **Patient consent is voluntary and revocable.** Posture A operates on a fifth consent tier (research data-use), which is optional, separately revocable, and has no care impact if declined. This is materially different from clinical data flows that are tied to care delivery.

The cost of doing nothing is real: Telecheck cannot deliver the WHO/UN partnership thesis; emerging-market chronic-disease data goes to research partners through other platforms or doesn't get shared at all; the strategic positioning at the parent/B2B brand level loses its research data foundation.

The cost of accepting Posture B is also real: trial execution is a different product, with regulatory obligations (FDA IND/IDE, EMA, MDC) and operational obligations (eCRF, query resolution, monitoring) that the platform's clinical-care thesis is not designed to deliver. Conflating Posture A and Posture B is the failure mode the v1.6–v1.9 §21 absolutism was guarding against.

## Decision

**Adopt Posture A (research data partnership / population observatory) as a Release 2 goal. Maintain Posture B (trial execution platform) as an absolute non-goal.**

Specifically:

1. **Posture A scope (in scope as Release 2 goal):**
   - Cohort definition layer (research partner specifies inclusion/exclusion criteria; platform produces matching de-identified cohort)
   - De-identified longitudinal data export under DSAs (Safe Harbor + k-anonymity de-identification)
   - Aggregation layer for population-level statistics (counts, distributions, longitudinal trends; no patient-level data leaves the aggregation)
   - Consent-driven (5th consent tier per Master PRD §15.2); revocable; no care impact if declined
   - Audit-traced per I-027 + new I-029/I-030/I-031

2. **Posture B scope (out of scope; remains absolute non-goal):**
   - Trial randomization, blinding
   - eCRF-style data collection
   - IRB-managed protocols (where Telecheck is the IRB-overseen platform)
   - Sponsor reporting (Telecheck does not become a clinical trial sponsor)
   - IND/IDE filings, regulatory submissions on behalf of trial sponsors
   - Query resolution, monitoring visits
   - Trial-execution-platform business model

3. **Anchored at Telecheck parent / platform level.** WHO/UN partnerships are negotiated and held at Telecheck-the-parent level, not at the Heros Health consumer brand level. Patients consent at the operating-tenant level (via the operating tenant's Heros Health DBA surfaces — `heroshealth.com` for Telecheck-US; `ghana.heroshealth.com` for Telecheck-Ghana); data flows through Telecheck-the-parent governance for partnership use. This is the architectural foundation per C5 cycle. v0.5 patch — Phase 4 propagation: brand framing aligned with C3 brand-structure cleanup (operating-tenant naming `Telecheck-{country}`; consumer DBA `Heros Health` country-instanced).

4. **Three new platform invariants** (per Master PRD §14 and INVARIANTS contract v5.2 per Phase 3 group-1; v0.2 patch — renumbered to non-conflicting IDs per Codex finding HIGH-1; existing canonical INVARIANTS contract uses I-024 cross-tenant break-glass, I-025 information-leak prevention, I-026 tenant configuration governance, I-027 audit envelope, I-028 single physical region):
   - **I-029** Research data export requires active DSA + active research consent + k-anonymity threshold ≥ k_min met. Each export has a `data_sharing_agreement_id` + `cohort_id` + `consent_provenance` + `k_threshold_used` audit trail. **k_min default at v1.10 acceptance: k=11** (HIPAA expert-determination low-risk floor; per-DSA increases permitted via `data_sharing_agreement.k_threshold_override` ≥ k_min; decreases below k_min prohibited). Suppression rule: any cohort cell with count < k_min is suppressed in aggregation outputs (not silently merged).
   - **I-030** Research consent declination has zero impact on care delivery. Patients who decline the 5th consent tier receive identical care, identical pricing, identical clinician access. Enforcement: care-path code MUST NOT branch on `research_consent_status`; audit reviewer can verify by trace.
   - **I-031** Research data export is fully audited with cohort definition, k-threshold actually used, requester identity, DSA reference, export timestamp, cryptographic export receipt, AND a per-export `audit_sensitivity_level: high_pii` marker (per audit-category guidance — research exports MUST emit at the high-sensitivity audit class, not ordinary governance class B; v0.2 patch per Codex finding MEDIUM-7).

5. **6 new audit events** (research.cohort_defined, research.export_initiated, research.export_completed, research.consent_granted, research.consent_revoked, research.dsa_activated). Audit category: **B for consent events; high-sensitivity (per I-031) for export events.** v0.2 patch per Codex finding MEDIUM-7 — longitudinal health data exports under DSAs require stronger audit treatment than ordinary governance events.

6. **New CCR keys** (per ADR-024 + planning freeze §3.1; v0.2 patches per Codex finding MEDIUM-6: structured ethics review body, not bare string):
   - `research_data_partnership_active: enum` (values: `inactive`, `consent_only`, `active`; replaces prior bool to support the three-state activation model — see §Activation states below; v0.2 patch per Codex finding cross-coherence MEDIUM-2)
   - `research_ethics_review_body: object` (structured: `{name: string, jurisdiction: string, approval_reference_id: string, approval_validity_from: date, approval_validity_to: date, approval_scope: string, per_dsa_review_required: bool}`; replaces bare string per Codex finding MEDIUM-6)
   - `cross_border_research_transfer_permitted: enum` (values: `prohibited`, `permitted_with_counsel_artifact`, `permitted_unrestricted`; with companion fields when permitted: `counsel_approval_artifact_id`, `transfer_mechanism`, `recipient_country`, `onward_transfer_policy: enum`, `dsa_alignment_artifact_id`; v0.2 patch per Codex finding MEDIUM-9)
   - `de_identification_standard: enum` (Safe Harbor, Safe Harbor + k-anonymity, custom; combined with `k_threshold_min: int` defaulting to 11 per I-029)
   - `research_permitted_data_domains: list<enum>` (allowed values: `chronic_disease_longitudinal`, `ncd_surveillance`, `pharmacovigilance_signal`, `population_health_aggregate`; default empty; per-DSA expansion not permitted without ADR amendment per Codex finding HIGH-4)

7. **New CDM entities** (per planning freeze §3.5; v0.2 patch per Codex finding LOW-10: entity list reconciled — DeIdentificationLevel was inconsistently listed): ResearchConsent, ResearchCohort, DataSharingAgreement, ResearchPartner, ResearchExportRequest. **DeIdentificationLevel** is a TYPES enum (not an entity), defined in TYPES contract as values: `safe_harbor`, `safe_harbor_plus_k_anonymity`, `custom`.

8. **New state machines:**
   - ResearchConsent: pending → granted → revoked
   - DataSharingAgreement: draft → in_review → active → expired → renewed
   - ResearchExportRequest: queued → processing → ready → delivered → expired

9. **New RBAC roles:** Research Data Steward, Research Ethics Committee Member (read-only oversight), External Research Partner (highly scoped).

10. **System Architecture gains a research data export module.** Cohort definition layer, de-identification engine, aggregation layer, DSA enforcement, export audit. Positioned alongside Care Delivery and Governance modules per System Architecture v1.2 amendment in C5 cycle.

## Activation states (v0.2 — three-state model per Codex finding cross-coherence MEDIUM-2)

`research_data_partnership_active` is an enum with three values reflecting the practical reality that consent infrastructure is live before any data flows:

| State | Meaning | What's allowed | What's prohibited |
|---|---|---|---|
| `inactive` | Default at v1.0 launch in any country that has not begun activation. | None — patients see no 5th consent prompt; no exports; no DSA enforcement. | All research-related flows. |
| `consent_only` | 5th consent tier active in patient-facing flow. Patients can grant or decline consent. **No exports yet.** | Patient consent collection per Master PRD §15.2; consent grant/revoke audit events; care delivery completely independent of consent status (I-030). | Any data export, any DSA activation, any cohort definition for export purposes, any de-identification engine invocation. |
| `active` | Full Release 2 capability per Activation requirements below. | All Posture A in-scope items. | All Posture B items + secondary uses outside DSA scope. |

The `consent_only` state exists explicitly to address the consent-timing concern (Codex finding HIGH-3): consent text MUST clearly state that no exports occur in the `consent_only` state and that future-use governance is the `active` state's DSA + activation gate apparatus. Patients who grant consent in `consent_only` state retain full revocation rights at all times; revocation in `consent_only` state is honored by removing the consent record and ensuring no future export includes the patient's data.

## Activation requirements (Release 2 — `active` state)

ADR-028 is **accepted at v1.10 promotion**, but per-country **activation of `research_data_partnership_active: active`** is a Release 2 capability. Each country activation requires (per country):

1. **5th consent tier (research data-use) live** in patient-facing consent flow. Per Master PRD §15.2 and Consent & Delegated Access Slice (F28). Pre-launch decision §24 row 12 (research consent text drafted + ethics-reviewed).
2. **REC/IRB partnership designated** (Master PRD §24 row 11). Ghana: GHS REC or Noguchi Memorial Institute IRB. Future markets: analogous bodies.
3. **De-identification engine implemented** (Safe Harbor + k-anonymity per chosen standard). Pre-launch decision §24 row 14.
4. **DSA template legal-reviewed** (Master PRD §24 row 13). Per Phase 0 scope-reconciliation row F-NEW-DSA.
5. **Initial WHO/UN partner identified** (Master PRD §24 row 15). Strategic — first partnership scope (NCD program, surveillance, etc.) shapes Release 2 architecture priorities.
6. **Cross-border posture for research-use transfer** populated per country in CCR `cross_border_research_transfer_permitted` (enum + companion structured fields per Decision §6). Required structured fields before activation: `counsel_approval_artifact_id`, `transfer_mechanism`, `recipient_country`, `onward_transfer_policy`, `dsa_alignment_artifact_id`. The legacy **[COUNSEL-REQUIRED]** marker (from Master PRD §22.3 in earlier framing) is replaced by these structured fields; activation gate is structured-field completeness, not a free-text flag. (v0.3 patch — Codex finding MEDIUM-9: structured fields enforce activation gate beyond [COUNSEL-REQUIRED] flag.)
7. **Multi-party clinical safety + privacy review.** Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer triple sign-off on the per-country activation.

## Consequences

**Positive:**

- **WHO/UN partnership thesis deliverable.** Telecheck-the-parent gains an architecturally-supported posture for institutional research data partnerships.
- **Emerging-market chronic-disease data accessible** under consent-driven, de-identified, governed flow. Population-health programs (NCD surveillance, chronic disease registries) can use Telecheck data via DSAs.
- **Patient autonomy preserved.** 5th consent tier is voluntary, separately revocable, no care impact if declined (I-030).
- **Audit traceability mandated** (I-029, I-031). Every export traces to DSA + consent + cohort + k-threshold.
- **Posture A vs Posture B distinction** preserved. Trial execution remains an absolute non-goal; the failure mode the v1.6–v1.9 §21 absolutism was guarding against is preserved.

**Negative / costs:**

- **Substantial new architectural surface at v1.10 acceptance** (canonical contract edits only; not Release 2 implementation). New CCR keys, new audit events, new domain events, new types, new state machines, new RBAC roles, new System Architecture module, new invariants. The contract edits at v1.10 cycle account for ~25 matrix rows. **Release 2 implementation work (de-identification engine, cohort definition layer, aggregation layer, DSA enforcement, export audit) is a separate larger workstream owned post-v1.10**, not included in the v1.10 cycle effort estimate. (v0.3 patch — Codex finding MEDIUM-8: separate v1.10 canonical contract edits from Release 2 implementation obligations explicitly.)
- **Cross-border regulatory engagement required per country.** Ghana DPC, future analogous regimes, sub-processor disclosures, Counsel-required privacy reviews. Slower than engineering work.
- **REC/IRB partnership negotiation required.** Strategic dependency; gates Release 2 activation. Cannot be rushed.
- **De-identification standard choice has long-tail consequences.** Safe Harbor + k-anonymity is the default; once implemented and partners onboard, switching standards is expensive. Pre-launch decision §24 row 14.
- **Reviewer cognitive load.** Reviewers must distinguish Posture A (in scope) from Posture B (out of scope) on every research-related design question. Master PRD §15.3 (Research Data Governance) section codifies this distinction.
- **Risk of scope creep into Posture B.** Mitigated by explicit Decision §2 and Master PRD §15.3 Posture A vs Posture B distinction. Codex adversarial review at every phase exit catches drift.

## Posture A scope (explicit in / out)

**In scope (Posture A):**

| Item | Status at v1.10 acceptance | Active at Release 2 |
|---|---|---|
| Cohort definition layer | Architecture defined; not implemented | Yes, per country activation |
| De-identified longitudinal data export under DSAs | Architecture defined; not implemented | Yes, per country activation |
| Aggregation layer for population-level statistics | Architecture defined; not implemented | Yes, per country activation |
| 5th consent tier (research data-use) | **`inactive` at v1.0 launch in all countries** (patch 2026-05-02 per Codex Round-4 Scope 3 HIGH-2 finding aligning with CCR_RUNTIME v5.2 launch defaults). Consent prompt does NOT render until the per-country `inactive → consent_only` activation gate passes (REC approval reference + ethics-reviewed consent text version pin per §24 row 12 + Country Launch Director sign-off per MARKET_LAUNCH v5.1). | Live (per country, after `inactive → consent_only` activation) |
| Consented participation (revocable, no care impact) | **`inactive` at v1.0 launch** (no consent collection until per-country `consent_only` activation; once active, opt-in only, separately revocable, zero care impact per I-030) | Live (per country, after activation) |
| Audit per I-029/I-030/I-031 + new research.* events | **`inactive` at v1.0 launch** for consent-related events (`research.consent_granted` / `research.consent_revoked` do NOT emit until per-country `consent_only` activation); export-related events at Release 2 (per `consent_only → active` activation) | Full at Release 2 (per country, after `consent_only → active` activation) |
| REC/IRB ethics review at Ghana level (or analogous per market) | Designated pre-launch (§24 row 11) | Engaged at Release 2 activation |
| DSA template legal-reviewed | Pre-launch decision (§24 row 13) | Required before first DSA activation |
| De-identification engine (Safe Harbor + k-anonymity) | Standard chosen pre-launch (§24 row 14) | Implemented at Release 2 |

**Out of scope (Posture B — remains absolute non-goal; v0.2 patch tightens boundary per Codex finding HIGH-5):**

- Trial randomization
- eCRF-style data collection
- IRB-managed protocols (where Telecheck is the IRB-overseen platform)
- Sponsor reporting (Telecheck does not become a clinical trial sponsor)
- IND/IDE filings, regulatory submissions on behalf of trial sponsors
- Query resolution, monitoring visits
- Blinding (single-blind, double-blind, triple-blind)
- Trial-execution-platform business model
- Per-patient interventional protocol execution under research framework
- Drug-development clinical trials
- Phase I-IV pharmaceutical clinical trials infrastructure
- **Partner-driven protocolized cohort recruitment.** Research partners may specify inclusion/exclusion criteria for de-identified cohort definition (Posture A), but cannot drive recruitment of patients into a partner-defined protocol via the platform's care-delivery surfaces. Recruitment messaging from partners is not a Posture A capability.
- **Prospective observational studies that alter or instrument care workflows.** If a partner needs additional data points beyond what platform care normally collects (extra labs, patient-reported outcomes, diary entries), that is Posture B territory and requires a separate ADR.
- **Post-market studies that change prescribing or follow-up behavior.** Pharmacovigilance signal flow (aggregate, audit-trail-driven) is Posture A; post-market study protocols that drive clinician or patient behavior changes are Posture B.
- **Partner requests that alter care workflows.** Any DSA term that requires the platform's care path to behave differently for consented research participants (timing of follow-ups, extra screening, modified treatment recommendations) is Posture B.
- **Patient-level identifiers in any export.** All exports go through de-identification per I-029. Re-identification, secondary linkage to external datasets, and pseudonymization without de-identification are Posture B.
- **Secondary uses outside DSA scope.** A partner cannot use exported data for purposes not explicitly enumerated in the DSA. Partner-side onward transfer is governed by `cross_border_research_transfer_permitted.onward_transfer_policy`.

**The Posture A / Posture B boundary is bright-line.** If a proposed feature crosses into Posture B, it requires a separate ADR superseding the relevant scope language in this ADR-028. The default decision is to keep Posture B out of scope.

## Activation mechanism

ADR-028 is activated by:

1. v1.10 promotion ceremony executing all C5 matrix rows (25 rows, largest single block)
2. ADR-028 written into ADR Set v1.0 supplementary index entry
3. Promotion Ledger entry (within v1.10's P-XXX entry, or standalone P-XXX)
4. Artifact Registry v2.10 inventory listing ADR-028
5. Active Document Index v1.0 referencing ADR-028 in §3 architecture section
6. Boot Sequence reading order including ADR-028 in §1 list
7. INVARIANTS contract amended with I-029, I-030, I-031 (triple-sign-off: Privacy Officer + Engineering + Clinical Safety Officer per planning freeze §3.7)
8. AUDIT_EVENTS, DOMAIN_EVENTS, TYPES, GOVERNANCE_CONTROLS contracts amended
9. CDM v1.2 amended with research entities; State Machines v1.1 amended with research lifecycles
10. CCR Runtime contract amended with research_* keys
11. System Architecture v1.2 amended with research data export module
12. Master PRD §7.10 + §15.2 + §15.3 (Research data governance) + §22.3 + §24 (rows 11-15) reflect the Posture A framing per the C5 cycle edits (post-Phase-2 canonicalization 2026-05-01)
13. RBAC Permissions Matrix v1.1 amended with research roles

**Per-country activation of `research_data_partnership_active: active`** is a Release 2 capability requiring all Activation requirements above per country, plus the canonical ADR-028 v0.4 quad sign-off (**Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer + Product Lead**) — patch 2026-05-02 per Codex Round-2 Scope 3 MEDIUM-1 finding (prior wording omitted Product Lead, conflicting with MARKET_LAUNCH v5.1 condition 9 + CCR_RUNTIME v5.2 change-control row + RBAC v1.1 v1.10 cycle additions). Country Launch Director sign-off is **separately required** per MARKET_LAUNCH v5.1 condition 11 (per-country launch authority; distinct from the quad sign-off). REC concurrence per `research_ethics_review_body.per_dsa_review_required` is also separately required when applicable.

## What is NOT decided here

- **Specific WHO/UN partner identity.** Master PRD §25 open question; resolves at first WHO partnership conversation. ADR-028 does not commit Telecheck to any specific partnership.
- **First partnership scope within `research_permitted_data_domains` enum.** Master PRD §25 open question; resolves at first WHO partnership conversation. (Note: this is selection *within* the closed enum; expansion *of* the enum requires ADR amendment per Decision §6.)
- **Specific de-identification engine implementation.** ADR-028 specifies Safe Harbor + k-anonymity as the standard with k_min=11 default per I-029; engineering implementation details (specific suppression algorithm, attribute generalization rules, etc.) land at Release 2.
- **Per-market REC/IRB engagement specifics.** ADR-028 names Ghana GHS REC or Noguchi Memorial Institute IRB as the candidates; final selection happens at per-country activation gate via the structured `research_ethics_review_body` CCR object per Decision §6.
- **DSA template specific text.** ADR-028 names DSA template as a pre-launch decision (§24 row 13); template text is legal-reviewed work, not architectural decision.
- **Per-DSA k-threshold above k_min.** k_min=11 is fixed at v1.10 acceptance per I-029. Per-DSA increases (e.g., k=20 for high-sensitivity research domains) are permitted at DSA negotiation; decreases below k_min are prohibited. (v0.3 patch — Codex finding HIGH-2 residue: stale text saying "threshold value undecided" removed; k_min is decided.)
- **Per-country activation timing of `research_data_partnership_active: active` state.** Per-country activation is Release 2 work; v1.0 launches with the architecture defined and consent tier infrastructure available (`consent_only` state). No country activates `active` state at v1.0.

## References

- **Master PRD §7.10** Research data accessibility (operational principle this ADR formalizes)
- **Master PRD §15.2** Research data-use consent (5th tier)
- **Master PRD §15.3** Research Data Governance (full architectural detail; ~30 lines authored in C5 cycle)
- **Master PRD §21** Non-goals (Posture A removed from absolute non-goal list; Posture B remains)
- **Master PRD §22.3** Cross-border posture for research-use transfer
- **Master PRD §24** Pre-launch decisions rows 11–15 (REC partnership, consent text, DSA template, de-id standard, initial WHO/UN partner)
- **Master PRD §25** Open questions (specific WHO program scope; first DSA target)
- **INVARIANTS contract v5.2** I-029, I-030, I-031 (new — per Phase 3 group-1)
- **AUDIT_EVENTS contract v5.2** research.* events (6 new — per Phase 3 group-1; export_* family at audit_sensitivity_level=high_pii per I-031)
- **DOMAIN_EVENTS, TYPES, GOVERNANCE_CONTROLS contracts v5.2** (amended — per Phase 3 group-2 + group-3)
- **CDM v1.2** new research entities
- **State Machines v1.1** new research lifecycles
- **CCR Runtime contract** v5.2 (amended for research block — 7 keys: `research_data_partnership_active` 3-state enum, `research_permitted_data_domains` closed-enum country gate, `research_ethics_review_body` structured object, `de_identification_standard`, `k_min_default`, `cross_border_research_transfer_permitted` enum, `cross_border_research_transfer_evidence` companion structured object; per Phase 3 group-2)
- **System Architecture v1.2** (research data export module)
- **RBAC Permissions Matrix v1.1** (research roles)
- **Consent & Delegated Access Slice PRD** F28 (5th consent tier mechanics)
- **AI Clinical Assistant Slice PRD** F22 — **AI-generated / derived patient summaries (Mode 2 outputs) are NOT in Posture A export scope by default.** v0.2 patch per Codex finding LOW-11. Including derived/AI-generated content in exports requires (a) explicit consent text that names AI-generated content as part of the export scope, (b) DSA scope enumerating AI-generated fields with provenance metadata, (c) de-identification rules that account for AI-content drift, and (d) a separate ADR amendment if derived content is to flow regularly. Default is exclusion; inclusion is per-DSA opt-in.
- **Phase 0 scope-reconciliation rows** F-NEW-DSA (DSA Template) and F-NEW-REC (REC/IRB Engagement)

## Document control

- **v0.1 DRAFT — 2026-04-30** — Initial skeleton authored as Phase 4 prep per Evans's directive 2026-04-30 (parallel-track to Phase 0 walk). Quad-sign-off required at Phase 4 (Product Lead + Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer).
- **v0.2 DRAFT — 2026-04-30** — Patched per Codex pre-acceptance review (Codex_ADR_027_028_PreAcceptance_Review_2026-04-30.md). Changes:
  - **HIGH-1 (invariant ID collision):** Renumbered new research invariants from I-024/025/026 to I-029/030/031 (next available after canonical I-028 "Single physical region"). Existing canonical I-024 (cross-tenant break-glass), I-025 (information-leak prevention), I-026 (tenant configuration governance) remain untouched. Companion Planning Freeze v1.4 hotfix renumbers across §3.7, §4, §6, §7.
  - **HIGH-2 (k-threshold pinned):** I-029 now requires k_threshold ≥ k_min with k_min default = 11 at v1.10 acceptance (HIPAA expert-determination low-risk floor). Per-DSA increases permitted; decreases prohibited. Suppression rule for cells below k_min added.
  - **HIGH-3 (consent timing):** Three-state activation model added (`inactive`, `consent_only`, `active`); consent text explicitly states no exports occur in `consent_only` state and names future-use governance as DSA + activation gate.
  - **HIGH-4 (permitted data domains):** New CCR key `research_permitted_data_domains` (closed enum: chronic_disease_longitudinal, ncd_surveillance, pharmacovigilance_signal, population_health_aggregate). Per-DSA expansion not permitted without ADR amendment.
  - **HIGH-5 (Posture B boundary tightened):** Added 6 explicit Posture B exclusions: partner-driven cohort recruitment, prospective observational studies altering care workflows, post-market studies altering prescribing/follow-up behavior, partner requests altering care workflows, patient-level identifiers in any export, secondary uses outside DSA scope.
  - **MEDIUM-6 (research_ethics_review_body structured):** Replaced bare string with structured object (name, jurisdiction, approval_reference_id, validity period, scope, per_dsa_review_required).
  - **MEDIUM-7 (audit category):** Research export events emit at high-sensitivity audit class per new I-031, not ordinary governance B; consent events remain at B.
  - **MEDIUM-8 (v1.10 vs Release 2 scope):** Activation states clarify what is canonical contract surface at v1.10 acceptance vs Release 2 implementation obligations.
  - **MEDIUM-9 (cross-border activation gate hardened):** `cross_border_research_transfer_permitted` now an enum with companion fields (counsel_approval_artifact_id, transfer_mechanism, recipient_country, onward_transfer_policy, dsa_alignment_artifact_id) replacing bare bool + [COUNSEL-REQUIRED] marker.
  - **LOW-10 (entity list reconciled):** DeIdentificationLevel clarified as TYPES enum, not CDM entity.
  - **LOW-11 (Mode 2 derived summaries):** Explicit default-exclusion rule for AI-generated patient summaries; inclusion is per-DSA opt-in with consent + provenance + de-id rules + separate ADR amendment if regular flow.
  - **Cross-coherence MEDIUM-3 (vocabulary normalization):** Three-state enum replaces bool for activation; aligns fail-closed semantics with ADR-027 v0.2.
- **v0.3 DRAFT — 2026-05-01** — Cleanup per Codex v0.2 verification findings (residue from v0.2 patches). Changes:
  - **HIGH-2 residue (k-threshold contradiction):** "What is NOT decided §6" updated — k_min=11 is decided; per-DSA increases (within bounds) are what's open. Stale "k=5, k=10, k=20" undecided text removed.
  - **HIGH-4 residue (permitted domains contradiction):** Open Questions section updated — closed-enum decision marked RESOLVED; "leave open subject to DSA scope" working-answer text replaced with the actual closed-enum framing. Per-DSA selection happens within the enum, not expansion of it.
  - **MEDIUM-8 residue (v1.10 vs Release 2):** Consequences/Negative reframed — separates ~25 contract-edit rows at v1.10 acceptance from Release 2 implementation work; "60% of v1.10 effort" framing dropped.
  - **MEDIUM-9 residue ([COUNSEL-REQUIRED] flag):** Activation requirements §6 now requires structured CCR fields (`counsel_approval_artifact_id`, `transfer_mechanism`, `recipient_country`, `onward_transfer_policy`, `dsa_alignment_artifact_id`) before activation, replacing the bare [COUNSEL-REQUIRED] marker.
  - **Enum/bool mismatch (new v0.2 issue 6):** All references to `research_data_partnership_active: true` replaced with `research_data_partnership_active: active`.
  - **Cross-coherence MEDIUM-4 (Phase 0 acceptance vs activation):** §24 row distinctions cleaner — pre-launch decision rows enable v1.10 acceptance; per-country activation requires the structured CCR fields.
  - **Cross-coherence LOW-5 (WORKLOAD_TAXONOMY governance class):** Companion documents now name `autonomy_grant_required` directly per WORKLOAD_TAXONOMY §4.4.
  - **Supersedes (new v0.2 issue 7):** Header now uses explicit prior-wording / replacement-wording quote-style matching ADR-027.
- **v0.4 DRAFT — 2026-05-01** — Micro-cleanup per Codex v0.3 verification new-issue 2: Open Questions final bullet on cross-border posture rewritten to reference the structured `cross_border_research_transfer_permitted` CCR enum + companion fields (counsel approval artifact ID, transfer mechanism, recipient country, onward-transfer policy, DSA alignment) per Decision §6 / Activation requirements §6. Removes the residual `[COUNSEL-REQUIRED]` markers reference that conflicted with the v0.3 structured-field activation model.
- **v0.5 DRAFT — 2026-05-01** — Phase 4 propagation pass per Phase 2 + Phase 3 canonicalization cleanup. Changes:
  - **Master PRD §X NEW references → §15.3** (4 occurrences in Companion documents + Decision § references + Consequences + References) per Phase 2 close. The new section is canonically §15.3 "Research data governance" in v1.10.
  - **Contract version bumps v5.1 → v5.2** (4 occurrences: INVARIANTS, AUDIT_EVENTS, DOMAIN_EVENTS/TYPES/GOVERNANCE_CONTROLS, CCR Runtime) per Phase 3 close. AUDIT_EVENTS reference now enumerates 6 research events with `audit_sensitivity_level=high_pii` per I-031. CCR Runtime reference now enumerates the 7-key research block including `research_permitted_data_domains` closed-enum country gate (added per Phase 3 group-2 HIGH-1) and `cross_border_research_transfer_evidence` companion structured object.
  - **C3 brand-structure cleanup propagation** in Decision §3 — "Heros consumer brand level" → "Heros Health consumer brand level"; "via Heros surfaces" → "via the operating tenant's Heros Health DBA surfaces (heroshealth.com for Telecheck-US; ghana.heroshealth.com for Telecheck-Ghana)" per Phase 2 §1/§2/§17 cleanup.
- **Status:** DRAFT — not canonical until v1.10 promotes. On promotion, this file moves into the spec bundle as `Telecheck_ADR_028_Research_Data_Partnership_Posture_A.md` (drop _DRAFT) and bumps to Status: Accepted.
- **Open questions:**
  - Should Posture A activation be gated at the platform level (single global decision) or at the per-country level (each market activates independently)? (Working answer: per-country, via CCR `research_data_partnership_active` key. Platform-level architecture is universal; per-country activation is the deployment gate.)
  - Should the 5th consent tier be live at v1.0 launch even before any country activates research data partnership? (Working answer: yes — consent tier is patient-autonomy infrastructure; consent can be granted in advance of any export. Decline-no-impact rule (I-030) means no patient burden.)
  - ~~Should ADR-028 enumerate specific permitted research data domains?~~ **RESOLVED in v0.2 / v0.3:** Decision §6 establishes a closed enum (`research_permitted_data_domains`) with values: `chronic_disease_longitudinal`, `ncd_surveillance`, `pharmacovigilance_signal`, `population_health_aggregate`. Expansion of the enum requires ADR amendment. Per-DSA selection happens within the enum.
  - Does ADR-028 require a separate Cross-Border Data Transfer ADR for the research-use transfer leg, or is the cross-border posture handled per ADR-026 / Master PRD §22.3? (Working answer: handled per ADR-026 + §22.3 with the **structured `cross_border_research_transfer_permitted` CCR enum + companion fields** per Decision §6 / Activation requirements §6 — counsel approval artifact ID, transfer mechanism, recipient country, onward-transfer policy, DSA alignment. Activation gate is structured-field completeness, not free-text [COUNSEL-REQUIRED] markers. No separate ADR unless cross-border posture changes substantially. v0.4 patch — Codex finding new-v0.3 issue 2.)
