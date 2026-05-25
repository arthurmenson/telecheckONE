# 00 · Source of Truth

**Status:** canonical · **Version:** 5.4 · **Owner:** engineering lead · **Consumers:** everyone resolving contradictions

This document defines what is authoritative for what, and what to do when documents disagree. It also defines what is and is not authoritative for each kind of decision.

---

## Precedence hierarchy

When documents conflict, the higher-tier document governs. The lower-tier document is updated to match.

| Tier | Documents | Governs |
|---|---|---|
| 1 | Platform Invariants (`00-INVARIANTS.md`) | Non-negotiable structural guarantees. Cannot be overridden by any lower tier. |
| 2 | Architecture Decision Records (ADRs) | Consequential architectural decisions with rationale and alternatives considered. |
| 3 | Cross-cutting contracts (`00-*.md` files in this pack) | Runtime behavior contracts. Govern how the platform behaves at runtime. |
| 4 | Master Platform PRD | Product truth — what are we building, for whom, in what order, and why. |
| 5 | Slice PRDs | Per-feature workflow specifications. Must trace back to Master PRD. |
| 6 | Engineering specifications (data model, state machines, OpenAPI, architecture) | Implementation specifications. Must conform to contracts and PRDs. |
| 7 | Experience specifications (design system, IA documents) | Look, feel, and flow. Must conform to PRDs. |
| 8 | Operations specifications (playbooks, protocols, guardrails) | Operational content. Must conform to contracts. |

### Within the contracts pack

Cross-cutting contracts have internal precedence:
1. `00-INVARIANTS.md` — the floor beneath everything
2. `00-SOURCE-OF-TRUTH.md` — this document; resolves contradictions
3. `00-GLOSSARY.md` — vocabulary governs naming in all other contracts
4. All other `00-*.md` files — peer-level; when two peer contracts conflict, flag for resolution rather than choosing

---

## Cross-cutting contract responsibilities

| Contract | Authoritative for |
|---|---|
| `00-INVARIANTS.md` | Platform-level non-negotiable guarantees |
| `00-GLOSSARY.md` | Vocabulary, term definitions |
| `00-SOURCE-OF-TRUTH.md` | Precedence and conflict resolution |
| `00-DOMAIN-EVENTS.md` | Event envelope, naming, catalog, aggregate partitioning |
| `00-ERROR-MODEL.md` | Error envelope, codes, HTTP mapping, locale |
| `00-AUDIT-EVENTS.md` | Audit schema, safety matrix, hash chain, patient self-access |
| `00-IDEMPOTENCY.md` | Idempotency keys, terminal states, reconciliation |
| `00-CCR-RUNTIME.md` | Country configuration, five country concepts, resolution |
| `00-AI-LAYERING.md` | Two-mode AI architecture, guardrail templates, protocol execution, calibration |
| `00-FORMS-ENGINE.md` | Forms Engine four-layer separation, intake lifecycle, provider feedback, patient visibility |
| `00-MARKET-LAUNCH.md` | **Sole authority for program offerability per I-020.** ProgramMarketPolicy, seven launch gates, governed market launch workflow. |
| `00-TYPES.md` | Complex type definitions referenced by other contracts |
| `00-GOVERNANCE-CONTROLS.md` | Configuration validation, incident response, safety-signal enforcement |

---

## Offerability resolution

For any program-related action, the resolution order is:

1. **Market Launch** decides whether the program is offerable in the patient's country of care
2. If offerable: **compatibility checks** verify the required Form version, Protocol Pack version, agent version, and pricing bundle exist for that market
3. **Missing compatibility is a deployment defect.** It pages on-call and shows the patient "we're temporarily unable to offer this; we've notified our team." It does not silently block, and Forms Engine / AI Layering / Protocol Pack approval lists do not get to override Market Launch.

---

## What to do when documents conflict

1. Identify the tier of each document
2. The higher-tier document governs
3. Update the lower-tier document to match
4. If the conflict is between peer-tier documents, flag it — do not resolve silently
5. Record the resolution in the Artifact Registry

---

## Tenant configuration in the precedence hierarchy (added v5.1)

Per ADR-023 multi-tenancy Model A, tenant configuration occupies a defined position in the precedence hierarchy:

| Tier | Documents / objects | Governs |
|---|---|---|
| 1 | Platform Invariants (INVARIANTS contract) — including I-023 through I-027 tenant-isolation invariants | Non-negotiable structural guarantees. No tenant override possible. |
| 2 | ADRs (Set v1.0 + Addendum 016–019 + Addendum 020–025) | Architectural decisions. No tenant override. |
| 3 | Cross-cutting contracts (this pack) | Runtime behavior. No tenant override. |
| 3a | **CountryProfile (per CDM v1.X §4.3)** | Country-specific defaults. Platform-scoped; one per supported country. |
| 4 | Master Platform PRD | Product truth. No tenant override. |
| 5 | Slice PRDs | Per-feature workflow specs. Tenant configuration may select among options the slice exposes (e.g., which adapter, which cadence) but cannot violate the slice. |
| 5a | **CCRConfig (per CDM v1.X §4.4)** | Per-tenant override layer for country defaults. Tenant-scoped. |
| 5b | **TenantBrand (per CDM v1.X §4.2)** | Per-tenant brand identity. Tenant-scoped. |
| 6 | Engineering specs (data model, state machines, OpenAPI, system architecture) | Implementation specs. |
| 7 | Experience specs (Design System, IA, Design Implementation Contract) | Look, feel, flow. |
| 7a | **Tenant brand token overlay (per Design System v1.X)** | Tenant visual customization within platform-fixed token boundaries. |
| 8 | Operations specs (playbooks, protocols, guardrails, notifications) | Operational content. |
| 8a | **Tenant notification copy variants (per Notification Spec v1.X)** | Tenant-customized notification text within platform-fixed channel rules. |

### Tenant configuration cannot override higher tiers

Tenant Admin can:
- Select adapters from CountryProfile-available list (Tier 5a)
- Set tenant brand tokens within platform-fixed limits (Tier 7a)
- Configure tenant notification copy variants (Tier 8a)
- Configure tenant-specific operational settings (refill cadence within ADR-008 abrupt-discontinuation safety rules, etc.)

Tenant Admin cannot:
- Modify any Tier 1-4 document (those are platform-scope or cross-tenant)
- Override safety floors (I-001 through I-027)
- Disable required guardrails (I-019)
- Change tenant `country` attribute (per I-026, that is Platform Admin break-glass only)
- Modify the Source of Truth precedence itself

### Conflict resolution between tenant configuration and slice specs

If a tenant attempts a configuration that would violate a slice PRD requirement (e.g., setting refill cadence to weekly for a controlled substance), the configuration is rejected with a validation error. The slice PRD governs.

---

## Document control

- **v5.0** — Initial Source of Truth contract.
- **v5.1** — Adds Tenant configuration in the precedence hierarchy section. Threading remediation per Adversarial Counsel Review v1.0 finding CRITICAL-01. Existing precedence hierarchy, cross-cutting contract responsibilities, offerability resolution, and conflict-resolution rules preserved without modification.
