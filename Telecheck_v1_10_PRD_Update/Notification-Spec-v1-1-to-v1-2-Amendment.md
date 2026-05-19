# Notification Spec v1.1 → v1.2 Amendment

**Version:** 0.1 DRAFT
**Status:** Pre-Codex-pre-ratification; Sprint 16 of autonomous 24h-loop work plan
**Authoring location:** `Telecheck_v1_10_PRD_Update/` (workstream folder; spec-corpus Track 2 deliverable)
**Owner:** AI Service Lead + Clinical Lead + SRE Lead (tri-owner per crisis-detection cross-channel propagation + I-019 platform floor scope)
**Companion documents:** `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Notification_Spec_v1_1.md` (target canonical surface); Sprint 9 AI Service Mode 1 Handler (I-019 crisis-signal-emitted Cat A trigger); Sprint 7 Cold-DR Runbook (partition-aware multi-region ACK channel for crisis signals); Sprint 8 Identity Spec v1.1 (SI-017 middleware-GUC + tenant-scoped notification preferences); Sprint 13 KMS Architecture (notification payload encryption at rest); Contracts Pack v5.2 CCR_RUNTIME (SMS provider per tenant); I-017 emergency-information-always-accessible invariant; I-019 crisis-detection-always-on invariant.
**Authority:** ratifier-targetable amendment to canonical Notification Spec; integrates cross-channel crisis-signal propagation + I-019/I-017 platform-floor enforcement + DR-survivable notification delivery + per-tenant SMS-provider selection via CCR.

---

## 1. Purpose + scope

This amendment integrates **five architectural shifts** into the canonical Notification Spec v1.1:

1. **Cross-channel crisis-signal propagation** — when Mode 1 (Sprint 9 §4.4) emits Cat A `ai.mode1.crisis_signal_emitted`, the notification subsystem MUST deliver crisis-response notifications across all available channels (push + SMS + email fallback) within the I-019 always-on platform floor.
2. **DR-survivable crisis-notification delivery** — crisis notifications are delivered via the canonical multi-region ACK channel topology per Sprint 7 Cold-DR Runbook; W=1 partition-degraded operation supported.
3. **Per-tenant SMS-provider selection via CCR_RUNTIME** — Twilio + Vonage + Africa's Talking + local providers per `tenant.sms_provider` CCR key (Ghana = Africa's Talking primary, Vonage fallback; US = Twilio primary, Vonage fallback).
4. **Notification payload encryption at rest** — notifications carrying PHI (medication reminders, lab results, clinician messages) encrypt the payload via Sprint 13 KMS hierarchy (`pii_conversation` data class).
5. **Crisis-notification override of patient quiet-hours + opt-out preferences** — per I-017 emergency-information-always-accessible, crisis notifications bypass quiet-hours + transactional-opt-out (NOT marketing-opt-out scope; this is clinical safety, not commercial communication).

**Out of scope (deferred):**
- Push-notification provider details (APNS / FCM token management; covered by Mobile App slice).
- Multilingual translation pipeline (covered by separate i18n SI).
- Notification analytics dashboards (Marketing Cockpit slice).
- Voice-call notifications (Phase 3+; v1.2 is text-only).

---

## 2. Amendment-delta summary (v1.1 → v1.2)

| v1.1 section | v1.2 amendment | Driver |
|---|---|---|
| §3 Notification channels | Amended: 4 channels (push + SMS + email + in-app); SMS provider now CCR-driven | Per-tenant SMS provider |
| §5 (NEW) Crisis-notification cross-channel propagation | NEW section | I-019 + Sprint 9 integration |
| §6 (NEW) DR-survivable delivery + multi-region ACK channel | NEW section | Sprint 7 Cold-DR integration |
| §7 (NEW) I-017 emergency override of quiet-hours + opt-out | NEW section | I-017 platform floor |
| §8 Notification preferences | Amended: opt-out scope clarified; crisis-notification exempt from transactional-opt-out | I-017 + opt-out semantics |
| §9 Payload encryption | Amended: PHI-bearing notifications use Sprint 13 KMS `pii_conversation` data class | KMS integration |
| §10 Audit | NEW events: `notification.crisis_dispatched` (Cat A), `notification.crisis_delivery_confirmed` (Cat A), `notification.crisis_delivery_failed` (Cat A), `notification.opt_out_override_for_emergency` (Cat A), `notification.dr_channel_degraded` (Cat B) | Cross-channel audit |
| §11 (NEW) Open questions for ratifier | NEW section | Ratifier-targetable scope |

---

## 3. Sub-decisions (ratifier-targetable units)

### Sub-decision 1 — Cross-channel crisis-notification propagation

**Decision shape:** when AI Service Mode 1 emits Cat A `ai.mode1.crisis_signal_emitted`:

1. The crisis-notification subsystem subscribes to the canonical Mode 1 crisis-emission event stream (per Sprint 9 §4.1).
2. On receipt, the subsystem dispatches crisis notifications across ALL configured channels for the patient:
   - **Push** (highest priority; lowest-latency delivery; <2s target).
   - **SMS** (fallback if push not acknowledged within 30s OR if patient has no active device).
   - **Email** (secondary fallback; for patients without phone OR if push+SMS both fail).
   - **In-app** (parallel; visible if patient opens app).
3. **Crisis-resource content includes:** local crisis-line phone (per `tenant.country_of_care` CCR), redirect link to in-app crisis resources, plain-language safety language per WHO crisis-line guidelines.
4. **Severity-tiered routing:**
   - `imminent_harm` / `self_harm`: ALL channels dispatched in parallel (do not wait for ACK); per-tenant operator notification triggered (Cat A `notification.crisis_operator_alert`).
   - `medical_emergency`: ALL channels dispatched in parallel; emergency-services-redirect resource content included.
5. **Idempotency:** the crisis-notification subsystem dedupes on `(tenant_id, patient_id, server_signal_id)`. The same crisis signal does not trigger duplicate notification dispatches even if the event is re-delivered (e.g., due to multi-region ACK channel replay).

### Sub-decision 2 — DR-survivable notification delivery via multi-region ACK channel

**Decision shape:** crisis-notification dispatch records ARE bound to the same DR-survivable multi-region ACK channel topology as Mode 1 crisis signals (per Sprint 7 Cold-DR Runbook).

**Two-state notification-delivery model (parallels Sprint 7's three-state per-device obligation model):**

| State | Meaning | Reconciliation |
|---|---|---|
| `dispatched` (quorum) | Both regions accepted the dispatch record; downstream provider invoked; awaiting delivery ACK | Standard delivery confirmation path |
| `dispatched_partition_degraded` | Only one region accepted dispatch record (partition operation); downstream provider invoked from surviving region; partition_degraded=true | Promoted to quorum on regional recovery + replication backfill; recorded as pending obligation in dispatch ledger |

**Per-notification audit:**
- `notification.crisis_dispatched` (Cat A; P1 keyed by patient_id) — emitted on each dispatch attempt; includes channel + partition_degraded flag.
- `notification.crisis_delivery_confirmed` (Cat A; P1 keyed by patient_id) — emitted when provider confirms delivery (provider webhook).
- `notification.crisis_delivery_failed` (Cat A; P1 keyed by patient_id) — emitted on terminal provider failure; triggers fallback channel (per Sub-decision 1 step 2).

**DR-failover crisis-notification continuity invariant:** during a declared regional outage, the notification subsystem in the surviving region continues dispatching crisis notifications under W=1 partition-degraded mode; the `dispatched_partition_degraded` records are reconciled on regional recovery. No crisis notification is silently lost.

### Sub-decision 3 — Per-tenant SMS-provider selection via CCR_RUNTIME

**Decision shape:** the SMS provider for each tenant is selected via `tenant.sms_provider_primary` + `tenant.sms_provider_fallback` CCR keys. Canonical providers per country:

| Country | Primary | Fallback |
|---|---|---|
| US (Telecheck-US / Heros Health DBA) | Twilio | Vonage |
| Ghana (Telecheck-Ghana / Heros Health Ghana DBA) | Africa's Talking | Vonage |

**Provider abstraction:** the notification handler invokes `sms.send(tenant_id, phone, message)`; the abstraction layer routes via CCR + handles provider-specific authentication + BAA-chain handling + per-tenant cost attribution. Provider failure triggers fallback per Sub-decision 1 step 2.

**Per-provider rate limiting:** each provider has its own per-tenant rate limit (Twilio = 100/sec/account; Africa's Talking = 30/sec/account); the notification subsystem implements token-bucket per provider per tenant. Crisis notifications get reserved bucket capacity (10% reserved for crisis).

### Sub-decision 4 — I-017 emergency override of quiet-hours + opt-out

**Decision shape:** crisis notifications BYPASS quiet-hours + transactional-opt-out preferences per I-017 emergency-information-always-accessible.

**Opt-out scope clarification:**

| Opt-out class | Scope | Crisis-notification override |
|---|---|---|
| Marketing opt-out | Commercial/marketing messages | NEVER overridden (separate scope) |
| Transactional opt-out | Routine clinical reminders (appointment reminders, refill reminders) | OVERRIDDEN by crisis (I-017) |
| Quiet-hours | Time-based delivery suppression (e.g., no notifications 10pm-7am) | OVERRIDDEN by crisis (I-017) |
| Channel-specific opt-out (e.g., "no SMS, only push") | Per-channel preference | Crisis dispatches ALL channels regardless |
| Account suspension | Patient account in non-active state | OVERRIDDEN by crisis (only crisis-class notifications dispatched; routine remain suspended) |

**Audit:** every crisis-notification override of a patient preference emits Cat A `notification.opt_out_override_for_emergency` event (P1 keyed by patient_id) recording which preference was overridden + the crisis-signal trigger.

**Marketing-opt-out preservation:** crisis notifications NEVER include marketing content; they include ONLY crisis-resource content. This preserves the marketing-opt-out boundary even under I-017 override.

### Sub-decision 5 — Notification payload encryption at rest

**Decision shape:** notification payloads carrying PHI (medication reminders, lab results, clinician messages, crisis-resource content with patient identifiers) are encrypted at rest using the Sprint 13 KMS hierarchy with `pii_conversation` data class.

**What gets encrypted:**
- The `payload_body_text` (the actual notification body).
- The `payload_template_args` (parameters for template-substitution; may contain PHI like dosage names).

**What does NOT get encrypted (operational metadata):**
- Channel + provider + timestamps.
- Cat A audit events' metadata (these have their own encryption per Sprint 13).
- Idempotency keys.

**Encryption-context binding:** `{ "tenant_id": "<tenant_id>", "data_class": "pii_conversation", "notification_id": "<id>" }`. The `notification_id` provides per-row binding to prevent ciphertext substitution.

**Delivery-time decryption:** the canonical delivery worker decrypts the payload at dispatch time + transmits the plaintext to the channel-provider (Twilio / FCM / APNS). The provider's transport security (TLS) is the canonical in-flight protection; the at-rest encryption protects the database + backup state.

### Sub-decision 6 — Crisis-notification undeliverable escalation

**Decision shape:** if all channels (push + SMS + email) fail to deliver a crisis notification within a 5-minute window, the failure triggers operator escalation:

1. Cat A `notification.crisis_undeliverable_5min` event emitted (P1 keyed by patient_id + P2 mirror keyed by 'platform' for SRE visibility).
2. The patient's tenant operator receives a P0 PagerDuty alert (per SIEM Spec §3 alerting taxonomy).
3. The operator's response procedure (out-of-band; phone outreach + caregiver contact + dispatch local welfare check if appropriate) is triggered.

**The 5-minute window is NOT extended under partition-degraded operation.** Partition operation still respects the 5-minute SLA; if surviving-region channels fail to deliver, operator escalation fires regardless of DR state.

---

## 4. Spec body amendments (v1.1 → v1.2 patch deltas)

### Delta 1 — Header status block

**v1.1:**
```
**Version:** 1.1
**Status:** Canonical for development
```

**v1.2:**
```
**Version:** 1.2
**Status:** Canonical for development (v1.1 → v1.2 amendment integrates cross-channel crisis-notification propagation + DR-survivable multi-region ACK delivery + per-tenant SMS provider via CCR + payload encryption at rest + I-017 emergency override of preferences)
```

### Delta 2 — §3 Notification channels

Existing 4-channel table extended with: `sms.provider` CCR-driven; per-channel reserved bucket capacity for crisis notifications.

### Delta 3 — §5 (NEW) Crisis-notification cross-channel propagation

Insertion: full Sub-decision 1 + Sub-decision 6 content.

### Delta 4 — §6 (NEW) DR-survivable delivery + multi-region ACK channel

Insertion: full Sub-decision 2 content.

### Delta 5 — §7 (NEW) I-017 emergency override of quiet-hours + opt-out

Insertion: full Sub-decision 4 content.

### Delta 6 — §8 Notification preferences (amended)

Existing preference structure preserved; new opt-out scope clarification table per Sub-decision 4.

### Delta 7 — §9 Payload encryption

Existing encryption-at-rest text replaced with Sprint 13 KMS hierarchy integration per Sub-decision 5.

### Delta 8 — §10 Audit (amended)

New events per Sub-decisions 1-6:

| Event | Category | Detail | Partition |
|---|---|---|---|
| `notification.crisis_dispatched` | A | tenant_id, patient_id, server_signal_id, channel, provider, partition_degraded | P1 keyed by patient_id |
| `notification.crisis_delivery_confirmed` | A | tenant_id, patient_id, server_signal_id, channel, provider, confirmed_at | P1 keyed by patient_id |
| `notification.crisis_delivery_failed` | A | tenant_id, patient_id, server_signal_id, channel, provider, failure_reason | P1 keyed by patient_id |
| `notification.opt_out_override_for_emergency` | A | tenant_id, patient_id, server_signal_id, overridden_preference_class | P1 keyed by patient_id |
| `notification.crisis_operator_alert` | A | tenant_id, patient_id, server_signal_id, alert_dispatched_at | P2 keyed by tenant_id |
| `notification.crisis_undeliverable_5min` | A | tenant_id, patient_id, server_signal_id, channels_attempted | P1 keyed by patient_id + P2 mirror keyed by 'platform' |
| `notification.dr_channel_degraded` | B | region, channel, partition_started_at | P2 keyed by 'platform' |

### Delta 9 — Document control (v1.2 entry)

> **v1.2** (2026-05-19) — Integrates cross-channel crisis-notification propagation (Mode 1 §4.1 trigger → push + SMS + email + in-app dispatch with severity-tiered routing) + DR-survivable multi-region ACK channel delivery (parallels Sprint 7 partition-aware semantics) + per-tenant SMS-provider via CCR (Twilio / Vonage / Africa's Talking) + payload encryption at rest via Sprint 13 KMS hierarchy (pii_conversation data class) + I-017 emergency override of quiet-hours + transactional-opt-out (marketing-opt-out scope preserved). Adds §§5, 6, 7 + §11. Amends §3 (channels), §8 (preferences), §9 (encryption), §10 (7 new audit events). v1.1 body preserved; v1.2 extends rather than rewrites.

---

## 5. Test coverage commitments

| Test ID | File location | CI job | Verifies | Section |
|---|---|---|---|---|
| Test N.1 | `apps/api-server/__integration__/notification/crisis_cross_channel.test.ts` | `integration-notification` | Mode 1 emits crisis_signal → notification subsystem dispatches push + SMS + in-app in parallel; Cat A audit chain complete | §3 SD1 |
| Test N.2 | `apps/api-server/__integration__/notification/crisis_severity_tiered_routing.test.ts` | `integration-notification` | severity=imminent_harm → operator-alert Cat A event emitted; severity=medical_emergency → emergency-services-redirect content included | §3 SD1 |
| Test N.3 | `apps/api-server/__integration__/notification/crisis_dedup.test.ts` | `integration-notification` | Same crisis signal re-delivered (multi-region ACK replay) → notification dispatched once per channel; idempotency keyed by (tenant_id, patient_id, server_signal_id) | §3 SD1 |
| Test N.4 | `apps/api-server/__integration__/notification/crisis_quiet_hours_override.test.ts` | `integration-notification` | Patient in 10pm-7am quiet-hours window → crisis notification dispatches anyway + Cat A `opt_out_override_for_emergency` event | §3 SD4 |
| Test N.5 | `apps/api-server/__integration__/notification/crisis_transactional_optout_override.test.ts` | `integration-notification` | Patient opted out of transactional SMS → crisis SMS dispatches anyway + override audit | §3 SD4 |
| Test N.6 | `apps/api-server/__integration__/notification/crisis_marketing_optout_preserved.test.ts` | `integration-notification` | Patient with marketing opt-out → no marketing content in crisis notification; crisis-resource content only | §3 SD4 |
| Test N.7 | `apps/api-server/__integration__/notification/sms_provider_routing.test.ts` | `integration-notification` | Tenant.sms_provider_primary=Twilio → SMS dispatched via Twilio; primary failure → Vonage fallback automatically | §3 SD3 |
| Test N.8 | `apps/api-server/__integration__/notification/sms_provider_ccr_ghana.test.ts` | `integration-notification` | Telecheck-Ghana tenant → Africa's Talking primary; primary failure → Vonage fallback | §3 SD3 |
| Test N.9 | `apps/api-server/__integration__/notification/payload_encryption_at_rest.test.ts` | `integration-notification` | PHI-bearing notification payload encrypted at rest via Sprint 13 KMS pii_conversation; delivery decrypts at dispatch; database inspection confirms ciphertext | §3 SD5 |
| Test N.10 | `apps/api-server/__integration__/notification/crisis_undeliverable_escalation.test.ts` | `integration-notification` | All channels fail to deliver crisis within 5min → Cat A `crisis_undeliverable_5min` + P0 PagerDuty operator alert | §3 SD6 |
| Test N.11 | `apps/api-server/__integration__/notification/crisis_dr_partition_degraded.test.ts` | `integration-notification` | Simulated regional outage → crisis dispatch records with partition_degraded=true; surviving region delivers; reconciliation on recovery promotes to quorum | §3 SD2 |
| Test N.12 | `apps/api-server/__integration__/notification/crisis_rate_limit_reservation.test.ts` | `integration-notification` | Tenant SMS provider rate-limit saturated by routine notifications → crisis notification still dispatches via reserved 10% bucket | §3 SD3 |
| Test N.13 | `tools/static-analyzer/tests/notification-encryption-context.test.ts` | `static-analyzer` | Notification payload encrypt/decrypt missing canonical encryption context (tenant_id + data_class + notification_id) → rule TLC-NOTIFICATION-001 fails | §3 SD5 |
| Test N.14 | `tools/static-analyzer/tests/notification-crisis-must-bypass-preferences.test.ts` | `static-analyzer` | Crisis-dispatch code path that checks quiet-hours / transactional-opt-out → rule TLC-NOTIFICATION-002 fails (crisis MUST bypass these) | §3 SD4 |

**Static-analyzer rule IDs registered:**
- `TLC-NOTIFICATION-001` — Notification payload encrypt/decrypt missing canonical encryption context with notification_id binding.
- `TLC-NOTIFICATION-002` — Crisis-notification dispatch path checking quiet-hours / transactional-opt-out (must bypass per I-017).
- `TLC-NOTIFICATION-003` — Crisis-notification dispatch missing reserved-bucket-capacity routing (must use crisis-reserved bucket).

---

## 6. Open questions for ratifier

1. **OQ1 — Crisis-notification idempotency key scope.** Recommendation: dedupe on `(tenant_id, patient_id, server_signal_id)` per Sprint 9 §4.1. Re-dispatch on same signal_id within a 24h window suppressed; after 24h, dispatch allowed. Ratifier confirms 24h window.
2. **OQ2 — Operator escalation 5-minute SLA tolerance.** Recommendation: 5min fixed; not partition-extended. Ratifier confirms.
3. **OQ3 — Marketing-opt-out boundary verification mechanism.** Recommendation: static-analyzer rule + content-policy review; crisis-resource content must pass content-policy review for crisis-line-only language; no marketing-tracking pixels or promotional URLs. Ratifier confirms scope.
4. **OQ4 — `tenant.sms_provider_primary` + `tenant.sms_provider_fallback` CCR key activation.** Cross-references Contracts Pack v5.2 CCR_RUNTIME extension; ratifier confirms.
5. **OQ5 — DR-failover notification-provider continuity.** Recommendation: SMS providers (Twilio + Vonage + Africa's Talking) are globally accessible from both us-east-1 + us-west-2; no DR-specific provider routing needed. Push providers (APNS + FCM) similarly global. Ratifier confirms.
6. **OQ6 — Notification-payload encryption rotation under DR.** Cross-references Sprint 13 KMS Architecture §6.4 versioned DEK reads; ratifier confirms notification payload encrypted at rest follows same versioned-read semantics.
7. **OQ7 — Codex pre-ratification target.** Recommendation: 3-4 rounds.

---

## 7. Cross-SI alignment summary

| Cross-SI surface | Notification v1.2 surface | Relationship |
|---|---|---|
| Sprint 9 AI Service Mode 1 Handler | §3 SD1 crisis-signal-emitted subscriber | Crisis-notification subsystem subscribes to Mode 1 Cat A event stream |
| Sprint 7 Cold-DR Runbook | §3 SD2 DR-survivable multi-region ACK | Parallel two-state dispatched / dispatched_partition_degraded model |
| Sprint 8 Identity Spec v1.1 | §3 SD3 RLS + tenant-scoped preferences | Notification handler downstream of canonical middleware-GUC; per-tenant preferences RLS-bound |
| Sprint 13 KMS Architecture | §3 SD5 payload encryption at rest (pii_conversation) | Sprint 13 KMS hierarchy + encryption context with notification_id binding |
| SIEM Spec (Sprint 6) | §3 SD6 operator P0 PagerDuty alerts | SIEM canonical alerting taxonomy for crisis-undeliverable escalation |
| I-017 emergency-information-always-accessible | §3 SD4 quiet-hours + transactional-opt-out override | I-017 platform-floor enforcement at notification layer |
| I-019 crisis-detection-always-on | §3 SD1 + SD2 + SD6 cross-channel + DR-survivable + 5min undeliverable escalation | I-019 enforcement at notification-delivery boundary |
| ADR-026 single-region+cold-DR | §3 SD2 + §3 SD5 multi-region ACK + DEK rotation | Notification architecture inherits the regional posture |

---

## 8. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; awaiting Codex R1.

---

— Claude (Opus 4.7, 1M context), Notification Spec v1.1 → v1.2 amendment v0.1 DRAFT authored 2026-05-19 under "continue 24 hrs / no more resting" autonomous-work authorization. Sprint 16 of the 24h-loop work plan. Track 2 spec-corpus deliverable. Integrates cross-channel crisis-notification propagation + DR-survivable multi-region ACK delivery + per-tenant SMS provider via CCR + payload encryption at rest + I-017 emergency override of preferences. Companion to Sprint 9 AI Service Mode 1 + Sprint 7 Cold-DR + Sprint 8 Identity v1.1 + Sprint 13 KMS Architecture + SIEM Spec (Sprint 6).
