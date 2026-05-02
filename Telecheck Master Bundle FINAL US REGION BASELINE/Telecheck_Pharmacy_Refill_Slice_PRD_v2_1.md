# Telecheck — Pharmacy + Refill Slice PRD

**Version:** 2.1
**Status:** Canonical for development
**Owner:** Product (Telecheck)
**Supersedes:** Refill Slice PRD v1.0; Pharmacy Portal Slice PRD v1.0 (consolidated into this single Pharmacy + Refill spec at v2.0)
**Parent documents:** Master Platform PRD v1.9 §9.2, ADR-023 (multi-tenancy), ADR-024 (country-driven config), Contracts Pack v5.1 (filenames retain v5_00 convention; headers govern)
**Companion documents:** Forms/Intake Engine Slice PRD v2.1, Admin Backend Slice PRD v1.1, Medication Interaction & Validation Engine Slice PRD v1.0, Consent & Delegated Access Slice PRD v1.0, Payment & Billing Spec v1.0, Notification Spec v1.1
**Format:** Markdown

---

## Change log from v1.0

v2.0 is the Tier-1 ecom rewrite — Hims/Ro/Hero parity for US tenants, while preserving Ghana market patterns:

1. **Consolidation of Refill Slice and Pharmacy Portal Slice** into one Pharmacy + Refill v2.1 PRD. The two slices were tightly coupled in v1.0 with cross-references; v2.0 consolidates for clarity. The Pharmacy Portal Slice v1.0 is superseded by this document.
2. **Subscription model (NEW for US tenants).** Auto-renewing prescription subscriptions on pharmacy shipping cadence. Pause, resume, switch products, cancel. State machine for Subscription entity.
3. **Multi-product cart (NEW for US tenants).** Multiple medications/products in a single intake/checkout where program design permits (e.g., GLP-1 + B12 + anti-nausea support).
4. **Product switching (NEW for US tenants).** Patient can switch from product A to product B within a program, with appropriate clinician review (semaglutide ↔ tirzepatide; finasteride ↔ topical minoxidil).
5. **Pause/resume mechanics.** Patient-initiated pause for travel, financial reasons, or just taking a break. Bounded to 90 days per program; longer pause requires re-enrollment.
6. **Adapter framework.** PharmacyProvider abstraction per ADR-023, with adapters for Truepill, Honeybee, Capsule, Alto (US) and Ghana partner pharmacies. Per-tenant adapter selection.
7. **Per-tenant scoping** of all entities. Subscriptions, refills, prescriptions, dispensings, shipments tenant-scoped per Canonical Data Model v1.2.
8. **Pre-authorization windows** by medication class (preserved from v1.0; extended for subscription mechanic).
9. **Compounding-aware extension points** for future US 503A/503B compounding pharmacy integration.
10. **Inventory awareness** — pharmacy adapter reports availability; refill flow handles stockouts gracefully.
11. **Shipment tracking** — patient sees status from pharmacy through last-mile delivery.
12. **Honest status copy** preserved and extended to subscription states.
13. **Bridge supply on consent revocation** preserved per ADR-008.

The v1.0 Refill Slice's clinical-safety guarantees (interaction engine gate, SAFETY_HOLD state, clinician-review default with protocol-authorized as configurable, all five interaction check classes as refill safety gate) are preserved without dilution. The Tier-1 commercial mechanics layer on top, not over.

---

## 1. Purpose and strategic role

This slice owns:
- **Refill workflow** — the end-to-end process from refill initiation through pharmacy fulfillment to patient receipt
- **Subscription mechanics** — for US tenants, the auto-renewing subscription that powers the DTC business model (Hims/Ro/Hero pattern)
- **Pharmacy adapter framework** — the abstraction layer over pharmacy partner integrations
- **Product catalog** — per-tenant medication and product catalog with pricing, availability, routing
- **Cart and checkout** — multi-product cart for tenants where applicable
- **Switching, pause, resume, cancel** — subscription lifecycle operations
- **Shipment tracking** — last-mile visibility for the patient

Two equally important goals:

**Clinical safety goal:** every refill, every new prescription, every product switch passes through the interaction engine and clinician (or protocol-authorized) review. Bridge supply on consent revocation. SAFETY_HOLD on abrupt-discontinuation risk. This is the v1.0 framing.

**Commercial revenue goal:** for US DTC tenants, subscription mechanics ARE the business. Pause-resume retention, switch-instead-of-cancel deflection, multi-product expansion, low-friction renewal — these drive LTV. The slice must be commercially excellent without compromising clinical rigor.

---

## 2. Traceability

| Master PRD reference | This slice addresses |
|---|---|
| §3 Pillar 3 — Pharmacy and prescription commerce | This slice IS Pillar 3 |
| §5.1 Tier-1 ecom scope | Subscription, multi-product cart, switching are the Tier-1 additions |
| §6 Timeline — Pharmacy + Refill work stream | 6-week delivery target |
| §8 Job 2 — Refill a medication | Core workflow |
| §9.2 Pharmacy + Refill v2.1 scope | This slice spec |
| §10.1 Heros revenue model — DTC subscription | Subscription mechanics support this |
| ADR-008 Bridge supply on consent revocation | Preserved |
| ADR-023 Multi-tenancy | All entities tenant-scoped |
| ADR-024 Country-driven config | PharmacyProvider adapter selection per tenant per country |
| Contracts Pack v5 — IDEMPOTENCY | Refill operations idempotent per terminal-state contract |
| Contracts Pack v5 — DOMAIN-EVENTS | Refill, Subscription events emitted per envelope |

---

## 3. Actors

| Actor | Role |
|---|---|
| **Patient** | Initiates refill, manages subscription, manages cart, requests switch, pause, resume, cancel |
| **Delegate** | Acts on patient's behalf per delegation scope |
| **Clinician** | Reviews refill requests in clinician-review pathway; reviews switch requests; reviews exception cases |
| **Protocol** | Authorizes refills in protocol-authorized pathway (per medication class configuration) |
| **Pharmacy partner (via adapter)** | Receives prescription, picks/labels/packages, performs release check, dispatches to delivery |
| **Pharmacist (within partner pharmacy)** | Performs clinical release check |
| **Delivery partner (via adapter)** | Last-mile delivery |
| **Tenant Admin** | Configures product catalog, pricing, pharmacy adapter selection, refill cadence per medication class |
| **Tenant Operator** | Handles refill exception queue, payment failures, delivery exceptions |
| **Tenant Billing** | Manages subscription pricing, refunds, dunning |
| **Platform Admin** | Aggregate cross-tenant metrics; not direct PHI access |
| **AI Mode 1** | Helps patients initiate refills (does not approve) |

---

## 4. Tenant scoping (per ADR-023)

Every entity in this slice is tenant-scoped: Prescription (MedicationRequest), Refill, Subscription, SubscriptionEvent, Dispensing, Shipment, ProductCatalog, AdapterConfig (the pharmacy adapter selection), Patient pharmacy preferences. PostgreSQL Row-Level Security policies enforce per Canonical Data Model v1.2.

A patient's medication subscription in Tenant A is independent of any subscription they may have in Tenant B. Cross-tenant patient identity is not in scope per ADR-023.

---

## 5. Country-driven adapter selection (per ADR-024)

Per-country pharmacy adapter availability:

**US (country = "US"):**
- Truepill (full-service Rx fulfillment)
- Honeybee (full-service Rx fulfillment)
- Capsule (delivery-focused, urban markets)
- Alto (delivery-focused, urban markets)
- (Future) Telecheck-owned pharmacy if a tenant elects this Phase 2 option

**Ghana (country = "GH"):**
- Partner pharmacies in Ghana (specific partners per Ghana Launch Playbook)
- Telecheck-Ghana operated pharmacy infrastructure (where applicable)

Per-tenant configuration: tenant admin selects which adapters are active for their tenant from the country's available list. A tenant can have multiple adapters active simultaneously (e.g., Truepill + Honeybee for redundancy or geography-based routing).

---

## 6. The PharmacyProvider abstraction (per System Architecture v1.2 §7.3)

```
interface PharmacyProvider {
  fulfill_prescription(prescription_data, tenant_id) → FulfillmentRequest
  get_inventory(medication_codes, location?) → InventoryReport
  cancel_fulfillment(fulfillment_id) → CancellationResult
  webhook_handler(payload) → Event
  get_shipment_status(shipment_id) → ShipmentStatus
  get_pharmacy_metadata() → ProviderMetadata
}
```

Each concrete adapter implements this interface. Adapter conformance test suite (per OR-244) verifies any new adapter passes a standard test battery before activation.

### 6.1 Routing logic when multiple adapters active

If a tenant has multiple adapters active, routing per prescription follows tenant-configured rules:
- **By geography**: use Adapter A for ZIP codes X-Y; Adapter B for ZIP codes Z-W
- **By medication class**: use Adapter A for compounded GLP-1; Adapter B for branded medications
- **By inventory**: use lowest-cost available adapter; failover if stockout
- **Manual per-prescription**: tenant operator chooses (exception-only)

### 6.2 Adapter failure handling

If a pharmacy adapter is unreachable or returns errors:
- Refill enters EXCEPTION state
- Tenant Operator notified via Admin Backend dashboard
- Manual intervention required: re-route to alternate adapter, contact patient about delay, etc.
- Patient sees honest status: "We're working on getting your medication shipped. We've encountered a delay with our pharmacy partner and are resolving it."

---

## 7. Product catalog (NEW in v2.0)

Per-tenant product catalog. Tenant admin manages via Admin Backend Slice v1.0.

### 7.1 Product entity

```sql
CREATE TABLE product_catalog (
  id              VARCHAR(26) PRIMARY KEY,
  tenant_id       VARCHAR(26) NOT NULL REFERENCES tenants(id),
  
  -- Identification
  display_name    VARCHAR(200) NOT NULL,           -- "Semaglutide 0.5mg/mL"
  generic_name    VARCHAR(200) NOT NULL,           -- "Semaglutide"
  rxnorm_code     VARCHAR(20),                     -- canonical drug code
  ndc_codes       JSONB,                           -- list of NDC codes acceptable
  
  -- Form / strength
  form            VARCHAR(50),                     -- "injection_solution", "tablet", "topical_solution"
  strength        VARCHAR(50),                     -- "0.5mg/mL", "5mg"
  package_size    VARCHAR(50),                     -- "1.5mL pen", "30 tablets"
  
  -- Categorization
  program         VARCHAR(50),                     -- "weight_loss", "ed", "hair_loss", "skincare", "diabetes_management"
  category        VARCHAR(50),                     -- "primary_treatment", "supplement", "support"
  
  -- Pharmacy routing
  available_adapters  JSONB NOT NULL,              -- ["truepill", "honeybee"]
  preferred_adapter   VARCHAR(50),                 -- routing default
  
  -- Compounding
  is_compounded   BOOLEAN NOT NULL DEFAULT FALSE,
  compounding_pharmacy_type VARCHAR(20),           -- "503A", "503B", null if branded
  
  -- Pricing per cadence (in tenant currency per CCR)
  pricing         JSONB NOT NULL,                  -- {"monthly": 199.00, "quarterly": 549.00}
  
  -- Subscription support
  subscription_eligible BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Status
  status          VARCHAR(20) NOT NULL,            -- "active", "out_of_stock", "discontinued"
  
  -- Operational
  description_patient_facing TEXT,
  description_clinical       TEXT,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7.2 Catalog management

Tenant admin via Admin Backend can:
- Add products to catalog
- Set per-cadence pricing
- Configure adapter routing
- Mark stockouts
- Discontinue products
- Bulk import from CSV (for tenant migration scenarios)

### 7.3 Cross-program products

Products like B12, multivitamin, or general support products can be assigned to multiple programs and offered as cart upsells across program intakes.

---

## 8. Subscription model (NEW in v2.0 — primarily for US tenants)

### 8.1 Subscription entity

```sql
CREATE TABLE subscriptions (
  id                  VARCHAR(26) PRIMARY KEY,
  tenant_id           VARCHAR(26) NOT NULL REFERENCES tenants(id),
  patient_id          VARCHAR(26) NOT NULL REFERENCES accounts(id),
  
  -- What is being subscribed to
  product_id          VARCHAR(26) NOT NULL REFERENCES product_catalog(id),
  prescription_id     VARCHAR(26) NOT NULL REFERENCES medication_requests(id),
  
  -- Cadence and pricing
  cadence             VARCHAR(20) NOT NULL,        -- "monthly", "quarterly", "biannual"
  unit_price          DECIMAL(10, 2) NOT NULL,
  currency            CHAR(3) NOT NULL,            -- per tenant CCR
  
  -- State machine
  status              VARCHAR(20) NOT NULL,        -- see §8.2 state machine
  
  -- Lifecycle dates
  started_at          TIMESTAMPTZ NOT NULL,
  paused_at           TIMESTAMPTZ,
  pause_until         TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  cancel_reason       VARCHAR(100),
  next_renewal_at     TIMESTAMPTZ,
  last_fulfilled_at   TIMESTAMPTZ,
  
  -- Pre-authorization (per medication class)
  preauth_window_months INTEGER NOT NULL,          -- 1, 3, or 6 typically
  preauth_renewals_remaining INTEGER NOT NULL,     -- decrements per fulfillment
  
  -- Payment
  payment_method_id   VARCHAR(100),                -- Stripe payment method ID
  
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.2 Subscription state machine

```
DRAFT ──[clinician_approval]──▶ ACTIVE ──[period_end]──▶ FULFILLING ──[completed]──▶ ACTIVE
  │                              │  │ │                                                  │
  │                              │  │ └──[pause_request]──▶ PAUSED ──[resume]────────────┘
  │                              │  │                       │
  │                              │  │                       └──[pause_expires]──▶ CANCELLED
  │                              │  │
  │                              │  └──[switch_request]──▶ SWITCHING ──[approval]──▶ ACTIVE (new product)
  │                              │
  │                              └──[cancel_request]──▶ CANCELLATION_PENDING ──[end_of_period]──▶ CANCELLED
  │
  └──[clinician_decline]──▶ DECLINED (terminal)

Additional terminal states: PAYMENT_FAILED_TERMINAL, SAFETY_HOLD (per Refill v1.0 invariant)
```

### 8.3 State definitions

| State | Description | Patient sees |
|---|---|---|
| DRAFT | Subscription intent captured at intake; awaiting clinical approval | "Your subscription is pending clinician review" |
| ACTIVE | Subscription is live; next renewal scheduled | "Active — next refill on [date]" |
| FULFILLING | Refill in progress for current period | "Your [month] refill is being prepared" |
| PAUSED | Patient-initiated pause; auto-renewal suspended | "Paused until [date]. You can resume any time." |
| SWITCHING | Switch to different product requested; awaiting clinical review | "Your switch request is pending clinician review" |
| CANCELLATION_PENDING | Cancel requested; current period continues, no renewal | "Cancelled — your final shipment is on its way" |
| CANCELLED | Terminal state; no future actions | "Cancelled. Re-enroll any time to restart." |
| DECLINED | Clinician declined initial subscription | "Your application requires further review" + clinician note |
| PAYMENT_FAILED_TERMINAL | Multiple payment failures, exceeded retry policy | "Payment couldn't be processed. Update payment method to reactivate." |
| SAFETY_HOLD | Bridge supply triggered (consent revocation on abrupt-discontinuation med) | "Your subscription is on hold. We're sending a bridge supply." |

### 8.4 Lifecycle operations

#### Pause

Patient can pause subscription for up to 90 days. UI: "Pause your subscription" → "Why are you pausing?" (multi-choice: travel, taking a break, financial, side effects, other) → "When would you like to resume?" (date picker, max 90 days out) → confirmation.

- Engine sets `status = PAUSED`, `paused_at = now()`, `pause_until = chosen_date`
- Cancels next scheduled refill if not yet FULFILLING
- If FULFILLING, current shipment completes; subsequent renewals suspended
- If patient selects "side effects" reason, engine flags for clinician follow-up via clinician portal
- At `pause_until`, engine auto-resumes (transitions to ACTIVE) UNLESS patient has explicitly cancelled or extended
- Engine sends 7-day-before-resume notification: "Your subscription resumes in 7 days. Want to extend the pause? [link]"
- Patient can resume early at any time

#### Resume

Patient explicitly resumes a paused subscription. Engine transitions to ACTIVE; schedules next renewal per cadence.

#### Switch

Patient requests product switch within program (e.g., semaglutide → tirzepatide; finasteride → topical minoxidil; tretinoin 0.025% → tretinoin 0.05%).

- UI: "Switch product" → shows compatible alternatives within current program → patient selects → captures reason for switch
- Engine creates a new prescription request and submits for clinical review (NOT auto-approved; switching requires clinician sign-off)
- Subscription transitions to SWITCHING
- Clinician reviews via clinician portal, approves or declines
- On approval: subscription transitions back to ACTIVE with new product_id, new prescription_id; current cadence preserved; new pricing applied at next renewal
- On decline: subscription returns to ACTIVE on prior product; clinician note shared with patient
- Switch reason captured for analytics (informs product roadmap, side-effect management)

#### Cancel

Patient cancels subscription. UI flow per §10 below (deflection, win-back attempts).

- On confirmation: engine transitions to CANCELLATION_PENDING
- Current period's fulfillment continues (last shipment ships)
- No future renewals
- At end of current period: transition to CANCELLED
- Patient receives "We're sorry to see you go" confirmation with re-enrollment link
- Cancel reason captured for analytics

#### Renewal

At `next_renewal_at`, engine triggers refill workflow per §9. Refill flow validates eligibility (interaction engine, consent, pre-auth window, payment method valid). If valid, transitions to FULFILLING.

If pre-authorization window expires (`preauth_renewals_remaining = 0`), engine routes refill through clinician review path before fulfillment. Patient sees: "Time for your routine clinician check-in. We'll review your medication and confirm everything's still working well for you."

#### Payment failure

If payment fails at renewal:
- Day 0: charge attempt fails; subscription remains ACTIVE; retry scheduled for Day 3
- Day 3: retry; if fails, subscription enters DUNNING state (not a separate state — overlay on ACTIVE); patient notified to update payment method
- Day 7: retry; if fails, refill held; patient notified more urgently
- Day 14: retry; if fails, subscription transitions to PAYMENT_FAILED_TERMINAL
- Patient can re-enter payment method at any time during dunning to recover

### 8.5 Subscription audit

Every state transition is audited per AUDIT-EVENTS Category C (operational), with subscription-affecting clinical events (switch approval, SAFETY_HOLD trigger) audited as Category A (clinical).

---

## 9. Refill workflow (preserved from v1.0; subscription-aware)

The v1.0 refill state machine is preserved. v2.0 additions:

### 9.1 Refill initiation paths

- **Patient-initiated** (existing): patient requests refill via app
- **Subscription auto-initiated** (NEW): subscription engine auto-creates refill at renewal
- **AI Mode 1-initiated** (existing): patient requests via chat; Mode 1 hands off to refill workflow
- **Delegate-initiated** (existing): per delegation scope
- **Clinician-initiated** (existing): clinician triggers from portal

### 9.2 Refill state machine (preserved from v1.0; subscription linkage added)

States from v1.0 §10:

```
INITIATED → VERIFYING → ELIGIBLE → CHECKING → REVIEW_QUEUE → APPROVED → PHARMACY_QUEUED → FULFILLING → RELEASE_CHECK → RELEASED → DISPATCHED → IN_TRANSIT → DELIVERED → COMPLETED

Plus: INELIGIBLE, DECLINED, PROTOCOL_EVALUATING, PROTOCOL_APPROVED, PROTOCOL_FALLBACK, PICKUP_AVAILABLE, PICKED_UP, PICKUP_EXPIRED, DELIVERY_FAILED, SAFETY_HOLD
```

v2.0 additions to state-transition logic:
- A refill belonging to a subscription updates the subscription's `last_fulfilled_at` on COMPLETED
- A refill that fails (SAFETY_HOLD, INELIGIBLE, DECLINED) triggers subscription lifecycle handling (pause, escalate to clinician, etc.)
- Patient-facing copy distinguishes between "your refill is in progress" (single refill) and "your subscription refill is in progress" (subscription context) where helpful

### 9.3 Pre-authorization windows (preserved from v1.0; medication-class table)

Per v1.0 §6.5 and Master PRD §11.2 #X. Pre-auth window per medication class:

| Class | Pre-auth window |
|---|---|
| Stable chronic medications (statins, antihypertensives, oral diabetics) | 6 months |
| GLP-1 (semaglutide, tirzepatide) | 3 months |
| ED medications | 6 months |
| Hair loss (oral finasteride) | 6 months |
| Topical Rx (tretinoin, etc.) | 6 months |
| New medications (first 90 days) | 1 month |
| Controlled substances (Schedule III–V) | Per state requirements; typically 1 month |
| Schedule II controlled substances | NOT IN SCOPE at launch |

Pre-auth window decrements with each fulfillment. When `preauth_renewals_remaining = 0`, refill routes through clinician review regardless of subscription status.

### 9.4 Interaction engine gate (preserved from v1.0)

Every refill (including subscription auto-renewals) passes through the medication interaction engine. SAFETY_HOLD on detected critical signals.

### 9.5 Bridge supply on consent revocation (preserved from v1.0; ADR-008)

Per ADR-008. When a patient revokes the consent required for refill processing, and their medication is in the abrupt-discontinuation-risk class, a bridge supply is dispensed and the subscription transitions to SAFETY_HOLD. Bridge supply quantity per medication class per Protocol Library Ghana / equivalent US protocol library.

---

## 10. Cancellation deflection (NEW in v2.0)

Cancellation is the highest-revenue-impact moment. v2.0 implements graceful deflection without coercion.

### 10.1 Cancel flow

Patient initiates cancel → engine presents deflection options based on captured reason:

**If reason = side effects:**
- "Many side effects improve with adjustment. Would you like to talk to a clinician about lowering your dose or trying a different medication?" → routes to consult or switch
- "If you'd still like to cancel, that's fine. We're here when you're ready."

**If reason = financial:**
- "Would a quarterly billing cycle help? [show quarterly pricing vs monthly]"
- "Would you like to pause for 90 days instead of cancelling?"
- "If you'd still like to cancel, that's fine."

**If reason = not seeing results:**
- "Results often take longer than expected. Would you like to talk to a clinician about adjustments or expectations?" → routes to consult
- "If you'd still like to cancel, that's fine."

**If reason = other / personal / no longer needed:**
- "Got it. Would you like to pause instead so you can resume easily later?"
- "If you'd still like to cancel, that's fine."

### 10.2 Anti-coercion rules

Per Master PRD §17 Honest Status and §18 (in v2.0):

- Maximum two deflection screens before unconditional cancel option
- "Cancel anyway" must be visually equivalent to "Try the alternative" (no dark patterns making cancel hard to find)
- Pause / switch offers must be honest (e.g., don't offer 90-day pause if subscription has zero history of pause-resume retention)
- No fake urgency ("This offer expires in 24 hours")
- No false scarcity
- No required reason: patient can decline to give reason and proceed to cancel

### 10.3 Successful deflections audit

Every deflection attempt and outcome captured for analytics. Tenant admin sees deflection rate, outcome distribution (cancel vs pause vs switch vs consult). Used to refine offers and copy.

---

## 11. Multi-product cart (NEW in v2.0)

For programs that support multiple products in a single intake/checkout (e.g., GLP-1 + B12 + anti-nausea support; ED medication + multivitamin):

### 11.1 Cart model

Each cart is tenant-scoped, patient-scoped, intake-scoped. Holds 1+ products with quantities and subscription cadence preferences.

```sql
CREATE TABLE carts (
  id              VARCHAR(26) PRIMARY KEY,
  tenant_id       VARCHAR(26) NOT NULL REFERENCES tenants(id),
  patient_id      VARCHAR(26) NOT NULL REFERENCES accounts(id),
  intake_submission_id VARCHAR(26),                -- nullable; cart can be standalone
  
  status          VARCHAR(20) NOT NULL,            -- "open", "checked_out", "abandoned", "expired"
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ
);

CREATE TABLE cart_items (
  id              VARCHAR(26) PRIMARY KEY,
  tenant_id       VARCHAR(26) NOT NULL REFERENCES tenants(id),
  cart_id         VARCHAR(26) NOT NULL REFERENCES carts(id),
  product_id      VARCHAR(26) NOT NULL REFERENCES product_catalog(id),
  
  quantity        INTEGER NOT NULL DEFAULT 1,
  cadence         VARCHAR(20),                     -- "monthly", "quarterly", "one_time"
  unit_price      DECIMAL(10, 2) NOT NULL,         -- snapshot at add-to-cart
  
  added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_at      TIMESTAMPTZ
);
```

### 11.2 Cart workflow

- Patient adds products during intake (per Forms Engine v2.1 cart upsell elements) or via product catalog browse
- Cart persists with intake (resume-aware)
- At checkout: each cart item evaluated for clinical eligibility independently
  - Rx-only products require clinician review
  - OTC products (e.g., B12) checkout immediately if pharmacy adapter supports
  - Some upsells may be ineligible (e.g., contraindication detected); patient notified
- Approved cart items become Subscriptions (if subscription cadence) or one-time Refills
- Each item has independent pharmacy adapter routing per product configuration

### 11.3 Cart pricing display

Cart shows itemized pricing with subscription savings, total monthly cost, total annual cost. Honest pricing (no hidden fees). Tax displayed where applicable per CCR.

### 11.4 Cart abandonment

If cart has Rx items not yet approved by clinician within 7 days, cart expires (configurable per tenant). If cart contains only OTC items, cart can persist indefinitely (configurable per tenant).

---

## 12. Shipment tracking (NEW explicit in v2.0)

Patient sees shipment status from pharmacy through last-mile:

| State | Patient sees |
|---|---|
| FULFILLING | "Your medication is being prepared at the pharmacy" |
| RELEASE_CHECK | "Pharmacist is performing final review" |
| RELEASED | "Released to delivery partner" |
| DISPATCHED | "Picked up by delivery partner — [carrier]" |
| IN_TRANSIT (with tracking number) | "On its way — track with [carrier link]" |
| OUT_FOR_DELIVERY (where carrier reports) | "Out for delivery today" |
| DELIVERED | "Delivered" + delivery details |
| DELIVERY_FAILED | "We couldn't deliver — [reason]. We'll try again [date] or you can pick up at [location]" |

Tracking numbers passed through from pharmacy adapter to patient. Carrier links generated per carrier (UPS, USPS, FedEx, DHL Ghana, etc.).

### 12.1 Carrier integration

Pharmacy adapter receives tracking number from carrier; passes to platform via webhook. Platform updates Shipment entity. Patient notification triggered per Notification Spec.

For Ghana with motorbike-based last-mile delivery (no formal tracking number), the pharmacy adapter provides estimated delivery window and a contact number. Patient sees: "Delivery scheduled for today between [start]–[end]. Driver: [name], [phone]."

---

## 13. Inventory awareness (NEW in v2.0)

Pharmacy adapter reports inventory availability per medication SKU per fulfillment center. Refill flow checks inventory before queueing fulfillment.

### 13.1 In-stock path

Standard refill flow proceeds.

### 13.2 Out-of-stock path

If primary adapter reports out-of-stock:
- Engine tries alternate adapters per tenant routing rules
- If all adapters out-of-stock, refill enters STOCKOUT state (not in v1.0; new in v2.0)
- Tenant Operator notified
- Patient notified honestly: "Your medication is temporarily unavailable. We're working on it. Estimated availability: [date]"
- For subscription contexts: subscription auto-pauses (engine sets `status = PAUSED`, `pause_until = estimated_restock`); resume on inventory return
- For one-time refill: patient choice — wait for restock or cancel order

### 13.3 Inventory display in catalog

Tenant admin sees per-product inventory status across active adapters in product catalog UI. Out-of-stock products auto-flagged for patient-facing display ("Currently unavailable") in any new intake.

---

## 14. Compounding-aware extension points (NEW in v2.0)

For US tenants offering compounded medications (e.g., compounded GLP-1 from 503A or 503B pharmacy):

- ProductCatalog `is_compounded = true` and `compounding_pharmacy_type = "503A" | "503B"`
- PharmacyProvider adapter knows whether it can fulfill compounded prescriptions
- Routing logic prefers compounding-capable adapters for compounded products
- Regulatory module (US) gates compounded medication offerability per state restrictions
- Audit envelope captures compounding type for traceability

Compounding pharmacy partnerships are tenant-level operational decisions; the platform supports the workflow.

---

## 15. Pharmacy partner workflow (preserved from v1.0 Pharmacy Portal Slice; consolidated here)

The Pharmacy Portal Slice v1.0 §3-§6 are preserved as the pharmacy-side workflow:

### 15.1 Receive prescription

Pharmacy adapter receives the prescription via API call. Adapter is responsible for translating Telecheck's standard prescription format into the partner pharmacy's expected format.

### 15.2 Pick, label, package

Pharmacy partner's internal workflow. Adapter receives status updates via webhook.

### 15.3 Pharmacist release check

Pharmacist performs final clinical review. May approve, hold (request clarification), or decline. Per ADR-006, the interaction engine has already run pre-prescribe; pharmacist release check is the second clinical safety gate.

### 15.4 Release to delivery

On approval: prescription released to delivery partner integrated with the pharmacy adapter.

### 15.5 Last-mile delivery

Delivery partner's workflow. Tracking updates flow back through pharmacy adapter webhook.

### 15.6 Delivery confirmation

Patient confirms receipt (or delivery partner confirms). Subscription's `last_fulfilled_at` updated.

---

## 16. Per-tenant configuration surfaces

Tenant admin via Admin Backend Slice v1.0 manages:

- Product catalog (add, edit, mark stockouts, discontinue)
- Pricing per product per cadence
- Pharmacy adapter selection and routing rules
- Refill cadence per medication class (overrides platform defaults where configurable)
- Cancellation deflection copy (variants, tone)
- Subscription pause maximum (default 90 days; tenant can shorten)
- Cart configuration (which programs allow multi-product cart; which products are valid upsells)
- Shipment notification copy

Tenant Clinical Lead approval required for any change affecting clinical pathway (medication-class refill cadence, interaction engine sensitivity, pre-auth window).

---

## 17. Per-tenant analytics (in Admin Backend)

Tenant admin sees:

### 17.1 Subscription metrics

- Active subscribers (current count)
- New subscriptions per period
- Cancellations per period (with reason distribution)
- Pause rate; resume-from-pause rate
- Switch rate; switch reason distribution
- Average subscription LTV
- Net subscriber growth
- Churn rate (monthly, 90-day, annualized)

### 17.2 Refill metrics

- Refill volume per period
- Time-to-fulfill (median, p90, p99)
- Approval rate (clinician-review pathway)
- Decline rate with reason
- Stockout rate
- Delivery success rate
- Patient-reported issues per refill

### 17.3 Revenue metrics

- Subscription revenue (recurring)
- One-time refill revenue
- Cart upsell take rate; revenue contribution
- Refunds (volume, dollar amount, reasons)

### 17.4 Cohort retention

- Subscription retention by signup cohort (week, month, quarter)
- LTV per cohort
- Cancellation-by-month-of-tenure curve

---

## 18. Performance targets

| Metric | Target |
|---|---|
| Refill initiation to interaction engine result | < 2 seconds (per v1.0) |
| Subscription auto-renewal time-to-pharmacy-queue | < 5 minutes from `next_renewal_at` |
| Pause request to confirmation | < 1 second (synchronous) |
| Switch request to clinician review queue | < 2 seconds (synchronous) |
| Shipment status update propagation (carrier → patient app) | < 5 minutes from carrier event |
| Cart save and resume | < 2 seconds per Forms Engine target |
| Subscription LTV at 12 months (US tenants — informational benchmark) | tenant-specific; tracked but not platform target |

---

## 19. Open questions (slice-level)

1. **Switch cadence locking** — when patient switches products, does subscription cadence reset to monthly (caution period) or preserve original cadence? Default proposal: preserve original; tenant can override.
2. **Multi-program subscription bundling** — patient on GLP-1 also wants ED program. Two separate subscriptions, or unified? Default proposal: separate (independent clinical pathways, independent products); platform may show consolidated view in patient app.
3. **Compounding pharmacy onboarding** — what's the operational process for adding a new compounding pharmacy partner? Out of v2.0 scope; documented in operational runbook (OR-256).
4. **Subscription gifting** — can a patient gift a subscription to another person? Out of scope at launch.
5. **B2B subscription channels** — tenant-employer relationships (e.g., employer pays for employees' weight management). Out of scope at launch.
6. **Pharmacy switching mid-subscription** — if a tenant changes preferred adapter mid-subscription for a patient (e.g., due to inventory or partnership changes), what's the patient-facing handling? Default proposal: transparent, with notification "Your medication will now ship from [new pharmacy partner]"; clinical continuity preserved (same prescription, same medication).

---

## 20. Dependencies (v2.0 additions)

- **Identity & Authentication Spec v1.0** multi-tenant adapted
- **Consent & Delegated Access Slice v1.0**
- **Medication Interaction & Validation Engine Slice v1.0**
- **Forms/Intake Engine Slice v2.0** — subscription handoff source
- **Admin Backend Slice v1.0** — product catalog, pricing, adapter management, analytics
- **Payment & Billing Spec v1.0** — payment processor integration (Stripe US, Paystack Ghana per ADR-024); subscription billing mechanics
- **AI Clinical Assistant Slice v1.0** — Mode 1 refill initiation; Mode 2 case prep for switches and exceptions
- **Notification Spec v1.1** — refill status, shipment tracking, subscription lifecycle, payment failure, deflection touchpoints
- **Labs Slice v1.0** — required monitoring labs gate refill eligibility
- **RPM/CCM Slice v1.0** — adherence tracking via refill timing
- **Contracts Pack v5 — IDEMPOTENCY** — refill operations idempotent
- **Contracts Pack v5 — DOMAIN-EVENTS** — subscription, refill events emitted per envelope
- **Pharmacy adapter implementations** (Truepill, Honeybee, Capsule, Alto, Ghana partner pharmacies) — engineering deliverables per OR-244
- **PostHog (self-hosted)** per ADR-022 — analytics, A/B testing of cancellation deflection

---

## 21. Refill v1.0 carried-forward content (per HIGH-07 remediation)

Per Adversarial Counsel Review v1.0 finding HIGH-07, v2.0's "preserved from v1.0" references are insufficient — the actual content must be present in this consolidated document, not just referenced. This section carries forward the Refill Slice PRD v1.0 sections that govern clinical-safety details, interaction engine integration, consent and delegation handling, pre-authorization windows, error handling taxonomy, full state-by-state copy, adherence tracking, audit specifics, and metrics.

The earlier sections of this document (§7 Product catalog, §8 Subscription model, §9 Refill workflow, §10 Cancellation deflection, §11 Multi-product cart) extend this content; they do not replace it.

## 3. Core design principles

**The AI does not approve refills.** The AI Clinical Assistant (Mode 1) can help a patient initiate a refill request, pre-fill the medication, and explain the process. It does not evaluate, approve, or execute refills. Refill approval is always a clinician action or a protocol-authorized action — never an AI conversational action.

**Every refill passes through the Medication Interaction & Validation Engine.** No refill reaches the pharmacy without an interaction check against the patient's full active medication list. This is non-negotiable and cannot be configured away.

**Status is honest.** At every step, the patient sees truthful status. "Being reviewed" means a clinician is reviewing, not "it's in a queue." "Approved" means approved. "Your medication is on its way" means the delivery rider has the package, not "we've queued it for delivery."

**Protocol-authorized renewal is a privilege, not a default.** At launch, every refill requires clinician review. Protocol-authorized refill renewal activates per medication class only after governance approval, and only within narrowly defined protocol boundaries.

---

## 4. Actors

| Actor | Role in this workflow |
|---|---|
| **Patient** | Initiates the refill request. Sees status at every step. Confirms receipt. |
| **Delegate** | May initiate a refill on behalf of a patient if granted appropriate scope. Delegate context is visible throughout. |
| **Clinician** | Reviews and approves refills (default pathway). Sees interaction engine signals, herb–drug signals, patient history, and adherence data. |
| **Protocol engine** | Evaluates and executes refills when protocol-authorized pathway is activated for this medication class. |
| **Pharmacist** | Receives approved refills. Fulfills, performs clinical release check, coordinates delivery. (See Pharmacy Portal Slice.) |
| **AI Clinical Assistant (Mode 1)** | Helps patient initiate refills. Does not approve. |
| **Medication Interaction & Validation Engine** | Runs all five check classes against the patient's medication list before approval. Gate for protocol-authorized execution. |
| **Herb–Drug Interaction Engine** | Runs herb–drug checks if the patient has reported herbal medicines. Signals are additive to medication engine signals. |

---

## 5. Refill workflow

### 5.1 Clinician-review pathway (default at launch)

This is the default refill pathway for all medications at launch. Every refill requires clinician review until a protocol-authorized pathway is activated for the specific medication class.

**Step 1 — Patient initiates.** The patient requests a refill from the medication detail page, the pharmacy tab, or through the AI Clinical Assistant (Mode 1). The request identifies the medication by name, strength, and formulation. If initiated via Mode 1, the assistant pre-fills the request from the patient's active medication list.

**Step 2 — Identity and consent verification.** The system verifies: patient identity (authenticated session; see Identity & Authentication Spec v1.0), active care consent covering this medication's program, and jurisdiction compliance. If a delegate initiated, delegate scope is verified and delegate context is attached to the request.

**Step 3 — Eligibility check.** The system checks: medication is on the patient's active list and not discontinued, the refill is within the pre-authorization window (3–6 months, configurable per program), required monitoring inputs (labs, vitals) are current within protocol thresholds, and no SAFETY_HOLD state is active on this medication.

If eligibility fails, the patient receives a clear explanation: "This refill cannot be processed because [reason]. [Next step — book a consult / upload required labs / contact your care team]." The request does not proceed to clinician review.

**Step 4 — Interaction engine check.** The Medication Interaction & Validation Engine runs all five check classes against the patient's full active medication list, including the refill medication. The Herb–Drug Interaction Engine runs if the patient has reported herbal medicines. All signals are attached to the refill request for clinician review.

This step runs before the clinician sees the refill — the clinician receives the request with signals already evaluated, not raw.

**Step 5 — Clinician review.** The clinician sees the refill request in their review queue with: patient summary, medication details, interaction engine signals (ordered by severity), herb–drug signals, adherence history (refill frequency, missed refills), recent lab values relevant to this medication, and any special flags.

The clinician takes one of three actions:
- **Approve** — the refill proceeds to pharmacy. Audited as clinician-approved with clinician identity and timestamp.
- **Approve with modification** — the clinician adjusts the dose, quantity, or adds instructions. The modification is audited.
- **Decline** — the clinician declines with a reason. The patient is notified with the reason and the recommended next step (book a consult, get updated labs, etc.).

**Step 6 — Pharmacy handoff.** The approved refill enters the pharmacy queue per the Pharmacy Portal Slice. The pharmacy receives the medication details, dosing instructions, interaction signals, approval pathway, and delivery preference.

**Step 7 — Fulfillment and delivery.** The pharmacy fulfills the order (pick, label, package), performs the clinical release check, and routes to delivery or pickup. Patient tracking is active from this point. (See Pharmacy Portal Slice §5–6.)

### 5.2 Protocol-authorized pathway (built at launch, activated later)

Protocol-authorized refill renewal allows the platform to process a refill without per-instance clinician review, within narrowly defined protocol boundaries. This pathway is built and testable at launch but activates per medication class only after governance approval.

**When it activates:**
- The medication class has been approved for protocol-authorized renewal by the Clinical Governance Lead and relevant regulatory body (Ghana MDC / Pharmacy Council for Ghana launch)
- An approved protocol version is active, versioned, and has a named accountable clinician
- The protocol is deployed through the admin protocol activation and governance surface

**How it works:**

Patient initiates → identity and consent verification → eligibility check → interaction engine check (all five classes) → herb–drug engine check → protocol evaluation:

- **All checks pass:** protocol executes the refill renewal. The refill proceeds to pharmacy. Audited as protocol-authorized with protocol version, engine version, all signal results, and accountable clinician.
- **Critical or major interaction signal:** protocol cannot execute. Falls back to clinician review with signals attached.
- **Eligibility fails:** protocol cannot execute. Falls back to clinician review or patient notification depending on failure type.
- **Required monitoring inputs stale:** protocol cannot execute. Patient is notified to update labs or vitals.
- **Any uncertainty or edge case:** protocol falls back to clinician review. The protocol never guesses.

**Patient-facing distinction (per Flagged Items Resolution §9):**

When the patient's refill is protocol-approved: "Your refill has been approved under your [Program Name] care program. Your care team oversees this process."

When the patient's refill is clinician-approved: "Your refill has been reviewed and approved by Dr. [Name]."

When the protocol declines and falls back to clinician review: "Your refill could not be approved automatically. It has been sent to your doctor for review."

The patient can tap to learn more about program-approved refills: "For medications you take regularly as part of your [Program Name] program, Telecheck can approve refills automatically when all safety checks pass. Your care team sets up and oversees this process."

---

## 6. Interaction engine integration

The Medication Interaction & Validation Engine is the refill workflow's primary safety gate. No refill proceeds without an engine evaluation.

### 6.1 What is checked

At Step 4, the engine runs all five check classes:

1. **Drug–drug interactions.** The refill medication against every other active medication.
2. **Drug–condition conflicts.** The refill medication against the patient's known conditions.
3. **Drug–lab conflicts.** The refill medication against the patient's most recent relevant lab values.
4. **Pharmacogenomic concerns.** Reference data at launch; real PGx data post-launch.
5. **Special clinical flags.** Marrow suppression risk, hemoglobinopathy-aware dosing, pregnancy/lactation, pediatric, geriatric, polypharmacy (≥5 active medications).

If the patient has reported herbal medicines, the Herb–Drug Interaction Engine also runs its three check classes (pharmacokinetic, pharmacodynamic, herb–condition).

### 6.2 How signals affect the workflow

**Critical signal:** Refill cannot be protocol-authorized. In clinician-review pathway, the signal is prominently flagged. Clinician may still approve with documented override rationale.

**Major signal:** Refill cannot be protocol-authorized unless the specific signal class is explicitly addressed in the approved protocol. Clinician sees the signal with recommended action.

**Moderate signal:** Visible to clinician and pharmacist. Logged. Does not block protocol authorization.

**Minor signal:** Visible to clinician. Logged. Does not block.

### 6.3 Override handling

If a clinician overrides a critical or major signal to approve the refill, the override is audited with: clinician identity, signal ID, engine version, rationale text, and timestamp. Overrides feed the adverse event reporting feedback loop — if the patient later experiences an adverse event correlated with the overridden signal, the system connects the override to the outcome.

---

## 7. Consent and delegation

### 7.1 Consent requirements

A refill request requires active care consent covering the medication's program. Care consent includes acknowledgment of protocolized actions (§15 of Master PRD), which covers protocol-authorized refill renewal once activated.

If care consent has been revoked: the refill cannot proceed. If consent was revoked for a medication in an abrupt-discontinuation category, the SAFETY_HOLD state activates with a bridge supply (ADR-008).

### 7.2 Delegation

A delegate can initiate a refill on behalf of a patient if they hold the appropriate delegation scope. The delegate cannot override interaction signals, modify clinical information, or consent to care changes. All delegate-initiated refills are logged with the delegate's identity and the target patient's identity.

### 7.3 Bridge supply on consent revocation

For medications where abrupt discontinuation poses a safety risk (insulin, anticoagulants, anticonvulsants, beta-blockers, corticosteroids, SSRIs/SNRIs, opioids under clinical management), consent revocation triggers a SAFETY_HOLD state:

- The system identifies the medication as abrupt-discontinuation risk
- A bridge supply is authorized (sufficient for a safe taper period, determined per medication class)
- The clinician is notified immediately
- The patient sees: "Your consent has been recorded. For safety, your care team will provide a bridge supply of [medication] to allow safe discontinuation. Your doctor will contact you about next steps."
- The bridge supply follows the standard pharmacy fulfillment workflow
- Once the bridge supply is dispensed, the SAFETY_HOLD resolves

---

## 8. Refill timing and pre-authorization

### 8.1 Pre-authorization window

Each refill exists within a pre-authorization window — the period during which the patient can request a refill without a new prescription. Pre-authorization windows are configurable per program and medication class:

- Chronic medications (stable dose, ongoing therapy): 6 months
- Managed program medications (GLP-1, ED): 3 months
- New prescriptions (first 3 months of therapy): clinician review on every refill regardless of window

At window expiry, the patient cannot refill without a new clinician review or consultation. The system notifies the patient in advance: "Your pre-authorization for [medication] expires on [date]. You'll need a check-in with your doctor before your next refill."

### 8.2 Refill reminder timing

Refill reminders are sent when the patient's current supply is estimated to be running low, based on: fill date, quantity dispensed, and dosing frequency. Reminder timing:

- 7 days before estimated depletion: "Your [medication] supply is running low. Refill now?"
- 3 days before: follow-up if not refilled
- On estimated depletion day: "Your [medication] may have run out. Refill now to avoid a gap."
- No further reminders after depletion — the system does not nag indefinitely

Reminders are sent via WhatsApp (primary) with SMS fallback, per the notification architecture.

---

## 9. Error and exception handling

### 9.1 Interaction engine unavailable

If the interaction engine is unavailable at Step 4, the refill cannot proceed. The request is held and retried when the engine is available. If the hold exceeds a defined timeout (recommend 2 hours), the request routes to clinician review with a "safety check incomplete" flag. The clinician can approve, decline, or hold further.

The patient sees: "We're running a safety check on your medications. This is taking longer than usual — we'll notify you as soon as it's complete."

### 9.2 Clinician review timeout

If a clinician review exceeds the target SLA (4 hours for standard refills, 24 hours for non-urgent), the system escalates to the next available clinician and flags the delay in the operations dashboard.

### 9.3 Eligibility failure

If eligibility fails at Step 3, the patient receives a specific, actionable explanation:

- Medication discontinued: "This medication is no longer active on your profile. Contact your care team."
- Pre-authorization expired: "Your refill window for [medication] has expired. Book a check-in with your doctor to renew."
- Required labs overdue: "Your doctor needs updated lab results before refilling this medication. Upload your latest labs or book a consult."
- SAFETY_HOLD active: "This medication is currently on hold. Your care team is managing this — please contact them for next steps."

### 9.4 Delivery failure

If delivery fails, the order reverts to pickup-available status. The patient is notified: "We couldn't deliver your medication. It's available for pickup at [pharmacy name and address]." The medication is returned to the pharmacy and held for pickup per Pharmacy Portal Slice §6.2.

### 9.5 Payment failure

If payment fails at the configured collection point, the refill is held. The patient is notified with the failure reason and instructions to update payment method. Fulfillment does not proceed until payment is resolved. For time-sensitive medications, the system flags the payment failure as urgent to the operations team.

---

## 10. States and transitions

| State | Description | Next state |
|---|---|---|
| **Initiated** | Patient (or delegate) has requested a refill | Verifying |
| **Verifying** | Identity, consent, and eligibility checks running | Eligible / Ineligible |
| **Ineligible** | Eligibility check failed | — (patient notified with reason) |
| **Eligible** | Passed eligibility; interaction engine check running | Checking |
| **Checking** | Interaction engine and herb–drug engine evaluating | Reviewed Queue / Protocol Evaluating |
| **Review Queue** | Awaiting clinician review (clinician-review pathway) | Approved / Declined |
| **Protocol Evaluating** | Protocol engine evaluating (protocol-authorized pathway) | Protocol Approved / Protocol Fallback |
| **Protocol Approved** | Protocol authorized the refill | Pharmacy Queued |
| **Protocol Fallback** | Protocol could not authorize; falls back to clinician review | Review Queue |
| **Approved** | Clinician approved the refill | Pharmacy Queued |
| **Declined** | Clinician declined the refill | — (patient notified with reason) |
| **Pharmacy Queued** | Approved refill sent to pharmacy | (See Pharmacy Portal states) |
| **Fulfilling** | Pharmacy is picking, labeling, packaging | Release Check |
| **Release Check** | Pharmacist performing clinical release check | Released / Held |
| **Released** | Medication cleared for delivery or pickup | Dispatched / Pickup Available |
| **Dispatched** | Handed off to delivery partner | In Transit |
| **In Transit** | Delivery partner transporting | Delivered / Delivery Failed |
| **Delivered** | Patient received medication | Completed |
| **Delivery Failed** | Delivery unsuccessful | Pickup Available |
| **Pickup Available** | Ready at pharmacy for patient pickup | Picked Up / Pickup Expired |
| **Picked Up** | Patient collected from pharmacy | Completed |
| **Completed** | Refill cycle done | — |
| **SAFETY_HOLD** | Bridge supply triggered by consent revocation for abrupt-discontinuation medication | Bridge Supply Dispensed → Completed |

Every state transition is timestamped, logged with actor identity, and visible to the patient in real time.

### 10.1 Patient-facing status language

The patient sees honest, specific language at every state — never vague or misleading:

| State | Patient sees |
|---|---|
| Initiated | "Your refill request has been submitted." |
| Verifying | "We're verifying your information..." |
| Ineligible | "[Specific reason — see §9.3 for each case]" |
| Eligible / Checking | "Running a safety check on your medications..." |
| Review Queue | "Your refill is being reviewed by your doctor." |
| Protocol Evaluating | "Your refill is being processed under your care program." |
| Protocol Approved | "Your refill has been approved under your [Program Name] care program." |
| Protocol Fallback | "Your refill has been sent to your doctor for review." |
| Approved | "Your refill has been reviewed and approved by Dr. [Name]." |
| Declined | "Your doctor was not able to approve this refill. [Reason]. [Next step]." |
| Pharmacy Queued | "Your medication is being prepared by the pharmacy." |
| Fulfilling | "Your medication is being prepared." |
| Release Check | "Your medication is being checked by the pharmacist." |
| Released | "Your medication is ready." |
| Dispatched | "Your medication is on its way!" |
| In Transit | "Your medication is being delivered. Track delivery →" |
| Delivered | "Your medication has been delivered." |
| Delivery Failed | "We couldn't deliver your medication. It's available for pickup at [pharmacy]." |
| Pickup Available | "Your medication is ready for pickup at [pharmacy name, address]." |
| Completed | "Refill complete." |
| SAFETY_HOLD | "Your care team is managing a change to this medication. They'll be in touch." |

### 10.2 Medication-class-specific behavior

| Medication class | Pre-auth window | Required monitoring | Protocol-authorized eligible | Special handling |
|---|---|---|---|---|
| Metformin (diabetes) | 6 months | Renal function (creatinine/GFR) every 6 months | Yes (post-governance activation) | Drug-lab check for renal function at every refill |
| Antihypertensives (amlodipine, lisinopril) | 6 months | Blood pressure log (RPM) | Yes | ACE inhibitor + potassium supplement interaction flag |
| Statins (atorvastatin) | 6 months | Liver function (LFTs) every 12 months | Yes | CYP3A4 interaction sensitivity |
| GLP-1 agonists | 3 months | Weight, HbA1c every 3 months | Post-launch (90-day track record) | Managed program — higher monitoring requirements |
| ED medications (sildenafil, tadalafil) | 3 months | Blood pressure, cardiac screening at enrollment | Post-launch | Nitrate interaction is a critical-severity signal |
| Insulin | 6 months | Blood glucose log (RPM), HbA1c every 3 months | Post-launch | Abrupt-discontinuation category; bridge supply on consent revocation |
| Anticoagulants (warfarin) | 3 months | INR every 2–4 weeks | Post-launch (complex monitoring) | Abrupt-discontinuation category; high drug-drug interaction sensitivity |

### 10.3 Additional edge cases

**Multiple concurrent refills.** A patient on 5 medications may initiate refills for all simultaneously. Each refill follows its own workflow independently. The interaction engine evaluates the full medication list once and attaches relevant signals to each refill — it does not re-evaluate per refill.

**Refill during active consult.** If a patient has an active consultation and also requests a refill, both workflows proceed independently. The clinician reviewing the refill can see the active consult in the patient's context.

**Medication dose change between refills.** If a clinician changes the dose of a medication during a consult, the existing pre-authorization window resets. The next refill uses the new dose, and the first refill at the new dose always requires clinician review (regardless of protocol-authorized eligibility).

**Formulary change.** If a medication is removed from the formulary between refills, the refill fails eligibility with: "This medication is no longer available through Telecheck. Please contact your care team for alternatives."

---

## 11. Adherence tracking

The refill workflow feeds adherence data to the platform:

**Refill adherence rate:** (refills completed on time) / (refills expected based on dosing schedule), calculated per medication and per patient.

**Adherence signals:**
- On-time refill: patient refills within the expected window — adherence is healthy
- Late refill: patient refills after the expected window — mild adherence concern
- Missed refill: patient does not refill within a defined overdue period — adherence concern, clinician alert generated
- Abandoned refill: patient initiates but does not complete — tracked for friction analysis

Adherence data is visible to the clinician in the refill review queue, the RPM/CCM dashboard, and the AI Clinical Assistant's patient context. The AI Clinical Assistant (Mode 1) may surface adherence concerns conversationally: "I notice you haven't refilled your blood pressure medication recently. Would you like to refill now?"

---

## 12. Audit

Every refill action is audited:

| Event | What is recorded |
|---|---|
| Refill initiated | Patient/delegate ID, medication, initiation source (app, AI chat), timestamp |
| Identity/consent verified | Verification result, consent version, delegate context if applicable |
| Eligibility checked | Check results (pass/fail per criterion), timestamp |
| Interaction engine run | Engine version, all signals produced (all five check classes), signal IDs, timestamp |
| Herb–drug engine run | Engine version, all signals produced, timestamp |
| Clinician review | Clinician ID, decision (approve/modify/decline), signal overrides with rationale, timestamp |
| Protocol evaluation | Protocol version, evaluation results, gate check outcomes, accountable clinician, timestamp |
| Pharmacy handoff | Pharmacy ID (platform or partner), routing decision, timestamp |
| Fulfillment | Pharmacist/technician ID, stock unit, batch number, release decision, timestamp |
| Delivery/pickup | Delivery partner, proof of delivery, timestamp |
| SAFETY_HOLD triggered | Medication, reason (consent revocation), bridge supply authorized, clinician notified, timestamp |

Audit records are retained per Contracts Pack v5 retention rules. Refill audit is clinical decision support and retained at the strictest applicable requirement.

---

## 13. Metrics

**Throughput**
- Refill completion rate (initiated → completed) — headline launch metric #1
- Time-to-clinician-decision (review queue → clinician action) — headline launch metric #2
- End-to-end refill time (initiated → delivered/picked up)
- Protocol-authorized refill rate vs clinician-reviewed rate (when activated)

**Safety**
- Interaction engine signal rate per refill (by severity)
- Signal override rate (clinician overrides of critical/major signals)
- Protocol fallback rate (protocol could not authorize, fell back to clinician)
- SAFETY_HOLD activation rate
- Adverse events correlated with refill medications

**Adherence**
- Refill adherence rate per patient, per medication, per program
- Late refill rate
- Missed refill rate
- Abandoned refill rate (initiated but not completed — friction signal)

**Operations**
- Eligibility failure rate by reason
- Payment failure rate
- Delivery failure rate
- Clinician review SLA adherence (% of reviews within target time)

---

## 14. Dependencies (v1.0 carried-forward — Refill Slice PRD v1.0 §14)

> **Note:** This section is preserved verbatim from Refill Slice PRD v1.0 §14 per HIGH-07 carry-forward remediation. The v2.0 (current canonical) consolidated dependencies list lives in §20 above. Both are retained intentionally — §20 reflects the consolidated Pharmacy + Refill v2.X scope; §14 here preserves the original Refill v1.0 dependency context for traceability and is not a duplicate to be deleted.

- **Identity & Authentication Spec v1.0.** Authenticated patient, clinician, pharmacist, moderator, admin, and delegate sessions are required for every actor surface this slice uses.
- **Medication Interaction & Validation Engine Slice.** Every refill passes through the engine. Engine must be operational for refills to proceed.
- **Herb–Drug Interaction Engine Slice.** Runs alongside the medication engine if the patient has reported herbal medicines.
- **Pharmacy Portal Slice.** Approved refills enter the pharmacy workflow at Step 6. The Pharmacy Portal Slice defines fulfillment, release, and delivery.
- **AI Clinical Assistant Slice.** Mode 1 helps patients initiate refills. Does not approve. Adherence data feeds Mode 1's patient context.
- **Consent & Delegated Access Slice.** Refill requires active care consent. Delegate scope gates delegate-initiated refills. Bridge supply on consent revocation.
- **Forms / Intake Engine Slice.** Medication reconciliation quality directly affects interaction engine accuracy.
- **Messaging & Inbox Spec v1.0.** Inbox threads and message-delivery expectations govern care-team and patient-visible communication generated by this workflow.
- **Notification infrastructure.** Refill reminders, status updates, and eligibility failure explanations depend on WhatsApp/SMS/in-app channels.
- **Payment & Billing Spec v1.0.** Medication payment is collected at the configured collection point, with failure handling, retries, and refunds governed by the payment specification.
- **Labs Slice.** Required monitoring labs gate refill eligibility.
- **RPM/CCM Slice.** Refill adherence feeds chronic care monitoring. RPM-required labs gate refill eligibility.

---

---

## 22. Pharmacy Portal v1.0 carried-forward content (per HIGH-07 remediation)

The Pharmacy Portal Slice PRD v1.0 sections that govern platform pharmacy vs partner pharmacy distinction, inventory management, pharmacist decision surface, audit specifics, and metrics are carried forward in full below. The earlier sections of this document (§6 PharmacyProvider abstraction, §13 Inventory awareness, §15 Pharmacy partner workflow) extend this content; they do not replace it.

### 4. Platform pharmacy vs partner pharmacy (carried forward from Pharmacy Portal v1.0 §4)


### 4.1 What differs

| Dimension | Platform pharmacy | Partner pharmacy |
|---|---|---|
| Operated by | Telecheck | External pharmacy partner |
| Programs served | Selected managed programs (GLP-1, men's health/ED, and others where end-to-end supply chain control is commercially and clinically important) | Broader chronic-care refills, general prescriptions, and programs where local distribution matters |
| Inventory management | Telecheck-managed inventory, procurement, and stock tracking | Partner-managed inventory; integration via portal for stock availability and fulfillment status |
| Physical location | Telecheck-operated facility (or contracted dedicated facility) | Partner's existing pharmacy location(s) |
| Delivery coordination | Telecheck-managed delivery partner relationship | May use Telecheck's delivery partner or partner pharmacy's own delivery capability |
| Commercial routing | Platform decides which programs route to platform pharmacy | Configurable per market, per program, per medication class |

### 4.2 What does not differ

| Dimension | Both pharmacy types |
|---|---|
| Regulatory framework | Both must hold valid licenses in the operating market. Both comply with identical dispensing regulations, pharmacist oversight requirements, and Pharmacy Council rules. |
| Workflow requirements | Identical — same queue, same fulfillment steps, same release check requirements, same protocol-authorized release governance |
| Interaction engine signal visibility | Both see the same signals at the same points in the workflow |
| Herb–drug signal visibility | Identical |
| Fake medication detection signal visibility | Identical |
| Audit requirements | Identical — every fulfillment action, release check, exception, and delivery event is audited identically regardless of pharmacy type |
| Patient experience | The patient sees consistent order status, delivery tracking, and medication information regardless of which pharmacy fulfills their order. The patient may or may not see which pharmacy filled their order (configurable per market). |

### 4.3 Regulatory posture

The platform pharmacy operates under the same regulatory framework as any licensed pharmacy in the market. It does not claim special regulatory status by virtue of being owned by the platform. The distinction between platform pharmacy and partner pharmacy is operational and commercial, not regulatory.

Both pharmacy types must be licensed and inspected per market requirements. For Ghana launch, both must comply with Ghana Pharmacy Council regulations. The Pharmacy Portal does not enable any workflow that would not be permitted for a licensed pharmacy in the operating market.

---


### 8. Inventory management (platform pharmacy) (carried forward from Pharmacy Portal v1.0 §8)


Inventory management applies to the platform pharmacy only. Partner pharmacy inventory is managed by the partner; the portal receives stock availability signals but does not manage partner inventory.

### 8.1 Stock tracking

The platform pharmacy maintains inventory records in the portal:
- Medication name, formulation, strength
- Batch number and expiry date
- Quantity on hand
- Quantity reserved (allocated to approved orders not yet fulfilled)
- Quantity available (on hand minus reserved)
- Reorder point (minimum stock threshold triggering replenishment)
- Cold-chain status where applicable

### 8.2 Reorder alerts

When available quantity drops below the reorder point, the portal generates a reorder alert visible to the pharmacy operations lead. Alerts are prioritized by: time-sensitivity of the medication (e.g., insulin reorders are more urgent than vitamin supplements), current order volume, and estimated days of supply remaining.

### 8.3 Expiry management

The portal tracks expiry dates and surfaces:
- Medications approaching expiry (configurable threshold, recommend 90 days)
- Medications past expiry (immediate quarantine required, cannot be dispensed)
- FEFO (First Expiry, First Out) picking guidance — the fulfillment workflow suggests the soonest-expiring stock unit for each pick

### 8.4 Partner pharmacy stock signals

Partner pharmacies are not required to expose full inventory to the portal. They provide:
- **Stock availability confirmation** at order intake (can you fill this order? yes/no/partial)
- **Stock-out notification** if an accepted order cannot be fulfilled due to stock depletion between acceptance and fulfillment
- Optional: real-time stock availability feed for high-volume medications, enabling smarter routing

---


### 9. Pharmacist decision surface (carried forward from Pharmacy Portal v1.0 §9)


The pharmacist's portal is designed for accuracy and speed. The primary surfaces are:

### 9.1 Order queue

- All pending orders, sortable by priority, time, signal severity
- Each order shows: patient name, medication, quantity, signal summary (count by severity and source engine), approval pathway, delivery preference
- Claim button to take ownership of an order
- Color-coded signal indicators: critical (red), major (orange), moderate (yellow), clean (green)
- Protocol-approved orders carry a visible protocol indicator

### 9.2 Order detail

When the pharmacist opens an order:
- Full prescription details (medication, strength, formulation, quantity, dosing instructions)
- Patient profile summary (age, relevant conditions, allergies)
- Interaction engine signals (all five check classes), ordered by severity, with mechanism and recommended action
- Herb–drug signals, labeled by source, ordered by severity, with evidence quality visible
- Fake medication detection status for the stock unit being picked (if applicable)
- Approval pathway (clinician name or protocol version)
- Delegate context if applicable
- Action buttons: fulfill, hold, escalate

### 9.3 Release confirmation

After fulfillment:
- Label preview (pharmacist confirms label accuracy)
- Final signal check (any new signals since approval are highlighted)
- Release confirmation button (records pharmacist identity and timestamp)
- Or: hold for escalation with reason

### 9.4 Exception workflow

When an exception arises:
- Structured exception form (stock-out, substitution needed, cold-chain issue, counterfeit flag, other)
- Escalation routing (to clinician, to pharmacy operations lead, or to both)
- Patient notification draft (auto-generated based on exception type, pharmacist can customize)
- Exception resolution tracking (open, in progress, resolved, with resolution detail)

---


### 11. Audit specifics (carried forward from Pharmacy Portal v1.0 §11)


Every pharmacy action is audited:

| Event | What is recorded |
|---|---|
| Order received | Order ID, medication, patient, source (clinician or protocol), routing decision (platform or partner pharmacy), timestamp |
| Order claimed | Pharmacist identity, timestamp |
| Pick completed | Stock unit identifier, batch number, expiry, fake medication detection status, pharmacist/technician identity |
| Label generated | Label content hash, timestamp |
| Release check | Pharmacist identity, signals reviewed (engine version, signal IDs), new signals since approval (if any), release decision, rationale if held |
| Protocol-authorized release | Protocol version, release criteria evaluation results, accountable pharmacist, signal state at release time |
| Exception raised | Exception type, detail, escalation destination |
| Exception resolved | Resolution detail, resolving actor, timestamp |
| Dispatched | Delivery partner, rider (if available), dispatch timestamp |
| Delivered | Proof of delivery method, delivery timestamp |
| Delivery failed | Failure reason, fallback action |
| Pickup | Patient identity verification method, pickup timestamp |
| Substitution | Original medication, substitute medication, clinician approval, re-run engine signals |

---


### 12. Metrics (carried forward from Pharmacy Portal v1.0 §12)


**Throughput**
- Order turnaround time (queued → released) — by pharmacy type
- Time in queue before claim
- Fulfillment time (claimed → released)
- Delivery time (dispatched → delivered)
- End-to-end time (approved → delivered/picked up)
- Orders per pharmacist per day

**Quality and safety**
- Release check completion rate (should be 100% where protocol-authorized release is not activated)
- Exception rate by type (stock-out, substitution, cold-chain, counterfeit flag)
- New-signal-since-approval rate (how often the medication list changes between approval and dispensing)
- Escalation rate to clinician from pharmacy
- Protocol-authorized release rate vs pharmacist-reviewed release rate (when activated)
- Substitution rate and clinician approval turnaround for substitutions
- Counterfeit flag rate and pharmacist resolution decision distribution

**Delivery**
- Delivery success rate (dispatched → delivered without failure)
- Delivery failure rate and failure reasons
- Same-day delivery rate (Accra metro)
- Pickup rate vs delivery rate
- Pickup expiry rate (medications not collected within window)
- Delivery partner status API reliability (percentage of status updates received on time)

**Inventory (platform pharmacy)**
- Stock-out rate by medication
- Reorder alert response time
- Expiry waste rate (medications expired before dispensing)
- FEFO compliance rate

**Commerce**
- Revenue per order (medication margin)
- Fulfillment cost per order (by pharmacy type)
- Delivery cost per order

---


---

## v1.10 cycle additions (added 2026-05-02 per v1.10.1 hygiene cycle physical merge of Phase5 delta Row 11)

**Cycle C2 — Emerging-markets framing reframe.** Notification-channel and payment-rail selection (referenced at §11 reminders, §12 last-mile delivery, §14/§20 dependencies) is **CCR-driven, not Ghana-specific in architecture**. The Telecheck-Ghana pilot uses WhatsApp (primary) + SMS (fallback) for notifications, mobile money for payment rails, and motorcycle-courier last-mile delivery per the CCR Ghana profile. These selections resolve at runtime per CCR `operational.notification_channels.primary_engagement` and `operational.payment_rails`. Future markets configure their own channel/rail selections in the Market Pack — e.g., the Telecheck-US tenant uses Stripe for payment rails (per ADR-024) and US carrier last-mile delivery (UPS/USPS/FedEx) per the CCR US profile.

The slice's references to WhatsApp, mobile money / Paystack, and motorbike-based last-mile delivery (§11, §12.1, §20) are preserved as operationally accurate descriptions of the Telecheck-Ghana pilot configuration, not as platform-default behavior.

**Cross-references (v1.10):** ADR-024 (CCR country-driven configuration), CCR `operational.notification_channels.primary_engagement`, CCR `operational.payment_rails`, Market Rollout Cockpit Slice (Market Pack per-country channel/rail configuration), Notification Spec.

**Source delta:** `Telecheck_v1_10_PRD_Update/Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` Row 11 (Cycle C2).

### C3 brand-structure cascade — §5 / §112 verification marker (Row 41 — verify-only, no edit)

**Verification (added 2026-05-02 per v1.10.1 hygiene cycle physical merge of Phase5 delta Row 41):** §5 line 112 "Telecheck-Ghana operated pharmacy infrastructure (where applicable)" has been verified consistent with the v1.10 C3 brand-structure vocabulary. **No substantive edit applied.**

`Telecheck-Ghana` is the canonical operating-tenant identifier under C3 (operating tenants follow `Telecheck-{country}` naming; `Telecheck` is platform/B2B-only and never consumer-facing; the consumer DBA `Heros Health Ghana` is country-instanced and patient-facing — not the correct identifier for back-office pharmacy infrastructure operated by the tenant). The §5 reference describes operating-tenant-owned pharmacy infrastructure (an operational/back-office context), so the operating-tenant identifier is the correct reference. Sentinel marker placed per Phase 5 delta Row 41 verification request.

**Cross-references (v1.10):** Master Platform PRD v1.10 §17 (brand-structure rules); Phase 5 Slice/Engineering/Operations delta artifact (`Telecheck_v1_10_PRD_Update/Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md`) Row 41.

---

## Document control

- **v2.1** — Remediation revision per Adversarial Counsel Review v1.0 finding HIGH-07. Carries forward in full the Refill Slice PRD v1.0 §3, §6, §7, §8, §9, §10, §11, §12, §13 content (now §21 with v1.0 section structure preserved) and Pharmacy Portal Slice PRD v1.0 §4, §8, §9, §11, §12 content (now §22 with v1.0 section structure preserved). v2.0's "preserved from v1.0" reference-style summaries replaced with actual content. Pattern C remediation: ProductCatalog, Subscription, SubscriptionEvent, Cart, CartItem schemas in this slice now reference Canonical Data Model v1.2 §4.7-§4.11 rather than carrying inline schema; subscription state machine narrative references State Machines v1.1 §15 rather than embedding the state machine. Anti-compression rule: v2.0 was 710 lines; Refill v1.0 was 417 lines; Pharmacy Portal v1.0 was 490 lines — v2.1 carries forward the full 907 lines of v1.0 content plus v2.0's ecom additions.
- **v2.0** — Tier-1 ecom rewrite. Consolidates Refill Slice v1.0 and Pharmacy Portal Slice v1.0 into one Pharmacy + Refill spec. Adds: subscription model with full lifecycle (pause, resume, switch, cancel), multi-product cart, cancellation deflection (anti-coercive), product catalog (per-tenant), PharmacyProvider adapter framework with US (Truepill, Honeybee, Capsule, Alto) and Ghana adapters per ADR-024, inventory awareness with stockout handling, compounding-aware extension points, shipment tracking (last-mile), per-tenant analytics dashboard. Preserves all v1.0 clinical-safety guarantees: interaction engine gate, SAFETY_HOLD, bridge supply per ADR-008, clinician-review default with protocol-authorized as configurable, pre-auth windows by medication class.
- **v1.0** (Refill) and **v1.0** (Pharmacy Portal) — superseded by this consolidated v2.x on 2026-04-25.
- **Next review:** after first US tenant subscription cohort completes 90 days; after first cancellation deflection campaign measures effect; after pharmacy adapter conformance test suite completes (OR-244).
- **Change discipline:** changes to subscription state machine, refill state machine, interaction engine gate, bridge-supply behavior, or pharmacy adapter contract require Engineering Lead + Tenant Clinical Lead sign-off and must be reflected in State Machines and Canonical Data Model.
