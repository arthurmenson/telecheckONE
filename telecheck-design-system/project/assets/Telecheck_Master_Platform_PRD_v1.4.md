# Telecheck — Master Platform PRD

**Version:** 1.4
**Status:** Draft for review
**Owner:** Product (Telecheck)
**Companion documents:** v4.2 Contracts Pack (governance), Canonical Data Model, State Machines, OpenAPI, Design System, Patient App IA
**Document type:** Master Platform PRD — defines *what* is being built, *for whom*, *why*, and *what success looks like*. Implementation details live downstream.

---

## 1. Executive summary

Telecheck is an AI-powered telehealth, pharmacy, health-intelligence, and connected-care platform that helps patients get assessed, treated, monitored, and guided through a complete digital care journey. It unifies synchronous and asynchronous care, pharmacy fulfillment, lab interpretation, remote monitoring, full AI clinical assistance, and patient community into one platform rather than leaving patients and operators to stitch them together.

Telecheck is designed as a global platform and anchors its first launch in Ghana. Ghana is the anchor launch market because of proximity to clinical and regulatory partners, real chronic-care demand, real herb–drug intelligence demand, real counterfeit-medication risk, and a workforce context in which protocolized clinical autonomy can responsibly expand access. Architecture, data residency, consent, and launch flows are jurisdiction-aware from day one.

**Telecheck ships v2 directly.** There is no v1 or v1.5 phasing. The launch product includes refill workflows, synchronous and asynchronous consults, lab upload and AI interpretation, RPM/CCM, full AI Clinical Assistant, patient community, delegated family care, herb–drug intelligence, fake medication detection, and the Medication Interaction & Validation Engine as a shared clinical-safety service. Advanced intelligence modules and institutional integrations are sequenced into a post-launch roadmap, not a phased launch.

**Autonomy is protocolized, not open-ended.** Telecheck does not permit open-ended autonomous prescribing, open-ended autonomous dispensing release, or open-ended autonomous emergency down-triage. It does permit *protocol-authorized* actions in narrowly defined, governance-bound pathways where market law, clinical protocol, evidence, and operations allow. Open-ended autonomy remains prohibited under all configurations.

**Revenue is direct patient-pay at launch:** per-visit consult fees shown upfront, per-prescription medication payments, frictionless refills (medication cost only), and monthly RPM/CCM subscriptions. US market claims-based reimbursement and institutional contracting are post-launch.

**Four headline launch metrics:** refill completion rate, time to clinician decision, safety-event handling latency, and audit-trail completeness.

---

## 2. How to read this document and its relationship to others

This PRD sits **above** vertical-slice specs and the OpenAPI surface, and **alongside** (slightly above) the v4.2 contracts pack.

| Layer | Document | Question it answers |
|---|---|---|
| Product truth | **This PRD** | What are we building, for whom, in what order, and why? |
| Operational / platform truth | v4.2 Contracts Pack | How must the platform behave safely and consistently at runtime? |
| Engineering truth | Domain model, state machines, OpenAPI, ADRs | How do we implement it concretely? |
| Experience truth | Design system, Patient App IA, journeys, prototypes | How does it look, feel, and flow? |
| Slice truth | Per-feature PRDs and slice specs | How does *this specific* workflow ship? |

This document deliberately stops short of API schemas, screen layouts, database designs, screen architecture, and legal contract language. Those belong downstream.

Where this PRD and v4.2 appear to conflict, **v4.2 governs runtime behavior** and this PRD is updated to match. Every slice PRD must trace back to a job-to-be-done in §8 and a launch-scope item in §11.

**The Patient App IA document is downstream of this PRD.** This PRD does not introduce screen architecture, tab structure, or navigation decisions. The IA document interprets this PRD's intent into a patient-facing information architecture.

---

## 3. Product vision

**Telecheck is an AI-powered telehealth, pharmacy, health-intelligence, and connected-care platform that helps patients get assessed, treated, monitored, and guided through a complete digital care journey.**

The shorter form: *Telecheck is a smart digital healthcare platform that combines telemedicine, pharmacy, labs, monitoring, AI clinical assistance, and community into one system.*

Telecheck is not a telehealth website with extras. It is a unified care, commerce, monitoring, interpretation, and engagement platform — designed so a patient can move through one continuous journey:

> Symptom or condition intake → AI guidance and triage → clinician review or live consult → prescription or recommendation → pharmacy fulfillment → delivery or pickup → follow-up monitoring → AI-supported interpretation of new labs, medications, food, and health signals → community support and engagement between clinical events.

Where most digital-health products force the patient (and the operator) to stitch together separate tools, Telecheck is the stitching.

---

## 4. Product thesis

Vision is what we're building toward. Thesis is what we believe that makes this the right bet.

**Belief 1 — Fragmented care is the real clinical problem, not the interface problem.** Most telehealth products compete on smoother booking or better video. The real failure is that medication history, lab trends, conditions, herbal co-medication, and monitoring data don't get reasoned over together. Unifying them wins.

**Belief 2 — AI's value in health is interpretation and protocolized execution, not open-ended autonomy.** The enduring AI advantage is surfacing patterns across labs, drugs, conditions, and behavior, and executing narrow, bounded clinical actions under accountable governance. Open-ended autonomous clinical decisions either stay small or break under safety incidents. Interpretation plus protocolized action, under human governance, is where durable value lives.

**Belief 3 — Emerging markets are a feature, not a compromise.** Counterfeit medications, herb–drug realities, chronic disease burden, multi-generational family care, and clinical workforce constraints aren't edge cases to handle later. They're defining requirements that push the platform toward capabilities Western-first products skip. Building for them first — including protocolized autonomy where workforce realities justify it — produces a stronger global product.

**Belief 4 — Modularity is the commercial and clinical advantage.** Refill, consult, labs, herb–drug, RPM, AI chat, community, and DFPAS each have independent demand and independent revenue pathways. Designing the platform as cooperating modules lets us sell, pilot, and iterate on each one without betting the company on a single slice working.

**Belief 5 — Trust is the product.** Patients need to see reliable status. Clinicians need to see auditable decisions. Operators need deterministic market behavior. Every feature that erodes trust is a negative-value feature regardless of how well it demos.

**Belief 6 — Configurable governance beats static rules.** Markets, programs, and user populations differ. A platform that encodes one fixed rule set ships the wrong product for most markets. A platform that encodes configurable guardrails and protocols, bounded by an immutable platform floor, ships the right product everywhere without compromising safety.

---

## 5. The problem

Patients, clinicians, and operators today face three structural problems Telecheck is built to resolve.

**Fragmented care.** Telemedicine, pharmacy, labs, monitoring, follow-up, AI assistance, and community live in separate systems. The patient carries the integration burden, and clinical context gets lost between handoffs.

**Unsupported decisions.** Lab results, medication lists, herbal remedies, food, fitness data, and patient history are rarely interpreted *together*. Risk signals — interactions, contraindications, abnormal trends — are missed because no system reasons across the full picture.

**Weak fit for chronic and emerging-market care.** Existing telehealth players are built around episodic Western primary-care visits. They are weak at chronic disease management, medication-heavy journeys, regulated cross-border commerce, herb–drug realities, counterfeit-medication risk, and workforce-constrained environments where protocolized access expansion is the only way to reach patients at scale.

Telecheck addresses all three by unifying the journey, layering AI interpretation and protocolized clinical action across it, and designing from day one for both global and emerging-market use.

---

## 6. Market and launch strategy

**Anchor launch market:** Ghana. Selected for proximity to clinical and regulatory partners (e.g., Korle Bu, Ghana FDA), real chronic-care demand, real herb–drug intelligence demand, real counterfeit-medication risk, and a workforce context in which protocolized clinical autonomy can responsibly expand access to care. Ghana is the *anchor*, not the ceiling — the platform is designed for global use from day one.

**Architectural posture:** global from day one. Cloud-hosted (AWS, Azure, or GCP), jurisdiction-aware behavior baked into the contracts pack, no Ghana-only assumptions in the data model.

**Launch sequence:**

1. **Anchor launch (Ghana).** Full v2-direct product launches in Ghana with market-specific protocol configuration. Ghana serves as the first operating environment for the full platform.
2. **Regional expansion.** Extend to additional emerging markets where the chronic-care, pharmacy-fulfillment, herb–drug, and protocolized-autonomy thesis travels well. Each market brings its own approved protocols, formulary, and governance.
3. **Global rollout including US.** Onboard markets where modules like AI second opinion, advanced lab interpretation, RPM with claims reimbursement, and pharmacogenomics carry independent commercial weight. US market unlocks claims-based reimbursement pathways.

Each market expansion is governed by v4.2's market-launch and country-of-care rules; this PRD does not redefine them.

---

## 7. User groups

Telecheck serves **six direct user groups plus one external stakeholder group.** Each direct group has distinct jobs, success criteria, and trust requirements.

**Patient.** The center of the platform. Wants to feel assessed, treated, and looked after — not interrogated by a form. Needs calm, intelligible AI; clear next steps; trustworthy medication handling; and the ability to bring their own data (labs, photos, history), ask questions freely, and connect with others.

**Clinician.** Needs to review intake quickly, see AI-surfaced signals without being overwhelmed, make safe prescription and care decisions under synchronous or asynchronous modes, and have every decision auditable. Will not adopt a tool that wastes time or hides liability.

**Pharmacist / pharmacy operator.** Needs a clean queue of validated prescriptions, fulfillment workflows, refill logic, protocol-authorized release oversight, and clear handoffs to delivery or pickup. Needs counterfeit-detection and interaction-check signals visible at the right step.

**Operator / admin.** Runs the business. Configures AI guardrails, moderation policies, protocol activations, care operations, AI oversight, prescription review oversight, outreach, reporting, and compliance dashboards. Treats Telecheck as the operating system of a digital health company.

**Family member / delegated caregiver.** Often the real driver of chronic and elderly care, especially in emerging markets where multi-generational care is the norm. Every delegate has their own Telecheck account and is granted scoped access to a patient's account. Family-and-delegate care is a first-class primitive (see §15).

**Community member.** Patients participating in moderated community spaces — condition-specific groups, program cohorts, expert sessions, peer support. Overlaps with patient role but has distinct trust and safety needs (§13, §16).

**External stakeholder group — regulators and institutional partners** (FDAs, hospitals, insurers). Consumes Telecheck's outputs (audit trails, safety reports, evidence, protocol-activation records) but does not interact with the platform as a direct user at launch. Their needs shape audit, compliance, and reporting surfaces.

---

## 8. Jobs to be done

Across user groups, Telecheck must do the following jobs well. These are the canonical job statements all slice PRDs trace back to.

1. **Enroll a patient into a program** — chronic care, GLP-1, diabetes, discreet consumer health — including consent, intake, eligibility, and clinician sign-off.
2. **Refill a medication safely** — identity, eligibility, interaction checks, clinician oversight or protocol-authorized prescribing where applicable, fulfillment, and delivery.
3. **Upload and interpret a document or lab** — patient brings data in, AI interprets it, clinician validates where required, results connect back to conditions and medications.
4. **Consult a clinician asynchronously or synchronously** — structured intake, AI-prepared summary, live video where appropriate, and decisions captured as auditable artifacts.
5. **Manage pharmacy fulfillment** — from approved prescription to dispense to delivery or pickup, with refill logic, inventory awareness, and protocol-authorized release where applicable.
6. **Monitor chronic conditions over time** — ongoing metric collection, adherence tracking, alert and escalation logic (RPM/CCM).
7. **Handle alerts and follow-up** — RPM signals, adverse events, missed refills, lab-driven flags, escalation to clinician.
8. **Act on behalf of someone else** — delegated care with consent and audit at every step, via delegate-to-account permission bridges.
9. **Converse with AI for clinical understanding** — full AI Clinical Assistant chat for medication questions, lab explanations, symptom understanding, and connected handoffs to clinical care.
10. **Review and oversee AI suggestions and protocol-authorized actions** — clinicians and operators can see, accept, override, and audit AI-generated outputs and protocol executions.
11. **Engage with health independently of clinical visits** — food scanning, fitness tracking, pregnancy tracking, and similar self-directed tools that keep patients active between clinical events.
12. **Participate in patient community** — moderated groups, events, expert sessions, and peer support tied to conditions or programs.
13. **Configure and govern AI, moderation, and protocol behavior** — operators define guardrails, moderation policies, and protocol activations through admin surfaces.

Anything that cannot be traced back to one of these jobs is, by default, out of launch scope unless explicitly added.

---

## 9. Product principles

These principles are non-negotiable design constraints. They are how Telecheck behaves before any feature is added.

**Calm intelligence.** AI should reduce cognitive load, not add to it. Outputs are short, clear, and ranked. Uncertainty is shown, not hidden.

**Protocolized autonomy, not open-ended autonomy.** Telecheck expands access in constrained environments by using protocolized autonomy under accountable clinical governance, not by allowing unrestricted AI-driven clinical action. The platform may automate bounded actions where law, protocol, evidence, and operations support it. It does not grant itself general medical authority.

**Human oversight is the default; protocolized execution is the exception.** Outside of explicitly activated protocols, clinical decisions require accountable human action. AI proposes; clinicians dispose. Protocol-authorized actions exist as controlled exceptions, not as the baseline mode.

**Auditable medical decisions and protocol executions.** Every clinically meaningful action — prescription, override, refill approval, AI acceptance, delegate action, protocol execution, moderation decision — produces an audit artifact. If it is not auditable, it does not ship.

**Jurisdiction-aware by default.** Country-of-care, regulatory posture, market-launch rules, and protocol activation honor the jurisdiction they operate in. No feature assumes a single legal regime.

**Family and delegated care by design.** Consent-bound delegation is a first-class primitive (§15), not bolted on later.

**Configurable governance, immutable floor.** AI guardrails, moderation policies, and clinical protocols are admin-configurable within a hard platform floor. The floor is immutable. Configuration may narrow platform behavior; it may not relax it below the floor.

**Modularity.** Each capability is a module that can be deployed, paused, or sold independently.

**Safety over feature velocity.** Where safety logic and feature scope conflict, safety wins. Always.

**Emerging-market realism.** The platform is designed for environments where counterfeit medication, herbal co-medication, intermittent connectivity, limited diagnostic access, and workforce constraints are real — not edge cases.

**Trust is the product.** Status is honest, actions are reversible where possible, records are never silently altered, and availability is deterministic (§16).

---

## 10. Platform architecture overview

Telecheck is organized as six pillars, each containing one or more modules. This view is *product-level*, not engineering-level.

### Pillar 1 — Telehealth care delivery
Synchronous video consults, asynchronous consults, structured intake, follow-up care, prescription decision support, and care pathways for recurring conditions. Aligned to chronic care, RPM, medication follow-up, and discreet consumer health workflows. Full synchronous video flow — pre-call readiness, live video, transcript/scribe, post-visit summary — is first-class at launch.

### Pillar 2 — AI clinical support and conversational assistant
The interpretation and conversation layer. Reads across labs, medications, conditions, food, fitness, symptoms, interactions, and history — the "second brain" of the platform. Surfaces signals, warnings, and next-step suggestions to both patient and clinician. Includes the full **AI Clinical Assistant** (patient-facing chat), embedded AI cards in other pillars, and clinician-facing AI review. Operates under the three autonomy frameworks in §13.

### Pillar 3 — Pharmacy and prescription commerce
Prescription approval workflows, pharmacy portal, dispensing, refills, delivery, patient purchase flows, product/treatment management, and protocol-authorized release where approved. Telecheck behaves part-clinic, part-regulated-health-commerce.

### Pillar 4 — Remote patient monitoring and chronic care management (RPM/CCM)
Ongoing metric collection, monitoring-based interventions, chronic disease tracking, alert and escalation logic. Monthly-subscription-based at launch; architecturally ready for claims-based reimbursement in later markets.

### Pillar 5 — Advanced health intelligence modules
The defensible, distinctive modules. Several of these are **shared clinical-safety services** that other workflows call into — notably the Medication Interaction & Validation Engine and the Herb–Drug Interaction Engine.

**Medication Interaction & Validation Engine (launch).** The platform's core medication-safety service. Every prescription, refill, and medication-list change is run through it before a clinician decision or protocol execution is finalized. Five check classes:

- **Drug–drug interactions** — pairwise and multi-drug, across the patient's full active medication list. Severity-ranked, mechanism-tagged, accompanied by a recommended action (block, warn, monitor).
- **Drug–condition conflicts** — flags medications contraindicated, cautioned, or dose-adjusted for the patient's known conditions.
- **Drug–lab conflicts** — flags medications against current and trending lab values.
- **Genotype / pharmacogenomic concerns** — flags drugs with known genotype-dependent risk. **At launch, this check runs on sample and reference data only**; it surfaces genotype-aware cautions as advisory signals for clinician consideration, not as validated personalized PGx. Real per-patient PGx pipelines are post-launch (§11.2) and unlock full personalization.
- **Special clinical flags** — domain-specific safety logic such as marrow-suppression risk, hemoglobinopathy-aware dosing, pregnancy/lactation flags, pediatric/geriatric adjustments.

Every check produces a structured signal with severity, evidence/source, mechanism, and recommended action. Signals are presented to the clinician or protocol engine at decision time, never silently auto-acted on, and all overrides are audited per v4.2.

**Other Pillar 5 modules at launch:**
- Lab interpretation engine
- **Herb–drug interaction engine** — phytochemical-aware; consumes the same signal model as the medication engine
- Food and calorie scanning with condition/medication context
- Fitness and behavior signal integration
- Pregnancy tracking
- **Fake medication detection** — operates as an **advisory signal** at launch. Detection results never reach the patient as definitive; they surface to clinician and pharmacist review before any downstream action. This advisory posture reflects the real false-positive risk in counterfeit-detection systems and protects pharmacy-partner trust while the reference data matures.

**Post-launch roadmap modules** (see §11.2):
- AI second opinion
- DFPAS integration (lower-limb circulation biometrics)
- Pharmacogenomics with real PGx data sources

### Pillar 6 — Community and engagement
Moderated patient community. Condition-specific groups, program cohorts, expert sessions, peer support, partner programs, and saved resources. Operates under the moderation autonomy framework in §13. Community is a first-class pillar because patient engagement between clinical events is a primary driver of adherence, retention, and outcomes.

Cross-cutting capabilities (not pillars, but everywhere): identity & consent, audit & compliance, notifications & engagement, admin & operations (including guardrail, moderation, and protocol configuration), analytics & reporting.

---

## 11. Launch scope and post-launch roadmap

Scope is split into two sections: what must be in the product at launch (§11.1) and what is sequenced after launch (§11.2). This separation prevents the roadmap from becoming an unsequenced wishlist and protects launch quality from scope creep.

### 11.1 Launch scope (v2-direct)

Everything below must be present and functional at launch. Launch-readiness criteria (§12) describe the patient-facing foundations that must hold at this scope.

**Care and commerce core**
- Patient identity, consent, and onboarding
- Delegated-access primitive: every user has their own account; delegation is a permission bridge between accounts (§15)
- Forms / intake engine (configurable per program)
- Refill workflow with clinician review and protocol-authorized refill pathways where activated
- Asynchronous clinician review
- **Synchronous video consult** — pre-call readiness, video room, transcript/scribe, post-visit summary
- Prescription approval and audit
- Pharmacy portal with dispense + delivery handoff
- Protocol-authorized dispensing release pathways where activated
- Messaging / inbox (patient–clinician, patient–pharmacy, patient–support, patient–AI)

**AI clinical support and assistant**
- AI lab interpretation (human-reviewed where required by governance)
- **Full AI Clinical Assistant chat** — global launcher, embedded cards, full workspace
- AI guardrails configured via admin (§13, §14)
- Clinician-facing AI review tooling

**Pharmacy intelligence (shared services)**
- Medication Interaction & Validation Engine (drug–drug, drug–condition, drug–lab, genotype, special flags)
- Herb–drug interaction engine
- Fake medication detection

**Chronic care**
- RPM / CCM — manual and connected-device intake for selected chronic programs, monthly-subscription billing

**Monitoring and engagement modules**
- Food and calorie scanning with condition/medication context
- Fitness and behavior tracking
- Pregnancy tracking

**Community**
- Moderated groups, events, expert sessions, peer support
- Moderation policies configured via admin (§13)

**Family and delegation**
- Multi-delegate support per account
- Delegation relationship types with patient-customizable defaults (§15)
- Delegated consults and delegated refill requests

**Safety and compliance**
- Basic adverse-event reporting
- Emergency escalation and routing (§13)
- Audit, consent, and jurisdiction enforcement

**Admin and operations**
- Admin operations console (queues, oversight, audit views)
- **Guardrail configuration for AI** (§13, §14)
- **Moderation policy configuration for community** (§13, §14)
- **Protocol activation and governance tooling** (§13, §14)
- Notifications and follow-up nudges
- Reporting basics (operational dashboards)

### 11.2 Post-launch roadmap

Sequenced after launch. Each item requires its own feature PRD and governance review before build. Ordering within this section is indicative, not committed.

- AI second opinion module
- Pharmacogenomics / genotype-aware decision support with real PGx data sources
- DFPAS integration
- Enterprise / institutional partnership tooling
- US market RPM/CCM with claims-based reimbursement
- Multi-market expansion tooling (jurisdiction-aware launch flows)
- Advanced analytics and outcomes reporting
- Expanded protocolized-autonomy pathways (see §13 for launch constraints)
- Pediatric, pregnancy, and lactation protocolized pathways (explicitly post-launch; see §13)
- Admin-configurable relaxation of serious community moderation actions (see §13.3)

### 11.3 Launch activation sequencing

Launch scope (§11.1) is a single release, but not every capability within it flips on at the same moment. Some capabilities are **operational on day one** — they work for real patients from launch hour zero. Others are **built and testable at launch but progressively activated after market-specific approval or partner readiness**. This distinction is not phasing returning under a new name; it is the legitimate separation between *shipping a capability* and *clearing its operational gates*.

All capabilities in §11.1 are **built, tested, audited, and present in the launch product**. The distinction below is about when they become patient-visible or patient-impacting in the anchor market.

**Operational on day one (Ghana)**

- Patient identity, consent, and onboarding
- Delegated-access primitive and core delegation flows
- Forms / intake engine
- Refill workflow with clinician review (refill renewals via clinician, always available)
- Asynchronous clinician review
- Synchronous video consult (subject to clinician supply being in place)
- Prescription approval and audit
- Pharmacy portal with dispense + delivery handoff
- Messaging / inbox
- AI lab interpretation (human-reviewed)
- AI Clinical Assistant chat under conservative default guardrail template
- Medication Interaction & Validation Engine (shared service, all five check classes)
- Herb–drug interaction engine (advisory)
- Basic adverse-event reporting
- Emergency escalation and routing
- Audit, consent, and jurisdiction enforcement
- RPM / CCM for the initial activated chronic program(s)
- Food and calorie scanning, fitness tracking, pregnancy tracking
- Admin operations console, audit, and oversight dashboards

**Built and testable at launch; activated after market-specific approval**

- **Protocol-authorized refill pathways.** Built at launch; activated per medication class and program after Ghana MDC / Pharmacy Council sign-off on each specific protocol. Until activated, every refill flows through clinician review.
- **Protocol-authorized dispensing release.** Built at launch; activated per low-risk medication class after Pharmacy Council and partner-pharmacy governance approval.
- **Protocol-authorized emergency routing beyond default red-flag detection.** Default red-flag detection and escalation are operational on day one. Additional protocolized triage support activates per specific symptom pathway after clinical governance approval.
- **Fake medication detection signals surfacing to patients.** At launch, detection results surface only to clinician and pharmacist review (advisory posture, §10 Pillar 5). Patient-visible signals activate after false-positive rates are validated in Ghana supply chain data.
- **Additional AI guardrail templates beyond the conservative default.** The conservative default template is operational on day one. Program-specific and relaxed templates activate after test suites pass and governance approval.
- **Expanded RPM/CCM chronic programs.** The launch-selected program(s) operate day one; additional programs activate as protocols, clinician supply, and device availability align.
- **Community groups beyond the curated launch set.** A curated initial group set launches day one under active moderation. Additional groups, event types, and partner programs activate as moderation capacity and community health signals warrant.

**What this is not**

This is not a commitment to launch with gaps. Every capability in §11.1 is present, tested, and audited at launch. What sequences is *activation under live market conditions*, which is gated by regulatory approvals, partner readiness, and incident observation, not by engineering completeness. A capability that is "built and testable at launch" is fully functional — it simply has not been turned on for patient use in the anchor market pending its named approval.

Launch-readiness criteria (§12) apply to *all* of §11.1 — both day-one-operational and activated-after-approval capabilities — because every capability must be present and functional at launch to be considered part of the launch product.

---

## 12. Launch readiness criteria

Launch is not a date; it is a state. The following patient-facing and operator-facing foundations must exist and function at launch. These are product-level commitments, not engineering specifications — the Patient App IA and Design System translate them into screens and flows.

**Patient-facing foundations**

- **Inbox and messaging.** Patient can send and receive messages with clinicians, pharmacy, support, and AI. Messages are threaded, searchable, and tied to the patient's clinical context.
- **Full synchronous video flow.** Doctor search, profile, availability, booking, payment, pre-call device check, waiting room, live video, transcript/scribe, and post-visit summary all function end to end.
- **Family switcher and delegate UX.** Patients who act on behalf of family members can switch context safely. "Viewing: [name]" indicators are persistent. Invite and revoke flows work.
- **Program dashboards.** Active programs, milestones, adherence, check-ins, and care pathway status are visible to the patient and the care team.
- **Medication detail pages.** Each active prescription has a detail view including why prescribed, dosing history, side effects, adherence, clinician/pharmacy notes, and refill status.
- **Lab upload with extraction confirmation.** Upload via camera or file, OCR/extraction preview, edit/confirm step, and save-to-history. Not a fire-and-forget queue.
- **Lab trend and drill-down views.** Time-series, panel comparisons, medication overlays.
- **Persistent emergency control.** Visible, reachable in every primary surface.
- **Persistent notifications surface.** Not buried.
- **Consent flows.** For platform, care, data-use, delegation, jurisdictional, and episode consent (§15). Visible, granular, revocable.
- **Universal empty, loading, failure, and offline states.** Every screen has intentional states for no-data, slow-data, failed-data, and offline operation. Failure is never a blank screen.
- **AI Clinical Assistant presence.** Global launcher, embedded cards in Home, Labs, Pharmacy, Care. Full workspace reachable from any launcher.
- **Community access.** Moderated groups, events, and peer support reachable at launch with starting content for anchor-market conditions.

**Operator-facing foundations**

- **Guardrail configuration tooling for AI.** Admin can select, customize, test, and deploy guardrail templates per market and program.
- **Moderation policy configuration tooling.** Admin can configure community moderation rules, moderator roles, escalation pathways.
- **Protocol activation and governance tooling.** Admin can view, activate, version, test, and roll back clinical protocols per market and program.
- **Audit and oversight dashboards.** Full visibility into AI outputs, protocol executions, moderation actions, and delegate activity.

**Clinician-facing foundations**

- **Review queue with prioritization.** Async reviews, sync consult prep, protocol-flagged items, escalations.
- **Decision capture.** Every accept, override, or escalation is captured with rationale.
- **AI summary and signal view.** AI-prepared intake summaries, interaction signals, and lab interpretations surfaced at decision time.

If any of these foundations is not ready at launch, launch is delayed. Shipping partial-v2 with gaps and "we'll add inbox in the first patch" is explicitly not acceptable — these foundations are the trust contract with the user.

---

## 13. AI, moderation, and clinical autonomy — three frameworks

Autonomy in Telecheck operates in three distinct domains. Each has its own framework. All three share a common shape: an immutable platform floor, a configurable envelope above the floor, and mandatory audit. All three share the same vocabulary — *open-ended autonomy* for what remains prohibited, *protocol-authorized* or *guardrail-configured* for what is allowed under governance.

### 13.1 Protocolized clinical autonomy

Applies to: prescribing, dispensing release, emergency triage, and any other direct clinical action.

**Principle.** Telecheck does not treat autonomy as a binary choice between "AI only advises" and "AI fully replaces clinicians." In markets where law, clinical governance, workforce realities, and operating conditions permit, Telecheck may enable protocolized autonomy for selected workflows.

**Protocolized autonomy** means the platform may execute a narrow, pre-approved clinical or operational action without per-instance human review **only** when all of the following are true:

- The action is permitted by applicable law and **market-launch policy** — the per-market configuration maintained in the v4.2 contracts pack that specifies which workflows, protocols, formularies, and autonomy activations are permitted in that market, and under what conditions
- The action is governed by a formally approved protocol, standing order, collaborative practice arrangement, or equivalent jurisdiction-specific accountable clinical framework
- The action is limited to a whitelisted use case, medication class, or triage pathway
- Required data inputs are present, current, and pass quality checks
- No exclusion, red flag, uncertainty threshold, or escalation condition is triggered
- The action is fully logged with protocol version, model version where applicable, and actor chain
- A named accountable human role exists at the policy layer, even if not at the per-instance layer

Protocolized autonomy is not general autonomous medical practice. It is a constrained execution model inside a bounded clinical and regulatory envelope. Where a market does not permit protocolized autonomy, the stricter rule applies automatically.

**Protocol-authorized prescribing.** Telecheck supports protocol-authorized prescribing in selected markets and programs, under accountable clinical governance and within a defined clinical envelope. Open-ended autonomous prescribing outside this envelope is not permitted. Examples of allowed pathways: renewal of an existing stable medication under defined refill criteria; initiation of a low-risk medication within a closed self-care or programmatic pathway; conversion of a clinician-approved standing protocol into an order when eligibility criteria are satisfied.

Every protocol-authorized prescribing action must satisfy: medication on a whitelisted formulary; indication on a whitelisted list; identity verified to required level; required history, allergy, interaction, contraindication, pregnancy/lactation, age, and condition checks passed; required labs or monitoring inputs present and within thresholds; no severe interaction, contraindication, exclusion, or uncertainty condition triggered; action within a named approved protocol version; accountable clinical governance exists for that protocol in the market.

The following always require human review at launch: first-time prescribing outside narrow self-care protocols; controlled medicines; high-alert medications; **pediatric prescribing**; **pregnancy and lactation cases**; severe comorbidity, frailty, or polypharmacy outside approved care programs; abnormal labs that cross clinician-review thresholds; cases with missing or stale required data. Pediatric, pregnancy, and lactation protocolized pathways are explicitly post-launch (§11.2) and require dedicated governance review before activation.

All protocol-authorized prescribing actions are audited as **protocol-executed actions**, not clinician-authored individualized prescriptions, unless a clinician explicitly signs or adopts the order.

**Protocol-authorized fulfillment and dispensing release.** Telecheck distinguishes between *autonomous fulfillment operations* (picking, labeling, packaging, routing, delivery orchestration) and *autonomous clinical release*.

Telecheck supports autonomous fulfillment operations for approved orders where market rules and pharmacy workflow design allow. Telecheck supports protocol-authorized clinical release in narrowly defined low-risk medication classes and refill pathways under accountable pharmacy governance. Open-ended autonomous clinical dispensing release is not permitted.

Telecheck may permit protocol-authorized dispensing release only when: the prescription or refill has already passed required prescribing authorization; the medication is in an approved low-risk release class for that market; no new safety signal, interaction, substitution issue, inventory mismatch, cold-chain concern, or exception condition is present; labeling and patient instructions are generated from approved content; pharmacist or accountable pharmacy governance exists for the protocol; all release logic is versioned, testable, and auditable.

Mandatory human pharmacy review remains required for: controlled medicines; first fills; dose changes; high-alert medications; complex compounding; cold-chain exceptions; flagged interaction or contraindication cases; counterfeit-verification exceptions; substitution or stock-replacement exceptions.

Default posture: autonomous fulfillment may expand first; protocol-authorized release may expand second *through the same governance process as any other protocolized autonomy activation*; open-ended autonomous dispensing release remains disallowed.

**Protocol-authorized emergency routing and triage support.** Telecheck supports protocol-authorized emergency routing and triage support: red-flag detection, priority classification, presentation of emergency instructions, routing to emergency contacts, call centers, ambulance dispatch pathways, or urgent queue placement, automatic escalation to a human reviewer, and interruption of routine workflows when emergency criteria are met. Open-ended autonomous emergency disposition is not permitted.

**Autonomous reassurance is prohibited for acute or ambiguous presentations.** Telecheck may not provide autonomous reassurance or final non-urgent disposition in acute or ambiguous cases. Where connectivity is degraded, the system must fail toward emergency information display, conservative escalation, and local emergency contact guidance rather than false reassurance.

Mandatory escalation or emergency pathway activation is required for at minimum: chest pain with defined danger features; stroke-like symptoms; severe shortness of breath; anaphylaxis indicators; suicidal ideation with plan or imminent risk indicators; altered mental status; obstetric emergency indicators; severe bleeding; any symptom cluster that crosses the market's emergency escalation threshold.

### 13.2 Guardrail-configured conversational autonomy

Applies to: the AI Clinical Assistant (patient-facing chat) and any embedded AI conversational surface.

**Principle.** AI conversation is governed by admin-configurable guardrails bounded by the platform floor (§13.4). Guardrails define what the AI may discuss, how it frames uncertainty, when it escalates, what it refuses, and how it presents itself. Guardrails are versioned, testable, auditable, and deployable per market, per program, or per user population.

**Guardrail templates.** Telecheck ships with clinically reviewed guardrail templates — conservative / standard / program-specific — that operators may use as-is or customize. Every guardrail configuration must pass its associated test suite before activation. Ongoing tests run against deployed configurations.

**Mandatory framing.** Regardless of configuration, AI conversation always includes: visible AI labeling; reviewed-vs-not-reviewed indicators where clinical interpretation is surfaced; confidence and rationale for clinical claims; a visible escalation path to a clinician; refusal-with-explanation when a query falls outside the active guardrail's scope.

**Family-context awareness.** When the acting user is operating as a delegate for another account, AI conversation must surface the delegate context visibly and apply the target account's consent and access rules to what it may discuss.

### 13.3 Protocol-authorized moderation autonomy

Applies to: community moderation actions.

**Principle.** Community moderation is governed by admin-configurable moderation policies bounded by the platform floor (§13.4). Moderation policies define what content is allowed, what triggers automatic action, what requires human review, how users are warned or suspended, and how escalation works.

**Moderation actions spectrum.** Moderation actions range from reversible (hide post, warn user, restrict posting temporarily) to serious (account-level suspension, any irreversible enforcement, emergency escalation linked to a real user, safety-team escalation). Reversible actions may be protocol-authorized under active moderation policy.

**Serious moderation actions require human review at launch.** Account suspension, irreversible enforcement, and emergency escalations tied to a specific user are human-reviewed actions at launch, regardless of moderation policy configuration. Admin-configurable relaxation of this rule is explicitly a post-launch capability (§11.2) that requires its own governance review and incident data from launch operations. This conservative posture at launch mirrors the approach for pediatric, pregnancy, and lactation clinical pathways: ship conservative, expand deliberately with evidence.

**Mandatory framing.** Community content always includes: clear distinction between peer content, expert content, and AI-generated content; moderator presence indicators; reporting mechanisms; and a visible path to escalate safety concerns.

**Crisis detection is not admin-configurable.** If a community post signals self-harm, abuse, or emergency, mandatory runtime behavior triggers regardless of moderation policy: alert, escalate, surface resources. Operators cannot configure this away.

### 13.4 The non-negotiable platform floor

No market configuration, admin guardrail, moderation policy, or protocol activation may authorize the platform to do any of the following. This floor is immutable. Configuration may narrow platform behavior further; it may not relax it below the floor.

**Clinical action floor.**
- No open-ended autonomous prescribing outside an approved bounded protocol
- No open-ended autonomous dispensing release outside an approved bounded protocol
- No open-ended autonomous emergency down-triage or final non-urgent disposition without approved bounded protocol logic and required fallback behavior
- No autonomous consent capture for actions with clinical or legal weight
- No autonomous modification or revocation of a delegate's access
- No bypass of sensitive-category visibility rules for delegates without explicit patient confirmation

**AI behavior floor.**
- No concealment that a user is interacting with AI when asked directly
- No impersonation of a named individual human clinician
- No suicide means assistance or other clearly harmful instructions
- No specific dosing advice to users outside an authenticated, consented care relationship
- No diagnosis of a named condition as definitive without clinician review
- No override of required consent, identity, jurisdiction, or safety gating
- No bypass of mandatory escalation conditions

**Community floor.**
- No platform-tolerated peer-to-peer sale or exchange of medications
- No platform-tolerated sexualization or solicitation of minors
- No platform-tolerated doxing or targeted harassment
- No override of crisis detection and escalation
- No tolerance of verified safety-critical misinformation

**Always-on behaviors.**
- Audit logging of all protocol executions, AI outputs with active guardrail version, and moderation actions
- Crisis detection and escalation across chat, community, and clinical surfaces
- Fail-safe toward emergency information and conservative escalation during degraded operation

This platform floor applies regardless of market, program, configuration, or protocol. Attempts to configure below the floor are rejected at runtime.

### 13.5 Governance of configurable autonomy

Any relaxation from strict human-in-the-loop operation to protocolized autonomy, any guardrail template activation, and any moderation policy activation must be governed by runtime policy specifying: market, program, workflow, protocol or policy identifier and version, eligible user population, approved formulary or action class, required inputs, exclusion criteria, uncertainty thresholds, escalation triggers, accountable human role, audit retention requirements, review cadence, and rollback conditions.

No protocolized autonomy, guardrail configuration, or moderation policy may be enabled without: clinical or domain approval; regulatory/legal approval where required; test coverage for happy-path and exception-path behavior; audit visibility in operations tooling; and the ability to disable quickly.

**Review cadence.** Active protocols, guardrail configurations, and moderation policies must be reviewed on a cadence calibrated to risk:

- **High-risk clinical protocols** (e.g., protocol-authorized prescribing, dispensing release in low-risk classes, emergency triage support): **6 months**
- **Standard protocolized clinical pathways** (e.g., refill renewals for stable chronic medications on established formulary): **12 months**
- **Moderation policies and AI guardrail templates**: **6 to 12 months**, calibrated to incident rate and market changes

**Incident-triggered review.** Review at the stated cadence, *or immediately when incident rate crosses a defined threshold, whichever comes first*. Scheduled cadence is a ceiling, not a floor. Rising incident signals trigger off-cycle review regardless of calendar.

**Sunset and rollback.** Every active configuration has a stated validity window after which it automatically reverts to the stricter default unless actively renewed. Every activation has a documented rollback path that can be executed quickly by operations.

---

## 14. Admin configuration surfaces

Because AI guardrails, moderation policies, and clinical protocols are all admin-configurable, the admin surface is a first-class product area. It is not backend plumbing; it is a product.

**Guardrail configuration for AI.** Admin selects from guardrail templates, customizes scope (what AI may discuss, how it frames uncertainty, when it escalates, what it refuses), runs the associated test suite, and deploys per market and program. Deployed guardrails are versioned; rollback is one action. Every AI response logs the active guardrail version.

**Moderation policy configuration for community.** Admin defines allowed content categories, automatic actions and their thresholds, moderator roles and permissions, escalation pathways, and reporting flows. Crisis detection behaviors are visible but not editable (they are platform-floor).

**Protocol activation and governance.** Admin views available protocols, activates them per market and program, assigns accountable human roles, configures eligibility criteria and exclusion rules within the protocol's bounds, and manages the review/sunset schedule. Activation requires clinical sign-off captured in the tool.

**Audit and oversight.** Admin can see every protocol execution, guardrail decision, moderation action, and delegate activity across their market. Filtering, export, and incident investigation flows are first-class.

These surfaces exist at launch (§12). They are not admin utilities to be added later — they are how operators run the platform safely.

---

## 15. Consent and delegated access model

Consent and delegation are first-class primitives. Every slice inherits from this section rather than defining its own consent behavior.

### Account model

**Every user has their own Telecheck account.** There are no nested accounts, no guardian accounts that contain child accounts, no account hierarchies. Delegation is a **permission bridge between accounts**, not an account structure.

A parent in Ghana managing their own health, their minor child's care, and their elderly parent's care has: one account (their own) as primary holder; delegated access into their child's account with parent-of-minor defaults; delegated access into their elderly parent's account with adult-child defaults, subject to the parent's consent.

All actions taken under delegation are recorded in the *target account* with the delegate's identity attached.

### Consent types

Consent is not a single boolean. Six distinct types:

1. **Platform consent** — to use Telecheck at all (terms, baseline data handling, identity verification).
2. **Care consent** — to receive clinical care via the platform (consult, prescribing, monitoring, protocolized actions). Has clinical legal weight.
3. **Data-use consent** — for specific data flows (AI interpretation, pharmacy partner sharing, hospital sharing, anonymized analytics, community participation).
4. **Delegation consent** — granted by the account holder to a delegate to act on their behalf, with scope.
5. **Jurisdictional consent** — market-specific regulatory consents (e.g., Ghana FDA reporting, data residency rights).
6. **Episode consent** — for specific clinical episodes separate from ongoing care (e.g., one-off second opinion).

Each has different revocation semantics, evidence requirements, and downstream consequences.

### What "granted" means

Every consent record carries five attributes:

- **Scope** — what was consented to
- **Granularity** — at what level of detail
- **Duration** — perpetual until revoked, or time-bounded
- **Evidence** — the artifact proving consent (signed form, voice recording, in-app affirmation, clinician attestation, legal document)
- **Versioning** — which version of the terms or scope applied at consent time

Without these five, an action cannot be audited back to a consent basis.

### Delegation as a primitive

**Relationship types** are a first-class attribute of every delegation:
- Parent of minor
- Adult child (managing an elderly parent)
- Spouse / partner
- Professional caregiver (hired, non-family)
- Healthcare proxy with legal documentation

**Suggested defaults by relationship type** (patient-customizable at setup):

| Relationship | Default visible | Default hidden (patient can grant) |
|---|---|---|
| Parent of minor | Everything clinically relevant to caring for the child | Clinician-marked notes (e.g., safeguarding concerns) |
| Adult child managing parent | Appointments, medications, active conditions, recent labs, refill status | Mental health, sexual/reproductive health, substance use, psychiatric diagnoses |
| Spouse / partner | Appointments, medications, active conditions, lab results | Mental health, reproductive health, substance use |
| Professional caregiver | Medication administration schedule, allergies, contraindications, active monitoring alerts | Narrative clinical notes, history beyond task scope |
| Healthcare proxy | Everything (legal authority) | Nothing (but all access is audited) |

**The patient always overrides the defaults.** At delegation setup, the patient reviews the suggested access level for the relationship type and customizes it. This is especially important in emerging-market contexts where family structures may differ from the defaults. The defaults are a starting point; the patient's configuration is the truth.

**Delegate actions are scopable individually**: read records, request refills, attend consults, receive notifications, give consent on behalf of the patient (the riskiest — restricted to parent-of-minor, legal guardian with documentation, and healthcare proxy), make payments, participate in community on their own account (never on the patient's).

**A delegate cannot create another delegate.** Delegation chains stop at the first hop.

**Sensitive-category defaults are protected by the platform floor.** No guardrail or policy configuration may autonomously bypass these defaults without explicit patient confirmation (§13.4).

### Revocation

- **Forward-looking.** Revoking consent does not undo actions already taken; past actions remain in audit.
- **In-flight workflows** stop on revocation, with clinician-overrideable safety holds for cases where abrupt discontinuation is dangerous.
- **Derived data** (AI interpretations produced from consented data) is retained per jurisdictional rules; the model does not assume automatic deletion.
- **Granular.** A patient can revoke one consent type (e.g., data-use for analytics) without revoking others (e.g., care consent).
- **Both directions.** A patient can revoke a delegate. A delegate can also step down from their role.

### Audit commitment

> *Telecheck never takes a clinically meaningful action without a consent artifact that names what was consented to, by whom, when, with what scope, and with what evidence. Every action taken on behalf of someone else carries the chain of authorization back to its source. Every protocol-authorized action carries the protocol version and accountable role.*

Every consented action carries its consent evidence. Every delegate action is recorded as taken-by-delegate with the delegation evidence. Every revocation is timestamped. Every protocol execution is audited with protocol version and accountable human. Every patient can see a full history of what they consented to, what was done under that consent, and who acted on their behalf.

---

## 16. Trust and data principles

Trust is not a tone; it is a set of product commitments.

**Status is honest.** The platform never shows a patient a status that is aspirational, premature, or softened. "Your prescription is approved" means approved. "Delivery is on the way" means the order has left fulfillment. If the system does not know, it says so.

**Records are not silently altered.** A clinician's note, a prescription, an AI interpretation, a consent record, a protocol execution, or a moderation action is never changed without a visible edit history. Corrections produce a new version; they do not overwrite.

**Actions are traceable.** Every clinically, commercially, or socially meaningful action has an identifiable actor (patient, delegate, clinician, pharmacist, operator, AI-with-guardrail-version, protocol-with-version, moderator) and a retrievable audit artifact.

**Actions on behalf of others are explicit.** When a delegate acts, the target account's records show it was a delegate action, which delegate, and under what consent basis.

**Market availability is deterministic.** A feature is either available in a market or it is not. Partial, probabilistic, or "mostly works" availability is not a valid state. If a module or protocol cannot be safely used in a market, it is hidden there.

**Reversibility is preferred.** Where a mistake can be undone — an unsent message, an unrequested refill, a hidden community post — the platform supports undoing it. Irreversible actions are clearly signalled as such before they commit.

**Data retention is intentional.** What is retained, for how long, and under what jurisdiction is a design decision, not an emergent outcome. v4.2 enforces the runtime.

**Privacy-sensitive categories are handled explicitly.** Mental health, sexual health, reproductive health, and substance use are treated with category-specific access rules (§15), not rolled into a single "medical record" bucket.

**AI and protocol provenance are visible.** When AI generated or influenced a piece of content, the user sees it. When a protocol executed an action, the audit record shows the protocol. Provenance is not an engineering detail; it is part of the user contract.

---

## 17. Experience direction and accessibility

Product-level UX intent. Design system and Patient App IA specs live downstream.

### Experience principles

**Calm, not sterile.** Telecheck is a clinical platform, but the tone is warm and reassuring. Dense clinical data is surfaced when needed, hidden when not.

**Premium but trustworthy.** The visual language signals quality and care, not luxury marketing. Trust is carried by consistency, honesty in status, and clarity of action.

**Readable, not decorative.** Typography, color, and spacing serve comprehension first. A clinician under time pressure, a patient under stress, and a delegate managing someone else's care all need to understand what the screen is telling them in seconds.

**AI is visually distinct from clinician-authored and peer-authored content.** Every AI-generated piece of content carries a consistent visual signal so users always know what is AI, what is human-clinician, and what is peer/community content. This is a hard rule, not a style preference.

**Protocol-executed actions are visibly flagged.** When a refill was auto-approved under protocol, when a triage suggestion came from a protocol, when a dispense release went through a protocol pathway, the user and clinician see it. Protocolized autonomy is not invisible.

**Low-friction onboarding.** Patient onboarding is short, explains what is being collected and why, and never gates critical safety information behind an incomplete profile.

**Empty, loading, failure, and offline states are designed, not default.** Every screen has an intentional state for each. Failure is never a blank screen. This is a launch-readiness criterion (§12).

**Degraded connectivity is a first-class design target.** UI must work, and must be useful, on intermittent connectivity. Optimistic UI patterns are used with care, because premature "success" violates §16.

**Family context is always visible.** When a user is acting as a delegate, the delegate context is shown clearly on every surface they touch.

### Accessibility requirements

- Text contrast and sizing meet WCAG AA at minimum for all patient-facing, clinician-facing, and operator-facing surfaces.
- The platform supports assistive technologies (screen readers, keyboard navigation) for all core flows.
- Language support is planned per market, not assumed. Anchor launch (Ghana) supports English at minimum; subsequent markets assess needs individually.
- Literacy-aware writing: patient-facing copy is written at a level appropriate for the general population, with clinical terms explained where they appear.
- Color is never the sole carrier of meaning. Severity, status, AI/human/peer distinction, and protocol-executed flags use shape, text, and position as well.
- Community spaces meet the same accessibility standards as clinical surfaces.

---

## 18. Business and operating model

Revenue structure affects scope and prioritization. Stating it explicitly prevents invisible economics from driving product choices.

### Launch revenue engines

**Consultation fees (per-visit, patient-pay).** When a patient books a live consult — synchronous video or asynchronous review — the price is displayed upfront at scheduling. Payment is collected per visit. Applies to all jurisdictions at launch.

**Medication sales (per-prescription, patient-pay).** OTC and prescription medications are sold through the pharmacy workflow. Prices are displayed. Patient pays per order.

**Refills (medication-cost only).** Refills for established programs (GLP-1, men's health, ED, chronic medications) do not carry a separate consult fee. The patient pays for the medication; the platform's margin comes from the medication transaction. This is deliberate — frictionless refills drive adherence and volume. Where protocol-authorized refill is activated, this remains the commercial model.

**RPM / CCM subscription (patient-pay).** Monthly subscription for ongoing monitoring and chronic-care management. Enables chronic-disease revenue without requiring per-visit consults. Architecturally ready for claims-based reimbursement in US and similar markets post-launch.

### Acquisition engines (not primary revenue)

**Food and calorie scanning, fitness tracking, pregnancy tracking.** Low-friction tools that bring users onto the platform without requiring a clinical visit. They drive app downloads, account creation, and habitual engagement. Revenue from these modules at launch is not the point; their role is to feed the consultation, medication, and RPM/CCM engines.

**Community.** Community is an engagement and retention engine. It does not generate direct revenue at launch. Its value is in adherence, retention, word-of-mouth, and condition-specific partner programs that may generate revenue post-launch.

**AI Clinical Assistant.** Full chat is included in the patient experience at no additional per-message charge at launch. Its role is engagement, self-service deflection of low-complexity questions, and interpretive clarity — not per-interaction revenue.

### Deferred (post-launch)

- US market claims-based reimbursement for RPM/CCM
- DFPAS diagnostic interpretation services
- Institutional and enterprise partnerships (hospitals, insurers, employers)
- Community-partner monetization (condition-specific program sponsorship with appropriate disclosure)

### Commercial model principle

At launch, the customer is always the patient. In Ghana and other early emerging markets, direct patient-pay is the assumption. No institutional payer, employer, or government program is relied on for launch revenue. This keeps the unit economics simple and the launch evaluable on its own merits.

---

## 19. Success metrics

Metrics are organized by what the business actually needs to know.

**Patient activation and retention**
- Onboarding completion rate
- Intake completion rate (per program)
- 30/60/90-day retention by program
- Acquisition-tool-to-clinical-service conversion rate
- Delegate adoption rate and active delegate count per account
- Community participation rate among active patients

**Clinical throughput and safety**
- Time to clinician review (async)
- Time to clinician decision (sync)
- Prescription approval rate and override rate
- Safety-event handling latency (signal → clinician or protocol action)
- AI suggestion acceptance / override rate (quality signal in both directions)
- Protocol-authorized action rate vs clinician-reviewed action rate (by program)
- Protocol override rate (clinician overrides of protocol-authorized actions)

**Pharmacy and commerce**
- Refill completion rate (headline launch metric)
- Order turnaround time (approval → dispense → delivery)
- Refill adherence over rolling 90 days
- Fulfillment defect rate
- Revenue per active patient per month

**RPM / CCM**
- RPM subscription retention
- Adherence / monitoring completion
- Alert-to-action latency
- Escalation appropriateness (false-positive vs missed-signal balance)

**AI Clinical Assistant**
- Chat sessions per active patient
- Escalation-to-clinician rate from AI chat
- Guardrail refusal rate (within expected range)
- User-reported satisfaction / trust signals
- AI-identified safety escalations that proved warranted

**Community**
- Active community participants
- Moderation action rate (automatic and human)
- Crisis-signal escalation rate and time-to-response
- Policy-violation rate
- Community-to-clinical-service conversion (community engagement preceding clinical action)

**Operations and governance**
- Support burden per active patient
- Manual-intervention rate per workflow
- Audit-trail completeness (must be ~100%)
- Compliance-event closure time
- Active protocol count per market
- Protocol review cadence adherence (scheduled vs actual)
- Incident-triggered review count

**Headline launch metrics** (obsession list):
1. Refill completion rate
2. Time to clinician decision
3. Safety-event handling latency
4. Audit-trail completeness

---

## 20. Non-goals

Non-goals are expressed as **workflow exclusions, not capability exclusions**. Telecheck may build data, records, and audit trails that look EHR-ish or research-ish — but it does not build the institutional workflows associated with those systems.

**Telecheck is not a hospital or institutional EHR.** It does not build inpatient workflows, hospital operational systems, or departmental clinical systems. It does not attempt to be the system of record for care delivered outside Telecheck. It *does* maintain a longitudinal record of care delivered through Telecheck and accepts external records contributed by patient or partner institutions.

**Telecheck is not a clinical research platform.** It does not build trial management, randomization, eCRFs, IRB workflows, or sponsor reporting. It *does* produce consented, audited, longitudinal data that can feed research pipelines downstream.

**Telecheck is not a general clinician marketplace.** It does not operate open onboarding for arbitrary providers. It *does* onboard credentialed clinicians per market under controlled processes.

**Telecheck is not a direct-to-consumer pharmacy in unregulated markets.** Where regulation does not permit direct pharmacy operations, Telecheck works through partnerships, not unilateral launches.

**Telecheck is not an unbounded AI assistant.** Full AI chat exists at launch, but it operates under admin-configurable guardrails bounded by the platform floor (§13.4). There is no "anything goes" AI mode. Every deployment has an active guardrail configuration.

**Telecheck is not an open social network.** Community exists at launch as *moderated* groups, events, and peer support. It is not an unmoderated social graph. It is not a direct-messaging platform between arbitrary users. It is not advertising-driven. Community's purpose is health engagement, not social reach.

**Telecheck is not an insurance claims engine.** RPM/CCM awareness is not the same as building a claims clearinghouse. Claims processing is post-launch and works through integrations, not in-house claims infrastructure.

**Telecheck is not a consumer wellness app.** Wellness signals serve clinical care and acquisition; they are not the product in themselves.

**Telecheck is not a diagnostic device.** AI interpretations and protocol-authorized actions operate within defined clinical envelopes. Open-ended autonomous diagnosis is forbidden.

Anything in this list re-enters scope only through an explicit PRD update.

---

## 21. Dependencies and constraints

**Regulatory.** Each market has its own rules for telehealth, prescribing, pharmacy dispensing, data residency, AI in clinical decision support, protocolized autonomy, and community health content. Ghana anchor launch requires coordination with Ghana FDA, Medical and Dental Council, Pharmacy Council, and partner clinical institutions. v4.2 enforces the runtime.

**Partner pharmacy.** Launch depends on at least one partner pharmacy (or owned pharmacy operation) capable of integrating with the pharmacy portal, delivery workflows, and protocol-authorized release pathways.

**Clinician supply.** End-to-end care — especially synchronous video — requires a sustainable pool of credentialed clinicians per market. Onboarding velocity gates patient acquisition. Protocolized autonomy exists in part because clinician supply is a real constraint.

**Clinical governance capacity.** Protocolized autonomy requires named accountable clinical leadership per market, per protocol. Governance capacity is a launch constraint, not just a regulatory one.

**Data residency.** Cloud provider selection (AWS / Azure / GCP) and regional deployment are constrained by per-market residency requirements.

**Connectivity.** Anchor and regional markets include intermittent connectivity. Safety-critical workflows must degrade gracefully (§13, §17).

**Identity infrastructure.** Patient identity verification depends on per-market identity primitives (national ID, phone, etc.).

**Counterfeit-medication data.** Fake medication detection depends on supply-chain data and image-recognition reference sets sourced per market.

**Payment infrastructure.** Launch depends on reliable per-market payment rails (mobile money in Ghana, card processing elsewhere). Subscription billing for RPM/CCM requires recurring-payment support.

**Community moderation capacity.** Community at launch requires human moderators available in anchor-market languages and time zones, plus automated moderation tooling operating under configured policies.

**Protocol library at launch.** Launch requires a starter library of reviewed, approved, tested protocols for the anchor market covering refill renewals, low-risk prescribing pathways, emergency routing, and dispensing release. Protocol development is on the launch critical path.

---

## 22. Risks

| Risk | Mitigation |
|---|---|
| AI surfaces wrong clinical signal and a clinician acts on it | Three-framework autonomy model (§13); platform floor immutable; human-in-the-loop preserved outside protocols; audit captures rationale and override |
| Protocol-authorized prescribing executes an unsafe action | Whitelisted formularies and indications; exclusion criteria; interaction engine gate; named accountable clinician; 6-month review cadence for high-risk protocols; incident-triggered review; rollback capability |
| Full AI chat produces unsafe or out-of-scope content | Admin-configurable guardrails with test coverage; platform floor prohibits suicide-means, impersonation, consent bypass; audit and incident review; refusal-with-explanation mandatory |
| Community moderation fails to catch crisis or abuse | Crisis detection is platform-floor, not admin-configurable; human moderator capacity sized at launch; escalation pathway tested; incident-triggered review |
| Launch slips because delivery-layer foundations aren't ready | Launch-readiness criteria (§12) are product-committed; partial-v2 with gaps is explicitly rejected |
| Refill workflow fails at launch due to pharmacy integration friction | Refill is the proving slice for shared services; protocol-authorized pathway is optional, not required; clinician-review fallback is always available |
| Acquisition modules (food, fitness, pregnancy) create clinical expectations Telecheck cannot fulfill | Clear UX separation between acquisition tools and clinical advice; escalation paths from tools into clinical care are explicit |
| Regulatory delay in Ghana FDA / MDC / Pharmacy Council engagement on protocols | Protocol library is on critical path; engagement started pre-launch; fallback to clinician-review-only workflows if specific protocols delayed |
| Scope expands toward "general telehealth + social platform" | Non-goals (§20) and PRD discipline on every new request |
| Delegation defaults don't match emerging-market family structures | Patient-customizable defaults (§15); suggested defaults are a starting point, not a constraint |
| RPM/CCM subscription churn in emerging markets | Monitor retention as a headline metric; adjust value proposition and pricing per market |
| Counterfeit-detection false positives damage pharmacy partner trust | Launch as advisory; clinician/pharmacist review required before patient impact |
| Clinician adoption stalls because workflow feels slower than current tools | UX explicitly measured on time-to-decision; AI must visibly save clinician time; protocol-authorized pathways reduce clinician load for low-risk actions |
| Consent ambiguity between patient and delegate creates privacy incidents | Every delegate action logged with consent basis; patient sees delegate activity; revocation is immediate; sensitive-category defaults protected by platform floor |
| Guardrail or protocol configuration drifts without review | Risk-tiered sunset cadence (§13.5); incident-triggered review; audit of configuration changes; rollback is one action |

---

## 23. Pre-launch decision requirements

These four decisions must be resolved before launch approval. They are not backlog items. Each is named, owned, and has a defined-done state. Unlike ordinary open questions (§24), items here block launch if unresolved.

1. **Launch protocol library scope.** Which specific protocols — by medication class, indication, program, and pathway — are activated for Ghana launch? Refill renewals for which chronic medication classes specifically? Which dispensing-release pathways, if any, activate on day one versus post-approval (§11.3)?
   - **Owner:** Clinical lead, Ghana anchor launch
   - **Defined done:** Approved protocol list signed off by Ghana MDC and Pharmacy Council partners; each protocol has a documented version, eligibility criteria, exclusion rules, accountable clinician, review cadence per §13.5, and test coverage.

2. **AI guardrail template count and coverage at launch.** How many templates ship at launch, and what use cases do they cover? The conservative default is required on day one (§11.3); what other templates exist and are available for admin selection?
   - **Owner:** AI product lead, with clinical and safety review
   - **Defined done:** Template list approved; each template has a documented scope, test suite with passing results, refusal taxonomy, and escalation behavior. Conservative default is identified and flagged as the launch-active template for Ghana.

3. **Community moderation capacity sizing.** What human moderator-to-active-member ratio does launch require, per language and time zone? What is the escalation pathway when moderator capacity is exceeded?
   - **Owner:** Community operations lead
   - **Defined done:** Staffing plan approved covering 24-hour coverage for Ghana anchor launch; automated moderation policies configured and tested; escalation pathway to safety team documented and tested.

4. **Adverse-event reporting destination at launch.** Internal only, or Ghana FDA pipeline from day one? What is the reporting cadence, format, and audit requirement?
   - **Owner:** Regulatory lead, Ghana
   - **Defined done:** Reporting destination confirmed with Ghana FDA; data format and cadence agreed; internal reporting workflow built and tested; audit trail meets regulatory expectations.

If any of these four is unresolved at the launch-approval gate, launch is not approved. These are not soft targets.

---

## 24. Open questions

Tracked and closed via ADR or PRD update. Unlike pre-launch decision requirements (§23), these do not block launch.

1. **Identity primitive for Ghana anchor launch.** Which combination of national ID, phone verification, and clinician-attested identity is sufficient?
2. **Pharmacy partner model.** Owned, partnered, or hybrid at launch?
3. **Clinician compensation model.** Per-consult, salaried, or hybrid?
4. **Adult-child-managing-parent sensitive-category default.** Patient-customizable defaults are committed; the *starting-point* default for sensitive categories remains under review per market norms.
5. **Clinician-gated exceptions to delegate visibility.** When can a clinician mark a note as not-for-this-delegate? What is the override mechanism if the patient disagrees?
6. **Consent for AI use of externally contributed data.** Labs uploaded by a hospital, prescription history pulled from external pharmacy — does platform consent cover AI interpretation, or is a separate consent required?
7. **Minor age thresholds by care type.** At what age does a minor consent to their own care vs requiring parental consent, especially for mental health and reproductive care? Varies by jurisdiction.
8. **Cross-border delegation.** A delegate in one country managing care for a patient in another — whose consent regime governs?
9. **Incapacity and emergency override for delegation.** When a patient is incapacitated, what powers does a previously-authorized delegate gain, and what evidence is required?
10. **RPM/CCM pricing model per market.** Flat monthly subscription, tiered by program, or condition-specific?
11. **Subscription billing infrastructure.** Build or buy at launch?
12. **Post-launch DFPAS timing.** Roadmap placement — early, mid, or late post-launch?
13. **Community monetization path.** Condition-specific sponsorship, partner programs, or neither — and what disclosure standard applies?

---

## 25. Feature PRD index

Downstream slice PRDs. Each traces to a job in §8 and a launch-scope item in §11.1 (or §11.2 for post-launch items).

| # | Feature PRD | Launch or Post-launch | Primary jobs served |
|---|---|---|---|
| 1 | Refill (proving slice) | Launch | Refill safely; pharmacy fulfillment; AI/clinician oversight; protocol-authorized renewal pathway |
| 2 | **Medication Interaction & Validation Engine** (shared service) | Launch | Drug–drug, drug–condition, drug–lab, genotype, special-flag checks for every prescribing/refill decision and protocol execution |
| 3 | Consent & Delegated Access (platform primitive) | Launch | Act on behalf of someone else; all consent flows |
| 4 | Forms / Intake Engine | Launch | Enroll a patient; consult; intake for any program |
| 5 | Async Consult | Launch | Consult a clinician |
| 6 | **Synchronous Video Consult** | Launch | Consult a clinician; full video flow end to end |
| 7 | Labs and Document Interpretation | Launch | Upload and interpret a document or lab |
| 8 | Pharmacy Portal | Launch | Manage pharmacy fulfillment; protocol-authorized release |
| 9 | Adverse Event Reporting | Launch | Handle alerts and follow-up |
| 10 | **RPM / CCM** | Launch | Monitor chronic conditions; monthly subscription revenue |
| 11 | **AI Clinical Assistant** | Launch | Converse with AI; global launcher, embedded cards, full workspace |
| 12 | **Community Platform** | Launch | Participate in patient community |
| 13 | Herb–Drug Interaction Engine | Launch | Review and oversee AI suggestions; extends interaction-engine signal model |
| 14 | Fake Medication Detection | Launch | Pharmacy fulfillment safety |
| 15 | Food & Calorie Scanning | Launch | Engage independently of clinical visits; acquisition |
| 16 | Fitness & Behavior Tracking | Launch | Engage independently of clinical visits; acquisition |
| 17 | Pregnancy Tracking | Launch | Engage independently of clinical visits; acquisition |
| 18 | **Admin — Guardrail Configuration** | Launch | Configure AI behavior per market and program |
| 19 | **Admin — Moderation Policy Configuration** | Launch | Configure community moderation per market |
| 20 | **Admin — Protocol Activation & Governance** | Launch | Activate, version, review, and roll back protocols |
| 21 | AI Second Opinion | Post-launch | Review and oversee AI suggestions |
| 22 | Pharmacogenomics (real PGx pipelines) | Post-launch | Extends interaction engine |
| 23 | DFPAS Integration | Post-launch | Handle alerts and follow-up; diagnostic interpretation revenue |
| 24 | US RPM/CCM with Claims Reimbursement | Post-launch | Chronic care in claims-reimbursement markets |
| 25 | Pediatric / Pregnancy / Lactation Protocolized Pathways | Post-launch | Expanded protocolized autonomy under dedicated governance |
| 26 | Enterprise / Institutional Partnership Tooling | Post-launch | Institutional partner workflows |

---

## Document control

- **v1.0** — Initial master PRD synthesized from platform brief and PRD-placement guidance.
- **v1.1** — Promoted Medication Interaction & Validation Engine to a fully described shared clinical-safety service with the five check classes broken out.
- **v1.2** — Surgical expansion adding Executive Summary, Product Thesis, AI Role and Limits with four-category model, Clinical Safety Boundaries, Consent and Delegated Access Model, Trust and Data Principles, Experience Direction and Accessibility, and Business and Operating Model. Revised Non-Goals to workflow-exclusion framing. Moved RPM/CCM, food scanning, fitness, and pregnancy to v1.
- **v1.3** — Major revision. Shifted to v2-direct launch (no v1/v1.5 phasing); split scope into launch scope (§11.1) and post-launch roadmap (§11.2). Added Community as a sixth pillar and first-class launch capability. Added full AI Clinical Assistant (chat) as a launch capability. Pulled synchronous video consult into launch. Replaced the four-category AI model with the three-framework autonomy model (protocolized clinical, guardrail-configured conversational, protocol-authorized moderation), all bound by an immutable platform floor (§13). Added admin configuration surfaces for guardrails, moderation policies, and protocols as a first-class product area (§14). Added launch-readiness criteria (§12) committing to inbox, sync video, family switcher, program dashboards, medication detail, lab upload confirmation, empty/offline states, and other patient-facing foundations. Added risk-tiered sunset cadence for protocols and policies (6/12 months, incident-triggered). Added pediatric/pregnancy/lactation human-review requirement at launch; protocolized pathways for these populations are explicitly post-launch. Added Community member to user groups. Added two new jobs-to-be-done (AI chat, community participation, admin configuration). Updated metrics, risks, and open questions to reflect the new scope. Note: Patient App IA is a downstream document and is not introduced in this PRD.
- **v1.4** — Surgical refinement pass. Fixed cross-reference in §10 Pillar 5 (roadmap is §11.2, not §12). Defined "market-launch policy" inline at first use in §13.1. Added §11.3 Launch activation sequencing distinguishing day-one-operational from built-and-testable-at-launch-but-activated-after-market-approval. Promoted four blocker-level open questions (launch protocol library scope, AI guardrail templates, community moderation capacity, adverse-event reporting destination) into new §23 Pre-launch decision requirements, each with named owner and defined-done state; remaining items stay as §24 Open questions; Feature PRD index renumbered to §25. Tightened §13.3 moderation: serious moderation actions (account suspension, irreversible enforcement, emergency escalations) require human review at launch; admin-configurable relaxation is explicitly post-launch (§11.2). Pulled advisory caveats for fake medication detection and launch-time PGx into main Pillar 5 feature text so the launch posture is visible where the capability is named, not only in risks. Rephrased user groups as "six direct user groups plus one external stakeholder group." Flipped §13.1 subsection openings to lead with supported capability and state the floor second.
- **Next review:** after v4.2 contracts pack is updated to absorb the three-framework autonomy model and admin-configurable governance, and after Refill, Medication Interaction Engine, and Consent slice PRDs are drafted.
- **Change discipline:** every change to launch scope (§11.1), launch activation sequencing (§11.3), non-goals (§20), principles (§9), autonomy frameworks (§13), platform floor (§13.4), pre-launch decisions (§23), or consent model (§15) requires explicit owner sign-off and a version bump.
