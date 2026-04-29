# Telecheck — Architecture Decision Records

**Version:** 1.0
**Status:** Canonical for development
**Owner:** Engineering Lead
**Parent documents:** Contracts Pack v5 (Source-of-Truth places ADRs at top of precedence), Master PRD v1.6, System Architecture v1.0

---

## Purpose

Every consequential decision in Telecheck — architectural, clinical, governance — is recorded here with its context, options considered, decision made, and consequences accepted. ADRs are immutable once accepted: if a decision is reversed, a new ADR supersedes the old one (the old one is not edited).

Per the Contracts Pack Source-of-Truth hierarchy, ADRs sit at the top of the precedence stack. If an ADR conflicts with a slice PRD or the Master PRD, the ADR governs and the conflicting document is updated.

**Format:** Each ADR follows: Status → Context → Options → Decision → Consequences → References.

---

## ADR-001: Modular monolith at launch, service extraction later

**Status:** Accepted
**Date:** 2026-04-23

**Context:** The team is small for Ghana launch. Microservices add deployment, observability, and operational overhead. But the platform has 14 distinct capability areas that need clean boundaries for future scaling and team assignment.

**Options considered:**
1. Full microservices from day one — maximum flexibility, maximum operational cost
2. Monolith with no module boundaries — fastest to build, hardest to extract later
3. Modular monolith with domain-aligned modules and extraction-ready boundaries — balanced

**Decision:** Option 3. Modular monolith with 13 internal modules plus a separate AI Service. Modules communicate through an internal event bus. Module boundaries match future service boundaries. Extraction is triggered by scale, team, or deployment independence needs.

**Exception:** AI Service runs as a separate deployment from day one because it has different scaling characteristics (LLM provider calls), different deployment cadence (model updates), and different failure modes (provider outages should not cascade to clinical workflows).

**Consequences:**
- Single deployment simplifies operations at launch
- Module boundaries enforce data ownership discipline even within the monolith
- Event bus must be designed for later replacement with a message broker
- AI Service requires its own deployment pipeline, monitoring, and failover from day one
- Team must resist the temptation to reach across module boundaries via direct database queries

**References:** System Architecture v1.0 §2

---

## ADR-002: Two-mode AI architecture (Mode 1 + Mode 2)

**Status:** Accepted
**Date:** 2026-04-23

**Context:** The platform needs AI for two fundamentally different purposes: helping patients understand their health (conversational) and preparing clinical cases for physician review (structured protocol execution). These have different safety profiles, different governance needs, and different audit requirements.

**Options considered:**
1. Single AI mode with configurable behavior — simpler to build, harder to govern
2. Two distinct modes with separate governance — more complex, clearer safety boundaries
3. Three modes (add an autonomous mode) — premature; deferred to post-launch

**Decision:** Option 2. Two modes:
- **Mode 1 (Conversational Assistant):** Patient-facing chat. Governed by admin-configurable guardrail templates (§13.2 of Master PRD). 4 templates at launch (Conservative Default, GLP-1 Program, ED Program, Labs). Can initiate workflows but cannot make clinical decisions. AI labeling mandatory.
- **Mode 2 (Protocol Execution Agent):** Structured async clinical preparation engine. Governed by clinical protocols (§13.1 of Master PRD). Consumes intake data, runs safety checks, produces clinical summary with recommendation and confidence. Physician approves every case at launch.

**Consequences:**
- Auto-approve for Mode 2 is explicitly post-launch (requires 90-day track record of physician agreement rates)
- Mode 1 and Mode 2 share the same AI Service deployment but have different code paths, different guardrails, and different audit fields
- Every AI response carries mode, guardrail_template_id/protocol_id, and version in its audit record
- The boundary between modes must be enforced in the AI Service, not in the frontend

**References:** AI Clinical Assistant Slice PRD v1.0, Contracts Pack 00-AI-LAYERING.md

---

## ADR-003: Market Launch as sole offerability authority

**Status:** Accepted
**Date:** 2026-04-23

**Context:** Multiple systems could theoretically control whether a feature is available in a market: the feature itself (via a market allow-list), the protocol engine, the AI guardrail config, or the Market Pack. Having multiple authorities creates conflicting truth about what's active.

**Options considered:**
1. Feature-level market allow-lists — each feature decides where it's active
2. Centralized Market Pack — one authority per market
3. Hybrid — Market Pack for governance, features for compatibility

**Decision:** Option 2, with a refinement. The Market Pack (via the MARKET-LAUNCH contract) is the sole authority for whether a capability is offered in a market. Individual features expose compatibility constraints (what they need to function) but do not carry independent market allow-lists. Runtime resolution: Market Pack decides offerability → compatibility checks verify required artifacts exist → missing compatibility is a deployment defect, not a policy decision.

**Consequences:**
- Forms Engine, Protocol Packs, and AI agents stop carrying independent market allow-lists
- All offerability questions are answered by querying the Market Pack, not the feature
- Compatibility gaps discovered at runtime are treated as deployment defects and alerted, not silently degraded
- The Rollout Cockpit becomes the single place to see "what's active in this market"

**References:** Contracts Pack 00-MARKET-LAUNCH.md (Invariant I-020), Market Rollout Cockpit Slice PRD v1.0

---

## ADR-004: Pattern A for Forms Engine — one version per market

**Status:** Accepted
**Date:** 2026-04-23

**Context:** Intake forms need to be versioned, but the question is whether a form can have one version used across multiple markets (Pattern B) or must have exactly one version per market (Pattern A).

**Options considered:**
- **Pattern A:** One IntakeFormVersion per market. The `markets[]` array on IntakeForm is descriptive ("markets where versions exist"), and IntakeFormVersion has a single `market_code` field (operative).
- **Pattern B:** One IntakeFormVersion can be active in multiple markets. The `markets[]` array is operative.

**Decision:** Pattern A. One version per market. Cross-market reuse becomes structurally impossible.

**Consequences:**
- Market Pack binding to a form version is unambiguous (one form version, one market)
- Clinical approval per form version is per market (matches how clinical artifacts are actually approved)
- Form content that's identical across markets still requires separate version records (small duplication cost, large clarity gain)
- The Forms Engine's publish-time validation checks exactly one market per version

**References:** Contracts Pack 00-FORMS-ENGINE.md, Forms/Intake Engine Slice PRD v1.0

---

## ADR-005: Protocolized autonomy, not open-ended autonomy

**Status:** Accepted
**Date:** 2026-04-23

**Context:** The platform needs to scale clinician capacity through automation, but "AI makes clinical decisions" is both clinically dangerous and regulatorily untenable at this stage.

**Options considered:**
1. No autonomy — every clinical action requires explicit clinician sign-off
2. Open-ended autonomy — AI makes decisions within broad guidelines
3. Protocolized autonomy — AI/protocols execute within named, versioned, bounded protocols with named accountability and mandatory review cadence

**Decision:** Option 3. The "three-framework" model:
- **Protocol-authorized actions** (§13.1): Named, versioned protocols with named accountable clinician, mandatory review cadence (6 months high-risk, 12 months standard), one-action rollback, interaction engine gating
- **AI guardrail-governed interactions** (§13.2): Configurable guardrail templates with immutable platform floor, crisis detection always-on, test suite required before activation
- **Human clinical judgment** (§13.3): Clinician's judgment always takes precedence; AI is decision support, never decision authority

**Consequences:**
- Protocol activation requires multi-party sign-off (clinical, regulatory, technical) — this slows activation but prevents premature autonomy
- Expired protocols automatically revert to clinician review (PROTO-002) — prevents stale automation
- Critical interaction signals block protocol execution (SIGNAL-004) — protocols cannot override safety
- The platform floor (22 FLOOR contracts) is immutable — no configuration relaxes safety below the floor
- Auto-approve for Mode 2 is explicitly deferred to post-launch with a 90-day track record requirement

**References:** Master PRD v1.6 §13, Contracts Pack 00-INVARIANTS.md, AI Clinical Assistant Slice PRD v1.0

---

## ADR-006: Interaction engine runs before clinician commits to medication choice

**Status:** Accepted
**Date:** 2026-04-23

**Context:** Most prescribing systems run interaction checks after the clinician has already selected a medication, dose, and quantity. This means signals appear as obstacles to an already-committed decision, creating override fatigue.

**Options considered:**
1. Check after full prescription entry (industry standard) — familiar but creates override fatigue
2. Check on medication selection, before dose/quantity — signals influence choice, not obstruct it
3. Real-time check as clinician types — technically complex, marginal benefit over option 2

**Decision:** Option 2. The interaction engine fires when the clinician selects a medication in the prescribing flow, before they enter dose and quantity. Signals appear early enough to influence the medication choice.

**Consequences:**
- Clinician UX must show signals inline during medication selection, not as a modal after submission
- The engine must be fast enough to not block the prescribing flow (under 2 seconds for typical lists, under 5 for polypharmacy)
- If the engine is slow or unavailable, the prescribing flow shows "safety check in progress" and blocks confirmation until the check returns (never auto-approved without check, per SIGNAL-001)
- Override fatigue should be measurably lower than industry standard; tracked via clinician quality dashboard

**References:** Clinician Portal IA v1.0 §4.9, Medication Interaction Engine Slice PRD v1.0

---

## ADR-007: No AI in community spaces

**Status:** Accepted
**Date:** 2026-04-23

**Context:** The Community Platform could include AI-generated content (automated health tips, AI responses to questions, AI moderation messages). The question is whether AI should participate as an active content creator in peer support spaces.

**Options considered:**
1. AI actively posts in community (health tips, responses to questions) — higher engagement, trust risk
2. AI moderates but never posts — invisible assistance
3. AI is absent from community — peer and expert content only; AI available via the assistant launcher

**Decision:** Option 3. AI does not post, respond, or generate content within community spaces. Peer content is peer content. Expert content is expert content. AI is available through the global assistant launcher if a patient wants clinical clarity on something discussed in a group.

**Consequences:**
- Community content is authentically human (peer or expert)
- Content source indicators in community are simpler (peer, expert, moderator — no AI)
- AI content screening (pre-publication) runs behind the scenes but doesn't surface in the community feed
- If a patient shares AI-generated content from a chat into a community post, it's treated as the patient's content (no automatic AI labeling on reshared content)

**References:** Community Platform Slice PRD v1.0, Design System v1.1 §6.4

---

## ADR-008: Bridge supply on consent revocation for abrupt-discontinuation medications

**Status:** Accepted
**Date:** 2026-04-23

**Context:** When a patient revokes care consent, in-flight refills are cancelled. But some medications (SSRIs, beta-blockers, anticonvulsants, corticosteroids) are dangerous to stop abruptly. Abrupt discontinuation can cause withdrawal, rebound, or seizures.

**Options considered:**
1. Hard stop on all medications — simplest, potentially dangerous
2. Bridge supply for all medications — overprotective, may violate revocation intent
3. Bridge supply only for abrupt-discontinuation-risk medications, clinician-authorized — targeted safety measure

**Decision:** Option 3. When consent is revoked and an in-flight refill involves a medication flagged for abrupt-discontinuation risk, the refill enters a SAFETY_HOLD state. The clinician is notified and may authorize a limited bridge supply (typically 7-14 days taper). The bridge supply is a new prescribing action, not a continuation of the revoked consent — it requires its own clinical justification and audit trail.

**Consequences:**
- The Medication Interaction Engine must maintain abrupt-discontinuation flags on medications
- The Refill state machine has a SAFETY_HOLD state (already defined in State Machines v1.1)
- Bridge supply is audited as a distinct clinical decision, not a consent continuation
- The patient is informed that a safety taper is being provided and why
- This adds complexity to the consent revocation flow but prevents a genuine safety risk

**References:** Consent & Delegated Access Slice PRD v1.0 §9, Refill Slice PRD v1.0 §10

---

## ADR-009: Sensitive-category data default-hidden from delegates

**Status:** Accepted
**Date:** 2026-04-23

**Context:** Delegates (family members, caregivers) need access to a patient's health data to help manage care. But some health data — mental health, sexual health, reproductive health, substance use — may be information the patient does not want their family member to see.

**Options considered:**
1. Delegates see everything — simplest, highest privacy risk
2. Delegates see nothing clinical — safest, defeats the purpose of delegation
3. Delegates see all data except sensitive categories unless explicitly granted — balanced

**Decision:** Option 3. Mental health, sexual health, reproductive health, and substance use data are default-hidden from delegates. The patient can explicitly grant access per category per delegate. The delegate sees a complete-looking interface — they cannot tell that data has been withheld (no "hidden data" indicator).

**Consequences:**
- FLOOR-006 enforces this at the data access layer, not the UI layer
- Clinicians can mark conditions and medications as belonging to sensitive categories
- The delegation setup flow must include clear, non-pressuring consent for sensitive categories
- If a medication is in a sensitive category and the delegate has `view_records` scope but not the sensitive category grant, the medication is hidden from their view
- This creates complexity for delegates who are also clinical caregivers — but patient autonomy over sensitive data trumps caregiver convenience

**References:** Consent & Delegated Access Slice PRD v1.0 §6.4, RBAC Permissions Matrix v1.0 §3.2

---

## ADR-010: WhatsApp as primary notification channel, SMS as critical fallback

**Status:** Accepted
**Date:** 2026-04-23

**Context:** Ghana has 113% mobile connection penetration but varied internet quality. Patients need to receive notifications reliably. WhatsApp has high penetration in urban Ghana. SMS is universally available but more expensive and less rich.

**Options considered:**
1. SMS primary — universally available, expensive at scale, no rich content
2. WhatsApp primary — high engagement, requires internet, requires Business API
3. In-app only — cheapest, patients won't open the app proactively
4. WhatsApp primary with SMS fallback for critical items — balanced

**Decision:** Option 4. WhatsApp is the primary engagement channel. SMS is the critical fallback (emergencies, OTP, payment confirmations, WhatsApp delivery failures). In-app push for non-critical engagement. All notifications written to the in-app inbox regardless.

**Consequences:**
- WhatsApp Business API is a Wave 1 launch dependency (application submitted at T-15)
- All WhatsApp messages use pre-approved templates (submission during Phase 2 build)
- Critical notifications (RPM critical alerts, crisis detection, OTP) always fire SMS regardless of WhatsApp status
- Quiet hours are enforced for standard notifications but bypassed for critical
- SMS costs are manageable because SMS is fallback-only, not primary

**References:** Notification Spec v1.1 §2, Ghana Launch Playbook v1.1

---

## ADR-011: Fake medication detection is advisory-only at launch

**Status:** Accepted
**Date:** 2026-04-23

**Context:** Fake medication detection uses multiple methods (verification codes, visual inspection, batch validation, supply chain provenance, pharmacovigilance correlation). False positives — flagging a legitimate medication as counterfeit — undermine trust in the pharmacy and the platform.

**Options considered:**
1. Patient-visible alerts from day one — immediate value, false-positive risk
2. Advisory-only at launch (pharmacist-facing, not patient-facing) — builds calibration data without trust risk
3. No detection at launch — loses a key differentiator

**Decision:** Option 2. Detection signals are generated and shown to the pharmacist at the release check step. The pharmacist decides whether to proceed, hold, or reject. Patient-visible signals are deferred until the false-positive rate drops below 2% (measured over at least 90 days of pharmacy-only operation).

**Consequences:**
- The fake medication detection pipeline runs from launch, generating data
- Pharmacists get experience with the tool and calibrate their trust in it
- False-positive rate is measured per detection method, allowing selective promotion of high-accuracy methods
- The <2% gate is a hard requirement before patient-visible signals activate — not a target, a gate
- Reference image library for top 20 medications must be complete before launch (Ghana Launch Playbook T-2)

**References:** Fake Medication Detection Slice PRD v1.0 §7, Pharmacy Portal Slice PRD v1.0

---

## ADR-012: Async-to-sync consult conversion preserves all data

**Status:** Accepted
**Date:** 2026-04-23

**Context:** A clinician reviewing an async case may decide it needs a live conversation (ESCALATED_TO_SYNC). The question is whether the sync consult starts fresh or carries forward the async context.

**Options considered:**
1. Fresh start — clean but wastes patient's intake effort and clinician's async review time
2. Full carry-forward — all intake data, AI summary, signals, and clinician notes transfer
3. Summary carry-forward — condensed version transfers

**Decision:** Option 2. Full carry-forward. The sync consult entity references the original async consult. The clinician's pre-call preparation screen shows all async context. The patient does not re-enter intake information. The AI scribe has access to the async context for reference during the call.

**Consequences:**
- The Consult entity has a `converted_from` field (already in Canonical Data Model)
- The sync pre-call prep screen is pre-populated, reducing preparation time
- Billing: the patient pays the sync consult fee; the async fee is either waived or credited (pricing decision TBD, flagged in §23)
- The audit trail shows the full journey: async initiation → async review → escalation decision → sync booking → sync completion

**References:** Async Consult Slice PRD v1.0, Sync Video Consult Slice PRD v1.0, Canonical Data Model v1.0 (Consult entity)

---

## ADR-013: Immutable append-only audit — no exceptions

**Status:** Accepted
**Date:** 2026-04-23

**Context:** Healthcare platforms need comprehensive audit trails for regulatory compliance, safety investigation, and clinical accountability. The question is whether audit records can ever be modified or deleted.

**Options considered:**
1. Mutable audit with access controls — simpler, weaker integrity guarantee
2. Append-only audit with correction-by-new-record — stronger integrity, more storage
3. Append-only with cryptographic hash chain — strongest integrity, highest complexity

**Decision:** Option 2 at launch, with cryptographic hash chain (option 3) as a post-launch enhancement. Audit records are append-only and immutable. Corrections produce new audit records with a reference to what they correct. No audit record is ever modified or deleted. If an audit write fails, the triggering action fails (except AI responses during crisis — per FLOOR-020, safety trumps audit completeness in that narrow case).

**Consequences:**
- Storage grows monotonically — archival strategy needed for long-term cost management
- Retention: 7 years clinical, 10 years prescribing, 5 years moderation (per AUDIT-003)
- Every module must write audit synchronously before returning success (per AUDIT-002)
- The audit query API must handle large datasets efficiently (indexing, pagination, filtering)
- Regulatory export must produce jurisdiction-appropriate formats

**References:** Contracts Pack 00-AUDIT-EVENTS.md, AUDIT-001 through AUDIT-004

---

## ADR-014: 5-clinician minimum panel for Ghana launch

**Status:** Accepted
**Date:** 2026-04-23

**Context:** The clinician panel must provide coverage for: 12 hours of async availability, 8 hours of sync video availability, and 24/7 on-call for emergencies and critical alerts. The minimum number of clinicians to cover this without burnout is the question.

**Options considered:**
1. 3 clinicians — barely covers async, no redundancy
2. 5 clinicians — covers all three requirements with some redundancy
3. 8+ clinicians — comfortable coverage, higher recruitment cost

**Decision:** 5-clinician minimum. Coverage model: 12h async (2 clinicians rotating), 8h sync (1-2 clinicians with scheduled slots), 24/7 on-call (rotating, 1 clinician per shift). This provides single-point redundancy — if one clinician is unavailable, coverage continues with reduced capacity rather than zero capacity.

**Consequences:**
- Recruitment must be complete by T-4 of Ghana Launch Playbook
- Clinician compensation model must be resolved (fixed + per-case, or salary, or hybrid)
- Refill reviews are compensated as a distinct work unit (not bundled with consult compensation)
- Panel scaling assessment at T+12 weeks (90-day review) determines when additional clinicians are needed
- If volume exceeds panel capacity before scaling, async SLA extends (24h → 36h) with patient notification

**References:** Ghana Launch Playbook v1.1 §2, Flagged Items Resolution v1.0

---

## ADR-015: Progressive consent presentation — sequential, not wall-of-text

**Status:** Accepted
**Date:** 2026-04-23

**Context:** The platform has 6 consent types (platform, care, data-use, delegation, jurisdictional, episode). Presenting all at once during onboarding overwhelms patients and produces uninformed consent.

**Options considered:**
1. All consents at onboarding — complete but overwhelming
2. Progressive presentation — each consent presented when contextually relevant
3. Single omnibus consent — legally simpler, ethically weaker

**Decision:** Option 2. Consents are presented sequentially at the moment they become relevant:
- Platform consent: at account creation (required to proceed)
- Care consent: at program enrollment or first consult initiation
- Data-use consent: at first AI interaction or data-sharing moment
- Delegation consent: when setting up a delegate
- Jurisdictional consent: when market-specific requirements trigger
- Episode consent: at specific clinical episode initiation (if applicable)

**Consequences:**
- Onboarding has only one consent block (platform consent) — under 5 minutes target preserved
- Each consent captures its own evidence artifact (timestamp, device, session)
- Consent blocks are interruptible — patient can decline and resume the triggering action later
- The consent service must handle "which consents does this action require?" logic per action type

**References:** Consent & Delegated Access Slice PRD v1.0 §4, Forms/Intake Engine Slice PRD v1.0

---

## ADR Index

| ADR | Title | Status |
|---|---|---|
| ADR-001 | Modular monolith at launch, service extraction later | Accepted |
| ADR-002 | Two-mode AI architecture (Mode 1 + Mode 2) | Accepted |
| ADR-003 | Market Launch as sole offerability authority | Accepted |
| ADR-004 | Pattern A for Forms Engine — one version per market | Accepted |
| ADR-005 | Protocolized autonomy, not open-ended autonomy | Accepted |
| ADR-006 | Interaction engine runs before clinician commits | Accepted |
| ADR-007 | No AI in community spaces | Accepted |
| ADR-008 | Bridge supply on consent revocation | Accepted |
| ADR-009 | Sensitive-category data default-hidden from delegates | Accepted |
| ADR-010 | WhatsApp primary, SMS fallback | Accepted |
| ADR-011 | Fake medication detection advisory-only at launch | Accepted |
| ADR-012 | Async-to-sync conversion preserves all data | Accepted |
| ADR-013 | Immutable append-only audit | Accepted |
| ADR-014 | 5-clinician minimum panel | Accepted |
| ADR-015 | Progressive consent presentation | Accepted |

---

## Document control

- **v1.0** — Initial ADR set. 15 architecture decisions recorded covering: system decomposition (ADR-001), AI architecture (ADR-002, ADR-007), governance model (ADR-003, ADR-004, ADR-005), clinical safety (ADR-006, ADR-008, ADR-011), privacy (ADR-009), operations (ADR-010, ADR-014), data integrity (ADR-013), workflow design (ADR-012, ADR-015). Each decision includes context, options considered, decision rationale, and accepted consequences.
- **ADR immutability rule:** Accepted ADRs are never edited. If a decision is reversed, a new ADR supersedes the old one with a reference. The old ADR remains in the record with status changed to `Superseded by ADR-XXX`.
- **Next:** Additional ADRs expected as OpenAPI design surfaces API-level decisions, and as clinical governance produces protocol library decisions.
