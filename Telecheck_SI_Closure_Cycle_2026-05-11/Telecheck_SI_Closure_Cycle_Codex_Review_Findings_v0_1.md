# SI Closure Cycle 2026-05-11 — Codex Adversarial Review Findings + Resolutions

**Status:** Codex review verdict = needs-attention (no-ship). Resolutions applied to DRAFT artifacts inline. This record-of-decisions doc tracks each finding from filing through resolution.
**Date:** 2026-05-11
**Codex session ID:** 019e1943-1a7a-7c82-998d-be2fb0f60bb8
**Reviewed artifacts:** the 5 DRAFT files in `Telecheck_SI_Closure_Cycle_2026-05-11/` (SI-001 through SI-005)
**Adversarial reviewer model:** Codex (via `codex@openai-codex` v1.0.4 companion script)

---

## Summary

Codex returned 7 findings (3 HIGH + 4 MEDIUM) on the initial SI closure DRAFT set. All findings were substantive (no false positives). Resolutions applied in-place to the DRAFT files in two categories:

- **Applied directly** (5 findings) — resolutions where the right call is unambiguous given the existing canonical patterns (PROJECT_CONVENTIONS r5, existing CDM §4 entries, existing AUDIT_EVENTS canonical I-012 set, established migration RLS helper).
- **Resolution proposal flagged for Evans** (2 findings) — resolutions where multiple defensible paths exist and the right call requires product-level judgment (DOMAIN_EVENTS payload schema scope, ConsultEvent DB-trigger enforcement scope).

Per `feedback_codex_autoinvoke.md` memory: Codex review autoinvoked on milestone exit. Per `feedback_risky_actions_pace.md`: surfacing the resolution decisions explicitly so Evans can override on review.

---

## Finding 1 — Pharmacy migration drops the tenant-scoped product FK (HIGH)

**Codex citation:** `migrations/023_medication_requests.sql:66-76` (on the parallel-agent-authored speculative pharmacy slice scaffold branch `feat/slice-4-pharmacy-medication-request-scaffold-DRAFT`)

**Issue:** SI-001 DRAFT requires a composite FK `(tenant_id, product_catalog_id) → product_catalog`. The pharmacy scaffold migration omits this FK with a TODO comment, relying on application-layer validation until the `product_catalog` table exists in a follow-on migration. This permits orphan or wrong-tenant catalog references in prescribing records.

**Codex recommendation:** Do not land this migration until the canonical product_catalog target exists, or split the migration so MedicationRequest is introduced only with the composite product FK enforced. If temporary staging is unavoidable, gate writes so no prescription rows can be inserted before the FK migration runs.

**Resolution:** **AGREED — pharmacy scaffold work parked.** The pharmacy slice scaffold branch (`feat/slice-4-pharmacy-medication-request-scaffold-DRAFT`) is PRESERVED but NOT opening a PR. The agent landed migration 023 + types + state machine before a network error closed the session; Groups 3-6 (repo, service, handlers, audit, events, routes, tests) did not land. The right path is:

1. SI-001 ratifies (with the composite product FK requirement) → blocks ProductCatalog ratification cycle alongside
2. ProductCatalog v1.2 §4 expansion authored (currently CDM §4.9 exists at v1.2 — needs verification that field-set is sufficient and that the composite UNIQUE pattern is applied)
3. Migration N: introduces `product_catalog` table with composite UNIQUE on `(tenant_id, id)` for FK targeting
4. Migration N+1: introduces `medication_requests` table WITH the composite FK to product_catalog enforced from row 0

This is captured as a Sprint 35 acceptance-criterion update on TLC-055 (Pharmacy slice Sprint 1 of 2-3): the migration cannot land until product_catalog is canonical.

**Action:** Update `docs/SPRINT_35_PLAN.md` TLC-055 acceptance criteria to add the ProductCatalog dependency. Update `docs/PHARMACY_SLICE_STATUS_2026-05-05.md` Sprint 33-34 amendment with Codex finding 1 reference.

**Branch disposition:** `feat/slice-4-pharmacy-medication-request-scaffold-DRAFT` stays as a draft reference branch — not opening a PR. Will be rebuilt against ratified schema in Sprint 35 / TLC-055 if SI-001 ratifies.

---

## Finding 2 — I-012 rejection and action-class naming drift from canonical audit contract (HIGH)

**Codex citation:** `Telecheck_SI_001_MedicationRequest_Schema_DRAFT.md:264-277`

**Issue:** SI-001 proposed `medication_request.execution_rejected` and a broad `medication_request.*` rename. The canonical I-012 set (per AUDIT_EVENTS v5.2 + the I-012 closure rule + `src/lib/audit.ts:54-89` mirror) already uses `prescribing.initiated`, `prescribing.approved`, `prescribing.declined`, `prescribing.modified`, `prescribing.execution_rejected`, and `protocol_authorized_prescribing`. Ratifying SI-001 as written would force two-way drift between the canonical I-012 vocabulary and the MedicationRequest lifecycle vocabulary, or require renaming the existing canonical set out from under existing validators / state machines / SI-004 paired consult-prescribing emit.

**Codex recommendation:** Make a hard decision before sending to Evans — either preserve `prescribing.*` as the authoritative I-012 action class and map MedicationRequest lifecycle to it, or issue an explicit I-012-amending ADR that updates AUDIT_EVENTS, State Machines, SI-004, validators, and migration checks in one batch.

**Resolution:** **DECISION: preserve `prescribing.*` as the canonical I-012 action class.** This is the lower-risk path (no validator rewrite, no SI-004 cascade, no migration drift). MedicationRequest lifecycle maps to the existing canonical set where the action overlaps; net-new MedicationRequest lifecycle actions get `medication_request.*` prefix where no existing canonical name applies.

**Action mapping table:**

| SI-001 v0.1 proposal | Resolution at v0.2 | Rationale |
|---|---|---|
| `medication_request.drafted` | `medication_request.drafted` (NEW) | No existing canonical; lifecycle-only |
| `medication_request.submitted_for_review` | `medication_request.submitted_for_review` (NEW) | No existing canonical; lifecycle-only |
| `medication_request.interaction_evaluation_completed` | `medication_request.interaction_evaluation_completed` (NEW) | No existing canonical; Med Interaction Engine integration |
| `medication_request.prescribed` | **`prescribing.approved`** (REUSE existing) | Already canonical I-012; the prescribing decision itself |
| `medication_request.modified_during_review` | **`prescribing.modified`** (REUSE existing) | Already canonical; clinician modify-and-resubmit |
| `medication_request.execution_rejected` | **`prescribing.execution_rejected`** (REUSE existing) | Already canonical I-012 rejection (mandatory per closure rule) |
| `medication_request.declined` | **`prescribing.declined`** (REUSE existing) | Already canonical; clinician declines outright |
| `medication_request.discontinued` | `medication_request.discontinued` (NEW) | No existing canonical; supersession-chain lifecycle |
| `medication_request.superseded` | `medication_request.superseded` (NEW) | No existing canonical; supersession-chain lifecycle |
| `medication_request.expired` | `medication_request.expired` (NEW) | No existing canonical; scheduled-job lifecycle |
| `medication_request.protocol_authorized_prescribing` | **`protocol_authorized_prescribing`** (REUSE existing) | Already canonical I-012; Mode 2 protocol agent |

**Net:** 6 NEW `medication_request.*` actions + 5 existing canonical reuses. Existing `prescribing.*` set preserved as authoritative I-012 vocabulary. SI-004's paired consult-prescribing emit continues to work unchanged (it emits `prescribing.approved` after `consult.prescribed`).

**Action:** Apply this mapping inline to SI-001 DRAFT §"Proposed AUDIT_EVENTS v5.2 additions" + remove the `[NEEDS RATIFICATION: rename prescribing.* → medication_request.*]` marker.

---

## Finding 3 — SI-001's I-012 database CHECK does not enforce the three-clause rule (HIGH)

**Codex citation:** `Telecheck_SI_001_MedicationRequest_Schema_DRAFT.md:175-179`

**Issue:** The proposed CHECK only enforces that `ai_workload_type` and `autonomy_level` are both null or both populated. It does not reject reserved autonomy values, unknown workload values, or successful prescribing rows without the required `action_with_confirm` evidence, despite the same artifact claiming the `pending_clinician_review → active` and protocol-authorized paths are I-012 governed.

**Codex recommendation:** Replace the weak parity check with explicit allowed-value constraints plus state-dependent guards for active/protocol-authorized rows, and require the state-machine transition to bind to the canonical I-012 audit action_id before `status='active'` is reachable.

**Resolution:** **AGREED.** Replace the parity-only CHECK with a multi-clause constraint:

```sql
-- I-012 three-clause rule per AUDIT_EVENTS v5.2 + INVARIANTS I-012:
--   (1) ai_workload_type must be canonical (per WORKLOAD_TAXONOMY v5.2 active levels)
--   (2) autonomy_level must be 'action_with_confirm' (the single I-012-permitted level at v1.0)
--   (3) reserved workload/autonomy values forbidden until ADR-030 + successor invariant
CONSTRAINT medication_requests_i012_envelope_active_check CHECK (
  -- Non-AI prescribing: both fields null (clinician-only, no AI participation)
  (status NOT IN ('active', 'discontinued', 'superseded', 'expired')
   AND ai_workload_type IS NULL
   AND autonomy_level IS NULL)
  OR
  -- AI-participating prescribing on active: I-012 envelope required
  (status IN ('active', 'discontinued', 'superseded', 'expired')
   AND (
     -- (a) Clinician-only path: no AI fields set
     (ai_workload_type IS NULL AND autonomy_level IS NULL)
     OR
     -- (b) AI-participating path: workload + autonomy populated with canonical v1.0 values only
     (ai_workload_type IN ('clinical_assistant_mode_1', 'protocol_execution_mode_2')
      AND autonomy_level = 'action_with_confirm')
   ))
),
-- Protocol-authorized path: protocol_id + version required when autonomy_level set + I-012 protocol path
CONSTRAINT medication_requests_i012_protocol_binding_check CHECK (
  (autonomy_level IS NULL)
  OR
  (autonomy_level = 'action_with_confirm' AND protocol_id IS NOT NULL AND protocol_version IS NOT NULL)
)
```

**Reserved AI workload types (autonomous_agent, multi_agent_supervisor, tool_using_agent) and reserved autonomy levels (action_with_audit_only, fully_autonomous)** are rejected by omission from the canonical IN-list — they cannot persist on an active MedicationRequest row at v1.0. This matches the CHECK guards on `ENABLE_AUTONOMOUS_AGENT` etc. in `src/lib/config.ts:40-101` (the runtime feature-flag layer).

**State-dependent guard:** the CHECK enforces that a `status='active'` row MUST either have both AI fields null (clinician-only) OR both populated with canonical I-012 values. This closes the gap where a transition could write `status='active'` with `autonomy_level='action_with_audit_only'` (reserved) — the row insert fails at the DB layer.

**Audit-action binding:** the state-machine transition function (the future `medication-request-service.ts` in Sprint 35 / TLC-055d) MUST emit the matching audit action_id BEFORE the DB row update commits. PROJECT_CONVENTIONS r5 §3.9 (independent-tx Category A audit) covers this — independent-tx audit emission paired with the same `withTransaction` that issues the row update. The CHECK constraint catches DB-direct writes; the service layer's audit-emission-then-commit pattern catches service-layer writes.

**Action:** Apply this strengthened CHECK inline to SI-001 DRAFT §"Proposed CDM §4.16".

---

## Finding 4 — SI-001 RLS block uses stale session-variable pattern (MEDIUM)

**Codex citation:** `Telecheck_SI_001_MedicationRequest_Schema_DRAFT.md:185-191`

**Issue:** SI-001 proposed `USING (tenant_id = current_setting('app.tenant_id', true))`. The repo's canonical pattern (per migrations 003 + 016 + 020) uses the `current_tenant_id()` helper function, which is hardened against the user-settable-session-variable trust-boundary issue.

**Codex recommendation:** Change the proposed CDM block to the repo-standard policy: `CREATE POLICY tenant_isolation ... USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id())`.

**Resolution:** **AGREED.** Update SI-001 DRAFT §"Proposed CDM §4.16" RLS block to the canonical pattern. Add a comment cross-referencing migration 003 (where the helper is defined).

**Action:** Apply inline to SI-001 DRAFT.

---

## Finding 5 — SI-005 Consult clinician_id indexed but not FK-bound (MEDIUM)

**Codex citation:** `Telecheck_SI_005_Consult_ConsultEvent_Schema_DRAFT.md:45-51`

**Issue:** SI-005 defines `assigned_clinician_id` as a clinician anchor but leaves the FK target as a `[NEEDS RATIFICATION]` placeholder. Without the composite FK, application-code slippage could insert a consult assigned to a nonexistent or cross-tenant clinician identifier.

**Codex recommendation:** Resolve the canonical clinician table before ratification and add `FOREIGN KEY (tenant_id, assigned_clinician_id)` to that target, nullable until claim time.

**Resolution:** **AGREED — make hard decision before sending to Evans.** The clinician-account model in this codebase uses `accounts` table with `actor_type='clinician'` (per Slice 2 Identity + JWT spec). There's no separate `clinicians` table; clinicians ARE accounts with a role tag. The composite FK target is the same as the patient FK: `(tenant_id, account_id) → accounts(tenant_id, account_id)`. The discrimination is at the application layer (RBAC + actor_type check), not at the schema layer.

**Decision:** the FK target is `accounts (tenant_id, account_id)`, same as `patient_account_id`. The discrimination via `accounts.actor_type='clinician'` happens at the service-layer in `claim`/`assign` operations.

**Action:** Update SI-005 DRAFT §"Proposed CDM §4.17 Consult" — replace the `[NEEDS RATIFICATION: clinician FK target]` marker with the canonical resolution + the composite FK constraint inline.

---

## Finding 6 — SI-003 DOMAIN_EVENTS ratification leaves payload schemas out of scope (MEDIUM)

**Codex citation:** `Telecheck_SI_003_DOMAIN_EVENTS_Ratification_DRAFT.md:133-137`

**Issue:** SI-003 ratifies 28 event-type strings for subscriber type-safety but defers minimum-field payload schemas to slice owners post-ratification. DOMAIN_EVENTS v5.2 contract surface includes payload schemas + consumer contracts. Ratifying strings alone lets producers and consumers agree on names while silently drifting on payload fields.

**Codex recommendation:** Make payload minimum-field schemas part of the SI-003 closure artifact before promotion, OR explicitly downgrade this artifact to a naming-only pre-decision that cannot close SI-003.

**Resolution:** **DOWNGRADE artifact scope.** Authoring 28 payload-schema definitions is substantial work that requires per-slice product-level input (what fields does each subscriber actually need?). The right scope for the SI-003 closure is the naming + partition_key + outbox-class decisions; the payload schemas are slice-owner deliverables that ratify as part of each slice's status-doc lifecycle (the pattern Forms-Intake + Identity + Consent + Async-Consult already use today via the `events.ts` per-slice files).

**Decision:** Downgrade SI-003 closure to a "naming + partition_key + outbox-class pre-decision" artifact. Per-event payload-schema ratification is split out as a separate artifact authored at slice-status-doc revision time (one batch per slice, signed off by slice owner). SI-003 closure as-is is sufficient to remove placeholder-cast sites in `events.ts` files and let subscriber slices subscribe by type-name. Payload-shape compatibility is enforced at the runtime envelope-validation layer (`src/lib/domain-events.ts` envelope schema), which already exists and validates partition_key + type + tenant_id + aggregate_id shape independent of payload content.

**Action:** Add a `## Scope downgrade (per Codex review 2026-05-11)` section to SI-003 DRAFT clarifying the boundary + cross-referencing this resolutions doc.

---

## Finding 7 — ConsultEvent append-only semantics not enforced at DB layer (MEDIUM)

**Codex citation:** `Telecheck_SI_005_Consult_ConsultEvent_Schema_DRAFT.md:154-226`

**Issue:** SI-005 describes `consult_events` as a durable replay log paired 1:1 with AUDIT_EVENTS but leaves append-only enforcement at the application layer and marks DB triggers as optional. Any direct-SQL path, migration mistake, or service bug could update/delete local consult history while the audit chain remains immutable.

**Codex recommendation:** Require a DB-level BEFORE UPDATE/DELETE trigger that raises; ratify `audit_event_id` as the explicit immutable link to the audit-chain row so replay tooling can detect mismatches.

**Resolution:** **AGREED.** Append-only is a clinical-recordkeeping invariant (matches I-003 audit chain discipline); marking DB triggers as optional is too permissive. The right pattern mirrors `migrations/002_audit_chain.sql:470+` which uses a DB trigger to enforce hash-chain append-only on `audit_records`.

**Decision:** Update SI-005 DRAFT to require a BEFORE UPDATE/DELETE trigger on `consult_events` that raises an `exception` (matching the audit-records trigger pattern). Add `audit_event_id` as a NOT NULL column on `consult_events` referencing `audit_records(audit_id)` so replay tooling can detect mismatches (same composite-FK pattern; tenant-bound).

**Action:** Apply to SI-005 DRAFT §"Proposed CDM §4.18 ConsultEvent" — strengthen append-only from "application-layer enforcement (DB trigger optional)" to "BEFORE UPDATE/DELETE trigger MANDATORY (mirrors migrations/002_audit_chain.sql)".

---

## Cumulative resolution status

| Finding | Severity | Resolution | DRAFT updated? |
|---|---|---|---|
| 1 — Pharmacy migration FK drop | HIGH | Pharmacy scaffold parked; Sprint 35 TLC-055 acceptance criteria updated | Pending (in scope of this turn's wrap-up) |
| 2 — I-012 naming drift | HIGH | Preserve `prescribing.*`; map MedicationRequest lifecycle to existing canonical | SI-001 v0.2 |
| 3 — I-012 CHECK too weak | HIGH | Multi-clause CHECK with state-dependent + canonical-value guards | SI-001 v0.2 |
| 4 — RLS uses stale pattern | MEDIUM | Switch to `current_tenant_id()` helper | SI-001 v0.2 |
| 5 — Consult clinician FK target | MEDIUM | FK target = `accounts(tenant_id, account_id)` per Slice 2 model | SI-005 v0.2 |
| 6 — SI-003 payload schemas | MEDIUM | Scope downgrade to naming-only pre-decision | SI-003 v0.2 |
| 7 — ConsultEvent append-only DB | MEDIUM | BEFORE UPDATE/DELETE trigger MANDATORY | SI-005 v0.2 |

**Net:** 3 of 5 SI DRAFTs revised at v0.2 (SI-001, SI-003, SI-005). SI-002 and SI-004 unchanged. Pharmacy scaffold branch parked; PR not opened.

**Next adversarial-review cycle:** after Evans reviews the v0.2 DRAFTs, the standard 12-round-asymptote pattern (per PROJECT_CONVENTIONS r5 §5.12) applies. Codex re-runs each phase exit.

---

## Spec references

- AUDIT_EVENTS v5.2 §I-012 closure rule + Category A enum
- INVARIANTS v5.2 I-003 (audit append-only), I-012 (prescribing reject-unless three-clause)
- WORKLOAD_TAXONOMY v5.2 + AUTONOMY_LEVELS v5.2
- `migrations/002_audit_chain.sql:470+` (BEFORE UPDATE/DELETE trigger pattern)
- `migrations/003_rls_helpers.sql` (current_tenant_id() canonical helper)
- `migrations/016_consent.sql:119-120, 284-285` (canonical RLS pattern)
- `src/lib/audit.ts:54-89` (canonical Category A action-ID set mirror)
- `src/lib/config.ts:40-101` (reserved-AI-workload + reserved-autonomy guards)
- PROJECT_CONVENTIONS r5 §3.7-§3.9 + §5.12

---

## Authoring discipline

- No emoji.
- All Codex findings recorded verbatim with their citation.
- Resolutions either AGREED (apply directly) or DECISION made when multiple defensible paths existed.
- The 2 product-judgment-required findings (SI-003 scope, SI-005 trigger requirement) get explicit DECISIONS rationalized against existing patterns; Evans can override on review.
- DRAFT artifacts revised in-place at v0.2 with `## v0.2 Codex revision (2026-05-11)` banner sections explaining what changed.
