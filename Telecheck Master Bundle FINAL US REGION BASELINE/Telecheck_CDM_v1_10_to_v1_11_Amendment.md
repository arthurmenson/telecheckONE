# CDM v1.10 → v1.11 + AUDIT_EVENTS v5.12 → v5.13 + OpenAPI v0.5 → v0.6 + State Machines v1.4 → v1.5 + RBAC v1.4 → v1.5 Amendment (SI-023 Admin Backend Basics follow-on)

**Version:** 0.11 DRAFT
**Status:** DRAFT 2026-05-22 — R10 acknowledgement: R10 HIGH-1 = **duplicate-of-R2; rejected at ratifier per Evans's Option A decision 2026-05-22**. Codex R10 re-raised the decision-wrapper idempotency-ordering finding that was ratifier-closed at R2 via the dual-recommendation + two-pass consult ceremony. Per the ratifier decision: the wrapper body remains verbatim from SI-023 v1.0 RATIFIED + the ordering question is closed for the P-042 cycle. Added prominent ratifier-closure banner at §4.NEW8f header to help future Codex passes distinguish the ratified-closed finding from new findings + direct future reviewers to the Track 6 / SI-023 v1.1 hardening path if they want to escalate. Awaiting R11 Codex re-verification on v0.11 with the ratifier-closure banner in place. Previously DRAFT 2026-05-22 — R9 closure applied (1 HIGH within-scope): R8 MED-1 v0.9 instructed Phase 1 to "execute the §4.NEW8g GRANTs immediately after creating the 12 roles" but those GRANTs target tables (Phase 2), views (Phase 6), and the raw writer function (Phase 7) — Phase 1 GRANTs against not-yet-existing relations/functions would fail at runtime, blocking cutover. R9 HIGH-1 closure splits §4.NEW8g grants across the natural cutover phases: Phase 1 = role creation + pre-existing-dependency GRANTs only (`tenant_account_membership` + `verify_session_jwt_and_extract_claims` + `emit_audit_event_co_transactional` from P-027/P-031); Phase 2 = table-level GRANTs after §4.NEW1-4 DDL; Phase 6 = view-level GRANTs + pending-view-owner underlying-table grants + break-glass extension grants after the 4 views are created; Phase 7 = raw-writer EXECUTE GRANT after the raw writer function is created. Class Q preflight (run at Phase 10) verifies the final post-grant state. Awaiting R10 Codex re-verification. Previously DRAFT 2026-05-22 — R8 closures applied (1 HIGH + 1 MED within-scope): R8 HIGH-1 closed (PostgreSQL `SELECT ... FOR UPDATE` requires UPDATE privilege on the locked relation even when no actual UPDATE runs; v0.8 §4.NEW8g grants had SELECT-only on `forms_template` for the submit wrapper-owner and SELECT-only on `forms_template_admin_review` for both wrapper-owners — cutover would have passed class Q but the first submit/decision call would have errored on the FOR UPDATE lock; fix: added UPDATE grants on those tables + extended class Q assertions; append-only triggers prevent actual mutation so UPDATE privilege is structural-only for FOR UPDATE lock acquisition); R8 MED-1 closed (§8.2 Phase 1 said "11 roles" and Phase 10 preflight said "classes A-M + N/O/P" — both stale post-v0.7+v0.8; updated to 12 roles + pending view created in Phase 6 + class Q added to Phase 10 preflight). Awaiting R9 Codex re-verification. Previously DRAFT 2026-05-22 — R7 closures applied (2 HIGH within-scope): R7 HIGH-1 closed (6 SECDEF wrapper-owner roles + pending-view-owner now hold the EXACT least-privilege DML/EXECUTE grants their function bodies require via §4.NEW8g explicit GRANT statements + new §8.1 class Q preflight via has_table_privilege/has_function_privilege assertions; without these grants the wrappers would have failed at runtime with permission_denied because SECURITY DEFINER executes with owner privileges); R7 HIGH-2 closed (new §4.NEW9 `forms_template_admin_review_pending_v` reviewer-scoped pending-only view mechanically enforces SI-023 §7's "pending reviews" prose qualifier; reviewer's SELECT grant redirected from base table to view; +1 net-new RBAC role `forms_template_admin_review_pending_view_owner` brings count to 12; class H allowlist updated to reject reviewer base-table SELECT; positive assertion added that reviewer holds SELECT on pending view). Awaiting R8 Codex re-verification. Previously DRAFT 2026-05-22 — R6 closure applied (1 HIGH within-scope): R5 HIGH-1's class H break-glass allowlist incorrectly rejected `admin_template_reviewer`'s canonical SELECT grant on `forms_template_admin_review` (which SI-023 §7 explicitly grants for "own tenant's pending reviews" — tenant scope enforced by RLS, not additional grant scoping). v0.5-v0.6 would have blocked cutover (preflight rejects reviewer grant) OR stripped reviewers of their documented review-read surface. Fix: class H allowlist updated to honor the per-entity grant contract — `forms_template_admin_review` allowlist now `{admin_template_reviewer, platform_operator_breakglass, submit-wrapper-owner, decision-wrapper-owner}`; `forms_template_admin_review_lifecycle_transition` allowlist remains `{platform_operator_breakglass, transition-writer-owner}` (admin_template_reviewer does NOT have SELECT on lifecycle_transition per SI-023 §7). Positive assertion added: reviewer MUST have the canonical SELECT grant on forms_template_admin_review. Awaiting R7 Codex re-verification. Previously DRAFT 2026-05-22 — R5 closure applied (1 HIGH within-scope): R4 HIGH-1's "operator recovers via SQL console" v0.5 narrative was too thin — admin_basic_operator lacks direct SELECT on admin review entities + no audit emission + no preflight verification. R5 HIGH-1 closure formalizes the lost-response recovery as a concrete operational runbook reusing the canonical P-040 break-glass framework: `platform_operator_breakglass` role + exact canonical SQL + tenant-binding check + audit emission via the existing break-glass framework's `breakglass.*` Cat C audit trail + §8.1 class H preflight extension verifying break-glass SELECT grants on the 2 admin review entities. Preserves SI-023 §3 (6 audit events) + §5 (5 endpoints) verbatim; no new endpoints + no new audit-event action_ids in P-042 + no fork from SI-023. Awaiting R6 Codex re-verification. Previously DRAFT 2026-05-22 — R4 closure applied (1 HIGH within-scope): R3 HIGH-2 retry-semantics recovery narrative pointed at a `GET /v1/admin/template-reviews` lookup endpoint that was NOT defined in §4's 5-endpoint scope (and is not in SI-023 §5 either); R4 HIGH-1 closure rescopes lost-response recovery as operational SQL-console handling for pilot rather than promising an undefined API endpoint; adding a 6th endpoint to P-042 would silently fork from SI-023 RATIFIED. Post-pilot v1.1 hardening path documented (two options: API-driven lookup endpoint OR submit-side idempotency-key; ratifier choice based on observed retry-storm profile). Awaiting R5 Codex re-verification. Previously DRAFT 2026-05-22 — R3 closures applied (2 HIGH; both within-scope, no hard-floor escalation): R3 HIGH-1 closed (3 admin dashboard view bodies rewritten to aggregate each fact source independently via per-tenant scalar/program-keyed CTEs, eliminating the 1:N JOIN-multiplication bug that would have inflated operational counts); R3 HIGH-2 closed (submit endpoint v0.1-v0.3 incorrectly advertised `Idempotency-Key` HTTP header requirement, but the SI-023 canonical submit wrapper does not accept an idempotency key and has no submit-side idempotency table; header requirement removed from endpoint contract; retry semantics documented — lost-response retry on initial-submission returns `admin-template-submit-already-in-flight` 40001, client polls to recover review_id; revision-resubmission path naturally idempotent at wrapper layer; submit-side idempotency support deferred to post-pilot Admin Backend v1.1). Awaiting R4 Codex re-verification. Previously DRAFT 2026-05-22 — R2 hard-floor item 6 escalation **RATIFIER DECISION: Option A** (Evans chat-message ratification 2026-05-22 via dual-recommendation three-way: Claude=A; Codex Pass-1=B+impl-hold; Codex Pass-2=B+impl-hold; ratifier chose Option A despite Codex Pass-1+Pass-2 dissent). Per Option A: P-042 preserves the SI-023 v1.0 RATIFIED Sub-decision 4 `record_forms_template_admin_decision` wrapper body verbatim at §4.NEW8f; Codex R2 architectural-fragility finding documented in §9 cycle log as **rejected at ratifier on the merits** (canonical caller contract — single-transaction call + propagate 40001 → HTTP-layer retry — makes ordering safe; restructuring would silently fork P-042 from SI-023 RATIFIED in violation of CLAUDE.md "do not silently fork"). No wrapper-body changes in v0.3; v0.3 ↔ v0.2 diff = §1 status banner + §9 cycle log entry only. Awaiting R3 Codex re-verification on the ratifier-approved v0.3. Previously DRAFT 2026-05-22 — R1 closures applied (2 HIGH + 1 MED); awaiting R2 Codex re-verification. Post-R1 changes: (a) R1 HIGH-1 closed — admin_mode1_volume_health_v reconciled to SI-023 Sub-decision 2 Surface 3 contract (last-24h aggregate + explicit `mode1.crisis_detection_trigger` + `mode1.safety_floor_response_emitted` + p50/p95 duration); (b) R1 HIGH-2 closed — all 6 SECDEF procedure bodies inlined verbatim (raw lifecycle writer + 3 dashboard read-wrappers + 2 template wrappers) at §4.NEW8a-f rather than carried by reference; (c) R1 MED-1 closed — §8.1 preflight DO block + class A (RBAC role enumeration) + class B (jwt_migration seed) + class F (security_invoker) + class G.2 (recursive role-membership) + class L (view-owner attribute) + class N (audit completeness tripwire) + class O (SECDEF dependency rejection) + class P (admin view grant-matrix allowlist) inlined verbatim with executable SQL rather than prose references. Previously DRAFT 2026-05-22 — pending Codex adversarial-review cycle on spec branch `spec/p042-cdm-si023-landing`. Per the established post-P-029 SI-spec-first promotion pattern, SI-023's canonical content lands in CDM + AUDIT_EVENTS + OpenAPI + State Machines + RBAC via this separate amendment cycle following SI-023's R17 APPROVE ratification at P-041 (2026-05-22).
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

5. **RBAC v1.4 → v1.5:** **+12 net-new role definitions** (P-042 R7 HIGH-2 closure 2026-05-22 — +1 net-new view-owner role for the new `forms_template_admin_review_pending_v` reviewer-scoped read surface). Application roles (2): `admin_basic_operator`, `admin_template_reviewer`. Dashboard-wrapper-owner roles (3): `read_admin_crisis_operational_health_wrapper_owner`, `read_admin_consult_queue_health_wrapper_owner`, `read_admin_mode1_volume_health_wrapper_owner`. Template-wrapper-owner roles (2): `forms_template_admin_review_submit_wrapper_owner`, `forms_template_admin_review_decision_wrapper_owner`. Raw-writer-owner role (1): `forms_template_admin_review_transition_writer_owner`. View-owner roles (4; was 3): `admin_crisis_operational_health_view_owner`, `admin_consult_queue_health_view_owner`, `admin_mode1_volume_health_view_owner`, **`forms_template_admin_review_pending_view_owner`** (NEW at R7 HIGH-2 closure; owns the reviewer-scoped pending-only view).

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

### §4.NEW5 — `admin_crisis_operational_health_v` (CDM v1.11 new derived view; tenant-scoped staff-summary reader; P-042 R3 HIGH-1 closure 2026-05-22 — view body rewritten to aggregate each fact source independently via per-tenant scalar subqueries, eliminating the JOIN-multiplication bug from v0.1-v0.3 that would have inflated counts by N×M×K cardinality)

Tenant-scoped view aggregating canonical crisis-domain entities (P-027 §4.66-4.68 + P-040 §4.NEW1-3). `security_invoker=true + security_barrier=true`. SELECT REVOKEd FROM PUBLIC + GRANTed ONLY to `read_admin_crisis_operational_health_wrapper_owner` per §6 + §8.1 class P. Per-severity rollup; metrics decomposed into independent per-tenant scalar subqueries to avoid 1:N join multiplication corrupting operational counts:

```sql
CREATE VIEW admin_crisis_operational_health_v
WITH (security_invoker = true, security_barrier = true)
AS
WITH tenant_scope AS (
    SELECT current_tenant_id_strict('admin_crisis_operational_health_v') AS tenant_id
),
active_events_by_severity AS (
    SELECT ce.tenant_id, ce.severity,
           COUNT(*) FILTER (WHERE latest.to_state IN ('detected', 'escalated', 'acknowledged', 'responded')) AS active_event_count
      FROM public.crisis_event ce
      JOIN tenant_scope ts ON ts.tenant_id = ce.tenant_id
      LEFT JOIN LATERAL (
          SELECT to_state FROM public.crisis_event_lifecycle_transition
          WHERE tenant_id = ce.tenant_id AND crisis_event_id = ce.id
          ORDER BY transition_at DESC, id DESC LIMIT 1
      ) latest ON TRUE
     GROUP BY ce.tenant_id, ce.severity
),
escalation_backlog AS (
    SELECT nceo.tenant_id, COUNT(*) AS backlog_count, AVG(
        CASE nceo.tier
            WHEN 'care_team' THEN 1
            WHEN 'clinical_on_call' THEN 2
            WHEN 'regulatory' THEN 3
            ELSE NULL END
    )::NUMERIC(3,2) AS avg_tier
      FROM public.notification_crisis_escalation_obligation nceo
      JOIN tenant_scope ts ON ts.tenant_id = nceo.tenant_id
     WHERE nceo.undeliverable_deadline < now()
     GROUP BY nceo.tenant_id
),
stale_sweeps AS (
    SELECT cse.tenant_id, COUNT(*) AS stale_count
      FROM public.crisis_sweep_execution cse
      JOIN tenant_scope ts ON ts.tenant_id = cse.tenant_id
     WHERE cse.completed_at IS NULL AND cse.claim_expires_at < now()
     GROUP BY cse.tenant_id
),
crisis_audit_24h AS (
    SELECT ae.tenant_id, COUNT(*) AS audit_count
      FROM public.audit_event ae
      JOIN tenant_scope ts ON ts.tenant_id = ae.tenant_id
     WHERE ae.action_id LIKE 'crisis.%'
       AND ae.recorded_at > now() - INTERVAL '24 hours'
     GROUP BY ae.tenant_id
)
SELECT
    aes.tenant_id,
    aes.severity,
    aes.active_event_count,
    COALESCE(eb.backlog_count, 0) AS escalation_obligation_backlog_count,
    COALESCE(ss.stale_count, 0) AS stale_sweep_count,
    eb.avg_tier AS active_obligation_avg_tier,
    COALESCE(ca.audit_count, 0) AS crisis_audit_24h_count
FROM active_events_by_severity aes
LEFT JOIN escalation_backlog eb ON eb.tenant_id = aes.tenant_id
LEFT JOIN stale_sweeps ss ON ss.tenant_id = aes.tenant_id
LEFT JOIN crisis_audit_24h ca ON ca.tenant_id = aes.tenant_id;
```

**Aggregation design note:** the CTEs `escalation_backlog`, `stale_sweeps`, `crisis_audit_24h` each aggregate their respective fact source per-tenant FIRST, then join into the per-severity rollup. Because the LEFT JOINs are tenant-keyed (not crisis_event_id-keyed) and the right-hand sides are already aggregated to a single row per tenant, the per-severity counts are NOT multiplied by 1:N child cardinality. Tenant scope is bound by the `tenant_scope` CTE wrapping `current_tenant_id_strict`. The avg_tier is computed at the tenant level (across all backlogged obligations regardless of severity) — this is intentional per the SI-023 Sub-decision 2 Surface 1 metric definition; if a future cycle wants per-severity avg_tier, the CTE can be re-keyed.

### §4.NEW6 — `admin_consult_queue_health_v` (CDM v1.11 new derived view; tenant-scoped consult-queue-summary reader; P-042 R3 HIGH-1 closure 2026-05-22 — view body rewritten to aggregate each fact source independently)

Tenant-scoped view over P-038 `consult` + `consult_lifecycle_transition` + `consult_review_claim` entities. `security_invoker=true + security_barrier=true`. SELECT REVOKEd FROM PUBLIC + GRANTed ONLY to `read_admin_consult_queue_health_wrapper_owner` per §6 + §8.1 class P. Per-(program_id, current_state) rollup with metrics decomposed into independent per-tenant CTEs to avoid 1:N join multiplication corrupting consult_count and orphan_claim_backlog:

```sql
CREATE VIEW admin_consult_queue_health_v
WITH (security_invoker = true, security_barrier = true)
AS
WITH tenant_scope AS (
    SELECT current_tenant_id_strict('admin_consult_queue_health_v') AS tenant_id
),
consult_state_rollup AS (
    SELECT c.tenant_id, c.program_id, latest.to_state AS current_state,
           COUNT(*) AS consult_count,
           AVG(EXTRACT(EPOCH FROM (first_claim.claim_at - c.created_at)))::NUMERIC(10,2)
               AS avg_time_to_first_claim_seconds
      FROM public.consult c
      JOIN tenant_scope ts ON ts.tenant_id = c.tenant_id
      LEFT JOIN LATERAL (
          SELECT to_state FROM public.consult_lifecycle_transition
          WHERE tenant_id = c.tenant_id AND consult_id = c.id
          ORDER BY transition_at DESC, id DESC LIMIT 1
      ) latest ON TRUE
      LEFT JOIN LATERAL (
          SELECT claim_at FROM public.consult_review_claim
          WHERE tenant_id = c.tenant_id AND consult_id = c.id
          ORDER BY claim_at ASC LIMIT 1
      ) first_claim ON TRUE
     GROUP BY c.tenant_id, c.program_id, latest.to_state
),
orphan_claims_by_program AS (
    SELECT c.tenant_id, c.program_id, COUNT(*) AS orphan_count
      FROM public.consult_review_claim crc
      JOIN public.consult c ON c.tenant_id = crc.tenant_id AND c.id = crc.consult_id
      JOIN tenant_scope ts ON ts.tenant_id = crc.tenant_id
     WHERE crc.claim_expires_at < now()
       AND crc.released_at IS NULL
     GROUP BY c.tenant_id, c.program_id
),
async_consult_audit_24h AS (
    SELECT ae.tenant_id, COUNT(*) AS audit_count
      FROM public.audit_event ae
      JOIN tenant_scope ts ON ts.tenant_id = ae.tenant_id
     WHERE ae.action_id LIKE 'async_consult.%'
       AND ae.recorded_at > now() - INTERVAL '24 hours'
     GROUP BY ae.tenant_id
)
SELECT
    csr.tenant_id,
    csr.program_id,
    csr.current_state,
    csr.consult_count,
    csr.avg_time_to_first_claim_seconds,
    COALESCE(ocp.orphan_count, 0) AS orphan_claim_backlog_count,
    COALESCE(aca.audit_count, 0) AS async_consult_audit_24h_count
FROM consult_state_rollup csr
LEFT JOIN orphan_claims_by_program ocp
    ON ocp.tenant_id = csr.tenant_id AND ocp.program_id IS NOT DISTINCT FROM csr.program_id
LEFT JOIN async_consult_audit_24h aca
    ON aca.tenant_id = csr.tenant_id;
```

**Aggregation design note:** the LATERAL subquery for `first_claim` selects ONE row per consult (earliest claim_at) eliminating the prior 1:N consult_review_claim multiplication; `orphan_claims_by_program` aggregates per-(tenant, program) ahead of the rollup join; `async_consult_audit_24h` aggregates per-tenant. Tenant scope bound by the `tenant_scope` CTE.

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

> **⚠️ Decision-wrapper idempotency-ordering: ratifier-closed per P-042 R2 hard-floor item 6 escalation (Evans's chat-message ratification 2026-05-22: "We go with A").** The wrapper body below is a VERBATIM lift of SI-023 v1.0 RATIFIED Sub-decision 4, which converged through SI-023 R1 HIGH-3 + R2 MED-1 + R11 HIGH-1 + R13 HIGH-2 closures specifically on the idempotency + ordering question. Codex challenged this ordering at P-042 R2 (idempotency-key INSERT happens AFTER lifecycle transition + conditional publish UPDATE) on the grounds that retry safety depends on the canonical caller contract (single-tx call + propagate 40001 → HTTP-layer retry) rather than structural in-wrapper enforcement. Dual-recommendation + two-pass Codex consult was run; ratifier (Evans) chose Option A: preserve SI-023 verbatim + reject the architectural-fragility finding on the merits. Rationale: CLAUDE.md "do not silently fork" discipline + SI-023 R1-R17 convergence already settled the ordering question + canonical caller contract makes ordering safe under standard PostgreSQL semantics + restructuring the wrapper body during the CDM follow-on landing would silently fork P-042 from SI-023 RATIFIED. ERR + three-way recommendation + ratifier decision recorded at `Telecheck_v1_10_PRD_Update/Engineering-Review-Request-P-042-R2-Decision-Wrapper-Idempotency-Ordering-2026-05-22.md` (commit `595a8f9`). **Future Codex passes that re-raise this finding are duplicate-of-R2 + closed per ratifier decision; reviewers seeing this banner should not re-litigate the wrapper-body ordering without first proposing a Track 6 hygiene cycle (SI-023 v1.1) for ratifier escalation per the standard post-pilot hardening path enumerated in §4 endpoint #5.**

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

#### §4.NEW8g — Wrapper-owner DML grants (P-042 R7 HIGH-1 closure 2026-05-22 — explicit least-privilege grants for each SECDEF owner role on every referenced relation/function their wrapper body touches; without these grants, the wrappers fail at runtime with `permission_denied for relation/function ...` despite EXECUTE being granted to the application roles, because SECURITY DEFINER executes with OWNER privileges not invoker privileges)

Each wrapper-owner role is NOLOGIN + non-BYPASSRLS per §6; the owner's privilege set is the EXACT set of relation/function privileges the wrapper body uses. Anti-bypass: NO owner role receives privileges beyond what its single wrapper needs.

**Submit wrapper owner** (`forms_template_admin_review_submit_wrapper_owner`; P-042 R8 HIGH-1 closure 2026-05-22 — added UPDATE grants because PostgreSQL `SELECT ... FOR UPDATE` requires UPDATE privilege on the locked relation even if no actual UPDATE runs; the append-only triggers prevent runtime mutation, but the GRANT prerequisite for FOR UPDATE is a static privilege check):
```sql
GRANT SELECT, UPDATE ON forms_template TO forms_template_admin_review_submit_wrapper_owner;  -- parent-template SELECT FOR UPDATE (UPDATE privilege required for FOR UPDATE lock; no actual mutation — the wrapper only LOCKS forms_template, never UPDATEs it from this wrapper)
GRANT SELECT, INSERT, UPDATE ON forms_template_admin_review TO forms_template_admin_review_submit_wrapper_owner;  -- LATERAL JOIN active-review check + INSERT new review + FOR UPDATE OF ftar lock on revision_requested row (UPDATE privilege required; append-only trigger blocks any actual UPDATE/DELETE so this is structural-only)
GRANT SELECT ON forms_template_admin_review_lifecycle_transition TO forms_template_admin_review_submit_wrapper_owner;  -- LATERAL JOIN latest-state derivation
GRANT SELECT ON tenant_account_membership TO forms_template_admin_review_submit_wrapper_owner;  -- LAYER B authorization
GRANT EXECUTE ON FUNCTION verify_session_jwt_and_extract_claims() TO forms_template_admin_review_submit_wrapper_owner;
GRANT EXECUTE ON FUNCTION record_forms_template_admin_review_transition(tenant_id_t, UUID, TEXT, TEXT, TEXT, UUID, JSONB) TO forms_template_admin_review_submit_wrapper_owner;
GRANT EXECUTE ON FUNCTION emit_audit_event_co_transactional(tenant_id_t, TEXT, JSONB) TO forms_template_admin_review_submit_wrapper_owner;
```

**Decision wrapper owner** (`forms_template_admin_review_decision_wrapper_owner`; P-042 R8 HIGH-1 closure 2026-05-22 — added UPDATE on `forms_template_admin_review` because the decision wrapper does `SELECT ... FROM forms_template_admin_review FOR UPDATE`):
```sql
GRANT SELECT, UPDATE ON forms_template TO forms_template_admin_review_decision_wrapper_owner;  -- parent-template FOR UPDATE + status='published' UPDATE on approve
GRANT SELECT, UPDATE ON forms_template_admin_review TO forms_template_admin_review_decision_wrapper_owner;  -- derive forms_template_id + SELECT FOR UPDATE lock (UPDATE privilege required; append-only trigger blocks any actual UPDATE/DELETE)
GRANT SELECT ON forms_template_admin_review_lifecycle_transition TO forms_template_admin_review_decision_wrapper_owner;  -- latest-state derivation under lock
GRANT SELECT, INSERT ON admin_template_decision_idempotency_key TO forms_template_admin_review_decision_wrapper_owner;  -- idempotency pre-check + reservation
GRANT SELECT ON tenant_account_membership TO forms_template_admin_review_decision_wrapper_owner;  -- LAYER B authorization
GRANT EXECUTE ON FUNCTION verify_session_jwt_and_extract_claims() TO forms_template_admin_review_decision_wrapper_owner;
GRANT EXECUTE ON FUNCTION record_forms_template_admin_review_transition(tenant_id_t, UUID, TEXT, TEXT, TEXT, UUID, JSONB) TO forms_template_admin_review_decision_wrapper_owner;
GRANT EXECUTE ON FUNCTION emit_audit_event_co_transactional(tenant_id_t, TEXT, JSONB) TO forms_template_admin_review_decision_wrapper_owner;
```

**Raw lifecycle writer owner** (`forms_template_admin_review_transition_writer_owner`):
```sql
GRANT INSERT ON forms_template_admin_review_lifecycle_transition TO forms_template_admin_review_transition_writer_owner;
-- No other privileges needed; raw writer is the SOLE INSERT path into this table and
-- does NOT read any other relations or call other functions in its body.
```

**Dashboard read-wrapper owners** (3 roles; each receives ONLY the privileges needed for its single dashboard surface):

```sql
-- read_admin_crisis_operational_health_wrapper_owner
GRANT SELECT ON admin_crisis_operational_health_v TO read_admin_crisis_operational_health_wrapper_owner;
GRANT INSERT ON admin_dashboard_query_execution TO read_admin_crisis_operational_health_wrapper_owner;
GRANT SELECT ON tenant_account_membership TO read_admin_crisis_operational_health_wrapper_owner;
GRANT EXECUTE ON FUNCTION verify_session_jwt_and_extract_claims() TO read_admin_crisis_operational_health_wrapper_owner;
GRANT EXECUTE ON FUNCTION emit_audit_event_co_transactional(tenant_id_t, TEXT, JSONB) TO read_admin_crisis_operational_health_wrapper_owner;

-- read_admin_consult_queue_health_wrapper_owner
GRANT SELECT ON admin_consult_queue_health_v TO read_admin_consult_queue_health_wrapper_owner;
GRANT INSERT ON admin_dashboard_query_execution TO read_admin_consult_queue_health_wrapper_owner;
GRANT SELECT ON tenant_account_membership TO read_admin_consult_queue_health_wrapper_owner;
GRANT EXECUTE ON FUNCTION verify_session_jwt_and_extract_claims() TO read_admin_consult_queue_health_wrapper_owner;
GRANT EXECUTE ON FUNCTION emit_audit_event_co_transactional(tenant_id_t, TEXT, JSONB) TO read_admin_consult_queue_health_wrapper_owner;

-- read_admin_mode1_volume_health_wrapper_owner
GRANT SELECT ON admin_mode1_volume_health_v TO read_admin_mode1_volume_health_wrapper_owner;
GRANT INSERT ON admin_dashboard_query_execution TO read_admin_mode1_volume_health_wrapper_owner;
GRANT SELECT ON tenant_account_membership TO read_admin_mode1_volume_health_wrapper_owner;
GRANT EXECUTE ON FUNCTION verify_session_jwt_and_extract_claims() TO read_admin_mode1_volume_health_wrapper_owner;
GRANT EXECUTE ON FUNCTION emit_audit_event_co_transactional(tenant_id_t, TEXT, JSONB) TO read_admin_mode1_volume_health_wrapper_owner;
```

**RLS interaction:** wrapper-owner roles are non-BYPASSRLS per §6, so even with these grants the wrapper bodies remain subject to RLS policies. The wrapper bodies set the tenant_id via the canonical `current_tenant_id_strict` path (called by RLS policies on the referenced tables); LAYER C of authorization (tenant scope match against `verify_session_jwt_and_extract_claims().verified_tenant_id`) is the wrapper's first check. RLS continues to apply on the wrapper-owner read/write — defense-in-depth alongside the wrapper-level authorization.

### §4.NEW9 — `forms_template_admin_review_pending_v` (CDM v1.11 new derived view; reviewer-scoped pending-only review surface; P-042 R7 HIGH-2 closure 2026-05-22 — mechanically enforces SI-023 §7's "pending reviews" qualifier that v0.1-v0.7 left as a prose-only claim against a tenant-wide RLS-only base table)

SI-023 §7 grants `admin_template_reviewer` "SELECT on `forms_template_admin_review` for own tenant's **pending reviews**" — but the base-table RLS policy only enforces tenant scope (`tenant_id = current_tenant_id_strict`), so a direct SELECT on the base table by `admin_template_reviewer` would actually expose every review row in the tenant — including approved + rejected terminal history AND the `ai_guardrail_snapshot_jsonb` payloads from prior cycles. That is a real authorization-scope expansion not intended by SI-023's prose. P-042 R7 HIGH-2 closure adds a canonical pending-only view AND redirects the reviewer's SELECT grant to the view (away from the base table) so the SI-023 §7 prose is mechanically enforced:

```sql
-- security_invoker=false (default): view body runs under the view owner's privileges so the
--   LATERAL JOIN to forms_template_admin_review_lifecycle_transition can read that table without
--   requiring the reviewer to hold direct SELECT on it (which would violate the wrapper-only
--   canonical read path discipline).
-- security_barrier=true: predicate pushdown safety against malicious functions in SELECT lists;
--   prevents row-leakage via untrusted operator/function injection.
-- Tenant isolation still flows through the `current_tenant_id_strict` GUC predicate which is
--   set by the application middleware from the JWT-bound verified_tenant_id — independent of
--   security_invoker (the GUC is the canonical tenant-binding mechanism).
CREATE VIEW forms_template_admin_review_pending_v
WITH (security_barrier = true)
AS
SELECT
    ftar.review_id,
    ftar.tenant_id,
    ftar.forms_template_id,
    ftar.submitter_principal_id,
    ftar.ai_guardrail_snapshot_jsonb,
    ftar.created_at,
    latest.to_state AS current_state,
    latest.transition_at AS current_state_transition_at
FROM forms_template_admin_review ftar
JOIN LATERAL (
    SELECT to_state, transition_at
      FROM forms_template_admin_review_lifecycle_transition lt
     WHERE lt.tenant_id = ftar.tenant_id AND lt.review_id = ftar.review_id
     ORDER BY lt.transition_at DESC, lt.id DESC
     LIMIT 1
) latest ON TRUE
WHERE ftar.tenant_id = current_tenant_id_strict('forms_template_admin_review_pending_v')
  AND latest.to_state IN ('pending_review', 'revision_requested');

ALTER VIEW forms_template_admin_review_pending_v OWNER TO forms_template_admin_review_pending_view_owner;
REVOKE ALL ON forms_template_admin_review_pending_v FROM PUBLIC;
GRANT SELECT ON forms_template_admin_review_pending_v TO admin_template_reviewer;

-- View-owner privilege flow (security_invoker=false): pending-view-owner needs SELECT on the
-- 2 underlying entities so the view body can execute. These grants are class-H-allowlisted.
GRANT SELECT ON forms_template_admin_review TO forms_template_admin_review_pending_view_owner;
GRANT SELECT ON forms_template_admin_review_lifecycle_transition TO forms_template_admin_review_pending_view_owner;
```

**Updated reviewer-read contract:** `admin_template_reviewer` receives SELECT on `forms_template_admin_review_pending_v` (NOT on the base table `forms_template_admin_review`). The base-table direct-SELECT grant from v0.7 class H allowlist is REMOVED for the reviewer; class H updated below to reflect this. Reviewer reads `forms_template_admin_review_pending_v` to discover pending review_ids + ai_guardrail_snapshot + submitter info; calls `record_forms_template_admin_decision(...)` wrapper to terminal-decision. **No reviewer direct access to approved/rejected terminal history.**

**RBAC table addition:** §6 row 12 added — `forms_template_admin_review_pending_view_owner` (12th net-new role; view-owner class; non-BYPASSRLS NOLOGIN; OWNS `forms_template_admin_review_pending_v`). Per-§6 grant-matrix invariant: reviewer holds SELECT on the view only; view-owner self-grant; no other SELECT grants permitted.

**RBAC count:** **12 net-new RBAC roles** (was 11; +1 for `forms_template_admin_review_pending_view_owner`). Updated across §1 in-scope item 9 + §6 RBAC table + §8.1 class A enumeration + §8.2 Phase 1 + the §8.1 class H allowlist update below.

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
4. `POST /v1/admin/templates/{template_id}/submit-for-review` — calls `submit_forms_template_for_admin_review` wrapper; requires admin_basic_operator role ONLY at LAYER B (R6 HIGH-3 closure 2026-05-22; builder-role direct-submit deferred to post-pilot Admin Backend v1.1); emits `admin.template_submitted_for_review` Cat A audit + creates forms_template_admin_review row + initial `none → pending_review` lifecycle_transition row co-transactionally. **No `Idempotency-Key` HTTP header is required for this endpoint** (P-042 R3 HIGH-2 + R4 HIGH-1 closures 2026-05-22 — the canonical SI-023 `submit_forms_template_for_admin_review(tenant_id_t, UUID)` wrapper signature does not accept an idempotency key + there is no submit-side idempotency-key table; the revision-resubmission path is naturally idempotent at the wrapper layer (re-submits reuse the existing review_id), but the INITIAL-SUBMISSION path is NOT API-idempotent in pilot scope). **Retry semantics + lost-response recovery runbook (P-042 R4 HIGH-1 + R5 HIGH-1 closures 2026-05-22 — operational recovery path specified concretely with break-glass role + exact SQL + tenant-binding checks + audit emission per the canonical break-glass framework from P-040 §8.1 class H):**

   **Retry behavior:** an initial-submission lost-response retry returns `admin-template-submit-already-in-flight` (40001 serialization_failure) → HTTP layer surfaces 409 Conflict. The revision-resubmission path is naturally idempotent (concurrent re-submits serialize at parent-template FOR UPDATE lock per R8 HIGH-1 + R11 HIGH-1 closures).

   **Lost-response recovery runbook (pilot scope; canonical operational procedure):**
   - **Trigger:** a tenant operator reports a lost-response on initial-submission (rare; expected near-zero frequency in pilot).
   - **Required role:** `platform_operator_breakglass` (canonical break-glass admin role established in P-040 §8.1 class H allowlist; NOLOGIN by default; password-rotated via KMS-bound credential vault; role-elevation requires platform-ops sign-off per the canonical break-glass framework). admin_basic_operator does NOT have direct SELECT on `forms_template_admin_review` + `forms_template_admin_review_lifecycle_transition` (per the wrapper-only canonical read path in SI-023 Sub-decision 3.5 + 4); the break-glass role is the SOLE path for ad-hoc recovery queries.
   - **Tenant-binding check (operator-side):** platform-ops verifies the affected tenant_id matches the operator's authorized tenant scope (cross-tenant break-glass access requires multi-operator sign-off per I-024 platform-floor).
   - **Canonical recovery SQL (run under the break-glass role with the affected tenant_id parameterized):**
     ```sql
     SELECT ftar.review_id,
            ftar.forms_template_id,
            ftar.submitter_principal_id,
            ftar.created_at,
            latest.to_state AS current_state,
            latest.transition_at AS current_state_transition_at
       FROM forms_template_admin_review ftar
       JOIN LATERAL (
           SELECT to_state, transition_at
             FROM forms_template_admin_review_lifecycle_transition lt
            WHERE lt.tenant_id = ftar.tenant_id AND lt.review_id = ftar.review_id
            ORDER BY lt.transition_at DESC, lt.id DESC
            LIMIT 1
       ) latest ON TRUE
      WHERE ftar.tenant_id = :affected_tenant_id
        AND ftar.forms_template_id = :affected_template_id
        AND latest.to_state IN ('pending_review', 'revision_requested')
      ORDER BY ftar.created_at DESC
      LIMIT 1;
     ```
   - **Audit emission:** the break-glass framework (P-040 §8.1 class H) emits a `breakglass.admin_template_submit_recovery_query` audit event under the canonical break-glass audit trail (NOT one of the 6 SI-023 audit events in §3 — handled by the canonical break-glass framework's audit infrastructure, which is established at P-040 level and reused unchanged). The event captures: tenant_id queried, operator principal_id, query timestamp, recovered review_id, sign-off operator. Cat C semantics: expected zero-or-near-zero frequency under canonical operation; any non-zero rate triggers operational review.
   - **Preflight verification:** §8.1 class H (reused from P-040 with no SI-023-specific overrides) verifies `platform_operator_breakglass` role exists + is NOLOGIN by default + has the canonical break-glass attributes (non-BYPASSRLS for general tables; explicit SELECT grants on `forms_template_admin_review` + `forms_template_admin_review_lifecycle_transition` added as part of the break-glass-allowed-read-set per P-040 class H allowlist).

   **No new endpoints, no new audit-event action_ids in P-042 — the recovery path reuses the canonical break-glass framework + adds two existing-pattern grants to its allowlist.** This preserves SI-023 §3 (6 audit events) + §5 (5 endpoints) verbatim while making the lost-response recovery mechanically specified + auditable + preflight-verifiable.

   **Post-pilot v1.1 hardening:** if observed lost-response retry frequency in production justifies API-driven recovery, v1.1 will add either (a) a `GET /v1/admin/template-reviews` lookup endpoint with admin_basic_operator RBAC + tenant isolation + Cat A audit emission per dashboard-read pattern, OR (b) submit-side idempotency-key support extending the canonical wrapper signature + a new `admin_submit_idempotency_key` entity. The choice between (a) and (b) is a v1.1 ratifier decision based on which pattern better fits the observed retry-storm profile. Until v1.1 lands, the break-glass runbook above is the canonical recovery path.
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

## 6. New RBAC roles (12 net-new; P-042 R7 HIGH-2 closure 2026-05-22 — +1 view-owner role for the new pending-only reviewer-read view)

Lifted from SI-023 §7 normative role enumeration (2 application + 3 dashboard-wrapper-owner + 2 template-wrapper-owner + 1 raw-writer-owner + 3 view-owner) **+ 1 P-042-specific view-owner for the R7 HIGH-2 pending-only view** (mechanically enforces SI-023 §7's "pending reviews" prose):

| # | Role | Class | Granted to | Holds |
|---|---|---|---|---|
| 1 | `admin_basic_operator` | application | tenant operator staff with dashboard-monitoring responsibility | EXECUTE on the 3 dashboard SECDEF read-wrappers |
| 2 | `admin_template_reviewer` | application | tenant operator staff with template-review responsibility | EXECUTE on the 2 template wrappers; SELECT on `forms_template_admin_review_pending_v` (the reviewer-scoped pending-only view per §4.NEW9; NOT direct SELECT on the base table — P-042 R7 HIGH-2 closure 2026-05-22 mechanically enforces SI-023 §7's "pending reviews" qualifier) |
| 3 | `read_admin_crisis_operational_health_wrapper_owner` | dashboard-wrapper-owner | n/a (non-BYPASSRLS NOLOGIN) | OWNS `read_admin_crisis_operational_health()`; SOLE role with SELECT on `admin_crisis_operational_health_v` |
| 4 | `read_admin_consult_queue_health_wrapper_owner` | dashboard-wrapper-owner | n/a (non-BYPASSRLS NOLOGIN) | OWNS `read_admin_consult_queue_health()`; SOLE role with SELECT on `admin_consult_queue_health_v` |
| 5 | `read_admin_mode1_volume_health_wrapper_owner` | dashboard-wrapper-owner | n/a (non-BYPASSRLS NOLOGIN) | OWNS `read_admin_mode1_volume_health()`; SOLE role with SELECT on `admin_mode1_volume_health_v` |
| 6 | `forms_template_admin_review_submit_wrapper_owner` | template-wrapper-owner | n/a (non-BYPASSRLS NOLOGIN) | OWNS `submit_forms_template_for_admin_review()` |
| 7 | `forms_template_admin_review_decision_wrapper_owner` | template-wrapper-owner | n/a (non-BYPASSRLS NOLOGIN) | OWNS `record_forms_template_admin_decision()` |
| 8 | `forms_template_admin_review_transition_writer_owner` | raw-writer-owner | n/a (non-BYPASSRLS NOLOGIN) | OWNS raw `record_forms_template_admin_review_transition()`; EXECUTE granted to EXACTLY the 2 template wrapper-owner roles |
| 9 | `admin_crisis_operational_health_view_owner` | view-owner | n/a (non-BYPASSRLS NOLOGIN) | OWNS `admin_crisis_operational_health_v` |
| 10 | `admin_consult_queue_health_view_owner` | view-owner | n/a (non-BYPASSRLS NOLOGIN) | OWNS `admin_consult_queue_health_v` |
| 11 | `admin_mode1_volume_health_view_owner` | view-owner | n/a (non-BYPASSRLS NOLOGIN) | OWNS `admin_mode1_volume_health_v` |
| 12 | `forms_template_admin_review_pending_view_owner` | view-owner | n/a (non-BYPASSRLS NOLOGIN; P-042 R7 HIGH-2 closure 2026-05-22) | OWNS `forms_template_admin_review_pending_v`; SOLE role with SELECT on the view alongside `admin_template_reviewer` (the view's grantee) |

**Grant matrix invariant (preserved from SI-023 §7 + §3.5 + Sub-decision 6; extended for the pending view per P-042 R7 HIGH-2 closure):**
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

**Class A — Verify the 12 net-new RBAC roles exist** (P-042 R7 HIGH-2 closure 2026-05-22 — extended by +1 to include `forms_template_admin_review_pending_view_owner`):

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
            -- View-owner roles (4; P-042 R7 HIGH-2: pending-view-owner added)
            'admin_crisis_operational_health_view_owner',
            'admin_consult_queue_health_view_owner',
            'admin_mode1_volume_health_view_owner',
            'forms_template_admin_review_pending_view_owner'
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

**Class H — pg_read_all_data + BYPASSRLS check + break-glass-admin allowlist + admin-recovery read-set extension** (reused from P-040 with two SI-023-specific extensions per the §4 endpoint #4 lost-response recovery runbook (R5 HIGH-1 closure 2026-05-22)): admin views + admin review entities inherit the canonical break-glass-admin allowlist; application runtime roles MUST NOT hold pg_read_all_data OR BYPASSRLS; the `platform_operator_breakglass` role is the SOLE canonical read path for the lost-response recovery SQL specified at §4 endpoint #4 + holds explicit SELECT grants on `forms_template_admin_review` + `forms_template_admin_review_lifecycle_transition` (added to the break-glass-allowed-read-set per P-040 class H allowlist extension; ad-hoc grants to other roles REJECTED):

```sql
DO $$
DECLARE
    v_missing_breakglass_grant TEXT;
BEGIN
    -- Verify platform_operator_breakglass holds SELECT on the 2 SI-023 admin review entities
    -- required by the §4 endpoint #4 lost-response recovery runbook
    FOR v_missing_breakglass_grant IN
        SELECT unnest(ARRAY['forms_template_admin_review', 'forms_template_admin_review_lifecycle_transition'])
        EXCEPT
        SELECT g.table_name
          FROM information_schema.role_table_grants g
         WHERE g.grantee = 'platform_operator_breakglass'
           AND g.privilege_type = 'SELECT'
           AND g.table_name IN ('forms_template_admin_review', 'forms_template_admin_review_lifecycle_transition')
    LOOP
        RAISE EXCEPTION 'si-023-breakglass-recovery-grant-missing: platform_operator_breakglass lacks SELECT on %; required by §4 endpoint #4 lost-response recovery runbook', v_missing_breakglass_grant;
    END LOOP;
    -- P-042 R7 HIGH-2 closure 2026-05-22: reviewer's SELECT grant is on the pending-only VIEW
    -- (`forms_template_admin_review_pending_v` per §4.NEW9), NOT on the base table. Direct
    -- reviewer SELECT on the base table is REJECTED. Verify the SELECT-grant allowlist:
    --   forms_template_admin_review              → {platform_operator_breakglass, submit-wrapper-owner, decision-wrapper-owner, pending-view-owner}
    --                                              (3 owner roles + break-glass; reviewer REMOVED — reviewer reads via pending view)
    --   forms_template_admin_review_pending_v    → {admin_template_reviewer, pending-view-owner (self)}
    --   forms_template_admin_review_lifecycle_transition → {platform_operator_breakglass, transition-writer-owner, pending-view-owner (for the LATERAL JOIN in the view definition)}
    --                                              (transition-writer-owner + pending-view-owner needed because the
    --                                               pending view body reads the lifecycle_transition table via LATERAL;
    --                                               security_invoker=true on the view means SELECTs against the view
    --                                               run as caller — admin_template_reviewer — so reviewer needs grant on
    --                                               lifecycle_transition too. CORRECTION: with security_invoker=true the
    --                                               view body executes with the CALLER's privileges, so the reviewer would
    --                                               need lifecycle_transition SELECT. Switching design: the pending view
    --                                               uses security_invoker=FALSE + security_barrier=TRUE so the LATERAL JOIN
    --                                               runs under the view-owner's privileges; reviewer only needs SELECT on
    --                                               the view itself. The view-owner gets SELECT on both base entities.
    --                                               §4.NEW9 view definition above is updated accordingly.)
    FOR v_missing_breakglass_grant IN
        SELECT g.grantee || ' on ' || g.table_name
          FROM information_schema.role_table_grants g
         WHERE g.privilege_type = 'SELECT'
           AND (
               (g.table_name = 'forms_template_admin_review'
                AND g.grantee NOT IN (
                    'platform_operator_breakglass',
                    'forms_template_admin_review_submit_wrapper_owner',
                    'forms_template_admin_review_decision_wrapper_owner',
                    'forms_template_admin_review_pending_view_owner'
                ))
               OR
               (g.table_name = 'forms_template_admin_review_pending_v'
                AND g.grantee NOT IN (
                    'admin_template_reviewer',
                    'forms_template_admin_review_pending_view_owner'
                ))
               OR
               (g.table_name = 'forms_template_admin_review_lifecycle_transition'
                AND g.grantee NOT IN (
                    'platform_operator_breakglass',
                    'forms_template_admin_review_transition_writer_owner',
                    'forms_template_admin_review_pending_view_owner'
                ))
           )
    LOOP
        RAISE EXCEPTION 'si-023-admin-review-entity-grant-violation: % is not in the canonical SELECT allowlist', v_missing_breakglass_grant;
    END LOOP;
    -- Positive assertion: reviewer DOES hold SELECT on the pending VIEW (canonical reviewer-read surface per §4.NEW9)
    PERFORM 1
      FROM information_schema.role_table_grants
     WHERE grantee = 'admin_template_reviewer'
       AND privilege_type = 'SELECT'
       AND table_name = 'forms_template_admin_review_pending_v';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'si-023-reviewer-pending-view-grant-missing: admin_template_reviewer is missing SELECT on forms_template_admin_review_pending_v per §4.NEW9';
    END IF;
    -- Negative assertion: reviewer must NOT hold direct SELECT on the base table (P-042 R7 HIGH-2)
    PERFORM 1
      FROM information_schema.role_table_grants
     WHERE grantee = 'admin_template_reviewer'
       AND privilege_type = 'SELECT'
       AND table_name = 'forms_template_admin_review';
    IF FOUND THEN
        RAISE EXCEPTION 'si-023-reviewer-base-table-grant-violation: admin_template_reviewer MUST NOT hold direct SELECT on forms_template_admin_review (read via forms_template_admin_review_pending_v per P-042 R7 HIGH-2)';
    END IF;
END $$;
```

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

**Class Q — Wrapper-owner DML/EXECUTE privilege verification** (P-042 R7 HIGH-1 closure 2026-05-22; NEW canonical preflight asserting each of the 6 SECDEF wrapper-owner roles + the pending-view-owner hold the EXACT least-privilege set their function bodies require; without this gate, cutover passes but the first admin submit/decision/dashboard call fails with `permission_denied` because SECURITY DEFINER executes with owner privileges not invoker privileges):

```sql
DO $$
DECLARE
    v_violation TEXT;
BEGIN
    -- Submit wrapper owner (P-042 R8 HIGH-1: UPDATE on forms_template + forms_template_admin_review
    -- required for SELECT ... FOR UPDATE lock acquisition; append-only triggers prevent actual mutation)
    IF NOT has_table_privilege('forms_template_admin_review_submit_wrapper_owner', 'forms_template', 'SELECT')
       OR NOT has_table_privilege('forms_template_admin_review_submit_wrapper_owner', 'forms_template', 'UPDATE')
       OR NOT has_table_privilege('forms_template_admin_review_submit_wrapper_owner', 'forms_template_admin_review', 'SELECT')
       OR NOT has_table_privilege('forms_template_admin_review_submit_wrapper_owner', 'forms_template_admin_review', 'INSERT')
       OR NOT has_table_privilege('forms_template_admin_review_submit_wrapper_owner', 'forms_template_admin_review', 'UPDATE')
       OR NOT has_table_privilege('forms_template_admin_review_submit_wrapper_owner', 'forms_template_admin_review_lifecycle_transition', 'SELECT')
       OR NOT has_table_privilege('forms_template_admin_review_submit_wrapper_owner', 'tenant_account_membership', 'SELECT')
       OR NOT has_function_privilege('forms_template_admin_review_submit_wrapper_owner', 'verify_session_jwt_and_extract_claims()', 'EXECUTE')
       OR NOT has_function_privilege('forms_template_admin_review_submit_wrapper_owner', 'record_forms_template_admin_review_transition(tenant_id_t, uuid, text, text, text, uuid, jsonb)', 'EXECUTE')
       OR NOT has_function_privilege('forms_template_admin_review_submit_wrapper_owner', 'emit_audit_event_co_transactional(tenant_id_t, text, jsonb)', 'EXECUTE') THEN
        RAISE EXCEPTION 'si-023-submit-wrapper-owner-privilege-violation: forms_template_admin_review_submit_wrapper_owner is missing required DML/EXECUTE privileges per §4.NEW8g';
    END IF;

    -- Decision wrapper owner (P-042 R8 HIGH-1: UPDATE on forms_template_admin_review added
    -- for SELECT ... FOR UPDATE lock; UPDATE on forms_template already required for publish step)
    IF NOT has_table_privilege('forms_template_admin_review_decision_wrapper_owner', 'forms_template', 'SELECT')
       OR NOT has_table_privilege('forms_template_admin_review_decision_wrapper_owner', 'forms_template', 'UPDATE')
       OR NOT has_table_privilege('forms_template_admin_review_decision_wrapper_owner', 'forms_template_admin_review', 'SELECT')
       OR NOT has_table_privilege('forms_template_admin_review_decision_wrapper_owner', 'forms_template_admin_review', 'UPDATE')
       OR NOT has_table_privilege('forms_template_admin_review_decision_wrapper_owner', 'forms_template_admin_review_lifecycle_transition', 'SELECT')
       OR NOT has_table_privilege('forms_template_admin_review_decision_wrapper_owner', 'admin_template_decision_idempotency_key', 'SELECT')
       OR NOT has_table_privilege('forms_template_admin_review_decision_wrapper_owner', 'admin_template_decision_idempotency_key', 'INSERT')
       OR NOT has_table_privilege('forms_template_admin_review_decision_wrapper_owner', 'tenant_account_membership', 'SELECT')
       OR NOT has_function_privilege('forms_template_admin_review_decision_wrapper_owner', 'verify_session_jwt_and_extract_claims()', 'EXECUTE')
       OR NOT has_function_privilege('forms_template_admin_review_decision_wrapper_owner', 'record_forms_template_admin_review_transition(tenant_id_t, uuid, text, text, text, uuid, jsonb)', 'EXECUTE')
       OR NOT has_function_privilege('forms_template_admin_review_decision_wrapper_owner', 'emit_audit_event_co_transactional(tenant_id_t, text, jsonb)', 'EXECUTE') THEN
        RAISE EXCEPTION 'si-023-decision-wrapper-owner-privilege-violation: forms_template_admin_review_decision_wrapper_owner is missing required DML/EXECUTE privileges per §4.NEW8g';
    END IF;

    -- Raw lifecycle writer owner
    IF NOT has_table_privilege('forms_template_admin_review_transition_writer_owner', 'forms_template_admin_review_lifecycle_transition', 'INSERT') THEN
        RAISE EXCEPTION 'si-023-transition-writer-owner-privilege-violation: forms_template_admin_review_transition_writer_owner is missing INSERT on forms_template_admin_review_lifecycle_transition per §4.NEW8g';
    END IF;

    -- 3 dashboard wrapper owners
    FOR v_violation IN
        SELECT v.owner_role || ' missing privilege on ' || v.target
          FROM (
              VALUES
                  ('read_admin_crisis_operational_health_wrapper_owner', 'admin_crisis_operational_health_v'),
                  ('read_admin_consult_queue_health_wrapper_owner', 'admin_consult_queue_health_v'),
                  ('read_admin_mode1_volume_health_wrapper_owner', 'admin_mode1_volume_health_v')
          ) AS v(owner_role, target)
         WHERE NOT has_table_privilege(v.owner_role, v.target, 'SELECT')
            OR NOT has_table_privilege(v.owner_role, 'admin_dashboard_query_execution', 'INSERT')
            OR NOT has_table_privilege(v.owner_role, 'tenant_account_membership', 'SELECT')
            OR NOT has_function_privilege(v.owner_role, 'verify_session_jwt_and_extract_claims()', 'EXECUTE')
            OR NOT has_function_privilege(v.owner_role, 'emit_audit_event_co_transactional(tenant_id_t, text, jsonb)', 'EXECUTE')
    LOOP
        RAISE EXCEPTION 'si-023-dashboard-wrapper-owner-privilege-violation: %', v_violation;
    END LOOP;

    -- Pending-view owner (security_invoker=false; needs SELECT on the 2 underlying tables)
    IF NOT has_table_privilege('forms_template_admin_review_pending_view_owner', 'forms_template_admin_review', 'SELECT')
       OR NOT has_table_privilege('forms_template_admin_review_pending_view_owner', 'forms_template_admin_review_lifecycle_transition', 'SELECT') THEN
        RAISE EXCEPTION 'si-023-pending-view-owner-privilege-violation: forms_template_admin_review_pending_view_owner is missing required SELECT on underlying entities per §4.NEW9';
    END IF;
END $$;
```

### §8.2 Cutover sequencing (11 phases per SI-023 §8.2)

1. **Phase 1 — RBAC role creation only (P-042 R9 HIGH-1 closure 2026-05-22 — split from grant execution because GRANT statements reference tables/views/functions that don't exist until later phases):** create the **12 net-new RBAC roles** per §6 (2 application + 3 dashboard-wrapper-owner + 2 template-wrapper-owner + 1 raw-writer-owner + 4 view-owner including the new `forms_template_admin_review_pending_view_owner` per §4.NEW9); set role passwords via KMS-bound credential vault. **Pre-existing-dependency GRANTs that target already-deployed canonical entities** (from P-027/P-031): `SELECT ON tenant_account_membership` to all 6 SECDEF wrapper-owners + `EXECUTE ON verify_session_jwt_and_extract_claims()` to all 6 SECDEF wrapper-owners + `EXECUTE ON emit_audit_event_co_transactional(tenant_id_t, text, jsonb)` to 5 wrapper-owners (excluding the raw lifecycle writer which doesn't emit audit). NO grants on SI-023 entities (admin tables, admin views, raw writer function) in this phase — those are deferred to Phase 2 / Phase 6 / Phase 7 below where the target objects exist.
2. **Phase 2 — Tables + indexes + triggers + table-level GRANTs (P-042 R9 HIGH-1 closure 2026-05-22 — table GRANTs moved here from Phase 1):** execute §4.NEW1 → NEW2 → NEW3 → NEW4 DDL blocks in dependency order (each block creates table + RLS + append-only trigger + invariant triggers + indexes inline). **Then execute the §4.NEW8g table-level `GRANT` statements** targeting the 4 SI-023 admin tables: submit wrapper-owner gets SELECT+UPDATE on `forms_template` + SELECT/INSERT/UPDATE on `forms_template_admin_review` + SELECT on `forms_template_admin_review_lifecycle_transition`; decision wrapper-owner gets SELECT/UPDATE on `forms_template` + SELECT/UPDATE on `forms_template_admin_review` + SELECT on `forms_template_admin_review_lifecycle_transition` + SELECT/INSERT on `admin_template_decision_idempotency_key`; raw writer-owner gets INSERT on `forms_template_admin_review_lifecycle_transition`; 3 dashboard wrapper-owners each get INSERT on `admin_dashboard_query_execution`. Note: `forms_template` is a pre-existing P-026 entity (already deployed); the GRANTs against it execute fine in Phase 2.
3. **Phase 3 — Backfill:** vacuous for greenfield deploy (no pre-existing rows in any of the 4 admin tables).
4. **Phase 4 — (REMOVED per SI-023 R10 HIGH-2 closure):** trigger creation consolidated into Phase 2; preserved as empty slot for phase-number alignment with P-040.
5. **Phase 5 — RLS policies:** enabled inline in Phase 2 §4 DDL; class C/D/E preflight assertions evaluate before Phase 10 gate.
6. **Phase 6 — Views + view-related GRANTs FIRST** (per SI-023 R6 HIGH-1 closure — wrapper-only design forces view-before-wrapper deployment; P-042 R8 MED-1 + R9 HIGH-1 closures 2026-05-22 — pending view added + view-related GRANTs deferred from Phase 1 to here): (a) create the 3 admin dashboard views (`admin_crisis_operational_health_v` + `admin_consult_queue_health_v` + `admin_mode1_volume_health_v`) with `security_invoker=true + security_barrier=true`; set ownership to corresponding view-owner role; REVOKE ALL FROM PUBLIC. (b) Create the §4.NEW9 reviewer pending-only view (`forms_template_admin_review_pending_v`) with `security_barrier=true` + `security_invoker=false`; set ownership to `forms_template_admin_review_pending_view_owner`; REVOKE ALL FROM PUBLIC. (c) **Execute the view-level GRANTs**: SELECT on each dashboard view to its corresponding dashboard-wrapper-owner role; SELECT on the pending view to `admin_template_reviewer`; SELECT on `forms_template_admin_review` + `forms_template_admin_review_lifecycle_transition` to `forms_template_admin_review_pending_view_owner` (the pending-view-owner needs these underlying-table grants because security_invoker=false runs the view body under owner privileges). (d) Phase 6.1 CTAS provenance event trigger REUSED from P-040 (admin views — including the pending view — become new dependents in class K allowlist). (e) **Break-glass extension grants** (per §4 endpoint #4 lost-response recovery runbook): GRANT SELECT on `forms_template_admin_review` + `forms_template_admin_review_lifecycle_transition` to `platform_operator_breakglass` (per the §8.1 class H break-glass-allowed-read-set extension).
7. **Phase 7 — Procedures + function-level GRANTs (P-042 R9 HIGH-1 closure 2026-05-22 — function EXECUTE GRANTs moved here from Phase 1; the raw-writer GRANT cannot be issued until the raw writer function exists):** (a) deploy the 6 SECDEF procedures per §4.NEW8a-f (1 raw + 3 dashboard read-wrappers + 2 template wrappers); each SECURITY DEFINER + locked search_path; ownership set per §6; REVOKE EXECUTE FROM PUBLIC + GRANT EXECUTE to application roles per the inline DDL in §4.NEW8b-f (admin_basic_operator for dashboard read-wrappers + submit; admin_template_reviewer for decision). (b) **Execute the function EXECUTE GRANTs from §4.NEW8g**: `GRANT EXECUTE ON FUNCTION record_forms_template_admin_review_transition(tenant_id_t, UUID, TEXT, TEXT, TEXT, UUID, JSONB) TO forms_template_admin_review_submit_wrapper_owner, forms_template_admin_review_decision_wrapper_owner` (anti-bypass: raw writer EXECUTE granted ONLY to the 2 template wrapper-owners; no other roles).
8. **Phase 8 — JWT migration entity seed:** INSERT 7 rows into `jwt_migration_entity_status` per §7 above.
9. **Phase 9 — Audit events registration:** INSERT 6 new `admin.*` action IDs into `audit_events_action_definition` table per AUDIT_EVENTS v5.13 schema.
10. **Phase 10 — Deployment preflight gate (P-042 R8 MED-1 closure 2026-05-22 — class Q added):** run §8.1 DO block (classes A-M + N + O + P + **Q** — wrapper-owner DML/EXECUTE privilege verification per the P-042 R7 HIGH-1 + R8 HIGH-1 closures); any FAILED assertion BLOCKS cutover.
11. **Phase 11 — OpenAPI endpoint deployment:** deploy 5 net-new endpoints under `/v1/admin/*` per §4; verify caller-class role requirement enforced at endpoint layer (defense-in-depth alongside SECDEF wrapper LAYER A+B+C).

**Rollback discipline:** On any Phase N failure during cutover, rollback discards Phase N's changes via transaction context; Phases 1–(N–1) remain. Post-Phase-11 defects close via a fresh hygiene-cycle PR (P-009 v1.10.1 pattern); destructive rollback NOT attempted once Phase 11 has completed.

---

## 9. Cycle log

**v0.11 DRAFT 2026-05-22 — R10 finding acknowledged as duplicate-of-R2 (rejected at ratifier; no closure action required):**

- **R10 HIGH-1 = DUPLICATE-OF-R2 (closed per ratifier decision 2026-05-22):** Codex R10 re-flagged the decision-wrapper idempotency-ordering finding (idempotency-key INSERT happens AFTER lifecycle transition + conditional publish UPDATE; safety depends on canonical caller contract rather than structural enforcement). This finding is identical to P-042 R2 which was ratifier-closed via Evans's "We go with A" chat-message ratification 2026-05-22 (recorded in §9 v0.3 cycle log + ERR at `Telecheck_v1_10_PRD_Update/Engineering-Review-Request-P-042-R2-Decision-Wrapper-Idempotency-Ordering-2026-05-22.md` commit `595a8f9`). The ratifier chose Option A: preserve SI-023 v1.0 RATIFIED Sub-decision 4 wrapper body verbatim + reject the architectural-fragility finding on the merits. No further wrapper-body changes in v0.11; the §4.NEW8f wrapper remains verbatim from SI-023. **Improvement:** added prominent ratifier-closure banner at §4.NEW8f header — quoted from Evans's verbatim ratification + summarizing the dual-recommendation + two-pass Codex consult ceremony + directing future Codex reviewers to the Track 6 / SI-023 v1.1 hardening path enumerated in §4 endpoint #5 if they want to escalate (rather than re-raising the closed finding inline). This is the standard CLAUDE.md hard-floor item 6 dissolution pattern matching the P-038 R6 + P-040 R15 precedents. **Future Codex passes that re-raise R2 will be closed as DUPLICATE-OF-R2 with cross-reference to this v0.11 entry without further ratifier escalation; new architectural-judgment findings (different from R2's wrapper-ordering scope) continue to trigger hard-floor item 6 escalation per CLAUDE.md.**

**v0.10 DRAFT 2026-05-22 — R9 closure applied (1 HIGH within-scope; no hard-floor escalation):**

- **R9 HIGH-1 closed:** §8.2 Phase 1 in v0.8-v0.9 instructed cutover to "execute the §4.NEW8g GRANT statements" immediately after creating the 12 RBAC roles, but those GRANTs reference SI-023 tables (created in Phase 2), the 4 admin views (Phase 6), and the raw lifecycle writer function (Phase 7). A deployer following Phase 1 literally would hit `relation does not exist` / `function does not exist` errors before reaching Phase 10's preflight gate. Worse: any ad-hoc reorder by the deployer would invalidate the spec's claimed mechanical cutover path + leak grant-placement ambiguity into production. Fix: restructured §8.2 to place each §4.NEW8g GRANT in its natural phase (the phase where the target object exists). (a) Phase 1 = role creation + pre-existing-dependency GRANTs only — `tenant_account_membership` SELECT + `verify_session_jwt_and_extract_claims()` EXECUTE + `emit_audit_event_co_transactional()` EXECUTE (all 3 targets are pre-deployed canonical entities from P-027/P-031, so GRANTs against them succeed in Phase 1). (b) Phase 2 = SI-023 table-level GRANTs after §4.NEW1-4 DDL — submit + decision wrapper-owner SELECT/UPDATE on `forms_template` + SELECT/INSERT/UPDATE on `forms_template_admin_review` + SELECT on `forms_template_admin_review_lifecycle_transition` + decision-only SELECT/INSERT on `admin_template_decision_idempotency_key` + raw-writer INSERT on `forms_template_admin_review_lifecycle_transition` + dashboard wrapper-owner INSERT on `admin_dashboard_query_execution` (note: forms_template is a pre-existing P-026 entity, so the GRANT executes fine in Phase 2). (c) Phase 6 = view-related GRANTs after the 4 admin views are created — SELECT on each dashboard view to its corresponding dashboard-wrapper-owner + SELECT on the pending view to `admin_template_reviewer` + SELECT on `forms_template_admin_review` + `forms_template_admin_review_lifecycle_transition` to `forms_template_admin_review_pending_view_owner` (required by security_invoker=false design) + break-glass extension grants per the §4 endpoint #4 recovery runbook. (d) Phase 7 = function EXECUTE GRANTs after the SECDEF procedures are created — raw lifecycle writer EXECUTE granted ONLY to the 2 template wrapper-owners (anti-bypass per §4.NEW8a + §4.NEW8g). Class Q preflight (Phase 10) verifies the final post-grant state regardless of which phase issued each individual GRANT.

**v0.9 DRAFT 2026-05-22 — R8 closures applied (1 HIGH + 1 MED within-scope; no hard-floor escalation):**

- **R8 HIGH-1 closed:** PostgreSQL `SELECT ... FOR UPDATE` requires UPDATE privilege on the locked relation even when no actual UPDATE runs in the transaction. The submit wrapper locks `forms_template` row + `forms_template_admin_review ftar` row FOR UPDATE; the decision wrapper also locks `forms_template_admin_review` FOR UPDATE. v0.8 §4.NEW8g granted only SELECT on `forms_template` to the submit wrapper-owner and only SELECT on `forms_template_admin_review` to both wrapper-owners — cutover preflight would have PASSED class Q (which only checked the explicit privileges) but the first submit/decision call would have errored at runtime with `permission_denied for relation` on the FOR UPDATE lock acquisition. Fix: (a) submit wrapper-owner now also holds UPDATE on `forms_template` + UPDATE on `forms_template_admin_review`; (b) decision wrapper-owner now also holds UPDATE on `forms_template_admin_review` (UPDATE on `forms_template` was already required for the publish step); (c) class Q assertions extended with `has_table_privilege('UPDATE')` checks on both tables for both wrapper-owners. Note: the append-only triggers on `forms_template_admin_review` block any actual UPDATE/DELETE at runtime, so the UPDATE privilege is structural-only — it satisfies the FOR UPDATE prerequisite without enabling real mutation. This is the canonical PostgreSQL pattern for SECURITY DEFINER wrappers that lock-without-mutating; documented inline in §4.NEW8g comments.
- **R8 MED-1 closed:** §8.2 cutover sequencing was not updated in v0.7+v0.8 to reflect the additions: Phase 1 said "11 net-new RBAC roles" (stale post-R7 HIGH-2 which added the 12th role `forms_template_admin_review_pending_view_owner`); Phase 6 enumerated only the 3 dashboard views (missing the §4.NEW9 pending-only view); Phase 10 preflight said "classes A-M + N + O + P" (missing class Q added at R7 HIGH-1). An implementer following §8.2 literally would skip the 12th role + skip the pending view + skip class Q, undercutting all of the R7 closures. Fix: (a) Phase 1 updated to "12 net-new RBAC roles" with explicit enumeration including the pending-view-owner + explicit reference to §4.NEW8g GRANTs for wrapper-owner DML/EXECUTE setup; (b) Phase 6 updated to enumerate all 4 views (3 dashboard + 1 pending) with the pending view's distinct security_invoker=false design noted + its specific ownership/grant pattern + addition to class K CTAS provenance allowlist; (c) Phase 10 updated to "classes A-M + N + O + P + Q" with cross-reference to the R7 HIGH-1 + R8 HIGH-1 closures.

**v0.8 DRAFT 2026-05-22 — R7 closures applied (2 HIGH within-scope; no hard-floor escalation):**

- **R7 HIGH-1 closed:** v0.1-v0.7 changed function ownership to narrow wrapper-owner roles but never granted those owner roles the underlying table privileges their wrapper bodies use. Under PostgreSQL SECURITY DEFINER semantics, function bodies execute with the FUNCTION OWNER's privileges; without DML/EXECUTE grants on the referenced relations/functions, the wrappers would have failed at runtime with `permission_denied for relation/function ...` despite EXECUTE being granted to application roles. Preflight focused only on SELECT allowlists; INSERT/UPDATE/EXECUTE dependency privileges for owner roles were not asserted, so cutover would have passed + the first admin submit/decision/dashboard call would have errored. Fix: (a) §4.NEW8g inline executable `GRANT` statements for each wrapper-owner role enumerating exact least-privilege DML/EXECUTE grants per wrapper body — submit wrapper-owner gets SELECT+INSERT on `forms_template_admin_review` + SELECT on `forms_template` + SELECT on `forms_template_admin_review_lifecycle_transition` + SELECT on `tenant_account_membership` + EXECUTE on 3 functions; decision wrapper-owner adds UPDATE on `forms_template` + SELECT/INSERT on `admin_template_decision_idempotency_key`; raw lifecycle writer-owner gets ONLY INSERT on lifecycle_transition; 3 dashboard read-wrapper-owners each get SELECT on their respective view + INSERT on `admin_dashboard_query_execution` + SELECT on `tenant_account_membership` + EXECUTE on 2 functions. (b) New §8.1 class Q preflight via `has_table_privilege()` + `has_function_privilege()` assertions on each of the 6 wrapper-owner roles + pending-view-owner; missing privilege raises `si-023-{role}-privilege-violation` + blocks cutover. (c) RLS interaction documented: wrapper-owner roles remain non-BYPASSRLS so RLS continues to apply alongside wrapper-level authorization (defense-in-depth).
- **R7 HIGH-2 closed:** SI-023 §7 grants `admin_template_reviewer` "SELECT on `forms_template_admin_review` for own tenant's **pending reviews**" — but v0.1-v0.7 honored only the tenant-scope qualifier via RLS, leaving the "pending reviews" filter as prose-only. Direct reviewer SELECT on the base table would have exposed every review row in the tenant — including approved/rejected terminal history AND historical `ai_guardrail_snapshot_jsonb` payloads — bypassing the documented pending-only contract. Authorization-scope expansion hidden behind the R6 allowlist fix. Fix: (a) new §4.NEW9 `forms_template_admin_review_pending_v` view with `security_barrier=true` + `security_invoker=false` (so the view body's LATERAL JOIN to lifecycle_transition runs under view-owner privileges, not reviewer's, preserving the wrapper-only canonical read path discipline; tenant isolation flows through the `current_tenant_id_strict` GUC predicate which is set by application middleware from JWT-bound verified_tenant_id, independent of security_invoker). View filters on `latest.to_state IN ('pending_review', 'revision_requested')` per the SI-023 §7 prose qualifier. (b) +1 net-new RBAC role `forms_template_admin_review_pending_view_owner` (12th role) with explicit GRANTs for SELECT on the 2 underlying entities. (c) §6 RBAC table updated — reviewer SELECT grant target is the VIEW, not the base table. (d) §1 in-scope item 5 updated: 11 → 12 net-new roles. (e) §8.1 class A enumeration updated to include the new role. (f) §8.1 class H allowlist updated: base-table SELECT allowlist `{breakglass, submit-owner, decision-owner, pending-view-owner}` (reviewer REMOVED); pending-view SELECT allowlist `{reviewer, pending-view-owner}`; lifecycle_transition SELECT allowlist `{breakglass, transition-writer-owner, pending-view-owner}` (pending-view-owner added for the LATERAL JOIN). (g) Positive + negative assertions: reviewer MUST hold SELECT on pending view; reviewer MUST NOT hold direct SELECT on base table.

**v0.7 DRAFT 2026-05-22 — R6 closure applied (1 HIGH within-scope; no hard-floor escalation):**

- **R6 HIGH-1 closed:** the v0.5-v0.6 class H break-glass-allowlist (R5 HIGH-1 closure) over-tightened — the allowlist `{platform_operator_breakglass, 3 wrapper-owners}` REJECTED `admin_template_reviewer`'s SELECT grant on `forms_template_admin_review`, contradicting SI-023 §7 line 1113 which explicitly grants this to support the reviewer's documented "own tenant's pending reviews" read surface (tenant scope enforced by the RLS policy on the table, NOT by narrowing the grant matrix). Two failure modes: (a) deployment follows §6 RBAC + grants reviewer SELECT → class H fails cutover; (b) deployment follows class H → reviewers lose the only documented direct read for pending reviews → decision endpoint depends on out-of-band review_id discovery (regression of the canonical RBAC contract). Fix: rewrote class H assertion to per-entity grant allowlists — `forms_template_admin_review` allowlist = `{admin_template_reviewer, platform_operator_breakglass, submit-wrapper-owner, decision-wrapper-owner}` (4 roles; reviewer included per SI-023 §7); `forms_template_admin_review_lifecycle_transition` allowlist = `{platform_operator_breakglass, transition-writer-owner}` (2 roles; reviewer NOT included — current_state is derived via the decision wrapper or break-glass recovery, never via direct lifecycle_transition SELECT). Added positive assertion that reviewer MUST hold the canonical SELECT grant on `forms_template_admin_review` (catches the inverse failure: deployment forgot to grant). Tenant scoping continues to be enforced by RLS (tenant_id = current_tenant_id_strict). Class H now matches SI-023 §7 exactly.

**v0.6 DRAFT 2026-05-22 — R5 closure applied (1 HIGH within-scope; no hard-floor escalation):**

- **R5 HIGH-1 closed:** the v0.5 R4 HIGH-1 closure said "operator recovers original review_id via canonical admin SQL surface (direct SELECT)" — but admin_basic_operator only holds EXECUTE on wrappers (per the SECDEF-wrapper-only canonical read path from R1 HIGH-1), so the recovery path was neither part of the 5-endpoint API surface NOR concretely provisioned in RBAC/cutover/preflight. Recovery would have required ad-hoc privileged database access bypassing the Cat A admin action audit model + hard to test before pilot. Fix: formalized the lost-response recovery as a concrete operational runbook reusing the canonical P-040 break-glass framework. Three concrete adds: (a) §4 endpoint #4 contract now specifies break-glass-role identity (`platform_operator_breakglass`, established at P-040 §8.1 class H) + exact recovery SQL (canonical query with parameterized tenant_id + forms_template_id + latest-state filter) + tenant-binding check (cross-tenant break-glass requires multi-operator sign-off per I-024 platform-floor) + audit-emission identity (`breakglass.admin_template_submit_recovery_query` via the canonical break-glass framework's audit infrastructure — NOT one of the 6 SI-023 audit events in §3; handled by the existing framework reused unchanged); (b) §8.1 class H extended with SI-023-specific assertions verifying `platform_operator_breakglass` holds SELECT on `forms_template_admin_review` + `forms_template_admin_review_lifecycle_transition` (extending the canonical break-glass-allowed-read-set per P-040 class H allowlist) AND rejecting any other-role SELECT grants on these entities outside the canonical 4-role allowlist (3 wrapper-owners + break-glass); (c) post-pilot v1.1 hardening path preserved (two-option choice: API-driven lookup endpoint OR submit-side idempotency-key). **No new P-042 endpoints + no new audit-event action_ids + no fork from SI-023.** The recovery path is mechanically specified + auditable (via break-glass framework) + preflight-verifiable (class H extension).

**v0.5 DRAFT 2026-05-22 — R4 closure applied (1 HIGH within-scope; no hard-floor escalation):**

- **R4 HIGH-1 closed:** the v0.4 R3 HIGH-2 closure documented retry semantics that pointed clients at `GET /v1/admin/template-reviews?forms_template_id={template_id}&latest_state=pending_review` for lost-response recovery — BUT that GET endpoint is NOT one of the 5 endpoints in §4's OpenAPI scope (which matches SI-023 §5 exactly: 3 dashboard GETs + submit POST + decision POST). The retry contract therefore depended on a read path outside the deployed API surface; a client losing the original submit response would have no documented way to recover the committed review_id. Worse: adding a 6th endpoint to P-042's amendment would silently fork from SI-023 RATIFIED §5 (which the post-P-029 SI-spec-first promotion pattern explicitly prohibits). Fix: rescoped the lost-response recovery as **operational rather than API-driven** for pilot scope — the operator recovers the original review_id via the canonical admin SQL console (direct SELECT against `forms_template_admin_review` joined to the lifecycle_transition table). Pilot-acceptability rationale documented: day-1 pilot tenants operate with small admin-operator teams + lost-response retries on initial-submission are expected to be infrequent + operational SQL-console recovery is acceptable for pilot. Post-pilot v1.1 hardening path explicitly enumerated with TWO options: (a) add a `GET /v1/admin/template-reviews` lookup endpoint with admin_basic_operator RBAC + tenant isolation + Cat A audit emission per dashboard-read pattern; OR (b) submit-side idempotency-key support extending the wrapper signature + new `admin_submit_idempotency_key` entity. Choice between (a) and (b) is a v1.1 ratifier decision based on observed retry-storm profile. No P-042 OpenAPI surface changes; SI-023 §5 5-endpoint scope preserved verbatim.

**v0.4 DRAFT 2026-05-22 — R3 closures applied (2 HIGH; both within-scope; no hard-floor escalation):**

- **R3 HIGH-1 closed:** the 3 admin dashboard views (`admin_crisis_operational_health_v` + `admin_consult_queue_health_v` + `admin_mode1_volume_health_v`) had JOIN-multiplication bugs in v0.1-v0.3 that would have corrupted operational counts: tenant-only joins to `audit_event` (1:N) combined with multiple-LEFT-JOIN to child tables (consult_review_claim 1:N, notification_crisis_escalation_obligation 1:N, crisis_sweep_execution 1:N) would have inflated `COUNT(*)`-based metrics by N×M×K cardinality. Operators would have seen false crisis/queue backlog counts + made staffing/escalation decisions from corrupted numbers. Fix: rewrote each view body using CTEs that aggregate each fact source independently per-tenant FIRST, then join into the per-(severity / program_id, current_state) rollup at the outer SELECT. Tenant scope bound by a `tenant_scope` CTE wrapping `current_tenant_id_strict`. `admin_mode1_volume_health_v` was already redesigned at R1 HIGH-1 closure to use scalar subqueries (avoided this bug class structurally); R3 HIGH-1 retroactively confirms that pattern + applies it to the other 2 views.
- **R3 HIGH-2 closed:** the submit-for-review endpoint contract in v0.1-v0.3 said "requires `Idempotency-Key` HTTP header" — but the canonical SI-023 `submit_forms_template_for_admin_review(tenant_id_t, UUID)` wrapper signature does NOT accept an idempotency_key parameter, and there is no submit-side idempotency-key table in the CDM. Advertising the header would have been misleading: clients sending it would expect canonical idempotent-replay semantics (lost-response retry returns the original review_id) but the wrapper has no way to deliver that — a retry would hit the active-review guard at the BEFORE INSERT trigger and return `admin-template-submit-already-in-flight` 40001 instead. Fix: removed the header requirement from §4 endpoint #4; added explicit retry-semantics documentation — lost-response retry on initial-submission path raises 40001 → HTTP layer surfaces 409 Conflict → client polls `GET /v1/admin/template-reviews?forms_template_id={template_id}&latest_state=pending_review` to recover the original review_id; revision-resubmission path is naturally idempotent at the wrapper layer (re-submits reuse existing review_id; concurrent re-submits serialize at the parent-template FOR UPDATE lock). Submit-side idempotency-key support deferred to post-pilot Admin Backend v1.1 if/when observed retry-storm frequency justifies it. Decision wrapper (record_forms_template_admin_decision) idempotency-key requirement preserved unchanged — endpoint #5 still requires the header (per the R1 HIGH-2 closure + R13 HIGH-2 SI-023 closure cascade).

**v0.3 DRAFT 2026-05-22 — R2 hard-floor item 6 escalation RATIFIER DECISION: Option A (Evans chat-message ratification 2026-05-22):**

- **R2 HIGH-1 (Codex re-verification on v0.2) — STATUS: REJECTED AT RATIFIER on the merits.** Codex R2 flagged the `record_forms_template_admin_decision` wrapper body (verbatim lift from SI-023 v1.0 RATIFIED Sub-decision 4) as architecturally fragile because retry safety depends on the canonical caller contract (single-tx call + propagate 40001 → HTTP-layer retry) rather than structural in-wrapper enforcement. The wrapper inserts the lifecycle transition + conditional publish UPDATE + audit emissions BEFORE the idempotency-key INSERT; if the idempotency-key INSERT hits unique_violation, the EXCEPTION handler raises 40001 which propagates to the caller — and if the caller violates the canonical contract (catches 40001 inside a savepoint + commits anyway), a user-visible publish lands without a durable idempotency record.
- **Per CLAUDE.md hard-floor item 6 discipline:** Claude STOP-and-escalated rather than closing inline. ERR authored at `Telecheck_v1_10_PRD_Update/Engineering-Review-Request-P-042-R2-Decision-Wrapper-Idempotency-Ordering-2026-05-22.md` (commit `11e6ba3`) with 3 options: A (preserve verbatim; reject Codex R2 on merits); B (preserve verbatim + open SI-023 v1.1 hygiene cycle + block telecheck-app implementation of decision wrapper until v1.1 ratifies); C (hot-fix SI-023 RATIFIED in place via novel P-041a supplemental ratification).
- **Dual-recommendation + two-pass Codex consult per CLAUDE.md commits `f3a6469` + `4f42a00`:** Claude recommendation = Option A (CLAUDE.md "do not silently fork" + SI-023 R1-R17 convergence already settled ordering question + canonical caller contract makes ordering safe + Promotion Ledger immutability disfavors C); Codex Pass-1 source-first independent = Option B+implementation-hold (ratifying known-fragile pattern is worse than deferring; preserve P-042 verbatim BUT open SI-023 v1.1 BEFORE telecheck-app implements); Codex Pass-2 contrast-and-synthesize = Option B+implementation-hold (synthesis caught framing defect in Claude's Option A: "preserving a flawed source contract is not a reason to let telecheck-app implement it"; also caught Pass-1 framing gap: Option B must be explicit implementation gate, not optional cleanup).
- **Three-way disagreement → Claude did NOT auto-proceed per auto-proceed rule** (Claude vs Codex Pass-2 disagreed). Three-way surfaced to Evans in chat with plain-English explanation of Option A practical implications (ships P-042 this week; zero SI-bundle drift; bets the canonical caller contract gets implemented correctly; 1-2 weeks saved vs Option B).
- **Evans's verbatim ratifier decision 2026-05-22:** "We go with A".
- **Per Option A action steps (ERR §7):** v0.3 DRAFT records R2 finding as rejected at ratifier with rationale; no wrapper-body changes; re-run Codex R3 adversarial review on v0.3; continue P-042 convergence to APPROVE; P-042 ratification ceremony per established post-P-029 SI-spec-first pattern.
- **What Option A trusts:** the canonical HTTP-handler pattern: `BEGIN; CALL record_forms_template_admin_decision(...); COMMIT;` with `ROLLBACK` on 40001 + retry at HTTP-layer. Telecheck-app implementation guidance + code review + integration tests catch caller-contract violations BEFORE they ship. Pilot scope acceptable.
- **What Option A defers to post-pilot (if needed):** if a future cycle decides the structural-vs-contractual safety dependency is material, that becomes a Track 6 / SI-023 v1.1 hygiene cycle concern — NOT a P-042 R2 inline closure. P-042 ships now; v1.1 hygiene is a separate ratification later if observed defect data justifies it.

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
