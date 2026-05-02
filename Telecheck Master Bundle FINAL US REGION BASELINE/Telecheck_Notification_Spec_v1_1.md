# Telecheck — Notification Specification

**Version:** 1.1
**Status:** Canonical for development
**Owner:** Product + Engineering Lead
**Parent documents:** System Architecture v1.0 (Notification & Comms module), Ghana Launch Playbook v1.1, all slice PRDs

---

## 1. Purpose

Every workflow in Telecheck ends with a notification. This document defines what gets sent, through which channel, to whom, when, and with what content. Without this, engineers building notification infrastructure have no content to implement, and the WhatsApp Business API template approval process cannot begin.

---

## 2. Channel hierarchy

**Note (per v1.10.1 hygiene cycle Row 43):** WhatsApp-primary engagement is the launch posture for emerging markets (piloting with Telecheck-Ghana on 360dialog WhatsApp Business API per CCR `operational.notification_channels.primary_engagement`). The channel hierarchy below is the platform-default for emerging markets; CCR-driven per-country profiles override the hierarchy where appropriate (e.g., Telecheck-US tenant uses SMS+email-primary per US notification posture, with WhatsApp not applicable).

| Channel | Role | When used | Fallback |
|---|---|---|---|
| **WhatsApp** | Primary engagement (emerging markets; Telecheck-Ghana pilot on 360dialog) | All non-urgent notifications; appointment reminders; refill updates; community activity | SMS if WhatsApp undelivered after 5 minutes |
| **SMS** | Critical fallback | Emergency alerts; payment confirmations; OTP; WhatsApp delivery failures | None (terminal) |
| **In-app push** | Non-critical engagement | Community replies; general reminders; feature nudges | None (best-effort) |
| **In-app inbox** | Persistent record | All notifications stored in notification center regardless of external delivery | None (always written) |
| **Email** | Receipts and documents | Payment receipts; data export delivery; account actions | SMS for critical account actions |

**Channel selection logic:** For each notification type, a primary channel is defined. If the primary channel fails delivery within the timeout, the fallback channel fires. Every notification is always written to the in-app inbox regardless of external delivery status.

---

## 3. Notification types — Care Delivery

### 3.1 Async consult

| Trigger event | Recipient | Primary channel | Content summary | Urgency |
|---|---|---|---|---|
| `consult.submitted` | Patient | WhatsApp | "Your consultation has been submitted. A doctor will review it within 24 hours." | Standard |
| `consult.claimed` | Patient | In-app push | "A doctor is now reviewing your case." | Low |
| `consult.decision_made` (prescribe) | Patient | WhatsApp | "Your doctor has reviewed your case and prescribed [medication]. View details in the app." | Standard |
| `consult.decision_made` (advise) | Patient | WhatsApp | "Your doctor has reviewed your case and shared advice. View details in the app." | Standard |
| `consult.decision_made` (request_data) | Patient | WhatsApp | "Your doctor needs more information to continue. Please respond in the app." | Standard |
| `consult.decision_made` (decline) | Patient | WhatsApp | "Your doctor has reviewed your case. Please check the app for next steps." | Standard |
| `consult.decision_made` (escalate_to_sync) | Patient | WhatsApp | "Your doctor would like to schedule a video visit. Book a time in the app." | Standard |
| SLA approaching (20h without claim) | Clinician on-call | SMS + in-app | "Async consult [ID] approaching 24h SLA. [count] cases pending." | High |

### 3.2 Sync video consult

| Trigger event | Recipient | Primary channel | Content summary | Urgency |
|---|---|---|---|---|
| `appointment.booked` | Patient | WhatsApp | "Video visit booked with Dr. [Name] on [date] at [time]. We'll send a reminder before your visit." | Standard |
| `appointment.booked` | Clinician | In-app | "New appointment: [Patient] on [date] at [time]." | Standard |
| Pre-visit reminder (2 hours before) | Patient | WhatsApp | "Your video visit with Dr. [Name] starts in 2 hours. Make sure your camera and microphone are working." | Standard |
| Pre-visit reminder (15 minutes) | Patient | WhatsApp | "Your video visit starts in 15 minutes. Tap to join." | High |
| `appointment.cancelled` | Patient/Clinician | WhatsApp/In-app | "Your video visit on [date] has been cancelled." | Standard |
| Post-visit summary delivered | Patient | WhatsApp | "Your visit summary is ready. View it in the app." | Standard |

### 3.3 Prescriptions

| Trigger event | Recipient | Primary channel | Content summary | Urgency |
|---|---|---|---|---|
| `prescription.created` | Patient | WhatsApp | "A new prescription for [medication] has been created. It's being sent to the pharmacy." | Standard |

---

## 4. Notification types — Refill & Pharmacy

| Trigger event | Recipient | Primary channel | Content summary | Urgency |
|---|---|---|---|---|
| Refill due reminder (7 days before) | Patient | WhatsApp | "Your [medication] refill is due in 7 days. Request it now in the app." | Low |
| Refill due reminder (3 days before) | Patient | WhatsApp | "Your [medication] refill is due in 3 days. Tap to request." | Standard |
| Refill overdue (1 day past) | Patient | WhatsApp | "Your [medication] refill is overdue. Request it to avoid missing doses." | Standard |
| `refill.approved` | Patient | WhatsApp | "Your [medication] refill has been approved and sent to the pharmacy." | Standard |
| `refill.declined` | Patient | WhatsApp | "Your refill request was not approved. Please check the app for details and next steps." | Standard |
| `fulfillment.released` (delivery) | Patient | WhatsApp | "Your medication is on its way! Track delivery in the app." | Standard |
| `fulfillment.released` (pickup) | Patient | WhatsApp | "Your medication is ready for pickup at [pharmacy name]." | Standard |
| `fulfillment.delivered` | Patient | WhatsApp | "Your medication has been delivered. Confirm receipt in the app." | Standard |
| `delivery.failed` | Patient | WhatsApp + SMS | "We couldn't deliver your medication. It's available for pickup at [pharmacy]. Contact us if you need help." | High |
| `fulfillment.exception` | Clinician | In-app | "Pharmacy exception for [patient]: [exception type]. Action needed." | High |
| Substitution request | Clinician | In-app + SMS | "Pharmacy requesting substitution for [patient]: [original] → [substitute]. Approve in portal." | High |

---

## 5. Notification types — Labs

| Trigger event | Recipient | Primary channel | Content summary | Urgency |
|---|---|---|---|---|
| `lab.extracted` | Patient | In-app push | "We've processed your lab upload. Please confirm the values in the app." | Standard |
| `lab.interpreted` (no review needed) | Patient | WhatsApp | "Your lab results are ready with AI interpretation. View them in the app." | Standard |
| `lab.reviewed` | Patient | WhatsApp | "Dr. [Name] has reviewed your lab results. View the review in the app." | Standard |
| Lab schedule reminder (lab due in program) | Patient | WhatsApp | "Your [test name] is due for your [program] program. Upload results when ready." | Low |
| Critical lab value detected | Clinician | SMS + in-app | "Critical lab value for [patient]: [test] = [value] ([reference range]). Review immediately." | Critical |

---

## 6. Notification types — RPM & CCM

| Trigger event | Recipient | Primary channel | Content summary | Urgency |
|---|---|---|---|---|
| Metric reminder (scheduled reading due) | Patient | WhatsApp | "Time to log your [metric type]. Open the app to record your reading." | Standard |
| Metric reminder (overdue by 4+ hours) | Patient | WhatsApp | "You missed your [metric type] reading. Please log it when you can." | Standard |
| `alert.generated` (critical) | Clinician | SMS + in-app | "Critical RPM alert: [patient] [metric] = [value]. Exceeds [threshold]. Immediate review required." | Critical |
| `alert.generated` (critical) | Patient | WhatsApp + SMS | "Your [metric] reading of [value] needs attention. Please follow your care plan guidance. If you feel unwell, seek emergency care." | Critical |
| `alert.generated` (warning) | Clinician | In-app | "Warning: [patient] [metric] = [value]. Review within 4 hours." | High |
| `milestone.reached` | Patient | WhatsApp | "You've reached a milestone in your [program] program! View your progress." | Low |
| `enrollment.paused` | Patient | WhatsApp | "Your [program] monitoring has been paused. Contact your care team if you have questions." | Standard |
| Adherence declining (3+ missed readings) | Clinician | In-app | "[Patient] has missed [count] readings in the last [period]. Consider outreach." | Standard |

---

## 7. Notification types — Community

| Trigger event | Recipient | Primary channel | Content summary | Urgency |
|---|---|---|---|---|
| Reply to own post | Patient | In-app push | "[Author] replied to your post in [group name]." | Low |
| Expert session starting | Group members | WhatsApp | "Expert session starting in [group name] in 30 minutes. Join the discussion." | Standard |
| Post hidden by moderator | Author | In-app | "Your post in [group name] was hidden for review. You can appeal this decision." | Standard |
| Post removed by moderator | Author | In-app | "Your post in [group name] was removed. Reason: [reason]. Review community guidelines." | Standard |
| `crisis.detected` | Safety team | SMS + in-app | "Crisis content detected in [group]. Author: [ID]. Immediate review required." | Critical |

---

## 8. Notification types — AI & Safety

| Trigger event | Recipient | Primary channel | Content summary | Urgency |
|---|---|---|---|---|
| `ai.escalation_triggered` | Clinician on-call | In-app + SMS | "AI assistant escalation for [patient]: [reason]. Review case." | High |
| `ai.crisis_detected` | Safety team | SMS | "Crisis detected in AI chat. Patient: [ID]. Session: [ID]. Immediate response required." | Critical |
| `ai.crisis_detected` | Patient | In-app | Crisis resources displayed inline in chat. No external notification (avoid alarm). | — |
| New interaction signal (critical) | Clinician | SMS + in-app | "Critical interaction signal for [patient]: [mechanism summary]. Review immediately." | Critical |
| `adverse_event.reported` | Assigned clinician | In-app + SMS | "Adverse event reported for [patient]. Severity: [severity]. Review required." | High |

---

## 9. Notification types — Account & Payment

| Trigger event | Recipient | Primary channel | Content summary | Urgency |
|---|---|---|---|---|
| OTP for authentication | User | SMS | "[Code] is your Telecheck verification code. Do not share this code." | Critical |
| `payment.collected` | Patient | WhatsApp + Email | "Payment of [amount] received for [description]. Receipt available in the app." | Standard |
| `payment.failed` | Patient | WhatsApp | "Your payment of [amount] could not be processed. Please try again or use a different payment method." | Standard |
| `subscription.charged` | Patient | WhatsApp | "Your [program] subscription of [amount] has been charged. Next charge: [date]." | Standard |
| `payment.refunded` | Patient | WhatsApp + Email | "A refund of [amount] has been processed to your [method]. Allow [timeframe] for it to appear." | Standard |
| `delegation.created` | Patient + Delegate | WhatsApp | Patient: "[Delegate name] now has access to your health information." / Delegate: "[Patient name] has granted you access. View in the app." | Standard |
| `delegation.revoked` | Delegate | WhatsApp | "Your access to [patient name]'s health information has been revoked." | Standard |

---

## 10. Notification content rules

**Language:** All notifications in English for Ghana launch. Pidgin and local languages are post-launch.

**Personalization:** Use patient's display name. Use clinician's title + name (Dr. [Name]). Use medication display name (not code).

**Length constraints:**
- WhatsApp: max 1024 characters. Target under 200 characters for mobile readability.
- SMS: max 160 characters (single message). Critical fallback messages must fit in one SMS.
- Push: max 100 characters title, 200 characters body.

**Never include in notifications:**
- Specific diagnosis or condition names (privacy — others may see the notification)
- Specific lab values in WhatsApp/SMS (privacy)
- Medication names in SMS (privacy — use "your medication" instead)
- Full clinical details (always "view in the app" for details)

**Exception — critical safety notifications:**
- RPM critical alerts to patients include the metric name and value because the patient needs to act on it immediately
- Emergency routing includes the emergency number

**WhatsApp Business API template requirements:**
- All WhatsApp messages must use pre-approved templates
- Templates submitted during Phase 2 (T-8 to T-4) of Ghana Launch Playbook
- Template approval takes 24-48 hours; build buffer into timeline
- Dynamic variables use double-curly-brace syntax: `{{patient_name}}`, `{{medication}}`, `{{date}}`

---

## 11. Quiet hours

- Default quiet hours: 10pm - 7am local time
- Critical notifications (SMS for emergencies, OTP, critical RPM alerts, crisis detection) bypass quiet hours
- Standard notifications queued during quiet hours, delivered at 7am
- Patient can customize quiet hours in notification preferences
- Clinician on-call notifications always bypass quiet hours

---

## 12. Delegate notification routing

When a delegate has `receive_notifications` scope:
- Delegate receives a subset of the patient's notifications (refill status, appointment reminders, delivery updates)
- Delegate does NOT receive: community notifications, AI chat notifications, sensitive-category-related notifications (unless granted)
- Both patient and delegate receive the notification (delegate receipt does not suppress patient receipt)

---

## 13. Notification delivery tracking

Every notification records:
- `notification_id`, `recipient_id`, `type`, `channel`, `content_hash`, `sent_at`, `delivered_at`, `read_at`, `failed_at`, `fallback_triggered`

Failed delivery triggers:
1. Retry on same channel (1 retry after 30 seconds)
2. If still failed, fire fallback channel
3. If no fallback or fallback also fails, record failure, alert operations if critical

---

## Tenant-scoped variants and overrides (added v1.1)

Per ADR-023 multi-tenancy and CRITICAL-05 / MEDIUM-14 remediation, every notification type supports tenant-scoped variant content.

### Variant resolution order

When firing a notification:

1. **Tenant-specific override variant.** If the active tenant has authored a variant for this notification type (Tenant Marketing role per RBAC v1.1), use it.
2. **Tenant-default variant.** If the tenant has set a default variant (e.g., a tone preference or brand-voice override) without specifying for this notification type, apply that.
3. **Platform default variant.** Otherwise, use the platform's canonical content for this notification type.

The resolution is deterministic and audited per AUDIT_EVENTS v5.1 Category C — every notification fired records which variant was selected.

### Variant authoring authority

Per RBAC v1.1, the **Tenant Marketing** role (or higher within the tenant: Tenant Admin, Tenant Owner) authors tenant variants via the Admin Backend per Admin Backend Slice v1.X §5.5. Platform Admin may not author tenant-specific variants on behalf of a tenant — that would be a privacy boundary violation. Platform Admin may set platform-default variants only.

### What may vary per tenant

- Sender display name — surfaces the consumer DBA, not the operating-tenant identifier. Examples: `"Heros Health"` (consumer DBA, US — operating tenant `Telecheck-US`) vs `"Heros Health Ghana"` (consumer DBA, GH — operating tenant `Telecheck-Ghana`). Operating-tenant identifiers are internal/B2B-only and MUST NOT appear in patient-facing sender display names. _(Sender display framing updated 2026-05-02 per v1.10.1 hygiene cycle Phase5 delta Group 5E Row 12 — C3 brand-structure cascade.)_
- Tone (e.g., warm-conversational for one tenant, clinical-formal for another within accessibility floors)
- Brand-specific copy phrasings within length and accessibility constraints
- Localization (where applicable per CCR locale; Track A is English at launch)

### What may NOT vary per tenant

- Crisis-detection messaging (platform-floor per I-019; tenant-customization is a safety risk)
- Privacy constraints (medication names not in SMS body; per existing Notification Spec §10)
- Channel hierarchy (WhatsApp → SMS → push → inbox is platform-default per ADR-024 country profile; tenants may not override channel order)
- Quiet hours / frequency caps (platform-default; tenant may tighten but not loosen)
- Required compliance disclaimers (e.g., FDA-required language in US adverse event notifications)

### Variant validation

Per channel:
- **SMS:** length ≤ 160 chars; tenant-variant rejected at authoring time if exceeds
- **Email:** subject line ≤ 78 chars; accessibility scan (alt text, color contrast in headers); tenant-variant rejected if fails
- **Push notifications:** title ≤ 50 chars, body ≤ 200 chars
- **WhatsApp templates:** must conform to approved template structure; tenant-variant requires re-approval if structurally different
- **In-app:** content rendered in Design System v1.X tenant-themed components; no tenant-side HTML/JS injection

### Variant audit

Per AUDIT_EVENTS v5.1 Category C:
- Variant authoring (creation, edit, disable)
- Variant selection at notification fire time (which variant was used)
- Variant rejection at validation time (with reason)

### Localization deferred

Localization (multilingual content per language) is deferred to Track B per ADR-018 (USSD + AI Bridge). Tenant variants are English-only at launch; locale-aware variant resolution is post-launch.

---

## Document control

- **v1.1 cycle additions — 2026-05-02 (per v1.10.1 hygiene cycle physical merge of Phase5 delta Group 5E, Rows 12 + 43):** Row 12 — Sender display name framing reconciled with C3 brand-structure cascade (sender display surfaces consumer DBA — `"Heros Health"` / `"Heros Health Ghana"` — not operating-tenant identifier `Telecheck-US` / `Telecheck-Ghana`). Row 43 — Channel hierarchy framing reconciled with C2 emerging-markets reframe ("WhatsApp-primary in Ghana" → "WhatsApp-primary in emerging markets, piloting with Telecheck-Ghana on 360dialog"; CCR-driven per-country profile note added). Body content otherwise preserved at v1.1 baseline.
- **v1.1** — Adds Tenant-scoped variants and overrides section per ADR-023 multi-tenancy. Variant resolution order (tenant-specific → tenant-default → platform default). Tenant Marketing authoring authority per RBAC v1.1. Per-channel validation rules. Audit on variant authoring and selection. Localization explicitly deferred to Track B per ADR-018. Threading remediation per Adversarial Counsel Review v1.0 finding MEDIUM-14. Existing 55+ notification types, channel hierarchy, content rules, privacy constraints, quiet hours, delegate routing, delivery tracking, and WhatsApp template requirements preserved without modification.
- **v1.0** — Initial Notification Specification. Defines 55+ notification types across 9 categories (async consult, sync video, prescriptions, refill/pharmacy, labs, RPM/CCM, community, AI/safety, account/payment). Channel hierarchy (WhatsApp → SMS → push → inbox). Content rules including privacy constraints. Quiet hours. Delegate routing. Delivery tracking. WhatsApp template requirements.
- **Next review:** after WhatsApp Business API template submission (validate template format compatibility); after first tenant-variant rollout in production.
- **Change discipline:** changes to channel hierarchy, critical notification classification, or privacy rules require Product + Engineering Lead sign-off.
