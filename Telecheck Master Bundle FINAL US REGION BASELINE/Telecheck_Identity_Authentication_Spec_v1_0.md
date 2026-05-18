# Telecheck — Identity & Authentication Specification

**Version:** 1.1
**Status:** Canonical for development
**Owner:** Engineering Lead
**Parent document:** Telecheck Master Platform PRD v1.10, §7, §16
**Companion documents:** Consent & Delegated Access Slice PRD v1.0, RBAC Permissions Matrix v1.0, Contracts Pack v5.4 (AUDIT-EVENTS, CCR-RUNTIME)

**v1.1 amendment (2026-05-18 per SC6 P-023 SI-010 canonical-content-port landing):** Added §3.6 "Server-side actor context (per SI-010)" closing Phase 2 F-3 (server-side actor identity binding). New `_session_actor_context` table + `bind_actor_context()` SECURITY DEFINER procedure + helper functions + cleanup mechanism + `authContextPlugin` wiring + 5-test regression gate. Filename retained at `_v1_0.md` per Contracts Pack convention (family identifier in filename; header iterates freely). Source-of-truth design doc: `telecheck-app/docs/SI-010-Session-Actor-Context-DB-Binding.md` v0.6.

---

## 1. Purpose

This specification defines patient registration, authentication, session management, clinician credential verification, and identity verification for clinical transactions. Every workflow in the platform depends on knowing who the user is. This is foundational infrastructure.

---

## 2. Patient registration

### 2.1 Registration flow

1. **Phone number entry.** Patient enters their phone number (Ghana format: 0XX XXX XXXX, stored as +233XXXXXXXXX). Phone number is the primary identifier.
2. **OTP verification.** A 6-digit OTP is sent via SMS. Valid for 5 minutes. Maximum 3 attempts before lockout (15-minute cooldown).
3. **Basic profile.** Patient provides: first name, last name, date of birth, gender. All required.
4. **Platform consent.** Patient reviews and grants platform consent (consent type 1 of 6). Presented as a clear, concise agreement — not a wall of text (I-022).
5. **Account created.** `country_of_registration` is set to Ghana (immutable). `locale` defaults to `en-GH` (changeable). Account is active.

### 2.2 Identity fields

| Field | Required | Mutable | Notes |
|---|---|---|---|
| Phone number | Yes | Yes (with re-verification) | Primary identifier and login credential |
| First name | Yes | Yes | Display name |
| Last name | Yes | Yes | Display name |
| Date of birth | Yes | No (immutable after verification) | Clinical relevance (pediatric/geriatric flags) |
| Gender | Yes | Yes | Clinical relevance (pregnancy/lactation flags) |
| Email | No | Yes | Optional secondary contact |
| National ID (Ghana Card) | No | Yes | Optional; may be required for certain programs |
| Profile photo | No | Yes | Optional; helps clinicians identify patients in video consults |

### 2.3 Uniqueness

Phone number is unique per account. A phone number cannot be registered to multiple accounts. If a patient changes their phone number, the old number is released after a 30-day hold period (prevents accidental account loss).

---

## 3. Authentication

### 3.1 Login flow

1. Patient enters phone number
2. OTP sent via SMS (6-digit, 5-minute validity, 3 attempts max)
3. Patient enters OTP
4. Session established

**Biometric unlock (optional):** After first login on a device, the patient can enable biometric authentication (fingerprint/face) for subsequent sessions. Biometric authentication generates a device-bound token — it does not bypass OTP for new devices.

### 3.2 Session management

| Parameter | Value |
|---|---|
| Access token TTL | 15 minutes |
| Refresh token TTL | 30 days |
| Maximum concurrent sessions | 3 devices |
| Session extension | Automatic via refresh token while app is active |
| Inactivity timeout | 10 minutes (foreground), immediate (background after 5 minutes) |
| Re-authentication for sensitive actions | OTP required for: changing phone number, granting delegation, revoking consent |

### 3.3 Token architecture

- **Access token:** Short-lived JWT containing user_id, role, active_delegation (if acting as delegate), country_of_care, session_id. Included in every API request.
- **Refresh token:** Longer-lived opaque token stored securely on device. Used to obtain new access tokens without re-authentication.
- **Device token:** Bound to the device via secure enclave/keychain. Required for biometric authentication.

### 3.4 Multi-device behavior

A patient may be logged in on up to 3 devices simultaneously. Each device has its own session. Actions on one device are reflected on others within the polling/push interval. Exceeding the device limit forces logout of the oldest session.

### 3.5 Account recovery

If a patient loses access to their phone number:
1. Patient contacts support via the support channel
2. Support verifies identity using: full name, date of birth, and one of (email, national ID, recent transaction history)
3. Support initiates a phone number change with the new number
4. OTP verification on the new number
5. 24-hour security hold on sensitive actions after phone number change

### 3.6 Server-side actor context (per SI-010)

**Added v1.1 per SC6 P-023 SI-010 canonical-content-port landing 2026-05-18.** This section closes Phase 2 F-3 (server-side actor identity binding) and is referenced by Contracts Pack v5.4 AUDIT_EVENTS (3 new Cat B identity binding-lifecycle action IDs: `identity.actor_context_bound`, `identity.session_liveness_check_failed`, `identity.actor_context_unbound_rejected`).

**Purpose.** Every PHI-touching DB transaction MUST execute under a server-bound actor context — i.e., the DB session knows, by hard reference, which authenticated account is executing the statement, in which tenant, and under which session and request nonce. The mechanism is invariant-grade per I-023 (tenant isolation) and I-027 (audit attribution); it is not a soft "best-effort" attribution layer.

**`_session_actor_context` table.** A PERMANENT (not TEMP) table in the `app_internal` schema. **Primary key is the composite `(pg_backend_pid, txid)` discriminator** (NOT `pg_backend_pid` alone) — this defends against pooled-connection reuse and delayed-cleanup leaks where a backend pid is recycled across requests within the 5-minute TTL. Each row holds: `pg_backend_pid` (PK part 1), `txid` (PK part 2, captured via `txid_current()` at bind time), `account_id`, `tenant_id`, `role`, `admin_home_tenant_id` (NULL for non-admin), `session_id`, `nonce_hash` (SHA-256 of the request nonce captured via `app.request_nonce` GUC; the raw nonce is never stored), `bound_at`, `expires_at` (5-minute TTL from `bound_at`). GRANT lockdown: only the privileged `bind_actor_context_role` may INSERT/UPDATE/DELETE; the application role `telecheck_app_role` has SELECT only via the helper functions below.

**`bind_actor_context()` SECURITY DEFINER procedure.** The ONLY write path. Owned by `bind_actor_context_role` (a role separate from `telecheck_app_role` so the application cannot bypass the helper). The procedure:
1. Verifies the session-liveness gate (revoked/missing/expired sessions raise `identity.session_liveness_check_failed` Cat B audit + fail-closed `throw UnauthenticatedError()` ordering — liveness check fires BEFORE the bind row INSERT, never after).
2. Computes `nonce_hash` server-side from the caller-supplied request nonce; the raw nonce is discarded immediately. The same nonce is also published into the session via `SET LOCAL app.request_nonce = <nonce>` so that the helper functions can locate the bound row by `(pg_backend_pid(), txid_current(), app.request_nonce)`.
3. UPSERTs into `_session_actor_context` keyed on the composite `(pg_backend_pid, txid)` with `bound_at = NOW()`, `expires_at = NOW() + INTERVAL '5 minutes'`. The PK choice ensures that a backend pid recycled within the TTL cannot serve a stale row to a different transaction.
4. Emits `identity.actor_context_bound` Cat B audit (atomic with the UPSERT under the same transaction).

**Helper functions (read from table, NOT from GUCs for identity).** `current_actor_account_id()`, `current_actor_tenant_id()`, `current_actor_role()`, `current_actor_admin_home_tenant_id()` — each `STABLE` SQL functions that SELECT the binding row for the composite key **`(pg_backend_pid(), txid_current(), current_setting('app.request_nonce'))`** and return the respective column; raise `actor_context_unbound` if no row exists, if the stored `nonce_hash` does not match the SHA-256 of the GUC-supplied nonce, or if `expires_at < NOW()`. `app.request_nonce` is the ONLY GUC the helpers consume — and only as a row-lookup key — because the actual identity columns are read from the locked-down table, not from caller-settable GUCs. Other `SET LOCAL app.*` values are ignored.

**`assert_request_nonce_bound()` helper.** Mutating SECURITY DEFINER procedures MUST call `assert_request_nonce_bound()` as their first statement. The helper validates the composite tuple `(pg_backend_pid(), txid_current(), app.request_nonce)` resolves to an unexpired row with a matching `nonce_hash`; raises `request_nonce_unbound_or_expired` if any component is missing or expired (emitting `identity.actor_context_unbound_rejected` Cat B audit with `procedure_name`, `rejection_code`, `nonce_hash`, `pg_backend_pid`, `txid`, `attempted_at`).

**Cleanup mechanism (defense in depth).**
1. **Transaction-end CONSTRAINT TRIGGER** (DEFERRABLE INITIALLY DEFERRED) that fires at COMMIT/ROLLBACK and DELETEs the binding row keyed by the composite `(pg_backend_pid, txid)`. This is the primary cleanup path; because the PK includes `txid`, a pid recycled into a new transaction cannot inadvertently delete or read a prior transaction's row.
2. **60-second background sweeper** (`pg_cron` or equivalent) that DELETEs rows where `expires_at < NOW()`. Catches sessions that died without a clean transaction close (network drops, process crashes).
3. **5-minute `expires_at` TTL** enforced at helper-function read time (raises `actor_context_unbound` even if rows physically remain).

**`authContextPlugin` wiring (Fastify).** The plugin is registered globally and runs as the first `onRequest` hook. It:
1. Extracts and verifies the access-token JWT (signature + expiry + audience).
2. Resolves `account_id` / `tenant_id` / `role` / `admin_home_tenant_id` / `session_id` from the JWT claims + a session-liveness check against the `auth.sessions` table (revoked/expired sessions short-circuit with `UnauthenticatedError` and emit `identity.session_liveness_check_failed`).
3. Calls `CALL bind_actor_context(...)` over the request-scoped DB connection acquired from the pool.
4. Registers an `onResponse` cleanup hook that confirms the CONSTRAINT TRIGGER fired (defensive belt-and-suspenders; logs an `identity.actor_context_unbound_rejected` if it discovers a leaked binding).

**Mandatory regression test gate (5 tests).** No PR may merge against this contract without all five green:
1. `bind_actor_context()` rejects calls from any role other than `bind_actor_context_role`.
2. Helper functions raise `actor_context_unbound` after `expires_at` passes (5-min TTL).
3. CONSTRAINT TRIGGER deletes the binding row on COMMIT and on ROLLBACK.
4. Mutating procedure without `assert_request_nonce_bound()` raises `request_nonce_unbound_or_expired` and emits Cat B audit.
5. Connection-pool reuse: after session A's transaction commits and pgbouncer hands the connection to session B, session B sees `actor_context_unbound` until its own `bind_actor_context()` call completes — validated by composite `(pg_backend_pid, txid)` discrimination (a new transaction on the same backend pid resolves to a different `txid_current()`, so a leaked row from a prior transaction is unreachable via the helpers).

**Reference contract.** See `telecheck-app/docs/SI-010-Session-Actor-Context-DB-Binding.md` (v0.6 source-of-truth design doc; the canonical executable contract is the migration set landing in the telecheck-app repo).

---

## 4. Clinician authentication

### 4.1 Clinician registration

Clinicians are onboarded by an operator (not self-service at launch). The onboarding process:

1. Operator creates clinician account with: full name, medical license number, country_of_licensure, specialty, contact details
2. **License verification.** Operator verifies the medical license against the relevant medical council registry (Ghana Medical and Dental Council for Ghana). Verification is recorded in audit (Category B).
3. Clinician receives login credentials via secure channel
4. Clinician completes first login with OTP + password setup
5. Clinician account is active

### 4.2 Clinician session

Clinicians authenticate with phone number + password + OTP (three-factor for clinical accounts). Session parameters:

| Parameter | Value |
|---|---|
| Access token TTL | 15 minutes |
| Refresh token TTL | 8 hours (shift-aligned) |
| Maximum concurrent sessions | 1 (single active session) |
| Inactivity timeout | 5 minutes |
| Re-authentication | Required for every prescribing action, signal override, and protocol-authorized approval |

### 4.3 Credential expiry

Clinician accounts are tied to their medical license. License expiry dates are tracked. 30 days before expiry, the clinician and their operations manager receive a renewal reminder. On expiry day, the clinician's ability to approve clinical actions is suspended until the license is renewed and re-verified.

---

## 5. Delegate authentication

Delegates authenticate with their own account (separate phone number, separate OTP). After authentication, a delegate can switch to a delegated patient's context if they hold an active delegation with appropriate scope.

The delegate's access token includes `active_delegation: { patient_id, scope }` when operating in delegated context. All actions in delegated context carry the delegate's identity (I-018).

---

## 6. Operator and admin authentication

Operators authenticate with email + password + OTP (three-factor). All operator sessions are logged in audit (Category B). Operator accounts are provisioned by the engineering lead or designated admin.

---

## 7. Rate limiting

| Endpoint | Limit | Lockout |
|---|---|---|
| OTP request | 5 per phone number per hour | 1-hour cooldown after limit |
| OTP verification | 3 attempts per OTP | 15-minute cooldown, new OTP required |
| Login attempt | 10 per phone number per hour | 1-hour lockout |
| Password attempt (clinician) | 5 per account per hour | 1-hour lockout, admin notification |
| API requests (authenticated) | 100 per minute per session | 429 response, 60-second cooldown |

---

## 8. Identity verification for clinical transactions

For high-value clinical transactions (first prescription in a program, controlled substance programs if/when added), the platform may require enhanced identity verification:

1. **Photo ID verification.** Patient uploads a photo of their Ghana Card or passport. OCR extracts name and DOB. Compared against account profile.
2. **Liveness check.** Patient takes a selfie. Compared against the photo ID to confirm the person submitting is the person on the ID.

At Ghana launch, enhanced verification is **not required** for standard programs (GLP-1, ED, chronic care). It is designed as an activation for future programs or regulatory requirements.

---

## 9. Audit

| Event | Category | Detail |
|---|---|---|
| Account created | C | patient_id, registration_method, country_of_registration |
| Login successful | C | user_id, device_info, ip_hash |
| Login failed | C | user_identifier, failure_reason, attempt_count |
| OTP sent | C | phone_number_hash, channel (SMS) |
| Phone number changed | B | old_number_hash, new_number_hash, verification_method |
| Clinician license verified | B | clinician_id, license_number, verifying_operator, council_name |
| Clinician license expired | B | clinician_id, expiry_date, suspension_applied |
| Account recovery | B | patient_id, recovery_method, support_agent_id |
| Biometric enabled/disabled | C | user_id, device_id, biometric_type |
| Session forced logout | C | user_id, reason (device limit, admin action) |

---

## 10. Dependencies

- **SMS provider** — OTP delivery (separate from WhatsApp Business API; reliable SMS is critical for authentication)
- **CCR-RUNTIME** — phone number format, country-specific identity requirements
- **RBAC Permissions Matrix** — role assignment after authentication
- **Consent & Delegated Access Slice** — platform consent at registration; delegation context in tokens
- **Notification Spec** — OTP templates, security alert templates

---

## Document control

- **v1.0** — Initial Identity & Authentication specification. Defines patient registration (phone + OTP), authentication (OTP + optional biometric), session management (JWT + refresh token), clinician three-factor auth with license verification, delegate authentication, rate limiting, and identity verification for clinical transactions. Designed for Ghana launch with extensibility for future markets and enhanced verification.
