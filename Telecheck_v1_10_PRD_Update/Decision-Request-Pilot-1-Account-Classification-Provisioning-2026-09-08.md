# Decision Request — Pilot 1 account cohort classification at provisioning time (Sprint 1.3 phase B)

**Date:** 2026-09-08 · **Raised by:** Claude (developer seat) · **Ratifier:** Evans (+ Engineering Lead + CDM owner) · **Trigger:** hard-floor item 6 — two merged, Codex-reviewed artifacts disagree on who may write `accounts.cohort_classification`, and every reconciliation touches a DB role privilege or a SECURITY DEFINER pattern.

> This file is the **source-first question** for the two-pass Codex consult. It deliberately contains NO recommendation and NO option framing from Claude. Claude's separate recommendation lives in `Decision-Request-Pilot-1-Account-Classification-Provisioning-2026-09-08.CLAUDE.md` and is supplied to Codex only at Pass 2.

## 1. The question

**How must an account created through the ordinary Identity registration paths (`createAccount` in `src/modules/identity/internal/services/account-service.ts` → `src/modules/identity/internal/repositories/account-repo.ts`, executed under `identity_service_role`) receive its `cohort_classification`, given the conflicting ratified and merged artifacts below?**

Sub-questions the ratifier's answer must settle:

1. May `identity_service_role` write `accounts.cohort_classification` at all, and if so, may it only write a value derived from `account_type` rather than a caller-supplied one?
2. Must the classification be present in the same `INSERT` statement (atomic), or is a same-transaction privileged follow-up write acceptable, or is deferred operator remediation acceptable?
3. What classification does a `patient` / `delegate` created by ordinary registration on the Pilot 1 substrate receive (`participant` per migration 080's own note, or `unclassified` pending privileged provisioning per migration 083)?

## 2. The conflicting sources (verbatim pointers; all merged on `telecheck-app` main)

### 2a. `docs/PII_SCREENING_AND_LOG_REDACTION_SPEC.md` (ratified 2026-08-30 under Path α) — §Three-state cohort classification / §Cohort-classification integrity

- "**Provisioning contract:** every account-creation code path MUST specify the classification atomically in the same INSERT. Attempting an INSERT without the classification column value fails at the NOT NULL constraint."
- "**Provisioning (atomicity, not post-hoc):** account creation and `cohort_classification` assignment MUST be in the SAME `INSERT INTO accounts (...) VALUES (...)` statement. There is no post-hoc classification-write pattern."
- "**Provisioning post-verification (backstop, not the only line of defense):** the provisioning helper MAY additionally run `verify-pilot-1-baseline.sh` as a same-transaction post-check … If the verifier detects any `unclassified` row, the provisioning transaction rolls back."
- CI test 4: "every account-creation path in Pilot-1 baseline-seed + participant-provisioning flows MUST atomically write `cohort_classification` as part of the same INSERT."
- Three-state definitions: `participant` = "a Pilot-1 participant (patient or delegate) whose data is purged by env-purge"; `baseline` = staff types "OR a patient/delegate seeded for baseline test purposes"; `unclassified` = "a data-model defect: either provisioning failed to assign a classification, or a manual database write bypassed the provisioning path."

### 2b. `migrations/080_pilot_1_cohort_classification.sql` (Sprint 1.3 phase A, merged `a54bb91`, Codex R3 APPROVE)

- Step 3 replaced NOT-NULL-without-DEFAULT by `DEFAULT 'unclassified'` because `createAccount` "does not supply the column, so the no-DEFAULT form … failed *totally*, breaking every account-creation path".
- "⚠️ CONSEQUENCE FOR SPRINT 1.3 PHASE B: because `createAccount` does not yet classify, every account it creates lands 'unclassified', so the preflight gate will refuse until each is remediated. That is fail-closed but operationally noisy. **Phase B must give `createAccount` an explicit classification argument** — applying this migration's own backfill mapping (clinician / tenant_admin / platform_admin / service -> baseline; patient / delegate created during the pilot -> participant) with an override for baseline test fixtures … That is a contract-completion task and is deliberately NOT decided here."

### 2c. `migrations/083_identity_account_control_field_privileges.sql` (Identity bootstrap package, merged later than 080, Codex-reviewed)

```sql
REVOKE INSERT, UPDATE ON public.accounts, public.sessions FROM telecheck_app_role;
GRANT INSERT (
    account_id, tenant_id, phone_e164, email, first_name, last_name,
    date_of_birth, gender, national_id, country_of_residence,
    country_of_care, locale
) ON public.accounts TO identity_service_role;
GRANT UPDATE (status, activated_at) ON public.accounts TO identity_service_role;
-- account_type defaults to patient; cohort_classification defaults to
-- unclassified. Both remain governed by separate privileged provisioning.
```

### 2d. `tests/integration/identity-ordinary-role.test.ts` — `describe('trusted Identity account control fields')` → `it('allows Identity registration and activation but forbids privileged role/cohort writes')`

Under `SET SESSION AUTHORIZATION identity_service_role` the test asserts that (i) `UPDATE accounts SET cohort_classification='baseline'` is **rejected**, (ii) an `INSERT … cohort_classification … 'baseline'` is **rejected**, and (iii) an ordinary registration row reads back as `{ account_type: 'patient', cohort_classification: 'unclassified', status: 'active' }`.

### 2e. `src/modules/identity/internal/repositories/account-repo.ts` — `createAccount`

- "Ordinary registration relies on the database's patient default and cannot write governed role/cohort fields. Nonpatient provisioning is deliberately a privileged path requiring INSERT(account_type)." The INSERT names `account_type` only when the caller supplies a non-patient type; it never names `cohort_classification`.
- Call sites: `handlers/registration.ts` (phone OTP registration), `handlers/email-pin-auth.ts` (email+PIN registration), `services/account-service.ts`; staff accounts are created through the separate staff-enrollment path (`handlers/staff-enrollment.ts`, migration 098).

### 2f. Enforcement surfaces already merged

- `scripts/verify-pilot-1-baseline.sh` refuses (exit 1) on any `unclassified` row; runs as Day-0 checklist item, env-purge preflight (both modes) and provisioning post-hook.
- `scripts/pilot-1-marker-remediation.sh` (Sprint 1.3 phase B, not yet merged) is the only authorized classification route for `unclassified` rows; each call emits `pilot_1.cohort_classification{accountId, classifiedAs, actor, reason}`.
- Migration 031 `_session_actor_context` + SECURITY DEFINER wrapper pattern (`*_wrapper_owner` roles in migrations 035/036/042/044/047/056/076/079) is the codebase's canonical way to let an unprivileged role perform a constrained privileged write.

## 3. Constraints the answer must respect

- **I-003 / I-027**: every classification write that is not part of the creating INSERT must be audited with tenant attribution; bare suppression forbidden.
- **I-023**: the identity trust boundary (migration 081/083) was designed so `identity_service_role` cannot write governed fields; any change must keep RLS + column-privilege + app-layer enforcement coherent.
- **Pilot 1 substrate semantics**: env-purge deletes `participant` rows only; `unclassified` rows block purge; `baseline` rows survive. Pilot 2 (real PHI) does not run env-purge.
- **Spec ratification leads implementation**: Claude may implement only a ratified sub-decision; the ratifier picks.

## 4. What Claude is asking Codex (Pass 1)

Read ONLY this file and the cited sources on `telecheck-app` main. Produce an independent recommendation: enumerate the viable provisioning designs yourself, recommend one, give the strongest argument for and against each, and name any deal-breaker (invariant violation, trust-boundary regression, spec contradiction) on any design. Do not consult Claude's recommendation file.

## 5. Ratifier decision

_(to be recorded)_
