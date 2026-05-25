# 00 · Idempotency

**Status:** canonical · **Version:** 5.4 · **Owner:** engineering lead · **Consumers:** all state-changing endpoints, client SDKs

This document defines idempotency key requirements, terminal state handling, reconciliation, crash semantics, retry backoff, and client edge cases for all state-changing Telecheck API operations.

---

## Idempotency key contract

Every state-changing API call (POST, PUT, PATCH, DELETE) must include an `Idempotency-Key` header. The key is a client-generated ULID.

**Header format:** `Idempotency-Key: <ULID>`

**Server behavior:**

| Condition | Response |
|---|---|
| First request with this key | Process normally. Store `(tenant_id, idempotency_key, endpoint, actor_id) → response` in idempotency cache. Return result. |
| Subsequent request with same key, same body | Return stored response without re-processing. HTTP status matches original. |
| Same key, different body | Return `409 Conflict` with error code `internal.idempotency.body_mismatch`. The client has a bug. |
| Same key, different endpoint | Keys are scoped per endpoint. No conflict. |
| Same key, different actor | Keys are scoped per actor. No conflict. |

**Key TTL:** 24 hours. After TTL expiry, the key is evicted from the idempotency cache. A new request with the same key is treated as a first request. The 24-hour window is sufficient for all retry scenarios including overnight offline queuing.

**Storage:** Idempotency cache is stored in the primary database (not a volatile cache) to survive server restarts. Eviction is a background job.

---

## Terminal states

When an aggregate reaches a terminal state, no further state-changing operations are accepted against that aggregate instance. Attempted transitions return `409 Conflict` with error code `<domain>.<resource>.terminal_state`.

Terminal states per aggregate (defined in State Machines v1.1):

| Aggregate | Terminal states |
|---|---|
| Refill | `completed`, `ineligible` (with no retry path), `declined` (with no appeal) |
| Medication Request | `completed`, `cancelled` |
| Pharmacy Order | `completed`, `pickup_expired` |
| Consult | `completed`, `cancelled` (by patient before start) |
| Lab Document | `archived` |
| Adverse Event | `resolved`, `regulatory_reported` |
| Community Post | `removed` |
| RPM Alert | `resolved`, `dismissed` |

### Terminal state consequences

- No new events may be emitted against the aggregate after terminal state
- The idempotency key for the terminal transition is retained for the full 24-hour TTL
- Queries against terminal aggregates return the aggregate with its terminal state — they are not deleted
- Correction of a terminal state requires a new aggregate (e.g., a new refill, not a reopened one)

---

## Crash semantics

### Server crash during processing

If the server crashes after receiving a request but before persisting the result:

1. The idempotency key was **not** stored (crash before any write) → client retry creates a first request. Safe.
2. The idempotency key was stored but the business logic did not complete (crash mid-processing) → the key entry is in a `pending` state. On retry, the server detects the pending key, rolls back any partial writes, and re-processes. Safe.
3. The idempotency key and business result were both persisted (crash after write, before response) → client retry receives the stored response. Safe.

**Implementation requirement:** Idempotency key insertion and business logic must be in the same database transaction. If the transaction commits, both are persisted. If it rolls back, neither is persisted. This is the critical atomicity guarantee.

### Client crash during request

If the client crashes after sending a request but before receiving a response:
- The client retains the idempotency key in local storage (it was generated before sending)
- On app restart, the client retries with the same key
- Server behavior is per the table above — either returns stored result or processes as first request

### Network partition

If the network drops during a request:
- Client does not know if the server received the request
- Client retries with the same idempotency key after backoff
- Server handles correctly regardless of whether the original request was received

---

## Retry backoff contract

Clients must implement exponential backoff with jitter for retries:

```
delay = min(base_delay * 2^attempt + random_jitter, max_delay)
```

| Parameter | Value |
|---|---|
| `base_delay` | 1 second |
| `random_jitter` | 0–500ms uniform random |
| `max_delay` | 30 seconds |
| `max_attempts` | 5 |

After `max_attempts`, the client surfaces an error to the user: "This action could not be completed. Please check your connection and try again." The idempotency key is retained — if the user manually retries, the same key is used.

**Exception:** For long-running operations (interaction engine check, Mode 2 evaluation), the server returns `202 Accepted` with a polling URL. The client polls at 2-second intervals (no backoff needed — the server is actively processing). Polling timeout is 30 seconds; after timeout, the client displays "This is taking longer than usual — we'll notify you when it's complete."

---

## Reconciliation

### Offline queue reconciliation

When the app resumes from offline:
1. Queued requests are replayed in submission order
2. Each request uses its original idempotency key (generated at submission time, not replay time)
3. If a queued request fails with a business logic error (e.g., refill already in progress from another device), the failure is surfaced to the user — the idempotency layer does not mask business errors
4. If a queued request succeeds (server returns the stored result from a previous successful delivery), the client updates local state to match

### Multi-device reconciliation

If a patient uses multiple devices:
- Each device generates its own idempotency keys (different ULIDs)
- Two devices submitting the same logical action (e.g., both request a refill) produce two requests with different keys
- The second request fails at the **business logic** layer (refill already in progress), not at the idempotency layer
- This is correct behavior — the idempotency layer prevents duplicate processing of the same request, not duplicate intent from different sources

### Clock skew

Idempotency keys are ULIDs (which embed timestamps) but the server does not rely on client timestamps for ordering. Server-side timestamps govern event ordering. Client ULIDs are identifiers, not ordering primitives. Clock skew between client and server does not affect idempotency behavior.

---

## Endpoints exempt from idempotency

Read-only operations (GET) do not require idempotency keys. The following write operations are also exempt because they are inherently idempotent:

- `PUT /patients/{id}/locale` — setting a locale is idempotent by nature (same input = same result regardless of repetition)
- `PUT /patients/{id}/notification-preferences` — same rationale

All other write operations require idempotency keys. When in doubt, require the key.

---

## Anti-patterns

- **Generating the idempotency key at send time instead of submission time.** The key must be generated when the user initiates the action, not when the request is sent. This ensures retries (including offline queue replays) use the same key.
- **Using a hash of the request body as the key.** This breaks if the body contains a timestamp or other variable field. Use a ULID.
- **Relying on the idempotency layer to prevent duplicate business intent.** Idempotency prevents duplicate processing of the same request. Duplicate intent from different sources (two devices, two users) is a business logic concern.
- **Retrying without backoff.** Thundering herd risk during outage recovery. Always use the backoff contract above.

---

## Document control

- **v5.0** — Initial Idempotency contract.
- **v5.1** — Idempotency cache key extended to `(tenant_id, idempotency_key, endpoint, actor_id)` per ADR-023 multi-tenancy. Same idempotency key in different tenants produces independent results. Threading remediation per Adversarial Counsel Review v1.0 finding CRITICAL-01.
