# Telecheck — Consolidated Launch Tracker

**Version:** 1.0
**Date:** April 2026
**Status:** Historical support artifact — use with the Registry and current slices; some items have since been resolved elsewhere in the frozen set
**Purpose:** Single source for all open questions, pre-launch decisions, critical-path dependencies, and owner assignments across the full PRD set. This document replaces the need to search 18 individual documents for unresolved items.

---

## 1. Pre-launch decisions (must resolve before launch approval)

These are the six items from Master PRD §23. Launch does not proceed until all six are resolved.

| # | Decision | Owner | Status | Defined done |
|---|---|---|---|---|
| 1 | **Launch protocol library scope** — which protocols activate for Ghana by medication class, program, and pathway | Clinical Governance Lead | Open | Approved protocol list signed off by Ghana MDC/Pharmacy Council; each with version, eligibility, exclusions, accountable clinician, review cadence, test coverage |
| 2 | **AI guardrail template count and coverage** — which templates ship, what scopes they cover, test suites passing | AI Safety & Guardrails Lead | Open | Template list approved; each with scope, test suite, refusal taxonomy, escalation behavior. Conservative Default confirmed as day-one active. Covers Mode 1 and Mode 2 scopes. |
| 3 | **Community moderation capacity** — moderator staffing, languages, hours, escalation SLA | Community Safety & Moderation Lead | Open | 2 moderators daytime + 1 on-call overnight. Crisis SLA under 15 min. Severe harassment under 1 hour. Routine under 24 hours. 3 launch groups confirmed. |
| 4 | **Adverse-event reporting destination** — Ghana FDA pipeline format, cadence, audit | Regulatory & Partner Affairs Lead | Open | Reporting destination confirmed with Ghana FDA; format and cadence agreed; internal workflow built and tested |
| 5 | **Clinician coverage model** — minimum clinician-hours/day, role coverage, scaling triggers | Clinical Governance Lead + Async & Refill Review Lead | Open | 12h async, 8h sync, 24/7 on-call. 5-clinician minimum panel. Scaling threshold for time-to-clinician-decision defined. Compensation model for refill reviews resolved. |
| 6 | **RPM/CCM subscription billing infrastructure** — build or buy, vendor, integration timeline | Payments & Billing Operations Lead | Open | Vendor selected (if buy) or scope confirmed (if build); integration tested with Ghana mobile money; subscription creation and recurring charge verified end-to-end |

---

## 2. Critical-path dependencies (block launch if unresolved)

Items that are not pre-launch "decisions" but are engineering, operational, or partnership dependencies on the launch critical path.

| # | Dependency | Source slice | Owner | Status |
|---|---|---|---|---|
| 1 | WhatsApp Business API verification and template approval | Master PRD §17, Flagged Items Resolution | Payments & Billing Operations Lead | Not started |
| 2 | Payment rail integration — Ghana mobile money | Master PRD §21, Pharmacy Portal | Payments & Billing Operations Lead | Not started |
| 3 | Delivery partner selection and API integration — Ghana | Pharmacy Portal §14 Q1 | Delivery & Fulfillment Lead | Not started |
| 4 | Platform pharmacy location and licensing — Ghana | Pharmacy Portal §14 Q2 | Pharmacy Operations Lead | Not started |
| 5 | Partner pharmacy onboarding (minimum 1) — Ghana | Pharmacy Portal §14 Q3 | Pharmacy Operations Lead | Not started |
| 6 | OCR/extraction pipeline for lab reports (build or buy) | Labs Slice §15 Q1 | Engineering | Not started |
| 7 | Canonical lab vocabulary for Ghana market labs | Labs Slice §15 Q2 | Clinical Governance Lead | Not started |
| 8 | Food recognition AI model adapted for Ghanaian cuisine | Acquisition Tools §12 Q1 | Engineering | Not started |
| 9 | Formulary database for Ghana (medication autocomplete) | Forms/Intake Engine §18 Q1 | Clinical Governance Lead | Not started |
| 10 | Herb-drug knowledge base — 30-50 preparations with clinical validation | Herb-Drug Engine §14 Q1 | Clinical Governance Lead | Not started |
| 11 | Drug interaction knowledge base licensing | Medication Interaction Engine §13 Q1 | Clinical Governance Lead | Not started |
| 12 | Video infrastructure selection (WebRTC provider) | Sync Video §15 Q1 | Engineering | Not started |
| 13 | Speech-to-text infrastructure for AI scribe | Sync Video §15 Q2 | Engineering | Not started |
| 14 | Clinician recruitment — minimum 5 for Ghana | Master PRD §23 Q5 | Clinical Governance Lead | Not started |
| 15 | Moderator recruitment — 2 daytime + 1 on-call for Ghana | Master PRD §23 Q3 | Community Safety & Moderation Lead | Not started |
| 16 | Expert recruitment — minimum 1 per launch community group | Community Platform §15 | Community Safety & Moderation Lead | Not started |
| 17 | Community guidelines — written and clinically reviewed per group | Community Platform §15 | Community Safety & Moderation Lead | Not started |
| 18 | Pregnancy tracking content — clinician-reviewed week-by-week | Acquisition Tools §11 | Clinical Governance Lead | Not started |
| 19 | Reference image library for fake medication detection (top 20-30 meds) | Fake Medication Detection §8.1 | Pharmacy Operations Lead | Not started |
| 20 | Manufacturer verification partnerships for high-volume formulary | Fake Medication Detection §14 Q1 | Pharmacy Operations Lead + Regulatory Lead | Not started |
| 21 | Ghana FDA product register access | Fake Medication Detection §8.1 | Regulatory & Partner Affairs Lead | Not started |
| 22 | Ghana FDA adverse-event reporting format agreement | Adverse Event Reporting §16 Q1 | Regulatory & Partner Affairs Lead | Not started |
| 23 | Identity verification primitive for Ghana (national ID, phone OTP) | Master PRD §24 Q1 | Country Launch Director | Not started |
| 24 | Consent flow UX design and copy — progressive model | Forms/Intake Engine, Consent Slice | AI Safety & Guardrails Lead + Clinical Governance Lead | Not started |

---

## 3. Open questions by slice

All open questions from all slice PRDs, consolidated and cross-referenced. Questions that appear in multiple slices are listed once with all source references.

### Master PRD (§24) — 10 open questions

| # | Question | Owner | Priority |
|---|---|---|---|
| 1 | Identity primitive for Ghana launch (national ID + phone + clinician attestation combination) | Country Launch Director | High — blocks onboarding |
| 2 | Adult-child-managing-parent sensitive-category default starting point | Clinical Governance Lead | Medium |
| 3 | Clinician-gated exceptions to delegate visibility — override mechanism | Clinical Governance Lead | Medium |
| 4 | Consent for AI use of externally contributed data (hospital-uploaded labs, external pharmacy history) | Clinical Governance Lead | Medium |
| 5 | Minor age thresholds by care type per jurisdiction | Clinical Governance Lead + Legal | High — affects consent model |
| 6 | Cross-border delegation — whose consent regime governs | Legal | Low (single-market at launch) |
| 7 | Incapacity and emergency override for delegation | Clinical Governance Lead + Legal | Medium |
| 8 | RPM/CCM pricing model per market | Payments & Billing Operations Lead | Medium |
| 9 | Post-launch DFPAS timing | Product | Low |
| 10 | Community monetization path and disclosure standard | Product + Community Safety Lead | Low |

### Refill Slice — 6 open questions

| # | Question | Priority |
|---|---|---|
| 1 | Refill initiation from AI chat — pre-fill and hand off, or link to medication page? | Medium |
| 2 | Refill countdown visibility — home screen or medication detail only? | Low |
| 3 | Bridge supply default duration — resolved as 14 days in Consent Slice | Resolved |
| 4 | Partial fills — acceptable or full quantity required? (cross-ref: Pharmacy Portal Q5) | Medium |
| 5 | Refill reminder opt-out per medication | Low |
| 6 | Protocol-authorized refill audit review cadence — monthly batch review? | Medium |

### Medication Interaction Engine — 5 open questions

| # | Question | Priority |
|---|---|---|
| 1 | Knowledge base sourcing — which primary database(s), update cadence | High — critical path |
| 2 | Minor-signal display configuration — visible or collapsed by default? | Low |
| 3 | Override carry-forward policy — time-limited carry-forward for stable chronic regimens? | Medium |
| 4 | Multi-market formulary handling | Low (single-market at launch) |
| 5 | Performance target under polypharmacy (15+ medications) | Medium |

### AI Clinical Assistant — 7 open questions

| # | Question | Priority |
|---|---|---|
| 1 | Mode 1 conversation history retention period | Medium |
| 2 | Mode 1 proactive outreach — should AI initiate conversations? | Medium |
| 3 | Mode 2 confidence threshold — program-specific? | High |
| 4 | Mode 1 multilingual support timeline for Ghana | Medium |
| 5 | Mode 1 voice input — launch or post-launch? | Low |
| 6 | Cross-mode data flow — should Mode 2 access Mode 1 conversation context? | Medium |
| 7 | Mode 2 processing transparency — what does the patient see? | Medium |

### Herb-Drug Interaction Engine — 8 open questions

| # | Question | Priority |
|---|---|---|
| 1 | Knowledge base sourcing partners (Korle Bu, KNUST, University of Ghana) | High — critical path |
| 2 | Local name coverage — which languages beyond Twi and English at launch? | Medium |
| 3 | Herbal medicine prevalence data for prioritization | Medium |
| 4 | Integration with fake medication detection for adulterated herbal preparations | Medium |
| 5 | Herb-herb interaction timeline | Low |
| 6 | Traditional healer partnership | Low |
| 7 | Regulatory positioning of herb-drug signals (clinical decision support vs health info?) | High |
| 8 | Preparation standardization — communicating phytochemical variability | Medium |

### Pharmacy Portal — 10 open questions

| # | Question | Priority |
|---|---|---|
| 1 | Delivery partner selection for Ghana | High — critical path |
| 2 | Platform pharmacy physical location | High — critical path |
| 3 | Partner pharmacy onboarding — how many at launch, integration depth | High |
| 4 | Delivery cost model — free, flat fee, distance-based? | Medium |
| 5 | Partial fills (cross-ref: Refill Slice Q4) | Medium |
| 6 | Patient identification at pickup | Medium |
| 7 | Partner pharmacy SLA and violation handling | Medium |
| 8 | Returns and recalls process | Medium |
| 9 | Multi-pharmacy orders — split fulfillment? | Low |
| 10 | Weekend and holiday operations | Medium |

### Labs/Document Interpretation — 8 open questions

| # | Question | Priority |
|---|---|---|
| 1 | OCR pipeline technology — build or buy | High — critical path |
| 2 | Canonical lab vocabulary scope (LOINC vs internal) | High |
| 3 | Reference range source when extraction cannot extract range | Medium |
| 4 | Lab partner integration timeline | Low (post-launch) |
| 5 | Imaging report interpretation depth timeline | Low (post-launch) |
| 6 | Document storage and retention policy | Medium |
| 7 | Lab result sharing/export for external providers | Low |
| 8 | Extraction accuracy targets for clinical safety | High |

### Adverse Event Reporting — 8 open questions

| # | Question | Priority |
|---|---|---|
| 1 | Ghana FDA report format | High — critical path |
| 2 | Causality assessment methodology (WHO-UMC, Naranjo, internal?) | High |
| 3 | Patient consent for external reporting — covered by care consent? | High |
| 4 | Anonymization standard for external reports | Medium |
| 5 | Separate herbal medicine AE reporting pathway for Ghana FDA? | Medium |
| 6 | Cross-border adverse events (post-launch) | Low |
| 7 | Adverse events from AI-only interactions — reportable? To whom? | Medium |
| 8 | Clinician liability documentation — quality improvement privilege? | Medium |

### Consent & Delegated Access — 6 open questions

| # | Question | Priority |
|---|---|---|
| 1 | Minor consent age bands by care type for Ghana | High |
| 2 | Healthcare proxy documentation verification process | Medium |
| 3 | Consent withdrawal vs clinical safety data retention | High |
| 4 | Offline consent capture method and evidence standard | Medium |
| 5 | Consent translation validation for multilingual markets | Low (English-only at launch) |
| 6 | Delegation for community participation — can delegates post on behalf? | Low |

### Forms/Intake Engine — 6 open questions

| # | Question | Priority |
|---|---|---|
| 1 | Formulary database source for Ghana medication autocomplete | High — critical path |
| 2 | Form analytics tooling — built-in or external? | Low |
| 3 | Clinician-initiated intake — through intake engine or direct? | Medium |
| 4 | Multi-language form variants for Ghana (Twi?) | Medium |
| 5 | Photo-based medication identification automation timeline | Low (post-launch) |
| 6 | Pre-populated forms from AI conversation context | Medium |

### RPM/CCM — 7 open questions

| # | Question | Priority |
|---|---|---|
| 1 | Launch program selection — diabetes only, or also hypertension and GLP-1 monitoring? | High |
| 2 | Connected-device availability and affordability in Ghana | Medium |
| 3 | Clinician panel sizing for RPM — max patients per clinician | High |
| 4 | Offline metric entry with queued submission | Medium |
| 5 | Family/community support features beyond delegation | Low |
| 6 | Program graduation or long-term retention model | Low |
| 7 | Gamification calibration | Low |

### Community Platform — 8 open questions

| # | Question | Priority |
|---|---|---|
| 1 | Direct messaging between community members | Medium |
| 2 | Content persistence/expiry policy | Low |
| 3 | Caregiver-specific community groups | Medium |
| 4 | Multilingual community support timeline | Medium |
| 5 | User blocking mechanism | Medium |
| 6 | Community analytics for clinical insights — anonymization and consent | Low |
| 7 | Partner/sponsor content disclosure standard | Low (post-launch) |
| 8 | Group size limits and sub-group model | Low |

### Async Consult — 6 open questions

| # | Question | Priority |
|---|---|---|
| 1 | Follow-up message window duration (7 days?) | Low |
| 2 | Async consult for minors — safeguarding checks | Medium |
| 3 | Consult history visibility depth for clinicians | Medium |
| 4 | Clinician assignment model — continuity vs first-available | Medium |
| 5 | Second-opinion pathway architecture | Low (post-launch feature) |
| 6 | Intake expiry for SLA-breached consults | Medium |

### Sync Video Consult — 7 open questions

| # | Question | Priority |
|---|---|---|
| 1 | Video infrastructure selection (WebRTC provider) | High — critical path |
| 2 | AI scribe accuracy threshold | High |
| 3 | Visit duration enforcement vs flexible overrun | Medium |
| 4 | Group video consults (post-launch) | Low |
| 5 | Screen share for patients | Low |
| 6 | Waiting room content | Low |
| 7 | Post-visit satisfaction survey design | Low |

### Fake Medication Detection — 8 open questions

| # | Question | Priority |
|---|---|---|
| 1 | Manufacturer partnership priority for Ghana | High |
| 2 | Partner pharmacy detection participation model | Medium |
| 3 | Ghana FDA counterfeit reporting format | Medium |
| 4 | Cost absorption for per-use detection methods | Low |
| 5 | Legal liability for detection errors | High |
| 6 | Detection for adulterated herbal preparations (cross-ref: Herb-Drug Q4) | Medium |
| 7 | Cross-border counterfeit intelligence sharing | Low (post-launch) |
| 8 | Whistleblower pathway for pharmacy staff | Medium |

### Acquisition Tools — 7 open questions

| # | Question | Priority |
|---|---|---|
| 1 | Food recognition model — build, fine-tune, or third-party API | High — critical path |
| 2 | Wearable device partnerships for Ghana | Medium |
| 3 | Pregnancy content localization (WHO vs Ghana Health Service guidelines) | Medium |
| 4 | Calorie accuracy communication calibration | Low |
| 5 | Gamification calibration for clinical platform | Low |
| 6 | Tool usage without account creation | Medium |
| 7 | Men's health acquisition tool | Low |

### Admin Configuration Surfaces — 6 open questions

| # | Question | Priority |
|---|---|---|
| 1 | Configuration versioning granularity (every edit vs significant changes) | Low |
| 2 | Test suite maintenance ownership | Medium |
| 3 | Configuration templates vs custom-from-scratch | Low |
| 4 | Cross-market configuration sharing | Low (single-market at launch) |
| 5 | Configuration change notification scope | Medium |
| 6 | Emergency configuration change process — expedited vs bypass | Medium |

### Market Rollout Cockpit — 6 open questions

| # | Question | Priority |
|---|---|---|
| 1 | Multi-role approval workflow — configurable or fixed? | Medium |
| 2 | Pack diff visualization depth | Low |
| 3 | Automated vs manual dependency checking | Medium |
| 4 | Cross-market learning (post-launch) | Low |
| 5 | External stakeholder read-only views | Low |
| 6 | Cockpit availability SLA — does unavailability block changes? | Medium |

---

## 4. Summary counts

| Category | Count |
|---|---|
| Pre-launch decisions (§23) | 6 |
| Critical-path dependencies | 24 |
| Total open questions across all slices | 121 |
| High-priority open questions | ~28 |
| Medium-priority open questions | ~52 |
| Low-priority open questions | ~41 |

---

## 5. Recommended resolution order

### Resolve immediately (blocks everything downstream)

1. Identity verification primitive for Ghana (blocks onboarding)
2. Drug interaction knowledge base licensing (blocks interaction engine)
3. Formulary database source for Ghana (blocks intake, prescribing, autocomplete)
4. Clinician recruitment — 5 minimum (blocks all clinical workflows)
5. WhatsApp Business API verification (blocks notification infrastructure)
6. Payment rail integration — mobile money (blocks all commerce)

### Resolve within 30 days (blocks specific slices)

7. OCR pipeline technology decision (blocks labs)
8. Video infrastructure selection (blocks sync consult)
9. Delivery partner selection (blocks pharmacy fulfillment)
10. Platform pharmacy location and licensing (blocks pharmacy)
11. Herb-drug knowledge base sourcing partners (blocks herb-drug engine)
12. Ghana FDA adverse-event reporting format (blocks AE reporting)
13. Subscription billing vendor (blocks RPM/CCM)
14. Canonical lab vocabulary scope (blocks lab extraction)
15. Food recognition model decision (blocks food scanning)
16. Speech-to-text infrastructure (blocks AI scribe)
17. Moderator recruitment and training (blocks community)
18. Manufacturer verification partnerships (blocks fake-med detection)

### Resolve before launch (blocks launch approval)

19. All six pre-launch decisions (§23 Q1-Q6)
20. Minor consent age bands for Ghana
21. Causality assessment methodology for adverse events
22. AI scribe accuracy threshold
23. Extraction accuracy targets for labs
24. Mode 2 confidence threshold
25. Consent withdrawal vs clinical safety data retention policy
26. Fake medication detection legal liability framework
27. Regulatory positioning of herb-drug signals

### Resolve post-launch (important but not blocking)

Everything rated "Low" priority in the open questions above.

---

## Document control

- **v1.0** — Initial consolidated tracker. Aggregates 6 pre-launch decisions, 24 critical-path dependencies, and 121 open questions from 18 documents into a single actionable reference.
- **Maintenance:** This tracker is updated whenever an open question is resolved, a dependency is cleared, or a pre-launch decision is made. Each resolution is dated and recorded.
