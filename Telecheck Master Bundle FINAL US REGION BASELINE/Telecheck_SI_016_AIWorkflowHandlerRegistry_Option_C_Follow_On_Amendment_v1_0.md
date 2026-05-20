# SI-016 AI Workflow Handler Registry Option C Follow-On Amendment

**Version:** 1.0 (Option C implementation-detail amendment per Sprint 10 §6 downstream-scope checklist)
**Status:** RATIFIED 2026-05-20 via Promotion Ledger P-026 OQ-A decision (SI-016 = Option C: event-sourced authoritative source + materialized current-state projection)
**Owner:** AI Service Lead + Engineering Lead
**Parent SI:** `Telecheck_SI_016_AI_Workflow_Handler_Registry_v1_0.md` (canonical promoted at P-026)
**Companion documents:** Promotion Ledger P-026 (OQ-A ratification); P-027 (CDM v1.3 inclusion); Cross-SI Publish-State Decision Record v1.0 (canonical Option C pattern definition); Sprint 12 Mode 2 Handler Spec §3 (consumer of this registry).

---

## 1. Purpose + scope

Option C implementation details for ai_workflow_handler_registry per Sprint 10 §6 downstream-scope checklist:

1. AFTER INSERT trigger maintaining the materialized current-state projection.
2. Materialized projection schema + RLS.
3. Bootstrap procedure (rebuild projection from transition_log).
4. Authoritative-source-of-truth note: transition_log is source-of-truth; projection is read-cache.

---

## 2. Schemas

### 2.1 Append-only authoritative transition log

```sql
CREATE TABLE ai_workflow_handler_transition_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    handler_id UUID NOT NULL,
    workflow_id TEXT NOT NULL,                     -- e.g., 'refill_request_v1'
    from_state TEXT,                               -- NULL on initial admission
    to_state TEXT NOT NULL,                        -- 'draft' | 'published' | 'retracted'
    handler_version TEXT NOT NULL,                 -- Semver-monotonic per Sprint 16 §3 SD1
    handler_tenant_id tenant_id_t NOT NULL,        -- Eligible tenant per OQ-B P-018b cross-SI scope
    transitioned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    transitioned_by_user_id UUID NOT NULL,
    transition_reason TEXT NOT NULL,
    -- Admissibility per Cross-SI Decision Record Option A (which Option C inherits for authoritative-source layer)
    CONSTRAINT ai_workflow_handler_transition_log_single_winner_uk
        UNIQUE (tenant_id, handler_id, COALESCE(from_state, '__initial__'))
);

CREATE INDEX ai_workflow_handler_transition_log_lookup_idx
    ON ai_workflow_handler_transition_log(tenant_id, workflow_id, transitioned_at DESC);

ALTER TABLE ai_workflow_handler_transition_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_workflow_handler_transition_log_tenant_rls
    ON ai_workflow_handler_transition_log
    USING (tenant_id = current_setting('app.tenant_id')::tenant_id_t);

CREATE TRIGGER ai_workflow_handler_transition_log_append_only
    BEFORE UPDATE OR DELETE ON ai_workflow_handler_transition_log
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();
```

### 2.2 Materialized current-state projection

```sql
CREATE TABLE ai_workflow_handler_registry (
    tenant_id tenant_id_t NOT NULL,
    workflow_id TEXT NOT NULL,
    handler_id UUID NOT NULL,
    current_state TEXT NOT NULL,                   -- 'draft' | 'published' | 'retracted'
    handler_version TEXT NOT NULL,
    handler_tenant_id tenant_id_t NOT NULL,
    last_transition_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (tenant_id, workflow_id, handler_id)
);

CREATE INDEX ai_workflow_handler_registry_published_idx
    ON ai_workflow_handler_registry(tenant_id, workflow_id)
    WHERE current_state = 'published';

ALTER TABLE ai_workflow_handler_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_workflow_handler_registry_tenant_rls
    ON ai_workflow_handler_registry
    USING (tenant_id = current_setting('app.tenant_id')::tenant_id_t);
```

**Note:** the projection table is NOT a `MATERIALIZED VIEW` (REFRESH overhead is too high for low-volume publish transitions); instead, it's a regular table maintained by AFTER INSERT trigger per §3 below. This is the "best of both worlds" pattern per Sprint 10 §2 Option C — append-only authoritative source (transition_log) + UPSERT-maintained projection.

---

## 3. AFTER INSERT trigger (projection maintenance)

```sql
CREATE OR REPLACE FUNCTION sync_ai_workflow_handler_registry_projection()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- UPSERT the projection row from the newly-inserted transition_log row.
    -- Idempotency: if a duplicate (tenant_id, workflow_id, handler_id) projection row exists,
    -- we update it to the new current_state (the latest transition wins).
    INSERT INTO ai_workflow_handler_registry
        (tenant_id, workflow_id, handler_id, current_state, handler_version,
         handler_tenant_id, last_transition_at)
    VALUES
        (NEW.tenant_id, NEW.workflow_id, NEW.handler_id, NEW.to_state, NEW.handler_version,
         NEW.handler_tenant_id, NEW.transitioned_at)
    ON CONFLICT (tenant_id, workflow_id, handler_id)
    DO UPDATE SET
        current_state = EXCLUDED.current_state,
        handler_version = EXCLUDED.handler_version,
        handler_tenant_id = EXCLUDED.handler_tenant_id,
        last_transition_at = GREATEST(ai_workflow_handler_registry.last_transition_at, EXCLUDED.last_transition_at);
    RETURN NEW;
END;
$$;

CREATE TRIGGER ai_workflow_handler_transition_log_sync_projection
    AFTER INSERT ON ai_workflow_handler_transition_log
    FOR EACH ROW EXECUTE FUNCTION sync_ai_workflow_handler_registry_projection();
```

The trigger runs in the same transaction as the transition_log INSERT — the projection update is atomic with the authoritative event INSERT. No partial state possible.

---

## 4. Bootstrap procedure (projection rebuild)

If the projection table is corrupted or needs full rebuild from the transition_log:

```sql
CREATE OR REPLACE PROCEDURE rebuild_ai_workflow_handler_registry_projection(
    p_tenant_id tenant_id_t
) SECURITY DEFINER LANGUAGE plpgsql AS $$
BEGIN
    -- STEP 0a: caller-role check (only Engineering Lead OR SRE Lead may invoke)
    IF NOT (current_setting('app.user_role', true) IN ('engineering_lead', 'sre_lead')) THEN
        RAISE EXCEPTION 'caller role % not authorized' USING ERRCODE = 'TLC42';
    END IF;

    -- STEP 0b: I-032 tenant-GUC check
    IF NULLIF(current_setting('app.tenant_id', true), '') IS DISTINCT FROM p_tenant_id THEN
        RAISE EXCEPTION 'I-032 violation' USING ERRCODE = 'TLC32';
    END IF;

    -- Truncate the tenant's projection rows + rebuild from transition_log
    DELETE FROM ai_workflow_handler_registry WHERE tenant_id = p_tenant_id;

    INSERT INTO ai_workflow_handler_registry
        (tenant_id, workflow_id, handler_id, current_state, handler_version,
         handler_tenant_id, last_transition_at)
    SELECT DISTINCT ON (tenant_id, workflow_id, handler_id)
        tenant_id, workflow_id, handler_id, to_state, handler_version,
        handler_tenant_id, transitioned_at
    FROM ai_workflow_handler_transition_log
    WHERE tenant_id = p_tenant_id
    ORDER BY tenant_id, workflow_id, handler_id, transitioned_at DESC;

    -- Cat A audit event emitted via application-layer catch-and-emit
END;
$$;
```

---

## 5. Authoritative-source-of-truth note

**Per Cross-SI Decision Record Option C §"Properties":** the `ai_workflow_handler_transition_log` table is the AUTHORITATIVE source of truth for handler-registry state. The `ai_workflow_handler_registry` projection is a READ CACHE — applications read from it for performance, but audit reconstruction MUST source from the transition_log.

Application reads:
- **Hot path (per Sprint 12 §3.1 Mode 2 handler resolution):** SELECT from `ai_workflow_handler_registry` WHERE `current_state = 'published'`. p99 <2ms.
- **Audit reconstruction:** SELECT from `ai_workflow_handler_transition_log` ORDER BY `transitioned_at`. Iterates the full event history.

I-027 append-only invariant: only the transition_log is bound by I-027 (it IS the authoritative event source). The projection table is NOT I-027-bound (it's a derived cache); if corrupted, rebuild via §4. Cat A `ai.workflow_handler_registry.projection_rebuilt` event emitted per rebuild.

---

## 6. Cat A audit emission for handler transitions

Per Sprint 16 §3 SD1 + the convergent application-layer catch-and-emit pattern:

- Procedure (transition_marketing_copy-equivalent for handler-registry) does NOT emit Cat A audit inside.
- Application middleware catches procedure success + emits `ai.workflow_handler.transitioned` (Cat A; P2 keyed by tenant_id) in a separate-committed transaction.
- On failure: catches the error code + emits Cat A `ai.workflow_handler.transition_failed`.

---

## 7. Open questions

1. **OQ1 — Projection rebuild cadence.** Recommendation: rebuild only on suspected corruption (operator-triggered); no scheduled rebuild. Ratifier confirms.
2. **OQ2 — Codex pre-ratification target.** Recommendation: 2 rounds.

---

— SI-016 Option C follow-on amendment per OQ-A ratified at P-026. Authored 2026-05-20.
