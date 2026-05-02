# ADR-027 — Country-conditional DTC marketing posture

**Status:** Accepted (v1.0 — Phase 6 promoted 2026-05-01 per Evans's "authorized" instruction; promoted from v0.6 DRAFT after Codex Phase 4 EXIT v0.2 verification CLOSED. Triple sign-off: Product Lead + Regulatory Affairs Lead + Clinical Safety Officer.)
**Date:** 2026-04-30 (drafted v0.1, patched v0.2 same-day); v0.3 cleanup 2026-05-01; v0.4 micro-cleanup 2026-05-01; v0.5 final residue removal 2026-05-01 per Codex v0.4 verification; v0.6 Phase 4 propagation 2026-05-01.
**Owners:** Product Lead + Regulatory Affairs Lead + Clinical Safety Officer (triple-sign-off)
**Supersedes:** Master PRD §21 entry on "DTC molecule-level marketing" — specifically, the matrix C4/F01 row that performs the canonical §21 rewrite (regulatory-conditional rewrite per planning freeze §3 Phase 2.8). Prior wording: "DTC prescription marketing — absolute non-goal in all jurisdictions." Replacement wording (per C4 row, post-Phase-2-canonicalization): "Direct-to-consumer molecule-level prescription marketing in the US — prohibited per FDA + state telehealth advertising rules. Direct-to-consumer molecule-level prescription marketing in emerging markets — country-conditional, per ADR-027 + per-country CCR `molecule_level_marketing_permitted` 3-state enum activation gate (`prohibited` / `pending_evidence` / `permitted`); subject to platform safety floor + §13.2 Marketing copy governance (including the Governance review process internal subsection)." (v0.2 patch — Codex finding MEDIUM-4: explicit supersession scope; v0.6 patch — §13.6 normalized to §13.2 per Phase 2 cleanup; "prescription" carve-out per Master PRD §17 — FDA regulatory term retained.)
**Companion documents:**
- ADR-005 (Protocolized autonomy) — remains binding regardless of marketing posture; safety floor (interaction engine, herb-drug, fake-med, clinician sign-off) gates prescription fulfillment in every country
- ADR-024 (Country-driven configuration) — per-country policy lives in CCR
- Master PRD §7.9 (Harm-reduction marketing posture for emerging markets) — operational principle this ADR formalizes
- Master PRD §13.2 (Marketing copy governance, including the Governance review process internal subsection) — operator-side governance review framework for emerging-market marketing
- Master PRD §21 (Non-goals — regulatory-conditional rewrite) — the C1 rewrite that introduced the regulatory-conditional framing this ADR codifies
- WORKLOAD_TAXONOMY contract — marketing copy governance review classifies under governance class **`protocol_authorized`** per WORKLOAD_TAXONOMY §4.4 (named, versioned approval cadence; clinician/regulatory accountability via §13.2 Governance review process governance review apparatus). v0.3 patch — Codex finding LOW-8 residue: governance class named directly; "(future)" qualifier removed.

---

## Context

The v1.6–v1.9 Master PRD §21 listed "DTC prescription marketing" as an absolute non-goal of the platform. That framing assumed a single regulatory regime — the FDA DTC rules, US state telehealth advertising restrictions — and prohibited the platform from supporting molecule-level marketing surfaces in any tenant.

Two pressures push back on that absolute framing:

1. **Emerging-market harm-reduction calculus.** In markets where the counterfactual to platform-mediated prescription is unmediated pharmacy purchase (no clinician contact, no interaction screening, no fake-medication detection, no continuity of care), banning molecule-level marketing increases harm rather than reducing it. The platform's safety floor (interaction engine, herb-drug engine, fake-medication detection, clinician sign-off, audit trail) is exactly the harm-reduction mechanism that is *missing* from unmediated pharmacy purchase. Marketing surfaces that direct patients into the platform's mediated pathway therefore *reduce* aggregate harm in markets where the alternative is unmediated.

2. **Per-country regulatory posture varies.** US (FDA + state) prohibits molecule-level DTC for prescription drugs in most contexts. Ghana (FDA Ghana + Pharmacy Council) has different and more permissive regulatory boundaries, conditional on safety-floor compliance. Future emerging markets (Nigeria NAFDAC, Kenya PPB, etc.) will have their own regulatory boundaries. A platform-wide absolute non-goal cannot accommodate this variability.

The cost of doing nothing is real: acquisition slice surfaces in emerging markets cannot deliver the harm-reduction outcome the platform is positioned to provide; Master PRD §21 absolutism contradicts §7.9 emerging-market reality and §13.2 marketing-copy-governance machinery (including the Governance review process internal subsection).

The cost of repealing the §21 prohibition entirely is also real: the platform would lose the deterministic safety-floor that prevents acquisition surfaces from undermining the very mediated-pathway thesis the platform exists to deliver.

## Decision

**Replace the absolute §21 prohibition with a country-conditional posture, governed by the CCR.**

Specifically:

1. **Per-country policy in CCR governs whether molecule-level marketing is permitted.** New CCR keys (per WORKLOAD_TAXONOMY companion / planning freeze §3.1; v0.2 patch per Codex finding HIGH-1: enum replaces bool to support fail-closed three-state model):
   - `molecule_level_marketing_permitted: enum` (values: `prohibited`, `pending_evidence`, `permitted`; default `prohibited`. Fail-closed: any value other than explicit `permitted` denies molecule-level marketing surfaces.)
   - `marketing_governance_review_cadence_months: int` (cadence at which approved marketing copy is re-reviewed against §13.2 Governance review process governance)
   - `marketing_copy_governance_evidence: object` (structured: `{regulatory_jurisdiction: string, regulatory_authority: string, regulatory_interpretation_artifact_id: string, interpretation_date: date, scope: string, prohibited_claim_classes: list<string>, governance_lead_designation_artifact_id: string}`; v0.2 patch per Codex finding HIGH-3: regulatory mapping must be evidenced before activation, not deferred to future artifacts)

2. **At v1.0 launch:**
   - **US (Telecheck-US tenant):** `molecule_level_marketing_permitted: prohibited`. FDA DTC rules + state telehealth advertising restrictions remain binding. No molecule-level marketing surfaces enabled.
   - **Ghana (Telecheck-Ghana tenant):** `molecule_level_marketing_permitted: pending_evidence` at v1.0 launch. State semantics: regulatory engagement underway; molecule-level surfaces remain disabled by fail-closed default; transitions to `permitted` only after `marketing_copy_governance_evidence` populated with all required fields + first governance review approves first molecule-level copy.

3. **Safety floor remains binding regardless of marketing posture.** Activation of `molecule_level_marketing_permitted: permitted` does NOT relax:
   - I-019 crisis detection (platform floor)
   - Interaction engine gating (prescription decisions gated by interaction signals before clinician commit per ADR-005)
   - Herb-drug interaction engine
   - Fake-medication detection
   - Clinician sign-off (I-012 binds prescription/refill/medication-order execution)
   - ADR-005 protocolized autonomy framework
   - Tenant isolation invariants (I-023..I-026)
   - Audit append-only (I-027)

   Marketing surfaces direct patients *into* the platform's mediated pathway; the pathway's safety floor remains non-negotiable.

4. **Marketing copy governance review.** Molecule-level marketing copy follows the Master PRD §13.2 Governance review process (operator-side governance for marketing copy). The §13.2 review cadence is modeled on the same governance cadence used for guardrail templates and clinical protocols (same review apparatus, same audit-B sign-off discipline). v0.6 patch — Phase 4 propagation: §13.5 / §13.6 references collapsed to §13.2 + Governance review process internal subsection per Phase 2 Master PRD cleanup. The §13.2 Governance review process is the operative subsection within §13.2.

5. **Marketing surface controls and audit obligations** (v0.2 patch per Codex finding MEDIUM-5): every molecule-level marketing surface rendered to a patient MUST carry:
   - Country policy version (`ccr_marketing_policy_version_id`)
   - Approved copy version (`marketing_copy_version_id`) with reviewer identity (`governance_review_reviewer_ids[]`) and approval timestamp
   - Rendered-claim traceability: each rendered surface emits a `marketing.surface_rendered` audit event with country, copy version, governance review reference, patient_id (per tenant-isolation rules), and the specific claim classes rendered
   - Drift detection: any deviation between rendered surface and approved copy version triggers `marketing.surface_drift` audit event + immediate suspension of the surface; resolves only via re-review under §13.2 Governance review process
   - Workload taxonomy classification: marketing copy governance review is a workload of governance class `protocol_authorized` per WORKLOAD_TAXONOMY (v0.2 patch per Codex finding LOW-8: governance class named directly, not deferred)

6. **Country-conditional surface logic** in the Acquisition Engagement Tools Slice. The slice consults CCR `molecule_level_marketing_permitted` before rendering molecule-level marketing surfaces. Default behavior when unset, `prohibited`, or `pending_evidence`: program-level marketing only (no molecule-specific copy).

7. **Working definition: molecule-level vs program-level marketing** (v0.2 patch per Codex finding HIGH-2). A surface is **molecule-level marketing** if it satisfies any of:
   - Names a specific active pharmaceutical ingredient (e.g., "semaglutide", "sildenafil", "tadalafil")
   - Names a specific branded product (e.g., "Ozempic", "Wegovy", "Viagra")
   - Names a specific dosage or formulation regime tied to a specific product
   - Compares specific products by name
   - Implies efficacy claims tied to a specific product

   A surface is **program-level marketing** if it does NOT satisfy any of the above and instead names:
   - A clinical category or program name without product specifics (e.g., "GLP-1 weight management program", "ED program", "diabetes RPM program")
   - General population-health framing without product naming
   - Consultation/intake offer language

   **Boundary cases** (apply working definition with §13.2 Governance review process governance review; Master PRD §25 tracks borderline-case refinement only):
   - Naming a drug class (e.g., "GLP-1 receptor agonists" without naming specific molecules) — borderline; §13.2 Governance review process review decides per copy
   - Patient testimonials mentioning a product — molecule-level (the named product is the driver)
   - Educational content explaining how a class works — program-level if no specific product named, molecule-level if named

   The base definition above is canonical per this ADR (Decision §7). Master PRD §25 tracks **borderline-case refinement only** as actual emerging-market copy goes through §13.2 Governance review process governance review (e.g., naming a drug class without specific molecules, educational content framing, testimonial framing — items in the "Boundary cases" list above). Per-cycle refinement of those borderline cases does not reopen the base definition. Until borderline cases are individually classified, fail-closed: if uncertain, treat as molecule-level and apply §13.2 Governance review process governance. (v0.4 patch — Codex finding new-v0.3 issue 1: clarifies that §25 is refinement-only, not finalization-of-base-definition.)

## Activation requirements

ADR-027 takes effect at v1.10 promotion. **Two-tier activation gate** (v0.2 patch per Codex finding MEDIUM-6: distinguishes Phase 0 prerequisites for ADR acceptance from per-country activation prerequisites for `permitted` state).

### Tier 1 — ADR-027 acceptance prerequisites (for v1.10 promotion)

Required before ADR-027 can be Accepted at v1.10 promotion:

- **Marketing copy governance lead designated** (Master PRD §24 row 16; Phase 0 walk designates).
- **Master PRD §7.9, §13.2 Governance review process, §21 reflect the country-conditional posture** per the C4 cycle edits (Phase 2 work).
- **CCR Runtime contract amended** with `molecule_level_marketing_permitted` (enum), `marketing_governance_review_cadence_months` (int), `marketing_copy_governance_evidence` (object) keys (Phase 3 work).
- **Master PRD §24 pre-launch decisions** rows 16, 17, 18 added.
- Triple-sign-off on this ADR: Product Lead + Regulatory Affairs Lead + Clinical Safety Officer.

### Tier 2 — per-country activation prerequisites (for `permitted` state, post-v1.10-promotion)

Required before ANY country's `molecule_level_marketing_permitted` can transition from `prohibited` or `pending_evidence` to `permitted`:

1. **Country regulatory contract documented** (per Phase 0 scope-reconciliation row F-NEW-CRC). Records the regulatory engagement: jurisdiction, regulatory authority name, regulatory interpretation artifact ID + date, scope, prohibited claim classes (per `marketing_copy_governance_evidence` schema). For Ghana: Ghana FDA + Pharmacy Council guidance review evidence; for future markets: analogous bodies.
2. **Pharmacy Council guidance reference documented** (per Phase 0 scope-reconciliation row F-NEW-PCG) where the market's dispensing/marketing intersection requires it.
3. **First molecule-level marketing copy approved through §13.2 Governance review process governance review.** Triple-sign-off recorded in `governance_review_reviewer_ids[]`: Marketing copy governance lead + Clinical Safety Officer + Regulatory Affairs Lead.
4. **CCR policy update.** Engineering populates `marketing_copy_governance_evidence` object with all required fields, then sets `molecule_level_marketing_permitted: permitted`. Activation event audited.

## Consequences

**Positive:**

- **Harm-reduction outcome.** Emerging markets gain marketing surfaces that direct patients into the platform's mediated pathway; the safety floor's harm-reduction mechanism becomes accessible in markets where the counterfactual is unmediated pharmacy purchase.
- **Per-country regulatory posture honored.** US continues to follow FDA DTC rules; Ghana follows Ghana FDA + Pharmacy Council guidance; future markets (Nigeria, Kenya) plug in via CCR per their own regulatory regimes.
- **Governance-bound.** Marketing copy is not freely authored; it flows through the §13.2 Governance review process (using the same governance cadence applied to guardrail templates and clinical protocols), and the safety floor is unchanged.

**Negative / costs:**

- **Country regulatory engagement required per market.** Each emerging market that enables molecule-level marketing requires a documented regulatory contract + Pharmacy Council reference + first-copy governance review before activation. This is operational cost, not architectural cost, but it is real.
- **Marketing copy governance lead designation required** (per pre-launch decision §24 row 16). Without a designated lead, the governance review cadence cannot fire and `molecule_level_marketing_permitted: permitted` cannot activate.
- **Reviewer cognitive load.** Reviewers must distinguish program-level marketing (standard marketing review) from molecule-level marketing (§13.2 Governance review process governance review). The working definition in Decision §7 + Master PRD §25 boundary-case refinement supports this distinction; reviewers reference §7 as canonical.
- **Risk of marketing copy drift between governance reviews.** Mitigated by `marketing_governance_review_cadence_months` CCR key + cadence enforcement.

## Activation mechanism

ADR-027 is activated by:

1. v1.10 promotion ceremony executing all C4 matrix rows
2. ADR-027 written into ADR Set v1.0 supplementary index entry
3. Promotion Ledger entry (within v1.10's P-XXX entry, or standalone P-XXX)
4. Artifact Registry v2.10 inventory listing ADR-027
5. Active Document Index v1.0 referencing ADR-027 in §3 architecture section
6. Boot Sequence reading order including ADR-027 in §1 list
7. CCR Runtime contract v5.2 amended with the marketing block (4 keys per CCR_RUNTIME v5.2): `molecule_level_marketing_permitted` 3-state enum, `marketing_copy_governance_evidence` embedded structured object (with required-field completeness gating before `permitted` state per HIGH-2 cleanup at Phase 3 group-2), `marketing_governance_review_cadence_months`, `marketing_governance_lead_designation_artifact_id`
8. Master PRD §7.9, §13.2 Governance review process, §21 reflect the country-conditional posture per the C4 cycle edits
9. Master PRD §24 pre-launch decisions row 16 (Marketing copy governance lead designation) added; row 17 (First molecule-level marketing copy approval — Ghana) added; row 18 (CCR marketing key initial values per country) added

Per-country activation of `molecule_level_marketing_permitted: permitted` requires the activation requirements above; this happens after v1.10 promotion, on a per-country basis, gated by Country Launch Director + Marketing copy governance lead + Regulatory Affairs Lead + Clinical Safety Officer joint sign-off.

## What is NOT decided here

- **Specific Ghana FDA / Pharmacy Council guidance text.** That is operational regulatory engagement, not architectural decision. Lives in Telecheck_Country_Regulatory_Contracts.md and Telecheck_Pharmacy_Council_Guidance.md when authored.
- **Refinement of borderline-case interpretation of molecule-level vs program-level marketing.** The substantive working definition is established in Decision §7 (affirmative criteria, boundary cases, fail-closed rule). What remains open is per-cycle refinement of borderline cases (e.g., naming a drug class without specific molecules, educational content, testimonial framing) as actual emerging-market copy goes through §13.2 Governance review process governance review. Master PRD §25 tracks the refinement, not the base definition. (v0.3 patch — Codex new-v0.2-issue 3: definition contradiction resolved; Decision §7 is canonical, not "not blocking.")
- **Activation of `molecule_level_marketing_permitted: permitted` in Ghana at launch.** Per-country activation is a separate gate after v1.10 promotion. Initial Ghana state at v1.0 launch: **`pending_evidence`** (per Decision §2 of this ADR). Transitions to `permitted` only after Tier 2 activation requirements complete. (v0.3 patch — Codex new-v0.2-issue 2: Ghana state contradiction removed; uses enum vocabulary throughout.)
- **Specific marketing copy text for any market.** Author-and-review-per-market work, not architectural.
- **US tenant exception under future regulatory change.** If FDA DTC rules change, the CCR key flips per country; this ADR doesn't predict the regulatory environment.

## References

- **Master PRD §7.9** Harm-reduction marketing posture for emerging markets (operational principle this ADR formalizes)
- **Master PRD §13.2 Governance review process** Marketing copy governance (operator-side governance review)
- **Master PRD §21** Non-goals (the C1 regulatory-conditional rewrite this ADR completes)
- **Master PRD §24** Pre-launch decisions rows 16, 17, 18 (Marketing copy governance lead, First copy approval, CCR initial values)
- **Master PRD §25** Open questions — tracks **borderline-case refinement** of molecule-level vs program-level marketing classification only (base definition canonical per this ADR's Decision §7). v0.4 patch — Codex finding new-v0.3 issue 1.
- **CCR Runtime contract** v5.2 (Phase 3 amended for new marketing block — 4 keys: `molecule_level_marketing_permitted` 3-state enum, `marketing_copy_governance_evidence` embedded structured object, `marketing_governance_review_cadence_months`, `marketing_governance_lead_designation_artifact_id`)
- **Acquisition Engagement Tools Slice PRD** (country-conditional surface logic implementation)
- **ADR-005** Protocolized autonomy (safety floor unchanged)
- **ADR-024** Country-driven configuration (per-country policy mechanism)
- **Phase 0 scope-reconciliation rows** F-NEW-CRC (Country Regulatory Contracts) and F-NEW-PCG (Pharmacy Council Guidance) — supporting artifacts authored alongside this ADR per planning freeze v1.3 Phase 0

## Document control

- **v0.1 DRAFT — 2026-04-30** — Initial skeleton authored as Phase 4 prep per Evans's directive 2026-04-30 (parallel-track to Phase 0 walk). Triple-sign-off required at Phase 4 (Product Lead + Regulatory Affairs Lead + Clinical Safety Officer).
- **v0.2 DRAFT — 2026-04-30** — Patched per Codex pre-acceptance review (Codex_ADR_027_028_PreAcceptance_Review_2026-04-30.md). Changes:
  - **HIGH-1 (CCR typing):** `molecule_level_marketing_permitted` changed from `bool` to enum (`prohibited`, `pending_evidence`, `permitted`); fail-closed default; Ghana v1.0 state set to `pending_evidence` (consistent with new typing).
  - **HIGH-2 (molecule/program working definition):** New Decision §7 provides explicit working definition with affirmative criteria, boundary cases, and fail-closed rule for uncertain cases.
  - **HIGH-3 (regulatory mapping evidence):** New CCR key `marketing_copy_governance_evidence` (structured object) requires jurisdiction, regulatory authority, interpretation artifact ID, date, scope, prohibited claim classes BEFORE per-country activation; replaces "deferred to future artifacts" with structured evidence requirement.
  - **MEDIUM-4 (supersession scope):** "Implicitly amends" language replaced with explicit prior-wording / replacement-wording quote naming the C4/F01 matrix row that performs the canonical §21 rewrite.
  - **MEDIUM-5 (marketing surface controls):** New Decision §5 binds every molecule-level marketing surface to: country policy version, copy version + reviewer IDs + approval timestamp, rendered-claim traceability via `marketing.surface_rendered` audit event, drift detection via `marketing.surface_drift` audit event + auto-suspension.
  - **MEDIUM-6 (Phase 0 vs per-country activation prerequisites):** Activation requirements split into Tier 1 (ADR acceptance prerequisites for v1.10 promotion) and Tier 2 (per-country activation prerequisites for `permitted` state post-promotion).
  - **LOW-7 (§13.5 vs §13.2 Governance review process reconciled):** Decision §4 now explicitly states §13.5 and §13.2 Governance review process are distinct sections; §13.2 Governance review process governs marketing copy specifically and applies the §13.5-class cadence model.
  - **LOW-8 (WORKLOAD_TAXONOMY governance class named):** Marketing copy governance review classified directly as `protocol_authorized` governance class per WORKLOAD_TAXONOMY, not deferred.
- **v0.3 DRAFT — 2026-05-01** — Cleanup per Codex v0.2 verification residue findings. Changes:
  - **HIGH-2 residue (definition contradiction):** "What is NOT decided §2" updated — Decision §7 working definition is canonical; §25 tracks borderline-case refinement, not the base definition. Open Questions section RESOLVED-marked the prior contradictory entry.
  - **LOW-8 residue (WORKLOAD_TAXONOMY metadata):** Companion documents now name `protocol_authorized` directly; "(future)" qualifier removed.
  - **New v0.2 issue 1 (bool remnants):** All `molecule_level_marketing_permitted: true` references replaced with `: permitted` to match enum vocabulary.
  - **New v0.2 issue 2 (Ghana state contradiction):** "What is NOT decided §3" updated to use `pending_evidence` enum vocabulary; "false (or pending; effectively false)" stale text removed.
  - **New v0.2 issue 3 (definition contradiction):** Open Questions section now explicitly marks prior contradictory entries as RESOLVED in v0.2 / v0.3, eliminating the self-contradiction Codex flagged.
- **v0.4 DRAFT — 2026-05-01** — Micro-cleanup per Codex v0.3 verification new-issue 1: Decision §7 last paragraph + References §25 mention now consistently frame Master PRD §25 as borderline-case refinement only (base definition canonical per this ADR Decision §7). Removes the residual ambiguity that could invite reopening the already-decided base definition.
- **v0.5 DRAFT — 2026-05-01** — Final residue removal per Codex v0.4 verification: Decision §7 Boundary cases intro paragraph still contained the stale "Master PRD §25 open question pending finalization" phrase that v0.4 missed. v0.5 replaces with "Master PRD §25 tracks borderline-case refinement only" — exact replacement Codex recommended. ADR-027 is now fully consistent on §25 framing across Decision, References, and Open Questions sections.
- **v0.6 DRAFT — 2026-05-01** — Phase 4 propagation pass per Phase 2 + Phase 3 canonicalization cleanup. Changes:
  - **§13.6 references → §13.2 Governance review process** (8 occurrences) per Phase 2 Master PRD cleanup. The Master PRD §13 only has §13.1, §13.2, and §13.7 as section headings; §13.6 was a stale residue from v1.9 that v1.10 collapsed into §13.2. ADR-027 now references §13.2 + the Governance review process internal subsection consistently.
  - **§13.5 reference cleanup** (2 occurrences) — replaced with "the same governance cadence used for guardrail templates and clinical protocols" (since §13.5 also doesn't exist as a section heading).
  - **CCR Runtime contract v5.1 → v5.2** with explicit 4-key marketing block enumeration per Phase 3 group-2 (`molecule_level_marketing_permitted`, `marketing_copy_governance_evidence` embedded object, `marketing_governance_review_cadence_months`, `marketing_governance_lead_designation_artifact_id`).
  - Activation mechanism §7 expanded to enumerate all 4 keys explicitly (was only naming 2 keys).
  - Supersedes header replacement-wording aligned with Master PRD §21 v1.10 canonical text per Phase 2 close.
- **Status:** DRAFT — not canonical until v1.10 promotes. On promotion, this file moves into the spec bundle as `Telecheck_ADR_027_Country_Conditional_DTC_Marketing.md` (drop _DRAFT) and bumps to Status: Accepted.
- **Open questions:**
  - Does ADR-027 acceptance require pre-existing Ghana FDA + Pharmacy Council guidance documents in the bundle, or does it accept activation-mechanism placeholders that get filled per market post-promotion? (Working answer: placeholders acceptable at acceptance via Tier 1 / Tier 2 split per Activation requirements; per-market evidence filling happens at per-country activation gate via the structured `marketing_copy_governance_evidence` CCR object.)
  - ~~Should the CCR key name be `molecule_level_marketing_permitted` (stating affirmative permission) or `molecule_level_marketing_prohibited`?~~ **RESOLVED in v0.2 / v0.3:** affirmative permission as a 3-state enum (`prohibited` / `pending_evidence` / `permitted`) per Decision §1. Default `prohibited`; fail-closed.
  - ~~Should the ADR enumerate the specific governance-class value in WORKLOAD_TAXONOMY?~~ **RESOLVED in v0.3:** governance class named directly as `protocol_authorized` per Decision §5 and Companion documents.
  - ~~Working definition of molecule-level vs program-level marketing?~~ **RESOLVED in v0.2:** working definition with affirmative criteria established in Decision §7. Boundary-case refinement continues per Master PRD §25.
