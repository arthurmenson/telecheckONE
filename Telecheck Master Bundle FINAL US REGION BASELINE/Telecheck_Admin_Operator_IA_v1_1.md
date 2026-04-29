# Telecheck — Admin & Operator Portal Information Architecture

**Version:** 1.1
**Status:** Canonical for development
**Owner:** Product (Telecheck)
**Parent documents:** Master PRD v1.6, Admin Configuration Surfaces Slice PRD v1.0, Market Rollout Cockpit Slice PRD v1.0, RBAC Permissions Matrix v1.0

---

## 1. Purpose

The admin/operator portal is where the platform is governed, configured, monitored, and operated. It serves a small number of high-authority users: the Country Launch Director, Clinical Governance Lead, AI Safety Lead, Support Lead, and general admins. Every screen in this portal has significant downstream impact — a single toggle can activate a protocol affecting thousands of patients or enter Emergency Safe Mode for an entire market.

This document defines: what operators see, how they navigate, what they can change, and what guardrails prevent accidental damage.

**Core design constraint:** Every action in this portal is high-consequence and low-frequency. The UX prioritizes clarity, confirmation, and auditability over speed. No action executes without a visible preview of its impact.

---

## 2. Navigation model

### 2.1 Primary navigation — left sidebar with role-scoped visibility

The admin portal uses a persistent left sidebar. Items are visible based on the operator's role — not every operator sees every section.

```
┌──────────────────┬────────────────────────────────────────────┐
│                  │                                            │
│  Dashboard       │         [Active workspace]                 │
│                  │                                            │
│  Markets         │                                            │
│                  │                                            │
│  Protocols       │                                            │
│                  │                                            │
│  AI Guardrails   │                                            │
│                  │                                            │
│  Moderation      │                                            │
│                  │                                            │
│  Users           │                                            │
│                  │                                            │
│  Incidents       │                                            │
│                  │                                            │
│  Reporting       │                                            │
│                  │                                            │
│  Commerce        │                                            │
│                  │                                            │
│  Audit           │                                            │
│                  │                                            │
│  Settings        │                                            │
│ ────────────     │                                            │
│  [Name]          │                                            │
│  [Role]          │                                            │
└──────────────────┴────────────────────────────────────────────┘
```

### 2.2 Role-scoped sidebar visibility

| Sidebar item | admin | country_launch_director | clinical_governance_lead | ai_safety_lead | support_lead |
|---|---|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Markets | view | full | view | view | view + emergency |
| Protocols | view | view | full | view | view |
| AI Guardrails | view | view | view | full | view |
| Moderation | view | view | view | view | view |
| Users | full | full | view | view | full |
| Incidents | view | view | view | view | full |
| Reporting | full | full | full | full | full |
| Commerce | full | full | view | view | view |
| Audit | full | full | full | full | full |
| Settings | full | full | limited | limited | limited |

"view" = read-only access. "full" = read + write + action authority. "limited" = own preferences only.

---

## 3. Screen architecture

### 3.1 Dashboard

The operator's morning view. Role-aware — each role sees the metrics most relevant to their authority.

```
Dashboard
├── System Health
│   ├── Module status (13 modules + AI Service: healthy/degraded/down)
│   ├── API latency (p50, p95, p99)
│   ├── Error rate (trailing 1h, 24h)
│   └── Active users (patients, clinicians, pharmacists)
│
├── Market Status (per active market)
│   ├── Market Pack state (PILOT / LIMITED / FULL / etc.)
│   ├── Readiness summary (categories with status)
│   ├── Active incidents (count + severity)
│   └── [View Market] → Markets section
│
├── Clinical Operations (visible to clinical_governance_lead, country_launch_director)
│   ├── Async queue depth + avg time-in-queue
│   ├── Clinician panel: available / on-call / offline
│   ├── Refill review backlog
│   ├── Protocol execution count (trailing 24h)
│   ├── Override rate (trailing 7d)
│   └── Adverse events: open / this week / this month
│
├── AI Operations (visible to ai_safety_lead)
│   ├── Mode 1 sessions (trailing 24h)
│   ├── Mode 2 preparations (trailing 24h)
│   ├── Escalation rate
│   ├── Crisis detection triggers
│   ├── Active guardrail template per market
│   └── AI provider health (latency, error rate)
│
├── Community Health (visible to all)
│   ├── Moderation queue depth
│   ├── Posts published / flagged / removed (trailing 24h)
│   ├── Crisis detections (trailing 7d)
│   └── Active moderators
│
└── Alerts & Actions Needed
    ├── Protocol reviews due
    ├── Guardrail reviews due
    ├── Readiness items not-ready
    ├── Unresolved incidents
    └── SLA breaches
```

### 3.2 Markets (Rollout Cockpit)

The Market Rollout Cockpit from the slice PRD, rendered as an admin surface.

```
Markets
├── Market Selector (tabs or cards per active/planned market)
│
├── [Ghana] Market Detail
│   ├── Overview
│   │   ├── Pack state: FULL_LAUNCH (v3)
│   │   ├── State since: 2026-06-15
│   │   ├── Active capabilities (toggle list with status)
│   │   ├── Pack version history (timeline)
│   │   └── [Change State] → state transition flow
│   │
│   ├── Readiness Checklist
│   │   ├── Clinical: ✓ Ready (5/5 clinicians, protocols approved)
│   │   ├── AI: ✓ Ready (Conservative Default + 3 templates active)
│   │   ├── Pharmacy: ✓ Ready (1 platform + 1 partner)
│   │   ├── Technology: ✓ Ready (all critical-path functional)
│   │   ├── Operations: ✓ Ready (incident playbook, rollback tested)
│   │   ├── Community: ✓ Ready (2 moderators + 1 on-call)
│   │   └── Regulatory: ✓ Ready (FDA engaged, MDC sign-off)
│   │
│   ├── Dependency Checker
│   │   ├── Status of all launch dependencies
│   │   ├── Dependency health (green/amber/red per dependency)
│   │   └── [Run Check] → re-evaluate all dependencies
│   │
│   ├── Evidence Locker
│   │   ├── Regulatory evidence (uploaded documents)
│   │   ├── Clinical sign-offs
│   │   ├── Test results
│   │   ├── Approval records
│   │   └── [Upload Evidence]
│   │
│   ├── Active Configuration
│   │   ├── Protocols active (list with version, accountability, review date)
│   │   ├── Guardrail templates active (list with version)
│   │   ├── Moderation policies active (list with version)
│   │   ├── Pricing configuration
│   │   └── Clinician panel roster
│   │
│   └── Emergency Controls
│       ├── [Enter Emergency Safe Mode] → confirmation flow with blast-radius preview
│       ├── [Restrict Capabilities] → selective capability deactivation
│       ├── [Suspend Market] → full suspension (most severe)
│       └── Recent emergency actions (history)
│
└── [Nigeria] Market Detail (when activated)
    └── Same structure, DRAFT state
```

**State transition flow (Change State):**

```
1. Select target state
2. System shows: 
   - What changes (capabilities activated/deactivated)
   - Prerequisites not yet met (blockers)
   - Downstream effects (who is impacted)
3. Require confirmation: "I understand this changes [market] from [current] to [target]"
4. Require authorization: role check against required authority for this transition
5. Execute with 60-second propagation (INCIDENT-003)
6. Confirmation screen with effective timestamp
```

**Emergency Safe Mode flow:**

```
1. [Enter Emergency Safe Mode] button (red, prominent)
2. Blast-radius preview:
   - Protocols that will be deactivated: [list with affected patient count]
   - Guardrails reverting to Conservative Default
   - Moderation reverting to strictest
   - Affected workflows: [list]
3. Reason field (mandatory, minimum 20 characters)
4. Authorization confirmation: "I am [Name], [Role], authorizing Emergency Safe Mode for [Market]"
5. Execute
6. Confirmation: "Emergency Safe Mode active. All configurable behavior reverted to defaults."
7. Operations team auto-notified via SMS
```

### 3.3 Protocols

```
Protocols
├── Active Protocols
│   ├── [Protocol Card]
│   │   ├── Name, version, market, status (active/expired/deactivated)
│   │   ├── Accountable clinician
│   │   ├── Activation date, review due date
│   │   ├── Execution count (trailing 30d)
│   │   ├── Incident count (linked adverse events)
│   │   ├── Override rate for protocol-produced signals
│   │   ├── [View Detail] → protocol detail
│   │   ├── [Deactivate] → one-action deactivation (PROTO-004)
│   │   └── [Trigger Review] → off-cycle review (PROTO-003)
│   └── [Protocol Card 2]
│
├── Protocol Detail
│   ├── Protocol definition (clinical logic, eligibility criteria, check gates)
│   ├── Sign-off records (clinical, regulatory, technical)
│   ├── Test suite results
│   ├── Version history
│   ├── Execution log (recent executions with outcomes)
│   ├── Incident log (linked adverse events)
│   ├── Performance metrics
│   │   ├── Executions per day
│   │   ├── Fallback-to-clinician rate
│   │   ├── Override correlation (overrides that led to adverse events)
│   │   └── Time saved vs clinician-review baseline
│   └── Review history (past reviews with outcomes)
│
├── Protocol Library
│   ├── Available protocols (not yet activated)
│   ├── [Activate] → activation flow with sign-off collection
│   └── Draft protocols (in development)
│
├── Activation Flow
│   ├── Select protocol and market
│   ├── Sign-off checklist:
│   │   ├── Clinical approval: [Name, Date] or [Not yet]
│   │   ├── Regulatory approval: [Name, Date] or [Not required] or [Not yet]
│   │   ├── Test suite: [Passed on Date] or [Not run]
│   │   ├── Audit visibility: [Confirmed] or [Not confirmed]
│   │   ├── Rollback tested: [Confirmed] or [Not confirmed]
│   ├── All sign-offs required before [Activate] becomes available
│   └── Confirmation with effective date/time
│
└── Review Calendar
    ├── Protocols due for review (chronological)
    ├── Overdue reviews highlighted (red)
    └── [Schedule Review] per protocol
```

### 3.4 AI Guardrails

```
AI Guardrails
├── Active Templates (per market)
│   ├── [Template Card]
│   │   ├── Name, version, market, status
│   │   ├── Deployment date
│   │   ├── Session count (trailing 7d)
│   │   ├── Escalation rate
│   │   ├── Crisis detection count
│   │   ├── [View Detail] → template detail
│   │   └── [Revert to Conservative Default] → one-action (GUARD-003)
│   └── [Template Card 2]
│
├── Template Detail
│   ├── Scope definition (what AI may/may not discuss)
│   ├── Framing rules (how uncertainty is expressed)
│   ├── Escalation triggers
│   ├── Refusal behavior
│   ├── Platform floor integration (which FLOOR contracts apply)
│   ├── Test suite (test cases with pass/fail status)
│   └── Version history with diffs
│
├── Template Library
│   ├── Available templates (not deployed)
│   ├── [Deploy] → deployment flow with test suite requirement
│   └── Draft templates (in development)
│
├── Deployment Flow
│   ├── Select template and market
│   ├── Test suite results: [All passed] or [X failures — cannot deploy]
│   ├── Floor compatibility check: [Passed] or [Floor violation detected — cannot deploy]
│   ├── Preview: sample AI responses under new template
│   ├── Confirmation
│   └── Deployment with version tracking
│
├── AI Quality Dashboard
│   ├── Mode 1 metrics: sessions, escalations, crisis detections, avg session length
│   ├── Mode 2 metrics: cases prepared, physician agreement rate, modification rate, disagreement rate
│   ├── Scribe metrics: summaries generated, clinician edit rate
│   ├── Provider health: latency, error rate, failover status
│   └── Trend charts (trailing 30d, 90d)
│
└── Conservative Default
    ├── Current definition (read-only — this is the floor)
    ├── Test suite (always passing)
    └── Note: "This template cannot be modified. It is the fallback for all markets."
```

### 3.5 Moderation

```
Moderation
├── Active Policies (per market)
│   ├── Policy detail (rules, thresholds, escalation paths)
│   ├── [Deploy New Policy] → deployment flow
│   └── Version history
│
├── Moderation Analytics
│   ├── Posts screened / published / flagged / hidden / removed (trailing 7d, 30d)
│   ├── Moderator workload (actions per moderator per day)
│   ├── False-positive rate (flagged → approved after review)
│   ├── Appeal rate and outcome distribution
│   ├── Crisis detection count and response time
│   └── Content category breakdown
│
├── Moderator Management
│   ├── Active moderators with workload
│   ├── On-call schedule
│   └── [Add/Remove Moderator]
│
└── Community Guidelines
    ├── Current guidelines document
    ├── Version history
    └── [Update Guidelines] → version-controlled update
```

### 3.6 Users

```
Users
├── Patient Search
│   ├── Search by name, phone, email, account ID
│   ├── Results: name, account status, market, programs enrolled
│   ├── [View Profile] → patient admin view (not clinical — no clinical decisions here)
│   └── [Suspend / Unsuspend]
│
├── Patient Admin View
│   ├── Account status and verification level
│   ├── Active programs
│   ├── Active delegations
│   ├── Active consents
│   ├── Payment history summary
│   ├── Support case history
│   ├── Account actions: suspend, unsuspend, reset verification
│   └── Note: "For clinical data, use the Clinician Portal"
│
├── Clinician Roster
│   ├── Active clinicians with: status, markets, programs, queue load
│   ├── Coverage schedule
│   ├── Quality metrics summary (override rate, agreement rate, time-to-decision)
│   ├── [Add Clinician] → onboarding flow
│   └── [Manage Availability]
│
├── Pharmacist Roster
│   ├── Active pharmacists with: pharmacy assignment, fulfillment count
│   └── [Add / Remove Pharmacist]
│
├── Moderator Roster
│   └── (Linked to Moderation section)
│
└── Admin & Elevated Roles
    ├── Current role assignments
    ├── Role assignment history (audit trail)
    └── [Assign / Revoke Role] (requires existing elevated role to assign)
```

### 3.7 Incidents

```
Incidents
├── Active Incidents
│   ├── [Incident Card]
│   │   ├── Severity, title, affected market(s), affected capability(ies)
│   │   ├── Status: investigating / mitigating / resolved / post-mortem
│   │   ├── Duration (time since detected)
│   │   ├── Assigned responder
│   │   ├── [View Detail] → incident workspace
│   │   └── [Escalate] → notify additional responders
│   └── [Incident Card 2]
│
├── Incident Workspace
│   ├── Timeline (events in chronological order)
│   ├── Affected systems and patients (scope assessment)
│   ├── Actions taken (rollback, deactivation, safe mode)
│   ├── Communication log (who was notified, when)
│   ├── Linked adverse events
│   ├── [Add Update]
│   ├── [Execute Rollback] → specific capability rollback (INCIDENT-002)
│   ├── [Enter Emergency Safe Mode] → (linked to Markets section)
│   └── [Resolve] → resolution with root cause and corrective actions
│
├── Incident History
│   ├── Past incidents with resolution and duration
│   ├── Filterable by market, severity, capability
│   └── Post-mortem documents
│
└── [Create Incident] → manual incident creation
```

### 3.8 Reporting

```
Reporting
├── Clinical Reports
│   ├── Consult volume (async/sync, by program, by clinician)
│   ├── Time-to-decision distribution
│   ├── Prescription volume by medication class
│   ├── Refill completion rate
│   ├── Protocol execution vs clinician-review ratio
│   ├── Override rate by signal severity
│   └── Adverse event summary
│
├── Operational Reports
│   ├── Onboarding funnel (started → completed → enrolled)
│   ├── Payment success rate by method
│   ├── Notification delivery rate by channel
│   ├── Pharmacy fulfillment SLA adherence
│   ├── Delivery success rate
│   └── Community engagement (DAU, posts, reactions)
│
├── Safety Reports
│   ├── Interaction engine signal rate (trending)
│   ├── Override → adverse event correlation
│   ├── Protocol → adverse event correlation
│   ├── AI escalation patterns
│   ├── Crisis detection frequency and response time
│   └── Fake medication detection rate and false-positive rate
│
├── Financial Reports
│   ├── Revenue by stream (consult fees, medication sales, refills, subscriptions)
│   ├── Payment volume and success rate
│   ├── Refund volume and reasons
│   ├── Subscription churn
│   └── Clinician compensation summary
│
└── Regulatory Export
    ├── Audit trail export (date range, market, format)
    ├── Adverse event report (Ghana FDA format)
    └── [Generate Export] → async export with download link
```

### 3.9 Commerce

```
Commerce
├── Catalog Management
│   ├── Medication catalog (add, update, deactivate)
│   ├── Product pricing (per market)
│   ├── Consultation fee configuration
│   ├── Subscription plan configuration
│   └── Refill pricing rules
│
├── Pharmacy Management
│   ├── Platform pharmacy: inventory, operations
│   ├── Partner pharmacies: integration status, fulfillment SLA
│   └── Delivery partner: integration status, performance
│
└── Order Dashboard
    ├── Active orders by status
    ├── Exception queue
    └── Delivery performance
```

### 3.10 Audit

```
Audit
├── Audit Explorer
│   ├── Search: entity type, entity ID, actor, date range, market, action type
│   ├── Results: chronological audit records with full context
│   ├── [View Record] → full audit detail including previous/new state
│   └── Filterable, exportable
│
├── Regulatory Export
│   ├── Export configuration (market, date range, entity types, format)
│   ├── [Generate Export] → async with download
│   └── Export history
│
└── Audit Health
    ├── Audit write success rate
    ├── Audit volume by entity type
    └── Retention status
```

---

## 4. Confirmation patterns

Every high-consequence action uses a multi-step confirmation:

### 4.1 Standard confirmation (e.g., deploy guardrail template)

```
Step 1: Preview — "You are about to deploy [template name] v[version] to [market]"
Step 2: Impact — "This will change AI behavior for [X] active patients"
Step 3: Checklist — "Test suite passed: ✓  Floor compatibility: ✓"
Step 4: Confirmation — "I confirm this action" [button]
Step 5: Result — "Deployed successfully at [timestamp]"
```

### 4.2 Destructive confirmation (e.g., Emergency Safe Mode, market suspension)

```
Step 1: Warning banner (red) — "This is a high-impact emergency action"
Step 2: Blast-radius preview — exactly what will change, how many patients/workflows affected
Step 3: Reason field (mandatory, minimum 20 characters)
Step 4: Identity confirmation — "I am [auto-populated name and role]"
Step 5: Type-to-confirm — "Type EMERGENCY SAFE MODE to confirm"
Step 6: Execute
Step 7: Result with timestamp, notification recipients, and revert instructions
```

### 4.3 One-action rollback (e.g., deactivate protocol, revert guardrail)

```
Step 1: Preview — "You are about to deactivate [protocol name]"
Step 2: Impact — "X active workflows will fall back to clinician review"
Step 3: Reason field (mandatory)
Step 4: Confirmation — "I confirm this rollback" [button]
Step 5: Result — "Deactivated at [timestamp]. Fallback active within 60 seconds."
```

---

## 5. Screen inventory

| # | Screen | Primary users | Priority |
|---|---|---|---|
| 1 | Dashboard | All operators | Critical-path |
| 2 | Market overview (list) | All operators | Critical-path |
| 3 | Market detail | country_launch_director | Critical-path |
| 4 | Readiness checklist | country_launch_director | Critical-path |
| 5 | Dependency checker | country_launch_director | Launch |
| 6 | Evidence locker | country_launch_director, admin | Launch |
| 7 | State transition flow | country_launch_director | Critical-path |
| 8 | Emergency Safe Mode flow | country_launch_director, support_lead | Critical-path |
| 9 | Active protocols list | clinical_governance_lead | Critical-path |
| 10 | Protocol detail | clinical_governance_lead | Critical-path |
| 11 | Protocol activation flow | clinical_governance_lead | Critical-path |
| 12 | Protocol library | clinical_governance_lead | Launch |
| 13 | Review calendar | clinical_governance_lead | Launch |
| 14 | Active guardrail templates | ai_safety_lead | Critical-path |
| 15 | Template detail | ai_safety_lead | Critical-path |
| 16 | Template deployment flow | ai_safety_lead | Critical-path |
| 17 | AI quality dashboard | ai_safety_lead | Launch |
| 18 | Moderation policies | admin | Launch |
| 19 | Moderation analytics | admin | Launch |
| 20 | Patient search | admin, support_lead | Critical-path |
| 21 | Patient admin view | admin, support_lead | Critical-path |
| 22 | Clinician roster | admin, clinical_governance_lead | Critical-path |
| 23 | Pharmacist roster | admin | Launch |
| 24 | Admin role management | country_launch_director | Launch |
| 25 | Active incidents list | support_lead | Critical-path |
| 26 | Incident workspace | support_lead | Critical-path |
| 27 | Incident history | support_lead | Launch |
| 28 | Clinical reports | clinical_governance_lead, admin | Launch |
| 29 | Operational reports | country_launch_director, admin | Launch |
| 30 | Safety reports | clinical_governance_lead, ai_safety_lead | Launch |
| 31 | Financial reports | admin | Launch |
| 32 | Regulatory export | admin | Launch |
| 33 | Catalog management | admin | Launch |
| 34 | Pharmacy management | admin | Launch |
| 35 | Audit explorer | admin, all elevated | Critical-path |
| 36 | Settings | All operators | Launch |

**36 screens.** 16 critical-path, 20 launch-scope.

---

## 6. Design adaptations from clinician portal

The admin portal shares the Design System's color palette, typography, and component library with two modifications:

**Destructive actions use a distinct visual treatment.** Emergency Safe Mode, market suspension, and protocol deactivation buttons are red with a warning icon, never in the primary teal. They are visually separated from standard actions by spacing and container treatment.

**Confirmation flows are multi-step, not single-click.** Unlike the clinician portal where approve/decline are single-action with rationale, admin actions use the multi-step confirmation patterns defined in §4. This is deliberate friction for high-consequence actions.

**Role-scoped visibility is enforced server-side.** Sidebar items that an operator doesn't have access to are not rendered. Hidden items are not shown as disabled — they're absent. This prevents confusion about what an operator can and cannot do.

---

## 7. Total platform screen inventory

| Portal | Screens | Critical-path |
|---|---|---|
| Patient App | 48 | 20 |
| Clinician Portal | 34 | 12 |
| Admin/Operator Portal | 36 | 16 |
| **Total** | **118** | **48** |

---

## Role mapping to RBAC v1.1 dual hierarchy (added v1.1)

Per ADR-023 multi-tenancy and RBAC v1.1 dual hierarchy, the original 5 admin roles in this v1.0 IA are mapped to the new role structure introduced in RBAC v1.1.

### Mapping table

| Original v1.0 admin role | Maps to RBAC v1.1 role(s) | Hierarchy | Notes |
|---|---|---|---|
| `admin` (general administrator) | Platform Admin (cross-tenant ops) + Tenant Admin per tenant | Both | The original generic "admin" splits — platform-level administration (tenant management, country profile, platform config) is Platform Admin; per-tenant administration (subscription mgmt, catalog, brand) is Tenant Admin. |
| `country_launch_director` | Platform Operator (with country-launch responsibilities) | Platform | Country launch is platform-scoped (the Telecheck platform launches in a country; tenants then operate in that country). |
| `clinical_governance_lead` | Platform Clinical Governance | Platform | Cross-tenant clinical pattern review; protocol approval at platform level. Per-tenant Clinical Lead is a Tenant role for tenant-scoped clinical governance. |
| `ai_safety_lead` | Platform AI Safety | Platform | Cross-tenant AI calibration, guardrail template authority at platform level. |
| `support_lead` | Platform Support + Tenant Support per tenant | Both | Platform Support handles cross-tenant infrastructure issues; Tenant Support handles tenant-specific patient and operational support. |

### Sidebar visibility rules (cross-reference Unified Admin Sidebar v1.0)

The sidebar layout in this v1.0 IA §3 is superseded by Unified Admin Sidebar v1.0 §3.A (Platform Admin sidebar). The 36 screens in this IA's §5 inventory are preserved and re-mapped into Unified Sidebar §3.A's 8 top-level sections. See Unified Admin Sidebar v1.0 §4 for the section ownership map.

### Tenant Admin hierarchy reference

The Tenant Admin hierarchy (Tenant Owner, Tenant Admin, Tenant Operator, Tenant Billing, Tenant Clinical Lead, Tenant Marketing, Tenant Support) operates per-tenant surfaces, primarily defined in Admin Backend Slice v1.X. This v1.0 Admin Operator IA was authored before RBAC v1.1 and the Tenant Admin hierarchy existed; the surfaces relevant to Tenant Admin are now properly homed in Admin Backend v1.X. This v1.0 IA's substantive content is Platform Admin-focused.

### Substantive content in this IA — still canonical

The 36 platform-admin screens, the confirmation patterns (standard, destructive, rollback), the Emergency Safe Mode flow, and the design adaptations from clinician portal — all remain canonical at v1.0 content depth. v1.1 adds only the role-mapping clarification.

---

## Document control

- **v1.1** — Adds Role mapping to RBAC v1.1 dual hierarchy section. Maps original 5 v1.0 admin roles (admin, country_launch_director, clinical_governance_lead, ai_safety_lead, support_lead) to RBAC v1.1 Platform Admin and Tenant Admin hierarchy roles. Cross-references Unified Admin Sidebar v1.0 for sidebar layout (which supersedes this IA's §3 navigation model). Threading remediation per Adversarial Counsel Review v1.0 finding MEDIUM-18. Existing 36 screens, confirmation patterns, Emergency Safe Mode flow, and design adaptations preserved without modification.
- **v1.0** — Initial Admin & Operator Portal IA. 36 screens across 10 sections: Dashboard, Markets (Rollout Cockpit), Protocols, AI Guardrails, Moderation, Users, Incidents, Reporting, Commerce, Audit. Role-scoped navigation for 5 operator roles. Three confirmation patterns (standard, destructive, rollback). Derived from Admin Configuration Surfaces Slice PRD, Market Rollout Cockpit Slice PRD, and RBAC Permissions Matrix.
- **Next review:** after Design System visual treatment for admin-specific patterns; after first operator usability testing.
- **Change discipline:** changes to role-scoped visibility, confirmation patterns, or Emergency Safe Mode flow require Product + Engineering Lead sign-off.
