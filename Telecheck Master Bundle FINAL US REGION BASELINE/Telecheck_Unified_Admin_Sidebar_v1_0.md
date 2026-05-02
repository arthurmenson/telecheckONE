# Telecheck — Unified Admin Sidebar Specification

**Version:** 1.0
**Status:** Canonical — supersedes the sidebar/IA layout sections of the three predecessor documents
**Owner:** Product (Telecheck) + Design Lead
**Date:** 2026-04-25
**Origin:** Adversarial Counsel Review v1.0 finding HIGH-10 remediation
**Format:** Markdown

---

## 1. Purpose

This document reconciles the admin-side sidebar / information architecture across three predecessor documents that each defined an admin sidebar independently, producing overlap and ambiguity for engineering. Per Adversarial Counsel Review v1.0 finding HIGH-10, the overlap between Admin Operator IA v1.1, Admin Configuration Surfaces Slice PRD v1.0, and Admin Backend Slice PRD v1.1 (introduced in Session 2) was unresolved — three documents claimed authority over what the sidebar is, what its sections are, and who sees what.

This document establishes a single canonical sidebar with role-scoped visibility per RBAC v1.1. The substantive workflow content in each predecessor is preserved (those documents remain canonical for what each page DOES); the layout claim is reconciled here.

---

## 2. The three predecessor documents and what each contributed

### 2.1 Admin Operator IA v1.1

**Original scope:** Defined the admin sidebar for the original 5 platform-operator roles (admin, country_launch_director, clinical_governance_lead, ai_safety_lead, support_lead). 36 admin screens organized into a sidebar with sections for: Markets, Programs, Protocols, Users, Reports, AI Configuration, Audit, Settings.

**Content preserved by this document:** The substantive description of what each of the 36 screens does. Sidebar layout and role visibility superseded by §3 below.

**Authority status:** Per HIGH-10 remediation, sections of Admin Operator IA v1.1 describing screen content remain canonical. The sidebar layout in Admin Operator IA v1.1 is superseded.

### 2.2 Admin Configuration Surfaces Slice PRD v1.0

**Original scope:** Defined platform configuration surfaces — ProtocolLibrary, GuardrailTemplates, ProgramMarketPolicy, FeatureFlags, MarketLaunchPacks. Sidebar oriented around governance authority — who can change what, and how change-control flows through the surfaces.

**Content preserved by this document:** The governance contracts (validation rules, change-control rules, rollback authority) defined in this slice remain canonical and are referenced by §4 below.

**Authority status:** Per HIGH-10 remediation, the governance and change-control content is canonical. The sidebar layout is superseded.

### 2.3 Admin Backend Slice PRD v1.1

**Original scope:** Introduced in Session 2 to bring Telecheck's admin to gold-standard ecom parity (Hims/Ro/Hero level). Added: Tenant Admin role hierarchy alongside Platform Admin (the dual hierarchy per RBAC v1.1), per-tenant subscription management, refill management, catalog management, pricing, discount codes, affiliate program, AI-assisted operator features. Defined its own sidebar structure for §4 with sections for: Dashboard, Tenants (Platform Admin) / Subscriptions (Tenant Admin), Patients, Refills, Catalog, Pricing, Discount Codes, Affiliates, Reports, Settings.

**Content preserved by this document:** All workflow descriptions in Admin Backend §5 (subscription mgmt, refill mgmt, catalog mgmt, etc.). The Tenant Admin role hierarchy.

**Authority status:** Per HIGH-10 remediation, workflow content is canonical. Sidebar layout reconciled here.

---

## 3. Unified sidebar specification

A single canonical sidebar serves both Platform Admin and Tenant Admin role hierarchies via role-scoped visibility. The same physical UI component renders different sections based on the requesting user's role per RBAC v1.1.

### 3.1 Sidebar sections — full taxonomy

| # | Section | Visible to | Predecessor source | Notes |
|---|---|---|---|---|
| 1 | **Dashboard** | All admin roles (content varies per role) | Admin Backend v1.1 §4.1 | Per-role default landing page |
| 2 | **Tenants** | Platform Admin hierarchy only (Platform Owner, Platform Admin, Platform Operator) | Admin Backend v1.1 §4.2 (NEW Session 2) | Tenant CRUD, tenant onboarding, break-glass session log |
| 3 | **Markets** | Platform Admin hierarchy + Tenant Admin (read-only own tenant's markets) | Admin Operator IA v1.1 | Country-level rollout cockpit per Market Rollout Cockpit Slice PRD |
| 4 | **Programs** | Platform Admin (CRUD) + Tenant Admin (read-only) | Admin Operator IA v1.1 + Admin Backend v1.1 | Programs are platform-defined (Weight Loss, ED, Hair Loss, Skincare, Diabetes, Hypertension); tenants enable subset |
| 5 | **Protocols** | Platform Admin (CRUD) + Tenant Clinical Lead (per-tenant activation read+write) | Admin Configuration Surfaces Slice PRD v1.0 | Protocol Library — platform-scoped authoring, tenant-scoped activation |
| 6 | **Subscriptions** | Tenant Admin / Operator / Billing (per-tenant); Platform Admin (cross-tenant via break-glass) | Admin Backend v1.1 §5.2 | Per-tenant subscription queue, status filtering, search |
| 7 | **Patients** | Tenant Admin / Operator / Support (per-tenant); Platform Admin (cross-tenant via break-glass) | Admin Backend v1.1 §5.3 | Per-tenant patient list and profile views |
| 8 | **Refills** | Tenant Admin / Operator (per-tenant); Platform Admin (cross-tenant via break-glass) | Admin Backend v1.1 §5.2 | Per-tenant refill queue, exception handling |
| 9 | **Catalog** | Tenant Admin (CRUD per-tenant); Tenant Clinical Lead (clinical fields require approval); Platform Admin (read-only cross-tenant) | Admin Backend v1.1 §5.4 | Product catalog management per tenant |
| 10 | **Pricing** | Tenant Admin / Tenant Billing (CRUD per-tenant); Platform Admin (read-only) | Admin Backend v1.1 §5.4 | Per-tenant pricing tiers, currency, regional adjustments |
| 11 | **Discount Codes** | Tenant Admin / Tenant Marketing / Tenant Billing (CRUD per-tenant); Platform Admin (read-only) | Admin Backend v1.1 §5.4.3 | Per-tenant promotional codes |
| 12 | **Affiliates** | Tenant Admin / Tenant Marketing (CRUD per-tenant); Platform Admin (read-only cross-tenant for analytics) | Admin Backend v1.1 §5.5 | Per-tenant affiliate program management |
| 13 | **AI Configuration** | Platform Admin + Platform AI Safety + Platform Clinical Governance (CRUD platform-scoped); Tenant Clinical Lead (read-only on platform AI; CRUD on tenant guardrail overrides if granted) | Admin Operator IA v1.1 + Admin Configuration Surfaces v1.0 | Guardrail Templates, AI provider config, AI quality dashboards |
| 14 | **Forms / Intake** | Tenant Admin (CRUD per-tenant); Tenant Clinical Lead (clinical questions require approval); Platform Admin (read-only) | Forms Engine v2.1 builder embedded in admin | Visual form builder, A/B test management, intake analytics |
| 15 | **Reports** | All admin roles (content scoped: Tenant roles see tenant; Platform roles see platform aggregate or per-tenant via selector) | Admin Operator IA v1.1 + Admin Backend v1.1 | Metabase-backed reports, role-scoped visibility |
| 16 | **Audit** | Platform Admin + Platform Privacy Officer (full); Tenant Admin (own tenant only); Platform Clinical Governance (clinical scope cross-tenant) | Admin Operator IA v1.1 | Audit log query and export per AUDIT_EVENTS v5.1; tenant-scoped retrieval |
| 17 | **Users / Roles** | Platform Admin (Platform Admin hierarchy users); Tenant Admin / Tenant Owner (Tenant Admin hierarchy users in own tenant) | Admin Operator IA v1.1 + Admin Backend v1.1 | Per-hierarchy user management; clinician roster management |
| 18 | **Adapter Configuration** | Platform Admin (platform CountryProfiles); Tenant Admin (own tenant CCRConfig and AdapterConfig) | Admin Backend v1.1 §5.4.1-§5.4.2 + Admin Configuration Surfaces v1.0 | Pharmacy adapter selection, payment processor selection, notification channel config per tenant |
| 19 | **Settings** | All admin roles (content scoped) | Admin Operator IA v1.1 + Admin Backend v1.1 | Tenant brand (Tenant Admin); platform settings (Platform Admin); user preferences (all roles) |

### 3.2 Sidebar rendering logic per role

The sidebar component evaluates a role-visibility matrix at render time. For each section:

```
visibility = role_visibility_matrix[user.role][section]
if visibility == "hidden": do not render
if visibility == "read_only": render with read-only badge
if visibility == "full": render normally
```

Cross-tenant context (when a Platform Admin is in break-glass viewing a specific tenant) renders the Tenant Admin sidebar shape with a prominent break-glass banner per I-024.

### 3.3 Empty-state behavior

A Tenant Admin in a tenant that has no patients yet (e.g., **Telecheck-US** operating-tenant — trading patient-facing as the Heros Health DBA — at greenfield day 1) sees the sidebar with empty-state guidance per section: "Subscriptions — no subscriptions yet. Once your first patient signs up, they appear here." This is honest-status rendering per Master PRD v1.10 §17. Per C3 brand structure, `tenant.id = "Telecheck-US"` is the canonical operating-tenant identifier; the consumer DBA (`Heros Health`) is sourced from `tenant.consumer_dba` for patient-facing surfaces and is never rendered as the tenant identifier in admin contexts.

---

## 4. Per-section content ownership

Each sidebar section maps to canonical content authored elsewhere. This document owns the layout; content lives in its predecessor.

| Section | Content authority |
|---|---|
| Dashboard | Admin Backend v1.X §4.1 (per-role dashboards) |
| Tenants | Admin Backend v1.X §4.2 + Tenant Configuration module per System Architecture v1.2 §13 |
| Markets | Market Rollout Cockpit Slice PRD v1.0 |
| Programs | Master PRD v1.10 §3 (capability list) + §10.5 (program catalog architecture) + Admin Backend §5.4 (per-tenant program enablement) |
| Protocols | Admin Configuration Surfaces v1.0 (governance) + Protocol Library Ghana v1.0 (Ghana content) |
| Subscriptions | Admin Backend v1.X §5.2 + Pharmacy + Refill v2.X §8 (state machine) |
| Patients | Admin Backend v1.X §5.3 + Patient App IA v1.0 (data model) |
| Refills | Admin Backend v1.X §5.2 + Pharmacy + Refill v2.X §9-§22 |
| Catalog | Admin Backend v1.X §5.4 + Pharmacy + Refill v2.X §7 |
| Pricing | Admin Backend v1.X §5.4 + Payment & Billing Spec v1.0 |
| Discount Codes | Admin Backend v1.X §5.4.3 |
| Affiliates | Admin Backend v1.X §5.5 |
| AI Configuration | Admin Configuration Surfaces v1.0 + Guardrail Templates v1.0 + AI Clinical Assistant Slice v1.0 |
| Forms / Intake | Forms/Intake Engine Slice PRD v2.X (builder UI) |
| Reports | Admin Backend v1.X §5.6 (per-tenant analytics) + Admin Operator IA v1.1 (platform reports) |
| Audit | Audit Module per System Architecture v1.2 §11 + AUDIT_EVENTS contract v5.1 |
| Users / Roles | RBAC v1.1 (canonical role definitions) + Admin Backend v1.X §5.5 (UI) |
| Adapter Configuration | Admin Backend v1.X §5.4.1-§5.4.2 + Admin Configuration Surfaces v1.0 + CCR_RUNTIME contract v5.1 |
| Settings | Admin Backend v1.X (tenant settings) + Admin Operator IA v1.1 (platform settings) |

---

## 5. Migration note for the three predecessor documents

This unified sidebar specification supersedes the sidebar layout sections in:

1. **Admin Operator IA v1.1** — sidebar layout (the one with the original 5 platform roles) is superseded. The 36 admin screens described in Admin Operator IA v1.1 remain canonical for screen content; their sidebar location is governed by §3 above. Per MEDIUM-18 remediation, Admin Operator IA v1.1 will add a role mapping table from the original 5 roles to the dual hierarchy.

2. **Admin Configuration Surfaces Slice PRD v1.0** — substantive governance content (validation, change-control, rollback) remains canonical. Sidebar/IA layout claims are superseded by §3 above.

3. **Admin Backend Slice PRD v1.1** — workflow content for §5 (subscription mgmt, refill mgmt, catalog, pricing, discount codes, affiliates, reports, AI features) remains canonical. Sidebar layout in §4 is superseded by §3 above. Admin Backend v1.X bumps will reference this Unified Admin Sidebar v1.0 for sidebar layout rather than carrying their own.

---

## 6. RBAC v1.1 alignment

The role-visibility matrix in §3.1 is grounded in the dual hierarchy per RBAC v1.1:

**Platform Admin hierarchy:**
- Platform Owner — full visibility, full authority within platform-scope
- Platform Admin — full visibility, full authority within platform-scope (less than Owner — e.g., cannot create new Platform Admins)
- Platform Operator — operational visibility (Tenants, Markets, Reports, Audit), no platform-config authority
- Platform Support — read-only across tenants via break-glass when authorized
- Platform Clinical Governance — full visibility on clinical content (Protocols, AI Configuration, Audit clinical scope)
- Platform AI Safety — full visibility on AI Configuration, AI quality dashboards
- Platform Privacy Officer — full visibility on Audit, break-glass session reviews
- Platform Security Officer — full visibility on Audit, security-related Reports

**Tenant Admin hierarchy:**
- Tenant Owner — full visibility, full authority within own tenant scope
- Tenant Admin — operational visibility within own tenant
- Tenant Operator — patient-facing operational tasks (consult queue, refill exceptions, patient support)
- Tenant Billing — Pricing, Discount Codes, Affiliate payouts, billing Reports
- Tenant Clinical Lead — Protocols (activation), AI Configuration overrides, clinical fields in Catalog
- Tenant Marketing — Discount Codes, Affiliates, marketing-related Reports
- Tenant Support — patient support tasks (read-only patient profile)

A single human may hold roles in both hierarchies (rare but supported); the sidebar reflects whichever role context is currently active.

---

## 7. Open questions

1. **Sidebar collapsibility / responsive behavior** — defer to design files when delivered (per HIGH-11 PROVISIONAL DIC status)
2. **Mobile admin app at launch** — out of launch scope; admin is desktop-web at launch
3. **Role-scoped landing pages per Dashboard** — defined per role in Admin Backend v1.X §4.1; no further reconciliation needed here
4. **Search behavior in sidebar** — global search vs section-scoped search; defer to design files

---

## 8. Dependencies

- RBAC v1.1 — role definitions
- Admin Operator IA v1.1 — screen content authority
- Admin Configuration Surfaces Slice PRD v1.0 — governance content authority
- Admin Backend Slice PRD v1.X — workflow content authority
- Master PRD v1.10 — product context
- Tenant Threading Addendum v1.0 §3.13 (Patient App IA) — patient-side tenant context comparison
- Design System v1.X — token system for sidebar visual rendering
- DIC v1.1 (Canonical for development; supersedes v1.0 PROVISIONAL per v1.10 promotion 2026-05-01) — design–engineering contract

---

## Document control

- **v1.0** — NEW reconciliation document produced as remediation for Adversarial Counsel Review v1.0 finding HIGH-10. Establishes single canonical sidebar with role-scoped visibility per RBAC v1.1. Supersedes the sidebar layout sections of Admin Operator IA v1.1, Admin Configuration Surfaces Slice PRD v1.0, and Admin Backend Slice PRD v1.1 (workflow and screen content in those documents preserved). 19 sidebar sections defined with per-section role-visibility matrix and content authority mapping.
- **Next review:** after first patient signup in either tenant; after Sprint 6 completes Admin Backend Platform Admin tenant management surfaces; after Sprint 7 completes Admin Backend Tenant Admin subscription/refill management UI.
- **Change discipline:** changes to sidebar sections, visibility rules, or section content authority require Engineering Lead + Design Lead + Product Lead sign-off.
