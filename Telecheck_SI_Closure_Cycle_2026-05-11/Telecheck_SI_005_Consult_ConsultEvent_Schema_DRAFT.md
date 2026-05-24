# SI-005 Closure Artifact — Consult / ConsultEvent canonical schema

**Status:** **SUPERSEDED-FOR-RATIFICATION (entity/schema model) — 2026-05-24.** The 2-entity mutable-state-column schema this artifact proposes (`consults` with a mutable `state` column + denormalized lifecycle timestamps, plus a generic `consult_events` log) is **superseded for ratification** by `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_SI_020_Async_Consult_v2_0_Implementation_Readiness.md` **Sub-decision 1** (7 new entities + 1 derived view; Option A **append-only-only per I-035**; immutable `consult` envelope with state in a separate `consult_lifecycle_transition` log). SI-020 Sub-decision 1 §43 explicitly states it "superseded mutable-state-column model from v1.0 §12" — the exact model SI-005 persists. **The two schema models must NOT both be ratified.** SI-005's closure now routes through SI-020's P-037 (SI ratification) / P-038 (CDM v1.8 → v1.9 follow-on amendment) ceremony, NOT a standalone SI-005 CDM amendment. This artifact is preserved as the **historical record of the Sprint-9 placeholder schema that actually shipped** in `telecheck-app/migrations/020_async_consult.sql` + `021_async_consult_tenant_boundary_constraints.sql`. See the **"Reconciliation against SI-020 Sub-decision 1"** section below for the full divergence table + entity/column crosswalk + the open migration-reconciliation gap flagged for the SI-020 ratifier. (Previously DRAFT v0.2 — awaiting ratification into CDM v1.2 §4.X / v1.3.)
**Version history:**
- v0.1 (2026-05-11): initial draft authored by parallel agent.
- v0.2 (2026-05-11): Codex adversarial-review revisions — see §"v0.2 Codex revision" banner below. Findings 5 + 7 addressed. Full resolution record at `Telecheck_SI_Closure_Cycle_Codex_Review_Findings_v0_1.md`.
- v0.3 (2026-05-24): **SUPERSEDED-FOR-RATIFICATION** annotation against SI-020 Sub-decision 1 (per cockpit Addendum 95 lever). Status header flipped; reconciliation/crosswalk section added; closure re-homed onto the SI-020 P-037/P-038 ceremony. No schema change to the historical-record body. Mirrors the SI-004 ↔ SI-020 reconciliation pattern (Addendum 95). Cross-artifact hygiene only — no Codex round, no ratification, no version bump on canonical contracts.
**Date:** 2026-05-11 (v0.1/v0.2); 2026-05-24 (v0.3 supersession annotation)
**Author:** Autonomous Claude (SI closure cycle workstream)
**Closes:** SI-005 in `telecheck-app/docs/SI-005-Consult-ConsultEvent-Schema-Gap.md` — **closure now via SI-020 P-037/P-038, not a standalone SI-005 amendment.**
**Target spec doc:** ~~`Telecheck_Canonical_Data_Model_v1_2.md`~~ → re-homed onto SI-020's CDM v1.8 → v1.9 follow-on amendment (P-038).
**Severity:** medium → resolved-on-ratification (via SI-020 ceremony)
**Adjacent SI:** SI-020 (Async Consult v2.0 implementation-readiness — **the superseding canonical schema source**; Sub-decision 1). SI-001 (MedicationRequest schema; the SI-020 `consult_clinician_decision.prescription_details_id` references `medication_request` per CDM canonical). SI-004 (Async Consult audit events — itself SUPERSEDED-FOR-RATIFICATION by SI-020 Sub-decision 2 per Addendum 95; same SI cycle).

---

## v0.2 Codex revision banner (2026-05-11)

Codex adversarial review returned 2 findings against this artifact:

1. **Finding 5 (MEDIUM)** — `assigned_clinician_id` lacked a composite FK target (left as `[NEEDS RATIFICATION]` placeholder). Resolved: FK target is `accounts(tenant_id, account_id)` — same as `patient_account_id`. The clinician-account model uses the unified `accounts` table with `actor_type='clinician'` discrimination at the service layer (per Slice 2 Identity + JWT spec); there is no separate `clinicians` table. The composite FK is now in the DDL.

2. **Finding 7 (MEDIUM)** — ConsultEvent append-only enforcement at the application layer only; DB trigger marked as optional. Resolved: append-only is mandated at the DB layer via a `BEFORE UPDATE/DELETE` trigger that raises an exception. Mirrors `migrations/002_audit_chain.sql:470+`. Added `audit_event_id` NOT NULL column on consult_events with composite FK to `audit_records` so replay tooling can detect mismatches.

Both `[NEEDS RATIFICATION]` markers in the v0.1 footer's open-questions list removed.

---

## Reconciliation against SI-020 Sub-decision 1 (2026-05-24)

**Finding: SI-005 and SI-020 Sub-decision 1 propose genuinely divergent Consult/ConsultEvent persistence models that must NOT both be ratified.** SI-020 (whole-slice v2.0 implementation-readiness, POST-R11, lockstep-consistent across 10 sub-decisions) makes the canonical schema decision; SI-005 (2-entity placeholder ratification, last substantively touched v0.2 2026-05-11) is the older, narrower proposal that ratifies the Sprint-9 placeholder. SI-020 Sub-decision 1 §43 explicitly names its predecessor: it is "Option A append-only-only per I-035 … superseded mutable-state-column model from v1.0 §12" — the exact mutable-state model SI-005 §4.16 persists.

### Divergence table

| Axis | SI-005 (v0.2, 2026-05-11) | SI-020 Sub-decision 1 (v0.12 R11) |
|---|---|---|
| Persistence model | **mutable-state-column** — `consults` row carries a mutable `state` column + denormalized lifecycle timestamps; append-**update** over lifecycle | **Option A append-only-only per I-035** — immutable `consult` envelope; state lives in a separate `consult_lifecycle_transition` append-only log; `enforce_append_only()` trigger on every entity |
| Entity count | **2** (`consults`, `consult_events`) | **7 entities + 1 derived view** (`consult`, `consult_intake_submission`, `consult_clinical_summary`, `consult_review_claim`, `consult_clinician_decision`, `consult_lifecycle_transition`, `consult_follow_up_message`, + `consult_outcome_summary_view`) |
| PK / ID type | `VARCHAR(26)` | `ULID` (`gen_ulid()`) |
| Patient FK | `patient_account_id` → `accounts(tenant_id, account_id)` | `patient_id` → `patient(tenant_id, id)` |
| Clinician identity | `assigned_clinician_id` nullable column → `accounts` | dedicated `consult_review_claim` entity (90-min claim, single-active-claim partial-UNIQUE invariant, reassignment + expired-auto-release procedures); `consult_clinician_decision` carries a 5-column composite FK to the active claim enforcing deciding-clinician == claiming-clinician at schema level |
| Lifecycle state | `state` CHECK enum on `consults` (17 states) | `consult_lifecycle_transition` log (`from_state`/`to_state`/`transition_reason` enums + CHECK on ~22 `(reason, from, to)` triples); current state read via `consult_outcome_summary_view` |
| Event/transition log | generic `consult_events` (7 `event_type` values; `audit_event_id` 1:1 to `audit_records`) | `consult_lifecycle_transition` (transition-specific) + the platform audit chain itself; no generic per-consult event table |
| Intake linkage | `intake_form_submission_id` → `forms_submission` | dedicated `consult_intake_submission` entity (`template_id` → `forms_template`; KMS-encrypted `intake_payload_ciphertext` + 8-column envelope) |
| PHI at rest | "none in baseline — intake lives in `forms_submission`" | KMS-encrypted ciphertext + 8-column envelope on `consult_intake_submission`, `consult_clinical_summary`, `consult_clinician_decision`, `consult_follow_up_message` |
| Payment / revenue anchor | none | `consult.payment_intent_id` NOT NULL (FK `billing_payment_intent`), `payment_provider`, `currency`, `consult_fee_cents` (Sub-decision 10 sequencing) |
| AI clinical summary | none | dedicated `consult_clinical_summary` entity (Mode 1/2; `interaction_signals_snapshot` from Med-Interaction P-034) |
| Follow-up messaging | none | dedicated `consult_follow_up_message` entity |

### Canonical decision

**SI-020 Sub-decision 1 (7 entities + 1 derived view; Option A append-only-only per I-035) is canonical for ratification** — it is newer, whole-slice, far more converged (R11 vs SI-005 v0.2), revenue-anchor-complete, PHI-encryption-complete, and explicitly designed to supersede the v1.0 §12 mutable-state model that SI-005 ratifies. SI-005's 2-entity schema is preserved only as the **historical record of the Sprint-9 placeholder** that shipped in `migrations/020` + `021`.

### Entity / column crosswalk (SI-005 → SI-020 disposition)

| SI-005 element | SI-020 disposition |
|---|---|
| `consults` (mutable-state envelope) | **SPLIT** → immutable `consult` envelope (identity/payment/program) + `consult_lifecycle_transition` (state) + `consult_outcome_summary_view` (current-state read) |
| `consults.state` column + 9 denormalized `*_at` timestamps | **DROPPED** → derived from `consult_lifecycle_transition` log + surfaced via `consult_outcome_summary_view` (I-035 append-only model has no mutable state column) |
| `consults.patient_account_id` (→ `accounts`) | **RENAMED + RE-TARGETED** → `consult.patient_id` (→ `patient(tenant_id, id)`) |
| `consults.assigned_clinician_id` (nullable column) | **PROMOTED to entity** → `consult_review_claim` (claim/admission lifecycle) + decision-time FK enforcement |
| `consults.consult_type` (`program`/`general`) | **RENAMED** → `consult.consult_type` (`program_pathway`/`general`) |
| `consults.modality` (`async`/`sync`) + ADR-012 in-place flip | **DROPPED as a column** → sync handoff modeled as `escalated_to_sync` state/transition + `async_consult.escalated_to_sync` audit (Sub-decision 2 #13). **See GAP-2 below** (no explicit `modality` column in SI-020). |
| `consults.intake_form_submission_id` (→ `forms_submission`) | **PROMOTED to entity** → `consult_intake_submission` (→ `forms_template`; KMS-encrypted payload) |
| `consults.current_program_catalog_entry_id` | **RE-MAPPED** → `consult.program_id` (→ `program(tenant_id, id)`; set IFF `consult_type=program_pathway`) |
| `consults.country_of_care` (`[NEEDS RATIFICATION]`) | **NOT carried** in SI-020 `consult`. **See GAP-3 below.** |
| `consults.version` (optimistic-concurrency `[NEEDS RATIFICATION]`) | **MOOT** — append-only-only model has no in-place UPDATE on `consult` to guard |
| `consult_events` (generic log; `event_type`, `from/to_state`, `actor_type/id`, `audit_event_id`) | **SUPERSEDED** → `consult_lifecycle_transition` (transition log w/ `transition_by_actor_role`) + platform audit chain; no separate `audit_event_id` cross-link column (audit chain carries `consult_id` as `resource_id`) |
| `consult_events` append-only `BEFORE UPDATE/DELETE` trigger (Finding 7) | **PRESERVED in principle** → SI-020 applies `enforce_append_only()` per I-035 to every entity (same defense-in-depth) |
| 4 cross-tenant safety constraints (composite UNIQUE + 3 composite FKs) | **PRESERVED in principle** → SI-020 uses composite tenant-scoped UNIQUE/FK on every entity (`(tenant_id, id, patient_id)` propagation) + `current_tenant_id_strict()` RLS |

### Gaps flagged for the SI-020 ratifier (NOT filled here per hard-floor item 6)

1. **GAP-1 — shipped-migration reconciliation (the load-bearing handoff item).** Migrations `020_async_consult.sql` + `021_async_consult_tenant_boundary_constraints.sql` shipped the **SI-005-shaped 2-entity mutable-state placeholder** (`consults` + `consult_events`). If SI-020 Sub-decision 1's 7-entity append-only model is ratified, the SI-020 **P-038 follow-on amendment must include a migration that reconciles the shipped 020/021 placeholder to the canonical model — this is a schema-model replacement (drop mutable-state `consults`/`consult_events`; create the 7 entities + view), NOT the forward-ALTER path SI-005 §"Cross-check" anticipated.** Whether to (a) data-migrate any Sprint-9 rows or (b) treat 020/021 as greenfield-replaceable (no production data pre-launch) is a ratifier/engineering-handoff decision. Flagged, not authored.
2. **GAP-2 — `modality` / ADR-012 async↔sync conversion.** SI-005 §4.16 carries a `modality` column + an open `[NEEDS RATIFICATION]` on in-place-flip vs new-row continuity. SI-020 has **no explicit `modality` column** on `consult`; it models sync handoff as the `escalated_to_sync` state/transition + audit event only. Ratifier confirms whether ADR-012 modality is fully captured by the transition log or whether `consult` needs an explicit modality column.
3. **GAP-3 — `country_of_care` denormalization.** SI-005 recommended a denormalized `country_of_care CHAR(2)` on `consults` for CCR hot-path resolution (`[NEEDS RATIFICATION]`). SI-020's `consult` does not carry it (CCR resolved via `tenant`). Ratifier confirms whether the hot-path denormalization is wanted on `consult`.

**Deliberately NOT authored:** no new SI-020 entity, column, invariant, or migration. GAP-1/2/3 are surfaced for the ratifier to resolve at the SI-020 P-037/P-038 ceremony — authoring any would be net-new schema beyond SI-020's ratified sub-decision scope (hard-floor item 6).

---

## Summary

SI-005 was raised by engineering on 2026-05-05 at Sprint 9 PM kickoff when authoring `migrations/020_async_consult.sql` against a CDM v1.2 §3 entity inventory that names entity #15 (Consult) and #16 (ConsultEvent) at lines 84–85 but provides no §4 field-level expansion. Engineering shipped placeholder schema under the Sprint 8 retro option (c) posture (placeholder + SI doc as resume gate) — the schema is now live in migrations 020 + 021, with cross-tenant safety constraints (composite UNIQUE + 3 composite FKs) added by Codex async-consult-r1/r2/r3 closures.

This artifact proposes canonical CDM §4.16 (Consult) and §4.17 (ConsultEvent) expansion blocks following the established CDM §4 style (sql DDL block, indexes, RLS policy, constraints + invariants prose, version column where applicable). The proposal **ratifies what shipped** with one column rename amendment (`patient_id` → `patient_account_id`, see below) and several explicit-locking decisions on details migrations 020/021 left ambiguous (e.g., `event_type` enum scope, append-only enforcement layer).

On ratification, engineering compares the canonical column set against migration 020 + 021 placeholders and ships a forward ALTER migration (paired with rollback) implementing any deltas. The cross-tenant safety constraints (composite UNIQUE on `(tenant_id, id)`, composite FK on `(tenant_id, patient_id) → accounts`, composite FK on `(tenant_id, intake_form_submission_id) → forms_submission`, composite FK on `(tenant_id, consult_id) → consults` for events) are **permanent** per SI-005 §"Cross-tenant safety constraints" and survive ratification.

## Background

Per CDM v1.2 §3.4 ("Care Delivery — 3 entities"), Consult is entity #15 ("Async or sync consultation; converts seamlessly per ADR-012") and ConsultEvent is entity #16 ("State transitions and events on a consult"). CDM §4 expansion blocks exist for §4.1–§4.6 (tenant management) and §4.7–§4.15 (ecom + subscription per v1.2 CRITICAL-02 remediation) — clinical entities including Consult, ConsultEvent, Account, Refill, MedicationRequest are **not** §4-expanded in v1.2. SI-001 covers MedicationRequest specifically. The Async Consult slice shipped at Sprint 33–34 v1.0 with the placeholder schema in migration 020 + cross-tenant safety in migration 021.

The slice's State Machines v1.1 §3 transition table (17 canonical states, 19 transitions) and the four-layer Forms Engine wiring at the `INTAKE → SUBMITTED` boundary are the load-bearing behavioral contracts; this artifact ratifies the persistence layer that backs them.

## Proposed CDM §4.16 Consult

The Consult entity persists the patient's consultation instance. Async or sync per ADR-012 (modality column distinguishes; ADR-012 conversion changes the value mid-lifecycle). Lifecycle governed by State Machines v1.1 §3 (async) or §4 (sync). Tenant-scoped per ADR-023; cross-tenant safety enforced via composite UNIQUE + composite FK pattern (mirroring CDM §4.7 Subscription and the migration 012 `accounts` pattern).

```sql
CREATE TABLE consults (
  id                              VARCHAR(26) PRIMARY KEY,
  tenant_id                       VARCHAR(26) NOT NULL REFERENCES tenants(id),

  -- Patient anchor. Composite FK to accounts(tenant_id, account_id) enforces
  -- same-tenant patient binding at the DB layer (Codex async-consult-r1 HIGH
  -- closure 2026-05-05; permanent per SI-005). [AMENDMENT TO SHIPPED CODE:
  -- shipped column is `patient_id`; proposed canonical name is
  -- `patient_account_id` to disambiguate from RPM `patient_id`-style
  -- denormalized identifiers used elsewhere in the slice corpus. Forward
  -- ALTER RENAME COLUMN is the migration path.]
  patient_account_id              VARCHAR(26) NOT NULL,

  -- Clinician anchor. Nullable until QUEUED → UNDER_REVIEW transition
  -- (case_claimed). [v0.2 Codex Finding 5 resolution] Composite FK target is
  -- `accounts(tenant_id, account_id)` — same as patient_account_id. The
  -- clinician-account model uses the unified `accounts` table with
  -- `actor_type='clinician'` (per Slice 2 Identity + JWT spec); there is no
  -- separate `clinicians` table. Discrimination via `accounts.actor_type` happens
  -- at the service-layer in claim/assign operations, not at the schema layer.
  assigned_clinician_id           VARCHAR(26) NULL,

  -- Type and modality (slice PRD §1 / §2).
  consult_type                    VARCHAR(50) NOT NULL,    -- 'program' | 'general'
  modality                        VARCHAR(20) NOT NULL DEFAULT 'async',  -- 'async' | 'sync' (per ADR-012)

  -- State per State Machines v1.1 §3 (async; canonical 17-state inventory)
  -- and v1.1 §4 (sync; partial overlap). DB-layer CHECK enforces canonical
  -- vocabulary as defense in depth alongside the application-layer state
  -- machine.
  state                           VARCHAR(30) NOT NULL DEFAULT 'INITIATED',

  -- Program catalog linkage per slice PRD §15 + Master PRD v1.10 §10.5.
  -- Nullable for `consult_type = 'general'`. References product_catalog
  -- (CDM §4.9) — current Sprint-9 placeholder ships without FK; SI-005
  -- ratification adds the composite FK constraint.
  current_program_catalog_entry_id VARCHAR(26) NULL,

  -- Forms-intake linkage per slice PRD §15. Nullable until
  -- INTAKE → SUBMITTED transition. Composite FK to
  -- forms_submission(tenant_id, submission_id) enforces same-tenant
  -- intake binding (Codex async-consult-r1 MEDIUM closure 2026-05-05;
  -- permanent per SI-005).
  intake_form_submission_id       VARCHAR(26) NULL,

  -- Lifecycle timestamps. Populated at the corresponding state transition;
  -- nullable until reached. The application layer is the source of truth
  -- for transition causality (these columns are denormalized indexes into
  -- the consult_events log for fast lookup).
  initiated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at                    TIMESTAMPTZ NULL,
  abandoned_at                    TIMESTAMPTZ NULL,
  queued_at                       TIMESTAMPTZ NULL,
  under_review_at                 TIMESTAMPTZ NULL,
  decided_at                      TIMESTAMPTZ NULL,         -- entered any decision branch
  follow_up_started_at            TIMESTAMPTZ NULL,
  completed_at                    TIMESTAMPTZ NULL,
  expired_at                      TIMESTAMPTZ NULL,
  closed_at                       TIMESTAMPTZ NULL,

  -- Country-of-care per Tenant Threading Addendum v1.0 §3.X + I-009.
  -- Denormalized from tenants.country at INITIATED for CCR-driven
  -- runtime policy resolution without joining tenants on every query.
  -- [NEEDS RATIFICATION: shipped migration 020 does NOT include this
  -- column — tenant_id is enough for RLS but denormalized country
  -- avoids a join on the hot read path. Recommend adding; ALTER
  -- migration backfills from tenants.country.]
  country_of_care                 CHAR(2) NULL,

  -- Optimistic concurrency control (mirrors CDM §4.7 Subscription pattern).
  -- [NEEDS RATIFICATION: shipped migration 020 does NOT include this
  -- column — slice's application-layer transactions currently use
  -- SELECT ... FOR UPDATE; adding `version` aligns with §4.7 pattern
  -- and unlocks lock-free optimistic transitions if Sprint 10+ wants them.]
  version                         INTEGER NOT NULL DEFAULT 1,

  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Cross-tenant safety constraints (permanent; Codex async-consult-r1
  -- HIGH + r3 HIGH closures 2026-05-05). NOT placeholders.
  CONSTRAINT consults_tenant_id_id_unique UNIQUE (tenant_id, id),
  CONSTRAINT consults_tenant_patient_fk
    FOREIGN KEY (tenant_id, patient_account_id)
    REFERENCES accounts (tenant_id, account_id),
  -- [v0.2 Codex Finding 5] Clinician FK target is `accounts` (same as patient).
  -- Clinician-account model uses unified `accounts` table with
  -- `actor_type='clinician'` discrimination at the service layer.
  CONSTRAINT consults_tenant_clinician_fk
    FOREIGN KEY (tenant_id, assigned_clinician_id)
    REFERENCES accounts (tenant_id, account_id),
  CONSTRAINT consults_tenant_intake_fk
    FOREIGN KEY (tenant_id, intake_form_submission_id)
    REFERENCES forms_submission (tenant_id, submission_id),

  -- CHECK constraints — DB-layer canonical-vocabulary enforcement.
  CONSTRAINT consult_type_valid    CHECK (consult_type IN ('program', 'general')),
  CONSTRAINT consult_modality_valid CHECK (modality IN ('async', 'sync')),
  CONSTRAINT consult_state_valid   CHECK (state IN (
    'INITIATED', 'INTAKE', 'ABANDONED', 'SUBMITTED', 'PROCESSING', 'QUEUED',
    'UNDER_REVIEW', 'PRESCRIBED', 'ADVISED', 'AWAITING_DATA',
    'ESCALATED_TO_SYNC', 'DECLINED', 'REFERRED', 'FOLLOW_UP', 'COMPLETED',
    'EXPIRED', 'CLOSED'
  ))
);

CREATE INDEX idx_consults_tenant            ON consults (tenant_id);
CREATE INDEX idx_consults_tenant_patient    ON consults (tenant_id, patient_account_id);
CREATE INDEX idx_consults_tenant_state      ON consults (tenant_id, state);
CREATE INDEX idx_consults_tenant_clinician  ON consults (tenant_id, assigned_clinician_id)
  WHERE assigned_clinician_id IS NOT NULL;  -- partial; nulls dominate
CREATE INDEX idx_consults_tenant_program    ON consults (tenant_id, current_program_catalog_entry_id)
  WHERE current_program_catalog_entry_id IS NOT NULL;

ALTER TABLE consults ENABLE ROW LEVEL SECURITY;
ALTER TABLE consults FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON consults
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
```

**Constraints and invariants:**
- State transitions strictly per State Machines v1.1 §3 (modality=async) or §4 (modality=sync). Application layer enforces; DB CHECK enforces vocabulary.
- ADR-012 conversion changes `modality` mid-lifecycle. Audit emits `consult.escalated_to_sync` (per SI-004) on transition; the new sync-side Consult row inherits `id` continuity per ADR-012 — `[NEEDS RATIFICATION: confirm in-place modality flip vs new-Consult-row pattern. Current Sprint-9 implementation flips in-place.]`
- Soft-deletion **not** used (consults are append-update over their lifecycle but never deleted). Aligns with audit append-only via the consult_events log.
- Per-tenant KMS key encryption applies to any future PHI-bearing columns added (none in this baseline — intake responses live in `forms_submission`, not inline).

## Proposed CDM §4.17 ConsultEvent

Append-only event log for consult state transitions and significant lifecycle moments. Used for audit, analytics, replay, and as the durable log behind the AUDIT_EVENTS-emitted `consult.*` events (SI-004). Each `consult_events` row pairs 1:1 with one entry in the AUDIT_EVENTS hash chain — `consult_events` is the local-aggregate log; the audit chain is the cross-cutting platform-floor record.

```sql
CREATE TABLE consult_events (
  id           VARCHAR(26) PRIMARY KEY,
  tenant_id    VARCHAR(26) NOT NULL REFERENCES tenants(id),
  consult_id   VARCHAR(26) NOT NULL,

  -- Event discriminator. Sprint 9 emits 'state_transition' only; Sprint
  -- 10+ may extend.
  -- [AMENDMENT TO SHIPPED CODE: shipped migration 020 CHECK lists only
  -- 'state_transition'. Proposed canonical enum widens to support the
  -- 17 emit points from SI-004 and adds non-transition lifecycle events
  -- (ai_prep_complete, clinician_note_added). Forward ALTER replaces the
  -- CHECK.]
  event_type   VARCHAR(80) NOT NULL,
    -- 'state_transition' | 'ai_prep_started' | 'ai_prep_complete' |
    -- 'clinician_note_added' | 'patient_response_received' |
    -- 'follow_up_message_sent' | 'sync_consult_linked'

  -- For state_transition events, both populated. Nullable to support
  -- non-transition event types.
  from_state   VARCHAR(30) NULL,
  to_state     VARCHAR(30) NULL,

  -- Actor that triggered the event. Nullable for system-generated events
  -- (e.g., scheduled `expire` transition at 14d). Resolution rules:
  --   - actor_type = 'patient'         → references accounts(tenant_id, account_id)
  --   - actor_type = 'clinician'       → references tenant_users(tenant_id, id)
  --   - actor_type = 'ai_workload'     → references ai_executions(tenant_id, id)
  --                                       per ADR-029 / WORKLOAD_TAXONOMY
  --   - actor_type = 'system'          → NULL
  -- [AMENDMENT TO SHIPPED CODE: shipped migration 020 has only `actor_id`
  -- without `actor_type`. Adding actor_type to the canonical row shape
  -- is required for downstream typed-resolution; current implementation
  -- disambiguates via audit chain context which is acceptable for v0.1
  -- but breaks if the audit chain is read-after-write-inconsistent.]
  actor_type   VARCHAR(20) NULL,
    -- 'patient' | 'clinician' | 'ai_workload' | 'system' | 'tenant_operator'
  actor_id     VARCHAR(26) NULL,

  -- Event-type-specific structured payload.
  metadata     JSONB NULL,

  -- Link back to the AUDIT_EVENTS chain entry that mirrors this event.
  -- [NEEDS RATIFICATION: shipped migration 020 does NOT carry this column.
  -- Adding it makes the local-event-log ↔ audit-chain mapping explicit
  -- and queryable; alternative is to leave the mapping implicit (the
  -- audit chain carries consult_id in its `resource_id` field). Recommend
  -- adding for forward-compat with audit-chain replay tooling.]
  audit_event_id VARCHAR(26) NULL,

  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Cross-tenant safety: composite FK to consults (tenant_id, id)
  -- (Codex async-consult-r1 HIGH closure 2026-05-05; permanent per SI-005).
  CONSTRAINT consult_events_tenant_consult_fk
    FOREIGN KEY (tenant_id, consult_id) REFERENCES consults (tenant_id, id)
);

CREATE INDEX idx_consult_events_consult                ON consult_events (consult_id);
CREATE INDEX idx_consult_events_tenant_type            ON consult_events (tenant_id, event_type);
CREATE INDEX idx_consult_events_tenant_consult_occurred ON consult_events (tenant_id, consult_id, occurred_at);

ALTER TABLE consult_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE consult_events FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON consult_events
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
```

**Constraints and invariants:**
- **Append-only — DB-level enforcement MANDATORY (v0.2 Codex Finding 7).** No UPDATE or DELETE operations permitted on `consult_events`. Enforcement layers:
  1. **Application layer** — no service code path issues UPDATE/DELETE on consult_events; reads + INSERTs only.
  2. **DB-level BEFORE UPDATE/DELETE trigger** — mirrors `migrations/002_audit_chain.sql:470+` pattern. The trigger raises an exception on any UPDATE or DELETE attempt, regardless of whether it originates from a service bug, a migration mistake, a manual SQL session, or a future code path that hasn't yet been written. This is the same defense-in-depth pattern used for `audit_records` per I-003 audit append-only.

  ```sql
  CREATE OR REPLACE FUNCTION raise_consult_events_append_only()
  RETURNS TRIGGER AS $$
  BEGIN
    RAISE EXCEPTION 'consult_events is append-only (I-003-adjacent invariant); UPDATE/DELETE forbidden';
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER consult_events_append_only
  BEFORE UPDATE OR DELETE ON consult_events
  FOR EACH ROW EXECUTE FUNCTION raise_consult_events_append_only();
  ```

  **Why not "convention only"** (the v0.1 default that matched SubscriptionEvent §4.8): consult_events is a clinical-recordkeeping log paired 1:1 with the AUDIT_EVENTS chain. Any direct-SQL path that violates the convention creates irreconcilable replay/recovery state — the AUDIT_EVENTS row stays in the immutable chain but the local consult_events row could silently mutate. The trigger closes this gap.

- **`audit_event_id` cross-link to audit_records** — every consult_events row carries a NOT NULL `audit_event_id` column that references the paired `audit_records(audit_id)` row. Composite FK `(tenant_id, audit_event_id) → audit_records(tenant_id, audit_id)` enforces same-tenant binding. Replay tooling can validate consult_events vs audit_records row-by-row; any mismatch surfaces immediately.

[v0.2 Codex revision: marker `[NEEDS RATIFICATION]` on this section removed. The DB trigger is no longer an optional "Evans's choice" — it's mandated by the append-only invariant.]
- Each `consult_events` row mirrors into AUDIT_EVENTS v5.2 per the SI-004 canonical action ID set (Category A for `consult.prescribed`; Category B for `consult.declined_by_clinician`; Category C otherwise).
- `consult_id` is the load-bearing index — patient-scoped queries that need full lifecycle replay run `WHERE tenant_id = $1 AND consult_id = $2 ORDER BY occurred_at`.

## Cross-check against migration 020 + 021

Shipped migrations 020 + 021 enforce the cross-tenant safety constraints permanently and match the proposed schema in: `id`, `tenant_id`, `consult_type`, `modality`, `state`, `current_program_catalog_entry_id`, `intake_form_submission_id`, `created_at`, `updated_at`, the composite UNIQUE and 3 composite FKs, the standard `tenant_isolation` RLS policy, and the state CHECK enumeration.

Discrepancies / amendments:

1. **[AMENDMENT TO SHIPPED CODE]** `consults.patient_id` → `consults.patient_account_id` rename — disambiguation against RPM `patient_id`-style identifiers. Forward ALTER RENAME COLUMN.
2. **[AMENDMENT TO SHIPPED CODE]** `consult_events.event_type` CHECK widening from `'state_transition'`-only to the 7-value canonical set above. Forward ALTER DROP CONSTRAINT + ADD CONSTRAINT.
3. **[AMENDMENT TO SHIPPED CODE]** `consult_events.actor_type` column ADD — disambiguation of actor resolution. Forward ALTER ADD COLUMN (nullable; backfill from audit chain on first read or one-shot).
4. **[NEEDS RATIFICATION]** Lifecycle timestamp denormalization columns (`submitted_at`, `abandoned_at`, `queued_at`, `under_review_at`, `decided_at`, `follow_up_started_at`, `completed_at`, `expired_at`, `closed_at`) — NOT in shipped 020. Recommend adding; can backfill from consult_events occurred_at lookups.
5. **[NEEDS RATIFICATION]** `country_of_care CHAR(2)` denormalization on consults — NOT in shipped 020. Recommend adding for CCR-driven hot-path policy resolution.
6. **[NEEDS RATIFICATION]** `version INTEGER` optimistic concurrency column on consults — NOT in shipped 020 (currently uses SELECT FOR UPDATE). Recommend adding to match CDM §4.7 Subscription pattern.
7. ~~`[NEEDS RATIFICATION]` `assigned_clinician_id` composite FK target~~ — **RESOLVED v0.2 (Codex Finding 5):** FK target is `accounts(tenant_id, account_id)`; composite FK constraint inline in the DDL.
8. **[NEEDS RATIFICATION]** `audit_event_id` link column on consult_events — adds explicit local-log ↔ audit-chain mapping.
9. **[NEEDS RATIFICATION]** ADR-012 modality conversion semantics — in-place flip vs new-row continuity.
10. ~~`[NEEDS RATIFICATION]` Append-only DB-level enforcement on consult_events~~ — **RESOLVED v0.2 (Codex Finding 7):** BEFORE UPDATE/DELETE trigger is MANDATORY; DDL block authored inline. `audit_event_id` cross-link to audit_records added.

All 4 cross-tenant safety constraints from migration 021 are preserved verbatim — they are permanent per SI-005 and survive ratification.

## Promotion ledger entry proposal

CDM §4 expansion is a substantive structural addition (not merely additive enum widening as SI-002/SI-004 are). Recommend a **separate Promotion Ledger entry, P-013** (or P-014 if SI-002/SI-004 collapse to P-012 and SI-003 takes P-013) covering the §4.16 + §4.17 addition. Version path options:

- **CDM v1.3 minor bump** — clean, signals new §4 entries, parallel to v1.2's §4-bis bump for ecom. **Recommended.**
- **CDM v1.2 in-place amend** with §4.16 / §4.17 appended and a doc-control entry — matches the v1.10.1 hygiene-cycle precedent but obscures the structural addition.

`[NEEDS RATIFICATION: v1.3 minor bump (recommended) vs v1.2 in-place amend.]`

If Evans selects v1.3, paired updates to: Artifact Registry (entry for CDM v1.3 + supersession of v1.2 with v1.2 preserved at existing path); Active Document Index §1 (canonical pointer bump); Engineering Handoff Build Guide §6 cross-reference table; Async Consult Slice PRD v1.0 §15 (parent-doc pointer).

## Spec references

- `Telecheck_Canonical_Data_Model_v1_2.md` §3.4 entities #15 / #16 + §4 expansion style precedent (§4.7 Subscription, §4.8 SubscriptionEvent as the closest pattern)
- `Telecheck_State_Machines_v1_1.md` §3 (async 17-state) + §4 (sync overlap) — load-bearing behavioral contract this schema persists
- `Telecheck_Contracts_Pack_v5_00_INVARIANTS.md` — I-003, I-023 (RLS tenant filter), I-026 (tenant_id immutable post-creation), I-027 (audit append-only)
- `Telecheck_ADR_Set_v1_0.md` ADR-012 (async↔sync conversion), ADR-023 (multi-tenancy), ADR-024 (CCR)
- `Telecheck_Async_Consult_Slice_PRD_v1_0.md` §1, §2, §11, §12, §15
- `Telecheck_Tenant_Threading_Addendum_v1_0.md` (tenant scoping pattern for v1.0 slices)
- Paired closure artifact: `Telecheck_SI_004_Async_Consult_Audit_Events_Ratification_DRAFT.md` (this SI cycle)
- Engineering ship sites: `telecheck-app/migrations/020_async_consult.sql`, `telecheck-app/migrations/021_async_consult_tenant_boundary_constraints.sql`
- Adjacent unresolved: SI-001 (MedicationRequest schema; `consult.prescribed` payload + future `prescribing_consult_id` back-reference depend on it)
