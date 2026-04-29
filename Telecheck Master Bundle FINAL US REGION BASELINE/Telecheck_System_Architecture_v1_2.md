# Telecheck — System Architecture & Service Boundaries

**Version:** 1.2
**Status:** Canonical for development
**Owner:** Engineering Lead
**Supersedes:** System Architecture v1.0, v1.1
**Parent documents:** Master Platform PRD v1.9, Contracts Pack v5.1 (filenames retain v5_00 convention; headers govern), Canonical Data Model v1.2, ADR Set v1.0 + ADR Addendum 016–019 + ADR Addendum 020–025 (with ADR-025 superseded by ADR-026) + ADR Addendum 026

---

## Change log from v1.0

v1.1 reflects architectural decisions ratified in ADR Addendum 020–025:

1. **Multi-tenancy added throughout.** Per ADR-023. New Tenant Configuration module; tenant resolution at gateway; per-tenant isolation across data, cache, search, storage, audit.
2. **Country-driven configuration switches.** Per ADR-024. Country attribute on tenant drives runtime selection of regulatory module, payment processor, integration adapters, locale, formats.
3. **Adapter abstractions.** Three new abstraction layers: PaymentProvider, ClinicianNetworkProvider, PharmacyProvider. Concrete implementations registered per country and selectable per tenant where the country permits choice.
4. **LLM provider abstraction.** Per ADR-020. AI Service has LLMProvider abstraction with multi-provider support; Anthropic Claude primary for clinical paths.
5. **Sync video infrastructure named.** Per ADR-021. LiveKit, self-hosted; AI Scribe runs as LiveKit Agents participant.
6. **Hosting decision.** Per ADR-026 (supersedes ADR-025). AWS us-east-1 primary, us-west-2 cold DR.
7. **External integrations list updated** to match the native-first / open-source-first stack matrix (ADR-022).
8. **15 modules** (was 14). Tenant Configuration added.

---

## 1. Purpose

This document defines how the Telecheck platform is decomposed into modules, what each module owns, where the boundaries are, and how modules communicate. It answers: "Which module is responsible for this?" and "How does this work in a multi-tenant, multi-country deployment?"

---

## 2. Architecture style

Telecheck uses a **modular monolith with domain-aligned modules** at launch (per ADR-001) running as a **single multi-tenant deployment** (per ADR-023) with country-driven configuration per tenant (per ADR-024).

Key properties:
- **One codebase, one deployment** — single AWS environment serving all tenants in all countries
- **15 internal modules + 1 separate AI Service** — module boundaries are designed for future service extraction
- **Modules communicate** through synchronous API calls or the internal event bus (becomes a message broker on extraction)
- **AI Service is separate from day one** because of distinct scaling, deployment cadence, and failure modes
- **Multi-tenancy is enforced at multiple layers** — application middleware, database row-level security, per-tenant encryption keys
- **Country-driven configuration** lives in the Tenant Configuration module and the CCR (Country Configuration Runtime) contract

---

## 3. Module map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          TELECHECK PLATFORM                            │
│                       (Multi-tenant, Single Deployment)                │
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   Identity    │  │   Consent    │  │    Care      │  │  Pharmacy  │ │
│  │   & Account   │  │   & Access   │  │  Delivery    │  │  & Fulfil  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   Clinical    │  │    Labs &    │  │     RPM      │  │ Community  │ │
│  │  Intelligence │  │  Documents   │  │    & CCM     │  │            │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Notification  │  │   Payment    │  │  Governance  │  │   Audit    │ │
│  │   & Comms     │  │   & Billing  │  │  & Config    │  │            │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │           Tenant Configuration (NEW — multi-tenant runtime)      │  │
│  │  - Tenant resolution from request context                        │  │
│  │  - Country-driven configuration switch (CCR runtime)             │  │
│  │  - Per-tenant integration adapter selection                      │  │
│  │  - Brand customization (theming, copy, custom domain)            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        Event Bus (internal)                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘

           ┌──────────────────────────────────┐
           │        AI Service (separate)      │
           │   Mode 1 (conversational)         │
           │   Mode 2 (protocol execution)     │
           │   AI Scribe (LiveKit Agents)      │
           │   LLMProvider abstraction         │
           └──────────────────────────────────┘
```

---

## 4. Module ownership and data

Per ADR-023, every entity in the Canonical Data Model carries `tenant_id`. Modules own their entities; the `tenant_id` is universal. See Canonical Data Model v1.2 for the complete entity-to-module map.

| Module | Owned entities (high-level) | Tenant scoping |
|---|---|---|
| Identity & Account | Account, Session, OTP, AuthDevice | All entities tenant-scoped |
| Consent & Access | Consent, ConsentVersion, Delegation, DelegationScope | All entities tenant-scoped |
| Care Delivery | Consult, ConsultEvent, Appointment, Episode | All entities tenant-scoped |
| Pharmacy & Fulfillment | Prescription, Refill, Dispensing, Shipment, PharmacyAdapter, ProductCatalog, Subscription | All tenant-scoped; PharmacyAdapter selection per tenant |
| Clinical Intelligence | InteractionSignal, Protocol, ProtocolVersion, ClinicalAction, MedicationRequest | All tenant-scoped; Protocol versions per tenant |
| Labs & Documents | LabResult, Document, LabInterpretation, Extraction | All tenant-scoped |
| RPM & CCM | RPMDevice, RPMReading, RPMAlert, CCMSubscription | All tenant-scoped |
| Community | Group, Post, Comment, Moderation, Membership | All tenant-scoped; per-tenant moderation policy |
| Notification & Comms | Notification, NotificationPreference, NotificationTemplate, MessageThread, Message | All tenant-scoped; templates per tenant |
| Payment & Billing | Payment, Subscription, Invoice, DiscountCode, AffiliateAccount, AffiliateConversion, PaymentProviderConfig | All tenant-scoped; PaymentProvider per tenant (driven by country) |
| Governance & Config | MarketLaunch, FeatureFlag, GuardrailTemplate, ProtocolActivation | Mostly tenant-scoped; some platform-wide governance |
| Audit | AuditEvent | Tenant-scoped (Audit Module enforces both tenant scoping AND immutability per ADR-013) |
| **Tenant Configuration (NEW)** | Tenant, TenantBrand, CountryProfile, CCRConfig, AdapterConfig, TenantUser | Tenant entity is the root; CountryProfile is platform-wide; AdapterConfig per tenant |
| Pharmacy Intelligence (across modules) | HerbDrugSignal, FakeMedDetection — owned by Clinical Intelligence | Tenant-scoped |
| AI Service (separate) | AIConversation, AISession, GuardrailEvaluation, ProtocolExecution — own data store | Tenant-scoped |

---

## 5. Multi-tenancy implementation

Per ADR-023, multi-tenancy is enforced at five layers (defense-in-depth):

### 5.1 Authentication layer
Every authenticated request resolves a `tenant_id` from the user's account. Users are tenant-scoped (one account belongs to exactly one tenant). Cross-tenant authentication is impossible.

### 5.2 API gateway layer
All API requests pass through a tenant resolution middleware that:
- Extracts `tenant_id` from authentication context
- Validates the tenant is `active`
- Loads tenant configuration (country, brand, adapters) into request context
- Applies tenant-scoped rate limits

For platform-admin endpoints, a separate platform-admin authentication path resolves `platform_admin = true` without a tenant context. Platform-admin endpoints can target a specific tenant via `X-Tenant-Id` header.

### 5.3 Application layer
Every database query in every module passes `tenant_id` as a query parameter. The query layer enforces this at the framework level — repositories require `tenant_id` argument; raw queries fail lint checks if they lack tenant filtering.

### 5.4 Database layer
PostgreSQL Row-Level Security (RLS) policies on every tenant-scoped table:

```sql
CREATE POLICY tenant_isolation ON consults
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

The `app.tenant_id` setting is set per-connection by the application middleware. RLS ensures that even a bug in application-layer filtering cannot expose cross-tenant data.

### 5.5 Encryption layer
Each tenant has a unique encryption key managed by AWS KMS. Tenant data at rest is encrypted with the tenant's key. A compromised application bug cannot decrypt cross-tenant data without the corresponding tenant's key.

### 5.6 What about platform admin?
Platform admin has read-only aggregate access (tenant counts, system health, cross-tenant metrics) — never raw tenant PHI. Platform admin queries that aggregate across tenants do so through dedicated aggregate-only views that don't expose row-level PHI. Platform-admin operations that need to act on a specific tenant's data (e.g., fixing a tenant configuration) are scoped to that tenant by `X-Tenant-Id` header and audited.

---

## 6. Country-driven configuration runtime (CCR)

Per ADR-024, country drives runtime selection of regulatory modules, integration adapters, and locale-specific behavior.

### 6.1 The CCR contract

Each tenant has a CCR record. Code calls `ccr.get(tenant_id, key)` and receives the country-appropriate value. The CCR-RUNTIME contract in Contracts Pack v5 documents the schema. Examples:

```python
ccr.get(tenant_id, "payment.processor")        # → "stripe" or "paystack"
ccr.get(tenant_id, "regulatory.module")        # → "us_hipaa_state_telehealth" or "gh_dpa_mdc"
ccr.get(tenant_id, "currency.code")            # → "USD" or "GHS"
ccr.get(tenant_id, "emergency.number")         # → "911" or "112"
ccr.get(tenant_id, "notification.sms_provider") # → "plivo" or "hubtel"
ccr.get(tenant_id, "clinician.network_adapter") # → "openloop" or "telecheck_pllc" or "telecheck_gh_panel"
```

### 6.2 CCR templates

Country profiles are stored as templates. Each country has one template; tenants in that country inherit it. A tenant can override specific values (e.g., choose Wheel instead of OpenLoop) where the country permits.

CCR templates at launch:
- **US** — full US country profile per Master PRD §4.1
- **GH** — full Ghana country profile per Master PRD §4.2

Future country additions: new template + new integration adapters where existing don't fit.

### 6.3 Code organization

Per-country regulatory modules:
- `lib/regulatory/us/` — HIPAA + state telehealth + DEA logic
- `lib/regulatory/gh/` — Ghana DPA + MDC + Pharmacy Council logic

These export a standard interface. Application code calls the regulatory interface; the CCR routes to the correct module based on tenant country.

---

## 7. Adapter abstractions

Three adapter abstractions support the country-driven and tenant-driven choice of integrations:

### 7.1 PaymentProvider

```
interface PaymentProvider {
  collect(amount, currency, method, customer_id) → Payment
  refund(payment_id, amount?) → Refund
  subscribe(customer_id, plan, ...) → Subscription
  modify_subscription(subscription_id, ...) → Subscription
  cancel_subscription(subscription_id, ...) → Subscription
  payout(account_id, amount) → Payout  // for affiliate payouts
  webhook_handler(payload) → Event
}
```

Concrete implementations:
- `StripeProvider` — US tenants
- `PaystackProvider` — Ghana tenants

Selection: driven by tenant country (US → Stripe, GH → Paystack). Not tenant-overridable; payment processor is a country-level decision.

### 7.2 ClinicianNetworkProvider

```
interface ClinicianNetworkProvider {
  request_review(case_data, tenant_id, ...) → CaseAssignment
  get_clinician_capacity() → CapacityReport
  webhook_handler(payload) → Event  // for review decisions
  list_clinicians() → [Clinician]  // for tenant admin visibility
}
```

Concrete implementations at launch:
- `TelecheckPLLCProvider` — Telecheck's owned PLLC for US tenants who choose it
- `OpenLoopProvider` — OpenLoop API integration for US tenants who choose it
- `WheelProvider` — Wheel API integration for US tenants who choose it
- `TelecheckGhanaProvider` — Telecheck Ghana's in-house clinician panel

Selection: per tenant. Country gates available choices (US adapters not selectable for Ghana tenant and vice versa).

### 7.3 PharmacyProvider

```
interface PharmacyProvider {
  fulfill_prescription(prescription_data) → FulfillmentRequest
  get_inventory(medication_codes, location?) → InventoryReport
  cancel_fulfillment(fulfillment_id) → CancellationResult
  webhook_handler(payload) → Event  // for shipment status updates
  get_shipment_status(shipment_id) → ShipmentStatus
}
```

Concrete implementations at launch:
- `TruepillProvider` — US tenants
- `HoneybeeProvider` — US tenants
- `CapsuleProvider` — US tenants
- `AltoProvider` — US tenants
- `GhanaPartnerPharmacyProvider` — Ghana tenants (one or more partner integrations)

Selection: per tenant. Country gates available choices.

### 7.4 LLMProvider (in AI Service)

```
interface LLMProvider {
  chat_completion(messages, model, params) → CompletionResponse
  structured_output(messages, schema, model, params) → StructuredResponse
  stream_chat(messages, model, params) → AsyncIterator[Chunk]
  count_tokens(messages, model) → int
}
```

Concrete implementations:
- `AnthropicProvider` — primary for clinical paths
- `OpenAIProvider` — primary alternative
- `GeminiProvider` — for cost arbitrage on high-volume routes
- `BedrockClaudeProvider` — Claude via AWS Bedrock
- `AzureOpenAIProvider` — for Microsoft/Azure-relationship tenants
- `LlamaSelfHostedProvider` — for non-clinical paths only

Selection: per route, configured globally; non-clinical routes can be tenant-overridden.

### 7.5 NotificationChannelProvider (existing pattern, extended for multi-tenant)

WhatsApp, SMS (per country), Email, Push providers — same adapter pattern.

---

## 8. Communication patterns

### 8.1 Synchronous (request/response)

Used when the caller needs a result before proceeding:
- Care Delivery → Clinical Intelligence: interaction engine check before prescribing
- Care Delivery → Consent & Access: consent validation before clinical action
- All modules → Identity & Account: authentication and authorization
- All modules → **Tenant Configuration**: tenant context resolution, CCR lookups, adapter selection
- All modules → Governance & Config: feature gate check
- Care Delivery → AI Service: Mode 2 case preparation
- Labs → AI Service: lab interpretation
- All modules → Audit: audit record write (synchronous to guarantee write-before-proceed, per AUDIT-002)

### 8.2 Asynchronous (event-driven)

Used when the caller doesn't need to wait for downstream processing:
- Care Delivery → Notification: "refill approved, notify patient"
- Care Delivery → Pharmacy: "refill approved, queue for fulfillment"
- Labs → Clinical Intelligence: "lab confirmed, re-evaluate drug-lab signals"
- RPM → Notification: "alert generated, notify clinician"
- RPM → Care Delivery: "critical alert, may need consult escalation"
- Any module → Audit: secondary audit consumers (reporting, analytics)
- Clinical Intelligence → Adverse Event: "override recorded, monitor for correlation"
- Pharmacy → Payment: "shipment confirmed, charge subscription if applicable"
- Payment → Affiliate (within Payment & Billing): "subscription started, credit affiliate if applicable"

### 8.3 Event bus

At launch, the event bus is an in-process pub/sub within the monolith. Events follow the schema defined in Contracts Pack 00-DOMAIN-EVENTS.md:
- Envelope: `{ event_id, event_type, tenant_id, aggregate_type, aggregate_id, occurred_at, actor, payload }`
- **`tenant_id` is mandatory** in every event envelope per multi-tenancy enforcement
- Partitioned by aggregate
- At-least-once delivery guarantee
- Consumers are idempotent (per 00-IDEMPOTENCY.md)
- Subscribers honor tenant context and only process events for tenants they're authorized for

---

## 9. External integrations

Per ADR-022 native-first stack matrix. Updated from v1.0:

| Integration | Module responsible | Protocol | Notes |
|---|---|---|---|
| **LiveKit (self-hosted)** | Care Delivery | WebRTC + LiveKit SDK | Per ADR-021. Sync video + AI Scribe via LiveKit Agents |
| **Anthropic Claude** | AI Service | REST API | Per ADR-020. Primary clinical LLM |
| **OpenAI / Gemini / others** | AI Service | REST API | Configured alternatives via LLMProvider abstraction |
| **Faster-Whisper (self-hosted)** | AI Service | Internal API | Self-hosted GPU instances; STT for AI Scribe |
| **Deepgram (transitional)** | AI Service | REST API | Fallback STT for first 90 days during volume ramp |
| **AWS Textract Medical** | Labs & Documents | REST API | Lab/medical document OCR |
| **Stripe** | Payment & Billing | SDK / API | US tenants payment processing |
| **Paystack** | Payment & Billing | SDK / API | Ghana tenants payment processing |
| **WhatsApp Business API (via 360dialog)** | Notification & Comms | REST API | Patient engagement; per-template approval |
| **Hubtel / mNotify** | Notification & Comms | REST API | Ghana SMS |
| **Plivo / MessageBird** | Notification & Comms | REST API | US SMS |
| **Postmark** | Notification & Comms | REST API | Transactional email |
| **OpenLoop / Wheel / Steady** | Care Delivery | REST API + webhooks | US clinician network adapters |
| **Truepill / Honeybee / Capsule / Alto** | Pharmacy & Fulfillment | REST API + webhooks | US pharmacy partner adapters |
| **Ghana partner pharmacies** | Pharmacy & Fulfillment | REST API or batch | Ghana pharmacy partners |
| **Stripe Identity** | Identity & Account | SDK / API | KYC for US tenants where required |
| **PostHog (self-hosted)** | (Observability layer) | SDK | Analytics, funnels, feature flags, A/B testing, session replay |
| **Meilisearch (self-hosted)** | Various | REST API | Search indices per tenant |
| **Metabase (self-hosted)** | Admin Backend | SQL connection | BI dashboards |
| **Grafana + Loki + Prometheus + Tempo (self-hosted)** | (Observability) | OpenTelemetry | Logs, metrics, traces |
| **Sentry (self-hosted)** | (Observability) | SDK | Error tracking |
| **AWS S3** | Various (Labs, Audit, etc.) | S3 API | Object storage |
| **AWS KMS** | Cross-cutting | KMS API | Per-tenant encryption keys |
| **AWS Secrets Manager** | Cross-cutting | API | Secrets management |
| **FCM / APNs** | Notification & Comms | Direct | Push notifications |

---

## 10. Cross-cutting concerns

### 10.1 Authentication & authorization

Every request passes through Identity & Account for authentication. **Tenant Configuration** resolves tenant from authentication context. Authorization is checked by the owning module using the Consent & Access module for consent/delegation validation, with RBAC v1.1 enforcing role-based access including the platform-admin / tenant-admin distinction.

### 10.2 Rate limiting

Applied at the API gateway level. Tenant-scoped rate limits — each tenant has its own rate limit budget. Platform-admin endpoints have separate rate limits.

### 10.3 Caching

Redis (AWS ElastiCache). All cache keys are tenant-scoped (prefix or namespace per tenant). Cross-tenant cache reads are impossible.

### 10.4 Background jobs

BullMQ on Redis (per ADR-022). Jobs carry tenant context; workers honor it. Failed jobs are tenant-scoped in their failure logs.

### 10.5 Observability

OpenTelemetry instrumentation everywhere. Traces include `tenant_id` as a tag. Logs include `tenant_id`. Metrics labeled by `tenant_id` for per-tenant performance visibility. Aggregate cross-tenant metrics for platform-admin dashboards.

LGTM stack (Grafana + Loki + Prometheus + Tempo) self-hosted per ADR-022. Sentry self-hosted for error tracking.

### 10.6 Secrets and encryption

AWS Secrets Manager for application secrets. AWS KMS for per-tenant encryption keys. Tenant data at rest is encrypted with the tenant's KMS key. Audit data is encrypted with a separate key from clinical data per AUDIT contract.

---

## 11. Hosting and deployment

Per ADR-026 (supersedes ADR-025): AWS, single region (us-east-1 Virginia), with us-west-2 (Oregon) cold DR.

### 11.1 Infrastructure topology

- **Region:** us-east-1 (Virginia) primary; us-west-2 (Oregon) for cold DR snapshots and disaster recovery scenarios
- **AZ:** minimum 2 availability zones in us-east-1 for high availability
- **Compute:** ECS Fargate or EC2 for the monolith (3+ instances, behind ALB); separate compute pool for AI Service (with GPU instances for self-hosted Whisper); LiveKit servers (3× t3.large)
- **Database:** AWS RDS Multi-AZ PostgreSQL (db.r6g.xlarge or smaller at launch)
- **Cache:** AWS ElastiCache Redis (cache.r6g.large)
- **Object storage:** AWS S3 with cross-region replication to us-west-2
- **CDN:** AWS CloudFront for static assets
- **DNS:** AWS Route 53
- **Load balancer:** AWS Application Load Balancer (ALB) for HTTP; Network Load Balancer (NLB) for LiveKit WebRTC
- **WAF:** AWS WAF on public endpoints; DDoS protection via AWS Shield Standard

### 11.2 Encryption

| Data type | Encryption |
|---|---|
| Data at rest (clinical) | AES-256 with per-tenant KMS key |
| Data at rest (audit) | AES-256 with separate per-tenant KMS key (different from clinical) |
| Data in transit (API) | TLS 1.3 |
| Data in transit (mobile apps) | TLS 1.3 + certificate pinning |
| Data in transit (LiveKit media) | AES-128 (SRTP) |
| Backups | Encrypted with same per-tenant KMS keys |
| Payment data | Never stored by Telecheck — handled by Stripe/Paystack (PCI DSS compliant) |
| OTP codes | Hashed (bcrypt) before storage; never logged in plaintext |

### 11.3 Disaster recovery

| Metric | Target |
|---|---|
| RPO | 1 hour |
| RTO | Hours to low-tens-of-hours (cold DR; per ADR-026) |
| Backup frequency | Continuous replication + hourly snapshots |
| Backup retention | 30 days operational; audit/clinical per retention rules |
| DR region | us-west-2 (cold DR per ADR-026) |
| DR testing | Quarterly failover test |

### 11.4 Cross-border posture (per ADR-026)

The platform runs in `us-east-1` (United States). Both Heros (US tenant) and Telecheck-Ghana (Ghana tenant) data are processed in `us-east-1`. This is an explicit, accepted architectural posture per ADR-026.

**Heros (US tenant):** Standard HIPAA-region posture. Heros patient data is processed in the United States. The BAA chain (Heros → Telecheck → AWS US) is a standard chain.

**Telecheck-Ghana (Ghana tenant):** Cross-border posture. Ghana patient data is processed in the United States. The architectural decision is recorded; the operational implementation has the following requirements:

- Ghana DPC registration for cross-border processing with AWS (US) as a sub-processor
- Specific contractual mechanism (jurisdictional instrument under Ghana DPC) **[COUNSEL-REQUIRED]**
- Patient-facing privacy notice disclosing US processing **[COUNSEL-REQUIRED]** for specific language
- Clinician onboarding disclosure of US processing
- Sub-processor list and disclosure obligations **[COUNSEL-REQUIRED]** for completeness

The country-config abstractions (per ADR-024 and the CCR runtime contract) continue to govern *jurisdictional* obligations (consent, retention, DPC mechanism by country_of_residence). Per ADR-026, those abstractions no longer drive *physical region selection* at launch — physical region is single us-east-1 for all tenants.

### 11.5 Infrastructure security baseline

- All servers in private subnets; no direct internet access to application servers
- WAF on all public endpoints
- DDoS protection on API gateway
- Secrets management via AWS Secrets Manager
- Container image scanning before deployment (ECR + Inspector)
- Dependency vulnerability scanning in CI/CD pipeline (Snyk, Dependabot, or equivalent)
- Monthly penetration testing (external) post-launch
- SOC 2 Type II compliance target within 12 months of launch (system architecture supports it; active operating evidence accumulating from day 1)
- HIPAA BAA with AWS in place for US tenants (standard HIPAA-region chain per ADR-026)
- Ghana DPC registration for cross-border processing of Ghana patient data in us-east-1 (United States) per ADR-026. Specific contractual mechanism (jurisdictional instrument under Ghana DPC) **[COUNSEL-REQUIRED]** before Telecheck-Ghana launch.

### 11.6 Multi-region readiness (post-launch, Phase 2+)

The platform runs in single region us-east-1 at launch per ADR-026. Multi-region capabilities are deferred:

- **Warm standby in us-west-2** — tighter RTO than current cold DR; Phase 2 if launch operations require it
- **Regional media routing for Ghana sync video** — LiveKit edge node in af-south-1 or eu-west-1 (London/Frankfurt) routing media for Ghana patients while data plane remains us-east-1; Phase 2 if Ghana sync video latency becomes a launch issue
- **Active-active multi-region** — out of scope at launch and remains so unless a future ADR reopens it
- **Per-country physical region routing** — out of scope at launch and explicitly precluded by ADR-026's locked single-region architecture; any reopening requires a new ADR superseding the relevant clauses of ADR-026

This is not a launch deliverable but the architecture supports it.

---

## 12. Capacity and scaling

### 12.1 Module-level scaling

The monolith scales horizontally — additional instances behind the ALB. Each module within the monolith handles its own concurrency.

### 12.2 AI Service scaling

Separate deployment scales independently:
- Mode 1 / Mode 2 calls: stateless, scale by request volume
- AI Scribe: stateful per call, scales by concurrent video consults; GPU instances for Whisper

### 12.3 LiveKit scaling

LiveKit's SFU architecture handles thousands of concurrent participants per server. Add LiveKit servers as concurrent video consult volume grows.

### 12.4 Database scaling

PostgreSQL on RDS Multi-AZ. Read replicas added as read traffic grows. Consider Aurora PostgreSQL migration when single-instance capacity is insufficient.

### 12.5 Per-tenant scaling considerations

Tenant-scoped rate limits prevent one tenant from monopolizing resources. Hot-tenant detection alerts platform admin if a single tenant disproportionately impacts platform performance. Tenant-tiered resource allocation (enterprise tenants may get higher rate limits) is a future-config concept; not at launch.

---

## 13. The Tenant Configuration module (NEW in v1.1)

The Tenant Configuration module is the new 15th module added in v1.1. It owns:

### 13.1 Entities owned

- `Tenant` — tenant registration, country, brand, status
- `TenantBrand` — display name, logo URL, primary colors, design tokens, custom domain
- `CountryProfile` — CCR templates per country (platform-wide)
- `CCRConfig` — per-tenant CCR overrides where the country permits
- `AdapterConfig` — per-tenant adapter selections (clinician network, pharmacy, etc.)
- `TenantUser` — platform-admin and tenant-admin user accounts; role assignments

### 13.2 Responsibilities

- Resolve tenant from authentication context at request start
- Load tenant configuration into request context (cached per-instance)
- Provide CCR lookups: `ccr.get(tenant_id, key)`
- Provide adapter selection: `adapter.payment(tenant_id)`, `adapter.clinician_network(tenant_id)`, etc.
- Manage tenant lifecycle: create, suspend, configure, archive
- Publish tenant lifecycle events (`tenant.created`, `tenant.suspended`, `tenant.config_updated`)

### 13.3 Public interface

Synchronous methods called by all other modules:
- `resolve_tenant(auth_context) → TenantContext`
- `get_tenant(tenant_id) → Tenant`
- `get_brand(tenant_id) → TenantBrand`
- `get_ccr(tenant_id) → CCR`
- `get_adapter(tenant_id, adapter_type) → AdapterInstance`

Asynchronous events published:
- `tenant.created` { tenant_id, country, brand_name, created_by }
- `tenant.suspended` { tenant_id, reason, suspended_by }
- `tenant.activated` { tenant_id, activated_by }
- `tenant.config_updated` { tenant_id, config_keys, updated_by }

---

## 14. What this architecture explicitly does NOT do at launch

- **Per-country deployments** (Model B). Single deployment for all tenants in all countries.
- **Per-tenant deployments**. Multi-tenant within one deployment.
- **Federated patient identity across tenants.** Patient accounts are tenant-scoped.
- **Cross-tenant data sharing.** Tenants are isolated.
- **Multi-region active-active.** Single region (us-east-1) at launch with us-west-2 cold DR per ADR-026.
- **Productized self-service tenant onboarding.** Manual platform-admin process at launch.
- **Self-managed PostgreSQL or Redis.** Managed RDS and ElastiCache at launch; revisit at scale.
- **Kubernetes (EKS).** Docker Compose or ECS Fargate at launch; k3s when complexity justifies.

---

## Document control

- **v1.2** — Region migration per ADR-026 (supersedes ADR-025). Hosting: us-east-1 primary, us-west-2 cold DR (was af-south-1 / us-east-1). New §11.4 "Cross-border posture" section explicitly documenting Heros (standard HIPAA region) and Telecheck-Ghana (Ghana data processed in us-east-1; jurisdictional mechanism `[COUNSEL-REQUIRED]`). §11.5 renumbered to §11.6 and reframed: warm DR, regional media routing for Ghana sync video, active-active, and per-country physical region routing all explicitly Phase 2+ or out of scope. RTO updated to "hours to low-tens-of-hours" reflecting cold DR posture (was 4 hours under warm-standby framing). Country-config abstractions (per ADR-024 and CCR runtime) continue to govern jurisdictional obligations; physical region is single us-east-1 at launch. No changes to tenant isolation mechanism (per-tenant KMS, RLS, tenant_id), the 15-module structure, or adapter abstractions. Substantive system-design content from v1.1 preserved unchanged.
- **v1.1** — Multi-tenancy added (ADR-023). Country-driven configuration (ADR-024). New Tenant Configuration module (15th module). Adapter abstractions: PaymentProvider, ClinicianNetworkProvider, PharmacyProvider, LLMProvider. External integrations updated to native-first stack matrix (ADR-022). Hosting decision: AWS af-south-1 with us-east-1 DR (ADR-025). LiveKit self-hosted for sync video (ADR-021). Anthropic Claude primary LLM with multi-provider abstraction (ADR-020). 27 entities now all tenant-scoped per Canonical Data Model v1.2.
- **v1.0** — Initial canonical (single-tenant, single-market assumption); superseded.
- **Next review:** after engineering team reviews adapter abstractions for completeness; after first non-trivial tenant onboarding (Heros migration) tests the platform's multi-tenant boundaries in production.
- **Change discipline:** changes to module boundaries, data ownership, communication patterns, or multi-tenancy enforcement layers require Engineering Lead sign-off and must be reflected in the Canonical Data Model and State Machines.
