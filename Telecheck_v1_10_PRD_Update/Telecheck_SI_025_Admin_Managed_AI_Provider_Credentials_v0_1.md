# SI-025 — Admin-Managed AI Provider Credentials (v0.1 DRAFT)

**Status:** RATIFIER-DIRECTED (Evans, 2026-07-09 chat) — two architectural forks ratified; sub-decisions at Claude-recommended defaults pending Codex R-verification + Promotion Ledger entry.
**Author:** Claude Fable 5 (design), directed by Evans.
**Trigger:** Evans directive 2026-07-09 — *"Llm keys should be designed to be applied on the admin application UI."* Reframes the ADR-020 open item ("real adapters land when secrets management is resolved") from deploy-time env-var provisioning to an admin-UI-managed credential surface. Unblocks the ai-service `/ready` gate from operator-forever to buildable-then-runtime-configured.
**Companion:** ADR-020 (multi-provider LLM, Anthropic-primary), ADR-024 (per-tenant KMS envelope; I-026), SI-023 Admin Backend Basics (admin surface + LAYER B slice-role gate precedent), AUDIT_EVENTS (Cat B governance), Contracts Pack v5.4 GOVERNANCE_CONTROLS.

---

## 1. Ratified architectural decisions (Evans, 2026-07-09)

| Fork | Decision | Rationale |
|---|---|---|
| **Storage backend** | **App DB, KMS-enveloped** | Same ADR-024 8-field envelope the platform uses for PHI (I-026). Buildable now on staging (local KMS dev key); no new infra dependency. Documented pre-go-live migration to AWS Secrets Manager travels with the existing "KMS local-dev → AWS KMS" hardening item. |
| **Credential scope** | **Platform-level** | One provider key set, platform_admin-managed, resolved for every tenant. Matches ADR-020 (Anthropic-primary, platform-default at v1.0). Per-tenant scope is a documented future extension (would add tenant-scoping to the entity + RBAC; not required at v1.0). |

## 2. Sub-decisions (Claude-recommended defaults; Evans may override)

- **RBAC:** `platform_admin`-only for all mutations (set / rotate / delete). Single-actor. Dual-control (two platform_admins) documented as a hardening option, not v1.0-required. Reads (masked) available to `platform_admin` + `tenant_admin` (visibility of *which* providers are configured, never the key).
- **Audit:** every mutation emits a Cat B governance audit (`ai_provider_credential.set` / `.rotated` / `.revoked`) carrying `provider`, `actor`, `key_last4`, `key_fingerprint` (SHA-256 of the plaintext, for rotation-detection) — **never the plaintext key, never the ciphertext**. Placeholder-cast per the async-consult precedent until AUDIT_EVENTS registers the IDs.
- **Read exposure:** the plaintext is **never** returned by any HTTP surface. `GET` returns masked (`provider`, `sk-…<last4>`, `status`, `updated_at`, `updated_by`). The AI-call-time decrypt path is a SECDEF function granted only to the `ai_service_credential_reader` role; the plaintext lives in memory for the duration of a single provider call and is never logged (LOG_REDACT_PATHS covers it).
- **Bootstrap fallback:** if no DB credential is configured for a provider, the AI service falls back to the `ANTHROPIC_API_KEY` env var (preserves current behavior + bootstrap). Once a DB credential exists it takes precedence. Documented so the env path can be retired post-adoption.

## 3. Canonical entity (CDM proposal — needs Track-6 CDM amendment)

```sql
CREATE TABLE ai_provider_credential (
  id                      VARCHAR(26) PRIMARY KEY,        -- ULID
  provider                TEXT NOT NULL CHECK (provider IN ('anthropic','aws_bedrock','azure_openai')),
  -- 8-field KMS envelope (I-026 / ADR-024) over the plaintext API key
  key_ciphertext          BYTEA NOT NULL,
  key_kms_envelope_dek_id VARCHAR(26) NOT NULL,
  key_kms_envelope_iv     BYTEA NOT NULL,
  key_kms_envelope_tag    BYTEA NOT NULL,
  key_kms_envelope_alg    TEXT NOT NULL,
  key_kms_envelope_alg_version TEXT NOT NULL,
  key_kms_envelope_aad    BYTEA NOT NULL,
  key_kms_envelope_encrypted_at TIMESTAMPTZ NOT NULL,
  -- Non-secret metadata for masked reads + rotation detection
  key_last4               TEXT NOT NULL,                  -- display only
  key_fingerprint         TEXT NOT NULL,                  -- SHA-256(plaintext); rotation/dedup, never reversible
  status                  TEXT NOT NULL CHECK (status IN ('active','revoked')),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by              VARCHAR(26) NOT NULL,           -- platform_admin account id
  CONSTRAINT ai_provider_credential_one_active_per_provider
      EXCLUDE (provider WITH =) WHERE (status = 'active')  -- at most one active credential per provider
);
```

- **Platform-scoped, NOT tenant-scoped** (the ratified scope decision). The entity therefore does **not** carry `tenant_id` and is **not** under the tenant-RLS regime — instead it is locked down by role grants only (platform-security asset). This is a deliberate, documented exception to the "every table tenant-scoped" default, justified by the platform-level scope decision; it MUST be called out in the I-023 RLS-lockdown test as an explicit platform-scoped allow-listed table (not a rogue non-RLS table).
- Append-only history is NOT required at v0.1 (rotation = revoke old + insert new active); the audit trail is the durable history. A future `ai_provider_credential_event` log is a documented extension.

## 4. Endpoint surface (OpenAPI proposal — admin config)

Base `/v1/admin/ai-providers` (SI-023 admin surface family; LAYER B slice-role gate):

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/v1/admin/ai-providers` | platform_admin, tenant_admin | List configured providers (masked). |
| PUT | `/v1/admin/ai-providers/:provider` | platform_admin | Set/rotate the active key for a provider (idempotency-keyed). Envelope-encrypts server-side; Cat B audit. |
| DELETE | `/v1/admin/ai-providers/:provider` | platform_admin | Revoke the active credential. Cat B audit. |
| POST | `/v1/admin/ai-providers/:provider/test` | platform_admin | Live "test connection" probe (decrypt + minimal provider ping); returns ok/fail, never the key. |

## 5. AI-service read-path wiring

- New SECDEF `read_active_ai_provider_key(p_provider TEXT) RETURNS BYTEA-envelope`, EXECUTE granted only to `ai_service_credential_reader`; the resolver decrypts in-process via the KMS envelope path (kms.ts) at provider-construction time.
- `resolveProvider(workload_type)` (currently returns NullLLMProvider unconditionally): the real Anthropic adapter is constructed with the credential from this path; when no active credential AND no env fallback → NullLLMProvider (preserves the AI-RESIL-001 fail-soft). This makes ai-service `/ready` flip to 200 once a credential is present, WITHOUT the crisis-classifier gate (that is a separate AI-Safety sign-off item, unchanged).

## 6. UI (Track-4 admin surface)

Admin console **Settings → AI Providers** screen: a masked-input row per provider (Anthropic / Bedrock / Azure), "Save" (PUT), "Test connection" (POST /test), "Revoke" (DELETE), and a status chip (configured/not-configured, last-updated, updated-by). No plaintext ever rendered after save. Follows DIC v1.1 (honest status, no emoji; this is an operator surface, not patient-facing, so consumer-DBA branding N/A). Lands in the clinician/admin console UI kit.

## 7. Security posture + invariants

- Plaintext key: never stored, never logged, never returned, never in audit. Only the KMS-enveloped ciphertext at rest + transient in-memory decrypt at call time.
- I-003/I-027 audit discipline (Cat B, no bare suppression). I-026 envelope. Reuses the platform's ADR-024 KMS path — no new crypto.
- The one deliberate deviation (platform-scoped, non-tenant-RLS table) is documented + allow-listed, justified by the ratified platform-level scope.
- Pre-go-live: migrate the store to AWS Secrets Manager (travels with the KMS-local→AWS-KMS item); rotate any key entered under the local-dev KMS key.

## 8. Phasing

1. **Phase 1 (backend):** CDM entity migration + RBAC roles + SECDEF read + `/v1/admin/ai-providers` handlers + Cat B audit + real Anthropic adapter reading from the surface + `resolveProvider` wiring + live-PG tests. ai-service `/ready` flips once a credential is present.
2. **Phase 2 (UI):** the Settings → AI Providers console screen.

Both phases carry the session's full-pipeline discipline (live-PG tests, latent-defect sweep, Codex R-verification).

## 9. Open items for Codex R-verification / ratifier

- The platform-scoped non-tenant-RLS table exception (justified by the scope decision; Codex should confirm the role-grant lockdown is airtight given no RLS).
- `key_fingerprint` = SHA-256(plaintext): non-reversible, rotation/dedup only — Codex confirm it is not a plaintext-recovery vector.
- Whether `/test` connection-probe should be rate-limited / audited (Cat C) to prevent using it as a decrypt-oracle side channel.
- Dual-control on mutations: recommended-deferred; ratifier may elevate for the high-value-credential posture.
