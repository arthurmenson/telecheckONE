# Telecheck — Admin: Market Rollout Cockpit Slice PRD

**Version:** 1.0
**Status:** Canonical for development
**Owner:** Market Control Plane Lead
**Parent document:** Telecheck Master Platform PRD v1.9, §6, §14
**Companion documents:** Admin — Guardrail Configuration Slice PRD (#18), Admin — Moderation Policy Configuration Slice PRD (#19), Admin — Protocol Activation & Governance Slice PRD (#20), v5 Contracts Pack

---

## 1. Purpose and strategic role

The Market Rollout Cockpit is the governance state layer that sits above the three admin configuration surfaces (guardrails, moderation policies, protocol activation) and composes them into coherent per-market operating views. It is not a navigation shell, not a settings page, and not a dashboard. It is the operating system through which Telecheck launches, governs, monitors, and rolls back market-level behavior.

Without the cockpit, Telecheck's configurable governance architecture — jurisdiction-aware protocols, admin-configurable guardrails, market-specific moderation policies — operates as disconnected configuration surfaces. An operator activating a protocol in one surface cannot see whether the guardrail dependency for that protocol is met in another surface, whether the pharmacy partner is ready, whether the regulatory evidence is complete, or whether moderation capacity is sufficient for the community impact. The cockpit makes those dependencies visible, enforceable, and auditable.

The cockpit owns truth that no other admin tool maintains: market-level readiness, activation state, evidence completeness, partner status, rollback targets, and market-level operating posture. These are not views into other tools — they are first-class state that the platform needs to maintain and enforce.

This slice defines:
- The Market Pack abstraction — what a market is, structurally
- What the cockpit surfaces at each level (country workspace, activation review, incident/rollback)
- How the cockpit composes the three admin configuration surfaces per market
- How the dependency checker works
- How the blast-radius preview works
- How the evidence locker works
- Who sees what (persona-scoped views)
- What is audited

---

## 2. Traceability

| Master PRD reference | This slice addresses |
|---|---|
| §6 Market and launch strategy — Market operations tooling | Cockpit is the operational tool for market expansion |
| §8 Job 13 — Configure and govern AI, moderation, and protocol behavior | Cockpit is the composition layer for configuration |
| §13.5 Governance of configurable autonomy | Cockpit enforces review cadences, sunset logic, and rollback |
| §14 Admin configuration surfaces — Market Rollout Cockpit | Full cockpit definition |
| §11.1 Launch scope — Admin operations console | Cockpit is part of the launch admin surface |
| §11.4 Critical-path subset | Admin operations console is critical-path; cockpit country workspace is useful even for single-market launch |

---

## 3. Actors

| Actor | Role in the cockpit |
|---|---|
| **Country Launch Director** | Primary operator. Uses the cockpit to assess market readiness, approve activations, manage rollouts, and respond to incidents. Sees the full country workspace. |
| **Clinical Governance Lead** | Reviews protocol status, review cadences, override rates, and protocol-linked incidents. Approves protocol activations from within the cockpit. |
| **AI Safety & Guardrails Lead** | Reviews guardrail template status, refusal rates, escalation rates, and guardrail-linked incidents. Approves template activations. |
| **Regulatory & Partner Affairs Lead** | Reviews regulatory evidence completeness, license status, partner agreements, and submission deadlines. Manages the evidence locker. |
| **Pharmacy Operations Lead** | Reviews pharmacy partner status, delivery readiness, inventory health, and dispensing release protocol status. |
| **Community Safety & Moderation Lead** | Reviews moderation policy status, moderator capacity, crisis escalation metrics, and moderation-linked incidents. |
| **Payments & Billing Operations Lead** | Reviews payment rail status, billing infrastructure health, and payment failure rates. |
| **Support & Incident Response Lead** | Uses the incident/rollback center. Reviews active incidents, triggers rollbacks, manages emergency safe mode. |

---

## 4. The Market Pack abstraction

Every market in Telecheck is represented as a **Market Pack** — a structured, versioned container that holds the complete operating configuration for that market. The Market Pack is the reasoning unit ("Ghana is running Market Pack v3.2") and the rollback unit (reverting a market means loading a previous pack version, not toggling individual settings).

### 4.1 What a Market Pack contains

| Component | Description |
|---|---|
| **Market identity** | Country, region, operating entity, launch date, current rollout state |
| **Policy configuration** | Consent model, identity requirements, emergency escalation logic, sensitive-category rules, **jurisdictional data residency rules** (consent regime, retention, DPC obligations, sub-processor disclosure — *not* physical region; per ADR-026 / I-028 physical region is single us-east-1 at launch), allowed modules |
| **Protocol library** | All approved protocols for this market — each with version, activation state, accountable approver, eligibility criteria, exclusion rules, review date, expiry date, rollback target |
| **Guardrail assignments** | Which AI guardrail templates are active, per program. Each with version, deployment date, test suite status |
| **Moderation policies** | Community moderation rules for this market — content policies, action thresholds, moderator roles, escalation pathways |
| **Partner registry** | Pharmacy partners, delivery partners, lab partners, clinical partners — each with integration status, SLA, and contract evidence |
| **Evidence artifacts** | Regulatory documents, legal memos, clinical sign-offs, pharmacy sign-offs, protocol review evidence, moderation staffing confirmation, launch checklist completion |
| **Rollout state** | Current rollout phase and history of state transitions |
| **Clinician panel** | Clinician roster, coverage model, protocol accountability assignments |
| **Incident history** | Active and resolved incidents linked to this market |

### 4.2 Market Pack versioning

Every change to a Market Pack produces a new version. Changes include: protocol activation/deactivation, guardrail template change, moderation policy update, partner status change, rollout state transition, and evidence artifact addition.

The pack version is logged at every market-level event. When an incident occurs, the pack version at incident time is recorded, enabling precise root-cause analysis ("this incident happened under Pack v3.1; the protocol involved was activated in Pack v2.8").

### 4.3 Rollout states

Each market transitions through defined rollout states:

| State | Description |
|---|---|
| **Draft** | Market is being configured. No patient-facing activity. Pack is editable without activation review. |
| **In Review** | Pack is under regulatory, clinical, and operational review. Dependencies are being validated. |
| **Pilot** | Market is live for a controlled patient population (internal testing, invited users). Full audit. |
| **Limited Launch** | Market is live for a limited external population. Full audit and incident monitoring. |
| **Full Launch** | Market is fully operational. |
| **Restricted** | Market is live but one or more capabilities have been restricted due to an incident, regulatory order, or partner issue. The cockpit shows which capabilities are restricted and why. |
| **Emergency Safe Mode** | All configurable behavior reverted to strictest defaults. Platform floor always-on behaviors preserved. Triggered by severe incident. Exit requires explicit re-review. |
| **Suspended** | Market is not operational. No patient-facing activity. Previous pack is preserved for re-activation review. |

**Emergency Safe Mode** is precisely defined: all AI guardrails revert to the conservative default template, all protocol-authorized pathways revert to clinician-review-only, all community moderation reverts to maximum human review, all dispensing release reverts to pharmacist-reviewed. Platform floor always-on behaviors (crisis detection, audit logging, emergency escalation) are unaffected.

---

## 5. Cockpit levels

The cockpit operates at three levels, each serving different decisions.

### 5.1 Level 1 — Country workspace

The primary operating surface for a single market. When an operator opens Ghana, they enter the Ghana workspace.

**Overview tab:**
- Market identity and current rollout state
- Readiness checklist with completion status (§5.4)
- Active incident count and severity
- Expiring protocols and overdue reviews (first-class alerts, not buried in a tab)
- Key operating metrics summary (refill completion rate, time-to-clinician-decision, safety-event latency, audit completeness)
- Pack version and last change date

**Tabs available from the workspace:**

| Tab | What it shows |
|---|---|
| **Rollout** | Rollout state history, state transition controls, launch timeline |
| **Regulations** | Regulator/body mapping, licenses, approval status, submission deadlines, market-specific obligations, expiry reminders |
| **Policies** | Consent model, identity requirements, emergency escalation config, sensitive-category handling, **jurisdictional data residency** (consent regime, retention, DPC obligations; *not* physical region — see ADR-026 / I-028) — the policy components of the Market Pack |
| **Protocols** | Protocol library for this market. Each protocol: version, status, accountable approver, last review, next review, expiry, test suite status, rollout scope. Protocol activation and deactivation launch the activation review flow (§5.2) |
| **AI Guardrails** | Active guardrail templates for this market. Each template: version, deployment date, test suite status, refusal rate, escalation rate. Template change launches the activation review flow. |
| **Community** | Moderation policies, moderator roster, capacity metrics, crisis escalation SLA performance, active groups, moderation action rates |
| **Partners** | Pharmacy partners, delivery partners, lab partners, clinical partners. Each: integration status, SLA, contract evidence, active issues |
| **Clinicians** | Clinician panel, coverage model, protocol accountability assignments, availability configuration |
| **Evidence** | Evidence locker (§5.5) — all regulatory, legal, clinical, and operational evidence artifacts |
| **Audit** | Market-level audit view — protocol executions, guardrail decisions, moderation actions, delegate activity. Filtering, export, incident investigation. |
| **Incidents** | Active and resolved incidents. Linked to protocols, guardrails, or moderation policies. Rollback controls. |

**Entering an admin tool from the workspace:** When an operator opens Protocols, AI Guardrails, or Community from within the workspace, they are entering the same admin configuration surfaces defined in the companion slice PRDs (#18, #19, #20) — scoped to this market. The cockpit composes them; it does not replace them.

### 5.2 Level 2 — Activation review

Before any major change takes effect in a market, the cockpit presents an activation review showing what is changing and what the consequences are. Major changes include: protocol activation or deactivation, guardrail template change, moderation policy change, rollout state transition, and partner status change.

**The activation review shows:**

- **What is changing.** Precise description of the change (e.g., "Activate protocol-authorized refill renewal for metformin in the Ghana Chronic Care program").
- **Dependency check results.** Are all prerequisites met? The dependency checker (§5.3) evaluates and displays: required regulatory approvals (present/missing), required clinical sign-offs (present/missing), required partner readiness (confirmed/unconfirmed), required guardrail/moderation dependencies (met/unmet), required test suite results (passing/failing), required clinician assignments (assigned/unassigned).
- **Blast-radius preview.** If this change is activated, what is affected? Which programs, which patient populations, which workflows change behavior, which dependent modules rely on it, what fallback state exists. The blast-radius preview answers "if we do this, what changes?" — a different question from "can we safely do this?"
- **Unmet dependencies.** Any dependency that is not met is highlighted with a clear explanation of what is missing and who owns it.
- **Approval requirements.** Which roles must approve this change before it takes effect. The cockpit enforces multi-role approval for high-impact changes (e.g., protocol activation requires both Clinical Governance Lead and Country Launch Director approval).
- **Rollback path.** What happens if this change needs to be reversed. The specific rollback action (revert to Pack version N) and its consequences.
- **Platform floor reminder.** A persistent indicator confirming that the change does not violate the immutable platform floor (§13.4). If a proposed change would violate the floor, the activation review blocks it with an explanation.

**Activation review decisions:**
- **Approve and activate.** All approvers have signed off, all dependencies are met. The change takes effect and a new Pack version is created.
- **Approve with conditions.** Approvers sign off but note conditions (e.g., "activate with enhanced monitoring for 30 days"). Conditions are logged and tracked.
- **Defer.** Change is not activated. Reason is logged. The change remains in draft state.
- **Reject.** Change is rejected. Reason is logged. The change is archived.

### 5.3 Dependency checker

The dependency checker evaluates whether a proposed change can be safely activated. It is a prerequisite validator, not a behavioral simulator.

**What it checks:**

| Dependency type | Example checks |
|---|---|
| **Regulatory** | Is the required regulatory approval on file in the evidence locker? Is it current (not expired)? |
| **Clinical** | Is a named accountable clinician assigned for this protocol? Has the clinical sign-off been recorded? Is the clinician panel sufficient for the expected volume? |
| **Technical** | Has the test suite for this guardrail/protocol passed? Is the required service (interaction engine, herb-drug engine) operational? |
| **Partner** | Is the partner pharmacy integration confirmed? Is the delivery partner API operational? |
| **Moderation** | Is moderator capacity sufficient for the community impact of this change? Are moderation SLAs met? |
| **Evidence** | Are all required evidence artifacts present and current in the evidence locker? |
| **Cross-dependency** | If activating a protocol that requires a specific guardrail template, is that template active? If activating a community group that requires moderation capacity, is capacity confirmed? |

**Dependency check output:** Each dependency is evaluated as met, unmet, or degraded (partially met with noted limitations). Unmet dependencies block activation. Degraded dependencies surface warnings but do not block.

**The dependency checker is not a behavioral simulator.** It answers "are all prerequisites met?" not "what will happen to patients?" A full behavioral simulator — predicting patient-level impact of configuration changes — is a post-launch maturity item. The dependency checker is tractable, high-value, and safe to ship at launch.

### 5.4 Readiness checklist

The readiness checklist is a structured assessment of whether a market can safely operate. It is visible on the country workspace overview tab and is the first thing an operator sees when opening a market.

**Checklist categories:**

| Category | What it assesses | Status options |
|---|---|---|
| **Clinical** | Clinician panel staffed, coverage model confirmed, protocol library approved, accountable clinicians assigned | Ready / Partially Ready / Not Ready |
| **Regulatory** | Required licenses obtained, regulatory approvals on file, adverse-event reporting path confirmed | Ready / Partially Ready / Not Ready |
| **Pharmacy** | At least one pharmacy (platform or partner) operational, delivery partner confirmed, dispensing workflow tested | Ready / Partially Ready / Not Ready |
| **Payment** | Payment rails operational, subscription billing (if RPM/CCM active) functional, refund workflow tested | Ready / Partially Ready / Not Ready |
| **AI / Guardrails** | Conservative default template deployed and tested, additional templates tested (if applicable), AI infrastructure operational | Ready / Partially Ready / Not Ready |
| **Community** | Moderation staffing confirmed, crisis escalation tested, launch groups configured | Ready / Partially Ready / Not Ready |
| **Notifications** | WhatsApp, SMS, in-app channels operational, template messages approved, fallback logic tested | Ready / Partially Ready / Not Ready |
| **Evidence** | All required evidence artifacts present and current in the locker | Ready / Partially Ready / Not Ready |
| **Incident readiness** | Incident response playbook documented, rollback procedures tested, on-call rotation staffed | Ready / Partially Ready / Not Ready |

Each category expands to show specific items and their status. "Not Ready" in any category means the market cannot advance to the next rollout state.

### 5.5 Evidence locker

The evidence locker is a structured evidence management system, not a folder of PDFs. Every evidence artifact follows the same structure as consent evidence in §15 of the Master PRD — five attributes: scope, granularity, duration, evidence (the artifact itself), and versioning.

**Evidence artifact structure:**

| Field | Description |
|---|---|
| Artifact ID | Unique identifier |
| Type | Regulatory approval, legal memo, clinical sign-off, pharmacy sign-off, protocol review, moderation staffing confirmation, test suite result, partner agreement, other |
| Scope | What this artifact authorizes or confirms (e.g., "Ghana Pharmacy Council approval for protocol-authorized dispensing release of metformin") |
| Issuing authority | Who issued or signed this artifact |
| Issue date | When the artifact was issued |
| Expiry date | When the artifact expires (if applicable). Approaching expiry triggers an alert. |
| Status | Current / expired / superseded |
| Linked dependencies | Which protocols, guardrails, or activations depend on this artifact |
| Version | Artifact version (for multi-revision approvals) |
| File | The actual document (PDF, image, signed form) |

**Evidence locker behaviors:**
- Approaching-expiry artifacts generate alerts on the workspace overview (same prominence as expiring protocols)
- Expired artifacts automatically trigger dependency re-evaluation — any activation that depended on the expired artifact is flagged
- Evidence artifacts are immutable once filed — corrections produce a new version, not an overwrite
- The evidence locker is audited — every addition, view, and linked dependency change is logged

---

## 6. Incident and rollback center

### 6.1 Incident management

The incident center shows active and resolved incidents for the market, each with:
- Incident ID, severity (critical/high/medium/low), and status (open/investigating/mitigated/resolved)
- Description and affected area (protocol, guardrail, moderation, pharmacy, delivery, AI)
- Linked Pack version at incident time
- Linked protocol, guardrail, or moderation policy (if applicable)
- Affected patient count (estimated)
- Timeline of actions taken
- Resolution and root-cause analysis (when resolved)

### 6.2 Rollback controls

From the incident center, authorized operators can:

- **Roll back a specific configuration.** Revert a single protocol, guardrail template, or moderation policy to its previous version. This produces a new Pack version with only the targeted change reverted.
- **Roll back to a previous Pack version.** Revert the entire market configuration to a specific previous Pack version. This is a more dramatic action and requires Country Launch Director approval.
- **Activate Emergency Safe Mode.** Revert all configurable behavior to strictest defaults (§4.3). Requires Country Launch Director or Support & Incident Response Lead authorization.
- **Suspend the market.** Take the market fully offline. Requires Country Launch Director authorization.

Every rollback is audited with: operator identity, reason, Pack version reverted from, Pack version reverted to, timestamp, and affected configurations.

### 6.3 Review cadence enforcement

The cockpit enforces the review cadences defined in Master PRD §13.5:

- **High-risk clinical protocols:** 6-month review cadence
- **Standard protocolized pathways:** 12-month review cadence
- **Moderation policies and AI guardrail templates:** 6–12 months

The cockpit surfaces:
- Protocols and policies approaching their review deadline (30-day, 14-day, 7-day alerts)
- Overdue reviews (past deadline without renewal) — these trigger automatic escalation to the accountable role
- Incident-triggered review requirements — when incident rate crosses a defined threshold, the cockpit flags the affected protocol/policy for immediate review regardless of calendar

Protocols that pass their expiry without renewal automatically revert to the stricter default (per §13.5). The cockpit shows the impending reversion and gives the accountable role time to act before it takes effect.

---

## 7. Persona-scoped views

The cockpit does not show everything to everyone. Each persona sees the information relevant to their role, with the ability to expand to the full view if needed.

| Persona | Default view |
|---|---|
| **Country Launch Director** | Full workspace overview, readiness checklist, rollout state, active incidents, expiring protocols, key metrics |
| **Clinical Governance Lead** | Protocols tab, clinician panel, override rates, protocol-linked incidents, protocol review cadence |
| **AI Safety & Guardrails Lead** | AI Guardrails tab, refusal rates, escalation rates, guardrail-linked incidents, template test suite status |
| **Regulatory & Partner Affairs Lead** | Regulations tab, evidence locker, license expiry, submission deadlines, partner agreements |
| **Pharmacy Operations Lead** | Partners tab (pharmacy focus), delivery readiness, dispensing release protocol status, inventory health |
| **Community Safety & Moderation Lead** | Community tab, moderator capacity, crisis SLA, moderation action rates, moderation-linked incidents |
| **Support & Incident Response Lead** | Incidents tab, rollback controls, emergency safe mode, on-call status |

Persona scoping is enforced by role-based access control. A Clinical Governance Lead can navigate to the full workspace but their default landing view is protocol-focused. This prevents information overload while preserving transparency.

---

## 8. Launch scope for the cockpit itself

The cockpit follows its own launch sequencing, as defined in the Flagged Items Resolution:

### Operational at Ghana launch

- Country workspace (Ghana) with all tabs
- Readiness checklist
- Evidence locker
- Dependency checker
- Activation review flow (for protocol, guardrail, and moderation changes)
- Incident/rollback center
- Persona-scoped views
- Review cadence enforcement and expiry alerts

### Activated when second market enters planning

- Cross-market executive map view (world map or market grid with state-coded tiles)
- Cross-market comparison views (metrics, incidents, configurations side by side)
- Market template functionality (create a new market by cloning and modifying an existing Pack)
- Multi-market rollout coordination (synchronized changes across markets)

This split is deliberate. The country workspace is valuable even for a single market — it is the operational truth source for Ghana. The cross-market views only add value when there is more than one market to compare.

---

## 9. Audit

Every cockpit action is audited:

| Event | What is recorded |
|---|---|
| Pack version created | Pack version, change description, operator identity, timestamp |
| Rollout state transition | From state, to state, approvers, evidence artifacts referenced, timestamp |
| Activation review initiated | Change description, dependency check results, blast-radius preview summary |
| Activation approved/deferred/rejected | Decision, approvers, conditions (if any), timestamp |
| Rollback executed | Rollback type (specific config, full pack, emergency safe mode), reason, operator identity, Pack versions involved, timestamp |
| Evidence artifact added/expired | Artifact ID, type, scope, linked dependencies, operator identity, timestamp |
| Readiness checklist item updated | Category, item, old status, new status, operator identity, timestamp |
| Incident created/updated/resolved | Incident ID, severity, actions taken, resolution, linked Pack version, timestamp |
| Review cadence alert triggered | Protocol/policy ID, deadline, alert level (30/14/7 day or overdue) |
| Persona view access | Operator identity, persona, workspace accessed, timestamp |

---

## 10. Metrics

**Operational health**
- Time from market Draft to Full Launch (launch velocity)
- Readiness checklist completion rate by category
- Average time to resolve readiness blockers
- Evidence artifact currency rate (% of artifacts current vs expired)

**Governance**
- Protocol review cadence adherence (scheduled vs actual review dates)
- Overdue review count
- Incident-triggered review count
- Activation review approval rate vs deferral/rejection rate
- Average time from activation request to activation (governance throughput)

**Incident management**
- Incident count by severity and market
- Mean time to mitigate
- Mean time to resolve
- Rollback frequency
- Emergency Safe Mode activations (should be very rare)

**Configuration health**
- Active protocols per market
- Active guardrail templates per market
- Dependency check failure rate (how often proposed changes fail dependency validation)
- Blast-radius preview utilization (are operators reviewing blast-radius before activating?)

---

## 11. Dependencies

- **Identity & Authentication Spec v1.0.** Authenticated patient, clinician, pharmacist, moderator, admin, and delegate sessions are required for every actor surface this slice uses.
- **Admin — Guardrail Configuration (#18).** The cockpit composes guardrail management per market. The guardrail configuration surface must accept market-scoped activation and versioning.
- **Admin — Moderation Policy Configuration (#19).** Same composition relationship as guardrails.
- **Admin — Protocol Activation & Governance (#20).** Same composition relationship. Protocol activation, review cadence, and sunset logic are primary cockpit functions.
- **v5 Contracts Pack.** Runtime policy enforcement — the cockpit configures, the contracts pack enforces.
- **Identity and access control.** Persona-scoped views require role-based access control. The cockpit enforces role assignments per market.
- **Messaging & Inbox Spec v1.0.** Inbox threads and message-delivery expectations govern care-team and patient-visible communication generated by this workflow.
- **Notification infrastructure.** Review cadence alerts, expiry warnings, and incident notifications are delivered through the notification system.
- **All clinical slice PRDs.** The cockpit's dependency checker must understand the prerequisites defined in each slice (Refill, Interaction Engine, Herb-Drug, AI Clinical Assistant, Pharmacy Portal, Labs, Community). Dependency rules are derived from slice PRD dependency sections.

---

## 12. Open questions (slice-level)

1. **Multi-role approval workflow.** How many approvers are required for each change type? Is it configurable per market, or fixed? What happens if an approver is unavailable (timeout, escalation, delegation of approval authority)?
2. **Pack diff visualization.** When comparing two Pack versions (e.g., current vs proposed, or current vs rollback target), what level of detail does the diff show? Full config diff or summary of material changes?
3. **Automated dependency checking vs manual.** At launch, should all dependency checks be automated (system verifies evidence artifact presence, test suite results, partner API status), or are some checks manual checklists (operator confirms "I have verified moderation capacity")?
4. **Cross-market learning.** When the second market launches, should the cockpit surface insights from the first market (e.g., "In Ghana, this protocol had a 5% fallback rate in the first 90 days — consider when calibrating for Market 2")?
5. **External stakeholder views.** Should regulators or institutional partners have read-only access to specific cockpit views (e.g., Ghana FDA seeing the evidence locker and adverse-event reporting)? Or is this served through separate reporting/export?
6. **Cockpit availability SLA.** If the cockpit is unavailable, can operators still make changes through the underlying admin tools directly? Or does cockpit unavailability block all configuration changes (safer but more fragile)?

---

## Document control

- **v1.0** — Initial Market Rollout Cockpit slice PRD. Defines the Market Pack abstraction, three cockpit levels (country workspace, activation review, incident/rollback), dependency checker, blast-radius preview, evidence locker, readiness checklist, persona-scoped views, rollout states including Emergency Safe Mode, and review cadence enforcement. Derived from Master PRD v1.6 §6 and §14, Red-Team Review, and Flagged Items Resolution v1.0.
- **Next review:** after the three companion admin slice PRDs (#18, #19, #20) are drafted, to ensure composition interfaces are aligned; after Ghana launch operations begin producing real cockpit usage data.
- **Change discipline:** changes to the Market Pack structure, rollout states, dependency checker scope, activation review requirements, Emergency Safe Mode definition, or evidence locker structure require explicit owner sign-off and must be reflected in the Master PRD §14 if they alter the platform model.
