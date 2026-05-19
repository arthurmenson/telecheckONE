# SI-015 — MarketingCopy CDM canonical schema + governance-review binding

**Version:** 0.1 DRAFT
**Status:** Pre-Codex-pre-ratification; not yet routed to ratifier
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

## 2. Proposed sub-decisions (6; all APPROVED RECOMMENDATION)

### Sub-decision 1: CDM §4 new entity `marketing_copy_version`

One row per immutable version of a marketing copy artifact. Columns:

- `id` ULID primary key
- `tenant_id` Telecheck-{country} per ADR-023 + I-023 (operating-tenant-scoped)
- `surface_id` ULID FK (the marketing surface this copy version applies to — referenced from `marketing.surface_rendered` audit event)
- `surface_type` enum (`landing_page | email_header | sms_template | in_app_banner | ad_creative_class` — extensible)
- `country_of_care` ISO 3166-1 alpha-2 (the country this version is approved for; CCR-driven)
- `copy_payload` JSONB (the actual content — text + image references + CTA destinations; KMS-encrypted at rest if `contains_phi` is true OR if country regulatory requires)
- `copy_payload_kms_envelope` 8-column flat KMS envelope (mirroring SI-005 precedent) — NULLABLE; populated only when KMS encryption applies
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
- STEP 2: caller-role check (caller has `marketing_copy.approver` role OR is named on `governance_review_reviewer_ids`)
- STEP 3: dual-control assertion (caller ≠ `created_by_account_id` per I-015)
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

1. **Does `copy_payload` require KMS encryption at rest unconditionally, or conditionally per country/contains_phi?** Recommendation: conditional (KMS-encrypted only when `contains_phi = true` OR country regulatory requires; default plaintext for routine marketing copy).
2. **What is the `governance_review_approval_validity_until` source-of-truth?** Recommendation: CCR-driven via `marketing_governance_review_cadence_months` key per ADR-027 + §13.2 (e.g., US = 6 months, Ghana = 12 months); the SI-015 entity row captures the validity_until at version-publish time (immutable per I-013).
3. **Cross-surface inheritance** — when a tenant has 100 marketing surfaces, must every surface re-author copy independently, or can a "shared library" pattern reuse claim text? Recommendation: per-surface independent at v1.0; library pattern deferred to future SI (separate scope).
4. **Codex pre-ratification target:** 3 rounds + 1 verification = 4 total. STOP-and-escalate per discipline floor on architectural-judgment.

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
