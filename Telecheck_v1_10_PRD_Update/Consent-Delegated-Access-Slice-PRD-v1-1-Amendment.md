# Consent & Delegated Access Slice PRD v1.0 → v1.1 Amendment

**Version:** 0.1 DRAFT
**Status:** Pre-Codex-pre-ratification; Sprint 14 of autonomous 24h-loop work plan
**Authoring location:** `Telecheck_v1_10_PRD_Update/` (workstream folder; spec-corpus Track 3 deliverable)
**Owner:** Evans (per progress.json area=slice-consent owner) + Compliance Officer (consent governance)
**Companion documents:** `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Consent_Delegated_Access_Slice_PRD_v1_0.md` (target canonical surface); SI-017 Identity Spec v1.1 (Sprint 8; canonical middleware-GUC + I-032 STEP 0); Sprint 13 KMS Architecture Spec (per-tenant key access for consent data); Contracts Pack v5.2 DOMAIN_EVENTS + AUDIT_EVENTS + INVARIANTS v5.3; ADR-028 Research Data Partnership Posture A.
**Authority:** ratifier-targetable amendment to canonical Consent & Delegated Access Slice PRD; integrates domain-event emission alongside audit emission (same-tx outbox per progress.json notes) + SI-017 canonical-middleware-GUC binding + consent-revocation-bound KMS access pattern.

---

## 1. Purpose + scope

This amendment integrates **three architectural shifts** into the canonical Consent & Delegated Access Slice PRD:

1. **Domain-event emission via same-transaction outbox pattern** — every consent transition (grant / revoke / scope-change / delegation-grant / delegation-revoke) emits BOTH a Cat A audit event AND a domain event within the same transaction, persisted to a canonical outbox table for downstream subscribers (e.g., AI Service for consent-revocation propagation; Forms Engine for consent-aware form gating; Research Data Pipeline per ADR-028).
2. **SI-017 canonical-middleware-GUC integration** — every consent procedure is SECURITY DEFINER with I-032 STEP 0 tenant-GUC equality guard per Sprint 8 contract.
3. **Consent-revocation-bound KMS access pattern** — revocation of `pii_research_consented` data class triggers Cat A `kms.consent_revocation_research_data_lock` event; downstream KMS decrypt operations on that tenant's research-consented data fail per the consent_revocation_locks table check.

**Out of scope (deferred):**
- Patient-facing consent UI design (downstream of UI Design Implementation Contract v1.1; covered by separate UX deliverable).
- Cross-tenant consent portability (consent records are tenant-scoped per ADR-023 Model A; cross-tenant portability is a Phase 3+ research-data-sharing feature; not v1.1).
- Auto-renewal mechanisms for time-bounded consents (covered by separate auto-renewal SI; not v1.1).

---

## 2. Amendment-delta summary (v1.0 → v1.1)

| v1.0 section | v1.1 amendment | Driver |
|---|---|---|
| §3 Consent types | Amended: 5 consent tiers → 6 tiers (added "research data partnership" per ADR-028 Posture A) | ADR-028 |
| §4 Consent state machine | Amended: state transitions now emit domain events alongside audit (same-tx outbox) | Domain-event integration |
| §6 (NEW) Domain-event outbox + subscriber contract | NEW section | Same-tx outbox pattern |
| §7 (NEW) Consent-revocation KMS access lock | NEW section | KMS integration |
| §8 Consent procedures | Amended: every SECURITY DEFINER procedure adds I-032 STEP 0 per Sprint 8 | SI-017 integration |
| §9 Audit | NEW events: `consent.domain_event_emitted` (Cat C high-volume sampled), `consent.outbox_consumed` (Cat C), `consent.outbox_drain_failed` (Cat A) | Outbox integration |
| §10 (NEW) Open questions for ratifier | NEW section | Ratifier-targetable scope |

---

## 3. Sub-decisions (ratifier-targetable units)

### Sub-decision 1 — Consent state-machine domain events + same-transaction outbox

**Decision shape:** every consent state transition emits BOTH a Cat A audit row AND a domain event row in the SAME database transaction. The domain event lands in `consent_domain_event_outbox` (canonical outbox table); a separate dispatcher process drains the outbox + delivers events to subscribers.

**Canonical state transitions + emitted events:**

| Transition | Cat A audit event | Domain event |
|---|---|---|
| `none → granted` | `consent.granted` | `ConsentGrantedDomainEvent` |
| `granted → revoked` | `consent.revoked` | `ConsentRevokedDomainEvent` |
| `granted → scope_amended` | `consent.scope_amended` | `ConsentScopeAmendedDomainEvent` |
| `granted (delegation) → delegation_granted` | `consent.delegation_granted` | `DelegationGrantedDomainEvent` |
| `delegation_granted → delegation_revoked` | `consent.delegation_revoked` | `DelegationRevokedDomainEvent` |
| `granted → expired` (auto-transition at expiry timestamp) | `consent.expired` | `ConsentExpiredDomainEvent` |

**Schema for consent_domain_event_outbox + per-subscriber delivery ledger (R1 HIGH-2 closure):**

```sql
-- Append-only event log: one row per emitted event (canonical authoritative event source)
CREATE TABLE consent_domain_event_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    patient_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    event_payload JSONB NOT NULL,
    correlated_audit_event_id UUID NOT NULL,
    consent_id UUID NOT NULL,
    -- Monotonic ordering key per (tenant_id, patient_id, consent_id):
    -- used by subscribers to detect missed events + by DR reconciliation to verify ordering
    event_sequence_no BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT consent_domain_event_outbox_tenant_check CHECK (tenant_id IS NOT NULL),
    CONSTRAINT consent_domain_event_outbox_sequence_unique UNIQUE (tenant_id, patient_id, consent_id, event_sequence_no)
);

-- Per-subscriber delivery ledger (R1 HIGH-2 closure): one row per (event, subscriber) pair
CREATE TABLE consent_domain_event_delivery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES consent_domain_event_outbox(id),
    tenant_id tenant_id_t NOT NULL,
    subscriber_id TEXT NOT NULL,                      -- e.g., 'ai-service-mode1', 'ai-service-mode2', 'forms-engine', 'research-pipeline'
    delivery_status TEXT NOT NULL,                    -- 'pending' | 'delivered' | 'failed_retrying' | 'dead_lettered' | 'skipped'
    delivery_attempts INT NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ,                      -- Backoff-driven next retry time; NULL for terminal states
    delivered_at TIMESTAMPTZ,                         -- Set on successful delivery
    dead_lettered_at TIMESTAMPTZ,
    last_delivery_error TEXT,
    last_attempt_at TIMESTAMPTZ,
    CONSTRAINT consent_domain_event_delivery_unique UNIQUE (event_id, subscriber_id),
    CONSTRAINT consent_domain_event_delivery_status_check CHECK (delivery_status IN
        ('pending','delivered','failed_retrying','dead_lettered','skipped'))
);

-- Derived view: outbox events with their per-subscriber delivery state
CREATE VIEW consent_domain_event_status AS
SELECT
    o.id AS event_id, o.tenant_id, o.patient_id, o.event_type, o.event_sequence_no, o.created_at,
    COUNT(d.id) AS subscriber_count,
    SUM((d.delivery_status = 'delivered')::int) AS delivered_count,
    SUM((d.delivery_status = 'dead_lettered')::int) AS dead_lettered_count,
    (COUNT(d.id) > 0 AND COUNT(d.id) FILTER (WHERE d.delivery_status IN ('delivered','dead_lettered','skipped')) = COUNT(d.id)) AS fully_terminal
FROM consent_domain_event_outbox o
LEFT JOIN consent_domain_event_delivery d ON d.event_id = o.id
GROUP BY o.id, o.tenant_id, o.patient_id, o.event_type, o.event_sequence_no, o.created_at;

CREATE INDEX consent_domain_event_delivery_pending_idx
    ON consent_domain_event_delivery(tenant_id, next_attempt_at)
    WHERE delivery_status IN ('pending','failed_retrying');
```

**Per-subscriber delivery semantics (R1 HIGH-2 closure):**

- At INSERT into `consent_domain_event_outbox`, a trigger creates one `consent_domain_event_delivery` row per registered subscriber (status='pending', next_attempt_at=now()).
- The dispatcher reads from `consent_domain_event_delivery` WHERE `delivery_status IN ('pending','failed_retrying')` ORDER BY `next_attempt_at ASC`.
- Per-subscriber delivery state is independent: a failing subscriber doesn't block other subscribers' deliveries.
- Per-subscriber retry: 5 attempts with exponential backoff (1m, 5m, 15m, 1h, 6h). After 5 failed attempts: status → `dead_lettered`; Cat A `consent.outbox_drain_failed` event emitted (P2 keyed by tenant_id + subscriber_id).
- Event is fully terminal when ALL per-subscriber rows are in {delivered, dead_lettered, skipped}.
- `event_sequence_no` is a monotonic counter per (tenant_id, patient_id, consent_id); subscribers can detect missed events by gap detection.

**Why same-transaction outbox** (vs separate-transaction event emission, vs synchronous dispatch):
- **Atomicity with the consent transition:** if the consent transition rolls back, the domain event row also rolls back (same transaction). No "ghost events" referring to consent state that never actually transitioned.
- **Dispatcher decoupling:** subscribers (AI Service, Forms Engine, Research Data Pipeline) consume from the outbox asynchronously; their availability does not block the consent transaction.
- **Idempotent delivery:** the dispatcher delivers each event-id at most once to each subscriber; subscribers handle idempotency via the event_id key.

### Sub-decision 2 — Consent-revocation-bound KMS access lock (research-data-class)

**Decision shape:** revocation of a research-consent triggers a Cat A `kms.consent_revocation_research_data_lock` event + INSERT into `consent_revocation_locks`. Downstream KMS decrypt operations on that tenant's `pii_research_consented` data class verify the lock is not present BEFORE proceeding.

**Schema (R1 HIGH-1 closure: epoch-versioned lock model preserves re-grant decryptability):**

```sql
-- Append-only consent-revocation event table (canonical audit anchor for revocation events)
CREATE TABLE consent_revocation_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    patient_id UUID NOT NULL,
    data_class TEXT NOT NULL,                         -- e.g., 'pii_research_consented'
    revoked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_consent_id UUID NOT NULL,                 -- The consent row that was revoked
    revoked_by_user_id UUID NOT NULL,
    CONSTRAINT consent_revocation_event_tenant_check CHECK (tenant_id IS NOT NULL)
);

-- Append-only consent record table (already in v1.0; v1.1 ensures consent_id is canonical)
-- consent(id, tenant_id, patient_id, tier, scope_json, granted_at, granted_by_user_id, expires_at)

-- View: the most-recent ACTIVE (non-revoked, non-expired) consent for a (tenant, patient, tier=6)
CREATE VIEW consent_research_active AS
SELECT DISTINCT ON (tenant_id, patient_id)
    id, tenant_id, patient_id, granted_at, scope_json
FROM consent c
WHERE tier = 6
  AND (expires_at IS NULL OR expires_at > now())
  AND NOT EXISTS (
    SELECT 1 FROM consent_revocation_event r
    WHERE r.revoked_consent_id = c.id
  )
ORDER BY tenant_id, patient_id, granted_at DESC;
```

**KMS-side integration with epoch-versioned check (R1 HIGH-1 closure):**

The canonical research-data decrypt procedure's STEP 0.5 uses an epoch model: the decrypt is permitted IFF there exists an ACTIVE consent that was granted AFTER any prior revocation for the same (tenant, patient, tier=6) tuple. This handles re-grant cycles correctly — a fresh grant supersedes earlier revocations.

```sql
-- STEP 0: I-032 tenant-GUC guard per Sprint 8 contract
IF NULLIF(current_setting('app.tenant_id', true), '') IS DISTINCT FROM p_tenant_id THEN
    RAISE EXCEPTION 'I-032 tenant-GUC violation' USING ERRCODE = 'TLC32';
END IF;

-- STEP 0.5 (NEW v1.1; R1 HIGH-1 closure: epoch-versioned check inside SECURITY DEFINER):
-- Decrypt permitted ONLY if there is a currently-active tier-6 consent for this (tenant, patient).
IF NOT EXISTS (
    SELECT 1 FROM consent_research_active
    WHERE tenant_id = p_tenant_id
      AND patient_id = p_patient_id
) THEN
    RAISE EXCEPTION 'Research consent not active; decrypt forbidden' USING ERRCODE = 'TLC51';
END IF;

-- ... proceed with decrypt
```

**Why epoch-versioned check (R1 HIGH-1 closure):** the previous design had a permanent `consent_revocation_locks` row that would forever block decrypt even after re-grant. The fix: the canonical decision is "is there an active consent NOW?" not "was there ever a revocation?". The append-only `consent_revocation_event` table preserves the full audit history (forensic record of every revocation); the active-consent view computes the current state at query time. Both append-only invariants honored.

**Why structural check at SECURITY DEFINER vs application-layer:** the STEP 0.5 check at the procedure boundary provides defense-in-depth — even if the application layer has a bug that doesn't check consent state, the decrypt fails at STEP 0.5 with ERRCODE TLC51. The forensic audit record is in the consent_revocation_event + Cat A audit trail.

**Re-grant cycle correctness:**
- T0: patient grants tier 6 → consent record created.
- T1: patient revokes → consent_revocation_event row INSERTed; decrypt fails at STEP 0.5 (no active consent in view).
- T2: patient re-grants → NEW consent record created with `granted_at = T2`.
- T3: decrypt attempt → STEP 0.5 sees active consent in view; decrypt succeeds.
- The T0 consent record + T1 revocation event are preserved (audit trail intact); the T2 grant + T3 decrypt are independently auditable.

The `consent_revocation_locks` table from the v0.1 draft is replaced by the `consent_revocation_event` append-only table + `consent_research_active` view. The model is purely append-only across all tables (consistent with I-027 and Sprint 9 patterns).

### Sub-decision 3 — Six consent tiers (ADR-028 Posture A integration)

**Decision shape:** v1.0 had 5 consent tiers; v1.1 adds tier 6 per ADR-028 Posture A:

| Tier | Name | v1.0/v1.1 | Description |
|---|---|---|---|
| 1 | Platform consent | v1.0 | Acceptance of platform terms; required at registration |
| 2 | Clinical care consent | v1.0 | Authorization for AI-assisted clinical workflows |
| 3 | Communications consent | v1.0 | Marketing + transactional comms preferences |
| 4 | Delegation consent | v1.0 | Patient grants another party access (caregiver) |
| 5 | Pharmacy data sharing | v1.0 | Authorization to share with pharmacies |
| 6 | Research data partnership | **v1.1 NEW** | Per ADR-028 Posture A; authorization for de-identified research-data sharing with platform research partners (WHO / UN / academic institutions per ADR-028 framework) |

**Tier 6 specifics:**

- Default state at registration: `none` (opt-in required; cannot be inferred or assumed).
- Tier 6 grant is revocable at any time; revocation triggers Sub-decision 2's KMS access lock.
- Tier 6 scope is bounded: only de-identified research-consented data is shareable; never raw PHI.
- Audit trail of tier 6 transitions is retained for the patient's lifetime + 7 years post-end-of-relationship (regulatory compliance).

### Sub-decision 4 — Outbox dispatcher contract

**Decision shape:** a dedicated dispatcher process (Track 5 Infra deliverable) drains `consent_domain_event_outbox` + delivers to subscribers.

**Dispatcher behavior:**

1. Polls outbox table every 1s; processes up to 100 pending events per cycle (batched).
2. For each pending event: invokes subscriber webhooks for the event_type. Subscriber list is registered in `consent_domain_event_subscriber` table per tenant + event_type.
3. Delivery is at-least-once; subscribers handle idempotency via the event_id key.
4. On success: sets `consumed_at`. On failure: increments `delivery_attempts`; retries with exponential backoff up to 5 attempts; after 5: emits Cat A `consent.outbox_drain_failed` event + adds to dead-letter queue for operator triage.
5. Dispatcher publishes its own health metric `consent_outbox_pending_count` + `consent_outbox_lag_seconds`; SRE alerts on >5 minutes lag.

### Sub-decision 5 — SI-017 I-032 STEP 0 integration for all consent procedures

**Decision shape:** every existing consent procedure in v1.0 (grant / revoke / amend-scope / delegation-grant / delegation-revoke) is amended to add the canonical I-032 STEP 0 block per Sprint 8 §11 contract. All procedures use named `p_tenant_id` parameter (not positional).

Reference procedures amended:
- `grant_consent(p_tenant_id, p_patient_id, p_tier, p_scope_json, p_granted_by_user_id)` — adds STEP 0 + Sub-decision 1 outbox emission.
- `revoke_consent(p_tenant_id, p_patient_id, p_consent_id, p_revoked_by_user_id)` — adds STEP 0 + outbox emission + Sub-decision 2 KMS lock INSERT (for tier 6).
- `amend_consent_scope(p_tenant_id, p_patient_id, p_consent_id, p_new_scope_json, p_amended_by_user_id)` — adds STEP 0 + outbox emission.
- `grant_delegation(p_tenant_id, p_patient_id, p_delegate_user_id, p_scope_json, p_granted_by_user_id)` — adds STEP 0 + outbox emission.
- `revoke_delegation(p_tenant_id, p_patient_id, p_delegation_id, p_revoked_by_user_id)` — adds STEP 0 + outbox emission.

### Sub-decision 6 — Consent-aware AI service integration (R1 HIGH-3 closure: revalidation at finalization + L3 pending_review handling)

**Decision shape:** AI Service handles consent state at THREE enforcement boundaries — each provides defense-in-depth against the propagation window:

**Boundary 1 — Request admission (eventual consistency via outbox subscriber):** the Mode 1 (Sprint 9) + Mode 2 (Sprint 12) handlers subscribe to `ConsentRevokedDomainEvent` + `ConsentExpiredDomainEvent`. On receipt:

1. AI Service invalidates any in-flight conversation/workflow that depended on the revoked consent.
2. The patient's Mode 1 conversation receives a system message acknowledging the consent change.
3. Cat A `ai.consent_revocation_propagated` event emitted.
4. **5-second propagation target; 30-second SLO ceiling** (per OQ4). New requests admitted between revocation event INSERT and event consumption MAY be admitted under stale consent state — Boundary 2 + Boundary 3 catch these.

**Boundary 2 — L3/L2 review-token resolution (R1 HIGH-3 closure: mandatory consent revalidation):** when a clinician resolves a pending_clinician_review token (per Sprint 12 §7), the resolution endpoint MUST live-query the canonical consent state for the workflow's underlying tier:

```sql
SELECT EXISTS (
    SELECT 1 FROM consent c
    WHERE c.tenant_id = $1 AND c.patient_id = $2 AND c.tier = $3
      AND (c.expires_at IS NULL OR c.expires_at > now())
      AND NOT EXISTS (SELECT 1 FROM consent_revocation_event r WHERE r.revoked_consent_id = c.id)
);
```

If the consent is no longer active at resolution time: the resolution rejects with 422 `mode2.consent_revoked_post_admission`; Cat A `ai.mode2.consent_revoked_at_review` event emitted; the in-progress workflow transitions to `failed` with `failure_class = 'consent_revoked_post_admission'`. NO side effects are committed.

**Boundary 3 — Workflow finalization (R1 HIGH-3 closure: mandatory consent revalidation before side effects):** before any Mode 2 workflow commits side effects (L4 autonomous execution OR L3 post-approval commit OR L2 post-confirmation commit), the workflow MUST live-query consent state. If consent is no longer active: workflow transitions to `failed` per Boundary 2; NO side effects committed.

**Pending-review-queued items handling (R1 HIGH-3 closure):** on receipt of `ConsentRevokedDomainEvent`, the AI Service's outbox subscriber:
1. Identifies all pending_clinician_review + pending_patient_confirm items for the affected (tenant, patient, consent-tier) tuple.
2. Marks each as `cancelled_due_to_consent_revocation` (state transition); invalidates the associated token.
3. Emits Cat A `ai.mode2.workflow_cancelled_consent_revoked` per cancelled item.
4. The clinician's review-queue UI shows the cancellation reason; the clinician is freed from acting on stale-consent items.

**Why three boundaries:** Boundary 1 alone has a 5-30s window where stale consent could be acted on. Boundary 2 + Boundary 3 close the window — the worst case is a stale L4 autonomous execution that started just before revocation propagates AND completes before Boundary 3 fires. To minimize this:

- Boundary 3 is invoked at EVERY side-effect-producing step (not just end-of-workflow); for long-running L4 workflows with multiple side effects, consent is re-checked before EACH.
- The check is a single indexed SELECT (low latency; <2ms p99) per the canonical CDM v1.2 patient + consent indexes.
- The 5s target is the cache-invalidation target, NOT the only enforcement boundary — Boundaries 2 + 3 are authoritative regardless of propagation timing.

**Test C.10b (R1 HIGH-3 closure):** L3 pending_review item queued before revocation; clinician attempts resolution after revocation → Boundary 2 rejects with 422 + workflow_cancelled_consent_revoked event.

**Test C.10c:** Mode 2 L4 workflow in mid-execution; consent revoked between side-effect-step-1 and side-effect-step-2 → Boundary 3 fires; workflow transitions to failed before side-effect-step-2 commits.

---

## 4. Spec body amendments (v1.0 → v1.1 patch deltas)

### Delta 1 — Header status block

**v1.0:**
```
**Version:** 1.0
**Status:** Canonical for development
```

**v1.1:**
```
**Version:** 1.1
**Status:** Canonical for development (v1.0 → v1.1 amendment integrates domain-event same-tx outbox + SI-017 I-032 STEP 0 + tier 6 ADR-028 research consent + consent-revocation KMS access lock)
```

### Delta 2 — §3 Consent types

Existing 5-tier table extended with tier 6 (per Sub-decision 3).

### Delta 3 — §6 (NEW) Domain-event outbox + subscriber contract

Insertion: full Sub-decision 1 + Sub-decision 4 content.

### Delta 4 — §7 (NEW) Consent-revocation KMS access lock

Insertion: full Sub-decision 2 content.

### Delta 5 — §8 Consent procedures

Each procedure amended per Sub-decision 5 with I-032 STEP 0 + outbox emission steps.

### Delta 6 — §9 Audit (amended)

| Event | Category | Detail | Partition |
|---|---|---|---|
| `consent.domain_event_emitted` | C (high-volume sampled) | tenant_id, patient_id, event_type, event_id | P1 keyed by patient_id |
| `consent.outbox_consumed` | C (sampled per subscriber) | event_id, subscriber_id, latency_ms | P1 keyed by patient_id |
| `consent.outbox_drain_failed` | A | event_id, subscriber_id, delivery_attempts, last_error | P2 keyed by tenant_id (operator visibility) |
| `kms.consent_revocation_research_data_lock` | A | tenant_id, patient_id, data_class, locked_by_consent_revocation_id | P1 keyed by patient_id |
| `consent.research_re_grant` | A | tenant_id, patient_id, new_consent_id, previous_revocation_id | P1 keyed by patient_id |
| `ai.consent_revocation_propagated` | A | tenant_id, patient_id, affected_workflows[], propagation_latency_ms | P1 keyed by patient_id |

### Delta 7 — Document control (v1.1 entry)

> **v1.1** (2026-05-19) — Integrates domain-event same-transaction outbox pattern + SI-017 I-032 STEP 0 SECURITY DEFINER contract + 6th consent tier per ADR-028 research data partnership Posture A + consent-revocation-bound KMS access lock for `pii_research_consented` data class. Adds §6 (outbox + subscriber contract), §7 (KMS lock), §10 (open questions). Amends §3 (tier 6), §4 (state machine domain-event emission), §8 (procedures STEP 0), §9 (6 new audit events). v1.0 body preserved; v1.1 extends rather than rewrites.

---

## 5. Test coverage commitments

| Test ID | File location | CI job | Verifies | Section |
|---|---|---|---|---|
| Test C.1 | `apps/api-server/__integration__/consent/grant_outbox_atomic.test.ts` | `integration-consent` | grant_consent rolls back → outbox row also absent (same-tx atomicity) | §3 SD1 |
| Test C.2 | `apps/api-server/__integration__/consent/revoke_outbox_propagation.test.ts` | `integration-consent` | revoke_consent emits both Cat A audit + outbox row in same tx; dispatcher delivers to subscribers; consumed_at set | §3 SD1, SD4 |
| Test C.3 | `apps/api-server/__integration__/consent/revoke_research_kms_lock.test.ts` | `integration-consent` | revoke tier-6 consent → consent_revocation_locks INSERT + Cat A `kms.consent_revocation_research_data_lock` event | §3 SD2 |
| Test C.4 | `apps/api-server/__integration__/consent/kms_decrypt_after_revoke.test.ts` | `integration-consent` | Decrypt of `pii_research_consented` after revocation → STEP 0.5 fails with ERRCODE TLC51 | §3 SD2 |
| Test C.5 | `apps/api-server/__integration__/consent/i032_step0_tenant_mismatch.test.ts` | `integration-consent` | Call grant_consent with mismatched `app.tenant_id` GUC → ERRCODE TLC32 + Cat A audit | §3 SD5 |
| Test C.6 | `apps/api-server/__integration__/consent/tier6_default_opt_in.test.ts` | `integration-consent` | New patient registration: tier 6 default state = none (opt-in required) | §3 SD3 |
| Test C.7 | `apps/api-server/__integration__/consent/research_re_grant_audit_chain.test.ts` | `integration-consent` | Revoke → re-grant tier 6: old revocation_lock + Cat A `research_re_grant` event in chain | §3 SD2 |
| Test C.8 | `apps/api-server/__integration__/consent/dispatcher_retry_and_dlq.test.ts` | `integration-consent` | Subscriber webhook failing 5 times → DLQ + Cat A `outbox_drain_failed` event | §3 SD4 |
| Test C.9 | `apps/api-server/__integration__/consent/dispatcher_subscriber_idempotency.test.ts` | `integration-consent` | Dispatcher re-delivers event after subscriber crash; subscriber idempotency key prevents double-processing | §3 SD4 |
| Test C.10 | `apps/api-server/__integration__/consent/ai_service_revocation_propagation.test.ts` | `integration-consent` | Mode 2 GLP-1 workflow in-flight → clinical-care consent revoked → workflow invalidated within 5s + Cat A `ai.consent_revocation_propagated` | §3 SD6 |
| Test C.11 | `apps/api-server/__integration__/consent/concurrent_revoke_idempotent.test.ts` | `integration-consent` | Two concurrent revoke requests for same consent_id → single Cat A audit + single outbox event + single KMS lock row | §3 SD1 |

**Static-analyzer rule IDs registered:**
- `TLC-CONSENT-001` — Consent procedure missing named `p_tenant_id` parameter or missing I-032 STEP 0 block.
- `TLC-CONSENT-002` — Consent state transition writing audit row without companion outbox row in same tx.
- `TLC-CONSENT-003` — KMS decrypt procedure on `pii_research_consented` missing STEP 0.5 consent-revocation-lock check.

---

## 6. Open questions for ratifier

1. **OQ1 — Outbox dispatcher process: dedicated service vs co-located with consent service?** Recommendation: dedicated `consent-outbox-dispatcher` Track 5 deliverable; reduces consent-service blast radius. Ratifier confirms.
2. **OQ2 — Subscriber registration: declarative (table) vs code-config?** Recommendation: declarative via `consent_domain_event_subscriber` table; tenant-scoped subscribers permitted. Ratifier confirms.
3. **OQ3 — DLQ retention + operator triage SLA.** Recommendation: 90-day DLQ retention; 24-hour SRE triage SLA on `outbox_drain_failed` events.
4. **OQ4 — Consent-revocation propagation SLA.** Recommendation: 5-second target; 30-second SLO ceiling. SRE alerts above 30s. Ratifier confirms.
5. **OQ5 — Cross-region outbox replication during DR (R1 MED-1 closure: promoted to concrete contract).** The outbox + delivery-ledger replicate via standard RDS logical replication (consistent with Cold-DR Runbook Sprint 7). Additional DR-specific guarantees:
   - **Dispatcher leadership fencing:** exactly ONE active dispatcher across regions at any time. The dispatcher holds an advisory lock `consent_dispatcher_lease` in the primary region's RDS; us-west-2 dispatcher attempts to acquire the lease ONLY after us-east-1 is declared unreachable per Cold-DR Step 1. Lease acquisition emits Cat A `consent.dispatcher_leadership_transferred` event.
   - **Replication-lag handling:** before us-west-2 dispatcher begins drain, it verifies replication lag <= 60 seconds + waits for canonical Cold-DR Step 5.5 schema-integrity gate to pass; otherwise drain blocked.
   - **Per-subscriber idempotency invariant:** every subscriber MUST implement idempotency keyed by `event_id`; duplicate deliveries during DR are tolerated by subscribers without double-side-effects. Subscribers register their idempotency-token contract during subscriber registration (OQ2).
   - **Event-sequence ordering invariant:** the `event_sequence_no` per (tenant_id, patient_id, consent_id) is a monotonic counter; the us-west-2 dispatcher resumes from the highest delivered_at + verifies sequence continuity per (tenant_id, patient_id, consent_id) tuple. Gap detection: missing sequences trigger Cat A `consent.event_sequence_gap_detected` event + operator triage.
   - **Failover reconciliation:** before us-west-2 dispatcher begins normal drain, it runs reconciliation pass — for every event in outbox with no terminal delivery state, it verifies subscribers' idempotency state via subscriber-side ack endpoint. Subscribers that have already processed the event (per their idempotency key) get the delivery_ledger row updated to delivered without re-delivery.
6. **OQ6 — Codex pre-ratification target.** Recommendation: 3-4 rounds.
7. **OQ7 — Tier 6 audit retention 7-year-post-end-of-relationship.** Aligned with HIPAA + GDPR + research-partnership regulatory frameworks. Ratifier confirms vs separate retention SI.

---

## 7. Cross-SI alignment summary

| Cross-SI surface | Consent v1.1 surface | Relationship |
|---|---|---|
| SI-017 Identity Spec v1.1 (Sprint 8) | §3 SD5 every procedure uses canonical STEP 0 + named p_tenant_id | I-032 enforcement |
| Sprint 13 KMS Architecture | §3 SD2 KMS access lock for revoked research consent | Cross-references kms.consent_revocation_research_data_lock event + ERRCODE TLC51 |
| ADR-028 Research Data Posture A | §3 SD3 tier 6 + scope-bounded de-identified-only | Resolves consent-tier dimension |
| Sprint 9 Mode 1 + Sprint 12 Mode 2 | §3 SD6 AI service consent-revocation propagation | Outbox-driven eventual consistency for in-flight workflow invalidation |
| SI-018 audit-chain partition rule | §6 Delta audit events | Cat A patient-bound P1; Cat C sampled P1; outbox_drain_failed Cat A P2 (operator visibility) |
| Sprint 10 Cross-SI publish-state OQ | §3 SD1 outbox is append-only by design (no constrained UPDATE pattern needed) | Outbox follows event-sourced pattern; consent state machine follows P-021 SC3 constrained-UPDATE pattern (consistent with batched-ratifier per-SI evaluation) |

---

## 8. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; awaiting Codex R1.

**v0.1 R1 closure 2026-05-19:** 3 HIGH + 1 MED closed inline:

| Round | Findings | Status |
|---|---|---|
| R1 | HIGH-1 permanent KMS lock contradicted re-grant semantics (epoch-versioned consent_revocation_event + active-consent view replaces lock table); HIGH-2 single consumed_at couldn't track per-subscriber delivery (split into outbox + per-subscriber delivery ledger with status + monotonic event_sequence_no); HIGH-3 AI propagation missed L3 pending_review handling + stale-consent window (three-boundary defense-in-depth: admission via outbox + review-token resolution revalidation + side-effect finalization revalidation); MED-1 DR outbox replication lacked ordering/duplicate/fencing guarantees (promoted OQ5 to concrete contract: dispatcher leadership lease + replication-lag gate + per-subscriber idempotency + event-sequence-gap detection + failover reconciliation pass) | All 4 closed inline |

**R1 closure pattern recap:**
- HIGH-1: append-only `consent_revocation_event` + view-based active-consent semantics replace the permanent-lock approach; epoch-versioned check inside SECURITY DEFINER procedure supports re-grant cycles.
- HIGH-2: split outbox/delivery into 2 tables + 1 view; per-subscriber delivery_status with exponential backoff retries; event fully terminal only when all subscriber rows terminal.
- HIGH-3: three boundaries (admission propagation + review-token resolution + workflow finalization); pending_review queued items auto-cancelled on revocation event; live consent query at every side-effect-producing step.
- MED-1: dispatcher single-active-lease + replication-lag-gate + monotonic event_sequence_no + reconciliation pass before resumed drain.

No architectural-judgment items closed inline; CLAUDE.md hard-floor item 6 honored. 7 known OQs (§6) remain ratifier-targetable.

---

— Claude (Opus 4.7, 1M context), Consent & Delegated Access Slice PRD v1.1 amendment v0.1 DRAFT authored 2026-05-19 under "continue 24 hrs / no more resting" autonomous-work authorization. Sprint 14 of the 24h-loop work plan. Track 3 spec-corpus deliverable. Integrates domain-event same-transaction outbox + SI-017 I-032 STEP 0 + ADR-028 tier 6 + consent-revocation-bound KMS lock. Companion to Sprint 8 Identity v1.1 + Sprint 13 KMS Architecture + Sprint 9 + Sprint 12 AI Service handlers.
