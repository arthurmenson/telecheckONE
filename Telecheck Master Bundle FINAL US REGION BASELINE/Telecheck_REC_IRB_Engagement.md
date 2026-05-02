# Telecheck — REC / IRB Engagement

**Version:** 1.0 (placeholder — minimal content at v1.10 acceptance; populated per per-country activation gate)
**Status:** canonical — Phase 6 promoted 2026-05-01 per Evans's "authorized" instruction
**Owner:** Privacy Officer + Telecheck-{country} tenant operator team (per market)
**Companion documents:** ADR-028 v1.0 (Research Data Partnership Posture A); Master PRD v1.10 §15.3 + §22; CCR_RUNTIME contract v5.2 research block (`research_ethics_review_body` structured object)
**Format:** Markdown

---

## Purpose

This document records Research Ethics Committee (REC) / Institutional Review Board (IRB) partnership designations for each market where the platform's research data partnership Posture A activates. Per ADR-028 v1.0 Activation requirements §2, REC/IRB partnership is designated pre-launch per Master PRD §24 row 11; engagement at per-country activation gate.

REC/IRB partnership is an **external oversight body** that reviews and approves research data partnership activations under ethics review. It is distinct from internal governance (Privacy Officer, Regulatory Affairs Lead, Clinical Safety Officer, Product Lead — the ADR-028 quad sign-off chain).

---

## Per-country REC/IRB partnership

### Ghana (Telecheck-Ghana, Heros Health Ghana DBA)

**Candidate REC partners (per ADR-028 v1.0 + Master PRD §24 row 11):**

- **Ghana Health Service (GHS) REC** — Ghana's primary research ethics review body
- **Noguchi Memorial Institute IRB** — Established medical research IRB at the University of Ghana

**Status at v1.10 launch:** Pending pre-launch decision per Master PRD §24 row 11 (REC partnership designation — Ghana). Owner: Privacy Officer + Telecheck-Ghana team.

**Required for activation to CCR `research_data_partnership_active = consent_only` (Stage 1):**

*(Section split into Stage 1 and Stage 2 duties 2026-05-02 per Codex Round-8 Scope 3 HIGH-2 finding aligning with the Round-7 patch that introduced explicit Stage 1 + Stage 2 gates at MARKET_LAUNCH v5.1. Was previously stating REC body population only as a `consent_only → active` concern (Stage 2); now correctly identified as an `inactive → consent_only` precondition (Stage 1) per the canonical 6-condition Stage 1 gate. The 7 sub-fields below are required for Stage 1; Stage 2 adds REC concurrence per `per_dsa_review_required` and per-DSA review where applicable.)*

Populate CCR `research_ethics_review_body` structured object (all 7 sub-fields required at Stage 1 — per CCR_RUNTIME v5.2 research block + runtime validator rule strengthened 2026-05-02):

- `name`: TBD (GHS REC or Noguchi Memorial Institute IRB selected)
- `jurisdiction`: GH
- `approval_reference_id`: TBD (ethics body's approval reference for the partnership; binds to the consent text version pin per CCR_RUNTIME v5.2)
- `approval_validity_from`: TBD
- `approval_validity_to`: TBD (must be `>= now` at any future Stage 1 activation review)
- `approval_scope`: TBD (scope of ethical approval; what types of research data flows are sanctioned)
- `per_dsa_review_required`: TBD (whether each DSA requires separate REC/IRB review — drives Stage 2 REC concurrence requirement)

When all 7 sub-fields are populated AND ethics-reviewed consent text version pin is in place AND audit emission paths are operational AND Forms Engine I-030 static validation passes AND CCR runtime validator is live AND Country Launch Director sign-off is recorded → the country can transition from `inactive` to `consent_only` per MARKET_LAUNCH v5.1 Stage 1 6-condition gate.

**Required for activation to CCR `research_data_partnership_active = active` (Stage 2):**

Stage 1 is a precondition. Stage 2 additionally requires:

- Signed `DataSharingAgreement` (per TYPES v5.2)
- `research_export_authorized_signers` roster populated
- `research_export_k_anonymity_minimum` configured (≥ k_min_default = 11)
- ADR-028 v0.4 quad sign-off (Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer + Product Lead)
- REC concurrence per `research_ethics_review_body.per_dsa_review_required` when applicable (per-DSA review)
- Country Launch Director per-country activation authority
- The full 11-condition MARKET_LAUNCH v5.1 Stage 2 research data partnership activation gate (which inherits the 6 Stage 1 conditions as preconditions)

### Future markets

When the platform adds support for a new country per Country Addition Workflow, the analogous REC/IRB body for that country is identified and added here:

- **Nigeria** — National Health Research Ethics Committee (NHREC) candidate; institutional IRBs (e.g., IRBs at major Nigerian teaching hospitals) as alternative
- **Kenya** — KEMRI Scientific and Ethics Review Committee (SERC) candidate; institutional IRBs as alternative
- **South Africa** — Provincial RECs + national HPCSA framework; institutional IRBs as alternative

Each future market REC/IRB partnership is **added before the corresponding country's `inactive → consent_only` activation engages** (Stage 1 precondition per MARKET_LAUNCH v5.1; *updated 2026-05-02 per Codex Round-9 Scope 3 MEDIUM-1 finding aligning with the Round-7/Round-8 patches that introduced explicit Stage 1 gating — was previously deferred to `consent_only → active` (Stage 2), which contradicted the Stage 1 condition 1 requirement that all 7 `research_ethics_review_body` sub-fields be populated before consent collection begins*). Per-DSA REC concurrence is then a separate Stage 2 (`consent_only → active`) requirement when `per_dsa_review_required = true`.

---

## Activation gates (two-stage, per MARKET_LAUNCH v5.1 Stage 1 + Stage 2; updated 2026-05-02 per Codex Round-8 Scope 3 HIGH-2 finding)

### Stage 1: `inactive → consent_only` activation gate (6 conditions)

The default state at v1.0 launch is `inactive`. The `inactive → consent_only` transition requires:

1. CCR `research_ethics_review_body` populated with all 7 required sub-fields above (REC partnership designated)
2. Ethics-reviewed consent text version pin in place at the platform consent module (per `approval_reference_id`)
3. `research.consent_granted` and `research.consent_revoked` audit emission paths operational
4. Forms Engine static analysis at form-version-publish time rejects all 6 categories of dependency on `research_consent_status` per FORMS_ENGINE v5.2 I-030 enforcement, for every form in the country
5. CCR runtime validator (rejects `consent_only` transitions when any of the 7 `research_ethics_review_body` sub-fields is null) deployed and live
6. Country Launch Director sign-off for the per-country `inactive → consent_only` transition

### Stage 2: `consent_only → active` activation gate (per ADR-028 v1.0 + MARKET_LAUNCH v5.1 Stage 2 11-condition gate)

Stage 1 is a precondition (the 6 Stage 1 conditions remain valid). Stage 2 additionally requires:

1. `approval_validity_to >= now` at activation time (re-checked at Stage 2)
2. REC concurrence per `per_dsa_review_required` if applicable (per-DSA review)
3. `research.dsa_activated` audit event emitted upon DSA activation (Category B per AUDIT_EVENTS v5.2 §5)
4. ADR-028 v0.4 quad sign-off (Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer + Product Lead)
5. Country Launch Director per-country activation authority
6. The remaining MARKET_LAUNCH v5.1 Stage 2 11-condition gate elements (DSA active + permitted-domain subset + k_min hierarchy + 5th consent tier deployment verified + de-identification engine readiness + audit pipeline at high_pii)

---

## Engagement protocol (two-step workflow per Round-9 Scope 3 MEDIUM patch 2026-05-02)

Each market's REC/IRB engagement follows two distinct steps mapped to the two-stage activation gates:

### Step 1 — REC/IRB designation + Stage 1 prerequisites (BEFORE `inactive → consent_only`)

1. **Identify** — Privacy Officer + tenant operator team identify the appropriate REC/IRB body for the market
2. **Engage** — Initial contact, scope discussion, materials submission (consent text per Master PRD §24 row 12; DSA template per Master PRD §24 row 13; partnership scope per ADR-028 Decision §1)
3. **Review** — REC/IRB reviews materials; provides approval reference + validity period + scope + per-DSA review requirements
4. **Document Stage 1 evidence** — Populate CCR `research_ethics_review_body` structured object with all 7 sub-fields; record this document with the partnership designation; ethics-reviewed consent text version pin in place at platform consent module
5. **Stage 1 activation** — Country transitions from `inactive` to `consent_only` per MARKET_LAUNCH v5.1 Stage 1 6-condition gate (REC populated + consent text pin + audit emission readiness + Forms Engine I-030 static validation + CCR runtime validator readiness + Country Launch Director sign-off). The 5th-tier consent prompt now renders; `research.consent_granted` and `research.consent_revoked` events accrue.

### Step 2 — Per-DSA REC concurrence + Stage 2 activation (BEFORE `consent_only → active`)

6. **Per-DSA REC concurrence** — For each prospective DSA, if `per_dsa_review_required = true` per Step 1, the REC/IRB conducts per-DSA review and provides concurrence
7. **Stage 2 activation** — Country transitions from `consent_only` to `active` per MARKET_LAUNCH v5.1 Stage 2 11-condition gate (DSA active + ADR-028 v0.4 quad sign-off + Country Launch Director + the remaining Stage 2 elements). Export pipeline now operates.

---

## Document control

- **v1.0 hygiene cycle verification — 2026-05-02 (per v1.10.1 hygiene cycle physical merge of Phase5 delta Group 5F row 107):** Verified that the v1.0 Phase 6 placeholder (below) references the originating ADR (ADR-028 v0.5/v1.0 Activation requirements §2) and matches Master PRD §24 row 11 (REC partnership designation pre-launch decision). No body edits required at this verification pass — content already complete from Phase 6 promotion ceremony 2026-05-01.
- **v1.0 — 2026-05-01** — Placeholder authored at Phase 6 promotion ceremony per ADR-028 Activation requirements §2 + Phase 5 group 5F row 107. Minimal content at v1.10 acceptance; populated per per-country activation gate.
- **Status:** canonical placeholder. Updates appended (not edited) when per-country REC/IRB partnerships are designated.
