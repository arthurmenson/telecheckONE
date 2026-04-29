# Telecheck — ADR Addendum: ADR-016, ADR-017, ADR-018, ADR-019

**Version:** 1.0
**Status:** Canonical — appends to ADR Set v1.0
**Owner:** Engineering Lead
**Parent document:** Telecheck Architecture Decision Records v1.0 (15 ADRs)
**Companion documents:** Master Platform PRD v1.6, Patient App IA v1.0, Labs and Document Interpretation Slice PRD v1.0, Future Scope: USSD + AI Bridge v0.1, Operational Readiness To-Do v1.0

---

## Purpose

Four new ADRs ratified in the 2026-04-25 session following the Adversarial Counsel Review and the resulting product decisions on language posture, lab interpretation timing, and broader-market strategy.

ADR-016 is reserved for the AI model + provider decision (currently OR-003, Tier 0, Open). The number is reserved here so subsequent ADRs are not renumbered later.

ADR-017 is reserved for the data residency decision (currently OR-103, Tier 1, Open). Same rationale.

ADR-018 and ADR-019 are ratified now and recorded below.

Per ADR Set v1.0 immutability rule, accepted ADRs are never edited. Reservations record an unfilled number; ratifications record a finalized decision.

---

## ADR-016: AI model + provider decision

**Status:** Reserved (pending decision per OR-003)

**Context placeholder:** The platform requires a named AI model and provider for Mode 1 conversational assistant, Mode 2 protocol execution agent, and AI scribe. Current artifacts reference "the LLM provider" generically. This decision is reviewer-blocking (OR-003, Tier 0).

**To be filled by:** AI Safety Lead + Engineering Lead, when OR-003 closes.

---

## ADR-017: Data residency for Ghana launch

**Status:** Reserved (pending decision per OR-103)

**Context placeholder:** Patient data physical storage location, cross-border transfer mechanism if applicable, Ghana DPC registration, encryption-at-rest key custody. Current artifacts reference per-market encryption keys but do not name the storage region. This decision is launch-blocking (OR-103, Tier 1).

**To be filled by:** Engineering Lead + Regulatory & Partner Affairs Lead, when OR-103 closes.

---

## ADR-018: English-first launch posture

**Status:** Accepted
**Date:** 2026-04-25

**Context:**

The Adversarial Counsel Review (2026-04-25) flagged multilingual coverage as a material risk across Clinical, AI, and Privacy lenses. The review noted that crisis detection, AI guardrails, moderation Layer 1, consent screens, and patient-facing copy were all assumed English-only without explicit acknowledgement of the launch population's language profile.

The launch product targets the literate, English-fluent Ghanaian population — primarily urban, smartphone-equipped, WhatsApp-native. This population is the addressable market for Track A (smartphone-first, app and WhatsApp). The broader Ghanaian chronic-disease population — including patients whose first language is Twi, Akan, Ga, Ewe, Hausa, or Pidgin, and patients whose primary access device is a feature phone — is addressed by a future Track B (USSD + AI Bridge), captured separately in the Future Scope: USSD + AI Bridge document v0.1.

**Options considered:**

1. Multilingual at launch — translate consent, AI Mode 1 responses, crisis detection vocabulary, moderation rules, UI copy into Twi/Akan/Ga/Ewe/Hausa/Pidgin. Significant work, untested at clinical-grade quality with currently available LLM and translation tooling. Adds 6+ months to launch timeline. Most of this work is also reusable in Track B and is therefore not wasted if deferred.

2. English at launch with limited Twi UI — compromise position. Translate menu chrome only; keep all clinical content English. Would create a misleading partial experience where users assume the platform supports their language but functionally it does not.

3. **English-only at launch with explicit user-facing scoping; broader language coverage deferred to Track B.** Patient app, clinician portal, admin surfaces, AI Mode 1, scribe, crisis detection, moderation, guardrails — all English. User-specific settings (display name, locality, notification preferences) accept local-language input where they affect only that user's view. The launch population is informed of the scope.

**Decision:** Option 3.

**Consequences:**

- The launch UI, AI surfaces, clinical content, and safety-critical infrastructure (crisis detection, moderation Layer 1, guardrail templates) are all English-only at launch.
- User-specific settings such as display name, address, and notification preferences accept local-language input. These do not affect clinical or safety surfaces.
- Patient onboarding is explicit about the language scope: "Telecheck is currently available in English. We are working on local-language support — sign up for updates if you'd like to be notified when [Twi / Akan / etc.] is available."
- The launch population is the literate, English-fluent Ghanaian segment. Marketing, partner outreach, and clinician supply align to this population.
- Multilingual coverage work is captured in the Future Scope: USSD + AI Bridge v0.1 §4.3 as primary work area for Track B.
- OR-105 (Multilingual coverage spec) in the Operational Readiness To-Do is **resolved for Track A** and carried into the Track B future scope.
- The Patient UI/UX Pressure Review (2026-04-25) cross-cutting weakness #4 (multilingual as silent fault line) is **closed for the launch population** by this decision. The pressure review's archetype A1 (Maame, Twi-preferred) is acknowledged as a Track B target population, not a Track A launch population.

**References:**
- Future Scope: USSD + AI Bridge v0.1
- Operational Readiness To-Do v1.0 §3 (OR-105 disposition)
- Patient UI/UX Pressure Review (2026-04-25)
- Master PRD v1.6 §17 (experience direction — to be updated to reference English-first posture)

---

## ADR-019: AI-first lab interpretation with explicit pending-review caveat

**Status:** Accepted
**Date:** 2026-04-25

**Context:**

The Patient UI/UX Pressure Review (2026-04-25) flagged Journey 4 (lab upload) as ambiguous: when a patient confirms extracted lab values, does the AI interpret immediately and present the interpretation to the patient, or does the AI wait for clinician review before presenting an interpretation?

The Labs and Document Interpretation Slice PRD v1.0 §6.2 specifies that the patient sees an AI interpretation with a "Not yet reviewed by your doctor" indicator until clinician review fires. §6.3 requires clinician review for critically abnormal values, first-time uploads, values triggering critical or major drug-lab signals, trend reversals in chronic conditions, and explicit patient request. For other cases, clinician review is "recommended but not required" or "not required."

The pressure review noted a real safety concern: if OCR extraction misreads a value (e.g., HbA1c 6.5 read as 8.5), the AI generates an interpretation suggesting urgent action on a non-urgent value, presented to the patient before any clinician sees it. The patient may act on the alarming interpretation in ways the eventual clinician review cannot undo (anxiety, premature medication adjustment via other channels, ER visit, loss of trust).

The pressure review presented two options: Option A (clinician reviews extraction before AI interprets — slower but safer) and Option B (AI interprets immediately with caveat — faster, current spec). The product owner has decided in favor of speed of patient response, with the safety risk mitigated through explicit caveat presentation, the existing critical-value clinician-review requirements, and continued investment in OCR accuracy and confirmation UX.

**Options considered:**

1. **Option A — Clinician-first interpretation.** Patient confirms extracted values. System holds AI interpretation. Patient sees "Your results are in. Awaiting interpretation by your doctor." Clinician reviews values, AI generates interpretation, clinician validates or corrects, patient sees clinician-validated interpretation. Slower (potentially hours to days) but clinician verification gates patient-facing AI output.

2. **Option B — AI-first interpretation with caveat.** Patient confirms extracted values. AI generates interpretation immediately and presents to patient with a clear caveat ("Based on the values you confirmed. Your doctor's review is pending."). Critical values still trigger mandatory clinician review per §6.3. Patient gets quick understanding of routine results; clinician verification is the second layer, not the gating layer.

3. **Hybrid — Tier interpretation by value class.** Routine in-range values: Option B. Abnormal values: Option A. Adds complexity; the patient sees inconsistent timing depending on what the values are.

**Decision:** Option 2 (AI-first with caveat).

**Rationale:**
- Patient experience benefit is significant: chronic-care patients uploading routine monitoring labs (most uploads at scale) get immediate, in-language explanation of normal results without waiting for asynchronous clinician review of routine data.
- Clinician capacity is preserved: routine in-range results do not require clinician interrupt; clinicians focus on cases that genuinely need their attention.
- Safety-critical cases are still gated: all four "Always requires clinician review" categories in Labs Slice §6.3 (critically abnormal values, first-time upload, critical/major drug-lab signal trigger, trend reversal in chronic condition) prevent AI-only patient communication for the highest-risk cases.
- The known-error case (OCR misread inflating a routine value to an abnormal one) is mitigated by: the caveat language, the patient confirmation step (existing in §5), and OCR accuracy monitoring (specified in §10.3 and OR-110).
- The reverse error case (OCR misread deflating an abnormal value to look normal) is the more dangerous failure. This is not introduced by Option B vs Option A — it exists under both options. The mitigation is OCR accuracy investment, the patient confirmation UX (which the pressure review noted is itself imperfect for low-literacy users — and is not in launch scope per ADR-018), and clinician review of any value-confirmation edits the patient makes that change a value's classification.

**Consequences:**
- AI lab interpretation is presented to the patient immediately upon value confirmation.
- The caveat copy is explicit and consistent: "Based on the values you confirmed. Your doctor's review is pending." (or "Reviewed by Dr. [Name]" once review completes). The caveat is part of the Design System content-source indicator vocabulary (Design System §3.5 — "Not yet reviewed" already exists; this ADR confirms its application to lab interpretation).
- Critical-value mandatory clinician review (Labs Slice §6.3 "Always requires clinician review") is unchanged.
- A new platform-floor consideration: AI interpretation cannot recommend specific actions ("stop your medication," "take an extra dose") — this is already prohibited by FLOOR-010 and the Mode 1 guardrail templates. Lab interpretation copy must comply: it can explain values, contextualize against ranges, surface concerns, and recommend follow-up ("discuss with your doctor"); it cannot direct clinical action.
- The Labs Slice PRD §6.2 is to be updated to reference this ADR explicitly. The pre-existing "Not yet reviewed by your doctor" indicator is the canonical caveat.
- The Patient App IA Journey 4 (Lab upload, §12.4) is updated to remove the implicit Option A interpretation and confirm Option B.
- OR-221 in the Operational Readiness To-Do is **resolved** by this ADR. The ADR is the safety-model decision the OR item asked for.
- A new monitoring requirement is added: AI lab interpretation accuracy is a tracked metric. Patient-confirmed extraction values that are subsequently corrected by clinician review are flagged for OCR-accuracy and AI-interpretation-accuracy review. Monitoring scope is added to OR-218 (Performance and load test plan) — extended in scope to include clinical-accuracy regression.

**References:**
- Labs and Document Interpretation Slice PRD v1.0 §6.2, §6.3
- Patient App IA v1.0 §12.4 (to be updated)
- Design System v1.1 §3.5 (content source indicators)
- Operational Readiness To-Do v1.0 (OR-221 resolution)
- Patient UI/UX Pressure Review (2026-04-25), Journey 4

---

## Updated ADR Index

| ADR | Title | Status |
|---|---|---|
| ADR-001 | Modular monolith at launch, service extraction later | Accepted |
| ADR-002 | Two-mode AI architecture (Mode 1 + Mode 2) | Accepted |
| ADR-003 | Market Launch as sole offerability authority | Accepted |
| ADR-004 | Pattern A for Forms Engine — one version per market | Accepted |
| ADR-005 | Protocolized autonomy, not open-ended autonomy | Accepted |
| ADR-006 | Interaction engine runs before clinician commits | Accepted |
| ADR-007 | No AI in community spaces | Accepted |
| ADR-008 | Bridge supply on consent revocation | Accepted |
| ADR-009 | Sensitive-category data default-hidden from delegates | Accepted |
| ADR-010 | WhatsApp primary, SMS fallback | Accepted |
| ADR-011 | Fake medication detection advisory-only at launch | Accepted |
| ADR-012 | Async-to-sync conversion preserves all data | Accepted |
| ADR-013 | Immutable append-only audit | Accepted |
| ADR-014 | 5-clinician minimum panel | Accepted |
| ADR-015 | Progressive consent presentation | Accepted |
| ADR-016 | AI model + provider decision | Reserved (pending OR-003) |
| ADR-017 | Data residency for Ghana launch | Reserved (pending OR-103) |
| **ADR-018** | **English-first launch posture** | **Accepted (2026-04-25)** |
| **ADR-019** | **AI-first lab interpretation with explicit pending-review caveat** | **Accepted (2026-04-25)** |

---

## Document control

- **v1.0** — Initial ADR addendum. Adds ADR-016 and ADR-017 as reserved (pending OR-003 and OR-103 resolution), ratifies ADR-018 (English-first launch posture) and ADR-019 (AI-first lab interpretation with caveat).
- **Promotion path:** When the next full revision of ADR Set v1.0 is produced, these four ADRs merge into the ADR Set as ADR Set v1.1. Until then, this addendum is the canonical record for ADR-016 through ADR-019.
- **Change discipline:** ADRs are immutable once Accepted. Reservations (ADR-016, ADR-017) are filled in when their owning OR items close; the fill is appended, not edited.
