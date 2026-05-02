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
| **Market identity** | Country, region, **structured C3 brand-identity vocabulary** (`tenant_identifier` = `Telecheck-{country}` per operating-tenant naming, e.g., `Telecheck-US` / `Telecheck-Ghana`; `consumer_dba` = `Heros Health` country-instanced, e.g., `Heros Health` (US) / `Heros Health Ghana` (GH); `legal_entity` = `Telecheck Health LLC` (US) / `Telecheck-Ghana Ltd.` (GH); `consumer_subdomain` = `heroshealth.com` (US) / `ghana.heroshealth.com` (GH)), launch date, current rollout state. Bare "operating entity" / "brand" fields deprecated in favor of the structured vocabulary above per v1.10 C3 cascade. |
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

## v1.10 cycle additions (added 2026-05-02 per v1.10.1 hygiene cycle physical merge of Phase5 delta)

### Row 21 — §4.1 Market Pack C3 brand-structure metadata

§4.1 Market Pack metadata field set updated to structured C3 brand-structure vocabulary per v1.10 C3 cascade (Phase 5 delta Row 21):

- `tenant_identifier` = `Telecheck-{country}` (operating-tenant naming; e.g., `Telecheck-US`, `Telecheck-Ghana`)
- `consumer_dba` = `Heros Health` (global consumer DBA, country-instanced where surfaced — e.g., `Heros Health` US / `Heros Health Ghana` GH)
- `legal_entity` = `Telecheck Health LLC` (US) / `Telecheck-Ghana Ltd.` (GH)
- `consumer_subdomain` = `heroshealth.com` (US) / `ghana.heroshealth.com` (GH)

Bare "operating entity" / "brand" fields are deprecated; the structured vocabulary above is canonical per v1.10 C3 cascade. "Telecheck" is platform/B2B-only and never consumer-facing; "Heros Health" is the consumer DBA. Cross-references: Master Platform PRD v1.10 §17 (brand-structure rules), Tenant Threading Addendum v1.0, Phase 5 Slice/Engineering/Operations delta artifact (`Telecheck_v1_10_PRD_Update/Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md`).

### Row 56 — Market Pack marketing block (per ADR-027)

The Market Pack abstraction is updated to include a marketing block carrying the country-conditional DTC marketing posture configuration per ADR-027.

**Marketing block fields (sourced from CCR_RUNTIME v5.2 marketing block):**

- `molecule_level_marketing_permitted` — 3-state enum: `permitted` | `prohibited` | `pending_evidence`. Drives whether molecule-level marketing surfaces render in this country (per Acquisition & Engagement Tools Slice §13).
- `marketing_copy_governance_evidence` — structured `MarketingCopyGovernanceEvidence` object per TYPES v5.2 carrying triple-sign-off attestations (Product + Regulatory Affairs + Clinical Safety), reviewer identities, signature timestamps, evidence artifact references, and approval validity range.
- `marketing_governance_review_cadence_months` — integer; review cadence after which an approved `MarketingCopy` enters expired state and requires fresh §13.2 review.
- `marketing_governance_lead_designation_artifact_id` — reference to the artifact designating the Marketing copy governance lead for this country (required signer for Product axis of triple sign-off; surfaces in Admin Configuration Surfaces Slice §12 admin console).

**Default ship state per country pack.** Country packs ship with the marketing block populated as follows:

- `prohibited` — default for new markets where regulatory engagement has not begun. Molecule-level marketing surfaces suppressed at runtime; Forms Engine L1 molecule-level elements blocked at publish per FORMS_ENGINE §25.
- `pending_evidence` — for emerging markets where regulatory engagement is underway but the §7.9 6-condition activation gate has not yet been fully satisfied. Drafting and submission allowed via Admin Configuration Surfaces §12; publishing gated on activation gate completion.
- `permitted` — set only after MARKET_LAUNCH v5.1 marketing posture activation gate (6 conditions) has been satisfied AND `marketing_copy_governance_evidence` is populated AND `marketing_governance_lead_designation_artifact_id` references an active designation artifact.

The Cockpit's activation review (§4 of this slice) MUST validate the marketing block state transition `prohibited | pending_evidence → permitted` against the MARKET_LAUNCH v5.1 6-condition gate. The dependency checker (§5) MUST flag any Market Pack proposing `permitted` without complete `marketing_copy_governance_evidence`.

**Cross-references:** ADR-027 v0.6 (Country-Conditional DTC Marketing Posture, Accepted at v1.10); CCR_RUNTIME v5.2 marketing block; TYPES v5.2 (`MarketingCopyGovernanceEvidence`); MARKET_LAUNCH v5.1 marketing posture activation gate; Master PRD v1.10 §7.9, §13.2; Acquisition & Engagement Tools Slice §13; Admin Configuration Surfaces Slice §12; Forms/Intake Engine Slice §25.

### Row 76 — Market Pack research block (Cycle C5 — per ADR-028)

The Market Pack abstraction (§4.1) is extended in v1.10 to include a **research block** that surfaces ADR-028 Posture A research data partnership configuration. The research block carries the 3-state activation enum plus the 7-key research configuration block per CCR_RUNTIME v5.2 research block.

**Research block fields (sourced from CCR_RUNTIME v5.2 research block):**

- `research_data_partnership_active` — closed enum: `inactive | consent_only | active`. The 3-state model:
  - `inactive` — no research consent surface presented; no `ResearchDataExport` permitted; default for new markets.
  - `consent_only` — 5th-tier research consent surface presented (per Consent & Delegated Access Slice §16), consent records collected, but no export pipeline active. Default for markets that have completed REC engagement but have no active DSA.
  - `active` — full Posture A pipeline active: consent surface + DSA active + export pipeline active subject to I-029 (k-anonymity ≥ k_min, audit-trail-driven, governed by ADR-028 §6 permitted-domains list).
- 7-key research configuration block (**aligned 2026-05-02 per Codex Scope 3 HIGH-2 finding to mirror exactly the CCR_RUNTIME v5.2 research block schema**):
  - `research_permitted_data_domains` (closed enum subset — `chronic_disease_longitudinal | ncd_surveillance | pharmacovigilance_signal | population_health_aggregate`; per-DSA scope MUST be a subset)
  - `research_ethics_review_body` — structured object with `name`, `jurisdiction`, `approval_reference_id`, `approval_validity_from`, `approval_validity_to`, `approval_scope`, `per_dsa_review_required` (the consent-text-version pin is sourced from `approval_reference_id`)
  - `de_identification_standard` (default `safe_harbor_plus_k_anonymity` per CCR_RUNTIME v5.2)
  - `k_min_default` (default 11 per HIPAA expert-determination low-risk floor; per-DSA may require higher k_min; never lower per I-029)
  - `cross_border_research_transfer_permitted` — closed enum: `prohibited | permitted_with_counsel_artifact | permitted_unrestricted`
  - `cross_border_research_transfer_evidence` — companion structured object: `counsel_approval_artifact_id`, `transfer_mechanism`, `recipient_country`, `onward_transfer_policy`, `dsa_alignment_artifact_id`. **Required-field completeness gate: when `cross_border_research_transfer_permitted` is set to a permitting value AND a transfer is actually planned, the activation review MUST reject the transition if any required companion field is null.** This mirrors the CCR_RUNTIME v5.2 marketing-block required-field completeness pattern (rejecting transitions where structured-object sub-fields are null).
  - DSA references — Cockpit additionally surfaces the active `DataSharingAgreement` entity link (per TYPES v5.2) and the multi-party export approval roster as workflow-derived UI affordances that are NOT part of the CCR_RUNTIME v5.2 research block per se but are required for the MARKET_LAUNCH v5.1 11-condition activation gate evidence assembly.

**Country pack defaults:**

- New markets ship with `research_data_partnership_active = inactive` and the 7 research keys unset (or set to inactive sentinel). Forms Engine `research_data_use_consent_block` does not render; no audit events emit.
- Markets that have completed REC engagement but have not activated the export pipeline ship with `research_data_partnership_active = consent_only`, with `research_ethics_review_body.approval_reference_id` and `research_consent_text_version_pin` populated. Other 5 keys remain unset until DSA is signed and pipeline activates.

**Cockpit dependency checks (§4 / §5).** Market Pack activation review for `consent_only → active` transition requires evidence of: signed `DataSharingAgreement`, REC approval reference for consent text, populated `research_export_authorized_signers` roster, configured `research_export_k_anonymity_minimum`, MARKET_LAUNCH v5.1 11-condition research data partnership activation gate evidence, and dual-control sign-off per I-015. The cockpit dependency checker treats the 11-condition gate as an automated-where-possible check (per existing §5 dependency-checking model). The activation review for `inactive → consent_only` requires only REC approval reference + consent text version pin (no DSA required at this stage).

**Cross-references (Row 76):** ADR-028 v0.5 (Research data partnership Posture A — Release 2 goal); Master PRD v1.10 §15.2; CCR_RUNTIME v5.2 research block; INVARIANTS v5.2 I-029 (research export gates), I-030 (consent-zero-impact on care delivery), I-031 (high_pii audit class); MARKET_LAUNCH v5.1 (11-condition activation gate); TYPES v5.2 (`DataSharingAgreement`, `ResearchEthicsReviewBody`, `ResearchDataExport`, `CohortDefinition`); Forms/Intake Engine Slice §25.3 (`research_data_use_consent_block` field type); Consent & Delegated Access Slice §16 (5th-tier consent).

**Source delta:** `Telecheck_v1_10_PRD_Update/Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` Row 76 (Cycle C5).

### Row 86 — Cross-reference to Master PRD §10.5 program catalog architecture (Cycle C6)

The Market Pack abstraction (§4.1) is consistent with Master PRD v1.10 §10.5's four-layer program catalog architecture model:

| Master PRD §10.5 layer | Cockpit Market Pack mapping |
|---|---|
| **Layer 1 — Program (`ProgramCatalogEntry`)** | Platform-level catalog entry. NOT carried in Market Pack — Market Pack scopes per-market activation, not the platform catalog itself. |
| **Layer 2 — `ProgramMarketPolicy`** | Per-market activation policy. Market Pack carries the binding from `ProgramCatalogEntry` to operating tenant + per-market eligibility, formulary, regulatory module, pricing, and CCR pack reference. |
| **Layer 3 — Forms Engine instantiation (Pattern A)** | Per-market form versions are immutable artifacts referenced from `ProgramMarketPolicy`. Market Pack carries form-version pins; Forms Engine v2.1 owns authoring. |
| **Layer 4 — CCR Runtime resolution** | Market Pack carries the CCR pack (per ADR-024 country-driven configuration) which the Cockpit publishes; runtime resolution is performed by the CCR runtime, not the Cockpit. |

**Verification.** The Cockpit Market Pack abstraction is consistent with the four-layer model: Market Pack scope is Layer 2 + Layer 4 (the per-market activation policy and the CCR pack), while Forms Engine v2.1 owns Layer 3 (form versions), and the platform catalog (Layer 1) is platform-wide and not per-market. Cockpit activation review is the gating mechanism for Layer 2 activation per `ProgramMarketPolicy`.

**Program porting interaction.** When a program ports from one market to another (e.g., Telecheck-US GLP-1 Heros Health DBA → Telecheck-Ghana GLP-1 Heros Health Ghana DBA per `Telecheck_Program_Porting_Checklist_GLP1_v1_0.md`), the Cockpit activation review for the target market is the activation gate — the source market's `ProgramMarketPolicy` is not mutated, and the target market gets its own Market Pack publication via Cockpit. See Forms/Intake Engine Slice §25.4 (Program porting workflow) for the upstream Forms Engine view of the same operation.

**Cross-references (Row 86):** Master PRD v1.10 §10.5 (canonical — program catalog architecture, four-layer model); TYPES v5.2 (`ProgramCatalogEntry`, `ProgramMarketPolicy`); ADR-024 (CCR country-driven configuration); Forms/Intake Engine Slice §25.4 (Program porting workflow); `Telecheck_Program_Porting_Checklist_GLP1_v1_0.md` (worked example — Telecheck-US GLP-1 Heros Health DBA → Telecheck-Ghana GLP-1 Heros Health Ghana DBA).

**Source delta:** `Telecheck_v1_10_PRD_Update/Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` Row 86 (Cycle C6).

---

## Document control

- **v1.0** — Initial Market Rollout Cockpit slice PRD. Defines the Market Pack abstraction, three cockpit levels (country workspace, activation review, incident/rollback), dependency checker, blast-radius preview, evidence locker, readiness checklist, persona-scoped views, rollout states including Emergency Safe Mode, and review cadence enforcement. Derived from Master PRD v1.6 §6 and §14, Red-Team Review, and Flagged Items Resolution v1.0.
- **v1.10 cycle delta (body unchanged at v1.0 baseline; §4.1 amended in-place; Market Pack marketing block + research block added; §10.5 four-layer model cross-reference added)** — 2026-05-02 per v1.10.1 hygiene cycle. Phase 5 delta Row 21 physically merged: §4.1 Market Pack metadata uses structured C3 vocabulary (`tenant_identifier` / `consumer_dba` / `legal_entity` / `consumer_subdomain`). Phase 5 delta Row 56 physically merged: Market Pack now carries a marketing block (`molecule_level_marketing_permitted` 3-state enum + `marketing_copy_governance_evidence` + `marketing_governance_review_cadence_months` + `marketing_governance_lead_designation_artifact_id`) per ADR-027 v0.6. Phase 5 delta Row 76 physically merged: Market Pack now carries a research block (`research_data_partnership_active` 3-state enum + 7-key research configuration) per ADR-028 v0.5; activation review and dependency checker enforce `consent_only → active` transition against MARKET_LAUNCH v5.1 11-condition gate. Phase 5 delta Row 86 physically merged: Market Pack abstraction explicitly verified consistent with Master PRD v1.10 §10.5 four-layer program catalog architecture (Layer 2 + Layer 4 scoped). See "v1.10 cycle additions" section above and `Telecheck_v1_10_PRD_Update/Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md`.
- **Next review:** after the three companion admin slice PRDs (#18, #19, #20) are drafted, to ensure composition interfaces are aligned; after Ghana launch operations begin producing real cockpit usage data.
- **Change discipline:** changes to the Market Pack structure, rollout states, dependency checker scope, activation review requirements, Emergency Safe Mode definition, or evidence locker structure require explicit owner sign-off and must be reflected in the Master PRD §14 if they alter the platform model.
