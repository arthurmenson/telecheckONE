# Telecheck — Forms / Intake Engine Slice PRD

**Version:** 2.1
**Status:** Canonical for development
**Owner:** Product (Telecheck)
**Supersedes:** Forms/Intake Engine Slice PRD v1.0
**Parent documents:** Master Platform PRD v1.10 §9.1, ADR-023 (multi-tenancy), ADR-024 (country-driven config), ADR Set v1.0 + Addenda 016–019 + 020–025 (with ADR-025 superseded by ADR-026)
**Companion documents:** Pharmacy + Refill Slice PRD v2.1, Admin Backend Slice PRD v1.1, Consent & Delegated Access Slice PRD v1.0, AI Clinical Assistant Slice PRD v1.0, Medication Interaction & Validation Engine Slice PRD v1.0, Herb-Drug Interaction Engine Slice PRD v1.0, Labs Slice PRD v1.0, Contracts Pack v5 — FORMS-ENGINE
**Format:** Markdown

---

## Change log from v1.0

v2.0 is the Tier-1 conversion-optimized rewrite reflecting the Hims/Ro DTC ecom standard added to launch scope (per Master PRD v1.9 §5.1):

1. **Tenant scoping.** Every form template, every patient submission, every variant is tenant-scoped per ADR-023. Templates do not cross tenants.
2. **Visual builder for tenant admins.** Tenant admins (per RBAC v1.1) can construct intake forms through a visual builder without engineering involvement. Schema-level changes (new field types, new validation patterns) remain engineering-scope.
3. **Transition messages and educational interstitials.** First-class form elements distinct from question fields. Used to manage cognitive load, set expectations, educate on the program / medication / process, and reduce abandonment.
4. **Save-and-resume.** Patients can leave mid-intake and resume from where they left off, across devices, within tenant-configurable time bounds.
5. **A/B testing native.** Variant testing of question wording, ordering, presentation, transition copy, and educational content. Per-tenant scoped. Powered by PostHog (per ADR-022). Statistical significance computed; winners promoted.
6. **Conversion event taxonomy.** Every step emits structured events for funnel analysis. Drop-off identification is automatic.
7. **JSON import/export.** Tenants migrating from other DTC platforms (Hims/Ro/Rimo style intake structures) can import JSON-defined forms; tenants can export for backup and external review.
8. **Per-tenant brand theming.** Forms render with tenant brand colors, logo, copy voice. Theming is automatic from tenant_brand configuration; no per-form theming work required.
9. **Abandonment recovery.** Email/SMS/WhatsApp follow-up to incomplete intakes per tenant configuration. Patient sees "Resume your application" with deep link.
10. **Accessibility.** WCAG 2.1 AA at minimum (was implicit in v1.0; now explicit).
11. **Subscription-aware intake handoff.** Intakes that result in a Refill v2.0 subscription pass subscription preferences (cadence, multi-product cart) directly into Pharmacy + Refill Slice without re-asking.

---

## 1. Purpose and strategic role

The Forms/Intake Engine is the platform's structured data collection layer AND the platform's conversion engine for DTC tenants. Every program enrollment, every clinical intake, every onboarding step, every consent presentation, and every medication reconciliation passes through this engine.

Two equally important goals:

**Clinical safety goal:** every Mode 2 case prep, every interaction-engine evaluation, every clinician decision is downstream of intake data quality. Garbage in, garbage out. This is the v1.0 framing.

**Commercial conversion goal:** for DTC tenants (Heros and future US tenants), intake conversion rate is THE metric. A 5% conversion improvement in the intake funnel is worth more in revenue than most other product investments. The intake engine must therefore be a first-class conversion-optimization tool, not just a data-collection tool. This is the v2.0 framing.

Both goals must be satisfied without trade-off. A high-converting intake that produces low-quality clinical data is a clinical safety incident waiting to happen; a clinically-rigorous intake with 30% completion is commercially nonviable.

This slice defines:
- How forms are structured, configured, and deployed per tenant per program
- How patient onboarding works end to end (account creation through first clinical readiness)
- How medication reconciliation works at onboarding and ongoing touchpoints
- How progressive consent presentation is implemented
- How structured intake feeds AI Mode 2 protocol evaluation
- How transition messages and educational interstitials manage cognitive load and reduce abandonment
- How A/B testing of variants works per tenant
- How save-and-resume works across devices
- How abandonment recovery works
- How JSON import/export works for tenant migration scenarios
- How the engine handles incomplete data, abandonment, and resumption
- How delegates interact with forms on behalf of patients
- How the visual builder works for tenant admins

---

## 2. Traceability

| Master PRD reference | This slice addresses |
|---|---|
| §3 Pillar 1 — Telehealth care delivery | Intake forms feed clinical workflows |
| §5.1 Tier-1 ecom scope addition | This slice IS the Tier-1 intake spec |
| §6 Timeline — Care Delivery + Forms work stream | 6-week delivery target |
| §8 Job 1 — Enroll a patient into a program | Program enrollment intake flows |
| §8 Job 4 — Consult a clinician | Structured intake for async and sync consults |
| §9.1 Forms/Intake Engine v2.0 scope | This slice spec |
| §15 Progressive consent presentation | Consent screens embedded in intake flows |
| Consent Slice §9 — Progressive consent presentation | Consent screens embedded in intake engine flows |
| AI Clinical Assistant Slice §4.2 — Mode 2 input | Structured intake data consumed by Mode 2 |
| Medication Interaction Engine Slice §10.1 — Incomplete medication list | Medication reconciliation quality |
| Pharmacy + Refill Slice v2.0 — subscription handoff | Intake subscription preferences pass to Refill |
| Admin Backend Slice v1.0 — visual builder | Builder lives in Admin Backend |
| ADR-023 multi-tenancy | Form templates tenant-scoped |
| Contracts Pack v5 — FORMS-ENGINE | Four-layer separation; one-version-per-market still applies |

---

## 3. Actors

| Actor | Role with the engine |
|---|---|
| **Patient** | Completes intake forms — onboarding, program enrollment, consult intake, medication reconciliation. Primary data contributor. |
| **Delegate** | Completes intake forms on behalf of a patient per delegation scope. Sees delegate banner throughout. |
| **Tenant Admin** | Manages the tenant's form catalog: creates new forms, edits existing forms via visual builder, deploys variants for A/B testing, monitors conversion analytics. |
| **Tenant Marketing** | Authors copy, transition messages, educational interstitials within forms. Cannot change clinical fields without Tenant Clinical Lead approval. |
| **Tenant Clinical Lead** | Reviews and approves intake forms before deployment. Owns the clinical validity of intake content. |
| **Clinician** | Consumes intake data in case review (read-only). Provides feedback on intake quality and completeness. |
| **AI Mode 2** | Consumes structured intake data as input to protocol execution. |
| **Platform Admin** | Aggregate cross-tenant analytics on engine performance (form completion rates across the platform, conversion benchmarks). No per-tenant PHI access. |

---

## 4. Form structure model

Per Contracts Pack v5 FORMS-ENGINE, the engine maintains four-layer separation:

1. **Template** — the form definition (questions, branching, validation, copy, transitions, interstitials)
2. **Deployment** — a template version deployed to a tenant for a specific program at a specific point in time
3. **Submission** — a patient's actual responses to a deployment
4. **Snapshot** — the immutable record of what the patient saw at submission time

v2.0 adds two additional layer concepts:

5. **Variant** — an A/B test variant of a deployed template (Variant A, Variant B, Variant Control). Patients are randomly assigned variants; conversion data is attributed.
6. **Resume State** — a partial submission saved for later completion; encrypted and tenant-scoped; tied to patient (or device-anonymous-token if pre-account).

### 4.1 Template elements (extended from v1.0)

| Element type | Purpose | New in v2.0 |
|---|---|---|
| Question (text) | Free-text input | — |
| Question (number) | Numeric input with validation | — |
| Question (single-choice) | Radio buttons | — |
| Question (multi-choice) | Checkboxes | — |
| Question (date) | Date picker | — |
| Question (file upload) | Lab report, prescription image, etc. | — |
| Question (medication) | Structured medication entry with autocomplete from RxNorm or tenant catalog | — |
| Question (height/weight composite) | Specialized for body metrics | — |
| Consent block | Renders consent presentation per Consent Slice §9 | — |
| Conditional branch | If [condition] show [next] else [other] | — |
| Validation rule | Range, pattern, required-if-X | — |
| **Transition message** (NEW) | Copy block between question groups; manages cognitive load, sets expectations ("Next we'll ask about your lifestyle — about 2 minutes") | ✓ |
| **Educational interstitial** (NEW) | Content panel (text, image, video, list) embedded in flow; educates on program, medication, expectations | ✓ |
| **Progress indicator** (NEW) | Configurable: linear bar, step counter ("Step 3 of 7"), section-based, or hidden | ✓ |
| **Trust block** (NEW) | Inline element showing trust signals: clinician credentials, security badges, legal compliance, customer testimonials | ✓ |
| **Pricing display** (NEW) | Inline element showing pricing for the program/medication being applied for, with subscription cadence options | ✓ |
| **Cart upsell** (NEW) | Inline element offering additional products in the same intake (multi-product cart per Pharmacy + Refill v2.1) | ✓ |
| **Save-resume prompt** (NEW) | Auto-save indicator and explicit "Save and continue later" affordance | ✓ |

### 4.2 Element ordering and grouping

- Templates are organized into **sections**. Each section has a name, optional description, and a sequence of elements.
- Sections enable logical grouping (e.g., "About you", "Your health history", "Consent and confirmation").
- Sections can be conditionally shown/hidden based on prior responses.
- Sections can be marked as required for clinical validity (cannot be skipped) or optional (skippable; flagged for clinician follow-up).

### 4.3 Conditional branching (extended)

v2.0 supports:
- Simple conditions: `if response_to_field_X == "yes" show field_Y`
- Compound conditions: `if (A AND B) OR (C AND NOT D) show E`
- Numeric thresholds: `if BMI < 27 show "this program may not be the right fit"`
- Computed values: BMI from height + weight; risk scores from compound inputs

---

## 5. Tenant scoping (per ADR-023)

### 5.1 Templates are tenant-scoped

Every Template, Deployment, Variant, Submission, Snapshot, and Resume State carries `tenant_id`. No cross-tenant template sharing at launch. PostgreSQL Row-Level Security policies enforce isolation per Canonical Data Model v1.2 §5.

If a template appears useful across tenants (e.g., a baseline GLP-1 template that multiple US tenants would benefit from), the platform-admin process is: (a) export to JSON, (b) tenant admin imports into their tenant, (c) tenant admin customizes for their brand. Cross-tenant template sharing as a productized feature is post-launch.

### 5.2 Forms inherit tenant brand

A template authored once renders with the tenant's brand: logo (top of form), primary color (CTAs, progress indicator, accents), typography (per design tokens), copy voice (per tenant_brand.notification_copy_overrides where overridden). Tenant admin does not configure visual styling per form — the design system applies tenant brand automatically.

### 5.3 Per-tenant analytics

Conversion analytics are tenant-scoped. A tenant admin sees their tenant's funnel; platform admin sees aggregate cross-tenant funnels (without per-form-instance PHI).

---

## 6. The visual builder (NEW in v2.0)

The visual builder is part of the Admin Backend Slice v1.0, accessed by Tenant Admin and Tenant Marketing roles. It enables construction of intake forms without engineering involvement.

### 6.1 Builder UI layout

```
┌────────────────────────────────────────────────────────────────────┐
│  Form Builder — [Template Name]                       [Save] [...] │
├────────────────┬─────────────────────────────────┬─────────────────┤
│                │                                 │                 │
│  Element       │   Form canvas                   │  Element        │
│  library       │   (live preview)                │  properties     │
│                │                                 │                 │
│  Questions     │   Section 1: About you          │  [Selected:]    │
│   - Text       │   ├─ Question: First name       │  Question       │
│   - Number     │   ├─ Question: Date of birth    │  Type: Text     │
│   - Choice     │   └─ Transition: "Next we'll..."│  Required: ✓    │
│   - ...        │                                 │  Validation:    │
│                │   Section 2: Health history     │  - Min length 1 │
│  Layout        │   ├─ Educational: GLP-1 info   │  - Max length 50│
│   - Section    │   ├─ Question: Weight history  │                 │
│   - Transition │   └─ ...                       │  Conditional:   │
│   - Education  │                                 │  Show always    │
│   - Trust      │   Section 3: Consent           │                 │
│   - Pricing    │   └─ Consent block: Care       │  Variant: A     │
│   - Cart       │                                 │                 │
│                │   [+ Add section]               │                 │
│  Logic         │                                 │                 │
│   - Branch     │                                 │                 │
│   - Validation │                                 │                 │
│                │                                 │                 │
└────────────────┴─────────────────────────────────┴─────────────────┘
```

### 6.2 Builder workflows

**Create new template from scratch:**
- Tenant admin clicks "New form" → empty canvas
- Drags element types from library to canvas
- Configures each element via properties panel
- Adds branching logic via the Logic panel
- Previews on mobile and desktop viewports
- Saves draft

**Create new template from import:**
- Tenant admin clicks "Import" → uploads JSON file
- Engine validates JSON against Template schema
- On success: template loaded into builder for review/customization
- On failure: line-by-line errors shown with suggestions

**Clone existing template:**
- Tenant admin selects a deployed template → "Duplicate"
- New draft created as v(n+1) of the template family
- Original deployment continues serving patients
- Draft can be edited independently

**Create variant for A/B test:**
- Tenant admin selects a deployed template → "Create variant"
- Variant inherits template structure
- Specific elements modified for testing (copy, ordering, transition messages)
- Variant deployed alongside Control
- PostHog feature flag splits traffic per configured percentage

**Deploy template:**
- Tenant Clinical Lead reviews draft (required for any clinical-field changes)
- Tenant admin clicks "Deploy" → confirmation dialog showing impact
- Engine validates: no broken branches, all required fields present, consent blocks correctly placed, Mode 2 input contract satisfied (where applicable)
- On approval: template deployed to live patients; prior version retired but Snapshots remain for audit

### 6.3 What the builder does NOT do

- It does not let tenant admins create new field types (engineering-scope)
- It does not let tenant admins modify the platform-floor consent presentation (per Contracts Pack)
- It does not let tenant admins modify the AI Mode 2 input schema (engineering-scope; tenant admin chooses which clinical schema applies)
- It does not let tenant admins bypass the Clinical Lead review for clinical-field changes (RBAC enforced)
- It does not let tenant admins disable required guardrails (e.g., crisis detection in chat fields)

### 6.4 Builder accessibility for tenant admins

Tenant admins are not engineers. The builder must be usable by a marketing operations person with no technical background. UX requirements:

- Drag-and-drop with clear drop zones
- Live preview that matches what the patient will see
- Validation errors in plain language with suggested fixes
- Undo/redo for at least 50 operations
- Keyboard shortcuts for power users
- Search across all elements in the form
- "Show me where this branches" debugging tool

---

## 7. Onboarding flow (substantially preserved from v1.0; tenant-scoped)

### 7.1 Three-stage onboarding

**Stage 1 — Account creation (~1.5 minutes target)**
- Phone number + OTP per tenant country (US: Plivo or MessageBird; Ghana: Hubtel or mNotify per ADR-024)
- First and preferred name
- Country and (where relevant) region/state
- Emergency contact (optional at this stage; required before clinical action)
- Accept terms of service and privacy policy (per tenant.legal_config)

**Stage 2 — Profile completion (~1.5 minutes)**
- Date of birth, sex assigned at birth, gender identity (optional)
- Pronouns (optional)
- Address (per tenant country format per CCR)
- Communication preferences (channel hierarchy per Notification Spec)
- Quiet hours (default per tenant CCR; user can override)

**Stage 3 — Program intake (program-specific, varies)**
- Driven by the program template
- See §9 for program-specific templates

### 7.2 Onboarding for delegate-led setup

Where the delegate completes onboarding on behalf of a patient (e.g., adult child setting up account for elderly parent):
- Stage 1 completed by delegate as themselves first
- Stage 1 completed again, marked as "for someone else"
- Delegation scope captured per Consent Slice
- Stage 2 and 3 completed for the patient with delegate banner persistent

### 7.3 Onboarding under degraded connectivity

Per System Architecture v1.2 — degraded-connectivity model. Stage 1 must work over slow networks (typical Ghana mobile network at edge of 3G coverage). OTP is the only network-required step in Stage 1; rest can be drafted offline and submitted when connection improves.

---

## 8. Save-and-resume (NEW in v2.0)

### 8.1 Auto-save behavior

Every patient response auto-saves on field blur (or after 2 seconds of inactivity, whichever first). Save indicator displays "Saved" with timestamp briefly after each save. If save fails (network), indicator shows "Offline — will save when reconnected" without blocking the patient.

### 8.2 Explicit save-and-leave

Patient can explicitly click "Save and continue later" at any point. Engine:
- Saves current state with all responses to date
- Marks Resume State as `paused`
- Generates a unique resume token tied to patient account
- If patient pre-account: generates anonymous resume token tied to device and email/SMS contact (configurable per tenant)
- Sends resume link via email/SMS/WhatsApp per tenant configuration
- Closes form

### 8.3 Resume

Patient returns via:
- App: opens to "Resume your [Program Name] application — [N]% complete"
- Email/SMS link: deep-links to specific form section where patient left off
- New device login: account-tied resume state available across devices

Engine restores all responses, presents the next unanswered required field, indicates progress to date.

### 8.4 Resume time bounds

Per-tenant configurable. Default: 30 days. After expiry, Resume State is purged; patient must restart. This balances patient flexibility with the staleness of older responses (e.g., medication list 60 days old is unreliable for current clinical use).

### 8.5 Save-and-resume audit

Every save, every resume, every expiry is audited per AUDIT-EVENTS Category C (operational). No PHI in the audit beyond what's already captured at submission.

---

## 9. Program-specific intake templates (extended from v1.0; tenant-scoped)

The platform ships with template starting points that tenants customize. Templates are organized by program category:

### 9.1 GLP-1 weight management intake (US tenants)

Builds on v1.0 §9.1 with Tier-1 enhancements:

**New elements added:**
- **Educational interstitial** before health screening: brief video explaining GLP-1 mechanism, expected outcomes, common side effects
- **Trust block** mid-flow: clinician credentials, LegitScript certification badge, "Reviewed by US-licensed clinicians"
- **Pricing display** before consent block: monthly subscription pricing, comparison to retail GLP-1 cost, savings
- **Cart upsell** post-eligibility: optional add-ons (B12, anti-nausea support, lifestyle coaching)
- **Subscription cadence selector**: monthly, quarterly billing (cadence handoff to Pharmacy + Refill v2.1)

**Conditional logic enhancements:**
- BMI < 27: show "this program may not be the right fit; we offer a separate metabolic health program if you'd like to discuss" with deflection to alt program intake
- Cardiovascular history positive: route to Mode 2 with elevated complexity flag
- Pregnancy/lactation positive: hard stop with appropriate copy and resource referral

### 9.2 ED program intake (US tenants)

Builds on v1.0 §9.2 with Tier-1 enhancements:

**New elements added:**
- **Educational interstitial**: discreet, matter-of-fact framing of ED, prevalence, treatment options
- **Trust block**: emphasis on privacy, discretion, packaging
- **Pricing display**: per-pill or monthly subscription tier
- **Cart upsell**: optional skin care, hair loss, multivitamin (cross-program upsell within men's health)

### 9.3 Hair loss intake (US tenants)

NEW template (US Tier-1 ecom standard):

**Sections:**
1. Hair loss screening: pattern, duration, family history, photo upload (optional)
2. Medical screening: thyroid, autoimmune conditions, recent medication changes
3. Lifestyle screening: stress, diet, sleep
4. Treatment history: prior topical or oral treatments tried
5. Pricing display, subscription selector
6. Care consent + data-use consent

### 9.4 Skincare intake (US tenants)

NEW template (US Tier-1 ecom standard):

**Sections:**
1. Skin concerns: primary concern (acne, anti-aging, hyperpigmentation, etc.), secondary concerns
2. Skin type screening: oily/dry/combination, sensitivity
3. Current routine: products currently used
4. Medical screening: pregnancy, breastfeeding (affects retinoid eligibility), conditions like rosacea/eczema
5. Photo upload: skin condition (optional, encouraged)
6. Pricing display, subscription selector
7. Care consent + data-use consent

### 9.5 Chronic care / diabetes intake (Ghana tenant; US tenants)

Preserved from v1.0 §9.3 with Tier-1 enhancements where applicable for US tenants. Ghana version emphasizes WhatsApp-first communication preference and mobile-money payment.

### 9.6 Hypertension intake (Ghana tenant)

Preserved from v1.0 §9.4 with WhatsApp-first communication preference.

### 9.7 Per-tenant template ownership

Tenants are not bound to the starting templates. Tenants can:
- Customize starting templates extensively (preferred path for most tenants)
- Author entirely new templates from scratch via builder
- Import JSON-defined templates from other DTC platforms

The starting templates are convenience accelerants, not constraints.

---

## 10. AI Mode 2 input contract (preserved from v1.0; multi-tenant adapted)

Mode 2 expects intake data in a specific structured format per AI Clinical Assistant Slice §6. The Forms/Intake Engine guarantees that any field flagged as "Mode 2 input" produces data in the expected schema.

If a tenant admin modifies a clinical field that is part of the Mode 2 input contract, the builder warns:
- "This field is consumed by AI clinical case prep. Changes here may affect AI recommendations."
- "Tenant Clinical Lead approval required before deployment."

If approved, the engine validates that the new field still produces compatible output. Incompatible changes (e.g., changing "Yes/No" to free text where Mode 2 expects boolean) are blocked at deployment.

---

## 11. Progressive consent integration (preserved from v1.0)

Consent blocks render the consent presentation defined in Consent Slice §9. Tenant-scoped consent text variants are supported via tenant.legal_config; underlying consent infrastructure is shared.

---

## 12. Medication reconciliation (preserved from v1.0; tenant-scoped)

Per v1.0 §6.2. Medication reconciliation prompts at:
- Onboarding (initial medication list)
- Each clinical touchpoint (consult, refill, lab review)
- AI Mode 1 conversations where medication-relevant questions are asked
- Periodic check-ins per program cadence

Tenant-scoped: medications are tied to the tenant's account record. A patient who has accounts in two tenants has two independent medication lists.

---

## 13. Herbal medicine reporting (preserved from v1.0; tenant-scoped)

Per v1.0 §7. Same model. Tenant-scoped. Particularly relevant for the Telecheck-Ghana tenant (per Herb-Drug Engine Slice).

---

## 14. A/B testing (NEW in v2.0)

### 14.1 Variant model

Each deployed template can have one Control variant + 1–4 alternative variants. Variants are full template instances; they share the underlying template family but differ in specified elements.

### 14.2 Traffic split

PostHog feature flags split traffic per tenant-configured percentage. Default 50/50 for two variants; tenant can configure other splits (e.g., 80/20 to limit exposure to a risky variant). Splits are sticky per patient (once assigned, patient sees same variant on resume).

### 14.3 Conversion event taxonomy

Every step emits structured events to PostHog. **Naming convention (clarified v2.1 per LOW-23):** event names use PostHog convention (snake_case verb_object). When emitted to PostHog, names are passed verbatim. When consumed by other downstream systems (Metabase reports per Admin Backend v1.X §5.6, custom dashboards, AI anomaly detection per Admin Backend §5.7.1), the same names are canonical — no translation, no aliasing. Event names below are the source-of-truth strings used across all consumers.

| Event | When | Properties |
|---|---|---|
| `intake_started` | First field rendered | tenant_id, template_id, variant, patient_id, source (campaign, organic, etc.) |
| `intake_section_completed` | Section transition | tenant_id, template_id, variant, section_index, time_in_section_ms |
| `intake_field_completed` | Field response submitted | tenant_id, template_id, variant, field_id, response_type |
| `intake_field_skipped` | Optional field skipped | tenant_id, template_id, variant, field_id |
| `intake_branch_taken` | Conditional branch | tenant_id, template_id, variant, branch_id, branch_chosen |
| `intake_paused` | Save-and-leave clicked | tenant_id, template_id, variant, section_index, time_in_intake_ms |
| `intake_resumed` | Patient returned | tenant_id, template_id, variant, time_paused_ms |
| `intake_completed` | All required fields submitted | tenant_id, template_id, variant, total_time_ms, sections_with_skips, mode_2_eligible |
| `intake_abandoned` | Resume State expired without completion | tenant_id, template_id, variant, last_section, time_paused_ms |
| `intake_validation_error` | Validation failure | tenant_id, template_id, variant, field_id, error_type |
| `intake_consent_decline` | Required consent declined | tenant_id, template_id, variant, consent_type |
| `intake_subscription_selected` | Subscription tier chosen | tenant_id, template_id, variant, tier, price_displayed |
| `intake_cart_upsell_added` | Patient adds upsell to cart | tenant_id, template_id, variant, upsell_product_id |
| `intake_cart_upsell_dismissed` | Patient dismisses upsell | tenant_id, template_id, variant, upsell_product_id |

### 14.4 Statistical significance

PostHog computes statistical significance per variant for each tracked metric (completion rate, time-to-complete, cart-upsell-take-rate, downstream subscription retention). Tenant admin sees a dashboard showing variant performance with confidence intervals.

### 14.5 Variant promotion to winner

When a variant achieves statistical significance with sufficient sample size (default 1,000 per arm; tenant configurable), tenant admin can promote it to the new Control. The losing variants are retired. Winner becomes the live form for all new patients. Patients mid-intake on a retired variant complete in their assigned variant (no mid-flow switching).

### 14.6 Variant audit

Every variant deployment, every variant retirement, every winner promotion is audited per AUDIT-EVENTS Category B (governance). Includes: tenant admin acting, variant identifiers, sample size, p-value, decision rationale.

---

## 15. JSON import/export (NEW in v2.0)

### 15.1 Schema

Templates have a canonical JSON schema published in the Telecheck developer docs. The schema covers:
- Template metadata (name, version, owner_tenant_id)
- Sections with elements
- Conditional branching rules
- Validation rules
- Mode 2 input contract bindings
- Brand customization placeholders (filled at render time from tenant_brand)

### 15.2 Import workflow

- Tenant admin uploads JSON via builder
- Engine validates schema; on failure, shows line-by-line errors
- On success, template loaded into builder for review/customization
- Tenant admin reviews, approves, deploys per standard workflow (including Tenant Clinical Lead approval for clinical fields)

### 15.3 Export workflow

- Tenant admin selects template → "Export"
- Engine generates JSON
- Downloads to tenant admin's device

### 15.4 Use cases

- **Tenant migration from another platform** (Hims/Ro/Rimo style): structures defined elsewhere can be imported as a generic future-tenant capability. **Out of v1.0 launch scope** *(updated 2026-05-02 per Codex Round-7 Scope 4 MEDIUM-3 finding — was previously stated as "Engineering may provide one-time conversion tooling for the Heros migration specifically", which both used bare `Heros` as a tenant identifier (C3 brand-structure violation per Master PRD v1.10 §17) AND resurrected a removed migration scope item per the HIGH-12 greenfield decision: Telecheck-US operating tenant launches greenfield with no Rimo migration). Any future tenant migration capability requires a fresh approved migration plan + ADR review; it is NOT pre-authorized for the Telecheck-US (Heros Health DBA) launch.*
- **Backup**: tenants can export templates for backup before risky changes
- **External clinical review**: tenants can share JSON templates with clinical reviewers external to the platform
- **Cross-environment promotion** (post-launch): export from staging, import to production

---

## 16. Abandonment recovery (NEW in v2.0)

### 16.1 Detection

If patient pauses intake (explicit save-and-leave, or auto-saved with no return), engine detects:
- 1 hour: patient has not returned → schedule recovery touch
- 24 hours: patient has not returned → escalate recovery
- 7 days: patient has not returned → final attempt
- 30 days: Resume State purged

### 16.2 Recovery touches

Per tenant configuration:

**Touch 1 (1 hour)**: gentle reminder via the patient's preferred channel
- "Hi [name], you started your [Program] application earlier. You're [N]% done — pick up where you left off: [link]"

**Touch 2 (24 hours)**: includes light incentive context
- "Just a friendly reminder — your application is still saved. Most patients complete in under 5 minutes. [link]"
- Optional: tenant can configure inclusion of trust signal ("Reviewed by US-licensed clinicians" or similar)

**Touch 3 (7 days)**: final follow-up with clear close
- "Last reminder — your application will expire in [X] days. Complete now: [link]. We'll be here when you're ready."

### 16.3 Channel selection

Per Notification Spec — uses patient's communication preference. Default channel hierarchy: in-app → push → WhatsApp (Ghana primary, US optional) → SMS → email. Recovery touches respect quiet hours.

### 16.4 Frequency caps

Per tenant policy: maximum 3 recovery touches per intake. After 3 touches without response, engine ceases follow-up; patient can still return via app at any time before Resume State expiry.

### 16.5 Per-tenant recovery configuration

Tenant admin can:
- Disable recovery entirely (some tenants may prefer not to follow up)
- Adjust timing (immediate, 4 hours, 1 day, 3 days, 7 days)
- Customize copy per touch
- A/B test recovery copy

### 16.6 Audit

Every recovery touch is audited (who was contacted, when, via what channel, what copy variant). Patient opt-out preferences honored per Consent Slice.

---

## 17. Subscription handoff to Pharmacy + Refill v2.1 (NEW in v2.0)

### 17.1 What gets passed

When intake completes and includes subscription preferences (cadence, multi-product cart, payment method preference), the engine emits a structured `intake_subscription_intent` event consumed by the Pharmacy + Refill module:

```json
{
  "tenant_id": "tnt_01H...",
  "patient_id": "pat_01H...",
  "intake_submission_id": "sub_01H...",
  "products": [
    {"product_id": "prod_01H...", "quantity": 1, "subscription_cadence": "monthly"},
    {"product_id": "prod_01H...", "quantity": 1, "subscription_cadence": "monthly"}
  ],
  "payment_method_preference": "card_default",
  "shipping_preference": "standard"
}
```

### 17.2 What does NOT get passed

The engine does not initiate the subscription. The subscription is created by Pharmacy + Refill v2.1 only AFTER:
- Clinician review approves the prescription (or protocol-authorized auto-approval where applicable)
- Payment method validated
- All consent requirements satisfied

This preserves the platform-floor invariant that no subscription begins without clinical authorization.

### 17.3 Cart upsell handling

Cart upsells added during intake are passed in the same structure. They are evaluated independently for clinical eligibility (e.g., a B12 supplement may not need clinician review; a Rx-only add-on does). Per-product workflow is governed by Pharmacy + Refill v2.1 (subscription model in §8, refill workflow in §9).

---

## 18. Delegate intake completion (preserved from v1.0)

Per v1.0 §11. Same model: delegate banner persistent, clear authorial attribution, sensitivity respected per ADR-009.

Multi-tenancy adjustment: delegations are tenant-scoped. A delegate authorized for Patient A in Tenant X is not automatically authorized for Patient A's account in Tenant Y (if such existed).

---

## 19. Per-tenant analytics dashboard (NEW in v2.0)

Tenant admins access intake analytics via Admin Backend Slice v1.0. Key views:

### 19.1 Funnel view

For each deployed template:
- Intakes started → step 1 → step 2 → ... → completed
- Drop-off rate per step
- Median time per step
- Conditional branch utilization

### 19.2 Variant comparison

For active A/B tests:
- Variant A vs Variant B (vs Variant Control)
- Completion rate, time-to-complete, downstream conversion (subscription took, paid, retained at 30/60/90 days)
- Statistical significance per metric

### 19.3 Cohort retention

For completed intakes by cohort:
- 30/60/90/180-day retention as active patient
- 30/60/90/180-day retention on subscription
- Revenue per cohort

### 19.4 Per-channel attribution

For intakes from marketing campaigns:
- Source/medium/campaign attribution
- Funnel performance per source
- Cost per intake completion (when paired with marketing spend data)

### 19.5 Geographic breakdown (for US tenants spanning multiple states)

- Completion rate per state
- Conversion per state
- Useful for identifying state-specific compliance friction or messaging issues

---

## 20. Performance targets

| Metric | Target |
|---|---|
| Form initial render time | < 1.5 seconds (mobile, 3G) |
| Field-to-field navigation | < 100 ms (no network round-trip for navigation) |
| Auto-save latency | < 500 ms (queued offline if no network) |
| Save-and-resume restore | < 2 seconds |
| Image upload | dependent on network; progress visible |
| Intake completion rate (US Tier-1 expectation) | 60%+ for typical DTC programs (industry benchmark: 40–60%) |
| Intake completion rate (Ghana chronic care) | 75%+ (lower friction expected; chronic patients are highly motivated) |
| Median intake time (US programs) | < 5 minutes for typical Tier-1 DTC intake |
| Median intake time (Ghana chronic care) | < 8 minutes (more comprehensive intake) |
| Mobile / desktop / tablet rendering parity | identical functionality; layouts adapt per design system |

---

## 21. Accessibility (NEW explicit in v2.0)

WCAG 2.1 AA at minimum. Specifically:

- Color contrast 4.5:1 for normal text, 3:1 for large text
- All interactive elements keyboard-accessible
- Focus indicators visible
- Form errors announced to screen readers
- Required-field indicators not color-only
- Dynamic content updates announced (e.g., "saved")
- Reasonable zoom support (200% without horizontal scroll)
- Form labels properly associated with inputs
- ARIA landmarks for form sections
- Save/resume preserves position for screen reader users

Tenant admins authoring forms via builder receive accessibility warnings if elements violate basic rules (e.g., color contrast on custom brand colors below threshold).

---

## 22. Content rules (preserved from v1.0; extended)

Per Master PRD §17 Honest Status, copy posture, and design rules. Extended for v2.0:

- No coercive copy ("Don't miss out", "Last chance" — except where genuinely true and time-bounded)
- No false scarcity
- No dark patterns (pre-checked unsubscribe boxes, hidden costs, etc.)
- Pricing displayed truthfully and prominently before consent block
- Subscription terms explicit (cancellation policy, billing cadence, total cost over time)
- Cart upsells clearly labeled as optional
- Educational content factual, balanced (mentions side effects, expected outcomes, alternatives)
- No medical claims beyond what tenant's clinical lead has approved

Per ADR-018 — copy is English at launch (Track A). Per ADR-019 — lab interpretation copy follows the AI-first with caveat pattern.

---

## 23. Open questions (slice-level)

1. **Cross-tenant template marketplace** — would tenants benefit from a curated marketplace of vetted starting templates? (Out of v2.0 launch scope; possible Phase 2.)
2. **Patient response data export** — should patients be able to download their intake responses for their own records? (Likely yes per data-portability principles; spec to be detailed.)
3. **Multi-language support within Track A** — some US tenants may want Spanish intake even at Track A launch. Per ADR-018 the platform is English at launch. Spanish for Track A is a per-tenant request that would be evaluated case-by-case post-launch.
4. **Builder mobile UX** — tenant admins editing forms on mobile is an unusual workflow. Builder is desktop-primary at launch; mobile is view-only.
5. **AI-assisted form authoring** — should the builder offer AI suggestions for transition copy, educational interstitial drafts, conversion optimization suggestions? Per ADR-020, this would use Anthropic Claude or alternative; per Master PRD §9.3, AI-assisted admin features are part of Admin Backend v1.1 scope.

---

## 24. Dependencies

- **Identity & Authentication Spec v1.0**, multi-tenant adapted per ADR-023.
- **Consent & Delegated Access Slice v1.0** — consent block rendering.
- **AI Clinical Assistant Slice v1.0** — Mode 2 input contract.
- **Medication Interaction & Validation Engine Slice v1.0** — medication reconciliation downstream consumer.
- **Herb-Drug Interaction Engine Slice v1.0** — herbal medicine reporting downstream consumer.
- **Pharmacy + Refill Slice v2.0** — subscription handoff target.
- **Admin Backend Slice v1.0** — visual builder lives there; analytics dashboards live there.
- **Notification Spec v1.1** — abandonment recovery touch infrastructure.
- **Contracts Pack v5 — FORMS-ENGINE** — four-layer separation contract, extended in v2.0 to include Variant and Resume State as additional layers.
- **PostHog (self-hosted)** per ADR-022 — A/B testing, conversion analytics, feature flags.
- **Tenant Configuration module** per ADR-023 — tenant resolution, brand inheritance, per-tenant CCR.

---

## 25. v1.10 cycle additions (added 2026-05-02 per v1.10.1 hygiene cycle physical merge of Phase5 delta Row 51)

### 25.1 Marketing copy in the Forms Engine four-layer architecture (Row 51 — per ADR-027)

The Forms Engine four-layer architecture (Layout / Logic / Data / Approval governance — preserved at v2.1) handles marketing copy in the **L1 (presentation) layer**.

**L1 classification distinction.** Marketing copy embedded in L1 (transition copy, educational interstitials, trust blocks, conversion CTAs, drug-class/molecule-class call-outs) MUST be classified at form-version-publish time as one of:

- **Program-level** (program / category-class messaging, no specific-molecule or brand-name claim) — no §13.2 governance review required.
- **Molecule-level** (specific molecule mention, brand name, or fail-closed borderline per ADR-027 v0.6 Decision §7) — requires Master PRD §13.2 Governance review process per Decision §4 of ADR-027 (triple sign-off: Product + Regulatory Affairs + Clinical Safety).

The classification is a structural attribute of the L1 element, not free-text editorial guidance.

**L4 approval governance enforcement.** The L4 approval governance layer MUST verify, at form-version-publish time, that any L1 element classified as molecule-level resolves to a `MarketingCopy` entity (per TYPES v5.2) in `approved` status before the form version is allowed to transition to `published`. A molecule-level L1 element with no resolvable approved `MarketingCopy` reference is a publish-time rejection per FORMS_ENGINE v5.2 static-analysis discipline.

**Runtime CCR gate.** At render time, the Acquisition & Engagement Tools slice §13 country-conditional marketing surface logic governs whether molecule-level L1 elements actually render in a given patient's `country_of_care`, gated on CCR `marketing.molecule_level_marketing_permitted` per ADR-027.

**Cross-references:** ADR-027 v0.6 Decision §4; Master PRD v1.10 §13.2; FORMS_ENGINE v5.2; TYPES v5.2 (`MarketingCopy`); CCR_RUNTIME v5.2 marketing block; Acquisition & Engagement Tools Slice PRD §13.

### 25.2 C3 brand-structure cascade — §13 verification marker (Row 40 — verify-only, no edit)

**Verification:** §13 line "Per v1.0 §7. Same model. Tenant-scoped. Particularly relevant for the Telecheck-Ghana tenant (per Herb-Drug Engine Slice)." has been verified consistent with the v1.10 C3 brand-structure vocabulary. **No substantive edit applied.**

`Telecheck-Ghana` is the canonical operating-tenant identifier under C3 (operating tenants follow `Telecheck-{country}` naming; `Telecheck` is platform/B2B-only; consumer DBA `Heros Health Ghana` is country-instanced and patient-facing — not operator-facing in this herb-drug clinical context). The §13 reference describes the operating-tenant scope of herbal-medicine reporting (a clinical/operational context), so the operating-tenant identifier is the correct reference. Sentinel marker placed per Phase 5 delta Row 40 verification request.

**Cross-references:** Master Platform PRD v1.10 §17 (brand-structure rules); Phase 5 Slice/Engineering/Operations delta artifact (`Telecheck_v1_10_PRD_Update/Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md`) Row 40.

### 25.3 Research data-use consent block field type (Row 61 — per ADR-028, Cycle C5)

**New field type / consent block variant:** `research_data_use_consent_block`. This is a new L1 (presentation) element type renderable inside any form template that surfaces consent at intake or at care-touchpoint moments.

**Render gate (CCR-driven).** A `research_data_use_consent_block` element renders only when CCR `research_data_partnership_active ≠ inactive` for the patient's `country_of_care` (per FORMS_ENGINE v5.2 form lifecycle research consent integration). When CCR is `inactive`, the element is omitted from rendered output entirely — it does not present, collapse, gray out, or otherwise signal the existence of research participation. This preserves I-030 in markets where Posture A is not yet activated.

**Block content sourcing.** Block prose is sourced from CCR `research_ethics_review_body.approval_reference_id` per CCR_RUNTIME v5.2 research block, version-pinned per Master PRD v1.10 §15.2 (per Consent & Delegated Access Slice §16). Forms Engine does not author research consent text editorially; it surfaces the version-pinned text resolved from CCR.

**I-030 static analysis at form-version-publish time.** Per FORMS_ENGINE v5.2 I-030 enforcement, static analysis at form-version-publish time rejects all six categories of dependency on `research_consent_status` (the runtime grant state of a patient's `ResearchConsent`):

1. **Branching condition** — no L2 (logic-layer) branch may evaluate `research_consent_status` (e.g., `if research_consent = granted, show panel A; else show panel B`).
2. **Element visibility** — no L1 element may be conditionally shown/hidden based on `research_consent_status`.
3. **Validation rule** — no L3 (data-layer) validation may admit/reject input based on `research_consent_status`.
4. **Eligibility / triage** — no eligibility, triage, or routing decision (Mode 2 input contract per §10) may consume `research_consent_status`.
5. **Pricing / commerce** — no pricing display, cart upsell, or subscription handoff (§17) may vary based on `research_consent_status`.
6. **Outcome messaging** — no completion message, recommendation, or follow-up scheduling may differ based on `research_consent_status`.

A form version that violates any of the six categories is a publish-time rejection. The static-analysis verdict is recorded in the form-version audit trail.

**Audit linkage.** Grant/revoke interactions on the block emit `research.consent_granted` / `research.consent_revoked` per AUDIT_EVENTS v5.2 §5 (audit class `high_pii` per I-031). The Forms Engine attaches the rendering form-version pin and the resolved CCR `research_ethics_review_body.approval_reference_id` to the audit payload.

**Cross-references:** ADR-028 v0.5; Master PRD v1.10 §15.2; INVARIANTS v5.2 I-029, I-030, I-031; FORMS_ENGINE v5.2 (research consent integration; six-category I-030 static analysis); CCR_RUNTIME v5.2 research block; TYPES v5.2 (`ResearchConsent`); Consent & Delegated Access Slice §16; AUDIT_EVENTS v5.2 §5.

**Source delta:** `Telecheck_v1_10_PRD_Update/Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` Row 61 (Cycle C5).

### 25.4 Program porting workflow (Row 88 — per Master PRD §10.5, Cycle C6)

**Scope.** This subsection documents how a program defined for one market (a `ProgramCatalogEntry` per TYPES v5.2 with an active `ProgramMarketPolicy` for source market) ports to another market via a new `ProgramMarketPolicy` for the target market plus Pattern A immutable per-market form versions.

**Four-layer model anchor.** Per Master PRD v1.10 §10.5 (canonical), the program catalog architecture is a four-layer model:

1. **Layer 1 — Program (platform-level catalog entry).** A `ProgramCatalogEntry` is platform-level and market-agnostic (e.g., "GLP-1 weight management"). The program defines the clinical category and platform-level interfaces; it does not contain market-specific config.
2. **Layer 2 — ProgramMarketPolicy.** A per-market activation policy binds a `ProgramCatalogEntry` to a specific operating tenant (e.g., `Telecheck-US`, `Telecheck-Ghana`) under the consumer DBA for that market (e.g., `Heros Health` US, `Heros Health Ghana` GH). The policy carries market-specific eligibility, formulary references, regulatory module bindings, pricing, and CCR-resolved configuration.
3. **Layer 3 — Forms Engine instantiation (Pattern A).** Per-market form versions are immutable and tagged with the operating-tenant identifier and the `ProgramMarketPolicy` reference. A US form version and a Ghana form version for the same program are independent immutable artifacts; one is not a "live edit" of the other.
4. **Layer 4 — CCR Runtime resolution.** At runtime, `country_of_care` resolves to a CCR pack which selects the correct `ProgramMarketPolicy` and form version. CCR-driven render gates (e.g., `research_data_partnership_active`, `marketing.molecule_level_marketing_permitted`) are applied at render time.

**Porting workflow (informative — see worked example for normative checklist).**

A. **Catalog entry confirmation.** Confirm the platform-level `ProgramCatalogEntry` is appropriate for both source and target markets (no fork at Layer 1).
B. **Target ProgramMarketPolicy authoring.** Author a new `ProgramMarketPolicy` for the target market with target-market eligibility, formulary, regulatory module, pricing, and CCR pack reference. Source-market policy is NOT mutated; the target gets its own policy.
C. **Pattern A target form version.** Author a new immutable form version for the target market — branched conceptually from the source-market form version but recorded as an independent artifact under the target operating tenant. Brand structure (Telecheck operating-tenant identifier, Heros Health country-instanced consumer DBA) follows Master PRD v1.10 §17.
D. **CCR pack delta resolution.** Reconcile CCR keys that differ between source and target markets — payment processor, SMS provider, formulary references, marketing posture, research posture — and confirm L4 approval governance constraints are met (per §25.1 marketing-copy classification and §25.3 research consent block render gate).
E. **Static analysis re-run.** Re-run form-version-publish-time static analysis against the target form version (six-category I-030 enforcement per §25.3; molecule-level L1 element resolution to approved `MarketingCopy` per §25.1; Mode 2 input contract conformance per §10).
F. **Activation review.** Activation of the target `ProgramMarketPolicy` is gated by Market Rollout Cockpit Slice activation review (existing Cockpit slice §3-§6 — out of scope of this slice).

**Worked example (normative — see referenced artifact).** The `Telecheck-US` GLP-1 program (Heros Health DBA) → `Telecheck-Ghana` GLP-1 program (Heros Health Ghana DBA) port is documented as an 89-item, 9-section worked example in `Telecheck_Program_Porting_Checklist_GLP1_v1_0.md` (in `Telecheck_v1_10_PRD_Update/` at draft; promoted to bundle as a canonical artifact at v1.10 promotion per Master PRD v1.10 §10.5 cross-reference). The checklist covers Layer 1 catalog confirmation through Layer 4 CCR resolution and is the reference implementation of the porting workflow described above.

**Forms Engine constraints during porting.**

- Source-market form versions are NOT mutated by the port. Pattern A immutability per Forms Engine v2.1 is preserved.
- The target form version is a new artifact under the target operating tenant; tenant scoping (§5) is enforced at authoring and at runtime.
- The target form version inherits the target tenant's brand per §5.2 (consumer DBA per Master PRD v1.10 §17 brand structure).
- The §10 Mode 2 input contract is re-validated for the target market — outputs flowing to AI Mode 2 must conform to the multi-tenant adapted contract for the target operating tenant.

**Cross-references:** Master PRD v1.10 §10.5 (canonical — program catalog architecture, four-layer model); Master PRD v1.10 §17 (brand-structure rules); TYPES v5.2 (`ProgramCatalogEntry`, `ProgramMarketPolicy`); ADR-024 (CCR country-driven configuration); Pattern A (Forms Engine v2.1 immutable per-market form versions); `Telecheck_Program_Porting_Checklist_GLP1_v1_0.md` (worked example — Telecheck-US GLP-1 Heros Health DBA → Telecheck-Ghana GLP-1 Heros Health Ghana DBA); §25.1 (marketing-copy classification); §25.3 (research consent block); Market Rollout Cockpit Slice (activation review and Market Pack abstraction).

**Source delta:** `Telecheck_v1_10_PRD_Update/Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` Row 88 (Cycle C6).

---

## Document control

- **v2.1** — Clarifies §14.3 conversion event taxonomy naming convention per Adversarial Counsel Review v1.0 finding LOW-23 — event names are PostHog snake_case verb_object convention; same names are canonical across all consumers (PostHog, Metabase, AI anomaly detection); no translation or aliasing across systems. Substantive event taxonomy, four-layer separation, builder workflow, and A/B test infrastructure unchanged.
- **v1.10 cycle addition (2026-05-02 — v1.10.1 hygiene cycle physical merge of Phase5 delta Row 51):** Added §25 marketing-copy classification in the L1 (presentation) layer per ADR-027 Decision §4. L4 approval governance verifies molecule-level L1 elements resolve to a `MarketingCopy` entity in `approved` status before publish. Runtime country-conditional gating handled in Acquisition & Engagement Tools Slice §13.
- **v1.10 cycle addition (2026-05-02 — v1.10.1 hygiene cycle physical merge of Phase5 delta Row 40, verify-only):** Added §25.2 verification marker confirming §13 "Telecheck-Ghana tenant" reference is consistent with v1.10 C3 brand-structure vocabulary. No substantive edit; sentinel marker per Phase 5 delta Row 40 verification request.
- **v2.0** — Tier-1 conversion-optimized rewrite. Adds: tenant scoping (per ADR-023), visual builder for tenant admins, transition messages, educational interstitials, trust blocks, pricing displays, cart upsells, save-and-resume, A/B testing native (PostHog-backed), JSON import/export, abandonment recovery, subscription handoff to Refill v2.0, per-tenant analytics dashboard, accessibility explicit (WCAG 2.1 AA), expanded conversion event taxonomy. Preserves clinical-safety rigor of v1.0 (Mode 2 input contract, consent block integration, medication reconciliation, delegate intake patterns).
- **v1.0** — Initial slice (single-tenant Ghana focus). Superseded by v2.0 on 2026-04-25.
- **Next review:** after first tenant deploys a non-trivial customized form via the builder; after first A/B test reaches statistical significance; after first abandonment recovery campaign completes a measurement window.
- **Change discipline:** changes to the four-layer separation, the Mode 2 input contract, the consent block behavior, the variant model, or the tenant scoping model require Engineering Lead + Product Lead sign-off and must be reflected in Contracts Pack v5 FORMS-ENGINE if applicable.
