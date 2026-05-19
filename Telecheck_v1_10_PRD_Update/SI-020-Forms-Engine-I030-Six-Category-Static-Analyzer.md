# SI-020 — Forms Engine I-030 six-category static analyzer (implementation specification for the form-version-publish gate)

**Version:** 0.1 DRAFT
**Status:** Pre-Codex-pre-ratification; not yet routed to ratifier
**Authoring location:** `Telecheck_v1_10_PRD_Update/` (workstream folder; ratifier-input artifact)
**Owner:** Forms-Intake slice owner + Compliance Officer (I-030 invariant enforcement)
**Related artifacts:**
- INVARIANTS v5.3 I-030 (Research consent declination has zero impact on care delivery)
- FORMS_ENGINE v5.2 §"Research consent integration" — already enumerates the 6 forbidden-dependency categories at the canonical-policy level
- Promotion Ledger entry **P-024** (SI-011 UMBRELLA ratification 2026-05-18) — declares SI-011b "I-030 six-category static analyzer" as a per-sub-SI deliverable; SI-020 IS that SI-011b filing
- Master PRD v1.10 §15.2 + §15.3 (Research data partnership posture; consent tier)
- ADR-028 (Research Data Partnership Posture A as Release 2 goal)

---

## 1. Why this SI exists

INVARIANTS v5.3 I-030 + FORMS_ENGINE v5.2 §"Research consent integration" canonicalize the policy: **no Forms Engine layer may produce care-touching behavior that depends on `research_consent_status`.** The policy enumerates 6 forbidden-dependency categories. **What it does NOT yet specify is the static-analyzer implementation that enforces the policy at form-version-publish time.**

Without an implementation specification, individual implementers could (a) implement different analyzers across versions, (b) miss categories, (c) produce false positives that block legitimate forms, or (d) produce false negatives that allow I-030 violations to ship. Cycle precedent: every canonical invariant needs an enforcement mechanism that is itself canonical.

**Scope:** specify the static-analyzer algorithm, intermediate-representation (IR) of forms-engine artifacts, AST/IR visitor pattern, 6 detection rules (one per forbidden category), rejection codes, integration with the form-version-publish gate, regression-test obligations, and CI/CD wiring.

**Out of scope:**
- The §I-030 policy itself (already canonical in INVARIANTS v5.3 + FORMS_ENGINE v5.2)
- Form-version-publish UI / authoring tooling (separate Admin Backend scope)
- Runtime CCR validation that cross-checks the static analyzer (separate scope; CCR_RUNTIME contract)

---

## 2. Proposed sub-decisions (7; APPROVED RECOMMENDATION status varies)

| Sub-decision | APPROVED status | Note |
|---|---|---|
| 1. Forms-engine artifact IR canonical schema | APPROVED | No prior contract conflict |
| 2. Six per-category detection rules (algorithm specifications) | APPROVED | Concrete rules per category |
| 3. Rejection-code enum (one code per category + ambiguity codes) | APPROVED | Canonical enum |
| 4. Form-version-publish gate integration (where the analyzer runs) | APPROVED | Calls into existing publish-flow |
| 5. AUDIT_EVENTS amendment (analyzer-rejected + analyzer-passed events) | APPROVED | +2 Cat B action IDs |
| 6. Regression-test obligations (positive + negative test corpus) | APPROVED | Test corpus structure |
| 7. Tenant-threading per ADR-023 + I-023 + I-032 | APPROVED | Applied to analyzer service |

### Sub-decision 1: Forms-engine artifact IR canonical schema

The static analyzer operates on a canonical Intermediate Representation (IR) of forms-engine artifacts, NOT on raw authored source. Reasons:
- Decouples authoring tooling evolution (Admin Backend, future low-code authoring) from analyzer evolution
- Enables deterministic analysis regardless of cosmetic source variations (whitespace, comment text, field ordering)
- Provides a stable artifact for storage + audit reference

**Canonical IR schema (JSON; conforms to a published JSON Schema):**

```typescript
type FormVersionIR = {
  form_version_id: string;             // ULID
  form_name: string;                   // canonical form identifier
  form_version: string;                // strict semver MAJOR.MINOR.PATCH (per SI-016 grammar)
  tenant_id: string;                   // Telecheck-{country}
  country_of_care: string;             // ISO 3166-1 alpha-2
  layers: {
    L1_presentation: PresentationContentIR;
    L2_branching: BranchingLogicIR;
    L3_eligibility: EligibilityLogicIR;
    L4_approval: ApprovalGovernanceIR;
  };
  intake_flow: IntakeFlowIR;
  surface_registry: SurfaceRegistryIR;  // for L1 + visibility checks
};

type PresentationContentIR = {
  blocks: PresentationBlockIR[];
};

type PresentationBlockIR = {
  block_id: string;
  block_type: 'text' | 'image' | 'cta' | 'consent_block' | 'medication_input' | ...;
  conditional_variants?: {
    condition: ExpressionIR;            // boolean expression
    content_variants: PresentationBlockIR[];
  };
};

type ExpressionIR =
  | { op: 'literal'; value: any }
  | { op: 'identifier'; name: string }     // references a variable/field
  | { op: 'and' | 'or' | 'not' | 'eq' | 'neq' | 'lt' | 'gt' | 'in'; args: ExpressionIR[] }
  | { op: 'function_call'; name: string; args: ExpressionIR[] }
  // Declaration + scope nodes (added R1 closure for HIGH-2 alias tracking):
  | { op: 'let_binding'; name: string; rhs: ExpressionIR; scope_id: string }   // single-assignment let-binding within a scope
  | { op: 'scope_ref'; name: string; scope_id: string }                         // reference to a let-bound name within a scope
  | { op: 'scope_block'; scope_id: string; bindings: LetBindingIR[]; body: ExpressionIR };

type LetBindingIR = { name: string; rhs: ExpressionIR };

// L2/L3/L4 each have similar AST-like IRs with ExpressionIR nodes inside.
type BranchingLogicIR = { rules: BranchingRuleIR[] };
type BranchingRuleIR = { rule_id: string; condition: ExpressionIR; next_step: string };

type EligibilityLogicIR = { rules: EligibilityRuleIR[] };
type EligibilityRuleIR = { rule_id: string; condition: ExpressionIR; outcome: 'eligible' | 'ineligible' | 'pending_review' };

type ApprovalGovernanceIR = { rules: ApprovalRuleIR[] };
type ApprovalRuleIR = { rule_id: string; condition: ExpressionIR; pathway: 'auto_approve' | 'clinician_review' | 'dual_control' };

type IntakeFlowIR = {
  steps: IntakeStepIR[];
  step_transitions: { from: string; to: string; condition?: ExpressionIR }[];
};

type SurfaceRegistryIR = {
  surfaces: { surface_id: string; visibility_condition?: ExpressionIR }[];
};
```

**Canonical IR transform:** form authoring tooling (Admin Backend or low-code) emits IR alongside the source artifact. The form-version-publish gate's static analyzer reads the IR; if IR is missing or malformed, publish is rejected.

### Sub-decision 2: Six per-category detection rules

The 6 forbidden-dependency categories per FORMS_ENGINE v5.2 §I-030 enforcement. For each, the algorithm walks the relevant IR subtree, recursively visits all `ExpressionIR` nodes, and flags any `{op: 'identifier', name: 'research_consent_status'}` reference (or any reference to a derived alias — see Sub-decision 2.7 below for alias-tracking).

**Detection rule R1 — L2 BranchingLogic:** walk `layers.L2_branching.rules[*].condition`; reject if any `ExpressionIR` subtree references `research_consent_status` (directly or via alias).

**Detection rule R2 — L3 Eligibility:** walk `layers.L3_eligibility.rules[*].condition`; reject on `research_consent_status` reference.

**Detection rule R3 — L4 ApprovalGovernance:** walk `layers.L4_approval.rules[*].condition`; reject on `research_consent_status` reference.

**Detection rule R4 — L1 PresentationContent variation (non-consent-block):** walk `layers.L1_presentation.blocks[*]`; for each block whose `block_type ≠ 'consent_block'`, recursively walk its `conditional_variants.condition` (if present); reject on `research_consent_status` reference. **Carve-out:** `consent_block`-typed blocks MAY reference `research_consent_status` (specifically for rendering grant/revoke state of the consent block itself).

**Detection rule R5 — Intake-flow gating:** walk `intake_flow.step_transitions[*].condition`; reject on `research_consent_status` reference (no skipping or inserting steps based on consent).

**Detection rule R6 — Surface visibility:** walk `surface_registry.surfaces[*].visibility_condition`; reject on `research_consent_status` reference for any surface_id that is not a registered consent-block surface.

### Sub-decision 2.7: Alias-tracking (CLOSES the "rename-trick evasion" failure mode; per Codex R1 HIGH-2 the IR schema is extended above with explicit declaration/assignment/scope nodes so the analyzer can operate canonically)

A naive analyzer that only matches the literal string `research_consent_status` can be evaded by aliasing — e.g., a form author writes `let x = research_consent_status; ... if (x === 'declined') ...`. The analyzer MUST track aliases through assignment expressions.

**Pre-requisite — canonical IR contains aliasing primitives.** Per Sub-decision 1 (extended in R1 closure), the canonical `ExpressionIR` schema now includes `let_binding`, `scope_ref`, and `scope_block` nodes; the IR transform from authoring source REQUIRES every `let`/`var`/`const` assignment to be normalized into a `let_binding` node within an enclosing `scope_block`. An IR that contains any non-let-binding assignment construct is malformed and is rejected by the analyzer with `i030_ir_malformed`.

**Alias-tracking algorithm:**

1. Walk the IR depth-first, maintaining a per-scope symbol table: `Map<(scope_id, identifier_name), TaintSet>` where `TaintSet ⊆ {'research_consent_status_direct', 'research_consent_status_transitive'}`.
2. On encountering a `let_binding` node: compute the TaintSet of `rhs` recursively (taint propagates from any `identifier` or `scope_ref` whose name resolves to a tainted entry); assign `(scope_id, name) → TaintSet` in the symbol table.
3. On encountering an `identifier` or `scope_ref` node inside a rule condition (per R1-R6): look up the TaintSet in the enclosing scope chain; if TaintSet is non-empty, the rule condition is tainted.
4. On encountering a `function_call` node: if the analyzer cannot resolve the function body (e.g., external function), conservatively treat the result as tainted IF any argument is tainted (function-summary inference is deferred to future SI; v1.0 is conservative).
5. Tainted rule conditions in R1-R6 produce the per-category rejection code.

**Alias-tracking is conservatively over-approximating:** if the analyzer cannot prove an identifier is NOT tainted, it treats it as tainted (false-positive is preferred over false-negative for I-030 enforcement). The `i030_alias_taint_indeterminate` rejection code covers the indeterminate cases (e.g., function-call results where the analyzer cannot resolve the function body and one or more arguments are tainted — although per the conservative rule the analyzer rejects with the per-category code; `_indeterminate` is reserved for genuinely-undecidable cases like control-flow-dependent function calls).

### Sub-decision 3: Rejection-code enum

Canonical rejection codes (one per category + 2 ambiguity codes):

- `i030_l2_branching_consent_dependency` (R1)
- `i030_l3_eligibility_consent_dependency` (R2)
- `i030_l4_approval_consent_dependency` (R3)
- `i030_l1_presentation_consent_dependency` (R4)
- `i030_intake_flow_consent_dependency` (R5)
- `i030_surface_visibility_consent_dependency` (R6)
- `i030_alias_taint_indeterminate` (Sub-decision 2.7 ambiguity; analyzer cannot prove safety + cannot prove violation; rejected conservatively)
- `i030_ir_malformed` (form IR doesn't validate against the canonical JSON Schema)

### Sub-decision 4: Form-version-publish gate integration

The static analyzer runs at form-version-publish time as a HARD GATE:
- Pre-publish: analyzer invocation is REQUIRED; analyzer-pass is required for publish to proceed
- Analyzer-pass result is captured in the form-version row's `i030_analyzer_passed_at` + `i030_analyzer_version` columns (new CDM columns on the form-version entity per Sub-decision 4.5 below)
- Analyzer-reject result blocks publish; form-version row is left in `pending_analysis` state until either (a) authoring tooling produces a clean IR or (b) the form is abandoned
- Re-running the analyzer with a new IR creates a new analyzer-result row; the form-version row's `i030_analyzer_passed_at` is updated only on subsequent pass

### Sub-decision 4.5: CDM new columns on form-version entity (cross-SI to existing Forms-Intake CDM scope)

Adds 5 new columns to the canonical form-version entity (per Forms/Intake Engine Slice PRD v2.1; R1 closure added `current_ir_hash`):
- `current_ir_hash` VARCHAR(64) NOT NULL — SHA-256 of the form's CURRENT canonical IR; updated on every IR change. Closes Codex R1 HIGH-1 (stale-analyzer-pass-bypass) by providing a comparable hash for the publish-transition CHECK.
- `i030_analyzer_passed_at` TIMESTAMPTZ NULL — populated on analyzer-pass
- `i030_analyzer_version` VARCHAR(40) NULL — semver of the analyzer that passed
- `i030_analyzer_ir_hash` VARCHAR(64) NULL — SHA-256 of the IR that was analyzed (snapshot at pass-time; immutable until cleared)
- `i030_analyzer_rejection_codes` TEXT[] NULL — populated on analyzer-reject; cleared on subsequent pass

**Stale-pass guard (R1 HIGH-1 closure):** Whenever the form's IR is modified (any change to `current_ir_hash`), the BEFORE UPDATE trigger MUST clear `i030_analyzer_passed_at + i030_analyzer_version + i030_analyzer_ir_hash + i030_analyzer_rejection_codes` to NULL. Re-running the analyzer on the new IR produces a new pass result.

**Publish-transition CHECK constraint (extended for R1 HIGH-1 closure):**

```sql
CHECK (
  (form_version_publication_state = 'pending_analysis'
    AND i030_analyzer_passed_at IS NULL)
  OR
  (form_version_publication_state = 'pending_publish'
    AND i030_analyzer_passed_at IS NOT NULL
    AND i030_analyzer_ir_hash = current_ir_hash)  -- stale-pass guard
  OR
  (form_version_publication_state IN ('published', 'deprecated', 'retired')
    AND i030_analyzer_passed_at IS NOT NULL
    AND i030_analyzer_ir_hash = current_ir_hash)  -- stale-pass guard at publish-time too
)
```

The `i030_analyzer_ir_hash = current_ir_hash` clause is the critical guard. If the IR changes between analyzer-pass and publish attempt, the trigger clears the pass columns AND the IR-hash mismatch causes the CHECK to fail; publish is hard-blocked until re-analysis.

**New regression test (R1 HIGH-1 closure):**
- T-STALE: form passes analyzer at IR_hash A → IR modified to hash B → attempt publish → expect rejection with `i030_analyzer_passed_but_ir_changed`

### Sub-decision 5: AUDIT_EVENTS — 2 new Cat B action IDs

- `forms_engine.i030_analyzer_passed` (Cat B; emitted on analyzer-pass; envelope captures form_version_id + i030_analyzer_version + ir_hash)
- `forms_engine.i030_analyzer_rejected` (Cat B; emitted on analyzer-reject; envelope captures form_version_id + rejection_codes[] + ir_hash + IR location of each rejected reference)

Both partition tier P2 (tenant-governance) per SI-018 keyed on tenant_id. Promotion class: content-change; AUDIT_EVENTS +1 patch bump.

### Sub-decision 6: Regression-test obligations

Canonical test corpus (positive + negative) MUST ship with the analyzer:

**Positive corpus (analyzer-pass required for each):**
- T+1: minimal form with only L1 presentation, no consent block, no consent-dependent expressions
- T+2: form with consent block but no other consent-dependent expressions
- T+3: form with consent block + non-consent presentation that uses `country_of_care` (legitimate; non-consent dependency)
- T+4: form with L2/L3/L4 rules using non-consent fields (`age`, `weight`, `medication_list`, etc.)

**Negative corpus (analyzer-reject required for each; verifies each detection rule fires):**

**Direct-reference negative tests (one per category):**
- T-1: L2 BranchingLogic with `research_consent_status` reference → expect `i030_l2_branching_consent_dependency`
- T-2: L3 Eligibility with `research_consent_status` → expect `i030_l3_eligibility_consent_dependency`
- T-3: L4 ApprovalGovernance with `research_consent_status` → expect `i030_l4_approval_consent_dependency`
- T-4: L1 non-consent-block variant conditioned on `research_consent_status` → expect `i030_l1_presentation_consent_dependency`
- T-5: Intake-flow transition conditioned on `research_consent_status` → expect `i030_intake_flow_consent_dependency`
- T-6: Surface visibility conditioned on `research_consent_status` → expect `i030_surface_visibility_consent_dependency`

**Alias-via-let-binding negative tests (one per category; closes Codex R1 MED-1):**
- T-1A: L2 BranchingLogic with aliased reference (`let x = research_consent_status; ... if (x === 'declined')`) → expect `i030_l2_branching_consent_dependency`
- T-2A: L3 Eligibility with aliased reference → expect `i030_l3_eligibility_consent_dependency`
- T-3A: L4 ApprovalGovernance with aliased reference → expect `i030_l4_approval_consent_dependency`
- T-4A: L1 non-consent-block variant with aliased reference → expect `i030_l1_presentation_consent_dependency`
- T-5A: Intake-flow transition with aliased reference → expect `i030_intake_flow_consent_dependency`
- T-6A: Surface visibility with aliased reference → expect `i030_surface_visibility_consent_dependency`

**Transitive alias-chain negative tests (one per category):**
- T-1T: L2 with `a = research_consent_status; b = a; c = b; if (c)` → expect `i030_l2_branching_consent_dependency`
- T-2T: L3 with transitive alias chain → expect `i030_l3_eligibility_consent_dependency`
- T-3T: L4 with transitive alias chain → expect `i030_l4_approval_consent_dependency`
- T-4T: L1 with transitive alias chain → expect `i030_l1_presentation_consent_dependency`
- T-5T: Intake-flow with transitive alias chain → expect `i030_intake_flow_consent_dependency`
- T-6T: Surface visibility with transitive alias chain → expect `i030_surface_visibility_consent_dependency`

**Indeterminate-taint negative tests (one per category):**
- T-1I: L2 with consent-tainted arg passed to unresolvable function call → expect `i030_l2_branching_consent_dependency` (conservative reject; over-approximation) or `i030_alias_taint_indeterminate` (genuinely-undecidable; e.g., control-flow-dependent function call)
- T-2I through T-6I: analogous per category

**Malformed-IR + Stale-pass:**
- T-9: Malformed IR (missing required field, or non-canonical assignment construct outside let_binding) → expect `i030_ir_malformed`
- T-STALE: form passes analyzer at IR_hash A → IR modified to hash B → attempt publish → expect publish rejection with `i030_analyzer_passed_but_ir_changed` (per Sub-decision 4.5 stale-pass guard)

**Total negative corpus size:** 6 direct + 6 alias + 6 transitive + 6 indeterminate + 2 (malformed + stale) = **26 mandatory negative fixtures** (was 10 in v0.1). All MUST pass for analyzer release.

The test corpus is mandatory: any analyzer release that fails any positive or negative test is blocked from production.

### Sub-decision 7: Tenant-threading per ADR-023 + I-023 + I-032

- Analyzer service is tenant-scoped: each tenant's form-versions analyzed with the tenant's analyzer-version pin (analyzer-versions are themselves canonical published per a registry analogous to SI-016 — but cross-tenant analyzer-version pinning is NOT required at v1.0; deferred to OQ3)
- Analyzer service runs as a privileged service-account role (`forms_engine.i030_analyzer`); has RBAC scope to read form-version IRs + write analyzer-result rows
- The analyzer-write-result path goes through a SECURITY DEFINER procedure `record_i030_analyzer_result()` with I-032 STEP 0 Mode 1/Mode 2 per the just-ratified canonical I-032 in INVARIANTS v5.3

---

## 3. Cross-artifact impact

If all 7 sub-decisions ratify, the lockstep PR-A2-class commit lands:

- **CDM:** +4 new columns on existing form-version entity (Sub-decision 4.5) + 1 new SECURITY DEFINER procedure (`record_i030_analyzer_result`)
- **AUDIT_EVENTS:** +2 net-new Cat B action IDs (Sub-decision 5)
- **DOMAIN_EVENTS:** +2 new event types (additive: `forms_engine.i030_analyzer_passed.v1` + `forms_engine.i030_analyzer_rejected.v1`)
- **RBAC:** +1 new role (`forms_engine.i030_analyzer` service role)
- **FORMS_ENGINE Contracts Pack:** +1 minor (v5.2 → v5.3) — analyzer implementation spec added as new section
- **Registry:** +1 minor bump consolidated
- **Promotion Ledger:** 1 new entry (P-NUM TBD)

**Total contract-file bumps:** CDM +1 minor + 1 procedure + 4 columns; AUDIT_EVENTS +1 patch; FORMS_ENGINE +1 minor; RBAC +1 minor; Registry +1 minor. **DOMAIN_EVENTS additive (no bump).**

---

## 4. Open questions for ratifier

1. **OQ1 — Analyzer-version registry (cross-tenant or per-tenant pinning)?** Recommendation: per-tenant pinning at v1.0; cross-tenant analyzer-version selection deferred to a future SI. Analogous to SI-016's `'platform'` sentinel pattern — POSSIBLY warranting a parallel `analyzer_version_registry` table (defer to OQ resolution).
2. **OQ2 — IR JSON Schema versioning?** Recommendation: ship v1 of the IR JSON Schema in this SI; future schema versions require co-bumps with analyzer version (analyzer reads its own IR-version pin).
3. **OQ3 — Codex pre-ratification target:** 3 rounds + 1 verification = 4 total.
4. **OQ4 — Sub-decision 4.5 cross-SI amendment to form-version entity:** adds 4 columns to an existing CDM entity (Forms-Intake Engine Slice PRD v2.1). **POTENTIAL HARD-FLOOR ITEM 6 ESCALATION** depending on whether the existing form-version entity's Status is "PERSISTENCE-MODEL-DEPENDENT" per OQ4 / OQ7 (cross-SI). If yes, this Sub-decision 4.5 needs to defer until OQ4/OQ7/OQ1 (SI-015/SI-016/SI-019) is ratified, since the form-version entity may also need persistence-model harmonization. Recommendation: surface alongside the cross-SI persistence-model decision; defer if Option A is selected.

---

## 5. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; awaiting Codex R1.

---

## 6. Sequence for ratification

1. Codex pre-ratification cycle on this SI (target 3-4 rounds).
2. Decision Brief summarizing 7 sub-decisions + 4 open questions for ratifier review.
3. Ratifier ceremony (Evans-led; chat-message ratification per cycle precedent).
4. Canonical content port lockstep commit lands CDM + AUDIT_EVENTS + DOMAIN_EVENTS + RBAC + FORMS_ENGINE bump + Slice PRD addendum + Promotion Ledger entry + Registry bump in single commit.
5. Implementation work begins on the analyzer service in telecheck-app code repo.

---

— Claude (Opus 4.7, 1M context), SI-020 v0.1 DRAFT authored 2026-05-19 under "continue for 24 hrs" autonomous-work authorization. Sprint 4 of the 24h-loop work plan. IS the SI-011b filing called out in P-024 SC7 ratification.
