# TELECHECK — Validation Report (US Region Baseline Finalization)

**Bundle:** `Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip`
**Validation date:** 2026-04-27
**Validation cycle:** U-004 (final cycle of the workstream that finalizes the single-region US primary baseline under ADR-026; the workstream's original cycle-ID prefix retained for audit-trail continuity)
**Validator:** Claude (cycle owner) — Codex independent verification follows
**Source bundle:** `Telecheck_Master_Bundle_U003_R2_FOR_CODEX_REVIEW.zip` (md5 `09c9941fd3360806e5a47407dcc5c42f`; U-003 Codex-verified PASS)
**Final file count:** 75 markdown files
**Final bundle md5:** (recorded at build time; see Section 7)

---

## Validation result

**Self-check complete (post Round 4 cleanup); awaiting Codex final verification.** This validation report is the cycle owner's attestation and self-scan; PASS is asserted only after Codex independently verifies the rebuilt bundle. One pre-existing non-blocking inconsistency is documented (F-U004-01 Promotion Ledger gap). This bundle finalizes the single-region US primary baseline under ADR-026 and supersedes the prior af-south-1 design assumption. No live infrastructure migration occurred or was required: both day-1 tenants are pre-launch (Heros Health greenfield in us-east-1 per HIGH-12; Telecheck-Ghana pre-launch). The workstream is more accurately characterized as a pre-launch hosting decision revision than as a migration. The pre-existing Promotion Ledger discrepancy is documented as a non-blocking finding with recommended follow-up; per user ruling at U-004 author gate, retroactive reconstruction is out of scope for this workstream.

---

## 1. Inventory match (manifest ↔ filesystem)

**Test:** The `Telecheck_Project_Upload_Manifest_v2.md` inventory listing must match the actual filesystem inventory of the assembled bundle exactly.

**Method:** Mechanical comparison of manifest table rows against `ls *.md | sort` output of working directory.

**Self-check result:** Manifest lists 75 files; filesystem contains 75 files; every filename in manifest exists on filesystem; every filename on filesystem is in manifest. No drift. (PASS to be asserted by Codex on independent verification.)

---

## 2. Bundle file count

**Test:** The asserted bundle file count must equal `ls *.md | wc -l` of the assembled bundle.

**Method:** `ls *.md | wc -l` on the working directory before zip; verify zip contains the same count.

**Self-check result:** 75 markdown files. Mechanically computed; not pre-asserted. (PASS to be asserted by Codex on independent verification.)

| Source | Count |
|---|---|
| Filesystem `ls *.md \| wc -l` | 75 |
| Manifest v2 inventory rows | 75 |
| Registry §7 Total active | 75 |
| ADI bundle reference | 75 |
| Release notes "Final file count" | 75 |
| Validation report (this document) | 75 |

All sources agree. ✓

---

## 3. Registry §7 row counts

**Test:** Each Registry §7 category row count must equal the actual count of files in that category in the bundle filesystem.

**Method:** Manual category mapping per Registry §7 categorization scheme; cross-verified against filesystem inventory.

**Self-check result:** All 10 category rows correctly counted. Sum: 8 + 15 + 12 + 5 + 4 + 17 + 1 + 1 + 5 + 7 = 75 = filesystem total. (PASS to be asserted by Codex on independent verification.)

| Registry §7 Category | Asserted count | Filesystem count | Match |
|---|---|---|---|
| Product truth | 8 | 8 | ✓ |
| Contracts layer | 15 | 15 | ✓ |
| Engineering truth | 12 | 12 | ✓ |
| Experience truth | 5 | 5 | ✓ |
| Operations truth | 4 | 4 | ✓ |
| Slice truth | 17 | 17 | ✓ |
| External communications | 1 | 1 | ✓ |
| Engineering build deliverables | 1 | 1 | ✓ |
| Cross-cutting | 5 | 5 | ✓ |
| Bundle metadata / control plane (added in U-004) | 7 | 7 | ✓ |
| **Total** | **75** | **75** | ✓ |

**Pre-existing discrepancies corrected in U-004:** Engineering truth was previously asserted as 14 (actual: 12); Operations was 5 (actual: 4); Slice was 18 (actual: 17); Cross-cutting was 4 (actual: 5). One missing row added (Bundle metadata, 7 files). All discrepancies were pre-existing inheritances from prior Registry versions, corrected mechanically in U-004 from filesystem.

---

## 4. Canonical version map

**Test:** Every artifact's canonical version per the manifest must match its actual filename version, where the filename encodes a version, and must match the document header's declared canonical version where the filename does not.

**Method:** For each file, check filename-encoded version vs document header `**Version:**` field; check both against the canonical version map in `Telecheck_Project_Upload_Manifest_v2.md`.

**Self-check result:** No drift between filename, header, and manifest canonical version map. (PASS to be asserted by Codex on independent verification.)

**Notable conventions:**
- **Contracts Pack files:** Filenames retain legacy `v5_00` pattern; document headers declare `v5.1` as canonical. This is intentional; manifest v2 documents the convention. No drift.
- **Boot Sequence file:** No version in filename or header; it is a tooling file. Refreshed dates present. No drift.
- **Reviewer Brief:** v1.0 with refreshed-date in header. No drift.
- **Tenant Threading Addendum:** v1.0 with refreshed-date in header. No drift.
- **GLOSSARY / INVARIANTS / CCR_RUNTIME / TYPES:** v5.1 with refreshed-date in U-003 doc-control. No drift.

---

## 5. Missing canonical files

**Test:** No canonical artifact in the canonical version map should be missing from the bundle filesystem.

**Method:** Cross-check every entry in `Telecheck_Project_Upload_Manifest_v2.md` "Canonical version map" against `ls *.md` of the assembled bundle.

**Self-check result:** No missing canonical files. (This was a Cycle 001 carry-forward defect: `MARKET_LAUNCH.md` and `Update_Spec.md` had been missing from the prior `FINAL_REMEDIATED` bundle; restored in U-002 from `/mnt/project/`. Verified present in this bundle. PASS to be asserted by Codex on independent verification.)

---

## 6. Stale current-truth pointers in final bundle control layer

**Test:** Control-plane documents (Manifest, Release Notes, Registry, ADI, Boot Sequence, Reviewer Brief, this Validation Report) must not contain stale current-truth pointers to superseded canonical versions.

**Method:** Mechanical scan for stale version patterns (Master PRD v1.6/v1.7/v1.8; System Architecture v1.0/v1.1; Registry v2.3-v2.8; EHBG v1.0/v1.1/v1.2; OR Tracker v1.0-v1.4; Ghana Playbook v1.0/v1.1) across the control layer documents.

### Round 1 (initial U-004) result

❌ **DID NOT PASS** — Codex final verification correctly identified stale current-truth pointers that the Round 1 self-scan misclassified as historical/superseded:
- F-U004-01: Registry §6 contained "(72 active files)" — stale current-truth count
- F-U004-02: Registry, ADI, and Boot Sequence contained current-truth references to EHBG v1.2 (correct: v1.3)
- F-U004-03: This Section 6 PASS claim was inaccurate — the Round 1 PASS was asserted while the defects above existed

### Round 2 (prior cycle) — fixes applied

| Defect | Fix |
|---|---|
| F-U004-01: Registry §6 stale "72 active files" | Updated to "75 active files" |
| F-U004-02: Registry §1 reading-order EHBG v1.2 | Updated to v1.3 |
| F-U004-02: Registry §3 row 16 EHBG canonical version v1.2 | Updated to v1.3; description updated to note v1.0/v1.1/v1.2 superseded and v1.3 incorporates ADR-026 region updates |
| F-U004-02: Registry §6 EHBG v1.2 §10a/§10b references | Updated to v1.3 §10a/§10b |
| F-U004-02: ADI reading-order item 4 EHBG v1.2 | Updated to v1.3 |
| F-U004-02: ADI canonical inventory row EHBG v1.2 | Updated to v1.3 |
| F-U004-02: ADI SUPERSEDED rows for EHBG v1.0/v1.1 targeting v1.2 | Updated to target v1.3; added new rows for EHBG v1.2 → SUPERSEDED → v1.3, OR Tracker v1.4 → SUPERSEDED → v1.5, Ghana Playbook v1.1 → SUPERSEDED → v1.2 |
| F-U004-02: Boot Sequence §1 reading order EHBG v1.2 | Updated to v1.3 (version-name notation only; the filename-notation pointers on lines 15–16 were missed in Round 2 and caught in Round 3 — see below) |
| F-U004-02: Boot Sequence §11 "live in EHBG v1.2" | Updated to v1.3 |
| Broader-scope scan: Registry §3 row 4 OR Tracker v1.4 | Updated to v1.5 |
| Broader-scope scan: ADI canonical row Ghana Launch Playbook v1.1 | Updated to v1.2 |
| Broader-scope scan: ADI SUPERSEDED row for Ghana Playbook v1.0 targeting v1.1 | Updated to target v1.2 |
| Broader-scope scan: ADI Operational Readiness Tracker row pointing to wrong file | Pointed to actual canonical OR Tracker (v1.5) — pre-existing mislabel corrected |
| Broader-scope scan: Reviewer Brief 3 references to Ghana Launch Playbook v1.1 | Updated to v1.2 |

Per workstream methodology learning #10 (reviewer findings are evidence of class, not exhaustive enumeration), the Round 2 broader-scope scan caught 4 additional defects beyond the 3 Codex Round 1 named.

### Round 2 result

❌ **DID NOT PASS** — Codex Round 2 verification correctly identified that Round 2's broader-scope scan was scoped to one notation class (`v1.X` version-name patterns) and missed parallel defects in the other notation class (`*_v1_X.md` filename patterns):
- F-U004-R2-01 (HIGH): Boot Sequence lines 15–16 still contained `Telecheck_Engineering_Handoff_Build_Guide_v1_2.md` and `Telecheck_Master_Platform_PRD_v1_8.md` as current-truth filename pointers in the active "Reading order (strict)" section. The Round 2 fix updated the version-name reference on Boot Sequence line 28 but missed the parallel filename references on lines 15–16.
- F-U004-R2-02 (MEDIUM): This Section 6 asserted PASS in Round 2 based on the incomplete scan, while the F-U004-R2-01 defects existed in the actual bundle.
- F-U004-R2-03 (MEDIUM): Release notes line 40 prematurely asserted "Codex PASS after Round 2" for U-004 in the cycle history table while line 9 said "Pending Codex final verification" — internally inconsistent. Self-inflicted by projecting outcome rather than reflecting state at write time.

### Round 3 (this cycle) — fixes applied

| Defect | Fix |
|---|---|
| F-U004-R2-01: Boot Sequence line 15 stale filename `Telecheck_Engineering_Handoff_Build_Guide_v1_2.md` | Updated to `Telecheck_Engineering_Handoff_Build_Guide_v1_3.md` |
| F-U004-R2-01: Boot Sequence line 16 stale filename `Telecheck_Master_Platform_PRD_v1_8.md` | Updated to `Telecheck_Master_Platform_PRD_v1_9.md` |
| F-U004-R2-02: Section 6 PASS claim inaccurate against actual bundle | Section 6 rewritten in Round 3 (this rewrite) with honest 3-round history; PASS asserted only post-Round-3-rebuild |
| F-U004-R2-03: Release notes line 9 vs line 40 internal inconsistency | Release notes line 40 cycle-history-table U-004 entry updated to "Pending Codex final verification" (reflecting actual state at write time); line 9 was already truthful |

### Round 3 broader-scope scan — both notation classes

Per Round 2 self-finding F-U004-R2-self-01 (LOW methodology), Round 3 scan covered BOTH notation classes for the same canonical reference:

- **Class A (filename `*.md` pointers):** Scanned for stale references like `Telecheck_Engineering_Handoff_Build_Guide_v1_2.md`, `Telecheck_Master_Platform_PRD_v1_8.md`, etc.
- **Class B (version-name pointers):** Scanned for stale references like `EHBG v1.2`, `Master PRD v1.8`, etc.

### Round 3 result

Round 3 self-scan covered both notation classes and self-classified as clean except for acceptable historical/supersession/changelog hits. **PASS not asserted in Round 3 self-scan** — would have been claimed in Round 3 prior to this Round 4 directive's strictness rule, but per directive: PASS is asserted only after Codex independently verifies. Round 3 bundle (md5 `1426520f322647ba174bd08ea03836ec`) was handed to Codex; Codex Round 3 verification result handed back as "the same 3 R2 findings still present" — which after author-gate verification was determined to be evaluation against an earlier bundle round, not the actual Round 3 bundle (the Round 3 bundle on disk had the fixes correctly persisted). User issued Round 4 directive to do a full control-plane cleanup pass anyway, with strict no-PASS-pre-Codex rule.

### Round 4 (this cycle) — full control-plane cleanup pass

| Defect | Fix |
|---|---|
| Validation Report Sections 1–5 used "✅ **PASS**" language pre-Codex-verification | Stripped per Round 4 directive's strict no-PASS-pre-Codex rule; replaced with "Self-check result:" language; PASS is asserted only after Codex independently verifies |
| Validation Report Section 6 prior "Round 3 result" used "✅ **PASS**" | Replaced with self-scan-clean language; PASS reserved for Codex independent verification |
| Release Notes line 40 cycle-history-table U-004 row | Updated to reflect Round 4 packaging pass status; remains "Pending Codex final verification" |

### Round 4 broader-scope scan — both notation classes, full mandatory scope

Per Round 4 directive's mandatory scan scope, Round 4 scan covered:
- `CLAUDE_CODE_BOOT_SEQUENCE.md`
- `Telecheck_Artifact_Registry_v2_9.md`
- `Telecheck_Active_Document_Index_v1_0.md`
- `TELECHECK_VALIDATION_REPORT_US_REGION_BASELINE.md`
- `TELECHECK_RELEASE_NOTES_US_REGION_BASELINE.md`
- `Telecheck_Project_Upload_Manifest_v2.md`
- `Telecheck_Promotion_Ledger.md`
- `CODEX_FINAL_VERIFICATION_HANDOFF_PACKET.md` (outside bundle)

Both notation classes scanned:
- **Class A (filename `*.md` pointers):** All filename forms `Telecheck_*_v1_X.md` etc. for superseded versions
- **Class B (prose/version pointers):** All version-name forms `EHBG v1.X`, `Master PRD v1.X`, etc. for superseded versions

### Round 4 self-scan result

**Self-scan clean across all 8 files in mandatory scope, both notation classes.** Zero stale current-truth references. All scan hits classified per directive's classification rule and confirmed to be acceptable categories:

- **Class A acceptable hits (all may remain per directive):**
  - ADI line 33: doc-prose explanation referencing `/mnt/project/Telecheck_Refill_Slice_PRD_v1_0.md` as a pedagogical example of a superseded file engineers might mistakenly open (this is the explicit motivation for the ADI itself)
  - ADI lines 117–143: supersession table rows ("OLD filename | SUPERSEDED | NEW filename") — explicit supersession notes
  - ADI line 150: doc-control entry describing U-002 refresh — changelog
  - Validation Report Section 6 lines 107, 113, 121–130, 133, 140, 148–149, 157, 165: prior-round audit trail / Round 3 fix table / Class A acceptable-hits description
  - Release Notes lines 73, 82, 92: "OLD filename → NEW filename" version-bump documentation in "What changed" sections
  - Release Notes line 104: historical changelog narrative with → notation
  - Release Notes lines 144–149: rename table (OLD→NEW columns)
  - Release Notes line 184: "v1.2 → **v1.3**" inside "Highlights of the changes from the predecessor bundle" section
  - Promotion Ledger lines 6, 32, 75, 104–106, 129, 157–159, 205, 211, 214, 220, 291, 294, 305, 307: cycle entry context describing past Registry/promotion state
- **Class B acceptable hits (all may remain per directive):**
  - Registry §8 changelog rows (lines 128, 374–380, 390–395) describing what each Registry version changed
  - Registry §3 canonical rows (lines 179, 214, 215, 227) where the canonical version IS the current truth and the parenthetical "vN.X superseded" is a supersession note
  - Registry §5 known-gaps row (line 298) with unversioned references in "Referenced by" column
  - Registry §7 row parentheticals (lines 361, 363) — "(was v1.0)" supersession notes inside row descriptions; current truth IS the new version
  - Registry §7 Total-active reconciliation note (line 366) listing version bumps with → notation
  - ADI doc-control entry (line 150) describing U-002 refresh
  - Validation Report Section 6 audit-trail tables (lines 107, 113, 121–130, 133, 158)
  - Codex handoff packet (lines 25, 50, 77, 209) cycle audit trail / artifacts modified / canonical version map / verification specifics

**Note:** Slice PRD `Open questions` sections in some files reference older versions inside historical questions or context (Sync Video Slice §15 Q1, Labs Slice §15 Q6, Market Rollout Cockpit). All addressed in U-003.

**PASS is reserved for Codex independent verification.** This Round 4 self-scan documents that the cycle owner has scanned the full mandatory scope across both notation classes and finds zero stale current-truth references; all hits are acceptable per the directive's classification rule. Codex's independent verification of the Round 4 rebuilt bundle was performed and returned 3 narrow metadata findings — see Round 5 below.

### Round 4 result (Codex verdict)

Codex Round 4 verification returned 3 findings (1 HIGH metadata, 2 MEDIUM):
- **F-U004-R4-01 (HIGH):** Registry §7 line 366 named the new U-004 metadata artifacts with old MIGRATION names ("Release Notes US Region Migration, Validation Report US Region Migration") instead of actual BASELINE names. Real defect: control-plane mapping doc named non-existent artifact names.
- **F-U004-R4-02 (MEDIUM):** Release Notes line 196 said "11 binding methodology learnings" while this Validation Report (lines 299, 327) said "13". Cross-doc inconsistency on a final workstream-summary fact.
- **F-U004-R4-03 (MEDIUM):** Handoff packet not aligned to actual final bundle state — said Validation Report contains "Round 3 PASS-after-rebuild" (it doesn't; Round 4 rewrite says "Round 3 self-scan clean"); said "All other 69 files are bit-identical to U-003 PASS state" (incorrect; actual edited file count is 5, including Boot Sequence and Reviewer Brief).

### Round 5 (this cycle) — narrow metadata cleanup

| Defect | Fix |
|---|---|
| F-U004-R4-01: Registry §7 line 366 stale Migration filename refs | Updated to "Release Notes US Region Baseline, Validation Report US Region Baseline" with explicit historical note about the Round 2 rename |
| F-U004-R4-02: Release Notes methodology count "11 binding" vs Validation Report "13" | Release Notes updated to "13 binding methodology learnings (11 inherited + 2 new in U-004)"; numbered list extended with #12 (notation-class coverage from F-U004-R2-self-01) and #13 (actual-state-not-projection from F-U004-R2-self-02) |
| F-U004-R4-03 (a): Handoff packet line 44 stale "Round 3 PASS" | Updated to "Round 3 self-scan clean, Round 4 self-scan clean" reflecting actual validation report wording |
| F-U004-R4-03 (b): Handoff packet line 228 stale "Round 3 PASS-after-rebuild" | Updated to "Round 3 self-scan clean, Round 4 self-scan clean" |
| F-U004-R4-03 (c): Handoff packet line 63 incorrect "All other 69 files bit-identical" math | Updated to "All other 67 files bit-identical (75 total - 3 new - 5 edited = 67)" with explicit list of the 5 edited files (Registry, ADI, Promotion Ledger, Reviewer Brief, Boot Sequence) |
| Round 5 broader scan: Handoff packet line 43 "11 binding methodology learnings" | Updated to "13 binding methodology learnings (11 inherited + 2 new in U-004)" |
| Round 5 broader scan: Handoff packet line 94 "11 methodology learnings" in close criterion 3 | Updated to "13 methodology learnings (11 inherited + 2 new in U-004)" |
| Round 5 broader scan: Handoff packet line 262 "11 methodology learnings are recorded" | Updated to "13 methodology learnings are recorded for future cycles (11 inherited from U-002+U-003 + 2 new in U-004 from Round 2 → Round 3 self-corrections)" |

Per workstream methodology learning #10 (reviewer findings are evidence of class, not exhaustive enumeration), the Round 5 broader scan caught 4 additional handoff-packet defects beyond the 3 Codex Round 4 named — same defect classes (count inconsistency + stale claims), found in adjacent locations of the handoff packet.

### Round 5 self-scan result

Round 5 self-scan covered the same 8-file mandatory scope as Round 4 + verified the F-U004-R4-01/02/03 fixes were correctly persisted on disk + ran broader scans for additional handoff-packet inconsistencies. **Self-scan clean** — zero stale current-truth references; all R4 findings fixed with broader-scope corrections applied. Filesystem comparison against U-003 PASS bundle confirms exactly 5 in-place edited files (Registry, ADI, Promotion Ledger, Reviewer Brief, Boot Sequence) + 3 new files (Manifest v2, Release Notes BASELINE, Validation Report BASELINE) = 8 changes; 67 files bit-identical to U-003 PASS state. **PASS reserved for Codex independent verification of Round 5 rebuilt bundle.**

---

## 7. Bundle integrity

**Test:** The assembled bundle zip must contain exactly the working directory's `*.md` files and nothing else; bundle md5 must be recorded for promotion verification.

**Method:** `zip *.md` of working directory; record md5; verify file count in zip matches filesystem.

**Result:** Recorded at build time. (See Section 8 below.)

---

## 8. Final bundle build evidence

> **Self-reference note:** This validation report is inside the bundle. Specific byte values and the bundle md5 cannot be self-referenced here (computing them requires the bundle to be built, which freezes this document's contents). Those values are recorded in the U-004 final Codex verification handoff packet, which sits outside the bundle.

| Property | Value |
|---|---|
| Bundle filename | `Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip` |
| Bundle md5 | (recorded in `CODEX_FINAL_VERIFICATION_HANDOFF_PACKET.md`; not self-referenced here) |
| File count in bundle | 75 (verified by `unzip -l` after build; matches filesystem `ls *.md \| wc -l`) |
| Total bytes (uncompressed) | (recorded in handoff packet; matches filesystem byte count exactly) |
| Build timestamp | 2026-04-27 |
| Build method | `zip -q Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip *.md` from `/home/claude/u004/working/` |
| Filesystem-zip integrity | Filesystem byte count and zip uncompressed byte count match exactly; filesystem file count (75) and zip file count (75) match exactly |

---

## 9. Findings

### F-U004-01 (LOW; pre-existing; not blocking) — Promotion Ledger gap

**Severity:** LOW (pre-existing; not introduced by this workstream; not blocking final bundle promotion)

**Classification per user ruling at U-004 author gate:**
- Pre-existing control-plane inconsistency
- Not blocking final bundle promotion
- Recommended follow-up: separate ledger-reconciliation cycle if desired

**Issue:** The `Telecheck_Promotion_Ledger.md` file contains entries P-001, P-002, P-003. The `Telecheck_Artifact_Registry_v2_9.md` §8 changelog row for v2.8 (preserved as historical when v2.9 was authored in U-002) claims:

> "Promotion Ledger updated with P-009 (kickoff), P-010 (completion), P-011 (post-remediation review); MEDIUM-19 corrective footnote added re: P-007 in-place edit."

If the v2.8 changelog row is accurate, the Promotion Ledger should contain P-004 through P-011 (8 additional entries beyond the original P-001..P-003). The actual ledger contains P-001..P-007 (P-004..P-007 were appended in U-004 from actual U-001..U-004 cycle reality, per user ruling 2026-04-27 not to fabricate the missing P-008..P-011). The remaining gap is P-008..P-011 (4 entries claimed in Registry §8 v2.8 historical row but never actually present in the ledger). This is a discrepancy between two control-plane documents.

**Evidence:**
- `Telecheck_Promotion_Ledger.md` lines 39, 92, 142, 178, 203, 234, 305: contain `### Entry P-007`, `### Entry P-006`, `### Entry P-005`, `### Entry P-004`, `### Entry P-003`, `### Entry P-002`, `### Entry P-001` respectively. P-004 through P-007 were appended in U-004 from actual U-001..U-004 cycle reality. No P-008 through P-011 entries present (these are the entries the Registry §8 v2.8 changelog row claims were added but never actually were).
- `Telecheck_Artifact_Registry_v2_9.md` §8 v2.8 changelog row (preserved as historical from prior cycles): claims P-009, P-010, P-011 added.

**Origin:** This discrepancy predates the US Region Migration workstream. It originated in or before the metadata remediation cycle that produced the prior `FINAL_REMEDIATED` bundle. U-002 preserved the §8 changelog row as historical (per workstream constraint: "no retroactive editing of historical changelog rows").

**U-004 disposition (per user ruling 2026-04-27):**
- Append U-001 through U-004 entries sequentially from actual ledger reality: P-004 (U-001), P-005 (U-002), P-006 (U-003), P-007 (U-004)
- Do **not** retroactively fabricate the missing P-004 through P-008 entries to match the Registry §8 historical claim
- Document the discrepancy here (this finding) rather than silently fix it

**Why this is the right disposition:** Fabricating historical entries to match a stale claim would make the audit trail less truthful, not more. The honest path is to preserve actual reality and make the discrepancy explicit. The audit trail now contains: actual ledger reality (P-001..P-007), the v2.8 historical claim (preserved in §8 changelog row), and this finding documenting the gap. A future ledger-reconciliation cycle can investigate the discrepancy with full context.

**Recommended follow-up (out of scope for U-004):** A separate ledger-reconciliation cycle to investigate whether P-004..P-008 entries were authored but lost, or whether the Registry §8 v2.8 changelog row was inaccurate. Outcomes of that cycle would either reconstruct the missing entries from session records or amend the Registry §8 v2.8 claim with a corrective footnote.

**Disposition:** Open (not blocking final bundle promotion).

### F-U004-02 (LOW; pre-existing; corrected in U-004) — Registry §7 row count discrepancies

**Severity:** LOW (pre-existing; corrected in U-004 mechanically from filesystem)

**Issue:** The Registry §7 table row counts in v2.9 (inherited from prior versions) did not match the actual file inventory in several rows:
- Engineering truth row claimed 14, actual filesystem count was 12
- Operations row claimed 5, actual filesystem count was 4
- Slice row claimed 18, actual filesystem count was 17
- Cross-cutting row claimed 4, actual filesystem count was 5
- ADI, Boot Sequence, Manifest (current+historical), Release Notes (current+historical), and Validation Report files (7 files total) were not represented in any §7 row

**Origin:** Inherited from prior Registry versions; not introduced by this workstream.

**U-004 disposition:** Corrected mechanically in §7 in this cycle. Row counts now match filesystem reality. New "Bundle metadata / control plane" row added to represent the previously-uncategorized 7 files. U-004 reconciliation note added at top of §7 documenting the correction.

**Disposition:** Fixed.

---

## 10. Methodology learnings observed in U-004

The 11 binding methodology learnings recorded across U-002 and U-003 were applied in U-004; U-004 added 2 more from its own Round 2 → Round 3 self-corrections, bringing the workstream total to 13:

| # | Learning | Applied/originated in U-004? |
|---|---|---|
| 1 | Self-validation insufficient; external review catches what internal misses | ✓ Demonstrated three times in U-004 (Codex Round 1 caught Round 1 misses; Codex Round 2 caught Round 2 misses; Round 3 self-scan + final Codex verification follows) |
| 2 | Manifests must be rebuilt from filesystem, not hand-edited prose | ✓ Manifest v2 generated from `os.listdir('.')`; regenerated each round |
| 3 | Phantom Reference Checks classify findings explicitly | ✓ F-U004-01, F-U004-02, F-U004-R2-01/02/03 all classified explicitly with disposition |
| 4 | Stale-version sweeps cover ALL prior versions | ✓ Round 3 scan covered v1.6/v1.7/v1.8 / v2.3–v2.8 / v1.0–v1.4 / etc. |
| 5 | Compute counts from rows mechanically, not author them | ✓ All counts mechanically computed |
| 6 | Don't pause cycles for tension that's actually unfinished work | ✓ U-004 author gate raised the P-NNN gap finding immediately |
| 7 | Don't hand to Codex mid-cycle | ✓ Each Codex handoff was on a closed cycle |
| 8 | Distinguish row count vs file count clearly | ✓ Section 3 mechanically distinguishes per-row count vs filesystem total |
| 9 | Rename-propagation scans cover all edited docs | ✓ Section 6 scan covered all U-004-edited docs |
| 10 | Reviewer findings are class evidence, not exhaustive enumeration | ✓ Round 2 broader-scope scan caught 4 additional defects beyond Codex Round 1's 3 named; Round 3 broader-scope scan caught 0 additional beyond Codex Round 2's 3 named (clean enumeration this round) |
| 11 | Distinguish region-pair propagation from version-pointer propagation | ✓ Sections 4 and 6 verify each separately |
| 12 (NEW from F-U004-R2-self-01) | Scan must cover all notation classes for the same canonical reference (filename, version-name, abbreviation), not only the notation class the named defect used | ✓ Round 3 scan covered both Class A (`*_v1_X.md` filename pointers) and Class B (`vN.N` version-name patterns); originated from the Round 2 → Round 3 trigger event |
| 13 (NEW from F-U004-R2-self-02) | Release notes (and other audit-trail documents) must reflect actual state at write time, not projected verification outcome — same class as "manifest from filesystem, not projection" | ✓ Round 3 release notes line 40 corrected to "Pending Codex final verification"; line will be updated only after Codex actually returns PASS |

---

## 11. Closing statement

This validation report attests that:
- The bundle filesystem inventory is internally consistent (manifest ↔ Registry §7 ↔ ADI ↔ release notes ↔ this report all agree on 75 files)
- All canonical artifacts named in the canonical version map are present in the bundle
- After Round 4 cleanup pass, control-plane documents do not carry stale current-truth pointers in either notation class (filename or version-name); acceptable historical/superseded/changelog/prior-round-audit-trail references remain and are classified explicitly in §6 per the Round 4 directive's classification rule
- Two pre-existing inconsistencies inherited from prior cycles are documented as findings: F-U004-01 (Promotion Ledger gap; non-blocking, recommended follow-up) and F-U004-02 (Registry §7 row count corrections; fixed in U-004)
- U-004 made no substantive document edits; all U-004 changes (across Rounds 1, 2, 3, 4) are packaging, metadata, count-correction, framing-correction, stale-pointer-correction, or PASS-language-tightening in nature
- The workstream produced 2 additional binding methodology learnings (#12 notation-class coverage, #13 actual-state-not-projection) from its own Round 2 → Round 3 self-corrections, bringing the workstream total to 13
- This validation report does NOT assert PASS on the bundle as a whole. PASS is reserved for Codex independent verification of the rebuilt Round 6 bundle. The cycle owner's self-check across Sections 1–6 is documented as "Self-check result" without claiming PASS pre-verification.

Per workstream constraint, this validation is the cycle owner's attestation. Codex independent verification of Round 6 follows.

---

## Document control

- **2026-04-27 (Round 6)** — Narrow metadata cleanup pass per Codex Round 5 findings: Registry §3 row 64 "Through P-011 / P-001 through P-011" → "Through P-007 / P-001 through P-007" with explicit note about pre-existing F-U004-01 anomaly; ADI §3 "Promotion Ledger (P-001 through P-011)" → "P-001 through P-007"; §11 closing statement "Codex independent verification of Round 4 follows" → "Round 6 follows" (the current handoff round, per methodology learning #13); §11 closing statement "rebuilt Round 4 bundle" → "rebuilt Round 6 bundle"; §9 evidence text updated to reflect actual current ledger contents (P-001..P-007 present; gap is P-008..P-011); corrected stale Round 5 doc-control entry that incorrectly claimed "No edits to this validation report in Round 5". Bundle rebuilt; new md5.
- **2026-04-27 (Round 5)** — Section 6 extended with "Round 4 result (Codex verdict)" block + "Round 5 (this cycle) — narrow metadata cleanup" fix table + "Round 5 self-scan result" block. Companion fixes in handoff packet for methodology-count inconsistencies (lines 43, 94, 262 all said "11" while line 220 said "13") and stale "Round 3 PASS" claims (lines 44, 228), and incorrect bit-identical math (line 63: 69 → 67 with explicit 5-edited-files list). Per Codex Round 4 findings F-U004-R4-01/02/03.
- **2026-04-27 (Round 4)** — Full control-plane packaging cleanup pass per user directive. Sections 1–5 PASS language replaced with "Self-check result:" language per directive's strict no-PASS-pre-Codex rule. Section 6 Round 3 result PASS claim replaced with self-scan-clean language; Round 4 result block added documenting the broader-scope scan across all 8 files in mandatory scope, both notation classes, with all hits classified per directive's classification rule. §11 closing statement updated to make explicit that PASS is reserved for Codex independent verification. Authored under standing §10 decision-owner ruling (2026-04-27).
- **2026-04-27 (Round 3)** — Validation report rewritten in Round 3 to reflect the actual post-Round-3-fix state per Codex finding F-U004-R2-02. Section 6 contains an honest 3-round audit trail (Round 1 DID-NOT-PASS, Round 2 DID-NOT-PASS, Round 3 self-scan clean) with per-defect fix tables for each round. Section 10 updated with two new methodology learnings (#12 notation-class coverage, #13 actual-state-not-projection) originating from the Round 2 → Round 3 trigger event.
- **2026-04-27 (Round 2)** — Validation report renamed from `..._US_REGION_MIGRATION.md` per framing-correction directive. Section 6 rewritten to reflect Round 2 fixes per Codex F-U004-03. Companion to `TELECHECK_RELEASE_NOTES_US_REGION_BASELINE.md`.
- **2026-04-27 (Round 1, initial)** — Initial validation report authored mechanically in Cycle U-004 from filesystem evidence.
