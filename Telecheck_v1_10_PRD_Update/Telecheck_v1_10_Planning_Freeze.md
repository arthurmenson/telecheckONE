# Telecheck — v1.10 PRD Update · Planning Freeze Document

**Version:** 2.1 · **Status:** **🟢🟢🟢 v1.10 PRD UPDATE CYCLE COMPLETE 2026-05-02 🟢🟢🟢** · All phases closed (Phase 0 + Phase 1 + Phase 2 + Phase 2.X + Phase 3 + Phase 4 + Phase 5 + Phase 6 ceremony plan + Phase 6 physical merge + Phase 6 POST-MERGE EXIT). v1.10 canonical in bundle. Workstream archives. · **Date:** 2026-05-02
**Owner:** Evans (Product Lead, designated v1.10 workstream lead)
**Purpose:** Single planning artifact capturing everything needed to canonicalize the v1.10 architectural changes before development begins. Reads top-to-bottom as an execution plan. **STATUS: COMPLETE.**
**Supersedes:** v1.0 (2026-04-28); v1.1, v1.2, v1.3 (2026-04-29); v1.4 (2026-04-30); v1.5 (2026-05-01); v1.6 (Phase 0+1 exit); v1.7 (Phase 2 exit); v1.8 (Phase 3 exit); v1.9 (Phase 4 exit); v2.0 (Phase 5 exit) — see §9 doc-control for full changelog

**Scope of "Frozen":** The execution plan in this document (phases, gates, ordering, ownership, exit criteria) is frozen. The traceability matrix `.xlsx` is **NOT frozen** — Phase 0 explicitly mutates it (adds rows, adds the `Revalidation required` status, tags dependencies, pairs audit-B owners). Matrix mutations are governed by Phase 0 exit criteria; the planning freeze defines those controls.
**Companion artifacts:**
- `Telecheck_Master_Platform_PRD_v1_9.html` — styled PRD with v1.10 changes drafted in HTML (preview only; canonical .md is still v1.9)
- `Telecheck_PRD_v1_10_Traceability_Matrix.xlsx` — baseline 90-row tracking matrix (Phase-0-mutable; final row count locks at Phase 0 exit per §1)
- `Adversarial_Review_Findings.md` — Claude's review of the matrix; findings 1, 2, 5, 6 patched into matrix; 3, 4, 7, 8, 9 reclassified per v1.1 (see §5)
- `Codex_Adversarial_Review_2026-04-29.md` — Codex's review of this planning freeze; 9 findings (4 HIGH, 3 MEDIUM, 2 LOW); v1.1 patches incorporate all HIGH and MEDIUM findings
- `Telecheck_Program_Porting_Checklist_GLP1_v1_0.md` — worked example of how programs port across markets

---

## 1 · Executive summary (read this first)

**State of the world.** Master Platform PRD v1.9 is canonical. Six architectural shifts have been agreed in conversation and drafted in the HTML rendering of v1.9 — but the canonical `.md` source has NOT been edited. v1.10 is the canonicalization workstream that takes those drafted changes and lands them in the canonical PRD source plus the cascading slice PRDs, contracts, and ADRs.

**The six v1.10 changes (in execution order):**
1. **C3 — Brand structure + tenant identifier rename.** "Telecheck" = platform/B2B brand only. "Heros Health" = global consumer DBA, country-instanced via subdomains (heroshealth.com US, ghana.heroshealth.com, etc.). Tenant identifiers renamed to uniform `Telecheck-{country}` (US tenant: `Heros-Health` → `Telecheck-US`). 29 rows; biggest cascade.
2. **C2 — Emerging-markets framing reframe.** Category-level "Ghana" claims become "emerging markets"; concrete pilot citations (Ghana DPA, FDA, MDC) stay. 11 rows.
3. **C1 — §21 Non-goals regulatory-conditional rewrite.** Three-axis classification (Regulatory · Architecture · Activation) for every non-goal; Future Release markers where activation paths exist. 4 rows.
4. **C6 — Program catalog architecture canonicalization.** Make Design 1 (platform-level program + ProgramMarketPolicy + four-layer Forms Engine + Pattern A + CCR runtime) explicit at the Master PRD level. 10 rows.
5. **C4 — Country-conditional DTC marketing posture.** New ADR-027. Per-country policy in CCR; harm-reduction logic for emerging markets where counterfactual is unmediated pharmacy purchase. 11 rows.
6. **C5 — Research data partnership (Posture A as Release 2 goal).** New ADR-028. WHO/UN partnership anchored at Telecheck parent level. 5th consent tier (research data-use). REC partnership. De-id engine. DSA template. 25 rows; largest single block.

**Total scope (v1.2 row-count rule):** **90 rows across 44 files at v1.0 baseline.** Phase 0 reconciliation may add rows for the 7 scope items listed in §3 Phase 0 (or close them with rationale). The scope count is therefore **provisional at 90 and locks at Phase 0 exit** at whatever post-reconciliation count results. §8 references describe the patches needed to reach that locked count; the matrix's row count is the authoritative number once Phase 0 closes. C3 + C5 together = 54 rows (60% of v1.10 effort) at baseline.

**Total estimated effort to canonicalize:** ~2 weeks of structured work assuming clinical, regulatory, and engineering reviewers can pair on dual-control sign-offs in cadence.

---

## 2 · Locked architectural decisions (read this second)

These are the framing commitments that the v1.10 changes formalize. None are open for re-discussion at this point.

### 2.1 · Brand structure (locked)

Three layers, mutually exclusive at the consumer surface:

- **Telecheck** — parent company / platform brand / B2B mark. Anchors WHO/UN partnerships, regulatory engagement, platform-as-a-service business line. **Never the consumer mark anywhere.**
- **Heros Health** — global consumer DBA for all Telecheck-operated DTC. Country-instanced via subdomains: `heroshealth.com` (US), `ghana.heroshealth.com`, `nigeria.heroshealth.com` (future), `kenya.heroshealth.com` (future), etc. The unified consumer app is "Telecheck Heros."
- **Per-country operating tenants** — separately incorporated subsidiaries:
  - `Telecheck-US` — operated by Telecheck Health LLC. Trades patient-facing as Heros Health.
  - `Telecheck-Ghana` — operated by Telecheck-Ghana Ltd. Trades as Heros Health Ghana.
  - Future: Telecheck-Nigeria, Telecheck-Kenya, etc.
- **Heros Health is a DBA, not a separate legal entity.** No "Heros Health Inc."

### 2.2 · Two business lines (locked)

- **Line 1: Telecheck-operated DTC.** Telecheck operates the consumer DTC business directly under the Heros Health brand globally, country-instanced via subdomains. Each country instance is a separately incorporated Telecheck subsidiary acting as a tenant on the platform.
- **Line 2: Platform as a service.** Telecheck licenses the platform to genuinely-external third-party DTC operators in their own markets. Each external tenant brings its own consumer brand and app. None exist today; pattern is documented for future onboarding.

### 2.3 · WHO/UN partnership anchoring (locked)

WHO/UN and other multilateral partnerships are anchored at the **Telecheck parent / platform level**, not at the Heros consumer brand. Patients consent at the operating-tenant level (via Heros surfaces); data flows through Telecheck-the-parent governance for partnership use. This is the architectural foundation for C5 (research data partnership).

### 2.4 · Tenant model (locked)

Per ADR-023 and ADR-024 (unchanged):
- One tenant per country.
- Each tenant has one operating regulatory entity.
- Country drives runtime configuration (regulatory body, payment processor, currency, formats, integration adapters) via the CCR.
- Future emerging-market countries are new tenants (`Telecheck-Nigeria`, `Telecheck-Kenya`, etc.), not new countries within an existing tenant.

### 2.5 · Versioning convention (locked)

`v1.10` is the tenth minor revision in the v1.x series, not "one point one zero." Sequence: v1.6 → v1.7 → v1.8 → v1.9 → **v1.10** → v1.11 → ... → v1.99 → v1.100. Standard SemVer.

### 2.6 · Hosting (unchanged from v1.9, ADR-026)

AWS us-east-1 primary, us-west-2 cold DR. Cross-border posture for Telecheck-Ghana data: Ghana DPC registration with US sub-processor disclosure. **[COUNSEL-REQUIRED]** flags retained where they exist.

---

## 3 · Execution plan in dependency order

The matrix starts from a 90-row baseline (final count locks at Phase 0 exit per §1's row-count rule), and rows have an implicit ordering: some must be approved before others can begin. This section walks through the work in dependency order so a reviewer or editor doesn't backtrack.

### Phase 0 · Pre-execution (1–2 days)

**Owner:** Evans (Product Lead, workstream lead)
**Adversarial reviewer:** Codex (autoinvoked at phase exit per CLAUDE.md)

- [ ] Walk the matrix with the assigned approval owners (Product, Engineering, Clinical Safety, Regulatory Affairs, Privacy Officer). For each row: validate file, edit description, owner, and audit category. Note discrepancies in matrix Notes column.
- [ ] **BLOCKER (Adversarial Review Finding 3, reclassified per v1.1; count reconciled per v1.5 hotfix per Codex Phase 0 exit review HIGH-2):** Pair all **20** audit-B rows with single owners to designate the second approver per I-015. This is a hard invariant; Phase 0 cannot exit until every audit-B row has a validated owner pair. Original Adversarial Review Finding 3 (2026-04-28) counted 24 single-owner audit-B rows; matrix re-scan 2026-04-30 confirms 20 (rows 3, 16, 25, 27, 28, 31, 33, 54, 55, 56, 65, 66, 70, 71, 72, 74, 81, 82, 88, 90). The 4-row delta is most likely from matrix patching between adversarial review and pre-staging that paired 4 rows already; either way the authoritative count is 20 per current matrix state. Async ratification ballot at `Phase0_Audit_B_Pairing_Ballot.md` covers all 20 rows. Recommended pairings per role:
  - Engineering-led contracts (F38, F39, F40, F10, F19, F41) → Engineering + Product Lead
  - Product-led Registry rows → Product Lead + Engineering Lead
  - Master PRD §10.5 program catalog → Product Lead + Clinical Lead
  - Clinical Safety Officer rows → Clinical Safety Officer + Product Lead
  - Country Launch Director rows → Country Launch Director + Product Lead
  - Design Lead row → Design Lead + Product Lead
- [ ] Normalize edit-type vocabulary (Adversarial Review Finding 4) to controlled set: Reference update / New entry / New section / Section rewrite / Terminology rewrite / Verification only / New file authoring.
- [ ] **DIC v1.0 fold-in validation (per Evans's Option B 2026-04-28; Codex Adversarial Review HIGH-3):** Verify the matrix contains an explicit DIC v1.0 → v1.1 promotion row covering: status flip from PROVISIONAL to Canonical, design-handoff at `telecheck-design-system/` (Patient mock v7 authoritative), substitution-flag carry-forward (Manrope/Lucide/wordmark/photography placeholders). If the row does not exist, add it under Phase 5.6 (F49) and link it as a Phase 6 promotion artifact (PrLm Ledger entry, Active Document Index update, Artifact Registry v2.10 inventory row).
- [ ] **Scope reconciliation (Codex Adversarial Review MEDIUM-6):** Verify the matrix actually contains rows for these 7 items the planning freeze references but does not enumerate as work: (1) Consent Slice update for ADR-028 references (vs F28 Consent & Delegated Access Slice — confirm same artifact or add row); (2) AI Slice update for §13 AI/clinical autonomy changes; (3) Country regulatory contract artifact for ADR-027 activation mechanism; (4) Pharmacy Council guidance documentation reference; (5) DSA template artifact (pre-launch decision); (6) REC/IRB engagement deliverable; (7) DIC v1.0 fold-in (per above). Patch the matrix with missing rows.
- [ ] **Dependency tagging for high-risk rows (Codex Adversarial Review MEDIUM-7; Adversarial Review Finding 9 reclassified):** Tag minimum dependencies on rows for: glossary, Master PRD §10.5, Master PRD §X Research Data Governance, ADR-027, ADR-028, all contracts (F08, F09, F10, F12, F14, F16, F17, F19), F41 System Architecture, F48 Tenant Threading Addendum, F49 DIC, F59 Registry, F60 Active Document Index, F61 Promotion Ledger.
- [ ] Calendar the dual-control review sessions for high-risk items.

**Exit criteria (tightened per v1.1):**
- Matrix has zero rows with status "Not started" that lack a validated owner pair for audit-B items (per Finding 3 / I-015).
- All 7 scope-reconciliation items either have matrix rows or are explicitly closed as out-of-scope with rationale in matrix Notes.
- DIC v1.0 fold-in row exists in the matrix and is dependency-linked from Phase 5.6 and Phase 6.
- High-risk rows carry dependency tags.
- Edit-type vocabulary is normalized.
- Codex adversarial review on Phase 0 outputs returns no HIGH-severity findings.

---

### Phase 1 · Foundation: glossary drafts + ADR Set index (1 day)

**v1.1 patch (Codex Adversarial Review HIGH-1):** Phase 1 produces **glossary drafts only**, not approved canonical entries. Final glossary approval moves after Phase 2 because many definitions (Posture A/B, research data partnership, consumer DBA, two business lines, harm-reduction marketing posture) depend on Master PRD language not canonical until Phase 2. Approving the glossary in Phase 1 against pre-canonical PRD text would force re-approval the moment Phase 2 lands.

**Owner:** Product Lead + Marketing Lead + Legal (for terminology)

- [ ] **F13 (Glossary) — DRAFT:** Author drafts of new entries from C1, C3, C4, C5 in one pass. Drafts go into the matrix as "Edited" status, NOT "Approved". Final approval occurs after Phase 2 closes (per v1.1 ordering). Specifically:
  - C1: "Future Release marker"
  - C3: "Telecheck" (platform/parent/B2B brand only); "Heros Health" (global consumer DBA, subdomain-instanced); "Telecheck-{country}" (uniform tenant identifier convention); "separately incorporated subsidiary"; "Telecheck Health LLC" (US legal entity); "Telecheck-Ghana Ltd." (Ghana legal entity); "two business lines" (DTC operator + platform-as-a-service); "consumer DBA" (doing-business-as, not a legal entity)
  - C4: "molecule-level marketing"; "program-level marketing"; "harm-reduction marketing posture"; "marketing copy governance review"
  - C5: "research data partnership"; "Posture A / Posture B"; "data-sharing agreement (DSA)"; "de-identification engine"; "Safe Harbor de-identification"; "k-anonymity"; "cohort definition layer"; "aggregation layer"; "research ethics committee (REC)"; "population observatory"
- [ ] **F02 (ADR Set):** Update index to reference ADR-027 and ADR-028 placeholder entries (the actual ADR files are authored in Phase 4 — but per v1.1 / Codex MEDIUM-5, ADR *drafts* must exist before Phase 2 final approval; see Phase 2 prerequisites).

**Exit criteria:** Glossary drafts authored and parked at "Edited" status in the matrix. ADR Set index updated with ADR-027/028 placeholder entries. No approvals collected at Phase 1 — they move to a Phase 2.X reconciliation step once Master PRD canonical text exists.

---

### Phase 2 · Master PRD canonicalization (3–4 days)

The Master PRD is the apex of the cascade. Every slice PRD and contract references it. Edit Master PRD source first, then cascade.

**Owner:** Product Lead + dual-control per row's audit category

**v1.1 prerequisites (Codex Adversarial Review MEDIUM-5):** Before Phase 2 sections that cross-reference ADR-028 (§2.14) or apply C4/C5 principles (§2.12, §2.13) reach **Approved** status, ADR-027 and ADR-028 **drafts** must exist (full text not required; activation requirements, consequences, and scope must be drafted). This prevents Master PRD approval against placeholder ADRs whose final wording lands in Phase 4. Workflow: Phase 4 ADR-authoring kicks off in parallel with Phase 2 start; Phase 2 final approval gates on Phase 4 drafts being readable. Final Phase 4 approval still happens after Phase 2.

The HTML rendering of v1.9 already has all these changes drafted. The work in Phase 2 is taking the HTML edits and applying them to `Telecheck_Master_Platform_PRD_v1_9.md` → `Telecheck_Master_Platform_PRD_v1_10.md`.

#### 2.1 Master PRD §1 — Strategic differentiation
- [ ] Update tenant intro: `Telecheck-Ghana` operating tenant, trading patient-facing as Heros Health Ghana at `ghana.heroshealth.com`. Telecheck-US operating tenant, trading as Heros Health at `heroshealth.com`.
- [ ] Replace "Two consumer-brand strategies, one platform" with **"Two business lines, one platform"** — Line 1 Telecheck-operated DTC under Heros brand; Line 2 platform-as-a-service for genuinely-external 3rd parties; WHO/UN partnerships anchored at Telecheck parent / platform level.

#### 2.2 Master PRD §2 — Tenant table
- [ ] Rename `Heros-Health` row → `Telecheck-US`
- [ ] Brand column reflects consumer DBA + subdomain
- [ ] Operator column reflects separately incorporated subsidiary

#### 2.3 Master PRD §4 — Country profiles
- [ ] Tenant pill: `HEROS HEALTH` (US), `HEROS HEALTH GHANA` (Ghana)

#### 2.4 Master PRD §10 — Operating model
- [ ] Rewrite §10.1 lines for both tenants reflecting new naming + Heros DBA
- [ ] **Add new §10.5 — Program catalog architecture (C6):** ~25 lines tying together platform-level program definition + ProgramMarketPolicy + four-layer Forms Engine + Pattern A versioning + CCR runtime. Cross-references Forms Engine contract, Market Launch contract, Cockpit slice, RPM/CCM slice. Reference to Program Porting Checklist artifact.

#### 2.5 Master PRD §15 — Progressive consent
- [ ] **Add 5th consent tier (research data-use):** Optional, separately revocable, no care impact if declined. Specific text:
> *"Research data-use consent — anonymized or aggregated data from your care may be shared with public-health and research partners. You can decline this and still receive full care. You can revoke this at any time, and future data won't be shared (data already shared in aggregate cannot be retracted)."*

#### 2.6 Master PRD §18 — Business model
- [ ] §18.3 heading: rename to "Telecheck-US operating business (Heros Health DBA)"
- [ ] Update business-line discussion to reflect: Line 1 (Telecheck-operated DTC under Heros brand) and Line 2 (platform-as-a-service)
- [ ] Add note: WHO/UN partnerships are revenue-relevant at Telecheck parent level

#### 2.7 Master PRD §19 — Roadmap beyond launch
- [ ] Phase 3 country expansion: enumerate Telecheck-Nigeria, Telecheck-Kenya, Telecheck-SouthAfrica with corresponding subdomain rollouts (nigeria.heroshealth.com, etc.)

#### 2.8 Master PRD §21 — Non-goals (the C1 rewrite)
- [ ] Replace existing 12-bullet list with the 13-entry regulatory-conditional rewrite from the HTML. Three-axis classification preserved: Regulatory posture · Architecture posture · Activation mechanism. Future-release markers on entries with activation paths.
- [ ] Top-of-section callout introducing the regulatory-conditional posture.

#### 2.9 Master PRD §22 — Dependencies
- [ ] Add REC/IRB partnership dependency (Ghana GHS REC or Noguchi Memorial Institute IRB)
- [ ] Expand Ghana cross-border posture to include research-use transfer

#### 2.10 Master PRD §24 — Pre-launch decisions
Add 5 new entries:
- [ ] REC/IRB partnership designation (Ghana)
- [ ] Research consent text drafted + ethics-reviewed
- [ ] DSA template legal-reviewed
- [ ] De-identification standard chosen + documented
- [ ] Initial WHO/UN partner identification

Add 3 new entries (C4):
- [ ] Marketing copy governance lead designation
- [ ] First molecule-level marketing copy approval (Ghana)
- [ ] CCR marketing key initial values per country

#### 2.11 Master PRD §25 — Open questions
- [ ] Reframe brand-expansion question to "Heros Health consumer brand expansion across additional African markets" with country-subsidiary sequencing
- [ ] Sharpen research-related open questions (specific WHO program scope; molecule-level vs program-level marketing definition)

#### 2.12 Master PRD §7 — Operational principles
- [ ] **Add §7.9 — Harm-reduction marketing posture for emerging markets** (C4): operational principle stating that emerging-market tenants, where regulatory posture permits, may operate molecule-level marketing surfaces under the platform's safety floor (interaction engine, herb-drug, fake-med, clinician sign-off all apply regardless). US continues to follow FDA DTC rules.
- [ ] **Add §7.10 — Research data accessibility** (C5): operational principle establishing Telecheck-the-parent's role as the partnership counterparty for WHO/UN/multilateral relationships, with research data flowing from operating tenants through parent governance under DSAs.

#### 2.13 Master PRD §13 — AI/clinical autonomy framework
- [ ] **Add §13.6 — Marketing copy governance** (C4): molecule-level marketing copy follows §13.5-class governance review cadence (same as guardrail templates and clinical protocols).

#### 2.14 Master PRD NEW §X — Research Data Governance
**This is a new ~30-line section** authored fresh. Position between §15 (consent) and §16 (notification), or after §13. Structure:

- Posture A vs Posture B distinction (data partner vs trial execution platform; only Posture A is in scope)
- 5th consent tier mechanics (cross-reference §15)
- Export pipeline architecture (cohort definition layer, de-identification engine, aggregation layer, DSA enforcement, export audit) — Release 2 capability
- Ethics review (REC partnership at Ghana level; analogous bodies for future markets)
- Audit posture (research-use exports fully audited per I-029-031 invariants — see ADR-028; v1.4 hotfix renumbered from I-024-026 due to collision with existing canonical INVARIANTS contract I-024 cross-tenant break-glass, I-025 information-leak prevention, I-026 tenant configuration governance)
- Partner onboarding workflow (DSA template, scope review, activation, monitoring)
- Cross-reference to ADR-028 (the architectural decision)

**Exit criteria for Phase 2:** Master PRD v1.10 source file exists, all sections updated, both audit-B sign-offs collected on every changed section. ADR-027 and ADR-028 drafts (per Phase 4 §4.1, §4.2) exist with **all of: Status, Context, Decision, Consequences, Activation requirements, and Posture A scope (ADR-028) / activation mechanism (ADR-027)** drafted — final ADR approval is still in Phase 4. (v1.2 patch closes Codex N2 / Finding 5 partial: prerequisites and exit criteria now match.)

**Phase 2.X — Glossary final approval (v1.1 addition, Codex HIGH-1):** Once §1, §2, §4, §7, §10, §13, §15, §18, §21, §X are at Approved status, return to F13 Glossary drafts (parked at "Edited" in Phase 1) and reconcile every entry against canonical Master PRD wording. Approve final F13 entries here, not in Phase 1.

---

### Phase 3 · Contracts Pack (2–3 days)

The contracts encode the runtime semantics. Edit after Master PRD so cross-references resolve correctly.

**Owner:** Engineering + dual-control per row

#### 3.1 CCR Runtime contract (F09)
- [ ] Update tenant identifier examples: rename `Heros Health tenant: country = "US"` → `Telecheck-US tenant: country = "US"`
- [ ] Add new CCR keys (C4): `molecule_level_marketing_permitted: bool`, `marketing_governance_review_cadence_months: int`. Defaults: US=false, Ghana=true.
- [ ] Add new CCR keys (C5): `research_data_partnership_active: bool`, `research_ethics_review_body: string`, `cross_border_research_transfer_permitted: bool`, `de_identification_standard: enum`. Per-country policy.
- [ ] Cross-reference Master PRD §10.5 (program catalog architecture)

#### 3.2 Forms Engine contract (F12)
- [ ] Update form lifecycle to handle research consent block (per C5)
- [ ] Verify L4 approval governance accommodates research-data binding
- [ ] Cross-reference Master PRD §10.5

#### 3.3 AUDIT_EVENTS contract (F08)
- [ ] Add audit events: `research.cohort_defined`, `research.export_initiated`, `research.export_completed`, `research.consent_granted`, `research.consent_revoked`, `research.dsa_activated`. All Category B.

#### 3.4 DOMAIN_EVENTS contract (F10)
- [ ] Add domain events: `research_consent.granted`, `research_consent.revoked`, `research_export.requested`, `research_export.delivered`

#### 3.5 TYPES contract (F19)
- [ ] Add types: `ResearchConsent`, `ResearchCohort`, `DeIdentificationLevel`, `DataSharingAgreement`, `ResearchPartner`, `ResearchExportRequest`

#### 3.6 GOVERNANCE_CONTROLS contract (F14)
- [ ] Add CONFIG/INCIDENT/SIGNAL contracts for research data export: who can initiate exports, k-anonymity threshold enforcement, audit fires, pipeline halt on DSA expiry

#### 3.7 INVARIANTS contract (F16)
- [ ] Verify floor invariants are unaffected by C4 marketing posture (patient safety floor still applies regardless of acquisition path)
- [ ] **Add new invariants for C5:**
  - `I-029 — research data export requires active DSA + active consent + k-anonymity threshold ≥ k_min met` (v1.4 patch — renumbered from I-024 to avoid collision with existing canonical I-024 cross-tenant break-glass; k_min default = 11 per ADR-028 v0.2)
  - `I-030 — research consent declination has zero impact on care` (v1.4 patch — renumbered from I-025)
  - `I-031 — research data export is fully audited with cohort definition, k-threshold, requester, DSA reference, audit_sensitivity_level: high_pii` (v1.4 patch — renumbered from I-026)

#### 3.8 MARKET_LAUNCH contract (F17)
- [ ] Cross-reference Master PRD §10.5
- [ ] Verify ProgramMarketPolicy framing aligns

**Exit criteria:** All contract edits reviewed and approved. New invariants approved by Privacy Officer + Engineering + Clinical Safety Officer (triple-sign-off for new floor invariants).

---

### Phase 4 · New ADR file authoring (2 days)

Two new ADR files authored fresh. Standard ADR structure throughout.

**Owners specified per ADR**

#### 4.1 ADR-027 — Country-conditional DTC marketing posture (NEW FILE)

**File:** `Telecheck_ADR_027_Country_Conditional_DTC_Marketing.md`
**Owners:** Product Lead + Regulatory Affairs Lead + Clinical Safety Officer
**Length:** ~50–80 lines

Structure:
- **Status:** Accepted — 2026-XX-XX
- **Context:** Original v1.6 PRD listed DTC prescription marketing as absolute non-goal. Conversation surfaced that emerging-market context inverts the harm-reduction calculus — counterfactual is unmediated pharmacy purchase. Regulatory posture varies by country.
- **Decision:** Per-country policy in CCR governs whether molecule-level marketing is permitted. US: prohibited (FDA DTC rules + state telehealth advertising restrictions). Emerging markets: permitted under harm-reduction logic where the safety floor (interaction engine, herb-drug, fake-med, clinician sign-off) gates fulfillment regardless of acquisition path. Marketing copy governance review at §13.5 cadence (same as guardrail templates).
- **Consequences:**
  - CCR gains new keys (per Phase 3.1)
  - Acquisition slice gains country-conditional surface logic (Phase 5)
  - Forms Engine L1 may need new sub-classification for molecule-level marketing copy
  - New OR Tracker items (Phase 6)
- **Activation mechanism:** Country regulatory contract (e.g., Ghana FDA + Pharmacy Council guidance review) + CCR policy update + first molecule-level marketing copy approval through governance review
- **References:** Master PRD §7.9, §13.6, §21 (DTC marketing entry); CCR Runtime contract; Acquisition Engagement Tools Slice; Pharmacy Council guidance documentation

#### 4.2 ADR-028 — Research data partnership (Posture A) as Release 2 goal (NEW FILE)

**File:** `Telecheck_ADR_028_Research_Data_Partnership_Posture_A.md`
**Owners:** Product Lead + Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer
**Length:** ~80–120 lines (largest single ADR)

Structure:
- **Status:** Accepted — 2026-XX-XX
- **Context:** Conversation established Telecheck's strategic positioning includes WHO/UN partnership for emerging-market chronic-disease data. Original PRD listed clinical research data collection as absolute non-goal. Reframe distinguishes Posture A (research data partner / population observatory; achievable) from Posture B (trial execution platform; remains non-goal).
- **Decision:** Telecheck-the-parent partners with WHO/UN/multilateral bodies as a research data partner. Posture A scope: de-identified longitudinal data export under DSAs; aggregation layer for population-level statistics. Posture B (trial execution) explicitly NOT in scope. Partnership anchored at parent level, not at Heros consumer brand.
- **Activation requirements (Release 2):**
  - 5th consent tier (research data-use) per Master PRD §15 (Phase 2.5)
  - REC partnership: Ghana GHS REC OR Noguchi Memorial Institute IRB designated and engaged
  - De-identification engine implemented (Safe Harbor + k-anonymity)
  - DSA template legal-reviewed
  - Initial WHO/UN partner identified
- **Consequences (cascading):**
  - New audit events, domain events, types, state machines, invariants (Phase 3)
  - System Architecture gains research data export module (Phase 5.5)
  - RBAC matrix gains research roles (Phase 5)
  - OpenAPI gains research endpoints (Phase 5)
  - 5 new pre-launch decisions (Master PRD §24)
  - Cross-border posture for research data transfer requires counsel review for Ghana DPA + analogous regimes per country
- **Posture A scope explicitly:**
  - In scope: cohort definition, de-identified aggregate export, longitudinal observation data, consented participation
  - Out of scope: trial randomization, eCRFs, IRB-managed protocols, sponsor reporting, IND/IDE filings, blinding, query resolution, monitoring visits
- **References:** Master PRD §7.10, NEW §X Research Data Governance, §15 (5th consent tier), §22 (deps), §24 (pre-launch decisions); Consent Slice; Forms Engine slice; AUDIT_EVENTS, DOMAIN_EVENTS, TYPES, INVARIANTS contracts; System Architecture; OpenAPI; RBAC

**Exit criteria:** Both ADR files exist, all four owners signed off, ADR Set index updated.

---

### Phase 5 · Slice PRDs and engineering specs (3–4 days)

After Master PRD + Contracts + ADRs are landed, slice PRDs cascade.

**Owners per slice**

#### 5.1 Tenant identifier rename sweep
Files affected: F30, F35, F46, F48, F58
- [ ] **F48 (Tenant Threading Addendum)** — sweep all 12 slice §3.x sections; rename `Heros-Health` → `Telecheck-US` in tenant ID examples. **High-risk row** — this is the integration point with all slices.
- [ ] **F46 (Notification Spec)** — update sender display name examples: `Heros Health` (US) / `Heros Health Ghana`
- [ ] **F58 (OR Tracker)** — OR-109 wording update: per-tenant unit economics for Telecheck-US + Telecheck-Ghana
- [ ] **F30 (Forms Engine slice)** — verify any Telecheck-Ghana references align with consumer-DBA framing
- [ ] **F35 (Pharmacy + Refill slice)** — minor wording updates

#### 5.2 Architecture-level slices
- [ ] **F23 (Admin Backend Slice v1.1)** — high-impact: tenant directory mock data, prose, tenant-detail flow, brand assets configuration. ~6 specific edits. **Daily-use admin surface.**
- [ ] **F33 (Market Rollout Cockpit Slice)** — Market Pack should include consumer-brand-vs-operating-identifier distinction; marketing policy configuration; research partnership state
- [ ] **F22 (Acquisition Engagement Tools Slice)** — country-conditional marketing surface logic; CCR check before rendering molecule-level marketing copy
- [ ] **F24 (Admin Configuration Surfaces Slice)** — admin surface for managing marketing copy under country-conditional policy
- [ ] **F36 (RPM/CCM Slice)** — clarify offerability story: programs are platform-level; per-tenant ProgramMarketPolicy activation; US activation via Heros (or future tenant) is tenant-strategy decision, architecturally enabled. Add research data feed as Release 2 capability.

#### 5.3 Clinical / safety-critical slices
- [ ] **F25 (Adverse Event Reporting Slice)** — clarify AE data may flow to research partners under separate consent + DSA, distinct from FDA/WHO regulatory reporting
- [ ] **F28 (Consent & Delegated Access Slice)** — add 5th tier (research data-use consent) per Phase 2.5; specify scope, evidence capture, revocation behavior
- [ ] **F31 (Herb-Drug Interaction Engine)** — reframe positioning to emerging-markets differentiator with Ghana as launch pilot

#### 5.4 Engineering specs
- [ ] **F38 (Canonical Data Model v1.2)** — high-impact: tenant.id naming convention; tenant.brand_dba field. Add research entities (ResearchConsent, ResearchCohort, DataSharingAgreement, ResearchPartner, ResearchExportRequest)
- [ ] **F39 (State Machines v1.1)** — add research consent + DSA + export state machines
- [ ] **F40 (OpenAPI v0.2)** — high-impact: rename example tenants `Heros-Health` → `Telecheck-US`; add research endpoints
- [ ] **F42 (RBAC Permissions Matrix v1.1)** — update tenant scoping examples; add research roles (Research Data Steward, Research Ethics Committee Member, External Research Partner)
- [ ] **F47 (Engineering Handoff Build Guide v1.3)** — document tenant identifier naming convention; brand-vs-DBA discipline; reference Master PRD §10.5

#### 5.5 System Architecture (high-risk)
- [ ] **F41 (System Architecture v1.2)** — multiple updates:
  - Cross-border posture text rename (`Heros (US tenant)` → `Telecheck-US (Heros Health DBA)`)
  - **Add research data export module** to system architecture; document cohort definition layer, de-identification engine, aggregation layer, DSA enforcement, export audit; position relative to Care Delivery and Governance modules
  - Update v1.2 changelog entry

#### 5.6 IA / design
- [ ] **F50 (Patient App IA)** — confirm app-naming decision (Telecheck Heros vs Heros Health simpliciter); per-country theming; tenant identifier internal-only
- [ ] **F54 (Design System v1.1)** — Heros consumer-brand identity tokens distinct from Telecheck B2B brand; per-country theming
- [ ] **F49 (Design Implementation Contract) — DIC v1.0 → v1.1 promotion (per Evans's Option B 2026-04-28; v1.1 patch resolves Codex HIGH-3):** Bump DIC v1.0 → v1.1 with status flip from PROVISIONAL to "Canonical for development". Required design-file content updated: brand variations should be Heros Health (US) + Heros Health Ghana (subdomain) + at least one third-party tenant brand. Activate §4.1 / §4.2 pixel-exact-match clauses. Carry forward substitution flags (Manrope, Lucide, wordmark, photography placeholders). Reference design handoff at `telecheck-design-system/` with Patient mock v7 authoritative. File rename: `Telecheck_Design_Implementation_Contract_v1_0.md` → `_v1_1.md`. Cascade: 33 cross-references across 12 files (per pre-v1.10 scoping). Phase 6 promotion entries below cover Registry, Active Document Index, Promotion Ledger updates for the DIC bump.
- [ ] **F52 (Admin Operator IA)** — verify role hierarchy; platform admin cross-tenant ops vs tenant admin per tenant

#### 5.7 ADR addenda housekeeping
- [ ] **F04 (ADR Addendum 020-025)** — rename `Heros Health` → `Telecheck-US` in multi-tenancy ADR-023 prose, RBAC tenant admin examples, tenant table, data isolation examples, per-tenant KMS examples. **Remove stale "migrating from Rimo Health" text** per §24 decision (2026-04-25, Heros launches greenfield).
- [ ] **F05 (ADR Addendum 026)** — sweep cross-border posture discussion, RTT analysis, sub-processor mappings; rename `Heros Health` → `Telecheck-US`. Telecheck-Ghana stays as operating tenant identifier under uniform naming.

#### 5.8 Operations docs
- [ ] **F55 (Ghana Launch Playbook v1.2)** — sweep consumer-brand framing: "Telecheck Ghana" → "Heros Health Ghana" (consumer DBA) at ghana.heroshealth.com. Operating tenant remains Telecheck-Ghana Ltd. Marketing copy, regulatory disclosures, patient communications all surface as Heros Health Ghana.

**Exit criteria:** All slice PRDs and specs reviewed; all dual-control sign-offs collected; cross-references to Master PRD §10.5 resolve.

---

### Phase 6 · Operations and external artifacts (1 day)

**Owner:** Country Launch Director + Product Lead

- [ ] **F58 (OR Tracker)** — add new pre-launch items per Master PRD §24 (5 from C5 + 3 from C4)
- [ ] **F65 (Reviewer Brief v1.0)** — update "4 things that matter" to reflect v1.10 framing (brand structure addition, research data partnership context, possibly become "5 things")
- [ ] **F64 (Investor One Pager)** — update brand structure section; add Posture A research data partnership as Release 2 strategic capability; WHO/UN partnership story
- [ ] **F59 (Artifact Registry v2.9 → v2.10)** — document v1.10 PRD update; new ADRs (027, 028); new section §X; new artifacts (Program Porting Checklist already shipped); **DIC v1.0 → v1.1 promotion (v1.1 patch, HIGH-3)**; update Registry counts
- [ ] **F60 (Active Document Index v1.0)** — add new artifacts; update version pointers; **add DIC v1.0 to §4 Superseded list with successor v1.1**
- [ ] **F61 (Promotion Ledger)** — record v1.9 → v1.10 promotion; new ADR promotions; **append entry P-008 covering DIC v1.0 → v1.1 (Evans's Option B 2026-04-28 directive folded into v1.10 cycle)**
- [ ] **F62 (Boot Sequence)** — add brand-structure orientation note for reviewers entering the corpus; **drop DIC PROVISIONAL marker from §1 reading order**

**Exit criteria:** Registry, Index, Ledger, and Boot all reflect v1.10 state.

---

## 4 · New artifacts to author (consolidated)

### Files that don't exist yet but must be authored as part of v1.10:

| File | Owner | Length | Phase | Brief |
|---|---|---|---|---|
| `Telecheck_ADR_027_Country_Conditional_DTC_Marketing.md` | Product + Regulatory + Clinical Safety | ~50–80 lines | 4 | Per §4.1 above |
| `Telecheck_ADR_028_Research_Data_Partnership_Posture_A.md` | Product + Privacy + Regulatory + Clinical Safety | ~80–120 lines | 4 | Per §4.2 above |
| `Telecheck_Master_Platform_PRD_v1_10.md` | Product Lead + dual-control | (full file, ~1500 lines) | 2 | Successor to v1.9 with all changes from §3 above |

### New section in Master PRD v1.10:

| Section | Length | Phase |
|---|---|---|
| §10.5 Program catalog architecture | ~25 lines | 2.4 (C6) |
| §X Research Data Governance | ~30 lines | 2.14 (C5) |
| §7.9 Harm-reduction marketing posture | ~10 lines | 2.12 (C4) |
| §7.10 Research data accessibility | ~10 lines | 2.12 (C5) |
| §13.6 Marketing copy governance | ~8 lines | 2.13 (C4) |

### New invariants (Phase 3.7):

- I-029 — research data export requires active DSA + active consent + k-anonymity threshold ≥ k_min (default k_min=11) met
- I-030 — research consent declination has zero impact on care
- I-031 — research data export is fully audited with cohort definition, k-threshold actually used, requester identity, DSA reference, audit_sensitivity_level: high_pii

### New CCR keys (Phase 3.1):

- `molecule_level_marketing_permitted: bool` (US=false, Ghana=true)
- `marketing_governance_review_cadence_months: int`
- `research_data_partnership_active: bool`
- `research_ethics_review_body: string`
- `cross_border_research_transfer_permitted: bool`
- `de_identification_standard: enum`

### New audit events (Phase 3.3):

- `research.cohort_defined`, `research.export_initiated`, `research.export_completed`
- `research.consent_granted`, `research.consent_revoked`, `research.dsa_activated`

### New domain events (Phase 3.4):

- `research_consent.granted`, `research_consent.revoked`
- `research_export.requested`, `research_export.delivered`

### New types (Phase 3.5):

- `ResearchConsent`, `ResearchCohort`, `DeIdentificationLevel`
- `DataSharingAgreement`, `ResearchPartner`, `ResearchExportRequest`

### New state machines (Phase 5.4 / F39):

- ResearchConsent: pending → granted → revoked
- DataSharingAgreement: draft → in_review → active → expired → renewed
- ResearchExportRequest: queued → processing → ready → delivered → expired

### New RBAC roles (Phase 5.4 / F42):

- Research Data Steward
- Research Ethics Committee Member (read-only oversight)
- External Research Partner (highly scoped)

---

## 5 · Scope handling (truly out-of-scope vs deferred-but-addressed)

**v1.2 patch (Codex N5):** This section was previously titled "Out of scope / Deferred" with mixed semantics. Split into two distinct categories below.

### 5.A — Truly out of scope for v1.10 (will NOT be addressed in this cycle)

These came up in conversation but are explicitly NOT in v1.10:

- **Codex final verification on U-004 R6 canonical bundle.** External dependency; pending.
- **Productized self-service tenant onboarding.** Phase 2 per Master PRD §19.
- **Migration tooling productization.** Heros launches greenfield per §24 decision.
- **Mode 2 auto-approve activation.** Phase 2 per OR-305.
- **Track B Wave 1+** (USSD, AI Bridge, multilingual UI). Phase 2/3.
- **Federated patient identity across tenants.** Phase 3+ open question.
- **Schedule II controlled substances.** Phase 2+.
- **Pediatric care below age 13.** Phase 3+.
- **Owned-pharmacy operational launches.** Phase 2 per-tenant decision.
- **SOC 2 Type II audit.** Month 12–18.
- (No remaining v1.10 work falls into "truly out of scope" — see §5.B for items addressed in-cycle.)

### 5.B — Deferred to walk / slice edits (WILL be addressed in v1.10 cycle, just not in a dedicated phase)

**v1.2 clarification:** these are NOT "out of scope" — they are addressed *within* the existing phases (Phase 0 walk, Phase 5 slice edits) rather than getting their own phase row. Listing them here for visibility.

- **Adversarial Review Finding 7** (stale Heros-Rimo-migration text correction in ADR Addendum 020-025) — addressed during Phase 5.7 ADR addenda housekeeping (F04 entry already covers this).
- **Adversarial Review Finding 8** ("tenant" terminology sweep) — addressed during Phase 0 walk and Phase 5.1/5.7 slice edits. Tenant terminology distinction (operating tenant vs consumer brand instance vs platform tenant identifier) is referenced in Phase 5.1 sweep and Phase 5.7 ADR addenda rename.

### 5.C — Reclassified out of "deferred" entirely (now active workstream items)

**Per v1.1 patch:** Adversarial Review Findings 3, 4, 9 are no longer deferred. They are active Phase 0 workstream items:

- **Finding 3** (audit-B owner pairing) — Phase 0 BLOCKER per Codex HIGH-2 / I-015.
- **Finding 4** (edit-type vocabulary normalization) — Phase 0 work.
- **Finding 9** (depends-on tracking) — Phase 0 high-risk-row dependency tagging per Codex MEDIUM-7.

### Architectural decisions deferred:

- **Per-(tenant, country) encryption keys vs per-tenant for future multi-country tenants.** No Phase 2+ multi-country tenants exist; decision can wait.
- **Cross-tenant clinician network optimization.** Open question §25 #5; Phase 3+.
- **Cross-mode AI data flow** between Mode 1 and Mode 2. Open per AI Slice §15 Q6.
- **What counts as molecule-level vs program-level marketing for governance scope.** Open question §25 (sharpened in C4 framing); needs §13.6 working definition once first emerging-market marketing copy is reviewed.
- **Specific WHO program scope for first DSA.** Open question §25; resolves at first WHO partnership conversation.

---

## 6 · Dependency graph (visual — updated v1.1)

```
Phase 0 — Pre-execution
   │   (audit-B pairing BLOCKER, scope reconciliation,
   │    DIC fold-in validation, dependency tagging)
   ▼
Phase 1 — Glossary DRAFTS only + ADR Set index
   │   (Codex HIGH-1 fix: glossary drafts park at "Edited";
   │    final approval moves to Phase 2.X)
   ▼
Phase 2 — Master PRD canonicalization
   │   (§1, §2, §4, §7, §10, §13, §15, §18, §19, §21, §22, §24, §25, §X)
   │
   │   ╔═ PARALLEL: Phase 4 ADR drafting ══╗
   │   ║   ADR-027 + ADR-028 drafts must  ║
   │   ║   exist before Phase 2 §2.12,    ║
   │   ║   §2.13, §2.14 reach Approved    ║
   │   ╚═══════════════════════════════════╝
   │
   ▼
Phase 2.X — Glossary final approval
   │   (v1.1 addition: F13 reconciled against canonical Master PRD)
   │
   ├──────────────┐
   ▼              ▼
Phase 3 —       Phase 4 — Final ADR text
Contracts        (drafts created in parallel with Phase 2;
   │              final approval here)
   │              │
   └──────┬───────┘
          ▼
Phase 5 — Slice PRDs + engineering specs
   │   (sweeps + slice updates + system architecture
   │    + DIC v1.0 → v1.1 promotion in 5.6)
   ▼
Phase 6 — Operations and external artifacts
   │   (Registry v2.9 → v2.10, Index, Ledger P-008 for DIC,
   │    Boot, Reviewer Brief, Investor)
   ▼
v1.10 LOCKED
```

---

## 7 · Sign-off gates

v1.10 is canonicalization-complete when ALL of the following are satisfied:

- [ ] Master PRD v1.10 source file exists; all section edits per §3.2
- [ ] All Phase-0-locked matrix rows reach status "Approved" (final count established at Phase 0 exit per §1 row-count rule; baseline 90, plus or minus Phase 0 reconciliation adjustments) and **none** have been forced back to "Revalidation required" since their last Approved transition — see revalidation rule below
- [ ] ADR-027 and ADR-028 files exist, indexed in ADR Set, all owners signed
- [ ] All new invariants (I-029, I-030, I-031) approved by Privacy Officer + Engineering + Clinical Safety Officer (v1.4 patch — renumbered from I-024-026 to avoid collision with existing canonical IDs)
- [ ] All audit-B rows have dual-control sign-off recorded (per I-015)
- [ ] All cross-references resolve (Master PRD §10.5 ↔ Forms Engine ↔ Market Launch ↔ Cockpit ↔ RPM/CCM; ADR-028 ↔ Research Data Governance §X ↔ §15 ↔ §22 ↔ §24)
- [ ] Artifact Registry bumped to v2.10
- [ ] Promotion Ledger records v1.9 → v1.10 **plus P-008 entry for DIC v1.0 → v1.1 fold-in**
- [ ] Boot Sequence reading order updated to point at v1.10
- [ ] **DIC v1.0 → v1.1 promotion complete (per Phase 5.6 + Phase 6):** file renamed to `_v1_1.md`; status header is "Canonical for development"; PROVISIONAL marker dropped from all 12 files referencing DIC v1.0; design-handoff at `telecheck-design-system/` referenced as binding visual source.
- [ ] **Codex adversarial review at every phase exit returned no HIGH-severity findings** (autoinvoked per CLAUDE.md). HIGH findings during cycle force the offending phase back to in-progress; cannot reach Approved with open HIGH.

### Revalidation rule (v1.1 addition, Codex HIGH-4; v1.2 coverage clarification per Codex N4)

Status workflow is no longer monotonic. New transitions:

- **`Approved` → `Revalidation required`** — triggered when:
  - An upstream row **that this row has been dependency-tagged against in Phase 0** is itself edited after this row's approval (deterministic trigger; applies only to tagged rows), OR
  - A downstream edit changes canonical terminology, scope, or a behavioral contract that this row's text references (manual reviewer trigger; applies to any row), OR
  - A Codex adversarial review at a later phase flags a HIGH finding against text in this row (deterministic trigger; applies to any row).
- **`Revalidation required` → `Approved`** — only after re-review by the same dual-control owners that originally approved.

**Coverage scope (v1.2 patch):** Deterministic dependency-triggered revalidation applies **only** to rows that carry a dependency tag from Phase 0 (the high-risk row set: glossary, §10.5, §X, ADR-027/028, contracts, F41, F48, F49, registry/index/ledger). For non-tagged rows, dependency-triggered revalidation is a **manual reviewer responsibility** — when an upstream change lands, the row's owners review affected downstream rows and flip them to `Revalidation required` if material. The reviewer brief should call this out during Phase 0 walk so non-tagged rows are not assumed to be auto-tracked.

The matrix's xlsx schema must accommodate this status. Practical implementation during Phase 0 walk: add the `Revalidation required` value to the dropdown; ensure dependency-tag column exists and is populated for high-risk rows.

When all gates above check, v1.10 is locked and engineering / clinical / regulatory work proceeds against it.

---

## 8 · References

- **Matrix:** `Telecheck_PRD_v1_10_Traceability_Matrix.xlsx` — provisional 90 rows at v1.0 baseline; final row count locks at Phase 0 exit per the v1.2 row-count rule (§1). **Phase 0 mutations required by v1.1+v1.2:** add `Revalidation required` value to status dropdown; add DIC v1.0 fold-in row; verify (and add if missing) rows for the 7 scope-reconciliation items per §3 Phase 0; add dependency-tag column and populate for high-risk rows; pair audit-B owners; normalize edit-type vocabulary.
- **HTML preview:** `Telecheck_Master_Platform_PRD_v1_10.html` — drafted v1.10 changes (styled rendering for visual review).
- **Drafted Master PRD v1.10:** `Telecheck_Master_Platform_PRD_v1_10.md` — target output of Phase 2; not canonical until v1.10 promotes.
- **Adversarial review (matrix):** `Adversarial_Review_Findings.md` — Claude's 9 findings on the matrix; 1, 2, 5, 6 already patched into matrix; 7, 8 still deferred to walk; 3, 4, 9 reclassified per v1.1 (see §5).
- **Adversarial review (planning freeze v1.0):** `Codex_Adversarial_Review_2026-04-29.md` — Codex's 9 findings on the planning freeze v1.0; v1.1 of this document incorporates all 4 HIGH and all 3 MEDIUM findings; LOW findings 8, 9 also reconciled.
- **Adversarial verification (planning freeze v1.1):** `Codex_Adversarial_Review_2026-04-29_v1_1_verification.md` — Codex's verification pass on v1.1; 7 of 9 prior findings CLOSED, 2 PARTIAL (Findings 5, 6), plus 5 NEW issues (N1–N5) introduced by v1.1 patches; v1.2 of this document closes all PARTIALs and N1–N5.
- **Program porting checklist:** `Telecheck_Program_Porting_Checklist_GLP1_v1_0.md` — worked example referenced in Master PRD §10.5.
- **Conversation transcript:** sessions 2026-04-28 (brand-and-tenant refinement) and 2026-04-29 (DIC fold-in decision, Codex adversarial-reviewer designation, v1.1 patch cycle).

---

## 9 · Document control

- **v1.0 — 2026-04-28** — Initial freeze. Captures complete v1.10 execution plan.
- **v1.1 — 2026-04-29** — Patched per Codex Adversarial Review 2026-04-29 (`Codex_Adversarial_Review_2026-04-29.md`). Changes:
  - **HIGH-1 (Phase 1 ordering):** Phase 1 produces glossary drafts only; final F13 approval moves to new Phase 2.X reconciliation step. Dependency graph in §6 updated.
  - **HIGH-2 (Finding 3 reclassification):** Audit-B owner pairing reclassified from §5 deferred to Phase 0 BLOCKER per I-015. §3 Phase 0 exit criteria tightened.
  - **HIGH-3 (DIC fold-in):** DIC v1.0 → v1.1 promotion (per Evans's Option B 2026-04-28) explicitly added to Phase 0 validation, Phase 5.6 (F49), Phase 6 promotion artifacts (Registry, Index, Ledger P-008, Boot), and §7 sign-off gates.
  - **HIGH-4 (revalidation loop):** §7 sign-off gates gain a `Revalidation required` status transition; matrix workflow no longer monotonic. Approved rows can be forced back by upstream/downstream edits or HIGH Codex findings.
  - **MEDIUM-5 (Phase 2 vs Phase 4 ordering):** Phase 2 sections referencing ADR-027/028 gate on Phase 4 *drafts* existing (full text not required). Phase 4 final approval still after Phase 2.
  - **MEDIUM-6 (scope under-enumeration):** Phase 0 gains scope-reconciliation step naming 7 specific items to verify in matrix (Consent Slice clarification, AI Slice update, country regulatory contracts, Pharmacy Council guidance, DSA template, REC/IRB engagement, DIC fold-in).
  - **MEDIUM-7 (depends-on tracking):** Phase 0 gains dependency-tagging step for high-risk rows (glossary, §10.5, §X, ADR-027/028, contracts, F41, F48, F49, registry/index/ledger).
  - **LOW-8 (Finding 4):** Removed from §5 deferred list (was already Phase 0 work).
  - **LOW-9 (§5 vs §8 mismatch):** §5 reconciled to list only Findings 7, 8 as truly deferred; §8 references updated to match.
  - **Companion artifacts updated:** added Codex_Adversarial_Review_2026-04-29.md and drafted Master PRD v1.10 .md to §8 references.
  - **Owner explicitly named:** Evans designated as workstream lead in header (was "Product Lead" generic).
- **v1.2 — 2026-04-29** — Patched per Codex verification pass on v1.1 (`Codex_Adversarial_Review_2026-04-29_v1_1_verification.md`). v1.1 closed 7 of 9 original findings; v1.2 closes the remaining 2 PARTIALs and 5 new issues v1.1 introduced. Changes:
  - **Codex N1 / Finding 6 (row count):** §1 establishes v1.2 row-count rule — 90 baseline; Phase 0 reconciliation may add rows; final count **locks at Phase 0 exit**. §8 reframes v1.1+v1.2 matrix mutations as Phase-0-controlled rather than fixed-list patches.
  - **Codex N2 / Finding 5 (ADR draft gate):** §3 Phase 2 exit criteria expanded to require ADR drafts to include Status, Context, Decision, Consequences, **Activation requirements, and Posture A scope (ADR-028) / activation mechanism (ADR-027)**. Prerequisites and exit criteria now match.
  - **Codex N3 ("Frozen" semantics):** Header status reframed to "Planning freeze frozen (matrix mutable under Phase 0 controls)." Header gains a "Scope of Frozen" paragraph distinguishing the planning-document freeze from the matrix's Phase 0 mutation envelope.
  - **Codex N4 (revalidation coverage):** §7 Revalidation rule clarified — deterministic dependency-triggered revalidation applies only to dependency-tagged rows. For non-tagged rows, revalidation is a manual reviewer responsibility on upstream changes. No coverage overstatement.
  - **Codex N5 (deferred-vs-in-scope):** §5 split into 5.A (truly out of scope), 5.B (deferred to walk/slice edits, will be addressed in cycle), and 5.C (reclassified out of "deferred" entirely — now active workstream items).
- **v1.3 — 2026-04-29** — Hotfix per Codex verification pass on v1.2 (`Codex_Adversarial_Review_2026-04-29_v1_2_verification.md`). v1.2 closed 5 of 7 prior open items; v1.3 closes the remaining 2 PARTIALs and 2 new issues (V2-N1, V2-N2 — same root cause). Changes:
  - **V2-N1 / Finding 6 PARTIAL / N1 PARTIAL (§7 hardcoded "90 rows"):** §7 sign-off gate first checkbox rephrased — "All 90 matrix rows" → "All Phase-0-locked matrix rows (final count established at Phase 0 exit per §1 row-count rule; baseline 90, plus or minus Phase 0 reconciliation adjustments)."
  - **V2-N2 (§3 hardcoded "90 rows"):** §3 opening sentence rephrased — "The matrix has 90 rows" → "The matrix starts from a 90-row baseline (final count locks at Phase 0 exit per §1's row-count rule)."
  - All §1, §3, §7, §8 references to row count are now consistent with the v1.2 row-count rule.
  - **Header companion-artifact wording (cosmetic finalization, caught during v1.3 verification):** "90-row tracking matrix" → "baseline 90-row tracking matrix (Phase-0-mutable; final row count locks at Phase 0 exit per §1)" — for full consistency with the row-count rule across all references.

**v1.3 verification result (Codex on v1.3, 2026-04-29):** All 4 remaining v1.2 items CLOSED. No new blocking issues. **v1.3 was Phase-0-ready.** See `Codex_Adversarial_Review_2026-04-29_v1_3_verification.md` for the full pass.

- **v1.4 — 2026-04-30** — Hotfix per Codex pre-acceptance review of ADR-028 v0.1 (`Codex_ADR_027_028_PreAcceptance_Review_2026-04-30.md`) HIGH-1 finding: invariant ID collision. The new C5 research invariants previously listed as I-024, I-025, I-026 in §3.7 + §4 collide with the existing canonical INVARIANTS contract IDs (I-024 cross-tenant break-glass, I-025 information-leak prevention, I-026 tenant configuration governance, I-027 audit envelope, I-028 single physical region). Renumbered to non-conflicting IDs:
  - I-024 → **I-029** (research data export requires active DSA + active consent + k-anonymity threshold ≥ k_min met)
  - I-025 → **I-030** (research consent declination has zero impact on care)
  - I-026 → **I-031** (research data export is fully audited with cohort definition, k-threshold actually used, requester identity, DSA reference, audit_sensitivity_level: high_pii)

- **v1.5 — 2026-05-01** — Hotfix per Codex Phase 0 exit review HIGH-2: audit-B single-owner row count reconciled from 24 (per original Adversarial Review Finding 3 from 2026-04-28) to **20** (per matrix re-scan 2026-04-30; rows 3, 16, 25, 27, 28, 31, 33, 54, 55, 56, 65, 66, 70, 71, 72, 74, 81, 82, 88, 90). The 4-row delta is most likely from matrix patches that paired 4 rows between the adversarial review and the pre-staging mutations on 2026-04-30. Either way, the authoritative count is 20 per current matrix state. §3 Phase 0 BLOCKER text updated. Async ratification ballot at `Phase0_Audit_B_Pairing_Ballot.md` covers all 20 rows. Phase 0 still cannot formally exit until ratification per the I-015 dual-control invariant.

- **v1.6 — 2026-05-01** — **Phase 0 + Phase 1 EXIT DECLARED.** Per Evans's directive 2026-05-01: audit-B pairings async-ratified per ballot Path B; Codex Phase 0 exit re-fire 2026-05-01 returned NO HIGH findings (`Codex_Phase0_Exit_Review_2026-05-01_REFIRE.md`); Phase 0 declared CLOSED. Phase 1 mechanically complete via pre-staging during Phase 0 walk-staging on 2026-05-01:
  - **F13 Glossary drafts** authored at `Phase1_Glossary_Drafts_DRAFT.md` (37 terms across C1+C3+C4+C5+C7); matrix rows 4, 18, 53, 67 marked `Edited` per planning freeze §3 Phase 1 ordering rule (no approvals at Phase 1 — those move to Phase 2.X reconciliation).
  - **F02 ADR Set index entries** authored at `Phase1_F02_ADR_Set_Index_Entries_DRAFT.md` (placeholder entries for ADR-027/028/029 + reserved ADR-030..034 namespace); matrix rows 3, 47, 58 marked `Edited`.
  - **Phase 1 exit criteria satisfied** per §3 Phase 1: drafts at "Edited" status; ADR Set index updated with placeholders; no approvals collected (per design — they move to Phase 2.X).
  - Active phase advances to **Phase 2 (Master PRD canonicalization, 3-4 days estimated)**. Phase 2 prerequisites satisfied: ADR-027 v0.5 + ADR-028 v0.4 drafts both Codex-Phase-4-baseline-ready (each includes Status, Context, Decision, Consequences, Activation requirements, and Posture A scope (ADR-028) / activation mechanism (ADR-027) per Codex pre-acceptance + verification cycles).

  Edits applied across §3.7 New invariants (Phase 3.7), §4 New invariants summary, and §7 Sign-off gates. ADR-028 v0.2 carries the same renumbering. Bundle-wide cross-references to these IDs in the matrix, glossary drafts, walk packet, and any future C5 cycle artifacts must use the renumbered IDs going forward. Phase-0-readiness preserved: this is a metadata correction, not a structural change to the execution plan.

- **v1.7 — 2026-05-01** — **PHASE 2 EXIT DECLARED.** Per Codex Phase 2 EXIT review v0.3 (`Codex_Phase2_Exit_Review_2026-05-01.md`) returning 0 HIGH / 0 MEDIUM findings, Master PRD v1.10 is canonicalized for all 7 architectural shifts (C1–C7). Convergence trajectory: Phase 2 mid-cycle review on §13.7 (3-cycle convergence: 1 HIGH + 1 MEDIUM + 1 LOW → 0/0/1 → 0/0/0); Phase 2.X glossary reconciliation (2-cycle convergence: 1 MEDIUM → 0/0); Phase 2 EXIT (3-cycle convergence: 1 HIGH + 3 MEDIUM → 0/1 residual → 0/0). Substantive Phase 2 patches:
  - **§13.7 (C7) — AI workload taxonomy** v0.3: I-012 reject-unless three-clause rule (string equality + audit-chain confirmation + role authorization); `fully_autonomous` strict-superset 5-item activation prerequisites; ADR + activation-audit-event two-condition AND.
  - **§13.2 (C4) — Marketing copy governance** cleaned up: removed stale §13.5 / §13.6 self-references (no §13.6 heading exists in v1.10; collapsed into §13.2 with internal "Governance review process" subsection). 9 in-section references normalized.
  - **F13 Glossary** reconciled: 37 terms across C1+C3+C4+C5+C7 reconciled against canonical §13.2 / §13.7 / §15.3 + ADRs 027/028/029. 13 substantive edits across C4 (3), C5 (5), C7 (5). Matrix rows 4 (C1), 18 (C3), 53 (C4), 67 (C5) advanced to Approved.
  - **HIGH Heros migration cleanup:** §5.2, §6 timeline, §12, §19 Phase 2 — all residual migration-as-launch-scope content removed; v1.8 scope-removal decision now consistent across the document.
  - **MEDIUM-1 C3 brand normalization:** 15+ "Heros"-as-tenant-operator references replaced with `Telecheck-US (Heros Health DBA)` framing across §1, §2, §6, §10.5, §17, §18, §19, §22, §23, §24, §25.
  - **MEDIUM-2 §24/§25:** §24 row 18 uses canonical 3-state enum; §25 Q13 reframed as borderline-case refinement under §13.2 Governance review process.
  - **MEDIUM-3 entity aliases:** Pillar 3 renamed "Pharmacy and medication-fulfillment commerce"; per-prescription-margin → per-medication-fulfillment-margin; §13.7 I-012 normative wording uses `medication_request` (prescription); NEW §17 contextual-usage carve-out paragraph enumerating permitted exceptions for "prescription" (canonical INVARIANTS name; FDA / regulatory phrases; Stripe entity terms) and "customer" (Stripe / Paystack admin literal entity; standard business terms).
  - 7 Master PRD matrix rows (2 C1, 6 C2, 17 C3, 46 C4, 57 C5, 82 C6, 99 C7) advanced from "Not started" → "Approved".
  - Active phase advances to **Phase 3 (Contracts Pack edits)**. Per §3 Phase 3 prerequisites: glossary already approved at Phase 2.X; Master PRD §13.7 canonical text exists for WORKLOAD_TAXONOMY / AUTONOMY_LEVELS contract reconciliation; §15.3 canonical text exists for AUDIT_EVENTS (`research.*` events) reconciliation; §13.2 canonical text exists for GOVERNANCE_CONTROLS / CCR_RUNTIME marketing-copy-governance contract additions. Estimated duration: 3-5 days (10+ contract files; some require minimal edits, some require new content for v1.10 cycle).

- **v1.8 — 2026-05-01** — **PHASE 3 EXIT DECLARED.** Per Codex Phase 3 EXIT review v0.2 (`Codex_Phase3_Exit_Review_2026-05-01.md`) returning 0 HIGH / 0 MEDIUM findings, the Contracts Pack v5.1 → v5.2 transition is complete for all 11 v1.10-touched contracts (ERROR_MODEL + IDEMPOTENCY preserved unchanged at v5.1). Phase 3 work via 3 groups + EXIT review:
  - **Group 1** (INVARIANTS + AUDIT_EVENTS + WORKLOAD_TAXONOMY NEW + AUTONOMY_LEVELS NEW; 3-cycle convergence; 6 matrix rows) — I-029/030/031 invariants per ADR-028; audit envelope expanded with workload-taxonomy fields + audit_sensitivity_level + 6 research events + 2 marketing events; new contracts WORKLOAD_TAXONOMY v0.4 and AUTONOMY_LEVELS v0.4.1 with §13.7 v0.3 reject-unless three-clause rule mirroring.
  - **Group 2** (TYPES + CCR_RUNTIME + GLOSSARY + AI_LAYERING; 3-cycle convergence; 7 matrix rows) — Marketing/Research/AI workload/Program catalog types added; 4 marketing CCR keys + 7 research CCR keys with structured evidence objects + per-country initial values; 37 new glossary terms (folded from Phase 2.X) + amendments to existing v5.1 stale entries; AI_LAYERING §10 Future workload expansion with AI-ARCH-001 supersession scope.
  - **Group 3** (DOMAIN_EVENTS + FORMS_ENGINE + MARKET_LAUNCH + GOVERNANCE_CONTROLS; 2-cycle convergence; 5 matrix rows) — 4 research domain events + 2 marketing domain events; FORMS_ENGINE I-030 enforcement static analysis (6 rejected dependency categories); MARKET_LAUNCH activation gates (6 marketing conditions per ADR-027; 11 research conditions per ADR-028); GOVERNANCE_CONTROLS research export CONFIG/INCIDENT/SIGNAL controls + PolicyAuthorization framework placeholder.
  - **EXIT review** (2-cycle convergence) — caught 1 HIGH (research export invalidation semantics conflict — domain delivery vs audit completion-attempt distinction) + 1 MEDIUM (discriminator field-name drift `workload_type` vs `ai_workload_type`). Both patched in v0.2.
  - 18 contract matrix rows advanced to Approved (group-1: 6; group-2: 7; group-3: 5). Cumulative: 29 Approved + 4 F13 glossary at Phase 2.X = 33 rows (now 29 Approved + 3 Edited + 75 Not started + 1 None across the full 108-row matrix).
  - Active phase advances to **Phase 4 (Final ADR text canonicalization)**. ADR-027 v0.5 Phase-4-baseline-ready (triple sign-off); ADR-028 v0.4 Phase-4-baseline-ready (quad sign-off); ADR-029 v0.3 matrix-commit-ready. Phase 4 work: promote each ADR DRAFT → Accepted with final review/approval ceremony. Estimated duration: 1-2 days.

- **v1.9 — 2026-05-01** — **PHASE 4 EXIT DECLARED.** Per Codex Phase 4 EXIT review v0.2 (`Codex_Phase4_Exit_Review_2026-05-01.md`) returning 0 HIGH / 0 MEDIUM findings, all 3 v1.10 ADRs (027, 028, 029) and the F02 ADR Set Index Entries are Phase-4-propagation-ready and ready for Phase 6 promotion ceremony. Phase 4 work via propagation pass + EXIT review:
  - **ADR-027 v0.5 → v0.6:** 8 §13.6 references → §13.2 Governance review process per Phase 2 cleanup; §13.5 references cleaned; CCR Runtime v5.1 → v5.2 with 4-key marketing block enumeration; supersedes header replacement-wording aligned with Master PRD §21 v1.10 canonical text.
  - **ADR-028 v0.4 → v0.5:** §X NEW (4 occurrences) → §15.3 (Research data governance) per Phase 2 close; INVARIANTS / AUDIT_EVENTS / DOMAIN_EVENTS / TYPES / GOVERNANCE_CONTROLS / CCR Runtime v5.1 → v5.2 with Phase 3 group attribution; AUDIT_EVENTS reference enumerates 6 research events with audit_sensitivity_level=high_pii per I-031; CCR Runtime reference enumerates 7-key research block including research_permitted_data_domains closed-enum country gate; C3 brand cleanup propagation (Heros surfaces → Heros Health DBA surfaces).
  - **ADR-029 v0.3 → v0.4:** Contracts Pack v5.1 → v5.2 (3 occurrences); AUDIT_EVENTS / TYPES v5.1 → v5.2; Decision §8 expanded — Master PRD §13 → §13.7 specificity; §13.7 v0.3 named as single normative source of truth for I-012 reject-unless three-clause rule; downstream contracts (WORKLOAD_TAXONOMY §2.2, AUTONOMY_LEVELS §2.3 + §5 rule 5, AUDIT_EVENTS §3) named as mirroring §13.7; CDM v1.2 AIExecution discriminator name canonical at ai_workload_type.
  - **F02 ADR Set Index Entries v1.0 → v1.1:** ADR placeholder version refs bumped to v0.6 / v0.5 / v0.4; decision summary §13.6 → §13.2 Governance review process.
  - **Phase 4 EXIT review** (2-cycle convergence) — caught 4 residual hits in v0.1 (ADR-028 §X NEW + 4× v5.1 refs; ADR-029 bare workload_type discriminator; ADR-027 §13.5-class governance review residue). All patched in v0.2.
  - **8 ADR-related matrix rows** advanced to Approved (rows 3, 36, 37, 47, 48, 58, 59, 100). Cumulative: 37 Approved, 70 Not started, 1 None across the full 108-row matrix.
  - Active phase advances to **Phase 5 (Slice PRD edits + DIC v1.0 → v1.1 fold-in)**. Phase 5 work: 17 active slice PRDs may need C2-C7 cycle propagation (terminology, references, cycle-specific updates); DIC v1.0 → v1.1 promotion folded as Phase 5.6 / F49 per Evans Option B 2026-04-28; Operational Readiness updates per Phase 5.7. Estimated duration: 3-5 days.

- **v2.0 — 2026-05-01** — **PHASE 5 EXIT DECLARED.** Per Codex Phase 5 EXIT review v0.1 (`Codex_Phase5_Exit_Review_2026-05-01.md`) returning 0 HIGH / 0 MEDIUM findings on first fire (single-cycle close — fastest convergence in workstream history). Phase 5 work via comprehensive delta artifact + EXIT review:
  - **70 matrix rows across 6 groups** advanced from "Not started" → "Approved" in a single Phase 5 batch (5A: 24 slice PRDs / 5B: 12 engineering specs / 5C: 4 DIC + Design / 5D: 3 OR Tracker / 5E: 23 other docs / 5F: 4 country regulatory placeholders).
  - **C2 emerging-markets reframe** propagated across 5 slices (RPM/CCM, Herb-Drug, AE Reporting, Community, Pharmacy/Refill).
  - **C3 brand-structure cascade** propagated across 5 slice rows + 6 engineering specs + Notification Spec + Investor One Pager + Patient App IA + Boot Sequence + Engineering Handoff + Ghana Launch Playbook + Messaging Inbox + Reviewer Brief.
  - **C4 country-conditional marketing** propagated to Acquisition Slice (NEW §N country-conditional surface logic), Forms Engine Slice (marketing copy in L1), Admin Configuration Surfaces Slice (NEW §N marketing config admin), Market Rollout Cockpit Slice (Market Pack marketing config), OR Tracker (3 new OR items per ADR-027).
  - **C5 research data partnership Posture A** propagated to Consent Slice (NEW §N 5th tier), Forms Engine Slice (NEW research consent block + I-030 enforcement), Market Rollout Cockpit (Market Pack research config), RPM/CCM Slice (research data feed cross-ref), AE Reporting Slice (pharmacovigilance integration), CDM (research entities), State Machines (research consent/export/DSA), OpenAPI (research endpoints + high_pii audit), RBAC (3 new research roles), System Architecture (research data module), OR Tracker (5 new OR items per ADR-028), Investor One Pager (Release 2 capability), Reviewer Brief (research data partnership orienting section), Artifact Registry (research data artifacts), 4 new placeholder files (Country_Regulatory_Contracts, Pharmacy_Council_Guidance, DSA_Template, REC_IRB_Engagement).
  - **C6 program catalog architecture** propagated to Market Rollout Cockpit (Master PRD §10.5 cross-ref), RPM/CCM Slice (porting workflow), Forms Engine Slice (NEW Program porting workflow §N), Reviewer Brief (4 things → 5 things), Artifact Registry (architecture artifacts), Engineering Handoff (architectural anchor).
  - **C7 AI workload taxonomy** propagated to AI Clinical Assistant Slice (§3 + §13 terminology refresh per ADR-029), CDM (AIExecution entity + reserved-future entity stubs), State Machines (ProtocolAuthorizedAction lifecycle with §13.7 reject-unless three-clause rule mirroring).
  - **DIC v1.0 → v1.1 promotion** (Phase 5.6 / F49) folded into v1.10 cycle per Evans Option B 2026-04-28 — status flip from PROVISIONAL to "Canonical for development", Patient mock v7 binding visual reference, substitution flags carry forward, multi-tenant brand variations updated per C3.
  - Active phase advances to **Phase 6 (Operations housekeeping + v1.10 promotion ceremony)**. Phase 6 covers: Artifact Registry v2.9 → v2.10; Active Document Index v1.0 update; Promotion Ledger entry P-008 (DIC v1.0 → v1.1 fold-in per Evans Option B); Boot Sequence brand-structure note + DIC PROVISIONAL marker removal; Master PRD v1.9 → v1.10 file rename; physical landing of all delta artifacts into canonical bundle files. Estimated duration: 1-2 days.

- **v2.1 — 2026-05-02** — **🟢 PHASE 6 POST-MERGE EXIT DECLARED. v1.10 PRD UPDATE CYCLE COMPLETE.** Per Codex Phase 6 POST-MERGE EXIT review v0.5 (`Codex_Phase6_PostMerge_Exit_Review_2026-05-02.md`) returning 0 HIGH / 0 MEDIUM findings, the v1.10 promotion ceremony executed 2026-05-01 per Evans's "authorized" instruction is bundle-internally-consistent. Phase 6 work via 9 of 10 ceremony steps + post-merge cleanup:
  - **Step 1:** 12 newly authored canonical files added to bundle (Master PRD v1.10; ADR-027/028/029 Accepted; Contracts Pack WORKLOAD_TAXONOMY + AUTONOMY_LEVELS at v5.2; DIC v1.1 Canonical for development; Program Porting Checklist v1.0; 4 country regulatory placeholders).
  - **Steps 2–6 (substantive content edits):** Pre-merge delta-artifact convention adopted (Phase 3 + Phase 5 deltas in `Telecheck_v1_10_PRD_Update/` are authoritative reference for v1.10 cycle changes; bundle file bodies retain pre-v1.10 baseline; engineers consult both body + delta artifact for v1.10 cycle changes; follow-on cycle may physically merge deltas into bodies).
  - **Step 7a:** Promotion Ledger entry P-008 appended with Evans's verbatim "authorized" instruction; phase-by-phase Codex EXIT convergence enumerated (Phases 0-6).
  - **Step 7b:** Telecheck_Artifact_Registry_v2_9.md → v2_10.md rename + content updates (Decision 1 v5.1→v5.2; Decision 2 v1.9→v1.10; Decision 8 DIC v1.0→v1.1; §3 inventory rows updated; §6 next actions reframed for v1.10 state; §7 row counts 75→87 + Product truth 8→9 / Contracts layer 15→17 / Engineering truth 12→15 / Experience truth 5→6 + new v1.10 cycle additions row; §8 changelog v2.10 entry; §9 doc-control v2.10 entry).
  - **Step 7c:** Active Document Index v1.0 refreshed in place (§3 canonical mapping for Master PRD v1.10 / Contracts Pack v5.2 / DIC v1.1 / 3 new ADRs / 7 new rows for v1.10 cycle additions; §4 Superseded gains Master PRD v1.9 + DIC v1.0 + Registry v2.9; header refreshed with Brand discipline note per C3 cycle).
  - **Step 7d:** CLAUDE_CODE_BOOT_SEQUENCE.md updated (§3 canonical versions; §1 reading order brand-structure orientation note; §4 schema authority; §7 DIC v1.1 Canonical for development rewrite; §9 conflict-resolution table gains 7 new rows for v1.10 cycle conflicts).
  - **Step 8:** 2 files demoted to Superseded per copy + supersede convention §3.5 — preserved at existing paths (Master PRD v1.9; DIC v1.0). Supersession recorded in ADI §4 + Promotion Ledger P-008 + Boot Sequence §3 + Boot Sequence §7.
  - **Step 9:** Project Upload Manifest v2 rebuilt mechanically from filesystem — confirmed 87 markdown files via `ls *.md | wc -l`.
  - **Step 10 / Phase 6 POST-MERGE EXIT:** 5-cycle convergence (v0.1: 3 HIGH + 2 MEDIUM → v0.2: 1 HIGH + 1 MEDIUM → v0.3: 1 MEDIUM count math → v0.4: 1 MEDIUM residual "10" → v0.5: 0/0 CLOSED).
  - All 10 amended Contracts Pack files received v5.2 promotion notes pointing to delta artifacts (or v5.1 for MARKET_LAUNCH); ERROR_MODEL + IDEMPOTENCY + SOURCE_OF_TRUTH preserved at v5.1.
  - **v5.2 governs 11 files** (9 amended + 2 NEW): INVARIANTS, AUDIT_EVENTS, DOMAIN_EVENTS, CCR_RUNTIME, GLOSSARY, TYPES, AI_LAYERING, FORMS_ENGINE, GOVERNANCE_CONTROLS amended; WORKLOAD_TAXONOMY, AUTONOMY_LEVELS NEW; MARKET_LAUNCH v5.0 → v5.1.

**Total: 9 phase-exit Codex reviews fired across the workstream. All closed at 0 HIGH / 0 MEDIUM.** 107/107 v1.10 cycle data matrix rows Approved.

**v1.10 is now canonical in the bundle.** The workstream is archived; future revisions to v1.10 cycle artifacts require a new cycle number (v1.11+).

- **Authors:** Conversation between Product (Telecheck) — Evans (workstream lead) — and Claude, with Codex adversarial review at every phase exit.
- **Status:** **COMPLETE.** Workstream archived 2026-05-02. Future revisions require new cycle (v1.11+).
- **Next review:** Not applicable — this cycle is closed. New cycles per future product-decision triggers.
