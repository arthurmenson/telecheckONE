# SI-019 — Medication Interaction & Validation Engine Slice PRD v1.0 → v2.0 implementation-readiness extension

**Version:** 0.4 DRAFT (R2 closures applied 2026-05-20)
**Status:** **DRAFT / POST-R2.** Codex R2 returned 2 HIGH + 1 MED — all within Option A scope, all closed inline per established cadence: HIGH-1 (initial transition from_state enum couldn't satisfy CHECK because none/NULL not declared) → added `none` sentinel enum value + reformulated CHECK as enumerated triple; HIGH-2 (MV RLS not natively supported in PostgreSQL) → replaced direct MV grants with SECURITY BARRIER view + optional SECURITY DEFINER access function pattern, both applying `current_setting('app.tenant_id')` predicate at I-023 layer 2; MED-1 (stale MV reads could drive clinical gating) → reclassified all enforcement/gating reads (override procedure, prescribing decision gates, refill release checks, protocol gates, pharmacy enforcement) as STRICT-FRESHNESS (transition table direct), MV permitted only for non-authoritative hot-path display with stale-state labeling required. Awaiting R3.
**Authoring location:** `Telecheck_v1_10_PRD_Update/` (workstream folder; ratifier-input artifact)
**Owner:** Clinical Governance Lead (existing v1.0 owner) + Async Consult slice owner (cross-cutting consumer)
**Related artifacts:**
- `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Medication_Interaction_Engine_Slice_PRD_v1_0.md` (current canonical v1.0; the artifact this SI extends)
- `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Master_Completion_Plan_v1_0.md` §"Recommended next-session fan-out" item 2 — explicitly names Med-Interaction as "the new critical path" + Track 1 anchor
- `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Master_Completion_Plan_v1_0.md` §"Pilot-viable scope (Ghana revenue anchor)" — Med-Interaction is item #1 of the 5 pilot-required slices; the ONLY one tagged as "skeleton"

---

## 1. Why this SI exists

The Master Completion Plan v1.0 calls Med-Interaction the **new critical path** for pilot launch and tags it as "only skeleton among pilot-required slices." Reading Med-Interaction v1.0 against other v2.x slice PRDs (Pharmacy v2.1, Forms-Intake v2.1, Admin Backend v1.1) confirms the gap: v1.0 is **design-spec-complete** (5 check classes, severity model, signal taxonomy, edge cases, performance targets, audit obligations, dependencies) but **implementation-detail-incomplete** — it lacks the engineering surface that other slices at v2.x have codified.

The Plan's "spec ratification leads implementation by ≥1 sprint" rule means implementation cannot begin until the implementation-detail extensions are spec-ratified. This SI is the work plan for that extension.

**Scope:** specify the categories of v1.0 → v2.0 extension content + propose sub-decisions for each + identify cross-artifact contributions (CDM entities, OpenAPI endpoints, DOMAIN_EVENTS, AUDIT_EVENTS, RBAC roles, state machines, tenant-threading per ADR-023). Each sub-decision is a separate ratifier-decision item; the SI as a whole goes through Codex pre-ratification convergence before ratifier ceremony.

**Out of scope (deferred to later SIs):**
- Knowledge base vendor selection (v1.0 §15 Open Question 1 — needs procurement / commercial evaluation, not spec work)
- Pediatric/geriatric criteria localization for Ghana market (v1.0 §15 OQ 7 — needs clinical governance review)
- Engine versioning cadence policy (v1.0 §15 OQ 8 — needs operational decision)
- Pharmacogenomic real PGx integration (v1.0 §4.4 "stub" — needs separate slice OR future SI)

---

## 2. Identified gaps + proposed sub-decisions

Eight sub-decision categories. Each one is a ratifier-decision item; some can be batched.

### Sub-decision 1: CDM §4 new entity expansions

**Gap.** Med-Interaction v1.0 §5.1 specifies a "Signal structure" payload but no canonical row shape. The engine's evaluation records, signal records, and override records need CDM entities.

**Proposed CDM additions (4 new entities under Option A; row shapes per SI-007/SI-008/SI-009 ratification precedent + I-035 append-only-only invariant):**

1. **`interaction_engine_evaluation` (new entity, CDM §4.X)** — one row per engine invocation. Columns: `id` ULID, `tenant_id` Telecheck-{country}, `patient_id` FK to patients, `triggered_by` enum (`prescribing | refill | protocol_gate | manual_recheck | lab_update | adverse_event_investigation`), `triggered_by_resource_id` ULID (the prescription / refill / protocol-execution / lab-result / adverse-event ID that triggered), `evaluated_at` timestamp, `evaluation_window_ms` int (latency observability), `engine_version` semver, `knowledge_base_version` semver, `medication_set_snapshot` JSONB (the medication list considered), `condition_set_snapshot` JSONB, `lab_set_snapshot` JSONB (with `lab_freshness_status_at_evaluation` per signal). Triple-composite UNIQUE `(tenant_id, patient_id, id)` + CHECK constraint on triggered_by enum. Strict append-only per I-035 (`enforce_append_only()` trigger).
2. **`interaction_signal` (new entity, CDM §4.X+1)** — one row per signal produced by an evaluation. Columns: `id` ULID, `tenant_id`, `evaluation_id` FK to interaction_engine_evaluation, `check_class` enum (`drug_drug | drug_condition | drug_lab | pharmacogenomic | special_clinical_flag`), `severity` enum (`critical | major | moderate | minor`), `recommended_action` enum (`block | warn | monitor`), `medications_involved` ULID[], `evidence_sources` JSONB (knowledge base citations), `signal_payload` JSONB (the structured signal per v1.0 §5.1). FK 1 composite to evaluation. **Strict append-only per I-035 (`enforce_append_only()` trigger; BEFORE UPDATE rejects ALL columns; BEFORE DELETE rejects DELETE).** No `state` column — current lifecycle state is DERIVED from `interaction_signal_lifecycle_transition` per Sub-decision 5.
3. **`interaction_signal_override` (new entity, CDM §4.X+2)** — one row per clinician override. Columns: `id` ULID, `tenant_id`, `signal_id` FK to interaction_signal, `override_by_clinician_account_id` FK to accounts, `override_at` timestamp, `override_rationale` text NOT NULL (free-text + KMS-encrypted at rest per same pattern as Consult clinician decision rationale), `override_rationale_kms_envelope` 8-column flat envelope (mirrors SI-005). Strict append-only per I-035. **Co-INSERTed atomically with a paired `interaction_signal_lifecycle_transition` row of `to_state = 'overridden'` per Sub-decision 8 procedure** — see Sub-decision 5.
4. **`interaction_signal_lifecycle_transition` (new entity, CDM §4.X+3) — Option A append-only transition log; replaces UPDATE-on-signal-row pattern.** Columns: `id` ULID, `tenant_id`, `signal_id` FK to interaction_signal, `from_state` enum (**7 values: `none | emitted | active | overridden | superseded | resolved | expired`** — `none` is the sentinel pre-existence state used ONLY by the initial emission transition; R2 HIGH-1 closure 2026-05-20), `to_state` enum (**6 values: `emitted | active | overridden | superseded | resolved | expired`** — `none` is NOT a valid to_state; no transition ends in pre-existence), `transition_reason` enum (`emission | activation | override | superseded_by_evaluation | resolution_event | time_expiry`), `transition_at` timestamp, `transition_by_actor_id` ULID NULL (clinician account_id on override; NULL on system-driven transitions), `transition_by_actor_role` enum (`clinician | system | engine_evaluator | scheduler`), `metadata` JSONB (e.g., `superseded_by_evaluation_id` for superseded; `medication_discontinuation_event_id` for resolution; `time_window_basis` for expiry; `override_id` for override). Composite FK to (tenant_id, signal_id) on interaction_signal. **CHECK constraint enforces only allowed `(from_state, to_state, transition_reason)` triples per the state machine in Sub-decision 5; the initial emission row is the ONLY row permitted to use `from_state='none'`.** Strict append-only per I-035 (`enforce_append_only()` trigger). UNIQUE constraint `(tenant_id, signal_id, transition_at, id)` to prevent dup-INSERT races; advisory-lock pattern at write time per SI-008/SI-009 precedent for race serialization.

**Promotion-class:** content-change; CDM bump (TBD destination version).

**Recommendation:** APPROVE (4 new entities under Option A; structural; matches established CDM expansion pattern from SI-005 + SI-008 + SI-009; I-035-aligned append-only-only persistence).

**Read-path optimization (Sub-decision 9 below):** an OPTIONAL rebuildable materialized view `interaction_signal_current_state` derived from `interaction_signal_lifecycle_transition` provides O(1) current-state lookup without breaking I-035 (the view is non-authoritative; the transition table is the source of truth; the view can be dropped + rebuilt at any time without data loss).

### Sub-decision 2: AUDIT_EVENTS new action IDs

**Gap.** v1.0 §12 Audit names categories but does not enumerate canonical AUDIT_EVENTS action IDs.

**Proposed Cat A action IDs (4 new; partition tier P1 patient-bound per SI-018):**

1. `interaction_engine_evaluation_completed` (Cat C operational; or Cat A clinical-decision-evidence — ratifier decides) — emitted when an evaluation completes (success or no-signals).
2. `interaction_signal_emitted` (Cat A) — emitted per signal produced (one event per `interaction_signal` row).
3. `interaction_signal_override` (already exists in canonical AUDIT_EVENTS v5.5 catalog at line 147 — Cat A) — preserved; envelope payload may need expansion per the new signal-override entity.
4. `interaction_engine_evaluation_failed` (Cat B governance; non-clinical-evidence) — emitted when engine evaluation fails (timeout, KB unreachable, schema mismatch).

**Proposed Cat B action IDs (2 new):**

5. `interaction_engine_knowledge_base_updated` (Cat B governance) — emitted when the knowledge base version is bumped (dual-control per I-015).
6. `interaction_engine_signal_enforcement_override` (Cat B governance) — emitted when a critical/major signal's block action is overridden via the dual-control safety pathway.

**Promotion class:** content-change; AUDIT_EVENTS +1 minor bump.

**Recommendation:** APPROVE for items 1, 2, 4, 5, 6; preserve item 3 unchanged.

**Open question for ratifier:** is `interaction_engine_evaluation_completed` Cat A or Cat C? Cat A captures clinical-evidence-of-evaluation; Cat C is operational-metadata. Recommendation: Cat A (the evaluation completion is clinical-decision-evidence in audit-attribution context; the operational latency metrics are observable from the row shape but not the categorization criterion).

### Sub-decision 3: DOMAIN_EVENTS new event types

**Gap.** v1.0 §6 + §7 imply domain events fire (interaction-engine-evaluated, signal-emitted, override-recorded) but doesn't enumerate canonical event types.

**Proposed event types (tenant-scoped per DOMAIN_EVENTS v5.2; additive enum extension; no version bump):**

1. `medication_interaction.evaluation_completed.v1` — partition_key `tenant_id:patient_id`
2. `medication_interaction.signal_emitted.v1` — partition_key `tenant_id:patient_id`
3. `medication_interaction.signal_override_recorded.v1` — partition_key `tenant_id:patient_id`
4. `medication_interaction.evaluation_failed.v1` — partition_key `tenant_id:patient_id` (or null on KB-unreachable case; ratifier clarifies)
5. **`medication_interaction.signal_lifecycle_transition_emitted.v1` (Option A add 2026-05-20)** — partition_key `tenant_id:patient_id`; emitted on every INSERT into `interaction_signal_lifecycle_transition`; carries `signal_id`, `from_state`, `to_state`, `transition_reason`, `transition_at`. Subscribed by the rebuildable projection refresher (Sub-decision 9) for incremental MV refresh AND by patient-facing surfaces that need lifecycle-change push notifications.

**Subscribers (read-only consumers; new amendments to existing slice subscriber lists):**
- Async Consult clinician-decision branch — re-evaluate gating logic on `signal_emitted` if new critical/major appeared since prescribing
- Pharmacy portal — show "new signals since approval" indicator on `signal_emitted`
- Adverse Event Reporting — correlation engine for missed-signal analysis subscribes to `evaluation_completed` + `signal_emitted` + `signal_override_recorded`
- Mobile patient app — patient-facing read-only summary of signals on the patient's medication list

**Promotion class:** content-change; DOMAIN_EVENTS additive (no version bump).

**Recommendation:** APPROVE.

### Sub-decision 4: OpenAPI endpoint set

**Gap.** v1.0 has zero OpenAPI traceability. Per OpenAPI v0.2 + Pharmacy v2.1 precedent, every slice with API surface enumerates its endpoints in the slice PRD.

**Proposed endpoints (8 new; tenant-scoped per ADR-023; RLS-enforced):**

1. `POST /v1/medication-interaction/evaluations` — trigger an engine evaluation; body specifies trigger + patient_id + (optional) medication_set override; returns `evaluation_id`.
2. `GET /v1/medication-interaction/evaluations/:evaluation_id` — read an evaluation + its signals (clinician + pharmacist + AI Mode 2 consumers).
3. `GET /v1/medication-interaction/signals/:signal_id` — read a single signal (cross-reference from audit row).
4. `POST /v1/medication-interaction/signals/:signal_id/overrides` — clinician records an override.
5. `GET /v1/medication-interaction/patients/:patient_id/active-signals` — list currently-active signals for a patient (clinician + pharmacist dashboards).
6. `GET /v1/medication-interaction/knowledge-base/version` — query active KB version (consumed by audit envelopes + monitoring).
7. `POST /v1/medication-interaction/knowledge-base/updates` — admin endpoint for dual-control KB version updates.
8. `GET /v1/medication-interaction/health` — engine health check (separate from app-level /health; surfaces KB connectivity + latency observability).

**Promotion class:** content-change; OpenAPI v0.2 → v0.3 (8 new endpoints).

**Recommendation:** APPROVE.

**Open question for ratifier:** are endpoints 1 + 7 idempotent? Recommendation: YES — endpoint 1 uses `Idempotency-Key` header per canonical IDEMPOTENCY contract; endpoint 7 idempotent on `(kb_version_target, attempted_at)` tuple.

### Sub-decision 5: State machine for signal lifecycle (Option A: derived from append-only transition rows)

**Gap.** v1.0 has no state machine for signal lifecycle. State Machines v1.1 §X (new) should formalize the lifecycle.

**Proposed state machine — `interaction_signal_lifecycle`:**

States: `emitted → active → (overridden | superseded | resolved | expired)`

- `emitted` (initial state on signal row insertion; visible at clinician/pharmacist decision surfaces). Recorded as the FIRST `interaction_signal_lifecycle_transition` row inserted atomically alongside the `interaction_signal` row.
- `active` (signal continues to apply; visible in all consumer surfaces). Reached via `emitted → active` transition row inserted by the engine immediately after evaluation completion if no override applied at decision time.
- `overridden` (clinician documented override; signal remains in audit but no longer gates new actions). Reached via `active → overridden` transition row co-INSERTed atomically with the paired `interaction_signal_override` row by `record_interaction_signal_override()` per Sub-decision 8.
- `superseded` (a new evaluation produced a different signal for the same medication pair; old signal is superseded). Reached via `active → superseded` transition row inserted by the engine on the prior signal during a fresh evaluation.
- `resolved` (the underlying condition is no longer present — e.g., medication discontinued + 30-day washout period elapsed). Reached via `active → resolved` transition row inserted by a domain-event subscriber on medication-discontinuation event.
- `expired` (a time-bounded signal — e.g., post-procedure interaction window — has passed). Reached via `active → expired` transition row inserted by the engine background job.

**Persistence model (Option A — append-only-only per I-035):**

- The `interaction_signal` row itself is IMMUTABLE post-INSERT (`enforce_append_only()` BEFORE UPDATE/DELETE trigger).
- Each lifecycle transition is recorded as a new INSERT into `interaction_signal_lifecycle_transition` (Sub-decision 1 entity 4).
- "Current state of signal X" is DERIVED as: `SELECT to_state FROM interaction_signal_lifecycle_transition WHERE signal_id = X ORDER BY transition_at DESC, id DESC LIMIT 1` (deterministic by `(transition_at, id)` tie-breaker per Pass-1 idempotency-race guidance). The query is guaranteed to return exactly one row for any existing signal because Sub-decision 8 (and the engine evaluator's signal-INSERT path) atomically INSERTs the initial `none → emitted` row alongside every `interaction_signal` row — no signal exists without at least one transition row.
- The CHECK constraint on `interaction_signal_lifecycle_transition` enforces only allowed `(transition_reason, from_state, to_state)` triples (per R2 HIGH-1 closure 2026-05-20: `from_state='none'` sentinel replaces the prior `NULL` for the initial emission transition):

```
('emission',                 'none'     → 'emitted')
('activation',               'emitted'  → 'active')
('override',                 'active'   → 'overridden')
('superseded_by_evaluation', 'active'   → 'superseded')
('resolution_event',         'active'   → 'resolved')
('time_expiry',              'active'   → 'expired')
```

Equivalent CHECK clause (all six triples enumerated; no NULLs in either state column):

```sql
CONSTRAINT interaction_signal_lifecycle_transition_valid_triple CHECK (
    (transition_reason = 'emission'                 AND from_state = 'none'    AND to_state = 'emitted')
 OR (transition_reason = 'activation'               AND from_state = 'emitted' AND to_state = 'active')
 OR (transition_reason = 'override'                 AND from_state = 'active'  AND to_state = 'overridden')
 OR (transition_reason = 'superseded_by_evaluation' AND from_state = 'active'  AND to_state = 'superseded')
 OR (transition_reason = 'resolution_event'         AND from_state = 'active'  AND to_state = 'resolved')
 OR (transition_reason = 'time_expiry'              AND from_state = 'active'  AND to_state = 'expired')
)
```

- Terminal states (`overridden`, `superseded`, `resolved`, `expired`) MUST NOT have further outgoing transitions; the CHECK constraint rejects any row whose `from_state` is one of those four.
- Idempotency-race safety: the `record_interaction_signal_override()` procedure (Sub-decision 8) acquires an advisory lock on `(tenant_id, signal_id)` before checking current state + inserting the transition row, preventing two concurrent overrides from both seeing `active` and both inserting `active → overridden` rows.

Transitions per the canonical pattern (per R2 HIGH-1 closure: initial transition uses `none` sentinel from_state, not NULL):
- `none → emitted` (atomic with `interaction_signal` row INSERT during engine evaluation; `transition_reason='emission'`)
- `emitted → active` (engine post-emission activation; automatic if no override at decision time; `transition_reason='activation'`)
- `active → overridden` (Sub-decision 8 procedure; atomic with `interaction_signal_override` row INSERT; `transition_reason='override'`)
- `active → superseded` (engine, on new evaluation producing replacement signal; `transition_reason='superseded_by_evaluation'`)
- `active → resolved` (domain-event subscriber on medication discontinuation + washout elapsed; `transition_reason='resolution_event'`)
- `active → expired` (engine background job on time-based windows; `transition_reason='time_expiry'`)

Terminal states (no further transitions): `overridden`, `superseded`, `resolved`, `expired`.

**Promotion class:** content-change; State Machines v1.1 → v1.2 (new state machine; described as append-only transition-row pattern per I-035).

**Recommendation:** APPROVE.

### Sub-decision 6: RBAC roles + permissions

**Gap.** v1.0 §3 names actors but doesn't enumerate RBAC roles.

**Proposed RBAC roles (canonical role names per RBAC v1.1):**

- `medication_interaction.evaluator` — service-level role; the engine's database role for evaluation writes (analogous to `consult_decision_writer` in SI-005).
- `medication_interaction.signal_viewer` — read role; granted to `clinician` + `pharmacist` + `ai_clinical_assistant` (Mode 1 + Mode 2) + `admin` roles (least-privilege; no override).
- `medication_interaction.override_recorder` — write role for clinician override; granted to `clinician` role only; requires audit emission on every override.
- `medication_interaction.knowledge_base_updater` — admin role; dual-control per I-015; granted via Admin Backend slice's role assignment surface.

**Promotion class:** content-change; RBAC v1.1 → v1.2 (4 new role definitions).

**Recommendation:** APPROVE.

### Sub-decision 7: Tenant-threading per ADR-023 + I-023 + I-032

**Gap.** v1.0 doesn't explicitly state ADR-023 Model A tenant-threading. All rows on the 3 new entities + all API surfaces need `tenant_id` enforcement.

**Proposed tenant-threading rules:**

- All 3 new entities carry `tenant_id` (Telecheck-{country}) per I-023 layer 2.
- RLS policies on all 3 entities key on `current_setting('app.tenant_id')` per CDM v1.3 line 1016.
- Per-tenant KMS keys for `interaction_signal_override.override_rationale_kms_envelope` (mirroring SI-005's clinician_decision_rationale_encrypted KMS pattern).
- All API endpoints + the engine evaluation procedure (if any) follow I-032 STEP 0 if implemented as SECURITY DEFINER (only the override record-write procedure needs SECURITY DEFINER; everything else is normal RLS-policy-protected DML).
- Cross-tenant break-glass per I-024 — engine evaluations CANNOT cross tenants; an override of a different-tenant patient's signal requires the canonical break-glass + privacy-officer review path.

**Promotion class:** reconciliation entry; no Registry version bump from tenant-threading alone (Registry already at v2.13 with multi-tenant model baked in).

**Recommendation:** APPROVE.

### Sub-decision 8: Per-procedure SECURITY DEFINER (1 new procedure; Option A append-only INSERT pattern)

**Gap.** v1.0 §7 specifies clinician override as auditable but doesn't define the write path. Per Async Consult slice precedent (SI-005's `record_consult_clinician_decision`), override recording should go through a SECURITY DEFINER procedure with multi-step validation including the I-032 Tenant-GUC equality guard (Mode 1 + Mode 2 per the just-ratified canonical text). Under **Option A (Evans-ratified 2026-05-20)** the procedure INSERTs both the `interaction_signal_override` row AND a paired `interaction_signal_lifecycle_transition` row atomically; the `interaction_signal` row itself is NEVER mutated (preserves I-035).

**Proposed procedure:** `record_interaction_signal_override(...)` — SECURITY DEFINER. ~10-step validation:
- STEP 0: I-032 Mode 1 NULL/blank-GUC RAISE + Mode 2 mismatch structured-rejection (per canonical I-032 v5.3)
- STEP 1: auth-FIRST per I-023 layer 2
- STEP 2: idempotency-key validation
- STEP 3: advisory-lock acquisition on `(tenant_id, signal_id)` (race serialization for current-state check vs concurrent override attempts; per SI-008/SI-009 precedent)
- STEP 4: signal-exists check (interaction_signal row must exist) + current-state derivation (most-recent transition row's to_state must be `active`); reject with `signal_not_active` if current state ≠ `active`
- STEP 5: medication-still-on-active-list state check
- STEP 6: clinician-role check (RBAC `medication_interaction.override_recorder` granted)
- STEP 7: atomic INSERT into `interaction_signal_override` AND paired INSERT into `interaction_signal_lifecycle_transition` with `(from_state='active', to_state='overridden', transition_reason='override', transition_by_actor_id=clinician_account_id, transition_by_actor_role='clinician', metadata={'override_id': new_override_id})` — both INSERTs in same transaction; advisory-lock released on transaction commit/rollback
- STEP 8: unique_violation safety net (on both INSERTs)
- STEP 9: rejection emission (Cat A audit `interaction_signal_override` event via canonical app-layer emission per Async-Consult P-021a pattern)

Rejection codes: `tenant_guc_mismatch` (I-032 Mode 2), `idempotency_replay_outcome_mismatch`, `signal_not_active`, `medication_not_on_list`, `unauthorized_role`, `unique_violation`, `advisory_lock_unavailable`. (7 codes; may expand during Codex pre-ratification.)

**Promotion class:** content-change; CDM bump in lockstep with Sub-decision 1's entity additions.

**Recommendation:** APPROVE.

### Sub-decision 9 (NEW, Option A): Optional rebuildable read-path projection

**Gap.** Under Option A's append-only-only persistence model, "get current state of signal X" requires deriving from `interaction_signal_lifecycle_transition`. The most-recent-row lookup is O(transitions-per-signal) at read time, which is fine for typical workloads (1-4 transitions per signal lifetime) but unfriendly for hot-path patient-safety reads (every prescribing/refill/protocol-gate evaluation queries active-signal state for every medication on the patient's list).

**Proposed solution:** an OPTIONAL non-authoritative rebuildable materialized view `interaction_signal_current_state_mv`:

```
CREATE MATERIALIZED VIEW interaction_signal_current_state_mv AS
SELECT DISTINCT ON (signal_id)
    tenant_id, signal_id, to_state AS current_state, transition_at AS as_of, transition_reason
FROM interaction_signal_lifecycle_transition
ORDER BY signal_id, transition_at DESC, id DESC;

CREATE UNIQUE INDEX interaction_signal_current_state_mv_pk
    ON interaction_signal_current_state_mv (tenant_id, signal_id);
```

**Refresh model:**
- `REFRESH MATERIALIZED VIEW CONCURRENTLY interaction_signal_current_state_mv` on a low-jitter schedule (e.g., every 30s) OR triggered incrementally by domain-event subscriber on every `medication_interaction.signal_lifecycle_transition_emitted.v1` (Sub-decision 3 — add 5th event type below).
- The MV is **non-authoritative**: read-time staleness is bounded.
- Reconciliation check: a hourly cron compares MV rows to derived-from-transition-rows; divergence (e.g., from missed REFRESH) RAISES Cat B audit `interaction_engine_projection_divergence_detected` (new audit event added below).
- The MV can be dropped + rebuilt at any time without data loss — the transition table is the source of truth per I-035; the MV is a derived projection.

**Read-path consumer classification (R2 MED-1 closure 2026-05-20: stale MV must not drive clinical gating):**

| Consumer class | Read source | Rationale |
|---|---|---|
| **STRICT-FRESHNESS (transition table direct + advisory lock)** | `interaction_signal_lifecycle_transition` derived-current-state query (per Sub-decision 5 SQL) | All safety-relevant enforcement/gating reads. Includes: Sub-decision 8 override procedure STEP 4 current-state check; **prescribing decision gates** (Async-Consult clinician commit); **refill release checks** (Pharmacy slice); **protocol gates** (Mode 2 protocol execution); **pharmacy enforcement** (release-time signal-block enforcement); cross-prescriber concern surfacing. Stale MV reads on these paths could let an overridden signal continue blocking care OR let a just-overridden critical signal fail to gate a new prescribing decision. NOT acceptable. |
| **HOT-PATH DISPLAY (MV permitted; stale-state labeling required)** | `interaction_signal_current_state_mv` via tenant-scoped access function (see access pattern below) | Non-enforcement reads only. Includes: clinician dashboard active-signal list; pharmacy portal "active signals indicator"; patient-facing mobile app summary; admin reporting. UI MUST label or visually indicate "as of HH:MM" when consuming MV reads, and MUST NOT use MV-derived state to drive clinical actions. |
| **PUSH NOTIFICATION** | `medication_interaction.signal_lifecycle_transition_emitted.v1` domain event subscriber | Real-time lifecycle-change notifications; never stale. |

Implementers MUST classify every new consumer into one of the three categories explicitly; the default for any safety-relevant gating decision is STRICT-FRESHNESS.

**RLS posture (R2 HIGH-2 closure 2026-05-20):**

PostgreSQL materialized views do not natively enforce RLS policies in the same way as ordinary tables — `ENABLE ROW LEVEL SECURITY` on a MV is not a supported trust-boundary primitive. Direct GRANT SELECT on the MV to application roles would therefore be a tenant-isolation bypass.

Canonical access pattern (replaces direct MV grants):

```sql
-- Revoke all direct access to the MV from application roles.
REVOKE ALL ON interaction_signal_current_state_mv FROM PUBLIC;
GRANT SELECT ON interaction_signal_current_state_mv TO mv_refresh_owner;  -- the refresher role only

-- SECURITY BARRIER view applies tenant predicate; this is what app roles read.
CREATE VIEW interaction_signal_current_state_v WITH (security_barrier = true) AS
    SELECT tenant_id, signal_id, current_state, as_of, transition_reason
    FROM interaction_signal_current_state_mv
    WHERE tenant_id = current_setting('app.tenant_id', false)::tenant_id_t;

REVOKE ALL ON interaction_signal_current_state_v FROM PUBLIC;
GRANT SELECT ON interaction_signal_current_state_v TO medication_interaction_signal_viewer;

-- OR: tenant-scoped SECURITY DEFINER access function (alternate equivalent pattern;
-- ratifier picks one at ratification ceremony — both are I-023 layer-2 compliant):
CREATE FUNCTION get_interaction_signal_current_state(p_signal_id ULID) RETURNS RECORD AS $$
    SELECT signal_id, current_state, as_of, transition_reason
    FROM public.interaction_signal_current_state_mv
    WHERE tenant_id = current_setting('app.tenant_id', false)::tenant_id_t
      AND signal_id = p_signal_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = pg_catalog, pg_temp;
ALTER FUNCTION public.get_interaction_signal_current_state(ULID) OWNER TO mv_refresh_owner;
GRANT EXECUTE ON FUNCTION public.get_interaction_signal_current_state(ULID) TO medication_interaction_signal_viewer;
```

Both patterns enforce `tenant_id = current_setting('app.tenant_id')` per I-023 layer 2 BEFORE the underlying MV row is returned. The SECURITY BARRIER view is preferred for read-set queries (e.g., clinician dashboard lists all active signals); the access function is preferred for single-signal lookups. Implementers MAY use either; both are spec-compliant.

**OPEN QUESTION for ratifier (added at R2):** SECURITY BARRIER view vs SECURITY DEFINER access function — pick one canonical pattern OR permit both at implementer discretion? Recommendation: permit both, with implementation guidance "SECURITY BARRIER view for set queries; SECURITY DEFINER function for single-signal lookups" (matches the canonical CDM access-pattern precedents).

**Promotion class:** content-change; CDM addition (1 materialized view) + 1 new domain event type (`signal_lifecycle_transition_emitted`) + 1 new Cat B audit event (`interaction_engine_projection_divergence_detected`).

**Recommendation:** APPROVE as OPTIONAL implementation aid (Phase A may defer the MV + add it in Phase B if read-path latency observability surfaces a hot spot). The amendment lands the SPEC for the MV (read-model contract) regardless of when implementation lands it.

**Cross-references:** Pass-1 recommendation 2026-05-20 ("If read latency is the concern, define a non-authoritative rebuildable projection rather than mutating `interaction_signal.state`"); Pass-2 synthesis 2026-05-20 ("Use append-only transition rows as the source of truth and add only a rebuildable projection/materialized view for frequent reads, with reconciliation checks that compare the projection to transition rows").

---

## 3. Cross-artifact impact summary (Option A, post-OQ7 ratification)

If all 9 sub-decisions ratify, the lockstep PR-A2-class commit lands:

- **CDM:** +**4 new entities** (interaction_engine_evaluation, interaction_signal, interaction_signal_override, **interaction_signal_lifecycle_transition** [Option A add]) + 1 new SECURITY DEFINER procedure (record_interaction_signal_override) + 1 OPTIONAL rebuildable materialized view (interaction_signal_current_state_mv per Sub-decision 9) + 1 SECURITY BARRIER view (interaction_signal_current_state_v per R2 HIGH-2 closure) + 1 optional SECURITY DEFINER access function (get_interaction_signal_current_state per R2 HIGH-2 closure).
- **AUDIT_EVENTS:** +**6 net-new action IDs under Option A** (1 evaluation_completed + 1 signal_emitted + 1 evaluation_failed + 1 knowledge_base_updated + 1 signal_enforcement_override + **1 interaction_engine_projection_divergence_detected** [Cat B, Sub-decision 9 add]; signal_override already exists in canonical).
- **DOMAIN_EVENTS:** +4 new event types (additive enum extension; no version bump).
- **OpenAPI:** +8 endpoints (v0.2 → v0.3).
- **State Machines:** +1 new state machine (interaction_signal_lifecycle); v1.1 → v1.2.
- **RBAC:** +4 new role definitions; v1.1 → v1.2.
- **Slice PRD:** v1.0 → v2.0 with the above codified.
- **Registry:** v2.13 → v2.14 single bump consolidating all of the above.
- **Promotion Ledger:** 1 new entry (P-NUM TBD — likely P-028 if SI-014 hasn't claimed it yet, or next-available).

**Total contract-file bumps:** CDM +1 minor; AUDIT_EVENTS +1 minor; OpenAPI +1 minor; State Machines +1 minor; RBAC +1 minor; Registry +1 minor. **DOMAIN_EVENTS additive (no bump).** Slice PRD bumped v1.0 → v2.0.

---

## 4. Codex pre-ratification target

**Recommendation:** 5 rounds + 1 verification = 6 total. Med-Interaction is a large slice (8 sub-decisions, 3 new entities, 1 new SECURITY DEFINER procedure, 5 new audit events, 4 new domain events, 8 new endpoints, 1 new state machine, 4 new RBAC roles) — Codex convergence trajectory is likely to be 5-7 rounds based on SI-005 (3 rounds) + SI-008 (14 rounds) + SI-009 (6 rounds) + SI-010 (6 rounds rejected) + SI-018 (5 rounds) precedent.

STOP-and-escalate per CLAUDE.md hard-floor item 6 if any round surfaces architectural-judgment findings (e.g., proposed cross-slice canonical-contract amendments, new platform-floor invariants, etc.).

---

## 5. Open questions for ratifier (slice-level decisions not blocking ratification)

Beyond the 8 sub-decisions above, the following questions are open and should be surfaced at ratifier ceremony:

1. **Knowledge base vendor** (preserved from v1.0 §15 OQ 1) — does the v2.0 PRD pin a specific vendor or remain vendor-agnostic with a "knowledge_base_version" abstraction?
2. **Cat A vs Cat C for `interaction_engine_evaluation_completed`** (Sub-decision 2 OQ) — Cat A captures clinical-evidence; Cat C is operational-metadata. Recommendation: Cat A.
3. **DOMAIN_EVENTS partition_key for evaluation_failed when KB unreachable** (Sub-decision 3) — `tenant_id:patient_id` or `tenant_id:null`? Recommendation: `tenant_id:patient_id` (we still know the patient context even if the evaluation failed).
4. **Pharmacogenomic stub** (preserved from v1.0 §4.4) — the v1.0 §4.4 marks PGx as a stub; should v2.0 codify the stub OR remove it pending real PGx integration? Recommendation: codify the stub (no-op behavior; structural placeholder so future PGx integration is additive).
5. **Multi-prescriber notification** (preserved from v1.0 §15 OQ 4) — when signals involve different prescribers' medications, should the engine surface a "cross-prescriber concern" signal, or only notify the currently-prescribing clinician? Recommendation: surface the concern as a signal but route the notification to the currently-prescribing clinician (cross-prescriber visibility through the patient's chart, not via direct notification to the other prescriber).
6. **Patient-reported OTC** (preserved from v1.0 §15 OQ 5) — treat as full medications for interaction checking? Recommendation: YES (treat identically); the patient-reported flag on the medication row is metadata, not a checking gate.

### Open Question 7 (SI-019-OQ-SIGNAL-LIFECYCLE) — **RATIFIED-OPTION-A 2026-05-20** (Evans's chat-message ratification under CLAUDE.md dual-recommendation + two-pass discipline)

**Resolution:** Evans selected Option A. The amendments at Sub-decisions 1, 5, 8 + new Sub-decision 9 (rebuildable projection) implement the ratified decision. The contradiction that triggered Codex R1 STOP is resolved: `interaction_signal` is strict append-only; lifecycle progression is recorded as INSERTs into the new `interaction_signal_lifecycle_transition` entity (Sub-decision 1 entity 4); current state is derived from most-recent transition row; the optional rebuildable MV (Sub-decision 9) addresses Claude's original read-path concern without breaking I-035.

**Three-way recommendation trail (recorded for ratification audit):**

- **Claude's draft (pre-evidence):** Option B citing P-021 two-tier append-only precedent + read-path simplicity + migration story.
- **Codex Pass-1 (source-first independent 2026-05-20, thread `019e48d3-c38b-79a1-9275-104820205838`):** Option A variant + rebuildable projection; identified I-035 as decisive; called Option B deal-breaker disqualified unless explicit I-035 amendment recorded.
- **Codex Pass-2 (contrast-and-synthesize 2026-05-20, thread `019e48d6-211c-7c30-ab79-83abab975f37`):** Option A canonical + optional rebuildable projection; NEW consideration not in either prior position — Option B's mutable state + audit log creates two authorities that can diverge under retry/partial-failure/repair; Option A model derives single source of truth.
- **Claude post-evidence (shifted):** Option A canonical + rebuildable projection. Original draft missed I-035 entirely; I-035 ratification 2026-05-20 (P-027) post-dates P-021 (2026-05-17), so P-021's two-tier pattern is grandfathered for SI-005's specific entity (consults) not governing precedent for new SIs like SI-019.

**Convergence:** all three positions converged on Option A after evidence surfaced. Hard-floor item 6 escalation correctly held: ratifier (Evans) made the final architectural decision via chat-message ratification; auto-proceed disallowed regardless of reviewer agreement.

#### Original framing preserved below for ratification-audit reproducibility

**Trigger:** Codex R1 on SI-019 v0.1 (2026-05-19, review-mpcvz3wr-593vo1) explicitly invoked CLAUDE.md hard-floor item 6: *"Append-only signal rows conflict with required lifecycle state updates... This is a blocking implementation-readiness issue because the spec gives contradictory persistence semantics for a safety-critical clinical signal."*

**The contradiction:** Sub-decision 1 declares `interaction_signal` strict append-only (BEFORE UPDATE + BEFORE DELETE triggers per I-016 + I-003). Sub-decision 5 defines `interaction_signal_lifecycle` state machine with transitions `active → overridden | superseded | resolved | expired` that require UPDATE on the same row. Sub-decision 8 the SECURITY DEFINER procedure `record_interaction_signal_override` explicitly performs `active → overridden` UPDATE. Implementers cannot satisfy both requirements without breaking either audit immutability or override behavior.

**Two architectural options for Evans's ratifier decision:**

**Option A — Immutable signal rows + append-only transition entity (lifecycle decoupled from signal row).**

- `interaction_signal` stays strict append-only per I-016 + I-003. No state column; no UPDATE triggers needed.
- NEW 4th CDM entity: `interaction_signal_lifecycle_transition` — one row per transition. Columns: `id` ULID, `tenant_id`, `signal_id` FK, `from_state` enum, `to_state` enum, `transition_reason` enum (`override | superseded_by_evaluation | resolution_event | time_expiry`), `transition_at` timestamp, `transition_by_actor_id` ULID (clinician if override; system if automatic), `metadata` JSONB (e.g., new_evaluation_id for superseded; medication_discontinuation_event_id for resolution; time_window_basis for expiry).
- `interaction_signal_lifecycle` state machine becomes a stateless DERIVED view: a signal's current state = `most_recent(interaction_signal_lifecycle_transition WHERE signal_id = ...) ?? 'active'` (default `active` if no transition row exists).
- `record_interaction_signal_override` procedure INSERTs a transition row instead of UPDATEing the signal row.
- **Pros:** preserves I-016 + I-003 audit-immutability invariants; transition history is fully queryable; pattern matches Promotion Ledger append-only model; consistent with SI-008's `audit_events` strict append-only design.
- **Cons:** every read of "current signal state" requires a JOIN to transition table; +1 entity to CDM scope; slightly more storage.

**Option B — Constrained signal-row updates + audited transition rows (state column on signal row).**

- `interaction_signal` gains a `state` column with CHECK constraint enforcing only allowed `(OLD.state, NEW.state)` transitions. BEFORE UPDATE trigger is conditional: it permits only the allowed state transitions; rejects any other UPDATE (including any attempt to modify non-state columns).
- NEW 4th CDM entity: `interaction_signal_transition_log` (audit-history table; like P-021's `consult_events`) — one row per allowed transition. Strict append-only.
- `interaction_signal_lifecycle` state machine reads/writes the `state` column on the signal row directly.
- `record_interaction_signal_override` procedure UPDATEs `interaction_signal.state` AND INSERTs a transition log row in a single atomic transaction.
- **Pros:** "current signal state" is directly readable from the signal row; matches existing P-021 `consults` two-tier append-only pattern (Tier 0 identity immutable + Tier 1 payload immutable post-decision + Tier 2 state-machine progression).
- **Cons:** the I-016 + I-003 invariant interpretation is "audit-history is append-only" (the transition log), NOT "every audit-relevant entity row is immutable." Some implementers may read I-016/I-003 strictly enough that constrained signal-row updates would be perceived as a relaxation. (Counter-argument: P-021's two-tier append-only pattern was ratified at SC3 with exactly this interpretation; SI-019 Option B is the same pattern.)

**Claude's advisory recommendation (advisory only; ratifier decides):** **Option B.** Reasoning:

1. **Cycle precedent.** P-021 (SC3 ratification 2026-05-17) explicitly ratified the two-tier append-only pattern on `consults` (Tier 0 identity immutable from INSERT + Tier 1 payload immutable post-decision + Tier 2 state-machine progression via guarded transitions). Med-Interaction signals are structurally analogous to consult clinical-decision rows; the same pattern is the consistent precedent application.
2. **I-016 + I-003 invariant alignment.** P-021's ratification confirmed the interpretation "audit-history is append-only + state machine progression on the entity row is permitted via guarded transitions" is invariant-compliant. Option B inherits that interpretation.
3. **Read-path simplicity.** "Get current signal state" is a frequent read (every clinician decision surface, every pharmacy release check, every protocol gate). Option A requires a JOIN; Option B is a direct column read. The patient-safety system reads signals on every prescribing/refill action; latency matters.
4. **Migration story.** Option B preserves the existing v1.0 §5.1 Signal structure (which has a `severity` + implicit state-like fields); Option A would require restructuring the existing signal model + the canonical PRD wording.

**If Evans selects Option A:** Sub-decision 1 simplifies (no triggers needed on signal row), Sub-decision 5 redefines the state machine as a derived view, Sub-decision 8 procedure rewrites to INSERT transition rows; total scope: same +3 entities → +4 entities (add interaction_signal_lifecycle_transition).

**If Evans selects Option B:** Sub-decision 1 updates to state-column + constrained UPDATE trigger pattern (matches P-021), Sub-decision 5 stays as-is, Sub-decision 8 procedure stays as-is; total scope: same +3 entities (the transition log table is the 3rd entity per Option B's framing) plus the state column on `interaction_signal`.

**Decision Memo template available for either Option** if Evans signals which path he prefers; the corresponding SI-019 amendment + Codex re-verification cycle follows.

---

## 6. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; awaiting Codex R1.

**v0.2 DRAFT 2026-05-19 — R1 STOP-and-queue:** Codex R1 invoked CLAUDE.md hard-floor item 6 on Sub-decision 1 ↔ Sub-decision 5 ↔ Sub-decision 8 contradiction (interaction_signal strict append-only vs state machine UPDATE transitions). Iteration HALTED. Open Question 7 framed for ratifier decision.

**v0.3 DRAFT 2026-05-20 — R1 STOP-condition RESOLVED via Option A ratification:**
- Three-way dual-recommendation consult executed under CLAUDE.md discipline (Claude draft + Codex Pass-1 source-first independent + Codex Pass-2 contrast-and-synthesize)
- All three converged on Option A canonical + rebuildable projection
- Evans's chat-message ratification 2026-05-20 selected Option A
- Sub-decisions 1, 5, 8 amended for Option A append-only-only persistence per I-035
- New Sub-decision 9 added (optional rebuildable materialized view for read-path)
- 4th CDM entity `interaction_signal_lifecycle_transition` added per Sub-decision 1
- §3 cross-artifact impact summary recalculated (CDM: +3 → +4 entities; AUDIT_EVENTS: +5 → +6 net-new action IDs)
- OQ7 flipped from STOP-CONDITION to RATIFIED-OPTION-A
- Codex pre-ratification cycle resumes from R2 on resolved spec

**Convergence target:** 4-5 rounds + 1 ship-it verification = 5-6 total. Med-Interaction scope is large (9 sub-decisions, 4 new entities, 1 new SECURITY DEFINER procedure, 6 new audit events, 5 new domain events incl. new transition_emitted event, 8 new endpoints, 1 new state machine described as derived from append-only transitions, 4 new RBAC roles, 1 optional MV) — but the architectural contradiction is resolved; remaining rounds focus on row-shape + procedure-validation + cross-artifact alignment defects.

**v0.4 DRAFT 2026-05-20 — R2 closures applied (2 HIGH + 1 MED):**
- **R2 HIGH-1 closed:** initial emission transition's `from_state` couldn't be NULL under declared enum. Fix: added `none` sentinel enum value (`from_state` enum now 7 values; `to_state` enum stays at 6 values — `none` is NEVER a valid to_state); CHECK constraint reformulated as enumerated 6-triple `OR` predicate explicitly enumerating each `(transition_reason, from_state, to_state)` triple; derived-current-state SQL note clarified that exactly one row always returned because initial emission row is atomic with signal INSERT.
- **R2 HIGH-2 closed:** PostgreSQL materialized views don't natively enforce RLS — direct GRANT SELECT on MV is a tenant-isolation bypass. Fix: REVOKE ALL FROM PUBLIC on MV; restrict to `mv_refresh_owner` role only; expose access via SECURITY BARRIER view `interaction_signal_current_state_v` (applies `tenant_id = current_setting('app.tenant_id')` filter at view level per I-023 layer 2) OR optional SECURITY DEFINER access function `get_interaction_signal_current_state(p_signal_id)` (locked search_path + ALTER FUNCTION OWNER per SECURITY DEFINER discipline). Both patterns canonical; implementers pick per use case (view for sets; function for singletons). New OPEN QUESTION for ratifier: pick one canonical pattern OR permit both? Recommendation: permit both.
- **R2 MED-1 closed:** stale 30s MV reads could let prescribing/refill/protocol-gate enforcement see overridden signals as still active. Fix: explicit read-path consumer classification table — STRICT-FRESHNESS (transition table direct + advisory lock) for ALL enforcement/gating reads (override procedure, prescribing decision gates, refill release checks, protocol gates, pharmacy enforcement, cross-prescriber concern); HOT-PATH DISPLAY (MV via access pattern; stale-state labeling required) for non-enforcement only (dashboards, patient-facing summaries, admin reporting); PUSH NOTIFICATION (domain event subscriber; never stale). Implementers MUST classify every consumer explicitly; default for safety-relevant gating is STRICT-FRESHNESS.

---

## 7. Sequence for ratification

1. ~~Codex pre-ratification cycle on this SI (target 5 + 1 = 6 rounds).~~ **R1 STOP-condition resolved 2026-05-20 via Option A ratification (OQ7).** Resume from R2 on v0.3 DRAFT.
2. SI converges → Decision Brief authored summarizing the 9 sub-decisions + 6 remaining open questions for ratifier review (OQ7 already ratified).
3. Ratifier ceremony (Evans-led; chat-message ratification per cycle precedent).
4. Canonical content port lockstep commit lands CDM + AUDIT_EVENTS + DOMAIN_EVENTS + OpenAPI + State Machines + RBAC + Slice PRD v2.0 + Promotion Ledger entry P-033 + Registry v2.19 → v2.20 bump in single commit.
5. Implementation work begins on telecheck-app code repo (post-ratification per "spec ratification leads implementation by ≥1 sprint" rule).

---

— Claude (Opus 4.7, 1M context), SI-019 v0.1 DRAFT authored 2026-05-19 under "lets keep working. we are behind time" + standing autonomous-work authorization per CLAUDE.md. v0.3 DRAFT authored 2026-05-20 post-Evans's Option A ratification on OQ7 via three-way dual-recommendation convergence (Claude post-evidence + Codex Pass-1 + Codex Pass-2 all on Option A canonical + rebuildable projection).
