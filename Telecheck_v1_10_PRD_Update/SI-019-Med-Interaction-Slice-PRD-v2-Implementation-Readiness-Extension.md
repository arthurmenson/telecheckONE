# SI-019 — Medication Interaction & Validation Engine Slice PRD v1.0 → v2.0 implementation-readiness extension

**Version:** 0.1 DRAFT
**Status:** Pre-Codex-pre-ratification; not yet routed to ratifier
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

**Proposed CDM additions (3 new entities; row shapes per SI-007/SI-008/SI-009 ratification precedent):**

1. **`interaction_engine_evaluation` (new entity, CDM §4.X)** — one row per engine invocation. Columns: `id` ULID, `tenant_id` Telecheck-{country}, `patient_id` FK to patients, `triggered_by` enum (`prescribing | refill | protocol_gate | manual_recheck | lab_update | adverse_event_investigation`), `triggered_by_resource_id` ULID (the prescription / refill / protocol-execution / lab-result / adverse-event ID that triggered), `evaluated_at` timestamp, `evaluation_window_ms` int (latency observability), `engine_version` semver, `knowledge_base_version` semver, `medication_set_snapshot` JSONB (the medication list considered), `condition_set_snapshot` JSONB, `lab_set_snapshot` JSONB (with `lab_freshness_status_at_evaluation` per signal). Triple-composite UNIQUE `(tenant_id, patient_id, id)` + CHECK constraint on triggered_by enum.
2. **`interaction_signal` (new entity, CDM §4.X+1)** — one row per signal produced by an evaluation. Columns: `id` ULID, `tenant_id`, `evaluation_id` FK to interaction_engine_evaluation, `check_class` enum (`drug_drug | drug_condition | drug_lab | pharmacogenomic | special_clinical_flag`), `severity` enum (`critical | major | moderate | minor`), `recommended_action` enum (`block | warn | monitor`), `medications_involved` ULID[], `evidence_sources` JSONB (knowledge base citations), `signal_payload` JSONB (the structured signal per v1.0 §5.1). FK 1 composite to evaluation. Strict append-only (BEFORE UPDATE + BEFORE DELETE triggers per I-016 + I-003).
3. **`interaction_signal_override` (new entity, CDM §4.X+2)** — one row per clinician override. Columns: `id` ULID, `tenant_id`, `signal_id` FK to interaction_signal, `override_by_clinician_account_id` FK to accounts, `override_at` timestamp, `override_rationale` text NOT NULL (free-text + KMS-encrypted at rest per same pattern as Consult clinician decision rationale), `override_rationale_kms_envelope` 8-column flat envelope (mirrors SI-005). Strict append-only.

**Promotion-class:** content-change; CDM bump (TBD destination version).

**Recommendation:** APPROVE (3 new entities; structural; matches established CDM expansion pattern from SI-005 + SI-008 + SI-009).

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

### Sub-decision 5: State machine for signal lifecycle

**Gap.** v1.0 has no state machine for signal lifecycle. State Machines v1.1 §X (new) should formalize the lifecycle.

**Proposed state machine — `interaction_signal_lifecycle`:**

States: `emitted → active → (overridden | superseded | resolved | expired)`

- `emitted` (initial state on signal row insertion; visible at clinician/pharmacist decision surfaces)
- `active` (signal continues to apply; visible in all consumer surfaces)
- `overridden` (clinician documented override; signal remains in audit but no longer gates new actions)
- `superseded` (a new evaluation produced a different signal for the same medication pair; old signal is superseded)
- `resolved` (the underlying condition is no longer present — e.g., medication discontinued + 30-day washout period elapsed)
- `expired` (a time-bounded signal — e.g., post-procedure interaction window — has passed)

Transitions:
- `emitted → active` (automatic on evaluation completion if no override applied at decision time)
- `active → overridden` (clinician POST /signals/:id/overrides)
- `active → superseded` (new evaluation produces replacement signal)
- `active → resolved` (medication discontinuation event + washout elapsed)
- `active → expired` (time-based; engine background job)

Terminal states (no further transitions): `overridden`, `superseded`, `resolved`, `expired`.

**Promotion class:** content-change; State Machines v1.1 → v1.2 (new state machine).

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

### Sub-decision 8: Per-procedure SECURITY DEFINER (1 new procedure)

**Gap.** v1.0 §7 specifies clinician override as auditable but doesn't define the write path. Per Async Consult slice precedent (SI-005's `record_consult_clinician_decision`), override recording should go through a SECURITY DEFINER procedure with multi-step validation including the I-032 Tenant-GUC equality guard (Mode 1 + Mode 2 per the just-ratified canonical text).

**Proposed procedure:** `record_interaction_signal_override(...)` — SECURITY DEFINER. ~8-step validation including:
- STEP 0: I-032 Mode 1 NULL/blank-GUC RAISE + Mode 2 mismatch structured-rejection (per canonical I-032 v5.3)
- STEP 1: auth-FIRST per I-023 layer 2
- STEP 2: idempotency-key validation
- STEP 3: signal-exists-and-active state check
- STEP 4: medication-still-on-active-list state check
- STEP 5: clinician-role check (RBAC `medication_interaction.override_recorder` granted)
- STEP 6: atomic INSERT into `interaction_signal_override` + state-transition `active → overridden` on `interaction_signal`
- STEP 7: unique_violation safety net
- STEP 8: rejection emission

Rejection codes: `tenant_guc_mismatch` (I-032 Mode 2), `idempotency_replay_outcome_mismatch`, `signal_not_active`, `medication_not_on_list`, `unauthorized_role`, `unique_violation`. (6 codes; will likely expand during Codex pre-ratification.)

**Promotion class:** content-change; CDM bump in lockstep with Sub-decision 1's entity additions.

**Recommendation:** APPROVE.

---

## 3. Cross-artifact impact summary

If all 8 sub-decisions ratify, the lockstep PR-A2-class commit lands:

- **CDM:** +3 new entities (interaction_engine_evaluation, interaction_signal, interaction_signal_override) + 1 new SECURITY DEFINER procedure (record_interaction_signal_override).
- **AUDIT_EVENTS:** +5 net-new action IDs (1 evaluation_completed + 1 signal_emitted + 1 evaluation_failed + 1 knowledge_base_updated + 1 signal_enforcement_override; signal_override already exists in canonical).
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

---

## 6. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; awaiting Codex R1.

---

## 7. Sequence for ratification

1. Codex pre-ratification cycle on this SI (target 5 + 1 = 6 rounds).
2. SI converges → Decision Brief authored summarizing the 8 sub-decisions + 6 open questions for ratifier review.
3. Ratifier ceremony (Evans-led; chat-message ratification per cycle precedent).
4. Canonical content port lockstep commit lands CDM + AUDIT_EVENTS + DOMAIN_EVENTS + OpenAPI + State Machines + RBAC + Slice PRD v2.0 + Promotion Ledger entry + Registry bump in single commit.
5. Implementation work begins on telecheck-app code repo (post-ratification per "spec ratification leads implementation by ≥1 sprint" rule).

---

— Claude (Opus 4.7, 1M context), SI-019 v0.1 DRAFT authored 2026-05-19 under "lets keep working. we are behind time" + standing autonomous-work authorization per CLAUDE.md.
