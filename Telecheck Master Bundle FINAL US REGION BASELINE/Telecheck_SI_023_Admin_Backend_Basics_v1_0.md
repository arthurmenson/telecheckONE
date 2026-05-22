# SI-023 — Admin Backend Basics Slice (Operator Monitoring + Manual Template Review) Spec v1.0

**Version:** 0.2 DRAFT
**Status:** POST-R1 (3 HIGH + 1 MED closed inline: R1 HIGH-1 dashboard audit was application-convention only — direct SELECT on admin views by admin_basic_operator could bypass the record-only audit wrapper; class N preflight comparison was after-the-fact. Fix: restructured to SECDEF-wrapper-only canonical read path — 3 dashboard surfaces exposed via 3 SECDEF read-wrappers (read_admin_crisis_operational_health + read_admin_consult_queue_health + read_admin_mode1_volume_health); direct SELECT on the 3 views REVOKEd from admin_basic_operator; views GRANT SELECT only to the corresponding wrapper-owner role; wrapper body INSERTs audit row + emits Cat A audit + reads view in SAME tx with FLOOR-020 fail-closed pattern. Class N becomes defensive database-integrity tripwire, not primary enforcement. R1 HIGH-2 Mode 1 dashboard Surface 3 deferred canonical view + granted admin_basic_operator membership in ai_mode1_reader (over-broad). Fix: landed canonical admin_mode1_volume_health_v view NOW (not deferred to v1.1); minimized columns (aggregate counts + Cat A emission counts; NO raw conversation text / patient_id); admin_basic_operator NOT made member of ai_mode1_reader. R1 HIGH-3 record_forms_template_admin_decision wrapper lacked latest-state lock — concurrent reviewers could append conflicting terminal transitions + dual-publish forms_template.status. Fix: wrapper now performs SELECT...FOR UPDATE on review row + idempotency-key check + latest-state derivation under lock + rejects non-pending latest state + idempotency for repeated identical decision requests. Added admin_template_decision_idempotency_key entity (canonical IDEMPOTENCY contract per P-027). R1 MED-1 OQ5 1% production tolerance for Cat A dashboard audit-completeness undermined FLOOR-020 fail-closed. Fix: tightened to 0% production AND staging — post-R1 HIGH-1 the SECDEF wrapper is canonical read path so audit-row creation is structurally co-transactional; drift can ONLY occur via database-integrity defects.)
**Authoring date:** 2026-05-22
**Trigger:** Master Completion Plan v1.0 pilot-viable scope item 5 of 5 (Admin Backend basics — operator monitoring + manual template review). FIFTH and FINAL pilot-required slice; once ratified the telecheck-app pilot implementation gate opens fully (4 of 5 already FULLY RATIFIED at P-034/P-036/P-038/P-040 SI+CDM landings).
**Owner:** Admin Backend slice owner + Tenant Operator UX lead + Forms-Intake slice owner + Platform Audit owner + CDM owner + RBAC owner.
**Parent documents:** Admin Backend Slice PRD v1.1 (full ecom backend; this SI is the NARROW pilot subset); Forms-Intake Engine Slice PRD v2.1 (template publish flow); Master Completion Plan v1.0 §A.5.
**Companion documents:**
- P-040 SI-022 + CDM v1.10 + AUDIT_EVENTS v5.12 (crisis_event_current_state_v staff reader; audit_events_partition read surface)
- P-038 SI-020 + CDM v1.9 (consult_lifecycle staff summary view; consult event stream)
- P-036 Mode 1 CDM v1.8 (ai_mode1_conversation read surface)
- P-034 SI-019 + CDM v1.7 (medication_request + interaction_signal staff streams)
- P-027 §4.66-4.68 notification_crisis_* dispatch_ledger / provider_attempt / escalation_obligation read surface
- P-031 SI-024.1 v0.8 (verify_session_jwt_and_extract_claims canonical trust anchor)
- I-019 (crisis-detection-always-on platform-floor); I-027 (audit append-only); I-035 (append-only invariant for audit-bound state machines); FLOOR-020 (Cat A fail-closed audit emission)
- Forms-Intake forms_template entity (canonical from P-026 batched ratification; subject to Admin Backend approve/publish workflow per Sub-decision 4)

**Companion invariants:**
- I-019, I-023, I-026, I-027, I-035, FLOOR-020 (all preserved unchanged; no new platform-floor invariants from SI-023; out-of-scope)

---

## 1. Purpose + scope

The Admin Backend Basics slice defines the canonical platform-floor pilot-scope admin surface that tenant operator teams (Telecheck-US / Heros Health DBA staff; Telecheck-Ghana / Heros Health Ghana DBA staff) use to (a) monitor operational health of the slices they are accountable for AND (b) approve/publish form templates submitted via the Forms-Intake Engine builder. **It is intentionally NARROWER than the full Admin Backend Slice PRD v1.1** — the v1.1 PRD covers gold-standard ecom backend (inventory, pricing rules, discount codes, affiliate, conversion dashboards, AI-assisted operator features) that lands post-pilot per Master Completion Plan v1.0 "Realistic pilot launch" carve-out. SI-023's narrow pilot-scope deferrs the ecom features to the post-pilot Admin Backend full-implementation cycle.

**In scope (pilot-required):**

1. **Operator monitoring dashboards** — read-only views over already-ratified canonical streams (crisis events + consult lifecycles + Mode 1 conversations + medication requests + interaction signals + notification dispatch ledger + escalation obligations + audit events). Three dashboard surfaces: (a) Crisis Response operational health; (b) Async-Consult queue + lifecycle health; (c) Mode 1 conversation volume + safety-floor emission rates. All surfaces tenant-scoped via SI-024.1 JWT-binding; admin role MUST be `admin_basic_operator` (a NEW pilot-narrow role; deferred from `tenant_admin` which is the full v1.1 scope). Data-minimization split per P-038 R5 + P-040 R1 HIGH-2 pattern: admin reader roles distinct from clinician reader roles distinct from patient reader roles.
2. **Manual template review workflow** — Forms-Intake Engine forms_template entities pass through a manual `pending_admin_review` state before reaching `published`; admin reviewer (role `admin_template_reviewer`) inspects template body + AI guardrail check output + decides approve / reject / request_revision. Append-only review lifecycle (Option A per I-035; matches consult_lifecycle_transition pattern from P-038).
3. **3 net-new CDM entities**: `admin_dashboard_query_execution` (audit trail of who-viewed-what-when on admin dashboards; satisfies I-027 audit completeness on admin read paths per Sub-decision 5); `forms_template_admin_review` (review lifecycle entity); `forms_template_admin_review_lifecycle_transition` (append-only log per I-035).
4. **2 OPTIONAL canonical views**: `admin_crisis_operational_health_v` + `admin_consult_queue_health_v` (tenant-scoped via current_tenant_id_strict; both `security_invoker=true + security_barrier=true`; granted to `admin_basic_operator` role only).
5. **4 SECURITY DEFINER procedures**: 1 raw `record_forms_template_admin_review_transition()` + 3 wrappers (`submit_forms_template_for_admin_review` + `record_forms_template_admin_decision` + `record_admin_dashboard_query_execution`).
6. **6 new audit events** under `admin.*` namespace (4 Cat A + 2 Cat C; final tally subject to Codex review).
7. **5 new OpenAPI endpoints** under `/v1/admin/*` (pilot-narrow subset; full Admin Backend v1.1 endpoint scope deferred).
8. **1 new state machine `forms_template_admin_review_lifecycle`** (DERIVED from append-only transitions per I-035; CHECK constraint enumerates the canonical triples; subject to Codex review for final count).
9. **8 new RBAC roles** (2 admin application + 3 wrapper-owner + 1 raw-writer-owner + 2 view-owner).

**Out of scope (deferred to post-pilot Admin Backend full-implementation cycle):**

- Per-tenant Stripe / Paystack admin (full Admin Backend v1.1)
- Inventory management
- Pricing rules and discount codes
- Affiliate program (MVP)
- Conversion dashboards / AI-assisted operator features
- Multi-tenant management surface (creating new tenants / configuring country / configuring consumer-DBA brand assets / aggregate cross-tenant metrics)
- Forms-Intake visual builder (the BUILDER UI itself; SI-023 only handles the REVIEW workflow for templates that arrive from the builder)
- Discount code engine + audit
- Bulk operator actions (export, mass-update, etc.)
- INVARIANTS bump (no new platform-floor invariants; all closures align with I-019 + I-023 + I-026 + I-027 + I-032 v5.3 + I-035 + FLOOR-020)

---

## 2. Sub-decisions

### Sub-decision 1 — Pilot admin role hierarchy (TWO new roles only)

Pilot scope introduces exactly TWO new admin application roles (NOT the full RBAC v1.1 tenant_admin hierarchy):

| Role | Scope | Granted to | Permitted actions |
|---|---|---|---|
| `admin_basic_operator` | tenant-scoped via current_tenant_id_strict | tenant operator staff (Telecheck-US / Telecheck-Ghana operator teams) | EXECUTE on `read_admin_crisis_operational_health` + `read_admin_consult_queue_health` + `read_admin_mode1_volume_health` SECDEF dashboard-read wrappers (R1 HIGH-1 closure 2026-05-22 — SECDEF wrappers are the SOLE canonical read path; direct SELECT on admin views is NOT granted to admin_basic_operator). NO membership in any other reader role (R1 HIGH-2 closure 2026-05-22 — explicitly NOT a member of ai_mode1_reader; Mode 1 dashboard surface has its own minimized canonical view per Sub-decision 2 Surface 3). |
| `admin_template_reviewer` | tenant-scoped | tenant operator staff with template-review responsibility (subset of admin_basic_operator OR overlapping membership) | EXECUTE on submit_forms_template_for_admin_review + record_forms_template_admin_decision wrappers; SELECT on forms_template_admin_review entity for own tenant's pending reviews |

Both roles are tenant-scoped via the canonical SI-024.1 JWT-binding pattern; admin actions on tenant T are gated by JWT claims binding the operator to tenant T. Cross-tenant admin actions are EXPLICITLY OUT OF SCOPE for pilot (deferred to post-pilot Admin Backend v1.1).

The full Admin Backend v1.1 `tenant_admin` role (with broader privileges including ecom management) is deferred to the post-pilot Admin Backend cycle; pilot uses only the narrower 2-role pair to keep the privilege boundary tight + auditable.

### Sub-decision 2 — Operator monitoring dashboards (3 surfaces)

**R1 HIGH-1 closure 2026-05-22 — wrapper-only canonical read path:** for each surface below, the view itself is OWNED by the corresponding view-owner role and has SELECT REVOKED FROM PUBLIC + GRANTed ONLY to the surface's SECDEF read-wrapper-owner role; the SECDEF read-wrapper (Sub-decision 3.5 below) is the SOLE canonical read path. admin_basic_operator does NOT receive direct SELECT on views; admin_basic_operator only receives EXECUTE on the read-wrappers. Direct view reads from any other role/SQL-console/alternate-service path are blocked at the privilege boundary. The view body still uses `current_tenant_id_strict` for tenant isolation (defense-in-depth — if a wrapper bug accidentally returned cross-tenant rows, tenant RLS would still catch it). The §8.1 preflight class N + class P (NEW) enforce the grant-matrix invariant: NO role other than the canonical wrapper-owner pair holds direct SELECT on the admin views.

#### Surface 1: Crisis Response operational health (`admin_crisis_operational_health_v`)

Tenant-scoped view aggregating canonical crisis-domain entities (P-027 §4.66-4.68 + P-040 §4.NEW1-3). Columns:
- Tenant-scoped count of active crisis events (lifecycle current_state IN ('detected', 'escalated', 'acknowledged', 'responded')) by severity
- Tenant-scoped count of escalation obligations past undeliverable_deadline (sweep backlog)
- Tenant-scoped count of crisis_sweep_execution rows where completed_at IS NULL AND claim_expires_at < now() (stale sweeps requiring takeover)
- Aggregate average tier (care_team / clinical_on_call / regulatory) of active obligations
- Recent (last 24h) audit-event volume per Cat A action_id under `crisis.*` namespace

View predicate enforces tenant isolation via `tenant_id = current_tenant_id_strict('admin_crisis_operational_health_v')`; admin_basic_operator role required.

#### Surface 2: Async-Consult queue + lifecycle health (`admin_consult_queue_health_v`)

Tenant-scoped view over P-038 `consult` + `consult_lifecycle_transition` + `consult_review_claim` entities. Columns:
- Tenant-scoped count of consults by current lifecycle state
- Average time-to-first-clinician-claim (claim_at - created_at) by program_id
- Active review claims with claim_expires_at < now() (orphan claim backlog)
- Recent (last 24h) audit-event volume per Cat A action_id under `async_consult.*` namespace

View predicate enforces tenant isolation via current_tenant_id_strict; admin_basic_operator role required.

#### Surface 3: Mode 1 conversation volume + safety-floor emission rates (`admin_mode1_volume_health_v`)

**R1 HIGH-2 closure 2026-05-22 — canonical minimized view (NOT deferred):** the prior v0.1 plan to aggregate in-process via admin_basic_operator membership in `ai_mode1_reader` was over-broad — admin_basic_operator does NOT need raw ai_mode1_conversation read; only aggregated volume + safety-floor emission metrics. Landing the canonical minimized view NOW (rather than deferring to v1.1) preserves the P-038 R5 + P-040 R1 HIGH-2 data-minimization split discipline.

Tenant-scoped view aggregating P-036 ai_mode1_conversation (counts only; NO raw conversation_text exposed) + P-035 FLOOR-020 audit emissions. Columns:
- Tenant-scoped count of active Mode 1 conversations (last 24h)
- Tenant-scoped count of `mode1.crisis_detection_trigger` Cat A audit emissions (last 24h)
- Tenant-scoped count of `mode1.safety_floor_response_emitted` Cat A audit emissions (last 24h)
- Tenant-scoped p50/p95 conversation duration
- NO raw text columns; NO patient_id exposure beyond aggregate counts

View predicate enforces tenant isolation via `tenant_id = current_tenant_id_strict('admin_mode1_volume_health_v')`. Owner: `admin_mode1_volume_health_view_owner` (non-BYPASSRLS); SELECT GRANTed ONLY to `read_admin_mode1_volume_health_wrapper_owner` (NOT to ai_mode1_reader or admin_basic_operator directly). Application calls the SECDEF wrapper (Sub-decision 3.5) which audits + returns aggregated row.

admin_basic_operator is EXPLICITLY NOT made a member of ai_mode1_reader (closes R1 HIGH-2).

### Sub-decision 3 — Audit completeness on admin read paths (I-027 closure for dashboards)

Per I-027 audit append-only invariant: EVERY admin dashboard read MUST be audited. SI-023 introduces the `admin_dashboard_query_execution` entity to record (query timestamp, executor principal_id, tenant_id, dashboard surface, query parameters, row count returned). **R1 HIGH-1 closure 2026-05-22 — the audit emission is STRUCTURALLY enforced via SECDEF read-wrappers (NOT application convention):** the 3 dashboard surfaces are exposed ONLY through 3 SECDEF read-wrappers (Sub-decision 3.5 below); direct SELECT on the underlying views is REVOKEd from all application roles. Audit row INSERT + Cat A emission + view SELECT all happen in the SAME transaction inside the wrapper body; the wrapper returns the dashboard rows only after the audit row + Cat A emission have committed (FLOOR-020 fail-closed: if the audit INSERT fails the wrapper RAISES → no rows returned to caller). Direct DB reads bypassing the wrapper are blocked at the privilege boundary (admin_basic_operator does NOT hold SELECT on the views; only the wrapper-owner roles do).

### Sub-decision 3.5 — SECDEF read-wrappers (canonical dashboard read path; R1 HIGH-1 closure 2026-05-22)

Three SECDEF read-wrappers, each owned by a distinct wrapper-owner role that holds SELECT on the corresponding view (the SOLE roles that hold direct SELECT on the views per Sub-decision 6 + class P preflight allowlist):

| Wrapper | Owner role | Granted to | Reads view |
|---|---|---|---|
| `read_admin_crisis_operational_health(p_tenant_id, p_query_params_jsonb) RETURNS TABLE(...)` | `read_admin_crisis_operational_health_wrapper_owner` | admin_basic_operator | admin_crisis_operational_health_v |
| `read_admin_consult_queue_health(p_tenant_id, p_query_params_jsonb) RETURNS TABLE(...)` | `read_admin_consult_queue_health_wrapper_owner` | admin_basic_operator | admin_consult_queue_health_v |
| `read_admin_mode1_volume_health(p_tenant_id, p_query_params_jsonb) RETURNS TABLE(...)` | `read_admin_mode1_volume_health_wrapper_owner` | admin_basic_operator | admin_mode1_volume_health_v |

Wrapper body pattern (each wrapper follows the same shape; differences are which view is queried):

```sql
CREATE OR REPLACE FUNCTION read_admin_crisis_operational_health(
    p_tenant_id tenant_id_t,
    p_query_params_jsonb JSONB
) RETURNS TABLE (...)  -- column list matching admin_crisis_operational_health_v
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_row_count INTEGER;
BEGIN
    -- 1. Verify caller authorization: must be admin_basic_operator for the tenant
    --    (canonical SI-024.1 JWT-binding check)
    PERFORM 1 FROM verify_session_jwt_and_extract_claims() vc
    WHERE vc.verified_tenant_id = p_tenant_id
      AND pg_has_role(current_user, 'admin_basic_operator', 'MEMBER');
    IF NOT FOUND THEN
        RAISE EXCEPTION 'admin-dashboard-unauthorized: caller % is not admin_basic_operator for tenant %', current_user, p_tenant_id
            USING ERRCODE = '42501';
    END IF;

    -- 2. Read the view + capture row count (atomic with the audit emission below)
    --    Read happens under the wrapper owner's privilege (SECURITY DEFINER), which
    --    is the only role that holds SELECT on admin_crisis_operational_health_v.
    CREATE TEMP TABLE _admin_crisis_query_result ON COMMIT DROP AS
        SELECT * FROM admin_crisis_operational_health_v
        WHERE tenant_id = p_tenant_id;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;

    -- 3. Insert audit row + emit Cat A audit event in the SAME transaction
    --    (FLOOR-020 fail-closed pattern: if either fails the transaction rolls back
    --    and no rows are returned to the caller).
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

    -- 4. Return the cached query result to the caller
    RETURN QUERY SELECT * FROM _admin_crisis_query_result;
END;
$$;

ALTER FUNCTION read_admin_crisis_operational_health(tenant_id_t, JSONB)
    OWNER TO read_admin_crisis_operational_health_wrapper_owner;
REVOKE EXECUTE ON FUNCTION read_admin_crisis_operational_health(tenant_id_t, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION read_admin_crisis_operational_health(tenant_id_t, JSONB)
    TO admin_basic_operator;
```

The remaining 2 wrappers (`read_admin_consult_queue_health` + `read_admin_mode1_volume_health`) follow the identical shape against their respective views + audit `dashboard_name` payload values. All 3 SECDEF read-wrappers + the existing 1 record-only wrapper (`record_admin_dashboard_query_execution`, retained for cross-slice callers that need to record an audit row without performing a read) total 4 dashboard wrappers; § 1 + §3 + §7 RBAC enumeration updated accordingly. **The wrapper-only canonical read path means class N audit-completeness assertion (Sub-decision 3) becomes a defensive check on database-integrity drift rather than a primary enforcement mechanism — the structural enforcement is the privilege boundary itself.**

### Sub-decision 4 — Manual template review workflow

Forms-Intake Engine `forms_template` entities (canonical from P-026 batched ratification) enter SI-023's review workflow when an operator-facing builder UI calls `submit_forms_template_for_admin_review(p_tenant_id, p_template_id)` SECURITY DEFINER wrapper. The wrapper:
1. Creates `forms_template_admin_review` row with state = `pending_review`
2. INSERTs `forms_template_admin_review_lifecycle_transition` (none → pending_review / initial_submission)
3. Emits `admin.template_submitted_for_review` Cat A audit
4. Returns review_id to the builder UI

Admin reviewer (admin_template_reviewer role) calls `record_forms_template_admin_decision(p_tenant_id, p_review_id, p_decision, p_decision_payload, p_idempotency_key)` where `p_decision ∈ {approve, reject, request_revision}`. Wrapper (**R1 HIGH-3 closure 2026-05-22 — concurrency-safe via row-level lock + idempotency-key**):

1. Begin tx; verify caller is admin_template_reviewer for the tenant (JWT-bound)
2. **`SELECT ... FOR UPDATE` on `forms_template_admin_review` row** matching (tenant_id, review_id) — acquires per-row write lock; concurrent decision attempts block until this tx commits or rolls back
3. **Idempotency check via `p_idempotency_key`:** if an `admin_template_decision_idempotency_key` row with the same (tenant_id, review_id, idempotency_key) already exists AND its decision matches `p_decision`, return success (idempotent replay; no second transition emitted). If the same key exists with a DIFFERENT decision, RAISE `idempotency-key-decision-mismatch` (caller bug; not safe to retry)
4. **Latest-state derivation under lock:** read the latest `forms_template_admin_review_lifecycle_transition` row for the same (tenant_id, review_id), ordered by `transition_at DESC, id DESC LIMIT 1`. The latest `to_state` MUST be `pending_review` — if NOT, RAISE `admin-template-decision-non-pending-latest-state` (one of: already approved/rejected/revision_requested — terminal or in-flight cycle by another reviewer)
5. INSERTs lifecycle transition (pending_review → approved / clinician_decision_approve, OR pending_review → rejected / clinician_decision_reject, OR pending_review → revision_requested / clinician_decision_request_revision)
6. On approve: updates forms_template.status to `published` (the wrapper IS the canonical publish path; direct UPDATE on forms_template.status by other roles is REVOKEd)
7. INSERTs `admin_template_decision_idempotency_key` row recording (tenant_id, review_id, idempotency_key, decision, decided_at, decider_principal_id)
8. Emits `admin.template_review_decision` Cat A audit + the appropriate decision-specific Cat A audit
9. Returns void; tx commits; lock released

Behavior under concurrent dual-reviewer attempts:
- Reviewer A and Reviewer B both call the wrapper for the same review_id concurrently with different decisions
- One of A/B wins the `SELECT ... FOR UPDATE` lock; that tx proceeds through steps 3-8 + commits + releases the lock
- The other tx (which was blocked on the lock) now reads the latest transition row + finds it is NO LONGER `pending_review` (e.g., now `approved`) → RAISE `admin-template-decision-non-pending-latest-state` → tx rolls back; no second transition emitted; no second publish; no second audit emission
- The losing reviewer sees a clear actionable error pointing to the prior decision (decided_at + decider_principal_id from the row that won)

Behavior under idempotent retry (network blip; same caller retries with same idempotency_key):
- Step 3 finds the existing idempotency_key row with matching decision → return success without emitting a second transition or second audit
- This is the canonical retry-safety pattern + matches the IDEMPOTENCY contract from P-027

State machine `forms_template_admin_review_lifecycle` (DERIVED from append-only transitions per I-035): 5 states (none / pending_review / approved / rejected / revision_requested); 5 transition triples (see §6).

State machine `forms_template_admin_review_lifecycle` (DERIVED from append-only transitions per I-035): 5 states (none / pending_review / approved / rejected / revision_requested); 4 transition triples (see §6).

### Sub-decision 5 — Anti-bypass discipline (SECDEF wrapper EXECUTE allowlists)

The 4 SECURITY DEFINER procedures (1 raw + 3 wrappers) follow the canonical anti-bypass discipline established at P-034 §3 + P-038 §3 + P-040 §3:
- Raw writer `record_forms_template_admin_review_transition()` owned by `forms_template_admin_review_transition_writer_owner`; EXECUTE granted to EXACTLY the 3 wrapper-owner roles (no other roles)
- 3 wrappers granted EXECUTE only to canonical caller-class roles per §7

§8.1 preflight class O (NEW assertion symmetric to P-040 class I): rejects any SECDEF routine that depends on the 2 admin views OR the forms_template_admin_review entities unless on canonical allowlist (which is EMPTY at v1.0 — the 4 §3 wrappers operate on base tables, not on the views).

### Sub-decision 6 — Data-minimization split + tenant-scoped read enforcement

Per P-038 R5 HIGH-1 + P-040 R1 HIGH-2 pattern:
- Admin views are tenant-scoped (admin_basic_operator membership + tenant_id = current_tenant_id_strict predicate inside view body)
- Admin reader role distinct from clinician reader (clinician roles do NOT have SELECT on admin_*_v views; admin role does NOT have SELECT on clinician-specific data-minimization views like crisis_event_patient_summary_v)
- View definitions enforce tenant isolation via SI-024.1 verify_session_jwt_and_extract_claims canonical pattern

### Sub-decision 7 — Open questions for ratifier

1. **OQ1 — Codex pre-ratification target rounds.** Recommendation: 6-10 rounds (smaller scope than P-039 SI-022's 67-round outlier; closer to P-037 SI-020's 11 or P-035 Mode 1's 8 cycle profile).
2. **OQ2 — Mode 1 dashboard surface canonical view.** Should SI-023 v1.0 introduce a third canonical view `admin_mode1_volume_health_v` OR defer Mode 1 dashboard surface to a v1.1 cycle? Recommendation: defer to v1.1 (Mode 1 metrics are well-served by aggregating ai_mode1_conversation rows in-process at the dashboard endpoint; canonical view adds complexity for limited value at pilot scope).
3. **OQ3 — Template review approval requires AI guardrail output snapshot.** Should `forms_template_admin_review` carry a snapshot of the AI guardrail check result OR re-query at decision time? Recommendation: snapshot at submission (forms_template_admin_review.ai_guardrail_snapshot_jsonb) for deterministic review semantics; re-query on revision_requested → re-submission cycle.
4. **OQ4 — Per-tenant configurable admin notification channel for template reviews.** Should admin reviewers receive a notification (email/SMS/in-app) when a template enters pending_review? Recommendation: defer to v1.1 (pilot uses dashboard polling; v1.1 adds tenant.admin.template_review_notification_channel CCR key + dispatch_ledger row at submission).
5. **OQ5 — Audit completeness preflight tolerance.** Sub-decision 3 §8.1 class N asserts audit-completeness over 24h windows. **Recommendation: 0% tolerance for BOTH production and staging environments (R1 MED-1 closure 2026-05-22 — was 1% production tolerance in v0.1; tightened to 0% because admin dashboard reads are Cat A audit events under FLOOR-020 fail-closed discipline AND post-R1 HIGH-1 the SECDEF wrapper is the canonical read path so audit-row creation is structurally co-transactional with the read — drift can ONLY occur via database-integrity defects, NOT via missing audit emissions on legitimate reads).** Class N becomes a tripwire for database-integrity defects (e.g., manual DELETE on admin_dashboard_query_execution rows outside canonical APIs); any drift > 0 raises `admin-dashboard-audit-completeness-violation` regardless of environment.

---

## 3. New audit events (6 = 4 Cat A + 2 Cat C)

To be detailed in v0.2 against Sub-decision 3 + 4 + 5 normative requirements. Anchor namespace: `admin.*`.

Preliminary enumeration:
- Cat A: `admin.dashboard_query_executed` (Sub-decision 3); `admin.template_submitted_for_review` (Sub-decision 4); `admin.template_review_decision` (Sub-decision 4 — payload includes decision enum); `admin.template_published_via_review_workflow` (Sub-decision 4 — emitted on approve transition; canonical publish-path audit)
- Cat C: `admin.dashboard_query_audit_completeness_violation` (preflight-detected Sub-decision 3 violation); `admin.template_review_anti_bypass_violation` (caught by §8.1 class O)

Final tally subject to Codex review.

---

## 4. New CDM entities (3 active)

To be detailed in v0.2 with executable DDL + RLS + composite tenant-scoped FKs. Preliminary skeleton:

### §4.NEW1 — `admin_dashboard_query_execution` (audit trail entity per Sub-decision 3)

```sql
CREATE TABLE admin_dashboard_query_execution (
    id BIGSERIAL PRIMARY KEY,
    tenant_id tenant_id_t NOT NULL,
    executor_principal_id UUID NOT NULL,
    dashboard_name TEXT NOT NULL CHECK (dashboard_name IN (
        'admin_crisis_operational_health_v',
        'admin_consult_queue_health_v',
        'admin_mode1_volume_health'  -- in-process surface; v1.1 may promote to view
    )),
    query_params_jsonb JSONB NULL,
    row_count INTEGER NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Composite tenant-scoped FK to principal
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

### §4.NEW2 — `forms_template_admin_review` (review lifecycle entity per Sub-decision 4)

To be detailed in v0.2. Identity: (tenant_id, review_id UUID). Columns: forms_template_id (composite FK to forms_template), submitter_principal_id, ai_guardrail_snapshot_jsonb (OQ3), current_state (derived from latest lifecycle_transition; mutable via the canonical wrappers only).

### §4.NEW3 — `forms_template_admin_review_lifecycle_transition` (append-only Option A per I-035)

To be detailed in v0.2. 5-state CHECK constraint on from_state/to_state/transition_reason triples; same monotonic-ordering trigger pattern as P-038 R2/R4 + P-040 §4.NEW2.

---

## 5. New OpenAPI endpoints (5 net-new under `/v1/admin/*`)

To be detailed in v0.2. Preliminary:

1. `GET /v1/admin/dashboards/crisis-operational-health` — reads admin_crisis_operational_health_v; requires admin_basic_operator role; emits dashboard_query_executed Cat A
2. `GET /v1/admin/dashboards/consult-queue-health` — reads admin_consult_queue_health_v; same role + audit pattern
3. `GET /v1/admin/dashboards/mode1-volume-health` — in-process aggregation from ai_mode1_conversation; same role + audit pattern
4. `POST /v1/admin/templates/{template_id}/submit-for-review` — calls submit_forms_template_for_admin_review wrapper; requires admin_basic_operator OR Forms-Intake builder role
5. `POST /v1/admin/template-reviews/{review_id}/decision` — calls record_forms_template_admin_decision wrapper; requires admin_template_reviewer role

---

## 6. New state machine `forms_template_admin_review_lifecycle`

DERIVED from append-only `forms_template_admin_review_lifecycle_transition` rows per I-035. 5 states (none / pending_review / approved / rejected / revision_requested). 4 transition triples (preliminary; subject to Codex review):

| from_state | to_state | transition_reason |
|---|---|---|
| `none` | `pending_review` | `initial_submission` |
| `pending_review` | `approved` | `clinician_decision_approve` |
| `pending_review` | `rejected` | `clinician_decision_reject` |
| `pending_review` | `revision_requested` | `clinician_decision_request_revision` |
| `revision_requested` | `pending_review` | `revision_resubmission` |

(Note: 5 triples enumerated above; OQ-relevant edge — should approved/rejected/revision_requested allow any onward transitions? Recommendation: NO — once approved the template is canonical-published and any subsequent change requires a new review cycle; once rejected the template is terminal; revision_requested cycles back to pending_review via re-submission.)

---

## 7. New RBAC roles (8 net-new)

To be detailed in v0.2; preliminary enumeration:
- Application roles (2): admin_basic_operator + admin_template_reviewer
- Wrapper-owner roles (3): forms_template_admin_review_submit_wrapper_owner + forms_template_admin_review_decision_wrapper_owner + admin_dashboard_query_wrapper_owner
- Raw-writer-owner role (1): forms_template_admin_review_transition_writer_owner
- View-owner roles (2): admin_crisis_operational_health_view_owner + admin_consult_queue_health_view_owner

---

## 8. Deployment preflight + cutover sequencing

To be detailed in v0.2; will reuse the canonical preflight DO block patterns established at P-040 §8.1 (classes A-M + G.2 + G.3 + H + I + J + K + L) adapted to admin-domain objects. NEW assertion class N (audit-completeness on admin dashboards per Sub-decision 3); class O (SECDEF dependency rejection on admin views + forms_template_admin_review entities).

Cutover sequencing per P-036 R6 tables-first-views-last pattern; 11 phases matching P-040 §8.2 shape; Phase 7.1 + 7.1.a + 7.2 CTAS provenance infrastructure REUSED from P-040 (admin views are new dependents in class K allowlist).

---

## 9. Cycle log

**v0.2 DRAFT 2026-05-22 — R1 closures applied (3 HIGH + 1 MED):**
- **R1 HIGH-1 closed:** restructured to SECDEF-wrapper-only canonical dashboard read path; 3 SECDEF read-wrappers (Sub-decision 3.5); direct SELECT REVOKEd from admin_basic_operator; audit + Cat A + view-read co-transactional under FLOOR-020 fail-closed. Class N becomes defensive integrity tripwire.
- **R1 HIGH-2 closed:** landed canonical `admin_mode1_volume_health_v` view at v1.0 (not deferred); minimized columns (no raw text / patient_id); admin_basic_operator NOT made member of ai_mode1_reader.
- **R1 HIGH-3 closed:** record_forms_template_admin_decision wrapper now SELECT...FOR UPDATE on review row + idempotency-key check + latest-state derivation under lock + rejects non-pending latest state + idempotency-key idempotency. Added `admin_template_decision_idempotency_key` entity.
- **R1 MED-1 closed:** OQ5 tolerance tightened 1% → 0% for production AND staging; rationale: post-R1 HIGH-1 SECDEF wrapper is canonical read path so audit-row drift can ONLY occur via database-integrity defects.

**v0.1 DRAFT 2026-05-22:** pre-Codex-review skeleton. §1 purpose + scope + §2 sub-decisions 1-7 outlined; §3 audit events preliminary; §4 entity #1 with executable DDL + skeleton for entities #2-3; §5-8 stubs to be filled in v0.2 against Codex review feedback + Sub-decision 7 OQ resolutions. Authored on `spec/SI-023-admin-backend-basics-2026-05-22` branch off main at `5852be3` (post-P-040 close-out). FIFTH and FINAL pilot-required slice; once ratified the telecheck-app pilot implementation gate opens fully.
