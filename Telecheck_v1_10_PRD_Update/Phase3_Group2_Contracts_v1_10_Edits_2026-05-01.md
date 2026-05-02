# Phase 3 — Group 2 Contracts v1.10 edits (TYPES + CCR_RUNTIME + GLOSSARY + AI_LAYERING)

**Version:** 1.0 RECONCILED — proposed delta to canonical v5.1 contracts
**Date:** 2026-05-01
**Reconciliation owner:** Workstream lead (Evans) via Claude proxy
**Approval owner (audit-B):** Engineering Lead + Product Lead + Privacy Officer (per I-015 dual-control); Clinical Safety Officer for AI_LAYERING
**Purpose:** Reconcile v1.10 cycle contract additions for TYPES, CCR_RUNTIME, GLOSSARY, AI_LAYERING against canonical Master PRD v1.10 §10.5 + §13.2 + §13.7 + §15.3 + ADRs 027 / 028 / 029. Lands canonically in respective contract files at v5.2 on Phase 6 promotion.

---

## TYPES v1.10 additions (canonical v5.1 → v5.2)

Insert new section **after the existing Tenancy types section, before Document control:**

### Marketing types (added v5.2)

#### MarketingCopy
```
{
  "marketing_copy_id":             "mkc_<ULID>",
  "tenant_id":                     "tnt_<ULID>",
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

#### MarketingCopyGovernanceEvidence
```
{
  "evidence_id":                              "mge_<ULID>",
  "tenant_id":                                "tnt_<ULID>",
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

Required when CCR `molecule_level_marketing_permitted = permitted` per §13.2.

### Research data types (added v5.2)

#### DataSharingAgreement
```
{
  "dsa_id":                          "dsa_<ULID>",
  "version":                         "<semver>",
  "partner_id":                      "<partner ULID>",
  "partner_name":                    "<display>",
  "tenant_scope":                    [ "tnt_<ULID>" ],
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

#### ResearchEthicsReviewBody
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

#### CohortDefinition
```
{
  "cohort_definition_id":      "chd_<ULID>",
  "tenant_id":                 "tnt_<ULID>",
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

#### ResearchDataExport
```
{
  "export_id":                          "rex_<ULID>",
  "tenant_id":                          "tnt_<ULID>",
  "country_of_care":                    "<ISO 3166-1 alpha-2>",
  "cohort_definition_id":               "<CohortDefinition ULID>",
  "cohort_version":                     "<semver>",
  "dsa_id":                             "<DSA ULID>",
  "dsa_version":                        "<semver>",
  "dsa_status_at_export":               "active",
  "permitted_data_domains_at_export":   [ "<closed enum value>" ],
  "requester_id":                       "<requester ULID>",
  "requester_role":                     "<role>",
  "requester_partner_id":               "<partner ULID>",
  "exported_field_set":                 [ "<field schema fragment>" ],
  "k_min_required":                     11,
  "k_threshold_actual":                 ">= k_min per I-029",
  "suppressed_cell_count":              "<integer>",
  "consent_cohort_snapshot_hash":       "<SHA-256; matches cohort definition>",
  "export_artifact_hash":               "<SHA-256>",
  "retention_class":                    "<retention class identifier>",
  "started_at":                         "<ISO 8601>",
  "completed_at":                       "<ISO 8601>",
  "status":                             "initiated | completed | invalidated"
}
```

### AI workload types (added v5.2)

#### AIWorkloadType (operative shape; full enum + activation policy in WORKLOAD_TAXONOMY contract)
```typescript
type AIWorkloadType =
  | "conversational_assistant"
  | "protocol_execution"
  | "autonomous_agent"
  | "multi_agent_supervisor"
  | "tool_using_agent";
```

#### AutonomyLevel (operative shape; full enum + activation policy in AUTONOMY_LEVELS contract)
```typescript
type AutonomyLevel =
  | "advisory"
  | "suggestion"
  | "action_with_confirm"
  | "action_with_audit_only"
  | "fully_autonomous";
```

#### PolicyAuthorization (placeholder skeleton; activates under ADR-030 + GOVERNANCE_CONTROLS framework)
```
{
  "policy_authorization_id":   "pau_<ULID>",
  "ai_workload_type":          "<AIWorkloadType>",
  "action_type":               "<action enum>",
  "tenant_id":                 "tnt_<ULID>",
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

### Program catalog types (added v5.2 per Master PRD §10.5)

#### ProgramCatalogEntry
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

Platform-defined per Master PRD §10.5; instantiated per tenant via ProgramMarketPolicy.

### New ID prefixes (added v5.2)

- `mkc_` — marketing copy
- `mge_` — marketing copy governance evidence
- `dsa_` — data sharing agreement
- `reb_` — research ethics review body
- `chd_` — cohort definition
- `rex_` — research data export
- `pau_` — policy authorization
- `prg_` — program catalog entry

---

## CCR_RUNTIME v1.10 additions (canonical v5.1 → v5.2)

Insert into the CCR configuration schema as new top-level `marketing` and `research` blocks (preserving existing blocks):

```
  "marketing": {
    "molecule_level_marketing_permitted": "prohibited | pending_evidence | permitted",
    // marketing_copy_governance_evidence is the EMBEDDED structured object (not a bare ID reference).
    // Per ADR-027 / PRD §13.2: `permitted` activation is gated on completeness of every required
    // field below. The runtime validator MUST reject any state transition to `permitted` if any
    // required sub-field is null. Required-field set: regulatory_jurisdiction, regulatory_authority,
    // regulatory_interpretation_artifact_id, interpretation_date, scope, prohibited_claim_classes (≥0
    // items; the array MUST exist), governance_lead_designation_artifact_id. ethics_review_concurrence_artifact_id
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

  "research": {
    "research_data_partnership_active": "inactive | consent_only | active",
    // research_permitted_data_domains is the closed-enum country gate for DSA / cohort / export scope.
    // Per ADR-028 / PRD §15.3: only the four enumerated values may appear; expansion of the enum
    // requires ADR amendment (per ADR-028 Decision §6). Values listed here are the country-level
    // upper bound; per-DSA scope MUST be a subset.
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
```

### Initial values per launch country (added v5.2)

| Country (CCR config) | `marketing.molecule_level_marketing_permitted` | `marketing.marketing_copy_governance_evidence` (structured object) | `research.research_data_partnership_active` | `research.research_permitted_data_domains` | `research.research_ethics_review_body` | `research.cross_border_research_transfer_permitted` |
|---|---|---|---|---|---|---|
| US (Telecheck-US, Heros Health DBA) | `prohibited` (permanent per FDA + state telehealth advertising rules per Master PRD §13.2) | `null` (not applicable when prohibited; runtime validator MUST reject any `permitted` transition if any required sub-field is null) | `consent_only` at launch (5th consent tier active per §15.2; export pipeline Release 2) | `[]` empty at launch (no domains active until export pipeline activates Release 2; first DSA target per §25 Q12 sets the initial subset) | TBD pre-launch per §24 | `permitted_with_counsel_artifact` (default; per-DSA evaluation; counsel artifact required before any DSA activation) |
| GH (Telecheck-Ghana, Heros Health Ghana DBA) | `pending_evidence` at launch (regulatory engagement underway; molecule-level surfaces remain disabled until evidence object populated to required-field completeness per ADR-027) | `null` (until populated to all required-field completeness) | `consent_only` at launch (5th consent tier active; export pipeline Release 2; REC engagement pre-launch per §24) | `[]` empty at launch (subset of the closed enum `chronic_disease_longitudinal | ncd_surveillance | pharmacovigilance_signal | population_health_aggregate`; populated when first DSA activates Release 2) | TBD pre-launch — Ghana Health Service REC or Noguchi Memorial Institute IRB candidates per §24 | `permitted_with_counsel_artifact` (Ghana DPA cross-border transfer rules apply per §22.3; counsel artifact required before research data leaves country) |

### Change control additions (added v5.2)

Add to the existing change-control table:

| Change type | Approval requirement | Audit category |
|---|---|---|
| Marketing (`molecule_level_marketing_permitted`, `marketing_copy_governance_evidence`) | Per ADR-027 v0.5 activation chain: Marketing copy governance lead + Clinical Safety Officer + Regulatory Affairs Lead (triple sign-off). Country Launch Director SHOULD be in the approval chain for the `prohibited` → `pending_evidence` and `pending_evidence` → `permitted` state transitions (final activation gate per Master PRD §13.2 + Market Launch contract). | B |
| Research (`research_data_partnership_active`, `research_ethics_review_body`, `research_permitted_data_domains`, `cross_border_research_transfer_permitted`) | Per ADR-028 v0.4 activation chain: Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer + Product Lead (quad sign-off). For the `consent_only` → `active` state transition (export pipeline activation), additional REC concurrence is required per `research_ethics_review_body.per_dsa_review_required`. Country Launch Director SHOULD be in the approval chain for per-country activation per Market Launch contract. | B |

### Reference to invariants (added v5.2)

CCR research keys are bounded by:
- I-029 — research data export requires `research_data_partnership_active = active` AND active DSA AND active research consent AND k-anonymity ≥ `k_min_default` (11 unless DSA increases)
- I-030 — care delivery surfaces MUST NOT branch on `research_data_partnership_active` or research consent status
- I-031 — research export events emit at `audit_sensitivity_level = high_pii`

CCR marketing keys are bounded by ADR-027 + Master PRD §13.2 working definition; surface controls per AUDIT_EVENTS `marketing.surface_rendered` / `marketing.surface_drift` events.

---

## GLOSSARY v1.10 additions (canonical v5.1 → v5.2)

Source artifact for the 37 reconciled glossary terms: `Phase2_F13_Glossary_Reconciled_2026-05-01.md` (v0.2 patched 2026-05-01 per Codex Phase 2.X v0.2 verification — 0 HIGH / 0 MEDIUM closed).

**Promotion process at Phase 6:** The 37 reconciled glossary terms (1 from C1 + 8 from C3 + 4 from C4 + 10 from C5 + 14 from C7) fold into the canonical GLOSSARY contract under three new top-level sections inserted before the existing Document control footer:

- **§Brand and tenant terms (added v5.2)** — 8 entries from C3 (`Telecheck`, `Heros Health`, `Telecheck-{country}`, `separately incorporated subsidiary`, `Telecheck Health LLC`, `Telecheck-Ghana Ltd.`, `two business lines`, `consumer DBA`); 1 entry from C1 (`Future Release marker`).
- **§Marketing terms (added v5.2)** — 4 entries from C4 (`molecule-level marketing`, `program-level marketing`, `harm-reduction marketing posture`, `marketing copy governance review`).
- **§Research data terms (added v5.2)** — 10 entries from C5 (`research data partnership`, `Posture A / Posture B`, `data-sharing agreement (DSA)`, `de-identification engine`, `Safe Harbor de-identification`, `k-anonymity`, `cohort definition layer`, `aggregation layer`, `research ethics committee (REC)`, `population observatory`).
- **§AI taxonomy terms (added v5.2)** — 14 entries from C7 (`AI workload type`, `conversational_assistant`, `protocol_execution`, `autonomous_agent`, `autonomy_level`, `advisory`, `suggestion`, `action_with_confirm`, `action_with_audit_only`, `fully_autonomous`, `policy_authorization`, `agent_identity`, `knowledge_source_registry`, `supervising_policy`).

Each term carries: canonical definition, distinguished from (where relevant), and cross-reference to the authoritative source (Master PRD section, ADR, contract). The reconciled text in `Phase2_F13_Glossary_Reconciled_2026-05-01.md` is the verbatim landing payload — no further wording changes at Phase 3.

**Forbidden-alias updates (added v5.2):**

- "Heros" alone (without the qualifier "Health" or DBA framing) MUST NOT be used as a tenant or operator identifier. Operating-tenant naming is `Telecheck-{country}`; consumer DBA is `Heros Health` (country-instanced via subdomains).
- The §17 contextual carve-outs in Master PRD v1.10 apply: "prescription" is permitted in (a) the canonical INVARIANTS contract entry name "I-012 prescription sign-off"; (b) FDA / regulatory literal phrases ("prescription drug marketing"); (c) Stripe payment-platform "prescription history" / "Customer" entity terms — outside these carve-outs, use `medication_request`. "customer" is permitted in (a) Stripe / Paystack admin literal entity; (b) standard business terms ("customer acquisition cost", "before customer ship") — outside these, use `tenant` or `patient`.
- "chatbot" remains forbidden across all contexts (no carve-outs); use `conversational_assistant` workload type or "Mode 1" as documented.

**Amendments to existing v5.1 GLOSSARY entries (added v5.2 per Codex Phase 3 group-2 MEDIUM-1):**

The v5.1 GLOSSARY contains stale references that conflict with v1.10 brand structure (C3) and AI workload taxonomy (C7). These entries are amended (not removed — preserved meaning, updated wording) at Phase 6 promotion:

1. **`tenant`** (existing v5.1 entry §Tenancy and platform-isolation terms): The phrase "At launch, two tenants exist: Heros Health (US) and Telecheck-Ghana (GH)" is amended to "**At launch, two operating tenants exist: Telecheck-US (operated by Telecheck Health LLC, trading patient-facing as Heros Health DBA) and Telecheck-Ghana (operated by Telecheck-Ghana Ltd., trading patient-facing as Heros Health Ghana DBA).**" The "same person cannot have a single identity that spans tenants" sentence is preserved unchanged. Cross-reference to Master PRD §1, §2, §18.3 (v1.10).

2. **`Mode 1 (Conversational Assistant)`** (existing v5.1 entry §AI terms): The "Governed by: Guardrail templates" line is preserved. A new "Workload taxonomy mapping" line is added: "**Per ADR-029, Mode 1 is the workload-taxonomy value `conversational_assistant`. Code, schema, audit, and config use `conversational_assistant`; UI / operator-facing text may continue to use 'Mode 1'.**" Cross-reference to Master PRD §13.7 (v1.10), AI_LAYERING §10 (v5.2), WORKLOAD_TAXONOMY §2.1 (v5.2).

3. **`Mode 2 (Protocol Execution Agent)`** (existing v5.1 entry §AI terms): Same pattern — preserved, with new "Workload taxonomy mapping" line: "**Per ADR-029, Mode 2 is the workload-taxonomy value `protocol_execution`. ADR-005 protocolized autonomy remains binding for current `protocol_execution` workloads at autonomy_level ≤ `action_with_confirm` per I-012 preservation rule (Master PRD §13.7 single normative source).**" Cross-reference to AUTONOMY_LEVELS contract (v5.2).

4. **§13.4 platform_floor reference** in the existing `platform_floor` entry: The reference to Master PRD §13.4 is preserved (the §13.4 mapping table remains in the canonical PRD). New cross-reference appended: "Master PRD §13.7 (v1.10) extends the AI portion of the platform floor with the AI workload taxonomy supersession scope; AI-ARCH-001 / AI-ARCH-002 / I-012 remain binding without modification."

These amendments are **wording-only** (no semantic change to the canonical terms; the entries continue to mean what they meant in v5.1). The canonical INVARIANTS contract document-control discipline ("Invariants are not removed; existing numbers never change") applies analogously to GLOSSARY: existing terms are not removed, but stale-content updates that prevent contradictions with v1.10 architectural changes are required at Phase 6 promotion.

---

## AI_LAYERING v1.10 additions (canonical v5.1 → v5.2)

Insert new section after §9 Tenant scoping, before Document control:

### §10. Future workload expansion (added v5.2 per ADR-029)

The two-mode AI architecture in §2 (AI-ARCH-001, AI-ARCH-002) remains binding for current Mode 1 / Mode 2. Per ADR-029, the **WORKLOAD_TAXONOMY contract** introduces a property-based discriminator (`ai_workload_type`) that classifies AI invocations and reserves namespace placeholders for future workload types (`autonomous_agent`, `multi_agent_supervisor`, `tool_using_agent`).

**Supersession scope (canonical statement; single source of truth: WORKLOAD_TAXONOMY §5):**

> AI-ARCH-001 remains binding only as: **v1.0 has exactly two active workload types, `conversational_assistant` and `protocol_execution`.** AI-ARCH-001 no longer prohibits reserved future workload type names from existing in WORKLOAD_TAXONOMY's enum, but any **activation** of a reserved workload type requires successor ADR approval (ADR-030, 031, 032, 033, 034 as applicable).

**Mapping current Mode 1 / Mode 2 to workload taxonomy:**

| AI-LAYERING term | Workload taxonomy value | Notes |
|---|---|---|
| Mode 1 | `conversational_assistant` | Identical semantics; relabeled. |
| Mode 2 | `protocol_execution` | Identical semantics; relabeled. ADR-005 protocolized autonomy remains binding for current workloads. |

Code, schema, audit, and config MUST use the workload taxonomy values (`conversational_assistant`, `protocol_execution`) in new v1.10+ artifacts. UI / operator-facing terminology may continue to use "Mode 1 / Mode 2" labels. The `actor_type = ai_mode_1` / `ai_mode_2` aliases in AUDIT_EVENTS are preserved for backward-compat; new code uses `actor_type = ai_workload` per AUDIT_EVENTS v5.2 §2.

**ADR-002 + ADR-005 preservation:** ADR-002 binary AI mode framing remains binding for current Mode 1 / Mode 2 until separate successor ADR. ADR-005 protocolized autonomy remains binding for `protocol_execution` workload at autonomy_level ≤ `action_with_confirm`. ADR-029 supersedes ADR-002 prospectively for new workload additions only — current workloads continue under ADR-002.

**I-012 preservation rule (mirrors Master PRD §13.7 v0.3):** For prescription, refill, and medication-order actions governed by I-012, `protocol_execution` workload may only reach `executed` state through `action_with_confirm` with explicit clinician confirmation. The full reject-unless three-clause rule is canonicalized in Master PRD §13.7 (single normative source of truth) and mirrored in WORKLOAD_TAXONOMY §2.2 + AUTONOMY_LEVELS §2.3 + AUDIT_EVENTS §3. Reserved levels (`action_with_audit_only`, `fully_autonomous`) require both successor ADR approval AND activation audit event in the immutable audit chain — ADR approval alone never sufficient.

**AI scribe and lab interpretation classification:** AI Scribe (per §2 AI Scribe table) is currently a documentation-tool workload, not a clinical-decision workload. It does not yet have a workload-taxonomy classification per ADR-029. Lab interpretation runs as `protocol_execution` (Mode 2) per existing AI-LAYERING. Both classifications may be revisited under future ADR amendments without affecting current production semantics.

---

## Document control update for each contract (Phase 6 promotion)

Add v5.2 entries to each contract's Document control section:

- **TYPES v5.2:** Adds Marketing types (MarketingCopy, MarketingCopyGovernanceEvidence); Research data types (DataSharingAgreement, ResearchEthicsReviewBody, CohortDefinition, ResearchDataExport); AI workload types (AIWorkloadType, AutonomyLevel, PolicyAuthorization placeholder); Program catalog types (ProgramCatalogEntry); 8 new ID prefixes. Per ADR-027, ADR-028, ADR-029, Master PRD §10.5. v5.2 is purely additive.
- **CCR_RUNTIME v5.2:** Adds top-level `marketing` block (4 keys: `molecule_level_marketing_permitted`, `marketing_copy_governance_evidence` as embedded structured object, `marketing_governance_review_cadence_months`, `marketing_governance_lead_designation_artifact_id`) and `research` block (7 keys: `research_data_partnership_active`, `research_permitted_data_domains` closed-enum country gate, `research_ethics_review_body` structured object, `de_identification_standard`, `k_min_default`, `cross_border_research_transfer_permitted` enum, `cross_border_research_transfer_evidence` companion structured object) — total **11 new keys** per ADR-027 + ADR-028 + Master PRD §13.2 + §15.3. (Note: `cross_border_research_transfer_evidence` is a sibling top-level key to `cross_border_research_transfer_permitted`, not a nested sub-field — kept top-level so the companion artifact references can be set independently while the enum drives gating.) Change-control rows for marketing (Marketing copy governance lead + Clinical Safety Officer + Regulatory Affairs Lead triple sign-off; Country Launch Director on activation transitions) and research (Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer + Product Lead quad sign-off; REC concurrence on `consent_only` → `active`) configuration changes. Initial values per launch country (US `prohibited` permanent + `consent_only`; GH `pending_evidence` + `consent_only`). v5.2 is purely additive.
- **GLOSSARY v5.2:** Adds 37 new terms across 4 new sections (Brand and tenant terms; Marketing terms; Research data terms; AI taxonomy terms). Forbidden-alias updates: "Heros" alone forbidden as tenant/operator identifier; §17 contextual carve-outs from Master PRD v1.10 referenced. Existing terms preserved; v5.2 is purely additive.
- **AI_LAYERING v5.2:** Adds §10 Future workload expansion per ADR-029; supersession scope statement (single source of truth WORKLOAD_TAXONOMY §5); Mode 1/Mode 2 ↔ workload taxonomy mapping; ADR-002 + ADR-005 preservation; I-012 preservation rule mirroring §13.7 v0.3. Two-mode architecture (§2 AI-ARCH-001, AI-ARCH-002) preserved without modification — all five guardrail invariants, AI boundaries, audit, resilience, agreement tracking sections preserved.

---

## Document control (this delta artifact)

- **v1.0 — 2026-05-01** — Phase 3 group-2 reconciliation against canonical Master PRD v1.10 §10.5 + §13.2 + §13.7 + §15.3 + ADRs 027 / 028 / 029. 4 contracts (TYPES, CCR_RUNTIME, GLOSSARY, AI_LAYERING) updated additively at v5.2.
- **v1.0.2 — 2026-05-01** — Patches per Codex Phase 3 group-2 review v0.1 (2 HIGH + 4 MEDIUM):
  - **HIGH-1 (CCR research_permitted_data_domains missing):** Added closed-enum `research_permitted_data_domains` field to `research` block — country-level upper bound for DSA / cohort / export domain scope per ADR-028 / §15.3 closed-enum (`chronic_disease_longitudinal`, `ncd_surveillance`, `pharmacovigilance_signal`, `population_health_aggregate`). Per-DSA scope MUST be a subset.
  - **HIGH-2 (marketing_copy_governance_evidence weakened by bare ID):** Replaced `<MarketingCopyGovernanceEvidence ID> | null` with the embedded structured object containing all required sub-fields. Runtime validator MUST reject any `prohibited`/`pending_evidence` → `permitted` state transition if any required sub-field is null. Required: regulatory_jurisdiction, regulatory_authority, regulatory_interpretation_artifact_id, interpretation_date, scope, prohibited_claim_classes, governance_lead_designation_artifact_id. Optional: ethics_review_concurrence_artifact_id.
  - **MEDIUM-1 (GLOSSARY stale v5.1 entries):** Added "Amendments to existing v5.1 GLOSSARY entries" subsection enumerating wording-only amendments to `tenant`, `Mode 1`, `Mode 2`, `platform_floor` entries. Existing terms preserved; stale-content updates per Phase 6 promotion.
  - **MEDIUM-2 (ResearchDataExport missing tenant context):** Added `tenant_id` and `country_of_care` to ResearchDataExport type schema. Tenant context now explicit on the export record itself (no longer inherited only via cohort).
  - **MEDIUM-3 (CCR change-control signer drift):** Marketing change-control signer list updated to ADR-027 v0.5 activation chain (Marketing copy governance lead + Clinical Safety Officer + Regulatory Affairs Lead triple sign-off; Country Launch Director on activation transitions). Research change-control signer list updated to ADR-028 v0.4 activation chain (Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer + Product Lead quad sign-off; REC concurrence on `consent_only` → `active`).
  - **MEDIUM-4 (counts/shape inconsistency):** Document control entry for CCR_RUNTIME v5.2 updated to reflect actual key counts: **4 marketing keys + 7 research keys = 11 total new keys** (note: `cross_border_research_transfer_evidence` is a sibling top-level companion key to `cross_border_research_transfer_permitted`, not a nested sub-field — kept top-level so the companion artifact references can be set independently while the enum drives gating). Initial-values table updated to add `research_permitted_data_domains` row.
- **Status:** RECONCILED v0.2 — proposed Phase 3 group-2 contribution. Codex Phase 3 group-2 v0.2 verification pending.
- **Lands canonically:** Phase 6 promotion folds into the respective contract files at v5.2.
