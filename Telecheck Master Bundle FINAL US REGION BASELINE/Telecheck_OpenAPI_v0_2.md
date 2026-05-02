# Telecheck — OpenAPI Specification

**Version:** 0.2
**Status:** Canonical for development
**Owner:** Engineering Lead
**Parent documents:** System Architecture v1.0, Canonical Data Model v1.0, Contracts Pack v5, RBAC Permissions Matrix v1.0

---

## 1. Purpose

This document defines every API endpoint in Telecheck — who owns it, what it accepts, what it returns, who can call it, and which contracts govern it. It is the contract surface that engineering builds against and reviewers attack.

v0.1 covers all critical-path endpoints for Ghana launch. Non-critical endpoints are listed but marked as stubs. Engineering converts this to OpenAPI 3.1 YAML; this document is the design truth.

---

## 2. API conventions

### 2.1 Base URL

```
Production:  https://api.telecheck.health/v1
Staging:     https://api.staging.telecheck.health/v1
```

### 2.2 Authentication

All endpoints require a Bearer token in the `Authorization` header except:
- `POST /auth/otp/request` (unauthenticated — initiates login)
- `POST /auth/otp/verify` (unauthenticated — returns token)
- `GET /health` (unauthenticated — health check)

Tokens carry: `account_id`, `account_type`, `market`, `session_id`. Delegation context is passed via `X-Acting-For` header when a delegate acts on behalf of a patient.

### 2.3 Delegation header

```
X-Acting-For: patient_id={target_patient_id}&delegation_id={delegation_id}
```

When present, the server validates the delegation is active and the requested action is within the delegate's granted scopes. If absent, the caller is acting as themselves.

### 2.4 Error envelope

Per Contracts Pack 00-ERROR-MODEL.md:

```json
{
  "error": {
    "code": "consent.missing_care_consent",
    "message": "Care consent is required for this action.",
    "detail": "Program enrollment requires active care consent.",
    "retryable": false,
    "request_id": "req_abc123"
  }
}
```

HTTP status codes: 400 (validation), 401 (unauthenticated), 403 (unauthorized/scope denied), 404 (not found), 409 (conflict/idempotency), 422 (business rule violation), 429 (rate limit), 500 (internal), 503 (service unavailable).

### 2.5 Idempotency

Per Contracts Pack 00-IDEMPOTENCY.md: all state-changing endpoints accept `Idempotency-Key` header. Same key + same request body = same response, no duplicate side effects. Keys expire after 24 hours.

### 2.6 Pagination

List endpoints return:

```json
{
  "data": [...],
  "pagination": {
    "cursor": "next_cursor_token",
    "has_more": true,
    "total": 142
  }
}
```

Default page size: 20. Maximum: 100. Cursor-based, not offset-based.

### 2.7 Timestamps

All timestamps in ISO 8601 with timezone: `2026-04-23T14:30:00Z`. Server stores UTC. Client converts for display.

---

## 3. Identity & Account module

**Base path:** `/auth`, `/accounts`, `/patients`

### 3.1 Authentication

| Method | Path | Description | Auth | Idempotent |
|---|---|---|---|---|
| POST | `/auth/otp/request` | Request OTP for phone/email | None | Yes |
| POST | `/auth/otp/verify` | Verify OTP, return session token | None | Yes |
| POST | `/auth/logout` | Invalidate session | Bearer | No |
| POST | `/auth/refresh` | Refresh session token | Bearer | Yes |

**POST /auth/otp/request**
```
Request:  { "phone": "+233201234567" } or { "email": "..." }
Response: { "otp_id": "uuid", "expires_in": 300, "channel": "sms" }
```

**POST /auth/otp/verify**
```
Request:  { "otp_id": "uuid", "code": "123456" }
Response: { "token": "jwt...", "account_id": "uuid", "account_type": "patient", "is_new_account": true }
```

### 3.2 Account management

| Method | Path | Description | Auth | Roles |
|---|---|---|---|---|
| POST | `/accounts` | Create account (after OTP verification) | Bearer | Self |
| GET | `/accounts/me` | Get own account | Bearer | Any |
| PATCH | `/accounts/me` | Update own account | Bearer | Any |
| GET | `/accounts/{id}` | Get account (admin) | Bearer | admin |
| POST | `/accounts/{id}/suspend` | Suspend account | Bearer | admin |
| POST | `/accounts/{id}/unsuspend` | Unsuspend account | Bearer | admin |

**POST /accounts**
```
Request: {
  "legal_name": "Kwame Mensah",
  "display_name": "Kwame",
  "date_of_birth": "1985-03-15",
  "sex": "male",
  "location": { "country": "GH", "region": "Greater Accra", "city": "Accra" },
  "language_preference": "en",
  "platform_consent": { "terms_version": "1.0", "evidence_type": "in_app_affirmation" }
}
Response: { "account_id": "uuid", "account_type": "patient", "onboarding_stage": "account_created" }
```

### 3.3 Patient profile

| Method | Path | Description | Auth | Roles |
|---|---|---|---|---|
| GET | `/patients/me` | Get own clinical profile | Bearer | patient, delegate (scoped) |
| PATCH | `/patients/me` | Update clinical profile | Bearer | patient |
| GET | `/patients/{id}` | Get patient profile | Bearer | clinician (assigned/audited), admin |
| GET | `/patients/search` | Search patients (clinician) | Bearer | clinician (audited with reason) |

**GET /patients/me**
```
Response: {
  "patient_id": "uuid",
  "pregnancy_status": "not_pregnant",
  "smoking_status": "never",
  "alcohol_use": "occasional",
  "emergency_contact": { "name": "Ama Mensah", "phone": "+233...", "relationship": "spouse" },
  "medication_list_completeness": "high",
  "herbal_medicine_completeness": "reported",
  "onboarding_stage": "program_enrolled",
  "conditions": [...],
  "allergies": [...],
  "active_medications": [...],
  "herbal_medicines": [...]
}
```

---

## 4. Consent & Access module

**Base path:** `/consents`, `/delegations`

### 4.1 Consent

| Method | Path | Description | Auth | Roles | Contract |
|---|---|---|---|---|---|
| POST | `/consents` | Grant consent | Bearer | patient, delegate (give_consent_on_behalf only) | CONSENT-001, FLOOR-004 |
| GET | `/consents` | List active consents | Bearer | patient, delegate (view_records) | |
| GET | `/consents/{id}` | Get consent detail | Bearer | patient, clinician (assigned) | |
| POST | `/consents/{id}/revoke` | Revoke consent | Bearer | patient only | CONSENT-002 |
| GET | `/consents/validate` | Check if consent exists for action | Bearer | Any (internal service call) | CONSENT-001 |

**POST /consents**
```
Request: {
  "consent_type": "care",
  "scope": { "program_id": "uuid" },
  "duration": "perpetual_until_revoked",
  "evidence_type": "in_app_affirmation",
  "terms_version": "1.0"
}
Response: { "consent_id": "uuid", "status": "active", "granted_at": "2026-04-23T14:30:00Z" }
```

**POST /consents/{id}/revoke**
```
Request: { "reason": "Patient requested" }
Response: { "consent_id": "uuid", "status": "revoked", "revoked_at": "...", "in_flight_actions": [
  { "type": "refill", "id": "uuid", "state": "SAFETY_HOLD", "reason": "abrupt_discontinuation_risk" }
] }
```

### 4.2 Delegation

| Method | Path | Description | Auth | Roles | Contract |
|---|---|---|---|---|---|
| POST | `/delegations` | Create delegation | Bearer | patient | FLOOR-005 |
| GET | `/delegations` | List delegations (own) | Bearer | patient, delegate | |
| PATCH | `/delegations/{id}` | Update delegation scope | Bearer | patient | FLOOR-005 |
| POST | `/delegations/{id}/revoke` | Revoke delegation | Bearer | patient, delegate (own) | |
| GET | `/delegations/{id}/scope-check` | Check if action is in scope | Bearer | system (internal) | FLOOR-006 |

**POST /delegations**
```
Request: {
  "delegate_id": "uuid",
  "relationship_type": "adult_child",
  "granted_scopes": ["view_records", "request_refills", "receive_notifications"],
  "sensitive_categories_granted": [],
  "consent_id": "uuid"
}
Response: { "delegation_id": "uuid", "status": "active", "created_at": "..." }
```

---

## 5. Care Delivery module

**Base path:** `/consults`, `/prescriptions`, `/refills`

### 5.1 Consults

| Method | Path | Description | Auth | Roles |
|---|---|---|---|---|
| POST | `/consults` | Initiate consult | Bearer | patient, delegate (book_consults) |
| GET | `/consults` | List consults (own or assigned) | Bearer | patient, delegate (view_records), clinician |
| GET | `/consults/{id}` | Get consult detail | Bearer | patient (own), clinician (assigned) |
| POST | `/consults/{id}/intake` | Submit intake form | Bearer | patient, delegate |
| POST | `/consults/{id}/claim` | Clinician claims case | Bearer | clinician |
| POST | `/consults/{id}/decision` | Record clinical decision | Bearer | clinician |
| POST | `/consults/{id}/escalate-to-sync` | Escalate async to sync | Bearer | clinician |
| GET | `/consults/queue` | Get review queue | Bearer | clinician |

**POST /consults**
```
Request: {
  "consult_type": "program_pathway",
  "modality": "async",
  "program_id": "uuid"
}
Requires: Active care consent for the program
Response: { "consult_id": "uuid", "state": "INITIATED", "intake_form_id": "uuid" }
```

**POST /consults/{id}/decision**
```
Request: {
  "decision_type": "prescribe",
  "rationale": "Patient meets criteria for metformin initiation...",
  "ai_recommendation_agreement": "agreed",
  "prescriptions": [{
    "medication_id": "uuid",
    "medication_name": "Metformin",
    "strength": "500mg",
    "formulation": "tablet",
    "dose_instructions": "1 tablet twice daily with meals",
    "quantity": 60,
    "refills_allowed": 5,
    "indication": "Type 2 diabetes management"
  }],
  "follow_up_plan": "Review in 4 weeks. Monitor blood glucose weekly."
}
Response: { "consult_id": "uuid", "state": "PRESCRIBED", "prescriptions_created": ["uuid"] }
```

### 5.2 Sync video

| Method | Path | Description | Auth | Roles |
|---|---|---|---|---|
| GET | `/consults/sync/slots` | Available clinician slots | Bearer | patient |
| POST | `/consults/sync/book` | Book sync appointment | Bearer | patient, delegate (book_consults) |
| POST | `/consults/sync/{id}/join` | Join video call (get room token) | Bearer | patient, clinician |
| POST | `/consults/sync/{id}/end` | End call | Bearer | patient, clinician |
| POST | `/consults/sync/{id}/summary` | Finalize post-visit summary | Bearer | clinician |

**POST /consults/sync/{id}/join**
```
Response: {
  "room_url": "https://video.telecheck.health/room/abc",
  "room_token": "jwt...",
  "patient_context": { ... },
  "scribe_enabled": true
}
```

### 5.3 Prescriptions

| Method | Path | Description | Auth | Roles |
|---|---|---|---|---|
| GET | `/prescriptions` | List prescriptions (own or patient's) | Bearer | patient, delegate (view_records), clinician |
| GET | `/prescriptions/{id}` | Get prescription detail | Bearer | patient (own), clinician |

### 5.4 Refills

| Method | Path | Description | Auth | Roles | Contract |
|---|---|---|---|---|---|
| POST | `/refills` | Request refill | Bearer | patient, delegate (request_refills) | |
| GET | `/refills` | List refills | Bearer | patient, delegate (view_records), clinician | |
| GET | `/refills/{id}` | Get refill detail | Bearer | patient (own), clinician, pharmacist | |
| POST | `/refills/{id}/approve` | Approve refill (clinician) | Bearer | clinician | SIGNAL-001 |
| POST | `/refills/{id}/approve-modified` | Approve with modification | Bearer | clinician | SIGNAL-001 |
| POST | `/refills/{id}/decline` | Decline refill | Bearer | clinician | |
| POST | `/refills/{id}/protocol-evaluate` | Trigger protocol evaluation | Bearer | system | SIGNAL-004, FLOOR-001 |

**POST /refills**
```
Request: { "prescription_id": "uuid" }
Headers: X-Acting-For: patient_id={target}&delegation_id={del} (if delegate)
Requires: Active prescription with refills remaining; identity/consent verification automatic
Response: { "refill_id": "uuid", "state": "REQUESTED", "prescription_id": "uuid" }
```

**POST /refills/{id}/approve**
```
Request: {
  "rationale": "Stable on current regimen. Labs normal.",
  "signal_acknowledgments": [
    { "signal_id": "uuid", "action": "acknowledged" }
  ],
  "signal_overrides": [
    { "signal_id": "uuid", "rationale": "Clinically appropriate given patient history." }
  ]
}
Response: { "refill_id": "uuid", "state": "APPROVED", "approved_at": "..." }
Triggers: Fulfillment queued, patient notified
```

---

## 6. Clinical Intelligence module

**Base path:** `/interactions`, `/herb-drug`, `/detection`

### 6.1 Interaction engine

| Method | Path | Description | Auth | Roles | Contract |
|---|---|---|---|---|---|
| POST | `/interactions/check` | Run interaction check | Bearer | clinician, system | SIGNAL-001 |
| GET | `/interactions/signals` | Get active signals for patient | Bearer | clinician, patient (simplified), pharmacist (dispensing context) | SIGNAL-002 |
| GET | `/interactions/signals/{id}` | Get signal detail | Bearer | clinician | |
| POST | `/interactions/signals/{id}/override` | Override signal | Bearer | clinician | SIGNAL-003 |

**POST /interactions/check**
```
Request: {
  "patient_id": "uuid",
  "medication_id": "uuid",
  "trigger_event": "new_prescription"
}
Response: {
  "signals": [
    {
      "signal_id": "uuid",
      "source_engine": "medication_interaction",
      "check_class": "drug_drug",
      "severity": "major",
      "mechanism": "Metformin + [Drug B]: increased risk of lactic acidosis in renal impairment.",
      "recommended_action": "warn",
      "evidence_source": "PharmDB v3.2",
      "confidence": "high",
      "affected_entities": [
        { "type": "medication", "id": "uuid", "name": "Metformin" },
        { "type": "medication", "id": "uuid", "name": "Drug B" }
      ]
    }
  ],
  "engine_version": "1.0.3",
  "knowledge_base_version": "2026-04-01",
  "execution_time_ms": 450
}
```

### 6.2 Herb-drug engine

| Method | Path | Description | Auth | Roles |
|---|---|---|---|---|
| POST | `/herb-drug/check` | Run herb-drug check | Bearer | clinician, system |
| GET | `/herb-drug/preparations` | List known preparations | Bearer | clinician, patient |
| GET | `/herb-drug/preparations/{id}` | Get preparation detail | Bearer | clinician, patient |

### 6.3 Fake medication detection

| Method | Path | Description | Auth | Roles |
|---|---|---|---|---|
| POST | `/detection/check` | Run authenticity check | Bearer | pharmacist, system |
| GET | `/detection/signals/{id}` | Get detection signal | Bearer | pharmacist |
| POST | `/detection/signals/{id}/resolve` | Record pharmacist decision | Bearer | pharmacist |

---

## 7. Pharmacy & Fulfillment module

**Base path:** `/pharmacy`

| Method | Path | Description | Auth | Roles | Contract |
|---|---|---|---|---|---|
| GET | `/pharmacy/queue` | Get fulfillment queue | Bearer | pharmacist | |
| POST | `/pharmacy/fulfillments/{id}/claim` | Claim order | Bearer | pharmacist | |
| POST | `/pharmacy/fulfillments/{id}/release` | Release medication | Bearer | pharmacist | FLOOR-002 |
| POST | `/pharmacy/fulfillments/{id}/hold` | Hold medication | Bearer | pharmacist | |
| POST | `/pharmacy/fulfillments/{id}/exception` | Record exception | Bearer | pharmacist | |
| POST | `/pharmacy/fulfillments/{id}/dispatch` | Dispatch for delivery | Bearer | pharmacist | |
| POST | `/pharmacy/fulfillments/{id}/confirm-delivery` | Confirm delivery | Bearer | system (delivery partner webhook) | |
| POST | `/pharmacy/fulfillments/{id}/confirm-pickup` | Confirm pickup | Bearer | pharmacist | |
| POST | `/pharmacy/substitution` | Request substitution | Bearer | pharmacist | |
| GET | `/pharmacy/orders` | Patient's order history | Bearer | patient, delegate (view_records) | |
| GET | `/pharmacy/orders/{id}` | Order detail with tracking | Bearer | patient, pharmacist | |

**POST /pharmacy/fulfillments/{id}/release**
```
Request: {
  "verification": {
    "medication_correct": true,
    "label_accurate": true,
    "no_new_signals": true,
    "counterfeit_check_passed": true,
    "pharmacist_sign_off": true
  }
}
Guards: All verification fields must be true. If counterfeit_check_passed is false, release is blocked.
Response: { "fulfillment_id": "uuid", "state": "RELEASED", "released_at": "..." }
```

---

## 8. Labs & Documents module

**Base path:** `/labs`, `/documents`

| Method | Path | Description | Auth | Roles |
|---|---|---|---|---|
| POST | `/labs/upload` | Upload lab file/image | Bearer | patient, delegate (upload_documents) |
| POST | `/labs/manual-entry` | Enter lab values manually | Bearer | patient |
| GET | `/labs/uploads/{id}/extraction` | Get extracted values for confirmation | Bearer | patient |
| POST | `/labs/uploads/{id}/confirm` | Confirm/correct extracted values | Bearer | patient |
| GET | `/labs` | Lab timeline | Bearer | patient, delegate (view_records), clinician |
| GET | `/labs/{id}` | Lab result detail with interpretation | Bearer | patient, clinician |
| GET | `/labs/trends` | Lab trends (time series) | Bearer | patient, clinician |
| POST | `/labs/{id}/review` | Clinician reviews lab interpretation | Bearer | clinician |
| POST | `/documents/upload` | Upload non-lab document | Bearer | patient, delegate |
| GET | `/documents` | Document list | Bearer | patient, clinician |

**POST /labs/upload**
```
Request: multipart/form-data { file: <image/pdf>, type: "lab_result" }
Response: { "upload_id": "uuid", "state": "PROCESSING", "estimated_time_seconds": 15 }
```

**POST /labs/uploads/{id}/confirm**
```
Request: {
  "confirmed_values": [
    { "test_name": "HbA1c", "value": 7.2, "unit": "%", "corrected_from": 7.8 },
    { "test_name": "Fasting glucose", "value": 126, "unit": "mg/dL" }
  ]
}
Response: { "upload_id": "uuid", "state": "CONFIRMED", "lab_result_ids": ["uuid", "uuid"] }
Triggers: Interaction engine re-evaluation if drug-lab relevance exists
```

---

## 9. RPM & CCM module

**Base path:** `/rpm`

| Method | Path | Description | Auth | Roles |
|---|---|---|---|---|
| POST | `/rpm/enrollments` | Enroll in program | Bearer | patient (with clinician assignment) |
| GET | `/rpm/enrollments` | List enrollments | Bearer | patient, clinician |
| GET | `/rpm/enrollments/{id}` | Enrollment detail with care plan | Bearer | patient, clinician |
| POST | `/rpm/metrics` | Submit metric reading | Bearer | patient |
| GET | `/rpm/metrics` | Metric history | Bearer | patient, clinician |
| GET | `/rpm/dashboard` | RPM dashboard (patient) | Bearer | patient |
| GET | `/rpm/panel` | Clinician RPM panel | Bearer | clinician |
| GET | `/rpm/alerts` | Alerts for clinician | Bearer | clinician |
| POST | `/rpm/alerts/{id}/acknowledge` | Acknowledge alert | Bearer | clinician |
| POST | `/rpm/alerts/{id}/action` | Take action on alert | Bearer | clinician |
| POST | `/rpm/alerts/{id}/snooze` | Snooze non-critical alert | Bearer | clinician |
| PATCH | `/rpm/enrollments/{id}/care-plan` | Update care plan | Bearer | clinician |

**POST /rpm/metrics**
```
Request: {
  "enrollment_id": "uuid",
  "metric_type": "blood_glucose_fasting",
  "value": 142,
  "unit": "mg/dL",
  "source": "manual",
  "recorded_at": "2026-04-23T07:30:00Z"
}
Response: {
  "entry_id": "uuid",
  "plausibility_flag": false,
  "alert_generated": {
    "alert_id": "uuid",
    "severity": "warning",
    "message": "Fasting glucose 142 mg/dL exceeds target of 130 mg/dL"
  }
}
```

---

## 10. Community module

**Base path:** `/community`

| Method | Path | Description | Auth | Roles |
|---|---|---|---|---|
| GET | `/community/groups` | List available groups | Bearer | patient |
| GET | `/community/groups/mine` | List joined groups | Bearer | patient |
| POST | `/community/groups/{id}/join` | Join group | Bearer | patient |
| POST | `/community/groups/{id}/leave` | Leave group | Bearer | patient |
| GET | `/community/groups/{id}/feed` | Group post feed | Bearer | patient (member) |
| POST | `/community/groups/{id}/posts` | Create post | Bearer | patient (member) |
| POST | `/community/posts/{id}/react` | React to post | Bearer | patient (member) |
| POST | `/community/posts/{id}/report` | Report post | Bearer | patient |
| GET | `/community/moderation/queue` | Moderation queue | Bearer | moderator |
| POST | `/community/moderation/{post_id}/action` | Moderate post | Bearer | moderator |
| POST | `/community/moderation/{post_id}/appeal-response` | Respond to appeal | Bearer | moderator |

**POST /community/groups/{id}/posts**
```
Request: {
  "content": "Has anyone else experienced dizziness with their medication?",
  "anonymous": true,
  "photo_ids": []
}
Response: {
  "post_id": "uuid",
  "moderation_status": "pending_screening",
  "screening_result": "pass",
  "published": true
}
Note: Content passes through automated screening before publishing.
      Crisis detection runs independently (FLOOR-017).
```

---

## 11. AI Service

**Base path:** `/ai`

| Method | Path | Description | Auth | Roles | Contract |
|---|---|---|---|---|---|
| POST | `/ai/chat` | Send message to Mode 1 assistant | Bearer | patient | FLOOR-007 through FLOOR-013 |
| GET | `/ai/sessions` | List chat sessions | Bearer | patient, clinician (read-only) | |
| GET | `/ai/sessions/{id}` | Get session history | Bearer | patient, clinician (read-only) | FLOOR-020 |
| POST | `/ai/prepare-case` | Mode 2: prepare async case | Bearer | system (internal) | |
| POST | `/ai/interpret-labs` | Interpret lab values | Bearer | system (internal) | |
| POST | `/ai/transcribe` | Start scribe session | Bearer | system (internal) | |
| POST | `/ai/scan-food` | Scan food image | Bearer | patient | |

**POST /ai/chat**
```
Request: {
  "session_id": "uuid" (or null for new session),
  "message": "Can you explain what my HbA1c of 7.2 means?",
  "context": { "screen": "lab_detail", "lab_result_id": "uuid" }
}
Response: {
  "session_id": "uuid",
  "response": {
    "text": "An HbA1c of 7.2% means your average blood sugar...",
    "source_type": "ai",
    "guardrail_template_id": "conservative_default",
    "guardrail_version": "1.0",
    "ai_model_version": "claude-sonnet-4-20250514",
    "references": [
      { "type": "lab_result", "id": "uuid" }
    ],
    "escalation_triggered": false,
    "crisis_detected": false
  }
}
Every response includes source_type: "ai" (FLOOR-007).
Every response is audited (FLOOR-020).
```

**POST /ai/prepare-case**
```
Request: {
  "consult_id": "uuid",
  "intake_data": { ... },
  "patient_context": {
    "medications": [...],
    "conditions": [...],
    "allergies": [...],
    "herbal_medicines": [...],
    "recent_labs": [...],
    "interaction_signals": [...]
  }
}
Response: {
  "summary_id": "uuid",
  "recommendation": "prescribe",
  "confidence": "high",
  "clinical_summary": "Patient is a 38-year-old male presenting with...",
  "concerns": ["Mild renal function trend noted..."],
  "signals_evaluated": 3,
  "protocol_id": "glp1_renewal_v1",
  "protocol_version": "1.0"
}
```

---

## 12. Notification & Communications module

**Base path:** `/notifications`

| Method | Path | Description | Auth | Roles |
|---|---|---|---|---|
| GET | `/notifications` | List notifications (inbox) | Bearer | patient, clinician |
| GET | `/notifications/{id}` | Get notification detail | Bearer | patient, clinician |
| POST | `/notifications/{id}/read` | Mark as read | Bearer | patient, clinician |
| GET | `/notifications/preferences` | Get notification preferences | Bearer | patient, clinician |
| PATCH | `/notifications/preferences` | Update preferences | Bearer | patient, clinician |
| POST | `/notifications/send` | Send notification (internal) | Bearer | system | |

---

## 13. Payment & Billing module

**Base path:** `/payments`, `/subscriptions`

| Method | Path | Description | Auth | Roles |
|---|---|---|---|---|
| POST | `/payments/collect` | Collect payment | Bearer | patient, delegate (make_payments) |
| GET | `/payments` | Payment history | Bearer | patient |
| GET | `/payments/{id}` | Payment detail / receipt | Bearer | patient |
| POST | `/payments/{id}/refund` | Process refund | Bearer | admin, support_lead |
| POST | `/subscriptions` | Create subscription | Bearer | patient |
| GET | `/subscriptions` | List subscriptions | Bearer | patient |
| PATCH | `/subscriptions/{id}` | Pause/cancel subscription | Bearer | patient |

**POST /payments/collect**
```
Request: {
  "amount": 50.00,
  "currency": "GHS",
  "type": "consultation_fee",
  "reference_id": "uuid" (consult_id or refill_id),
  "method": "mobile_money",
  "provider": "mtn_momo",
  "phone": "+233201234567"
}
Response: {
  "payment_id": "uuid",
  "status": "pending",
  "provider_reference": "momo_ref_abc",
  "estimated_confirmation_seconds": 30
}
Note: Mobile money payments are async — status confirmed via webhook.
```

---

## 14. Governance & Configuration module

**Base path:** `/governance`

| Method | Path | Description | Auth | Roles | Contract |
|---|---|---|---|---|---|
| GET | `/governance/packs/{market}` | Get active Market Pack | Bearer | Any (feature gating) | MKT-001 |
| GET | `/governance/packs/{market}/history` | Pack version history | Bearer | admin | MKT-002 |
| POST | `/governance/packs/{market}/transition` | Change Pack state | Bearer | country_launch_director | MKT-003 |
| POST | `/governance/packs/{market}/emergency-safe-mode` | Enter Emergency Safe Mode | Bearer | country_launch_director, support_lead | INCIDENT-001 |
| GET | `/governance/protocols` | List protocols | Bearer | admin, clinical_governance_lead |
| POST | `/governance/protocols/{id}/activate` | Activate protocol | Bearer | clinical_governance_lead | PROTO-001 |
| POST | `/governance/protocols/{id}/deactivate` | Deactivate protocol | Bearer | clinical_governance_lead | PROTO-004 |
| GET | `/governance/guardrails` | List guardrail templates | Bearer | admin, ai_safety_lead |
| POST | `/governance/guardrails/{id}/deploy` | Deploy template | Bearer | ai_safety_lead | GUARD-002 |
| POST | `/governance/guardrails/revert-to-default` | Revert to Conservative Default | Bearer | ai_safety_lead | GUARD-003 |
| GET | `/governance/moderation-policies` | List policies | Bearer | admin |
| POST | `/governance/moderation-policies/{id}/deploy` | Deploy policy | Bearer | admin | |
| GET | `/governance/readiness/{market}` | Readiness checklist | Bearer | admin | |
| GET | `/governance/evidence/{market}` | Evidence locker | Bearer | admin | |

**POST /governance/packs/{market}/emergency-safe-mode**
```
Request: {
  "reason": "Critical safety incident — interaction engine producing false negatives",
  "authorization": { "role": "country_launch_director", "confirmed": true }
}
Response: {
  "market": "GH",
  "previous_state": "FULL_LAUNCH",
  "new_state": "EMERGENCY_SAFE_MODE",
  "reverted": {
    "protocols_deactivated": 3,
    "guardrails_reverted_to_default": true,
    "moderation_reverted_to_strictest": true
  },
  "effective_at": "2026-04-23T14:30:00Z"
}
Takes effect within 60 seconds (INCIDENT-003).
```

---

## 15. Audit module

**Base path:** `/audit`

| Method | Path | Description | Auth | Roles | Contract |
|---|---|---|---|---|---|
| GET | `/audit/trail` | Query audit trail | Bearer | clinician (own patients), admin | AUDIT-001 |
| GET | `/audit/trail/{entity_type}/{entity_id}` | Audit trail for specific entity | Bearer | clinician (assigned), admin | |
| POST | `/audit/export` | Export audit data (regulatory) | Bearer | admin | AUDIT-003 |

**GET /audit/trail**
```
Query params: entity_type, entity_id, actor_id, date_from, date_to, market, action, cursor, limit
Response: {
  "records": [
    {
      "audit_id": "uuid",
      "entity_type": "refill",
      "entity_id": "uuid",
      "action": "state_changed",
      "actor_id": "uuid",
      "actor_type": "clinician",
      "previous_state": "CLINICIAN_REVIEW",
      "new_state": "APPROVED",
      "context": {
        "signals_evaluated": 2,
        "overrides": [{ "signal_id": "uuid", "rationale": "..." }],
        "consent_id": "uuid",
        "market": "GH",
        "pack_version": 1
      },
      "timestamp": "2026-04-23T14:30:00Z"
    }
  ],
  "pagination": { "cursor": "...", "has_more": true }
}
```

---

## 16. Adverse Event Reporting

**Base path:** `/adverse-events`

| Method | Path | Description | Auth | Roles |
|---|---|---|---|---|
| POST | `/adverse-events` | Report adverse event | Bearer | patient, clinician, pharmacist |
| GET | `/adverse-events` | List adverse events (assigned) | Bearer | clinician |
| GET | `/adverse-events/{id}` | Get AE detail | Bearer | clinician (assigned) |
| POST | `/adverse-events/{id}/classify` | Classify severity and causality | Bearer | clinician |
| POST | `/adverse-events/{id}/report-external` | Submit external report | Bearer | clinician, admin |
| GET | `/adverse-events/patterns` | Pattern analysis | Bearer | clinical_governance_lead |

---

## 17. Health check

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/health` | Platform health check | None |
| GET | `/health/detailed` | Detailed module health | Bearer (admin) |

**GET /health**
```
Response: { "status": "healthy", "timestamp": "2026-04-23T14:30:00Z" }
```

**GET /health/detailed**
```
Response: {
  "status": "healthy",
  "modules": {
    "identity": "healthy",
    "consent": "healthy",
    "care_delivery": "healthy",
    "clinical_intelligence": "healthy",
    "pharmacy": "healthy",
    "labs": "healthy",
    "rpm": "healthy",
    "community": "healthy",
    "ai_service": "degraded",
    "notifications": "healthy",
    "payments": "healthy",
    "governance": "healthy",
    "audit": "healthy"
  },
  "ai_service_note": "LLM provider latency elevated (p95: 4.2s, target: 2s)"
}
```

---

## 19. Tenant Configuration module (NEW in v0.2)

Per ADR-023 multi-tenancy Model A. All endpoints below are platform-scoped (Platform Admin role required) unless otherwise noted.

### 19.1 List tenants

```
GET /v0/tenants
Authorization: required (Platform Admin)
Query: ?country=<ISO>&status=<active|suspended>&q=<search>&limit=<n>&cursor=<token>

Response 200:
{
  "tenants": [
    { "id": "tnt_<ULID>", "display_name": "...", "country": "US", "status": "active", "active_patients": 12847, "mrr": 342000, "created_at": "..." }
  ],
  "next_cursor": "..."
}
```

### 19.2 Get tenant

```
GET /v0/tenants/{tenantId}
Authorization: required (Platform Admin OR Tenant Owner of this tenant)

Response 200: TenantContext (per TYPES v5.1)
```

### 19.3 Create tenant

```
POST /v0/tenants
Authorization: required (Platform Admin only)
Idempotency-Key: required

Body:
{
  "display_name": "Heros Health",
  "country": "US",
  "brand": { "primary_color": "...", "logo_url": "...", ... },
  "active_adapters": { "payment_provider": "stripe", "pharmacy_providers": ["truepill"], ... },
  "initial_owner_email": "..."
}

Response 201: TenantContext + invitation status for initial owner
```

### 19.4 Update tenant configuration

```
PATCH /v0/tenants/{tenantId}
Authorization: required (Tenant Owner OR Tenant Admin OR Platform Admin)
Note: Platform-restricted fields (country, status) require Platform Admin

Body: partial TenantContext (excluding immutable fields)
Response 200: updated TenantContext
```

### 19.5 Initiate break-glass session

```
POST /v0/tenants/{tenantId}/break-glass
Authorization: required (Platform Admin)

Body:
{
  "reason": "Investigating reported subscription billing anomaly",
  "duration_hours": 4,
  "scope": "subscriptions_read | full_tenant_data"
}

Response 201:
{
  "session_id": "...",
  "authorized_until": "<ISO 8601>",
  "tenant_owner_notified": true,
  "privacy_officer_review_required": true
}
```

### 19.6 List country profiles

```
GET /v0/country-profiles
Authorization: required (Platform Admin)

Response 200:
{
  "country_profiles": [
    { "country": "US", "available_adapters": {...}, ... },
    { "country": "GH", "available_adapters": {...}, ... }
  ]
}
```

---

## 20. Subscriptions module (NEW in v0.2)

All endpoints below operate within the requestor's authorized tenant scope per RBAC v1.1.

### 20.1 List subscriptions

```
GET /v0/subscriptions
Authorization: required (tenant-scoped: Tenant Admin / Tenant Operator / Tenant Billing for tenant-wide; Patient for own)
Query: ?status=<state>&product_id=<id>&patient_id=<id>&limit=<n>&cursor=<token>

Response 200:
{
  "subscriptions": [
    { "id": "sub_<ULID>", "patient_id": "...", "product_id": "...", "status": "ACTIVE", "next_renewal_at": "...", ... }
  ],
  "next_cursor": "..."
}
```

### 20.2 Get subscription

```
GET /v0/subscriptions/{subscriptionId}
Authorization: required (tenant-scoped; subscription owner or tenant operator)

Response 200: full Subscription record per CDM v1.2 §4.7
```

### 20.3 Pause subscription

```
POST /v0/subscriptions/{subscriptionId}/pause
Authorization: required (subscription owner; or tenant operator)
Idempotency-Key: required

Body:
{
  "reason": "travel | financial | side_effects | break | other",
  "pause_until": "<ISO 8601 — max 90 days from now>",
  "notes": "..."
}

Response 200: updated Subscription with status=PAUSED
Errors:
  400 INVALID_PAUSE_DURATION (>90 days)
  409 INVALID_STATE_TRANSITION (subscription not in ACTIVE)
```

### 20.4 Resume subscription

```
POST /v0/subscriptions/{subscriptionId}/resume
Authorization: required (subscription owner; or tenant operator)
Idempotency-Key: required

Response 200: updated Subscription with status=ACTIVE
```

### 20.5 Switch product

```
POST /v0/subscriptions/{subscriptionId}/switch
Authorization: required (subscription owner; or tenant operator on behalf with delegate_context)
Idempotency-Key: required

Body:
{
  "new_product_id": "prd_<ULID>",
  "reason": "side_effects | preference | clinical_recommendation | other",
  "notes": "..."
}

Response 202: Subscription with status=SWITCHING + clinical review case ID
Note: Switch always requires clinician review; not protocol-authorized at launch
```

### 20.6 Cancel subscription

```
POST /v0/subscriptions/{subscriptionId}/cancel
Authorization: required (subscription owner; or tenant operator with delegate_context)
Idempotency-Key: required

Body:
{
  "reason": "side_effects | financial | not_seeing_results | other | no_reason",
  "feedback": "...",
  "deflection_attempted": true | false,
  "deflection_outcome": "patient_continued_to_cancel | patient_chose_alternative | patient_chose_pause"
}

Response 200: Subscription with status=CANCELLATION_PENDING
```

### 20.7 Subscription event history

```
GET /v0/subscriptions/{subscriptionId}/events
Authorization: required (subscription owner or tenant operator)

Response 200:
{
  "events": [
    { "id": "sue_<ULID>", "event_type": "activated", "actor": {...}, "occurred_at": "...", "event_data": {...} },
    ...
  ]
}
```

---

## 21. Product Catalog module (NEW in v0.2)

### 21.1 List products

```
GET /v0/products
Authorization: required (tenant-scoped; readable by Patient for active products, by Tenant Admin/Operator/Marketing for full catalog)
Query: ?program=<program>&category=<cat>&status=<active|out_of_stock|discontinued>

Response 200: array of ProductCatalog records per CDM v1.2 §4.9
```

### 21.2 Get product

```
GET /v0/products/{productId}
Authorization: required (tenant-scoped)
Response 200: ProductCatalog record
```

### 21.3 Create product

```
POST /v0/products
Authorization: required (Tenant Admin OR Tenant Clinical Lead — clinical fields require Clinical Lead approval per RBAC v1.1)
Idempotency-Key: required

Body: ProductCatalog (without id, timestamps)
Response 201: ProductCatalog with id assigned
```

### 21.4 Update product

```
PATCH /v0/products/{productId}
Authorization: required (Tenant Admin or Tenant Clinical Lead per field)
Body: partial ProductCatalog
Response 200: updated ProductCatalog
```

### 21.5 Bulk import products

```
POST /v0/products/bulk-import
Authorization: required (Tenant Admin)
Idempotency-Key: required

Body (multipart/form-data):
  file: <CSV>
  validate_only: <bool>

Response 200:
{
  "validated_count": 47,
  "imported_count": 47,
  "errors": []
}
```

---

## 22. Carts module (NEW in v0.2)

### 22.1 Create cart

```
POST /v0/carts
Authorization: required (patient or delegate)
Idempotency-Key: required

Body: { "intake_submission_id": "..." | null }
Response 201: empty Cart with id and expires_at
```

### 22.2 Add item to cart

```
POST /v0/carts/{cartId}/items
Authorization: required (cart owner or delegate)
Idempotency-Key: required

Body:
{
  "product_id": "prd_<ULID>",
  "quantity": 1,
  "cadence": "monthly | quarterly | one_time"
}

Response 201: CartItem
Errors: 409 PRODUCT_OUT_OF_STOCK | 422 PRODUCT_NOT_ELIGIBLE_FOR_PATIENT
```

### 22.3 Remove cart item

```
DELETE /v0/carts/{cartId}/items/{itemId}
Authorization: required (cart owner or delegate)
Response 204
```

### 22.4 Get cart

```
GET /v0/carts/{cartId}
Authorization: required (cart owner, delegate, or tenant operator)

Response 200: Cart with items and computed pricing
{
  "cart": Cart,
  "items": [CartItem],
  "subtotal": ..., "discounts": ..., "tax": ..., "total": ...,
  "applied_discount_codes": [...]
}
```

### 22.5 Apply discount code

```
POST /v0/carts/{cartId}/apply-discount
Authorization: required (cart owner)
Idempotency-Key: required

Body: { "code": "WELCOME20" }
Response 200: updated cart pricing
Errors: 404 DISCOUNT_NOT_FOUND | 410 DISCOUNT_EXPIRED | 409 DISCOUNT_NOT_APPLICABLE
```

### 22.6 Checkout

```
POST /v0/carts/{cartId}/checkout
Authorization: required (cart owner)
Idempotency-Key: required

Body:
{
  "payment_method_id": "...",
  "shipping_preference": "standard | expedited",
  "consent_acknowledgments": [...]
}

Response 202:
{
  "cart_status": "checked_out",
  "subscriptions_created": ["sub_<ULID>", ...],
  "one_time_orders_created": ["..."],
  "clinical_review_required": true | false
}
```

---

## 23. Discount codes module (NEW in v0.2)

### 23.1 List discount codes (Tenant Admin)

```
GET /v0/discount-codes
Authorization: required (Tenant Admin or Tenant Marketing or Tenant Billing)
Query: ?status=<status>&q=<search>

Response 200: array of DiscountCode
```

### 23.2 Create discount code

```
POST /v0/discount-codes
Authorization: required (Tenant Admin or Tenant Marketing or Tenant Billing)
Idempotency-Key: required

Body: DiscountCode (without id)
Response 201: DiscountCode
```

### 23.3 Validate discount code (patient-facing)

```
GET /v0/discount-codes/{code}/validate
Authorization: required (patient with cart context)
Query: ?cart_id=<id>

Response 200:
{ "valid": true, "discount_amount": ..., "applies_to": [...] }
or 200:
{ "valid": false, "reason": "EXPIRED | NOT_APPLICABLE_TO_CART | EXHAUSTED | ..." }
```

### 23.4 Disable discount code

```
POST /v0/discount-codes/{discountCodeId}/disable
Authorization: required (Tenant Admin or Tenant Marketing or Tenant Billing)
Body: { "reason": "..." }
Response 200: DiscountCode with status=disabled
```

---

## 24. Affiliates module (NEW in v0.2)

### 24.1 List affiliate accounts

```
GET /v0/affiliate-accounts
Authorization: required (Tenant Admin or Tenant Marketing)
Response 200: array of AffiliateAccount
```

### 24.2 Create affiliate account

```
POST /v0/affiliate-accounts
Authorization: required (Tenant Admin or Tenant Marketing)
Idempotency-Key: required

Body: AffiliateAccount (without id)
Response 201: AffiliateAccount
```

### 24.3 Track affiliate click (anonymous)

```
POST /v0/affiliates/track-click
Authorization: optional (cookie-based attribution)
Body: { "slug": "...", "utm": {...}, "referrer": "..." }
Response 200: { "tracking_id": "..." }
Note: Sets attribution cookie scoped to tenant subdomain
```

### 24.4 List conversions

```
GET /v0/affiliate-conversions
Authorization: required (Tenant Admin or Tenant Marketing)
Query: ?affiliate_account_id=<id>&commission_status=<status>&from=<date>&to=<date>

Response 200: array of AffiliateConversion
```

### 24.5 Trigger payout batch

```
POST /v0/affiliates/payouts/batch
Authorization: required (Tenant Billing)
Idempotency-Key: required

Body: { "affiliate_account_ids": [...], "max_amount": ... }
Response 202: payout batch with per-affiliate results
Note: US uses Stripe Connect; Ghana is manual reconciliation at launch — for Ghana, returns pending-manual list rather than executing
```

---

## 25. Endpoint summary (updated for v0.2)

| Module | Endpoints | Critical-path | Notes |
|---|---|---|---|
| Identity & Account | 14 | 6 | Auth flow is launch day hour 0 |
| Consent & Access | 10 | 7 | Every clinical action depends on this |
| Care Delivery | 22 | 14 | Core clinical workflow |
| Clinical Intelligence | 10 | 4 | Interaction check is on every prescribe/refill |
| Pharmacy & Fulfillment | 11 | 8 | End-to-end fulfillment |
| Labs & Documents | 10 | 6 | Upload → confirm → interpret |
| RPM & CCM | 12 | 6 | Metric submission and alert handling |
| Community | 11 | 4 | Post lifecycle and moderation |
| AI Service | 7 | 3 | Chat, prepare-case, interpret-labs |
| Notifications | 6 | 2 | Inbox and preferences |
| Payments | 7 | 3 | Collect, refund, subscriptions |
| Governance | 14 | 6 | Pack management, emergency safe mode |
| Audit | 3 | 2 | Trail query and export |
| Adverse Events | 6 | 3 | Report, classify, external report |
| Health | 2 | 1 | Basic health check |
| **Tenant Configuration (v0.2)** | 6 | 3 | Tenant CRUD + break-glass + country profiles |
| **Subscriptions (v0.2)** | 7 | 5 | Pause, resume, switch, cancel + history |
| **Product Catalog (v0.2)** | 5 | 3 | CRUD + bulk import |
| **Carts (v0.2)** | 6 | 4 | Cart lifecycle + checkout |
| **Discount Codes (v0.2)** | 4 | 2 | Codes + validation |
| **Affiliates (v0.2)** | 5 | 2 | Accounts + tracking + payouts |
| **Total** | **178** (was 145; +33) | **94** (was 75; +19) | |

---

## v1.10 cycle additions (added 2026-05-02 per v1.10.1 hygiene cycle physical merge of `Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` Group 5B §OpenAPI rows 28, 74)

### Tenant identifier convention (Row 28 — C3 brand-structure refresh)

All path templates and example values using `Heros-Health` as a tenant identifier MUST use `Telecheck-US`. Sweep:

- `/tenants/{tenant_id}/...` — example values use `Telecheck-US` and `Telecheck-Ghana`, never `Heros-Health` or `heros`.
- Payload examples — `tenant_id: "tnt_<ULID>"` is the canonical type; the human-readable identifier `Telecheck-US` may appear in `tenant.id` examples per CDM v1.2 §Tenant entity refresh.
- Patient-facing surfaces (notifications, app shell, marketing copy) source from `tenant.consumer_dba` (Heros Health / Heros Health Ghana), never from `tenant.id`.

### Research data endpoints (Row 74 — NEW per ADR-028)

All endpoints below are tenant-scoped per I-023; export endpoints emit at `audit_sensitivity_level = high_pii` per I-031.

| Method + path | Purpose | Auth role | Audit class | Notes |
|---|---|---|---|---|
| `POST /research/consents/grant` | Grant 5th-tier research data-use consent. | Patient (or authorized delegate) | **B + audit_sensitivity_level=standard** *(updated 2026-05-02 per Codex Round-12 Scope 1 MEDIUM-1 — was previously Category A; AUDIT_EVENTS v5.2 §5 classifies research consent events as Category B governance with standard sensitivity per the Round-10 audit-sensitivity reconciliation)* | Guards: CCR `research_data_partnership_active != inactive`; consent text version match; asymmetric retraction acknowledgment. Emits `research_consent.granted` + `research.consent_granted`. Per I-030, MUST NOT cascade to care-delivery. |
| `POST /research/consents/revoke` | Revoke 5th-tier research consent. | Patient (or authorized delegate) | **B + audit_sensitivity_level=standard** *(updated 2026-05-02 per Codex Round-12 Scope 1 MEDIUM-1)* | Emits `research_consent.revoked` + `research.consent_revoked`. Cohort definition module excludes patient from future cohorts; in-flight cohorts dependent on this patient suspended. |
| `POST /research/cohort-definitions` | Create a cohort definition (operator surface; tenant-scoped). | Research Data Steward | B + audit_sensitivity_level=standard | Cohort definitions versioned, audited via `research.cohort_defined`; reviewed against active DSA permitted_data_domains subset. |
| `GET /research/cohort-definitions/{cohort_definition_id}` | Retrieve cohort definition. | Research Data Steward, Research Ethics Committee Member (read-only) | C | |
| `POST /research/exports/initiate` | Initiate research data export pipeline. | Research Data Steward | **B + audit_sensitivity_level=high_pii** *(updated 2026-05-02 per Codex Round-12 Scope 1 MEDIUM-1 — Category B with high_pii sensitivity per AUDIT_EVENTS v5.2 §5 + I-031; was previously Category A which conflated sensitivity with category)* | **Initiation-time reject-unless guard (added 2026-05-02 per Codex Round-10 Scope 3 HIGH-1 finding; per-export multi-party grant requirement added 2026-05-02 per Codex Round-11 Scope 3 HIGH-1 finding — closes the gap where initiation could run without per-export multi-party signer attestation per ADR-028 v0.4 quad sign-off + WORKLOAD_TAXONOMY governance class):** the endpoint MUST reject the request UNLESS ALL of: (a) CCR `research_data_partnership_active = active` for the patient cohort's `country_of_care` (Stage 2 activation passed per MARKET_LAUNCH v5.1); (b) the referenced `DataSharingAgreement` is `active` AND in scope (`permitted_data_domains` covers the cohort's data domains AND DSA scope is a subset of the country-level CCR `research_permitted_data_domains` AND `validity_to >= now`); (c) Stage 2 activation evidence is recorded in the activation audit chain (ADR-028 v0.4 quad sign-off + Country Launch Director sign-off + REC concurrence per `per_dsa_review_required`); (d) `k_min_required` ≥ CCR `k_min_default`; (e) cohort definition's `requested_data_domains` is a subset of the DSA's `permitted_data_domains`; **(f) per-export multi-party grant: a `PolicyAuthorization` reference (per TYPES v5.2 + GOVERNANCE_CONTROLS v5.2 §8 placeholder) OR an explicit named-equivalent grant artifact (e.g., `research_export_authorized_signers` roster attestation evidence-locker ID per CCR_RUNTIME v5.2 + Cockpit research block) MUST be present and unexpired. The grant MUST attest the configured multi-party signer chain for that export — at minimum the ADR-028 v0.4 quad (Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer + Product Lead) plus REC concurrence where `per_dsa_review_required = true`. The grant artifact ID is recorded in the request payload and re-validated at `complete` time per the I-029 5-condition gate.** If ANY guard fails, the endpoint rejects with a structured error naming the failed condition; no `research.export_initiated` event emits and no de-identification work begins. Mirror this guard in the STATE_MACHINES ResearchExportRequest `queued → processing` transition. On success (all guards pass): emits `research.export_initiated` at `audit_sensitivity_level = high_pii`. Begins de-identification + k-anonymity computation. |
| `POST /research/exports/{export_id}/complete` | Complete (or fail) export per I-029 verification. | System (export pipeline) | **B + audit_sensitivity_level=high_pii** *(updated 2026-05-02 per Codex Round-12 Scope 1 MEDIUM-1)* | Per I-029, the completion gate MUST verify ALL of: (1) `dsa_status_at_export = active` (DSA still active at completion-time check); (2) `k_threshold_actual >= k_min_required` (k-anonymity verified at de-identification output); (3) `permitted_data_domains_at_export` matches the `research.export_initiated` snapshot (no CCR drift mid-export); (4) **`consent_cohort_snapshot_hash` at completion-time matches the hash recorded at `research.export_initiated`** — any change indicates a mid-export consent revocation; (5) **every contributing patient has an active `ResearchConsent` (`status = granted`, no `revoked_at`)** at completion-time evaluation, scoped to the cohort definition. **Per-export grant re-validation at completion (added 2026-05-02 per Codex Round-12 Scope 3 HIGH-1 finding — closes the gap where the per-export grant from Round-11 was checked at initiate but could expire silently before completion):** the completion gate adds a 6th condition: **(6) the per-export grant artifact (`grant_artifact_id` from the initiation payload, recorded in `research.export_initiated`) MUST exist, MUST be unexpired at completion-time, MUST match the export by ID/hash binding, AND MUST still attest the same multi-party signer chain** (ADR-028 v0.4 quad + REC concurrence per `per_dsa_review_required`). A grant that has expired, been revoked, or had its signer-chain attestation invalidated between initiation and completion fails this 6th condition.

If ANY of (1)–(6) fails: the endpoint emits `research.export_completed` with `status = invalidated` and the violated condition recorded in payload (per AUDIT_EVENTS v5.2 §5), AND a `signal_enforcement_trigger` Category B audit per GOVERNANCE_CONTROLS v5.2 §7.2 (export artifact destruction; partner notification; cohort recompute or full invalidation). The `invalidation_reason` enum gains a 6th canonical value: **`grant_artifact_invalidated`** (mirrored across TYPES.ResearchDataExport.invalidation_reason + AUDIT_EVENTS v5.2 §5 research.export_completed payload + STATE_MACHINES v1.1 ResearchExportRequest reject-unless rule + GOVERNANCE_CONTROLS v5.2 §7.2 incident matrix). On success (all 6 conditions hold): emits `research_export.delivered` domain event + `research.export_completed` audit at `audit_sensitivity_level = high_pii` with `status = completed`. **Patch 2026-05-02 per Codex Scope 2 HIGH-1 — closes the consent-revocation-mid-export gap (revocation must stop completion).** |
| `GET /research/dsas/{dsa_id}` | Retrieve DSA details. | Research Data Steward, Privacy Officer, Regulatory Affairs Lead, Research Ethics Committee Member (read-only) | C | |
| `POST /research/dsas/activate` | Activate a DSA (state transition `in_review → active`). | Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer + Product Lead (quad sign-off per ADR-028 v0.4); REC concurrence per `research_ethics_review_body.per_dsa_review_required` | **B + audit_sensitivity_level=standard** *(updated 2026-05-02 per Codex Round-12 Scope 1 MEDIUM-1 — DSA activation is governance, not high_pii; the high_pii classification applies to actual data flow events, not lifecycle events)* | Activation gate per MARKET_LAUNCH v5.1 Research data partnership activation gate. |
| `GET /research/audit/exports` | Retrieve research export audit chain (high_pii sensitivity). | Research Ethics Committee Member, Privacy Officer, Regulatory Affairs Lead, External Research Partner (scoped to own DSA) | **B + audit_sensitivity_level=high_pii** *(retrieval-side; access controls per I-031)* | Restricted retrieval per I-031; access logged at audit envelope. Cross-tenant access requires break-glass per RBAC v1.1. |

### Endpoint count post-v1.10

Total endpoints post-v1.10: **178 (v0.2 baseline) + 9 research = 187 endpoints across 22 modules** (research data export module added per System Architecture v1.2 v1.10 cycle additions).

---

## Document control

- **v0.2** — Adds 33 new endpoints across 6 new modules: Tenant Configuration (6), Subscriptions (7), Product Catalog (5), Carts (6), Discount Codes (4), Affiliates (5). Total: 178 endpoints across 21 modules. All new endpoints schema-aligned to Canonical Data Model v1.2 §4-bis ecom entities. Threading remediation per Adversarial Counsel Review v1.0 finding CRITICAL-04. Existing 145 endpoints across 15 modules preserved without modification. Authentication, error envelope, idempotency, pagination, and delegation conventions unchanged from v0.1.
- **v0.2 (refreshed 2026-05-02 per v1.10.1 hygiene cycle physical merge of `Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` Group 5B §OpenAPI rows 28, 74)** — Additive content under "v1.10 cycle additions" section above. Tenant identifier sweep (Row 28): all `Heros-Health` example values → `Telecheck-US` per C3 brand structure; patient-facing surfaces source `tenant.consumer_dba`. 9 new research data endpoints (Row 74) per ADR-028: consent grant/revoke, cohort definition create/retrieve, export initiate/complete, DSA retrieve/activate, research audit retrieval. All tenant-scoped per I-023; export endpoints at `audit_sensitivity_level = high_pii` per I-031. DSA activation requires ADR-028 v0.4 quad sign-off + REC concurrence. Total endpoints post-v1.10: **187 endpoints across 22 modules** (research data export module added per System Architecture v1.2 v1.10 cycle additions). Per ADR-028 + INVARIANTS v5.2 + AUDIT_EVENTS v5.2 + RBAC v1.1 + CDM v1.2 v1.10 cycle additions. Existing v0.2 endpoints preserved without modification; v1.10 additions are purely additive. No version-number bump (entry-level refresh; OpenAPI remains at v0.2 in headers and references).
- **v0.1** — Initial OpenAPI specification. 145 endpoints across 15 modules. 75 critical-path endpoints defined with full request/response shapes. Covers all 14 System Architecture modules plus health check. Every endpoint includes auth requirements, role restrictions, and contract references where applicable. Error envelope, idempotency, pagination, and delegation conventions defined.
- **Next:** v0.3 after engineering review validates all 178 endpoint shapes against CDM v1.2 entities; convert to OpenAPI 3.1 YAML for code generation.
- **Change discipline:** changes to endpoint paths, authentication requirements, or contract references require Engineering Lead sign-off.
