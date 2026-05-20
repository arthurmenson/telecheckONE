# SI-019 Medication-Interaction Signal Option B Follow-On Amendment

**Version:** 1.0 (Option B implementation-detail amendment per Sprint 10 §6 downstream-scope checklist)
**Status:** RATIFIED 2026-05-20 via Promotion Ledger P-026 OQ-A decision (SI-019 = Option B: constrained UPDATE + transition log)
**Owner:** Clinical Lead + Engineering Lead + Pharmacy Lead
**Parent SI:** `Telecheck_Medication_Interaction_Engine_Slice_PRD_v2_0.md` (canonical promoted at P-026)
**Companion documents:** Promotion Ledger P-026 (OQ-A ratification); P-027 (CDM v1.3 inclusion); Cross-SI Publish-State Decision Record v1.0 (canonical Option B pattern definition); Sprint 1 SI-019 signal-lifecycle OQ7 (resolved via this Option B selection).

---

## 1. Purpose + scope

Option B implementation details for medication-interaction signal lifecycle per Sprint 10 §6 downstream-scope checklist. Mirrors the SI-015 Option B amendment structure but adapted to the signal-lifecycle domain (concurrent clinician review races + clinical decision tracking).

The signal state machine: `detected → under_review → { acknowledged | overridden | escalated } → resolved`.

---

## 2. Canonical SECURITY DEFINER procedure

```sql
CREATE OR REPLACE PROCEDURE transition_medication_interaction_signal(
    p_tenant_id tenant_id_t,
    p_signal_id UUID,
    p_from_state TEXT,                            -- 'detected' | 'under_review' | 'acknowledged' | 'overridden' | 'escalated'
    p_to_state TEXT,
    p_clinician_id UUID,                          -- Acting clinician
    p_transition_reason TEXT,
    p_clinical_decision_notes TEXT,               -- Mandatory for acknowledged/overridden/escalated transitions
    p_idempotency_key UUID
) SECURITY DEFINER LANGUAGE plpgsql AS $$
DECLARE
    v_rows_updated INT;
    v_existing_transition_id UUID;
BEGIN
    -- STEP 0a: caller-role check — only clinician role can transition signals
    IF NOT (current_setting('app.user_role', true) IN ('clinician', 'tenant_operator', 'compliance_officer')) THEN
        RAISE EXCEPTION 'caller role % not authorized' USING ERRCODE = 'TLC42';
    END IF;

    -- STEP 0b: I-032 tenant-GUC check
    IF NULLIF(current_setting('app.tenant_id', true), '') IS DISTINCT FROM p_tenant_id THEN
        RAISE EXCEPTION 'I-032 violation' USING ERRCODE = 'TLC32';
    END IF;

    -- STEP 0c: Clinical-decision-notes mandatory for clinical-judgment transitions
    IF p_to_state IN ('acknowledged', 'overridden', 'escalated')
       AND (p_clinical_decision_notes IS NULL OR length(p_clinical_decision_notes) < 10) THEN
        RAISE EXCEPTION 'clinical_decision_notes required for state transition to %; min 10 chars', p_to_state
            USING ERRCODE = 'TLC53';
    END IF;

    -- STEP 1: Idempotency check
    SELECT id INTO v_existing_transition_id
        FROM medication_interaction_signal_transition_log
        WHERE tenant_id = p_tenant_id
          AND signal_id = p_signal_id
          AND transition_idempotency_key = p_idempotency_key;
    IF FOUND THEN
        RAISE NOTICE 'idempotent retry; existing transition %', v_existing_transition_id;
        RETURN;
    END IF;

    -- STEP 2: Constrained UPDATE with strict from_state guard + concurrent-review serialization
    -- pg_advisory_xact_lock serializes concurrent reviews at the signal level (per Cross-SI Decision Record
    -- §4 working recommendation: "SI-019 = Option B with explicit ROW_COUNT race-detection")
    PERFORM pg_advisory_xact_lock(hashtext(p_tenant_id::text || ':' || p_signal_id::text));

    UPDATE medication_interaction_signal
       SET status = p_to_state,
           last_state_change_at = now(),
           last_state_change_by_clinician_id = p_clinician_id,
           clinical_decision_notes_current = p_clinical_decision_notes
     WHERE id = p_signal_id
       AND tenant_id = p_tenant_id
       AND status = p_from_state;
    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

    -- STEP 3: ROW_COUNT=0 race-detection
    IF v_rows_updated = 0 THEN
        RAISE EXCEPTION 'medication_interaction_signal transition failed: signal id=% not in expected from_state %; another clinician may have transitioned first',
            p_signal_id, p_from_state
            USING ERRCODE = 'TLC50';
    END IF;

    -- STEP 4: Append-only transition_log INSERT
    INSERT INTO medication_interaction_signal_transition_log
        (tenant_id, signal_id, from_state, to_state, transition_idempotency_key,
         transitioned_by_clinician_id, transition_reason, clinical_decision_notes)
    VALUES
        (p_tenant_id, p_signal_id, p_from_state, p_to_state, p_idempotency_key,
         p_clinician_id, p_transition_reason, p_clinical_decision_notes);

    -- STEP 5: Cat A audit emission via application-layer catch-and-emit pattern
    --         `medication.interaction_signal_transitioned` event
END;
$$;
```

---

## 3. Append-only transition log schema

```sql
CREATE TABLE medication_interaction_signal_transition_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    signal_id UUID NOT NULL,
    from_state TEXT NOT NULL,
    to_state TEXT NOT NULL,
    transition_idempotency_key UUID NOT NULL,
    transitioned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    transitioned_by_clinician_id UUID NOT NULL,
    transition_reason TEXT NOT NULL,
    clinical_decision_notes TEXT,                 -- Encrypted at rest per pii_clinical KMS data class
    CONSTRAINT medication_interaction_signal_transition_log_composite_fk
        FOREIGN KEY (tenant_id, signal_id)
        REFERENCES medication_interaction_signal(tenant_id, id),
    CONSTRAINT medication_interaction_signal_transition_log_idem_unique
        UNIQUE (tenant_id, signal_id, transition_idempotency_key)
);

CREATE INDEX medication_interaction_signal_transition_log_history_idx
    ON medication_interaction_signal_transition_log(tenant_id, signal_id, transitioned_at DESC);

ALTER TABLE medication_interaction_signal_transition_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY medication_interaction_signal_transition_log_tenant_rls
    ON medication_interaction_signal_transition_log
    USING (tenant_id = current_setting('app.tenant_id')::tenant_id_t);

CREATE TRIGGER medication_interaction_signal_transition_log_append_only
    BEFORE UPDATE OR DELETE ON medication_interaction_signal_transition_log
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
```

---

## 4. GRANT statements

```sql
REVOKE ALL ON PROCEDURE transition_medication_interaction_signal FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE transition_medication_interaction_signal
    TO clinician, tenant_operator, compliance_officer;

REVOKE UPDATE ON medication_interaction_signal FROM PUBLIC;
-- (Procedure runs as SECURITY DEFINER under privileged role; direct UPDATEs blocked.)
```

---

## 5. Concurrent-review race handling (signal-domain specific)

Per Cross-SI Decision Record §4 SI-019 working recommendation: "concurrent review handled cleanly by constrained UPDATE."

**Scenario:** clinician A + clinician B both pull the same `detected`-state signal into review simultaneously.

- Both call `transition_medication_interaction_signal(..., from_state='detected', to_state='under_review', ...)` in parallel.
- `pg_advisory_xact_lock` serializes them.
- First-to-arrive: UPDATE succeeds; transition_log INSERT succeeds; signal is now `under_review` with clinician A as last_state_change_by_clinician_id.
- Second-to-arrive: UPDATE returns ROW_COUNT=0 (signal no longer in `detected` state); procedure raises TLC50; clinician B's client receives an error explaining that another clinician transitioned the signal first; UI prompts clinician B to refresh + see current state.

This is the canonical safe-concurrent-review pattern; no double-acknowledgment, no race-condition state corruption.

---

## 6. Cross-SI alignment

- **Sprint 1 SI-019 v1.0 → v2.0 (P-026):** canonical signal schema lives here.
- **CDM v1.3 (P-027):** `medication_interaction_signal_transition_log` added at CDM v1.3.
- **AUDIT_EVENTS v5.6:** `medication.interaction_signal_transitioned` (Cat A P1 keyed by patient_id) added at P-027.
- **Cross-SI Decision Record §4:** SI-019 = Option B with explicit ROW_COUNT race-detection — this amendment IS the implementation of that recommendation.

---

## 7. Open questions

1. **OQ1 — `medication_interaction_signal.status` field at CDM v1.3.** Add to canonical SI-019 schema at CDM v1.3.1 follow-on. Recommendation: enum `detected | under_review | acknowledged | overridden | escalated | resolved`.
2. **OQ2 — `clinical_decision_notes_current` field on base table.** Recommendation: nullable; populated at each transition; the prior value is preserved in the transition_log.
3. **OQ3 — Codex pre-ratification target.** Recommendation: 2 rounds.

---

— SI-019 Option B follow-on amendment per OQ-A ratified at P-026. Authored 2026-05-20.
