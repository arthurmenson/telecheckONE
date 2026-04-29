# Telecheck — Artifact Registry

**Version:** 2.9
**Status:** Canonical
**Owner:** Product (Telecheck)
**Last updated:** 2026-04-26 (Cycle U-002 of US Region Migration workstream — ADR-026 ratified; supersedes ADR-025; System Architecture v1.2 and Master PRD v1.9 propagated; MARKET_LAUNCH and Update_Spec restored to bundle)
**Format:** Markdown (must remain markdown for programmatic updates; never convert to PDF as the working copy)

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
- **Canonical version:** **v5.1 modular** (13 contract files at v5.1, plus README at v5.1; MARKET_LAUNCH retained at v5.0 — already tenant/market-aware)
- **Filename convention:** Files retain the legacy `v5_00` filename pattern (e.g., `Telecheck_Contracts_Pack_v5_00_INVARIANTS.md`). The document headers declare **v5.1** as canonical. Headers govern; filenames are stable for cross-reference continuity. This avoids breaking ~50+ cross-document citations that reference the v5_00 filename.
- **Superseded versions:** v5.0 superseded by v5.1 on 2026-04-25 (multi-tenancy threading per ADR-023). v4.2 modular and earlier — superseded by successive review cycles.
- **Decision date:** 2026-04-25 (Adversarial Counsel Review v1.0 finding CRITICAL-01 remediation)

### Decision 2 — Master PRD canonical version

- **Artifact:** Telecheck Master Platform PRD
- **Canonical version:** **v1.9**
- **Superseded:** v1.0 through v1.8 — superseded by successive revisions. v1.6 → v1.7 (Session 1 multi-tenancy + Tier-1 ecom). v1.7 → v1.8 (Adversarial Counsel Review remediation: restored sections lost in v1.7 compression; Heros greenfield decision per HIGH-12; DIC PROVISIONAL note per HIGH-11). **v1.8 → v1.9 (US Region Migration Cycle U-002: ADR-026 region pair propagation; risk register updated; new Telecheck-Ghana cross-border row).**
- **Decision date:** 2026-04-26 (US Region Migration Cycle U-002 supersedes v1.8 decision of 2026-04-25)

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
- **Canonical version:** **v1.2**
- **Notes:** Restored §10a Day-1-7 plan from v1.0 (lost in v1.1 compression). Restored embedded CLAUDE.md template in §13 (lost in v1.1 compression). §7 reframed: engineering implements per CDM v1.2; engineering does not author schemas. Sprint plan revised 26 weeks → 24 weeks following Heros greenfield decision (no migration sprint).
- **Decision date:** 2026-04-25 (HIGH-08, HIGH-09, MEDIUM-16, LOW-20 remediation)

### Decision 7 — Operational Readiness Tracker canonical version

- **Artifact:** Operational Readiness To-Do
- **Canonical version:** **v1.4**
- **Notes:** v1.3 superseded. Three Heros-migration items removed (OR-235, OR-311 marked removed; OR-272 reframed) per HIGH-12 product decision. 103 active items.
- **Decision date:** 2026-04-25 (HIGH-12 propagation)

### Decision 8 — Design Implementation Contract status

- **Artifact:** Design Implementation Contract
- **Canonical version:** v1.0
- **Status:** **PROVISIONAL** pending design file delivery. Frontend engineering proceeds on Design System v1.1 + IA documents alone. Pixel-exact-match requirement does NOT apply during the provisional period. When design files are delivered, DIC bumps to v1.1 status "Canonical" and reimplementation cycles begin for already-built screens.
- **Decision date:** 2026-04-25 (HIGH-11 product decision)

### Decision 9 — Single-region US primary (ADR-026 supersedes ADR-025)

- **Artifact:** ADR-026 (in `Telecheck_ADR_Addendum_026.md`)
- **Hosting region:** us-east-1 (Virginia) primary, us-west-2 (Oregon) cold DR
- **Status:** Canonical. Supersedes ADR-025 (af-south-1 primary, us-east-1 DR).
- **Affected canonical artifacts (Cycle U-002 in-scope):** ADR Addendum 020–025 (ADR-025 supersession marker added), System Architecture v1.1→v1.2, Master PRD v1.8→v1.9, Artifact Registry v2.8→v2.9, Active Document Index v1.0 (refreshed). MARKET_LAUNCH and Update_Spec contract files restored to bundle as part of this cycle.
- **Affected canonical artifacts (Cycle U-003 to follow):** Engineering Handoff & Build Guide, Operational Readiness Tracker, Ghana Launch Playbook, Tenant Threading Addendum §3.3 (sync video), CCR_RUNTIME / GLOSSARY / INVARIANTS selective updates, Boot Sequence, Reviewer Brief, spot-check sweep on TYPES / GOVERNANCE_CONTROLS / AUDIT_EVENTS / CDM / Consent / Sync Video.
- **Cross-border posture:** Telecheck-Ghana data is processed in us-east-1. Jurisdictional mechanism, patient-disclosure language, and sub-processor list are `[COUNSEL-REQUIRED]` for Ghana DPC compliance. Heros (US tenant) is standard HIPAA-region posture.
- **Tenant isolation mechanism:** Unchanged. Per-tenant KMS keys, RLS, tenant_id on every record. Keys now reside in us-east-1.
- **Decision date:** 2026-04-26

---

## §3 Canonical artifact-group inventory

This section inventories the canonical artifacts in the current Master Bundle. File-level counts are tracked in §7 (rebuilt in Cycle U-004 from filesystem). Versions and statuses below are authoritative as of Registry v2.9.

> **Authority hierarchy (per remediation cycle 2026-04-25):** When two control-plane documents disagree, resolve in this order:
> 1. Active Document Index v1.0 (entry-point — read first)
> 2. Artifact Registry v2.9 (this document — canonical mapping)
> 3. Project Upload Manifest (inventory)
> 4. Engineering Handoff & Build Guide v1.3 (execution guide)
> 5. All other documents
>
> **Filename note (Contracts Pack):** Contract files use legacy `v5_00` naming in their filenames; the document headers declare **v5.1** as canonical. Headers govern; filenames are stable for cross-reference continuity.

### Product truth layer

| # | Artifact | Canonical version | Status | Notes |
|---|---|---|---|---|
| 1 | Master Platform PRD | **v1.9** | Canonical | v1.9 propagates ADR-026 (region migration: us-east-1 / us-west-2 cold DR; supersedes ADR-025). v1.8 restored sections from v1.6 (success metrics, non-goals, dependencies, risks, pre-launch decisions, open questions, feature PRD index). Heros greenfield (no migration) per HIGH-12 product decision. v1.6, v1.7, v1.8 superseded. |
| 2 | Red Team Review | v1.0 | Canonical | 14 items across severity tiers. |
| 3 | Flagged Items Resolution | v1.0 | Canonical | 16 resolutions absorbed into Master PRD. |
| 4 | Consolidated Launch Tracker | v1.0 | Canonical | Support artifact. Use alongside OR Tracker v1.5. |
| 5 | Operational Readiness Tracker | **v1.4** | Canonical | 103 active items across 4 tiers. v1.3 superseded — 3 Heros-migration items removed (OR-235, OR-311) per HIGH-12 product decision. |
| 6 | Future Scope: USSD + AI Bridge | v0.1 | Canonical (future-scope) | Track B (multilingual, USSD, AI Bridge). |
| 7 | Reviewer Brief | v1.0 | Canonical | 30-minute orientation document. |

### Architecture layer

| # | Artifact | Canonical version | Status | Notes |
|---|---|---|---|---|
| 8 | ADR Set | v1.0 | Canonical | 15 ADRs (ADR-001 through ADR-015). Extended by Addenda 016–019 and 020–025. |
| 9 | ADR Addendum 016–019 | v1.0 | Canonical | ADR-018 (English-first), ADR-019 (AI-first lab interpretation). |
| 10 | ADR Addendum 020–025 | v1.0 (with 2026-04-26 supersession marker on ADR-025) | Canonical for ADR-020 through ADR-024. **ADR-025 superseded by ADR-026.** | ADR-020 (Anthropic Claude), ADR-021 (LiveKit self-hosted), ADR-022 (native-first stack), ADR-023 (multi-tenancy Model A), ADR-024 (country-driven config). ADR-025 (AWS af-south-1) superseded — see ADR Addendum 026 row 10a. |
| 10a | ADR Addendum 026 | v1.0 | Canonical (NEW in U-002) | ADR-026: Single-region US primary (us-east-1) with us-west-2 cold DR. Supersedes ADR-025. Cross-border posture for Telecheck-Ghana data documented; jurisdictional mechanism `[COUNSEL-REQUIRED]`. |
| 11 | System Architecture | **v1.2** | Canonical | v1.2 propagates ADR-026: hosting now us-east-1 / us-west-2 cold DR; new §11.4 Cross-border posture; §11.6 Phase 2 multi-region readiness reframed. v1.1 added 15-module structure (Tenant Configuration); v1.0 superseded. v1.1 superseded by v1.2. |

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

### Cross-cutting Contracts Pack — files use `v5_00` filename; **v5.1 governs**

| # | Artifact (filename) | Canonical version | Status | Notes |
|---|---|---|---|---|
| 20 | Contracts Pack v5 README | v5.1 | Canonical | Pack-level orientation. |
| 21 | Contracts Pack — INVARIANTS | **v5.1** | Canonical | Adds I-023 through I-027 (tenant-isolation invariants). |
| 22 | Contracts Pack — AUDIT_EVENTS | **v5.1** | Canonical | tenant_id and break_glass added to envelope. |
| 23 | Contracts Pack — DOMAIN_EVENTS | **v5.1** | Canonical | tenant_id added to envelope; composite partition_key for tenant-scoped streams. |
| 24 | Contracts Pack — ERROR_MODEL | **v5.1** | Canonical | I-025 information-leak prevention rules. |
| 25 | Contracts Pack — CCR_RUNTIME | **v5.1** | Canonical | Tenant ↔ Country relationship section (the explicitly-promised Session 2 work). |
| 26 | Contracts Pack — GLOSSARY | **v5.1** | Canonical | 12 tenancy / isolation terms added. |
| 27 | Contracts Pack — TYPES | **v5.1** | Canonical | tenant_id on MedicationRequest, ConsentRecord, DelegateAccess, Mode2Evaluation. New TenantId, TenantContext, CrossTenantAccessContext types. 14 new ID prefixes. |
| 28 | Contracts Pack — IDEMPOTENCY | **v5.1** | Canonical | Tenant-scoped idempotency keys. |
| 29 | Contracts Pack — AI_LAYERING | **v5.1** | Canonical | §9 tenant scoping for AI Mode 1 / Mode 2. |
| 30 | Contracts Pack — FORMS_ENGINE | **v5.1** | Canonical | Tenant scoping section added. |
| 31 | Contracts Pack — GOVERNANCE_CONTROLS | **v5.1** | Canonical | §6 tenant-scoped governance. |
| 32 | Contracts Pack — SOURCE_OF_TRUTH | **v5.1** | Canonical | Tenant configuration position in precedence hierarchy. |

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
| 56 | Design Implementation Contract | v1.0 | **PROVISIONAL** | Status changed per HIGH-11 product decision pending design file delivery. |

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
| 64 | Promotion Ledger | Through P-007 | Canonical | Append-only history of canonicality changes. P-001 through P-007 entries. (Note: §8 v2.8 historical changelog row claims P-009/P-010/P-011 were added — that is the pre-existing F-U004-01 documented anomaly; actual ledger reality is P-001..P-007.) |
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

The three-session multi-tenancy + Tier-1 ecom + dual-market scope expansion plus the post-Adversarial-Counsel-Review remediation cycle are **complete**. The canonical document set (75 active files) provides the full specification surface for engineering build. From here, work shifts from documentation to operational launch trajectory:

1. **Engineering kicks off Sprint 0** — per Engineering Handoff & Build Guide **v1.3** §10a (Day-1-7 plan) and §10b (sprints 1-12). Sprint 0 sets up repo, CI/CD, AWS infrastructure (Terraform), PostgreSQL with RLS, identity service, tenant configuration module scaffold. Parallel: ops/legal/clinical close remaining Tier 0 OR items (OR-001 threat model, OR-002 Ghana DPIA, OR-004 clinical safety case + FMEAs, OR-005 AI bias and fairness assessment).
2. **Operational Readiness Tier 0 closure** — reviewer-blocking. Engineering Lead pursues parallel scoping while ops/legal/clinical complete. Estimated 2-4 weeks.
3. **Operational Readiness Tier 1 items** — Launch-blocking items including new dual-market and multi-tenancy items (OR-234 through OR-240, with OR-310 and OR-313 removed per HIGH-12 decision). Closed during build per sprint sequencing.
4. **Operational Readiness Tier 2 items** — Implementation tasks mapped to sprints in EHBG v1.3 §10b.
5. **Documentation follow-ups during build** — most major engineering specs already at canonical state per remediation cycle (CDM v1.2, State Machines v1.1, OpenAPI v0.2). Future cycles per actual engineering experience.
6. **Active Document Index discipline** — engineers consult Registry v2.9 §3 as the source of truth for which documents are active. Any document not present in §3 is either superseded (look for "supersedes vX" in current document's doc control) or out of canonical scope. Engineers should NOT directly read from /mnt/project/ without first checking the Registry, because /mnt/project/ contains both active and superseded versions.
7. **Heros launches greenfield** — per HIGH-12 decision: no migration tooling. Heros acquires patients fresh through Telecheck intake. Marketing CAC carries the patient acquisition rather than migration.
8. **Soft launch sequencing** — Telecheck-Ghana first (lower regulatory complexity), Heros second when Heros tenant configuration and acquisition campaigns are ready. Per Master PRD v1.9 §6.
9. **Design file delivery** — DIC v1.0 is PROVISIONAL per HIGH-11 decision. When design files are delivered, DIC bumps to v1.1 with status "Canonical for development"; reimplementation cycles for already-built screens commence.
10. **Residual MEDIUM/LOW findings from post-remediation review** — 5 MEDIUM and 3 LOW residual findings documented in Telecheck_Adversarial_Counsel_Review_Sessions_1_to_3_Post_Remediation.md. Recommended to address MEDIUM-C (Master PRD change log) and MEDIUM-A (supersession discipline) at next opportunity; remaining residuals can be batched into a future hygiene cycle.

## §7 Artifact counts

> **U-004 reconciliation note (2026-04-27):** This table is mechanically reconciled in U-004 against the filesystem inventory of the final bundle (`Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip`, 75 markdown files). Several pre-existing row count vs item-list discrepancies inherited from prior Registry versions have been corrected (Engineering truth 14→12, Operations 5→4, Slice 18→17, Cross-cutting 4→5). One new category row (Bundle metadata / control plane) was added because ADI, Boot Sequence, Manifest, Release Notes, and Validation Report were not explicitly represented in prior §7 categorization despite being in the bundle. Per workstream methodology learning #5: counts are computed mechanically from filesystem rows, not authored.

| Category | Files | Notes |
|---|---|---|
| Product truth | 8 | Master PRD v1.9, Red Team Review, Flagged Items Resolution, Consolidated Launch Tracker, Reviewer Brief, Registry v2.9, **Operational Readiness To-Do v1.5** (was v1.4 in v2.8 row; updated in U-003), Future Scope: USSD + AI Bridge v0.1 |
| Contracts layer | 15 | Full v5 modular pack — README v5.1; INVARIANTS, AUDIT_EVENTS, DOMAIN_EVENTS, ERROR_MODEL, CCR_RUNTIME, GLOSSARY, TYPES, IDEMPOTENCY, AI_LAYERING, FORMS_ENGINE, GOVERNANCE_CONTROLS, SOURCE_OF_TRUTH at v5.1; MARKET_LAUNCH at v5.0; Update Spec |
| Engineering truth | 12 | **Canonical Data Model v1.2** (was v1.1; +8 ecom entities), **State Machines v1.1** (was v1.0; +Subscription state machine), **OpenAPI v0.2** (was v0.1; +33 endpoints across 6 modules), **System Architecture v1.2** (was v1.1; ADR-026 region migration), RBAC v1.1, ADR Set v1.0, ADR Addendum 016–019, ADR Addendum 020–025 (with ADR-025 supersession marker), **ADR Addendum 026** (NEW; us-east-1 primary, us-west-2 cold DR), Payment & Billing Spec, Identity & Auth Spec, Messaging & Inbox Spec |
| Experience truth | 5 | Patient App IA v1.0, Clinician Portal IA v1.0, **Admin Operator IA v1.1** (was v1.0; role mapping per MEDIUM-18), **Design System v1.1** (was v1.0; tenant token overlay per MEDIUM-17), **Design Implementation Contract v1.0 (PROVISIONAL)** (status changed per HIGH-11) |
| Operations truth | 4 | **Ghana Launch Playbook v1.2** (was v1.1 in v2.8 row; v1.0 + multi-tenant context per MEDIUM-15 + cross-border posture per ADR-026 in U-003), Protocol Library Ghana, Guardrail Templates, **Notification Spec v1.1** (was v1.0; tenant variant model per MEDIUM-14) |
| Slice truth | 17 | 14 launch slice PRDs at v1.0 (with Tenant Threading Addendum v1.0 extending them per CRITICAL-05) + **Forms/Intake Engine v2.1** (was v2.0; per LOW-23) + **Pharmacy + Refill v2.1** (was v2.0; per HIGH-07) + **Admin Backend v1.1** (was v1.0; per LOW-22). Market Rollout Cockpit v1.0 is included in the 14 v1.0 launch slices count above. |
| External communications | 1 | Investor One Pager (note: prior Registry rows for Ghana/Nigeria pitch decks audited and removed — those files are not in current canonical /mnt/project/ inventory; if needed, re-add as separate promotion) |
| Engineering build deliverables | 1 | **Engineering Handoff & Build Guide v1.3** (was v1.2 in v2.8 row; ADR-026 region migration propagated in U-003) |
| Cross-cutting | 5 | Promotion Ledger, **Tenant Threading Addendum v1.0** (refreshed in U-003 for §3.3 Phase 2 media-routing note), **Unified Admin Sidebar v1.0** (NEW per HIGH-10), Adversarial Counsel Review Sessions 1-3, Adversarial Counsel Review Sessions 1-3 Post-Remediation |
| Bundle metadata / control plane (added in U-004) | 7 | **Active Document Index v1.0** (refreshed in U-002 for ADR-026; bundle reference finalized in U-004), CLAUDE_CODE_BOOT_SEQUENCE.md (refreshed in U-003 for ADR-026 conflict-resolution rule + Registry pointer), **Telecheck_Project_Upload_Manifest_v2.md** (NEW in U-004; mechanically generated from filesystem), Telecheck_Project_Upload_Manifest_Post_Remediation.md (historical; kept in bundle for audit-trail continuity), **TELECHECK_RELEASE_NOTES_US_REGION_BASELINE.md** (NEW in U-004; renamed from `..._US_REGION_MIGRATION.md` in Round 2), TELECHECK_RELEASE_NOTES_FINAL_REMEDIATED.md (historical; kept in bundle), **TELECHECK_VALIDATION_REPORT_US_REGION_BASELINE.md** (NEW in U-004; renamed from `..._US_REGION_MIGRATION.md` in Round 2) |
| **Total active** | **75** | Mechanically computed from `ls *.md \| wc -l` of the assembled bundle filesystem in U-004. Matches filesystem inventory exactly. Net change from v2.8: +1 NEW canonical artifact (ADR Addendum 026 per ADR-026 region migration); +2 restored to bundle (MARKET_LAUNCH, Update_Spec — closes Cycle 001 F-001-01); +3 NEW bundle metadata artifacts in U-004 (Manifest v2, Release Notes US Region Baseline, Validation Report US Region Baseline — note: the "US Region Baseline" filenames were initially authored as `..._US_REGION_MIGRATION.md` then renamed to `..._US_REGION_BASELINE.md` in Round 2 per framing-correction directive, since no live infrastructure migration occurred); 6 documents version-bumped (Master PRD v1.8→v1.9, System Architecture v1.1→v1.2, EHBG v1.2→v1.3, OR Tracker v1.4→v1.5, Ghana Launch Playbook v1.1→v1.2, Registry v2.8→v2.9). 0 files deleted. |

---

## §8 Change log

| Date | Change | Decided by |
|---|---|---|
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

