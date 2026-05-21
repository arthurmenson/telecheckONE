# CDM v1.8 → v1.9 + AUDIT_EVENTS v5.10 → v5.11 + DOMAIN_EVENTS additive + OpenAPI v0.3 → v0.4 + State Machines v1.2 → v1.3 + RBAC v1.2 → v1.3 Amendment (SI-020 Async-Consult follow-on)

**Version:** 0.4 DRAFT
**Status:** POST-R3 (2 HIGH + 1 MED closed inline: HIGH-1 decision validation could race claim release/reassignment under READ COMMITTED → fix: BEFORE INSERT trigger now takes same per-consult advisory lock as claim/reassign procedures + SELECT...FOR UPDATE on claim row; HIGH-2 equal transition_at values could corrupt current-state derivation via UUID tie-break ambiguity → fix: strict > monotonic ordering on transition_at, no equality permitted for non-initial transitions; MED-1 clinician_account_id FK not tenant-scoped → fix: composite tenant-scoped FK `(tenant_id, clinician_account_id) → tenant_account_membership(tenant_id, account_id)` per assumed Identity slice canonical entity + new OQ3 for ratifier to confirm canonical name)
**Authoring date:** 2026-05-21 (1 HIGH closed inline: R1 continuity trigger validated NEW.from_state == latest to_state but didn't enforce monotonic transition_at ordering — backdated row could pass from_state check while corrupting current-state derivation (ORDER BY transition_at DESC), future-dated row could dominate immediately. Fix: trigger now reads latest transition_at alongside latest to_state under lock; rejects NEW.transition_at < latest transition_at + rejects future-dated > now() + 5s clock-skew tolerance. Monotonic-ordering invariant now schema-enforced. Previously POST-R1 (2 HIGH + 1 MED closed inline: HIGH-1 decision-validation trigger looked up claim by id only → fix: 5-column composite identity lookup (tenant_id + claim_id + consult_id + patient_id + clinician_account_id) with RAISE on missing row; HIGH-2 lifecycle continuity not enforced at table-level → fix: added BEFORE INSERT trigger `consult_lifecycle_transition_continuity` that takes per-consult advisory lock + validates new from_state == latest to_state + rejects from-terminal transitions, regardless of caller; MED-1 RBAC count mismatch (8 vs preflight's 12) → fix: recounted to 12 roles (4 app + 6 wrapper owners + 2 view/MV owners) matching deployment preflight enumeration)
**Authoring date:** 2026-05-21
**Trigger:** Promotion Ledger P-037 (SI-020 Async Consult v1.0 → v2.0 implementation-readiness extension RATIFIED; Registry v2.23 → v2.24). Per the established post-P-029 spec-first promotion pattern, SI-020's canonical content lands in CDM + AUDIT + DOMAIN_EVENTS + OpenAPI + State Machines + RBAC via a separate amendment cycle following SI ratification. **SIXTH instance** of the SI-spec-first promotion pattern (P-029, P-032, P-034, P-036, P-038 — note P-035 was SI-only without follow-on; P-038 is the 5th follow-on amendment in the post-P-029 lineage).
**Owner:** Async & Refill Review Lead + AI Service Lead + Pharmacy Portal slice owner + CDM owner + AUDIT_EVENTS owner + DOMAIN_EVENTS owner + OpenAPI owner + State Machines owner + RBAC owner.
**Parent SI:** SI-020 v0.11 RATIFIED (`Telecheck_SI_020_Async_Consult_v2_0_Implementation_Readiness.md`); P-037 is the ratification authority for this amendment.
**Companion documents:** P-031 (SI-024.1 v0.8 JWT-binding canonical trust anchor); P-032 (CDM v1.6 session_jwt_admission + jwt_migration_entity_status); P-021 (SI-005 record_consult_clinician_decision foundation); P-027 (Contracts Pack v5.3 + I-035); previous follow-on amendment patterns (`Telecheck_CDM_v1_4_to_v1_5_Amendment.md` P-029; `Telecheck_CDM_v1_5_to_v1_6_Amendment.md` P-032; `Telecheck_CDM_v1_6_to_v1_7_Amendment.md` P-034; `Telecheck_CDM_v1_7_to_v1_8_Amendment.md` P-036).

---

## 1. Purpose + scope

Mechanical consolidation of SI-020 v0.11 RATIFIED (P-037) canonical content into named bundle file sections. SIXTH instance of the established post-P-029 SI-spec-first promotion pattern.

**In scope:**

1. **CDM v1.8 → v1.9:** +7 new entities + 1 plain data-minimization view + 1 OPTIONAL rebuildable MV + 7 SECURITY DEFINER procedures (raw `record_consult_lifecycle_transition` + 5 reason-specific wrappers + `record_consult_clinician_decision` wrapper + `claim_consult_for_review` + `reassign_consult_claim`). Continuing CDM numbering from v1.8's 89 active entities + 5 derived views; v1.9 target: 96 active entities + 6 derived views + 1 optional MV.
2. **AUDIT_EVENTS v5.10 → v5.11:** +17 new action IDs under `async_consult.*` namespace (4 Cat A + 3 Cat B + 10 Cat C per SI-020 R7 closure).
3. **DOMAIN_EVENTS additive:** +7 new event types under `async_consult.*` namespace; additive enum extension (no version bump).
4. **OpenAPI v0.3 → v0.4:** +11 new endpoints under `/v1/async-consults/*`.
5. **State Machines v1.2 → v1.3:** +1 new state machine `consult_lifecycle` described as DERIVED from append-only `consult_lifecycle_transition` rows per Option A; CHECK constraint enumerates 22 allowed `(transition_reason, from_state, to_state)` triples.
6. **RBAC v1.2 → v1.3:** +**12 new role definitions** (R1 MED-1 closure 2026-05-21: recounted to match §10 deployment preflight; earlier draft said "8 (4 application + 4 wrapper/owner)" which compressed 6 wrapper owner roles into 4 — actual count is 4 application + 6 wrapper owners + 2 view/MV owners = 12).
7. **`jwt_migration_entity_status` seed scope:** 8 entries (7 RLS-bearing tables + 1 derived view trust-anchor `consult_outcome_summary_view`) with `phase_4_cutover_eligible=FALSE` + `raw_guc_fallback_audited=TRUE` defaults; cdm_owner sequencing per P-036 R6 (tables first, view last).

**Out of scope:**

- SI-020 implementation in `telecheck-app` code repo (Phase A foundation).
- Billing slice canonical entities (referenced via `billing_payment_intent(tenant_id, id)` FK; entity defined in Billing Slice canonical scope).
- Forms/Intake Engine internals (referenced via `forms_template(tenant_id, id)` FK).
- Sync video consult slice (referenced via escalation event; covered separately).
- INVARIANTS bump (no new platform-floor invariants from SI-020; all closures align with I-019 + I-023 + I-026 + I-027 + I-032 v5.3 + I-035).

---

## 2. New CDM entities (7 active + 1 plain view + 1 OPTIONAL MV)

All 7 active entities are **P1 patient-bound** (per SI-018 partition rule). Tenant-threading per SI-024.1 v0.8 JWT-binding canonical pattern; all RLS via `current_tenant_id_strict('<entity_name>')`. Hybrid-persistence-with-one-way-release pattern applied to `consult_review_claim` per the new operational pattern documented at P-037 R4 closure.

**Composite identity propagation chain:** consult → admission → result; consult → review_claim → decision. All FKs tenant-scoped composite per P-034 R1 + P-036 R2/R4 + P-037 R2/R4 patterns.

**KMS encryption (I-026) on 4 PHI-bearing column groups:** intake_payload, clinical_summary, decision_rationale, follow_up_message ciphertext columns + 8-column flat envelope each (mirrors SI-005 P-021 pattern).

### §4.NEW1 — `consult` (CDM v1.9 new; SI-020 Sub-decision 1 entity 1)

```sql
CREATE TABLE consult (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    patient_id UUID NOT NULL,
    delegate_id UUID NULL,
    consult_type TEXT NOT NULL CHECK (consult_type IN ('program_pathway', 'general')),
    program_id UUID NULL,
    initiation_source TEXT NOT NULL CHECK (initiation_source IN (
        'program_enrollment', 'care_tab', 'mode_1_handoff', 'medication_detail', 'rpm_ccm_dashboard'
    )),
    consult_fee_cents INTEGER NOT NULL CHECK (consult_fee_cents >= 0),
    currency TEXT NOT NULL CHECK (length(currency) = 3),
    payment_intent_id UUID NOT NULL,
    payment_provider TEXT NOT NULL CHECK (payment_provider IN (
        'stripe', 'mtn_momo', 'flutterwave', 'mock_local_dev'
    )),
    expected_turnaround_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT consult_program_required_when_pathway CHECK (
        (consult_type = 'program_pathway' AND program_id IS NOT NULL)
        OR (consult_type = 'general' AND program_id IS NULL)
    ),
    -- Composite tenant-scoped FKs
    CONSTRAINT consult_patient_tenant_fk
        FOREIGN KEY (tenant_id, patient_id) REFERENCES patient(tenant_id, id),
    CONSTRAINT consult_program_tenant_fk
        FOREIGN KEY (tenant_id, program_id) REFERENCES program(tenant_id, id),
    CONSTRAINT consult_payment_intent_tenant_fk
        FOREIGN KEY (tenant_id, payment_intent_id) REFERENCES billing_payment_intent(tenant_id, id),
    CONSTRAINT consult_tenant_id_unique UNIQUE (tenant_id, id),
    CONSTRAINT consult_tenant_id_patient_unique UNIQUE (tenant_id, id, patient_id)
);

ALTER TABLE consult ENABLE ROW LEVEL SECURITY;
ALTER TABLE consult FORCE ROW LEVEL SECURITY;
CREATE POLICY consult_tenant_isolation ON consult
    USING (tenant_id = current_tenant_id_strict('consult'));
CREATE TRIGGER consult_append_only
    BEFORE UPDATE OR DELETE ON consult
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
```

**Cross-references:** SI-020 §Sub-decision 1 entity 1; SI-018 P1 partition; I-023 + I-026 + I-027 + I-035.

### §4.NEW2 — `consult_intake_submission` (CDM v1.9 new; SI-020 Sub-decision 1 entity 2)

```sql
CREATE TABLE consult_intake_submission (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    consult_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    template_id UUID NOT NULL,
    template_version TEXT NOT NULL,
    -- 8-column flat KMS envelope (mirrors SI-005 P-021 pattern)
    intake_payload_ciphertext BYTEA NOT NULL,
    intake_payload_kms_envelope_dek_id UUID NOT NULL,
    intake_payload_kms_envelope_iv BYTEA NOT NULL,
    intake_payload_kms_envelope_tag BYTEA NOT NULL,
    intake_payload_kms_envelope_alg TEXT NOT NULL,
    intake_payload_kms_envelope_alg_version TEXT NOT NULL,
    intake_payload_kms_envelope_aad BYTEA NOT NULL,
    intake_payload_kms_envelope_encrypted_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT consult_intake_submission_consult_patient_fk
        FOREIGN KEY (tenant_id, consult_id, patient_id)
        REFERENCES consult(tenant_id, id, patient_id),
    CONSTRAINT consult_intake_submission_template_fk
        FOREIGN KEY (tenant_id, template_id) REFERENCES forms_template(tenant_id, id)
);

ALTER TABLE consult_intake_submission ENABLE ROW LEVEL SECURITY;
ALTER TABLE consult_intake_submission FORCE ROW LEVEL SECURITY;
CREATE POLICY consult_intake_submission_tenant_isolation ON consult_intake_submission
    USING (tenant_id = current_tenant_id_strict('consult_intake_submission'));
CREATE TRIGGER consult_intake_submission_append_only
    BEFORE UPDATE OR DELETE ON consult_intake_submission
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
```

### §4.NEW3 — `consult_clinical_summary` (CDM v1.9 new; SI-020 Sub-decision 1 entity 3)

```sql
CREATE TABLE consult_clinical_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    consult_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    prepared_by_mode TEXT NOT NULL CHECK (prepared_by_mode IN ('mode_1', 'mode_2')),
    ai_provider TEXT NOT NULL CHECK (ai_provider IN (
        'anthropic', 'aws_bedrock', 'azure_openai', 'null_local_dev'
    )),
    model_id TEXT NOT NULL,
    -- 8-column KMS envelope
    summary_ciphertext BYTEA NOT NULL,
    summary_kms_envelope_dek_id UUID NOT NULL,
    summary_kms_envelope_iv BYTEA NOT NULL,
    summary_kms_envelope_tag BYTEA NOT NULL,
    summary_kms_envelope_alg TEXT NOT NULL,
    summary_kms_envelope_alg_version TEXT NOT NULL,
    summary_kms_envelope_aad BYTEA NOT NULL,
    summary_kms_envelope_encrypted_at TIMESTAMPTZ NOT NULL,
    interaction_signals_snapshot JSONB NOT NULL,
    recommendation TEXT NULL CHECK (recommendation IS NULL OR recommendation IN (
        'prescribe', 'recommend', 'refer', 'decline', 'request_more_data', 'escalate_to_sync'
    )),
    prepared_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT consult_clinical_summary_consult_patient_fk
        FOREIGN KEY (tenant_id, consult_id, patient_id)
        REFERENCES consult(tenant_id, id, patient_id)
);

ALTER TABLE consult_clinical_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE consult_clinical_summary FORCE ROW LEVEL SECURITY;
CREATE POLICY consult_clinical_summary_tenant_isolation ON consult_clinical_summary
    USING (tenant_id = current_tenant_id_strict('consult_clinical_summary'));
CREATE TRIGGER consult_clinical_summary_append_only
    BEFORE UPDATE OR DELETE ON consult_clinical_summary
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
```

### §4.NEW4 — `consult_review_claim` (CDM v1.9 new; SI-020 Sub-decision 1 entity 4; hybrid-persistence-with-one-way-release per P-037 R4 closure)

```sql
CREATE TABLE consult_review_claim (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    consult_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    clinician_account_id UUID NOT NULL,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    claim_expires_at TIMESTAMPTZ NOT NULL,
    released_at TIMESTAMPTZ NULL,
    release_reason TEXT NULL CHECK (release_reason IS NULL OR release_reason IN (
        'decision_recorded', 'claim_expired', 'reassigned', 'clinician_unavailable'
    )),
    -- Composite tenant-scoped FKs (R3 MED-1 closure 2026-05-21: clinician FK is now
    -- tenant-scoped composite to canonical tenant-scoped account-membership table; without
    -- this, accounts(id) could be reused across tenant contexts and tenant-isolation on the
    -- claim chain would depend on wrapper logic rather than table invariants).
    CONSTRAINT consult_review_claim_consult_patient_fk
        FOREIGN KEY (tenant_id, consult_id, patient_id)
        REFERENCES consult(tenant_id, id, patient_id),
    CONSTRAINT consult_review_claim_clinician_tenant_fk
        FOREIGN KEY (tenant_id, clinician_account_id)
        REFERENCES tenant_account_membership(tenant_id, account_id),
    -- (assumes canonical tenant_account_membership(tenant_id, account_id) composite UNIQUE
    --  from Identity slice canonical scope; if naming differs, ratifier confirms canonical
    --  target table name + adjust FK accordingly; ratifier OQ added in §12 OQ3 below.)
    -- 5-column composite UNIQUE enables downstream consult_clinician_decision FK
    -- enforcing deciding-clinician == claiming-clinician at schema-invariant level
    CONSTRAINT consult_review_claim_full_identity_unique
        UNIQUE (tenant_id, id, consult_id, patient_id, clinician_account_id),
    CONSTRAINT consult_review_claim_release_fields_together CHECK (
        (released_at IS NULL AND release_reason IS NULL)
        OR (released_at IS NOT NULL AND release_reason IS NOT NULL)
    )
);

-- Partial UNIQUE INDEX enforces single-active-claim-per-consult invariant
CREATE UNIQUE INDEX consult_review_claim_active_per_consult_uniq
    ON consult_review_claim (tenant_id, consult_id, patient_id)
    WHERE released_at IS NULL;

ALTER TABLE consult_review_claim ENABLE ROW LEVEL SECURITY;
ALTER TABLE consult_review_claim FORCE ROW LEVEL SECURITY;
CREATE POLICY consult_review_claim_tenant_isolation ON consult_review_claim
    USING (tenant_id = current_tenant_id_strict('consult_review_claim'));

-- Hybrid persistence trigger (P-037 R4 closure new operational pattern):
-- Identity columns + claimed_at + claim_expires_at: strict append-only
-- released_at + release_reason: one-way mutable (NULL → non-NULL only)
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
        RAISE EXCEPTION 'consult_review_claim.release_reason is one-way; cannot change once set'
            USING ERRCODE = 'invalid_column_reference';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER consult_review_claim_one_way_released_at
    BEFORE UPDATE ON consult_review_claim
    FOR EACH ROW EXECUTE FUNCTION consult_review_claim_one_way_released_at();

-- BEFORE DELETE rejected via separate append-only trigger
CREATE TRIGGER consult_review_claim_no_delete
    BEFORE DELETE ON consult_review_claim
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
```

### §4.NEW5 — `consult_clinician_decision` (CDM v1.9 new; SI-020 Sub-decision 1 entity 5; extends SI-005 P-021)

```sql
CREATE TABLE consult_clinician_decision (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    consult_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    claim_id UUID NOT NULL,
    clinician_account_id UUID NOT NULL,
    decision_type TEXT NOT NULL CHECK (decision_type IN (
        'prescribe', 'recommend', 'refer', 'decline', 'request_more_data', 'escalate_to_sync'
    )),
    agreement_with_ai_recommendation TEXT NOT NULL CHECK (agreement_with_ai_recommendation IN (
        'accepted', 'modified', 'disagreed', 'no_ai_recommendation'
    )),
    -- 8-column KMS envelope
    decision_rationale_ciphertext BYTEA NOT NULL,
    decision_rationale_kms_envelope_dek_id UUID NOT NULL,
    decision_rationale_kms_envelope_iv BYTEA NOT NULL,
    decision_rationale_kms_envelope_tag BYTEA NOT NULL,
    decision_rationale_kms_envelope_alg TEXT NOT NULL,
    decision_rationale_kms_envelope_alg_version TEXT NOT NULL,
    decision_rationale_kms_envelope_aad BYTEA NOT NULL,
    decision_rationale_kms_envelope_encrypted_at TIMESTAMPTZ NOT NULL,
    interaction_signals_reviewed_ids UUID[] NOT NULL,
    prescription_details_id UUID NULL,
    referral_target_id UUID NULL,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- 5-column composite tenant-scoped FK enforces deciding-clinician == claiming-clinician
    CONSTRAINT consult_clinician_decision_claim_fk
        FOREIGN KEY (tenant_id, claim_id, consult_id, patient_id, clinician_account_id)
        REFERENCES consult_review_claim(tenant_id, id, consult_id, patient_id, clinician_account_id),
    CONSTRAINT consult_clinician_decision_prescription_iff_prescribe CHECK (
        (decision_type = 'prescribe' AND prescription_details_id IS NOT NULL)
        OR (decision_type <> 'prescribe' AND prescription_details_id IS NULL)
    ),
    CONSTRAINT consult_clinician_decision_referral_iff_refer CHECK (
        (decision_type = 'refer' AND referral_target_id IS NOT NULL)
        OR (decision_type <> 'refer' AND referral_target_id IS NULL)
    )
);

ALTER TABLE consult_clinician_decision ENABLE ROW LEVEL SECURITY;
ALTER TABLE consult_clinician_decision FORCE ROW LEVEL SECURITY;
CREATE POLICY consult_clinician_decision_tenant_isolation ON consult_clinician_decision
    USING (tenant_id = current_tenant_id_strict('consult_clinician_decision'));
CREATE TRIGGER consult_clinician_decision_append_only
    BEFORE UPDATE OR DELETE ON consult_clinician_decision
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

-- BEFORE INSERT trigger validates claim is non-released + non-expired at decision time.
-- R1 HIGH-1 closure 2026-05-21: trigger lookup uses 5-column composite identity
-- (tenant_id, claim_id, consult_id, patient_id, clinician_account_id) — NOT just claim_id.
-- This makes the trigger consistent with the FK invariant: any future repair / migration /
-- test fixture that introduces mismatched claim identity fails closed at the same boundary
-- where the decision is being inserted, rather than relying on the FK alone to catch it.
CREATE FUNCTION consult_clinician_decision_validate_claim_active() RETURNS TRIGGER AS $$
DECLARE
    v_claim_released_at TIMESTAMPTZ;
    v_claim_expires_at TIMESTAMPTZ;
BEGIN
    -- R3 HIGH-1 closure 2026-05-21: take the same per-consult advisory lock used by
    -- claim_consult_for_review() + reassign_consult_claim() to serialize decision insertion
    -- against concurrent claim release/reassignment. Without this lock, a decision could
    -- validate an active claim under READ COMMITTED while a concurrent release UPDATE-s the
    -- claim row, leaving an append-only decision referencing a now-released claim.
    PERFORM pg_advisory_xact_lock(
        hashtextextended('consult_review_claim:' || NEW.tenant_id::text || ':' || NEW.consult_id::text, 0)
    );

    -- SELECT ... FOR UPDATE on the claim row pins the snapshot we'll validate against
    SELECT released_at, claim_expires_at
        INTO v_claim_released_at, v_claim_expires_at
        FROM consult_review_claim
        WHERE tenant_id = NEW.tenant_id
          AND id = NEW.claim_id
          AND consult_id = NEW.consult_id
          AND patient_id = NEW.patient_id
          AND clinician_account_id = NEW.clinician_account_id
        FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'consult_clinician_decision cannot reference claim with mismatched composite identity: tenant_id=%, claim_id=%, consult_id=%, patient_id=%, clinician_account_id=%',
            NEW.tenant_id, NEW.claim_id, NEW.consult_id, NEW.patient_id, NEW.clinician_account_id
            USING ERRCODE = 'check_violation';
    END IF;
    IF v_claim_released_at IS NOT NULL THEN
        RAISE EXCEPTION 'consult_clinician_decision cannot reference released claim: claim_id=%', NEW.claim_id
            USING ERRCODE = 'check_violation';
    END IF;
    IF v_claim_expires_at < NEW.decided_at THEN
        RAISE EXCEPTION 'consult_clinician_decision cannot reference expired claim: claim_id=% expired=%, decided=%',
            NEW.claim_id, v_claim_expires_at, NEW.decided_at
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER consult_clinician_decision_validate_claim_active
    BEFORE INSERT ON consult_clinician_decision
    FOR EACH ROW EXECUTE FUNCTION consult_clinician_decision_validate_claim_active();
```

### §4.NEW6 — `consult_lifecycle_transition` (CDM v1.9 new; SI-020 Sub-decision 1 entity 6; Option A append-only-only per I-035)

```sql
CREATE TABLE consult_lifecycle_transition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    consult_id UUID NOT NULL,
    from_state TEXT NOT NULL CHECK (from_state IN (
        'none', 'initiated', 'intake', 'abandoned', 'submitted', 'processing', 'queued',
        'under_review', 'decision_made', 'prescribed', 'advised', 'awaiting_data',
        'escalated_to_sync', 'declined', 'referred', 'follow_up', 'completed', 'resumed', 'expired'
    )),
    to_state TEXT NOT NULL CHECK (to_state IN (
        'initiated', 'intake', 'abandoned', 'submitted', 'processing', 'queued',
        'under_review', 'decision_made', 'prescribed', 'advised', 'awaiting_data',
        'escalated_to_sync', 'declined', 'referred', 'follow_up', 'completed', 'resumed', 'expired'
        -- 'none' is NEVER valid to_state
    )),
    transition_reason TEXT NOT NULL,
    transition_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    transition_by_actor_id UUID NULL,
    transition_by_actor_role TEXT NOT NULL CHECK (transition_by_actor_role IN (
        'patient', 'delegate', 'clinician', 'system', 'ai_service', 'scheduler'
    )),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT consult_lifecycle_transition_consult_fk
        FOREIGN KEY (tenant_id, consult_id) REFERENCES consult(tenant_id, id),
    -- CHECK enforces 22 allowed (transition_reason, from_state, to_state) triples
    CONSTRAINT consult_lifecycle_transition_valid_triple CHECK (
        (transition_reason = 'initiation'                  AND from_state = 'none'              AND to_state = 'initiated')
     OR (transition_reason = 'intake_started'              AND from_state = 'initiated'         AND to_state = 'intake')
     OR (transition_reason = 'intake_abandoned'            AND from_state = 'intake'            AND to_state = 'abandoned')
     OR (transition_reason = 'intake_resumed'              AND from_state = 'abandoned'         AND to_state = 'intake')
     OR (transition_reason = 'intake_submitted'            AND from_state = 'intake'            AND to_state = 'submitted')
     OR (transition_reason = 'ai_processing_started'       AND from_state = 'submitted'         AND to_state = 'processing')
     OR (transition_reason = 'ai_processing_completed'     AND from_state = 'processing'        AND to_state = 'queued')
     OR (transition_reason = 'clinician_claimed'           AND from_state = 'queued'            AND to_state = 'under_review')
     OR (transition_reason = 'decision_recorded'           AND from_state = 'under_review'      AND to_state = 'decision_made')
     OR (transition_reason = 'prescribed_outcome'          AND from_state = 'decision_made'     AND to_state = 'prescribed')
     OR (transition_reason = 'advised_outcome'             AND from_state = 'decision_made'     AND to_state = 'advised')
     OR (transition_reason = 'declined_outcome'            AND from_state = 'decision_made'     AND to_state = 'declined')
     OR (transition_reason = 'referred_outcome'            AND from_state = 'decision_made'     AND to_state = 'referred')
     OR (transition_reason = 'additional_data_requested'   AND from_state = 'under_review'      AND to_state = 'awaiting_data')
     OR (transition_reason = 'patient_data_resubmitted'    AND from_state = 'awaiting_data'     AND to_state = 'submitted')
     OR (transition_reason = 'escalated_to_sync_outcome'   AND from_state = 'decision_made'     AND to_state = 'escalated_to_sync')
     OR (transition_reason = 'follow_up_started'           AND from_state = 'prescribed'        AND to_state = 'follow_up')
     OR (transition_reason = 'follow_up_started'           AND from_state = 'advised'           AND to_state = 'follow_up')
     OR (transition_reason = 'follow_up_message_sent'      AND from_state = 'follow_up'         AND to_state = 'follow_up')
     OR (transition_reason = 'follow_up_completed'         AND from_state = 'follow_up'         AND to_state = 'completed')
     OR (transition_reason = 'consult_completed'           AND from_state IN ('declined', 'referred', 'escalated_to_sync') AND to_state = 'completed')
     OR (transition_reason = 'intake_expired'              AND from_state = 'abandoned'         AND to_state = 'expired')
    ),
    CONSTRAINT consult_lifecycle_transition_uniq UNIQUE (tenant_id, consult_id, transition_at, id)
);
CREATE INDEX consult_lifecycle_transition_latest
    ON consult_lifecycle_transition (tenant_id, consult_id, transition_at DESC, id DESC);

ALTER TABLE consult_lifecycle_transition ENABLE ROW LEVEL SECURITY;
ALTER TABLE consult_lifecycle_transition FORCE ROW LEVEL SECURITY;
CREATE POLICY consult_lifecycle_transition_tenant_isolation ON consult_lifecycle_transition
    USING (tenant_id = current_tenant_id_strict('consult_lifecycle_transition'));
CREATE TRIGGER consult_lifecycle_transition_append_only
    BEFORE UPDATE OR DELETE ON consult_lifecycle_transition
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

-- INSERT restricted to lifecycle_transition_writer_owner role
REVOKE INSERT ON consult_lifecycle_transition FROM PUBLIC;
GRANT INSERT ON consult_lifecycle_transition TO consult_lifecycle_transition_writer_owner;

-- R1 HIGH-2 closure 2026-05-21: lifecycle state continuity enforced via BEFORE INSERT trigger
-- regardless of caller (defense-in-depth even if writer owner is impersonated/used directly).
-- The row-level CHECK above validates each row's triple in isolation; this trigger additionally
-- proves that the row's from_state equals the current latest to_state for the consult, taking
-- the per-consult advisory lock to serialize concurrent transitions.
CREATE FUNCTION consult_lifecycle_transition_continuity() RETURNS TRIGGER AS $$
DECLARE
    v_latest_to_state TEXT;
    v_latest_transition_at TIMESTAMPTZ;
BEGIN
    -- Take per-consult advisory lock to serialize concurrent transitions
    PERFORM pg_advisory_xact_lock(
        hashtextextended('consult_lifecycle_transition:' || NEW.tenant_id::text || ':' || NEW.consult_id::text, 0)
    );

    -- Read latest to_state AND latest transition_at under the lock (R2 HIGH-1 closure 2026-05-21)
    SELECT to_state, transition_at
        INTO v_latest_to_state, v_latest_transition_at
        FROM public.consult_lifecycle_transition
        WHERE tenant_id = NEW.tenant_id AND consult_id = NEW.consult_id
        ORDER BY transition_at DESC, id DESC
        LIMIT 1;

    -- R2 HIGH-1 closure: also enforce monotonic transition_at ordering. Without this,
    -- backdated rows could pass the from_state check but corrupt derived current-state
    -- semantics (ORDER BY transition_at DESC determines current state); future-dated rows
    -- could dominate current-state reads immediately. Reject NEW.transition_at earlier
    -- than the latest transition_at AND reject future-dated rows beyond a small clock-skew
    -- tolerance (now() + 5s) to prevent immediate dominance attacks.
    IF NEW.transition_at > now() + INTERVAL '5 seconds' THEN
        RAISE EXCEPTION 'consult_lifecycle_transition: transition_at=% is more than 5s in the future (clock_skew_or_future_dated); consult_id=%',
            NEW.transition_at, NEW.consult_id
            USING ERRCODE = 'check_violation';
    END IF;

    -- Validate continuity
    IF v_latest_to_state IS NULL THEN
        -- No prior transition; only allowed if NEW.from_state = 'none' (initial emission)
        IF NEW.from_state <> 'none' THEN
            RAISE EXCEPTION 'consult_lifecycle_transition: first transition must have from_state=none; got from_state=% for consult_id=%',
                NEW.from_state, NEW.consult_id
                USING ERRCODE = 'check_violation';
        END IF;
    ELSE
        -- Existing transitions; new from_state MUST equal current latest to_state
        IF NEW.from_state IS DISTINCT FROM v_latest_to_state THEN
            RAISE EXCEPTION 'consult_lifecycle_transition continuity violation: from_state=% does not match latest to_state=% for consult_id=%',
                NEW.from_state, v_latest_to_state, NEW.consult_id
                USING ERRCODE = 'check_violation';
        END IF;
        -- Reject transitions FROM terminal states
        IF v_latest_to_state IN ('completed', 'expired') THEN
            RAISE EXCEPTION 'consult_lifecycle_transition: cannot transition from terminal state %; consult_id=%',
                v_latest_to_state, NEW.consult_id
                USING ERRCODE = 'check_violation';
        END IF;
        -- R2 HIGH-1 closure + R3 HIGH-2 closure (2026-05-21: strict monotonic ordering):
        -- Reject NEW.transition_at <= latest_transition_at. Equal timestamps could let derived
        -- current-state semantics break because the (transition_at DESC, id DESC) tie-break uses
        -- UUID ordering — newer transition's UUID isn't guaranteed to sort after older one's, so
        -- equal-timestamped successor could remain hidden behind predecessor and current_state
        -- could stay stale even after a valid transition was accepted. STRICT > inequality
        -- guarantees the just-inserted row is unambiguously the latest in the derivation order.
        IF NEW.transition_at <= v_latest_transition_at THEN
            RAISE EXCEPTION 'consult_lifecycle_transition: transition_at=% must be STRICTLY greater than latest transition_at=% (equal or backdated forbidden — UUID tie-break ambiguity would corrupt current-state derivation); consult_id=%',
                NEW.transition_at, v_latest_transition_at, NEW.consult_id
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER consult_lifecycle_transition_continuity
    BEFORE INSERT ON consult_lifecycle_transition
    FOR EACH ROW EXECUTE FUNCTION consult_lifecycle_transition_continuity();
```

### §4.NEW7 — `consult_follow_up_message` (CDM v1.9 new; SI-020 Sub-decision 1 entity 7)

```sql
CREATE TABLE consult_follow_up_message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    consult_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('patient', 'clinician')),
    sender_account_id UUID NOT NULL,
    -- 8-column KMS envelope
    message_ciphertext BYTEA NOT NULL,
    message_kms_envelope_dek_id UUID NOT NULL,
    message_kms_envelope_iv BYTEA NOT NULL,
    message_kms_envelope_tag BYTEA NOT NULL,
    message_kms_envelope_alg TEXT NOT NULL,
    message_kms_envelope_alg_version TEXT NOT NULL,
    message_kms_envelope_aad BYTEA NOT NULL,
    message_kms_envelope_encrypted_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT consult_follow_up_message_consult_patient_fk
        FOREIGN KEY (tenant_id, consult_id, patient_id)
        REFERENCES consult(tenant_id, id, patient_id)
);

ALTER TABLE consult_follow_up_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE consult_follow_up_message FORCE ROW LEVEL SECURITY;
CREATE POLICY consult_follow_up_message_tenant_isolation ON consult_follow_up_message
    USING (tenant_id = current_tenant_id_strict('consult_follow_up_message'));
CREATE TRIGGER consult_follow_up_message_append_only
    BEFORE UPDATE OR DELETE ON consult_follow_up_message
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
```

### §4.NEW8 — `consult_outcome_summary_view` (CDM v1.9 new plain data-minimization view per P-036 R7 pattern)

```sql
-- Per P-036 R7 closure data-minimization pattern: plain view + owner-only base-table grants
-- + explicit current_tenant_id_strict() in view body. Reader role gets view-only access;
-- cannot enumerate base tables; cannot read message ciphertext columns.
CREATE VIEW consult_outcome_summary_view AS
SELECT
    c.id AS consult_id,
    c.tenant_id,
    c.patient_id,
    c.consult_type,
    c.created_at,
    -- Derived current_state from most-recent transition row
    (SELECT to_state FROM consult_lifecycle_transition lt
     WHERE lt.tenant_id = c.tenant_id AND lt.consult_id = c.id
     ORDER BY lt.transition_at DESC, lt.id DESC LIMIT 1) AS current_state,
    -- Most-recent decision (if any)
    (SELECT decision_type FROM consult_clinician_decision d
     WHERE d.tenant_id = c.tenant_id AND d.consult_id = c.id
     ORDER BY d.decided_at DESC LIMIT 1) AS decision_type,
    -- Prescribing count (if any)
    (SELECT COUNT(*) FROM consult_clinician_decision d
     WHERE d.tenant_id = c.tenant_id AND d.consult_id = c.id AND d.decision_type = 'prescribe') AS prescribing_count,
    -- Follow-up message count
    (SELECT COUNT(*) FROM consult_follow_up_message m
     WHERE m.tenant_id = c.tenant_id AND m.consult_id = c.id) AS follow_up_message_count,
    -- Most-recent transition timestamp
    (SELECT MAX(transition_at) FROM consult_lifecycle_transition lt
     WHERE lt.tenant_id = c.tenant_id AND lt.consult_id = c.id) AS last_transition_at
FROM consult c
WHERE c.tenant_id = current_tenant_id_strict('consult_outcome_summary_view');

ALTER VIEW consult_outcome_summary_view OWNER TO async_consult_view_owner;  -- non-BYPASSRLS
REVOKE ALL ON consult_outcome_summary_view FROM PUBLIC;
GRANT SELECT ON consult_outcome_summary_view TO async_consult_reader;

-- Owner-only base-table column grants (per P-036 R7 closure data-minimization)
GRANT SELECT (id, tenant_id, patient_id, consult_type, created_at) ON consult TO async_consult_view_owner;
GRANT SELECT (tenant_id, consult_id, to_state, transition_at, id) ON consult_lifecycle_transition TO async_consult_view_owner;
GRANT SELECT (tenant_id, consult_id, decision_type, decided_at) ON consult_clinician_decision TO async_consult_view_owner;
GRANT SELECT (tenant_id, consult_id) ON consult_follow_up_message TO async_consult_view_owner;
-- async_consult_reader has NO direct base-table access; reads only via the view.
-- Reader CANNOT see intake/summary/decision/message ciphertext columns even indirectly.
```

### §4.NEW9 — `consult_current_state_mv` (CDM v1.9 new OPTIONAL materialized view; SI-020 Sub-decision 9)

```sql
-- OPTIONAL rebuildable MV for read-path optimization (clinician review queue + patient app
-- consult-status reads). Pattern mirrors SI-019 + P-034 R5 MV access closure.
CREATE MATERIALIZED VIEW consult_current_state_mv AS
SELECT DISTINCT ON (tenant_id, consult_id)
    tenant_id, consult_id, to_state AS current_state, transition_at AS as_of, transition_reason
FROM consult_lifecycle_transition
ORDER BY tenant_id, consult_id, transition_at DESC, id DESC;

CREATE UNIQUE INDEX consult_current_state_mv_pk
    ON consult_current_state_mv (tenant_id, consult_id);

REVOKE ALL ON consult_current_state_mv FROM PUBLIC;
GRANT SELECT ON consult_current_state_mv TO async_consult_mv_refresh_owner;
```

---

## 3. New SECURITY DEFINER procedures (7 new)

| Procedure | Owner | App-role caller | Purpose |
|---|---|---|---|
| `record_consult_lifecycle_transition()` | `consult_lifecycle_transition_writer_owner` | (owner-only EXECUTE; wrapper procedures call) | Raw canonical transition writer; SI-024.1 JWT tenant guard + advisory lock + state-continuity validation + INSERT |
| `record_consult_initiation()` | `consult_initiation_wrapper_owner` | `async_consult_patient_initiator` / `async_consult_delegate_initiator` | Atomic INSERT consult row + initial transition row; validates payment_intent_id ∈ tenant + program_id (IFF program_pathway); calls Billing payment-intent creation synchronously upstream |
| `record_consult_intake_submission()` | `consult_intake_wrapper_owner` | `async_consult_patient_initiator` / `async_consult_delegate_initiator` | Atomic INSERT intake_submission row + transition row; validates current_state is `intake` |
| `record_consult_ai_preparation_completed()` | `consult_ai_preparation_wrapper_owner` | `ai_service_account` | Atomic INSERT clinical_summary row + transition row (processing → queued) |
| `claim_consult_for_review()` | `consult_claim_wrapper_owner` | `async_consult_clinician_reviewer` | SI-020 R5 closure pattern — STEP 0 JWT guard; STEP 1 `(tenant_id, consult_id)` advisory lock; STEP 2 auto-release expired prior claim; STEP 3 lookup patient_id; STEP 4 INSERT new claim; structured `claim_already_held` rejection on concurrent conflict; required Cat B `async_consult.claim_expired_auto_released` audit event when STEP 2 auto-releases |
| `reassign_consult_claim()` | `consult_claim_wrapper_owner` | `async_consult_clinician_reviewer` / `admin` | Atomic UPDATE-release-prior + INSERT-new claim under same advisory lock per SI-020 R4 closure |
| `record_consult_clinician_decision()` | `record_consult_decision_wrapper_owner` | `async_consult_clinician_reviewer` (with `medication_interaction.override_recorder` for prescribe decisions) | Extends SI-005 P-021; atomic INSERT decision row FIRST + INSERT prescription record IFF prescribe + transition row SECOND; JWT-verified actor identity per P-036 R3 closure; claim-FK validation enforces deciding-clinician == claiming-clinician |

All SECURITY DEFINER procedure bodies follow the canonical pattern:
- Locked `search_path = pg_catalog, pg_temp` (P-034 R7 closure pattern)
- SI-024.1 JWT-binding tenant guard via `verify_session_jwt_and_extract_claims()` (P-036 R3 closure)
- Actor-role validation via `pg_has_role(verified_actor_role, '<required_role>', 'MEMBER')` (P-036 R3)
- Schema-qualified table references (`public.<table>`) per P-034 R7 closure
- `ALTER PROCEDURE ... OWNER TO <wrapper_owner>` executable ownership pinning (P-034 R8 closure)
- Append-only enforcement on all INSERT-targeted tables via the canonical `enforce_append_only()` trigger function

**EXECUTE grants:** raw `record_consult_lifecycle_transition()` is owner-only (granted to the 5 reason-specific wrapper owners + override wrapper + claim wrapper); app roles get EXECUTE only on the wrappers (per the P-034 R4 closure raw-writer-restricted-to-wrappers pattern).

---

## 4. AUDIT_EVENTS v5.10 → v5.11 amendment

**17 new action IDs** under `async_consult.*` namespace (4 Cat A + 3 Cat B + 10 Cat C per SI-020 R7 closure recount):

| # | Action ID | Category | Sampling | Partition |
|---|---|---|---|---|
| 1 | `async_consult.initiated` | Cat C | high-volume sampled | P1 keyed by patient_id |
| 2 | `async_consult.intake_submitted` | Cat C | high-volume sampled | P1 keyed by patient_id |
| 3 | `async_consult.intake_abandoned` | Cat C | not sampled (low-volume) | P1 keyed by patient_id |
| 4 | `async_consult.ai_preparation_started` | Cat C | high-volume sampled | P1 keyed by patient_id |
| 5 | `async_consult.ai_preparation_completed` | Cat C | high-volume sampled | P1 keyed by patient_id |
| 6 | `async_consult.ai_preparation_failed` | Cat B | not sampled | P2 keyed by tenant_id |
| 7 | `async_consult.case_queued` | Cat C | high-volume sampled | P1 keyed by patient_id |
| 8 | `async_consult.case_claimed` | Cat C | high-volume sampled | P1 keyed by patient_id |
| 9 | `async_consult.clinician_decision_recorded` | Cat A | not sampled | P1 keyed by patient_id |
| 10 | `async_consult.clinician_decision_rationale_disagreement` | Cat A | not sampled | P1 keyed by patient_id |
| 11 | `async_consult.prescribing_recorded` | Cat A | not sampled | P1 keyed by patient_id |
| 12 | `async_consult.additional_data_requested` | Cat C | not sampled (low-volume) | P1 keyed by patient_id |
| 13 | `async_consult.escalated_to_sync` | Cat B | not sampled | P2 keyed by tenant_id |
| 14 | `async_consult.outcome_notification_sent` | Cat C | high-volume sampled | P1 keyed by patient_id |
| 15 | `async_consult.follow_up_message_sent` | Cat C | not sampled (PHI-relevant) | P1 keyed by patient_id |
| 16 | `async_consult.invariant_violation_decision_without_admission` | Cat A | not sampled | P1 keyed by patient_id |
| 17 | `async_consult.claim_expired_auto_released` | Cat B | not sampled | P2 keyed by tenant_id |

**Audit-CHECK constraint amendment:** enumerates all 17 new action IDs in `audit_events.action_id CHECK` per I-012 closure rule.

---

## 5. DOMAIN_EVENTS additive (no version bump)

**7 new event types** under `async_consult.*` namespace (additive enum extension):

| # | Event type | partition_key | Subscribers |
|---|---|---|---|
| 1 | `async_consult.initiated.v1` | `tenant_id:patient_id` | Billing (observability); Adverse Event Reporting; patient mobile app push |
| 2 | `async_consult.intake_submitted.v1` | `tenant_id:patient_id` | AI Service Mode 1/2 (preparation trigger); analytics |
| 3 | `async_consult.clinical_summary_prepared.v1` | `tenant_id:patient_id` | Clinician dashboard (queue update); Med-Interaction engine cross-reference |
| 4 | `async_consult.clinician_decision_recorded.v1` | `tenant_id:patient_id` | Pharmacy Portal (IFF prescribe); Mode 1 (patient-facing explanation); Adverse Event Reporting; Billing (refund IFF decline) |
| 5 | `async_consult.prescribing_recorded.v1` | `tenant_id:patient_id` | Pharmacy Portal; Refill Slice (refill eligibility); patient mobile app |
| 6 | `async_consult.escalated_to_sync.v1` | `tenant_id:patient_id` | Sync Video Consult Slice (case handoff); scheduler |
| 7 | `async_consult.outcome_completed.v1` | `tenant_id:patient_id` | Analytics; patient experience surveys; clinician panel metrics |

---

## 6. OpenAPI v0.3 → v0.4 amendment

**11 new endpoints** under `/v1/async-consults/*` (tenant-scoped per ADR-023; RLS-enforced):

| # | Method | Path | Caller role | Purpose |
|---|---|---|---|---|
| 1 | POST | `/v1/async-consults` | patient / delegate | Initiate consult; internally calls Billing payment-intent creation; returns consult_id + payment_intent_id + client_secret |
| 2 | POST | `/v1/async-consults/:consult_id/intake` | patient / delegate | Submit intake |
| 3 | POST | `/v1/async-consults/:consult_id/abandon` | patient / delegate / system | Mark intake abandoned |
| 4 | POST | `/v1/async-consults/:consult_id/ai-preparation` | AI Service (internal) | Trigger AI preparation |
| 5 | GET | `/v1/async-consults/:consult_id` | patient / delegate / clinician / admin | Read via consult_outcome_summary_view |
| 6 | GET | `/v1/async-consults/queue` | clinician / admin | Clinician review queue (paginated) |
| 7 | POST | `/v1/async-consults/:consult_id/claim` | clinician | Claim consult (calls claim_consult_for_review with expired-claim auto-release) |
| 8 | POST | `/v1/async-consults/:consult_id/decision` | clinician | Record decision (calls record_consult_clinician_decision) |
| 9 | POST | `/v1/async-consults/:consult_id/request-additional-data` | clinician | Request more data from patient |
| 10 | POST | `/v1/async-consults/:consult_id/follow-up-messages` | patient / clinician | Send follow-up message |
| 11 | GET | `/v1/async-consults/:consult_id/follow-up-messages` | patient / clinician / admin | List follow-up messages |

**Idempotency:** endpoints 1 + 2 + 3 + 4 + 7 + 8 + 9 + 10 use `Idempotency-Key` header per canonical IDEMPOTENCY contract.

---

## 7. State Machines v1.2 → v1.3 amendment

**1 new state machine: `consult_lifecycle`**

Per Option A (SI-020 Sub-decision 5 + SI-019 OQ7 pattern), this state machine is described as **DERIVED from append-only `consult_lifecycle_transition` rows**. 22 allowed transition triples enforced by CHECK constraint on the transition entity (§4.NEW6 above).

Current-state derivation contract:

```sql
SELECT to_state
FROM consult_lifecycle_transition
WHERE tenant_id = $tenant_id AND consult_id = $consult_id
ORDER BY transition_at DESC, id DESC
LIMIT 1;
```

Terminal states: `completed`, `expired`. Non-terminal but flow-aware: `prescribed`, `advised`, `awaiting_data`, `escalated_to_sync`, `declined`, `referred`, `follow_up`.

---

## 8. RBAC v1.2 → v1.3 amendment

**12 new roles** (R1 MED-1 closure 2026-05-21: recounted to align with §10 deployment preflight enumeration; 4 application + 6 wrapper owners [1 raw writer + 5 reason-specific wrappers] + 2 view/MV owners):

### Application roles (4)

| Role | Granted to (via Admin Backend role-assignment) |
|---|---|
| `async_consult_patient_initiator` | patient role |
| `async_consult_delegate_initiator` | delegate role IFF `book-consults` scope per Consent slice |
| `async_consult_clinician_reviewer` | clinician role |
| `async_consult_reader` | clinician + patient app + pharmacy portal + admin (view-only access per data-minimization pattern) |

### Wrapper/Service-level owner roles (4)

| Role | Owns |
|---|---|
| `consult_lifecycle_transition_writer_owner` | `record_consult_lifecycle_transition()` (raw); INSERT on `consult_lifecycle_transition` table |
| `consult_initiation_wrapper_owner` / `consult_intake_wrapper_owner` / `consult_ai_preparation_wrapper_owner` / `consult_claim_wrapper_owner` / `record_consult_decision_wrapper_owner` | Their respective wrapper procedures (5 wrappers total) |
| `async_consult_view_owner` | `consult_outcome_summary_view` (non-BYPASSRLS); owner-only base-table SELECT grants |
| `async_consult_mv_refresh_owner` | `consult_current_state_mv` (optional MV); only role with direct MV SELECT |

---

## 9. `jwt_migration_entity_status` seed scope (P-036 R6 closure pattern)

**Seed 8 entity names** at amendment-apply time with `phase_4_cutover_eligible=FALSE` AND `raw_guc_fallback_audited=TRUE` defaults (Phase B fail-closed-with-audit posture):

```sql
INSERT INTO jwt_migration_entity_status (entity_name, phase_4_cutover_eligible, raw_guc_fallback_audited)
VALUES
    ('consult',                                      FALSE, TRUE),
    ('consult_intake_submission',                    FALSE, TRUE),
    ('consult_clinical_summary',                     FALSE, TRUE),
    ('consult_review_claim',                         FALSE, TRUE),
    ('consult_clinician_decision',                   FALSE, TRUE),
    ('consult_lifecycle_transition',                 FALSE, TRUE),
    ('consult_follow_up_message',                    FALSE, TRUE),
    ('consult_outcome_summary_view',                 FALSE, TRUE);
```

**cdm_owner sequencing guidance (per P-036 R6 closure precedent):** flip per-table `phase_4_cutover_eligible=TRUE` first (the 7 tables), then the derived view's trust-anchor last so all upstream writers are JWT-cutover before downstream readers.

---

## 10. Deployment prerequisites preflight (R9 MED-1 closure pattern from SI-024.1)

Required pre-existing roles (CREATE ROLE happens in a prior baseline DDL):

| Role | Purpose |
|---|---|
| `consult_lifecycle_transition_writer_owner` | Raw transition writer owner |
| `consult_initiation_wrapper_owner` | Initiation wrapper owner |
| `consult_intake_wrapper_owner` | Intake submission wrapper owner |
| `consult_ai_preparation_wrapper_owner` | AI preparation wrapper owner |
| `consult_claim_wrapper_owner` | Claim + reassign wrapper owner |
| `record_consult_decision_wrapper_owner` | Decision wrapper owner (extends SI-005 P-021) |
| `async_consult_view_owner` | Non-BYPASSRLS view owner (preflight asserts `rolbypassrls=false`) |
| `async_consult_mv_refresh_owner` | MV refresh owner |
| `async_consult_patient_initiator` / `async_consult_delegate_initiator` / `async_consult_clinician_reviewer` / `async_consult_reader` | App roles |

```sql
DO $$
DECLARE
    v_missing_roles TEXT := '';
    v_required_roles TEXT[] := ARRAY[
        'consult_lifecycle_transition_writer_owner',
        'consult_initiation_wrapper_owner',
        'consult_intake_wrapper_owner',
        'consult_ai_preparation_wrapper_owner',
        'consult_claim_wrapper_owner',
        'record_consult_decision_wrapper_owner',
        'async_consult_view_owner',
        'async_consult_mv_refresh_owner',
        'async_consult_patient_initiator',
        'async_consult_delegate_initiator',
        'async_consult_clinician_reviewer',
        'async_consult_reader'
    ];
    v_role TEXT;
BEGIN
    FOREACH v_role IN ARRAY v_required_roles LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = v_role) THEN
            v_missing_roles := v_missing_roles || v_role || ', ';
        END IF;
    END LOOP;
    IF length(v_missing_roles) > 0 THEN
        RAISE EXCEPTION 'P-038 amendment prerequisite missing: required roles do not exist: %',
            rtrim(v_missing_roles, ', ')
            USING ERRCODE = 'undefined_object';
    END IF;
    -- async_consult_view_owner MUST NOT have BYPASSRLS (per P-036 R7 + SI-024.1 R9 precedent)
    IF (SELECT rolbypassrls FROM pg_roles WHERE rolname = 'async_consult_view_owner') THEN
        RAISE EXCEPTION 'async_consult_view_owner has BYPASSRLS; must be revoked before view ownership per P-036 R7 closure'
            USING ERRCODE = 'insufficient_privilege';
    END IF;
END $$;
```

---

## 11. Cross-SI alignment

| Cross-SI surface | This amendment's surface | Relationship |
|---|---|---|
| SI-020 v0.11 RATIFIED (P-037) | §2 + §3 + §4 + §5 + §6 + §7 + §8 + §9 | This amendment IS the CDM/AUDIT/DOMAIN_EVENTS/OpenAPI/State Machines/RBAC consolidation of SI-020 v0.11 |
| SI-024.1 v0.8 JWT-binding (P-031) + CDM v1.6 jwt_migration_entity_status (P-032) | §2 RLS policies + §3 SECURITY DEFINER procedures + §9 seed scope | All 7 entities use canonical JWT-binding trust anchor + seed scope per SI-024.1 OQ8 |
| I-035 append-only invariant (P-027) | All 7 entities + the derived view | 7-table split-INSERT-only model + `enforce_append_only()` trigger + hybrid persistence with one-way mutable release per P-037 R4 |
| SI-005 record_consult_clinician_decision (P-021) | §3 `record_consult_clinician_decision` wrapper | Extends SI-005 P-021 with claim-FK validation + JWT-verified actor identity per P-036 R3 |
| Mode 1 spec v0.4 (P-035) | §5 domain events for cross-mode handoff | Mode 1 consumes `async_consult.clinician_decision_recorded.v1` for patient-facing explanation |
| Billing slice canonical entities | §2.NEW1 `consult.payment_intent_id` FK | Tenant-scoped composite FK to `billing_payment_intent(tenant_id, id)` |
| INVARIANTS bump | **NOT in this amendment** | No new platform-floor invariants |

---

## 12. Open questions for ratifier (own ceremony)

1. **OQ1 — Codex pre-ratification target rounds.** Recommendation: 6-10 rounds + ship-it verification per established mechanical-consolidation precedents (P-029 8 rounds, P-032 12, P-034 8, P-036 8). Mechanical-consolidation cycle typically converges faster than parent SI authoring cycle.
2. **OQ2 — Med-Interaction signal_id propagation** (preserved from SI-020 OQ7). `consult_clinical_summary.interaction_signals_snapshot` JSONB + `consult_clinician_decision.interaction_signals_reviewed_ids` ULID[] reference Med-Interaction signals per P-033 CDM v1.7. Should this become a hard tenant-scoped FK array when Med-Interaction CDM follow-on (P-034 cycle) ratifies signal identity propagation contracts? Recommendation: opaque array for now; convert to FK at next Med-Interaction follow-on amendment.

3. **OQ3 — Canonical tenant-scoped account membership table** (R3 MED-1 closure 2026-05-21). `consult_review_claim.clinician_account_id` FK is composite tenant-scoped per the R3 closure pattern, referencing `tenant_account_membership(tenant_id, account_id)`. The exact canonical entity name + columns for tenant-scoped account membership is owned by Identity slice (SI-017). Ratifier confirms: (a) Identity slice canonical entity name (assumed `tenant_account_membership`; may differ as `account_tenant_link`, `tenant_user`, etc.); (b) composite UNIQUE on `(tenant_id, account_id)` exists; (c) FK columns match. If the canonical entity doesn't yet exist, the implementation amendment adds it as a baseline prerequisite per Identity slice scope OR defers this FK with explicit cross-reference TODO until Identity slice formalizes the membership entity.

---

## 13. Codex pre-ratification status

**v0.1 DRAFT 2026-05-21:** pre-Codex-review.

**v0.2 DRAFT 2026-05-21 — R1 closures applied (2 HIGH + 1 MED):**
- **R1 HIGH-1 closed:** `consult_clinician_decision_validate_claim_active()` BEFORE INSERT trigger looked up claim by `id` only — bypassed the composite tenant identity invariant enforced elsewhere. Fix: trigger lookup uses 5-column composite identity `(tenant_id, claim_id, consult_id, patient_id, clinician_account_id)`; RAISE on no exact-match row found BEFORE checking release/expiry; defense-in-depth boundary now equal-strength to the FK.
- **R1 HIGH-2 closed:** `consult_lifecycle_transition` row-level CHECK validated individual triples but did NOT enforce that new from_state == current latest to_state — direct table INSERTs by `consult_lifecycle_transition_writer_owner` (which has INSERT grant) could create divergent histories that still passed CHECK. Fix: added `consult_lifecycle_transition_continuity` BEFORE INSERT trigger that takes per-consult advisory lock + reads latest to_state under lock + validates continuity + rejects from-terminal transitions. Regardless of caller, lifecycle integrity is now schema-enforced (not procedure-dependent).
- **R1 MED-1 closed:** RBAC count mismatch — §1 scope + §8 said "8 roles (4 application + 4 wrapper/owner)" but §10 deployment preflight enumerated 12 roles. Implementer following §1/§8 would under-provision. Fix: recounted to **12 roles** (4 app + 6 wrapper owners + 2 view/MV owners) matching preflight enumeration; §1 + §8 + §10 now mutually consistent.

Authored on `spec/cdm-v1-9-audit-v5-11-openapi-v0-4-sm-v1-3-rbac-v1-3-si020-followon-2026-05-21` branch off main at `3129579` (post-P-037 + Addendum 65). v0.2 commit `48ca67d`. v0.3 commit `6522879`. v0.4 commit pending push for R4 verification.

**v0.4 DRAFT 2026-05-21 — R3 closures applied (2 HIGH + 1 MED):**
- **R3 HIGH-1 closed:** decision validation trigger could race claim release/reassignment under READ COMMITTED (validate active claim while concurrent UPDATE-s released_at, leaving append-only decision referencing released claim). Fix: trigger now acquires same per-consult advisory lock as `claim_consult_for_review()` + `reassign_consult_claim()`; uses SELECT...FOR UPDATE on claim row to pin the snapshot; all release/reassign procedures must use same lock order (already do per SI-020 v0.11).
- **R3 HIGH-2 closed:** R2 continuity trigger permitted equal transition_at values; ORDER BY transition_at DESC, id DESC tie-break uses UUID ordering which can place newer transition BEFORE older one if UUID sorts lower → current-state derivation could stay stale even after a valid transition was accepted. Fix: strict > monotonic ordering on transition_at; no equality permitted for non-initial transitions; ensures just-inserted row is unambiguously the latest.
- **R3 MED-1 closed:** `consult_review_claim.clinician_account_id` FK referenced `accounts(id)` without tenant_id, leaving tenant isolation on the claim chain dependent on wrapper logic. Fix: composite tenant-scoped FK `(tenant_id, clinician_account_id) → tenant_account_membership(tenant_id, account_id)` per assumed Identity slice canonical entity; new §12 OQ3 added for ratifier to confirm canonical name.

**v0.3 DRAFT 2026-05-21 — R2 closure applied (1 HIGH):**
- **R2 HIGH-1 closed:** R1 continuity trigger validated NEW.from_state == latest to_state but didn't enforce monotonic transition_at ordering. Backdated rows could pass from_state check (matches current latest to_state) while corrupting current-state derivation (since `ORDER BY transition_at DESC` determines current state — older row could shadow newer); future-dated rows could dominate current-state reads immediately. Append-only state-machine invariant undermined. Fix: trigger now reads latest transition_at alongside latest to_state under the same advisory lock + rejects NEW.transition_at < latest transition_at (backdated forbidden) + rejects NEW.transition_at > now() + 5s clock-skew tolerance (future-dated dominance attack). Monotonic-ordering invariant now schema-enforced.

---

— Claude (Opus 4.7, 1M context), CDM v1.8 → v1.9 + AUDIT_EVENTS v5.10 → v5.11 + DOMAIN_EVENTS additive + OpenAPI v0.3 → v0.4 + State Machines v1.2 → v1.3 + RBAC v1.2 → v1.3 SI-020 follow-on amendment v0.1 DRAFT authored 2026-05-21 per P-037 OQ canonical decision + established post-P-029 SI-spec-first promotion pattern (SIXTH instance) + CLAUDE.md two-pass discipline + auto-proceed rule + proactive application of all lessons-learned from P-031 through P-037 cycles. R1 Codex review queued.
