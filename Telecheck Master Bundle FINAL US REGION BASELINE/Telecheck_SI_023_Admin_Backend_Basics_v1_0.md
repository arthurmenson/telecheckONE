# SI-023 — Admin Backend Basics Slice (Operator Monitoring + Manual Template Review) Spec v1.0

**Version:** 0.10 DRAFT
**Status:** POST-R9 (2 HIGH closed inline: R9 HIGH-1 partial UNIQUE INDEX `forms_template_admin_review_one_active_per_template_uk` was declared inside §4.NEW2 (forms_template_admin_review section) BEFORE §4.NEW3 created the lifecycle_transition table; Phase 2 creates all 4 tables but no later phase creates indexes; cutover following the executable DDL would fail at index-creation time with `relation does not exist`. Fix: moved the partial UNIQUE INDEX DDL out of §4.NEW2 into §4.NEW3 immediately after the lifecycle_transition CREATE TABLE; §4.NEW2 now describes the 3-layer enforcement architecture (LAYER 1 parent-row FOR UPDATE primary; LAYER 2 BEFORE INSERT trigger defense-in-depth; LAYER 3 partial UNIQUE INDEX defense-in-depth in §4.NEW3) with explicit deployment-order discipline. R9 HIGH-2 §8.1 Class A still asserted "15 net-new RBAC roles exist" despite §7 + §1 in-scope being reconciled to 11 net-new roles; could have either blocked a correct 11-role deployment OR caused engineers to add 4 unintended roles to satisfy the gate. Fix: rewrote Class A with explicit 11-role enumeration via `unnest(ARRAY[...])` matching §7 exactly (2 application + 3 dashboard-wrapper-owner + 2 template-wrapper-owner + 1 raw-writer-owner + 3 view-owner); explicit note that the retired stale `admin_dashboard_query_wrapper_owner` placeholder MUST NOT exist; preflight no longer relies on a stale numeric count. Previously POST-R8 (1 HIGH closed inline: R8 HIGH-1 R7 concurrency fix split enforcement between BEFORE INSERT trigger on forms_template_admin_review + partial UNIQUE INDEX on lifecycle_transition — but neither locked or uniquely keyed the (tenant_id, forms_template_id) invariant at the moment it matters. On the initial-submission path, two concurrent txs could both find no revision_requested review + both INSERT distinct review rows + both emit none→pending_review transitions with distinct review_ids; partial UNIQUE INDEX is on (tenant_id, review_id) so both INSERTs succeed; BEFORE INSERT trigger on forms_template_admin_review can't catch this because lifecycle_transition rows don't exist yet when trigger fires. Duplicate active reviews possible despite spec presenting this as closed. Fix: added explicit `SELECT 1 FROM forms_template WHERE tenant_id=p_tenant_id AND id=p_template_id FOR UPDATE` at the start of submit_forms_template_for_admin_review wrapper body. The parent forms_template row is the canonical DB-level serialization point keyed by (tenant_id, forms_template_id); concurrent submits serialize: tx A acquires lock, completes entire submit including lifecycle_transition INSERT + commits + releases lock; tx B then acquires lock + reads the now-committed active latest state via LATERAL JOIN + EITHER reuses the active review (if revision_requested) OR raises admin-template-submit-already-in-flight (if pending_review). Trigger + partial UNIQUE INDEX retained as defense-in-depth secondary tripwires. Previously POST-R7 (2 HIGH closed inline: R7 HIGH-1 submit wrapper always INSERTed new review_id + always emitted none→pending_review — contradicted §6 state machine triple #5 (revision_resubmission: revision_requested→pending_review reusing existing review_id); §4.NEW2 UNIQUE constraints both included review_id so they were non-enforcing (every row had distinct review_id by PRIMARY KEY default); request_revision decisions could not safely resubmit through declared canonical path + retries created parallel review rows. Fix: rewrote submit_forms_template_for_admin_review to (a) LATERAL JOIN derive latest state of existing reviews for the (tenant_id, forms_template_id) pair under SELECT FOR UPDATE lock; (b) if existing latest-state = 'revision_requested', reuse review_id + emit revision_resubmission transition (triple #5); (c) if NO in-flight review exists, INSERT new review + emit initial_submission (triple #1); (d) explicit pre-INSERT check rejects parallel in-flight reviews with serialization_failure errcode. Replaced non-enforcing UNIQUE constraints with partial UNIQUE INDEX on lifecycle_transition + BEFORE INSERT trigger `enforce_one_active_review_per_template` on forms_template_admin_review rejecting duplicate active reviews via LATERAL-derived latest state. Audit payload extended with `path` field distinguishing initial_submission vs revision_resubmission for forensics. R7 HIGH-2 Sub-decision 5 still said Class O allowlist "EMPTY at v1.0" + scanned only 2 admin views + covered only 4 SECDEF procedures — directly contradicted §8.1 Class O table that correctly enumerates 6 SECDEF routines + 3 admin views; same failure class R6 HIGH-2 was supposed to close (drift between two normative statements of the same allowlist). Fix: rewrote Sub-decision 5 to enumerate **6 SECDEF procedures** (1 raw + 3 dashboard + 2 template) + **3 admin views** + 3 admin review entities matching §8.1 Class O exactly; raw writer EXECUTE grant clarified as restricted to EXACTLY the **2 template wrapper-owner roles** (not 3 — dashboard wrappers don't write lifecycle transitions); Class O allowlist explicitly described as "NOT empty at v1.0; populated with the 6 SI-023 wrappers". Sub-decision 5 + §8.1 Class O now mutually consistent. Previously POST-R6 (3 HIGH closed inline: R6 HIGH-1 v0.6 Phase 6 (procedures) deployed SECDEF wrappers BEFORE Phase 7 (views) created the views the wrappers SELECT from — PostgreSQL CREATE FUNCTION validates static SQL bodies + would fail on missing relations; ordered cutover cannot complete as written. Workaround via dynamic SQL would weaken pg_depend-based class O/I anti-bypass safety checks. Fix: re-ordered Phase 6 ↔ Phase 7 — views FIRST (Phase 6; with owners + GRANT SELECT to corresponding wrapper-owner roles), then procedures (Phase 7; CREATE FUNCTION validation finds referenced relations + ownership is correct). Explicit prose acknowledging this is the inverse of the P-036 R6 "tables-first-views-last" pattern, deliberately so because the canonical read path is wrapper-only (admin_basic_operator has NO direct view SELECT). Class K CTAS provenance still operates correctly. R6 HIGH-2 Class O allowlist was "EMPTY at v1.0" — but the 6 canonical SECDEF wrappers (3 dashboard read-wrappers + 2 template wrappers + 1 raw lifecycle writer) DO depend on the admin views + review entities; correct implementation of the canonical wrappers would itself trigger Class O violation, blocking every valid deployment. Fix: populated the canonical SECDEF allowlist with the 6 wrappers + their expected owner roles + their dependency objects; Class O additionally verifies each allowlisted routine is owned by EXACTLY the expected owner role (ownership-drift attack defense); future SECDEF additions require ratifier-signed-off allowlist update. R6 HIGH-3 §5 endpoint #4 contract said "requires admin_basic_operator OR Forms-Intake builder role" but the canonical submit_forms_template_for_admin_review wrapper authorizes ONLY admin_basic_operator via LAYER B; legitimate builder-role callers would have hit 42501 at the DB boundary, creating an endpoint-vs-wrapper authorization mismatch. Fix: chose admin_basic_operator-only at the endpoint contract; explicit prose explaining the pilot scope rationale (operators mediate template submission; builder-role users author content but don't directly trigger admin-review submission for pilot); post-pilot Admin Backend v1.1 may extend if self-service builder review-submission becomes in scope. Previously POST-R5 (2 HIGH closed inline: R5 HIGH-1 Sub-decision 4 template wrappers (submit + decision) still used the old DB-role/session pattern from v0.2 — OQ7 had deferred the JWT-principal-to-role check to a future cycle, but Codex flagged this as not safe to treat as deferred OQ work because these wrappers mutate safety-critical review state (forms_template publish path). Fix: OQ7 RESOLVED 2026-05-22 inline; both `submit_forms_template_for_admin_review` and `record_forms_template_admin_decision` wrappers rewritten with the canonical 3-layer authorization defense from Sub-decision 3.5 — LAYER A (EXECUTE grant per §7) + LAYER B (schema-backed JOIN to tenant_account_membership verifying JWT-bound verified_principal_id has the required admin role via `tam.active=TRUE AND <role-name> = ANY(tam.assigned_role_names)`; admin_basic_operator for submit; admin_template_reviewer for decision) + LAYER C (vc.verified_tenant_id = p_tenant_id). Both wrappers now have full executable DDL with SECDEF + locked search_path + ownership + REVOKE PUBLIC + canonical GRANT EXECUTE. R5 HIGH-2 multiple normative sections were placeholders gating safety properties of the slice: §3 audit events preliminary, §4.NEW2 + §4.NEW3 DDL not defined, §6 contradicted itself ("4 transition triples" in prose vs "5 triples enumerated"), §8 only said "P-040 pattern reused". Without concrete DDL/CHECK constraints/preflight assertions/ordered phases, ratifier cannot verify the wrapper-only + state-machine guarantees survive implementation or migration drift. Fix: comprehensive flesh-out — §3 audit events: full normative table with 6 net-new action IDs (4 Cat A + 0 Cat B + 2 Cat C) including action_id + category + trigger + payload schema + sampling per AUDIT_EVENTS canonical pattern; §4.NEW2 + §4.NEW3 full executable DDL with composite tenant-scoped FKs + RLS policies + append-only triggers + CHECK constraints enforcing exactly the 5 transition triples from §6 + monotonic-ordering trigger per P-038/P-040 R2/R4 pattern; §6 state-machine triple count reconciled = **5 triples** (corrected the "4 triples" intro drift) with full normative table + terminal-state discipline; §8 fleshed out with §8.1 preflight DO block enumerating classes A-M + N + O + P (3 SI-023-specific NEW classes — N audit completeness; O SECDEF dependency rejection on admin views + review entities; P admin-view grant-matrix allowlist) + §8.2 11-phase cutover sequencing matching P-040 §8.2 shape with SI-023 entity additions (4 tables created in Phase 2; 4 invariant triggers in Phase 4; 4 SECDEF procedures in Phase 6; 3 admin views in Phase 7 with split owner/grant pairs; CTAS provenance event trigger REUSED from P-040 Phase 7.1) + §8.3 rollback discipline. Class N tolerance = 0% per OQ5; class O allowlist EMPTY at v1.0; class P enforces SECDEF-wrapper-only canonical read path. Document is now ratifier-ready with full executable text replacing prior stubs. Previously POST-R4 (1 HIGH closed inline: R4 HIGH-1 SECDEF wrapper authorization template's R3 closure used `pg_has_role(session_user, ...)` which proves the DB SESSION role has admin_basic_operator — but in canonical Telecheck deployment (service-account / pooled-connection per SI-024.1), session_user is the SERVICE-ACCOUNT DB login, NOT the JWT-authenticated end-user; service account typically holds EXECUTE-via-membership on the wrapper, so the LAYER B check passes regardless of whether the actual JWT-bound principal is an admin. Audit row would then falsely attribute the read to a non-admin JWT principal rather than rejecting the call. Genuine privilege-boundary defect — unauthorized access to all 3 dashboard surfaces possible. Fix: rewrote authorization template as 3-layer defense — LAYER A (EXECUTE grant on wrapper; primary DB privilege boundary), LAYER B (NEW per R4 — explicit schema-backed join to `tenant_account_membership` verifying JWT-bound `verified_principal_id` has `admin_basic_operator` role assignment via `tam.active = TRUE AND 'admin_basic_operator' = ANY(tam.assigned_role_names)`; matches P-038 R6 dissolution pattern — explicit schema-backed joins to already-ratified canonical entities, no net-new RBAC-helper function proposed), LAYER C (tenant scope match via `vc.verified_tenant_id = p_tenant_id`). All 3 layers MUST pass; any failing raises 42501. Added OQ6 for ratifier to confirm exact column names (`active`, `assigned_role_names TEXT[]`) on tenant_account_membership (column-name OQ; closeable in normal ratification). Added OQ7 to fold the same LAYER A+B+C pattern into Sub-decision 4 template wrappers (submit + decision) in v0.5+ cycle. Previously POST-R3 (2 HIGH closed inline: R3 HIGH-1 SECDEF wrapper authorization template used `pg_has_role(current_user, 'admin_basic_operator', 'MEMBER')` — identical defect class to P-040 R17 (under SECURITY DEFINER, `current_user` is the function OWNER not the invoking role); would either brick every dashboard wrapper (owner not in admin_basic_operator) OR make the role check meaningless (owner made member just to satisfy the check). Fix: replaced `current_user` with `session_user` in the role-membership check; session_user is unaffected by SECURITY DEFINER and reflects the actual session-authenticated role. Combined with EXECUTE grant on the wrapper (PRIMARY authorization boundary; only admin_basic_operator role members hold EXECUTE per §7) + SI-024.1 verify_session_jwt_and_extract_claims() tenant scope verification, this gives defense-in-depth catching accidental over-grants. Exception message also updated to reference session_user (matching the actual check). R3 HIGH-2 CDM entity count drifted across §1 ("3"), §4 heading ("3 active"), and §8 ("class A reconciliation note") — admin_template_decision_idempotency_key (added at R2 MED-1) was treated as a "later reconciliation" rather than a first-class v1.0 entity. Migration/preflight derived from §1/§4 could omit the table. Fix: reconciled count to **4 net-new CDM entities** across §1 (full enumeration with all 4 listed explicitly) + §4 heading + §4 reconciliation note + §8.2 Phase 2 statement (all 4 tables created in same deployment phase; admin_template_decision_idempotency_key deployed alongside forms_template_admin_review since the decision wrapper depends on it for retry safety). Previously POST-R2 (3 HIGH + 1 MED closed inline: R2 HIGH-1 §4.NEW1 DDL CHECK constraint had `'admin_mode1_volume_health'` (old in-process label) instead of `'admin_mode1_volume_health_v'` (canonical view name) — Mode 1 wrapper audit INSERT would fail every call → fail-closed wrapper returns no data for every Mode 1 dashboard read. Fix: corrected CHECK enum to `'admin_mode1_volume_health_v'`. R2 HIGH-2 §5 endpoint #3 still said "in-process aggregation from ai_mode1_conversation" + OQ2 still recommended deferring view to v1.1 — contradicted R1 HIGH-2 closure; reintroduced over-broad access pattern. Fix: rewrote endpoint #3 to call `read_admin_mode1_volume_health` SECDEF wrapper reading `admin_mode1_volume_health_v` (canonical wrapper-only path matching surfaces 1+2); OQ2 marked RESOLVED with v1.0 canonical-view decision + rationale. R2 HIGH-3 §7 RBAC enumeration had only 1 generic `admin_dashboard_query_wrapper_owner` + 2 view-owner roles, but Sub-decision 3.5 requires 3 distinct dashboard-wrapper owners (one per surface) + Sub-decision 2 Surface 3 requires `admin_mode1_volume_health_view_owner` (3 total view owners). If §7 drives grants, `read_admin_mode1_volume_health_wrapper_owner` would not exist OR would not receive SELECT on the Mode 1 view → grant-matrix preflight cannot consistently allow the 3+3 wrapper-owner/view relationships → SECDEF-wrapper-only canonical read path breaks at the privilege boundary. Fix: rewrote §7 to enumerate 11 net-new roles (2 application + 3 dashboard-wrapper-owner + 2 template-wrapper-owner + 1 raw-writer-owner + 3 view-owner) with explicit grant-matrix invariant; updated §1 in-scope from "8" → "11"; added §8.1 class P (NEW) enforcement reference. R2 MED-1 record_forms_template_admin_decision wrapper relied on `p_idempotency_key` for retry suppression but the spec did not declare `p_idempotency_key NOT NULL` AND the `admin_template_decision_idempotency_key` entity was only mentioned in prose, not defined as a schema entity with UNIQUE (tenant_id, review_id, idempotency_key) constraint. NULL-key retries + concurrent same-key calls underspecified. Fix: added §4.NEW4 admin_template_decision_idempotency_key entity DDL with NOT NULL + UNIQUE constraint per-(tenant_id, review_id, idempotency_key); wrapper signature MUST declare `p_idempotency_key TEXT NOT NULL` (no DEFAULT NULL); API endpoint MUST reject calls without `Idempotency-Key` HTTP header (400); double-layered (database + API) prevents NULL-key retries. Net-new CDM entity count adjusted "3" → "4". Previously POST-R1 (3 HIGH + 1 MED closed inline: R1 HIGH-1 dashboard audit was application-convention only — direct SELECT on admin views by admin_basic_operator could bypass the record-only audit wrapper; class N preflight comparison was after-the-fact. Fix: restructured to SECDEF-wrapper-only canonical read path — 3 dashboard surfaces exposed via 3 SECDEF read-wrappers (read_admin_crisis_operational_health + read_admin_consult_queue_health + read_admin_mode1_volume_health); direct SELECT on the 3 views REVOKEd from admin_basic_operator; views GRANT SELECT only to the corresponding wrapper-owner role; wrapper body INSERTs audit row + emits Cat A audit + reads view in SAME tx with FLOOR-020 fail-closed pattern. Class N becomes defensive database-integrity tripwire, not primary enforcement. R1 HIGH-2 Mode 1 dashboard Surface 3 deferred canonical view + granted admin_basic_operator membership in ai_mode1_reader (over-broad). Fix: landed canonical admin_mode1_volume_health_v view NOW (not deferred to v1.1); minimized columns (aggregate counts + Cat A emission counts; NO raw conversation text / patient_id); admin_basic_operator NOT made member of ai_mode1_reader. R1 HIGH-3 record_forms_template_admin_decision wrapper lacked latest-state lock — concurrent reviewers could append conflicting terminal transitions + dual-publish forms_template.status. Fix: wrapper now performs SELECT...FOR UPDATE on review row + idempotency-key check + latest-state derivation under lock + rejects non-pending latest state + idempotency for repeated identical decision requests. Added admin_template_decision_idempotency_key entity (canonical IDEMPOTENCY contract per P-027). R1 MED-1 OQ5 1% production tolerance for Cat A dashboard audit-completeness undermined FLOOR-020 fail-closed. Fix: tightened to 0% production AND staging — post-R1 HIGH-1 the SECDEF wrapper is canonical read path so audit-row creation is structurally co-transactional; drift can ONLY occur via database-integrity defects.)
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
3. **4 net-new CDM entities** (R3 HIGH-2 closure 2026-05-22; was "3" in v0.1-v0.3 normative scope — admin_template_decision_idempotency_key added at R2 MED-1 closure but §1 + §4 heading + §8 still drifted to "3"; reconciled here):
   - `admin_dashboard_query_execution` (audit trail of who-viewed-what-when on admin dashboards; satisfies I-027 audit completeness on admin read paths per Sub-decision 3)
   - `forms_template_admin_review` (review lifecycle entity)
   - `forms_template_admin_review_lifecycle_transition` (append-only log per I-035)
   - `admin_template_decision_idempotency_key` (canonical IDEMPOTENCY entity per P-027 + Sub-decision 4; required by record_forms_template_admin_decision wrapper for retry safety; deployed in same Phase 2 as forms_template_admin_review per §8.2)
4. **2 OPTIONAL canonical views**: `admin_crisis_operational_health_v` + `admin_consult_queue_health_v` (tenant-scoped via current_tenant_id_strict; both `security_invoker=true + security_barrier=true`; granted to `admin_basic_operator` role only).
5. **4 SECURITY DEFINER procedures**: 1 raw `record_forms_template_admin_review_transition()` + 3 wrappers (`submit_forms_template_for_admin_review` + `record_forms_template_admin_decision` + `record_admin_dashboard_query_execution`).
6. **6 new audit events** under `admin.*` namespace (4 Cat A + 2 Cat C; final tally subject to Codex review).
7. **5 new OpenAPI endpoints** under `/v1/admin/*` (pilot-narrow subset; full Admin Backend v1.1 endpoint scope deferred).
8. **1 new state machine `forms_template_admin_review_lifecycle`** (DERIVED from append-only transitions per I-035; CHECK constraint enumerates the canonical triples; subject to Codex review for final count).
9. **11 new RBAC roles** (R2 HIGH-3 closure 2026-05-22 — corrected from earlier "8" to reflect SECDEF-wrapper-only dashboard pattern): 2 admin application + 3 dashboard-wrapper-owner (one per dashboard surface) + 2 template-wrapper-owner + 1 raw-writer-owner + 3 view-owner (one per admin view).

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
    -- 1. Verify caller authorization (R3 HIGH-1 + R4 HIGH-1 closure 2026-05-22):
    --    The authorization MUST bind tenant + JWT-verified principal + admin role
    --    together in a single check. Three layers of defense:
    --
    --    LAYER A (PRIMARY DB privilege boundary): EXECUTE grant on the wrapper —
    --    only admin_basic_operator role members hold EXECUTE per §7. In a
    --    service-account/pooled-connection deployment this layer alone is
    --    insufficient because the service-account DB session role typically holds
    --    EXECUTE-via-membership.
    --
    --    LAYER B (R4 HIGH-1 closure 2026-05-22 — JWT-principal-to-role check):
    --    verify the JWT-bound verified_principal_id has admin_basic_operator
    --    role assignment for the verified_tenant_id via canonical schema-backed
    --    join to tenant_account_membership (the canonical Identity-slice entity
    --    confirmed by P-038 OQ3 ratification). This proves the AUTHENTICATED
    --    END-USER (not the DB session-role) holds admin_basic_operator for the
    --    target tenant. NO net-new RBAC-helper function is introduced — this
    --    follows the P-038 R6 dissolution pattern (explicit schema-backed joins
    --    to already-ratified canonical entities; no platform-floor primitive
    --    proposal).
    --
    --    LAYER C (tenant scope): verify_session_jwt_and_extract_claims() returns
    --    verified_tenant_id matching p_tenant_id, ensuring the JWT is bound to
    --    the same tenant the wrapper was called for (defense against
    --    cross-tenant JWT replay).
    --
    --    All three layers MUST pass; ANY layer failing raises 42501.
    PERFORM 1
      FROM verify_session_jwt_and_extract_claims() vc
      JOIN tenant_account_membership tam
        ON tam.tenant_id = vc.verified_tenant_id
       AND tam.principal_id = vc.verified_principal_id
     WHERE vc.verified_tenant_id = p_tenant_id                            -- LAYER C: tenant scope
       AND tam.active = TRUE                                              -- LAYER B: active membership
       AND 'admin_basic_operator' = ANY(tam.assigned_role_names);         -- LAYER B: JWT principal has admin role
    IF NOT FOUND THEN
        RAISE EXCEPTION 'admin-dashboard-unauthorized: JWT principal % does NOT hold admin_basic_operator for tenant % OR JWT tenant binding mismatch', (SELECT verified_principal_id FROM verify_session_jwt_and_extract_claims()), p_tenant_id
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

Forms-Intake Engine `forms_template` entities (canonical from P-026 batched ratification) enter SI-023's review workflow via `submit_forms_template_for_admin_review` SECDEF wrapper; admin reviewers terminal-decision the review via `record_forms_template_admin_decision` SECDEF wrapper. Both wrappers use the canonical 3-layer authorization pattern from Sub-decision 3.5 (R5 HIGH-1 closure 2026-05-22 / OQ7 RESOLVED — same LAYER A + B + C defense as dashboard wrappers).

**`submit_forms_template_for_admin_review(p_tenant_id tenant_id_t, p_template_id UUID) RETURNS UUID` (canonical wrapper body; R7 HIGH-1 closure 2026-05-22 — handles both initial-submission AND revision-resubmission paths per §6 state machine triples #1 + #5):**

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
    -- LAYER A+B+C authorization (R4 HIGH-1 + R5 HIGH-1 / OQ7 RESOLVED pattern)
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

    -- R8 HIGH-1 closure 2026-05-22: SERIALIZE concurrent submit calls for the same
    -- (tenant_id, forms_template_id) by acquiring a row-level write lock on the
    -- PARENT forms_template row. This is the canonical DB-level serialization point
    -- keyed by (tenant_id, forms_template_id). Without this lock, two concurrent
    -- initial-submission txs would both pass the no-active-review check + both
    -- INSERT distinct forms_template_admin_review rows + both emit none→pending_review
    -- transitions with distinct review_ids (partial UNIQUE INDEX on lifecycle_transition
    -- keys on review_id, not template_id, so both INSERTs succeed). The BEFORE INSERT
    -- trigger on forms_template_admin_review also cannot catch this because the
    -- lifecycle_transition rows don't exist yet when the trigger fires. The parent-row
    -- lock forces concurrent submits to serialize: tx A acquires the lock, completes
    -- the entire submit including the lifecycle_transition INSERT + commits; tx B
    -- then acquires the lock + reads the (now-committed) active latest state via
    -- LATERAL JOIN + EITHER reuses the active review (if revision_requested) OR raises
    -- admin-template-submit-already-in-flight (if pending_review).
    PERFORM 1 FROM forms_template
     WHERE tenant_id = p_tenant_id AND id = p_template_id
       FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'admin-template-submit-template-not-found: forms_template id % not found for tenant %', p_template_id, p_tenant_id
            USING ERRCODE = '02000';  -- no_data
    END IF;

    -- R7 HIGH-1 closure: look for an existing IN-FLIGHT review for this template
    -- whose latest state is revision_requested. If one exists, lock it and emit the
    -- revision_resubmission transition (triple #5: revision_requested -> pending_review).
    -- If NO in-flight revision-requested review exists, create a new review_id
    -- (triple #1: none -> pending_review / initial_submission).
    --
    -- "In-flight revision-requested review" defined as: forms_template_admin_review row
    -- where the LATEST lifecycle_transition has to_state='revision_requested'. We use
    -- a LATERAL JOIN to derive the latest state under lock.
    --
    -- The R7 HIGH-1 enforcement against PARALLEL in-flight reviews is the partial
    -- UNIQUE constraint on the lifecycle_transition table + the BEFORE INSERT trigger
    -- on forms_template_admin_review (R8 HIGH-1 closure: defense-in-depth alongside
    -- the parent-row FOR UPDATE lock above; the parent-row lock is the PRIMARY
    -- serialization point; trigger + partial UNIQUE INDEX are secondary tripwires).
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
       FOR UPDATE OF ftar;  -- lock the row so concurrent submit attempts serialize

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
        -- Verify no other in-flight (non-terminal-latest-state) review exists for
        -- this template. The partial UNIQUE constraint at §4.NEW3 will reject
        -- concurrent attempts; this explicit check produces a clearer error.
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
                USING ERRCODE = '40001';  -- serialization_failure
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

    -- Cat A audit co-transactional per FLOOR-020 (payload distinguishes paths)
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

**`record_forms_template_admin_decision(p_tenant_id, p_review_id, p_decision, p_decision_payload, p_idempotency_key) RETURNS VOID` (canonical wrapper body; concurrency-safe via row-level lock + idempotency-key per R1 HIGH-3):**

```sql
CREATE OR REPLACE FUNCTION record_forms_template_admin_decision(
    p_tenant_id tenant_id_t,
    p_review_id UUID,
    p_decision TEXT,
    p_decision_payload JSONB,
    p_idempotency_key TEXT  -- R2 MED-1: NOT NULL enforced at API + UNIQUE constraint at DB
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
    -- Validate decision enum
    IF p_decision NOT IN ('approve', 'reject', 'request_revision') THEN
        RAISE EXCEPTION 'admin-template-decision-invalid-decision-value: % is not a valid decision', p_decision
            USING ERRCODE = '22023';  -- invalid_parameter_value
    END IF;

    -- Validate idempotency key NOT NULL (defense at wrapper layer; API also rejects)
    IF p_idempotency_key IS NULL THEN
        RAISE EXCEPTION 'admin-template-decision-null-idempotency-key: p_idempotency_key MUST be non-null per R2 MED-1 IDEMPOTENCY contract'
            USING ERRCODE = '23502';  -- not_null_violation
    END IF;

    -- LAYER A+B+C authorization (R4 HIGH-1 + R5 HIGH-1 / OQ7 RESOLVED): JWT principal must hold admin_template_reviewer
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

    -- R1 HIGH-3 concurrency-safe: SELECT...FOR UPDATE on review row
    SELECT forms_template_id INTO v_review_forms_template_id
      FROM forms_template_admin_review
     WHERE tenant_id = p_tenant_id AND review_id = p_review_id
       FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'admin-template-decision-review-not-found: review_id % not found for tenant %', p_review_id, p_tenant_id
            USING ERRCODE = '02000';  -- no_data
    END IF;

    -- R2 MED-1 idempotency check (under lock — concurrent calls serialize)
    SELECT decision INTO v_existing_decision
      FROM admin_template_decision_idempotency_key
     WHERE tenant_id = p_tenant_id AND review_id = p_review_id AND idempotency_key = p_idempotency_key;
    IF FOUND THEN
        IF v_existing_decision = p_decision THEN
            RETURN;  -- idempotent replay; no second transition emitted
        ELSE
            RAISE EXCEPTION 'idempotency-key-decision-mismatch: existing key has decision=% but request has decision=%; not safe to retry', v_existing_decision, p_decision
                USING ERRCODE = '40001';  -- serialization_failure (semantic: caller bug, retry not safe)
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
            USING ERRCODE = '40001';  -- serialization_failure
    END IF;

    -- INSERT lifecycle transition (pending_review → approved/rejected/revision_requested)
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

    -- On approve: canonical publish path (direct UPDATE on forms_template.status REVOKEd from all other roles)
    IF p_decision = 'approve' THEN
        UPDATE forms_template SET status = 'published'
         WHERE tenant_id = p_tenant_id AND id = v_review_forms_template_id;
        PERFORM emit_audit_event_co_transactional(
            p_tenant_id, 'admin.template_published_via_review_workflow',
            jsonb_build_object('review_id', p_review_id, 'forms_template_id', v_review_forms_template_id,
                               'decider_principal_id', v_decider_principal_id)
        );
    END IF;

    -- R2 MED-1: INSERT idempotency-key row (UNIQUE constraint enforces serialization)
    INSERT INTO admin_template_decision_idempotency_key
        (tenant_id, review_id, idempotency_key, decision, decision_payload_jsonb, decider_principal_id)
    VALUES
        (p_tenant_id, p_review_id, p_idempotency_key, p_decision, p_decision_payload, v_decider_principal_id);

    -- Cat A audit
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

**Concurrency + idempotency contract (unchanged from R1/R2 closures):**
- Concurrent dual-reviewer attempts: one wins `SELECT...FOR UPDATE`; loser sees non-pending latest state + raises `admin-template-decision-non-pending-latest-state` → tx rolls back
- Idempotent retry (same idempotency_key + same decision): returns success without emitting second transition
- Different decision with same idempotency_key: raises `idempotency-key-decision-mismatch` (caller bug)

State machine `forms_template_admin_review_lifecycle` (DERIVED from append-only transitions per I-035; R5 HIGH-2 triple-count drift corrected — was "4 triples" in v0.2 prose vs "5 triples enumerated in §6"; canonical answer = **5 triples**): 5 states (none / pending_review / approved / rejected / revision_requested); 5 transition triples (see §6 for normative table).

### Sub-decision 5 — Anti-bypass discipline (SECDEF wrapper EXECUTE allowlists; R7 HIGH-2 closure 2026-05-22 — reconciled with §8.1 Class O exact enumeration)

The **6 SECURITY DEFINER procedures** (1 raw lifecycle writer + 3 dashboard read-wrappers + 2 template wrappers; see §3 for wrapper count + §7 RBAC for owner roles) follow the canonical anti-bypass discipline established at P-034 §3 + P-038 §3 + P-040 §3:

- Raw writer `record_forms_template_admin_review_transition()` owned by `forms_template_admin_review_transition_writer_owner`; EXECUTE granted to EXACTLY the **2 template wrapper-owner roles** (`forms_template_admin_review_submit_wrapper_owner` + `forms_template_admin_review_decision_wrapper_owner`) — NOT to the 3 dashboard wrapper-owner roles (they don't write lifecycle transitions). No other roles receive EXECUTE on the raw writer.
- 3 dashboard read-wrappers: each owned by its respective dashboard wrapper-owner role per §7; EXECUTE granted ONLY to `admin_basic_operator`.
- 2 template wrappers (submit + decision): each owned by its respective template wrapper-owner role per §7; EXECUTE granted ONLY to canonical caller-class role per §7 (`admin_basic_operator` for submit; `admin_template_reviewer` for decision).

**§8.1 preflight class O** (NEW assertion symmetric to P-040 class I; per R5 HIGH-2 + R6 HIGH-2 + R7 HIGH-2 closures): pg_depend + prosrc text-scan rejecting any SECDEF routine that depends on the **3 admin views** (`admin_crisis_operational_health_v` / `admin_consult_queue_health_v` / `admin_mode1_volume_health_v`) OR on the **3 admin review entities** (`forms_template_admin_review` / `forms_template_admin_review_lifecycle_transition` / `admin_template_decision_idempotency_key`) UNLESS the routine is on the canonical allowlist enumerated at §8.1 Class O (the 6 SI-023 SECDEF wrappers above with their expected owner roles). The Class O allowlist is **NOT empty at v1.0**; it is populated with the 6 canonical wrappers (correcting prior v0.2-v0.6 drift). Any non-allowlisted SECDEF routine touching these entities raises `admin-template-review-anti-bypass-violation` Cat C audit (per §3 row 6) + blocks cutover. Future SECDEF additions (e.g., a v1.1 bulk-operator action or analytics function) require ratifier-signed-off allowlist update.

### Sub-decision 6 — Data-minimization split + tenant-scoped read enforcement

Per P-038 R5 HIGH-1 + P-040 R1 HIGH-2 pattern:
- Admin views are tenant-scoped (admin_basic_operator membership + tenant_id = current_tenant_id_strict predicate inside view body)
- Admin reader role distinct from clinician reader (clinician roles do NOT have SELECT on admin_*_v views; admin role does NOT have SELECT on clinician-specific data-minimization views like crisis_event_patient_summary_v)
- View definitions enforce tenant isolation via SI-024.1 verify_session_jwt_and_extract_claims canonical pattern

### Sub-decision 7 — Open questions for ratifier

1. **OQ1 — Codex pre-ratification target rounds.** Recommendation: 6-10 rounds (smaller scope than P-039 SI-022's 67-round outlier; closer to P-037 SI-020's 11 or P-035 Mode 1's 8 cycle profile).
2. **OQ2 — Mode 1 dashboard surface canonical view. RESOLVED 2026-05-22 (R1 HIGH-2 + R2 HIGH-2 closures):** Land canonical `admin_mode1_volume_health_v` view at v1.0 NOW (not deferred to v1.1). Rationale: deferring would have required granting admin_basic_operator membership in `ai_mode1_reader` for in-process aggregation, which is over-broad relative to minimized aggregate metrics + violates the P-038 R5 + P-040 R1 HIGH-2 data-minimization split discipline. Canonical view ships at v1.0 with minimized columns (aggregate counts + Cat A emission counts; NO raw conversation text; NO patient_id exposure); read via `read_admin_mode1_volume_health` SECDEF wrapper (Sub-decision 3.5); admin_basic_operator NOT made member of ai_mode1_reader.
3. **OQ3 — Template review approval requires AI guardrail output snapshot.** Should `forms_template_admin_review` carry a snapshot of the AI guardrail check result OR re-query at decision time? Recommendation: snapshot at submission (forms_template_admin_review.ai_guardrail_snapshot_jsonb) for deterministic review semantics; re-query on revision_requested → re-submission cycle.
4. **OQ4 — Per-tenant configurable admin notification channel for template reviews.** Should admin reviewers receive a notification (email/SMS/in-app) when a template enters pending_review? Recommendation: defer to v1.1 (pilot uses dashboard polling; v1.1 adds tenant.admin.template_review_notification_channel CCR key + dispatch_ledger row at submission).
5. **OQ5 — Audit completeness preflight tolerance.** Sub-decision 3 §8.1 class N asserts audit-completeness over 24h windows. **Recommendation: 0% tolerance for BOTH production and staging environments (R1 MED-1 closure 2026-05-22 — was 1% production tolerance in v0.1; tightened to 0% because admin dashboard reads are Cat A audit events under FLOOR-020 fail-closed discipline AND post-R1 HIGH-1 the SECDEF wrapper is the canonical read path so audit-row creation is structurally co-transactional with the read — drift can ONLY occur via database-integrity defects, NOT via missing audit emissions on legitimate reads).** Class N becomes a tripwire for database-integrity defects (e.g., manual DELETE on admin_dashboard_query_execution rows outside canonical APIs); any drift > 0 raises `admin-dashboard-audit-completeness-violation` regardless of environment.

6. **OQ6 — Canonical tenant_account_membership role-assignment column shape** (R4 HIGH-1 closure 2026-05-22). The Sub-decision 3.5 SECDEF read-wrapper LAYER B authorization check uses `tam.active = TRUE AND 'admin_basic_operator' = ANY(tam.assigned_role_names)` to verify the JWT-bound verified_principal_id holds admin_basic_operator role for the target tenant. The exact canonical column names (`active` and `assigned_role_names TEXT[]`) are owned by the Identity slice (referenced via P-038 OQ3 as `tenant_account_membership(tenant_id, account_id)` baseline composite UNIQUE; subsequent RBAC v1.4 + Identity slice work may have refined the role-assignment columns). Ratifier confirms: (a) `tam.active` column exists with BOOLEAN type semantically meaning "membership is active for the tenant"; (b) `tam.assigned_role_names TEXT[]` column exists with the per-tenant role-name array semantic OR an equivalent canonical shape (e.g., separate `tenant_role_assignment(tenant_id, principal_id, role_name)` table joined via EXISTS). If the canonical column shape differs from this draft, the SI-023 wrapper template is updated mechanically before P-041 ratification to match the canonical Identity slice + RBAC v1.4 shape. This is a column-name OQ (no schema/invariant amendment); closeable in normal ratification ceremony.

7. **OQ7 — Template-review SECDEF wrappers MUST apply the same LAYER A+B+C authorization pattern. RESOLVED 2026-05-22 (R5 HIGH-1 closure):** both Sub-decision 4 wrappers `submit_forms_template_for_admin_review` (requires admin_basic_operator) and `record_forms_template_admin_decision` (requires admin_template_reviewer) now use the same 3-layer authorization pattern as Sub-decision 3.5 dashboard wrappers — LAYER A (EXECUTE grant per §7) + LAYER B (schema-backed join to tenant_account_membership verifying JWT-bound verified_principal_id has the required admin role assignment via `tam.active=TRUE AND <role-name> = ANY(tam.assigned_role_names)`; P-038 R6 dissolution pattern) + LAYER C (tenant scope match). Wrapper body templates updated in Sub-decision 4 below.

---

## 3. New audit events (6 = 4 Cat A + 2 Cat C)

Canonical AUDIT_EVENTS contribution under `admin.*` namespace (final tally per R5 HIGH-2 closure 2026-05-22):

| # | action_id | Category | Triggered by | Payload schema | Sampling |
|---|---|---|---|---|---|
| 1 | `admin.dashboard_query_executed` | Cat A | Sub-decision 3.5 SECDEF read-wrappers (read_admin_crisis_operational_health / read_admin_consult_queue_health / read_admin_mode1_volume_health); emitted co-transactionally with admin_dashboard_query_execution INSERT per FLOOR-020 fail-closed | `{dashboard_name TEXT, row_count INTEGER, query_params JSONB}` | 100% (no sampling — Cat A audit) |
| 2 | `admin.template_submitted_for_review` | Cat A | Sub-decision 4 submit_forms_template_for_admin_review wrapper; emitted in same tx as forms_template_admin_review INSERT + initial lifecycle_transition | `{review_id UUID, forms_template_id UUID, submitter_principal_id UUID}` | 100% |
| 3 | `admin.template_review_decision` | Cat A | Sub-decision 4 record_forms_template_admin_decision wrapper; emitted in same tx as lifecycle transition INSERT + idempotency_key INSERT | `{review_id UUID, decision TEXT, decider_principal_id UUID, forms_template_id UUID}` | 100% |
| 4 | `admin.template_published_via_review_workflow` | Cat A | Sub-decision 4 record_forms_template_admin_decision wrapper IFF p_decision='approve'; emitted in same tx as forms_template.status UPDATE | `{review_id UUID, forms_template_id UUID, decider_principal_id UUID}` | 100% |
| 5 | `admin.dashboard_query_audit_completeness_violation` | Cat C | §8.1 preflight class N tripwire when count of admin_dashboard_query_execution rows over 24h window != count of distinct dashboard-endpoint requests over same period | `{window_start TIMESTAMPTZ, window_end TIMESTAMPTZ, expected_count INTEGER, actual_count INTEGER, drift INTEGER}` | 100% (Cat C tripwire) |
| 6 | `admin.template_review_anti_bypass_violation` | Cat C | §8.1 preflight class O tripwire when a SECDEF routine references forms_template_admin_review entities outside the canonical wrapper allowlist | `{routine_name TEXT, routine_owner TEXT, referenced_entity TEXT}` | 100% |

**Cat A vs Cat C distinction:** Cat A events are part of the canonical operational audit trail and emitted at every legitimate occurrence (admin dashboard read + every template review action). Cat C events are tripwires for database-integrity defects detected at preflight time + should never fire under canonical operation (drift = 0 expected).

Total: **6 net-new action IDs** (4 Cat A + 0 Cat B + 2 Cat C). Bundle AUDIT_EVENTS v5.12 → v5.13 will land these via the P-042 follow-on amendment per the SI-spec-first promotion pattern (Promotion Ledger).

---

## 4. New CDM entities (4 active; R3 HIGH-2 closure 2026-05-22 — corrected from "3" to include admin_template_decision_idempotency_key added at R2 MED-1)

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
        'admin_mode1_volume_health_v'  -- R2 HIGH-1 closure 2026-05-22: canonical view name (was in-process placeholder)
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

### §4.NEW2 — `forms_template_admin_review` (review lifecycle entity per Sub-decision 4; R5 HIGH-2 closure 2026-05-22 — executable DDL)

```sql
CREATE TABLE forms_template_admin_review (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    forms_template_id UUID NOT NULL,
    submitter_principal_id UUID NOT NULL,
    ai_guardrail_snapshot_jsonb JSONB NULL,  -- OQ3 RESOLVED: snapshot at submission for deterministic review semantics
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Composite tenant-scoped FKs
    CONSTRAINT forms_template_admin_review_template_tenant_fk
        FOREIGN KEY (tenant_id, forms_template_id) REFERENCES forms_template(tenant_id, id),
    CONSTRAINT forms_template_admin_review_submitter_principal_tenant_fk
        FOREIGN KEY (tenant_id, submitter_principal_id) REFERENCES principal(tenant_id, id),
    -- Composite UNIQUE needed for tenant-scoped FK targets to this table
    CONSTRAINT forms_template_admin_review_tenant_id_unique UNIQUE (tenant_id, review_id)
);

-- R7 HIGH-1 + R8 HIGH-1 + R9 HIGH-1 closure 2026-05-22: per-template enforcement of
-- one-active-review-per-(tenant_id, forms_template_id) is done in 3 layers:
--
-- LAYER 1 (PRIMARY — R8 HIGH-1): submit wrapper acquires `SELECT 1 FROM forms_template
--   WHERE ... FOR UPDATE` lock at start; serializes concurrent submits.
-- LAYER 2 (DEFENSE-IN-DEPTH — R7 HIGH-1): BEFORE INSERT trigger
--   `enforce_one_active_review_per_template` on forms_template_admin_review (below);
--   rejects creating a second review row for the same (tenant_id, forms_template_id)
--   when an existing review has a non-terminal latest state via LATERAL-derived check.
-- LAYER 3 (DEFENSE-IN-DEPTH — R7 HIGH-1): partial UNIQUE INDEX on
--   forms_template_admin_review_lifecycle_transition scoped to non-terminal latest
--   states; the index DDL is moved to §4.NEW3 below (after the lifecycle_transition
--   table CREATE TABLE) per R9 HIGH-1 closure 2026-05-22 — the prior placement here
--   inside §4.NEW2 caused a deployment-order defect (CREATE INDEX before CREATE TABLE
--   would fail at Phase 2 since the transition table doesn't exist yet).
--
-- The submit wrapper LAYER 1 lock is the SOLE enforceable serialization point;
-- LAYER 2 + LAYER 3 are tripwires for database-integrity defects (direct base-table
-- INSERT bypassing the wrapper).
--
-- BEFORE INSERT trigger on forms_template_admin_review (LAYER 2):
CREATE OR REPLACE FUNCTION enforce_one_active_review_per_template()
RETURNS TRIGGER
LANGUAGE plpgsql
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
SET search_path = pg_catalog, public;  -- ALTER FUNCTION ... SET search_path applied at deploy time

CREATE TRIGGER forms_template_admin_review_one_active_check
    BEFORE INSERT ON forms_template_admin_review
    FOR EACH ROW EXECUTE FUNCTION enforce_one_active_review_per_template();

ALTER TABLE forms_template_admin_review ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms_template_admin_review FORCE ROW LEVEL SECURITY;
CREATE POLICY forms_template_admin_review_tenant_isolation ON forms_template_admin_review
    USING (tenant_id = current_tenant_id_strict('forms_template_admin_review'));
-- forms_template_admin_review is mutable on created_at-extended columns only at INSERT;
-- current_state derived from latest lifecycle_transition; no UPDATE/DELETE on this table.
CREATE TRIGGER forms_template_admin_review_append_only
    BEFORE UPDATE OR DELETE ON forms_template_admin_review
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

CREATE INDEX forms_template_admin_review_tenant_template_idx
    ON forms_template_admin_review (tenant_id, forms_template_id, created_at DESC);
```

### §4.NEW3 — `forms_template_admin_review_lifecycle_transition` (append-only Option A per I-035; R5 HIGH-2 closure — executable DDL)

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
    -- 5 allowed (from_state, to_state, transition_reason) triples per §6 normative table:
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

-- R9 HIGH-1 closure 2026-05-22: defense-in-depth LAYER 3 partial UNIQUE INDEX on
-- (tenant_id, review_id) scoped to non-terminal latest states. Moved here from §4.NEW2
-- so the index references the lifecycle_transition table that exists by this point in
-- the cutover sequence (DDL ordering: forms_template_admin_review table -> lifecycle
-- transition table -> THIS index). Index ensures any (tenant_id, review_id) can have
-- AT MOST ONE active-state transition row at a time; combined with LAYER 1 parent-row
-- FOR UPDATE lock + LAYER 2 BEFORE INSERT trigger on forms_template_admin_review,
-- provides 3-layer enforcement of one-active-review-per-template invariant.
CREATE UNIQUE INDEX forms_template_admin_review_one_active_per_template_uk
    ON forms_template_admin_review_lifecycle_transition (tenant_id, review_id)
    INCLUDE (transition_at, to_state)
    WHERE to_state IN ('pending_review', 'revision_requested');
```

**Monotonic-ordering invariant** (per P-038 R2 + P-040 §4.NEW2 pattern): BEFORE INSERT trigger enforces `NEW.transition_at >= (SELECT MAX(transition_at) FROM forms_template_admin_review_lifecycle_transition WHERE tenant_id = NEW.tenant_id AND review_id = NEW.review_id)` to prevent backdated row corruption of current-state derivation; future-dating tolerated up to `now() + 5s` clock-skew window. Trigger function `forms_template_admin_review_lifecycle_continuity_monotonic_ordering` schema-qualified + locked search_path per P-034 R7 SECDEF hardening pattern.

### §4.NEW4 — `admin_template_decision_idempotency_key` (R2 MED-1 closure 2026-05-22; canonical IDEMPOTENCY contract per P-027 + P-040 §3.3 pattern)

```sql
CREATE TABLE admin_template_decision_idempotency_key (
    id BIGSERIAL PRIMARY KEY,
    tenant_id tenant_id_t NOT NULL,
    review_id UUID NOT NULL,
    idempotency_key TEXT NOT NULL,   -- R2 MED-1: NOT NULL at the schema layer
    decision TEXT NOT NULL CHECK (decision IN ('approve', 'reject', 'request_revision')),
    decision_payload_jsonb JSONB NULL,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    decider_principal_id UUID NOT NULL,
    -- Composite tenant-scoped FK to forms_template_admin_review
    CONSTRAINT admin_template_decision_idempotency_review_tenant_fk
        FOREIGN KEY (tenant_id, review_id) REFERENCES forms_template_admin_review(tenant_id, review_id),
    -- Composite tenant-scoped FK to principal
    CONSTRAINT admin_template_decision_idempotency_principal_tenant_fk
        FOREIGN KEY (tenant_id, decider_principal_id) REFERENCES principal(tenant_id, id),
    -- R2 MED-1 closure: canonical UNIQUE constraint enforcing idempotency-key uniqueness
    -- per-(tenant_id, review_id, idempotency_key); the record_forms_template_admin_decision
    -- wrapper SELECT...FOR UPDATE on the review row + then attempts INSERT on this table —
    -- concurrent same-key calls collide on the UNIQUE constraint + the loser raises
    -- unique_violation which the wrapper catches + treats as the canonical idempotent
    -- replay path (re-reads the existing row + verifies decision matches; raises
    -- idempotency-key-decision-mismatch if not).
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

**Wrapper API contract (R2 MED-1):** `record_forms_template_admin_decision` wrapper signature MUST declare `p_idempotency_key TEXT NOT NULL` (no DEFAULT NULL); API endpoint MUST reject calls without an `Idempotency-Key` HTTP header (400 Bad Request); the canonical PostgreSQL UNIQUE constraint above is the database-layer enforcement; the wrapper-level NOT NULL is the API-layer enforcement; double-layered prevents NULL-key retries entirely.

### §4 entity count reconciled (R3 HIGH-2 closure 2026-05-22)

**4 net-new CDM entities** reconciled across all normative sections — §1 in-scope item 3 (lists all 4 explicitly), §4 heading (count = 4 active), §8.1 class A preflight inputs (will include all 4 in the role-creation + entity-creation enumeration), §8.2 Phase 2 (creates all 4 tables in the same phase; admin_template_decision_idempotency_key deployed alongside forms_template_admin_review since the decision wrapper depends on it for retry safety). No "later reconciliation" required — all 4 entities are first-class citizens of the v1.0 deployment plan.

---

## 5. New OpenAPI endpoints (5 net-new under `/v1/admin/*`)

To be detailed in v0.2. Preliminary:

1. `GET /v1/admin/dashboards/crisis-operational-health` — reads admin_crisis_operational_health_v; requires admin_basic_operator role; emits dashboard_query_executed Cat A
2. `GET /v1/admin/dashboards/consult-queue-health` — reads admin_consult_queue_health_v; same role + audit pattern
3. `GET /v1/admin/dashboards/mode1-volume-health` — calls `read_admin_mode1_volume_health` SECDEF wrapper which reads `admin_mode1_volume_health_v` (R2 HIGH-2 closure 2026-05-22 — no in-process aggregation from ai_mode1_conversation; canonical wrapper-only path matching surfaces 1+2); requires admin_basic_operator role; emits `admin.dashboard_query_executed` Cat A audit co-transactionally. No application path aggregates ai_mode1_conversation directly; admin_basic_operator does NOT have read access to ai_mode1_conversation per R1 HIGH-2 + Sub-decision 1.
4. `POST /v1/admin/templates/{template_id}/submit-for-review` — calls `submit_forms_template_for_admin_review` wrapper; **requires admin_basic_operator role ONLY** (R6 HIGH-3 closure 2026-05-22 — v0.6 endpoint contract incorrectly said "admin_basic_operator OR Forms-Intake builder role" but the canonical wrapper authorizes ONLY admin_basic_operator via LAYER B tenant_account_membership join; legitimate builder-role callers would have hit 42501 at the DB boundary. Reconciled to admin_basic_operator-only). Operators initiate template submission on behalf of the workflow; builder-role users author template content via the Forms-Intake visual builder (OUT OF SCOPE for SI-023 per §1) but do NOT directly trigger the admin-review submission — that is operator-mediated for the pilot scope. Post-pilot Admin Backend v1.1 may extend the wrapper + RBAC to accept builder-role direct-submit if/when self-service builder review-submission is in scope.
5. `POST /v1/admin/template-reviews/{review_id}/decision` — calls record_forms_template_admin_decision wrapper; requires admin_template_reviewer role

---

## 6. New state machine `forms_template_admin_review_lifecycle` (5 states + 5 transition triples — R5 HIGH-2 closure 2026-05-22: triple-count drift between intro prose ("4") and table enumeration ("5") corrected; canonical answer = **5 transition triples**)

DERIVED from append-only `forms_template_admin_review_lifecycle_transition` rows per I-035. 5 states (none / pending_review / approved / rejected / revision_requested). 5 transition triples enforced by §4.NEW3 CHECK constraint:

| # | from_state | to_state | transition_reason | Source-of-truth scenario |
|---|---|---|---|---|
| 1 | `none` | `pending_review` | `initial_submission` | initial submit_forms_template_for_admin_review wrapper call |
| 2 | `pending_review` | `approved` | `clinician_decision_approve` | record_forms_template_admin_decision with decision='approve' — canonical publish path |
| 3 | `pending_review` | `rejected` | `clinician_decision_reject` | record_forms_template_admin_decision with decision='reject' — terminal-rejected |
| 4 | `pending_review` | `revision_requested` | `clinician_decision_request_revision` | record_forms_template_admin_decision with decision='request_revision' — cycles back via re-submission |
| 5 | `revision_requested` | `pending_review` | `revision_resubmission` | builder UI re-submits revised template via submit_forms_template_for_admin_review (revises existing review_id; no new review row created) |

**Terminal states + onward-transition discipline:**
- `approved` is **terminal-positive** (template canonical-published; any subsequent change requires a NEW review cycle with a new review_id; no onward transitions from approved)
- `rejected` is **terminal-negative** (template will not be published; any subsequent change requires a new review cycle with a new review_id; no onward transitions from rejected)
- `revision_requested` is a **non-terminal cycle state** (cycles back to pending_review via triple #5 on re-submission)
- `pending_review` is the **active reviewer-blocking state** (only transitions out via triples #2/#3/#4)

CHECK constraint at §4.NEW3 enforces all 5 triples + rejects any other (from_state, to_state, transition_reason) combination at the schema layer (defense-in-depth alongside wrapper-only canonical paths).

---

## 7. New RBAC roles (11 net-new; R2 HIGH-3 closure 2026-05-22 — count corrected from earlier "8" stale figure to reflect SECDEF-wrapper-only dashboard pattern requiring 3 distinct dashboard-wrapper owners + 3 distinct view owners)

| # | Role | Class | Granted to | Holds |
|---|---|---|---|---|
| 1 | `admin_basic_operator` | application | tenant operator staff with dashboard-monitoring responsibility | EXECUTE on the 3 dashboard SECDEF read-wrappers (Sub-decision 3.5) |
| 2 | `admin_template_reviewer` | application | tenant operator staff with template-review responsibility | EXECUTE on `submit_forms_template_for_admin_review` + `record_forms_template_admin_decision` wrappers; SELECT on `forms_template_admin_review` for own tenant's pending reviews |
| 3 | `read_admin_crisis_operational_health_wrapper_owner` | dashboard-wrapper-owner | n/a (procedure owner role; non-BYPASSRLS NOLOGIN) | OWNS `read_admin_crisis_operational_health()`; SOLE role with SELECT on `admin_crisis_operational_health_v` |
| 4 | `read_admin_consult_queue_health_wrapper_owner` | dashboard-wrapper-owner | n/a (procedure owner role; non-BYPASSRLS NOLOGIN) | OWNS `read_admin_consult_queue_health()`; SOLE role with SELECT on `admin_consult_queue_health_v` |
| 5 | `read_admin_mode1_volume_health_wrapper_owner` | dashboard-wrapper-owner | n/a (procedure owner role; non-BYPASSRLS NOLOGIN) | OWNS `read_admin_mode1_volume_health()`; SOLE role with SELECT on `admin_mode1_volume_health_v` |
| 6 | `forms_template_admin_review_submit_wrapper_owner` | template-wrapper-owner | n/a (procedure owner role; non-BYPASSRLS NOLOGIN) | OWNS `submit_forms_template_for_admin_review()` |
| 7 | `forms_template_admin_review_decision_wrapper_owner` | template-wrapper-owner | n/a (procedure owner role; non-BYPASSRLS NOLOGIN) | OWNS `record_forms_template_admin_decision()` |
| 8 | `forms_template_admin_review_transition_writer_owner` | raw-writer-owner | n/a (procedure owner role; non-BYPASSRLS NOLOGIN) | OWNS raw `record_forms_template_admin_review_transition()`; EXECUTE granted to EXACTLY the 2 template wrapper-owner roles (anti-bypass discipline per P-034/P-038/P-040) |
| 9 | `admin_crisis_operational_health_view_owner` | view-owner | n/a (view owner; non-BYPASSRLS NOLOGIN) | OWNS `admin_crisis_operational_health_v` |
| 10 | `admin_consult_queue_health_view_owner` | view-owner | n/a (view owner; non-BYPASSRLS NOLOGIN) | OWNS `admin_consult_queue_health_v` |
| 11 | `admin_mode1_volume_health_view_owner` | view-owner | n/a (view owner; non-BYPASSRLS NOLOGIN) | OWNS `admin_mode1_volume_health_v` (R2 HIGH-3 closure 2026-05-22 — was missing in v0.2; required by the wrapper-only design) |

**Total: 11 net-new roles** (2 application + 3 dashboard-wrapper-owner + 2 template-wrapper-owner + 1 raw-writer-owner + 3 view-owner). Reconciled against §1 + §8.1 class A enumeration + §8.2 Phase 1 role-creation list.

**Grant matrix invariant (preserved across §1 + §3.5 + §7):**
- View → wrapper-owner grant: each of the 3 admin views grants SELECT to EXACTLY ONE wrapper-owner role (the corresponding `read_admin_*_wrapper_owner`)
- Wrapper → application grant: each of the 3 dashboard read-wrappers grants EXECUTE to EXACTLY ONE application role (`admin_basic_operator`)
- Raw writer → template wrapper-owner grant: the raw lifecycle-transition writer grants EXECUTE to EXACTLY the 2 template-wrapper-owner roles (no other roles per anti-bypass discipline)
- NO admin role holds direct SELECT on any of the 3 admin views (admin_basic_operator only has EXECUTE on the wrappers)
- §8.1 preflight class P (NEW; R2 HIGH-3 + Sub-decision 6 closure) enforces this grant-matrix exactly

---

## 8. Deployment preflight + cutover sequencing (R5 HIGH-2 closure 2026-05-22 — flesh-out)

### §8.1 Deployment preflight DO block

Reuses the canonical preflight pattern from P-040 §8.1 (classes A through M + G.2 + G.3 + H + I + J + K + L), adapted to admin-domain objects. Three SI-023-specific NEW classes:

**Class N — Admin dashboard audit completeness tripwire** (R1 MED-1 + Sub-decision 3 closure 2026-05-22; 0% tolerance per OQ5): scan `admin_dashboard_query_execution` over the last 24h window + compare against count of distinct dashboard-endpoint requests aggregated from application access logs (joined via a canonical preflight-input view `admin_dashboard_request_log_v` populated by the deploy gate from APM logs). Any drift > 0 raises `admin-dashboard-audit-completeness-violation` Cat C audit (per §3 row 5) + blocks cutover. Tripwire defense — post-Sub-decision 3.5 SECDEF wrapper-only canonical read path, audit-row creation is co-transactional with the read; drift can ONLY occur via database-integrity defects (e.g., manual DELETE on admin_dashboard_query_execution outside canonical APIs).

**Class O — SECDEF dependency rejection on admin views + forms_template_admin_review entities** (R5 HIGH-2 + R6 HIGH-2 closure 2026-05-22 — allowlist populated with the 6 canonical SECDEF wrappers; symmetric with P-040 class I): pg_depend + prosrc text-scan rejecting any SECDEF routine that depends on the 3 admin views (`admin_crisis_operational_health_v` / `admin_consult_queue_health_v` / `admin_mode1_volume_health_v`) OR on the 3 admin review entities (`forms_template_admin_review` / `forms_template_admin_review_lifecycle_transition` / `admin_template_decision_idempotency_key`) UNLESS the routine is on the **canonical SECDEF allowlist** (populated with the 6 SI-023 wrappers — R6 HIGH-2 closure correcting v0.6's incorrect "EMPTY" claim which would have blocked every valid deployment):

| Allowlisted SECDEF routine | Expected owner | Depends on |
|---|---|---|
| `read_admin_crisis_operational_health` | `read_admin_crisis_operational_health_wrapper_owner` | admin_crisis_operational_health_v + admin_dashboard_query_execution |
| `read_admin_consult_queue_health` | `read_admin_consult_queue_health_wrapper_owner` | admin_consult_queue_health_v + admin_dashboard_query_execution |
| `read_admin_mode1_volume_health` | `read_admin_mode1_volume_health_wrapper_owner` | admin_mode1_volume_health_v + admin_dashboard_query_execution |
| `submit_forms_template_for_admin_review` | `forms_template_admin_review_submit_wrapper_owner` | forms_template_admin_review + raw lifecycle writer |
| `record_forms_template_admin_decision` | `forms_template_admin_review_decision_wrapper_owner` | forms_template_admin_review + admin_template_decision_idempotency_key + raw lifecycle writer + forms_template |
| `record_forms_template_admin_review_transition` (raw writer) | `forms_template_admin_review_transition_writer_owner` | forms_template_admin_review_lifecycle_transition |

Any SECDEF routine NOT on this allowlist that depends on any of the listed entities raises `admin-template-review-anti-bypass-violation` Cat C audit (per §3 row 6) + blocks cutover. Class O additionally verifies that each allowlisted routine is owned by EXACTLY the expected owner role (preventing ownership-drift attacks). Future SECDEF routines (e.g., a v1.1 bulk-operator action or analytics function) require ratifier-signed-off allowlist update before deployment.

**Class P — Admin view + dashboard wrapper grant-matrix allowlist** (R2 HIGH-3 + Sub-decision 6 closure 2026-05-22; canonical pattern from P-040 class G.1): explicit allowlist query over `information_schema.role_table_grants` enforcing that the SELECT grant matrix on the 3 admin views is exactly:
- `admin_crisis_operational_health_v` → SELECT permitted ONLY for `read_admin_crisis_operational_health_wrapper_owner` + `admin_crisis_operational_health_view_owner` (owner-self)
- `admin_consult_queue_health_v` → SELECT permitted ONLY for `read_admin_consult_queue_health_wrapper_owner` + `admin_consult_queue_health_view_owner` (owner-self)
- `admin_mode1_volume_health_v` → SELECT permitted ONLY for `read_admin_mode1_volume_health_wrapper_owner` + `admin_mode1_volume_health_view_owner` (owner-self)
- ALL admin_basic_operator grants on these views REJECTED (admin_basic_operator must use the SECDEF wrappers per Sub-decision 3.5; any direct SELECT grant is a privilege-boundary defect)
- ALL PUBLIC grants REJECTED
- ALL other-role grants REJECTED unless on the canonical pair above

Any violation raises `admin-view-grant-allowlist-violation` exception + blocks cutover.

Plus canonical reuse:

**Class A — Verify the 11 net-new RBAC roles exist** (R9 HIGH-2 closure 2026-05-22 — explicit 11-role enumeration matching §7 exactly; corrects prior v0.6-v0.8 "15 net-new RBAC roles exist — corrected to 11 per §7" stale numeric reference that could have either blocked a correct 11-role deployment OR caused engineers to add 4 unintended roles to satisfy the gate):

```sql
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
```

The retired stale `crisis_event_reader`-equivalent placeholder `admin_dashboard_query_wrapper_owner` (from prior v0.1-v0.2 drafts when there was only 1 generic dashboard wrapper-owner role) MUST NOT exist; preflight does not enumerate it as expected, so its absence is automatic.

Plus canonical reuse for remaining classes: B (jwt_migration_entity_status seed: 7 entries = 4 tables + 3 views) + C (tenant config Part A every-tenant) + D (Part B regulatory_reporting=true conditional) + E (Part C emergency_contact conditional) + E0a/b/c (legacy-row migration coverage; vacuous for SI-023 greenfield) + F (view security_invoker=true on the 3 admin views) + G.1 (view-grant allowlist) + G.2 (recursive role-membership closure for the 2 admin app roles) + G.3 (grant-option/admin-option rejection) + H (pg_read_all_data + BYPASSRLS — reused from P-040; admin views inherit the same canonical break-glass-admin allowlist) + I (SECDEF pg_depend on admin views — subsumed by class O above with broader scope) + J (SECDEF prosrc text-scan — reused from P-040; admin-domain object names added to the regex) + K (derived-relation rejection — reused from P-040; admin views inherit the same CTAS provenance discipline via Phase 7.1 event trigger from P-040) + L (view-owner relowner + non-BYPASSRLS attribute — reused from P-040 pattern; applied to the 3 admin view owners) + M (view-definition integrity text scan — reused from P-040 pattern; applied to the 3 admin views with their canonical predicate fragments).

### §8.2 Cutover sequencing

Reuses the P-040 §8.2 11-phase shape with SI-023 entity additions:

1. **Phase 1 — RBAC + ownership setup:** create the 11 net-new RBAC roles per §7; set role passwords via KMS-bound credential vault.
2. **Phase 2 — Tables first:** create the 4 net-new tables (`admin_dashboard_query_execution` + `forms_template_admin_review` + `forms_template_admin_review_lifecycle_transition` + `admin_template_decision_idempotency_key`) per §4.NEW1/NEW2/NEW3/NEW4 DDL. All deployed together in this phase (admin_template_decision_idempotency_key dependency on forms_template_admin_review forces same-phase deployment).
3. **Phase 3 — Backfill:** vacuous for greenfield deploy (no pre-existing rows in any of the 4 admin tables); class E0a/b/c preflight verifies on day-0 deploy.
4. **Phase 4 — Triggers:** create the 4 invariant triggers (3 append-only + 1 monotonic-ordering for forms_template_admin_review_lifecycle_transition). All schema-qualified + locked search_path per P-034 R7 hardening pattern.
5. **Phase 5 — RLS policies:** enable RLS + create policies on the 4 net-new tables (per §4 DDL).
6. **Phase 6 — Views FIRST (R6 HIGH-1 closure 2026-05-22 — re-ordering correction; CREATE FUNCTION with static SQL referencing missing relations would fail validation, so views MUST be created before the dashboard SECDEF wrappers that reference them):** create `admin_crisis_operational_health_v` + `admin_consult_queue_health_v` + `admin_mode1_volume_health_v` each with `security_invoker=true, security_barrier=true`; set ownership to corresponding view-owner role; REVOKE ALL FROM PUBLIC; GRANT SELECT ONLY to corresponding dashboard read-wrapper-owner role (NOT to admin_basic_operator). Phase 6.1 CTAS provenance event trigger REUSED from P-040 (admin views become new dependents in class K allowlist).
7. **Phase 7 — Procedures (renamed from prior Phase 6 per R6 HIGH-1):** deploy the 4 SECDEF procedures (1 raw + 3 dashboard read-wrappers + 2 template wrappers = 6 SECDEF procedures total per §3 wrapper-pair counts) per Sub-decision 3.5 + Sub-decision 4 wrapper bodies. Each verified SECURITY DEFINER + locked search_path; ownership set per §7; EXECUTE granted per §3 + §7 anti-bypass discipline. Since Phase 6 has already created the admin views + GRANT SELECT to the corresponding wrapper-owner role, CREATE FUNCTION validation finds the referenced relations + the wrapper bodies validate without dynamic-SQL workarounds.
   - Note: the prior "P-036 R6 tables-first-views-last" pattern doesn't apply to SI-023 in the same shape because the canonical read path is **wrapper-only** (admin_basic_operator has NO direct SELECT on views; reads happen via wrappers). The view → wrapper dependency forces view-creation-before-wrapper-deployment, which is the inverse of P-036 R6. This is a deliberate design choice consistent with SECDEF-wrapper-only canonical read path (R1 HIGH-1 closure); preflight class K (CTAS provenance) still operates correctly because the views exist + are owned correctly when wrappers are deployed in Phase 7.
8. **Phase 8 — JWT migration entity seed:** INSERT 7 rows into `jwt_migration_entity_status` for the 4 net-new tables + 3 derived views with `phase_4_cutover_eligible=FALSE` + `raw_guc_fallback_audited=TRUE` defaults.
9. **Phase 9 — Audit events registration:** insert the 6 new `admin.*` action IDs into the canonical `audit_events_action_definition` table per AUDIT_EVENTS v5.13 schema.
10. **Phase 10 — Deployment preflight gate:** run the §8.1 DO block (classes A-M + N + O + P). Any FAILED assertion BLOCKS cutover.
11. **Phase 11 — OpenAPI endpoint deployment:** deploy the 5 net-new endpoints under `/v1/admin/*` per §5; verify caller-class role requirement enforced at endpoint layer (defense-in-depth alongside SECDEF wrapper LAYER A+B+C).

### §8.3 Rollback discipline

On any Phase N failure during cutover, rollback discards Phase N's changes via transaction context; Phases 1–(N–1) remain. Post-Phase-11 defects close via a fresh hygiene-cycle PR (P-009 v1.10.1 pattern); destructive rollback NOT attempted once Phase 11 has completed.

---

## 9. Cycle log

**v0.10 DRAFT 2026-05-22 — R9 closures applied (2 HIGH):**
- **R9 HIGH-1 closed:** moved partial UNIQUE INDEX `forms_template_admin_review_one_active_per_template_uk` from §4.NEW2 into §4.NEW3 (after lifecycle_transition CREATE TABLE) so cutover DDL order is valid; §4.NEW2 prose now describes the 3-layer enforcement architecture (LAYER 1 parent-row FOR UPDATE primary; LAYER 2 trigger defense-in-depth; LAYER 3 partial UNIQUE INDEX in §4.NEW3).
- **R9 HIGH-2 closed:** §8.1 Class A rewritten with explicit 11-role enumeration via `unnest(ARRAY[...])` matching §7 exactly (2 application + 3 dashboard-wrapper-owner + 2 template-wrapper-owner + 1 raw-writer-owner + 3 view-owner); no more stale "15" numeric reference; preflight enumerates role names not counts.

**v0.9 DRAFT 2026-05-22 — R8 closure applied (1 HIGH):**
- **R8 HIGH-1 closed:** added explicit `SELECT 1 FROM forms_template WHERE ... FOR UPDATE` in submit wrapper as canonical (tenant_id, forms_template_id) serialization point; concurrent initial submits serialize on the parent forms_template row lock; trigger + partial UNIQUE INDEX retained as defense-in-depth secondary tripwires.

**v0.8 DRAFT 2026-05-22 — R7 closures applied (2 HIGH):**
- **R7 HIGH-1 closed:** submit wrapper rewritten to handle both initial-submission (triple #1) AND revision-resubmission (triple #5) paths via LATERAL-derived latest-state lookup under FOR UPDATE lock; reuses existing review_id when revision_requested. Replaced non-enforcing UNIQUE constraints (both included review_id) with partial UNIQUE INDEX on lifecycle_transition + BEFORE INSERT trigger `enforce_one_active_review_per_template` rejecting duplicate active reviews. Audit payload extended with `path` field.
- **R7 HIGH-2 closed:** Sub-decision 5 rewritten to enumerate 6 SECDEF procedures + 3 admin views + 3 admin review entities matching §8.1 Class O exactly. Raw writer EXECUTE grant clarified as restricted to 2 template wrapper-owner roles (not 3). Class O allowlist explicitly stated as populated with the 6 wrappers (NOT empty).

**v0.7 DRAFT 2026-05-22 — R6 closures applied (3 HIGH):**
- **R6 HIGH-1 closed:** Phase 6 ↔ Phase 7 reordered — views FIRST (Phase 6), procedures SECOND (Phase 7). Static SQL function bodies validate against existing relations; canonical wrapper-only design forces inverse of P-036 R6.
- **R6 HIGH-2 closed:** Class O allowlist populated with 6 canonical SECDEF wrappers + expected owner roles + dependency objects; ownership-drift attack defense added; future additions require ratifier sign-off.
- **R6 HIGH-3 closed:** §5 endpoint #4 reconciled to admin_basic_operator-only matching wrapper auth; explicit pilot-scope rationale; builder direct-submit deferred to post-pilot v1.1.

**v0.6 DRAFT 2026-05-22 — R5 closures applied (2 HIGH):**
- **R5 HIGH-1 closed:** OQ7 RESOLVED inline; both template wrappers (submit + decision) rewritten with full executable DDL applying the canonical 3-layer authorization defense from Sub-decision 3.5.
- **R5 HIGH-2 closed:** comprehensive flesh-out — §3 audit events full normative table (6 action IDs); §4.NEW2 + §4.NEW3 full executable DDL + CHECK constraints + monotonic-ordering trigger; §6 triple-count reconciled to 5 with full table + terminal-state discipline; §8 §8.1 preflight DO block (classes A-M + N + O + P) + §8.2 11-phase cutover sequencing matching P-040 §8.2 shape + §8.3 rollback discipline. Document is now ratifier-ready.

**v0.5 DRAFT 2026-05-22 — R4 closure applied (1 HIGH):**
- **R4 HIGH-1 closed:** v0.4 R3 closure used `pg_has_role(session_user, ...)` — but in service-account/pooled-connection deployment session_user is the service account, not the JWT principal; the check would pass regardless of whether the JWT-bound end-user is an admin. Genuine privilege-boundary defect; unauthorized access to all 3 dashboard surfaces possible. Fix: 3-layer defense — LAYER A (EXECUTE grant), LAYER B (NEW: schema-backed join to tenant_account_membership verifying `verified_principal_id` has `admin_basic_operator` via `tam.active=TRUE AND 'admin_basic_operator' = ANY(tam.assigned_role_names)`; P-038 R6 dissolution pattern — no net-new helper), LAYER C (tenant scope). All 3 must pass. Added OQ6 (canonical column-name confirmation) + OQ7 (apply same pattern to template wrappers in v0.5+).

**v0.4 DRAFT 2026-05-22 — R3 closures applied (2 HIGH):**
- **R3 HIGH-1 closed:** SECDEF wrapper authorization template used `current_user` (returns function owner under SECDEF, not invoker) — identical to P-040 R17 defect class. Fix: replaced `current_user` with `session_user` (unaffected by SECDEF) in pg_has_role check; combined with EXECUTE-grant primary boundary + SI-024.1 JWT tenant verification for defense-in-depth.
- **R3 HIGH-2 closed:** CDM entity count drifted across §1 ("3") + §4 heading ("3 active") + §8 (admin_template_decision_idempotency_key treated as "later reconciliation"). Fix: reconciled to **4 net-new CDM entities** across §1 (full enumeration) + §4 heading + §4 reconciliation note + §8.2 Phase 2 (all 4 tables in same deployment phase).

**v0.3 DRAFT 2026-05-22 — R2 closures applied (3 HIGH + 1 MED):**
- **R2 HIGH-1 closed:** §4.NEW1 DDL CHECK enum had `'admin_mode1_volume_health'` (in-process placeholder) — Mode 1 wrapper INSERT would fail; corrected to `'admin_mode1_volume_health_v'`.
- **R2 HIGH-2 closed:** §5 endpoint #3 still said "in-process aggregation from ai_mode1_conversation" + OQ2 still recommended deferring view → contradicted R1 HIGH-2; rewrote endpoint to call SECDEF wrapper reading canonical view; OQ2 marked RESOLVED with v1.0 canonical-view decision.
- **R2 HIGH-3 closed:** §7 RBAC enumeration had 1 generic dashboard-wrapper-owner + 2 view-owners while design requires 3+3; rewrote to 11 net-new roles (2 application + 3 dashboard-wrapper-owner + 2 template-wrapper-owner + 1 raw-writer-owner + 3 view-owner) with explicit grant-matrix invariant; updated §1 in-scope from "8" → "11".
- **R2 MED-1 closed:** added §4.NEW4 admin_template_decision_idempotency_key entity DDL with NOT NULL + UNIQUE (tenant_id, review_id, idempotency_key) constraint; wrapper signature `p_idempotency_key TEXT NOT NULL` (no DEFAULT); API rejects calls without Idempotency-Key header (400); double-layered (database UNIQUE + API NOT NULL) prevents NULL-key retries entirely. CDM entity count "3" → "4".

**v0.2 DRAFT 2026-05-22 — R1 closures applied (3 HIGH + 1 MED):**
- **R1 HIGH-1 closed:** restructured to SECDEF-wrapper-only canonical dashboard read path; 3 SECDEF read-wrappers (Sub-decision 3.5); direct SELECT REVOKEd from admin_basic_operator; audit + Cat A + view-read co-transactional under FLOOR-020 fail-closed. Class N becomes defensive integrity tripwire.
- **R1 HIGH-2 closed:** landed canonical `admin_mode1_volume_health_v` view at v1.0 (not deferred); minimized columns (no raw text / patient_id); admin_basic_operator NOT made member of ai_mode1_reader.
- **R1 HIGH-3 closed:** record_forms_template_admin_decision wrapper now SELECT...FOR UPDATE on review row + idempotency-key check + latest-state derivation under lock + rejects non-pending latest state + idempotency-key idempotency. Added `admin_template_decision_idempotency_key` entity.
- **R1 MED-1 closed:** OQ5 tolerance tightened 1% → 0% for production AND staging; rationale: post-R1 HIGH-1 SECDEF wrapper is canonical read path so audit-row drift can ONLY occur via database-integrity defects.

**v0.1 DRAFT 2026-05-22:** pre-Codex-review skeleton. §1 purpose + scope + §2 sub-decisions 1-7 outlined; §3 audit events preliminary; §4 entity #1 with executable DDL + skeleton for entities #2-3; §5-8 stubs to be filled in v0.2 against Codex review feedback + Sub-decision 7 OQ resolutions. Authored on `spec/SI-023-admin-backend-basics-2026-05-22` branch off main at `5852be3` (post-P-040 close-out). FIFTH and FINAL pilot-required slice; once ratified the telecheck-app pilot implementation gate opens fully.
