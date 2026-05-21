# SI-020 — Async Consult Slice PRD v1.0 → v2.0 implementation-readiness extension

**Version:** 0.7 DRAFT
**Status:** POST-R6 (1 HIGH closed inline: R5's expired-claim auto-release was specified but the corresponding audit event `claim_expired_auto_released` wasn't added to the Sub-decision 2 canonical audit table — implementer following the audit table would omit/reject the event; namespace was wrong (`ai.async_consult.*` instead of `async_consult.*`); described as "optional" not "required". Fix: added 17th canonical Cat B event row to Sub-decision 2 audit table + corrected namespace + made required (not optional); updated §3 cross-artifact summary count from 16 → 17; updated procedure body comment to mandate emission in the same transaction via canonical audit-emission outbox pattern when STEP 2 auto-releases. Previously POST-R5 (1 HIGH closed inline: partial UNIQUE INDEX only filters `released_at IS NULL` not expiry-aware, so expired-but-unreleased claims permanently block new claims (90-minute timeout becomes stuck-consult absent out-of-band scheduler). Fix: `claim_consult_for_review()` procedure body specified with explicit STEP 2 — under the same `(tenant_id, consult_id)` advisory lock, UPDATE expired prior claims to released_at=now()+release_reason='claim_expired' BEFORE attempting INSERT new claim. Self-healing; expired claims don't strand consults; partial UNIQUE INDEX permits the new claim post-release. Previously POST-R4 (1 HIGH closed inline: consult_review_claim release semantics contradictory — claim row described as both "immutable post-INSERT / strict append-only" AND "one-way mutable on released_at" without resolving the contradiction. Reassignment path would either be impossible (if implementers followed append-only-only) OR break the single-active-claim invariant (if they bypassed). Fix: explicit hybrid persistence pattern with canonical DDL + procedure body — `consult_review_claim_one_way_released_at` BEFORE UPDATE trigger PERMITS only NULL→non-NULL on `released_at` + `release_reason`, rejects all other column updates; `reassign_consult_claim()` SECURITY DEFINER procedure does UPDATE-release-prior-THEN-INSERT-new in single transaction under advisory lock; partial UNIQUE INDEX + one-way trigger + reassignment procedure now mutually consistent. Pattern matches SI-024.1 P-031 `break_glass_active_session.closed_at` + Mode 1 P-036 R7 derived-view one-way-lifecycle-trigger discipline. Previously POST-R3 (1 HIGH closed inline: consult_review_claim composite UNIQUE didn't prevent multiple concurrent active claims for the same `(tenant_id, consult_id, patient_id)` — under concurrent /claim requests or partial-observation retries, two clinicians could each create valid claim rows and both satisfy the decision FK. Fix: added tenant-scoped partial UNIQUE INDEX `(tenant_id, consult_id, patient_id) WHERE released_at IS NULL` enforcing single-active-claim invariant at schema level + advisory-lock-before-INSERT pattern in the `claim_consult_for_review()` SECURITY DEFINER wrapper per SI-024.1 P-031 + SI-019 P-033 wrapper-acquires-lock discipline; structured `claim_already_held` rejection on conflict + atomic reassignment path documented. Previously POST-R2 (1 HIGH closed inline: consult entity #1 schema in Sub-decision 1 omitted `payment_intent_id` despite Sub-decision 10 declaring it REQUIRED + NOT NULL; ratifiers/implementers following Sub-decision 1 row shape would create a CDM entity that couldn't persist the Billing intent reference, breaking revenue-anchor reconciliation + refund + webhook correlation. Fix: added `payment_intent_id` ULID NOT NULL + tenant-scoped composite FK to `billing_payment_intent(tenant_id, id)` + `payment_provider` TEXT NOT NULL CHECK enum + `currency` TEXT NOT NULL CHECK (ISO 4217 alpha) to the consult row shape; aligned with the OpenAPI response + DOMAIN_EVENTS payload + Billing subscription contract. Previously POST-R1 (1 HIGH + 1 MED closed inline: HIGH-1 claim/admission identity not durably modeled → added `consult_review_claim` entity #4 with composite UNIQUE enabling 5-column composite FK from `consult_clinician_decision` enforcing deciding clinician == claiming clinician at schema-invariant level + non-released/non-expired BEFORE INSERT trigger; MED-1 payment producer/consumer contract circular → canonical sequencing clarified: `POST /v1/async-consults` internally calls Billing's payment-intent creation BEFORE consult INSERT, Billing subscribes to `async_consult.initiated.v1` for observability not charge-initiation, refund flow on `decision_recorded` with `decision_type=decline`)
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

4. **`consult_review_claim` (new entity, CDM v1.8 §4.X+3a; R1 HIGH-1 + R3 HIGH-1 + R4 HIGH-1 closures 2026-05-21)** — 1 row per clinician claim of a consult for review; **hybrid persistence: identity columns are strict append-only post-INSERT; `released_at` + `release_reason` are one-way-mutable (NULL → non-NULL only) per the canonical Mode 1 P-036 R7 lifecycle-trigger pattern AND the SI-024.1 P-031 `break_glass_active_session.closed_at` one-way pattern**. Required to durably model claim/admission identity so `consult_clinician_decision` can FK to the active claim + the SECURITY DEFINER procedure can verify deciding clinician == claiming clinician at schema-invariant level (not just runtime). Columns: `id` ULID, `tenant_id`, `consult_id`, `patient_id`, `clinician_account_id` FK to accounts (the claiming clinician), `claimed_at` TIMESTAMPTZ DEFAULT now(), `claim_expires_at` TIMESTAMPTZ NOT NULL (90-minute claim timeout per clinician-coverage discipline; configurable per program), `released_at` TIMESTAMPTZ NULL (**one-way mutable** per `consult_review_claim_one_way_released_at` BEFORE UPDATE trigger; permits ONLY NULL → non-NULL transition), `release_reason` enum NULL (`decision_recorded | claim_expired | reassigned | clinician_unavailable`; **one-way mutable** alongside `released_at` via same trigger). Composite UNIQUE `(tenant_id, id, consult_id, patient_id, clinician_account_id)` enables downstream `consult_clinician_decision` 5-column composite FK enforcing claim identity. RLS via `current_tenant_id_strict('consult_review_claim')`.

**R4 HIGH-1 closure 2026-05-21 — explicit append-only carve-out + reassignment semantics.** The earlier draft said "immutable post-INSERT" + "Strict append-only on identity columns" + "one-way mutation on released_at" — three statements that read as contradictory. Resolution per the canonical hybrid pattern (SI-024.1 P-031 `break_glass_active_session.closed_at` + Mode 1 P-036 R7 derived-view one-way-lifecycle-trigger):

```sql
-- 1. Strict append-only enforced via BEFORE UPDATE trigger that PERMITS ONLY the release-field
--    columns (released_at, release_reason) to transition NULL → non-NULL; rejects all other column
--    updates and rejects non-NULL → different non-NULL transitions on the release fields:
CREATE FUNCTION consult_review_claim_one_way_released_at() RETURNS TRIGGER AS $$
BEGIN
    -- Reject any change to identity columns
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.tenant_id IS DISTINCT FROM OLD.tenant_id
       OR NEW.consult_id IS DISTINCT FROM OLD.consult_id
       OR NEW.patient_id IS DISTINCT FROM OLD.patient_id
       OR NEW.clinician_account_id IS DISTINCT FROM OLD.clinician_account_id
       OR NEW.claimed_at IS DISTINCT FROM OLD.claimed_at
       OR NEW.claim_expires_at IS DISTINCT FROM OLD.claim_expires_at THEN
        RAISE EXCEPTION 'consult_review_claim identity columns are strict append-only post-INSERT'
            USING ERRCODE = 'TLC27';
    END IF;
    -- Reject non-NULL → different non-NULL on release fields (one-way only)
    IF OLD.released_at IS NOT NULL AND NEW.released_at IS DISTINCT FROM OLD.released_at THEN
        RAISE EXCEPTION 'consult_review_claim.released_at is one-way (NULL → timestamp); cannot change once set: was % is %',
            OLD.released_at, NEW.released_at
            USING ERRCODE = 'invalid_column_reference';
    END IF;
    IF OLD.release_reason IS NOT NULL AND NEW.release_reason IS DISTINCT FROM OLD.release_reason THEN
        RAISE EXCEPTION 'consult_review_claim.release_reason is one-way (NULL → enum value); cannot change once set'
            USING ERRCODE = 'invalid_column_reference';
    END IF;
    -- Require release_reason set together with released_at
    IF (NEW.released_at IS NULL) IS DISTINCT FROM (NEW.release_reason IS NULL) THEN
        RAISE EXCEPTION 'consult_review_claim.released_at and release_reason must be set together'
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER consult_review_claim_one_way_released_at
    BEFORE UPDATE ON consult_review_claim
    FOR EACH ROW EXECUTE FUNCTION consult_review_claim_one_way_released_at();
-- Note: BEFORE DELETE rejects via enforce_append_only() applied separately.

-- 2. The tenant-scoped partial UNIQUE INDEX enforces single-active-claim:
CREATE UNIQUE INDEX consult_review_claim_active_per_consult_uniq
    ON consult_review_claim (tenant_id, consult_id, patient_id)
    WHERE released_at IS NULL;
```

**Reassignment SECURITY DEFINER procedure** (`reassign_consult_claim()`) — explicit transactional contract:

```sql
CREATE PROCEDURE reassign_consult_claim(
    p_tenant_id tenant_id_t,
    p_consult_id ULID,
    p_new_clinician_account_id ULID,
    p_release_reason TEXT  -- one of {reassigned, clinician_unavailable}
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE
    v_prior_claim_id ULID;
BEGIN
    -- STEP 0: SI-024.1 JWT-binding tenant guard (per P-031 + P-036 R3 pattern)
    -- (omitted here for brevity; see canonical pattern in §6/Sub-decision 8)

    -- STEP 1: acquire (tenant_id, consult_id) advisory lock
    PERFORM pg_advisory_xact_lock(
        hashtextextended('consult_review_claim:' || p_tenant_id::text || ':' || p_consult_id::text, 0)
    );

    -- STEP 2: find the currently-active claim (if any) under the lock
    SELECT id INTO v_prior_claim_id
        FROM consult_review_claim
        WHERE tenant_id = p_tenant_id AND consult_id = p_consult_id AND released_at IS NULL
        FOR UPDATE;  -- explicit row lock for the UPDATE-then-INSERT atomic pattern

    -- STEP 3: if a prior claim exists, release it via UPDATE (one-way trigger permits this exactly once)
    IF v_prior_claim_id IS NOT NULL THEN
        UPDATE consult_review_claim
        SET released_at = now(), release_reason = p_release_reason
        WHERE id = v_prior_claim_id;
    END IF;

    -- STEP 4: INSERT the new claim row; partial UNIQUE INDEX now permits this (prior is released)
    INSERT INTO consult_review_claim (
        id, tenant_id, consult_id, patient_id, clinician_account_id,
        claimed_at, claim_expires_at
    ) VALUES (
        gen_ulid(), p_tenant_id, p_consult_id,
        (SELECT patient_id FROM consult WHERE id = p_consult_id AND tenant_id = p_tenant_id),
        p_new_clinician_account_id,
        now(), now() + INTERVAL '90 minutes'
    );
    -- Both rows committed atomically under the advisory lock; concurrent /claim requests
    -- see the lock and serialize behind it.
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'claim_already_held'
            USING ERRCODE = 'unique_violation';
END;
$$;
```

This makes the partial UNIQUE INDEX + one-way trigger + reassignment procedure all consistent: identity columns truly immutable post-INSERT; release fields one-way-mutable exactly once; reassignment is transactional UPDATE-release-then-INSERT-new under advisory lock.

**R3 HIGH-1 closure 2026-05-21 — active-claim exclusivity invariant.** The composite UNIQUE including `id` enables the downstream FK but does NOT prevent concurrent unreleased claims for the same `(tenant_id, consult_id, patient_id)`. Under concurrent `/claim` requests OR a retry after a partially-observed claim flow, two clinicians could each create a valid claim row + both satisfy the decision FK — breaking the deciding-clinician==claiming-clinician invariant in a different way (multiple valid claiming clinicians simultaneously). Fix: add a **tenant-scoped partial UNIQUE INDEX on `(tenant_id, consult_id, patient_id) WHERE released_at IS NULL`** enforcing single-active-claim-per-consult at schema level:

```sql
CREATE UNIQUE INDEX consult_review_claim_active_per_consult_uniq
    ON consult_review_claim (tenant_id, consult_id, patient_id)
    WHERE released_at IS NULL;
```

**Plus claim-wrapper SECURITY DEFINER procedure discipline (mirrors SI-024.1 advisory-lock pattern; R5 HIGH-1 closure 2026-05-21 adds expired-claim auto-release):** the `claim_consult_for_review()` SECURITY DEFINER wrapper MUST acquire `pg_try_advisory_xact_lock` on `(tenant_id, consult_id)` BEFORE attempting INSERT into `consult_review_claim`. **Within the lock, the wrapper MUST first release any expired prior claim (released_at=now, release_reason='claim_expired') via UPDATE before attempting the INSERT** — without this, expired-but-unreleased claims permanently block new claims for the same consult (90-minute timeout becomes a stuck consult unless an out-of-band scheduler runs). Procedure body:

```sql
CREATE PROCEDURE claim_consult_for_review(
    p_tenant_id tenant_id_t,
    p_consult_id ULID,
    p_clinician_account_id ULID
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE
    v_expired_claim_id ULID;
    v_patient_id ULID;
BEGIN
    -- STEP 0: SI-024.1 JWT-binding tenant guard (per P-031 + P-036 R3 pattern)
    -- (canonical pattern referenced in §6/Sub-decision 8)

    -- STEP 1: advisory_xact_lock on (tenant_id, consult_id)
    PERFORM pg_advisory_xact_lock(
        hashtextextended('consult_review_claim:' || p_tenant_id::text || ':' || p_consult_id::text, 0)
    );

    -- STEP 2 (R5 HIGH-1 closure): release any expired prior claim under the lock
    UPDATE consult_review_claim
    SET released_at = now(), release_reason = 'claim_expired'
    WHERE tenant_id = p_tenant_id
      AND consult_id = p_consult_id
      AND released_at IS NULL
      AND claim_expires_at < now()
    RETURNING id INTO v_expired_claim_id;
    -- (R6 HIGH-1 closure 2026-05-21: REQUIRED Cat B audit emission per Sub-decision 2 table row 17:
    --  IF v_expired_claim_id IS NOT NULL, emit async_consult.claim_expired_auto_released event in
    --  the same transaction via the canonical audit-emission outbox pattern; payload includes
    --  prior_claim_id=v_expired_claim_id + prior_clinician_account_id (looked up under lock) +
    --  new_clinician_account_id=p_clinician_account_id + claim_expires_at + auto_released_at=now())

    -- STEP 3: lookup patient_id for the consult (composite identity propagation)
    SELECT patient_id INTO v_patient_id
        FROM consult
        WHERE tenant_id = p_tenant_id AND id = p_consult_id;

    -- STEP 4: INSERT new claim; partial UNIQUE INDEX now permits this (prior either released
    -- via STEP 2 or already released; no active claim remains)
    INSERT INTO consult_review_claim (
        id, tenant_id, consult_id, patient_id, clinician_account_id,
        claimed_at, claim_expires_at
    ) VALUES (
        gen_ulid(), p_tenant_id, p_consult_id, v_patient_id, p_clinician_account_id,
        now(), now() + INTERVAL '90 minutes'
    );
EXCEPTION
    WHEN unique_violation THEN
        -- A non-expired active claim exists; deliver structured rejection
        RAISE EXCEPTION 'claim_already_held'
            USING ERRCODE = 'unique_violation';
END;
$$;
```

The partial UNIQUE INDEX + one-way trigger + claim-with-auto-release procedure are now mutually consistent and self-healing: expired claims don't strand consults; concurrent /claim requests serialize behind the advisory lock; only one non-expired active claim per consult exists at any time.

Follow-on workflow (claim takeover via explicit reassignment) — same advisory-lock + UPDATE-release-prior + INSERT-new pattern, documented in the `reassign_consult_claim()` SECURITY DEFINER procedure body below.

5. **`consult_clinician_decision` (new entity, CDM v1.8 §4.X+3b)** — 1 row per clinician decision; immutable. Columns: `id` ULID, `tenant_id`, `consult_id`, `patient_id`, **`claim_id` ULID NOT NULL** (R1 HIGH-1 closure: FK enforces deciding clinician == claiming clinician via 5-column composite reference to `consult_review_claim`), `clinician_account_id` FK to accounts (MUST match claim's clinician_account_id via composite FK), `decision_type` enum (`prescribe | recommend | refer | decline | request_more_data | escalate_to_sync`), `agreement_with_ai_recommendation` enum (`accepted | modified | disagreed | no_ai_recommendation`), `decision_rationale_ciphertext` BYTEA NOT NULL (KMS-encrypted), `decision_rationale_kms_envelope_*` 8-column envelope, `interaction_signals_reviewed_ids` ULID[] (Med-Interaction signal IDs reviewed at decision time; non-PHI), `prescription_details_id` ULID NULL (set IFF decision_type=prescribe; FK to medication_request per CDM canonical), `referral_target_id` ULID NULL (set IFF decision_type=refer), `decided_at` TIMESTAMPTZ DEFAULT now(). Strict append-only. **5-column composite tenant-scoped FK**: `(tenant_id, claim_id, consult_id, patient_id, clinician_account_id) REFERENCES consult_review_claim(tenant_id, id, consult_id, patient_id, clinician_account_id)` enforces claim identity propagation at schema-invariant level. Additional CHECK: `decided_at <= (SELECT claim_expires_at FROM consult_review_claim WHERE id = claim_id)` — actually as a trigger-enforced constraint (PostgreSQL CHECK can't subquery; canonical implementation uses BEFORE INSERT trigger that validates claim is non-released + non-expired at decision time).

5. **`consult_lifecycle_transition` (new entity, CDM v1.8 §4.X+4)** — **Option A append-only transition log per I-035**; replaces the mutable-state-column model implied by v1.0 §12. 1 row per state transition. Columns: `id` ULID, `tenant_id`, `consult_id`, `from_state` enum (`none | initiated | intake | abandoned | submitted | processing | queued | under_review | decision_made | prescribed | advised | awaiting_data | escalated_to_sync | declined | referred | follow_up | completed | resumed | expired`), `to_state` enum (same set minus `none`), `transition_reason` enum (`initiation | intake_started | intake_abandoned | intake_resumed | intake_submitted | ai_processing_started | ai_processing_completed | queue_entered | clinician_claimed | decision_recorded | prescribed_outcome | advised_outcome | declined_outcome | referred_outcome | additional_data_requested | escalated_to_sync_outcome | patient_data_resubmitted | follow_up_started | follow_up_message_sent | follow_up_completed | consult_completed | intake_expired`), `transition_at`, `transition_by_actor_id` ULID (clinician/patient/system actor), `transition_by_actor_role` enum (`patient | delegate | clinician | system | ai_service | scheduler`), `metadata` JSONB. CHECK constraint enumerates allowed `(transition_reason, from_state, to_state)` triples (~22 triples per v1.0 §12 state machine; explicit enumeration in §4 below).

6. **`consult_follow_up_message` (new entity, CDM v1.8 §4.X+5)** — 1 row per follow-up message between patient and clinician (post-decision; within follow-up window per v1.0 §11). Columns: `id` ULID, `tenant_id`, `consult_id`, `patient_id`, `sender_role` enum (`patient | clinician`), `sender_account_id` FK to accounts, `message_ciphertext` BYTEA NOT NULL (KMS-encrypted), `message_kms_envelope_*` 8-column envelope, `sent_at` TIMESTAMPTZ DEFAULT now(). Strict append-only. Composite tenant-scoped FKs.

7. **`consult_outcome_summary_view` (new derived view, CDM v1.8 §4.X+6)** — **Plain view + non-BYPASSRLS owner + explicit `current_tenant_id_strict()` predicate** per the P-036 R7 data-minimization pattern. Aggregates current consult state from base tables; clinician dashboard + patient app read this view, not the base tables directly. Columns: `consult_id`, `tenant_id`, `patient_id`, `current_state`, `decision_type`, `prescribing_count`, `follow_up_message_count`, `created_at`, `last_transition_at`. View owner = `async_consult_view_owner` (non-BYPASSRLS); reader role = `async_consult_reader` (granted to clinician + patient app + pharmacy portal + admin; view-only access; cannot enumerate base tables; cannot read message ciphertext columns).

**Promotion class:** content-change; CDM bump (v1.8 → v1.9 at follow-on amendment cycle).

**Recommendation:** APPROVE (7 entities + 1 view; structural; matches established post-P-029 SI-spec-first promotion pattern).

### Sub-decision 2: AUDIT_EVENTS new action IDs

**Gap.** v1.0 §13 lists 11 audit events narratively but doesn't enumerate canonical action IDs or Cat A/B/C classification.

**Proposed action IDs (R6 HIGH-1 closure 2026-05-21: 17 new under `async_consult.*` namespace; 4 Cat A + 6 Cat B + 7 Cat C — added `claim_expired_auto_released` as 17th canonical Cat B event):**

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
| 17 | `async_consult.claim_expired_auto_released` | Cat B | not sampled | P2 keyed by tenant_id | R6 HIGH-1 closure 2026-05-21: emitted IFF `claim_consult_for_review()` STEP 2 auto-releases an expired prior claim BEFORE inserting the new claim. Required (not optional) forensic record of automated clinician-ownership transfer; without it, expired-claim takeovers would be observable only via comparing claim row state across timestamps. Procedure body MUST emit this event in the same transaction (outbox pattern) for every STEP 2 auto-release. Payload includes prior_claim_id + prior_clinician_account_id + new_clinician_account_id + claim_expires_at + auto_released_at. |

**Audit-CHECK constraint amendment:** enumerates all 17 new action IDs in `audit_events.action_id CHECK` per I-012 closure rule.

**Recommendation:** APPROVE (17 events under `async_consult.*` namespace; partition routing per SI-018; Cat A on clinician decision + prescribing + invariant violations aligns with SI-005 P-021 + Mode 1 P-035 patterns; Cat B on cross-mode escalations + expired-claim auto-release per audit-pipeline + reassignment-takeover discipline; Cat C high-volume sampled on per-step lifecycle observations).

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
- **AUDIT_EVENTS:** +**17 new action IDs** (4 Cat A + 6 Cat B + 7 Cat C; R6 HIGH-1 closure 2026-05-21 added `claim_expired_auto_released` as required Cat B event for canonical observability of expired-claim auto-release; explicit Sampling column per P-036 pattern).
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

Authored on `spec/si-020-async-consult-v2-0-implementation-readiness-2026-05-21` branch off main at `3b10b4c` (post-P-036 + Addendum 64). v0.2 commit `b34e7b0`. v0.3 commit `fca9e35`. v0.4 commit `79a4e24`. v0.5 commit `5cc2f1f`. v0.6 commit `3fca49c`. v0.7 commit pending push for R7 verification.

**v0.7 DRAFT 2026-05-21 — R6 closure applied (1 HIGH):**
- **R6 HIGH-1 closed:** R5's expired-claim auto-release was specified in the procedure body but the corresponding audit event `claim_expired_auto_released` wasn't added to the Sub-decision 2 canonical audit table (which enumerated 16 events under `async_consult.*`). Procedure body referenced it with wrong namespace (`ai.async_consult.*`) + called it "optional". Implementer following the audit table would omit/reject the event → expired-claim takeovers under-observable. Fix: added **17th canonical Cat B event** `async_consult.claim_expired_auto_released` to Sub-decision 2 audit table (P2 partition keyed by tenant_id) + corrected namespace consistency throughout + REQUIRED (not optional) emission via canonical audit-emission outbox pattern in same transaction when STEP 2 auto-releases; updated procedure-body comment to mandate emission; updated §3 cross-artifact summary count 16→17. Forensic record now complete for expired-claim takeover scenarios.

**v0.6 DRAFT 2026-05-21 — R5 closure applied (1 HIGH):**
- **R5 HIGH-1 closed:** partial UNIQUE INDEX (R3 closure) only filtered `released_at IS NULL`, not expiry-aware. Once a clinician claimed and disappeared, the row was expired-but-unreleased → partial UNIQUE INDEX continued to reject new claims with `claim_already_held` → 90-minute timeout became stuck consult absent out-of-band scheduler/job. Fix: explicit `claim_consult_for_review()` procedure body specified with **STEP 2 expired-claim auto-release** under the same advisory lock — UPDATE prior expired-but-unreleased claim to `released_at=now()` + `release_reason='claim_expired'` BEFORE attempting new claim INSERT. Self-healing; expired claims don't strand consults; partial UNIQUE INDEX permits the new claim post-release. Concurrent `/claim` requests serialize behind the advisory lock; only one non-expired active claim per consult exists at any time. Optional Cat B audit `ai.async_consult.claim_expired_auto_released` emitted when expired claim auto-released; documented for the §3 audit-event amendment table.

**v0.5 DRAFT 2026-05-21 — R4 closure applied (1 HIGH):**
- **R4 HIGH-1 closed:** consult_review_claim release semantics contradictory — described as both "immutable post-INSERT / strict append-only" AND "one-way mutable on released_at" without resolving. Reassignment path either impossible (under append-only-only) or schema-bypassing (breaking single-active-claim invariant). Fix per canonical hybrid pattern (SI-024.1 P-031 `break_glass_active_session.closed_at` + Mode 1 P-036 R7 derived-view one-way-lifecycle-trigger discipline): explicit `consult_review_claim_one_way_released_at` BEFORE UPDATE trigger PERMITS NULL→non-NULL transition on `released_at` + `release_reason` ONLY; rejects all other column updates with ERRCODE TLC27; rejects non-NULL→different-non-NULL on release fields. `reassign_consult_claim()` SECURITY DEFINER procedure body specified explicitly: advisory-lock-then-UPDATE-prior-release-fields-then-INSERT-new-claim in single transaction; concurrent /claim requests serialize behind the lock; unique_violation maps to structured `claim_already_held` rejection. Partial UNIQUE INDEX + one-way trigger + reassignment procedure now mutually consistent.

**v0.4 DRAFT 2026-05-21 — R3 closure applied (1 HIGH):**
- **R3 HIGH-1 closed:** consult_review_claim composite UNIQUE included `id`, enabling downstream FK but NOT preventing multiple concurrent active claims for same `(tenant_id, consult_id, patient_id)`. Under concurrent `/claim` requests or partial-observation retries, two clinicians could each create valid claim rows + both satisfy decision FK — breaking deciding-clinician==claiming-clinician invariant in a different way (multiple valid claiming clinicians simultaneously). Fix: added **tenant-scoped partial UNIQUE INDEX** `(tenant_id, consult_id, patient_id) WHERE released_at IS NULL` enforcing single-active-claim invariant at schema level + **advisory-lock-before-INSERT pattern** in `claim_consult_for_review()` SECURITY DEFINER wrapper (per SI-024.1 P-031 + SI-019 P-033 wrapper-acquires-lock discipline). Structured `claim_already_held` rejection on conflict + atomic reassignment SECURITY DEFINER procedure path (atomic-release-prior + INSERT-new under same advisory lock) for clinician handoff/takeover scenarios.

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
