# Telecheck — Flagged Items Resolution + Recommended Execution Order

**Version:** 1.0
**Date:** April 2026
**Status:** Historical support artifact — resolutions absorbed into Master PRD v1.6 unless explicitly retained here
**Scope:** Resolves all open items from the Red-Team Review and the Operational Review feedback cycle

---

## How to read this document

This document resolves every flagged item across the review cycle. Each resolution is written as a **lockable decision** — a concrete position that can be adopted into the Master PRD, a slice PRD, or a pre-launch decision without further ambiguity.

The document closes with the execution order that was recommended at the time. Later canonical artifacts may supersede those sequencing notes.

---

## Resolution 1 — Async AI + physician oversight model: reconciliation with autonomy frameworks

### The problem

The operational review introduces an async care model where "AI clinical agents run the structured async pathway" for GLP-1 and ED programs, and "physician can auto-approve off the AI summary or force manual review." This is doing more than the AI Clinical Assistant as currently defined in the Master PRD. The Master PRD frames the AI Clinical Assistant (§13.2) as a conversational tool that helps patients, explains, summarizes, and escalates. It explicitly says the AI "does not approve refills" (Refill Slice §3).

The async care model has the AI completing a structured clinical review and presenting it for physician sign-off. That is closer to protocol-authorized prescribing (§13.1) than conversational assistance (§13.2). The distinction matters because the two frameworks have different audit requirements, governance models, and guardrail structures.

### Resolution

The AI in Telecheck operates in **two distinct modes**, and the AI Clinical Assistant slice PRD must define both explicitly.

**Mode 1 — Conversational Assistant (§13.2 governed)**

This is the patient-facing chat. It explains, summarizes, interprets, helps initiate workflows, and escalates. It operates under guardrail-configured conversational autonomy. It does not make clinical decisions, approve prescriptions, or execute protocol actions. It is the mode described in the current Master PRD.

Guardrail templates govern what it can discuss, how it frames uncertainty, and when it refuses or escalates. The four launch templates (Conservative Default, GLP-1 Program Agent, Men's Health/ED Program Agent, Labs & Medication Interpreter) apply to this mode.

**Mode 2 — Protocol Execution Agent (§13.1 governed)**

This is the async clinical review engine. It operates as an automated protocol executor, not as a conversational agent. It consumes structured intake data, runs eligibility checks, calls the Medication Interaction & Validation Engine, evaluates protocol criteria, and produces a structured clinical summary with a recommendation.

This mode is governed by §13.1 (protocolized clinical autonomy), not §13.2. That means it requires all the same safeguards as any protocol-authorized action: whitelisted formulary, whitelisted indications, identity verification, interaction engine gate, exclusion criteria, named accountable clinician, full audit trail with protocol version and engine version.

The physician receives the AI-prepared summary and takes one of three actions:

- **Approve** — the AI's protocol evaluation was clean; the physician signs off. Audited as clinician-approved with AI-prepared summary.
- **Approve with modification** — the physician adjusts the recommendation. Audited as clinician-modified.
- **Decline / escalate** — the case requires manual review, additional data, or is outside the protocol envelope. Audited as clinician-declined-protocol-recommendation.

The physician's action is always the authorizing event. The AI does not auto-approve. Even in cases where the protocol evaluation is clean, the physician must act — but the action can be a fast single-click approval when the AI summary is unambiguous and no signals are flagged.

**Auto-approve is a future capability, not a launch capability.** At launch, every async AI-prepared case requires physician action. Auto-approve (where the protocol executes without per-instance physician review) is a protocol-authorized prescribing pathway that activates only after governance review of the AI's accuracy and safety record in the specific program, per §13.5.

### What this means for the slice PRDs

The AI Clinical Assistant slice PRD must define both modes with separate sections for scope, guardrails, audit, and governance. The two modes share the same underlying AI infrastructure but operate under different autonomy frameworks, different audit models, and different admin configuration surfaces.

The guardrail templates (§13.2) apply to Mode 1.
The protocol activation and governance tooling (§13.1, §13.5) applies to Mode 2.

### Lockable position

The AI operates in two modes: conversational assistant under §13.2, and protocol execution agent under §13.1. At launch, Mode 2 requires physician action on every case. Auto-approve is a post-launch protocol activation. The AI Clinical Assistant slice PRD defines both modes.

---

## Resolution 2 — Platform pharmacy exclusive control: legal and regulatory framing

### The problem

The hybrid pharmacy model (platform pharmacy + partner pharmacies) includes the position that the "platform retains exclusive control over selected drugs/programs." This vertical integration — where Telecheck both prescribes (or facilitates prescribing) and dispenses — will draw regulatory scrutiny, particularly from Ghana's Pharmacy Council.

### Resolution

The platform pharmacy operates under the same regulatory framework as any licensed pharmacy in the market. It does not claim special regulatory status by virtue of being owned by the platform. The distinction between platform pharmacy and partner pharmacy is operational and commercial, not regulatory.

**Operational distinction:** The platform pharmacy handles selected programs (GLP-1, men's health/ED, and other managed programs) where end-to-end control over the supply chain, inventory, labeling, and fulfillment quality is commercially and clinically important. Partner pharmacies handle broader chronic-care refills and general prescriptions where local distribution matters.

**Regulatory posture:** Both platform pharmacy and partner pharmacies must hold valid licenses in the operating market. Both must comply with the same dispensing regulations, pharmacist oversight requirements, and Pharmacy Council rules. The Pharmacy Portal slice PRD must define the same workflow requirements for both — including pharmacist clinical release review, protocol-authorized dispensing release (when activated), and interaction engine signal visibility — regardless of whether the fulfilling pharmacy is platform-owned or partner-operated.

**What "exclusive control" means:** The platform may choose to route certain programs exclusively through its own pharmacy for commercial reasons (margin protection, quality control, supply chain reliability). This is a business routing decision, not a regulatory privilege. The patient may not see the distinction, but the regulatory posture documentation must make clear that both pharmacy types operate under identical governance.

**What to include in the Pharmacy Portal slice PRD:**

- A section defining the platform pharmacy vs partner pharmacy distinction as operational, not regulatory.
- Identical workflow requirements for both pharmacy types.
- A regulatory posture statement per market, confirmed with local pharmacy regulatory body.
- Audit requirements that apply equally to both pharmacy types.

### Lockable position

The platform pharmacy operates under the same regulatory framework as partner pharmacies. "Exclusive control" is a commercial routing decision, not a regulatory privilege. The Pharmacy Portal slice PRD defines identical workflow and audit requirements for both pharmacy types.

---

## Resolution 3 — Clinician coverage model: from headcount to operating capacity

### The problem

The operational review sets a minimum of 5 clinicians for Ghana launch. The red-team review flagged that headcount alone doesn't define operating capacity. Five clinicians with configurable availability could mean anything from one clinician online during business hours to three clinicians covering 18 hours a day.

### Resolution

Define the clinician coverage model in terms of **minimum clinician-hours per day** and **role coverage**, not just headcount.

**Launch coverage model for Ghana:**

| Coverage requirement | Minimum | Notes |
|---|---|---|
| Async review coverage | 12 clinician-hours/day | Covers refill reviews, async consult reviews, protocol fallback cases |
| Sync video availability | 8 clinician-hours/day | Bookable slots during Ghana business hours + 2 hours evening |
| Escalation / on-call | 24/7 reachable | At least 1 clinician reachable for escalation at all times (on-call, not necessarily active) |
| Protocol accountability | Named per protocol | At least 1 clinician named as accountable for each active protocol |

**What this means for a 5-clinician panel:**

- 3 clinicians cover daytime (9am–5pm): 24 clinician-hours across async, sync, and protocol duties.
- 1 clinician covers evening (5pm–9pm): 4 clinician-hours, primarily async review and escalation.
- 1 clinician on rotating on-call (9pm–9am): reachable for escalation; not expected to actively review queues overnight unless volume warrants it.
- Weekend coverage: reduced to 2 clinicians on rotation, covering async review and escalation.

**Scaling trigger:** When average time-to-clinician-decision (the #2 headline launch metric) exceeds a defined threshold — recommend 4 hours for async reviews and 24 hours for non-urgent refill reviews — the panel must expand. This threshold should be monitored from day one and reported in the operations dashboard.

**What to add to the Master PRD:**

Add a new pre-launch decision (§23 Q5) or resolve it here:

> **Clinician coverage model for Ghana launch.** Minimum 5 clinicians providing 12 async clinician-hours/day, 8 sync clinician-hours/day, and 24/7 on-call escalation coverage. Panel expansion triggered when time-to-clinician-decision exceeds [threshold]. Named protocol accountability assigned per active protocol.

### Lockable position

Clinician coverage is defined as minimum clinician-hours per day and role coverage, not headcount alone. 5 clinicians is the minimum panel; the coverage model above defines how those 5 are deployed. Scaling triggers are tied to the time-to-clinician-decision metric.

---

## Resolution 4 — WhatsApp Business API as a launch dependency

### The problem

The notification channel list (WhatsApp, SMS, in-app) is correct for Ghana, but WhatsApp Business API has its own onboarding, approval, template-message requirements, and rate limits. If WhatsApp is the primary engagement channel, this integration is on the launch critical path but wasn't named as such.

### Resolution

**WhatsApp Business API integration is a Wave 1 launch dependency.** It must be added to the execution order alongside the notification/communication layer, not treated as an implementation detail within it.

**Specific dependencies to resolve:**

- **Business verification:** Meta's business verification process for WhatsApp Business API access. This can take 2–4 weeks and requires business documentation.
- **Template message approval:** WhatsApp requires pre-approved message templates for business-initiated messages (refill reminders, delivery status, appointment reminders, escalation alerts). Template approval takes 1–3 business days per template but requires iteration.
- **Rate limits:** New WhatsApp Business API accounts start with limited messaging tiers. Tier upgrades are based on message quality and volume. Launch volume projections must account for initial tier limits.
- **Phone number provisioning:** A dedicated phone number for the Telecheck WhatsApp business account.
- **Webhook infrastructure:** Real-time message delivery and read receipts require webhook endpoints.

**Launch notification architecture:**

| Notification type | Primary channel | Fallback channel | Priority |
|---|---|---|---|
| Emergency escalation | In-app + SMS | WhatsApp | Critical — immediate |
| Refill approved / declined | In-app + WhatsApp | SMS | High — within minutes |
| Delivery status update | In-app + WhatsApp | SMS | High — real-time |
| Appointment reminder | WhatsApp | SMS | Standard — 24h and 1h before |
| Refill reminder (due soon) | WhatsApp | In-app | Standard — scheduled |
| Lab results available | In-app + WhatsApp | SMS | High — within minutes |
| Community activity | In-app only | None | Low — batched |
| Program nudges / engagement | WhatsApp | In-app | Low — scheduled |

**Quiet hours:** No non-critical notifications between 10pm and 7am local time. Emergency escalation and critical delivery alerts override quiet hours.

**Fallback logic:** If primary channel delivery fails (WhatsApp message undelivered after 5 minutes), automatically attempt fallback channel. If all channels fail, queue for retry and flag in operations dashboard.

**Patient preferences:** Patients can configure channel preferences per notification type. Default is the table above. Patients can opt out of engagement/reminder notifications per channel but cannot opt out of safety-critical notifications (emergency escalation, critical interaction signals).

### Lockable position

WhatsApp Business API is a Wave 1 launch dependency. The notification architecture defines channel priority, fallback logic, quiet hours, and patient preferences. Business verification and template approval must begin immediately.

---

## Resolution 5 — Role-to-accountability mapping for launch

### The problem

The operational review lists 12 recommended roles but doesn't map them to pre-launch decisions, execution waves, or specific blockers. Without that mapping, the roles are an org chart without teeth.

### Resolution

Each role is mapped to the specific blockers, pre-launch decisions, and execution wave items it owns.

| Role | Owns (blockers / pre-launch decisions) | Execution wave |
|---|---|---|
| **Country Launch Director — Ghana** | Overall launch gate; final sign-off on all pre-launch decisions; owns the rollout cockpit country workspace | All waves |
| **Clinical Governance Lead** | Protocol library scope (§23 Q1); clinician coverage model; protocol review cadence; clinician compensation model (§24 Q3); refill pre-authorization window policy | Wave 1 |
| **Async & Refill Review Lead** | Refill review SLA; async consult review SLA; protocol fallback triage; AI Mode 2 physician workflow design | Wave 1 |
| **Synchronous Care Lead** | Sync video infrastructure; clinician scheduling; pre-call readiness flow; post-visit summary workflow | Wave 1 |
| **Pharmacy Operations Lead** | Platform pharmacy licensing; partner pharmacy integration; dispensing release protocol readiness; delivery partner selection; inventory management | Wave 1 + Wave 2 |
| **Delivery & Fulfillment Lead** | Delivery partner integration; status reconciliation; failure handling; last-mile SLA for Ghana | Wave 2 |
| **AI Safety & Guardrails Lead** | Guardrail template content (§23 Q2); AI Mode 1 and Mode 2 boundary definition; guardrail test suites; AI Clinical Assistant slice PRD | Wave 1 |
| **Community Safety & Moderation Lead** | Moderation staffing (§23 Q3); crisis escalation SLA; launch group curation; moderation policy configuration; moderator training | Wave 1 |
| **Payments & Billing Operations Lead** | Payment rail integration (mobile money); subscription billing infrastructure (§24 Q11); refund workflow; pricing display accuracy | Wave 1 |
| **Support & Incident Response Lead** | Incident response playbook; adverse-event reporting destination (§23 Q4); rollback procedures; patient support SLA | Wave 2 |
| **Market Control Plane Lead** | Rollout cockpit slice PRD; dependency checker logic; evidence locker structure; readiness checklist definition | Wave 2 |
| **Regulatory & Partner Affairs Lead** | Ghana FDA engagement; MDC coordination; Pharmacy Council sign-off; regulatory evidence collection; adverse-event reporting format | Wave 1 |

**Accountability rule:** Every pre-launch decision (§23) and every promoted open question must have exactly one owner from this table. If a decision requires input from multiple roles, one role is the decider and the others are consulted.

### Lockable position

The 12 roles above are the named operating seats for Ghana launch. Each is mapped to specific blockers and execution wave items. Every pre-launch decision has one accountable owner.

---

## Resolution 6 — Consent onboarding friction: six types in one session

### The problem

The consent model defines six distinct consent types (§15). A patient enrolling in a chronic-care program with a delegate may need to navigate platform consent, care consent, data-use consent, delegation consent, and possibly jurisdictional consent in a single onboarding session, on a mobile device, in a market where digital health may be new to them. The PRD's "low-friction onboarding" principle is in tension with consent granularity.

### Resolution

Consent is real and granular in the system. Consent is presented progressively to the patient, not all at once.

**Progressive consent model:**

| When | What is presented | Why now |
|---|---|---|
| Account creation | Platform consent | Required to use Telecheck at all. Single clear screen. |
| First program enrollment | Care consent (for this program) + data-use consent (for AI interpretation) | Required before any clinical interaction. Bundled into the program enrollment flow as two clearly separated sections on the same screen. |
| First clinical episode | Episode consent (if applicable) | Only if the episode is outside the ongoing care relationship (e.g., one-off second opinion). Otherwise, care consent covers it. |
| Adding a delegate | Delegation consent | Presented when the patient initiates delegation setup, not at onboarding. |
| Market-specific trigger | Jurisdictional consent | Presented when a market-specific regulatory requirement is triggered (e.g., Ghana FDA reporting consent). Timed to the relevant action, not front-loaded. |

**Design principles for consent screens:**

- Each consent screen explains what is being consented to, in plain language, at the literacy level appropriate for the market.
- Each consent screen explains what happens if the patient declines (they can still use the platform but not this feature/program).
- Consent is never a single "agree to everything" checkbox. But it is also never a 6-page form presented at once.
- The total onboarding flow from account creation to first program enrollment should target under 5 minutes on a mobile device, including consent.
- Consent decisions are individually revocable from the patient's settings at any time.

**What the Forms/Intake Engine slice PRD must define:**

- The progressive consent flow for each program type (GLP-1, ED, chronic care, RPM).
- The specific consent screens and copy for Ghana launch.
- The decline paths (what happens if a patient consents to the platform but declines care consent for a specific program).
- The delegation consent flow as a separate, later interaction.
- Accessibility and literacy-level requirements for consent copy.

**What the system tracks regardless of presentation:**

All six consent types are maintained as distinct records in the system, with full scope, granularity, duration, evidence, and versioning per §15. The progressive presentation model changes when the patient encounters each consent type, not whether the system distinguishes them.

### Lockable position

Consent is progressive: platform consent at account creation, care + data-use consent at program enrollment, delegation consent at delegate setup, jurisdictional consent at market-specific triggers. The Forms/Intake Engine slice defines the flows. The system maintains all six types as distinct records regardless of presentation timing.

---

## Resolution 7 — Clinician compensation for refill reviews

### The problem

The business model says refills carry no consult fee (§18). But the clinician-review pathway requires clinician time on every refill until protocol-authorized pathways activate. If clinicians are compensated per-consult, refill reviews become uncompensated labor, creating pressure to either rush reviews or activate protocol-authorized pathways before governance warrants.

### Resolution

Refill reviews are a **compensated work unit**, distinct from consults and paid by the platform.

**Compensation model:**

- **Refill review** is a defined work unit with a fixed per-review fee, lower than a full consult fee but explicitly compensated.
- The platform absorbs this cost as an operating expense within medication margin, not as a patient-facing charge. The patient continues to see medication-cost-only pricing.
- The per-review fee is set per market and per program. It may differ for a simple chronic medication renewal (fast review, low-risk) versus a GLP-1 renewal (requires more clinical attention).
- The fee structure is reviewed when protocol-authorized refill pathways activate, because activation reduces clinician review volume and shifts the remaining reviews toward more complex cases (protocol fallbacks), which may warrant a higher per-review fee.

**What this means for the business model:**

Medication margin must cover both the pharmacy fulfillment cost and the clinician review cost. If medication margin is insufficient to cover both, either medication pricing must adjust or protocol-authorized pathway activation must be prioritized to reduce clinician review volume. This is a known commercial tension, not a hidden one.

**What to add to the Master PRD:**

Update §18 to include: "Refill reviews are compensated as a distinct work unit, absorbed within medication economics. The patient does not see a consult fee. Clinician compensation for refill review is set per market and program and reviewed when protocol-authorized refill pathways activate."

### Lockable position

Refill reviews are compensated work units. The platform pays the clinician; the patient pays medication-cost only. Compensation is set per market/program and reviewed when protocol-authorized pathways activate.

---

## Resolution 8 — Launch scope volume risk and critical-path subset

### The problem

The v2-direct launch commits to shipping everything in §11.1 simultaneously. The red-team flagged that a single lagging module delays everything, and the PRD's risk table doesn't acknowledge this scope-volume risk.

### Resolution

Add a risk entry to §22 and define a **critical-path subset** within §11.1 for contingency planning.

**Risk entry to add:**

| Risk | Mitigation |
|---|---|
| Launch scope volume delays the entire release because a non-critical module lags | Critical-path subset defined below; non-critical modules that miss the launch window may follow within 30 days under a "launch + fast-follow" model without violating the v2-direct commitment, provided the launch-readiness criteria (§12) are met for all critical-path items |

**Critical-path subset** (absence of any of these means the platform cannot serve a patient safely):

- Patient identity, consent, and onboarding
- Refill workflow with clinician review
- Async clinician review
- Prescription approval and audit
- Pharmacy portal with dispense + delivery handoff
- Messaging / inbox
- Medication Interaction & Validation Engine
- AI Clinical Assistant (Mode 1 — Conservative Default template)
- Emergency escalation and routing
- Audit, consent, and jurisdiction enforcement
- Payment infrastructure
- Notification infrastructure (WhatsApp + SMS + in-app)
- Admin operations console

**Important but 30-day-tolerant** (valuable at launch but their brief absence doesn't break the patient trust contract):

- Synchronous video consult (can launch 2–4 weeks after async if clinician supply or video infrastructure lags)
- RPM/CCM (can launch with first activated program shortly after, rather than blocking everything)
- Community (can launch with curated groups shortly after core care flows are live)
- Food scanning, fitness tracking, pregnancy tracking (acquisition tools; absence doesn't affect care)
- Herb–drug interaction engine (advisory; absence doesn't block refill or prescribing safety, since the medication interaction engine covers drug–drug safety)
- Fake medication detection (advisory at launch anyway)
- Delegated access (important but can follow core patient flows by days/weeks)

**What "launch + fast-follow" means:**

The v2-direct commitment is not violated by a short sequencing gap, as long as the critical-path subset is fully operational and the fast-follow items ship within 30 days. The critical-path subset is the actual launch gate. The full §11.1 scope is the launch commitment, delivered within a 30-day launch window rather than a single-hour activation.

This is different from the phasing the PRD rejects (v1/v1.5). There is no reduced product version. There is a launch window within which the full product becomes available, with the most critical capabilities going live first.

### Lockable position

Add the risk entry. Define the critical-path subset as the launch gate. Allow a 30-day launch window for the full §11.1 scope, with fast-follow items shipping within that window. This preserves the v2-direct commitment while adding a defensible contingency.

---

## Resolution 9 — Patient-facing distinction for protocol-approved vs clinician-approved refills

### The problem

The refill slice doesn't specify what the patient sees when their refill was approved by the protocol engine versus by a clinician. The Master PRD (§17) says protocol-executed actions must be visibly flagged, but the refill slice doesn't define the patient-facing language.

### Resolution

The patient sees a clear, calm distinction:

**Clinician-approved refill:**
> "Your refill has been reviewed and approved by Dr. [Name]."

**Protocol-approved refill:**
> "Your refill has been approved under your [Program Name] care program. Your care team oversees this process."

**Protocol-approved with fallback (protocol declined, clinician reviewed):**
> "Your refill has been reviewed and approved by Dr. [Name]."
(The patient does not need to know the protocol declined first. The clinician review is what matters to them.)

**Protocol-approved refill, declined:**
> "Your refill could not be approved automatically. It has been sent to your doctor for review."
(This is the fallback-to-clinician notification. The patient knows the process is continuing, not stalled.)

**Design requirements:**

- The distinction is visible on the refill status screen and in the refill history.
- The distinction uses text and a subtle visual indicator (icon or label), never color alone.
- The language is warm and reassuring, not bureaucratic. "Approved under your care program" is better than "protocol-authorized renewal executed."
- The patient can tap to learn more about what "approved under your care program" means. The explanation should be 2–3 sentences: "For medications you take regularly as part of your [Program Name] program, Telecheck can approve refills automatically when all safety checks pass. Your care team sets up and oversees this process."

### Lockable position

Add the patient-facing language above to the Refill Slice PRD §5.2 and §10 (states and transitions). Protocol-approved refills are labeled "approved under your care program" with a tap-to-learn-more explanation.

---

## Resolution 10 — Degraded connectivity and offline model

### The problem

The Master PRD says degraded connectivity is a first-class design target (§17) but no document defines what works offline, what queues, and what doesn't.

### Resolution

Adopt the degraded-connectivity model from the operational review with the following specification.

**Must work in degraded or offline mode:**

| Capability | Offline behavior |
|---|---|
| Emergency information + local contacts | Cached on device; always available |
| Active medication list | Last-synced version displayed with "last updated [timestamp]" |
| Upcoming appointments | Last-synced version displayed |
| Active care program tasks/milestones | Last-synced version displayed |
| Previously viewed lab summaries | Cached; available read-only |
| Refill request drafting | Drafts saved locally; queued for submission when connectivity returns |
| Message drafting | Drafts saved locally; queued for sending when connectivity returns |
| Consent and delegation status | Last-synced version; no changes allowed offline |

**Does not work offline — requires connectivity:**

| Capability | Reason |
|---|---|
| Live video consult | Real-time streaming |
| Full AI Clinical Assistant conversation | Requires API round-trip |
| New protocol-authorized approvals | Requires real-time interaction engine and protocol evaluation |
| Lab upload / OCR extraction | Requires server-side processing |
| Payment processing | Requires payment rail connectivity |
| Refill status updates (real-time) | Requires server sync |
| Community participation | Requires real-time content delivery and moderation |

**Queued submission behavior:**

- When a patient drafts a refill request or message offline, it is saved locally with a visible "pending — will send when connected" indicator.
- When connectivity returns, queued items are submitted automatically.
- If the queued submission fails (e.g., eligibility has changed since drafting), the patient is notified with the failure reason.
- Queued submissions are timestamped at draft time and at submission time. The system uses submission time for processing but preserves draft time in audit.

**Degraded-mode visual indicators:**

- A persistent, non-dismissible banner shows when the app is operating in degraded mode: "Limited connectivity — some features may be unavailable."
- Screens showing cached data display "Last updated [timestamp]" next to the data.
- Features that require connectivity show a clear disabled state with explanation, not a blank screen or spinner.

**Where this lives:**

Add as a new subsection in the Master PRD §17 (Experience direction and accessibility), titled "Degraded connectivity and offline behavior." Reference from the Refill Slice PRD (§9 error handling) and the AI Clinical Assistant slice PRD.

### Lockable position

The degraded-connectivity model above is adopted. Emergency info, medication list, appointments, and message/refill drafting work offline. Protocol evaluation, AI conversation, video, payment, and lab processing require connectivity. All offline screens show last-updated timestamps and a connectivity banner.

---

## Resolution 11 — Delivery partner integration model

### The problem

The refill slice defines delivery as a state machine step but says nothing about who delivers, how status is tracked, or what happens when the delivery partner's data disagrees with Telecheck's.

### Resolution

This resolution defines the requirements the Pharmacy Portal slice PRD must address. It does not select a specific delivery partner.

**Integration requirements:**

- **Status API:** The delivery partner must provide a real-time or near-real-time status API that Telecheck can poll or receive webhooks from. Minimum status events: order received, picked up by rider, in transit, delivered, delivery failed.
- **Status reconciliation:** Telecheck's order status is the system of record. Delivery partner status updates are ingested and reconciled. If the delivery partner reports "delivered" but the patient reports "not received," Telecheck's support workflow takes precedence and the order status is not auto-closed.
- **Delivery failure handling:** Per the Refill Slice §9.4, failed delivery reverts to pickup-available. The delivery partner integration must support a "return to pharmacy" or "hold for pickup" instruction.
- **SLA:** Define a maximum delivery window per market. For Ghana launch, recommend a target of same-day delivery within Accra metro for orders approved before 2pm, next-day for orders approved after 2pm or outside Accra metro. This target is aspirational at launch and becomes an SLA as delivery operations mature.
- **Patient tracking:** The patient sees delivery status in-app and via WhatsApp notification. Status is honest (§16): "your medication is being prepared" is not the same as "your medication is on the way."
- **Cost:** Delivery cost model (free delivery, flat fee, distance-based) is a commercial decision per market. The Pharmacy Portal slice should define where delivery cost is displayed to the patient (at checkout, before payment confirmation).

**What to include in the Pharmacy Portal slice PRD:**

A dedicated section on delivery partner integration covering: integration API requirements, status reconciliation rules, failure handling procedures, patient-facing status language, delivery cost display, and SLA definition per market.

### Lockable position

Delivery partner integration requirements are defined above. The Pharmacy Portal slice PRD addresses them in a dedicated section. Telecheck's order status is the system of record; delivery partner status updates are ingested, not blindly trusted.

---

## Resolution 12 — Medication reconciliation at onboarding

### The problem

The interaction engine checks the full medication list, but the engine is only as good as its inputs. For chronic-care patients joining Telecheck with existing medication regimens, the default onboarding state is an incomplete medication list — not an edge case.

### Resolution

The onboarding/intake flow includes a **structured medication reconciliation step** that goes beyond free-text entry.

**Reconciliation flow:**

1. **Prompted entry:** The intake form asks "What medications are you currently taking?" with structured fields: medication name (with autocomplete from the formulary database), dose, frequency, and prescriber (optional). The form supports "I don't know the exact name" with a search-by-description option.

2. **AI-assisted review:** After initial entry, the AI Clinical Assistant (Mode 1) reviews the list conversationally: "You mentioned you take a blood pressure medication. Is that the only one? Some people also take a cholesterol medication or a blood thinner — do any of those apply?" This conversational prompt is designed to catch common omissions, not to exhaustively interrogate the patient.

3. **Photo upload:** The patient can photograph their medication bottles or packaging. OCR extracts medication names and doses for confirmation. This is particularly valuable for patients who don't know the generic names of their medications.

4. **Completeness signal:** After reconciliation, the system tags the medication list with a completeness confidence level: high (structured entry + AI review + photo verification), medium (structured entry + AI review), low (partial entry only). This signal is visible to clinicians and the interaction engine (per Interaction Engine Slice §10.1).

5. **Ongoing reconciliation:** At every clinical touchpoint (consult, refill review, program check-in), the clinician or AI prompts for medication list updates. The list is never treated as static.

**What the Forms/Intake Engine slice PRD must define:**

- The structured medication entry fields and autocomplete behavior.
- The AI conversational reconciliation prompts per program type.
- The photo-upload OCR flow for medication identification.
- The completeness confidence tagging logic.
- The ongoing reconciliation prompts at clinical touchpoints.

### Lockable position

Onboarding includes structured medication entry with autocomplete, AI-assisted conversational reconciliation, and photo upload for medication identification. The system tags medication list completeness and prompts for updates at every clinical touchpoint.

---

## Resolution 13 — RPM/CCM billing infrastructure promotion

### The problem

RPM/CCM is committed at launch with monthly-subscription billing, but subscription billing infrastructure is an unresolved open question (§24 Q11) rather than a pre-launch decision.

### Resolution

Promote to pre-launch decision status.

**Pre-launch decision (new §23 Q5 or Q6):**

> **RPM/CCM subscription billing infrastructure.** Build or buy? If buy, which vendor, and what is the integration timeline? If build, what is the engineering scope and does it compete with critical-path launch items?

**Recommendation:** Buy, not build. Subscription billing is a solved problem. Integrate a payment infrastructure provider that supports recurring billing on mobile money (Ghana) and card (future markets). The provider must support: subscription creation, recurring charge on a defined schedule, failed-payment retry logic, subscription pause and cancellation, proration for mid-cycle changes, and receipt/invoice generation.

**Owner:** Payments & Billing Operations Lead.
**Defined done:** Vendor selected, contract signed, integration tested with Ghana mobile money provider, subscription creation and recurring charge flow verified end-to-end.

### Lockable position

Subscription billing infrastructure is promoted from open question to pre-launch decision. Recommendation is buy-not-build. Owner is Payments & Billing Operations Lead.

---

## Resolution 14 — Herb-drug interaction engine coverage and confidence

### The problem

The herb-drug engine is a launch capability (#13 in the feature index) and a Ghana-specific differentiator, but it has no slice PRD, no defined knowledge base scope, and no confidence model.

### Resolution

The herb-drug engine slice PRD must address the following at minimum. This resolution defines the requirements; the slice PRD provides the detail.

**Knowledge base scope for Ghana launch:**

- Cover the most commonly used traditional herbal medicines in Ghana and West Africa. Priority list should be developed with clinical partners (Korle Bu, Ghana FDA).
- Minimum launch coverage: 30–50 commonly used herbal preparations with known phytochemical interaction profiles.
- Coverage scope should be transparent to clinicians: "This engine covers [X] herbal preparations. If a patient reports a preparation not in our database, a coverage-gap signal is produced."

**Confidence model:**

- Herb-drug signals use the same severity model as the medication interaction engine (critical / major / moderate / minor).
- An additional **evidence quality** field is added to herb-drug signals: established (peer-reviewed evidence), emerging (case reports or preclinical data), theoretical (mechanistic plausibility without clinical confirmation).
- Evidence quality is visible to the clinician alongside severity. A "major severity, theoretical evidence" signal is treated differently from a "major severity, established evidence" signal.

**Patient-facing posture:**

- Herb-drug signals are visible on the medication detail page in the same format as medication interaction signals.
- Patient-facing language acknowledges that herbal interaction data may be less comprehensive than drug interaction data: "Based on available research, this herbal medicine may interact with [medication]. Talk to your doctor."

**What the slice PRD must also define:**

- How patients report herbal medicine use (structured entry with common local names, free text, photo upload).
- How the engine handles preparations with multiple active compounds.
- How the knowledge base is updated (same governance as medication interaction engine knowledge base, per Interaction Engine Slice §9.3).
- Specific interaction with the Medication Interaction & Validation Engine (signals are additive, per Interaction Engine Slice §8).

### Lockable position

The herb-drug engine launches with 30–50 commonly used Ghana/West African herbal preparations. Signals include an evidence-quality field (established/emerging/theoretical). The slice PRD defines patient reporting flows, multi-compound handling, and knowledge base governance.

---

## Resolution 15 — Fake medication detection data sourcing

### The problem

Fake medication detection is advisory-only at launch (correct), but the data dependency — where the reference data comes from for Ghana — is unaddressed.

### Resolution

Add as a pre-launch decision or resolve here.

**Data sources for Ghana launch:**

- **Ghana FDA database:** The Ghana FDA maintains a register of approved pharmaceutical products. This serves as the baseline for legitimate medication identification.
- **Manufacturer verification partnerships:** For high-volume medications in the launch formulary, establish direct verification channels with manufacturers (batch numbers, packaging specifications, serial numbers where available).
- **Image reference set:** Build a reference image library of legitimate medication packaging for the launch formulary. This is the minimum viable reference set for image-based detection.
- **Mobile verification codes:** Some manufacturers use scratch-off or SMS verification codes on packaging. The platform should support code entry as a verification pathway where available.

**Launch posture (unchanged):**

- Advisory only. Detection results surface to clinician and pharmacist, not to the patient.
- No definitive verdicts. A flag means "review this" not "this is counterfeit."
- False-positive tracking begins at launch. Patient-visible signals activate only after false-positive rates are validated (per Master PRD §11.3).

**Owner:** Pharmacy Operations Lead + Regulatory & Partner Affairs Lead.

### Lockable position

Fake medication detection at Ghana launch uses Ghana FDA product register, manufacturer verification partnerships for high-volume formulary items, and a reference image library. Advisory-only posture is maintained. Patient-visible signals are gated on false-positive rate validation.

---

## Resolution 16 — Community moderation minimum launch set

### The problem

Community is a first-class pillar but the minimum launch group set and moderation staffing model need to be explicit.

### Resolution

Adopt the operational review's recommendation with specific staffing numbers.

**Launch groups (3):**

1. Weight & Metabolic Health
2. Men's Health
3. Living with Hypertension & Diabetes

**Moderation staffing:**

- 2 trained human moderators covering Ghana business hours (8am–8pm).
- 1 moderator on-call for evening/overnight crisis escalation (8pm–8am).
- Automated moderation for obvious content violations (spam, explicit content, medication sales) running 24/7 under configured moderation policy.
- Crisis detection is platform-floor and always-on, regardless of moderator availability.

**Moderation SLAs:**

| Signal type | Response target |
|---|---|
| Crisis / self-harm / abuse | Under 15 minutes (24/7) |
| Severe harassment / dangerous misinformation | Under 1 hour (during staffed hours) |
| Routine moderation reports | Under 24 hours |

**Expansion trigger:** When active community membership exceeds 500 per group, or when moderation action rate exceeds a defined threshold, add moderator capacity before adding groups.

### Lockable position

Launch with 3 groups, 2 daytime moderators + 1 on-call, defined SLAs. Expand moderator capacity before expanding group count.

---

## Recommended execution order

Based on all resolutions above, the execution order is organized into three waves.

### Wave 1 — Launch blockers (must be resolved before any patient interaction)

| Item | Owner | Dependency |
|---|---|---|
| AI Clinical Assistant slice PRD (Mode 1 + Mode 2) | AI Safety & Guardrails Lead | Guardrail templates, autonomy framework reconciliation |
| Pharmacy Portal slice PRD (including delivery integration, platform vs partner pharmacy) | Pharmacy Operations Lead | Delivery partner selection, platform pharmacy licensing |
| Labs / Document Interpretation slice PRD | Clinical Governance Lead | OCR pipeline, lab data model |
| Notification / communication layer (WhatsApp + SMS + in-app) | Payments & Billing Operations Lead | WhatsApp Business API verification |
| Ghana clinician coverage model (5 clinicians, clinician-hours model) | Clinical Governance Lead + Async & Refill Review Lead | Clinician recruitment/contracting |
| Clinician compensation model (refill review as compensated work unit) | Clinical Governance Lead | Medication margin analysis |
| Ghana protocol library (GLP-1, ED, chronic refill renewals, dispensing release, emergency routing) | Clinical Governance Lead + Regulatory Lead | Ghana MDC / Pharmacy Council engagement |
| Guardrail template pack (4 templates: Conservative Default, GLP-1, Men's Health/ED, Labs & Medication) | AI Safety & Guardrails Lead | Clinical review, test suites |
| Moderation staffing model (2 moderators + 1 on-call, 3 launch groups) | Community Safety & Moderation Lead | Moderator recruitment/training |
| Payment infrastructure (mobile money integration, subscription billing vendor) | Payments & Billing Operations Lead | Vendor selection |
| Consent progressive flow design | AI Safety & Guardrails Lead + Clinical Governance Lead | Forms/Intake Engine slice |
| Medication reconciliation onboarding flow | Clinical Governance Lead | Forms/Intake Engine slice, AI Clinical Assistant |

### Wave 2 — Operating control (required for safe ongoing operations)

| Item | Owner | Dependency |
|---|---|---|
| Market Control Plane / Rollout Cockpit slice PRD | Market Control Plane Lead | Admin slices (#18, #19, #20) |
| Delivery / fulfillment integration specification | Delivery & Fulfillment Lead | Delivery partner selection |
| Degraded connectivity / offline model | Country Launch Director | Engineering assessment |
| Adverse-event reporting operating path | Regulatory & Partner Affairs Lead | Ghana FDA format agreement |
| Herb-drug interaction engine slice PRD | Clinical Governance Lead | Phytochemical knowledge base sourcing |
| Fake medication detection data sourcing | Pharmacy Operations Lead + Regulatory Lead | Ghana FDA product register access |
| Incident response playbook | Support & Incident Response Lead | Rollback procedures defined |

### Wave 3 — Controlled activation (built at launch, activated after approval)

| Item | Gate | Owner |
|---|---|---|
| Protocol-authorized refill activation (per medication class) | Ghana MDC / Pharmacy Council sign-off per protocol | Clinical Governance Lead |
| Protocol-authorized dispensing release | Pharmacy Council and partner pharmacy governance approval | Pharmacy Operations Lead |
| Expanded RPM/CCM programs | Protocol + clinician supply + device availability per program | Clinical Governance Lead |
| Expanded AI guardrail templates (beyond conservative default) | Test suites pass + governance approval | AI Safety & Guardrails Lead |
| Expanded community groups (beyond launch 3) | Moderation capacity + community health signals | Community Safety & Moderation Lead |
| Patient-visible fake medication detection signals | False-positive rate validation | Pharmacy Operations Lead |
| AI Mode 2 auto-approve (protocol-authorized without per-instance physician review) | Accuracy and safety record review per program | Clinical Governance Lead + AI Safety Lead |

---

## Master PRD update summary

The following changes should be made to the Master PRD v1.4 to absorb these resolutions:

| Section | Change |
|---|---|
| §6 Market and launch strategy | Add reference to the Market Control Plane / Rollout Cockpit as the operational tool for market expansion |
| §14 Admin configuration surfaces | Add paragraph acknowledging the Rollout Cockpit as the composition and governance state layer above the three admin configuration tools |
| §17 Experience direction | Add "Degraded connectivity and offline behavior" subsection per Resolution 10 |
| §18 Business model | Add sentence on clinician compensation for refill reviews per Resolution 7 |
| §22 Risks | Add launch scope volume risk per Resolution 8 |
| §23 Pre-launch decisions | Add Q5: Clinician coverage model; add Q6: Subscription billing infrastructure; update Q2 to note urgency parity with Q1 |
| §24 Open questions | Remove Q3 (clinician compensation — now resolved) and Q11 (billing infrastructure — promoted to §23) |
| §25 Feature PRD index | Insert #21: Admin — Market Rollout Cockpit (after admin trio); renumber subsequent entries |

---

## Document control

- **v1.0** — Initial resolution document covering all flagged items from Red-Team Review and Operational Review feedback cycle.
- **Historical next step (completed):** Founder review and lock, followed by promotion of the absorbed changes into the later canonical Master PRD lineage.
