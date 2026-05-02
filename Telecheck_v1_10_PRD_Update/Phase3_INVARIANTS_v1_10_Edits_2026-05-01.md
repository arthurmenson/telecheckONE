# Phase 3 — INVARIANTS contract v1.10 edits

**Version:** 1.0 RECONCILED — proposed delta to canonical `Telecheck_Contracts_Pack_v5_00_INVARIANTS.md` v5.1
**Date:** 2026-05-01
**Reconciliation owner:** Workstream lead (Evans) via Claude proxy
**Approval owner (audit-B):** Engineering Lead + Clinical Safety Officer + Privacy Officer (per I-015 dual-control for invariant additions)
**Purpose:** Reconcile v1.10 cycle invariants (I-029, I-030, I-031) against canonical Master PRD v1.10 §15.3 + ADR-028 v0.4. Output is the proposed Phase 3 contribution; lands in `Telecheck_Contracts_Pack_v5_00_INVARIANTS.md` (renumbered to v5.2 on Phase 6 promotion) when v1.10 promotes.

**Cycle source:** v1.5 hotfix renumbered the original I-024/I-025/I-026 (which collided with existing canonical IDs) to **I-029, I-030, I-031**. This delta uses the renumbered IDs.

**Note on additive discipline:** Per the canonical contract document control rule "Invariants are not removed; existing numbers never change." I-001 through I-028 are preserved unchanged. v1.10 adds three new invariants (I-029, I-030, I-031) at the next available numbers. No existing invariants modified or removed.

---

## Edits

Insert **after** existing I-028 (Single physical region, single database, single schema) and **before** the "Operating with the invariants" section.

### I-029 · Research data export requires active DSA + active research consent + k-anonymity threshold met

Every research data export from the platform to a research partner requires, at minimum, ALL of the following to be present and valid at export time:

1. An **active Data Sharing Agreement (DSA)** with the receiving partner, with `dsa_status = active`, `dsa_validity_to >= now`, and the export's data classes matching the DSA's `permitted_data_domains` enum (a closed enum: `chronic_disease_longitudinal`, `ncd_surveillance`, `pharmacovigilance_signal`, `population_health_aggregate` — expansion of the enum requires ADR amendment per ADR-028 Decision §6).
2. **Active research data-use consent** (the 5th consent tier per Master PRD §15.2) for every patient whose data contributes to the export cohort. Patients who have revoked consent at any time before the export are excluded from that export. Consent revocation is asymmetric on retraction per §15.2 — already-shared aggregate data cannot be retracted.
3. A **k-anonymity threshold ≥ k_min** met across the de-identified output, where `k_min` defaults to 11 per Master PRD §15.3 and CCR `de_identification_standard` enum. Per-DSA increases above `k_min` are permitted (e.g., `k = 20` for high-sensitivity domains); decreases below `k_min` are prohibited under this invariant. Cohort cells with `count < k_min` are suppressed in aggregation outputs (not silently merged).

State machine validation MUST reject any **successful** export — i.e., the domain event `research_export.delivered` MUST NOT emit, the export artifact MUST NOT leave the platform, and the partner MUST NOT receive data — when any of the three conditions is unmet. The validator returns a structured error identifying which condition failed.

**Audit-side requirement (mirrors AUDIT_EVENTS v5.2 §5 + GOVERNANCE_CONTROLS v5.2 incident discipline):** Even when delivery is rejected, the audit chain MUST capture the failed-completion attempt transparently. The audit event `research.export_completed` MAY emit with `status = invalidated`, the violated state recorded in payload (e.g., `dsa_status_at_export = expired`, `permitted_data_domains_at_export` showing drift, `k_threshold_actual < k_min_required`), and a concurrent `signal_enforcement_trigger` Category B audit capturing the enforcement action (artifact destruction, partner notification, engineering review trigger). Bare suppression of the completion-attempt audit (no record at all) is forbidden — silent invalidation is an audit gap per I-003.

Therefore: I-029's gate on the **domain-side delivery** (`research_export.delivered` event + actual export to partner) is reject-on-failure; the **audit-side completion-attempt** (`research.export_completed` event in the immutable audit chain) may emit with `status = invalidated` to record the failure transparently.

**Why:** Research exports of longitudinal health data carry combination-attack re-identification risk and trigger DSA-bound third-party data flows. Three independent gates (legal authorization, patient authorization, statistical re-identification protection) ensure that no single misconfiguration produces a problematic export.

---

### I-030 · Research consent declination has zero impact on care delivery

A patient's decision to decline or revoke the research data-use consent (5th tier per Master PRD §15.2) MUST NOT cause any change in care delivery, clinician availability, medication access, intake flow gating, treatment options, escalation pathways, surface visibility, copy variation, or any other care-touching surface. The consenting cohort and the non-consenting cohort receive identical care.

The platform's consent infrastructure MUST NOT branch any care-delivery decision on `research_consent_status`. Audit retrieval and operational reporting MAY differentiate the cohorts for research-export-pipeline purposes (cohort definition, k-threshold computation), but no patient-facing surface is influenced.

State machine and policy validation MUST reject any care-delivery rule (`Eligibility`, `BranchingLogic`, `Approval`, RBAC scope) whose evaluation depends on `research_consent_status`. Such a dependency is a code-review-blocking violation per the same discipline as I-009 (no hardcoded country assumptions).

**Why:** Coercive consent — where declining research causes care reduction — is the failure mode that destroys trust in optional data partnerships. The technical guarantee that no care path can branch on research consent makes the patient-facing copy ("you can decline this and still receive full care") truthful at the architectural level, not just by policy.

---

### I-031 · Research data export is fully audited at high-sensitivity audit class

Every research data export emits an immutable audit record at `audit_sensitivity_level: high_pii` (not the ordinary Category B governance class) capturing:

- Cohort definition reference (`cohort_definition_id`, `cohort_version`)
- The actual k-anonymity threshold used in the export (`k_threshold_actual`), which MUST be ≥ `k_min` per I-029
- Requester identity (`requester_id`, `requester_partner_id`, `requester_role`)
- Active DSA reference (`dsa_id`, `dsa_version`)
- The exported field set (`exported_field_set` — the schema fragment of fields included in the export, not the values themselves)
- Timestamp, retention class, and the audit chain hash linkage per I-003

The audit chain MUST be queryable by ethics review boards, regulators, and the receiving partner organization (subject to tenant isolation per I-023..I-027) for export verification, integrity confirmation, and consent-revocation reconciliation.

**Why:** Research data exports are the platform's most consequential data flow — once a de-identified cohort leaves the platform under a DSA, the platform cannot recall it. The ordinary governance audit class does not provide sufficient retention, access discipline, or query surface for this flow. The high-sensitivity audit class formalizes the elevated treatment.

---

## Cross-references updated

The following cross-references in the §13.4 Master PRD platform floor mapping table do not change for I-029–I-031 (the new invariants do not appear in the §13.4 floor — they govern research data partnerships, not the clinical-safety platform floor). The existing mapping rows are preserved unchanged.

The "Adding a new invariant" section is preserved unchanged. I-029, I-030, I-031 followed the prescribed process: authored 2026-04-29 (planning freeze v1.3 §3.7); reviewed by Engineering Lead + Clinical Safety Officer + Privacy Officer audit-B sign-off; impact assessment in `Codex_ADR_027_028_*.md` review series; ID collision resolved via v1.5 hotfix (originally numbered I-024..I-026, renumbered to I-029..I-031 per Codex pre-acceptance review HIGH-1).

---

## Document control update for INVARIANTS contract

**Add as the most-recent v5.2 entry in §Document control (after the v5.1 ADR-026 refresh):**

> - **v5.2 (refreshed 2026-XX-XX per v1.10 promotion)** — Adds I-029 (Research data export gates: active DSA + active research consent + k-anonymity ≥ k_min), I-030 (Research consent declination has zero impact on care), I-031 (Research data export at high-sensitivity audit class). Per ADR-028 (Research data partnership Posture A as Release 2 goal). No existing invariants modified or removed; v5.2 is purely additive. ID numbering: planning freeze v1.3 originally proposed I-024..I-026 for these; v1.5 hotfix renumbered to I-029..I-031 per Codex pre-acceptance HIGH-1 (ID collision with existing canonical I-024 cross-tenant break-glass, I-025 information-leak prevention, I-026 tenant configuration governance, I-027 audit envelope, I-028 single physical region).

---

## Document control (this delta artifact)

- **v1.0 — 2026-05-01** — Phase 3 reconciliation against canonical Master PRD v1.10 §15.3 + ADR-028 v0.4. Three new invariants (I-029, I-030, I-031) authored as additive delta to canonical INVARIANTS v5.1.
- **Status:** RECONCILED — proposed Phase 3 contribution. Awaiting Codex Phase 3 group-1 review (alongside AUDIT_EVENTS, WORKLOAD_TAXONOMY, AUTONOMY_LEVELS deltas).
- **Lands canonically:** `Telecheck_Contracts_Pack_v5_00_INVARIANTS.md` v5.2 at Phase 6 promotion.
