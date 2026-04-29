# Telecheck — Red-Team Review

**Scope:** Master Platform PRD v1.4, Refill Slice PRD v1.0, Medication Interaction & Validation Engine Slice PRD v1.0, Platform Brief, Rollout Cockpit Concept
**Date:** April 2026
**Status:** Historical support artifact
**Type:** Cross-document structural review
**Historical note:** This review captures the pre-freeze state. References to then-forthcoming slices or missing artifacts are retained as historical context and are superseded where later canonical artifacts now exist.

---

## How this review is organized

Items are ordered by severity: structural risks that could cause real failure, then gaps the documents don't address, then contradictions and tensions between documents, then issues that are fine now but will cause problems later if unaddressed. A final section confirms what the documents get right.

---

## Structural risks — things that could cause real failure

### 1. The launch scope is enormous for a v2-direct ship

The PRD explicitly rejects phasing (no v1, no v1.5) and commits to shipping refills, async consults, sync video, lab interpretation, full AI Clinical Assistant, RPM/CCM, community, delegated care, herb–drug intelligence, fake medication detection, the full interaction engine, food scanning, fitness tracking, pregnancy tracking, and all three admin configuration surfaces — simultaneously. §11.3 attempts to manage this with the "built at launch, activated later" distinction, but the engineering, clinical content, QA, and operational burden of having all of this present, tested, and audited at launch is very large.

The PRD says "shipping partial-v2 with gaps is explicitly not acceptable" (§12), which means a single lagging module delays everything. That's a principled position, but it's also a schedule risk that the document doesn't acknowledge as a risk in §22. The risk table mentions "launch slips because delivery-layer foundations aren't ready" but doesn't address the broader scope-volume risk.

**Recommendation:** Add an explicit risk entry for launch scope volume. Consider identifying a "critical path subset" within §11.1 — the capabilities that are genuinely load-bearing for the first patient interaction — versus capabilities that are committed for launch but whose absence for a few weeks wouldn't violate patient trust or safety. The v2-direct commitment is fine as an ambition; it needs a contingency plan that isn't "delay everything."

---

### 2. Clinician supply is underspecified as a launch constraint

§21 lists clinician supply as a dependency, and §22 mentions adoption risk, but there's no section that defines the minimum viable clinician panel for Ghana launch. How many clinicians are needed to staff async review queues, sync video slots, protocol accountability roles, and override/escalation coverage? What's the coverage model — 24/7, business hours, on-call?

The refill slice depends on clinician review as the default pathway, and every protocol fallback also routes to a clinician. If the clinician panel is undersized, the entire system queues up. Time-to-clinician-decision is a headline launch metric, but there's no staffing model behind it.

**Recommendation:** Either add a §21.5 or a pre-launch decision in §23 that defines the minimum clinician panel size, coverage model, and escalation chain for Ghana launch. This is as much a launch blocker as the protocol library.

---

### 3. The AI Clinical Assistant is committed at launch but underspecified

It's listed as a full launch capability — global launcher, embedded cards, full workspace — and it's the #11 slice PRD in the index. But there's no slice PRD drafted for it yet, and it's one of the highest-risk surfaces in the platform. It operates under guardrail-configured conversational autonomy (§13.2), it can reference interaction engine signals, it can help initiate refills, and it's patient-facing.

The guardrail framework is well-defined in principle, but the actual behavior of the assistant — what it can and can't say about medications, labs, symptoms, conditions — is entirely dependent on the guardrail template content, which is a pre-launch decision (§23 Q2) that hasn't been resolved. This means one of your most visible, most risky patient-facing features is committed at launch but has no slice PRD and no resolved guardrail content.

**Recommendation:** Prioritize the AI Clinical Assistant slice PRD immediately. It should be the next slice drafted after the Rollout Cockpit concept is locked. The guardrail template content (§23 Q2) should be elevated to the same urgency as the protocol library (§23 Q1).

---

### 4. Community moderation at launch carries real safety exposure with limited specificity

Community is a first-class pillar, launched with moderated groups, events, expert sessions, and peer support. Crisis detection is platform-floor. But the actual moderation operating model — how many moderators, what languages, what hours, what tools, what escalation SLA — is a pre-launch decision (§23 Q3) that's unresolved.

The PRD commits to human review for serious moderation actions at launch, which is the right call, but that means the moderation team is a hard staffing dependency. If a community post surfaces a genuine crisis (suicidal ideation, abuse disclosure) and the moderator response time is slow, the platform's trust contract is broken on a safety-critical dimension.

**Recommendation:** The community moderation staffing plan should be resolved alongside the clinician panel. Consider whether the curated launch set of community groups should be very small — perhaps 2–3 condition-specific groups with active moderation — rather than a broad launch. The PRD's §11.3 allows for this ("additional groups activate as moderation capacity warrants"), but the slice PRD should make the minimum launch set explicit.

---

## Gaps — things the documents don't address that they should

### 5. No notification architecture

The Master PRD mentions "notifications and follow-up nudges" in §11.1 launch scope and lists "persistent notifications surface" as a launch-readiness criterion in §12. The refill slice depends on patient notifications at nearly every state transition. But there's no notification model anywhere — no definition of notification channels (push, SMS, in-app, email), no priority model, no frequency controls, no quiet hours, no per-market channel availability.

In Ghana, SMS and push notification reliability vary. If notifications fail silently, patients won't know their refill was declined or their delivery failed, which directly violates the "honest status" principle.

**Recommendation:** Add a cross-cutting notification model, either as a short section in the Master PRD or as its own lightweight slice. It needs to define channels per market, fallback behavior when a channel fails, patient notification preferences, and the priority/frequency model.

---

### 6. No offline or degraded-connectivity behavior specification

§17 says "degraded connectivity is a first-class design target" and §13.1 says the system must fail toward emergency information display during degraded operation. But no document defines what "degraded" means operationally, what the patient sees when connectivity drops mid-refill, whether any workflow state is cached locally, or how the platform recovers when connectivity returns. For Ghana, this isn't an edge case — it's a regular operating condition.

**Recommendation:** Define a degraded-operation model. At minimum: which screens are available offline (emergency info, medication list, basic AI responses if cached), which workflows pause and resume (refill mid-submission), and which workflows cannot proceed (new consult booking). This could be a section in the experience direction (§17) or a cross-cutting technical constraint.

---

### 7. No delivery partner integration model

The refill slice defines delivery as a state (Delivering → Delivered / Delivery Failed) but says nothing about who delivers, how delivery status is tracked, what the integration looks like, or what happens when the delivery partner's system disagrees with Telecheck's system about order status. In Ghana, last-mile delivery is a real operational challenge. The PRD treats delivery as a terminal step with honest status, but honest status requires a reliable data feed from the delivery partner.

**Recommendation:** Either the Pharmacy Portal slice (then-forthcoming) or a dedicated Delivery slice needs to address partner integration, status reconciliation, and failure handling in detail.

---

### 8. No data migration or patient onboarding path for existing medication histories

The interaction engine checks against the patient's full active medication list, but the refill slice notes the engine only runs on "reported medications." If a patient joins Telecheck with a complex medication regimen and doesn't report all of it, the engine's value degrades significantly.

The interaction engine slice acknowledges this (§10.1, incomplete medication list) but treats it as an edge case with a data-quality signal. For chronic-care patients — the core use case — this is the default state at onboarding, not an edge case.

**Recommendation:** The onboarding/intake flow should include a structured medication reconciliation step that's more than a free-text entry. Consider integrating pharmacy records (where available) or using the AI Clinical Assistant to walk patients through their medication list conversationally. This affects the Forms/Intake Engine slice (#4).

---

## Contradictions and tensions

### 9. The "no consult fee on refills" model creates a perverse incentive against clinician review

§18 says refills are medication-cost only with no consult fee, and this is deliberate to drive adherence. But the clinician-review pathway (§5.1 of the refill slice) requires clinician time and attention for every refill until protocol-authorized pathways are activated. If refills don't generate consult revenue, and the clinician panel is compensated per-consult (open question §24 Q3), then refills are uncompensated clinician labor.

This creates pressure to either activate protocol-authorized pathways faster than governance warrants, or to understaff refill review queues. The business model and the clinical model are in tension.

**Recommendation:** Resolve the clinician compensation model (§24 Q3) before launch, and ensure it explicitly accounts for refill review time. If clinicians are per-consult, refill reviews need to be compensated as a distinct work unit. This isn't just a business question; it's a clinical safety question, because underpaid review work gets rushed.

---

### 10. Protocol-authorized refill renewal and patient awareness of approval pathway

The platform floor prohibits "autonomous consent capture for actions with clinical or legal weight" (§13.4), but protocol-authorized refill renewal executes without per-instance patient confirmation. The refill slice §5.2 describes the protocol pathway as: patient initiates → checks pass → protocol executes → pharmacy receives. The patient initiated the refill request, which could be read as consent. But does initiating a refill request constitute consent to protocol-authorized renewal specifically, or only to a refill in general?

The consent model (§15) defines care consent as including "protocolized actions for this program," which suggests the consent was given at program enrollment, not at refill time. This is probably fine legally, but the patient experience should make clear that "your refill may be processed automatically under your care program" rather than implying a clinician reviewed it. The experience direction (§17) says protocol-executed actions must be visibly flagged, which helps, but the refill slice doesn't specify what the patient sees when their refill was protocol-approved versus clinician-approved.

**Recommendation:** Add a patient-facing distinction in the refill slice between "approved by your doctor" and "approved under your care program." The audit knows the difference; the patient should too.

---

## Things that are fine now but will bite later

### 11. Herb–drug interaction engine has no slice PRD drafted

It's #13 in the feature index, consumes the same signal model as the interaction engine, and is specifically relevant for the Ghana market. But there's no draft. The interaction engine slice defines the shared signal model it must conform to, which is good, but the actual phytochemical knowledge base, the data sources, the coverage scope, and the confidence model are undefined.

Herb–drug is one of Telecheck's strongest differentiators and a Ghana-specific selling point. If it launches with thin coverage or low-confidence signals, it undermines the platform's credibility on one of its most distinctive claims.

---

### 12. Fake medication detection data dependency is unaddressed

§21 lists "counterfeit-medication data" as a dependency and notes it requires per-market supply-chain data and image-recognition reference sets. But there's no pre-launch decision or open question about where this data comes from for Ghana. If the reference data is thin, the module will produce either too many false positives (damaging pharmacy partner trust, as §22 notes) or too few true positives (making the module useless). The advisory posture protects against the first problem but not the second.

---

### 13. RPM/CCM subscription billing infrastructure is unresolved

RPM/CCM is committed at launch with monthly-subscription billing, but the subscription billing infrastructure is an unresolved open question (§24 Q11). If billing infrastructure is buy-not-build, there's a vendor dependency on the launch critical path. If it's build, there's engineering scope that competes with the rest of the launch. Either way, it needs resolution urgency closer to the pre-launch decisions (§23) than the open questions (§24).

---

### 14. Consent model granularity versus onboarding friction

The consent model's six types (§15) are well-designed but will be complex to implement as actual patient-facing flows. A patient enrolling in a chronic-care program with a delegate needs to navigate platform consent, care consent, data-use consent, delegation consent, and possibly jurisdictional consent — potentially in a single onboarding session.

The PRD's experience principle of "low-friction onboarding" is in tension with the consent model's granularity. The Forms/Intake Engine slice will need to solve this carefully, and it should be informed by UX research on how much consent granularity patients can meaningfully engage with versus what they'll just click through.

---

## What the documents get right

To be clear about what doesn't need fixing:

- The **three-framework autonomy model** is well-constructed and internally consistent.
- The **platform floor** is the right concept and well-defined.
- The **refill slice** is genuinely strong as a proving slice — it exercises the right primitives.
- The **interaction engine's signal model** is clean and its gate rules for protocol execution are sound.
- The **consent model** is thorough.
- The **trust and data principles** are concrete rather than aspirational.
- The **v2-direct commitment**, while risky, is coherent with the product thesis.
- The decision to treat the **Rollout Cockpit as a governance state layer** rather than a UI shell is correct.
- The documents are **unusually well-integrated** for this stage. Most of what this review flags is about operational readiness and staffing, not architectural flaws.

---

## Summary of actions by priority

| Priority | Item | Action |
|---|---|---|
| **Resolve before launch** | Clinician supply model (#2) | Add pre-launch decision for minimum panel size and coverage model |
| **Resolve before launch** | Clinician compensation for refill reviews (#9) | Resolve §24 Q3; ensure refill review is a compensated work unit |
| **Resolve before launch** | AI Clinical Assistant slice PRD (#3) | Draft immediately; elevate guardrail template resolution |
| **Resolve before launch** | RPM/CCM billing infrastructure (#13) | Promote from open question to pre-launch decision |
| **Add to PRD** | Launch scope volume risk (#1) | Add risk entry; define critical-path subset |
| **Add to PRD** | Notification architecture (#5) | Add cross-cutting notification model |
| **Add to PRD** | Degraded-connectivity model (#6) | Define offline/degraded behavior specification |
| **Add to PRD** | Patient-facing protocol-vs-clinician distinction (#10) | Add to refill slice |
| **Address in then-forthcoming slices** | Delivery partner integration (#7) | Address in Pharmacy Portal or Delivery slice |
| **Address in then-forthcoming slices** | Medication reconciliation at onboarding (#8) | Address in Forms/Intake Engine slice |
| **Address in then-forthcoming slices** | Herb–drug interaction engine slice (#11) | Draft slice PRD |
| **Address in then-forthcoming slices** | Consent onboarding UX (#14) | Address in Forms/Intake Engine slice with UX research |
| **Track** | Community moderation launch scope (#4) | Make minimum group set explicit |
| **Track** | Fake medication detection data sourcing (#12) | Add as open question or pre-launch decision |
