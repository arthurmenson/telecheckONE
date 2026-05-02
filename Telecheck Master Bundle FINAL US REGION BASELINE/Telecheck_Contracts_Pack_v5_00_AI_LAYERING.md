# 00-AI-LAYERING.md — Contracts Pack v5

**Version:** 5.2
**Supersedes:** v5.1 (Adversarial Counsel Review remediation 2026-04-25); v4.2 00-AI-LAYERING.md
**Change summary (v5.2 added 2026-05-02 per v1.10.1 hygiene cycle physical merge of v1.10 PRD Update Cycle delta artifact `Phase3_Group2_Contracts_v1_10_Edits_2026-05-01.md` §AI_LAYERING):** Adds §10 Future Workload Expansion per ADR-029 — AI-ARCH-001 supersession scope statement (single source of truth: WORKLOAD_TAXONOMY contract §5); Mode 1/Mode 2 ↔ workload taxonomy mapping (Mode 1 → `conversational_assistant`; Mode 2 → `protocol_execution`); ADR-002 + ADR-005 preservation rules (current workloads remain bound by ADR-002 and ADR-005 at autonomy_level ≤ `action_with_confirm` per I-012); I-012 preservation rule mirroring Master PRD §13.7 v0.3 reject-unless three-clause normative wording exactly. Two-mode architecture (§2 AI-ARCH-001, AI-ARCH-002) preserved without modification — all five guardrail invariants, AI boundaries, audit, resilience, agreement tracking sections preserved.

**v5.1 change summary:** Absorbs two-mode AI architecture from AI Clinical Assistant Slice PRD v1.0 and ADR-002. Adds Mode 1/Mode 2 distinction, guardrail template governance, AI scribe contracts, and AI-not-in-community boundary.

---

## 1. Scope

This contract governs all AI behavior in Telecheck: the AI Clinical Assistant (Mode 1 and Mode 2), AI lab interpretation, AI scribe, AI food scanning, and any future AI surface. It defines what AI may and may not do, how it is governed, and how it is audited.

---

## 2. Two-mode architecture

**Invariant AI-ARCH-001:** AI in Telecheck operates in exactly two modes. Every AI action is attributable to one mode.

### Mode 1 — Conversational Assistant

| Property | Value |
|---|---|
| Purpose | Patient-facing conversational chat |
| Governed by | Admin-configurable guardrail templates (§3) |
| Audit fields | session_id, patient_id, guardrail_template_id, guardrail_version, ai_model_version, escalation_triggered, crisis_detected |
| Can initiate workflows | Yes (refill, consult booking, lab upload — through standard service gates) |
| Can make clinical decisions | No |
| Can prescribe | No |
| Can approve refills | No |
| Labels | Every response carries `source_type: "ai"` and the active guardrail template |

### Mode 2 — Protocol Execution Agent

| Property | Value |
|---|---|
| Purpose | Structured async clinical case preparation for physician review |
| Governed by | Clinical protocols (Master PRD §13.1) |
| Audit fields | consult_id, patient_id, protocol_id, protocol_version, ai_model_version, recommendation, confidence, physician_agreement |
| Produces | Clinical summary, recommendation, confidence level, concern flags |
| Physician review | Required for every case at launch. Auto-approve is post-launch (requires 90-day track record — Feature PRD Index #28). |
| Can prescribe | No. Prepares the case; clinician prescribes. |

**Invariant AI-ARCH-002:** Mode 2 auto-approve (executing clinical decisions without per-instance physician review) requires: 90-day track record of physician agreement rates, zero safety-critical disagreements, Clinical Governance Lead sign-off, and a formal ADR recorded before activation. Until activated, every Mode 2 case is physician-reviewed.

### AI Scribe

| Property | Value |
|---|---|
| Purpose | Real-time transcription and summary during sync video consults |
| Governed by | Scribe-specific quality controls (not guardrail templates) |
| Audit fields | consult_id, transcript_id, summary_id, ai_model_version, clinician_edit_rate |
| Output | Draft post-visit summary for clinician review and editing |
| Clinical authority | None. Scribe is a documentation tool. Clinician finalizes the summary. |

---

## 3. Guardrail template governance

**Invariant AI-GUARD-001:** Every Mode 1 response is governed by exactly one guardrail template. The template_id and version are logged on every response.

**Invariant AI-GUARD-002:** No guardrail template may relax behavior below the platform floor (FLOOR-007 through FLOOR-013). The configuration validator rejects templates that would violate the floor at deploy time. The runtime enforcer catches violations that pass validation.

**Invariant AI-GUARD-003:** The Conservative Default template cannot be modified or deactivated. It is the immutable fallback. Emergency Safe Mode reverts all markets to Conservative Default.

**Invariant AI-GUARD-004:** Guardrail template deployment requires a passing test suite (GUARD-002). Test suites are defined per template and cover: scope boundaries, framing rules, escalation triggers, refusal behavior, crisis detection integration, and platform floor compliance.

**Invariant AI-GUARD-005:** Guardrail template rollback to Conservative Default is a one-action operation for authorized roles (AI Safety Lead, Country Launch Director). Takes effect within 60 seconds.

### Ghana launch templates

| Template | Scope | Status |
|---|---|---|
| Conservative Default | General health education, medication information, lab explanation, symptom discussion, crisis detection. No diagnosis, no dosing outside care. | Always active. Cannot deactivate. |
| GLP-1 Program | Extends Conservative Default with GLP-1-specific education, injection guidance, side effect management, weight discussion. | Deploys when GLP-1 program launches. |
| ED Program | Extends Conservative Default with ED medication education, nitrate contraindication enforcement, sensitive-category privacy protection. | Deploys when ED program launches. |
| Labs | Extends Conservative Default with lab value explanation, trend discussion, medication-lab correlation. | Deploys when lab upload feature launches. |

Full template content and test suites: see Guardrail Templates & Test Suites v1.0.

---

## 4. AI boundaries — immutable

These boundaries apply to ALL AI modes, ALL guardrail templates, ALL markets, at ALL times. They are the AI portion of the platform floor.

**FLOOR-007:** No concealment of AI identity. Every AI response carries `source_type: "ai"`. The frontend renders the AI indicator.

**FLOOR-008:** No impersonation of named human clinicians. AI never claims to be a specific named human.

**FLOOR-009:** No harmful instructions. No suicide means assistance, self-harm facilitation, or clearly harmful instructions. Crisis resources surfaced instead.

**FLOOR-010:** No specific dosing advice outside authenticated, consented care relationship. Unauthenticated users receive general information + escalation.

**FLOOR-011:** No definitive diagnosis without clinician review. "Could be consistent with..." is permitted. "You have [condition]" is never permitted.

**FLOOR-012:** No bypass of consent, identity, jurisdiction, or safety gating. AI-initiated actions pass through the same service gates as user-initiated actions.

**FLOOR-013:** No bypass of mandatory escalation conditions. Escalation detection runs independently of guardrail configuration. Even if a template doesn't mention a specific escalation, the platform-level detector fires.

---

## 5. AI in community — boundary

**Invariant AI-COMM-001:** AI does not post, respond, or generate content within community spaces (ADR-007). Community content is authentically human (peer, expert, moderator). AI content screening runs behind the scenes for safety but does not surface in the community feed.

**Invariant AI-COMM-002:** If a patient shares AI-generated content from a chat session into a community post, it is treated as the patient's content. No automatic AI labeling is applied to reshared content in community.

---

## 6. AI audit

**FLOOR-020:** Every AI-generated response produces an audit record containing: session_id (Mode 1) or consult_id (Mode 2), patient_id, mode (mode_1 / mode_2 / scribe / interpretation / food_scan), guardrail_template_id and version (Mode 1) or protocol_id and version (Mode 2), ai_model_version, input summary, output summary, escalation_triggered, crisis_detected, timestamp.

**Exception:** If audit write fails during a crisis response, the AI response is still delivered (safety trumps audit completeness for crisis). Operations alert fires. Audit is written when the system recovers.

---

## 7. AI provider resilience

**Invariant AI-RESIL-001:** LLM provider unavailability does not cascade to clinical workflows. If the AI Service is down: Mode 1 chat shows "AI assistant temporarily unavailable" with alternative actions (book consult, call support). Mode 2 cases queue for clinician review without AI summary (clinician reviews from intake data directly). AI scribe is unavailable but the video call continues normally. Lab interpretation queues for clinician review.

**Invariant AI-RESIL-002:** AI Service has independent health monitoring. Degraded performance (p95 latency >4 seconds) triggers an operations alert and is visible on the admin dashboard.

---

## 8. Physician agreement tracking (Mode 2)

**Invariant AI-AGR-001:** Every Mode 2 case records the physician's agreement with the AI recommendation: `agreed`, `modified`, or `disagreed`. This is a required field at clinician decision time for Mode 2 cases.

**Invariant AI-AGR-002:** Disagreement patterns are surfaced on the AI quality dashboard and contribute to the 90-day track record assessment for auto-approve consideration.

**Invariant AI-AGR-003:** Any safety-critical disagreement (physician disagrees and the AI recommendation, if followed, would have caused patient harm) triggers an immediate AI quality review and is flagged for protocol/guardrail recalibration.

---

## Change log

| Version | Change |
|---|---|
| v4.2 | Initial AI layering contract |
| v5.0 | Absorbed two-mode AI architecture (ADR-002). Added Mode 1/Mode 2 distinction with separate governance frameworks. Added guardrail template governance (5 invariants). Added Ghana launch template set. Added AI-not-in-community boundary (ADR-007). Added AI scribe contract. Added physician agreement tracking invariants. Added AI provider resilience invariants. |

---

## 9. Tenant scoping (added v5.1)

Per ADR-023 multi-tenancy Model A and CRITICAL-01 remediation, AI Mode 1 and Mode 2 operations are tenant-scoped:

- **AI conversation sessions are tenant-scoped.** Every AI Mode 1 conversation belongs to a specific tenant; conversation history does not cross tenant boundaries even when the same human is registered in multiple tenants. The patient_id alone does not authorize Mode 1 access; (tenant_id, patient_id) pair authorizes.
- **Mode 2 protocol selection is tenant-scoped via the tenant's protocol library.** A tenant in Ghana uses the Ghana Protocol Library (per Operations Truth artifact); a tenant in the US uses the US Protocol Library when available. Tenant Admin via Admin Backend selects which protocols are active for which programs in their tenant.
- **Guardrail templates are platform-scoped, with tenant override capacity.** Per Guardrail Templates v1.X, the platform ships canonical guardrail templates. Tenants may override specific templates with tenant-Clinical-Lead approval (per RBAC v1.1) — for example, a tenant whose program has a specific contraindication rule may add a guardrail. Override audit per Category B.
- **AI provider abstraction is tenant-honoring.** Per ADR-020 LLM provider abstraction, the platform selects the LLM provider for a given AI workload. Tenants may not override the provider selection (avoids inconsistent clinical behavior across tenants). Configuration of which LLM provider serves which workload is platform-scoped per Master PRD v1.X §11.
- **AI audit records carry `tenant_id`** per AUDIT_EVENTS v5.1.
- **AI conversation persistence is tenant-keyed at the encryption layer** per I-023 — per-tenant KMS keys mean cross-tenant conversation retrieval requires multi-tenant key access (break-glass).

**Anti-patterns:**
- Sharing a Mode 1 conversation context across tenants for a person with multiple tenant accounts. Conversations are per-tenant.
- Allowing tenant AI configuration to weaken platform guardrails. Tenants may add guardrails, never weaken.
- Using AI suggestion engines (per Admin Backend v1.X §5.7) without tenant context — every AI-assisted operator function operates on the tenant's data only.

---

## 10. Future workload expansion (added v5.2 per ADR-029)

The two-mode AI architecture in §2 (AI-ARCH-001, AI-ARCH-002) remains binding for current Mode 1 / Mode 2. Per ADR-029, the **WORKLOAD_TAXONOMY contract** introduces a property-based discriminator (`ai_workload_type`) that classifies AI invocations and reserves namespace placeholders for future workload types (`autonomous_agent`, `multi_agent_supervisor`, `tool_using_agent`).

### 10.1 Supersession scope (canonical statement; single source of truth: WORKLOAD_TAXONOMY §5)

> AI-ARCH-001 remains binding only as: **v1.0 has exactly two active workload types, `conversational_assistant` and `protocol_execution`.** AI-ARCH-001 no longer prohibits reserved future workload type names from existing in WORKLOAD_TAXONOMY's enum, but any **activation** of a reserved workload type requires successor ADR approval (ADR-030, 031, 032, 033, 034 as applicable).

### 10.2 Mapping current Mode 1 / Mode 2 to workload taxonomy

| AI-LAYERING term | Workload taxonomy value | Notes |
|---|---|---|
| Mode 1 | `conversational_assistant` | Identical semantics; relabeled. |
| Mode 2 | `protocol_execution` | Identical semantics; relabeled. ADR-005 protocolized autonomy remains binding for current workloads. |

Code, schema, audit, and config MUST use the workload taxonomy values (`conversational_assistant`, `protocol_execution`) in new v1.10+ artifacts. UI / operator-facing terminology may continue to use "Mode 1 / Mode 2" labels. The `actor_type = ai_mode_1` / `ai_mode_2` aliases in AUDIT_EVENTS are preserved for backward-compat; new code uses `actor_type = ai_workload` per AUDIT_EVENTS v5.2 §2.

### 10.3 ADR-002 + ADR-005 preservation

ADR-002 binary AI mode framing remains binding for current Mode 1 / Mode 2 until separate successor ADR. ADR-005 protocolized autonomy remains binding for `protocol_execution` workload at autonomy_level ≤ `action_with_confirm`. ADR-029 supersedes ADR-002 prospectively for new workload additions only — current workloads continue under ADR-002.

### 10.4 I-012 preservation rule (mirrors Master PRD §13.7 v0.3 — single normative source)

For prescription, refill, and medication-order actions governed by I-012, `protocol_execution` workload may only reach `executed` state through `action_with_confirm` with explicit clinician confirmation. The full reject-unless three-clause rule is canonicalized in Master PRD §13.7 (single normative source of truth) and mirrored in WORKLOAD_TAXONOMY §2.2 + AUTONOMY_LEVELS §2.3 + AUDIT_EVENTS §3.

The platform MUST reject any I-012-governed transition to `executed` UNLESS all three of the following hold simultaneously, evaluated per `action_id`:

1. `autonomy_level == action_with_confirm` (string equality; not membership in a set).
2. An explicit clinician confirmation event exists in the immutable audit chain scoped to this `action_id` prior to the transition.
3. The confirming actor holds a role authorized to sign for the action class under RBAC v1.1 / I-012.

Reserved levels (`action_with_audit_only`, `fully_autonomous`) require both successor ADR approval AND activation audit event in the immutable audit chain — ADR approval alone never sufficient.

### 10.5 AI scribe and lab interpretation classification

AI Scribe (per §2 AI Scribe table) is currently a documentation-tool workload, not a clinical-decision workload. It does not yet have a workload-taxonomy classification per ADR-029. Lab interpretation runs as `protocol_execution` (Mode 2) per existing AI-LAYERING. Both classifications may be revisited under future ADR amendments without affecting current production semantics.

---

## Document control

- **v4.2** — Initial AI layering contract.
- **v5.0** — See Change log table above.
- **v5.1** — Adds §9 Tenant scoping per ADR-023. AI Mode 1 conversations tenant-scoped; Mode 2 protocol selection tenant-scoped; guardrail templates platform-scoped with tenant override capacity. Threading remediation per Adversarial Counsel Review v1.0 finding CRITICAL-01. Existing two-mode architecture, guardrail governance, AI boundaries, audit, provider resilience, and physician agreement tracking preserved without modification.
- **v5.2 (2026-05-02 per v1.10.1 hygiene cycle physical merge of v1.10 PRD Update Cycle delta artifact `Phase3_Group2_Contracts_v1_10_Edits_2026-05-01.md` §AI_LAYERING)** — Adds §10 Future workload expansion per ADR-029: §10.1 Supersession scope statement (single source of truth WORKLOAD_TAXONOMY §5) — AI-ARCH-001 remains binding as "v1.0 has exactly two active workload types"; §10.2 Mode 1/Mode 2 ↔ workload taxonomy mapping (Mode 1 → `conversational_assistant`, Mode 2 → `protocol_execution`); §10.3 ADR-002 + ADR-005 preservation rules (current workloads remain bound by ADR-002 / ADR-005 at autonomy_level ≤ `action_with_confirm`); §10.4 I-012 preservation rule mirroring Master PRD §13.7 v0.3 reject-unless three-clause normative wording (string equality + audit-chain confirmation + RBAC role); reserved levels require successor ADR + activation audit event (ADR approval alone never sufficient); §10.5 AI scribe and lab interpretation classification status. Per ADR-029 (AI workload taxonomy + autonomy levels), Master PRD v1.10 §13.7. Two-mode architecture (§2 AI-ARCH-001, AI-ARCH-002), all five guardrail invariants, AI boundaries, audit, provider resilience, agreement tracking, and §9 tenant scoping preserved without modification. v5.2 is purely additive.
