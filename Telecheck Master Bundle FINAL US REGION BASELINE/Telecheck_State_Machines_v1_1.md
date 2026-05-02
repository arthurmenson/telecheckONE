# Telecheck — State Machines

**Version:** 1.1
**Status:** Canonical for development
**Owner:** Engineering Lead
**Parent document:** Telecheck Master Platform PRD v1.6, Canonical Data Model v1.0
**Source:** State transition tables from all slice PRDs

---

## 1. Purpose

This document formalizes the state transition tables scattered across slice PRDs into precise state machine specifications that engineering can implement directly. Each state machine defines: every valid state, every valid transition, what triggers the transition, what guard conditions must be true, what actions execute on transition, and what is audited.

State machines are the **runtime truth** of the platform. If the PRD says one thing and the state machine says another, the state machine governs runtime behavior (and the PRD is updated to match).

**Conventions used:**
- `UPPER_CASE` for states
- `lowercase_with_underscores` for transitions/events
- `[guard]` for conditions that must be true
- `{action}` for side effects that execute on transition
- Every transition produces an audit record (not listed individually — the universal audit entity captures all state changes)

---

## 2. Refill State Machine

**Entity:** Refill
**Source:** Refill Slice PRD §10

```
                    ┌──────────────┐
                    │  REQUESTED   │
                    └──────┬───────┘
                           │ verify_identity_consent
                           ▼
                    ┌──────────────┐
                    │  VERIFYING   │
                    └──────┬───────┘
                           │
                ┌──────────┴──────────┐
                │                     │
        [checks_pass]          [checks_fail]
                │                     │
                ▼                     ▼
        ┌──────────────┐      ┌──────────────┐
        │   ELIGIBLE   │      │  INELIGIBLE  │ ←── terminal
        └──────┬───────┘      └──────────────┘
               │ run_interaction_engine
               ▼
        ┌──────────────┐
        │   CHECKING   │
        └──────┬───────┘
               │ signals_produced
               ▼
        ┌──────────────┐
        │   REVIEWED   │
        └──────┬───────┘
               │
     ┌─────────┴─────────┐
     │                    │
[clinician_pathway]  [protocol_pathway]
     │                    │
     ▼                    ▼
┌────────────┐   ┌─────────────────┐
│ CLINICIAN_ │   │    PROTOCOL_    │
│   REVIEW   │   │   EVALUATION   │
└─────┬──────┘   └───────┬────────┘
      │                   │
  ┌───┴───┐          ┌───┴───────┐
  │       │          │           │
approve decline  [all_pass]  [any_fail]
  │       │          │           │
  ▼       ▼          ▼           │
┌────┐ ┌────────┐ ┌────────┐    │
│APPR│ │DECLINED│ │PROTOCOL│    │
│OVED│ │terminal│ │APPROVED│    │
└──┬─┘ └────────┘ └───┬────┘    │
   │                   │         │
   │◄──────────────────┘         │
   │                             │
   │    ┌────────────────────────┘
   │    │ fallback_to_clinician
   │    ▼
   │  ┌──────────────┐
   │  │  CLINICIAN_  │ (re-entry with protocol context)
   │  │   REVIEW     │
   │  └──────────────┘
   │
   │ transmit_to_pharmacy
   ▼
┌──────────────┐
│  FULFILLING  │
└──────┬───────┘
       │
   ┌───┴───┐
   │       │
[ok]    [issue]
   │       │
   ▼       ▼
┌──────┐ ┌──────────┐
│READY │ │EXCEPTION │
└──┬───┘ └────┬─────┘
   │          │ escalate
   │          ▼
   │    ┌──────────┐
   │    │ESCALATED │──resolve──▶ FULFILLING (re-enter)
   │    └──────────┘
   │
   ├──[delivery]──▶ DELIVERING ──▶ DELIVERED ──▶ COMPLETED
   │                    │
   │               [fail]
   │                    ▼
   │              DELIVERY_FAILED ──▶ PICKUP_AVAILABLE
   │
   └──[pickup]──▶ PICKUP_AVAILABLE ──▶ COMPLETED
```

### Transition details

| From | Event | Guard | To | Actions |
|---|---|---|---|---|
| REQUESTED | verify | — | VERIFYING | Check identity, consent, delegation scope |
| VERIFYING | checks_pass | Identity OK, consent active, delegation valid (if delegate), eligibility OK | ELIGIBLE | — |
| VERIFYING | checks_fail | Any check fails | INELIGIBLE | Notify patient with reason |
| ELIGIBLE | run_engine | — | CHECKING | Call Medication Interaction Engine (all 5 classes) + Herb-Drug Engine |
| CHECKING | signals_produced | Engine returns | REVIEWED | Attach signals to refill record |
| REVIEWED | route_clinician | Protocol pathway not activated for this medication class | CLINICIAN_REVIEW | Enter clinician queue |
| REVIEWED | route_protocol | Protocol pathway activated | PROTOCOL_EVALUATION | Protocol engine evaluates |
| CLINICIAN_REVIEW | approve | Clinician approves, signals acknowledged/overridden | APPROVED | Record clinician decision, overrides |
| CLINICIAN_REVIEW | approve_modified | Clinician modifies dose/quantity | APPROVED | Record modification, re-run engine if medication changed |
| CLINICIAN_REVIEW | decline | Clinician declines | DECLINED | Notify patient with reason |
| PROTOCOL_EVALUATION | all_pass | All protocol criteria met, no blocking signals | APPROVED | Record as protocol-executed, log protocol version |
| PROTOCOL_EVALUATION | any_fail | Any criterion fails | CLINICIAN_REVIEW | Attach protocol results, enter clinician queue |
| APPROVED | transmit | — | FULFILLING | Send to pharmacy portal, trigger payment |
| FULFILLING | fulfill_ok | Pick, label, package, release check pass | READY | Record pharmacist release |
| FULFILLING | exception | Stock-out, substitution, cold-chain, counterfeit flag | EXCEPTION | Record exception type |
| EXCEPTION | escalate | — | ESCALATED | Notify clinician/pharmacist |
| ESCALATED | resolve | Resolution determined | FULFILLING | Re-enter fulfillment |
| READY | dispatch | Delivery preference = delivery | DELIVERING | Hand off to delivery partner |
| READY | pickup_ready | Delivery preference = pickup | PICKUP_AVAILABLE | Notify patient |
| DELIVERING | delivered | Proof of delivery received | DELIVERED | Record delivery |
| DELIVERING | delivery_fail | Delivery unsuccessful | DELIVERY_FAILED | Notify patient, revert to pickup |
| DELIVERY_FAILED | revert_pickup | — | PICKUP_AVAILABLE | Notify patient, hold at pharmacy |
| DELIVERED | complete | — | COMPLETED | Update adherence, reset refill countdown |
| PICKUP_AVAILABLE | picked_up | Patient collects | COMPLETED | Update adherence, reset refill countdown |

### Consent revocation interrupts

| Refill state at revocation | Behavior |
|---|---|
| Before APPROVED | Transition to CANCELLED. Notify patient. |
| APPROVED but before FULFILLING release | Transition to CANCELLED. Notify pharmacy. |
| After pharmacy release (DELIVERING, PICKUP_AVAILABLE) | Delivery/pickup completes. No future refill initiated. |
| Abrupt discontinuation danger | SAFETY_HOLD state. Clinician notified. May authorize bridge supply → APPROVED (bridge). |

---

## 3. Async Consult State Machine

**Entity:** Consult (modality = async)
**Source:** Async Consult Slice PRD §12

```
INITIATED ──▶ INTAKE ──▶ SUBMITTED ──▶ PROCESSING ──▶ QUEUED ──▶ UNDER_REVIEW
                │                                                      │
            [abandon]                                          ┌───────┴────────┐
                │                                              │                │
                ▼                                         [decide]         [escalate]
           ABANDONED                                          │                │
                │                                    ┌────────┴──────┐         ▼
           [resume]                                  │               │    ESCALATED_
                │                              ┌─────┴─────┐   ┌────┴───┐  TO_SYNC
                ▼                              │           │   │        │
            INTAKE                        PRESCRIBED  ADVISED  AWAITING DECLINED
                                              │           │    _DATA    │
                                              │           │      │      │
                                              │           │  [respond]  │
                                              │           │      │      │
                                              │           │      ▼      │
                                              │           │  UNDER_     │
                                              │           │  REVIEW     │
                                              │           │  (re-enter) │
                                              │           │             │
                                              ▼           ▼             ▼
                                          FOLLOW_UP   FOLLOW_UP    COMPLETED
                                              │           │
                                              ▼           ▼
                                          COMPLETED   COMPLETED
```

### Transition details

| From | Event | Guard | To | Actions |
|---|---|---|---|---|
| INITIATED | start_intake | Payment confirmed | INTAKE | Present intake form |
| INTAKE | submit | Form complete, consent blocks resolved | SUBMITTED | Save intake data |
| INTAKE | abandon | 48 hours no activity | ABANDONED | Send nudge (1 only) |
| ABANDONED | resume | Patient returns | INTAKE | Restore saved progress |
| ABANDONED | expire | 14 days no activity | EXPIRED | Archive, refund payment |
| SUBMITTED | process | — | PROCESSING | Trigger AI preparation (Mode 2 or Mode 1) |
| PROCESSING | ai_complete | AI summary produced | QUEUED | Enter clinician review queue |
| QUEUED | claim | Clinician takes the case | UNDER_REVIEW | Record clinician, start review timer |
| UNDER_REVIEW | prescribe | Clinician prescribes, engine checks pass | PRESCRIBED | Create prescription, send to pharmacy, notify patient |
| UNDER_REVIEW | advise | Clinician provides advice without prescription | ADVISED | Record advice, notify patient |
| UNDER_REVIEW | request_data | Clinician needs more information | AWAITING_DATA | Notify patient, pause SLA clock |
| UNDER_REVIEW | order_labs | Clinician orders labs | ADVISED | Record lab order, notify patient (stays in follow-up) |
| UNDER_REVIEW | escalate_sync | Case needs live conversation | ESCALATED_TO_SYNC | Offer sync booking, carry forward all data |
| UNDER_REVIEW | decline | Cannot help via async | DECLINED | Notify patient with reason, refund if no value delivered |
| UNDER_REVIEW | refer | Refer to specialist/external | REFERRED | Record referral, notify patient |
| AWAITING_DATA | patient_responds | Data provided | UNDER_REVIEW | Re-enter review with new data, resume SLA clock |
| AWAITING_DATA | timeout | 14 days no response | CLOSED | Notify patient, partial refund |
| PRESCRIBED | enter_follow_up | — | FOLLOW_UP | Start 7-day follow-up window |
| ADVISED | enter_follow_up | — | FOLLOW_UP | Start 7-day follow-up window |
| FOLLOW_UP | follow_up_complete | Window expires or clinician closes | COMPLETED | Archive consult |
| DECLINED | — | — | COMPLETED | — |
| REFERRED | — | — | COMPLETED | — |
| ESCALATED_TO_SYNC | sync_booked | Patient books sync slot | — | Consult entity updated, sync consult created |

---

## 4. Sync Video Consult State Machine

**Entity:** Consult (modality = sync_video or sync_audio_only)
**Source:** Sync Video Consult Slice PRD §11

```
SEARCHING ──▶ BOOKING ──▶ BOOKED ──▶ PRE_VISIT ──▶ READY ──▶ IN_CALL ──▶ POST_VISIT ──▶ SUMMARY_DELIVERED ──▶ FOLLOW_UP ──▶ COMPLETED
                              │                       │          │
                          [cancel]                [no_show]   [interrupt]
                              │                       │          │
                              ▼                       ▼          ▼
                          CANCELLED              NO_SHOW    INTERRUPTED
                                                               │
                                                          [recover]──▶ IN_CALL
                                                          [cannot_recover]──▶ POST_VISIT (partial)
```

### Transition details

| From | Event | Guard | To | Actions |
|---|---|---|---|---|
| SEARCHING | select_slot | — | BOOKING | Display clinician, time, fee |
| BOOKING | confirm | Payment confirmed | BOOKED | Create appointment, send confirmation |
| BOOKED | pre_visit_start | Pre-visit window opens (2h before) | PRE_VISIT | Send pre-visit nudge, present intake form |
| BOOKED | cancel | Cancellation requested | CANCELLED | Refund per policy, release slot |
| PRE_VISIT | device_check_pass | Camera/mic/network OK | READY | Enter waiting room |
| PRE_VISIT | device_check_fail_camera | Camera fails | READY | Proceed as audio-only, notify clinician |
| PRE_VISIT | device_check_fail_critical | Mic fails or network unusable | — | Offer reschedule or async conversion |
| READY | clinician_joins | Clinician enters the call | IN_CALL | Start call timer, start AI scribe |
| READY | patient_no_show | 10 minutes without patient joining | NO_SHOW | Notify patient, close slot |
| READY | clinician_late_15 | 15 minutes without clinician | — | Offer refund + priority rebook |
| IN_CALL | end_call | Either party ends call normally | POST_VISIT | Stop scribe, generate draft summary |
| IN_CALL | connection_lost | Network drops | INTERRUPTED | Attempt reconnection for 60s |
| INTERRUPTED | reconnect | Connection restored within 60s | IN_CALL | Resume call and scribe |
| INTERRUPTED | cannot_reconnect | 60s elapsed without reconnection | POST_VISIT | Document partial visit, offer free follow-up |
| IN_CALL | emergency_detected | Clinician triggers emergency | EMERGENCY | Trigger emergency escalation pathway |
| POST_VISIT | summary_finalized | Clinician reviews/edits scribe draft, documents decisions | SUMMARY_DELIVERED | Send patient-facing summary |
| SUMMARY_DELIVERED | — | — | FOLLOW_UP | Start 7-day follow-up window |
| FOLLOW_UP | complete | Window expires or clinician closes | COMPLETED | Archive consult |

---

## 5. Pharmacy Fulfillment State Machine

**Entity:** Pharmacy order (linked to Refill or Prescription)
**Source:** Pharmacy Portal Slice PRD §10

```
QUEUED ──▶ CLAIMED ──▶ FULFILLING ──▶ RELEASE_CHECK ──▶ RELEASED ──▶ DISPATCHED ──▶ IN_TRANSIT ──▶ DELIVERED ──▶ COMPLETED
                           │               │                             │
                       [exception]     [hold]                      [delivery_fail]
                           │               │                             │
                           ▼               ▼                             ▼
                       EXCEPTION       HELD ──escalate──▶ ESCALATED   DELIVERY_
                                                              │       FAILED
                                                          [resolve]      │
                                                              │          ▼
                                                              ▼     PICKUP_
                                                          RELEASE_   AVAILABLE
                                                          CHECK         │
                                                         (re-enter) [pickup]
                                                                        │
                                                                        ▼
                                                                    COMPLETED

Also: RELEASED ──[pickup_preference]──▶ PICKUP_AVAILABLE ──▶ COMPLETED
      PICKUP_AVAILABLE ──[expired]──▶ RETURNED_TO_INVENTORY
```

### Key guard conditions

| Transition | Guard |
|---|---|
| RELEASE_CHECK → RELEASED | Correct medication verified, label accurate, no new signals since approval, no counterfeit flag (or flag reviewed and cleared), pharmacist signs off |
| RELEASE_CHECK → RELEASED (protocol) | Protocol-authorized release active, medication in approved release class, no new signals, no exceptions, labeling from approved content |
| DISPATCHED → IN_TRANSIT | Delivery partner confirms pickup |
| IN_TRANSIT → DELIVERED | Proof of delivery received |

---

## 6. Lab Upload State Machine

**Entity:** Document Upload + Lab Result
**Source:** Labs/Document Interpretation Slice PRD §11

```
UPLOADED ──▶ PROCESSING ──▶ EXTRACTED ──▶ CONFIRMING ──▶ CONFIRMED ──▶ INTERPRETING ──▶ INTERPRETED
    │              │                          │                              │
    │         [ocr_fail]                 [correct]                   ┌──────┴──────┐
    │              │                          │                      │             │
    │              ▼                          ▼                 [no_review    [review
    │        EXTRACTION_              CONFIRMED               _needed]     _required]
    │        FAILED                  (with corrections)           │             │
    │           │                                                 ▼             ▼
    │      [manual_entry]                                    AVAILABLE    REVIEW_QUEUED
    │           │                                                              │
    │           ▼                                                         [reviewed]
    │        CONFIRMING                                                        │
    │       (manual values)                                                    ▼
    │                                                                     AVAILABLE
    └──[manual_entry_direct]──▶ CONFIRMING (manual)
```

### Key transitions

| From | Event | Guard | To | Actions |
|---|---|---|---|---|
| UPLOADED | process | — | PROCESSING | Run OCR, image preprocessing |
| PROCESSING | extract_success | Values extracted | EXTRACTED | Present for patient confirmation |
| PROCESSING | extract_fail | OCR cannot extract | EXTRACTION_FAILED | Offer manual entry or retake |
| EXTRACTED | — | — | CONFIRMING | Patient reviews extracted values vs original image |
| CONFIRMING | confirm | Patient accepts (with or without corrections) | CONFIRMED | Save to lab history, notify interaction engine |
| CONFIRMED | interpret | — | INTERPRETING | Run AI interpretation |
| INTERPRETING | interpretation_complete | AI produces interpretation | INTERPRETED | Evaluate review requirement |
| INTERPRETED | no_review_needed | All values normal, no critical signals, not first upload | AVAILABLE | Patient can view results |
| INTERPRETED | review_required | Abnormal values, critical signals, first upload, or trend reversal | REVIEW_QUEUED | Enter clinician review queue |
| REVIEW_QUEUED | reviewed | Clinician validates, corrects, escalates, or requests retest | AVAILABLE | Patient sees reviewed results |

### Interaction engine notification

On CONFIRMED: the system checks whether any active prescriptions have drug-lab relevance. If yes, the Medication Interaction Engine re-evaluates. New drug-lab signals are generated if thresholds are crossed. Critical new signals trigger immediate clinician notification.

---

## 7. RPM Alert State Machine

**Entity:** RPM Alert (generated from RPM Metric Entries)
**Source:** RPM/CCM Slice PRD §6

```
GENERATED ──▶ ROUTED ──▶ ACKNOWLEDGED ──▶ ACTIONED ──▶ RESOLVED
                │              │
           [critical]     [snoozed]
                │              │
                ▼              ▼
          EMERGENCY_      SNOOZED
          ESCALATION         │
                         [snooze_expires]
                              │
                              ▼
                           ROUTED
                          (re-enter)
```

### Transition details

| From | Event | Guard | To | Actions |
|---|---|---|---|---|
| — | metric_crosses_threshold | Value exceeds critical/warning/trend threshold | GENERATED | Create alert with type and severity |
| GENERATED | route | — | ROUTED | Deliver to clinician (critical: immediate; warning: within 4h; trend/adherence: standard queue) |
| GENERATED | route_critical | Alert is critical threshold | EMERGENCY_ESCALATION | Trigger emergency pathway, notify patient with guidance |
| ROUTED | acknowledge | Clinician reviews alert | ACKNOWLEDGED | Record clinician, review timestamp |
| ACKNOWLEDGED | action | Clinician takes action (adjust plan, schedule consult, modify medication) | ACTIONED | Record action type and detail |
| ACKNOWLEDGED | snooze | Clinician snoozes non-critical alert | SNOOZED | Record snooze duration, rationale. Not available for critical alerts. |
| SNOOZED | snooze_expires | Snooze period ends | ROUTED | Re-enter routing |
| ACTIONED | resolve | Action completed, alert no longer active | RESOLVED | Archive alert |
| ACKNOWLEDGED | dismiss | Clinician dismisses (false positive or clinically insignificant) | RESOLVED | Record dismissal rationale |

---

## 8. Adverse Event State Machine

**Entity:** Adverse Event
**Source:** Adverse Event Reporting Slice PRD §12

```
REPORTED ──▶ TRIAGE ──▶ UNDER_REVIEW ──▶ CLASSIFIED ──▶ REPORTING ──▶ REPORTED_EXTERNALLY ──▶ FOLLOW_UP ──▶ CLOSED
                                              │                                                    ▲
                                              │                                                    │
                                         [non_serious]                                             │
                                              │                                                    │
                                              ▼                                                    │
                                          MONITORING ─────────────────────────────────────────────▶┘
```

### Transition details

| From | Event | Guard | To | Actions |
|---|---|---|---|---|
| — | event_reported | Patient, clinician, or system reports | REPORTED | Create AE record, auto-populate context |
| REPORTED | triage | — | TRIAGE | Initial severity assessment, route by severity |
| TRIAGE | assign_reviewer | — | UNDER_REVIEW | Clinician assigned to assess |
| UNDER_REVIEW | classify | Clinician determines severity and causality | CLASSIFIED | Record severity, causality, management actions |
| CLASSIFIED | requires_external_report | Fatal, life-threatening, or serious | REPORTING | Generate external report |
| CLASSIFIED | non_serious | Non-serious severity | MONITORING | Track in periodic aggregate reporting |
| REPORTING | report_submitted | External report sent to regulatory body | REPORTED_EXTERNALLY | Record submission, track acknowledgment |
| REPORTED_EXTERNALLY | enter_follow_up | — | FOLLOW_UP | Monitor patient outcome |
| MONITORING | enter_follow_up | Periodic report submitted or tracking complete | FOLLOW_UP | Monitor patient outcome |
| FOLLOW_UP | outcome_determined | Patient outcome known | CLOSED | Record outcome, close AE |

### Escalation timing

| Severity | Internal escalation | External report deadline |
|---|---|---|
| Fatal / life-threatening | Immediate | 24 hours from awareness |
| Serious | Within 4 hours | 72 hours from awareness |
| Non-serious | Within 24 hours | Periodic aggregate |

---

## 9. Community Content Moderation State Machine

**Entity:** Community Post
**Source:** Community Platform Slice PRD §6

```
SUBMITTED ──▶ SCREENING ──▶ PUBLISHED
                  │              │
             ┌────┴────┐    [reported]
             │         │        │
         [pass]    [flag]       ▼
             │         │     FLAGGED
             │         ▼        │
             │     FLAGGED  [moderator
             │         │    _reviews]
             │         │        │
             │    ┌────┴────────┴────┐
             │    │                  │
             │ [approve]         [action]
             │    │                  │
             │    ▼             ┌────┴────┐
             │ PUBLISHED       │         │
             │              [hide]    [remove]
             │                 │         │
             │                 ▼         ▼
             │              HIDDEN    REMOVED
             │                 │
             │            [appeal]
             │                 │
             │                 ▼
             │           APPEAL_REVIEW
             │                 │
             │          ┌──────┴──────┐
             │          │             │
             │     [reinstate]   [uphold]
             │          │             │
             │          ▼             ▼
             │      PUBLISHED      HIDDEN
             │
             └──▶ PUBLISHED

Special path:
SCREENING ──[crisis_detected]──▶ CRISIS_ESCALATED
PUBLISHED ──[crisis_detected]──▶ CRISIS_ESCALATED
```

### Crisis detection (platform floor — always on)

| From | Event | Guard | To | Actions |
|---|---|---|---|---|
| Any content state | crisis_signal | Content matches crisis pattern (self-harm, abuse, emergency) | CRISIS_ESCALATED | Flag for safety team immediately, surface crisis resources to author, do NOT restrict author, log incident |

---

## 10. Consent Lifecycle State Machine

**Entity:** Consent Record
**Source:** Consent & Delegated Access Slice PRD §7, §8

```
GRANTED ──▶ ACTIVE
               │
          ┌────┴────┐
          │         │
     [revoked]  [superseded]
          │         │
          ▼         ▼
      REVOKED   SUPERSEDED
                    │
               (new ACTIVE
                consent created)

For time-bounded consent:
ACTIVE ──[expiry_date_reached]──▶ EXPIRED
```

### Revocation side effects

| Consent type revoked | Side effects |
|---|---|
| Platform consent | Account closure process. All in-flight workflows terminated. |
| Care consent (per program) | In-flight workflows for that program follow the interruption rules (Refill Slice: §9.1). No new clinical actions for that program. Other programs unaffected. |
| Data-use consent (per category) | New AI interpretations stop for that category. Existing derived data retained per jurisdiction. Affected features enter reduced mode. |
| Delegation consent | Delegate loses access immediately. In-flight delegate-initiated workflows continue to completion. No new delegate actions. |
| Jurisdictional consent | Market-specific consequences per the consent scope. |
| Episode consent | Episode closes. No further episode-specific actions. |

---

## 11. Market Pack / Rollout State Machine

**Entity:** Market Pack
**Source:** Market Rollout Cockpit Slice PRD §4.3

```
DRAFT ──▶ IN_REVIEW ──▶ PILOT ──▶ LIMITED_LAUNCH ──▶ FULL_LAUNCH
                                        │                  │
                                        │             [restrict]
                                        │                  │
                                        │                  ▼
                                        │             RESTRICTED
                                        │                  │
                                        │             [resolve]
                                        │                  │
                                        │                  ▼
                                        │             FULL_LAUNCH
                                        │
                                   [emergency]──────▶ EMERGENCY_SAFE_MODE
                                                          │
                                                     [re_review]
                                                          │
                                                          ▼
                                                     IN_REVIEW

Any state ──[suspend]──▶ SUSPENDED
SUSPENDED ──[reactivate]──▶ IN_REVIEW
```

### Transition guards

| Transition | Guard |
|---|---|
| DRAFT → IN_REVIEW | Readiness checklist initiated, evidence locker populated |
| IN_REVIEW → PILOT | All readiness categories at least "partially ready," critical dependencies met, activation review approved |
| PILOT → LIMITED_LAUNCH | Pilot metrics acceptable, no blocking incidents, all readiness categories "ready" |
| LIMITED_LAUNCH → FULL_LAUNCH | Launch metrics acceptable, no blocking incidents, clinician panel sufficient for full volume |
| FULL_LAUNCH → RESTRICTED | Incident requires capability restriction. Specific capabilities deactivated; others continue. |
| FULL_LAUNCH → EMERGENCY_SAFE_MODE | Severe incident. All configurable behavior reverts to strictest defaults. Country Launch Director or Support Lead authorization required. |
| EMERGENCY_SAFE_MODE → IN_REVIEW | Exit requires explicit re-review of all active configurations. |
| Any → SUSPENDED | Country Launch Director authorization. Market fully offline. |

---

## 12. Configuration Object Lifecycle State Machine

**Entity:** Guardrail Template / Moderation Policy / Clinical Protocol
**Source:** Admin Configuration Surfaces Slice PRD §3.2

```
DRAFT ──▶ DEFINED ──▶ TESTING ──▶ TESTED ──▶ REVIEW ──▶ APPROVED ──▶ DEPLOYING ──▶ ACTIVE
                         │                                                │           │
                    [test_fail]                                      [deploy_   [rollback]
                         │                                           reject]        │
                         ▼                                              │           ▼
                      DEFINED                                           ▼      ROLLED_BACK
                     (fix and                                        APPROVED      │
                      retest)                                       (defer or   [redeploy]
                                                                     reject)       │
                                                                                   ▼
                                                                               DEPLOYING

ACTIVE ──[review_cadence_due]──▶ REVIEW_DUE
REVIEW_DUE ──[renewed]──▶ ACTIVE (new version)
REVIEW_DUE ──[expired]──▶ REVERTED_TO_DEFAULT
```

---

## 13. Interaction Engine Execution (not a persistent state machine — a transaction flow)

The interaction engine is called synchronously and does not maintain persistent state across calls. Each invocation is a transaction:

```
INVOKED
  │
  ├── Receive trigger (prescription, refill, med-list change, lab upload)
  │
  ├── Load patient context
  │   ├── Active medication list
  │   ├── Active herbal medicine list
  │   ├── Active condition list
  │   ├── Current lab values + trends
  │   ├── Available genotype data
  │   └── Patient profile (age, sex, pregnancy, weight, renal/hepatic)
  │
  ├── Execute check classes
  │   ├── Drug-drug (pairwise + multi-drug)
  │   ├── Drug-condition
  │   ├── Drug-lab (current + trending)
  │   ├── Genotype (reference data at launch)
  │   └── Special flags (marrow, hemoglobinopathy, pregnancy, pediatric, geriatric, polypharmacy)
  │
  ├── Execute herb-drug checks (if herbal medicines reported)
  │   ├── Herb-drug pharmacokinetic
  │   ├── Herb-drug pharmacodynamic
  │   └── Herb-condition
  │
  ├── Produce signals (each with severity, mechanism, evidence, recommended action)
  │
  ├── Return signal set to caller
  │
  └── Log execution (patient_id, trigger, medication list snapshot, all signals, engine version, KB version, timestamp)
```

**Target latency:** Under 2 seconds for typical medication list. Under 5 seconds for polypharmacy (15+ medications).

---



## 14. Payment State Machine

**Entity:** Payment
**Source:** Payment & Billing Spec v1.0 §4

```
PENDING ──authorize──▶ AUTHORIZED ──capture──▶ CAPTURED ──settle──▶ SETTLED
   │                        │                      │                   │
   ├──fail──────────────▶ FAILED                  ├──refund────────▶ REFUNDED
   ├──timeout───────────▶ TIMEOUT                 └──partial_refund▶ PARTIALLY_REFUNDED ──full_refund──▶ REFUNDED
   └──cancel────────────▶ CANCELLED
```

### Transition details

| From state | Transition | Guard / trigger | To state | Side effects |
|---|---|---|---|---|
| `PENDING` | `authorize` | Patient approves on provider surface | `AUTHORIZED` | Persist provider auth token/reference; emit `payment.authorized` |
| `PENDING` | `fail` | Processor returns non-retryable failure | `FAILED` | Emit `payment.failed`; surface retry guidance |
| `PENDING` | `timeout` | Authorization window expires | `TIMEOUT` | Emit `payment.timeout`; allow controlled retry |
| `PENDING` | `cancel` | Patient abandons or system cancels before auth | `CANCELLED` | Emit `payment.cancelled` |
| `AUTHORIZED` | `capture` | Funds successfully captured | `CAPTURED` | Emit `payment.captured`; unlock linked workflow |
| `AUTHORIZED` | `cancel` | Authorization reversed before capture | `CANCELLED` | Emit `payment.cancelled` |
| `CAPTURED` | `settle` | Settlement confirmed by provider | `SETTLED` | Emit `payment.settled`; reconcile ledger |
| `CAPTURED` | `refund` | Full refund approved | `REFUNDED` | Emit `payment.refunded` |
| `CAPTURED` | `partial_refund` | Partial refund approved | `PARTIALLY_REFUNDED` | Emit `payment.partially_refunded` |
| `SETTLED` | `refund` | Full refund approved post-settlement | `REFUNDED` | Emit `payment.refunded` |
| `SETTLED` | `partial_refund` | Partial refund approved post-settlement | `PARTIALLY_REFUNDED` | Emit `payment.partially_refunded` |
| `PARTIALLY_REFUNDED` | `full_refund` | Remaining amount refunded | `REFUNDED` | Emit `payment.refunded` |

### Guard conditions and notes

- Payment transitions are idempotent; duplicate callbacks do not create duplicate captures or refunds.
- `FAILED`, `TIMEOUT`, and `CANCELLED` are terminal for a single payment attempt, but a new `PENDING` payment may be created for the same linked workflow.
- Downstream workflow state changes (for example refill fulfillment or consult booking) must not proceed past the configured collection point until the payment reaches `CAPTURED` or `SETTLED`, per the Payment & Billing Spec.
- Subscription retries create new payment attempts against the same subscription/enrollment context; they do not mutate a terminal failed payment back into `PENDING`.


## 15. Subscription State Machine (NEW in v1.1)

**Entity:** Subscription
**Source:** Pharmacy + Refill Slice PRD v2.X §8 (governs); Canonical Data Model v1.2 §4.7 (schema); ADR-008 (bridge supply on consent revocation); RBAC v1.1 (clinician override authority)

The subscription state machine governs the lifecycle of an auto-renewing prescription subscription — the core mechanic of US DTC operating tenants (e.g., **Telecheck-US, trading patient-facing as the Heros Health DBA**) and any future tenant offering subscription products. *(Updated 2026-05-02 per Codex Round-8 Scope 4 MEDIUM-1 finding — was previously stated as `like Heros`, using bare `Heros` as a tenant identifier in violation of the C3 brand-structure rule per Master PRD v1.10 §17.)* It is tenant-scoped per ADR-023; per-tenant state-transition counts are independent.

```
                                  ┌─────────────────────────────────────────────┐
                                  │                                             │
DRAFT ──clinician_approval─▶ ACTIVE ──period_end────▶ FULFILLING ──complete──▶ ACTIVE
  │                            │ │ │ │ │                                          
  │                            │ │ │ │ └─switch_request──▶ SWITCHING ──approve──▶ ACTIVE (new product)
  │                            │ │ │ │                       │                    
  │                            │ │ │ │                       └─decline──▶ ACTIVE (original product)
  │                            │ │ │ │                                            
  │                            │ │ │ └─pause_request──▶ PAUSED ──resume──▶ ACTIVE
  │                            │ │ │                       │                      
  │                            │ │ │                       └─pause_expires──▶ CANCELLED
  │                            │ │ │                                              
  │                            │ │ └─cancel_request──▶ CANCELLATION_PENDING ──end_period──▶ CANCELLED
  │                            │ │                                                
  │                            │ └─payment_failed_terminal──▶ PAYMENT_FAILED_TERMINAL
  │                            │                                                  
  │                            └─safety_signal_critical──▶ SAFETY_HOLD ──clinician_release──▶ ACTIVE
  │                                                            │                  
  │                                                            └─clinician_terminate──▶ CANCELLED
  │
  └─clinician_decline──▶ DECLINED (terminal)
```

### State definitions

| State | Description | Patient sees | Terminal? |
|---|---|---|---|
| `DRAFT` | Subscription intent captured at intake; awaiting clinician review (or protocol authorization where configured) | "Your subscription is pending review" | No |
| `ACTIVE` | Subscription is live; next renewal scheduled | "Active — next refill on [date]" | No |
| `FULFILLING` | Refill in progress for current period | "Your [month] refill is being prepared" | No |
| `PAUSED` | Patient-initiated pause; auto-renewal suspended | "Paused until [date]. You can resume any time." | No |
| `SWITCHING` | Switch to different product requested; awaiting clinician review | "Your switch request is pending clinician review" | No |
| `CANCELLATION_PENDING` | Cancel requested; current period continues, no further renewal | "Cancelled — your final shipment is on its way" | No |
| `CANCELLED` | All subscription activity ceased; re-enrollment creates a new subscription | "Cancelled. Re-enroll any time to restart." | YES |
| `DECLINED` | Clinician declined the initial subscription | "Your application requires further review" + clinician note | YES |
| `PAYMENT_FAILED_TERMINAL` | Multiple payment failures, dunning exhausted | "Payment couldn't be processed. Update payment method to reactivate." | YES |
| `SAFETY_HOLD` | Critical safety signal triggered (consent revocation on abrupt-discontinuation med per ADR-008; or critical interaction signal) | "Your subscription is on hold. We're sending a bridge supply." | No (but may transition to CANCELLED via clinician termination) |

### Transition details

| From state | Transition | Guard / trigger | To state | Side effects |
|---|---|---|---|---|
| `DRAFT` | `clinician_approval` | Clinician reviews intake and approves prescription, OR protocol-authorized auto-approval per medication class | `ACTIVE` | Emit `subscription.activated`; create initial Refill record; schedule next_renewal_at |
| `DRAFT` | `clinician_decline` | Clinician declines (clinical safety, eligibility, etc.) | `DECLINED` | Emit `subscription.declined`; notify patient with clinician note |
| `ACTIVE` | `period_end` | next_renewal_at reached AND payment method valid AND interaction engine clear | `FULFILLING` | Emit `refill.initiated`; transition refill state machine |
| `ACTIVE` | `pause_request` | Patient requests pause via app | `PAUSED` | Emit `subscription.paused`; record pause_until (≤90 days); cancel scheduled renewal |
| `ACTIVE` | `switch_request` | Patient requests product switch | `SWITCHING` | Emit `subscription.switching_initiated`; create switch review case for clinician |
| `ACTIVE` | `cancel_request` | Patient confirms cancel after deflection | `CANCELLATION_PENDING` | Emit `subscription.cancellation_pending`; current period continues |
| `ACTIVE` | `safety_signal_critical` | Interaction engine returns critical signal at renewal-time check OR consent revocation on abrupt-discontinuation med per ADR-008 | `SAFETY_HOLD` | Emit `subscription.safety_hold`; trigger bridge supply per ADR-008; notify clinician |
| `ACTIVE` | `payment_failed_terminal` | Dunning policy exhausted (typically 14 days, multiple retries) | `PAYMENT_FAILED_TERMINAL` | Emit `subscription.terminated_payment_failure`; notify patient with reactivation path |
| `FULFILLING` | `complete` | Refill workflow reaches DELIVERED state | `ACTIVE` | Emit `subscription.fulfilled`; update last_fulfilled_at; decrement preauth_renewals_remaining; schedule next_renewal_at |
| `PAUSED` | `resume` | Patient resumes early OR pause_until reached and not extended | `ACTIVE` | Emit `subscription.resumed`; schedule next_renewal_at |
| `PAUSED` | `pause_expires` | pause_until reached AND patient explicitly extended past 90-day max OR confirms cancel | `CANCELLED` | Emit `subscription.cancelled` |
| `SWITCHING` | `approve` | Clinician approves switch | `ACTIVE` | Emit `subscription.switched`; update product_id, prescription_id, pricing |
| `SWITCHING` | `decline` | Clinician declines switch | `ACTIVE` | Emit `subscription.switch_declined`; subscription continues on original product |
| `CANCELLATION_PENDING` | `end_period` | Current period reaches end | `CANCELLED` | Emit `subscription.cancelled` |
| `SAFETY_HOLD` | `clinician_release` | Clinician reviews and authorizes resumption (clinical override per RBAC v1.1) | `ACTIVE` | Emit `subscription.released_from_safety_hold`; clinical override audit (Category A) |
| `SAFETY_HOLD` | `clinician_terminate` | Clinician terminates subscription due to clinical concern | `CANCELLED` | Emit `subscription.terminated_clinical`; bridge supply continues per ADR-008 |

### Guard conditions and invariants

- **SAFETY_HOLD release is clinician-only.** No system or patient action can release a SAFETY_HOLD; only an authorized clinician for the tenant per RBAC v1.1. Per I-001 floor.
- **Pause maximum is 90 days from `paused_at`.** Tenant Admin may shorten this per tenant policy but cannot extend beyond 90 days. Beyond 90 days, the subscription must transition to either ACTIVE (resume) or CANCELLED.
- **Cancellation deflection is bounded.** Per Pharmacy + Refill v2.X §10.2, no more than 2 deflection screens before unconditional cancel. The state machine transition `cancel_request` is not blocked by deflection failure — the patient's choice to cancel is sovereign.
- **Switch requires clinician review.** No protocol-authorized auto-approval for switches at launch; switch is always a clinical-review event.
- **Payment failure does not cause immediate termination.** The dunning loop (per Pharmacy + Refill v2.X §8.4) gives the patient time to update payment method. Only dunning exhaustion produces PAYMENT_FAILED_TERMINAL.
- **Bridge supply per ADR-008.** When entering SAFETY_HOLD, the platform automatically dispenses a bridge supply for medications classified as abrupt-discontinuation-risk (insulin, anticoagulants, certain psychiatric medications, etc.). This is an invariant; no tenant configuration disables it.
- **Tenant scoping.** All state transitions are scoped to the subscription's tenant; subscriptions in different tenants are independent state machines even if they belong to the same human (per ADR-023 — same person across tenants = separate accounts).
- **Idempotency.** Per IDEMPOTENCY contract v5.1, transition-triggering API calls carry an Idempotency-Key. Duplicate calls do not produce duplicate transitions or events.
- **Audit per AUDIT_EVENTS v5.1.** Every transition produces an audit record with tenant_id and (where cross-tenant access is involved — extremely rare) break_glass context. Switch approvals and SAFETY_HOLD events are Category A (safety-critical clinical); other transitions are Category C (operational).

### Cross-machine relationships

The Subscription machine has the deepest cross-machine wiring of any state machine in the platform. See updated §16 below.

---

## 16. Cross-machine interactions

| Trigger | Source machine | Target machine | Data passed |
|---|---|---|---|
| Refill approved | Refill | Pharmacy Fulfillment | Prescription, signals, patient, delivery preference |
| Consult prescribes | Async/Sync Consult | Pharmacy Fulfillment | New prescription, signals |
| Lab confirmed | Lab Upload | Interaction Engine (invocation) | Updated lab values |
| RPM metric critical | RPM Alert | Emergency Escalation | Patient, metric, value, guidance |
| Adverse event from protocol | Adverse Event | Market Pack (incident) | AE record, linked protocol |
| Consent revoked | Consent Lifecycle | Refill (interrupt) | Revocation scope, in-flight refill IDs |
| Consent revoked (abrupt-discontinuation med) | Consent Lifecycle | Subscription (SAFETY_HOLD) | Revocation scope, affected subscription IDs, bridge supply trigger |
| Protocol activated | Configuration Lifecycle | Market Pack (new version) | Protocol details |
| Crisis detected | Community Moderation | Adverse Event (potential) | Content, author, trigger type |
| Subscription period end | Subscription | Refill | Subscription ID, product, cadence, payment method |
| Refill DELIVERED | Refill | Subscription (FULFILLING → ACTIVE) | Refill ID, completion timestamp |
| Switch approval | Subscription (SWITCHING) | Refill | New prescription, product change |
| Subscription SAFETY_HOLD | Subscription | Refill (interrupt) + Pharmacy (bridge supply order) | Subscription ID, hold reason, bridge medication |
| Payment failed terminal | Payment | Subscription (terminate) | Payment ID, dunning history |
| Subscription cancelled | Subscription | Affiliate (commission reversal if within attribution window) | Subscription ID, cancellation date |

---

## v1.10 cycle additions (added 2026-05-02 per v1.10.1 hygiene cycle physical merge of `Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` Group 5B §State_Machines rows 71, 97)

### Research consent + export state machines (Row 71 — NEW per ADR-028)

#### `ResearchConsent` state machine

States: `pending`, `granted`, `revoked`.

Transitions:
- `pending → granted` (patient grants 5th-tier research data-use consent; emits `research_consent.granted` domain event + `research.consent_granted` audit event)
- `granted → revoked` (patient revokes; emits `research_consent.revoked` + `research.consent_revoked`; cohort definition module updates eligible-patient-set; in-flight cohorts depending on this patient suspended)

**Forbidden transitions:** `revoked → granted` (no resurrection of a revoked consent — per asymmetric retraction rule of Master PRD §15.2). A new grant after revoke creates a **new ResearchConsent entity** per consent immutability discipline.

**Guards on `pending → granted`:**
1. CCR `research_data_partnership_active != inactive` for the patient's `country_of_care`.
2. `research_consent_text_version` matches the approved text per CCR `research_ethics_review_body.approval_reference_id` AND `approval_validity_to >= now`.
3. `asymmetric_retraction_acknowledgment = true` (patient has acknowledged that aggregate data already shared cannot be retracted).

Per I-030, no care-delivery state machine MAY consume ResearchConsent state events.

#### `DataSharingAgreement` state machine

States: `draft`, `in_review`, `active`, `expired`, `suspended`, `retired`.

Transitions:
- `draft → in_review` (DSA submitted to ADR-028 quad sign-off pipeline)
- `in_review → active` (Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer + Product Lead quad sign-off recorded; partner organization signed; REC concurrence per `research_ethics_review_body.per_dsa_review_required`)
- `active → expired` (validity_to < now)
- `active → suspended` (regulatory or governance trigger)
- `suspended → active` (suspension cleared; re-evaluation against current CCR research keys)
- `expired | suspended → retired` (formal sunset; preserves DSA record for audit but no further export operations)

Renewal creates a **new DSA version** (new `dsa_id` ULID) — DSAs are immutable once active per audit-chain provenance.

#### `ResearchExportRequest` state machine

States: `queued`, `processing`, `ready`, `delivered`, `expired`, `invalidated`.

Transitions:
- `queued → processing` (export pipeline begins de-identification + k-anonymity computation; emits `research.export_initiated` audit event at `audit_sensitivity_level = high_pii` per I-031). **Initiation-time reject-unless guard (added 2026-05-02 per Codex Round-10 Scope 3 HIGH-1 finding; expanded 2026-05-02 per Codex Round-11 Scope 3 MEDIUM-1 finding to mirror OpenAPI v0.2 `/research/exports/initiate` exactly):** the transition MUST be rejected UNLESS ALL of: (a) CCR `research_data_partnership_active = active` for the cohort's `country_of_care` (Stage 2 activation precondition); (b) referenced `DataSharingAgreement` is `status = active` AND **`validity_to >= now`** AND **`permitted_data_domains` covers the cohort's data domains** AND **DSA `permitted_data_domains` is a subset of the country-level CCR `research_permitted_data_domains`**; (c) Stage 2 activation evidence (ADR-028 v0.4 quad sign-off + Country Launch Director + REC concurrence per `per_dsa_review_required`) recorded in activation audit chain; (d) `k_min_required` ≥ CCR `k_min_default`; (e) cohort `requested_data_domains` ⊆ DSA `permitted_data_domains`; (f) per-export multi-party grant artifact (PolicyAuthorization or named-equivalent evidence-locker ID per CCR_RUNTIME v5.2) present, unexpired, and attesting the configured multi-party signer chain. **Each failed clause produces a structured rejection error naming that specific clause** (no merged "validation failed" placeholder); failed initiation rejects without emitting `research.export_initiated`; no de-identification begins.
- `processing → ready` (de-identification complete; k-anonymity actual computed)
- `ready → delivered` (full 6-condition I-029 gate per OpenAPI v0.2 `/research/exports/{export_id}/complete`: k-anonymity verified ≥ k_min_required AND `dsa_status_at_export = active` AND `permitted_data_domains_at_export` matches snapshot AND `consent_cohort_snapshot_hash_completed = consent_cohort_snapshot_hash_initiated` AND every contributing patient has active `ResearchConsent` at completion-time evaluation AND per-export grant artifact unexpired + ID/hash-matched + signer-chain-attesting at completion-time; emits `research_export.delivered` domain event + `research.export_completed` audit event with `status = completed`)
- `ready → invalidated` OR `processing → invalidated` (any I-029 condition unmet)
- `delivered → expired` (retention class TTL elapsed; export artifact destroyed)

**Per I-029 reject-unless rule for `ready → delivered` (patch 2026-05-02 per Codex Round-2 Scope 2 HIGH-2 finding — adds explicit per-patient active-consent guard; expanded to 6 conditions 2026-05-02 per Codex Round-12 Scope 3 HIGH-1 + post-merge adversarial review HIGH-1 finding adding per-export grant-artifact gate):** the transition MUST be rejected (and `delivered` MUST NOT be reached) when ANY of the following 6 conditions fail, mirrored exactly from OpenAPI v0.2 v1.10 cycle additions /research/exports/{export_id}/complete endpoint contract:

1. `dsa_status_at_export ≠ active` (DSA expiry, suspension, or retirement during export) → `invalidation_reason = dsa_inactive`.
2. `k_threshold_actual < k_min_required` (k-anonymity violation) → `invalidation_reason = k_anonymity_violation`.
3. `permitted_data_domains_at_export` differs from the `research.export_initiated` snapshot (CCR drift mid-export) → `invalidation_reason = permitted_domain_drift`.
4. `consent_cohort_snapshot_hash_completed ≠ consent_cohort_snapshot_hash_initiated` (cohort changed mid-export) → `invalidation_reason = consent_cohort_change`.
5. **Every contributing patient MUST have active `ResearchConsent` at completion-time evaluation** (per-patient gate; covers stale/invalid consent records that existed before initiation, not only `research_consent.revoked` events emitted during the export window). Specifically: each contributing patient's `ResearchConsent` entity MUST have `consent_type = research_data_use`, `granted_at` non-null, `revoked_at` null at completion-time evaluation. If ANY contributing patient fails this check → `invalidation_reason = consent_revocation_mid_export` (the canonical name covers both mid-export revocation events and pre-existing invalid consent state).
6. **Per-export grant artifact (added 2026-05-02 per Codex Round-12 Scope 3 HIGH-1):** the per-export grant artifact (PolicyAuthorization OR named-equivalent per CCR_RUNTIME v5.2 + Cockpit research block; recorded at initiation per OpenAPI v0.2 6-condition initiation guard) MUST exist, MUST be unexpired (`grant_artifact_validity_to >= now`), MUST match the initiated export by ID/hash binding, AND MUST still attest the same multi-party signer chain (ADR-028 v0.4 quad sign-off + REC concurrence per `per_dsa_review_required`). Grant expiry, revocation, ID/hash mismatch, OR signer-chain attestation invalidation between initiation and completion fails this check → `invalidation_reason = grant_artifact_invalidated`.

The 6-value `invalidation_reason` enum (`dsa_inactive | k_anonymity_violation | permitted_domain_drift | consent_cohort_change | consent_revocation_mid_export | grant_artifact_invalidated`) is canonical and shared exactly with TYPES.ResearchDataExport.invalidation_reason and AUDIT_EVENTS v5.2 `research.export_completed` payload (per Codex Round-2 Scope 2 HIGH-1 alignment patch; expanded to 6-value 2026-05-02 per Codex Round-12 Scope 3 HIGH-1 + post-merge adversarial review HIGH-1 finding). Implementations MUST emit exactly one of the 6 enum values; a "fallthrough other" bucket is forbidden.

**Audit-side discipline (per AUDIT_EVENTS v5.2 §5 + GOVERNANCE_CONTROLS v5.2 §7.2; MAY → MUST 2026-05-02 per Codex Round-5 Scope 2 HIGH; expanded 2026-05-02 per Codex Round-7 Scope 2 MEDIUM-1 finding to cover both `ready → invalidated` AND `processing → invalidated` transitions; enum expanded to 6-value 2026-05-02 per Codex Round-12 Scope 3 HIGH-1 + post-merge adversarial review HIGH-1 finding):** when ANY invalidation transition fires — whether `ready → invalidated` (failure detected at the post-de-identification gate) OR `processing → invalidated` (failure detected during de-identification / k-anonymity computation, before reaching `ready`) — the audit-side `research.export_completed` event **MUST** emit with `status = invalidated`, `invalidation_reason` populated to the canonical 6-value enum (`dsa_inactive | k_anonymity_violation | permitted_domain_drift | consent_cohort_change | consent_revocation_mid_export | grant_artifact_invalidated`) matching the violated condition, and the violated state recorded in payload (e.g., `dsa_status_at_export = expired`, or `grant_artifact_validity_to_at_completion = <expired-timestamp>`); concurrently, a `signal_enforcement_trigger` Category B audit event **MUST** be emitted to capture the enforcement action (export artifact destruction; partner notification per DSA terms; engineering review trigger). Bare suppression of the completion event (no audit record at all) is forbidden — silent invalidation is an audit gap per I-003. Both invalidation transitions ("ready" and "processing") have identical audit-side discipline. The prior MAY framing is superseded.

The domain event `research_export.delivered` is **NOT emitted** for invalidated exports; the audit-side `research.export_completed` (with `status = invalidated`) records the failed completion. This is the asymmetry between domain-event and audit-event semantics under I-029.

### `ProtocolAuthorizedAction` lifecycle (Row 97 — NEW per ADR-029)

States (active at v1.0): `draft`, `ai_recommended`, `human_confirmed`, `executed`, `completed`.

Reserved future states (NOT implemented as executable code paths at v1.0; documented as non-normative future sketches): `audit_only_executed`, `autonomous_executed`, `autonomy_suspended`, `escalated_for_review`.

Transitions (active at v1.0):
- `draft → ai_recommended` (AI workload at `protocol_execution` produces a recommendation; `autonomy_level ∈ {advisory, suggestion, action_with_confirm}`)
- `ai_recommended → human_confirmed` (clinician reviews AI recommendation; explicit confirmation event emitted to immutable audit chain scoped to the action_id; confirming actor RBAC v1.1 / I-012 authorized role check passes)
- `human_confirmed → executed` (action executed per protocol authorization)
- `executed → completed` (downstream pipeline reports completion)

**I-012 reject-unless three-clause rule (mirrors Master PRD §13.7 v0.3 — single normative source of truth):** the state machine validator MUST reject any transition to `executed` for I-012-governed actions (prescription, refill, medication-order) UNLESS all three of the following hold simultaneously, evaluated per `action_id`:

1. `autonomy_level == action_with_confirm` (string equality; not membership in a set).
2. An explicit clinician confirmation event exists in the immutable audit chain scoped to this `action_id` prior to the transition.
3. The confirming actor holds a role authorized to sign for the action class under RBAC v1.1 / I-012.

**Rejection-audit-emit MUST (added v5.2 patch 2026-05-02 per Codex Round-2 Scope 1 MEDIUM-1 finding; envelope-population rule added v5.2 patch 2026-05-02 per Codex Round-4 Scope 1 MEDIUM-2 finding):** When the state machine validator rejects an I-012 `*.executed` transition under any of the three clauses above, the validator **MUST emit a Category A `<action_class>.execution_rejected` audit event** (`prescribing.execution_rejected`, `refill.execution_rejected`, or `medication_order.execution_rejected`) per AUDIT_EVENTS v5.2 §I-012 reject-unless rejection-audit-event rule. The event payload MUST carry `action_id`, `action_class`, `attempted_actor_id`, `attempted_actor_type`, `attempted_ai_workload_type`, `attempted_autonomy_level`, `violated_clauses[]` (one or more of `autonomy_level_string_equality`, `audit_chain_confirmation_event_missing`, `confirming_actor_rbac_unauthorized`, `reserved_level_without_activation_audit_event`), `confirmation_event_state`, `rbac_role_check_result`.

**Envelope-population rule (Round-4 Scope 1 MEDIUM-2 closure):** At emit time the validator MUST set the audit envelope's `ai_workload_type` and `autonomy_level` to the corresponding attempted-payload values: envelope `ai_workload_type = payload.attempted_ai_workload_type` and envelope `autonomy_level = payload.attempted_autonomy_level`. **If either attempted value is null, unknown, or a reserved-but-not-yet-activated value**, the envelope value MUST be set to the literal sentinel string `"rejected_invalid_attempt"` (canonical sentinel value present in WORKLOAD_TAXONOMY v5.2 `AIWorkloadType` enum and AUTONOMY_LEVELS v5.2 `AutonomyLevel` enum, mirrored in TYPES v5.2 operative shapes). This carve-out is necessary because schema-driven implementations applying the AUDIT_EVENTS v5.2 §I-012 closure rule literally would otherwise reject the rejection-audit event itself when attempted values are null/unknown/reserved — recreating the bare-suppression audit gap.

**Bare suppression — no audit record at all on rejection — is forbidden per I-003.** This requirement mirrors AUDIT_EVENTS v5.2 §I-012 reject-unless rejection-audit-event rule and is the state-machine-side enforcement obligation; emitter implementations derive emission behavior from this section, so the envelope-population rule above is normative here, not just at the AUDIT_EVENTS contract.

**Reserved transitions (non-normative future sketches, NOT implemented as executable code paths at v1.0):**

- `ai_recommended → audit_only_executed` — reserved for `autonomy_level = action_with_audit_only`. Activation requires successor ADR (ADR-030 or later) AND activation audit event in the immutable audit chain. ADR approval alone is never sufficient.
- `ai_recommended → autonomous_executed` — reserved for `autonomy_level = fully_autonomous`. Activation prerequisites are a strict superset of `action_with_audit_only` per AUTONOMY_LEVELS §3.2.
- `* → autonomy_suspended → escalated_for_review` — reserved for runtime-detected autonomy-policy violation; activation contingent on PolicyAuthorization framework (ADR-030 + GOVERNANCE_CONTROLS v5.2 §8 placeholder).

Per ADR-029 + AI_LAYERING v5.2 §10 + AUTONOMY_LEVELS contract.

### State machine count post-v1.10

Active state machines: **14 (v1.1 baseline) + 3 research (ResearchConsent, DataSharingAgreement, ResearchExportRequest) + 1 ProtocolAuthorizedAction = 18**.

Reserved-future transitions (non-normative sketches in this doc): 4 (ProtocolAuthorizedAction reserved transitions per the table above).

---

## Document control

- **v1.1** — Adds §15 Subscription State Machine (10 states: DRAFT, ACTIVE, FULFILLING, PAUSED, SWITCHING, CANCELLATION_PENDING, CANCELLED, DECLINED, PAYMENT_FAILED_TERMINAL, SAFETY_HOLD) per Pharmacy + Refill Slice PRD v2.X §8 — relocated to canonical State Machines per Pattern C remediation. Renumbers §15 Cross-machine interactions to §16 and extends with 6 new subscription-related cross-machine entries (period_end → Refill, Refill DELIVERED → Subscription completion, switch approval → Refill, SAFETY_HOLD → Refill+Pharmacy, payment_failed_terminal → Subscription, cancellation → Affiliate reversal). Total state machines: 14 plus interaction engine transaction flow. Threading remediation per Adversarial Counsel Review v1.0 finding CRITICAL-03. Existing 13 state machines preserved without modification.
- **v1.1 (refreshed 2026-05-02 per v1.10.1 hygiene cycle physical merge of `Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` Group 5B §State_Machines rows 71, 97)** — Additive content under "v1.10 cycle additions" section above. 3 new research state machines per ADR-028: ResearchConsent (`pending → granted → revoked`; `revoked → granted` forbidden per asymmetric retraction; new grant after revoke creates new entity); DataSharingAgreement (`draft → in_review → active → expired | suspended → retired`; renewal creates new DSA version); ResearchExportRequest (`queued → processing → ready → delivered | invalidated; delivered → expired`) with full I-029 6-condition reject-unless gate for `ready → delivered` transition *(canonical 6-condition gate per AUDIT_EVENTS v5.2 / TYPES v5.2 / OpenAPI v0.2 / GOVERNANCE_CONTROLS v5.2 — updated 2026-05-02 per Codex Round-9 Scope 2 MEDIUM-1 finding from prior 4-condition shorthand; expanded to 6 conditions 2026-05-02 per Codex Round-12 Scope 3 HIGH-1 + post-merge adversarial review HIGH-1 finding adding per-export grant-artifact gate)*: (1) DSA active; (2) k-anonymity actual ≥ required; (3) permitted-domain match; (4) consent-cohort hash match; (5) every contributing patient has active `ResearchConsent` at completion-time; (6) per-export grant artifact unexpired + ID/hash-matched + signer-chain-attesting at completion-time. Audit-side `status = invalidated` discipline (MUST per Round-5 patch) paired with `signal_enforcement_trigger` Category B audit covers both `ready → invalidated` and `processing → invalidated` transitions per Round-7 patch. 1 new ProtocolAuthorizedAction state machine per ADR-029: only `draft → ai_recommended → human_confirmed → executed → completed` path implemented as executable code at v1.0; reserved transitions (`audit_only_executed`, `autonomous_executed`, `autonomy_suspended → escalated_for_review`) documented as non-normative future sketches. I-012 reject-unless three-clause rule mirroring Master PRD §13.7 v0.3 (string equality `autonomy_level == action_with_confirm`; audit-chain clinician confirmation scoped to action_id; confirming actor RBAC role authorized) applied to all I-012 `executed` transitions. Reserved levels gated on successor ADR + activation audit event two-condition AND (ADR approval alone never sufficient). Total active state machines post-v1.10: **18 + 4 reserved-future transitions on ProtocolAuthorizedAction**. Per ADR-028 + ADR-029 + Master PRD v1.10 §13.7 + INVARIANTS v5.2 + AUDIT_EVENTS v5.2 + AUTONOMY_LEVELS contract + GOVERNANCE_CONTROLS v5.2. Existing v1.1 state machines preserved without modification; v1.10 additions are purely additive. No version-number bump (entry-level refresh).
- **v1.0** — Initial state machines document. Formalizes 13 state machines plus the interaction engine transaction flow from all slice PRDs. Covers: Refill (19 states), Async Consult (16 states), Sync Video Consult (14 states), Pharmacy Fulfillment (14 states), Lab Upload (11 states), RPM Alert (7 states), Adverse Event (9 states), Community Content Moderation (9 states + crisis), Consent Lifecycle (4 states), Market Pack (8 states), Configuration Object (10 states), Payment (9 states), and Interaction Engine (transaction flow).
- **Next review:** after engineering review validates state completeness and transition guards; after integration testing validates cross-machine interactions.
- **Change discipline:** changes to valid states, transitions, or guard conditions require engineering lead sign-off and must be reflected in the corresponding slice PRD if they alter the product model.
