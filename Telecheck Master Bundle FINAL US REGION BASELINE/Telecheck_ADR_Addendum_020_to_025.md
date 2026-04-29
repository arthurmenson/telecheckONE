# Telecheck — ADR Addendum: ADR-020 through ADR-025

**Version:** 1.0 (with 2026-04-26 supersession marker on ADR-025)
**Status:** Canonical for ADR-020 through ADR-024. **ADR-025 superseded by ADR-026** (2026-04-26).
**Owner:** Engineering Lead
**Parent documents:** ADR Set v1.0, ADR Addendum 016–019, Master Platform PRD v1.9, System Architecture v1.2
**Companion documents:** ADR Addendum 026 (supersedes ADR-025), Operational Readiness To-Do v1.4, Engineering Handoff & Build Guide v1.2

---

## Purpose

Six new ADRs ratified following the multi-tenancy / dual-market scope decisions of 2026-04-25. Per ADR Set v1.0 immutability rule, accepted ADRs are never edited. This addendum extends the ADR Set; merges into ADR Set v1.2 at next consolidated revision.

This addendum also closes the previously reserved ADR-016 (LLM provider) which becomes ADR-020 in this addendum's numbering for clarity, while preserving the original ADR-016 reservation in the prior addendum. To avoid renumbering churn, ADRs in this addendum start at 020 and the original ADR-016 reservation is filled here as a cross-referenced ratification.

> **2026-04-26 update:** ADR-025 (AWS single region: af-south-1 primary, us-east-1 DR) has been superseded by ADR-026 (AWS single region: us-east-1 primary, us-west-2 cold DR). The ADR-025 content below is preserved for traceability with a supersession marker at the section header. The other five ADRs in this addendum (020 LLM provider, 021 LiveKit, 022 native-first stack, 023 multi-tenancy Model A, 024 country-driven config + per-tenant KMS) remain canonical and are not affected by ADR-026 except in their realized region of operation.

Note on numbering: this addendum uses ADR-020 through ADR-025. ADR-016 (LLM provider, originally reserved in ADR Addendum 016–019) is satisfied by ADR-020 below. ADR-017 (data residency, also originally reserved) is satisfied by ADR-024 below.

---

## ADR-020: LLM provider — Anthropic Claude primary with multi-provider abstraction

**Status:** Accepted
**Date:** 2026-04-25
**Supersedes:** ADR-016 reservation (ADR Addendum 016–019)

### Context

The platform requires LLMs for three distinct purposes: Mode 1 conversational assistant (patient-facing), Mode 2 protocol execution agent (clinical case prep), and AI Scribe (sync video transcription post-processing). Each has different volume, latency, accuracy, and safety requirements.

OR-003 in the Operational Readiness tracker named this as Tier-0 reviewer-blocking. The 2026-04-25 session resolved it.

### Options considered

1. **Self-hosted Llama 3.x or Mistral for all paths.** Lowest unit cost; full data control. But not at clinical-grade quality parity with top-tier proprietary models for safety-classification, multi-step clinical reasoning, or multilingual coverage. Risk-asymmetric: saves $0.02 per call, exposes platform to clinical safety incidents that cost orders of magnitude more.

2. **Anthropic Claude exclusively, no abstraction.** Highest quality and safety; ties platform to one vendor. Provider risk if Anthropic raises prices, changes terms, or has outages. No way to A/B test against alternatives.

3. **Anthropic Claude primary, multi-provider abstraction.** Treat "LLM provider" as a per-route configurable choice. Anthropic Claude as primary for clinical paths. Other providers as configured alternatives where appropriate. Self-hosted models permitted for non-clinical paths only.

### Decision

Option 3.

**Primary clinical-path provider:** Anthropic Claude. Sonnet 4.6 (or current generation) for Mode 1 conversational responses and Mode 2 case preparation. Haiku 4.5 (or current generation) for high-volume guardrail evaluation and safety classification. Opus where Mode 2 case complexity warrants.

**Configurable alternatives via the LLMProvider abstraction:**
- OpenAI GPT-4 / GPT-5 class (primary alternative; comparable safety profile; useful for fallback or A/B test target)
- Google Gemini Pro / Ultra (alternative for cost arbitrage on high-volume routes)
- AWS Bedrock-hosted Claude (same model, different procurement; useful when AWS-native deployment makes the BAA chain simpler)
- Azure OpenAI (useful for tenant-specific Microsoft/Azure relationships)
- Self-hosted Llama 3.x / Mistral / Mixtral (non-clinical paths only — acquisition tools, admin assistant, internal copy generation)

**Per-route routing strategy:**
- Mode 1 patient chat → Claude Sonnet (default), Claude Haiku for guardrail eval pass that runs first
- Mode 2 clinical case prep → Claude Sonnet (default), Claude Opus for high-complexity cases
- AI Scribe post-processing → Claude Haiku (cheap, sufficient quality for transcript clean-up)
- Acquisition tools (food scanning chat, fitness coaching) → configurable; cheaper providers acceptable
- Admin assistant (operator copilot for inventory, copy suggestions) → configurable; cheaper providers acceptable

**Per-tenant overrides:** A tenant may, with platform-admin approval, configure a different LLM provider for any non-clinical-path route. Clinical paths (Mode 1 patient-facing, Mode 2 case prep, crisis detection) are platform-default and not tenant-configurable.

### Consequences

- Architecture: AI Service has an `LLMProvider` abstraction. Concrete adapters: `AnthropicProvider`, `OpenAIProvider`, `GeminiProvider`, `BedrockClaudeProvider`, `AzureOpenAIProvider`, `LlamaSelfHostedProvider`. Each implements a common interface (chat completion, structured output, streaming).
- Engineering: build adapter pattern from day 1. Anthropic adapter is launch-required; others stub-in with one production-ready alternative (OpenAI) at minimum.
- Cost: estimated $900–1,500/month at projected launch volume (10K active US users + 5K active Ghana users; 30K Mode 1 messages/month, 2K Mode 2 cases/month, 500 sync video consults/month). Aggressive caching (per-prompt, per-patient-profile), Haiku-tier routing for high-volume cheap calls, and pre-computation of Mode 2 inputs are required cost-management practices.
- Safety: clinical paths (Mode 1, Mode 2, crisis detection, guardrail evaluation) are Anthropic-only at launch. The decision to permit alternative providers on clinical paths requires a future ADR.
- Audit: every LLM call records provider, model, model_version in audit per AUDIT-EVENTS contract. Provider-swap is observable post-hoc.
- Multi-tenancy implication: provider configuration is per-route, can be overridden per tenant for non-clinical routes only.

### References

- Master PRD v1.9 §11
- AI Clinical Assistant Slice PRD v1.0
- Contracts Pack v5 — AI-LAYERING
- Operational Readiness To-Do v1.2 (closes OR-003)
- ADR Addendum 016–019 (ADR-016 reservation)

---

## ADR-021: Sync video and audio — LiveKit, self-hosted

**Status:** Accepted
**Date:** 2026-04-25

### Context

Sync video consults and audio-only fallback are a launch capability. The Sync Video Consult Slice PRD v1.0 §15 Q1 left the WebRTC provider as TBD. At projected launch volume (500 consults/month growing to 5,000+/month within year 1), per-minute managed-service fees impact unit economics meaningfully — especially for emerging-markets tenants where per-consult margins are thin.

### Options considered

1. **Twilio Video.** Industry standard, deepest enterprise compliance, highest per-minute cost ($0.004/participant-minute typical). At 5,000 consults × 90 participant-minutes ≈ $1,800/month and scales linearly with volume. HIPAA BAA available.

2. **Daily.co.** Telehealth-focused, well-priced ($0.001–$0.003/participant-minute), strong WebRTC engineering team, HIPAA and SOC 2 compliant. Lower than Twilio but still per-minute fees scaling with usage.

3. **LiveKit Cloud.** Managed LiveKit; ~$0.0005/connection-minute + $0.12/GB downstream bandwidth. Lower than alternatives but still scales linearly.

4. **LiveKit, self-hosted.** Apache 2.0 licensed; same SDKs as LiveKit Cloud (zero-code migration between self-host and Cloud); SFU architecture; AI Agents framework relevant for future Track B AI voice; ~$300–500/month at launch volume in server costs; ~$2,000–5,000/month at scale (server fleet + bandwidth).

5. **Build on raw WebRTC + open-source Janus or Mediasoup SFU.** Maximum control, highest engineering burden. Not justifiable when LiveKit exists.

### Decision

Option 4. LiveKit, self-hosted, from day 1, with LiveKit Cloud as documented operational fallback if production incidents exceed team debug capacity in the first 90 days.

### Rationale

- **Apache 2.0 license eliminates vendor lock-in.** Platform owns the deployment.
- **Same SDKs on self-host and Cloud.** If self-hosting becomes painful, switch to LiveKit Cloud with zero code change while operational team matures, then migrate back. De-risks the self-host commitment.
- **AI Agents framework built in.** LiveKit Agents lets the AI scribe (and future Track B AI voice agent) join the WebRTC room as a first-class participant. Materially less complexity than building a separate audio-extraction pipeline.
- **Telehealth-proven.** Documented HIPAA-compliant deployments. Known patterns for medical use cases.
- **End-to-end encryption available** (AES-128 media + 256-bit TLS + AES-256 at rest).
- **Scales** to 100,000 concurrent participants per session per LiveKit benchmarks.
- **Unit economics:** at 5,000 consults/month, self-hosted LiveKit costs ~$500/month vs. Twilio at ~$1,800/month. At 50,000 consults/month, the gap is ~$5,000 vs. ~$20,000. The savings compound.

### Operational reality

Self-hosting LiveKit requires:
- 2–3 LiveKit server instances on AWS (production + standby) in each deployment region
- TURN server configuration for users behind restrictive NATs (carrier-grade NAT in some Ghana mobile network contexts)
- One engineer-week for production setup, plus another engineer-week six months in for tuning and capacity planning
- Operational monitoring (call quality metrics, packet loss, jitter, regional latency)

If the engineering team has zero WebRTC experience, the first 90 days on LiveKit Cloud (managed) followed by migration to self-host once the team has built operational muscle is acceptable. Costs ~$800/month at launch volume during this transition. Migration from LiveKit Cloud to self-host is zero-code (same SDKs).

### Consequences

- Sync Video Consult Slice PRD v1.0 §15 Q1 closed.
- System Architecture v1.2 §7 External Integrations updated: LiveKit (self-hosted) replaces "video infrastructure (provider TBD)."
- Engineering: deploy LiveKit servers as part of Foundation work stream. Build a `VideoProvider` abstraction even though only one provider is wired in initially, to preserve optionality.
- Multi-tenancy implication: LiveKit deployments are platform-wide, not per-tenant. All tenants share the same LiveKit infrastructure. Tenant isolation at the LiveKit room level via room naming convention (`tenant_<id>_consult_<id>`).
- AI Scribe implementation: builds on LiveKit Agents framework; STT runs as a participant in the room.
- Cost line in financial model: LiveKit infrastructure ~$500/month at launch, scaling to ~$5K/month at year-2 volume. Compare to ~$20K+/month at managed alternative.

### References

- Sync Video Consult Slice PRD v1.0 §15 Q1
- AI Clinical Assistant Slice PRD v1.0 (AI Scribe)
- System Architecture v1.2 §7
- Future Scope: USSD + AI Bridge v0.1 (Track B AI voice, leverages LiveKit Agents)

---

## ADR-022: Native-first, open-source-first technology stack

**Status:** Accepted
**Date:** 2026-04-25

### Context

The platform serves emerging-market tenants (Ghana initially, more to follow) where per-unit fees from managed providers fundamentally degrade unit economics. A telehealth consult at $30 cannot absorb $3 in vendor SaaS fees and remain viable at scale. Compounded across video, STT, chat, analytics, search, BI, observability, etc., default managed-everything stacks would consume 15–25% of consult margin permanently.

The 2026-04-25 session established a stack philosophy: native and open-source first, managed providers only where operational cost of self-hosting exceeds vendor fees substantially or where compliance/safety considerations dictate.

### Options considered

1. **Managed-everything stack** (Twilio, Datadog, Sendbird, Mixpanel, Algolia, Looker, Refersion, etc.). Lowest engineering effort. Highest ongoing cost. Scales linearly with usage.

2. **Self-hosted-everything stack.** Lowest unit cost. Highest engineering burden, including for capabilities (KMS, payment processing) where managed services are clearly the right call.

3. **Native-first, open-source-first with deliberate exceptions.** Self-host where production-grade open-source exists. Use managed providers only where (a) compliance-grade requirements dictate (KMS, payment), (b) operational complexity of self-hosting genuinely exceeds savings, or (c) safety/quality requirements cannot be met by open-source (clinical LLM).

### Decision

Option 3.

### The provider matrix

This matrix is the canonical reference for technology stack decisions. Engineering may not silently swap providers without an ADR amendment.

| # | Capability | Decision | Notes |
|---|---|---|---|
| 1 | Sync video / audio (WebRTC) | LiveKit self-hosted | Per ADR-021 |
| 2 | Speech-to-text (AI Scribe) | Faster-Whisper self-hosted on GPU; Deepgram fallback for first 90 days during volume ramp | Cost-effective above ~1,500 consults/month |
| 3 | Text-to-speech (future Track B) | Coqui TTS / Piper self-hosted | Out of launch scope; Track B |
| 4 | LLM provider (clinical paths) | Anthropic Claude | Per ADR-020 |
| 5 | LLM provider (non-clinical paths) | Configurable; self-hosted Llama 3.x permitted | Per ADR-020 |
| 6 | OCR (medical documents / lab reports) | AWS Textract Medical for clinical OCR; Tesseract for non-clinical | Quality requirements dictate Textract for lab reports |
| 7 | Mobile money (Ghana) | Paystack | Per ADR-024; aggregator for MTN MoMo, Vodafone Cash, AirtelTigo, cards |
| 8 | Card payments (US) | Stripe | Per ADR-024; industry standard for US DTC |
| 9 | WhatsApp Business API | 360dialog (BSP) at launch; transition to Meta direct when volume justifies | Direct Meta enrollment cheaper but slow |
| 10 | SMS (Ghana) | Hubtel or mNotify | Local aggregators 5–10x cheaper than Twilio |
| 11 | SMS (US) | Plivo or MessageBird | 30–40% cheaper than Twilio |
| 12 | Email (transactional) | Postmark | Reliable; cost-effective at small-to-mid volume |
| 13 | Drug interaction database | RxNorm + DrugBank Open + OpenFDA at launch; commercial DB (First Databank or Lexicomp) layered in at US scale | Commercial DBs are $30K–80K/year; defer until justified |
| 14 | Herb-drug interaction data | MSKCC About Herbs, Memorial Sloan Kettering data, curated academic literature | Differentiator, owned dataset |
| 15 | Identity verification / KYC (US) | Stripe Identity | Bundled with Stripe payment; simplifies vendor count |
| 16 | Object storage | AWS S3 | Standard; integrated; cheap at launch volume |
| 17 | Push notifications | Native FCM + APNs direct | No vendor needed |
| 18 | Real-time chat (patient ↔ clinician) | Self-built on PostgreSQL + WebSockets | Per Messaging Inbox Spec |
| 19 | Search (medication, condition, KB) | Meilisearch self-hosted | Production-grade open source |
| 20 | Analytics / product telemetry / funnels / session replay / feature flags / A/B testing | PostHog self-hosted | One tool replaces Mixpanel + Amplitude + LaunchDarkly + Hotjar |
| 21 | Affiliate program tracking | Self-built on Postgres + UTMs + Stripe Connect for payouts | 3–4 weeks of engineering; saves ~$400/month |
| 22 | Admin BI dashboards | Metabase self-hosted | OSS; production-grade |
| 23 | Background job queue | BullMQ (Node) or River (Go) | Redis or Postgres backed |
| 24 | Observability (logs, metrics, traces) | Grafana + Loki + Prometheus + Tempo (LGTM stack), self-hosted | Replaces Datadog |
| 25 | Error tracking | Sentry self-hosted | Sentry source is OSS |
| 26 | Cloud hosting | AWS | Per ADR-025 |
| 27 | KMS / secrets management | AWS KMS + AWS Secrets Manager | Compliance-grade; integrated; trivial per-request cost |
| 28 | Container orchestration | Docker Compose at launch; k3s when complexity justifies | Skip EKS; operational overhead too high for small team |
| 29 | Database | PostgreSQL on AWS RDS at launch | Managed for simplicity; evaluate self-managed at scale |
| 30 | Cache / session store | Redis on AWS ElastiCache at launch | Same pattern as DB |
| 31 | CI/CD | GitHub Actions | Already on GitHub; Claude Code GitHub integration |

### Consequences

- Engineering: 6–8 engineer-weeks of one-time setup work for self-hosted services (LiveKit, Whisper, PostHog, Meilisearch, Metabase, LGTM, Sentry, MinIO if elected) spread across the Foundation work stream. After setup, ongoing maintenance is modest.
- Cost: estimated savings of ~$16,000/month at projected 12-month volume vs. managed-everything stack. ~$192K/year saved.
- Operational: requires engineering competence in operating self-hosted services. The team's first 90 days should include explicit training on each self-hosted component. Documented runbooks for each service are mandatory.
- Procurement: per-tenant configurable provider choice exists for some capabilities (LLM, payment, clinician network, pharmacy). Default-stack values chosen here may be overridden per tenant where the abstraction supports it.
- Risk: self-hosted services have operational tail risk. Mitigation: managed-service fallback documented for the highest-stakes services (LiveKit Cloud for video, Deepgram for STT, RDS for DB, ElastiCache for cache).
- Multi-tenancy implication: most provider decisions are platform-wide. Per-tenant overrides exist for: LLM provider (non-clinical only), payment processor (driven by country), clinician network adapter, pharmacy adapter, SMS provider (driven by country).

### References

- Master PRD v1.9 §11, §18
- System Architecture v1.2 §7 (External Integrations) — provider listings updated to match this matrix
- Engineering Handoff & Build Guide v1.2 §4

---

## ADR-023: Multi-tenancy via Model A (single deployment, logical tenant separation, country-driven configuration)

**Status:** Accepted
**Date:** 2026-04-25

### Context

Telecheck is a multi-tenant DTC telehealth platform supporting multiple consumer brands as tenants. At launch, two tenants are active: Telecheck-Ghana (the Ghana consumer brand operated by Telecheck itself) and Heros Health (the US DTC brand, sister company, migrating from Rimo Health onto the Telecheck platform).

The platform must support additional brand tenants over time without architectural revision. The model that supports this is Rimo / Healthie-class multi-tenancy: many brands share one platform; each tenant is logically isolated; brand customization is per-tenant; regulatory and integration choices are country-driven.

### Options considered

1. **Per-tenant deployment.** Each tenant gets its own complete deployment. Maximum isolation. Wildly uneconomic at scale (50 tenants = 50 production environments).

2. **Per-country deployment, multi-tenant within each.** Country boundary is physical (separate deployments per country); brand boundary within country is logical (multiple tenants in one country deployment). Strong data residency and regulatory cleanliness. Higher operational burden — N production environments where N = countries served.

3. **Single deployment, multi-tenant by `tenant_id`, country-driven configuration switches per tenant.** Logical isolation only. One production environment. Country is a per-tenant attribute that drives which regulatory, integration, and compliance modules apply at runtime. Standard SaaS pattern.

### Decision

Option 3.

### Architecture

- **One production deployment** of the Telecheck platform. One AWS environment (per ADR-026; supersedes ADR-025). One PostgreSQL cluster. One Redis cluster. One LiveKit infrastructure. One AI Service. One of everything.
- **Every entity in the data model carries `tenant_id`.** No exceptions. The Canonical Data Model v1.2 enforces this on all 27 entities.
- **Every API request resolves a tenant.** Authentication carries tenant context (tenant_id derived from the user's account). Every query in the system scopes by `tenant_id`. Cross-tenant queries are not permitted at the application layer.
- **Database-level enforcement via row-level security (RLS).** PostgreSQL RLS policies on every tenant-scoped table prevent any query from accessing rows of a different tenant, even if application-layer filtering is bypassed.
- **Country is a tenant attribute** (`tenant.country`, ISO 3166-1 alpha-2). Country drives:
  - Regulatory module loaded (US: HIPAA + state telehealth + DEA; Ghana: Ghana DPA + MDC + Pharmacy Council)
  - Payment processor (US: Stripe; Ghana: Paystack)
  - Clinician network adapter availability (US: Telecheck PLLC, OpenLoop, Wheel; Ghana: Telecheck Ghana panel)
  - Pharmacy adapter availability (US: Truepill, Honeybee, etc.; Ghana: partner pharmacies)
  - SMS provider (US: Plivo or MessageBird; Ghana: Hubtel or mNotify)
  - Currency, language defaults, date/time formats, address formats, phone formats
  - Emergency numbers, crisis helplines
  - Legal/consent text variants
- **Brand is a per-tenant configuration** (`tenant.brand_*`). Brand drives:
  - Display name, logo, primary colors, design tokens
  - Custom domain
  - Intake form catalog (which forms the tenant offers)
  - Product catalog (which medications, programs, services)
  - Pricing
  - Terms of service URL, privacy policy URL
  - Support contact info
  - Notification copy variants (per-brand voice/tone within content rules)

### Two role hierarchies

- **Platform admin** — Telecheck operator role. Sees tenant list, platform health, cross-tenant metrics (aggregated), system governance. Can create/suspend/configure tenants. Cannot see individual patient PHI in any tenant. Per RBAC v1.1.
- **Tenant admin** — per-tenant operator role. Sees only their tenant's data. Manages their tenant's intake forms, product catalog, clinicians, pharmacy configuration, branding. The Heros operator is a tenant admin scoped to the Heros tenant. The Telecheck-Ghana operator is a tenant admin scoped to the Telecheck-Ghana tenant. Per RBAC v1.1.

### Tenant isolation model

| Dimension | Mechanism |
|---|---|
| Patient data | Application-layer filtering by `tenant_id` + PostgreSQL RLS policies |
| Authentication | User accounts are tenant-scoped (a user belongs to exactly one tenant). Same person can have separate accounts in different tenants — different patients from the platform's view. |
| Encryption | Per-tenant encryption keys via AWS KMS. Data encrypted at rest with the tenant's key. A compromised application bug cannot decrypt cross-tenant data without the corresponding tenant's key. |
| API | Tenant resolved at gateway layer. Every endpoint receives tenant context. No cross-tenant API call exists for tenant-scoped data. |
| Audit | Audit records are tenant-scoped. A tenant admin can read their own audit; only platform admin can read across tenants for platform governance. |
| Background jobs | Job queue items carry tenant context; workers honor it. |
| Caching | Cache keys are tenant-scoped (prefix or namespace per tenant). |
| Object storage | S3 prefixes per tenant (`s3://bucket/tenant_<id>/...`). Bucket policies enforce per-tenant access. |
| Search index | Tenant-scoped indices in Meilisearch. |
| LiveKit rooms | Room names include tenant context (`tenant_<id>_consult_<id>`). |

### Tenants at launch

- **Telecheck-Ghana** — country: GH. Brand: Telecheck. Operated by Telecheck team. Greenfield launch on the Telecheck platform.
- **Heros Health** — country: US. Brand: Heros. Operated by Heros team. Migrating from Rimo Health onto the Telecheck platform. Migration tooling is Phase 2 (post-launch); initial Heros migration handled as a one-time engineering project.

### Consequences

- All 27 Canonical Data Model entities revised in v1.1 to include `tenant_id` (NOT NULL, foreign key to `tenants` table).
- All OpenAPI endpoints add tenant resolution at gateway. Tenant context implicit in user authentication; explicit `X-Tenant-Id` header for platform-admin operations that target a specific tenant.
- RBAC matrix v1.1 introduces platform-admin and tenant-admin role separation.
- System Architecture v1.2 §3 adds the Tenant Configuration module as a 15th internal module (was 14 in v1.0); tenant resolution and country-switch logic live there.
- CCR-RUNTIME contract extended to include the integration adapter selections (clinician network, pharmacy, payment, SMS, etc.) in addition to the regulatory and presentation rules already there.
- Every query, every API call, every notification, every audit row carries tenant context. This is enforced at multiple layers (app + RLS + auth) per defense-in-depth.
- Heros migration becomes feasible: Heros's data imports into the Heros tenant within the Telecheck deployment; Telecheck-Ghana data is in the Telecheck-Ghana tenant; both coexist without crossing.
- Platform admin has read-only access to aggregate cross-tenant metrics (tenant count, active patients per tenant, revenue per tenant, system health). Platform admin does NOT have access to PHI within any tenant. PHI access is tenant-admin-scoped and follows the standard RBAC matrix per tenant.
- Future tenant onboarding follows a standard process: create tenant record → configure country → configure brand → configure integration adapters → seed initial admin user → tenant goes live. Initial onboarding is a manual platform-admin process; productized self-service onboarding is post-launch.

### What this is NOT

- This is not Model B (per-country deployment). All countries share one deployment.
- This is not per-tenant deployment. All tenants share one deployment.
- This is not a federation model. There is no notion of identity or data shared across tenants.
- A patient who is a Heros patient and also a Telecheck-Ghana patient (theoretically) has two separate accounts in two separate tenants. Cross-tenant patient identity is not in scope.

### References

- Master PRD v1.9 §1, §2, §10
- System Architecture v1.2 §2, §3, §4
- Canonical Data Model v1.2 (entire document — `tenant_id` propagation)
- RBAC Permissions Matrix v1.1 §1, §2 (platform-admin / tenant-admin)
- Contracts Pack v5 — CCR-RUNTIME (extension)

---

## ADR-024: Country-driven configuration switches and payment processor routing

**Status:** Accepted
**Date:** 2026-04-25
**Supersedes:** ADR-017 reservation (ADR Addendum 016–019)

### Context

Per ADR-023, country is a tenant attribute that drives runtime configuration. This ADR ratifies the specific country-driven switches at launch (US and Ghana) and the architectural pattern for adding future countries.

This ADR also satisfies the previously reserved ADR-017 (data residency for Ghana launch). Under Model A multi-tenancy (ADR-023), data residency is not a deployment-level concern (one global deployment) but is addressed via per-tenant encryption keys, AWS region selection for the deployment, and contractual mechanisms for cross-border processing.

### Decision

Country-driven configuration switches operate per tenant. Each tenant's `country` attribute determines:

| Configuration | US (country = "US") | Ghana (country = "GH") |
|---|---|---|
| Payment processor (primary) | Stripe | Paystack |
| Payment methods supported | Card, ACH (post-launch), Apple Pay, Google Pay | Mobile Money (MTN MoMo, Vodafone Cash, AirtelTigo), card |
| Currency | USD | GHS |
| Currency symbol | $ | GH₵ |
| Subscription mechanics | Stripe Billing | Paystack subscription + custom state machine |
| Identity verification (KYC) | Stripe Identity | Phone OTP only at launch |
| Regulatory module loaded | HIPAA + state telehealth + DEA + state pharmacy + FDA | Ghana DPA + MDC + Pharmacy Council + FDA Ghana |
| Telehealth scope-of-practice rules | Per state, loaded from US regulatory configuration | National (single jurisdiction) |
| Controlled-substance rules | DEA scheduling; state-by-state restrictions | Ghana scheduling |
| AE reporting destination | FDA MedWatch | FDA Ghana / WHO VigiBase |
| Clinician network adapter (default) | OpenLoop or Wheel; Telecheck PLLC if tenant configures | Telecheck Ghana panel |
| Pharmacy adapter (default) | Truepill or Honeybee or Capsule; tenant choice | Partner pharmacies in Ghana |
| Notification SMS provider | Plivo or MessageBird | Hubtel or mNotify |
| WhatsApp deployment | Optional; SMS-primary | WhatsApp-primary, SMS-fallback (per ADR-010) |
| Date format | MM/DD/YYYY | DD/MM/YYYY |
| Time format | 12h | 12h |
| Phone format | +1 NXX-NXX-XXXX | +233 0XX XXX XXXX |
| Address format | Street, City, State, ZIP | Street, Area, City, Region |
| Measurement units | Imperial (default; metric available) | Metric |
| Default locale | en-US | en-GH |
| Emergency number | 911 | 112 |
| Crisis helpline | 988 (US Suicide & Crisis Lifeline) | Ghana Mental Health Authority hotline |
| Quiet hours timezone | Per user, defaulting to tenant address | Africa/Accra |
| Support hours | Per tenant configuration | 07:00–22:00 Africa/Accra |

### Architectural pattern

Each switch is a value in the tenant's CCR (Country Configuration Runtime) record. Application code calls `ccr.get(tenant_id, key)` and receives the country-appropriate value. The CCR-RUNTIME contract documents the schema.

For integrations (payment, SMS, clinician network, pharmacy), the value is the *adapter identifier*. The corresponding adapter is loaded at runtime and invoked. Adapter implementations are per-platform-engineering decisions; the adapter selection is per-tenant configuration.

### Future country onboarding

Adding a new country (e.g., Nigeria, Kenya, South Africa) requires:
1. New CCR template for that country (regulatory module, payment processor, currency, formats, emergency numbers, etc.)
2. New integration adapters where existing ones don't fit (Nigerian payment processor, etc.)
3. Legal review of the regulatory module
4. No code changes to the platform core
5. New tenant in the new country can be created once CCR template is registered

This makes country expansion a platform-product activity, not a major engineering effort.

### Data residency (replaces ADR-017 reservation)

> **2026-04-26 update (per ADR-026):** The realized AWS region for the single-region deployment has changed from `af-south-1` to `us-east-1` primary with `us-west-2` cold DR. The data-residency *abstractions* defined in this section (per-tenant KMS, country-driven jurisdictional mechanism, single-region posture) remain canonical. The original region-specific text below is preserved for traceability of ADR-024's adoption-time framing; current-truth region references are updated below the supersession note.

Under Model A multi-tenancy, the platform runs in a single AWS region. **Per ADR-026 (supersedes ADR-025): primary region is `us-east-1` (Virginia); DR is `us-west-2` (Oregon, cold DR).** Data residency is addressed by:

- **Per-tenant encryption keys via AWS KMS.** Heros data is encrypted with the Heros tenant key. Telecheck-Ghana data is encrypted with the Telecheck-Ghana tenant key. The keys are managed in KMS per-tenant (now resident in `us-east-1` per ADR-026). Loss of one tenant's key does not compromise other tenants' data.
- **Contractual mechanism for US tenant data processed in `us-east-1` (per ADR-026).** Heros patient data is processed in the United States. The BAA chain (Heros → Telecheck → AWS US) is a standard HIPAA-region chain.
- **Cross-border note for Ghana patient data (per ADR-026).** Ghana patient data is processed in `us-east-1` (United States). This is a cross-border data flow under Ghana DPA. Telecheck registers with the Ghana Data Protection Commission (DPC) and follows the cross-border transfer requirements. The specific contractual mechanism (jurisdictional instrument under Ghana DPC) is `[COUNSEL-REQUIRED]`. This is captured as an operational item.
- **No data residency guarantees beyond what AWS `us-east-1` provides.** If a future tenant's regulator requires in-country residency that AWS does not offer in `us-east-1`, a per-country deployment model (Model B) would need to be revisited for that tenant. Per-country physical region routing is explicitly out of scope at launch per ADR-026.

> **Historical text (pre-ADR-026, retained for traceability of ADR-024 adoption-time framing):**
> *Under the original ADR-024 framing (2026-04-25), the platform ran in `af-south-1` (Cape Town — chosen for proximity to Ghana and adequate distance from US for the US tenant per ADR-025). Per-tenant KMS keys were resident in `af-south-1`. Cross-border posture flowed from Ghana → SA region. ADR-026 (2026-04-26) supersedes the region pair; the abstractions in this ADR remain canonical.*

### Consequences

- Tenants table includes `country` attribute (CHAR(2), ISO 3166-1 alpha-2, NOT NULL).
- CCR-RUNTIME contract extended in this addendum to include the integration adapter selection schema.
- Engineering builds per-country regulatory modules for US and Ghana at launch. Module structure: `lib/regulatory/us/`, `lib/regulatory/gh/`. Each exports a standard interface consumed by the rest of the platform.
- AWS KMS configuration: one key per tenant. Key rotation policy per tenant per AWS best practices. Keys reside in `us-east-1` per ADR-026.
- AWS region: `us-east-1` primary per ADR-026 (supersedes ADR-025 af-south-1 framing). Disaster recovery snapshots replicated to `us-west-2` (cold DR) per ADR-026.
- Operational Readiness Tracker: OR-103 (data residency) closure rationale to be reframed under ADR-026 in Cycle U-003 per F-U001-05.
- Future Operational Readiness items added for: Ghana DPC cross-border registration (reframed under ADR-026 in Cycle U-003); US BAA structure (under ADR-026 this becomes standard HIPAA-region chain, not non-standard cross-border BAA).

### References

- ADR-023 (multi-tenancy)
- ADR-025 (hosting)
- Contracts Pack v5 — CCR-RUNTIME (extended)
- Operational Readiness To-Do v1.2 (closes OR-103)
- ADR Addendum 016–019 (ADR-017 reservation)

---

## ADR-025: Hosting on AWS, single region with DR replication

**Status:** **SUPERSEDED 2026-04-26 by ADR-026.** See `Telecheck_ADR_Addendum_026.md`.
**Original status:** Accepted (2026-04-25)
**Date:** 2026-04-25

> **Supersession note (2026-04-26):**
> ADR-025 ratified `af-south-1` primary with `us-east-1` DR. ADR-026 (2026-04-26) supersedes the region pair: primary is now `us-east-1` (Virginia), DR is now `us-west-2` (Oregon, cold DR). The single-region, single-deployment, single-stack architectural posture is preserved. Tenant isolation mechanism (per-tenant KMS, tenant_id on every record, RLS) is preserved; KMS keys now reside in `us-east-1`.
>
> The content below is retained for traceability of the original decision and its rationale. It is not the current canonical hosting decision. For current canonical hosting, read ADR-026.

### Context

The platform is a single deployment serving multi-tenant traffic from US and Ghana (and future countries). Hosting choice affects cost, latency, compliance posture, and operational complexity.

### Options considered

1. **AWS, single region (af-south-1 Cape Town).** Closest AWS region to Ghana (~50ms latency to Accra). Reasonable to US (~180ms to us-east). HIPAA-eligible. Full managed-services suite. Higher cost than alternatives.

2. **AWS, single region (us-east-1 Virginia).** Best for US patients (~30ms latency to most of US). Worse for Ghana (~200ms to Accra). HIPAA-eligible. Full managed services.

3. **AWS, multi-region active-active.** Best latency for both. Highest cost. Highest operational complexity. Premature for launch volume.

4. **DigitalOcean.** ~30–50% cheaper than AWS at small scale. No Africa region (closest is Frankfurt). HIPAA BAA available but less commonly used. Limited managed-services depth.

5. **Hetzner / OVH.** Cheaper than DigitalOcean. Not HIPAA-defensible for US tenant data. Suitable for non-PHI workloads only.

### Decision

Option 1: AWS, single region (af-south-1 Cape Town primary), with DR snapshots replicated to us-east-1 for disaster recovery.

### Rationale

- **Compliance defensibility.** AWS HIPAA BAA covers all services we need. Battle-tested for healthcare PHI at scale. The compliance story is the easiest to defend to a US auditor and the easiest to register with the Ghana DPC.
- **Latency profile acceptable for both markets.** ~50ms to Ghana, ~180ms to US East Coast. Neither is worst-case for either market. US patients on a video consult experience the af-south-1 latency; this is noticeable but not service-breaking.
- **Managed services depth justifies cost.** RDS Multi-AZ for PostgreSQL, ElastiCache for Redis, KMS for per-tenant encryption keys, S3 for object storage with cross-region replication, Route 53 for DNS, CloudWatch for managed monitoring (supplemental to LGTM stack), Secrets Manager for credentials. Self-managing equivalent on DigitalOcean is significant additional engineering burden.
- **Heros migration alignment.** If Heros is on AWS today via Rimo, migration tooling and infrastructure patterns transfer. If Heros is elsewhere, AWS is still the broadly-known target.
- **Multi-region readiness.** When platform volume justifies multi-region deployment (active-active US East + Cape Town), AWS is the natural path.

### Cost estimate at launch volume

- RDS Multi-AZ (PostgreSQL, db.r6g.xlarge or smaller): ~$500–800/month
- ElastiCache (Redis, cache.r6g.large): ~$300/month
- LiveKit servers (3× t3.large): ~$200/month
- AI Service compute (GPU instances for Whisper, ~1× g4dn.xlarge): ~$400/month
- General compute (ECS Fargate or EC2 for the monolith, ~3 instances): ~$300–500/month
- KMS, Secrets Manager, S3, CloudWatch, data transfer, etc.: ~$300–500/month
- **Total estimated launch cost: ~$2,000–2,800/month**

This scales roughly linearly with active patients. At 10x launch volume (~150K active patients), expect ~$15,000–25,000/month.

### Operational details

- **Primary region:** af-south-1 (Cape Town)
- **DR region:** us-east-1 (N. Virginia) for snapshot replication and BCP scenarios
- **Backup strategy:** RDS automated backups + cross-region snapshot replication; S3 cross-region replication for clinical data; daily encrypted snapshot to DR region
- **DR targets:** RPO 1 hour, RTO 4 hours (per System Architecture v1.0 §9.3, unchanged)
- **DR testing:** quarterly failover test
- **Multi-AZ within af-south-1** for high availability within region; minimum 2 AZ
- **Container orchestration:** Docker Compose at launch on EC2 or ECS Fargate; migrate to k3s when complexity justifies
- **Network:** all servers in private subnets; ALB/NLB for public-facing services; WAF on public endpoints; per System Architecture v1.0 §9.4 (unchanged)

### Reconsideration triggers

This decision is revisited if:
- Per-tenant data residency requirements arise that af-south-1 cannot satisfy (would push toward Model B per-country deployment for that tenant)
- US tenant volume grows large enough that latency to af-south-1 becomes a competitive disadvantage (would push toward multi-region active-active or US-region primary with af-south-1 DR)
- AWS pricing changes materially (would push toward DigitalOcean or hybrid)
- A new market is added that AWS does not serve well

### Consequences

- System Architecture v1.1 §9 (Infrastructure) updated to specify AWS af-south-1 primary, us-east-1 DR.
- Engineering builds against AWS-native services (RDS, ElastiCache, KMS, S3, Secrets Manager). Some abstraction over these is reasonable to preserve future portability, but full cloud-vendor independence is not a launch goal.
- All cost projections in financial models use this hosting baseline.
- Operational Readiness To-Do v1.2 closes OR-103 (data residency) and OR-111 partially closed (deployment topology specified; CI/CD, monitoring, DR runbooks remain open).

### References

- ADR-023 (multi-tenancy)
- ADR-024 (country-driven config + data residency)
- System Architecture v1.1 §9
- Operational Readiness To-Do v1.2 (closes OR-103, partially closes OR-111)

---

## Updated ADR Index

| ADR | Title | Status |
|---|---|---|
| ADR-001 | Modular monolith at launch, service extraction later | Accepted |
| ADR-002 | Two-mode AI architecture (Mode 1 + Mode 2) | Accepted |
| ADR-003 | Market Launch as sole offerability authority | Accepted |
| ADR-004 | Pattern A for Forms Engine — one version per market | Accepted |
| ADR-005 | Protocolized autonomy, not open-ended autonomy | Accepted |
| ADR-006 | Interaction engine runs before clinician commits | Accepted |
| ADR-007 | No AI in community spaces | Accepted |
| ADR-008 | Bridge supply on consent revocation | Accepted |
| ADR-009 | Sensitive-category data default-hidden from delegates | Accepted |
| ADR-010 | WhatsApp primary, SMS fallback | Accepted |
| ADR-011 | Fake medication detection advisory-only at launch | Accepted |
| ADR-012 | Async-to-sync conversion preserves all data | Accepted |
| ADR-013 | Immutable append-only audit | Accepted |
| ADR-014 | 5-clinician minimum panel | Accepted |
| ADR-015 | Progressive consent presentation | Accepted |
| ADR-016 | AI model + provider decision | Satisfied by ADR-020 |
| ADR-017 | Data residency for Ghana launch | Satisfied by ADR-024 |
| ADR-018 | English-first launch posture | Accepted |
| ADR-019 | AI-first lab interpretation with explicit pending-review caveat | Accepted |
| **ADR-020** | **LLM provider — Anthropic Claude primary with multi-provider abstraction** | **Accepted (2026-04-25)** |
| **ADR-021** | **Sync video and audio — LiveKit, self-hosted** | **Accepted (2026-04-25)** |
| **ADR-022** | **Native-first, open-source-first technology stack** | **Accepted (2026-04-25)** |
| **ADR-023** | **Multi-tenancy via Model A (single deployment, logical separation, country-driven config)** | **Accepted (2026-04-25)** |
| **ADR-024** | **Country-driven configuration switches and payment processor routing** | **Accepted (2026-04-25)** |
| **ADR-025** | **Hosting on AWS, single region with DR replication** | **Accepted (2026-04-25)** |

---

## Document control

- **v1.0** — Initial ADR Addendum 020–025. Ratifies six new ADRs covering: LLM provider (closes ADR-016 reservation), sync video/audio infrastructure, native-first stack philosophy, multi-tenancy architecture, country-driven configuration switches (closes ADR-017 reservation), and AWS hosting decision.
- **Promotion path:** When the next consolidated ADR Set revision is produced, ADR-016 through ADR-025 merge into ADR Set v1.2. Until then, the ADR Set is canonical for ADR-001 through ADR-015 and these two addenda are canonical for ADR-016 through ADR-025.
- **Change discipline:** ADRs are immutable once Accepted. Reservations (none in this addendum) are filled in when their owning OR items close; the fill is appended, not edited.
