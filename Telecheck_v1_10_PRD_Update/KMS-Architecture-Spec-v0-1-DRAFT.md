# KMS Architecture Specification

**Version:** 0.1 DRAFT
**Status:** Pre-Codex-pre-ratification; Sprint 13 of autonomous 24h-loop work plan
**Authoring location:** `Telecheck_v1_10_PRD_Update/` (workstream folder; spec-corpus Track 5 Infra/Ops deliverable)
**Owner:** SRE Lead + Compliance Officer + Security Engineering Lead (tri-owner per KMS posture's intersection of operations + regulatory + cryptographic governance)
**Companion documents:** Cold-DR Runbook v0.1 (Sprint 7; resolves Cold-DR OQ2 multi-region key policy details); ADR-026 single-region+cold-DR architecture; I-026 per-tenant KMS encryption invariant; Contracts Pack v5.2 INVARIANTS + AUDIT_EVENTS + CCR_RUNTIME; SI-018 audit-chain partition rule; Ghana Launch Playbook v1.2 (country-specific KMS posture).
**Authority:** canonical KMS architecture for Telecheck multi-tenant platform; defines per-tenant key hierarchy + multi-region key policy + DR-survivable key access + key-rotation cadence + break-glass key access controls.

---

## 1. Purpose + scope

This specification defines the **canonical KMS architecture** for Telecheck per I-026 (per-tenant KMS encryption) + ADR-026 (single-region+cold-DR). It resolves **Cold-DR OQ2** (multi-region key policy details) by specifying the key-policy IAM, cross-region replication, and region-pinning per tenant.

**In scope:**

1. Per-tenant master key (CMK) hierarchy: tenant CMK + per-data-class derived data keys.
2. Multi-region key replication: AWS KMS multi-region keys for DR-survivability per ADR-026.
3. IAM key policy: who/what can decrypt under what conditions.
4. Key rotation: cadence + procedure + audit.
5. Break-glass key access: I-024 cross-tenant access controls + dual-control gates.
6. Key-access audit emission: Cat A audit events for all decrypt operations on Cat A-classified PHI.
7. DR-failover key-access continuity (resolves Cold-DR OQ2).
8. Country-specific regulatory residency for keys (CCR-driven; per-tenant region pinning).
9. Test coverage commitments with concrete CI gates.

**Out of scope (deferred):**

- HSM-backed signing keys for audit-chain transparency log (covered by SIEM Spec §4.5.HC; potential SI-021 split candidate).
- Cryptographic protocol details for transport security (TLS termination; not KMS concern).
- Patient-side key generation (e.g., PGP-style end-user keys for off-platform comms; not v1.0).
- Quantum-resistant cryptography migration plan (Phase 3+; not v1.0).

---

## 2. Per-tenant key hierarchy

### 2.1 Three-tier key hierarchy

For each tenant, the canonical key hierarchy has three tiers:

| Tier | Key | Scope | Storage | Rotation Cadence |
|---|---|---|---|---|
| 1 | **Tenant CMK** (Customer Master Key) | One per tenant | AWS KMS multi-region; never exported | Annual + on-demand on compromise |
| 2 | **Per-data-class DEK** (Data Encryption Key) | One per (tenant, data_class) | Encrypted-at-rest using Tenant CMK; cached in-memory for active workloads | Quarterly |
| 3 | **Per-row envelope** | One per encrypted-at-rest row (PHI tables) | Stored in encrypted ciphertext field alongside the row | Per-row; replaced at rest only on data-class DEK rotation reencrypt |

### 2.2 Data classes

PHI data is classified into the following data classes; each tenant has a separate DEK per data class:

| Data class | Examples | Why separate DEK |
|---|---|---|
| `pii_demographic` | Name, DOB, address, phone | Lowest sensitivity; broadest read access |
| `pii_clinical` | Diagnoses, medications, lab results | Clinical staff read; encrypted at rest with separate DEK |
| `pii_sensitive_clinical` | Mental health, reproductive health, substance use | Restricted-role access; separate DEK enables targeted access revocation |
| `pii_financial` | Payment cards (tokenized; raw never stored), insurance details | PCI / financial regulatory scope; separate DEK for compliance auditability |
| `pii_conversation` | Mode 1 user_message + assistant_message; Mode 2 workflow_input/output where PHI | Conversation-scope data; separate DEK enables targeted retention policy |
| `pii_audit_payload` | Audit row payload containing PHI references | Audit-chain bound; separate DEK enables long-retention compliance archival |
| `pii_research_consented` | Research-consented data (per ADR-028 Posture A) | Separate DEK so consent-revocation can lock further reads while preserving historical durability |

### 2.3 Per-tenant CMK uniqueness invariant

I-026 + I-023 require per-tenant KMS keys: NO two tenants share a CMK. This is structurally enforced by:

1. CMK creation procedure: invoked at tenant onboarding; creates a fresh multi-region CMK; binds CMK ARN to `tenant.cmk_arn` in tenant table (immutable post-creation; mutation forbidden by SECURITY DEFINER + I-027).
2. KMS access policy: each tenant's CMK has a unique key policy granting decrypt rights ONLY to the IAM roles for that tenant's service identities.
3. Decrypt-operation enforcement: application-layer decrypt MUST use the tenant's CMK ARN looked up via `tenant.cmk_arn`; cross-tenant CMK invocation results in AWS KMS AccessDeniedException + Cat A `kms.cross_tenant_decrypt_attempted` audit event.

---

## 3. Multi-region key replication (resolves Cold-DR OQ2)

### 3.1 AWS KMS multi-region key topology

Each tenant CMK is created as an AWS KMS **multi-region key** with:

- **Primary replica** in us-east-1 (the canonical primary region per ADR-026).
- **Replica copy** in us-west-2 (the canonical cold-DR region per ADR-026).
- The two replicas share the same key material + key ID + key policy; either can decrypt ciphertext encrypted by the other.
- Replication is automatic and managed by AWS KMS (not by the application layer).

### 3.2 Region-pinning per tenant (CCR-driven)

For tenants with country-specific data residency requirements:

- `tenant.kms_residency_policy` CCR key declares the residency constraint: `{us_only, us_with_dr_fallback, multi_region_active_active}`.
- **us_only:** the tenant's CMK is single-region (us-east-1); no us-west-2 replica. DR is degraded — cold-DR failover requires manual ratifier approval + temporary residency-policy override (audited via Cat B `kms.residency_policy_dr_override` event).
- **us_with_dr_fallback** (default for Telecheck-US + Telecheck-Ghana per ADR-026): multi-region CMK with us-east-1 primary + us-west-2 replica. DR failover is automatic + canonical.
- **multi_region_active_active:** reserved for future Phase 3+ active-active deployments. Not used at v1.0.

### 3.3 Cross-region encryption interop

Ciphertext encrypted under a multi-region CMK in us-east-1 can be decrypted by the same CMK's us-west-2 replica without re-encryption. This is the canonical property enabling Cold-DR failover: PHI ciphertext stored in us-east-1 RDS + replicated to us-west-2 RDS remains decryptable after us-west-2 promotion + tenant-routing cutover.

### 3.4 Key-rotation cross-region propagation

When the tenant CMK is rotated (annual + on-demand):

- The rotation is initiated against the multi-region key's primary replica (us-east-1 under normal operation; us-west-2 under DR-active state).
- AWS KMS propagates the new key version to the secondary replica automatically.
- Cat A `kms.cmk_rotated` audit event emitted (P2 keyed by tenant_id + `'platform'` for the platform CMK; the rotation is per-tenant + visible to the tenant's audit trail).
- Per-row envelope keys are NOT re-encrypted on CMK rotation (envelope keys are encrypted under the data-class DEK, not the CMK directly); the data-class DEK is independently rotated per §6.

---

## 4. IAM key policy

### 4.1 Canonical key policy structure

Each tenant's CMK has the following IAM policy structure:

```json
{
  "Version": "2012-10-17",
  "Id": "tenant-<tenant_id>-cmk-policy",
  "Statement": [
    {
      "Sid": "AllowTenantServiceRoleDecrypt",
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::<account>:role/tenant-<tenant_id>-service" },
      "Action": ["kms:Decrypt", "kms:GenerateDataKey", "kms:DescribeKey"],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "kms:EncryptionContext:tenant_id": "<tenant_id>"
        }
      }
    },
    {
      "Sid": "AllowKMSAdminRotation",
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::<account>:role/kms-admin" },
      "Action": ["kms:Rotate", "kms:DescribeKey", "kms:ListAliases"],
      "Resource": "*"
    },
    {
      "Sid": "AllowBreakGlassAccess",
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::<account>:role/break-glass-operator" },
      "Action": ["kms:Decrypt"],
      "Resource": "*",
      "Condition": {
        "Bool": { "aws:MultiFactorAuthPresent": "true" },
        "StringEquals": { "kms:EncryptionContext:break_glass_authorized": "true" }
      }
    }
  ]
}
```

### 4.2 Encryption context binding

Every Encrypt and Decrypt operation MUST include the canonical encryption context:

```json
{ "tenant_id": "<tenant_id>", "data_class": "<data_class>" }
```

The IAM policy's `Condition` block enforces `tenant_id` equality at the AWS KMS API layer. **An application bug that constructs the wrong encryption context (e.g., passing tenant_A's CMK with tenant_B's encryption context) fails at AWS KMS** with InvalidCiphertextException — providing a third defense-in-depth layer beyond RLS + I-032 STEP 0.

### 4.3 Service role per tenant

Each tenant has a dedicated IAM role `tenant-<tenant_id>-service` granted decrypt access to ONLY that tenant's CMK. This role is assumed by the application's service identity when handling requests for that tenant; the assumption is mediated by the canonical middleware-GUC binding (SI-017 §3.6).

**Cross-tenant role-assumption attempts** are blocked at the IAM layer (assume-role policies enumerate the canonical app identity as the only allowed principal). Attempted cross-tenant assume-role → Cat A `kms.cross_tenant_role_assume_attempted` event.

---

## 5. Decrypt-operation audit

### 5.1 Per-decrypt Cat A audit emission

Every decrypt operation on Cat A-classified PHI emits a Cat A audit event:

| Event | Payload | Partition |
|---|---|---|
| `kms.decrypt_invoked` | tenant_id, cmk_arn, data_class, encryption_context_hash, requesting_session_id, requesting_role, decrypted_byte_count | P1 keyed by patient_id (if patient_id derivable from request context); P2 keyed by tenant_id otherwise |

Sampling: per-decrypt events for `pii_sensitive_clinical` + `pii_financial` + `pii_audit_payload` are NEVER sampled (every event recorded). Decrypts of other data classes are sampled at 1% (the volume would otherwise overwhelm the audit chain; the sampled trail is sufficient for forensic analysis).

### 5.2 Decrypt-failure audit

Every decrypt failure (regardless of cause) emits a Cat A `kms.decrypt_failed` event:

| Failure class | Audit detail |
|---|---|
| Cross-tenant CMK invocation | failure_reason='cross_tenant_decrypt', expected_tenant_id, observed_tenant_id_from_context |
| Encryption context mismatch | failure_reason='encryption_context_mismatch', cmk_arn, presented_context, expected_context_keys |
| CMK access denied | failure_reason='access_denied', cmk_arn, requesting_role |
| CMK not found | failure_reason='cmk_not_found', cmk_arn_presented |
| KMS service error | failure_reason='kms_service_error', error_code |

---

## 6. Key rotation

### 6.1 Rotation cadence + procedure

| Key tier | Cadence | Procedure |
|---|---|---|
| Tenant CMK | Annual (12-month interval from creation) + on-demand on compromise | Invoke `kms:Rotate` on the multi-region CMK; AWS KMS handles cross-region propagation; emit Cat A `kms.cmk_rotated`; no re-encryption of existing data (CMK rotation is transparent — ciphertext under the old version remains decryptable; new encryptions use the new version) |
| Per-data-class DEK | Quarterly (3-month interval) | New DEK generated; existing ciphertext fields re-encrypted via background job over a 30-day window; emit Cat A `kms.dek_rotation_started` + Cat A `kms.dek_rotation_completed`; the rotation job is interruptible + resumable (per-row idempotency keyed by `(tenant_id, data_class, row_id, dek_version)`) |
| Per-row envelope | On-demand; replaced at rest only when data-class DEK rotates | Each rotation pass re-encrypts envelope keys under the new DEK; per-row idempotency prevents double-rotation |

### 6.2 On-demand emergency rotation

On suspected compromise:

1. Operator (Compliance Officer + CTO; dual-control per I-015) invokes the emergency-rotation procedure.
2. The tenant CMK is rotated immediately + all per-data-class DEKs are rotated immediately (interleaved background jobs).
3. Cat A `kms.emergency_rotation_initiated` event emitted with `compromise_reason` + dual-control authorizing identities recorded.
4. The 30-day DEK rotation window is compressed to 24 hours for emergency rotation (higher cost; justified by compromise).
5. Post-rotation Cat A `kms.emergency_rotation_completed` event.

### 6.3 Rotation audit chain

The complete rotation audit chain is reconstructable per tenant + per key from the Cat A events. The audit chain is the canonical compliance evidence for HIPAA + GDPR + country-specific data-protection regulations.

---

## 7. Break-glass cross-tenant access (I-024 integration)

### 7.1 Break-glass posture

Per I-024, cross-tenant access is permitted only under operator-gated break-glass conditions (e.g., regulatory subpoena, security incident response). The KMS-side of break-glass:

1. The `break-glass-operator` IAM role (per §4.1 key policy) is the ONLY identity that can decrypt across tenants.
2. The role assumption requires MFA + a per-operation `break_glass_authorized` encryption-context flag set explicitly.
3. The break-glass-authorized flag is set ONLY by the canonical break-glass procedure (Track 5 operator tooling; not application-layer code).
4. Every break-glass decrypt emits Cat A `kms.break_glass_decrypt` event (P2 keyed by `'platform'`; visible to platform-level compliance audit) + Cat A `kms.break_glass_decrypt_to_tenant_<tenant_id>` event (P1 mirror for the affected tenant's audit trail).
5. Dual-control: break-glass procedure requires CTO + Compliance Officer + Incident Commander (3 named humans; per Cold-DR Runbook §"Authority + override path" precedent).

### 7.2 Break-glass time-bounding

A break-glass session is limited to 4 hours; the IAM role assumption expires automatically. Extended access requires re-authorization (each 4h window is independently audited).

---

## 8. DR failover key-access continuity

### 8.1 Failover flow (cross-references Cold-DR Runbook §4)

During us-east-1 → us-west-2 failover:

1. Cold-DR Step 7 (KMS verification): the us-west-2 replica of every active tenant's multi-region CMK is verified accessible.
2. Cold-DR Step 9 (KMS-policy verification): the IAM policies for us-west-2 service roles are verified equivalent to us-east-1 (the multi-region key shares policy automatically; this is a sanity check).
3. Application servers in us-west-2 assume the same `tenant-<tenant_id>-service` roles (cross-region role assumption is canonical via IAM; the role ARN is region-independent).
4. Decrypt operations resume against us-west-2 CMK replicas with no application-code changes; the encryption-context binding remains the same.

### 8.2 Key-access continuity invariant

**Invariant:** during the entire DR failover window (T+0 to T+failover_complete), every authorized decrypt operation succeeds against the surviving region's CMK replica. No tenant experiences a key-access outage that exceeds the DR RTO target (≤4h per ADR-026).

Per-tenant Cat A `kms.dr_decrypt_continuity_verified` event emitted at Cold-DR Step 14 (post-failover verification) confirming the invariant held for each tenant.

### 8.3 Country-specific DR exception (residency_policy=us_only)

For tenants with `kms_residency_policy = us_only`: DR failover from us-east-1 → us-west-2 violates the residency constraint. The Cold-DR Runbook handles this as a Step 8 ratifier-gated decision:

1. Default: us_only tenants are EXCLUDED from automatic DR failover. Their tenant-routing remains pinned to us-east-1; if us-east-1 is unrecoverable, the tenant is offline until us-east-1 returns OR ratifier explicitly overrides the residency policy (with country-regulatory consultation).
2. Operator override path: CTO + Compliance Officer + Incident Commander + Country Regulatory Counsel (4 named humans per the elevated residency-policy override) approve a temporary cross-residency operation via Cat A `kms.residency_policy_dr_override` event.

---

## 9. Open questions for ratifier

1. **OQ1 — Hardware Security Module (HSM)-backed CMKs vs software CMKs.** AWS KMS supports HSM-backed (FIPS 140-2 Level 3) keys via CloudHSM-bound KMS. Recommendation: HSM-backed for `pii_sensitive_clinical` + `pii_financial` + `pii_audit_payload` DEKs; software CMK acceptable for lower-sensitivity classes. Higher cost; ratifier confirms.
2. **OQ2 — Per-row envelope-key format.** Recommendation: AWS KMS GenerateDataKey returns ciphertext blob + plaintext blob; the ciphertext blob is stored alongside the encrypted row. Alternative: per-row keys derived deterministically from a per-tenant master via HKDF (cheaper at decrypt time but reduces key-rotation granularity). Recommendation defaults to the AWS-managed format.
3. **OQ3 — `kms_residency_policy` CCR key activation timing.** Per §3.2, the spec assumes the CCR key exists. Sprint 13 cross-references CCR_RUNTIME v5.2; ratifier confirms whether this is a v5.2 addition (sister to Cold-DR's `tenant.ai_provider` key) or requires a follow-up Contracts Pack amendment.
4. **OQ4 — DEK rotation interruptibility under DR.** Per §6.1, DEK rotation is interruptible. Recommendation: under active DR-failover, in-flight DEK rotations are paused; resumed after failover completes. Ratifier confirms the pause-on-DR semantics.
5. **OQ5 — Quantum-resistance migration plan.** Out of scope for v1.0; recommend file as roadmap SI for Phase 3+.
6. **OQ6 — Codex pre-ratification target.** Recommendation: 2-3 rounds (Infrastructure spec; cross-references Cold-DR + SI-017 + I-026).
7. **OQ7 — Break-glass time-bound extension policy.** Per §7.2, break-glass is 4-hour bounded. For long-running incident response (e.g., multi-day regulatory subpoena fulfillment): recommend stacked 4-hour windows, each independently authorized + audited. Ratifier confirms.

---

## 10. Test coverage commitments (acceptance-criterion-grade)

| Test ID | File location | CI job | Verifies | Section |
|---|---|---|---|---|
| Test KMS.1 | `apps/api-server/__integration__/kms/decrypt_happy_path.test.ts` | `integration-kms` | Tenant service role decrypts tenant CMK ciphertext with correct encryption context → success + Cat A `kms.decrypt_invoked` event | §4, §5 |
| Test KMS.2 | `apps/api-server/__integration__/kms/cross_tenant_decrypt_denied.test.ts` | `integration-kms` | Service role for tenant_A attempting decrypt against tenant_B's CMK → AccessDeniedException + Cat A `kms.cross_tenant_decrypt_attempted` event | §2.3 |
| Test KMS.3 | `apps/api-server/__integration__/kms/encryption_context_mismatch.test.ts` | `integration-kms` | Decrypt with wrong encryption context (tenant_id mismatch) → InvalidCiphertextException + Cat A `kms.decrypt_failed` | §4.2 |
| Test KMS.4 | `apps/api-server/__integration__/kms/cmk_rotation.test.ts` | `integration-kms` | Annual CMK rotation succeeds; old ciphertext still decryptable; new encryptions use new version; Cat A `kms.cmk_rotated` event | §6.1 |
| Test KMS.5 | `apps/api-server/__integration__/kms/dek_rotation_resumable.test.ts` | `integration-kms` | DEK rotation interrupted mid-window; resumed; per-row idempotency prevents double-rotation; Cat A `kms.dek_rotation_completed` event after full pass | §6.1 |
| Test KMS.6 | `apps/api-server/__integration__/kms/break_glass_decrypt.test.ts` | `integration-kms` | Break-glass decrypt with MFA + dual-control + `break_glass_authorized` context → success + Cat A `kms.break_glass_decrypt` event (P2 platform + P1 mirror per affected tenant) | §7.1 |
| Test KMS.7 | `apps/api-server/__integration__/kms/break_glass_unauthorized.test.ts` | `integration-kms` | Break-glass decrypt attempt without MFA OR without `break_glass_authorized` context flag → AccessDeniedException + Cat A `kms.decrypt_failed` with `failure_reason='break_glass_unauthorized'` | §7.1 |
| Test KMS.8 | `apps/api-server/__integration__/kms/dr_failover_key_access.test.ts` | `integration-kms` | Simulated us-east-1 outage; decrypt operations succeed against us-west-2 CMK replica; encryption-context binding preserved; Cat A `kms.dr_decrypt_continuity_verified` | §8 |
| Test KMS.9 | `apps/api-server/__integration__/kms/residency_policy_us_only_excluded.test.ts` | `integration-kms` | Tenant with `kms_residency_policy = us_only` is excluded from DR failover by default; us-east-1-unrecoverable scenario keeps tenant offline pending operator override | §3.2, §8.3 |
| Test KMS.10 | `apps/api-server/__integration__/kms/residency_policy_dr_override.test.ts` | `integration-kms` | Operator override (CTO + CO + IC + Country Regulatory Counsel) approves temporary cross-residency operation → Cat A `kms.residency_policy_dr_override` event + decrypt continuity restored | §8.3 |
| Test KMS.11 | `apps/api-server/__integration__/kms/emergency_rotation.test.ts` | `integration-kms` | Emergency rotation invoked (Compliance Officer + CTO) → all keys rotated within 24h; Cat A `kms.emergency_rotation_initiated` + `kms.emergency_rotation_completed` events | §6.2 |
| Test KMS.12 | `apps/api-server/__integration__/kms/sensitive_class_no_sampling.test.ts` | `integration-kms` | Decrypt operations on `pii_sensitive_clinical` / `pii_financial` / `pii_audit_payload` always emit Cat A audit (no sampling) | §5.1 |
| Test KMS.13 | `tools/static-analyzer/tests/kms-encryption-context.test.ts` | `static-analyzer` | KMS encrypt/decrypt call missing canonical encryption context (tenant_id + data_class) → static-analyzer rule TLC-KMS-001 fails build | §4.2 |
| Test KMS.14 | `tools/static-analyzer/tests/kms-cmk-arn-binding.test.ts` | `static-analyzer` | Service-role decrypt invocation with hardcoded CMK ARN (instead of `tenant.cmk_arn` lookup) → rule TLC-KMS-002 fails | §2.3 |

**Static-analyzer rule IDs registered:**
- `TLC-KMS-001` — KMS encrypt/decrypt call missing canonical encryption context.
- `TLC-KMS-002` — Service-role decrypt invocation with hardcoded CMK ARN (must use per-tenant CMK ARN lookup).
- `TLC-KMS-003` — Application code attempting to set `break_glass_authorized` encryption context flag directly (must use canonical break-glass operator tooling).

---

## 11. Cross-SI alignment summary

| Cross-SI surface | KMS Architecture surface | Relationship |
|---|---|---|
| Cold-DR Runbook (Sprint 7) | §3 + §8 multi-region key replication + DR continuity | Resolves Cold-DR OQ2 |
| SI-017 Identity Spec v1.1 (Sprint 8) | §4.3 tenant service role assumption | Middleware-GUC binding selects the right tenant service role per request |
| SI-018 audit-chain partition rule | §5 + §6 + §7 audit event classification | Cat A KMS events P1/P2 split per actor type per SI-018 |
| ADR-026 single-region+cold-DR | §1 + §3 region topology | KMS multi-region keys are the canonical implementation of ADR-026's "DR-survivable encryption" |
| I-026 per-tenant KMS encryption | §2 three-tier hierarchy + §2.3 per-tenant CMK uniqueness | Canonical implementation of I-026 invariant |
| I-024 cross-tenant break-glass | §7 break-glass cross-tenant access | KMS-side enforcement of I-024 |
| Contracts Pack v5.2 CCR_RUNTIME | §3.2 `kms_residency_policy` CCR key (OQ3) | Per-tenant region-pinning via CCR |

---

## 12. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; awaiting Codex R1.

---

— Claude (Opus 4.7, 1M context), KMS Architecture Specification v0.1 DRAFT authored 2026-05-19 under "continue 24 hrs / no more resting" autonomous-work authorization. Sprint 13 of the 24h-loop work plan. Track 5 Infra/Ops spec-corpus deliverable. Resolves Cold-DR OQ2 multi-region key policy details + defines canonical per-tenant key hierarchy + IAM key policy + rotation cadence + break-glass cross-tenant access (I-024 KMS-side enforcement) + DR-failover key-access continuity. Companion to Cold-DR Runbook + SI-017 Identity Spec v1.1.
