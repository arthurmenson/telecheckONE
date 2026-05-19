# PROPOSED Contracts Pack AUDIT_EVENTS Amendments — 3 new action IDs + canonical partition rule (2026-05-19)

**Status:** PROPOSED — awaiting Evans's ratification of (a) SI-018 partition rule [PR #14 R5 APPROVE], (b) cross-PR OQ3 Option A, (c) SI-017-OQ-MISMATCH A2+B2+C.
**Target file:** `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md`
**Version bump:** current → +1 (single ceremony bump covering SI-018 + SI-017 + I-032 contributions). Verify current AUDIT_EVENTS version at apply time; destination is approximately v5.5 if current is v5.3.
**Authority:** application requires Evans's chat-message ratification per CLAUDE.md hard-floor item 3.

---

## 1. Canonical partition rule (SI-018 contribution)

Insert as a new §"Hash-chain partition rule (canonical)" section near the top of the AUDIT_EVENTS file (after the existing event-envelope schema definition; before the per-event catalog):

> ### Hash-chain partition rule (canonical; SI-018, 2026-05-19)
>
> Every `audit_events` row belongs to exactly ONE hash-chain partition. The partition is determined deterministically per-event by the following two-tier hybrid rule:
>
> **Tier P1 — Patient-bound events.** If the event has a non-NULL `target_patient_id`, the row belongs to the patient-bound chain:
> ```
> chain_partition_key = SHA-256("GENESIS:PATIENT:<target_patient_id>")
> ```
>
> **Tier P2 — Tenant-governance events.** If the event has `target_patient_id IS NULL`, the row belongs to the tenant-governance chain keyed on the row's `tenant_id` envelope field:
> ```
> chain_partition_key = SHA-256("GENESIS:TENANT:<tenant_id>")
> ```
>
> **Determinism + I-027 preservation.** The partition is uniquely determined by the event's envelope (no caller choice; no application-state-derived routing). The audit chain is append-only per I-027; the partition rule does not allow rewriting historical partitions. Both P1 and P2 use independent hash chains; cross-partition linkage is NOT supported (no `linked_events[]` field overload for this purpose; cross-tenant or cross-patient correlation, where needed, is handled at query time, not envelope time).
>
> **Checkpoint format (canonical).** Partition checkpoints are tuples `(tier, partition_key, latest_record_hash)` with `tier ∈ {1, 2}` as the primary sort key (integer-tier sort prevents lexicographic ambiguity), `partition_key` as secondary, `latest_record_hash` as the chain head hash.
>
> **Per-event partition tier is enumerated in each event's catalog row below.** Events MUST NOT be partitioned differently from their cataloged tier; an implementation that emits the wrong partition fails the per-event regression test.
>
> **Originated:** SI-018 v0.2 DRAFT, ratified at PR #14 Codex R5 APPROVE 2026-05-19 (pending ratifier ceremony confirmation). Per the SI-018 Decision Brief `Decision-Brief-SI-018-Audit-Chain-Partition-Rule-2026-05-19.md`.

## 2. New action ID — Cat B `security.security_definer_tenant_guc_mismatch` (I-032 contribution)

Insert into the §"Cat B governance events" catalog (alphabetical by action_id):

> #### `security.security_definer_tenant_guc_mismatch` (Cat B; ELEVATED)
>
> **Trigger.** A SECURITY DEFINER procedure subject to I-032 (Tenant-GUC equality guard) rejected a call because `p_tenant_id IS DISTINCT FROM current_setting('app.tenant_id', true)`. Indicates a middleware bug or confused-deputy path: the canonical SI-017 authContextPlugin contract guarantees both surfaces derive from the same JWT-verified tuple, so a mismatch is a system bug.
>
> **Emitter.** Application call site (NOT the procedure). The application receives the procedure's `rejected = TRUE, rejection_code = 'tenant_guc_mismatch'` rejection tuple and emits this audit event before responding to the upstream request.
>
> **Envelope.**
> - `category`: B
> - `severity`: ELEVATED
> - `target_patient_id`: NULL (governance event)
> - `tenant_id` envelope field: **`current_setting('app.tenant_id', true)` (the GUC-side value, NOT the claim-side `p_tenant_id`)**. Rationale: places the audit signal under the session's actually-active tenant; prevents attacker-controlled partition placement.
> - `resource_type`: `'security_definer_procedure'`
> - `resource_id`: the procedure name (e.g., `'record_consult_clinician_decision'`)
>
> **Partition tier.** P2 (tenant-governance) per the canonical partition rule above. `chain_partition_key = SHA-256("GENESIS:TENANT:<current_setting('app.tenant_id', true)>")`.
>
> **Detail payload.**
> ```json
> {
>   "procedure_name":   "<the SECURITY DEFINER procedure that rejected>",
>   "p_tenant_id":      "<the caller-supplied tenant_id parameter value>",
>   "app_tenant_id":    "<current_setting('app.tenant_id', true) at rejection time>",
>   "session_id":       "<JWT session_id from p_session_id parameter>",
>   "p_account_id":     "<JWT account_id from p_account_id parameter>",
>   "rejected_at":      "<ISO 8601 timestamp at procedure-side rejection>",
>   "pg_backend_pid":   "<pg_backend_pid() value at rejection time>"
> }
> ```
>
> **Originated.** I-032 ratification per `Decision-Memo-Cross-PR-OQ3-Trust-Boundary-Equality-Guard-Option-A-Adopted-2026-05-19.md` (pending Evans's chat-message confirmation as of authoring time).

## 3. New action ID — Cat B `identity.session_liveness_check_failed` (SI-017 contribution)

Insert into the §"Cat B governance events" catalog (alphabetical by action_id):

> #### `identity.session_liveness_check_failed` (Cat B; STANDARD)
>
> **Trigger.** SI-017's Phase 2 F-3 JWT session-liveness check (authContextPlugin) determined that the JWT-referenced session is not live: `failure_reason ∈ {revoked, expired, missing, account_disabled}`.
>
> **Emitter.** authContextPlugin in the application layer, over a dedicated audit-writer pool connection (NOT the request-handler's tenant-scoped connection, because the rejected request has no tenant context to write under). The audit INSERT commits before the 401 response is sent.
>
> **Envelope.**
> - `category`: B
> - `severity`: STANDARD
> - `target_patient_id`: NULL (platform-scope governance event)
> - `tenant_id` envelope field: `tenant_id_claimed` (from JWT claim, since the session row may not exist — `failure_reason = 'missing'` covers that case)
> - `resource_type`: `'session'`
> - `resource_id`: the JWT `session_id`
>
> **Partition tier.** P2 (tenant-governance). `chain_partition_key = SHA-256("GENESIS:TENANT:<tenant_id_claimed>")`.
>
> **Detail payload.** Per SI-017 Sub-decision 4.
>
> **Mismatch path exclusion.** This event is NOT emitted when the JWT verifies but `auth.sessions.tenant_id IS DISTINCT FROM tenant_id_claimed` — that scenario is the separate Cat A `identity.session_jwt_tenant_id_mismatch` event (see below) per SI-017 Sub-decision 4.5.
>
> **Originated.** SI-017 ratification (pending Evans's chat-message confirmation as of authoring time).

## 4. New action ID — Cat A `identity.session_jwt_tenant_id_mismatch` (SI-017 Sub-decision 4.5 contribution)

Insert into the §"Cat A clinical-decision-evidence events" catalog (alphabetical by action_id). Cat A inclusion reflects A2 + B2 + C ratification per the Decision Memo.

> #### `identity.session_jwt_tenant_id_mismatch` (Cat A; ELEVATED)
>
> **Trigger.** SI-017's Phase 2 F-3 JWT session-liveness check determined that the JWT verifies AND the session row exists AND `auth.sessions.tenant_id IS DISTINCT FROM` JWT `tenant_id` claim. This is a JWT-replay-class attack signal (someone replayed a JWT from one tenant's account against another tenant's session ID).
>
> **Cat A rationale.** JWT-replay-class attacks deserve dedicated audit-chain entries eligible for SOC monitoring + threat-intelligence pipelines; Cat B governance noise filtering would lose this signal.
>
> **Emitter.** authContextPlugin in the application layer, over a dedicated audit-writer pool connection. Single audit row emitted per failed request (the routine Cat B `identity.session_liveness_check_failed` is NOT emitted for the mismatch path).
>
> **Envelope.**
> - `category`: A
> - `severity`: ELEVATED
> - `target_patient_id`: NULL (governance + attack-signal event)
> - `tenant_id` envelope field: **`auth.sessions.tenant_id` (the session-row-tenant; the legitimately-owning tenant — NOT `tenant_id_claimed`)**. Rationale: places the attack signal under the legitimate session-owner's audit chain; prevents attacker-controlled partition placement; matches B2 ratification per Decision Memo.
> - `resource_type`: `'session'`
> - `resource_id`: the JWT `session_id`
>
> **Partition tier.** P2 (tenant-governance) keyed on **`auth.sessions.tenant_id`**. `chain_partition_key = SHA-256("GENESIS:TENANT:<auth.sessions.tenant_id>")`. Note: P2 partition tier with the session-row-tenant key, NOT the claim-side key — this is a subtle but critical distinction from the routine Cat B `identity.session_liveness_check_failed` event.
>
> **Detail payload.**
> ```json
> {
>   "session_id":            "<JWT session_id>",
>   "account_id":            "<JWT account_id>",
>   "tenant_id_claimed":     "<JWT tenant_id claim — the attacker-supplied value>",
>   "tenant_id_actual":      "<auth.sessions.tenant_id — the session's legitimate owner>",
>   "checked_at":            "<ISO 8601>",
>   "pg_backend_pid":        "<pg_backend_pid()>",
>   "client_ip":             "<request source IP>",
>   "user_agent":            "<request User-Agent>"
> }
> ```
>
> **Response shape.** Same 401 + opaque payload as a routine liveness-check failure (no information-leak surface differentiation). P0 ops alert raised.
>
> **Originated.** SI-017 Sub-decision 4.5 (mismatch path), ratified per `Decision-Memo-SI-017-OQ-MISMATCH-A2-B2-C-Adopted-2026-05-19.md` (pending Evans's chat-message confirmation as of authoring time).

## 5. Doc-control update

Append a row:

```
| 2026-05-19 | v5.X | Hash-chain partition rule canonicalized (SI-018 two-tier hybrid P1/P2). Three new action IDs: security.security_definer_tenant_guc_mismatch Cat B (I-032); identity.session_liveness_check_failed Cat B (SI-017); identity.session_jwt_tenant_id_mismatch Cat A (SI-017 Sub-decision 4.5). |
```

(`v5.X` filled in at apply time.)

---

— Claude (Opus 4.7, 1M context), PROPOSED AUDIT_EVENTS amendments authored 2026-05-19 under non-ratification autonomous-work authorization.
