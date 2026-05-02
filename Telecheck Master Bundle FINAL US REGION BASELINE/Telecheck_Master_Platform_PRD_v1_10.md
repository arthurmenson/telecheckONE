# Telecheck — Master Platform Product Requirements Document

**Version:** 1.10
**Status:** Canonical
**Owner:** Product (Telecheck)
**Supersedes:** Master PRD v1.6 — v1.9
**Companion documents:** All artifacts in Artifact Registry v2.10
**Format:** Markdown

---

## Change log from v1.9

v1.10 canonicalizes six architectural shifts that emerged during the brand-and-tenant refinement work in session 2026-04-28. The v1.9 source described a multi-tenant platform with Heros Health as a third-party-operated US tenant alongside Telecheck-Ghana. v1.10 makes the operating model explicit: Heros Health is a global consumer DBA for Telecheck-operated DTC across all markets (country-instanced via subdomains); operating tenants follow uniform `Telecheck-{country}` naming; each tenant is a separately incorporated subsidiary; WHO/UN partnerships are anchored at the Telecheck parent level rather than at the consumer brand.

**Six architectural shifts:**

1. **C1 — §21 Non-goals regulatory-conditional rewrite.** Three-axis classification (Regulatory · Architecture · Activation) per non-goal. Future-release markers where activation paths exist.
2. **C2 — Emerging-markets framing reframe.** Category-level "Ghana" claims become "emerging markets"; concrete pilot citations (Ghana DPA, FDA, MDC, Launch Playbook) preserved.
3. **C3 — Brand structure + tenant identifier rename.** "Telecheck" = platform/B2B brand only. "Heros Health" = global consumer DBA, country-instanced via subdomains. Tenant identifiers renamed to uniform `Telecheck-{country}` (US tenant: `Heros-Health` → `Telecheck-US`, operated by Telecheck Health LLC).
4. **C4 — Country-conditional DTC marketing posture (new ADR-027).** Per-country policy in CCR; harm-reduction logic for emerging markets where counterfactual is unmediated pharmacy purchase. New §7.9 operational principle and §13.2 marketing copy governance.
5. **C5 — Research data partnership Posture A as Release 2 goal (new ADR-028).** WHO/UN partnership anchored at Telecheck parent level. New 5th consent tier (research data-use). REC partnership. De-identification engine. DSA template. New §7.10 operational principle and §15 expansion (research data governance).
6. **C6 — Program catalog architecture canonicalization.** Make Design 1 (platform-level program + ProgramMarketPolicy + four-layer Forms Engine + Pattern A + CCR runtime) explicit at the Master PRD level. New §10.5.

**New invariants for v1.10** (renumbered from I-024/025/026 to I-029/030/031 in v1.10 cycle planning freeze v1.5 hotfix to avoid collision with existing canonical I-024 cross-tenant break-glass, I-025 information-leak prevention, I-026 tenant configuration governance, I-027 audit envelope, I-028 single physical region):

- I-029 — research data export requires active DSA + active research consent + k-anonymity threshold ≥ k_min (default k_min=11) met
- I-030 — research consent declination has zero impact on care delivery
- I-031 — research data export is fully audited with cohort definition, k-threshold actually used, requester identity, DSA reference, audit_sensitivity_level: high_pii

(Note: existing canonical I-023 tenant isolation three-layer and I-027 audit envelope continue to apply unchanged. v1.10 does NOT add new tenant-isolation/audit invariants.)

**New ADR files (authored alongside v1.10):**

- ADR-027 Country-conditional DTC marketing posture
- ADR-028 Research data partnership (Posture A) as Release 2 goal

**Sections changed from v1.9:** §1 (tenant intro reframe), §2 (tenant table — uniform Telecheck-prefix naming, consumer DBA explicit), §4 (country profile pills — Heros Health + Heros Health Ghana), §7 (added §7.9 + §7.10), §10 (added §10.5), §13 (split into §13.1 + §13.2 marketing copy governance + new §13.7 AI workload taxonomy per ADR-029 / C7 forward-compatibility), §14 (added new I-029 + I-030 + I-031 research invariants; existing canonical I-023..I-028 unchanged), §15 (expanded with 5 consent tiers + research data governance), §18 (§18.3 heading rename), §19 (Phase 3 country expansion reframe), §21 (regulatory-conditional rewrite per C1), §22 (REC + marketing governance dependencies, research data cross-border posture), §24 (new pre-launch decisions rows 11-18), §25 (sharpened open questions).

**Sections preserved from v1.9 unchanged:** §3, §5, §6, §8, §9 (operational sections); §11 (architecture summary); §12 (launch readiness); §16, §17 (notification posture, honest status); §20 (success metrics); §23 (risks); §26 (feature PRD index).

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
15. **Design Implementation Contract v1.0 → v1.1 promotion folded into v1.10 cycle.** Per Evans's Option B decision 2026-04-28: design handoff received at `telecheck-design-system/` (Patient mock v7 authoritative; HTML/CSS/JSX prototypes from Claude Design); DIC v1.0 → v1.1 promotion lands as one row in the v1.10 traceability matrix (Phase 5.6 / F49) alongside C3 brand-structure cascade. DIC bumps from PROVISIONAL to "Canonical for development" with v7 as binding visual reference; §4.1 / §4.2 pixel-exact-match clauses activate; substitution flags carry forward (Manrope, Lucide, wordmark, photography placeholders to be replaced before customer ship). Pharmacy portal kit gap (not in v1 design system) noted; will be filled when pharmacy slice work begins.
16. **Pre-launch decision requirements §24 reflects updated decision posture:** design file delivery — DECIDED 2026-04-28 (Evans Option B fold-in); no longer deferred.

**Sections preserved from v1.7 unchanged:**

§2 (Tenants and tenant model — multi-tenancy framing), §3 (Capabilities and pillars), §4 (Country profiles), §5 (Scope at launch), §6 (Timeline), §7 (Operational principles), §8 (Jobs to be done), §9 (Tier-1 capabilities), §11 (Architecture summary), §12 (Launch readiness criteria), §14 (Hard rules), §15 (Progressive consent presentation), §16 (Notification posture), §17 (Honest status, design rules, copy posture), §18 (Business and operating model).

**Anti-compression discipline:** v1.6 was 1067 lines; v1.7 was 576 lines (a 46% reduction without enumerated removals — the original HIGH-06 finding). v1.8 restores the substance of the missing sections; final length will be approximately 1100+ lines, comparable to v1.6 in coverage with the multi-tenant additions of v1.7 preserved.

---

## Original change log from v1.7 (preserved for traceability)

v1.7 was a substantial revision reflecting strategic decisions made on 2026-04-25:

1. **Multi-tenancy as core architecture.** Telecheck is a multi-tenant DTC telehealth platform. At launch, two tenants are active: Telecheck-Ghana and Telecheck-US.
2. **Dual-market launch.** US (via Telecheck-US, Heros Health DBA, greenfield within Telecheck) and Ghana (via Telecheck-Ghana, Heros Health Ghana DBA, greenfield launch).
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

Two operating tenants launch on the platform under one country-instanced consumer brand (Heros Health, surfaced as `heroshealth.com` in the US and `ghana.heroshealth.com` in Ghana):

- **Telecheck-Ghana** (operating tenant; Telecheck-Ghana Ltd. trading patient-facing as **Heros Health Ghana** at `ghana.heroshealth.com`) — the emerging-markets pilot. DTC telehealth anchored on chronic-disease care (hypertension, diabetes, cardiovascular, mental health). Validates the platform's emerging-markets architecture before expansion to additional African countries, where Telecheck will operate as `Telecheck-Nigeria`, `Telecheck-Kenya`, etc. — each a separately incorporated subsidiary, all surfacing the unified Heros Health consumer brand at country subdomains.
- **Telecheck-US** (operating tenant; Telecheck Health LLC trading patient-facing as **Heros Health** at `heroshealth.com`) — US-market DTC telehealth, focused on weight loss (GLP-1), ED, hair loss, skincare, and adjacent categories. Heros Health is the global consumer brand for Telecheck-operated DTC, country-instanced via subdomains. Launches greenfield within Telecheck.

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
- **Two business lines, one platform.** Telecheck operates two business lines on the platform. Line 1 — Telecheck operates DTC directly under the global **Heros Health** consumer brand, country-instanced via subdomains (heroshealth.com in the US, ghana.heroshealth.com, etc.). Each country has a separately incorporated Telecheck subsidiary (Telecheck Health LLC for US, Telecheck-Ghana Ltd. for GH, etc.) that operates its country instance as a tenant on the platform. Line 2 — Telecheck licenses the platform to genuinely-external third-party DTC operators in their own markets, who bring their own consumer brands and apps. WHO/UN and other multilateral partnerships are anchored at the Telecheck parent / platform level, not at the Heros consumer brand level.

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
| Telecheck-Ghana | GH | Heros Health Ghana *(consumer DBA; ghana.heroshealth.com)* | Telecheck-Ghana Ltd. | Active at launch (greenfield) |
| Telecheck-US | US | Heros Health *(consumer DBA; heroshealth.com)* | Telecheck Health LLC | Active at launch (greenfield) |

### Tenant onboarding

Initial tenant onboarding is a manual platform-admin process at launch. Productized self-service tenant onboarding is post-launch. Future tenants follow the standard process: create tenant record, configure country, configure brand, configure integration adapters, seed initial admin user, tenant goes live.

### Tenant administration

Two distinct admin role classes per RBAC v1.1:

- **Platform admin** — Telecheck operator. Sees tenant list, platform health, cross-tenant aggregate metrics. Cannot see PHI within any tenant. Manages tenant lifecycle.
- **Tenant admin** — per-tenant operator. Sees only their tenant's data. Manages intake forms, product catalog, clinicians, pharmacy config, branding, pricing, dashboards. The Telecheck-US tenant operator (Heros Health DBA) is a tenant admin scoped to Telecheck-US. The Telecheck-Ghana tenant operator is a tenant admin scoped to Telecheck-Ghana.

---

## 3. Capabilities and pillars

Telecheck has six core capability pillars, each available to all tenants (with country-driven and tenant-driven configuration determining specifics):

| # | Pillar | What it does | Per-tenant configuration |
|---|---|---|---|
| 1 | **Telehealth care delivery** | Async consults, sync video consults, intake, follow-up | Form catalog, clinician network adapter, consult fees |
| 2 | **AI clinical support** | Mode 1 conversational, Mode 2 protocol execution, AI scribe | Guardrail templates, protocol library, scribe enabled per consult type |
| 3 | **Pharmacy and medication-fulfillment commerce** | Refill, dispensing, fulfillment, delivery, subscription mechanics, multi-product cart | Pharmacy adapter, product catalog, pricing, shipping rules |
| 4 | **Labs and document interpretation** | OCR + AI interpretation + clinician review | Lab integration adapters, interpretation rules per program |
| 5 | **Pharmacy intelligence** | Medication interaction engine, herb-drug, fake-medication detection | Knowledge-base sources per market, advisory vs gating posture per signal class |
| 6 | **Community and engagement** | Moderated patient groups | Group catalog, moderation policy, language settings |

Plus chronic care (RPM/CCM), monitoring & engagement modules (food/fitness/pregnancy), and admin tooling.

---

## 4. Country profiles

Per ADR-024, country drives runtime configuration. Two country profiles at launch.

### 4.1 US country profile

Active for: Telecheck-US (Heros Health DBA, and any future US tenants).

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
| Hardening + Launch readiness | 4 weeks | Performance testing, security review, pen test, clinical safety case, launch dress rehearsals |
| **Total** | **22–26 weeks** | (compared to v1.6's 16 weeks for Ghana-only single-tenant; Telecheck-US launches greenfield, no migration) |

The 22–26 week range absorbs realistic uncertainty in: US compliance work for the LegitScript and state telehealth registration timelines; greenfield Telecheck-US patient acquisition lead time (per the Heros migration scope removal — see §change-log v1.7 #14); and the engineering team's velocity on Tier-1 ecom features they may not have built before.

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

For the Telecheck-US tenant (Heros Health DBA) and any future US DTC tenant:
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

### 7.9 Harm-reduction marketing posture for emerging markets

Per ADR-027. The platform's marketing surface posture is country-conditional, governed by per-country policy in the Country Configuration Runtime.

In emerging markets where the regulatory posture permits it and the counterfactual to platform-mediated medication access is unmediated pharmacy purchase, the platform may operate molecule-level marketing surfaces — but only because the safety floor (medication interaction engine, herb-drug engine, fake-medication detection, clinician sign-off) gates fulfillment regardless of acquisition path. Marketing redirects existing demand into a safer channel; it does not create demand the safety infrastructure can't gate.

In the US, molecule-level marketing remains prohibited; Heros Health and any future US tenant operate program-level marketing surfaces under FDA DTC fair-balance rules and state telehealth advertising restrictions.

Marketing copy approval — for any market where molecule-level surfaces are permitted — follows the same governance review cadence as guardrail templates and clinical protocols (per §13.2). A marketing claim about a specific medication is functionally a clinical communication and is reviewed accordingly.

### 7.10 Research data accessibility for emerging-market chronic disease partnerships

Per ADR-028. Telecheck operates as a research data partner (Posture A — population observatory) for WHO, UN agencies, and ethics-governed academic collaborators, with research scope anchored at the Telecheck parent / platform level rather than at the Heros consumer brand.

Patients consent to research data use at the operating-tenant level (via Heros Health surfaces, any country instance) under the fifth consent tier per §15. Consented, de-identified, audited longitudinal data flows through Telecheck-the-parent's governance for partnership use, gated by data-sharing agreements (DSAs) and Research Ethics Committee (REC) oversight.

Trial execution (Posture B) remains a non-goal per §21. Telecheck supplies data to research partners; it does not run interventional trials. The export pipeline is a Release 2 capability per §19. **Fifth-tier consent collection is *gated at launch, not active at launch* (updated 2026-05-02 per Codex Round-4 Scope 3 HIGH-1 finding to align with §15.2 + CCR_RUNTIME v5.2 launch defaults).** US and GH launch with CCR `research_data_partnership_active = inactive`; the 5th-tier consent prompt does NOT render and no `research.consent_*` audit events emit until the per-country `inactive → consent_only` activation gate passes (REC approval reference + ethics-reviewed consent text version pin + Country Launch Director sign-off per MARKET_LAUNCH v5.1). Once `consent_only` is active per country, the consenting cohort accrues from that activation point onward — not from day 1. Subsequent activation to `active` (export pipeline running) is a separate Release 2 gate per §15.2 / §15.3.

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

### Job 7 — Get help with a community (emerging-markets initially; piloting in Ghana)
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

- Two role hierarchies: platform admin (Telecheck-the-parent operators) and tenant admin (Telecheck-US operators, Telecheck-Ghana operators, future tenant operators)
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

**Telecheck-US (Heros Health DBA)** — DTC subscription model per Hims/Ro pattern. Per-product subscriptions ($30–200/month range for typical DTC categories). Cash-pay only at launch (no insurance billing). Stripe processes payments. Revenue settles to Telecheck Health LLC's Stripe account.

**Telecheck-Ghana (Heros Health Ghana DBA)** — chronic-care anchored. Per-consult fees, per-medication-fulfillment margin, RPM/CCM subscriptions. Paystack processes payments. Revenue settles to Telecheck-Ghana Ltd.'s account. Each subsequent African market is a separately incorporated Telecheck subsidiary surfacing the Heros Health consumer brand at a country subdomain (ghana.heroshealth.com today; nigeria.heroshealth.com, kenya.heroshealth.com, etc. as expansion proceeds).

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

### 10.5 Program catalog architecture

The platform supports a single multi-country program catalog with country-specific offerability. This section makes the architecture explicit; it is implemented across the Forms Engine contract, the Market Launch contract, the Market Rollout Cockpit slice, the RPM/CCM slice, and the Country Configuration Runtime.

Five layers, each with distinct authoring and approval semantics:

| Layer | Defined where | Example |
|---|---|---|
| Program (clinical pathway) | Platform-level, once | "GLP-1 Weight Management" · "RPM Diabetes" · "ED" — defined in the platform catalog with intake structure, decision logic, monitoring schedule. |
| Intake form template | Platform-level (per program), with country-locale variants per ADR-004 Pattern A | The structure of the GLP-1 intake; locale-specific copy and regulatory disclaimers per country. |
| Protocol library | Platform-level (clinical pathway), with country-specific activation | Clinical decision logic; named accountable clinician per country; market-specific approval signature. |
| Country runtime | CCR per ISO country code (per ADR-024) | Stripe (US) vs Paystack (Ghana); USD vs GHS; FDA vs Ghana FDA reporting; SMS vs WhatsApp. |
| Offerability | ProgramMarketPolicy per (program × country × tenant) | "GLP-1 is offerable to Telecheck-US patients" / "GLP-1 is offerable to Telecheck-Ghana patients" — independent decisions, both attaching to the same program definition. |

**What this means in practice.** A program is defined once at the platform level. Country-specific availability is a ProgramMarketPolicy authoring exercise, not a re-implementation. Forms inherit clinical structure; only L1 (presentation) and L4 (approval) localize per country, with selective L2 (branching) and L3 (eligibility) edits where regulation, formulary, or locale demand them. The Pattern A versioning rule means each market gets its own immutable form version — three markets running byte-identical GLP-1 intakes still produce three separate version records, each with its own clinical approval chain. That's the price of regulatory provenance, accepted explicitly.

**What this enables.** Telecheck-US (Heros Health DBA) programs (GLP-1, ED, hair loss, skincare) are portable to Telecheck-Ghana and future emerging-market tenants via ProgramMarketPolicy authoring. RPM/CCM programs are portable from Telecheck-Ghana to Telecheck-US — architecturally enabled, contingent on tenant-strategy decision (does the Telecheck-US tenant operator add chronic care to its catalog?). The platform doesn't make that strategy call; it provides the mechanism.

**Reference.** See the Program Porting Checklist (Telecheck-US GLP-1 [Heros Health DBA] → Telecheck-Ghana GLP-1 [Heros Health Ghana DBA]) for a worked example with section-by-section breakdown of what's inherited, adapted, and authored from scratch when a program is brought to a new market.

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

Per Ghana Launch Playbook v1.1 §6 (still canonical for Telecheck-Ghana). For Telecheck-US (greenfield launch under the Heros Health DBA per §change-log v1.7 #14), an equivalent US Launch Playbook is engineering-scope deliverable.

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

## 13. Special handling and governance review

### 13.1 Special handling categories

Pediatric, pregnancy, lactation populations require human review at every clinical decision point. Detection of category membership at runtime (per OR-212) is shared platform infrastructure consumed per tenant per program.

### 13.2 Marketing copy governance (per ADR-027)

For markets where molecule-level marketing surfaces are permitted by country regulatory posture (per §7.9), all marketing copy referencing specific medications follows the **Governance review process** specified later in this section (modeled on the same governance cadence used for guardrail templates and clinical protocols).

**CCR control.** Per-country posture is governed by `molecule_level_marketing_permitted` 3-state enum:

- `prohibited` — fail-closed default. US (Telecheck-US): `prohibited` permanently per FDA + state telehealth advertising rules.
- `pending_evidence` — regulatory engagement underway but `marketing_copy_governance_evidence` not fully populated; molecule-level surfaces remain disabled. Ghana (Telecheck-Ghana) at v1.0 launch: `pending_evidence`.
- `permitted` — full activation. Requires structured `marketing_copy_governance_evidence` object populated: `regulatory_jurisdiction`, `regulatory_authority`, `regulatory_interpretation_artifact_id`, `interpretation_date`, `scope`, `prohibited_claim_classes[]`, `governance_lead_designation_artifact_id`. Plus first molecule-level copy approved through the §13.2 Governance review process below.

**Working definition: molecule-level vs program-level marketing** (per ADR-027 v0.5 Decision §7).

A surface is **molecule-level marketing** if it satisfies any of:
- Names a specific active pharmaceutical ingredient (e.g., "semaglutide", "sildenafil", "tadalafil")
- Names a specific branded product (e.g., "Ozempic", "Wegovy", "Viagra")
- Names a specific dosage or formulation regime tied to a specific product
- Compares specific products by name
- Implies efficacy claims tied to a specific product

A surface is **program-level marketing** if it does NOT satisfy any of the above and instead names a clinical category/program (e.g., "GLP-1 weight management program") without product specifics. Program-level marketing follows standard marketing review (not the §13.2 Governance review process).

Boundary cases (apply working definition with the §13.2 Governance review process; Master PRD §25 tracks borderline-case refinement only):
- Naming a drug class without specific molecules — borderline; governance review decides per copy
- Patient testimonials mentioning a product — molecule-level (the named product is the driver)
- Educational content explaining how a class works — program-level if no specific product named, molecule-level if named

Until borderline cases are individually classified, fail-closed: if uncertain, treat as molecule-level and apply the §13.2 Governance review process.

**Governance review process** (§13.2 internal):

- Drafted by content author with clinical review by Medical Director or designated Clinical Lead
- Regulatory review against country-specific marketing rules per `marketing_copy_governance_evidence.regulatory_authority`
- Triple-sign-off: Marketing copy governance lead + Clinical Safety Officer + Regulatory Affairs Lead
- Re-review on a documented cadence per `marketing_governance_review_cadence_months` (initial cadence: 6 months for high-risk medication categories like GLP-1; 12 months for lower-risk categories)

**Marketing surface controls and audit obligations.** Every molecule-level marketing surface rendered to a patient MUST carry:

- Country policy version (`ccr_marketing_policy_version_id`)
- Approved copy version (`marketing_copy_version_id`) with reviewer identity (`governance_review_reviewer_ids[]`) and approval timestamp
- Rendered-claim traceability: each rendered surface emits a `marketing.surface_rendered` audit event with country, copy version, governance review reference, patient_id (per tenant-isolation), and the specific claim classes rendered
- Drift detection: any deviation between rendered surface and approved copy version triggers `marketing.surface_drift` audit event + immediate suspension of the surface; resolves only via re-review under the §13.2 Governance review process

**Workload taxonomy classification.** Per ADR-029 / WORKLOAD_TAXONOMY contract, marketing copy governance review classifies under governance class **`protocol_authorized`** (named, versioned approval cadence; clinician/regulatory accountability via the §13.2 Governance review process).

The platform safety floor (interaction engine, herb-drug engine, fake-medication detection, clinician sign-off) applies to every fulfillment regardless of acquisition path. Marketing changes acquisition; it does not change clinical authority.

### 13.7 AI workload taxonomy and autonomy progression (per ADR-029)

Replaces the binary "AI Mode 1 / Mode 2" framing of AI-LAYERING (AI-ARCH-001) with a property-based **AI workload taxonomy**.

**Discriminator:** `ai_workload_type` enum, defined exclusively in WORKLOAD_TAXONOMY contract.

**Active workload types at v1.0:**

| Workload type | Description | autonomy_level_range | tool_access | memory_scope | governance_class |
|---|---|---|---|---|---|
| `conversational_assistant` | Patient-facing chat with guardrails. Cannot make clinical decisions. Successor to AI-LAYERING Mode 1. | `[advisory]` only | `[internal_kb_lookup]` | `[session]` | `floor_safety` |
| `protocol_execution` | Async clinical preparation engine within named, versioned protocols. Successor to AI-LAYERING Mode 2. | `[advisory, suggestion, action_with_confirm]` (active); `action_with_audit_only` reserved | `[protocol_kb, lab_lookup, formulary_lookup, interaction_engine]` (descriptive at v1.0; non-normative until ADR-031 / AGENT_TOOLS) | `[patient_episode, program_history]` | `protocol_authorized` |

**Reserved future workload types** (namespace placeholders; require successor ADRs to activate):

- `autonomous_agent` — RESERVED — open-ended multi-step clinical agent. Requires ADR-030 (Tiered Autonomy Progression Model) + AGENT_MEMORY contract (ADR-032) + PolicyAuthorization framework activation. Not implemented at v1.0.
- `multi_agent_supervisor` — RESERVED — multi-agent orchestration. Requires ADR-033 (Multi-Agent Service Split) + MULTI_AGENT_ORCHESTRATION contract.
- `tool_using_agent` — RESERVED — agent specialized for tool invocation. Requires ADR-031 (Agent Tool Contract) + AGENT_TOOLS contract.

**Autonomy level enum** (per AUTONOMY_LEVELS contract):

- `advisory` — AI provides information only; no action authority. Active at v1.0.
- `suggestion` — AI proposes; human selects from options. Active at v1.0 (rare for `protocol_execution`; non-default).
- `action_with_confirm` — AI proposes specific action; human confirms before execution. Active at v1.0; **default for `protocol_execution` per I-012 prescription sign-off**.
- `action_with_audit_only` — RESERVED — AI executes; human reviews via audit. Requires ADR-030 (Tiered Autonomy Progression Model) + PolicyAuthorization framework + I-012 successor invariant + dedicated safety case + Clinical Safety Officer + Privacy Officer + Regulatory Affairs Lead sign-off + per-market regulatory clearance.
- `fully_autonomous` — RESERVED — AI executes without per-action human review (audit chain still mandatory; platform-floor safety gates always apply). Activation prerequisites are a strict superset of `action_with_audit_only`: all `action_with_audit_only` prerequisites PLUS (a) augmented safety case demonstrating residual-risk acceptability without per-action human gating, (b) per-market regulatory clearance specific to fully-autonomous operation (cannot inherit `action_with_audit_only` clearance), (c) Clinical Safety Officer + Privacy Officer + Regulatory Affairs Lead **triple sign-off** at activation and on every material change, (d) named successor invariant superseding I-012 for the action class in scope, (e) any additional gates established by ADR-030 successors. No platform code path may resolve `fully_autonomous` to an executed clinical action until all prerequisites are recorded as satisfied in the activation audit event.

**I-012 preservation rule.** For `medication_request` (prescription), refill, and medication-order actions governed by I-012 (per the canonical INVARIANTS contract entry "I-012 prescription sign-off"), the `protocol_execution` workload may only reach the `executed` state through `action_with_confirm` with an explicit, audit-recorded clinician confirmation event linked to the action.

State machine validation MUST reject any `executed` transition for these actions UNLESS **all** of the following hold:

1. `autonomy_level == action_with_confirm` (string equality; not membership in a set).
2. An explicit clinician confirmation event exists in the immutable audit chain, scoped to this action_id, prior to the transition.
3. The confirming actor holds a role authorized to sign for the action class under RBAC v1.1 / I-012.

Therefore, `executed` MUST be rejected when `autonomy_level ∈ {advisory, suggestion, action_with_audit_only, fully_autonomous}`, when `autonomy_level` is `null` / unknown / absent, or when any required confirmation evidence is missing — including any future enum value not yet authorized by an ADR-029 successor. The reserved levels (`action_with_audit_only`, `fully_autonomous`) cannot reach `executed` for I-012 actions until **both** (a) a successor ADR (ADR-030 or later) explicitly supersedes I-012 for the action class in scope, AND (b) an activation audit event recording the supersession is present in the immutable audit chain. ADR approval alone is never sufficient; the activation audit event is required. There is no implicit fallback path: enum additions made later default to **rejected** for I-012 transitions until an ADR explicitly authorizes them.

This is the single normative source of truth for I-012 + autonomy-level interaction; downstream contracts (STATE_MACHINES, AUDIT_EVENTS, AUTONOMY_LEVELS) and tests MUST mirror this rule exactly.

**AI-ARCH-001 supersession scope** (canonical statement, single source of truth: WORKLOAD_TAXONOMY §5). AI-ARCH-001 remains binding only as: v1.0 has exactly two active workload types, `conversational_assistant` and `protocol_execution`. AI-ARCH-001 no longer prohibits reserved future workload type names from existing in WORKLOAD_TAXONOMY's enum, but any **activation** of a reserved workload type requires successor ADR approval.

**ADR-002 + ADR-005 preservation.** ADR-002 binary AI mode framing remains binding for current Mode 1 / Mode 2 (now relabeled `conversational_assistant` / `protocol_execution`) until separate successor ADR. ADR-005 protocolized autonomy remains binding for `protocol_execution` workload at autonomy_level ≤ `action_with_confirm`. ADR-029 supersedes ADR-002 prospectively for new workload additions only.

**UI / operator-facing terminology** may continue to use "Mode 1 / Mode 2" labels where helpful. Code, schema, audit, and config MUST use the workload taxonomy values (`conversational_assistant`, `protocol_execution`).

**Audit envelope.** Every audit event with `actor.type = ai_workload` carries required fields `ai_workload_type` and `autonomy_level` (nullable only for legacy/backfilled events and non-AI events). Reserved nullable agentic-context fields exist on day one: `agent_id`, `agent_version`, `tool_call_id`, `memory_read_set_id`, `memory_write_set_id`, `supervising_policy_id`, `knowledge_source_versions[]`. These populate only when the corresponding capability activates.

---

## 14. Hard rules

These cannot be relaxed by any tenant configuration:

(Same as v1.6 with multi-tenant additions; see Contracts Pack INVARIANTS for the full list.)

- I-001 through I-028 existing canonical platform-floor invariants (I-023 tenant isolation three-layer; I-024 cross-tenant break-glass; I-025 information-leak prevention; I-026 tenant configuration governance; I-027 audit envelope tenant context; I-028 single physical region — see Contracts Pack INVARIANTS for full list)
- **I-029 (NEW for v1.10)** — research data export 5-condition reject-unless gate (per ADR-028; canonical 5-condition gate per INVARIANTS v5.2 / TYPES v5.2 / AUDIT_EVENTS v5.2 §5 / OpenAPI v0.2 / STATE_MACHINES v1.1; *updated 2026-05-02 per Codex Round-8 Scope 2 HIGH finding from prior 3-condition shorthand to canonical 5-condition gate to remove the standalone-shorthand surface that conflicted with downstream contracts*): (1) `dsa_status_at_export = active`; (2) `k_threshold_actual >= k_min_required` (default k_min=11); (3) `permitted_data_domains_at_export` matches the `research.export_initiated` snapshot (no CCR drift mid-export); (4) `consent_cohort_snapshot_hash_completed = consent_cohort_snapshot_hash_initiated` (cohort unchanged mid-export); (5) every contributing patient has active `ResearchConsent` at completion-time evaluation. Failed delivery MUST emit `research.export_completed(status=invalidated)` with canonical `invalidation_reason` enum value paired with `signal_enforcement_trigger` Category B audit per I-003 (bare suppression forbidden).
- **I-030 (NEW for v1.10)** — research consent declination has zero impact on care delivery
- **I-031 (NEW for v1.10)** — research data export is fully audited with cohort definition, k-threshold actually used, requester identity, DSA reference recorded immutably, audit_sensitivity_level: high_pii
- ADR-018 English-only at launch (Track A)
- ADR-019 AI-first lab interpretation with caveat
- ADR-023 multi-tenant isolation (tenant cannot access another tenant's data)
- ADR-024 country-driven config (cannot configure US payment for a Ghana tenant or vice versa without country change)
- Crisis detection always-on per FLOOR-021
- Audit immutability per ADR-013
- Per-tenant encryption keys per ADR-024

---

## 15. Progressive consent and research data governance

### 15.1 Progressive consent presentation

Per ADR-015. Per-tenant consent text variants supported via tenant_config; underlying consent infrastructure shared.

Five consent tiers, each independent, separately revocable:

1. **Platform consent** — terms of service, privacy policy, account creation. Required to use the platform.
2. **Care + data-use consent** — consent to receive care via the platform and for the operating tenant to process data for that care. Required to enroll in any program.
3. **Delegation consent** — when a delegate is acting on behalf of the patient (e.g., spouse, parent, caregiver). Optional; required only when delegation is exercised.
4. **Jurisdictional consent** — consent to cross-border data processing where applicable (e.g., Telecheck-Ghana patient data processed in `us-east-1` per ADR-026). Required for patients in markets where cross-border processing occurs.
5. **Research data-use consent** — described in §15.2 below. Optional; declining has zero impact on care.

### 15.2 Research data-use consent (fifth tier)

Per ADR-028. The platform offers patients the option to consent to anonymized or aggregated data from their care being shared with public-health and research partners under data-sharing agreements (DSAs). This consent is offered at the operating-tenant level (via Heros Health surfaces, any country instance) and governs research data flow upward to the Telecheck parent for partnership use.

Patient-facing consent text:

> *"Anonymized or aggregated data from your care may be shared with public-health and research partners (such as the World Health Organization, UN agencies, or academic researchers) to help improve health outcomes globally. You can decline this and still receive full care from us. You can revoke this consent at any time, and future data won't be shared (data already shared in aggregate cannot be retracted)."*

Properties of research data-use consent:

- **Optional.** Patients can use the platform without consenting to research data use.
- **Care-independent.** Per invariant I-030, declining research consent has zero impact on care delivery, clinician availability, medication access, or any other care surface.
- **Separately revocable.** Patients can revoke at any time. Future data is not shared after revocation.
- **Asymmetric on retraction.** Aggregate data already shared with research partners cannot be retracted (it has already been combined with other patients' contributions in ways that cannot be reversed). The patient-facing copy is explicit about this asymmetry.
- **Audit-tracked.** Every grant and revocation is audited per AUDIT_EVENTS (`research.consent_granted`, `research.consent_revoked`).
- **Gated at launch, Release 2 actionable.** *(Updated 2026-05-02 per Codex Round-3 Scope 3 HIGH finding to align with CCR_RUNTIME v5.2 launch defaults — was previously stated as "Launch-active".)* US and GH launch with CCR `research_data_partnership_active = inactive`. The 5th-tier consent prompt does NOT render and no `research.consent_granted` / `research.consent_revoked` audit events emit until the per-country `inactive → consent_only` activation gate is satisfied per MARKET_LAUNCH v5.1: REC approval reference + ethics-reviewed consent text version pin + Country Launch Director sign-off. Once `consent_only` is active per country, consent collection accrues from that point; the export pipeline (cohort definition layer, de-identification engine, aggregation layer, DSA enforcement) is a separate `consent_only → active` gate (Release 2 capability per §19) requiring ADR-028 v0.4 quad sign-off (Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer + Product Lead) + REC concurrence + Country Launch Director per-country authority + the full 11-condition MARKET_LAUNCH v5.1 research data partnership activation gate. Any pre-launch decision-table or registry text describing day-1 consent collection is superseded by this entry; reconcile downstream references accordingly.

### 15.3 Research data governance

Per ADR-028 (Posture A — research data partner / population observatory). This subsection defines the governance surface that activates in Release 2.

**Three-state activation model** (per CCR `research_data_partnership_active` enum):

| State | Meaning | What's allowed | What's prohibited |
|---|---|---|---|
| `inactive` | Default at v1.0 launch in any country that has not begun activation | None — patients see no 5th consent prompt; no exports; no DSA enforcement | All research-related flows |
| `consent_only` | 5th consent tier active in patient-facing flow; patients can grant or decline | Patient consent collection per §15.2; consent grant/revoke audit events; care delivery completely independent of consent status (I-030) | Any data export; DSA activation; cohort definition for export; de-id engine invocation |
| `active` | Full Release 2 capability per Activation requirements (per-country gate) | All Posture A in-scope items below | All Posture B items + secondary uses outside DSA scope |

The `consent_only` state addresses the consent-timing concern: consent text MUST clearly state that no exports occur in the `consent_only` state and that future-use governance is the `active` state's DSA + activation gate apparatus.

**Posture distinction (bright-line per ADR-028):**

**In scope (Posture A):** Research data partnership. Telecheck supplies de-identified, audited longitudinal data and aggregated population-level statistics to public-health and academic research partners under DSAs. Telecheck is the data source; partners conduct the research. Permitted data domains are a closed enum: `chronic_disease_longitudinal`, `ncd_surveillance`, `pharmacovigilance_signal`, `population_health_aggregate` — expansion of the enum requires ADR amendment (per ADR-028 Decision §6).

**Out of scope (Posture B — absolute non-goals):**

- Trial randomization, blinding (single/double/triple-blind)
- eCRF-style data collection
- IRB-managed protocols where Telecheck is the IRB-overseen platform
- Sponsor reporting (Telecheck does not become a clinical trial sponsor)
- IND/IDE filings, regulatory submissions on behalf of trial sponsors
- Query resolution, monitoring visits
- Trial-execution-platform business model
- Per-patient interventional protocol execution under research framework
- Drug-development clinical trials, Phase I-IV pharmaceutical clinical trials infrastructure
- **Partner-driven protocolized cohort recruitment** — research partners may specify inclusion/exclusion criteria for de-identified cohort definition (Posture A), but cannot drive recruitment of patients into a partner-defined protocol via the platform's care-delivery surfaces
- **Prospective observational studies that alter or instrument care workflows** — extra labs, patient-reported outcomes, diary entries beyond standard care
- **Post-market studies that change prescribing or follow-up behavior** — pharmacovigilance signal flow (aggregate, audit-trail-driven) is Posture A; behavior-changing post-market protocols are Posture B
- **Partner requests that alter care workflows** — any DSA term requiring care-path differences for consented research participants
- **Patient-level identifiers in any export** — all exports go through de-identification per I-029
- **Secondary uses outside DSA scope** — partner cannot use exported data for purposes not explicitly enumerated in the DSA

The Posture A / Posture B boundary is bright-line. If a proposed feature crosses into Posture B, it requires a separate ADR superseding the relevant scope language in ADR-028.

**Export pipeline (Release 2 capability).** Four layers between consented patient data and external research partners:

1. **Cohort definition layer.** Researchers (or their proxies in the platform admin) define cohorts by clinical criteria without seeing PHI. Cohort definitions are versioned, audited (`research.cohort_defined`), and reviewed against the active DSA's permitted use scope (must match `research_permitted_data_domains` enum).
2. **De-identification engine.** Safe Harbor + k-anonymity per CCR `de_identification_standard` enum. **k-anonymity threshold ≥ k_min with k_min default = 11** at v1.10 acceptance (HIPAA expert-determination low-risk floor). Per-DSA increases permitted (e.g., k=20 for high-sensitivity domains); decreases below k_min prohibited per I-029. Suppression rule: any cohort cell with count < k_min is suppressed in aggregation outputs (not silently merged).
3. **Aggregation layer.** For population-level statistics (prevalence, adherence rates, AE rates, outcome trajectories) where individual-level data is not needed, the aggregation layer produces statistical outputs only. Subject to the same k_min floor.
4. **DSA enforcement.** Every external partner has a signed data-sharing agreement specifying allowed uses, retention, and re-sharing rules. Access is gated on agreement validity. DSA expiry halts the pipeline for that partner per I-029. Cross-border transfer is governed by structured CCR fields per §15.3 below.

**Ethics oversight.** Research Ethics Committee (REC) partnership per CCR `research_ethics_review_body` (structured object with `name`, `jurisdiction`, `approval_reference_id`, `approval_validity_from`, `approval_validity_to`, `approval_scope`, `per_dsa_review_required`). Each market has an in-country ethics body that reviews proposed DSAs and material changes to consent text. Initial REC partnership for Telecheck-Ghana is a pre-launch decision (§24); analogous bodies for future markets onboard alongside country expansion.

**Cross-border posture.** Governed by structured CCR `cross_border_research_transfer_permitted` enum (`prohibited`, `permitted_with_counsel_artifact`, `permitted_unrestricted`) plus companion fields when permitted: `counsel_approval_artifact_id`, `transfer_mechanism`, `recipient_country`, `onward_transfer_policy`, `dsa_alignment_artifact_id`. Activation gate is structured-field completeness, not free-text counsel markers. See §22.3 cross-border posture for jurisdictional details.

**Workload taxonomy classification.** Per ADR-029 / WORKLOAD_TAXONOMY contract, research-data export and aggregation workloads classify under governance class **`autonomy_grant_required`** (each export/aggregation action requires a PolicyAuthorization-equivalent grant — in this case the active DSA + consent + I-029 k-threshold check + REC engagement; multi-party approval chain via DSA + REC engagement; rollback trigger = consent revocation or DSA expiry).

**Partnership level.** Per §7.10 and ADR-028, research partnerships are anchored at the Telecheck parent / platform level rather than at the Heros consumer brand. Patients consent at the operating-tenant level (Heros Health surfaces); data flows through the parent's governance for partnership use; the partnership counterparty (e.g., WHO Africa Region NCD program, UN agency, academic institution) signs a DSA with Telecheck-the-parent.

**Audit posture.** Every research-use export is logged immutably per I-031: cohort definition, requester identity, agreement reference, exported field set, k-threshold actually used, timestamp, audit_sensitivity_level: high_pii (research exports emit at high-sensitivity audit class, not ordinary governance category B). The audit chain is queryable by ethics review boards, regulators, and the partner organization itself for verification. AI-generated / derived patient summaries (Mode 2 outputs / `protocol_execution` workload outputs per ADR-029) are NOT in Posture A export scope by default; inclusion is per-DSA opt-in with explicit consent text + DSA scope + provenance + de-id rules + ADR amendment if regular flow.

---

## 16. Notification posture

Per Notification Spec v1.1 (still canonical). Per-tenant notification copy variants. Channel hierarchy per country: **WhatsApp-primary in emerging markets** (piloting with Telecheck-Ghana on 360dialog), **SMS-primary in US**. Patient-facing notifications surface as the consumer brand (Heros Health / Heros Health Ghana / etc.) — not as Telecheck.

---

## 17. Honest status, design rules, copy posture

Same as v1.6. See Design System v1.1 for the rules. Per-tenant theming via design tokens does not relax the design hard rules.

**Glossary alias discipline (per F13 GLOSSARY contract).** When referring to platform entities, code, schema, audit, and config MUST use the canonical names: `medication_request` (not "prescription"), `Mode 1` / `Mode 2` (or the workload taxonomy values `conversational_assistant` / `protocol_execution`; not "chatbot"), `tenant` (not "customer"). Permitted contextual exceptions, used as words-of-art rather than entity references:

- **"prescription"** appears in (a) the canonical INVARIANTS contract entry name "I-012 prescription sign-off"; (b) FDA / regulatory phrases ("prescription drug marketing", "prescription drug advertising") where the regulatory authority's literal wording is required; (c) the "prescription history" data class as named by US payment platforms (Stripe). When discussing the platform entity itself, use `medication_request`.
- **"customer"** appears in (a) Stripe / Paystack admin surfaces where the payment processor's literal entity name is "Customer"; (b) standard business terms with no platform-entity meaning ("customer acquisition cost", "before customer ship"). When referring to platform entities, use `tenant` or `patient`.

Operating-tenant naming is `Telecheck-{country}` (e.g., `Telecheck-US`, `Telecheck-Ghana`); patient-facing surfacing uses the consumer DBA `Heros Health` (country-instanced via subdomains). "Heros" alone, without the qualifier "Health" or DBA framing, MUST NOT be used as a tenant or operator identifier.

---

## 18. Business and operating model

(Substantially expanded from v1.6 to reflect multi-tenant and dual-market reality.)

### 18.1 Telecheck platform business

Revenue: per-tenant flat platform fee + per-patient fee. No revenue share, no transaction fees, no markup.

Cost: AWS infrastructure, AI provider costs, engineering team, operations team, compliance and legal.

### 18.2 Telecheck-Ghana operating business

Revenue: per-consult fees, per-medication-fulfillment margin, RPM/CCM subscriptions per emerging-market launch (piloting in Ghana).

Cost: clinician compensation, pharmacy partner fees, delivery costs, mobile-money fees, marketing.

### 18.3 Telecheck-US operating business (Heros Health DBA)

Revenue: subscription products per Hims/Ro DTC pattern. Cash-pay at launch.

Cost: clinician network fees (PLLC or partner per Telecheck-US tenant operator choice), pharmacy partner fees, fulfillment, marketing, Stripe fees.

Telecheck-US (operated by Telecheck Health LLC) pays Telecheck-the-parent the platform fee + per-patient fee. Telecheck-US patient revenue settles to Telecheck Health LLC's Stripe account.

### 18.4 Future tenants

Same model as Telecheck-US (Heros Health DBA): tenant pays Telecheck-the-parent platform + per-patient fees; tenant's patient revenue settles to the tenant operator's payment processor account; tenant operates their own commercial model.

### 18.5 Unit economics requirements

For each tenant on the platform, the unit-economics model (OR-109) must demonstrate:
- Per-active-patient gross margin positive within tenant's commercial model
- Customer acquisition cost (CAC) recoverable within plausible LTV horizon
- Per-consult, per-refill, per-RPM-month margin lines documented

For Telecheck-Ghana specifically, the Ghana unit economics must remain workable under the "no per-unit fees from managed providers" discipline (ADR-022).

---

## 19. Roadmap beyond launch

### Phase 2 (3-6 months post-launch)

- Productized self-service tenant onboarding
- Affiliate program advanced features (multi-tier commissions, dedicated affiliate dashboards)
- US owned-pharmacy considerations (per-tenant decision)
- Multi-region deployment (US-region primary for US tenants if latency becomes competitive issue)
- Track B Wave 1 (USSD-initiated workflows for Telecheck-Ghana per Future Scope: USSD + AI Bridge)
- Mode 2 auto-approve activation per OR-305

### Phase 3 (6-12 months post-launch)

- Additional African country expansion via separately incorporated Telecheck subsidiaries (`Telecheck-Nigeria`, `Telecheck-Kenya`, `Telecheck-SouthAfrica` as operating tenants per CCR template additions; all surfacing the unified Heros Health consumer brand at country subdomains: nigeria.heroshealth.com, kenya.heroshealth.com, southafrica.heroshealth.com)
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

## 21. Non-goals (regulatory-conditional rewrite per v1.10 C1)

The platform explicitly does NOT do these things at launch. Each non-goal is classified along three axes — **Regulatory posture** (what regulation says), **Architecture posture** (what the platform commits to), and **Activation mechanism** (what would change to lift the non-goal). Entries with viable activation paths carry **Future Release** markers; entries that are genuine NEVER commitments carry no Future Release marker.

This three-axis classification distinguishes regulatory-conditional non-goals (could change with regulatory engagement and architectural readiness) from architectural NEVERs (would not change regardless of regulatory permission).

- **Direct-to-consumer molecule-level prescription marketing in the US.**
  - *Regulatory posture:* US FDA DTC fair-balance rules + state telehealth advertising restrictions prohibit molecule-level marketing without clinician relationship.
  - *Architecture posture:* Per ADR-027, marketing posture is country-conditional via CCR. US tenants operate program-level marketing only.
  - *Activation:* Regulatory framework would have to change OR US becomes a tenant where program-level reframing is sufficient. No Future Release marker; this is the steady-state US posture.
- **Direct-to-consumer molecule-level prescription marketing in emerging markets.**
  - *Regulatory posture:* Country-dependent. Per ADR-027, harm-reduction logic permits this in markets where the counterfactual is unmediated pharmacy purchase and the safety floor (interaction engine, herb-drug, fake-med, clinician sign-off) gates fulfillment regardless.
  - *Architecture posture:* Country-conditional via CCR. §13.2 governance review applies.
  - *Activation:* Country regulatory contract (e.g., Ghana FDA + Pharmacy Council guidance review) + CCR policy update + first molecule-level marketing copy approval through governance. **Future Release** marker — activation expected per emerging-market launch readiness.
- **Telecheck-branded D2C anywhere.**
  - *Regulatory posture:* Not regulatorily blocked.
  - *Architecture posture:* Strategic. Heros Health is the global consumer brand for Telecheck-operated DTC. Telecheck operates as platform/parent/B2B brand only — never the consumer mark.
  - *Activation:* Not regulatorily blocked — strategic. Would require introducing a Telecheck-branded consumer surface alongside Heros Health, which conflicts with the unified-consumer-brand position. Unlikely revisit. No Future Release marker.
- **In-house drug manufacturing.**
  - *Regulatory posture:* GMP licensing required per market.
  - *Architecture posture:* Pharmacy adapters integrate with manufacturing partners; the platform does not manufacture.
  - *Activation:* Strategic + regulatory — would require GMP-licensed manufacturing operation. Not on platform roadmap. No Future Release marker.
- **Insurance underwriting or claims processing.**
  - *Regulatory posture:* Insurance regulation varies by jurisdiction; would require insurance license per market.
  - *Architecture posture:* Platform integrates with payment processors and supports patient-pay subscriptions.
  - *Activation:* Strategic + regulatory — major business model expansion. Not on platform roadmap. No Future Release marker.
- **Clinical trials execution platform (Posture B).**
  - *Regulatory posture:* GCP/ICH requirements; eCRF + IRB + sponsor reporting infrastructure.
  - *Architecture posture:* Per ADR-028, Posture B is explicitly out of scope. Telecheck supplies data to research partners; it does not run interventional trials.
  - *Activation:* Major architectural expansion + regulatory commitment. Not on platform roadmap. No Future Release marker. (Note: research data partnership Posture A is a Release 2 goal — see §7.10 and §15.3.)
- **Cross-tenant federated patient identity.**
  - *Regulatory posture:* Cross-tenant identity has data-protection implications but not regulatorily blocked.
  - *Architecture posture:* Currently each tenant has independent patient accounts per ADR-023 isolation.
  - *Activation:* Engineering work + product decision. **Future Release** marker — Phase 2 design and timing per §25.
- **Multi-language patient experience (Track B languages).**
  - *Regulatory posture:* No barrier.
  - *Architecture posture:* Track A is English at launch. Track B (multilingual + USSD + AI Bridge) is post-launch.
  - *Activation:* Per ADR-018 deferral; activates when Track B Wave 1 lands. **Future Release** marker.
- **AI autonomous prescribing without clinician sign-off.**
  - *Regulatory posture:* US state telemedicine rules + analogous regulations elsewhere generally require clinician decision authority.
  - *Architecture posture:* Per I-001 floor invariant. Mode 2 prepares cases; clinicians sign off, or protocols authorize within strict envelope per ADR-005.
  - *Activation:* Would require regulatory framework change AND removal of I-001 floor — not on roadmap. No Future Release marker.
- **AI as actor in patient communities.**
  - *Regulatory posture:* No specific barrier; trust/safety implications.
  - *Architecture posture:* Per I-009 (peer support is human-only). Crisis detection runs on community content; AI does not post or moderate as an actor.
  - *Activation:* Would require I-009 floor revision — strategic decision. Not on roadmap. No Future Release marker.
- **Heros migration from Rimo Health.**
  - *Regulatory posture:* No barrier.
  - *Architecture posture:* Per Product Lead decision 2026-04-25, Heros launches greenfield within Telecheck. Existing Heros/Rimo patients do not migrate.
  - *Activation:* Decided. No Future Release marker.
- **Schedule II controlled substances.**
  - *Regulatory posture:* DEA Schedule II prescribing has additional requirements per state (DEA registration class, refill prohibitions, in-person evaluation in some states under telemedicine rules).
  - *Architecture posture:* Per current Pharmacy + Refill scope. Out of launch.
  - *Activation:* Engineering + regulatory + operational expansion. **Future Release** marker — Phase 2+ per §25.
- **Pediatric care below age 13.**
  - *Regulatory posture:* COPPA + analogous regulations + heightened parental consent requirements.
  - *Architecture posture:* Out of launch in both markets.
  - *Activation:* Product + regulatory expansion. **Future Release** marker — Phase 3+ per §25.

---

## 22. Dependencies and constraints (restored from v1.6 §21 per HIGH-06 remediation)

### 22.1 Critical external dependencies

| Dependency | Used by | Risk if unavailable |
|---|---|---|
| Anthropic Claude API | AI Mode 1, Mode 2, lab interpretation, admin AI features | High — primary clinical AI provider per ADR-020. Mitigation: multi-provider abstraction; Bedrock and Azure as backup |
| AWS us-east-1 region | Primary hosting per ADR-026 | High — single region at launch. Mitigation: us-west-2 cold DR; data backup discipline; us-west-2 infrastructure-as-code maintained for failover |
| Telecheck-Ghana cross-border processing | Ghana patient data processed in us-east-1 (United States) per ADR-026 | High — Ghana DPC mechanism is `[COUNSEL-REQUIRED]` and not finalized. Mitigation: counsel engagement before Telecheck-Ghana launch; Ghana DPC registration as the formal mechanism; patient privacy notice disclosing US processing (counsel-confirmed); clinician onboarding disclosure. Latency for Ghana sync video may require Phase 2 LiveKit edge routing. |
| Stripe API (US) | Telecheck-US tenant payments (Heros Health DBA) | High — only payment provider for US at launch. Mitigation: known SLA and reliability |
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
- **Tenant Clinical Lead capability** — each tenant requires a designated Clinical Lead per RBAC v1.1. Constraint: the Telecheck-US tenant operator team and the Telecheck-Ghana tenant operator team must each name a Clinical Lead before clinical surfaces go live.
- **Privacy Officer capability** — per RBAC v1.1, Privacy Officer reviews break-glass sessions within 7 days. Constraint: dedicated capacity required.
- **Design file delivery — DECIDED 2026-04-28** (Evans Option B fold-in): design handoff received at `telecheck-design-system/` with Patient interactive mock v7 authoritative. DIC v1.0 → v1.1 promotion lands in v1.10 cycle Phase 5.6 (F49); status bumps to "Canonical for development." Substitution flags (Manrope/Lucide/wordmark/photography placeholders) carry forward to be replaced before customer ship. Pharmacy portal kit not in v1 design system; gap to be filled when pharmacy slice work begins.
- **Research Ethics Committee (REC) partnership** — per ADR-028, research data partnership requires in-country ethics oversight. Initial designation for Telecheck-Ghana (Ghana Health Service REC or Noguchi Memorial Institute IRB) is a pre-launch decision per §24. Analogous bodies for future markets onboard with country expansion.
- **Marketing copy governance lead** — per ADR-027, country-conditional DTC marketing posture requires designated governance review owner. Initial designation for emerging-market tenants (where molecule-level marketing is permitted) is a pre-launch decision per §24.

### 22.3 Regulatory constraints

- **HIPAA (US, Telecheck-US tenant)** — full BAA structure with all PHI-touching subprocessors per OR-243. Compliance work ongoing through launch; not all evidence collected at launch but sufficient for go-live.
- **Ghana Data Protection Act** — DPC registration per OR-002. Compliance work in progress.
- **State-by-state US telemedicine** — clinician licensure scoping per state. Telecheck-US tenant (Heros Health DBA) onboards clinicians in scope states first; expands.
- **FDA reporting (US adverse events)** — per Adverse Event Reporting Slice.
- **Ghana FDA reporting** — per Telecheck-Ghana operations.
- **Schedule III–V controlled substances (US)** — DEA compliance per state. In scope; Schedule II out of scope.
- **Research data cross-border transfer** — per ADR-028, Posture A research data partnership involves cross-border transfer beyond the existing care-data processing posture. Ghana DPA cross-border-transfer rules apply to research use (in addition to care use). Sharing with WHO/UN partners (Geneva-based, etc.) is a further cross-border transfer beyond the US processing. Patient privacy notice must disclose both. **[COUNSEL-REQUIRED]** before research data export pipeline activates.
- **Country-conditional DTC marketing posture** — per ADR-027, molecule-level marketing in emerging markets requires country regulatory contract (e.g., Ghana FDA + Pharmacy Council guidance review). Activation gated on regulatory engagement per market.

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

**Telecheck-US tenant (Heros Health DBA):**
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
| 2 | Design file delivery timing | Product Lead | **DECIDED 2026-04-28** | Design handoff received at `telecheck-design-system/` (Patient mock v7 authoritative); DIC v1.0 → v1.1 promotion folded into v1.10 cycle Phase 5.6 (F49) per Evans Option B. Pixel-exact-match activates; substitution flags carry forward. |
| 3 | Clinical safety case sign-off | Tenant Clinical Leads | OPEN — OR-004 | Required pre-launch each tenant |
| 4 | Threat model sign-off | Engineering Lead + Privacy Officer | OPEN — OR-001 | Required pre-launch |
| 5 | AI bias and fairness assessment | Platform AI Safety | OPEN — OR-005 | Required pre-launch |
| 6 | Ghana DPIA | Privacy Officer + Telecheck-Ghana team | OPEN — OR-002 | Required pre-Ghana-launch |
| 7 | LLM provider final selection (within multi-provider abstraction) | Platform AI Safety | DECIDED — ADR-020 | Anthropic Claude primary; resilience providers configured |
| 8 | Pharmacy adapter partnerships finalized | Tenant Operations | OPEN per tenant | Telecheck-US pharmacy partner contracts (Heros Health DBA); Telecheck-Ghana partner contracts |
| 9 | Tenant Clinical Lead designation | Each tenant | OPEN per tenant | Required before clinical surfaces enabled per tenant |
| 10 | Privacy Officer designation | Platform | OPEN | Required for break-glass session reviews |
| 11 | Research Ethics Committee (REC) partnership designation — Ghana | Privacy Officer + Telecheck-Ghana team | OPEN | Required for research data partnership activation per ADR-028. Ghana GHS REC or Noguchi Memorial Institute IRB. |
| 12 | Research data-use consent text — drafted + ethics-reviewed | Privacy Officer + Legal + REC partner | OPEN | **Required before per-country `inactive → consent_only` activation** (patch 2026-05-02 per Codex Round-4 Scope 3 HIGH-3 finding aligning with §15.2 + CCR_RUNTIME v5.2 launch defaults). Not a v1.0 launch prerequisite — US/GH launch with CCR `research_data_partnership_active = inactive` and the 5th-tier prompt does NOT render at launch. Pre-launch authoring is appropriate so the consent text is in hand for the per-country activation review (alongside REC partnership designation per row 11), but it does NOT block launch itself. |
| 13 | Data Sharing Agreement (DSA) template — legal-reviewed | Legal + Privacy Officer | OPEN | Required before first DSA activation (Release 2) |
| 14 | De-identification standard — chosen + documented | Engineering + Privacy Officer | OPEN | Required before research data export pipeline activates (Release 2). Safe Harbor + k-anonymity. |
| 15 | Initial WHO/UN partner identification | Product Lead + External Comms | OPEN | Strategic — first partnership scope (NCD program, surveillance, etc.) shapes Release 2 architecture |
| 16 | Marketing copy governance lead designation | Product Lead + Regulatory Affairs Lead | OPEN | Required for emerging-market tenants where molecule-level marketing is permitted per ADR-027 |
| 17 | First molecule-level marketing copy approval — Ghana | Marketing copy governance lead + Clinical Safety Officer + Regulatory Affairs Lead | OPEN | Per §13.2 governance review · pre-launch for first emerging-market activation |
| 18 | CCR marketing key initial values per country | Engineering + Regulatory Affairs Lead | OPEN | Per §13.2 3-state enum: `molecule_level_marketing_permitted = prohibited` for US (Telecheck-US, permanent per FDA + state telehealth advertising rules); `molecule_level_marketing_permitted = pending_evidence` for Ghana (Telecheck-Ghana, pending regulatory engagement + `marketing_copy_governance_evidence` population) |

---

## 25. Open questions (restored from v1.6 §24 per HIGH-06 remediation, plus new questions from Sessions 1–3)

Strategic questions that don't require pre-launch decision but warrant attention:

1. **When and how to onboard Tenant 3+** — process, contracts, brand identity guidance, country addition workflow per CCR_RUNTIME v5.1
2. **Federated patient identity across tenants** — Phase 2 design and timing
3. **Heros Health consumer brand expansion across additional African markets beyond Ghana** — country-subsidiary sequencing (Telecheck-Nigeria, Telecheck-Kenya, Telecheck-SouthAfrica) and corresponding subdomain rollouts (nigeria.heroshealth.com, etc.); out of launch scope; future strategic question
4. **AI conversation persistence across tenants for the same human** — privacy/UX trade-off; default is no persistence (per ADR-023 isolation)
5. **Cross-tenant clinician network optimization** — UX for clinicians authorized in multiple tenants
6. **Telecheck-US (Heros Health DBA) marketing channel mix** — greenfield CAC, no migration baseline; the Telecheck-US tenant operator team owns this; platform supports
7. **When to add Schedule II controlled substances** — regulatory and operational complexity; Phase 2+
8. **Pediatric expansion (<13) timing** — regulatory and product complexity; Phase 3+
9. **Owned-pharmacy considerations** — vs partner-only model. Phase 2 evaluation
10. **Multilingual coverage Track B timing** — USSD + AI Bridge; ADR-018 deferred
11. **Affiliate program productization beyond MVP** — automated payouts across both tenants, affiliate self-service dashboards
12. **Research data partnership scope — first WHO/UN program** — which specific program (NCD surveillance, chronic disease registry, pharmacovigilance, etc.) is the first DSA target? Affects export-pipeline architecture priorities. Per ADR-028; Release 2 dependency.
13. **Molecule-level vs program-level marketing — borderline-case refinement.** Working definition is canonical in §13.2 (5-criteria classification + fail-closed default). Open question is borderline-case calibration with §13.2 Governance review process as the first emerging-market marketing copy is reviewed (e.g., drug-class naming without specific molecule, patient testimonials, educational content). Per ADR-027.
14. **Cross-mode AI data flow (Mode 1 ↔ Mode 2)** — privacy and clinical safety trade-off. Per AI Slice §15 Q6.
15. **Per-(tenant, country) encryption keys for future multi-country tenants** — current per-tenant KMS (per ADR-024) suffices for one-tenant-per-country model; revisit if multi-country tenants emerge.

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

**Pillar 3 — Pharmacy and medication-fulfillment commerce (1 consolidated slice):**
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
