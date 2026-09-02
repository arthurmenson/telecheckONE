# Decision Request — Layer 1 / Layer 2 NER does not work

**Filed:** 2026-09-01
**Author:** Claude
**Severity:** HIGH — a control recorded as implemented is inert
**Blocks:** merge of `telecheck-app` PR #279 (Sprint 1.2a), and **Pilot 1 Day-0 authorization**
**Supersedes reasoning in:** `Engineering-Review-Request-Layer-3-Unstructured-PII-Coverage-2026-09-01.md` (amended)

---

## The finding

`src/lib/pii-screener/ner.ts` filters `doc.entities()` for `PERSON`, `GPE` and `ORG`. `wink-eng-lite-web-model` never emits those types. Its recogniser is pattern-based only — `DATE`, `MONEY`, `TIME`, `CARDINAL`, `ORDINAL`, `PERCENT`, `EMAIL`, `URL`. There is no statistical person/place/organisation model in the package.

The filter therefore matches nothing, and the PERSON/GPE/ORG branch is dead code.

Verified by direct execution:

```
classifyEntities('My name is Sarah Whitfield and I need help')   -> []
classifyEntities('Patient Michael Thompson has diabetes')        -> []
classifyEntities('John Smith lives in Accra')                    -> []

screenInput(<each of the above>, 'ai_bound')  -> action: 'pass'
screenOutput(<each of the above>).redacted    -> false
```

**Consequence: no layer detects person names or prose addresses.** Layer 1 passes them to the provider. Layer 2 cannot redact a name the model invents. Layer 3 was never intended to. Only the structured regex patterns (SSN, email, phone, card, MRN, Ghana Card, context-bound passport) fire anywhere in the system.

This directly contradicts the spec's stated Layer 1 invariant:

> **Invariant:** on AI-bound routes, low-confidence NER hits are NEVER admitted to the request handler. Prose-form real names and addresses trigger NER but not regex…

They trigger nothing.

## Second defect, same root cause — it was ALSO over-blocking (2026-09-02)

The layer was configured for five entity types: `PERSON`, `GPE`, `LOCATION`, `DATE`, `ORG`. The model emits exactly one of them — `DATE`.

So the classifier detected precisely the one configured class that is **not** identity-bearing, and none of the four that are. It was broken in both directions simultaneously: it blocked date words and missed every real name.

Because `ai_bound` blocks on ANY hit:

```
'What time should I take my medication today?'   ->  422
```

The Mode 1 chat route — the primary surface Pilot 1 exists to exercise — rejected ordinary language on the word "today". CI surfaced this across three integration files.

**Actioned without escalation:** `DATE` removed from the surfaced set. A bare date is not PII, and this layer's stated remit is prose-form names and addresses. A date of birth *is* PII, but blocking every occurrence of "today" is not a usable control for it — that needs a date-adjacent-to-identity rule, which belongs to whichever remedy is chosen below. This was treated as a straightforward product-breaking bug rather than a policy question, because under **every** option below "today" must not 422 a chat message.

**Consequence, stated plainly:** the classifier now surfaces nothing at all, because the other four types never fire. That does not change the risk posture — no layer detected names before that change either — but it does mean the layer is now a documented no-op rather than one masked behind spurious DATE blocks. **This makes the decision below more urgent, not less.**

## Why it went unnoticed

Five tests assert exactly this behaviour (`A1`, `A5`, `A6`, `A6b`, and the Layer 2 PERSON case). **They had never run.** `vitest.config.ts` applies `tests/setup.ts` as a *global* setup that opens Postgres and applies migrations, so every test file — including pure-function ones — fails to collect without a live database, and none was available locally.

The same blind spot concealed two further real defects, both now fixed in PR #279: `us_ssn` ordered ahead of `ghana_card` so `GHA-123456789-0` was scrubbed as an SSN (wrong identity, in a pilot whose Ghana testers are precisely who would produce one), and a nesting assertion whose `.*` spanned the closing bracket so it fired on correct output.

`npm run test:unit` (added in PR #279) now runs these without a database. **That is how this was found, and it should be treated as the more important finding: tests that cannot be run locally do not get exercised.**

## Options

### Option 1 — Proper-noun (PROPN-run) heuristic on the POS tags already loaded

The model does expose POS tags, and these names tag as `PROPN`. Treat consecutive `PROPN` runs as candidate identities, with an allowlist for operational vocabulary (`Telecheck-US`, role names, provider names, module names, weekdays, months).

- **For:** cheap, no new dependency, no added hot-path inference, uses what is already loaded. Over-blocking is arguably *aligned* with a pilot whose policy is that participants type scripted synthetic content only.
- **Against:** false negatives are structural — lowercase names, single-token names, and addresses containing no proper noun all evade it. The allowlist is a participant-steerable bypass surface unless token-boundary, case-folding, substring and Unicode invariants are pinned.

### Option 2 — Real statistical NER

A JS transformer/ONNX model embedded in-process, or Presidio/spaCy as a local service.

- **For:** the production-quality answer; actually detects the classes claimed.
- **Against:** Mode 1 chat is a synchronous hot path, so this needs p95/p99 latency, cold-start, memory and concurrency evidence before adoption. Presidio additionally adds a Python service, an internal hop, and readiness/timeout/fail-closed coupling. Not something to rush into Sprint 1.2a.

### Option 3 — Accept regex-only for Pilot 1, documented honestly

Delete the dead PERSON/GPE/ORG code and the false capability claims, replace the misleading tests with ones describing actual coverage, and state plainly that names and prose addresses may reach the AI provider.

- **For:** honest; smallest change; the consent form and participant training already prohibit real data.
- **Against:** requires the ratifier to explicitly weaken the documented Day-0 gate and accept possible disclosure of real names to Anthropic if a participant disregards training.

### Option 4 — Exact approved-corpus admission (Codex Pass-2's recommendation)

Admit only canonicalised input matching the reviewed synthetic scenario corpus; reject every deviation before `ai_bound` and `audit_bound` processing. Keep a minimal PROPN heuristic as defense in depth only.

- **For:** the only option that actually establishes ingress is PII-free, because it does not rely on detecting PII at all — it rejects anything unrecognised. Strongest containment.
- **Against:** **this is a product decision, not just a security one.** It largely eliminates free-form conversational testing, which may be much of what Pilot 1 exists to exercise. If participants can only paste scripted lines, the pilot stops testing Mode 1 as users would use it.

---

## Three-way recommendation

| View | Recommendation |
|---|---|
| **Claude** | Option 1 + honest re-labelling and doc correction; Option 2 deferred to Pilot 2 |
| **Codex Pass-1** (source-first, independent) | Option 1 as the Pilot 1 control, with a corpus-derived allowlist; Option 2 as the production direction pending latency evidence |
| **Codex Pass-2** (contrast-and-synthesize) | **Option 4 primary**, Option 1 demoted to defense-in-depth only |

**Agreed by all three:** the control must not be called NER; every claim of statistical NER coverage comes out of the spec and `patterns.ts`; statistical NER needs Mode 1 performance evidence before adoption; the Layer 3 ERR's premise must be withdrawn (done); and Pilot 1 Day-0 cannot be authorized on the current capability claim.

**The disagreement is Option 1 vs Option 4, and it is a real one.** Pass-2's objection to Option 1 is substantive and I think correct on the security merits: a PROPN heuristic cannot establish that ingress is free of PII, because lowercase names, single-token names and non-proper-noun addresses evade it by construction, and a broad operational allowlist gives a participant something to steer. Where I am not able to decide is the cost: Option 4 buys that containment by removing free-form input, and whether Pilot 1 is still worth running under that constraint is a judgment about what the pilot is *for*.

**Claude's position after the exchange:** Pass-2 is right that Option 1 cannot be the trust boundary and I would withdraw it as the primary control. Between Option 4 and Option 3 the question is whether Pilot 1 needs free-form Mode 1 conversation to be worth running. If it does, Option 3 with an explicit, ratified risk acceptance is more honest than Option 1, which would provide the *appearance* of a boundary while leaking the same classes. If it does not, Option 4 is clearly best.

**This is why it is being put to you rather than actioned.**

---

## What is NOT blocked

PR #279's other work stands and is unaffected: Layer 3 destination-stream redaction, the numeric-lossless scanner, the chunk-boundary and oversized-record handling, the build-time logging boundary (`npm run check:log-call-sites`), the Ghana Card ordering fix, and `npm run test:unit`. Those closed real, verified leaks.

The branch's CI will be **red** on the five NER tests. That is correct and deliberate. They are now accurate documentation of a real gap, and they should not be made green by deleting them or by weakening the assertion — only by choosing a remedy.

## Ratifier decision

*(Evans + Engineering Lead)*

**Decision:**

**Rationale:**

**Recorded in:** Promotion Ledger entry —
