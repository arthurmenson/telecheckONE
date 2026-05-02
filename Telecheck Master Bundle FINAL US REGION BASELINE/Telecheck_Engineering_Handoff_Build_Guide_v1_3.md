# Telecheck — Engineering Handoff & Build Guide

**Version:** 1.3
**Status:** Canonical for development
**Owner:** Engineering Lead
**Supersedes:** Engineering Handoff & Build Guide v1.0, v1.1, v1.2
**Parent documents:** Master Platform PRD v1.9, ADR Set v1.0 + Addendum 016–019 + Addendum 020–025 (with ADR-025 superseded by ADR-026) + Addendum 026, System Architecture v1.2, Canonical Data Model v1.2, RBAC Permissions Matrix v1.1, Design Implementation Contract v1.0 (PROVISIONAL), Forms/Intake Engine Slice PRD v2.1, Pharmacy + Refill Slice PRD v2.1, Admin Backend Slice PRD v1.1, all other slice PRDs (extended by Tenant Threading Addendum v1.0 where applicable), Operational Readiness To-Do v1.4
**Companion documents:** Contracts Pack v5.1 (filenames retain v5_00 convention; headers govern), OpenAPI v0.2, State Machines v1.1, Tenant Threading Addendum v1.0, Unified Admin Sidebar v1.0, Active Document Index v1.0
**Format:** Markdown

---

## Change log from v1.0 → v1.1 → v1.2

**v1.2 (2026-04-25):** Remediation revision per Adversarial Counsel Review v1.0 findings HIGH-08, HIGH-09, MEDIUM-16, LOW-20.

- **HIGH-08 remediation:** §10 split into §10a "Sprint 0 — Day-by-day plan" (restored from v1.0 §10) and §10b "Sprint plan" (preserved from v1.1).
- **HIGH-09 remediation:** §13 "Setting up Claude Code" gets the embedded CLAUDE.md template restored as a code block (was stripped to a 5-step checklist in v1.1). Template updated for multi-tenant context (references CDM v1.2, OpenAPI v0.2, State Machines v1.1, Tenant Threading Addendum, Contracts Pack v5.1).
- **MEDIUM-16 remediation:** §7 rewritten — schemas now live in CDM v1.2 §4-bis per CRITICAL-02 remediation. Engineering's role is implementation per CDM, not authoring schema. Per-entity subsections updated to reference CDM v1.2 §4.7-§4.15.
- **LOW-20 remediation:** Section number mapping table added below.
- **HIGH-12 follow-through:** Heros migration work stream removed from Sprint 11 (now hardening + launch prep). Total timeline: 26 weeks → 24 weeks. References to "Heros migration tooling Phase 2" and "Heros migrating from Rimo" replaced with "Heros launches greenfield."

### Section number mapping across versions (added v1.2 per LOW-20)

| Topic | v1.0 location | v1.1 location | v1.2 location |
|---|---|---|---|
| What Telecheck is | §1 | §1 | §1 |
| Corpus inventory | §2 | §2 | §2 |
| Architectural spine | §3 | §3 | §3 |
| Tech stack | §4 | §4 | §4 |
| Build sequencing | §5 | §5 | §5 |
| Tier 0 / Tier 1 prereqs | §6 | §6 | §6 |
| Setting up Claude Code (CLAUDE.md template) | §7 | §13 (compressed; template stripped) | §13 (template fully restored) |
| AI multi-agent orchestration | §8 | §14 | §14 |
| Development workflow | §9 | §9 | §9 |
| Day-by-day plan (Sprint 0 week 1) | §10 | (lost; conflated into Sprint plan) | §10a (restored) |
| Sprint plan (sprints 1-N) | (none — not in v1.0) | §10 | §10b |
| Hard rules | §11 | §11 | §11 |
| How to flag spec issues | §12 | §12 | §12 |
| Engineer-facing risk register | §13 | §15 | §15 |
| Final notes | §14 | (absorbed into doc control) | (absorbed into doc control) |
| New entity engineering deliverables | (none — pre-Tier-1) | §7 (engineering authors schemas) | §7 (engineering implements per CDM v1.2) |
| Design–engineering contract enforcement | (none — pre-DIC) | §8 | §8 |

External references to "EHBG §10" written before v1.2 should be read as: §10 in v1.0 → §10a in v1.2; "§10" in v1.1 (sprint plan) → §10b in v1.2.

---

## Original change log from v1.0 → v1.1 (preserved for traceability)

v1.1 supersedes v1.0 to incorporate the multi-tenancy + Tier-1 ecom + dual-market scope expansion ratified across Sessions 1–3:

1. **Tech stack revised per ADR-022** native-first / open-source-first / self-hosted-first decision. The full 31-row provider matrix replaces the v1.0 stack section.
2. **Multi-tenancy per ADR-023** Model A — single deployment, logical separation by tenant_id, country-driven config switches. v1.0 was single-tenant focused; v1.1 reframes every module around tenant scoping.
3. **Country-driven config per ADR-024** — adapter selection per country, payment processor switching, regulatory module gating.
4. **AWS hosting per ADR-026** (supersedes ADR-025) — us-east-1 primary, us-west-2 cold DR (was DigitalOcean in v1.0; revised to AWS af-south-1 / us-east-1 in v1.2 per ADR-025; revised to AWS us-east-1 / us-west-2 cold DR in v1.3 per ADR-026).
5. **Tier-1 ecom scope per Master PRD v1.9 §5.1** — Forms Engine v2.1, Pharmacy + Refill v2.1, NEW Admin Backend v1.1 added to launch scope.
6. **22-26 week timeline per Master PRD v1.9 §6** — was 16w in v1.0; expanded for Tier-1 + multi-tenancy + dual-market.
7. **Design Implementation Contract v1.0** referenced as canonical authority for design–engineering boundary.
8. **Engineering deliverables for new entities** (Subscription, SubscriptionEvent, ProductCatalog, Cart, CartItem, DiscountCode, AffiliateAccount, AffiliateConversion) detailed.
9. **Heros launches greenfield** — no migration tooling in scope. Per HIGH-12 remediation decision 2026-04-25, Heros patients on Rimo do NOT migrate to Telecheck. Heros acquires patients fresh through Telecheck's standard intake flow. Engineering carries no migration work stream.
10. **OR Tracker v1.4 alignment** — sprint structure mapped to OR items.

The v1.0 architectural spine, work stream pattern, and engineering discipline rules are preserved where still applicable.

---

## How to read this document

This is the engineering team's primary reference for the build. Read in order:

- §1–§4 if you're new to the project (orientation, corpus, architectural spine, tech stack)
- §5 for sprint structure and work streams
- §6 for prerequisites that gate engineering progress
- §7 for the new entity engineering deliverables added in v1.1 (subscription mechanics, etc.)
- §8 for the design–engineering contract enforcement (linking to Design Implementation Contract v1.0)
- §9 for development workflow
- §10 for sprint-by-sprint plan
- §11 for hard rules (preserved from v1.0; expanded)
- §12 for raising spec issues
- §13 for Claude Code setup
- §14 for AI multi-agent orchestration
- §15 for the engineering risk register

---

## §1 What Telecheck is

Telecheck is a multi-tenant DTC telehealth platform launching with two day-1 tenants:

- **Telecheck-Ghana** — chronic care anchor in Ghana, Telecheck's own brand (the platform name and the consumer brand share a name; disambiguated by context)
- **Heros Health** — US DTC sister company, launching greenfield within Telecheck. Tier-1 ecom programs (GLP-1, ED, hair loss, skincare).

The platform supports both via:
- Multi-tenancy Model A: single deployment, logical separation by tenant_id, country-driven config switches (per ADR-023)
- Country-driven config: per-country payment processor (Stripe US, Paystack Ghana per ADR-024), per-country pharmacy adapters, per-country regulatory module
- Tier-1 ecom standard for US tenants: subscription mechanics, cart, switching, conversion-optimized intake, gold-standard ecom admin

Future tenants are anticipated (additional US DTC brands, additional country expansion). The platform is designed to onboard new tenants without code changes for the common case (per ADR-023 productized tenant onboarding is Phase 2; launch is engineering-assisted onboarding).

The clinical-safety invariants from the original Telecheck-Ghana scope are preserved without dilution across all tenants: interaction engine gate on every prescribing decision, clinician-review default with protocol-authorized configurable, SAFETY_HOLD on abrupt-discontinuation risk, bridge supply on consent revocation, audit-everything, AI labeling, delegate context visibility.

---

## §2 The corpus you're inheriting

Authoritative documents (canonical files per Registry v2.9; final bundle file count to be computed in Cycle U-004):

### Product truth
- Master Platform PRD v1.9 — the product
- Operational Readiness To-Do v1.4 — what's not done yet (106 active items, 4 tiers)
- Red Team Review, Flagged Items Resolution, Consolidated Launch Tracker, Reviewer Brief, Future Scope: USSD + AI Bridge, Investor One Pager

### Contracts layer (Contracts Pack v5)
- 14 contract files governing runtime behavior — INVARIANTS, GLOSSARY, SOURCE-OF-TRUTH, DOMAIN-EVENTS, ERROR-MODEL, AUDIT-EVENTS, IDEMPOTENCY, CCR-RUNTIME, AI-LAYERING, FORMS-ENGINE, MARKET-LAUNCH, TYPES, GOVERNANCE-CONTROLS, README

### Engineering truth
- Canonical Data Model v1.2 — 33 entities, all tenant-scoped
- State Machines v1.1 — 13 state machines (subscription state machine to be added per Pharmacy + Refill v2.1 §8.2)
- OpenAPI v0.2 — endpoint catalog (subscription, cart, catalog, discount, affiliate endpoints to be added)
- System Architecture v1.2 — 15 modules including Tenant Configuration
- RBAC Permissions Matrix v1.1 — Platform Admin + Tenant Admin role hierarchies
- ADR Set v1.0 + Addendum 016–019 + Addendum 020–025 — 25 ADRs total
- Payment & Billing Spec v1.0, Identity & Auth Spec v1.0, Messaging & Inbox Spec v1.0

### Experience truth
- Patient App IA v1.0 (48 screens), Clinician Portal IA v1.0 (34 screens), Admin Operator IA v1.1 (36 screens + new Tier-1 ecom surfaces per Admin Backend v1.1)
- Design System v1.1
- Design Implementation Contract v1.0 — the design–engineering boundary

### Slice truth (18 active slice PRDs)
Forms/Intake Engine v2.0, Pharmacy + Refill v2.1 (consolidated), Admin Backend v1.1 (NEW), and 15 others at v1.0 covering: Async Consult, Sync Video Consult, Labs/Document Interpretation, Adverse Event Reporting, RPM/CCM, AI Clinical Assistant, Medication Interaction Engine, Herb-Drug Interaction Engine, Consent & Delegated Access, Acquisition & Engagement Tools, Community Platform, Fake Medication Detection, Pharmacy Portal (superseded — content within Pharmacy + Refill v2.1), Refill (superseded — content within Pharmacy + Refill v2.1), Admin Configuration Surfaces, Market Rollout Cockpit

### Operations truth
- Ghana Launch Playbook v1.1, Protocol Library Ghana v1.0, Guardrail Templates v1.0, Notification Spec v1.1

### External communications
- Investor Pitch (Ghana), Nigeria Investor Pitch, Investor One Pager

### Cross-cutting
- Promotion Ledger (P-001 through P-007)
- Artifact Registry v2.9

---

## §3 The architectural spine

### 3.1 The 15 modules per System Architecture v1.2

| Module | Purpose |
|---|---|
| Identity & Auth | Authn, sessions, OTP per tenant country |
| Tenant Configuration | Tenant resolution, brand inheritance, per-tenant CCR, adapter selection |
| Patient Account | Tenant-scoped patient records |
| Forms/Intake Engine | Forms v2.0 — visual builder, A/B testing, save-and-resume, abandonment recovery |
| Consent & Delegation | Consent infrastructure, delegate scopes |
| Medication Interaction Engine | Five check classes; the platform safety gate |
| Herb-Drug Interaction Engine | Concurrent with med engine; tenant-scoped |
| Refill / Pharmacy / Subscription | Pharmacy + Refill v2.1 — subscription mechanics, cart, catalog, adapter framework |
| AI Service | Mode 1 + Mode 2; LLMProvider abstraction (Anthropic Claude primary) |
| Labs / Document Interpretation | OCR + structured extraction + AI interpretation |
| Adverse Event Reporting | Three detection pathways; four feedback loops |
| RPM/CCM | Remote monitoring, alerts |
| Community Platform | Moderated peer support |
| Admin Backend | Platform Admin + Tenant Admin surfaces |
| Audit | Hash-chained audit log per AUDIT-EVENTS |

### 3.2 Module communication

- HTTP REST (OpenAPI v0.2) for synchronous calls
- Domain events (per DOMAIN-EVENTS contract) for asynchronous workflows
- All cross-module calls are tenant-scoped (tenant_id required in request context)

### 3.3 Tenant scoping enforcement (per ADR-023)

Three layers:

1. **PostgreSQL Row-Level Security (RLS)** policies on every tenant-scoped table — defense in depth
2. **Per-tenant KMS data keys** — encrypted columns use tenant-scoped data keys; cross-tenant access cryptographically impossible
3. **Application-layer tenant filter middleware** — every request resolved to a tenant_id; downstream queries auto-filtered

Linting enforced (RLS lint per OR-252) — no developer-written query may bypass RLS without explicit annotation.

### 3.4 Country-driven config (per ADR-024)

Country attribute on tenant drives:
- Regulatory module activation (US states regulatory, Ghana FDA regulatory)
- Payment processor (Stripe US, Paystack Ghana)
- Currency, locale, formats
- Pharmacy adapter availability set
- Clinician network adapter availability set
- SMS provider (Plivo/MessageBird US, Hubtel/mNotify Ghana)
- WhatsApp provider (360dialog with country routing)

Country additions post-launch are configuration + provider integrations, not architectural changes.

---

## §4 Tech stack — what's specified per ADR-022

Per ADR-022 native-first / open-source-first / self-hosted-first stack. The full provider matrix:

### 4.1 Application layer
- **Backend language:** TypeScript (Node.js 20+) — Fastify framework
- **Frontend:** React 18 + TypeScript, Vite build, Tailwind CSS for utility classes (token-driven), shadcn/ui as component patterns reference (custom-built `@telecheck/ui` library)
- **Mobile:** Responsive web (PWA-grade) at launch; native iOS/Android Phase 2

### 4.2 Data layer
- **Primary database:** PostgreSQL 16 (AWS RDS Multi-AZ in us-east-1, cold-DR snapshot replication to us-west-2)
- **Caching:** Redis 7 (AWS ElastiCache)
- **Search:** Meilisearch (self-hosted on EKS / k3s — open-source full-text search)
- **Object storage:** AWS S3 (us-east-1 primary; cross-region replication to us-west-2)
- **Secrets:** AWS Secrets Manager + per-tenant KMS data keys

### 4.3 Communication layer
- **Video:** LiveKit (Apache 2.0, self-hosted; AI Agents framework for Track B sync intake)
- **STT:** Faster-Whisper (self-hosted GPU; future migration to commercial provider per OR-313 trigger)
- **WhatsApp:** 360dialog (multi-region; Ghana primary channel)
- **SMS US:** Plivo (primary) or MessageBird (alternative)
- **SMS Ghana:** Hubtel (primary) or mNotify (alternative)
- **Email:** Postmark (transactional)
- **In-app chat:** Self-built (PostgreSQL + WebSockets via Fastify)

### 4.4 AI layer (per ADR-020 LLM provider abstraction)
- **Primary clinical LLM:** Anthropic Claude (via API)
- **Alternative providers (configurable):** OpenAI, Gemini, AWS Bedrock, Azure OpenAI; self-hosted Llama for non-clinical inference
- **OCR:** AWS Textract Medical (US tenants); Tesseract self-hosted as fallback / for Ghana
- **Embeddings:** Voyage AI or open-source alternative for protocol RAG

### 4.5 Payment layer (per ADR-024)
- **US:** Stripe (subscriptions, Stripe Connect for affiliate payouts)
- **Ghana:** Paystack (subscriptions; mobile money + cards)

### 4.6 Pharmacy adapter layer (per ADR-024 + Pharmacy + Refill v2.1 §6)
- **US:** Truepill, Honeybee, Capsule, Alto (per-tenant selection)
- **Ghana:** Partner pharmacies per Ghana Launch Playbook + Telecheck-Ghana operated infrastructure

### 4.7 Observability layer (per ADR-022)
- **Metrics:** Prometheus + Grafana (LGTM stack — Loki, Grafana, Tempo, Mimir self-hosted)
- **Logs:** Loki (self-hosted)
- **Traces:** Tempo (self-hosted)
- **Error tracking:** Sentry (self-hosted)
- **Uptime:** Custom + StatusPage.io for public status

### 4.8 Analytics & experimentation layer (per ADR-022)
- **Product analytics + feature flags + A/B testing:** PostHog (self-hosted)
- **BI / dashboards:** Metabase (self-hosted; per-tenant scoped queries)
- **Session replay:** PostHog (with PHI redaction policies)

### 4.9 Affiliate layer (per Admin Backend v1.1 §5.5)
- **Tracking + attribution:** Self-built (PostgreSQL + middleware)
- **Payouts US:** Stripe Connect
- **Payouts Ghana:** Manual reconciliation at launch (Phase 2: Paystack Connect equivalent)

### 4.10 Infrastructure layer (per ADR-026; supersedes ADR-025)
- **Hosting:** AWS — us-east-1 primary, us-west-2 cold DR
- **Container orchestration:** Docker Compose at launch volumes; k3s migration trigger when scale demands
- **CI/CD:** GitHub Actions
- **Infrastructure as Code:** Terraform
- **DNS + CDN:** Cloudflare

Estimated infrastructure cost at launch volume: ~$2-3K/month per ADR-026 (vs ~$15K/month managed-everything alternative — ~$144K/year saved at launch scale; scaling savings continue).

---

## §5 Build sequencing — work streams (revised for 22-26 week timeline per Master PRD v1.9 §6)

### 5.1 Six concurrent work streams

| Work stream | Lead | Weeks |
|---|---|---|
| Platform Foundation | Engineering Lead | 1-8 (concurrent with all others) |
| Care Delivery + Forms (Forms Engine v2.1, Async Consult, AI Mode 2) | Senior Backend + Senior Frontend | 4-14 |
| Pharmacy + Refill (Pharmacy + Refill v2.1 with subscription mechanics) | Senior Backend | 6-18 |
| Admin Backend (Platform Admin + Tenant Admin surfaces, AI-assisted features) | Senior Frontend + Backend | 8-20 |
| Patient App + Clinician Portal (UI implementation per Design Implementation Contract) | Senior Frontend | 6-22 |
| Operational Readiness (Tier 0 + Tier 1 OR items per OR Tracker v1.4) | Engineering Lead + ops | 1-26 (all-launch) |

### 5.2 Sprint cadence

- 2-week sprints
- Sprint 0: Tier 0 prerequisites + Platform Foundation kickoff
- Sprints 1-13: build (13 sprints × 2 weeks = 26 weeks max)
- Sprint demo every other Friday: design verifies pixel-exact match per Design Implementation Contract §6
- Retrospective every other Friday after demo

### 5.3 Definition of done per slice

A slice is "done" when:
1. All API endpoints implemented and OpenAPI-conformant
2. State machine implemented matching State Machines v1.1 spec (or extended; subscription state machine added per Pharmacy + Refill v2.1 §8.2)
3. Domain events emitted per DOMAIN-EVENTS envelope
4. Audit events emitted per AUDIT-EVENTS contract
5. Idempotency per IDEMPOTENCY contract on state-changing endpoints
6. Tenant scoping verified (RLS lint passes; tenant filter middleware active; cross-tenant test fails)
7. UI screens implemented per Design Implementation Contract pixel-exact verification
8. Visual regression tests pass at all viewports for default + Heros + Telecheck-Ghana brand variants
9. Accessibility automated tests pass (axe-core)
10. Performance budgets met (per Forms Engine v2.1 §20, Admin Backend v1.1 §7, etc.)
11. Slice-level integration test suite green
12. Slice-PRD acceptance criteria reviewed by Product Lead
13. Operational runbook drafted (deploy, monitor, rollback, incident response)

---

## §6 Tier 0 / Tier 1 prerequisites that affect engineering

Per OR Tracker v1.4:

### 6.1 Tier 0 (must close before sprint 1)
- OR-001 Threat model (STRIDE)
- OR-002 Ghana DPIA
- OR-004 Clinical safety case + FMEAs
- OR-005 AI bias and fairness assessment
- (OR-003 LLM decision closed by ADR-020)

These are non-engineering deliverables that engineering cannot start without. Engineering Lead pursues parallel scoping while ops/legal/clinical complete Tier 0.

### 6.2 Tier 1 (launch-blocking, addressed during build)

19 items including:
- OR-100 series — pharmacy adapter contracts, OCR provider, knowledge sources, deployment infrastructure
- OR-200 series — emergency response, BCP/DR
- OR-234 through OR-240 — multi-tenancy items: US compliance evidence, dual-tenant operational handbook, US states regulatory module activation, US clinician network adapter implementation, Stripe integration validation, US BAA finalization (Heros migration plan removed per HIGH-12 decision)

Engineering plan addresses these as part of sprint sequencing per §10.

### 6.3 Tier 2 (build-time engineering work; 64 items)

The Session 2 additions (OR-257 through OR-277) are the engineering work units for the Tier-1 slice PRDs:

- OR-258 Subscription state machine implementation
- OR-260 Multi-product cart implementation
- OR-261 Pharmacy adapter conformance test suite
- OR-262 Discount code engine implementation
- OR-263 Affiliate program MVP implementation
- OR-264 Conversion dashboard implementation
- OR-269 Save-and-resume implementation
- OR-271 A/B testing infrastructure
- (and 13 more — see OR Tracker v1.4 §2 Tier 2)

Each maps to a sprint task; OR Tracker is the ground truth for status.

---

## §7 New entity engineering deliverables (rewritten in v1.2 per MEDIUM-16)

The Tier-1 slice PRDs (Forms Engine v2.1, Pharmacy + Refill v2.X, Admin Backend v1.X) introduced 8 new entities. Per Pattern C remediation in this remediation cycle, the **canonical schemas now live in Canonical Data Model v1.2 §4-bis (§4.7 through §4.15)**. Slice PRDs reference these schemas; engineering implements per them. Engineering does NOT author the schemas — that responsibility was incorrectly placed in this section in v1.1 and is now corrected.

### 7.1 Subscription

Canonical schema: **CDM v1.2 §4.7**. State machine: **State Machines v1.1 §15**. Engineering deliverables:
- Migration script creating `subscriptions` table per CDM v1.2 §4.7 DDL (tenant_id NOT NULL, RLS policy enabled)
- TypeScript types generated from canonical schema
- State transition functions implementing State Machines v1.1 §15 with all guards (clinician sign-off for SAFETY_HOLD release per RBAC v1.1; pause max 90 days; etc.)
- Domain events emitted per DOMAIN_EVENTS v5.1 envelope (with tenant_id): `subscription.created`, `subscription.activated`, `subscription.paused`, `subscription.resumed`, `subscription.switching_initiated`, `subscription.switched`, `subscription.cancellation_pending`, `subscription.cancelled`, `subscription.payment_failed`, `subscription.terminated_payment_failure`, `subscription.safety_hold`, `subscription.released_from_safety_hold`
- Audit events per AUDIT_EVENTS v5.1 (tenant_id required) — Category C for operational transitions, Category A for switch approval and SAFETY_HOLD events

### 7.2 SubscriptionEvent

Canonical schema: **CDM v1.2 §4.8**. Engineering deliverables:
- Migration script per CDM DDL
- Append-only enforcement (DB-level UPDATE/DELETE prevention)
- Mirroring into AuditEvent per AUDIT_EVENTS v5.1
- Replay capability for analytics consumers

### 7.3 ProductCatalog

Canonical schema: **CDM v1.2 §4.9**. Engineering deliverables:
- Migration script per CDM DDL
- Admin Backend CRUD UI integration per Admin Backend Slice v1.X §5.4
- Tenant Admin bulk import (CSV) for tenant onboarding — NOT for patient-data migration; this is for tenants populating their initial product catalog
- Inventory tracking integration with PharmacyProvider adapters
- Product status state transitions (active / out_of_stock / discontinued)

### 7.4 Cart + CartItem

Canonical schemas: **CDM v1.2 §4.10 (Cart)** and **§4.11 (CartItem)**. Engineering deliverables:
- Migration scripts per CDM DDL (both tables tenant-scoped)
- Cart expiration job (per cart.expires_at)
- Cart-to-Subscription handoff logic (per cart item cadence)
- Cart-to-Refill handoff logic (for one-time orders)
- Per-item independent clinical eligibility evaluation
- Discount code application per item

### 7.5 DiscountCode + DiscountCodeRedemption

Canonical schemas: **CDM v1.2 §4.12 and §4.13**. Engineering deliverables:
- Migration scripts per CDM DDL
- Validation logic (max uses per patient, max total uses, valid window, applies-to scope)
- Anti-fraud rate limiting (per IP, per account)
- Audit on creation, modification, redemption per AUDIT_EVENTS Category C
- Tenant Admin / Tenant Marketing UI integration per Admin Backend Slice v1.X

### 7.6 AffiliateAccount + AffiliateConversion

Canonical schemas: **CDM v1.2 §4.14 and §4.15**. Engineering deliverables:
- Migration scripts per CDM DDL
- Tracking link generation (tenant-scoped slug uniqueness)
- Cookie-based attribution with configurable window per AffiliateAccount.attribution_window_days
- Conversion crediting on signup, first subscription, first one-time purchase
- Refund-aware reversal logic (commission_status transitions to "reversed")
- Stripe Connect integration for US payouts (Ghana manual reconciliation at launch)

### 7.7 State Machines v1.1 already produced

Per CRITICAL-03 remediation in this remediation cycle, **State Machines v1.1 is canonical and complete** with §15 Subscription state machine and §16 (renumbered) cross-machine interactions. Engineering implements per State Machines v1.1; engineering does NOT author state machine extensions for this scope.

### 7.8 OpenAPI v0.2 already produced

Per CRITICAL-04 remediation in this remediation cycle, **OpenAPI v0.2 is canonical and complete** with 33 new endpoints across 6 new modules (Tenant Configuration, Subscriptions, Product Catalog, Carts, Discount Codes, Affiliates). Engineering implements per OpenAPI v0.2; engineering does NOT extend OpenAPI for this scope unless additional engineering review surfaces missing endpoints.

### 7.9 Canonical Data Model v1.2 already produced

Per CRITICAL-02 remediation in this remediation cycle, **CDM v1.2 is canonical and complete** with 41 entities (33 inherited + 8 ecom new in v1.2). Engineering implements per CDM v1.2; engineering does NOT author entity schema extensions for this scope.

---

## §8 Design–engineering contract enforcement

Per Design Implementation Contract v1.0. Engineering responsibilities specifically:

### 8.1 Token discipline (per DIC §4.1)

CI checks fail the build on:
- Hardcoded color hex values in component code
- Hardcoded spacing pixel values in component code
- Inline styles for token-able properties
- Component-level overrides via raw CSS rather than via tokens

Allowed exceptions: documented edge cases requiring custom values (rare; require explicit `// stylelint-disable-next-line` annotation with justification).

### 8.2 Component library (per DIC §5)

`@telecheck/ui` is the single component library:
- Implements every component in Design System v1.1
- Storybook for every component with all variants and states
- Visual regression tests (Playwright + diff per ADR-022 open-source preference)
- axe-core accessibility tests in component test suite
- Per-tenant brand variant tests (default, Heros, Telecheck-Ghana minimum)

### 8.3 Visual regression (per DIC §6)

Infrastructure built in Tier 1 of the build:
- Storybook stories rendered at mobile (375px), tablet (768px), desktop (1024px), desktop-large (1440px)
- Per-tenant brand variants rendered
- Pixel diff against baseline at 0.1% threshold per snapshot
- PR-blocking; explicit baseline-update approval required for intentional changes

### 8.4 DSI workflow (per DIC §7)

DSI tracking integrated into the engineering issue tracker (GitHub Issues with `design-spec-issue` label). Severity SLAs per DIC §7.2 enforced.

### 8.5 Brand validation (per DIC §11.3)

Engineering implements automated brand validation in Admin Backend v1.1 §5.8 brand upload flow:
- Color contrast checks against all surfaces brand colors appear on (WCAG AA minimum)
- Logo dimension and aspect-ratio checks
- Custom domain DNS verification
- Live preview rendering across patient app, key surfaces, and brand showcase

---

## §9 Development workflow and discipline

### 9.1 Branch strategy

- `main` — production-ready, deployable
- `develop` — integration branch
- Feature branches off `develop`, named `feature/<slice>/<short-description>`
- PRs to `develop`; merge requires: 1 reviewer, all CI green, visual regression clean (or explicit baseline approval)
- Release branches off `develop`, deployed to staging then production

### 9.2 Code review

- Every PR reviewed by at least one other engineer
- Slice-affecting PRs reviewed by Product Lead for spec conformance
- Design-affecting PRs reviewed by Design Lead for pixel-exact conformance
- Security-sensitive PRs (auth, RBAC, audit, encryption) reviewed by Engineering Lead

### 9.3 Testing pyramid

- Unit tests: high coverage for business logic, state machine transitions, validation
- Integration tests: per-module API contract verification
- End-to-end tests: critical-path patient flows (onboarding, refill, consult, subscription lifecycle)
- Visual regression: per DIC §6
- Accessibility: per DIC §12
- Load: per Tier 1 OR items
- Security: per OR-001 threat model + ongoing

### 9.4 CI/CD per ADR-022

- GitHub Actions for CI
- Build → test → visual regression → accessibility → security scan → deploy to staging
- Manual approval for production deploy
- Automatic rollback on production health check failure

### 9.5 Database migrations

- Forward-only migrations; rollback via compensating migration
- Migration testing in CI against production-like dataset
- All migrations tenant-aware (RLS policies created or updated as part of migration)
- Migration scripts reviewed by Engineering Lead before merge

### 9.6 Secrets management

- AWS Secrets Manager for all secrets
- No secrets in code, environment files, or CI logs
- Per-tenant secrets scoped per tenant_id
- Rotation per ADR-013 audit policy

---

## §10a Sprint 0 — Day-by-day plan (week 1, Days 1-7) (restored from v1.0 §10 per HIGH-08 remediation)

The first week of engineering work is granular and prescriptive. Beyond Day 7, the plan transitions to sprint-level (§10b below).

### Day 1 — Orient
- Read this handoff (90 min)
- Read Reviewer Brief v1.0 (15 min)
- Read Master PRD §1–5, §10, §11, §13, §17 (30 min)
- Skim ADR Set + ADR Addendum (30 min)
- Skim System Architecture v1.2 (30 min)
- Set up local Claude Code (30 min)

### Day 2 — Infrastructure foundation
- Repo setup; Git workflow established (90 min)
- AWS account access; us-east-1 baseline IAM via Terraform (3 hours)
- Local development environment per `dev-server-vibe-coder.md` reference (2 hours)
- Read Engineering Specs (CDM v1.2, OpenAPI v0.2, RBAC v1.1, State Machines v1.1) (90 min)

### Day 3 — Audit module first
- Per I-003, the audit module is a foundational deliverable. Implement audit envelope per AUDIT_EVENTS v5.1 with tenant_id (4 hours)
- Hash-chain implementation with verification (4 hours)
- Audit serves as the canary for tenant-isolation correctness — every other module's audit emission validates it

### Day 4 — Tenant resolution
- Tenant Configuration module scaffold per System Architecture v1.2 §13 (4 hours)
- Tenant resolution middleware (subdomain → tenant_id) (2 hours)
- PostgreSQL Row-Level Security policies for first set of tenant-scoped tables (2 hours)
- Test cross-tenant query rejection (1 hour)

### Day 5 — Identity service
- Account model with tenant_id per CDM v1.2 §3.2 (3 hours)
- US OTP provider integration (Twilio/Plivo/MessageBird candidate selection per ADR-022) (3 hours)
- Ghana OTP provider integration (Hubtel/mNotify) (2 hours)
- Session management (1 hour)

### Day 6 — Forms Engine foundation
- Form template + deployment + submission entities per CDM v1.2 (4 hours)
- Save-and-resume infrastructure (2 hours)
- Tenant scoping on form artifacts per FORMS_ENGINE contract v5.1 (2 hours)
- Basic builder UI scaffold (2 hours)

### Day 7 — Integration + status
- Integrate Day 3-6 modules end-to-end on a synthetic test case (4 hours)
- Validate audit emission carries tenant_id correctly (1 hour)
- Validate tenant isolation: a Tenant A test user cannot read Tenant B data (1 hour)
- End-of-week status update; surface any blockers via §12 escalation pattern (1 hour)
- Plan Sprint 1 detailed work (1 hour)

This concrete week ensures the architectural floor (audit, tenant isolation, identity) is in place before higher-velocity work in Sprint 1.

---

## §10b Sprint plan — 12 sprints × 2 weeks = 24 weeks (revised v1.2; was 13 sprints × 2 weeks = 26 weeks)

| Sprint | Work focus | Key deliverables |
|---|---|---|
| Sprint 0 (weeks 1-2) | Foundation kickoff + Tier 0 in parallel | Per §10a Day 1-7 plan above; Tier 0 OR items closed by ops/legal/clinical |
| Sprint 1 (weeks 3-4) | Foundation + Patient/Clinician scaffolding | Auth flows (US + Ghana OTP), tenant resolution middleware, base patient + clinician account models, audit module, design tokens pipeline, `@telecheck/ui` scaffold |
| Sprint 2 (weeks 5-6) | Forms Engine v2.1 part 1 + Consent module | Form template model + deployment + submission, save-and-resume, basic builder UI, consent block integration, medication reconciliation; visual regression infra ready |
| Sprint 3 (weeks 7-8) | Forms Engine v2.1 part 2 + Med Interaction Engine | A/B test variant model + PostHog integration, abandonment recovery touches, med interaction engine all 5 check classes operational, SAFETY_HOLD logic |
| Sprint 4 (weeks 9-10) | Pharmacy + Refill v2.X part 1 | Refill state machine implementation, pharmacy adapter framework with first US adapter (Truepill) and first Ghana adapter, MedicationRequest model, basic refill workflow |
| Sprint 5 (weeks 11-12) | Pharmacy + Refill v2.X part 2 + Subscription | Subscription model + state machine per State Machines v1.1 §15, ProductCatalog per CDM v1.2 §4.9, multi-product Cart per CDM v1.2 §4.10-§4.11, subscription handoff from Forms Engine intake |
| Sprint 6 (weeks 13-14) | Pharmacy + Refill v2.X part 3 + Admin Backend part 1 | Pause/resume/switch/cancel flows, cancellation deflection, inventory awareness with STOCKOUT, second pharmacy adapters online; Admin Backend Platform Admin tenant management surfaces |
| Sprint 7 (weeks 15-16) | Async Consult + Admin Backend part 2 | Async consult workflow with AI Mode 2 case prep, clinician portal MVP, Admin Backend Tenant Admin subscription/refill management UI |
| Sprint 8 (weeks 17-18) | Sync Video Consult + Admin Backend part 3 | LiveKit self-hosted operational, sync consult flow with audio-only fallback, AI Scribe; Admin Backend catalog management, pricing, discount codes per CDM v1.2 §4.12-§4.13 |
| Sprint 9 (weeks 19-20) | Labs + Admin Backend part 4 | Labs upload pathways, AWS Textract integration, AI interpretation; Admin Backend affiliate MVP per CDM v1.2 §4.14-§4.15, conversion dashboards (Metabase + PostHog), AI-assisted operator features (anomaly detection) |
| Sprint 10 (weeks 21-22) | Adverse Event + RPM/CCM | Adverse event detection pathways, RPM/CCM model + alerts |
| Sprint 11 (weeks 23-24) | Hardening + Launch prep | Performance optimization, security hardening, accessibility audit; Heros greenfield launch readiness, Telecheck-Ghana launch readiness; runbooks finalized |
| (Sprint 12 buffer) | Post-soft-launch fixes; post-launch follow-on Tier 3 | — |

**Note (v1.2):** Sprint 11 was previously a Heros migration execution sprint per v1.1. Per HIGH-12 remediation decision (Heros launches greenfield, no migration), that sprint is repurposed for hardening + launch prep. Total timeline reduced from 26 weeks to 24 weeks. The 22-week floor is still achievable if Tier 0 closes ahead of schedule and no major issues emerge during Sprints 1-6.

---

## §11 Hard rules — never violate

Preserved from v1.0; expanded for v1.1:

1. **Tenant scoping is mandatory.** Every query that touches a tenant-scoped table includes tenant_id filtering — via RLS, app middleware, or both. Cross-tenant query is a security incident.
2. **Audit-everything per AUDIT-EVENTS.** Clinical decisions (Category A), governance changes (Category B), operational changes (Category C). No silent state changes.
3. **Idempotency on state-changing endpoints per IDEMPOTENCY contract.** Replay-safe terminal states.
4. **Interaction engine gate on every prescribing decision.** No bypass. SAFETY_HOLD on critical signals.
5. **Bridge supply on consent revocation per ADR-008.** For abrupt-discontinuation medications.
6. **AI labeling per AI-LAYERING.** Mode 1 and Mode 2 outputs always labeled.
7. **No PHI in logs.** Loki/Sentry/CloudWatch logs are PHI-free. PHI access through audited paths only.
8. **No secrets in code or environment files.** AWS Secrets Manager only.
9. **Token discipline per DIC §4.1.** No raw color/spacing/typography values in component code.
10. **Pixel-exact match per DIC §3.2.** Spacing, typography, color, layout, component variants, interaction states.
11. **Design Spec Issue (DSI) raised on ambiguity per DIC §7.** No silent guessing.
12. **WCAG 2.1 AA accessibility per Forms Engine v2.1 §21 and DIC §12.** Every component, every screen, every brand variant.
13. **Performance budgets per slice PRDs (Forms Engine v2.1 §20, Admin Backend v1.1 §7, etc.).** CI enforced.
14. **Honest status copy per Master PRD §17.** "Delivering" means left the pharmacy.
15. **Anti-coercive cancellation per Pharmacy + Refill v2.1 §10.2.** Max 2 deflection screens. No dark patterns.

---

## §12 How to flag spec issues back to product

Use the Design Spec Issue template (DIC §7.1) for design-related ambiguity. For non-design spec ambiguity, use a Spec Issue:

```markdown
## SI-[NUMBER] — [SLICE OR FEATURE]

**Raised by:** [engineer]
**Date:** [date]
**Severity:** [blocker | high | medium | low]

## What I'm trying to implement
[brief]

## What the spec says
[reference: slice PRD section, ADR, contract]

## What's unclear
[the actual question]

## What I'd propose
[engineer's proposal — fastest path to resolution]

## What I'm doing in the meantime
[blocking | placeholder | etc.]

## Required from product
[specific deliverable]
```

Severity SLAs match DIC §7.2.

---

## §13 Setting up Claude Code for this project (restored from v1.0 §7 per HIGH-09 remediation; updated for multi-tenant context)

Claude Code is Anthropic's CLI tool for agentic coding. Spec corpus this size (now ~70 documents post-remediation) demands deliberate setup. A default Claude Code session ignoring the spec corpus produces low-quality code that re-litigates resolved decisions. A well-configured session reads the right slice PRD before implementing it.

### Day-one Claude Code setup checklist

1. Install Claude Code (native installer, not npm)
2. `cd` into the repo, `git init` if new
3. `claude` to open a session
4. `/init` to generate a starter CLAUDE.md
5. Refine CLAUDE.md per template below
6. Add the spec corpus as a project-relative path
7. Create skills for slice-implementation patterns
8. Configure MCP servers (GitHub, Postgres, monitoring)
9. Set up hooks for lint and test
10. Configure a project-specific subagent set

### CLAUDE.md template for this project

Create `CLAUDE.md` at the repo root. Keep it under 200 lines. The version below is a starting point; refine over time. **Updated v1.2** for multi-tenant context post-remediation.

```markdown
# Telecheck — Project Context for Claude Code

## What this is
Telecheck is a multi-tenant AI-powered telehealth platform. *(Operating-tenant + DBA framing rewritten 2026-05-02 per Codex Round-5 Scope 4 HIGH-2 finding to align with C3 brand-structure rule per Master PRD v1.10 §17 + Glossary v5.2 — was previously `Heros Health (US, greenfield)` using the consumer DBA as a tenant identifier.)* At launch, two operating tenants are active:
- **Telecheck-US** (operating tenant, US, greenfield; operated by Telecheck Health LLC; trading patient-facing as **Heros Health** consumer DBA at heroshealth.com)
- **Telecheck-Ghana** (operating tenant, Ghana, chronic-care anchor; operated by Telecheck-Ghana Ltd.; trading patient-facing as **Heros Health Ghana** consumer DBA at ghana.heroshealth.com)
Architecture is global. Code, schema, audit, and config use operating-tenant identifiers (`Telecheck-{country}`); patient-facing surfaces source the consumer DBA via `tenant.consumer_dba`, never from `tenant.id`. See /docs/spec/Telecheck_Master_Platform_PRD_v1_10.md for full context.

## How to find authoritative answers
- WHAT to build: /docs/spec/Telecheck_Master_Platform_PRD_v1_8.md
- WHICH version of any artifact: /docs/spec/Telecheck_Artifact_Registry_v2_9.md
- ARCHITECTURE decisions: /docs/spec/Telecheck_ADR_Set_v1_0.md + Addendum 016-019 + Addendum 020-025
- API surface: /docs/spec/Telecheck_OpenAPI_v0_2.md (178 endpoints across 21 modules)
- DATA model: /docs/spec/Telecheck_Canonical_Data_Model_v1_2.md (41 entities)
- STATE machines: /docs/spec/Telecheck_State_Machines_v1_1.md (14 state machines)
- RUNTIME contracts: /docs/spec/Telecheck_Contracts_Pack_v5_*.md (v5.1, multi-tenant aware)
- RBAC: /docs/spec/Telecheck_RBAC_Permissions_Matrix_v1_1.md (dual hierarchy: Platform Admin + Tenant Admin)
- TENANT THREADING for v1.0 slices: /docs/spec/Telecheck_Tenant_Threading_Addendum_v1_0.md
- PER-FEATURE detail: /docs/spec/Telecheck_*_Slice_PRD_v*.md

## Read before implementing anything
1. The slice PRD for the feature you're implementing
2. The Tenant Threading Addendum §3.X if the slice is at v1.0
3. The relevant ADRs (especially ADR-023 multi-tenancy, ADR-024 country config)
4. The state machine for the entity you're touching
5. The OpenAPI definition for the endpoints involved
6. The contract files referenced by the slice PRD (especially Contracts Pack v5.1 INVARIANTS, AUDIT_EVENTS, GLOSSARY)

## Hard rules — never violate
- Audit table is append-only. Never UPDATE or DELETE an audit row. Hash chain integrity must hold. I-003.
- Audit records carry tenant_id. Always. I-027.
- Every PHI-touching query is tenant-filtered. Three-layer enforcement (RLS + app-layer + per-tenant KMS). I-023.
- Cross-tenant access requires break-glass with audit. I-024.
- Error responses do not leak cross-tenant existence. I-025.
- AI content always carries: source_type, ai_mode, model_version, guardrail_template_id (Mode 1) or protocol_id+version (Mode 2). No exceptions.
- Crisis detection is platform-floor. Never disable, never gate behind config. Active in chat, voice (future), community. I-019.
- Interaction engine runs BEFORE clinician commits prescription. Not after, not in parallel.
- Cross-module data access is via module public interface only. No direct DB queries across module boundaries.
- No hardcoded country assumptions. Use CCR. I-009.
- Tenant country attribute is treated as immutable post-creation. I-026.

## Tech stack
- TypeScript everywhere (Node.js 20+ for backend, React 18+ for web, React Native for mobile)
- Fastify (backend HTTP framework)
- PostgreSQL 15+ with Row-Level Security policies (per ADR-023)
- Prisma (ORM with type generation)
- Redis (cache, queues)
- LiveKit self-hosted (sync video per ADR-021)
- AWS us-east-1 primary, us-west-2 cold DR (per ADR-026; supersedes ADR-025)
- Anthropic Claude (clinical AI, primary; multi-provider abstraction per ADR-020)
- AWS Bedrock + Azure OpenAI (resilience providers)
- AWS Textract Medical (lab OCR)
- Native-first / open-source-first / self-hosted-first per ADR-022

## Code conventions
- One module per directory under /src/modules/
- Each module exports a public interface from /src/modules/<name>/index.ts
- Internal module code (not for cross-module access) lives in /src/modules/<name>/internal/
- Tests live alongside code: <file>.test.ts
- Migrations are in /migrations/, sequentially numbered, reviewed by Engineering Lead
- Use canonical glossary terms only (per Contracts Pack GLOSSARY v5.1) — `medication_request` not `prescription`, `Mode 1` / `Mode 2` not `chatbot`
- Tenant context resolved at request time via middleware; available via `req.tenantContext` in route handlers

## Workflow
1. Read the slice PRD for what you're building
2. Read the relevant Tenant Threading Addendum section if slice is v1.0
3. Implement state machine transitions per State Machines v1.1
4. Implement endpoints per OpenAPI v0.2
5. Reference CDM v1.2 for entity schemas (do NOT author new schemas — flag via §12 escalation if needed)
6. Emit domain events per DOMAIN_EVENTS v5.1 envelope (with tenant_id)
7. Emit audit events per AUDIT_EVENTS v5.1 envelope (with tenant_id)
8. Write tests covering happy path + tenant-isolation cases (cross-tenant access denied) + state-machine guards
9. Submit PR; CI runs lint, type-check, tests, OpenAPI validation, schema migration validation
10. PR review by another engineer + design review if UI surface

## When stuck
- Spec ambiguous? Use §12 SI/DSI escalation pattern
- Architectural decision needed? Engineering Lead
- Clinical safety question? Tenant Clinical Lead (or Platform Clinical Governance for cross-tenant)
- Privacy / break-glass question? Platform Privacy Officer
- AI behavior unexpected? Platform AI Safety
- Performance issue? Document, profile, then bring to Engineering Lead

## Specific gotchas
- A subscription with same patient_id but different tenant_id is two distinct entities. Cross-tenant patient identity does NOT federate at launch.
- Idempotency keys are tenant-scoped per IDEMPOTENCY contract v5.1. Same key in different tenants is independent.
- Domain event partition_key for tenant-scoped aggregates is composite (tenant_id:aggregate_id) per DOMAIN_EVENTS v5.1.
- Error envelopes for resource-not-found are tenant-blind (do not differentiate "doesn't exist" vs "exists in another tenant"). I-025.
- DIC v1.0 is PROVISIONAL — frontend builds without pixel-exact-match to design files until those are delivered. See DIC PROVISIONAL STATUS NOTICE.
```

### Skills

Project-specific skills directory `~/.claude/skills/` should include:

| Skill | Purpose |
|---|---|
| `tenant-scoped-endpoint` | How to scaffold a tenant-scoped endpoint with RLS-friendly query construction, audit emission, error envelope hygiene |
| `state-machine-transition` | How to implement a state machine transition with guards, idempotency, audit, domain event emission |
| `migration-with-rls` | How to author a migration that adds a tenant-scoped table with RLS policy |
| `slice-implementation` | How to read a slice PRD and produce the corresponding code structure |
| `audit-emission` | How to emit audit events with correct envelope and tenant context |
| `notification-emission` | How to fire notifications through the channel hierarchy with tenant variant resolution and privacy redaction |

Each skill is a `SKILL.md` file with concise (under 200 line) instructions Claude Code reads when relevant.

### Hooks

Hooks run scripts deterministically at specific Claude Code workflow points. For this project:

| Hook | Trigger | Action |
|---|---|---|
| `pre-commit` | Before any commit Claude attempts | Run lint, type-check, fast unit tests |
| `post-edit-on-migration` | After editing /migrations/ | Run `prisma generate` and `prisma migrate diff --exit-code` |
| `pre-write-secret-scanner` | Before writing any file | Scan for API keys, tokens, passwords; block if found |
| `post-edit-openapi` | After editing OpenAPI YAML | Validate with `swagger-cli validate` |
| `pre-tool-bash-protected-paths` | Before bash commands touching `/migrations/` or `/audit/` | Require explicit confirmation |
| `post-edit-tenant-scoped-table` | After editing migrations affecting tenant-scoped tables | Verify RLS policy is present |

Configure in `.claude/settings.json`. Hooks are deterministic — unlike CLAUDE.md instructions which Claude *should* follow, hooks always run.

---

## §14 AI multi-agent orchestration — for both development AND the product

(Preserved from v1.0; lightly updated for v1.1 to reference ADR-020 LLM provider abstraction.)

The platform uses AI in two modes per AI Clinical Assistant Slice §4 and AI-LAYERING contract:
- Mode 1: conversational assistant under §13.2 guardrails (informational, no medical decisions)
- Mode 2: protocol execution agent under §13.1 governance (clinical decisions, gated)

Both modes go through the LLMProvider abstraction per ADR-020. Default provider is Anthropic Claude. Provider switching is configurable without code changes (env config + tenant config). Per-tenant provider selection enables Heros to use a different provider than Telecheck-Ghana if desired (operational decision).

Non-clinical AI (admin backend operator features per Admin Backend v1.1 §5.7) also uses LLMProvider abstraction; can use lower-cost / self-hosted alternatives where preferred.

---

## §15 Engineer-facing risk register

| Risk | Mitigation |
|---|---|
| Multi-tenant data leak | RLS + per-tenant KMS + app-layer middleware (defense in depth); RLS lint per OR-252; cross-tenant test in CI |
| Pharmacy adapter integration delays | Adapter framework + conformance test suite (OR-261); start with one US + one Ghana adapter; expand from there |
| LiveKit self-host operational burden | Operational runbook (OR-256); migration trigger to managed alternative (OR-313) if burden too high |
| Faster-Whisper GPU cost or latency | Migration trigger to commercial provider (OR-312) |
| Stripe / Paystack integration edge cases | Integration test suite (OR-247); manual reconciliation processes for edge cases |
| ~~Heros data migration risk~~ | **REMOVED v1.2** — Heros launches greenfield per HIGH-12 decision; no migration risk applies. |
| Design–engineering drift | Design Implementation Contract v1.0 §6 visual regression; DSI process; per-sprint design review |
| Tier-1 ecom scope creep | Master PRD v1.9 §5.1 scope is fixed; new tenant requests beyond scope deferred to Phase 2 |
| US states regulatory complexity | Single-state launch first (most likely California or New York based on Heros' migration source); other states gated post-launch per market launch contract |
| Tenant brand color contrast violations | Brand validation per DIC §11.3 enforced at upload |
| AI provider availability or cost shock | LLMProvider abstraction (ADR-020) — configurable switch to alternative provider |
| Clinical safety incident | Interaction engine gate, SAFETY_HOLD, audit-everything; clinical safety case (OR-004) and threat model (OR-001) closed before launch |

---

## Document control

- **v1.3 cycle additions — 2026-05-02 (per v1.10.1 hygiene cycle physical merge of Phase5 delta Group 5E, Rows 30 + 91):** Tenant identifier naming convention documented per Master PRD v1.10 §17 (C3 brand-structure cascade): operating tenants follow `Telecheck-{country}` naming (e.g., `Telecheck-US`, `Telecheck-Ghana`); these identifiers are the values written to `tenant_id` columns and used in API path scoping (`/tenants/{tenant_id}/...`), platform-admin UI, audit envelopes, RLS policies, and KMS key naming. Consumer DBA `Heros Health` is country-instanced via subdomains (`heroshealth.com`, `ghana.heroshealth.com`); consumer DBA is what patient-facing surfaces render via design tokens (per Design System v1.1 v1.10 cycle additions Row 33). Cross-reference to Master PRD v1.10 §10.5 added as the architectural anchor for program catalog work — engineers building Programs (e.g., GLP-1 weight management) implement `ProgramCatalogEntry` (TYPES v5.2) at the platform level + `ProgramMarketPolicy` for per-market activation + Forms Engine four-layer model (Pattern A immutable per-market form versions); CCR runtime resolves operational config per `country_of_care`. Body content otherwise preserved at v1.3 baseline.
- **v1.3** — Region migration per ADR-026 (supersedes ADR-025), Cycle U-003 of US Region Migration workstream. Region pair updated throughout from `af-south-1`/`us-east-1` (DR) to `us-east-1`/`us-west-2` (cold DR): hosting decision summary; RDS Multi-AZ region; S3 region and cross-region replication target; §4.10 Infrastructure layer header; hosting summary line; cost ADR ref; Sprint 0 day 2 Terraform task region; hard rules / risk register region statement. Parent-document header bumped to Master PRD v1.9 / System Architecture v1.2 / ADR Addendum 026 added. Body cross-refs to Master PRD §X and System Architecture §X updated to v1.9 / v1.2. No sprint plan changes (Heros launch is greenfield in us-east-1 from day one; no af-south → us-east migration sprint). RTO/RPO targets and DR strategy reflect cold-DR posture per ADR-026 (System Architecture v1.2 §11.3 governs). All other content preserved unchanged.
- **v1.2** — Remediation revision per Adversarial Counsel Review v1.0 findings HIGH-08 (restore Day-1-7 plan as §10a; preserve sprint plan as §10b), HIGH-09 (restore embedded CLAUDE.md template in §13), MEDIUM-16 (rewrite §7 — schemas now in CDM v1.2 §4-bis; engineering implements per CDM, does not author), LOW-20 (add v1.0→v1.1→v1.2 section number mapping table). Plus HIGH-12 follow-through: Heros migration work stream removed; timeline revised 26w → 24w; Sprint 11 repurposed for hardening + launch prep. References throughout updated to current canonical artifact versions (CDM v1.2, OpenAPI v0.2, State Machines v1.1, Master PRD v1.8, Contracts Pack v5.1, RBAC v1.1, Tenant Threading Addendum v1.0). Anti-compression rule satisfied: v1.0 was 938 lines, v1.1 was 639 lines (the original HIGH-08 + HIGH-09 finding), v1.2 restores content and adds, expected to exceed v1.0 length.
- **v1.1** — Supersedes v1.0. Incorporates multi-tenancy + Tier-1 ecom + dual-market scope expansion ratified across Sessions 1–3 of the expansion. Revised tech stack per ADR-022 (native-first / open-source-first / self-hosted-first; full 31-row provider matrix). Multi-tenancy Model A per ADR-023. Country-driven config per ADR-024. AWS hosting per ADR-025. Tier-1 ecom scope per Master PRD v1.8 §5.1. 22-26 week revised timeline per Master PRD v1.8 §6. Engineering deliverables for 8 new entities (Subscription, SubscriptionEvent, ProductCatalog, Cart, CartItem, DiscountCode, AffiliateAccount, AffiliateConversion) detailed. ~~Heros migration tooling Phase 2 per Master PRD §5.2.~~ (per v1.2: Heros migration removed from scope.) Design Implementation Contract v1.0 referenced as canonical authority for design–engineering boundary. Sprint plan revised to 13 sprints × 2 weeks = 26 weeks. Hard rules expanded to 15. OR Tracker v1.4 alignment. Preserves v1.0 architectural spine, work stream pattern, and engineering discipline rules where applicable.
- **v1.0** — Initial Engineering Handoff & Build Guide. Single-tenant, 16w timeline, original stack. Superseded by v1.1 on 2026-04-25.
- **Next review:** after Sprint 0 completes; after first slice (Forms Engine v2.X) reaches definition of done; after first patient acquisition campaign starts in Heros greenfield context.
- **Change discipline:** changes to tech stack (§4), sprint sequencing (§10), hard rules (§11), or engineering deliverables for new entities (§7) require Engineering Lead + Product Lead sign-off and must be reflected in the corresponding upstream document (ADR, Master PRD, slice PRD).
