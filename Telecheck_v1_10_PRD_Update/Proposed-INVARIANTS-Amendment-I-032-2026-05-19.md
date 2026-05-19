# PROPOSED Contracts Pack INVARIANTS Amendment — I-032 (Tenant-GUC equality guard on SECURITY DEFINER procedures with actor-tenant parameters)

**Status:** PROPOSED — awaiting Evans's ratification of cross-PR OQ3 Option A per the Decision Memo.
**Target file:** `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Contracts_Pack_v5_00_INVARIANTS.md`
**Version bump:** current → current +1 minor (apply at lockstep commit time; verify current state of INVARIANTS at apply time).
**Authority:** application requires Evans's chat-message ratification per CLAUDE.md hard-floor item 3.

---

## 1. Where to insert in the canonical INVARIANTS file

After the last existing invariant block (I-031 per v1.10 cycle additions), insert a new section:

```
---

## I-032 — Tenant-GUC equality guard on SECURITY DEFINER procedures with actor-tenant parameters
```

Update the §"Invariant inventory" table at the top of the file to include the new row.

## 2. Non-authoritative summary of canonical I-032 (NOT verbatim; for ratification audit-trail context only)

**CRITICAL READING NOTE — the canonical source-of-truth for I-032 is `Telecheck_Contracts_Pack_v5_00_INVARIANTS.md` (INVARIANTS v5.3), NOT this file.** This file was authored 2026-05-19 as the original PROPOSED text-for-canonical-application reference; the canonical text has since been amended through multiple Codex R-rounds (R3 Mode 1/Mode 2 split + R5 NULLIF normalization + R6 sync attempt) and the wording below has DIVERGED from canonical INVARIANTS in several ways (audit-envelope bullet phrasing, rationale prose, scope/operational/verification sections summarized). **Engineers + implementers + reviewers MUST consult canonical INVARIANTS v5.3 I-032 (lines ~253-310) for the authoritative text.** The block below is retained as a non-authoritative summary for the ratification audit-trail; reading it as canonical specification will produce divergence from the actual canonical contract.

**Known wording deltas vs canonical INVARIANTS v5.3 I-032 as of R7 closure 2026-05-19:**
- Audit-envelope bullet: this summary writes `tenant_id = NULLIF(...)`; canonical writes `tenant_id = current_setting('app.tenant_id', true)` (the canonical text implicitly assumes Mode 2's non-NULL precondition from the surrounding context, so the NULLIF wrap is unnecessary at the envelope line).
- Scope/Operational/Verification sections are compressed-to-pointer in this summary; canonical INVARIANTS carries the full text.
- The full rationale paragraph (Codex finding pointers, Decision Memo citation) is present in canonical INVARIANTS but truncated here.

If a verbatim mirror is needed for tooling that depends on this file: copy the canonical I-032 block from INVARIANTS v5.3 directly; do not maintain two copies.

The summary below is preserved as authored at this file's creation (with subsequent R-round amendments) for ratification audit-trail purposes only:

> **I-032 — Tenant-GUC equality guard on SECURITY DEFINER procedures with actor-tenant parameters**
>
> **Statement.** Any `SECURITY DEFINER` procedure that accepts an actor-tenant parameter (`p_tenant_id` or any equivalently-named parameter holding the caller's authenticated tenant identifier) MUST reject the call BEFORE performing any data mutation, idempotency lookup, advisory-lock acquisition, or state read. The check has two failure modes; the procedure's response differs per mode:
>
> - **Mode 1 — Missing GUC (RAISE):** If `NULLIF(current_setting('app.tenant_id', true), '')` IS NULL (the session-bound GUC was never set OR was set to an empty string OR was RESET — PostgreSQL custom GUCs return `''` rather than NULL on RESET, so the NULLIF normalization is required to detect all missing-context variants), the procedure MUST `RAISE EXCEPTION 'I-032 Mode 1: app.tenant_id GUC not set (or blank) on connection; SI-017 authContextPlugin contract violated'` with SQLSTATE `P0001` and abort the application transaction. Operational response: application middleware catches the P0001 SQL exception and routes the failure to the platform error stream + P0 ops alert with sufficient context (procedure name, session_id, account_id, client_ip, user_agent, pg_backend_pid). No tenant-scoped audit envelope is constructible without a tenant identifier; I-003 audit-completeness is preserved at the error-stream / ops-alert layer. Any proposed platform-scope audit-chain partition tier is an audit-chain primitive extension requiring ratifier-quorum review under a separate SI.
> - **Mode 2 — Mismatch (structured-rejection case):** If `NULLIF(current_setting('app.tenant_id', true), '')` is non-NULL AND `p_tenant_id` IS DISTINCT FROM that normalized value, the procedure MUST reject with the canonical rejection code `tenant_guc_mismatch` (structured rejection tuple; no SQL exception). The application call site receives the rejection tuple and emits the `security.security_definer_tenant_guc_mismatch` Cat B ELEVATED audit event at SI-018 P2 partition keyed on the non-NULL normalized GUC value.
>
> Both Mode 1 and Mode 2 use the SAME `NULLIF(current_setting('app.tenant_id', true), '')` normalization for consistent treatment.
>
> **Rejection contract (Mode 2 only; Mode 1 raises).**
> - The Mode 2 rejection MUST be **step 0** of the procedure's validation sequence (Mode 1 NULL check precedes Mode 2 mismatch check; both precede all other validation steps including the existing auth-FIRST patterns).
> - The Mode 2 rejection MUST use the canonical rejection code `tenant_guc_mismatch`.
> - The Mode 2 procedure MUST return the rejection tuple WITHOUT raising a SQL exception.
>
> **Audit-event emission contract (Mode 2 only).**
> - The application call site (NOT the procedure) MUST emit a Cat B audit event with `action_id = 'security.security_definer_tenant_guc_mismatch'` immediately after receiving the Mode 2 rejection tuple, BEFORE responding to the upstream request.
> - The audit event envelope MUST use `tenant_id = NULLIF(current_setting('app.tenant_id', true), '')` (the normalized GUC-side value, non-NULL in Mode 2 by definition; NOT the caller-supplied `p_tenant_id`).
> - The audit event MUST be partitioned per SI-018 P2 (tenant-governance): `chain_partition_key = SHA-256("GENESIS:TENANT:<normalized-GUC-value>")`.
> - The audit event severity MUST be ELEVATED.
> - On Mode 2 rejection, the application MUST raise a P0 ops alert in addition to emitting the audit event.
>
> **Scope of application.** Same as canonical I-032 — see `Telecheck_Contracts_Pack_v5_00_INVARIANTS.md` for the authoritative scope list.
>
> **Verification.** Regression tests for both modes per the canonical I-032 §Verification (M1.1a/M1.1b/M1.1c covering never-issued + RESET + blank-string variants of Mode 1; M2.1-M2.4 covering Mode 2; M.X mutual-exclusion). Authoritative test obligations in canonical INVARIANTS file.
>
> **Originated:** v1.10 ratification cycle, 2026-05-19. Ratified per Evans's chat-message ratification 2026-05-19 (verbatim quote in Promotion Ledger P-026 entry's Status block).
>
> **Related:** I-023; SI-017; SI-018; P-018a/P-019a/P-021a.

## 3. Invariant inventory table row to add

Append to the inventory table near the top of INVARIANTS file:

```markdown
| I-032 | Tenant-GUC equality guard on SECURITY DEFINER procedures with actor-tenant parameters | v1.10 ratification cycle 2026-05-19 | Application |
```

(Adjust column shape to match the existing table's actual columns at commit time; current canonical INVARIANTS file's exact column shape should be the source of truth.)

## 4. Doc-control update

If the INVARIANTS file uses a header doc-control block, add a row:

```
| 2026-05-19 | v5.X | I-032 added per Decision Memo Cross-PR OQ3 Option A ratification. Codifies tenant-GUC equality guard on SECURITY DEFINER procedures with actor-tenant parameters as defense-in-depth on top of SI-017 authContextPlugin trust anchor. |
```

(`v5.X` filled in at apply time based on current INVARIANTS version.)

---

— Claude (Opus 4.7, 1M context), PROPOSED I-032 text authored 2026-05-19 under non-ratification autonomous-work authorization.
