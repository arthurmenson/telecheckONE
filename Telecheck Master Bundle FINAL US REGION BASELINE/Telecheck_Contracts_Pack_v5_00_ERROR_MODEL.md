# 00 · Error Model

**Status:** canonical · **Version:** 5.4 · **Owner:** engineering lead · **Consumers:** all API endpoints, client SDKs, error UX

This document defines the standard error envelope, error code structure, HTTP mapping, locale resolution, and client display rules for all Telecheck APIs.

---

## Error envelope

Every API error response uses this envelope:

```json
{
  "error": {
    "code":        "domain.resource.reason",
    "message":     "Human-readable message in resolved locale",
    "detail":      { },
    "retry_after": null | "<ISO 8601 duration>",
    "trace_id":    "<correlation ID for support>",
    "timestamp":   "<ISO 8601 UTC>"
  }
}
```

---

## Error code structure

`<domain>.<resource>.<reason>`

- Domain: `patient`, `clinical`, `pharmacy`, `ai`, `community`, `admin`, `internal`
- Resource: the canonical aggregate or resource from the Glossary
- Reason: specific failure reason in snake_case

Examples:
- `clinical.refill.eligibility_failed` — refill eligibility check failed
- `clinical.interaction_signal.engine_unavailable` — interaction engine is down
- `pharmacy.order.stock_out` — medication not available
- `ai.mode_1.guardrail_refused` — Mode 1 declined to answer per guardrail
- `patient.consent.not_granted` — required consent not present
- `internal.service.timeout` — internal service timeout (not exposed to patient)

---

## HTTP mapping

| HTTP status | Usage |
|---|---|
| 400 | Client sent invalid input (malformed request, missing required fields) |
| 401 | Authentication failed or missing |
| 403 | Authenticated but not authorized (delegation scope insufficient, consent not granted) |
| 404 | Resource not found |
| 409 | Conflict (idempotency key mismatch, state transition not allowed) |
| 422 | Semantically invalid (eligibility failed, interaction signal blocks action) |
| 429 | Rate limited |
| 500 | Internal server error (never expose internal detail to client) |
| 503 | Service unavailable (engine down, dependency timeout) |

---

## Locale resolution

Error messages are resolved in this order:
1. Patient's selected locale (from their account preferences)
2. Device locale (from Accept-Language header)
3. CCR default locale for the patient's country_of_care
4. English (en-US) as final fallback

---

## Client display rules

- **Patient-facing errors** use the `message` field. Never display `code` or `detail` to patients.
- **Clinical-facing errors** may display `code` and summary `detail` for debugging.
- **Internal errors** (5xx) display a generic "something went wrong" message to patients with `trace_id` for support. Full detail is logged server-side only.
- **Retry-eligible errors** include `retry_after`. Clients should respect the duration before retrying.

---

## Safety-critical error behavior

When a safety-critical service is unavailable (interaction engine, protocol engine, audit service):
- The calling workflow **holds** rather than proceeding without the safety check
- The error response includes `retry_after` and a specific code indicating which safety service is unavailable
- Patient-facing message: "We're running a safety check. This is taking longer than usual — we'll notify you when it's complete."
- The hold is logged in audit even though the safety check didn't complete

---

## Tenant-isolation error behavior (added v5.1)

Per I-025, error responses MUST NOT differentiate between "the requested resource does not exist anywhere on the platform" and "the requested resource exists in another tenant the requestor is not authorized for." Both produce the same error envelope.

**Mandatory rules:**

1. **Resource-not-found uniformity.** When a tenant-scoped resource lookup by ID fails because the resource is not in the requestor's authorized tenant scope, the response is `404 NOT_FOUND` with code `RESOURCE_NOT_FOUND` — identical to the response when the resource ID does not exist at all. The `detail` block does not include any signal differentiating the two cases. Internal logs may distinguish for forensics, but the wire response does not.

2. **No tenant ID echo in error responses for unauthorized scopes.** If a request supplies a `tenant_id` the requestor is not authorized for, the response is `403 FORBIDDEN` with code `INSUFFICIENT_TENANT_SCOPE`. The error does not echo back the requested `tenant_id` in the `detail` block — that would confirm the tenant exists.

3. **Lookup-by-natural-key is tenant-scoped.** Patient lookup by phone number, email, or other natural key is scoped to the requestor's authorized tenant. Cross-tenant patient existence cannot be inferred via natural-key lookup. A patient with the same phone number in two tenants is two distinct records (per ADR-023); each tenant's lookup returns only its own.

4. **Bulk-operation partial failures are aggregated, not detailed cross-tenant.** A bulk operation that touches some records the requestor is unauthorized for returns aggregated success/failure counts; per-record failure detail is provided only for records within authorized scope.

5. **Rate-limit responses are tenant-scoped.** A `429 TOO_MANY_REQUESTS` response includes the requestor's tenant rate-limit context, never the platform-wide rate limit (which would leak relative usage signal across tenants).

**Anti-patterns to reject in code review:**

- Returning `404 RESOURCE_EXISTS_IN_DIFFERENT_TENANT` (this is the canonical example of what NOT to do)
- Returning different latency profiles for "resource exists in other tenant" vs "resource doesn't exist" (timing-side leak)
- Including the requested tenant ID in error response `detail` even on `403`
- Logging cross-tenant existence at INFO level where it appears in centralized log aggregators tenant operators may access

---

## Document control

- **v5.0** — Initial Error Model contract.
- **v5.1** — Adds Tenant-isolation error behavior section per I-025. Threading remediation per Adversarial Counsel Review v1.0 finding CRITICAL-01. Existing error envelope, codes, HTTP mapping, locale resolution, client display rules, and safety-critical error behavior preserved without modification.
