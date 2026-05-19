# SI-016 — `ai_workflow_handler_registry` CDM canonical schema

**Version:** 0.1 DRAFT
**Status:** Pre-Codex-pre-ratification; not yet routed to ratifier
**Authoring location:** `Telecheck_v1_10_PRD_Update/` (workstream folder; ratifier-input artifact)
**Owner:** AI Service slice owner + Async Consult slice owner (cross-cutting consumers)
**Related artifacts:**
- Promotion Ledger entry **P-024** (SI-011 UMBRELLA ratification 2026-05-18) — filed SI-016 as a dependency SI required for SI-011 Forms-Intake AI-workflow integration
- Promotion Ledger entry **P-018** (SI-008 AiWorkflowExecution ratification-intent 2026-05-17) — SI-008's `ai_workflow_executions` references handler implementations; this SI provides the canonical handler registry the FK points to
- ADR-029 (AI Workload Taxonomy) — establishes `ai_workload_type` enum (conversational_assistant | protocol_execution | autonomous_agent | multi_agent_supervisor | tool_using_agent); this SI's registry rows carry that taxonomy
- ADR-030/031/032/033/034 (reserved-future agentic-context taxonomy expansions) — handler registry is forward-compatible
- Master PRD v1.10 §13.7 — AI workload taxonomy section
- Contracts Pack v5.2 `Telecheck_Contracts_Pack_v5_00_WORKLOAD_TAXONOMY.md` — workload-taxonomy contract
- Contracts Pack v5.2 `Telecheck_Contracts_Pack_v5_00_AUTONOMY_LEVELS.md` — autonomy-level contract

---

## 1. Why this SI exists

ADR-029 ratified the AI workload taxonomy (`ai_workload_type` enum) at v1.10 promotion 2026-05-01. SI-008's `ai_workflow_executions` (ratified at SC2 P-018) records workflow execution events but doesn't define what handler implementation served the execution.

SI-011 UMBRELLA (SC7 P-024 ratification 2026-05-18) filed SI-016 as a NEW dependency SI for Forms-Intake AI-workflow integration: Forms-Intake protocol execution invokes AI workflow handlers via Mode 2 protocol-engine integration, and each handler must be canonically identified (and version-pinned, audit-attributable, governance-reviewable).

**Scope:** define the canonical `ai_workflow_handler_registry` entity row shape — a lookup table mapping handler_id + version → canonical implementation reference, with versioning + governance + tenant-scope rules.

**Out of scope:**
- Handler implementation specs (lives in AI Service slice + telecheck-app code repo)
- AI Service Mode 1 conversational handler details (separate scope; SI-008 + ADR-029 cover Mode 2 + autonomous types)
- Per-handler permission policies (RBAC at the workflow execution level, not the registry lookup)

---

## 2. Proposed sub-decisions (5; APPROVED status varies per OQ4 cross-SI persistence-model decision)

**Per-decision APPROVED recommendation status:**

| Sub-decision | APPROVED status | Conditioned on |
|---|---|---|
| 1. CDM new entity `ai_workflow_handler_registry` | **PERSISTENCE-MODEL-DEPENDENT** | Same OQ4 as SI-015 + SI-019 (immutable vs constrained-update with state) |
| 2. AUDIT_EVENTS +2 Cat B action IDs | **APPROVED** | Independent of persistence model |
| 3. DOMAIN_EVENTS +2 additive event types | **APPROVED** | Independent of persistence model |
| 4. RBAC +1 role definition (handler-registrar) | **APPROVED** | Independent of persistence model |
| 5. Tenant-threading per ADR-023 + I-023 + I-032 | **APPROVED** | Independent of persistence model |

### Sub-decision 1: CDM §4 new entity `ai_workflow_handler_registry`

One row per immutable version of a registered handler. Columns:

- `id` ULID primary key
- `tenant_id` Telecheck-{country} — OR `'platform'` sentinel for platform-wide handlers (see OQ2 below)
- `handler_name` VARCHAR(80) NOT NULL — canonical handler identifier (e.g., `glp1_protocol_eval`, `forms_intake_eligibility_scorer`)
- `handler_version` VARCHAR(40) NOT NULL — semver (e.g., `1.0.0`)
- `ai_workload_type` VARCHAR(40) NOT NULL — per ADR-029 enum (`conversational_assistant | protocol_execution | autonomous_agent | multi_agent_supervisor | tool_using_agent`); reserved values rejected per WORKLOAD_TAXONOMY contract
- `autonomy_level` VARCHAR(40) NOT NULL — per AUTONOMY_LEVELS contract (`advisory | suggestion | action_with_confirm | action_with_audit_only | fully_autonomous`); reserved values rejected
- `implementation_reference` JSONB NOT NULL — opaque reference to the handler implementation (e.g., `{"repo": "arthurmenson/telecheck-app", "module": "ai-service/handlers/glp1_protocol_eval", "commit_sha": "abc123...", "build_artifact_id": "..."}`)
- `governance_review_reference_id` ULID NOT NULL — references the §13.2 governance-review artifact (Mode 2 protocol-execution handlers MUST pass §13.2 governance review per Master PRD)
- `governance_review_approval_timestamp` TIMESTAMPTZ NOT NULL
- `state` VARCHAR(40) NOT NULL — per OQ4 persistence-model decision; either `(registered | published | deprecated | retired)` enum with constrained-UPDATE trigger (Option B), OR derived from append-only transition entity (Option A)
- `published_at` TIMESTAMPTZ NULL — set when state transitions to `published`
- `deprecated_at` TIMESTAMPTZ NULL — set when state transitions to `deprecated` (still operational; warn-only)
- `retired_at` TIMESTAMPTZ NULL — set when state transitions to `retired` (rejected at execution time)
- `created_at` TIMESTAMPTZ NOT NULL
- `created_by_account_id` ULID FK to accounts (the handler-registrar)

**Triple-composite UNIQUE** `(tenant_id, handler_name, handler_version)` — within a tenant scope, a handler-name + version uniquely identifies a registry row.

**Versioning rule (I-013 published-content-immutable):** handler_version semver is monotonically increasing per (tenant_id, handler_name); a new registration with the same handler_name MUST increment the version. Same-name+version registrations REJECTED.

**Persistence model per OQ4 (cross-SI ratifier decision):**
- Option A (immutable + transition entity): registry row never updates; state changes via `ai_workflow_handler_registry_transition` entity (separate). The `state` column above becomes a derived view.
- Option B (constrained UPDATE + transition log): registry row's `state` column updates via constrained-UPDATE trigger (matches P-021 SC3 precedent); transition log captures audit history. Triggers reject all UPDATEs except canonical state transitions (`registered → published`, `published → deprecated`, `deprecated → retired`).

### Sub-decision 2: AUDIT_EVENTS — 2 new Cat B action IDs

- `ai_workflow_handler_registry.registered` (Cat B; emitted on INSERT into registry; envelope per §13.2 Governance review reference)
- `ai_workflow_handler_registry.state_changed` (Cat B; emitted on each state transition; envelope captures `from_state` + `to_state` + transition reason)

Per SI-018 partition: P2 (tenant-governance) keyed on `tenant_id`. For `tenant_id = 'platform'` sentinel rows, the partition resolves to platform-tenant-keyed (canonical handling per ADR-029 cross-tenant handler-sharing TBD per OQ2).

Promotion class: content-change; AUDIT_EVENTS +1 patch bump.

### Sub-decision 3: DOMAIN_EVENTS — 2 new event types (additive)

- `ai_workflow_handler.registered.v1` — partition_key `tenant_id:handler_name`
- `ai_workflow_handler.state_changed.v1` — partition_key `tenant_id:handler_name`

Subscribers:
- AI Service runtime — refresh in-memory handler-resolution cache on `registered` or `state_changed` events
- SI-008 `record_workflow_pointer_swap` SECURITY DEFINER procedure — validates that the FK target handler is in `published` state at execution time
- Admin Backend — operator dashboard of registered handlers + their states

### Sub-decision 4: RBAC — 1 new role definition

- `ai_workflow_handler.registrar` — write role for INSERT into `ai_workflow_handler_registry`; granted to a small named set of AI Service operators + Compliance Officer (dual-control per I-015 for protocol-execution handlers; single-control acceptable for conversational_assistant handlers per OQ3 below)

State-change permissions inherit from the registrar role; explicit RBAC entries:
- `ai_workflow_handler.registrar` — INSERT + state transitions `registered → published` (requires dual-control for protocol_execution + autonomous types per OQ3)
- `ai_workflow_handler.registrar` — state transitions `published → deprecated → retired` (single-control; deprecation is monotone reductive)

### Sub-decision 5: Tenant-threading per ADR-023 + I-023 + I-032

- `ai_workflow_handler_registry.tenant_id` enforced via RLS for tenant-scoped handlers
- `tenant_id = 'platform'` sentinel — platform-wide handlers visible to all tenants (per OQ2 below); RLS bypass for SELECT only; INSERT to `'platform'` rows requires platform_admin role per I-015
- Any handler-registration SECURITY DEFINER procedure (if registration goes through a procedure rather than direct INSERT) inherits I-032 STEP 0 Mode 1/Mode 2 (per the just-ratified canonical I-032 in INVARIANTS v5.3)
- Cross-tenant handler-lookup at execution time: SI-008's `ai_workflow_executions.ai_workflow_handler_id` FK resolves to either the tenant's own registered handler OR a `'platform'`-tenant handler; canonical resolution order = tenant-specific first, then platform-fallback

---

## 3. Cross-artifact impact

If all 5 sub-decisions ratify, the lockstep PR-A2-class commit lands:

- **CDM:** +1 new entity (`ai_workflow_handler_registry`) — plus possibly +1 transition entity if Option A is selected at OQ4
- **AUDIT_EVENTS:** +2 net-new Cat B action IDs
- **DOMAIN_EVENTS:** +2 new event types (additive; no version bump)
- **RBAC:** +1 new role definition
- **Registry:** +1 minor bump consolidated
- **Promotion Ledger:** 1 new entry (P-NUM TBD)

**Total contract-file bumps:** CDM +1 minor; AUDIT_EVENTS +1 patch; RBAC +1 minor; Registry +1 minor. **DOMAIN_EVENTS additive (no bump).**

---

## 4. Open questions for ratifier

1. **OQ1 — Same as SI-015 OQ4 + SI-019 OQ7 (cross-SI PERSISTENCE-MODEL decision):** Option A immutable + transition entity, OR Option B constrained-UPDATE + transition log. **STOP-CONDITION; HARD-FLOOR ITEM 6 ESCALATION; AWAITING EVANS'S RATIFIER DECISION.** Same ratifier decision applies to SI-015 + SI-016 + SI-019 simultaneously. Claude's advisory: Option B (P-021 SC3 precedent).

2. **OQ2 — Platform-wide handlers (`tenant_id = 'platform'` sentinel) vs tenant-scoped only?** Recommendation: support BOTH; platform-wide handlers (e.g., Mode 1 conversational assistant, generic safety guardrails) are reused across tenants; tenant-specific handlers (e.g., per-tenant custom Mode 2 protocol evaluators) live in tenant scope. Sub-decision 5 codifies the dual-tier resolution.

3. **OQ3 — Dual-control on `registered → published` transitions: required for which `ai_workload_type` values?** Recommendation: REQUIRED for `protocol_execution` + `autonomous_agent` + `multi_agent_supervisor` + `tool_using_agent` (any handler with patient-impacting authority); OPTIONAL for `conversational_assistant` (Mode 1; no clinical decisions per ADR-002 + I-002).

4. **OQ4 — Codex pre-ratification target:** 3 rounds + 1 verification = 4 total. STOP-and-escalate per discipline floor on architectural-judgment.

5. **OQ5 — `implementation_reference` JSONB schema enforcement?** Recommendation: define a JSON Schema validator for the `implementation_reference` field; reject INSERT on schema violation. Specific schema: `{"repo": "<github-org/repo>", "module": "<dotted-path>", "commit_sha": "<40-char-hex>", "build_artifact_id": "<optional-ULID>"}`. Future fields additive.

---

## 5. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; awaiting Codex R1.

---

## 6. Sequence for ratification

1. Codex pre-ratification cycle on this SI (target 3-4 rounds).
2. Cross-SI OQ4/OQ1/OQ7 persistence-model ratifier decision (single decision applies to SI-015 + SI-016 + SI-019).
3. Decision Brief authored summarizing 5 sub-decisions + 5 open questions for ratifier review.
4. Ratifier ceremony (Evans-led; chat-message ratification per cycle precedent).
5. Canonical content port lockstep commit (potentially consolidated with SI-015 + SI-019 if all three converge together).

---

— Claude (Opus 4.7, 1M context), SI-016 v0.1 DRAFT authored 2026-05-19 under "continue for 24 hrs" autonomous-work authorization. Sprint 3 of the 24h-loop work plan.
