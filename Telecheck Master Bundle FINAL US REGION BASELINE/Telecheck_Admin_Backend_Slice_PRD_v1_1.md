# Telecheck — Admin Backend Slice PRD

**Version:** 1.1
**Status:** Canonical for development — NEW slice introduced in Session 2 of multi-tenancy + Tier-1 ecom + dual-market scope expansion
**Owner:** Product (Telecheck)
**Parent documents:** Master Platform PRD v1.10 §9.3, ADR-023 (multi-tenancy), ADR-024 (country-driven config), RBAC Permissions Matrix v1.1
**Companion documents:** Forms/Intake Engine Slice PRD v2.1, Pharmacy + Refill Slice PRD v2.1, Admin Operator IA v1.1 (existing), Admin Configuration Surfaces Slice PRD v1.0 (existing), Market Rollout Cockpit Slice PRD v1.0, Payment & Billing Spec v1.0
**Format:** Markdown

---

## Position relative to existing admin documents

The existing Admin Operator IA v1.1 and Admin Configuration Surfaces Slice PRD v1.0 cover the **operator-of-the-platform** workflows: governance (Markets, Protocols, AI Guardrails), moderation, incidents, audit, and basic commerce. Those documents remain canonical for what they cover.

This new Admin Backend Slice v1.0 covers the **gold-standard ecom backend** that the Tier-1 US DTC scope (per Master PRD v1.9 §9.3) added at launch:
- Per-tenant ecom operations (Telecheck-US tenant operator team [Heros Health DBA] running Telecheck-US, Telecheck-Ghana tenant operator team [Heros Health Ghana DBA] running Telecheck-Ghana)
- Per-tenant Stripe / Paystack admin
- Inventory management
- Pricing rules and discount codes
- Affiliate program (MVP)
- Conversion dashboards
- AI-assisted operator features

The two sets of admin functionality are surfaced through one unified Admin Backend application, with role-scoped navigation per RBAC v1.1 (Platform Admin sees one set; Tenant Admin sees the other; some shared surfaces like dashboards work in both contexts).

The consolidation: Admin Operator IA v1.1 + Admin Configuration Surfaces v1.0 + Admin Backend v1.1 (this document) together describe the complete admin surface.

---

## 1. Purpose and strategic role

This slice owns the gold-standard ecom admin backend — the operational surface tenant operator teams use to run their DTC telehealth business day-to-day. For the Telecheck-US tenant (Heros Health DBA, US market), this is where the Telecheck-US tenant operator team manages catalog, pricing, discounts, affiliate program, conversion analytics. For the Telecheck-Ghana tenant (Heros Health Ghana DBA, GH market), similar but adapted for Ghana market and Paystack billing.

For Telecheck (the platform operator / B2B parent brand), this is the surface for managing tenants themselves: creating new tenants, configuring country, configuring consumer-DBA brand assets, configuring integration adapters, viewing aggregate cross-tenant metrics.

**Critical design constraint:** the ecom admin must match Hims/Ro/Hero's operational tooling capability. Tenant teams migrating from Rimo or building DTC operations expect Shopify-class polish in the ecom admin: clean tables, fast filters, bulk actions, exportable views, mobile-responsive (operators check inventory on their phones).

**Equally critical:** the ecom admin must respect the platform's clinical and audit invariants. A pricing change, a discount code, an inventory adjustment — all are audited per AUDIT-EVENTS. No shortcut to "just fix it in the database" exists.

---

## 2. Traceability

| Master PRD reference | This slice addresses |
|---|---|
| §9.3 Admin Backend v1.1 scope | This slice spec |
| §6 Timeline — Admin Backend work stream | 6-week delivery target |
| §10.2 Telecheck platform monetization | Per-tenant flat fee + per-patient billing surfaces |
| ADR-023 multi-tenancy | Two role hierarchies (Platform Admin + Tenant Admin) |
| ADR-024 country-driven config | Per-country payment processor admin |
| RBAC v1.1 role hierarchies | Sidebar visibility, action authorization |
| Forms/Intake Engine v2.0 — visual builder | Builder is a feature within Admin Backend |
| Pharmacy + Refill v2.1 — product catalog, pricing, adapter management | Tenant admin manages these via Admin Backend |
| Existing Admin Operator IA v1.1 | Platform-admin governance surfaces preserved |
| Existing Admin Configuration Surfaces v1.0 | Platform-admin operational surfaces preserved |

---

## 3. Actors

| Actor | Role |
|---|---|
| **Platform Owner / Platform Admin** | Telecheck operator. Manages tenants. Sees aggregate cross-tenant metrics. Cannot see tenant-internal PHI by default (break-glass per RBAC v1.1). |
| **Platform Operator** | Telecheck operator (limited). Cross-tenant visibility for support/diagnostics; no tenant suspension or billing modification. |
| **Platform Support** | Telecheck operator (most limited). Read-only diagnostics across tenants. |
| **Tenant Owner** | Tenant superuser (e.g., Telecheck-US tenant superuser — Heros Health DBA — such as the Heros Health COO). Full access within their tenant. Can manage other tenant users including Tenant Admins. |
| **Tenant Admin** | Tenant operator (e.g., Telecheck-US tenant operations lead — Heros Health DBA). Full access within their tenant except cannot manage Tenant Owners. |
| **Tenant Operator** | Day-to-day operations within their tenant: refill exception queue, payment exception queue, delivery exceptions. Limited config access. |
| **Tenant Billing** | Subscription/payment management within their tenant: refunds, dunning, dispute handling. Pricing and discount code management. |
| **Tenant Clinical Lead** | Clinical config within tenant: clinician onboarding, protocol activation, intake form clinical-field approval. |
| **Tenant Marketing** | Conversion-side config within tenant: intake form copy, A/B test variants, affiliate accounts, campaign attribution. No PHI access. |
| **Tenant Support** | Patient support within tenant: limited PHI access (support-context only), can view payment/subscription state, cannot modify clinical records. |

---

## 4. Navigation model

Single Admin Backend application with role-scoped sidebar. Per RBAC v1.1, items are visible based on role; hidden items are absent from sidebar (not disabled).

### 4.1 Platform Admin sidebar

```
┌────────────────────────────────────────┐
│ Telecheck Platform Admin               │
├────────────────────────────────────────┤
│ Dashboard (cross-tenant)               │
│ Tenants                                │
│   - All tenants                        │
│   - Create new tenant                  │
│   - Country profiles                   │
│   - Available adapters                 │
│ Platform Health                        │
│   - System uptime                      │
│   - Per-tenant performance             │
│   - Hot-tenant alerts                  │
│ Markets (existing — Cockpit)           │
│ Protocols (existing — governance)      │
│ AI Guardrails (existing — governance)  │
│ Moderation (existing — governance)     │
│ Incidents (existing)                   │
│ Audit (cross-tenant; aggregate views)  │
│ Reporting                              │
│   - Platform-wide metrics              │
│   - Per-tenant comparisons             │
│   - Revenue per tenant                 │
│ Settings                               │
│   - Platform-admin user management     │
│   - Break-glass session log            │
└────────────────────────────────────────┘
```

### 4.2 Tenant Admin sidebar

```
┌────────────────────────────────────────┐
│ [Tenant Brand Logo]                    │
│ [Tenant Brand Name] Admin              │
├────────────────────────────────────────┤
│ Dashboard (this tenant)                │
│ Patients                               │
│   - Patient search                     │
│   - Active subscribers                 │
│   - Cohort analysis                    │
│ Subscriptions                          │
│   - Active subscriptions               │
│   - Cancellation queue                 │
│   - Pause / resume queue               │
│   - Switch queue                       │
│   - Payment failures                   │
│ Refills                                │
│   - Refill queue                       │
│   - Exception queue                    │
│   - Stockout queue                     │
│   - Delivery exceptions                │
│ Catalog                                │
│   - Products                           │
│   - Pricing                            │
│   - Discount codes                     │
│ Intake Forms                           │
│   - Templates                          │
│   - Visual builder                     │
│   - A/B tests                          │
│   - Conversion analytics               │
│ Pharmacy                               │
│   - Adapter configuration              │
│   - Routing rules                      │
│   - Inventory status                   │
│ Clinicians (delegated to Clinical Lead)│
│   - Clinician roster                   │
│   - Protocol activation per tenant     │
│ Marketing                              │
│   - Campaigns / attribution            │
│   - Affiliate program                  │
│   - Customer cohorts                   │
│ Reports                                │
│   - Conversion funnel                  │
│   - Revenue                            │
│   - LTV / churn                        │
│   - Custom reports                     │
│ Audit (this tenant)                    │
│ Settings                               │
│   - Brand / theming                    │
│   - Domain                             │
│   - Tenant user management             │
│   - Notification copy variants         │
│   - Legal documents (TOS, privacy)     │
└────────────────────────────────────────┘
```

### 4.3 Sub-role visibility

Tenant Operator, Tenant Billing, Tenant Marketing, Tenant Clinical Lead, Tenant Support each see a subset of the Tenant Admin sidebar per RBAC v1.1 §2 permissions matrix.

---

## 5. Key surfaces (high-detail)

### 5.1 Platform Admin: Tenant management

#### 5.1.1 Tenant list

Table of all tenants:

| Tenant Identifier | Country | Consumer DBA | Legal Entity | Status | Created | Active Patients | MRR | Last Active |
|---|---|---|---|---|---|---|---|---|
| Telecheck-US | US | Heros Health | Telecheck Health LLC | active | 2026-XX-XX | 12,847 | $342K | 2 min ago |
| Telecheck-Ghana | GH | Heros Health Ghana | Telecheck-Ghana Ltd. | active | 2026-XX-XX | 5,213 | GH₵ 187K | 1 min ago |

Filters: country, status, created date range, active range, MRR range.
Bulk actions: export to CSV, suspend, activate (with confirmation).
Click row: tenant detail.

#### 5.1.2 Tenant detail

Tabs:
- **Overview**: status, country, brand, key metrics, recent activity
- **Configuration**: brand assets, custom domain, integration adapters, CCR overrides
- **Users**: tenant users (Tenant Owner, Tenant Admin, Tenant Operator, etc.) with role assignments
- **Billing**: platform fee, per-patient fee, current invoice, payment status
- **Activity**: recent admin actions on this tenant (audited)
- **Health**: per-tenant performance metrics (request rate, error rate, latency)

#### 5.1.3 Create new tenant

Wizard:
1. Choose country (US, GH; future: dropdown grows as countries added)
2. Set brand: name, logo, primary color
3. Select integration adapters (clinician network adapter from country-available list, pharmacy adapters, payment processor auto-set per country)
4. Configure custom domain (optional; can be set later)
5. Seed initial Tenant Owner: email, name, role
6. Review and create
7. Invitation email sent to initial Tenant Owner

#### 5.1.4 Country profiles

Read-mostly view of CCR templates. Platform admin can update CCR template values (with audit), affecting all tenants in that country. New country additions require engineering involvement (new regulatory module, new integration adapters where existing don't fit).

#### 5.1.5 Break-glass session

Platform admin clicks "Access tenant data" on a specific tenant. Confirmation dialog requires:
- Tenant selection
- Reason for access (free text, required)
- Time bound (1h, 4h, 8h)
- Acknowledgment of audit and tenant notification
On confirmation: break-glass session active. Admin has tenant-admin-equivalent access to that tenant for the time bound. Session logged. Tenant Owner/Admin notified immediately. Post-session: admin must document what was accessed (free text) within 7 days; reviewed by Privacy Officer.

### 5.2 Platform Admin: Cross-tenant analytics

Aggregate metrics across all tenants. No row-level PHI.

- Total active patients across platform (with breakdown per tenant)
- Total MRR across platform (with breakdown per tenant; in tenant currency for tenant view; converted to USD for platform view via daily FX rates)
- Total consult volume per period
- Total refill volume per period
- Platform health: error rates, latency p50/p95/p99, request volume per tenant
- Hot-tenant detection: a single tenant disproportionately impacting platform performance (per OR-255)
- Per-tenant compliance status: SOC 2 evidence collection status, DPC registration status, US BAA structure status

### 5.3 Tenant Admin: Subscriptions

#### 5.3.1 Active subscriptions

Filterable table of all active subscriptions:

| Patient | Product | Status | Cadence | MRR | Started | Next Renewal | Pause? |
|---|---|---|---|---|---|---|---|
| Patient A | Semaglutide 1mg | ACTIVE | Monthly | $199 | 2026-XX-XX | 2026-XX-XX | — |
| Patient B | Tirzepatide 5mg | PAUSED | Monthly | — | 2026-XX-XX | (paused until 2026-XX-XX) | Yes |

Filters: status, product, cadence, signup cohort, payment health, region.
Bulk actions: export, message campaign (consent-aware).
Click row: subscription detail.

#### 5.3.2 Subscription detail

Full subscription record:
- State machine status with history (per Pharmacy + Refill v2.1 §8.2)
- Patient (link to patient record; tenant-scoped only)
- Product
- Pricing
- Cadence
- Pause history
- Switch history
- Refill history (link to each refill)
- Payment history
- Audit trail for this subscription

Tenant operator can:
- Manually pause (with reason; audited)
- Manually resume (with reason; audited)
- Initiate manual refund (within tenant policy)
- Add note (visible to other tenant users; audited)

#### 5.3.3 Cancellation queue

Subscriptions in CANCELLATION_PENDING state. Tenant operator can:
- Reach out for save-attempt (using approved templates; consent-aware)
- Confirm cancellation
- Process refund per tenant cancellation policy

#### 5.3.4 Payment failures

Subscriptions in dunning state. Operator can:
- See payment failure history
- Send payment-update reminder (using template)
- Manually retry payment
- Escalate to Tenant Billing

### 5.4 Tenant Admin: Catalog management

#### 5.4.1 Product catalog

Per-tenant product list per Pharmacy + Refill v2.1 §7. Tenant admin can:
- Add product (form: display name, generic name, RxNorm, NDCs, form, strength, package size, program, category, available adapters, preferred adapter, compounding flag, pricing per cadence)
- Edit existing product
- Mark product out-of-stock (auto-pauses affected subscriptions per Pharmacy + Refill v2.1 §13.2)
- Discontinue product (existing subscriptions migrate per discontinuation policy; new subscriptions blocked)
- Bulk import via CSV (for tenant migration scenarios — Telecheck-US tenant [Heros Health DBA] migration uses this pathway)
- Bulk export to CSV

Tenant Clinical Lead approval required for: adding new Rx products, modifying compounding configuration, modifying clinical descriptions.

#### 5.4.2 Pricing rules

- Per-product pricing per cadence (monthly, quarterly, biannual)
- Per-region pricing overrides (US tenants only — different prices in different states based on tax/regulatory)
- Time-based promotions (e.g., 20% off first 3 months for new subscribers)
- Bulk pricing updates with preview (shows affected subscriptions and revenue impact)

Audit: every pricing change captures: who, when, before, after, scope (which products/regions affected), reason (free text required for changes >10%).

#### 5.4.3 Discount codes

Discount code engine per Master PRD §9.3:

```sql
CREATE TABLE discount_codes (
  id              VARCHAR(26) PRIMARY KEY,
  tenant_id       VARCHAR(26) NOT NULL REFERENCES tenants(id),
  
  code            VARCHAR(50) NOT NULL,
  code_type       VARCHAR(20) NOT NULL,   -- "single_use", "multi_use", "single_use_per_patient"
  
  discount_type   VARCHAR(20) NOT NULL,   -- "percentage", "fixed_amount"
  discount_value  DECIMAL(10, 2) NOT NULL,
  
  -- Scope
  applies_to      VARCHAR(20) NOT NULL,   -- "all_products", "specific_products", "specific_programs"
  applies_to_ids  JSONB,
  
  -- Lifecycle
  valid_from      TIMESTAMPTZ NOT NULL,
  valid_until     TIMESTAMPTZ,
  
  -- Usage caps
  max_total_uses  INTEGER,                -- null = unlimited
  max_uses_per_patient INTEGER NOT NULL DEFAULT 1,
  current_uses    INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  status          VARCHAR(20) NOT NULL,   -- "active", "expired", "exhausted", "disabled"
  
  -- Constraints
  minimum_subscription_value DECIMAL(10, 2),
  first_time_subscriber_only BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Audit
  created_by      VARCHAR(26) NOT NULL REFERENCES tenant_users(id),
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (tenant_id, code)
);
```

Tenant Marketing or Tenant Billing can:
- Create discount codes (single-use, multi-use, percentage, fixed amount)
- Assign to specific products / programs
- Set expiry, usage caps
- Track usage in real-time
- Disable codes mid-flight
- Bulk generate codes (for influencer campaigns, etc.)

Audit: every discount code creation, modification, redemption captured.

### 5.5 Tenant Admin: Affiliate program (MVP)

Per Master PRD §9.3 affiliate MVP scope:

#### 5.5.1 Affiliate accounts

```sql
CREATE TABLE affiliate_accounts (
  id              VARCHAR(26) PRIMARY KEY,
  tenant_id       VARCHAR(26) NOT NULL REFERENCES tenants(id),
  
  display_name    VARCHAR(200) NOT NULL,
  contact_email   VARCHAR(255) NOT NULL,
  
  -- Tracking
  unique_slug     VARCHAR(50) NOT NULL,   -- used in tracking URLs
  utm_default_source VARCHAR(100),
  utm_default_medium VARCHAR(100),
  
  -- Commission
  commission_type VARCHAR(20) NOT NULL,   -- "percentage", "flat_per_conversion"
  commission_value DECIMAL(10, 2) NOT NULL,
  attribution_window_days INTEGER NOT NULL DEFAULT 30,
  
  -- Payout (US)
  stripe_connect_account_id VARCHAR(100),  -- for Stripe Connect payouts
  
  -- Payout (Ghana — manual at launch)
  payout_method   VARCHAR(50),             -- "stripe_connect", "manual_bank", "mobile_money"
  payout_details  JSONB,                   -- encrypted
  
  -- Status
  status          VARCHAR(20) NOT NULL,    -- "active", "paused", "terminated"
  
  -- Lifecycle
  approved_at     TIMESTAMPTZ,
  approved_by     VARCHAR(26) REFERENCES tenant_users(id),
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (tenant_id, unique_slug)
);

CREATE TABLE affiliate_conversions (
  id              VARCHAR(26) PRIMARY KEY,
  tenant_id       VARCHAR(26) NOT NULL REFERENCES tenants(id),
  
  affiliate_account_id VARCHAR(26) NOT NULL REFERENCES affiliate_accounts(id),
  patient_id      VARCHAR(26) NOT NULL REFERENCES accounts(id),
  
  -- Source attribution
  attribution_link_id VARCHAR(26),
  utm_source      VARCHAR(100),
  utm_medium      VARCHAR(100),
  utm_campaign    VARCHAR(100),
  utm_content     VARCHAR(100),
  
  -- Conversion event
  conversion_type VARCHAR(20) NOT NULL,    -- "signup", "first_subscription", "first_purchase"
  conversion_value DECIMAL(10, 2),
  
  -- Commission
  commission_amount DECIMAL(10, 2) NOT NULL,
  commission_status VARCHAR(20) NOT NULL,  -- "pending", "approved", "paid", "reversed"
  
  -- Reversal (refund handling)
  reversed_at     TIMESTAMPTZ,
  reversal_reason VARCHAR(200),
  
  -- Payout linkage
  payout_id       VARCHAR(26),
  
  occurred_at     TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 5.5.2 Affiliate workflow

- Tenant Marketing creates affiliate account
- Affiliate receives unique tracking link (e.g., `https://heroshealth.com/?ref=affiliate_slug`)
- Patient clicks link → cookie set with affiliate_account_id and attribution timestamp
- Patient signs up within attribution window → conversion created with `conversion_type = "signup"`
- Patient completes first subscription → conversion created with `conversion_type = "first_subscription"`
- Commission calculated per affiliate config
- Commission held in `pending` until clearance period (30 days post-conversion to handle refunds)
- After clearance: commission moves to `approved`
- Periodic batch payout (weekly or monthly per tenant config)

#### 5.5.3 Payout handling

**US tenants:** Stripe Connect — affiliate accounts have associated Stripe Connect accounts; payout is automated via Stripe Connect transfer. Tenant pays platform processing fees; affiliate receives net.

**Ghana tenant:** Manual reconciliation at launch (per Master PRD §9.3). Tenant Billing exports approved commissions monthly; manually pays via bank transfer or mobile money; marks paid in admin.

Future: automated mobile money payout for Ghana via Paystack Connect equivalent (Phase 2 per OR-312).

#### 5.5.4 Affiliate dashboard (for affiliate themselves)

Out of MVP scope at launch. Tenant Marketing communicates performance to affiliates manually. Self-service affiliate dashboards are Phase 2 (per OR-312).

### 5.6 Tenant Admin: Conversion dashboards

Per Master PRD §9.3 conversion dashboards scope. Powered by PostHog (per ADR-022) and Metabase (per ADR-022).

#### 5.6.1 Funnel analysis

Per intake form deployed:
- Step 1 → Step 2 → ... → Completion
- Drop-off rate per step
- Median time per step
- Conditional branch utilization
- Variant performance (where A/B test active per Forms Engine v2.1 §14)

Filters: time range, source/medium/campaign, region (US tenants), variant, cohort.

#### 5.6.2 Cohort retention

For cohorts of completed signups by month:
- 30/60/90/180-day active patient retention
- 30/60/90/180-day subscription retention
- LTV per cohort
- Revenue per cohort

#### 5.6.3 Acquisition source attribution

- Source/medium/campaign breakdown
- Cost per acquisition (when paired with marketing spend data)
- Quality per source (downstream subscription retention by source)

#### 5.6.4 Per-product performance

- New subscriptions per product per period
- Subscription LTV per product
- Cancellation rate per product (with reasons)
- Switch flows: which products patients switch from/to

#### 5.6.5 Custom reports

Tenant admin can build custom reports via Metabase interface (drag-and-drop query builder; SQL editor for advanced users). Reports are tenant-scoped; cannot query across tenants.

### 5.7 Tenant Admin: AI-assisted operator features (NEW per Master PRD §9.3)

Per ADR-020 LLM provider abstraction. **Provider selection rule (clarified v1.1 per LOW-22):** Non-clinical AI features in this section default to the platform's configured non-clinical LLM provider per ADR-020. The default at launch is Anthropic Claude. Cost-optimization may route specific functions (anomaly detection, restock prediction, clustering) to lighter-weight models without changing the user-facing behavior — engineering implements this transparently. Tenants may NOT override the provider selection — provider selection is platform-scoped (avoids inconsistent operator behavior across tenants and ensures cost / quality / safety control). Audit captures which provider and model served each AI-assisted feature invocation per AUDIT_EVENTS v5.1 Category C.

#### 5.7.1 Conversion anomaly detection

Engine monitors per-tenant conversion funnel daily. If a metric deviates >2 standard deviations from rolling 30-day baseline, alert tenant admin:

> "Heads up: GLP-1 intake conversion dropped from 62% to 47% over the last 24 hours. Most drop-off is at the cardiovascular history step. The new variant deployed yesterday may be the cause. [link to variant comparison]"

Anomaly detection runs in the non-clinical AI service path per ADR-020. Provider selection is platform-scoped per §5.7 above.

#### 5.7.2 Copy suggestions

When tenant admin edits intake form copy, AI offers suggestions:
- "This question text is 14 words. Conversion forms typically perform better at 8 words or less. Suggested rewrites: [3 options]"
- "This educational interstitial reads at 12th-grade level. Patient population averages 8th-grade reading level. Suggested simplification: [draft]"

Suggestions are advisory; tenant admin always chooses to accept/reject.

#### 5.7.3 Cancellation reason clustering

For high-cancellation periods, AI clusters free-text cancellation reasons into themes and surfaces top patterns:

> "Top cancellation themes this week: (1) Side effects, primarily nausea — 42 patients (28% of cancellations). (2) Slow results — 28 patients (19%). (3) Cost — 19 patients (13%)."

Helps tenant admin prioritize product/clinical interventions.

#### 5.7.4 Inventory restock prediction

AI analyzes refill volume trends and inventory data; predicts stockout risk. Alert tenant operator: "Semaglutide 1mg projected to stock out in 5 days at current refill velocity. Last reorder was [date]. Recommend reordering now."

#### 5.7.5 Caveats and audit

Every AI suggestion is labeled as such ("AI suggestion — review before applying"). Audit captures: AI provider, model, prompt context, suggestion shown, action taken (accepted/rejected). Per AI-LAYERING contract.

AI features in admin backend are non-clinical (operator productivity tools); they do not bypass the clinical AI guardrails of Mode 1 and Mode 2.

### 5.8 Tenant Admin: Brand and theming

Per Tenant Configuration module (System Architecture v1.2 §13):
- Brand name, logo upload
- Primary, secondary, accent colors with live preview
- Typography overrides (within design tokens framework)
- Custom domain configuration with DNS verification flow
- Notification copy variant overrides per template
- Email-from address and reply-to (per tenant.support_email)

### 5.9 Tenant Admin: Tenant user management

Per RBAC v1.1:
- List of tenant users with roles
- Invite new user (email, role)
- Remove user
- Change user role
- View user activity log (audited)
- Tenant Owner cannot be removed except by Platform Admin per RBAC §5

### 5.10 Tenant Admin: Audit log access

Per RBAC v1.1 §2 — Tenant Admin can read this tenant's audit. Filters by category (clinical, governance, operational), actor, time range, action type. Export to CSV (with PHI handling caveat). Per OR-241.

### 5.11 Tenant Admin: Legal documents

- Terms of Service URL (link to externally hosted document, or upload to Telecheck-hosted)
- Privacy Policy URL
- Per-program consent text variants (per Consent Slice integration)
- Effective date tracking

---

## 6. Confirmation patterns (preserved from Admin Operator IA v1.1)

High-consequence actions use multi-step confirmation:

**Standard confirmation** (low-risk changes):
- Edit pricing on a single product → "Save changes?" → Saved.

**Destructive confirmation** (high-risk):
- Discontinue a product → "Type product name to confirm" → Type → "Discontinue product PRODUCT-NAME?" → "Discontinue" button (red).

**Rollback-required confirmation** (governance-grade):
- Deploy new intake form variant to live patients → "Preview changes" → "Affects [N] patients in flight" → "Confirm and deploy" → Deployed; rollback button visible for 1 hour.

**Cross-tenant confirmation** (Platform Admin only):
- Suspend a tenant → "Confirm tenant suspension. Effects: [list]. This will affect [N] active patients." → Type tenant name → Confirm → Suspended.

---

## 7. Performance targets

| Surface | Target |
|---|---|
| Dashboard initial load | < 1.5 seconds |
| Subscription table filter / sort | < 500 ms |
| Catalog table interactions | < 500 ms |
| Discount code creation | < 1 second |
| Visual builder responsiveness | < 100 ms per element interaction |
| Conversion funnel render | < 3 seconds (Metabase / PostHog backed) |
| AI suggestion latency (non-clinical) | < 5 seconds |
| Bulk export (10K rows) | < 30 seconds, async with download link |

---

## 8. Mobile responsiveness

Admin Backend is desktop-primary. Tenant operators check inventory and refill exceptions on phones; mobile responsive at minimum for:
- Dashboard
- Subscription queue
- Refill exception queue
- Inventory status
- Discount code creation
- Audit log read

Visual builder and complex configuration surfaces are desktop-only.

---

## 9. Per-tenant audit visibility

Per RBAC v1.1 §2 — Tenant Admin sees their tenant's audit. Cannot see other tenants' audit. Cannot see Platform Admin actions on their tenant beyond what was already audited within their tenant scope (i.e., a Platform Admin break-glass session that accessed their tenant's data is visible to Tenant Admin per the break-glass notification flow §5.1.5).

Platform Admin sees aggregate audit: counts of action types per tenant per period; for specific PHI-containing audit records, requires break-glass.

---

## 10. Integration points

| Integration | Surface | Mechanism |
|---|---|---|
| Stripe (US tenants) | Subscriptions, refunds, dispute handling | Stripe API + webhooks; tenant-scoped Stripe accounts |
| Paystack (Ghana tenant) | Subscriptions, refunds | Paystack API + webhooks |
| Stripe Connect (US affiliate payouts) | Affiliate accounts, payouts | Stripe Connect API |
| PostHog | Conversion analytics, A/B test data | PostHog SDK + queries |
| Metabase | BI dashboards | Metabase embedded views; per-tenant SQL filters |
| Anthropic Claude (or alternative) | AI-assisted features | LLM provider abstraction per ADR-020 |
| Tenant Configuration module | Tenant resolution, CCR, adapters | Synchronous calls per System Architecture v1.2 §13 |
| Audit module | Every admin action audited | Audit write per AUDIT-EVENTS contract |
| Forms/Intake Engine module | Visual builder rendering | Embedded builder UI |
| Pharmacy + Refill module | Subscription, refill, catalog management | Direct module API calls |
| Consent module | Consent text variant management | Direct module API calls |

---

## 11. Open questions (slice-level)

1. **Custom report sharing across tenants** — Platform Admin authors a useful Metabase report; can it be templated and made available to all tenants? Default proposal: yes, as "Platform-provided reports" surface; tenants can clone and customize. Engineering scope.
2. **Tenant-to-tenant integrations** — should two tenants under the same parent organization be able to share data? Out of scope at launch (federated identity is post-launch per ADR-023).
3. **White-labeled patient-facing admin surfaces** — should tenants get their own branded admin URL (e.g., admin.heroshealth.com) or all tenants share Telecheck-hosted admin? Default proposal: Telecheck-hosted at launch; per-tenant subdomain Phase 2.
4. **Mobile app for tenant operators** — beyond mobile-responsive web, a dedicated mobile app for refill/exception triage. Out of scope at launch.
5. **AI auto-action features** — could AI auto-action low-risk operator tasks (e.g., auto-pause subscription on payment failure when patient has prior pause history)? Out of scope at launch; AI is suggestion-only per §5.7.

---

## 12. Dependencies

- **Identity & Authentication Spec v1.0** multi-tenant adapted
- **RBAC Permissions Matrix v1.1** — role hierarchies, action authorization, break-glass procedure
- **Tenant Configuration module** per System Architecture v1.2 §13 — tenant resolution, brand, CCR, adapters
- **Forms/Intake Engine Slice v2.0** — visual builder lives here, conversion analytics consumed
- **Pharmacy + Refill Slice v2.0** — catalog management, subscription management, pharmacy adapter config
- **Payment & Billing Spec v1.0** — Stripe / Paystack integration, refund handling
- **AI Service** per ADR-020 — non-clinical AI features for operator productivity
- **PostHog (self-hosted)** per ADR-022 — conversion analytics, A/B testing data
- **Metabase (self-hosted)** per ADR-022 — BI dashboards
- **Audit module** per ADR-013 — every admin action audited
- **Existing Admin Operator IA v1.1** — preserved for platform-admin governance surfaces (Markets, Protocols, AI Guardrails, Moderation, Incidents)
- **Existing Admin Configuration Surfaces Slice v1.0** — preserved for platform-admin operational surfaces

---

## v1.10 cycle additions (added 2026-05-02 per v1.10.1 hygiene cycle physical merge of Phase5 delta Row 39)

C3 brand-structure cascade applied to per-tenant prose, actor examples, tenant directory, and "Position relative to existing admin documents" section per v1.10 C3 (Phase 5 delta Row 39):

- **Operating-tenant naming** (`Telecheck-{country}`) replaces bare `Heros` references where the operating tenant is meant; consumer-DBA framing (`Heros Health DBA` / `Heros Health Ghana DBA`) qualifies the consumer-brand context.
- **§1 Position-relative prose:** "Heros team running Heros, Telecheck-Ghana team running Telecheck-Ghana" rewritten as "Telecheck-US tenant operator team [Heros Health DBA] running Telecheck-US, Telecheck-Ghana tenant operator team [Heros Health Ghana DBA] running Telecheck-Ghana".
- **§1 Purpose prose:** Per-tenant prose ("For Heros, ... For Telecheck-Ghana, ...") rewritten with operating-tenant identifiers + DBA qualifiers.
- **§3 Actors:** Tenant Owner / Tenant Admin example phrasing reframed with operating-tenant + DBA framing.
- **§5.1.1 Tenant list table:** Columns updated from "Tenant | Country | Brand" to the structured C3 vocabulary "Tenant Identifier | Country | Consumer DBA | Legal Entity"; row values populated per C3 (Telecheck-US / Heros Health / Telecheck Health LLC; Telecheck-Ghana / Heros Health Ghana / Telecheck-Ghana Ltd.).
- **§5.1.3 Bulk import note + Next review entry:** "Heros migration" / "Heros operations" replaced with "Telecheck-US tenant [Heros Health DBA]" framing.

"Telecheck" remains platform/B2B-only and never consumer-facing; "Heros Health" is the consumer DBA, country-instanced via subdomains. Cross-references: Master Platform PRD v1.10 §17 (brand-structure rules), Tenant Threading Addendum v1.0, Phase 5 Slice/Engineering/Operations delta artifact (`Telecheck_v1_10_PRD_Update/Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md`).

---

## Document control

- **v1.10 cycle delta (body unchanged at v1.1 baseline; per-tenant prose + tenant directory amended in-place)** — 2026-05-02 per v1.10.1 hygiene cycle. Phase 5 delta Row 39 physically merged: §1 per-tenant prose, §3 Actors examples, §5.1.1 tenant list columns, §5.1.3 bulk import note, and Next review entry reframed using structured C3 brand vocabulary. See "v1.10 cycle additions" section above and `Telecheck_v1_10_PRD_Update/Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md`.
- **v1.1** — Clarifies §5.7 AI-assisted operator features provider selection per Adversarial Counsel Review v1.0 finding LOW-22 — non-clinical AI features default to Anthropic Claude per ADR-020; tenants may not override; cost-optimization may route to lighter models transparently; provider/model captured in audit. Also notes alignment with Unified Admin Sidebar v1.0 (per HIGH-10 remediation) — sidebar layout in this slice's §4 Navigation model is now reconciled with the canonical Unified Sidebar layout. Substantive workflow content unchanged.
- **v1.0** — NEW slice introduced in Session 2 of multi-tenancy + Tier-1 ecom + dual-market scope expansion. Defines the gold-standard ecom admin backend covering: per-tenant subscription management, catalog management, pricing rules, discount codes, affiliate program MVP, conversion dashboards, AI-assisted operator features, brand/theming, tenant user management, audit log access. Platform Admin surfaces for tenant management and cross-tenant analytics. Two role hierarchies per RBAC v1.1. Preserves all existing Admin Operator IA v1.1 and Admin Configuration Surfaces v1.0 platform-admin governance surfaces.
- **Next review:** after first Tenant Admin team (Telecheck-US tenant operations [Heros Health DBA] or Telecheck-Ghana tenant operations [Heros Health Ghana DBA]) completes onboarding to the admin backend; after first month of operational data flows through the conversion dashboards; after first AI-assisted operator feature reaches measurable adoption.
- **Change discipline:** changes to RBAC role hierarchies, audit envelope, AI feature scope (clinical vs non-clinical boundary), or break-glass procedure require Engineering Lead + Privacy Officer + Product Lead sign-off.
