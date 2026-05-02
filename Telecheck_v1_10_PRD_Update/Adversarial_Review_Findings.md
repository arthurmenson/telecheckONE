# v1.10 Traceability Matrix — Adversarial Review Findings

**Review date:** 2026-04-28
**Reviewer:** Claude (adversarial walk requested by Product)
**Method:** Cross-checked the matrix's 78 rows against the 75-file working directory; ran tenant-identifier reference scans across all candidate files; examined owner attribution, audit-category alignment, edit-type vocabulary, cascade declarations, and edit-description executability.

**Bottom line:** Matrix is structurally sound but has **4 missing files**, **5 in-matrix files missing C3 rows**, **20 audit-B rows with single owners** (potential I-015 dual-control gap), and **vocabulary inconsistency** in edit-type and cascade fields. None are matrix-killers; all are addressable with targeted patches before v1.10 editing begins.

---

## Finding 1 · Missing files (4 confirmed gaps, HIGH severity)

These files are in the canonical working directory, contain substantial Telecheck-Ghana or Heros-Health tenant references, but have **zero rows in the matrix**:

| File | Tenant refs | What's there | Why it matters |
|---|---|---|---|
| `Telecheck_ADR_Addendum_020_to_025.md` | 2× Heros, 6× Telecheck-Ghana | ADRs 020–025 (LLM provider, LiveKit, native-first stack, multi-tenancy ADR-023, country-driven config ADR-024, hosting). **Contains canonical text describing Heros as US tenant + Telecheck-Ghana as Ghana tenant.** | C3 changes the tenant-naming convention (Heros-Health → Telecheck-US). The ADR addendum text describing the multi-tenancy model uses the OLD names. Without an explicit row, the rename misses the source-of-truth ADRs. |
| `Telecheck_ADR_Addendum_026.md` | 1× Heros, 12× Telecheck-Ghana | ADR-026 (us-east-1 primary, us-west-2 cold DR). Contains substantial discussion of Telecheck-Ghana cross-border posture, Heros US tenant prioritization rationale. | Same problem as 020–025. ADR-026 *justifies* the architectural decisions C3, C4, C5 build on; if it isn't updated to use the new naming, it becomes stale immediately. |
| `Telecheck_Admin_Backend_Slice_PRD_v1_1.md` | 1× Heros, 4× Telecheck-Ghana | Tenant directory mock-up data (`Heros Health \| US \| Heros \| ...`), tenant-detail flow descriptions ("For Heros, this is where the Heros operations team manages catalog..."). | Critical UX surface that admin operators will touch daily. The mock data and prose currently reflect old naming. C3 needs an explicit row here. |
| `Telecheck_Design_Implementation_Contract_v1_0.md` | 0 Heros, 4× Telecheck-Ghana | Required design-file content includes "multi-tenant brand variations: at minimum, neutral default + Heros brand + Telecheck-Ghana brand applied to the same screen." Visual regression test specification. | C3 changes which brand combinations need to exist in design files. The DIC currently specifies "Heros brand + Telecheck-Ghana brand" — under new framing, that's "Heros Health (US instance) + Heros Health Ghana (subdomain instance) + at least one third-party tenant brand." |

**Action:** Add 4 new rows to C3 for these files. Possibly also add C5 rows for the ADR addenda (they're touched by every architectural ADR change).

---

## Finding 2 · In-matrix files missing C3 rows (5 cases, MEDIUM-HIGH severity)

These files are in the matrix (touched by other changes) but the C3 brand-structure cascade *also* affects them — yet no C3 row exists:

| File | Tenant refs | C3 issue |
|---|---|---|
| `Telecheck_Contracts_Pack_v5_00_CCR_RUNTIME.md` | 1× Heros, 2× Telecheck-Ghana | Contains explicit example: "Heros Health tenant: country = 'US'", "Telecheck-Ghana tenant: country = 'GH'". C3 rename → "Telecheck-US tenant: country = 'US'". Currently has C4 + C5 + C6 rows, no C3. |
| `Telecheck_System_Architecture_v1_2.md` | 0 Heros, 4× Telecheck-Ghana | Contains "Both Heros (US tenant) and Telecheck-Ghana (Ghana tenant) data are processed in `us-east-1`." Cross-border posture section uses old naming. Currently has C5 row, no C3. |
| `Telecheck_Pharmacy_Refill_Slice_PRD_v2_1.md` | 0 Heros, 1× Telecheck-Ghana | Contains "Telecheck-Ghana operated pharmacy infrastructure (where applicable)". Currently has no rows for any change. |
| `Telecheck_Operational_Readiness_Todo_v1_5.md` | 0 Heros, 1× Telecheck-Ghana | OR-109 references "per-tenant unit economics (Heros + Telecheck-Ghana)". Currently has C4 + C5 rows for new pre-launch decisions, but no C3 row to update the existing OR-109 wording. |
| `Telecheck_Notification_Spec_v1_1.md` | 0 Heros, 1× Telecheck-Ghana | Contains "Sender display name (e.g., 'Heros' vs 'Telecheck-Ghana')". C3 rename → "'Heros Health' (US instance) vs 'Heros Health Ghana' (Ghana instance)". Currently has C2 row, no C3. |
| `Telecheck_Forms_Intake_Engine_Slice_PRD_v2_1.md` | 0 Heros, 1× Telecheck-Ghana | Contains "Particularly relevant for the Telecheck-Ghana tenant". Currently has C4 + C5 + C6 rows, no C3. |

**Action:** Add 6 C3 rows (the F30 Forms Engine row covers two reasons — both gap and slice-level brand cascade).

---

## Finding 3 · Audit-B rows with single-owner attribution (20 cases, MEDIUM severity)

Per Contracts Pack invariant **I-015** ("dual-control sign-off required for governance-category changes"), audit-B rows should have at least two named approvers — typically a primary owner plus a governance reviewer.

20 of the 46 audit-B rows currently list a single owner:

**By change:**
- **C1:** F02 (ADR Set cross-references) — single owner Product Lead
- **C2:** F59 (Registry) — single owner Product Lead
- **C3:** F38 (Canonical Data Model), F40 (OpenAPI), F48 (Tenant Threading Addendum), F54 (Design System), F59 (Registry) — Engineering or Product Lead alone
- **C4:** F16 (Invariants), F58 (OR Tracker), F33 (Cockpit) — single owner each
- **C5:** F10 (Domain Events), F19 (Types), F38 (Canonical Data Model), F39 (State Machines), F41 (System Architecture), F40 (OpenAPI), F59 (Registry) — Engineering or Product Lead alone
- **C6:** F01 (Master PRD §10.5), F30 (Forms slice), F59 (Registry) — Product Lead alone

**Why this matters:** I-015 dual-control isn't optional. Single-owner audit-B sign-offs that get caught at review will bounce back, adding cycles. Adding the second owner now is a 20-row patch.

**Recommended pairings:**
- Engineering-led rows touching contracts (F38, F39, F40, F10, F19, F41) → **Engineering + Product Lead**
- Product-Lead-led rows touching the Registry (F59) → **Product Lead + Engineering Lead** (Registry is governance metadata)
- Product-Lead-led rows on the Master PRD (C6/F01) → **Product Lead + Clinical Lead** (since C6 is program catalog architecture, clinical scope review is real)
- Clinical-Safety-Officer-led row on Invariants (C4/F16) → **Clinical Safety Officer + Product Lead**
- Country-Launch-Director rows (C4/F58, C4/F33) → **Country Launch Director + Product Lead**
- Design-Lead row (C3/F54) → **Design Lead + Product Lead** (it's a brand identity decision, not just design)

**Action:** Patch 20 owner cells with second approver per I-015 pairing rules.

---

## Finding 4 · Edit-type vocabulary inconsistency (LOW severity, but should fix)

The edit-type column has near-duplicate values:

| Type | Count | Issue |
|---|---|---|
| Reference update | 29 | OK — clear meaning |
| New entries | 14 | Same as "New entry" semantically |
| New entry | 8 | Should consolidate with "New entries" |
| New section | 12 | OK |
| Terminology rewrite (selective) | 9 | OK |
| Section rewrite | 1 | OK |
| **Brand framing + tenant identifier rename + uniform naming** | 1 | Idiosyncratic; only used once. Could be "Section rewrite + cascade" |
| **New section / reframe** | 1 | Same as "Section rewrite" |
| **New section + rewrite** | 1 | Could be "Section rewrite" |
| **New section + multiple updates** | 1 | Idiosyncratic; should be "Section rewrite" |
| No edit | 1 | OK — it's a verification-only row |

**Action:** Normalize to a controlled vocabulary of ~6 types: Reference update / New entry / New section / Section rewrite / Terminology rewrite / Verification only. Rename the 4 idiosyncratic entries.

---

## Finding 5 · Cascade-trigger field is mostly empty (MEDIUM severity)

Of 78 rows, **65 say "No"** for cascade. Spot-checking, several should say "Yes":

| Row | Currently | Should be |
|---|---|---|
| C1/F13 (glossary) | No | Yes — glossary additions cascade to anyone reading the corpus |
| C3/F38 (Canonical Data Model) | No | Yes — data model entities cascade to API, slices, audit |
| C3/F40 (OpenAPI) | No | Yes — API contract changes cascade to client implementations |
| C3/F48 (Tenant Threading Addendum) | No | Yes — addendum is the integration point with all 12 slice §3.x sections |
| C3/F54 (Design System) | No | Yes — Design System tokens cascade to every component using brand tokens |
| C5/F08 (AUDIT_EVENTS) | No | Yes — new audit events cascade to anyone consuming the audit stream |
| C5/F38 (Canonical Data Model — research entities) | No | Yes — entities cascade to API, state machines, audit |
| C5/F40 (OpenAPI — research endpoints) | No | Yes — API contract |
| C5/F39 (State Machines — research) | No | Yes — state machines cascade to all consumers |

**Why this matters:** The cascade column drives the validation order. If glossary, data model, and API changes are flagged "No cascade," reviewers won't realize that downstream files depend on them being correct. This is exactly the failure mode the matrix is supposed to prevent.

**Action:** Audit the 65 "No" cascades; flip to "Yes — [downstream cascade description]" for the ~9 that genuinely cascade. Leave the rest as "No" if truly self-contained.

---

## Finding 6 · No row covers ADR-027 / ADR-028 authoring as standalone artifacts (MEDIUM severity)

C4 (DTC marketing posture) and C5 (research data partnership) both list "Author new ADR" as a row in F02 (ADR Set). But **the ADRs themselves are new files that don't exist in the working directory yet.** The matrix tracks edits to existing files; it doesn't track creation of new files.

The new files needed:
- `Telecheck_ADR_027_Country_Conditional_DTC_Marketing.md` (new file)
- `Telecheck_ADR_028_Research_Data_Partnership_Posture_A.md` (new file)
- Possibly `Telecheck_ADR_Addendum_027_028.md` if following the existing addendum pattern

**Why this matters:** When v1.10 editing begins, someone will look at the matrix, see "Author ADR-027 in F02 (ADR Set)" and try to edit ADR Set v1.0 — but the ADR Set doc doesn't contain ADR-027 yet because it's a new addendum. The matrix should explicitly include the new files as F66, F67, F68 (depending on how addenda are bundled), with rows describing creation rather than edit.

Same issue for the new Master PRD section §X (Research Data Governance) — it's flagged in C5/F01 as a sub-bullet within the Master PRD edit, but its sheer size (~30 lines, possibly its own slice or contracts pack addendum) might warrant being its own file with its own row.

**Action:** Decide whether new ADRs are addendum entries (extend F03/F04/F05 row coverage) or new files (add F66, F67). Patch the matrix accordingly. Make the §X Research Data Governance section explicit.

---

## Finding 7 · No row addresses the existing Heros-Rimo-migration text in ADR Addendum 020-025 (LOW severity)

ADR Addendum 020–025 currently contains this text from the Heros-as-tenant context:
> "Heros Health (the US DTC brand, sister company, **migrating from Rimo Health onto the Telecheck platform**)."

Per the §21 rewrite (HTML, locked) and the 2026-04-25 decision recorded in §24, **Heros launches greenfield, not migrating from Rimo**. The ADR addendum text is stale.

**Action:** Add row to either the existing C2 (emerging-markets reframe) or C3 (brand structure) — covering the Heros-Rimo-migration stale text correction. Or split out as a new tiny C-row.

---

## Finding 8 · "Tenant" abstract noun vs "operating tenant" / "consumer DBA" terminology (MEDIUM severity)

The matrix's C3 description explicitly distinguishes:
- **Operating tenant** = Telecheck-{country} legal entity, the platform tenant
- **Consumer DBA** = Heros Health (subdomain-instanced)
- **Telecheck (parent)** = platform/B2B brand only

But across the 78 rows, the word "tenant" is sometimes used to mean operating-tenant, sometimes consumer-brand. This inconsistency will confuse reviewers.

Examples:
- C3/F50 (Patient App IA): says "Tenant identifier (Telecheck-{country}) is internal" — clear
- C3/F33 (Cockpit): says "Market Pack should include consumer brand vs operating identifier distinction" — clear
- C2/F36 (RPM/CCM slice): says "tenant operates in" — ambiguous

**Action:** Sweep the matrix once for "tenant" usage; clarify each occurrence as either "operating tenant," "consumer brand instance," or "platform tenant identifier" depending on context.

---

## Finding 9 · Status workflow transitions need a precondition (LOW severity, design issue)

The README defines the status workflow as: Not started → In progress → Edited → Reviewed → Approved.

Missing: **what blocks a row from moving to "Edited"** if the row's prerequisites aren't met. For example:
- C5/F30 (Forms Engine — research consent block) requires C5/F12 (Forms Engine contract — research consent in form lifecycle) to be Edited first
- C3/F48 (Tenant Threading Addendum slice §3.x sweep) requires C3/F01 (Master PRD tenant rename) to be Approved first (since the slice addenda reference Master PRD)

**Action:** Add an optional "Depends On" column listing prerequisite row IDs, or document precedence in README. Otherwise reviewers will move rows through Status independently and risk approving downstream edits before upstream is locked.

---

## Severity-rolled summary

| # | Finding | Severity | Recommended action | Effort |
|---|---|---|---|---|
| 1 | 4 missing files (ADR addenda 020-025, 026; Admin Backend Slice; DIC) | **HIGH** | Add 4 new C3 rows + possibly C4/C5 rows | 30 min |
| 2 | 6 in-matrix files missing C3 rows | **MEDIUM-HIGH** | Add 6 C3 rows | 20 min |
| 3 | 20 audit-B rows with single owner | **MEDIUM** | Patch owners per I-015 pairing rules | 15 min |
| 4 | Edit-type vocabulary inconsistency | LOW | Normalize 4 idiosyncratic types | 5 min |
| 5 | Cascade-trigger field too often empty | **MEDIUM** | Re-flag ~9 rows to "Yes — [downstream]" | 15 min |
| 6 | No rows for ADR-027 / ADR-028 / Master PRD §X as new files | **MEDIUM** | Decide file-vs-section placement; add rows | 15 min |
| 7 | Stale Heros-Rimo-migration text in ADR Addendum 020-025 | LOW | Add 1 row to C2 or C3 | 5 min |
| 8 | "Tenant" terminology inconsistency | **MEDIUM** | Sweep matrix once | 15 min |
| 9 | No precondition / depends-on tracking | LOW | Add column or document precedence | 10 min |

**Total estimated patch effort:** ~2 hours of structured work to bring the matrix to "ready for editing" state.

---

## Recommended next move

The matrix is good enough to walk with stakeholders **after** Findings 1, 2, 3, 5, 6 are addressed (the High and Medium ones). The Low-severity ones (4, 7, 9) can be cleaned up during the matrix walk itself.

If you want, I can produce the patched matrix now — addressing Findings 1–6 in one rebuild — before any human walk-through. That would land the matrix at "actually ready" rather than "ready in spirit."

The only thing I won't do without your call is Finding 8 (terminology sweep): some of the "tenant" usages are intentionally ambiguous in the original PRD prose, and changing them mid-matrix risks editorializing rather than just patching.
