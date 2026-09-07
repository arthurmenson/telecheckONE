# TELECHECK — TEAM HANDOFF / START HERE

**Purpose:** bootstrap a **fresh team account with zero prior context** into the Telecheck build. If you are a new engineer or a new Claude Code session that has never seen this project, **read this file top to bottom first**, then follow §9 (First-session checklist).

**Current checkpoint (2026-09-07 18:19 UTC):**

- Specification baseline before this continuity commit: `fc6b16702339c2fdd5a938c22fa342f95fce4ab6`; Addendum **375**; cockpit **rev 480**; Promotion Ledger remains **P-048**.
- Backend main: `665ca67ef820e6a0659adf609d4ce1441c46178a` (PR301); patient main: `0e2bb16244dab7e368530815619f1416501404c3` (PR7).
- Matching reviewed patient authentication is active in the originating local workspace on API **3106** / preview **4177**. Retained database **56522** remains at **96 migrations through 097**; backend main separately contains **97 migration files through 098**.
- **Full platform remains in development:** all 18 slices and 118 baseline screens plus required additions remain in scope. Clinical 099–103 and manual-care UIs are uncommitted/unreleased under independent review. No production launch or physical-device acceptance is asserted.

> Read the latest Addendum and primary repository history for newer state. The July 2026 staging evidence below is preserved historical evidence, not a current availability or deployment check. Local process ports and workspace evidence do not automatically exist on a new machine.

---

## 1. What Telecheck is

A **multi-tenant, AI-assisted telehealth platform**. Two operating tenants at launch: **Telecheck-US** (consumer DBA "Heros Health", heroshealth.com) and **Telecheck-Ghana** (consumer DBA "Heros Health Ghana", ghana.heroshealth.com). One codebase, logical isolation by `tenant_id` on every PHI row (Postgres RLS + app-layer filtering + per-tenant KMS). Stack: **TypeScript · Fastify · PostgreSQL 16 + RLS · React / React Native**.

Authoritative product definition: `telecheckONE/Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Master_Platform_PRD_v1_10.md`. The build plan: `…/Telecheck_Master_Completion_Plan_v1_1.md`.

---

## 2. The repo constellation — THE map

Six repos. Recreate this sibling layout under one workspace folder:

| Repo | GitHub remote | Role | Clone to |
|---|---|---|---|
| **telecheckONE** | `github.com/arthurmenson/telecheckONE` | Spec corpus (source of truth) + Addendum trail + `progress.json` + this doc | `<ws>/telecheckONE/` |
| **telecheck-app** | `github.com/arthurmenson/telecheck-app` | The platform implementation (Fastify/PG). Its `CLAUDE.md` is authoritative for build rules. | `<ws>/telecheck-app/` |
| **telecheck-cockpit** | `github.com/arthurmenson/telecheck-cockpit` | Next.js ops dashboard — renders `progress.json`, the Work kanban, SpecCorpus versions | `<ws>/telecheck-cockpit/` |
| **telecheck-forms-intake** | `github.com/arthurmenson/telecheck-forms-intake` | Forms/Intake engine slice repo | `<ws>/telecheck-forms-intake/` |
| **telecheck-patient-app** | `github.com/arthurmenson/telecheck-patient-app` | Expo/React Native patient app (Track 4) | `<ws>/telecheck-patient-app/` |
| **telecheck-clinician-console** | **⚠ NOT ON GITHUB YET** (local-only) | Vite/React clinician console (Track 4) | `<ws>/telecheck-clinician-console/` |

> **CLAUDE.md files are the operating contracts.** `telecheckONE`'s CLAUDE.md (source-of-truth hierarchy, hard editing rules, autonomous-work authorization, discipline floor) and `telecheck-app`'s CLAUDE.md (hard invariants, tech stack, workflow, gotchas) carry most standing rules. **Read both before touching anything.** The two Track-4 app repos each carry their own README with run instructions + mock-to-real API maps.

The spec corpus contains the source-of-truth documents; the implementation lives in the app repositories. Do not confuse the EHBG §13 CLAUDE.md *template* (inside the spec bundle) with the app repo's real CLAUDE.md. Use the current filesystem manifest for document counts.

---

## 3. Current build state (2026-09-07)

**Merged foundations:** isolated Identity and classified KMS (Addenda372/374), patient record reads, consultation-payment prerequisites/recovery, versioned care consent, governed intake publication, protected server-encrypted intake, durable patient crisis history, pending clinician enrollment, PIN reset and patient refresh. Addendum375 lists backend PR291–301 and patient PR2–7 with exact merges and boundaries. Pending enrollment confers no clinical authority.

**Patient app:** GitHub-backed, with real tenant/Identity, history, consent, paid general-care intake and safety-status integrations. Current local authentication uses the matched reviewed backend/export and Resend without development-code echo. The user confirmed email receipt; reset cannot create their absent account. Their own successful account creation/sign-in is still unverified, and their open form was preserved. Local payment and key-wrapping transports are development fixtures.

**Unreleased clinical frontier:** staff MFA/network authority, consent/location integration and manual admission→queue→claim→review→advice→patient result are authored in clinical 099–103 and patient/clinician UI v2 candidates. Fresh independent complete reviews and integrated full-suite validation are in progress. A known crisis COMMIT-time nonce-expiry defect was reproduced in the prior candidate/merged path; the v2 repair is not released. Authentication approval does not approve that clinical path.

**Still required:** the complete 18-slice workflow set, canonical 118-screen baseline plus additions, full design/accessibility/native-device acceptance, prescribing/Pharmacy, refunds/cancellation/reconciliation, AI and follow-up, admin and other slices, durable email dispatch/retry, logout-only authority beyond the 900-second uncertain-refresh receipt, production provider/AWS policy verification, monitoring and operational recovery. Existing specification maturity and old percentage fields are not platform-completion evidence.

**Next critical path:** close independent clinical review findings and integrated checks, obtain fresh approval for material revisions, merge approved exact revisions with green required CI, and activate a matching reviewed composition. Preserve retained databases and prior evidence. Continue the remaining full-platform definition of done.

---

## 4. How the work gets done (the operating loop)

Author a bounded change on an isolated branch → run relevant checks and actual integration acceptance → obtain a **fresh independent COMPLETE review** of the entire material candidate → correct findings and use fresh independent reviewers for material iterations → require green applicable CI on the reviewed revision → merge with the expected head → record actual merges in the append-only Addendum trail and bump cockpit revision. Author checks, partial reviews and another package's approval are not release approval for the current candidate. Parallel authors/reviewers use separate disposable databases and preserve failed evidence.

The user's current standing instructions explicitly require independent counsel review and fresh subagents, and authorize continued autonomous work based on recommendations. The 2026-07-06 model-conditional per-PR review waiver is historical; **do not apply it now**. The full-platform goal remains active. A bookkeeping update does not ratify new canonical contracts or authorize clinical/production launch.

---

## 5. Live continuity sources — read THESE for "where are we"

In priority order (most authoritative first):

1. **Addendum trail** — `telecheckONE/Telecheck_v1_10_PRD_Update/AI_Service_Rollout_24h_Status_2026-05-14.md`. **Read the LAST addendum first.** Each entry = what shipped, commit SHAs, what's next. This is the cross-session memory.
2. **`git log --oneline` on each repo's `main`** — the merged-PR record.
3. **`telecheckONE/progress.json`** — machine-readable slice/stage status (rendered by the cockpit). ⚠ Read/write as **UTF-8** — a naive `open()` on Windows hits cp1252 and fails.
4. **Open PR queue** — `gh pr list` on `telecheck-app`.
5. **`telecheck-app/migrations/`** — source migration high-water mark. Query each runtime's actual ledger separately; source presence does not prove a migration was applied.
6. **`telecheckONE/Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Promotion_Ledger.md`** — append-only ratification record (never edit prior entries).

---

## 6. Credentials & access the operator must provision (NAMES ONLY — no secrets in git)

**No secret value is stored in any repo.** A new team account starts with none of these and must have them provisioned out-of-band. Nothing below should ever be committed.

| Secret / access | Where it lives | How to obtain / provision |
|---|---|---|
| **GitHub write access** to the 5 published repos and the clinician console when published | GitHub org/team settings | Operator grants the team account collaborator/team access |
| **Staging SSH key** (`staging_ed25519`) | `telecheck-app/infra/staging/.keys/` (gitignored) | Operator shares the private key, or adds the team's public key to the VPS `deploy` user |
| **Staging VPS** (Hetzner, IP `87.99.159.214`) | Hetzner Cloud console | Operator adds team to the Hetzner project, or shares SSH access |
| **`infra/staging/.env`** (POSTGRES_PASSWORD, BIND_ROLE_PASSWORD, JWT_SIGNING_KEY, STAGING_DOMAINS, TENANT_HOST_OVERRIDES, ACME_EMAIL) | On the VPS at `/home/deploy/telecheck-app/infra/staging/.env` (gitignored) | Already present on the VPS; template is `infra/staging/.env.example`. Regenerate secrets with `infra/staging/provision-hetzner.sh` if standing up a new box |
| **GitHub deploy key** for the VPS to pull `telecheck-app` | VPS `/home/deploy/.ssh/github_deploy` | Operator adds the public key as a repo deploy key |
| **Cockpit `.env.local`** (ANTHROPIC_API_KEY for chat; optional Supabase auth/realtime, PostHog) | `telecheck-cockpit/.env.local` (gitignored; template checked in) | Cockpit runs fine with all unset (fails closed gracefully). Anthropic key only needed for the chat backend |
| **Hetzner API token** (for scripted provisioning) | operator's shell env only | Global-scope token; used by `provision-hetzner.sh`. Never commit |

Standing project rule (from CLAUDE.md): **API keys/tokens NEVER go in a git-tracked file or any deliverable.** Credentials live only in gitignored `.env` files, OS env vars, or the operator's global MCP config.

---

## 7. Historical staging environment (2026-07-07 evidence; not reverified here)

The July handoff recorded a single Hetzner VPS and Docker Compose stack. The following runbook details and 8/8 smoke are historical. Current reachability, deployed revision, schema and production parity require separate verification; the September local activation does not update this host.

- **Recorded July health URL:** `https://87.99.159.214.sslip.io/health` → `{"status":"ok"}`. Root `/` = API index; `/ready` = aggregate per-module readiness. (`sslip.io` gives free wildcard DNS → real Let's Encrypt certs, no DNS record needed.)
- **Both tenants resolve:** US on the bare host, Ghana on `ghana.87.99.159.214.sslip.io`, via the `TENANT_HOST_OVERRIDES` env mechanism (staging hosts alias canonical tenants; DB-authoritative, fail-closed).
- **Deploy** (run ON the VPS from `/home/deploy/telecheck-app`): `bash infra/staging/deploy.sh` — pulls main, generates PG TLS certs host-side, rebuilds the image, applies migrations (`scripts/apply-migrations.sh`, `--single-transaction`, bootstraps cluster-global roles), provisions the SI-010 bind role, restarts, smokes `/health`.
- **Regression gate:** `bash scripts/staging-e2e-smoke.sh` — authenticated 8-step consult flow (seeds synthetic accounts + a forms template, mints patient/clinician JWTs in-container via `scripts/mint-staging-token.mjs`, runs initiate→intake→queue→claim→decision→patient-read-back). **Run this after every deploy.**
- Full provisioning + AWS-migration notes: `telecheck-app/infra/staging/STAGING_RUNBOOK.md`.

**Recorded for pre-go-live AWS review:** migrations pin SECURITY DEFINER ownership to a `postgres` superuser role (RDS forbids SUPERUSER — needs redesign); self-signed DB cert (RDS uses its CA bundle); `apply-migrations.sh` bootstraps roles CI provisions separately.

---

## 8. Rules that MUST carry over (do not relearn the hard way)

- **Platform-floor invariants** (never relax): audit append-only + hash chain (I-003), audit carries tenant_id (I-027), every PHI query tenant-filtered (I-023), cross-tenant needs break-glass+audit (I-024), tenant-blind errors (I-025), crisis detection never gated (I-019), interaction engine runs BEFORE prescribe commit, I-012 reject-unless for prescribing.
- **Glossary is canonical:** `medication_request` not "prescription"; `Mode 1`/`Mode 2` not "chatbot"; `tenant` not "customer". Bare "Heros" is a forbidden tenant identifier — patient-facing copy sources `tenant.consumer_dba`, never `tenant.id`.
- **Spec ratification leads implementation by ≥1 sprint.** Do not author canonical schemas ad hoc — file a Spec Issue (SI) and route to the ratifier (Evans + Engineering Lead + CDM owner). Ratification ceremonies append a Promotion Ledger entry; the ledger is append-only.
- **DIC v1.1 is canonical for UI dev; Patient mock v7 is the binding visual reference** (in `telecheckONE/telecheck-design-system/`). AI content always carries three cues: iris `#6E5BD6` + ai-spark glyph + "Telecheck AI" label — never color alone. No emoji in product UI.
- **Windows gotchas:** read curl/stdin JSON as UTF-8 (`sys.stdin.buffer.read().decode('utf-8')`), not the default cp1252. Run the cockpit dev server in a plain terminal, not through an agent shell that injects an empty `ANTHROPIC_API_KEY`.

---

## 9. First-session checklist (new team account)

1. Read this checkpoint, then the latest Addendum (§5.1), primary main histories and current open PRs. Distinguish merged source from a retained runtime's actual migration ledger.
2. Read the specification and implementation CLAUDE files and applicable repo instructions. The current user instruction requires fresh independent complete reviews; do not revive the historical waiver.
3. Clone accessible repositories from §2. Treat the preserved handoff bundles as historical recovery artifacts, not newer source than GitHub main.
4. Run the relevant repository checks in an isolated environment. Provision only credentials needed for the current work through the approved out-of-band process; never print or commit them.
5. For existing local services, verify their exact source/export manifests and read-only runtime health before changing them. Preserve account data, ledgers, user forms and private input. Do not run migrations or reseed merely to reproduce a status snapshot.
6. Pick the next critical-path item from the latest Addendum, complete it through independent review and required CI, then record the actual result. Verify staging separately only when the task involves that environment.

---

## 10. Remaining access and operational work

1. **Clinician console publication:** no GitHub remote is recorded at this checkpoint. The patient repository is already published; do not create a duplicate. Publish the reviewed console when authenticated access and the reviewed candidate are ready. Preserve `_handoff_bundles/` as historical recovery evidence.
2. **Team access:** provision repository, provider and staging access as required through §6; never place secrets in Git or handoff artifacts.
3. **Production acceptance:** cloud/provider provisioning, production secrets, current role/ownership constraints, clinical/regulatory acceptance and restore/DR evidence remain separate work. The local Resend setup proves email arrival for the reported incident; it is not platform launch approval.
4. **User account flow:** the user's successful account creation/sign-in remains unverified. New-account creation and existing-account PIN reset use different codes; request a fresh code on the appropriate screen after expiry. Never invent or read their private form values.

---

*The Addendum trail and primary Git history carry continuing state. This refresh preserves old staging evidence with its date and replaces stale handoff instructions with the current frontier.*
