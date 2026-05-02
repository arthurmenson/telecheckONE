# Telecheck — Data Sharing Agreement (DSA) Template

**Version:** 1.0 (placeholder — minimal content at v1.10 acceptance; legal-reviewed pre-launch per Master PRD §24 row 13; first DSA activation post-Release 2)
**Status:** canonical — Phase 6 promoted 2026-05-01 per Evans's "authorized" instruction
**Owner:** Legal + Privacy Officer
**Companion documents:** ADR-028 v1.0 (Research Data Partnership Posture A); Master PRD v1.10 §15.3; CCR_RUNTIME contract v5.2 research block; TYPES contract v5.2 DataSharingAgreement entity
**Format:** Markdown

---

## Purpose

This document is the platform-level template for Data Sharing Agreements (DSAs) between Telecheck-the-parent and external research partners (multilateral bodies like WHO/UN agencies, academic research consortia, population-health authorities). Per ADR-028 v1.0 Activation requirements §4, the DSA template is legal-reviewed pre-launch per Master PRD §24 row 13; first DSA activation lands at Release 2.

The DSA template defines the structure each partnership must satisfy; specific DSA instances (per partner, per scope) are recorded as `DataSharingAgreement` entity records (per TYPES v5.2) with cross-reference to this template.

---

## Required DSA structure (per ADR-028 v1.0 + INVARIANTS contract v5.2 I-029)

Every DSA MUST include:

1. **`partner_id`, `partner_name`** — The research partner organization
2. **`tenant_scope`** — Set of operating tenants (operating tenants per `Telecheck-{country}` naming) whose data may contribute to exports under this DSA. Per Master PRD §15.3 partnership-level rule, the partnership is anchored at the Telecheck parent / platform level; tenant scope identifies which operating tenants' data flows under this specific agreement.
3. **`permitted_data_domains`** — Subset of the closed enum (`chronic_disease_longitudinal`, `ncd_surveillance`, `pharmacovigilance_signal`, `population_health_aggregate`) per ADR-028 Decision §6. Per-DSA selection MUST be a subset of CCR `research_permitted_data_domains` for each tenant in scope (DSA cannot exceed country domain scope per Phase 3 group-2 HIGH-1 + INVARIANTS v5.2 I-029).
4. **`k_min_required`** — k-anonymity threshold required for this DSA's exports. Default 11 per CCR `k_min_default`; per-DSA increases permitted (e.g., k=20 for high-sensitivity domains); decreases below `k_min_default` prohibited per I-029.
5. **`ethics_review_body_reference`** — REC/IRB partnership designation per ADR-028 Activation requirements §2 + CCR `research_ethics_review_body` structured object.
6. **`cross_border_transfer_mechanism`** — Per CCR `cross_border_research_transfer_permitted` enum + companion `cross_border_research_transfer_evidence` structured object.
7. **`validity_from`, `validity_to`** — DSA validity period; expiry halts the export pipeline for this partner per I-029.
8. **`approval_chain`** — Per ADR-028 v1.0 quad sign-off (Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer + Product Lead) + partner organization sign + REC concurrence per `per_dsa_review_required`.
9. **Permitted uses** — Specific enumerated uses; secondary uses outside DSA scope are explicitly forbidden per ADR-028 Posture B exclusions.
10. **Retention rules** — Partner-side retention for exported data; onward transfer policy per CCR `cross_border_research_transfer_evidence.onward_transfer_policy`.
11. **Audit obligations** — Per I-031, every research export emits at `audit_sensitivity_level = high_pii`; partner organization can verify exports against the audit chain.
12. **Termination + revocation** — DSA termination protocol; consent revocation mid-export handling per AUDIT_EVENTS v5.2 §5 + GOVERNANCE_CONTROLS v5.2 incident discipline.

---

## Posture A vs Posture B boundary

Per ADR-028 v1.0 Decision §1 + §2, every DSA MUST stay within Posture A scope. Any DSA term that would cross into Posture B (trial randomization, blinding, eCRF-style data collection, IRB-managed protocols where Telecheck is the platform, sponsor reporting, IND/IDE filings, query resolution, monitoring visits, partner-driven protocolized cohort recruitment, prospective observational studies altering care workflows, post-market studies altering prescribing, partner requests altering care workflows, patient-level identifiers in any export, secondary uses outside DSA scope) is rejected.

If a proposed DSA term crosses the bright-line into Posture B, a separate ADR superseding the relevant scope language in ADR-028 is required.

---

## Activation gate

DSA activation requires (per ADR-028 Activation requirements §4 + Phase 3 group-3 MARKET_LAUNCH research activation gate 11 conditions):

- All 12 structural fields above populated
- Quad sign-off + REC concurrence (where required) recorded
- Tenant scope's CCR `research_data_partnership_active = active` (per-country activation already complete)
- `research.dsa_activated` audit event emitted (Category B; per AUDIT_EVENTS v5.2 §5)

---

## Document control

- **v1.0 hygiene cycle verification — 2026-05-02 (per v1.10.1 hygiene cycle physical merge of Phase5 delta Group 5F row 106):** Verified that the v1.0 Phase 6 placeholder (below) references the originating ADR (ADR-028 v0.5/v1.0 Activation requirements §4) and matches Master PRD §24 row 13 (DSA template — legal-reviewed pre-launch decision). No body edits required at this verification pass — content already complete from Phase 6 promotion ceremony 2026-05-01.
- **v1.0 — 2026-05-01** — Placeholder authored at Phase 6 promotion ceremony per ADR-028 Activation requirements §4 + Phase 5 group 5F row 106. Legal-reviewed status pending pre-launch per Master PRD §24 row 13. First DSA activation post-Release 2.
- **Status:** canonical placeholder. Updates appended (not edited) when DSA template is legal-reviewed and per-DSA instances are activated.
