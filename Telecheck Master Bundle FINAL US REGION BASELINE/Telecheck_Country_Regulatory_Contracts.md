# Telecheck — Country Regulatory Contracts

**Version:** 1.0 (placeholder — minimal content at v1.10 acceptance; populated per per-country activation gate)
**Status:** canonical — Phase 6 promoted 2026-05-01 per Evans's "authorized" instruction
**Owner:** Regulatory Affairs Lead + Privacy Officer
**Companion documents:** ADR-027 (Country-Conditional DTC Marketing Posture); Master PRD v1.10 §13.2; CCR_RUNTIME contract v5.2 marketing block
**Format:** Markdown

---

## Purpose

This document records the country regulatory contract evidence referenced in ADR-027 v0.6 Tier 2 activation requirements (`marketing_copy_governance_evidence` structured object population). Per ADR-027 Decision §1, the CCR `molecule_level_marketing_permitted` 3-state enum (`prohibited` / `pending_evidence` / `permitted`) gates molecule-level marketing surfaces; transition to `permitted` requires a documented country regulatory contract.

This is a placeholder document at v1.10 acceptance. Per-country evidence is populated at the per-country activation gate via the structured `marketing_copy_governance_evidence` CCR object (per CCR_RUNTIME v5.2 marketing block) and recorded here as historical documentation.

---

## Per-country evidence

### United States (Telecheck-US, Heros Health DBA)

**State:** `molecule_level_marketing_permitted = prohibited` (permanent)

**Rationale:** US FDA DTC fair-balance rules + state telehealth advertising restrictions prohibit molecule-level direct-to-consumer prescription marketing without an established clinician relationship. No regulatory contract is required because no Tier 2 activation is contemplated for the US tenant.

**Status:** Not applicable — US tenant operates program-level marketing surfaces only per Master PRD §13.2 Decision §2.

### Ghana (Telecheck-Ghana, Heros Health Ghana DBA)

**State at v1.10 launch:** `molecule_level_marketing_permitted = pending_evidence`

**Rationale:** Regulatory engagement underway; molecule-level surfaces remain disabled by fail-closed default per ADR-027 Decision §2 + CCR_RUNTIME v5.2 marketing block.

**Required for activation to `permitted` state (per ADR-027 Tier 2 §1, populated via CCR `marketing_copy_governance_evidence` structured object):**

- `regulatory_jurisdiction`: TBD (Ghana FDA jurisdiction expected)
- `regulatory_authority`: TBD (Ghana Food and Drugs Authority expected)
- `regulatory_interpretation_artifact_id`: TBD — pending Ghana FDA + Pharmacy Council guidance review evidence
- `interpretation_date`: TBD
- `scope`: TBD — scope of permitted molecule-level marketing per Ghana FDA / Pharmacy Council interpretation
- `prohibited_claim_classes[]`: TBD — claim taxonomy classes that remain prohibited
- `governance_lead_designation_artifact_id`: TBD — Marketing copy governance lead designation per Master PRD §24 row 16
- `ethics_review_concurrence_artifact_id`: optional, populated if local jurisdiction requires

**Status:** Pending pre-launch decision per Master PRD §24 row 16 (Marketing copy governance lead designation) + row 17 (First molecule-level marketing copy approval — Ghana) + row 18 (CCR marketing key initial values per country).

### Future markets

When the platform adds support for a new country (e.g., Nigeria, Kenya, South Africa) per Country Addition Workflow (CCR_RUNTIME v5.2 §Country addition workflow), the regulatory engagement evidence is added here as a new entry. Each future market entry follows the same structured-evidence pattern.

---

## Activation gate (per ADR-027 Tier 2)

The `pending_evidence` → `permitted` transition requires:

1. All required `marketing_copy_governance_evidence` sub-fields populated (per CCR_RUNTIME v5.2 marketing block runtime validator)
2. First molecule-level marketing copy approved through Master PRD §13.2 Governance review process (triple sign-off: Marketing copy governance lead + Clinical Safety Officer + Regulatory Affairs Lead)
3. Country Launch Director activation sign-off per Market Launch contract v5.1
4. AUDIT_EVENTS v5.2 `marketing.surface_rendered` and `marketing.surface_drift` event emission paths operational
5. Tier-2 regulatory evidence present (this document populated for the country)

---

## Document control

- **v1.0 hygiene cycle verification — 2026-05-02 (per v1.10.1 hygiene cycle physical merge of Phase5 delta Group 5F row 104):** Verified that the v1.0 Phase 6 placeholder (below) references the originating ADR (ADR-027 v0.6 Tier 2 activation requirements) and the matching pre-launch decision row (Master PRD §24 row 16/17/18). No body edits required at this verification pass — content already complete from Phase 6 promotion ceremony 2026-05-01.
- **v1.0 — 2026-05-01** — Placeholder authored at Phase 6 promotion ceremony per ADR-027 Tier 2 activation requirements + Phase 5 group 5F row 104. Minimal content at v1.10 acceptance; populated per per-country activation gate.
- **Status:** canonical placeholder. Updates appended (not edited) when per-country activation evidence becomes available.
