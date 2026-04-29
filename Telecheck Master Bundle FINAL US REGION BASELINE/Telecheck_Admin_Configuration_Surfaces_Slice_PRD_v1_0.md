# Telecheck — Admin Configuration Surfaces Slice PRD

**Covers:** Guardrail Configuration (#18), Moderation Policy Configuration (#19), Protocol Activation & Governance (#20)
**Version:** 1.0
**Status:** Canonical for development
**Owner:** Product (Telecheck)
**Parent document:** Telecheck Master Platform PRD v1.6, §14
**Companion documents:** Market Rollout Cockpit Slice PRD v1.0, AI Clinical Assistant Slice PRD v1.0, Community Platform Slice PRD v1.0, Refill Slice PRD v1.0, all clinical slice PRDs

---

## 1. Purpose and strategic role

These three surfaces are how operators make Telecheck's configurable governance architecture real. The Master PRD commits to configurable guardrails, moderation policies, and clinical protocols — but configuration without a well-designed admin surface means dangerous settings hidden in config files, untested changes pushed to production, and no visibility into what's active where.

These surfaces are products, not backend utilities (Master PRD §14). They are where clinical governance leads activate protocols, AI safety leads deploy guardrail templates, and community safety leads configure moderation policies. Each surface must make complex governance decisions feel structured, testable, and reversible.

All three surfaces are **composed per market through the Market Rollout Cockpit** (Rollout Cockpit Slice §5.1). When an operator opens Protocols from within the Ghana workspace, they enter the protocol activation surface scoped to Ghana. The cockpit composes; these surfaces execute.

This slice defines the three surfaces together because they share the same architectural pattern: versioned configuration objects, test-before-deploy workflows, role-based access, audit trails, and rollback capability. Where they differ (guardrails govern AI conversation, moderation policies govern community content, protocols govern clinical actions), the differences are defined in dedicated sections.

---

## 2. Traceability

| Master PRD reference | This slice addresses |
|---|---|
| §8 Job 13 — Configure and govern AI, moderation, and protocol behavior | All three surfaces |
| §13.1 Protocolized clinical autonomy | Protocol activation and governance surface |
| §13.2 Guardrail-configured conversational autonomy | Guardrail configuration surface |
| §13.3 Protocol-authorized moderation autonomy | Moderation policy configuration surface |
| §13.4 Platform floor | All three surfaces enforce the floor — no configuration can relax below it |
| §13.5 Governance of configurable autonomy | Review cadence, sunset logic, rollback for all three |
| §14 Admin configuration surfaces | Full section definition |
| §12 Launch readiness — Operator-facing foundations | All three surfaces are launch-readiness criteria |

---

## 3. Shared architecture

### 3.1 Configuration objects

All three surfaces operate on **configuration objects** — versioned, structured definitions that control platform behavior. The pattern is identical:

| Concept | Guardrails | Moderation policies | Protocols |
|---|---|---|---|
| Configuration object | Guardrail template | Moderation policy | Clinical protocol |
| What it governs | AI conversational behavior | Community content moderation | Clinical actions (prescribing, dispensing, triage) |
| Scope | Per market, per program | Per market, per community group | Per market, per program, per medication class |
| Versioning | Every change creates a new version | Every change creates a new version | Every change creates a new version |
| Test requirement | Test suite must pass before deployment | Test suite must pass before deployment | Test suite must pass before deployment |
| Review cadence | 6–12 months | 6–12 months | 6 months (high-risk) / 12 months (standard) |
| Rollback | One-action revert to previous version | One-action revert to previous version | One-action revert to previous version |
| Audit | Every deployment, change, and rollback logged | Every deployment, change, and rollback logged | Every deployment, change, and rollback logged |
| Platform floor | Cannot violate §13.4 | Cannot violate §13.4 | Cannot violate §13.4 |

### 3.2 Configuration lifecycle

Every configuration object follows the same lifecycle:

**Create.** An authorized operator creates a new configuration object (or clones an existing one as a starting point). The object is in draft state.

**Define.** The operator defines the object's parameters — scope, rules, thresholds, exclusions, and behaviors. For protocols, this includes eligibility criteria, exclusion rules, and formulary constraints. For guardrails, this includes scope definitions, refusal taxonomy, escalation triggers, and tone rules. For moderation policies, this includes content rules, action thresholds, and escalation pathways.

**Test.** Every configuration object has an associated **test suite**. The test suite must pass before the object can be deployed. Tests cover:
- Happy-path behavior (does the configuration produce expected results for normal cases?)
- Edge-case behavior (does it handle boundary conditions correctly?)
- Platform-floor compliance (does it violate any immutable floor rules?)
- Interaction with other active configurations (does this guardrail conflict with the active protocol? Does this moderation policy conflict with crisis detection?)

Test results are recorded and visible in the configuration object's history.

**Review.** For configurations that affect clinical safety (all protocols, guardrails that govern clinical AI, moderation policies that affect crisis response), clinical review is required before deployment. The reviewer's identity and sign-off are recorded.

**Deploy.** The configuration is deployed to a specific market and program (or community group). Deployment creates a new version entry in the configuration history. The Market Rollout Cockpit's activation review flow (Cockpit Slice §5.2) governs deployment for significant changes — dependency checks and blast-radius preview are evaluated before the deployment takes effect.

**Monitor.** After deployment, the configuration's performance is monitored through metrics specific to its type (guardrail refusal rates, moderation action rates, protocol execution rates). Anomalies trigger investigation.

**Review (cadence).** Configurations are reviewed on a risk-tiered cadence (Master PRD §13.5). The Rollout Cockpit surfaces approaching review deadlines as first-class alerts.

**Sunset.** Configurations have a stated validity window. If not renewed at the review cadence, they automatically revert to the stricter default. The Cockpit shows the impending reversion and gives the accountable role time to act.

**Rollback.** At any point after deployment, an authorized operator can revert to the previous version. Rollback is a single action. The rollback is logged with operator identity and reason.

### 3.3 Platform floor enforcement

No configuration object — regardless of type — can authorize behavior below the platform floor (Master PRD §13.4). Floor enforcement is **runtime**, not just design-time:

- At creation: the configuration editor validates against the floor and rejects violations
- At test: the test suite includes floor-compliance tests
- At deployment: a floor-compliance check runs before activation
- At runtime: the v5 Contracts Pack enforces the floor regardless of configuration content. If a configuration object somehow passes the design-time checks but violates the floor at runtime, the floor wins and the violation is logged as an incident.

### 3.4 Role-based access

Each surface is accessible to specific roles:

| Surface | Can create/edit | Can deploy | Can rollback | Can view |
|---|---|---|---|---|
| Guardrails | AI Safety & Guardrails Lead | AI Safety Lead + Country Launch Director (joint) | AI Safety Lead | All operator roles |
| Moderation policies | Community Safety & Moderation Lead | Community Safety Lead + Country Launch Director (joint) | Community Safety Lead | All operator roles |
| Protocols | Clinical Governance Lead | Clinical Governance Lead + Country Launch Director (joint) | Clinical Governance Lead | All operator roles |

Deployment requires joint approval (the domain lead and the Country Launch Director) for all three surfaces. This prevents unilateral activation of potentially dangerous configurations.

---

## 4. Guardrail Configuration (#18)

### 4.1 What is configured

AI guardrail templates (AI Clinical Assistant Slice §5) define how the AI Clinical Assistant (Mode 1) behaves in conversation. Each template specifies:

| Parameter | Description | Example |
|---|---|---|
| **Scope definition** | What topics and actions the AI may engage with | "May discuss GLP-1 side effects, dietary guidance within program, adherence support" |
| **Refusal taxonomy** | What topics trigger a refusal, categorized by reason | "Refuses: specific dosing advice, off-protocol medication recommendations, diagnosis" |
| **Escalation triggers** | Conditions that cause automatic escalation to a clinician | "Escalate: adverse event report, request for prescription change, cardiovascular risk mention" |
| **Uncertainty framing rules** | How the AI expresses confidence, limitations, and hedging | "Always prefix interpretations with 'Based on general medical information...'" |
| **Tone and persona rules** | How the AI presents itself | "Warm, matter-of-fact, non-judgmental" |
| **Program boundary rules** | What happens when a question crosses the template's scope | "Revert to Conservative Default for out-of-scope questions" |
| **Crisis response** | Crisis detection behavior (not configurable — platform floor — but visible for awareness) | "Self-harm, abuse, medical emergency → immediate escalation" |

### 4.2 Configuration surface

The guardrail configuration surface provides:

**Template library.** All available templates (shipped defaults and custom-created) with version, deployment status, and market/program assignment.

**Template editor.** For creating or editing templates:
- Structured form for each parameter (not free-text configuration)
- Scope definition as a categorized inclusion/exclusion list
- Refusal taxonomy as a categorized list with example phrases
- Escalation triggers as condition-action pairs
- Uncertainty framing rules as template sentences
- Tone rules as descriptive guidelines with example conversations
- Platform floor indicators showing which behaviors are immutable and cannot be edited

**Test runner.** Execute the template's test suite from within the editor. Results displayed inline with pass/fail per test case. Failed tests block deployment.

**Preview.** Simulate a conversation with the template active — the operator can type test patient messages and see how the AI responds under this guardrail. Preview mode is clearly labeled "Test mode — not affecting real patients."

**Deployment controls.** Assign the template to a market and program. Deployment goes through the Cockpit's activation review if it's a significant change (new template, template replacement, scope expansion). Minor edits (tone adjustments, additional refusal examples) may deploy directly with audit logging.

**Version comparison.** Side-by-side diff of two template versions showing exactly what changed.

**Rollback.** One-click revert to any previous version with confirmation dialog and reason capture.

### 4.3 Launch templates

Four templates ship at launch (AI Clinical Assistant Slice §5.1): Conservative Default Health Assistant, GLP-1 Program Agent, Men's Health/ED Program Agent, Labs & Medication Interpreter. The Conservative Default is the fallback — any template failure or version mismatch reverts to it.

---

## 5. Moderation Policy Configuration (#19)

### 5.1 What is configured

Moderation policies (Community Platform Slice §6) define how community content is moderated. Each policy specifies:

| Parameter | Description | Example |
|---|---|---|
| **Content rules** | What content is allowed, restricted, or prohibited | "Medication experience sharing: allowed. Dosing advice: restricted (flag for review). Medication sales: prohibited (auto-hide)." |
| **Automated action thresholds** | When automated screening takes action vs flags for human review | "Spam confidence > 0.9: auto-hide. Medical advice confidence > 0.7: flag for review." |
| **Moderator roles and permissions** | What each moderator role can do | "Junior moderator: hide, warn. Senior moderator: restrict, remove. Safety lead: suspend (with human review)." |
| **Escalation pathways** | How flagged content routes through moderation tiers | "Auto-flagged → junior moderator. Unresolved after 4 hours → senior moderator. Crisis → safety team immediately." |
| **Warning language** | Template text for warnings sent to users | "Your post was removed because it contained specific dosing advice for another member. Sharing your own experience is welcome, but advising others on medication doses isn't safe." |
| **Restriction durations** | How long posting restrictions last by violation severity | "First violation: warning. Second: 24-hour restriction. Third: 72-hour restriction. Fourth: escalate to safety lead." |
| **Crisis response** | Crisis detection behavior (not configurable — platform floor — but visible) | "Self-harm, abuse, emergency → immediate escalation regardless of policy" |

### 5.2 Configuration surface

The moderation policy configuration surface provides:

**Policy library.** All available policies with version, deployment status, and market/group assignment.

**Policy editor.** Structured form for each parameter:
- Content rules as categorized allow/restrict/prohibit lists with example content
- Automated action thresholds as confidence-level sliders with behavior selectors
- Moderator role definitions with permission matrices
- Escalation pathway as a flowchart-style editor
- Warning and restriction templates with variable fields
- Crisis response indicators (visible, not editable)
- Platform floor indicators (visible, not editable)

**Test runner.** Execute the policy's test suite with sample content. Tests verify: prohibited content is caught, allowed content passes, escalation routing works, crisis detection fires correctly, and the platform floor is not violated.

**Simulation.** Feed sample community posts through the policy and see what actions would be taken. "If someone posted 'You should take 2mg instead of 1mg,' what would happen?" The simulation shows: flagged by automated screening (medical advice confidence: 0.82), routed to moderator review, recommended action: hide + warn.

**Deployment controls.** Assign the policy to a market and community group(s). Deployment goes through the Cockpit's activation review for new policies or significant changes.

**Moderation dashboard integration.** The policy configuration surface links to the live moderation dashboard showing: current action rates under this policy, false-positive rates, escalation volume, and moderator workload.

### 5.3 Launch policies

One moderation policy ships at launch for all three Ghana community groups, with group-specific customizations (e.g., the Men's Health group has higher sensitivity for privacy-related content). The policy follows the three-layer moderation architecture defined in Community Platform Slice §6.1.

---

## 6. Protocol Activation & Governance (#20)

### 6.1 What is configured

Clinical protocols (Master PRD §13.1) define the conditions under which the platform may execute clinical actions without per-instance human review. Each protocol specifies:

| Parameter | Description | Example |
|---|---|---|
| **Protocol type** | What kind of clinical action | Refill renewal, dispensing release, emergency routing, AI Mode 2 pathway |
| **Market and program** | Where the protocol is active | Ghana, GLP-1 program |
| **Whitelisted formulary** | Which medications are eligible | Semaglutide 0.25mg, 0.5mg, 1.0mg, 2.4mg |
| **Whitelisted indications** | Which clinical indications are eligible | Weight management with BMI ≥ 27 and comorbidity, or BMI ≥ 30 |
| **Eligibility criteria** | What the patient must satisfy | Identity verified, care consent active including protocolized actions, enrolled in GLP-1 program |
| **Required inputs** | What data must be present and current | HbA1c within 6 months, medication list confirmed within 90 days |
| **Exclusion rules** | What disqualifies a patient from protocol execution | Pregnancy, active cardiovascular event, medullary thyroid carcinoma history |
| **Interaction engine gate** | How interaction signals affect execution | Critical: block. Major: block unless explicitly addressed. Moderate/minor: execute with logging. |
| **Herb-drug engine gate** | Same gate logic for herb-drug signals | Same as interaction engine gate |
| **Uncertainty thresholds** | When the protocol defers to clinician review | Confidence below 0.8, ambiguous exclusion criteria, missing required input |
| **Accountable clinician** | Named role (not person — role assignment is separate) | Protocol Medical Director, Ghana GLP-1 Program |
| **Review cadence** | When the protocol must be reviewed | 6 months (high-risk) or 12 months (standard) |
| **Expiry date** | When the protocol auto-reverts to clinician-review-only if not renewed | 6 months from activation |
| **Rollback target** | What configuration takes effect on rollback | Clinician-review-only for all affected workflows |

### 6.2 Configuration surface

The protocol activation surface provides:

**Protocol library.** All available protocols — active, inactive, draft, expired — with version, market/program, accountable clinician, last review date, next review date, and expiry date.

**Protocol editor.** Structured form for each parameter:
- Formulary and indication selection from the platform's medication database
- Eligibility criteria as a structured checklist with data-source references
- Required inputs with currency thresholds (e.g., "HbA1c within 6 months")
- Exclusion rules as condition/flag selectors
- Interaction engine gate configuration (which severity levels block, which are logged)
- Uncertainty threshold as a confidence slider
- Accountable clinician role assignment (linked to the clinician panel)
- Review cadence and expiry date selectors
- Rollback target definition

**Test runner.** Execute the protocol's test suite with simulated patient profiles:
- Patient A: all criteria met, no signals → expected: protocol executes
- Patient B: critical interaction signal → expected: protocol blocks, falls back to clinician
- Patient C: missing required lab → expected: protocol blocks, requests data
- Patient D: exclusion criterion met → expected: protocol declines
- Patient E: pregnancy flag → expected: protocol blocks (human review required for pregnancy at launch)

Tests must cover happy path, every exclusion rule, every gate condition, and platform-floor compliance.

**Activation workflow.** Protocol activation goes through the Cockpit's full activation review:
- Dependency check (regulatory approval on file? Clinical sign-off recorded? Test suite passing? Accountable clinician assigned? Interaction engine operational?)
- Blast-radius preview (which patients, which programs, which workflows change?)
- Multi-role approval (Clinical Governance Lead + Country Launch Director)
- Activation confirmation with rollback path documented

**Performance dashboard.** After activation:
- Protocol execution volume (how many times per day/week)
- Fallback rate (how often the protocol falls back to clinician review, and why)
- Override rate (how often a clinician overrides a protocol-executed action — should be very rare)
- Signal gate activation rate (how often interaction or herb-drug signals block protocol execution)
- Adverse event linkage (any adverse events linked to this protocol)

**Review cadence tracking.** Approaching review deadlines surface as alerts. Overdue reviews escalate to the accountable clinician and Country Launch Director. Protocols past expiry auto-revert to clinician-review-only.

**Version comparison.** Side-by-side diff showing exactly what changed between protocol versions.

**Rollback.** One-click revert to previous version or to clinician-review-only (the safest rollback target).

### 6.3 Launch protocols

The Ghana launch protocol library (per Flagged Items Resolution) includes:
- Protocol-authorized refill renewals for GLP-1, ED, metformin, statins, selected antihypertensives
- Protocol-authorized dispensing release for low-risk maintenance medications
- Emergency routing protocols for defined danger-sign pathways

Each is activated through this surface after regulatory sign-off (Master PRD §23 Q1).

---

## 7. Cross-surface interactions

### 7.1 Configuration dependencies

Some configurations depend on others:

| If you activate... | You must also have... | Dependency surface |
|---|---|---|
| A protocol for GLP-1 refill renewal | The GLP-1 Program Agent guardrail template active (so patients in the program get appropriate AI behavior) | Guardrails |
| A new community group | A moderation policy assigned to the group | Moderation |
| AI Mode 2 pathway for a program | A protocol defining the Mode 2's clinical envelope for that program | Protocols |
| A guardrail template that references interaction signals | The interaction engine operational in the market | System dependency (not a configuration surface) |

The Rollout Cockpit's dependency checker (Cockpit Slice §5.3) validates cross-surface dependencies before activation. The individual configuration surfaces show dependency indicators ("This protocol requires guardrail template X to be active") but the Cockpit enforces them.

### 7.2 Conflict detection

If two configurations could conflict (e.g., a moderation policy that allows content a guardrail would refuse, or a protocol that assumes a guardrail behavior that's been changed), the test suite should catch the conflict. Cross-configuration tests are defined and maintained as part of the Cockpit's dependency checker, not within individual surfaces.

---

## 8. Audit

All three surfaces share the same audit model:

| Event | What is recorded |
|---|---|
| Configuration created | Object type, creator, initial parameters, timestamp |
| Configuration edited | Object ID, version, changes made (diff), editor, timestamp |
| Test suite executed | Object ID, version, test results (pass/fail per test), timestamp |
| Clinical review completed | Object ID, version, reviewer identity and role, sign-off, timestamp |
| Deployment initiated | Object ID, version, target market/program/group, deploying operator, timestamp |
| Activation review completed | Dependency check results, blast-radius preview summary, approvers, decision (approve/defer/reject), timestamp |
| Configuration deployed | Object ID, version, market/program/group, effective timestamp |
| Configuration rolled back | Object ID, from-version, to-version, rollback reason, operator identity, timestamp |
| Review cadence alert | Object ID, deadline, alert level (30/14/7 day or overdue), timestamp |
| Configuration expired | Object ID, version, auto-revert action taken, timestamp |
| Runtime floor violation attempt | Object ID, version, violation type, enforcement action, timestamp |

---

## 9. Metrics

**Configuration health**
- Active configurations per surface per market
- Configuration version frequency (how often are configurations updated?)
- Test suite pass rate (should be 100% before deployment — failures indicate configuration quality issues)
- Review cadence adherence (% of configurations reviewed on schedule)
- Expired-without-renewal count (configurations that auto-reverted — should be zero in a well-governed market)
- Rollback frequency per surface (how often are configurations rolled back — too high suggests deployment quality issues)

**Guardrail performance**
- Refusal rate per template (within expected range)
- Escalation rate per template
- Template-triggered crisis detection rate
- Patient satisfaction signals per template
- Template version lifespan (how long a version stays active before replacement)

**Moderation policy performance**
- Automated screening flag rate per policy
- False-positive rate per policy (flagged content approved by moderators)
- Policy-violation rate per group
- Moderator workload per policy
- Crisis detection rate per policy
- Policy version lifespan

**Protocol performance**
- Execution volume per protocol
- Fallback rate per protocol (and reason distribution)
- Override rate per protocol
- Signal gate activation rate per protocol
- Adverse event linkage rate per protocol
- Time from protocol activation to first execution
- Protocol version lifespan

---

## 10. Dependencies

- **Identity & Authentication Spec v1.0.** Authenticated patient, clinician, pharmacist, moderator, admin, and delegate sessions are required for every actor surface this slice uses.
- **Market Rollout Cockpit Slice.** The cockpit composes these surfaces per market. Activation review, dependency checking, and review cadence enforcement are cockpit functions that these surfaces integrate with.
- **AI Clinical Assistant Slice.** Guardrail templates govern Mode 1 behavior. Mode 2 pathways are governed by protocols. Template and protocol definitions must align with the AI Clinical Assistant's two-mode architecture.
- **Community Platform Slice.** Moderation policies govern community behavior. Policy definitions must align with the community platform's three-layer moderation architecture.
- **All clinical slice PRDs.** Protocol definitions reference eligibility criteria, exclusion rules, and gate logic defined in clinical slices (Refill, Medication Interaction Engine, Herb-Drug Engine, Pharmacy Portal).
- **v5 Contracts Pack.** Runtime enforcement of configurations. The contracts pack is the enforcement layer; these surfaces are the configuration layer.
- **Identity and access control.** Role-based access to configuration surfaces. Joint-approval workflows for deployment.

---

## 11. Open questions (slice-level)

1. **Configuration versioning granularity.** Should every minor edit (typo in a warning template, small threshold adjustment) create a new version, or should versions be created only for "significant" changes? Fine-grained versioning provides better audit but generates noise. Recommend: every change creates a version, but the version history view distinguishes "minor" and "major" changes.
2. **Test suite maintenance.** Who maintains the test suites as configurations evolve? If a protocol changes, who updates the test cases? Recommend: the owner of the configuration object is responsible for test suite maintenance, with clinical review for protocol test changes.
3. **Configuration templates vs custom configurations.** Should operators always start from a shipped template and customize, or should they be able to create entirely custom configurations from scratch? Recommend: template-first at launch (safer, faster), with custom-from-scratch as a post-launch capability for experienced operators.
4. **Cross-market configuration sharing.** When Telecheck operates in multiple markets, should a protocol proven in Ghana be shareable to a new market as a starting template? What governance applies to cross-market sharing?
5. **Configuration change notifications.** When a configuration is deployed or rolled back, who is notified beyond the deploying operator? Recommend: all roles in the market's cockpit are notified of any configuration change via in-app alert, with change summary.
6. **Emergency configuration changes.** In an incident, should configuration changes (e.g., rolling back a protocol) bypass the normal activation review flow? Or should the review be expedited but not bypassed? Recommend: expedited review (reduced approval requirements, compressed timeline) rather than bypass, to maintain safety discipline even in emergencies. Exception: Emergency Safe Mode activation in the cockpit bypasses individual configuration review because it reverts everything to the safest defaults.

---

## Document control

- **v1.0** — Combined Admin Configuration Surfaces slice PRD covering Guardrail Configuration (#18), Moderation Policy Configuration (#19), and Protocol Activation & Governance (#20). Defines shared architecture (configuration objects, lifecycle, floor enforcement, role-based access), individual surface parameters and editor capabilities, test-before-deploy workflow, cross-surface dependency detection, and integration with the Market Rollout Cockpit. Derived from Master PRD v1.6 §14 and §13.1–§13.5.
- **Next review:** after the Market Rollout Cockpit is operational and cross-surface dependency checking is implemented; after the first protocol activation in Ghana provides real-world feedback on the activation workflow.
- **Change discipline:** changes to configuration lifecycle stages, platform floor enforcement model, deployment approval requirements, or rollback mechanics require explicit owner sign-off and must be reflected in the Master PRD §14 if they alter the platform model.
