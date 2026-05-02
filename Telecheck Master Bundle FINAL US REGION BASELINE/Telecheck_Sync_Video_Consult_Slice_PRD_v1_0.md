# Telecheck — Synchronous Video Consult Slice PRD

**Version:** 1.0
**Status:** Canonical for development
**Owner:** Synchronous Care Lead
**Parent document:** Telecheck Master Platform PRD v1.10, §10 Pillar 1, §11.1, §12
**Companion documents:** Async Consult Slice PRD v1.0, AI Clinical Assistant Slice PRD v1.0, Forms/Intake Engine Slice PRD v1.0, Medication Interaction & Validation Engine Slice PRD v1.0, Pharmacy Portal Slice PRD v1.0, Consent & Delegated Access Slice PRD v1.0

---

## 1. Purpose and strategic role

Sync video is where the patient meets the doctor. It is the modality that most closely resembles traditional clinical care, and the one that builds the deepest trust. Async consult is efficient and scalable; sync video is personal and relationship-building. Both are necessary.

Sync video serves cases that async cannot: complex clinical presentations requiring observation and dialogue, patient preference for live interaction, follow-up conversations where tone and nuance matter, emotional discussions (chronic disease impact, treatment changes, difficult diagnoses), and cases escalated from async when the clinician needs to see and speak with the patient.

The full sync video flow — doctor search, profile, availability, booking, payment, pre-call device check, waiting room, live video, transcript/scribe, and post-visit summary — is a launch-readiness criterion (Master PRD §12). It must function end to end at launch.

This slice defines the complete journey from the patient's decision to see a doctor live through the post-visit follow-up.

---

## 2. Traceability

| Master PRD reference | This slice addresses |
|---|---|
| §8 Job 4 — Consult a clinician synchronously | End-to-end sync video workflow |
| §10 Pillar 1 — Telehealth care delivery | Sync video as a first-class care modality |
| §11.1 Launch scope — Synchronous video consult | Pre-call readiness, video room, transcript/scribe, post-visit summary |
| §11.4 Critical-path subset | Sync video is 30-day-tolerant (can follow async launch by 2–4 weeks) |
| §12 Launch readiness — Full synchronous video flow | End-to-end launch-readiness criterion |
| §18 Business model — Consultation fees | Per-visit patient-pay |

---

## 3. Actors

| Actor | Role in this workflow |
|---|---|
| **Patient** | Books the consult, completes pre-visit intake, joins the video call, receives post-visit summary and follow-up. |
| **Delegate** | May book on behalf of the patient (book-consults scope). May attend the consult as an observer (attend-consults scope) with patient notification. Cannot attend without the scope grant. |
| **Clinician** | Conducts the live video consultation. Reviews pre-visit preparation, examines the patient (visual/conversational), makes clinical decisions, documents the visit. |
| **AI Clinical Assistant (Mode 1)** | Assists the patient pre-visit (explains what to expect, helps prepare questions). Assists post-visit (explains the summary, answers follow-up questions). Does not participate in the live video call. |
| **AI scribe** | During the call, generates a real-time transcript and structures it into a clinical summary. The clinician reviews and approves the scribe output post-visit. |
| **Medication Interaction & Validation Engine** | Runs at prescribing time during or after the consult if the clinician prescribes. |
| **Pharmacy Portal** | Receives approved prescriptions from sync consult decisions. |

---

## 4. Sync video workflow

### 4.1 Step 1 — Discovery and booking

**Finding a doctor.** The patient can find a clinician through:
- **Doctor search.** Browse available clinicians by specialty, program, language, availability, and rating. Each clinician has a profile showing: name, photo, credentials, specialties, programs served, languages spoken, patient rating (aggregate), and a brief bio.
- **Program recommendation.** When a patient is in a managed program, the platform recommends clinicians associated with that program.
- **Continuity preference.** If the patient has seen a clinician before, that clinician appears first ("See Dr. [Name] again").
- **Async escalation.** When an async consult is escalated to sync (Async Consult Slice §5.5), the escalating clinician is offered as the default. If unavailable, other program-qualified clinicians are shown.
- **AI Clinical Assistant.** Mode 1 can help: "I think you should talk to a doctor about this. Would you like me to help you book a video visit?"

**Selecting a time.** The patient sees the clinician's available time slots:
- Displayed in the patient's local timezone
- Slot duration shown (standard: 15 minutes for follow-up, 30 minutes for new consult — configurable per program)
- Next available slot highlighted
- Multiple days visible for scheduling flexibility

**Booking confirmation.** The patient confirms the booking:
- Clinician name and photo
- Date, time, and duration
- Consult fee displayed upfront
- Payment collected at booking (or at call start — market-configurable)
- Confirmation sent via in-app + WhatsApp: "Your video visit with Dr. [Name] is confirmed for [date] at [time]."

### 4.2 Step 2 — Pre-visit preparation

Between booking and the consult, the patient completes pre-visit preparation:

**Pre-visit intake.** A lightweight intake form (subset of the consult intake template — Forms Slice §9.4) that captures:
- Reason for visit (if not already captured from async escalation or booking context)
- Medication and herbal medicine update (quick confirmation)
- Specific questions the patient wants to ask ("What do you most want to discuss?")
- Recent changes since last visit (if returning patient)

The intake is optional but encouraged. A nudge is sent 2 hours before the appointment: "Your video visit is in 2 hours. Take a moment to prepare — it helps your doctor help you." The nudge links to the intake form.

**Clinician preparation.** Before the call, the clinician sees:
- Pre-visit intake (if completed)
- Patient profile: medication list, conditions, allergies, herbal medicines, recent labs, RPM data (if enrolled), consult history, refill history
- AI-prepared summary: Mode 1 compiles the patient's pre-visit intake, recent health activity, active interaction signals, and pending alerts into a concise clinician-facing brief
- Async escalation context: if converted from async, the full async intake, Mode 2 summary, and escalation reason carry forward
- Delegate context: if a delegate booked or will attend

### 4.3 Step 3 — Pre-call device check

5 minutes before the appointment, the patient is prompted to complete a device check:
- Camera test (can the patient see themselves?)
- Microphone test (can the patient hear audio and speak?)
- Network quality indicator (sufficient bandwidth for video?)
- Browser/app compatibility confirmation

**If the device check fails:**
- Camera failure: offer audio-only consult as fallback. The clinician is notified.
- Microphone failure: cannot proceed with the consult. The patient is offered rescheduling or async consult conversion.
- Network quality poor: warn the patient. Offer to proceed with potential quality issues or reschedule. If network is too poor for any call, offer async conversion.

The device check is lightweight — under 30 seconds. It prevents the frustrating experience of joining a call only to discover the camera doesn't work.

### 4.4 Step 4 — Waiting room

After the device check, the patient enters the waiting room:
- "Dr. [Name] will be with you shortly" with the clinician's photo
- Estimated wait time (if the clinician is running late)
- Tips: "Make sure you're in a quiet, well-lit place" / "Have your medications nearby in case the doctor asks"
- Emergency exit: "If this is an emergency, call [emergency number]" — persistent, accessible
- The patient can review their pre-visit intake while waiting

**If the clinician is late:**
- Under 5 minutes: no notification, normal variance
- 5–10 minutes: "Dr. [Name] is running a few minutes behind. Thank you for your patience."
- Over 10 minutes: the patient is offered the choice to continue waiting, reschedule, or convert to async
- Over 15 minutes without clinician joining: the patient is offered a full refund and rescheduling with priority booking

**If the patient is late:**
- The clinician waits up to 10 minutes. After 10 minutes, the clinician can close the slot.
- The patient is notified: "Your doctor waited for you but the appointment time has passed. Would you like to reschedule?"
- No-show fee policy is configurable per market (recommend: no fee for first no-show, fee for repeated no-shows)

### 4.5 Step 5 — Live video

The patient and clinician are in the video call.

**Video interface features:**
- Full-screen video with picture-in-picture self-view
- Mute/unmute audio
- Camera on/off
- Screen share (clinician can share lab results, care plan, educational materials)
- Chat sidebar (text messaging within the call — useful for sharing links, spelling medication names, or when audio is unclear)
- Timer showing elapsed time and remaining time
- End call button

**AI scribe (runs during the call):**
- Real-time speech-to-text transcription (visible to the clinician in a side panel, not visible to the patient during the call)
- The scribe structures the transcript into a draft clinical summary as the conversation progresses
- The scribe identifies clinical entities: medications mentioned, symptoms described, lab values discussed, decisions expressed
- The scribe does not intervene in the conversation — it is a passive recorder and organizer

**What the AI scribe does not do:**
- Does not speak or display prompts to the patient
- Does not make clinical suggestions to the clinician during the call (this is different from Mode 2 — the scribe captures, it does not recommend)
- Does not record video — only audio-to-text transcription
- Does not transmit the transcript to anyone other than the clinician during the call

**Delegate attendance:**
- If a delegate with attend-consults scope joins the call, they appear as a named participant: "[Delegate name] — attending on behalf of [patient name]"
- The patient is notified that the delegate has joined (even if the patient knows — the notification confirms the system recognized the delegate)
- The clinician sees the delegate context throughout the call
- The delegate can hear and speak but cannot share their screen or access the scribe panel

**Connectivity issues during the call:**
- If video quality degrades: automatic switch to audio-only with notification to both parties
- If audio drops: "Connection lost — attempting to reconnect" with automatic reconnection for 60 seconds
- If reconnection fails: the call ends. Both parties are notified. The clinician can call the patient back or the patient can rejoin.
- If the call drops and cannot be recovered: the consult is marked as interrupted. The clinician completes the post-visit summary with what was discussed. The patient is offered a free follow-up call or async completion.

### 4.6 Step 6 — Post-visit summary

After the call ends, the clinician reviews the AI scribe's draft summary.

**Clinician post-visit workflow:**
1. Review the scribe-generated draft summary
2. Edit, correct, or supplement the summary (the scribe's draft is a starting point, not a finished product)
3. Add clinical decisions: prescriptions, lab orders, referrals, follow-up plan
4. If prescribing: interaction engine and herb-drug engine checks run (same as async prescribing — Async Consult Slice §5.5)
5. Finalize and sign the summary
6. The signed summary is the official clinical record of the visit

**Summary structure:**
- Chief complaint
- History of present illness (from the conversation)
- Relevant medical history reviewed
- Medications and herbal medicines discussed
- Examination findings (visual observations, patient-reported symptoms)
- Assessment (clinician's clinical impression)
- Plan (prescriptions, lab orders, referrals, follow-up, patient education, lifestyle recommendations)
- Follow-up timeline

**Post-visit summary for the patient:**
The patient receives a patient-facing version of the summary:
- Written in patient-appropriate language (not the clinician's clinical note verbatim)
- Key takeaways: what the doctor said, what was decided, what happens next
- Prescriptions: medication name, why it was prescribed, how to take it, what to watch for
- Lab orders: what labs are needed, where to get them, when
- Follow-up: when to come back, what to monitor, when to seek immediate care
- "Have questions?" → opens Mode 1 pre-seeded with the consult context

The patient-facing summary is delivered via in-app + WhatsApp notification within 2 hours of the call ending (target: within 30 minutes).

### 4.7 Step 7 — Follow-up

Post-visit follow-up follows the same model as async consult follow-up (Async Consult Slice §11):
- Follow-up messaging included for 7 days post-visit
- Follow-up nudges for labs, medications, and scheduling
- RPM enrollment prompt if the clinician recommended monitoring

---

## 5. Clinician scheduling

### 5.1 Availability management

Clinicians manage their availability through the clinician portal:
- Set recurring availability blocks (e.g., "Mondays 9am–12pm, Wednesdays 2pm–5pm")
- Set one-time availability or unavailability
- Slot duration configuration (15-minute or 30-minute slots)
- Buffer time between appointments (configurable, recommend 5 minutes minimum)
- Maximum daily consults cap (prevents burnout)

### 5.2 Scheduling rules

- Patients can only book into published availability slots
- Minimum booking lead time: 1 hour (patients cannot book a consult starting in 5 minutes — clinician needs preparation time)
- Maximum booking lead time: 30 days (patients can book up to a month in advance)
- Cancellation policy: free cancellation up to 2 hours before the appointment. Late cancellation (under 2 hours) may incur a cancellation fee (market-configurable). No-show policy per §4.4.

### 5.3 Continuity of care

When a patient has seen a clinician before:
- That clinician appears first in search results and booking suggestions
- If the same clinician is not available, the patient sees why ("Dr. [Name] is not available this week") and is offered alternatives
- The new clinician sees the full consult history from previous clinicians (with the patient's consent)
- Continuity preference is a system setting, not a hard lock — the patient can always choose a different clinician

---

## 6. Prescribing during sync consult

Prescribing during or after a sync consult follows the same safety model as async prescribing:

1. Clinician selects medication from formulary
2. Interaction engine runs all five check classes
3. Herb-drug engine runs if the patient has reported herbal medicines
4. Signals displayed to the clinician before confirmation
5. If critical or major signals: clinician must acknowledge or override with rationale
6. Prescription is confirmed and flows to the Pharmacy Portal
7. The patient sees the prescription in their post-visit summary

The prescribing flow is accessible from the post-visit summary editing screen. The clinician does not prescribe during the live call (the call is for clinical conversation; prescribing is a post-call documentation action). This ensures the interaction engine check runs before the prescription is finalized, and the clinician is not rushing to prescribe while the patient is waiting on video.

---

## 7. Audio-only fallback

When video is not available (camera failure, very low bandwidth, patient preference):
- The consult proceeds as audio-only
- The AI scribe still operates (speech-to-text works on audio)
- The post-visit summary notes "Audio-only consult" for clinical context
- The clinician sees the patient's profile and photos (if any) from the health record for visual context
- Same clinical authority — audio-only consults are clinically valid
- Same fee — audio-only does not reduce the consult fee (the clinical value is in the clinician's time and expertise, not the video technology)

---

## 8. Payment model

**Per-visit, patient-pay.** Same model as async consult (Async Consult Slice §6):
- Fee displayed upfront at booking
- Payment collected at booking (or at call start — market-configurable)
- Program-specific pricing (may differ from general consult pricing)

**Refund policy:**
- Clinician no-show (over 15 minutes without joining): full refund + priority rebooking
- Patient cancels 2+ hours before: full refund
- Patient cancels under 2 hours: cancellation fee (market-configurable, recommend 50% of consult fee)
- Patient no-show: no refund (first no-show may be waived as goodwill)
- Call interrupted by technical failure and cannot be completed: full refund or free follow-up call (patient's choice)
- Async-to-sync conversion: single fee applies (Async Consult Slice §9.6)

**Delegate payments:** A delegate with make-payments scope can pay the consult fee on the patient's behalf.

---

## 9. Transcript and recording policy

### 9.1 What is recorded

- **Audio transcript:** The AI scribe produces a text transcript from the audio. The transcript is stored as part of the clinical record.
- **Video/audio recording:** Video and audio are **not recorded** at launch. The transcript is the record of the conversation. Full audio/video recording is a post-launch capability that requires explicit consent beyond standard care consent, and storage/privacy implications must be resolved per market.

### 9.2 Transcript access

- **Clinician:** Full transcript access for post-visit summary creation. Transcript is stored with the clinical record.
- **Patient:** Does not see the raw transcript. The patient sees the clinician-approved post-visit summary (patient-facing version). The patient can request the full clinical note (including transcript-derived content) through a data access request.
- **Delegate with attend-consults scope:** Sees the patient-facing post-visit summary. Does not see the raw transcript.
- **Audit:** Transcript is retained as a clinical record per data retention policy.

### 9.3 Consent for transcription

The patient's care consent (Consent Slice §5.2) covers AI-assisted transcription and summary generation as part of the clinical care service. At the start of the call, a brief notice is displayed: "This consultation is being transcribed by our AI assistant to help your doctor create your visit summary." This is informational, not a separate consent step — the consent was captured at program enrollment.

---

## 10. Edge cases

### 10.1 Emergency during the call

If the clinician identifies a medical emergency during the video call:
- The clinician verbally directs the patient to call emergency services immediately
- The clinician triggers the emergency escalation pathway through the call interface (one button)
- The platform sends emergency contact information to the patient via all channels simultaneously
- The call is documented as an emergency encounter
- The clinician documents emergency findings in the post-visit summary
- The event feeds the Adverse Event Reporting system

### 10.2 Safeguarding concern

If the clinician observes signs of abuse, neglect, or safeguarding concern during the call:
- The clinician follows the safeguarding protocol (documenting concerns, reporting to appropriate authorities)
- If a delegate is on the call and is the subject of the concern, the clinician has the ability to remove the delegate from the call
- Safeguarding notes are marked as clinician-restricted and are not visible to delegates (Consent Slice §6.4)
- The safeguarding concern is logged in the clinical record and reported per regulatory requirements

### 10.3 Patient in a different jurisdiction than expected

If the patient is physically in a different jurisdiction than their registered location during the call (e.g., traveling):
- The clinician's prescribing authority may be affected by the patient's current physical location
- At launch, the platform does not verify real-time patient location during the call
- The clinician is expected to ask where the patient is if jurisdiction-sensitive care is being provided (prescribing controlled substances, issuing certain referrals)
- Cross-jurisdictional prescribing rules are governed by v5 Contracts Pack per market

### 10.4 Minor patient with parent attending

When the patient is a minor and a parent-of-minor delegate is attending:
- The clinician may need to speak with the minor privately (age-appropriate screening for abuse, mental health, reproductive health)
- The clinician can request the delegate leave the call temporarily ("I'd like to speak with [minor's name] privately for a moment")
- The delegate can rejoin when the clinician indicates
- Private portions of the conversation are documented in the clinical record but may be marked as clinician-restricted per safeguarding protocols

---

## 11. States and transitions

| State | Description | Next state |
|---|---|---|
| **Searching** | Patient browsing clinicians and availability | Booking |
| **Booking** | Patient selecting slot and confirming payment | Booked |
| **Booked** | Appointment confirmed; pre-visit period | Pre-Visit / Cancelled |
| **Pre-Visit** | Patient completing pre-visit intake and device check | Ready |
| **Ready** | Device check passed; patient in waiting room | In Call / No-Show |
| **Cancelled** | Patient or clinician cancelled before the call | Refund Processing |
| **No-Show** | Patient did not join within 10 minutes of start time | Closed |
| **In Call** | Live video (or audio-only) in progress | Post-Visit / Interrupted |
| **Interrupted** | Call dropped and could not be reconnected | Post-Visit (partial) / Rescheduled |
| **Post-Visit** | Clinician completing post-visit summary and actions | Summary Delivered |
| **Summary Delivered** | Patient-facing summary sent to patient | Follow-Up / Completed |
| **Follow-Up** | Post-visit follow-up period (messaging, lab tracking) | Completed |
| **Completed** | Visit concluded, all documentation finalized | — |

---

## 12. Audit

| Event | What is recorded |
|---|---|
| Clinician searched | Patient ID, search filters used, clinicians displayed, timestamp |
| Booking created | Patient/delegate ID, clinician ID, slot time, duration, fee, payment status, timestamp |
| Pre-visit intake submitted | Template ID, field values, timestamp |
| Device check completed | Camera/mic/network status, fallback decisions, timestamp |
| Waiting room entered | Patient ID, timestamp, wait duration |
| Call started | Patient ID, clinician ID, delegate ID (if attending), call mode (video/audio-only), timestamp |
| Call ended | Duration, end reason (normal/interrupted/emergency), timestamp |
| Transcript generated | Transcript hash, scribe version, timestamp |
| Post-visit summary created | Clinician ID, summary content hash, prescriptions (if any), lab orders (if any), referrals (if any), follow-up plan, timestamp |
| Summary delivered to patient | Delivery channel, timestamp |
| Prescription created | Same audit as async prescribing (Async Consult Slice §13) |
| Cancellation | Canceller (patient/clinician/delegate), reason, refund amount, timestamp |
| No-show | Which party, timestamp |
| Emergency triggered | Trigger reason, actions taken, escalation destination, timestamp |

---

## 13. Metrics

**Booking and access**
- Booking volume per day/week
- Average time to next available slot (access measure — how long does a patient wait to see a doctor?)
- Booking-to-completed-visit rate (how many bookings result in a completed visit?)
- Cancellation rate (patient-initiated vs clinician-initiated)
- No-show rate (patient vs clinician)
- Continuity rate (% of visits where the patient sees a previously-seen clinician)

**Visit quality**
- Average visit duration
- Device check pass rate
- Audio-only fallback rate (how often does video fail?)
- Call interruption rate and recovery rate
- Post-visit summary delivery time (target: under 30 minutes)
- Patient satisfaction score (post-visit survey)
- Prescription rate per visit
- Interaction signal override rate at prescribing

**Clinician efficiency**
- Clinician utilization rate (booked slots / available slots)
- Average time between appointments (buffer compliance)
- Post-visit documentation time (clinician time from call end to summary finalization)
- Scribe accuracy (how much does the clinician edit the scribe draft — calibration signal)

**AI scribe**
- Transcript accuracy (word error rate if measurable)
- Summary draft acceptance rate (% of scribe drafts the clinician accepts with minor edits vs major rewrites)
- Entity extraction accuracy (did the scribe correctly identify medications, symptoms, decisions mentioned?)

**Commerce**
- Revenue per sync consult
- Refund rate
- Cancellation fee collection rate
- Async-to-sync conversion rate

---

## 14. Dependencies

- **Identity & Authentication Spec v1.0.** Authenticated patient, clinician, pharmacist, moderator, admin, and delegate sessions are required for every actor surface this slice uses.
- **Async Consult Slice.** Async-to-sync conversion carries forward intake data and AI preparation.
- **Forms/Intake Engine Slice.** Pre-visit intake form rendered by the intake engine.
- **AI Clinical Assistant Slice.** Mode 1 assists pre and post-visit. AI scribe (distinct from Mode 1/Mode 2) operates during the call.
- **Medication Interaction & Validation Engine Slice.** Runs at prescribing time during post-visit documentation.
- **Herb-Drug Interaction Engine Slice.** Runs alongside medication engine at prescribing.
- **Pharmacy Portal Slice.** Receives approved prescriptions from sync consult.
- **Consent & Delegated Access Slice.** Care consent required. Delegate attend-consults scope gates delegate participation. Transcription covered under care consent.
- **Messaging & Inbox Spec v1.0.** Inbox threads and message-delivery expectations govern care-team and patient-visible communication generated by this workflow.
- **Notification infrastructure.** Booking confirmation, pre-visit reminders, waiting room status, post-visit summary delivery.
- **Video infrastructure.** WebRTC or equivalent real-time video technology. Video infrastructure selection is an engineering dependency on the launch critical path.
- **Speech-to-text infrastructure.** AI scribe depends on real-time speech-to-text with acceptable accuracy for clinical conversations. Infrastructure selection is on the critical path.
- **Clinician panel (§23 Q5).** Sync video availability depends on clinician scheduling. Minimum 8 sync clinician-hours/day for Ghana launch.
- **Payment & Billing Spec v1.0.** Booking-time payment collection, abandoned-payment recovery, and refund processing are governed by the payment specification.

---

## 15. Open questions (slice-level)

1. **Video infrastructure selection.** ~~Which WebRTC provider or solution is used? Build on an open-source stack (e.g., Jitsi, LiveKit) or use a managed provider (e.g., Twilio, Daily.co, Vonage)? The choice affects cost, reliability, geographic performance, and HIPAA/data-residency compliance.~~ **RESOLVED:** LiveKit self-hosted per ADR-021. Data-plane baseline is `us-east-1` per ADR-026 (HIPAA-eligible region; Ghana cross-border posture per ADR-026 with `[COUNSEL-REQUIRED]` for Ghana DPC mechanism — see Ghana Launch Playbook v1.2). Optional regional media routing for Ghana sync video (LiveKit edge node in `af-south-1` or `eu-west-1` while data plane remains `us-east-1`) is **Phase 2 / open option** per ADR-026; not launch scope. See also Tenant Threading Addendum §3.3.
2. **AI scribe accuracy threshold.** What transcript accuracy rate is acceptable for clinical documentation? How is accuracy measured and monitored? What happens if the scribe produces a poor transcript — does the clinician rewrite from memory?
3. **Visit duration enforcement.** Should the platform enforce visit duration (auto-end after 30 minutes) or allow overrun with notification? Enforcement risks cutting short important conversations; no enforcement risks clinician schedule drift.
4. **Group video consults.** Should the platform support group consults (one clinician + multiple patients) for educational sessions or group therapy? This is likely post-launch but the video infrastructure should accommodate it architecturally.
5. **Screen share for patients.** Should patients be able to share their screen (e.g., showing a health app reading, a lab result from another provider's portal)? Or is screen share clinician-only at launch?
6. **Waiting room content.** Should the waiting room display health education content, program information, or community activity while the patient waits? Or is a calm, simple waiting screen better?
7. **Post-visit survey.** Should a brief satisfaction survey be presented after every visit? If so, how many questions (recommend: 1-2 maximum), and how is the data used?

---

## Document control

- **v1.0** — Initial Synchronous Video Consult slice PRD. Defines the end-to-end flow from doctor search and booking through pre-visit preparation, device check, waiting room, live video, AI scribe, post-visit summary creation and delivery, prescribing, and follow-up. Covers audio-only fallback, delegate attendance, clinician scheduling, transcript policy, connectivity failure handling, emergency and safeguarding protocols. Derived from Master PRD v1.6 §10 Pillar 1 and §12 launch-readiness criteria.
- **Next review:** after video infrastructure selection (Q1); after AI scribe accuracy requirements are defined (Q2); after clinician scheduling system is implemented.
- **Change discipline:** changes to the video call flow, AI scribe scope, transcript/recording policy, prescribing-during-consult workflow, or payment model require explicit owner sign-off.
