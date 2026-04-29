# Telecheck — Adversarial Counsel Review (Sessions 1–3 Post-Remediation)

**Version:** 1.0 (post-remediation)
**Status:** Verification gate per §7 of remediation prompt
**Reviewer:** Adversarial counsel (Claude, post-remediation pass)
**Reviewer's posture:** Skeptical. Looking for residual problems, regressions introduced by remediation, and findings that were "addressed" in name only.
**Date:** 2026-04-25
**Predecessor:** Telecheck_Adversarial_Counsel_Review_Sessions_1_to_3.md (v1.0; 23 findings)
**Methodology:** Same as v1.0 — review the remediated corpus, find what's broken, classify CRITICAL / HIGH / MEDIUM / LOW. Treat the prior remediation as work done by someone else; do not give it the benefit of the doubt.

---

## Executive summary

The remediation cycle closed 22 of 23 findings from the original review (LOW-21 deferred to operational hygiene at zip time). The author of the remediation worked through the 18-step sequence and produced 30 artifact additions or modifications. This post-remediation review checked whether the remediation was real or performative.

**Findings of this review:**

- **0 CRITICAL** new or re-opened
- **0 HIGH** new or re-opened
- **5 MEDIUM** — residual issues, mostly traceability and consistency hygiene that arose from the remediation process itself
- **3 LOW** — minor issues

**Verification gate status:** PASS.

Per §7 of the remediation prompt, zero CRITICAL and zero HIGH must remain at zip time. That bar is met. MEDIUM and LOW findings are enumerated below with remediation plans; they do not block zip production but should be addressed in a follow-up cycle or accepted with explicit acknowledgment.

---

## Findings

### MEDIUM-A · Some superseded documents not yet flagged in the actual files

**Where:** Multiple — Refill Slice v1.0, Pharmacy Portal v1.0, Forms Engine v1.0 in /mnt/project/. Master PRD v1.6 and v1.7. CDM v1.0 and v1.1. State Machines v1.0. OpenAPI v0.1. EHBG v1.0 and v1.1.

**The problem:** Registry v2.8 §3 says these documents are "superseded." But the actual files in the corpus do not have a "SUPERSEDED" header at the top of their content. An engineer who opens `/mnt/project/Telecheck_Refill_Slice_PRD_v1_0.md` directly (without first reading the Registry) sees content that looks canonical. The Registry is the source of truth for canonicality, but the substrate (the file content itself) doesn't carry the marker.

This is a Pattern E ("Substrate threading") residual — the Registry is updated, but the supersession isn't threaded into the documents themselves.

**Severity:** MEDIUM. An engineer who reads a v1.0 slice PRD without checking the Registry could implement against superseded scope. The Tenant Threading Addendum partially mitigates this for the v1.0 slices it explicitly extends, but Refill v1.0 and Pharmacy Portal v1.0 (consolidated into Pharmacy + Refill v2.1) and Forms Engine v1.0 (superseded by v2.1) have no such mitigation.

**Remediation plan (proposed for follow-up cycle):** Add a "SUPERSEDED" notice block to the top of each demoted document's actual file content, with the canonical successor named. Do not delete the files (preserves traceability). This is a 30-minute mechanical pass across ~13 files. Alternatively (cheaper): publish an "Active Document Index" companion to Registry v2.8 that lists every active document by canonical name, and instruct engineering to consult it as their first read.

---

### MEDIUM-B · Pharmacy + Refill v2.1 has duplicated §14 Dependencies sections

**Where:** Telecheck_Pharmacy_Refill_Slice_PRD_v2_1.md — the v2.0 base has a §20 Dependencies, and the carry-forward of Refill v1.0 §14 Dependencies (line ~1058 in current file) appears within the v1.0 carry-forward block.

**The problem:** Section §20 Dependencies (from v2.0) and the carried-forward Refill v1.0 §14 Dependencies are both present in v2.1. They overlap substantially (both list Identity & Auth, Med Interaction Engine, etc.) but are not identical (v1.0 §14 has older versions; v2.0 §20 has the consolidated list). An engineer reading v2.1 in order encounters two Dependencies sections and may be confused about which is canonical.

This is a Pattern A residual ("Surface integration without depth") — HIGH-07 carry-forward was executed in full, but the de-duplication of overlapping sections wasn't performed.

**Severity:** MEDIUM. Doesn't introduce factual conflict (both lists are correct, just at different versions of references), but produces traceability friction.

**Remediation plan (proposed for follow-up cycle):** In the §21 Refill v1.0 carried-forward block, mark the embedded §14 Dependencies as "(historical — see §20 of this document for current dependencies)" rather than carrying it as live content. Same for any duplicates between Pharmacy Portal v1.0 §13 Dependencies and Pharmacy + Refill v2.1 §20.

---

### MEDIUM-C · Master PRD v1.8 §1.x sections referenced in change log but not actually inserted

**Where:** Telecheck_Master_Platform_PRD_v1_8.md change log says "§3 Product vision (restored as new §1.1), §4 Product thesis (restored as new §1.2), §5 The problem (restored as new §1.3), §7 User groups (restored as new §1.4)" — but the actual document does not have §1.1, §1.2, §1.3, §1.4. Section §1 "What Telecheck is" is from v1.7 unchanged; the restored content was appended as §20-§26.

**The problem:** Change log claim does not match reality. Engineering or product reading the change log expects to find §1.1-§1.4 in the document; they don't.

This is a Pattern E ("Documentation Drift") created by the remediation itself — the plan was to insert sections at logical positions, but execution put them all at the end.

**Severity:** MEDIUM. Honest-status discipline violation: the change log says one thing, the document does another. Trust in the change log itself is undermined.

**Remediation plan (proposed for follow-up cycle):** Either (a) actually move the restored sections into §1.1-§1.4 positions as the change log claims, OR (b) update the change log to reflect the actual document structure ("§3 Product vision restored as §20.x; §4 Product thesis restored as §20.y; etc."). Option (b) is cheaper and equally honest. The trustworthiness of the change log is the underlying issue.

---

### MEDIUM-D · Tenant Threading Addendum v1.0 §3.X cites slice PRD section numbers without verifying

**Where:** Telecheck_Tenant_Threading_Addendum_v1_0.md §3.1 through §3.14.

**The problem:** Multiple §3.X entries cite "current §X RPM Alert state machine" or "the slice's degraded-mode behavior (audio-only fallback per current §X)" with literal `§X` placeholders. Either the addendum was authored without consulting the actual slice PRD section numbering, or the placeholders were left in by oversight.

Examples:
- §3.3 line: "the slice's degraded-mode behavior (audio-only fallback per current §X)"
- §3.4 line: "Critical alerts (per current §X RPM Alert state machine in State Machines v1.1)"

**Severity:** MEDIUM. Citation hygiene fail. An engineer reading the addendum can't verify the cross-reference because there is no section number to check.

**Remediation plan (proposed for follow-up cycle):** Search-and-replace `§X` placeholders in the addendum with actual section numbers from the cited slices, OR delete the section-number citations entirely and reference by slice name only ("per Sync Video Consult Slice v1.0").

---

### MEDIUM-E · Admin Operator IA v1.1 references "§X" placeholders identically to the addendum

**Where:** Telecheck_Admin_Operator_IA_v1_1.md §8.6 line: "Emergency Safe Mode (per §X) remains canonical..."

**The problem:** Same Pattern E placeholder issue as MEDIUM-D, in a different document. One occurrence.

**Severity:** MEDIUM. Same hygiene fail; isolated to one occurrence.

**Remediation plan (proposed for follow-up cycle):** Fix the §X reference in §8.6 with the actual Emergency Safe Mode section number from Admin Operator IA v1.0.

---

### LOW-F · Several remediated documents reference outdated artifact versions

**Where:** Multiple — Pharmacy + Refill v2.1's §20 Dependencies still references "Forms/Intake Engine Slice v2.0" rather than "v2.1"; "Admin Backend Slice v1.0" rather than "v1.1"; "Notification Spec v1.0" rather than "v1.1." Similarly in other documents.

**The problem:** Cross-references in the remediated documents weren't updated to point to the new versions of their dependencies. The Registry knows the new versions exist (v2.8 §3 lists them), but slice PRDs still cite old versions.

**Severity:** LOW. Engineer following a v2.0 reference will find the old document still in the corpus and may use it; this is not catastrophic because most v2.0 → v2.1 deltas in this remediation are additive (the v2.0 content is still substantively correct, just not the latest).

**Remediation plan (proposed for follow-up cycle):** Mechanical search-and-replace pass across remediated documents updating cross-references to current versions.

---

### LOW-G · Promotion Ledger P-010 references documents by both filename and display name inconsistently

**Where:** Telecheck_Promotion_Ledger.md P-010 entry artifact table.

**The problem:** Some rows use the file basename (`Telecheck_Master_Platform_PRD_v1_8.md`); others use display names ("Pharmacy + Refill v2.1"). Hygiene only.

**Severity:** LOW. Reader can map either to the artifact; just inconsistent.

**Remediation plan (proposed for follow-up cycle):** Pick one convention and apply uniformly. Filename is more precise for engineering; display name is more readable for product. Filename is recommended.

---

### LOW-H · CDM v1.2 §3.5 entity count says "Pharmacy & Fulfillment — 5 entities" but should reconcile with §3.12 "Subscription/SubscriptionEvent" being placed there logically

**Where:** Telecheck_Canonical_Data_Model_v1_2.md §3.5 lists 5 Pharmacy & Fulfillment entities (MedicationRequest, Refill, Dispensing, Shipment, ProductCatalog). §3.12 places Subscription and SubscriptionEvent as "Ecom & Subscription Management" entities, even though the v1.1 entity overview had them under §3.5 Pharmacy & Fulfillment.

**The problem:** Inconsistent categorization between v1.1 and v1.2. Subscription is owned by Pharmacy + Refill module (per slice PRD ownership); placing it in §3.12 alongside Cart and CartItem (which are Ecom Backend module) breaks the module-ownership grouping principle of §3.

**Severity:** LOW. Categorization choice; doesn't affect schema or behavior.

**Remediation plan (proposed for follow-up cycle):** Move Subscription and SubscriptionEvent from §3.12 back to §3.5 Pharmacy & Fulfillment (now 7 entities). Leave Cart, CartItem, DiscountCode, DiscountCodeRedemption, AffiliateAccount, AffiliateConversion in §3.12 Ecom Backend (now 6 entities). Total still 41.

---

## What did NOT regress

Reviewing each of the 22 closed findings for regression risk:

- **CRITICAL-01 (Contracts Pack tenant threading):** Verified each of the 12 modified contract files contains the tenant scoping additions. Anti-compression rule respected — every file grew. Document control entries added with v5.1 designation.

- **CRITICAL-02 (CDM 8 ecom entities):** Verified all 8 schemas present with full DDL, RLS policies, indexes, constraints, invariants. CDM v1.2 grew from 545 lines to 947 — substantive expansion. Categorization issue noted as LOW-H; substance is correct.

- **CRITICAL-03 (Subscription state machine):** Verified §15 has 10 states, transition table with guards, invariants, cross-machine relationships. State Machines v1.1 grew from 685 to 772 lines.

- **CRITICAL-04 (33 OpenAPI endpoints):** Verified 6 new modules with full endpoint definitions including request/response schemas, authentication, error codes. OpenAPI v0.2 grew from 832 to 1303 lines.

- **CRITICAL-05 (Tenant Threading Addendum):** Verified 14 documents covered with per-document §3.X tenant rules. Addendum exists at 1.0; placeholders noted as MEDIUM-D but substance is comprehensive.

- **HIGH-06 (Master PRD lost sections):** Verified Success metrics, Non-goals, Dependencies, Risks, Pre-launch decisions, Open questions, Feature PRD index all present (as §20-§26). Documentation drift noted as MEDIUM-C; substance is restored.

- **HIGH-07 (Pharmacy + Refill carry-forward):** Verified Refill v1.0 sections 3, 6-13 carried forward; Pharmacy Portal v1.0 sections 4, 8, 9, 11, 12 carried forward. v2.1 grew from 710 to 1273 lines. Duplication noted as MEDIUM-B; substance is correct.

- **HIGH-08 (Day-1-7 plan restored):** Verified §10a contains Day 1 through Day 7 detail.

- **HIGH-09 (CLAUDE.md template restored):** Verified §13 contains embedded code-block CLAUDE.md template, updated for multi-tenant context.

- **HIGH-10 (Unified Admin Sidebar):** Verified 19 sidebar sections defined with role-visibility matrix. Reconciles three predecessor documents.

- **HIGH-11 (DIC PROVISIONAL):** Verified DIC v1.0 has prominent ⚠️ PROVISIONAL STATUS NOTICE at top.

- **HIGH-12 (Heros migration removed):** Verified Master PRD §1, §21, §24 reflect greenfield framing. EHBG sprint plan updated. Bulk import retained as tenant-onboarding tool.

- **MEDIUM-13 (Registry v2.8):** Verified §7 counts updated; 12 version bumps captured; 4 new artifacts listed; total 72 files.

- **MEDIUM-14 (Notification tenant variants):** Verified §14 with resolution order, authoring authority, validation, audit, channel support.

- **MEDIUM-15 (Ghana Playbook multi-tenant):** Verified §11 with cross-tenant operations, escalation paths, terminology hygiene.

- **MEDIUM-16 (EHBG §7 rewritten):** Verified §7 references CDM v1.2 §4-bis schemas; engineering implements not authors.

- **MEDIUM-17 (Design System tenant tokens):** Verified §15 with overridable vs platform-fixed token lists, validation rules.

- **MEDIUM-18 (Admin Operator IA RBAC mapping):** Verified §8 maps original 5 roles to dual hierarchy. Placeholder noted as MEDIUM-E; substance is correct.

- **MEDIUM-19 (Promotion Ledger discipline):** Verified corrective footnote on P-007 + P-009 + P-010 added; append-only discipline restored.

- **LOW-20 (EHBG section mapping):** Verified table mapping v1.0 → v1.1 → v1.2 sections.

- **LOW-22 (Admin Backend AI provider):** Verified §5.7 clarification on platform-controlled provider routing.

- **LOW-23 (Forms Engine PostHog naming):** Verified §14.3 clarification on canonical naming.

---

## What this review did NOT check

- **Compilation / lint of OpenAPI v0.2.** A real engineering review would import OpenAPI v0.2 into a validator. This review is documentation-level only.
- **DDL execution of CDM v1.2 schemas.** A real engineering review would run the migrations against PostgreSQL. This review trusts the SQL is well-formed without execution.
- **Cross-reference graph traversal.** A real review tool would build a graph of all cross-references in the corpus and identify broken links. This review found broken refs by spot-check (LOW-F) but did not exhaustively traverse.
- **Spelling and grammar.** Out of scope.
- **Patient-facing copy review.** Out of scope.
- **Live LLM behavior testing.** Out of scope of documentation review.

---

## Pattern A / B / C / E recurrence check

The original review identified four patterns. Has the remediation introduced any?

- **Pattern A (Substrate threading without depth):** MEDIUM-A is a residual Pattern A — superseded files don't carry the marker even though Registry knows. Caught here.
- **Pattern B (Silent compression):** None observed in the remediated corpus. Anti-compression rule appears to have been respected — file sizes verified to grow or, where they shrank, removals are explicitly enumerated in change logs.
- **Pattern C (Schemas / state machines in slice PRDs):** Cleanup completed — Pharmacy + Refill v2.1 references CDM v1.2 §4-bis and State Machines v1.1 §15 rather than carrying inline. Verified.
- **Pattern E (Documentation drift / placeholders):** MEDIUM-C, MEDIUM-D, MEDIUM-E, LOW-F, LOW-G are all Pattern E variants introduced or unresolved by the remediation itself.

The pattern-recurrence rate is one of substrate-threading hygiene (Pattern A residual) and documentation-drift / placeholder issues (Pattern E). No regression on Patterns B or C.

---

## Verification gate determination

Per §7 of the remediation prompt: "If the post-remediation review surfaces ANY critical or high findings — whether re-opened from v1.0 or net-new — fix those before producing the zip. Loop the review-and-fix cycle until the post-remediation review surfaces zero CRITICALs and zero HIGHs."

**Findings of this review:**
- 0 CRITICAL
- 0 HIGH
- 5 MEDIUM (all enumerated with remediation plans)
- 3 LOW (all enumerated with remediation plans)

**Gate determination: PASS.**

The 5 MEDIUM and 3 LOW findings are residual hygiene issues that do not block zip production per the prompt's threshold. Each has an explicit remediation plan; the user may choose to:

1. Run a follow-up remediation pass to close the 8 residual findings before zip (recommended; estimated 1 hour of work)
2. Accept the residuals with explicit acknowledgment in the next zip's README and remediate in a future cycle
3. Address selectively (e.g., MEDIUM-C the Master PRD change-log discrepancy is the highest-value to fix)

**Recommendation:** Address MEDIUM-C and MEDIUM-A before zip production, accept MEDIUM-B / D / E and LOW-F / G / H for next cycle.

---

## Document control

- **v1.0** — Post-remediation adversarial counsel review per §7 verification gate of remediation prompt. Reviews the 30 artifacts modified or produced in the remediation cycle. Surfaces 5 MEDIUM and 3 LOW findings, all residual hygiene; 0 CRITICAL and 0 HIGH. Verification gate determination: PASS. Predecessor: Telecheck_Adversarial_Counsel_Review_Sessions_1_to_3.md v1.0 (23 findings, 22 closed).
