# Engineering Review Request — Layer 5 backup redaction: recall-first redaction vs. restorable pseudonymisation

**Date:** 2026-09-08 · **Raised by:** Claude (developer seat) · **Trigger:** Codex round 2 on telecheck-app PR #311 (Sprint 1.2c, Layer 5) · **Status:** OPEN — hard-floor item 6 STOP; R3 on the escalated items is BLOCKED until the ratifier decides. In-scope defects from the same round are being closed on the branch in parallel (see §4).

## 1. What was ratified

`docs/PII_SCREENING_AND_LOG_REDACTION_SPEC.md` §Layer 5 — Backup redaction:

> **How:** wrap `pg_dump` output through a redaction pass that catches any regex patterns in dumped rows before the dump hits durable storage. Rejected patterns get replaced with `[REDACTED:PII]` in the dump; original DB rows are separately audit-logged for incident response.
> **Nuance:** this layer degrades Pilot 1 backup fidelity slightly (redactions in the dump), which is acceptable because Pilot 1 has no PHI worth preserving faithfully anyway.

Success metric (§Success metrics): "Layer 5 backup redaction: 100% recall verified against pg_dump adversarial pass." Restorability of the redacted dump into the constrained schema is **not** a stated requirement; fidelity loss is explicitly accepted.

## 2. What PR #311 built, and what Codex found

R1 established that a regex pass over serialized dump text both misses escaped PII and corrupts SQL; the branch now scrubs only inside decoded values (COPY fields with text-format escapes decoded, SQL string literals, JSON via the JSON-aware scanner with the whole library, numeric values matching a pattern replaced by `0`, printable bytea scrubbed as text), refuses `pg_dump` options that bypass the pipe, and publishes atomically. A real `pg_dump → scrub → psql` round-trip test restores into a scratch database.

R2 (head `7ac0238`) returned six HIGH + one MEDIUM. They split into two classes:

**(a) In-scope implementation defects — closeable inline, being closed now on the branch:**
- bundled short options (`-vf/tmp/raw.sql`, `-vFc`, `-vZ9`) pass the prefix-based guard; PostgreSQL parses bundled options → raw unredacted file on disk;
- a quoted identifier containing an apostrophe (`public."o'neil"`) puts the scanner into literal mode and the following COPY block is never recognised;
- a doubled quote inside an E-literal (`E'it''s …'`) ends escape-literal handling early;
- valid JSON **scalar** strings (fully or partly `\u`-escaped) are not routed through the JSON path → either survive or become invalid JSON;
- Layer 3's numeric-preservation exemptions (`time`, `responseTime`, …) still apply in backup mode, where stored JSON has no log-field provenance;
- `--inserts` / `--column-inserts` / `--attribute-inserts` / `--rows-per-insert` are accepted although INSERT-serialised values are not type-aware-screened.

**(b) Findings that require a scope decision — the subject of this ERR:**
- **Restorability into the actual schema.** Replacing matching values with a token (or `0`) violates `accounts` CHECK constraints on phone/email format and UNIQUE constraints (two distinct emails → one token; two matching bigint keys → both `0`), so a full-schema restore fails at PK/UNIQUE creation and dependent FKs cannot be restored. Codex's recommendation: *"Define schema-aware replacements that preserve formats, uniqueness and PK/FK relationships, or fail before publication when unsupported."*
- **bytea handling from column metadata** rather than content shape (a text value that looks like `\x3125551212` is mis-read as binary and passes unscreened; a real bytea with a NUL followed by an email survives).

Both go beyond "a redaction pass … replaced with `[REDACTED:PII]` … fidelity loss acceptable". Format-preserving, uniqueness-preserving, key-consistent replacement is a pseudonymisation engine, not a redaction pass. Column-metadata-driven typing is achievable from the dump itself (the CREATE TABLE statements precede the COPY blocks) and is smaller, but it is still a design change to how Layer 5 decides what a value is.

**Also surfaced (gap, not a Codex finding):** the spec sentence "original DB rows are separately audit-logged for incident response" is not implemented by #311 and its meaning is unclear (which rows? where? that audit would itself hold the PII). It needs a ratifier reading either way.

## 3. Options

### Option A — Spec as written, with dump-derived column typing (recall-first; restore is diagnostic)
- Keep the ratified contract: 100% recall against the library; fidelity loss accepted; a redacted dump is a **diagnostic** artifact, never a recovery path.
- The scrubber learns column types from the dump's own `CREATE TABLE` statements and applies per-type policy in COPY blocks: `bytea` → explicit policy (scrub printable text payloads, otherwise pass through, documented); `json`/`jsonb` → JSON path with **no** Layer 3 numeric exemptions and scalar-string handling; numeric/identity/key columns (PK, UNIQUE, FK-referenced, `serial`/`bigint` ids) → **never** scrubbed (a bare integer matching a phone regex is a false positive in every real schema; keys are preserved so relationships survive); text → whole library.
- Restore guidance: restore into a scratch database with `--data-only`-style loading under `SET CONSTRAINTS ALL DEFERRED` / constraints dropped, documented as diagnostic; the round-trip test covers the **real migrated schema** with constrained `accounts` rows and reports which constraints a redacted dump cannot satisfy (asserting the known set, so a new violation is visible).
- Reject all INSERT-producing `pg_dump` options; parse and reconstruct an explicit option allowlist.
- Reading of "original DB rows are separately audit-logged": interpret as the **scrub manifest** (table, column, row count, pattern ids redacted — no values), not a copy of the rows; amend the sentence.
- Cost: the in-scope fixes plus DDL parsing for types/keys (~1–2 days), spec wording amendment for the manifest reading.

### Option B — Restorable pseudonymisation (format-, uniqueness- and key-preserving)
- Deterministic, keyed replacement per value (HMAC-derived synthetic email / E.164 phone / SSN-shaped tokens, key-consistent across tables), so the dump restores into the real schema with constraints intact.
- Cost: a pseudonymisation engine with its own key management (the HMAC key is itself sensitive: with it, tokens are re-linkable), per-pattern format generators, collision handling, and a full-schema restore suite. Weeks, not days; and it re-opens the residual-risk analysis (pseudonymised data is still personal data under most regimes).
- Deal-breaker check: this is Pilot 2 compliant-substrate territory per the spec's own non-goals ("These layers do NOT replace Pilot 2's compliant substrate").

### Option C — Backups are encrypt-only; Layer 5 redaction withdrawn
- `pg_dump | age` with the option guard and atomic publish; no scrub. Rely on Layer 3 (logs), Layer 4 (vendor egress), incident capture (`pii-scrub --mode log`) and the env-purge for the durable-storage risk; accept that a backup is raw PHI-substrate-grade material protected by encryption and key custody only.
- Cost: smallest; spec §Layer 5 amended to "encryption + access control, no redaction"; the incident-response runbook's capture path keeps its scrub. Deal-breaker check: contradicts the ratified rationale ("durable storage is the highest-consequence leak vector … if backups are ever shared for troubleshooting, they must be clean").

## 4. Claude's recommendation

**Option A.** It is the ratified contract made precise: recall-first, fidelity loss accepted, restore diagnostic. Deriving column types and key columns from the dump's own DDL removes the bytea ambiguity and the key-collision failure without inventing a pseudonymisation engine, and "keys are never scrubbed" is the right call on the merits — a bare integer is not identifying on its own and preserving it keeps the diagnostic dump navigable. The manifest reading of the "audit-logged" sentence keeps the artifact free of the values it exists to remove. Option B is the correct long-term shape for Pilot 2's compliant substrate and should be recorded there, not built inside Pilot 1's synthetic-only boundary. Option C gives up the layer's stated purpose.

**Independent of the decision,** the class-(a) defects are being closed on the branch now (bundled options, quoted identifiers, E-literal doubled quotes, JSON scalar strings, Layer 3 numeric exemptions off in backup mode, INSERT options rejected). No merge until the ratifier decides.

## 5. Ratifier decision

_Pending — Evans + Engineering Lead + CDM owner. Both recommendations (Claude above; Codex Pass 1 / Pass 2 below) are surfaced side by side in chat per the dual-recommendation process._

### Codex Pass 1 (source-first, independent)
_pending_

### Codex Pass 2 (contrast-and-synthesize)
_pending_
