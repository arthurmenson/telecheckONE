# Codex Verification — v1.10.1 Hygiene Cycle Round-2 Patches

**Branch:** v1.10.1-hygiene-cycle
**Initial commit (c4995db):** physical merge of v1.10 delta artifacts.
**Round-1 patches (c34ad24):** 6 HIGH + 2 MEDIUM Codex findings addressed.
**Round-2 patches (cb57d8b — current HEAD):** 7 HIGH + 2 MEDIUM round-2 findings addressed.

## Round-2 patches landed (cb57d8b)

### Scope 1 (Clinical safety)
- HIGH: AUDIT_EVENTS Category A catalog rows for I-012 actions updated to use actor_type=ai_workload + ai_workload_type=protocol_execution at v1.10+; protocol_engine retained only as legacy/backfill alias. New catalog rows for prescribing/refill/medication_order.execution_rejected with full required payload.
- MEDIUM: STATE_MACHINES ProtocolAuthorizedAction §10.4 now MUST emit *.execution_rejected audit event on rejection (mirrors AUDIT_EVENTS rejection-emit MUST).

### Scope 2 (Privacy)
- HIGH: invalidation_reason enum aligned across TYPES and AUDIT_EVENTS — single canonical 5-value enum (dsa_inactive | k_anonymity_violation | permitted_domain_drift | consent_cohort_change | consent_revocation_mid_export); "other" fallthrough removed.
- HIGH: STATE_MACHINES ResearchExportRequest ready→delivered now has explicit per-patient active-consent guard (condition 5: every contributing patient MUST have ResearchConsent.granted_at non-null, revoked_at null at completion-time evaluation). Mirrors OpenAPI 5-condition gate.

### Scope 3 (Regulatory)
- HIGH: CCR launch defaults changed US and GH research_data_partnership_active from consent_only to inactive (REC body is TBD pre-launch; transition requires REC approval reference + consent text version pin). Added runtime validator rule rejecting consent_only transition when ethics body null.
- HIGH: Cockpit cross-border evidence gate strengthened — removed "AND a transfer is actually planned" qualifier; any transition to permitting enum value rejected unless all required companion fields non-null.
- MEDIUM: ADR-028 activation chain corrected to ADR-028 v0.4 quad sign-off (Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer + Product Lead) with Country Launch Director as separate per-country launch authority. Aligns with MARKET_LAUNCH v5.1 condition 9.

### Scope 4 (Brand structure C3)
- HIGH: RBAC §5 + §7 surviving bare "Heros" operator/owner/COO/founder examples rewritten in place to operating-tenant + DBA framing.
- HIGH: System Architecture §11.4 BAA chain restored to preserve Telecheck parent/platform as separate business associate (was Telecheck Health LLC → AWS US dropping platform; now Telecheck Health LLC → Telecheck parent/platform → AWS US). Symmetric restoration applied to Telecheck-Ghana side.

## Verification ask per scope

For each scope, please verify:

1. The round-2 patch addresses the original round-2 finding (no regression to the round-1 attempt; no half-fix).
2. The patch does not introduce new HIGH/MEDIUM findings.
3. Cross-contract consistency — patches that touch one contract are mirrored where required (e.g., AUDIT_EVENTS catalog rows ↔ TYPES.AIExecution ↔ STATE_MACHINES ProtocolAuthorizedAction; TYPES.invalidation_reason ↔ AUDIT_EVENTS payload enum ↔ State machine reject-unless conditions; CCR launch defaults ↔ MARKET_LAUNCH activation gates ↔ Cockpit; ADR-028 activation chain ↔ MARKET_LAUNCH ↔ CCR_RUNTIME ↔ RBAC).

## Findings format

Standard HIGH / MEDIUM / LOW per scope. If 0 HIGH / 0 MEDIUM across all 4 scopes → v1.10.1 hygiene cycle EXIT.

## Out of scope

- The original v1.10 promotion baseline (already approved at Phase 6 POST-MERGE EXIT v0.5).
- Workstream-discipline note (separate review path if it graduates to ADR-035).
