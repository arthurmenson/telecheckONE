# CDM v1.9 → v1.10 + AUDIT_EVENTS v5.11 → v5.12 + OpenAPI v0.4 → v0.5 + State Machines v1.3 → v1.4 + RBAC v1.3 → v1.4 Amendment (SI-022 Crisis Response follow-on)

**Version:** 0.21 DRAFT
**Status:** POST-R18 (1 HIGH closed inline: R18 HIGH-1 v0.20 fixed the executable trigger DDL (SECURITY DEFINER → SECURITY INVOKER) but the Phase 7.1 NORMATIVE PROSE still mandated SECURITY DEFINER + generic `insufficient_privilege` expectation — an implementer following the phase text rather than the SQL snippet could recreate the R17 bug, AND the SQLSTATE mismatch conflicts with the class K behavioral check that expects CR022. Fix: rewrote Phase 7.1 prose to state SECURITY INVOKER, explain that current_user inside the trigger is the DDL-issuing role (respecting SET ROLE semantics), explain that owner assignment is preserved for ALTER/DROP control but NOT for runtime authorization, and replace the stale `insufficient_privilege` expectation with the dedicated `CR022` SQLSTATE used by class K. Phase 7.1 prose now consistent with v0.20 executable trigger DDL. Previously POST-R17 (1 HIGH closed inline: R17 HIGH-1 trigger function was declared SECURITY DEFINER and used `current_user` for both the break-glass allowlist check AND the has_table_privilege() capability checks. PostgreSQL semantic: inside a SECURITY DEFINER function, `current_user` returns the function OWNER (`break_glass_procedure_owner`), NOT the DDL-issuing role. Result: break-glass allowlist check trivially passed for ANY caller (owner IS in break-glass set), trigger silently skipped CR022 raise, non-breakglass callers bypassed entirely — including class K behavioral probe (would false-pass). Genuine correctness defect, not theoretical. Fix: changed function declaration from `SECURITY DEFINER` → `SECURITY INVOKER`. With SECURITY INVOKER, `current_user` inside the trigger = the actual DDL-issuing role (respecting SET ROLE semantics, which is what class K relies on). Break-glass allowlist + has_table_privilege() checks now evaluate against the real DDL caller. Trigger does NOT require owner-level privileges (current_query() + has_table_privilege() + pg_auth_members traversal all work under invoker privileges). Locked search_path preserved for safe catalog access. ALTER FUNCTION OWNER TO break_glass_procedure_owner preserved (for ALTER/DROP control) but no longer affects runtime authorization. Previously POST-R16 (1 HIGH closed inline: R16 HIGH-1 trigger capability branch enumerated 6 has_table_privilege() checks but the text-scan enumerated 8 crisis-domain objects — `crisis_sweep_execution` + `notification_crisis_dispatch_ledger` were omitted from the capability branch despite appearing in the text-scan regex. A non-breakglass role with legitimate SELECT on one of the omitted relations could create a non-SECDEF helper function reading that relation + `CREATE MATERIALIZED VIEW ... AS SELECT * FROM helper_fn()` would bypass both branches (text-scan misses because CTAS text names only the helper; capability-branch misses because the relation isn't checked). NOT the accepted SECDEF wrapper residual risk; a gap in the ratified dual-detection implementation itself. Fix: added 2 missing `has_table_privilege()` checks (crisis_sweep_execution + notification_crisis_dispatch_ledger) to capability branch; capability branch now enumerates all 8 crisis-domain objects matching the text-scan exactly. Previously POST-R15 (1 HIGH closed via RATIFIER DECISION — Option B selected by Evans 2026-05-21 chat-message; R14 categorical-block REVERTED to v0.16 dual-detection. R15 Codex verdict flagged the R14 categorical CTAS block as a database-wide DDL policy change scope-creeping P-040 into a platform-floor invariant (hard-floor item 6 territory per CLAUDE.md autonomous-work-authorization). Escalation discipline followed: ERR authored at `Telecheck_v1_10_PRD_Update/Engineering-Review-Request-P-040-R15-CTAS-Categorical-Block-Scope-2026-05-21.md`; Codex Pass-1 source-first independent consult recommended Option B-prime; Codex Pass-2 contrast-and-synthesize confirmed B-prime as ratification-hardened B; Claude's recommendation was plain B. Evans's chat-message ratification = "B" (plain Option B, NOT B-prime). Per ratified B: (a) trigger function body reverted to v0.16 dual-detection (text-scan + has_table_privilege() capability check); (b) RAISE EXCEPTION message reverted to crisis-domain-reference framing (not categorical-block); (c) accepted residual SECDEF wrapper indirection risk documented in trigger comment block AND §9 cycle log — bounded at v1.10 because the 6 §3 canonical wrappers all return VOID/uuid (not row sets) and are EXECUTE-restricted to canonical app roles per §3 + §7; (d) Track 6 follow-on cycle "Crisis Data Provenance Hardening v2" recommended (not mandatory per Evans's plain-B selection) as proper venue if/when a row-returning crisis SECDEF wrapper is added; (e) §8.2 Phase 7.1 trigger DDL reflects the reverted dual-detection logic; classes A through M + G.2 + G.3 + H + I + J + K + L preflight assertions all preserved unchanged. R15 hard-floor item 6 DISSOLUTION precedent matches P-038 R6 dissolution pattern (Codex Option B recommendation adopted; closure path removed the architectural-judgment trigger condition rather than escalating a net-new platform-floor primitive). Previously POST-R14 (1 HIGH closed inline: R14 HIGH-1 v0.16 trigger had dual detection — text-scan OR has_table_privilege() capability check — but BOTH branches authorized based on the CTAS caller's properties; SECURITY DEFINER wrapper indirection defeated both: a low-privilege caller with no direct crisis SELECT but EXECUTE on an existing SECDEF wrapper that reads crisis data under its owner's privilege could `CREATE MATERIALIZED VIEW ... AS SELECT * FROM wrapper_fn()` — current_user has no crisis privilege (capability branch FALSE), CTAS text only names wrapper (text branch FALSE), wrapper's owner-side SELECT happens AFTER ddl_command_start fires → CR022 silent → crisis data persists in MV. Resolving every referenced function + walking its body for SECDEF + crisis access at trigger time would be brittle (static SQL only; misses EXECUTE/dblink/nested chains; parser-version-dependent). Fix: replaced detection-based block with CATEGORICAL block — trigger rejects ALL CTAS / SELECT INTO / CREATE MATERIALIZED VIEW from non-breakglass roles regardless of statement content. The categorical block is strictly stronger: no detection logic to bypass, no indirection chain to chase. Non-breakglass roles cannot use these 3 DDL commands at all in this database; routine migration uses standard DDL (CREATE TABLE + INSERT, not CTAS); analytics MVs needing CTAS shapes are owned by break-glass-admin and granted to consumers through normal grant matrix. Trigger query-text preserved in exception message for forensics but no longer used as authorization input. Previously POST-R13 (2 HIGH closed inline: R13 HIGH-1 CTAS event trigger only inspected `current_query()` text for direct crisis-domain references; function-indirection bypass possible — a role with SELECT on crisis view + CREATE in any schema could create non-SECDEF helper function whose body reads the crisis view, then `CREATE MATERIALIZED VIEW ... AS SELECT * FROM helper_fn()`; CTAS query text wouldn't contain crisis-domain names → trigger wouldn't fire. Class J only scans SECDEF routines, not non-SECDEF helpers. Fix: trigger function extended with DUAL detection — text scan OR `has_table_privilege(current_user, ...)` capability check across the 6 canonical crisis-domain tables/views; either branch firing triggers `CR022` block. Capability check uses PostgreSQL `has_table_privilege()` which accounts for role-membership inheritance, catching the indirection bypass class (the role would need at least one of the canonical reads to construct the helper). R13 HIGH-2 Phase 7.1.a step (3a) GRANT SELECT executed BEFORE Phase 7 creates the staff view — `relation does not exist` blocks cutover; if implementer skipped the failed grant, class K would raise permission-check-intercept instead of proving trigger fired. Fix: moved the GRANT SELECT step from Phase 7.1.a to a new Phase 7.2 immediately after Phase 7 view creation; Phase 7.1.a now documents the requirement and cross-references Phase 7.2 for the executable grant. Sequencing now correct: Phase 7 creates view → Phase 7.2 grants minimal SELECT → §8.1 class K behavioral preflight runs after Phase 10 (preflight gate). Previously POST-R12 (1 HIGH closed inline: R12 HIGH-1 behavioral CTAS probe could false-positive — test role lacks SELECT on the staff view → PostgreSQL view-permission check rejects CTAS with generic `insufficient_privilege` BEFORE event trigger evaluates → class K reads any `insufficient_privilege` as "trigger blocked CTAS" (false positive); a stubbed/disabled trigger would still pass preflight. Same R9/R11 false-positive shape but via a different intercept layer. Fix: (a) Phase 7.1 event trigger function changed to raise with dedicated user-defined SQLSTATE `CR022` (5-char user code reserved for SI-022 crisis provenance enforcement) instead of generic `insufficient_privilege`. (b) Class K WHEN clause changed to `WHEN SQLSTATE 'CR022' THEN v_blocked := TRUE` — asserts the EXACT dedicated SQLSTATE that the trigger raises, not generic insufficient_privilege; added explicit `WHEN insufficient_privilege` branch that raises `crisis-view-ctas-preflight-permission-check-intercept` error pointing to Phase 7.1.a step (3a). (c) Phase 7.1.a added step (3a) — `GRANT SELECT ON public.crisis_event_current_state_v TO crisis_ctas_preflight_test_role` so PG normal view-permission check passes + the event trigger becomes the SOLE gating mechanism; minimal grant does NOT make test role a canonical reader (no reader-role membership; class H + G.2 + G.3 unaffected); only ensures probe reaches event-trigger evaluation path. (d) Class G.1 staff-view allowlist extended to include `crisis_ctas_preflight_test_role` as a permitted grantee (alongside staff_reader + view_owner). The dedicated SQLSTATE provides defense-in-depth: even if a future change accidentally revoked the Phase 7.1.a step (3a) grant, class K surfaces a clear actionable error rather than silently false-positive. Previously POST-R11 (1 HIGH closed inline: R11 HIGH-1 behavioral CTAS preflight used `SET LOCAL ROLE crisis_ctas_preflight_test_role` but Phase 7.1.a explicitly isolated the test role from canonical privileges without granting test-role MEMBERSHIP to the preflight-executor; PostgreSQL `SET ROLE` requires the session user to have been granted membership in the target role (unless superuser); under least-privileged migration posture, SET ROLE fails with `insufficient_privilege` BEFORE the probe runs — class K then catches that exception as the expected "trigger fired" outcome (false positive); a correctly-configured event trigger could still fail preflight for the wrong reason while a mis-configured one passes. Fix: (a) Phase 7.1.a step (3) added explicit `GRANT crisis_ctas_preflight_test_role TO cdm_owner` so the canonical migration-runner role (already established as the §8.2 cutover executor per P-032) gains the ability to SET ROLE to the test role; explicit note that role-membership grants are one-way INTO the granted-from role's identity, so the test role does NOT inherit cdm_owner privileges by virtue of this grant; class H + G.2 recursive-membership-closure assertions remain unchanged because the test role still is not a member of any reader/admin/wrapper-owner role. (b) Class K added explicit `pg_has_role(current_user, v_test_role, 'MEMBER')` precondition check BEFORE the `SET LOCAL ROLE` attempt — produces a clear actionable error (`crisis-view-ctas-preflight-set-role-precondition-violation`) if the GRANT was missed; the precondition check distinguishes "SET ROLE failed because grant missing" from "event trigger blocked CTAS as expected" so the behavioral assertion's true/false interpretation is unambiguous. Previously POST-R10 (1 HIGH closed inline: R10 HIGH-1 behavioral CTAS preflight probe used `pg_temp` as target for `CREATE MATERIALIZED VIEW` — `pg_temp` is NOT a valid target for MVs (materialized views are durable persistent relations, not temporary); the probe would fail with `invalid_schema_name` BEFORE the event trigger had a chance to raise `insufficient_privilege`; class K explicitly rejects any non-`insufficient_privilege` exception, so a correctly-configured trigger could still fail the deploy gate making the behavioral assertion non-executable in standard PostgreSQL. Fix: (a) Phase 7.1.a extended to create durable scratch schema `crisis_preflight_scratch` owned by `crisis_ctas_preflight_test_role` (with explanatory note on why pg_temp doesn't work for MV target); (b) class K behavioral probe target changed from `pg_temp.__crisis_ctas_preflight_probe` to `crisis_preflight_scratch.__crisis_ctas_preflight_probe` so MV creation is structurally permitted + only the event trigger's insufficient_privilege should reject it; (c) added defensive cleanup `DROP MATERIALIZED VIEW IF EXISTS ...` both before the probe (any orphan from crashed prior preflight) AND after the probe (if trigger didn't fire — probe MV must not linger persisting tenant-wide-rows-shape outside security boundary); (d) added scratch-schema-existence assertion to preflight matching the test-role-existence assertion. Previously POST-R9 (1 HIGH closed inline: R9 HIGH-1 Phase 7.1 CTAS event-trigger spec referenced `pg_event_trigger_ddl_commands()` for command introspection but that function is only available at `ddl_command_end`, NOT `ddl_command_start` — the spec was non-implementable as written. Class K secondary assertion only verified trigger existence + enabled, not actual blocking behavior — a stub or mis-configured trigger could pass class K while CTAS still succeeded. Fix: (a) rewrote Phase 7.1 with executable trigger DDL using `current_query()` text inspection (the correct mechanism at `ddl_command_start`); SECURITY DEFINER + locked search_path; command-tag filter via WHEN TAG IN clause; recursive break-glass-admin allowlist via WITH RECURSIVE over pg_auth_members. (b) Added Phase 7.1.a — synthetic `crisis_ctas_preflight_test_role` NOLOGIN role for behavioral preflight (not member of any canonical role). (c) Class K behavioral assertion expanded — uses `SET LOCAL ROLE crisis_ctas_preflight_test_role` then attempts `CREATE MATERIALIZED VIEW pg_temp.__crisis_ctas_preflight_probe AS SELECT * FROM public.crisis_event_current_state_v WHERE FALSE`; expects `insufficient_privilege` exception; reject with explicit defect message if (i) no exception raised (trigger mis-configured) or (ii) wrong errcode/message (trigger fired but with unexpected error). Test role context restored via RESET ROLE post-attempt. Behavioral verification proves the trigger actually rejects CTAS — existence check alone is insufficient. Previously POST-R8 (2 HIGH closed inline: R8 HIGH-1 class K dependency traversal was catalog-wrong — PostgreSQL view/MV dependencies attach to the dependent rewrite rule, not directly to the dependent pg_class row; v0.10 query had refobjid/objid inverted and would miss every real derived view/MV. CTAS tables additionally have NO pg_depend edge at all. Fix: rewrote class K with correct catalog graph (source view oid → pg_depend.refobjid + classid='pg_rewrite' → pg_rewrite.ev_class → dependent pg_class) — catches real derived views + MVs; relkind set narrowed to {m, v, f} (CTAS 'r' relations are NOT pg_depend-discoverable so removed from the class K join + handled via DDL event trigger). Added §8.2 Phase 7.1 — DDL event trigger `crisis_view_ctas_provenance_block` on ddl_command_start for {CREATE TABLE AS, SELECT INTO, CREATE MATERIALIZED VIEW} rejecting any command that references crisis views / crisis_event_* base tables unless issued by a canonical break-glass-admin role; trigger is the AUTHORITATIVE defense for CTAS bypass class. Class K extended with secondary assertion verifying the event trigger exists + is enabled. R8 HIGH-2 no view-definition integrity assertion — a drifted/malicious crisis_event_patient_summary_v with same name + owner + reloptions + grant matrix but a different body (e.g., missing verify_session_jwt_and_extract_claims + consent_grant predicate) would pass all prior assertions while restoring the v0.3 R1 HIGH-2 tenant-wide read leak. Fix: added §8.1 class (M) — pg_get_viewdef() text scan asserting the patient view body references verify_session_jwt_and_extract_claims + consent_grant + emergency_contact_share + verified_patient_id (positive) AND does NOT reference crisis_event_current_state_v (negative — cross-reference would pull tenant-wide rows transitively); staff view body asserted to reference the canonical 3 source tables. Text-scan is coarse but catches the dominant drift modes (predicate-removed, consent-removed, staff-view-substituted-under-patient-name). Previously POST-R7 (3 HIGH closed inline: R7 HIGH-1 class I pg_depend SECDEF check missed dynamic SQL via EXECUTE / dblink / postgres_fdw — those references don't create pg_depend edges; SECDEF function with `EXECUTE 'SELECT * FROM crisis_event_current_state_v'` body would pass class I while still re-exposing tenant-wide rows under owner privileges. Fix: added §8.1 class (J) — prosrc text scan of ALL SECDEF routines for static references to crisis-domain objects (views + base tables + dblink + postgres_fdw); rejects any non-allowlisted match (allowlist = the 6 §3 canonical procedures which legitimately reference base tables); plus PUBLIC EXECUTE rejection on ANY SECDEF routine with crisis-domain prosrc reference. R7 HIGH-2 no check for derived persistent copies — materialized views or other relations populated from the crisis views can persist tenant-wide rows outside the security boundary then be granted to noncanonical roles without showing as offending direct view grants. Fix: added §8.1 class (K) — pg_depend scan rejecting any pg_class.relkind ∈ {m, v, r, f} that depends on either crisis view's rewrite rule unless on canonical allowlist (empty at v1.10). R7 HIGH-3 view-owner relowner not asserted — Phase 7 says canonical owners but preflight only checked reloptions + grants; an ALTER VIEW ... OWNER TO noncanonical_role would pass while giving the new owner implicit control over view definition + grants. Fix: added §8.1 class (L) — pg_class.relowner assertion verifying each crisis view's actual owner exactly matches its canonical view-owner role + owner-attribute assertion (canonical view-owner roles MUST be NOLOGIN + non-BYPASSRLS). Previously POST-R6 (2 HIGH closed inline: R6 HIGH-1 preflight ignored predefined/global read roles — a non-canonical principal granted `pg_read_all_data` (PG14+ predefined role) can SELECT public views without appearing as a grantee on either crisis view or as effective member of the reader roles; BYPASSRLS roles similarly bypass tenant RLS. Same impact class as R1 HIGH-2 vulnerability but via predefined-role inheritance instead of explicit grant. Fix: added §8.1 assertion class (H) — recursive effective-membership closure for pg_read_all_data (PG14+; vacuous-pass on PG13-) + BYPASSRLS attribute check; both restricted to a canonical `break_glass_procedure_owner` / `platform_operator_breakglass` allowlist; application runtime roles MUST NOT hold either. R6 HIGH-2 SECURITY DEFINER functions/procedures depending on the crisis views weren't checked — a SECDEF function owned by staff_reader (or any admin role) and EXECUTE-granted to PUBLIC or patient/delegate could read the tenant-wide staff view under owner's privileges and return rows to non-canonical callers, bypassing both G.1 grant-matrix and G.2 membership-closure. Fix: added §8.1 assertion class (I) — pg_depend-based check rejecting any SECURITY DEFINER routine that depends on either crisis view unless on `v_canonical_secdef_view_dependents` allowlist (which is EMPTY at v1.10 — the 6 §3 wrapper procedures operate on base tables, NOT on views). Also rejects PUBLIC EXECUTE on any of the 6 canonical crisis procedures. Future addition of a SECDEF routine that depends on a crisis view requires explicit allowlist update + ratifier sign-off. Previously POST-R5 (2 HIGH + 1 MED closed inline: R5 HIGH-1 G.2 depended on undefined `public.tenant_role_resolution` table + `canonical_*_members` columns — non-implementable; deploy would fail with `relation does not exist` before the assertion could evaluate. Fix: replaced tenant_role_resolution dependency with hardcoded canonical-member allowlist constants in the DO block (`v_canonical_staff_effective` + `v_canonical_patient_effective` arrays); no net-new schema artifact required; allowlist constants are deployment-bound (update before preflight if a deployment uses different canonical role names). R5 HIGH-2 G.2 only checked one-hop direct members of crisis_event_staff_reader/_patient_reader — a non-canonical role granted membership in `tenant_clinician` (which is member of staff_reader) would inherit staff-view privilege transitively without showing as direct member of staff_reader. Same R4 HIGH-1 class of bypass through transitive inheritance. Fix: rewrote G.2 with WITH RECURSIVE CTE over pg_auth_members starting from each reader role and traversing downward through all intermediate roles; recursive closure terminates because pg_auth_members forbids cycles. Three recursive checks: effective-members of staff_reader, effective-members of patient_reader, and cross-membership (no role may be effective member of BOTH). R5 MED-1 §7 RBAC section heading still said "+13 net-new roles" + "Application roles (6)" while §1/§8.1/§8.2 reconciled to 15/7 — preserved the exact drift R4 was supposed to close. Fix: §7 heading rewritten to "+15 net-new roles" + "Application roles (7)" with explicit R5 MED-1 reconciliation note. Previously POST-R4 (3 HIGH closed inline: R4 HIGH-1 grant allowlist (G.1) only scanned direct SELECT rows in role_table_grants — any role made a MEMBER of crisis_event_staff_reader or crisis_event_patient_reader inherits view privilege via pg_auth_members WITHOUT appearing in role_table_grants; same bypass shape as R3 HIGH-1 but through role inheritance. Fix: added (G.2) role-membership closure assertion validating canonical-member sets resolved from `tenant_role_resolution` row; rejects any non-canonical member of either reader role + rejects cross-membership (a role member of BOTH readers would inherit both views, defeating the R1 HIGH-2 split); added (G.3) grant-option/admin-option rejection — WITH GRANT OPTION on view SELECT grants would let canonical reader role re-grant SELECT downstream, defeating allowlist; ADMIN OPTION on reader-role membership would let a member grant reader-role membership to arbitrary downstream roles, defeating the membership-closure allowlist. R4 HIGH-2 §1 RBAC scope summary still said "13 new role definitions" with retired single crisis_event_reader + only one view owner — top-level scope contract drift; implementer following §1 could recreate the single-view/single-reader v0.3 vulnerability. Fix: rewrote §1 RBAC scope clause to enumerate all 15 net-new roles explicitly matching §7 + §8.2 Phase 1 + §8.1 class A; retired crisis_event_reader explicitly removed from scope. R4 HIGH-3 jwt_migration_entity_status seed scope listed only 4 entries (3 tables + staff view) — patient-summary view absent despite being a JWT-bound boundary via verify_session_jwt_and_extract_claims() predicate; absent from seed creates version-skew risk during JWT migration on the more sensitive self-scoped read path. Fix: §1 + §8.1 class B + §8.2 Phase 8 all updated from "4 entries" to "5 entries" including `crisis_event_patient_summary_v` with same `phase_4_cutover_eligible=FALSE + raw_guc_fallback_audited=TRUE` defaults. Previously POST-R3 (2 HIGH closed inline: R3 HIGH-1 §8.1 assertion class (G) only checked 5 specific cases — PUBLIC or any other arbitrary role with a manual `GRANT SELECT ON crisis_event_current_state_v TO PUBLIC` would pass class G while giving patient/delegate sessions or broad SQL clients access to the tenant-wide staff view. Bypass-shape preserved through grantees not enumerated. Fix: replaced the 5 point checks with a TRUE ALLOWLIST query over `information_schema.role_table_grants` — any SELECT grant on either crisis view OUTSIDE the exact allowed grantee pair (staff_reader + staff_view_owner for staff view; patient_reader + patient_summary_view_owner for patient view) causes preflight to fail with explicit `crisis-view-grant-allowlist-violation` message. PUBLIC, legacy/application roles, and ad-hoc manual grants are ALL caught. Both intended positives (the 2 canonical grant pairs) preserved as separate assertions so the allowlist isn't satisfied vacuously by zero-grants. R3 HIGH-2 §8.2 Phase 1 still said "Create the 13 net-new RBAC roles" — stale count from before R1 HIGH-2 reader-role split; a migration following the sequencing could omit one of the split roles and either fail late or compensate by reusing the retired/single-reader pattern. Phase 1 is the AUTHORITATIVE create step — count drift here is a deploy defect, not cosmetic. Fix: rewrote Phase 1 to require all 15 net-new roles, enumerated explicitly (1) crisis_initiator through (15) crisis_event_patient_summary_view_owner, with cross-reference to §7 + §8.1 class A; explicit assertion that retired crisis_event_reader role MUST NOT be created (§8.1 class G allowlist would reject). Previously POST-R2 (2 HIGH closed inline: R2 HIGH-1 §5 OpenAPI table still routed `/v1/crisis/mine` to the tenant-wide staff view `crisis_event_current_state_v` with endpoint-side JWT predicate — that is the EXACT v0.3 R1 HIGH-2 vulnerability shape; any implementation following §5 could bind patient/delegate traffic to the tenant-wide view instead of the predicate-restricted DB view, making R1 HIGH-2 closure incomplete and dependent on application filtering rather than the documented RBAC+view+RLS split. Fix: rewrote endpoint 2 row in §5 to read `crisis_event_patient_summary_v` EXCLUSIVELY + require `crisis_event_patient_reader` role + explicit prose that DB privilege boundary prevents accidental cross-grant; rewrote endpoint 1 row to enforce `crisis_event_staff_reader` role requirement. R2 HIGH-2 §8.2 Phase 7 still created only `crisis_event_current_state_v` + granted to retired `crisis_event_reader` role; migration would fail (role not among 15 required) or worse recreate the broad-reader exposure pattern. Fix: rewrote Phase 7 to create BOTH views with `security_invoker=true, security_barrier=true`, set both view owners, REVOKE ALL FROM PUBLIC, GRANT crisis_event_current_state_v to crisis_event_staff_reader ONLY, GRANT crisis_event_patient_summary_v to crisis_event_patient_reader ONLY; explicit DO NOT grant to retired role. Added §8.1 preflight assertion class (G) verifying actual SELECT grants on both views match the split-reader model — 5 grant-matrix checks: 2 negative (patient_reader MUST NOT hold staff view grant; staff_reader MUST NOT hold patient view grant) + 1 retired-role negative (crisis_event_reader MUST NOT have grants on either view) + 2 positive (staff_reader MUST have grant on staff view; patient_reader MUST have grant on patient view). Previously POST-R1 (3 HIGH closed inline: R1 HIGH-1 backfill path could not satisfy NOT NULL FK on existing P-027 rows — added explicit legacy-row migration coverage preflight assertion class (E0a/b/c) checking dispatch_ledger + provider_attempt + escalation_obligation orphan-row resolvability via (tenant_id, server_signal_id) → crisis_event.id lookup before Phase 3 NOT NULL ALTER; if any orphan row lacks resolvable match, deploy MUST author legacy-source synthesis migration first. For day-1 pilot tenants Telecheck-US (Heros-US greenfield) + Telecheck-Ghana, the assertion passes trivially because there are zero existing notification_crisis_* rows; the assertion exists as defense for any future environment migration. R1 HIGH-2 crisis_event_reader role was over-broadly granted to both clinicians AND patients/delegates — DB-level grant didn't enforce the patient/delegate predicate, so any SQL client or future endpoint using the role could read tenant-wide crisis state with only tenant RLS protection. Fix: split reader-view pair per P-038 R5 HIGH-1 pattern. Added §4.NEW4a crisis_event_patient_summary_v patient/delegate self-scoped view with verify_session_jwt_and_extract_claims() + consent_grant predicate enforcing per-row visibility to caller's own patient_id OR delegated patient_ids only. Roles: crisis_event_staff_reader (clinician + care-team + admin; tenant-wide view) and crisis_event_patient_reader (patient + delegate; predicate-restricted view). 3-layer enforcement: RBAC + view predicate + RLS. RBAC count 13 → 15 net-new roles. R1 HIGH-3 view DDL had WITH (security_barrier=true) but missing security_invoker=true — only in prose. Without security_invoker the view would run under owner privileges, bypassing caller-scoped RLS on underlying tables. Fix: corrected DDL to WITH (security_invoker = true, security_barrier = true) on both views (current_state_v + patient_summary_v); added §8.1 preflight assertion class (F) verifying both views have security_invoker=true in pg_class.reloptions after CREATE VIEW.)
**Authoring date:** 2026-05-21
**Trigger:** Promotion Ledger P-039 (SI-022 Crisis Response Slice v1.0 RATIFIED 2026-05-21 via Codex R67 ship-it APPROVE; Registry v2.25 → v2.26). Per the established post-P-029 SI-spec-first promotion pattern, SI-022's canonical content lands in CDM + AUDIT_EVENTS + OpenAPI + State Machines + RBAC via a separate amendment cycle following SI ratification. **EIGHTH instance** of the SI-spec-first promotion pattern (P-029, P-032, P-034, P-036, P-038, P-040 — note P-035 was SI-only, and P-037 was followed by P-038 as its CDM follow-on; this P-040 is the 6th follow-on amendment in the post-P-029 lineage).
**Owner:** Crisis Response slice owner + Platform AI Safety + Mode 1 AI Service owner + Notification slice owner + Adverse-Event slice owner + Audit owner + CDM owner + AUDIT_EVENTS owner + OpenAPI owner + State Machines owner + RBAC owner.
**Parent SI:** SI-022 v1.0 RATIFIED (`Telecheck_SI_022_Crisis_Response_v1_0.md`); P-039 is the ratification authority for this amendment.
**Companion documents:** P-031 (SI-024.1 v0.8 JWT-binding canonical trust anchor); P-027 (Contracts Pack v5.3 + I-035 + §4.66-4.68 notification_crisis_* baseline entities); P-035 (AI Service Mode 1 Handler Spec v0.4 FLOOR-020 crisis-detection emit); previous follow-on amendment patterns (`Telecheck_CDM_v1_8_to_v1_9_Amendment.md` P-038; `Telecheck_CDM_v1_7_to_v1_8_Amendment.md` P-036; `Telecheck_CDM_v1_6_to_v1_7_Amendment.md` P-034; `Telecheck_CDM_v1_5_to_v1_6_Amendment.md` P-032; `Telecheck_CDM_v1_4_to_v1_5_Amendment.md` P-029).
**Companion invariants:** I-019 (crisis-detection-always-on platform-floor invariant); I-027 (audit append-only); I-035 (append-only invariant for ratification + audit-bound state machines); FLOOR-020 (Cat A fail-closed audit emission discipline).

---

## 1. Purpose + scope

Mechanical consolidation of SI-022 v1.0 RATIFIED (P-039) canonical content into named bundle file sections. EIGHTH instance of the established post-P-029 SI-spec-first promotion pattern.

**In scope:**

1. **CDM v1.9 → v1.10:** +3 new entities (`crisis_event`, `crisis_event_lifecycle_transition`, `crisis_sweep_execution`) + additive column extensions to 3 P-027 §4.66-4.68 entities (`notification_crisis_dispatch_ledger`, `notification_crisis_provider_attempt`, `notification_crisis_escalation_obligation`) + 2 OPTIONAL canonical views per R1 HIGH-2 closure 2026-05-21 data-minimization split (`crisis_event_current_state_v` staff tenant-wide reader + `crisis_event_patient_summary_v` patient/delegate self-scoped reader — DERIVED from append-only lifecycle transitions) + **6 SECURITY DEFINER procedures owned by 5 distinct owner roles**: the 7 procedures are (1) raw `record_crisis_event_lifecycle_transition()` owned by `crisis_event_lifecycle_transition_writer_owner`; (2)–(6) five wrapper procedures owned by 4 wrapper-owner roles: `record_crisis_initiation()` (crisis_initiation_wrapper_owner), `record_crisis_acknowledgement_claim()` (crisis_acknowledgement_wrapper_owner), `record_crisis_response()` (crisis_response_wrapper_owner), `record_crisis_resolution()` (crisis_resolution_wrapper_owner), and `execute_crisis_no_acknowledgement_sweep()` (crisis_sweep_wrapper_owner). Total: 1 raw procedure + 5 wrapper procedures = 6 procedures; 1 raw owner + 4 wrapper owners = 5 procedure-owner roles. Continuing CDM numbering from v1.9's 96 active entities + 7 derived views + 1 optional MV; v1.10 target: 99 active entities + 8 derived views + 1 optional MV.
2. **AUDIT_EVENTS v5.11 → v5.12:** +12 new action IDs under `crisis.*` namespace per SI-022 v1.0 §3 normative table. **Authoritative per-row category labels: 7 Cat A + 0 Cat B + 5 Cat C** (see §4 of this amendment for the full per-row table). **Tally-drift reconciliation note:** SI-022 v1.0 §3 summary line says "8 Cat A + 0 Cat B + 4 Cat C" — this is a 1-row off-by-one tally vs the per-row labels in the SI's own §3 table (the row labels are authoritative). The per-row count (7A + 5C) governs this amendment's normative content; the SI's summary tally drift will be patched in a downstream prose-correction PR after P-040 lands. Cat A: `crisis.detected`, `crisis.acknowledged`, `crisis.responded`, `crisis.resolved`, `crisis.no_acknowledgement_escalation`, `crisis.regulatory_threshold_reached`, `crisis.final_tier_reached`. Cat C: `crisis.dispatch_attempt_failed`, `crisis.sweep_replay_after_commit_ack_loss`, `crisis.sweep_claim_recovery_with_committed_cycle`, `crisis.delivery_fence_mismatch_dropped`, `crisis.sweep_stale_eligibility_dropped`. **Existing audits preserved unchanged**: `crisis_detection_trigger` Cat A (FLOOR-020 platform-floor at P-035 — distinct from the new lifecycle-bound `crisis.detected` Cat A; the trigger is emitted by the Mode 1 handler at FLOOR-020 BEFORE the crisis_event INSERT; `crisis.detected` is emitted by `record_crisis_initiation()` AFTER crisis_event INSERT completes the same atomic transaction); `crisis.escalation_destination_resolved` Cat B from P-025 (CCR resolver outcome).
3. **OpenAPI v0.4 → v0.5:** +5-10 new endpoints under `/v1/crisis-events/*` (initiation surface OAuth-bound; acknowledge/respond/resolve wrappers; unauthenticated-emergency fallback per Sub-decision 3 logical recipient 1). Exact endpoint count TBD against SI's §5 normative endpoint list.
4. **State Machines v1.3 → v1.4:** +1 new state machine `crisis_event_lifecycle` described as DERIVED from append-only `crisis_event_lifecycle_transition` rows per I-035; CHECK constraint enumerates 11 allowed `(from_state, to_state, transition_reason)` triples per SI-022 Sub-decision 4 + §6 normative table (post-R8+R11 expansion: 9 → 11 triples).
5. **RBAC v1.3 → v1.4 (R4 HIGH-2 closure 2026-05-21: 15 net-new roles, NOT 13; the prior count was stale from before R1 HIGH-2 reader-role split + R1 HIGH-2 view-owner split):** +15 new role definitions matching §7 + §8.2 Phase 1 + §8.1 class A. Application roles (7): crisis_initiator, crisis_acknowledger, crisis_responder, crisis_resolver, crisis_sweep_scheduler, **crisis_event_staff_reader** (R1 HIGH-2 split — tenant-wide; clinician + care-team + admin), **crisis_event_patient_reader** (R1 HIGH-2 split — self-scoped via predicate-restricted view; patient + delegate). Wrapper-owner roles (5): crisis_initiation_wrapper_owner + crisis_acknowledgement_wrapper_owner + crisis_response_wrapper_owner + crisis_resolution_wrapper_owner + crisis_sweep_wrapper_owner. Raw-writer-owner role (1): crisis_event_lifecycle_transition_writer_owner. View-owner roles (2; R1 HIGH-2 split): **crisis_event_current_state_view_owner** + **crisis_event_patient_summary_view_owner**. The retired `crisis_event_reader` role is NOT created (§8.1 class G allowlist rejects it).
6. **`jwt_migration_entity_status` seed scope (R4 HIGH-3 closure 2026-05-21: 5 entries, NOT 4 — the patient-summary view is itself a JWT-bound boundary via its verify_session_jwt_and_extract_claims() predicate and MUST be tracked under the same raw_guc_fallback_audited/phase_4_cutover_eligible discipline as the staff view):** 5 entries (3 RLS-bearing crisis_* tables + 2 derived views: `crisis_event_current_state_v` + `crisis_event_patient_summary_v`) with `phase_4_cutover_eligible=FALSE` + `raw_guc_fallback_audited=TRUE` defaults per established post-P-032 seeding pattern.

**Out of scope:**

- SI-022 implementation in `telecheck-app` code repo (Phase A foundation).
- CCR slice canonical entities (referenced via P-025 `ccr_crisis_helpline_resolution` Cat B → Cat C audit; entity defined in CCR canonical scope).
- Mode 1 AI Service handler internals (referenced via FLOOR-020 emit at handler completion; covered by P-035 + P-036).
- Adverse-Event slice (referenced via `crisis.regulatory_threshold_reached` Cat A; downstream consumer; covered separately).
- INVARIANTS bump (no new platform-floor invariants from SI-022; all closures align with I-019 + I-023 + I-026 + I-027 + I-032 v5.3 + I-035 + FLOOR-020).

---

## 2. New CDM entities (3 active + additive column extensions to 3 existing P-027 entities + 1 OPTIONAL derived view)

All 3 net-new active entities are **tenant-scoped** with composite identity propagation chain: `crisis_event → crisis_event_lifecycle_transition` (append-only log; Option A canonical pattern per I-035); `crisis_event → crisis_sweep_execution` (durable per-sweep execution row with fencing-token + lease-takeover semantics).

**Composite identity propagation chain:** crisis_event → lifecycle_transition (append-only); crisis_event → escalation_obligation (P-027 §4.68 baseline + additive columns); crisis_event → provider_attempt (P-027 §4.67 baseline + additive crisis_event_id FK + recipient_principal_id + sweep_cycle_id columns); escalation_obligation → sweep_execution (1-to-N per generation, partial UNIQUE constraint on uncompleted rows).

**KMS encryption (I-026)** on PHI-bearing column groups in crisis_event (intake_payload + clinical_summary) using the 8-column flat envelope pattern (mirrors SI-005 P-021 pattern).

### §4.NEW1 — `crisis_event` (CDM v1.10 new; SI-022 Sub-decision 2 STEP 2a entity 1)

```sql
CREATE TABLE crisis_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    patient_id UUID NOT NULL,
    server_signal_id UUID NOT NULL,    -- FK to Mode 1 server-signal envelope per P-035 FLOOR-020
    crisis_type TEXT NOT NULL CHECK (crisis_type IN (
        'suicidal_ideation', 'self_harm', 'violence_threat', 'medical_emergency',
        'severe_psychological_distress', 'protocol_safety_floor_breach'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('non_imminent', 'imminent', 'life_threatening')),
    regulatory_reporting_enabled BOOLEAN NOT NULL,   -- snapshot of tenant config at detection time
    detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- KMS envelope for intake_payload + clinical_summary PHI columns (8-column flat envelope per P-021):
    intake_payload_ciphertext BYTEA NULL,
    intake_payload_dek_id UUID NULL,
    intake_payload_dek_version INTEGER NULL,
    intake_payload_iv BYTEA NULL,
    intake_payload_auth_tag BYTEA NULL,
    intake_payload_kek_id UUID NULL,
    intake_payload_kek_version INTEGER NULL,
    intake_payload_algorithm TEXT NULL,
    -- Composite tenant-scoped FKs
    CONSTRAINT crisis_event_patient_tenant_fk
        FOREIGN KEY (tenant_id, patient_id) REFERENCES patient(tenant_id, id),
    CONSTRAINT crisis_event_server_signal_unique UNIQUE (tenant_id, server_signal_id),
    CONSTRAINT crisis_event_tenant_id_unique UNIQUE (tenant_id, id)
);

ALTER TABLE crisis_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_event FORCE ROW LEVEL SECURITY;
CREATE POLICY crisis_event_tenant_isolation ON crisis_event
    USING (tenant_id = current_tenant_id_strict('crisis_event'));
CREATE TRIGGER crisis_event_append_only
    BEFORE UPDATE OR DELETE ON crisis_event
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

CREATE INDEX crisis_event_patient_detection_idx
    ON crisis_event (tenant_id, patient_id, detected_at DESC);
CREATE INDEX crisis_event_severity_detection_idx
    ON crisis_event (tenant_id, severity, detected_at DESC);
```

**Tenant-threading:** `current_tenant_id_strict('crisis_event')` enforces JWT-verified tenant binding per SI-024.1 v0.8 (P-031) canonical pattern. `enforce_append_only()` trigger forbids UPDATE/DELETE per I-035 (the entity is the canonical immutable record of crisis detection).

**KMS encryption:** intake_payload may contain PHI (the Mode 1 user message that triggered detection); encrypted with the per-tenant DEK envelope. Composite 8-column flat envelope mirrors SI-005 P-021 pattern. clinical_summary column omitted from this v1.10 draft pending SI-022 OQ confirmation on whether the Crisis Response Card's hydrated CCR-resolved content is persisted (vs derived at render time).

**`jwt_migration_entity_status` seed entry:** name='crisis_event'; phase_4_cutover_eligible=FALSE; raw_guc_fallback_audited=TRUE.

### §4.NEW2 — `crisis_event_lifecycle_transition` (CDM v1.10 new; append-only Option A per I-035)

```sql
CREATE TABLE crisis_event_lifecycle_transition (
    id BIGSERIAL PRIMARY KEY,
    tenant_id tenant_id_t NOT NULL,
    crisis_event_id UUID NOT NULL,
    from_state TEXT NOT NULL CHECK (from_state IN (
        'none', 'detected', 'escalated', 'acknowledged', 'responded', 'resolved'
    )),
    to_state TEXT NOT NULL CHECK (to_state IN (
        'detected', 'escalated', 'acknowledged', 'responded', 'resolved'
    )),
    transition_reason TEXT NOT NULL CHECK (transition_reason IN (
        'initial_detection',
        'no_acknowledgement_timeout',
        'tier_progression_no_acknowledgement',
        'acknowledged_no_response_timeout',
        'responded_no_resolution_timeout',
        'response_failed',
        'clinician_acknowledgement',
        'clinician_response',
        'clinician_resolution'
    )),
    transition_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor_principal_id UUID NULL,
    transition_payload JSONB NULL,
    -- 11 allowed (from_state, to_state, transition_reason) triples per SI-022 Sub-decision 4 + §6:
    CONSTRAINT crisis_lifecycle_valid_transition CHECK (
        (from_state = 'none' AND to_state = 'detected' AND transition_reason = 'initial_detection')
        OR (from_state = 'detected' AND to_state = 'escalated' AND transition_reason = 'no_acknowledgement_timeout')
        OR (from_state = 'escalated' AND to_state = 'escalated' AND transition_reason = 'tier_progression_no_acknowledgement')
        OR (from_state = 'acknowledged' AND to_state = 'escalated' AND transition_reason = 'acknowledged_no_response_timeout')
        OR (from_state = 'responded' AND to_state = 'escalated' AND transition_reason = 'responded_no_resolution_timeout')
        OR (from_state = 'responded' AND to_state = 'escalated' AND transition_reason = 'response_failed')
        OR (from_state = 'detected' AND to_state = 'acknowledged' AND transition_reason = 'clinician_acknowledgement')
        OR (from_state = 'escalated' AND to_state = 'acknowledged' AND transition_reason = 'clinician_acknowledgement')
        OR (from_state = 'acknowledged' AND to_state = 'responded' AND transition_reason = 'clinician_response')
        OR (from_state = 'responded' AND to_state = 'resolved' AND transition_reason = 'clinician_resolution')
        OR (from_state = 'escalated' AND to_state = 'resolved' AND transition_reason = 'clinician_resolution')
    ),
    CONSTRAINT crisis_lifecycle_crisis_event_tenant_fk
        FOREIGN KEY (tenant_id, crisis_event_id) REFERENCES crisis_event(tenant_id, id)
);

ALTER TABLE crisis_event_lifecycle_transition ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_event_lifecycle_transition FORCE ROW LEVEL SECURITY;
CREATE POLICY crisis_lifecycle_tenant_isolation ON crisis_event_lifecycle_transition
    USING (tenant_id = current_tenant_id_strict('crisis_event_lifecycle_transition'));
CREATE TRIGGER crisis_lifecycle_append_only
    BEFORE UPDATE OR DELETE ON crisis_event_lifecycle_transition
    FOR EACH ROW EXECUTE FUNCTION enforce_append_only();

CREATE INDEX crisis_lifecycle_event_transition_idx
    ON crisis_event_lifecycle_transition (tenant_id, crisis_event_id, transition_at DESC, id DESC);
```

**Monotonic-ordering invariant** (per P-038 R2 + R4 patterns): BEFORE INSERT trigger enforces `NEW.transition_at >= (SELECT MAX(transition_at) FROM crisis_event_lifecycle_transition WHERE tenant_id = NEW.tenant_id AND crisis_event_id = NEW.crisis_event_id)` to prevent backdated row corruption of current-state derivation; future-dating tolerated up to `now() + 5s` clock-skew window. To be detailed in trigger function spec in §3.

### §4.NEW3 — `crisis_sweep_execution` (CDM v1.10 new; durable per-sweep work-item table with fencing-token + lease-takeover semantics)

```sql
CREATE TABLE crisis_sweep_execution (
    sweep_execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    crisis_event_id UUID NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    scheduled_for_obligation_generation INTEGER NOT NULL,   -- R52 per-generation uniqueness
    claimed_by_worker_id TEXT NULL,
    claim_expires_at TIMESTAMPTZ NULL,
    fencing_token BIGINT NOT NULL DEFAULT 1,   -- monotonic per-takeover token (R45)
    heartbeat_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    sweep_cycle_id_committed INTEGER NULL,   -- set atomically with completed_at at STEP F (R47)
    -- Composite tenant-scoped FK
    CONSTRAINT crisis_sweep_execution_event_tenant_fk
        FOREIGN KEY (tenant_id, crisis_event_id) REFERENCES crisis_event(tenant_id, id)
);

-- R52 per-obligation-generation uniqueness invariant: partial UNIQUE constraint covers only
-- un-completed rows so multiple completed sweeps for the same logical generation can coexist
-- in the table (audit-trail durability) while concurrent scheduling attempts for the same
-- open generation are rejected at the constraint level.
CREATE UNIQUE INDEX crisis_sweep_execution_open_uk
    ON crisis_sweep_execution (tenant_id, crisis_event_id, scheduled_for_obligation_generation)
    WHERE completed_at IS NULL;

CREATE INDEX crisis_sweep_execution_scheduling_idx
    ON crisis_sweep_execution (scheduled_at)
    WHERE completed_at IS NULL;

CREATE INDEX crisis_sweep_execution_event_lookup_idx
    ON crisis_sweep_execution (tenant_id, crisis_event_id, scheduled_at DESC);

ALTER TABLE crisis_sweep_execution ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_sweep_execution FORCE ROW LEVEL SECURITY;
CREATE POLICY crisis_sweep_execution_tenant_isolation ON crisis_sweep_execution
    USING (tenant_id = current_tenant_id_strict('crisis_sweep_execution'));
-- crisis_sweep_execution is intentionally MUTABLE on claim/heartbeat/completion columns (NOT
-- append-only) per SI-022 Sub-decision 6 lease-takeover + STEP F triple-guarded final UPDATE
-- semantics. The R47 closure makes `completed_at` + `sweep_cycle_id_committed` the durable
-- replay-detection marker; once committed, the row remains in the table but `completed_at IS
-- NOT NULL` means it's terminal and no further mutation is permitted (enforced by BEFORE UPDATE
-- trigger asserting completed_at unchanged + sweep_cycle_id_committed unchanged when both are
-- already non-NULL).
CREATE TRIGGER crisis_sweep_execution_terminal_immutable
    BEFORE UPDATE ON crisis_sweep_execution
    FOR EACH ROW
    WHEN (OLD.completed_at IS NOT NULL)
    EXECUTE FUNCTION enforce_terminal_row_immutable();
```

### §4.EXT1 — `notification_crisis_dispatch_ledger` additive column extensions (P-027 §4.66 baseline)

```sql
ALTER TABLE notification_crisis_dispatch_ledger
    ADD COLUMN crisis_event_id UUID NULL;    -- transitional NULL during migration; backfilled then set NOT NULL

-- After backfill of existing rows via crisis_event lookup by (tenant_id, server_signal_id):
ALTER TABLE notification_crisis_dispatch_ledger
    ALTER COLUMN crisis_event_id SET NOT NULL;

ALTER TABLE notification_crisis_dispatch_ledger
    ADD CONSTRAINT notification_crisis_dispatch_ledger_event_tenant_fk
    FOREIGN KEY (tenant_id, crisis_event_id) REFERENCES crisis_event(tenant_id, id);
```

### §4.EXT2 — `notification_crisis_provider_attempt` additive column extensions (P-027 §4.67 baseline)

```sql
ALTER TABLE notification_crisis_provider_attempt
    ADD COLUMN crisis_event_id UUID NULL,    -- transitional; backfilled
    ADD COLUMN recipient_principal_id UUID NULL,  -- nullable for emergency_contact; non-null for all other recipient_roles (R37)
    ADD COLUMN sweep_cycle_id INTEGER NULL;  -- deterministic per-sweep value captured at STEP A (R39)

-- After backfill:
ALTER TABLE notification_crisis_provider_attempt
    ALTER COLUMN crisis_event_id SET NOT NULL,
    ALTER COLUMN sweep_cycle_id SET NOT NULL;

ALTER TABLE notification_crisis_provider_attempt
    ADD CONSTRAINT notification_crisis_provider_attempt_event_tenant_fk
        FOREIGN KEY (tenant_id, crisis_event_id) REFERENCES crisis_event(tenant_id, id),
    ADD CONSTRAINT notification_crisis_provider_attempt_principal_required_for_addressable_roles
        CHECK (
            recipient_principal_id IS NOT NULL
            OR recipient_role = 'emergency_contact'
        ),
    -- R28 canonical idempotency UNIQUE constraint (named so ON CONFLICT can target it explicitly):
    ADD CONSTRAINT notification_crisis_provider_attempt_idempotency_uk
        UNIQUE (tenant_id, crisis_event_id, channel, recipient_role, recipient_address, attempt_sequence);
```

### §4.EXT3 — `notification_crisis_escalation_obligation` additive column extensions (P-027 §4.68 baseline)

```sql
ALTER TABLE notification_crisis_escalation_obligation
    ADD COLUMN crisis_event_id UUID NULL,    -- transitional; backfilled
    ADD COLUMN severity TEXT NULL CHECK (severity IN ('non_imminent', 'imminent', 'life_threatening')),
    ADD COLUMN escalation_tier TEXT NULL CHECK (escalation_tier IN ('care_team', 'clinical_on_call', 'regulatory')),
    ADD COLUMN sweep_cycle_counter INTEGER NOT NULL DEFAULT 1,  -- R40 DEFAULT=1; initial detection establishes counter=1
    ADD COLUMN final_tier_exhausted_at TIMESTAMPTZ NULL;  -- R13 exhaustion-recheck timestamp

-- After backfill:
ALTER TABLE notification_crisis_escalation_obligation
    ALTER COLUMN crisis_event_id SET NOT NULL,
    ALTER COLUMN severity SET NOT NULL,
    ALTER COLUMN escalation_tier SET NOT NULL;

ALTER TABLE notification_crisis_escalation_obligation
    ADD CONSTRAINT notification_crisis_escalation_obligation_event_tenant_fk
        FOREIGN KEY (tenant_id, crisis_event_id) REFERENCES crisis_event(tenant_id, id);

-- BEFORE UPDATE trigger enforcing the canonical SI-022 mutation discipline (R10 + R55 + R57):
-- escalation_tier MAY be set NULL only by record_crisis_resolution() wrapper (R10 BACKSTOP);
-- escalation_key MUST remain NULL (R55-R57 always-NULL invariant);
-- sweep_cycle_counter MAY only be incremented by R53 single guarded UPDATE inside sweep transaction;
-- final_tier_exhausted_at MAY only be set by sweep STEP E for terminal-tier exhaustion (R13).
CREATE TRIGGER notification_crisis_escalation_obligation_mutation_discipline
    BEFORE UPDATE ON notification_crisis_escalation_obligation
    FOR EACH ROW
    EXECUTE FUNCTION enforce_crisis_escalation_obligation_mutation_discipline();
```

### §4.NEW4 — `crisis_event_current_state_v` (CDM v1.10 new; DERIVED view from append-only lifecycle transitions per I-035)

```sql
CREATE VIEW crisis_event_current_state_v
WITH (security_invoker = true, security_barrier = true) AS
SELECT
    ce.tenant_id,
    ce.id AS crisis_event_id,
    ce.patient_id,
    ce.server_signal_id,
    ce.crisis_type,
    ce.severity,
    ce.regulatory_reporting_enabled,
    ce.detected_at,
    latest.to_state AS current_state,
    latest.transition_at AS current_state_at,
    latest.actor_principal_id AS current_state_actor_principal_id,
    obligation.escalation_tier,
    obligation.sweep_cycle_counter,
    obligation.final_tier_exhausted_at,
    obligation.undeliverable_deadline
FROM crisis_event ce
LEFT JOIN LATERAL (
    SELECT to_state, transition_at, actor_principal_id
    FROM crisis_event_lifecycle_transition lt
    WHERE lt.tenant_id = ce.tenant_id AND lt.crisis_event_id = ce.id
    ORDER BY lt.transition_at DESC, lt.id DESC
    LIMIT 1
) latest ON TRUE
LEFT JOIN notification_crisis_escalation_obligation obligation
    ON obligation.tenant_id = ce.tenant_id AND obligation.crisis_event_id = ce.id;
-- R1 HIGH-3 closure 2026-05-21: `security_invoker = true` is now in the executable DDL above
-- (NOT just prose). Without it the view would run under the owner's privileges and bypass
-- caller-scoped RLS on the underlying tables. The §8.1 deployment preflight DO block asserts
-- the view has security_invoker=true after creation (see §8.1 assertion class F).
-- View owner is crisis_event_current_state_view_owner (non-BYPASSRLS).
-- R1 HIGH-2 closure 2026-05-21: GRANT SELECT split between two distinct reader roles —
-- `crisis_event_staff_reader` for tenant-wide clinician/care-team access, and
-- `crisis_event_patient_reader` for predicate-restricted patient/delegate access via a
-- SEPARATE patient-summary view (`crisis_event_patient_summary_v`, see §4.NEW4a). Patient/delegate
-- principals do NOT receive SELECT on this tenant-wide view; they receive SELECT only on the
-- predicate-restricted view. Same data-minimization split pattern as P-038 R5 HIGH-1.
```

### §4.NEW4a — `crisis_event_patient_summary_v` (CDM v1.10 NEW per R1 HIGH-2 closure 2026-05-21; patient/delegate self-scoped view)

```sql
CREATE VIEW crisis_event_patient_summary_v
WITH (security_invoker = true, security_barrier = true) AS
WITH vc AS (
    SELECT verified_tenant_id, verified_patient_id, verified_delegate_id
    FROM verify_session_jwt_and_extract_claims()
)
SELECT
    ce.tenant_id,
    ce.id AS crisis_event_id,
    ce.patient_id,
    ce.server_signal_id,
    ce.crisis_type,
    ce.severity,
    ce.regulatory_reporting_enabled,
    ce.detected_at,
    latest.to_state AS current_state,
    latest.transition_at AS current_state_at,
    obligation.escalation_tier,
    obligation.sweep_cycle_counter,
    obligation.final_tier_exhausted_at,
    obligation.undeliverable_deadline
FROM crisis_event ce
JOIN vc ON ce.tenant_id = vc.verified_tenant_id
LEFT JOIN LATERAL (
    SELECT to_state, transition_at
    FROM crisis_event_lifecycle_transition lt
    WHERE lt.tenant_id = ce.tenant_id AND lt.crisis_event_id = ce.id
    ORDER BY lt.transition_at DESC, lt.id DESC
    LIMIT 1
) latest ON TRUE
LEFT JOIN notification_crisis_escalation_obligation obligation
    ON obligation.tenant_id = ce.tenant_id AND obligation.crisis_event_id = ce.id
WHERE
    -- Patient principal path: caller IS the patient
    ce.patient_id = vc.verified_patient_id
    -- Delegate principal path: caller IS a delegate WITH active emergency_contact_share consent
    OR (vc.verified_delegate_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM consent_grant cg
            WHERE cg.tenant_id = ce.tenant_id
              AND cg.delegate_principal_id = vc.verified_delegate_id
              AND cg.patient_id = ce.patient_id
              AND cg.scope_name = 'emergency_contact_share'
              AND cg.status = 'active'
              AND (cg.expires_at IS NULL OR cg.expires_at > now())
        ));

ALTER VIEW crisis_event_patient_summary_v OWNER TO crisis_event_patient_summary_view_owner;
REVOKE ALL ON crisis_event_patient_summary_v FROM PUBLIC;
GRANT SELECT ON crisis_event_patient_summary_v TO crisis_event_patient_reader;
```

**R1 HIGH-2 closure 2026-05-21 (data-minimization split per P-038 R5 HIGH-1 pattern):** the two reader-view pairs are:

| View | Owner role | Reader role | Caller-class | Visibility |
|---|---|---|---|---|
| `crisis_event_current_state_v` | `crisis_event_current_state_view_owner` | `crisis_event_staff_reader` | clinician + care-team-member + admin | tenant-wide (clinical triage queue) |
| `crisis_event_patient_summary_v` | `crisis_event_patient_summary_view_owner` | `crisis_event_patient_reader` | patient + delegate (IFF active emergency_contact_share consent) | self-scoped — caller's own patient_id OR delegated patient_ids only, enforced in view predicate via verify_session_jwt_and_extract_claims() + consent_grant join |

Patient/delegate principals do NOT receive `crisis_event_staff_reader` membership; staff principals do NOT receive `crisis_event_patient_reader` membership. The endpoint dispatch table is updated: `/v1/crisis/active` reads `crisis_event_current_state_v` (staff reader role required); `/v1/crisis/mine` reads `crisis_event_patient_summary_v` (patient reader role required). DB-level grants enforce the role-class boundary; the view predicate enforces the per-row patient/delegate scope; tenant RLS on underlying tables enforces tenant isolation. Three layers of enforcement (RBAC + view predicate + RLS) — no single-layer bypass can leak crisis state across patients.

---

## 3. New SECURITY DEFINER procedures (6 procedures owned by 5 owner roles)

Six SECURITY DEFINER procedures land at v1.10 — one raw append-only writer to `crisis_event_lifecycle_transition` plus five caller-class wrappers. All procedures are schema-qualified + locked search_path per the canonical P-034 R7 hardening pattern + the canonical P-038 R4 invariant-trigger hardening pattern. EXECUTE grants on the raw writer are restricted exclusively to the 5 wrapper-owner roles enumerated below — no other roles receive EXECUTE on the raw writer (anti-bypass enforcement; matches the canonical anti-bypass discipline established at P-034 §3 + P-038 §3 R9 MED-1 closure).

### §3.1 — `record_crisis_event_lifecycle_transition()` (RAW writer; owner: `crisis_event_lifecycle_transition_writer_owner`)

```sql
CREATE FUNCTION record_crisis_event_lifecycle_transition(
    p_tenant_id tenant_id_t,
    p_crisis_event_id UUID,
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
    INSERT INTO public.crisis_event_lifecycle_transition (
        tenant_id, crisis_event_id, from_state, to_state, transition_reason,
        transition_at, actor_principal_id, transition_payload
    ) VALUES (
        p_tenant_id, p_crisis_event_id, p_from_state, p_to_state, p_transition_reason,
        now(), p_actor_principal_id, p_transition_payload
    )
    RETURNING id INTO v_transition_id;
    RETURN v_transition_id;
END;
$$;

ALTER FUNCTION record_crisis_event_lifecycle_transition(
    tenant_id_t, UUID, TEXT, TEXT, TEXT, UUID, JSONB
) OWNER TO crisis_event_lifecycle_transition_writer_owner;

REVOKE EXECUTE ON FUNCTION record_crisis_event_lifecycle_transition(
    tenant_id_t, UUID, TEXT, TEXT, TEXT, UUID, JSONB
) FROM PUBLIC;

-- EXECUTE granted to EXACTLY the 5 wrapper-owner roles enumerated below.
-- No other roles receive EXECUTE on the raw writer (P-034 + P-038 anti-bypass discipline).
GRANT EXECUTE ON FUNCTION record_crisis_event_lifecycle_transition(
    tenant_id_t, UUID, TEXT, TEXT, TEXT, UUID, JSONB
) TO crisis_initiation_wrapper_owner,
     crisis_acknowledgement_wrapper_owner,
     crisis_response_wrapper_owner,
     crisis_resolution_wrapper_owner,
     crisis_sweep_wrapper_owner;
```

The raw writer is the canonical append-only state-transition boundary. The 11-triple CHECK constraint (per §4.NEW2) + the BEFORE INSERT continuity/monotonic trigger together enforce that no invalid or backdated transition can land regardless of caller. The raw writer is therefore the SOLE INSERT path into `crisis_event_lifecycle_transition`; direct INSERTs by application roles are rejected at the privilege boundary (no role other than these 5 wrapper owners has INSERT privilege via the writer; base-table INSERTs are also revoked from PUBLIC).

### §3.2 — `record_crisis_initiation()` (wrapper; owner: `crisis_initiation_wrapper_owner`)

Called by Mode 1 handler in the same atomic transaction as the FLOOR-020 `crisis_detection_trigger` Cat A emit + the `crisis_event` INSERT + the `(none → detected / initial_detection)` lifecycle transition + the `crisis.detected` Cat A emit. Enforces 3-layer tenant config validation per R63/R65: asserts fanout_channels[] non-empty + clinical_on_call_channel/recipient/principal_id non-null + (IFF regulatory_reporting=true) operator_escalation_channel/recipient/principal_id non-null + (IFF emergency_contact_consent_enabled=true) emergency_contact_channel non-null; fail-closed emits `crisis.dispatch_attempt_failed` Cat C with payload `runtime_validation_failed=true` + the specific missing key list. Allocates the `notification_crisis_escalation_obligation` row with `sweep_cycle_counter = 1` + `escalation_tier = 'care_team'` + the initial `undeliverable_deadline`. Returns the new `crisis_event_id`.

Signature: `record_crisis_initiation(p_tenant_id, p_patient_id, p_server_signal_id, p_crisis_type, p_severity, p_regulatory_reporting_enabled, p_intake_payload_envelope) RETURNS UUID`.

### §3.3 — `record_crisis_acknowledgement_claim()` (wrapper; owner: `crisis_acknowledgement_wrapper_owner`)

Caller MUST pass `Idempotency-Key` per IDEMPOTENCY contract. Tier-derived-from-JWT-principal per SI-022 R35+R36: NO caller-supplied tier parameter — the wrapper looks up the caller's `recipient_role` by joining `notification_crisis_provider_attempt` on `recipient_principal_id = (verify_session_jwt_and_extract_claims()).principal_id`, derives `acknowledging_tier` from recipient_role per the canonical mapping (care_team → 'care_team' tier; clinical_on_call → 'clinical_on_call' tier; operator_escalation → 'regulatory' tier), and rejects (raises `tier_ownership_unauthorized`) if no eligible provider_attempt row exists. Additional R36 HIGH-1 guard: rejects (raises `tier_ownership_below_current_tier`) if `acknowledging_tier < current_escalation_tier` (prevents lower-tier acknowledgement from repeatedly resetting deadlines + suppressing escalation pressure). On success: (a) INSERTs `crisis_event_lifecycle_transition` via raw writer with reason `clinician_acknowledgement` (from_state derived from current state); (b) UPDATEs `notification_crisis_escalation_obligation` resetting `undeliverable_deadline = now() + INTERVAL_for_severity_response_window` + `escalation_tier = GREATEST(current, acknowledging_tier)` per R34 HIGH-2; (c) emits `crisis.acknowledged` Cat A audit in same tx.

Signature: `record_crisis_acknowledgement_claim(p_tenant_id, p_crisis_event_id, p_idempotency_key) RETURNS VOID`.

### §3.4 — `record_crisis_response()` (wrapper; owner: `crisis_response_wrapper_owner`)

Same tier-derivation discipline as §3.3. Idempotent. INSERTs lifecycle transition with reason `clinician_response` (from `acknowledged → responded`); resets `undeliverable_deadline = now() + INTERVAL_for_severity_resolution_window`; sets `escalation_tier = GREATEST(current, responding_tier)`. Emits `crisis.responded` Cat A audit.

Signature: `record_crisis_response(p_tenant_id, p_crisis_event_id, p_response_type, p_response_payload, p_idempotency_key) RETURNS VOID`.

### §3.5 — `record_crisis_resolution()` (wrapper; owner: `crisis_resolution_wrapper_owner`)

**SOLE terminalization path** per SI-022 R11 closure. Same tier-derivation discipline. Idempotent. INSERTs lifecycle transition with reason `clinician_resolution` (from `responded → resolved` OR `escalated → resolved`); atomically sets `notification_crisis_escalation_obligation.escalation_tier = NULL` to drop the row from sweep eligibility (R10 BACKSTOP). Emits `crisis.resolved` Cat A audit.

Signature: `record_crisis_resolution(p_tenant_id, p_crisis_event_id, p_resolution_outcome, p_resolution_payload, p_idempotency_key) RETURNS VOID`.

### §3.6 — `execute_crisis_no_acknowledgement_sweep()` (wrapper; owner: `crisis_sweep_wrapper_owner`)

Per-row STEP A→F atomic transaction per SI-022 Sub-decision 6 canonical contract:

- **STEP A** (R53 guarded UPDATE): atomic eligibility-revalidation + sweep_cycle_counter increment via UPDATE-RETURNING on `notification_crisis_escalation_obligation`. Predicates: `now() > undeliverable_deadline AND escalation_key IS NULL AND escalation_tier IS NOT NULL AND lifecycle.current_state IN (4 valid states) AND sweep_cycle_counter+1 = $execution.scheduled_for_obligation_generation`. ROW_COUNT=0 → ROLLBACK + emit `crisis.sweep_stale_eligibility_dropped` Cat C in separate autocommit tx + mark execution completed-as-stale-no-op + EXIT.
- **STEP B**: INSERT `crisis_event_lifecycle_transition` via raw writer with 4-way reason mapping from current_state (R12 HIGH-2).
- **STEP C**: INSERT `notification_crisis_provider_attempt` rows via `INSERT...SELECT...FROM compute_crisis_recipient_mapping(crisis_event_id, severity, target_tier) ON CONFLICT ON CONSTRAINT notification_crisis_provider_attempt_idempotency_uk DO NOTHING` (R28+R39+R64). Then EXISTENCE invariant verification: `SELECT COUNT(*) FROM provider_attempt WHERE tenant_id+crisis_event_id+sweep_cycle_id matches` MUST equal mapping cardinality (R60 HIGH-1). Zero-recipients fail-closed for target_tier ∈ {care_team, clinical_on_call, regulatory} per R63 HIGH-2 + R64 HIGH-2: ROLLBACK + `crisis.dispatch_attempt_failed` Cat C with `zero_recipients_for_required_tier=true`.
- **STEP D**: emit `crisis.no_acknowledgement_escalation` Cat A audit co-transactional.
- **STEP E**: tier ADVANCE UPDATE on `notification_crisis_escalation_obligation`: `escalation_tier = next_tier(current_tier, severity, regulatory_reporting)`; reschedule `undeliverable_deadline = now() + INTERVAL_for_severity_and_tier(next, severity)`; on `next_tier(...) IS NULL` (terminal), preserve escalation_tier + set `final_tier_exhausted_at = now()` (R13 HIGH-1) + emit `crisis.final_tier_reached` Cat A once.
- **STEP F**: final guarded UPDATE on `crisis_sweep_execution`: sets `completed_at = now()` + `sweep_cycle_id_committed = v_sweep_cycle_id` atomically; predicate `WHERE sweep_execution_id=$ AND claimed_by_worker_id=$ AND fencing_token=$captured AND completed_at IS NULL AND claim_expires_at > now()` (triple-guard per R46 + R47 + R51). 0 rows → takeover occurred mid-tx → raise `sweep_fencing_token_mismatch_at_commit` + ROLLBACK.

Signature: `execute_crisis_no_acknowledgement_sweep(p_sweep_execution_id, p_worker_id, p_captured_fencing_token) RETURNS VOID`.

**Anti-bypass discipline:** the 5 wrapper-owner roles + the 1 raw-writer-owner role = exactly 6 distinct owner roles. No other procedure-owner roles receive EXECUTE on `record_crisis_event_lifecycle_transition()`. Application roles (crisis_initiator, crisis_acknowledger, crisis_responder, crisis_resolver, crisis_sweep_scheduler) receive EXECUTE on the corresponding wrapper procedure ONLY (NOT on the raw writer). The wrapper procedures are the SOLE entry points into the crisis state machine; the CHECK constraint on `crisis_event_lifecycle_transition` (11 triples) provides defense-in-depth at the schema layer even if a privilege boundary is bypassed.

---

---

## 4. New audit events (12 = 7 Cat A + 0 Cat B + 5 Cat C per SI-022 v1.0 §3 authoritative per-row labels)

Normative landing of the SI-022 v1.0 §3 normative audit table into AUDIT_EVENTS v5.12. All 12 actions live under the `crisis.*` namespace. **Two pre-existing audits remain unchanged**: `crisis_detection_trigger` Cat A (Mode 1 FLOOR-020 platform-floor at P-035 — distinct from the new lifecycle-bound `crisis.detected` Cat A in this amendment); `crisis.escalation_destination_resolved` Cat B (CCR resolver outcome from P-025).

| # | Action ID | Category | Sampling | Partition | Emit site |
|---|---|---|---|---|---|
| 1 | `crisis.detected` | Cat A | NOT sampled (safety-floor) | P1 keyed by patient_id | `record_crisis_initiation()` wrapper — emitted in same atomic transaction as crisis_event INSERT + initial lifecycle transition `(none → detected / initial_detection)`. Distinct from Mode 1 `crisis_detection_trigger` FLOOR-020 emit (which fires BEFORE crisis_event INSERT). |
| 2 | `crisis.acknowledged` | Cat A | NOT sampled | P1 keyed by patient_id | `record_crisis_acknowledgement_claim()` wrapper — emitted in same atomic tx as the `detected → acknowledged / clinician_acknowledgement` lifecycle transition. |
| 3 | `crisis.responded` | Cat A | NOT sampled | P1 keyed by patient_id | `record_crisis_response()` wrapper. |
| 4 | `crisis.resolved` | Cat A | NOT sampled | P1 keyed by patient_id | `record_crisis_resolution()` wrapper — SOLE terminalization path; also sets `notification_crisis_escalation_obligation.escalation_tier = NULL` to drop the row from sweep eligibility. |
| 5 | `crisis.no_acknowledgement_escalation` | Cat A | NOT sampled (safety-floor escalation per SI R1 MED-1 closure) | P1 keyed by patient_id | `execute_crisis_no_acknowledgement_sweep()` wrapper STEP D — emitted in same atomic tx as the sweep transaction (STEP A→F); payload includes `is_final_tier_recheck` flag distinguishing initial tier advance from final-tier recheck per R13. |
| 6 | `crisis.regulatory_threshold_reached` | Cat A | NOT sampled (safety-floor) | P1 keyed by patient_id | `record_crisis_initiation()` IFF `severity='life_threatening' AND tenant.regulatory_reporting_enabled=true` (downstream consumer: Adverse-Event slice). |
| 7 | `crisis.final_tier_reached` | Cat A | NOT sampled (safety-floor; emitted exactly once per crisis_event the first time escalation_tier reaches a terminal tier per R13 HIGH-1 closure) | P1 keyed by patient_id | `execute_crisis_no_acknowledgement_sweep()` STEP E — first time `next_tier(escalation_tier, severity, regulatory_reporting) IS NULL` for this crisis_event; sets `final_tier_exhausted_at = now()`. |
| 8 | `crisis.dispatch_attempt_failed` | Cat C | high-volume sampled | P2 governance-partition | STEP 4 outbox worker on per-recipient dispatch failure OR STEP C zero-recipients-for-required-tier fail-closed (payload `zero_recipients_for_required_tier=true` + `target_tier` value + `recipient_role` missing list per R63/R64 closure). |
| 9 | `crisis.sweep_replay_after_commit_ack_loss` | Cat C | NOT sampled (governance recovery; R43 HIGH-1 + R45 MED-1 closure) | P2 governance-partition | Scheduler-side replay detection when a crisis_sweep_execution row already has `completed_at IS NOT NULL` — skip re-execution + return success. Payload: sweep_execution_id, sweep_cycle_id_committed, original_completed_at, replay_at, scheduler_id. |
| 10 | `crisis.sweep_claim_recovery_with_committed_cycle` | Cat C | NOT sampled (governance recovery tripwire; R44 HIGH-1 + R45 MED-1 closure; per R47 this code path is architecturally impossible under canonical contract — retained ONLY as tripwire for database integrity defects) | P2 governance-partition | Claim-acquisition path observing impossible-but-bounded state `completed_at IS NULL AND sweep_cycle_id_committed IS NOT NULL` — heal terminal mark to now() without re-executing STEP A→F. Payload: sweep_execution_id, sweep_cycle_id_committed, previous_worker_id, recovery_worker_id, fencing_token_before, fencing_token_after, recovery_at. |
| 11 | `crisis.delivery_fence_mismatch_dropped` | Cat C | NOT sampled (governance recovery; R49 HIGH-1 closure — fencing-token recheck on every outbox dispatch) | P2 governance-partition | Downstream notification-delivery worker pre-dispatch recheck detecting fencing_token mismatch — outbox row dropped + delivery suppressed to prevent stale/non-authoritative external sends from a worker whose lease was taken over mid-fan-out. Payload: outbox_row_id, sweep_execution_id, sweep_cycle_id, expected_fencing_token, observed_fencing_token, observed_completed_at, delivery_worker_id, dropped_at. |
| 12 | `crisis.sweep_stale_eligibility_dropped` | Cat C | NOT sampled (governance recovery; R52 HIGH-1 closure — STEP A guarded UPDATE ROW_COUNT=0 path) | P2 governance-partition | Sweep transaction STEP A obligation-eligibility revalidation finding the sweep is stale (another generation advanced obligation, OR lifecycle changed, OR deadline reset by ack/respond/resolve, OR sweep_cycle_counter mismatched scheduled_for_obligation_generation) — sweep correctly marked completed-as-stale-no-op without fan-out/audit/tier-advance. Payload: sweep_execution_id, scheduled_for_obligation_generation, current_obligation_sweep_cycle_counter, current_undeliverable_deadline, current_escalation_key_status, current_escalation_tier, current_lifecycle_state, dropped_at. |

**Total: 12 new action IDs (7 Cat A + 0 Cat B + 5 Cat C).** SI-022 §3 summary tally drift (claimed "8 Cat A + 4 Cat C") flagged for downstream prose-correction PR after P-040 lands; per-row labels are authoritative.

**Existing audit events preserved unchanged from prior baselines:**
- `crisis_detection_trigger` Cat A (Mode 1 FLOOR-020 platform-floor; emitted BEFORE crisis_event INSERT by Mode 1 handler per P-035)
- `crisis.escalation_destination_resolved` Cat B (CCR resolver outcome; P-025)

**Co-transactional discipline:** all Cat A audits in this amendment are emitted INSIDE the same atomic transaction as the corresponding state change (canonical FLOOR-020 audit-co-transactional pattern). On rollback the audit row is NOT committed; on commit both the audit and the state change land atomically. Cat C audits are emitted in separate post-transaction autocommit txs (governance/recovery events MAY emit even on the rollback-recovery path; tolerated sampling loss).

---

## 5. New OpenAPI endpoints (6 net-new endpoints under `/v1/crisis/*`)

Normative landing of the SI-022 v1.0 §5 normative endpoint list into OpenAPI v0.5.

| # | Method | Path | Caller role | SECURITY DEFINER wrapper | Purpose |
|---|---|---|---|---|---|
| 1 | GET | `/v1/crisis/active` | clinician / care-team-member / admin (`crisis_event_staff_reader` role required) | (no wrapper; reads `crisis_event_current_state_v` filtered by tenant RLS) | List active crisis events in tenant (paginated; tenant-wide visibility for clinical triage) |
| 2 | GET | `/v1/crisis/mine` | patient / delegate (`crisis_event_patient_reader` role required; R2 HIGH-1 closure 2026-05-21: endpoint reads the predicate-restricted patient view EXCLUSIVELY — NOT the staff tenant-wide view + endpoint-side JWT filter, which was the v0.3 R1 HIGH-2 vulnerability shape; database-level RBAC + view predicate together enforce the patient/delegate scope, application is NOT trusted to apply the predicate) | (no wrapper; reads `crisis_event_patient_summary_v` filtered by the view's built-in verify_session_jwt_and_extract_claims() + consent_grant predicate) | List caller's own crisis events (caller's own patient_id OR delegated patient_ids IFF active emergency_contact_share consent grant). Application MUST NOT attempt to query `crisis_event_current_state_v` from this endpoint — that role grant does not exist for patient/delegate principals; the database privilege boundary prevents accidental cross-grant. |
| 3 | POST | `/v1/crisis/:crisis_event_id/acknowledge` | clinician / care-team-member | `record_crisis_acknowledgement_claim()` | Claim acknowledgement; tier-derived-from-JWT-principal per R35+R36 — caller-supplied tier parameter REMOVED; wrapper derives acknowledging_tier by lookup against the provider_attempt rows for the calling JWT-verified principal; raises `tier_ownership_unauthorized` if no eligible provider_attempt row OR `tier_ownership_below_current_tier` if derived tier < current escalation_tier. Idempotent via `Idempotency-Key` header. |
| 4 | POST | `/v1/crisis/:crisis_event_id/response` | clinician / care-team-member | `record_crisis_response()` | Record response action; same tier-derivation discipline as endpoint 3. Idempotent. |
| 5 | POST | `/v1/crisis/:crisis_event_id/resolve` | clinician / care-team-member | `record_crisis_resolution()` | Mark resolved (SOLE terminalization path; sets `escalation_tier = NULL` on obligation, dropping row from sweep eligibility); INSERTs `(escalated|responded → resolved / clinician_resolution)` lifecycle transition. Idempotent. |
| 6 | GET | `/v1/crisis/resources` | patient / delegate / **unauthenticated-emergency** | (no wrapper; calls 3 CCR resolvers) | Resource lookup endpoint; calls country_of_care + country_of_residence + country_default CCR resolvers per P-025; returns Crisis Response Card payload (helplines + emergency_number + helpline text); **ONLY platform endpoint accessible without JWT-verified session** per I-019 safety-floor concession — IP-rate-limited 60 req/min; returns ONLY country-default crisis_helplines + emergency_number for unauthenticated calls (NO patient-specific data); does NOT emit Cat A audit on unauthenticated path (no patient identity to bind to). |

**Idempotency:** endpoints 3 + 4 + 5 require `Idempotency-Key` header per canonical IDEMPOTENCY contract (Contracts Pack v5.1).

**Endpoint 6 unauthenticated-emergency posture** (per SI-022 OQ2 + Sub-decision 3 logical recipient 1): deliberate I-019 safety-floor concession. A patient whose session has expired must still be able to retrieve emergency numbers without re-authenticating. Tenant-anonymous fallback path (NOT subject to I-024 tenant isolation; deliberately returns country-default content keyed only by IP geo-lookup or query param `?country=<iso-alpha-2>`). Rate-limited per IP at 60 req/min via canonical rate-limit middleware. No Cat A audit emission on the unauthenticated path; audit emission only when a JWT-verified principal calls the same endpoint.

---

## 6. New state machine `crisis_event_lifecycle` (v1.3 → v1.4)

**1 new state machine** `crisis_event_lifecycle`, DERIVED from append-only `crisis_event_lifecycle_transition` rows per Option A (I-035 conformant; mirrors SI-019 + SI-020 patterns).

### States (5 active + 1 sentinel)

`none` (sentinel; pre-detection bootstrap state used by initial transition only) → `detected` → `acknowledged` → `responded` → `resolved` (terminal); orthogonal escalation tier sub-state `escalated` reachable from any non-resolved state via no_acknowledgement/no_response/response_failed timeouts (and self-loop on `escalated` for multi-tier sweep advances).

### Allowed transition triples (11 enumerated via CHECK constraint per §4.NEW2)

| # | from_state | to_state | transition_reason | Canonical caller |
|---|---|---|---|---|
| 1 | `none` | `detected` | `initial_detection` | `record_crisis_initiation()` wrapper (sole emit site for initial transition) |
| 2 | `detected` | `escalated` | `no_acknowledgement_timeout` | sweep STEP B (first care-team timeout) |
| 3 | `escalated` | `escalated` | `tier_progression_no_acknowledgement` | sweep STEP B (multi-tier advance; care_team → clinical_on_call → regulatory; R8 HIGH-1 closure) |
| 4 | `acknowledged` | `escalated` | `acknowledged_no_response_timeout` | sweep STEP B (clinician acknowledged but did not respond within INTERVAL_for_severity_response_window; R11 HIGH-1 NEW triple) |
| 5 | `responded` | `escalated` | `responded_no_resolution_timeout` | sweep STEP B (clinician responded but crisis not resolved within INTERVAL_for_severity_resolution_window; R11 HIGH-1 NEW triple; distinct from `response_failed`) |
| 6 | `responded` | `escalated` | `response_failed` | clinician-initiated retry path |
| 7 | `detected` | `acknowledged` | `clinician_acknowledgement` | `record_crisis_acknowledgement_claim()` wrapper |
| 8 | `escalated` | `acknowledged` | `clinician_acknowledgement` | `record_crisis_acknowledgement_claim()` wrapper |
| 9 | `acknowledged` | `responded` | `clinician_response` | `record_crisis_response()` wrapper |
| 10 | `responded` | `resolved` | `clinician_resolution` | `record_crisis_resolution()` wrapper |
| 11 | `escalated` | `resolved` | `clinician_resolution` | `record_crisis_resolution()` wrapper (resolution from any non-resolved state; the wrapper does NOT require pre-transition to `responded`) |

**CHECK constraint** materialized on `crisis_event_lifecycle_transition` table (per §4.NEW2 above) — implementer MUST verify all 11 triples are enumerated and ONLY these 11 are accepted. Any transition not in this set raises a CHECK constraint violation at INSERT time (defense-in-depth alongside the BEFORE INSERT trigger continuity check).

**Current-state derivation:** the `current_state` for any crisis_event is the `to_state` of the row with `MAX(transition_at)` (tie-broken by `MAX(id)` for same-tx ordering) per the LATERAL JOIN pattern in `crisis_event_current_state_v` (§4.NEW4 above). Monotonic transition_at invariant enforced by the BEFORE INSERT trigger (per P-038 R2 pattern; backdated rows rejected, future-dated tolerated within `now() + 5s` clock-skew window).

**Terminal state semantics:** `resolved` is terminal; no transitions out. The `notification_crisis_escalation_obligation` row has `escalation_tier = NULL` set by `record_crisis_resolution()` in the same atomic tx, dropping the row from sweep eligibility. `final_tier_exhausted_at` set by sweep STEP E (R13) is orthogonal — it marks terminal-tier-reached-but-not-resolved; the crisis_event remains in `escalated` state with continuing INTERVAL_final_tier_recheck_window sweeps until `record_crisis_resolution()` runs.

---

## 7. New RBAC roles (v1.3 → v1.4: +15 net-new roles per R5 MED-1 closure 2026-05-21 — reconciled across §1, §7, §8.1 class A, §8.2 Phase 1)

Final enumeration reconciled against §3 procedure spec + §8 deployment preflight:

### Application roles (7)

| Role | Granted to | Permissions |
|---|---|---|
| `crisis_initiator` | Mode 1 AI Service handler service account | EXECUTE on `record_crisis_initiation()` |
| `crisis_acknowledger` | clinician role + care-team-member role | EXECUTE on `record_crisis_acknowledgement_claim()` |
| `crisis_responder` | clinician role + care-team-member role | EXECUTE on `record_crisis_response()` |
| `crisis_resolver` | clinician role + care-team-member role | EXECUTE on `record_crisis_resolution()` |
| `crisis_sweep_scheduler` | scheduled-job service account | EXECUTE on `execute_crisis_no_acknowledgement_sweep()` + INSERT on `crisis_sweep_execution` (for scheduling new sweep work items) + UPDATE on `crisis_sweep_execution` columns `(claimed_by_worker_id, claim_expires_at, fencing_token, heartbeat_at)` ONLY (NOT on `completed_at` or `sweep_cycle_id_committed` — those are set by the sweep wrapper itself under SECURITY DEFINER context) |
| `crisis_event_staff_reader` | clinician + care-team-member + admin | SELECT on `crisis_event_current_state_v` (tenant-wide; clinical triage queue) — R1 HIGH-2 closure 2026-05-21 split |
| `crisis_event_patient_reader` | patient + delegate (latter IFF active emergency_contact_share consent grant) | SELECT on `crisis_event_patient_summary_v` (self-scoped predicate-restricted view) — R1 HIGH-2 closure 2026-05-21 split |

### Wrapper-owner roles (5; non-application)

| Role | Owns procedure | Holds EXECUTE on raw writer |
|---|---|---|
| `crisis_initiation_wrapper_owner` | `record_crisis_initiation()` | YES |
| `crisis_acknowledgement_wrapper_owner` | `record_crisis_acknowledgement_claim()` | YES |
| `crisis_response_wrapper_owner` | `record_crisis_response()` | YES |
| `crisis_resolution_wrapper_owner` | `record_crisis_resolution()` | YES |
| `crisis_sweep_wrapper_owner` | `execute_crisis_no_acknowledgement_sweep()` | YES |

### Raw-writer-owner role (1)

| Role | Owns | Notes |
|---|---|---|
| `crisis_event_lifecycle_transition_writer_owner` | `record_crisis_event_lifecycle_transition()` raw writer | Non-BYPASSRLS; the writer itself runs SECURITY DEFINER so the writer's tenant-context binding is the JWT-verified context of the caller, not the role's own. EXECUTE granted to exactly the 5 wrapper-owner roles above — no other roles. |

### View-owner roles (2; per R1 HIGH-2 closure 2026-05-21 split)

| Role | Owns | Notes |
|---|---|---|
| `crisis_event_current_state_view_owner` | `crisis_event_current_state_v` (staff tenant-wide) | Non-BYPASSRLS; view uses `security_invoker=true` + `security_barrier=true` so RLS on underlying tables is enforced against the caller's privileges. GRANT SELECT only to `crisis_event_staff_reader`. |
| `crisis_event_patient_summary_view_owner` | `crisis_event_patient_summary_v` (patient/delegate self-scoped) | Non-BYPASSRLS; same security_invoker+security_barrier flags; view body uses verify_session_jwt_and_extract_claims() + consent_grant predicate to restrict per-row visibility to caller's own patient_id OR delegated patient_ids only. GRANT SELECT only to `crisis_event_patient_reader`. |

**Total: 15 net-new roles** (7 application + 5 wrapper-owner + 1 raw-writer-owner + 2 view-owner; per R1 HIGH-2 closure 2026-05-21 the 6-application count becomes 7 because `crisis_event_reader` is split into `crisis_event_staff_reader` + `crisis_event_patient_reader`, AND the 1-view-owner count becomes 2 because the views are split). Matches §1 enumeration (updated). RBAC v1.3 → v1.4 count: prior 13 cycle baseline (P-038) + 15 net-new = bundle RBAC v1.4 total to be reconciled at §8 deployment preflight against canonical RBAC v1.3 enumeration.

---

## 8. Deployment preflight + cutover sequencing

### §8.1 — Deployment preflight DO block

Fail-closed assertions at deployment time per the canonical post-P-034 R7 SECURITY DEFINER hardening pattern + the SI-022 §7 Part A + Part B + Part C enforcement contract (per R63 + R65 closures). Implementer MUST run the following DO block as part of the deploy gate; any FAILED assertion blocks the deploy:

```sql
DO $$
DECLARE
    v_role_missing TEXT;
    v_entity_seed_missing TEXT;
    v_tenant_config_missing JSONB;
BEGIN
    -- (A) Verify the 15 net-new RBAC roles exist (R1 HIGH-2 closure 2026-05-21:
    -- crisis_event_reader split into crisis_event_staff_reader + crisis_event_patient_reader;
    -- 1 view-owner becomes 2: crisis_event_current_state_view_owner + crisis_event_patient_summary_view_owner)
    FOR v_role_missing IN
        SELECT unnest(ARRAY[
            'crisis_initiator', 'crisis_acknowledger', 'crisis_responder', 'crisis_resolver',
            'crisis_sweep_scheduler',
            'crisis_event_staff_reader', 'crisis_event_patient_reader',
            'crisis_initiation_wrapper_owner', 'crisis_acknowledgement_wrapper_owner',
            'crisis_response_wrapper_owner', 'crisis_resolution_wrapper_owner',
            'crisis_sweep_wrapper_owner', 'crisis_event_lifecycle_transition_writer_owner',
            'crisis_event_current_state_view_owner', 'crisis_event_patient_summary_view_owner'
        ])
        EXCEPT SELECT rolname FROM pg_roles
    LOOP
        RAISE EXCEPTION 'crisis-rbac-role-missing: %', v_role_missing;
    END LOOP;

    -- (B) Verify the 5 jwt_migration_entity_status seed rows exist with the canonical defaults
    -- (R4 HIGH-3 closure 2026-05-21: added crisis_event_patient_summary_v — it's a JWT-bound
    -- boundary via its verify_session_jwt_and_extract_claims() predicate and must be tracked
    -- under the same raw_guc_fallback_audited/phase_4_cutover_eligible discipline as the
    -- staff view; absent from seed scope would create version-skew risk during JWT migration
    -- on the more sensitive self-scoped patient/delegate read path)
    FOR v_entity_seed_missing IN
        SELECT unnest(ARRAY[
            'crisis_event', 'crisis_event_lifecycle_transition',
            'crisis_sweep_execution',
            'crisis_event_current_state_v', 'crisis_event_patient_summary_v'
        ])
        EXCEPT SELECT entity_name FROM public.jwt_migration_entity_status
        WHERE phase_4_cutover_eligible = FALSE AND raw_guc_fallback_audited = TRUE
    LOOP
        RAISE EXCEPTION 'crisis-jwt-migration-seed-missing-or-incorrect: %', v_entity_seed_missing;
    END LOOP;

    -- (C) Tenant config Part A (every tenant; R22+R63 every-tenant rule):
    SELECT jsonb_agg(jsonb_build_object('tenant_id', tenant_id, 'missing', missing_keys))
    INTO v_tenant_config_missing
    FROM (
        SELECT tenant_id,
               array_remove(ARRAY[
                   CASE WHEN cardinality(crisis_fanout_channels) = 0 THEN 'crisis.fanout_channels[]' END,
                   CASE WHEN crisis_clinical_on_call_channel IS NULL THEN 'crisis.clinical_on_call_channel' END,
                   CASE WHEN NOT (crisis_clinical_on_call_channel = ANY(crisis_fanout_channels))
                        THEN 'crisis.clinical_on_call_channel-not-in-fanout' END,
                   CASE WHEN crisis_clinical_on_call_recipient IS NULL
                        THEN 'crisis.clinical_on_call_recipient' END,
                   CASE WHEN crisis_clinical_on_call_principal_id IS NULL
                        THEN 'crisis.clinical_on_call_principal_id' END,
                   CASE WHEN crisis_clinical_on_call_principal_id IS NOT NULL
                        AND NOT EXISTS (SELECT 1 FROM principal p
                                        WHERE p.tenant_id = t.tenant_id
                                          AND p.id = crisis_clinical_on_call_principal_id)
                        THEN 'crisis.clinical_on_call_principal_id-no-principal' END
               ], NULL) AS missing_keys
        FROM tenant_config t
    ) per_tenant
    WHERE cardinality(missing_keys) > 0;
    IF v_tenant_config_missing IS NOT NULL THEN
        RAISE EXCEPTION 'crisis-tenant-config-part-a-violations: %', v_tenant_config_missing::TEXT;
    END IF;

    -- (D) Tenant config Part B (regulatory_reporting=true only; R19+R65):
    SELECT jsonb_agg(jsonb_build_object('tenant_id', tenant_id, 'missing', missing_keys))
    INTO v_tenant_config_missing
    FROM (
        SELECT tenant_id,
               array_remove(ARRAY[
                   CASE WHEN crisis_operator_escalation_channel IS NULL
                        THEN 'crisis.operator_escalation_channel' END,
                   CASE WHEN crisis_operator_escalation_recipient IS NULL
                        THEN 'crisis.operator_escalation_recipient' END,
                   CASE WHEN crisis_operator_escalation_principal_id IS NULL
                        THEN 'crisis.operator_escalation_principal_id' END,
                   CASE WHEN crisis_operator_escalation_channel IS NOT NULL
                        AND NOT (crisis_operator_escalation_channel = ANY(crisis_fanout_channels))
                        THEN 'crisis.operator_escalation_channel-not-in-fanout' END,
                   CASE WHEN crisis_operator_escalation_principal_id IS NOT NULL
                        AND NOT EXISTS (SELECT 1 FROM principal p
                                        WHERE p.tenant_id = t.tenant_id
                                          AND p.id = crisis_operator_escalation_principal_id)
                        THEN 'crisis.operator_escalation_principal_id-no-principal' END
               ], NULL) AS missing_keys
        FROM tenant_config t
        WHERE regulatory_reporting_enabled = TRUE
    ) per_tenant
    WHERE cardinality(missing_keys) > 0;
    IF v_tenant_config_missing IS NOT NULL THEN
        RAISE EXCEPTION 'crisis-tenant-config-part-b-violations: %', v_tenant_config_missing::TEXT;
    END IF;

    -- (R1 HIGH-1 closure 2026-05-21 — legacy-row migration coverage assertion):
    -- This amendment's Phase 3 backfills `crisis_event_id` onto P-027 §4.66-4.68 rows via
    -- (tenant_id, server_signal_id) -> crisis_event.id lookup BEFORE the NOT NULL ALTER.
    -- For the day-1 pilot tenants (Telecheck-US / Heros-US greenfield + Telecheck-Ghana),
    -- there are ZERO existing notification_crisis_* rows. If any environment ever attempts
    -- this cutover with pre-existing rows lacking corresponding crisis_event rows, the
    -- NOT NULL ALTER would either fail (column null) or strand orphaned rows (column
    -- backfilled to placeholder uuid). Preflight asserts coverage:
    -- (E0a) all dispatch_ledger rows have either crisis_event_id set OR can resolve via
    --       (tenant_id, server_signal_id) -> crisis_event.id;
    -- (E0b) same for provider_attempt;
    -- (E0c) same for escalation_obligation.
    -- If coverage is incomplete, the deploy MUST author legacy-source synthesis migration
    -- creating audited crisis_event rows for each orphan BEFORE proceeding to Phase 3.
    PERFORM 1 FROM public.notification_crisis_dispatch_ledger d
    WHERE d.crisis_event_id IS NULL
      AND NOT EXISTS (
          SELECT 1 FROM public.crisis_event ce
          WHERE ce.tenant_id = d.tenant_id AND ce.server_signal_id = d.server_signal_id
      )
    LIMIT 1;
    IF FOUND THEN
        RAISE EXCEPTION 'crisis-backfill-coverage-violation: dispatch_ledger has orphan rows with no resolvable crisis_event match — author legacy-source synthesis migration before Phase 3 NOT NULL ALTER';
    END IF;
    PERFORM 1 FROM public.notification_crisis_provider_attempt p
    WHERE p.crisis_event_id IS NULL
      AND NOT EXISTS (
          SELECT 1 FROM public.crisis_event ce
          WHERE ce.tenant_id = p.tenant_id AND ce.server_signal_id = p.server_signal_id
      )
    LIMIT 1;
    IF FOUND THEN
        RAISE EXCEPTION 'crisis-backfill-coverage-violation: provider_attempt has orphan rows with no resolvable crisis_event match';
    END IF;
    PERFORM 1 FROM public.notification_crisis_escalation_obligation o
    WHERE o.crisis_event_id IS NULL
      AND NOT EXISTS (
          SELECT 1 FROM public.crisis_event ce
          WHERE ce.tenant_id = o.tenant_id AND ce.server_signal_id = o.server_signal_id
      )
    LIMIT 1;
    IF FOUND THEN
        RAISE EXCEPTION 'crisis-backfill-coverage-violation: escalation_obligation has orphan rows with no resolvable crisis_event match';
    END IF;

    -- (F) R1 HIGH-3 closure 2026-05-21 — view security_invoker assertion. The DDL specifies
    -- WITH (security_invoker = true, security_barrier = true); verify the reloptions actually
    -- materialized that way after CREATE VIEW. Without security_invoker=true the view would
    -- run under owner privileges and bypass caller-scoped RLS on underlying crisis_event +
    -- crisis_event_lifecycle_transition + notification_crisis_escalation_obligation tables.
    PERFORM 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('crisis_event_current_state_v', 'crisis_event_patient_summary_v')
      AND c.relkind = 'v'
      AND NOT ('security_invoker=true' = ANY(c.reloptions));
    IF FOUND THEN
        RAISE EXCEPTION 'crisis-view-security-invoker-missing: at least one of {crisis_event_current_state_v, crisis_event_patient_summary_v} is missing security_invoker=true; re-create the view with WITH (security_invoker = true, security_barrier = true)';
    END IF;

    -- (G) R2 HIGH-2 + R3 HIGH-1 closure 2026-05-21 — view-grant allowlist assertion.
    -- The R1 HIGH-2 closure split the reader-role/view pair into two; Phase 7 must produce
    -- exactly the canonical grant matrix and ONLY the canonical grants. R3 HIGH-1 fix:
    -- replaced the prior 5-point checks (which missed PUBLIC + arbitrary-other-role grants)
    -- with a TRUE ALLOWLIST query: any SELECT grant on either crisis view OUTSIDE the exact
    -- allowed grantee pair causes the preflight to fail. PUBLIC, legacy/application roles,
    -- and ad-hoc manual grants are ALL caught here. Both intended positives also asserted
    -- so the allowlist isn't satisfied vacuously by zero-grants. The canonical allowlist:
    --   crisis_event_current_state_v  -> SELECT permitted ONLY for crisis_event_staff_reader
    --                                    + crisis_event_current_state_view_owner (owner's
    --                                    own privilege; excluded from grant table queries)
    --   crisis_event_patient_summary_v -> SELECT permitted ONLY for crisis_event_patient_reader
    --                                     + crisis_event_patient_summary_view_owner
    -- The retired crisis_event_reader role MUST NOT exist (Phase 1 doesn't create it; if it
    -- exists in the role table it's drift).
    DECLARE
        v_offending_grant TEXT;
    BEGIN
        SELECT g.grantee || ' has SELECT on ' || g.table_name
          INTO v_offending_grant
          FROM information_schema.role_table_grants g
         WHERE g.table_schema = 'public'
           AND g.table_name = 'crisis_event_current_state_v'
           AND g.privilege_type = 'SELECT'
           AND g.grantee NOT IN ('crisis_event_staff_reader',
                                 'crisis_event_current_state_view_owner',
                                 'crisis_ctas_preflight_test_role')  -- R12 HIGH-1: minimal grant for behavioral preflight
         LIMIT 1;
        IF v_offending_grant IS NOT NULL THEN
            RAISE EXCEPTION 'crisis-view-grant-allowlist-violation (staff view): %; only crisis_event_staff_reader + crisis_event_current_state_view_owner + crisis_ctas_preflight_test_role may hold SELECT on crisis_event_current_state_v', v_offending_grant;
        END IF;

        SELECT g.grantee || ' has SELECT on ' || g.table_name
          INTO v_offending_grant
          FROM information_schema.role_table_grants g
         WHERE g.table_schema = 'public'
           AND g.table_name = 'crisis_event_patient_summary_v'
           AND g.privilege_type = 'SELECT'
           AND g.grantee NOT IN ('crisis_event_patient_reader',
                                 'crisis_event_patient_summary_view_owner')
         LIMIT 1;
        IF v_offending_grant IS NOT NULL THEN
            RAISE EXCEPTION 'crisis-view-grant-allowlist-violation (patient view): %; only crisis_event_patient_reader may hold SELECT on crisis_event_patient_summary_v', v_offending_grant;
        END IF;
    END;

    -- Verify the intended positive grants ARE in place (allowlist could be satisfied vacuously
    -- by zero grants; the positive checks below ensure the canonical role actually got SELECT):
    PERFORM 1 FROM information_schema.role_table_grants g
    WHERE g.table_schema = 'public'
      AND g.table_name = 'crisis_event_current_state_v'
      AND g.privilege_type = 'SELECT'
      AND g.grantee = 'crisis_event_staff_reader';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'crisis-view-grant-missing: crisis_event_staff_reader lacks SELECT on crisis_event_current_state_v';
    END IF;
    PERFORM 1 FROM information_schema.role_table_grants g
    WHERE g.table_schema = 'public'
      AND g.table_name = 'crisis_event_patient_summary_v'
      AND g.privilege_type = 'SELECT'
      AND g.grantee = 'crisis_event_patient_reader';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'crisis-view-grant-missing: crisis_event_patient_reader lacks SELECT on crisis_event_patient_summary_v';
    END IF;

    -- (G.2) R4 HIGH-1 + R5 HIGH-1 + R5 HIGH-2 closure 2026-05-21 — RECURSIVE
    -- role-membership closure assertion using a hardcoded canonical-member allowlist
    -- (NO dependency on net-new tenant_role_resolution table per R5 HIGH-1):
    --
    -- The grant allowlist (G.1) verifies direct SELECT grants. Any role made a
    -- MEMBER of crisis_event_staff_reader/_patient_reader (directly OR transitively
    -- through intermediate roles) inherits view privilege via pg_auth_members
    -- WITHOUT appearing in role_table_grants. R5 HIGH-2: G.2 prior version only
    -- checked one hop; this version uses a recursive CTE to compute the EFFECTIVE
    -- transitive closure of members for each reader role.
    --
    -- Canonical members (hardcoded; matches RBAC v1.3 baseline application role
    -- enumeration; NO dependency on new schema):
    --   crisis_event_staff_reader effective members allowed:
    --     'crisis_event_staff_reader' (self), 'tenant_clinician', 'tenant_care_team_member',
    --     'tenant_admin', 'crisis_acknowledger', 'crisis_responder', 'crisis_resolver'
    --     (the wrapper-driven app roles that legitimately need read access to context
    --     during tier-derivation lookups; they have EXECUTE on the wrappers and may
    --     be members of staff_reader for read-side context queries).
    --   crisis_event_patient_reader effective members allowed:
    --     'crisis_event_patient_reader' (self), 'tenant_patient', 'tenant_delegate'.
    -- Any effective member outside these sets is rejected; cross-membership rejected.
    -- If a deployment uses different canonical role names, update the allowlist
    -- constants below before running preflight (the constants are deployment-bound).
    DECLARE
        v_offending TEXT;
        v_canonical_staff_effective TEXT[] := ARRAY[
            'crisis_event_staff_reader', 'tenant_clinician', 'tenant_care_team_member',
            'tenant_admin', 'crisis_acknowledger', 'crisis_responder', 'crisis_resolver'
        ];
        v_canonical_patient_effective TEXT[] := ARRAY[
            'crisis_event_patient_reader', 'tenant_patient', 'tenant_delegate'
        ];
    BEGIN
        -- Recursive effective-membership closure for crisis_event_staff_reader.
        -- WITH RECURSIVE traverses pg_auth_members from each reader downward: the
        -- starting set is the reader role itself; each iteration adds direct members
        -- of any role already in the set. Termination is guaranteed because
        -- pg_auth_members is a finite DAG (PostgreSQL forbids membership cycles).
        WITH RECURSIVE staff_effective(rolname) AS (
            SELECT 'crisis_event_staff_reader'::name
            UNION
            SELECT pg_get_userbyid(m.member)::name
            FROM pg_auth_members m
            JOIN pg_roles r ON r.oid = m.roleid
            JOIN staff_effective se ON se.rolname = r.rolname
        )
        SELECT rolname || ' is effective member of crisis_event_staff_reader (direct or transitive)'
          INTO v_offending
          FROM staff_effective
         WHERE rolname::text <> ALL(v_canonical_staff_effective)
         LIMIT 1;
        IF v_offending IS NOT NULL THEN
            RAISE EXCEPTION 'crisis-view-effective-membership-violation (staff_reader): %; only canonical effective members per §7 are permitted; the recursive closure caught a role that inherits staff-view access', v_offending;
        END IF;

        -- Recursive effective-membership closure for crisis_event_patient_reader:
        WITH RECURSIVE patient_effective(rolname) AS (
            SELECT 'crisis_event_patient_reader'::name
            UNION
            SELECT pg_get_userbyid(m.member)::name
            FROM pg_auth_members m
            JOIN pg_roles r ON r.oid = m.roleid
            JOIN patient_effective pe ON pe.rolname = r.rolname
        )
        SELECT rolname || ' is effective member of crisis_event_patient_reader (direct or transitive)'
          INTO v_offending
          FROM patient_effective
         WHERE rolname::text <> ALL(v_canonical_patient_effective)
         LIMIT 1;
        IF v_offending IS NOT NULL THEN
            RAISE EXCEPTION 'crisis-view-effective-membership-violation (patient_reader): %; only canonical effective members per §7 are permitted', v_offending;
        END IF;

        -- Cross-membership check: NO role may be effective member of BOTH readers.
        -- Use the same recursive closures as above and check intersection.
        WITH RECURSIVE staff_effective(rolname) AS (
            SELECT 'crisis_event_staff_reader'::name
            UNION
            SELECT pg_get_userbyid(m.member)::name
            FROM pg_auth_members m JOIN pg_roles r ON r.oid = m.roleid
            JOIN staff_effective se ON se.rolname = r.rolname
        ), patient_effective(rolname) AS (
            SELECT 'crisis_event_patient_reader'::name
            UNION
            SELECT pg_get_userbyid(m.member)::name
            FROM pg_auth_members m JOIN pg_roles r ON r.oid = m.roleid
            JOIN patient_effective pe ON pe.rolname = r.rolname
        )
        SELECT s.rolname || ' is effective member of BOTH readers'
          INTO v_offending
          FROM staff_effective s
          JOIN patient_effective p ON p.rolname = s.rolname
         WHERE s.rolname::text NOT IN ('crisis_event_staff_reader', 'crisis_event_patient_reader')
         LIMIT 1;
        IF v_offending IS NOT NULL THEN
            RAISE EXCEPTION 'crisis-view-cross-membership-violation: %; a role effective member of BOTH readers would inherit BOTH tenant-wide staff view + patient self-scoped view access, defeating the R1 HIGH-2 split', v_offending;
        END IF;
    END;

    -- (H) R6 HIGH-1 closure 2026-05-21 — predefined/global read-role bypass rejection.
    -- PostgreSQL 14+ ships predefined roles (e.g. pg_read_all_data) that grant SELECT on
    -- ALL tables/views in ALL schemas, bypassing G.1/G.2 because the role doesn't appear
    -- as a grantee in role_table_grants and doesn't need membership in the canonical
    -- reader roles. Same impact as R1 HIGH-2: a non-canonical principal granted
    -- pg_read_all_data (whether directly or transitively) can SELECT the tenant-wide
    -- staff view while passing G.1 + G.2. BYPASSRLS roles can read past the tenant RLS
    -- boundary as well. Preflight asserts: any role with pg_read_all_data membership
    -- (direct or transitive) OR with the BYPASSRLS attribute MUST be explicitly enumerated
    -- in the canonical break-glass-admin-only set; application runtime roles MUST NOT
    -- hold either privilege.
    DECLARE
        v_offending TEXT;
        v_canonical_breakglass_admin TEXT[] := ARRAY[
            'break_glass_procedure_owner', 'platform_operator_breakglass'
        ];
    BEGIN
        -- Recursive effective-members of pg_read_all_data (PG14+); reject any non-canonical
        -- effective member. On PG13- where pg_read_all_data does not exist, the recursive
        -- CTE returns the empty set and the check passes vacuously.
        WITH RECURSIVE read_all_effective(rolname) AS (
            SELECT rolname::name FROM pg_roles WHERE rolname = 'pg_read_all_data'
            UNION
            SELECT pg_get_userbyid(m.member)::name
            FROM pg_auth_members m
            JOIN pg_roles r ON r.oid = m.roleid
            JOIN read_all_effective rae ON rae.rolname = r.rolname
        )
        SELECT rolname || ' is effective member of pg_read_all_data'
          INTO v_offending
          FROM read_all_effective
         WHERE rolname::text NOT IN ('pg_read_all_data')
           AND rolname::text <> ALL(v_canonical_breakglass_admin)
         LIMIT 1;
        IF v_offending IS NOT NULL THEN
            RAISE EXCEPTION 'crisis-view-predefined-role-bypass (pg_read_all_data): %; only canonical break-glass-admin roles may hold pg_read_all_data; application runtime roles MUST NOT', v_offending;
        END IF;

        -- BYPASSRLS attribute check: any role with rolbypassrls=true MUST be in the
        -- canonical break-glass-admin set (BYPASSRLS reads past tenant RLS and would
        -- expose cross-tenant crisis state).
        SELECT rolname || ' has BYPASSRLS attribute'
          INTO v_offending
          FROM pg_roles
         WHERE rolbypassrls = TRUE
           AND rolname::text <> ALL(v_canonical_breakglass_admin)
           AND rolname::text NOT IN ('postgres', 'rds_superuser')   -- standard PG/RDS superuser
         LIMIT 1;
        IF v_offending IS NOT NULL THEN
            RAISE EXCEPTION 'crisis-view-bypassrls-violation: %; only canonical break-glass-admin or superuser roles may hold BYPASSRLS; BYPASSRLS reads past tenant RLS and exposes cross-tenant crisis state', v_offending;
        END IF;
    END;

    -- (I) R6 HIGH-2 closure 2026-05-21 — SECURITY DEFINER dependency rejection.
    -- Any SECURITY DEFINER routine that references crisis_event_current_state_v or
    -- crisis_event_patient_summary_v can re-expose rows to its EXECUTE callers — the
    -- routine reads under owner's privileges, bypassing both the reader-role grant
    -- (G.1) and the membership-closure check (G.2). A SECDEF function owned by a
    -- staff_reader (or by an admin role) and EXECUTE-granted to PUBLIC or a
    -- patient/delegate role would return tenant-wide rows to non-canonical callers
    -- while G.1+G.2+G.3 still pass. Preflight asserts: every SECDEF routine that
    -- depends on either crisis view (via pg_depend on the view's relkind='v' oid)
    -- MUST be on the canonical-allowlist of approved routines (which is the EMPTY
    -- set in this amendment — the 6 wrapper procedures in §3 do NOT depend on the
    -- views; they operate on the base tables via SECURITY DEFINER with explicit
    -- tenant-bound predicates). Any new SECDEF routine that depends on either view
    -- requires a §8.1 preflight allowlist update + ratifier sign-off.
    DECLARE
        v_offending_routine TEXT;
        v_canonical_secdef_view_dependents TEXT[] := ARRAY[]::TEXT[];   -- empty; no approved dependents at v1.10
    BEGIN
        SELECT p.proname || ' (SECURITY DEFINER, owner=' || pg_get_userbyid(p.proowner)::text || ') depends on ' || v.relname
          INTO v_offending_routine
          FROM pg_proc p
          JOIN pg_depend d ON d.objid = p.oid AND d.classid = 'pg_proc'::regclass
          JOIN pg_rewrite rw ON rw.oid = d.refobjid AND d.refclassid = 'pg_rewrite'::regclass
          JOIN pg_class v ON v.oid = rw.ev_class
         WHERE p.prosecdef = TRUE
           AND v.relname IN ('crisis_event_current_state_v', 'crisis_event_patient_summary_v')
           AND p.proname <> ALL(v_canonical_secdef_view_dependents)
         LIMIT 1;
        IF v_offending_routine IS NOT NULL THEN
            RAISE EXCEPTION 'crisis-view-secdef-dependency-violation: %; a SECURITY DEFINER routine depends on a crisis view; this re-exposes tenant-wide view rows to EXECUTE callers regardless of grant-matrix; routines depending on crisis views require explicit allowlist entry in v_canonical_secdef_view_dependents + ratifier sign-off', v_offending_routine;
        END IF;

        -- Also reject PUBLIC EXECUTE on any routine in the §3 canonical procedure set
        -- (the 6 SECURITY DEFINER procedures should ONLY be EXECUTE-grantable to their
        -- documented canonical caller-class application roles per §3 + §7):
        PERFORM 1
          FROM information_schema.routine_privileges rp
         WHERE rp.routine_schema = 'public'
           AND rp.routine_name IN (
               'record_crisis_event_lifecycle_transition',
               'record_crisis_initiation',
               'record_crisis_acknowledgement_claim',
               'record_crisis_response',
               'record_crisis_resolution',
               'execute_crisis_no_acknowledgement_sweep'
           )
           AND rp.privilege_type = 'EXECUTE'
           AND rp.grantee = 'PUBLIC';
        IF FOUND THEN
            RAISE EXCEPTION 'crisis-procedure-public-execute-violation: a canonical crisis procedure has EXECUTE granted to PUBLIC; reject';
        END IF;
    END;

    -- (J) R7 HIGH-1 closure 2026-05-21 — SECDEF dynamic-SQL / dblink / FDW rejection.
    -- Class I (above) only catches pg_depend-tracked references. Dynamic SQL via
    -- EXECUTE 'SELECT ... FROM crisis_event_current_state_v', dblink calls, and
    -- postgres_fdw foreign-server callbacks do NOT necessarily create pg_depend
    -- edges, so a SECDEF function with `EXECUTE 'SELECT * FROM
    -- crisis_event_current_state_v'` body would pass class I while still
    -- re-exposing tenant-wide view rows under owner privileges to PUBLIC/patient
    -- callers. Fix: scan prosrc text of ALL SECDEF routines for static references
    -- to the crisis views / base tables / dblink / postgres_fdw and reject any
    -- that are not on the canonical allowlist (empty at v1.10). Also reject
    -- PUBLIC/non-canonical EXECUTE on ANY SECDEF routine whose prosrc text
    -- mentions a crisis-domain object.
    DECLARE
        v_offending TEXT;
        v_canonical_secdef_text_dependents TEXT[] := ARRAY[
            -- The 6 §3 canonical procedures legitimately reference crisis base tables
            -- (not the views) under SECURITY DEFINER; they are explicitly allowlisted.
            'record_crisis_event_lifecycle_transition',
            'record_crisis_initiation',
            'record_crisis_acknowledgement_claim',
            'record_crisis_response',
            'record_crisis_resolution',
            'execute_crisis_no_acknowledgement_sweep'
        ];
    BEGIN
        SELECT p.proname || ' (SECURITY DEFINER, owner=' || pg_get_userbyid(p.proowner)::text
               || ') prosrc text references a crisis-domain object (view / base table / dblink / postgres_fdw)'
          INTO v_offending
          FROM pg_proc p
         WHERE p.prosecdef = TRUE
           AND p.proname <> ALL(v_canonical_secdef_text_dependents)
           AND (
                p.prosrc ~* '\mcrisis_event_current_state_v\M'
             OR p.prosrc ~* '\mcrisis_event_patient_summary_v\M'
             OR p.prosrc ~* '\mcrisis_event\M'
             OR p.prosrc ~* '\mcrisis_event_lifecycle_transition\M'
             OR p.prosrc ~* '\mcrisis_sweep_execution\M'
             OR p.prosrc ~* '\mnotification_crisis_(dispatch_ledger|provider_attempt|escalation_obligation)\M'
             OR p.prosrc ~* '\mdblink\M'
             OR p.prosrc ~* '\mpostgres_fdw\M'
           )
         LIMIT 1;
        IF v_offending IS NOT NULL THEN
            RAISE EXCEPTION 'crisis-view-secdef-text-dependency-violation: %; non-allowlisted SECDEF routine has prosrc reference to crisis-domain object — re-exposes data via dynamic SQL / dblink / FDW outside grant-matrix; allowlist update + ratifier sign-off required', v_offending;
        END IF;

        -- Reject PUBLIC EXECUTE on ANY SECDEF routine that references crisis-domain
        -- objects in prosrc text (defense-in-depth beyond the canonical 6 in class I).
        SELECT p.proname
          INTO v_offending
          FROM pg_proc p
          JOIN information_schema.routine_privileges rp
            ON rp.routine_name = p.proname AND rp.routine_schema = 'public'
         WHERE p.prosecdef = TRUE
           AND rp.privilege_type = 'EXECUTE'
           AND rp.grantee = 'PUBLIC'
           AND (
                p.prosrc ~* '\mcrisis_event\M'
             OR p.prosrc ~* '\mnotification_crisis_\w+\M'
           )
         LIMIT 1;
        IF v_offending IS NOT NULL THEN
            RAISE EXCEPTION 'crisis-secdef-public-execute-violation: SECDEF routine % with crisis-domain prosrc reference has PUBLIC EXECUTE; reject', v_offending;
        END IF;
    END;

    -- (K) R7 HIGH-2 + R8 HIGH-1 closure 2026-05-21 — derived-persistent-copy rejection
    -- (catalog-correct version).
    --
    -- PostgreSQL view/MV dependency shape: when a view or materialized view is defined
    -- as SELECT ... FROM source_view, the dependency edge goes:
    --     source_view.pg_class.oid (refobjid, refclassid='pg_class') <- pg_depend ->
    --     dependent_rewrite_rule.pg_rewrite.oid (objid, classid='pg_rewrite')
    --     -> pg_rewrite.ev_class -> dependent_view_or_mv.pg_class.oid
    -- The prior v0.10 query had refobjid/objid inverted (looked for dependent class
    -- depending on source rewrite rule) — would miss every real derived view/MV.
    --
    -- Note on CTAS (CREATE TABLE leak AS SELECT ... FROM crisis view): CTAS materializes
    -- once + drops all dependency tracking — NO pg_depend edge exists. CTAS tables are
    -- NOT discoverable via pg_depend at all. Defense: enforce via DDL event-trigger
    -- provenance control on CREATE TABLE / SELECT INTO that reads from crisis views.
    -- Preflight check below ALSO covers CTAS by scanning pg_class for any persisted
    -- table/MV whose row-count > 0 and whose name matches a deployment-track or
    -- column-shape heuristic — but the AUTHORITATIVE defense for CTAS is the
    -- DDL event trigger documented in §8.2 Phase 7.1 below (R8 HIGH-1 addendum).
    --
    -- Allowed dependents (empty at v1.10; no derived persistent copies sanctioned):
    DECLARE
        v_offending TEXT;
        v_canonical_view_dependents TEXT[] := ARRAY[]::TEXT[];   -- empty
    BEGIN
        -- Catalog-correct dependency traversal: source view oid -> pg_depend ->
        -- dependent rewrite rule -> pg_rewrite.ev_class -> dependent class.
        SELECT dependent.relname || ' (relkind=' || dependent.relkind ||
               ', owner=' || pg_get_userbyid(dependent.relowner)::text || ') has rewrite rule depending on '
               || source.relname
          INTO v_offending
          FROM pg_class source
          JOIN pg_depend d
            ON d.refobjid = source.oid
           AND d.refclassid = 'pg_class'::regclass
           AND d.classid = 'pg_rewrite'::regclass
          JOIN pg_rewrite rw ON rw.oid = d.objid
          JOIN pg_class dependent ON dependent.oid = rw.ev_class
         WHERE source.relname IN ('crisis_event_current_state_v', 'crisis_event_patient_summary_v')
           AND dependent.relkind IN ('m', 'v', 'f')  -- materialized view, view, foreign table (CTAS 'r' below)
           AND dependent.relname NOT IN ('crisis_event_current_state_v', 'crisis_event_patient_summary_v')
           AND dependent.relname <> ALL(v_canonical_view_dependents)
         LIMIT 1;
        IF v_offending IS NOT NULL THEN
            RAISE EXCEPTION 'crisis-view-derived-relation-violation: %; non-allowlisted persistent relation depends on a crisis view via rewrite rule (could persist tenant-wide rows outside security boundary); allowlist update + ratifier sign-off required', v_offending;
        END IF;

        -- CTAS tables: no pg_depend edge exists; defense is the DDL event trigger
        -- created at §8.2 Phase 7.1 (R8 HIGH-1 + R9 HIGH-1 addendum). Preflight asserts
        -- (a) event trigger exists + is enabled AND (b) BEHAVIORALLY verifies the trigger
        -- blocks a real CTAS attempt against a crisis view under a synthetic
        -- non-breakglass test role (R9 HIGH-1 closure 2026-05-21 — existence-only check
        -- could pass with a stub/broken trigger; behavioral check proves the trigger
        -- actually rejects).
        PERFORM 1 FROM pg_event_trigger
         WHERE evtname = 'crisis_view_ctas_provenance_block'
           AND evtenabled <> 'D';   -- 'D' = disabled
        IF NOT FOUND THEN
            RAISE EXCEPTION 'crisis-view-ctas-provenance-trigger-missing: the canonical event trigger crisis_view_ctas_provenance_block (created at Phase 7.1) is missing OR disabled; CTAS copies of crisis views would not be caught; recreate the event trigger before cutover';
        END IF;

        -- Behavioral verification: switch session role to a synthetic non-breakglass
        -- test role (created Phase 7.1.a expressly for this preflight check; granted
        -- CREATE on a sandbox schema; NOT a member of any canonical reader/admin role)
        -- and attempt CREATE MATERIALIZED VIEW against a crisis view; assert the
        -- event trigger raises the expected exception. Wraps in a sub-block that
        -- catches the expected exception and re-raises only if NOT caught.
        DECLARE
            v_blocked BOOLEAN := FALSE;
            v_test_role TEXT := 'crisis_ctas_preflight_test_role';
            v_scratch_schema TEXT := 'crisis_preflight_scratch';
        BEGIN
            -- Verify the synthetic test role + scratch schema both exist (created by
            -- Phase 7.1.a; R10 HIGH-1 closure 2026-05-21: scratch schema replaces
            -- pg_temp because pg_temp is not a valid target for CREATE MATERIALIZED
            -- VIEW — MVs are durable, not temporary):
            PERFORM 1 FROM pg_roles WHERE rolname = v_test_role;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'crisis-view-ctas-preflight-test-role-missing: % role expected to exist for behavioral CTAS preflight; create per §8.2 Phase 7.1.a', v_test_role;
            END IF;
            PERFORM 1 FROM pg_namespace WHERE nspname = v_scratch_schema;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'crisis-view-ctas-preflight-scratch-schema-missing: % schema expected to exist as durable probe target for CREATE MATERIALIZED VIEW (pg_temp is NOT a valid MV target); create per §8.2 Phase 7.1.a', v_scratch_schema;
            END IF;

            -- R11 HIGH-1 closure 2026-05-21: SET ROLE precondition. PostgreSQL SET ROLE
            -- requires the current session user to have been granted membership in the
            -- target role. Phase 7.1.a executes `GRANT crisis_ctas_preflight_test_role
            -- TO cdm_owner` so the canonical migration-runner can SET ROLE during
            -- preflight. Verify the precondition is satisfied BEFORE attempting SET ROLE
            -- so a missing grant produces a clear actionable error instead of an
            -- opaque insufficient_privilege bubbling from SET ROLE itself (which would
            -- be misread as the event-trigger fire and trigger the "behavioral guarantee"
            -- path incorrectly).
            IF NOT pg_has_role(current_user, v_test_role, 'MEMBER') THEN
                RAISE EXCEPTION 'crisis-view-ctas-preflight-set-role-precondition-violation: current preflight executor % cannot SET ROLE to %; Phase 7.1.a must execute `GRANT % TO %` before preflight runs', current_user, v_test_role, v_test_role, current_user;
            END IF;

            -- Cleanup any orphan probe MV from a prior crashed preflight (defensive;
            -- runs under preflight-caller's normal privileges):
            EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS %I.__crisis_ctas_preflight_probe',
                           v_scratch_schema);

            -- Switch role; attempt CTAS in durable scratch schema; expect the event
            -- trigger to raise. R10 HIGH-1: probe target is now crisis_preflight_scratch
            -- (not pg_temp), so MV creation is structurally permitted and ONLY
            -- the event trigger's insufficient_privilege should reject it.
            EXECUTE 'SET LOCAL ROLE ' || quote_ident(v_test_role);
            BEGIN
                EXECUTE format(
                    'CREATE MATERIALIZED VIEW %I.__crisis_ctas_preflight_probe AS SELECT * FROM public.crisis_event_current_state_v WHERE FALSE',
                    v_scratch_schema
                );
                v_blocked := FALSE;   -- if we reach here, trigger did NOT block — defect
                -- Defensive cleanup if trigger didn't fire — the probe MV must not
                -- linger (otherwise it persists tenant-wide-rows-shape outside the
                -- security boundary, the exact thing we're proving cannot happen):
                EXECUTE format('DROP MATERIALIZED VIEW IF EXISTS %I.__crisis_ctas_preflight_probe',
                               v_scratch_schema);
            EXCEPTION
                -- R12 HIGH-1 closure 2026-05-21: assert the EXACT dedicated SQLSTATE
                -- 'CR022' that the event trigger raises — NOT generic insufficient_privilege.
                -- Distinguishes "trigger blocked CTAS" (expected) from "ordinary view
                -- permission check rejected" (false-positive shape if test role lacks
                -- SELECT on staff view). Trigger function in Phase 7.1 raises with
                -- ERRCODE = 'CR022' (user-defined 5-char code reserved for SI-022
                -- crisis provenance enforcement).
                WHEN SQLSTATE 'CR022' THEN
                    v_blocked := TRUE;   -- expected outcome — trigger raised with dedicated errcode
                WHEN insufficient_privilege THEN
                    -- This is NOT the trigger's signal — it's PG's normal view
                    -- permission check (test role lacks SELECT on the view OR on
                    -- the schema). Reject the preflight: either grant the test
                    -- role SELECT on the staff view at Phase 7.1.a (so this code
                    -- path is unreachable) OR fix the trigger configuration.
                    RAISE EXCEPTION 'crisis-view-ctas-preflight-permission-check-intercept: probe raised insufficient_privilege but NOT from the event trigger (trigger uses dedicated SQLSTATE CR022); PG normal view permission check rejected the statement BEFORE the trigger could evaluate; per §8.2 Phase 7.1.a step (3a) grant `crisis_event_staff_reader` to crisis_ctas_preflight_test_role so the trigger is the SOLE gating mechanism';
                WHEN OTHERS THEN
                    RAISE EXCEPTION 'crisis-view-ctas-preflight-unexpected-error: behavioral CTAS probe raised unexpected exception (SQLSTATE %, message %); expected SQLSTATE CR022 from crisis_view_ctas_provenance_block', SQLSTATE, SQLERRM;
            END;
            -- Restore role context:
            RESET ROLE;

            IF NOT v_blocked THEN
                RAISE EXCEPTION 'crisis-view-ctas-behavioral-violation: synthetic non-breakglass role % was able to CREATE MATERIALIZED VIEW from crisis_event_current_state_v in scratch schema % WITHOUT triggering crisis_view_ctas_provenance_block; the trigger is mis-configured (e.g., command-tag filter wrong, function body stub, or trigger disabled mid-deploy); recreate per Phase 7.1', v_test_role, v_scratch_schema;
            END IF;
        END;
    END;

    -- (L) R7 HIGH-3 closure 2026-05-21 — view-owner relowner + owner-attribute assertion.
    -- Phase 7 says the views must be owned by crisis_event_current_state_view_owner +
    -- crisis_event_patient_summary_view_owner, but preflight only checked reloptions +
    -- grants. If a view is ALTERed to a noncanonical owner, that owner gains implicit
    -- control over the view definition + grants, bypassing G.3 grant-option protections.
    -- Also: the canonical view-owner roles MUST be non-login + non-BYPASSRLS + non-member
    -- of pg_read_all_data (so even owner can't bypass the boundary outside cutover).
    DECLARE
        v_actual_owner TEXT;
    BEGIN
        SELECT pg_get_userbyid(c.relowner)::text
          INTO v_actual_owner
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public'
           AND c.relname = 'crisis_event_current_state_v'
           AND c.relkind = 'v';
        IF v_actual_owner IS NULL THEN
            RAISE EXCEPTION 'crisis-view-owner-missing: crisis_event_current_state_v not found';
        END IF;
        IF v_actual_owner <> 'crisis_event_current_state_view_owner' THEN
            RAISE EXCEPTION 'crisis-view-owner-violation: crisis_event_current_state_v owner = %; expected crisis_event_current_state_view_owner; reset ownership via ALTER VIEW ... OWNER TO crisis_event_current_state_view_owner before cutover', v_actual_owner;
        END IF;

        SELECT pg_get_userbyid(c.relowner)::text
          INTO v_actual_owner
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public'
           AND c.relname = 'crisis_event_patient_summary_v'
           AND c.relkind = 'v';
        IF v_actual_owner IS NULL THEN
            RAISE EXCEPTION 'crisis-view-owner-missing: crisis_event_patient_summary_v not found';
        END IF;
        IF v_actual_owner <> 'crisis_event_patient_summary_view_owner' THEN
            RAISE EXCEPTION 'crisis-view-owner-violation: crisis_event_patient_summary_v owner = %; expected crisis_event_patient_summary_view_owner', v_actual_owner;
        END IF;

        -- Owner-attribute checks: canonical view-owner roles MUST be NOLOGIN +
        -- non-BYPASSRLS + non-effective-member of pg_read_all_data (the latter
        -- already covered by class H but re-asserted here scoped to view owners
        -- to make the contract explicit at the owner site).
        PERFORM 1 FROM pg_roles
        WHERE rolname IN ('crisis_event_current_state_view_owner',
                          'crisis_event_patient_summary_view_owner')
          AND (rolcanlogin = TRUE OR rolbypassrls = TRUE);
        IF FOUND THEN
            RAISE EXCEPTION 'crisis-view-owner-attribute-violation: a canonical crisis view-owner role has LOGIN or BYPASSRLS; reject (view owners must be NOLOGIN, non-BYPASSRLS so even owner cannot bypass the boundary outside cutover); ALTER ROLE NOLOGIN NOBYPASSRLS';
        END IF;
    END;

    -- (M) R8 HIGH-2 closure 2026-05-21 — view-definition integrity assertion.
    -- Classes F/G/L assert reloptions, grants, membership, owner. But a drifted or
    -- malicious `crisis_event_patient_summary_v` with the same name + owner +
    -- security_invoker + grant matrix BUT a different body (e.g., missing the
    -- verify_session_jwt_and_extract_claims() join + patient/delegate predicate)
    -- would pass all prior assertions while restoring the v0.3 R1 HIGH-2 tenant-wide
    -- read leak. Same risk on the staff view (different drift class but same shape).
    -- Defense: assert that pg_get_viewdef() text contains the required canonical
    -- predicate fragments. Text matching is a coarse defense (a maliciously-shaped
    -- view that ALSO contains the predicate fragments but in a tautological way
    -- could pass) but catches the dominant drift modes: removing the predicate
    -- entirely, removing the consent_grant join, or substituting staff view body
    -- under patient view name.
    DECLARE
        v_patient_view_def TEXT;
        v_staff_view_def TEXT;
    BEGIN
        SELECT pg_get_viewdef('public.crisis_event_patient_summary_v'::regclass, true)
          INTO v_patient_view_def;
        IF v_patient_view_def IS NULL THEN
            RAISE EXCEPTION 'crisis-view-def-missing: crisis_event_patient_summary_v has no resolvable definition';
        END IF;
        IF NOT (v_patient_view_def ~* 'verify_session_jwt_and_extract_claims') THEN
            RAISE EXCEPTION 'crisis-patient-view-predicate-missing: crisis_event_patient_summary_v body does not reference verify_session_jwt_and_extract_claims() — the self-scoping predicate is absent; recreate view per §4.NEW4a';
        END IF;
        IF NOT (v_patient_view_def ~* 'consent_grant' AND v_patient_view_def ~* 'emergency_contact_share') THEN
            RAISE EXCEPTION 'crisis-patient-view-consent-predicate-missing: crisis_event_patient_summary_v body does not reference the consent_grant + emergency_contact_share delegate-scope predicate; recreate view per §4.NEW4a';
        END IF;
        IF NOT (v_patient_view_def ~* 'verified_patient_id') THEN
            RAISE EXCEPTION 'crisis-patient-view-patient-id-match-missing: crisis_event_patient_summary_v body does not reference verified_patient_id equality path; recreate view per §4.NEW4a';
        END IF;
        -- Negative: the patient view body MUST NOT join the staff view (would
        -- pull tenant-wide rows in through a transitive path):
        IF v_patient_view_def ~* '\mcrisis_event_current_state_v\M' THEN
            RAISE EXCEPTION 'crisis-patient-view-cross-reference-violation: crisis_event_patient_summary_v body references crisis_event_current_state_v — would pull tenant-wide rows through a transitive path; recreate view per §4.NEW4a (must read directly from base tables, NOT from the staff view)';
        END IF;

        SELECT pg_get_viewdef('public.crisis_event_current_state_v'::regclass, true)
          INTO v_staff_view_def;
        IF v_staff_view_def IS NULL THEN
            RAISE EXCEPTION 'crisis-view-def-missing: crisis_event_current_state_v has no resolvable definition';
        END IF;
        -- Staff view does NOT use verify_session_jwt_and_extract_claims() (it's
        -- tenant-wide); but it MUST join the canonical underlying tables.
        IF NOT (v_staff_view_def ~* '\mcrisis_event\M'
                AND v_staff_view_def ~* '\mcrisis_event_lifecycle_transition\M'
                AND v_staff_view_def ~* '\mnotification_crisis_escalation_obligation\M') THEN
            RAISE EXCEPTION 'crisis-staff-view-source-table-missing: crisis_event_current_state_v body does not reference one of the canonical source tables (crisis_event + crisis_event_lifecycle_transition + notification_crisis_escalation_obligation); recreate view per §4.NEW4';
        END IF;
    END;

    -- (G.3) R4 HIGH-1 closure 2026-05-21 — grant-option/admin-option rejection on view grants.
    -- A canonical reader role MUST NOT be granted WITH GRANT OPTION (would let it re-grant
    -- SELECT to arbitrary downstream roles, defeating the allowlist). Same for ADMIN OPTION
    -- on reader roles (would let it grant MEMBERSHIP to arbitrary downstream roles).
    PERFORM 1 FROM information_schema.role_table_grants g
    WHERE g.table_schema = 'public'
      AND g.table_name IN ('crisis_event_current_state_v', 'crisis_event_patient_summary_v')
      AND g.privilege_type = 'SELECT'
      AND g.is_grantable = 'YES';
    IF FOUND THEN
        RAISE EXCEPTION 'crisis-view-grant-option-violation: a SELECT grant on a crisis view has WITH GRANT OPTION; reject (would defeat the allowlist by allowing re-grants); use GRANT SELECT ... TO <role> (no WITH GRANT OPTION)';
    END IF;
    PERFORM 1 FROM pg_auth_members m
    JOIN pg_roles r ON r.oid = m.roleid
    WHERE r.rolname IN ('crisis_event_staff_reader', 'crisis_event_patient_reader')
      AND m.admin_option = TRUE;
    IF FOUND THEN
        RAISE EXCEPTION 'crisis-view-admin-option-violation: a canonical reader role has a member with ADMIN OPTION; reject (would allow that member to grant reader-role membership to arbitrary downstream roles, defeating the membership-closure allowlist)';
    END IF;

    -- (E) Tenant config Part C (emergency_contact_consent_enabled=true only; R31+R32):
    SELECT jsonb_agg(jsonb_build_object('tenant_id', tenant_id, 'missing', missing_keys))
    INTO v_tenant_config_missing
    FROM (
        SELECT tenant_id,
               array_remove(ARRAY[
                   CASE WHEN crisis_emergency_contact_channel IS NULL
                        THEN 'crisis.emergency_contact_channel' END,
                   CASE WHEN crisis_emergency_contact_channel IS NOT NULL
                        AND NOT (crisis_emergency_contact_channel = ANY(crisis_fanout_channels))
                        THEN 'crisis.emergency_contact_channel-not-in-fanout' END
               ], NULL) AS missing_keys
        FROM tenant_config t
        WHERE emergency_contact_consent_enabled = TRUE
    ) per_tenant
    WHERE cardinality(missing_keys) > 0;
    IF v_tenant_config_missing IS NOT NULL THEN
        RAISE EXCEPTION 'crisis-tenant-config-part-c-violations: %', v_tenant_config_missing::TEXT;
    END IF;
END;
$$;
```

### §8.2 — Cutover sequencing (per P-036 R6 tables-first-views-last cdm_owner seeding pattern)

1. **Phase 1 — RBAC + ownership setup (R3 HIGH-2 closure 2026-05-21: 15 net-new roles, NOT 13 — the prior count was stale from before R1 HIGH-2 reader-role split; Phase 1 list MUST match §7 enumeration + §8.1 assertion class A enumeration exactly):** Create the **15 net-new RBAC roles** via the canonical migration framework: (1) `crisis_initiator`, (2) `crisis_acknowledger`, (3) `crisis_responder`, (4) `crisis_resolver`, (5) `crisis_sweep_scheduler`, (6) `crisis_event_staff_reader` (R1 HIGH-2 split), (7) `crisis_event_patient_reader` (R1 HIGH-2 split), (8) `crisis_initiation_wrapper_owner`, (9) `crisis_acknowledgement_wrapper_owner`, (10) `crisis_response_wrapper_owner`, (11) `crisis_resolution_wrapper_owner`, (12) `crisis_sweep_wrapper_owner`, (13) `crisis_event_lifecycle_transition_writer_owner`, (14) `crisis_event_current_state_view_owner` (staff view), (15) `crisis_event_patient_summary_view_owner` (patient view). The retired `crisis_event_reader` role MUST NOT be created (§8.1 class G allowlist would reject it; §7 does not enumerate it). Set role passwords via the canonical KMS-bound credential vault (no plaintext role passwords in migration scripts).
2. **Phase 2 — Tables first:** Create `crisis_event` + `crisis_event_lifecycle_transition` + `crisis_sweep_execution` tables. ALTER existing `notification_crisis_dispatch_ledger` + `notification_crisis_provider_attempt` + `notification_crisis_escalation_obligation` with the additive column extensions (nullable initially per §4.EXT1/EXT2/EXT3).
3. **Phase 3 — Backfill:** For each existing P-027 row (dispatch_ledger / provider_attempt / escalation_obligation), backfill `crisis_event_id` via the per-row `(tenant_id, server_signal_id)` → `crisis_event.id` lookup. (Backfill is a no-op on a greenfield deploy with zero pre-existing crisis_event rows.) After backfill verifies 100% coverage, ALTER `crisis_event_id` columns to `NOT NULL`.
4. **Phase 4 — Triggers:** Create the 2 invariant triggers (`crisis_event_append_only`, `crisis_event_lifecycle_transition_continuity` + monotonic-ordering trigger). All trigger functions schema-qualified + locked search_path per P-034 R7. crisis_sweep_execution's `enforce_terminal_row_immutable` trigger.
5. **Phase 5 — RLS policies:** Enable RLS + create policies on the 3 net-new tables (per §4.NEW1/NEW2/NEW3 above).
6. **Phase 6 — Procedures:** Deploy the 6 SECURITY DEFINER procedures via the canonical procedure-deploy gate (verify SECURITY DEFINER + locked search_path on each); set ownership; grant EXECUTE per §3.1-3.6.
7.1. **Phase 7.1 — DDL event trigger for CTAS provenance block (R8 HIGH-1 + R9 HIGH-1 addendum 2026-05-21):** create event trigger `crisis_view_ctas_provenance_block` on `ddl_command_start` filtered by command tags `{CREATE TABLE AS, SELECT INTO, CREATE MATERIALIZED VIEW}`. Trigger body inspects `current_query()` text (NOT `pg_event_trigger_ddl_commands()` — that function is only available at `ddl_command_end` per R9 HIGH-1 catalog correction); raises exception if the command body references any crisis-domain object name AND the issuing role is not in the canonical break-glass-admin allowlist. Executable trigger DDL:

```sql
CREATE OR REPLACE FUNCTION crisis_view_ctas_provenance_block_fn()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY INVOKER   -- R17 HIGH-1 closure 2026-05-21: was SECURITY DEFINER; current_user
                   -- inside SECDEF function returns function owner (break_glass_procedure_owner),
                   -- not the DDL issuer — break-glass allowlist would trivially pass for ANY
                   -- caller. SECURITY INVOKER makes current_user = the actual DDL-issuing role
                   -- (respecting SET ROLE semantics), which is the correct authorization input
                   -- for both the break-glass allowlist (class H canonical set) AND the
                   -- has_table_privilege() capability checks below. The trigger does NOT
                   -- require owner-level privileges to evaluate — current_query() +
                   -- has_table_privilege() + pg_auth_members traversal all work under invoker
                   -- privileges. Locked search_path is preserved for safe catalog access.
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_query TEXT;
    v_role TEXT := current_user;
    v_breakglass_allowed BOOLEAN;
BEGIN
    -- Command-tag filter handled by event trigger registration WHEN clause;
    -- this body runs only for the 3 target command tags.
    v_query := current_query();
    -- R15 ratifier decision 2026-05-21 (Evans chose Option B per ERR
    -- Engineering-Review-Request-P-040-R15-CTAS-Categorical-Block-Scope-2026-05-21.md):
    -- Reverted R14 categorical-block (which scope-creeped into a database-wide DDL
    -- policy change beyond P-040 SI-022-follow-on scope; flagged as hard-floor item 6
    -- by Codex R15 + dissolved via dual-recommendation two-pass consult; Claude=B,
    -- Pass-1=B-prime, Pass-2=B-prime; Evans ratified plain B).
    --
    -- Restored v0.16 dual-detection — block CTAS/MV/SELECT INTO when EITHER (a)
    -- current_query() text directly references a crisis-domain object, OR (b) the
    -- calling role can read any crisis-domain object (via direct grant or role-
    -- membership inheritance). Branch (b) catches non-SECDEF helper indirection
    -- (helper invokes view under caller's privileges).
    --
    -- ACCEPTED RESIDUAL RISK (Evans's Option B ratification): SECURITY DEFINER
    -- wrapper indirection is not closed by this trigger — a low-privilege caller
    -- with EXECUTE on an existing SECDEF wrapper that reads crisis data under the
    -- wrapper-owner's privilege and returns rows could `CREATE MATERIALIZED VIEW
    -- ... AS SELECT * FROM wrapper_fn()`; current_user has no crisis SELECT
    -- capability for has_table_privilege() to detect AND the CTAS text only names
    -- the wrapper. This residual is bounded at v1.10 because the 6 §3 canonical
    -- wrappers all return VOID/uuid (NOT row sets) and are EXECUTE-restricted to
    -- specific canonical app roles per §3 + §7. Future SECDEF wrappers that return
    -- crisis-derived rows should be addressed via Track 6 follow-on cycle "Crisis
    -- Data Provenance Hardening v2" (recommended, not mandatory per Evans's
    -- Option B selection; if/when a row-returning SECDEF wrapper is added, the
    -- Track 6 cycle is the proper venue to close the bypass class).
    IF v_query ~* '\m(crisis_event_current_state_v|crisis_event_patient_summary_v|crisis_event|crisis_event_lifecycle_transition|crisis_sweep_execution|notification_crisis_dispatch_ledger|notification_crisis_provider_attempt|notification_crisis_escalation_obligation)\M'
       -- Branch (b): role-effective-read-capability check. has_table_privilege() with
       -- the current_user identity returns TRUE if the user has SELECT on the target
       -- relation, accounting for role membership inheritance. Checking any of the
       -- canonical crisis-domain tables/views catches the non-SECDEF helper-indirection
       -- bypass class (the role would have to read at least one of these to construct
       -- the helper function whose result the CTAS persists).
       OR has_table_privilege(current_user, 'public.crisis_event'::regclass, 'SELECT')
       OR has_table_privilege(current_user, 'public.crisis_event_lifecycle_transition'::regclass, 'SELECT')
       OR has_table_privilege(current_user, 'public.crisis_sweep_execution'::regclass, 'SELECT')                      -- R16 HIGH-1 closure 2026-05-21: parity with text-scan enumeration
       OR has_table_privilege(current_user, 'public.crisis_event_current_state_v'::regclass, 'SELECT')
       OR has_table_privilege(current_user, 'public.crisis_event_patient_summary_v'::regclass, 'SELECT')
       OR has_table_privilege(current_user, 'public.notification_crisis_dispatch_ledger'::regclass, 'SELECT')         -- R16 HIGH-1 closure 2026-05-21: parity with text-scan enumeration
       OR has_table_privilege(current_user, 'public.notification_crisis_provider_attempt'::regclass, 'SELECT')
       OR has_table_privilege(current_user, 'public.notification_crisis_escalation_obligation'::regclass, 'SELECT')
    THEN
        -- Break-glass-admin allowlist (matches §8.1 class H canonical set):
        SELECT EXISTS (
            WITH RECURSIVE breakglass_effective(rolname) AS (
                SELECT unnest(ARRAY[
                    'break_glass_procedure_owner',
                    'platform_operator_breakglass'
                ])::name
                UNION
                SELECT pg_get_userbyid(m.member)::name
                FROM pg_auth_members m
                JOIN pg_roles r ON r.oid = m.roleid
                JOIN breakglass_effective be ON be.rolname = r.rolname
            )
            SELECT 1 FROM breakglass_effective WHERE rolname = v_role::name
        ) INTO v_breakglass_allowed;

        IF NOT v_breakglass_allowed THEN
            -- R12 HIGH-1 closure + R15 ratifier Option B reversion 2026-05-21: use a
            -- DEDICATED user-defined SQLSTATE so class K can distinguish "trigger
            -- blocked CTAS" from "PG normal view permission check rejected
            -- (insufficient_privilege)". ERRCODE 'CR022' = SI-022 crisis provenance.
            -- Reverted from R14 categorical message → crisis-domain-reference message
            -- to match Option B trigger semantics (crisis-domain-only enforcement,
            -- not database-wide).
            RAISE EXCEPTION
                'crisis-view-ctas-provenance-block: role % is not in the canonical break-glass-admin allowlist and attempted % referencing a crisis-domain object (direct or via helper-function indirection caught by has_table_privilege); CTAS / SELECT INTO / CREATE MATERIALIZED VIEW on crisis-domain objects is REJECTED to prevent persistent rows outside the security boundary. Query text (forensic): %',
                v_role, TG_TAG, left(v_query, 200)
                USING ERRCODE = 'CR022';
        END IF;
    END IF;
END;
$$;

CREATE EVENT TRIGGER crisis_view_ctas_provenance_block
    ON ddl_command_start
    WHEN TAG IN ('CREATE TABLE AS', 'SELECT INTO', 'CREATE MATERIALIZED VIEW')
    EXECUTE FUNCTION crisis_view_ctas_provenance_block_fn();

ALTER FUNCTION crisis_view_ctas_provenance_block_fn() OWNER TO break_glass_procedure_owner;
REVOKE EXECUTE ON FUNCTION crisis_view_ctas_provenance_block_fn() FROM PUBLIC;
```

**R17 HIGH-1 + R18 HIGH-1 closure 2026-05-21 — function runs SECURITY INVOKER + locked search_path** (was SECURITY DEFINER in prior drafts; reverted because `current_user` inside a SECDEF function returns the function owner, NOT the DDL-issuing role, causing the break-glass allowlist to trivially pass for any caller and bypassing CR022 entirely). With SECURITY INVOKER, `current_user` inside the trigger = the actual DDL-issuing role (respecting SET ROLE semantics that class K relies on); both the break-glass allowlist check AND the has_table_privilege() capability checks now evaluate against the real DDL caller. Trigger does NOT require owner-level privileges (current_query() + has_table_privilege() + pg_auth_members traversal all work under invoker privileges). Owner assignment to `break_glass_procedure_owner` is preserved for ALTER/DROP control but does NOT affect runtime authorization. `current_query()` returns the original statement text including the CTAS body so a regex on crisis-domain object names is the safe inspection vector at `ddl_command_start` (pg_event_trigger_ddl_commands() is unavailable at start phase per PostgreSQL docs). Trigger is enabled before Phase 7 view creation runs. **§8.1 class K secondary assertion expanded (R9 HIGH-1 closure 2026-05-21) to BEHAVIORALLY verify the trigger blocks CTAS** — not just existence/enabled — by attempting a representative CREATE MATERIALIZED VIEW against a crisis view under a synthetic non-breakglass test role + asserting it raises the **dedicated SQLSTATE `CR022`** (R12 HIGH-1 closure — NOT generic `insufficient_privilege`, which would conflate trigger-fire with PG-normal-permission-rejection and create false-positives per the R12 analysis). CTAS / SELECT INTO copies of crisis views are blocked at DDL time AND verified blocked at preflight time.
7.1.a. **Phase 7.1.a — Synthetic preflight test role + scratch schema + executor membership (R9 HIGH-1 + R10 HIGH-1 + R11 HIGH-1 addendum 2026-05-21):**
  (1) Create `crisis_ctas_preflight_test_role` with `NOLOGIN`; do NOT grant membership in any canonical **reader/admin/wrapper-owner** role (the role MUST remain isolated from crisis-domain privileges so the behavioral probe can only succeed via the event-trigger-block path).
  (2) Create a dedicated durable scratch schema `crisis_preflight_scratch` owned by `crisis_ctas_preflight_test_role`; grant CREATE + USAGE on that schema to the test role. **R10 HIGH-1 catalog correction:** `pg_temp` is NOT a valid target for `CREATE MATERIALIZED VIEW` (materialized views are durable persistent relations; temporary schemas only accept temporary tables/indexes/sequences); using `pg_temp` would cause the behavioral probe to fail with `invalid_schema_name` BEFORE the event trigger has a chance to raise `insufficient_privilege`. The dedicated `crisis_preflight_scratch` schema is the correct probe target.
  (3a) **R12 HIGH-1 + R13 HIGH-2 closure 2026-05-21:** the GRANT SELECT on the staff view to the test role CANNOT execute in Phase 7.1.a — the view doesn't exist until Phase 7. The grant is therefore split out and executed as **Phase 7.2** (new substep) immediately after Phase 7 creates `crisis_event_current_state_v` and sets its owner + reader-role grants. See Phase 7.2 below for the executable `GRANT SELECT ON public.crisis_event_current_state_v TO crisis_ctas_preflight_test_role;` step. The Phase 7.1.a substep here is reduced to documenting the GRANT requirement; the actual grant lives in Phase 7.2 to preserve correct DDL ordering. This minimal grant does NOT make the test role a canonical reader (no membership in `crisis_event_staff_reader`; class H + G.2 + G.3 assertions are unaffected because they target reader-role membership/grants, not the test role's isolated direct grant); it only ensures the §8.1 class K behavioral probe reaches the event-trigger evaluation path. The dedicated SQLSTATE `CR022` on trigger raise (vs generic `insufficient_privilege`) provides defense-in-depth — even if a future change accidentally revoked the Phase 7.2 grant, class K would surface a clear `crisis-view-ctas-preflight-permission-check-intercept` error pointing to Phase 7.2 rather than silently false-positive.
  (3) **R11 HIGH-1 closure 2026-05-21: GRANT preflight-executor membership in the test role so SET ROLE succeeds.** PostgreSQL `SET ROLE` requires the session user to have been granted membership in the target role (unless superuser). The canonical preflight executor in this amendment is the migration-runner role that executes the §8.1 DO block — at v1.10 this is the existing canonical `cdm_owner` role established at P-032 (the same role that performs the tables-first-views-last cdm_owner seeding pattern per P-036 R6). Therefore execute: `GRANT crisis_ctas_preflight_test_role TO cdm_owner;` so cdm_owner can SET ROLE to the test role during preflight. The reverse — making cdm_owner a member of any reader role — is explicitly NOT done (the membership flows one-way: cdm_owner gains the ability to assume the test role's no-privilege identity for the probe, but the test role does NOT inherit any cdm_owner privileges by virtue of this grant; PostgreSQL role-membership grants are one-way INTO the granted-from role's identity). Class H + G.2 recursive-membership-closure assertions remain unchanged because the test role is still not a member of any canonical reader/admin/wrapper-owner role.
  (4) The scratch schema is sized for at most one probe MV per preflight run (the probe MV is dropped inside the same preflight subtransaction; any orphan MV from a crashed preflight is cleaned up at the beginning of the §8.1 class K probe via DROP MATERIALIZED VIEW IF EXISTS).

The role + schema + cdm_owner membership grant exist exclusively for §8.1 class K behavioral assertion (which uses `SET LOCAL ROLE crisis_ctas_preflight_test_role` to attempt a CREATE MATERIALIZED VIEW in `crisis_preflight_scratch` from a crisis view and verifies the event trigger blocks it). Created at Phase 7.1.a alongside the event trigger so the behavioral preflight assertion always has its test principal AND its probe target AND its SET-ROLE precondition satisfied.

7. **Phase 7 — Views (LAST per P-036 R6; R2 HIGH-2 closure 2026-05-21: create BOTH split views with their respective owner/grant pairs):** Create `crisis_event_current_state_v` (staff tenant-wide reader) with `security_invoker=true, security_barrier=true`; set ownership to `crisis_event_current_state_view_owner`; `REVOKE ALL ON crisis_event_current_state_v FROM PUBLIC`; `GRANT SELECT ON crisis_event_current_state_v TO crisis_event_staff_reader`. Create `crisis_event_patient_summary_v` (patient/delegate self-scoped reader) with `security_invoker=true, security_barrier=true`; set ownership to `crisis_event_patient_summary_view_owner`; `REVOKE ALL ON crisis_event_patient_summary_v FROM PUBLIC`; `GRANT SELECT ON crisis_event_patient_summary_v TO crisis_event_patient_reader`. **DO NOT grant the retired `crisis_event_reader` role** (it does not exist post-R1 HIGH-2 split per §7); **DO NOT grant the staff view to patient/delegate principals**. The §8.1 preflight DO block (assertion classes A + F + G) verifies the resulting roles, view security_invoker flags, AND the SELECT grants on the views match the split-reader model (NOT just role/reloption existence — actual grant matrix verified).
7.2. **Phase 7.2 — Behavioral preflight minimal SELECT grant (R12 HIGH-1 + R13 HIGH-2 closure 2026-05-21; ordered AFTER Phase 7 view creation):** the GRANT SELECT on the staff view to `crisis_ctas_preflight_test_role` (per Phase 7.1.a step (3a) requirement) MUST execute AFTER Phase 7 creates `crisis_event_current_state_v`. Phase 7.1.a documents the requirement; this Phase 7.2 step executes:

```sql
GRANT SELECT ON public.crisis_event_current_state_v TO crisis_ctas_preflight_test_role;
```

This grant exists exclusively to enable the §8.1 class K behavioral preflight probe to reach the event-trigger evaluation path (without it, PG's normal view permission check would reject the CTAS before the trigger evaluates — false-positive shape per R12 HIGH-1). The grant is captured by class G.1 allowlist (test role is enumerated as a permitted grantee alongside `crisis_event_staff_reader` + `crisis_event_current_state_view_owner`). Test role does NOT gain `crisis_event_staff_reader` membership — classes H + G.2 + G.3 unaffected.

8. **Phase 8 — JWT migration entity seed (R4 HIGH-3 closure 2026-05-21: 5 rows, NOT 4 — both derived views are JWT-bound boundaries):** INSERT 5 rows into `jwt_migration_entity_status` for the 3 net-new tables + 2 derived views (`crisis_event_current_state_v` + `crisis_event_patient_summary_v`) with `phase_4_cutover_eligible=FALSE` + `raw_guc_fallback_audited=TRUE` defaults.
9. **Phase 9 — Audit events registration:** Insert the 12 new `crisis.*` action IDs into the canonical `audit_events_action_definition` table per AUDIT_EVENTS v5.12 schema; verify CHECK constraint accepts the new action IDs (no schema CHECK enumeration change required if AUDIT_EVENTS v5.11→v5.12 was an additive enum extension, which is the established pattern).
10. **Phase 10 — Deployment preflight gate:** Run the §8.1 DO block. Any FAILED assertion BLOCKS cutover. Roll back via `BEGIN; <undo>; COMMIT;` on a per-phase basis if any assertion fails; do NOT proceed to Phase 11.
11. **Phase 11 — OpenAPI endpoint deployment:** Deploy the 6 net-new endpoints under `/v1/crisis/*` via the canonical route-deploy gate. Endpoint 6 (`/v1/crisis/resources`) MUST be registered with the canonical IP-rate-limit middleware at 60 req/min on the unauthenticated path; do NOT register the unauthenticated path without the rate-limit middleware.

### §8.3 — Rollback discipline

On any Phase N failure during cutover, rollback discards Phase N's changes via the transaction context; Phases 1–(N–1) remain. If post-deploy a Phase ≤ 10 defect is detected, a fresh hygiene-cycle PR (P-040.1 pattern matching P-009 v1.10.1 hygiene cycle) closes the defect via additive correction; do NOT attempt destructive rollback of canonical schema once Phase 11 has completed (the OpenAPI endpoints may have served production traffic; rollback would require coordinated data-migration + audit-trail preservation).

---

## 9. Cycle log

**v0.1 DRAFT 2026-05-21:** pre-Codex-review skeleton. Contains §1 purpose + scope + §2 new entities (3 net-new + 3 additive column extensions to P-027 §4.66-4.68 + 1 OPTIONAL derived view) with executable DDL. §3-8 are stubs to be filled in v0.2 against SI-022 §3/§5/§7 normative content. Authored on `spec/P-040-cdm-v1.10-si-022-follow-on-2026-05-21` branch off main at `520565a` (post-P-039 merge). Commit `2f88322`.

**v0.2 DRAFT 2026-05-21:** §4 audit events normative table filled in vs SI-022 v1.0 §3 normative content; §5 OpenAPI 6 endpoints filled in vs SI-022 v1.0 §5; §6 state machine 11 transition triples filled in vs SI-022 v1.0 §6 (post-R8+R11 expansion). §1 AUDIT_EVENTS scope reconciled: per-row category labels (7 Cat A + 0 Cat B + 5 Cat C; total 12) are authoritative; SI-022 v1.0 §3 summary tally drift ("8 Cat A + 4 Cat C") flagged for downstream prose-correction PR after P-040 lands. §3 (procedures), §7 (RBAC), §8 (preflight) remain stubs to be filled in v0.3. Commit `90d8387`.

**v0.21 DRAFT 2026-05-21 — R18 closure applied (1 HIGH):**
- **R18 HIGH-1 closed:** v0.20 fixed the executable trigger DDL (SECURITY DEFINER → SECURITY INVOKER) but Phase 7.1 NORMATIVE PROSE still said SECURITY DEFINER + generic `insufficient_privilege` — implementer following phase text rather than SQL snippet could recreate the R17 bug AND SQLSTATE mismatch conflicts with class K behavioral check expecting CR022. Fix: rewrote Phase 7.1 prose to state SECURITY INVOKER, explain current_user is the DDL-issuing role under invoker semantics, explain owner assignment is for ALTER/DROP control only, replace `insufficient_privilege` with `CR022`. Prose now consistent with v0.20 executable trigger.

**v0.20 DRAFT 2026-05-21 — R17 closure applied (1 HIGH):**
- **R17 HIGH-1 closed:** trigger declared SECURITY DEFINER + used `current_user`; PG semantic returns function OWNER inside SECDEF (not DDL issuer), so break-glass allowlist trivially passed for any caller; trigger silently skipped CR022; non-breakglass callers bypassed entirely (genuine correctness defect, not theoretical). Fix: changed `SECURITY DEFINER` → `SECURITY INVOKER` so `current_user` = actual DDL caller (respecting SET ROLE semantics class K relies on). Trigger doesn't need owner privileges (current_query + has_table_privilege + pg_auth_members all work under invoker). Locked search_path preserved. Owner kept for ALTER/DROP control.

**v0.19 DRAFT 2026-05-21 — R16 closure applied (1 HIGH):**
- **R16 HIGH-1 closed:** trigger capability branch enumerated only 6 has_table_privilege() checks but the text-scan enumerated 8 crisis-domain objects — `crisis_sweep_execution` + `notification_crisis_dispatch_ledger` omitted from capability branch despite appearing in text-scan regex. Bypass: non-breakglass role with SELECT on omitted relation could create non-SECDEF helper reading it + CTAS `SELECT * FROM helper_fn()`. NOT the accepted SECDEF wrapper residual; a gap in the ratified Option B implementation. Fix: added 2 missing has_table_privilege() checks; capability branch now enumerates all 8 crisis-domain objects matching the text-scan exactly.

**v0.18 DRAFT 2026-05-21 — R15 RATIFIER DISPOSITION (Option B; hard-floor item 6 DISSOLUTION):**
- **R15 finding:** Codex flagged the v0.17 R14 categorical CTAS block as database-wide DDL policy change exceeding P-040 SI-022-follow-on scope → hard-floor item 6 platform-floor invariant trigger per CLAUDE.md.
- **Escalation discipline followed:** STOPPED inline closure at v0.17 commit `0d0cdcc`; authored ERR at `Telecheck_v1_10_PRD_Update/Engineering-Review-Request-P-040-R15-CTAS-Categorical-Block-Scope-2026-05-21.md` (commit `ee1bab5`); ran Codex Pass-1 source-first independent consult (recommended B-prime); ran Codex Pass-2 contrast-and-synthesize (confirmed B-prime as ratification-hardened B); surfaced three-way to Evans (Claude=B, Pass-1=B-prime, Pass-2=B-prime).
- **Ratifier decision:** Evans chat-message ratification 2026-05-21 = **"B"** (plain Option B, NOT B-prime).
- **Implementation per ratified Option B:** (a) trigger function body reverted to v0.16 dual-detection (text-scan + has_table_privilege() capability check); (b) RAISE EXCEPTION message reverted to crisis-domain-reference framing; (c) accepted residual SECDEF wrapper indirection risk documented in trigger comment + §9 cycle log — bounded at v1.10 (6 §3 canonical wrappers return VOID/uuid + EXECUTE-restricted); (d) Track 6 follow-on "Crisis Data Provenance Hardening v2" recommended (not mandatory per plain-B selection); (e) §8.1 classes A through M + Phase 7.1/7.1.a/7.2 preflight discipline ALL preserved unchanged.
- **Precedent:** R15 hard-floor item 6 DISSOLUTION matches P-038 R6 dissolution pattern — Codex Option B recommendation adopted; closure path REMOVED the architectural-judgment trigger condition rather than escalating a net-new platform-floor primitive. Second instance of hard-floor item 6 DISSOLUTION in Q2 2026 (P-038 R6 + P-040 R15).

**v0.17 DRAFT 2026-05-21 — R14 closure applied (1 HIGH):**
- **R14 HIGH-1 closed:** v0.16 dual-detection (text-scan OR has_table_privilege capability) authorized via the CTAS caller's properties; SECDEF wrapper indirection defeated both — caller has no direct crisis SELECT, CTAS text only names wrapper, wrapper-owner reads crisis data under its own privileges AFTER ddl_command_start fires → CR022 silent. Resolving referenced functions + walking bodies for SECDEF/crisis access at trigger time is brittle. Fix: replaced detection-based block with **CATEGORICAL block** — trigger rejects ALL CTAS / SELECT INTO / CREATE MV from non-breakglass roles regardless of statement content. Strictly stronger; no detection logic to bypass; no indirection chain to chase. Trigger v_query preserved in exception message for forensics, not for authorization.

**v0.16 DRAFT 2026-05-21 — R13 closures applied (2 HIGH):**
- **R13 HIGH-1 closed:** CTAS event trigger text-scan only — function-indirection bypass via non-SECDEF helper. Fix: trigger extended with DUAL detection — text scan OR `has_table_privilege(current_user, ...)` capability check on 6 canonical crisis-domain tables/views; either branch firing raises CR022. has_table_privilege accounts for role inheritance.
- **R13 HIGH-2 closed:** Phase 7.1.a step (3a) GRANT SELECT executed BEFORE Phase 7 created the view — `relation does not exist` blocks cutover. Fix: moved grant to new Phase 7.2 immediately after Phase 7 view creation; Phase 7.1.a documents requirement + cross-references Phase 7.2 for executable grant.

**v0.15 DRAFT 2026-05-21 — R12 closure applied (1 HIGH):**
- **R12 HIGH-1 closed:** behavioral CTAS probe false-positive — test role lacks SELECT on staff view → PG rejects CTAS with generic `insufficient_privilege` before event trigger fires → class K reads as "trigger blocked" (false positive); stubbed trigger passes. Fix: (a) Phase 7.1 trigger raises with dedicated user-defined SQLSTATE `CR022` (5-char user code reserved for SI-022 provenance) instead of generic insufficient_privilege; (b) class K WHEN clause `WHEN SQLSTATE 'CR022'` — asserts EXACT trigger errcode; explicit `WHEN insufficient_privilege` branch raises clear `crisis-view-ctas-preflight-permission-check-intercept` error; (c) Phase 7.1.a added step (3a) — minimal `GRANT SELECT ON crisis_event_current_state_v TO crisis_ctas_preflight_test_role` so PG view-perm check passes + trigger is SOLE gating mechanism (no reader-role membership granted); (d) class G.1 allowlist extended to include test role as permitted grantee. Dedicated SQLSTATE = defense-in-depth: revoked grant surfaces clear error, not silent false-positive.

**v0.14 DRAFT 2026-05-21 — R11 closure applied (1 HIGH):**
- **R11 HIGH-1 closed:** behavioral CTAS preflight `SET LOCAL ROLE` would fail under least-privileged migration posture — test role isolated from canonical privileges but never granted TO preflight executor; PG `SET ROLE` requires membership; SET ROLE's `insufficient_privilege` would be misread by class K as "trigger fired" (false positive). Fix: (a) Phase 7.1.a step (3) added `GRANT crisis_ctas_preflight_test_role TO cdm_owner`; one-way membership doesn't grant cdm_owner privileges to test role; G.2/H recursive closures unaffected. (b) Class K added explicit `pg_has_role(current_user, v_test_role, 'MEMBER')` precondition check before SET ROLE; clear actionable error if GRANT missed; disambiguates "SET ROLE failed" from "trigger blocked".

**v0.13 DRAFT 2026-05-21 — R10 closure applied (1 HIGH):**
- **R10 HIGH-1 closed:** behavioral CTAS preflight probe targeted `pg_temp` for CREATE MATERIALIZED VIEW — `pg_temp` is not a valid target for MVs (MVs are durable; only TABLE/INDEX/SEQUENCE can be temporary); probe would fail with `invalid_schema_name` before event trigger could raise `insufficient_privilege`; class K rejects any non-insufficient_privilege exception → correct trigger could still fail deploy gate. Fix: (a) Phase 7.1.a extended to create durable scratch schema `crisis_preflight_scratch` owned by test role with explanatory note; (b) class K probe target changed pg_temp → crisis_preflight_scratch so MV creation is structurally permitted; (c) added defensive cleanup DROP MV IF EXISTS before+after probe; (d) added scratch-schema-existence assertion to class K matching test-role-existence assertion.

**v0.12 DRAFT 2026-05-21 — R9 closure applied (1 HIGH):**
- **R9 HIGH-1 closed:** Phase 7.1 CTAS event-trigger spec referenced `pg_event_trigger_ddl_commands()` at `ddl_command_start` — that function is only available at `ddl_command_end`; trigger as written was non-implementable. Class K secondary only checked trigger existence + enabled, so a stub could pass while CTAS still succeeded. Fix: (a) rewrote Phase 7.1 with executable trigger DDL using `current_query()` text inspection (correct mechanism at `ddl_command_start`); SECURITY DEFINER + locked search_path; command-tag filter via WHEN TAG IN; recursive break-glass-admin allowlist via WITH RECURSIVE pg_auth_members. (b) Added Phase 7.1.a — synthetic `crisis_ctas_preflight_test_role` NOLOGIN role for behavioral preflight. (c) Class K behavioral assertion expanded — SET LOCAL ROLE then attempts CREATE MATERIALIZED VIEW from staff view; expects `insufficient_privilege`; rejects on no-exception or wrong-errcode. Behavioral verification proves trigger actually rejects.

**v0.11 DRAFT 2026-05-21 — R8 closures applied (2 HIGH):**
- **R8 HIGH-1 closed:** class K had inverted pg_depend traversal (refobjid/objid swapped) — missed every real derived view/MV; CTAS tables additionally have no pg_depend edge. Fix: rewrote class K with correct catalog graph (source view → pg_depend → pg_rewrite → dependent pg_class); narrowed relkind to {m,v,f}; added §8.2 Phase 7.1 DDL event trigger `crisis_view_ctas_provenance_block` rejecting CTAS/SELECT INTO/CREATE MV that references crisis-domain objects; class K secondary assertion verifies trigger exists + enabled.
- **R8 HIGH-2 closed:** no view-definition integrity assertion — drifted patient view with same name/owner/reloptions/grants but different body (missing self-scoping predicate) would pass all prior checks. Fix: added §8.1 class (M) — pg_get_viewdef() text scan asserting patient view references verify_session_jwt_and_extract_claims + consent_grant + emergency_contact_share + verified_patient_id (positive) + does NOT reference staff view name (negative cross-reference); staff view body asserted to reference the canonical 3 source tables.

**v0.10 DRAFT 2026-05-21 — R7 closures applied (3 HIGH):**
- **R7 HIGH-1 closed:** class I pg_depend SECDEF check missed dynamic SQL via EXECUTE / dblink / postgres_fdw. Fix: added §8.1 class (J) — prosrc text scan of ALL SECDEF routines for static references to crisis-domain objects (views + base tables + dblink + postgres_fdw); rejects non-allowlisted matches (allowlist = the 6 §3 canonical procedures); PUBLIC EXECUTE rejection on ANY SECDEF routine with crisis-domain prosrc reference.
- **R7 HIGH-2 closed:** no check for derived persistent copies — materialized views / other relations populated from crisis views could persist tenant-wide rows outside the security boundary. Fix: added §8.1 class (K) — pg_depend scan rejecting any pg_class.relkind ∈ {m, v, r, f} depending on either crisis view's rewrite rule unless on canonical allowlist (empty at v1.10).
- **R7 HIGH-3 closed:** view-owner relowner not asserted — Phase 7 specified canonical owners but preflight only checked reloptions + grants; ALTER VIEW ... OWNER TO noncanonical would pass. Fix: added §8.1 class (L) — pg_class.relowner exact-match assertion for each crisis view + owner-attribute assertion (canonical view-owner roles MUST be NOLOGIN + non-BYPASSRLS).

**v0.9 DRAFT 2026-05-21 — R6 closures applied (2 HIGH):**
- **R6 HIGH-1 closed:** preflight ignored predefined PG14+ pg_read_all_data + BYPASSRLS attribute — a principal granted either can SELECT public views without explicit grant or reader-role membership, bypassing G.1+G.2. Same R1 HIGH-2 bypass class through predefined-role inheritance. Fix: added §8.1 assertion class (H) — recursive effective-member closure for pg_read_all_data (vacuous-pass on PG13-) + BYPASSRLS attribute check; both restricted to canonical break-glass-admin allowlist; application runtime roles MUST NOT hold either.
- **R6 HIGH-2 closed:** SECURITY DEFINER routines depending on crisis views weren't checked — a SECDEF function owned by staff_reader/admin EXECUTE-granted to PUBLIC/patient/delegate would re-expose tenant-wide view rows to non-canonical callers regardless of grant-matrix. Fix: added §8.1 assertion class (I) — pg_depend-based check rejecting any SECDEF routine that depends on either crisis view unless on canonical-allowlist (empty at v1.10; future additions require ratifier sign-off). Also rejects PUBLIC EXECUTE on the 6 §3 canonical crisis procedures.

**v0.8 DRAFT 2026-05-21 — R5 closures applied (2 HIGH + 1 MED):**
- **R5 HIGH-1 closed:** G.2 depended on undefined `public.tenant_role_resolution` table — non-implementable; deploy would fail `relation does not exist` before the assertion ran. Fix: replaced dependency with hardcoded canonical-member allowlist constants (`v_canonical_staff_effective` + `v_canonical_patient_effective` arrays) in the DO block; no net-new schema artifact required; deployment-bound constants updateable inline.
- **R5 HIGH-2 closed:** G.2 only checked one-hop direct members — a role granted membership in `tenant_clinician` (which is member of staff_reader) inherits staff-view transitively without showing as direct member; same R4 HIGH-1 bypass class. Fix: rewrote G.2 with 3 WITH RECURSIVE CTEs over pg_auth_members starting from each reader role + cross-membership check; recursive closure terminates because pg_auth_members forbids cycles.
- **R5 MED-1 closed:** §7 RBAC heading still said "+13 net-new roles" + "Application roles (6)" — exact drift R4 was supposed to close. Fix: §7 heading rewritten to "+15 net-new roles" + "Application roles (7)" with R5 MED-1 reconciliation note.

**v0.7 DRAFT 2026-05-21 — R4 closures applied (3 HIGH):**
- **R4 HIGH-1 closed:** grant allowlist (G.1) missed role-membership inheritance bypass — any role made MEMBER of crisis_event_staff_reader or crisis_event_patient_reader inherits view privilege via pg_auth_members without appearing in role_table_grants. Fix: added (G.2) role-membership closure assertion validating canonical-member sets resolved from `tenant_role_resolution`; rejects non-canonical members + cross-membership (a role member of both readers would inherit both views). Added (G.3) WITH GRANT OPTION rejection on view SELECT grants + ADMIN OPTION rejection on reader-role membership (would let downstream re-grant defeating allowlist).
- **R4 HIGH-2 closed:** §1 RBAC scope summary still said "13 new role definitions" with retired crisis_event_reader + 1 view owner — top-level scope contract drift; implementer following §1 could recreate the v0.3 vulnerability. Fix: rewrote §1 RBAC scope to enumerate all 15 net-new roles explicitly matching §7 + §8.2 Phase 1 + §8.1 class A; retired crisis_event_reader explicitly removed.
- **R4 HIGH-3 closed:** jwt_migration_entity_status seed scope listed only 4 entries (3 tables + staff view); patient-summary view absent despite being JWT-bound via verify_session_jwt_and_extract_claims() predicate — version-skew risk on the more sensitive self-scoped read path. Fix: §1 + §8.1 class B + §8.2 Phase 8 all updated from "4 entries" → "5 entries" including `crisis_event_patient_summary_v` with canonical defaults.

**v0.6 DRAFT 2026-05-21 — R3 closures applied (2 HIGH):**
- **R3 HIGH-1 closed:** §8.1 assertion class (G) was a 5-point check (2 cross-grant negatives + 1 retired-role negative + 2 positive) that missed PUBLIC or any other arbitrary role grant — a manual `GRANT SELECT ON crisis_event_current_state_v TO PUBLIC` would pass while exposing the staff view to all callers. Fix: replaced point checks with a TRUE ALLOWLIST query — any SELECT grant on either crisis view outside the canonical grantee pair (staff_reader + staff_view_owner for staff view; patient_reader + patient_summary_view_owner for patient view) raises `crisis-view-grant-allowlist-violation`. PUBLIC, legacy roles, application roles, ad-hoc manual grants all caught. Both intended positives preserved as separate positive assertions so allowlist isn't satisfied vacuously by zero-grants.
- **R3 HIGH-2 closed:** §8.2 Phase 1 still said "Create the 13 net-new RBAC roles" — stale from pre-R1 HIGH-2 split. Migration could omit a split role + fail later or recreate retired-role pattern. Fix: rewrote Phase 1 to require all 15 net-new roles enumerated explicitly (1)–(15) with cross-reference to §7 + §8.1 class A; explicit assertion that retired crisis_event_reader MUST NOT be created.

**v0.5 DRAFT 2026-05-21 — R2 closures applied (2 HIGH):**
- **R2 HIGH-1 closed:** §5 OpenAPI table still routed `/v1/crisis/mine` to the tenant-wide staff view `crisis_event_current_state_v` with endpoint-side JWT predicate — the EXACT v0.3 R1 HIGH-2 vulnerability shape; implementation could bind patient/delegate traffic to tenant-wide view + rely on application filtering. Fix: rewrote endpoint 2 row to read `crisis_event_patient_summary_v` EXCLUSIVELY + require `crisis_event_patient_reader` role; rewrote endpoint 1 row to enforce `crisis_event_staff_reader` role requirement; explicit prose that DB privilege boundary prevents accidental cross-grant.
- **R2 HIGH-2 closed:** §8.2 Phase 7 still created only `crisis_event_current_state_v` + granted to retired `crisis_event_reader` role; migration would fail (role doesn't exist post-split) or recreate broad-reader exposure. Fix: rewrote Phase 7 to create BOTH views with `security_invoker=true, security_barrier=true`, set both owners, REVOKE ALL FROM PUBLIC, GRANT split per the canonical role pair; explicit DO NOT grant to retired role. Added §8.1 preflight assertion class (G) with 5 grant-matrix checks (2 cross-grant negatives + 1 retired-role negative + 2 intended-positive grants) verifying actual SELECT grants match the split-reader model.

**v0.4 DRAFT 2026-05-21 — R1 closures applied (3 HIGH):**
- **R1 HIGH-1 closed:** added §8.1 preflight assertion class (E0a/b/c) checking that all existing P-027 dispatch_ledger + provider_attempt + escalation_obligation rows have either crisis_event_id set OR resolvable via (tenant_id, server_signal_id) → crisis_event.id lookup BEFORE Phase 3 NOT NULL ALTER; deploy MUST author legacy-source synthesis migration if any orphan rows exist. Day-1 pilot tenants pass trivially (zero existing rows); assertion is defense-in-depth for future environment migrations.
- **R1 HIGH-2 closed:** split crisis_event_reader role into crisis_event_staff_reader (tenant-wide; clinician/care-team/admin) + crisis_event_patient_reader (self-scoped; patient/delegate); added §4.NEW4a crisis_event_patient_summary_v view with verify_session_jwt_and_extract_claims() + consent_grant predicate enforcing per-row visibility to caller's own patient_id OR delegated patient_ids only. Three-layer enforcement (RBAC role split + view predicate + tenant RLS). RBAC net-new count 13 → 15. P-038 R5 HIGH-1 pattern application.
- **R1 HIGH-3 closed:** corrected view DDL from WITH (security_barrier=true) to WITH (security_invoker = true, security_barrier = true) on both views; added §8.1 preflight assertion class (F) verifying both views have security_invoker=true in pg_class.reloptions after CREATE VIEW. Without security_invoker the view would have bypassed caller-scoped RLS by running under owner privileges.

**v0.3 DRAFT 2026-05-21:** §3 procedures fully detailed: 6 SECURITY DEFINER procedures (1 raw `record_crisis_event_lifecycle_transition()` writer + 5 wrapper procedures `record_crisis_initiation` / `_acknowledgement_claim` / `_response` / `_resolution` / `execute_crisis_no_acknowledgement_sweep`); raw writer DDL with explicit EXECUTE-grants restricted to exactly the 5 wrapper-owner roles (anti-bypass discipline per P-034 + P-038); wrapper signatures + behavior contracts referencing SI-022 R34/R35/R36/R10/R11/R13 + R28/R39/R46/R47/R51/R53/R60/R63/R64 closure points. §7 RBAC fully enumerated: 13 net-new roles split as 6 application + 5 wrapper-owner + 1 raw-writer-owner + 1 view-owner. §8 deployment preflight contains a complete `DO $$ ... $$;` block with 5 assertion classes (RBAC roles exist + JWT migration seed rows + Part A every-tenant config + Part B regulatory_reporting=true config + Part C emergency_contact_consent_enabled=true config); §8.2 cutover sequencing enumerates 11 phases (RBAC → tables → backfill → triggers → RLS → procedures → views LAST per P-036 R6 → JWT seed → audit events → preflight DO block → OpenAPI endpoints last); §8.3 rollback discipline. Document is now complete and ready for first Codex adversarial review round.
