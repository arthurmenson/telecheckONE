# TELECHECK — Release Notes (US Region Baseline Finalization)

**Bundle:** `Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip`
**Release date:** 2026-04-27
**Workstream:** Telecheck — Single-Region US Primary Migration Doc Set
**Predecessor bundle:** `Telecheck_Master_Bundle_FINAL_REMEDIATED.zip` (the metadata-remediation cycle bundle; preceded the US Region Migration workstream)
**U-002 verified PASS bundle:** `Telecheck_Master_Bundle_U002_FINAL_FOR_CODEX_VERIFICATION.zip` (md5 `7f3e2e8aaff0a8d284d4dde352fb7380`)
**U-003 verified PASS bundle:** `Telecheck_Master_Bundle_U003_R2_FOR_CODEX_REVIEW.zip` (md5 `09c9941fd3360806e5a47407dcc5c42f`)
**Final status:** Pending Codex final verification on U-004
**Final file count:** 75 markdown files
**Reviewers in workstream:** Claude (author), Codex (independent reviewer), User (decision owner on disputes)
**Protocol:** Claude-Codex Review Protocol v1.1

---

## Workstream summary

This bundle finalizes the single-region US primary baseline under ADR-026 and supersedes the prior af-south-1 design assumption. Prior canonical posture under ADR-025 was AWS `af-south-1` primary with `us-east-1` warm DR. The workstream replaces that planned posture with AWS `us-east-1` primary, `us-west-2` cold DR, single physical region for all tenants — an architecturally locked decision under the new ADR Addendum 026 (which supersedes ADR-025).

### A note on the "migration" framing

The workstream is named "US Region Migration" in cycle IDs and historical changelog rows for audit-trail continuity, but **no live infrastructure or data migration occurred or was required**. Both day-1 tenants are pre-launch:

- **Heros Health** is a greenfield tenant in us-east-1 per the HIGH-12 product decision (no legacy system to move)
- **Telecheck-Ghana** is pre-launch with no production data anywhere

There were no databases to drain, no traffic to cut over, no DNS to repoint, no warm-DR replicas to flip. The af-south-1 references existed only on paper — in ADR-025 and the documents that referenced it. **What this workstream actually was: a pre-launch hosting decision revision.** ADR-025 was rewritten as ADR-026 (different region pair, different DR posture), and the documents that had referenced ADR-025's region choice as a fact were updated to reference ADR-026's region choice instead.

The accurate phrase for current-state framing is **single-region US primary baseline finalization** (or more briefly: **US region baseline finalization**). The "migration" language is preserved only in cycle-ID prefixes (U-001..U-004), historical changelog rows describing past document evolution, and the Promotion Ledger entries that record the workstream's name at the time of execution. New current-state assertions (in this release notes, the validation report, the final bundle filename, and the handoff packet) use baseline-finalization language.

### Cycle history

The workstream ran in four cycles under Claude-Codex Review Protocol v1.1:

| Cycle | Scope | Outcome |
|---|---|---|
| U-001 | Impact-matrix discovery; file-by-file scope decisions | Closed; user-corrected scope locked into U-002/U-003/U-004 |
| U-002 | Architecture / control-plane finalization (ADR-026, Master PRD, System Architecture, Registry, ADI, contracts) | Codex PASS after Round 2 |
| U-003 | Operations / readiness / governance / reviewer-facing docs propagation (EHBG, OR Tracker, Ghana Playbook, Boot Sequence, Reviewer Brief, GLOSSARY/INVARIANTS/CCR, Tenant Threading; P2 spot-checks) | Codex PASS after Round 2 |
| U-004 | Packaging / metadata-only (manifest rebuild, release notes, validation report, final counts, ledger, final bundle) | Pending Codex final verification (Round 6 narrow metadata cleanup pass under standing §10 decision-owner ruling 2026-04-27 — fixes Registry/ADI stale P-011 claims and Validation Report stale Round 4 references at time of this release notes' authorship) |

A precursor closure cycle (Cycle 001 / F-001-01) restored two contract files (`MARKET_LAUNCH.md`, `Update_Spec.md`) from `/mnt/project/` that had been missing from the bundle inventory; that closure was absorbed into U-002 per the U-001 ruling.

---

## What changed (architectural)

### ADR-026 — single-region us-east-1 primary, us-west-2 cold DR (NEW)

`Telecheck_ADR_Addendum_026.md` is the new canonical hosting decision. It supersedes ADR-025 (which placed primary capacity in `af-south-1` with `us-east-1` warm DR). Key locked clauses:

- **Single physical region at launch:** us-east-1 (Virginia, United States) primary
- **Cold DR:** us-west-2 (Oregon, United States) — snapshot replication; RTO measured in hours-to-low-tens-of-hours, not minutes
- **Both tenants share the same physical primary stack:** Heros (US tenant; greenfield in us-east-1) and Telecheck-Ghana (chronic care anchor)
- **No per-country physical-region routing at launch:** the country abstractions in CCR govern jurisdictional and contractual obligations only, not physical region selection
- **Cross-border posture for Telecheck-Ghana:** Ghana patient data is processed in us-east-1 (United States); jurisdictional mechanism (Ghana DPC registration, patient privacy notice language, sub-processor list) carries `[COUNSEL-REQUIRED]` markers
- **Phase 2 / open option:** regional media routing for Ghana sync video (LiveKit edge node in `af-south-1` or `eu-west-1` while data plane remains us-east-1) — explicitly Phase 2, not launch scope

### INVARIANTS — I-028 added (NEW)

`I-028 · Single physical region, single database, single schema; tenant isolation by logical means` — locks the architectural posture as a contract-grade invariant. Per-region, per-tenant-database, or per-tenant-schema separation is explicitly out of scope at launch and requires a new ADR superseding the relevant clauses of ADR-026.

### Jurisdictional vs physical residency distinction

Multiple control-plane documents now explicitly distinguish jurisdictional regulatory residency (driven by `country_of_residence` per CCR — consent regime, retention, DPC obligations, sub-processor disclosure) from physical hosting region (single us-east-1 at launch per ADR-026). Documents updated to enforce the distinction: GLOSSARY (3 new entries), CCR_RUNTIME (resolution rule clarification), TYPES (inline disambiguation), Market Rollout Cockpit (Market Pack policy clarification), Ghana Launch Playbook (new dedicated section).

---

## What changed (operational)

### Ghana Launch Playbook v1.2 — Cross-border posture section (NEW)

`Telecheck_Ghana_Launch_Playbook_v1_1.md` → `Telecheck_Ghana_Launch_Playbook_v1_2.md`. New "Data residency and cross-border posture" section authored explicitly under ADR-026, covering:
- Where Ghana patient data lives (us-east-1, United States) — explicit and architecturally locked
- Jurisdictional implications: Ghana DPC registration, patient-facing privacy notice, clinician onboarding disclosure, sub-processor list (each with `[COUNSEL-REQUIRED]` markers for specifics)
- Operational implications: latency from Ghana to us-east-1 (~150-250ms RTT vs ~50-100ms to af-south-1), rights workflow continuity, sub-processor change governance
- What does not change: per-tenant encryption keys, country-driven configuration (CCR), three-layer tenant isolation
- Pre-launch operational checklist with cross-references to OR Tracker v1.5 OR-302

### Operational Readiness Tracker v1.5

`Telecheck_Operational_Readiness_Todo_v1_4.md` → `Telecheck_Operational_Readiness_Todo_v1_5.md`. OR-103, OR-111, OR-302, OR-303 reframed under ADR-026:
- **OR-103** (data residency): closing rationale updated under ADR-026 (per-tenant KMS unchanged; physical region updated)
- **OR-111** (deployment topology): topology under ADR-026 now reflects cold-DR posture (was warm-snapshot under ADR-025); CI/CD, runbooks, monitoring remain open
- **OR-302** (Ghana DPC cross-border registration): rescoped — Ghana data processed in us-east-1; specific contractual mechanism, patient privacy notice language, and sub-processor list all marked `[COUNSEL-REQUIRED]`
- **OR-303** (US BAA structure): simplified — standard HIPAA-region BAA chain. **Canonical 3-party chain (per System Architecture v1.2 §11.4 + OR-303 2026-05-02 supersession entry; updated 2026-05-02 per Codex Round-10 Scope 4 MEDIUM-3 finding to align with the canonical BAA chain — was previously stated as `Heros → Telecheck → AWS US` shorthand which violated C3 brand structure AND collapsed two distinct business-associate parties):** **Telecheck Health LLC (Telecheck-US tenant operator; Heros Health DBA consumer surface) → Telecheck parent/platform (separate business associate; data-plane operator + per-tenant KMS / RLS enforcement layer per ADR-023) → AWS US (subprocessor)**, all US-jurisdiction; was non-standard cross-border framing under ADR-025.

Status log entries appended for the four reframings (2026-04-26).

### Engineering Handoff & Build Guide v1.3

`Telecheck_Engineering_Handoff_Build_Guide_v1_2.md` → `Telecheck_Engineering_Handoff_Build_Guide_v1_3.md`. Region pair updated throughout (8 body refs + ADR refs); parent-document header bumped (Master PRD v1.9 / System Architecture v1.2 / ADR Addendum 026 added); body cross-refs to Master PRD §X and System Architecture §X updated; onboarding read list, Registry pointers refreshed; v1.3 changelog row added. No sprint plan changes (Heros launches greenfield in us-east-1 from day one; no af-south → us-east migration sprint).

---

## What changed (governance / reviewer-facing)

### Boot Sequence (CLAUDE_CODE_BOOT_SEQUENCE.md)

In-place edits: Registry pointer v2.8 → v2.9; Master PRD pointer v1.8 → v1.9; canonical version list refreshed; ADR-026 added to architecture decision set summary; conflict-resolution rule added: "Older doc references ADR-025 → ADR-026 wins; ADR-025 superseded; region of record us-east-1/us-west-2 cold DR." File-path pointer to Registry refreshed (v2_8.md → v2_9.md).

### Reviewer Brief

In-place stale-pointer refresh (no semantic content changes): Master PRD v1.6 → v1.9; System Architecture v1.0 → v1.2; RBAC v1.0 → v1.1; CDM v1.0 → v1.2; Registry v2.3 → v2.9; Refill Slice v1.0 → Pharmacy + Refill Slice v2.1; ADR Set reference now includes Addenda 016–019, 020–025 (with ADR-025 superseded), 026; doc-control entry added describing the U-003 stale-pointer refresh.

### GLOSSARY / INVARIANTS / CCR_RUNTIME / TYPES (Contracts Pack)

In-place edits clarifying the jurisdictional vs physical residency distinction:
- GLOSSARY: `country_of_residence` clarified; 3 new entries (`data residency (jurisdictional)`, `data residency (physical) / hosting region`, `cross-border processing posture`)
- INVARIANTS: I-028 added
- CCR_RUNTIME: resolution rule clarified for jurisdictional vs physical; explicit ADR-026/I-028 note; runtime topology unchanged
- TYPES: inline disambiguation comment on `data_residency` field

### Tenant Threading Addendum

In-place edit: §3.3 Sync Video Consult Slice "Per-country adapter notes" — single Phase-2 / open-option note added for Ghana media routing.

### Spot-check P2 edits

Surgical note-level edits in three slice PRDs:
- **Sync Video Consult Slice** §15 Q1 marked RESOLVED (LiveKit self-hosted per ADR-021; data plane us-east-1 per ADR-026; Phase 2 Ghana media routing)
- **Labs Document Interpretation Slice** §15 Q6 narrowed (physical region resolved; jurisdictional retention rules remain per-country)
- **Market Rollout Cockpit Slice** lines 68 and 125 (Market Pack policy components clarified as jurisdictional, not physical region)

Three P2 files reviewed and confirmed no-change-needed with evidence: GOVERNANCE_CONTROLS, AUDIT_EVENTS, Consent Slice.

---

## Files restored from `/mnt/project/`

Cycle 001 (closure absorbed into U-002) restored two Contracts Pack files that had been missing from the bundle inventory at the start of the workstream. Both md5-verified against the source files in `/mnt/project/`:

- `Telecheck_Contracts_Pack_v5_00_MARKET_LAUNCH.md` (v5.0; restored to bundle)
- `Telecheck_Contracts_Pack_v5_Update_Spec.md` (restored to bundle)

The bundle's effective Contracts Pack file count post-restoration: 15 files (13 v5.1-canonical + MARKET_LAUNCH at v5.0 + Update_Spec).

---

## Files renamed in this workstream

| Old filename | New filename | Cycle |
|---|---|---|
| `Telecheck_Master_Platform_PRD_v1_8.md` | `Telecheck_Master_Platform_PRD_v1_9.md` | U-002 |
| `Telecheck_System_Architecture_v1_1.md` | `Telecheck_System_Architecture_v1_2.md` | U-002 |
| `Telecheck_Artifact_Registry_v2_8.md` | `Telecheck_Artifact_Registry_v2_9.md` | U-002 |
| `Telecheck_Engineering_Handoff_Build_Guide_v1_2.md` | `Telecheck_Engineering_Handoff_Build_Guide_v1_3.md` | U-003 |
| `Telecheck_Operational_Readiness_Todo_v1_4.md` | `Telecheck_Operational_Readiness_Todo_v1_5.md` | U-003 |
| `Telecheck_Ghana_Launch_Playbook_v1_1.md` | `Telecheck_Ghana_Launch_Playbook_v1_2.md` | U-003 |

Old-versioned files are removed from the working bundle (replaced by the renamed versions). Each old version's content is preserved in the new version's changelog rows describing the supersession.

---

## Files demoted to historical (kept in bundle)

| File | Reason |
|---|---|
| `TELECHECK_RELEASE_NOTES_FINAL_REMEDIATED.md` | Superseded by this document; kept in bundle as historical record |
| `Telecheck_Project_Upload_Manifest_Post_Remediation.md` | Superseded by `Telecheck_Project_Upload_Manifest_v2.md`; kept in bundle as historical record |

Per workstream constraint, no files are deleted; historical files remain in the bundle for audit-trail continuity.

---

## NEW files in this workstream

| File | Cycle |
|---|---|
| `Telecheck_ADR_Addendum_026.md` | U-002 |
| `Telecheck_Project_Upload_Manifest_v2.md` | U-004 |
| `TELECHECK_RELEASE_NOTES_US_REGION_BASELINE.md` (this file; renamed from `..._US_REGION_MIGRATION.md` in U-004 Round 2) | U-004 |
| `TELECHECK_VALIDATION_REPORT_US_REGION_BASELINE.md` (renamed from `..._US_REGION_MIGRATION.md` in U-004 Round 2) | U-004 |

---

## Final canonical version map (current state)

See `Telecheck_Project_Upload_Manifest_v2.md` for the complete canonical version map. Highlights of the changes from the predecessor bundle to this final bundle:

- Master Platform PRD: v1.8 → **v1.9**
- System Architecture: v1.1 → **v1.2**
- Artifact Registry: v2.8 → **v2.9**
- Engineering Handoff & Build Guide: v1.2 → **v1.3**
- Operational Readiness Tracker: v1.4 → **v1.5**
- Ghana Launch Playbook: v1.1 → **v1.2**
- ADR Addendum 020–025: ADR-025 superseded by ADR-026
- ADR Addendum 026: **NEW** at v1.0

All other artifacts are unchanged from the U-002 PASS / U-003 PASS bundle.

---

## Methodology learnings captured

The workstream produced **13 binding methodology learnings** (11 inherited from U-002 + U-003; 2 added in U-004 from Round 2 → Round 3 self-corrections), recorded in cycle close ledgers and operationalized for future cycles:

1. Self-validation insufficient; external review (Codex/ChatGPT) catches what internal validation misses
2. Manifests must be rebuilt from filesystem, not hand-edited prose
3. Phantom Reference Checks must classify findings as Fixed/Removed/Marked-historical/Escalated; never "documented absence"
4. Stale-version sweeps must cover ALL prior versions
5. Compute counts from rows mechanically, not author them
6. Don't pause cycles for tension that's actually unfinished work
7. Don't hand to Codex mid-cycle; complete first, review on closed cycles only
8. Distinguish row count vs file count clearly; never mix in same sentence
9. Rename-propagation scans must cover all edited docs in cycle, not only docs explicitly named in directive *(F-U003-self-01)*
10. Reviewer findings are evidence of defect class, not exhaustive instance enumeration; full-scope scan after class is identified *(F-U003-self-02)*
11. Distinguish region-pair propagation from version-pointer propagation explicitly; each propagation class needs its own scan
12. Scan must cover all notation classes for the same canonical reference (filename `*.md`, version-name `vN.N`, abbreviation), not only the notation class the named defect used *(F-U004-R2-self-01; new in U-004 Round 2 → Round 3)*
13. Release notes (and other audit-trail documents) must reflect actual state at write time, not projected verification outcome — same class as "manifest from filesystem, not projection" *(F-U004-R2-self-02; new in U-004 Round 2 → Round 3)*

These are binding for all future workstream cycles, not optional.

---

## Known pre-existing inconsistency surfaced (not blocking)

The Promotion Ledger contains entries P-001, P-002, P-003. The Registry §8 v2.8 changelog row (preserved as historical when v2.9 was authored in U-002) claims "Promotion Ledger updated with P-009 (kickoff), P-010 (completion), P-011 (post-remediation review)" — implying entries P-004 through P-011 should exist but only P-001..P-003 are present. This is a **pre-existing control-plane inconsistency** between Registry §8 historical claim and Promotion Ledger reality. It predates the US Region Migration workstream.

This workstream's resolution: append U-001 through U-004 entries sequentially from actual ledger reality (P-004 through P-007), document the discrepancy in the validation report as a finding, and do **not** silently fabricate the missing P-004..P-008 historical entries to match the Registry §8 claim. Recommended follow-up: a separate ledger-reconciliation cycle if desired by the Decision Owner. The discrepancy is **not blocking** for final bundle promotion.

---

## Open items not addressed by this workstream (deferred)

- **F-U001-04 / Tenant Threading Addendum supersession path:** the addendum is canonical alongside the v1.0 slice PRDs it extends; supersession will occur incrementally as individual slices bump v1.0 → v1.1 in future cycles. Not a US Region Migration scope item.
- **AUDIT_EVENTS `processing_region` field:** logged as a future-cycle finding; not added in U-003 because the current envelope is single-region-correct as-is at launch.
- **Pre-existing Promotion Ledger gap (P-004..P-008):** not retroactively reconstructed; recommended separate ledger-reconciliation cycle.
- **RPM/CCM Medicare FFS workstream:** explicitly deferred from this session per user instruction. Requires separate cycle: web research for current CPT codes, time thresholds, consent rules; counsel-confirmed regulatory facts; multi-cycle PRD scaffold + compliance playbook + threading.

---

## Bundle integrity

- Final bundle file count: **75 markdown files** (computed from filesystem inventory, not pre-asserted)
- Source bundle for U-004: U-003 R2 PASS bundle (md5 `09c9941fd3360806e5a47407dcc5c42f`)
- Final bundle md5: (computed at build time; recorded in `TELECHECK_VALIDATION_REPORT_US_REGION_BASELINE.md` and the final Codex handoff packet)

---

## Document control

- **2026-04-27 (Round 6)** — Cycle history table U-004 row updated to reflect Round 6 narrow metadata cleanup pass status (still "Pending Codex final verification"). Round 6 fixes Registry/ADI stale P-011 claims (current-truth canonical assertions in §3 of both documents) and Validation Report stale Round 4 references. Authored under standing §10 ruling.
- **2026-04-27 (Round 5)** — Methodology learnings count updated 11 → 13 per Codex Round 4 finding F-U004-R4-02 (Validation Report says 13; Release Notes was inconsistent at 11). Added learnings #12 (notation-class coverage) and #13 (actual-state-not-projection) to numbered list. Cycle history table U-004 row remains "Pending Codex final verification" pending Round 5 Codex verdict.
- **2026-04-27 (Round 4)** — Cycle history table U-004 row updated to reflect Round 4 packaging pass under standing §10 decision-owner ruling. Round 4 was a full control-plane packaging cleanup pass triggered by user directive after Codex Round 3 verification. Round 4 self-scan across 8 control-plane files in both notation classes (filename `*.md` AND version-name `vN.N`) returned zero current-truth defects; all hits classified as acceptable historical/changelog/supersession/prior-round-audit-trail per directive's classification rule. Status remains "Pending Codex final verification" until Codex actually passes the Round 4 rebuilt bundle.
- **2026-04-27 (Round 3)** — Cycle history table U-004 row updated from "Codex PASS after Round 2" to "Pending Codex final verification" per Codex finding F-U004-R2-03 (release notes were internally inconsistent: line 9 said pending but line 40 prematurely asserted PASS). Authored under standing §10 decision-owner ruling (2026-04-27) authorizing auto-continue on mechanical/metadata defects until clean.
- **2026-04-27 (Round 2)** — US region baseline finalization release notes (renamed from `..._US_REGION_MIGRATION.md` per framing-correction directive). Authored mechanically from cycle close ledgers and changed-file lists. Predecessor `TELECHECK_RELEASE_NOTES_FINAL_REMEDIATED.md` demoted to historical (kept in bundle as `TELECHECK_RELEASE_NOTES_FINAL_REMEDIATED.md`). Final canonical bundle: `Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip`.
