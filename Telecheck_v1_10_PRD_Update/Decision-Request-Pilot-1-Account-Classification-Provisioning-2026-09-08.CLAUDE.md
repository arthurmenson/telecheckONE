# Claude's recommendation — Pilot 1 account cohort classification at provisioning time

Companion to `Decision-Request-Pilot-1-Account-Classification-Provisioning-2026-09-08.md`. Drafted in parallel with Codex Pass 1 and NOT supplied to Pass 1.

## Options Claude sees

**A — Widen the identity role's column grant; derive in the application.**
Migration 099 adds `cohort_classification` to `identity_service_role`'s INSERT column list. `createAccount` always names the column; the service derives the value from `account_type` (patient / delegate → `participant`; clinician / tenant_admin / platform_admin / service → `baseline`) and accepts an explicit `baseline` override only from internal fixture/seed callers (never from the HTTP registration surface). The identity-ordinary-role test's "forbids cohort writes" assertions are inverted for INSERT (UPDATE stays forbidden).
- For: literally satisfies the spec's same-INSERT atomicity; simplest code; mapping matches migration 080's own note.
- Against: reverses a Codex-reviewed trust-boundary decision (083 + the pinned test); the role can then INSERT any of the three values — the "derived, not caller-supplied" property lives only in application code, which is exactly the layer 083 chose not to trust for governed fields.

**B — Keep 083's boundary; a constrained SECURITY DEFINER classifier called in the same transaction.**
Migration 099 creates `pilot_1_classify_account(p_account_id, p_classification, p_reason)` owned by a new `pilot_1_cohort_wrapper_owner` (canonical `*_wrapper_owner` pattern), EXECUTE granted to `identity_service_role`. The function (i) requires the row to be `unclassified`, (ii) requires `p_classification` to equal the account_type-derived mapping (patient / delegate → `participant`, staff → `baseline`) unless the caller is the operator remediation path, (iii) performs the UPDATE and (iv) inserts the `pilot_1.cohort_classification` audit row under the bound tenant context — all in the caller's transaction. `createAccount`'s `txCallback` calls it immediately after the INSERT, so a registration transaction either commits classified or not at all.
- For: preserves the reviewed privilege boundary (the role still cannot write the column directly; the pinned test stays true); the write is constrained in the database, not in app code; audited per I-003/I-027; atomic at the transaction level; the same function serves `pilot-1-marker-remediation.sh` and any future participant-kit provisioning, so there is exactly one classification write path.
- Against: not literally "the same INSERT statement" — it is same-transaction; the spec's CI test 4 wording ("as part of the same INSERT") would need a ratified reading of "atomic" as "same transaction"; adds one SECURITY DEFINER function and one owner role (hard-floor 6(c) territory, hence this escalation).

**C — Derive in the database with a BEFORE INSERT trigger.**
A trigger on `accounts` sets `NEW.cohort_classification` from `account_type` whenever the INSERT leaves it at the default. No grant change; literally same-INSERT.
- For: no privilege change; zero app-code dependency; every INSERT path — including raw SQL — is classified.
- Against: destroys the `unclassified` = defect-detector property the spec relies on (a raw INSERT that bypasses provisioning is silently classified instead of surfacing at the preflight gate); the spec's CI test that a classification-omitted INSERT must be rejected becomes unimplementable; classification of a raw operator INSERT would be unaudited.

**D — Status quo (083 as written): ordinary registration lands `unclassified`; classification only via operator remediation.**
- For: no change to any reviewed artifact.
- Against: contradicts the spec's provisioning contract and migration 080's explicit phase B mandate; every Pilot 1 registration blocks purge until an operator remediates it by hand — the "operationally noisy" state 080 warns of, and an incident purge could be delayed by a queue of manual classifications.

## Claude's recommendation: **B**

B is the only option that satisfies all three constraints at once: the spec's atomicity intent (classified-or-rolled-back), I-003/I-027 audit attribution for a governed-field write, and the identity trust boundary that 083 and its test deliberately established. It also collapses provisioning and remediation onto one audited write path, which is what the spec's "ONLY authorized route" language wants. The one cost — reading "same INSERT" as "same transaction" — should be recorded as a ratified clarification in the PII spec, with CI test 4 asserting that no committed registration row is ever `unclassified` (which is the property the wording was protecting).

If the ratifier prefers literal same-statement atomicity over the trust boundary, A is the fallback, and the pinned test must then be amended in the same PR with a comment citing this decision.

## What Claude would implement under B

- Migration 099 (`pilot_1_cohort_wrapper_owner`, `pilot_1_classify_account`, grants; rollback 099).
- `createAccount` txCallback → classifier call with the derived value; staff-enrollment path → `baseline`.
- `scripts/pilot-1-marker-remediation.sh` → the same function under the operator DSN with an explicit `--reason`.
- Tests: registration commits classified; a failure injected in the classifier rolls back the account; raw INSERT with an invalid value → 23514; raw INSERT omitting the column → `unclassified` → verifier refuses; identity-ordinary-role test unchanged.
- PII spec: one-paragraph ratified clarification of "atomic"; SI filed to register `pilot_1.cohort_classification`, `env.purge.executed`, `env.incident.abandoned` in the bundle AUDIT_EVENTS contract (P-048 pattern: implementation first, registration recorded).
