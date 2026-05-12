# Telecheck — Canonical Data Model

**Version:** 1.3
**Status:** Canonical for development
**Owner:** Engineering Lead
**Supersedes:** Canonical Data Model v1.2 (which supersedes v1.0)
**Parent documents:** System Architecture v1.2, Master Platform PRD v1.10, Contracts Pack v5.2 (AUDIT_EVENTS at v5.3 post-P-011; filenames retain v5_00 convention; headers govern), ADR Addendum 020–025 (with ADR-025 superseded by ADR-026), ADR-027/028/029

---

## Change log from v1.2 (added at v1.3 per P-011 / SI-001 closure 2026-05-11)

1. **§4.16 MedicationRequest** added as the canonical record of a prescribing decision. Path 1 shape: NO `interaction_override_id` column; Med Interaction Engine integration is via the `medication_request.interaction_safety_hold_triggered` domain event with clean module-boundary separation per ADR-001.
2. **`audit_events.audit_i012_workload_evidence_required` CHECK constraint amended** — `'prescribing.protocol_authorization_granted'` added to the `action NOT IN (...)` list per the AUDIT_EVENTS v5.3 §I-012 closure rule amendment. This is the database-level enforcement that prevents the new I-012 clinician confirmation action from bypassing the non-null `ai_workload_type` + `autonomy_level` requirement.
3. Companion changes ship under the same P-011: State Machines v1.1 → v1.2 (§19 MedicationRequest lifecycle); AUDIT_EVENTS v5.2 → v5.3 (7 net-new Category A action IDs + I-012 closure-rule amendment); DOMAIN_EVENTS v5.2 in-place (4 net-new event types).

Total entity count rises from 41 to 42 (inventory in §3.5 entity #18 footnote pointer updated to canonical §4.16 expansion).

---

## Change log from v1.0

v1.1 reflects the multi-tenancy decision (ADR-023):

1. **`tenant_id` added to every entity** as a non-null foreign key. No exceptions.
2. **New entities for multi-tenancy** added: Tenant, TenantBrand, CountryProfile, CCRConfig, AdapterConfig, TenantUser.
3. **Account entity scoped to tenant** — same person can have separate accounts in different tenants; cross-tenant identity is not in scope.
4. **Audit envelope updated** to require tenant_id on every audit row.
5. **Indexing recommendations** updated to include tenant_id as the leading column on most tenant-scoped indexes.
6. **PostgreSQL Row-Level Security policies** specified for every tenant-scoped table.
7. **Encryption-at-rest mapping** updated — per-tenant KMS key per ADR-024.

The total entity count rises from 27 to 33: 27 original (all tenant-scoped) + 6 new tenant-management entities.

---

## 1. Purpose

This document defines the canonical data entities of the Telecheck platform — what they are, what they own, what their relationships are, and how they are scoped. It is the source of truth for database schema design.

Engineering implements migrations against this model. Slice PRDs reference these entities. The Audit and Contracts pack derive their record envelopes from this model.

---

## 2. Conventions

- **Primary keys:** ULID (`ulid` type or VARCHAR(26)) for human-readability and time-ordering. Prefixed by entity type (e.g., `acc_01H...` for accounts). **Exception:** `tenants.id` uses the operating-tenant identifier format `Telecheck-{country}` (e.g., `Telecheck-US`, `Telecheck-Ghana`) per Master Platform PRD v1.10 §17 + Glossary v5.2 C3 brand structure — NOT a ULID. This is the single PK exception in the data model. The column type remains VARCHAR(26) (sufficient for the longest current value `Telecheck-Ghana` = 15 chars, with headroom for future country-name expansions). All FK references to `tenants.id` retain VARCHAR(26) — no cascade-rename was needed.
- **Foreign keys:** stored as the referenced entity's primary key type (ULID for entity-keyed FKs; VARCHAR(26) `Telecheck-{country}` string for `tenant_id` FKs per the exception above).
- **Timestamps:** all entities have `created_at` and `updated_at` (timestamptz, UTC). Some have additional lifecycle timestamps (e.g., `submitted_at`, `confirmed_at`).
- **Tenant scoping:** every entity has `tenant_id` (NOT NULL, foreign key to `tenants.id`). PostgreSQL Row-Level Security policy enforces tenant isolation per ADR-023.
- **Soft deletion:** clinical entities use `deleted_at` (timestamptz, nullable). Audit entities are append-only — never deleted, never updated (ADR-013).
- **Versioning:** entities that have versioned states (e.g., Consent, Protocol, IntakeForm) use a separate version entity (e.g., ConsentVersion) with the parent entity tracking `current_version_id`.
- **Encryption at rest:** all PHI columns encrypted via per-tenant KMS key. Encryption is transparent at the application layer — the database uses pgcrypto with KMS-managed keys.

---

## 3. The 42 entities — overview

v1.3 expands to 42 entities: 6 tenant-management entities (introduced in v1.1), 27 inherited from v1.0 (now tenant-scoped), 8 NEW ecom entities (introduced in v1.2 per CRITICAL-02 remediation; schemas in §4-bis), and **1 NEW prescribing entity added at v1.3 (MedicationRequest §4.16 per P-011 / SI-001 closure 2026-05-11)**.

### 3.1 Tenant management (NEW in v1.1) — 6 entities

| # | Entity | Owner module | Notes |
|---|---|---|---|
| 1 | Tenant | Tenant Configuration | Root entity for multi-tenancy |
| 2 | TenantBrand | Tenant Configuration | Brand identity per tenant |
| 3 | CountryProfile | Tenant Configuration | Platform-wide CCR templates per country |
| 4 | CCRConfig | Tenant Configuration | Per-tenant overrides of CCR template values |
| 5 | AdapterConfig | Tenant Configuration | Per-tenant integration adapter selections |
| 6 | TenantUser | Tenant Configuration | Platform-admin and tenant-admin user accounts |

### 3.2 Identity & Account — 4 entities

| # | Entity | Owner module | Notes |
|---|---|---|---|
| 7 | Account | Identity & Account | Patient or delegate account, tenant-scoped |
| 8 | Session | Identity & Account | Authenticated session token |
| 9 | OTP | Identity & Account | One-time password challenges |
| 10 | AuthDevice | Identity & Account | Registered devices for an account |

### 3.3 Consent & Access — 4 entities

| # | Entity | Owner module | Notes |
|---|---|---|---|
| 11 | Consent | Consent & Access | Patient's consent records (one per consent type) |
| 12 | ConsentVersion | Consent & Access | Versioned consent terms text |
| 13 | Delegation | Consent & Access | Delegate access grant |
| 14 | DelegationScope | Consent & Access | Specific scopes within a delegation |

### 3.4 Care Delivery — 3 entities

| # | Entity | Owner module | Notes |
|---|---|---|---|
| 15 | Consult | Care Delivery | Async or sync consultation; converts seamlessly per ADR-012 |
| 16 | ConsultEvent | Care Delivery | State transitions and events on a consult |
| 17 | Episode | Care Delivery | Long-running care episode (chronic condition management) |

### 3.5 Pharmacy & Fulfillment — 5 entities

| # | Entity | Owner module | Notes |
|---|---|---|---|
| 18 | MedicationRequest | Pharmacy & Fulfillment | Renamed from "Prescription" per Contracts Pack vocabulary |
| 19 | Refill | Pharmacy & Fulfillment | Refill request and lifecycle |
| 20 | Dispensing | Pharmacy & Fulfillment | Pharmacist confirmation of dispensing |
| 21 | Shipment | Pharmacy & Fulfillment | Last-mile delivery tracking |
| 22 | ProductCatalog | Pharmacy & Fulfillment | Per-tenant medication and product catalog |

### 3.6 Clinical Intelligence — 3 entities

| # | Entity | Owner module | Notes |
|---|---|---|---|
| 23 | InteractionSignal | Clinical Intelligence | Signals raised by interaction engine |
| 24 | Protocol | Clinical Intelligence | Versioned clinical protocol |
| 25 | ProtocolVersion | Clinical Intelligence | Specific version of a protocol with envelope, exclusions, thresholds |

### 3.7 Labs & Documents — 2 entities

| # | Entity | Owner module | Notes |
|---|---|---|---|
| 26 | LabResult | Labs & Documents | Lab values with extraction provenance |
| 27 | Document | Labs & Documents | Patient-uploaded documents |

### 3.8 RPM & CCM — 1 entity

| # | Entity | Owner module | Notes |
|---|---|---|---|
| 28 | RPMReading | RPM & CCM | Readings ingested from devices or manual entry |

### 3.9 Community — 1 entity

| # | Entity | Owner module | Notes |
|---|---|---|---|
| 29 | CommunityPost | Community | Posts and replies in patient groups |

### 3.10 Notification & Comms — 1 entity

| # | Entity | Owner module | Notes |
|---|---|---|---|
| 30 | Notification | Notification & Comms | Notification records (one per send attempt) |

### 3.11 Audit — 1 entity

| # | Entity | Owner module | Notes |
|---|---|---|---|
| 31 | AuditEvent | Audit | Append-only audit per ADR-013 |

### 3.12 Ecom & Subscription Management (NEW in v1.2) — 8 entities

| # | Entity | Owner module | Notes |
|---|---|---|---|
| 32 | Subscription | Pharmacy & Fulfillment | Auto-renewing prescription subscription (Hims/Ro mechanic) |
| 33 | SubscriptionEvent | Pharmacy & Fulfillment | Append-only event log for subscription state transitions |
| 34 | Cart | Ecom Backend | Multi-product checkout container |
| 35 | CartItem | Ecom Backend | Individual product entry within a cart |
| 36 | DiscountCode | Ecom Backend | Per-tenant promotional codes |
| 37 | DiscountCodeRedemption | Ecom Backend | Append-only redemption log |
| 38 | AffiliateAccount | Ecom Backend | Affiliate marketing partner account |
| 39 | AffiliateConversion | Ecom Backend | Conversion event with attribution and commission |

(Note: IntakeForm and IntakeResponse are managed by the Forms/Intake Engine module; their schema is in the slice PRD and FORMS_ENGINE contract.)

---

## 4. New tenant management entities — schemas

### 4.1 Tenant

The root entity for multi-tenancy.

**v1.10 brand-structure note (per Master Platform PRD v1.10 §17 + Glossary v5.2 C3):**
The `id` column is the **operating-tenant identifier** (`Telecheck-{country}` format, e.g., `Telecheck-US`, `Telecheck-Ghana`) — internal/B2B-facing. The `consumer_dba` column is the **patient-facing brand** (e.g., `Heros Health` for `Telecheck-US`; `Heros Health Ghana` for `Telecheck-Ghana`). Code, schema, audit, RLS policies, KMS key naming, and platform-admin UI write `id`; patient-facing surfaces source `consumer_dba` from `tenant.consumer_dba`, NEVER from `tenant.id`. Bare `Heros` (without `Health` or DBA framing) is forbidden as a tenant or operator identifier. The `legal_entity` column carries the per-country incorporated subsidiary (e.g., `Telecheck Health LLC` for US; `Telecheck-Ghana Ltd.` for GH). The `consumer_subdomain` column carries the country-instanced subdomain (`heroshealth.com`, `ghana.heroshealth.com`).

```sql
CREATE TABLE tenants (
  -- Operating-tenant identifier per Master PRD v1.10 §17 (NOT a ULID — the
  -- single PK exception in this data model per §2 conventions). Format:
  -- 'Telecheck-{country}' where {country} is the country name or ISO code
  -- corresponding to the operating subsidiary. CHECK constraint below
  -- enforces the format. Code/schema/audit/RLS/KMS naming all use this value;
  -- patient-facing surfaces never render this — they render consumer_dba.
  id                  VARCHAR(26) PRIMARY KEY,           -- 'Telecheck-US', 'Telecheck-Ghana', ...

  -- Country of care (ISO 3166-1 alpha-2). Drives CCR resolution per ADR-024.
  country             CHAR(2)      NOT NULL,             -- 'US', 'GH'

  -- Lifecycle status.
  status              VARCHAR(20)  NOT NULL,             -- 'active', 'suspended', 'draft', 'archived'

  -- Operating-tenant display name shown in platform-admin UI. Typically
  -- mirrors `id` (e.g., 'Telecheck-US') but is a separate column to allow
  -- richer admin-side rendering (e.g., "Telecheck-US (Heros Health DBA)")
  -- without polluting the canonical tenant identifier.
  display_name        VARCHAR(200) NOT NULL,             -- 'Telecheck-US', 'Telecheck-Ghana'

  -- Patient-facing consumer DBA (Heros Health country-instance per C3).
  -- Sourced by all patient-facing surfaces; NEVER expose `id` to a patient.
  -- (Added 2026-05-02 per v1.10.1 hygiene cycle Group 5B §CDM row 27.)
  consumer_dba        VARCHAR(200) NOT NULL,             -- 'Heros Health', 'Heros Health Ghana'

  -- Per-country incorporated legal entity. Used by audit-export, regulatory
  -- filings, contract metadata (BAAs etc.). (Added 2026-05-02.)
  legal_entity        VARCHAR(200) NOT NULL,             -- 'Telecheck Health LLC', 'Telecheck-Ghana Ltd.'

  -- Country-instanced consumer subdomain serving the DBA's web/mobile UI.
  -- Drives subdomain-based tenant resolution in the application middleware
  -- (per Tenant Threading Addendum v1.0 + src/lib/tenant-context.ts in the
  -- code repo). (Added 2026-05-02.)
  consumer_subdomain  VARCHAR(200) NOT NULL,             -- 'heroshealth.com', 'ghana.heroshealth.com'

  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  activated_at        TIMESTAMPTZ,
  suspended_at        TIMESTAMPTZ,
  archived_at         TIMESTAMPTZ,

  -- Operational metadata
  created_by          VARCHAR(26)  NOT NULL,             -- tenant_user_id of platform admin who created
  notes               TEXT,                              -- internal notes for platform admin

  CONSTRAINT tenant_country_valid    CHECK (country IN ('US', 'GH')),  -- extend as countries added
  CONSTRAINT tenant_id_format_valid  CHECK (id ~ '^Telecheck-[A-Z][A-Za-z]+$'),
  CONSTRAINT tenant_id_no_bare_heros CHECK (id NOT ILIKE 'Heros%'),  -- per Glossary v5.2 anti-pattern
  CONSTRAINT consumer_dba_starts_heros_health CHECK (consumer_dba LIKE 'Heros Health%')  -- C3 invariant
);

CREATE INDEX idx_tenants_status   ON tenants (status);
CREATE INDEX idx_tenants_country  ON tenants (country);
```

**Canonical seed values at v1.10 promotion 2026-05-01:**

| `id` | `country` | `display_name` | `consumer_dba` | `legal_entity` | `consumer_subdomain` |
|---|---|---|---|---|---|
| `Telecheck-US` | `US` | `Telecheck-US` | `Heros Health` | `Telecheck Health LLC` | `heroshealth.com` |
| `Telecheck-Ghana` | `GH` | `Telecheck-Ghana` | `Heros Health Ghana` | `Telecheck-Ghana Ltd.` | `ghana.heroshealth.com` |

### 4.2 TenantBrand

Per-tenant brand identity and customization.

```sql
CREATE TABLE tenant_brands (
  tenant_id       VARCHAR(26) PRIMARY KEY REFERENCES tenants(id),
  
  -- Display identity
  brand_name      VARCHAR(200) NOT NULL,             -- "Heros", "Telecheck"
  logo_url        TEXT,                              -- S3 URL
  primary_color   VARCHAR(7),                        -- hex
  secondary_color VARCHAR(7),                        -- hex
  accent_color    VARCHAR(7),                        -- hex
  
  -- Domains
  custom_domain   VARCHAR(255),                      -- "app.heroshealth.com"
  custom_domain_verified BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Legal
  terms_of_service_url TEXT,
  privacy_policy_url  TEXT,
  
  -- Support
  support_email   VARCHAR(255),
  support_phone   VARCHAR(50),
  
  -- Design tokens (JSON for flexibility)
  design_tokens   JSONB,                             -- color, typography, spacing overrides per Design System
  
  -- Notification copy variant overrides (per-template overrides)
  notification_copy_overrides JSONB,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.3 CountryProfile

Platform-wide CCR templates per country. Not tenant-scoped — these are platform-level.

```sql
CREATE TABLE country_profiles (
  country         CHAR(2) PRIMARY KEY,               -- ISO code
  
  -- Regulatory
  regulatory_module VARCHAR(100) NOT NULL,           -- 'us_hipaa_state_telehealth', 'gh_dpa_mdc'
  
  -- Payment
  default_payment_processor VARCHAR(50) NOT NULL,    -- 'stripe', 'paystack'
  supported_payment_methods JSONB NOT NULL,          -- ['card', 'mobile_money', ...]
  
  -- Currency
  currency_code   CHAR(3) NOT NULL,                  -- 'USD', 'GHS'
  currency_symbol VARCHAR(5) NOT NULL,
  
  -- Locale
  default_locale  VARCHAR(10) NOT NULL,              -- 'en-US', 'en-GH'
  date_format     VARCHAR(20) NOT NULL,              -- 'MM/DD/YYYY', 'DD/MM/YYYY'
  time_format     VARCHAR(10) NOT NULL,              -- '12h', '24h'
  measurement_units VARCHAR(20) NOT NULL,            -- 'imperial', 'metric'
  phone_format    VARCHAR(50) NOT NULL,
  address_format  JSONB NOT NULL,
  
  -- Emergency
  emergency_number VARCHAR(20) NOT NULL,
  crisis_helplines JSONB NOT NULL,                   -- list of {name, number, available_hours}
  
  -- Notification defaults
  default_notification_channels JSONB NOT NULL,
  default_quiet_hours JSONB NOT NULL,
  
  -- Adapter availability — which integration adapters are usable in this country
  available_clinician_network_adapters JSONB NOT NULL,  -- ['telecheck_pllc', 'openloop', 'wheel']
  available_pharmacy_adapters         JSONB NOT NULL,
  available_sms_providers             JSONB NOT NULL,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.4 CCRConfig

Per-tenant CCR overrides. Most tenants inherit the country profile defaults; some override.

```sql
CREATE TABLE ccr_configs (
  id              VARCHAR(26) PRIMARY KEY,
  tenant_id       VARCHAR(26) NOT NULL REFERENCES tenants(id),
  config_key      VARCHAR(100) NOT NULL,             -- e.g., 'notification.sms_provider'
  config_value    JSONB NOT NULL,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (tenant_id, config_key)
);

CREATE INDEX idx_ccr_configs_tenant ON ccr_configs (tenant_id);
```

### 4.5 AdapterConfig

Per-tenant integration adapter selections (clinician network, pharmacy).

```sql
CREATE TABLE adapter_configs (
  id              VARCHAR(26) PRIMARY KEY,
  tenant_id       VARCHAR(26) NOT NULL REFERENCES tenants(id),
  adapter_type    VARCHAR(50) NOT NULL,              -- 'clinician_network', 'pharmacy', 'payment'
  adapter_name    VARCHAR(100) NOT NULL,             -- 'openloop', 'truepill', 'stripe', etc.
  
  -- Adapter-specific configuration (API keys, account IDs, etc.) — encrypted
  adapter_config  JSONB NOT NULL,                    -- encrypted at rest with tenant key
  
  -- Status
  status          VARCHAR(20) NOT NULL,              -- 'active', 'inactive', 'testing'
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- A tenant can have multiple adapters of the same type if multi-pharmacy (e.g., Truepill + Honeybee)
  -- Selection between active adapters is per-prescription routing logic
  UNIQUE (tenant_id, adapter_type, adapter_name)
);

CREATE INDEX idx_adapter_configs_tenant ON adapter_configs (tenant_id);
CREATE INDEX idx_adapter_configs_tenant_type ON adapter_configs (tenant_id, adapter_type);
```

### 4.6 TenantUser

Platform-admin and tenant-admin user accounts. Distinct from patient Account entity.

```sql
CREATE TABLE tenant_users (
  id              VARCHAR(26) PRIMARY KEY,
  
  -- A platform admin has tenant_id = NULL (operates across tenants)
  -- A tenant admin has tenant_id set (scoped to one tenant)
  tenant_id       VARCHAR(26) REFERENCES tenants(id),
  
  email           VARCHAR(255) NOT NULL,
  display_name    VARCHAR(200) NOT NULL,
  
  -- Auth
  password_hash   TEXT,                              -- bcrypt; or NULL if SSO-only
  mfa_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_secret_encrypted TEXT,                         -- encrypted
  
  -- Roles
  role            VARCHAR(50) NOT NULL,              -- 'platform_admin', 'tenant_admin', 'tenant_operator', 'tenant_billing', 'tenant_clinical_lead', etc.
  
  -- Status
  status          VARCHAR(20) NOT NULL,              -- 'active', 'invited', 'suspended', 'deactivated'
  invited_at      TIMESTAMPTZ,
  activated_at    TIMESTAMPTZ,
  last_login_at   TIMESTAMPTZ,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (email)
);

CREATE INDEX idx_tenant_users_tenant ON tenant_users (tenant_id);
CREATE INDEX idx_tenant_users_role ON tenant_users (role);
```

---

## 4-bis. Ecom & subscription management entities — schemas (NEW in v1.2)

Per Adversarial Counsel Review v1.0 finding CRITICAL-02, the 8 ecom entities introduced by Pharmacy + Refill v2.1 and Admin Backend v1.1 slice PRDs are canonicalized here. Slice PRDs reference these schemas; they do not carry their own copies.

### 4.7 Subscription

Auto-renewing prescription subscription. Powers the US DTC subscription business model. Per Pharmacy + Refill v2.X §8 state machine.

```sql
CREATE TABLE subscriptions (
  id                          VARCHAR(26) PRIMARY KEY,
  tenant_id                   VARCHAR(26) NOT NULL REFERENCES tenants(id),
  patient_id                  VARCHAR(26) NOT NULL REFERENCES accounts(id),

  -- What is being subscribed to
  product_id                  VARCHAR(26) NOT NULL REFERENCES product_catalog(id),
  prescription_id             VARCHAR(26) NOT NULL REFERENCES medication_requests(id),

  -- Cadence and pricing
  cadence                     VARCHAR(20) NOT NULL,    -- 'monthly' | 'quarterly' | 'biannual'
  unit_price                  DECIMAL(10, 2) NOT NULL,
  currency                    CHAR(3) NOT NULL,

  -- State machine (per State Machines v1.1 §14)
  status                      VARCHAR(30) NOT NULL,    -- DRAFT | ACTIVE | FULFILLING | PAUSED | SWITCHING | CANCELLATION_PENDING | CANCELLED | DECLINED | PAYMENT_FAILED_TERMINAL | SAFETY_HOLD

  -- Lifecycle dates
  started_at                  TIMESTAMPTZ NOT NULL,
  paused_at                   TIMESTAMPTZ,
  pause_until                 TIMESTAMPTZ,
  cancelled_at                TIMESTAMPTZ,
  cancel_reason               VARCHAR(100),
  next_renewal_at             TIMESTAMPTZ,
  last_fulfilled_at           TIMESTAMPTZ,

  -- Pre-authorization (per medication class)
  preauth_window_months       INTEGER NOT NULL,
  preauth_renewals_remaining  INTEGER NOT NULL,

  -- Payment
  payment_method_id           VARCHAR(100),

  -- Optimistic concurrency
  version                     INTEGER NOT NULL DEFAULT 1,

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_tenant ON subscriptions (tenant_id);
CREATE INDEX idx_subscriptions_patient ON subscriptions (tenant_id, patient_id);
CREATE INDEX idx_subscriptions_status_renewal ON subscriptions (tenant_id, status, next_renewal_at);
CREATE INDEX idx_subscriptions_product ON subscriptions (tenant_id, product_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON subscriptions
  USING (tenant_id = current_setting('app.tenant_id')::VARCHAR);
```

**Constraints and invariants:**
- Status transitions strictly per State Machines v1.1 §14
- A subscription in SAFETY_HOLD cannot transition to ACTIVE without an event-bound clinician sign-off
- A subscription in CANCELLED is terminal; re-enrollment creates a new subscription
- `pause_until` is required when status = PAUSED; auto-resume at that timestamp unless cancelled or extended
- Maximum pause duration is 90 days from `paused_at` (tenant-configurable down, not up)

### 4.8 SubscriptionEvent

Append-only event log for subscription state transitions and significant lifecycle moments. Used for audit, analytics, and replay.

```sql
CREATE TABLE subscription_events (
  id              VARCHAR(26) PRIMARY KEY,
  tenant_id       VARCHAR(26) NOT NULL REFERENCES tenants(id),
  subscription_id VARCHAR(26) NOT NULL REFERENCES subscriptions(id),

  event_type      VARCHAR(50) NOT NULL,     -- 'created' | 'activated' | 'paused' | 'resumed' | 'switching_initiated' | 'switched' | 'cancellation_pending' | 'cancelled' | 'declined' | 'payment_failed' | 'terminated_payment_failure' | 'safety_hold' | 'released_from_safety_hold'
  event_data      JSONB NOT NULL,           -- per-event-type payload
  actor_type      VARCHAR(20) NOT NULL,     -- 'patient' | 'clinician' | 'system' | 'tenant_operator' | 'platform_admin'
  actor_id        VARCHAR(26),

  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscription_events_subscription ON subscription_events (subscription_id, occurred_at);
CREATE INDEX idx_subscription_events_tenant_type ON subscription_events (tenant_id, event_type);

ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON subscription_events
  USING (tenant_id = current_setting('app.tenant_id')::VARCHAR);
```

**Constraints:**
- Append-only — no UPDATE or DELETE operations
- Mirrored into AuditEvent per AUDIT_EVENTS v5.1 (Category C for operational events; Category A for switch approval and SAFETY_HOLD)

### 4.9 ProductCatalog

Per-tenant medication and product catalog. Defines what a tenant can offer to its patients, with pricing and adapter routing.

```sql
CREATE TABLE product_catalog (
  id                              VARCHAR(26) PRIMARY KEY,
  tenant_id                       VARCHAR(26) NOT NULL REFERENCES tenants(id),

  -- Identification
  display_name                    VARCHAR(200) NOT NULL,
  generic_name                    VARCHAR(200) NOT NULL,
  rxnorm_code                     VARCHAR(20),
  ndc_codes                       JSONB,

  -- Form / strength
  form                            VARCHAR(50),         -- 'injection_solution' | 'tablet' | 'topical_solution' | etc.
  strength                        VARCHAR(50),
  package_size                    VARCHAR(50),

  -- Categorization
  program                         VARCHAR(50) NOT NULL,    -- 'weight_loss' | 'ed' | 'hair_loss' | 'skincare' | 'diabetes' | etc.
  category                        VARCHAR(50) NOT NULL,    -- 'primary_treatment' | 'supplement' | 'support'

  -- Pharmacy routing
  available_adapters              JSONB NOT NULL,           -- ['truepill', 'honeybee']
  preferred_adapter               VARCHAR(50),

  -- Compounding
  is_compounded                   BOOLEAN NOT NULL DEFAULT FALSE,
  compounding_pharmacy_type       VARCHAR(20),              -- '503A' | '503B' | NULL

  -- Pricing (per cadence, in tenant currency per CCR)
  pricing                         JSONB NOT NULL,           -- {"monthly": 199.00, "quarterly": 549.00, "one_time": 99.00}

  -- Subscription support
  subscription_eligible           BOOLEAN NOT NULL DEFAULT TRUE,

  -- Status
  status                          VARCHAR(20) NOT NULL,     -- 'active' | 'out_of_stock' | 'discontinued'

  -- Operational
  description_patient_facing      TEXT,
  description_clinical            TEXT,

  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_catalog_tenant ON product_catalog (tenant_id);
CREATE INDEX idx_product_catalog_program ON product_catalog (tenant_id, program, status);
CREATE INDEX idx_product_catalog_rxnorm ON product_catalog (rxnorm_code);

ALTER TABLE product_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON product_catalog
  USING (tenant_id = current_setting('app.tenant_id')::VARCHAR);
```

### 4.10 Cart

Multi-product checkout container. Used when a patient adds multiple products in one intake or browse session.

```sql
CREATE TABLE carts (
  id                      VARCHAR(26) PRIMARY KEY,
  tenant_id               VARCHAR(26) NOT NULL REFERENCES tenants(id),
  patient_id              VARCHAR(26) NOT NULL REFERENCES accounts(id),
  intake_submission_id    VARCHAR(26),     -- nullable; cart can be standalone

  status                  VARCHAR(20) NOT NULL,    -- 'open' | 'checked_out' | 'abandoned' | 'expired'

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at              TIMESTAMPTZ
);

CREATE INDEX idx_carts_tenant_patient ON carts (tenant_id, patient_id, status);
CREATE INDEX idx_carts_intake ON carts (intake_submission_id);

ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON carts
  USING (tenant_id = current_setting('app.tenant_id')::VARCHAR);
```

### 4.11 CartItem

Individual product entry within a cart.

```sql
CREATE TABLE cart_items (
  id              VARCHAR(26) PRIMARY KEY,
  tenant_id       VARCHAR(26) NOT NULL REFERENCES tenants(id),
  cart_id         VARCHAR(26) NOT NULL REFERENCES carts(id),
  product_id      VARCHAR(26) NOT NULL REFERENCES product_catalog(id),

  quantity        INTEGER NOT NULL DEFAULT 1,
  cadence         VARCHAR(20),               -- 'monthly' | 'quarterly' | 'one_time'
  unit_price      DECIMAL(10, 2) NOT NULL,   -- snapshot at add-to-cart

  added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_at      TIMESTAMPTZ
);

CREATE INDEX idx_cart_items_cart ON cart_items (cart_id);
CREATE INDEX idx_cart_items_tenant_product ON cart_items (tenant_id, product_id);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON cart_items
  USING (tenant_id = current_setting('app.tenant_id')::VARCHAR);
```

### 4.12 DiscountCode

Per-tenant promotional codes for marketing campaigns and acquisition incentives.

```sql
CREATE TABLE discount_codes (
  id                              VARCHAR(26) PRIMARY KEY,
  tenant_id                       VARCHAR(26) NOT NULL REFERENCES tenants(id),

  code                            VARCHAR(50) NOT NULL,
  code_type                       VARCHAR(30) NOT NULL,    -- 'single_use' | 'multi_use' | 'single_use_per_patient'

  discount_type                   VARCHAR(20) NOT NULL,    -- 'percentage' | 'fixed_amount'
  discount_value                  DECIMAL(10, 2) NOT NULL,

  -- Scope
  applies_to                      VARCHAR(20) NOT NULL,    -- 'all_products' | 'specific_products' | 'specific_programs'
  applies_to_ids                  JSONB,

  -- Lifecycle
  valid_from                      TIMESTAMPTZ NOT NULL,
  valid_until                     TIMESTAMPTZ,

  -- Usage caps
  max_total_uses                  INTEGER,                  -- NULL = unlimited
  max_uses_per_patient            INTEGER NOT NULL DEFAULT 1,
  current_uses                    INTEGER NOT NULL DEFAULT 0,

  -- Status
  status                          VARCHAR(20) NOT NULL,     -- 'active' | 'expired' | 'exhausted' | 'disabled'

  -- Constraints
  minimum_subscription_value      DECIMAL(10, 2),
  first_time_subscriber_only      BOOLEAN NOT NULL DEFAULT FALSE,

  -- Audit
  created_by                      VARCHAR(26) NOT NULL REFERENCES tenant_users(id),

  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (tenant_id, code)
);

CREATE INDEX idx_discount_codes_tenant_status ON discount_codes (tenant_id, status);
CREATE INDEX idx_discount_codes_validity ON discount_codes (tenant_id, valid_from, valid_until);

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON discount_codes
  USING (tenant_id = current_setting('app.tenant_id')::VARCHAR);
```

### 4.13 DiscountCodeRedemption

Append-only redemption log for anti-fraud and analytics.

```sql
CREATE TABLE discount_code_redemptions (
  id                  VARCHAR(26) PRIMARY KEY,
  tenant_id           VARCHAR(26) NOT NULL REFERENCES tenants(id),
  discount_code_id    VARCHAR(26) NOT NULL REFERENCES discount_codes(id),
  patient_id          VARCHAR(26) NOT NULL REFERENCES accounts(id),

  -- Application context
  applied_to_resource_type VARCHAR(50) NOT NULL,    -- 'subscription' | 'cart' | 'one_time_purchase'
  applied_to_resource_id   VARCHAR(26) NOT NULL,
  amount_discounted        DECIMAL(10, 2) NOT NULL,

  -- Anti-fraud
  ip_address          INET,
  user_agent          TEXT,

  redeemed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dcr_code ON discount_code_redemptions (discount_code_id, redeemed_at);
CREATE INDEX idx_dcr_patient ON discount_code_redemptions (tenant_id, patient_id);

ALTER TABLE discount_code_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON discount_code_redemptions
  USING (tenant_id = current_setting('app.tenant_id')::VARCHAR);
```

### 4.14 AffiliateAccount

Affiliate marketing partner account. Per-tenant.

```sql
CREATE TABLE affiliate_accounts (
  id                          VARCHAR(26) PRIMARY KEY,
  tenant_id                   VARCHAR(26) NOT NULL REFERENCES tenants(id),

  display_name                VARCHAR(200) NOT NULL,
  contact_email               VARCHAR(255) NOT NULL,

  -- Tracking
  unique_slug                 VARCHAR(50) NOT NULL,
  utm_default_source          VARCHAR(100),
  utm_default_medium          VARCHAR(100),

  -- Commission
  commission_type             VARCHAR(20) NOT NULL,    -- 'percentage' | 'flat_per_conversion'
  commission_value            DECIMAL(10, 2) NOT NULL,
  attribution_window_days     INTEGER NOT NULL DEFAULT 30,

  -- Payout (US)
  stripe_connect_account_id   VARCHAR(100),

  -- Payout (Ghana — manual at launch)
  payout_method               VARCHAR(50),             -- 'stripe_connect' | 'manual_bank' | 'mobile_money'
  payout_details              JSONB,                    -- encrypted at rest per encryption mapping §7

  -- Status
  status                      VARCHAR(20) NOT NULL,    -- 'active' | 'paused' | 'terminated'

  -- Lifecycle
  approved_at                 TIMESTAMPTZ,
  approved_by                 VARCHAR(26) REFERENCES tenant_users(id),

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (tenant_id, unique_slug)
);

CREATE INDEX idx_affiliate_accounts_tenant ON affiliate_accounts (tenant_id, status);
CREATE INDEX idx_affiliate_accounts_slug ON affiliate_accounts (tenant_id, unique_slug);

ALTER TABLE affiliate_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON affiliate_accounts
  USING (tenant_id = current_setting('app.tenant_id')::VARCHAR);
```

### 4.15 AffiliateConversion

Conversion event with attribution and commission. Append-only.

```sql
CREATE TABLE affiliate_conversions (
  id                      VARCHAR(26) PRIMARY KEY,
  tenant_id               VARCHAR(26) NOT NULL REFERENCES tenants(id),

  affiliate_account_id    VARCHAR(26) NOT NULL REFERENCES affiliate_accounts(id),
  patient_id              VARCHAR(26) NOT NULL REFERENCES accounts(id),

  -- Source attribution
  attribution_link_id     VARCHAR(26),
  utm_source              VARCHAR(100),
  utm_medium              VARCHAR(100),
  utm_campaign            VARCHAR(100),
  utm_content             VARCHAR(100),

  -- Conversion event
  conversion_type         VARCHAR(30) NOT NULL,    -- 'signup' | 'first_subscription' | 'first_purchase'
  conversion_value        DECIMAL(10, 2),

  -- Commission
  commission_amount       DECIMAL(10, 2) NOT NULL,
  commission_status       VARCHAR(20) NOT NULL,    -- 'pending' | 'approved' | 'paid' | 'reversed'

  -- Reversal (refund handling)
  reversed_at             TIMESTAMPTZ,
  reversal_reason         VARCHAR(200),

  -- Payout linkage
  payout_id               VARCHAR(26),

  occurred_at             TIMESTAMPTZ NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_affiliate_conversions_account ON affiliate_conversions (affiliate_account_id, occurred_at);
CREATE INDEX idx_affiliate_conversions_tenant_status ON affiliate_conversions (tenant_id, commission_status);
CREATE INDEX idx_affiliate_conversions_patient ON affiliate_conversions (tenant_id, patient_id);

ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON affiliate_conversions
  USING (tenant_id = current_setting('app.tenant_id')::VARCHAR);
```

---

### 4.16 MedicationRequest

**Added at CDM v1.3 under P-011 / SI-001 closure 2026-05-11.** The canonical record of a prescribing decision (or a draft thereof) within an operating tenant. Renamed from "Prescription" per Contracts Pack v5.2 GLOSSARY. Append-only via supersession (discontinuation creates a new `superseded` row with `supersedes_id` pointing back; the original row's `status` flips to `superseded` only via a controlled UPDATE that the I-003 hash-chain audit picks up). Same discipline as consent_versions per Slice 3 PRD v1.0 §7.1.

**v1.10 brand-structure note:** `tenant_id` is the operating-tenant identifier (`Telecheck-{country}`); patient-facing surfaces source `tenant.consumer_dba` for any rendering that displays "your prescriber's pharmacy" branding, per Master PRD v1.10 §17 + Glossary v5.2 C3.

```sql
CREATE TABLE medication_requests (
  -- Identity
  id                                  VARCHAR(26) PRIMARY KEY,           -- ULID (§2 conventions)
  tenant_id                           VARCHAR(26) NOT NULL REFERENCES tenants(id),

  -- Patient anchor (composite FK enforces same-tenant binding per PROJECT_CONVENTIONS r5 §1.1)
  patient_account_id                  VARCHAR(26) NOT NULL,

  -- Catalog anchor
  product_catalog_id                  VARCHAR(26) NOT NULL,              -- FK to product_catalog (CDM §4.9)
  medication_name                     VARCHAR(200) NOT NULL,             -- denormalized snapshot at prescribe-time
  strength                            VARCHAR(80)  NOT NULL,             -- '500mg', '10mg/ml', etc.
  formulation                         VARCHAR(40)  NOT NULL,             -- 'tablet', 'injection', 'topical', ...

  -- Clinical detail (denormalized snapshot — does not mutate when product_catalog updates)
  dose_instructions                   TEXT         NOT NULL,             -- '1 tablet twice daily with meals'
  quantity                            INTEGER      NOT NULL,             -- units per dispense
  quantity_unit                       VARCHAR(20)  NOT NULL,             -- 'tablet', 'ml', 'patch', ...
  refills_allowed                     INTEGER      NOT NULL,             -- 0 .. N
  indication                          VARCHAR(200),                      -- clinical indication; nullable
  clinical_notes                      TEXT,                              -- prescriber notes; nullable

  -- Lifecycle status (see State Machines v1.2 §19 — enum is the authoritative state set)
  status                              VARCHAR(30)  NOT NULL,             -- see §19 enum

  -- Lifecycle timestamps
  prescribed_at                       TIMESTAMPTZ,                       -- set on draft → active transition
  activated_at                        TIMESTAMPTZ,                       -- alias for prescribed_at retained for clarity
  discontinued_at                     TIMESTAMPTZ,
  discontinued_reason                 VARCHAR(60),                       -- enum below; nullable
  expires_at                          TIMESTAMPTZ,                       -- prescription-validity window end

  -- Authorship (clinician anchor; nullable only while status='draft')
  prescribed_by_clinician_account_id  VARCHAR(26),                       -- composite FK to accounts when set
  prescribing_consult_id              VARCHAR(26),                       -- composite FK to consults when set

  -- Safety integration (Med Interaction Engine slice — Path 1 per ratification 2026-05-11:
  -- NO `interaction_override_id` column. MedicationRequest emits the
  -- `medication_request.interaction_safety_hold_triggered` domain event
  -- when interaction_signals_status flips to 'safety_hold'; the Med Interaction
  -- Engine slice subscribes + owns its own override workflow + override table.
  -- Clean module-boundary separation per ADR-001.)
  interaction_signals_evaluated_at    TIMESTAMPTZ,                       -- last engine evaluation timestamp
  interaction_signals_status          VARCHAR(20)  NOT NULL DEFAULT 'pending',  -- 'pending' | 'clean' | 'caution' | 'safety_hold'

  -- I-012 reject-unless three-clause envelope fields (per AUDIT_EVENTS v5.3 §I-012 closure rule — carries forward v5.2 line 66 prose plus P-011 amendment adding prescribing.protocol_authorization_granted; live emission MUST resolve against v5.3 or later)
  ai_workload_type                    VARCHAR(40),                       -- per WORKLOAD_TAXONOMY v5.2; nullable if no AI participation
  autonomy_level                      VARCHAR(40),                       -- per AUTONOMY_LEVELS v5.2; nullable if no AI participation
  protocol_id                         VARCHAR(26),                       -- when protocol-authorized: which protocol; FK to protocols (future entity)
  protocol_version                    VARCHAR(20),                       -- frozen protocol version at prescribe-time

  -- Append-only via supersession
  supersedes_id                       VARCHAR(26),                       -- self-FK (composite); nullable; points back at the row this one supersedes
  superseded_by_id                    VARCHAR(26),                       -- self-FK (composite); nullable; points forward at the row that superseded this one

  -- CCR linkage (denormalized; matches Slice 4 country_of_care threading rule per Tenant Threading Addendum v1.0 §3.4)
  country_of_care                     CHAR(2)      NOT NULL,             -- ISO 3166-1 alpha-2

  -- Standard timestamps
  created_at                          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- Composite UNIQUE for downstream composite-FK pattern (subscriptions.prescription_id, refills.medication_request_id, dispensings.medication_request_id, etc.)
  CONSTRAINT medication_requests_tenant_id_id_unique UNIQUE (tenant_id, id),

  -- Composite FK: patient must belong to same tenant
  CONSTRAINT medication_requests_tenant_patient_fk
    FOREIGN KEY (tenant_id, patient_account_id) REFERENCES accounts (tenant_id, account_id),

  -- Composite FK: prescriber (when set) must belong to same tenant
  CONSTRAINT medication_requests_tenant_clinician_fk
    FOREIGN KEY (tenant_id, prescribed_by_clinician_account_id) REFERENCES accounts (tenant_id, account_id),

  -- Composite FK: prescribing consult (when set) must belong to same tenant
  CONSTRAINT medication_requests_tenant_consult_fk
    FOREIGN KEY (tenant_id, prescribing_consult_id) REFERENCES consults (tenant_id, id),

  -- Composite FK: product catalog item (when set) must belong to same tenant
  CONSTRAINT medication_requests_tenant_product_fk
    FOREIGN KEY (tenant_id, product_catalog_id) REFERENCES product_catalog (tenant_id, id),

  -- Composite self-FKs for supersession chain
  CONSTRAINT medication_requests_supersedes_fk
    FOREIGN KEY (tenant_id, supersedes_id) REFERENCES medication_requests (tenant_id, id),
  CONSTRAINT medication_requests_superseded_by_fk
    FOREIGN KEY (tenant_id, superseded_by_id) REFERENCES medication_requests (tenant_id, id),

  -- State enum validation
  CONSTRAINT medication_requests_status_valid CHECK (
    status IN ('draft', 'pending_interaction_check', 'pending_clinician_review', 'active', 'discontinued', 'superseded', 'expired', 'rejected')
  ),

  -- Discontinuation reason enum (nullable except when status='discontinued')
  CONSTRAINT medication_requests_discontinued_reason_valid CHECK (
    discontinued_reason IS NULL OR
    discontinued_reason IN ('clinical_decision', 'adverse_event', 'patient_request', 'replaced_by_new_prescription', 'expired', 'safety_hold')
  ),
  CONSTRAINT medication_requests_discontinued_reason_set_when_discontinued CHECK (
    (status = 'discontinued') = (discontinued_reason IS NOT NULL)
  ),

  -- Interaction signals enum validation
  CONSTRAINT medication_requests_interaction_signals_status_valid CHECK (
    interaction_signals_status IN ('pending', 'clean', 'caution', 'safety_hold')
  ),

  -- I-012 three-clause rule per AUDIT_EVENTS v5.3 §I-012 closure rule (carries forward v5.2 line 66 prose plus P-011 amendment) + INVARIANTS I-012 + WORKLOAD_TAXONOMY
  -- v5.2 §2.1/§2.2:
  --   (1) ai_workload_type must be canonical (WORKLOAD_TAXONOMY v5.2 active levels at v1.0)
  --   (2) autonomy_level must be 'action_with_confirm' (the single I-012-permitted level at v1.0)
  --   (3) reserved workload/autonomy values forbidden until ADR-030 + successor invariant
  --   (4) workload x autonomy compatibility (WORKLOAD_TAXONOMY v5.2):
  --       - conversational_assistant: autonomy_level_range = [advisory] ONLY
  --       - protocol_execution: autonomy_level_range = [advisory, suggestion, action_with_confirm]
  --       Therefore the AI-participating I-012 EXECUTION path (autonomy='action_with_confirm')
  --       requires ai_workload_type='protocol_execution'. A 'conversational_assistant' row at
  --       'action_with_confirm' is impossible by WORKLOAD_TAXONOMY and MUST be rejected here
  --       so a Mode 1 workload cannot be falsely elevated to execution authority.
  CONSTRAINT medication_requests_i012_envelope_active_check CHECK (
    (status NOT IN ('active', 'discontinued', 'superseded', 'expired')
     AND ai_workload_type IS NULL
     AND autonomy_level IS NULL)
    OR
    (status IN ('active', 'discontinued', 'superseded', 'expired')
     AND (
       (ai_workload_type IS NULL AND autonomy_level IS NULL)
       OR
       (ai_workload_type = 'protocol_execution'
        AND autonomy_level = 'action_with_confirm')
     ))
  ),

  -- Protocol-authorized path: when autonomy_level set, protocol_id + protocol_version required.
  CONSTRAINT medication_requests_i012_protocol_binding_check CHECK (
    autonomy_level IS NULL
    OR (autonomy_level = 'action_with_confirm' AND protocol_id IS NOT NULL AND protocol_version IS NOT NULL)
  ),

  -- Country-of-care must match tenant (denormalization invariant)
  CONSTRAINT medication_requests_country_valid CHECK (country_of_care ~ '^[A-Z]{2}$')
);

-- RLS policy: tenant-scoped read+write per ADR-023 + PROJECT_CONVENTIONS r5 §2.X.
-- Use the canonical `current_tenant_id()` helper from migration 003_rls_helpers.sql.
ALTER TABLE medication_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_requests FORCE ROW LEVEL SECURITY;

CREATE POLICY medication_requests_tenant_isolation
  ON medication_requests
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- Indexes
CREATE INDEX idx_medication_requests_tenant_patient
  ON medication_requests (tenant_id, patient_account_id, status);
CREATE INDEX idx_medication_requests_tenant_clinician
  ON medication_requests (tenant_id, prescribed_by_clinician_account_id)
  WHERE prescribed_by_clinician_account_id IS NOT NULL;
CREATE INDEX idx_medication_requests_tenant_consult
  ON medication_requests (tenant_id, prescribing_consult_id)
  WHERE prescribing_consult_id IS NOT NULL;
CREATE INDEX idx_medication_requests_tenant_status_active
  ON medication_requests (tenant_id, status)
  WHERE status = 'active';
CREATE INDEX idx_medication_requests_supersession_chain
  ON medication_requests (tenant_id, supersedes_id)
  WHERE supersedes_id IS NOT NULL;
```

**Med Interaction Engine integration** is via the `medication_request.interaction_safety_hold_triggered` domain event (Path 1 ratification 2026-05-11). MedicationRequest does NOT carry a hard pointer to the InteractionOverride entity; the override workflow + override table are owned by the Med Interaction Engine slice.

**State machine reference:** State Machines v1.2 §19 (added by the same P-011 promotion). Two prescribing-execution routes both terminate at `active`: `clinician_approve` and `protocol_authorized_prescribing`; both I-012-gated; both emit the canonical `medication_request.approved.v1` domain event with `approval_pathway` discriminating the route.

**Audit references:** Lifecycle audit events live in AUDIT_EVENTS v5.3 §Category-A (also added by the same P-011 promotion). The I-012 confirmation event for the protocol-authorized route is `prescribing.protocol_authorization_granted` (clinician actor; v5.3 §I-012 closure rule authoritative set).

---



Every inherited entity from v1.0 receives `tenant_id` as a NOT NULL column with a foreign key to `tenants.id`. The standard pattern is:

```sql
-- Example: Account entity (Identity & Account module)
CREATE TABLE accounts (
  id              VARCHAR(26) PRIMARY KEY,
  tenant_id       VARCHAR(26) NOT NULL REFERENCES tenants(id),  -- NEW in v1.1
  
  phone_number    VARCHAR(50) NOT NULL,
  display_name    VARCHAR(200),
  status          VARCHAR(20) NOT NULL,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  
  -- Phone uniqueness is per-tenant, not global
  -- Same person can have separate accounts in different tenants
  UNIQUE (tenant_id, phone_number)
);

CREATE INDEX idx_accounts_tenant_phone ON accounts (tenant_id, phone_number);
CREATE INDEX idx_accounts_tenant_status ON accounts (tenant_id, status);

-- Row-Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON accounts
  USING (tenant_id = current_setting('app.tenant_id')::varchar);
```

The `current_setting('app.tenant_id')` is set per-database-connection by the application layer middleware, after tenant resolution. RLS ensures any query that bypasses application-layer filtering still cannot see cross-tenant data.

### 5.1 Same person, different tenants

A person who is a Heros Health patient and (theoretically) also a Telecheck-Ghana patient has two separate Account records in two separate tenants. From the platform's view they are different patients. This is by design per ADR-023.

### 5.2 Indexing implication

Indexes on tenant-scoped tables should typically lead with `tenant_id`:

```sql
-- GOOD - tenant_id leads
CREATE INDEX idx_consults_tenant_status ON consults (tenant_id, status);

-- BAD - tenant_id doesn't lead, queries that filter by tenant_id won't use this index efficiently
CREATE INDEX idx_consults_status ON consults (status);
```

For queries that filter by `tenant_id` and another column (which is most queries), the leading-tenant_id index pattern is required.

---

## 6. The Audit envelope (updated for tenant scoping)

Per Contracts Pack AUDIT-EVENTS, with tenant_id added per ADR-023.

```sql
CREATE TABLE audit_events (
  id              VARCHAR(26) PRIMARY KEY,
  tenant_id       VARCHAR(26) NOT NULL REFERENCES tenants(id),  -- REQUIRED per ADR-023
  
  -- Categorization
  category        VARCHAR(20) NOT NULL,              -- 'A' (clinical), 'B' (governance), 'C' (operational)
  action          VARCHAR(100) NOT NULL,             -- e.g., 'consult.submitted', 'refill.approved'
  
  -- Subject
  aggregate_type  VARCHAR(50) NOT NULL,              -- 'consult', 'refill', etc.
  aggregate_id    VARCHAR(26) NOT NULL,
  
  -- Actor
  actor_type      VARCHAR(20) NOT NULL,              -- 'patient', 'clinician', 'admin', 'system', 'protocol', 'ai'
  actor_id        VARCHAR(26),                       -- nullable for system actions
  actor_metadata  JSONB,                             -- e.g., {protocol_id, protocol_version, model_version}
  
  -- Context
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_id      VARCHAR(26),                       -- request correlation
  session_id      VARCHAR(26),                       -- session correlation
  ip_address      INET,
  user_agent      TEXT,
  
  -- Payload (the change itself)
  payload         JSONB NOT NULL,
  
  -- Workload-taxonomy fields (added v1.10 cycle per ADR-029 / AUDIT_EVENTS v5.2 envelope schema; patch 2026-05-02 per Codex Round-11 Scope 1 HIGH-1 finding to make CDM able to store the I-012 evidence required by AUDIT_EVENTS)
  audit_sensitivity_level VARCHAR(16) NOT NULL DEFAULT 'standard',  -- 'standard' | 'high_pii' (per I-031 — high_pii reserved for research export events; consent grant/revoke at standard per AUDIT_EVENTS v5.2 §5)
  ai_workload_type        VARCHAR(40),                              -- 'conversational_assistant' | 'protocol_execution' | 'autonomous_agent' (reserved) | 'multi_agent_supervisor' (reserved) | 'tool_using_agent' (reserved) | 'rejected_invalid_attempt' (sentinel; only on *.execution_rejected events) | 'n/a' (sentinel; only on I-012 clinician-only approvals) | NULL (legacy/non-AI events). Required for I-012 action-class records regardless of actor_type per AUDIT_EVENTS v5.2 §I-012 closure rule.
  autonomy_level          VARCHAR(40),                              -- 'advisory' | 'suggestion' | 'action_with_confirm' | 'action_with_audit_only' (reserved) | 'fully_autonomous' (reserved) | 'rejected_invalid_attempt' (sentinel) | 'n/a' (sentinel) | NULL (legacy/non-AI events). Same I-012 closure constraint as above.
  
  -- Reserved nullable agentic-context fields (added v1.10 cycle; populate only when corresponding capability activates per ADR-030/031/032/033/034)
  agent_id                  VARCHAR(26),
  agent_version             VARCHAR(40),
  tool_call_id              VARCHAR(26),
  memory_read_set_id        VARCHAR(26),
  memory_write_set_id       VARCHAR(26),
  supervising_policy_id     VARCHAR(26),
  knowledge_source_versions JSONB,                                  -- ["source:version", ...] | NULL
  
  -- Hash chain for immutability per ADR-013
  prev_hash       VARCHAR(64) NOT NULL,              -- SHA-256 of previous record's hash
  record_hash     VARCHAR(64) NOT NULL,              -- SHA-256 of this record's content
  
  -- IMMUTABLE: no UPDATE, no DELETE permitted
  CONSTRAINT audit_no_modification CHECK (true),     -- enforced via trigger
  
  -- Schema version field (added v1.10 cycle per Codex Round-12 Scope 2 HIGH cutover-safety patch 2026-05-02)
  -- Discriminates pre-v1.10 backfill rows (where AUDIT_EVENTS v5.2 §nullability rule explicitly permits null
  -- ai_workload_type/autonomy_level on legacy events) from v1.10+ rows where I-012 closure rule applies.
  schema_version  VARCHAR(8) NOT NULL DEFAULT 'v1.10',  -- 'v1.0' | 'v1.10' | future. Pre-v1.10 backfill rows MUST be loaded with schema_version = 'v1.0' to bypass the I-012 CHECK below; v1.10+ writes default to 'v1.10' and ARE subject to the CHECK.
  
  -- I-012 closure rule constraint (per AUDIT_EVENTS v5.2 §I-012 closure rule; cutover-safe gate per Codex Round-12 Scope 2 HIGH 2026-05-02):
  -- For I-012 action-class records emitted at v1.10+, ai_workload_type AND autonomy_level MUST be non-null regardless of actor_type.
  -- Pre-v1.10 backfill rows (schema_version = 'v1.0') are exempt — AUDIT_EVENTS v5.2 explicitly states legacy nullability is permitted
  -- for backfill. Per I-003 audit immutability, historical audit rows MUST NOT be retroactively updated to fabricate workload evidence;
  -- if an old action needs workload-evidence overlay for any reason, emit a NEW audit record (compensating event) at v1.10 schema_version
  -- with the workload evidence, never UPDATE the historical row.
  -- Action-class set per AUDIT_EVENTS v5.3 (single source of truth; v5.2 → v5.3 bump under P-011 / SI-001 closure 2026-05-11):
  --   prescribing.{initiated, approved, declined, modified, execution_rejected, protocol_authorization_granted},
  --   refill.{approved, declined, execution_rejected},
  --   protocol_authorized_{prescribing, refill_renewal, dispensing_release},
  --   medication_order.execution_rejected.
  -- prescribing.protocol_authorization_granted is the clinician I-012 confirmation event for the
  -- protocol-authorized prescribing route (added at v5.3 under P-011); enforces non-null
  -- workload/autonomy fields per the I-012 closure rule.
  CONSTRAINT audit_i012_workload_evidence_required CHECK (
    schema_version != 'v1.10'  -- legacy rows exempt
    OR action NOT IN ('prescribing.initiated', 'prescribing.approved', 'prescribing.declined', 'prescribing.modified',
                   'prescribing.execution_rejected', 'prescribing.protocol_authorization_granted',  -- added by P-011 / SI-001
                   'refill.approved', 'refill.declined', 'refill.execution_rejected',
                   'protocol_authorized_prescribing', 'protocol_authorized_refill_renewal',
                   'protocol_authorized_dispensing_release', 'medication_order.execution_rejected')
    OR (ai_workload_type IS NOT NULL AND autonomy_level IS NOT NULL)
  )
);

-- Block UPDATE and DELETE
CREATE TRIGGER audit_no_modify
  BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION raise_audit_immutability_error();

-- Tenant scoping at DB layer
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON audit_events
  USING (tenant_id = current_setting('app.tenant_id')::varchar OR current_setting('app.platform_admin', true) = 'true');

-- Indexes
CREATE INDEX idx_audit_tenant_aggregate ON audit_events (tenant_id, aggregate_type, aggregate_id, occurred_at DESC);
CREATE INDEX idx_audit_tenant_actor ON audit_events (tenant_id, actor_type, actor_id, occurred_at DESC);
CREATE INDEX idx_audit_tenant_action ON audit_events (tenant_id, action, occurred_at DESC);
```

Notes:
- Audit table writes always include `tenant_id`. Cross-tenant audit queries are restricted to platform admin.
- Hash chain (per ADR-013) is computed across all records globally (not per-tenant) to preserve overall integrity. Tenant scoping is for read access; the chain is platform-wide.
- Audit data encrypted at rest with separate per-tenant KMS key from clinical data per ADR-024.

---

## 7. Encryption-at-rest mapping

Per ADR-024, every tenant has a unique encryption key in AWS KMS.

| Data category | Encryption key | Notes |
|---|---|---|
| Clinical data (consults, prescriptions, labs, RPM readings, etc.) | Tenant clinical key (KMS) | Per-tenant; rotated per AWS best practice |
| Patient PII (account, profile, address, phone) | Tenant clinical key (KMS) | Same key as clinical |
| Audit events | Tenant audit key (KMS) | Separate key from clinical per ADR-024 |
| Subscription / payment metadata (Telecheck-side records, not card data) | Tenant clinical key (KMS) | Card data is never stored by Telecheck |
| Tenant configuration (CCR overrides, adapter configs with API keys) | Tenant config key (KMS) | Separate key from clinical |
| Platform-admin operational data | Platform-admin key (KMS) | Distinct from any tenant key |
| Backups | Same per-tenant keys as primary data | Encrypted at the source; AWS KMS handles key access |

A tenant's data, if exfiltrated from another tenant's compromised application bug, cannot be decrypted without access to the affected tenant's KMS key.

---

## 8. Cross-references and inheritance from v1.0

The following entity definitions from v1.0 are inherited and tenant-scoped per §5 above. Their schemas are managed in their owning module's slice PRD or in the Contracts Pack. They are NOT re-detailed here:

- Identity & Account: Account, Session, OTP, AuthDevice (4)
- Consent & Access: Consent, ConsentVersion, Delegation, DelegationScope (4)
- Care Delivery: Consult, ConsultEvent, Episode (3)
- Pharmacy & Fulfillment: MedicationRequest, Refill, Dispensing, Shipment, ProductCatalog (5)
- Clinical Intelligence: InteractionSignal, Protocol, ProtocolVersion (3)
- Labs & Documents: LabResult, Document (2)
- RPM & CCM: RPMReading (1)
- Community: CommunityPost (1)
- Notification & Comms: Notification (1)
- Audit: AuditEvent (1) — schema in §6 above

Plus new in v1.1 within Pharmacy & Fulfillment: Subscription, SubscriptionEvent (2) — for Hims/Ro-class subscription mechanics. Schemas in Pharmacy + Refill Slice PRD v2.1 (Session 2 deliverable).

---

## 9. Migration from v1.0 to v1.1

For an engineering team that has any v1.0-based schema in flight:

1. Create the 6 new tenant-management tables (Tenant, TenantBrand, CountryProfile, CCRConfig, AdapterConfig, TenantUser).
2. Insert seed records for the 2 launch operating tenants (`Telecheck-US` with `consumer_dba = 'Heros Health'` and `legal_entity = 'Telecheck Health LLC'`; `Telecheck-Ghana` with `consumer_dba = 'Heros Health Ghana'` and `legal_entity = 'Telecheck-Ghana Ltd.'`) and the 2 country profiles (US, GH). *(Updated 2026-05-02 per Codex Round-7 Scope 4 HIGH-1 finding — the prior "Telecheck-Ghana, Heros" pairing used the bare `Heros` consumer-brand string as a tenant identifier in violation of the C3 brand-structure rule per Master PRD v1.10 §17 + Glossary v5.2. Operating-tenant identifiers are `Telecheck-{country}`; `consumer_dba` carries the Heros Health DBA per CDM v1.2 v1.10 cycle additions §Tenant entity refresh.)*
3. For every existing tenant-scoped table, add `tenant_id VARCHAR(26)` column.
4. Backfill existing data with the appropriate `tenant_id` (typically all existing data belongs to one tenant — easy backfill).
5. Set the column NOT NULL after backfill.
6. Add foreign key constraint to `tenants.id`.
7. Add RLS policies per the §5 pattern.
8. Update all indexes to lead with `tenant_id` where appropriate.
9. Update all queries to set `app.tenant_id` per request.

This migration is non-trivial but well-scoped. For a greenfield build, the schema starts with multi-tenancy from day 1 — no migration needed.

---

## 10. Validation rules and constraints

Per Contracts Pack INVARIANTS:

- Every tenant-scoped table has `tenant_id` NOT NULL with foreign key
- Every tenant-scoped table has RLS policy
- Every tenant-scoped index leads with `tenant_id`
- Audit table writes are append-only (UPDATE/DELETE blocked at DB layer)
- Cross-tenant joins are not permitted at the application layer (lint check)
- Cross-tenant queries from non-platform-admin contexts are blocked at the RLS layer

Engineering must verify these in CI before merge.

---

## 11. What's NOT in this model

- **Federated identity across tenants.** A patient is tenant-scoped. Cross-tenant patient identity is post-launch.
- **Cross-tenant data sharing.** Tenants are isolated. No "share data with another tenant" features.
- **Tenant-of-tenants.** Tenants are flat — no hierarchical tenant structure. (Future product can layer this if needed; not in v1.1.)
- **Per-region data residency at the entity level.** Region is deployment-level (us-east-1 per ADR-026; supersedes ADR-025 af-south-1), not entity-level. If per-tenant region pinning becomes a requirement, that's a future schema addition (`tenant.primary_region`).

---

## v1.10 cycle additions (added 2026-05-02 per v1.10.1 hygiene cycle physical merge of `Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` Group 5B §CDM)

### Tenant entity — C3 brand-structure refresh (Row 27)

The `tenant` entity gains three columns to reflect the operating-tenant / consumer-DBA / legal-entity tri-distinction per Master PRD v1.10 §17 + Glossary v5.2 §Brand and tenant terms. The `tenant.id` naming convention follows `Telecheck-{country}` (e.g., `Telecheck-US`, `Telecheck-Ghana`).

*(Migration block rewritten 2026-05-02 per Codex Round-8 Scope 4 HIGH-1 finding to (a) target the canonical `tenants` plural table name per §4.1 DDL, (b) add columns with safe defaults so the ALTER is executable on a non-empty table, (c) populate every NOT NULL column the canonical DDL requires, (d) provide a staged backfill strategy for existing rows. Was previously executable only against an empty `tenant` (singular) table that doesn't exist in the canonical DDL.)*

```sql
-- Stage 1: Add new columns with NULL default (executable on existing tenants table per §4.1 DDL)
ALTER TABLE tenants
  ADD COLUMN consumer_dba          VARCHAR(200),  -- e.g., 'Heros Health' (US), 'Heros Health Ghana' (GH)
  ADD COLUMN legal_entity          VARCHAR(200),  -- e.g., 'Telecheck Health LLC', 'Telecheck-Ghana Ltd.'
  ADD COLUMN consumer_subdomain    VARCHAR(255);  -- e.g., 'heroshealth.com', 'ghana.heroshealth.com'

-- Stage 2: Backfill any pre-existing rows. For greenfield deployments (no prior tenants), this is a no-op.
-- For deployments with pre-v1.10 rows, the platform admin populates per their tenant inventory.
-- (Pattern: UPDATE tenants SET consumer_dba = 'X', legal_entity = 'Y', consumer_subdomain = 'Z' WHERE id = 'tenant-id';)

-- Stage 3: Set NOT NULL after backfill
ALTER TABLE tenants
  ALTER COLUMN consumer_dba       SET NOT NULL,
  ALTER COLUMN legal_entity       SET NOT NULL,
  ALTER COLUMN consumer_subdomain SET NOT NULL;

-- Day-1 tenant rows (greenfield insert; populates ALL NOT NULL columns per the canonical §4.1 DDL:
-- id, country, status, display_name, created_by; plus the new v1.10 columns).
-- NOTE: display_name uses the OPERATING-TENANT label (Telecheck-{country}), NOT the consumer DBA.
-- The consumer brand belongs ONLY in consumer_dba per the C3 brand-structure rule.
-- (Patched 2026-05-02 per Codex spec-r1 MEDIUM finding closure: prior migration block
--  used 'Heros Health' as display_name, which contradicted the canonical §4.1 seed-value
--  table at line 178 and recreated the brand-as-tenant-name confusion this SPEC ISSUE
--  resolution was meant to close.)
INSERT INTO tenants (id, country, status, display_name, created_by, consumer_dba, legal_entity, consumer_subdomain) VALUES
  ('Telecheck-US',    'US', 'active', 'Telecheck-US',    '<platform-admin-tnu-id>', 'Heros Health',       'Telecheck Health LLC', 'heroshealth.com'),
  ('Telecheck-Ghana', 'GH', 'active', 'Telecheck-Ghana', '<platform-admin-tnu-id>', 'Heros Health Ghana', 'Telecheck-Ghana Ltd.', 'ghana.heroshealth.com');
```

Migration discipline: any v1.x slice PRD example or test fixture using `Heros-Health` as a tenant ID is rewritten to `Telecheck-US`. The patient-facing brand surface (Heros Health) is sourced from `tenant.consumer_dba`, never from `tenant.id`.

### Research data entities (Row 70 — NEW per ADR-028)

Six new tenant-scoped research entities. All carry `tenant_id` per I-023; export carries `country_of_care` on the export record itself per AUDIT_EVENTS v5.2 §4 + TYPES v5.2.

| Entity | Type prefix | Notes |
|---|---|---|
| `ResearchConsent` | `con_` (5th-tier `consent_type = research_data_use`) | Specialized ConsentRecord variant. Asymmetric retraction acknowledged at grant time. Per I-030, MUST NOT cascade to care-delivery surfaces. |
| `CohortDefinition` | `chd_` | Per TYPES v5.2 — versioned, audited, scoped to active DSA permitted_data_domains subset. |
| `DataSharingAgreement` | `dsa_` | Per TYPES v5.2 — partner organization, validity window, k_min_required, ethics review body reference, cross-border transfer mechanism. |
| `ResearchEthicsReviewBody` | `reb_` | Per TYPES v5.2 — REC/IRB designation per CCR `research_ethics_review_body` structured object. |
| `ResearchPartner` | `rpt_` | Lightweight; identifies external research partner organization. |
| `ResearchDataExport` | `rex_` | Per TYPES v5.2 — carries `tenant_id` + `country_of_care` on the export record itself. Status enum `initiated | completed | invalidated`. |

All export operations emit at `audit_sensitivity_level = high_pii` per I-031. RLS policies: tenant-scoped read/write; cross-tenant access only via break-glass per RBAC v1.1.

### AI workload entities (Row 98 — NEW per ADR-029)

#### `AIExecution` entity (normative; fully implemented at v1.0)

Unifies current Mode 1 invocations and Mode 2 cases under the workload taxonomy. Discriminator: `ai_workload_type`.

```
{
  "ai_execution_id":             "aie_<ULID>",
  "tenant_id":                   "Telecheck-{country}",
  "patient_id":                  "pat_<ULID>" | null,
  "ai_workload_type":            "conversational_assistant | protocol_execution | autonomous_agent (reserved) | multi_agent_supervisor (reserved) | tool_using_agent (reserved)",
  "autonomy_level":              "advisory | suggestion | action_with_confirm | action_with_audit_only (reserved) | fully_autonomous (reserved)",
  "tool_access":                 [ "<tool slug>" ] | null,
  "memory_scope":                "session | patient_episode | program_history | <reserved>",
  "governance_class":            "floor_safety | protocol_authorized | <reserved>",
  "knowledge_source_versions":   [ "<source:version>" ] | null,
  "agent_id":                    "<reserved; null at v1.0>",
  "agent_version":               "<reserved; null at v1.0>",
  "supervising_policy_id":       "<reserved; null at v1.0>",
  "ai_model_version":            "<version>",
  "started_at":                  "<ISO 8601>",
  "completed_at":                "<ISO 8601>",
  "outcome":                     "success | partial | failed | escalated"
}
```

Active workload types at v1.0: `conversational_assistant`, `protocol_execution`. Reserved (require successor ADR + activation audit event two-condition AND): `autonomous_agent`, `multi_agent_supervisor`, `tool_using_agent`. Per ADR-029 + AI_LAYERING v5.2 §10 + Master PRD §13.7.

#### Reserved-future entities (non-normative reserved names at v1.0)

Schemas defined when their authorizing ADRs activate (per ADR-029 Decision §6). At v1.0, these are reserved type-name placeholders only — no tables, no schemas, no runtime validation:

- `Agent` (ADR-030)
- `AgentRun` (ADR-030)
- `Tool` (ADR-031)
- `ToolCall` (ADR-031)
- `AgentMemory` (ADR-032)
- `KnowledgeSource` (ADR-034)
- `PolicyAuthorization` (ADR-030 — placeholder skeleton in TYPES v5.2 + GOVERNANCE_CONTROLS v5.2 §8)

Total entity count post-v1.10: **41 (v1.2 baseline) + 6 (research, delta-only — not yet physically merged into §4) + 1 (AIExecution, delta-only — not yet physically merged into §4) = 48 active entities including delta-only entries + 7 reserved-future names**.

**Post-P-011 / SI-001 closure 2026-05-11 update:** the body-resident §4 inventory of physically-expanded entities goes from 41 → 42 (MedicationRequest §4.16 added at v1.3 per P-011). The 48-count above includes the 6 research entities + 1 AIExecution entity that remain delta-only (defined in the v1.10 cycle delta artifact at `Telecheck_v1_10_PRD_Update/Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` Group 5B §CDM Rows 27/70/98 and incorporated by reference, but never physically merged into the §4 body during the v1.10.1 hygiene cycle — see §1.10 cycle additions Document Control entry below for context). **Body-resident count = 42 (v1.3 baseline)**; **delta-inclusive count = 49 (42 + 6 research + 1 AIExecution; research + AIExecution remain delta-only at P-011 / SI-001 closure)**; **reserved-future names = 7 (unchanged)**. CDM headers and Registry Decision 4 cite the body-resident **v1.3 / 42 entities** count as canonical. The delta-only entries will be physically merged in a future hygiene cycle; until then, downstream implementations consult both the §4 body and the delta artifact.

---

## Document control

- **v1.3 (2026-05-11, P-011 / SI-001 closure)** — Adds §4.16 MedicationRequest as the canonical record of a prescribing decision (Path 1 shape; no `interaction_override_id` column; integration via `medication_request.interaction_safety_hold_triggered` domain event per ADR-001 clean module-boundary separation). Amends §audit_events `audit_i012_workload_evidence_required` CHECK constraint to add `'prescribing.protocol_authorization_granted'` to the I-012 action-list — lockstep with AUDIT_EVENTS v5.3 §I-012 closure-rule amendment. §3 Entity overview updated from "41 entities" to "42 entities". Body-resident entity count: 42. Delta-only research entities + AIExecution unchanged (still defined in `Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` Group 5B §CDM rows 27/70/98 by reference). Ratified after 11 rounds of Codex pre-ratification adversarial-review convergence + 2 rounds of post-merge review (20 + 7 findings closed inline). Existing v1.2 schemas preserved without modification; v1.3 additions are net-additive (MedicationRequest) plus one in-place CHECK amendment on the existing audit_events table.
- **v1.2** — Adds 8 ecom entities introduced by Pharmacy + Refill v2.1 and Admin Backend v1.1 slice PRDs: Subscription, SubscriptionEvent, ProductCatalog, Cart, CartItem, DiscountCode, DiscountCodeRedemption, AffiliateAccount, AffiliateConversion. New §4-bis (§4.7 through §4.15) carries full SQL DDL with tenant_id, RLS policies, indexes, constraints, and invariants for each. Total entity count: 41 (6 tenant-management + 27 inherited + 8 ecom). Pattern C remediation per Adversarial Counsel Review v1.0 finding CRITICAL-02 — schemas previously living in slice PRDs are now in canonical engineering spec; slice PRDs reference these by section number. Existing v1.1 content (tenant management entities, tenant scoping rules, audit envelope, encryption mapping) preserved without modification.
- **v1.2 (refreshed 2026-05-02 per v1.10.1 hygiene cycle physical merge of `Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` Group 5B §CDM rows 27, 70, 98)** — Additive content under "v1.10 cycle additions" section above. Tenant entity gains `consumer_dba`, `legal_entity`, `consumer_subdomain` columns (C3 brand-structure). 6 new research data entities (ResearchConsent, CohortDefinition, DataSharingAgreement, ResearchEthicsReviewBody, ResearchPartner, ResearchDataExport — all tenant-scoped per I-023; export carries country_of_care + audit at high_pii per I-031). 1 new AIExecution entity (normative, fully implemented at v1.0; unifies Mode 1 + Mode 2 under workload taxonomy with `ai_workload_type` discriminator + 5 orthogonal properties). 7 reserved-future entity names (Agent, AgentRun, Tool, ToolCall, AgentMemory, KnowledgeSource, PolicyAuthorization — non-normative at v1.0; activated under ADRs 030–034). Total entity count post-v1.10: **48 active + 7 reserved-future**. Per ADR-028 + ADR-029 + Master PRD v1.10 §10.5/§13.7/§15.3 + INVARIANTS v5.2 + TYPES v5.2 + AUDIT_EVENTS v5.2. Existing v1.2 entity schemas preserved without modification; v1.10 additions are purely additive. No version-number bump (entry-level refresh consistent with the engineering-spec discipline; CDM remains v1.2 in headers and references).
- **v1.2 SPEC ISSUE resolution (2026-05-02 per Codex telecheck-app foundation-layer adversarial review SPEC ISSUE flagged at migrations/001_tenants.sql authorship)** — §4.1 Tenant SQL DDL physically updated to match the C3 brand-structure rule that the prior v1.10.1 hygiene cycle's doc-control entry promised but never merged into the body. Specifically: (1) `id` column comment changed from `tnt_01H...` (ULID) to `Telecheck-{country}` operating-tenant identifier per Master PRD v1.10 §17 — the SoT hierarchy resolution (Master PRD outranks engineering specs); column type retained as VARCHAR(26) (sufficient for `Telecheck-Ghana` = 15 chars, no FK-cascade across tenant_id references in other tables). (2) Three new columns physically added to the SQL DDL (the v1.10.1 hygiene cycle's Group 5B §CDM row-27 promise): `consumer_dba` (patient-facing brand, e.g., `Heros Health`); `legal_entity` (per-country incorporated subsidiary, e.g., `Telecheck Health LLC`); `consumer_subdomain` (country-instanced URL, e.g., `heroshealth.com`). (3) Three new CHECK constraints: `tenant_id_format_valid` (regex `^Telecheck-[A-Z][A-Za-z]+$`); `tenant_id_no_bare_heros` (`id NOT ILIKE 'Heros%'` per Glossary v5.2 anti-pattern); `consumer_dba_starts_heros_health` (`consumer_dba LIKE 'Heros Health%'` C3 invariant). (4) Canonical seed-value table for the two day-1 tenants added inline so engineering migrations can copy directly. (5) §2 Conventions updated with the `tenants.id` exception note explaining this is the single PK exception in the data model. **No version-number bump** (consistent with the engineering-spec discipline; CDM remains v1.2 in headers and references; this is a body-text reconciliation correcting a hygiene-cycle partial merge). Cross-references swept: AUDIT_EVENTS v5.2 + DOMAIN_EVENTS v5.2 + OpenAPI v0.2 + TYPES v5.2 + GOVERNANCE_CONTROLS v5.2 + Tenant Threading Addendum v1.0 example-value sweeps verified consistent with the canonical operating-tenant format.
- **v1.1** — Multi-tenancy applied to all entities per ADR-023. Six new tenant-management entities added. Audit envelope updated to require tenant_id. RLS policies specified for every tenant-scoped table. Encryption-at-rest mapping updated for per-tenant KMS keys per ADR-024. Total entity count: 33 (27 inherited + 6 new).
- **v1.0** — Initial canonical (single-tenant assumption); superseded.
- **Next review:** after engineering applies the migration; after the first non-trivial cross-tenant query bug is detected and resolved (or never detected, which is the goal).
- **Change discipline:** changes to entity schemas, tenant scoping, RLS policies, or encryption keys require Engineering Lead sign-off and update to this document. Slice PRDs and Contracts Pack must align.
