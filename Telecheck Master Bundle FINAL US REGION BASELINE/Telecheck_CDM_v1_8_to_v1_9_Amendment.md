# CDM v1.8 → v1.9 + AUDIT_EVENTS v5.10 → v5.11 + DOMAIN_EVENTS additive + OpenAPI v0.3 → v0.4 + State Machines v1.2 → v1.3 + RBAC v1.2 → v1.3 Amendment (SI-020 Async-Consult follow-on)

**Version:** 1.0 RATIFIED (P-038)
**Status:** POST-R10 SHIP-IT — Codex R10 verdict: APPROVE, no material findings. P-038 Promotion Ledger entry appended. CDM v1.8 → v1.9 promoted; AUDIT_EVENTS v5.10 → v5.11; OpenAPI v0.3 → v0.4; State Machines v1.2 → v1.3; RBAC v1.2 → v1.3; DOMAIN_EVENTS additive; jwt_migration_entity_status +9 entries; Artifact Registry v2.24 → v2.25. Previously POST-R9 (1 MED closed inline: §3 raw `record_consult_lifecycle_transition()` EXECUTE-grants prose enumerated grantees as "the 5 reason-specific wrapper owners + override wrapper + claim wrapper" — internally inconsistent because (a) no `override wrapper` owner role exists in §8/§10 preflight; (b) `claim wrapper` was already one of the "5 reason-specific wrapper owners" rendering the explicit add redundant. Implementer reading §3 prose could either (1) fail migration by granting to a nonexistent `override wrapper` owner role, OR worse (2) create an unpreflighted extra owner role around the raw lifecycle writer — adding such a net-new owner role would itself have triggered hard-floor item 6 architectural-judgment escalation per CLAUDE.md. Raw writer is the canonical append-only state-transition boundary; ambiguous EXECUTE grants are a real privilege-isolation risk, not just prose drift. Fix: rewrote §3 EXECUTE-grants prose to enumerate exactly the 5 wrapper-owner roles from §8 (`consult_initiation_wrapper_owner`, `consult_intake_wrapper_owner`, `consult_ai_preparation_wrapper_owner`, `consult_claim_wrapper_owner`, `record_consult_decision_wrapper_owner`); explicit "**No other roles receive EXECUTE on the raw writer**" assertion. Also rewrote §1.1 procedure-enumeration parenthetical from the previously-inconsistent "5 reason-specific wrappers + decision wrapper + claim + reassign" double-count to the canonical "7 procedures (1 raw + 6 wrapper procedures) owned by 6 owner roles (1 raw owner + 5 wrapper owners)" with explicit per-procedure owner mapping. §1 + §3 + §8 + §10 now mutually consistent on both procedure count (7) and owner count (6). Previously POST-R8 (1 MED closed inline: §8 RBAC subsection was headed "Wrapper/Service-level owner roles (4)" but the section actually named 8 owner roles — one row slash-compressed 5 distinct wrapper-owner roles into a single line, plus separate rows for view + MV owners. Implementers using §8 as the RBAC source could have provisioned 4 owner-role groups instead of the distinct 8 owner roles required by §10 preflight, collapsing SECURITY DEFINER wrapper ownership boundaries + view-owner separation. Fix: split compressed row into 5 distinct wrapper-owner rows; renamed subsection "Wrapper/Service-level owner roles (6)"; added explicit "View/MV owner roles (2)" subsection. §1 + §8 + §10 counts now identical: 13 = 5 app + 6 wrapper owners + 2 view/MV owners. Previously POST-R7 (1 HIGH closed inline: §9 cutover sequencing guidance still referenced removed `current_jwt_verified_patient_id()` helper as a JWT-cutover prerequisite for the patient view — directly contradicting the R6 closure that walked back that net-new helper dependency. Implementers following the stale guidance could block deployment waiting for a helper that should not exist, or worse reintroduce the exact platform-floor primitive R6 was supposed to eliminate (rollout-safety + ratification-scope defect, not just stale prose). Fix: rewrote §9 sequencing guidance to enumerate the actual v0.7+ dependency set — `verify_session_jwt_and_extract_claims()` + `current_tenant_id_strict('<entity>')` (both already-cutover canonical SI-024.1 primitives) + Consent-slice `consent_grant` (standard tenant-scoped relational table; no JWT cutover semantics required); added explicit "no net-new SI-024.1 platform-floor primitive required" assertion to match R6 walk-back posture. Added §9 stale-reference assertion: the strings `current_jwt_verified_patient_id` and `consult_outcome_summary_view` MUST NOT appear as active dependencies anywhere in v0.7+ text; permitted only in three explicit contexts (§13 R-cycle log historical record; explicit deprecation-warning text; inline walks-back parenthetical commentary in §4 SQL comments). Stale-reference sweep verified clean: 9 remaining hits all in permitted contexts. Two additional prose-consistency fixes piggy-backed: §4.NEW8 heading updated from removed combined view name to split-pair view names + R-cycle attribution; §8 RBAC `async_consult_patient_reader` row predicate description updated from `c.patient_id = current_jwt_verified_patient_id(...)` to canonical schema-backed-join phrasing. Previously POST-R6 (2 HIGH closed inline: R6 HIGH-1 walked back R5's net-new SI-024.1 helper assumption `current_jwt_verified_patient_id()` — Codex correctly flagged this as a hard-floor item 6 architectural-judgment finding (net-new platform-floor primitive beyond ratified scope), and Codex's own recommended Option B (replace the helper assumption with explicit, schema-backed joins to canonical admission and delegate-scope tables) is the closure path applied here. The `async_consult_patient_summary_v` predicate now composes entirely from already-ratified canonical primitives: `verify_session_jwt_and_extract_claims()` (SI-024.1 v0.8 P-031) extracted into a CTE for verified tenant_id / patient_id / delegate_id; (a) patient principal path matches `c.patient_id = vc.verified_patient_id`; (b) delegate principal path uses EXISTS clause against `public.consent_grant` filtering on `tenant_id + delegate_id = vc.verified_delegate_id + patient_id = c.patient_id + scope_name = 'book-consults' + status = 'active' + (expires_at IS NULL OR expires_at > now())`. OQ4 walked back from "confirm net-new SI-024.1 helper name + semantics" (hard-floor item 6 territory) to "confirm Consent-slice canonical domain entity name + column shape" (standard domain-entity-name OQ; closeable in normal ratification ceremony; no schema/invariant amendment required). R6 HIGH-2 closed: OpenAPI §6 row 5 had stale reference to removed `consult_outcome_summary_view`; rewritten to document caller-class routing (patient/delegate handler reads `async_consult_patient_summary_v`; clinician/admin/pharmacy handler reads `async_consult_staff_summary_v`); no cross-class access; deprecated combined view name explicitly REMOVED from the API contract. Previously POST-R5 (1 HIGH closed inline: single tenant-wide `consult_outcome_summary_view` + single `async_consult_reader` role granted to patient/delegate role would have leaked OTHER patients' consult metadata (consult_id, consult_type, current_state, decision_type, prescribing_count, last_transition_at) to patient-app callers within the same tenant — only base-table ciphertext columns were hidden; metadata was tenant-wide. Fix: view + reader role SPLIT into two caller-class-specific pairs. (1) `async_consult_patient_summary_v` adds predicate `AND c.patient_id = current_jwt_verified_patient_id('async_consult_patient_summary_v')` restricting patient/delegate principals to ONLY their own consults; granted to new `async_consult_patient_reader` role (held by patient + delegate IFF book-consults scope). (2) `async_consult_staff_summary_v` retains tenant-wide visibility for clinician/admin/pharmacy queue triage; granted to new `async_consult_staff_reader` role (held by clinician + admin + pharmacy portal roles; NOT patient/delegate). New SI-024.1 helper `current_jwt_verified_patient_id(<entity>)` analogous to `current_tenant_id_strict`; returns JWT-verified patient_id from admission record OR delegate's authorized patient_id IFF book-consults scope per Consent slice; raises `patient_jwt_missing` if no admission record exists. New OQ4 added for Identity-slice + Consent-slice owners to confirm helper name + delegate-scope predicate semantics. RBAC count 12 → 13 roles (5 app + 6 wrapper owners + 2 view/MV owners). Previously POST-R4 (1 HIGH closed inline: trigger functions performing invariant checks (consult_clinician_decision_validate_claim_active, consult_lifecycle_transition_continuity, consult_review_claim_one_way_released_at) lacked schema-qualified table references + locked search_path — caller-controlled temp relation shadowing could redirect invariant checks to attacker-controlled rows, bypassing release/expiry/continuity invariants while real FKs still passed. Fix: all 3 invariant-enforcing trigger functions now have `SET search_path = pg_catalog, public` per canonical P-034 R7 SECURITY DEFINER hardening pattern + all SELECT statements use `public.<table>` schema-qualified references. Previously POST-R3 (2 HIGH + 1 MED closed inline: HIGH-1 decision validation could race claim release/reassignment under READ COMMITTED → fix: BEFORE INSERT trigger now takes same per-consult advisory lock as claim/reassign procedures + SELECT...FOR UPDATE on claim row; HIGH-2 equal transition_at values could corrupt current-state derivation via UUID tie-break ambiguity → fix: strict > monotonic ordering on transition_at, no equality permitted for non-initial transitions; MED-1 clinician_account_id FK not tenant-scoped → fix: composite tenant-scoped FK `(tenant_id, clinician_account_id) → tenant_account_membership(tenant_id, account_id)` per assumed Identity slice canonical entity + new OQ3 for ratifier to confirm canonical name)
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

1. **CDM v1.8 → v1.9:** +7 new entities + 2 plain data-minimization views (caller-class split per R5 HIGH-1) + 1 OPTIONAL rebuildable MV + **7 SECURITY DEFINER procedures owned by 6 distinct owner roles** (R9 MED-1 closure 2026-05-21: rewrote enumeration to remove the prior internally-inconsistent "5 reason-specific wrappers + claim + reassign" double-count). The 7 procedures are: **(1) raw** `record_consult_lifecycle_transition()` owned by `consult_lifecycle_transition_writer_owner`; **(2)–(7) six wrapper procedures owned by 5 wrapper-owner roles**: `record_consult_initiation()` (consult_initiation_wrapper_owner), `record_consult_intake_submission()` (consult_intake_wrapper_owner), `record_consult_ai_preparation_completed()` (consult_ai_preparation_wrapper_owner), `claim_consult_for_review()` + `reassign_consult_claim()` (both owned by consult_claim_wrapper_owner — the only owner role that owns two procedures), and `record_consult_clinician_decision()` (record_consult_decision_wrapper_owner). Total: 1 raw procedure + 6 wrapper procedures = 7 procedures; 1 raw owner + 5 wrapper owners = 6 procedure-owner roles (matching §8's "Wrapper/Service-level owner roles (6)" subsection). Continuing CDM numbering from v1.8's 89 active entities + 5 derived views; v1.9 target: 96 active entities + 7 derived views + 1 optional MV.
2. **AUDIT_EVENTS v5.10 → v5.11:** +17 new action IDs under `async_consult.*` namespace (4 Cat A + 3 Cat B + 10 Cat C per SI-020 R7 closure).
3. **DOMAIN_EVENTS additive:** +7 new event types under `async_consult.*` namespace; additive enum extension (no version bump).
4. **OpenAPI v0.3 → v0.4:** +11 new endpoints under `/v1/async-consults/*`.
5. **State Machines v1.2 → v1.3:** +1 new state machine `consult_lifecycle` described as DERIVED from append-only `consult_lifecycle_transition` rows per Option A; CHECK constraint enumerates 22 allowed `(transition_reason, from_state, to_state)` triples.
6. **RBAC v1.2 → v1.3:** +**13 new role definitions** (R5 HIGH-1 closure 2026-05-21: split single `async_consult_reader` into `async_consult_patient_reader` + `async_consult_staff_reader` to enforce JWT-verified patient_id predicate on patient/delegate read path; previously POST-R1 MED-1 closure: recounted to match §10 deployment preflight — earlier draft said "8 (4 application + 4 wrapper/owner)" which compressed 6 wrapper owner roles into 4. Actual final count: 5 application + 6 wrapper owners + 2 view/MV owners = 13).
7. **`jwt_migration_entity_status` seed scope:** 9 entries (7 RLS-bearing tables + 2 derived view trust-anchors `async_consult_patient_summary_v` + `async_consult_staff_summary_v`) with `phase_4_cutover_eligible=FALSE` + `raw_guc_fallback_audited=TRUE` defaults; cdm_owner sequencing per P-036 R6 (tables first, views last).

**Out of scope:**

- SI-020 implementation in `telecheck-app` code repo (Phase A foundation).
- Billing slice canonical entities (referenced via `billing_payment_intent(tenant_id, id)` FK; entity defined in Billing Slice canonical scope).
- Forms/Intake Engine internals (referenced via `forms_template(tenant_id, id)` FK).
- Sync video consult slice (referenced via escalation event; covered separately).
- INVARIANTS bump (no new platform-floor invariants from SI-020; all closures align with I-019 + I-023 + I-026 + I-027 + I-032 v5.3 + I-035).

---

## 2. New CDM entities (7 active + 2 plain views + 1 OPTIONAL MV)

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
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;  -- R4 HIGH-1 closure: locked search_path
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

    -- SELECT ... FOR UPDATE on the claim row pins the snapshot we'll validate against.
    -- R4 HIGH-1 closure 2026-05-21: schema-qualified table reference (public.consult_review_claim)
    -- + locked search_path on the function (see ... LANGUAGE plpgsql ... SET search_path = ...
    -- below) per the canonical P-034 R7 SECURITY DEFINER name-resolution hardening pattern.
    -- Without these, a caller able to create a temp relation named consult_review_claim could
    -- plausibly redirect this trigger's invariant check to attacker-controlled rows.
    SELECT released_at, claim_expires_at
        INTO v_claim_released_at, v_claim_expires_at
        FROM public.consult_review_claim
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
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;  -- R4 HIGH-1 closure: locked search_path
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

    -- Read latest to_state AND latest transition_at under the lock (R2 HIGH-1 closure 2026-05-21).
    -- Schema-qualified public.<table> reference + function-level locked search_path (R4 HIGH-1
    -- closure) prevent caller-controlled temp-relation shadowing of this invariant check.
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
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;  -- R4 HIGH-1 closure: locked search_path

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

### §4.NEW8 — `async_consult_patient_summary_v` + `async_consult_staff_summary_v` (CDM v1.9 new plain data-minimization views per P-036 R7 pattern; R5 HIGH-1 caller-class split + R6 HIGH-1 schema-backed-join refactor)

```sql
-- Per P-036 R7 closure data-minimization pattern: plain view + owner-only base-table grants
-- + explicit current_tenant_id_strict() in view body. Reader role gets view-only access;
-- cannot enumerate base tables; cannot read message ciphertext columns.
-- R5 HIGH-1 closure 2026-05-21: split into TWO views with caller-class-specific predicates so
-- patient/delegate principals see only THEIR consults (filtered by JWT-verified patient_id) while
-- clinician/admin/pharmacy see the broader tenant-scoped queue. Earlier single-view + single
-- async_consult_reader role granted to patient role would have leaked other patients' consults
-- to patient-app callers (only base-table ciphertext was hidden; metadata was tenant-wide).
--
-- View 1: async_consult_patient_summary_v — restricted to JWT-verified patient_id
CREATE VIEW async_consult_patient_summary_v AS
SELECT
    c.id AS consult_id,
    c.tenant_id,
    c.patient_id,
    c.consult_type,
    c.created_at,
    (SELECT to_state FROM public.consult_lifecycle_transition lt
     WHERE lt.tenant_id = c.tenant_id AND lt.consult_id = c.id
     ORDER BY lt.transition_at DESC, lt.id DESC LIMIT 1) AS current_state,
    (SELECT decision_type FROM public.consult_clinician_decision d
     WHERE d.tenant_id = c.tenant_id AND d.consult_id = c.id
     ORDER BY d.decided_at DESC LIMIT 1) AS decision_type,
    (SELECT COUNT(*) FROM public.consult_clinician_decision d
     WHERE d.tenant_id = c.tenant_id AND d.consult_id = c.id AND d.decision_type = 'prescribe') AS prescribing_count,
    (SELECT COUNT(*) FROM public.consult_follow_up_message m
     WHERE m.tenant_id = c.tenant_id AND m.consult_id = c.id) AS follow_up_message_count,
    (SELECT MAX(transition_at) FROM public.consult_lifecycle_transition lt
     WHERE lt.tenant_id = c.tenant_id AND lt.consult_id = c.id) AS last_transition_at
FROM public.consult c
WHERE c.tenant_id = current_tenant_id_strict('async_consult_patient_summary_v')
  -- R5 HIGH-1 + R6 HIGH-1 closures: patient/delegate principals see ONLY their own consults.
  -- R6 HIGH-1 walks back R5's net-new helper assumption (current_jwt_verified_patient_id)
  -- by composing the predicate from already-ratified canonical primitives:
  --   * verify_session_jwt_and_extract_claims() — RATIFIED at SI-024.1 v0.8 (P-031)
  --   * session_jwt_admission — RATIFIED at CDM v1.6 (P-032)
  --   * consent_grant — Consent-slice canonical domain entity (OQ4 retained at weaker level:
  --       confirm canonical entity name + column shape; NO net-new platform-floor primitive)
  AND EXISTS (
    -- Resolve caller's verified JWT claims via the canonical SI-024.1 trust anchor.
    -- verify_session_jwt_and_extract_claims raises patient_jwt_missing / tenant_jwt_missing
    -- on missing or stale admission rows, fail-closed.
    WITH verified_claims AS (
        SELECT
            (vc).verified_tenant_id    AS verified_tenant_id,
            (vc).verified_patient_id   AS verified_patient_id,
            (vc).verified_delegate_id  AS verified_delegate_id
        FROM (
            SELECT verify_session_jwt_and_extract_claims('async_consult_patient_summary_v') AS vc
        ) v
    )
    SELECT 1
    FROM verified_claims vc
    WHERE vc.verified_tenant_id = c.tenant_id
      AND (
        -- (a) Patient principal: caller's JWT-verified patient_id matches this consult's patient
        c.patient_id = vc.verified_patient_id
        -- (b) Delegate principal: delegate has active book-consults scope for this patient
        OR (
          vc.verified_delegate_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM public.consent_grant cg
            WHERE cg.tenant_id = vc.verified_tenant_id
              AND cg.delegate_id = vc.verified_delegate_id
              AND cg.patient_id = c.patient_id
              AND cg.scope_name = 'book-consults'
              AND cg.status = 'active'
              AND (cg.expires_at IS NULL OR cg.expires_at > now())
          )
        )
      )
  );
  -- No net-new SQL function dependency; the entire predicate composes from ratified primitives.
  -- The patient/delegate read path is now schema-backed and fail-closed without requiring
  -- any new SI-024.1 helper to be authored as a precondition of this amendment.

ALTER VIEW async_consult_patient_summary_v OWNER TO async_consult_view_owner;
REVOKE ALL ON async_consult_patient_summary_v FROM PUBLIC;
GRANT SELECT ON async_consult_patient_summary_v TO async_consult_patient_reader;
-- async_consult_patient_reader is granted to patient role + delegate role IFF book-consults scope
-- (separate from clinician/admin/pharmacy reader role below)

-- View 2: async_consult_staff_summary_v — tenant-wide (clinician/admin/pharmacy reads)
CREATE VIEW async_consult_staff_summary_v AS
SELECT
    c.id AS consult_id,
    c.tenant_id,
    c.patient_id,
    c.consult_type,
    c.created_at,
    (SELECT to_state FROM public.consult_lifecycle_transition lt
     WHERE lt.tenant_id = c.tenant_id AND lt.consult_id = c.id
     ORDER BY lt.transition_at DESC, lt.id DESC LIMIT 1) AS current_state,
    (SELECT decision_type FROM public.consult_clinician_decision d
     WHERE d.tenant_id = c.tenant_id AND d.consult_id = c.id
     ORDER BY d.decided_at DESC LIMIT 1) AS decision_type,
    (SELECT COUNT(*) FROM public.consult_clinician_decision d
     WHERE d.tenant_id = c.tenant_id AND d.consult_id = c.id AND d.decision_type = 'prescribe') AS prescribing_count,
    (SELECT COUNT(*) FROM public.consult_follow_up_message m
     WHERE m.tenant_id = c.tenant_id AND m.consult_id = c.id) AS follow_up_message_count,
    (SELECT MAX(transition_at) FROM public.consult_lifecycle_transition lt
     WHERE lt.tenant_id = c.tenant_id AND lt.consult_id = c.id) AS last_transition_at
FROM public.consult c
WHERE c.tenant_id = current_tenant_id_strict('async_consult_staff_summary_v');

ALTER VIEW async_consult_staff_summary_v OWNER TO async_consult_view_owner;
REVOKE ALL ON async_consult_staff_summary_v FROM PUBLIC;
GRANT SELECT ON async_consult_staff_summary_v TO async_consult_staff_reader;
-- async_consult_staff_reader is granted to clinician + admin + pharmacy portal roles
-- (NOT patient/delegate roles; those use async_consult_patient_summary_v above)

-- Owner-only base-table column grants (per P-036 R7 closure data-minimization)
GRANT SELECT (id, tenant_id, patient_id, consult_type, created_at) ON consult TO async_consult_view_owner;
GRANT SELECT (tenant_id, consult_id, to_state, transition_at, id) ON consult_lifecycle_transition TO async_consult_view_owner;
GRANT SELECT (tenant_id, consult_id, decision_type, decided_at) ON consult_clinician_decision TO async_consult_view_owner;
GRANT SELECT (tenant_id, consult_id) ON consult_follow_up_message TO async_consult_view_owner;
-- Neither async_consult_patient_reader nor async_consult_staff_reader has direct base-table
-- access; both read only via their respective views (patient_summary_v / staff_summary_v).
-- Readers CANNOT see intake/summary/decision/message ciphertext columns even indirectly.
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

**EXECUTE grants:** raw `record_consult_lifecycle_transition()` is owner-only — EXECUTE granted to **exactly the 5 wrapper-owner roles enumerated in §8**: `consult_initiation_wrapper_owner`, `consult_intake_wrapper_owner`, `consult_ai_preparation_wrapper_owner`, `consult_claim_wrapper_owner` (which owns both `claim_consult_for_review()` and `reassign_consult_claim()`), and `record_consult_decision_wrapper_owner`. **No other roles receive EXECUTE on the raw writer.** App roles get EXECUTE only on the wrappers (per the P-034 R4 closure raw-writer-restricted-to-wrappers pattern). (R9 MED-1 closure 2026-05-21: prior prose said "the 5 reason-specific wrapper owners + override wrapper + claim wrapper" — that compressed enumeration was internally inconsistent because no `override wrapper` role exists in §8/§10 preflight + `claim wrapper` was already one of the five. Implementers following the prior text could either fail migration by granting to a nonexistent owner or create an unpreflighted extra owner role around the raw lifecycle writer; adding such a role would have triggered hard-floor item 6 architectural-judgment escalation per CLAUDE.md.)

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
| 5 | GET | `/v1/async-consults/:consult_id` | patient / delegate / clinician / admin / pharmacy | R6 HIGH-2 closure 2026-05-21 caller-class routing: handler dispatches by JWT-verified actor role. Patient/delegate path reads `async_consult_patient_summary_v` (caller maps `async_consult_patient_reader`; view's predicate via verify_session_jwt_and_extract_claims + consent_grant join restricts visibility to caller's own consult(s)). Clinician/admin/pharmacy path reads `async_consult_staff_summary_v` (caller maps `async_consult_staff_reader`; tenant-wide visibility for review/triage). Handler MUST NOT grant cross-class access (no patient/delegate read against staff_summary_v; no staff read against patient_summary_v). The deprecated combined view name `consult_outcome_summary_view` is REMOVED from the API contract and the schema entirely; do not implement against it. |
| 6 | GET | `/v1/async-consults/queue` | clinician / admin / pharmacy | Clinician/admin/pharmacy review queue (paginated) via `async_consult_staff_summary_v` only |
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

**13 new roles** (R5 HIGH-1 closure 2026-05-21: split prior single `async_consult_reader` role into two caller-class-specific readers to enforce JWT-verified patient_id predicate on patient/delegate read path while preserving tenant-wide queue visibility for clinician/admin/pharmacy; previously POST-R1 MED-1 closure 2026-05-21: recounted to align with §10 deployment preflight enumeration; 5 application + 6 wrapper owners [1 raw writer + 5 reason-specific wrappers] + 2 view/MV owners):

### Application roles (5)

| Role | Granted to (via Admin Backend role-assignment) |
|---|---|
| `async_consult_patient_initiator` | patient role |
| `async_consult_delegate_initiator` | delegate role IFF `book-consults` scope per Consent slice |
| `async_consult_clinician_reviewer` | clinician role |
| `async_consult_patient_reader` | patient role + delegate role IFF `book-consults` scope (reads `async_consult_patient_summary_v` ONLY; predicate via canonical `verify_session_jwt_and_extract_claims()` CTE + `consent_grant` EXISTS clause enforces caller sees only their own consults — patient principal matches verified_patient_id; delegate principal authorized via active book-consults grant) |
| `async_consult_staff_reader` | clinician + pharmacy portal + admin (reads `async_consult_staff_summary_v` ONLY; tenant-wide queue visibility for review/triage; NOT granted to patient/delegate) |

### Wrapper/Service-level owner roles (6)

(R8 MED-1 closure 2026-05-21: previously this subsection was headed "(4)" with one row that slash-compressed 5 distinct wrapper-owner roles into a single line — the compressed display contradicted §1 + §10 + §8-tally's `5 app + 6 wrapper owners + 2 view/MV owners = 13` breakdown. Implementers using §8 as the RBAC source could have provisioned 4 owner-role groups instead of the distinct 8 owner roles required by §10, collapsing ownership boundaries around SECURITY DEFINER wrappers and view ownership. Fix: split compressed row into 5 distinct rows; restate subsection heading as "(6)"; explicit View/MV owner subsection as "(2)".)

| Role | Owns |
|---|---|
| `consult_lifecycle_transition_writer_owner` | `record_consult_lifecycle_transition()` (raw canonical transition writer); INSERT grant on `consult_lifecycle_transition` table; EXECUTE granted ONLY to the 5 reason-specific wrapper owners below |
| `consult_initiation_wrapper_owner` | `record_consult_initiation()` wrapper procedure |
| `consult_intake_wrapper_owner` | `record_consult_intake_submission()` wrapper procedure |
| `consult_ai_preparation_wrapper_owner` | `record_consult_ai_preparation_completed()` wrapper procedure |
| `consult_claim_wrapper_owner` | `claim_consult_for_review()` + `reassign_consult_claim()` wrapper procedures |
| `record_consult_decision_wrapper_owner` | `record_consult_clinician_decision()` wrapper procedure (extends SI-005 P-021) |

### View/MV owner roles (2)

| Role | Owns |
|---|---|
| `async_consult_view_owner` | `async_consult_patient_summary_v` + `async_consult_staff_summary_v` (both non-BYPASSRLS); owner-only base-table SELECT grants |
| `async_consult_mv_refresh_owner` | `consult_current_state_mv` (optional MV); only role with direct MV SELECT |

---

## 9. `jwt_migration_entity_status` seed scope (P-036 R6 closure pattern)

**Seed 9 entity names** at amendment-apply time with `phase_4_cutover_eligible=FALSE` AND `raw_guc_fallback_audited=TRUE` defaults (Phase B fail-closed-with-audit posture):

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
    ('async_consult_patient_summary_v',              FALSE, TRUE),
    ('async_consult_staff_summary_v',                FALSE, TRUE);
```

**cdm_owner sequencing guidance (per P-036 R6 closure precedent):** flip per-table `phase_4_cutover_eligible=TRUE` first (the 7 tables), then the two derived views' trust-anchors last so all upstream writers are JWT-cutover before downstream readers. Both views' trust-anchors depend ONLY on already-cutover canonical primitives — `verify_session_jwt_and_extract_claims()` (SI-024.1 v0.8 P-031) and `current_tenant_id_strict('<entity>')` (SI-024.1) — and, for the patient view, the Consent-slice `consent_grant` domain entity (no JWT cutover semantics; standard tenant-scoped relational table). **No net-new SI-024.1 platform-floor primitive is required for either view to flip.** (R7 HIGH-1 closure 2026-05-21: this sequencing guidance was stale post-R6; it previously claimed the patient view required a `current_jwt_verified_patient_id()` helper cutover, which contradicted R6's walk-back of that net-new helper. Implementers following the stale guidance could either block deployment waiting for a helper that should not exist, or reintroduce the exact platform-floor primitive R6 was supposed to eliminate. Corrected to align with the actual v0.7 dependency set.)

**Stale-reference assertion (R7 HIGH-1 closure):** the strings `current_jwt_verified_patient_id` and `consult_outcome_summary_view` MUST NOT appear anywhere in v0.7+ amendment text as **active dependencies or operational requirements**. They may appear ONLY in three permitted contexts: (1) §13 R-cycle log entries (historical record); (2) explicit deprecation-warning text using "REMOVED" / "do not implement against" / "walked back" phrasing (clarifies to implementers what NOT to do); (3) inline `walks back …` parenthetical commentary in §4 view-body SQL comments. Active dependency = "must be JWT-cutover", "must exist", "is required", "is granted to", "is owned by", etc. Implementer preflight: scan for the strings; any hit outside the three permitted contexts is a defect.

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
| `async_consult_patient_initiator` / `async_consult_delegate_initiator` / `async_consult_clinician_reviewer` / `async_consult_patient_reader` / `async_consult_staff_reader` | App roles (5; R5 HIGH-1 split `async_consult_reader` into patient + staff reader pair) |

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
        'async_consult_patient_reader',
        'async_consult_staff_reader'
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

4. **OQ4 — Canonical Consent-slice grant entity name + column shape** (R5 HIGH-1 closure 2026-05-21 introduced this dependency; R6 HIGH-1 closure 2026-05-21 walked back the net-new SI-024.1 helper assumption + restated this OQ as a weaker Consent-slice-domain-entity-name dependency only). The split `async_consult_patient_summary_v` references `public.consent_grant` in its delegate-scope EXISTS clause. The exact canonical entity name + columns for Consent-slice authorization grants are owned by Consent slice (SI-007 or equivalent). Ratifier confirms: (a) Consent-slice canonical entity name (assumed `consent_grant`; may differ as `delegate_authorization`, `consent_grant_row`, `patient_consent_grant`, etc.); (b) columns assumed by this amendment exist on the canonical entity: `tenant_id`, `delegate_id`, `patient_id`, `scope_name` (or `scope`), `status`, `expires_at`; (c) the `book-consults` scope literal value is canonically named (may differ as `book-consult`, `consults.book`, etc.); (d) `status = 'active'` is the canonical active-grant lifecycle value (vs. `granted`, `enabled`, etc.). If the canonical entity name or column shape differs, the implementation amendment patches the EXISTS clause to match — no schema or invariant amendment required. R6 HIGH-1 walked back R5's net-new `current_jwt_verified_patient_id()` SQL helper assumption; the predicate now composes entirely from already-ratified canonical primitives (`verify_session_jwt_and_extract_claims` from SI-024.1 P-031 + `session_jwt_admission` from CDM v1.6 P-032 + the Consent-slice domain entity above). No net-new platform-floor primitive is required.

---

## 13. Codex pre-ratification status

**v0.1 DRAFT 2026-05-21:** pre-Codex-review.

**v0.2 DRAFT 2026-05-21 — R1 closures applied (2 HIGH + 1 MED):**
- **R1 HIGH-1 closed:** `consult_clinician_decision_validate_claim_active()` BEFORE INSERT trigger looked up claim by `id` only — bypassed the composite tenant identity invariant enforced elsewhere. Fix: trigger lookup uses 5-column composite identity `(tenant_id, claim_id, consult_id, patient_id, clinician_account_id)`; RAISE on no exact-match row found BEFORE checking release/expiry; defense-in-depth boundary now equal-strength to the FK.
- **R1 HIGH-2 closed:** `consult_lifecycle_transition` row-level CHECK validated individual triples but did NOT enforce that new from_state == current latest to_state — direct table INSERTs by `consult_lifecycle_transition_writer_owner` (which has INSERT grant) could create divergent histories that still passed CHECK. Fix: added `consult_lifecycle_transition_continuity` BEFORE INSERT trigger that takes per-consult advisory lock + reads latest to_state under lock + validates continuity + rejects from-terminal transitions. Regardless of caller, lifecycle integrity is now schema-enforced (not procedure-dependent).
- **R1 MED-1 closed:** RBAC count mismatch — §1 scope + §8 said "8 roles (4 application + 4 wrapper/owner)" but §10 deployment preflight enumerated 12 roles. Implementer following §1/§8 would under-provision. Fix: recounted to **12 roles** (4 app + 6 wrapper owners + 2 view/MV owners) matching preflight enumeration; §1 + §8 + §10 now mutually consistent.

Authored on `spec/cdm-v1-9-audit-v5-11-openapi-v0-4-sm-v1-3-rbac-v1-3-si020-followon-2026-05-21` branch off main at `3129579` (post-P-037 + Addendum 65). v0.2 commit `48ca67d`. v0.3 commit `6522879`. v0.4 commit `bcf774d`. v0.5 commit `dfff011`. v0.6 commit `ed1fd88`. v0.7 commit `ba5b149`. v0.8 commit `fafa279`. v0.9 commit `6ed98ab`. v0.10 commit pending push for R10 verification.

**v0.10 DRAFT 2026-05-21 — R9 closure applied (1 MED):**
- **R9 MED-1 closed:** §3 raw `record_consult_lifecycle_transition()` EXECUTE-grants prose said "granted to the 5 reason-specific wrapper owners + override wrapper + claim wrapper" — internally inconsistent because no `override wrapper` owner exists in §8/§10 preflight AND `claim wrapper` was already one of the "5 reason-specific wrapper owners". Implementer reading §3 could either fail migration by granting to a nonexistent owner OR create an unpreflighted extra owner role around the raw lifecycle writer (which would itself trigger hard-floor item 6 architectural-judgment escalation per CLAUDE.md). Raw writer is the canonical append-only state-transition boundary; ambiguous EXECUTE grants are real privilege-isolation risk. Fix: rewrote §3 EXECUTE-grants prose to enumerate exactly the 5 wrapper-owner roles from §8 by canonical role name; added explicit "**No other roles receive EXECUTE on the raw writer**" assertion. Also rewrote §1.1 procedure-enumeration parenthetical from the previously-inconsistent "5 reason-specific wrappers + decision wrapper + claim + reassign" double-count to the canonical "7 procedures (1 raw + 6 wrapper procedures) owned by 6 owner roles" with explicit per-procedure owner mapping. §1 + §3 + §8 + §10 now mutually consistent on procedure count (7) and owner count (6).

**v0.9 DRAFT 2026-05-21 — R8 closure applied (1 MED):**
- **R8 MED-1 closed:** §8 RBAC subsection was headed "Wrapper/Service-level owner roles (4)" but the section actually named 8 owner roles. The compressed display contradicted §1 + §10 + §8-tally's `5 app + 6 wrapper owners + 2 view/MV owners = 13` breakdown. Implementers using §8 as the RBAC source could have provisioned 4 owner-role groups instead of the distinct 8 owner roles required by §10 preflight, collapsing SECURITY DEFINER wrapper ownership boundaries + view-owner separation (a real privilege-isolation regression, not just arithmetic prose). Fix: split previously-compressed slash row into 5 distinct wrapper-owner rows; renamed subsection "Wrapper/Service-level owner roles (6)"; added explicit "View/MV owner roles (2)" subsection. §1 + §8 + §10 counts now mutually consistent: 13 = 5 app + 6 wrapper owners + 2 view/MV owners.

**v0.8 DRAFT 2026-05-21 — R7 closure applied (1 HIGH):**
- **R7 HIGH-1 closed:** §9 cutover sequencing guidance still referenced the removed `current_jwt_verified_patient_id()` helper as a JWT-cutover prerequisite for the patient view, directly contradicting R6's walk-back of that net-new helper. Codex correctly flagged this as a rollout-safety + ratification-scope defect: implementers following the stale guidance could block deployment waiting for a helper that should not exist, OR reintroduce the exact platform-floor primitive R6 was supposed to eliminate. Fix: §9 sequencing guidance rewritten to enumerate the actual v0.7+ dependency set — `verify_session_jwt_and_extract_claims()` + `current_tenant_id_strict('<entity>')` (both already-cutover canonical SI-024.1 primitives) + Consent-slice `consent_grant` (standard tenant-scoped relational table; no JWT cutover semantics) — plus explicit "no net-new SI-024.1 platform-floor primitive required for either view to flip" assertion to match R6 walk-back posture. Added §9 stale-reference assertion forbidding `current_jwt_verified_patient_id` and `consult_outcome_summary_view` as active dependencies anywhere in v0.7+ text (permitted only in §13 R-cycle log + explicit deprecation-warning text + inline walks-back parenthetical commentary). Two additional prose-consistency fixes piggy-backed: §4.NEW8 heading updated from removed combined view name to split-pair view names + R-cycle attribution; §8 RBAC `async_consult_patient_reader` row predicate description updated to canonical schema-backed-join phrasing. Stale-reference sweep verified: 9 remaining hits all in permitted contexts.

**v0.7 DRAFT 2026-05-21 — R6 closures applied (2 HIGH):**
- **R6 HIGH-1 closed (walks back R5's net-new helper assumption):** Codex correctly flagged the R5 predicate's `current_jwt_verified_patient_id()` reference as a hard-floor item 6 architectural-judgment finding — a net-new SI-024.1 platform-floor primitive beyond ratified scope. Codex offered two closure paths: (Option A) make the helper a deployment prerequisite with executable preflight, or (Option B) replace the helper assumption with explicit, schema-backed joins to canonical admission and delegate-scope tables. Option B applied: `async_consult_patient_summary_v` predicate now uses a CTE wrapping `verify_session_jwt_and_extract_claims()` (already RATIFIED at SI-024.1 v0.8 P-031) to extract verified tenant_id / patient_id / delegate_id, then enforces caller's authorized scope via (a) direct match on `c.patient_id = vc.verified_patient_id` for patient principals, or (b) EXISTS clause against `public.consent_grant` for delegate principals with `book-consults` scope. No net-new SQL helper, no net-new SI-024.1 primitive, no net-new invariant. Predicate composes entirely from ratified primitives. Hard-floor item 6 dissolved (not escalated) because the closure removes the architectural-judgment trigger condition.
- **R6 HIGH-2 closed:** OpenAPI v0.4 §6 row 5 still referenced the removed `consult_outcome_summary_view` after R5 split. Fix: rewrote row 5 to document caller-class routing — patient/delegate handler dispatches to `async_consult_patient_summary_v` mapping `async_consult_patient_reader`; clinician/admin/pharmacy handler dispatches to `async_consult_staff_summary_v` mapping `async_consult_staff_reader`. Explicit no-cross-class-access rule. Deprecated combined view name explicitly REMOVED from API contract; implementers cannot accidentally implement against it. Row 6 (queue) also routed to staff_summary_v.
- **OQ4 walked back:** R5's OQ4 ("confirm net-new SI-024.1 helper name + semantics") was hard-floor item 6 territory. R6 closure removes the net-new helper dependency entirely. OQ4 retained at MUCH weaker level: "confirm Consent-slice canonical domain entity name + column shape" (assumed `consent_grant` with columns tenant_id, delegate_id, patient_id, scope_name, status, expires_at; book-consults scope literal; status='active' active-grant literal). This is a standard domain-entity-name OQ closeable in normal ratification ceremony without schema or invariant amendment.

**v0.6 DRAFT 2026-05-21 — R5 closure applied (1 HIGH):**
- **R5 HIGH-1 closed:** single tenant-wide `consult_outcome_summary_view` + single `async_consult_reader` role granted to patient/delegate role would have leaked OTHER patients' consult metadata (consult_id, consult_type, current_state, decision_type, prescribing_count, last_transition_at) to patient-app callers within the same tenant — only base-table ciphertext columns were hidden by data-minimization pattern; metadata was tenant-wide. Fix: view + reader role SPLIT into two caller-class-specific pairs. (1) `async_consult_patient_summary_v` adds predicate `AND c.patient_id = current_jwt_verified_patient_id('async_consult_patient_summary_v')` restricting patient/delegate principals to ONLY their own consults; granted to new `async_consult_patient_reader` role (held by patient + delegate IFF book-consults scope). (2) `async_consult_staff_summary_v` retains tenant-wide visibility for clinician/admin/pharmacy queue triage; granted to new `async_consult_staff_reader` role. New SI-024.1 helper `current_jwt_verified_patient_id(<entity>)` analogous to `current_tenant_id_strict`; raises `patient_jwt_missing` if no admission record. RBAC count 12 → 13 roles (5 app + 6 wrapper owners + 2 view/MV owners); §10 preflight enumeration updated; §9 seed scope adds both view names (now 9 entities, replacing single view entry). New OQ4 added for Identity-slice + Consent-slice owners to confirm canonical helper name + delegate-scope predicate semantics. Per-tenant patient-summary data leak now schema-enforced.

**v0.5 DRAFT 2026-05-21 — R4 closure applied (1 HIGH):**
- **R4 HIGH-1 closed:** invariant-enforcing trigger functions used unqualified table references + lacked locked search_path → caller-controlled temp relation shadowing could redirect invariant checks to attacker-controlled rows (validation passes, but real FK still references actual released claim → append-only decision inserted against released claim, reopening exact race R3 was meant to close). Fix: applied canonical P-034 R7 SECURITY DEFINER hardening pattern to all 3 invariant-enforcing trigger functions: (a) `consult_clinician_decision_validate_claim_active` — `SET search_path = pg_catalog, public` + `FROM public.consult_review_claim`; (b) `consult_lifecycle_transition_continuity` — same; (c) `consult_review_claim_one_way_released_at` — same (no SELECT in body but locked search_path for consistency). Trust-boundary now fully hardened.

**v0.4 DRAFT 2026-05-21 — R3 closures applied (2 HIGH + 1 MED):**
- **R3 HIGH-1 closed:** decision validation trigger could race claim release/reassignment under READ COMMITTED (validate active claim while concurrent UPDATE-s released_at, leaving append-only decision referencing released claim). Fix: trigger now acquires same per-consult advisory lock as `claim_consult_for_review()` + `reassign_consult_claim()`; uses SELECT...FOR UPDATE on claim row to pin the snapshot; all release/reassign procedures must use same lock order (already do per SI-020 v0.11).
- **R3 HIGH-2 closed:** R2 continuity trigger permitted equal transition_at values; ORDER BY transition_at DESC, id DESC tie-break uses UUID ordering which can place newer transition BEFORE older one if UUID sorts lower → current-state derivation could stay stale even after a valid transition was accepted. Fix: strict > monotonic ordering on transition_at; no equality permitted for non-initial transitions; ensures just-inserted row is unambiguously the latest.
- **R3 MED-1 closed:** `consult_review_claim.clinician_account_id` FK referenced `accounts(id)` without tenant_id, leaving tenant isolation on the claim chain dependent on wrapper logic. Fix: composite tenant-scoped FK `(tenant_id, clinician_account_id) → tenant_account_membership(tenant_id, account_id)` per assumed Identity slice canonical entity; new §12 OQ3 added for ratifier to confirm canonical name.

**v0.3 DRAFT 2026-05-21 — R2 closure applied (1 HIGH):**
- **R2 HIGH-1 closed:** R1 continuity trigger validated NEW.from_state == latest to_state but didn't enforce monotonic transition_at ordering. Backdated rows could pass from_state check (matches current latest to_state) while corrupting current-state derivation (since `ORDER BY transition_at DESC` determines current state — older row could shadow newer); future-dated rows could dominate current-state reads immediately. Append-only state-machine invariant undermined. Fix: trigger now reads latest transition_at alongside latest to_state under the same advisory lock + rejects NEW.transition_at < latest transition_at (backdated forbidden) + rejects NEW.transition_at > now() + 5s clock-skew tolerance (future-dated dominance attack). Monotonic-ordering invariant now schema-enforced.

---

— Claude (Opus 4.7, 1M context), CDM v1.8 → v1.9 + AUDIT_EVENTS v5.10 → v5.11 + DOMAIN_EVENTS additive + OpenAPI v0.3 → v0.4 + State Machines v1.2 → v1.3 + RBAC v1.2 → v1.3 SI-020 follow-on amendment v0.1 DRAFT authored 2026-05-21 per P-037 OQ canonical decision + established post-P-029 SI-spec-first promotion pattern (SIXTH instance) + CLAUDE.md two-pass discipline + auto-proceed rule + proactive application of all lessons-learned from P-031 through P-037 cycles. R1 Codex review queued.
