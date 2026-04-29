# 00 · Type Definitions

**Status:** canonical · **Version:** 5.1 · **Owner:** engineering lead · **Consumers:** all services consuming CCR, Forms Engine, Market Launch; all schema authors

This document defines the complex types referenced by other contracts. It is operative for **shape only** — it does not define policy. Policy lives in the contracts that reference these types.

---

## Clinical types

### InteractionSignal
```
{
  "signal_id":          "sig_<ULID>",
  "check_class":        "drug_drug | drug_condition | drug_lab | pharmacogenomic | special_clinical | herb_drug_pharmacokinetic | herb_drug_pharmacodynamic | herb_condition",
  "severity":           "critical | major | moderate | minor",
  "mechanism":          "<plain-language description>",
  "evidence_source":    "<knowledge base entry reference>",
  "evidence_quality":   "established | emerging | theoretical" | null,
  "recommended_action": "block | warn | monitor",
  "affected_entities":  [ { "type": "medication | condition | lab | herb", "id": "...", "name": "..." } ],
  "confidence":         "high | medium | low",
  "source_engine":      "medication | herb_drug",
  "engine_version":     "<version>",
  "knowledge_base_version": "<version>",
  "timestamp":          "<ISO 8601>"
}
```

Notes: `evidence_quality` is present only for herb-drug signals. Medication engine signals omit this field (evidence is generally well-characterized).

### MedicationRequest
```
{
  "medication_request_id": "mrx_<ULID>",
  "tenant_id":             "tnt_<ULID>",
  "patient_id":            "pat_<ULID>",
  "medication":            { "code": "...", "name": "...", "strength": "...", "formulation": "..." },
  "dosing":                { "instructions": "...", "frequency": "...", "quantity": ... },
  "prescriber_id":         "cli_<ULID>",
  "approval_pathway":      "clinician_reviewed | protocol_authorized",
  "protocol_version":      "<version>" | null,
  "interaction_signals":   [ InteractionSignal ],
  "status":                "active | completed | cancelled | safety_hold",
  "pre_auth_window":       { "start": "<ISO 8601>", "end": "<ISO 8601>" },
  "created_at":            "<ISO 8601>",
  "updated_at":            "<ISO 8601>"
}
```

### ConsentRecord
```
{
  "consent_id":    "con_<ULID>",
  "tenant_id":     "tnt_<ULID>",
  "patient_id":    "pat_<ULID>",
  "consent_type":  "platform | care | data_use | episode | delegation | jurisdictional",
  "scope":         "<what is consented to>",
  "program_id":    "<program>" | null,
  "version":       "<consent version presented>",
  "granted_at":    "<ISO 8601>",
  "revoked_at":    "<ISO 8601>" | null,
  "evidence":      { "method": "tap | signature | verbal", "timestamp": "..." }
}
```

### DelegateAccess
```
{
  "delegation_id":   "del_<ULID>",
  "tenant_id":       "tnt_<ULID>",
  "patient_id":      "pat_<ULID>",
  "delegate_id":     "usr_<ULID>",
  "relationship":    "parent | spouse | child | caregiver | other",
  "scope":           [ "<permitted actions>" ],
  "sensitive_access": false,
  "granted_at":      "<ISO 8601>",
  "revoked_at":      "<ISO 8601>" | null
}
```

---

## AI types

### GuardrailTemplate
```
{
  "template_id":       "grl_<ULID>",
  "name":              "<human-readable name>",
  "scope_definition":  "<what topics and actions the AI may engage with>",
  "refusal_taxonomy":  [ { "category": "...", "behavior": "..." } ],
  "escalation_triggers": [ "<conditions>" ],
  "uncertainty_framing": "<rules>",
  "tone_rules":        "<persona description>",
  "program_boundary":  "<cross-scope behavior>",
  "platform_floor_verified": true,
  "test_suite_id":     "tst_<ULID>",
  "version":           "<version>",
  "review_cadence_months": 6 | 12,
  "deployed_markets":  [ "<market_code>" ]
}
```

### Mode2Evaluation
```
{
  "evaluation_id":       "m2e_<ULID>",
  "tenant_id":           "tnt_<ULID>",
  "patient_id":          "pat_<ULID>",
  "program_id":          "<program>",
  "protocol_id":         "prt_<ULID>",
  "protocol_version":    "<version>",
  "intake_response_id":  "inr_<ULID>",
  "interaction_signals": [ InteractionSignal ],
  "herb_drug_signals":   [ InteractionSignal ],
  "eligibility_result":  "eligible | ineligible | needs_clarification",
  "exclusion_reasons":   [ "<reason>" ] | null,
  "recommendation":      "approve | decline | request_info | escalate",
  "decision_confidence_score": 0.0-1.0,
  "decision_confidence_score_calibration_status": "calibrated | uncalibrated",
  "flagged_concerns":    [ "<concern>" ],
  "ai_model_version":    "<version>",
  "timestamp":           "<ISO 8601>"
}
```

---

## Geographic types

### CountryConfig
```
{
  "country_code":    "<ISO 3166-1 alpha-2>",
  "regulatory":      { "data_residency": "<jurisdictional residency obligations per country; not physical hosting region — see GLOSSARY and INVARIANTS I-028>", "retention_years": ..., "consent_requirements": [...] },
  "clinical":        { "formulary_id": "...", "protocol_library_id": "...", "interaction_engine_scope": "..." },
  "operational":     { "notification_channels": [...], "quiet_hours": {...}, "currency": "...", "payment_rails": [...] },
  "presentation":    { "default_locale": "...", "date_format": "...", "measurement_units": "..." },
  "emergency":       { "emergency_number": "...", "crisis_helpline": "...", "emergency_display": "..." }
}
```

---

## Market Launch types

### ProgramMarketPolicy
See `00-MARKET-LAUNCH.md` for full definition.

### PricingBundle
```
{
  "pricing_bundle_id": "prb_<ULID>",
  "market_code":       "<country_of_care>",
  "program_id":        "<program>",
  "consult_fee":       { "amount": ..., "currency": "..." },
  "medication_pricing": "formulary_based",
  "refill_fee":        { "amount": 0, "note": "medication cost only; no consult fee" },
  "rpm_subscription":  { "monthly_amount": ..., "currency": "..." } | null,
  "delivery_fee":      { "model": "free | flat | distance", "amount": ... | null }
}
```

---

## ID conventions

All entity IDs use ULID format with a type prefix:
- `pat_` — patient
- `usr_` — user (non-patient)
- `cli_` — clinician
- `mrx_` — medication request
- `rfl_` — refill
- `sig_` — interaction signal
- `aud_` — audit event
- `frv_` — intake form version
- `inr_` — intake response
- `pmp_` — program market policy
- `prb_` — pricing bundle
- `prt_` — protocol
- `grl_` — guardrail template
- `m2e_` — Mode 2 evaluation
- `con_` — consent record
- `del_` — delegation
- `pha_` — pharmacy order
- `lab_` — lab document
- `com_` — community post
- `adv_` — adverse event
- `cfg_` — configuration object
- `tnt_` — tenant (added v5.1)
- `tnu_` — tenant user (added v5.1)
- `tnb_` — tenant brand record (added v5.1)
- `cnp_` — country profile (added v5.1)
- `ccc_` — CCRConfig (added v5.1)
- `adp_` — adapter config (added v5.1)
- `sub_` — subscription (added v5.1)
- `sue_` — subscription event (added v5.1)
- `prd_` — product catalog entry (added v5.1)
- `cart_` — cart (added v5.1)
- `cit_` — cart item (added v5.1)
- `dsc_` — discount code (added v5.1)
- `aff_` — affiliate account (added v5.1)
- `afc_` — affiliate conversion (added v5.1)

---

## Tenancy types (added v5.1)

### TenantId
```
"tnt_<ULID>"
```

The canonical tenant identifier. Required field on every PHI-touching record. Required in every audit event envelope and domain event envelope per AUDIT_EVENTS v5.1 and DOMAIN_EVENTS v5.1.

### TenantContext
```
{
  "tenant_id":          "tnt_<ULID>",
  "country":            "<ISO 3166-1 alpha-2>",
  "brand": {
    "display_name":     "<string>",
    "primary_color":    "<hex>",
    "logo_url":         "<URL>",
    ...
  },
  "active_adapters": {
    "payment_provider":           "<adapter slug>",
    "pharmacy_providers":         [ "<adapter slug>", ... ],
    "clinician_network_provider": "<adapter slug>",
    "notification_channels":      [ "<adapter slug>", ... ]
  },
  "ccr_overrides":      { <per-tenant CCR overrides — see CCR_RUNTIME v5.1> }
}
```

Resolved at request time by the Tenant Configuration module per System Architecture v1.2 §13. Cached per session; cache-busted on tenant configuration changes per Tenant Configuration module change-broadcast contract.

### CrossTenantAccessContext
```
{
  "actor_id":              "<actor ULID>",
  "actor_tenant_id":       "tnt_<ULID> | null (null for platform_admin)",
  "target_tenant_id":      "tnt_<ULID>",
  "session_id":            "<break-glass session ULID>",
  "reason":                "<free text justification>",
  "authorized_until":      "<ISO 8601 expiration>",
  "privacy_officer_review_status": "pending | reviewed",
  "tenant_owner_notified": true | false
}
```

Required to be populated in any audit record where `actor_tenant_id != target_tenant_id` per I-024.


---

## Document control

- **v5.0** — Initial Type Definitions contract.
- **v5.1** — Adds `tenant_id` to MedicationRequest, ConsentRecord, DelegateAccess, Mode2Evaluation type schemas. Adds Tenancy types section: TenantId, TenantContext, CrossTenantAccessContext. Adds 14 new ID prefixes for tenant management and ecom entities. Threading remediation per Adversarial Counsel Review v1.0 finding CRITICAL-01 (and Pattern A coverage). Existing types preserved without modification.
