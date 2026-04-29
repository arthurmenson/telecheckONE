# Cross-Cutting Contracts Pack · v5.1

**Status:** Canonical · **For:** Telecheck patient platform · **Date:** April 2026 · **Supersedes:** v4.2 (v5.0 → v5.1 minor revision for multi-tenancy threading)

This pack contains the cross-cutting contracts that govern Telecheck's runtime behavior. Every other document — slice PRDs, service blueprints, API contracts, state machines, UX references — assumes these. Read this pack first.

## What's in here

| File | Purpose | Read first if you're working on... |
|---|---|---|
| `00-INVARIANTS.md` | Platform-level non-negotiable guarantees (22 invariants) | Anything. These are the floor. |
| `00-GLOSSARY.md` | Canonical terms · forbidden aliases · domain vocabulary | Anything. This is the vocabulary of the system. |
| `00-SOURCE-OF-TRUTH.md` | Conflict resolution hierarchy · offerability resolution | Resolving any contradiction between docs |
| `00-DOMAIN-EVENTS.md` | Event envelope · naming · catalog · aggregate partitioning | Backend services, event consumers, observability |
| `00-ERROR-MODEL.md` | Standard error envelope · codes · HTTP mapping · locale | API endpoints, client SDKs, error UX |
| `00-AUDIT-EVENTS.md` | Audit record schema · safety matrix · hash chain · patient self-access | Anything that touches PHI or clinical decisions |
| `00-IDEMPOTENCY.md` | Idempotency keys · terminal states · reconciliation | Any state-changing endpoint |
| `00-CCR-RUNTIME.md` | Country Configuration Registry · five country concepts · resolution | Anything country-specific |
| `00-AI-LAYERING.md` | Two-mode AI architecture · guardrail templates · protocol execution · calibration | Anything involving AI (**v5 rewrite**) |
| `00-FORMS-ENGINE.md` | Four-layer separation · one-version-per-market · provider feedback | Authoring intake, provider review, operator tooling |
| `00-MARKET-LAUNCH.md` | Sole authority for offerability · seven launch gates · pause/retire | Launching programs in markets |
| `00-TYPES.md` | Complex type definitions referenced by other contracts | Authoring schemas; consuming CCR / Forms / Market Launch |
| `00-GOVERNANCE-CONTROLS.md` | Configuration validation · incident response · safety-signal enforcement | Admin surfaces, operations, monitoring (**v5 new**) |

Note: the frozen set also includes `Telecheck_Contracts_Pack_v5_Update_Spec.md` as a historical companion explaining the v4.2 → v5 transition. It is not part of the runtime contract surface.

## What's new in v5

v5 absorbs architectural decisions from all 17 slice PRDs, the ADR set (15 ADRs), and operational review cycles.

### Major changes

1. **Two-mode AI framework.** `00-AI-LAYERING.md` is fully rewritten. Mode 1 (conversational assistant under §13.2 guardrails) and Mode 2 (protocol execution agent under §13.1 governance) replace the v4.2 three-layer model. Auto-approve is post-launch only (90-day track record required).

2. **Governance controls.** `00-GOVERNANCE-CONTROLS.md` is net-new. Defines CONFIG (configuration validation), INCIDENT (incident response contracts), and SIGNAL (safety-signal enforcement) — governance primitives that v4.2 implied but never specified.

3. **Bridge supply on consent revocation.** `00-INVARIANTS.md` adds I-021 (bridge supply for abrupt-discontinuation medications when care consent is revoked) and I-022 (progressive consent presentation).

4. **Interaction engine gate rules formalized.** `00-AI-LAYERING.md` and `00-AUDIT-EVENTS.md` now specify the exact gate behavior: critical signals block protocol execution, major signals block unless explicitly addressed in the protocol, moderate/minor are logged.

5. **Notification channel hierarchy.** `00-CCR-RUNTIME.md` adds WhatsApp as primary engagement channel (Ghana), SMS as fallback, quiet hours, and patient channel preferences.

## How to read

Start with `00-INVARIANTS.md` (the floor). Then `00-SOURCE-OF-TRUTH.md` (how documents relate). Then the contract relevant to your work. The Glossary is reference — consult it when any term is ambiguous.

## Relationship to slice PRDs

Every slice PRD names this pack as a companion document. Where a slice PRD and a contract disagree, the contract governs runtime behavior and the slice PRD is updated to match. Drift between layers is a defect (Project Instruction §11).

## Document control

- v1.0 — Initial 7-file pack
- v2.0 — 8-file pack (added TYPES); vocabulary unification; idempotency redesign
- v3.0 — 12-file pack (added AI-LAYERING, FORMS-ENGINE, MARKET-LAUNCH); added INVARIANTS
- v4.0 — Market Launch as sole offerability authority (I-020); 7 structural issues resolved
- v4.1 — `intake_form_version_id` as canonical identifier; calibration discipline
- v4.2 — Stability fixes; final v4 review cycle
- **v5.0** — Two-mode AI rewrite; GOVERNANCE-CONTROLS added; bridge supply invariant; 17 slice PRD decisions absorbed; ADR set alignment
- **v5.1** — Tenant-isolation threading per ADR-023 multi-tenancy Model A and ADR-024 country-driven config. Updates 9 of 13 contracts with tenant scoping: INVARIANTS adds I-023 through I-027 (5 new tenant-isolation invariants); AUDIT_EVENTS adds tenant_id and break_glass to envelope; DOMAIN_EVENTS adds tenant_id to event envelope; ERROR_MODEL adds I-025 information-leak prevention rules; CCR_RUNTIME adds Tenant ↔ Country relationship section (the explicitly-promised-but-undelivered Session 2 work); GLOSSARY adds 12 tenancy/isolation term definitions; TYPES adds 14 ID prefixes plus TenantId/TenantContext/CrossTenantAccessContext types; IDEMPOTENCY scopes idempotency keys to tenant; AI_LAYERING adds §9 tenant scoping; FORMS_ENGINE adds tenant scoping section; GOVERNANCE_CONTROLS adds §6 tenant-scoped governance; SOURCE_OF_TRUTH adds tenant configuration position in precedence hierarchy. MARKET_LAUNCH unchanged — Markets ≈ Tenants vocabulary already aligned. Threading remediation per Adversarial Counsel Review v1.0 finding CRITICAL-01.
