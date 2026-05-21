# SI-020 — Async Consult Slice PRD v1.0 → v2.0 implementation-readiness extension

**Version:** 0.3 DRAFT
**Status:** POST-R2 (1 HIGH closed inline: consult entity #1 schema in Sub-decision 1 omitted `payment_intent_id` despite Sub-decision 10 declaring it REQUIRED + NOT NULL; ratifiers/implementers following Sub-decision 1 row shape would create a CDM entity that couldn't persist the Billing intent reference, breaking revenue-anchor reconciliation + refund + webhook correlation. Fix: added `payment_intent_id` ULID NOT NULL + tenant-scoped composite FK to `billing_payment_intent(tenant_id, id)` + `payment_provider` TEXT NOT NULL CHECK enum + `currency` TEXT NOT NULL CHECK (ISO 4217 alpha) to the consult row shape; aligned with the OpenAPI response + DOMAIN_EVENTS payload + Billing subscription contract. Previously POST-R1 (1 HIGH + 1 MED closed inline: HIGH-1 claim/admission identity not durably modeled → added `consult_review_claim` entity #4 with composite UNIQUE enabling 5-column composite FK from `consult_clinician_decision` enforcing deciding clinician == claiming clinician at schema-invariant level + non-released/non-expired BEFORE INSERT trigger; MED-1 payment producer/consumer contract circular → canonical sequencing clarified: `POST /v1/async-consults` internally calls Billing's payment-intent creation BEFORE consult INSERT, Billing subscribes to `async_consult.initiated.v1` for observability not charge-initiation, refund flow on `decision_recorded` with `decision_type=decline`)
**Authoring date:** 2026-05-21
**Authoring location:** `Telecheck Master Bundle FINAL US REGION BASELINE/` (directly in canonical bundle path per post-P-035 promotion-on-author pattern)
**Owner:** Async & Refill Review Lead (existing v1.0 owner) + AI Service Lead (Mode 2 cross-cutting) + Pharmacy Portal slice owner (cross-cutting consumer)
**Related artifacts:**
- `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Async_Consult_Slice_PRD_v1_0.md` (current canonical v1.0; the artifact this SI extends)
- `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Master_Completion_Plan_v1_0.md` §Track 1 — "Async-Consult slice: intake → triage → clinical decision → response, with SI-005 record_consult_clinician_decision SECURITY DEFINER procedure"; pilot-viable scope item 2 (Ghana revenue anchor)
- Promotion Ledger P-021 (SI-005 record_consult_clinician_decision RATIFIED; this SI's clinician-decision-write SECURITY DEFINER procedure builds on SI-005)
- Promotion Ledger P-035 + P-036 (AI Service Mode 1 spec + CDM follow-on; Mode 1 is the consumer of Async-Consult outcome notifications via mode2_handoff_proposed pattern + cross-slice domain events)
- Promotion Ledger P-033 + P-034 (SI-019 Med-Interaction Option A persistence pattern; same Option A pattern applied here for consult lifecycle)
- Promotion Ledger P-031 (SI-024.1 v0.8 JWT-binding canonical trust anchor for v1.7+ slices)

---

## 1. Why this SI exists

The Master Completion Plan v1.0 names Async-Consult as **pilot-viable scope item 2** (Track 1 — Ghana revenue anchor; chronic-care patient-clinician workflow). Reading Async-Consult v1.0 against other v2.x slice PRDs (Pharmacy v2.1, Forms-Intake v2.1, Admin Backend v1.1, Med-Interaction v2.0 at P-033, Mode 1 at P-035) confirms the gap: v1.0 is **workflow-spec-complete** (7-step workflow, 6 clinician decision types, 15 states + transitions, audit narrative, dependencies enumeration) but **implementation-detail-incomplete** — lacks canonical row shapes, audit event taxonomy, OpenAPI endpoints, RBAC roles, tenant-threading, SECURITY DEFINER procedures, and the Option A append-only-only lifecycle persistence pattern that I-035 + SI-019 + Mode 1 established as canonical for v1.7+ slices.

The Plan's "spec ratification leads implementation by ≥1 sprint" rule means implementation cannot begin until the implementation-detail extensions are spec-ratified. This SI is the work plan for that extension.

**Scope:** specify the categories of v1.0 → v2.0 extension content + propose sub-decisions for each + identify cross-artifact contributions (CDM entities, OpenAPI endpoints, DOMAIN_EVENTS, AUDIT_EVENTS, RBAC roles, state machines, tenant-threading per ADR-023 + SI-024.1, SECURITY DEFINER procedures per SI-005 P-021 + I-032 v5.3 patterns).

**Out of scope (deferred to later SIs):**
- Mode 2 AI clinical summary preparation engine internals (covered by AI Clinical Assistant Slice; consumed by this SI as a producer of `consult_clinical_summary` rows but its implementation is separate)
- Payment & Billing internals (per-visit fee collection covered by Payment & Billing Spec; this SI defines the consult-fee-charge event as a domain event consumed by billing, not the billing implementation)
- Sync video consult workflow (covered by Sync Video Consult Slice PRD; this SI defines the async-to-sync conversion handoff event but not the sync implementation)
- Forms/Intake Engine v2.1 internals (consult intake templates defined there; this SI consumes the rendered intake submission, not the rendering)
- Refill workflow (separate Refill Slice; this SI emits prescribing events consumed by Pharmacy + Refill, not the refill implementation)

---

## 2. Identified gaps + proposed sub-decisions

Ten sub-decisions. Each is a ratifier-decision item; several can be batched at ratification ceremony.

### Sub-decision 1: CDM §4 new entity expansions (Option A append-only-only per I-035)

**Gap.** Async-Consult v1.0 §12 specifies 15 lifecycle states + transitions but no canonical row shape. The consult envelope, intake submission, AI clinical summary, clinician decision evidence, follow-up messages, and lifecycle transitions all need CDM entities.

**Proposed CDM additions (R1 HIGH-1 closure 2026-05-21: 7 new entities + 1 derived view; expanded from 6 to 7 entities by adding `consult_review_claim` (entity #4 numbered as §4.X+3a) to durably model claim/admission identity so deciding clinician identity is FK-enforceable against claiming clinician identity; Option A append-only-only persistence per I-035 — same canonical pattern as SI-019 + Mode 1; superseded mutable-state-column model from v1.0 §12):**

1. **`consult` (new entity, CDM v1.8 §4.X)** — consult envelope; 1 row per consult; durable identity; immutable post-INSERT. Columns: `id` ULID, `tenant_id`, `patient_id` FK to `patient(tenant_id, id)` (composite tenant-scoped FK), `delegate_id` ULID NULL (set IFF delegate-initiated), `consult_type` enum (`program_pathway | general`), `program_id` ULID NULL (set IFF consult_type=program_pathway; FK to `program(tenant_id, id)`), `initiation_source` enum (`program_enrollment | care_tab | mode_1_handoff | medication_detail | rpm_ccm_dashboard`), `consult_fee_cents` INT NOT NULL CHECK (>= 0), `currency` TEXT NOT NULL CHECK (length(currency) = 3) (ISO 4217 alpha; e.g., USD, GHS), **`payment_intent_id` ULID NOT NULL** (R2 HIGH-1 closure 2026-05-21 — canonical Billing intent reference required at consult INSERT per Sub-decision 10 sequencing; FK to `billing_payment_intent(tenant_id, id)` per Billing slice canonical entity; tenant-scoped composite FK enforces tenant identity propagation), **`payment_provider`** TEXT NOT NULL CHECK (payment_provider IN ('stripe', 'mtn_momo', 'flutterwave', 'mock_local_dev')) (per Telecheck multi-tenant CCR-driven payment-provider selection — provides Billing webhook correlation context), `expected_turnaround_at` TIMESTAMPTZ (24h from initiation), `created_at` TIMESTAMPTZ DEFAULT now(). Composite UNIQUE `(tenant_id, id, patient_id)` for downstream FK enforcement of patient identity propagation. Strict append-only per I-035 (`enforce_append_only()` trigger).

2. **`consult_intake_submission` (new entity, CDM v1.8 §4.X+1)** — 1 row per intake submission; immutable. Columns: `id` ULID, `tenant_id`, `consult_id` ULID FK to consult (composite tenant-scoped + patient-scoped FK), `patient_id`, `template_id` ULID FK to forms_template (canonical Forms/Intake Engine reference), `template_version` semver, `intake_payload_ciphertext` BYTEA NOT NULL (KMS-encrypted at rest per I-026 — intake contains PHI), `intake_payload_kms_envelope_*` 8-column flat envelope (mirrors SI-005 pattern), `submitted_at` TIMESTAMPTZ DEFAULT now(). Composite tenant-scoped FK to consult. Strict append-only.

3. **`consult_clinical_summary` (new entity, CDM v1.8 §4.X+2)** — 1 row per AI-prepared clinical summary; immutable. Columns: `id` ULID, `tenant_id`, `consult_id`, `patient_id`, `prepared_by_mode` enum (`mode_1 | mode_2`), `ai_provider` TEXT (per CCR), `model_id` TEXT, `summary_ciphertext` BYTEA NOT NULL (KMS-encrypted — clinical summary contains PHI), `summary_kms_envelope_*` 8-column envelope, `interaction_signals_snapshot` JSONB (Med-Interaction engine signals at prep time; non-PHI; references signal IDs from §4.NEW2 of P-034 CDM v1.7), `recommendation` enum NULL (`prescribe | recommend | refer | decline | request_more_data | escalate_to_sync`), `prepared_at` TIMESTAMPTZ DEFAULT now(). Strict append-only. Composite tenant-scoped FKs (`(tenant_id, consult_id, patient_id) → consult`) for patient identity propagation.

4. **`consult_review_claim` (new entity, CDM v1.8 §4.X+3a; R1 HIGH-1 closure 2026-05-21)** — 1 row per clinician claim of a consult for review; immutable post-INSERT (claim release happens via a SEPARATE append-only `claim_released` transition entry, not by mutating this row). Required to durably model claim/admission identity so `consult_clinician_decision` can FK to the active claim + the SECURITY DEFINER procedure can verify deciding clinician == claiming clinician at schema-invariant level (not just runtime). Columns: `id` ULID, `tenant_id`, `consult_id`, `patient_id`, `clinician_account_id` FK to accounts (the claiming clinician), `claimed_at` TIMESTAMPTZ DEFAULT now(), `claim_expires_at` TIMESTAMPTZ NOT NULL (90-minute claim timeout per clinician-coverage discipline; configurable per program), `released_at` TIMESTAMPTZ NULL (one-way mutation per same pattern as SI-024.1 break_glass_active_session.closed_at one-way; enforced by separate `one_way_released_at` trigger), `release_reason` enum NULL (`decision_recorded | claim_expired | reassigned | clinician_unavailable`). Composite UNIQUE `(tenant_id, id, consult_id, patient_id, clinician_account_id)` enables downstream `consult_clinician_decision` 5-column composite FK enforcing claim identity. Strict append-only on identity columns; one-way mutation on `released_at` per Mode 1 P-036 R7 one-way-lifecycle-trigger pattern. RLS via `current_tenant_id_strict('consult_review_claim')`.

5. **`consult_clinician_decision` (new entity, CDM v1.8 §4.X+3b)** — 1 row per clinician decision; immutable. Columns: `id` ULID, `tenant_id`, `consult_id`, `patient_id`, **`claim_id` ULID NOT NULL** (R1 HIGH-1 closure: FK enforces deciding clinician == claiming clinician via 5-column composite reference to `consult_review_claim`), `clinician_account_id` FK to accounts (MUST match claim's clinician_account_id via composite FK), `decision_type` enum (`prescribe | recommend | refer | decline | request_more_data | escalate_to_sync`), `agreement_with_ai_recommendation` enum (`accepted | modified | disagreed | no_ai_recommendation`), `decision_rationale_ciphertext` BYTEA NOT NULL (KMS-encrypted), `decision_rationale_kms_envelope_*` 8-column envelope, `interaction_signals_reviewed_ids` ULID[] (Med-Interaction signal IDs reviewed at decision time; non-PHI), `prescription_details_id` ULID NULL (set IFF decision_type=prescribe; FK to medication_request per CDM canonical), `referral_target_id` ULID NULL (set IFF decision_type=refer), `decided_at` TIMESTAMPTZ DEFAULT now(). Strict append-only. **5-column composite tenant-scoped FK**: `(tenant_id, claim_id, consult_id, patient_id, clinician_account_id) REFERENCES consult_review_claim(tenant_id, id, consult_id, patient_id, clinician_account_id)` enforces claim identity propagation at schema-invariant level. Additional CHECK: `decided_at <= (SELECT claim_expires_at FROM consult_review_claim WHERE id = claim_id)` — actually as a trigger-enforced constraint (PostgreSQL CHECK can't subquery; canonical implementation uses BEFORE INSERT trigger that validates claim is non-released + non-expired at decision time).

5. **`consult_lifecycle_transition` (new entity, CDM v1.8 §4.X+4)** — **Option A append-only transition log per I-035**; replaces the mutable-state-column model implied by v1.0 §12. 1 row per state transition. Columns: `id` ULID, `tenant_id`, `consult_id`, `from_state` enum (`none | initiated | intake | abandoned | submitted | processing | queued | under_review | decision_made | prescribed | advised | awaiting_data | escalated_to_sync | declined | referred | follow_up | completed | resumed | expired`), `to_state` enum (same set minus `none`), `transition_reason` enum (`initiation | intake_started | intake_abandoned | intake_resumed | intake_submitted | ai_processing_started | ai_processing_completed | queue_entered | clinician_claimed | decision_recorded | prescribed_outcome | advised_outcome | declined_outcome | referred_outcome | additional_data_requested | escalated_to_sync_outcome | patient_data_resubmitted | follow_up_started | follow_up_message_sent | follow_up_completed | consult_completed | intake_expired`), `transition_at`, `transition_by_actor_id` ULID (clinician/patient/system actor), `transition_by_actor_role` enum (`patient | delegate | clinician | system | ai_service | scheduler`), `metadata` JSONB. CHECK constraint enumerates allowed `(transition_reason, from_state, to_state)` triples (~22 triples per v1.0 §12 state machine; explicit enumeration in §4 below).

6. **`consult_follow_up_message` (new entity, CDM v1.8 §4.X+5)** — 1 row per follow-up message between patient and clinician (post-decision; within follow-up window per v1.0 §11). Columns: `id` ULID, `tenant_id`, `consult_id`, `patient_id`, `sender_role` enum (`patient | clinician`), `sender_account_id` FK to accounts, `message_ciphertext` BYTEA NOT NULL (KMS-encrypted), `message_kms_envelope_*` 8-column envelope, `sent_at` TIMESTAMPTZ DEFAULT now(). Strict append-only. Composite tenant-scoped FKs.

7. **`consult_outcome_summary_view` (new derived view, CDM v1.8 §4.X+6)** — **Plain view + non-BYPASSRLS owner + explicit `current_tenant_id_strict()` predicate** per the P-036 R7 data-minimization pattern. Aggregates current consult state from base tables; clinician dashboard + patient app read this view, not the base tables directly. Columns: `consult_id`, `tenant_id`, `patient_id`, `current_state`, `decision_type`, `prescribing_count`, `follow_up_message_count`, `created_at`, `last_transition_at`. View owner = `async_consult_view_owner` (non-BYPASSRLS); reader role = `async_consult_reader` (granted to clinician + patient app + pharmacy portal + admin; view-only access; cannot enumerate base tables; cannot read message ciphertext columns).

**Promotion class:** content-change; CDM bump (v1.8 → v1.9 at follow-on amendment cycle).

**Recommendation:** APPROVE (7 entities + 1 view; structural; matches established post-P-029 SI-spec-first promotion pattern).

### Sub-decision 2: AUDIT_EVENTS new action IDs

**Gap.** v1.0 §13 lists 11 audit events narratively but doesn't enumerate canonical action IDs or Cat A/B/C classification.

**Proposed action IDs (16 new under `async_consult.*` namespace; 4 Cat A + 5 Cat B + 7 Cat C):**

| # | Action ID | Category | Sampling | Partition | Source |
|---|---|---|---|---|---|
| 1 | `async_consult.initiated` | Cat C | high-volume sampled | P1 keyed by patient_id | Initiation endpoint on every consult creation |
| 2 | `async_consult.intake_submitted` | Cat C | high-volume sampled | P1 keyed by patient_id | Intake submission endpoint |
| 3 | `async_consult.intake_abandoned` | Cat C | not sampled (low-volume) | P1 keyed by patient_id | 48h-window scheduler on abandonment detection |
| 4 | `async_consult.ai_preparation_started` | Cat C | high-volume sampled | P1 keyed by patient_id | Mode 1/2 invocation start |
| 5 | `async_consult.ai_preparation_completed` | Cat C | high-volume sampled | P1 keyed by patient_id | AI clinical summary INSERT |
| 6 | `async_consult.ai_preparation_failed` | Cat B | not sampled | P2 keyed by tenant_id | AI invocation failure (timeout, provider unavailable, schema mismatch) |
| 7 | `async_consult.case_queued` | Cat C | high-volume sampled | P1 keyed by patient_id | AI preparation completion → queue entry |
| 8 | `async_consult.case_claimed` | Cat C | high-volume sampled | P1 keyed by patient_id | Clinician dashboard claim endpoint |
| 9 | `async_consult.clinician_decision_recorded` | Cat A | not sampled | P1 keyed by patient_id | `record_consult_clinician_decision()` SECURITY DEFINER procedure (extends SI-005 P-021) — gating Cat A audit (decision is clinical-evidence-of-action) |
| 10 | `async_consult.clinician_decision_rationale_disagreement` | Cat A | not sampled | P1 keyed by patient_id | Emitted on decisions where `agreement_with_ai_recommendation='disagreed'` (forensic record of AI-clinician divergence; PHI safety pattern) |
| 11 | `async_consult.prescribing_recorded` | Cat A | not sampled | P1 keyed by patient_id | Emitted when decision_type=prescribe + prescription written; cross-references medication_request canonical |
| 12 | `async_consult.additional_data_requested` | Cat C | not sampled (low-volume) | P1 keyed by patient_id | Clinician requests-more-data endpoint |
| 13 | `async_consult.escalated_to_sync` | Cat B | not sampled | P2 keyed by tenant_id | Cross-mode handoff to sync video consult |
| 14 | `async_consult.outcome_notification_sent` | Cat C | high-volume sampled | P1 keyed by patient_id | Patient notification dispatch (channel-specific) |
| 15 | `async_consult.follow_up_message_sent` | Cat C | not sampled (PHI-relevant) | P1 keyed by patient_id | Per follow-up message INSERT (patient or clinician) |
| 16 | `async_consult.invariant_violation_decision_without_admission` | Cat A | not sampled | P1 keyed by patient_id | Runtime invariant violation: `record_consult_clinician_decision()` called without prior `case_claimed` event (analogous to Mode 1 detector-before-LLM invariant); fails turn |

**Audit-CHECK constraint amendment:** enumerates all 16 new action IDs in `audit_events.action_id CHECK` per I-012 closure rule.

**Recommendation:** APPROVE (16 events; partition routing per SI-018; Cat A on clinician decision + prescribing aligns with SI-005 P-021 pattern + I-019 clinical-evidence floor).

### Sub-decision 3: DOMAIN_EVENTS new event types

**Gap.** v1.0 implies cross-slice publishing (Pharmacy receives prescriptions; Refill workflow consumes prescribing events; Adverse Event Reporting consumes adverse signals; Mode 1 consumes consult outcomes for patient explanation; Billing consumes consult-fee-charge) but doesn't enumerate canonical event types.

**Proposed event types (7 new under `async_consult.*` namespace; tenant-scoped per DOMAIN_EVENTS v5.2; additive enum extension; no version bump):**

| # | Event type | partition_key | Subscribers |
|---|---|---|---|
| 1 | `async_consult.initiated.v1` | `tenant_id:patient_id` | Billing (consult-fee charge); Adverse Event Reporting; patient mobile app push |
| 2 | `async_consult.intake_submitted.v1` | `tenant_id:patient_id` | AI Service Mode 1/2 (preparation trigger); analytics |
| 3 | `async_consult.clinical_summary_prepared.v1` | `tenant_id:patient_id` | Clinician dashboard (queue update); Med-Interaction engine cross-reference; analytics |
| 4 | `async_consult.clinician_decision_recorded.v1` | `tenant_id:patient_id` | Pharmacy Portal (prescription routing IFF decision_type=prescribe); Mode 1 (patient-facing explanation; per Mode 1 spec §3); Adverse Event Reporting; Billing (refund processing IFF decision_type=decline); analytics |
| 5 | `async_consult.prescribing_recorded.v1` | `tenant_id:patient_id` | Pharmacy Portal (canonical prescription receipt); Refill Slice (refill eligibility activation); patient mobile app |
| 6 | `async_consult.escalated_to_sync.v1` | `tenant_id:patient_id` | Sync Video Consult Slice (case handoff); scheduler (sync consult slot reservation) |
| 7 | `async_consult.outcome_completed.v1` | `tenant_id:patient_id` | Analytics; patient experience surveys; clinician panel metrics |

**Promotion class:** content-change; DOMAIN_EVENTS additive (no version bump per established pattern).

**Recommendation:** APPROVE.

### Sub-decision 4: OpenAPI endpoint set

**Gap.** v1.0 has zero OpenAPI traceability. Per OpenAPI v0.3 + Pharmacy v2.1 + Mode 1 spec precedent, every slice with API surface enumerates its endpoints in the slice PRD.

**Proposed endpoints (11 new under `/v1/async-consults/*`; tenant-scoped per ADR-023; RLS-enforced):**

| # | Method | Path | Caller role | Purpose |
|---|---|---|---|---|
| 1 | POST | `/v1/async-consults` | patient / delegate | Initiate consult; body specifies consult_type + program_id + initiation_source; returns `consult_id` + payment intent |
| 2 | POST | `/v1/async-consults/:consult_id/intake` | patient / delegate | Submit intake (or save draft); body: template_id + template_version + payload |
| 3 | POST | `/v1/async-consults/:consult_id/abandon` | patient / delegate / system | Mark intake abandoned (explicit OR 48h-window scheduler) |
| 4 | POST | `/v1/async-consults/:consult_id/ai-preparation` | AI Service | Trigger AI Mode 1/2 preparation (internal endpoint); body: preparation context |
| 5 | GET | `/v1/async-consults/:consult_id` | patient / delegate / clinician / admin | Read consult envelope + current_state (via consult_outcome_summary_view) |
| 6 | GET | `/v1/async-consults/queue` | clinician / admin | Clinician review queue (paginated; ordered by AI preparation completion time) |
| 7 | POST | `/v1/async-consults/:consult_id/claim` | clinician | Claim consult for review |
| 8 | POST | `/v1/async-consults/:consult_id/decision` | clinician | Record clinician decision (calls `record_consult_clinician_decision()` SECURITY DEFINER procedure per SI-005 P-021) |
| 9 | POST | `/v1/async-consults/:consult_id/request-additional-data` | clinician | Request additional data from patient |
| 10 | POST | `/v1/async-consults/:consult_id/follow-up-messages` | patient / clinician | Send follow-up message (within follow-up window) |
| 11 | GET | `/v1/async-consults/:consult_id/follow-up-messages` | patient / clinician / admin | List follow-up messages |

**Promotion class:** content-change; OpenAPI v0.3 → v0.4 (11 new endpoints).

**Idempotency:** endpoints 1 + 2 + 3 + 4 + 7 + 8 + 9 + 10 use `Idempotency-Key` header per canonical IDEMPOTENCY contract.

**Recommendation:** APPROVE.

### Sub-decision 5: State machine for consult lifecycle (Option A: derived from append-only transition log)

**Gap.** v1.0 §12 specifies 15 states + transitions but as state-mutations on a single row; Option A append-only-only persistence per I-035 (canonical for v1.7+ slices since SI-019) requires representation as append-only transition rows.

**Proposed state machine — `consult_lifecycle` (CDM `consult_lifecycle_transition` per Sub-decision 1 entity 5):**

Per Option A (Evans-ratified at SI-019 OQ7 2026-05-20):
- The `consult` envelope row is IMMUTABLE post-INSERT (no `state` column).
- Each lifecycle transition is recorded as a new INSERT into `consult_lifecycle_transition`.
- "Current state of consult X" is DERIVED via SQL: `SELECT to_state FROM consult_lifecycle_transition WHERE tenant_id = X.tenant_id AND consult_id = X.id ORDER BY transition_at DESC, id DESC LIMIT 1`.

States (18 total, including `none` sentinel for initial transition): `none | initiated | intake | abandoned | submitted | processing | queued | under_review | decision_made | prescribed | advised | awaiting_data | escalated_to_sync | declined | referred | follow_up | completed | resumed | expired`.

Allowed `(transition_reason, from_state, to_state)` triples (22 total; CHECK constraint enumerates):

```
('initiation',                       'none'              → 'initiated')
('intake_started',                   'initiated'         → 'intake')
('intake_abandoned',                 'intake'            → 'abandoned')
('intake_resumed',                   'abandoned'         → 'intake')
('intake_submitted',                 'intake'            → 'submitted')
('ai_processing_started',            'submitted'         → 'processing')
('ai_processing_completed',          'processing'        → 'queued')
('clinician_claimed',                'queued'            → 'under_review')
('decision_recorded',                'under_review'      → 'decision_made')
('prescribed_outcome',               'decision_made'     → 'prescribed')
('advised_outcome',                  'decision_made'     → 'advised')
('declined_outcome',                 'decision_made'     → 'declined')
('referred_outcome',                 'decision_made'     → 'referred')
('additional_data_requested',        'under_review'      → 'awaiting_data')
('patient_data_resubmitted',         'awaiting_data'     → 'submitted')
('escalated_to_sync_outcome',        'decision_made'     → 'escalated_to_sync')
('follow_up_started',                'prescribed'        → 'follow_up')
('follow_up_started',                'advised'           → 'follow_up')
('follow_up_message_sent',           'follow_up'         → 'follow_up')   -- self-loop; advisory log entry
('follow_up_completed',              'follow_up'         → 'completed')
('consult_completed',                'declined'          → 'completed')
('consult_completed',                'referred'          → 'completed')
('consult_completed',                'escalated_to_sync' → 'completed')
('intake_expired',                   'abandoned'         → 'expired')
```

Terminal states: `completed`, `expired`. (`prescribed`, `advised`, `awaiting_data`, etc. are non-terminal — flow to `follow_up` or `completed` next.)

**Promotion class:** content-change; State Machines v1.2 → v1.3 (new state machine; described as append-only transition-row pattern per I-035).

**Recommendation:** APPROVE.

### Sub-decision 6: RBAC roles + permissions

**Gap.** v1.0 §3 names actors but doesn't enumerate RBAC roles.

**Proposed RBAC roles (8 new):**

| Role | Purpose | Granted to |
|---|---|---|
| `async_consult_patient_initiator` | Initiate consults; submit intake; receive follow-up notifications | patient role (canonical patient access principal) |
| `async_consult_delegate_initiator` | Initiate consults on behalf of patient (per Consent slice delegation) | delegate role IFF has `book-consults` scope |
| `async_consult_clinician_reviewer` | Read queue + claim + record decision + request additional data + send follow-up | clinician role |
| `async_consult_signal_viewer` (view-only) | Read `consult_outcome_summary_view`; cannot read base-table message ciphertext columns | clinician + patient app + pharmacy portal + admin (per P-036 data-minimization pattern) |
| `async_consult_view_owner` (non-BYPASSRLS) | Owns the `consult_outcome_summary_view`; holds owner-only base-table SELECT grants | service-account-owner pattern; not granted to humans |
| `record_consult_decision_wrapper_owner` | Owns `record_consult_clinician_decision()` SECURITY DEFINER procedure (extends SI-005 P-021) | service-account-owner pattern |
| `record_consult_lifecycle_transition_writer_owner` | Owns raw transition writer (analogous to lifecycle_transition_writer_owner in SI-019; per-reason wrappers route through this) | service-account-owner pattern |
| `consult_ai_preparation_wrapper_owner` | Owns AI preparation invocation wrapper (Mode 1/2 trigger) | service-account-owner pattern |

**Promotion class:** content-change; RBAC v1.2 → v1.3 (8 new role definitions).

**Recommendation:** APPROVE.

### Sub-decision 7: Tenant-threading per ADR-023 + I-023 + SI-024.1 v0.8 JWT-binding canonical pattern

**Gap.** v1.0 doesn't explicitly state ADR-023 Model A tenant-threading.

**Proposed tenant-threading rules (per SI-024.1 v0.8 RATIFIED canonical pattern + I-035 + I-026):**

- All 6 new RLS-bearing entities carry `tenant_id` (Telecheck-{country}) per I-023 layer 2.
- RLS policies on all 6 entities key on `current_tenant_id_strict('<entity_name>')` per the SI-024.1 v0.8 canonical pattern (reads from `session_jwt_admission` cryptographically bound to current backend; Phase B fallback to GUC ONLY when entity's `phase_4_cutover_eligible=FALSE` AND `raw_guc_fallback_audited=TRUE`).
- Per-tenant KMS keys for `consult_intake_submission.intake_payload_kms_envelope` + `consult_clinical_summary.summary_kms_envelope` + `consult_clinician_decision.decision_rationale_kms_envelope` + `consult_follow_up_message.message_kms_envelope` per I-026 (PHI columns).
- All API endpoints + the SECURITY DEFINER procedures follow I-032 v5.3 Mode 1+2 tenant-GUC guard (Mode 1 NULL/blank → `tenant_guc_missing` rejection; Mode 2 mismatch → `tenant_guc_mismatch` rejection).
- Cross-tenant break-glass per I-024 — async-consult writes CANNOT cross tenants; cross-tenant clinician review of a different-tenant patient's consult requires canonical break-glass + privacy-officer review path (per CDM v1.6 §4.NEW4 `break_glass_active_session` from P-032).
- `jwt_migration_entity_status` seed scope: 6 entity names + the derived view's trust-anchor name + composite tenant-scoped FKs everywhere (patient + program + consult + admission identity propagation per P-036 R2/R4 closures).

**Promotion class:** reconciliation entry; no Registry version bump from tenant-threading alone.

**Recommendation:** APPROVE.

### Sub-decision 8: SECURITY DEFINER procedures (consult decision write + lifecycle transition writer + per-reason wrappers)

**Gap.** v1.0 §5.6 specifies clinician decision documentation as auditable but doesn't define the write path. Per SI-019 + Mode 1 + SI-005 P-021 precedent, decision recording goes through a SECURITY DEFINER procedure with multi-step validation including the I-032 v5.3 Tenant-GUC Mode 1+2 guard + SI-024.1 v0.8 JWT-verified actor identity.

**Proposed procedures (~7 new; mirrors SI-019 8.5 raw-writer-plus-wrappers pattern):**

- **`record_consult_lifecycle_transition()`** — raw SECURITY DEFINER writer for ALL transition reasons; owner-only EXECUTE; advisory lock on `(tenant_id, consult_id)`; state-continuity validation; tenant-GUC Mode 1+2 guard via SI-024.1 JWT-verified claims; rejects from terminal states; rejects activation-on-decision-without-prior-claim invariant violation.
- **`record_consult_initiation()`** wrapper — patient/delegate initiation; INSERTs consult row + transition row atomically; reason-specific evidence: program_id valid for tenant (IFF program_pathway), consent active.
- **`record_consult_intake_submission()`** wrapper — INSERTs intake_submission row + transition row atomically; reason-specific evidence: consult in `intake` state.
- **`record_consult_ai_preparation_completed()`** wrapper — INSERTs clinical_summary row + transition row atomically; reason-specific evidence: AI Mode 1/2 invocation reference exists.
- **`record_consult_clinician_decision()`** wrapper (extends SI-005 P-021 + Mode 1 spec §3.2 Cat A audit pattern) — atomic order: INSERT `consult_clinician_decision` row FIRST + INSERT prescription record IFF decision_type=prescribe (medication_request canonical) + call `record_consult_lifecycle_transition(reason=decision_recorded)` SECOND; per-step validation including clinician-role check via SI-024.1 JWT-verified `app.actor_role` + `pg_has_role()` pattern (per P-036 R3 closure); 12+ rejection codes (extends Mode 1's 12).
- **`record_consult_additional_data_request()`** wrapper — clinician request-more-data path; INSERTs domain event for patient notification.
- **`record_consult_follow_up_message()`** wrapper — patient/clinician follow-up message; INSERTs `consult_follow_up_message` row + transition row (self-loop for follow_up_message_sent).

Per-reason wrappers prevent the raw-writer-broadly-granted defect (per P-034 R4 closure). Raw transition writer EXECUTE restricted to wrapper owner roles ONLY.

**Promotion class:** content-change; CDM bump in lockstep with Sub-decision 1 entity additions.

**Recommendation:** APPROVE.

### Sub-decision 9: Optional rebuildable read-path projection

**Gap.** Under Option A append-only-only persistence, "get current state of consult X" requires deriving from `consult_lifecycle_transition`. For the clinician review queue (`GET /v1/async-consults/queue`) + patient app consult-status reads (frequent hot-path), this becomes a JOIN-heavy query.

**Proposed:** an OPTIONAL rebuildable materialized view `consult_current_state_mv` derived from `consult_lifecycle_transition` (mirrors SI-019 §4.NEW5 Sub-decision 9 pattern from P-033 + P-034 R5 closure). Tenant-scoped `DISTINCT ON (tenant_id, consult_id)` partitioning. Refresh on `async_consult.signal_lifecycle_transition_emitted.v1` domain event subscriber (incremental) OR low-jitter 30s schedule (periodic).

Same access-pattern discipline as Mode 1 P-036 R7 closure: plain view `consult_outcome_summary_view` over the MV with explicit `current_tenant_id_strict()` predicate; owner-only base-MV grants; reader role view-only.

**Promotion class:** content-change; optional CDM addition.

**Recommendation:** APPROVE as OPTIONAL implementation aid (Phase A may defer the MV + add in Phase B if read-path latency surfaces a hot spot).

### Sub-decision 10: Consult fee + payment integration (R1 MED-1 closure 2026-05-21: clarified sequencing to avoid circular handoff)

**Gap.** v1.0 §6 describes the payment model narratively but doesn't enumerate the canonical event payloads for Billing slice consumption. Earlier draft of this SI had a circular handoff: §4 endpoint contract said `POST /v1/async-consults` returned a `payment_intent_id` while §10 said Billing subscribes to `async_consult.initiated.v1` to generate that intent — contradictory ordering.

**Proposed canonical sequencing (R1 MED-1 closure):**

1. **Patient initiates consult via `POST /v1/async-consults`** → endpoint internally calls Billing slice's `POST /v1/billing/payment-intents` (synchronous internal call OR pre-step via API gateway) BEFORE creating the consult row. The Billing endpoint returns a `payment_intent_id` (and a client_secret for client-side payment confirmation).
2. **Async-Consult creates the `consult` row** with `payment_intent_id` populated (REQUIRED column; NOT NULL CHECK).
3. **Async-Consult emits `async_consult.initiated.v1` domain event** with `consult_id` + `payment_intent_id` + `consult_fee_cents` + `currency`. Billing slice subscribes ONLY for revenue-reconciliation observability (not for charge initiation — that already happened in step 1).
4. **`POST /v1/async-consults` response** returns `consult_id` + `payment_intent_id` + `client_secret` (client uses Stripe-equivalent SDK to confirm payment).
5. **Refund processing:** Billing slice subscribes to `async_consult.clinician_decision_recorded.v1` IFF `decision_type=decline` and initiates refund per v1.0 §6 refund policy. Refund-initiated emits `billing.refund_initiated.v1` consumed by patient app + analytics.

**Idempotency:** the `POST /v1/async-consults` endpoint uses `Idempotency-Key` header to ensure retries don't double-charge or double-create consults. The internal call to Billing's `POST /v1/billing/payment-intents` also uses `Idempotency-Key` derived from the consult's Idempotency-Key (canonical IDEMPOTENCY contract).

**Failure semantics:**
- Billing payment-intent creation fails → `POST /v1/async-consults` returns 503; no consult row created; no domain event emitted.
- Consult INSERT succeeds but domain event emission fails (audit-emission outbox pattern per FLOOR-020) → consult exists; outbox retries event delivery; Billing reconciliation eventually consistent.
- Patient confirms payment in client SDK → Stripe-equivalent webhook → Billing → emits `billing.payment_completed.v1` consumed by Async-Consult to transition consult from `initiated` → `intake` (canonical flow).

Async-Consult Sub-decision 1 entity 1 schema adjusted: `consult.payment_intent_id` ULID NOT NULL added (R1 MED-1 closure; canonical pre-existence required at consult INSERT time).

**No new entities in this SI for Billing** (Billing entities are in Billing Slice canonical scope; this SI's responsibility is the `payment_intent_id` reference + event emission + refund domain-event subscription).

**Recommendation:** APPROVE per R1 MED-1 closure canonical sequencing.

---

## 3. Cross-artifact impact summary

If all 10 sub-decisions ratify, the lockstep PR-A2-class commit lands:

- **CDM:** +**7 new entities** (consult, consult_intake_submission, consult_clinical_summary, **consult_review_claim** [R1 HIGH-1 closure 2026-05-21 — durable claim/admission identity], consult_clinician_decision, consult_lifecycle_transition, consult_follow_up_message) + 1 plain data-minimization view (consult_outcome_summary_view) + 1 OPTIONAL materialized view (consult_current_state_mv) + 7 SECURITY DEFINER procedures (including extended `record_consult_clinician_decision` with claim-FK validation per R1 HIGH-1 closure).
- **AUDIT_EVENTS:** +16 new action IDs (4 Cat A + 5 Cat B + 7 Cat C; explicit Sampling column per P-036 pattern).
- **DOMAIN_EVENTS:** +7 new event types (additive enum extension; no version bump).
- **OpenAPI:** +11 endpoints (v0.3 → v0.4).
- **State Machines:** +1 new state machine `consult_lifecycle` described as DERIVED from append-only transition log per Option A (v1.2 → v1.3).
- **RBAC:** +8 new role definitions (v1.2 → v1.3).
- **Slice PRD:** v1.0 → v2.0 with the above codified.
- **Registry:** v2.23 → v2.24 single bump consolidating all of the above.
- **Promotion Ledger:** 1 new entry (P-037 expected; CDM v1.8 → v1.9 follow-on amendment cycle queued as next deliverable post-SI ratification per established post-P-029 SI-spec-first promotion pattern).

**`jwt_migration_entity_status` seed scope at follow-on amendment:** 7 entity names (6 RLS-bearing tables + 1 derived view trust-anchor surface) with `phase_4_cutover_eligible=FALSE` + `raw_guc_fallback_audited=TRUE` defaults (Phase B fail-closed-with-audit posture per P-036).

---

## 4. Codex pre-ratification target

**Recommendation:** 6-10 rounds + 1 ship-it verification = 7-11 total. Async-Consult is a large slice (10 sub-decisions, 6 new entities, 7 SECURITY DEFINER procedures, 16 audit events, 7 domain events, 11 endpoints, 1 state machine with 22 transition triples, 8 RBAC roles, 1 optional MV + data-minimization view). Codex convergence likely 6-10 rounds based on SI-019 (7 rounds total post-OQ7) + Mode 1 (8 rounds; fresh-review-post-major-cycles) + CDM v1.7 follow-on (8 rounds) precedents. Expect similar HIGH-then-MED long-tail asymptote pattern.

STOP-and-escalate per CLAUDE.md hard-floor item 6 if any round surfaces architectural-judgment findings (e.g., proposed cross-slice canonical-contract amendments, new platform-floor invariants, etc.).

**Proactive pattern application (lessons-learned from P-031 through P-036 cycles):**
- All RLS via `current_tenant_id_strict('<entity_name>')` per SI-024.1 v0.8 (avoid pre-P-031 raw-GUC pattern that R5 of P-036 caught).
- All FKs tenant-scoped composite per P-034 R1 + P-036 R2/R4 patterns (avoid single-column tenant-corruption gaps).
- All SECURITY DEFINER procedures use JWT-verified actor identity via `verify_session_jwt_and_extract_claims()` per P-036 R3 closure (avoid `current_user` ownership-bypass + GUC-spoofing gaps).
- All append-only entities use `enforce_append_only()` trigger + explicit DDL binding per P-036 R4 closure (avoid prose-only enforcement gap).
- Derived view uses plain view + non-BYPASSRLS owner + explicit `current_tenant_id_strict()` predicate per P-036 R7 data-minimization closure (avoid security_invoker overexposure pattern).
- Composite UNIQUE on parent tables enabling downstream identity-propagation composite FKs per P-036 R4 closure (avoid conversation_id-skew gap on result rows).

---

## 5. Open questions for ratifier (slice-level decisions not blocking ratification)

Beyond the 10 sub-decisions above, the following questions are open and should be surfaced at ratifier ceremony (preserved from v1.0 §16 + new ones from this SI's scope expansion):

1. **OQ1 — Follow-up message window duration** (preserved from v1.0 §16). 7 days recommended; ratifier confirms.
2. **OQ2 — Async consult for minors** (preserved from v1.0 §16). Specific safeguarding-check flow for minor-patient consults; ratifier specifies.
3. **OQ3 — Consult history visibility for clinicians** (preserved from v1.0 §16). All-previous vs program-only vs last-N; ratifier picks default; configurable per program.
4. **OQ4 — Clinician assignment policy** (preserved from v1.0 §16). Continuity-of-care vs first-available; configurable per program.
5. **OQ5 — Second-opinion pathway architecture** (preserved from v1.0 §16). Architecturally accommodated via new consult (with own fee) or built-in right; ratifier specifies.
6. **OQ6 — Intake expiry SLA breach** (preserved from v1.0 §16). 48h+ SLA breach behavior; ratifier specifies stale-intake confirmation flow.
7. **OQ7 — Med-Interaction signal_id propagation** (new at this SI). `consult_clinical_summary.interaction_signals_snapshot` JSONB + `consult_clinician_decision.interaction_signals_reviewed_ids` ULID[] reference Med-Interaction signals per P-033 CDM v1.7 §4.NEW2. Should this be a hard tenant-scoped FK array (per Med-Interaction follow-on amendment's signal entity composite UNIQUE) or stay as opaque ULID array? Recommendation: opaque array for now; hard FK when Med-Interaction CDM v1.7 → v1.8 follow-on amendment cycle ratifies signal identity propagation contracts.
8. **OQ8 — Codex pre-ratification target rounds.** Recommendation: 6-10 rounds + ship-it verification per §4.

---

## 6. Codex pre-ratification status

**v0.1 DRAFT 2026-05-21:** pre-Codex-review.

**v0.2 DRAFT 2026-05-21 — R1 closures applied (1 HIGH + 1 MED):**
- **R1 HIGH-1 closed:** Decision ownership couldn't be enforced because claim/admission identity wasn't modeled in row shapes. `consult_clinician_decision` had only `clinician_account_id` but no FK to a claim record proving deciding clinician == claiming clinician. Clinician could record decision on queued or differently-claimed consult; only audit-time (not schema-time) detection possible. Fix: added **`consult_review_claim` entity #4** (immutable post-INSERT on identity columns; one-way mutation on `released_at` per Mode 1 P-036 R7 lifecycle-trigger pattern; composite UNIQUE `(tenant_id, id, consult_id, patient_id, clinician_account_id)`); promoted `consult_clinician_decision` to entity #5 with required `claim_id` ULID NOT NULL column + **5-column composite tenant-scoped FK** `(tenant_id, claim_id, consult_id, patient_id, clinician_account_id) REFERENCES consult_review_claim(tenant_id, id, consult_id, patient_id, clinician_account_id)` enforcing claim identity propagation at schema-invariant level + BEFORE INSERT trigger validating claim is non-released + non-expired at decision time. Decision-ownership invariant now enforceable at FK-evaluation time, not just runtime.
- **R1 MED-1 closed:** Payment producer/consumer contract had circular handoff (endpoint returned `payment_intent_id` while domain event was supposed to cause Billing to generate it). Risk: unchargeable consults / duplicate charges on retries / OpenAPI-vs-DOMAIN_EVENTS schema drift on revenue-anchor slice. Fix: canonical sequencing clarified in Sub-decision 10 — `POST /v1/async-consults` internally calls Billing's `POST /v1/billing/payment-intents` (synchronous internal call with Idempotency-Key) BEFORE consult INSERT; Billing returns `payment_intent_id` + `client_secret`; consult row REQUIRES `payment_intent_id` (NOT NULL CHECK); Billing subscribes to `async_consult.initiated.v1` for revenue-reconciliation observability ONLY (not for charge initiation; the charge was already initiated in step 1). Refund flow on `clinician_decision_recorded.v1` with `decision_type=decline` per v1.0 §6 + clear failure semantics for Billing-failure / outbox-event-failure / payment-confirmation-webhook paths.

Authored on `spec/si-020-async-consult-v2-0-implementation-readiness-2026-05-21` branch off main at `3b10b4c` (post-P-036 + Addendum 64). v0.2 commit `b34e7b0`. v0.3 commit pending push for R3 verification.

**v0.3 DRAFT 2026-05-21 — R2 closure applied (1 HIGH):**
- **R2 HIGH-1 closed:** Consult entity #1 schema in Sub-decision 1 omitted `payment_intent_id` despite Sub-decision 10 declaring it REQUIRED + NOT NULL. Row shape would let CDM ratify without the canonical payment anchor, breaking the revenue-anchor flow at reconciliation + refund + webhook correlation. Fix: added 3 columns to consult row shape — `payment_intent_id` ULID NOT NULL (tenant-scoped composite FK to canonical Billing slice `billing_payment_intent(tenant_id, id)`); `payment_provider` TEXT NOT NULL CHECK enum (`stripe | mtn_momo | flutterwave | mock_local_dev`); `currency` TEXT NOT NULL CHECK (ISO 4217 alpha; 3 chars). Aligned with OpenAPI response + DOMAIN_EVENTS payload + Billing subscription contract.

---

## 7. Sequence for ratification

1. Codex pre-ratification cycle on this SI (target 6-10 rounds + ship-it per §4).
2. SI converges → Decision Brief authored summarizing the 10 sub-decisions + 8 open questions for ratifier review.
3. Ratifier ceremony (Evans-led; chat-message ratification per cycle precedent).
4. **P-037** SI ratification (this SI lands as the canonical v1.0 → v2.0 implementation-readiness extension).
5. **P-038** follow-on amendment cycle lands CDM v1.8 → v1.9 + AUDIT_EVENTS v5.10 → v5.11 + DOMAIN_EVENTS additive + OpenAPI v0.3 → v0.4 + State Machines v1.2 → v1.3 + RBAC v1.2 → v1.3 + Slice PRD v1.0 → v2.0 + Promotion Ledger entry P-038 + Registry v2.24 → v2.25 in single commit (per established post-P-029 SI-spec-first promotion pattern; this would be the 6th instance after P-029, P-032, P-034, P-035, P-036).
6. Implementation work begins on `telecheck-app` code repo (post-ratification per "spec ratification leads implementation by ≥1 sprint" rule).

---

— Claude (Opus 4.7, 1M context), SI-020 Async Consult v1.0 → v2.0 implementation-readiness extension v0.1 DRAFT authored 2026-05-21 per Master Completion Plan v1.0 Track 1 anchor (Ghana revenue pilot critical-path slice; pilot-viable scope item 2) + established post-P-029 SI-spec-first promotion pattern + proactive application of all lessons-learned from P-031 through P-036 cycles (SI-024.1 JWT-binding canonical pattern + Option A append-only-only persistence per I-035 + composite tenant-scoped FKs + JWT-verified actor identity + data-minimization plain-view discipline). R1 Codex review queued.
