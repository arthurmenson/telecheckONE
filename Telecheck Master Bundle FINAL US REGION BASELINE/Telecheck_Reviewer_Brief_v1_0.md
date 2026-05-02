# Telecheck — Reviewer Brief & Reading Order

**Version:** 1.0 (refreshed 2026-04-26 for US Region Migration Cycle U-003 — stale-pointer refresh only; no semantic content changes)
**Status:** Canonical briefing document
**Last updated:** 2026-04-26 (US Region Migration Cycle U-003 stale-pointer refresh; previous polish pass 2026-04-24)
**Audience:** Anyone reviewing the Telecheck document set — investors, clinical reviewers, regulatory reviewers, security reviewers, engineers, advisors.

---

## What Telecheck is (30-second version)

Telecheck is an AI-powered telehealth, pharmacy, and health intelligence platform. It unifies telemedicine, pharmacy fulfillment, lab interpretation, remote patient monitoring, AI clinical assistance, and patient community into one connected system. Telecheck-Ghana is the pilot market within emerging markets, operated under the Heros Health Ghana consumer DBA. The architecture is global.

**One-line:** Assess → Treat → Monitor → Guide — one platform, one patient journey.

---

## What you're looking at

58 documents totaling roughly 180,000 words across the markdown corpus, plus presentation assets in the investor decks. The set spans product, contracts, architecture, slices, engineering, experience, operations, and external communications. You do not need to read all of it. This brief tells you what to read based on who you are and what you're reviewing.

### Document classification

The set contains four types of documents. Know which type you're reading:

**Canonical product and platform truth** (use these as authoritative specifications; *post-v1.10 promotion 2026-05-01 + v1.10.1 hygiene cycle 2026-05-02*):
Master Platform PRD v1.10 (v1.9 superseded), all launch slice PRDs, Contracts Pack v5.2 for the 11 amended/new files in v1.10 cycle (modular file set; filenames retain `v5_00` legacy pattern; headers govern; ERROR_MODEL + IDEMPOTENCY + SOURCE_OF_TRUTH preserved at v5.1), ADR Set v1.0 + ADR Addendum 016–019 + ADR Addendum 020–025 (with ADR-025 superseded by ADR-026) + ADR Addendum 026 + ADR-027 + ADR-028 + ADR-029, Canonical Data Model v1.2 (48 active entities + 7 reserved-future per v1.10 cycle), State Machines v1.1 (18 active + 4 reserved-future transitions), OpenAPI v0.2 (187 endpoints across 22 modules), RBAC Permissions Matrix v1.1 (3 new research roles), System Architecture v1.2 (16 modules including Research Data Export Module), Design System v1.1, Design Implementation Contract v1.1 Canonical for development, Patient App IA v1.0, Clinician Portal IA v1.0, Admin Operator IA v1.1, Notification Spec v1.1, Protocol Library Ghana v1.0, Guardrail Templates v1.0, Payment & Billing Spec v1.0, Identity & Authentication Spec v1.0, Messaging & Inbox Spec v1.0, Artifact Registry v2.10

**Supporting review history** (context for how decisions were made — read for understanding, not as specs):
Red-Team Review, Flagged Items Resolution v1.0, Consolidated Launch Tracker v1.0

**Operations playbooks** (how to execute the launch):
Ghana Launch Playbook v1.2

**External communications** (investor-facing materials):
Investor Pitch Deck (Ghana), Nigeria Investor Pitch, Investor One Pager

**This brief** is an orientation document — it tells you what to read, not what to build.

---

## The 5 things that matter most

Before diving into any document, understand these five decisions — they are the architectural spine of the entire platform:

1. **Protocolized autonomy, not open-ended autonomy** (ADR-005). The AI and protocols can only act within named, versioned, bounded scopes with named human accountability and mandatory review cadence. There is no "AI decides" pathway.

2. **Immutable platform floor** (Contracts Pack, 22+ FLOOR contracts; v1.10 cycle adds I-029/030/031 for research data discipline — total 25). No configuration, admin action, or market-specific customization can relax safety below the floor. Crisis detection, audit logging, and emergency escalation are always on.

3. **Two-mode AI architecture, reframed as workload taxonomy** (ADR-002 superseded by ADR-029 at v1.10). Mode 1 / Mode 2 are operator-facing terms for two `ai_workload_type` values (`conversational_assistant` and `protocol_execution`). Workload taxonomy reserves additional types for future agentic workloads behind not-yet-active ADRs (030–034). I-012 reject-unless three-clause rule is preserved at v1.0 active levels.

4. **Market Rollout Cockpit** (Market Rollout Cockpit Slice PRD). Every market is governed by a versioned Market Pack. Feature availability is deterministic, not probabilistic. Emergency Safe Mode reverts all configurable behavior to strictest defaults within 60 seconds.

5. **Brand structure + program catalog architecture (v1.10 cycle additions):**
   - **Brand structure (C3 / Master PRD §17):** `Telecheck` is the platform / B2B brand only — never consumer-facing. `Heros Health` is the global consumer DBA, country-instanced via subdomains (`heroshealth.com`, `ghana.heroshealth.com`). Operating tenants follow `Telecheck-{country}` naming (e.g., `Telecheck-US`, `Telecheck-Ghana`); these identifiers are internal/B2B only.
   - **Program catalog architecture (C6 / Master PRD §10.5):** Programs (e.g., GLP-1 weight management, RPM/CCM, AE Reporting) are platform-level catalog entries. Per-market activation is governed by `ProgramMarketPolicy`. Forms Engine four-layer model (Pattern A immutable per-market form versions) instantiates the program in each market. CCR runtime resolves operational config per `country_of_care`.
   - **Country-conditional DTC marketing posture (C4 / ADR-027):** Molecule-level marketing is gated by CCR `marketing.molecule_level_marketing_permitted`. US: `prohibited` permanent. Ghana: `pending_evidence` pending regulatory engagement. Triple sign-off + audit trail required for any molecule-level surface.
   - **Research data partnership Posture A (C5 / ADR-028):** Release 2 capability — parent-level WHO/UN partnerships, 5th-tier optional consent, REC-overseen, k-anonymity-floored aggregate exports under signed DSA. Behavior-changing post-market protocols (Posture B) remain absolute non-goal.

---

## Reading order by reviewer type

### If you are a clinical reviewer (physician, clinical safety, nursing)

| Order | Document | Why | Time |
|---|---|---|---|
| 1 | This brief | Orientation | 5 min |
| 2 | ADR Set — ADR-002, ADR-005, ADR-006, ADR-008 | Core clinical decisions | 15 min |
| 3 | Protocol Library Ghana v1.0 | The actual clinical protocols — this is what you're reviewing | 30 min |
| 4 | Guardrail Templates v1.0 — Conservative Default + test suites | What the AI can/cannot say to patients | 30 min |
| 5 | AI Clinical Assistant Slice PRD v1.0 | Two-mode framework, physician workflow, guardrail governance | 20 min |
| 6 | Medication Interaction Engine Slice PRD v1.0 | 5 check classes, override logic, signal severity | 20 min |
| 7 | Pharmacy + Refill Slice PRD v2.1 | Refill lifecycle, protocol-authorized pathways, consent revocation | 20 min |
| 8 | Herb-Drug Interaction Engine Slice PRD v1.0 | Unique to Telecheck — phytochemical-aware checking | 15 min |
| 9 | Adverse Event Reporting Slice PRD v1.0 | Feedback loops, severity classification, external reporting | 15 min |
| **Total** | | | **~3 hours** |

**What to focus on:** Are the protocol eligibility criteria clinically appropriate? Are the lab thresholds right? Are the guardrail escalation triggers comprehensive? Is the herb-drug knowledge base scope adequate for Ghana?

---

### If you are a regulatory / compliance reviewer

| Order | Document | Why | Time |
|---|---|---|---|
| 1 | This brief | Orientation | 5 min |
| 2 | ADR Set — ADR-005, ADR-009, ADR-013 | Autonomy model, privacy model, audit model | 15 min |
| 3 | Contracts Pack v5 — 00-INVARIANTS, 00-AUDIT-EVENTS | Platform floor and audit contracts | 30 min |
| 4 | Consent & Delegated Access Slice PRD v1.0 | 6 consent types, revocation, delegation, sensitive categories | 20 min |
| 5 | RBAC Permissions Matrix v1.1 | Who can do what, enforcement architecture | 20 min |
| 6 | Adverse Event Reporting Slice PRD v1.0 | External reporting pathway, escalation timing | 15 min |
| 7 | Market Rollout Cockpit Slice PRD v1.0 | Market governance, evidence locker, readiness checklist | 15 min |
| 8 | Protocol Library Ghana v1.0 — §6 (clinical content requiring review) | Items that need regulatory sign-off | 10 min |
| 9 | Ghana Launch Playbook v1.2 — §4 (go/no-go criteria, regulatory readiness) | What regulatory sign-offs are needed before launch | 10 min |
| **Total** | | | **~2.5 hours** |

**What to focus on:** Is the consent model adequate for Ghana's Data Protection Act? Is the audit trail sufficient for MDC/PCN requirements? Is the adverse event reporting pathway Ghana FDA-compatible? Is the protocol governance model acceptable to regulators?

---

### If you are a security reviewer

| Order | Document | Why | Time |
|---|---|---|---|
| 1 | This brief | Orientation | 5 min |
| 2 | System Architecture v1.2 | Module decomposition, communication patterns, external integrations | 20 min |
| 3 | RBAC Permissions Matrix v1.1 | Role definitions, permission enforcement, three-layer architecture | 20 min |
| 4 | OpenAPI v0.2 — §2 (conventions), §3 (auth), then skim endpoints | API surface, authentication model, delegation header | 30 min |
| 5 | Contracts Pack v5 — 00-AUDIT-EVENTS, 00-IDEMPOTENCY, 00-ERROR-MODEL | Audit integrity, idempotency enforcement, error handling | 20 min |
| 6 | Canonical Data Model v1.2 — §6 (sensitive data classification) | PII/PHI classification, encryption requirements | 10 min |
| 7 | Notification Spec v1.1 — §10 (content rules: what's never in notifications) | Privacy in notifications | 10 min |
| 8 | ADR Set — ADR-001, ADR-009, ADR-013 | Architecture choice, sensitive data handling, audit immutability | 10 min |
| **Total** | | | **~2 hours** |

**What to focus on:** Is the authentication model sound? Are the delegation scope checks enforceable? Is the sensitive-category visibility protection (FLOOR-006) implementable? Where are the injection/IDOR/privilege-escalation attack surfaces? Is the audit integrity guarantee achievable without cryptographic hashing at launch?

**Known gap:** No formal threat model (STRIDE/attack-tree) exists yet. Your review effectively becomes the first one.

---

### If you are an engineer (backend, frontend, or full-stack)

| Order | Document | Why | Time |
|---|---|---|---|
| 1 | This brief | Orientation | 5 min |
| 2 | System Architecture v1.2 | Your team's module map, data ownership, communication patterns | 30 min |
| 3 | ADR Set v1.0 + Addenda 016–019 + 020–025 (with ADR-025 superseded) + 026 | Every architectural decision with context and consequences (ADR-026 is the canonical hosting decision; us-east-1 primary, us-west-2 cold DR) | 30 min |
| 4 | Canonical Data Model v1.2 | 41 entities you'll be implementing | 20 min |
| 5 | State Machines v1.1 | 13 state machines your services will execute | 30 min |
| 6 | OpenAPI v0.2 | 145 endpoints your services will expose | 40 min |
| 7 | RBAC Permissions Matrix v1.1 | Permission logic your middleware will enforce | 15 min |
| 8 | Design System v1.1 | If frontend: color system, typography, components, design tokens | 20 min |
| 9 | The slice PRD for your assigned module | Domain-specific requirements | 20-30 min |
| **Total** | | | **~3.5 hours** |

**What to focus on:** Does the data model support the state machines? Do the API endpoints match the service boundaries? Are the module interfaces clear enough to implement? Where are the performance-critical paths (interaction engine: <2s, emergency routing: <60s propagation)?

---

### If you are an investor or business reviewer

| Order | Document | Why | Time |
|---|---|---|---|
| 1 | This brief | Orientation | 5 min |
| 2 | Investor Pitch Deck (Ghana) | 12-slide visual overview | 10 min |
| 3 | Investor One-Pager | Narrative summary | 5 min |
| 4 | Master PRD v1.9 — §1-§5 (vision, scope, differentiation), §18 (business model), §19 (metrics) | Strategy and economics | 20 min |
| 5 | Ghana Launch Playbook v1.2 — §2 (team), §3 (timeline), §8 (metrics) | Operational readiness | 15 min |
| 6 | Nigeria Investor Pitch Deck | Expansion market | 10 min |
| **Total** | | | **~1 hour** |

**What to focus on:** Is the business model viable? Are the launch timelines realistic? Is the competitive moat (herb-drug intelligence, fake-med detection, protocolized autonomy) defensible? Is the team structure adequate?

---

### If you are reviewing everything (adversarial full review)

| Phase | Documents | Time |
|---|---|---|
| 1. Orientation | This brief → ADR Set (including ADR Addendum 026) → Master PRD v1.9 (full) | 2 hours |
| 2. Governance layer | Contracts Pack v5.1 (modular file set) → RBAC v1.1 → Consent Slice | 3 hours |
| 3. Clinical layer | Protocol Library → Guardrail Templates → AI Clinical Assistant Slice → Interaction Engine Slice → Refill Slice → Herb-Drug Slice | 3 hours |
| 4. Engineering layer | System Architecture → Canonical Data Model → State Machines → OpenAPI | 3 hours |
| 5. Experience layer | Patient App IA → Clinician Portal IA → Admin Operator IA → Design System | 2 hours |
| 6. Remaining slices | All other slice PRDs (skim — focus on open questions sections) | 2 hours |
| 7. Operations | Ghana Launch Playbook → Notification Spec | 1 hour |
| **Total** | | **~16 hours** |

---

## §23 launch blockers — status

These are the items the Master PRD §23 identifies as decisions that must be resolved before launch.

| Blocker | Status | Document |
|---|---|---|
| Q1: Protocol library scope | ✓ Addressed | Protocol Library Ghana v1.0 — 7 protocols with activation sequence. Clinical thresholds flagged for domain expert review. |
| Q2: Guardrail templates | ✓ Addressed | Guardrail Templates v1.0 — 4 templates with 35 test cases. AI safety review required before deployment. |
| Q3: Moderation capacity + policies | Partially addressed | Community Platform Slice defines 3-layer moderation. Admin Config Slice defines policy lifecycle. Actual moderation policy content document not yet authored. |
| Q4: AE reporting destination | Framework only | Adverse Event Slice defines the pathway. Ghana FDA engagement is operational (Ghana Launch Playbook T-11). |
| Q5: Clinician coverage model | ✓ Addressed | ADR-014: 5-clinician minimum. Ghana Launch Playbook §2 defines coverage model. |
| Q6: Subscription billing infrastructure | Framework only | RPM/CCM Slice defines subscription model. Payment module in System Architecture. Vendor selection is open (Launch Tracker). |

---

## Known gaps (from Artifact Registry v2.10 §5)

| Gap | Impact on review |
|---|---|
| Moderation policy content document | Regulatory and clinical reviewers cannot assess community safety without it |
| Pricing document | Business reviewers cannot assess unit economics |
| Clinical safety case / FMEAs | Clinical reviewers will produce their own informal FMEA; a structured one would save time |
| Threat model | Security reviewers will produce their own informal threat assessment; a structured one would focus effort |
| DPIAs per market | Regulatory reviewers will flag this as a gap |
| Build vs spec traceability matrix | Engineers cannot assess what's actually shippable vs only documented |

---

## Document layer map (visual)

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCT TRUTH                             │
│  Master PRD v1.9 · Red-Team Review · Flagged Items          │
│  Launch Tracker · Artifact Registry                         │
├─────────────────────────────────────────────────────────────┤
│                  GOVERNANCE / CONTRACTS                      │
│  Contracts Pack v5 (14 runtime + 1 historical) · RBAC Matrix               │
├─────────────────────────────────────────────────────────────┤
│                    ARCHITECTURE                              │
│  ADR Set (15 decisions) · System Architecture                │
├─────────────────────────────────────────────────────────────┤
│                   SLICE TRUTH (×17)                          │
│  Refill · Med Interaction · Consent · Forms · Async Consult  │
│  Sync Video · Labs · Pharmacy · AE · RPM · AI Assistant      │
│  Community · Herb-Drug · Fake Med · Acquisition · Admin      │
│  Market Rollout Cockpit                                      │
├─────────────────────────────────────────────────────────────┤
│                  ENGINEERING TRUTH                            │
│  Canonical Data Model · State Machines · OpenAPI v0.2        │
├─────────────────────────────────────────────────────────────┤
│                  EXPERIENCE TRUTH                             │
│  Patient App IA (48) · Clinician Portal IA (34)              │
│  Admin Operator IA (36) · Design System                      │
├─────────────────────────────────────────────────────────────┤
│                  CONTENT TRUTH                                │
│  Protocol Library Ghana (7) · Guardrail Templates (4)        │
│  Notification Spec (55+ types)                               │
├─────────────────────────────────────────────────────────────┤
│                  OPERATIONS TRUTH                             │
│  Ghana Launch Playbook                                       │
├─────────────────────────────────────────────────────────────┤
│                 EXTERNAL COMMS                                │
│  Ghana Pitch · Nigeria Pitch · One-Pager                     │
└─────────────────────────────────────────────────────────────┘
         118 screens · 145 API endpoints · 21 data entities
         13 state machines · 51 contracts · 15 ADRs
         7 protocols · 4 guardrail templates · 55+ notifications
```

---

## How to give feedback

For each document, note:
1. **Errors** — factually wrong, logically inconsistent, or contradicts another document
2. **Gaps** — something missing that should be addressed
3. **Risks** — something that might not work in practice
4. **Questions** — things you need clarified

Tag each item with the document name and section number. This makes feedback actionable rather than ambient.

---

## Document control

- **v1.0 cycle additions — 2026-05-02 (per v1.10.1 hygiene cycle physical merge of Phase5 delta Group 5E, Rows 5 + 14 + 24 + 79 + 89):** "What Telecheck is" reframed: "Ghana is the anchor market" → "Telecheck-Ghana is the pilot market within emerging markets, operated under the Heros Health Ghana consumer DBA" (C2 + C3). "The 4 things that matter most" expanded to "The 5 things that matter most" — added (5) Brand structure + program catalog architecture orientation block bundling C3 brand-structure cascade, C6 program catalog architecture, C4 country-conditional marketing posture, C5 research data partnership Posture A. Item (3) "Two-mode AI architecture" updated to reference workload taxonomy reframing per ADR-029 (Mode 1 / Mode 2 reframed as `conversational_assistant` / `protocol_execution` `ai_workload_type` values; I-012 preserved). Item (2) FLOOR-contract count updated from 22 to 25 to reflect new I-029/030/031 research data invariants. Body content otherwise preserved at v1.0 baseline.
- **v1.0 (refreshed 2026-04-26, US Region Migration Cycle U-003)** — Stale-pointer refresh only. Updated canonical version pointers throughout: Master PRD v1.6 → v1.9, System Architecture v1.0 → v1.2, RBAC v1.0 → v1.1, CDM v1.0 → v1.2, Registry v2.3 → v2.9, Refill Slice v1.0 → Pharmacy + Refill Slice v2.1; ADR Set reference now includes Addenda 016–019, 020–025 (with ADR-025 superseded), and 026; "all 17 Slice PRDs" generalized to "all launch slice PRDs" (current count differs from v1.0 era). No semantic content changes; all reading orders, reviewer-type segmentations, time estimates, and §23 launch-blocker analysis preserved unchanged. This is a corrective metadata refresh consistent with the v1.0 brief's structure.
- **v1.0** — Initial Reviewer Brief. Reading orders for 5 reviewer types (clinical, regulatory, security, engineering, investor) plus full adversarial review. §23 launch blocker status. Known gaps. Document layer map.
