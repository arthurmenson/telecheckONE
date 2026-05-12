# SI-002 Closure Artifact — AUDIT_EVENTS v5.2 placeholder action IDs ratification

**Status:** DRAFT — awaiting Evans's ratification into spec corpus AUDIT_EVENTS v5.2 (or v5.3)
**Date:** 2026-05-11
**Author:** Autonomous Claude (SI closure cycle workstream)
**Closes:** SI-002 in `telecheck-app/docs/SI-002-AUDIT_EVENTS-Placeholder-Ratification.md`
**Target spec doc:** `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md` (current v5.2)
**Severity:** medium → resolved-on-ratification

---

## Summary

SI-002 was raised by engineering on 2026-05-05 after three slices (Forms/Intake v2.1, Identity v1.0, Consent + Delegated Access v1.0) shipped end-to-end audit emission via the established same-transaction `txCallback` pattern but with **31 unratified placeholder action-ID strings** carried through a single `as AuditAction` cast site per slice. The hash chain (I-003), tenant scoping (I-027), and chain-walker verification are all intact; only the action-ID enum strings themselves lack canonical ratification in AUDIT_EVENTS v5.2.

This artifact proposes (a) canonical action-ID strings for all 31 placeholders following the dot-namespaced category-prefixed naming convention already used by the v5.2 research and marketing event families (`research.export_initiated`, `marketing.surface_rendered`); (b) Category A/B/C assignments per the safety-classification matrix; (c) I-012 closure-rule applicability cross-check; (d) `audit_sensitivity_level` assignments; and (e) a Promotion Ledger P-012 entry path. The proposal is purely additive — no envelope-shape changes, no existing-ID modifications, no schema migration.

On ratification, engineering removes the `{slice}AuditPlaceholder()` cast sites, updates the central `AuditAction` union type to the canonical strings, and updates test-side predicate matchers (notably `tests/integration/consent-audit-chain.test.ts §1b`) in lockstep. The hash-chain trigger is unaffected — it hashes the rendered string verbatim regardless of its name.

## Background

Per SI-002 §"What's missing", the three slices emit canonical AUDIT_EVENTS v5.2 envelopes (tenant_id present, hash-chain-linked, immutable) but the action-ID strings themselves are slice-authored placeholders. EHBG §12 forbids engineering from authoring canonical contract artifacts unilaterally — this is the spec-corpus side of that escalation. The 31 placeholder strings as currently emitted:

- **Forms/Intake (14):** `forms_template_created`, `forms_template_version_published`, `forms_eligibility_logic_edited`, `forms_approval_governance_edited`, `forms_deployment_created`, `forms_deployment_retired`, `forms_submission_started`, `forms_submission_paused`, `forms_submission_resumed`, `forms_submission_completed`, `forms_variant_created`, `forms_variant_winner_promoted`, `forms_variant_retired`, and intake_* crisis-family (per I-019 platform floor — emitted via different code path, NOT in scope for SI-002).

- **Identity & Auth (9):** `identity_account_created`, `identity_account_activated`, `identity_session_issued`, `identity_session_revoked`, `identity_otp_issued`, `identity_otp_consumed`, `identity_otp_lockout_triggered`, `identity_device_registered`, `identity_device_revoked`.

- **Consent + Delegated Access (8):** `consent_granted`, `consent_revoked`, `delegation_invited`, `delegation_accepted`, `delegation_declined`, `delegation_revoked`, `delegation_scope_granted`, `delegation_scope_revoked`.

Naming convention adopted in this proposal: **dot-namespaced category-prefixed** (matches `research.*`, `marketing.*`, `prescribing.*`, `refill.*`, `forms_eligibility_logic_edited` which is the singular existing v5.2 forms-family Category B entry). The existing v5.2 Category C catalog uses underscore-only naming (`patient_account_created`, `consent_granted`, `consent_revoked`, `delegation_setup`, `delegation_revoked`). This inconsistency is noted in SI-002 §"Required from product" item 2 and is resolved here in favor of dot-namespaced for all new IDs to align with the v1.10-cycle precedent. **Two existing v5.1 Category C IDs — `consent_granted` and `consent_revoked` — already exist in the catalog**; the proposal below preserves those literal strings rather than renaming (renaming a ratified Category C ID would break existing emitter contracts in any pre-v1.10 backfill records).

## Proposed canonical action IDs

### Forms/Intake (14 → 13 net new; 1 already ratified at v5.2)

| Placeholder ID | Canonical ID | Category | I-012 applicable? | audit_sensitivity_level | First-emitted-from |
|---|---|---|---|---|---|
| `forms_template_created` | `forms.template.created` | B | no | standard | forms-intake `templates.ts` |
| `forms_template_version_published` | `forms.template.version_published` | B | no | standard | forms-intake `templates.ts` |
| `forms_eligibility_logic_edited` | `forms_eligibility_logic_edited` (preserved — already in v5.2 Cat B catalog) | B | no | standard | forms-intake `eligibility.ts` |
| `forms_approval_governance_edited` | `forms_approval_governance_edited` (preserved — already in v5.2 Cat B catalog) | B | no | standard | forms-intake `governance.ts` |
| `forms_deployment_created` | `forms.deployment.created` | B | no | standard | forms-intake `deployments.ts` |
| `forms_deployment_retired` | `forms.deployment.retired` | B | no | standard | forms-intake `deployments.ts` |
| `forms_submission_started` | `forms.submission.started` | C | no | standard | forms-intake `submissions.ts` |
| `forms_submission_paused` | `forms.submission.paused` | C | no | standard | forms-intake `submissions.ts` |
| `forms_submission_resumed` | `forms.submission.resumed` | C | no | standard | forms-intake `submissions.ts` |
| `forms_submission_completed` | `forms.submission.completed` | C | no | standard | forms-intake `submissions.ts` |
| `forms_variant_created` | `forms.variant.created` | B | no | standard | forms-intake `variants.ts` |
| `forms_variant_winner_promoted` | `forms.variant.winner_promoted` | B | no | standard | forms-intake `variants.ts` |
| `forms_variant_retired` | `forms.variant.retired` | B | no | standard | forms-intake `variants.ts` |

**Category rationale:** template/deployment/variant lifecycle events touch governance surfaces (clinical content, eligibility logic, approval workflow) per Forms Engine v2.1 §13 — Category B. Submission lifecycle events (`started/paused/resumed/completed`) are per-patient operational engagement — Category C, matching the existing pattern of `consult_booked`, `consult_started`, `consult_completed` in v5.2 Cat C. [NEEDS RATIFICATION: confirm `forms_eligibility_logic_edited` and `forms_approval_governance_edited` literal strings are preserved as-is rather than renamed to dot-namespaced — they're already ratified at v5.2 Cat B per the existing AUDIT_EVENTS file.]

### Identity & Auth (9 net new)

| Placeholder ID | Canonical ID | Category | I-012 applicable? | audit_sensitivity_level | First-emitted-from |
|---|---|---|---|---|---|
| `identity_account_created` | `identity.account.created` | C | no | standard | identity `accounts.ts` |
| `identity_account_activated` | `identity.account.activated` | C | no | standard | identity `accounts.ts` |
| `identity_session_issued` | `identity.session.issued` | C | no | standard | identity `sessions.ts` |
| `identity_session_revoked` | `identity.session.revoked` | C | no | standard | identity `sessions.ts` |
| `identity_otp_issued` | `identity.otp.issued` | C | no | standard | identity `otp.ts` |
| `identity_otp_consumed` | `identity.otp.consumed` | C | no | standard | identity `otp.ts` |
| `identity_otp_lockout_triggered` | `identity.otp.lockout_triggered` | B | no | standard | identity `otp.ts` |
| `identity_device_registered` | `identity.device.registered` | C | no | standard | identity `devices.ts` |
| `identity_device_revoked` | `identity.device.revoked` | C | no | standard | identity `devices.ts` |

**Category rationale:** Account, session, OTP-issued/consumed, and device-registered/revoked are per-patient operational engagement — Category C, matching the existing v5.2 `patient_account_created`, `patient_identity_verified`, `login_successful`, `login_failed` precedent. **OTP lockout (`identity.otp.lockout_triggered`) is uplifted to Category B** because it represents an enforcement action with security-policy semantics (lockout duration, attempt-count threshold, suspected abuse). [NEEDS RATIFICATION: confirm `identity.otp.lockout_triggered` belongs in Category B governance rather than Category C operational. Argument for B: it's a platform-level enforcement decision visible to compliance. Argument for C: SI-002 framing places it alongside the other identity ops events.]

### Consent + Delegated Access (8 → 2 already ratified at v5.1; 6 net new)

| Placeholder ID | Canonical ID | Category | I-012 applicable? | audit_sensitivity_level | First-emitted-from |
|---|---|---|---|---|---|
| `consent_granted` | `consent_granted` (preserved — already in v5.1 Cat C catalog) | C | no | standard | consent `audit.ts` |
| `consent_revoked` | `consent_revoked` (preserved — already in v5.1 Cat C catalog) | C | no | standard | consent `audit.ts` |
| `delegation_invited` | `delegation.invited` | C | no | standard | consent `delegation.ts` |
| `delegation_accepted` | `delegation.accepted` | C | no | standard | consent `delegation.ts` |
| `delegation_declined` | `delegation.declined` | C | no | standard | consent `delegation.ts` |
| `delegation_revoked` | `delegation_revoked` (preserved — already in v5.1 Cat C catalog) | C | no | standard | consent `delegation.ts` |
| `delegation_scope_granted` | `delegation.scope.granted` | C | no | standard | consent `delegation.ts` |
| `delegation_scope_revoked` | `delegation.scope.revoked` | C | no | standard | consent `delegation.ts` |

**Category rationale:** General consent/delegation lifecycle is per-patient engagement — Category C, matching the existing v5.1 `consent_granted`, `consent_revoked`, `delegation_setup`, `delegation_revoked` precedent. **Note:** `consent_granted` / `consent_revoked` in the v5.1 Cat C catalog cover **general platform consent** (terms of service, data-use, communication preferences). The **research consent** variants (`research.consent_granted` / `research.consent_revoked`) are separate Cat B events added at v5.2 per ADR-028 — the two families coexist and emit separately based on `consent_type`. [NEEDS RATIFICATION: confirm `delegation.invited` / `delegation.accepted` / `delegation.declined` are net-new (the existing v5.1 entry is `delegation_setup`, which collapses invite + accept into one event; SI-002 splits these into the lifecycle states emitted by the actual delegation slice). If Privacy/Compliance prefers to preserve the collapsed `delegation_setup` semantic, the slice would need to coalesce its three internal events into one canonical emission.]

## I-012 closure-rule cross-check

The I-012 closure rule applies **only** to the authoritative action-class set declared in AUDIT_EVENTS v5.2 §"I-012 closure rule": `prescribing.*`, `refill.*`, `protocol_authorized_*`, `medication_order.execution_rejected`, and explicitly-added future medication_request / refill / medication-order classes.

**None of the 31 placeholder action IDs in this SI fall under the I-012 action-class set.** Forms/Intake template + submission events are governance and operational; Identity events are session/credential lifecycle; Consent events are patient-authored permission state. None involve `medication_request`, refill, or medication-order semantics.

**Confirmed:** No proposed ID requires the `ai_workload_type` / `autonomy_level` envelope-population uplift, and no proposed ID can be mis-categorized as Category A under the §13.7 three-clause reject-unless rule. All proposed IDs are governance-or-operational with the standard nullability carve-out for non-AI events (`ai_workload_type = null`, `autonomy_level = null` when `actor_type ≠ ai_workload`).

[NEEDS RATIFICATION: confirm that no future evolution of the Forms/Intake slice promotes an eligibility-logic edit into the I-012 set (e.g., if eligibility logic gates a `protocol_authorized_prescribing` decision, the eligibility edit itself remains Cat B governance, not Cat A — but the dependency relationship may warrant explicit cross-reference in the §13.7 normative wording).]

## Audit-envelope shape preservation

Ratification is **purely additive**: it adds 26 new strings to the `action` enum (31 placeholders − 5 already-ratified preserved strings) and does **not** modify the AUDIT_EVENTS v5.2 envelope shape. Specifically:

- No new envelope fields are added.
- No existing field semantics change (`tenant_id` requirement preserved per I-027; `actor_type`/`actor_id`/`target_patient_id` preserved; `detail` payload remains action-specific).
- No `audit_records` table schema migration is required — the column types (`action TEXT`, `category CHAR(1)`, `audit_sensitivity_level TEXT`) already accommodate the proposed strings.
- The hash-chain trigger (`record_hash = SHA-256(<envelope-minus-hash_chain>)`) is unaffected — it hashes the rendered string verbatim.
- I-003 (audit append-only / chain integrity) is preserved.
- I-027 (tenant_id required) is preserved.
- I-016 (immutability) is preserved.
- I-031 (high_pii audit class) is unaffected — none of the 31 proposed IDs are research export events; all carry `audit_sensitivity_level = standard`.

## Cross-cutting downstream impact

On ratification, engineering performs three lockstep edits in the `telecheck-app` repo:

1. **Replace placeholder cast helpers.** Remove `formsIntakeAuditPlaceholder()`, `identityAuditPlaceholder()`, `consentAuditPlaceholder()` cast sites in `src/modules/{forms-intake,identity,consent}/audit.ts`. Update `lib/audit.ts` `AuditAction` union to include the ratified strings.

2. **Update slice emitter call sites.** Each `txCallback` audit emission updates from the placeholder string to the canonical string per the tables above. Mechanical rename for the 26 net-new IDs; no-op for the 5 preserved IDs.

3. **Update test predicate matchers.** `tests/integration/consent-audit-chain.test.ts §1b` asserts on the 8 distinct consent action strings; this assertion updates to the canonical strings in lockstep. Equivalent updates in the forms-intake and identity test suites.

The audit hash chain in existing test fixtures is **invalidated** by the rename (the record_hash includes the action string). Engineering re-seeds the fixture data using the canonical strings; the chain-walker (`assertAuditChainIntact`) re-validates from genesis. Production data is unaffected because no production rows exist yet at v1.0 launch.

**Bounded blast radius:** 3 slice cast sites + 1 central type definition + ~3 test files. Mass-rename complete in one engineering PR.

**Forcing function for future slices:** SI-002's resolution discipline establishes the precedent that future slice audit IDs (Pharmacy, Med Interaction, Subscription, Sync Video, Async Consult, Labs, Adverse Event, RPM/CCM, etc. — per SI-002 §"Companion code-repo state at SI-002 raise" estimating ~80-100 placeholder IDs at v1.0 launch) follow the same SI-route-then-ratify cycle. Each future slice's placeholder count rolls into a subsequent AUDIT_EVENTS amendment cycle (v5.3, v5.4, etc.) rather than fragmenting into per-slice escalations.

## Promotion ledger entry proposal

**Proposed entry: P-012.**

- **From-version:** AUDIT_EVENTS v5.2
- **To-version (recommended path):** **Amend v5.2 in place** with a doc-control entry dated 2026-05-XX (Evans's ratification date), rather than bumping to v5.3. Rationale: this is a purely-additive amendment, no behavior changes for existing IDs, no migration. The v5.2 doc-control history (`2026-05-02 per v1.10.1 hygiene cycle physical merge`) already established the pattern of additive v5.2 amendments without a version bump. Alternative path: bump to v5.3 if Privacy/Compliance prefers a clean version marker for the 26 new IDs; this requires the Artifact Registry v2.10 → v2.11 cascade and a Contracts Pack v5.2 → v5.3 cross-reference sweep across 11 amended files. [NEEDS RATIFICATION: choose amend-in-place vs version-bump path. Recommendation: amend in place — lowest cascade cost, matches v1.10.1 hygiene precedent.]
- **Additions list:** 26 new Category A/B/C action IDs across 3 slices (13 forms + 8 identity + 5 consent/delegation; the 5 already-ratified preserved IDs are not "added", they are confirmations).
- **Removals list:** none.
- **Modifications list:** none (existing IDs preserved literally, including `consent_granted`, `consent_revoked`, `delegation_revoked`, `forms_eligibility_logic_edited`, `forms_approval_governance_edited`).
- **Breaking changes:** none (purely additive enum addition; no envelope shape changes; no migration; no actor-type changes).
- **Successor SI candidates:** SI-003 (next slice batch, anticipated Pharmacy + Med Interaction at ~15-20 placeholder IDs), SI-004 (Subscription + Sync Video), etc. — each follows the same closure cycle pattern established by P-011 (SI-001 MedicationRequest) and P-012 (SI-002 this artifact).
- **Engineering follow-on:** The `telecheck-app` repo PR replacing placeholders with canonical strings lands as a follow-on commit referencing P-012 in its commit message body.

[NEEDS RATIFICATION: Evans's signature on the P-012 entry + commitment to the amend-in-place vs version-bump path.]

## Spec references

- **AUDIT_EVENTS v5.2** — envelope shape, category-prefixed naming convention, hash-chain rules, Category A/B/C retention/access matrix. `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md`.
- **INVARIANTS v5.2** — I-003 (audit append-only), I-012 (prescribing reject-unless three-clause rule), I-016 (immutability), I-023 (tenant isolation), I-027 (tenant_id required on audit), I-031 (high_pii audit class). `Telecheck_Contracts_Pack_v5_00_INVARIANTS.md`.
- **GLOSSARY v5.2** — `medication_request` not `prescription`; canonical actor types. `Telecheck_Contracts_Pack_v5_00_GLOSSARY.md`.
- **Forms Engine v2.1** §3, §6, §13 — Forms/Intake slice lifecycle events referenced in SI-002.
- **Identity Spec v1.0** §3.1, §3.2, §3.3, §3.4 — Identity slice lifecycle events referenced in SI-002.
- **Consent + Delegated Access Slice PRD v1.0** §6.1, §6.2, §7.1, §10 — Consent slice lifecycle events referenced in SI-002.
- **Async Consult Slice PRD v1.0** — referenced in input scoping but no async-consult placeholder IDs were emitted by the three implementation-complete slices (SI-002 §"Companion code-repo state" enumerates Forms-Intake + Identity + Consent only). No async-consult IDs in this artifact's scope.
- **EHBG v1.3 §12** — SI/DSI escalation pattern that produced SI-002 and authorizes this DRAFT closure artifact.
- **Promotion Ledger** — P-008 (v1.10 promotion), P-009 (v1.10.1 hygiene), P-011 (SI-001 anticipated), P-012 (this artifact's proposed entry). `Telecheck_Promotion_Ledger.md` (append-only).

---

**End of DRAFT.** Evans's ratification path: review tables above → confirm naming convention + category assignments + 4 `[NEEDS RATIFICATION]` markers → promote into AUDIT_EVENTS v5.2 doc-control history (amend in place) → append P-012 to Promotion Ledger → engineering PR removes placeholder cast sites in lockstep.
