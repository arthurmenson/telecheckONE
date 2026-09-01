# Engineering Review Request — Layer 3 unstructured-PII coverage

**Filed:** 2026-09-01
**Author:** Claude
**Trigger:** CLAUDE.md hard-floor item 6 — Codex finding proposes amending a decision already ratified in the governing spec, beyond the sub-decision scope of the work under review
**Under review:** Sprint 1.2a — Layer 3 log redaction (`telecheck-app` PR #279, branch `feat/pilot-1-2a-layer3-log-redaction`)
**Blocks:** merge of PR #279. No further closures on 1.2a until the ratifier decides.

---

## Why this is an escalation and not an inline closure

Sprint 1.2a has been through several Codex rounds. Every prior finding was a concrete leak or correctness defect in the implementation and was closed inline: chunk-boundary reassembly, the overflow path, numeric PII copied verbatim, the identifier-key numeric carve-out, ULID shape trust, PII in property names, `url` in the carve-out, root-key collision, and the context-bound passport exclusion.

The latest finding is a different kind. It does not identify a defect in what was built. It challenges a decision the governing spec already made explicitly:

> **Regex-only — NER is deliberately NOT used at Layer 3**
> — `docs/PII_SCREENING_AND_LOG_REDACTION_SPEC.md` §Layer 3

Codex's finding:

> **[high] Layer 3 permits unstructured PII through unchanged.** `redactString` applies only `PII_PATTERNS`, while the module explicitly excludes NER and `patterns.ts` identifies names and addresses as regex non-goals. Therefore an error message, URL, or future log field containing a patient name or address reaches the destination unchanged if Layers 1 and 2 are bypassed — the exact failure premise Layer 3 claims to cover.
>
> **Recommendation:** Before shipping, either add destination-safe detection for required unstructured PII classes, or enforce and test a strict boundary that prevents all user-controlled free text, errors, and URLs from reaching this stream.

Closing this inline would mean either reversing a ratified spec decision on my own authority, or dismissing a HIGH finding on my own authority. Per hard-floor item 6 and the PR #10 / PR #11 worked example, neither is mine to do.

---

## The substance of the disagreement

Codex is factually correct that Layer 3 does not detect names or addresses. That is not in dispute and is not a surprise — it is what the spec says.

The real question is whether that is a *gap* or a *scope boundary*.

**The case that it is a scope boundary.** The five-layer model assigns unstructured-PII detection to Layers 1 and 2, which do run local NER (`ner.ts`, wink-nlp). Layer 3's job is the logging path specifically, where what actually leaks is structured identifiers appearing in serializer output, error messages, and future call sites. The spec's stated reasons for excluding NER there are cost (synchronous inference per log record on a high-volume hot path) and precision (PERSON/GPE/ORG would fire on the operational vocabulary logs are made of — tenant identifiers, role names, provider names, module names — destroying incident correlation while protecting nothing).

**The case that it is a gap.** Layer 3 is described as a last line of defense whose premise is that Layers 1 and 2 already failed. If that premise holds, then the classes Layers 1 and 2 uniquely covered are exactly the classes now unprotected. There is also one surface Layers 1 and 2 genuinely do *not* cover: the three async-consult routes encrypt client-side per I-026, so no server-side layer inspects that plaintext at all.

---

## Options

### Option A — Ship as-is; record the residual

Merge PR #279 with Layer 3 structured-identifier-only. Add the unstructured-PII residual explicitly to the spec and the Pilot 1 risk register.

- **For:** PR #279 is strictly better than `main` — it closes many verified leaks. Blocking it does not make unstructured PII safer; it leaves the structured leaks open too.
- **Against:** records a risk without acting on it. The "future call site logs a name" vector stays live and undetected.

### Option B — Add NER to Layer 3 before shipping

- **For:** closes the class directly, and is the most literal reading of "last line of defense".
- **Against:** contradicts the ratified spec rationale on both counts. Pays model inference per log line on the hot path, and by the spec's own analysis would redact `Telecheck-US`, role names, provider names and module names — degrading exactly the diagnostics an incident needs. Changes Layer 3's cost class and failure mode.

### Option C — Ship as-is, and enforce a structural no-free-text-in-logs boundary as scoped follow-on work

Merge PR #279. Separately add a machine-enforced control — lint rule, typed logging API, or CI inspection of log call sites — that rejects raw user-controlled free text and unsafe error construction at the point of logging, plus scrubbing in the `err` serializer.

- **For:** addresses the actual vector (a future call site logging free text) *deterministically*, where NER addresses it probabilistically. Preserves Layer 3's value as cheap and always-on. The Sprint 1.2a log-surface audit already found no current call site logs raw free text, so this converts an audit finding into an enforced invariant rather than trusting it stays true.
- **Against:** the enforcement work does not exist yet, so there is a window between merge and its landing. Does not retroactively cover anything a third-party dependency logs.

---

## Claude's recommendation

**Option C.**

Layer 3's value comes from being cheap, deterministic and always-on. NER would trade all three for probabilistic coverage of a class that, per the log-surface audit, is not currently present in any log record. The vector Codex correctly identifies is a *future* call site — and a future call site is far better addressed by a control that fails the build than by a classifier that might catch the value at runtime after it has already been constructed.

Option A is insufficient on its own because it records the risk without acting on it. Option B is the wrong instrument: it puts a probabilistic detector on the hot path to solve a problem that a deterministic build-time check solves better, and it does so at the cost of the operational vocabulary that makes logs useful during the incident they exist for.

Two things should be explicit in whatever is ratified, because they are true under every option:

1. **Layer 3 must not be represented as compensating for the async-consult client-side screening gap.** Those fields are ciphertext at rest and in logs; no log-path layer can help. That remains a separate Pilot 1 startup-authorization gate (Track 4).
2. **The spec's claim that no current log call site carries free text is an audit assertion, not an enforced invariant.** Option C is precisely what converts it into one.

---

## Ratifier decision

*(to be completed by Evans + Engineering Lead)*

**Decision:**

**Rationale:**

**Recorded in:** Promotion Ledger entry —
