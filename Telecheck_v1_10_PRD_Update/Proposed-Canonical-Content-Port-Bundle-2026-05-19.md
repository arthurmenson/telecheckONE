# PROPOSED Canonical Content Port Bundle — lockstep PR-A2-class commit plan (2026-05-19)

**Status:** PROPOSED — awaiting Evans's explicit ratification of (a) cross-PR OQ3 Option A and (b) SI-017-OQ-MISMATCH A2+B2+C per the two Decision Memos on `spec/oq3-decision-memo-and-cross-pr-resolution-2026-05-19`.
**Authority:** none — this bundle is preparatory only. Application requires Evans's chat-message ratification per CLAUDE.md hard-floor item 3.
**Purpose:** enumerate every file edit, every version bump, every Promotion Ledger entry, and every Codex verification scope that lands in the single lockstep PR-A2-class commit IF Evans ratifies both Decision Memos.

---

## 1. Ratifications required (gating)

Two ratifier confirmations from Evans gate this entire bundle:

1. **Cross-PR OQ3 Option A** — per `Decision-Memo-Cross-PR-OQ3-Trust-Boundary-Equality-Guard-Option-A-Adopted-2026-05-19.md`. Adopts canonical invariant **I-032** + `tenant_guc_mismatch` rejection code on the four amended SECURITY DEFINER procedures + new Cat B audit event `security.security_definer_tenant_guc_mismatch`.
2. **SI-017-OQ-MISMATCH A2+B2+C** — per `Decision-Memo-SI-017-OQ-MISMATCH-A2-B2-C-Adopted-2026-05-19.md`. Adopts separate Cat A `identity.session_jwt_tenant_id_mismatch` event partitioned by session-row-tenant + merge-blocking regression test.

**Additional ratifications already at R5 APPROVE pending ceremony** (these don't depend on the OQs but ride the same lockstep PR):

3. **SI-018** (audit-chain partition rule) — PR #14 Codex R5 APPROVE; Decision Brief authored at `Decision-Brief-SI-018-Audit-Chain-Partition-Rule-2026-05-19.md`. Two-tier hybrid partition (P1 patient-bound + P2 tenant-governance).

**Authored after explicit ratification** (Claude will draft Decision Briefs for these once OQ3 + OQ-MISMATCH ratify):

4. **SI-017** Decision Brief — depends on A2+B2+C resolution.
5. **P-018a** Decision Brief — depends on OQ3 Option A resolution.
6. **P-019a** Decision Brief — depends on OQ3 Option A resolution.
7. **P-021a** Decision Brief — depends on OQ3 Option A resolution.

## 2. Order of operations (single lockstep commit)

The canonical-content-port commit must satisfy the **lockstep invariant** (Registry bumps in the same commit that lands the underlying canonical content). All edits below land in ONE commit on ONE branch:

**Branch name:** `spec/canonical-content-port-si018-si017-supersessions-2026-05-XX` (date filled in at landing).

**File edits in commit order** (logical ordering for reviewer clarity; git groups them all in one tree-write):

### 2.1 Contracts Pack INVARIANTS — `Telecheck_Contracts_Pack_v5_00_INVARIANTS.md`

- Bump header: **v5.2 → v5.3** (or v5.3 → v5.4 if v5.3 is already taken; verify against current state at commit time).
- Add **I-032** with full text per `Proposed-INVARIANTS-Amendment-I-032-2026-05-19.md`.
- Update §"Invariant inventory" table to include I-032.

### 2.2 Contracts Pack AUDIT_EVENTS — `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md`

- Bump header: **v5.3 → v5.5** (single ceremony landing 3 new action IDs across SI-018 + SI-017 ratifications).
- Add **3 new action IDs** per `Proposed-AUDIT_EVENTS-Amendments-2026-05-19.md`:
  - Cat B `security.security_definer_tenant_guc_mismatch` (I-032)
  - Cat B `identity.session_liveness_check_failed` (SI-017)
  - Cat A `identity.session_jwt_tenant_id_mismatch` (SI-017 Sub-decision 4.5)
- Add §"Hash-chain partition rule" canonical text (the SI-018 contribution) per `Proposed-AUDIT_EVENTS-Amendments-2026-05-19.md` §2.

### 2.3 Promotion Ledger — `Telecheck_Promotion_Ledger.md`

- Append (NEVER edit existing):
  - **Entry P-024** — SI-018 ratification (partition rule) — full text per `Proposed-Promotion-Ledger-Entry-P-024-SI-018-2026-05-19.md` (to be authored).
  - **Entry P-025** — SI-017 ratification (Phase 2 F-3 + Sub-decision 4.5 mismatch path) — full text per future Proposed file.
  - **Entry P-018a** — SI-008 supersession with I-032 step 0 — full text per future Proposed file.
  - **Entry P-019a** — SI-009 supersession with I-032 step 0 — full text per future Proposed file.
  - **Entry P-021a** — SI-005 supersession with I-032 step 0 + procedure-validated rotation-scope partition rule — full text per future Proposed file.
- P-NUM assignments: per `Telecheck_Master_Bundle FINAL US REGION BASELINE/Telecheck_Artifact_Registry_v2_10.md` §"Next-available P-NUM" — Claude will verify P-024/P-025 are still available at commit time; supersession entries use P-NUM-a notation per established pattern.

### 2.4 Artifact Registry — `Telecheck_Artifact_Registry_v2_10.md`

- Bump header: **v2.12 → v2.13** (single bump covering all of §2.1–§2.3's content + §2.5–§2.8 supersession amendments).
- Update §3 row 64 (or equivalent) to reflect AUDIT_EVENTS v5.5 + INVARIANTS v5.3 destination versions.
- Append §8 changelog row.

### 2.5 SI-017 source file — apply Sub-decision 4.5

- File: `Telecheck_v1_10_PRD_Update/SI-017-Phase-2-F3-JWT-Liveness-Canonical-Middleware-GUC-Model.md`
- Insert new Sub-decision 4.5 (mismatch path) between current Sub-decision 4 and Sub-decision 5 per `Proposed-SI-017-Sub-decision-4.5-Mismatch-Path-2026-05-19.md`.
- Update §5 Cross-artifact impact: AUDIT_EVENTS shows 2 new action IDs (was 1).
- Update §7 regression tests: add new merge-blocking test per Sub-decision 4.5 §C.
- Status block: remove `+ EVANS-SI-017-OQ-MISMATCH-RATIFIER-DECISION`; add `+ A2+B2+C ratified per Decision Memo 2026-05-19`.

### 2.6 P-018a source file — apply I-032 STEP 0

- File: `Telecheck_v1_10_PRD_Update/P-018a-Supersession-SI-008-Actor-Identity-Source-Amendment.md`
- Update §2 Sub-decision 8 (procedure design) to include STEP 0 equality guard per `Proposed-SECURITY-DEFINER-Procedure-Amendments-2026-05-19.md` §SI-008.
- Add `tenant_guc_mismatch` to the rejection code set.
- Status block: remove `+ EVANS-CROSS-PR-OQ3-RATIFIER-DECISION`; add `+ I-032 ratified per Decision Memo 2026-05-19`.

### 2.7 P-019a source file — apply I-032 STEP 0

- File: `Telecheck_v1_10_PRD_Update/P-019a-Supersession-SI-009-Actor-Identity-Source-Amendment.md`
- Update §2 Sub-decision 3 (procedure design) to include STEP 0 equality guard per `Proposed-SECURITY-DEFINER-Procedure-Amendments-2026-05-19.md` §SI-009.
- Add `tenant_guc_mismatch` to the rejection code set.
- §2 Trust-posture description: simplify (no longer needs to lay out Option A vs Option B; Option A is now canonical via I-032).
- Status block: remove `+ EVANS-CROSS-PR-OQ3-RATIFIER-DECISION`; add `+ I-032 ratified per Decision Memo 2026-05-19`.

### 2.8 P-021a source file — apply I-032 STEP 0

- File: `Telecheck_v1_10_PRD_Update/P-021a-Supersession-SI-005-Actor-Identity-Source-Amendment.md`
- Update §2 Sub-decision 1 (record_consult_clinician_decision) to include STEP 0 equality guard per `Proposed-SECURITY-DEFINER-Procedure-Amendments-2026-05-19.md` §SI-005-record + STEP 0 also added to Sub-decision 2 (rotate_consult_clinician_decision_kms) per §SI-005-rotate.
- Add `tenant_guc_mismatch` to the rejection code set (now extends the 7-code → 10-code → 11-code → 12-code set: 7 original + 3 from Sub-decision 4 rotation-scope + 1 new for I-032 + 1 = 12 total; verify exact count at commit time).
- §2 Trust-posture description: simplify (no longer needs to lay out Option A vs Option B).
- §4 Open Question 3: mark RESOLVED pointing to Decision Memo + I-032.
- Status block: remove `+ EVANS-OQ3-RATIFIER-DECISION`; add `+ I-032 ratified per Decision Memo 2026-05-19`.

## 3. Codex verification scopes (post-ratification rounds)

After the lockstep commit lands but BEFORE merging to main, run Codex verification on the branch. Three scopes, can be run in parallel:

### Scope A: INVARIANTS + AUDIT_EVENTS amendment integrity

> Verify that the I-032 invariant text is consistent with the four procedures' STEP 0 implementations; that the three new AUDIT_EVENTS action IDs are correctly categorized (Cat B / Cat B / Cat A); that the hash-chain partition rule canonical text matches SI-018's two-tier hybrid (P1 patient-bound + P2 tenant-governance) as ratified at PR #14 R5 APPROVE; that I-032's partition rule for the security.security_definer_tenant_guc_mismatch event correctly keys on current_setting('app.tenant_id', true) [GUC-side] rather than the caller-supplied p_tenant_id [claim-side]; that SI-017 Sub-decision 4.5's identity.session_jwt_tenant_id_mismatch correctly keys on auth.sessions.tenant_id [session-row-side] per B2.

### Scope B: SECURITY DEFINER procedure amendment integrity

> Verify that all four SECURITY DEFINER procedure specs (P-018a SI-008, P-019a SI-009, P-021a SI-005 record + P-021a SI-005 rotate) have STEP 0 equality guard as the FIRST validation step (before idempotency, advisory lock, state read) per I-032; that tenant_guc_mismatch is in each procedure's rejection code set; that the rejection emits the audit event via application-layer call site post-rejection (not in-procedure); that P0 ops alert is required on tenant_guc_mismatch.

### Scope C: Promotion Ledger entry integrity

> Verify that the five new Promotion Ledger entries (P-024 SI-018, P-025 SI-017, P-018a, P-019a, P-021a) are append-only (no edits to prior entries); that destination Registry version v2.13 is consistent across entries; that AUDIT_EVENTS destination v5.5 is consistent; that INVARIANTS destination v5.3 is consistent; that the Codex pre-ratification trail is captured in each entry's "Codex pre-ratification status" section; that the lockstep invariant is honored (this commit lands both the Registry bump AND the underlying canonical content).

## 4. Pre-ratification preparation status

| Artifact | Status | Location |
|---|---|---|
| Cross-PR OQ3 Decision Memo | PROPOSED — awaiting Evans's ratification | `Decision-Memo-Cross-PR-OQ3-Trust-Boundary-Equality-Guard-Option-A-Adopted-2026-05-19.md` |
| SI-017-OQ-MISMATCH Decision Memo | PROPOSED — awaiting Evans's ratification | `Decision-Memo-SI-017-OQ-MISMATCH-A2-B2-C-Adopted-2026-05-19.md` |
| This Canonical Content Port Bundle | PROPOSED — preparatory | `Proposed-Canonical-Content-Port-Bundle-2026-05-19.md` |
| I-032 INVARIANTS amendment text | TO AUTHOR | `Proposed-INVARIANTS-Amendment-I-032-2026-05-19.md` |
| AUDIT_EVENTS amendments text | TO AUTHOR | `Proposed-AUDIT_EVENTS-Amendments-2026-05-19.md` |
| SECURITY DEFINER procedure amendments | TO AUTHOR | `Proposed-SECURITY-DEFINER-Procedure-Amendments-2026-05-19.md` |
| SI-017 Sub-decision 4.5 text | TO AUTHOR | `Proposed-SI-017-Sub-decision-4.5-Mismatch-Path-2026-05-19.md` |
| SI-017 Decision Brief | TO AUTHOR | `Decision-Brief-SI-017-Phase-2-F3-JWT-Liveness-2026-05-19.md` |
| P-018a Decision Brief | TO AUTHOR | `Decision-Brief-P-018a-SI-008-Supersession-2026-05-19.md` |
| P-019a Decision Brief | TO AUTHOR | `Decision-Brief-P-019a-SI-009-Supersession-2026-05-19.md` |
| P-021a Decision Brief | TO AUTHOR | `Decision-Brief-P-021a-SI-005-Supersession-2026-05-19.md` |
| Promotion Ledger entries (5 new) | TO AUTHOR | `Proposed-Promotion-Ledger-Entries-2026-05-19.md` |

Claude will author all TO-AUTHOR files in subsequent commits on this branch. Files are PROPOSED text only — application to canonical files happens ONLY after Evans's explicit ratification of OQ3 + OQ-MISMATCH.

## 5. One-click application protocol (for after ratification)

Once Evans confirms both Decision Memos, the autonomous-work loop can execute:

```
git checkout -b spec/canonical-content-port-si018-si017-supersessions-2026-05-XX
# Apply each Proposed-*.md to its target canonical file per §2 above.
# Single commit; lockstep invariant honored.
# Push, run Codex scopes A+B+C in parallel, surface verdicts.
# On all-APPROVE: merge to main with --no-ff.
# Append cockpit Addendum 53 capturing the canonical content port.
```

Estimated time from "ratify" message to merged main: ~30-45 minutes (mostly Codex round-trips).

---

— Claude (Opus 4.7, 1M context), PROPOSED Canonical Content Port Bundle authored 2026-05-19 under Evans's "do all you can do while I'm away" non-ratification autonomous-work authorization.
