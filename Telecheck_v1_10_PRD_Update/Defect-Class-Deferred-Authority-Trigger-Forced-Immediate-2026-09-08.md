# Defect class — deferred authority triggers forced IMMEDIATE before COMMIT

**Filed:** 2026-09-08
**Author:** Claude (implementer)
**Origin:** PR #302 (`telecheck-app` → `c17c727`), which fixed one instance on the I-019 crisis-admission path
**Severity:** HIGH at all five sites — every deferred evidence trigger re-validates actor authority (correction 2026-09-08: the identity assessment below was wrong; see the identity row)
**Status:** OPEN — one PR per module, each off `main`, each with independent adversarial review

---

## The pattern

A module opens a transaction inside `withTransaction`, nests `withTenantContext` and `withActorContext` inside it, does its work, and then forces a `DEFERRABLE INITIALLY DEFERRED` constraint trigger to fire early:

```ts
await tx.query('SET CONSTRAINTS <module>_evidence IMMEDIATE');
```

The trigger function it forces is the module's **evidence-and-authority gate**: it calls the live-actor resolver (`kms_current_actor_context()` via a module `_live_*` function), checks the evidence rows written in the same transaction, and calls the resolver again at the end.

## Why it was written that way

`forms-intake/internal/services/publication-evidence.ts` states the belief verbatim:

> Verify while trusted tenant/actor bindings are still in scope; the context helpers clear them before the surrounding transaction commits.

That is **half true, and the half that is true is the bug**. `withActorContext` uses `set_config(…, true)` — transaction-local, survives to COMMIT. But `withTenantContext` runs `clear_tenant_context()` — a DELETE of the per-backend binding — in its cleanup, which executes when the callback returns, i.e. *before* the outer `withTransaction` issues COMMIT. The resolver requires `current_tenant_id()`, so at COMMIT nothing can re-validate authority. Forcing the trigger IMMEDIATE while the binding is still present was the workaround.

## Why the workaround is the defect

`SET CONSTRAINTS … IMMEDIATE` fires the queued trigger events **and consumes them**. The actual COMMIT then runs with **no authority check at all**. `kms_current_actor_context()` compares `expires_at` against `clock_timestamp()`, so an actor nonce that expires between the forced check and COMMIT is committed under expired authority. `forms-intake` additionally issues `SET CONSTRAINTS … DEFERRED` immediately afterwards; that does **not** re-arm a consumed event.

PR #302 reproduced this on real Postgres for the crisis path (nonce expired at the COMMIT boundary → admission still committed) and fixed it.

## Sites

| Module | Call site | Trigger (migration) | Trigger fn re-validates authority? | Class |
|---|---|---|---|---|
| async-consult | `src/modules/async-consult/internal/services/clinical-intake-repository.ts:69` | `care_intake_evidence` → `care_require_intake_evidence` (095); also `care_binding_evidence` → `care_require_binding_evidence` (095) | yes (2 and 4 resolver calls) | **HIGH** |
| consent | `src/modules/consent/internal/handlers/care-policies.ts:123` | `consent_care_policy_evidence` → `consent_care_require_policy_evidence` (093) | yes (5) | **HIGH** |
| consent | `src/modules/consent/internal/services/care-consent.ts:159` | `consent_care_choice_evidence` → `consent_care_require_choice_evidence` (093) | yes (4) | **HIGH** |
| forms-intake | `src/modules/forms-intake/internal/services/publication-evidence.ts:106–107` (IMMEDIATE then DEFERRED) | `forms_publication_evidence` → `forms_require_publication_evidence` (092) | yes (3) | **HIGH** |
| identity | `src/modules/identity/internal/handlers/staff-enrollment.ts:73` | `identity_staff_enrollment_evidence` (098) | **yes** (2 — `identity_staff_operator(FALSE)` first and last, which reads `kms_current_actor_context()`) | **HIGH** — corrected 2026-09-08 (was wrongly recorded as 0 checks / timing-only). Same fix shape, but on the dedicated identity pool via `withIdentityTransaction` (which `clear_tenant_context()`s at start and end — the owned-client version must set the tenant binding inside BEGIN and leave it live through COMMIT). |

Counts are resolver-call occurrences found by scanning each trigger function body for `kms_current_actor_context` / `_live_` / `current_actor`. Each site must be confirmed by reading the function before the fix lands.

## The approved fix shape (PR #302, six Codex rounds)

Not a template to paste — a set of properties each module's fix must have, because each was a review finding:

1. **Bindings live at COMMIT.** Own the recording client (`getPool().connect()`), set the tenant binding on it, run `BEGIN … COMMIT` inside that scope. Remove the IMMEDIATE forcing so the deferred trigger fires *at* COMMIT and becomes a genuine authority gate.
2. **Publish the outcome the instant COMMIT settles.** Never await ROLLBACK or cleanup on the response path; a known `PT401` / constraint failure must never be demoted to "unconfirmed" by later bookkeeping.
3. **Bound COMMIT client-side.** PostgreSQL disables `statement_timeout` before running deferred triggers inside COMMIT, so the evidence scan is otherwise unbounded. On expiry, proceed and report uncertainty; **destroy your own socket**; never `pg_cancel_backend` by pid (a delayed cancel can abort a re-borrowed backend — another tenant's transaction).
4. **Bound ROLLBACK and `clear_tenant_context()`** as consumed background work; return the client if they finish, discard it if not (I-023 holds either way).
5. **Classify SQLSTATEs precisely.** A server raise, including one arriving on the COMMIT statement, is a known rollback; class 08 and driver codes are uncertain.
6. **Prove it on real Postgres.** The shared harness translates COMMIT into savepoints and a deferred trigger only fires at a real COMMIT, so the regression needs its own connection: force expiry deterministically *at* the COMMIT boundary and assert the raw COMMIT error; add a slow-deferred-trigger case for the deadline.

Whether to extract these into a shared helper in `src/lib` — rather than repeat them per module — is a judgment for the first sibling PR. A shared helper touches the platform-floor connection primitives and should be reviewed as such.

## Plan

1. `async-consult` care intake first — same care path as #302; both 095 triggers re-validate authority; highest patient-facing exposure.
2. `consent` (two sites, one PR).
3. `forms-intake` (also delete the IMMEDIATE→DEFERRED pair and correct the comment).
4. `identity` staff enrollment — **corrected 2026-09-08:** the trigger DOES carry authority checks (`identity_staff_operator(FALSE)` first and last). Fix required; same shape as the others, on the identity pool. Sequenced after forms-intake.

Each PR: branch off `main`, independent adversarial review to APPROVE, green CI, Addendum.

---

**Status 2026-09-08 (developer seat):** crisis ✅ #302 (`c17c727`) + parity PR #304 (open, Codex R1); async-consult ✅ #303 (`112f9aa`); consent ×2 — PR open (`fix/consent-authority-through-commit`); forms-intake — next; identity — corrected to HIGH, after forms. A shared `src/lib` COMMIT-authority transaction primitive is the intended consolidation once the module copies converge under Codex review (crisis, async-consult and consent currently each carry a module-internal copy of the approved shape).
