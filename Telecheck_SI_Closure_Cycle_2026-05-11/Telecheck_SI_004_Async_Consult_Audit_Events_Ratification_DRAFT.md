# SI-004 Closure Artifact — Async Consult audit events ratification

**Status:** **SUPERSEDED-FOR-RATIFICATION (action-ID taxonomy) by SI-020 Sub-decision 2 as of 2026-05-24** — preserved for traceability as the historical record of the Sprint-9 placeholder strings actually emitted in code (`src/modules/async-consult/audit.ts`). The v0.1 `consult.*` 20-event taxonomy below is NOT the canonical Async-Consult audit taxonomy for the upcoming ratification ceremony; the canonical taxonomy is SI-020 Sub-decision 2's `async_consult.*` 17-event table (P-037/P-038). See the **Reconciliation against SI-020** section immediately below. The remaining `[NEEDS RATIFICATION]` items in this artifact are re-homed onto the SI-020 ratification ceremony and are NOT independently ratifiable here.
**Date:** 2026-05-11 (original v0.1); reconciliation note appended 2026-05-24
**Author:** Autonomous Claude (SI closure cycle workstream); reconciliation by Autonomous Claude (remote-cron firing, no Codex)
**Closes:** SI-004 in `telecheck-app/docs/SI-004-Async-Consult-Audit-Events-Ratification.md` — closure now routed through SI-020 Sub-decision 2 ratification, NOT this artifact independently
**Target spec doc:** `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md` — landing carried by SI-020 P-038 follow-on amendment, NOT a standalone SI-004 amendment
**Severity:** medium → resolved-on-SI-020-ratification (was: resolved-on-ratification)
**Adjacent SI:** SI-002 (general placeholder-action-ID ratification — superset of SI-004 by slice; SI-004 is the async-consult-specific subset). SI-005 (Consult / ConsultEvent schema gap — paired sibling). **SI-020 (Async Consult v2.0 Implementation Readiness — the successor that subsumes and re-derives this artifact's audit taxonomy; authoritative for ratification).**

---

## Reconciliation against SI-020 Sub-decision 2 (appended 2026-05-24, remote-cron firing — Track-6 author-side readiness; no Codex)

**Why this section exists.** Cockpit Addendum 94 (2026-05-23) named, as the next no-Codex Track-6 lever, the requirement to *"verify [SI-004] reconciles with SI-020 Sub-decision 2's 17-event table before the ratification ceremony."* This firing executed that verification. Result: **the two artifacts propose genuinely divergent audit taxonomies and must NOT both be ratified.** This section records the divergence, names SI-020 as canonical, and provides the crosswalk so the P-037/P-038 ratification ceremony lands exactly one taxonomy.

**Divergence summary:**

| Axis | SI-004 (this artifact, v0.1, 2026-05-11) | SI-020 Sub-decision 2 (v0.12 R11, 2026-05-23) |
|---|---|---|
| Namespace | `consult.*` (dot-form) | `async_consult.*` (dot-form) |
| Event count | 20 | 17 (4 Cat A + 3 Cat B + 10 Cat C) |
| Design philosophy | one audit event **per state-machine transition** (transition-named; derived from State Machines v1.1 §3's 17-state model) | **decision-centric semantic** taxonomy aligned with the SI-020 v2.0 state machine + Mode 1 P-035 + SI-005 P-021 patterns; clinician-decision branches collapse into one `clinician_decision_recorded` keyed by `decision_type` |
| I-012 treatment | `consult.prescribed` Cat A; I-012 enforcement routed through paired `prescribing.initiated` + `prescribing.approved` | `async_consult.prescribing_recorded` Cat A directly, cross-referencing the `medication_request` canonical |
| Forensic events | none beyond transitions | adds `ai_preparation_failed` (Cat B), `clinician_decision_rationale_disagreement` (Cat A), `invariant_violation_decision_without_admission` (Cat A), `claim_expired_auto_released` (Cat B) |

**Canonical decision: SI-020 Sub-decision 2's `async_consult.*` 17-event taxonomy is canonical** for the Async-Consult audit-event ratification. Rationale: SI-020 is the newer (10-day-later), broader (whole-slice v2.0 implementation-readiness across 10 sub-decisions), and far more converged artifact (R11; 11 rounds of author-side closures), and it is the artifact explicitly heading to the P-037 SI ratification + P-038 follow-on AUDIT_EVENTS landing. SI-004's `consult.*` taxonomy predates SI-020's v2.0 state machine and is preserved here only as the historical record of the Sprint-9 placeholder strings that actually shipped in code.

**Crosswalk — SI-004 `consult.*` (20) → SI-020 `async_consult.*` (17):**

| SI-004 `consult.*` ID | SI-020 `async_consult.*` ID (#) | Disposition |
|---|---|---|
| `consult.initiated` | `async_consult.initiated` (1) | namespace rename |
| `consult.intake_submitted` | `async_consult.intake_submitted` (2) | namespace rename |
| `consult.abandoned` | `async_consult.intake_abandoned` (3) | rename |
| `consult.resumed` | — | **DROPPED** — SI-020's lifecycle has no resume-audit event |
| `consult.expired` | — | **GAP** — no SI-020 equivalent (see flag below); SI-020's only "expired" event is `claim_expired_auto_released` (17), a different concept (claim-lease expiry, not consult expiry) |
| `consult.processing_started` | `async_consult.ai_preparation_started` (4) | rename |
| `consult.queued_for_review` | `async_consult.case_queued` (7) | rename |
| `consult.case_claimed` | `async_consult.case_claimed` (8) | namespace rename |
| `consult.prescribed` (Cat A, I-012-paired) | `async_consult.prescribing_recorded` (11, Cat A) | rename + I-012 treatment differs (SI-020 direct Cat A vs SI-004 paired `prescribing.*`) |
| `consult.advised` | `async_consult.clinician_decision_recorded` (9, Cat A) | **FOLDED** into decision event keyed by `decision_type` |
| `consult.data_requested` | `async_consult.additional_data_requested` (12) | rename |
| `consult.data_received` | — | **DROPPED/FOLDED** — SI-020 treats data-received as a state re-entry, not a distinct audit event |
| `consult.awaiting_data_timeout` | — | **DROPPED** |
| `consult.escalated_to_sync` | `async_consult.escalated_to_sync` (13) | namespace rename |
| `consult.declined_by_clinician` | `async_consult.clinician_decision_recorded` (9, `decision_type=decline`) | **FOLDED** |
| `consult.referred` | `async_consult.clinician_decision_recorded` (9, `decision_type=refer`) | **FOLDED** |
| `consult.entered_follow_up` | — | **FOLDED** — SI-020 has `follow_up_message_sent` (15) for individual messages, no entry marker |
| `consult.completed` | `async_consult.outcome_notification_sent` (14) + domain event `async_consult.outcome_completed.v1` | partial map |
| `consult.labs_ordered` | `async_consult.clinician_decision_recorded` (9, `decision_type`) | **FOLDED** |
| `consult.sync_booked` | `async_consult.escalated_to_sync` (13) | **FOLDED** |

**SI-020 net-new (not present in SI-004), for completeness:** `ai_preparation_completed` (5), `ai_preparation_failed` (6, Cat B), `clinician_decision_recorded` (9, Cat A — the central decision event), `clinician_decision_rationale_disagreement` (10, Cat A), `outcome_notification_sent` (14), `follow_up_message_sent` (15), `invariant_violation_decision_without_admission` (16, Cat A), `claim_expired_auto_released` (17, Cat B).

**Engineering placeholder-removal target re-pointed.** SI-004 §"Cross-cutting downstream impact" said the `src/modules/async-consult/audit.ts` cast site migrates to the `consult.*` strings. **That target is now `async_consult.*` (SI-020), NOT `consult.*` (SI-004).** Of the 4 Sprint-9 placeholders actually emitted in code (`consult.initiated`, `consult.intake_submitted`, `consult.abandoned`, `consult.expired`): the first three map cleanly to `async_consult.initiated` / `intake_submitted` / `intake_abandoned`; the fourth (`consult.expired`) has no SI-020 equivalent (the gap flagged below).

**`[NEEDS RATIFICATION — re-homed onto SI-020 ceremony]` consult-level expiry gap.** SI-004's `consult.expired` (a consult that ages out without ever reaching review) has no equivalent in SI-020's 17-event table. The SI-020 ratifier (P-037/P-038) must decide one of: (a) add an 18th `async_consult.*` event for consult-level expiry; (b) fold consult-level expiry into `async_consult.intake_abandoned`; or (c) treat consult-expiry as a non-audited internal scheduler state. **This artifact deliberately does NOT author a new SI-020 event** — that would be net-new taxonomy beyond SI-020's ratified sub-decision scope (hard-floor item 6). It is surfaced here for the ratifier to resolve during the SI-020 ceremony.

**Discipline posture of this reconciliation:** this is a **SUPERSEDED-annotation discipline closure + within-scope crosswalk** — explicitly the hard-floor item 6 exemption ("SUPERSEDED-annotation discipline closures … remain closeable inline"). No net-new schema field, invariant, audit-event, or platform-floor primitive is authored; the one genuine gap (consult-expiry) is flagged for the ratifier, not filled. No canonical contract is edited; no version is bumped; no Promotion Ledger entry is appended. SI-004 and SI-020 both remain unratified DRAFTs. Committed directly to telecheckONE main per the established docs-not-Codex-gated DRAFT-closure pattern (Addendum 94 precedent).

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
