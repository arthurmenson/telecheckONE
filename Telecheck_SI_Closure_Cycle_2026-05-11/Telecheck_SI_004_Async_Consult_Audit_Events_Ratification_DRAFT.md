# SI-004 Closure Artifact — Async Consult audit events ratification

**Status:** DRAFT — awaiting Evans's ratification into spec corpus AUDIT_EVENTS v5.2 (or v5.3)
**Date:** 2026-05-11
**Author:** Autonomous Claude (SI closure cycle workstream)
**Closes:** SI-004 in `telecheck-app/docs/SI-004-Async-Consult-Audit-Events-Ratification.md`
**Target spec doc:** `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md` (current v5.2)
**Severity:** medium → resolved-on-ratification
**Adjacent SI:** SI-002 (general placeholder-action-ID ratification — superset of SI-004 by slice; SI-004 is the async-consult-specific subset). SI-005 (Consult / ConsultEvent schema gap — paired sibling).

---

## Summary

SI-004 was raised by engineering on 2026-05-05 at Sprint 9 PM kickoff when authoring of the Async Consult slice began against an AUDIT_EVENTS contract that named only four consult-family operational entries (`consult_booked`, `consult_started`, `consult_completed`, `consult_converted_to_sync` — all Category C, underscore-form). None of the 11 audit events enumerated by Async Consult Slice PRD v1.0 §13, and none of the 17 state-transition emit points implied by State Machines v1.1 §3, are present in the canonical AUDIT_EVENTS catalog at v5.2.

The slice shipped Sprint 9–10 (the four Sprint-9 placeholder events) and reached `v1.0` end-to-end at Sprint 33–34, but the placeholder action-ID strings (`consult.initiated`, `consult.intake_submitted`, `consult.abandoned`, `consult.expired` — dot-form per the v1.10 cycle precedent) remain unratified in the canonical contract. The hash chain (I-003), tenant scoping (I-027), and chain-walker verification are all intact; only the action-ID strings themselves lack canonical ratification.

This artifact proposes (a) canonical dot-namespaced action-ID strings for all 17 state-machine emit points plus the three lifecycle-context events; (b) Category A/B/C assignments per the safety-classification matrix in AUDIT_EVENTS v5.2 §"Safety classification matrix"; (c) I-012 closure-rule applicability cross-check for the `consult.prescribed` branch (Category A); (d) `audit_sensitivity_level` assignments (defaulting `standard` except where flagged); (e) a recommended Promotion Ledger path. The proposal is purely additive — no envelope-shape changes, no existing-ID modifications, no schema migration.

## Background

Per SI-004 §"What the canonical contract says", `grep consult.` against AUDIT_EVENTS v5.2 returns zero matches; the four operational entries in the v5.2 Category C catalog use underscore-form (`consult_booked`, `consult_started`, `consult_completed`, `consult_converted_to_sync`) and cover only the sync-video lifecycle subset — none of the async-specific transitions in State Machines v1.1 §3 are catalogued. The Sprint 8 retro option (c) decision (placeholder events emitted under the canonical I-003 hash chain with SI-004 as the resume gate) preserved the platform-floor audit invariants while allowing slice authoring to proceed without an upstream-spec block.

Naming convention adopted in this proposal: **dot-namespaced `consult.*`**, matching the v1.10 cycle precedent (`research.*`, `marketing.*`, `prescribing.*`, `refill.*`) and aligning with SI-002 dot-form rationale. The pre-existing v5.1 Category C IDs (`consult_booked`, `consult_started`, `consult_completed`, `consult_converted_to_sync`) are **preserved as-is** to avoid breaking pre-v1.10 backfill records — they are NOT renamed by this proposal. The new `consult.*` family lives alongside them; emitters distinguish by lifecycle context (operational booking/start/end vs. async state-machine transition).

## Proposed canonical action IDs

Per the State Machines v1.1 §3 transition table (17 transitions covering the 17 canonical states `INITIATED`, `INTAKE`, `ABANDONED`, `SUBMITTED`, `PROCESSING`, `QUEUED`, `UNDER_REVIEW`, `PRESCRIBED`, `ADVISED`, `AWAITING_DATA`, `ESCALATED_TO_SYNC`, `DECLINED`, `REFERRED`, `FOLLOW_UP`, `COMPLETED`, `EXPIRED`, `CLOSED`):

| Placeholder ID (Sprint 9-34) | Canonical ID | Category | I-012? | audit_sensitivity_level | Lifecycle hook |
|---|---|---|---|---|---|
| `consult.initiated` | `consult.initiated` | C | no | standard | `consult-service.ts` initiate handler at `INITIATED → INTAKE` |
| `consult.intake_submitted` | `consult.intake_submitted` | C | no | standard | submit handler at `INTAKE → SUBMITTED` |
| `consult.abandoned` | `consult.abandoned` | C | no | standard | abandon handler at `INTAKE → ABANDONED` (48h-no-activity) |
| `consult.resumed` | `consult.resumed` | C | no | standard | resume handler at `ABANDONED → INTAKE` |
| `consult.expired` | `consult.expired` | C | no | standard | scheduled job at `ABANDONED → EXPIRED` (14d-no-activity) |
| `consult.processing_started` | `consult.processing_started` | C | no | standard | `SUBMITTED → PROCESSING` (AI prep entry; emits AI-context envelope per ADR-029) |
| `consult.queued_for_review` | `consult.queued_for_review` | C | no | standard | `PROCESSING → QUEUED` (AI prep complete) |
| `consult.case_claimed` | `consult.case_claimed` | C | no | standard | clinician-claim handler at `QUEUED → UNDER_REVIEW` |
| `consult.prescribed` | **`consult.prescribed`** | **A** | **yes** | standard | `UNDER_REVIEW → PRESCRIBED` — emits paired `prescribing.initiated` + `prescribing.approved` (existing I-012 set members) for the medication_request that this transition creates |
| `consult.advised` | `consult.advised` | C | no | standard | `UNDER_REVIEW → ADVISED` |
| `consult.data_requested` | `consult.data_requested` | C | no | standard | `UNDER_REVIEW → AWAITING_DATA` |
| `consult.data_received` | `consult.data_received` | C | no | standard | patient-responds handler at `AWAITING_DATA → UNDER_REVIEW` |
| `consult.awaiting_data_timeout` | `consult.awaiting_data_timeout` | C | no | standard | scheduled job at `AWAITING_DATA → CLOSED` (14d) |
| `consult.escalated_to_sync` | `consult.escalated_to_sync` | C | no | standard | `UNDER_REVIEW → ESCALATED_TO_SYNC` |
| `consult.declined_by_clinician` | `consult.declined_by_clinician` | B | no | standard | `UNDER_REVIEW → DECLINED` (governance: refund-trigger context per slice PRD §11) |
| `consult.referred` | `consult.referred` | C | no | standard | `UNDER_REVIEW → REFERRED` |
| `consult.entered_follow_up` | `consult.entered_follow_up` | C | no | standard | `{PRESCRIBED, ADVISED} → FOLLOW_UP` (one emit per terminal-branch entry; payload includes `from_state`) |
| `consult.completed` | `consult.completed` | C | no | standard | `FOLLOW_UP → COMPLETED` and direct `{DECLINED, REFERRED, AWAITING_DATA-timeout-then-CLOSED} → COMPLETED` — distinct from existing `consult_completed` underscore-form (which is the sync-video operational marker preserved unchanged) |
| `consult.labs_ordered` | `consult.labs_ordered` | C | no | standard | `UNDER_REVIEW → ADVISED` order-labs branch (state machine §3 transition row "order_labs") — distinct from generic advised emit |
| `consult.sync_booked` | `consult.sync_booked` | C | no | standard | `ESCALATED_TO_SYNC → —` sync-consult-creation hook |

**Detail payload schema (per ID):** every `consult.*` event payload includes at minimum `consult_id`, `consult_type` (`program` | `general` per migration 020 CHECK), `modality` (`async` | `sync`), `from_state`, `to_state`. Branch-specific additions:

- `consult.processing_started` — `ai_workload_type` (per ADR-029 / WORKLOAD_TAXONOMY; populated from the AI service request that runs at PROCESSING), `ai_mode` legacy alias preserved
- `consult.prescribed` — `medication_request_id`, `protocol_id`+`version` (if Mode 2 path) or `clinician_id` (if Mode 1/clinician path), AND emits an inseparable companion `prescribing.initiated` Category A event in the same audit transaction per I-012 closure rule
- `consult.escalated_to_sync` — `escalation_reason`, `sync_consult_id_target` (the new sync consult entity created on transition)
- `consult.expired` / `consult.awaiting_data_timeout` — `timeout_window_days`, `refund_status` (per slice PRD §11)
- `consult.case_claimed` — `clinician_id`, `claim_method` (`manual` | `auto_assigned`)

## Audit sensitivity classification

Per AUDIT_EVENTS v5.2 §"Workload-taxonomy nullability + sensitivity rules", `audit_sensitivity_level = standard` is the default. The async-consult lifecycle events listed above do not export research data and do not surface high-PII free-text fields in their `detail` payload (intake form responses are referenced by `forms_submission_id`, not inlined). All async-consult events therefore carry `audit_sensitivity_level: standard`. `[NEEDS RATIFICATION: confirm `consult.prescribed` detail payload does not inline medication strings — current Sprint-9 emitter passes `medication_request_id` only, but if Sprint 10+ broadens this, sensitivity may need bump to high_pii.]`

## I-012 cross-check — Category A branches

The I-012 closure rule (AUDIT_EVENTS v5.2 §"I-012 closure rule") declares an authoritative action-class set governing the reject-unless three-clause rule. The async-consult `UNDER_REVIEW → PRESCRIBED` transition produces a medication_request and is therefore I-012-bound. **Resolution:** `consult.prescribed` itself is a Category A consult-lifecycle marker, but the canonical I-012 enforcement happens on the paired `prescribing.initiated` + `prescribing.approved` events that the same transition emits (already in the I-012 authoritative set). This artifact does NOT propose adding `consult.prescribed` to the I-012 set — adding it would require an I-012-amending ADR per the §I-012 closure rule's "any future medication_request / refill / medication-order action class explicitly added to this list by an I-012-amending ADR" clause.

**Recommendation:** keep `consult.prescribed` Category A for monitoring/clinical-safety access but route I-012 envelope-population enforcement through the paired `prescribing.*` events. State Machines v1.1 §3 transition row "prescribe" should be amended at SI-005 closure to require the paired-emit invariant in its `Actions` column. `[NEEDS RATIFICATION: confirm paired-emit pattern (one consult.prescribed + one prescribing.initiated + one prescribing.approved in the same audit transaction) is the desired contract — alternative is to collapse into a single I-012-bound `consult.prescribed`, but that requires the I-012-amending ADR.]`

## Cross-cutting downstream impact

On ratification, engineering removes the slice-local `asyncConsultAuditPlaceholder()` cast site at `src/modules/async-consult/audit.ts` and updates the central `AuditAction` union type in `src/modules/audit/types.ts` to the canonical strings above. Downstream slices that subscribe to consult lifecycle audit (Med Interaction Engine via `consult.prescribed`, Pharmacy via `consult.prescribed` once SI-001 closes the MedicationRequest schema gap, Adverse Events via the full lifecycle range) gain compile-time type-safety against the canonical strings rather than the placeholder cast.

The four pre-existing v5.1 Category C underscore-form entries (`consult_booked`, `consult_started`, `consult_completed`, `consult_converted_to_sync`) are NOT touched — they remain in the v5.2 catalog for the sync-video lifecycle. Pre-v1.10 backfill records are unaffected. The new `consult.*` family lives alongside.

## Promotion ledger entry proposal

This proposal is envelope-additive. Recommend folding into the **same Promotion Ledger entry as SI-002** (provisionally P-012 per the SI-002 draft) — both ratifications are placeholder-action-ID closures with identical shape (additive to the AUDIT_EVENTS v5.2 catalog, no envelope changes, no schema migration). Alternative: a separate **P-013** if Evans prefers per-slice traceability. `[NEEDS RATIFICATION: P-012 vs P-013 — recommend P-012 for cycle-time efficiency.]`

A `v5.3` minor bump of the AUDIT_EVENTS contract is the cleaner version path; in-place amendment of `v5.2` with a doc-control entry pointing at this artifact is acceptable if Evans prefers symmetry with the v1.10.1 hygiene cycle's amend-in-place precedent. `[NEEDS RATIFICATION: v5.3 minor bump vs v5.2 in-place amend.]`

## Spec references

- `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md` v5.2 (target — Category C catalog + I-012 closure rule + safety-classification matrix)
- `Telecheck_Contracts_Pack_v5_00_INVARIANTS.md` — I-003 (audit append-only), I-012 (reject-unless three-clause), I-027 (tenant_id on every audit record)
- `Telecheck_Async_Consult_Slice_PRD_v1_0.md` §13 (11 enumerated audit events) + §12 (state machine)
- `Telecheck_State_Machines_v1_1.md` §3 (Async Consult state machine — 17 states, 19 transitions)
- `Telecheck_ADR_Set_v1_0.md` Addendum ADR-029 (AI Workload Taxonomy — used by `consult.processing_started` AI-context fields)
- `Telecheck_ADR_Set_v1_0.md` ADR-012 (async ↔ sync conversion — referenced by `consult.escalated_to_sync` + `consult.sync_booked`)
- Paired closure artifact: `Telecheck_SI_005_Consult_ConsultEvent_Schema_DRAFT.md` (this SI cycle)
- Engineering placeholder site: `telecheck-app/src/modules/async-consult/audit.ts` (cast site to remove on ratification)
- Adjacent unresolved: SI-001 (MedicationRequest schema; gates `consult.prescribed` payload finalization), SI-003 (DOMAIN_EVENTS ratification — consult.*.* domain events have placeholder parallels)
