# 00-GOVERNANCE-CONTROLS.md — Contracts Pack v5

**Status:** canonical · **Version:** 5.2 · **Owner:** product lead + clinical safety officer + market operations lead · **Consumers:** admin configuration surfaces, AI governance, moderation governance, market rollout

**Source:** Net-new contracts from consolidated Contracts Pack, reconciled into modular structure per Artifact Registry v2.3 §2 Decision 1.

---

## 1. Scope

This contract governs configuration validation, incident response, and safety-signal enforcement. These are cross-cutting governance controls that apply to all configurable elements of the platform: protocols, guardrail templates, moderation policies, and Market Packs.

---

## 2. Configuration validation contracts

### CONFIG-001: Configuration below the floor is rejected

Any configuration (guardrail template, moderation policy, protocol definition, Market Pack) that would violate a FLOOR contract is rejected at validation time, before deployment.

- **Enforcement:** Configuration validator runs the full floor contract checklist against every proposed configuration.
- **Violation behavior:** Deployment rejected with specific floor contract violations listed.
- **Audit:** Validation attempt logged with results.

### CONFIG-002: Configuration changes produce a new version

Every configuration change produces a new version of the configuration object. The previous version is retained and available for rollback.

- **Enforcement:** Configuration service uses versioned storage. In-place modification of a version is rejected.
- **Audit:** Version change logged with author, diff, and reason.

### CONFIG-003: Configuration changes require authorized roles

Configuration changes require authorization from roles specified in the configuration object's governance metadata. No configuration change is anonymous.

- **Enforcement:** Configuration service validates actor role against required roles per RBAC Permissions Matrix.
- **Violation behavior:** Change rejected with "insufficient authorization" error.
- **Audit:** Authorization check logged.

---

## 3. Incident and rollback contracts

### INCIDENT-001: Emergency Safe Mode

In a severe incident, the platform can enter Emergency Safe Mode for a market. All configurable behavior reverts to the strictest defaults:
- All protocols deactivated (fallback to clinician review for all actions)
- All guardrail templates reverted to Conservative Default
- All moderation policies reverted to strictest mode
- All protocol-authorized pathways become clinician-review-only

Authorization: Country Launch Director or Support Lead.

- **Enforcement:** Emergency Safe Mode is a Market Pack state. Entering this state reverts all configuration objects to defaults.
- **Audit:** Entry and exit logged with authorization chain, reason, and revert scope.

### INCIDENT-002: Specific capability rollback

Individual capabilities (a specific protocol, a specific guardrail template, a specific moderation policy) can be rolled back without affecting other capabilities.

- **Enforcement:** Configuration objects are independently versionable and independently deactivatable.
- **Audit:** Rollback logged with scope, actor, and reason.

### INCIDENT-003: Rollback completes within 60 seconds

Any rollback action (specific or Emergency Safe Mode) takes effect within 60 seconds of authorization. Active connections receive updated configuration at next interaction.

- **Enforcement:** Configuration propagation pipeline has a 60-second SLA.
- **Audit:** Rollback timing logged (authorization_time, effective_time, propagation_duration).

---

## 4. Safety-signal enforcement contracts

### SIGNAL-001: Interaction engine is mandatory for prescribing and refills

Every prescribing and refill decision must be preceded by a complete Medication Interaction & Validation Engine run. No prescription or refill bypasses the check.

- **Enforcement:** Prescribing and refill approval services call the interaction engine before proceeding. If the engine call fails or times out, the action falls back to clinician review (never auto-approved without the check).
- **Violation behavior:** If engine is unavailable: action queued for clinician review with "safety check unavailable" flag. Never auto-approved.
- **Audit:** Engine call logged for every prescribing/refill decision. Engine-unavailable events logged and alerted.

### SIGNAL-002: Critical signals cannot be silently suppressed

Critical and major interaction signals are always visible to the clinician. Guardrail configuration may adjust display of minor signals but may not suppress critical or major signals.

- **Enforcement:** Signal display logic treats critical and major signals as mandatory-visible. Configuration validator rejects templates that suppress these severities.
- **Audit:** Signal display logged per clinician decision session.

### SIGNAL-003: Override produces a permanent audit record

When a clinician overrides a block or warn signal, the override is recorded permanently with: clinician_id, rationale, signal_id, signal_severity, engine_version, knowledge_base_version, timestamp. Override records are never deleted. Overrides do not carry forward to the next refill cycle — each cycle re-evaluates signals fresh.

- **Enforcement:** Override service writes to append-only audit.
- **Audit:** Self-enforcing.

### SIGNAL-004: Protocol execution is gated by signals

Protocol-authorized actions check the interaction engine before execution. Critical signals block protocol execution (fallback to clinician review). Major signals block unless the protocol explicitly addresses that signal class. This gate is mandatory and not configurable.

- **Enforcement:** Protocol execution service calls the interaction engine gate before proceeding. Gate logic is platform-level, not protocol-configurable.
- **Violation behavior:** Protocol execution blocked. Fallback to clinician review with protocol context attached.
- **Audit:** Protocol gate evaluation logged with all signals and gate result.

---

## 5. Cross-references

| Contract | Related floor contracts | Related ADRs |
|---|---|---|
| CONFIG-001 | All FLOOR contracts (floor cannot be configured away) | ADR-005 (protocolized autonomy) |
| CONFIG-002 | — | ADR-013 (immutable audit) |
| CONFIG-003 | — | — |
| INCIDENT-001 | All FLOOR contracts (Emergency Safe Mode restores floor-level behavior) | — |
| INCIDENT-002 | PROTO-004 (one-action protocol rollback), GUARD-003 (one-action guardrail rollback) | — |
| INCIDENT-003 | — | — |
| SIGNAL-001 | FLOOR-001 (no autonomous prescribing outside protocol) | ADR-006 (engine timing) |
| SIGNAL-002 | — | — |
| SIGNAL-003 | AUDIT-001 (append-only audit) | ADR-013 (immutable audit) |
| SIGNAL-004 | FLOOR-001 (no autonomous prescribing), FLOOR-002 (no autonomous dispensing) | ADR-005 (protocolized autonomy) |

---

## Change log

| Version | Change |
|---|---|
| v5.0 | New file. Absorbs CONFIG-001 through CONFIG-003, INCIDENT-001 through INCIDENT-003, and SIGNAL-001 through SIGNAL-004 from the consolidated Contracts Pack (per Artifact Registry v2.3 §2 Decision 1 reconciliation note). These contracts were net-new content not present in v4.2 modular files. |
| v5.1 | Adds tenant-scoped governance section. Per ADR-023, configuration validation, incident handling, and safety-signal enforcement operate on tenant-scoped resources where the resource is tenant-scoped (most cases). Tenant Clinical Lead approval required for tenant-scoped clinical configuration changes per RBAC v1.1; Platform Clinical Governance approval required for platform-scoped configuration changes (e.g., Guardrail Templates v1.X overrides at platform level, Protocol Library platform-default updates). Cross-tenant incidents require Platform Admin coordination. Threading remediation per Adversarial Counsel Review v1.0 finding CRITICAL-01. |

---

## 6. Tenant scoping (added v5.1)

Per ADR-023 multi-tenancy Model A:

### 6.1 Configuration validation (extends §2)

- **Tenant-scoped configurations** validate within their tenant scope: tenant Clinical Lead approval (per RBAC v1.1) for clinical configurations; tenant Admin approval for non-clinical operational configurations.
- **Platform-scoped configurations** validate at the platform layer: Platform Clinical Governance approval for clinical configurations affecting all tenants; Platform Admin approval for operational platform-default configurations.
- A tenant cannot relax a platform-floor configuration (e.g., cannot disable I-019 crisis detection within their tenant).

### 6.2 Incident and rollback (extends §3)

- **Tenant-scoped incidents** (e.g., a tenant's intake form has a clinical-correctness defect) are owned by the affected tenant's Tenant Clinical Lead with platform engineering support.
- **Platform-scoped incidents** (e.g., a guardrail template defect affecting multiple tenants) are owned by Platform Clinical Governance with notification to all affected tenants.
- Rollback authority follows the configuration-validation layer: tenant-scoped rollback authorized by tenant Clinical Lead; platform-scoped rollback authorized by Platform Clinical Governance.
- Cross-tenant incident notification per Tenant Admin's tenant-defined escalation contact (configured in Tenant Admin Backend per Admin Backend Slice v1.X).

### 6.3 Safety-signal enforcement (extends §4)

- Safety signals are evaluated per-patient (always tenant-scoped per the patient-tenant relationship).
- Override authorization per RBAC v1.1: clinician override authority is scoped to clinicians authorized for that tenant.
- Cross-tenant signal pattern detection (a defect appearing in multiple tenants) flagged at platform level for Platform Clinical Governance review with tenant notification.

---

## 7. Research data export control envelope (added v5.2 per ADR-028)

### 7.1 Research export CONFIG controls

| Config control | Bound by | Owner |
|---|---|---|
| Activation state of research data partnership | CCR `research_data_partnership_active` 3-state enum | Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer + Product Lead (quad sign-off per ADR-028 v0.4) |
| Permitted data domains for export | CCR `research_permitted_data_domains` closed enum (subset of `chronic_disease_longitudinal | ncd_surveillance | pharmacovigilance_signal | population_health_aggregate`) | Same quad sign-off + REC concurrence per `research_ethics_review_body.per_dsa_review_required` |
| K-anonymity threshold | CCR `k_min_default` (default 11; per-DSA increases permitted; decreases below `k_min_default` prohibited per I-029) | Privacy Officer + Engineering Lead + REC concurrence |
| Cross-border transfer mechanism | CCR `cross_border_research_transfer_permitted` enum + `cross_border_research_transfer_evidence` companion structured object | Privacy Officer + Legal counsel artifact (per Master PRD §22.3) |
| DSA activation | DataSharingAgreement entity (per TYPES v5.2) | Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer + Product Lead quad sign-off + partner organization sign |

### 7.2 Research export INCIDENT controls

**Incident response audit-path discipline (aligned with AUDIT_EVENTS v5.2 §5 export event family):** When an incident triggers export invalidation, the audit chain MUST capture the failure transparently. Per AUDIT_EVENTS v5.2 §5: `research.export_completed` MAY emit with the violated state recorded in payload (e.g., `dsa_status_at_export = expired`, `permitted_data_domains_at_export` showing drift, `k_threshold_actual < k_min_required`); the event's `status` field carries `invalidated` to mark the failed completion. Concurrently, the export pipeline MUST emit a `signal_enforcement_trigger` Category B audit event capturing the enforcement action (export artifact destruction; partner notification; engineering review trigger). The two records compose to give a complete audit trail of "what happened" + "what we did about it." Bare suppression of the completion event (no record at all) is forbidden — silent invalidation is an audit gap per I-003.

**5-condition incident matrix (rewritten 2026-05-02 per Codex Round-4 Scope 2 HIGH-1 finding to mirror exactly the canonical 5-condition I-029 reject-unless gate from AUDIT_EVENTS v5.2 / TYPES v5.2 / STATE_MACHINES v1.1 / OpenAPI v0.2; replaces prior 4-condition table that combined `consent_cohort_change` and per-patient active-consent failure into a single "consent revocation mid-export" row):**

Each incident maps deterministically to exactly one `invalidation_reason` enum value. **Every incident requires** `research.export_completed` to emit with `status = invalidated` and the canonical `invalidation_reason` populated FIRST, paired with `signal_enforcement_trigger` Category B audit; only after both audit records are recorded MAY any recompute / re-export pathway be considered. No "fallthrough other" bucket.

| Incident type | Triggers | `invalidation_reason` | Response |
|---|---|---|---|
| 1. DSA expiry mid-export | `dsa_status_at_export` ≠ `active` at completion-time check (DSA expired, suspended, or retired during export window) | `dsa_inactive` | Per I-029 condition 1: `research.export_completed` MUST emit with `dsa_status_at_export = expired/suspended/retired`, `status = invalidated`, `invalidation_reason = dsa_inactive`; export artifact destroyed; `signal_enforcement_trigger` Category B audit emitted; partner notified per DSA terms. |
| 2. K-anonymity threshold violation | `k_threshold_actual < k_min_required` at de-identification output | `k_anonymity_violation` | Per I-029 condition 2: `research.export_completed` MUST emit with `k_threshold_actual` value recorded, `status = invalidated`, `invalidation_reason = k_anonymity_violation`; export artifact destroyed; `signal_enforcement_trigger` emitted; engineering review of cohort definition required before re-attempt. |
| 3. Permitted-domain drift | `permitted_data_domains_at_export` differs from the `research.export_initiated` snapshot at completion time | `permitted_domain_drift` | Per I-029 condition 3: `research.export_completed` MUST emit with `permitted_data_domains_at_export` showing drift, `status = invalidated`, `invalidation_reason = permitted_domain_drift`; export artifact destroyed; `signal_enforcement_trigger` emitted; CCR audit triggered to determine whether enum was modified mid-export (governance violation if so). |
| 4. Consent-cohort hash mismatch | `consent_cohort_snapshot_hash_completed ≠ consent_cohort_snapshot_hash_initiated` (cohort changed mid-export by any mechanism — adds, removes, version bumps) | `consent_cohort_change` | Per I-029 condition 4: `research.export_completed` MUST emit with `status = invalidated`, `invalidation_reason = consent_cohort_change`; export artifact destroyed; `signal_enforcement_trigger` emitted. **Recompute / re-export only after** the failed `research.export_completed(status=invalidated)` audit record is in place — a fresh `research.export_initiated` with a new snapshot creates a new export entity. |
| 5. Per-patient active-consent failure | Any contributing patient's `ResearchConsent` is not active at completion-time evaluation: `consent_type ≠ research_data_use`, OR `granted_at` null, OR `revoked_at` non-null. Covers BOTH (a) mid-export `research_consent.revoked` events AND (b) pre-existing stale/invalid consent records that existed before initiation | `consent_revocation_mid_export` | Per I-029 condition 5: `research.export_completed` MUST emit with `status = invalidated`, `invalidation_reason = consent_revocation_mid_export`; export artifact destroyed; `signal_enforcement_trigger` emitted. **Recompute / re-export pathway**: only after the failed completion audit is recorded MAY the cohort be recomputed (excluding the failed patient(s)) under a new `consent_cohort_snapshot_hash`; if k-anonymity remains satisfiable after exclusion, a new `research.export_initiated` is emitted with the new snapshot creating a new export entity; if not satisfiable, the recompute is itself invalidated (creates a new condition-2 record). The original failed export is never resurrected. |

### 7.3 Research export SIGNAL controls

The platform emits dashboard / monitoring signals on:

- DSA expiry within 30 days (warning) / 7 days (urgent escalation)
- REC approval expiry within 30 days
- Cohort cell suppression rate exceeding 25% (potential cohort design issue)
- Marketing copy governance review approaching cadence expiry (per `marketing_governance_review_cadence_months`)
- Cross-border transfer evidence approaching counsel artifact expiry

---

## 8. PolicyAuthorization framework — placeholder (added v5.2 per ADR-029 / future ADR-030)

**PolicyAuthorization placeholder.** The PolicyAuthorization entity (per TYPES v5.2 placeholder skeleton; AUTONOMY_LEVELS contract §6 cross-reference) is the autonomy-grant primitive for AI workloads operating at autonomy levels above `action_with_confirm`. **At v1.0, PolicyAuthorization is NOT activated** — no AI workload may invoke an autonomy level requiring it. The skeleton exists to:

1. Document the data shape that future ADR-030 implementations will consume.
2. Reserve the `pau_` ID prefix and the placeholder schema in TYPES v5.2.
3. Provide the runtime validator with a target type to reject (per AUTONOMY_LEVELS §5 rule 4 — reserved autonomy levels MUST be rejected for lack of a valid PolicyAuthorization reference at v1.0).

When ADR-030 (Tiered Autonomy Progression Model) activates, the PolicyAuthorization skeleton becomes operative. Activation prerequisites per AUTONOMY_LEVELS contract §3.1 / §3.2 (including triple sign-off, per-market regulatory clearance, named successor invariant superseding I-012, augmented safety case for `fully_autonomous`, activation audit event in immutable audit chain).

This contract does NOT implement PolicyAuthorization at v1.0 — only documents the placeholder. Implementation lands when ADR-030 is accepted and a follow-on GOVERNANCE_CONTROLS revision is authored.

---

## Document control

- **v5.0** — Initial governance controls contract (CONFIG, INCIDENT, SIGNAL contracts).
- **v5.1** — Adds §6 Tenant scoping per ADR-023. Tenant-scoped vs platform-scoped configuration / incident / signal controls. Threading remediation per Adversarial Counsel Review v1.0 finding CRITICAL-01. Existing CONFIG/INCIDENT/SIGNAL contracts preserved without modification.
- **v5.2 (2026-05-02 per v1.10.1 hygiene cycle physical merge of v1.10 PRD Update Cycle delta artifact `Phase3_Group3_Contracts_v1_10_Edits_2026-05-01.md` §GOVERNANCE_CONTROLS)** — Adds §7 Research data export control envelope per ADR-028: §7.1 CONFIG controls (activation state, permitted data domains, k-anonymity threshold, cross-border transfer mechanism, DSA activation — all bound by ADR-028 v0.4 quad sign-off + REC concurrence + counsel artifacts as applicable); §7.2 INCIDENT controls with audit-path discipline (DSA expiry mid-export, k-anonymity threshold violation, permitted-domain drift, consent revocation mid-export — all use the AUDIT_EVENTS v5.2 §5 incident-response pattern of `research.export_completed` with `status = invalidated` paired with `signal_enforcement_trigger` Category B audit; bare suppression forbidden per I-003); §7.3 SIGNAL controls (DSA expiry warnings, REC approval expiry, cohort suppression rate, marketing review cadence expiry, cross-border counsel artifact expiry). Adds §8 PolicyAuthorization framework placeholder per ADR-029 / future ADR-030 (NOT activated at v1.0; documents shape, reserves `pau_` prefix and skeleton schema in TYPES v5.2, provides validator a target type to reject for reserved autonomy levels). Per ADR-028 + ADR-029 + INVARIANTS v5.2 I-029 / I-030 / I-031 + AUDIT_EVENTS v5.2 §5 + AUTONOMY_LEVELS contract §3.1/§3.2/§5 + Master PRD v1.10 §15.3. Existing §1–§6 (CONFIG / INCIDENT / SIGNAL contracts + tenant scoping) preserved without modification. v5.2 is purely additive.
