# Program Porting Checklist — Heros US GLP-1 → Telecheck Ghana GLP-1

**Scope:** Concrete worked example of what has to happen — by layer, by owner, by approval chain — to make Heros's existing US GLP-1 program available as a Telecheck Ghana program under the current platform architecture (ProgramMarketPolicy + Pattern A form versioning + four-layer Forms Engine + CCR Runtime).

**Use:** Operational reference for product, clinical, regulatory, and engineering owners during a program port. Can be templated for other programs (ED, RPM Diabetes, RPM Hypertension) with the program-specific clinical content swapped.

**What this is not:** A regulatory submission. A clinical safety case. A pharmacy partnership agreement. Those are separate artifacts referenced where they appear in the checklist.

---

## Reading guide

Each item is tagged with three pieces of metadata:

- **Layer** — where in the platform architecture this work happens (Program / Form / CCR / Protocol / Market Pack / Operational)
- **Inherit / Author / Activate** — whether this is starting-point material from Heros's US version, new authoring work, or an activation step
- **Owner** — who signs off

**Approval signal legend:**
- 🟢 Inherited — copies cleanly from US version, no clinical re-review
- 🟡 Adapted — starts from US version, requires Ghana-specific clinical or operational review
- 🔴 Authored from scratch — country-specific, no US analog
- ⚙️ Activation step — config or operational, not authoring

---

## Section A · Program Definition (Platform Layer)

The program itself — `glp1_weight_management` — is defined once at the platform level. This section is mostly inheritance.

| # | Item | Tag | Owner | Notes |
|---|---|---|---|---|
| A.1 | Platform-level program record exists in catalog | 🟢 | Product Lead | Already exists; was created when Heros launched US GLP-1. No new record needed. |
| A.2 | Program category and clinical pathway taxonomy | 🟢 | Product Lead | Inherited as-is. GLP-1 is a weight-management category in both markets. |
| A.3 | Program description and patient-facing summary copy | 🟡 | Content Author + Marketing Lead | Localize: weight units (kg), Ghana-relevant framing, regulatory disclaimers. Clinical claims unchanged. |
| A.4 | Indicative monitored metrics (weight, side effects, BP) | 🟢 | Clinical Lead | Same as US. The clinical structure of what's monitored doesn't change. |
| A.5 | AI Mode 2 compatibility flag | 🟢 | AI Safety Lead | Inherits `mode_2_compatible: true`. No platform change needed. |

**Section A summary:** ~5 items, mostly inherited. This is the "free" part.

---

## Section B · Forms Engine — Four-Layer Authoring (Form Layer)

Per **ADR-004 Pattern A**, Ghana gets its own `intake_form_version_id` (`frv_*`) for GLP-1. The Heros US version is the authoring template. Every layer below produces work; the four-layer architecture controls who reviews what.

### B.1 · Layer 1: Presentation Content (Audit category C)

| # | Item | Tag | Owner | Notes |
|---|---|---|---|---|
| B.1.1 | Onboarding hero copy | 🟡 | Content Author + Marketing Lead | Adapt for Ghanaian context. Same clinical structure; localized voice and reassurance. |
| B.1.2 | Section transition messages | 🟡 | Content Author + Marketing Lead | Translate to en-GH register where appropriate. Avoid US-idiom. |
| B.1.3 | Educational interstitials (BMI explanation, GLP-1 mechanism, expected timeline) | 🟢 | Content Author + Medical Director | Clinical content is portable. Imagery may localize. |
| B.1.4 | Testimonials and social proof | 🔴 | Content Author + Marketing Lead | Must be Ghana-sourced. Cannot reuse Heros US testimonials (data protection + authenticity). |
| B.1.5 | Statistics and population claims | 🟡 | Content Author + Medical Director | Source Ghana-relevant statistics where claims are population-specific. US statistics not portable. |
| B.1.6 | Regulatory disclaimers and warnings | 🔴 | Legal + Regulatory Affairs Lead | Ghana FDA and Pharmacy Council language, not FDA fair-balance language. New authoring. |
| B.1.7 | Currency and pricing display copy | 🔴 | Content Author + Operations | GHS, MoMo language, payment-specific copy. |
| B.1.8 | Imagery — patients, clinicians, environments | 🔴 | Marketing Lead | Ghana-representative photography. US imagery does not transfer. |

### B.2 · Layer 2: Branching Logic (Audit category C)

| # | Item | Tag | Owner | Notes |
|---|---|---|---|---|
| B.2.1 | Section ordering (body metrics → weight history → medical screening → contraindications → labs → goals → consent) | 🟢 | Product Author + Product Lead | Inherited. Clinical sequencing is the same. |
| B.2.2 | Skip logic for non-diabetic patients (HbA1c section) | 🟢 | Product Author + Product Lead | Inherited. Same logic in both markets. |
| B.2.3 | Conditional expansion on cardiovascular history = Yes | 🟢 | Product Author + Product Lead | Inherited. |
| B.2.4 | Insulin-use flag → clinician-review escalation | 🟢 | Product Author + Product Lead | Inherited. |
| B.2.5 | BMI < 27 → display ineligibility messaging | 🟡 | Product Author + Product Lead | Logic identical; copy localized (B.1.1). |
| B.2.6 | **NEW for Ghana: herbal medicine reporting branch** | 🔴 | Product Author + Product Lead | Ghana intake adds an herbal-medicine branch that the US intake does not have. Feeds the Herb-Drug Interaction Engine. This is the most significant L2 difference. |
| B.2.7 | Consent block placement and timing | 🟢 | Product Author + Product Lead | Inherited progressive consent pattern (per ADR-015). |

### B.3 · Layer 3: Eligibility Logic (Audit category B — Dual control per I-015)

| # | Item | Tag | Owner | Notes |
|---|---|---|---|---|
| B.3.1 | BMI thresholds (≥27 with comorbidity, or ≥30) | 🟢 | Clinical Content Author + Clinical Safety Officer | Clinical fact. Inherited unmodified. Dual sign-off still required to publish. |
| B.3.2 | Pregnancy / lactation hard exclusion | 🟢 | Clinical Content Author + Clinical Safety Officer | Inherited. |
| B.3.3 | MTC personal/family history hard exclusion | 🟢 | Clinical Content Author + Clinical Safety Officer | Inherited. |
| B.3.4 | MEN 2 history exclusion | 🟢 | Clinical Content Author + Clinical Safety Officer | Inherited. |
| B.3.5 | Pancreatitis history flag | 🟢 | Clinical Content Author + Clinical Safety Officer | Inherited. |
| B.3.6 | Gastroparesis screening | 🟢 | Clinical Content Author + Clinical Safety Officer | Inherited. |
| B.3.7 | Cardiovascular event recency thresholds | 🟢 | Clinical Content Author + Clinical Safety Officer | Inherited. |
| B.3.8 | HbA1c recency window for diabetic patients | 🟢 | Clinical Content Author + Clinical Safety Officer | Inherited. |
| B.3.9 | **NEW for Ghana: herbal medicine eligibility logic** | 🔴 | Clinical Content Author + Clinical Safety Officer | Which herbal preparations are exclusionary or flag-generating with semaglutide/tirzepatide. Requires herb-drug engine knowledge-base scoping for Ghana. |
| B.3.10 | Formulary-specific eligibility (which GLP-1 medications) | 🟡 | Clinical Content Author + Clinical Safety Officer | Depends on B.4.x formulary scope below. If only semaglutide is available in Ghana at launch, eligibility logic narrows. |
| B.3.11 | Concomitant medication screening list | 🟡 | Clinical Content Author + Clinical Safety Officer | Most of the list inherits. Country-specific medications (Ghana brand variants) added. |

### B.4 · Layer 4: Approval Governance (Audit category B)

| # | Item | Tag | Owner | Notes |
|---|---|---|---|---|
| B.4.1 | Bind form to market: `market_code = GH` | ⚙️ | Operator | Pattern A enforces one market per version. |
| B.4.2 | Pricing bundle (GHS, payment rails, subscription cadence) | 🔴 | Operations + Finance | Ghana-specific pricing decision. Not derivable from US pricing. |
| B.4.3 | Launch gate satisfaction (regulatory, clinical, technical, operational, financial, legal, executive) | ⚙️ | Country Launch Director | All seven gates per Market Launch contract (I-020). |
| B.4.4 | Form version status: draft → published | ⚙️ | Operator + Market Operations Lead | Per Forms Engine §version lifecycle. |
| B.4.5 | Compatibility check: required protocol version exists for Ghana | ⚙️ | Country Launch Director | See Section D below. |
| B.4.6 | Compatibility check: required Mode 2 agent version exists | ⚙️ | AI Safety Lead | See Section E below. |
| B.4.7 | Compatibility check: pricing bundle valid for Ghana payment rails | ⚙️ | Payments Operations Lead | See Section F below. |

**Section B summary:** Form versioning is the largest single block of work. Roughly 30 items. The L1 layer is mostly authoring; L2 is mostly inheritance plus the herbal-medicine branch; L3 is mostly inheritance with country-specific additions for herb-drug screening and formulary-narrow eligibility; L4 is operational binding. Total clinical authoring work is concentrated in B.1.6 (regulatory disclaimers), B.2.6 (herbal branch), B.3.9 (herbal eligibility), and B.3.10 (formulary-narrow logic).

---

## Section C · CCR Runtime Configuration (Country Layer)

Per **ADR-024**, country-specific runtime behavior is resolved through the Country Configuration Registry. Most CCR keys are already configured for Ghana from launch (per the country profile in Master PRD §4). This section is mostly verification, not new authoring.

| # | Item | Tag | Owner | Notes |
|---|---|---|---|---|
| C.1 | Verify `regulatory.adverse_event_reporting` is configured for FDA Ghana / WHO VigiBase | ⚙️ | Regulatory Affairs Lead | Already configured at Ghana platform launch. |
| C.2 | Verify `clinical.formulary_id` for Ghana includes GLP-1 SKUs | ⚙️ | Pharmacy Operations | See Section F below — formulary work is real. |
| C.3 | Verify `operational.payment_rails` is Paystack with MoMo enabled | ⚙️ | Payments Operations Lead | Already configured. |
| C.4 | Verify `presentation.locale = en-GH`, `currency = GHS`, `date_format = DD/MM/YYYY` | ⚙️ | Engineering | Already configured. |
| C.5 | Verify `regulatory.consent_requirements` matches Ghana DPA + MDC consent model | ⚙️ | Privacy Officer + Legal | Already configured. Confirm the GLP-1-specific consent text is registered. |
| C.6 | Verify emergency information (112 + Ghana Mental Health Authority hotline) renders correctly | ⚙️ | Engineering | Already configured. |
| C.7 | Verify `notification_channels` reflects WhatsApp-primary, SMS-fallback for Ghana | ⚙️ | Engineering | Already configured. |

**Section C summary:** ~7 verification items. CCR is platform infrastructure already configured for Ghana — no new keys required to add a program.

---

## Section D · Protocol Library (Clinical Governance)

The GLP-1 protocol (`refill_renewal_glp1_v1`) is already authored in the Ghana Protocol Library v1.0. Adding the GLP-1 program to Telecheck Ghana doesn't require authoring a new protocol — it requires confirming the existing one is activated and bound correctly.

| # | Item | Tag | Owner | Notes |
|---|---|---|---|---|
| D.1 | Confirm `refill_renewal_glp1_v1` exists in Ghana Protocol Library | ⚙️ | Clinical Governance Lead | Already exists per Protocol Library Ghana v1.0 §3.4. |
| D.2 | Assign accountable clinician for the GLP-1 protocol in Ghana | 🔴 | Clinical Governance Lead | Marked `[To be assigned]` in current Protocol Library — must be filled before activation. |
| D.3 | Eligibility criteria review (consultation recency, medication list confirmation window, GI symptom flagging) | 🟡 | Clinical Governance Lead + Ghana MDC sign-off | Listed in Protocol Library §"Clinical content requiring domain expert review" — must be reviewed by a licensed Ghana clinician before activation. |
| D.4 | Lab threshold review (HbA1c, eGFR, ALT, K+) for Ghana population norms | 🟡 | Clinical Governance Lead | Same review process as D.3. |
| D.5 | Test suite for protocol behavior — happy path, edge cases, exclusion paths | 🔴 | Clinical Governance Lead + AI Safety Lead | Per Master PRD §13.5, every protocol activation requires a test suite. The US test suite is a starting point but Ghana-specific test cases must be added (herbal co-medication scenarios, Ghana-population edge cases). |
| D.6 | Activation review meeting — multi-party sign-off (clinical, regulatory, technical) | ⚙️ | Country Launch Director | Per ADR-005. |
| D.7 | Review cadence registration (6 months for high-risk GLP-1) | ⚙️ | Clinical Governance Lead | Auto-tracked once activated. |

**Section D summary:** ~7 items. The protocol exists; the work is assigning the accountable Ghana clinician, getting MDC-aligned clinical sign-off on the eligibility criteria, and authoring a Ghana-specific test suite.

---

## Section E · AI Layer (Mode 1 Guardrail + Mode 2 Protocol Agent)

### E.1 · Mode 1 (Conversational Assistant)

| # | Item | Tag | Owner | Notes |
|---|---|---|---|---|
| E.1.1 | Confirm `glp1_program_v1` guardrail template exists in Ghana market | ⚙️ | AI Safety Lead | Per Guardrail Templates v1.0 §4 — already authored at platform level. |
| E.1.2 | Activate `glp1_program_v1` in Ghana market via Admin Configuration Surfaces | ⚙️ | AI Safety Lead | Per Master PRD §13.5 governance review. |
| E.1.3 | Test suite: GLP-001 through GLP-005 must pass | ⚙️ | AI Safety Lead | All Conservative Default tests + GLP-1-specific tests. |
| E.1.4 | **Ghana-specific addendum:** herbal-medicine conversation handling within GLP-1 program scope | 🔴 | AI Safety Lead + Clinical Safety Officer | Mode 1 must handle "I'm taking semaglutide and bitter leaf" without US-equivalent training. Per CD-014 pattern but specific to GLP-1 + common Ghanaian herbal preparations. New test cases required. |
| E.1.5 | Locale binding: ensure Mode 1 responds in en-GH register | ⚙️ | AI Safety Lead | Configuration, not authoring. |

### E.2 · Mode 2 (Protocol Execution Agent)

| # | Item | Tag | Owner | Notes |
|---|---|---|---|---|
| E.2.1 | Confirm GLP-1 Async Intake and Review pathway exists | 🟢 | AI Safety Lead | Per AI Clinical Assistant Slice §6.1. Platform-level. |
| E.2.2 | Bind Mode 2 GLP-1 pathway to Ghana intake form version (`frv_*`) | ⚙️ | AI Safety Lead | Compatibility check per Forms Engine §"intake response" lifecycle. |
| E.2.3 | Mode 2 input schema validation against Ghana intake (every required field maps) | ⚙️ | AI Safety Lead | Forms Engine publish-time validation. Will fail if B.2.6 herbal branch produces fields Mode 2 doesn't expect. |
| E.2.4 | **Mode 2 input schema extension:** include `herbal_medicines[]` field for Ghana | 🔴 | AI Safety Lead | Either Mode 2 is extended to consume herbal data (preferred), or the herbal branch produces output consumed only by clinician review (acceptable fallback). Architectural decision. |
| E.2.5 | Calibration evidence for Mode 2 on Ghana cohort | 🟡 | AI Safety Lead | Per AI Slice — every clinical recommendation requires calibration status. Initial Ghana launches operate with `calibration_status: uncalibrated_pending_evidence`. Calibration evidence accrues as Ghana cases are reviewed. |
| E.2.6 | Physician approval requirement at launch (no auto-approve) | ⚙️ | AI Safety Lead | Default platform behavior per Master PRD §13.5. |

**Section E summary:** ~11 items. Most platform-level AI infrastructure exists; the real work is the Ghana-specific herbal-medicine handling in both Mode 1 and Mode 2, and the calibration-evidence accrual plan.

---

## Section F · Pharmacy + Formulary (Operational)

This is where Design 1 stops being free. The clinical pathway ports cleanly; the supply chain does not.

| # | Item | Tag | Owner | Notes |
|---|---|---|---|---|
| F.1 | Confirm which GLP-1 medications are commercially available in Ghana | 🔴 | Pharmacy Operations Lead | Semaglutide (Ozempic, Wegovy), liraglutide (Saxenda, Victoza), tirzepatide (Mounjaro, Zepbound) — availability varies by market. Likely subset of US formulary. |
| F.2 | Identify pharmacy partner(s) in Ghana stocking GLP-1 SKUs | 🔴 | Pharmacy Operations Lead | Existing Ghana pharmacy partnerships may or may not stock GLP-1 medications. Coordination + supply agreement required. |
| F.3 | Cold chain logistics confirmation (GLP-1 medications require refrigeration) | 🔴 | Pharmacy Operations Lead | Ghana cold-chain pharmacy capabilities. May constrain delivery zones for launch. |
| F.4 | Pricing per SKU per pharmacy partner | 🔴 | Pharmacy Operations Lead + Finance | GHS pricing. Margin model. Subsidy/access decisions. |
| F.5 | Update Ghana formulary in CCR (`clinical.formulary_id`) to include approved GLP-1 SKUs | ⚙️ | Pharmacy Operations Lead + Engineering | New formulary version published. |
| F.6 | Pharmacy adapter integration verification (Telecheck Ghana panel for fulfillment) | ⚙️ | Engineering | Existing Ghana adapter infrastructure. |
| F.7 | Stockout policy and bridge supply protocol for GLP-1 (per ADR-008) | 🟡 | Pharmacy Operations Lead | Existing bridge supply pattern; specific GLP-1 stockout handling defined. |
| F.8 | Counterfeit risk assessment — Fake Medication Detection scope for Ghana GLP-1 SKUs | 🟡 | Pharmacy Operations Lead + Clinical Safety Officer | GLP-1s are high-counterfeit-risk in many emerging markets. Verify reference data scope per Fake Medication Detection Slice. |

**Section F summary:** ~8 items, almost all 🔴. **This is the critical-path work.** The clinical and form layers can be perfectly authored, but if the supply chain isn't ready, the program cannot launch. F.1, F.2, F.3 in particular are real-world operational dependencies that don't get faster because the platform is good.

---

## Section G · Regulatory + Legal (External)

| # | Item | Tag | Owner | Notes |
|---|---|---|---|---|
| G.1 | Ghana FDA review of GLP-1 program offering | 🔴 | Regulatory Affairs Lead | Ghana FDA approval for telehealth-prescribed weight-management medications. Timeline-dependent. |
| G.2 | Ghana MDC review of telehealth GLP-1 prescribing protocol | 🔴 | Regulatory Affairs Lead + Clinical Lead | MDC is the medical council; protocol-authorized prescribing requires their alignment. |
| G.3 | Pharmacy Council notification of GLP-1 dispensing through partner network | 🔴 | Pharmacy Operations Lead | Pharmacy Council is the regulator for dispensing in Ghana. |
| G.4 | DPA / DPC notification of expanded data processing scope (if any) for GLP-1 program | 🟡 | Privacy Officer | Likely covered by existing platform DPC registration; verify. |
| G.5 | Marketing copy regulatory review | 🔴 | Legal + Regulatory Affairs Lead | Per the §21 DTC marketing reframe in the PRD — Ghana marketing posture for prescription medications is regulator-conditional. |
| G.6 | Adverse event reporting hookup to FDA Ghana / WHO VigiBase for GLP-1 SKUs | ⚙️ | Regulatory Affairs Lead + Engineering | Existing AE infrastructure; verify GLP-1 SKU coverage in reportable medications list. |

**Section G summary:** ~6 items. Three regulatory bodies (FDA Ghana, MDC, Pharmacy Council) plus DPA/DPC. Timeline-dominant — calendar weeks to months, not engineering days.

---

## Section H · ProgramMarketPolicy + Market Pack (Activation)

Once Sections A–G are complete, the actual flip-the-switch work is small.

| # | Item | Tag | Owner | Notes |
|---|---|---|---|---|
| H.1 | Author ProgramMarketPolicy: GLP-1 × Ghana × Telecheck-Ghana tenant | ⚙️ | Country Launch Director | Per Market Launch contract. |
| H.2 | Compatibility checks pass: form version, protocol version, agent version, pricing bundle | ⚙️ | Country Launch Director | Per Forms Engine §"compatibility checks." |
| H.3 | Seven launch gate sign-offs collected | ⚙️ | Country Launch Director | Regulatory (Section G), Clinical (Section D), Technical (Sections B/E), Operational (Section F), Financial (Section F), Legal (Section G), Executive. |
| H.4 | Add to Ghana Market Pack as new ProgramMarketPolicy entry | ⚙️ | Country Launch Director | Market Pack version bump. |
| H.5 | Blast-radius preview generated and reviewed | ⚙️ | Country Launch Director | Per v5 update spec — Cockpit displays affected patients, downstream workflows, rollback path. |
| H.6 | Activation in Cockpit (state: `pilot` → `limited_launch` → `full_launch`) | ⚙️ | Country Launch Director | Staged per launch readiness. |
| H.7 | Evidence locker entries: regulatory sign-offs, clinical approvals, test results | ⚙️ | Country Launch Director | Queryable for regulatory export. |
| H.8 | Rollback plan documented and tested | ⚙️ | Country Launch Director + Engineering | One-action rollback per platform invariant. |

**Section H summary:** ~8 items, all operational. The cockpit interaction is the easy part.

---

## Section I · Patient-Facing Experience (Final Verification)

| # | Item | Tag | Owner | Notes |
|---|---|---|---|---|
| I.1 | Patient app shows "Telecheck Ghana" brand for the GLP-1 program (per Master PRD HTML §1 brand structure) | ⚙️ | Engineering + Product | Brand presentation per current PRD framing. |
| I.2 | Pricing displayed in GHS at intake | ⚙️ | Engineering | CCR-driven. |
| I.3 | Payment flow uses Paystack/MoMo, not Stripe | ⚙️ | Engineering | CCR-driven. |
| I.4 | Consent text matches Ghana DPA + MDC requirements | ⚙️ | Engineering + Privacy Officer | Tested in B.4. |
| I.5 | WhatsApp notifications configured with GLP-1 program copy | 🟡 | Engineering + Content | Notification copy per Notification Spec; localized for GLP-1 context. |
| I.6 | Herbal-medicine reporting branch renders correctly | ⚙️ | Engineering | Tested in B.2.6. |
| I.7 | End-to-end test: enroll → intake → consult → prescription → pharmacy fulfillment → delivery | ⚙️ | Country Launch Director + QA | Full critical-path validation in Ghana sandbox before live launch. |

**Section I summary:** ~7 items. End-to-end UAT.

---

## Total work summary

| Section | Items | Inherited 🟢 | Adapted 🟡 | New authoring 🔴 | Activation ⚙️ |
|---|---|---|---|---|---|
| A · Program Definition | 5 | 4 | 1 | 0 | 0 |
| B · Forms Engine (4 layers) | 30 | 13 | 7 | 6 | 4 |
| C · CCR Runtime | 7 | 0 | 0 | 0 | 7 |
| D · Protocol Library | 7 | 0 | 2 | 2 | 3 |
| E · AI Layer | 11 | 1 | 1 | 2 | 7 |
| F · Pharmacy + Formulary | 8 | 0 | 2 | 5 | 1 |
| G · Regulatory + Legal | 6 | 0 | 1 | 4 | 1 |
| H · ProgramMarketPolicy + Market Pack | 8 | 0 | 0 | 0 | 8 |
| I · Patient Experience UAT | 7 | 0 | 1 | 0 | 6 |
| **Totals** | **89** | **18** | **15** | **19** | **37** |

**Inherited (20%)** is the structural payoff of Design 1 — the platform-level program record, most clinical eligibility logic, the AI Mode 2 pathway, the four-layer architecture itself.

**Adapted (17%)** is genuine work but not from-scratch — locale, copy, country-specific test cases, formulary-narrow logic.

**Authored (21%)** is country-specific work that has no US analog — herbal medicine handling, Ghana regulatory disclaimers, Ghana pharmacy partnerships, Ghana imagery, MDC-aligned protocol sign-off.

**Activation (42%)** is operational config — the largest category by count, the smallest by effort per item. Compatibility checks, sign-offs, market pack updates, end-to-end UAT.

---

## What dominates the timeline

Engineering days are not the constraint. The critical paths are:

1. **Section F (Pharmacy + Formulary).** Weeks to months. Gated by partner agreements, cold chain, supply, pricing.
2. **Section G (Regulatory + Legal).** Weeks to months. Gated by Ghana FDA, MDC, Pharmacy Council review timelines.
3. **Section D.3 + D.4 (Clinical sign-off on protocol).** Days to weeks. Gated by named accountable Ghana clinician + MDC alignment.
4. **Section B.3.9 + B.2.6 (Herbal-medicine handling in form + protocol).** Days. Genuine clinical authoring work.
5. **Section E.2.4 (Mode 2 schema decision on herbal data).** Hours to days. Architectural decision; once made, engineering follows.

Form authoring (B.1, B.2 ex-herbal) and engineering integration (Sections C, H, I) are days to a week each. They are not the bottleneck.

---

## What's *not* on this list

This checklist covers the work to make a *single program* available in a *single market*. It does not include:

- Adding a new country to the platform (CCR template authoring, Market Pack creation, country profile, payment processor onboarding, clinician network buildout). That's a much larger workstream.
- Adding a new program *type* (e.g., a category that doesn't yet exist platform-wide). That requires a new platform-level program record, new Mode 2 pathway, new guardrail template.
- Adding a new tenant (e.g., a future Telecheck Nigeria, a future US tenant beyond Heros). That's tenant-onboarding work — RBAC scoping, tenant config, brand assets, legal entity, payment processor account.
- Migrating a tenant from another platform. That's migration-tooling work, deferred to Phase 2 per Master PRD §19.

---

## How to use this for other programs

**ED → Telecheck Ghana.** Replace GLP-1 specifics. Eligibility logic (B.3) is mostly inherited; the nitrate-contraindication check is the safety-critical gate. Sensitive-category handling (FLOOR-006) for delegate visibility is critical. Mode 2 ED pathway already exists. Formulary work (sildenafil, tadalafil) is generally simpler than GLP-1 — wider availability, no cold chain. Estimated effort: ~60% of GLP-1's.

**RPM Diabetes → Heros US.** Reverse direction. Heros US starts from Ghana's intake template. L1 layer rewrites for US voice, regulatory disclaimers swap to FDA, pricing in USD via Stripe Billing, US clinician licensure verification, US formulary (insulin types, glucometer brands available in US). Mode 2 pathway and protocol library currently scoped for Ghana — would require US versions. **Note:** No active RPM ProgramMarketPolicy for the US currently exists, so this is also a tenant-strategy decision (does Heros add chronic care to its catalog?), not just a port.

**RPM Hypertension → Telecheck Ghana.** Similar shape to RPM Diabetes; simpler because the metrics (BP, weight) are universal and BP monitor availability is broader than glucometer connectivity in Ghana.

**GLP-1 → Telecheck Nigeria (Phase 3+).** Pattern A means Nigeria gets its own form version, even though much may inherit from Ghana. NAFDAC replaces Ghana FDA. PCN (Pharmacists Council Nigeria) replaces Pharmacy Council. NIDC replaces Ghana DPC. Mobile money provider differs (Paga, OPay vs MoMo). Protocol library would inherit from Ghana with Nigeria-specific clinical sign-off.

---

## Document control

- **v1.0** — Initial program porting checklist. Worked example: Heros US GLP-1 → Telecheck Ghana GLP-1. Mapped against Forms Engine four-layer architecture (ADR-004 Pattern A), CCR Runtime (ADR-024), ProgramMarketPolicy (I-020), Protocol Library Ghana v1.0, Guardrail Templates v1.0, AI Clinical Assistant Slice §6.1, Pharmacy + Refill Slice v2.x, and Market Rollout Cockpit Slice. 89 items across 9 sections.
- **Next review:** When the first program port is actually executed, this checklist gets refined against actual experience. Items that turned out to be more or less work than estimated get re-tagged.
- **Related artifacts:** Master Platform PRD v1.9 §10 (operating model), §11 (architecture), §11.7 (slice index); Forms Engine contract; CCR Runtime contract; Market Launch contract; Protocol Library Ghana v1.0; Guardrail Templates v1.0; ADR-004; ADR-005; ADR-024.
