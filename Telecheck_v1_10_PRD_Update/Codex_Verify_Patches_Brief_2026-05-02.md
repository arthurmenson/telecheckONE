# Codex Verification — v1.10.1 Hygiene Cycle Patches (4 parallel scoped reviews)

**Cycle:** v1.10.1 hygiene cycle, post-patch verification.
**Branch:** v1.10.1-hygiene-cycle
**Initial commit (c4995db):** physical merge of v1.10 delta artifacts.
**Patch commit (c34ad24):** addresses 6 HIGH + 2 MEDIUM findings from prior Codex 4-scope review.

## Patches landed

Per the prior Codex review's recommendations, this commit (c34ad24) addressed:

### Scope 1 (Clinical safety)
- **HIGH-1**: AUDIT_EVENTS I-012 closure rule — workload/autonomy fields required regardless of actor_type for I-012-class actions; protocol_engine→ai_workload mapping mandated for I-012 events.
- **MEDIUM-1**: New `<action_class>.execution_rejected` Category A audit event for I-012 reject-unless violations. Required payload: action_id, attempted actor/workload/autonomy, violated_clauses array, RBAC check result.

### Scope 2 (Privacy)
- **HIGH-1**: OpenAPI `/research/exports/{export_id}/complete` now enforces 5 conditions (DSA active + k_threshold>=k_min + permitted_domains match + consent_cohort_snapshot_hash match + every contributing patient has active ResearchConsent).
- **HIGH-2**: TYPES.ResearchDataExport widened — `dsa_status_at_export` enum, `export_artifact_hash` nullable, `consent_cohort_snapshot_hash` split into `_initiated`/`_completed`, `invalidation_reason` added.
- **MEDIUM-1**: ConsentRecord enum gains `research_data_use`; new ResearchConsent subtype defined.

### Scope 3 (Regulatory)
- **HIGH-1**: CCR_RUNTIME change-control rows for Marketing + Research transitions now state Country Launch Director **MUST** be in approval chain (was SHOULD); transition rejected if sign-off absent.
- **HIGH-2**: Market Rollout Cockpit research block rewritten to mirror exact CCR_RUNTIME v5.2 7-key block (`research_permitted_data_domains`, `research_ethics_review_body` structured object, `de_identification_standard`, `k_min_default`, `cross_border_research_transfer_permitted`, `cross_border_research_transfer_evidence` companion structured object, plus DSA workflow links).

### Scope 4 (Brand structure C3)
- **HIGH-1**: System Architecture §11.4 in-place rewrite — `Heros (US tenant)` → `Telecheck-US (Heros Health DBA; operated by Telecheck Health LLC)`; BAA chain rewritten.
- **HIGH-2**: RBAC §1-§3 role hierarchy + §6 clinician example rewritten to operating-tenant + DBA framing.
- **MEDIUM-1**: Tenant Threading Addendum §3 — 7 surviving bare "Heros" operating-tenant examples (device pairing, communities, FDA MedWatch, herb-drug, affiliate program) rewritten in place.

## Verification ask per scope

Same 4-scope structure as the prior review. For each, please verify:

1. **Patch addresses the original finding** (no half-fix; no new gaps introduced).
2. **No regression** in adjacent text (the in-place rewrites in System Architecture, RBAC, Tenant Threading must not have broken cross-references or introduced contradictions).
3. **Cross-file consistency** — patches that touch one contract are mirrored where required (e.g., AUDIT_EVENTS execution_rejected event should be referenced by STATE_MACHINES + AI_LAYERING; CCR_RUNTIME MUST language should align with MARKET_LAUNCH activation gates; TYPES.ResearchDataExport widening should be consistent with OpenAPI export endpoint payload).
4. **No new HIGH/MEDIUM** introduced by the patch text itself.

## Findings format

Standard HIGH / MEDIUM / LOW per scope. If 0 HIGH / 0 MEDIUM across all 4 scopes → v1.10.1 hygiene cycle EXIT.

## Out of scope

- The original v1.10 promotion baseline (Phase 6 ceremony — already approved at Phase 6 POST-MERGE EXIT v0.5).
- Workstream-discipline note (separate review path if it graduates to ADR-035).
