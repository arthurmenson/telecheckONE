# TELECHECK — TEAM HANDOFF / START HERE

**Purpose:** bootstrap a **fresh team account with zero prior context** into the Telecheck build. If you are a new engineer or a new Claude Code session that has never seen this project, **read this file top to bottom first**, then follow §9 (First-session checklist).

**Snapshot at handoff (2026-07-07):**
- Spec corpus repo `telecheckONE` @ `a9440aa` · Addendum trail at **#333** · Promotion Ledger at **P-046**
- App repo `telecheck-app` @ `8e15cfd` · migration high-water **063** · `progress.json` **rev 438** · lifecycle stage `foundation-build`
- Staging is **LIVE** on a Hetzner VPS; the authenticated end-to-end consult flow smoke passes **8/8** on live infra.

> This document is a **static bootstrap**. It will go stale. The **always-fresh** state lives in the live continuity sources — see §5. Trust those over this file for "where are we right now."

---

## 1. What Telecheck is

A **multi-tenant, AI-assisted telehealth platform**. Two operating tenants at launch: **Telecheck-US** (consumer DBA "Heros Health", heroshealth.com) and **Telecheck-Ghana** (consumer DBA "Heros Health Ghana", ghana.heroshealth.com). One codebase, logical isolation by `tenant_id` on every PHI row (Postgres RLS + app-layer filtering + per-tenant KMS). Stack: **TypeScript · Fastify · PostgreSQL 16 + RLS · React / React Native**.

Authoritative product definition: `telecheckONE/Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Master_Platform_PRD_v1_10.md`. The build plan: `…/Telecheck_Master_Completion_Plan_v1_0.md`.

---

## 2. The repo constellation — THE map

Six repos. Recreate this sibling layout under one workspace folder:

| Repo | GitHub remote | Role | Clone to |
|---|---|---|---|
| **telecheckONE** | `github.com/arthurmenson/telecheckONE` | Spec corpus (source of truth) + Addendum trail + `progress.json` + this doc | `<ws>/telecheckONE/` |
| **telecheck-app** | `github.com/arthurmenson/telecheck-app` | The platform implementation (Fastify/PG). Its `CLAUDE.md` is authoritative for build rules. | `<ws>/telecheck-app/` |
| **telecheck-cockpit** | `github.com/arthurmenson/telecheck-cockpit` | Next.js ops dashboard — renders `progress.json`, the Work kanban, SpecCorpus versions | `<ws>/telecheck-cockpit/` |
| **telecheck-forms-intake** | `github.com/arthurmenson/telecheck-forms-intake` | Forms/Intake engine slice repo | `<ws>/telecheck-forms-intake/` |
| **telecheck-patient-app** | **⚠ NOT ON GITHUB YET** (local-only) | Expo/React Native patient app (Track 4) | `<ws>/telecheck-patient-app/` |
| **telecheck-clinician-console** | **⚠ NOT ON GITHUB YET** (local-only) | Vite/React clinician console (Track 4) | `<ws>/telecheck-clinician-console/` |

> **CLAUDE.md files are the operating contracts.** `telecheckONE`'s CLAUDE.md (source-of-truth hierarchy, hard editing rules, autonomous-work authorization, discipline floor) and `telecheck-app`'s CLAUDE.md (hard invariants, tech stack, workflow, gotchas) carry most standing rules. **Read both before touching anything.** The two Track-4 app repos each carry their own README with run instructions + mock-to-real API maps.

The spec corpus is NOT a codebase — it is ~90 markdown files. The app repo IS the code. Do not confuse the EHBG §13 CLAUDE.md *template* (inside the spec bundle) with the app repo's real CLAUDE.md.

---

## 3. Current build state (2026-07-07)

**Foundation (~90%):** identity/auth with SI-010 actor-context binding, RLS baseline + clean-room migration-chain CI gate, non-spoofable tenant binding, append-only audit chain, tenant-config resolver.

**Slices with live handler surfaces on `main`:** Async-Consult (Sprint 10 complete — full initiate→intake→queue→claim→decision loop, 6 `/v1/async-consults` endpoints), Med-Interaction, Admin-Backend Sprint 2, AI-Service (Mode 1 mounted; Mode 2 flag-gated), Crisis-Response (Sprint 2 incl. SI-025 identity remediation), Pharmacy (DB layer complete incl. SI-007 Refill/Dispensing/Shipment, migration 060).

**Spec-final, not yet implemented (11 slices):** Acquisition, Admin-Config, Adverse-Events, Community, Fake-Meds, Herb-Drug, Labs, Market-Rollout, RPM/CCM, Sync-Video, plus AI Mode 2 activation.

**Track 4 (UI):** both apps **scaffolded and test-green locally** — patient app (Expo, 12 tests, three-cue AI rule enforced) and clinician console (Vite, 20 tests, interaction-before-commit enforced). **Both are local-only — see §10.**

**Staging:** Hetzner CX22, Docker Compose (PG16+TLS, Redis, app, Caddy auto-TLS), 63 migrations applied, multi-tenant HTTPS resolving both tenants, E2E smoke 8/8 green. See §7.

**Next critical path:** wire the real Mode-1 AI-prep endpoint (removes the one simulated smoke step) → clear remaining per-module readiness gates → the Ghana pilot loop. US GA adds: patient/clinician apps to production, US regulatory module (FDA/DEA/state PMPs), pharmacy portal, billing, Sync-Video.

---

## 4. How the work gets done (the operating loop)

Per-PR cycle: author a change on a branch → open PR → CI (`Build, lint, typecheck, test` + migration-chain gate + benchmarks + dependency-review) must be green → squash-merge → append an **Addendum** to the status doc → bump `progress.json` revision. One migration number is consumed per DB-layer PR (watch for number collisions across parallel branches — this has bitten twice; renumber the later one).

**Codex adversarial review** was the historical per-PR merge gate. It is **currently WAIVED for the build phase** per an operator directive dated 2026-07-06 ("with Fable 5 I don't need Codex adversarial review until pre-go-live"). **This waiver is model-conditional — a new team must re-confirm it with the operator before relying on it.** A full Codex adversarial sweep is still booked for **pre-go-live (Phase D entry)**. If Codex is re-enabled, the incantation and cadence are in `telecheckONE`'s CLAUDE.md ("Codex adversarial-review cadence").

---

## 5. Live continuity sources — read THESE for "where are we"

In priority order (most authoritative first):

1. **Addendum trail** — `telecheckONE/Telecheck_v1_10_PRD_Update/AI_Service_Rollout_24h_Status_2026-05-14.md`. **Read the LAST addendum first.** Each entry = what shipped, commit SHAs, what's next. This is the cross-session memory.
2. **`git log --oneline` on each repo's `main`** — the merged-PR record.
3. **`telecheckONE/progress.json`** — machine-readable slice/stage status (rendered by the cockpit). ⚠ Read/write as **UTF-8** — a naive `open()` on Windows hits cp1252 and fails.
4. **Open PR queue** — `gh pr list` on `telecheck-app`.
5. **`telecheck-app/migrations/`** — highest number = DB-layer high-water mark.
6. **`telecheckONE/Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Promotion_Ledger.md`** — append-only ratification record (never edit prior entries).

---

## 6. Credentials & access the operator must provision (NAMES ONLY — no secrets in git)

**No secret value is stored in any repo.** A new team account starts with none of these and must have them provisioned out-of-band. Nothing below should ever be committed.

| Secret / access | Where it lives | How to obtain / provision |
|---|---|---|
| **GitHub write access** to the 4 (soon 6) repos | GitHub org/team settings | Operator grants the team account collaborator/team access |
| **Staging SSH key** (`staging_ed25519`) | `telecheck-app/infra/staging/.keys/` (gitignored) | Operator shares the private key, or adds the team's public key to the VPS `deploy` user |
| **Staging VPS** (Hetzner, IP `87.99.159.214`) | Hetzner Cloud console | Operator adds team to the Hetzner project, or shares SSH access |
| **`infra/staging/.env`** (POSTGRES_PASSWORD, BIND_ROLE_PASSWORD, JWT_SIGNING_KEY, STAGING_DOMAINS, TENANT_HOST_OVERRIDES, ACME_EMAIL) | On the VPS at `/home/deploy/telecheck-app/infra/staging/.env` (gitignored) | Already present on the VPS; template is `infra/staging/.env.example`. Regenerate secrets with `infra/staging/provision-hetzner.sh` if standing up a new box |
| **GitHub deploy key** for the VPS to pull `telecheck-app` | VPS `/home/deploy/.ssh/github_deploy` | Operator adds the public key as a repo deploy key |
| **Cockpit `.env.local`** (ANTHROPIC_API_KEY for chat; optional Supabase auth/realtime, PostHog) | `telecheck-cockpit/.env.local` (gitignored; template checked in) | Cockpit runs fine with all unset (fails closed gracefully). Anthropic key only needed for the chat backend |
| **Hetzner API token** (for scripted provisioning) | operator's shell env only | Global-scope token; used by `provision-hetzner.sh`. Never commit |

Standing project rule (from CLAUDE.md): **API keys/tokens NEVER go in a git-tracked file or any deliverable.** Credentials live only in gitignored `.env` files, OS env vars, or the operator's global MCP config.

---

## 7. The staging environment

Single Hetzner VPS, prod-parity Docker Compose stack. The app container is the **same image** the future AWS deploy will run.

- **Live:** `https://87.99.159.214.sslip.io/health` → `{"status":"ok"}`. Root `/` = API index; `/ready` = aggregate per-module readiness. (`sslip.io` gives free wildcard DNS → real Let's Encrypt certs, no DNS record needed.)
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

1. Get access provisioned (§6): GitHub repos, staging SSH key, `.env` files.
2. Clone the 6 repos into one workspace folder in the §2 layout.
3. Read `telecheckONE/CLAUDE.md` and `telecheck-app/CLAUDE.md` end to end.
4. Read the **last** Addendum in the status doc (§5.1) — that is the true current frontier.
5. `cd telecheck-app && npm install` — confirm `npx tsc --noEmit` and CI-equivalent checks are green.
6. Confirm staging is up: `curl https://87.99.159.214.sslip.io/health`.
7. Confirm with the operator whether the **Codex waiver** (§4) holds for your model/phase.
8. Pick the next critical-path item from the last Addendum's "next" line and go — branch, build, CI-green, merge, Addendum, `progress.json` bump.

---

## 10. Operator-only actions still pending at handoff

These are **not doable by an agent** and are the blocking items for a clean handoff:

1. **Create GitHub repos for the two Track-4 apps** (`telecheck-patient-app`, `telecheck-clinician-console`) under the target org, then push. Both are fully committed locally (clean trees). Once repos exist:
   ```
   cd telecheck-patient-app && git remote add origin <url> && git push -u origin main
   cd telecheck-clinician-console && git remote add origin <url> && git push -u origin main
   ```
   Until this happens, that code exists on **one machine only.**
2. **Grant the team account access** to all repos + the staging VPS + share/rotate the credentials in §6.
3. **Decide whether the Codex-review waiver carries** to the new team/model (§4).
4. Pre-go-live (later): AWS provisioning, the SUPERUSER-ownership migration redesign (§7), production secrets.

---

*Maintained by the build. When the frontier moves, the Addendum trail and `progress.json` move with it — this file is refreshed only at major handoffs.*
