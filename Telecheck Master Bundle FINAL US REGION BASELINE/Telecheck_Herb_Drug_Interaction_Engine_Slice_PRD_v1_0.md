# Telecheck — Herb–Drug Interaction Engine Slice PRD

**Version:** 1.0
**Status:** Canonical for development
**Owner:** Clinical Governance Lead
**Parent document:** Telecheck Master Platform PRD v1.6, §10 Pillar 5
**Companion documents:** Medication Interaction & Validation Engine Slice PRD v1.0, AI Clinical Assistant Slice PRD v1.0, Refill Slice PRD v1.0, v5 Contracts Pack

---

## 1. Purpose and strategic role

The Herb–Drug Interaction Engine is one of Telecheck's strongest differentiators and its most distinctive Ghana-specific capability. No major telehealth competitor has a phytochemical-aware interaction engine. In West Africa and across emerging markets, herbal medicine use is widespread, concurrent with prescription medications, and largely invisible to conventional clinical decision support. Patients take herbal preparations alongside prescribed drugs without telling their doctors, and doctors prescribe without knowing what herbal medicines their patients are taking. The result is undetected interactions, avoidable adverse events, and a clinical blind spot that conventional telehealth platforms ignore entirely.

This engine closes that blind spot. It checks patient-reported herbal medicines, traditional remedies, and supplements against the patient's active prescription medication list, using phytochemical interaction profiles and known herb–drug risk data. It produces structured signals in the same format as the Medication Interaction & Validation Engine, so clinicians, protocol engines, and pharmacy workflows consume herb–drug signals identically to drug–drug signals.

This slice defines:
- What the engine checks and how
- How patients report herbal medicine use
- What signals it produces and how they differ from medication engine signals
- How signals are consumed by clinicians, the AI Clinical Assistant, protocol engines, and pharmacy
- How the knowledge base is built, maintained, and governed
- What the engine does when it encounters preparations it doesn't recognize

**Strategic positioning.** This module is positioned for institutional partnership with Korle Bu Hospital and the Ghana FDA. A credible, well-governed herb–drug interaction engine has pilot value for regulatory bodies seeking to understand herbal medicine safety at population scale. The engine's data — anonymized, aggregated interaction signal patterns — becomes a research asset that strengthens Telecheck's institutional relationships and defensibility.

---

## 2. Traceability

| Master PRD reference | This slice addresses |
|---|---|
| §8 Job 2 — Refill a medication safely | Herb–drug signals gate refills alongside medication engine signals |
| §8 Job 9 — Converse with AI for clinical understanding | AI Clinical Assistant (Mode 1) explains herb–drug signals to patients |
| §8 Job 10 — Review and oversee AI suggestions | Clinician reviews herb–drug signals at prescribing and refill decision points |
| §10 Pillar 5 — Herb–drug interaction engine | Full engine definition |
| §11.1 Launch scope — Pharmacy intelligence (shared services) | Engine is a launch capability |
| §11.4 Critical-path subset | Engine is 30-day-tolerant (important but brief absence doesn't block refill safety, since medication engine covers drug–drug) |
| §13.1 Protocolized clinical autonomy | Herb–drug signals are part of the protocol gate evaluation |
| Medication Interaction Engine Slice §8 | Defines the shared signal model this engine must conform to |

---

## 3. Actors

| Actor | Role with this engine |
|---|---|
| **Patient** | Reports herbal medicine use through structured entry, free text, or photo upload. Sees herb–drug signals on medication detail page in patient-appropriate language. |
| **Clinician** | Primary consumer. Sees herb–drug signals alongside medication engine signals at prescribing and refill decision points. Can override with rationale. |
| **Pharmacist** | Secondary consumer. Sees herb–drug signals at dispense decision point alongside medication engine signals. |
| **Protocol engine** | Automated consumer. Where protocol governance includes herb–drug screening, protocol-authorized actions check herb–drug signals before execution. |
| **AI Clinical Assistant (Mode 1)** | Explains herb–drug signals to patients in conversational context. References the same signal data clinicians see, presented in patient-appropriate language. |
| **AI Clinical Assistant (Mode 2)** | Includes herb–drug signals in structured clinical summaries for physician review, where the intake pathway includes herbal medicine reporting. |
| **Medication Interaction & Validation Engine** | Peer service. Herb–drug signals are additive to medication engine signals — they do not replace or override them. Both engines produce signals in the same format. |

---

## 4. What the engine checks

### 4.1 Input: patient-reported herbal medicines

The engine checks the patient's reported herbal medicines against their active prescription medication list. The input is the **herbal medicine profile** — the set of herbal preparations, traditional remedies, and dietary supplements the patient has reported using.

**Critical design principle:** The engine checks what the patient reports. It does not assume the patient has reported everything, and it does not refuse to run on a partial report. Like the medication engine's handling of incomplete medication lists (Medication Engine Slice §10.1), the herb–drug engine runs on available data and discloses the limitation.

### 4.2 Check classes

The engine performs three distinct check classes:

**Herb–drug pharmacokinetic interactions**

Checks whether reported herbal preparations contain phytochemicals that interact with the patient's prescription medications through pharmacokinetic mechanisms: enzyme induction or inhibition (CYP450 family — particularly CYP3A4, CYP2D6, CYP1A2, CYP2C9, CYP2C19), transporter interactions (P-glycoprotein), and absorption interference.

Examples:
- St. John's Wort (Hypericum perforatum) induces CYP3A4, reducing serum concentrations of statins, oral contraceptives, antiretrovirals, immunosuppressants, and many other drugs
- Grapefruit / bitter orange (Citrus aurantium) inhibits CYP3A4, increasing serum concentrations of calcium channel blockers, statins, and others
- Garlic supplements inhibit CYP2E1 and may potentiate anticoagulant effects

**Herb–drug pharmacodynamic interactions**

Checks whether reported herbal preparations have pharmacodynamic effects that compound or antagonize prescription medication effects.

Examples:
- Ginkgo biloba has antiplatelet effects — risk of bleeding with anticoagulants or antiplatelet agents
- Kava (Piper methysticum) has sedative effects — additive CNS depression with benzodiazepines, opioids, or sedating antihistamines
- Licorice root (Glycyrrhiza glabra) causes potassium depletion and sodium retention — compounds risk with diuretics, exacerbates hypertension in patients on antihypertensives
- Echinacea has immunostimulant properties — may antagonize immunosuppressants

**Herb–condition interactions**

Checks whether reported herbal preparations are contraindicated or cautioned for the patient's known conditions, independent of prescription medications.

Examples:
- Ephedra-containing preparations contraindicated in hypertension, cardiovascular disease, and hyperthyroidism
- Ginseng cautioned in diabetes (may affect blood glucose)
- Saw palmetto cautioned in hormone-sensitive conditions
- Kava contraindicated in liver disease

### 4.3 What the engine does not check

- **Herb–herb interactions.** The engine checks herbs against prescription drugs and conditions, not herbs against other herbs. Herb–herb interaction data is extremely sparse, and including it would produce low-confidence signals that erode trust in the engine's higher-confidence outputs. This is a deliberate scope decision, not an oversight. Herb–herb interaction checking is a post-launch maturity item.
- **Dose-response relationships for herbal preparations.** Most herbal preparations are not standardized to a specific phytochemical dose. The engine flags the interaction based on the presence of the preparation, not its dose. Where dose information is available (standardized extracts), the engine may refine its signal — but dose-independent flagging is the launch posture.
- **Quality or authenticity of herbal preparations.** The engine assumes the patient is taking what they report. It does not assess whether the preparation actually contains the labeled ingredients. That is a separate problem (overlapping with fake medication detection) and outside this engine's scope.

---

## 5. Signal model

Herb–drug signals use the **same signal model** as the Medication Interaction & Validation Engine (Medication Engine Slice §5). This is a hard requirement — clinicians, protocol engines, pharmacy workflows, and the AI Clinical Assistant must process herb–drug signals identically to medication engine signals.

### 5.1 Signal structure

Every herb–drug signal contains the same fields as a medication engine signal, plus one additional field:

| Field | Description |
|---|---|
| Signal ID | Unique identifier |
| Check class | Herb–drug pharmacokinetic / herb–drug pharmacodynamic / herb–condition |
| Severity | Critical / major / moderate / minor (same definitions as Medication Engine Slice §5.2) |
| Mechanism | Plain-language and clinical description of why this signal fired |
| Evidence source | Reference to the knowledge base entry, study, or dataset |
| Recommended action | Block / warn / monitor (same definitions as Medication Engine Slice §5.3) |
| Affected entities | Which herbal preparation(s) and which drug(s) or condition(s) are involved |
| **Evidence quality** | **Established / emerging / theoretical** (additional field — see §5.2) |
| Confidence | High / medium / low |
| Timestamp | When the signal was generated |
| Engine version | Which version of the engine and knowledge base produced the signal |
| Source engine | "herb-drug" (always labeled; distinguishes from medication engine signals) |

### 5.2 Evidence quality field

This is the key addition to the signal model for herb–drug signals. Herb–drug interaction evidence varies enormously in quality — from well-established, peer-reviewed clinical data (St. John's Wort interactions) to theoretical concerns based on phytochemical profiles with no clinical confirmation.

**Established.** The interaction has been documented in peer-reviewed clinical studies, systematic reviews, or pharmacovigilance databases. The mechanism is understood and the clinical significance is characterized. Examples: St. John's Wort + CYP3A4 substrates; Ginkgo biloba + anticoagulants.

**Emerging.** The interaction has been documented in case reports, preclinical studies (in vitro or animal), or small clinical studies. The mechanism is plausible and the clinical significance is probable but not definitively characterized. Examples: many garlic supplement interactions; some ginseng–drug interactions.

**Theoretical.** The interaction is plausible based on known phytochemical properties of the herbal preparation and known pharmacology of the drug, but no clinical or preclinical confirmation exists. The signal is surfaced because the mechanistic basis warrants clinician awareness, not because clinical harm has been documented. Examples: lesser-studied West African herbal preparations where phytochemical profiles suggest CYP interaction potential.

**How evidence quality affects signal handling:**

- Evidence quality is visible to the clinician alongside severity. A "major severity, theoretical evidence" signal is clinically different from a "major severity, established evidence" signal — the clinician weighs them differently.
- Evidence quality does not change the signal's recommended action at the protocol level. A critical signal with theoretical evidence still triggers the protocol gate (§6.2). The clinician can then override with rationale that accounts for the evidence quality.
- Evidence quality is visible to the patient in simplified form. Patient-facing language distinguishes: "This interaction is well-documented in medical research" (established) vs "Based on available research, this herbal medicine may interact with your medication" (emerging/theoretical).

### 5.3 Severity calibration for herb–drug signals

Severity is assigned using the same definitions as the medication engine (Medication Engine Slice §5.2), but calibrated for the herb–drug context:

**Critical.** Reserved for herb–drug interactions with established evidence of life-threatening or clinically dangerous outcomes. Examples: St. John's Wort with immunosuppressants (transplant rejection risk); St. John's Wort with antiretrovirals (HIV treatment failure).

**Major.** Clinically significant risk with established or strong emerging evidence. Examples: Ginkgo biloba with anticoagulants (bleeding risk); St. John's Wort with oral contraceptives (contraceptive failure); kava with hepatotoxic drugs.

**Moderate.** Risk exists with emerging evidence or established evidence of manageable clinical significance. Examples: garlic supplements with anticoagulants (additive antiplatelet effect); licorice root with diuretics (hypokalemia risk).

**Minor.** Theoretical or low-probability risk based on phytochemical profile. Examples: many theoretical CYP interactions without clinical confirmation; minor pharmacodynamic additive effects.

The severity calibration is reviewed as the knowledge base matures. As theoretical interactions accumulate clinical evidence (positive or negative), their severity is updated accordingly.

---

## 6. How signals are consumed

### 6.1 Clinician decision surface

At prescribing or refill approval, the clinician sees herb–drug signals alongside medication engine signals, clearly labeled by source engine. Both are ordered by severity (critical first). For each herb–drug signal, the clinician sees: severity, mechanism summary, evidence quality, recommended action, and a link to the full evidence entry.

The clinician can override herb–drug signals using the same override mechanism as medication engine signals (Medication Engine Slice §7.1): clinician identity, rationale text, timestamp, signal ID, engine version. Override rationale may reference evidence quality (e.g., "theoretical interaction only; no clinical evidence; patient stable on this combination for 2 years").

### 6.2 Protocol engine gate

Where protocol governance includes herb–drug screening (which it should for any protocol that also runs the medication interaction engine):

- **Critical herb–drug signal:** protocol cannot execute. Falls back to clinician review.
- **Major herb–drug signal:** protocol cannot execute unless the specific herb–drug signal class is explicitly addressed in the approved protocol. Otherwise falls back to clinician review.
- **Moderate/minor herb–drug signals:** protocol may execute. All signals logged in execution audit.

This mirrors the medication engine gate exactly (Medication Engine Slice §6.2). The protocol engine treats herb–drug signals identically to medication engine signals.

### 6.3 Pharmacy decision surface

At dispense or release, the pharmacist sees herb–drug signals alongside medication engine signals. If new herb–drug signals have appeared since prescribing (e.g., the patient reported a new herbal medicine between prescribing and dispensing), the pharmacist escalates.

### 6.4 AI Clinical Assistant

**Mode 1:** When a patient asks about their herbal medicines ("Is it safe to take moringa with my blood pressure medication?"), Mode 1 references the herb–drug engine's signal data. It presents signals in patient-appropriate language, explains the evidence quality in simplified terms, never suppresses signals, and offers escalation.

If the patient asks about an herbal preparation the engine doesn't recognize, Mode 1 says: "I don't have interaction data for [preparation name]. Your doctor or pharmacist can help you assess whether it's safe to take with your medications. Would you like me to help you book a consult?"

**Mode 2:** Where the intake pathway includes herbal medicine reporting, Mode 2 includes herb–drug signals in the clinical summary for physician review.

### 6.5 Patient-facing signals

Patients see herb–drug signals on their medication detail page, presented alongside medication engine signals. The format is identical except for evidence quality language:

- Established: "Research shows this herbal medicine interacts with [medication]. Your doctor has been made aware."
- Emerging: "Based on available research, this herbal medicine may interact with [medication]. Talk to your doctor."
- Theoretical: "This herbal medicine may potentially interact with [medication] based on its properties. Your doctor can advise you."

Patients do not see override details. They see the outcome: "Your doctor reviewed this interaction and approved your medication."

---

## 7. Patient reporting of herbal medicine use

### 7.1 Reporting pathways

Patients report herbal medicine use through three pathways:

**Structured entry with local names**

The primary reporting interface. A searchable list of herbal preparations organized by:
- Common local names (Twi, Ga, Ewe, Hausa names for Ghana launch)
- English common names
- Botanical / scientific names
- Common brand names or market names where applicable

The patient selects from the list. Each entry in the list is linked to the engine's knowledge base entry for that preparation, which contains the phytochemical profile and interaction data.

**Design principle:** The search must be forgiving. Patients will spell herbal preparation names inconsistently, use regional variants, and mix languages. The search should match on partial text, common misspellings, and alternate names. Example: a search for "prekese" should match Tetrapleura tetraptera; "neem" should match Azadirachta indica; "dawadawa" should match Parkia biglobosa.

**Free text entry**

When the preparation is not in the structured list, the patient can enter a free-text description. Free-text entries produce a **coverage-gap signal** (§8.1) visible to the clinician: "Patient reports using [free-text entry]. No interaction data available for this preparation."

Free-text entries are logged and reviewed periodically to identify preparations that should be added to the knowledge base (common entries not yet covered).

**Photo upload**

The patient can photograph herbal medicine packaging, bottles, or the preparation itself. The photo is stored in the patient's health record and visible to the clinician. At launch, photo upload is for clinician reference — it does not trigger automated image recognition or product identification. Automated herbal preparation identification from images is a post-launch capability.

### 7.2 When reporting happens

- **Onboarding.** The medication reconciliation step in onboarding (Forms/Intake Engine) explicitly asks about herbal medicines, traditional remedies, and supplements. This is not a small-print checkbox — it is a dedicated, prominent question: "Do you use any herbal medicines, traditional remedies, or supplements? Many people do — it helps us keep you safe."
- **Any medication-list update.** When a patient updates their medication list, the herbal medicine section is visible and editable.
- **AI Clinical Assistant (Mode 1).** When a patient mentions herbal medicine use in conversation ("I've been taking moringa"), Mode 1 offers to add it to their profile: "Would you like me to add moringa to your health profile so we can check for interactions?"
- **Clinical touchpoints.** At every consult and program check-in, the clinician or AI prompts for herbal medicine updates.

### 7.3 Completeness signal

Like the medication engine (Medication Engine Slice §10.1), the herb–drug engine flags herbal medicine list completeness:

- **Reported.** Patient has reported at least one herbal medicine, or has explicitly confirmed "I don't use herbal medicines."
- **Not asked.** Patient has not been asked about herbal medicine use. This is a data-quality signal visible to the clinician.
- **Partial.** Patient reported some herbal medicines but the reporting context suggests there may be more. Example: patient mentioned herbal medicines in a Mode 1 conversation but didn't add them to their profile.

---

## 8. Edge cases

### 8.1 Unknown preparation

When a patient reports an herbal preparation not in the engine's knowledge base, the engine produces a **coverage-gap signal**: "No interaction data available for [preparation name]. Clinician review recommended."

The coverage-gap signal is visible to the clinician. It does not block the workflow but signals that the clinician should independently assess the preparation. The preparation name is logged for knowledge base expansion review.

### 8.2 Multi-compound preparations

Many herbal preparations — particularly traditional compound formulations — contain multiple active botanicals. The engine handles multi-compound preparations by:

- Checking each known constituent individually against the medication list
- Producing separate signals for each constituent interaction
- Grouping signals under the preparation name so the clinician sees "Preparation X — 3 interactions found" rather than three unconnected signals

Where the constituent profile of a compound preparation is not fully characterized, the engine produces a data-quality signal: "This preparation may contain additional active ingredients not in our database. Interaction check was performed on known constituents only."

### 8.3 Preparation with no known interactions

When a patient reports a preparation that is in the knowledge base but has no known interactions with their current medications, the engine produces no signal. This is correct behavior — no signal means no flagged interaction, not "we didn't check." The engine run is logged in audit regardless of whether signals were produced.

### 8.4 Stale herbal medicine report

If the patient's herbal medicine report is older than a configurable threshold (recommend 180 days for launch — herbal medicine use changes less frequently than prescription medications), the engine flags the staleness: "Herbal medicine list was last updated [X days] ago. Consider asking the patient to confirm current use."

### 8.5 Patient denies herbal medicine use

If the patient explicitly denies herbal medicine use ("I don't take any herbal medicines"), the engine logs the denial and does not check. The denial is visible to the clinician. The engine does not second-guess the patient's report, but the clinical workflow may prompt re-asking at subsequent touchpoints (especially in markets where herbal medicine use is very common and denial may reflect stigma rather than actual non-use).

---

## 9. Knowledge base

### 9.1 Scope for Ghana launch

The knowledge base at launch covers **30–50 herbal preparations** commonly used in Ghana and West Africa. The preparation list is developed with clinical partners (Korle Bu, Ghana FDA) and prioritized by:

1. **Prevalence of use** in Ghana and West Africa (most commonly used preparations first)
2. **Severity of known interactions** (preparations with critical or major interactions prioritized)
3. **Quality of available evidence** (preparations with established or strong emerging evidence prioritized over theoretical-only)

**Priority preparations for Ghana launch (indicative, not final — requires clinical partner validation):**

Category 1 — High priority (well-documented interactions, high prevalence):
- Neem (Azadirachta indica) — hepatotoxicity concern, CYP interactions
- Moringa (Moringa oleifera) — CYP interactions, potential antihypertensive effects
- Prekese (Tetrapleura tetraptera) — potential anticoagulant and hypoglycemic interactions
- Ginger (Zingiber officinale) — anticoagulant potentiation
- Garlic supplements (Allium sativum) — CYP2E1 inhibition, anticoagulant potentiation
- Turmeric / curcumin (Curcuma longa) — CYP interactions, anticoagulant potentiation
- Aloe vera (oral preparations) — electrolyte disturbance, laxative interaction with cardiac drugs
- Bitter kola (Garcinia kola) — CYP interactions, potential caffeine interaction
- Dawadawa (Parkia biglobosa) — limited data but very high prevalence

Category 2 — Moderate priority (emerging evidence or moderate prevalence):
- Shea butter (oral/medicinal use)
- Baobab (Adansonia digitata)
- Kinkeliba (Combretum micranthum)
- Cryptolepis sanguinolenta — antimalarial traditional use, potential drug interactions
- Vernonia amygdalina (bitter leaf) — potential hypoglycemic and hepatotoxic interactions
- Various traditional antimalarial preparations

Category 3 — Global supplements (common across markets):
- St. John's Wort (Hypericum perforatum) — must include; highest evidence base
- Ginkgo biloba
- Kava (Piper methysticum)
- Echinacea
- Valerian
- Saw palmetto
- Ginseng (Panax ginseng)
- Evening primrose oil
- Black cohosh

### 9.2 Knowledge base structure

Each preparation entry in the knowledge base contains:

| Field | Description |
|---|---|
| Preparation ID | Unique identifier |
| Scientific name | Botanical / pharmacopeial name |
| Common names | List of common names by language and region |
| Known constituents | Active phytochemicals with pharmacological relevance |
| Interaction entries | One per known interaction — drug or condition, mechanism, severity, evidence quality, evidence sources |
| Contraindication entries | Conditions for which the preparation is contraindicated or cautioned |
| Data quality assessment | Overall confidence in the preparation's phytochemical and interaction profile |
| Last reviewed | Date of last clinical review of this entry |
| Reviewer | Name or role of the clinical reviewer |
| Version | Entry version; every update creates a new version |

### 9.3 Knowledge base governance

Updates to the knowledge base follow the same governance model as the medication engine knowledge base (Medication Engine Slice §9.3) and protocol updates (Master PRD §13.5):

- **Clinical review required.** Every new entry and every update to an existing entry requires clinical review by a qualified pharmacologist, clinical pharmacist, or physician with phytopharmacology expertise.
- **Evidence sourcing.** Entries are sourced from peer-reviewed literature, pharmacovigilance databases, WHO monographs on medicinal plants, institutional research (Korle Bu, KNUST, University of Ghana), and Ghana FDA guidance where available.
- **Test coverage.** Knowledge base changes are tested against the signal model before deployment. A change that would alter the severity or recommended action of a previously deployed signal triggers review of active patients affected.
- **Versioning.** Every update is versioned. Signals produced under version N can be traced to the specific rules active at that time.
- **Rollback capability.** A knowledge base update can be rolled back to the previous version if issues are discovered.
- **Review cadence.** The knowledge base is reviewed on a 12-month cycle (matching the standard protocolized pathway cadence in §13.5). High-severity entries (critical/major with established evidence) are reviewed on a 6-month cycle. New entries are reviewed at 3 months after initial deployment.

### 9.4 Knowledge base expansion

The knowledge base grows through four channels:

1. **Clinical partner contributions.** Korle Bu, Ghana FDA, and academic partners contribute interaction data from research and pharmacovigilance.
2. **Coverage-gap signal analysis.** Free-text patient reports and coverage-gap signals are reviewed periodically to identify preparations that should be added. High-frequency coverage-gap preparations (many patients reporting the same preparation not in the database) are prioritized for addition.
3. **Literature monitoring.** New publications on herb–drug interactions are monitored and relevant findings incorporated.
4. **Post-market surveillance.** If a patient experiences an adverse event and their herbal medicine report includes a preparation with a theoretical interaction, the event is flagged for knowledge base review — the theoretical interaction may warrant severity upgrade.

---

## 10. Interaction with the Medication Interaction & Validation Engine

The relationship is defined in Medication Engine Slice §8. This section restates the key points from the herb–drug engine's perspective.

**Shared signal model.** Both engines produce signals in the same format. This is a hard requirement.

**Signals are additive, not overriding.** A herb–drug signal does not cancel or modify a medication engine signal. Both are presented side by side. If a medication has both a drug–drug interaction signal and a herb–drug interaction signal, the clinician sees both.

**Source labeling.** Every signal is labeled with its source engine. Clinicians know whether a signal came from the medication engine or the herb–drug engine.

**Independent execution.** The two engines run independently. A failure in the herb–drug engine does not prevent the medication engine from running, and vice versa. If the herb–drug engine is unavailable, the medication engine still runs and the patient's herbal medicine list is flagged as "not checked — herb–drug engine unavailable."

**Combined reporting.** In operations dashboards and aggregate metrics, herb–drug signals and medication engine signals can be reported separately or together. Override rates, signal rates, and severity distributions are tracked per engine.

---

## 11. Success criteria

The herb–drug engine succeeds when:

- **Every prescribing and refill decision surfaces herb–drug signals alongside medication engine signals.** If a patient has reported herbal medicines, the clinician sees the herb–drug check results at decision time. Verified by audit.
- **Coverage reaches 30–50 preparations at launch with clinician-validated interaction profiles.** Coverage is transparent — clinicians know what the engine covers and what it doesn't.
- **Evidence quality is visible and actionable.** Clinicians can distinguish established interactions from theoretical ones and make informed override decisions.
- **Patient herbal medicine reporting rate exceeds a meaningful threshold.** If patients don't report their herbal medicines, the engine has nothing to check. The onboarding flow, AI Clinical Assistant prompting, and clinical touchpoints must drive reporting. Target: 40%+ of Ghana patients report at least one herbal medicine or explicitly deny use within 90 days of onboarding.
- **Coverage-gap signals drive knowledge base expansion.** The most frequently reported unknown preparations are added to the knowledge base within the first review cycle.
- **Signal latency is clinically acceptable.** Under 2 seconds for a typical herbal medicine profile (consistent with the medication engine target).
- **Signals integrate seamlessly with medication engine signals.** Clinicians cannot distinguish the display treatment — same format, same severity model, same action model, different source label.

---

## 12. Metrics

**Coverage**
- Number of preparations in the knowledge base (launch target: 30–50)
- Percentage of preparations with established evidence (vs emerging/theoretical)
- Coverage-gap signal rate (how often patients report preparations not in the database)
- Top 10 coverage-gap preparations by frequency (drives expansion priority)

**Patient reporting**
- Herbal medicine reporting rate (% of patients who report at least one preparation or explicitly deny use)
- Reporting pathway distribution (structured entry vs free text vs photo upload)
- Reporting completeness signal distribution (reported / not asked / partial)

**Signal quality**
- Signal rate per patient with reported herbal medicines (by severity)
- Override rate (clinician overrides of herb–drug signals, tracked separately from medication engine overrides)
- Override rate by evidence quality (are theoretical signals overridden more often than established ones? Expected: yes)
- False signal rate (signals that were clinically irrelevant based on clinician feedback — tracked over time to calibrate severity)

**Clinical impact**
- Cases where herb–drug signals led to medication change or herbal medicine discontinuation recommendation
- Cases where herb–drug signals led to additional monitoring
- Adverse events in patients with reported herbal medicines (tracked against signal history)

**Knowledge base health**
- Knowledge base update frequency
- Average time from coverage-gap identification to entry creation
- Entries due for review (approaching review cadence deadline)
- Entry version distribution (how often entries are updated)

---

## 13. Dependencies

- **Identity & Authentication Spec v1.0.** Authenticated patient, clinician, pharmacist, moderator, admin, and delegate sessions are required for every actor surface this slice uses.
- **Medication Interaction & Validation Engine slice.** Shared signal model is defined there. Herb–drug engine must conform to it exactly.
- **AI Clinical Assistant slice.** Mode 1 explains herb–drug signals to patients. Mode 2 includes them in clinical summaries. The assistant must handle herb–drug signals with the same presentation framework as medication engine signals plus evidence quality language.
- **Forms / Intake Engine slice.** Onboarding and medication reconciliation flows must include the herbal medicine reporting step with structured entry, free text, and photo upload pathways.
- **Refill slice.** Herb–drug signals are part of the refill interaction check at Step 4. The refill workflow must consume them identically to medication engine signals.
- **Patient medication list infrastructure.** The herbal medicine profile is stored alongside (but distinct from) the prescription medication list. Both are inputs to the engine.
- **Clinical partner relationships (Korle Bu, Ghana FDA).** Knowledge base development depends on clinical partner input for preparation prioritization, interaction validation, and evidence sourcing.
- **Phytochemical reference data.** The engine needs structured phytochemical profiles for each preparation. Sources include WHO monographs, published phytochemical databases, and clinical partner research. Licensing and access to these sources is on the launch critical path.
- **v5 Contracts Pack.** Override rules, audit retention, and signal enforcement for herb–drug signals are governed by the Contracts Pack, identically to medication engine signals.

---

## 14. Open questions (slice-level)

1. **Knowledge base sourcing partners.** Which specific clinical and academic partners provide the initial preparation list and interaction validation for Ghana launch? What is the review process and timeline?
2. **Local name coverage.** How many local languages/dialects need to be covered in the structured entry search for Ghana launch? Twi and English are minimum; are Ga, Ewe, Hausa, and others required at launch?
3. **Herbal medicine prevalence data.** Is there existing prevalence data on herbal medicine use among the target patient population in Ghana that can inform preparation prioritization? If not, can a pre-launch survey be conducted?
4. **Integration with fake medication detection.** Some herbal medicines sold in Ghana may be adulterated with undisclosed pharmaceutical ingredients (e.g., herbal preparations spiked with corticosteroids or NSAIDs). Should the herb–drug engine flag this risk, or is it solely the fake medication detection module's responsibility?
5. **Herb–herb interaction timeline.** At what point post-launch should herb–herb interaction checking be added? Is there sufficient evidence to justify it, or would it produce mostly theoretical signals that erode trust?
6. **Traditional healer partnership.** Should Telecheck engage traditional healers as knowledge contributors or community advisors? This could improve patient reporting rates and knowledge base quality but raises governance and clinical boundary questions.
7. **Regulatory positioning of herb–drug signals.** Does the Ghana FDA consider herb–drug interaction signals as clinical decision support (regulated) or health information (less regulated)? This affects the engine's regulatory posture and required approvals.
8. **Preparation standardization.** Many herbal preparations vary in phytochemical content based on sourcing, preparation method, and batch. How does the engine communicate this variability to clinicians? Should signals include a caveat about preparation variability?

---

## Document control

- **v1.0** — Initial Herb–Drug Interaction Engine slice PRD. Defines three check classes (pharmacokinetic, pharmacodynamic, herb–condition), the evidence quality field (established/emerging/theoretical), patient reporting pathways (structured entry with local names, free text, photo upload), knowledge base scope and governance, signal consumption model, and edge case handling. Derived from Master PRD v1.6 §10 Pillar 5, Medication Interaction Engine Slice PRD v1.0 §8, and Flagged Items Resolution v1.0.
- **Next review:** after knowledge base sourcing partners are confirmed (Q1 above); after preparation list is validated with clinical partners; after Forms/Intake Engine slice defines the herbal medicine reporting step in onboarding.
- **Change discipline:** changes to the signal model, evidence quality definitions, severity calibration, protocol gate rules, knowledge base governance, or patient reporting pathways require explicit owner sign-off. Any change to the signal model must be validated against the Medication Interaction Engine Slice PRD to ensure compatibility.
