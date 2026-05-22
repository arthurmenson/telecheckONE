# CDM v1.10 → v1.11 + AUDIT_EVENTS v5.12 → v5.13 + OpenAPI v0.5 → v0.6 + State Machines v1.4 → v1.5 + RBAC v1.4 → v1.5 Amendment (SI-023 Admin Backend Basics follow-on)

**Version:** 0.2 DRAFT
**Status:** DRAFT 2026-05-22 — R1 closures applied (2 HIGH + 1 MED); awaiting R2 Codex re-verification. Post-R1 changes: (a) R1 HIGH-1 closed — admin_mode1_volume_health_v reconciled to SI-023 Sub-decision 2 Surface 3 contract (last-24h aggregate + explicit `mode1.crisis_detection_trigger` + `mode1.safety_floor_response_emitted` + p50/p95 duration); (b) R1 HIGH-2 closed — all 6 SECDEF procedure bodies inlined verbatim (raw lifecycle writer + 3 dashboard read-wrappers + 2 template wrappers) at §4.NEW8a-f rather than carried by reference; (c) R1 MED-1 closed — §8.1 preflight DO block + class A (RBAC role enumeration) + class B (jwt_migration seed) + class F (security_invoker) + class G.2 (recursive role-membership) + class L (view-owner attribute) + class N (audit completeness tripwire) + class O (SECDEF dependency rejection) + class P (admin view grant-matrix allowlist) inlined verbatim with executable SQL rather than prose references. Previously DRAFT 2026-05-22 — pending Codex adversarial-review cycle on spec branch `spec/p042-cdm-si023-landing`. Per the established post-P-029 SI-spec-first promotion pattern, SI-023's canonical content lands in CDM + AUDIT_EVENTS + OpenAPI + State Machines + RBAC via this separate amendment cycle following SI-023's R17 APPROVE ratification at P-041 (2026-05-22).
**Authoring date:** 2026-05-22
**Trigger:** Promotion Ledger P-041 (SI-023 Admin Backend Basics Slice v1.0 RATIFIED 2026-05-22 via Codex R17 ship-it APPROVE; Registry v2.27 → v2.28; **5th and FINAL pilot-required Ghana revenue anchor slice — telecheck-app pilot implementation gate opens fully**). **NINTH instance** of the post-P-029 SI-spec-first promotion pattern (P-029, P-032, P-034, P-036, P-038, P-040; P-035 was SI-only, P-037 was followed by P-038 as its CDM follow-on; this P-042 is the 7th follow-on amendment in the post-P-029 lineage; per Master Completion Plan v1.0 §A.5, post-P-042 the pilot scope is fully spec-ratified, and remaining work is `telecheck-app` code implementation rather than specification authoring).
**Owner:** Admin Backend slice owner + Tenant Operator UX lead + Forms-Intake slice owner + Platform Audit owner + CDM owner + AUDIT_EVENTS owner + OpenAPI owner + State Machines owner + RBAC owner.
**Parent SI:** SI-023 v1.0 RATIFIED (`Telecheck_SI_023_Admin_Backend_Basics_v1_0.md`); P-041 is the ratification authority for this amendment.
**Companion documents:** P-031 (SI-024.1 v0.8 JWT-binding canonical trust anchor); P-027 (Contracts Pack v5.3 + I-035 + IDEMPOTENCY contract baseline); P-040 (most-recent prior CDM follow-on amendment — SI-022 Crisis Response; canonical 11-phase cutover shape + classes A-M + class K CTAS provenance event trigger pattern REUSED by SI-023); P-038 (SI-020 Async-Consult; canonical raw-writer + wrapper-owner pattern); P-036 (Mode 1 Conversational Floor; canonical Mode 1 reader-role isolation discipline reused at SI-023 Surface 3); P-034 (SI-019 MedInteractionSignal; canonical SECDEF + locked-search_path + composite tenant-scoped FK pattern); P-032 (Async-Consult schema baseline; canonical `jwt_migration_entity_status` seeding pattern reused); P-029 (SI-spec-first promotion lineage origin).
**Companion invariants:** I-019 (crisis-detection-always-on platform-floor; preserved unchanged); I-023 (multi-tenant isolation; preserved unchanged); I-026 (KMS encryption discipline; not invoked by SI-023 — admin entities have no PHI columns at the platform-floor; preserved unchanged); I-027 (audit append-only; preserved unchanged); I-032 (per-tenant grant-matrix discipline; reused via §8.1 class P new); I-035 (append-only invariant for ratification + audit-bound state machines; canonical pattern at §4.NEW3 lifecycle transitions); FLOOR-020 (Cat A fail-closed audit emission discipline; canonical pattern at SI-023 dashboard SECDEF wrappers).

---

## 1. Purpose + scope

Mechanical consolidation of SI-023 v1.0 RATIFIED (P-041) canonical content into named bundle file sections. NINTH instance of the established post-P-029 SI-spec-first promotion pattern. **5th and FINAL pilot-required Ghana revenue anchor slice landing** — post-P-042 the pilot scope is fully spec-ratified.

**In scope:**

1. **CDM v1.10 → v1.11:** +4 new active entities (`admin_dashboard_query_execution`, `forms_template_admin_review`, `forms_template_admin_review_lifecycle_transition`, `admin_template_decision_idempotency_key`) + 3 OPTIONAL canonical views (`admin_crisis_operational_health_v`, `admin_consult_queue_health_v`, `admin_mode1_volume_health_v` — all `security_invoker=true + security_barrier=true`, tenant-scoped via `current_tenant_id_strict`) + **6 SECURITY DEFINER procedures owned by 6 distinct owner roles**: (1) raw lifecycle writer `record_forms_template_admin_review_transition()` owned by `forms_template_admin_review_transition_writer_owner`; (2)–(4) three dashboard read-wrappers `read_admin_crisis_operational_health()`, `read_admin_consult_queue_health()`, `read_admin_mode1_volume_health()` owned by their respective per-surface wrapper-owner roles; (5)–(6) two template wrappers `submit_forms_template_for_admin_review()` and `record_forms_template_admin_decision()` owned by `forms_template_admin_review_submit_wrapper_owner` and `forms_template_admin_review_decision_wrapper_owner` respectively. Continuing CDM numbering from v1.10's 99 active entities + 8 derived views + 1 optional MV; v1.11 target: **103 active entities + 11 derived views + 1 optional MV**.

2. **AUDIT_EVENTS v5.12 → v5.13:** +6 new action IDs under `admin.*` namespace per SI-023 v1.0 §3 normative table. **Authoritative per-row category labels: 4 Cat A + 0 Cat B + 2 Cat C** (see §4 of this amendment for the full per-row table). Cat A: `admin.dashboard_query_executed`, `admin.template_submitted_for_review`, `admin.template_review_decision`, `admin.template_published_via_review_workflow`. Cat C: `admin.dashboard_query_audit_completeness_violation`, `admin.template_review_anti_bypass_violation`.

3. **OpenAPI v0.5 → v0.6:** +5 new endpoints under `/v1/admin/*` per SI-023 §5 normative endpoint list: 3 dashboard GETs (crisis-operational-health, consult-queue-health, mode1-volume-health) + 2 template review POSTs (submit-for-review, decision).

4. **State Machines v1.4 → v1.5:** +1 new state machine `forms_template_admin_review_lifecycle` described as DERIVED from append-only `forms_template_admin_review_lifecycle_transition` rows per I-035; CHECK constraint enumerates the **5 allowed (from_state, to_state, transition_reason) triples** per SI-023 §6 normative table (1 initial-submission + 3 decision triples + 1 revision-resubmission cycle-back).

5. **RBAC v1.4 → v1.5:** +11 new role definitions matching SI-023 §7 + §8.1 class A + §8.2 Phase 1. Application roles (2): `admin_basic_operator`, `admin_template_reviewer`. Dashboard-wrapper-owner roles (3): `read_admin_crisis_operational_health_wrapper_owner`, `read_admin_consult_queue_health_wrapper_owner`, `read_admin_mode1_volume_health_wrapper_owner`. Template-wrapper-owner roles (2): `forms_template_admin_review_submit_wrapper_owner`, `forms_template_admin_review_decision_wrapper_owner`. Raw-writer-owner role (1): `forms_template_admin_review_transition_writer_owner`. View-owner roles (3): `admin_crisis_operational_health_view_owner`, `admin_consult_queue_health_view_owner`, `admin_mode1_volume_health_view_owner`.

6. **`jwt_migration_entity_status` seed scope:** **7 entries** (4 RLS-bearing admin_* tables + 3 derived views: admin_crisis_operational_health_v, admin_consult_queue_health_v, admin_mode1_volume_health_v) with `phase_4_cutover_eligible=FALSE` + `raw_guc_fallback_audited=TRUE` defaults per established post-P-032 seeding pattern.

**Out of scope:**

- SI-023 implementation in `telecheck-app` code repo (Phase A foundation; per Master Completion Plan v1.0 §A.5 the pilot implementation gate opens post-P-042).
- Full Admin Backend v1.1 endpoint scope (ecom backend / inventory / pricing / discount codes / affiliate / conversion dashboards / AI-assisted operator features / multi-tenant management surface / Forms-Intake visual builder UI — all deferred to the post-pilot Admin Backend full-implementation cycle).
- INVARIANTS bump (no new platform-floor invariants from SI-023; all closures align with I-019 + I-023 + I-026 + I-027 + I-032 v5.3 + I-035 + FLOOR-020).
- Brand-structure or country-conditional cascade (admin entities are tenant-internal; no consumer DBA / country-of-care branching at the schema layer).

---

## 2. New CDM entities (4 active + 3 OPTIONAL derived views)

All 4 net-new active entities are **tenant-scoped** with composite identity propagation chain: `forms_template_admin_review → forms_template_admin_review_lifecycle_transition` (append-only log; Option A canonical pattern per I-035); `forms_template_admin_review → admin_template_decision_idempotency_key` (IDEMPOTENCY canonical pattern per P-027); `admin_dashboard_query_execution` is a standalone audit-trail entity with no inbound FKs from other admin entities.

**Composite identity propagation chain:** forms_template → forms_template_admin_review (via composite tenant-scoped FK on `(tenant_id, forms_template_id)`); forms_template_admin_review → forms_template_admin_review_lifecycle_transition (via composite tenant-scoped FK on `(tenant_id, review_id)`); forms_template_admin_review → admin_template_decision_idempotency_key (via composite tenant-scoped FK on `(tenant_id, review_id)`); principal → admin_dashboard_query_execution (via composite tenant-scoped FK on `(tenant_id, executor_principal_id)`).

**No KMS encryption (I-026):** None of the 4 SI-023 entities hold patient PHI columns at the schema layer. Dashboard queries capture aggregate counts + non-PHI query_params; template reviews capture submitter/decider principal IDs + non-PHI snapshot of AI guardrail output; lifecycle transitions capture state changes + actor principal IDs + non-PHI transition payloads; idempotency keys capture decisions + non-PHI decision payloads. The PHI exposure surface for admin operators is exclusively via the 3 OPTIONAL views (which read tenant-aggregate counts + non-PHI columns from upstream PHI-bearing entities; the views themselves do NOT have their own PHI columns).

### §4.NEW1 — `admin_dashboard_query_execution` (CDM v1.11 new; SI-023 Sub-decision 3 entity)

Append-only audit-trail entity recording who-viewed-what-when on admin dashboards. Satisfies I-027 audit completeness on admin read paths via co-transactional INSERT inside the canonical SECDEF read-wrappers (Sub-decision 3.5 of SI-023). Lifted from SI-023 §4.NEW1:

```sql
CREATE TABLE admin_dashboard_query_execution (
    id BIGSERIAL PRIMARY KEY,
    tenant_id tenant_id_t NOT NULL,
    executor_principal_id UUID NOT NULL,
    dashboard_name TEXT NOT NULL CHECK (dashboard_name IN (
        'admin_crisis_operational_health_v',
        'admin_consult_queue_health_v',
        'admin_mode1_volume_health_v'
    )),
    query_params_jsonb JSONB NULL,
    row_count INTEGER NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT admin_dashboard_query_principal_tenant_fk
        FOREIGN KEY (tenant_id, executor_principal_id) REFERENCES principal(tenant_id, id)
);

ALTER TABLE admin_dashboard_query_execution ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_dashboard_query_execution FORCE ROW LEVEL SECURITY;
CREATE POLICY admin_dashboard_query_tenant_isolation ON admin_dashboard_query_execution
    USING (tenant_id = current_tenant_id_strict('admin_dashboard_query_execution'));
CREATE TRIGGER admin_dashboard_query_append_only
    BEFORE UPDATE OR DELETE ON admin_dashboard_query_execution
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

CREATE INDEX admin_dashboard_query_tenant_dashboard_time_idx
    ON admin_dashboard_query_execution (tenant_id, dashboard_name, executed_at DESC);
```

### §4.NEW2 — `forms_template_admin_review` (CDM v1.11 new; SI-023 Sub-decision 4 entity)

Review lifecycle entity. Lifted from SI-023 §4.NEW2 (executable DDL with composite tenant-scoped FKs; canonical current_state derived from latest lifecycle_transition row, NOT a stored column on this table; INSERT-only append-only at the schema layer per the BEFORE UPDATE/DELETE append-only trigger):

```sql
CREATE TABLE forms_template_admin_review (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    forms_template_id UUID NOT NULL,
    submitter_principal_id UUID NOT NULL,
    ai_guardrail_snapshot_jsonb JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT forms_template_admin_review_template_tenant_fk
        FOREIGN KEY (tenant_id, forms_template_id) REFERENCES forms_template(tenant_id, id),
    CONSTRAINT forms_template_admin_review_submitter_principal_tenant_fk
        FOREIGN KEY (tenant_id, submitter_principal_id) REFERENCES principal(tenant_id, id),
    CONSTRAINT forms_template_admin_review_tenant_id_unique UNIQUE (tenant_id, review_id)
);

ALTER TABLE forms_template_admin_review ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms_template_admin_review FORCE ROW LEVEL SECURITY;
CREATE POLICY forms_template_admin_review_tenant_isolation ON forms_template_admin_review
    USING (tenant_id = current_tenant_id_strict('forms_template_admin_review'));
CREATE TRIGGER forms_template_admin_review_append_only
    BEFORE UPDATE OR DELETE ON forms_template_admin_review
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

CREATE INDEX forms_template_admin_review_tenant_template_idx
    ON forms_template_admin_review (tenant_id, forms_template_id, created_at DESC);
```

**One-active-review-per-template enforcement (LAYER 1 + LAYER 2):** The `enforce_one_active_review_per_template` BEFORE INSERT trigger function is defined in §4.NEW3 below (after the lifecycle_transition table exists) and attached HERE on this table per SI-023 §4.NEW2/NEW3 R13 HIGH-1 closure. LAYER 1 is the shared parent-template FOR UPDATE serialization point acquired by BOTH the submit and decision SECDEF wrappers; LAYER 2 is the BEFORE INSERT trigger defense-in-depth on this table.

### §4.NEW3 — `forms_template_admin_review_lifecycle_transition` (CDM v1.11 new; append-only Option A per I-035)

Append-only lifecycle log. Lifted from SI-023 §4.NEW3 (executable DDL + CHECK constraint enumerating the 5 transition triples + unified `forms_template_admin_review_lifecycle_invariants()` SECURITY INVOKER trigger function covering 3 invariants — future-date bounded by 5s clock skew + backdate rejected + state-continuity — under a single advisory lock + READ COMMITTED isolation precondition; matches SI-023 R12/R13/R14/R15/R16 closure cascade for unified lifecycle invariants trigger).

```sql
CREATE TABLE forms_template_admin_review_lifecycle_transition (
    id BIGSERIAL PRIMARY KEY,
    tenant_id tenant_id_t NOT NULL,
    review_id UUID NOT NULL,
    from_state TEXT NOT NULL CHECK (from_state IN (
        'none', 'pending_review', 'approved', 'rejected', 'revision_requested'
    )),
    to_state TEXT NOT NULL CHECK (to_state IN (
        'pending_review', 'approved', 'rejected', 'revision_requested'
    )),
    transition_reason TEXT NOT NULL CHECK (transition_reason IN (
        'initial_submission',
        'clinician_decision_approve',
        'clinician_decision_reject',
        'clinician_decision_request_revision',
        'revision_resubmission'
    )),
    transition_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor_principal_id UUID NOT NULL,
    transition_payload JSONB NULL,
    -- 5 allowed (from_state, to_state, transition_reason) triples per §6 + SI-023 §6:
    CONSTRAINT forms_template_admin_review_lifecycle_valid_transition CHECK (
        (from_state = 'none' AND to_state = 'pending_review' AND transition_reason = 'initial_submission')
        OR (from_state = 'pending_review' AND to_state = 'approved' AND transition_reason = 'clinician_decision_approve')
        OR (from_state = 'pending_review' AND to_state = 'rejected' AND transition_reason = 'clinician_decision_reject')
        OR (from_state = 'pending_review' AND to_state = 'revision_requested' AND transition_reason = 'clinician_decision_request_revision')
        OR (from_state = 'revision_requested' AND to_state = 'pending_review' AND transition_reason = 'revision_resubmission')
    ),
    CONSTRAINT forms_template_admin_review_lifecycle_review_tenant_fk
        FOREIGN KEY (tenant_id, review_id) REFERENCES forms_template_admin_review(tenant_id, review_id)
);

ALTER TABLE forms_template_admin_review_lifecycle_transition ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms_template_admin_review_lifecycle_transition FORCE ROW LEVEL SECURITY;
CREATE POLICY forms_template_admin_review_lifecycle_tenant_isolation
    ON forms_template_admin_review_lifecycle_transition
    USING (tenant_id = current_tenant_id_strict('forms_template_admin_review_lifecycle_transition'));
CREATE TRIGGER forms_template_admin_review_lifecycle_append_only
    BEFORE UPDATE OR DELETE ON forms_template_admin_review_lifecycle_transition
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

CREATE INDEX forms_template_admin_review_lifecycle_review_transition_idx
    ON forms_template_admin_review_lifecycle_transition (tenant_id, review_id, transition_at DESC, id DESC);
```

**Unified lifecycle-invariants trigger function** (SECURITY INVOKER + locked search_path + advisory lock + READ COMMITTED precondition + 3 invariants under a single lock window; lifted from SI-023 §4.NEW3 R16 HIGH-1 closure unified design):

```sql
CREATE OR REPLACE FUNCTION forms_template_admin_review_lifecycle_invariants()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_lock_key BIGINT;
    v_max_prior_transition_at TIMESTAMPTZ;
    v_latest_to_state TEXT;
    v_max_clock_skew INTERVAL := INTERVAL '5 seconds';
BEGIN
    IF current_setting('transaction_isolation') NOT IN ('read committed', 'read uncommitted') THEN
        RAISE EXCEPTION 'forms-template-admin-review-lifecycle-isolation-violation: this code path MUST run under READ COMMITTED; current isolation is %; SI-023 wrappers + raw writer assume canonical PostgreSQL default isolation', current_setting('transaction_isolation')
            USING ERRCODE = '0B000';  -- invalid_transaction_initiation
    END IF;

    v_lock_key := ('x' || substr(md5(NEW.tenant_id::text || ':' || NEW.review_id::text), 1, 16))::bit(64)::bigint;
    PERFORM pg_advisory_xact_lock(v_lock_key);

    IF NEW.transition_at > now() + v_max_clock_skew THEN
        RAISE EXCEPTION 'forms-template-admin-review-lifecycle-future-dated: NEW.transition_at (%) > now() + 5s clock-skew tolerance (%)',
            NEW.transition_at, now() + v_max_clock_skew
            USING ERRCODE = '22008';  -- datetime_field_overflow
    END IF;

    SELECT MAX(transition_at) INTO v_max_prior_transition_at
      FROM public.forms_template_admin_review_lifecycle_transition
     WHERE tenant_id = NEW.tenant_id AND review_id = NEW.review_id;
    IF v_max_prior_transition_at IS NOT NULL
       AND NEW.transition_at < v_max_prior_transition_at THEN
        RAISE EXCEPTION 'forms-template-admin-review-lifecycle-backdated: NEW.transition_at (%) is before MAX(prior.transition_at) (%) for review %',
            NEW.transition_at, v_max_prior_transition_at, NEW.review_id
            USING ERRCODE = '22008';
    END IF;

    SELECT to_state INTO v_latest_to_state
      FROM public.forms_template_admin_review_lifecycle_transition
     WHERE tenant_id = NEW.tenant_id AND review_id = NEW.review_id
     ORDER BY transition_at DESC, id DESC
     LIMIT 1;

    IF v_latest_to_state IS NULL THEN
        IF NEW.from_state <> 'none' THEN
            RAISE EXCEPTION 'forms-template-admin-review-lifecycle-bad-initial-state: NEW.from_state=% but no prior rows exist for review %; first transition MUST have from_state=none',
                NEW.from_state, NEW.review_id
                USING ERRCODE = '23514';  -- check_violation
        END IF;
    ELSE
        IF NEW.from_state IS DISTINCT FROM v_latest_to_state THEN
            RAISE EXCEPTION 'forms-template-admin-review-lifecycle-state-continuity-violation: NEW.from_state=% but current latest to_state=% for review %',
                NEW.from_state, v_latest_to_state, NEW.review_id
                USING ERRCODE = '23514';  -- check_violation
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

ALTER FUNCTION forms_template_admin_review_lifecycle_invariants() OWNER TO cdm_owner;

CREATE TRIGGER forms_template_admin_review_lifecycle_invariants_trigger
    BEFORE INSERT ON forms_template_admin_review_lifecycle_transition
    FOR EACH ROW
    EXECUTE FUNCTION forms_template_admin_review_lifecycle_invariants();
```

**One-active-review-per-template defense-in-depth trigger** (BEFORE INSERT trigger on forms_template_admin_review attached HERE after the lifecycle_transition table exists; LATERAL-derived latest-state check; LAYER 2 defense-in-depth; matches SI-023 §4.NEW3 R13 HIGH-1 relocation):

```sql
CREATE OR REPLACE FUNCTION enforce_one_active_review_per_template()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_existing_active_review_id UUID;
BEGIN
    SELECT ftar.review_id INTO v_existing_active_review_id
      FROM public.forms_template_admin_review ftar
      JOIN LATERAL (
          SELECT to_state
            FROM public.forms_template_admin_review_lifecycle_transition lt
           WHERE lt.tenant_id = ftar.tenant_id AND lt.review_id = ftar.review_id
           ORDER BY lt.transition_at DESC, lt.id DESC
           LIMIT 1
      ) latest ON TRUE
     WHERE ftar.tenant_id = NEW.tenant_id
       AND ftar.forms_template_id = NEW.forms_template_id
       AND latest.to_state IN ('pending_review', 'revision_requested')
       AND ftar.review_id IS DISTINCT FROM NEW.review_id;
    IF FOUND THEN
        RAISE EXCEPTION 'admin-template-review-duplicate-active: template % already has an active admin review %', NEW.forms_template_id, v_existing_active_review_id
            USING ERRCODE = '23505';  -- unique_violation
    END IF;
    RETURN NEW;
END;
$$;
ALTER FUNCTION enforce_one_active_review_per_template() OWNER TO cdm_owner;

CREATE TRIGGER forms_template_admin_review_one_active_check
    BEFORE INSERT ON forms_template_admin_review
    FOR EACH ROW EXECUTE FUNCTION enforce_one_active_review_per_template();
```

### §4.NEW4 — `admin_template_decision_idempotency_key` (CDM v1.11 new; canonical IDEMPOTENCY contract per P-027)

Idempotency-key entity backing the `record_forms_template_admin_decision` wrapper retry-safety contract. Lifted from SI-023 §4.NEW4 (NOT NULL idempotency_key + UNIQUE constraint per-(tenant_id, review_id, idempotency_key); wrapper signature MUST declare `p_idempotency_key TEXT NOT NULL` (no DEFAULT NULL); API endpoint MUST reject calls without `Idempotency-Key` HTTP header (400 Bad Request); double-layered prevents NULL-key retries entirely):

```sql
CREATE TABLE admin_template_decision_idempotency_key (
    id BIGSERIAL PRIMARY KEY,
    tenant_id tenant_id_t NOT NULL,
    review_id UUID NOT NULL,
    idempotency_key TEXT NOT NULL,
    decision TEXT NOT NULL CHECK (decision IN ('approve', 'reject', 'request_revision')),
    decision_payload_jsonb JSONB NULL,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    decider_principal_id UUID NOT NULL,
    CONSTRAINT admin_template_decision_idempotency_review_tenant_fk
        FOREIGN KEY (tenant_id, review_id) REFERENCES forms_template_admin_review(tenant_id, review_id),
    CONSTRAINT admin_template_decision_idempotency_principal_tenant_fk
        FOREIGN KEY (tenant_id, decider_principal_id) REFERENCES principal(tenant_id, id),
    CONSTRAINT admin_template_decision_idempotency_uk
        UNIQUE (tenant_id, review_id, idempotency_key)
);

ALTER TABLE admin_template_decision_idempotency_key ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_template_decision_idempotency_key FORCE ROW LEVEL SECURITY;
CREATE POLICY admin_template_decision_idempotency_tenant_isolation ON admin_template_decision_idempotency_key
    USING (tenant_id = current_tenant_id_strict('admin_template_decision_idempotency_key'));
CREATE TRIGGER admin_template_decision_idempotency_append_only
    BEFORE UPDATE OR DELETE ON admin_template_decision_idempotency_key
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

CREATE INDEX admin_template_decision_idempotency_review_idx
    ON admin_template_decision_idempotency_key (tenant_id, review_id, decided_at DESC);
```

### §4.NEW5 — `admin_crisis_operational_health_v` (CDM v1.11 new derived view; tenant-scoped staff-summary reader)

Tenant-scoped view aggregating canonical crisis-domain entities (P-027 §4.66-4.68 + P-040 §4.NEW1-3). `security_invoker=true + security_barrier=true`. SELECT REVOKEd FROM PUBLIC + GRANTed ONLY to `read_admin_crisis_operational_health_wrapper_owner` per §7 + §8.1 class P. Lifted from SI-023 Sub-decision 2 Surface 1:

```sql
CREATE VIEW admin_crisis_operational_health_v
WITH (security_invoker = true, security_barrier = true)
AS
SELECT
    ce.tenant_id,
    ce.severity,
    COUNT(*) FILTER (WHERE celt.to_state IN ('detected', 'escalated', 'acknowledged', 'responded')) AS active_event_count,
    COUNT(*) FILTER (WHERE nceo.undeliverable_deadline < now()) AS escalation_obligation_backlog_count,
    COUNT(*) FILTER (WHERE cse.completed_at IS NULL AND cse.claim_expires_at < now()) AS stale_sweep_count,
    AVG(CASE
        WHEN nceo.tier = 'care_team' THEN 1
        WHEN nceo.tier = 'clinical_on_call' THEN 2
        WHEN nceo.tier = 'regulatory' THEN 3
        ELSE NULL END
    )::NUMERIC(3,2) AS active_obligation_avg_tier,
    COUNT(DISTINCT ae.id) FILTER (WHERE ae.action_id LIKE 'crisis.%' AND ae.recorded_at > now() - INTERVAL '24 hours') AS crisis_audit_24h_count
FROM public.crisis_event ce
LEFT JOIN LATERAL (
    SELECT to_state FROM public.crisis_event_lifecycle_transition
    WHERE tenant_id = ce.tenant_id AND crisis_event_id = ce.id
    ORDER BY transition_at DESC, id DESC LIMIT 1
) celt ON TRUE
LEFT JOIN public.notification_crisis_escalation_obligation nceo
    ON nceo.tenant_id = ce.tenant_id AND nceo.crisis_event_id = ce.id
LEFT JOIN public.crisis_sweep_execution cse
    ON cse.tenant_id = ce.tenant_id AND cse.crisis_event_id = ce.id
LEFT JOIN public.audit_event ae
    ON ae.tenant_id = ce.tenant_id
WHERE ce.tenant_id = current_tenant_id_strict('admin_crisis_operational_health_v')
GROUP BY ce.tenant_id, ce.severity;
```

### §4.NEW6 — `admin_consult_queue_health_v` (CDM v1.11 new derived view; tenant-scoped consult-queue-summary reader)

Tenant-scoped view over P-038 `consult` + `consult_lifecycle_transition` + `consult_review_claim` entities. `security_invoker=true + security_barrier=true`. SELECT REVOKEd FROM PUBLIC + GRANTed ONLY to `read_admin_consult_queue_health_wrapper_owner` per §7 + §8.1 class P. Lifted from SI-023 Sub-decision 2 Surface 2:

```sql
CREATE VIEW admin_consult_queue_health_v
WITH (security_invoker = true, security_barrier = true)
AS
SELECT
    c.tenant_id,
    c.program_id,
    clt.to_state AS current_state,
    COUNT(*) AS consult_count,
    AVG(EXTRACT(EPOCH FROM (crc.claim_at - c.created_at)))::NUMERIC(10,2) AS avg_time_to_first_claim_seconds,
    COUNT(*) FILTER (WHERE crc.claim_expires_at < now() AND crc.released_at IS NULL) AS orphan_claim_backlog_count,
    COUNT(DISTINCT ae.id) FILTER (WHERE ae.action_id LIKE 'async_consult.%' AND ae.recorded_at > now() - INTERVAL '24 hours') AS async_consult_audit_24h_count
FROM public.consult c
LEFT JOIN LATERAL (
    SELECT to_state FROM public.consult_lifecycle_transition
    WHERE tenant_id = c.tenant_id AND consult_id = c.id
    ORDER BY transition_at DESC, id DESC LIMIT 1
) clt ON TRUE
LEFT JOIN public.consult_review_claim crc
    ON crc.tenant_id = c.tenant_id AND crc.consult_id = c.id
LEFT JOIN public.audit_event ae
    ON ae.tenant_id = c.tenant_id
WHERE c.tenant_id = current_tenant_id_strict('admin_consult_queue_health_v')
GROUP BY c.tenant_id, c.program_id, clt.to_state;
```

### §4.NEW7 — `admin_mode1_volume_health_v` (CDM v1.11 new derived view; tenant-scoped Mode 1 volume + safety-floor reader; R1 HIGH-2 + R2 HIGH-1 closure; P-042 R1 HIGH-1 closure 2026-05-22 — reconciled view contract to match SI-023 Surface 3 exactly)

Tenant-scoped view over P-036 `ai_mode1_conversation` + P-035 FLOOR-020 audit emissions. **P-042 R1 HIGH-1 closure 2026-05-22:** v0.1 had drifted from SI-023 Sub-decision 2 Surface 3 contract — used 30-day hourly buckets + unqualified `crisis_detection_trigger` + broad `ai_mode1.%` audit counting + omitted `mode1.safety_floor_response_emitted` AND omitted p50/p95 duration. SI-023 Surface 3 normative contract is: **last-24h aggregate** (NOT 30-day hourly) + **explicit `mode1.crisis_detection_trigger` Cat A audit count** + **explicit `mode1.safety_floor_response_emitted` Cat A audit count** + **tenant-scoped p50/p95 conversation duration**. View reconciled to canonical Surface 3 columns. Minimized columns (aggregate counts + Cat A emission counts + duration percentiles; NO raw conversation_text exposed; NO patient_id exposure beyond aggregate counts). `security_invoker=true + security_barrier=true`. SELECT REVOKEd FROM PUBLIC + GRANTed ONLY to `read_admin_mode1_volume_health_wrapper_owner` per §6 + §8.1 class P. admin_basic_operator is NOT made member of ai_mode1_reader (R1 HIGH-2 closure preserved):

```sql
CREATE VIEW admin_mode1_volume_health_v
WITH (security_invoker = true, security_barrier = true)
AS
SELECT
    amc.tenant_id,
    COUNT(*) FILTER (WHERE amc.created_at > now() - INTERVAL '24 hours') AS active_conversation_count_24h,
    (
        SELECT COUNT(*)
          FROM public.audit_event ae
         WHERE ae.tenant_id = amc.tenant_id
           AND ae.action_id = 'mode1.crisis_detection_trigger'
           AND ae.recorded_at > now() - INTERVAL '24 hours'
    ) AS crisis_detection_trigger_count_24h,
    (
        SELECT COUNT(*)
          FROM public.audit_event ae
         WHERE ae.tenant_id = amc.tenant_id
           AND ae.action_id = 'mode1.safety_floor_response_emitted'
           AND ae.recorded_at > now() - INTERVAL '24 hours'
    ) AS safety_floor_response_emitted_count_24h,
    percentile_cont(0.50) WITHIN GROUP (
        ORDER BY EXTRACT(EPOCH FROM (amc.ended_at - amc.created_at))
    ) FILTER (WHERE amc.ended_at IS NOT NULL
              AND amc.created_at > now() - INTERVAL '24 hours')::NUMERIC(10,2)
    AS conversation_duration_p50_seconds_24h,
    percentile_cont(0.95) WITHIN GROUP (
        ORDER BY EXTRACT(EPOCH FROM (amc.ended_at - amc.created_at))
    ) FILTER (WHERE amc.ended_at IS NOT NULL
              AND amc.created_at > now() - INTERVAL '24 hours')::NUMERIC(10,2)
    AS conversation_duration_p95_seconds_24h
FROM public.ai_mode1_conversation amc
WHERE amc.tenant_id = current_tenant_id_strict('admin_mode1_volume_health_v')
GROUP BY amc.tenant_id;
```

### §4.NEW8 — SECURITY DEFINER procedures (6 procedures owned by 6 distinct owner roles; P-042 R1 HIGH-2 closure 2026-05-22 — full executable DDL inlined verbatim from SI-023 Sub-decisions 3.5 + 4 + 4.5; prior v0.1 carried procedures by reference, which regressed from the P-040 pattern + left the amendment without self-contained deployable wrapper text)

All 6 procedures are SECURITY DEFINER + locked search_path (`SET search_path = pg_catalog, public`) + schema-qualified + REVOKE EXECUTE FROM PUBLIC; ownership set per §6 RBAC; EXECUTE granted per the canonical 3-layer authorization defense (LAYER A EXECUTE grant + LAYER B JWT-principal-to-role join via `tenant_account_membership` per P-038 R6 dissolution pattern + LAYER C tenant scope from SI-024.1 `verify_session_jwt_and_extract_claims`). Cutover Phase 7 (§8 below) deploys all 6 procedures after the views are created in Phase 6.

#### §4.NEW8a — Raw lifecycle writer `record_forms_template_admin_review_transition()` (Sub-decision 4.5)

```sql
CREATE OR REPLACE FUNCTION record_forms_template_admin_review_transition(
    p_tenant_id tenant_id_t,
    p_review_id UUID,
    p_from_state TEXT,
    p_to_state TEXT,
    p_transition_reason TEXT,
    p_actor_principal_id UUID,
    p_transition_payload JSONB
) RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_transition_id BIGINT;
BEGIN
    -- CHECK constraint at §4.NEW3 enforces the 5 valid triples; the unified lifecycle-invariants
    -- trigger (also at §4.NEW3) enforces non-backdated transition_at + state-continuity + isolation
    -- precondition. This raw writer is the SOLE INSERT path into the lifecycle_transition table;
    -- EXECUTE granted to the 2 template wrapper-owner roles only (anti-bypass).
    INSERT INTO public.forms_template_admin_review_lifecycle_transition (
        tenant_id, review_id, from_state, to_state, transition_reason,
        transition_at, actor_principal_id, transition_payload
    ) VALUES (
        p_tenant_id, p_review_id, p_from_state, p_to_state, p_transition_reason,
        now(), p_actor_principal_id, p_transition_payload
    )
    RETURNING id INTO v_transition_id;
    RETURN v_transition_id;
END;
$$;

ALTER FUNCTION record_forms_template_admin_review_transition(
    tenant_id_t, UUID, TEXT, TEXT, TEXT, UUID, JSONB
) OWNER TO forms_template_admin_review_transition_writer_owner;

REVOKE EXECUTE ON FUNCTION record_forms_template_admin_review_transition(
    tenant_id_t, UUID, TEXT, TEXT, TEXT, UUID, JSONB
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION record_forms_template_admin_review_transition(
    tenant_id_t, UUID, TEXT, TEXT, TEXT, UUID, JSONB
) TO forms_template_admin_review_submit_wrapper_owner,
     forms_template_admin_review_decision_wrapper_owner;
```

#### §4.NEW8b — Dashboard read-wrapper `read_admin_crisis_operational_health()` (Sub-decision 3.5)

```sql
CREATE OR REPLACE FUNCTION read_admin_crisis_operational_health(
    p_tenant_id tenant_id_t,
    p_query_params_jsonb JSONB
) RETURNS TABLE (
    tenant_id tenant_id_t,
    severity TEXT,
    active_event_count BIGINT,
    escalation_obligation_backlog_count BIGINT,
    stale_sweep_count BIGINT,
    active_obligation_avg_tier NUMERIC,
    crisis_audit_24h_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_row_count INTEGER;
BEGIN
    -- LAYER A (EXECUTE grant; primary DB privilege boundary; admin_basic_operator only)
    -- LAYER B (JWT-principal-to-role check via tenant_account_membership; P-038 R6 dissolution pattern)
    -- LAYER C (tenant scope match against verify_session_jwt_and_extract_claims)
    PERFORM 1
      FROM verify_session_jwt_and_extract_claims() vc
      JOIN tenant_account_membership tam
        ON tam.tenant_id = vc.verified_tenant_id
       AND tam.principal_id = vc.verified_principal_id
     WHERE vc.verified_tenant_id = p_tenant_id
       AND tam.active = TRUE
       AND 'admin_basic_operator' = ANY(tam.assigned_role_names);
    IF NOT FOUND THEN
        RAISE EXCEPTION 'admin-dashboard-unauthorized: JWT principal % does NOT hold admin_basic_operator for tenant % OR JWT tenant binding mismatch', (SELECT verified_principal_id FROM verify_session_jwt_and_extract_claims()), p_tenant_id
            USING ERRCODE = '42501';
    END IF;

    -- Read the view + capture row count (atomic with audit emission below; FLOOR-020 fail-closed)
    CREATE TEMP TABLE _admin_crisis_query_result ON COMMIT DROP AS
        SELECT * FROM admin_crisis_operational_health_v
        WHERE tenant_id = p_tenant_id;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;

    -- Insert audit row + emit Cat A audit event in same transaction
    INSERT INTO admin_dashboard_query_execution
        (tenant_id, executor_principal_id, dashboard_name, query_params_jsonb, row_count)
    SELECT p_tenant_id, vc.verified_principal_id, 'admin_crisis_operational_health_v',
           p_query_params_jsonb, v_row_count
    FROM verify_session_jwt_and_extract_claims() vc;

    PERFORM emit_audit_event_co_transactional(
        p_tenant_id,
        'admin.dashboard_query_executed',
        jsonb_build_object(
            'dashboard_name', 'admin_crisis_operational_health_v',
            'row_count', v_row_count,
            'query_params', p_query_params_jsonb
        )
    );

    RETURN QUERY SELECT * FROM _admin_crisis_query_result;
END;
$$;

ALTER FUNCTION read_admin_crisis_operational_health(tenant_id_t, JSONB)
    OWNER TO read_admin_crisis_operational_health_wrapper_owner;
REVOKE EXECUTE ON FUNCTION read_admin_crisis_operational_health(tenant_id_t, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION read_admin_crisis_operational_health(tenant_id_t, JSONB)
    TO admin_basic_operator;
```

#### §4.NEW8c — Dashboard read-wrapper `read_admin_consult_queue_health()` (Sub-decision 3.5)

```sql
CREATE OR REPLACE FUNCTION read_admin_consult_queue_health(
    p_tenant_id tenant_id_t,
    p_query_params_jsonb JSONB
) RETURNS TABLE (
    tenant_id tenant_id_t,
    program_id UUID,
    current_state TEXT,
    consult_count BIGINT,
    avg_time_to_first_claim_seconds NUMERIC,
    orphan_claim_backlog_count BIGINT,
    async_consult_audit_24h_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_row_count INTEGER;
BEGIN
    PERFORM 1
      FROM verify_session_jwt_and_extract_claims() vc
      JOIN tenant_account_membership tam
        ON tam.tenant_id = vc.verified_tenant_id
       AND tam.principal_id = vc.verified_principal_id
     WHERE vc.verified_tenant_id = p_tenant_id
       AND tam.active = TRUE
       AND 'admin_basic_operator' = ANY(tam.assigned_role_names);
    IF NOT FOUND THEN
        RAISE EXCEPTION 'admin-dashboard-unauthorized: JWT principal % does NOT hold admin_basic_operator for tenant % OR JWT tenant binding mismatch', (SELECT verified_principal_id FROM verify_session_jwt_and_extract_claims()), p_tenant_id
            USING ERRCODE = '42501';
    END IF;

    CREATE TEMP TABLE _admin_consult_query_result ON COMMIT DROP AS
        SELECT * FROM admin_consult_queue_health_v
        WHERE tenant_id = p_tenant_id;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;

    INSERT INTO admin_dashboard_query_execution
        (tenant_id, executor_principal_id, dashboard_name, query_params_jsonb, row_count)
    SELECT p_tenant_id, vc.verified_principal_id, 'admin_consult_queue_health_v',
           p_query_params_jsonb, v_row_count
    FROM verify_session_jwt_and_extract_claims() vc;

    PERFORM emit_audit_event_co_transactional(
        p_tenant_id,
        'admin.dashboard_query_executed',
        jsonb_build_object(
            'dashboard_name', 'admin_consult_queue_health_v',
            'row_count', v_row_count,
            'query_params', p_query_params_jsonb
        )
    );

    RETURN QUERY SELECT * FROM _admin_consult_query_result;
END;
$$;

ALTER FUNCTION read_admin_consult_queue_health(tenant_id_t, JSONB)
    OWNER TO read_admin_consult_queue_health_wrapper_owner;
REVOKE EXECUTE ON FUNCTION read_admin_consult_queue_health(tenant_id_t, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION read_admin_consult_queue_health(tenant_id_t, JSONB)
    TO admin_basic_operator;
```

#### §4.NEW8d — Dashboard read-wrapper `read_admin_mode1_volume_health()` (Sub-decision 3.5)

```sql
CREATE OR REPLACE FUNCTION read_admin_mode1_volume_health(
    p_tenant_id tenant_id_t,
    p_query_params_jsonb JSONB
) RETURNS TABLE (
    tenant_id tenant_id_t,
    active_conversation_count_24h BIGINT,
    crisis_detection_trigger_count_24h BIGINT,
    safety_floor_response_emitted_count_24h BIGINT,
    conversation_duration_p50_seconds_24h NUMERIC,
    conversation_duration_p95_seconds_24h NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_row_count INTEGER;
BEGIN
    PERFORM 1
      FROM verify_session_jwt_and_extract_claims() vc
      JOIN tenant_account_membership tam
        ON tam.tenant_id = vc.verified_tenant_id
       AND tam.principal_id = vc.verified_principal_id
     WHERE vc.verified_tenant_id = p_tenant_id
       AND tam.active = TRUE
       AND 'admin_basic_operator' = ANY(tam.assigned_role_names);
    IF NOT FOUND THEN
        RAISE EXCEPTION 'admin-dashboard-unauthorized: JWT principal % does NOT hold admin_basic_operator for tenant % OR JWT tenant binding mismatch', (SELECT verified_principal_id FROM verify_session_jwt_and_extract_claims()), p_tenant_id
            USING ERRCODE = '42501';
    END IF;

    CREATE TEMP TABLE _admin_mode1_query_result ON COMMIT DROP AS
        SELECT * FROM admin_mode1_volume_health_v
        WHERE tenant_id = p_tenant_id;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;

    INSERT INTO admin_dashboard_query_execution
        (tenant_id, executor_principal_id, dashboard_name, query_params_jsonb, row_count)
    SELECT p_tenant_id, vc.verified_principal_id, 'admin_mode1_volume_health_v',
           p_query_params_jsonb, v_row_count
    FROM verify_session_jwt_and_extract_claims() vc;

    PERFORM emit_audit_event_co_transactional(
        p_tenant_id,
        'admin.dashboard_query_executed',
        jsonb_build_object(
            'dashboard_name', 'admin_mode1_volume_health_v',
            'row_count', v_row_count,
            'query_params', p_query_params_jsonb
        )
    );

    RETURN QUERY SELECT * FROM _admin_mode1_query_result;
END;
$$;

ALTER FUNCTION read_admin_mode1_volume_health(tenant_id_t, JSONB)
    OWNER TO read_admin_mode1_volume_health_wrapper_owner;
REVOKE EXECUTE ON FUNCTION read_admin_mode1_volume_health(tenant_id_t, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION read_admin_mode1_volume_health(tenant_id_t, JSONB)
    TO admin_basic_operator;
```

#### §4.NEW8e — Template submit wrapper `submit_forms_template_for_admin_review()` (Sub-decision 4; R7+R8+R11 closure pattern preserved)

```sql
CREATE OR REPLACE FUNCTION submit_forms_template_for_admin_review(
    p_tenant_id tenant_id_t,
    p_template_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_review_id UUID;
    v_submitter_principal_id UUID;
    v_existing_revision_requested_review_id UUID;
BEGIN
    -- LAYER A+B+C authorization
    PERFORM 1
      FROM verify_session_jwt_and_extract_claims() vc
      JOIN tenant_account_membership tam
        ON tam.tenant_id = vc.verified_tenant_id
       AND tam.principal_id = vc.verified_principal_id
     WHERE vc.verified_tenant_id = p_tenant_id
       AND tam.active = TRUE
       AND 'admin_basic_operator' = ANY(tam.assigned_role_names);
    IF NOT FOUND THEN
        RAISE EXCEPTION 'admin-template-submit-unauthorized: JWT principal does NOT hold admin_basic_operator for tenant %', p_tenant_id
            USING ERRCODE = '42501';
    END IF;

    SELECT verified_principal_id INTO v_submitter_principal_id
      FROM verify_session_jwt_and_extract_claims();

    -- R8 HIGH-1: shared parent-template FOR UPDATE serialization point
    PERFORM 1 FROM forms_template
     WHERE tenant_id = p_tenant_id AND id = p_template_id
       FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'admin-template-submit-template-not-found: forms_template id % not found for tenant %', p_template_id, p_tenant_id
            USING ERRCODE = '02000';
    END IF;

    -- R7 HIGH-1: derive existing in-flight revision_requested review (if any) under lock
    SELECT ftar.review_id INTO v_existing_revision_requested_review_id
      FROM forms_template_admin_review ftar
      JOIN LATERAL (
          SELECT to_state
            FROM forms_template_admin_review_lifecycle_transition lt
           WHERE lt.tenant_id = ftar.tenant_id AND lt.review_id = ftar.review_id
           ORDER BY lt.transition_at DESC, lt.id DESC
           LIMIT 1
      ) latest ON TRUE
     WHERE ftar.tenant_id = p_tenant_id
       AND ftar.forms_template_id = p_template_id
       AND latest.to_state = 'revision_requested'
       FOR UPDATE OF ftar;

    IF v_existing_revision_requested_review_id IS NOT NULL THEN
        -- REVISION RESUBMISSION PATH (triple #5)
        v_review_id := v_existing_revision_requested_review_id;
        PERFORM record_forms_template_admin_review_transition(
            p_tenant_id, v_review_id,
            'revision_requested', 'pending_review', 'revision_resubmission',
            v_submitter_principal_id, NULL
        );
    ELSE
        -- INITIAL SUBMISSION PATH (triple #1)
        PERFORM 1
          FROM forms_template_admin_review ftar
          JOIN LATERAL (
              SELECT to_state
                FROM forms_template_admin_review_lifecycle_transition lt
               WHERE lt.tenant_id = ftar.tenant_id AND lt.review_id = ftar.review_id
               ORDER BY lt.transition_at DESC, lt.id DESC
               LIMIT 1
          ) latest ON TRUE
         WHERE ftar.tenant_id = p_tenant_id
           AND ftar.forms_template_id = p_template_id
           AND latest.to_state IN ('pending_review', 'revision_requested');
        IF FOUND THEN
            RAISE EXCEPTION 'admin-template-submit-already-in-flight: template % already has an in-flight admin review; resolve or cancel it before re-submitting', p_template_id
                USING ERRCODE = '40001';
        END IF;

        INSERT INTO forms_template_admin_review
            (tenant_id, forms_template_id, submitter_principal_id, ai_guardrail_snapshot_jsonb)
        SELECT p_tenant_id, p_template_id, v_submitter_principal_id, ai_guardrail_snapshot_jsonb
          FROM forms_template ft
          WHERE ft.tenant_id = p_tenant_id AND ft.id = p_template_id
        RETURNING review_id INTO v_review_id;

        PERFORM record_forms_template_admin_review_transition(
            p_tenant_id, v_review_id,
            'none', 'pending_review', 'initial_submission',
            v_submitter_principal_id, NULL
        );
    END IF;

    PERFORM emit_audit_event_co_transactional(
        p_tenant_id, 'admin.template_submitted_for_review',
        jsonb_build_object('review_id', v_review_id, 'forms_template_id', p_template_id,
                           'submitter_principal_id', v_submitter_principal_id,
                           'path', CASE WHEN v_existing_revision_requested_review_id IS NOT NULL
                                        THEN 'revision_resubmission' ELSE 'initial_submission' END)
    );

    RETURN v_review_id;
END;
$$;

ALTER FUNCTION submit_forms_template_for_admin_review(tenant_id_t, UUID)
    OWNER TO forms_template_admin_review_submit_wrapper_owner;
REVOKE EXECUTE ON FUNCTION submit_forms_template_for_admin_review(tenant_id_t, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_forms_template_for_admin_review(tenant_id_t, UUID)
    TO admin_basic_operator;
```

#### §4.NEW8f — Template decision wrapper `record_forms_template_admin_decision()` (Sub-decision 4; R1 HIGH-3 + R2 MED-1 + R11 + R13 HIGH-2 closure pattern preserved)

```sql
CREATE OR REPLACE FUNCTION record_forms_template_admin_decision(
    p_tenant_id tenant_id_t,
    p_review_id UUID,
    p_decision TEXT,
    p_decision_payload JSONB,
    p_idempotency_key TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_decider_principal_id UUID;
    v_existing_decision TEXT;
    v_latest_state TEXT;
    v_review_forms_template_id UUID;
BEGIN
    IF p_decision NOT IN ('approve', 'reject', 'request_revision') THEN
        RAISE EXCEPTION 'admin-template-decision-invalid-decision-value: % is not a valid decision', p_decision
            USING ERRCODE = '22023';
    END IF;

    IF p_idempotency_key IS NULL THEN
        RAISE EXCEPTION 'admin-template-decision-null-idempotency-key: p_idempotency_key MUST be non-null per R2 MED-1 IDEMPOTENCY contract'
            USING ERRCODE = '23502';
    END IF;

    -- LAYER A+B+C authorization (admin_template_reviewer)
    PERFORM 1
      FROM verify_session_jwt_and_extract_claims() vc
      JOIN tenant_account_membership tam
        ON tam.tenant_id = vc.verified_tenant_id
       AND tam.principal_id = vc.verified_principal_id
     WHERE vc.verified_tenant_id = p_tenant_id
       AND tam.active = TRUE
       AND 'admin_template_reviewer' = ANY(tam.assigned_role_names);
    IF NOT FOUND THEN
        RAISE EXCEPTION 'admin-template-decision-unauthorized: JWT principal does NOT hold admin_template_reviewer for tenant %', p_tenant_id
            USING ERRCODE = '42501';
    END IF;

    SELECT verified_principal_id INTO v_decider_principal_id
      FROM verify_session_jwt_and_extract_claims();

    -- R11 HIGH-1: shared parent-template serialization point. Step 0 read template_id without lock;
    -- Step 1 parent forms_template FOR UPDATE (matches submit wrapper); Step 2 review row FOR UPDATE
    -- under parent lock. Consistent template→review acquisition order prevents deadlock.
    SELECT forms_template_id INTO v_review_forms_template_id
      FROM forms_template_admin_review
     WHERE tenant_id = p_tenant_id AND review_id = p_review_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'admin-template-decision-review-not-found: review_id % not found for tenant %', p_review_id, p_tenant_id
            USING ERRCODE = '02000';
    END IF;

    PERFORM 1 FROM forms_template
     WHERE tenant_id = p_tenant_id AND id = v_review_forms_template_id
       FOR UPDATE;

    PERFORM 1 FROM forms_template_admin_review
     WHERE tenant_id = p_tenant_id AND review_id = p_review_id
       FOR UPDATE;

    -- R2 MED-1 idempotency check (under lock)
    SELECT decision INTO v_existing_decision
      FROM admin_template_decision_idempotency_key
     WHERE tenant_id = p_tenant_id AND review_id = p_review_id AND idempotency_key = p_idempotency_key;
    IF FOUND THEN
        IF v_existing_decision = p_decision THEN
            RETURN;  -- idempotent replay
        ELSE
            RAISE EXCEPTION 'idempotency-key-decision-mismatch: existing key has decision=% but request has decision=%; not safe to retry', v_existing_decision, p_decision
                USING ERRCODE = '40001';
        END IF;
    END IF;

    -- R1 HIGH-3 latest-state derivation under lock
    SELECT to_state INTO v_latest_state
      FROM forms_template_admin_review_lifecycle_transition
     WHERE tenant_id = p_tenant_id AND review_id = p_review_id
     ORDER BY transition_at DESC, id DESC
     LIMIT 1;
    IF v_latest_state IS DISTINCT FROM 'pending_review' THEN
        RAISE EXCEPTION 'admin-template-decision-non-pending-latest-state: latest state is %; only pending_review accepts decision', COALESCE(v_latest_state, '<NULL/no-transitions>')
            USING ERRCODE = '40001';
    END IF;

    PERFORM record_forms_template_admin_review_transition(
        p_tenant_id, p_review_id,
        'pending_review',
        CASE p_decision
            WHEN 'approve' THEN 'approved'
            WHEN 'reject' THEN 'rejected'
            WHEN 'request_revision' THEN 'revision_requested'
        END,
        CASE p_decision
            WHEN 'approve' THEN 'clinician_decision_approve'
            WHEN 'reject' THEN 'clinician_decision_reject'
            WHEN 'request_revision' THEN 'clinician_decision_request_revision'
        END,
        v_decider_principal_id, p_decision_payload
    );

    IF p_decision = 'approve' THEN
        UPDATE forms_template SET status = 'published'
         WHERE tenant_id = p_tenant_id AND id = v_review_forms_template_id;
        PERFORM emit_audit_event_co_transactional(
            p_tenant_id, 'admin.template_published_via_review_workflow',
            jsonb_build_object('review_id', p_review_id, 'forms_template_id', v_review_forms_template_id,
                               'decider_principal_id', v_decider_principal_id)
        );
    END IF;

    -- R13 HIGH-2: explicit unique_violation handler for concurrent same-key race
    BEGIN
        INSERT INTO admin_template_decision_idempotency_key
            (tenant_id, review_id, idempotency_key, decision, decision_payload_jsonb, decider_principal_id)
        VALUES
            (p_tenant_id, p_review_id, p_idempotency_key, p_decision, p_decision_payload, v_decider_principal_id);
    EXCEPTION
        WHEN unique_violation THEN
            SELECT decision INTO v_existing_decision
              FROM admin_template_decision_idempotency_key
             WHERE tenant_id = p_tenant_id AND review_id = p_review_id
               AND idempotency_key = p_idempotency_key;
            IF v_existing_decision = p_decision THEN
                RAISE EXCEPTION 'admin-template-decision-concurrent-same-key-retry-safe: concurrent identical-key call already committed decision %; retry on the client side', v_existing_decision
                    USING ERRCODE = '40001';
            ELSE
                RAISE EXCEPTION 'idempotency-key-decision-mismatch: concurrent call committed decision % but this request had decision %', v_existing_decision, p_decision
                    USING ERRCODE = '40001';
            END IF;
    END;

    PERFORM emit_audit_event_co_transactional(
        p_tenant_id, 'admin.template_review_decision',
        jsonb_build_object('review_id', p_review_id, 'decision', p_decision,
                           'decider_principal_id', v_decider_principal_id,
                           'forms_template_id', v_review_forms_template_id)
    );
END;
$$;

ALTER FUNCTION record_forms_template_admin_decision(tenant_id_t, UUID, TEXT, JSONB, TEXT)
    OWNER TO forms_template_admin_review_decision_wrapper_owner;
REVOKE EXECUTE ON FUNCTION record_forms_template_admin_decision(tenant_id_t, UUID, TEXT, JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_forms_template_admin_decision(tenant_id_t, UUID, TEXT, JSONB, TEXT)
    TO admin_template_reviewer;
```

---

## 3. New audit events (6 = 4 Cat A + 2 Cat C)

Canonical AUDIT_EVENTS contribution under `admin.*` namespace per SI-023 v1.0 §3 normative table. Lifted verbatim:

| # | action_id | Category | Triggered by | Payload schema | Sampling |
|---|---|---|---|---|---|
| 1 | `admin.dashboard_query_executed` | Cat A | SI-023 Sub-decision 3.5 SECDEF read-wrappers (read_admin_crisis_operational_health / read_admin_consult_queue_health / read_admin_mode1_volume_health); emitted co-transactionally with admin_dashboard_query_execution INSERT per FLOOR-020 fail-closed | `{dashboard_name TEXT, row_count INTEGER, query_params JSONB}` | 100% (no sampling — Cat A audit) |
| 2 | `admin.template_submitted_for_review` | Cat A | SI-023 Sub-decision 4 submit_forms_template_for_admin_review wrapper; emitted in same tx as forms_template_admin_review INSERT + initial lifecycle_transition | `{review_id UUID, forms_template_id UUID, submitter_principal_id UUID}` | 100% |
| 3 | `admin.template_review_decision` | Cat A | SI-023 Sub-decision 4 record_forms_template_admin_decision wrapper; emitted in same tx as lifecycle transition INSERT + idempotency_key INSERT | `{review_id UUID, decision TEXT, decider_principal_id UUID, forms_template_id UUID}` | 100% |
| 4 | `admin.template_published_via_review_workflow` | Cat A | SI-023 Sub-decision 4 record_forms_template_admin_decision wrapper IFF p_decision='approve'; emitted in same tx as forms_template.status UPDATE | `{review_id UUID, forms_template_id UUID, decider_principal_id UUID}` | 100% |
| 5 | `admin.dashboard_query_audit_completeness_violation` | Cat C | §8.1 preflight class N tripwire when count of admin_dashboard_query_execution rows over 24h window != count of distinct dashboard-endpoint requests over same period | `{window_start TIMESTAMPTZ, window_end TIMESTAMPTZ, expected_count INTEGER, actual_count INTEGER, drift INTEGER}` | 100% (Cat C tripwire) |
| 6 | `admin.template_review_anti_bypass_violation` | Cat C | §8.1 preflight class O tripwire when a SECDEF routine references forms_template_admin_review entities outside the canonical wrapper allowlist | `{routine_name TEXT, routine_owner TEXT, referenced_entity TEXT}` | 100% |

**Cat A vs Cat C distinction:** Cat A events are part of the canonical operational audit trail and emitted at every legitimate occurrence (admin dashboard read + every template review action). Cat C events are tripwires for database-integrity defects detected at preflight time + should never fire under canonical operation (drift = 0 expected).

Total: **6 net-new action IDs** (4 Cat A + 0 Cat B + 2 Cat C). Bundle AUDIT_EVENTS bumps v5.12 → v5.13.

---

## 4. New OpenAPI endpoints (5 net-new under `/v1/admin/*`)

Lifted from SI-023 §5 normative endpoint list:

1. `GET /v1/admin/dashboards/crisis-operational-health` — calls `read_admin_crisis_operational_health` SECDEF wrapper reading `admin_crisis_operational_health_v`; requires admin_basic_operator role at LAYER B; emits `admin.dashboard_query_executed` Cat A audit co-transactionally with admin_dashboard_query_execution INSERT
2. `GET /v1/admin/dashboards/consult-queue-health` — calls `read_admin_consult_queue_health` SECDEF wrapper reading `admin_consult_queue_health_v`; same role + audit pattern
3. `GET /v1/admin/dashboards/mode1-volume-health` — calls `read_admin_mode1_volume_health` SECDEF wrapper reading `admin_mode1_volume_health_v`; same role + audit pattern (R2 HIGH-2 closure 2026-05-22 — canonical wrapper-only path matching surfaces 1+2; no in-process aggregation from ai_mode1_conversation; admin_basic_operator does NOT have read access to ai_mode1_conversation per R1 HIGH-2 + SI-023 Sub-decision 1)
4. `POST /v1/admin/templates/{template_id}/submit-for-review` — calls `submit_forms_template_for_admin_review` wrapper; requires admin_basic_operator role ONLY at LAYER B (R6 HIGH-3 closure 2026-05-22; builder-role direct-submit deferred to post-pilot Admin Backend v1.1); emits `admin.template_submitted_for_review` Cat A audit + creates forms_template_admin_review row + initial `none → pending_review` lifecycle_transition row co-transactionally; requires `Idempotency-Key` HTTP header
5. `POST /v1/admin/template-reviews/{review_id}/decision` — calls `record_forms_template_admin_decision` wrapper; requires admin_template_reviewer role at LAYER B; emits `admin.template_review_decision` Cat A + conditional `admin.template_published_via_review_workflow` Cat A (IFF p_decision='approve') + creates lifecycle_transition row + idempotency_key row co-transactionally; requires `Idempotency-Key` HTTP header (NOT NULL per R2 MED-1 + §4.NEW4 closure)

OpenAPI bumps v0.5 → v0.6.

---

## 5. New state machine `forms_template_admin_review_lifecycle` (5 states + 5 transition triples)

DERIVED from append-only `forms_template_admin_review_lifecycle_transition` rows per I-035. 5 states (`none` / `pending_review` / `approved` / `rejected` / `revision_requested`). 5 transition triples enforced by §4.NEW3 CHECK constraint:

| # | from_state | to_state | transition_reason | Source-of-truth scenario |
|---|---|---|---|---|
| 1 | `none` | `pending_review` | `initial_submission` | initial submit_forms_template_for_admin_review wrapper call |
| 2 | `pending_review` | `approved` | `clinician_decision_approve` | record_forms_template_admin_decision with decision='approve' — canonical publish path |
| 3 | `pending_review` | `rejected` | `clinician_decision_reject` | record_forms_template_admin_decision with decision='reject' — terminal-rejected |
| 4 | `pending_review` | `revision_requested` | `clinician_decision_request_revision` | record_forms_template_admin_decision with decision='request_revision' — cycles back via re-submission |
| 5 | `revision_requested` | `pending_review` | `revision_resubmission` | builder UI re-submits revised template via submit_forms_template_for_admin_review (revises existing review_id; no new review row created) |

**Terminal states + onward-transition discipline (lifted from SI-023 §6):**
- `approved` is **terminal-positive** (canonical-published; any subsequent change requires a NEW review cycle with a new review_id)
- `rejected` is **terminal-negative** (will not be published; any subsequent change requires a new review cycle)
- `revision_requested` is a **non-terminal cycle state** (cycles back via triple #5)
- `pending_review` is the **active reviewer-blocking state** (only transitions out via triples #2/#3/#4)

State Machines bumps v1.4 → v1.5.

---

## 6. New RBAC roles (11 net-new)

Lifted from SI-023 §7 normative role enumeration (2 application + 3 dashboard-wrapper-owner + 2 template-wrapper-owner + 1 raw-writer-owner + 3 view-owner):

| # | Role | Class | Granted to | Holds |
|---|---|---|---|---|
| 1 | `admin_basic_operator` | application | tenant operator staff with dashboard-monitoring responsibility | EXECUTE on the 3 dashboard SECDEF read-wrappers |
| 2 | `admin_template_reviewer` | application | tenant operator staff with template-review responsibility | EXECUTE on the 2 template wrappers; SELECT on forms_template_admin_review (own tenant's pending reviews) |
| 3 | `read_admin_crisis_operational_health_wrapper_owner` | dashboard-wrapper-owner | n/a (non-BYPASSRLS NOLOGIN) | OWNS `read_admin_crisis_operational_health()`; SOLE role with SELECT on `admin_crisis_operational_health_v` |
| 4 | `read_admin_consult_queue_health_wrapper_owner` | dashboard-wrapper-owner | n/a (non-BYPASSRLS NOLOGIN) | OWNS `read_admin_consult_queue_health()`; SOLE role with SELECT on `admin_consult_queue_health_v` |
| 5 | `read_admin_mode1_volume_health_wrapper_owner` | dashboard-wrapper-owner | n/a (non-BYPASSRLS NOLOGIN) | OWNS `read_admin_mode1_volume_health()`; SOLE role with SELECT on `admin_mode1_volume_health_v` |
| 6 | `forms_template_admin_review_submit_wrapper_owner` | template-wrapper-owner | n/a (non-BYPASSRLS NOLOGIN) | OWNS `submit_forms_template_for_admin_review()` |
| 7 | `forms_template_admin_review_decision_wrapper_owner` | template-wrapper-owner | n/a (non-BYPASSRLS NOLOGIN) | OWNS `record_forms_template_admin_decision()` |
| 8 | `forms_template_admin_review_transition_writer_owner` | raw-writer-owner | n/a (non-BYPASSRLS NOLOGIN) | OWNS raw `record_forms_template_admin_review_transition()`; EXECUTE granted to EXACTLY the 2 template wrapper-owner roles |
| 9 | `admin_crisis_operational_health_view_owner` | view-owner | n/a (non-BYPASSRLS NOLOGIN) | OWNS `admin_crisis_operational_health_v` |
| 10 | `admin_consult_queue_health_view_owner` | view-owner | n/a (non-BYPASSRLS NOLOGIN) | OWNS `admin_consult_queue_health_v` |
| 11 | `admin_mode1_volume_health_view_owner` | view-owner | n/a (non-BYPASSRLS NOLOGIN) | OWNS `admin_mode1_volume_health_v` |

**Grant matrix invariant (preserved from SI-023 §7 + §3.5 + Sub-decision 6):**
- View → wrapper-owner grant: each of the 3 admin views grants SELECT to EXACTLY ONE wrapper-owner role
- Wrapper → application grant: each of the 3 dashboard read-wrappers grants EXECUTE to EXACTLY `admin_basic_operator`
- Raw writer → template wrapper-owner grant: raw lifecycle-transition writer grants EXECUTE to EXACTLY the 2 template-wrapper-owner roles
- NO admin role holds direct SELECT on any of the 3 admin views (canonical wrapper-only read path)
- §8.1 preflight class P (NEW) enforces this grant-matrix exactly

RBAC bumps v1.4 → v1.5.

---

## 7. `jwt_migration_entity_status` seed scope (7 entries)

Per established post-P-032 seeding pattern, the 4 net-new RLS-bearing tables + 3 derived views are tracked under `jwt_migration_entity_status` with `phase_4_cutover_eligible=FALSE` + `raw_guc_fallback_audited=TRUE` defaults:

| # | entity_name | entity_kind | phase_4_cutover_eligible | raw_guc_fallback_audited |
|---|---|---|---|---|
| 1 | `admin_dashboard_query_execution` | table | FALSE | TRUE |
| 2 | `forms_template_admin_review` | table | FALSE | TRUE |
| 3 | `forms_template_admin_review_lifecycle_transition` | table | FALSE | TRUE |
| 4 | `admin_template_decision_idempotency_key` | table | FALSE | TRUE |
| 5 | `admin_crisis_operational_health_v` | view | FALSE | TRUE |
| 6 | `admin_consult_queue_health_v` | view | FALSE | TRUE |
| 7 | `admin_mode1_volume_health_v` | view | FALSE | TRUE |

---

## 8. Deployment preflight + cutover sequencing (P-042 R1 MED-1 closure 2026-05-22 — preflight DO block + class definitions inlined verbatim from SI-023 §8.1)

### §8.1 Deployment preflight DO block

Reuses the canonical P-040 §8.1 preflight pattern (classes A through M + G.2 + G.3 + H + I + J + K + L) with admin-domain object names added to text-scan regexes. **Three SI-023-specific NEW classes (N + O + P)** are inlined below; remaining classes A-M reused from P-040 with the admin entity additions noted.

**Class A — Verify the 11 net-new RBAC roles exist** (lifted verbatim from SI-023 §8.1 class A; explicit role enumeration rather than stale numeric count):

```sql
DO $$
DECLARE
    v_role_missing TEXT;
BEGIN
    FOR v_role_missing IN
        SELECT unnest(ARRAY[
            -- Application roles (2)
            'admin_basic_operator', 'admin_template_reviewer',
            -- Dashboard-wrapper-owner roles (3)
            'read_admin_crisis_operational_health_wrapper_owner',
            'read_admin_consult_queue_health_wrapper_owner',
            'read_admin_mode1_volume_health_wrapper_owner',
            -- Template-wrapper-owner roles (2)
            'forms_template_admin_review_submit_wrapper_owner',
            'forms_template_admin_review_decision_wrapper_owner',
            -- Raw-writer-owner role (1)
            'forms_template_admin_review_transition_writer_owner',
            -- View-owner roles (3)
            'admin_crisis_operational_health_view_owner',
            'admin_consult_queue_health_view_owner',
            'admin_mode1_volume_health_view_owner'
        ])
        EXCEPT SELECT rolname FROM pg_roles
    LOOP
        RAISE EXCEPTION 'si-023-rbac-role-missing: %', v_role_missing;
    END LOOP;
END $$;
```

**Class B — jwt_migration_entity_status seed scope = 7 entries** (4 RLS-bearing tables + 3 derived views; phase_4_cutover_eligible=FALSE + raw_guc_fallback_audited=TRUE):

```sql
DO $$
DECLARE
    v_missing_entity TEXT;
BEGIN
    FOR v_missing_entity IN
        SELECT unnest(ARRAY[
            'admin_dashboard_query_execution',
            'forms_template_admin_review',
            'forms_template_admin_review_lifecycle_transition',
            'admin_template_decision_idempotency_key',
            'admin_crisis_operational_health_v',
            'admin_consult_queue_health_v',
            'admin_mode1_volume_health_v'
        ])
        EXCEPT SELECT entity_name FROM jwt_migration_entity_status
              WHERE phase_4_cutover_eligible = FALSE
                AND raw_guc_fallback_audited = TRUE
    LOOP
        RAISE EXCEPTION 'si-023-jwt-migration-seed-missing: % (expected phase_4_cutover_eligible=FALSE + raw_guc_fallback_audited=TRUE)', v_missing_entity;
    END LOOP;
END $$;
```

**Class C/D/E — Tenant config seed parts A/B/C** (reused from P-040; no SI-023-specific overrides; tenant.admin.* CCR keys deferred to v1.1 per SI-023 OQ4 — for v1.0 the admin slice does not introduce new tenant config rows).

**Class E0a/b/c — Legacy-row migration coverage** (vacuous for SI-023 greenfield deploy; no pre-existing admin_* rows; preflight passes trivially on day-0 cutover).

**Class F — View security_invoker=true on the 3 admin views**:

```sql
DO $$
DECLARE
    v_view_missing_security_invoker TEXT;
BEGIN
    FOR v_view_missing_security_invoker IN
        SELECT c.relname
          FROM pg_class c
         WHERE c.relname IN ('admin_crisis_operational_health_v',
                             'admin_consult_queue_health_v',
                             'admin_mode1_volume_health_v')
           AND c.relkind = 'v'
           AND NOT (c.reloptions @> ARRAY['security_invoker=true'])
    LOOP
        RAISE EXCEPTION 'si-023-view-missing-security-invoker: %', v_view_missing_security_invoker;
    END LOOP;
END $$;
```

**Class G.1 — View-grant allowlist** (subsumed by class P below with broader admin-specific scope; classical class G.1 from P-040 applied to crisis views remains in effect under its P-040 scope).

**Class G.2 — Recursive role-membership closure for the 2 admin application roles** (no role outside the canonical pair `admin_basic_operator` + `admin_template_reviewer` may be an effective member of either reader role through pg_auth_members recursion):

```sql
DO $$
DECLARE
    v_violator TEXT;
BEGIN
    FOR v_violator IN
        WITH RECURSIVE effective_members AS (
            SELECT m.member, r.rolname AS reader_role
              FROM pg_auth_members m
              JOIN pg_roles r ON r.oid = m.roleid
             WHERE r.rolname IN ('admin_basic_operator', 'admin_template_reviewer')
            UNION ALL
            SELECT m.member, em.reader_role
              FROM pg_auth_members m
              JOIN effective_members em ON em.member = m.roleid
        )
        SELECT pg_roles.rolname || ' (effective member of ' || em.reader_role || ')'
          FROM effective_members em
          JOIN pg_roles ON pg_roles.oid = em.member
         WHERE pg_roles.rolname NOT IN (
             -- canonical end-user grantees set; tenant operator staff principals would be
             -- assigned via tenant_account_membership joined to verify_session_jwt_and_extract_claims
             -- rather than direct DB role membership, so this list is intentionally minimal
             'admin_basic_operator', 'admin_template_reviewer'
         )
    LOOP
        RAISE EXCEPTION 'si-023-admin-role-membership-violator: %', v_violator;
    END LOOP;
END $$;
```

**Class G.3 — Grant-option / admin-option rejection** (reused from P-040; no GRANT OPTION on SELECT grants for any admin view + no ADMIN OPTION on the 2 admin application roles).

**Class H — pg_read_all_data + BYPASSRLS check** (reused from P-040; admin views inherit the same canonical break-glass-admin allowlist; application runtime roles MUST NOT hold either).

**Class I — SECDEF pg_depend on admin views** (subsumed by class O below with broader scope covering admin review entities; classical class I from P-040 applied to crisis views remains in effect).

**Class J — SECDEF prosrc text-scan** (reused from P-040 with admin-domain object names added to the regex: `admin_crisis_operational_health_v|admin_consult_queue_health_v|admin_mode1_volume_health_v|forms_template_admin_review|forms_template_admin_review_lifecycle_transition|admin_template_decision_idempotency_key|admin_dashboard_query_execution`; rejects any SECDEF routine outside the class O allowlist that statically references any of these objects).

**Class K — Derived-relation (CTAS / MV) rejection** (reused from P-040 §8.1 class K + Phase 7.1 event trigger `crisis_view_ctas_provenance_block`; admin views become new dependents in class K allowlist — admin views and admin review entities cannot be the source of any non-allowlisted CREATE TABLE AS / SELECT INTO / CREATE MATERIALIZED VIEW DDL except via canonical break-glass-admin roles).

**Class L — View-owner relowner + non-BYPASSRLS attribute** (reused from P-040; applied to the 3 admin view owners — each owns EXACTLY its respective view; each is NOLOGIN + non-BYPASSRLS):

```sql
DO $$
DECLARE
    v_view_record RECORD;
BEGIN
    FOR v_view_record IN
        VALUES
            ('admin_crisis_operational_health_v', 'admin_crisis_operational_health_view_owner'),
            ('admin_consult_queue_health_v', 'admin_consult_queue_health_view_owner'),
            ('admin_mode1_volume_health_v', 'admin_mode1_volume_health_view_owner')
    LOOP
        PERFORM 1
          FROM pg_class c
          JOIN pg_roles r ON r.oid = c.relowner
         WHERE c.relname = v_view_record.column1
           AND r.rolname = v_view_record.column2
           AND r.rolcanlogin = FALSE
           AND r.rolbypassrls = FALSE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'si-023-view-owner-violation: % expected owner % (NOLOGIN + non-BYPASSRLS)',
                v_view_record.column1, v_view_record.column2;
        END IF;
    END LOOP;
END $$;
```

**Class M — View-definition integrity text scan** (reused from P-040 pattern; verifies each admin view body references `current_tenant_id_strict('<view_name>')` predicate; positive assertion: view body MUST contain the canonical tenant-scope predicate fragment).

**Class N — Admin dashboard audit completeness tripwire** (0% tolerance per SI-023 OQ5; canonical preflight-input view `admin_dashboard_request_log_v` populated from APM logs):

```sql
DO $$
DECLARE
    v_drift INTEGER;
    v_expected_count INTEGER;
    v_actual_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_expected_count
      FROM admin_dashboard_request_log_v
     WHERE request_at > now() - INTERVAL '24 hours';
    SELECT COUNT(*) INTO v_actual_count
      FROM admin_dashboard_query_execution
     WHERE executed_at > now() - INTERVAL '24 hours';
    v_drift := v_expected_count - v_actual_count;
    IF v_drift <> 0 THEN
        PERFORM emit_audit_event_co_transactional(
            current_tenant_id_strict('preflight_admin_dashboard_audit_completeness'),
            'admin.dashboard_query_audit_completeness_violation',
            jsonb_build_object(
                'window_start', now() - INTERVAL '24 hours',
                'window_end', now(),
                'expected_count', v_expected_count,
                'actual_count', v_actual_count,
                'drift', v_drift
            )
        );
        RAISE EXCEPTION 'si-023-admin-dashboard-audit-completeness-violation: 24h drift=% (expected=%, actual=%)',
            v_drift, v_expected_count, v_actual_count;
    END IF;
END $$;
```

**Class O — SECDEF dependency rejection on admin views + forms_template_admin_review entities** (allowlist populated with the 6 canonical SI-023 SECDEF wrappers per SI-023 §8.1 class O table):

```sql
DO $$
DECLARE
    v_violator RECORD;
BEGIN
    -- pg_depend-based check: any SECDEF routine that depends on admin views OR admin review entities
    -- must be on the canonical 6-wrapper allowlist with the expected owner role.
    FOR v_violator IN
        SELECT p.proname AS routine_name,
               o.rolname AS routine_owner,
               c.relname AS referenced_entity
          FROM pg_proc p
          JOIN pg_roles o ON o.oid = p.proowner
          JOIN pg_depend d ON d.objid = p.oid AND d.classid = 'pg_proc'::regclass
          JOIN pg_class c ON c.oid = d.refobjid
                          AND c.relname IN (
                              'admin_crisis_operational_health_v',
                              'admin_consult_queue_health_v',
                              'admin_mode1_volume_health_v',
                              'forms_template_admin_review',
                              'forms_template_admin_review_lifecycle_transition',
                              'admin_template_decision_idempotency_key'
                          )
         WHERE p.prosecdef = TRUE
           AND NOT (
               (p.proname, o.rolname) IN (
                   ('read_admin_crisis_operational_health', 'read_admin_crisis_operational_health_wrapper_owner'),
                   ('read_admin_consult_queue_health', 'read_admin_consult_queue_health_wrapper_owner'),
                   ('read_admin_mode1_volume_health', 'read_admin_mode1_volume_health_wrapper_owner'),
                   ('submit_forms_template_for_admin_review', 'forms_template_admin_review_submit_wrapper_owner'),
                   ('record_forms_template_admin_decision', 'forms_template_admin_review_decision_wrapper_owner'),
                   ('record_forms_template_admin_review_transition', 'forms_template_admin_review_transition_writer_owner')
               )
           )
    LOOP
        PERFORM emit_audit_event_co_transactional(
            current_tenant_id_strict('preflight_admin_secdef_dependency'),
            'admin.template_review_anti_bypass_violation',
            jsonb_build_object(
                'routine_name', v_violator.routine_name,
                'routine_owner', v_violator.routine_owner,
                'referenced_entity', v_violator.referenced_entity
            )
        );
        RAISE EXCEPTION 'si-023-admin-secdef-anti-bypass-violation: routine % (owner=%) references % outside the canonical 6-wrapper allowlist',
            v_violator.routine_name, v_violator.routine_owner, v_violator.referenced_entity;
    END LOOP;
END $$;
```

**Class P — Admin view + dashboard wrapper grant-matrix allowlist** (explicit allowlist over information_schema.role_table_grants; admin_basic_operator MUST NOT hold direct SELECT on any of the 3 admin views; ALL PUBLIC grants REJECTED):

```sql
DO $$
DECLARE
    v_violator RECORD;
BEGIN
    FOR v_violator IN
        SELECT g.table_name, g.grantee
          FROM information_schema.role_table_grants g
         WHERE g.table_name IN ('admin_crisis_operational_health_v',
                                'admin_consult_queue_health_v',
                                'admin_mode1_volume_health_v')
           AND g.privilege_type = 'SELECT'
           AND NOT (
               (g.table_name, g.grantee) IN (
                   ('admin_crisis_operational_health_v', 'read_admin_crisis_operational_health_wrapper_owner'),
                   ('admin_crisis_operational_health_v', 'admin_crisis_operational_health_view_owner'),
                   ('admin_consult_queue_health_v', 'read_admin_consult_queue_health_wrapper_owner'),
                   ('admin_consult_queue_health_v', 'admin_consult_queue_health_view_owner'),
                   ('admin_mode1_volume_health_v', 'read_admin_mode1_volume_health_wrapper_owner'),
                   ('admin_mode1_volume_health_v', 'admin_mode1_volume_health_view_owner')
               )
           )
    LOOP
        RAISE EXCEPTION 'si-023-admin-view-grant-allowlist-violation: view % has SELECT grant to non-canonical role %',
            v_violator.table_name, v_violator.grantee;
    END LOOP;
END $$;
```

### §8.2 Cutover sequencing (11 phases per SI-023 §8.2)

1. **Phase 1 — RBAC + ownership setup:** create the 11 net-new RBAC roles per §6.
2. **Phase 2 — Tables + indexes + triggers:** execute §4.NEW1 → NEW2 → NEW3 → NEW4 DDL blocks in dependency order (each block creates table + RLS + append-only trigger + invariant triggers + indexes inline).
3. **Phase 3 — Backfill:** vacuous for greenfield deploy (no pre-existing rows in any of the 4 admin tables).
4. **Phase 4 — (REMOVED per SI-023 R10 HIGH-2 closure):** trigger creation consolidated into Phase 2; preserved as empty slot for phase-number alignment with P-040.
5. **Phase 5 — RLS policies:** enabled inline in Phase 2 §4 DDL; class C/D/E preflight assertions evaluate before Phase 10 gate.
6. **Phase 6 — Views FIRST** (per SI-023 R6 HIGH-1 closure — wrapper-only design forces view-before-wrapper deployment): create the 3 admin views with `security_invoker=true + security_barrier=true`; set ownership to corresponding view-owner role; REVOKE ALL FROM PUBLIC; GRANT SELECT ONLY to corresponding dashboard read-wrapper-owner role. Phase 6.1 CTAS provenance event trigger REUSED from P-040 (admin views become new dependents in class K allowlist).
7. **Phase 7 — Procedures:** deploy the 6 SECDEF procedures (1 raw + 3 dashboard read-wrappers + 2 template wrappers) per SI-023 Sub-decisions 3.5 + 4 + 4.5; each SECURITY DEFINER + locked search_path; ownership set per §6; EXECUTE granted per §6 + anti-bypass discipline.
8. **Phase 8 — JWT migration entity seed:** INSERT 7 rows into `jwt_migration_entity_status` per §7 above.
9. **Phase 9 — Audit events registration:** INSERT 6 new `admin.*` action IDs into `audit_events_action_definition` table per AUDIT_EVENTS v5.13 schema.
10. **Phase 10 — Deployment preflight gate:** run §8.1 DO block (classes A-M + N + O + P); any FAILED assertion BLOCKS cutover.
11. **Phase 11 — OpenAPI endpoint deployment:** deploy 5 net-new endpoints under `/v1/admin/*` per §4; verify caller-class role requirement enforced at endpoint layer (defense-in-depth alongside SECDEF wrapper LAYER A+B+C).

**Rollback discipline:** On any Phase N failure during cutover, rollback discards Phase N's changes via transaction context; Phases 1–(N–1) remain. Post-Phase-11 defects close via a fresh hygiene-cycle PR (P-009 v1.10.1 pattern); destructive rollback NOT attempted once Phase 11 has completed.

---

## 9. Cycle log

**v0.2 DRAFT 2026-05-22 — R1 closures applied (2 HIGH + 1 MED):**
- **R1 HIGH-1 closed:** `admin_mode1_volume_health_v` (§4.NEW7) drifted from SI-023 Sub-decision 2 Surface 3 contract — v0.1 used 30-day hourly buckets + unqualified `crisis_detection_trigger` + broad `ai_mode1.%` audit counting AND omitted `mode1.safety_floor_response_emitted` AND p50/p95 conversation duration. Operators would have shipped a dashboard reporting wrong safety-floor signals. Fix: reconciled view to SI-023 canonical Surface 3 columns — `active_conversation_count_24h` + `crisis_detection_trigger_count_24h` (explicit `mode1.` namespace) + `safety_floor_response_emitted_count_24h` + `conversation_duration_p50_seconds_24h` + `conversation_duration_p95_seconds_24h`. Last-24h aggregate (matches Surface 3 normative contract); aggregate counts only (NO raw conversation_text; NO patient_id exposure).
- **R1 HIGH-2 closed:** §4.NEW8 v0.1 carried all 6 SECDEF procedure bodies by reference, regressing from the P-040 inline pattern. Implementers following the amendment would have no self-contained deployable wrapper text + could miss JWT principal role checks, raw-writer grants, or decision retry handling. Fix: inlined full executable DDL for all 6 procedures verbatim at §4.NEW8a (raw lifecycle writer) + §4.NEW8b/c/d (3 dashboard read-wrappers) + §4.NEW8e (submit template wrapper) + §4.NEW8f (decision template wrapper). Each includes SECURITY DEFINER + locked search_path + ownership + REVOKE/GRANT + LAYER A/B/C authorization + audit emission + parent-template locking + idempotency handling per the SI-023 R1-R17 closure cascade.
- **R1 MED-1 closed:** §8.1 preflight non-executable by reference; regression from P-040 explicit + executable preflight pattern. Drift could pass review because the exact role enumeration, grant matrix, SECDEF allowlist, view reloptions, CTAS provenance checks, + seed checks would not be mechanically present in the bundle being promoted. Fix: inlined executable DO blocks for class A (11-role enumeration) + class B (7-entry jwt_migration seed scope) + class F (security_invoker on 3 views) + class G.2 (recursive admin role-membership closure) + class L (view-owner relowner + NOLOGIN + non-BYPASSRLS) + class N (admin dashboard audit completeness tripwire) + class O (SECDEF dependency rejection with 6-wrapper allowlist + expected owner) + class P (admin view grant-matrix allowlist with admin_basic_operator rejection). Remaining classes C/D/E/E0a-c/G.1/G.3/H/I/J/K/M documented with admin-domain entity additions; reused from P-040 with admin entity additions to text-scan regex.

**v0.1 DRAFT 2026-05-22 — Initial authoring:**
- Authored from SI-023 v1.0 RATIFIED canonical content per the established post-P-029 SI-spec-first promotion pattern.
- 4 net-new active CDM entities + 3 OPTIONAL derived views + 6 SECDEF procedures (carried by reference to SI-023 wrapper bodies; full DDL in SI-023 Sub-decisions 3.5 + 4 + 4.5).
- 6 net-new audit events (4 Cat A + 2 Cat C) under `admin.*` namespace.
- 5 net-new OpenAPI endpoints under `/v1/admin/*`.
- 1 new state machine `forms_template_admin_review_lifecycle` with 5 states + 5 transition triples.
- 11 net-new RBAC roles (2 application + 3 dashboard-wrapper-owner + 2 template-wrapper-owner + 1 raw-writer-owner + 3 view-owner).
- 7-entry `jwt_migration_entity_status` seed (4 tables + 3 views).
- 11-phase cutover sequencing reusing P-040 §8.2 shape with admin-domain entity adaptations; preflight DO block reusing classes A-M from P-040 + 3 SI-023-specific NEW classes (N audit completeness + O SECDEF dependency rejection + P admin view grant-matrix allowlist).
- Pending Codex adversarial-review cycle on spec branch `spec/p042-cdm-si023-landing`.
