# 00 · Type Definitions

**Status:** canonical · **Version:** 5.4 · **Owner:** engineering lead · **Consumers:** all services consuming CCR, Forms Engine, Market Launch; all schema authors

**v5.3 hygiene cycle 2026-05-20 (P-027 Phase B):** 4 new canonical types added (full type-spec in `Telecheck_Contracts_Pack_v5_2_to_v5_3_Amendment.md` §6):
- **`dispatch_obligation_state`** enum (per Sprint 16 §3 SD2 8-state machine: `accepted | accepted_partition_degraded | provider_invocation_pending | provider_invoked | delivery_confirmed | provider_invocation_failed | terminal_failed | reconciled`).
- **`mode2_autonomy_level`** enum (`L2 | L3 | L4` per ADR-029 + Sprint 12 §4).
- **`mode2_workflow_outcome`** enum (`completed | failed | reverted | cancelled | abandoned_expired`).
- **`data_class`** enum (7 classes per Sprint 13 §2.2: `pii_demographic | pii_clinical | pii_sensitive_clinical | pii_financial | pii_conversation | pii_audit_payload | pii_research_consented`).

v1.10.1 hygiene-cycle pattern preserved.

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
  "tenant_id":             "Telecheck-{country}",
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
  "tenant_id":     "Telecheck-{country}",
  "patient_id":    "pat_<ULID>",
  "consent_type":  "platform | care | data_use | episode | delegation | jurisdictional | research_data_use",
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
  "tenant_id":       "Telecheck-{country}",
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
  "tenant_id":           "Telecheck-{country}",
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
- ~~`tnt_` — tenant (added v5.1)~~ **SUPERSEDED 2026-05-02 per CDM v1.2 §4.1 SPEC ISSUE resolution.** Tenant identifiers no longer use the ULID prefix convention; they use the operating-tenant identifier format `Telecheck-{country}` (e.g., `Telecheck-US`, `Telecheck-Ghana`) per Master PRD v1.10 §17 + Glossary v5.2 C3 brand structure. Existing `tnt_` references in archived audit records remain valid for backward-compat reads only; new emissions MUST use the `Telecheck-{country}` format. `tnu_`/`tnb_` etc. (tenant user / tenant brand) ID prefixes are unaffected — those are sub-entity ULIDs.
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
- `mkc_` — marketing copy (added v5.2)
- `mge_` — marketing copy governance evidence (added v5.2)
- `dsa_` — data sharing agreement (added v5.2)
- `reb_` — research ethics review body (added v5.2)
- `chd_` — cohort definition (added v5.2)
- `rex_` — research data export (added v5.2)
- `pau_` — policy authorization (added v5.2)
- `prg_` — program catalog entry (added v5.2)

---

## Tenancy types (added v5.1)

### TenantId
```
"Telecheck-{country}"
```

The canonical tenant identifier. Required field on every PHI-touching record. Required in every audit event envelope and domain event envelope per AUDIT_EVENTS v5.1 and DOMAIN_EVENTS v5.1.

### TenantContext
```
{
  "tenant_id":          "Telecheck-{country}",                  // operating-tenant identifier per CDM v1.2 §4.1; canonical source of truth (mirrors `tenants.id`)
  "country":            "<ISO 3166-1 alpha-2>",                 // mirrors `tenants.country`
  "display_name":       "Telecheck-{country}",                  // operating-tenant label for platform-admin UI; mirrors `tenants.display_name` (added v5.2 patch 2026-05-02 per CDM SPEC ISSUE P-010 closure)
  "consumer_dba":       "Heros Health{ Ghana | <variant>}",    // patient-facing brand per C3; mirrors `tenants.consumer_dba` (NEVER write `tenant_id` to a patient surface — write this) (added v5.2 patch 2026-05-02)
  "legal_entity":       "<incorporated subsidiary>",            // e.g., 'Telecheck Health LLC'; mirrors `tenants.legal_entity` (added v5.2 patch 2026-05-02)
  "consumer_subdomain": "<subdomain>",                          // e.g., 'heroshealth.com'; mirrors `tenants.consumer_subdomain` (added v5.2 patch 2026-05-02)
  "brand": {
    "display_name":     "<string>",                             // patient-facing display name (typically equals consumer_dba; kept here for backward-compat with surfaces that already read brand.display_name)
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
  "ccr_overrides":      { <per-tenant CCR overrides — see CCR_RUNTIME v5.2> }
}
```

Resolved at request time by the Tenant Configuration module per System Architecture v1.2 §13. Cached per session; cache-busted on tenant configuration changes per Tenant Configuration module change-broadcast contract.

**Field-set alignment with CDM v1.2 §4.1 (Codex spec-r2 MEDIUM closure 2026-05-02):** the top-level operating-tenant identity fields (`tenant_id`, `country`, `display_name`, `consumer_dba`, `legal_entity`, `consumer_subdomain`) mirror the canonical `tenants` table columns 1:1. Patient-facing surfaces MUST source the consumer brand from `consumer_dba`, NEVER from `tenant_id`. Generated client/server DTOs from this contract are the binding shape for the OpenAPI `POST /v0/tenants` create response, the `GET /v0/tenants/{id}` retrieve response, and any update endpoint response — all return TenantContext with the full top-level field set populated.

### CrossTenantAccessContext
```
{
  "actor_id":              "<actor ULID>",
  "actor_tenant_id":       "Telecheck-{country} | null (null for platform_admin)",
  "target_tenant_id":      "Telecheck-{country}",
  "session_id":            "<break-glass session ULID>",
  "reason":                "<free text justification>",
  "authorized_until":      "<ISO 8601 expiration>",
  "privacy_officer_review_status": "pending | reviewed",
  "tenant_owner_notified": true | false
}
```

Required to be populated in any audit record where `actor_tenant_id != target_tenant_id` per I-024.


---

## Marketing types (added v5.2)

### MarketingCopy
```
{
  "marketing_copy_id":             "mkc_<ULID>",
  "tenant_id":                     "Telecheck-{country}",
  "country_of_care":               "<ISO 3166-1 alpha-2>",
  "version":                       "<semver>",
  "surface_type":                  "landing | email | banner | educational | testimonial | social",
  "classification":                "molecule_level | program_level",
  "molecule_references":           [ { "code": "<RxNorm or equivalent>", "name": "<display>" } ] | null,
  "program_references":            [ "<program_id>" ] | null,
  "rendered_claim_classes":        [ "<claim taxonomy class>" ],
  "governance_review_reference_id": "<governance review artifact ULID>" | null,
  "approved_at":                   "<ISO 8601>" | null,
  "approval_validity_until":       "<ISO 8601>" | null,
  "review_cadence_months":         6 | 12,
  "status":                        "draft | under_review | approved | suspended | retired",
  "created_at":                    "<ISO 8601>",
  "updated_at":                    "<ISO 8601>"
}
```

Notes: `classification = molecule_level` requires `molecule_references` populated AND a non-null `governance_review_reference_id` AND `status = approved` before any `marketing.surface_rendered` event may emit per I-013-class published-content-version-immutability discipline. Drift between rendered surface and `marketing_copy_version_id` triggers `marketing.surface_drift` and auto-suspension.

### MarketingCopyGovernanceEvidence
```
{
  "evidence_id":                              "mge_<ULID>",
  "tenant_id":                                "Telecheck-{country}",
  "country_of_care":                          "<ISO 3166-1 alpha-2>",
  "regulatory_jurisdiction":                  "<jurisdiction code>",
  "regulatory_authority":                     "<regulatory body>",
  "regulatory_interpretation_artifact_id":    "<artifact ULID>",
  "interpretation_date":                      "<ISO 8601>",
  "scope":                                    "<scope of permitted molecule-level marketing>",
  "prohibited_claim_classes":                 [ "<claim taxonomy class>" ],
  "governance_lead_designation_artifact_id":  "<artifact ULID>",
  "ethics_review_concurrence_artifact_id":    "<artifact ULID>" | null
}
```

Required when CCR `molecule_level_marketing_permitted = permitted` per CCR_RUNTIME v5.2 marketing block / Master PRD §13.2.

---

## Research data types (added v5.2)

### ResearchConsent (added v5.2 patch 2026-05-02 per Codex Scope 2 MEDIUM finding — explicit subtype of ConsentRecord)

```
{
  "consent_id":                              "con_<ULID>",
  "tenant_id":                               "Telecheck-{country}",
  "patient_id":                              "pat_<ULID>",
  "consent_type":                            "research_data_use",
  "scope":                                   "<scope description per CCR research_ethics_review_body.approval_scope>",
  "version_presented":                       "<consent text version per CCR research_ethics_review_body.approval_reference_id>",
  "asymmetric_retraction_acknowledgment":    true,
  "granted_at":                              "<ISO 8601>",
  "revoked_at":                              "<ISO 8601> | null",
  "revocation_reason":                       "<text>" | null,
  "revocation_effective_at":                 "<ISO 8601>" | null,
  "evidence":                                { "method": "tap | signature | verbal", "timestamp": "..." }
}
```

A specialization of ConsentRecord with `consent_type = research_data_use` (added to the canonical ConsentRecord enum above per the same patch). Required fields beyond ConsentRecord: `scope`, `version_presented`, `asymmetric_retraction_acknowledgment` (must be `true` at grant time per Master PRD §15.2 — patient explicitly acknowledged that aggregate data already shared cannot be retracted). `revoked_at` and revocation companion fields populate on revoke; the entity is immutable per consent immutability discipline (a new grant after revoke creates a new ResearchConsent entity with a fresh `consent_id`). Per I-030, no care-delivery state machine MAY consume ResearchConsent state events. Per I-029, the export pipeline gates on per-patient `granted_at` non-null AND `revoked_at` null at completion-time evaluation.

### DataSharingAgreement
```
{
  "dsa_id":                          "dsa_<ULID>",
  "version":                         "<semver>",
  "partner_id":                      "<partner ULID>",
  "partner_name":                    "<display>",
  "tenant_scope":                    [ "Telecheck-{country}" ],
  "permitted_data_domains":          [ "chronic_disease_longitudinal | ncd_surveillance | pharmacovigilance_signal | population_health_aggregate" ],
  "k_min_required":                  11,
  "ethics_review_body_reference":    "<ResearchEthicsReviewBody ID>",
  "cross_border_transfer_mechanism": "<DSA-specific mechanism>",
  "validity_from":                   "<ISO 8601>",
  "validity_to":                     "<ISO 8601>",
  "status":                          "draft | active | suspended | expired | retired",
  "approval_chain":                  [ { "role": "...", "actor_id": "...", "approved_at": "..." } ],
  "created_at":                      "<ISO 8601>",
  "updated_at":                      "<ISO 8601>"
}
```

### ResearchEthicsReviewBody
```
{
  "review_body_id":            "reb_<ULID>",
  "name":                      "<body name>",
  "jurisdiction":              "<ISO 3166-1 alpha-2>",
  "approval_reference_id":     "<external reference>",
  "approval_validity_from":    "<ISO 8601>",
  "approval_validity_to":      "<ISO 8601>",
  "approval_scope":            "<scope description>",
  "per_dsa_review_required":   true | false
}
```

### CohortDefinition
```
{
  "cohort_definition_id":      "chd_<ULID>",
  "tenant_id":                 "Telecheck-{country}",
  "version":                   "<semver>",
  "dsa_id":                    "<DSA ULID>",
  "dsa_version":               "<semver>",
  "inclusion_criteria_artifact_id": "<artifact ULID>",
  "exclusion_criteria_artifact_id": "<artifact ULID>",
  "requested_data_domains":    [ "<closed enum value>" ],
  "k_threshold_target":        11,
  "consent_cohort_snapshot_hash": "<SHA-256>",
  "status":                    "draft | approved | exporting | completed | invalidated",
  "created_at":                "<ISO 8601>"
}
```

### ResearchDataExport
```
{
  "export_id":                          "rex_<ULID>",
  "tenant_id":                          "Telecheck-{country}",
  "country_of_care":                    "<ISO 3166-1 alpha-2>",
  "cohort_definition_id":               "<CohortDefinition ULID>",
  "cohort_version":                     "<semver>",
  "dsa_id":                             "<DSA ULID>",
  "dsa_version":                        "<semver>",
  "dsa_status_at_export":               "active | expired | suspended | retired",
  "permitted_data_domains_at_export":   [ "<closed enum value>" ],
  "requester_id":                       "<requester ULID>",
  "requester_role":                     "<role>",
  "requester_partner_id":               "<partner ULID>",
  "exported_field_set":                 [ "<field schema fragment>" ],
  "k_min_required":                     11,
  "k_threshold_actual":                 "<integer; >= k_min_required for status=completed; may be < k_min_required when status=invalidated>",
  "suppressed_cell_count":              "<integer>",
  "consent_cohort_snapshot_hash_initiated": "<SHA-256; recorded at research.export_initiated>",
  "consent_cohort_snapshot_hash_completed": "<SHA-256; recorded at completion-time check; null when status=invalidated due to early abort>",
  "export_artifact_hash":               "<SHA-256> | null (null when status=invalidated; non-null when status=completed)",
  "grant_artifact_id":                  "<pau_<ULID> for PolicyAuthorization OR named-equivalent grant artifact ID per CCR_RUNTIME v5.2 research_export_authorized_signers attestation evidence-locker; required at status=initiated; re-validated at status=completed per OpenAPI 6-condition gate; added v5.2 patch 2026-05-02 per Codex Round-12 Scope 3 HIGH-2 finding>",
  "grant_artifact_type":                "policy_authorization | signers_attestation | <future grant types>",
  "grant_artifact_validity_to":         "<ISO 8601; grant expiry timestamp; export MUST reject delivery if grant_artifact_validity_to < completion-time>",
  "grant_signer_chain_attestation_hash":"<SHA-256 hash of the multi-party signer chain attested at initiation; re-validated at completion to ensure no signer was rescinded>",
  "grant_validation_at_initiated_at":   "<ISO 8601; grant validation timestamp at initiation>",
  "grant_validation_at_completed_at":   "<ISO 8601; grant re-validation timestamp at completion> | null (null when status=invalidated due to early abort before completion-time check)",
  "invalidation_reason":                "dsa_inactive | k_anonymity_violation | permitted_domain_drift | consent_cohort_change | consent_revocation_mid_export | grant_artifact_invalidated" | null,  // Patch 2026-05-02 per Codex Round-2 Scope 2 HIGH-1 finding: this enum is the canonical 6-value shared enum mirrored in AUDIT_EVENTS v5.2 §5 research.export_completed payload + STATE_MACHINES v1.1 ResearchExportRequest reject-unless rule + GOVERNANCE_CONTROLS v5.2 §7.2 incident matrix + OpenAPI v0.2 /research/exports/{export_id}/complete contract. All four contracts MUST stay aligned. No separate "other" bucket is permitted — all 6 conditions of the OpenAPI export-complete gate map deterministically to one of the 6 values, including grant_artifact_invalidated for the per-export grant-artifact failure (added 2026-05-02 per Codex Round-12 Scope 3 HIGH-1 + post-merge adversarial review HIGH-1 + verify-r2 HIGH-1 finding closing the inline-comment drift).
  "retention_class":                    "<retention class identifier>",
  "started_at":                         "<ISO 8601>",
  "completed_at":                       "<ISO 8601>",
  "status":                             "initiated | completed | invalidated"
}
```

**Patch 2026-05-02 per Codex Scope 2 HIGH-2 finding (closes the audit-vs-type contradiction):** The type now models BOTH success and invalidation states coherently. `dsa_status_at_export` accepts the full DSA-status enum (success requires `active`; invalidation captures the actual at-completion-time state). `export_artifact_hash` is nullable (null on invalidation since no artifact is delivered; non-null on success). `consent_cohort_snapshot_hash` is split into `_initiated` and `_completed` variants so the completion-time consent-snapshot match (per OpenAPI v0.2 v1.10 cycle additions /research/exports/{export_id}/complete gate) can be expressed structurally — the two hashes match for `status=completed`; they differ (or `_completed` is null) for `status=invalidated`. `invalidation_reason` is required when `status=invalidated` and null when `status=completed`.

Notes: `tenant_id` and `country_of_care` are required on the export record itself (not only inherited via cohort) so audit-side I-029 / I-031 enforcement can validate tenant scope without dereferencing cohort. **Per I-029 (6-condition gate; expanded 2026-05-02 per Codex Round-7 Scope 2 HIGH-1 finding to include all canonical conditions in the `status=completed` note — was missing condition 3 permitted-domain drift; expanded to 6-condition gate 2026-05-02 per Codex Round-12 Scope 3 HIGH-1 + post-merge adversarial review HIGH-1 finding adding the per-export grant-artifact gate), `research.export_completed` MAY emit with `status=completed` only when ALL 6 conditions hold: (1) `dsa_status_at_export = active`; (2) `k_threshold_actual >= k_min_required`; (3) `permitted_data_domains_at_export` matches the `research.export_initiated` snapshot (no CCR drift mid-export); (4) `consent_cohort_snapshot_hash_completed = consent_cohort_snapshot_hash_initiated`; (5) every contributing patient has active `ResearchConsent` at completion-time evaluation; (6) per-export grant artifact unexpired + ID/hash-matched + signer-chain-attesting at completion-time.** Per I-029 + I-003 + AUDIT_EVENTS v5.2 §5 + GOVERNANCE_CONTROLS v5.2 §7.2 audit-path discipline, failed exports MUST emit `research.export_completed` with `status=invalidated` and `invalidation_reason` populated to the canonical 6-value enum (`dsa_inactive | k_anonymity_violation | permitted_domain_drift | consent_cohort_change | consent_revocation_mid_export | grant_artifact_invalidated`), paired with `signal_enforcement_trigger` Category B. Bare suppression is forbidden.

---

## AI workload types (added v5.2)

### AIWorkloadType (operative shape; full enum + activation policy in WORKLOAD_TAXONOMY contract)
```typescript
type AIWorkloadType =
  | "conversational_assistant"
  | "protocol_execution"
  | "autonomous_agent"
  | "multi_agent_supervisor"
  | "tool_using_agent"
  | "rejected_invalid_attempt"
  | "n/a";
```

Active at v1.0: `conversational_assistant`, `protocol_execution`. Reserved (require successor ADR + activation audit event): `autonomous_agent`, `multi_agent_supervisor`, `tool_using_agent`. **Sentinels (added v5.2 patches 2026-05-02):** `rejected_invalid_attempt` — reserved exclusively for envelope-level value on `*.execution_rejected` audit events when the rejection captures a null/unknown/reserved attempted_ai_workload_type; never emitted by AI workloads themselves (per Codex Round-4 Scope 1 MEDIUM-1). `n/a` — reserved exclusively for envelope-level value on I-012 clinician-only approval audit records where no AI workload was upstream; invalid for AIExecution / successful AI workload records (per Codex Round-7 Scope 1 HIGH-1). Per ADR-029 + AUDIT_EVENTS v5.2 §I-012 closure rule and clinician-only carve-out.

### AutonomyLevel (operative shape; full enum + activation policy in AUTONOMY_LEVELS contract)
```typescript
type AutonomyLevel =
  | "advisory"
  | "suggestion"
  | "action_with_confirm"
  | "action_with_audit_only"
  | "fully_autonomous"
  | "rejected_invalid_attempt"
  | "n/a";
```

Active at v1.0: `advisory`, `suggestion`, `action_with_confirm`. Reserved (require successor ADR + activation audit event per ADR-030): `action_with_audit_only`, `fully_autonomous`. **Sentinels (added v5.2 patches 2026-05-02):** `rejected_invalid_attempt` — reserved exclusively for envelope-level value on `*.execution_rejected` audit events when the rejection captures a null/unknown/reserved attempted_autonomy_level; never used by an actual AI workload's execution (per Codex Round-4 Scope 1 MEDIUM-1). `n/a` — reserved exclusively for envelope-level value on I-012 clinician-only approval audit records where no AI workload was upstream; invalid for AIExecution / successful AI workload records (per Codex Round-7 Scope 1 HIGH-1). I-012 reject-unless three-clause rule binds prescription / refill / medication-order actions to `action_with_confirm` ceiling per Master PRD §13.7.

### PolicyAuthorization (placeholder skeleton; activates under ADR-030 + GOVERNANCE_CONTROLS framework)
```
{
  "policy_authorization_id":   "pau_<ULID>",
  "ai_workload_type":          "<AIWorkloadType>",
  "action_type":               "<action enum>",
  "tenant_id":                 "Telecheck-{country}",
  "market":                    "<ISO 3166-1 alpha-2>",
  "protocol_id":               "<protocol ULID>",
  "autonomy_level":            "<AutonomyLevel>",
  "approval_chain":            [ { "role": "...", "actor_id": "...", "approved_at": "..." } ],
  "effective_from":            "<ISO 8601>",
  "expires":                   "<ISO 8601>",
  "evidence_locker_ref":       "<artifact reference>",
  "rollback_trigger":          "<rollback trigger description>",
  "status":                    "draft | active | suspended | retired"
}
```

Required for AutonomyLevel ∈ {`action_with_audit_only`, `fully_autonomous`}; NOT required at v1.0 for active autonomy levels (`advisory`, `suggestion`, `action_with_confirm`) per AUTONOMY_LEVELS §1.

---

## Program catalog types (added v5.2 per Master PRD §10.5)

### ProgramCatalogEntry
```
{
  "program_id":                  "prg_<ULID>",
  "program_name":                "<display>",
  "category":                    "<weight_management | ed | rpm | mental_health | dermatology | ...>",
  "clinical_template_artifact_id": "<artifact ULID>",
  "default_forms_engine_layers": { "presentation": "...", "branching": "...", "eligibility": "...", "approval": "..." },
  "default_protocol_id":         "<protocol ULID>",
  "default_guardrail_template_id": "<template ULID>",
  "intended_market_classes":     [ "<market class>" ],
  "status":                      "active | retired",
  "version":                     "<semver>"
}
```

Platform-defined per Master PRD §10.5; instantiated per tenant via ProgramMarketPolicy. The four-layer Forms Engine (presentation / branching / eligibility / approval) defaults provide the program-as-template baseline; tenant instances override via Pattern A composition.

---

## Document control

- **v5.0** — Initial Type Definitions contract.
- **v5.1** — Adds `tenant_id` to MedicationRequest, ConsentRecord, DelegateAccess, Mode2Evaluation type schemas. Adds Tenancy types section: TenantId, TenantContext, CrossTenantAccessContext. Adds 14 new ID prefixes for tenant management and ecom entities. Threading remediation per Adversarial Counsel Review v1.0 finding CRITICAL-01 (and Pattern A coverage). Existing types preserved without modification.
- **v5.2 (2026-05-02 per v1.10.1 hygiene cycle physical merge of v1.10 PRD Update Cycle delta artifact `Phase3_Group2_Contracts_v1_10_Edits_2026-05-01.md` §TYPES)** — Adds Marketing types (MarketingCopy, MarketingCopyGovernanceEvidence); Research data types (DataSharingAgreement, ResearchEthicsReviewBody, CohortDefinition, ResearchDataExport with `tenant_id` + `country_of_care` on the export record itself); AI workload types (AIWorkloadType + AutonomyLevel TypeScript enums + PolicyAuthorization placeholder skeleton); Program catalog types (ProgramCatalogEntry per Master PRD §10.5). Adds 8 new ID prefixes (`mkc_`, `mge_`, `dsa_`, `reb_`, `chd_`, `rex_`, `pau_`, `prg_`). Per ADR-027 (country-conditional DTC marketing posture), ADR-028 (research data partnership Posture A), ADR-029 (AI workload taxonomy + autonomy levels), Master PRD v1.10 §10.5 + §13.2 + §13.7 + §15.3. v5.2 is purely additive — existing v5.1 types preserved without modification.
