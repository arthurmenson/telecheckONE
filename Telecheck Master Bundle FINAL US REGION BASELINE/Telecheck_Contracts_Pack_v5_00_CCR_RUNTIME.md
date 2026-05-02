# 00 · Country Configuration Registry (CCR) Runtime

**Status:** canonical · **Version:** 5.2 · **Owner:** engineering lead · **Consumers:** all country-specific behavior, all services

This document defines the Country Configuration Registry — the single authority for country-specific runtime behavior in Telecheck. Per I-009, no service hardcodes country assumptions. All country-specific behavior is resolved through the CCR at runtime.

---

## Five country concepts

`country` is never used alone. It is always one of these five:

| Concept | Definition | Change frequency | Change control | ID format |
|---|---|---|---|---|
| `country_of_care` | Where the patient receives clinical services | Rarely (patient transfers care) | Clinical governance | ISO 3166-1 alpha-2 |
| `country_of_residence` | Where the patient lives | Occasionally (patient moves) | Patient self-service | ISO 3166-1 alpha-2 |
| `country_of_registration` | Where the account was created | Never (immutable) | System-assigned at account creation | ISO 3166-1 alpha-2 |
| `country_of_licensure` | Where the clinician is licensed | Rarely (clinician adds license) | Credential verification | ISO 3166-1 alpha-2 |
| `locale` | Language and formatting preference | Anytime (patient preference) | Patient self-service | IETF BCP 47 (e.g., `en-GH`, `fr-GH`, `tw`) |

### Resolution rules

When a service needs country-specific behavior, it resolves in this order:

1. Identify the **governing country concept** for the decision. Clinical behavior → `country_of_care`. **Jurisdictional data residency** (consent regime, retention rules, DPC obligations, sub-processor disclosure, cross-border processing mechanism) → `country_of_residence` or `country_of_care` (whichever is more restrictive). Display formatting → `locale`. Clinician assignment → `country_of_licensure`.
2. Query the CCR with the resolved country code.
3. If the CCR returns a configuration, use it.
4. If the CCR does not have a configuration for that country, the request fails with error code `internal.ccr.country_not_configured` — the system never guesses.

> **Note on physical hosting region (per ADR-026 and INVARIANTS I-028).** The country abstractions in this document govern *jurisdictional* obligations (consent, retention, DPC mechanism, sub-processor disclosure) by `country_of_residence` and `country_of_care`. They do **not** drive physical hosting region selection. Per ADR-026, physical region is fixed at single-region us-east-1 for all tenants at launch; per I-028, physical region is locked as an invariant pending an ADR superseding ADR-026. The CCR `data_residency_region` field carries the physical region code — at launch this is `us-east-1` for every configured country. Future per-country physical-region routing requires a new ADR.

### Cross-country scenarios

When `country_of_care` ≠ `country_of_residence`:
- Clinical protocols, formulary, and regulatory requirements follow `country_of_care`
- **Jurisdictional** data residency (consent regime, retention, DPC, cross-border posture) follows the **more restrictive** of the two countries' requirements
- Tax and invoicing follow `country_of_residence`
- Notification channel preferences follow `country_of_residence` (the patient's phone is registered there)
- Physical hosting region is **not** affected by cross-country scenarios (per ADR-026 / I-028; single-region us-east-1 for all)

---

## CCR configuration schema

```
{
  "country_code":    "<ISO 3166-1 alpha-2>",
  "status":          "active | configured_not_live | retired",
  "version":         "<configuration version ULID>",
  
  "regulatory": {
    "data_residency_region":    "<cloud region code>",
    "retention_years_clinical": 10,
    "retention_years_operational": 7,
    "retention_years_engagement": "<per consent>",
    "consent_requirements":     [ "<consent types required by law>" ],
    "adverse_event_reporting":  { "authority": "<regulatory body>", "format": "<format>", "timeline_hours": 72 },
    "pharmacy_council":         { "name": "...", "license_verification_url": "..." },
    "medical_council":          { "name": "...", "license_verification_url": "..." },
    "data_protection_authority": { "name": "...", "registration_id": "..." }
  },
  
  "clinical": {
    "formulary_id":                "<formulary version ULID>",
    "protocol_library_id":         "<protocol library version ULID>",
    "interaction_engine_scope":    "<knowledge base scope identifier>",
    "herb_drug_engine_scope":      "<herb-drug knowledge base scope>",
    "fake_med_reference_scope":    "<fake med reference data scope>",
    "prescribing_requires_license": true,
    "dispensing_requires_license":  true,
    "controlled_substance_classes": [ "<classes not supported at launch>" ]
  },
  
  "operational": {
    "notification_channels": {
      "primary_engagement":      "whatsapp",
      "critical_transactional":  [ "in_app", "sms" ],
      "fallback":                "sms",
      "fallback_timeout_seconds": 300,
      "quiet_hours": { "start": "22:00", "end": "07:00", "timezone": "Africa/Accra" },
      "quiet_hours_override":    [ "emergency", "crisis", "otp", "safety_hold" ]
    },
    "delivery": {
      "supported_models":        [ "platform_delivery", "partner_delivery", "pickup" ],
      "default_model":           "partner_delivery",
      "sla_hours_urban":         4,
      "sla_hours_periurban":     8,
      "sla_hours_rural":         24
    },
    "currency":                  "GHS",
    "currency_symbol":           "GH₵",
    "payment_rails":             [ "mobile_money_mtn", "mobile_money_vodafone", "mobile_money_airteltigo", "card" ],
    "default_payment_rail":      "mobile_money_mtn",
    "support_hours": { "start": "07:00", "end": "22:00", "timezone": "Africa/Accra" },
    "support_channels":          [ "in_app_chat", "whatsapp", "phone" ]
  },
  
  "presentation": {
    "default_locale":            "en-GH",
    "supported_locales":         [ "en-GH", "tw", "ee", "ga", "ha" ],
    "date_format":               "DD/MM/YYYY",
    "time_format":               "12h",
    "measurement_units":         "metric",
    "phone_country_code":        "+233",
    "phone_format":              "0XX XXX XXXX",
    "address_format":            { "fields": [ "street", "area", "city", "region" ], "postal_code_required": false }
  },
  
  "emergency": {
    "emergency_number":          "112",
    "fire_number":               "192",
    "ambulance_number":          "193",
    "police_number":             "191",
    "crisis_helplines":          [
      { "name": "Ghana Mental Health Authority", "number": "+233 302 662 626", "hours": "24/7" }
    ],
    "emergency_display_locale":  "en-GH",
    "cache_policy":              "always_on_device"
  },

  // marketing block (added v5.2 per ADR-027 Country-Conditional DTC Marketing Posture)
  "marketing": {
    "molecule_level_marketing_permitted": "prohibited | pending_evidence | permitted",
    // marketing_copy_governance_evidence is the EMBEDDED structured object (not a bare ID reference).
    // Per ADR-027 / Master PRD §13.2: `permitted` activation is gated on completeness of every required
    // field below. The runtime validator MUST reject any state transition to `permitted` if any required
    // sub-field is null. Required-field set: regulatory_jurisdiction, regulatory_authority,
    // regulatory_interpretation_artifact_id, interpretation_date, scope, prohibited_claim_classes (≥0 items;
    // the array MUST exist), governance_lead_designation_artifact_id. ethics_review_concurrence_artifact_id
    // is OPTIONAL (only required if cross-functional clinical-safety review specified by the local jurisdiction).
    "marketing_copy_governance_evidence": {
      "regulatory_jurisdiction":                  "<jurisdiction code>" | null,
      "regulatory_authority":                     "<regulatory body>" | null,
      "regulatory_interpretation_artifact_id":    "<artifact ULID>" | null,
      "interpretation_date":                      "<ISO 8601>" | null,
      "scope":                                    "<scope of permitted molecule-level marketing>" | null,
      "prohibited_claim_classes":                 [ "<claim taxonomy class>" ] | null,
      "governance_lead_designation_artifact_id":  "<artifact ULID>" | null,
      "ethics_review_concurrence_artifact_id":    "<artifact ULID>" | null
    } | null,
    "marketing_governance_review_cadence_months": 6 | 12 | null,
    "marketing_governance_lead_designation_artifact_id": "<artifact ULID>" | null
  },

  // research block (added v5.2 per ADR-028 Research Data Partnership Posture A as Release 2 goal)
  "research": {
    "research_data_partnership_active": "inactive | consent_only | active",
    // research_permitted_data_domains is the closed-enum country gate for DSA / cohort / export scope.
    // Per ADR-028 / Master PRD §15.3: only the four enumerated values may appear; expansion of the enum
    // requires ADR amendment (per ADR-028 Decision §6). Values listed here are the country-level upper bound;
    // per-DSA scope MUST be a subset.
    "research_permitted_data_domains": [
      "chronic_disease_longitudinal" | "ncd_surveillance" | "pharmacovigilance_signal" | "population_health_aggregate"
    ],
    "research_ethics_review_body": {
      "name":                    "<body name>",
      "jurisdiction":            "<ISO 3166-1 alpha-2>",
      "approval_reference_id":   "<external reference>",
      "approval_validity_from":  "<ISO 8601>",
      "approval_validity_to":    "<ISO 8601>",
      "approval_scope":          "<scope description>",
      "per_dsa_review_required": true | false
    } | null,
    "de_identification_standard": "safe_harbor_plus_k_anonymity",
    "k_min_default": 11,
    "cross_border_research_transfer_permitted": "prohibited | permitted_with_counsel_artifact | permitted_unrestricted",
    "cross_border_research_transfer_evidence": {
      "counsel_approval_artifact_id":  "<artifact ULID>" | null,
      "transfer_mechanism":            "<mechanism description>" | null,
      "recipient_country":             "<ISO 3166-1 alpha-2>" | null,
      "onward_transfer_policy":        "<policy description>" | null,
      "dsa_alignment_artifact_id":     "<artifact ULID>" | null
    } | null
  }
}
```

### Initial values per launch country (added v5.2)

| Country (CCR config) | `marketing.molecule_level_marketing_permitted` | `marketing.marketing_copy_governance_evidence` (structured object) | `research.research_data_partnership_active` | `research.research_permitted_data_domains` | `research.research_ethics_review_body` | `research.cross_border_research_transfer_permitted` |
|---|---|---|---|---|---|---|
| US (Telecheck-US, Heros Health DBA) | `prohibited` (permanent per FDA + state telehealth advertising rules per Master PRD §13.2) | `null` (not applicable when prohibited; runtime validator MUST reject any `permitted` transition if any required sub-field is null) | **`inactive` at launch (patch 2026-05-02 per Codex Round-2 Scope 3 HIGH-1 finding)** — was previously `consent_only`, but `research_ethics_review_body` is TBD pre-launch and `inactive → consent_only` requires REC approval reference + consent text version pin populated. Forms Engine `research_data_use_consent_block` does not render and no `research.consent_*` events emit until the `inactive → consent_only` activation gate is satisfied per MARKET_LAUNCH v5.1 (Cockpit dependency check). | `[]` empty at launch (no domains active until export pipeline activates Release 2; first DSA target per §25 Q12 sets the initial subset) | TBD pre-launch per §24 — when populated, it becomes a precondition for `inactive → consent_only` transition | `permitted_with_counsel_artifact` (default; per-DSA evaluation; counsel artifact required before any DSA activation) |
| GH (Telecheck-Ghana, Heros Health Ghana DBA) | `pending_evidence` at launch (regulatory engagement underway; molecule-level surfaces remain disabled until evidence object populated to required-field completeness per ADR-027) | `null` (until populated to all required-field completeness) | **`inactive` at launch (patch 2026-05-02 per Codex Round-2 Scope 3 HIGH-1 finding)** — was previously `consent_only`, but `research_ethics_review_body` is TBD pre-launch and `inactive → consent_only` requires REC approval reference + consent text version pin populated. Forms Engine `research_data_use_consent_block` does not render and no `research.consent_*` events emit until the `inactive → consent_only` activation gate is satisfied per MARKET_LAUNCH v5.1 (Cockpit dependency check). REC engagement candidates: Ghana Health Service REC or Noguchi Memorial Institute IRB per §24. | `[]` empty at launch (subset of the closed enum `chronic_disease_longitudinal | ncd_surveillance | pharmacovigilance_signal | population_health_aggregate`; populated when first DSA activates Release 2) | TBD pre-launch — Ghana Health Service REC or Noguchi Memorial Institute IRB candidates per §24 — when populated, it becomes a precondition for `inactive → consent_only` transition | `permitted_with_counsel_artifact` (Ghana DPA cross-border transfer rules apply per §22.3; counsel artifact required before research data leaves country) |

**Runtime validator rule (added v5.2 patch 2026-05-02 per Codex Round-2 Scope 3 HIGH-1 finding; strengthened 2026-05-02 per Codex Round-7 Scope 3 MEDIUM-1 finding to enumerate every required `research_ethics_review_body` sub-field):** The CCR runtime validator MUST reject any state transition setting `research_data_partnership_active = consent_only` UNLESS **every** sub-field of `research_ethics_review_body` is non-null AND `approval_validity_to >= now`. The required-sub-field set is: `name`, `jurisdiction`, `approval_reference_id`, `approval_validity_from`, `approval_validity_to`, `approval_scope`, `per_dsa_review_required` (all 7 sub-fields). The validator MUST list which specific sub-field(s) failed in the rejection error so operators can remediate without guessing. This closes the failure mode where a tenant could collect 5th-tier consent (and emit `research.consent_granted` audit events) before an approved REC artifact exists. The `inactive → consent_only` gate per MARKET_LAUNCH v5.1 Stage 1 (6 conditions) is the canonical activation review for this transition; the CCR runtime validator is the runtime backstop, aligned exactly to Stage 1 condition 1.

### Reference to invariants (added v5.2)

CCR research keys are bounded by:

- **I-029** — research data export 5-condition reject-unless gate (canonical full statement at INVARIANTS v5.2 I-029; *updated 2026-05-02 per Codex Round-11 Scope 2 HIGH-1 finding from prior 4-condition shorthand to canonical 5-condition gate matching INVARIANTS / TYPES / AUDIT_EVENTS / OpenAPI / STATE_MACHINES / GOVERNANCE_CONTROLS*): (1) `dsa_status_at_export = active` AND `research_data_partnership_active = active` for the cohort's `country_of_care` (Stage 2 activation precondition); (2) `k_threshold_actual >= k_min_required` (per-DSA k_min_required ≥ CCR `k_min_default = 11`; per-DSA increases permitted, decreases below `k_min_default` prohibited); (3) `permitted_data_domains_at_export` matches the `research.export_initiated` snapshot (no CCR drift mid-export; per-DSA domains MUST be subset of country-level CCR `research_permitted_data_domains`); (4) `consent_cohort_snapshot_hash_completed = consent_cohort_snapshot_hash_initiated` (cohort unchanged mid-export); (5) every contributing patient has active `ResearchConsent` at completion-time evaluation (`granted_at` non-null, `revoked_at` null). Failed delivery MUST emit `research.export_completed(status=invalidated)` with canonical `invalidation_reason` enum value paired with `signal_enforcement_trigger` Category B per I-003.
- **I-030** — care delivery surfaces MUST NOT branch on `research_data_partnership_active` or research consent status
- **I-031** — research export events emit at `audit_sensitivity_level = high_pii`

CCR marketing keys are bounded by ADR-027 + Master PRD §13.2 working definition; surface controls per AUDIT_EVENTS `marketing.surface_rendered` / `marketing.surface_drift` events.

### Emergency information caching (I-017)

Emergency information from the `emergency` block is:
- Downloaded to device cache at first login and after every CCR config update
- Available offline — no network request required to display emergency numbers
- Updated in background when network is available — never blocks on stale cache
- Rendered in a dedicated emergency screen accessible from every app surface via a persistent icon
- Not gated behind authentication — if the app is open, emergency numbers are visible

---

## Notification channel hierarchy (v5)

For Ghana launch:

| Notification type | Primary channel | Fallback | Quiet hours behavior |
|---|---|---|---|
| OTP / verification | SMS | — | Override (always send) |
| Emergency / crisis | SMS + in-app push | — | Override (always send) |
| SAFETY_HOLD notification | SMS + in-app push + WhatsApp | — | Override (always send) |
| Refill approved / declined | WhatsApp | SMS after 5 min | Defer to morning |
| Delivery status | WhatsApp | SMS after 5 min | Defer to morning |
| Lab results ready | WhatsApp | SMS after 5 min | Defer to morning |
| Clinician decision | WhatsApp | SMS after 5 min | Defer to morning |
| Appointment reminder | WhatsApp | SMS after 5 min | Defer (send at quiet hours end) |
| Refill reminder | WhatsApp | In-app only | Defer to morning |
| Program nudge | WhatsApp | In-app only | Defer to morning |
| RPM metric reminder | WhatsApp | In-app only | Defer to morning |
| Community activity | In-app only | — | Suppress |

All notifications are written to the in-app inbox regardless of external delivery status — the inbox is the persistent record.

### Patient channel preferences

Patients can configure per-notification-type preferences (WhatsApp on/off, SMS on/off for non-critical types). Patients **cannot** opt out of: OTP, emergency, crisis, SAFETY_HOLD, clinician decisions about their care. These are safety-critical and always delivered.

---

## Degraded mode

When the CCR service is unreachable:

| Scenario | Behavior |
|---|---|
| Emergency information needed | Display from device cache (I-017) — always available |
| Patient initiates clinical workflow | Hold until CCR available — cannot determine protocols, formulary, or regulatory rules |
| Patient browses existing data | Allow — cached patient data display does not require CCR |
| Clinician reviews pending queue | Allow if queue was loaded before CCR went down |
| New patient registration | Hold — cannot determine country configuration |
| Notification delivery | Use last-known channel config; flag for reconciliation |

Patient-facing message during CCR degradation: "Limited connectivity — some features may be temporarily unavailable. Emergency information is always available."

CCR downtime exceeding 15 minutes pages on-call engineering.

---

## Change control

CCR configuration changes are **Category B** audit events. Specific rules:

| Change type | Approval requirement | Audit category |
|---|---|---|
| Regulatory (data residency, retention, consent) | Dual control (I-015) + legal review | B |
| Clinical (formulary, protocol library, engine scope) | Dual control (I-015) + clinical governance lead | B |
| Operational (notification channels, delivery SLA, payment rails) | Single approver (operations lead) | B |
| Presentation (locale, formatting) | Single approver (product lead) | C |
| Emergency (emergency numbers, crisis helplines) | Dual control (I-015) + immediate deployment | B |
| Marketing (`molecule_level_marketing_permitted`, `marketing_copy_governance_evidence`) — added v5.2 per ADR-027; **Country Launch Director language strengthened SHOULD → MUST 2026-05-02 per Codex Scope 3 HIGH-1 finding** | Per ADR-027 v0.5 activation chain: Marketing copy governance lead + Clinical Safety Officer + Regulatory Affairs Lead (triple sign-off). **Country Launch Director MUST be in the approval chain for the `prohibited` → `pending_evidence` and `pending_evidence` → `permitted` state transitions** (final activation gate per Master PRD §13.2 + Market Launch contract). The state transition is **rejected if the Country Launch Director sign-off is absent**, aligning with MARKET_LAUNCH v5.1 marketing posture activation gate condition 5. | B |
| Research (`research_data_partnership_active`, `research_ethics_review_body`, `research_permitted_data_domains`, `cross_border_research_transfer_permitted`) — added v5.2 per ADR-028; **Country Launch Director language strengthened SHOULD → MUST 2026-05-02 per Codex Scope 3 HIGH-1 finding** | Per ADR-028 v0.4 activation chain: Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer + Product Lead (quad sign-off). For the `consent_only` → `active` state transition (export pipeline activation), additional REC concurrence is required per `research_ethics_review_body.per_dsa_review_required`. **Country Launch Director MUST be in the approval chain for per-country activation per Market Launch contract.** The state transition is **rejected if the Country Launch Director sign-off is absent**, aligning with MARKET_LAUNCH v5.1 research data partnership activation gate condition 11. | B |

A CCR change affecting an active market triggers an automated dependency check: does this change affect any active ProgramMarketPolicy, protocol, formulary, or published form version? If yes, the change requires Market Launch review before deployment.

---

## Integration testing contract

Before a new country configuration goes live:
1. All five country concepts resolve correctly for test patients
2. Notification channel fallback works (WhatsApp → SMS → in-app)
3. Emergency information renders offline
4. Payment rails connect to the payment provider
5. Delivery model is operational
6. Date, time, currency, and phone number formatting render correctly
7. All regulatory-required consent types are configured
8. Formulary and protocol library are assigned and active

---

## Tenant ↔ Country relationship (added v5.1)

Per ADR-023 (multi-tenancy Model A) and ADR-024 (country-driven config), each tenant has a `country` attribute that is the primary driver of its CCR resolution context.

### Tenant country attribute

Every tenant carries `country` (ISO 3166-1 alpha-2). At launch:
- Heros Health tenant: `country = "US"`
- Telecheck-Ghana tenant: `country = "GH"`

The tenant `country` attribute is the default resolution context for all five country concepts when a request originates in that tenant's scope:
- `country_of_care` defaults to tenant.country (overridden per-patient if patient receives care across markets — rare at launch; out of scope unless explicitly configured)
- `country_of_registration` defaults to tenant.country (immutable per account)
- `country_of_licensure` defaults to tenant.country (clinician roster scoped to tenant per Tenant Configuration module)
- `country_of_residence` resolved from patient profile data
- `locale` resolved from patient profile data

### Tenant country immutability

A tenant's `country` attribute is treated as immutable post-tenant-creation. Per I-026, country attribute changes are blocked at the Tenant Admin level — only Platform Admin may modify, only via break-glass, only with documented rationale, only when no active patients in flight. Country change cascades to:
- Regulatory module activation (different country = different regulatory module)
- Payment processor selection
- Format configurations (date, currency, phone)
- Integration adapter availability lists

### Country profile vs CCR

Two distinct configuration objects:

- **CountryProfile** (per CDM v1.2 §4.3) — platform-level authoritative country definition: regulatory module reference, available payment processors, format settings, available integration adapters. One CountryProfile per ISO 3166-1 alpha-2 code that the platform supports. Authored by Platform Admin.

- **CCRConfig** (per CDM v1.2 §4.4) — per-tenant override layer: which adapters from the country's available list this tenant uses; tenant-specific notification channel preferences; tenant-specific consent text variants; tenant-specific operational SLA targets. One CCRConfig per (tenant, country) — typically one per tenant since each tenant has a single country at launch.

Resolution at runtime: `effective_config = CountryProfile(tenant.country) ⊕ CCRConfig(tenant.id, tenant.country)` where `⊕` is "tenant-specific overrides win for the keys they specify; country defaults apply for the rest."

### Per-tenant adapter selection (per ADR-024 promised in Session 2)

For each integration domain (PaymentProvider, ClinicianNetworkProvider, PharmacyProvider, NotificationChannelProvider, OCRProvider, etc.), the CountryProfile defines the country's available adapters. Tenant CCRConfig selects from those.

| Country | Available PaymentProviders | Available PharmacyProviders | Available NotificationChannels |
|---|---|---|---|
| US | Stripe (default), Stripe Connect (for affiliate payouts) | Truepill, Honeybee, Capsule, Alto | Plivo SMS, MessageBird SMS, Postmark email, native push |
| GH | Paystack (default), MTN MoMo direct, Vodafone Cash direct | Telecheck-Ghana operated pharmacy + Ghana partner pharmacies | Hubtel SMS, mNotify SMS, 360dialog WhatsApp, Postmark email, native push |

Tenants enable specific adapters via Admin Backend per-tenant settings (per Admin Backend Slice v1.1 §5.4 and §5.8). Adapter switching mid-flight (e.g., adding a second pharmacy adapter for redundancy) is a Category B audit event and must respect Pharmacy + Refill v2.X §6.1 routing rules.

### Cross-tenant CCR isolation

A tenant's CCRConfig is private to that tenant. Tenant Admin sees and edits their own tenant's CCRConfig. Platform Admin sees all tenants' CCRConfigs (with audit on access). No cross-tenant CCR sharing at launch.

### Country addition workflow (Phase 2 Nigeria, etc.)

When the platform adds support for a new country (e.g., Nigeria for the Nigeria Investor Pitch):
1. Engineering produces the regulatory module for the new country
2. Platform Admin creates the CountryProfile with the country's available adapters
3. Operations onboards integration partners (payment processor, pharmacies, etc.)
4. A new tenant in that country is created with `country = "NG"`
5. Tenant CCRConfig is configured with selected adapters
6. Validation per Integration testing contract (above) before tenant goes live

This workflow is governed by Market Rollout Cockpit Slice PRD; CCR configuration is one component of the broader market launch playbook.

---

## Document control

- **v5.2 (2026-05-02 per v1.10.1 hygiene cycle physical merge of v1.10 PRD Update Cycle delta artifact)** — Adds top-level `marketing` block (4 keys: `molecule_level_marketing_permitted` 3-state enum, `marketing_copy_governance_evidence` embedded structured object with required-field completeness gating before `permitted`, `marketing_governance_review_cadence_months`, `marketing_governance_lead_designation_artifact_id`) per ADR-027. Adds top-level `research` block (7 keys: `research_data_partnership_active` 3-state enum, `research_permitted_data_domains` closed-enum country gate, `research_ethics_review_body` structured object, `de_identification_standard`, `k_min_default = 11`, `cross_border_research_transfer_permitted` enum, `cross_border_research_transfer_evidence` companion structured object) per ADR-028. Adds per-country initial values (**US `prohibited` permanent (marketing) + `inactive` (research) at launch; GH `pending_evidence` (marketing) + `inactive` (research) at launch** — *updated 2026-05-02 per Codex Round-9 Scope 3 HIGH-1 finding from prior `consent_only` shorthand to canonical `inactive` defaults per Round-3/4/5 substantive patches; the prior Doc-control summary listing `consent_only` was stale and is superseded; per-country `inactive → consent_only` requires the MARKET_LAUNCH v5.1 Stage 1 6-condition gate*). Adds change-control rows for marketing (triple sign-off per ADR-027 v0.5 + Country Launch Director **MUST** on activation transitions per Round-2 patch) and research (quad sign-off per ADR-028 v0.4 + REC concurrence on `consent_only` → `active`). Adds Reference to invariants section (I-029 5-condition gate, I-030, I-031). Adds runtime validator rule rejecting `consent_only` transitions when any of the 7 `research_ethics_review_body` sub-fields is null (Round-2 + Round-7 strengthening). Substantive content originally documented in `Telecheck_v1_10_PRD_Update/Phase3_Group2_Contracts_v1_10_Edits_2026-05-01.md` §CCR_RUNTIME; physical merge applied 2026-05-02 per v1.10.1 hygiene cycle; subsequent Round-1 through Round-9 Codex EXIT findings patched 2026-05-02.
- **v5.1 (refreshed 2026-04-26 per ADR-026, US Region Migration Cycle U-003)** — Clarified resolution rule 1 to specify that `country_of_residence` / `country_of_care` drive **jurisdictional** data residency (consent, retention, DPC obligations, sub-processor disclosure, cross-border processing mechanism), not physical hosting region. Added explicit note on physical hosting region pinned to ADR-026 and I-028: single-region us-east-1 at launch for all tenants; CCR `data_residency_region` field carries the physical region code. Cross-country scenarios clarified to specify physical hosting region is unaffected by cross-country scenarios. No runtime model redesigned; clarification of existing rule only. No version bump.
- **v5.0** — Initial CCR Runtime contract.
- **v5.1** — Adds Tenant ↔ Country relationship section per ADR-023 multi-tenancy Model A and ADR-024 country-driven configuration. Defines tenant.country attribute as primary CCR resolution driver; per-tenant adapter selection mechanics; CountryProfile vs CCRConfig distinction; cross-tenant CCR isolation; country addition workflow for Phase 2 markets. This is the explicitly-promised CCR-RUNTIME extension that was promised in Session 2's scope statement (Registry v2.5 §7) but not delivered until this remediation cycle. Threading remediation per Adversarial Counsel Review v1.0 finding CRITICAL-01. Existing five-country-concepts model, resolution rules, configuration schema, change control, and integration testing contract preserved without modification.
