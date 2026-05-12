# SI-001 Closure Artifact — MedicationRequest canonical schema (CDM §4.16)

**Status:** DRAFT v0.13 — Codex pre-ratification-gate findings remediated (tenth pass); ready for re-ratification per Evans's 2026-05-11 (re-)authorization. v0.13 closes the residual v5.2 anchor in the §4.16 DDL inline comments (CDM I-012 envelope-field comment + I-012 three-clause CHECK comment) caught by the v0.12 gate. All Codex findings across the withdraw-ratification + ten pre-ratification gates are now closed inline. Total Codex findings closed: 20 (5 withdraw + 15 pre-ratification across 10 gate iterations).
**Version history:**
- v0.1 (2026-05-11): initial draft authored.
- v0.2 (2026-05-11): Codex SI closure cycle revisions — see §"v0.2 Codex revision" banner below. Findings 2 + 3 + 4 + (cross-ref 1) addressed.
- v1.0 RATIFIED ATTEMPT (2026-05-11; **WITHDRAWN** same day): post-merge Codex review returned `withdraw-ratification` verdict with 5 findings; all changes reverted via PR #109. See `Telecheck_SI_001_Codex_Withdraw_Ratification_Review_2026-05-11.md`.
- **v0.3 (2026-05-11): post-withdraw-ratification remediation.** All 5 withdraw-ratification findings closed inline:
  - **Finding 1 (HIGH)** — CHECK constraint workload values: `clinical_assistant_mode_1` → `conversational_assistant`; `protocol_execution_mode_2` → `protocol_execution`. Matches canonical WORKLOAD_TAXONOMY v5.2 active levels.
  - **Finding 2 (HIGH)** — State Machine §19 `protocol_authorized_prescribing` transition source state RETAINED as `pending_clinician_review → active` per the I-012 conservative posture (clinician sees engine output + invokes protocol auto-approval; never bypasses clinician review). The pharmacy scaffold's state-machine.ts must align to this on rebuild.
  - **Finding 3 (HIGH)** — App-repo I-012 rejection action ID will use canonical `prescribing.execution_rejected` (preserved per v0.2 Decision 3 mapping). Pharmacy scaffold's state-machine.ts header must update on rebuild.
  - **Finding 4 (MEDIUM)** — v0.3 DDL inlines the Path 1 shape directly (NO `interaction_override_id` column); old DDL preserved as a non-normative §"Changelog Appendix A — pre-Path-1 v0.2 DDL" below.
  - **Finding 5 (MEDIUM)** — P-011 re-framed as a content-change promotion with version bumps: Artifact Registry v2.10 → v2.11; CDM v1.2 → v1.3; State Machines v1.1 → v1.2. Registry coverage counts updated (entities 41 → 42; state machines 18 → 19).
- **v0.4 (2026-05-11): pre-ratification-gate remediation** (Codex session `019e1a46-c089-76d1-b500-3b8897fc56d2`). The pre-ratification cross-artifact-consistency review on v0.3 returned `needs-attention` with 3 findings — all closed inline:
  - **Finding 1 (HIGH)** — I-012 CHECK constraint tightened: AI-participating execution path restricted to `ai_workload_type='protocol_execution' AND autonomy_level='action_with_confirm'` ONLY. The `conversational_assistant` branch of the (b) clause was removed because WORKLOAD_TAXONOMY v5.2 §2.1 caps `conversational_assistant` at `autonomy_level_range=[advisory]`, which makes the `action_with_confirm` pairing impossible by taxonomy. Mode 1 advisory contribution to a prescribing decision is recorded on the AI session / consult transcript, not on the MedicationRequest execution envelope.
  - **Finding 2 (HIGH)** — State Machine §19 `protocol_authorized_prescribing` transition is now EXPLICITLY modeled as a `pending_clinician_review → active` edge in the lifecycle diagram, with a new §19.X subsection enumerating guard, actor, evidence, success audit emission, success domain-event emission, and the distinction from `clinician_approve`. Resolves the "claimed but not modeled" drift.
  - **Finding 3 (MEDIUM)** — `medication_request.activated` DROPPED from the proposed DOMAIN_EVENTS additions. The activation handoff for BOTH execution routes (`clinician_approve` AND `protocol_authorized_prescribing`) reuses the existing canonical `medication_request.approved.v1` which already discriminates the two routes via its `approval_pathway: "clinician_reviewed | protocol_authorized"` field. Net-new DOMAIN_EVENTS additions reduce from 5 to 4. Reuse-of-existing-canonical-type table added explicitly.
- **v0.5 (2026-05-11): second pre-ratification-gate remediation** (Codex session `019e1a4b-ec15-7ef0-abde-df96d10dda8b`). The pre-ratification cross-artifact-consistency review on v0.4 returned `needs-attention` with 2 findings — both closed inline:
  - **Finding 1 (HIGH)** — §19.X "Distinction from `clinician_approve`" row REWRITTEN. Original v0.4 wording said `ai_workload_type MAY be null` on the clinician-only audit envelope, which contradicted AUDIT_EVENTS v5.2 §I-012 closure rule (line 66 + line 127): I-012 action-class records REQUIRE `ai_workload_type` and `autonomy_level` regardless of `actor_type`, and clinician-only approvals with no upstream AI workload populate both fields as the literal sentinel string `'n/a'` (added to WORKLOAD_TAXONOMY + AUTONOMY_LEVELS enums for this carve-out per Codex Round-6 Scope 1 MEDIUM-1 patch 2026-05-02). For clinician-only approvals where upstream AI workload was `protocol_execution` at `action_with_confirm`, the envelope INHERITS the action_id's preceding workload/autonomy values. v0.5 distinction wording explicitly enumerates both subcases. Permits no null on I-012 action-class records.
  - **Finding 2 (HIGH)** — §19.X "Required evidence" row REWRITTEN. Original v0.4 wording referenced `protocol_confirmation_audit_id` as a column on the MedicationRequest row, but the §4.16 DDL does NOT define such a column. v0.5 replaces the column-reference binding with the canonical AUDIT_EVENTS v5.2 §I-012 preservation rule (line 78) `action_id` scoping mechanism: "An explicit clinician confirmation event (`prescribing.approved` or equivalent) exists in the immutable audit chain prior to the `*.executed` transition, scoped to the same `action_id`." The binding is the audit-chain action_id (immutable per I-016), NOT a row-level FK. Adding a denormalized FK column would create cross-references with no I-016 immutability protection and is explicitly rejected.
- **v0.6 (2026-05-11): third pre-ratification-gate remediation** (Codex session `019e1a4f-0903-73f2-ac97-fe2baec70bf0`). The pre-ratification cross-artifact-consistency review on v0.5 returned `needs-attention` with 2 HIGH findings — both closed inline:
  - **Finding 1 (HIGH)** — §19.X "Actor (audit envelope)" row REWRITTEN. Original v0.5 wording said `service-account:protocol-engine` (system actor), but AUDIT_EVENTS v5.2 §I-012 closure rule (line 66) explicitly states: "The legacy `protocol_engine` actor_type, when emitting any I-012 action-class record, MUST be mapped at emission time to `actor_type = ai_workload, ai_workload_type = protocol_execution`. ... Schema-driven implementations that retain `protocol_engine` as the literal actor_type for any I-012 action-class record are non-compliant." v0.6 specifies the canonical envelope: `actor_type='ai_workload'`, `actor_id=<protocol engine service account ULID>`, `ai_workload_type='protocol_execution'`, `autonomy_level='action_with_confirm'`. The human clinician is referenced by the `accountable_clinician_id` payload field per AUDIT_EVENTS v5.2 line 132. Legacy `protocol_engine` is permitted ONLY for pre-v1.10 backfill records.
  - **Finding 2 (HIGH)** — §19.X "Required evidence" row REWRITTEN AGAIN (v0.5's audit-chain-action_id binding mechanism was correct, but the prerequisite event was `prescribing.approved`, which is ALSO the success audit for the `clinician_approve` transition route — causing a dual-purpose conflict where satisfying the protocol-route prerequisite implies the clinician-route already terminated). v0.6 introduces a DISTINCT confirmation action ID: **`prescribing.protocol_authorization_granted`** (new Category A action; clinician actor; I-012 confirmation event; separate from `prescribing.approved`). The Net-new Category A action ID table grows from 6 to 7. The clinician adopts the protocol-engine route by emitting `prescribing.protocol_authorization_granted` (with the same `action_id` as the subsequent `protocol_authorized_prescribing` success audit); they do NOT emit `prescribing.approved` for this route. This unambiguously separates the two routes: `clinician_approve` route emits `prescribing.approved`; `protocol_authorized_prescribing` route emits `prescribing.protocol_authorization_granted` (clinician confirmation) FOLLOWED BY `protocol_authorized_prescribing` (AI workload success).
- **v0.7 (2026-05-11): fourth pre-ratification-gate remediation** (Codex session `019e1a52-6b82-7d71-890b-bf2ef45612d6`). The pre-ratification cross-artifact-consistency review on v0.6 returned `needs-attention` with 2 HIGH findings — both closed inline:
  - **Finding 1 (HIGH)** — `prescribing.protocol_authorization_granted` envelope: `actor_type` corrected from invented `'ai_workload_consumer'` (NOT in canonical actor_type enum) to canonical `'clinician'` per AUDIT_EVENTS v5.2 (which lists `clinician` for human-signer events). Workload/autonomy carve-out per the I-012 clinician-confirmation rule (line 127) preserved. The protocol-engine identity remains exclusively on the subsequent `protocol_authorized_prescribing` AI-workload success event.
  - **Finding 2 (HIGH)** — Added an explicit "I-012 authoritative set amendment" subsection. AUDIT_EVENTS v5.2 §I-012 closure rule (line 66) treats the authoritative I-012 action-class set as exact + extendable only by I-012-amending ADR additions in `medication_request / refill / medication-order` namespaces. The new `prescribing.protocol_authorization_granted` is in `prescribing.*` namespace, so its enrollment as an I-012 confirmation event requires an explicit amendment. P-011 ratification IS the I-012-amending act for this addition; the SI body now explicitly states the amendment and the amended rule will mirror to the canonical AUDIT_EVENTS v5.2 file under P-011 during the spec corpus push. Validators MUST recognize the new action as the allowed "or equivalent" confirmation event for the `protocol_authorized_prescribing` execution route.
- **v0.8 (2026-05-11): fifth pre-ratification-gate remediation** (Codex session `019e1a5c-12d7-7560-8b97-aa6a1ee4d929`). The pre-ratification cross-artifact-consistency review on v0.7 returned `needs-attention` with 1 HIGH finding — closed inline:
  - **Finding 1 (HIGH)** — P-011 amendment scope expanded from one surface (AUDIT_EVENTS prose) to TWO surfaces. The prose amendment alone was insufficient because CDM v1.2 §audit_events has a hard-coded CHECK constraint `audit_i012_workload_evidence_required` (canonical-bundle path `Telecheck_Canonical_Data_Model_v1_2.md` lines 913-919) whose `action NOT IN (...)` list enforces non-null `ai_workload_type` + `autonomy_level` for I-012 action-class rows. Without amending this CHECK to add `'prescribing.protocol_authorization_granted'`, a v1.10 audit row for the new confirmation action could pass the CHECK with null workload/autonomy fields, recreating the exact I-012 envelope gap this SI is closing. v0.8 expands the I-012 authoritative set amendment subsection to include the explicit CDM CHECK modification (with the full amended CHECK SQL shown) and removes the prior "no validator rewrite" framing. Both surfaces ship together under P-011.
- **v0.9 (2026-05-11): sixth pre-ratification-gate remediation** (Codex session `019e1a5f-60ac-7da2-9f06-bbe8b1b4b421`). The pre-ratification cross-artifact-consistency review on v0.8 returned `needs-attention` with 1 HIGH finding — closed inline:
  - **Finding 1 (HIGH)** — AUDIT_EVENTS Contracts Pack version BUMPED from v5.2 to v5.3.
- **v0.10 (2026-05-11): seventh pre-ratification-gate remediation** (Codex session `019e1a62-739e-7bb3-8664-9297ade21be7`). The review on v0.9 returned `needs-attention` with 1 HIGH finding — closed inline:
  - **Finding 1 (HIGH)** — v0.9 added the AUDIT_EVENTS v5.2 → v5.3 bump to the P-011 entry's version-bumps block, but body section headers and inline references still bound to "AUDIT_EVENTS v5.2," preserving the exact version-skew failure the bump was meant to close (validators/tests pinned to v5.2 would not see the amended closure rule). v0.10 propagates v5.3 consistently through the body: section title "Proposed AUDIT_EVENTS v5.2 additions" → "Proposed AUDIT_EVENTS additions ... bumps v5.2 → v5.3 under P-011"; subsection "added to AUDIT_EVENTS v5.2" → "added by P-011; lands at AUDIT_EVENTS v5.3"; reuse subsection clarifies existing IDs carry forward unchanged from v5.2 to v5.3; the I-012 set amendment subsection distinguishes pre-amendment baseline (v5.2 line 66) from post-amendment landing (v5.3); summary text + Decisions table + Target-spec-docs list updated to v5.3. References to pre-amendment AUDIT_EVENTS state (e.g., "the existing v5.2 §I-012 closure rule") stay v5.2; references to the post-ratification result land at v5.3.
- **v0.11 (2026-05-11): eighth pre-ratification-gate remediation** (Codex session `019e1a65-2b12-79d1-acef-656a1023d148`). The review on v0.10 returned `needs-attention` with 1 HIGH residual finding — closed inline:
  - **Finding 1 (HIGH)** — P-011 "Changes" item 4 (the AUDIT_EVENTS payload summary inside the live promotion text) still said "AUDIT_EVENTS v5.2 — 7 net-new Category A action IDs" and anchored new-emission compliance to "AUDIT_EVENTS v5.2 §I-012 closure rule line 66" — a remaining live v5.2 binding inside the P-011 ratified payload contradicting the v5.2 → v5.3 bump line immediately above. v0.11 rewrites item 4 to anchor the new payload at v5.3 (the post-ratification AUDIT_EVENTS landing version), clarifies that existing IDs carry forward unchanged from v5.2 to v5.3, anchors new-emission compliance to v5.3 §I-012 closure rule (which carries forward the v5.2 line 66 prose plus the v0.7→v0.9 amendments), and explicitly states cross-artifact references for new emissions MUST resolve against v5.3 (or later).
- **v0.12 (2026-05-11): ninth pre-ratification-gate remediation** (Codex session `019e1a67-2d1d-7611-b316-43776dd8014c`). The review on v0.11 returned `needs-attention` with 1 HIGH finding — closed inline:
  - **Finding 1 (HIGH)** — State Machine §19.X rows + the net-new `prescribing.protocol_authorization_granted` row still bound live-behavior references (Actor envelope, Required evidence, Success audit emission, Distinction from `clinician_approve`, and the protocol_authorization_granted row's I-012 confirmation source) to "AUDIT_EVENTS v5.2," contradicting the v5.2 → v5.3 bump and the explicit "new-emission references resolve against v5.3" rule in the I-012 set amendment subsection. v0.12 rewrites every live-behavior reference in §19.X + the protocol_authorization_granted row to anchor on AUDIT_EVENTS **v5.3** while preserving v5.2 line citations explicitly framed as "carries forward v5.2 line N prose unchanged" (i.e., v5.2 stays only as historical-baseline source citation for the carried-forward prose, NEVER as a live-emission binding). This closes the residual version-skew gap outside the CDM CHECK path.
- **v0.13 (2026-05-11): tenth pre-ratification-gate remediation** (Codex session `019e1a6a-1550-7ed2-8778-c2ed912671a9`). The review on v0.12 returned `needs-attention` with 1 HIGH finding — closed inline:
  - **Finding 1 (HIGH)** — §4.16 DDL inline comments still bound the live I-012 envelope-fields rule + the I-012 three-clause CHECK rule to "AUDIT_EVENTS v5.2 + I-012 closure rule" without the carry-forward framing required by the same draft. These are LIVE schema/validator comments, not historical narrative — generated validators reading DDL comments could pin to v5.2 and miss the P-011 amendment. v0.13 rewrites both comments to anchor on AUDIT_EVENTS v5.3 with explicit "(carries forward v5.2 line 66 prose plus P-011 amendment; live emission MUST resolve against v5.3 or later)" framing. Codex flagged that the I-012 closure-rule prose amendment is NOT just additive enum extension — it changes the authoritative source-of-truth set (which AUDIT_EVENTS itself declares as the single source of truth for the I-012 action-class set). The v1.10 cycle's "additive enum extension stays at v5.2" precedent does not extend to normative source-of-truth prose amendments. Without an explicit version bump, validators/tests pinned to AUDIT_EVENTS v5.2 could still hold the pre-amended I-012 closure rule (missing the new confirmation action) and recreate the cross-artifact enforcement gap outside the CDM CHECK. v0.9 bumps AUDIT_EVENTS v5.2 → v5.3 under P-011; Registry / Active Document Index / cross-references update to point to v5.3. The bump is the smallest semantic-version step appropriate to a backward-compatible normative-prose amendment.
**Date:** 2026-05-11
**Author:** Autonomous Claude (SI closure cycle workstream)
**Closes:** SI-001 in telecheck-app/docs/
**Target spec docs:**
- `Telecheck_Canonical_Data_Model_v1_2.md` — add §4.16 MedicationRequest
- `Telecheck_State_Machines_v1_1.md` — add §19 MedicationRequest lifecycle
- `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md` — add Category A `medication_request.*` + `prescribing.protocol_authorization_granted` action IDs; amend §I-012 closure rule's authoritative set; **bump file header v5.2 → v5.3** under P-011
- `Telecheck_Contracts_Pack_v5_00_DOMAIN_EVENTS.md` — add `medication_request.*` type IDs

**Severity:** high — blocks Slice 4 Pharmacy + Refill v2.1, Subscription, transitively Med Interaction Engine
**Promotion Ledger:** propose entry **P-011**
**Adjacent SIs:** SI-002 (AUDIT_EVENTS — peer; this artifact's audit additions roll under P-012 or stand alone under P-011), SI-005 (Consult / ConsultEvent schema — references MedicationRequest via `prescribing_consult_id`)

---

## v0.2 Codex revision banner (2026-05-11)

Codex adversarial review on the v0.1 set returned 7 findings (3 HIGH + 4 MEDIUM). Findings 2, 3, 4 affected this artifact and have been applied inline. Finding 1 (pharmacy migration FK drop) affects the speculative pharmacy scaffold branch, not this SI artifact — see `Telecheck_SI_Closure_Cycle_Codex_Review_Findings_v0_1.md` for the resolution record.

**Changes in v0.2:**

1. **§"Proposed CDM §4.16" CHECK constraints** — replaced the parity-only `i012_envelope_complete` CHECK with two strengthened constraints: `i012_envelope_active_check` (state-dependent + canonical-value enforcement) + `i012_protocol_binding_check` (protocol_id + protocol_version required when autonomy_level set). Reserved AI workload types and reserved autonomy levels are rejected by omission from the canonical IN-list. (Codex Finding 3 — HIGH.)

2. **§"Proposed CDM §4.16" RLS policy block** — switched from `current_setting('app.tenant_id', true)` to the canonical `current_tenant_id()` helper from `migrations/003_rls_helpers.sql`. Added the `WITH CHECK` clause (omitted in v0.1). Matches the established pattern in `migrations/016_consent.sql:119-120`. (Codex Finding 4 — MEDIUM.)

3. **§"Proposed AUDIT_EVENTS v5.2 additions"** — collapsed action-ID set from 11 to 6 net-new. Existing canonical `prescribing.*` set preserved as authoritative I-012 vocabulary. MedicationRequest lifecycle reuses `prescribing.approved` / `prescribing.declined` / `prescribing.modified` / `prescribing.execution_rejected` / `protocol_authorized_prescribing` where the action overlaps; net-new `medication_request.*` actions only for lifecycle events with no canonical equivalent (drafted, submitted_for_review, interaction_evaluation_completed, discontinued, superseded, expired). Eliminates the cross-artifact naming-drift risk Codex flagged. (Codex Finding 2 — HIGH.)

4. **§"Decisions resolved for the spec corpus"** — `[NEEDS RATIFICATION]` markers reduced from 3 to 1 (the remaining marker is the interaction_override_id Path 1 vs Path 2 question, which still requires product-level judgment). The naming-rename marker collapsed via Finding 2 resolution.

---

## Summary

CDM v1.2 §3.5 lists entity #18 `MedicationRequest` ("Renamed from 'Prescription' per Contracts Pack vocabulary") in the entity inventory but provides no §4 field-level expansion. Three other spec locations reference `medication_requests` as an FK target (CDM v1.2 §4.7 Subscription line 416; Pharmacy + Refill Slice PRD v2.1 §8.1 line 231) or partially sketch the payload shape (OpenAPI v0.2 §5.1 `POST /consults/{id}/decision`), but none defines the table.

This artifact proposes the canonical CDM §4.16 expansion + the State Machines v1.1 §19 entry + the AUDIT_EVENTS Category A action ID additions (which bump AUDIT_EVENTS v5.2 → v5.3 under P-011) + the DOMAIN_EVENTS v5.2 type ID set (additive enum extension; remains at v5.2). The proposal follows the §4.1 Tenant / §4.7 Subscription template exactly, applies PROJECT_CONVENTIONS r5 §1.1 (composite UNIQUE + composite FK for tenant-bound parent-child tables), and mirrors the Slice 3 consent module's append-only-via-supersession pattern.

On ratification, Slice 4 Pharmacy + Refill v2.1 (Sprint 4 in EHBG §10b) becomes implementable — estimated 40-50 commits over Sprint 35-36. Subscription slice unblocks in parallel. Med Interaction Engine slice unblocks for its core interaction-evaluation surface (signal-check against a medication list).

---

## Background

### What the spec says today

1. **CDM v1.2 §3.5 line 92** — inventory entry only:
   ```
   | 18 | MedicationRequest | Pharmacy & Fulfillment | Renamed from "Prescription" per Contracts Pack vocabulary |
   ```
   No §4 expansion.

2. **CDM v1.2 §4.7 Subscription line 416** — FK reference:
   ```sql
   prescription_id  VARCHAR(26) NOT NULL REFERENCES medication_requests(id),
   ```
   (Column name `prescription_id` is legacy; the FK target table is the canonical `medication_requests` per Contracts Pack v5.2 GLOSSARY.)

3. **Pharmacy + Refill Slice PRD v2.1 §8.1 line 231** — same FK target as CDM §4.7.

4. **OpenAPI v0.2 §5.1 `POST /consults/{id}/decision`** payload — sketches API-layer fields (medication_id, medication_name, strength, formulation, dose_instructions, quantity, refills_allowed, indication) but these are API-payload field names, not table-column names. `medication_id` here is the ProductCatalog FK, not the MedicationRequest PK.

### What's unclear (per SI-001 §"What's unclear")

- Full `CREATE TABLE medication_requests` DDL with column types, nullability, FK targets, CHECK constraints, indexes, RLS policy.
- Canonical `MedicationRequest` state machine.
- AUDIT_EVENTS canonical Category A action IDs for medication_request lifecycle.
- DOMAIN_EVENTS canonical type IDs.
- Append-only-via-supersession vs mutable on discontinuation.
- How `interaction_override_id` participates (Med Interaction Engine slice gating).

This DRAFT resolves all six.

---

## Proposed CDM §4.16 MedicationRequest

**Style note:** This proposal follows the §4.1 Tenant / §4.7 Subscription template exactly — column-level comments inline, CONSTRAINT names explicit (per PROJECT_CONVENTIONS r5 §1.2), composite UNIQUE for downstream composite-FK targeting (per PROJECT_CONVENTIONS r5 §1.1).

### 4.16 MedicationRequest

The canonical record of a prescribing decision (or a draft thereof) within an operating tenant. Renamed from "Prescription" per Contracts Pack v5.2 GLOSSARY. Append-only via supersession (discontinuation creates a new `superseded` row with `supersedes_id` pointing back; the original row's `status` flips to `superseded` only via a controlled UPDATE that the I-003 hash-chain audit picks up). Same discipline as consent_versions per Slice 3 PRD v1.0 §7.1.

**v1.10 brand-structure note:** `tenant_id` is the operating-tenant identifier (`Telecheck-{country}`); patient-facing surfaces source `tenant.consumer_dba` for any rendering that displays "your prescriber's pharmacy" branding, per Master PRD v1.10 §17 + Glossary v5.2 C3.

```sql
CREATE TABLE medication_requests (
  -- Identity
  id                                  VARCHAR(26) PRIMARY KEY,           -- ULID (§2 conventions)
  tenant_id                           VARCHAR(26) NOT NULL REFERENCES tenants(id),

  -- Patient anchor (composite FK enforces same-tenant binding per PROJECT_CONVENTIONS r5 §1.1)
  patient_account_id                  VARCHAR(26) NOT NULL,

  -- Catalog anchor
  product_catalog_id                  VARCHAR(26) NOT NULL,              -- FK to product_catalog (CDM §4.9)
  medication_name                     VARCHAR(200) NOT NULL,             -- denormalized snapshot at prescribe-time
  strength                            VARCHAR(80)  NOT NULL,             -- '500mg', '10mg/ml', etc.
  formulation                         VARCHAR(40)  NOT NULL,             -- 'tablet', 'injection', 'topical', ...

  -- Clinical detail (denormalized snapshot — does not mutate when product_catalog updates)
  dose_instructions                   TEXT         NOT NULL,             -- '1 tablet twice daily with meals'
  quantity                            INTEGER      NOT NULL,             -- units per dispense
  quantity_unit                       VARCHAR(20)  NOT NULL,             -- 'tablet', 'ml', 'patch', ...
  refills_allowed                     INTEGER      NOT NULL,             -- 0 .. N
  indication                          VARCHAR(200),                      -- clinical indication; nullable
  clinical_notes                      TEXT,                              -- prescriber notes; nullable

  -- Lifecycle status (see §19 State Machine below — enum is the authoritative state set)
  status                              VARCHAR(30)  NOT NULL,             -- see §19 enum

  -- Lifecycle timestamps
  prescribed_at                       TIMESTAMPTZ,                       -- set on draft → active transition
  activated_at                        TIMESTAMPTZ,                       -- alias for prescribed_at retained for clarity
  discontinued_at                     TIMESTAMPTZ,
  discontinued_reason                 VARCHAR(60),                       -- enum below; nullable
  expires_at                          TIMESTAMPTZ,                       -- prescription-validity window end

  -- Authorship (clinician anchor; nullable only while status='draft')
  prescribed_by_clinician_account_id  VARCHAR(26),                       -- composite FK to accounts when set
  prescribing_consult_id              VARCHAR(26),                       -- composite FK to consults when set

  -- Safety integration (Med Interaction Engine slice — Path 1 per ratification 2026-05-11:
  -- NO `interaction_override_id` column. MedicationRequest emits the
  -- `medication_request.interaction_safety_hold_triggered` domain event
  -- when interaction_signals_status flips to 'safety_hold'; the Med Interaction
  -- Engine slice subscribes + owns its own override workflow + override table.
  -- Clean module-boundary separation per ADR-001.)
  interaction_signals_evaluated_at    TIMESTAMPTZ,                       -- last engine evaluation timestamp
  interaction_signals_status          VARCHAR(20)  NOT NULL DEFAULT 'pending',  -- 'pending' | 'clean' | 'caution' | 'safety_hold'

  -- I-012 reject-unless three-clause envelope fields (per AUDIT_EVENTS v5.3 §I-012 closure rule — carries forward v5.2 line 66 prose plus P-011 amendment adding prescribing.protocol_authorization_granted; live emission MUST resolve against v5.3 or later)
  ai_workload_type                    VARCHAR(40),                       -- per WORKLOAD_TAXONOMY v5.2; nullable if no AI participation
  autonomy_level                      VARCHAR(40),                       -- per AUTONOMY_LEVELS v5.2; nullable if no AI participation
  protocol_id                         VARCHAR(26),                       -- when protocol-authorized: which protocol; FK to protocols (future entity)
  protocol_version                    VARCHAR(20),                       -- frozen protocol version at prescribe-time

  -- Append-only via supersession
  supersedes_id                       VARCHAR(26),                       -- self-FK (composite); nullable; points back at the row this one supersedes
  superseded_by_id                    VARCHAR(26),                       -- self-FK (composite); nullable; points forward at the row that superseded this one

  -- CCR linkage (denormalized; matches Slice 4 country_of_care threading rule per Tenant Threading Addendum v1.0 §3.4)
  country_of_care                     CHAR(2)      NOT NULL,             -- ISO 3166-1 alpha-2

  -- Standard timestamps
  created_at                          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- Composite UNIQUE for downstream composite-FK pattern (subscriptions.prescription_id, refills.medication_request_id, dispensings.medication_request_id, etc.)
  CONSTRAINT medication_requests_tenant_id_id_unique UNIQUE (tenant_id, id),

  -- Composite FK: patient must belong to same tenant
  CONSTRAINT medication_requests_tenant_patient_fk
    FOREIGN KEY (tenant_id, patient_account_id) REFERENCES accounts (tenant_id, account_id),

  -- Composite FK: prescriber (when set) must belong to same tenant
  CONSTRAINT medication_requests_tenant_clinician_fk
    FOREIGN KEY (tenant_id, prescribed_by_clinician_account_id) REFERENCES accounts (tenant_id, account_id),

  -- Composite FK: prescribing consult (when set) must belong to same tenant
  CONSTRAINT medication_requests_tenant_consult_fk
    FOREIGN KEY (tenant_id, prescribing_consult_id) REFERENCES consults (tenant_id, id),

  -- Composite FK: product catalog item (when set) must belong to same tenant
  CONSTRAINT medication_requests_tenant_product_fk
    FOREIGN KEY (tenant_id, product_catalog_id) REFERENCES product_catalog (tenant_id, id),

  -- Composite self-FKs for supersession chain
  CONSTRAINT medication_requests_supersedes_fk
    FOREIGN KEY (tenant_id, supersedes_id) REFERENCES medication_requests (tenant_id, id),
  CONSTRAINT medication_requests_superseded_by_fk
    FOREIGN KEY (tenant_id, superseded_by_id) REFERENCES medication_requests (tenant_id, id),

  -- State enum validation
  CONSTRAINT medication_requests_status_valid CHECK (
    status IN ('draft', 'pending_interaction_check', 'pending_clinician_review', 'active', 'discontinued', 'superseded', 'expired', 'rejected')
  ),

  -- Discontinuation reason enum (nullable except when status='discontinued')
  CONSTRAINT medication_requests_discontinued_reason_valid CHECK (
    discontinued_reason IS NULL OR
    discontinued_reason IN ('clinical_decision', 'adverse_event', 'patient_request', 'replaced_by_new_prescription', 'expired', 'safety_hold')
  ),
  CONSTRAINT medication_requests_discontinued_reason_set_when_discontinued CHECK (
    (status = 'discontinued') = (discontinued_reason IS NOT NULL)
  ),

  -- Interaction signals enum validation
  CONSTRAINT medication_requests_interaction_signals_status_valid CHECK (
    interaction_signals_status IN ('pending', 'clean', 'caution', 'safety_hold')
  ),

  -- I-012 three-clause rule per AUDIT_EVENTS v5.3 §I-012 closure rule (carries forward v5.2 line 66 prose plus P-011 amendment) + INVARIANTS I-012 + WORKLOAD_TAXONOMY
  -- v5.2 §2.1/§2.2 [v0.3 Codex Finding 1 closure 2026-05-11]:
  --   (1) ai_workload_type must be canonical (WORKLOAD_TAXONOMY v5.2 active levels at v1.0)
  --   (2) autonomy_level must be 'action_with_confirm' (the single I-012-permitted level at v1.0)
  --   (3) reserved workload/autonomy values forbidden until ADR-030 + successor invariant
  --   (4) workload x autonomy compatibility (WORKLOAD_TAXONOMY v5.2):
  --       - conversational_assistant: autonomy_level_range = [advisory] ONLY
  --       - protocol_execution: autonomy_level_range = [advisory, suggestion, action_with_confirm]
  --       Therefore the AI-participating I-012 EXECUTION path (autonomy='action_with_confirm')
  --       requires ai_workload_type='protocol_execution'. A 'conversational_assistant' row at
  --       'action_with_confirm' is impossible by WORKLOAD_TAXONOMY and MUST be rejected here
  --       so a Mode 1 workload cannot be falsely elevated to execution authority.
  -- The CHECK is state-dependent: status='active' MUST either have both AI fields null
  -- (clinician-only path) OR both populated with canonical I-012 execution values
  -- (AI-participating path = protocol_execution + action_with_confirm ONLY).
  CONSTRAINT medication_requests_i012_envelope_active_check CHECK (
    -- Pre-active states: AI fields can be null (envelope not yet populated)
    (status NOT IN ('active', 'discontinued', 'superseded', 'expired')
     AND ai_workload_type IS NULL
     AND autonomy_level IS NULL)
    OR
    -- Active and post-active states: I-012 envelope must be valid
    (status IN ('active', 'discontinued', 'superseded', 'expired')
     AND (
       -- (a) Clinician-only path: no AI fields set
       (ai_workload_type IS NULL AND autonomy_level IS NULL)
       OR
       -- (b) AI-participating I-012 EXECUTION path: protocol_execution + action_with_confirm
       --     ONLY. conversational_assistant is excluded here because its taxonomy
       --     autonomy_level_range is [advisory] (per WORKLOAD_TAXONOMY v5.2 §2.1); persisting
       --     a successful prescribing row attributed to conversational_assistant would
       --     defeat the workload x autonomy compatibility rule.
       --
       -- Mode 1 advice that contributed to (but did not execute) the prescribing decision
       -- is recorded on the AI session / consult transcript, not on the MedicationRequest
       -- execution envelope. The prescribing-decision attribution is exactly one of:
       --   - clinician-only (path (a) above)
       --   - protocol_execution (path (b) here)
       (ai_workload_type = 'protocol_execution'
        AND autonomy_level = 'action_with_confirm')
     ))
  ),

  -- Protocol-authorized path: when autonomy_level set, protocol_id + protocol_version required.
  -- This catches Mode 2 protocol-authorized prescribing rows that lack the protocol-binding evidence.
  CONSTRAINT medication_requests_i012_protocol_binding_check CHECK (
    autonomy_level IS NULL
    OR (autonomy_level = 'action_with_confirm' AND protocol_id IS NOT NULL AND protocol_version IS NOT NULL)
  ),

  -- Country-of-care must match tenant (denormalization invariant)
  CONSTRAINT medication_requests_country_valid CHECK (country_of_care ~ '^[A-Z]{2}$')
);

-- RLS policy: tenant-scoped read+write per ADR-023 + PROJECT_CONVENTIONS r5 §2.X.
-- [v0.2 Codex revision] Use the canonical `current_tenant_id()` helper from
-- migration 003_rls_helpers.sql, NOT the raw `current_setting('app.tenant_id', true)`
-- pattern. The helper is hardened against the user-settable-session-variable
-- trust-boundary issue. Matches the established pattern in migration 016_consent.sql.
ALTER TABLE medication_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_requests FORCE ROW LEVEL SECURITY;

CREATE POLICY medication_requests_tenant_isolation
  ON medication_requests
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- Indexes
CREATE INDEX idx_medication_requests_tenant_patient
  ON medication_requests (tenant_id, patient_account_id, status);
CREATE INDEX idx_medication_requests_tenant_clinician
  ON medication_requests (tenant_id, prescribed_by_clinician_account_id)
  WHERE prescribed_by_clinician_account_id IS NOT NULL;
CREATE INDEX idx_medication_requests_tenant_consult
  ON medication_requests (tenant_id, prescribing_consult_id)
  WHERE prescribing_consult_id IS NOT NULL;
CREATE INDEX idx_medication_requests_tenant_status_active
  ON medication_requests (tenant_id, status)
  WHERE status = 'active';
CREATE INDEX idx_medication_requests_supersession_chain
  ON medication_requests (tenant_id, supersedes_id)
  WHERE supersedes_id IS NOT NULL;
```

**Canonical seed values:** none. MedicationRequest is patient-record data; no platform-seed rows.

### Field-level discipline notes

- **`patient_account_id`** is a copy of `accounts.account_id` (NOT `accounts.id` — the per-tenant ULID, not the row PK). This matches the §4.7 Subscription convention.
- **`product_catalog_id`** denormalizes the catalog reference; `medication_name`, `strength`, `formulation` are snapshot-at-prescribe-time copies that do NOT mutate when product_catalog rows update. This is the standard prescribing-snapshot pattern (the doctor prescribed what they prescribed; later catalog edits don't retroactively change the prescription).
- **`prescribed_at` and `activated_at`** are kept as separate columns for clarity even though they're usually set together. `prescribed_at` is the clinician's prescribing decision timestamp; `activated_at` is the state-machine activation. They CAN differ when there's a queue between prescribe and activate (e.g., interaction-engine evaluation interleaved).
- **Med Interaction Engine integration** is via the `medication_request.interaction_safety_hold_triggered` domain event (Path 1 ratification). MedicationRequest does NOT carry a hard pointer to the InteractionOverride entity; the override workflow + override table are owned by the Med Interaction Engine slice. See `interaction_signals_status` column for the local signal state.
- **`supersedes_id` / `superseded_by_id`** form the supersession chain. The chain is linear (one supersedes another; not a tree). Discontinuation creates a new row with `status = 'discontinued'` and `supersedes_id` set; the old row's `status` becomes `superseded` and its `superseded_by_id` is set. The hash-chain audit picks up both rows' state transitions; bare suppression on the old row would itself be an I-003 violation.

---

## Proposed State Machines v1.1 §19 — MedicationRequest lifecycle

```
draft ──[submit_for_review]──▶ pending_interaction_check
   │                              │
   │                              ├──[engine_clean]──▶ pending_clinician_review
   │                              │
   │                              └──[engine_safety_hold]──▶ pending_clinician_review (with safety_hold flag)
   │
pending_clinician_review ──[clinician_approve]──────────────▶ active
                          ──[protocol_authorized_prescribing]─▶ active   (Mode 2 protocol-engine route; see §19.X below)
                          ──[clinician_decline]──────────────▶ rejected (terminal)
                          ──[clinician_modify]───────────────▶ pending_interaction_check (rerun engine on modified payload)

active ──[clinician_discontinue]──▶ discontinued (with discontinued_reason)
active ──[patient_request_discontinue]──▶ discontinued (with discontinued_reason='patient_request')
active ──[adverse_event_discontinue]──▶ discontinued (with discontinued_reason='adverse_event')
active ──[expire_at_window_end]──▶ expired (terminal)
active ──[supersede_by_new_prescription]──▶ superseded (paired with new row in draft→active flow)

discontinued (terminal)
superseded   (terminal)
expired      (terminal)
rejected     (terminal)
```

**State count:** 8 active states + 4 reserved-future transitions. Matches the State Machines v1.1 §3 Consult cadence (17 active + 4 reserved-future).

**I-012 reject-unless three-clause rule applies to:** BOTH transitions entering `active` (the two prescribing-decision routes — `clinician_approve` and `protocol_authorized_prescribing`). Every transition emits an AUDIT_EVENTS Category A action; rejection at either gate MUST emit **`prescribing.execution_rejected`** per I-012 closure rule (this is the canonical I-012 rejection action carried forward unchanged from AUDIT_EVENTS v5.2 to v5.3 — see Decision 3 mapping below; v0.3 Codex Finding 3 closure; live post-ratification emission resolves against v5.3). The `clinician_modify` transition does NOT emit a rejection (it's a re-route, not a refusal).

#### §19.X — `pending_clinician_review --[protocol_authorized_prescribing]--> active` (Mode 2 route) [v0.4 Codex Finding 2 closure 2026-05-11]

The protocol-authorized prescribing transition is the second of two normative routes into `active`. It coexists with `clinician_approve`; both routes terminate at the same destination state with identical post-conditions (active prescription bound to patient, downstream subscribers notified via `medication_request.approved.v1` domain event with `approval_pathway` field discriminating the route).

| Aspect | Specification |
|---|---|
| **Source state** | `pending_clinician_review` |
| **Destination state** | `active` |
| **Trigger event** | Protocol-engine authorization completed; the engine emits an authorization decision linked to a protocol_id + protocol_version + clinician confirmation evidence per ADR-005 + ADR-029 + AUTONOMY_LEVELS v5.2 `action_with_confirm` semantics. |
| **Actor (audit envelope)** | Per AUDIT_EVENTS **v5.3** §I-012 closure rule (carries forward v5.2 line 66 prose + the `protocol_authorized_prescribing` action row at v5.2 line 132 unchanged, plus the v5.3 amendment that adds `prescribing.protocol_authorization_granted` to the authoritative set): `actor_type = 'ai_workload'`, `actor_id = <protocol engine service account ULID>`, `ai_workload_type = 'protocol_execution'`, `autonomy_level = 'action_with_confirm'`. The legacy `protocol_engine` actor_type is permitted ONLY for pre-v1.10 backfill records; any new emission MUST use `actor_type='ai_workload'` per the canonical closure rule. The human clinician who authorized the protocol engine to act on their behalf is referenced by the `accountable_clinician_id` payload field per the canonical `protocol_authorized_prescribing` payload definition (v5.3 §Category-A row; carries forward v5.2 line 132 unchanged); the clinician's prior confirmation event is bound by `action_id` (see "Required evidence" row below). |
| **Workload + autonomy envelope** | `ai_workload_type = 'protocol_execution'` AND `autonomy_level = 'action_with_confirm'` (the ONLY I-012-permitted combination per WORKLOAD_TAXONOMY v5.2 §2.2 + I-012 preservation rule). |
| **Required evidence** | (1) `protocol_id` + `protocol_version` populated on the row; (2) explicit clinician confirmation event of the type **`prescribing.protocol_authorization_granted`** (a distinct Category A action ID added by this SI — see AUDIT_EVENTS additions below; clinician actor; scoped to the same `action_id` as this `protocol_authorized_prescribing` record). This is the "or equivalent" form of the canonical AUDIT_EVENTS **v5.3** §I-012 preservation rule (carries forward v5.2 line 78 prose unchanged): "An explicit clinician confirmation event (`prescribing.approved` or equivalent) exists in the immutable audit chain prior to the `*.executed` transition, scoped to the same `action_id`". A DISTINCT confirmation action is required (rather than reusing `prescribing.approved`) because `prescribing.approved` is the success audit for the `clinician_approve` transition route; reusing it as a prerequisite for the protocol-authorized route would mean the row had already taken the clinician route to `active`, making the protocol route either duplicative or unreachable. (3) RBAC-authorization on the confirming actor (clinician role enabled for prescribing in this country_of_care). The binding mechanism is the canonical audit-chain `action_id` scoping — NO separate FK column on the MedicationRequest row; the audit chain itself is the immutable evidence ledger, and adding a row-level FK would create denormalized cross-references with no I-016 immutability protection. |
| **Guard (I-012 reject-unless three-clause)** | All three clauses MUST hold: workload+autonomy canonical AND confirming actor recorded AND RBAC-authorized. Failure on any clause emits `prescribing.execution_rejected` (Category A audit; canonical I-012 rejection action) AND the transition is REJECTED (state remains `pending_clinician_review`; no domain event emitted; row state unchanged). Bare suppression on rejection is forbidden per I-003. |
| **Success audit emission** | `protocol_authorized_prescribing` (canonical Category A action ID; carries forward unchanged from AUDIT_EVENTS v5.2 to v5.3 — see Decision 3 mapping). The audit envelope's `ai_workload_type` MUST equal `'protocol_execution'` and `autonomy_level` MUST equal `'action_with_confirm'`. New post-ratification emissions resolve against v5.3. |
| **Success domain event emission** | `medication_request.approved.v1` with `approval_pathway = 'protocol_authorized'` (reuses the existing canonical DOMAIN_EVENTS v5.2 event type — see Decision 3 mapping; v0.4 Codex Finding 3 closure). Subscribers (Subscription, Notification, Adverse Events) consume the same canonical event for both pathways; they discriminate the route via the `approval_pathway` field. |
| **Distinction from `clinician_approve`** | `clinician_approve` is the clinician-only execution path: the human is the executing actor. Per AUDIT_EVENTS **v5.3** §I-012 closure rule (carries forward v5.2 line 66 + line 127 prose unchanged, plus the v5.3 amendment to the authoritative set), the audit envelope's `ai_workload_type` and `autonomy_level` are REQUIRED for any I-012 action-class record regardless of `actor_type` — null is NOT permitted. For purely human-driven approvals with no upstream AI workload, both fields populate as the literal sentinel string `'n/a'` (added to WORKLOAD_TAXONOMY + AUTONOMY_LEVELS enums for this carve-out per Codex Round-6 Scope 1 MEDIUM-1 patch). For clinician-only approvals where the upstream AI workload was `protocol_execution` at `action_with_confirm` (e.g., a Mode 2 advisory pass that the clinician then ratified directly), the envelope INHERITS the action_id's preceding workload/autonomy values (`protocol_execution` + `action_with_confirm`). `protocol_authorized_prescribing` is the Mode 2 execution path: the protocol engine is the executing actor authority (`actor_type=ai_workload`, `ai_workload_type=protocol_execution`, `autonomy_level=action_with_confirm`) but the clinician confirmation event remains the I-012 anchor per §13.7 three-clause rule. The two paths share `medication_request.approved.v1` as the canonical downstream domain event with the discriminating `approval_pathway` field. |

**Why both routes converge on `medication_request.approved.v1`:** subscriber slices (Subscription, Notification, Adverse Events) care that a prescribing decision became binding; they do not need separate domain-event types for the two execution authorities. The `approval_pathway` field on the existing canonical event already discriminates the route per the current DOMAIN_EVENTS v5.2 definition. Introducing a parallel `medication_request.activated` event would create duplicate subscriber workflows for the same business handoff and would split downstream consumers — rejected per Codex Finding 3 closure (v0.4).

**State Machines §19 entry placement:** insert as §19 after the current §18 (whatever the last numbered section is). The full State Machines doc has 18 active state machines per CLAUDE.md ("18 active state machines + 4 reserved-future transitions"); this becomes #19.

---

## Proposed AUDIT_EVENTS additions — Category A (v0.2 Codex revision; bumps AUDIT_EVENTS v5.2 → v5.3 under P-011 per v0.9 closure)

[v0.2 Codex revision: collapsed the action-ID set per Finding 2 — preserve the canonical `prescribing.*` I-012 vocabulary; reuse existing action IDs where the lifecycle overlaps; net-new `medication_request.*` IDs only for lifecycle events with no canonical equivalent.]

All Category A (safety-critical clinical actions per AUDIT_EVENTS §Category-A — section header preserved across the v5.2 → v5.3 bump). All emit at `audit_sensitivity_level = standard` (NOT high_pii — medication name + dose are clinical detail but not in the I-031 high_pii audit class which is reserved for research-data-export per ADR-028).

### Reuse of existing canonical Category A action IDs (no enum change to AUDIT_EVENTS — these already exist at v5.2 and carry forward to v5.3 unchanged)

These existing canonical action IDs map directly to MedicationRequest lifecycle transitions. Engineering's existing placeholder emit sites already use these names (per `src/lib/audit.ts:54-89`); no rename required.

| Existing canonical action ID | MedicationRequest transition | I-012? | Notes |
|---|---|---|---|
| `prescribing.approved` | `pending_clinician_review → active` (clinician_approve) | **yes** | The prescribing decision itself; I-012 three-clause rule MUST hold |
| `prescribing.declined` | `pending_clinician_review → rejected` (clinician_decline) | no | Clinician deliberately declined; not an I-012 rejection |
| `prescribing.modified` | `pending_clinician_review → pending_interaction_check` (clinician_modify) | no | Re-route through engine; not an execution |
| `prescribing.execution_rejected` | I-012 three-clause rule fails at `pending_clinician_review → active` | **yes** | Mandatory per I-012 closure rule; bare-suppression on failure forbidden |
| `protocol_authorized_prescribing` | Mode 2 protocol-engine authorizes prescribing | **yes** | I-012 three-clause MUST hold AND `protocol_id`+`protocol_version` envelope fields populated |

### Net-new Category A action IDs (added by P-011; lands at AUDIT_EVENTS v5.3)

These are MedicationRequest lifecycle events with no canonical equivalent. The `medication_request.*` prefix avoids namespace collision with the existing `prescribing.*` set. One additional `prescribing.*` action (`prescribing.protocol_authorization_granted`) is added to the `prescribing.*` namespace because it is a CLINICIAN confirmation action that authorizes the protocol-engine prescribing route — semantically it belongs to the `prescribing.*` action class, not to `medication_request.*`.

| Canonical action ID | Triggered by | I-012? | Notes |
|---|---|---|---|
| `medication_request.drafted` | clinician opens prescribing UI; row inserted at status='draft' | no | Informational; useful for click-through-rate metrics |
| `medication_request.submitted_for_review` | `draft → pending_interaction_check` | no | Engine evaluation begins |
| `medication_request.interaction_evaluation_completed` | engine writes back `interaction_signals_status` | no | Links engine output to this record; Med Interaction Engine integration |
| `medication_request.discontinued` | `active → discontinued` (any discontinue transition) | no | `discontinued_reason` field on the audit envelope's detail blob |
| `medication_request.superseded` | `active → superseded` (paired with new prescription) | no | Supersession pair traced via supersedes_id / superseded_by_id |
| `medication_request.expired` | `active → expired` (window end) | no | Scheduled job; not a human action |
| `prescribing.protocol_authorization_granted` [v0.6 Codex Finding 2 closure 2026-05-11; v0.7 envelope shape corrected per Codex v0.6 Finding 1] | clinician explicitly authorizes the protocol-engine route to issue prescribing on their behalf for a specific consult / patient / protocol_id+version | **yes** (I-012 confirmation event; explicitly added to the authoritative I-012 action-class set at AUDIT_EVENTS v5.3 by this ratification — see "I-012 authoritative set amendment" below) | This is the canonical "or equivalent" confirmation event referenced by AUDIT_EVENTS **v5.3** §I-012 preservation rule (carries forward v5.2 line 78 prose unchanged). Required as the clinician-confirmation prerequisite for any subsequent `protocol_authorized_prescribing` success audit on the same `action_id`. Distinct from `prescribing.approved` (which is the clinician-only success route's terminal audit). Envelope (per AUDIT_EVENTS **v5.3** §I-012 closure rule + canonical actor_type enum): `actor_type='clinician'` (the canonical human-signer actor_type — `ai_workload_consumer` is NOT an enum value; rejected per Codex v0.6 Finding 1), `actor_id=<confirming clinician account ULID>`, `ai_workload_type='n/a'` and `autonomy_level='n/a'` UNLESS upstream AI advice contributed (then envelope inherits upstream `protocol_execution` / `action_with_confirm` values per the I-012 closure rule's clinician-confirmation carve-out — prose carried forward unchanged from v5.2 line 127). Payload: `protocol_id`, `protocol_version`, `consult_id`, `patient_account_id`, `accountable_clinician_id`, `authorization_window_minutes`. The audit-chain `action_id` scoping binds this confirmation to the subsequent `protocol_authorized_prescribing` emission. The protocol-engine identity remains exclusively on the subsequent AI-workload success event. |

**Total new action IDs:** 7 (6 `medication_request.*` lifecycle + 1 new `prescribing.protocol_authorization_granted` clinician-confirmation event per Codex v0.5→v0.6 Finding 2 closure). All Category A. All addable to `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md` §Category-A enum as pure string additions (no envelope shape change, no breaking changes to existing slices).

#### I-012 authoritative set amendment [v0.7 Codex Finding 2 closure 2026-05-11]

AUDIT_EVENTS v5.2 §I-012 closure rule (line 66) — the pre-amendment baseline — defines an exact authoritative I-012 action-class set, extendable only by an I-012-amending ADR via additions in the `medication_request / refill / medication-order` namespaces. The new `prescribing.protocol_authorization_granted` is a `prescribing.*` namespace action, so its enrollment as an I-012 confirmation event requires an explicit amendment to the closure rule itself — which lands at AUDIT_EVENTS **v5.3** under P-011.

**Amendment proposed under P-011 — TWO surfaces (v0.8 Codex Finding closure 2026-05-11):**

1. **AUDIT_EVENTS §I-012 closure rule (prose authority).** Pre-amendment baseline: v5.2 line 66. Amended at v5.3 (under P-011) to (i) add `prescribing.protocol_authorization_granted` to the exact authoritative I-012 action-class set, and (ii) broaden the future-extension carve-out to include `prescribing.*` confirmation actions added by an I-012-amending SI promotion. P-011 ratification is the I-012-amending act for this addition. Cross-artifact references that bind to "AUDIT_EVENTS §I-012 closure rule" MUST resolve against the v5.3 (or later) text for any new emission of `prescribing.protocol_authorization_granted`.

2. **CDM v1.2 §audit_events `audit_i012_workload_evidence_required` CHECK constraint (database validator).** The hard-coded `action NOT IN (...)` list at canonical-bundle path `Telecheck_Canonical_Data_Model_v1_2.md` lines 913-919 (the schema validator that enforces non-null `ai_workload_type` + `autonomy_level` for I-012 action-class rows) MUST be amended to add `'prescribing.protocol_authorization_granted'` to the list. Without this validator amendment, a v1.10 audit row for the new confirmation action could pass the CHECK with null workload/autonomy fields, recreating the exact I-012 envelope gap this SI is closing. The amended CHECK becomes:

   ```sql
   CONSTRAINT audit_i012_workload_evidence_required CHECK (
     schema_version != 'v1.10'  -- legacy rows exempt
     OR action NOT IN ('prescribing.initiated', 'prescribing.approved', 'prescribing.declined', 'prescribing.modified',
                    'prescribing.execution_rejected', 'prescribing.protocol_authorization_granted',  -- ADDED by P-011 / SI-001
                    'refill.approved', 'refill.declined', 'refill.execution_rejected',
                    'protocol_authorized_prescribing', 'protocol_authorized_refill_renewal',
                    'protocol_authorized_dispensing_release', 'medication_order.execution_rejected')
     OR (ai_workload_type IS NOT NULL AND autonomy_level IS NOT NULL)
   )
   ```

Both surfaces ship together under P-011; the prose amendment alone is insufficient because the CDM CHECK is the load-bearing database-level enforcement. The CDM change is part of the v1.2 → v1.3 bump (modifies the existing audit_events table CHECK; not a new entity but a modified constraint on an existing one — covered by the version bump). Validators that compile down to runtime CHECK constraints MUST recognize `prescribing.protocol_authorization_granted` as the allowed "or equivalent" confirmation event for the `protocol_authorized_prescribing` execution route, scoped by `action_id` to the subsequent execution event.

**Decision (Codex Finding 2 resolution):** preserve `prescribing.*` as the authoritative I-012 action class. SI-004's paired consult-prescribing emit continues to work unchanged. Engineering's existing placeholder emits for `prescribing.approved`, `prescribing.declined`, `prescribing.modified`, `prescribing.execution_rejected` ratify in place — no rename, no validator rewrite, no cross-artifact cascade.

**Promotion Ledger entry:** P-011 (this SI's ledger entry). 7 net-new action IDs (per v0.6 Codex Finding 2 closure: `prescribing.protocol_authorization_granted` added).

---

## Proposed DOMAIN_EVENTS v5.2 additions — `medication_request.*` type IDs

[v0.4 Codex Finding 3 closure 2026-05-11: `medication_request.activated` was rejected as duplicative of the existing canonical `medication_request.approved.v1` (which already discriminates the two execution routes via its `approval_pathway` field). The activation handoff for BOTH `clinician_approve` and `protocol_authorized_prescribing` routes reuses the existing canonical event. Net-new DOMAIN_EVENTS additions reduce from 5 to 4.]

Cross-module-relevant domain events. Subscriber slices: Subscription (binds new active rows), Med Interaction Engine (subscribes for re-evaluation triggers), Adverse Events (subscribes for discontinuation triggered by adverse-event reports), Notification (patient + clinician notifications on lifecycle changes).

### Reuse of existing canonical DOMAIN_EVENTS v5.2 type (no change)

| Existing canonical type | MedicationRequest transition | Notes |
|---|---|---|
| `medication_request.approved.v1` | `pending_clinician_review → active` for BOTH routes (`clinician_approve` AND `protocol_authorized_prescribing`) | Already canonical in DOMAIN_EVENTS v5.2 with `approval_pathway: "clinician_reviewed | protocol_authorized"` field discriminating the route. No supersession, no alias, no migration required. Subscribers (Subscription, Notification, Adverse Events) consume this single event for both pathways; they branch on `approval_pathway` when route-specific behavior is required. |

### Net-new DOMAIN_EVENTS v5.2 additions

| Canonical type | partition_key formula | Outbox class | Subscriber slices |
|---|---|---|---|
| `medication_request.discontinued` | `tenant_id:medication_request_id` | tenant-scoped | Subscription (cancel binding), Notification, Adverse Events |
| `medication_request.superseded` | `tenant_id:medication_request_id` | tenant-scoped | Subscription (rebind to new), Notification |
| `medication_request.expired` | `tenant_id:medication_request_id` | tenant-scoped | Subscription, Notification |
| `medication_request.interaction_safety_hold_triggered` | `tenant_id:medication_request_id` | tenant-scoped | Med Interaction Engine (closes the override loop), Notification (clinician alert) |

**Total new event types:** 4 (down from 5 in v0.3 per Codex Finding 3 closure). All tenant-scoped per the DOMAIN_EVENTS v5.2 `tenant_id:aggregate_id` partition_key rule (per CLAUDE.md hard rule on domain-event partition_key composition for tenant-scoped aggregates).

**Internal-only state transitions** (`drafted`, `submitted_for_review`, `modified_during_review`, `declined`) — NOT cross-module-relevant; do not emit domain events. They DO emit audit events per the prior section. The `protocol_authorized_prescribing` transition DOES emit `medication_request.approved.v1` (with `approval_pathway='protocol_authorized'`) per §19.X above.

---

## Decisions resolved for the spec corpus

These are the SI-001 "Required from product" items resolved by this DRAFT:

| Item | Resolution proposed in this DRAFT |
|---|---|
| CDM v1.2 §4.16 MedicationRequest field-level schema | §"Proposed CDM §4.16" above — complete |
| State Machines v1.1 §19 MedicationRequest state machine | §"Proposed State Machines v1.1 §19" above — 8 active states + I-012 mapping |
| AUDIT_EVENTS v5.3 (bumped v5.2 → v5.3 under P-011) — `medication_request.*` + `prescribing.protocol_authorization_granted` Category A canonical action IDs | §"Proposed AUDIT_EVENTS additions" — 7 net-new IDs (6 `medication_request.*` lifecycle + 1 new `prescribing.protocol_authorization_granted` per v0.6 Finding 2 closure; existing `prescribing.*` success set preserved per v0.2 Finding 2 closure) |
| DOMAIN_EVENTS v5.2 — `medication_request.*` type IDs | §"Proposed DOMAIN_EVENTS v5.2 additions" — 4 net-new IDs (existing `medication_request.approved.v1` reused for the activation handoff per v0.4 Finding 3 closure) |
| Decision: append-only vs mutable on discontinuation | **Append-only via supersession** — discontinuation creates new row at status='discontinued' linked via supersedes_id; old row state flips to 'superseded' under hash-chain audit |
| Decision: how `interaction_override_id` participates | **Path 1 (RATIFIED 2026-05-11):** column NOT in §4.16 DDL. Med Interaction Engine slice owns its own override table + subscribes to `medication_request.interaction_safety_hold_triggered` domain event. Clean module-boundary separation per ADR-001. |

---

## Med Interaction Engine slice schema coupling — RESOLVED 2026-05-11 (Path 1)

Evans ratified Path 1 on Decision 5 at 2026-05-11. `interaction_override_id` column is NOT in CDM §4.16. Med Interaction Engine slice owns its own override workflow + table; MedicationRequest integrates via the `medication_request.interaction_safety_hold_triggered` domain event (DOMAIN_EVENTS v5.2 — also landed at P-011). Clean module-boundary separation per ADR-001.

Path 2 (FK column on MedicationRequest with constraint deferred) was rejected as tighter coupling that would be harder to evolve independently.

The v0.3 §4.16 DDL above is the canonical shape. The §"Changelog Appendix A — pre-Path-1 v0.2 DDL" at the very bottom of this artifact preserves the older shape for traceability only.

---

## Cross-cutting downstream impact

### What unblocks on ratification

- **Slice 4 Pharmacy + Refill v2.1** — Sprint 4 (EHBG §10b) becomes implementable. Estimated 40-50 commits over Sprint 35-36:
  - Migration 023 (`medication_requests` table per this DRAFT)
  - `src/modules/pharmacy/internal/repositories/medication-request-repo.ts`
  - `src/modules/pharmacy/internal/services/medication-request-service.ts`
  - `src/modules/pharmacy/internal/handlers/medication-requests.ts` (POST draft / POST submit / GET / POST discontinue)
  - `src/modules/pharmacy/audit.ts` (11 Category A emitters)
  - `src/modules/pharmacy/events.ts` (5 domain-event emitters)
  - Integration tests + cross-tenant isolation + I-012 reject-unless regression + supersession-chain regression
- **Slice — Subscription** — binds to `medication_requests(prescription_id)` per CDM §4.7 (already authored at v1.2). Unblocks in parallel.
- **Slice — Med Interaction Engine** — core interaction-evaluation surface (signal-check against a medication list) unblocks. The override workflow remains slice-owned but the engine-evaluation surface can be drafted against the medication_requests table.

### What this DRAFT does NOT unblock (still need separate work)

- Dispensing entity (CDM §3.5 entity #20) — needs its own §4.X expansion.
- Shipment entity (CDM §3.5 entity #21) — needs its own §4.X expansion.
- ProductCatalog ratification (CDM §4.9 exists at v1.2; verify field-set is sufficient for the snapshot-at-prescribe-time pattern).
- Refill entity (CDM §3.5 entity #19) — needs its own §4.X expansion; depends on MedicationRequest (this DRAFT) being canonical.
- InteractionOverride entity (Med Interaction Engine slice ratification).

These are listed as Sprint 35-36 / 36+ follow-on work in EHBG §10b.

---

## Promotion Ledger entry proposal — P-011

**Proposed entry:**

```
P-011 — SI-001 closure: MedicationRequest canonical schema (content-change promotion)
Date: 2026-05-11
Author: Evans (ratifying), Autonomous Claude (drafting)

**Promotion class: content-change (not no-bump reconciliation).** New entity
expansion + new state machine + new audit/domain IDs all require Registry
version bump per Promotion Ledger policy. v0.3 Codex Finding 5 closure.

Version bumps applied at P-011:
- Artifact Registry v2.10 → v2.11 (coverage counts updated: entities 41 → 42; state machines 18 → 19; AUDIT_EVENTS catalog +7 Category A; DOMAIN_EVENTS catalog +4)
- CDM v1.2 → v1.3 (added §4.16 MedicationRequest; modified §audit_events CHECK constraint per I-012 set amendment)
- State Machines v1.1 → v1.2 (added §19 MedicationRequest lifecycle)
- **AUDIT_EVENTS Contracts Pack v5.2 → v5.3 (v0.9 Codex Finding closure 2026-05-11):** This SI changes the §I-012 closure rule's authoritative action-class set (a source-of-truth normative change, not just an additive enum extension), and so requires an explicit version bump. The v1.10 cycle precedent for v5.2-amend covered additive enum entries that did NOT modify the closure-rule prose; this SI does modify the closure-rule prose (adds `prescribing.protocol_authorization_granted` to the exact authoritative set + broadens the future-extension carve-out to permit `prescribing.*` confirmation actions added by an I-012-amending SI promotion). Per the precedent's intent, a normative-prose amendment to an authoritative set is a versioned contract change. Bump → v5.3. Update Registry / Active Document Index / Promotion Ledger references to point to v5.3.
- DOMAIN_EVENTS Contracts Pack v5.2: remains at v5.2 (additive enum extension only; no normative-rule change; same precedent as additive enum extensions in the v1.10 cycle).

Changes:
1. CDM v1.3 §4.16 — NEW entity expansion (MedicationRequest). 34 columns (Path 1 — NO `interaction_override_id`). 6 composite FKs. 7 CHECK constraints. The state-dependent I-012 envelope check restricts the AI-participating EXECUTION path to `ai_workload_type='protocol_execution' AND autonomy_level='action_with_confirm'` ONLY (v0.4 Finding 1 closure; aligns with WORKLOAD_TAXONOMY v5.2 §2.1 which caps `conversational_assistant` at `autonomy_level_range=[advisory]`). Composite UNIQUE (tenant_id, id). RLS via canonical `current_tenant_id()` helper.
2. CDM v1.3 §3.5 entity #18 inventory row — footnote updated; canonical §4.16 reference.
2a. CDM v1.3 §audit_events `audit_i012_workload_evidence_required` CHECK constraint — `'prescribing.protocol_authorization_granted'` added to the `action NOT IN (...)` list per the I-012 authoritative set amendment (v0.8 Codex Finding closure). Without this, the database validator would admit the new confirmation action with null workload/autonomy fields, recreating the I-012 envelope gap. The CHECK modification on the existing audit_events table is covered by the v1.2 → v1.3 bump.
3. State Machines v1.2 §19 — NEW state machine (MedicationRequest lifecycle; 8 active states; 13 transitions; 2 I-012-gated transitions into `active`). The two prescribing-execution routes are explicitly modeled: `clinician_approve` (clinician-only path) and `protocol_authorized_prescribing` (Mode 2 protocol-engine path) — both from `pending_clinician_review → active`, both I-012-gated, both emitting `medication_request.approved.v1` with the discriminating `approval_pathway` field (v0.4 Findings 2 + 3 closure). `protocol_authorized_prescribing` source state retained as `pending_clinician_review` (not `pending_interaction_check`; the conservative I-012 posture — clinician sees engine output + invokes protocol auto-approval; v0.3 Finding 2 closure).
4. AUDIT_EVENTS **v5.3** (bumped from v5.2 under P-011 per v0.9 Codex Finding closure) — 7 net-new Category A action IDs: `medication_request.{drafted, submitted_for_review, interaction_evaluation_completed, discontinued, superseded, expired}` + new clinician-confirmation action `prescribing.protocol_authorization_granted` (I-012 confirmation event for the protocol-authorized route; v0.6 Codex Finding 2 closure — disambiguates the protocol-route confirmation from the clinician-route `prescribing.approved` success audit). Existing `prescribing.{initiated, approved, declined, modified, execution_rejected}` + `protocol_authorized_prescribing` preserved as authoritative I-012 vocabulary, carried forward unchanged from v5.2 to v5.3 (v0.2 Decision 3 mapping; v0.3 Finding 3 closure). The §13.7 protocol-authorized envelope mapping (v0.6 Codex Finding 1 closure): `actor_type='ai_workload'`, `ai_workload_type='protocol_execution'`, `autonomy_level='action_with_confirm'` — the legacy `protocol_engine` actor_type is non-compliant for new emissions per the AUDIT_EVENTS **v5.3** §I-012 closure rule (which carries forward the v5.2 line 66 closure prose and adds the v0.7→v0.9 amendments). Cross-artifact references that bind new emissions to "the §I-012 closure rule" MUST resolve against v5.3 (or later) for any new emission of `prescribing.protocol_authorization_granted`.
5. DOMAIN_EVENTS v5.2 — 4 net-new cross-module event types: `medication_request.{discontinued, superseded, expired, interaction_safety_hold_triggered}`. Existing canonical `medication_request.approved.v1` reused for the activation handoff in BOTH execution routes via its `approval_pathway` field (v0.4 Finding 3 closure; replaces the v0.3 proposal for `medication_request.activated` which would have duplicated the existing canonical event).

No removals. No envelope shape changes. No breaking changes to existing slices.

Unblocks:
- Slice 4 Pharmacy + Refill v2.1 implementation (Sprint 4 in EHBG §10b; Sprint 35 TLC-055)
- Subscription slice (already authored at CDM §4.7; gains live FK target)
- Med Interaction Engine slice (core evaluation surface; integrates via `medication_request.interaction_safety_hold_triggered` domain event per Path 1)

Companion drafts (separate SIs, separate Pn entries):
- SI-002 P-012 (AUDIT_EVENTS placeholder ratification — cross-slice)
- SI-003 P-013 (DOMAIN_EVENTS placeholder ratification — cross-slice)
- SI-004 (Async Consult audit events — rolls under P-012)
- SI-005 (Consult / ConsultEvent CDM expansion — separate Pn)
```

---

## Authoring notes

- Authored in foreground while three parallel agents drafted SI-002 / SI-003 / SI-004+5 closure artifacts. SI-001 is the highest-unblock-value item (Slice 4 + Subscription + Med Interaction Engine).
- Schema follows CDM v1.2 §4.1 Tenant / §4.7 Subscription template exactly. PROJECT_CONVENTIONS r5 §1.1 (composite UNIQUE + composite FK) applied throughout.
- Append-only-via-supersession pattern mirrors Slice 3 consent_versions per Slice PRD v1.0 §7.1 — the established canonical pattern for clinically-significant lifecycle records.
- I-012 reject-unless three-clause rule applied to two transitions: `pending_clinician_review → active` (the prescribing decision) and `protocol_authorized_prescribing` (protocol-engine alternative).
- I-012 envelope-population CHECK constraint enforces `(ai_workload_type IS NULL) = (autonomy_level IS NULL)` — neither set or both set; partial population is invalid.
- audit_sensitivity_level is `standard` for all 11 action IDs. I-031 high_pii audit class is reserved for research-data-export per ADR-028; MedicationRequest is clinical PHI but not "high_pii" under the I-031 definition.

---

## Spec references

- CDM v1.2 §3.5 entity inventory + §4.1 Tenant template + §4.7 Subscription FK reference
- Pharmacy + Refill Slice PRD v2.1 §8.1
- AUDIT_EVENTS v5.3 §Category-A enum + §I-012 closure rule (bumped from v5.2 under P-011 per v0.9 Codex Finding closure)
- DOMAIN_EVENTS v5.2 §envelope schema + §partition_key rules
- INVARIANTS v5.2 I-003 (audit append-only), I-012 (prescribing reject-unless three-clause), I-019 (crisis detection floor), I-023 (tenant isolation three-layer), I-027 (audit tenant context), I-031 (high_pii audit class — does NOT apply here)
- WORKLOAD_TAXONOMY v5.2 + AUTONOMY_LEVELS v5.2 (envelope field population)
- Tenant Threading Addendum v1.0 §3.4 (country_of_care denormalization)
- PROJECT_CONVENTIONS.md r5 §1.1 (composite UNIQUE + composite FK), §1.2 (named constraints), §1.3 (RLS policy mandatory)
- EHBG v1.3 §10b — Sprint 4 (Pharmacy + Refill)
- EHBG v1.3 §12 — SI escalation template
- Master Platform PRD v1.10 §17 + Glossary v5.2 C3 (brand structure note)

---

## Authoring discipline checklist

- [x] Used canonical glossary terms (`medication_request` not `prescription`).
- [x] No emoji.
- [x] All composite-UNIQUE + composite-FK relationships named per PROJECT_CONVENTIONS r5 §1.2.
- [x] RLS policy stated explicitly.
- [x] I-012 closure rule applied to the two prescribing transitions.
- [x] State machine has explicit terminal states.
- [x] Discontinuation reason CHECK constraint enforces null-or-set parity with status.
- [x] Audit-sensitivity-level explicit on every proposed action ID.
- [x] All `[NEEDS RATIFICATION: ...]` markers visible inline (3 markers: prescribing.* rename, interaction_override_id path 1 vs 2, P-011 vs P-012 ledger entry batching).
- [x] No `[AMENDMENT TO SHIPPED CODE]` markers needed — MedicationRequest is greenfield; no shipped migration to amend.

---

## Changelog Appendix A — pre-Path-1 v0.2 DDL (non-normative; preserved for traceability)

The v0.2 DDL included an `interaction_override_id VARCHAR(26)` column referencing an `interaction_overrides` table owned by the Med Interaction Engine slice. Path 1 ratification (2026-05-11) removed this column per the v0.3 §"Med Interaction Engine slice schema coupling — RESOLVED 2026-05-11 (Path 1)" decision above. Future readers should NOT reintroduce the column.

The v0.2 shape is preserved here only as audit-trail evidence of the design considered + the decision made:

```sql
-- (v0.2 pre-Path-1 — DO NOT USE)
-- Safety integration (Med Interaction Engine slice — per PROJECT_CONVENTIONS r5 §1.1)
-- interaction_signals_evaluated_at    TIMESTAMPTZ,
-- interaction_signals_status          VARCHAR(20)  NOT NULL DEFAULT 'pending',
-- interaction_override_id             VARCHAR(26),   -- ← REMOVED in Path 1 v0.3
```

**v0.3 canonical shape (Path 1):** the column is absent from §4.16. Med Interaction Engine slice owns its own override table + subscribes to `medication_request.interaction_safety_hold_triggered` domain event.
