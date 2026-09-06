# Codex takeover prompt — Telecheck Pilot 1 substrate

You are taking over as the primary implementer of the Telecheck platform build. Until now you were the *adversarial reviewer* on this project and Claude was the implementer. That is reversed as of 2026-09-02. Read this whole document before touching anything.

---

## 0. TL;DR — what to do first

1. Clone both repos side by side (§2). They must be siblings.
2. Read the four orientation files in §3, in the order given.
3. Run the verification commands in §5 and confirm you reproduce the stated results. **If they do not reproduce, stop and report — do not start building.**
4. Read §7 (blocked decisions). **Two decisions are open and one blocks Pilot 1 Day-0.** You may not resolve them yourself.
5. Pick up §8 Sprint 1.2b (Layer 4). It is unblocked and is the next critical-path item.

---

## 1. What this project is

Telecheck is a multi-tenant AI telehealth platform. Two operating tenants at launch: `Telecheck-US` (patient-facing DBA "Heros Health") and `Telecheck-Ghana` ("Heros Health Ghana"). Multi-tenant by logical isolation on `tenant_id`: PostgreSQL RLS + app-layer filtering + per-tenant KMS keys.

**The current workstream is "Path α" — the Pilot 1 substrate.** Pilot 1 is a **synthetic-data-only** workflow rehearsal on Hetzner staging with a handful of non-engineering volunteers. It is explicitly NOT a real-PHI pilot. Pilot 2 (real Ghana chronic-care PHI) requires a Phase-E/F-compliant substrate, BAAs, and Ghana counsel sign-off — a separate gated program.

**Why this distinction is load-bearing:** an earlier plan proposed loading real Ghana patient PHI onto the Hetzner staging box, whose own runbook declares it synthetic-only. You caught that (CRITICAL, 2026-08-30). The reframe into Pilot 1 → Pilot 2 is the result. Do not collapse them back together.

---

## 2. Repos and layout

Two GitHub repos. **They must be checked out as siblings** — code resolves the spec corpus by relative path.

```
<workspace>/
├── telecheckONE/     git@github.com:arthurmenson/telecheckONE.git    (spec corpus)
└── telecheck-app/    git@github.com:arthurmenson/telecheck-app.git   (implementation)
```

| Repo | HEAD at handoff | What it is |
|---|---|---|
| `telecheck-app` | `9b9158d` | TypeScript / Fastify / PostgreSQL+RLS implementation |
| `telecheckONE` | `75c4172` | ~87-file markdown spec corpus + cockpit + Addendum trail |

If the spec corpus is not a sibling, set `TELECHECK_SPEC_PATH` to its actual location.

⚠️ On the machine this was authored on, the spec-corpus repo root also contains a **stale nested `telecheckONE/` subdirectory**. The canonical workstream directory is the one at the repo **root** (`Telecheck_v1_10_PRD_Update/`, ~98 files, holds the Addendum trail). Two artifacts were written into the nested copy by mistake and have been `git mv`'d out. A clean clone does not have this ambiguity — just don't recreate it.

**Stale-tracking-ref trap (recurring, has cost multiple sessions):** a fresh container's local `origin/main` can lag the true remote, making the repo look stranded at an old migration. When continuity is in doubt trust `git ls-remote origin refs/heads/main`, not the local tracking ref.

---

## 3. Read these first, in this order

1. `telecheck-app/CLAUDE.md` — build rules, hard invariants, tech stack, gotchas. It applies to you now; where it says "Claude", read "the implementer".
2. `telecheckONE/CLAUDE.md` — spec-corpus operating contract, source-of-truth hierarchy, the autonomous-work authorization and its **hard floor** (§6 below).
3. `telecheckONE/Telecheck_v1_10_PRD_Update/AI_Service_Rollout_24h_Status_2026-05-14.md` — **the Addendum trail. Read the LAST addendum (365) first.** This is the canonical cross-session continuity mechanism: what shipped, commit SHAs, what is blocked.
4. `telecheck-app/docs/PII_SCREENING_AND_LOG_REDACTION_SPEC.md` — the governing spec for the five-layer PII defense, which is the active workstream.

Then, on demand rather than upfront:

- `telecheckONE/Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Master_Completion_Plan_v1_1.md` — Phase A–F gating, track structure, open questions.
- `telecheck-app/docs/PATH_A_PILOT_COMPLETION_RUNBOOK.md` — Pilot 1 gates + Day-0 startup authorization checklist.
- `telecheck-app/docs/PILOT_1_TO_PILOT_2_GATING_CHECKLIST.md` — the 10 gates between synthetic and real PHI.

---

## 4. Where the build actually is

### The five-layer PII defense (the active workstream)

| Layer | What | Status |
|---|---|---|
| 1 | Input screener at ingress | **Built** — regex live; **NER inert, see §7** |
| 2 | Egress screener on model output | **Built** — regex live; NER inert |
| 3 | Log redaction at the pino destination stream | **Built and merged (PR #279)** |
| 4 | AI-vendor payload sanitization | **NOT BUILT — your next task** |
| 5 | Backup redaction | **NOT BUILT** |

Plus a build-time control that is not a "layer": `npm run check:log-call-sites`.

### Route classes (`src/lib/pii-screener/index.ts`)

- `ai_bound` — reaches an external provider. Blocks on **ANY** hit, high or low confidence.
- `audit_bound` — reaches append-only, purge-exempt `audit_records`. Blocks on ANY hit. This class exists because `audit_records` survives env-purge by design (I-003), so PII landing there survives a purge entirely.
- `internal` — high-confidence blocks; low-confidence redacts inline.

### The server-visible plaintext surface is ONE route

Only `POST /v0/ai/chat` (`message_text`) exposes plaintext free-text to the server. The three async-consult routes (`intake`, `decision`, `follow-up-messages`) encrypt **client-side** per the I-026 KMS envelope posture — the backend receives ciphertext, DEK id, IV and tag. **There is no plaintext for a server-side screener to inspect.** That is the architecture working as designed, not a wiring gap.

Consequence: for those three routes, screening must run client-side before encryption, in `telecheck-patient-app` and `telecheck-clinician-console`. That is Track 4 work and an **open operator decision** (§7).

### Ordering invariant in the chat handler (non-negotiable)

In `src/modules/ai-service/internal/handlers/chat.ts` the screener runs **AFTER** the I-019 crisis gate and **BEFORE** Stage-2 validation, persistence, and the LLM call.

- *After the crisis gate* because I-019 / FLOOR-013 is platform-floor: crisis detection runs on raw text and is not suppressible by any other check. A distressed participant who also typed real PII still gets the crisis sentinel and Category A audit. The crisis path makes no LLM call, so no PII crosses the provider boundary on it.
- *Before persistence and the LLM call* on the non-crisis path, so a blocked turn never persists and the provider never sees the text.

**Accepted, documented residual:** a crisis-positive turn that ALSO contains real PII persists the raw message. The crisis floor outranks the PII block by design. Test `PII-6` pins this ordering. Do not "fix" it.

### Layer 3 design decisions — do not relitigate

Each of these closed a finding of yours. Reasoning is in the module header of `src/lib/pii-screener/log-redaction.ts`:

- Redaction runs at the **pino destination stream**, not `hooks.logMethod`. The hook runs *before* serializers (so it never sees query-string PII in `req.url`), and rebuilding objects there corrupts Fastify's prototype-getter-backed request.
- `JSON.parse` is a **validity gate only**; its result is discarded. A parse/stringify round trip is lossy past 2^53, and malformed JSON-like text bypassed the fallback.
- Numeric lexemes are screened **whole and never parsed**.
- **Property names are screened**, not just values.
- **No shape-inferred trust.** The UUID/ULID carve-out was removed entirely after a syntactically valid ULID containing a nine-digit run was emitted verbatim.
- Numeric preservation requires an exact case-sensitive **root-relative path AND a value inside that field's domain** (`NUMERIC_PRESERVE_RULES`). Position alone is not provenance — a merge object can collide with a root field name.
- **Known, documented residual:** a 13-digit Luhn-valid integer inside the epoch window is preserved at root `time`. Not closable — a legitimate ms epoch *is* such an integer, and roughly one in ten is Luhn-valid by chance.

### Pattern ordering is load-bearing

`redactString` applies patterns in sequence, so a broader pattern that fires first consumes text a more specific one would have labelled. `ghana_card` **must** precede `us_ssn`: a Ghana Card's 9-digit run is hyphen-bounded, so with `us_ssn` first, `GHA-123456789-0` came out as `GHA-[REDACTED:US Social Security Number]-0` — scrubbed, but under the wrong identity, in a pilot whose Ghana testers are exactly who produce one. Keep specific before general.

---

## 5. Verify the environment before building

```bash
cd telecheck-app
npm install                       # Node >= 20, npm >= 10

npm run typecheck                 # expect: clean
npm run lint                      # expect: clean (eslint --max-warnings 0)
npm run format:check              # expect: All matched files use Prettier code style!
npm run check:log-call-sites      # expect: check-log-call-sites: OK (207 files scanned)
```

**Unit tests without a database.** This runner exists because the main vitest config applies a global Postgres-dependent setup to *every* file, so pure-function tests could not be run locally at all:

```bash
DATABASE_URL="postgresql://x:x@localhost:5432/x" \
REDIS_URL="redis://localhost:6379" \
TENANT_KMS_LOCAL_DEV_KEY="dev-only-not-for-production-32-chars" \
NODE_ENV=test \
npm run test:unit
# expect: 157 passed | 5 expected fail   (the 5 are the known NER gap — §7)
```

**Full suite** needs a real PostgreSQL 15+ with `TEST_DATABASE_URL` set. CI provides one. With no local Postgres, `npm test` cannot run and **CI is your gate**.

⚠️ `npm run test:unit` uses an **explicit opt-in include list, not a glob** — `src/` mixes pure and DB-dependent tests. Add files to `vitest.unit.config.ts` as you confirm them DB-free. A broad glob would fail and train everyone to ignore the result.

---

## 6. Rules you must follow

From `telecheckONE/CLAUDE.md`. Not advisory.

### Platform-floor invariants — never relax

- **I-003** audit table is append-only. Never UPDATE or DELETE an audit row. Hash chain integrity must hold. Bare suppression on audit failure is forbidden.
- **I-019** crisis detection is platform-floor. Never disable, never gate behind config.
- **I-023** every PHI-touching query is tenant-filtered (RLS + app layer + KMS).
- **I-024** cross-tenant access requires break-glass with audit. Always operator-gated.
- **I-025** error responses must not leak cross-tenant existence (tenant-blind 404s).
- **I-026** `tenant.country_of_care` immutable post-creation.
- **I-027** audit records always carry `tenant_id`.
- **I-012** three-clause reject-unless for prescribing.
- **I-029 / I-030 / I-031** research-export gating.

### Glossary is canonical

`medication_request` not `prescription`. `Mode 1` / `Mode 2` not `chatbot`. `tenant` not `customer`. Enforced at lint level via `id-denylist`.

### Spec leads code by ≥1 sprint, one-way

**Do not author canonical schemas.** If a slice PRD disagrees with CDM / OpenAPI / State Machines, file a Spec Issue and route to Track 6 — do not edit the engineering spec to match the slice.

### HARD FLOOR — stop and surface, do not proceed

1. Findings turning on policy / regulatory / architectural judgment (security posture, HIPAA classification, novel ADR-class decisions, tenant-isolation invariants).
2. Prohibited actions — financial transactions, permission changes, deletions, secret handling, sharing data with external systems.
3. Spec-corpus ratification ceremonies. You may file SIs and propose row shapes; you may NOT execute ratification.
4. Production deploys.
5. Cross-tenant break-glass.
6. **Any finding proposing net-new architecture, schema, or invariant amendment beyond the ratified scope of the item under review is a hard STOP. Do not close it inline.**

Discriminator for #6: it is architectural-judgment when it proposes (a) net-new canonical schema fields, (b) net-new canonical invariants or amendments, (c) net-new platform-floor primitives (DB roles, audit-chain partitions, role-elevation patterns), or (d) any amendment to a canonical contract surface not already scoped as a sub-decision. Prose-consistency findings, in-scope clarifications, and SUPERSEDED-annotation closures do NOT trigger it.

**Worked example of why this matters.** PR #10 ran 30 iterations past its first architectural-judgment finding, each iteration extending unratified architecture. PR #11 STOPPED at its R1 architectural finding, escalated via an Engineering Review Request, came back with an answer in ~24h, and converged in 5 rounds. Same tooling, same mechanism, opposite outcomes — the discriminator was whether STOP-and-escalate was honored.

### Secrets

API keys never go in a git-tracked file or any deliverable. A PostHog key was deleted by the provider after being exposed in a repo. Credentials live only in the global MCP config outside any repo, or an OS env var.

### Per-PR cycle

Every PR: independent adversarial review → iterate to APPROVE → **green CI** → squash-merge → append an Addendum to the trail → bump `progress.json` revision.

**Green CI is a gate, not a suggestion.** CI runs format:check → lint → typecheck → check-log-call-sites → full vitest against a Postgres service container. `format:check` and `lint` fail *before* tests run, so a formatting slip masks everything downstream — run them locally first.

**You are now the implementer, so you no longer review your own work.** Get an independent review before merging: a fresh session with no context from the implementation, or Evans. Do not merge on your own say-so.

---

## 7. ⛔ BLOCKED — two open decisions, both Evans's to make

### 7.1 Layer 1 / Layer 2 NER is inert — **BLOCKS PILOT 1 DAY-0**

`src/lib/pii-screener/ner.ts` filters `doc.entities()` for `PERSON` / `GPE` / `ORG`. `wink-eng-lite-web-model` emits **only pattern-based** entity types (`DATE`, `MONEY`, `TIME`, `CARDINAL`, `ORDINAL`, `PERCENT`, `EMAIL`, `URL`). It ships **no statistical person/place/organisation recogniser at all.** The filter matches nothing.

```
classifyEntities('My name is Sarah Whitfield and I need help')   -> []
screenInput('Patient Michael Thompson has diabetes', 'ai_bound') -> 'pass'
```

**No layer detects person names or prose addresses.**

It was broken in *both* directions. Of the five configured types the model emitted exactly one — `DATE`, the only one that is not identity-bearing. Since `ai_bound` blocks on any hit, `What time should I take my medication today?` returned **422 on the Mode 1 chat route**. `DATE` has been removed and replaced by a context-bound `date_of_birth` regex that catches labelled birth dates and leaves ordinary dates alone.

**Six tests** assert entity detection and had **never executed** (the Postgres-dependent global setup). They are now `it.fails` — **a ratchet, not a mute**: they fail the moment a remedy works, forcing whoever fixes it to come back and remove the marker. **Do not delete them or weaken the assertions.**

- `src/lib/pii-screener/index.test.ts` — five: `A1`, `A5`, `A6` (PERSON), `A6b` (GPE, low-confidence redact-inline), and the Layer 2 hallucinated-PERSON case.
- `tests/integration/ai-service-mode-1-chat-http.test.ts` — one: `PII-3`.

Only the five unit-level ones appear in `npm run test:unit`; `PII-3` lives in an integration file that is not in that runner's include list, which is why §5 says "5 expected fail" and not 6.

**Decision artifact:** `telecheckONE/Telecheck_v1_10_PRD_Update/Decision-Request-Layer-1-NER-Capability-Gap-2026-09-01.md`

Four options. Claude and your own Pass-1 recommended a PROPN-run heuristic over the POS tags already loaded. **Your Pass-2 rejected that as a trust boundary** — lowercase names, single-token names, and addresses containing no proper noun evade it by construction, and a broad operational allowlist is participant-steerable — and recommended **exact approved-corpus admission** instead. That buys containment by removing free-form conversational input, which is a product judgment about what Pilot 1 is for. **Hence Evans, not you.**

### 7.2 Layer 3 unstructured-PII coverage

`telecheckONE/Telecheck_v1_10_PRD_Update/Engineering-Review-Request-Layer-3-Unstructured-PII-Coverage-2026-09-01.md`

**This artifact is AMENDED and its central premise was FALSE.** It argued Layer 3 need not cover unstructured PII because Layers 1 and 2 do. They do not (§7.1). Decide 7.1 first — what Layer 1 ends up doing determines what is left for Layer 3.

All three reviewers still reject NER-on-every-log-line: cost on a high-volume hot path, and PERSON/GPE/ORG would fire on the operational vocabulary logs are made of (tenant ids, role names, provider names, module names), destroying incident correlation.

---

## 8. Next work — Sprint 1.2b, Layer 4 (unblocked, start here)

**Goal:** sanitize payloads before they cross the external AI-provider boundary.

**Seam — recon already done:** wrap `resolveClinicalProvider` in `src/modules/ai-service/internal/providers/`, so a future adapter *cannot forget* the sanitization pass. Do **not** do it per-call-site. `anthropic-provider.ts` assembles `system` + `messages` and POSTs to `api.anthropic.com`; a per-call-site approach leaves the next adapter unprotected by default.

**Absolute prohibition (carried from Layer 1):** never send suspected-PHI candidate text to any external AI provider in order to determine whether it contains PHI. That defeats the layer — the reason text reaches a classifier at all is that it might be real PHI.

Then, in order:

- **1.2c** Layer 5 — backup redaction.
- **1.3 phase B** — env-purge, incident capture/clear/gc, close-wipe, marker remediation, pii-scrub, baseline-seed, and the CI suite (schema-drift classification, preserved→purged FK-edge, seeded-canary, attestation-transaction). **This phase also owes `createAccount` a real classification argument** — see §9.
- **1.4** adversarial suite across all five layers.

---

## 9. Known debt you are inheriting

**`createAccount` does not classify.** Migration 080 added `accounts.cohort_classification` NOT NULL. It originally had **no DEFAULT**, on the reasoning that provisioning paths forgetting the field should "fail loudly rather than silently baseline-classify". The goal was right, the mechanism was not: `createAccount` (`src/modules/identity/internal/repositories/account-repo.ts`) is the single INSERT site and does not supply the column, so it failed not loudly but *totally* — 55 test files, Postgres 23502.

It now carries `DEFAULT 'unclassified'`, which is the explicit data-model-defect state that `verify-pilot-1-baseline.sh` **refuses to purge on**. Fail-closed is preserved; only the timing of the complaint moved to purge preflight.

⚠️ **Consequence:** every app-created account lands `unclassified`, so the preflight gate will refuse until each is remediated. Fail-closed but operationally noisy. Phase B must give `createAccount` an explicit classification argument, applying migration 080's own backfill mapping (clinician / tenant_admin / platform_admin / service → `baseline`; patient / delegate created during the pilot → `participant`) with an override for baseline test fixtures. **This was deliberately left undecided rather than guessed at.**

**Open PR queue — do not re-author queued work.** At handoff, `gh pr list` showed **#267 "feat(subscription): SI-001 closed — Subscription slice §20 HTTP surface + migrations 075-077"** still open, plus dependabot PRs (#280, #276, #190, #189). #267 is a standing `[CODEX-PENDING]` item: authored but never reviewed or merged. Re-authoring it is duplication and is forbidden by the discipline floor. Triage it before starting new slice work.

**Migration high-water mark:** `080_pilot_1_cohort_classification.sql`.

---

## 10. Hard-won lessons — please don't re-learn these

- **A test suite that cannot be run locally does not get exercised.** Five NER tests, two stale assertions, a Ghana Card ordering bug, and a migration that broke every account INSERT all sat unnoticed because the global vitest setup required Postgres. `npm run test:unit` exists to close that. Keep it working and extend its include list.
- **Verify by execution, not by reading.** Nearly every real defect in this workstream was found by running adversarial inputs through the actual function, not by inspection. Several were in code that read as obviously correct.
- **Scope creep is invisible without checking.** PR #279 was described throughout its cycle as "Sprint 1.2a". It was 80 commits, 32 files, ~7,400 lines — the entire Path α workstream, because nothing from Sprints 1.1a–d or 1.3-A had ever reached `main`. Review was file-scoped, so approval never covered the whole diff. **Branch each sprint off `main`, and check `git diff --stat origin/main..HEAD` before opening a PR.**
- **Comparing against the wrong baseline produces wrong verdicts.** A NO-SHIP was issued on the grounds that a change "weakened a previously shipped control" — but that control had never shipped to `main`; it existed only on the branch. Always ask: better or worse than `main`?
- **Destructive operations may be blocked by the harness.** That is a guardrail, not a bug. Find a non-destructive path, or ask.
- **A hoisted or imported message constant is still a static string.** The log-call-site checker resolves them cross-file; do not "fix" that by inlining messages.

---

## 11. Reporting back to Evans

- **Any question requiring a decision gets recommendations from two independent reviewers, surfaced side-by-side.** You are now the implementer, so the second opinion must come from outside your own implementation context.
- Status updates where you are informing rather than asking need no second opinion.
- When you and the independent reviewer **agree** on the next concrete step, execute it and report after the fact — except where the §6 hard floor applies, which always needs Evans's confirmation regardless of agreement.
- Every merged PR: Addendum appended to the trail, `progress.json` revision bumped. Last was **Addendum 365, revision 470.**

Evans is the ratifier — `info@cardinalfive.com`.
