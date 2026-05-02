# Telecheck — Artifact Registry

**Version:** 2.10
**Status:** Canonical
**Owner:** Product (Telecheck)
**Last updated:** 2026-05-01 (v1.10 PRD update cycle — Phase 6 promotion ceremony per Evans's "authorized" instruction; promoted Master PRD v1.9 → v1.10; 3 new ADRs (027/028/029); 2 new contracts (WORKLOAD_TAXONOMY/AUTONOMY_LEVELS) and Contracts Pack v5.1 → v5.2 transition across 9 amended files (INVARIANTS, AUDIT_EVENTS, DOMAIN_EVENTS, CCR_RUNTIME, GLOSSARY, TYPES, AI_LAYERING, FORMS_ENGINE, GOVERNANCE_CONTROLS) plus MARKET_LAUNCH v5.0 → v5.1; ERROR_MODEL + IDEMPOTENCY + SOURCE_OF_TRUTH preserved at v5.1; DIC v1.0 PROVISIONAL → v1.1 Canonical for development per Evans Option B 2026-04-28 fold-in; 4 country regulatory placeholder files added)
**Format:** Markdown (must remain markdown for programmatic updates; never convert to PDF as the working copy)
**Brand discipline note (added v2.10 per C3 cycle):** Operating tenant naming: `Telecheck-{country}` (e.g., `Telecheck-US`, `Telecheck-Ghana`). Consumer DBA: `Heros Health` (country-instanced via subdomains: `heroshealth.com` for Telecheck-US; `ghana.heroshealth.com` for Telecheck-Ghana). "Heros" alone (without "Health" qualifier) MUST NOT be used as tenant or operator identifier per Master PRD v1.10 §17 contextual carve-out rules.

---

## Purpose

Single source of truth for "which version of which artifact is canonical." All Telecheck sessions must consult this Registry before producing, referencing, or comparing artifacts. No artifact is canonical unless named here.

---

## How to use this Registry

**Before referencing an artifact:**
1. Look it up in §3 below.
2. Use the version named in the Canonical version column.
3. If the artifact is not in this Registry, treat it as not yet canonical and flag the gap.
4. If the Registry says one version is canonical and you find a different version in conversation history, the Registry wins.

**Before producing a new version of an existing artifact:**
1. Produce the new version normally.
2. Update this Registry: promote the new version to canonical, demote the prior version with a brief reason.

**Before resolving a conflict between two versions:**
1. Make the canonicality decision explicitly (do not infer from recency, completeness, or review-cycle count).
2. Record the decision in §2 with: artifact name, canonical version, superseded versions with reason, date.

---

## Project-level rules this Registry operationalizes

1. **One canonical version per artifact.** Before producing or referencing an artifact, search prior sessions for the latest version. If two versions exist, flag the conflict instead of choosing silently.
2. **Inventory with versions.** When asked for an inventory or status, list artifacts with version numbers and last-modified session, not just names.
3. **Project files are starting points.** Treat documents in /mnt/project/ as authoritative starting points only. If a newer version exists in conversation history, use the newer one and note the supersession.
4. **Search before producing.** For any review, audit, or gap analysis, search past conversations first. Do not produce a list from first principles when prior work exists.
5. **Registry resolves conflicts.** When two versions of any artifact exist (modular vs consolidated, older vs newer, alternate structures), the canonical version is named explicitly in this Registry. All other versions are superseded and must not be used as a reference, even if they appear more complete or more recent.
6. **Registry records decisions.** Canonicality decisions are recorded with: artifact name, canonical version, superseded versions (with brief reason), date of decision. Do not infer canonicality from recency, completeness, or review-cycle count — only from the Registry.

---

## §1 Registry conventions

**Status values:**
- `Canonical` — current authoritative version. Use this.
- `Superseded` — replaced by a newer canonical version. Do not use as a reference.
- `Stale in /mnt/project/` — present in project files but a newer version exists. The newer version is canonical.
- `Forthcoming` — referenced by other artifacts but not yet produced.
- `Assessed` — evaluated but not produced by this project (e.g., external code repositories).

**Layer values** follow the Master PRD §2 hierarchy:
Product truth · Operational/platform truth · Engineering truth · Experience truth · Operations truth · Slice truth · External communications · Code/build artifacts

**Session references** use the format: `Session [date] — [brief topic]` to identify where an artifact was produced.

---

## §2 Top-level canonicality decisions

High-stakes canonicality calls that resolve known conflicts. Each is dated and rationaled.

### Decision 1 — Contracts Pack canonical version

- **Artifact:** Cross-Cutting Contracts Pack
- **Canonical version (v1.10 promoted 2026-05-01):** **v5.2 modular** — 17 files in inventory (15 v5.1 baseline + 2 new in v1.10 cycle: WORKLOAD_TAXONOMY, AUTONOMY_LEVELS). Of those: **11 at v5.2** (9 amended in Phase 3: INVARIANTS, AUDIT_EVENTS, DOMAIN_EVENTS, CCR_RUNTIME, GLOSSARY, TYPES, AI_LAYERING, FORMS_ENGINE, GOVERNANCE_CONTROLS + 2 new: WORKLOAD_TAXONOMY, AUTONOMY_LEVELS); **3 preserved at v5.1** (ERROR_MODEL, IDEMPOTENCY, SOURCE_OF_TRUTH); **1 at v5.0 → v5.1** (MARKET_LAUNCH per Phase 3 group-3); README at v5.1; Update_Spec ancillary.
- **Filename convention:** Files retain the legacy `v5_00` filename pattern (e.g., `Telecheck_Contracts_Pack_v5_00_INVARIANTS.md`). The document headers declare **v5.2** as canonical for the 11 amended/new files. Headers govern; filenames are stable for cross-reference continuity. This avoids breaking cross-document citations that reference the v5_00 filename.
- **v5.1 → v5.2 amendments per ADR-027 + ADR-028 + ADR-029 (Phase 3 group-1/2/3):** INVARIANTS (I-029/030/031); AUDIT_EVENTS (workload-taxonomy envelope + 6 research events + 2 marketing events + audit_sensitivity_level + new actor_type=ai_workload + I-012 audit-side rule); TYPES (Marketing/Research/AI workload/Program catalog types + 8 new ID prefixes); CCR_RUNTIME (4 marketing keys + 7 research keys); GLOSSARY (37 new terms + amendments to existing v5.1 stale entries); AI_LAYERING (§10 Future Workload Expansion); DOMAIN_EVENTS (4 research + 2 marketing events); FORMS_ENGINE (research consent integration + I-030 enforcement static analysis); GOVERNANCE_CONTROLS (research export CONFIG/INCIDENT/SIGNAL + PolicyAuthorization placeholder). Authoritative reference: `Phase3_*_v1_10_Edits_2026-05-01.md` delta artifacts in `Telecheck_v1_10_PRD_Update/`.
- **MARKET_LAUNCH v5.0 → v5.1 (Phase 3 group-3):** Master PRD §10.5 program catalog architecture cross-reference + ADR-027 marketing posture activation gate (6 conditions) + ADR-028 research data partnership activation gate (11 conditions).
- **Superseded versions:** v5.0 superseded by v5.1 on 2026-04-25 (multi-tenancy threading per ADR-023). v5.1 → v5.2 on 2026-05-01 (Phase 3 v1.10 cycle). v4.2 modular and earlier — superseded by successive review cycles.
- **Decision dates:** 2026-04-25 (Adversarial Counsel Review v1.0 finding CRITICAL-01 remediation → v5.1); 2026-05-01 (Phase 3 v1.10 cycle promotion → v5.2).

### Decision 2 — Master PRD canonical version

- **Artifact:** Telecheck Master Platform PRD
- **Canonical version:** **v1.10** (promoted 2026-05-01 per Phase 6 ceremony)
- **Superseded:** v1.0 through v1.9 — superseded by successive revisions. v1.6 → v1.7 (Session 1 multi-tenancy + Tier-1 ecom). v1.7 → v1.8 (Adversarial Counsel Review remediation: restored sections lost in v1.7 compression; Heros greenfield decision per HIGH-12; DIC PROVISIONAL note per HIGH-11). v1.8 → v1.9 (US Region Migration Cycle U-002: ADR-026 region pair propagation). **v1.9 → v1.10 (v1.10 PRD Update Cycle: 7 architectural shifts C1-C7; new sections §7.9 marketing posture, §7.10 research data accessibility, §10.5 program catalog architecture, §13.2 marketing copy governance, §13.7 AI workload taxonomy, §15.3 research data governance; 3 new invariants I-029/030/031 in §14; 8 new pre-launch decisions §24 rows 11-18).**
- **Decision date:** 2026-05-01 (v1.10 PRD Update Cycle Phase 6 promotion ceremony per Evans's "authorized" instruction; supersedes v1.9 decision of 2026-04-26)

### Decision 3 — State Machines coverage

- **Artifact:** State Machines
- **Canonical version:** **v1.1**
- **Coverage:** 14 state machines plus the interaction engine transaction flow. v1.0 covered 13 state machines; v1.1 adds the Subscription state machine (10 states) per Pattern C remediation (CRITICAL-03). Cross-machine interactions extended with 6 new subscription-related entries.
- **Decision date:** 2026-04-25 (CRITICAL-03 remediation)

### Decision 4 — Canonical Data Model canonical version

- **Artifact:** Canonical Data Model
- **Canonical version:** **v1.2**
- **Coverage:** 41 entities (6 tenant management + 27 inherited + 8 ecom new in v1.2). Schemas for all 8 ecom entities introduced by Pharmacy + Refill v2.1 and Admin Backend v1.1 slice PRDs are canonicalized here per Pattern C — slice PRDs reference these schemas; engineering implements per CDM v1.2.
- **Decision date:** 2026-04-25 (CRITICAL-02 remediation)

### Decision 5 — OpenAPI canonical version

- **Artifact:** OpenAPI Specification
- **Canonical version:** **v0.2**
- **Coverage:** 178 endpoints across 21 modules. v0.1 had 145 endpoints across 15 modules; v0.2 adds 33 endpoints across 6 new modules (Tenant Configuration, Subscriptions, Product Catalog, Carts, Discount Codes, Affiliates).
- **Decision date:** 2026-04-25 (CRITICAL-04 remediation)

### Decision 6 — Engineering Handoff canonical version

- **Artifact:** Engineering Handoff & Build Guide
- **Canonical version:** **v1.3** *(updated 2026-05-02 per Codex Round-6 Scope 4 HIGH-1 finding — was previously stated as v1.2 in this Decision block, contradicting §3 inventory which already canonized v1.3. Corrected to align Decision block with §3 inventory and on-disk filename `Telecheck_Engineering_Handoff_Build_Guide_v1_3.md`. v1.2 is superseded.)*
- **Notes:** Restored §10a Day-1-7 plan from v1.0 (lost in v1.1 compression). Restored embedded CLAUDE.md template in §13 (lost in v1.1 compression). §7 reframed: engineering implements per CDM v1.2; engineering does not author schemas. Sprint plan revised 26 weeks → 24 weeks following Telecheck-US (Heros Health DBA) greenfield decision (no migration sprint). **v1.3 (canonical) and the 2026-05-02 C3 hygiene-cycle template rewrite (operating-tenant + DBA + legal-entity + consumer-subdomain framing) per v1.10.1 hygiene cycle physical merge** are reflected in the on-disk file. v1.2 is superseded.
- **Decision date:** 2026-04-25 (HIGH-08, HIGH-09, MEDIUM-16, LOW-20 remediation); 2026-05-02 (Codex Round-6 Scope 4 HIGH-1 version-pointer correction; v1.10.1 hygiene cycle C3 template rewrite)

### Decision 7 — Operational Readiness Tracker canonical version

- **Artifact:** Operational Readiness To-Do
- **Canonical version:** **v1.4**
- **Notes:** v1.3 superseded. Three Heros-migration items removed (OR-235, OR-311 marked removed; OR-272 reframed) per HIGH-12 product decision. 103 active items.
- **Decision date:** 2026-04-25 (HIGH-12 propagation)

### Decision 8 — Design Implementation Contract status

- **Artifact:** Design Implementation Contract
- **Canonical version:** **v1.1** (promoted 2026-05-01 per Phase 6 ceremony, folded into v1.10 cycle as Phase 5.6 / F49 per Evans's Option B 2026-04-28 directive)
- **Status:** **Canonical for development.** Patient interactive mock v7 at `telecheck-design-system/project/Patient interactive mock v7.html` is the binding visual reference. §4.1 / §4.2 pixel-exact-match clauses ACTIVATED. Substitution flags carry forward (Manrope font, Lucide icons, wordmark, photography placeholders) — replace before customer ship. Pharmacy portal kit gap: not in v1 design system; gap to be filled when pharmacy slice work begins.
- **v1.0 PROVISIONAL superseded** by v1.1 Canonical for development per Evans Option B 2026-04-28 fold-in into v1.10 cycle (eliminated standalone DIC promotion path; folded as one matrix row in v1.10 alongside C3 brand-structure cascade). v1.0 file preserved at `Telecheck_Design_Implementation_Contract_v1_0.md` for traceability per copy + supersede convention.
- **Decision dates:** 2026-04-25 (HIGH-11 product decision → v1.0 PROVISIONAL); 2026-04-28 (Evans Option B fold-in directive → v1.1 promotion path); 2026-05-01 (Phase 6 ceremony → v1.1 Canonical for development).

### Decision 9 — Single-region US primary (ADR-026 supersedes ADR-025)

- **Artifact:** ADR-026 (in `Telecheck_ADR_Addendum_026.md`)
- **Hosting region:** us-east-1 (Virginia) primary, us-west-2 (Oregon) cold DR
- **Status:** Canonical. Supersedes ADR-025 (af-south-1 primary, us-east-1 DR).
- **Affected canonical artifacts (Cycle U-002 in-scope):** ADR Addendum 020–025 (ADR-025 supersession marker added), System Architecture v1.1→v1.2, Master PRD v1.8→v1.9, Artifact Registry v2.8→v2.9, Active Document Index v1.0 (refreshed). MARKET_LAUNCH and Update_Spec contract files restored to bundle as part of this cycle.
- **Affected canonical artifacts (Cycle U-003 to follow):** Engineering Handoff & Build Guide, Operational Readiness Tracker, Ghana Launch Playbook, Tenant Threading Addendum §3.3 (sync video), CCR_RUNTIME / GLOSSARY / INVARIANTS selective updates, Boot Sequence, Reviewer Brief, spot-check sweep on TYPES / GOVERNANCE_CONTROLS / AUDIT_EVENTS / CDM / Consent / Sync Video.
- **Cross-border posture:** Telecheck-Ghana data is processed in us-east-1. Jurisdictional mechanism, patient-disclosure language, and sub-processor list are `[COUNSEL-REQUIRED]` for Ghana DPC compliance. **Telecheck-US (Heros Health DBA; operated by Telecheck Health LLC)** is standard HIPAA-region posture *(updated 2026-05-02 per Codex Round-5 Scope 4 HIGH-1 finding — was previously `Heros (US tenant)`, which violates the C3 brand-structure rule)*. BAA chain per System Architecture v1.2 §11.4: Telecheck Health LLC (Telecheck-US tenant operator; Heros Health DBA consumer surface) → Telecheck parent/platform (separate business associate; data-plane operator + per-tenant KMS / RLS enforcement layer per ADR-023) → AWS US (subprocessor).
- **Tenant isolation mechanism:** Unchanged. Per-tenant KMS keys, RLS, tenant_id on every record. Keys now reside in us-east-1.
- **Decision date:** 2026-04-26

---

## §3 Canonical artifact-group inventory

This section inventories the canonical artifacts in the current Master Bundle. File-level counts are tracked in §7 (rebuilt in Cycle U-004 from filesystem; rebuilt again at v1.10 promotion 2026-05-01 to reflect 87 markdown files). Versions and statuses below are authoritative as of Registry **v2.10** (v1.10 promotion 2026-05-01).

> **Authority hierarchy (per remediation cycle 2026-04-25; refreshed at v1.10 promotion 2026-05-01):** When two control-plane documents disagree, resolve in this order:
> 1. Active Document Index v1.0 (entry-point — read first; refreshed 2026-05-01)
> 2. Artifact Registry v2.10 (this document — canonical mapping; v1.10 PRD Update Cycle promotion 2026-05-01)
> 3. Project Upload Manifest v2 (inventory; rebuilt at Phase 6 Step 9)
> 4. Engineering Handoff & Build Guide v1.3 (execution guide)
> 5. All other documents
>
> **Filename note (Contracts Pack):** Contract files use legacy `v5_00` naming in their filenames; the document headers declare **v5.2** as canonical for the **11 amended/new files** in v1.10 cycle (9 amended in Phase 3: INVARIANTS, AUDIT_EVENTS, DOMAIN_EVENTS, CCR_RUNTIME, GLOSSARY, TYPES, AI_LAYERING, FORMS_ENGINE, GOVERNANCE_CONTROLS + 2 NEW: WORKLOAD_TAXONOMY, AUTONOMY_LEVELS); ERROR_MODEL + IDEMPOTENCY + SOURCE_OF_TRUTH preserved at v5.1; MARKET_LAUNCH v5.0 → v5.1. Headers govern; filenames are stable for cross-reference continuity.
>
> **v1.10 cycle delta-artifact convention (added v2.10 2026-05-01):** Substantive content edits to existing bundle file bodies for v1.10 cycle changes are documented authoritatively in `Telecheck_v1_10_PRD_Update/Phase3_*_v1_10_Edits_2026-05-01.md` (Contracts Pack) and `Telecheck_v1_10_PRD_Update/Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` (Slices + Engineering specs + OR Tracker + Other docs). At Phase 6 promotion 2026-05-01, the existing bundle file *bodies* below remain at their pre-v1.10 baseline state (per copy + supersede convention §3.5 of the Phase 6 ceremony plan); the file *headers* are bumped to v5.2 with a v5.2 doc-control entry pointing to the delta artifact. Engineers consulting these files for v1.10 cycle changes should read both the canonical body (pre-v1.10 baseline) AND the corresponding delta artifact (v1.10 cycle additions/amendments). A follow-on cycle may physically merge the delta artifacts into bundle file bodies; this is not part of v1.10 promotion scope.

### Product truth layer

| # | Artifact | Canonical version | Status | Notes |
|---|---|---|---|---|
| 1 | Master Platform PRD | **v1.10** | Canonical (v1.10 PRD Update Cycle promotion 2026-05-01) | v1.10 promotes 7 architectural shifts C1-C7: §21 non-goals regulatory-conditional rewrite (C1); emerging-markets framing reframe (C2); brand structure cascade — `Telecheck` platform brand only, `Heros Health` consumer DBA country-instanced, operating tenants `Telecheck-{country}` (C3); country-conditional DTC marketing posture per ADR-027 — new §13.2 (C4); research data partnership Posture A as Release 2 per ADR-028 — new §15.3 (C5); program catalog architecture canonicalization — new §10.5 (C6); AI workload taxonomy + autonomy levels per ADR-029 — new §13.7 (C7 forward-compat). 3 new invariants (I-029/030/031) added to §14. 8 new pre-launch decisions §24 rows 11-18. v1.6 through v1.9 superseded; v1.9 preserved at existing path per copy + supersede convention. |
| 2 | Red Team Review | v1.0 | Canonical | 14 items across severity tiers. |
| 3 | Flagged Items Resolution | v1.0 | Canonical | 16 resolutions absorbed into Master PRD. |
| 4 | Consolidated Launch Tracker | v1.0 | Canonical | Support artifact. Use alongside OR Tracker v1.5. |
| 5 | Operational Readiness Tracker | **v1.5** | Canonical | v1.5 (Cycle U-003 propagation) supersedes v1.4. v1.10 cycle adds 3 marketing OR items per ADR-027 + 5 research OR items per ADR-028 (Phase 5 group 5D delta artifact); body edits per `Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` §Group 5D. |
| 6 | Future Scope: USSD + AI Bridge | v0.1 | Canonical (future-scope) | Track B (multilingual, USSD, AI Bridge). |
| 7 | Reviewer Brief | v1.0 | Canonical | 30-minute orientation document. |

### Architecture layer

| # | Artifact | Canonical version | Status | Notes |
|---|---|---|---|---|
| 8 | ADR Set | v1.0 | Canonical | 15 ADRs (ADR-001 through ADR-015). Extended by Addenda 016–019 and 020–025. |
| 9 | ADR Addendum 016–019 | v1.0 | Canonical | ADR-018 (English-first), ADR-019 (AI-first lab interpretation). |
| 10 | ADR Addendum 020–025 | v1.0 (with 2026-04-26 supersession marker on ADR-025) | Canonical for ADR-020 through ADR-024. **ADR-025 superseded by ADR-026.** | ADR-020 (Anthropic Claude), ADR-021 (LiveKit self-hosted), ADR-022 (native-first stack), ADR-023 (multi-tenancy Model A), ADR-024 (country-driven config). ADR-025 (AWS af-south-1) superseded — see ADR Addendum 026 row 10a. |
| 10a | ADR Addendum 026 | v1.0 | Canonical (NEW in U-002) | ADR-026: Single-region US primary (us-east-1) with us-west-2 cold DR. Supersedes ADR-025. Cross-border posture for Telecheck-Ghana data documented; jurisdictional mechanism `[COUNSEL-REQUIRED]`. |
| 10b | ADR-027 Country-Conditional DTC Marketing | v1.0 (Accepted at v1.10 promotion 2026-05-01; promoted from v0.6 DRAFT) | Canonical (NEW in v1.10 cycle) | Replaces Master PRD §21 absolute prohibition on DTC molecule-level marketing with country-conditional posture governed by CCR `molecule_level_marketing_permitted` 3-state enum. US: `prohibited` permanent. Ghana: `pending_evidence`. Triple sign-off (Product Lead + Regulatory Affairs Lead + Clinical Safety Officer). |
| 10c | ADR-028 Research Data Partnership Posture A | v1.0 (Accepted at v1.10 promotion 2026-05-01; promoted from v0.5 DRAFT) | Canonical (NEW in v1.10 cycle) | Adopts Posture A (research data partnership / population observatory) as Release 2 goal. Posture B (trial execution platform) remains absolute non-goal. CCR `research_data_partnership_active` 3-state enum (`inactive` / `consent_only` / `active`); 5th consent tier; k_min default = 11; closed-enum `research_permitted_data_domains`. Quad sign-off (Product Lead + Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer). |
| 10d | ADR-029 AI Workload Taxonomy | v1.0 (Accepted at v1.10 promotion 2026-05-01; promoted from v0.4 DRAFT) | Canonical (NEW in v1.10 cycle) | Replaces binary AI Mode 1 / Mode 2 framing with property-based AI workload taxonomy. `ai_workload_type` discriminator + 4 orthogonal properties (`autonomy_level`, `tool_access`, `memory_scope`, `governance_class`). Mode 1 → `conversational_assistant`; Mode 2 → `protocol_execution`. Reserved future workload types (`autonomous_agent`, `multi_agent_supervisor`, `tool_using_agent`) namespace placeholders requiring successor ADRs. ADR-002 / ADR-005 / I-012 preserved. Quad sign-off (Product Lead + Engineering Lead + Clinical Safety Officer + Privacy Officer). |
| 11 | System Architecture | **v1.2** | Canonical (v1.10 cycle adds research data module per Phase 5 group 5B delta artifact) | v1.2 propagates ADR-026: hosting now us-east-1 / us-west-2 cold DR; new §11.4 Cross-border posture; §11.6 Phase 2 multi-region readiness reframed. v1.10 cycle adds research data module per `Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` §Group 5B (substantive body edits in delta artifact). v1.1 added 15-module structure (Tenant Configuration); v1.0 superseded. v1.1 superseded by v1.2. |

### Engineering truth layer

| # | Artifact | Canonical version | Status | Notes |
|---|---|---|---|---|
| 12 | Canonical Data Model | **v1.2** | Canonical | 41 entities (6 tenant management + 27 inherited + 8 ecom new in v1.2). Schemas for Subscription, SubscriptionEvent, ProductCatalog, Cart, CartItem, DiscountCode, DiscountCodeRedemption, AffiliateAccount, AffiliateConversion. v1.0 and v1.1 superseded. |
| 13 | State Machines | **v1.1** | Canonical | 14 state machines (added Subscription state machine — 10 states). Cross-machine interactions extended. v1.0 superseded. |
| 14 | OpenAPI Specification | **v0.2** | Canonical | 178 endpoints across 21 modules (added Tenant Configuration, Subscriptions, Product Catalog, Carts, Discount Codes, Affiliates — 33 new endpoints). v0.1 superseded. |
| 15 | RBAC Permissions Matrix | v1.1 | Canonical | Dual hierarchy (Platform Admin + Tenant Admin). Per-resource permissions matrix. Break-glass procedure. v1.0 superseded. |
| 16 | Engineering Handoff & Build Guide | **v1.3** | Canonical | Restored Day-1-7 plan (§10a) + sprint plan (§10b: 12 sprints × 2 weeks = 24 weeks). Restored CLAUDE.md template (§13). Engineering implements per CDM v1.2; does not author schemas. v1.0, v1.1, and v1.2 superseded; v1.3 incorporates ADR-026 region updates per Cycle U-003. |

### Domain specs

| # | Artifact | Canonical version | Status | Notes |
|---|---|---|---|---|
| 17 | Identity & Authentication Spec | v1.0 | Canonical | Tenant-aware via tenant_id on Account. |
| 18 | Payment & Billing Spec | v1.0 | Canonical | Stripe US, Paystack Ghana per ADR-024. |
| 19 | Messaging & Inbox Spec | v1.0 | Canonical | — |

### Cross-cutting Contracts Pack — files use `v5_00` filename; **v5.2 governs** (**11 amended/new in v1.10 cycle**: 9 amended + 2 NEW; ERROR_MODEL + IDEMPOTENCY + SOURCE_OF_TRUTH preserved at v5.1; MARKET_LAUNCH v5.0 → v5.1)

| # | Artifact (filename) | Canonical version | Status | Notes |
|---|---|---|---|---|
| 20 | Contracts Pack v5 README | v5.1 | Canonical (preserved) | Pack-level orientation. Body unchanged in v1.10 cycle. |
| 21 | Contracts Pack — INVARIANTS | **v5.2** | Canonical (v1.10 cycle adds I-029/030/031 per delta artifact) | v5.1 added I-023 through I-027 (tenant-isolation). v5.2 adds I-029 (research data export gates: active DSA + active research consent + k-anonymity ≥ k_min); I-030 (research consent declination has zero impact on care); I-031 (research data export at high-sensitivity audit class). Substantive body edits: `Telecheck_v1_10_PRD_Update/Phase3_INVARIANTS_v1_10_Edits_2026-05-01.md`. |
| 22 | Contracts Pack — AUDIT_EVENTS | **v5.2** | Canonical (v1.10 cycle adds workload-taxonomy envelope + 6 research events + 2 marketing events per delta artifact) | v5.1 added tenant_id + break_glass. v5.2 adds `ai_workload_type`, `autonomy_level`, `audit_sensitivity_level` envelope fields; reserved nullable agentic-context fields; new `actor_type = ai_workload`; 6 research events (export_* family at `audit_sensitivity_level=high_pii` per I-031); 2 marketing events; I-012 audit-side rule mirroring §13.7 v0.3. Substantive body edits: `Phase3_AUDIT_EVENTS_v1_10_Edits_2026-05-01.md`. |
| 23 | Contracts Pack — DOMAIN_EVENTS | **v5.2** | Canonical (v1.10 cycle adds 4 research + 2 marketing events per delta artifact) | v5.1 added tenant_id; v5.2 adds 4 research events (`research_consent.granted/revoked`, `research_export.requested/delivered`) + 2 marketing events (`marketing.surface_published/suspended`); tenant-scope rule. Substantive body edits: `Phase3_Group3_Contracts_v1_10_Edits_2026-05-01.md` §DOMAIN_EVENTS. |
| 24 | Contracts Pack — ERROR_MODEL | **v5.1** (preserved) | Canonical (no v1.10 cycle delta) | I-025 information-leak prevention rules. Body unchanged in v1.10 cycle; semantics compose cleanly with new events. |
| 25 | Contracts Pack — CCR_RUNTIME | **v5.2** | Canonical (v1.10 cycle adds 11 new keys per delta artifact) | v5.1 added Tenant ↔ Country relationship section. v5.2 adds 4 marketing keys + 7 research keys including `research_permitted_data_domains` closed-enum country gate + `cross_border_research_transfer_permitted` enum + companion structured object; per-country initial values (**US `prohibited` (marketing) + `inactive` (research); GH `pending_evidence` (marketing) + `inactive` (research)** — *updated 2026-05-02 per Codex Round-8 Scope 3 HIGH-1 finding to align with Round-3/Round-4/Round-5 patches that changed CCR research launch defaults from `consent_only` to `inactive`; the prior registry summary stating `consent_only` at launch is superseded; per-country `inactive → consent_only` requires the MARKET_LAUNCH v5.1 Stage 1 6-condition gate*); change-control rows for triple/quad sign-off chains; Country Launch Director MUST on activation transitions. Substantive body edits: `Phase3_Group2_Contracts_v1_10_Edits_2026-05-01.md` §CCR_RUNTIME. |
| 26 | Contracts Pack — GLOSSARY | **v5.2** | Canonical (v1.10 cycle adds 37 new terms + amendments per delta artifact) | v5.1 added 12 tenancy/isolation terms. v5.2 adds 37 new terms across 4 new sections (Brand and tenant terms; Marketing terms; Research data terms; AI taxonomy terms) per Phase 2.X reconciled glossary; amendments to existing v5.1 stale entries (`tenant`, `Mode 1`, `Mode 2`, `platform_floor`); forbidden-alias updates (Heros bare-name forbidden as tenant identifier). Substantive body edits: `Phase3_Group2_Contracts_v1_10_Edits_2026-05-01.md` §GLOSSARY + `Phase2_F13_Glossary_Reconciled_2026-05-01.md`. |
| 27 | Contracts Pack — TYPES | **v5.2** | Canonical (v1.10 cycle adds Marketing/Research/AI workload/Program catalog types per delta artifact) | v5.1 added tenant_id on MedicationRequest, ConsentRecord, DelegateAccess, Mode2Evaluation + Tenancy types + 14 new ID prefixes. v5.2 adds Marketing types (MarketingCopy, MarketingCopyGovernanceEvidence); Research data types (DataSharingAgreement, ResearchEthicsReviewBody, CohortDefinition, ResearchDataExport with tenant_id + country_of_care); AI workload types (AIWorkloadType, AutonomyLevel, PolicyAuthorization placeholder); Program catalog types (ProgramCatalogEntry); 8 new ID prefixes. Substantive body edits: `Phase3_Group2_Contracts_v1_10_Edits_2026-05-01.md` §TYPES. |
| 28 | Contracts Pack — IDEMPOTENCY | **v5.1** (preserved) | Canonical (no v1.10 cycle delta) | Tenant-scoped idempotency keys. Body unchanged in v1.10 cycle; semantics compose cleanly with new events. |
| 29 | Contracts Pack — AI_LAYERING | **v5.2** | Canonical (v1.10 cycle adds §10 Future Workload Expansion per delta artifact) | v5.1 added §9 tenant scoping for AI Mode 1 / Mode 2. v5.2 adds §10 Future Workload Expansion per ADR-029; AI-ARCH-001 supersession scope statement (single source of truth: WORKLOAD_TAXONOMY §5); Mode 1/Mode 2 ↔ workload taxonomy mapping; ADR-002 + ADR-005 preservation; I-012 preservation rule mirroring Master PRD §13.7 v0.3. Substantive body edits: `Phase3_Group2_Contracts_v1_10_Edits_2026-05-01.md` §AI_LAYERING. |
| 30 | Contracts Pack — FORMS_ENGINE | **v5.2** | Canonical (v1.10 cycle adds research consent integration + I-030 enforcement per delta artifact) | v5.1 added tenant scoping section. v5.2 adds research consent integration into form lifecycle (L1 rendering gate; L4 approval verification; static analysis preventing 6 categories of L1-L4 + intake-flow + surface-visibility dependency on `research_consent_status` per I-030); Master PRD §10.5 cross-reference (Pattern A + four-layer architecture). Substantive body edits: `Phase3_Group3_Contracts_v1_10_Edits_2026-05-01.md` §FORMS_ENGINE. |
| 30a | Contracts Pack — MARKET_LAUNCH | **v5.1** (v5.0 → v5.1 in v1.10 cycle per delta artifact) | Canonical (v1.10 cycle adds activation gates per delta artifact) | v1.10 adds Master PRD §10.5 program catalog architecture cross-reference; ADR-027 marketing posture activation gate (6 conditions); ADR-028 research data partnership activation gate (11 conditions per Phase 3 group-3 v0.2 patches). Substantive body edits: `Phase3_Group3_Contracts_v1_10_Edits_2026-05-01.md` §MARKET_LAUNCH. |
| 31 | Contracts Pack — GOVERNANCE_CONTROLS | **v5.2** | Canonical (v1.10 cycle adds research export controls + PolicyAuthorization placeholder per delta artifact) | v5.1 added §6 tenant-scoped governance. v5.2 adds Research data export control envelope (CONFIG / INCIDENT / SIGNAL controls per ADR-028 + AUDIT_EVENTS v5.2 §5 incident discipline); PolicyAuthorization framework placeholder per ADR-029 / future ADR-030. Substantive body edits: `Phase3_Group3_Contracts_v1_10_Edits_2026-05-01.md` §GOVERNANCE_CONTROLS. |
| 32 | Contracts Pack — SOURCE_OF_TRUTH | **v5.1** (preserved) | Canonical (no v1.10 cycle delta) | Tenant configuration position in precedence hierarchy. Body unchanged in v1.10 cycle. |
| 32a | Contracts Pack — WORKLOAD_TAXONOMY | **v5.2** (NEW in v1.10 cycle) | Canonical (NEW per ADR-029) | New contract per ADR-029. `ai_workload_type` discriminator + 4 orthogonal properties (`autonomy_level`, `tool_access`, `memory_scope`, `governance_class`). Active workload types: `conversational_assistant`, `protocol_execution` (Mode 1, Mode 2 relabeled). Reserved future types (namespace placeholders): `autonomous_agent`, `multi_agent_supervisor`, `tool_using_agent`. §13.7 single normative source of truth for I-012 + autonomy-level interaction (reject-unless three-clause rule). |
| 32b | Contracts Pack — AUTONOMY_LEVELS | **v5.2** (NEW in v1.10 cycle) | Canonical (NEW per ADR-029) | New contract per ADR-029. Active levels at v1.0: `advisory`, `suggestion`, `action_with_confirm`. Reserved (require ADR-030 + activation audit event two-condition AND): `action_with_audit_only`, `fully_autonomous` (strict-superset 5-item activation prerequisites including augmented safety case + per-market regulatory clearance + Clinical Safety Officer + Privacy Officer + Regulatory Affairs Lead triple sign-off + named successor invariant superseding I-012). Mirrors Master PRD §13.7 v0.3. |

### Slice PRDs (17 slices)

| # | Artifact | Canonical version | Status | Tenant Threading |
|---|---|---|---|---|
| 33 | AI Clinical Assistant Slice PRD | v1.0 | Canonical | Extended by Tenant Threading Addendum §3.1 |
| 34 | Async Consult Slice PRD | v1.0 | Canonical | Extended by Tenant Threading Addendum §3.2 |
| 35 | Sync Video Consult Slice PRD | v1.0 | Canonical | Extended by Tenant Threading Addendum §3.3 |
| 36 | Pharmacy + Refill Slice PRD (consolidated) | **v2.1** | Canonical | Carries forward full Refill v1.0 + Pharmacy Portal v1.0 content. References CDM v1.2 §4.7-§4.11 and State Machines v1.1 §15. v2.0 superseded; v1.0 (Refill) and v1.0 (Pharmacy Portal) consolidated. |
| 37 | Forms / Intake Engine Slice PRD | **v2.1** | Canonical | §14.3 PostHog naming convention clarified. v2.0 superseded. |
| 38 | Medication Interaction Engine Slice PRD | v1.0 | Canonical | Extended by Tenant Threading Addendum §3.8 |
| 39 | Herb-Drug Interaction Engine Slice PRD | v1.0 | Canonical | Extended by Tenant Threading Addendum §3.9 |
| 40 | Adverse Event Reporting Slice PRD | v1.0 | Canonical | Extended by Tenant Threading Addendum §3.6 |
| 41 | Consent & Delegated Access Slice PRD | v1.0 | Canonical | Extended by Tenant Threading Addendum §3.7 |
| 42 | Labs / Document Interpretation Slice PRD | v1.0 | Canonical | Extended by Tenant Threading Addendum §3.10 |
| 43 | RPM / CCM Slice PRD | v1.0 | Canonical | Extended by Tenant Threading Addendum §3.4 |
| 44 | Community Platform Slice PRD | v1.0 | Canonical | Extended by Tenant Threading Addendum §3.5 |
| 45 | Acquisition & Engagement Tools Slice PRD | v1.0 | Canonical | Extended by Tenant Threading Addendum §3.12 |
| 46 | Fake Medication Detection Slice PRD | v1.0 | Canonical | Extended by Tenant Threading Addendum §3.11 |
| 47 | Admin Configuration Surfaces Slice PRD | v1.0 | Canonical | — |
| 48 | Market Rollout Cockpit Slice PRD | v1.0 | Canonical | — |
| 49 | Admin Backend Slice PRD | **v1.1** | Canonical | §5.7 AI provider clarity (LOW-22). Sidebar layout reconciled by Unified Admin Sidebar v1.0. v1.0 superseded. |

### Tenant threading and admin reconciliation

| # | Artifact | Canonical version | Status | Notes |
|---|---|---|---|---|
| 50 | Tenant Threading Addendum | v1.0 | Canonical | NEW per CRITICAL-05. Extends 14 unchanged v1.0 slice PRDs and IA documents with multi-tenancy rules. |
| 51 | Unified Admin Sidebar | v1.0 | Canonical | NEW per HIGH-10. Reconciles sidebar layout across Admin Operator IA + Admin Configuration Surfaces + Admin Backend. |

### Experience truth layer

| # | Artifact | Canonical version | Status | Notes |
|---|---|---|---|---|
| 52 | Patient App Information Architecture | v1.0 | Canonical | Extended by Tenant Threading Addendum §3.13. |
| 53 | Clinician Portal Information Architecture | v1.0 | Canonical | Extended by Tenant Threading Addendum §3.14. |
| 54 | Admin Operator IA | **v1.1** | Canonical | RBAC v1.1 dual hierarchy mapping added. Sidebar layout (§3) superseded by Unified Admin Sidebar v1.0. v1.0 superseded. |
| 55 | Design System | **v1.1** | Canonical | Tenant brand token overlay model added. v1.0 superseded. |
| 56 | Design Implementation Contract | **v1.1** | **Canonical for development** (v1.10 cycle Phase 6 promotion 2026-05-01 per Evans Option B 2026-04-28 fold-in into v1.10 cycle as Phase 5.6 / F49) | Patient interactive mock v7 at `telecheck-design-system/project/Patient interactive mock v7.html` is the binding visual reference. §4.1 / §4.2 pixel-exact-match clauses ACTIVATED. Substitution flags carry forward (Manrope, Lucide, wordmark, photography placeholders). Pharmacy portal kit gap noted. Multi-tenant brand variations updated per C3 cascade (Heros Health country-instanced; operating tenants `Telecheck-{country}`). v1.0 PROVISIONAL superseded; preserved at existing path. |

### Operations truth layer

| # | Artifact | Canonical version | Status | Notes |
|---|---|---|---|---|
| 57 | Ghana Launch Playbook | **v1.1** | Canonical | "Operating as one tenant on multi-tenant platform" section added. v1.0 superseded. |
| 58 | Protocol Library Ghana | v1.0 | Canonical | — |
| 59 | Guardrail Templates | v1.0 | Canonical | — |
| 60 | Notification Spec | **v1.1** | Canonical | Tenant-scoped variants and overrides section added. v1.0 superseded. |

### Cross-cutting (control plane and review record)

| # | Artifact | Canonical version | Status | Notes |
|---|---|---|---|---|
| 61 | Active Document Index | v1.0 | Canonical | **READ FIRST.** Single-page canonicality reference. |
| 62 | Artifact Registry (this document) | v2.9 | Canonical | This document. |
| 63 | Project Upload Manifest | Post-Remediation | Canonical | Bundle-level inventory and upload instructions. |
| 64 | Promotion Ledger | Through P-008 (v1.10 PRD Update Cycle Phase 6 promotion 2026-05-01) | Canonical | Append-only history of canonicality changes. P-001 through P-008 entries. P-008 records v1.10 PRD Update Cycle Phase 6 promotion ceremony per Evans's verbatim "authorized" instruction. (Note: §8 v2.8 historical changelog row claims P-009/P-010/P-011 were added — that is the pre-existing F-U004-01 documented anomaly; actual ledger reality is P-001..P-008.) |
| 65 | Adversarial Counsel Review (Sessions 1–3) | v1.0 | Canonical (record) | 23 findings against Sessions 1–3 outputs. Historical record; all findings remediated. |
| 66 | Adversarial Counsel Review (Sessions 1–3 Post-Remediation) | v1.0 | Canonical (record) | Verification gate review — 0 CRITICAL, 0 HIGH residual. |

### External communications

| # | Artifact | Canonical version | Status | Notes |
|---|---|---|---|---|
| 67 | Investor One-Pager | — | Canonical | Narrative format. |

---

## §4 Cross-artifact dependency map

When an artifact is updated, the following downstream artifacts may need corresponding updates.

| When this changes... | ...check/update these |
|---|---|
| Master PRD (any version bump) | All 17 slice PRDs (parent document reference), Ghana Launch Playbook, Patient App IA, Clinician Portal IA |
| Contracts Pack (any version bump) | All 17 slice PRDs (companion document reference), Canonical Data Model, State Machines, Admin Configuration Surfaces Slice |
| Canonical Data Model | State Machines, OpenAPI v0.2 |
| Any slice PRD | State Machines (verify state table), Canonical Data Model (verify entities), Patient/Clinician IA (verify screen coverage) |
| Design System | Patient App IA, Clinician Portal IA (verify visual rules are consistent) |
| Ghana Launch Playbook | Investor Pitch Deck Ghana (verify metrics and timeline alignment) |
| Investor Pitch Deck Ghana | Investor One-Pager (verify narrative consistency) |

---

## §5 Known gaps

Additional operational, assurance, and market-readiness deliverables referenced by the corpus or needed beyond the frozen set. These are outside the 58-file frozen documentation package, so they remain open without contradicting the file-completeness count in §7.

### Tier 1 — Launch blockers (Master PRD §23)

| Gap | Referenced by | Blocks | Status |
|---|---|---|---|
| Protocol library content for Ghana (§23 Q1) | Master PRD §23, Ghana Launch Playbook, Refill Slice, Admin Config Slice | Launch approval | **Framework addressed.** Protocol Library Ghana v1.0 produced (7 protocols with activation sequence). Clinical content review still needed. |
| Guardrail template content + test suites (§23 Q2) | Master PRD §23, AI Clinical Assistant Slice, Admin Config Slice | Launch approval | **Framework addressed.** Guardrail Templates v1.0 produced (4 templates, 35 test cases). AI safety review still needed. |
| Moderation policy content for Ghana (§23 Q3) | Master PRD §23, Community Platform Slice, Admin Config Slice | Launch approval | Partially addressed. Moderation content document not yet authored. |
| Adverse-event reporting destination decision (§23 Q4) | Master PRD §23, Adverse Event Reporting Slice, Ghana Launch Playbook | Launch approval | Framework only. Ghana FDA engagement operational. |

### Tier 2 — Specification gaps

| Gap | Referenced by | Priority | Status |
|---|---|---|---|
| ~~OpenAPI specification v0.1~~ | All slice PRDs | ~~High~~ | **Resolved.** OpenAPI v0.2 produced — 145 endpoints across 15 modules. |
| ~~Architecture Decision Records~~ | Contracts Pack Source-of-Truth | ~~High~~ | **Resolved.** ADR Set v1.0 produced — 15 ADRs. |
| Pricing document — Ghana launch prices | Ghana Launch Playbook, Master PRD §18 | High | Open — needed before unit economics |
| ~~Notification content specification~~ | Ghana Launch Playbook | ~~Medium~~ | **Resolved.** Notification Spec v1.1 produced — 55+ notification types. |
| Knowledge base sourcing decisions | Med Interaction Engine Slice, Herb-Drug Slice | Medium | Open — vendor selection needed |

### Tier 3 — Safety and assurance gaps

| Gap | Priority |
|---|---|
| Clinical safety case / FMEAs per workflow (Refill, Sync Video, RPM, AI escalation, lab abnormals, herb-drug) | High |
| DPIAs per market (Ghana required, Nigeria anticipated, EU/UK mandatory) | Medium |
| AI bias & fairness assessment (PGx genotype representation, counterfeit image detection, AI scribe accent accuracy) | Medium |
| Threat model (STRIDE or attack-tree) | Medium |
| Penetration test scope and plan | Medium |
| Performance and load test plan (interaction engine under polypharmacy) | Medium |

### Tier 4 — Business and operational gaps

| Gap | Priority | Status |
|---|---|---|
| Unit economics model (per-consult, per-refill, per-RPM-month across volume scenarios) | Medium | Open |
| Clinician supply forecast vs demand model | Medium | Open |
| Build vs spec traceability matrix (for each §11.1 item: does code exist? tested? conforms to v5?) | Medium | Open |
| ~~Reviewer brief and reading order~~ | ~~High~~ | **Resolved.** Reviewer Brief v1.0 produced with 5 persona-specific reading paths. |

---

## §6 Recommended next actions

The three-session multi-tenancy + Tier-1 ecom + dual-market scope expansion plus the post-Adversarial-Counsel-Review remediation cycle plus the v1.10 PRD Update Cycle (Phases 0-6, completed 2026-05-01 per Evans's Phase 6 promotion ceremony) are all **complete**. The canonical document set (87 active files post-v1.10 promotion) provides the full specification surface for engineering build. From here, work shifts from documentation to operational launch trajectory:

1. **Engineering kicks off Sprint 0** — per Engineering Handoff & Build Guide **v1.3** §10a (Day-1-7 plan) and §10b (sprints 1-12). Sprint 0 sets up repo, CI/CD, AWS infrastructure (Terraform), PostgreSQL with RLS, identity service, tenant configuration module scaffold. Parallel: ops/legal/clinical close remaining Tier 0 OR items (OR-001 threat model, OR-002 Ghana DPIA, OR-004 clinical safety case + FMEAs, OR-005 AI bias and fairness assessment).
2. **Operational Readiness Tier 0 closure** — reviewer-blocking. Engineering Lead pursues parallel scoping while ops/legal/clinical complete. Estimated 2-4 weeks.
3. **Operational Readiness Tier 1 items** — Launch-blocking items including new dual-market and multi-tenancy items + new v1.10 cycle marketing OR items per ADR-027 (3 items per Phase 5 group 5D delta artifact) + research OR items per ADR-028 (5 items per Phase 5 group 5D delta artifact).
4. **Operational Readiness Tier 2 items** — Implementation tasks mapped to sprints in EHBG v1.3 §10b.
5. **Documentation follow-ups during build** — most major engineering specs already at canonical state per v1.10 cycle delta artifacts (CDM v1.2 + research entities + AIExecution; State Machines v1.1 + ProtocolAuthorizedAction; OpenAPI v0.2 + research endpoints; etc. — see `Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` group 5B). Future cycles per actual engineering experience may physically merge delta artifacts into bundle bodies.
6. **Active Document Index discipline** — engineers consult Registry v2.10 §3 as the source of truth for which documents are active. Any document not present in §3 is either superseded (look for "supersedes vX" in current document's doc control) or out of canonical scope. Engineers should NOT directly read from /mnt/project/ without first checking the Registry, because /mnt/project/ contains both active and superseded versions. **For v1.10 cycle changes**: read both the canonical bundle body AND the corresponding delta artifact in `Telecheck_v1_10_PRD_Update/`.
7. **Telecheck-US (Heros Health DBA) launches greenfield** — per HIGH-12 decision: no migration tooling. The Telecheck-US tenant operator acquires patients fresh through standard intake. Marketing CAC carries patient acquisition rather than migration.
8. **Soft launch sequencing** — Telecheck-Ghana first (lower regulatory complexity), Telecheck-US second when tenant configuration and acquisition campaigns are ready. Per Master PRD v1.10 §6.
9. **DIC v1.1 Canonical for development is now active** — Patient mock v7 binding visual reference; pixel-exact-match clauses activated; reimplementation cycles for already-built screens commence per Phase 5.6 / F49 fold-in.
10. **v1.10 cycle ADR activations** — ADR-027 Country-Conditional DTC Marketing posture: per-country activation gates (per Master PRD §13.2 + Tier 2 evidence in `Telecheck_Country_Regulatory_Contracts.md`); US permanent `prohibited`; Ghana `pending_evidence` until evidence populated. ADR-028 Research Data Partnership Posture A: **`research_data_partnership_active = inactive` at v1.0 launch in all countries (US and GH)** (patch 2026-05-02 per Codex Round-4 Scope 3 MEDIUM finding aligning with CCR_RUNTIME v5.2 launch defaults — was previously stated as "5th consent tier active at v1.0 launch"). The 5th-tier consent prompt does NOT render and no `research.consent_*` audit events emit until per-country `inactive → consent_only` activation passes (REC approval reference + ethics-reviewed consent text version pin + Country Launch Director sign-off per MARKET_LAUNCH v5.1). Subsequent `consent_only → active` activation for the export pipeline is a separate Release 2 gate per Master PRD §15.3 4-layer pipeline + ADR-028 v0.4 quad sign-off (Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer + Product Lead) + REC concurrence + Country Launch Director per-country authority. REC partnership pending pre-launch decision per §24 row 11. ADR-029 AI Workload Taxonomy: forward-compatibility namespace active; reserved workload types (`autonomous_agent`, `multi_agent_supervisor`, `tool_using_agent`) and reserved autonomy levels (`action_with_audit_only`, `fully_autonomous`) gated on successor ADRs (ADR-030+); sentinel value `rejected_invalid_attempt` reserved exclusively for `*.execution_rejected` audit envelope per AUDIT_EVENTS v5.2 §I-012-closure-rule exception.
11. **Residual MEDIUM/LOW findings from post-remediation review** — 5 MEDIUM and 3 LOW residual findings documented in Telecheck_Adversarial_Counsel_Review_Sessions_1_to_3_Post_Remediation.md. Recommended to batch into future hygiene cycle.

## §7 Artifact counts

> **U-004 reconciliation note (2026-04-27, updated 2026-05-01 for v1.10 promotion):** This table is mechanically reconciled in U-004 against the filesystem inventory of the final bundle (75 markdown files in U-004; **87 markdown files post-v1.10 promotion 2026-05-01**). Several pre-existing row count vs item-list discrepancies inherited from prior Registry versions have been corrected (Engineering truth 14→12, Operations 5→4, Slice 18→17, Cross-cutting 4→5). One new category row (Bundle metadata / control plane) was added because ADI, Boot Sequence, Manifest, Release Notes, and Validation Report were not explicitly represented in prior §7 categorization despite being in the bundle. v1.10 promotion 2026-05-01 adds 12 newly authored files; counts updated below per filesystem rebuild. Per workstream methodology learning #5: counts are computed mechanically from filesystem rows, not authored.

| Category | Files | Notes |
|---|---|---|
| Product truth | 9 | **Master PRD v1.10** (v1.9 superseded preserved), Red Team Review, Flagged Items Resolution, Consolidated Launch Tracker, Reviewer Brief, **Registry v2.10** (v2.9 renamed at Phase 6 Step 7b), **Operational Readiness To-Do v1.5**, Future Scope: USSD + AI Bridge v0.1, **+1 Master PRD v1.9 superseded preserved per copy + supersede convention** |
| Contracts layer | 17 | Full v5 modular pack — README v5.1; **11 files at v5.2** (9 amended: INVARIANTS, AUDIT_EVENTS, DOMAIN_EVENTS, CCR_RUNTIME, GLOSSARY, TYPES, AI_LAYERING, FORMS_ENGINE, GOVERNANCE_CONTROLS; **2 NEW v5.2**: WORKLOAD_TAXONOMY, AUTONOMY_LEVELS); **3 files preserved at v5.1** (ERROR_MODEL, IDEMPOTENCY, SOURCE_OF_TRUTH); **MARKET_LAUNCH v5.0 → v5.1**; Update Spec ancillary |
| Engineering truth | 15 | **Canonical Data Model v1.2** (v1.10 cycle adds research entities + AIExecution per delta artifact), **State Machines v1.1** (v1.10 cycle adds research state machines + ProtocolAuthorizedAction lifecycle per delta artifact), **OpenAPI v0.2** (v1.10 cycle adds research endpoints with high_pii audit per delta artifact), **System Architecture v1.2** (v1.10 cycle adds research data module per delta artifact), RBAC v1.1 (v1.10 cycle adds 3 research roles per delta artifact), ADR Set v1.0, ADR Addendum 016–019, ADR Addendum 020–025 (with ADR-025 supersession marker), **ADR Addendum 026** (us-east-1 primary, us-west-2 cold DR), **ADR-027 NEW Accepted v1.10**, **ADR-028 NEW Accepted v1.10**, **ADR-029 NEW Accepted v1.10**, Payment & Billing Spec, Identity & Auth Spec, Messaging & Inbox Spec |
| Experience truth | 6 | Patient App IA v1.0, Clinician Portal IA v1.0, **Admin Operator IA v1.1**, **Design System v1.1**, **Design Implementation Contract v1.1 Canonical for development** (NEW v1.10 promotion), **+1 Design Implementation Contract v1.0 PROVISIONAL superseded preserved** |
| Operations truth | 4 | **Ghana Launch Playbook v1.2** (was v1.1 in v2.8 row; v1.0 + multi-tenant context per MEDIUM-15 + cross-border posture per ADR-026 in U-003), Protocol Library Ghana, Guardrail Templates, **Notification Spec v1.1** (was v1.0; tenant variant model per MEDIUM-14) |
| Slice truth | 17 | 14 launch slice PRDs at v1.0 (with Tenant Threading Addendum v1.0 extending them per CRITICAL-05) + **Forms/Intake Engine v2.1** (was v2.0; per LOW-23) + **Pharmacy + Refill v2.1** (was v2.0; per HIGH-07) + **Admin Backend v1.1** (was v1.0; per LOW-22). Market Rollout Cockpit v1.0 is included in the 14 v1.0 launch slices count above. |
| External communications | 1 | Investor One Pager (note: prior Registry rows for Ghana/Nigeria pitch decks audited and removed — those files are not in current canonical /mnt/project/ inventory; if needed, re-add as separate promotion) |
| Engineering build deliverables | 1 | **Engineering Handoff & Build Guide v1.3** (was v1.2 in v2.8 row; ADR-026 region migration propagated in U-003) |
| Cross-cutting | 5 | Promotion Ledger, **Tenant Threading Addendum v1.0** (refreshed in U-003 for §3.3 Phase 2 media-routing note), **Unified Admin Sidebar v1.0** (NEW per HIGH-10), Adversarial Counsel Review Sessions 1-3, Adversarial Counsel Review Sessions 1-3 Post-Remediation |
| Bundle metadata / control plane (added in U-004) | 7 | **Active Document Index v1.0** (refreshed in U-002 for ADR-026; bundle reference finalized in U-004; refreshed 2026-05-01 for v1.10 cycle Phase 6), CLAUDE_CODE_BOOT_SEQUENCE.md (refreshed in U-003 for ADR-026; refreshed 2026-05-01 for v1.10 cycle Phase 6 §3 versions / §1 brand-structure note / §7 DIC v1.1 rewrite / §9 conflict-resolution rows), **Telecheck_Project_Upload_Manifest_v2.md** (rebuilt 2026-05-01 from filesystem at Phase 6 Step 9 — 87 files), Telecheck_Project_Upload_Manifest_Post_Remediation.md (historical), **TELECHECK_RELEASE_NOTES_US_REGION_BASELINE.md**, TELECHECK_RELEASE_NOTES_FINAL_REMEDIATED.md (historical), **TELECHECK_VALIDATION_REPORT_US_REGION_BASELINE.md** |
| v1.10 cycle additions (NEW 2026-05-01) | 5 | **Telecheck_Program_Porting_Checklist_GLP1_v1_0.md** (worked example per Master PRD §10.5), **Telecheck_Country_Regulatory_Contracts.md** (placeholder per ADR-027 Tier 2), **Telecheck_Pharmacy_Council_Guidance.md** (placeholder per ADR-027 Tier 2), **Telecheck_DSA_Template.md** (placeholder per ADR-028; legal-reviewed pre-launch per Master PRD §24 row 13), **Telecheck_REC_IRB_Engagement.md** (placeholder per ADR-028; per-market REC partnership designation per Master PRD §24 row 11) |
| **Total active (post-v1.10 promotion)** | **87** | Mechanically computed from `ls *.md \| wc -l` of the assembled bundle filesystem at v1.10 promotion 2026-05-01 (Phase 6 Step 9 manifest rebuild). Matches filesystem inventory exactly. Net change from v2.9 (75 files): +12 NEW canonical artifacts at v1.10 promotion (Master PRD v1.10; ADR-027/028/029 Accepted; Contracts Pack WORKLOAD_TAXONOMY + AUTONOMY_LEVELS at v5.2; DIC v1.1 Canonical for development; Program Porting Checklist v1.0; 4 country regulatory placeholders Country_Regulatory_Contracts/Pharmacy_Council_Guidance/DSA_Template/REC_IRB_Engagement); 0 files removed (2 files demoted to Superseded preserved at existing paths per copy + supersede convention §3.5 of Phase 6 ceremony plan). 1 file renamed (Telecheck_Artifact_Registry_v2_9.md → v2_10.md). |

---

## §8 Change log

| Date | Change | Decided by |
|---|---|---|
| 2026-05-01 | **Registry v2.10 — v1.10 PRD Update Cycle (Phase 6 promotion ceremony per Evans's "authorized" instruction).** Promotes Master PRD v1.9 → v1.10 (7 architectural shifts C1-C7; new sections §7.9 / §7.10 / §10.5 / §13.2 / §13.7 / §15.3; 3 new invariants I-029/030/031 in §14; 8 new pre-launch decisions §24 rows 11-18). Promotes 3 new ADRs (027 Country-Conditional DTC Marketing, 028 Research Data Partnership Posture A, 029 AI Workload Taxonomy). Promotes 2 new Contracts Pack files (WORKLOAD_TAXONOMY, AUTONOMY_LEVELS) at v5.2. Bumps **9 existing Contracts Pack files v5.1 → v5.2** (INVARIANTS, AUDIT_EVENTS, DOMAIN_EVENTS, CCR_RUNTIME, GLOSSARY, TYPES, AI_LAYERING, FORMS_ENGINE, GOVERNANCE_CONTROLS) and **1 file v5.0 → v5.1** (MARKET_LAUNCH); preserves ERROR_MODEL, IDEMPOTENCY, SOURCE_OF_TRUTH unchanged. Total at v5.2 post-promotion: **11 files** (9 amended + 2 new). Promotes DIC v1.0 PROVISIONAL → v1.1 Canonical for development per Evans Option B 2026-04-28 fold-in (Patient mock v7 binding visual reference; pixel-exact-match clauses activated; substitution flags carry forward). Adds 4 country regulatory placeholder files (Country_Regulatory_Contracts, Pharmacy_Council_Guidance, DSA_Template, REC_IRB_Engagement) + Program Porting Checklist v1.0. Demotes Master PRD v1.9 + DIC v1.0 to Superseded (preserved at existing paths per copy + supersede convention; ADI §4 records supersession). 6 engineering specs (CDM v1.2, State Machines v1.1, OpenAPI v0.2, RBAC v1.1, System Architecture v1.2, Tenant Threading Addendum v1.0), 14 slice PRDs, OR Tracker v1.5, and 9 other docs received v1.10 cycle propagation edits — substantive content edits authoritatively documented in `Phase3_*_v1_10_Edits_2026-05-01.md` + `Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` delta artifacts at `Telecheck_v1_10_PRD_Update/`. 107/107 v1.10 cycle data matrix rows Approved per phase-by-phase Codex EXIT reviews (Phases 0-6, all closed 0 HIGH / 0 MEDIUM). Brand discipline note added to Registry header per C3 cycle. Total active post-promotion: ~87 markdown files (75 baseline + 12 newly authored; 2 Superseded files preserved). | Product (Telecheck) — Evans (workstream lead) via Claude proxy with Codex adversarial review at every phase exit |
| 2026-04-26 | Registry v2.9 — Cycle U-002 of US Region Migration workstream. ADR-026 (NEW) ratified: single-region us-east-1 primary, us-west-2 cold DR; supersedes ADR-025. ADR Addendum 020-025 marked with ADR-025 supersession marker (content retained for traceability). System Architecture v1.1→v1.2 (region pair updated; new §11.4 Cross-border posture; §11.5 renumbered to §11.6 and reframed). Master PRD v1.8→v1.9 (3 region references updated; risk register row updated; new Telecheck-Ghana cross-border row added; companion-docs Registry reference refreshed v2.5→v2.9). Bundle: 2 missing files restored (Telecheck_Contracts_Pack_v5_00_MARKET_LAUNCH.md and Telecheck_Contracts_Pack_v5_Update_Spec.md — closes Cycle 001 F-001-01). Active Document Index refreshed (Architecture row added for ADR-026). Cycle U-003 will propagate to: EHBG, OR Tracker, Ghana Launch Playbook, Tenant Threading Addendum, CCR_RUNTIME / GLOSSARY / INVARIANTS selective updates, Boot Sequence, Reviewer Brief, spot-check sweep. Cycle U-004 will rebuild Project Upload Manifest from filesystem, generate Release Notes, finalize bundle. Counts not asserted in U-002 per workstream directive — computed in U-004. | Product (Telecheck) |
| 2026-04-25 | Registry v2.8 — Remediation cycle following Adversarial Counsel Review v1.0 (23 findings: 5 CRITICAL, 7 HIGH, 7 MEDIUM, 4 LOW). Bumps: Contracts Pack v5→v5.1 (12 of 13 files updated for tenant-isolation threading per CRITICAL-01); CDM v1.1→v1.2 (+8 ecom entity schemas per CRITICAL-02); State Machines v1.0→v1.1 (+Subscription state machine per CRITICAL-03); OpenAPI v0.1→v0.2 (+33 endpoints per CRITICAL-04); Master PRD v1.7→v1.8 (restored sections + Heros greenfield decision per HIGH-06+HIGH-12); Pharmacy + Refill v2.0→v2.1 (carries forward v1.0 content per HIGH-07); EHBG v1.1→v1.2 (Day-1-7 plan restored, CLAUDE.md template restored, §7 schemas reframed per HIGH-08+09+MEDIUM-16+LOW-20); Notification Spec v1.0→v1.1 (tenant variants per MEDIUM-14); Ghana Launch Playbook v1.0→v1.1 (multi-tenant operating context per MEDIUM-15); Design System v1.0→v1.1 (tenant token overlay per MEDIUM-17); Admin Operator IA v1.0→v1.1 (RBAC mapping per MEDIUM-18); Admin Backend v1.0→v1.1 (AI provider clarity per LOW-22); Forms Engine v2.0→v2.1 (event naming convention per LOW-23). NEW artifacts: Tenant Threading Addendum v1.0 (per CRITICAL-05), Unified Admin Sidebar v1.0 (per HIGH-10), Adversarial Counsel Review v1.0 + Post-Remediation Review. Status change: DIC v1.0 marked PROVISIONAL (per HIGH-11 product decision). Scope removal: Heros migration entirely removed (per HIGH-12 product decision); OR-310 and OR-313 deleted from OR Tracker (bumped v1.3→v1.4). Promotion Ledger updated with P-009 (kickoff), P-010 (completion), P-011 (post-remediation review); MEDIUM-19 corrective footnote added re: P-007 in-place edit. Total active: 71 files. | Product (Telecheck) |
| 2026-04-25 | Registry v2.7 — Session 3 of multi-tenancy + Tier-1 ecom + dual-market scope expansion. Closes the three-session sequence. Promoted 2 net-new artifacts: Design Implementation Contract v1.0 (operationalizes user directive that Claude design files are canonical, pixel-exact match required), Engineering Handoff & Build Guide v1.1 (supersedes v1.0; revised stack per ADR-022, multi-tenancy per ADR-023, country-driven config per ADR-024, AWS hosting per ADR-025, Tier-1 ecom scope, 22-26 week timeline, 8 new entity engineering deliverables). Demoted Engineering Handoff & Build Guide v1.0 to superseded. Total active: 68 files. §6 next actions transitioned from "session N upcoming" to operational launch trajectory. | Product (Telecheck) |
| 2026-04-25 | Registry v2.6 — Session 2 of multi-tenancy + Tier-1 ecom + dual-market scope expansion. Promoted 3 net-new slice PRDs (Forms/Intake Engine v2.0, Pharmacy + Refill v2.0 consolidated from Refill v1.0 + Pharmacy Portal v1.0, NEW Admin Backend v1.0); bumped OR Tracker v1.2→v1.3 with 21 new Tier 2 implementation items. Demoted Forms Engine v1.0 and Refill v1.0 to superseded; demoted Pharmacy Portal v1.0 to superseded (consolidated into Pharmacy + Refill v2.0). Total active: 66 files. Session 3 to follow with Design Implementation Contract and Engineering Handoff revision. | Product (Telecheck) |
| 2026-04-25 | Registry v2.5 — Session 1 of multi-tenancy + Tier-1 ecom + dual-market scope expansion. Promoted: Master PRD v1.7, System Architecture v1.1, Canonical Data Model v1.1, RBAC v1.1, ADR Addendum 020–025, Operational Readiness To-Do v1.2. Demoted to superseded: Master PRD v1.6, System Architecture v1.0, Canonical Data Model v1.0, RBAC v1.0. Total active: 65 files. | Product (Telecheck) |
| 2026-04-25 | Registry v2.4 — promotion pass. Promoted 3 new artifacts: Operational Readiness To-Do v1.1, Future Scope: USSD + AI Bridge v0.1, ADR Addendum 016–019. Total: 61 files. | Product (Telecheck) |
| 2026-04-24 | Registry v2.3 — adversarial review polish pass. | Product (Telecheck) |
| 2026-04-24 | Registry v2.2 — adversarial review fixes. Total: 58 files. | Product (Telecheck) |
| 2026-04-23 | Registry v2.1 deep-clean synchronization pass. | Product (Telecheck) |
| 2026-04-23 | Registry v2.0. | Product (Telecheck) |
| 2026-04-23 | Registry v1.0 created. | Product (Telecheck) |

---

## §9 Document control

- **v2.10 hygiene cycle verification — 2026-05-02 (per v1.10.1 hygiene cycle Phase5 delta Group 5E, Rows 16 + 25 + 81 + 90):** Verified that v2.10 (above) already records the v1.10 cycle Registry change-log entry; brand discipline note (operating tenant `Telecheck-{country}` vs consumer DBA `Heros Health` distinction — see header line 8); research data artifacts (ADR-028, Master PRD §15.3, new Contracts Pack files, new entities); program catalog architecture artifacts (Master PRD §10.5, ProgramCatalogEntry type, ProgramMarketPolicy entity, Program Porting Checklist v1.0). No body edits required at this verification pass — content already complete from Phase 6 promotion ceremony 2026-05-01.
- **v2.10 — 2026-05-01** — v1.10 PRD Update Cycle (Phase 6 promotion ceremony per Evans's "authorized" instruction). Master PRD v1.9 → v1.10. 3 new ADRs (027/028/029) Accepted. 2 new Contracts Pack files (WORKLOAD_TAXONOMY, AUTONOMY_LEVELS) added at v5.2; **9 existing Contracts Pack files v5.1 → v5.2** (INVARIANTS, AUDIT_EVENTS, DOMAIN_EVENTS, CCR_RUNTIME, GLOSSARY, TYPES, AI_LAYERING, FORMS_ENGINE, GOVERNANCE_CONTROLS); MARKET_LAUNCH v5.0 → v5.1; ERROR_MODEL + IDEMPOTENCY + SOURCE_OF_TRUTH preserved at v5.1; total at v5.2 post-promotion: **11 files** (9 amended + 2 new). DIC v1.0 PROVISIONAL → v1.1 Canonical for development (Evans Option B 2026-04-28 fold-in). 4 country regulatory placeholder files added. Program Porting Checklist v1.0 promoted. 6 engineering specs + 14 slice PRDs + OR Tracker + 9 other docs received Phase 5 cycle propagation edits per delta artifacts (substantive content authoritatively documented in `Telecheck_v1_10_PRD_Update/Phase3_*` and `Phase5_*` delta files). 107/107 matrix rows Approved per Codex EXIT reviews at Phases 0–6 (all 0 HIGH / 0 MEDIUM). Brand discipline note added per C3 cycle: operating tenant naming `Telecheck-{country}`; consumer DBA `Heros Health` country-instanced; "Heros" alone forbidden as tenant identifier.
- **v2.9** — Cycle U-002 of US Region Migration workstream. ADR-026 ratified (NEW): single-region us-east-1 primary, us-west-2 cold DR; supersedes ADR-025. ADR Addendum 020–025 marked with ADR-025 supersession (content retained for traceability). System Architecture v1.1→v1.2. Master PRD v1.8→v1.9. Bundle: 2 missing files restored (MARKET_LAUNCH and Update_Spec — closes Cycle 001 F-001-01). §2 gains Decision 9. §3 Architecture-layer rows updated. §8 changelog row added. Cycle U-003 will propagate ADR-026 to EHBG, OR Tracker, Ghana Launch Playbook, Tenant Threading Addendum, CCR_RUNTIME / GLOSSARY / INVARIANTS selective updates, Boot Sequence, Reviewer Brief. Cycle U-004 will rebuild Project Upload Manifest from filesystem and finalize bundle. File counts not asserted in U-002 per workstream directive — computed in U-004.
- **v2.8** — Remediation cycle revision per Adversarial Counsel Review v1.0 (23 findings). 14 documents version-bumped, 13 contracts updated to v5.1, 3 net-new artifacts (Tenant Threading Addendum v1.0, Unified Admin Sidebar v1.0, Adversarial Counsel Review v1.0). 2 product decisions taken (HIGH-11 DIC PROVISIONAL; HIGH-12 Heros greenfield no migration). Total active: 71 files. Comprehensive re-audit of §3 inventory and §7 counts performed; prior counts (68 in v2.7) corrected based on actual filesystem and remediation-cycle additions.
- **v2.7** — Session 3 of multi-tenancy + Tier-1 ecom + dual-market scope expansion. **Closes the three-session sequence.** Promotes 2 net-new artifacts: Design Implementation Contract v1.0 (operationalizes the user-ratified directive that Claude-provided design files are canonical and engineering implements pixel-exact match — defines precedence among design surfaces, what "pixel-exact" means in practice, design tokens as the engineering implementation surface, the component library, the design-engineering review cycle, the Design Spec Issue (DSI) process with severity SLAs, design change governance, accessibility WCAG 2.1 AA, tenant brand boundaries, brand validation; preserves Design System §14 hard rules) and Engineering Handoff & Build Guide v1.1 (supersedes v1.0; revised tech stack per ADR-022 native-first / open-source-first / self-hosted-first full provider matrix; multi-tenancy Model A per ADR-023; country-driven config per ADR-024; AWS hosting per ADR-025; Tier-1 ecom scope per Master PRD v1.7 §5.1; 22-26 week revised timeline per Master PRD v1.7 §6 mapped to 13 sprints × 2 weeks; engineering deliverables for 8 new entities; Heros migration as Phase 2 per Master PRD §5.2; Design Implementation Contract v1.0 referenced as canonical authority for design–engineering boundary; hard rules expanded to 15; OR Tracker v1.3 alignment). Demotes Engineering Handoff & Build Guide v1.0 to superseded. Total active: 68 files. §6 next actions transitioned from "session N upcoming" to operational launch trajectory.
- **v2.6** — Session 2 of multi-tenancy + Tier-1 ecom + dual-market scope expansion. Promotes 3 net-new slice PRDs: Forms/Intake Engine v2.0 (Tier-1 conversion-optimized rewrite — visual builder, save-and-resume, A/B testing, abandonment recovery, JSON import/export, subscription handoff, accessibility explicit), Pharmacy + Refill v2.1 (consolidates Refill v1.0 and Pharmacy Portal v1.0; adds subscription model with full lifecycle, multi-product cart, cancellation deflection, product catalog, PharmacyProvider adapter framework, inventory awareness, compounding extension, shipment tracking), NEW Admin Backend v1.1 (gold-standard ecom admin: per-tenant subscription/catalog/pricing/discount/affiliate/conversion management, AI-assisted operator features, brand/theming). Bumps Operational Readiness To-Do v1.2→v1.3 with 21 new Tier 2 implementation items (OR-257 through OR-277). Demotes Forms Engine v1.0 and Refill v1.0 to superseded; demotes Pharmacy Portal v1.0 to superseded (consolidated). Total active: 66 files. Session 3 to follow with Design Implementation Contract v1.0 and Engineering Handoff & Build Guide v1.2.
- **v2.5** — Session 1 of multi-tenancy + Tier-1 ecom + dual-market scope expansion. Promotes 5 net-new artifacts: ADR Addendum 020–025 (six new ADRs), Master PRD v1.7, System Architecture v1.1, Canonical Data Model v1.1, RBAC v1.1; bumps Operational Readiness To-Do v1.1→v1.2. Demotes 4 prior versions to superseded: Master PRD v1.6, System Architecture v1.0, Canonical Data Model v1.0, RBAC v1.0. Total active: 65 files. Sessions 2 and 3 to follow with Tier-1 slice PRDs (Forms/Intake Engine v2.0, Pharmacy/Refill v2.0, Admin Backend v1.0), Design Implementation Contract v1.0, and Engineering Handoff & Build Guide v1.2.
- **v2.4** — Promotion pass. Adds 3 new artifacts to the canonical inventory (Operational Readiness To-Do v1.1, Future Scope: USSD + AI Bridge v0.1, ADR Addendum 016–019). Refreshes §6 to point to the live OR tracker. Updates §7 counts to 61 files. The promotion record itself is maintained separately in `Telecheck_Promotion_Ledger.md` per user request — that ledger is the authoritative log of *user-requested promotions*; this Registry remains the authoritative log of *what is canonical*.
- **v2.3** — Adversarial review polish pass. Promotes the Registry to v2.3, standardizes the 58-file frozen-set framing, synchronizes downstream references, and records the Payment model/state-machine additions in the engineering baseline.
- **v2.0** — Comprehensive Registry. Resolves three canonicality conflicts. Inventories the transition-state corpus and documents the path from v4.2 / v1.5 to the newer frozen set.
- **v2.1** — Final synchronized Registry. Declares the 55-file frozen set as the current frozen corpus, promotes Contracts Pack v5 as fully self-contained, updates recommended next actions to the actual remaining gaps, refreshes control-layer references, and distinguishes frozen-set completeness from external follow-on deliverables.
- **v2.2** — Adversarial review fixes. 58-file set. Added 3 new specifications (Payment & Billing, Identity & Authentication, Messaging & Inbox). Expanded 5 contracts files to implementation depth. Deepened Refill and Med Interaction Engine slices. Fixed cross-references, vocabulary alignment, and invariants↔floor mapping. Added Data Residency & Security to System Architecture.
- **Change discipline:** Keep the version line, decision log, inventory, and top metadata aligned whenever canonicality changes. Keep the Promotion Ledger updated whenever the user requests a promotion (the request itself is a record).
- **Location:** This Registry must live in /mnt/project/ as `Telecheck_Artifact_Registry.md` so every session sees it as the first authoritative reference. The /mnt/project/ copy is updated by user via the project UI per Promotion Ledger entry P-004 (filesystem writes to /mnt/project/ from inside a session do not propagate to the user's persistent Claude project).

