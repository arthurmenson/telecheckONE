# Telecheck — Clinician Portal Information Architecture

**Version:** 1.0
**Status:** Canonical for development
**Owner:** Product (Telecheck)
**Parent document:** Telecheck Master Platform PRD v1.6, §12 (clinician-facing foundations)
**Companion documents:** All slice PRDs, Patient App IA v1.0, Design System v1.1

---

## 1. Purpose

The clinician is the second most important user of Telecheck. If the patient app is where trust is built, the clinician portal is where trust is earned — every clinical decision, every prescription, every override, every review happens here. A clinician who finds the portal slow, confusing, or incomplete will not adopt it, and without clinician adoption the platform cannot deliver care.

This document defines the clinician's working environment: what they see, how they navigate, how they make decisions, and how the platform makes them faster and safer without getting in their way.

**The core design problem:** Clinicians are time-constrained professionals. The portal must surface the right information at the right moment — AI summaries, interaction signals, patient context, protocol flags — without overwhelming the clinician with everything the platform knows. Too little context and the clinician makes blind decisions. Too much context and the clinician drowns.

---

## 2. Design constraints

- **Speed over aesthetics.** Every screen is optimized for fast clinical decision-making. A clinician should be able to review an async case and decide in under 5 minutes for straightforward cases, under 2 minutes for protocol-prepared cases.
- **Signal hierarchy.** Critical signals are impossible to miss. Major signals are prominent. Moderate and minor signals are accessible but not interruptive.
- **AI is a tool, not a boss.** AI summaries and recommendations are presented as decision support. The clinician's judgment always takes precedence. The portal never makes the clinician feel like they're rubber-stamping AI decisions.
- **Audit is built-in, not bolted on.** Every decision the clinician makes is captured through the workflow, not through a separate documentation step. The act of deciding is the act of documenting.
- **One workspace, not twelve apps.** The clinician should feel they are working in one coherent environment, not switching between disconnected tools for async review, sync consults, RPM monitoring, pharmacy escalations, and adverse events.

---

## 3. Navigation model

### 3.1 Primary navigation — left sidebar

The clinician portal uses a persistent left sidebar (not bottom tabs — clinicians primarily use tablets or desktops, not phones).

```
┌────────────┬──────────────────────────────────────┐
│            │                                      │
│  Dashboard │         [Active workspace]           │
│            │                                      │
│  Review    │                                      │
│  Queue     │                                      │
│            │                                      │
│  Patients  │                                      │
│            │                                      │
│  Schedule  │                                      │
│            │                                      │
│  Pharmacy  │                                      │
│  Alerts    │                                      │
│            │                                      │
│  Messages  │                                      │
│            │                                      │
│  Incidents │                                      │
│            │                                      │
│  Settings  │                                      │
│            │                                      │
│ ───────    │                                      │
│  [Name]    │                                      │
│  [Role]    │                                      │
└────────────┴──────────────────────────────────────┘
```

| Sidebar item | Purpose |
|---|---|
| **Dashboard** | Daily overview: queue depth, alerts, schedule, key metrics |
| **Review Queue** | Primary work surface: async consults, refill reviews, lab reviews, protocol fallbacks, escalations |
| **Patients** | Patient panel: search, browse, and access any patient's full clinical profile |
| **Schedule** | Sync consult calendar: upcoming appointments, availability management |
| **Pharmacy Alerts** | Escalations from pharmacy: substitution requests, new signals since approval, stock issues |
| **Messages** | Clinician inbox: patient messages, follow-up threads, pharmacy communications, system notifications |
| **Incidents** | Adverse events and safety incidents requiring clinician action |
| **Settings** | Preferences, notification settings, protocol accountability view |

### 3.2 Persistent elements

**Urgent alert bar.** Top of screen, appears only when critical items need attention: emergency escalations, critical RPM alerts, critical interaction signals. Red/high-visibility. Dismisses only after the clinician addresses the item.

**Queue counter badges.** Each sidebar item shows a count of pending items requiring action. Review Queue shows total pending reviews. Pharmacy Alerts shows pending escalations. Incidents shows open adverse events.

---

## 4. Screen architecture

### 4.1 Dashboard

The clinician's morning view. Answers: "What needs my attention today?"

```
Dashboard
├── Urgent Items (if any)
│   ├── Critical RPM alerts unacknowledged
│   ├── Emergency escalations pending
│   └── Overdue review items (past SLA)
│
├── Queue Summary
│   ├── Async consults pending: [count]
│   ├── Refill reviews pending: [count]
│   ├── Lab reviews pending: [count]
│   ├── Protocol fallbacks pending: [count]
│   ├── Pharmacy escalations pending: [count]
│   └── Average time in queue
│
├── Today's Schedule
│   ├── Upcoming sync consults with patient name, time, and preparation status
│   └── [View Full Schedule]
│
├── My Patient Panel (RPM)
│   ├── Patients with active alerts: [count]
│   ├── Patients with declining adherence: [count]
│   ├── Reviews due this week: [count]
│   └── [View Panel]
│
├── My Metrics (trailing 7 days)
│   ├── Cases reviewed
│   ├── Average time-to-decision
│   ├── Override rate
│   ├── AI agreement rate (Mode 2 cases)
│   └── Adverse events linked to my decisions
│
└── Protocol Accountability
    ├── Protocols I'm accountable for
    ├── Next review dates
    └── Protocol-linked incident count
```

### 4.2 Review Queue

The clinician's primary workspace. All items requiring clinical review, from all workflows, in one queue.

```
Review Queue
├── Filter bar
│   ├── Type: All | Async Consult | Refill | Lab Review | Protocol Fallback | Escalation
│   ├── Program: All | GLP-1 | ED | Diabetes | Hypertension | General
│   ├── Priority: All | Critical | High | Standard
│   └── Sort: Priority (default) | Time in Queue | Patient Name
│
├── Queue items
│   ├── [Queue Item Card]
│   │   ├── Patient name, age, sex
│   │   ├── Item type (async consult / refill review / lab review / protocol fallback / escalation)
│   │   ├── Program (if applicable)
│   │   ├── Time in queue
│   │   ├── Signal summary: [🔴 1 critical] [🟠 2 major] [🟡 3 moderate]
│   │   ├── AI preparation indicator: Mode 2 prepared | Mode 1 assisted | No AI
│   │   ├── Delegate indicator (if delegate-initiated)
│   │   └── [Claim] button
│   └── [Queue Item Card 2] ...
│
└── Claimed items (items I've claimed but not yet decided)
    └── [In-progress cards with elapsed time]
```

### 4.3 Case review — the decision workspace

When the clinician claims and opens a queue item, the full decision workspace opens. This is the most critical screen in the portal — where clinical decisions happen.

**Layout: three-panel design**

```
┌─────────────────────┬─────────────────────┐
│                     │                     │
│   Clinical Summary  │   Patient Context   │
│   (left panel)      │   (right panel)     │
│                     │                     │
│   AI summary        │   Medications       │
│   Signals           │   Conditions        │
│   Intake data       │   Allergies         │
│   Recommendation    │   Herbal medicines  │
│                     │   Labs              │
│                     │   RPM data          │
│                     │   Consult history   │
│                     │   Refill history    │
│                     │   AI conversations  │
│                     │                     │
├─────────────────────┴─────────────────────┤
│                                           │
│              Action Bar (bottom)          │
│                                           │
│  [Prescribe] [Advise] [Request Data]      │
│  [Order Labs] [Escalate to Sync]          │
│  [Decline] [Refer]                        │
│                                           │
└───────────────────────────────────────────┘
```

**Left panel — Clinical Summary (what the AI prepared + signals)**

For Mode 2 async consults:
- AI Mode 2 clinical summary with recommendation and confidence
- Interaction engine signals (all five check classes), ordered by severity
- Herb-drug signals (if applicable), with evidence quality
- Mode 2 eligibility assessment and flagged concerns
- AI recommendation clearly labeled: "AI recommends: [action] (confidence: [level])"

For Mode 1 assisted consults:
- Mode 1 intake summary (chief complaint, symptom detail, context)
- Interaction signals (if medication-related)
- No clinical recommendation (Mode 1 doesn't recommend)

For refill reviews:
- Medication being refilled, dose, quantity
- Refill history and adherence data
- Interaction signals active for this medication
- Herb-drug signals active
- Protocol evaluation results (if protocol attempted and fell back)

For lab reviews:
- AI interpretation of lab values
- Abnormal values highlighted
- Trend data (if previous values exist)
- Drug-lab signals triggered by the new values
- Comparison to care plan targets (if RPM enrolled)

**Signals display rules:**
- Critical signals: red banner at top of summary, cannot be scrolled past without acknowledgment
- Major signals: orange highlight, prominent position
- Moderate signals: yellow indicator, visible but not blocking
- Minor signals: collapsed by default, expandable
- Each signal shows: severity icon, mechanism summary, recommended action, evidence quality (herb-drug), and [Override] / [Acknowledge] controls

**Right panel — Patient Context (who is this patient)**

Collapsible sections, each loading independently (no single slow section blocks the others):
- Demographics and program enrollment
- Active medication list (with last-confirmed date)
- Active conditions
- Allergies (severity highlighted)
- Herbal medicines reported (with last-confirmed date)
- Recent labs (last 3 results for key metrics, with trend arrows)
- RPM data (if enrolled — recent readings, adherence, alerts)
- Consult history (last 3 consults with summaries)
- Refill history (last 5 refills)
- Delegate context (if delegate-initiated: who, relationship, scope)
- AI conversation references (recent Mode 1 conversations where the patient discussed relevant topics)

**Bottom panel — Action Bar**

Action buttons adapt to the item type:

| Item type | Available actions |
|---|---|
| Async consult | Prescribe, Advise, Request Data, Order Labs, Escalate to Sync, Decline, Refer |
| Refill review | Approve, Approve with Modification, Decline |
| Lab review | Validate, Correct, Escalate, Request Retest |
| Protocol fallback | Approve (manual), Modify, Decline (with protocol decline context visible) |
| Pharmacy escalation | Approve Substitution, Reject Substitution, Provide Alternative, Escalate Further |

Each action opens a structured decision form:
- Decision type (pre-selected from button)
- Rationale (structured + free text)
- If prescribing: medication search, dose, frequency, quantity, interaction engine runs inline
- If overriding a signal: override form with mandatory rationale
- AI agreement indicator (for Mode 2 cases): "Agree with AI recommendation" / "Modify AI recommendation" / "Disagree with AI recommendation" — single selection
- Follow-up plan: next action, timeline, what the patient should watch for
- [Confirm and Submit] — the decision is finalized, audited, and the patient is notified

**Time-to-decision timer.** Visible in the workspace header. Shows elapsed time since the clinician claimed the case. Not punitive — informational. Helps the clinician self-manage and helps operations track SLA.

### 4.4 Patient profile

When the clinician opens a patient from the Patients sidebar (not from the review queue), they see the full patient profile — a comprehensive clinical view.

```
Patient Profile: [Patient Name]
├── Overview
│   ├── Demographics, program enrollments, delegate relationships
│   ├── Active medications with interaction signal summary
│   ├── Active conditions
│   ├── Allergies
│   ├── Herbal medicines
│   └── Medication list completeness indicator
│
├── Clinical Timeline
│   ├── Chronological view of all clinical events
│   │   ├── Consults (async + sync) with summaries
│   │   ├── Prescriptions
│   │   ├── Refills (with approval pathway indicator)
│   │   ├── Lab uploads and interpretations
│   │   ├── RPM alerts and clinician actions
│   │   ├── Adverse events
│   │   └── Care plan changes
│   └── Filterable by event type and date range
│
├── Medications
│   ├── Active medication list
│   ├── Interaction signals (full detail, all check classes)
│   ├── Herb-drug signals
│   ├── Override history
│   ├── Refill history and adherence
│   └── Discontinued medications
│
├── Labs
│   ├── Lab timeline with trends
│   ├── AI interpretations with review status
│   ├── Panel comparisons
│   └── Drug-lab signals
│
├── Monitoring (if RPM enrolled)
│   ├── RPM dashboard: metrics, trends, alerts
│   ├── Care plan with targets and milestones
│   ├── Adherence (monitoring + medication + lab schedule)
│   └── Check-in history
│
├── Documents
│   ├── Uploaded documents with AI summaries
│   └── Original files accessible
│
├── AI History
│   ├── Mode 1 conversation sessions (read-only reference)
│   ├── Mode 2 summaries and recommendations
│   └── Clinician agreement/disagreement history with AI
│
├── Delegation
│   ├── Active delegates with scope
│   ├── Delegate action log
│   └── Sensitive-category visibility status
│
└── Actions
    ├── [Start Consult] → initiate clinician-started consult
    ├── [Prescribe] → direct prescribing (outside consult context)
    ├── [Order Labs]
    ├── [Send Message]
    ├── [Adjust Care Plan] (if RPM enrolled)
    ├── [Report Adverse Event]
    └── [View Audit Trail] → full audit history for this patient
```

### 4.5 Schedule (sync consults)

```
Schedule
├── Calendar view (day/week)
│   ├── Booked consults with patient name, duration, program
│   ├── Available slots (bookable by patients)
│   ├── Buffer time between appointments
│   └── [Add Availability] / [Block Time]
│
├── Today's appointments
│   ├── [Appointment Card]
│   │   ├── Patient name, time, duration, program
│   │   ├── Pre-visit intake status (completed / pending / not started)
│   │   ├── AI preparation status (summary ready / preparing)
│   │   ├── Signal summary
│   │   ├── [Prepare] → opens case review workspace with pre-visit data
│   │   └── [Join Call] → enters video call (when time arrives)
│   └── [Appointment Card 2]
│
├── Availability settings
│   ├── Recurring availability blocks
│   ├── Maximum daily consults
│   ├── Buffer time configuration
│   └── Sync with external calendar (post-launch)
│
└── History
    └── Past consults with summaries and post-visit notes
```

### 4.6 Pharmacy alerts

```
Pharmacy Alerts
├── Pending escalations
│   ├── [Alert Card]
│   │   ├── Patient name, medication, alert type
│   │   ├── Alert types: substitution request | new signal since approval |
│   │   │   stock-out (time-sensitive) | counterfeit flag | cold-chain issue
│   │   ├── Pharmacy and pharmacist who escalated
│   │   ├── Original prescription context
│   │   ├── Interaction signals (if new signal alert)
│   │   └── Actions: Approve Substitution | Reject | Provide Alternative | Acknowledge
│   └── [Alert Card 2]
│
└── Resolved alerts (history)
```

### 4.7 Messages

```
Messages
├── Filter: All | Patients | Pharmacy | System | Follow-up
│
├── Conversations
│   ├── [Thread] — patient name, last message preview, timestamp, unread indicator
│   │   └── Tap → threaded conversation
│   │       ├── Message history
│   │       ├── Linked consult/refill context (if follow-up thread)
│   │       ├── Patient profile accessible
│   │       └── Reply controls
│   └── [Thread 2]
│
└── System notifications
    ├── Protocol review reminders
    ├── New adverse event assignments
    ├── Panel size alerts
    └── Platform announcements
```

### 4.8 Incidents

```
Incidents
├── Active adverse events assigned to me
│   ├── [AE Card]
│   │   ├── Patient, severity, suspected agent, report date
│   │   ├── Auto-populated context summary
│   │   ├── Status: awaiting classification | under review | classified
│   │   └── [Review] → adverse event review workspace
│   └── [AE Card 2]
│
├── Pattern alerts
│   ├── System-detected adverse event patterns involving my patients or protocols
│   └── [Investigate] → pattern detail
│
└── Resolved incidents (history with outcome)
```

### 4.9 Prescribing flow (inline)

Prescribing is not a separate screen — it's a flow that opens within the case review workspace or patient profile.

```
Prescribe
├── Medication search (formulary autocomplete)
├── Selected: [Medication Name]
│   ├── Strength options
│   ├── Formulation options
│   ├── Dose and frequency
│   ├── Quantity and duration
│   ├── Indication (auto-populated from consult context, editable)
│   └── Special instructions
│
├── Safety check (runs immediately on medication selection)
│   ├── Interaction engine results (inline display)
│   │   ├── [🔴 Critical] — must override to proceed
│   │   ├── [🟠 Major] — must acknowledge to proceed
│   │   ├── [🟡 Moderate] — visible, no action required
│   │   └── [⚪ Minor] — collapsed
│   ├── Herb-drug engine results (same display)
│   ├── Allergy check
│   ├── Pregnancy/lactation flags
│   └── Duplicate therapy check
│
├── Override panel (if overriding a block/warn signal)
│   ├── Signal being overridden
│   ├── Rationale (mandatory, minimum length)
│   └── Acknowledgment: "I have reviewed this interaction and determined it is clinically appropriate to proceed"
│
├── Pharmacy routing (auto-determined, visible)
│   └── Fulfilling pharmacy: [Platform Pharmacy / Partner Pharmacy Name]
│
└── [Confirm Prescription] → prescription created, sent to pharmacy, patient notified
```

**The interaction engine check runs the moment the clinician selects a medication** — before they fill in dose and quantity. This means signals appear early enough to influence the medication choice, not after the clinician has already committed to their selection.

---

## 5. RPM monitoring surface

For clinicians managing RPM/CCM patient panels, the monitoring surface is accessible from the Dashboard and from individual Patient Profiles.

```
My RPM Panel
├── Panel overview
│   ├── Total patients: [count]
│   ├── Patients with active alerts: [count] (expandable list)
│   ├── Patients with declining adherence: [count] (expandable list)
│   ├── Reviews due this week: [count]
│   └── Program-level outcome summary (average HbA1c change, average BP change)
│
├── Patient list
│   ├── Sortable by: alert status | adherence | last review date | name
│   ├── [Patient Row]
│   │   ├── Name, program, latest key metric, alert status, adherence score, last review
│   │   └── Tap → patient RPM detail
│   └── [Patient Row 2]
│
├── Patient RPM detail
│   ├── Metric charts (time-series with threshold bands and medication overlay)
│   ├── Alert history with clinician actions
│   ├── Care plan with targets and milestone status
│   ├── Adherence breakdown (monitoring + medication + lab schedule)
│   ├── Check-in responses (flagging concerning answers)
│   ├── Actions: Adjust Care Plan | Adjust Thresholds | Schedule Consult | Send Message | Snooze Alert
│   └── Full patient profile accessible
│
└── Aggregate views
    ├── Alert volume over time (am I drowning?)
    ├── Adherence distribution across panel
    └── Outcome trends across panel
```

---

## 6. Clinician quality dashboard

Accessible from Dashboard → My Metrics. Shows the clinician their own performance signals — not punitive, informational and improvement-oriented.

```
My Quality Metrics
├── Throughput
│   ├── Cases reviewed per day/week (trailing 30 days)
│   ├── Average time-to-decision by item type
│   ├── SLA adherence rate
│   └── Trend: am I getting faster or slower?
│
├── AI collaboration
│   ├── Mode 2 agreement rate (how often I agree with AI recommendation)
│   ├── Mode 2 modification rate
│   ├── Mode 2 disagreement rate
│   ├── Cases where I disagreed and outcome data is available
│   └── AI scribe edit rate (how much do I edit the scribe draft — scribe quality signal)
│
├── Safety
│   ├── Override rate (by signal severity)
│   ├── Overrides where the patient subsequently had an adverse event
│   ├── Adverse events linked to my decisions
│   └── Protocol fallbacks I reviewed (and why the protocol declined)
│
├── Patient outcomes (where measurable)
│   ├── RPM panel: outcome trends for my patients
│   ├── Refill adherence for prescriptions I wrote
│   └── Patient satisfaction signals (if collected)
│
└── Peer comparison (anonymized)
    └── How my metrics compare to platform averages (optional, clinician can hide)
```

---

## 7. Sync video consult — clinician experience

```
Pre-call preparation (from Schedule)
├── Patient profile summary
├── AI-prepared brief (Mode 1 summary of pre-visit intake + recent health activity)
├── Interaction signals relevant to expected discussion
├── Previous consult summaries (if returning patient)
└── [Join Call] button (active when appointment time arrives)

In-call interface
├── Video area (patient video, self-view)
├── Controls: mute, camera, screen share, chat, end call, emergency trigger
├── Scribe panel (side, collapsible)
│   ├── Real-time transcript
│   ├── Identified clinical entities highlighted (medications, symptoms, decisions)
│   └── Draft summary building in real-time
├── Patient context panel (side, collapsible)
│   ├── Key patient info (medications, conditions, allergies)
│   ├── Interaction signals
│   └── Quick reference without leaving the call
└── [End Call] → transitions to post-visit workspace

Post-visit workspace
├── Scribe draft summary (editable)
│   ├── Chief complaint (auto-generated from transcript)
│   ├── History of present illness (auto-generated)
│   ├── Medications discussed (auto-identified)
│   ├── Assessment (clinician writes or edits)
│   └── Plan (clinician writes or edits)
├── Action controls
│   ├── [Prescribe] → prescribing flow (§4.9)
│   ├── [Order Labs]
│   ├── [Refer]
│   ├── [Schedule Follow-up]
│   └── [Enroll in RPM] (if appropriate)
├── Follow-up plan
│   ├── Next touchpoint
│   ├── Patient instructions
│   └── Monitoring recommendations
└── [Finalize and Send Summary] → patient receives patient-facing version
```

---

## 8. Screen inventory — clinician portal

| # | Screen | Priority |
|---|---|---|
| 1 | Dashboard | Critical-path |
| 2 | Review Queue (list view) | Critical-path |
| 3 | Case Review — async consult (three-panel workspace) | Critical-path |
| 4 | Case Review — refill review | Critical-path |
| 5 | Case Review — lab review | Critical-path |
| 6 | Case Review — protocol fallback | Critical-path |
| 7 | Case Review — pharmacy escalation | Critical-path |
| 8 | Prescribing flow (inline) | Critical-path |
| 9 | Patient profile — overview | Critical-path |
| 10 | Patient profile — clinical timeline | Launch |
| 11 | Patient profile — medications detail | Critical-path |
| 12 | Patient profile — labs detail | Launch |
| 13 | Patient profile — RPM monitoring | Launch |
| 14 | Patient profile — documents | Launch |
| 15 | Patient profile — AI history | Launch |
| 16 | Patient profile — delegation view | Launch |
| 17 | Patient profile — audit trail | Launch |
| 18 | Schedule — calendar view | Launch |
| 19 | Schedule — appointment detail + pre-call prep | Launch |
| 20 | Schedule — availability management | Launch |
| 21 | Video consult — in-call interface | Launch |
| 22 | Video consult — post-visit workspace | Launch |
| 23 | Pharmacy alerts queue | Critical-path |
| 24 | Messages — inbox | Critical-path |
| 25 | Messages — conversation thread | Critical-path |
| 26 | Incidents — adverse event list | Launch |
| 27 | Incidents — adverse event review workspace | Launch |
| 28 | Incidents — pattern detail | Launch |
| 29 | RPM panel — patient list | Launch |
| 30 | RPM panel — patient RPM detail | Launch |
| 31 | RPM panel — aggregate views | Launch |
| 32 | Quality metrics dashboard | Launch |
| 33 | Settings | Launch |
| 34 | Protocol accountability view | Launch |

**34 distinct screens.** 12 are critical-path (must be functional before any clinical review can happen). 22 are launch-scope (must be functional at launch).

---

## 9. Information density and progressive disclosure

The clinician portal faces the opposite information design challenge from the patient app. Patients need simplicity; clinicians need density — but organized density, not chaos.

**Rules:**

- **Left panel (clinical summary) is the primary reading surface.** The clinician reads left-to-right. The summary and signals are on the left because they are what the clinician reads first to form a clinical impression.
- **Right panel (patient context) is reference material.** The clinician glances right when they need a specific fact (medication name, allergy, lab value). Sections are collapsible — the clinician expands what they need.
- **Signals are layered by severity.** Critical signals are full-width banners. Major signals are highlighted inline. Moderate and minor signals are collapsed or minimized. The clinician can always expand to see everything, but the default view prioritizes what's dangerous.
- **AI summary is concise.** Mode 2 summaries target 200-300 words. They are structured (eligibility, concerns, recommendation) not narrative. The clinician should be able to scan the summary in 30 seconds.
- **Actions are at the bottom, not the top.** The clinician reads the summary, reviews signals, checks context, then acts. The action bar is at the bottom because that's where the clinician's attention arrives after reviewing.
- **Keyboard shortcuts for power users.** A (approve), D (decline), P (prescribe), E (escalate), N (next case). Clinicians who review 30+ cases per day need keyboard efficiency.

---

## 10. Delegate-initiated item indicators

When a queue item was initiated by a delegate (delegate-requested refill, delegate-booked consult, delegate-uploaded lab):
- The queue card shows a delegate icon with relationship type
- The case review workspace shows: "This [refill/consult/lab upload] was initiated by [delegate name] ([relationship]) on behalf of [patient name]"
- The clinician sees which scopes the delegate has (can they see the outcome? Can they receive notifications?)
- If the clinician needs to communicate about sensitive-category findings, they see whether the delegate has access to that category

---

## 11. Offline and degraded behavior

The clinician portal requires connectivity for all clinical actions (reviewing, prescribing, approving). There is no offline clinical workflow — this is a deliberate safety decision. A clinician making prescribing decisions on stale data is more dangerous than a clinician unable to work temporarily.

**Degraded connectivity:**
- If connectivity is slow, the portal prioritizes loading the clinical summary (left panel) before patient context (right panel)
- If the interaction engine is slow to return, a "Safety check in progress..." indicator is visible on the prescribing flow — the clinician cannot confirm a prescription until the engine returns
- If connectivity is lost during a case review, work-in-progress is preserved locally and re-synced when connectivity returns
- If connectivity is lost during a video call, the sync consult interruption flow applies (Sync Video Slice §4.5)

---

## 12. Accessibility

| Requirement | Implementation |
|---|---|
| WCAG AA contrast | All text and interactive elements |
| Keyboard navigation | Full portal navigable by keyboard. Keyboard shortcuts for common actions. |
| Screen reader support | All elements labeled. Signal severity conveyed by text, not color alone. |
| Text scaling | Respects system preferences. Dense clinical views remain usable at 150%. |
| Color not sole carrier | Signal severity uses icon shape + text label + color. Status uses shape + text + color. |
| High-density display support | Portal designed for laptop/desktop. Responsive to tablet. Not designed for phone (clinicians use larger screens). |

---

## Document control

- **v1.0** — Initial Clinician Portal Information Architecture. Defines sidebar navigation (8 sections), three-panel case review workspace, prescribing flow with inline interaction engine checks, RPM monitoring surface, sync video clinician experience, quality metrics dashboard, 34 distinct screens with critical-path flagging, information density rules, and delegate-initiated item indicators. Derived from Master PRD v1.6 §12 clinician-facing foundations and all slice PRDs.
- **Next review:** after Design System defines visual treatment; after first clinician usability testing.
- **Change discipline:** changes to navigation structure, case review workspace layout, prescribing flow, signal display rules, or action bar composition require product owner sign-off.
