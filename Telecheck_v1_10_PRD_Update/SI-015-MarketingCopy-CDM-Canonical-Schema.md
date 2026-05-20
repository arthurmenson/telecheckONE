# SI-015 — MarketingCopy CDM canonical schema + governance-review binding

**Version:** 0.2 DRAFT (R1 STOP-and-queue 2026-05-19)
**Status:** **DRAFT / BLOCKED-PENDING-EVANS-PERSISTENCE-MODEL-RATIFIER-DECISION (architectural; same class as SI-019 OQ7).** Codex R1 (2026-05-19, review-mpd2d9y3-xmyv3o) flagged the same canonical contradiction as SI-019 R1: Sub-decision 1 declares `marketing_copy_version` strict append-only per I-013 + I-016 (BEFORE UPDATE + BEFORE DELETE triggers) BUT Sub-decision 5's `publish_marketing_copy_version` procedure requires UPDATEs (`superseded_at` on prior row + `published_at` on new row). The contradiction is the same class as SI-019 OQ7 (interaction_signal): immutable-entity-vs-publish-UPDATE. Per CLAUDE.md hard-floor item 6, this is architectural-judgment requiring ratifier escalation. Iteration HALTED at R1. **Recommendation: a single ratifier decision on the architectural pattern (Option A immutable-entity + transition entity; OR Option B constrained-update + transition log per P-021 SC3 precedent) resolves BOTH SI-015 AND SI-019 simultaneously.** See `SI-019-Med-Interaction-Slice-PRD-v2-Implementation-Readiness-Extension.md` §5 OQ7 for the full Option A vs Option B framing. The R1 MED-1 + MED-2 + HIGH-2 procedural findings are closed inline below.
**Authoring location:** `Telecheck_v1_10_PRD_Update/` (workstream folder; ratifier-input artifact)
**Owner:** Clinical Content Author (existing role from Forms-Intake slice precedent) + Compliance Officer
**Related artifacts:**
- Master PRD v1.10 §13.2 — Marketing copy governance review process (the policy SI-015 codifies a CDM entity for)
- ADR-027 (Country-Conditional DTC Marketing posture) — establishes the marketing posture this SI's entity supports
- Promotion Ledger entry **P-024** (SI-011 UMBRELLA ratification 2026-05-18) — filed SI-015 as a dependency SI required for SI-011c (MarketingCopy approval gate sub-SI)
- `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md` v5.5 — already carries `marketing.surface_rendered` + `marketing.surface_drift` Cat B events (added per ADR-027 in v5.2 cycle); SI-015 specifies the entity those events reference
- `Telecheck_Contracts_Pack_v5_00_CCR_RUNTIME.md` — already carries 4 marketing CCR keys (added per ADR-027); SI-015 entity row carries `marketing_copy_version_id` referenced from the runtime CCR-marketing-policy

---

## 1. Why this SI exists

ADR-027 Country-Conditional DTC Marketing was ratified at v1.10 promotion 2026-05-01. The downstream entities + audit events + CCR keys all exist or are scoped — but the **MarketingCopy entity itself has no canonical CDM row shape**. The marketing.surface_rendered audit event carries `marketing_copy_version_id` + `governance_review_reference_id` etc.; without a canonical entity definition, those references are dangling.

SI-011 UMBRELLA (SC7 P-024 ratification 2026-05-18) filed SI-015 as a NEW dependency SI for SI-011c (MarketingCopy approval gate). Per Plan §"Recommended next-session fan-out" item 1, SI-015 is one of the "7 pending SIs" in the batched ratification ceremony.

**Scope:** define the canonical MarketingCopy entity row shape, governance-review-versioning model, and binding to the existing canonical AUDIT_EVENTS marketing events + CCR_RUNTIME marketing keys.

**Out of scope:**
- Marketing copy content authoring tooling (separate UI surface; deferred to Admin Backend slice)
- §13.2 governance-review process workflow design (already in Master PRD; this SI codifies the CDM entity, not the workflow)
- Per-country marketing approval rules (CCR-driven per ADR-027; this SI doesn't redefine CCR semantics)

---

## 2. Proposed sub-decisions (6 total; APPROVED RECOMMENDATION status varies — see per-decision tags below; Sub-decisions 1 + 5 are PERSISTENCE-MODEL-DEPENDENT on the Evans OQ4 ratifier decision)

**Per-decision APPROVED recommendation status (closes Codex R1 HIGH-2 premature-APPROVED finding):**

| Sub-decision | APPROVED status | Conditioned on |
|---|---|---|
| 1. CDM new entity `marketing_copy_version` | **PERSISTENCE-MODEL-DEPENDENT** | Resolves under Option A (immutable + transition entity) OR Option B (constrained-update + transition log); both options enumerated in OQ4 |
| 2. AUDIT_EVENTS +2 Cat B action IDs | **APPROVED** | Independent of persistence model |
| 3. DOMAIN_EVENTS +2 additive event types | **APPROVED** | Independent of persistence model |
| 4. RBAC +2 role definitions | **APPROVED** | Independent of persistence model |
| 5. SECURITY DEFINER `publish_marketing_copy_version` | **PERSISTENCE-MODEL-DEPENDENT** | Sub-decision 1's persistence-model decision determines whether STEP 5/6 are UPDATEs (Option B) or INSERTs into a transition entity (Option A) |
| 6. Tenant-threading per ADR-023 + I-023 + I-032 | **APPROVED** | Independent of persistence model |

### Sub-decision 1: CDM §4 new entity `marketing_copy_version`

One row per immutable version of a marketing copy artifact. Columns:

- `id` ULID primary key
- `tenant_id` Telecheck-{country} per ADR-023 + I-023 (operating-tenant-scoped)
- `surface_id` ULID FK (the marketing surface this copy version applies to — referenced from `marketing.surface_rendered` audit event)
- `surface_type` enum (`landing_page | email_header | sms_template | in_app_banner | ad_creative_class` — extensible)
- `country_of_care` ISO 3166-1 alpha-2 (the country this version is approved for; CCR-driven)
- `copy_payload` JSONB — the actual content (text + image references + CTA destinations). MUST be NULL when `encryption_required = true`; the encrypted form lives in `copy_payload_kms_envelope` per the discriminator below.
- `encryption_required` BOOLEAN NOT NULL — explicit discriminator column (closes Codex R1 MED-1). Derivation rule: `encryption_required = (contains_phi = true) OR (country_regulatory_encryption_required(country_of_care) = true)`; the runtime CCR resolver computes the second predicate per country-of-care. CHECK constraint at the row level: `(encryption_required = true AND copy_payload IS NULL AND copy_payload_kms_envelope IS NOT NULL) OR (encryption_required = false AND copy_payload IS NOT NULL AND copy_payload_kms_envelope IS NULL)`. INSERT REJECTED on violation. Makes the conditional rule canonically enforceable from the schema alone + auditable post-hoc by querying `encryption_required` directly.
- `contains_phi` BOOLEAN NOT NULL — clinical-content-author asserts whether the copy contains any patient-identifying information; feeds the `encryption_required` derivation.
- `copy_payload_kms_envelope` 8-column flat KMS envelope (mirroring SI-005 precedent) — populated only when `encryption_required = true`; NULL otherwise per the CHECK constraint above
- `claim_classes` text[] (the §13.2 claim classes this copy makes — e.g., `efficacy_claim`, `safety_claim`, `regulatory_disclaimer`, `pricing_claim`)
- `governance_review_reference_id` ULID NOT NULL — references the §13.2 review artifact (Decision Brief / approval record)
- `governance_review_reviewer_ids` ULID[] NOT NULL — the named human reviewers per §13.2
- `governance_review_approval_timestamp` TIMESTAMPTZ NOT NULL
- `governance_review_approval_validity_until` TIMESTAMPTZ NOT NULL — per `marketing_governance_review_cadence_months` (CCR key)
- `published_at` TIMESTAMPTZ — when the version was promoted to "live"; NULL if not yet published
- `superseded_at` TIMESTAMPTZ — when superseded by a later version; NULL while active
- `created_at` TIMESTAMPTZ NOT NULL
- `created_by_account_id` ULID FK to accounts (the clinical_content_author who authored)

**Triple-composite UNIQUE** `(tenant_id, surface_id, id)` per CDM precedent.

**Strict append-only via BEFORE UPDATE + BEFORE DELETE triggers per I-013 (Published content versions are immutable) + I-016 (Domain events are immutable):**
- INSERT permitted
- UPDATE rejected — version supersession produces a NEW row, never modifies existing
- DELETE rejected — superseded versions retained for audit + traceability

### Sub-decision 2: AUDIT_EVENTS — preserved + 2 new action IDs

Existing canonical actions preserved (no change): `marketing.surface_rendered` + `marketing.surface_drift` (already in AUDIT_EVENTS v5.5 catalog).

**2 new action IDs (Cat B governance):**
- `marketing_copy_version.created` (Cat B; emitted on INSERT into `marketing_copy_version`; envelope per §13.2 Governance review reference)
- `marketing_copy_version.published` (Cat B; emitted when `published_at` is set on a row; supersedes prior version's `superseded_at`)

Promotion class: content-change; AUDIT_EVENTS +1 patch bump.

### Sub-decision 3: DOMAIN_EVENTS — 2 new event types (additive)

- `marketing_copy_version.published.v1` — partition_key `tenant_id:surface_id`
- `marketing_copy_version.superseded.v1` — partition_key `tenant_id:surface_id`

Subscribers: marketing surface rendering service (re-renders on publish); CCR runtime (validates ccr_marketing_policy_version_id matches against this surface's canonical pinning).

### Sub-decision 4: RBAC — 2 new role definitions (Forms-Intake precedent)

- `marketing_copy.author` — write role for INSERT into `marketing_copy_version`; granted to `clinical_content_author` actor type + `marketing_content_author` (new actor type if needed) — RBAC v1.2 entry
- `marketing_copy.approver` — dual-control approver per I-015; granted to `compliance_officer` + `medical_director` roles; required for `governance_review_approval_timestamp` to be set

### Sub-decision 5: SECURITY DEFINER procedure `publish_marketing_copy_version()`

Per cycle precedent (SI-005's `record_consult_clinician_decision`, SI-008's `record_workflow_pointer_swap`), the publish-version path goes through a SECURITY DEFINER procedure with I-032 STEP 0 Mode 1/Mode 2 + dual-control verification.

Validation steps:
- STEP 0: I-032 Mode 1 NULL/blank-GUC RAISE + Mode 2 mismatch structured-rejection (per canonical I-032 v5.3)
- STEP 1: auth-FIRST per I-023 layer 2
- STEP 2: caller-role check (caller MUST hold `marketing_copy.approver` role — closes Codex R1 MED-2; `governance_review_reviewer_ids` membership alone is INSUFFICIENT for the publish authorization)
- STEP 3: dual-control assertion (caller ≠ `created_by_account_id` per I-015 — second control beyond STEP 2 role check)
- STEP 3.5: reviewer-of-record assertion (caller MUST be listed in `governance_review_reviewer_ids` for this row, AS WELL AS holding `marketing_copy.approver` from STEP 2; STEP 2's RBAC + STEP 3.5's per-row reviewer-of-record together prevent both (a) non-approvers from publishing AND (b) approvers from publishing a version they were not the named reviewer for)
- STEP 4: governance-review-window assertion (`now() BETWEEN governance_review_approval_timestamp AND governance_review_approval_validity_until`)
- STEP 5: prior-version supersession atomic UPDATE (`superseded_at = now()` on the currently-published row for the same `(tenant_id, surface_id)`)
- STEP 6: new-row published_at UPDATE
- STEP 7: paired DOMAIN_EVENTS emission (within procedure: `marketing_copy_version.published.v1` + `marketing_copy_version.superseded.v1` for prior)
- STEP 8: audit emission (application-layer post-success per canonical I-003 engineering-review pattern: `marketing_copy_version.published` Cat B audit event)
- STEP 9: rejection-code emission with reject codes

Rejection codes: `tenant_guc_mismatch` (I-032), `unauthorized_role`, `dual_control_violation`, `governance_review_window_expired`, `prior_version_supersession_failed`, `unique_violation`.

### Sub-decision 6: Tenant-threading per ADR-023 + I-023

- `marketing_copy_version.tenant_id` enforced via RLS on all reads + writes
- The procedure inherits I-032 STEP 0 Mode 1/Mode 2 (per the just-ratified canonical I-032 in INVARIANTS v5.3)
- Cross-tenant copy reuse NOT supported at v1.0 — each tenant maintains its own `marketing_copy_version` rows; future cross-tenant template sharing (if needed) requires a separate SI

---

## 3. Cross-artifact impact

If all 6 sub-decisions ratify, the lockstep PR-A2-class commit lands:

- **CDM:** +1 new entity (`marketing_copy_version`) + 1 new SECURITY DEFINER procedure (`publish_marketing_copy_version`)
- **AUDIT_EVENTS:** +2 net-new Cat B action IDs (preserves existing marketing.surface_* events)
- **DOMAIN_EVENTS:** +2 new event types (additive; no version bump)
- **RBAC:** +2 new role definitions
- **CCR_RUNTIME:** no changes (existing 4 marketing CCR keys cover this entity per ADR-027)
- **Registry:** +1 minor bump consolidated
- **Promotion Ledger:** 1 new entry (P-NUM TBD)

**Total contract-file bumps:** CDM +1 minor; AUDIT_EVENTS +1 patch; RBAC +1 minor; Registry +1 minor. **DOMAIN_EVENTS additive (no bump).**

---

## 4. Open questions for ratifier

1. **Does `copy_payload` require KMS encryption at rest unconditionally, or conditionally per country/contains_phi?** Recommendation: conditional (KMS-encrypted only when `contains_phi = true` OR country regulatory requires; default plaintext for routine marketing copy). **Sub-decision 1 R1 closure now codifies the discriminator (`encryption_required` BOOLEAN NOT NULL + CHECK constraint) so this OQ is RESOLVED inline.**
2. **What is the `governance_review_approval_validity_until` source-of-truth?** Recommendation: CCR-driven via `marketing_governance_review_cadence_months` key per ADR-027 + §13.2 (e.g., US = 6 months, Ghana = 12 months); the SI-015 entity row captures the validity_until at version-publish time (immutable per I-013).
3. **Cross-surface inheritance** — when a tenant has 100 marketing surfaces, must every surface re-author copy independently, or can a "shared library" pattern reuse claim text? Recommendation: per-surface independent at v1.0; library pattern deferred to future SI (separate scope).

### Open Question 4 (SI-015-OQ-PERSISTENCE-MODEL = SI-019-OQ-SIGNAL-LIFECYCLE) — **STOP-CONDITION; HARD-FLOOR ITEM 6 ESCALATION; AWAITING EVANS'S RATIFIER DECISION**

**Trigger:** Codex R1 on SI-015 v0.1 (2026-05-19, review-mpd2d9y3-xmyv3o) flagged the same canonical contradiction as Codex R1 on SI-019 v0.1 (review-mpcvz3wr-593vo1): a CDM entity declared strict append-only per I-013 + I-016 + I-003 BUT a SECURITY DEFINER procedure that UPDATEs the entity for state-machine progression.

**Cross-SI architectural decision (same question; ratifier should answer once for both):**

- **Option A — Immutable entity + append-only transition entity:** the primary CDM entity stays strict append-only; a separate transition-log entity captures state changes via INSERT only. Pattern matches SI-008 `audit_events` model. Both SI-015 (marketing_copy_version) and SI-019 (interaction_signal) get a parallel transition entity.

- **Option B — Constrained UPDATE + transition log:** the primary CDM entity gains a `state` column with a constrained-UPDATE trigger (rejects all UPDATEs except the canonical state-machine transitions); a transition-log entity captures the transitions for audit. Pattern matches P-021 SC3 ratified `consults` two-tier append-only model (Tier 0 identity immutable + Tier 1 payload immutable + Tier 2 state-machine progression). Both SI-015 and SI-019 would adopt this pattern.

**Claude's advisory recommendation:** Option B. Reasoning:

1. **Direct precedent.** P-021 SC3 ratified exactly this pattern for `consults` at 2026-05-17 (two-tier append-only with state-machine transitions). Both SI-015 and SI-019 are structurally analogous (single entity row with lifecycle state).
2. **I-013 + I-016 interpretation.** P-021 SC3's ratification established the interpretation "audit-history is append-only + entity state progression via guarded transitions is permitted." Option B inherits this; Option A would require a different interpretation (every audit-relevant row immutable forever).
3. **Read-path simplicity.** "Get current state" is a frequent read; Option B is a direct column read, Option A requires a JOIN to the transition entity.
4. **Migration story.** Option B preserves the existing v1.0 entity shapes; Option A would require restructuring.

**If Evans selects Option A:** SI-015 Sub-decision 1 simplifies (no UPDATE triggers needed on marketing_copy_version), Sub-decision 5 procedure rewrites to INSERT into a transition entity instead of UPDATE; +1 entity each on SI-015 + SI-019.

**If Evans selects Option B:** SI-015 Sub-decision 1 adds a `state` column + constrained-UPDATE trigger pattern (matches P-021), Sub-decision 5 procedure stays as authored; +1 transition-log entity each on SI-015 + SI-019.

**This decision applies cross-SI: ratifying it once resolves both SI-015 Sub-decisions 1 + 5 AND SI-019 Sub-decisions 1 + 5 + 8 (interaction_signal lifecycle).**

**Decision Memo template available for either Option** if Evans signals which path he prefers.

5. **Codex pre-ratification target:** 3 rounds + 1 verification = 4 total. STOP-and-escalate per discipline floor on architectural-judgment.

---

## 5. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; awaiting Codex R1.

---

## 6. Sequence for ratification

1. Codex pre-ratification cycle on this SI (target 3-4 rounds).
2. Decision Brief authored summarizing the 6 sub-decisions + 3 open questions for ratifier review.
3. Ratifier ceremony (Evans-led; chat-message ratification per cycle precedent).
4. Canonical content port lockstep commit lands CDM + AUDIT_EVENTS + DOMAIN_EVENTS + RBAC + Slice PRD addendum + Promotion Ledger entry + Registry bump in single commit.
5. Unblocks SI-011c (MarketingCopy approval gate sub-SI of SI-011 UMBRELLA).

---

— Claude (Opus 4.7, 1M context), SI-015 v0.1 DRAFT authored 2026-05-19 under "continue for 24 hrs" autonomous-work authorization. Sprint 2 of the 24h-loop work plan.
