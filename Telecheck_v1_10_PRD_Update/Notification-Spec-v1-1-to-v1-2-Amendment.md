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
5. **Idempotency + canonical dispatch ledger (R1 HIGH-1 closure):** the crisis-notification subsystem dedupes via a canonical dispatch ledger keyed at the (tenant + patient + signal + channel) granularity:

```sql
-- Channel-scoped obligation: one row per (signal, channel); represents the canonical
-- "must deliver to this channel" obligation. State summarizes across all provider attempts.
CREATE TABLE notification_crisis_dispatch_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                  -- = notification_id; encryption-context binding key
    tenant_id tenant_id_t NOT NULL,
    patient_id UUID NOT NULL,
    server_signal_id UUID NOT NULL,                                 -- From Mode 1 ai.mode1.crisis_signal_emitted
    channel TEXT NOT NULL,                                          -- 'push' | 'sms' | 'email' | 'in_app'
    severity TEXT NOT NULL,
    dispatch_obligation_state TEXT NOT NULL,                        -- See R1 HIGH-2 closure state machine §3 SD2
    CONSTRAINT notification_crisis_dispatch_ledger_unique
        UNIQUE (tenant_id, patient_id, server_signal_id, channel)
);

-- Per-provider-attempt detail (R2 HIGH closure: distinct provider invocations within the same channel obligation).
-- An SMS channel obligation with primary=Twilio → fallback=Vonage produces TWO attempt rows;
-- the channel-obligation state aggregates over these attempts.
CREATE TABLE notification_crisis_provider_attempt (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    notification_id UUID NOT NULL REFERENCES notification_crisis_dispatch_ledger(id),
    provider TEXT NOT NULL,                                         -- 'twilio' | 'vonage' | 'africas_talking' | 'fcm' | 'apns' | 'ses'
    attempt_seq INT NOT NULL,                                       -- 1 = primary; 2 = fallback; 3 = secondary fallback
    provider_request_id TEXT,                                       -- Set once provider invocation completes (request-id from provider response)
    attempt_state TEXT NOT NULL,                                    -- 'pending' | 'invoked' | 'delivered' | 'failed' | 'reconciled'
    invoked_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    CONSTRAINT notification_crisis_provider_attempt_unique
        UNIQUE (notification_id, provider, attempt_seq)
);
```

**Per-attempt semantics (R2 HIGH closure):**

- The channel-obligation row in `notification_crisis_dispatch_ledger` represents the canonical "must deliver to this channel"; it is created once per (signal, channel) and its `dispatch_obligation_state` aggregates across all provider attempts on the same channel.
- Each provider invocation (primary OR fallback OR secondary-fallback) is a row in `notification_crisis_provider_attempt`. The `attempt_seq` is monotonic per `notification_id`; `attempt_seq=1` is the primary provider; `attempt_seq=2` is the first fallback; etc.
- The aggregated channel state transitions:
  - Any attempt reaches `delivered` → channel obligation transitions to `delivery_confirmed`.
  - All attempts terminal-failed AND no further fallback providers configured → channel obligation transitions to `terminal_failed`.
  - At least one attempt in `pending`/`invoked` → channel obligation in `provider_invocation_pending`/`provider_invoked` accordingly.
- Provider webhook reconciliation matches by `provider_request_id` on the specific `notification_crisis_provider_attempt` row. Duplicate webhook arrivals dedup against `attempt_state IN ('delivered', 'failed')`.

**SMS primary→fallback flow (concrete R2 HIGH closure):**

1. Crisis-notification subsystem creates the channel-obligation row for `channel='sms'` (notification_id=N, state='accepted').
2. Attempt-1 invokes Twilio: `notification_crisis_provider_attempt` row with `(notification_id=N, provider='twilio', attempt_seq=1, attempt_state='invoked', provider_request_id=...)`. Channel obligation transitions to `provider_invoked`.
3. Twilio returns terminal failure (provider 5xx OR webhook delivery_failed): attempt-1 row transitions to `failed`.
4. Crisis-notification subsystem creates attempt-2 invoking Vonage: `(notification_id=N, provider='vonage', attempt_seq=2, attempt_state='invoked', provider_request_id=...)`. Channel obligation REMAINS in `provider_invoked` (still in flight via fallback).
5. Vonage delivers: attempt-2 row transitions to `delivered`; channel obligation transitions to `delivery_confirmed`.

The channel-obligation UNIQUE constraint is preserved (one row per signal+channel); the provider-attempts table captures the multi-attempt path within the same channel obligation.

**Audit:** every `notification_crisis_provider_attempt` state transition emits Cat A `notification.provider_attempt_state_transition` event (P1 keyed by patient_id) with attempt_seq + provider + state. The aggregated channel-obligation state transitions also emit Cat A per §3 SD2 state machine.

The UNIQUE constraint on `(tenant_id, patient_id, server_signal_id, channel)` is the canonical dedup. Re-delivery of the same signal_id from multi-region ACK channel replay attempts to INSERT a row with the same key + fails with conflict → the second attempt looks up the existing `notification_id` + treats the operation as a no-op.

**Encryption-context binding (cross-references §3 SD5):** the notification's `payload_body` encryption-context includes `notification_id` from this ledger row, NOT the server_signal_id directly. This means encryption-context binding is per-channel (one notification_id per channel per signal), which prevents channel-payload cross-contamination from ledger-key collisions.

**24h re-dispatch window (R3 HIGH closure: re-dispatch reuses existing notification_id with new provider_attempt rows):**

The canonical ledger UNIQUE constraint on `(tenant_id, patient_id, server_signal_id, channel)` is preserved as the canonical dedup. Re-dispatch within 24h of terminal failure does NOT create a new ledger row — instead, it adds new rows to `notification_crisis_provider_attempt` under the same `notification_id` and transitions the channel-obligation state machine back from `terminal_failed` to `accepted` (representing the re-dispatch).

**Canonical re-dispatch flow:**

1. Initial dispatch: `notification_id=N` ledger row created (channel=sms, state=accepted). Provider attempts: attempt_seq=1 (Twilio), attempt_seq=2 (Vonage). Both terminal_failed.
2. Channel-obligation transitions to `terminal_failed`.
3. **Within 24h of terminal_failed:** a re-dispatch trigger (e.g., operator-initiated retry; OR client-driven retry per OQ1 ratifier decision) updates the SAME ledger row's `dispatch_obligation_state` from `terminal_failed` → `accepted` (re-dispatch admission); a new provider attempt row is created with `attempt_seq=3` (next available; e.g., re-trying primary Twilio after recovery).
4. Re-dispatch follows the standard state machine (provider_invocation_pending → provider_invoked → delivery_confirmed or terminal_failed).
5. Cat A `notification.crisis_redispatch_admitted` event emitted (P1 keyed by patient_id) recording the redispatch_at + redispatch_trigger reason.

**Beyond 24h:** re-dispatch is forbidden for the same `(signal_id, channel)`. A new server_signal_id (i.e., Mode 1 re-detection by the AI Service) is required to re-dispatch. The 24h window prevents operator-driven retry loops; beyond the window, the assumption is the original crisis state has evolved + a fresh detection is appropriate.

**State machine extension:** `terminal_failed → accepted` is the canonical re-dispatch transition. The state transitions are append-only audited per Cat A `notification.crisis_state_transition` events (state machine is fully reconstructable from the audit chain).

**Audit:** every redispatch admission emits Cat A `notification.crisis_redispatch_admitted` with `redispatch_count` (1 for first redispatch, 2 for second within the same 24h window, etc.) + `redispatch_trigger` (`operator_initiated` | `client_retry` | `automated_retry`).

### Sub-decision 2 — DR-survivable notification delivery via multi-region ACK channel

**Decision shape:** crisis-notification dispatch records ARE bound to the same DR-survivable multi-region ACK channel topology as Mode 1 crisis signals (per Sprint 7 Cold-DR Runbook).

**Full notification-delivery state machine (R1 HIGH-2 closure: faithful to Sprint 7 obligation model):**

The `dispatch_obligation_state` field on `notification_crisis_dispatch_ledger` transitions through:

| State | Meaning | Next states |
|---|---|---|
| `accepted` | Ledger row INSERTed (canonical key acquired); not yet enqueued to provider | `accepted_partition_degraded` (under partition) OR `provider_invocation_pending` |
| `accepted_partition_degraded` | Ledger row accepted in W=1 partition mode (only one region); awaiting cross-region replication backfill | `accepted` (post-replication promotion) OR `provider_invocation_pending` (surviving region continues without waiting) |
| `provider_invocation_pending` | Dispatch enqueued to provider abstraction (Twilio/Vonage/FCM/APNS); awaiting provider invocation completion | `provider_invoked` OR `provider_invocation_failed` |
| `provider_invoked` | Provider HTTP request succeeded (provider accepted dispatch); awaiting delivery confirmation webhook | `delivery_confirmed` OR `terminal_failed` (provider rejected) |
| `delivery_confirmed` | Provider webhook confirmed delivery to device/recipient | TERMINAL (delivered) |
| `provider_invocation_failed` | Provider HTTP request failed; eligible for fallback channel (per §3 SD1 step 2) | `accepted` (re-dispatch via fallback channel; NEW ledger row per channel) |
| `terminal_failed` | All channels exhausted; non-deliverable | TERMINAL (failed) → triggers 5-min escalation per §3 SD6 |
| `reconciled` | Post-DR-failover reconciliation matched a partition-degraded row to its provider-webhook outcome | TERMINAL (matched to delivery_confirmed/terminal_failed via reconciliation) |

**Idempotency across regions:**
- `accepted` + `accepted_partition_degraded` are idempotent (UNIQUE constraint per §3 SD1 step 5 dedups).
- `provider_invocation_pending` → `provider_invoked` transition records the canonical provider request-id; webhook reconciliation matches on request-id, NOT on ledger key.
- Duplicate webhook arrivals (e.g., provider retries OR DR reconciliation) match the same request-id + are no-ops past `delivery_confirmed`.

**Cross-region reconciliation pass (post-failover; matches Sprint 7 §"Three-state reconciliation"):**
1. Surviving region's reconciliation worker reads ledger rows in `accepted_partition_degraded` state.
2. For each: queries the provider's API for the dispatch-request-id outcome (if provider supports query) OR awaits provider's webhook (some providers always webhook regardless of region).
3. Updates the ledger row to `reconciled` referencing the matched delivery outcome.
4. Cat A `notification.crisis_dispatch_reconciled` event emitted with reconciliation provenance.

**Audit:** state transitions emit Cat A `notification.crisis_state_transition` per transition (P1 keyed by patient_id; per state-machine boundary).

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

**Per-provider rate limiting + dual-bucket reservation (R1 MED-1 closure: starvation-proof):**

Each provider has its own per-tenant rate limit (Twilio = 100/sec/account; Africa's Talking = 30/sec/account). The notification subsystem maintains TWO independent token buckets per (tenant, provider, region):

| Bucket | Capacity | Consumed by | Borrowable? |
|---|---|---|---|
| Routine bucket | 90% of provider rate limit | Routine notifications (appointment reminders, refill reminders, medication reminders, clinician messages) | NEVER consumed by crisis (crisis has its own bucket); routine cannot consume crisis bucket either |
| Crisis bucket | 10% of provider rate limit (reserved) | Crisis notifications ONLY | Crisis MAY ALSO consume from routine bucket if crisis bucket exhausted (crisis can borrow routine; routine cannot borrow crisis) |

**Starvation prevention guarantees:**
- A burst of routine traffic that saturates the routine bucket CANNOT drain the crisis bucket; the crisis bucket has dedicated 10% capacity reserved exclusively for crisis notifications.
- If the crisis bucket is also saturated (unusual; would require massive crisis volume): crisis MAY borrow from the routine bucket. Routine traffic temporarily blocks (429 → retry-with-backoff at the routine notification layer).
- The dual-bucket model applies per (tenant, provider, region); fallback-provider routing (Twilio → Vonage failure cascade) reserves the same 10% crisis capacity on Vonage.

**Implementation note:** the canonical token-bucket implementation uses Redis (per-region) with cross-region sync via the multi-region ACK channel for per-tenant cumulative bucket state. The 30-second polling cadence of the bucket-sync worker is the canonical lag tolerance; under DR partition, bucket state is region-local until reconciliation.

**Audit:** every crisis notification's bucket consumption emits Cat C `notification.crisis_bucket_consumed` event with `bucket_used = {'crisis_reserved' | 'borrowed_routine'}`. SRE alerts on sustained `borrowed_routine` consumption (indicates crisis-volume regression beyond reserved capacity).

### Sub-decision 4 — I-017 emergency override of quiet-hours + opt-out

**Decision shape:** crisis notifications BYPASS quiet-hours + transactional-opt-out preferences per I-017 emergency-information-always-accessible.

**Opt-out scope clarification:**

| Opt-out class | Scope | Crisis-notification override |
|---|---|---|
| Marketing opt-out | Commercial/marketing messages | NEVER overridden (separate scope) |
| Transactional opt-out | Routine clinical reminders (appointment reminders, refill reminders) | OVERRIDDEN by crisis (I-017) |
| Quiet-hours | Time-based delivery suppression (e.g., no notifications 10pm-7am) | OVERRIDDEN by crisis (I-017) |
| Channel-specific opt-out (e.g., "no SMS, only push") | Per-channel preference | Crisis dispatches ALL channels regardless |
| Account suspension (per R1 MED-2 closure: enumerated reasons) | Patient account in non-active state | OVERRIDE varies by suspension reason — see below |

**Account suspension override scope (R1 MED-2 closure):** the term "account suspension" covers heterogeneous reason classes; crisis-notification override applies ONLY to specific reason classes:

| Suspension reason | Crisis-notification override |
|---|---|
| `payment_overdue` | OVERRIDDEN (clinical safety > commercial collection) |
| `inactivity_period` | OVERRIDDEN (auto-suspension on long inactivity; crisis re-engages) |
| `voluntary_pause` | OVERRIDDEN (patient self-paused; crisis safety floor remains) |
| `clinician_holding_for_review` | OVERRIDDEN (clinical-side hold; crisis safety floor remains) |
| `abuse_or_fraud` | NOT OVERRIDDEN (account flagged for abuse; no automated outreach including crisis; operator-initiated welfare check only) |
| `legal_hold_or_subpoena` | NOT OVERRIDDEN (regulatory/legal block on automated communications; operator-initiated welfare check only per legal directive) |
| `identity_compromise_investigation` | NOT OVERRIDDEN (account potentially compromised; automated outreach to a compromised contact path is unsafe; operator-initiated direct contact via verified channel) |
| `deceased_patient` | NOT OVERRIDDEN (no automated outreach; case routed to estate-handling procedure) |
| `tenant_offboarding` | NOT OVERRIDDEN (tenant-level state; patient is no longer under tenant's active care; operator-handled transition) |

**Audit:** every crisis-notification dispatch decision affected by suspension status emits Cat A `notification.suspension_crisis_decision` event recording the suspension_reason + the decision outcome. Operator-initiated alternative welfare-check paths emit their own Cat A audit per the operator procedure.

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

**Decision shape (R1 HIGH-3 closure: persisted deadline + surviving-region ownership + idempotent escalation):**

If all channels (push + SMS + email) fail to deliver a crisis notification within a 5-minute window, the failure triggers operator escalation. The escalation mechanism uses a **persisted deadline + idempotent escalation key** to survive DR partition + region failover:

```sql
-- One row per (tenant + patient + server_signal_id); created at the FIRST crisis dispatch
CREATE TABLE notification_crisis_escalation_obligation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    patient_id UUID NOT NULL,
    server_signal_id UUID NOT NULL,
    first_dispatched_at TIMESTAMPTZ NOT NULL,
    undeliverable_deadline_at TIMESTAMPTZ NOT NULL,                 -- = first_dispatched_at + 5min
    escalation_state TEXT NOT NULL,                                 -- 'pending' | 'escalated' | 'pre_empted_by_delivery'
    escalated_at TIMESTAMPTZ,
    escalation_key UUID NOT NULL DEFAULT gen_random_uuid(),         -- Idempotency key for PagerDuty webhook
    CONSTRAINT notification_crisis_escalation_unique UNIQUE (tenant_id, patient_id, server_signal_id)
);
```

**Deadline ownership + monotonicity:**
- The `undeliverable_deadline_at` is set ONCE at the first dispatch (per signal_id) and NEVER extended. The 5-minute window is canonical regardless of DR state.
- The deadline is evaluated by a polling worker that runs in the canonical PRIMARY region (us-east-1 under normal operation; us-west-2 under active DR). Polling cadence: every 30 seconds.
- Under partition-degraded operation, the polling worker in the surviving region takes over deadline evaluation; the `escalation_key` is the canonical idempotency key — even if both regions briefly poll simultaneously during failover, PagerDuty webhook dedup on `escalation_key` ensures exactly-once escalation.

**Escalation decision logic (polling worker):**
1. SELECT rows WHERE `escalation_state = 'pending' AND undeliverable_deadline_at <= now()`.
2. For each: check `notification_crisis_dispatch_ledger` for any `delivery_confirmed` state per channel for the same signal_id.
3. If ANY channel confirmed delivery: transition to `pre_empted_by_delivery`; no escalation.
4. If NO channel confirmed: invoke PagerDuty webhook with the `escalation_key` as the canonical dedup key; transition to `escalated` on webhook 2xx response; Cat A `notification.crisis_undeliverable_5min` emitted (P1 keyed by patient_id + P2 mirror keyed by 'platform').
5. On webhook failure: retry with exponential backoff up to 10 attempts; after 10: emit Cat A `notification.crisis_escalation_failed` (P2 keyed by 'platform') + add to dead-letter queue for SRE triage.

**Webhook-loss behavior (R1 HIGH-3 closure):** if the provider's delivery-confirmation webhook is lost (e.g., webhook endpoint outage), the affected ledger rows remain in `provider_invoked` past the 5-minute deadline. The escalation polling worker treats `provider_invoked` (no `delivery_confirmed`) as "not delivered" → escalation fires. This is the canonical fail-safe: webhook loss → operator escalation (not silent skip).

**The 5-minute window is NOT extended under partition-degraded operation.** Partition operation still respects the 5-minute SLA; if surviving-region channels fail to deliver OR if provider webhooks are unreachable, operator escalation fires regardless of DR state. The persisted `undeliverable_deadline_at` survives the failover; the surviving region's polling worker takes ownership seamlessly.

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
| Test N.3 | `apps/api-server/__integration__/notification/crisis_dedup.test.ts` | `integration-notification` | Same crisis signal re-delivered (multi-region ACK replay) → notification ledger row stays single per channel; idempotency keyed by (tenant_id, patient_id, server_signal_id, channel); re-delivery is no-op | §3 SD1 |
| Test N.3b | `apps/api-server/__integration__/notification/crisis_redispatch_within_24h.test.ts` | `integration-notification` | Terminal-failed channel obligation re-dispatched within 24h → SAME ledger row's state transitions terminal_failed → accepted; new provider_attempt row with attempt_seq=3 created; Cat A `crisis_redispatch_admitted` event (R3 HIGH closure) | §3 SD1 |
| Test N.3c | `apps/api-server/__integration__/notification/crisis_redispatch_beyond_24h.test.ts` | `integration-notification` | Re-dispatch attempt beyond 24h of terminal_failed → rejected; requires fresh server_signal_id for new ledger row (R3 HIGH closure) | §3 SD1 |
| Test N.4 | `apps/api-server/__integration__/notification/crisis_quiet_hours_override.test.ts` | `integration-notification` | Patient in 10pm-7am quiet-hours window → crisis notification dispatches anyway + Cat A `opt_out_override_for_emergency` event | §3 SD4 |
| Test N.5 | `apps/api-server/__integration__/notification/crisis_transactional_optout_override.test.ts` | `integration-notification` | Patient opted out of transactional SMS → crisis SMS dispatches anyway + override audit | §3 SD4 |
| Test N.6 | `apps/api-server/__integration__/notification/crisis_marketing_optout_preserved.test.ts` | `integration-notification` | Patient with marketing opt-out → no marketing content in crisis notification; crisis-resource content only | §3 SD4 |
| Test N.7 | `apps/api-server/__integration__/notification/sms_provider_routing.test.ts` | `integration-notification` | Tenant.sms_provider_primary=Twilio → SMS dispatched via Twilio (attempt_seq=1); Twilio terminal failure → Vonage fallback as attempt_seq=2 ROW under the SAME channel-obligation row; both attempts audited; channel obligation transitions delivery_confirmed on Vonage success (R2 HIGH closure) | §3 SD3 |
| Test N.8 | `apps/api-server/__integration__/notification/sms_provider_ccr_ghana.test.ts` | `integration-notification` | Telecheck-Ghana tenant → Africa's Talking attempt_seq=1; primary failure → Vonage attempt_seq=2; channel obligation UNIQUE constraint preserved (R2 HIGH closure) | §3 SD3 |
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

**v0.1 R1 closure 2026-05-19:** 3 HIGH + 2 MED closed inline:

| Round | Findings | Status |
|---|---|---|
| R1 | HIGH-1 idempotency key not bound to notification row (encryption-context collision risk); HIGH-2 two-state DR model missing intermediate reconciliation states (Sprint 7 three-state parallel incomplete); HIGH-3 5-min undeliverable SLA lacked persisted deadline + surviving-region ownership + idempotent escalation key; MED-1 reserved-bucket vague (starvation risk); MED-2 account suspension blanket override overreach | All 5 closed inline |

**R1 closure pattern recap:**
- HIGH-1: canonical `notification_crisis_dispatch_ledger` table with UNIQUE on `(tenant_id, patient_id, server_signal_id, channel)` → notification_id; encryption-context binds to notification_id (per-channel), preventing cross-channel payload contamination.
- HIGH-2: 8-state machine (accepted / accepted_partition_degraded / provider_invocation_pending / provider_invoked / delivery_confirmed / provider_invocation_failed / terminal_failed / reconciled) parallels Sprint 7's full obligation model; cross-region reconciliation pass for partition-degraded rows; webhook-loss = failure-to-confirm (canonical fail-safe).
- HIGH-3: `notification_crisis_escalation_obligation` table with persisted `undeliverable_deadline_at` + `escalation_key` UUID for idempotency; surviving-region polling worker takes ownership seamlessly under DR; webhook loss → escalation fires (fail-safe).
- MED-1: dual-bucket per (tenant, provider, region) with 10% reserved crisis bucket; routine CANNOT consume crisis; crisis CAN borrow routine; fallback-provider preserves 10% reservation.
- MED-2: 9 enumerated suspension reasons with per-reason override decision (`payment_overdue` / `inactivity` / `voluntary_pause` / `clinician_hold` overridden; `abuse_or_fraud` / `legal_hold` / `identity_compromise` / `deceased` / `tenant_offboarding` NOT overridden — operator-initiated alternative paths instead).

No architectural-judgment items closed inline; CLAUDE.md hard-floor item 6 honored. 7 known OQs remain ratifier-targetable.

**v0.1 R2 closure 2026-05-19:** 1 HIGH closed inline — SMS primary→fallback within the same `sms` channel conflicted with the channel-scoped UNIQUE constraint on `notification_crisis_dispatch_ledger`. R2 closure: added `notification_crisis_provider_attempt` child table keyed by `(notification_id, provider, attempt_seq)` to capture distinct provider invocations within the same channel obligation. Channel-obligation row remains UNIQUE per (signal, channel); aggregated state transitions across attempts. Tests N.7 + N.8 updated to verify attempt_seq=1 → attempt_seq=2 flow on primary-provider failure.

| Round | Findings | Status |
|---|---|---|
| R2 | HIGH SMS provider fallback conflict with channel-scoped UNIQUE constraint (same `sms` channel can't have two ledger rows; primary→Vonage fallback semantics impossible to represent) | Closed inline by splitting provider attempts into `notification_crisis_provider_attempt` child table keyed by `(notification_id, provider, attempt_seq)`; channel obligation aggregates across attempts |
| R3 | HIGH 24h same-signal re-dispatch contradiction (R1 closure said "NEW notification_id" but UNIQUE constraint forbids this) | Closed inline by reusing existing notification_id; re-dispatch transitions channel-obligation state machine from `terminal_failed` → `accepted` and adds new provider_attempt rows. Beyond 24h: new server_signal_id (Mode 1 re-detection) required. Cat A `crisis_redispatch_admitted` event added |

---

— Claude (Opus 4.7, 1M context), Notification Spec v1.1 → v1.2 amendment v0.1 DRAFT authored 2026-05-19 under "continue 24 hrs / no more resting" autonomous-work authorization. Sprint 16 of the 24h-loop work plan. Track 2 spec-corpus deliverable. Integrates cross-channel crisis-notification propagation + DR-survivable multi-region ACK delivery + per-tenant SMS provider via CCR + payload encryption at rest + I-017 emergency override of preferences. Companion to Sprint 9 AI Service Mode 1 + Sprint 7 Cold-DR + Sprint 8 Identity v1.1 + Sprint 13 KMS Architecture + SIEM Spec (Sprint 6).
