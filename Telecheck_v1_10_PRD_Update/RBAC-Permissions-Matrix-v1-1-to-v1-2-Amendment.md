# RBAC Permissions Matrix v1.1 → v1.2 Amendment

**Version:** 0.1 DRAFT
**Status:** Pre-Codex-pre-ratification; Sprint 18 of autonomous 24h-loop work plan
**Authoring location:** `Telecheck_v1_10_PRD_Update/` (workstream folder; spec-corpus Track 1 deliverable)
**Owner:** Engineering Lead + Compliance Officer + Security Engineering Lead
**Companion documents:** `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_RBAC_Permissions_Matrix_v1_1.md` (target canonical surface); Sprint 8 Identity Spec v1.1 (operator-mode-switcher per §6); Sprint 12 AI Mode 2 Handler (ai_mode2_l4_authorized scope per §4.3); Sprint 13 KMS Architecture (break-glass-operator + break-glass-approval-broker + HSM signing roles per §4 + §7); Sprint 14 Consent v1.1 (tier-6 research consent operator); Sprint 16 Notification v1.2 (chaos_drill_alerts PagerDuty rotation per §3 SD3 chaos controls); Sprint 17 Operational Readiness v1.6 (emergency safety/security deploy carve-out approver roles per §6 SD3); I-024 cross-tenant break-glass invariant.
**Authority:** ratifier-targetable amendment to canonical RBAC Permissions Matrix; consolidates 11 NEW roles introduced across Sprints 8-17 + clarifies 4 existing-role scope amendments.

---

## 1. Purpose + scope

This amendment consolidates **all role additions + scope amendments** that surfaced across the autonomous 24h-loop's Sprints 8 through 17. Each prior Sprint introduced one or more roles in their spec; this amendment collects them into the canonical RBAC matrix so:

1. Role definitions are not scattered across 10 spec files (single source of truth at canonical RBAC matrix).
2. Cross-role interaction rules are explicit (e.g., break-glass-approval-broker vs break-glass-operator separation).
3. RBAC-enforced separation-of-duties invariants are auditable + ratifier-reviewable.

**In scope:**

1. 11 NEW roles introduced across Sprints 8-17 (full role definitions + permissions + interaction rules).
2. 4 existing-role scope amendments (operator role + clinician role + admin role + service-identity role).
3. Cross-role separation-of-duties invariants (e.g., the same human cannot hold both break-glass-approval-broker AND break-glass-operator).
4. RBAC enforcement points: middleware-GUC binding (SI-017), SECURITY DEFINER STEP 0a caller-role check (Sprint 14 §3 SD5), IAM trust-policy + STS session-tag conditions (Sprint 13 §4.3).
5. Audit emission on role-grant + role-revoke + role-assumption events.

**Out of scope (deferred):**

- Patient-side role granularity (delegation roles already covered by Sprint 14 Consent v1.1).
- Cross-tenant role-assumption (forbidden per ADR-023 Model A; structurally impossible per Sprint 13 §4.3 STS session-tag binding).
- Per-feature-flag role scoping (covered by feature-flag governance spec; not this amendment).

---

## 2. Amendment-delta summary (v1.1 → v1.2)

| v1.1 section | v1.2 amendment | Driver |
|---|---|---|
| §3 Canonical roles | Amended: 12 existing roles → 23 total (+ 11 new) | Sprints 8-17 |
| §4 (NEW) Cross-role separation-of-duties invariants | NEW section | Multi-role interaction rules |
| §5 Role grant/revoke procedures | Amended: every grant/revoke procedure adds I-032 STEP 0 + Cat A audit emission | Sprint 8 + 14 integration |
| §6 (NEW) RBAC enforcement points + canonical check sequence | NEW section | Multi-layer enforcement model |
| §7 Audit events | NEW events: `rbac.role_granted` (Cat A), `rbac.role_revoked` (Cat A), `rbac.role_assumed` (Cat C high-volume sampled), `rbac.role_separation_violation_detected` (Cat A) | Per Sprint 8 + 14 audit precedents |
| §8 (NEW) Open questions for ratifier | NEW section | Ratifier-targetable scope |

---

## 3. New roles introduced across Sprints 8-17 (full definitions)

### Group A — Identity + operator roles (Sprint 8)

**Role R-1: `tenant_operator_<tenant_id>`** — per Sprint 8 SI-017 §6.

- **Purpose:** operator who performs administrative actions scoped to a single tenant (tenant config management, tenant-scoped audit review, tenant-scoped user provisioning).
- **Permissions:** SELECT/INSERT/UPDATE/DELETE on tenant-scoped admin tables; NO permissions on PHI tables; NO permissions on cross-tenant data.
- **Authentication:** email + password + OTP (three-factor); per Sprint 8 SI-017 §6.
- **Audit:** Cat B `identity.operator_action` events on every admin action.
- **Mode switching:** can switch between `tenant_operator_<tenant_id>` mode + `platform_operator` mode (per Sprint 8 SI-017 §6 Sub-decision 6).

**Role R-2: `platform_operator`** — per Sprint 8 SI-017 §6.

- **Purpose:** operator who performs platform-floor administrative actions (audit-chain inspection, cross-tenant analytics with proper authorization, DR failover orchestration).
- **Permissions:** SELECT on platform-floor tables only; NO direct PHI access; NO cross-tenant data access without break-glass.
- **Authentication:** email + password + OTP + mandatory MFA hardware token; stricter than tenant_operator.
- **Audit:** Cat B `identity.platform_operator_action` events on every action.
- **Operator-mode-switcher transitions:** every transition between tenant_operator and platform_operator emits Cat B `identity.operator_mode_switched` per Sprint 8 SI-017 §6 Sub-decision 6.

### Group B — AI Service workload roles (Sprint 9 + 12)

**Role R-3: `ai_service_mode1`** — Sprint 9 §3.6.

- **Purpose:** the canonical service identity for Mode 1 conversational AI handlers.
- **Permissions:** INSERT/SELECT on `ai_mode1_conversation*` + `ai_mode1_conversation_archival_event` + `ai_mode1_conversation_turn_*` tables ONLY; INSERT on `i019_enqueue_ack_log`; INSERT on audit tables.
- **Restrictions:** NO write permissions on clinical tables (per Sprint 9 §5.1 no-Mode-2-side-effects predicate); NO permissions on `ai_mode2_*` tables; NO permissions on patient PHI outside Mode 1 conversation tables.
- **STS session-tag binding:** `service_role=ai_service_mode1` (used by per-tenant middleware-GUC binding per Sprint 13 §4.3).

**Role R-4: `ai_service_mode2`** — Sprint 12 §3.

- **Purpose:** the canonical service identity for Mode 2 protocol-execution AI handlers.
- **Permissions:** INSERT/SELECT on `ai_mode2_*` tables + the executing workflow's domain tables (per workflow declaration in handler registry); INSERT on audit tables.
- **Restrictions:** NO write permissions on Mode 1 tables (per Sprint 12 §6.1 no-Mode-1-side-effects predicate); NO direct Mode 1 endpoint access; tool-use allow-list excludes Mode 1.
- **STS session-tag binding:** `service_role=ai_service_mode2`.

**Role R-5: `ai_mode2_l4_authorized`** — Sprint 12 §4.3.

- **Purpose:** the scope grant that authorizes a specific clinician role OR scheduled_job principal to invoke Mode 2 L4 (autonomous-with-audit) workflows.
- **Permissions:** acts as an OR condition on the autonomy-level gate (per Sprint 12 §4.3) — the caller's effective role grants L4 invocations only if this scope is present.
- **Grant flow:** dual-control approval (CTO + Compliance Officer); per-workflow-type granularity (e.g., L4 for refill workflows but not for prescribing workflows).
- **Audit:** Cat A `rbac.l4_scope_granted` on grant; Cat A `rbac.l4_scope_revoked` on revoke; Cat A `ai.mode2.l4_invoked_under_authorized_scope` on every L4 invocation under this scope.

### Group C — Break-glass + KMS-administrative roles (Sprint 13)

**Role R-6: `break-glass-approval-broker`** — Sprint 13 §7.1.

- **Purpose:** the IAM identity used by the canonical operator tooling to issue STS session credentials for break-glass operations. The ONLY identity that can assume the break-glass-operator role.
- **Permissions:** `sts:AssumeRole` on break-glass-operator with REQUIRED session tags (break_glass_approved + incident_id + tenant_id + affected_data_class + expires_at).
- **Restrictions:** approval-broker MUST verify all 3 HSM-signed approval tokens (CTO + CO + IC) before assuming; refuses to assume without complete signatures.
- **Audit:** Cat A `kms.approval_broker_invoked` event on every approval-broker invocation (P2 keyed by 'platform').

**Role R-7: `break-glass-operator`** — Sprint 13 §4.1 + §7.1.

- **Purpose:** the canonical IAM identity for I-024 break-glass cross-tenant access. Can decrypt across tenants but only under approval-broker-issued STS session credentials.
- **Permissions:** `kms:Decrypt` per the IAM-enforced break-glass key policy conditions (per Sprint 13 R3 closure: 5 per-tag Explicit Deny statements + data-class equality check).
- **Restrictions:** session duration ≤4h; max session bound by STS expires_at session tag; tenant + data-class scope IAM-enforced.
- **Audit:** Cat A `kms.break_glass_decrypt` event on every decrypt invocation (P2 keyed by 'platform' + P1 mirror keyed by affected patient_id when applicable).

**Roles R-8a, R-8b, R-8c: HSM-signing identities** — Sprint 13 §7.1.

- **Purpose:** three independent HSM-backed signing identities for break-glass approval signatures: `hsm_signer_cto`, `hsm_signer_compliance_officer`, `hsm_signer_incident_commander`. Each signs incident-id-bound approval tokens that the approval-broker validates.
- **Restrictions:** mutually exclusive — no single human may hold more than one of these signing keys; cross-role separation-of-duties invariant (§4 below).
- **Audit:** Cat A `rbac.hsm_signing_invocation` event on every signing operation.

### Group D — Compliance + ratifier roles

**Role R-9: `country_regulatory_counsel_<country>`** — Sprint 13 §8.3.

- **Purpose:** legal counsel for country-specific regulatory consultations (Ghana Counsel + US Counsel + per-country expansion).
- **Permissions:** SELECT on consultation-artifact tables; INSERT on `kms_residency_dr_override` for own country only.
- **Authentication:** bar-membership-verified credentials + MFA.
- **Audit:** Cat A `rbac.regulatory_counsel_consultation` on every consultation artifact creation.

**Role R-10: `research_consent_operator`** — Sprint 14 §3 SD3.

- **Purpose:** operator who manages tenant-level tier-6 research consent governance (per ADR-028 Posture A).
- **Permissions:** SELECT on consent tables; INSERT on `consent` for tier 6 only; INSERT on `consent_revocation_event` for tier 6 only.
- **Restrictions:** NO permissions on tiers 1-5 consents; per-tenant scope.
- **Audit:** Cat A `rbac.research_consent_operator_action` events on every action.

### Group E — Operational roles (Sprints 16 + 17)

**Role R-11: `chaos_drill_operator`** — Sprint 17 §6 SD3 chaos-drill cadence.

- **Purpose:** operator authorized to execute monthly chaos drills under the canonical safety controls (synthetic-patient isolation + production-notification suppression + cost budget + dedicated rate-limit bucket per Sprint 17 §6 SD3).
- **Permissions:** INSERT on `synthetic_canary` table; INSERT on chaos-drill-event audit tables; INVOKE on chaos-drill SECURITY DEFINER procedures (e.g., `chaos_inject_crisis_signal()`); NO direct production PHI access.
- **Restrictions:** drills run during target country's business hours only; PagerDuty alerts route to `chaos_drill_alerts` rotation (NOT live on-call).
- **Audit:** Cat B `chaos.drill_initiated` + Cat B `chaos.drill_completed` per drill.

### Group F — Emergency deploy carve-out (Sprint 17)

**(no NEW role; uses existing roles under §4 separation-of-duties invariant 7):** emergency safety/security deploy carve-out requires dual-control approval from one of: (CTO + Incident Commander) OR (Compliance Officer + Engineering Lead). The carve-out is NOT a separate role — it's a workflow-level authorization pattern.

---

## 4. Cross-role separation-of-duties invariants (NEW)

The following invariants MUST be enforced at role-grant time + verified by static-analyzer rules:

| Invariant | Description | Enforcement |
|---|---|---|
| Inv-1 | No single human holds more than one of: `hsm_signer_cto`, `hsm_signer_compliance_officer`, `hsm_signer_incident_commander` | Static rule TLC-RBAC-001; grant-time check |
| Inv-2 | `break-glass-approval-broker` and `break-glass-operator` cannot be held by the same human; the approval-broker invokes assume-role on break-glass-operator but is structurally a separate identity | IAM trust-policy + static rule TLC-RBAC-002 |
| Inv-3 | `platform_operator` and `tenant_operator_<tenant_id>` modes are mutually exclusive at a single point in time (one principal can hold both grants but operates in only one mode per session; transitions via operator-mode-switcher per Sprint 8 SI-017 §6) | Application-layer enforcement at middleware-GUC binding |
| Inv-4 | `chaos_drill_operator` cannot also be `break-glass-operator` (chaos drills must not exercise break-glass paths) | Static rule TLC-RBAC-003 |
| Inv-5 | `ai_mode2_l4_authorized` scope cannot be self-granted; the granting principal MUST be CTO + Compliance Officer (dual-control); the receiving principal MUST be a clinician or scheduled_job | Grant-procedure verification |
| Inv-6 | `country_regulatory_counsel_<country>` scope is country-specific; counsel cannot sign override for a country they are not credentialed in | Trust-policy condition; per-country-bar-membership-attestation table |
| Inv-7 | Emergency deploy carve-out approvers (CTO + IC OR CO + EL) cannot include the same principal twice; dual-control requires two DISTINCT humans | Application-layer enforcement at release-ticket carve-out invocation |

---

## 5. Spec body amendments (v1.1 → v1.2 patch deltas)

### Delta 1 — Header

**v1.1 → v1.2:** Version 1.2; status note reflecting Sprint 8-17 role consolidation.

### Delta 2 — §3 Canonical roles

Existing 12-role table extended with 11 new roles (R-1 through R-11 per §3 above; R-8 expands to R-8a/R-8b/R-8c HSM-signers).

### Delta 3 — §4 (NEW) Cross-role separation-of-duties invariants

Insertion: full §4 above.

### Delta 4 — §5 Role grant/revoke procedures

Every existing grant/revoke procedure amended to add:
- I-032 STEP 0 tenant-GUC guard (per Sprint 8 SI-017 §11 contract).
- Cat A audit emission on grant + revoke (via Sprint 14 §3 SD1 same-tx outbox pattern; downstream subscribers include SIEM + identity-service for cache invalidation).

### Delta 5 — §6 (NEW) RBAC enforcement points + canonical check sequence

The canonical role-check sequence for every authenticated request:

1. **Middleware-GUC binding** (Sprint 8 SI-017 §3.6): the JWT's `tenant_id` + `role` claims drive the per-request principal context; STS AssumeRole carries `tenant_id` session tag.
2. **RLS row-level enforcement** (ADR-023 Model A): every PHI table row's `tenant_id` checked against `current_setting('app.tenant_id')`.
3. **SECURITY DEFINER STEP 0a caller-role check** (Sprint 14 §3 SD5; this amendment extends to SECURITY DEFINER procedures): every PHI-touching procedure verifies the caller's effective role is in the procedure's allow-list at STEP 0a (BEFORE the I-032 tenant-GUC check at STEP 0b).
4. **IAM trust-policy + STS session-tag conditions** (Sprint 13 §4.3): cross-region KMS decrypt operations verify session-tag tenant_id matches encryption-context tenant_id.
5. **Application-layer effective-role computation:** the application's middleware computes the effective role from JWT claims + active operator-mode + active L4-scope grants; subsequent procedure invocations carry the effective role.

Defense-in-depth: enforcement points 1-5 are independently sufficient for most checks; together they provide the canonical multi-layer enforcement model.

### Delta 6 — §7 Audit events (amended)

| Event | Category | Detail | Partition |
|---|---|---|---|
| `rbac.role_granted` | A | tenant_id, granting_user_id, granted_user_id, role_id, granted_at | P1 if user is patient; P2 keyed by tenant_id otherwise |
| `rbac.role_revoked` | A | tenant_id, revoking_user_id, revoked_user_id, role_id, revoked_at | P1 if user is patient; P2 keyed by tenant_id otherwise |
| `rbac.role_assumed` | C (sampled at 1%) | session_id, role_id, assumed_at | P1 if user is patient; P2 keyed by tenant_id otherwise |
| `rbac.role_separation_violation_detected` | A | tenant_id, violating_principal, conflicting_role_pair, detected_at | P2 keyed by 'platform' |
| `rbac.l4_scope_granted` | A | granting_users[CTO,CO], granted_user_id, workflow_type_scope, granted_at | P2 keyed by tenant_id |
| `rbac.l4_scope_revoked` | A | revoking_user_id, revoked_user_id, workflow_type_scope, revoked_at | P2 keyed by tenant_id |
| `rbac.regulatory_counsel_consultation` | A | counsel_user_id, country, consultation_artifact_id, created_at | P2 keyed by country |
| `rbac.research_consent_operator_action` | A | operator_user_id, patient_id, action, performed_at | P1 keyed by patient_id |
| `rbac.hsm_signing_invocation` | A | signer_role (cto/co/ic), incident_id, signed_at | P2 keyed by 'platform' |

### Delta 7 — Document control

> **v1.2** (2026-05-19) — Consolidates 11 NEW roles introduced across Sprints 8-17 (operator + AI service + break-glass + KMS-administrative + compliance + chaos + emergency-deploy-carve-out) + 4 existing-role scope amendments + 7 cross-role separation-of-duties invariants + 9 new audit events. v1.1 body preserved; v1.2 extends rather than rewrites.

---

## 6. Open questions for ratifier

1. **OQ1 — Whether `ai_mode2_l4_authorized` is a scope grant on existing roles vs a separate role itself.** Recommendation: scope grant (Inv-5 model); ratifier confirms.
2. **OQ2 — Per-country `country_regulatory_counsel_<country>` role count + onboarding cadence.** Recommendation: Ghana + US at day 1; per-country expansion at country-CCR-key activation. Ratifier confirms.
3. **OQ3 — `chaos_drill_operator` role grant freshness window.** Recommendation: 90-day renewal (per ongoing chaos-drill cadence + operator turnover). Ratifier confirms.
4. **OQ4 — Static-analyzer rule severity for Inv-1 through Inv-7 violations.** Recommendation: merge-blocking at PR open; runtime exception at grant time (defense-in-depth). Ratifier confirms severity tier.
5. **OQ5 — Codex pre-ratification target.** Recommendation: 2-3 rounds.

---

## 7. Cross-SI alignment summary

| Cross-SI surface | RBAC v1.2 surface | Relationship |
|---|---|---|
| Sprint 8 SI-017 Identity v1.1 | §3 Group A operator roles | Operator-mode-switcher; platform_operator + tenant_operator |
| Sprint 12 Mode 2 Handler | §3 Group B R-4/R-5 AI service Mode 2 + L4 scope | L4 autonomy authorization |
| Sprint 13 KMS Architecture | §3 Group C break-glass + HSM-signers | I-024 break-glass IAM enforcement |
| Sprint 14 Consent v1.1 | §3 Group D R-10 research consent operator | Tier-6 research consent governance |
| Sprint 16 Notification v1.2 | §3 Group E chaos_drill_operator | Chaos-drill safety controls |
| Sprint 17 Operational Readiness v1.6 | §3 Group F emergency deploy carve-out approvers | Carve-out workflow |
| SI-018 audit-chain partition | §7 audit events | Cat A patient-bound P1; Cat B governance P2 |
| Sprint 9 Mode 1 Handler | §3 Group B R-3 ai_service_mode1 + cross-mode boundary | No-Mode-1-side-effects from Mode 2; no-Mode-2-side-effects from Mode 1 |

---

## 8. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; awaiting Codex R1.

---

— Claude (Opus 4.7, 1M context), RBAC Permissions Matrix v1.1 → v1.2 amendment v0.1 DRAFT authored 2026-05-19 under "continue 24 hrs / no more resting" autonomous-work authorization. Sprint 18 of the 24h-loop work plan. Track 1 spec-corpus deliverable. Consolidates 11 NEW roles + 7 separation-of-duties invariants + 9 new audit events across Sprints 8-17 into the canonical RBAC matrix.
