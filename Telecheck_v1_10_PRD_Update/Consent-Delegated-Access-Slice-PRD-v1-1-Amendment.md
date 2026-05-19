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

**Schema for consent_domain_event_outbox:**

```sql
CREATE TABLE consent_domain_event_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    patient_id UUID NOT NULL,
    event_type TEXT NOT NULL,                         -- e.g., 'ConsentRevokedDomainEvent'
    event_payload JSONB NOT NULL,                     -- Event-specific fields
    correlated_audit_event_id UUID NOT NULL,          -- Reference to the Cat A audit row for the same transition
    consent_id UUID NOT NULL,                         -- The consent record this event pertains to
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    consumed_at TIMESTAMPTZ,                          -- Set by dispatcher when delivered to all subscribers
    delivery_attempts INT NOT NULL DEFAULT 0,
    last_delivery_error TEXT,
    CONSTRAINT consent_domain_event_outbox_tenant_check CHECK (tenant_id IS NOT NULL)
);

CREATE INDEX consent_domain_event_outbox_pending_idx
    ON consent_domain_event_outbox(tenant_id, created_at) WHERE consumed_at IS NULL;
```

**Why same-transaction outbox** (vs separate-transaction event emission, vs synchronous dispatch):
- **Atomicity with the consent transition:** if the consent transition rolls back, the domain event row also rolls back (same transaction). No "ghost events" referring to consent state that never actually transitioned.
- **Dispatcher decoupling:** subscribers (AI Service, Forms Engine, Research Data Pipeline) consume from the outbox asynchronously; their availability does not block the consent transaction.
- **Idempotent delivery:** the dispatcher delivers each event-id at most once to each subscriber; subscribers handle idempotency via the event_id key.

### Sub-decision 2 — Consent-revocation-bound KMS access lock (research-data-class)

**Decision shape:** revocation of a research-consent triggers a Cat A `kms.consent_revocation_research_data_lock` event + INSERT into `consent_revocation_locks`. Downstream KMS decrypt operations on that tenant's `pii_research_consented` data class verify the lock is not present BEFORE proceeding.

**Schema:**

```sql
CREATE TABLE consent_revocation_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id tenant_id_t NOT NULL,
    patient_id UUID NOT NULL,
    data_class TEXT NOT NULL,                         -- 'pii_research_consented' for v1.1; future: other revocable data classes
    locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    locked_by_consent_revocation_id UUID NOT NULL,    -- References the consent row that triggered the lock
    CONSTRAINT consent_revocation_locks_unique UNIQUE (tenant_id, patient_id, data_class)
);
```

**KMS-side integration (cross-references Sprint 13 KMS Architecture Spec):**

The canonical research-data decrypt procedure adds a STEP 0.5 (after I-032 STEP 0) that checks the consent_revocation_locks table:

```sql
-- STEP 0: I-032 tenant-GUC guard per Sprint 8 contract
IF NULLIF(current_setting('app.tenant_id', true), '') IS DISTINCT FROM p_tenant_id THEN
    RAISE EXCEPTION 'I-032 tenant-GUC violation' USING ERRCODE = 'TLC32';
END IF;

-- STEP 0.5 (NEW v1.1): consent-revocation lock check
IF EXISTS (
    SELECT 1 FROM consent_revocation_locks
    WHERE tenant_id = p_tenant_id
      AND patient_id = p_patient_id
      AND data_class = 'pii_research_consented'
) THEN
    RAISE EXCEPTION 'Research consent revoked; decrypt forbidden' USING ERRCODE = 'TLC51';
END IF;

-- ... proceed with decrypt
```

**Why structural lock vs application-layer check:** the lock at the SECURITY DEFINER procedure boundary provides defense-in-depth — even if the application layer has a bug that doesn't check consent state, the decrypt fails at STEP 0.5 with ERRCODE TLC51. The forensic audit record is in the consent_revocation_locks + Cat A audit trail.

**Lock retention:** the lock is permanent for the life of the patient + tenant (no auto-removal). If a patient re-grants consent later, a NEW consent record is created + the lock entry is supplemented by a Cat A `consent.research_re_grant` event but the old lock row remains (audit trail of "this was revoked at time T, re-granted at time T' "). Downstream decrypt logic checks for the MOST RECENT consent state, not just the lock presence (handled by application layer querying both tables).

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

### Sub-decision 6 — Consent-aware AI service integration

**Decision shape:** the Mode 1 (Sprint 9) + Mode 2 (Sprint 12) handlers subscribe to `ConsentRevokedDomainEvent` + `ConsentExpiredDomainEvent`. On receipt:

1. AI Service invalidates any in-flight conversation/workflow that depended on the revoked consent (e.g., Mode 2 GLP-1 titration workflow when clinical-care consent revoked).
2. The patient's Mode 1 conversation receives a system message acknowledging the consent change ("Your clinical-care consent was revoked. I can no longer assist with clinical workflows.").
3. Cat A `ai.consent_revocation_propagated` event emitted by AI Service.

The cross-domain subscriber pattern provides eventual consistency: a clinical-care consent revocation may take up to 5 seconds (outbox dispatcher poll + AI Service handler) to propagate; the AI Service's request-admission flow does NOT live-query consent state per turn (would create per-turn DB load); the outbox-driven propagation is the canonical pattern.

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
5. **OQ5 — Cross-region outbox replication during DR.** Recommendation: outbox replicates via standard RDS logical replication; dispatcher in us-west-2 resumes drain from same outbox post-failover. Aligned with Cold-DR Runbook (Sprint 7).
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

---

— Claude (Opus 4.7, 1M context), Consent & Delegated Access Slice PRD v1.1 amendment v0.1 DRAFT authored 2026-05-19 under "continue 24 hrs / no more resting" autonomous-work authorization. Sprint 14 of the 24h-loop work plan. Track 3 spec-corpus deliverable. Integrates domain-event same-transaction outbox + SI-017 I-032 STEP 0 + ADR-028 tier 6 + consent-revocation-bound KMS lock. Companion to Sprint 8 Identity v1.1 + Sprint 13 KMS Architecture + Sprint 9 + Sprint 12 AI Service handlers.
