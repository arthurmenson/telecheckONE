# Spec Issue — register the Pilot 1 substrate audit events in the AUDIT_EVENTS contract

**Date:** 2026-09-08 · **Filed by:** Claude (developer seat) · **Route:** Track 6 (spec-corpus ratification: Evans + Engineering Lead + CDM owner) · **Pattern:** P-048 (implementation merged before registration; the ledger records that ordering explicitly rather than implying earlier catalog coverage)

## 1. What is being asked

Register three audit action names in `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md` (currently v5.6 after P-048) as a file-local additive revision (v5.7), with a Promotion Ledger entry recording that the code-repo implementation preceded registration:

| Action | Category / sensitivity | Actor | Emitter | Status |
|---|---|---|---|---|
| `pilot_1.cohort_classification` | B / standard, unsampled | `platform_admin` (human operator; `actor_tenant_id` = operator's home tenant per migration 029; row lives in the target account's tenant partition, patient partition for patient/delegate) | `scripts/pilot-1-marker-remediation.sh` (telecheck-app PR #312) | **implemented, merged** |
| `env.purge.executed` | B / standard, unsampled | `platform_admin` operator | `scripts/pilot-1-env-purge.sh` (Sprint 1.3 phase B, PR 2 of 3 — not yet authored) | specified in the PII spec; pending |
| `env.incident.abandoned` | B / standard, unsampled | `platform_admin` incident owner | `scripts/incident-clear.sh --disposition ABANDONED` (Sprint 1.3 phase B, PR 3 of 3 — not yet authored) | specified in the PII spec; pending |

## 2. Where they are already specified (code repo, ratified 2026-08-30 under Path α)

- `docs/PII_SCREENING_AND_LOG_REDACTION_SPEC.md` §Environment purge/reset procedure (incident-lock; incident-mode preconditions; attestation transaction), §Three-state cohort classification §Remediation contract, §Cohort-classification integrity §Remediation path.
- `docs/PILOT_1_INCIDENT_RESPONSE_MINI_RUNBOOK.md` §Forensic-evidence preservation steps 7–8.
- `migrations/080_pilot_1_cohort_classification.sql` column comment (names `pilot_1.cohort_classification`).

## 3. Payload shapes as implemented / specified

- `pilot_1.cohort_classification` (implemented): `{ accountId, classifiedAs: 'participant' | 'baseline', actor, actorTenantId, reason, previousClassification: 'unclassified', accountType, tenantStatus, tenantContextBound, script }`. Exactly one row per classification; the classification and the row commit in one transaction (I-003); refused for already-classified rows (no reclassify mode) and for staff accounts as `participant`.
- `env.purge.executed` (specified): `{ incidentId, purgedAt, actor }`, inserted BEFORE any participant-data mutation in the same transaction as the complete FK-aware purge plan; single-use attestation per incident id (re-invocation refused if the row exists).
- `env.incident.abandoned` (specified): `{ incidentId, reason }`.

## 4. Why a Spec Issue rather than an inline addition to the code's `AuditAction` union

The `AuditAction` union in `src/lib/audit.ts` mirrors the canonical AUDIT_EVENTS catalog; its last additions (`pii.screener.egress_block` / `egress_redact`) were registered first (P-047). Adding names to the union is an amendment to a canonical contract surface (hard-floor item 6(d)); the scripts insert rows through psql and do not need the union, so the code change is deferred until registration. `audit_records.action` has no CHECK constraint, so the rows are valid at the database.

## 5. Requested ratifier action

1. Accept the three registrations (or amend names / categories / payload keys) as AUDIT_EVENTS v5.7, file-local additive.
2. Promotion Ledger entry recording: implementation of `pilot_1.cohort_classification` merged before registration (PR #312); the other two register ahead of their implementations.
3. On acceptance, Claude adds the three names to the `AuditAction` union (CategoryBAction) and the chain-walker fixtures in the same PR as the env-purge script.

## 6. Ratifier decision

_(to be recorded)_
