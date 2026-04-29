# Telecheck — Adversarial Counsel Review of Sessions 1–3 Outputs

**Version:** 1.0
**Status:** Adversarial review — for product/engineering remediation
**Reviewer posture:** Adversarial counsel (skeptical; finds problems; does not validate)
**Date:** 2026-04-25
**Scope:** All artifacts produced or revised across Sessions 1, 2, and 3 of the multi-tenancy + Tier-1 ecom + dual-market scope expansion, reviewed against the pre-session canonical corpus
**Owner:** Product (Telecheck)
**Format:** Markdown

---

## Reviewer's note

I was asked to perform an adversarial counsel review. That role is to find problems — not to validate, congratulate, or balance. Where the new documents have improved the corpus, I have not noted it. Everything below is something the team should treat as a defect to triage.

I found **23 distinct findings** across four severity tiers. **Five are CRITICAL** and would, if uncorrected, block engineering from building a coherent system. The pattern across most findings is the same: the Sessions 1–3 work successfully introduced multi-tenancy, Tier-1 ecom mechanics, and a design-engineering contract at the *headline* level (ADRs, Master PRD, three new/revised slice PRDs), but it did not thread these cross-cutting concerns through the *substrate* (the Contracts Pack, the Canonical Data Model, the State Machines doc, the OpenAPI doc, the unchanged slice PRDs, the IA documents, the Notification Spec). The result is a corpus that *appears* multi-tenant at the policy layer and *is not* multi-tenant at the implementation layer.

The good news: every finding is fixable, several are fixable in a single editing session, and none of them invalidate the architectural decisions ratified across the three sessions. The bad news: until they are fixed, a competent engineering team will produce inconsistent code based on which layer of documentation they read first.

Severity definitions:
- **CRITICAL** — blocks engineering build; will cause real failures or substantial rework
- **HIGH** — significantly increases engineering risk or rework cost; should be fixed before the relevant sprint
- **MEDIUM** — quality/discipline issue; should be fixed before launch but not sprint-blocking
- **LOW** — style/cosmetic; can defer

---

## CRITICAL findings (5)

### CRITICAL-01 — Contracts Pack v5 has zero tenant-awareness; multi-tenancy is not threaded through the runtime substrate

**Evidence.** Direct text search of `/mnt/project/Telecheck_Contracts_Pack_v5_*.md`:

| Contract | Mentions of "tenant" |
|---|---|
| 00_INVARIANTS.md | 0 |
| 00_AUDIT_EVENTS.md | 0 |
| 00_DOMAIN_EVENTS.md | 0 |
| 00_ERROR_MODEL.md | 0 |
| 00_CCR_RUNTIME.md | 0 |
| 00_GLOSSARY.md | 0 |

ADR-023 (Session 1) ratified multi-tenancy Model A as a foundational architectural decision. The Contracts Pack sits at Tier 3 in the precedence hierarchy (Source of Truth contract); ADRs are Tier 2. Per the contract's own conflict-resolution rule, the lower-tier document is updated to match. That update never happened.

**Why it's critical.** Per Engineering Handoff v1.1 §10 Sprint 0 Day 3, engineering builds the audit module first because it gates everything else. The audit module implementation will read AUDIT_EVENTS.md as its specification. AUDIT_EVENTS.md does not say audit records must carry `tenant_id`. The engineer either silently omits it, or invents it, or stops to ask. None of those outcomes are acceptable.

The same problem applies to:
- Domain event envelope (events crossing tenant boundaries silently are an isolation breach)
- Error envelope (errors leaking cross-tenant context are an isolation breach)
- Platform invariants (no invariant exists for tenant isolation enforcement)
- CCR-RUNTIME (Registry v2.5 promised "CCR-RUNTIME extension is Session 2 deliverable" — this never happened in Session 2, was not picked up in Session 3, was silently dropped)
- Glossary ("tenant" is now a first-class platform concept and is not in the canonical vocabulary)

**Remediation.** Produce a v5.1 minor revision of the Contracts Pack that threads tenant-awareness through:
- INVARIANTS — add tenant isolation invariant (call it FLOOR-XXX); enforce that every PHI-touching record carries `tenant_id` and every query is tenant-filtered
- AUDIT_EVENTS — add `tenant_id` to the audit envelope; add tenant-scoped audit retrieval rules
- DOMAIN_EVENTS — add `tenant_id` to the event envelope; specify that consumers must filter by tenant
- ERROR_MODEL — clarify that error envelopes do not leak cross-tenant context (e.g., "patient not found" must not differ between "doesn't exist anywhere" and "exists in another tenant")
- CCR_RUNTIME — extend country-driven config per ADR-024 (this was the explicitly promised but undelivered Session 2 work)
- GLOSSARY — define tenant, tenant scope, tenant boundary, cross-tenant access, break-glass

Estimated effort: half a session.

---

### CRITICAL-02 — Canonical Data Model v1.1 is missing all 7 ecom entities introduced by Session 2 slice PRDs

**Evidence.** Direct text search of `/mnt/user-data/outputs/Telecheck_Canonical_Data_Model_v1_1.md`:

| Entity | Defined in slice PRD | Defined in CDM v1.1 |
|---|---|---|
| Subscription | Pharmacy + Refill v2.0 §8.1 | NO |
| SubscriptionEvent | Pharmacy + Refill v2.0 implied; full schema in EHBG v1.1 §7.2 | NO |
| ProductCatalog | Pharmacy + Refill v2.0 §7.1 | NO |
| Cart | Pharmacy + Refill v2.0 §11.1 | NO |
| CartItem | Pharmacy + Refill v2.0 §11.1 | NO |
| DiscountCode | Admin Backend v1.0 §5.4.3 | NO |
| AffiliateAccount | Admin Backend v1.0 §5.5.1 | NO |
| AffiliateConversion | Admin Backend v1.0 §5.5.1 | NO |

CDM v1.1 §3 claims "33 entities" (6 new tenant-management + 27 inherited from v1.0). It does not include the 7 (or 8 counting SubscriptionEvent) ecom entities the slice PRDs introduce.

EHBG v1.1 §7 explicitly admits this: *"The Tier-1 slice PRDs introduced 8 new entities not yet detailed in Canonical Data Model v1.1."*

**Why it's critical.** The Source of Truth contract sets engineering specs (Tier 6) higher than slice PRDs (Tier 5) for implementation specifications. CDM is the canonical entity definition. Today, the canonical entity definitions for ecom entities live in slice PRDs. This violates the source of truth, and creates a real risk: a backend engineer doing data-modeling work reads the CDM, finds no Subscription entity, and either invents one or asks. If they invent one, they may differ from the schema in Pharmacy + Refill v2.0 §8.1 in subtle ways (column types, constraints, indexes) that won't surface until integration.

**Remediation.** Bump CDM to v1.2; add all 8 missing entities as §3.12 Ecom & Subscription Management (or equivalent). Move the SQL schemas from the slice PRDs into the CDM. Slice PRDs reference CDM rather than carrying their own schemas. Estimated effort: half a session.

---

### CRITICAL-03 — State Machines v1.0 has no Subscription state machine despite a 10-state machine being introduced by Pharmacy + Refill v2.0 §8.2

**Evidence.** Direct text search of `/mnt/project/Telecheck_State_Machines_v1_0.md`:
- Total mentions of "subscription": 1 (and that one is about payment retries on existing subscription/enrollment context — pre-existing language, not the new subscription machine)
- The 10-state subscription machine introduced in Pharmacy + Refill v2.0 §8.2 (DRAFT → ACTIVE → FULFILLING → PAUSED → SWITCHING → CANCELLATION_PENDING → CANCELLED → DECLINED → PAYMENT_FAILED_TERMINAL → SAFETY_HOLD) is absent
- Document control of State Machines v1.0 still says "v1.0 — Initial state machines document. Formalizes 13 state machines"

**Why it's critical.** Engineers building the subscription module will reference State Machines v1.0 as the canonical state machine spec. They will find no subscription state machine. They will then either reference Pharmacy + Refill v2.0 §8.2 (which is a slice PRD, lower tier) or invent their own. Cross-machine interactions (subscription ↔ refill, subscription ↔ payment, subscription ↔ safety) are also undefined at the canonical level.

**Remediation.** Bump State Machines to v1.1; add the subscription state machine; update the cross-machine interactions table to include subscription-affecting events; update the section header from "13 state machines" to "14 state machines plus the interaction engine transaction flow". Estimated effort: a few hours.

---

### CRITICAL-04 — OpenAPI v0.1 is missing all subscription, cart, catalog, discount, affiliate, and tenant endpoints

**Evidence.** Direct text search of `/mnt/project/Telecheck_OpenAPI_v0_1.md`:

| Endpoint family | Mentions in OpenAPI |
|---|---|
| subscription | 5 (all pre-existing payment-related references; no `POST /subscriptions`, `PATCH /subscriptions/{id}/pause` etc.) |
| cart | 0 |
| affiliate | 0 |
| discount | 0 |
| tenant | 0 |

**Why it's critical.** OpenAPI v0.1 is the canonical API contract per the Source of Truth precedence (Tier 6 engineering spec). Frontend engineers building the subscription management UI will read OpenAPI to understand what endpoints exist. They will find none of the subscription lifecycle endpoints. Same for cart checkout flows, affiliate signup forms, discount code application. Backend engineers will be inventing routes and request/response shapes on the fly.

This is a contract-vs-implementation gap with predictable consequences: when frontend and backend integrate, they will disagree on shapes.

**Remediation.** Bump OpenAPI to v0.2; add at minimum:
- `POST /tenants`, `GET /tenants`, `PATCH /tenants/{id}` (Platform Admin)
- `GET /subscriptions`, `POST /subscriptions/{id}/pause`, `POST /subscriptions/{id}/resume`, `POST /subscriptions/{id}/switch`, `POST /subscriptions/{id}/cancel`
- `GET /products`, `POST /products`, `PATCH /products/{id}`
- `POST /carts`, `POST /carts/{id}/items`, `POST /carts/{id}/checkout`
- `GET /discount-codes`, `POST /discount-codes`, `POST /discount-codes/{code}/redeem`
- `GET /affiliate-accounts`, `POST /affiliate-accounts`, `GET /affiliate-conversions`

Each endpoint family also needs request/response schemas (which depend on CRITICAL-02 being fixed first — schemas need entities). Estimated effort: half a session, after CRITICAL-02 is done.

---

### CRITICAL-05 — Seven slice PRDs and three IA documents remain canonical at v1.0 and have zero tenant-awareness

**Evidence.** Direct text search:

| Document | Mentions of "tenant" |
|---|---|
| Telecheck_AI_Clinical_Assistant_Slice_PRD_v1_0.md | 0 |
| Telecheck_Async_Consult_Slice_PRD_v1_0.md | 0 |
| Telecheck_RPM_CCM_Slice_PRD_v1_0.md | 0 |
| Telecheck_Community_Platform_Slice_PRD_v1_0.md | 0 |
| Telecheck_Patient_App_IA_v1_0.md | 0 |
| Telecheck_Clinician_Portal_IA_v1_0.md | 0 |
| Telecheck_Notification_Spec_v1_0.md | 0 |

(Other unchanged slices likely show similar; sample is representative.)

These are canonical per Registry v2.7. Yet they describe a single-tenant world.

**Why it's critical.** A backend engineer assigned to build the Async Consult workflow reads the Async Consult slice. The slice describes a queue of consults, a clinician picking one up, intake data flowing in. The slice does not say:
- Which tenant the consult belongs to
- Whether the clinician sees consults from one tenant or all tenants in their network
- Whether the queue is tenant-scoped or platform-scoped
- How tenant brand affects the patient-facing consult interface
- How tenant-scoped notification copy applies to the consult update

The engineer guesses. Different engineers guess differently. Integration breaks.

Same problem for RPM/CCM (whose monitoring data? scoped how?), Community Platform (cross-tenant community? same-tenant? identity scoped how?), Notification Spec (who owns the notification copy variants?), Patient App IA (single brand or tenant-themed?), Clinician Portal IA (network of clinicians serving multiple tenants? or per-tenant clinicians?).

**Why this is the single most important finding.** Sessions 1–3 produced four new things at the policy/headline layer (Master PRD v1.7, ADRs, three Tier-1 slice PRDs, Design Implementation Contract). Engineers will read those, and then they will read the slice PRD or IA document for the work they are assigned to. If their work is assigned to one of the unchanged 7+3 documents, they will encounter no tenant context. The "multi-tenant platform" decision from ADR-023 will not reach their hands.

**Remediation.** Three options:

1. **Heavyweight (best):** Bump every affected slice PRD and IA to v1.1; add a "tenant scoping" section to each. Estimated: 2 sessions.

2. **Medium:** Author a single cross-cutting "Tenant Threading Addendum v1.0" document that, for each unchanged slice/IA, specifies how multi-tenancy applies. The addendum is referenced by Registry as a peer to the unchanged slices. Estimated: 1 session.

3. **Lightweight (riskiest):** Rely on the Contracts Pack v5.1 update (CRITICAL-01 remediation) to do the threading at the contract layer, with engineers expected to apply contract rules even where slices don't mention them explicitly. Estimated: covered by CRITICAL-01 effort. Risk: as discussed.

Recommend option 2 or 1.

---

## HIGH findings (7)

### HIGH-06 — Master PRD v1.7 is 70% smaller than v1.6 (110KB → 33KB) with no change-log accounting for the deletions

**Evidence.** File sizes confirmed; section comparison shows v1.6 had 25 numbered sections, v1.7 has 19 (renumbered/restructured). Specific sections present in v1.6 and absent or substantially compressed in v1.7:

| v1.6 section | v1.7 fate |
|---|---|
| §3 Product vision | Absent |
| §4 Product thesis | Absent |
| §5 The problem | Absent |
| §7 User groups | Absent |
| §13 AI, moderation, and clinical autonomy frameworks | Substantially compressed; see contracts/AI_LAYERING for some content |
| §16 Trust and data principles | Absent |
| §19 Success metrics | **Absent** |
| §20 Non-goals | Absent |
| §21 Dependencies and constraints | Absent |
| §22 Risks | Absent |
| §23 Pre-launch decision requirements | Absent |
| §24 Open questions | Absent |
| §25 Feature PRD index | Replaced with §9 Tier-1 capabilities; PRD index function lost |

The v1.7 change log (§Change log from v1.6) lists what was *added* (multi-tenancy, dual-market, Tier-1 ecom, revised timeline, etc.) but does not list what was *removed*.

**Why it's HIGH.** §19 Success metrics absence is particularly serious. Without canonical success metrics, engineering doesn't know what to instrument, product doesn't know what to track, leadership doesn't know what to evaluate. §22 Risks absence eliminates the platform-level risk register. §20 Non-goals absence opens scope creep — without explicit non-goals, "could we add this?" has no answer.

**Remediation.** Either:
- Restore the missing sections to v1.7, even if compressed (option: pull each section forward from v1.6 in an abridged form)
- Or split v1.7 into "v1.7 — multi-tenancy and Tier-1 ecom additions" and "v1.7 — preserved content from v1.6 unchanged" — making explicit what was inherited vs added vs deleted

Estimated effort: half a session.

---

### HIGH-07 — Pharmacy + Refill v2.0 references rather than carries forward critical v1.0 content

**Evidence.** Section comparison:

Refill v1.0 had 16 substantive sections. Pharmacy + Refill v2.0 cites Refill v1.0 in §9 with the framing "preserved from v1.0; subscription-aware" — but §9 of v2.0 is a single paragraph plus a state name list. The full state table from Refill v1.0 §10 (24 rows: state, description, next state, patient-facing copy) is not in v2.0.

Pharmacy Portal v1.0 had 14 substantive sections. Pharmacy + Refill v2.0 §15 says "preserved from v1.0 Pharmacy Portal Slice; consolidated here" with 6 brief subsections totaling ~40 lines vs. Pharmacy Portal v1.0's many hundreds of lines.

Specifically lost:
- Refill v1.0 §3 (Core design principles)
- Refill v1.0 §6 (Interaction engine integration — full mechanics)
- Refill v1.0 §7 (Consent and delegation)
- Refill v1.0 §8 (Refill timing and pre-authorization — full table)
- Refill v1.0 §9 (Error and exception handling — full taxonomy)
- Refill v1.0 §10 (Full state-by-state patient-facing copy table)
- Refill v1.0 §11 (Adherence tracking)
- Refill v1.0 §12 (Audit specifics)
- Refill v1.0 §13 (Metrics)
- Pharmacy Portal v1.0 §4 (Platform pharmacy vs partner pharmacy distinction)
- Pharmacy Portal v1.0 §8 (Inventory management, full)
- Pharmacy Portal v1.0 §9 (Pharmacist decision surface)
- Pharmacy Portal v1.0 §11 (Audit)
- Pharmacy Portal v1.0 §12 (Metrics)

The v1.0 documents are now superseded per Registry v2.7. So the content is no longer authoritative there either.

**Why it's HIGH.** v2.0 is canonical; v1.0 is superseded. An engineer building, say, the patient-facing refill status display reads v2.0 §9.2 expecting to find the patient-facing copy table. They find a state name list and the line "States from v1.0 §10:" — but v1.0 §10 is in a superseded document. They invent copy or copy from the superseded doc, which violates document control discipline.

**Remediation.** Either:
- Bring the v1.0 content forward into v2.0 in full (pure expansion of v2.0)
- Or restore v1.0 content to a "Refill v1.0 — content preserved" appendix that v2.0 explicitly inherits, marked as canonical-by-reference

Estimated effort: 1 session for full carry-forward.

---

### HIGH-08 — Engineering Handoff v1.1 lost the Day-1-through-Day-7 concrete kickoff plan

**Evidence.** EHBG v1.0 had §10 "Day-1 through Day-7 concrete plan" with day-specific actions ("Day 3 — Build the audit module first"). EHBG v1.1 §10 is "Sprint plan — 13 sprints × 2 weeks = 26 weeks" — sprint-level, not day-level.

**Why it's HIGH.** The day-level plan was actionable: an engineer joining the team on Monday knew what Tuesday looked like. The sprint-level plan is two weeks of granularity. New engineers and team leads lose the "what do I do tomorrow" specificity. The Sprint 0 in particular needs day-level specifics because that's when the foundational decisions get made (how is the audit module structured, how does tenant resolution work, etc.).

**Remediation.** Restore §10 from EHBG v1.0 as §10a "Sprint 0 day-by-day", with the 13-sprint plan as §10b. Estimated effort: a few hours.

---

### HIGH-09 — Engineering Handoff v1.1 lost the embedded CLAUDE.md template

**Evidence.** EHBG v1.0 §7 had a complete CLAUDE.md template (sub-sections "What this is", "How to find authoritative answers", "Read before implementing anything", "Hard rules", "Tech stack", "Code conventions", "Workflow", "When stuck", "Specific gotchas") that engineers using Claude Code could drop into their repo as the project's CLAUDE.md file. EHBG v1.1 has §13 "Setting up Claude Code for this project" but the embedded template content is absent.

**Why it's HIGH.** The platform endorses Claude Code (per ADR series). Engineering teams using Claude Code rely on CLAUDE.md for context. The template was a day-zero artifact that saved the team from authoring it themselves and risked inconsistency across the team. Now they'll either author it inconsistently or copy from v1.0 (a superseded doc).

**Remediation.** Restore the CLAUDE.md template to EHBG v1.1 §13 as an embedded code block. Estimated: 1 hour.

---

### HIGH-10 — Admin Backend v1.0 partially overlaps with Admin Operator IA v1.0 and Admin Configuration Surfaces v1.0 with no boundary clarification

**Evidence.** All three documents describe an "admin" UI:
- Admin Operator IA v1.0 has a 36-screen sidebar with sections: Dashboard, Markets, Protocols, AI Guardrails, Moderation, Users, Incidents, Reporting, Commerce, Audit, Settings
- Admin Configuration Surfaces v1.0 covers governance configuration (guardrails, moderation policy, protocol activation)
- Admin Backend v1.0 introduces a sidebar with sections: Dashboard, Patients, Subscriptions, Refills, Catalog, Intake Forms, Pharmacy, Clinicians, Marketing, Reports, Audit, Settings

Sections that appear in multiple sources without reconciliation:
- "Users" / "Patients" — Admin Operator IA's Users includes Patient Search/Admin View; Admin Backend v1.0's Patients has Patient Search and active subscribers. Same screen? Different? One overrides?
- "Reporting" — both have it. Different scope claimed (one platform, one tenant) but same URL space?
- "Commerce" / "Catalog" — Admin Operator IA has a Commerce section; Admin Backend has Catalog. Overlap.
- "Audit" — both have it. Tenant-scoped vs platform-scoped, but same UI?
- "Settings" — both.

Admin Backend v1.0 §1 claims the boundary: "The existing Admin Operator IA v1.0 and Admin Configuration Surfaces Slice PRD v1.0 cover the operator-of-the-platform workflows... This new Admin Backend Slice v1.0 covers the gold-standard ecom backend." But the sidebar screens overlap by name, and no document specifies which page renders when an authorized user clicks "Users" or "Reports" or "Settings".

**Why it's HIGH.** Frontend engineering builds one admin app. They have to choose what's in the sidebar. They have three documents that disagree about the sidebar. They will either build something that satisfies one document and contradicts the others, or stop and ask.

**Remediation.** Author a "Unified Admin Sidebar v1.0" reconciliation document, or extend Admin Backend v1.0 §4 to map every overlapping section to one canonical sidebar with role-scoped visibility (Platform Admin sees Markets/Protocols/etc.; Tenant Admin sees Subscriptions/Catalog/etc.; some sections like Audit appear with different content per role). Mark Admin Operator IA v1.0 and Admin Configuration Surfaces v1.0 as "preserved governance content; UI layout superseded by Unified Admin Sidebar". Estimated: half a session.

---

### HIGH-11 — Design Implementation Contract v1.0 builds on a non-existent foundation (no design files have been provided)

**Evidence.** Design Implementation Contract v1.0 §3 establishes a precedence in which Tier-1 (highest) is "Design files (Claude-provided)" — with the implication that these design files exist or will be provided shortly. §4 says "The user (acting as Product Lead and Design owner) is providing Claude-generated design files as the canonical visual specification."

No design files exist in `/mnt/project/`, `/mnt/user-data/uploads/`, or `/mnt/user-data/outputs/` as of this review. The design files are referenced as canonical but absent.

**Why it's HIGH.** The Design Implementation Contract is currently an empty container. Frontend engineers cannot start implementing UI without the design files. They will have:
- Design System v1.0 (tokens and rules) — actionable
- IA documents (information architecture) — actionable
- Slice PRD UI requirements — actionable
- "Pixel-exact match to design files" — not actionable, since design files don't exist

The contract describes a process that cannot be executed.

**Remediation.** Two paths:
- Product Lead delivers an initial set of design files (at least the patient-app onboarding flow + one intake form + one subscription management surface) before frontend engineering kicks off
- Until design files arrive, the Design Implementation Contract should be marked "PROVISIONAL — pending delivery of design files". Frontend engineers proceed on Design System + IA without pixel-exact-match requirement; design files arrive later and trigger reimplementation cycles for already-built screens

Estimated effort to deliver minimum viable design file set: out of Claude's scope; product-side decision.

---

### HIGH-12 — Heros migration tooling is deferred to Phase 2 with no transition plan, but Heros is a day-one tenant

**Evidence.** Master PRD v1.7 §5.2 defers Heros migration tooling to Phase 2 / launch-time engineering work. Heros Health is one of the two day-one tenants (per Master PRD §2 and §10).

OR Tracker v1.3 has migration-related items (OR-310 "Heros migration plan", OR-313 "Heros migration tooling productization") at Tier 3 — meaning post-launch follow-on, not launch-blocking.

**Why it's HIGH.** A "day-one tenant" with no plan for getting their existing patient/subscription/pharmacy/clinical data into the system at launch is an oxymoron. Heros has existing patients on Rimo. On day one of Telecheck operating Heros, those patients need to:
- Have accounts in Telecheck
- Have their active subscriptions migrated
- Have their consent records migrated
- Have their medication histories, lab histories, consult histories migrated
- Have their payment methods migrated (Stripe customer IDs to be ported)

If migration tooling is Phase 2, the day-one Heros tenant is empty. Heros patients log in and find nothing. This is a launch-failure scenario.

The right framing is: either Heros is not actually a day-one tenant (Telecheck-Ghana launches, Heros migrates later), or migration tooling IS launch-blocking and must be Tier 1. Current documents say both contradictory things.

**Remediation.** Resolve the contradiction:
- If Heros is day-one: promote migration tooling to Tier 1 in OR Tracker; add a Heros migration work stream to EHBG v1.1 §5; specify the data source (Rimo's data export format), data mapping (Rimo schema → Telecheck CDM), cutover plan (read-only Rimo, write to Telecheck, then redirect)
- If Heros is not day-one: update Master PRD v1.7 §2 and §10 to reflect that Telecheck-Ghana is the only true day-one tenant and Heros migrates in week N post-launch

Estimated decision: product-side (this session). Estimated execution if Heros is day-one: substantial — Heros migration is a major engineering work stream, likely 4–6 weeks alone.

---

## MEDIUM findings (7)

### MEDIUM-13 — Registry v2.7 file count claims 68 active but actual canonical inventory is ~64 (not counting 4 missing artifacts)

**Evidence.** Registry v2.7 §7 totals: "Total active 68 files". My engineering handover bundle inventory (which excludes superseded versions) finds 63 canonical artifacts + 1 START_HERE README = 64. The 4-file delta breaks down as:
- 2 Powerpoint pitch decks (Ghana, Nigeria) listed in Registry but not present in /mnt/project/ or /mnt/user-data/outputs/
- 2 unaccounted (likely arithmetic in Registry)

Registry §7's slice count says "16 launch slice PRDs at v1.0 + Forms Engine v2.0 + Pharmacy + Refill v2.0 + NEW Admin Backend v1.0" = 19. Then says "18". Inconsistent arithmetic.

**Why it's MEDIUM.** Doesn't break engineering, but undermines the Registry's role as authoritative inventory. If the count is wrong, what else might be wrong?

**Remediation.** Audit Registry §3 (inventory tables) against actual file presence; correct §7 counts; address the missing pitch decks (either produce them, or remove the Registry rows). Estimated: 1 hour.

---

### MEDIUM-14 — Notification Spec v1.0 has no model for tenant-scoped notification copy variants

**Evidence.** Pharmacy + Refill v2.0 §16 says "Tenant admin can configure: ... shipment notification copy". Forms Engine v2.0 §16.5 says "Tenant admin can: ... customize copy per touch". Admin Backend v1.0 §5.8 mentions "Notification copy variant overrides per template". All three slice PRDs assume tenant-scoped notification copy is a thing the platform supports.

Notification Spec v1.0 (canonical for notifications) has zero mentions of tenant. No concept of variant-per-tenant. Single source for notification template content.

**Why it's MEDIUM.** Implementation gap: backend engineering builds the notification system per Notification Spec; the system has no provision for tenant copy overrides; the slice PRDs that depend on this capability cannot deliver.

**Remediation.** Bump Notification Spec to v1.1; add §X "Tenant-scoped variants and overrides"; specify the variant resolution order (tenant-specific override → tenant-default → platform default); audit on variant selection. Estimated: half a session.

---

### MEDIUM-15 — Ghana Launch Playbook v1.0 written single-tenant; not updated for dual-tenant operation

**Evidence.** Ghana Launch Playbook v1.0 describes the operational launch of Telecheck-Ghana as if it were a standalone product. With multi-tenancy ratified in ADR-023 and Heros also being a day-one tenant, the Ghana launch operations team needs to know they're operating one tenant on a multi-tenant platform shared with another team (Heros). The playbook does not acknowledge this.

**Why it's MEDIUM.** Operational confusion: the Ghana team may make assumptions about platform-wide changes that actually require Heros team coordination. Or vice versa.

**Remediation.** Bump Ghana Launch Playbook to v1.1; add a section on tenant boundaries, cross-tenant operational coordination, escalation paths when an issue affects both tenants. Estimated: a few hours.

---

### MEDIUM-16 — EHBG v1.1 §7 "New entity engineering deliverables" makes engineering responsible for canonical schema work that should belong to Product

**Evidence.** EHBG v1.1 §7 says engineering produces detailed schemas for the 8 new ecom entities "as part of the Pharmacy + Refill and Admin Backend sprints". This pushes data-model authoring (a product/architecture responsibility per Source of Truth precedence) onto engineering execution.

**Why it's MEDIUM.** Confused responsibilities. Engineering implements per spec; engineering should not be the spec author. If Engineering invents schema details that turn out to conflict with later product decisions (e.g., regulatory changes around subscription auto-renewal disclosure), the responsibility for the conflict is unclear.

**Remediation.** Tied to CRITICAL-02. Once CDM v1.2 carries the schemas, EHBG v1.1 §7 becomes "Engineering implements per CDM v1.2 §3.12" rather than "Engineering produces schemas." Estimated: covered by CRITICAL-02.

---

### MEDIUM-17 — Design System v1.0 has no tenant brand token model; Design Implementation Contract v1.0 references a tokens framework that doesn't exist in canonical Design System

**Evidence.** Design Implementation Contract v1.0 §5.2 introduces a tenant brand token overlay model:
```
--color-brand-primary-default: #0A7E8C;
--color-brand-primary: var(--tenant-brand-primary, var(--color-brand-primary-default));
```

This implies Design System v1.0's token catalog is extended to support tenant overlays. Design System v1.0 (canonical) has no such model — its tokens are flat platform values.

**Why it's MEDIUM.** Frontend engineering reads Design System for canonical tokens, finds platform-flat tokens, builds with platform-flat tokens. Tenant brand customization fails to render. Or engineering reads Design Implementation Contract first, builds with overlay model, but Design System token names differ — naming inconsistencies.

**Remediation.** Bump Design System to v1.1; add the tenant brand token overlay model from Design Implementation Contract §5.2; specify which tokens are tenant-overridable and which are platform-fixed (per DIC §5.3). Estimated: 1 hour.

---

### MEDIUM-18 — RBAC v1.1 introduces "Platform Admin" and "Tenant Admin" hierarchies, but Admin Operator IA v1.0 still describes the original 5 roles (admin, country_launch_director, clinical_governance_lead, ai_safety_lead, support_lead) without acknowledging the hierarchy split

**Evidence.** Admin Operator IA v1.0 §2.2 has a role-scoped sidebar visibility table for the original 5 roles. RBAC v1.1 introduces 8 platform-side roles + 7 tenant-side roles (per Admin Backend v1.0 §3). The original 5 roles map approximately to the new "Platform Admin" hierarchy but the mapping is not documented.

**Why it's MEDIUM.** Frontend engineering implementing role-based sidebar visibility has two role taxonomies to satisfy. The intersection / mapping is implicit.

**Remediation.** Bump Admin Operator IA to v1.1 with a role-mapping table from the original 5 to the new hierarchy. Or designate one as canonical. Estimated: a few hours.

---

### MEDIUM-19 — Promotion Ledger P-007 originally cited authorizing instruction "Next" then was edited to "Continue" mid-session; the audit history of the edit is not captured

**Evidence.** P-007 in /home/claude/session3/Telecheck_Promotion_Ledger.md initially recorded the user's authorizing instruction as "Next" (per the file contents at session start). During this current session, the text was edited to "Continue" to match the actual instruction. The Promotion Ledger has no edit history mechanism — it's append-only, but content was modified in place.

**Why it's MEDIUM.** Violates the Promotion Ledger's own discipline ("Entries are never edited or deleted. Corrections are made by appending a new entry that references and supersedes the prior one."). The correction should have been P-008.5 or an explicit footnote, not an in-place edit.

**Remediation.** Append a brief note to the Promotion Ledger: "Editor's note: P-007 originally cited authorizing instruction as 'Next'; corrected to 'Continue' on 2026-04-25 to match the actual user instruction. The text-level correction was made in place rather than via supersession; this footnote captures the change history." Estimated: 5 minutes.

---

## LOW findings (4)

### LOW-20 — EHBG v1.1 section numbering doesn't mirror v1.0; readers familiar with v1.0 may be confused

EHBG v1.0 had §1-§14; v1.1 has §1-§15 with sections renumbered (§7 New entity deliverables is brand new; §8 Design contract enforcement is brand new; what was v1.0 §7 Claude Code setup is now v1.1 §13). Cross-references in third-party documents (e.g., other slice PRDs citing "EHBG §10") may now point to wrong content.

**Remediation.** Search corpus for "EHBG §" references; update; or add a v1.0→v1.1 section mapping table.

---

### LOW-21 — Multiple zip bundles produced across this session series will accumulate in /mnt/user-data/outputs/ and could confuse downstream readers

Sessions 1, 2, 3 each produced their own zip; then Master Bundle; then Engineering Handover. Five zips total in /mnt/user-data/outputs/. A user opening the outputs directory may grab the wrong one.

**Remediation.** None required from a documentation standpoint; user is aware. But if any future automation reads /mnt/user-data/outputs/, the engineering handover zip should be the canonical one.

---

### LOW-22 — Admin Backend Slice v1.0 §5.7 introduces AI-assisted operator features without specifying which AI provider executes them; references LLMProvider abstraction generically

The AI features (conversion anomaly detection, copy suggestions, cancellation reason clustering, inventory restock prediction) cite "LLM provider abstraction per ADR-020". ADR-020 designates Anthropic Claude as primary with multi-provider abstraction. Admin Backend doesn't specify which provider for non-clinical AI; presumably the cheapest/fastest. Could be made explicit.

**Remediation.** Add a sentence: "Non-clinical AI features (this section) default to the configured non-clinical LLM provider; tenants may not override."

---

### LOW-23 — Forms Engine v2.0 §14.3 "conversion event taxonomy" overlaps with PostHog's standard event conventions; no naming-convention reconciliation

Forms Engine v2.0 §14.3 invents events like `intake_started`, `intake_section_completed`. PostHog conventions typically use snake_case verbs like `intake started`. Forms Engine should specify whether the event names use PostHog convention or its own.

**Remediation.** Clarify in Forms Engine v2.0 §14.3 which naming convention is canonical.

---

## Cross-cutting pattern observations

Three patterns recur across the findings worth naming explicitly:

### Pattern A — Headline updates without substrate threading
The Sessions 1–3 work updated documents at the *headline* layer (Master PRD, ADRs, three Tier-1 slice PRDs, Design Implementation Contract) but did not update the *substrate* (Contracts Pack, Canonical Data Model, State Machines, OpenAPI, unchanged slice PRDs, IA documents, Notification Spec). 7 of the 12 findings in CRITICAL/HIGH severity are instances of this pattern.

**Root cause.** The work was sequenced as "produce new artifacts" rather than "propagate changes through dependent artifacts." A more disciplined sequence would have been: (1) ratify ADR; (2) update upstream contracts; (3) update CDM/State Machines/OpenAPI; (4) write new slice PRDs; (5) update affected unchanged slice PRDs.

**Mitigation for future change cycles.** When a foundational ADR is ratified, the change discipline should include a "downstream propagation checklist" that names every document that needs to be touched. Sessions 1–3 didn't have such a checklist.

### Pattern B — Content compression presented as preservation
The new versions of Master PRD, Pharmacy + Refill, and Engineering Handoff are substantially smaller than the documents they supersede, but the change logs frame the change as "added X" without acknowledging "removed Y." This violates honest-status discipline (Master PRD v1.7 §17) at the meta-level — the documents about the platform's honest-status posture are themselves not honest about what they no longer contain.

**Mitigation.** Bump version of any document where the change log understates content removal; add explicit "removed in this version" lists.

### Pattern C — Schemas and state machines living in slice PRDs rather than canonical engineering specs
Pharmacy + Refill v2.0 contains SQL schemas for Subscription, ProductCatalog, Cart, CartItem. Admin Backend v1.0 contains SQL schemas for DiscountCode, AffiliateAccount, AffiliateConversion. These belong in the Canonical Data Model per Source of Truth precedence (Tier 6 engineering specs > Tier 5 slice PRDs for implementation specs). Same for the subscription state machine — belongs in State Machines, not in slice PRD.

**Mitigation.** Tied to remediation of CRITICAL-02 and CRITICAL-03.

---

## Recommended remediation sequence

Based on dependencies and severity, the recommended remediation sequence is:

| Step | Action | Severity addressed | Estimated effort |
|---|---|---|---|
| 1 | Resolve Heros migration scope (HIGH-12) — product decision | HIGH-12 | 1 product session |
| 2 | Contracts Pack v5.1 with tenant threading (CRITICAL-01) | CRITICAL-01 | half session |
| 3 | CDM v1.2 with 8 ecom entities (CRITICAL-02) | CRITICAL-02, MEDIUM-16 | half session |
| 4 | State Machines v1.1 with subscription machine (CRITICAL-03) | CRITICAL-03 | few hours |
| 5 | OpenAPI v0.2 with new endpoints (CRITICAL-04) | CRITICAL-04 | half session |
| 6 | Tenant Threading Addendum v1.0 OR per-slice v1.1 bumps (CRITICAL-05) | CRITICAL-05 | 1 session |
| 7 | Restore lost content to Master PRD v1.7 (HIGH-06) | HIGH-06 | half session |
| 8 | Carry forward v1.0 content into Pharmacy + Refill v2.1 (HIGH-07) | HIGH-07 | 1 session |
| 9 | Restore Day-1-7 plan and CLAUDE.md template to EHBG v1.2 (HIGH-08, HIGH-09) | HIGH-08, HIGH-09 | few hours |
| 10 | Unified Admin Sidebar reconciliation (HIGH-10) | HIGH-10 | half session |
| 11 | Design files delivery (HIGH-11) — product action | HIGH-11 | product-side |
| 12 | Notification Spec v1.1 (MEDIUM-14) | MEDIUM-14 | half session |
| 13 | Design System v1.1 with tenant token overlay (MEDIUM-17) | MEDIUM-17 | 1 hour |
| 14 | Admin Operator IA v1.1 role mapping (MEDIUM-18) | MEDIUM-18 | few hours |
| 15 | Ghana Launch Playbook v1.1 (MEDIUM-15) | MEDIUM-15 | few hours |
| 16 | Registry v2.8 audit and corrections (MEDIUM-13) | MEDIUM-13 | 1 hour |
| 17 | Promotion Ledger footnote (MEDIUM-19) | MEDIUM-19 | 5 minutes |
| 18 | LOW findings batch | LOW-20, 22, 23 | few hours |

Total estimated effort: approximately 6–8 product sessions + 1 product-side decision (Heros migration scope) + product delivery of design files.

If the engineering build kicks off before this remediation completes, expect substantial mid-sprint clarifications and rework — particularly in Sprint 0 (audit module) and Sprints 1–3 (subscription, catalog, intake form).

---

## What this review did NOT cover

This review focused on **internal consistency and completeness of the document corpus**. It did not assess:

- Architectural correctness (whether ADR-023 multi-tenancy Model A is the right choice — that's an architecture review)
- Clinical safety (whether the medication interaction engine, AI Mode 2, and bridge supply logic are clinically sound — that's the role of the Clinical Lead and the deferred clinical safety case OR-004)
- Regulatory compliance (whether the platform satisfies HIPAA, Ghana Data Protection Act, etc. — deferred to OR-002 Ghana DPIA and US BAA work)
- Security (no STRIDE / threat-model review here — that's OR-001)
- Business viability (the investor materials are not in scope)
- Quality of the prose (I focused on substance, not style)
- Implementation correctness (no code exists to review)

These reviews are separate work and do not substitute for adversarial counsel review of the document corpus.

---

## Document control

- **v1.0** — Initial Adversarial Counsel Review of Sessions 1–3 outputs against the pre-session corpus. 23 findings: 5 CRITICAL, 7 HIGH, 7 MEDIUM, 4 LOW. Cross-cutting patterns identified: headline-update-without-substrate-threading, content-compression-presented-as-preservation, schemas-and-state-machines-living-in-slice-PRDs. Recommended 18-step remediation sequence with effort estimates.
- **Next review:** after remediation cycle completes. Re-run this review to verify findings closed and no new ones surfaced.
- **Change discipline:** if this review is challenged by product or engineering on specific findings, append a "Findings dispute log" rather than editing findings in place. Adversarial reviews carry weight precisely because the reviewer doesn't soften the conclusions.
