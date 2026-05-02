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

**Required for activation to CCR `research_data_partnership_active = active`:**

Populate CCR `research_ethics_review_body` structured object (per CCR_RUNTIME v5.2 research block):

- `name`: TBD (GHS REC or Noguchi Memorial Institute IRB selected)
- `jurisdiction`: GH
- `approval_reference_id`: TBD (ethics body's approval reference for the partnership)
- `approval_validity_from`: TBD
- `approval_validity_to`: TBD
- `approval_scope`: TBD (scope of ethical approval; what types of research data flows are sanctioned)
- `per_dsa_review_required`: TBD (whether each DSA requires separate REC/IRB review)

### Future markets

When the platform adds support for a new country per Country Addition Workflow, the analogous REC/IRB body for that country is identified and added here:

- **Nigeria** — National Health Research Ethics Committee (NHREC) candidate; institutional IRBs (e.g., IRBs at major Nigerian teaching hospitals) as alternative
- **Kenya** — KEMRI Scientific and Ethics Review Committee (SERC) candidate; institutional IRBs as alternative
- **South Africa** — Provincial RECs + national HPCSA framework; institutional IRBs as alternative

Each future market REC/IRB partnership is added when the corresponding country's `consent_only` → `active` activation engages.

---

## Activation gate (per ADR-028 v1.0 + Phase 3 group-3 MARKET_LAUNCH research activation gate)

The `consent_only` → `active` transition for any country requires:

1. CCR `research_ethics_review_body` populated with all required sub-fields above
2. `approval_validity_to >= now` at activation time
3. REC concurrence per `per_dsa_review_required` if applicable
4. `research.dsa_activated` audit event emitted upon DSA activation (Category B per AUDIT_EVENTS v5.2 §5)

---

## Engagement protocol

Each market's REC/IRB engagement follows:

1. **Identify** — Privacy Officer + tenant operator team identify the appropriate REC/IRB body for the market
2. **Engage** — Initial contact, scope discussion, materials submission (consent text per Master PRD §24 row 12; DSA template per Master PRD §24 row 13; partnership scope per ADR-028 Decision §1)
3. **Review** — REC/IRB reviews materials; provides approval reference + validity period + scope + per-DSA review requirements
4. **Document** — Populate CCR `research_ethics_review_body` structured object; record this document with the partnership designation
5. **Activate** — Country transitions from `consent_only` to `active` per MARKET_LAUNCH v5.1 research activation gate

---

## Document control

- **v1.0 hygiene cycle verification — 2026-05-02 (per v1.10.1 hygiene cycle physical merge of Phase5 delta Group 5F row 107):** Verified that the v1.0 Phase 6 placeholder (below) references the originating ADR (ADR-028 v0.5/v1.0 Activation requirements §2) and matches Master PRD §24 row 11 (REC partnership designation pre-launch decision). No body edits required at this verification pass — content already complete from Phase 6 promotion ceremony 2026-05-01.
- **v1.0 — 2026-05-01** — Placeholder authored at Phase 6 promotion ceremony per ADR-028 Activation requirements §2 + Phase 5 group 5F row 107. Minimal content at v1.10 acceptance; populated per per-country activation gate.
- **Status:** canonical placeholder. Updates appended (not edited) when per-country REC/IRB partnerships are designated.
