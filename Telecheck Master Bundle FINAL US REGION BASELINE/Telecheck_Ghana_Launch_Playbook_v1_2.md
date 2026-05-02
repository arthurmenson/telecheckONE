# Telecheck — Ghana Launch Playbook

**Version:** 1.2
**Status:** Supporting operations document — leadership decisions still required before launch
**Owner:** Country Launch Director — Ghana
**Purpose:** Operational launch plan synthesized from the full PRD set. Defines who does what, by when, with what gates, for Ghana anchor market launch.

---

## 1. Launch thesis

Ghana launches as a mobile-first, low-friction patient acquisition environment, led by tracking, self-assessment, GLP-1, and men's health/ED programs. Clinical consults and deeper physician workflows expand off that patient base. Conservative AI guardrails, clinician-reviewed refill pathways, hybrid pharmacy operations, advisory-only fake medication detection, and staged activation of protocolized workflows through the Market Rollout Cockpit.

**One-sentence launch description:**

> Telecheck Ghana launches with AI-assisted async care for GLP-1 and men's health programs, clinician-reviewed refills for chronic medications, pharmacy fulfillment with delivery in Accra metro, RPM for diabetes management, moderated patient community, and free health tracking tools — all governed by a conservative-default AI posture with staged protocol activation.

---

## 2. Launch team

| Role | Accountability | Reports to |
|---|---|---|
| **Country Launch Director** | Overall launch gate. Final sign-off on all go/no-go decisions. Owns the Rollout Cockpit Ghana workspace. | CEO / Founder |
| **Clinical Governance Lead** | Protocol library, clinician panel, clinician compensation, clinical safety, adverse-event clinical oversight | Country Launch Director |
| **Async & Refill Review Lead** | Refill review SLA, async consult review SLA, Mode 2 physician workflow | Clinical Governance Lead |
| **Synchronous Care Lead** | Video infrastructure, clinician scheduling, sync consult operations | Clinical Governance Lead |
| **Pharmacy Operations Lead** | Platform pharmacy setup, partner pharmacy integration, inventory, dispensing release readiness | Country Launch Director |
| **Delivery & Fulfillment Lead** | Delivery partner selection, integration, last-mile operations, SLA | Pharmacy Operations Lead |
| **AI Safety & Guardrails Lead** | Guardrail templates, Mode 1/Mode 2 boundary, AI Clinical Assistant quality, guardrail test suites | Country Launch Director |
| **Community Safety & Moderation Lead** | Moderator staffing, crisis SLA, community guidelines, launch groups, moderation policy | Country Launch Director |
| **Payments & Billing Operations Lead** | Mobile money integration, subscription billing vendor, pricing, refund workflows | Country Launch Director |
| **Support & Incident Response Lead** | Incident playbook, adverse-event operations, rollback procedures, patient support | Country Launch Director |
| **Market Control Plane Lead** | Rollout Cockpit deployment, dependency checker, evidence locker, readiness checklist | Country Launch Director |
| **Regulatory & Partner Affairs Lead** | Ghana FDA, MDC, Pharmacy Council engagement, regulatory evidence, adverse-event reporting format | Country Launch Director |
| **Engineering Lead** | Platform build, infrastructure, integrations, deployment | Country Launch Director |

---

## 3. Launch timeline

The timeline is organized into four phases. Dates are relative (T-minus weeks) because the absolute launch date depends on when Phase 1 dependencies clear.

### Phase 1 — Foundations (T-16 to T-8)

Everything that must be decided, contracted, or procured before building can complete.

| Week | Milestone | Owner | Go/no-go |
|---|---|---|---|
| T-16 | Identity verification approach confirmed (phone OTP + national ID path defined; see Identity & Authentication Spec v1.0) | Country Launch Director | Decision gate |
| T-16 | Drug interaction knowledge base license signed | Clinical Governance Lead | Contract gate |
| T-15 | Formulary database source confirmed for Ghana medications | Clinical Governance Lead | Decision gate |
| T-15 | WhatsApp Business API application submitted | Payments & Billing Lead | Dependency start |
| T-14 | Clinician recruitment begins (target: 5 minimum) | Clinical Governance Lead | Recruitment gate |
| T-14 | Moderator recruitment begins (target: 2 + 1 on-call) | Community Safety Lead | Recruitment gate |
| T-14 | Delivery partner shortlist evaluated | Delivery & Fulfillment Lead | Evaluation gate |
| T-13 | Mobile money payment rail integration started (see Payment & Billing Spec v1.0) | Payments & Billing Lead | Engineering gate |
| T-13 | Subscription billing vendor selected | Payments & Billing Lead | Decision gate |
| T-12 | Platform pharmacy location secured | Pharmacy Operations Lead | Contract gate |
| T-12 | Partner pharmacy LOI signed (minimum 1) | Pharmacy Operations Lead | Contract gate |
| T-12 | Video infrastructure vendor selected | Engineering Lead | Decision gate |
| T-12 | OCR pipeline technology selected (labs) | Engineering Lead | Decision gate |
| T-11 | Herb-drug knowledge base sourcing partner confirmed (Korle Bu / KNUST / UG) | Clinical Governance Lead | Partnership gate |
| T-11 | Ghana FDA engagement initiated for AE reporting format | Regulatory Lead | Regulatory gate |
| T-10 | Speech-to-text infrastructure selected (AI scribe) | Engineering Lead | Decision gate |
| T-10 | Food recognition model approach decided (build/fine-tune/API) | Engineering Lead | Decision gate |
| T-10 | Fake medication detection manufacturer partnerships initiated | Pharmacy Operations Lead | Partnership gate |
| T-9 | Canonical lab vocabulary scope defined for Ghana labs | Clinical Governance Lead | Decision gate |
| T-8 | All Phase 1 decisions confirmed. Phase 2 build proceeds. | Country Launch Director | **Phase gate** |

### Phase 2 — Build and integrate (T-8 to T-4)

Engineering builds while clinical, operational, and content work proceeds in parallel.

| Week | Milestone | Owner |
|---|---|---|
| T-8 | Core platform infrastructure deployed to staging (identity, consent, account, messaging; see Identity & Authentication Spec v1.0 and Messaging & Inbox Spec v1.0) | Engineering Lead |
| T-8 | Refill workflow end-to-end in staging | Engineering Lead |
| T-8 | Interaction engine operational in staging with licensed knowledge base | Engineering Lead |
| T-7 | Async consult workflow end-to-end in staging | Engineering Lead |
| T-7 | Pharmacy portal operational in staging (platform pharmacy) | Engineering Lead |
| T-7 | AI Clinical Assistant Mode 1 (Conservative Default) operational in staging | AI Safety Lead |
| T-7 | Herb-drug knowledge base: first 15 preparations validated | Clinical Governance Lead |
| T-6 | Payment rail (mobile money) tested end-to-end per Payment & Billing Spec v1.0 | Payments & Billing Lead |
| T-6 | WhatsApp Business API verified, template messages approved | Payments & Billing Lead |
| T-6 | Notification infrastructure (in-app + WhatsApp + SMS) operational | Engineering Lead |
| T-6 | Labs upload + OCR + confirmation flow operational in staging | Engineering Lead |
| T-6 | RPM/CCM dashboard and metric entry operational in staging | Engineering Lead |
| T-5 | Sync video consult end-to-end in staging (with AI scribe) | Engineering Lead |
| T-5 | Community platform with 3 groups, moderation tools operational in staging | Engineering Lead |
| T-5 | Food scanning, fitness tracking, pregnancy tracking operational in staging | Engineering Lead |
| T-5 | Forms/Intake engine with GLP-1, ED, diabetes, consult templates in staging | Engineering Lead |
| T-5 | Fake medication detection (advisory) operational in staging | Engineering Lead |
| T-5 | Delivery partner API integration tested | Delivery & Fulfillment Lead |
| T-4 | AI Mode 2 (GLP-1 + ED pathways) operational in staging | AI Safety Lead |
| T-4 | 4 guardrail templates defined, tested, and passing test suites | AI Safety Lead |
| T-4 | Herb-drug knowledge base: 30+ preparations validated | Clinical Governance Lead |
| T-4 | All 5 clinicians contracted, onboarded, and trained on platform | Clinical Governance Lead |
| T-4 | 2 moderators + 1 on-call hired and trained | Community Safety Lead |
| T-4 | Market Rollout Cockpit Ghana workspace operational | Market Control Plane Lead |
| T-4 | Adverse-event reporting workflow operational (internal) | Regulatory Lead |
| T-4 | All Phase 2 integrations complete. Phase 3 testing begins. | Country Launch Director |

### Phase 3 — Test, review, and certify (T-4 to T-1)

Comprehensive testing, clinical review, regulatory certification, and launch-readiness assessment.

| Week | Milestone | Owner |
|---|---|---|
| T-4 | End-to-end testing begins: full patient journey (onboard → intake → consult → prescribe → pharmacy → deliver) | Engineering Lead |
| T-4 | Security audit and penetration testing | Engineering Lead |
| T-3 | Protocol library finalized for Ghana (GLP-1 renewals, ED renewals, metformin, statins, antihypertensives, dispensing release, emergency routing) | Clinical Governance Lead |
| T-3 | Protocol test suites passing | Clinical Governance Lead |
| T-3 | Ghana MDC / Pharmacy Council sign-off on protocol library obtained | Regulatory Lead |
| T-3 | Ghana FDA adverse-event reporting format agreed | Regulatory Lead |
| T-3 | Guardrail templates clinically reviewed and signed off | AI Safety Lead |
| T-3 | Community guidelines reviewed and published | Community Safety Lead |
| T-3 | Expert content prepared for 3 launch groups | Community Safety Lead |
| T-2 | Platform pharmacy operational: inventory stocked, labeling tested, cold-chain verified | Pharmacy Operations Lead |
| T-2 | Partner pharmacy integration tested end-to-end | Pharmacy Operations Lead |
| T-2 | Delivery tested end-to-end (Accra metro) | Delivery & Fulfillment Lead |
| T-2 | Subscription billing tested end-to-end (create, charge, retry, pause, cancel) | Payments & Billing Lead |
| T-2 | Reference image library complete for top 20 medications | Pharmacy Operations Lead |
| T-2 | Fake medication detection tested with known-legitimate and known-suspicious samples | Pharmacy Operations Lead |
| T-2 | Incident response playbook documented and walkthrough completed | Support & Incident Response Lead |
| T-2 | Rollback procedures tested (specific config rollback, full Pack rollback, Emergency Safe Mode) | Market Control Plane Lead |
| T-1 | Launch-readiness review: all §12 criteria verified | Country Launch Director |
| T-1 | Rollout Cockpit readiness checklist: all categories "Ready" | Market Control Plane Lead |
| T-1 | Evidence locker complete: all regulatory, clinical, pharmacy, and operational evidence filed | Regulatory Lead |
| T-1 | Go/no-go decision | Country Launch Director |

### Phase 4 — Launch and stabilize (T-0 to T+12)

| Day/Week | Milestone | Owner |
|---|---|---|
| T-0 | **Launch.** Critical-path capabilities go live. Ghana Market Pack v1.0 activated at PILOT state. | Country Launch Director |
| T-0 | War room active: all leads available, incident response on standby | Support & Incident Response Lead |
| T+1 day | First-day metrics review: onboarding completion, payment success, notification delivery, system stability | Country Launch Director |
| T+1 week | First-week review: refill completion rate, time-to-clinician-decision, safety-event handling, audit completeness, community health | Country Launch Director |
| T+2 weeks | 30-day-tolerant capabilities activated as ready (sync video, RPM/CCM first program, community groups, acquisition tools, herb-drug engine, delegation) | Country Launch Director |
| T+2 weeks | Market Pack transitions from PILOT to LIMITED_LAUNCH | Country Launch Director |
| T+4 weeks | Full §11.1 launch scope operational (all 30-day-tolerant items live) | Country Launch Director |
| T+4 weeks | Market Pack transitions from LIMITED_LAUNCH to FULL_LAUNCH | Country Launch Director |
| T+4 weeks | First protocol activation review: should any protocol-authorized pathways activate? | Clinical Governance Lead |
| T+8 weeks | 60-day review: headline metrics, clinician workload, community health, adverse event patterns | Country Launch Director |
| T+12 weeks | 90-day review: full operational review, protocol activation decisions, panel scaling assessment, market expansion readiness assessment | Country Launch Director |

---

## 4. Go/no-go criteria

### Launch go/no-go (T-1)

Launch proceeds only if ALL of the following are true:

**Clinical readiness**
- [ ] 5 clinicians contracted, onboarded, trained, and scheduled
- [ ] Coverage model confirmed: 12h async, 8h sync, 24/7 on-call
- [ ] Protocol library approved by Ghana MDC / Pharmacy Council
- [ ] Clinician compensation model resolved
- [ ] Adverse-event reporting pathway operational (internal minimum)

**AI readiness**
- [ ] Conservative Default guardrail template deployed and tested
- [ ] Additional program templates (GLP-1, ED, Labs) tested and available
- [ ] AI Mode 2 (GLP-1 + ED) tested with physician review workflow
- [ ] Platform floor compliance verified for all templates
- [ ] Crisis detection tested end-to-end

**Pharmacy readiness**
- [ ] At least one pharmacy operational (platform or partner)
- [ ] Fulfillment workflow tested end-to-end
- [ ] Delivery tested in Accra metro
- [ ] Payment collection tested (mobile money)
- [ ] Fake medication detection (advisory) operational

**Technology readiness**
- [ ] All critical-path capabilities functional in production
- [ ] Notification infrastructure operational (in-app + WhatsApp + SMS)
- [ ] Video infrastructure operational (even if sync consults activate at T+2 weeks)
- [ ] Degraded connectivity handling verified
- [ ] Security audit complete, critical findings resolved

**Operations readiness**
- [ ] Incident response playbook documented
- [ ] Rollback procedures tested
- [ ] Market Rollout Cockpit operational with Ghana workspace
- [ ] Evidence locker populated
- [ ] Readiness checklist all-green

**Community readiness**
- [ ] 2 moderators + 1 on-call hired and trained
- [ ] 3 launch groups configured with guidelines
- [ ] Crisis escalation pathway tested
- [ ] At least 1 expert per group available for launch content

**Regulatory readiness**
- [ ] Ghana FDA engagement confirmed
- [ ] MDC / Pharmacy Council sign-offs obtained
- [ ] Platform pharmacy licensed
- [ ] Adverse-event reporting format agreed (or fallback to internal-only with external timeline)

If any category has a failing criterion, launch is delayed. There is no "launch with gaps" option for go/no-go criteria.

---

## 5. Launch day operations

### 5.1 War room

On launch day (T-0) and for the first 72 hours, a war room operates with:
- All 12 launch team leads available (in-person or on-call)
- Real-time monitoring dashboard showing: system health, onboarding funnel, payment success rate, notification delivery rate, clinician queue depth, error rates
- Incident escalation path: any team member can escalate to the war room. Country Launch Director has final authority on emergency decisions.
- Rollback authority: Country Launch Director and Support Lead can trigger Emergency Safe Mode or specific capability rollback

### 5.2 Launch day monitoring

| Signal | Monitor | Threshold | Action if breached |
|---|---|---|---|
| System uptime | Engineering | > 99.5% | Incident investigation |
| Onboarding completion | Product | > 60% of attempts | UX review |
| Payment success rate | Payments Lead | > 90% | Payment rail investigation |
| Notification delivery | Engineering | > 95% | Channel fallback check |
| Clinician queue depth | Async Lead | < 50 pending cases | Panel scaling |
| Critical error rate | Engineering | < 0.1% of requests | Incident escalation |
| Safety event | Support Lead | Any | Immediate review |

### 5.3 Staged activation on launch day

Not everything flips on at T-0 hour zero. The critical-path subset goes live first:

| Hour | Activation |
|---|---|
| H+0 | Account creation, onboarding, consent, identity verification |
| H+0 | AI Clinical Assistant (Mode 1, Conservative Default) |
| H+0 | Emergency escalation and crisis detection |
| H+0 | Notification infrastructure |
| H+1 | Intake forms (GLP-1, ED, chronic care, general consult) |
| H+1 | Medication reconciliation and herbal medicine reporting |
| H+2 | Async consult (AI Mode 2 preparation + clinician review) |
| H+2 | Prescribing workflow + interaction engine + herb-drug engine |
| H+2 | Pharmacy fulfillment (platform pharmacy) |
| H+4 | Refill workflow (clinician-reviewed) |
| H+4 | Lab upload and interpretation |
| H+4 | Payment collection (consults + medications) |
| H+6 | Food scanning, fitness tracking, pregnancy tracking |
| H+8 | Community (3 groups, active moderation) |
| H+8 | Full monitoring: all dashboards, all metrics, all alerts operational |

Each activation is verified before the next proceeds. If an activation fails, the sequence pauses while the issue is resolved. Downstream activations wait.

---

## 6. First 90 days — operational priorities

### Days 1-7: Stabilize

- Monitor all launch-day signals continuously
- Resolve any integration issues discovered in production
- Track first patient journeys end-to-end (onboarding → consult → prescription → delivery)
- Verify audit trail completeness for all completed transactions
- Assess clinician workload and queue health
- Review first community content and moderation actions
- Zero tolerance for safety incidents — any safety event gets immediate investigation

### Days 8-14: Expand within critical path

- Activate 30-day-tolerant capabilities as each is verified ready
- First sync video consults (limited slots, closely monitored)
- First RPM/CCM enrollments (diabetes management program)
- Partner pharmacy integration goes live (if not at T-0)
- Delegation and family care flows tested with real users

### Days 15-30: Full launch scope

- All §11.1 capabilities operational
- Market Pack transitions to FULL_LAUNCH
- Community grows beyond initial seed (monitor moderation capacity)
- Acquisition tools driving downloads and engagement
- First refill cycles completing (initial prescriptions reaching refill eligibility)
- First-month metrics review

### Days 31-60: Optimize and learn

- Clinician workflow optimization (where are clinicians spending the most time? Can Mode 2 summaries be improved?)
- AI guardrail calibration (is Conservative Default too restrictive? Are program templates appropriate?)
- Community moderation calibration (false-positive rates, moderator workload)
- Interaction engine signal calibration (override rates by signal type — are some signals too sensitive?)
- Herb-drug engine coverage assessment (which preparations are patients reporting that aren't in the knowledge base?)
- Fake medication detection false-positive assessment
- Delivery SLA performance (are Accra metro same-day targets being met?)

### Days 61-90: Protocol activation and scaling decisions

- **Protocol activation review.** Based on 60 days of data, should protocol-authorized refill pathways activate for any medication class? What does the clinician review data show — are the cases straightforward enough for protocol handling?
- **Panel scaling assessment.** Is the 5-clinician panel sufficient for current volume? What does the time-to-clinician-decision metric show? When will additional clinicians be needed?
- **AI Mode 2 performance review.** Physician agreement rate with Mode 2 recommendations. Any safety-critical disagreements? Is the 90-day track record building toward eventual auto-approve consideration?
- **Market expansion assessment.** Is the Ghana launch stable enough to begin planning Market #2? What would need to change in the Market Pack for a second market?
- **Comprehensive 90-day report.** All headline metrics, all safety metrics, all operational metrics. Presented to leadership for strategic decisions.

---

## 7. Risk mitigation during launch

| Risk | Mitigation | Trigger |
|---|---|---|
| Payment rail failure | SMS notification to affected patients, manual payment tracking, expedited fix | Payment success < 80% |
| Clinician unavailability (illness, emergency) | On-call clinician activated, async queue prioritized, sync slots temporarily reduced | Fewer than 2 clinicians available |
| Delivery partner failure | Revert all orders to pickup-available, notify patients, source backup delivery | Delivery failure rate > 20% |
| AI produces unsafe content | Revert to Conservative Default (if using program template), review and restrict scope | Any patient-reported safety concern from AI |
| Community crisis (self-harm, abuse) | Crisis detection → safety team → immediate response (always on) | Any crisis detection trigger |
| Counterfeit medication detected | Quarantine batch, trace supply chain, notify clinicians of affected patients, report to FDA | Any confirmed counterfeit |
| WhatsApp API rate limited | Fall back to SMS for critical notifications, in-app for non-critical | WhatsApp delivery rate drops below 80% |
| Data breach or security incident | Incident response playbook, notify affected patients per regulation, engage legal | Any unauthorized data access |
| Ghana FDA regulatory concern | Pause affected capability, engage regulatory lead, provide requested evidence | Any FDA communication expressing concern |

---

## 8. Success metrics — first 90 days

### Headline metrics (from Master PRD §19)

| Metric | Day 30 target | Day 90 target |
|---|---|---|
| Refill completion rate | > 70% | > 85% |
| Time to clinician decision (async) | < 24 hours (95th percentile) | < 12 hours (95th percentile) |
| Safety-event handling latency | < 4 hours for serious | < 2 hours for serious |
| Audit-trail completeness | 100% | 100% |

### Operational metrics

| Metric | Day 30 target | Day 90 target |
|---|---|---|
| Onboarding completion rate | > 60% | > 75% |
| Patient accounts created | [volume target TBD based on marketing] | — |
| Consults completed | [volume target TBD] | — |
| Prescriptions issued | [volume target TBD] | — |
| Refills processed | [volume target TBD] | — |
| RPM enrollments | [volume target TBD] | — |
| Community active members | [target TBD] | — |
| Acquisition tool adoption | > 30% of accounts use at least one tool | > 50% |
| Acquisition-to-clinical conversion | > 5% | > 10% |

### Safety metrics

| Metric | Target |
|---|---|
| Adverse events reported | Tracked (no target — higher reporting may indicate good detection) |
| Interaction engine signal rate | Tracked (calibration signal) |
| Clinician override rate | 5-15% (too low = rubber-stamping, too high = signals too sensitive) |
| Crisis detection triggers | Tracked, every one responded to within SLA |
| Fake medication flags | Tracked, false-positive rate < 20% |
| AI safety escalations | Every one warranted or calibration issue identified |

---

## 9. Post-launch decision calendar

| Timing | Decision | Decision maker |
|---|---|---|
| T+4 weeks | Full launch confirmation (all §11.1 live, move to FULL_LAUNCH) | Country Launch Director |
| T+8 weeks | First protocol activation consideration (any medication class ready?) | Clinical Governance Lead |
| T+12 weeks | 90-day comprehensive review | Country Launch Director + all leads |
| T+12 weeks | Market #2 planning — proceed or not? | CEO / Founder |
| T+16 weeks | AI guardrail template review (Conservative Default still right? Program templates calibrated?) | AI Safety Lead |
| T+24 weeks | First protocol review cadence (6-month review of high-risk protocols if any activated) | Clinical Governance Lead |
| T+24 weeks | Fake medication detection: patient-visible signals — ready to activate? | Pharmacy Operations Lead |
| T+24 weeks | AI Mode 2 auto-approve: 90-day track record complete — ready to consider? | Clinical Governance Lead + AI Safety Lead |

---

## 10. Document references

This playbook synthesizes decisions and requirements from:

| Document | Key content used |
|---|---|
| Master PRD v1.9 | Launch scope, pre-launch decisions, launch-readiness criteria, critical-path subset |
| Payment & Billing Spec v1.0 | Mobile money rails, refunds, subscription billing, reconciliation |
| Identity & Authentication Spec v1.0 | OTP, identity verification, session model, delegate authentication |
| Messaging & Inbox Spec v1.0 | Inbox system-of-record behavior, message types, attachments, read receipts |
| Flagged Items Resolution v1.0 | Ghana launch posture, clinician coverage model, notification architecture, protocol library, guardrail templates, community scope |
| Consolidated Launch Tracker v1.0 | All open questions, dependencies, and resolution priorities |
| All 17 slice PRDs | Workflow details, dependency lists, open questions |
| Canonical Data Model v1.0 | Entity definitions for engineering |
| State Machines v1.1 | Workflow state definitions for engineering |

---

## Operating as one tenant on a multi-tenant platform (added v1.1)

Per ADR-023 multi-tenancy and Adversarial Counsel Review v1.0 finding MEDIUM-15, this section was missing in v1.0 — the playbook was authored as if Telecheck-Ghana were a standalone product, but in fact Telecheck-Ghana is one tenant on the multi-tenant Telecheck platform alongside Heros Health (US tenant).

### Tenant boundary acknowledgment

Telecheck-Ghana is the brand-name and operational identity used in the Ghana market. The underlying Telecheck platform also serves Heros Health as a separate tenant in the US market. Both tenants share platform infrastructure (database, AI services, audit, identity, etc.) but are logically isolated per ADR-023 Model A: separate tenant_id on every record, Row-Level Security policies preventing cross-tenant access, per-tenant KMS encryption keys.

### What's owned by Telecheck-Ghana team (this playbook's scope)

- Telecheck-Ghana brand, marketing, patient acquisition in Ghana
- Telecheck-Ghana clinician roster and clinical operations in Ghana
- Telecheck-Ghana partner pharmacy relationships in Ghana
- Telecheck-Ghana operational oversight: launch, growth, customer support
- Tenant-specific configurations: brand tokens, notification copy variants, adapter selections within Ghana CountryProfile, CCRConfig overrides
- Tenant-scoped role hierarchy per RBAC v1.1: Tenant Owner, Tenant Admin, Tenant Operator, Tenant Billing, Tenant Clinical Lead, Tenant Marketing, Tenant Support — all scoped to Telecheck-Ghana

### What's owned by the Telecheck platform (NOT this playbook's scope)

- Multi-tenant platform infrastructure (deployment, encryption, RLS enforcement, cross-tenant isolation testing)
- Platform-level governance: Platform Clinical Governance, Platform AI Safety, Platform Privacy Officer, Platform Security Officer
- Cross-tenant audit aggregation, cross-tenant pattern detection
- Country profile authoring (the Ghana CountryProfile itself is platform-authored; Telecheck-Ghana selects from its available adapters)
- **Telecheck-US tenant** (the US D2C operating tenant operating in parallel, trading patient-facing as Heros Health DBA; Telecheck-US has its own equivalent of this playbook for its market) *(updated 2026-05-02 per Codex Round-10 Scope 4 MEDIUM-2 finding — was previously stated as `Heros tenant`, using bare `Heros` as a tenant identifier in violation of the C3 brand-structure rule per Master PRD v1.10 §17 + Glossary v5.2)*

### Cross-tenant operational coordination

When an issue affects platform infrastructure (e.g., database migration, AI provider outage, audit chain integrity issue), both tenants are affected and must coordinate:

- Platform Operations alerts both tenant Operations leads
- Tenant Operations leads communicate to their respective patient bases per their tenant-specific notification copy
- Joint post-incident review where infrastructure cause was identified

When an issue is tenant-specific (e.g., Telecheck-Ghana pharmacy partner outage, Telecheck-Ghana DPC compliance question), it is owned by that tenant's team without requiring Heros involvement.

### Escalation paths

| Issue type | Owner | Escalates to |
|---|---|---|
| Telecheck-Ghana clinical safety | Telecheck-Ghana Clinical Lead | Platform Clinical Governance (cross-tenant pattern review) |
| Telecheck-Ghana operational | Telecheck-Ghana Operations Lead | Platform Operations |
| Telecheck-Ghana regulatory (Ghana DPC) | Telecheck-Ghana Privacy Lead | Platform Privacy Officer |
| Platform infrastructure | Platform Operations | Platform Owner |
| Cross-tenant incident | Platform Operations | Both tenant Operations leads + Platform Owner |

### Tenant-context in this playbook's content

All references to "Telecheck" in this v1.0 playbook should be read as "Telecheck-Ghana (the tenant)" unless the context is explicitly platform-level. The war room, support team, and operational metrics referenced in v1.0 sections — all are tenant-scoped to Telecheck-Ghana. The clinician roster, partner pharmacy network, regulatory compliance items — all are Telecheck-Ghana scope.

### Note on existing playbook content

The substance of this playbook (launch team, four-phase timeline, go/no-go criteria, launch-day operations, first 90 days, risk mitigation, success metrics, post-launch decisions) is unchanged. This new section adds the multi-tenant operating context that was missing. When reading the rest of the document, mentally substitute "Telecheck-Ghana tenant" wherever "Telecheck" appears in operational context.

---

## Data residency and cross-border posture (added v1.2 per ADR-026)

This section is operational truth for Telecheck-Ghana launch. It documents where Ghana patient data physically lives, the jurisdictional and contractual obligations that follow, and the disclosures required of patients, clinicians, and regulators.

### Where Ghana patient data lives

Per ADR-026 (which supersedes ADR-025), the Telecheck platform runs in a single AWS region: **us-east-1 (Virginia, United States)** primary, with **us-west-2 (Oregon, United States)** as cold-DR. **All Ghana patient data — clinical records, consent records, audit records, messages, video recordings (where enabled), uploaded documents — is processed and stored in the United States.**

This is a deliberate, architecturally locked decision. It is not a per-tenant choice and not subject to change at launch. Future per-country physical-region routing requires a new ADR superseding ADR-026.

### What this means jurisdictionally

Ghana patient data crossing the border to the United States for processing constitutes cross-border data processing under Ghana's data protection regime. That triggers a set of obligations:

- **Ghana Data Protection Commission (DPC) registration.** Telecheck-Ghana operates as a data controller and registers AWS (US) as a sub-processor for cross-border processing. The specific contractual mechanism — whether Ghana DPC accepts a Standard Contractual Clauses-equivalent instrument, requires a specific bilateral mechanism, or imposes additional conditions — **`[COUNSEL-REQUIRED]`**. This must be confirmed by Ghana counsel before Telecheck-Ghana launches.
- **Patient-facing privacy notice.** The notice given to Ghana patients at registration must clearly disclose that their data is processed in the United States and identify AWS as the sub-processor. Specific disclosure language **`[COUNSEL-REQUIRED]`** — counsel-confirmed wording is required.
- **Clinician onboarding disclosure.** Telecheck-Ghana clinicians must be informed during onboarding that patient data they handle is processed in the United States. This is operational policy, not a regulator requirement; it is captured here so it does not get missed.
- **Sub-processor list.** A complete, accurate sub-processor list must be maintained and disclosed per Ghana DPC obligations and per the patient-facing notice. AWS US is the platform-layer sub-processor; tenant-layer sub-processors (e.g., a Ghana pharmacy partner, an SMS provider) are separately enumerated. **`[COUNSEL-REQUIRED]`** for completeness and disclosure form.

### What this means operationally

- **Latency for Ghana patients.** Round-trip latency from Ghana to us-east-1 is materially higher than the prior af-south-1 framing under ADR-025 — typical ~150–250ms RTT depending on patient connectivity, vs ~50–100ms to af-south-1. This is acceptable for asynchronous workflows (consult requests, refills, RPM data ingestion, lab uploads, messaging). For synchronous video, it is borderline at typical Ghana network conditions; the Sync Video Consult Slice's degraded-mode behavior (audio-only fallback) applies. ADR-026 keeps a Phase 2 / open option for regional media routing (a LiveKit edge node in af-south-1 or eu-west-1 routing media for Ghana patients while data plane remains us-east-1) — explicitly Phase 2, not launch scope.
- **Rights workflows are unchanged in implementation.** Ghana patient access, rectification, and erasure requests are honored through the same mechanisms used for Heros patients. The DPO contact for Telecheck-Ghana is the Telecheck-Ghana Privacy Lead; rights requests route through that role.
- **Sub-processor changes.** Any change to the sub-processor list (new vendor, retired vendor, or substitution) is a governance event that requires re-disclosure to Ghana DPC and may require updated patient notices depending on materiality. The platform's Tenant Configuration governance (per System Architecture v1.2 §13 and Contracts Pack INVARIANTS I-026) governs how this is logged.

### What this does NOT change

- **Per-tenant encryption keys (per ADR-024).** Telecheck-Ghana data continues to be encrypted with the Telecheck-Ghana tenant key, distinct from Heros's tenant key. The keys now reside in us-east-1 KMS (was af-south-1 KMS under ADR-025) but the per-tenant separation is unchanged.
- **Country-driven configuration.** The CCR runtime continues to drive country-specific clinical, regulatory, and operational behavior for Ghana patients (formulary, protocols, retention rules, consent requirements). Per ADR-026, the country abstractions govern jurisdictional and contractual mechanism, not physical region selection at launch.
- **Tenant isolation.** Three-layer enforcement (RLS + tenant_id filtering + per-tenant KMS) is unchanged. The region change does not weaken or strengthen tenant isolation.

### Pre-launch operational checklist (Ghana cross-border posture)

These items are launch-blockers for Telecheck-Ghana and live in the Operational Readiness To-Do v1.5:

- OR-302: Ghana DPC cross-border registration with AWS (US) as sub-processor — **`[COUNSEL-REQUIRED]`** for mechanism specifics
- Patient-facing privacy notice with US-processing disclosure — **`[COUNSEL-REQUIRED]`** for language
- Clinician onboarding disclosure incorporated into Telecheck-Ghana clinician onboarding flow
- Sub-processor list compiled and reviewed — **`[COUNSEL-REQUIRED]`** for disclosure form
- DPO contact (Telecheck-Ghana Privacy Lead) confirmed and named in patient-facing materials
- Telecheck-Ghana Privacy Lead briefed on rights-request workflow

The architectural decision is recorded in ADR-026; the operational artifacts (counsel-confirmed notices, registration filings, sub-processor list) are produced outside this documentation bundle.

---

## Document control

- **v1.2 cycle additions — 2026-05-02 (per v1.10.1 hygiene cycle physical merge of Phase5 delta Group 5E, Rows 13 + 22 + 34):** Concrete operational pilot artifact — Ghana operational references, country-specific clinical / regulatory / pharmacy / community detail are preserved as-is (this artifact is rightly Ghana-specific). Brand framing is reconciled with the C3 brand-structure cascade per v1.10 Master PRD §17: where the playbook surfaces patient-facing/consumer brand for the Ghana market, the canonical consumer DBA is "Heros Health Ghana" (country-instance of the global Heros Health consumer brand on the `ghana.heroshealth.com` subdomain). The operating-tenant identifier remains "Telecheck-Ghana" (used internally for B2B / platform-infrastructure / multi-tenant isolation purposes — see "Operating as one tenant on a multi-tenant platform" below, which is preserved unchanged at v1.1 baseline). Reviewers consulting this playbook for v1.10 cycle changes should read this Document control entry alongside Master PRD v1.10 §17 (canonical brand structure rule) and §10.5 (program catalog architecture, with Telecheck-Ghana's program activation governed by per-program ProgramMarketPolicy). Body content otherwise preserved at v1.2 baseline.
- **v1.2** — Adds new "Data residency and cross-border posture" section per ADR-026 (supersedes ADR-025) and Cycle U-003 of US Region Migration workstream. Documents that Ghana patient data is processed in us-east-1 (United States); enumerates jurisdictional obligations (Ghana DPC registration with AWS US as sub-processor, patient-facing privacy notice, clinician onboarding disclosure, sub-processor list) with `[COUNSEL-REQUIRED]` markers throughout for items requiring counsel-confirmed wording or mechanism. Operational implications (latency, rights workflows, sub-processor change governance) noted. Pre-launch checklist added with cross-references to OR Tracker v1.5 OR-302. Existing playbook content (launch team, timeline, go/no-go criteria, launch-day operations, first 90 days, risk mitigation, success metrics, post-launch decisions, multi-tenant operating context from v1.1) preserved without modification.

- **v1.1** — Adds "Operating as one tenant on a multi-tenant platform" section per ADR-023 multi-tenancy. Threading remediation per Adversarial Counsel Review v1.0 finding MEDIUM-15. Existing playbook content (launch team, timeline, go/no-go criteria, launch-day operations, first 90 days, risk mitigation, success metrics, post-launch decisions) preserved without modification.
- **v1.0** — Initial Ghana Launch Playbook. Defines launch team (12 roles), four-phase timeline (foundations → build → test → launch), go/no-go criteria (7 categories), launch-day operations (war room, staged activation, monitoring), first 90 days operational plan, risk mitigation, success metrics with targets, and post-launch decision calendar. Synthesized from the full PRD set.
- **Next review:** after Phase 1 decisions are confirmed and absolute dates can be set; after Heros greenfield launch (cross-tenant operational learnings from sibling tenant).
- **Change discipline:** changes to go/no-go criteria, launch-day sequence, or success metric targets require Country Launch Director sign-off.
