# SI-022 — Crisis Response Slice (Resource Lookup + Escalation Routing) Spec v1.0

**Version:** 0.1 DRAFT
**Status:** PRE-RATIFICATION (Codex R1 queued)
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
- 7 new AUDIT_EVENTS action IDs (4 Cat A + 1 Cat B + 2 Cat C) under `crisis.*` namespace EXTENDING the P-025 `crisis.escalation_destination_resolved` ratified scope
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

### Sub-decision 2 — Resource lookup contract (CCR integration)

**Decision:** All 3 P-025 typed resolvers are called in parallel during card resolution. The resolution outcome is recorded in a single `crisis.escalation_destination_resolved` Cat B audit row per P-025's 4-value `resolution_status` enum. Sub-decision 1's card consumes the resolution outcome:

| resolution_status | Card behavior |
|---|---|
| `'resolved'` | emergency_number + helpline + label all visible |
| `'partial_defaults'` | emergency_number visible (from country_profile default); helpline may be null |
| `'unmapped_country'` | "Call your local emergency services" fallback copy; helpline null |
| `'ccr_unavailable'` | fail-soft per P-025 Rule 4; cached-last-known values used if available; otherwise generic fallback |

**No platform admin can disable the lookup** (I-019 invariant). The lookup is on the FLOOR-020 synchronous emit path.

### Sub-decision 3 — Escalation routing decision tree

**Decision:** Crisis routing follows this fixed decision tree (NOT tenant-configurable per I-019):

```
crisis_detection_trigger emitted
    ↓
1. ALWAYS: render Crisis Response Card (Sub-decision 1) within 200ms
    ↓
2. ALWAYS: emit `crisis.escalation_destination_resolved` Cat B (P-025) via 3 typed resolvers
    ↓
3. ALWAYS: insert crisis_event row + 'detected' lifecycle transition (Sub-decision 4)
    ↓
4. ALWAYS: fan out notification via notification_crisis_dispatch_ledger (P-027 §4.66)
   to ALL active care-team channels (sms, email, in-app push) per tenant config
    ↓
5. IF severity ∈ {imminent, life_threatening}: emit `emergency_escalation` Cat A
   AND fan out to clinical-on-call (separate channel from care team)
    ↓
6. IF patient has designated emergency contact + consent grant scope ∈
   {emergency_contact_share}: fan out to emergency contact via same dispatch ledger
    ↓
7. IF severity ∈ {life_threatening} AND tenant has regulatory_reporting=true:
   emit `crisis.regulatory_threshold_reached` Cat A; Adverse-Event slice picks up
```

**Routing decisions are NEVER tenant-overridable.** Tenants configure WHICH channels exist (sms provider, email provider) but NOT whether routing happens. Steps 1, 2, 3, 4 are I-019 platform-floor.

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
  acknowledged → resolved   (acknowledged then directly resolved without separate response entity)
```

Transition triples enforced by CHECK on `crisis_event_lifecycle_transition` (NEW from_state, NEW to_state, NEW transition_reason). Mirrors P-037 + P-038 patterns: per-event advisory lock + monotonic transition_at + state continuity validation in BEFORE INSERT trigger.

### Sub-decision 5 — Notification fan-out + dispatch obligation

**Decision:** Crisis fan-out reuses the canonical `notification_crisis_dispatch_ledger` infrastructure from P-027 Sprint 16 §4.66 (channel-scoped UNIQUE on (tenant_id, patient_id, server_signal_id, channel)). Each crisis_event row generates one or more dispatch_ledger rows — one per (recipient_role, channel) tuple per the decision tree (Sub-decision 3).

Wire-up at the crisis_detection_trigger Cat A emit-time:

```sql
-- Step 1: INSERT crisis_event row (atomic with Cat A audit)
INSERT INTO crisis_event (tenant_id, patient_id, server_signal_id, ...) ...;

-- Step 2: INSERT initial lifecycle transition
INSERT INTO crisis_event_lifecycle_transition
    (tenant_id, crisis_event_id, from_state, to_state, transition_reason, transition_at)
VALUES (..., 'none', 'detected', 'initial_detection', now());

-- Step 3: INSERT N notification_crisis_dispatch_ledger rows per Sub-decision 3 tree
INSERT INTO notification_crisis_dispatch_ledger (tenant_id, patient_id, server_signal_id, channel, ...)
VALUES (..., 'sms'), (..., 'email'), (..., 'in_app_push'), ...;

-- Step 4: INSERT notification_crisis_escalation_obligation row with persisted undeliverable_deadline
INSERT INTO notification_crisis_escalation_obligation (tenant_id, patient_id, server_signal_id, escalation_key, undeliverable_deadline)
VALUES (..., now() + INTERVAL '5 minutes');
```

The 5-minute undeliverable_deadline is the canonical acknowledgement window for non-imminent severity. Imminent severity collapses to 60 seconds. Life-threatening collapses to 30 seconds.

### Sub-decision 6 — No-acknowledgement escalation timer

**Decision:** A scheduled job (one row per minute granularity, sweep every 30 seconds) reads `notification_crisis_escalation_obligation` rows where `now() > undeliverable_deadline AND escalation_key IS NULL`. For each such row, the job:

1. INSERTs a crisis_event_lifecycle_transition row from current state → `escalated` (reason: `no_acknowledgement_timeout`)
2. UPDATEs the escalation_obligation row to set `escalation_key` (one-way mutable; idempotency)
3. Fans out to the next tier per Sub-decision 3 step 5 (clinical-on-call); if already at clinical-on-call tier, fans out to regulatory_reporting per step 7
4. Emits `crisis.no_acknowledgement_escalation` Cat A audit event

The escalation_key write is one-way mutable via BEFORE UPDATE trigger (mirrors P-037 R4 hybrid persistence pattern).

### Sub-decision 7 — Test scaffolding (merge-blocking)

**Decision:** 15 merge-blocking integration tests + 3 static-analyzer rules (mirrors P-035 Mode 1 + P-037 SI-020 pattern):

**Integration tests (15):**
1. crisis_detection_trigger → Crisis Response Card renders within 200ms (latency budget)
2. Card renders even when CCR `crisis.escalation_destination_resolved` Cat B audit fails (Sub-decision 1 patient-surface-agreement)
3. `unmapped_country` resolution → fallback copy displayed
4. `partial_defaults` resolution → emergency_number visible; helpline null OK
5. `ccr_unavailable` → cached-last-known values used; generic fallback OK
6. Routing tree step 4 fan-out → all configured channels receive dispatch ledger rows
7. Imminent severity → clinical-on-call channel fanout AND `emergency_escalation` Cat A emitted
8. Life-threatening severity → regulatory_threshold_reached Cat A emitted; Adverse-Event picks up
9. No-acknowledgement timer → after undeliverable_deadline, escalation_obligation.escalation_key set; lifecycle transitions to `escalated`
10. Idempotency: re-running the no-ack sweep on the same row does NOT double-escalate (escalation_key already set)
11. Crisis_event lifecycle state-machine: invalid transition triple (e.g., `resolved → detected`) rejected by CHECK constraint
12. Caller-class-split view: patient calling `crisis_outcome_summary_v` sees only their own crisis events (verify_session_jwt_and_extract_claims predicate)
13. Caller-class-split view: clinician/care-team calling sees tenant-wide crisis events
14. Mode 1 chat: Crisis Response Card displaces the assistant turn visually but assistant turn preserved in conversation history
15. Tenant cannot disable crisis detection: any attempt to set tenant.crisis_detection_enabled=false raises ERROR (I-019 platform-floor)

**Static-analyzer rules (3):**
- TLC-CRISIS-001: no handler may catch+swallow a crisis_detection_trigger emission (would violate FLOOR-020); enforced by AST walker
- TLC-CRISIS-002: no DDL may DROP COLUMN on crisis_event or crisis_event_lifecycle_transition (append-only platform-floor); enforced by migration linter
- TLC-CRISIS-003: no tenant config row may have `crisis_*` keys set to false/null (I-019 enforcement); enforced by config-validation linter

---

## 3. AUDIT_EVENTS amendment (v5.11 → v5.12)

**7 new action IDs** under `crisis.*` namespace EXTENDING P-025 (which contributed `crisis.escalation_destination_resolved` Cat B):

| # | Action ID | Category | Sampling | Partition |
|---|---|---|---|---|
| 1 | `crisis.detected` | Cat A | NOT sampled (safety-floor) | P1 keyed by patient_id |
| 2 | `crisis.acknowledged` | Cat A | NOT sampled | P1 keyed by patient_id |
| 3 | `crisis.responded` | Cat A | NOT sampled | P1 keyed by patient_id |
| 4 | `crisis.resolved` | Cat A | NOT sampled | P1 keyed by patient_id |
| 5 | `crisis.no_acknowledgement_escalation` | Cat B | NOT sampled (governance) | P1 keyed by patient_id |
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

**Allowed transition triples (8 enumerated via CHECK constraint):**

| from_state | to_state | transition_reason |
|---|---|---|
| none | detected | initial_detection |
| detected | acknowledged | clinician_claim |
| detected | escalated | no_acknowledgement_timeout |
| acknowledged | responded | response_action_recorded |
| responded | resolved | resolution_recorded |
| responded | escalated | response_failed |
| escalated | acknowledged | higher_tier_claim |
| acknowledged | resolved | direct_resolution |

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
| Clinical-on-call escalation (after no-ack timeout) | within 30 seconds of `crisis.no_acknowledgement_escalation` Cat B emit | scheduled job sweep at 30s granularity |
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

Authored on `spec/SI-022-crisis-response-slice-2026-05-21` branch off main at `fab0615` (post-P-038 merge).

— Claude (Opus 4.7, 1M context), SI-022 Crisis Response Slice Spec v0.1 DRAFT authored 2026-05-21 per Master Completion Plan v1.0 Track 1 pilot-viable scope item 4 + established post-P-029 SI authoring pattern + CLAUDE.md autonomous-work + dual-recommendation + two-pass + auto-proceed + hard-floor item 6 disciplines + proactive application of all lessons-learned from P-031 through P-038 cycles. R1 Codex review queued.
