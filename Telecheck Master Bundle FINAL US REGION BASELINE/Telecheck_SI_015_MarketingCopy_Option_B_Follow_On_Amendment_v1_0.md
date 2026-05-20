# SI-015 MarketingCopy Option B Follow-On Amendment

**Version:** 1.0 (Option B implementation-detail amendment per Sprint 10 §6 downstream-scope checklist)
**Status:** RATIFIED 2026-05-20 via Promotion Ledger P-026 OQ-A decision (SI-015 = Option B: constrained UPDATE + transition log)
**Owner:** Marketing Engineering Lead + Compliance Officer
**Parent SI:** `Telecheck_SI_015_MarketingCopy_v1_0.md` (canonical entity schema; promoted at P-026)
**Companion documents:** Promotion Ledger P-026 (OQ-A ratification); P-027 (CDM v1.3 + Contracts Pack v5.3 inclusion); Cross-SI Publish-State Decision Record v1.0 (canonical Option B pattern definition).

---

## 1. Purpose + scope

This follow-on amendment specifies the **Option B implementation details** for MarketingCopy publish-state lifecycle per the Sprint 10 §6 downstream-scope checklist:

1. SECURITY DEFINER procedure signature with named `p_tenant_id` parameter.
2. Constrained UPDATE WHERE clause with allowed `from_state` enumeration.
3. ROW_COUNT=0 race-detection with canonical TLC50 error code.
4. Idempotency wrapper for "already transitioned" retries.
5. Append-only `marketing_copy_transition_log` schema with composite tenant FK + RLS.
6. GRANT statements (procedure-caller role + base-table-update restriction).
7. Rollback semantics for constraint-violation mid-transition.

---

## 2. Canonical SECURITY DEFINER procedure

```sql
CREATE OR REPLACE PROCEDURE transition_marketing_copy(
    p_tenant_id tenant_id_t,
    p_marketing_copy_id UUID,
    p_from_state TEXT,                            -- 'draft' | 'published' | 'retracted'
    p_to_state TEXT,                              -- 'draft' | 'published' | 'retracted'
    p_user_id UUID,
    p_transition_reason TEXT,
    p_idempotency_key UUID                        -- Caller-supplied; same key on retry = same logical transition
) SECURITY DEFINER LANGUAGE plpgsql AS $$
DECLARE
    v_rows_updated INT;
    v_prior_transition_id UUID;
BEGIN
    -- STEP 0a: SECURITY DEFINER caller-role check (per Sprint 14 §3 SD5)
    IF NOT (current_setting('app.user_role', true) IN ('tenant_operator', 'marketing_copy_publisher', 'compliance_officer')) THEN
        RAISE EXCEPTION 'caller role % not authorized for transition_marketing_copy', current_setting('app.user_role', true)
            USING ERRCODE = 'TLC42';
    END IF;

    -- STEP 0b: I-032 tenant-GUC guard (per Sprint 8 SI-017 §11)
    IF NULLIF(current_setting('app.tenant_id', true), '') IS DISTINCT FROM p_tenant_id THEN
        RAISE EXCEPTION 'I-032 tenant-GUC violation: app.tenant_id=% does not match procedure p_tenant_id=%',
            NULLIF(current_setting('app.tenant_id', true), ''), p_tenant_id
            USING ERRCODE = 'TLC32';
    END IF;

    -- STEP 1: Idempotency check (per Sprint 10 Option B §"24h same-ledger-row re-dispatch" pattern adapted)
    SELECT id INTO v_prior_transition_id
        FROM marketing_copy_transition_log
        WHERE tenant_id = p_tenant_id
          AND marketing_copy_id = p_marketing_copy_id
          AND transition_idempotency_key = p_idempotency_key;
    IF FOUND THEN
        -- Already-transitioned: idempotent retry returns the prior transition_id without re-applying
        RAISE NOTICE 'idempotent retry; prior transition %', v_prior_transition_id;
        RETURN;
    END IF;

    -- STEP 2: Constrained UPDATE with strict state-equality guard (per Cross-SI Decision Record Option B §2)
    UPDATE marketing_copy
       SET status = p_to_state,
           last_state_change_at = now(),
           last_state_change_by_user_id = p_user_id
     WHERE id = p_marketing_copy_id
       AND tenant_id = p_tenant_id
       AND status = p_from_state;
    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

    -- STEP 3: ROW_COUNT=0 race-detection + TLC50 error per Cross-SI Decision Record Option B
    IF v_rows_updated = 0 THEN
        RAISE EXCEPTION 'marketing_copy transition failed: row id=% not in expected from_state %',
            p_marketing_copy_id, p_from_state
            USING ERRCODE = 'TLC50';
    END IF;

    -- STEP 4: Append-only transition_log INSERT (cross-row atomic with UPDATE via single procedure transaction)
    INSERT INTO marketing_copy_transition_log
        (tenant_id, marketing_copy_id, from_state, to_state, transition_idempotency_key,
         transitioned_by_user_id, transition_reason)
    VALUES
        (p_tenant_id, p_marketing_copy_id, p_from_state, p_to_state, p_idempotency_key,
         p_user_id, p_transition_reason);

    -- STEP 5: Cat A audit emission via application-layer catch-and-emit pattern
    -- (procedure does NOT emit audit inside; application middleware catches procedure-success + emits Cat A
    -- `marketing_copy.transitioned` per Sprint 8 SI-017 §11 application-layer audit-emission pattern)
END;
$$;
```

---

## 3. Append-only transition log schema

```sql
CREATE TABLE marketing_copy_transition_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    marketing_copy_id UUID NOT NULL,
    from_state TEXT NOT NULL,
    to_state TEXT NOT NULL,
    transition_idempotency_key UUID NOT NULL,
    transitioned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    transitioned_by_user_id UUID NOT NULL,
    transition_reason TEXT NOT NULL,
    -- Composite FK per Sprint 9 §6.1 R4 MED-1 pattern
    CONSTRAINT marketing_copy_transition_log_composite_fk
        FOREIGN KEY (tenant_id, marketing_copy_id)
        REFERENCES marketing_copy(tenant_id, id),
    -- Idempotency uniqueness
    CONSTRAINT marketing_copy_transition_log_idem_unique
        UNIQUE (tenant_id, marketing_copy_id, transition_idempotency_key)
);

CREATE INDEX marketing_copy_transition_log_history_idx
    ON marketing_copy_transition_log(tenant_id, marketing_copy_id, transitioned_at DESC);

-- RLS policy
ALTER TABLE marketing_copy_transition_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY marketing_copy_transition_log_tenant_rls
    ON marketing_copy_transition_log
    USING (tenant_id = current_setting('app.tenant_id')::tenant_id_t);

-- Append-only enforcement per Sprint 9 §6.2 enforce_append_only() trigger pattern
CREATE TRIGGER marketing_copy_transition_log_append_only
    BEFORE UPDATE OR DELETE ON marketing_copy_transition_log
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
```

---

## 4. GRANT statements

```sql
-- Procedure-caller permissions: only marketing-copy-publisher role can EXECUTE
REVOKE ALL ON PROCEDURE transition_marketing_copy FROM PUBLIC;
GRANT EXECUTE ON PROCEDURE transition_marketing_copy
    TO marketing_copy_publisher, tenant_operator, compliance_officer;

-- Base-table UPDATE restriction: only the procedure can UPDATE marketing_copy.status
REVOKE UPDATE ON marketing_copy FROM PUBLIC;
-- (The procedure runs as SECURITY DEFINER under a privileged role with marketing_copy UPDATE permission;
-- direct UPDATEs from application code are blocked.)

-- Static-analyzer rule TLC-MC-001 verifies no application code path issues direct UPDATE on marketing_copy.status
-- outside the canonical procedure.
```

---

## 5. Rollback semantics for mid-transition constraint violation

If `transition_marketing_copy` raises mid-procedure (e.g., transition_log INSERT fails due to constraint violation):
- The entire procedure transaction rolls back (PostgreSQL canonical behavior).
- The base-table UPDATE is reverted; status reverts to `p_from_state`.
- The transition_log INSERT is reverted; no log entry persists.
- The procedure raises with the original error code; caller receives canonical error per ERROR_MODEL.
- Application-layer middleware catches the error + emits Cat A `marketing_copy.transition_failed` audit event via the application-layer catch-and-emit pattern (per Sprint 8 §11; separate-transaction commit).

This makes transition + log emission atomic; partial-state is impossible by construction.

---

## 6. Open questions for ratifier

1. **OQ1 — `marketing_copy.status` field at CDM v1.3.** This procedure assumes `marketing_copy.status` text column exists. Recommendation: add to canonical SI-015 schema at CDM v1.3.1 follow-on amendment.
2. **OQ2 — Allowed state transitions.** Recommendation: `none → draft → published → retracted`; no transition from retracted back to draft (irreversible). Ratifier confirms.
3. **OQ3 — Codex pre-ratification target.** Recommendation: 2 rounds.

---

— SI-015 Option B follow-on amendment per OQ-A ratified at P-026. Authored 2026-05-20.
