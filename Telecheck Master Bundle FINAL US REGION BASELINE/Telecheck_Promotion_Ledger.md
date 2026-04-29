# Telecheck — Promotion Ledger

**Version:** 1.0
**Status:** Canonical record
**Owner:** Product (Telecheck)
**Parent documents:** Telecheck Artifact Registry v2.4
**Companion documents:** All artifacts named in promotion records below
**Format:** Markdown (must remain markdown — append-only ledger; status changes by appending, not editing)

---

## Purpose

This ledger records every artifact that the user has explicitly asked to be promoted to canonical status. It exists alongside the Artifact Registry (which records *what is canonical*) to record *what the user requested* and *when*.

The two documents serve different purposes:

| Document | Records | Source of authority |
|---|---|---|
| **Artifact Registry** | What is canonical right now | Registry's own §3 inventory |
| **Promotion Ledger (this document)** | What the user explicitly asked to be promoted, when, and what was promoted in response | User instruction, transcribed into the ledger entry |

Why both exist: in long-running projects with many sessions, the Registry can show that something is canonical without anyone remembering whether it was canonicalized through a deliberate user request, an inferred decision, or a session-default. The Promotion Ledger preserves the *intent trail* — every promotion that the user explicitly authorized is on record here.

---

## Operating rules

1. **Append-only.** Once a promotion entry is recorded, it is never edited or deleted. Errors are corrected by appending a new entry that references and supersedes the prior one.
2. **One entry per user request.** A single user instruction ("promote these documents") becomes one entry, regardless of how many artifacts that instruction promoted.
3. **Each entry records:** the date, the verbatim user instruction (or close paraphrase), the artifacts promoted, the Registry version that absorbed the promotion, and any related decisions ratified at the same time (such as ADRs).
4. **The Registry is updated in lockstep.** Every promotion entry corresponds to a Registry version bump (e.g., this entry corresponds to Registry v2.3 → v2.4).
5. **Reverse chronological order.** Most recent entry at the top.

---

## Promotion entries

### Entry P-007 — 2026-04-27 — US Region Migration Cycle U-004 (final packaging)

**User instruction (verbatim):** "Authorized: open U-004."

**Cycle:** U-004 (final cycle of US Region Migration workstream)

**Cycle scope:** Metadata-only (primary), packaging (secondary). No substantive document edits.

**Source bundle:** `Telecheck_Master_Bundle_U003_R2_FOR_CODEX_REVIEW.zip` (md5 `09c9941fd3360806e5a47407dcc5c42f`; U-003 Codex-verified PASS)

**Cycle outcome:** Round 1 Codex DID NOT PASS (3 findings). Round 2 Codex DID NOT PASS (3 findings; Round 2 broader-scope scan was scoped to one notation class only and missed parallel filename-class defects). Round 3 in progress at time of this ledger entry's most recent update; Round 3 fixes the F-U004-R2-01/02/03 defects + addresses both notation classes per F-U004-R2-self-01 methodology lesson.

**Round-by-round verification target audit trail:**
- Round 1 final bundle: `Telecheck_Master_Bundle_FINAL_US_REGION_MIGRATION.zip` (md5 `e8c446817402bdc39f56ba957775762c`) — Codex DID NOT PASS (3 findings: F-U004-01/02/03)
- Round 2 final bundle: `Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip` (md5 `82714950f37bcc7a8b91eb8937016c1f`) — Codex DID NOT PASS (3 findings: F-U004-R2-01/02/03); bundle was BASELINE-renamed from MIGRATION per framing-correction directive
- Round 3 final bundle: `Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip` (md5 `1426520f322647ba174bd08ea03836ec`) — Codex Round 3 verification result returned the same 3 R2 findings still present; Round 4 author-gate verification determined the Round 3 bundle on disk DID have the fixes correctly persisted, suggesting Codex was evaluating an earlier round's bundle, not the Round 3 bundle. User issued Round 4 directive for full control-plane cleanup pass anyway.
- Round 4 final bundle: `Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip` (md5 `89a7057534745a064d7639140fff378e`) — Codex Round 4 verification returned 3 narrow metadata findings (F-U004-R4-01 HIGH stale Migration filename refs in Registry §7 line 366; F-U004-R4-02 MEDIUM Release Notes methodology count 11 vs Validation Report 13; F-U004-R4-03 MEDIUM handoff packet not aligned to actual final bundle state).
- Round 5 final bundle: `Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip` (md5 `189a1fc7da2fc3c4297270fee8a3cb73`) — Codex Round 5 verification returned 3 narrow metadata findings (Registry §3 row 64 stale P-011 claim; ADI §3 stale P-011 claim; Validation Report §11 closing statement stale "Round 4 follows"). Bundle was structurally clean for Round 5 file-level defects; remaining issues were P-NNN current-truth claims missed in Round 5 scan + stale Round-N-follows references in Validation Report closing.
- Round 6 final bundle: `Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip` (md5 recorded in `CODEX_FINAL_VERIFICATION_HANDOFF_PACKET.md` outside the bundle, to avoid self-reference loop) — Pending Codex Round 6 verification. Round 6 fixed all 3 Codex Round 5 findings + 1 broader-scope catch (Validation Report §11 "rebuilt Round 4 bundle" parallel reference) + corrected stale Round 5 doc-control entry.

**Files newly authored in U-004:**
- `Telecheck_Project_Upload_Manifest_v2.md` — mechanically generated from filesystem inventory
- `TELECHECK_RELEASE_NOTES_US_REGION_BASELINE.md` — mechanically authored from cycle close ledgers (renamed from `..._US_REGION_MIGRATION.md` in U-004 Round 2 per framing-correction directive)
- `TELECHECK_VALIDATION_REPORT_US_REGION_BASELINE.md` — final validation evidence (renamed from `..._US_REGION_MIGRATION.md` in U-004 Round 2 per framing-correction directive)

**Files demoted to historical (kept in bundle):**
- `TELECHECK_RELEASE_NOTES_FINAL_REMEDIATED.md`
- `Telecheck_Project_Upload_Manifest_Post_Remediation.md`

**Files edited in place (no rename, no version bump):**
- `Telecheck_Artifact_Registry_v2_9.md` (§7 final counts populated; pre-existing row-count discrepancies corrected)
- `Telecheck_Active_Document_Index_v1_0.md` (bundle reference finalized)
- `Telecheck_Promotion_Ledger.md` (this entry + P-006, P-005, P-004 appended)

**Final bundle:** `Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip` — **75 markdown files** (mechanically counted from filesystem; renamed from `..._FINAL_US_REGION_MIGRATION.zip` in U-004 Round 2 per framing-correction directive)

**Findings:**
- F-U004-01 (LOW; pre-existing; non-blocking): Promotion Ledger gap — actual ledger contains P-001..P-003 but Registry §8 v2.8 changelog row claims P-009..P-011 added. Per user ruling 2026-04-27: append U-001..U-004 entries sequentially from actual ledger reality (this entry P-007 + P-006 + P-005 + P-004); do not retroactively fabricate the missing P-004..P-008 historical entries; document discrepancy in validation report. Recommended follow-up: separate ledger-reconciliation cycle if desired.
- F-U004-02 (LOW; pre-existing; corrected): Registry §7 row counts had pre-existing discrepancies (Engineering 14→12, Operations 5→4, Slice 18→17, Cross-cutting 4→5) and 7 files (ADI, Boot Sequence, Manifests×2, Release Notes×2, Validation Report) were not represented in any §7 row. Corrected mechanically in §7.
- F-U004-R2-01 (HIGH; Codex Round 2; fixed in Round 3): Boot Sequence lines 15–16 contained stale current-truth filename pointers `Telecheck_Engineering_Handoff_Build_Guide_v1_2.md` and `Telecheck_Master_Platform_PRD_v1_8.md`. Round 2's broader-scope scan was scoped to version-name notation (`v1.X`) but missed filename notation (`*_v1_X.md`). Fixed in Round 3.
- F-U004-R2-02 (MEDIUM; Codex Round 2; fixed in Round 3): Validation Report Section 6 PASS claim was inaccurate against the actual bundle in Round 2 (because F-U004-R2-01 defects existed). Section 6 rewritten in Round 3 with honest 3-round history.
- F-U004-R2-03 (MEDIUM; Codex Round 2; fixed in Round 3): Release notes was internally inconsistent in Round 2 — line 9 said "Pending Codex final verification" while line 40 cycle history table said "Codex PASS after Round 2". Self-inflicted by projecting outcome rather than reflecting state at write time. Fixed in Round 3 by updating line 40 to "Pending Codex final verification".
- F-U004-R2-self-01 (LOW; methodology; binding): Round 2 broader-scope scan was scoped to one notation class only. Methodology learning #12 (new): scan must cover all notation classes for the same canonical reference (filename, version-name, abbreviation), not only the notation class the named defect used.
- F-U004-R2-self-02 (LOW; methodology; binding): Round 2 release notes prematurely projected verification outcome. Methodology learning #13 (new): release notes must reflect actual state at write time, not projected verification outcome (same class as "manifest from filesystem, not projection").

**Standing §10 decision-owner ruling (2026-04-27, binding for remainder of workstream):** Mechanical/metadata/packaging defects fixed immediately without permission step between rounds; escalation only on substantive scope/architecture/legal/conflicting-truth/disputed-fact conditions. Number each pass honestly; continue until Codex returns clean PASS.

**Promotion authorized by:** User (verbatim instruction recorded above)

**Promotion executed by:** Product (Telecheck), this session

---

### Entry P-006 — 2026-04-27 — US Region Migration Cycle U-003 (ops/readiness/governance propagation)

**User instruction (verbatim):** "Authorized. Open U-003."

**Cycle:** U-003 (operations / readiness / governance / reviewer-facing docs propagation)

**Cycle scope:** Architecture (primary), substance (secondary), metadata-only (tertiary).

**Source bundle:** `Telecheck_Master_Bundle_U002_FINAL_FOR_CODEX_VERIFICATION.zip` (md5 `7f3e2e8aaff0a8d284d4dde352fb7380`; U-002 Codex-verified PASS)

**Cycle outcome:** Codex Round 2 PASS 2026-04-27.

**Final bundle:** `Telecheck_Master_Bundle_U003_R2_FOR_CODEX_REVIEW.zip` (md5 `09c9941fd3360806e5a47407dcc5c42f`)

**P0 — version-bumped (3 files):**
- `Telecheck_Engineering_Handoff_Build_Guide_v1_2.md` → `_v1_3.md`
- `Telecheck_Operational_Readiness_Todo_v1_4.md` → `_v1_5.md`
- `Telecheck_Ghana_Launch_Playbook_v1_1.md` → `_v1_2.md`

**P1 — in-place edits (6 files; no version bumps):**
- `CLAUDE_CODE_BOOT_SEQUENCE.md`
- `Telecheck_Reviewer_Brief_v1_0.md`
- `Telecheck_Contracts_Pack_v5_00_GLOSSARY.md`
- `Telecheck_Contracts_Pack_v5_00_INVARIANTS.md` (NEW invariant I-028)
- `Telecheck_Contracts_Pack_v5_00_CCR_RUNTIME.md`
- `Telecheck_Tenant_Threading_Addendum_v1_0.md`

**P2 — surgical edits (4 files):**
- `Telecheck_Contracts_Pack_v5_00_TYPES.md`
- `Telecheck_Sync_Video_Consult_Slice_PRD_v1_0.md`
- `Telecheck_Labs_Document_Interpretation_Slice_PRD_v1_0.md`
- `Telecheck_Market_Rollout_Cockpit_Slice_PRD_v1_0.md`

**P2 — no change with evidence-backed disposition (3 files):**
- `Telecheck_Contracts_Pack_v5_00_GOVERNANCE_CONTROLS.md`
- `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md`
- `Telecheck_Consent_Delegated_Access_Slice_PRD_v1_0.md`

**Findings:**
- F-U003-01 (HIGH; Codex Round 1) — P0 stale parent-doc/canonical pointers — Fixed Round 2 (15 line edits)
- F-U003-02 (MEDIUM; Codex Round 1) — P1/P2 stale System Architecture v1.1 pointers — Fixed Round 2 (4 line edits)
- F-U003-self-01 (LOW methodology) — partial-scope scan — Fixed; methodology binding for future cycles
- F-U003-self-02 (LOW methodology) — Codex findings are class evidence — Fixed (8 additional defects from broader-scope scan); methodology binding

**Promotion authorized by:** User (verbatim instruction recorded above)

**Promotion executed by:** Product (Telecheck), this session

---

### Entry P-005 — 2026-04-26 — US Region Migration Cycle U-002 (architecture/control-plane migration)

**User instruction (verbatim):** "Open U-002 with the explicit single-region us-east-1 plan."

**Cycle:** U-002 (architecture and control-plane migration to us-east-1 primary, us-west-2 cold DR)

**Cycle scope:** Architecture (primary), substance (secondary).

**Source bundle:** Working state from prior `FINAL_REMEDIATED` bundle (per Cycle 001 restoration of MARKET_LAUNCH and Update_Spec from `/mnt/project/`)

**Cycle outcome:** Codex Round 2 PASS 2026-04-26.

**Final bundle:** `Telecheck_Master_Bundle_U002_FINAL_FOR_CODEX_VERIFICATION.zip` (md5 `7f3e2e8aaff0a8d284d4dde352fb7380`)

**Files newly authored:**
- `Telecheck_ADR_Addendum_026.md` (ratifies us-east-1 / us-west-2 cold DR; supersedes ADR-025)

**Files renamed/version-bumped:**
- `Telecheck_Master_Platform_PRD_v1_8.md` → `Telecheck_Master_Platform_PRD_v1_9.md`
- `Telecheck_System_Architecture_v1_1.md` → `Telecheck_System_Architecture_v1_2.md`
- `Telecheck_Artifact_Registry_v2_8.md` → `Telecheck_Artifact_Registry_v2_9.md`

**Files restored from `/mnt/project/` (closes Cycle 001 F-001-01):**
- `Telecheck_Contracts_Pack_v5_00_MARKET_LAUNCH.md`
- `Telecheck_Contracts_Pack_v5_Update_Spec.md`

**Files edited in place (no version bumps):** ADR Addendum 020-025 (ADR-025 supersession marker), Active Document Index, Canonical Data Model, RBAC, Admin Backend, Forms Engine, Pharmacy + Refill, Design Implementation Contract, Unified Admin Sidebar.

**Findings:** Codex Round 1 returned 3 findings (HIGH/HIGH/MEDIUM). All fixed in Round 2. §10 Option A authorized 5-line mechanical completion of F-U002-R2-01.

**Promotion authorized by:** User

**Promotion executed by:** Product (Telecheck), this session

---

### Entry P-004 — 2026-04-26 — US Region Migration Cycle U-001 (impact analysis)

**User instruction (verbatim):** "Open U-001 to do the file-by-file impact analysis for the region change."

**Cycle:** U-001 (architectural impact analysis of moving from prior af-south-1 region pair to a US-primary region pair)

**Cycle scope:** Architecture impact analysis; produces no substantive document edits — feeds U-002/U-003/U-004 scope.

**Source bundle:** `Telecheck_Master_Bundle_FINAL_REMEDIATED.zip` (the prior metadata-remediation cycle bundle)

**Cycle outcome:** Closed (accepted with corrections by user). Cycle 001 closure (F-001-01: missing files MARKET_LAUNCH and Update_Spec) absorbed into U-002 scope.

**Cycle artifact:** Impact matrix produced inline in cycle session (not committed to bundle as a standalone file; consumed by U-002/U-003/U-004 directives).

**Findings raised:**
- F-U001-02 (manifest rebuild from filesystem) — deferred to U-004; addressed in P-007
- F-U001-03 (Ghana cross-border posture documentation) — addressed in U-002 (ADR-026 + Master PRD update) + U-003 (Ghana Launch Playbook v1.2 cross-border section + INVARIANTS I-028 + GLOSSARY entries + CCR_RUNTIME clarification)
- F-U001-05 (OR-302/OR-303 reframing) — addressed in U-003 P0 OR Tracker edits

**Promotion authorized by:** User

**Promotion executed by:** Product (Telecheck), this session

---

### Entry P-003 — 2026-04-25 — Project upload of P-002 artifacts

**User instruction (this session):**
> "Promote and upload to project. You can do this"

**Context:** Following Entry P-002 (the three-artifact promotion plus Registry v2.4 and the creation of this Promotion Ledger), the user instructed that the artifacts be uploaded to `/mnt/project/` so they persist as part of the canonical project corpus visible to future sessions.

**Action taken:** Five files copied from `/mnt/user-data/outputs/` to `/mnt/project/` with byte-identical checksums verified:

| File | Source | Destination | Checksum verified |
|---|---|---|---|
| Telecheck_Operational_Readiness_Todo_v1_1.md | /mnt/user-data/outputs/ | /mnt/project/ | ✓ |
| Telecheck_Future_Scope_USSD_AI_Bridge_v0_1.md | /mnt/user-data/outputs/ | /mnt/project/ | ✓ |
| Telecheck_ADR_Addendum_016_to_019.md | /mnt/user-data/outputs/ | /mnt/project/ | ✓ |
| Telecheck_Artifact_Registry_v2_4.md | /mnt/user-data/outputs/ | /mnt/project/ | ✓ |
| Telecheck_Promotion_Ledger.md | /mnt/user-data/outputs/ | /mnt/project/ | ✓ |

**Project state after upload:**
- Total files in `/mnt/project/`: 62 (was 57)
- Net change: +5 (the five files above)
- Registry v2.3 (Telecheck_Artifact_Registry_v2_3.md) is retained alongside v2.4; per Registry convention, superseded versions are not deleted. The user may choose to remove v2.3 from the project view if preferred.

**Caveat on persistence:** The write to `/mnt/project/` succeeded at the filesystem level. Whether these new files appear in the user's Claude project UI in future sessions depends on the project-sync mechanism Anthropic operates — that is outside this session's visibility. If a future session does not see these files in `/mnt/project/`, they remain available in `/mnt/user-data/outputs/` from this session and can be re-uploaded via the Claude project UI.

**Promotion authorized by:** User (verbatim instruction recorded above)

**Promotion executed by:** Product (Telecheck), this session

**Cross-reference:** This entry completes the deployment step initiated in Entry P-002. P-002 ratified the canonical status; P-003 records the propagation to project-persistent storage.

---

### Entry P-002 — 2026-04-25 — Three-artifact promotion + ADRs 018 and 019

**User instruction (this session):**
> "Promote these documents and keep record of documents I asked to be promoted"

**Context:** The session produced three new artifacts following the Adversarial Counsel Review, the Patient UI/UX Pressure Review, and the user's product decisions on language posture, lab interpretation timing, and broader-market strategy.

**Artifacts promoted to canonical:**

| Artifact | Version | Layer (per Registry §3) | Registry inventory row | Notes |
|---|---|---|---|---|
| Operational Readiness To-Do | v1.1 | Product truth | Row 6a | Live tracker — 52 active items (5 Tier 0, 13 Tier 1, 27 Tier 2, 7 Tier 3); 2 resolved (OR-105, OR-221). Status changes frequently; canonical version means "this is the tracker," not "the contents are frozen." |
| Future Scope: USSD + AI Bridge | v0.1 | Product truth (future-scope) | Row 6b | Concept document for Track B. Not implementation-ready. Future PRD work triggered when Track A reaches Limited Launch state (per Cockpit §4.3). |
| ADR Addendum 016–019 | v1.0 | Engineering truth | Row 13a | Reserves ADR-016 (AI model + provider, pending OR-003) and ADR-017 (data residency, pending OR-103). Ratifies ADR-018 and ADR-019. Merges into ADR Set v1.1 at next ADR Set revision. |

**Related ADRs ratified in same session (recorded in ADR Addendum 016–019):**

| ADR | Title | Effect |
|---|---|---|
| ADR-016 | AI model + provider decision | Reserved (pending OR-003) — number held to avoid renumbering later |
| ADR-017 | Data residency for Ghana launch | Reserved (pending OR-103) — number held to avoid renumbering later |
| ADR-018 | English-first launch posture | Accepted — Track A scoped to English; multilingual coverage carried to Future Scope: USSD + AI Bridge |
| ADR-019 | AI-first lab interpretation with explicit pending-review caveat | Accepted — patient sees AI interpretation immediately with caveat; clinician review is verification layer for routine values, gating layer for critical values |

**Operational Readiness items resolved in same session:**

| OR ID | Title | Resolution |
|---|---|---|
| OR-105 | Multilingual coverage spec | Resolved by ADR-018. Carried to Future Scope: USSD + AI Bridge §4.3 for Track B. |
| OR-221 | Lab extraction confirmation safety model | Resolved by ADR-019. Implementation tasks delegated to OR-218 (scope expansion), OR-231, OR-232. |

**Operational Readiness items added in same session:**

| OR ID | Title | Tier | Source |
|---|---|---|---|
| OR-219 | Patient research artifact set | 1 | Patient UI/UX Pressure Review |
| OR-220 | Honest-status patient-surface specification | 2 | Patient UI/UX Pressure Review |
| OR-222 | Persistent UI element specification | 2 | Patient UI/UX Pressure Review |
| OR-223 | Delegate UX completeness spec | 2 | Patient UI/UX Pressure Review |
| OR-224 | Critical-path / launch-scope reconciliation | 2 | Patient UI/UX Pressure Review |
| OR-225 | Empty-state copy and design library | 2 | Patient UI/UX Pressure Review |
| OR-226 | Notification deduplication policy | 2 | Patient UI/UX Pressure Review |
| OR-227 | OTP-recovery and shared-phone identity flows | 1 | Patient UI/UX Pressure Review |
| OR-228 | Identity model evolution plan | 2 | Future Scope: USSD + AI Bridge §9 |
| OR-229 | Audit envelope `interaction_surface` field | 2 | Future Scope: USSD + AI Bridge §9 |
| OR-230 | RBAC actor type `chw` reservation | 3 | Future Scope: USSD + AI Bridge §9 |
| OR-231 | Labs Slice §6.2 update for ADR-019 caveat language | 2 | ADR-019 implementation |
| OR-232 | Patient App IA Journey 4 update for Option B flow | 2 | ADR-019 implementation |
| OR-233 | Onboarding language scoping copy | 2 | ADR-018 implementation |
| OR-306 | Future Scope Track B PRD authorship trigger | 3 | Future Scope: USSD + AI Bridge §6 |

**Registry version bumped:** v2.3 → v2.4

**Resulting canonical artifact count:** 58 → 61 files

**Files produced and located:**

| File | Path |
|---|---|
| Telecheck_Operational_Readiness_Todo_v1_1.md | /mnt/user-data/outputs/ |
| Telecheck_Future_Scope_USSD_AI_Bridge_v0_1.md | /mnt/user-data/outputs/ |
| Telecheck_ADR_Addendum_016_to_019.md | /mnt/user-data/outputs/ |
| Telecheck_Artifact_Registry_v2_4.md | /mnt/user-data/outputs/ |
| Telecheck_Promotion_Ledger.md (this document) | /mnt/user-data/outputs/ |

**Promotion authorized by:** User (verbatim instruction recorded above)

**Promotion executed by:** Product (Telecheck), this session

---

### Entry P-001 — Implicit promotion baseline (pre-2026-04-25)

**Context:** All artifacts canonical in Registry v2.3 as of 2026-04-24 are treated as having been implicitly promoted through the prior session's working processes. They are not individually re-traced here. Future user-requested promotions begin with Entry P-002 above.

**Implicit baseline:** 58 files across 7 categories (Product truth: 6, Contracts: 15, Engineering: 9, Experience: 4, Operations: 4, Slice: 17, External communications: 3). See Registry v2.3 §7 for the inventory.

**Authority:** Inferred from session record. This baseline entry exists so that the ledger has a defined starting point and the count of promoted artifacts can be reconciled against the Registry inventory.

---

## Operating principles for future promotions

When the user asks for a promotion, the next entry will:

1. Be appended above as Entry P-003, P-004, etc.
2. Record the verbatim user instruction
3. List each artifact promoted with its Registry inventory row
4. Reference the Registry version bump triggered by the promotion
5. Cross-reference any decisions (ADRs, OR resolutions, scope changes) ratified in the same session

If the user later says "actually undo the last promotion," that is recorded as a new appended entry that references and supersedes the prior one. The original entry remains visible.

---

## Document control

- **v1.0** — Initial Promotion Ledger. Created 2026-04-25 in response to the user instruction "Promote these documents and keep record of documents I asked to be promoted." Establishes the operating rules, records the implicit pre-2026-04-25 baseline (Entry P-001), records the three-artifact promotion of this session (Entry P-002), and records the project-upload completion (Entry P-003).
- **2026-04-27 (US Region Migration Cycle U-004)** — Append-only addition of entries P-004 (U-001), P-005 (U-002), P-006 (U-003), P-007 (U-004) per user authorization. Per-entry sequencing follows actual ledger state (P-001..P-003 already present; new entries continue from P-004). Note: Registry §8 v2.8 changelog row claims P-009/P-010/P-011 were added in a prior cycle; those entries are not present in this actual ledger. Per user ruling at U-004 author gate, the discrepancy is documented in the U-004 validation report (F-U004-01) as a pre-existing inconsistency; no retroactive fabrication. Recommended follow-up: separate ledger-reconciliation cycle if desired.
- **Update cadence:** Updated whenever the user requests a promotion. Append-only.
- **Change discipline:** Entries are never edited or deleted. Corrections are made by appending a new entry that references the prior one.
- **Location:** This Promotion Ledger lives in /mnt/project/ alongside the Registry so every session sees both the canonical inventory and the user-instruction trail.
