# Telecheck — Future Scope: USSD + AI Bridge for Broader-Market Reach

**Version:** 0.1 (concept)
**Status:** Future scope — not in launch
**Owner:** Product (Telecheck) — strategic concept; future PRD authorship TBD
**Parent documents:** Master Platform PRD v1.6, Patient App IA v1.0, Notification Spec v1.1, Contracts Pack v5
**Companion documents:** Operational Readiness To-Do v1.0, Artifact Registry v2.3, Ghana Launch Playbook v1.1
**Document type:** Future-scope concept document — captures intent and architecture for capabilities deliberately deferred from launch. Not implementation-ready.

---

## 1. Why this document exists

The Telecheck launch product is an English-first, smartphone-first, app-and-WhatsApp experience designed for the literate, urban, English-fluent Ghanaian population. That is a deliberate scoping choice, ratified in ADR-018 (English-first launch posture).

But the chronic-disease burden Telecheck exists to address — hypertension, diabetes, cardiovascular disease, chronic kidney disease, depression — is heaviest in the populations the launch product cannot serve directly:

- Rural and peri-urban Ghanaians without smartphones
- Patients whose primary device is a feature phone ("yam phone" — colloquial Ghanaian for the small, durable, cheap feature phones common in markets and rural areas)
- Patients whose first language is not English (Twi, Akan, Ga, Ewe, Hausa, Pidgin, others)
- Older patients with limited digital literacy who can dial, type SMS, and answer voice calls but cannot navigate apps
- Patients with no consistent data connection but reliable voice and SMS coverage

Mobile network operator data for Ghana shows feature-phone penetration is ~40% of connections and concentrates in exactly the demographics most affected by undertreated chronic disease. Reaching this population is not a marketing question. It is a product-architecture question. The smartphone app cannot reach them; a WhatsApp-only strategy cannot reach them; the answer is a USSD-and-voice access layer that hands off to the same cloud AI and clinical workflows the smartphone app uses.

This document captures the strategic intent, architecture concept, and operational requirements for that capability, so it can be sequenced into a future post-launch wave. It is not a PRD. It is the *brief* from which a future PRD will be written.

---

## 2. Strategic narrative

### 2.1 The two-track market thesis

Telecheck addresses Ghana's chronic-disease burden through two distinct access tracks:

**Track A — Smartphone-first (the launch product).** App + WhatsApp. English. Urban and literate. Pays via mobile money. This is the population the launch is designed for, and it is the population that can fund the early growth of the platform through direct patient-pay.

**Track B — Feature-phone-first (this future scope).** USSD + SMS + AI voice agent. Local language. Rural and peri-urban. May pay via mobile money, sponsored programs, or insurance. This is the population whose chronic-disease burden is the original public-health rationale for the platform.

Track A funds Track B. Track B fulfills the platform's broader public-health mission and is the basis for partnership with public health systems, NGOs, and donor-funded chronic-care programs. Telecheck is not credible as a Ghana-wide chronic-care platform if it serves only Track A.

### 2.2 The handshake principle

The two tracks are not separate products. They share:

- The same patient record (one Telecheck account per person, accessed through whichever channel the patient chooses)
- The same clinicians (a doctor reviewing a refill request does not know or care whether the request originated from the app or USSD)
- The same AI Mode 1 conversational layer (the AI agent the patient talks to over voice is the same Mode 1 model the smartphone patient chats with)
- The same protocols, guardrails, and platform floor
- The same audit
- The same medication interaction engine, herb-drug engine, fake-medication detection, and adverse-event reporting

What changes is the **interaction surface**. App and WhatsApp render the platform as touch-and-text. USSD and voice render the platform as keypad-and-speech. The clinical truth underneath is identical.

This is the *handshake*: a feature-phone interaction surfaces to the same cloud AI, the same clinician panel, and the same record. A patient who uses Track B today and gets a smartphone next year continues their care without a data migration — they simply log in with their existing phone number.

### 2.3 The village-user scenario (illustrative)

A 58-year-old farmer in the Ashanti region has hypertension. He has a feature phone, a market stall, and a daughter in Kumasi who has a smartphone.

**Today (without Track B):** He buys his medication monthly from a roadside drug seller. He has no idea whether his blood pressure is controlled. He has not seen a clinician in two years. He pays cash to whoever has the medication that day, which may or may not be authentic. If he has a stroke, his family will not know what medications he was on.

**With Track B operational:** He dials `*123#` from his feature phone. The Telecheck USSD menu appears in Twi. He selects "refill my medicines." The system recognizes him by his MTN number (linked to a Telecheck account his daughter set up). It tells him his last refill is due. He confirms. The request enters the same clinician review queue as a smartphone patient's refill. A clinician in Accra reviews it, including the medication interaction engine signals. The clinician approves. The system calls him back with an AI voice agent in Twi: "Kwame, your refill has been approved. The medication will be at your usual pharmacy on Tuesday. Press 1 to confirm pickup, press 2 to ask a question." He presses 2 and speaks his question. The AI either answers from the Mode 1 guardrails or hands off to a Twi-speaking clinician over a callback. His record updates. His daughter sees the activity in her delegate view of his account on her smartphone.

That is the experience this document is the brief for.

### 2.4 What this is not

- Not a parallel Telecheck product. Same platform, same record, different interaction surface.
- Not a replacement for the launch product. Track A continues to be the higher-volume, higher-margin path.
- Not a low-functionality fallback. USSD/voice is the primary interaction mode for Track B patients, designed to be excellent in its own right.
- Not free. Track B has its own unit economics — likely lower per-patient revenue than Track A, but with a different cost structure (no app development cost per patient, no smartphone dependency, sponsorship/donor funding accessible).
- Not a launch capability. Telecheck launches Track A first, validates the platform under live operation, then sequences Track B.

---

## 3. Capabilities in scope for Track B

The following capabilities are intended for Track B. Not all need to ship simultaneously — they sequence in waves.

### 3.1 Wave 1 — USSD-initiated workflows

**Identity and account access.** Patient dials a short code (e.g., `*123#`). System recognizes the patient by phone number (linked to a pre-existing Telecheck account, created either by the patient earlier through any channel or by a delegate on their behalf — see §3.6). New patients are guided through a USSD-driven account creation flow.

**Refill request.** USSD menu lists the patient's active medications. Patient selects, confirms. Request enters the same clinician/protocol review queue as a smartphone refill. Status updates delivered via SMS in the patient's preferred language.

**Refill status check.** Patient dials in to check on a pending refill. System reads back current status in plain language (translated by SMS / read by AI voice agent on callback).

**Appointment booking.** Patient selects "see a doctor." System asks symptom category via numbered menu, books a consult, sends SMS confirmation, and triggers an AI voice callback to complete intake.

**Lab result delivery.** Patient asks "are my results back?" System reads back interpretation summary via SMS or schedules a voice callback to explain results in their language.

**Emergency.** Patient dials in, selects "emergency." System reads back local emergency numbers and the nearest facility, and triggers an outbound voice call to a clinician on-call.

### 3.2 Wave 2 — AI voice agent inbound and outbound

**Outbound AI voice for status and engagement.** When a smartphone patient receives a WhatsApp notification, a Track B patient receives an AI voice call in their preferred language. "Kwame, your refill has been approved..." Voice content is generated by the same Mode 1 model with a voice-output guardrail template specifically tuned for clarity, brevity, and confirmability over voice.

**Inbound AI voice agent for clinical conversation.** Patient dials a short code or returns a callback. AI voice agent answers in the patient's language. Patient describes their concern. AI either:
- Answers from Mode 1 conversational scope (medication explanation, dose timing, side-effect education)
- Triggers a workflow (refill, consult booking, lab review)
- Escalates to a human clinician callback for clinical decision-making
- Triggers crisis escalation if crisis-detection fires

**Clinical guardrails are identical to app-Mode-1 guardrails.** A voice AI cannot do what a chat AI cannot do. The platform floor applies fully — no diagnosis, no specific dosing outside care relationship, crisis detection always-on, full attribution audit.

**Voice transcription is the audit record.** Voice calls are transcribed in real time. The transcript is the record (same model as sync video AI scribe). Audio is not retained at launch of Track B; transcripts are retained per audit retention rules.

### 3.3 Wave 3 — Adherence and RPM via SMS

**Daily SMS adherence prompts.** "Hi Kwame, did you take your blood pressure medication today? Reply Y or N." Replies parsed and recorded as adherence data. Pattern detection triggers nudges, escalation to clinician outreach, or program adjustment.

**SMS-based RPM input.** Patients with a manual blood pressure cuff or glucometer can SMS their reading to a short code: "BP 145 92 70." Parsed into structured RPM data, fed to the same alert engine that the smartphone app uses. Critical values trigger AI voice callback or clinician outreach.

**Reminder notifications.** Refill due, appointment in two hours, lab needed for upcoming refill — all delivered via SMS in the patient's language.

### 3.4 Wave 4 — Voice consult

**AI voice triage to clinician voice consult.** Patient dials in, AI agent gathers structured intake conversationally over voice (in their language), and books an audio-only consult with a clinician. The consult is conducted by phone call — no video, no app. Clinician sees the AI-prepared intake summary in their portal, conducts the call, documents the decision. The patient receives an SMS summary post-call.

This is functionally identical to sync audio-only consults today (Sync Video Slice §7) but accessed via voice/USSD rather than app booking.

### 3.5 Wave 5 — Pharmacy handoff and last-mile

**Pharmacy code delivery.** Approved refills generate a USSD-retrievable pickup code. Patient shows the code at the partner pharmacy or community health worker (CHW) drop-point. The CHW network becomes a critical Track B distribution layer for areas without delivery coverage.

**CHW-mediated delivery.** Where last-mile delivery is impractical, partner CHWs collect medications from a regional hub and deliver to patients in their catchment. CHW activity is tracked in the platform under a new actor type (`chw`) with appropriate RBAC.

**Cash payment at pickup.** Mobile money is dominant in Ghana but not universal. Track B accepts cash payment at pickup, recorded by the CHW or pharmacy, reconciled in the platform. Payment is not a gate for medication release where program funding (donor, public-health, insurance) covers the patient.

### 3.6 Track A delegation into Track B

A Track A user (smartphone, app) can act as a delegate for a Track B user (feature phone, USSD/voice). The most common scenario:

- Adwoa (Track A, Accra) creates a Telecheck account for her father Kwame (Track B, rural Ashanti) using his phone number
- She acts as his delegate via the app's standard delegation overlay
- He accesses his own care via USSD/voice with no app required
- Both surfaces hit the same patient record
- Notifications fan out: Adwoa receives WhatsApp, Kwame receives SMS or AI voice callback
- Adwoa can pay for Kwame's care via her mobile money
- Sensitive-category default-hidden delegation rules apply identically

This makes Track B accessible to patients who would never set up a digital health account themselves — the family creates the bridge.

---

## 4. Architecture concept

### 4.1 The interaction-surface adapter pattern

The Telecheck core platform (clinicians, AI, protocols, audit, data) is unchanged. Two new modules adapt the core to feature-phone surfaces:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TELECHECK CORE PLATFORM                       │
│  (Clinical Intelligence, Care Delivery, AI Service, Audit, etc.)     │
└────────────┬────────────────────────────────────────┬───────────────┘
             │                                        │
             │                                        │
   ┌─────────▼─────────┐                  ┌──────────▼──────────┐
   │ App / WhatsApp    │                  │ USSD / Voice / SMS  │
   │ Adapter (existing)│                  │ Adapter (new)       │
   └─────────┬─────────┘                  └──────────┬──────────┘
             │                                       │
             ▼                                       ▼
   ┌───────────────────┐                  ┌─────────────────────┐
   │ Smartphone        │                  │ Feature phone       │
   │ Patient (Track A) │                  │ Patient (Track B)   │
   └───────────────────┘                  └─────────────────────┘
```

The USSD/Voice/SMS adapter is one new module in the System Architecture v1.0 module list (16 instead of 14). Its responsibilities:

- Mobile network operator (MNO) integration for USSD short-code session handling
- AI voice gateway integration (text-to-speech, speech-to-text, telephony)
- SMS gateway integration (inbound parsing, outbound delivery)
- Channel-appropriate rendering of platform state (a refill status becomes a USSD menu, an SMS string, or a voice utterance depending on the channel)
- Channel-appropriate intake (a USSD numeric menu, an SMS reply, or a voice conversation, all producing the same structured intake data the Forms/Intake Engine already accepts)

### 4.2 Identity and account model

A Telecheck account is identified by phone number (already true in Track A). Track B uses the same identity. A patient who dials in from `+233-XX-XXX-XXXX` is recognized as the owner of the account linked to that number. Identity verification at first USSD use is a one-time PIN flow over USSD (the patient sets a 4-digit PIN that they enter on subsequent sessions to confirm identity).

For Track B patients with shared SIMs (real in some rural contexts), the PIN provides personal identification beyond the SIM. For Track B patients without a personal phone (using a community phone), session-level identity is established by PIN; the system recognizes the patient regardless of which device they dial from.

### 4.3 Language as a per-patient setting

Patient language preference is a profile setting set at account creation (or default-inferred from the patient's locality if known). The setting affects:

- USSD menu language
- AI voice agent language (voice synthesis and speech recognition both target the patient's language)
- SMS content language
- The patient-facing copy in the smartphone app (if the patient also uses Track A)

Languages supported in Track B at minimum: English, Twi, Akan, Ga, Ewe. Hausa and Pidgin in subsequent waves. Language coverage is staged — first launch of Track B may be a subset of these.

This is the home for the multilingual coverage work originally tracked as OR-105 in the Operational Readiness tracker. OR-105 is **resolved for Track A** (English-only) and **opened in this document** as a primary work area for Track B.

### 4.4 Crisis detection across voice

Crisis detection (FLOOR-021, I-019) extends to voice transcription in real time. The same crisis-detection model that monitors text chat in Mode 1 monitors transcribed speech in voice sessions. Detection in voice triggers the same response: crisis resources surfaced (read back to the patient over voice), safety team notified, audit logged.

Voice-specific crisis detection requires multilingual coverage of crisis vocabulary — not just keywords but the full conversational recognition of distress in the languages the platform supports for voice. This is a non-trivial work area and is part of why Track B sequences in waves.

### 4.5 Audit and attribution

Every Track B interaction produces audit records identical in structure to Track A. The audit envelope adds two fields:
- `interaction_surface` — `app` | `whatsapp` | `ussd` | `voice` | `sms`
- `surface_session_id` — the USSD session, voice call, or SMS thread identifier

A clinician reviewing a refill audit sees that the request originated from a USSD session, can see the voice transcript if any AI voice interaction preceded the request, and can see all SMS exchanged. The audit is unified across surfaces.

---

## 5. Operational requirements

### 5.1 MNO partnerships

USSD short codes require commercial agreements with each major Ghanaian MNO (MTN, Vodafone, AirtelTigo). These are not technical integrations only — they are commercial contracts with specific revenue-share, SLA, and support terms. Establishing these is a 6–12 month timeline pre-launch of Track B.

### 5.2 Voice infrastructure

Telephony infrastructure (PSTN integration, call routing, recording-for-transcription) is operationally distinct from the WebRTC video infrastructure used in Track A. A separate vendor selection or in-house build is required.

### 5.3 SMS gateway scale

SMS scale for Track B (potentially tens of thousands of patients receiving daily reminders, reading back lab results, replying with adherence data) exceeds Track A's SMS use (primarily critical fallback). A different commercial SMS arrangement is required.

### 5.4 AI voice agent governance

The voice agent is a Mode 1 surface, governed by guardrail templates. But voice has different failure modes than text:
- The patient cannot easily re-read what the AI said
- Tone and inflection carry meaning the AI must control deliberately
- Background noise affects transcription accuracy and therefore intent detection
- A misheard "yes" to a refill confirmation is a real safety risk

Voice-specific guardrail templates are required, with their own test suites covering: clarity of speech, repeatability ("I didn't catch that — can you say it again?"), confirmation flows for any state-changing action, graceful escalation when transcription confidence is low.

### 5.5 CHW network design

If CHW-mediated delivery is part of Track B, the CHW network is operationally significant: recruitment, training, equipment (smartphone or feature phone for CHW use), supervision, payment, accountability. This is a substantial pre-launch operational build for Track B, not a small adapter.

### 5.6 Regulatory considerations

Track B introduces regulatory questions Track A does not face cleanly:
- Voice consultations may have different MDC requirements than text/video consultations
- USSD payment flows touch financial regulations (Bank of Ghana mobile-money rules)
- AI voice agent providing medication information falls under different consumer-protection lenses than AI chat
- CHW-mediated medication handling may require Pharmacy Council approvals beyond standard pharmacy partner arrangements

A Track B regulatory submission is a separate body of work from the Track A regulatory work tracked in OR-101 through OR-104.

---

## 6. Sequencing and dependencies

Track B cannot begin development until Track A is operational and stable in Ghana. Specifically:

- Track A in Limited Launch or Full Launch state (per Cockpit §4.3)
- Three months of operating evidence from Track A
- Clinical safety case for Track A validated by live operation
- AI Mode 1 guardrail templates tuned and stable
- Crisis detection performance validated in production

Once Track A is stable, Track B sequences in the waves listed in §3. Each wave is independently shippable. The full Track B vision is multi-year work.

A reasonable initial sequence:

1. **Track B Wave 1 (USSD-initiated workflows for refills + status check)** — 6 months after Track A Limited Launch
2. **Track B Wave 2 (AI voice agent outbound for status, then inbound for conversation)** — 12 months after Track A Limited Launch
3. **Track B Wave 3 (SMS adherence and RPM)** — 12–15 months after Track A Limited Launch
4. **Track B Waves 4 and 5** — 18+ months, sequenced by partnership readiness (CHW network, sponsored programs, MNO terms)

---

## 7. Open questions for Track B PRD authorship

When a future PRD for Track B is authored, the following open questions need resolution:

1. **MNO commercial model.** Does Telecheck pay per-USSD-session, share revenue with MNOs, or operate under a managed MNO partnership? Different markets have different norms.
2. **AI voice provider selection.** Who provides telephony, text-to-speech, and speech-to-text in Twi, Akan, Ga, Ewe? Are these capabilities available at clinical-grade quality from existing vendors, or does Telecheck need to invest in voice model fine-tuning?
3. **CHW network ownership.** Does Telecheck recruit and operate its own CHW network, partner with existing CHW programs (NGO, public health, pharmaceutical-funded), or both depending on the area?
4. **Sponsored-care commercial model.** Track B's economics likely require subsidization for lower-income patients. Sources include: NGO grants, donor funding, public-health partnerships, pharmaceutical company chronic-disease programs, employer partnerships. Which is the primary funding model at Track B launch?
5. **Track A → Track B handoff at scale.** When millions of phone numbers are in use across Ghana, how does the platform handle: phone number recycling (old number reassigned to new owner), dual-SIM patients, patients sharing a community phone? The identity model needs hardening for the operating reality.
6. **Audio retention policy.** Voice transcripts are retained as audit. Audio is not retained at Track B launch. When (if ever) is audio retention added, and under what consent and storage model? Required for clinical-quality investigation of transcription errors but raises new privacy considerations.
7. **AI voice guardrail testing methodology.** Voice-specific guardrails require voice-specific test suites. What is the testing methodology, who develops the test cases, and what is the pass criterion? Voice is harder to test than text.

---

## 8. Items moved into this scope from the launch tracker

The following items from the Operational Readiness To-Do v1.0 are deferred from launch and tracked here instead:

| Original ID | Title | Disposition |
|---|---|---|
| OR-105 | Multilingual coverage spec (crisis detection, guardrails, moderation Layer 1) | **Resolved for Track A by ADR-018 (English-first).** Carried into this Track B scope as primary work area. |

If additional Operational Readiness items are deferred to Track B during future review, they are appended here.

---

## 9. Items added to the launch tracker by the existence of this document

The following Track-A items are added to the Operational Readiness To-Do v1.0 because Track B's success depends on Track A being able to support it:

| Proposed ID | Title | Tier | Why |
|---|---|---|---|
| OR-228 | Identity model evolution plan — phone-number-as-identity at scale, including SIM recycling, shared phones, community-phone use | 2 | Track B amplifies identity-model edge cases; Track A should not adopt assumptions that close off the Track B path. |
| OR-229 | Audit envelope `interaction_surface` field | 2 | Adding a field after the audit chain is in production is harder than adding it at launch; the field can be present and `app`-only at Track A launch. |
| OR-230 | RBAC actor type `chw` reservation | 3 | Reserve the actor type now to avoid name collisions later. |

---

## 10. What this document is and is not

**This is:** A strategic concept and brief for a future PRD. It captures the intent, the architecture sketch, the operational shape, and the open questions. It is enough to ensure Track A launch decisions do not foreclose Track B.

**This is not:** A PRD. A future Track B PRD will be authored when Track A is stable and Track B sequencing begins. That PRD will resolve the open questions, define the slice structure, and produce the engineering, design, and operations artifacts needed to build Track B.

**This is not:** A commitment to build. The decision to build Track B in any given wave is a business decision based on: Track A operating performance, available funding, partnership readiness, and regulatory clarity. This document supports that decision; it does not preempt it.

---

## Document control

- **v0.1** — Initial future-scope concept for the USSD + AI Bridge as a second access track to the Telecheck platform. Captures strategic narrative, capability waves, architecture concept, operational requirements, and open questions. Ratified through the same session as ADR-018 (English-first launch posture) and the resolution of OR-105.
- **Next review:** when Track A reaches Limited Launch state in Ghana (Cockpit §4.3) and the conversation about Track B sequencing becomes timely.
- **Change discipline:** This is a future-scope document. Updates capture refinements to the strategic intent or architecture concept. Detailed PRD-level work happens in the future Track B PRD set, not here.
