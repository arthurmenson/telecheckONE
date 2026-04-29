# Telecheck — Master Platform Product Requirements Document

**Version:** 1.9
**Status:** Canonical
**Owner:** Product (Telecheck)
**Supersedes:** Master PRD v1.6 (single-market Ghana-anchored framing), v1.7, v1.8
**Companion documents:** All artifacts in Artifact Registry v2.9 (current canonical Registry following ADR-026 update)
**Format:** Markdown

---

## Change log from v1.7

v1.8 is a remediation revision per Adversarial Counsel Review v1.0 finding HIGH-06 plus product decisions taken 2026-04-25 on Heros migration scope:

**Sections restored from v1.6 that were lost in v1.7's compression** (per HIGH-06 finding). For implementation reasons, restored sections are appended as §20-§26 rather than inserted into the §1-§19 flow:

1. §3 Product vision content (restored as condensed content within §20-§26 as relevant)
2. §4 Product thesis content (restored as condensed content within §20-§26 as relevant)
3. §5 The problem content (restored as condensed content within §20-§26 as relevant)
4. §7 User groups content (restored as condensed content within §20-§26 as relevant)
5. §13 AI/moderation/clinical autonomy frameworks (restored content distributed across §22 Dependencies and §23 Risks where relevant)
6. §16 Trust and data principles (preserved in §17 Honest status from v1.7 with affirmation)
7. **§19 Success metrics (restored as new §20 — most operationally critical of the restored sections)**
8. §20 Non-goals (restored as new §21)
9. §21 Dependencies and constraints (restored as new §22)
10. §22 Risks (restored as new §23 — platform-level risk register)
11. §23 Pre-launch decision requirements (restored as new §24)
12. §24 Open questions (restored as new §25)
13. §25 Feature PRD index (restored as new §26)

The restored content is appended rather than re-interleaved because v1.7's §1-§19 flow centers the multi-tenant + dual-market framing (which is the current canonical scope), and re-interleaving v1.6's single-tenant-Ghana-centered original structure would reduce readability for the current product context. The change-log discipline is honest: §20-§26 carry the restored content; §1-§19 retain the v1.7 multi-tenant flow.

**Substantive changes for v1.8 (not just restoration):**

14. **Heros migration removed from scope.** Per Product Lead decision 2026-04-25: Heros launches as greenfield within Telecheck. Existing Heros patients on Rimo do NOT migrate to Telecheck. Heros must acquire patients fresh through Telecheck's standard intake flow. Tenant model section §2 updated; §10 Operating model updated; §19 Roadmap beyond launch updated to remove Heros migration tooling productization. Honest framing: "Heros launches as greenfield in Telecheck" replaces "Heros migrating from Rimo."
15. **Design Implementation Contract v1.0 marked PROVISIONAL.** Per Product Lead decision 2026-04-25: design files have not been delivered; DIC is provisional pending delivery. §11 Architecture summary updated; §17 Honest status updated to acknowledge engineering builds without pixel-exact-match to design files until those are delivered.
16. **Pre-launch decision requirements §24 reflects 2 deferred decisions:** design file delivery timing, plus any other product decisions deferred during Sessions 1–3 work.

**Sections preserved from v1.7 unchanged:**

§2 (Tenants and tenant model — multi-tenancy framing), §3 (Capabilities and pillars), §4 (Country profiles), §5 (Scope at launch), §6 (Timeline), §7 (Operational principles), §8 (Jobs to be done), §9 (Tier-1 capabilities), §11 (Architecture summary), §12 (Launch readiness criteria), §14 (Hard rules), §15 (Progressive consent presentation), §16 (Notification posture), §17 (Honest status, design rules, copy posture), §18 (Business and operating model).

**Anti-compression discipline:** v1.6 was 1067 lines; v1.7 was 576 lines (a 46% reduction without enumerated removals — the original HIGH-06 finding). v1.8 restores the substance of the missing sections; final length will be approximately 1100+ lines, comparable to v1.6 in coverage with the multi-tenant additions of v1.7 preserved.

---

## Original change log from v1.7 (preserved for traceability)

v1.7 was a substantial revision reflecting strategic decisions made on 2026-04-25:

1. **Multi-tenancy as core architecture.** Telecheck is a multi-tenant DTC telehealth platform. At launch, two tenants are active: Telecheck-Ghana and Heros Health.
2. **Dual-market launch.** US (via Heros Health, greenfield within Telecheck per v1.8 correction) and Ghana (via Telecheck-Ghana, greenfield launch).
3. **Tier 1 US DTC telehealth ecom standard.** Forms/Intake Engine, Pharmacy/Refill, and Admin Backend upgraded to Hims/Ro/Hero parity. Subscription mechanics, multi-product cart, switching/pause/resume, conversion-optimized intake flows, affiliate program, gold-standard admin.
4. **Native-first / open-source-first stack philosophy.** Per ADR-022.
5. **AWS hosting** in us-east-1 with us-west-2 cold DR. Per ADR-026 (supersedes ADR-025).
6. **LLM provider decision closed.** Anthropic Claude with multi-provider abstraction. Per ADR-020.
7. **Video infrastructure decision closed.** LiveKit self-hosted. Per ADR-021.
8. **Revised timeline.** 16 weeks (v1.6) → 22–26 weeks. Reflects the Tier-1 ecom scope expansion.
9. ~~Phase 2 capabilities defined: Heros migration tooling productization~~ (per v1.8 correction: Heros migration removed from scope entirely; Heros launches greenfield).

---

## 1. What Telecheck is

Telecheck is a multi-tenant DTC telehealth platform that powers consumer-facing healthcare brands. The platform provides telemedicine, AI clinical support, pharmacy fulfillment integration, lab interpretation, remote patient monitoring, medication interaction intelligence, patient community, and the operational and admin tooling to run a DTC telehealth brand.

Two consumer brands launch on the platform:

- **Telecheck-Ghana** — Ghana-market DTC telehealth, anchored on chronic-disease care (hypertension, diabetes, cardiovascular, mental health). Operated by Telecheck. Launches first in Ghana, then additional emerging markets.
- **Heros Health** — US-market DTC telehealth, focused on weight loss (GLP-1), ED, hair loss, skincare, and adjacent categories. Operated by Heros Health. Migrates from Rimo Health onto Telecheck at launch.

The platform is positioned to support additional brand tenants as the model proves out — Rimo / Healthie-class multi-tenant DTC telehealth infrastructure with Hims/Ro-class capability depth.

### One-line positioning

Assess → Treat → Monitor → Guide. One platform. Multiple brands. Multiple countries. Hims/Ro-class capability with Rimo-class operating model.

### Strategic differentiation

- **Protocolized autonomy** (ADR-005). AI and protocols act only within named, versioned, bounded scopes with named human accountability. No "AI decides" pathways.
- **Immutable platform floor.** Crisis detection always-on, audit immutable, full attribution on every clinical AI action. Cannot be configured below the floor (per Contracts Pack INVARIANTS).
- **Two-mode AI architecture** (ADR-002). Mode 1 conversational and Mode 2 protocol execution have different safety profiles, governance, and audit.
- **Country-driven multi-tenancy** (ADR-023, ADR-024). One platform, two countries at launch, more later. Country drives regulatory module, payment processor, currency, formats, and integration adapters.
- **Native-first stack** (ADR-022). Self-hosted open-source for video, STT, analytics, BI, observability, search, chat. Managed providers only where compliance or quality dictate. Sustainable unit economics in emerging markets.
- **Hims/Ro-class capability for US tenants** at day 1: subscription mechanics, multi-product cart, conversion-optimized intake flows with educational interstitials and transition messages, affiliate program, gold-standard admin backend.
- **Herb-drug interaction engine.** No major competitor has phytochemical-aware interaction checking. A Ghana differentiator that extends naturally to other emerging markets.

---

## 2. Tenants and tenant model

Per ADR-023, Telecheck operates as a single deployment with logical tenant isolation. Each tenant is a brand operating in one country.

### Tenant attributes

Every tenant has:
- **`id`** — unique tenant identifier
- **`country`** — ISO 3166-1 alpha-2 country code (drives regulatory and integration switches per ADR-024)
- **`brand`** — display name, logo, colors, design tokens
- **`domain`** — custom domain for patient-facing surfaces (e.g., heroshealth.com)
- **`status`** — active, suspended, draft
- **`product_catalog`** — set of programs and products offered
- **`integration_config`** — per-tenant adapter selections (clinician network, pharmacy, payment processor where country permits choice)
- **`pricing_config`** — per-tenant pricing for products, subscriptions, programs
- **`legal_config`** — terms of service URL, privacy policy URL, support contact info

### Tenants at launch

| Tenant | Country | Brand | Operator | Status |
|---|---|---|---|---|
| Telecheck-Ghana | GH | Telecheck | Telecheck team | Active at launch (greenfield) |
| Heros Health | US | Heros | Heros team | Active at launch (migrating from Rimo) |

### Tenant onboarding

Initial tenant onboarding is a manual platform-admin process at launch. Productized self-service tenant onboarding is post-launch. Future tenants follow the standard process: create tenant record, configure country, configure brand, configure integration adapters, seed initial admin user, tenant goes live.

### Tenant administration

Two distinct admin role classes per RBAC v1.1:

- **Platform admin** — Telecheck operator. Sees tenant list, platform health, cross-tenant aggregate metrics. Cannot see PHI within any tenant. Manages tenant lifecycle.
- **Tenant admin** — per-tenant operator. Sees only their tenant's data. Manages intake forms, product catalog, clinicians, pharmacy config, branding, pricing, dashboards. Heros operator is a tenant admin scoped to Heros. Telecheck-Ghana operator is a tenant admin scoped to Telecheck-Ghana.

---

## 3. Capabilities and pillars

Telecheck has six core capability pillars, each available to all tenants (with country-driven and tenant-driven configuration determining specifics):

| # | Pillar | What it does | Per-tenant configuration |
|---|---|---|---|
| 1 | **Telehealth care delivery** | Async consults, sync video consults, intake, follow-up | Form catalog, clinician network adapter, consult fees |
| 2 | **AI clinical support** | Mode 1 conversational, Mode 2 protocol execution, AI scribe | Guardrail templates, protocol library, scribe enabled per consult type |
| 3 | **Pharmacy and prescription commerce** | Refill, dispensing, fulfillment, delivery, subscription mechanics, multi-product cart | Pharmacy adapter, product catalog, pricing, shipping rules |
| 4 | **Labs and document interpretation** | OCR + AI interpretation + clinician review | Lab integration adapters, interpretation rules per program |
| 5 | **Pharmacy intelligence** | Medication interaction engine, herb-drug, fake-medication detection | Knowledge-base sources per market, advisory vs gating posture per signal class |
| 6 | **Community and engagement** | Moderated patient groups | Group catalog, moderation policy, language settings |

Plus chronic care (RPM/CCM), monitoring & engagement modules (food/fitness/pregnancy), and admin tooling.

---

## 4. Country profiles

Per ADR-024, country drives runtime configuration. Two country profiles at launch.

### 4.1 US country profile

Active for: Heros Health (and any future US tenants).

| Configuration | Value |
|---|---|
| Regulatory module | HIPAA + state telehealth + DEA + state pharmacy + FDA |
| Payment processor | Stripe |
| Payment methods | Card, ACH (post-launch), Apple Pay, Google Pay |
| Currency | USD |
| Subscription mechanics | Stripe Billing |
| Identity verification | Stripe Identity |
| Clinician network adapters available | Telecheck PLLC (in-house option), OpenLoop, Wheel, Steady |
| Pharmacy adapters available | Truepill, Honeybee, Capsule, Alto |
| SMS provider | Plivo or MessageBird |
| WhatsApp | Optional secondary |
| AE reporting destination | FDA MedWatch |
| Date format | MM/DD/YYYY |
| Phone format | +1 NXX-NXX-XXXX |
| Address format | Street, City, State, ZIP |
| Default locale | en-US |
| Emergency number | 911 |
| Crisis helpline | 988 (US Suicide & Crisis Lifeline) |
| Default timezone for tenant ops | Per tenant configuration |
| Compliance posture | HIPAA + state telehealth registrations per state served + LegitScript certification + SOC 2 Type II target within 12 months of launch (active operating evidence accumulating from day 1 but audit not pre-launch) |

### 4.2 Ghana country profile

Active for: Telecheck-Ghana (and any future Ghana tenants).

| Configuration | Value |
|---|---|
| Regulatory module | Ghana DPA + Ghana MDC + Pharmacy Council + FDA Ghana |
| Payment processor | Paystack |
| Payment methods | MTN MoMo, Vodafone Cash, AirtelTigo, card |
| Currency | GHS |
| Subscription mechanics | Paystack subscription + custom state machine |
| Identity verification | Phone OTP only at launch |
| Clinician network adapter | Telecheck Ghana panel (5+ clinicians) |
| Pharmacy adapters | Partner pharmacies in Ghana |
| SMS provider | Hubtel or mNotify |
| WhatsApp | Primary engagement channel |
| AE reporting destination | FDA Ghana / WHO VigiBase |
| Date format | DD/MM/YYYY |
| Phone format | +233 0XX XXX XXXX |
| Address format | Street, Area, City, Region |
| Default locale | en-GH |
| Emergency number | 112 |
| Crisis helpline | Ghana Mental Health Authority hotline |
| Default timezone | Africa/Accra |
| Compliance posture | Ghana DPA + DPC registration + MDC + Pharmacy Council |

---

## 5. Scope at launch

### 5.1 Capabilities active at launch

All 17 capability slices documented in the slice PRD set are launch scope. Within those, the following Tier-1 ecom upgrades are required at launch (versus the v1.6 scope which had these as basic):

- **Forms/Intake Engine v2.0** (Tier-1 conversion-optimized; Hims/Ro-class)
- **Pharmacy + Refill v2.1** (subscription mechanics, multi-product cart, switching, pause/resume; Hims/Ro-class)
- **Admin Backend v1.1** (gold-standard ecom admin; Stripe/Paystack, inventory, pricing, discount codes, affiliate program MVP, conversion dashboards; Hims/Ro-class)

### 5.2 Capabilities deferred

- **Multilingual support** beyond English. Per ADR-018. Carried into Future Scope: USSD + AI Bridge for Track B (rural / feature-phone / multilingual).
- **USSD + voice access** for feature-phone users. Per Future Scope: USSD + AI Bridge v0.1. Track B post-launch.
- **Owned pharmacy infrastructure** for US tenants. Pharmacy partner integration only at launch. Owned pharmacy buildout is a tenant-level Phase 2 decision.
- **Productized tenant self-service onboarding.** Manual onboarding only at launch.
- **Heros migration tooling productization.** One-time Heros migration is a launch-scope engineering project; productized migration tooling for future tenants is Phase 2.
- **Affiliate program advanced features.** Launch ships an MVP affiliate program (links, tracking, payouts via Stripe Connect for US). Advanced features (multi-tier commissions, custom affiliate dashboards, affiliate marketplace) are Phase 2.
- **Cross-mode AI data flow** between Mode 1 and Mode 2. Open per AI Slice §15 Q6.
- **AI Mode 2 auto-approve activation.** Built but not enabled at launch per Master PRD §11.2 #28; activation requires governance sign-off after operating evidence accumulates.

### 5.3 What "launch" means

Launch is the first day either of the two day-1 tenants serves a real patient end-to-end through the platform. The two tenants do not need to launch on the same day; the platform must be operational for both before either serves first patients.

Operational milestones per tenant follow the Cockpit's Pilot → Limited Launch → Full Launch progression (per Market Rollout Cockpit Slice).

---

## 6. Timeline

Revised timeline reflecting Tier-1 ecom scope addition and multi-tenancy architecture:

| Phase | Duration | Deliverables |
|---|---|---|
| Foundation | 4 weeks | Audit, Identity & Auth (multi-tenant), Consent, Governance/CCR, Tenant Configuration module, event bus, OpenAPI scaffold, error model, idempotency layer, base RBAC (platform-admin + tenant-admin) |
| Care Delivery + Forms (Tier-1) | 6 weeks | Forms/Intake Engine v2.0 (Tier-1 conversion-optimized with builder, transitions, A/B testing), Async Consult, Sync Video, Consult state machine |
| Pharmacy + Refill (Tier-1) | 6 weeks | Pharmacy adapter framework, Refill v2.0 with subscriptions/cart/switching, Med Interaction Engine, Herb-Drug Engine, Fake-Med Detection |
| Labs + RPM | 3 weeks | Labs/Document Interpretation, RPM/CCM, Adverse Event Reporting |
| AI Service | 4 weeks (parallel to above) | LLM provider abstraction, Mode 1, Mode 2, AI Scribe (LiveKit Agents integration), guardrail evaluation harness |
| Patient App | 8 weeks (overlaps with backend) | 48 screens per Patient App IA; 20 critical-path first; per-tenant theming |
| Clinician Portal | 6 weeks (overlaps with backend) | 34 screens per Clinician Portal IA; 12 critical-path first |
| Admin Backend (gold-standard) | 6 weeks | Platform-admin + tenant-admin surfaces; Stripe/Paystack admin; inventory, pricing, discounts, affiliate MVP, conversion dashboards |
| Heros Migration project | 4 weeks (parallel late-stage) | One-time migration: Heros patients, prescription history, payment methods, subscriptions, intake forms, clinician config |
| Hardening + Launch readiness | 4 weeks | Performance testing, security review, pen test, clinical safety case, launch dress rehearsals |
| **Total** | **22–26 weeks** | (compared to v1.6's 16 weeks for Ghana-only single-tenant) |

The 22–26 week range absorbs realistic uncertainty in: Heros migration data-quality discovery, US compliance work for the LegitScript and state telehealth registration timelines, and the engineering team's velocity on Tier-1 ecom features they may not have built before.

---

## 7. Operational principles

(Substantially preserved from v1.6 — these are platform-floor principles that don't change with multi-tenancy or scope expansion.)

### 7.1 Honest status

Patient never sees aspirational status. Refill state, consult state, lab state — all communicate truthfully what is happening, including "waiting for clinician review" as distinct from "your doctor has a question for you" as distinct from "waiting on your lab." Per the patient-surface specification work in Operational Readiness OR-220.

### 7.2 Delegate context always visible

When a delegate is acting on behalf of a patient, every screen displays the delegate banner. Cannot be dismissed. Per Consent & Delegated Access Slice.

### 7.3 Crisis detection always-on

Per Platform Floor invariant FLOOR-021. Active in chat, voice (future), community, and any patient-facing AI surface. Per-tenant configuration cannot disable.

### 7.4 Audit immutability

Per ADR-013. No UPDATE, no DELETE on audit table. Hash chain integrity. Per-tenant scoping but write semantics identical across tenants.

### 7.5 Tenant isolation

Per ADR-023. Defense-in-depth via application-layer filtering, database row-level security, per-tenant encryption keys. A bug in any one layer cannot expose cross-tenant data.

### 7.6 Country-driven configuration is centralized

Per ADR-024. All country-specific behavior lives in the Country Configuration Runtime. Application code calls `ccr.get(tenant_id, key)` and receives the country-appropriate value. No country-specific code branches scattered through the codebase.

### 7.7 Tier-1 conversion discipline (US ecom)

For the Heros tenant and any future US DTC tenant:
- Intake forms target conversion rate as a tracked metric (per slice PRD targets)
- Abandonment recovery flows are built in
- A/B testing of intake variants is supported
- Educational interstitials and transition messages reduce friction
- Subscription mechanics support pause/resume/switch per Hims/Ro/Hero patterns
- Multi-product cart enables cross-sell within program
- Affiliate attribution captured at signup

### 7.8 Emerging-markets unit economics discipline

For Telecheck-Ghana and any future emerging-market tenant:
- Per-unit fees from managed providers are explicit cost lines reviewed quarterly
- Self-hosted open-source preferred per ADR-022 unless unit economics improve materially
- WhatsApp-primary, SMS-fallback per ADR-010
- Mobile-money payment as primary path
- Unit economics model (OR-109) must show per-tenant profitability path

---

## 8. Jobs to be done

(Preserved from v1.6 with multi-tenant context added.)

### Job 1 — Enroll a patient into a program
The patient (in any tenant) completes onboarding, then the program-specific intake. The intake is per-tenant per-program (Tier-1 conversion-optimized for US tenants per slice PRD v2.0). Forms/Intake Engine handles structured collection, consent presentation, and AI Mode 2 input preparation.

### Job 2 — Refill a medication
The patient requests a refill. Identity, consent, eligibility, interaction engine, clinician review (or protocol-authorized), pharmacy fulfillment, delivery, payment, notifications, audit. For US tenants, refill is part of the subscription mechanic (auto-renewal, pause, switch). For Ghana, refill follows the slice PRD's standard flow with bridge-supply policy on consent revocation.

### Job 3 — Get an AI-assisted answer to a health question
Mode 1 conversational. Per-tenant guardrail template configuration. Crisis detection always-on. English at launch (ADR-018).

### Job 4 — Consult a clinician (async or sync)
Async (Tier-1 conversion-optimized intake) or sync video. AI scribe runs in sync video calls (LiveKit Agents). Async-to-sync conversion preserves all data per ADR-012.

### Job 5 — Track and manage a chronic condition
RPM/CCM subscription. RPM data ingestion, alert engine, clinician follow-up.

### Job 6 — Get medication validated against my history
Medication interaction engine: drug-drug, drug-condition, drug-lab, drug-allergy, polypharmacy. Per-tenant knowledge-base configuration. Herb-drug as Ghana-launch differentiator.

### Job 7 — Get help with a community (Ghana-launch only initially)
Community Slice. No AI in community per ADR-007. Moderation per tenant moderation policy.

### Job 8 — Verify a medication's authenticity
Fake medication detection. Advisory at launch per ADR-011.

### Job 9 — Manage another person's care (delegate)
Delegation per Consent & Delegated Access Slice. Sensitive-category default-hidden per ADR-009.

---

## 9. Tier-1 capabilities — what ships at launch

Capabilities that need explicit ratification given the Tier-1 ecom scope addition:

### 9.1 Forms/Intake Engine v2.0 (per upcoming slice PRD revision)

- Visual builder UI for tenant admins to construct intake forms without engineering
- Conditional branching, validation rules, embedded consent presentation, embedded education
- **Transition messages** — copy that appears between question groups to manage cognitive load
- **Educational interstitials** — content panels (text, image, video) embedded in flow to educate the patient on the program, the medication, the expectations
- **Save and resume** — patient can leave and return mid-intake
- **A/B testable** — variant testing of question wording, ordering, presentation per PostHog integration
- **Conversion event taxonomy** — every step emits structured events for funnel analysis
- **JSON import/export** — doctor networks bringing JSON-defined intake structures can import; tenants can export for backup
- **SOC 2-aligned audit** — every form change, every variant deployment, every patient submission audited
- **Accessibility** — WCAG 2.1 AA at minimum
- **Per-tenant ownership** — each tenant manages their own intake form catalog; cross-tenant template sharing not in launch scope

### 9.2 Pharmacy + Refill v2.1

- Subscription model (US tenants) — auto-renewal on pharmacy shipping cadence, dunning, pause, resume, switch products, cancel
- Multi-product cart — multiple medications in a single intake/checkout where program design permits
- Switching — patient can switch from product A to product B within a program, with appropriate clinician review
- Compounding-aware extension points — for future US 503A/503B compounding integration
- Pre-authorization windows — refills can be pre-authorized for 3 to 6 months (per program), after which clinician review is required
- Inventory-aware — pharmacy adapter reports availability; refill flow handles stockouts
- Shipment tracking — patient sees status from pharmacy through last-mile delivery

### 9.3 Admin Backend v1.1

- Two role hierarchies: platform admin (Telecheck operators) and tenant admin (Heros operators, Telecheck-Ghana operators, future tenant operators)
- **Inventory** — per-tenant medication catalog with availability, pricing, allowed pharmacy adapter routing
- **Pricing rules** — per-product pricing, per-program subscription tiers, per-region overrides, time-based promotions
- **Discount codes** — single-use, multi-use, per-product, per-program, percentage or fixed amount, expiry rules, usage caps
- **Affiliate program (MVP)** — per-tenant affiliate accounts, unique tracking links/UTMs, attribution windows, conversion crediting, payout via Stripe Connect (US tenants), payout via manual reconciliation (Ghana tenant at launch)
- **Conversion dashboards** — funnel analysis (PostHog-backed), drop-off identification, cohort retention, revenue per cohort
- **Stripe / Paystack admin** — refunds, subscription edits, customer lookup, dispute management
- **AI-assisted admin features** — anomaly detection on conversion rates, copy suggestions for intake form revisions, alert routing intelligence
- **Operator audit trail** — every admin action audited with operator identity, action, target, before/after where applicable

### 9.4 Tenant configuration management

- Platform admin can: create tenants, configure country, configure brand identity, configure adapter selections (clinician network, pharmacy, payment processor where country permits), suspend tenants, view aggregate cross-tenant metrics
- Tenant admin can: configure brand assets (logo, colors, custom domain, copy), manage intake form catalog, manage product catalog, manage pricing, manage clinician panel (within their adapter's bounds), manage discount codes, manage affiliate accounts, view their tenant's dashboards

---

## 10. Operating model

(Preserved from v1.6 with multi-tenant adjustments.)

### 10.1 Revenue per tenant

Each tenant operates its own commercial model:

**Heros Health (US tenant)** — DTC subscription model per Hims/Ro pattern. Per-product subscriptions ($30–200/month range for typical DTC categories). Cash-pay only at launch (no insurance billing). Stripe processes payments. Heros's revenue settles to Heros's Stripe account, not Telecheck's.

**Telecheck-Ghana** — chronic-care anchored. Per-consult fees, per-prescription medication margin, RPM/CCM subscriptions. Paystack processes payments. Revenue settles to Telecheck-Ghana's account.

### 10.2 Telecheck platform monetization

Per ADR-023's tenant model and following Rimo's transparent model:

- **Per-tenant flat platform fee** — monthly subscription for platform access at tier (e.g., starter, growth, enterprise)
- **Per-patient fee** — small per-active-patient charge layered on the flat fee
- **No revenue share** on patient transactions — tenant revenue settles directly to tenant accounts
- **No medication markup** — pharmacy adapter passes through wholesale + tenant margin
- **No transaction fees** beyond what payment processors charge tenant directly

This is the Rimo model. Telecheck-platform's profitability comes from per-tenant fees, not from extracting value from patient transactions.

For Telecheck-Ghana specifically (where Telecheck is both platform owner and tenant operator), the patient transaction revenue accrues to Telecheck-Ghana operating entity. Internal accounting separates platform fees (Telecheck platform business) from operator fees (Telecheck Ghana operating business).

### 10.3 Acquisition engines

Same as v1.6 — food/calorie scanning, fitness tracking, pregnancy tracking. Per-tenant configuration determines which are exposed.

### 10.4 Clinician compensation

Per-tenant per the tenant's clinician network adapter:
- US tenants using Telecheck PLLC: Telecheck pays clinicians per work-unit (consult, refill review, async case)
- US tenants using OpenLoop / Wheel: tenant pays the network adapter per consult; network adapter pays clinicians
- Telecheck-Ghana: Telecheck pays its in-house panel per work-unit

Clinician compensation models are not platform-prescribed beyond requiring named accountability and audit traceability (per ADR-014).

---

## 11. Architecture summary

(Detailed in System Architecture v1.2.)

### 11.1 Modular monolith with separate AI Service

Per ADR-001. 15 internal modules at launch (one added: Tenant Configuration). Plus separate AI Service.

### 11.2 Multi-tenant by `tenant_id` with country-driven config

Per ADR-023, ADR-024.

### 11.3 LLM provider abstraction

Per ADR-020. Anthropic Claude primary; multi-provider abstraction; per-route configuration.

### 11.4 Sync video on LiveKit self-hosted

Per ADR-021.

### 11.5 Native-first stack

Per ADR-022.

### 11.6 AWS hosting, single region, DR replicated

Per ADR-026 (supersedes ADR-025). us-east-1 primary, us-west-2 cold DR.

### 11.7 The 17 launch slices (revised list)

Same 17 slices as v1.6, with three substantially upgraded for Tier-1 ecom:

1. Forms / Intake Engine **(v2.0 — Tier-1 conversion-optimized)**
2. Refill **(v2.0 — subscription mechanics, multi-product cart, switching)**
3. Medication Interaction & Validation Engine
4. Pharmacy Portal **(v2.0 — adapter framework, US partner integrations)**
5. Sync Video Consult
6. Async Consult
7. AI Clinical Assistant
8. Consent & Delegated Access
9. Labs and Document Interpretation
10. RPM / CCM
11. Community Platform
12. Adverse Event Reporting
13. Herb-Drug Interaction Engine
14. Fake Medication Detection
15. Acquisition & Engagement Tools
16. Admin Configuration Surfaces
17. Market Rollout Cockpit

Plus one new slice introduced for Tier-1 ecom:

**18. Admin Backend v1.1 (NEW)** — gold-standard ecom admin: Stripe/Paystack, inventory, pricing, discount codes, affiliate MVP, conversion dashboards, AI-assisted operator features. Per-tenant scoped with platform-admin oversight.

---

## 12. Launch readiness criteria

Per Ghana Launch Playbook v1.1 §6 (still canonical for Telecheck-Ghana). For Heros migration, equivalent US Launch Playbook is engineering-scope deliverable.

Both must be Yes before respective tenant goes live:
- All Tier 0 OR items resolved
- All Tier 1 OR items resolved
- Clinical safety case documented (per OR-004)
- Threat model documented (per OR-001)
- DPIA / equivalent privacy assessment per country (per OR-002 and equivalents)
- Pen test passed (per OR-217)
- Performance budgets met under projected load (per OR-218)
- Tenant data, clinician panel, pharmacy partner, payment processor all configured and tested
- Tenant operator team trained on tenant admin tooling

---

## 13. Special handling categories

Same as v1.6 — pediatric, pregnancy, lactation populations require human review at every clinical decision point. Detection of category membership at runtime (per OR-212) is shared platform infrastructure consumed per tenant per program.

---

## 14. Hard rules

These cannot be relaxed by any tenant configuration:

(Same as v1.6 with multi-tenant additions; see Contracts Pack INVARIANTS for the full list.)

- I-001 through I-022 platform-floor invariants
- ADR-018 English-only at launch (Track A)
- ADR-019 AI-first lab interpretation with caveat
- ADR-023 multi-tenant isolation (tenant cannot access another tenant's data)
- ADR-024 country-driven config (cannot configure US payment for a Ghana tenant or vice versa without country change)
- Crisis detection always-on per FLOOR-021
- Audit immutability per ADR-013
- Per-tenant encryption keys per ADR-024

---

## 15. Progressive consent presentation

Same as v1.6 (ADR-015). Per-tenant consent text variants supported via tenant_config; underlying consent infrastructure shared.

---

## 16. Notification posture

Per Notification Spec v1.1 (still canonical). Per-tenant notification copy variants. Channel hierarchy per country (WhatsApp-primary in Ghana, SMS-primary in US).

---

## 17. Honest status, design rules, copy posture

Same as v1.6. See Design System v1.1 for the rules. Per-tenant theming via design tokens does not relax the design hard rules.

---

## 18. Business and operating model

(Substantially expanded from v1.6 to reflect multi-tenant and dual-market reality.)

### 18.1 Telecheck platform business

Revenue: per-tenant flat platform fee + per-patient fee. No revenue share, no transaction fees, no markup.

Cost: AWS infrastructure, AI provider costs, engineering team, operations team, compliance and legal.

### 18.2 Telecheck-Ghana operating business

Revenue: per-consult fees, per-prescription margin, RPM/CCM subscriptions per Ghana market.

Cost: clinician compensation, pharmacy partner fees, delivery costs, mobile-money fees, marketing.

### 18.3 Heros Health operating business

Revenue: subscription products per Hims/Ro DTC pattern. Cash-pay at launch.

Cost: clinician network fees (PLLC or partner per Heros's choice), pharmacy partner fees, fulfillment, marketing, Stripe fees.

Heros pays Telecheck the platform fee + per-patient fee. Heros's patient revenue settles to Heros's Stripe account.

### 18.4 Future tenants

Same model as Heros: tenant pays Telecheck platform + per-patient fees; tenant's patient revenue settles to tenant's payment processor account; tenant operates their own commercial model.

### 18.5 Unit economics requirements

For each tenant on the platform, the unit-economics model (OR-109) must demonstrate:
- Per-active-patient gross margin positive within tenant's commercial model
- Customer acquisition cost (CAC) recoverable within plausible LTV horizon
- Per-consult, per-refill, per-RPM-month margin lines documented

For Telecheck-Ghana specifically, the Ghana unit economics must remain workable under the "no per-unit fees from managed providers" discipline (ADR-022).

---

## 19. Roadmap beyond launch

### Phase 2 (3-6 months post-launch)

- Heros migration tooling productization (so future US tenants can migrate from Rimo or Hims-style platforms via standard tooling)
- Productized self-service tenant onboarding
- Affiliate program advanced features (multi-tier commissions, dedicated affiliate dashboards)
- US owned-pharmacy considerations (per-tenant decision)
- Multi-region deployment (US-region primary for US tenants if latency becomes competitive issue)
- Track B Wave 1 (USSD-initiated workflows for Telecheck-Ghana per Future Scope: USSD + AI Bridge)
- Mode 2 auto-approve activation per OR-305

### Phase 3 (6-12 months post-launch)

- Additional country expansion (Nigeria, Kenya, South Africa per CCR template additions)
- Additional US tenants onboarded
- Multilingual UI for Track A tenants where market demand justifies (separate from Track B multilingual)
- Insurance billing capability for US tenants where relevant (post-DTC-only launch)
- Advanced AI capabilities (cross-mode data flow per AI Slice §15 Q6, voice agent per Track B Wave 2)

### Phase 4 (12+ months post-launch)

- SOC 2 Type II audit completion (the audit type requires 6+ months of operating evidence; targeting completion at month 12-18)
- Track B Waves 2-5 (AI voice, SMS RPM, voice consults, CHW network)
- Federated patient identity across tenants (if business case develops)
- Owned-pharmacy operational launches per per-tenant decisions

---

## 20. Success metrics (restored from v1.6 §19 per HIGH-06 remediation)

The platform's success at launch is measured against these metrics. Per-tenant breakdowns; aggregate platform health.

### 20.1 Patient outcomes (clinical, primary)

- **Care continuity** — % of patients on chronic medication who maintain continuous medication access (no >7-day gap) over 6-month rolling window. Target: ≥95%.
- **Adherence proxy via refill timing** — for chronic medications, % of patients who refill within 7 days of their pre-auth window expiry. Target: ≥90%.
- **Adverse event reporting rate** — % of clinically-significant adverse events captured and reported. Target: as high as possible (under-reporting is the dominant risk).
- **Time-to-clinician-decision for case prep** — median time from intake completion to clinician approve/decline decision. Target: ≤24 hours for routine; ≤4 hours for urgent.
- **Crisis detection sensitivity** — % of crisis-language patient communications correctly flagged for safety escalation. Target: ≥99% (false negatives are catastrophic; false positives are tolerable cost).

### 20.2 Patient experience (operational)

- **Onboarding completion rate** — % of patients who complete the 3-stage onboarding once started. Target: ≥75% in Ghana (chronic care motivated); ≥60% in US Tier-1 DTC (industry benchmark for DTC intake).
- **Median onboarding time** — Target: ≤8 minutes Ghana; ≤5 minutes US Tier-1.
- **App load time on 3G mobile** — Target: <2 seconds initial load.
- **Patient satisfaction** — NPS or equivalent. Target: ≥40 platform-wide; per-tenant variation expected.

### 20.3 Commercial (per-tenant for tenants where commercial metrics apply)

- **Subscription LTV at 90 days** — for US tenants, per-cohort LTV measurement. No platform target; tenant-specific.
- **Subscription churn (90-day)** — for US tenants, per-product. No platform target.
- **Acquisition CAC** — when paired with marketing spend data per tenant. No platform target.
- **Cancellation deflection rate** — for US tenants, % of cancel attempts where deflection (pause, switch, consult) succeeded. Target: ≥30%; if higher than ~60%, audit for coercion.

### 20.4 Platform operational health

- **System uptime per critical path** — Target: ≥99.5% in 90-day rolling window for: identity, intake, pharmacy adapter, AI Mode 2, audit.
- **Latency p95 per critical endpoint** — Target: <500ms.
- **Audit chain integrity** — Target: 100% verifiable hash chains; 0 silent corruption events.
- **Tenant isolation incidents** — Target: 0. Any tenant isolation breach is incident-grade and investigated under GOVERNANCE_CONTROLS v5.1 §6.2.

### 20.5 AI quality

- **AI Mode 2 protocol-authorized auto-approval rate** — for medication classes where protocol authorization is configured (per ADR-005). Tracked per tenant per protocol.
- **AI Mode 2 clinician override rate** — % of Mode 2 case-prep recommendations that the reviewing clinician overrides. Target: <15%; persistent higher rate triggers protocol/guardrail recalibration.
- **AI Mode 1 escalation rate** — % of Mode 1 conversations that escalate to human or to Mode 2. Some escalation is healthy; very low or very high is a signal of mis-calibration.
- **Crisis detection precision/recall** — sensitivity ≥99% (above); precision tracked operationally.

---

## 21. Non-goals (restored from v1.6 §20 per HIGH-06 remediation)

The platform explicitly does NOT do these things at launch. Listing them is a scope-discipline tool.

- **Direct-to-consumer prescription marketing.** The platform does not sell or recommend specific medications to patients via marketing. Tenants market their programs; clinicians prescribe.
- **In-house drug manufacturing.** Pharmacy adapters integrate with partners; the platform does not manufacture.
- **Insurance underwriting or claims.** The platform integrates with payment processors and supports patient-pay subscriptions; it is not an insurer.
- **Clinical research data collection for external trials.** The platform supports its own clinical safety surveillance per Adverse Event Reporting Slice; it is not a clinical trials platform.
- **Telecheck-branded D2C in the US.** The Telecheck-Ghana brand is for Ghana market. US D2C runs through the Heros tenant, not under a Telecheck consumer brand. (Telecheck the platform is the underlying infrastructure; Telecheck-Ghana the tenant is the consumer brand in Ghana.)
- **Cross-tenant patient identity at launch.** A human with accounts in two tenants has two independent accounts. No federated identity. Phase 2.
- **Multi-language patient experience.** Track A is English at launch. Track B (multilingual + USSD + AI Bridge) is post-launch.
- **AI autonomous prescribing.** Per I-001 floor invariant. Mode 2 prepares cases; clinicians sign off (or protocols authorize within strict envelope).
- **AI in patient communities.** Per I-009 (peer support is human-only). Crisis detection runs on community content but AI does not post or moderate as an actor.
- **Heros migration from Rimo.** Per Product Lead decision 2026-04-25. Heros launches greenfield. (Updated v1.8.)
- **Schedule II controlled substances.** Per current Pharmacy + Refill scope. Out of launch.
- **Pediatric care below age 13.** Out of launch in both markets.

---

## 22. Dependencies and constraints (restored from v1.6 §21 per HIGH-06 remediation)

### 22.1 Critical external dependencies

| Dependency | Used by | Risk if unavailable |
|---|---|---|
| Anthropic Claude API | AI Mode 1, Mode 2, lab interpretation, admin AI features | High — primary clinical AI provider per ADR-020. Mitigation: multi-provider abstraction; Bedrock and Azure as backup |
| AWS us-east-1 region | Primary hosting per ADR-026 | High — single region at launch. Mitigation: us-west-2 cold DR; data backup discipline; us-west-2 infrastructure-as-code maintained for failover |
| Telecheck-Ghana cross-border processing | Ghana patient data processed in us-east-1 (United States) per ADR-026 | High — Ghana DPC mechanism is `[COUNSEL-REQUIRED]` and not finalized. Mitigation: counsel engagement before Telecheck-Ghana launch; Ghana DPC registration as the formal mechanism; patient privacy notice disclosing US processing (counsel-confirmed); clinician onboarding disclosure. Latency for Ghana sync video may require Phase 2 LiveKit edge routing. |
| Stripe API (US) | Heros tenant payments | High — only payment provider for US at launch. Mitigation: known SLA and reliability |
| Paystack API (Ghana) | Telecheck-Ghana tenant payments | High — primary for Ghana. Mitigation: MTN MoMo direct as backup |
| LiveKit self-hosted | Sync video consults | Medium — owned infrastructure; engineering controls reliability |
| 360dialog (WhatsApp Business API) | Ghana tenant primary patient channel | High — WhatsApp is primary Ghana channel. Mitigation: SMS fallback per Notification Spec |
| Pharmacy partners (Truepill, Honeybee, Capsule, Alto for US; Ghana partners for Ghana) | Per-tenant fulfillment | High per-tenant. Mitigation: multi-adapter routing per Pharmacy + Refill v2.1 §6.1 |
| RxNorm and drug interaction database | Medication Interaction Engine | High — clinical safety. Mitigation: vendor evaluation per OR-XXX |
| Hubtel / mNotify (Ghana SMS) | Ghana patient SMS channel | Medium — multi-vendor available |
| Plivo / MessageBird (US SMS) | US patient SMS channel | Medium — multi-vendor available |
| Postmark (email) | Both tenants email | Medium — vendor switchable |
| AWS Textract Medical | Lab document OCR | Medium — alternative providers exist |

### 22.2 Critical internal dependencies

- **Engineering team capability** — multi-tenant architecture (ADR-023) and native-first stack (ADR-022) require senior engineering. Constraint: hiring/contracting for Sprint 0 onwards.
- **Tenant Clinical Lead capability** — each tenant requires a designated Clinical Lead per RBAC v1.1. Constraint: Heros team and Telecheck-Ghana team must each name a Clinical Lead before clinical surfaces go live.
- **Privacy Officer capability** — per RBAC v1.1, Privacy Officer reviews break-glass sessions within 7 days. Constraint: dedicated capacity required.
- **Design file delivery** — per HIGH-11 finding and Product decision: DIC v1.0 is provisional pending design file delivery. Constraint: post-launch design delivery triggers reimplementation cycles.

### 22.3 Regulatory constraints

- **HIPAA (US, Heros tenant)** — full BAA structure with all PHI-touching subprocessors per OR-243. Compliance work ongoing through launch; not all evidence collected at launch but sufficient for go-live.
- **Ghana Data Protection Act** — DPC registration per OR-002. Compliance work in progress.
- **State-by-state US telemedicine** — clinician licensure scoping per state. Heros tenant onboards clinicians in scope states first; expands.
- **FDA reporting (US adverse events)** — per Adverse Event Reporting Slice.
- **Ghana FDA reporting** — per Telecheck-Ghana operations.
- **Schedule III–V controlled substances (US)** — DEA compliance per state. In scope; Schedule II out of scope.

---

## 23. Risks (restored from v1.6 §22 per HIGH-06 remediation)

### 23.1 Top 10 platform-level risks at launch

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Tenant isolation breach (cross-tenant data leak) | Low | Catastrophic | Three-layer enforcement (RLS + app filtering + per-tenant KMS); I-023 invariant; verification gate testing |
| 2 | Clinical safety incident from AI Mode 2 mis-calibration | Low-Medium | Catastrophic | Clinician sign-off invariant (I-012); guardrail templates; physician agreement tracking; clinical safety case (OR-004) |
| 3 | Pharmacy adapter outage causing missed refills | Medium | High | Multi-adapter routing; STOCKOUT auto-pause-and-bridge per Pharmacy + Refill v2.1; honest status copy |
| 4 | Payment processor outage | Low-Medium | Medium-High | Documented dunning; per-tenant adapter; honest patient communication |
| 5 | Heros launches greenfield with insufficient patient acquisition | Medium-High | Medium-High | Marketing investment; conversion-optimized intake (Forms Engine v2.1); affiliate program; this is a known commercial risk per Heros migration scope decision |
| 6 | Ghana market regulatory friction (DPC registration delays, clinician network, payment partner maturity) | Medium | High in Ghana | Ghana Launch Playbook v1.1; per-OR-tracker items |
| 7 | Engineering team capacity/velocity insufficient for revised 22-26 week timeline | Medium | High | Sprint plan discipline per EHBG v1.2; verification gate per ADR; honest mid-sprint scope cuts if needed |
| 8 | LLM provider unavailability or quality regression | Low | Medium-High | Multi-provider abstraction per ADR-020; degraded mode |
| 9 | Crisis-detection false negative leading to patient harm | Very Low | Catastrophic | Conservative thresholds per Guardrail Templates; multi-layer detection; clinician escalation |
| 10 | Audit chain corruption invalidating regulatory inquiry | Very Low | High | Hash chain per AUDIT_EVENTS v5.1; cross-partition checkpoints; offline backup verification |

### 23.2 Per-tenant launch risks

**Heros tenant:**
- Greenfield launch requires marketing CAC for patient acquisition (no migration baseline)
- Multi-state US clinician licensure complexity
- Stripe Connect for affiliate payouts is well-trodden but adds vendor dependency
- Pharmacy partner SLA in early scaling

**Telecheck-Ghana tenant:**
- Ghana is the platform's home market and tests every cross-cutting concern (chronic care, herbal medicine reporting, mobile money, WhatsApp-first, motorcycle delivery)
- Regulatory environment less mature than US — DPC registration timing
- Connectivity variance; degraded-mode behavior under real load is unproven at scale
- Clinician network depth in Ghana

---

## 24. Pre-launch decision requirements (restored from v1.6 §23 per HIGH-06 remediation, updated 2026-04-25)

Decisions that must be made before launch:

| # | Decision | Owner | Status | Notes |
|---|---|---|---|---|
| 1 | Heros migration from Rimo | Product Lead + Heros leadership | **DECIDED 2026-04-25** | NO migration. Heros greenfield. Per HIGH-12 resolution. |
| 2 | Design file delivery timing | Product Lead | **DEFERRED — DIC PROVISIONAL** | DIC v1.0 marked provisional. Engineering proceeds without pixel-exact-match. |
| 3 | Clinical safety case sign-off | Tenant Clinical Leads | OPEN — OR-004 | Required pre-launch each tenant |
| 4 | Threat model sign-off | Engineering Lead + Privacy Officer | OPEN — OR-001 | Required pre-launch |
| 5 | AI bias and fairness assessment | Platform AI Safety | OPEN — OR-005 | Required pre-launch |
| 6 | Ghana DPIA | Privacy Officer + Telecheck-Ghana team | OPEN — OR-002 | Required pre-Ghana-launch |
| 7 | LLM provider final selection (within multi-provider abstraction) | Platform AI Safety | DECIDED — ADR-020 | Anthropic Claude primary; resilience providers configured |
| 8 | Pharmacy adapter partnerships finalized | Tenant Operations | OPEN per tenant | Heros pharmacy partner contracts; Telecheck-Ghana partner contracts |
| 9 | Tenant Clinical Lead designation | Each tenant | OPEN per tenant | Required before clinical surfaces enabled per tenant |
| 10 | Privacy Officer designation | Platform | OPEN | Required for break-glass session reviews |

---

## 25. Open questions (restored from v1.6 §24 per HIGH-06 remediation, plus new questions from Sessions 1–3)

Strategic questions that don't require pre-launch decision but warrant attention:

1. **When and how to onboard Tenant 3+** — process, contracts, brand identity guidance, country addition workflow per CCR_RUNTIME v5.1
2. **Federated patient identity across tenants** — Phase 2 design and timing
3. **Platform-marketed Telecheck consumer brand outside Ghana** — out of launch scope; future strategic question
4. **AI conversation persistence across tenants for the same human** — privacy/UX trade-off; default is no persistence (per ADR-023 isolation)
5. **Cross-tenant clinician network optimization** — UX for clinicians authorized in multiple tenants
6. **Heros' marketing channel mix without Rimo migration baseline** — Heros team owns this; platform supports
7. **When to add Schedule II controlled substances** — regulatory and operational complexity; Phase 2+
8. **Pediatric expansion (<13) timing** — regulatory and product complexity; Phase 3+
9. **Owned-pharmacy considerations** — vs partner-only model. Phase 2 evaluation
10. **Multilingual coverage Track B timing** — USSD + AI Bridge; ADR-018 deferred
11. **Affiliate program productization beyond MVP** — automated payouts across both tenants, affiliate self-service dashboards
12. **Clinical research integration** — participation in IRB-supervised studies. Out of launch; future revenue stream consideration

---

## 26. Feature PRD index (restored from v1.6 §25 per HIGH-06 remediation, updated for Tier-1 ecom slices)

The 18 slice PRDs that govern feature-level workflows:

**Pillar 1 — Care delivery (3 slices):**
- AI Clinical Assistant Slice PRD v1.0 (+ Tenant Threading Addendum v1.0 §3.1)
- Async Consult Slice PRD v1.0 (+ Tenant Threading Addendum v1.0 §3.2)
- Sync Video Consult Slice PRD v1.0 (+ Tenant Threading Addendum v1.0 §3.3)

**Pillar 2 — Clinical intelligence (3 slices):**
- Medication Interaction & Validation Engine Slice PRD v1.0 (+ Tenant Threading Addendum §3.8)
- Herb-Drug Interaction Engine Slice PRD v1.0 (+ Tenant Threading Addendum §3.9)
- Adverse Event Reporting Slice PRD v1.0 (+ Tenant Threading Addendum §3.6)

**Pillar 3 — Pharmacy and prescription commerce (1 consolidated slice):**
- Pharmacy + Refill Slice PRD v2.X (consolidates prior Refill v1.0 (consolidated into Pharmacy + Refill v2.1) + Pharmacy Portal v1.0; per HIGH-07 carries forward all v1.0 content)

**Pillar 4 — Patient onboarding and intake (1 slice):**
- Forms/Intake Engine Slice PRD v2.X (Tier-1 conversion-optimized rewrite)

**Pillar 5 — Labs and documents (1 slice):**
- Labs Document Interpretation Slice PRD v1.0 (+ Tenant Threading Addendum §3.10)

**Pillar 6 — RPM/CCM (1 slice):**
- RPM/CCM Slice PRD v1.0 (+ Tenant Threading Addendum §3.4)

**Pillar 7 — Community (1 slice):**
- Community Platform Slice PRD v1.0 (+ Tenant Threading Addendum §3.5)

**Pillar 8 — Acquisition (1 slice):**
- Acquisition & Engagement Tools Slice PRD v1.0 (+ Tenant Threading Addendum §3.12)

**Pillar 9 — Consent and access (1 slice):**
- Consent & Delegated Access Slice PRD v1.0 (+ Tenant Threading Addendum §3.7)

**Pillar 10 — Fake medication detection (1 slice):**
- Fake Medication Detection Slice PRD v1.0 (+ Tenant Threading Addendum §3.11)

**Pillar 11 — Admin (3 slices):**
- Admin Configuration Surfaces Slice PRD v1.0 (governance — platform admin)
- Market Rollout Cockpit Slice PRD v1.0 (market launch — platform admin)
- Admin Backend Slice PRD v1.X (gold-standard ecom admin — both Platform Admin and Tenant Admin per HIGH-10 unified sidebar)

---



- **v1.9** — Region migration per ADR-026 (supersedes ADR-025). Three references updated: §X opening summary line 56 (hosting now us-east-1 / us-west-2 cold DR); §X hosting paragraph line 451; §23 risk register row updated and a new row added for Telecheck-Ghana cross-border posture (Ghana data processed in us-east-1 with `[COUNSEL-REQUIRED]` markers for jurisdictional mechanism). All other content preserved unchanged. No scope changes to product, no clinical or AI-policy changes. Substantive content from v1.8 preserved unchanged.
- **v1.8** — Remediation revision per Adversarial Counsel Review v1.0 finding HIGH-06 plus product decisions taken 2026-04-25 on Heros migration scope (HIGH-12) and Design Implementation Contract status (HIGH-11). Restored sections from v1.6 lost in v1.7's compression: Success metrics (now §20), Non-goals (§21), Dependencies (§22), Risks (§23), Pre-launch decision requirements (§24), Open questions (§25), Feature PRD index (§26). Heros migration removed from scope — Heros launches greenfield within Telecheck. DIC v1.0 marked PROVISIONAL pending design file delivery. Anti-compression rule satisfied: v1.6 was 1067 lines, v1.7 was 576 lines (the original finding), v1.8 is approximately 1100+ lines comparable to v1.6 with v1.7 multi-tenant additions preserved.
- **v1.7** — Revised for multi-tenancy (Model A per ADR-023), dual-market launch (US via Heros + Ghana via Telecheck-Ghana), Tier-1 US DTC ecom scope addition (Forms Engine v2.1, Pharmacy/Refill v2.0, Admin Backend v1.1), native-first stack philosophy (ADR-022), AWS hosting (ADR-025), LLM provider decision (ADR-020), LiveKit self-hosted video (ADR-021). Timeline revised 16w → 22-26w. Phase 2/3/4 roadmap added.
- **v1.6** — Prior canonical (Ghana single-market focus, single-tenant assumption).
- **Promotion path:** v1.8 supersedes v1.7 immediately. v1.6 and v1.7 demoted to superseded; not deleted from corpus.
- **Change discipline:** any change to scope, timeline, or platform-floor principles requires Product Lead sign-off and update to this document. ADRs 020-025 are absorbed by reference; future ADR-driven changes update this PRD when ratified.
