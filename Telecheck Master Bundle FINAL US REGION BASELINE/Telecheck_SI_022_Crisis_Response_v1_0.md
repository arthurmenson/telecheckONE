# SI-022 — Crisis Response Slice (Resource Lookup + Escalation Routing) Spec v1.0

**Version:** 0.11 DRAFT
**Status:** POST-R10 (1 HIGH closed inline: R10 HIGH-1 no-ack sweep didn't exclude acknowledged/resolved lifecycle states — an already-acknowledged event whose obligation row was not terminalized would have been picked up by the sweep and attempted an invalid `acknowledged → escalated` transition (rolled-back transaction) OR escalated despite acknowledgement (wedging timer noise). Fix: added two-layer protection — (1) PRIMARY: terminalization contract requires `record_crisis_acknowledgement_claim()` + `record_crisis_response()` + `record_crisis_resolution()` wrappers to atomically set `escalation_tier = NULL` on the corresponding obligation row (BEFORE UPDATE trigger allows ONLY sweep-cycle tier advances or terminalization to NULL); (2) BACKSTOP: sweep predicate adds LATERAL JOIN against crisis_event_lifecycle_transition + filter `current_state IN ('detected', 'escalated')` so missed terminalizations cannot cause invalid transition attempts. Added 4 sub-tests 16a-d for terminalization-per-wrapper + lifecycle-eligibility backstop. Test count: 16 → 17 (16 expanded into 16a-d sub-cluster + #17 contention benchmark). Previously POST-R9 (1 HIGH closed inline: R9 HIGH-1 Sub-decision 4 lifecycle diagram still enumerated only 8 transition triples (omitted the 9th `escalated → escalated` triple added at R8 closure to §6 + Sub-decision 6) — implementer using Sub-decision 4 as state-machine source could have shipped the old 8-transition CHECK + rejected sweep #2 + #3 (the exact R8 failure scenario). Fix: added `escalated → escalated (tier_progression_no_acknowledgement)` to Sub-decision 4 diagram + updated "9 allowed triples" count with explicit R9 closure cross-reference to §6 + Sub-decision 6 STEP 1. All three normative state-machine locations now enumerate the same 9 triples. Previously POST-R8 (1 HIGH closed inline: R8 HIGH-1 multi-tier sweep tries to INSERT `escalated → escalated` lifecycle transitions but the state-machine transition triples table only permitted `detected → escalated` + `responded → escalated` (initial transitions into escalated); subsequent tier advances on sweep #2 + #3 would have failed CHECK constraint, rolling back the sweep transaction + wedging clinical_on_call/regulatory tier progression permanently — the exact R6 HIGH-1 failure mode resurfaced through a different mechanism (state-machine, not escalation_key). Fix: added 9th transition triple `escalated → escalated` with reason `tier_progression_no_acknowledgement` for multi-tier sweep advances; updated Sub-decision 6 STEP 1 normative contract to switch transition reason by current state ('no_acknowledgement_timeout' from 'detected', 'tier_progression_no_acknowledgement' from 'escalated'); updated state-machine §6 transition triples table to 9 enumerated triples. Previously POST-R7 (1 HIGH + 1 MED closed inline: R7 HIGH-1 Sub-decision 6 prose was the authoritative normative timer contract but still specified the pre-R6 one-shot escalation_key model (select where escalation_key IS NULL; set escalation_key one-way mutable; stop after first emit) — implementers could have shipped the exact clinical_on_call/regulatory timeout suppression R6 was supposed to close. Fix: rewrote Sub-decision 6 entirely as the normative tier-cycle resettable contract — sweep predicate adds `escalation_tier IS NOT NULL` terminal exclusion; per-row atomic 5-step closure with explicit STEP 5 reset (escalation_tier advance + escalation_key=NULL release + new deadline compute); explicit next_tier() + INTERVAL_for_severity_and_tier() canonical functions; multi-tier worked example showing 3 sweep cycles ending in terminal exclusion; explicit difference-from-one-shot-model paragraph. R7 MED-1 tests #9 + #10 still asserted pre-R6 one-shot idempotency — replaced with tier-cycle progression assertions: each tier transition fires in sequence (care_team → clinical_on_call → regulatory or terminal per severity); re-running sweep during in-flight cycle is no-op (claim lock); re-running after reset + before next deadline is no-op (deadline not expired); re-running after next deadline DOES advance; terminal exclusion. Previously POST-R6 (2 HIGH + 1 MED closed inline: R6 HIGH-1 escalation_key one-shot model suppressed all subsequent tier timeouts (clinical_on_call/regulatory no-ack would never be detected) — restructured Sub-decision 6 sweep contract as TIER-CYCLE resettable: per-row 5-step closure now (a) lifecycle transition INSERT, (b) escalation_key claim, (c) recipient fan-out via compute_crisis_recipient_mapping(crisis_event_id, severity, next_tier), (d) Cat A audit emit, (e) UPDATE escalation_obligation advancing escalation_tier + resetting escalation_key=NULL + computing new undeliverable_deadline = now() + INTERVAL_for_severity_and_tier; sweep predicate excludes terminal-tier rows where escalation_tier IS NULL (final tier reached). R6 HIGH-2 STEP 1 Cat A emit + STEP 2 row inserts were two separate transactions which would have allowed STEP 1 to commit durably while STEP 2 failed (audit-only crisis detections) — restructured ordering as ATOMIC: STEP 1 Cat A audit INSERT + STEP 2 sub-steps 2a-2d in a single BEGIN...COMMIT transaction via the canonical FLOOR-020 audit-co-transactional pattern; on rollback no Cat A row commits + ERROR surfaced + I-019 preserved. R6 MED-1 benchmark test #16 was claimed in R5 closure narrative but not actually in the Sub-decision 7 enumerated list (was "15 merge-blocking integration tests") — added test #16 with specific workload (1000 concurrent INSERTs across 50 tenants, 100 req/s sustained 10s) + pass/fail threshold (p99 ≤ 180ms across 5 consecutive runs) + isolation assumptions + CI gate; updated count to "16 merge-blocking integration tests". Previously POST-R5 (1 HIGH + 1 MED closed inline: R5 HIGH-1 STEP 2c escalation_obligation INSERT row shape was under-specified for the Sub-decision 6 sweep — only tenant_id/patient_id/server_signal_id/escalation_key/undeliverable_deadline persisted; sweep needed to either JOIN through server_signal_id or derive lifecycle state to recover crisis_event_id + severity + current escalation tier. Fix: this SI extends the P-027 §4.68 escalation_obligation row shape with explicit `crisis_event_id` (composite FK to crisis_event), `severity` (enum), and `escalation_tier` (enum {care_team, clinical_on_call, regulatory}) columns; Sub-decision 6 sweep contract now explicit on the SELECT predicate + 5-step closure per-row (transition INSERT + escalation_key UPDATE + escalation_tier advance + recipient fan-out via compute_crisis_recipient_mapping + Cat A audit emit). R5 MED-1 200ms SLO was asserted without per-operation budget + failure/timeout contract — added STEP 2 per-operation latency budget table (p50 + p99 + indexes + degraded behavior per operation; STEP 1+2+3 cumulative p99 ≤ 180ms); added merge-blocking benchmark test #16 under simulated contention; explicit fail-closed posture on any STEP 2 sub-step failure (transaction rollback + ERROR surfaced + no card render against partial state). Previously POST-R4 (3 HIGH closed inline: R4 HIGH-1 Sub-decision 3 had residual "executed at Sub-decision 2 STEP 2c-2d ... synchronous with STEP 2" text contradicting R3 HIGH-1 closure — rewrote routing tree as ELIGIBILITY only with execution explicitly delegated to STEP 4. R4 HIGH-2 Sub-decision 3 had stale "CCR resolvers at STEP 4 + hydration at STEP 5" mapping pre-R3 renumbering (post-R3 ordering: STEP 4 = dispatch setup, STEP 5 = CCR + hydration) — corrected mapping. R4 HIGH-3 (safety-critical) stuck STEP 4 outbox row would have denied the no-acknowledgement timer ever firing because escalation_obligation INSERT was at STEP 4c — moved escalation_obligation INSERT into STEP 2c (synchronous, in same transaction as Cat A audit + crisis_event INSERT) so the deadline source-of-truth row is guaranteed-armed; the Sub-decision 6 no-ack sweep now always has a row to find regardless of STEP 4 worker progress. Previously POST-R3 (1 HIGH + 1 MED closed inline: R3 HIGH-1 dispatch setup at STEP 2c-2e ahead of STEP 3 card render violated the 200ms patient-surface SLO under many recipients, transient DB contention, or provider-channel unavailability — moved dispatch setup to a new STEP 4 asynchronous bounded outbox worker invoked via same-tx outbox row from STEP 2 transaction; STEP 1+2+3 only is the synchronous patient-surface path (Cat A emit + crisis_event INSERT + card render); the 200ms SLO now applies to STEP 1-3 exclusively, with STEP 4 dispatch and STEP 5 CCR resolution out-of-band. R3 MED-1 SQL literal `VALUES (..., 'sms'), (..., 'email'), (..., 'in_app_push')` would have inserted unconditional rows for channels the tenant has not configured (false undeliverable_deadline misses + bogus dispatch_attempt_failed audit volume) — rewrote STEP 4a as SELECT-driven from `unnest(tenant.crisis.fanout_channels[])`; STEP 4b as SELECT-driven from a STABLE function `compute_crisis_recipient_mapping(crisis_event_id, severity)` that joins tenant config + care_team + consent_grant + severity for the exact recipient set; deployment preflight asserts `cardinality(tenant.crisis.fanout_channels[]) > 0` (I-019 platform-floor); worker FAILS CLOSED if empty at runtime. Previously POST-R2 (1 HIGH + 1 MED closed inline: R2 HIGH-1 Sub-decision 3 routing tree contradicted Sub-decision 2 STEP 1-5 emit ordering by listing "render card → Cat B emit → crisis_event INSERT" as the canonical sequence; implementer following Sub-decision 3 could reintroduce R1 HIGH-1 FLOOR-020 coupling. Fix: rewrote Sub-decision 3 to specify LOGICAL recipient routing only, with explicit execution-order assertion deferring entirely to Sub-decision 2 STEP 1-5; added "Sub-decision 2 is authoritative on emit ordering; Sub-decision 3 is authoritative on logical routing destinations only" anchor. R2 MED-1 audit category tally arithmetic ("5 Cat A + 0 Cat B + 2 Cat C" said but actual rows are 6 Cat A + 0 Cat B + 1 Cat C); corrected tally in §1 + §3 + R1 MED-1 log entry. Also fixed §8 SLO row "30 seconds of `crisis.no_acknowledgement_escalation` Cat B emit" → Cat A to match §3 table + Sub-decision 6 fail-closed claim. Previously POST-R1 (2 HIGH + 1 MED closed inline: R1 HIGH-1 CCR lookup was placed on FLOOR-020 synchronous emit path, contradicting non-blocking detection invariant — restructured Sub-decision 2 with explicit STEP 1-5 emit ordering placing Cat A `crisis_detection_trigger` synchronous and FLOOR-020 fail-closed; CCR resolution + `crisis.escalation_destination_resolved` Cat B explicitly DOWNSTREAM and asynchronous; Crisis Response Card MAY render with cached/generic content at STEP 3 then hydrate at STEP 5 after CCR resolution; resolver failure never blocks Cat A detection emission. R1 HIGH-2 dispatch_ledger UNIQUE(tenant_id, patient_id, server_signal_id, channel) cannot represent multi-recipient fan-out (care-team SMS + clinical-on-call SMS + emergency-contact SMS would collide on the channel-level UNIQUE) — restructured Sub-decision 5 to align with P-027 §4.66-4.67 canonical two-tier shape: §4.66 dispatch_ledger row per channel-class records the channel-level obligation; §4.67 provider_attempt row per (recipient_role, channel) tuple records per-recipient outcome; no schema amendment to P-027 required. R1 MED-1 Cat A vs Cat B mismatch on `crisis.no_acknowledgement_escalation` between Sub-decision 6 (claimed Cat A) and §3 AUDIT_EVENTS table (defined Cat B) — chose Cat A for safety-floor escalation fail-closed semantics; updated §1 in-scope tally from "4 Cat A + 1 Cat B + 2 Cat C" to "6 Cat A + 0 Cat B + 1 Cat C"; R2 Codex review queued)
**Authoring date:** 2026-05-21
**Trigger:** Master Completion Plan v1.0 pilot-viable scope item 4 (Crisis Response slice). Companion to AI Service Mode 1 Handler Spec v0.4 P-035 (FLOOR-020 crisis-detection emit path) and SI-013 P-025 (CCR crisis-helpline namespace).
**Owner:** Crisis Response slice owner + Platform AI Safety + Mode 1 AI Service owner + Notification slice owner + Adverse-Event slice owner + Audit owner.
**Companion documents:**
- I-019 Crisis detection cannot be configured away (Contracts Pack v5.3 INVARIANTS)
- P-025 SI-013 CCR crisis-helpline + AUDIT `crisis.escalation_destination_resolved` Cat B
- P-027 CDM v1.2 → v1.3 §4.66-4.68 notification_crisis_dispatch_ledger + provider_attempt + escalation_obligation entities
- P-035 AI Service Mode 1 Handler Spec v0.4 (FLOOR-020 always-on crisis-detection emit)
- P-031 SI-024.1 v0.8 (verify_session_jwt_and_extract_claims canonical trust anchor)
- P-027 I-019 + I-027 + I-032 v5.3 + I-035 platform-floor invariants

---

## 1. Purpose + scope

The Crisis Response slice defines the canonical platform-floor response surface for crisis events detected anywhere on the platform. Crisis-detection emission is already platform-floor (I-019; Mode 1 FLOOR-020; `crisis_detection_trigger` Cat A audit) — this SI specifies what happens AFTER detection:

1. **Patient-facing safety surface** — what the patient sees within ≤ 200ms of crisis detection (resources, helplines, emergency numbers, "you are not alone" copy).
2. **Resource lookup contract** — how CCR `crisis_helplines` array + `emergency_number` + 3 typed resolvers (per P-025) materialize on the patient surface; how unmapped-country fallback works.
3. **Escalation routing decision tree** — when does WHO get notified (care team, clinical-on-call, designated emergency contact, regulatory authority).
4. **Crisis lifecycle state machine** — the patient-bound crisis-event entity from detection → acknowledged → responded → resolved (Option A append-only-only per I-035; mirrors SI-019 + SI-020 patterns).
5. **Tenant/care-team notification fan-out** — wire-up between `crisis_detection_trigger` Cat A audit event + `notification_crisis_dispatch_ledger` (P-027 §4.66) channel-scoped obligation tracking.
6. **Operational obligations** — acknowledgement window, response-window SLOs, escalation-on-no-acknowledgement timer (uses P-027 §4.68 `notification_crisis_escalation_obligation` persisted deadline).
7. **Test scaffolding** — merge-blocking integration tests + static-analyzer rules preventing crisis-detection bypass.

**In scope:**
- 6 new CDM entities (1 crisis_event + 5 lifecycle/coordination entities)
- 7 new AUDIT_EVENTS action IDs (6 Cat A + 0 Cat B + 1 Cat C; R1 MED-1 closure 2026-05-21 moved no_acknowledgement_escalation Cat B → Cat A to align with Sub-decision 6's safety-floor escalation fail-closed claim) under `crisis.*` namespace EXTENDING the P-025 `crisis.escalation_destination_resolved` ratified Cat B scope
- 4 new DOMAIN_EVENTS event types (additive)
- 6 new OpenAPI endpoints under `/v1/crisis/*`
- 1 new state machine `crisis_event_lifecycle` (DERIVED from append-only per I-035)
- 7 new RBAC roles (3 application + 3 wrapper owners + 1 view owner)

**Out of scope:**
- AI Service Mode 1 crisis-detection logic (already ratified at P-035; this slice consumes the emission, does not redefine it)
- Crisis-detection model training, prompt-engineering, or thresholds (Platform AI Safety owns)
- CCR crisis_helpline namespace expansion beyond P-025 (only consumes the 3 typed resolvers)
- Regulatory reporting (Adverse-Event Reporting slice owns; this slice ONLY emits the trigger event when regulatory threshold met)
- Synchronous video escalation (Sync video consult slice; this slice references escalation_destination, does not implement the video bridge)
- INVARIANTS bump (no new platform-floor invariants from this slice; all closures align with I-019 + I-023 + I-027 + I-032 v5.3 + I-035)

---

## 2. Sub-decisions

### Sub-decision 1 — Patient-facing safety surface contract

**Decision:** Within ≤ 200ms of crisis detection emission (FLOOR-020 path or any other crisis-emitting surface), the patient-facing client renders the **canonical Crisis Response Card** containing:

| Slot | Content source | Fallback |
|---|---|---|
| Emergency number (large, dialable) | CCR resolver `resolveCrisisEmergencyNumber(country_of_care)` (P-025) | "Call your local emergency services" + `unmapped_country` audit |
| Crisis helpline (E.164 + display label) | CCR resolvers `resolveCrisisHelpline` + `resolveCrisisHelplineLabel(country_of_care)` (P-025) | null helpline; emergency_number remains visible |
| "You are not alone" supportive copy | localized message catalog (key `crisis.supportive_copy.v1`) | English fallback |
| Acknowledge-and-continue button | always present | n/a |
| Connect-to-clinician button (IF tenant has on-call) | derived from tenant config | hidden if no on-call |

The card MUST render BEFORE any other UI mutation (no race with chat-stream completion, no race with form-submit acknowledgement). On Mode 1 chat, the card displaces the assistant turn (the assistant turn is preserved in conversation history but the safety surface takes visual priority).

**Patient-surface-agreement contract (extends P-025 Rule 4):** the resolved card MAY render BEFORE the `crisis.escalation_destination_resolved` Cat B audit emits (Cat B fail-soft per P-025); the card MUST NOT block on Cat B success. The `crisis_detection_trigger` Cat A audit is on the synchronous emit path and uses standard Cat A fail-closed FLOOR-020 discipline.

### Sub-decision 2 — Resource lookup contract (CCR integration; DOWNSTREAM of FLOOR-020 emit)

**Decision:** All 3 P-025 typed resolvers are called in parallel during card resolution. The resolution outcome is recorded in a single `crisis.escalation_destination_resolved` Cat B audit row per P-025's 4-value `resolution_status` enum. Sub-decision 1's card consumes the resolution outcome:

| resolution_status | Card behavior |
|---|---|
| `'resolved'` | emergency_number + helpline + label all visible |
| `'partial_defaults'` | emergency_number visible (from country_profile default); helpline may be null |
| `'unmapped_country'` | "Call your local emergency services" fallback copy; helpline null |
| `'ccr_unavailable'` | fail-soft per P-025 Rule 4; cached-last-known values used if available; otherwise generic fallback |

**Critical FLOOR-020 invariant ordering (R1 HIGH-1 closure 2026-05-21):** CCR resource lookup MUST be **strictly downstream** of `crisis_detection_trigger` Cat A audit emission (the FLOOR-020 synchronous emit path) — NOT synchronous with it. This separation is required because:

1. **FLOOR-020 + I-019 platform-floor:** crisis detection emission must NEVER block on, latency-degrade with, or fail-with-cascade-from downstream response-surface work. CCR latency, DNS failures, or resolver retries must not delay or suppress the Cat A `crisis_detection_trigger` emit.
2. **Cat A vs Cat B fail-mode mismatch:** `crisis_detection_trigger` is Cat A (fail-closed; FLOOR-020 discipline); `crisis.escalation_destination_resolved` is Cat B (fail-soft per P-025 Rule 4). Co-placing on the same synchronous path would have forced Cat B to inherit Cat A's fail-closed semantics OR forced Cat A to inherit Cat B's fail-soft tolerance — neither is correct.
3. **Card render independence:** the Crisis Response Card MAY render with generic fallback copy (cached-last-known values OR "Call your local emergency services" + null helpline) BEFORE the CCR resolution completes, so the patient-facing safety surface is never blocked by resolver latency.

**Canonical emit ordering (R3 HIGH-1 + R4 HIGH-3 closure 2026-05-21: dispatch *recipient fan-out* moved out of the synchronous patient-surface path; BUT the escalation-deadline source-of-truth row stays in STEP 2 transaction so the no-acknowledgement timer is guaranteed-armed even if the STEP 4 worker stalls):**

```
STEP 1 + STEP 2 (ATOMIC — single database transaction; FLOOR-020 fail-closed; R6 HIGH-2 closure
2026-05-21: previously the spec said STEP 1 Cat A emit was a separate transactional commit from
STEP 2's row inserts, which would have allowed STEP 1 to commit durably while STEP 2 failed,
leaving audit-only crisis detections with no crisis_event row or escalation_obligation timer.
Fix: STEP 1 and STEP 2 sub-steps now run in a SINGLE atomic transaction; the Cat A audit row
INSERT is co-transactional with the 2a-2d application-table inserts. If any sub-step fails, the
transaction rolls back and NO Cat A audit row commits. This preserves FLOOR-020 fail-closed
discipline AND the no-partial-state guarantee. Implementer uses the canonical FLOOR-020
audit-co-transactional pattern (audit_events insert + application-table inserts in one BEGIN
... COMMIT; SAVEPOINT not used). On rollback: an ERROR is surfaced; no Cat A row is committed
(canonical I-019 platform-floor allows this because the crisis surface has not been delivered
to the patient yet; the patient sees an explicit error fallback per Sub-decision 1 generic
fallback copy):

STEP 1 (within atomic transaction; synchronous): crisis_detection_trigger Cat A audit INSERT
STEP 2 (within same atomic transaction; synchronous):
        2a. INSERT crisis_event row
        2b. INSERT initial 'detected' lifecycle transition
        2c. INSERT notification_crisis_escalation_obligation row with persisted undeliverable_deadline
            (severity-tiered: 30s / 60s / 5min). **This row is the source-of-truth for the no-ack
            timer (Sub-decision 6) and MUST be created in the STEP 2 transaction so the sweep has a
            row to find even if the STEP 4 worker stalls, crashes, or poison-rows.** Per R4 HIGH-3
            closure: a stuck outbox row before STEP 4c (recipient fan-out) cannot deny the
            no-acknowledgement timer; the escalation_obligation deadline exists in STEP 2 transaction
            unconditionally.
        2d. INSERT crisis_dispatch_outbox row (same-tx outbox enqueue for STEP 4 worker)
STEP 3 (synchronous; FLOOR-020 fail-closed; ≤ 200ms budget from STEP 1): render Crisis Response Card
        with cached/generic content. **STEP 2 sub-steps 2a-2d are bounded-cost row inserts only; the
        200ms SLO covers STEP 1+2+3 cumulatively.**
STEP 4 (asynchronous via bounded outbox worker; consumes the crisis_dispatch_outbox row from STEP 2d):
        recipient fan-out only — INSERT one notification_crisis_dispatch_ledger row per CONFIGURED
        channel-class in tenant `crisis.fanout_channels[]`; INSERT N provider_attempt rows per
        Sub-decision 3 logical routing tree. Worker emits crisis.dispatch_attempt_failed Cat C on
        each provider-level failure. **The escalation_obligation row is NO LONGER created at STEP 4
        — it is created at STEP 2c.** Worker uses idempotent retry against the same crisis_event_id
        + outbox row; partial fan-out is forbidden (per-batch single-transaction discipline). The
        no-acknowledgement sweep at Sub-decision 6 reads STEP 2c-created rows; STEP 4 stall does
        NOT silently skip escalation.
STEP 5 (asynchronous; Cat B fail-soft): call 3 CCR resolvers + emit crisis.escalation_destination_resolved
        Cat B (P-025); on resolution outcome, hydrate the already-rendered Crisis Response Card with
        resolved values via the patient client's normal reactive update path; otherwise the card stays
        at fallback content.
```

**Patient-surface SLO independence:** the 200ms card-render SLO in Sub-decision 1 applies to STEP 1+2+3 ONLY (Cat A emit + crisis_event/transition/escalation_obligation/outbox INSERT + card render). STEP 4 dispatch setup and STEP 5 CCR resolution are out-of-band from the patient-surface latency budget.

**STEP 2 per-operation latency contract (R5 MED-1 closure 2026-05-21):** the synchronous STEP 2 transaction has 4 row inserts. Per-operation budget at p99 + indexes/constraints + degraded behavior:

| Operation | p50 budget | p99 budget | Required indexes / constraints | Degraded behavior (timeout) |
|---|---|---|---|---|
| Cat A audit emit (STEP 1) | 5ms | 20ms | audit_events_partition write-path optimized via canonical FLOOR-020 pipeline | FAIL-CLOSED per FLOOR-020 (no card render; ERROR surfaced) |
| 2a crisis_event INSERT | 3ms | 15ms | PK (id); UNIQUE (tenant_id, server_signal_id) | STEP 2 transaction rollback; ERROR surfaced |
| 2b lifecycle_transition INSERT | 3ms | 15ms | PK (id); composite FK to crisis_event; trigger validates initial 'none → detected' triple | STEP 2 transaction rollback |
| 2c escalation_obligation INSERT | 3ms | 15ms | composite UNIQUE (tenant_id, patient_id, server_signal_id) per P-027 §4.68; composite FK (tenant_id, crisis_event_id) | STEP 2 transaction rollback |
| 2d crisis_dispatch_outbox INSERT | 3ms | 10ms | PK (id); index on (consumed_at, enqueued_at) for worker scheduling | STEP 2 transaction rollback |
| STEP 2 transaction total | 15ms | 60ms | — | Rollback releases all locks; outer STEP 1+2+3 budget remains under 200ms p99 |
| STEP 3 card render | 30ms | 100ms | client-side; payload already serialized in handler | Card renders with absolute generic fallback if any payload field is missing |
| **STEP 1+2+3 cumulative** | **50ms** | **180ms** | — | **STEP 2 rollback surfaces ERROR; card does NOT render against partial state** |

**Merge-blocking benchmark test (added to integration test scaffold at Sub-decision 7 test #16):** under simulated contention (1000 concurrent crisis_event INSERTs across 50 tenants), STEP 1+2+3 p99 latency MUST be ≤ 180ms. CI gates ship on benchmark green. Index plan + transaction isolation level documented in the P-040 follow-on amendment CDM cycle.

**STEP 2 fail-closed posture:** if ANY of STEP 1 / 2a / 2b / 2c / 2d fails (timeout or constraint violation), the entire STEP 2 transaction rolls back and an ERROR is surfaced to the originating handler. The Crisis Response Card does NOT render against partial state. FLOOR-020 fail-closed discipline preserves I-019 invariant — the patient sees a hard error (which routes to a generic "your message was received; please call emergency services if in crisis" sentinel) rather than a partially-armed crisis state.

**No platform admin can disable CCR lookup OR card rendering** (I-019 invariant). But resolver failure NEVER blocks Cat A detection emission, lifecycle row insertion, or card rendering. The 200ms render budget in Sub-decision 1 is for STEP 3 (cached/generic content), NOT STEP 5 (hydration of resolved values).

### Sub-decision 3 — Escalation routing decision tree

**Decision:** Crisis routing follows this fixed routing tree (NOT tenant-configurable per I-019). **The tree is LOGICAL routing — what recipients must receive dispatch under what conditions — NOT an alternate execution order.** The canonical execution order is Sub-decision 2's STEP 1-5 emit ordering (Cat A FLOOR-020 first; crisis_event + detected transition; fallback card render; dispatch obligation setup; CCR/Cat B async hydration last). Sub-decision 3 specifies which recipients land in the routing tree; Sub-decision 2 specifies WHEN each step executes relative to the Cat A FLOOR-020 emit.

**Recipient routing tree (logical):**

```
crisis_detection_trigger Cat A emitted (synchronous, FLOOR-020 fail-closed, Sub-decision 2 STEP 1)
    ↓
LOGICAL RECIPIENT 1 (always, executed at Sub-decision 2 STEP 3 — fallback card render):
   The patient receives the Crisis Response Card with cached/generic content
   (then hydrated reactively at STEP 5 after CCR resolution).
    ↓
LOGICAL RECIPIENTS 2-5 (eligibility-only; execution explicitly delegated to Sub-decision 2 STEP 4
   async bounded outbox worker — these recipients are NEVER on the synchronous STEP 1-3 patient-surface
   path; the routing tree only defines WHICH recipients are eligible, not WHEN they are dispatched):
2. ALL active care-team channels in tenant `crisis.fanout_channels[]` config
3. IF severity ∈ {imminent, life_threatening}: clinical-on-call recipient via tenant
   `crisis.clinical_on_call_channel` config; ALSO emit `emergency_escalation` Cat A at STEP 4
4. IF patient has designated emergency contact + consent grant scope ∈ {emergency_contact_share}:
   emergency contact recipient via SMS (separate provider_attempt row under SMS dispatch_ledger row)
5. IF severity ∈ {life_threatening} AND tenant has regulatory_reporting=true:
   emit `crisis.regulatory_threshold_reached` Cat A at STEP 4; Adverse-Event slice picks up
   (regulatory authority is a downstream consumer, not a direct dispatch_ledger recipient)
    ↓
LOGICAL ASYNC WORK ITEMS (delegated entirely to Sub-decision 2 STEP 4 + STEP 5; out-of-band from
   the patient-surface 200ms SLO; never blocks STEP 1-3):
- Dispatch obligation setup (notification_crisis_dispatch_ledger + provider_attempt fan-out for
  LOGICAL RECIPIENTS 2-5 above): executed at Sub-decision 2 STEP 4
- CCR resolvers + `crisis.escalation_destination_resolved` Cat B fail-soft per P-025: executed at
  Sub-decision 2 STEP 5
- Crisis Response Card hydration with resolved values (reactive client update): executed at
  Sub-decision 2 STEP 5; OR card stays at fallback content if CCR unavailable
```

**R4 HIGH-1 + HIGH-2 closure (2026-05-21):** prior text said "executed at Sub-decision 2 STEP 2c-2d ... synchronous with STEP 2" for logical recipients 2-5 (contradicting R3 HIGH-1 closure that moved dispatch to STEP 4 async); also said "CCR resolvers execute at Sub-decision 2 STEP 4 and hydration at STEP 5" (stale mapping pre-R3-renumbering: R3 made STEP 4 = dispatch setup, STEP 5 = CCR + hydration). Fix: removed all STEP 2c/2d references; CCR/hydration mapped to STEP 5 only; dispatch obligation setup explicitly at STEP 4 only; routing tree now reads as ELIGIBILITY only with execution explicitly delegated to Sub-decision 2.

**Execution-order assertion (R2 HIGH-1 closure 2026-05-21):** the routing tree above lists LOGICAL routing only. The canonical EXECUTION ORDER is exclusively Sub-decision 2's STEP 1-5 sequence. Specifically: CCR resolution + Cat B audit emission MUST be ASYNCHRONOUS and DOWNSTREAM of Cat A FLOOR-020 emit + crisis_event INSERT; never synchronous with them. An implementer treating the routing tree as an execution sequence (i.e., emitting Cat B BEFORE crisis_event INSERT) would reintroduce the R1 HIGH-1 FLOOR-020 coupling defect. Sub-decision 2 is authoritative on emit ordering; Sub-decision 3 is authoritative on logical routing destinations only.

**Routing decisions are NEVER tenant-overridable.** Tenants configure WHICH channels exist (sms provider, email provider) but NOT whether routing happens. Logical recipients 1 + 2 are I-019 platform-floor (always-on); 3, 4, 5 are conditional but conditional ONLY on severity/consent/regulatory_reporting facts, NOT on tenant administrator preference.

### Sub-decision 4 — Crisis event lifecycle (Option A append-only-only per I-035)

**Decision:** Same Option A append-only-only pattern as SI-019 (med-interaction signal lifecycle) and SI-020 (consult lifecycle):

**Entities (CDM v1.9 → v1.10 follow-on at P-040):**

1. `crisis_event` — durable record of a detected crisis event; immutable after INSERT
2. `crisis_event_lifecycle_transition` — append-only transition log; current state derived from latest row; CHECK constraint enumerates allowed transition triples
3. `crisis_acknowledgement_claim` — hybrid persistence (append-only identity + one-way mutable released_at) tracking which clinician/care-team-member is actively handling the crisis (mirrors SI-020 consult_review_claim pattern at P-037 R4)
4. `crisis_response_record` — append-only record of each response action taken (resource share, dispatch, escalation, dial-bridge)
5. `crisis_resolution` — terminal-state marker; INSERT triggers append-only transition to `resolved`; CHECK enforces only one resolution row per crisis_event
6. `crisis_outcome_summary_v` — caller-class-split derived view per P-038 R5 pattern (clinician-summary view for care team; patient-summary view restricted via verify_session_jwt_and_extract_claims to the patient's own crisis events)

**State machine `crisis_event_lifecycle` (DERIVED from append-only):**

```
none → detected
  detected → acknowledged   (clinician/care-team-member claims via crisis_acknowledgement_claim)
  detected → escalated      (no-acknowledgement timer fired; severity escalation)
  acknowledged → responded  (crisis_response_record INSERTed)
  responded → resolved      (crisis_resolution INSERTed)
  responded → escalated     (response failed; severity escalation)
  escalated → acknowledged  (higher tier acknowledges)
  escalated → escalated     (tier_progression_no_acknowledgement; R8 HIGH-1 + R9 HIGH-1
                             closure 2026-05-21: required for multi-tier sweep advances from
                             clinical_on_call → regulatory; first care_team timeout uses the
                             detected → escalated triple, subsequent tier advances use this
                             escalated → escalated triple with reason='tier_progression_no_acknowledgement')
  acknowledged → resolved   (acknowledged then directly resolved without separate response entity)
```

Transition triples enforced by CHECK on `crisis_event_lifecycle_transition` (NEW from_state, NEW to_state, NEW transition_reason). **9 allowed triples** (R9 HIGH-1 closure 2026-05-21: count + enumeration now matches §6 State Machines amendment table + Sub-decision 6 STEP 1 normative contract). Mirrors P-037 + P-038 patterns: per-event advisory lock + monotonic transition_at + state continuity validation in BEFORE INSERT trigger.

### Sub-decision 5 — Notification fan-out + dispatch obligation (R1 HIGH-2 closure 2026-05-21)

**Decision:** Crisis fan-out reuses the canonical P-027 §4.66-4.67 two-tier pattern unchanged:

- **§4.66 `notification_crisis_dispatch_ledger`** — channel-level OBLIGATION (one row per channel-class per crisis event). UNIQUE on `(tenant_id, patient_id, server_signal_id, channel)` per P-027 canonical schema. Records the obligation that "this crisis event MUST result in dispatch on this channel-class".
- **§4.67 `notification_crisis_provider_attempt`** — per-recipient ATTEMPT (one row per (recipient_role, recipient_address, channel) tuple). The child table is where multi-recipient fan-out is represented; multiple recipients on the same channel (e.g., care-team SMS + clinical-on-call SMS + emergency-contact SMS) are multiple provider_attempt rows under the same dispatch_ledger SMS row.

**R1 HIGH-2 closure:** prior draft proposed "one dispatch_ledger row per (recipient_role, channel) tuple" which would have required amending the P-027 §4.66 UNIQUE constraint to include `recipient_role` — that would have been a structural change to a ratified canonical schema (hard-floor item 6 territory). Closure: align with the existing two-tier shape per Codex's recommendation:

Wire-up via STEP 4 of Sub-decision 2 (asynchronous bounded outbox worker; downstream of synchronous Cat A emit + crisis_event INSERT + card render):

```sql
-- STEP 2 (synchronous, in same transaction as Cat A audit; ALL of 2a-2d atomic):
-- 2a. crisis_event INSERT (shown elsewhere)
-- 2b. crisis_event_lifecycle_transition INSERT (shown elsewhere)
-- 2c. escalation_obligation INSERT — guaranteed source-of-truth for no-ack timer (R4 HIGH-3 +
--     R5 HIGH-1 schema closure). This SI extends the P-027 §4.68 escalation_obligation row
--     shape with explicit columns the Sub-decision 6 sweep needs to drive lifecycle transitions
--     + next-tier fan-out without relying on server_signal_id joins or derived state:
INSERT INTO notification_crisis_escalation_obligation
    (tenant_id, patient_id, server_signal_id,
     crisis_event_id,                -- NEW: direct FK to crisis_event(id); sweep uses this for lifecycle
                                     --      transition INSERT without needing to JOIN through server_signal_id
     severity,                       -- NEW: enum {non_imminent, imminent, life_threatening}; determines
                                     --      severity-tiered fan-out at next tier
     escalation_tier,                -- NEW: enum {care_team, clinical_on_call, regulatory}; current tier
                                     --      to which fan-out has been applied; sweep advances to next tier
     escalation_key, undeliverable_deadline)
VALUES (v_tenant_id, v_patient_id, v_server_signal_id,
        v_crisis_event_id,
        v_severity,
        'care_team',                 -- initial tier; STEP 4 fan-out targets care_team channels first
        NULL,                        -- escalation_key NULL until sweep advances tier
        now() + INTERVAL_for_severity(v_severity));
-- UNIQUE (tenant_id, patient_id, server_signal_id) per P-027 §4.68 unchanged (one obligation row
-- per crisis_event); composite FK (tenant_id, crisis_event_id) → crisis_event(tenant_id, id)
-- enforces tenant-scoped referential integrity; ON DELETE NO ACTION (append-only platform-floor).
-- Sub-decision 6 sweep contract (R5 HIGH-1 + R6 HIGH-1 closure 2026-05-21 — tier-cycle resettable
-- model so multi-tier escalation works; escalation_key + undeliverable_deadline + escalation_tier
-- are TIER-CYCLE mutable, not one-shot terminal; final tier reached when next_tier() returns NULL):
--   SELECT tenant_id, patient_id, server_signal_id, crisis_event_id, severity, escalation_tier
--   FROM notification_crisis_escalation_obligation
--   WHERE now() > undeliverable_deadline
--     AND escalation_key IS NULL                       -- per-tier lock (NULL = currently pending)
--     AND escalation_tier IS NOT NULL                  -- terminal tier reached (NULL = no further escalation)
--   FOR UPDATE SKIP LOCKED;
-- Per row, in a single atomic transaction:
--   (a) INSERT crisis_event_lifecycle_transition (escalated, reason='no_acknowledgement_timeout');
--   (b) UPDATE escalation_obligation SET escalation_key = gen_random_uuid()  -- claim THIS tier's escalation
--       (per-tier-cycle CLAIM; BEFORE UPDATE trigger forbids changing escalation_key from non-NULL
--        to non-NULL value in the same tier; only NULL → uuid → NULL transitions permitted);
--   (c) call compute_crisis_recipient_mapping(crisis_event_id, severity, next_tier(escalation_tier))
--       to derive new-tier recipients + INSERT provider_attempt rows under the dispatch_ledger
--       rows already established at STEP 4a;
--   (d) emit crisis.no_acknowledgement_escalation Cat A audit row;
--   (e) UPDATE escalation_obligation SET
--           escalation_tier = next_tier(escalation_tier, severity),   -- advance to next tier (or NULL = terminal)
--           escalation_key = NULL,                                     -- release the per-tier lock
--           undeliverable_deadline = CASE
--             WHEN next_tier(escalation_tier, severity) IS NULL
--             THEN undeliverable_deadline                              -- terminal; no further sweep
--             ELSE now() + INTERVAL_for_severity_and_tier(severity, next_tier(escalation_tier, severity))
--           END;
-- next_tier() canonical: 'care_team' → 'clinical_on_call'; 'clinical_on_call' → 'regulatory' IFF
-- severity = 'life_threatening' else NULL; 'regulatory' → NULL (terminal). When escalation_tier
-- becomes NULL after the final advance, the sweep predicate excludes the row permanently
-- (terminal-tier exclusion). Per-tier deadlines from INTERVAL_for_severity_and_tier:
-- care_team: 30s/60s/5min by severity; clinical_on_call: 30s additional after care_team timeout;
-- regulatory: 2min additional after clinical_on_call timeout (matches §8 operational obligations
-- table). R6 HIGH-1 closure: prior one-shot escalation_key model would have suppressed all
-- subsequent tier timeouts (clinical_on_call non-ack would never be detected); the tier-cycle
-- resettable model now correctly drives multi-tier escalation through to terminal.
-- 2d. crisis_dispatch_outbox row INSERT — same-tx outbox enqueue for STEP 4 fan-out worker:
INSERT INTO crisis_dispatch_outbox (tenant_id, crisis_event_id, enqueued_at)
VALUES (current_tenant_id_strict('crisis_dispatch_outbox'), v_crisis_event_id, now());

-- STEP 4 (asynchronous; bounded outbox worker; data-driven from tenant config; recipient fan-out only):
-- The worker reads tenant.crisis.fanout_channels[] (CCR key per OQ4) which enumerates the
-- channel-classes the tenant has provider configuration for (e.g., ['sms', 'in_app_push'] for
-- a tenant without an email provider). I-019 platform-floor requires fanout_channels[] to be
-- non-empty; deployment preflight asserts this; worker FAILS CLOSED if empty.

-- STEP 4a: INSERT one dispatch_ledger row PER CONFIGURED channel-class
-- (UNIQUE(tenant_id, patient_id, server_signal_id, channel) per P-027 §4.66 unchanged)
INSERT INTO notification_crisis_dispatch_ledger (tenant_id, patient_id, server_signal_id, channel, ...)
SELECT v_tenant_id, v_patient_id, v_server_signal_id, channel
FROM unnest(t.fanout_channels) AS channel
WHERE t.fanout_channels IS NOT NULL AND cardinality(t.fanout_channels) > 0;

-- STEP 4b: INSERT one provider_attempt row PER (recipient_role, channel) tuple where
-- recipient_role applies per Sub-decision 3 logical routing tree AND the channel is configured
-- AND the recipient_role has a resolvable recipient address for that channel
-- (e.g., emergency_contact only gets sms-channel provider_attempt rows; clinical_on_call only
-- on the tenant.crisis.clinical_on_call_channel value per OQ4)
INSERT INTO notification_crisis_provider_attempt
    (tenant_id, patient_id, server_signal_id, channel, recipient_role, recipient_address, attempt_sequence, ...)
SELECT v_tenant_id, v_patient_id, v_server_signal_id, mapping.channel, mapping.recipient_role,
       mapping.recipient_address, 1, ...
FROM compute_crisis_recipient_mapping(v_crisis_event_id, v_severity) AS mapping;
-- compute_crisis_recipient_mapping is a STABLE function that joins:
--   tenant.crisis.fanout_channels[] (configured channel-classes)
--   tenant.crisis.clinical_on_call_channel (which channel for on-call escalation)
--   care_team_member (rows for the patient's care team)
--   consent_grant (emergency_contact_share scope, if granted)
--   v_severity (filters imminent/life-threatening recipients per Sub-decision 3 logical tree)
-- and returns exactly the (channel, recipient_role, recipient_address) tuples to insert as
-- provider_attempt rows for THIS crisis_event. The function is data-driven; literal channel
-- enumerations (sms/email/in_app_push) NEVER appear in DDL or in STEP 4 logic. Channels the
-- tenant has not configured produce zero rows for that channel-class.

-- (STEP 4c: NOT applicable post-R4 HIGH-3 closure 2026-05-21. The escalation_obligation INSERT
--  moved into STEP 2c per Sub-decision 2 ordering — the deadline source-of-truth row is created
--  in the STEP 2 synchronous transaction so the no-acknowledgement sweep (Sub-decision 6) ALWAYS
--  has a row to find even if the STEP 4 worker stalls or crashes before recipient fan-out
--  completes. R4 HIGH-3 safety-floor gap closed: a stuck outbox row can no longer deny the
--  acknowledgement timer.)

-- STEP 4 fail-closed posture: STEP 4a-b run in a single transaction. If either fails the
-- transaction rolls back; worker emits `crisis.dispatch_attempt_failed` Cat C per failure and
-- retries with exponential backoff under canonical outbox-worker semantics. The outbox row is
-- NOT marked "consumed" until STEP 4a-b succeed atomically; partial application is forbidden.
-- Even under indefinite worker stall, the escalation_obligation row from STEP 2c remains
-- in place + the Sub-decision 6 sweep operates on it; the no-acknowledgement Cat A
-- escalation will fire on schedule regardless of recipient-fan-out progress.
```

**R3 MED-1 closure (data-driven channel enumeration):** prior SQL literal `VALUES (..., 'sms'), (..., 'email'), (..., 'in_app_push')` would have inserted unconditional rows for channels the tenant has not configured, causing false undeliverable_deadline misses, noisy provider-failure attempts, and bogus `crisis.dispatch_attempt_failed` Cat C audit volume. Fixed: STEP 4a INSERTs are SELECT-driven from tenant `crisis.fanout_channels[]` CCR key (per OQ4) via `unnest()`. STEP 4b INSERTs are SELECT-driven from the `compute_crisis_recipient_mapping()` STABLE function which joins tenant config + care_team + consent_grant + severity to derive the exact recipient set. Channels the tenant has not provisioned produce zero rows for that channel-class. Deployment preflight asserts `cardinality(tenant.crisis.fanout_channels[]) > 0` (I-019 platform-floor); worker FAILS CLOSED if the array is empty at runtime.

**Channel-vs-recipient identity model:** dispatch_ledger tracks channel-level OBLIGATION (must dispatch on SMS at all); provider_attempt tracks per-recipient OUTCOME (each individual SMS recipient + their delivery status). This matches the P-027 R2 HIGH closure interpretation. Multiple SMS recipients = N provider_attempt rows under the single SMS dispatch_ledger row.

**Severity-tier deadlines:** 5-minute undeliverable_deadline is the canonical acknowledgement window for non-imminent severity. Imminent severity collapses to 60 seconds. Life-threatening collapses to 30 seconds.

### Sub-decision 6 — No-acknowledgement escalation timer (R7 HIGH-1 + R10 HIGH-1 closure 2026-05-21: tier-cycle resettable model + lifecycle-state eligibility filter + acknowledge/resolve terminalization)

**Decision:** A scheduled job (sweep every 30 seconds) reads `notification_crisis_escalation_obligation` rows where:

```sql
SELECT obligation.tenant_id, obligation.patient_id, obligation.server_signal_id,
       obligation.crisis_event_id, obligation.severity, obligation.escalation_tier
FROM notification_crisis_escalation_obligation AS obligation
JOIN LATERAL (
    -- R10 HIGH-1 closure: current lifecycle state lookup; sweep eligible ONLY when current
    -- state ∈ {detected, escalated} (matches the 2 from_state values that have valid escalated
    -- to_state triples per §6 state-machine: detected → escalated + escalated → escalated)
    SELECT to_state AS current_state
    FROM crisis_event_lifecycle_transition lt
    WHERE lt.tenant_id = obligation.tenant_id
      AND lt.crisis_event_id = obligation.crisis_event_id
    ORDER BY lt.transition_at DESC, lt.id DESC
    LIMIT 1
) AS lifecycle ON TRUE
WHERE now() > obligation.undeliverable_deadline
  AND obligation.escalation_key IS NULL       -- per-tier-cycle CLAIM lock (NULL = currently pending)
  AND obligation.escalation_tier IS NOT NULL  -- terminal-tier exclusion (NULL = no further escalation)
  AND lifecycle.current_state IN ('detected', 'escalated')  -- R10 HIGH-1: lifecycle eligibility
FOR UPDATE SKIP LOCKED;
```

**R10 HIGH-1 terminalization contract (NEW normative requirement):** the three SECURITY DEFINER wrapper procedures `record_crisis_acknowledgement_claim()`, `record_crisis_response()`, and `record_crisis_resolution()` (Sub-decision 4 + §7 RBAC + §10 deployment preflight) MUST, atomically in their own write transaction, set `escalation_tier = NULL` on the corresponding `notification_crisis_escalation_obligation` row (`UPDATE notification_crisis_escalation_obligation SET escalation_tier = NULL WHERE tenant_id = $1 AND crisis_event_id = $2`). This terminalizes the obligation row — the sweep predicate `escalation_tier IS NOT NULL` permanently excludes it from this point forward. The BEFORE UPDATE trigger on escalation_obligation allows ONLY (a) sweep-cycle transitions (escalation_tier advance via next_tier()) and (b) terminalization (any non-NULL → NULL); any other UPDATE to escalation_tier is rejected.

**Lifecycle-eligibility safety net:** even if a wrapper procedure FAILS to terminalize (e.g., partial transaction rollback before the obligation UPDATE), the sweep's LATERAL JOIN against `crisis_event_lifecycle_transition` filters to current_state ∈ {detected, escalated} only. An acknowledged or resolved event whose obligation row was missed by terminalization will be excluded by the lifecycle-eligibility predicate — the sweep does NOT attempt an invalid `acknowledged → escalated` or `resolved → escalated` transition. This is defense-in-depth on the safety-critical no-ack timer: the terminalization is the primary mechanism; the lifecycle filter is the backstop.

For each eligible row, the job runs the following atomic per-row transaction:

1. **Lifecycle transition INSERT:** crisis_event_lifecycle_transition. The from_state is the current to_state derived from the latest crisis_event_lifecycle_transition row. The to_state is `escalated`. **The transition reason switches by current state (R8 HIGH-1 closure 2026-05-21):** if from_state='detected' (first care_team timeout), reason='no_acknowledgement_timeout' (triple: detected → escalated); if from_state='escalated' (subsequent tier advances), reason='tier_progression_no_acknowledgement' (triple: escalated → escalated; added at R8 closure). Both triples are enumerated in §6 State Machines amendment.
2. **Tier CLAIM (acquire the per-tier-cycle lock):** UPDATE escalation_obligation SET escalation_key = gen_random_uuid(). BEFORE UPDATE trigger forbids non-NULL → non-NULL escalation_key transitions within the same tier (idempotency under retry within the in-flight cycle); only NULL → uuid permitted at this step.
3. **Next-tier recipient fan-out:** call `compute_crisis_recipient_mapping(crisis_event_id, severity, next_tier(escalation_tier, severity))` to derive recipients for the next tier + INSERT provider_attempt rows under the dispatch_ledger rows from STEP 4a.
4. **Cat A audit emit:** `crisis.no_acknowledgement_escalation` Cat A audit row (co-transactional with the UPDATE above per FLOOR-020 fail-closed discipline).
5. **Tier ADVANCE + RESET (release the per-tier-cycle lock + compute next deadline):** UPDATE escalation_obligation SET:
    - `escalation_tier = next_tier(escalation_tier, severity)` — advances to next tier or NULL (terminal)
    - `escalation_key = NULL` — releases the per-tier-cycle lock so the row is eligible for the NEXT tier's deadline expiry
    - `undeliverable_deadline = CASE WHEN next_tier(...) IS NULL THEN undeliverable_deadline ELSE now() + INTERVAL_for_severity_and_tier(severity, next_tier(...)) END` — new tier-specific deadline OR unchanged if terminal (subsequent sweep predicate `escalation_tier IS NOT NULL` excludes the row)

**`next_tier()` canonical:**
- `'care_team'` → `'clinical_on_call'`
- `'clinical_on_call'` → `'regulatory'` IFF `severity = 'life_threatening'`, else `NULL`
- `'regulatory'` → `NULL` (terminal)

**`INTERVAL_for_severity_and_tier()` canonical:** care_team 30s/60s/5min by severity; clinical_on_call adds 30s deadline after care_team timeout; regulatory adds 2min deadline after clinical_on_call timeout (per §8 operational obligations table).

**Multi-tier progression worked example (life-threatening severity, no acknowledgement at any tier):**
- t=0: STEP 2c INSERT escalation_obligation row with escalation_tier='care_team', escalation_key=NULL, undeliverable_deadline=t+30s.
- t=30s+ε: sweep #1 fires; performs steps 1-5; row now has escalation_tier='clinical_on_call', escalation_key=NULL, undeliverable_deadline=t+60s.
- t=60s+ε: sweep #2 fires; performs steps 1-5; row now has escalation_tier='regulatory', escalation_key=NULL, undeliverable_deadline=t+180s.
- t=180s+ε: sweep #3 fires; performs steps 1-5; row now has escalation_tier=NULL (terminal), escalation_key=NULL. Sweep predicate `escalation_tier IS NOT NULL` excludes the row permanently from this point forward.

**Idempotency within a tier cycle:** between step 2 (escalation_key set) and step 5 (escalation_key reset to NULL), the row is excluded from the sweep predicate `escalation_key IS NULL`. The atomic per-row transaction commits all 5 steps together OR rolls all back; partial-state mid-cycle is impossible. Multiple concurrent sweep workers use `FOR UPDATE SKIP LOCKED` to prevent double-escalation.

**Difference from one-shot model (prior pre-R6 design that R7 HIGH-1 caught residual references to):** escalation_key is NOT a permanent terminal marker; it's a per-tier-cycle CLAIM lock that's released (NULL'd) at the end of each tier's atomic closure so the row is eligible for the next tier's deadline expiry. Terminal exclusion comes from escalation_tier becoming NULL, NOT from escalation_key staying set.

### Sub-decision 7 — Test scaffolding (merge-blocking)

**Decision:** 17 merge-blocking integration tests (counting 16a/b/c/d as a 4-sub-test cluster + #17 contention benchmark; R10 HIGH-1 closure 2026-05-21 added the 16a-16d cluster) + 3 static-analyzer rules (mirrors P-035 Mode 1 + P-037 SI-020 pattern; R6 MED-1 closure 2026-05-21 added the contention benchmark to the normative list):

**Integration tests (17, with 16 expanded into 16a-16d sub-cluster):**
1. crisis_detection_trigger → Crisis Response Card renders within 200ms (latency budget)
2. Card renders even when CCR `crisis.escalation_destination_resolved` Cat B audit fails (Sub-decision 1 patient-surface-agreement)
3. `unmapped_country` resolution → fallback copy displayed
4. `partial_defaults` resolution → emergency_number visible; helpline null OK
5. `ccr_unavailable` → cached-last-known values used; generic fallback OK
6. Routing tree step 4 fan-out → all configured channels receive dispatch ledger rows
7. Imminent severity → clinical-on-call channel fanout AND `emergency_escalation` Cat A emitted
8. Life-threatening severity → regulatory_threshold_reached Cat A emitted; Adverse-Event picks up
9. No-acknowledgement timer — tier-cycle progression (R7 HIGH-1 + MED-1 closure 2026-05-21): from initial `escalation_tier='care_team'` row, after first undeliverable_deadline expiry, sweep performs the atomic 5-step closure (lifecycle transition INSERT + escalation_key=uuid claim + recipient fan-out to next tier + Cat A audit emit + UPDATE: escalation_tier='clinical_on_call', escalation_key=NULL, undeliverable_deadline=now()+30s). After second deadline expiry, second sweep advances to 'regulatory' tier IFF severity='life_threatening', else terminal (escalation_tier=NULL). Tests verify EACH tier transition fires in sequence + final terminal exclusion.
10. Tier-cycle idempotency (R7 HIGH-1 + MED-1 closure 2026-05-21): within a single tier cycle (between escalation_key=uuid and the UPDATE that sets escalation_key=NULL), re-running the no-ack sweep on the same row is a no-op (the sweep predicate `escalation_key IS NULL` excludes it). After the UPDATE that resets escalation_key=NULL + advances escalation_tier, the row becomes eligible for the NEXT tier's deadline expiry. Terminal rows where escalation_tier IS NULL are permanently excluded from sweep. Test asserts: (a) re-running sweep during an in-flight tier cycle does NOT double-escalate; (b) re-running sweep after tier advance + before next deadline does NOT escalate (deadline not yet expired); (c) re-running sweep after next deadline expires DOES advance to the next tier; (d) terminal-tier rows where escalation_tier IS NULL are excluded from sweep permanently.
11. Crisis_event lifecycle state-machine: invalid transition triple (e.g., `resolved → detected`) rejected by CHECK constraint
12. Caller-class-split view: patient calling `crisis_outcome_summary_v` sees only their own crisis events (verify_session_jwt_and_extract_claims predicate)
13. Caller-class-split view: clinician/care-team calling sees tenant-wide crisis events
14. Mode 1 chat: Crisis Response Card displaces the assistant turn visually but assistant turn preserved in conversation history
15. Tenant cannot disable crisis detection: any attempt to set tenant.crisis_detection_enabled=false raises ERROR (I-019 platform-floor)
16a. **Terminalization on acknowledge (R10 HIGH-1 closure 2026-05-21):** after `record_crisis_acknowledgement_claim()` runs, the corresponding escalation_obligation row's escalation_tier MUST be NULL; sweep run immediately after acknowledgement does NOT escalate.
16b. **Terminalization on respond (R10 HIGH-1):** same as 16a but for `record_crisis_response()`.
16c. **Terminalization on resolve (R10 HIGH-1):** same as 16a but for `record_crisis_resolution()`.
16d. **Lifecycle-eligibility backstop (R10 HIGH-1):** simulate missed terminalization — manually transition crisis_event to 'acknowledged' without calling wrapper (or simulate wrapper failure after lifecycle transition but before obligation UPDATE); sweep run after undeliverable_deadline MUST exclude the row (no escalation attempt, no rolled-back transaction).
17. **Contention benchmark (R5 MED-1 + R6 MED-1 closure 2026-05-21):** under simulated contention of 1000 concurrent crisis_event INSERTs across 50 tenants (20 events per tenant, isolation level READ COMMITTED, all 4 STEP 2 sub-step inserts atomic with Cat A audit emit per R6 HIGH-2 closure), the measured STEP 1+2+3 p99 latency MUST be ≤ 180ms. Pass/fail threshold: p99 ≤ 180ms across 5 consecutive runs. Workload: synthetic crisis_detection_trigger events emitted at 100 req/s sustained for 10 seconds. CI gate: merge BLOCKED if any of the 5 runs reports p99 > 180ms. Isolation assumption: dedicated benchmark database identical to production index plan; representative network latency between application layer and database.

**Static-analyzer rules (3):**
- TLC-CRISIS-001: no handler may catch+swallow a crisis_detection_trigger emission (would violate FLOOR-020); enforced by AST walker
- TLC-CRISIS-002: no DDL may DROP COLUMN on crisis_event or crisis_event_lifecycle_transition (append-only platform-floor); enforced by migration linter
- TLC-CRISIS-003: no tenant config row may have `crisis_*` keys set to false/null (I-019 enforcement); enforced by config-validation linter

---

## 3. AUDIT_EVENTS amendment (v5.11 → v5.12)

**7 new action IDs** under `crisis.*` namespace EXTENDING P-025 (which contributed `crisis.escalation_destination_resolved` Cat B): **6 Cat A + 0 Cat B + 1 Cat C** (R1 MED-1 closure 2026-05-21 moved no_acknowledgement_escalation Cat B → Cat A):

| # | Action ID | Category | Sampling | Partition |
|---|---|---|---|---|
| 1 | `crisis.detected` | Cat A | NOT sampled (safety-floor) | P1 keyed by patient_id |
| 2 | `crisis.acknowledged` | Cat A | NOT sampled | P1 keyed by patient_id |
| 3 | `crisis.responded` | Cat A | NOT sampled | P1 keyed by patient_id |
| 4 | `crisis.resolved` | Cat A | NOT sampled | P1 keyed by patient_id |
| 5 | `crisis.no_acknowledgement_escalation` | Cat A | NOT sampled (safety-floor escalation; R1 MED-1 closure 2026-05-21: aligned with Sub-decision 6 Cat A claim — escalation evidence MUST be fail-closed audit-complete when a safety timeout fires; Cat B fail-soft tolerance would risk silent loss of escalation evidence during the exact failure mode the timer exists to catch) | P1 keyed by patient_id |
| 6 | `crisis.regulatory_threshold_reached` | Cat A | NOT sampled (safety-floor) | P1 keyed by patient_id |
| 7 | `crisis.dispatch_attempt_failed` | Cat C | high-volume sampled | P2 governance-partition |

Existing P-025 `crisis.escalation_destination_resolved` Cat B remains unchanged.
Existing `crisis_detection_trigger` Cat A (from baseline AUDIT_EVENTS) remains unchanged and emits at the FLOOR-020 path.

---

## 4. DOMAIN_EVENTS additive

**4 new event types** under `crisis.*` namespace (additive enum extension; no version bump):

1. `crisis.detected.v1` — payload: server_signal_id, patient_id, severity, source_surface (mode_1_chat / community / forms / messaging)
2. `crisis.acknowledged.v1` — payload: crisis_event_id, acknowledged_by, acknowledged_at
3. `crisis.responded.v1` — payload: crisis_event_id, response_type, responded_by
4. `crisis.resolved.v1` — payload: crisis_event_id, resolution_outcome, resolved_at

Domain events are emitted alongside Cat A audit (same-tx outbox pattern per Consent slice P-027 §4.66).

---

## 5. OpenAPI amendment (v0.4 → v0.5)

**6 new endpoints** under `/v1/crisis/*`:

| # | Method | Path | Caller role | Purpose |
|---|---|---|---|---|
| 1 | GET | `/v1/crisis/active` | clinician / care-team-member | List active crisis events in tenant (paginated; reads staff-summary view) |
| 2 | GET | `/v1/crisis/mine` | patient / delegate | List caller's own crisis events (reads patient-summary view; verify_session_jwt_and_extract_claims predicate) |
| 3 | POST | `/v1/crisis/:crisis_event_id/acknowledge` | clinician / care-team-member | Claim acknowledgement via crisis_acknowledgement_claim (calls SECURITY DEFINER wrapper) |
| 4 | POST | `/v1/crisis/:crisis_event_id/response` | clinician / care-team-member | Record response action (calls SECURITY DEFINER wrapper) |
| 5 | POST | `/v1/crisis/:crisis_event_id/resolve` | clinician / care-team-member | Mark resolved (terminal; calls SECURITY DEFINER wrapper; INSERT crisis_resolution row) |
| 6 | GET | `/v1/crisis/resources` | patient / delegate / unauthenticated-emergency | Resource lookup endpoint (calls 3 CCR resolvers; returns card payload); ONLY endpoint accessible without authenticated session for emergency fallback |

**Idempotency:** endpoints 3 + 4 + 5 use `Idempotency-Key` header per canonical IDEMPOTENCY contract.

**Endpoint 6 unauthenticated-emergency posture:** the resource-lookup endpoint is the ONLY platform endpoint accessible without a JWT-verified session. This is a deliberate I-019 safety-floor concession: a patient in crisis whose session has expired must still be able to retrieve emergency numbers. Rate-limited per IP (60 req/min); returns ONLY country-default crisis_helplines + emergency_number (NO patient-specific data); does NOT consume or emit Cat A audit (no patient identity available).

---

## 6. State Machines amendment (v1.3 → v1.4)

**1 new state machine `crisis_event_lifecycle`** described as DERIVED from append-only `crisis_event_lifecycle_transition` rows per Option A (mirrors SI-019 + SI-020 patterns).

**Allowed transition triples (9 enumerated via CHECK constraint; R8 HIGH-1 closure added the 9th triple `escalated → escalated` with reason `tier_progression_no_acknowledgement` for multi-tier sweep advances):**

| from_state | to_state | transition_reason |
|---|---|---|
| none | detected | initial_detection |
| detected | acknowledged | clinician_claim |
| detected | escalated | no_acknowledgement_timeout |
| acknowledged | responded | response_action_recorded |
| responded | resolved | resolution_recorded |
| responded | escalated | response_failed |
| escalated | acknowledged | higher_tier_claim |
| escalated | escalated | tier_progression_no_acknowledgement (R8 HIGH-1 closure 2026-05-21: required for multi-tier sweep; first care_team→clinical_on_call tier advance uses 'detected → escalated' triple, subsequent clinical_on_call→regulatory tier advance uses 'escalated → escalated' triple. The escalation_tier column on escalation_obligation tracks which tier was advanced; the lifecycle transition row carries reason='tier_progression_no_acknowledgement' to disambiguate from the first 'no_acknowledgement_timeout' triple. CHECK constraint enumerates 9 triples total post-R8 closure.) |
| acknowledged | resolved | direct_resolution |

**R8 HIGH-1 closure 2026-05-21:** added `escalated → escalated` triple with reason `tier_progression_no_acknowledgement` so the multi-tier sweep can record SUBSEQUENT tier advances (sweep #2 from care_team-escalated to clinical_on_call-escalated; sweep #3 from clinical_on_call-escalated to regulatory-escalated). The FIRST tier advance still uses `detected → escalated` with reason `no_acknowledgement_timeout`. The reason field disambiguates intent: `no_acknowledgement_timeout` = first care-team timeout from `detected` baseline; `tier_progression_no_acknowledgement` = subsequent tier escalations from an already-escalated state. Sub-decision 6 STEP 1 normative contract: emit reason='no_acknowledgement_timeout' on the first sweep (current state='detected') and reason='tier_progression_no_acknowledgement' on subsequent sweeps (current state='escalated'). State machine triples count: 9 total (was 8 pre-R8 closure).

Current-state derivation: ORDER BY transition_at DESC, id DESC LIMIT 1 (with strict > monotonic ordering per P-038 R3 HIGH-2 pattern).

---

## 7. RBAC amendment (v1.3 → v1.4)

**7 new roles** (3 application + 3 wrapper owners + 1 view owner):

### Application roles (3)

| Role | Granted to |
|---|---|
| `crisis_event_patient_reader` | patient + delegate IFF emergency_contact_share scope (reads crisis_outcome_summary_patient_v ONLY; predicate via verify_session_jwt_and_extract_claims + consent_grant) |
| `crisis_event_staff_reader` | clinician + care-team-member + admin (reads crisis_outcome_summary_staff_v ONLY; tenant-wide visibility) |
| `crisis_event_responder` | clinician + care-team-member (calls acknowledge + response + resolve wrappers) |

### Wrapper owner roles (3)

| Role | Owns |
|---|---|
| `crisis_event_writer_owner` | raw record_crisis_event_lifecycle_transition() (owner-only EXECUTE; granted to the 3 reason-specific wrappers below) |
| `crisis_acknowledgement_wrapper_owner` | record_crisis_acknowledgement_claim() + record_crisis_response() |
| `crisis_resolution_wrapper_owner` | record_crisis_resolution() |

### View owner role (1)

| Role | Owns |
|---|---|
| `crisis_view_owner` | crisis_outcome_summary_patient_v + crisis_outcome_summary_staff_v (both non-BYPASSRLS; owner-only base-table SELECT grants) |

---

## 8. Operational obligations

| Obligation | Window | Source-of-truth |
|---|---|---|
| Patient Crisis Response Card render | ≤ 200ms from `crisis.detected` Cat A emit | latency budget; merge-blocking integration test |
| Care-team acknowledgement (non-imminent severity) | ≤ 5 minutes (= notification_crisis_escalation_obligation.undeliverable_deadline) | persisted deadline |
| Care-team acknowledgement (imminent severity) | ≤ 60 seconds | persisted deadline |
| Care-team acknowledgement (life-threatening severity) | ≤ 30 seconds | persisted deadline |
| Clinical-on-call escalation (after no-ack timeout) | within 30 seconds of `crisis.no_acknowledgement_escalation` Cat A emit (R2 MED-1 closure 2026-05-21: corrected Cat B → Cat A to match the §3 AUDIT_EVENTS table + Sub-decision 6 fail-closed claim) | scheduled job sweep at 30s granularity |
| Regulatory threshold reached → Adverse-Event picks up | ≤ 2 minutes from `crisis.regulatory_threshold_reached` Cat A emit | Adverse-Event slice SLO |

---

## 9. Cross-SI alignment

| Cross-SI surface | This SI's surface | Relationship |
|---|---|---|
| I-019 (Crisis detection always-on) | Sub-decisions 1, 2, 3, 7 | This SI is the response surface that I-019 anchors; never override I-019 |
| P-025 SI-013 CCR crisis-helpline + Cat B audit | Sub-decisions 1, 2; AUDIT preserves P-025 entries | This SI consumes the 3 typed resolvers and the Cat B audit unchanged |
| P-027 §4.66-4.68 notification_crisis_dispatch_ledger + provider_attempt + escalation_obligation | Sub-decision 5, 6 | This SI wires crisis_event INSERT to dispatch_ledger fan-out |
| P-035 AI Service Mode 1 FLOOR-020 crisis-detection emit | Sub-decision 3 (consumes the emission) | This SI is downstream of FLOOR-020; never blocks the emit path |
| P-031 SI-024.1 v0.8 JWT-binding canonical trust anchor | All RLS policies + SECURITY DEFINER procedures + view predicates | All new entities use canonical pattern; verify_session_jwt_and_extract_claims + current_tenant_id_strict |
| I-035 append-only invariant | Sub-decision 4 (all 6 entities) | crisis_event + lifecycle_transition + acknowledgement_claim (hybrid release) + response_record + resolution all append-only or hybrid per I-035 |
| Adverse-Event Reporting slice | Sub-decision 3 step 7 (regulatory_threshold_reached) | This SI emits the trigger event; Adverse-Event Reporting picks up |
| Sync Video Consult slice | Sub-decision 3 step 5 (clinical-on-call channel) | This SI references escalation_destination; sync video slice implements the bridge |
| INVARIANTS bump | NOT in this SI | No new platform-floor invariants; alignment with I-019 + I-023 + I-027 + I-032 v5.3 + I-035 |

---

## 10. Deployment prerequisites preflight

Required pre-existing roles (CREATE ROLE happens in a prior baseline DDL):

| Role | Purpose |
|---|---|
| `crisis_event_writer_owner` | Raw crisis_event_lifecycle_transition writer |
| `crisis_acknowledgement_wrapper_owner` | Acknowledge + response wrapper owner |
| `crisis_resolution_wrapper_owner` | Resolution wrapper owner |
| `crisis_view_owner` | Non-BYPASSRLS view owner (preflight asserts rolbypassrls=false) |
| `crisis_event_patient_reader` / `crisis_event_staff_reader` / `crisis_event_responder` | App roles |

Preflight DO block mirrors P-038 §10 deployment preflight pattern.

---

## 11. Open questions for ratifier (own ceremony)

1. **OQ1 — Codex pre-ratification target rounds.** Recommendation: 5-8 rounds + ship-it verification (smaller scope than P-037; only 6 new entities vs 7; reuses existing P-025 + P-027 infrastructure).
2. **OQ2 — Endpoint 6 unauthenticated-emergency posture.** This is the only platform endpoint accessible without JWT. Ratifier confirms: (a) IP-rate-limit at 60 req/min is canonical; (b) endpoint returns country-default helpline + emergency_number only (NO patient data); (c) no Cat A audit emission (no patient identity available); (d) endpoint NOT subject to I-024 tenant isolation (deliberately tenant-anonymous fallback).
3. **OQ3 — Severity classification source.** crisis_detection_trigger Cat A audit currently has `crisis_type` field but no `severity` field. Does crisis_detection emit set severity inline, or does this slice introduce a separate severity-classification step? Recommendation: Mode 1 FLOOR-020 emits with severity classified inline per the model's safety-tier output; this slice consumes the classified severity without re-classifying.
4. **OQ4 — Tenant configuration of fan-out channels.** Tenants configure WHICH channels exist (sms/email/in-app providers) but NOT whether fan-out happens. Ratifier confirms the canonical tenant_config keys: `crisis.fanout_channels[]` (allow-list per channel) + `crisis.clinical_on_call_channel` (which configured channel for clinical-on-call). I-019 forbids the keys from being empty/null.
5. **OQ5 — Hybrid persistence for crisis_acknowledgement_claim.** Same pattern as P-037 R4 consult_review_claim — append-only identity columns + one-way mutable released_at/released_reason via BEFORE UPDATE trigger. Confirm pattern applies; or should crisis acknowledgement be strict append-only (no claim release / no reassignment) given the safety-floor semantics? Recommendation: hybrid persistence is appropriate (a clinician who claims then becomes unavailable must be able to release the claim for re-assignment; the timeout-driven escalation in Sub-decision 6 also implies claim release).
6. **OQ6 — Designated emergency contact integration.** Sub-decision 3 step 6 fans out to designated emergency contact IFF Consent grant scope `emergency_contact_share`. Ratifier confirms (a) Consent slice canonical entity name (consent_grant per OQ4 from P-038); (b) the canonical scope literal value `emergency_contact_share`; (c) emergency contact dispatch is a separate (recipient_role='emergency_contact', channel='sms') row in notification_crisis_dispatch_ledger (not a new dispatch entity).

---

## 12. Codex pre-ratification status

**v0.1 DRAFT 2026-05-21:** pre-Codex-review.
**v0.2 DRAFT 2026-05-21 — R1 closures applied (2 HIGH + 1 MED):**
- **R1 HIGH-1 closed:** CCR lookup was placed on FLOOR-020 synchronous emit path, contradicting non-blocking detection invariant + creating Cat A/Cat B fail-mode mismatch on the same path. Fix: restructured Sub-decision 2 with explicit STEP 1-5 ordering — STEP 1 Cat A `crisis_detection_trigger` synchronous FLOOR-020 fail-closed; STEP 2 crisis_event INSERT + initial transition; STEP 3 Crisis Response Card render with cached/generic content (≤ 200ms); STEP 4 ASYNCHRONOUS CCR resolvers + `crisis.escalation_destination_resolved` Cat B fail-soft per P-025; STEP 5 reactive card hydration after STEP 4 outcome. Resolver failure NEVER blocks Cat A emission.
- **R1 HIGH-2 closed:** Sub-decision 5 proposed "one dispatch_ledger row per (recipient_role, channel)" — would have required amending P-027 §4.66 UNIQUE(tenant_id, patient_id, server_signal_id, channel) constraint to include recipient_role (structural change to ratified canonical schema; hard-floor item 6 territory). Fix: aligned with existing P-027 two-tier shape per Codex's recommendation — §4.66 dispatch_ledger row per channel-class records channel-level OBLIGATION (preserves canonical UNIQUE); §4.67 provider_attempt row per (recipient_role, channel) tuple records per-recipient OUTCOME (multiple SMS recipients = N provider_attempt rows under single SMS dispatch_ledger row). No P-027 schema amendment required.
- **R1 MED-1 closed:** Sub-decision 6 claimed `crisis.no_acknowledgement_escalation` is Cat A; §3 AUDIT_EVENTS table defined the same action ID as Cat B. Chose Cat A — safety-floor escalation evidence MUST be fail-closed audit-complete when a safety timeout fires; Cat B fail-soft tolerance would risk silent loss of escalation evidence during the exact failure mode the timer exists to catch. Updated §3 table + §1 in-scope tally (4 Cat A + 1 Cat B + 2 Cat C → 6 Cat A + 0 Cat B + 1 Cat C).

Authored on `spec/SI-022-crisis-response-slice-2026-05-21` branch off main at `fab0615` (post-P-038 merge). v0.1 commit `e7a7ebb`. v0.2 commit `c2b9e15`. v0.3 commit `f4001d2`. v0.4 commit `6ec0cc9`. v0.5 commit `18ef338`. v0.6 commit `595db3c`. v0.7 commit `0e287b5`. v0.8 commit `e34bf69`. v0.9 commit `adafe4b`. v0.10 commit `88af316`. v0.11 commit pending push for R11 verification.

**v0.11 DRAFT 2026-05-21 — R10 closure applied (1 HIGH):**
- **R10 HIGH-1 closed:** no-ack sweep didn't exclude acknowledged/resolved lifecycle states; safety-critical wedging risk on already-resolved crises. Two-layer fix: (1) terminalization contract — three lifecycle wrappers (acknowledge/respond/resolve) MUST set escalation_tier=NULL atomically on the obligation row; BEFORE UPDATE trigger only permits sweep-cycle advances or terminalization. (2) sweep predicate adds LATERAL JOIN to crisis_event_lifecycle_transition filtering current_state ∈ {detected, escalated} (defense-in-depth backstop). Added tests 16a-d (terminalization-per-wrapper + lifecycle-eligibility backstop).

**v0.10 DRAFT 2026-05-21 — R9 closure applied (1 HIGH):**
- **R9 HIGH-1 closed:** Sub-decision 4 lifecycle diagram still enumerated only 8 transition triples (omitted `escalated → escalated`). Added the 9th triple to Sub-decision 4 diagram + updated "9 allowed triples" count with R9 closure cross-reference to §6 + Sub-decision 6 STEP 1. All three normative state-machine locations now enumerate the same 9 triples.

**v0.9 DRAFT 2026-05-21 — R8 closure applied (1 HIGH):**
- **R8 HIGH-1 closed:** multi-tier sweep tries to INSERT `escalated → escalated` lifecycle transitions but state-machine transition triples table only permitted `detected → escalated` and `responded → escalated`; subsequent tier advances (sweep #2, #3) would fail CHECK + roll back, wedging tier progression — the same R6 HIGH-1 failure mode resurfaced via state-machine not escalation_key. Fix: added 9th triple `escalated → escalated` with reason `tier_progression_no_acknowledgement`; updated Sub-decision 6 STEP 1 normative contract to switch reason by current state ('no_acknowledgement_timeout' from 'detected', 'tier_progression_no_acknowledgement' from 'escalated').

**v0.8 DRAFT 2026-05-21 — R7 closures applied (1 HIGH + 1 MED):**
- **R7 HIGH-1 closed:** Sub-decision 6 prose still specified pre-R6 one-shot escalation_key model (only Sub-decision 5 SQL comments had the tier-cycle resettable model). Rewrote Sub-decision 6 as the authoritative normative tier-cycle contract — sweep predicate adds `escalation_tier IS NOT NULL` terminal exclusion; per-row atomic 5-step closure with explicit STEP 5 reset; canonical next_tier() + INTERVAL_for_severity_and_tier() definitions; multi-tier worked example through 3 sweep cycles ending in terminal exclusion.
- **R7 MED-1 closed:** tests #9 + #10 in Sub-decision 7 still asserted pre-R6 one-shot idempotency. Replaced with tier-cycle progression assertions: each tier transition fires in sequence; in-flight cycle re-runs are no-op (claim lock); post-reset pre-deadline re-runs are no-op (deadline not expired); post-next-deadline re-runs DO advance; terminal exclusion.

**v0.7 DRAFT 2026-05-21 — R6 closures applied (2 HIGH + 1 MED):**
- **R6 HIGH-1 closed:** escalation_key one-shot model suppressed all subsequent tier timeouts. Restructured Sub-decision 6 sweep as TIER-CYCLE resettable: per-row 5-step closure advances escalation_tier + resets escalation_key=NULL + computes new undeliverable_deadline; sweep predicate excludes terminal-tier rows where escalation_tier IS NULL.
- **R6 HIGH-2 closed:** STEP 1 Cat A emit + STEP 2 row inserts restructured as ATOMIC single BEGIN...COMMIT transaction via canonical FLOOR-020 audit-co-transactional pattern; on rollback no Cat A row commits + ERROR surfaced + I-019 preserved.
- **R6 MED-1 closed:** benchmark test #16 added to Sub-decision 7 enumerated list with workload (1000 concurrent INSERTs, 50 tenants, 100 req/s sustained 10s) + threshold (p99 ≤ 180ms across 5 runs) + CI gate; count updated to "16 merge-blocking integration tests".

**v0.6 DRAFT 2026-05-21 — R5 closures applied (1 HIGH + 1 MED):**
- **R5 HIGH-1 closed:** STEP 2c escalation_obligation INSERT row shape was under-specified for Sub-decision 6 sweep. This SI extends P-027 §4.68 row shape with `crisis_event_id` (composite FK), `severity` (enum), `escalation_tier` (enum {care_team, clinical_on_call, regulatory}). Sweep contract explicit: SELECT predicate `now() > undeliverable_deadline AND escalation_key IS NULL FOR UPDATE SKIP LOCKED`; 5-step per-row closure (lifecycle transition INSERT + escalation_key UPDATE one-way mutable + escalation_tier advance via next_tier() function + recipient fan-out via compute_crisis_recipient_mapping + Cat A audit emit).
- **R5 MED-1 closed:** added explicit STEP 2 per-operation latency contract — Cat A emit + 2a-2d INSERTs with p50/p99 budgets + indexes/constraints + degraded behavior; STEP 1+2+3 cumulative p99 ≤ 180ms (under 200ms patient-surface SLO). Added merge-blocking benchmark test #16 (1000 concurrent crisis_event INSERTs across 50 tenants under simulated contention). Explicit fail-closed posture: any STEP 2 sub-step failure rolls back the transaction + surfaces ERROR + the card does NOT render against partial state.

**v0.5 DRAFT 2026-05-21 — R4 closures applied (3 HIGH):**
- **R4 HIGH-1 closed:** Sub-decision 3 had residual "executed at Sub-decision 2 STEP 2c-2d ... synchronous with STEP 2" text that contradicted R3 HIGH-1 closure. Rewrote routing tree as ELIGIBILITY-only with explicit execution delegation to Sub-decision 2 STEP 4 (recipient fan-out) + STEP 5 (CCR + hydration). No STEP 2c-2d / "synchronous with STEP 2" language remains for logical recipients 2-5.
- **R4 HIGH-2 closed:** Sub-decision 3 had stale "CCR resolvers at STEP 4 + hydration at STEP 5" mapping pre-R3 renumbering. Corrected to canonical post-R3 STEP 4 = dispatch setup, STEP 5 = CCR + hydration.
- **R4 HIGH-3 closed (safety-critical):** stuck STEP 4 outbox row would have denied the no-acknowledgement timer ever firing because escalation_obligation INSERT was at STEP 4c. **Moved escalation_obligation INSERT into STEP 2c (synchronous, in same transaction as Cat A audit + crisis_event INSERT)** so the deadline source-of-truth row is guaranteed-armed; the Sub-decision 6 no-ack sweep now always has a row to find regardless of STEP 4 worker progress. STEP 2 sub-steps 2a (crisis_event) + 2b (lifecycle_transition) + 2c (escalation_obligation) + 2d (crisis_dispatch_outbox enqueue) all run in a single transaction; STEP 4 is recipient fan-out only.

**v0.4 DRAFT 2026-05-21 — R3 closures applied (1 HIGH + 1 MED):**
- **R3 HIGH-1 closed:** dispatch setup at STEP 2c-2e (synchronous; ahead of STEP 3 card render) violated the 200ms patient-surface SLO under many recipients, transient DB contention, or provider-channel unavailability. Fix: moved dispatch setup to a new STEP 4 asynchronous bounded outbox worker invoked via a same-tx outbox row inserted at STEP 2 (matches Consent slice domain-event same-tx outbox pattern from P-027 §4.66+); STEP 1+2+3 only is the synchronous patient-surface path (Cat A emit + crisis_event INSERT + card render); the 200ms SLO now applies to STEP 1-3 exclusively. STEP 4 worker emits `crisis.dispatch_attempt_failed` Cat C on provider failures + the no-ack sweep at Sub-decision 6 produces `crisis.no_acknowledgement_escalation` Cat A on deadline expiry. Outbox at-least-once + idempotent retry + dead-letter SLO captures stuck rows.
- **R3 MED-1 closed:** SQL literal channel-class enumeration (sms+email+in_app_push) would have unconditionally inserted dispatch_ledger rows for channels the tenant has not configured. Fix: STEP 4a INSERTs are SELECT-driven from `unnest(tenant.crisis.fanout_channels[])`; STEP 4b INSERTs are SELECT-driven from a STABLE function `compute_crisis_recipient_mapping(crisis_event_id, severity)` joining tenant config + care_team + consent_grant + severity. Deployment preflight asserts `cardinality(tenant.crisis.fanout_channels[]) > 0` (I-019 platform-floor); worker FAILS CLOSED if empty.

**v0.3 DRAFT 2026-05-21 — R2 closures applied (1 HIGH + 1 MED):**
- **R2 HIGH-1 closed:** Sub-decision 3 routing tree still had the old "render card → Cat B emit → crisis_event INSERT" sequence as the canonical decision tree, contradicting Sub-decision 2's STEP 1-5 emit ordering closure from R1. Implementer following Sub-decision 3 could reintroduce R1 HIGH-1 FLOOR-020 coupling (Cat B/resource lookup before durable crisis_event creation). Fix: rewrote Sub-decision 3 to specify LOGICAL recipient routing only (which recipients receive dispatch under what severity/consent/regulatory_reporting conditions); added explicit execution-order assertion deferring entirely to Sub-decision 2 STEP 1-5; added authority-of-each-Sub-decision anchor ("Sub-decision 2 is authoritative on emit ordering; Sub-decision 3 is authoritative on logical routing destinations only"). The routing tree is now unambiguously orthogonal to the emit-path independence model.
- **R2 MED-1 closed:** §1 + §3 audit category tally said "5 Cat A + 0 Cat B + 2 Cat C" but the §3 table actually lists 6 Cat A + 0 Cat B + 1 Cat C (my R1 MED-1 closure double-counted the Cat A move). Corrected tally arithmetic across §1 + §3 + the R1 MED-1 log entry. Also fixed §8 operational obligations row "30 seconds of `crisis.no_acknowledgement_escalation` Cat B emit" — R1 closure moved this action to Cat A but §8 SLO source text was missed in the sweep; corrected to Cat A. Audit category registry now internally consistent: 6 Cat A + 0 Cat B + 1 Cat C across §1, §3, §8, Sub-decision 6.

— Claude (Opus 4.7, 1M context), SI-022 Crisis Response Slice Spec v0.1 DRAFT authored 2026-05-21 per Master Completion Plan v1.0 Track 1 pilot-viable scope item 4 + established post-P-029 SI authoring pattern + CLAUDE.md autonomous-work + dual-recommendation + two-pass + auto-proceed + hard-floor item 6 disciplines + proactive application of all lessons-learned from P-031 through P-038 cycles. R1 Codex review queued.
