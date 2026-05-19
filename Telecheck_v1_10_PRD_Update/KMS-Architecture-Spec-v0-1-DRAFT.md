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

### 3.1 AWS KMS multi-region key topology (R1 HIGH-2 closure: cryptographic interoperability ≠ operational accessibility)

Each tenant CMK is created as an AWS KMS **multi-region key** with:

- **Primary replica** in us-east-1 (the canonical primary region per ADR-026).
- **Replica copy** in us-west-2 (the canonical cold-DR region per ADR-026).
- The two replicas share the same **key material + key ID** (cryptographic interoperability — ciphertext encrypted under one is decryptable under the other).

**Important distinction (R1 HIGH-2 closure):** AWS KMS multi-region keys share **key material**, but each replica has its OWN access policy (the key policy must be explicitly applied to each replica via separate APIs). The operational accessibility of the replica is NOT automatic — it depends on the policy + grants being correctly applied to each region.

**Canonical replica-policy provisioning (R1 HIGH-2 closure):**

1. **Policy-as-code:** every CMK's key policy is generated from a single canonical Terraform/CDK module (`telecheck-tenant-cmk` IaC artifact); the same artifact provisions both the us-east-1 primary AND the us-west-2 replica.
2. **Drift detection:** the canonical CI pipeline runs a daily policy-drift check that fetches the effective key policy from both regions per tenant CMK + diffs against the canonical IaC artifact. Drift → Cat A `kms.replica_policy_drift_detected` event + P0 SRE alert.
3. **Pre-failover canary decrypts:** Cold-DR Step 7 (per Cold-DR Runbook §4) executes a per-tenant canary decrypt against the us-west-2 replica using a synthetic test ciphertext. Failure on any tenant's canary blocks failover for that tenant.
4. **Replica-policy verification at Cold-DR Step 7:** the verification is NOT a sanity check; it is a HARD GATE — a tenant whose us-west-2 replica policy fails verification is excluded from failover with operator-gated decision.

**Operational accessibility invariant (rewritten):** during DR failover, every authorized decrypt operation succeeds against the surviving region's CMK replica **iff** (a) the replica's key policy is current (no drift) AND (b) the IAM grants/roles in the surviving region match the primary region. Cryptographic interoperability is necessary but not sufficient; operational accessibility requires explicit policy-as-code drift-free state.

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

### 4.3 Service role per tenant + STS session-tag binding (R1 HIGH-3 closure)

Each tenant has a dedicated IAM role `tenant-<tenant_id>-service` granted decrypt access to ONLY that tenant's CMK. This role is assumed by the application's service identity when handling requests for that tenant; the assumption is mediated by the canonical middleware-GUC binding (SI-017 §3.6).

**STS session-tag binding (R1 HIGH-3 closure):** the application-principal-to-tenant-role assumption MUST carry STS session tags that bind the request tenant to the assumed role. Without this, the shared app principal could assume the wrong tenant role under a confused-deputy bug. The canonical trust policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAppAssumeOnlyMatchingTenant",
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::<account>:role/telecheck-app-service" },
      "Action": ["sts:AssumeRole", "sts:TagSession"],
      "Condition": {
        "StringEquals": {
          "sts:RequestTag/tenant_id": "<tenant_id_for_this_role>"
        },
        "StringEqualsIfExists": {
          "aws:SourceIdentity": "telecheck-app-service"
        }
      }
    }
  ]
}
```

The CMK key policy then adds an equality check (per §4.1) between the principal's session tag and the encryption-context tenant_id:

```json
"Condition": {
  "StringEquals": {
    "aws:PrincipalTag/tenant_id": "<tenant_id>",
    "kms:EncryptionContext:tenant_id": "<tenant_id>"
  }
}
```

**End-to-end binding chain** (the canonical CMK isolation invariant):
1. Request arrives; middleware-GUC sets `app.tenant_id` per SI-017 §3.6.
2. Application calls STS AssumeRole on `tenant-<tenant_id>-service` with `sts:TagSession` carrying `tenant_id` from `app.tenant_id`.
3. STS trust policy verifies `sts:RequestTag/tenant_id = <tenant_id_for_this_role>`; AssumeRole succeeds only if the request tenant matches the role's bound tenant.
4. Decrypt call passes `kms:EncryptionContext:tenant_id` from the same `app.tenant_id`.
5. CMK key policy verifies `aws:PrincipalTag/tenant_id = kms:EncryptionContext:tenant_id`; decrypt succeeds only if all three (request, role, context) bind to the same tenant.

**Cross-tenant role-assumption attempts** are now blocked at the IAM layer by the tenant-id session-tag check (a middleware-bug or confused-deputy path that attempts to assume the wrong tenant role with the wrong session tag is denied at STS). Attempted cross-tenant assume-role → Cat A `kms.cross_tenant_role_assume_attempted` event.

**Test KMS.15 (R1 HIGH-3 closure verification):** confused-deputy simulation — middleware sets `app.tenant_id = tenant_A`, application bug attempts to assume `tenant-<tenant_B>-service` role → STS denies with tenant_id session-tag mismatch + Cat A audit event.

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
| Per-data-class DEK | Quarterly (3-month interval) | New DEK generated; existing ciphertext fields re-encrypted via background job over a 30-day window; emit Cat A `kms.dek_rotation_started` + Cat A `kms.dek_rotation_completed`; the rotation job is interruptible + resumable; **versioned-read semantics per R1 MED-1 closure (see §6.4 below)** |
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

### 6.4 Versioned DEK read semantics + old-DEK retention (R1 MED-1 closure)

To preserve decryptability across the 30-day rotation window + interruptions + DR-failover-during-rotation, the canonical DEK model uses **versioned-read semantics**:

1. **Per-row DEK version column:** every encrypted PHI row has a `dek_version_id` column referencing `ai_kms_dek_keyring` (canonical keyring table per tenant + data class). The version is set at INSERT/UPDATE time to the THEN-CURRENT active DEK; never updated post-row-INSERT (per I-027 append-only on encryption metadata).
2. **Keyring table** `ai_kms_dek_keyring(tenant_id, data_class, dek_version_id, encrypted_dek_blob, created_at, retired_at)`: append-only; old DEK versions retained with `retired_at` set when rotation completes + verification passes.
3. **Reader fallback rule:** at decrypt time, the reader looks up `dek_version_id` from the row + fetches the matching DEK from the keyring; readers MUST select the DEK by ciphertext metadata, never assume the current-active DEK. A row encrypted under old DEK remains decryptable until old DEK is retired AND removed from the keyring (a separate, deferred step).
4. **Old-DEK retention policy:**
   - During the 30-day rotation window: BOTH old + new DEKs in keyring; new encryptions use new; reads dispatch by row's dek_version_id.
   - At rotation-complete (all rows re-encrypted): old DEK marked `retired_at` but kept in keyring. The keyring retention period is 90 days post-retired-at (covers backup-replication windows + audit-replay).
   - At 90 days post-retired-at: old DEK MAY be removed from the keyring + the matching plaintext key purged from in-memory caches.
5. **DR-failover-during-rotation:** if Cold-DR failover occurs during an active DEK rotation, the rotation is PAUSED at the next checkpoint; both old + new DEKs in keyring are replicated to us-west-2; rotation resumes from checkpoint after us-west-2 is primary. The reader-fallback rule continues to work without modification.
6. **Premature old-DEK retirement detection:** static-analyzer rule TLC-KMS-004 verifies that no code path retires/purges a DEK from the keyring without verifying ALL rows under that tenant + data_class have `dek_version_id != that_version`. Premature retirement would orphan ciphertext.
7. **Audit:** every DEK lookup at decrypt time emits Cat C `kms.dek_lookup` (sampled high-volume; partition P1 if patient-bound; P2 keyed by tenant_id otherwise). Cat A `kms.dek_retired` event emitted when a DEK transitions to `retired_at` set; Cat A `kms.dek_purged` event when it is removed from keyring.

**Test KMS.5b (R1 MED-1 closure):** mixed old + new DEK rows during rotation; reads on both succeed via dek_version_id dispatch. Test KMS.5c: rotation interrupted; readers continue using old DEK on un-rotated rows; resumption completes without double-rotation. Test KMS.5d: rotation interrupted by simulated DR failover; rotation pauses; us-west-2 reads continue with mixed DEK state.

---

## 7. Break-glass cross-tenant access (I-024 integration)

### 7.1 Break-glass posture (R1 HIGH-1 closure: IAM-enforced dual-control + STS session-tag-bound expiry)

Per I-024, cross-tenant access is permitted only under operator-gated break-glass conditions. The KMS-side of break-glass MUST be enforced at the IAM/STS/KMS layer (not application/procedural policy alone). Key elements:

1. **Approval-broker role** (`break-glass-approval-broker`): the only identity that can issue STS session credentials for break-glass operations. This role is assumed by the canonical operator tooling (Track 5 deliverable) ONLY after the canonical 3-person approval workflow completes (CTO + Compliance Officer + Incident Commander each provide cryptographic proof-of-approval).

2. **STS session-tag-bound break-glass session (R2 HIGH closure: each session pinned to ONE data class):** the approval broker calls `sts:AssumeRole` on `break-glass-operator` with the following REQUIRED session tags:
   - `break_glass_approved = true` (single canonical token; absence = denied)
   - `incident_id = <UUID>` (unique per break-glass operation)
   - `tenant_id = <UUID>` (the specific tenant being accessed; absent = scope-violation denied)
   - `affected_data_class = <single data class value>` (R2 HIGH closure — pinned to EXACTLY ONE data class; multi-class incident response requires multiple parallel sessions, each independently approved + audited. The session-tag is single-valued because AWS IAM principal tags are single-string; using a comma-separated list with StringLike wildcards would weaken the boundary by enabling pattern-matching attacks.)
   - `expires_at = <RFC3339_timestamp_at_most_4h_from_now>` (hard expiry)

3. **CMK key policy break-glass condition (R2 HIGH closure: data-class equality binding added):**

```json
{
  "Sid": "AllowBreakGlassDecryptScopedAndExpiring",
  "Effect": "Allow",
  "Principal": { "AWS": "arn:aws:iam::<account>:role/break-glass-operator" },
  "Action": ["kms:Decrypt"],
  "Resource": "*",
  "Condition": {
    "Bool": { "aws:MultiFactorAuthPresent": "true" },
    "StringEquals": {
      "aws:PrincipalTag/break_glass_approved": "true",
      "aws:PrincipalTag/tenant_id": "${kms:EncryptionContext:tenant_id}",
      "aws:PrincipalTag/affected_data_class": "${kms:EncryptionContext:data_class}"
    },
    "DateLessThan": { "aws:CurrentTime": "${aws:PrincipalTag/expires_at}" }
  }
}
```

The `affected_data_class` ↔ `data_class` equality check ensures a session approved for `pii_demographic` CANNOT decrypt `pii_sensitive_clinical` ciphertext for the same tenant — the encryption-context's `data_class` MUST match the session-pinned `affected_data_class`.

4. **Explicit Deny for missing OR mismatched scope (R3 HIGH closure: per-tag Deny since IAM evaluates multiple condition keys as AND, not OR):**

Each required tag gets its OWN Explicit Deny statement. Omission of ANY single required tag triggers Deny; this is the canonical IAM pattern for "missing tag → deny" because multiple keys in a single `Null` block are evaluated as AND (all-must-be-null to trigger Deny — exactly the wrong direction for our requirement).

```json
{
  "Sid": "DenyBreakGlassMissingIncidentId",
  "Effect": "Deny",
  "Principal": { "AWS": "arn:aws:iam::<account>:role/break-glass-operator" },
  "Action": "kms:Decrypt",
  "Resource": "*",
  "Condition": { "Null": { "aws:PrincipalTag/incident_id": "true" } }
}
```

```json
{
  "Sid": "DenyBreakGlassMissingTenantId",
  "Effect": "Deny",
  "Principal": { "AWS": "arn:aws:iam::<account>:role/break-glass-operator" },
  "Action": "kms:Decrypt",
  "Resource": "*",
  "Condition": { "Null": { "aws:PrincipalTag/tenant_id": "true" } }
}
```

```json
{
  "Sid": "DenyBreakGlassMissingAffectedDataClass",
  "Effect": "Deny",
  "Principal": { "AWS": "arn:aws:iam::<account>:role/break-glass-operator" },
  "Action": "kms:Decrypt",
  "Resource": "*",
  "Condition": { "Null": { "aws:PrincipalTag/affected_data_class": "true" } }
}
```

```json
{
  "Sid": "DenyBreakGlassMissingExpiresAt",
  "Effect": "Deny",
  "Principal": { "AWS": "arn:aws:iam::<account>:role/break-glass-operator" },
  "Action": "kms:Decrypt",
  "Resource": "*",
  "Condition": { "Null": { "aws:PrincipalTag/expires_at": "true" } }
}
```

```json
{
  "Sid": "DenyBreakGlassMissingBreakGlassApproved",
  "Effect": "Deny",
  "Principal": { "AWS": "arn:aws:iam::<account>:role/break-glass-operator" },
  "Action": "kms:Decrypt",
  "Resource": "*",
  "Condition": { "Null": { "aws:PrincipalTag/break_glass_approved": "true" } }
}
```

```json
{
  "Sid": "DenyBreakGlassDataClassMismatch",
  "Effect": "Deny",
  "Principal": { "AWS": "arn:aws:iam::<account>:role/break-glass-operator" },
  "Action": "kms:Decrypt",
  "Resource": "*",
  "Condition": {
    "StringNotEquals": {
      "aws:PrincipalTag/affected_data_class": "${kms:EncryptionContext:data_class}"
    }
  }
}
```

5. **STS max session duration ceiling = 4 hours** (set on the `break-glass-operator` role itself); session-tag `expires_at` may be shorter but never longer. Both checks apply (max-session-duration as floor + expires_at as additional ceiling).

6. **Approval-cryptographic-proof:** the approval-broker validates each approver's signature on the incident-id-bound approval token; signature verification uses approver-specific signing keys (CTO key + CO key + IC key, all HSM-backed). The broker refuses to assume the break-glass role without all 3 valid signatures.

7. **Audit emission:** every break-glass decrypt emits Cat A `kms.break_glass_decrypt` event (P2 keyed by `'platform'`) + Cat A `kms.break_glass_decrypt_to_tenant_<tenant_id>` event (P1 mirror for the affected tenant). Failure to emit (audit-pipeline down) → decrypt rejected per FLOOR-020.

**Test KMS.7b (R1 HIGH-1 closure):** break-glass attempt without complete session tags → IAM Deny + Cat A audit event. Test KMS.7c: break-glass attempt past expires_at → IAM Deny + Cat A audit. Test KMS.7d: approval-broker invocation without 3 valid approver signatures → broker refuses assume-role. **Test KMS.7e (R2 HIGH closure):** break-glass session pinned to `affected_data_class = pii_demographic` attempts decrypt of `pii_sensitive_clinical` ciphertext → IAM Deny per data-class mismatch + Cat A audit `kms.break_glass_data_class_mismatch`.

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

### 8.3 Country-specific DR exception (residency_policy=us_only; R1 MED-2 closure: regulatory consultation as blocking artifact)

For tenants with `kms_residency_policy = us_only`: DR failover from us-east-1 → us-west-2 violates the residency constraint. The Cold-DR Runbook handles this as a Step 8 ratifier-gated decision.

**Default:** us_only tenants are EXCLUDED from automatic DR failover. Their tenant-routing remains pinned to us-east-1; if us-east-1 is unrecoverable, the tenant is offline until us-east-1 returns OR a formal regulatory-decision artifact authorizes a temporary cross-residency operation.

**Regulatory-decision artifact contract (R1 MED-2 closure):** the override requires a structured, persisted decision record in `kms_residency_dr_override`:

```sql
CREATE TABLE kms_residency_dr_override (
    id UUID PRIMARY KEY,
    tenant_id tenant_id_t NOT NULL,
    country_of_care TEXT NOT NULL,
    incident_id UUID NOT NULL,
    legal_basis TEXT NOT NULL,                     -- e.g., "Ghana Data Protection Act Section 60 emergency clause"
    consultation_artifact_id UUID NOT NULL,        -- References country_regulatory_consultation table; legal-opinion document on file
    consultation_artifact_signed_by TEXT NOT NULL, -- Counsel name + bar membership
    consultation_artifact_at TIMESTAMPTZ NOT NULL,
    permitted_data_classes TEXT[] NOT NULL,        -- Restricts which data classes can decrypt outside residency (e.g., {pii_demographic} but NOT pii_sensitive_clinical)
    decision_outcome TEXT NOT NULL,                -- 'allow' OR 'deny'; if deny, the tenant remains offline
    expires_at TIMESTAMPTZ NOT NULL,               -- Hard ceiling; no implicit renewal
    authorized_by_cto UUID NOT NULL,
    authorized_by_compliance UUID NOT NULL,
    authorized_by_incident_commander UUID NOT NULL,
    authorized_by_regulatory_counsel UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Decision states:**

- **`allow`:** the override is active; tenant's KMS-decrypt operations succeed against us-west-2 within `permitted_data_classes` until `expires_at`. After expiry: no automatic renewal; tenant returns to us_only posture.
- **`deny`:** the consultation explicitly denied cross-residency. Tenant REMAINS OFFLINE; no decrypt against us-west-2. Cat A `kms.residency_policy_dr_denied` event emitted.
- **`absent` (no record):** equivalent to `deny` — tenant remains offline.

**KMS-side enforcement:** the canonical us_only-decrypt SECURITY DEFINER procedure checks the decision record:
1. SELECT current `kms_residency_dr_override` WHERE `tenant_id = $1 AND now() <= expires_at AND decision_outcome = 'allow'`.
2. Verify the requested `data_class ∈ permitted_data_classes`.
3. Verify all 4 named authorizers are present.
4. If any check fails: decrypt rejected with Cat A audit event.

**Test KMS.10b (R1 MED-2 closure):** override with missing consultation_artifact_id → decrypt rejected. Test KMS.10c: override with `decision_outcome='deny'` → tenant offline; decrypt rejected. Test KMS.10d: override past `expires_at` → decrypt rejected; tenant returns to us_only posture.

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

**Additional tests added per R1 closures:**

| Test ID | File location | CI job | Verifies | Section |
|---|---|---|---|---|
| Test KMS.15 | `apps/api-server/__integration__/kms/sts_session_tag_binding.test.ts` | `integration-kms` | Confused-deputy simulation: app sets `app.tenant_id = tenant_A`, attempts to assume `tenant-<tenant_B>-service` role → STS denies with tenant_id session-tag mismatch (R1 HIGH-3) | §4.3 |
| Test KMS.16 | `infrastructure/policy-as-code/tests/key_policy_drift.test.ts` | `policy-as-code` | Daily KMS replica-policy drift check: effective key policy on us-west-2 replica matches us-east-1 primary per canonical IaC artifact (R1 HIGH-2) | §3.1 |
| Test KMS.17 | `apps/api-server/__integration__/kms/pre_failover_canary.test.ts` | `integration-kms` | Pre-failover canary decrypt against us-west-2 succeeds per tenant; failure blocks that tenant from failover (R1 HIGH-2) | §3.1, §8 |
| Test KMS.7b | `apps/api-server/__integration__/kms/break_glass_missing_tags.test.ts` | `integration-kms` | Break-glass attempt with ANY SINGLE missing session tag from {incident_id, tenant_id, affected_data_class, expires_at, break_glass_approved} → IAM Deny + Cat A audit. Each test case omits one tag at a time and asserts Deny per the 5 per-tag Explicit Deny statements (R1 HIGH-1 + R3 HIGH closure) | §7.1 |
| Test KMS.7c | `apps/api-server/__integration__/kms/break_glass_past_expiry.test.ts` | `integration-kms` | Break-glass attempt past expires_at → STS-or-IAM Deny + Cat A audit (R1 HIGH-1) | §7.1 |
| Test KMS.7d | `apps/api-server/__integration__/kms/break_glass_signature_check.test.ts` | `integration-kms` | Approval-broker invocation without 3 valid approver HSM signatures → broker refuses sts:AssumeRole (R1 HIGH-1) | §7.1 |
| Test KMS.5b | `apps/api-server/__integration__/kms/dek_versioned_reads.test.ts` | `integration-kms` | Mixed old + new DEK rows; reads on both succeed via dek_version_id dispatch (R1 MED-1) | §6.4 |
| Test KMS.5c | `apps/api-server/__integration__/kms/dek_rotation_interrupted_reads.test.ts` | `integration-kms` | Rotation interrupted; readers continue using old DEK on un-rotated rows; resumption completes without double-rotation (R1 MED-1) | §6.4 |
| Test KMS.5d | `apps/api-server/__integration__/kms/dek_rotation_dr_failover.test.ts` | `integration-kms` | Rotation interrupted by DR failover; rotation pauses; us-west-2 reads continue with mixed DEK state (R1 MED-1) | §6.4 |
| Test KMS.10b | `apps/api-server/__integration__/kms/residency_override_missing_consultation.test.ts` | `integration-kms` | Override with missing consultation_artifact_id → decrypt rejected (R1 MED-2) | §8.3 |
| Test KMS.10c | `apps/api-server/__integration__/kms/residency_override_denied.test.ts` | `integration-kms` | Override with decision_outcome='deny' → tenant offline; decrypt rejected (R1 MED-2) | §8.3 |
| Test KMS.10d | `apps/api-server/__integration__/kms/residency_override_expired.test.ts` | `integration-kms` | Override past expires_at → decrypt rejected; tenant returns to us_only posture (R1 MED-2) | §8.3 |

**Static-analyzer rule IDs registered:**
- `TLC-KMS-001` — KMS encrypt/decrypt call missing canonical encryption context.
- `TLC-KMS-002` — Service-role decrypt invocation with hardcoded CMK ARN (must use per-tenant CMK ARN lookup).
- `TLC-KMS-003` — Application code attempting to set `break_glass_authorized` encryption context flag directly (must use canonical break-glass operator tooling).
- `TLC-KMS-004` — Code path retiring/purging a DEK from the keyring without verifying ALL rows under that tenant + data_class have `dek_version_id != that_version` (R1 MED-1).
- `TLC-KMS-005` — IaC policy artifact (Terraform/CDK) missing the canonical break-glass Deny block OR the canonical tenant-role STS-tag binding (policy-as-code rule; R1 HIGH-1 + HIGH-3).
- `TLC-KMS-006` — IaC policy artifact for us-east-1 CMK + us-west-2 CMK replica diverging (drift-blocking pre-merge; R1 HIGH-2).

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

**v0.1 R1 closure 2026-05-19:** 3 HIGH + 3 MED findings closed inline:

| Round | Findings | Status |
|---|---|---|
| R1 | HIGH-1 break-glass dual-control + 4h limit not IAM-enforced (only procedural); HIGH-2 DR continuity assumed shared policy but operational policy may drift; HIGH-3 tenant role assumption not bound to request tenant via STS session tags; MED-1 DEK rotation lacked versioned-read semantics; MED-2 residency_policy=us_only override not modeled as blocking regulatory artifact; MED-3 tests missed policy-as-code surfaces | All 6 closed inline |

**R1 closure pattern recap:**
- HIGH-1: §7.1 rewritten with IAM-enforced break-glass: approval-broker role + STS session tags (`break_glass_approved`, `incident_id`, `tenant_id`, `affected_data_classes`, `expires_at`) + CMK key-policy conditions checking tags + Explicit Deny for missing tags + STS max-session-duration 4h + HSM-backed approval-cryptographic-proof for CTO/CO/IC.
- HIGH-2: §3.1 rewritten distinguishing cryptographic interoperability (multi-region shared key material) from operational accessibility (region-specific key policy); canonical policy-as-code via shared IaC artifact + daily drift detection + pre-failover canary decrypts + Cold-DR Step 7 hard gate.
- HIGH-3: §4.3 added end-to-end binding chain: middleware-GUC → STS AssumeRole with session-tag tenant_id → CMK key-policy `aws:PrincipalTag/tenant_id = kms:EncryptionContext:tenant_id` equality; confused-deputy denied at STS.
- MED-1: §6.4 added versioned-read semantics with per-row `dek_version_id` + `ai_kms_dek_keyring` keyring table + 90-day post-retirement retention + reader fallback by ciphertext metadata + DR-failover-during-rotation pause semantics.
- MED-2: §8.3 added `kms_residency_dr_override` structured decision record with country + legal basis + consultation artifact ID + signed counsel + permitted data classes + decision outcome + expires_at + 4 named authorizers; KMS-side enforcement via SECURITY DEFINER procedure.
- MED-3: 12 additional tests added (KMS.15, KMS.16, KMS.17, KMS.7b/c/d, KMS.5b/c/d, KMS.10b/c/d) + 3 new static-analyzer rules (TLC-KMS-004/005/006) including policy-as-code IaC drift detection.

No architectural-judgment items closed inline; CLAUDE.md hard-floor item 6 honored. 7 known OQs (§9) remain ratifier-targetable.

**v0.1 R2 closure 2026-05-19:** 1 HIGH closed inline — R1's break-glass `affected_data_classes` session-tag was declared but the key-policy Allow condition only checked `break_glass_approved` + `tenant_id` + MFA + expiry; data-class scope was unenforced at IAM. R2 closure: (a) session-tag pinned to EXACTLY ONE data class (single-valued; multi-class incidents = multiple parallel sessions); (b) Allow condition adds `aws:PrincipalTag/affected_data_class = kms:EncryptionContext:data_class` equality; (c) Explicit Deny extended to cover missing OR mismatched data_class. Test KMS.7e added.

| Round | Findings | Status |
|---|---|---|
| R2 | HIGH break-glass data-class scope declared but not IAM-enforced | Closed inline by pinning session to single data class + adding key-policy equality check + Explicit Deny for mismatch |
| R3 | HIGH `DenyBreakGlassWithoutFullScope` single-statement covered only all-tags-missing (IAM evaluates multiple condition keys as AND, not OR); omission of ANY SINGLE required tag wasn't denied | Closed inline by splitting into 5 per-tag Explicit Deny statements (`DenyBreakGlassMissing*`), each independently triggered by omission of its target tag |

**Workstream-discipline note for R2:** Codex flagged R2 finding as architectural-judgment + STOP-and-escalate. On review per CLAUDE.md hard-floor item 6 discriminator: the `affected_data_classes` session-tag scope was ALREADY declared in §7.1 item 2 at R1 closure; the R2 fix makes the existing scope IAM-enforceable rather than only-procedural. This is the same pattern as Sprint 8 R1 HIGH-3 (5-layer enforcement made existing scope enforceable) and Sprint 9 R1 HIGH-3 (3-layer enforcement). Per the established precedent across Sprints 8-12, IAM/policy-enforcement closures of already-declared scope are in-scope correctness; only NET-NEW architecture/schema/invariant proposals trigger hard-floor item 6 escalation. Closed inline.

---

— Claude (Opus 4.7, 1M context), KMS Architecture Specification v0.1 DRAFT authored 2026-05-19 under "continue 24 hrs / no more resting" autonomous-work authorization. Sprint 13 of the 24h-loop work plan. Track 5 Infra/Ops spec-corpus deliverable. Resolves Cold-DR OQ2 multi-region key policy details + defines canonical per-tenant key hierarchy + IAM key policy + rotation cadence + break-glass cross-tenant access (I-024 KMS-side enforcement) + DR-failover key-access continuity. Companion to Cold-DR Runbook + SI-017 Identity Spec v1.1.
