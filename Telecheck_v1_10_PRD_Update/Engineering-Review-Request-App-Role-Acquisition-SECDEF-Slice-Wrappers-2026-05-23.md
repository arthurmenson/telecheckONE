# Engineering Review Request — Application-Role Acquisition of Slice SECDEF Wrapper / Reader Privileges

**Status:** OPEN — ratifier decision required (hard-floor item 6 escalation)
**Date authored:** 2026-05-23
**Author:** Claude (Opus 4.7) — remote-cron autonomous firing
**Scope:** Cross-slice foundation decision affecting Crisis Response (SI-022), Admin Backend Basics (SI-023), and Med-Interaction (SI-019) — every slice whose DB layer uses the SECURITY DEFINER wrapper + dedicated `NOLOGIN NOBYPASSRLS` application-role pattern.
**Artifact type:** Engineering Review Request (ERR) per CLAUDE.md autonomous-work discipline §"Hard floor item 6"
**Codex dual-recommendation status:** **DEFERRED — Codex unavailable in this execution environment** (no `OPENAI_API_KEY`, no `codex` binary; the CLAUDE.md companion-script path `C:/Users/menso/...` is Windows-only and not present on this Linux container). The mandatory two-pass Codex consult (Pass-1 source-first independent + Pass-2 contrast-and-synthesize) **has not been run**. Per the auto-proceed rule, the agreement gate **cannot be evaluated** without Codex Pass-2; this escalation STOPS for Evans's explicit chat-message ratification regardless of convergence (and hard-floor item 6 would require Evans's confirmation even with Codex agreement).

---

## 1. Summary

The Crisis Response and Admin Backend DB layers are **complete and Codex-reviewed** (crisis migrations 032–045; admin migrations 039–044). Their Sprint 2 application-layer handlers are the next genuinely-actionable critical-path items. But wiring those handlers exposes an **undecided foundation question that no merged migration answers**:

> **How does the application's login role (`telecheck` → `telecheck_app_role`) acquire the privilege to EXECUTE the slice SECDEF wrappers and SELECT the slice reader views?**

The wrappers `REVOKE EXECUTE … FROM PUBLIC` and `GRANT EXECUTE … TO <slice_application_role>` only. The reader views `GRANT SELECT … TO <slice_reader_role>` only. **`telecheck_app_role` is not a member of any slice role, and no migration grants it the privilege directly.** A handler calling `record_crisis_initiation(...)` as `telecheck_app_role` today fails with `permission denied for function record_crisis_initiation`.

This is the long-standing foundation gap explicitly flagged in `migrations/003_rls_helpers.sql:164`:

```
-- SPEC ISSUE: Grant to telecheck_app_role when 006_roles.sql lands.
```

`006_roles.sql` never landed (migration 006 is `forms_intake`). The MATURE slices (forms-intake, pharmacy, consent) sidestepped it by using **direct RLS** as `telecheck_app_role` with no SECDEF wrappers and no slice roles. Crisis Response, Admin Backend, and Med-Interaction are the **first** slices to use the SECDEF-wrapper + dedicated-application-role pattern, so they are the first to require a decision.

Choosing the acquisition mechanism (broad INHERIT membership vs per-transaction `SET ROLE` elevation vs direct grant vs per-slice login role) establishes a **net-new role-elevation platform-floor primitive** with cross-slice blast radius — CLAUDE.md hard-floor item 6 discriminator (c) ("net-new platform-floor primitives … role-elevation patterns …"). Claude does not decide it inline.

## 2. Affected roles (the privilege surface to be acquired)

| Slice | Role | Privilege held by the role | Granted in |
|---|---|---|---|
| Crisis | `crisis_initiator` | EXECUTE `record_crisis_initiation(...)` | 036 |
| Crisis | `crisis_acknowledger` | EXECUTE `record_crisis_acknowledgement_claim` / `record_crisis_response` / `record_crisis_resolution` | 037 |
| Crisis | `crisis_event_staff_reader` | SELECT `crisis_event_current_state_v` + base tables | 034 |
| Crisis | `crisis_event_patient_reader` | SELECT `crisis_event_patient_summary_v` (self-scoped) | 034 |
| Crisis | sweep EXECUTE grantee (operator) | EXECUTE `execute_crisis_no_acknowledgement_sweep(...)` | 038 |
| Admin | `admin_basic_operator` | EXECUTE `submit_forms_template_for_admin_review` + dashboard read wrappers | 043 / 044 |
| Admin | `admin_template_reviewer` | EXECUTE `record_forms_template_admin_decision` | 043 |
| Med-Interaction | application + wrapper-owner role family | EXECUTE on its lifecycle wrappers | 046–050 (also subject to the separate role-name reconciliation ERR, 2026-05-23) |

**All slice roles are `NOLOGIN NOBYPASSRLS`** (verified: crisis 032:73–105; admin 039:51–57). This attribute is load-bearing for Option B below: a `SET ROLE` into a `NOBYPASSRLS` role does **not** bypass RLS, so it does not trip the migration 003:380 caution (`-- Never bypass RLS via SET SESSION AUTHORIZATION or SET ROLE without a corresponding break-glass audit record per I-024.`), which targets RLS-*bypassing* role changes specifically.

## 3. Why this blocks every SECDEF-slice handler PR

- **Crisis Response Sprint 2** (`POST /v0/crisis-events`, `…/:id/acknowledge`, `GET /v0/crisis-events/:id`) — handlers must EXECUTE `record_crisis_initiation` / `record_crisis_acknowledgement_claim` and SELECT the two reader views.
- **Admin Backend Sprint 2** (`submit`, `decision`, `crisis-dashboard`) — handlers must EXECUTE the admin wrappers.
- **Med-Interaction PR 7+** (Fastify handlers) — EXECUTE its lifecycle wrappers (additionally gated on the separate role-name reconciliation ERR).

None can ship until the acquisition mechanism is ratified. The actor-context binding (`withActorContext`, SI-010, migration 031) and tenant binding (`set_tenant_context`, migration 003) are **already wired** in `authContextPlugin` — the *only* missing piece is role privilege.

## 4. The options

| Option | Mechanism | Least-privilege at role layer | Touches merged-migration verification gates? | App-code change | New foundation migration |
|---|---|---|---|---|---|
| **A** | **INHERIT membership.** New migration `GRANT <all slice roles> TO telecheck_app_role` (telecheck_app_role keeps default INHERIT). App passively holds the union of all slice privileges on every connection. | NO — app role becomes a superset of all slice privileges, always-on | NO (membership ≠ direct grantee; "ONLY <slice_role>" gates stay satisfied) | none | yes (1) |
| **B** (Claude's recommendation) | **NOINHERIT membership + per-tx `SET LOCAL ROLE` elevation.** Same memberships, but `telecheck_app_role` is `NOINHERIT`; each service call does `SET LOCAL ROLE <slice_role>` inside the open tx before the wrapper call (scoped to the tx; auto-reset on commit/rollback). Add a `withDbRole(tx, role, fn)` lib helper paralleling `withActorContext` / `withTenantContext`. | YES — privilege scoped to the single operation that needs it | NO (app SET-ROLEs *into* the canonical grantee; gates stay satisfied) | small (1 helper + per-call role selection) | yes (1) |
| **C** | **Direct grant.** Add `telecheck_app_role` as an additional direct EXECUTE/SELECT grantee on every wrapper + view. | NO | **YES — violates the anti-bypass DO-blocks** (e.g., 036 §3 RAISEs if any grantee other than the wrapper-owner/`crisis_initiator` exists; admin 043/044 enforce "ONLY admin_basic_operator/admin_template_reviewer"). Would require amending merged + reviewed verification gates across crisis 035–038, admin 043–044, med 049–050. | none | yes + amend ≥7 merged migrations |
| **D** | **Per-slice login role + per-slice connection pool.** Each slice gets its own LOGIN role (member of its slice roles) and the app uses a slice-scoped `pg.Pool`. | YES (strongest isolation) | NO | large (N pools, N credentials, secret-management per slice, routing in db.ts) | yes (N) |

## 5. Recommendations

### Claude's recommendation: **Option B** (NOINHERIT membership + per-tx `SET LOCAL ROLE` elevation)

**Rationale:**

1. **Least-privilege where it matters most.** Crisis Response handles imminent-harm PHI + Category A audit; Admin Backend touches operator-privileged surfaces. Scoping the elevated privilege to the single transaction that needs it (rather than holding the union of all slice privileges on every connection, as Option A does) is the posture these slices warrant. A logic bug or injection in an unrelated handler cannot reach a crisis/admin wrapper because the app role does not passively hold that privilege.
2. **Keeps the anti-bypass design intact with zero merged-migration churn.** The wrappers' explicit "EXECUTE granted ONLY to `<slice_role>`" verification DO-blocks remain true — the app `SET ROLE`s *into* the canonical grantee rather than adding a second grantee. Option C would require amending ≥7 Codex-reviewed verification gates; Option B requires none.
3. **RLS-safe by construction.** The slice roles are `NOBYPASSRLS`, so `SET ROLE` into them preserves RLS and does not implicate the migration 003:380 break-glass caution (which is about RLS-bypassing role changes). Tenant isolation (RLS + `set_tenant_context`) and actor binding (SI-010 nonce) compose unchanged within the same tx.
4. **Closes the migration-003 foundation gap canonically.** This is the `006_roles.sql` successor the foundation always intended; landing it as a least-privilege elevation pattern (rather than a broad inherit) sets the right precedent for all future SECDEF slices.

**Trade-off acknowledged:** Option B costs a new `withDbRole` lib helper + per-call role selection, and requires care that `SET LOCAL ROLE` composes correctly with `set_tenant_context($1)` and the actor-nonce GUC inside one transaction (ordering: bind tenant + nonce, then `SET LOCAL ROLE`, then call wrapper; verify the SECDEF wrapper's `current_actor_*()` reads still resolve under the elevated role — they should, since the nonce GUC is session/tx-scoped, not role-scoped). `NOINHERIT` on `telecheck_app_role` does **not** affect existing direct grants (direct grants apply regardless of INHERIT), so forms-intake / pharmacy / consent handlers are unaffected.

**Runner-up:** **Option A** is materially simpler (one migration, no app-code change) and the residual defense is still three-layer (RLS + actor-binding + wrapper LAYER-A/B/C). If the ratifier prioritizes pilot velocity over role-layer least-privilege, A is defensible — but it permanently abandons role-layer least-privilege and makes `telecheck_app_role` a standing superset of every slice's privileges. The ratifier should weigh velocity (A) vs least-privilege posture (B). **Options C and D are not recommended** (C defeats the slice-role design + churns merged gates; D over-engineers for a modular monolith at pilot scale).

### Codex recommendation: **PENDING (deferred)**

Codex is unavailable in this remote-cron environment. The mandatory two-pass consult (Pass-1 source-first independent + Pass-2 contrast-and-synthesize) **must be run** — by Evans's local session (where the `codex@openai-codex` plugin is installed) or by a future remote firing provisioned with `OPENAI_API_KEY` — **before the ratifier decision is finalized**.

## 6. Relationship to the open Med-Interaction role-name ERR

This ERR is a **sibling** of `Engineering-Review-Request-Med-Interaction-Role-Name-Reconciliation-2026-05-23.md` (Addendum 75, OPEN). Both concern the **application-layer ↔ slice-SECDEF-role integration boundary**:

- The **Med-Interaction ERR** decides *what the slice roles are named* (bare spec names vs slice-prefixed).
- **This ERR** decides *how the app acquires* those roles' privileges (inherit vs elevate vs direct vs per-slice-pool).

They are independent decisions but share a problem space and can be **ratified together in one ceremony**. Note: Med-Interaction PR 7+ needs *both* resolved (its role-name reconciliation **and** this acquisition mechanism) before its handlers can EXECUTE its wrappers.

## 7. Ratifier decision (to be completed)

> **Decision:** _pending_
> **Decided by:** _pending (Evans + Engineering Lead + CDM owner)_
> **Date:** _pending_
> **Codex Pass-1 verdict:** _pending_
> **Codex Pass-2 (synthesis) verdict:** _pending_
> **Promotion Ledger entry:** _pending_

## 8. Next steps (for the ratifier-executing session)

1. Run the Codex two-pass consult on this ERR (canonical incantations in CLAUDE.md §"Dual-recommendation process"). Surface Claude + Pass-1 + Pass-2 three-way.
2. Evans (with Engineering Lead + CDM owner) ratifies an option via chat-message. Record in §7 + a Promotion Ledger entry. Consider co-ratifying with the Med-Interaction role-name ERR (§6).
3. Land the ratified acquisition mechanism as the `006_roles.sql`-successor foundation migration (+ `withDbRole` helper if Option B), in a new PR cycle with full per-PR Codex APPROVE before merge.
4. Unblocked thereafter: Crisis Response Sprint 2 handlers, Admin Backend Sprint 2 handlers, and (with the role-name ERR also resolved) Med-Interaction PR 7+.

---

*Filed per CLAUDE.md autonomous-work discipline. This ERR does NOT execute any fix or migration; it tees up the ratifier decision. No production deploy, no schema ratification, no merge performed by the authoring firing.*
