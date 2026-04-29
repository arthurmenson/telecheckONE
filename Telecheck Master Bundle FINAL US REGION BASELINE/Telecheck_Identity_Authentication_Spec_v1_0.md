# Telecheck — Identity & Authentication Specification

**Version:** 1.0
**Status:** Canonical for development
**Owner:** Engineering Lead
**Parent document:** Telecheck Master Platform PRD v1.6, §7, §16
**Companion documents:** Consent & Delegated Access Slice PRD v1.0, RBAC Permissions Matrix v1.0, Contracts Pack v5 (AUDIT-EVENTS, CCR-RUNTIME)

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
