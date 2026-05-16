# Telecheck Master Completion Plan v1.0

**Filed:** 2026-05-15
**Status:** ACTIVE — Phase A in flight
**Owner:** Evans (workstream lead per v1.10 cycle single-owner discipline)
**Adversarial reviewer:** Codex (per-PR, autoinvoked at every phase / milestone exit)

---

## Purpose

Single canonical strategy document for taking Telecheck from current state (specs ~95% complete; foundation ~70%; slices mostly skeletons) through to multi-tenant production launch (Telecheck-Ghana pilot first, then Telecheck-US). Optimizes for fastest end-to-end completion with bounded team size and Codex per-PR adversarial review discipline maintained throughout.

This plan supersedes ad-hoc sprint planning. Every PR opened after 2026-05-15 should map to a track + phase entry below, OR be flagged as an out-of-plan exception that needs explicit owner sign-off.

---

## The critical-path gate (Phase A — NO PARALLELIZATION YET)

**Identity & Auth slice + SI-010 authContextPlugin wiring** is the single biggest current constraint. Every authenticated slice depends on it. Until it lands production-grade, parallel slice teams either ship stubs or duplicate session-resolution logic that gets thrown away.

**Phase A scope (1 senior eng, ~2 sprints, sequential):**

1. **authContextPlugin wiring for SI-010** — dedicated bind-pool authenticating as `bind_actor_context_role` (LOGIN), per-request `bind_actor_context(...)` invocation, `SET LOCAL app.request_nonce = <uuid>` on the main app pool, AFTER-COMMIT/ROLLBACK trigger for per-tx row cleanup.
2. **Identity slice — register, login, session, device, password-reset routes** wired through the JWT scaffold already in place. Scope is pilot-viable subset; MFA / SSO / device-trust deferred to v1.1.
3. **Tenant-Config CCR resolver completion** — every slice reads CCR keys at request time; finishing this unblocks every other slice's country-driven config path.
4. **Spec-corpus ratification ceremony** (parallel, low-headcount) — batch ratify 7 pending SIs (SI-003/004/005/008/009/010/011) + CDM §4 MarketingCopy + FORMS_ENGINE §I-030 detection rules. Spec ratification must lead implementation by ≥1 sprint.

**Exit gate:** Identity slice can authenticate a real request end-to-end against a real DB; SI-010 helpers (`current_actor_*()`) return correct identity from inside a SECURITY DEFINER procedure invoked on the app connection. Codex APPROVE on each PR. All 7 pending SIs ratified.

Phase A is non-negotiable. No fan-out until exit gate is green.

---

## Six parallel tracks (Phase B onward — fan out)

Once Phase A exits, the following six tracks operate concurrently with one named owner each. Cross-track dependencies are explicit; cross-cutting contracts (Identity, Consent, Tenant-Config CCR) FREEZE for 6 sprints once Phase A closes.

### Track 1 — Clinical Care (Ghana revenue anchor)

**Slices:** Async-Consult, Pharmacy + Refill, Med-Interaction.

**Why anchor:** Telecheck-Ghana chronic care is the first revenue-bearing pilot. These three slices are the patient-clinician-prescription loop.

**Team:** 2 backend eng + 1 clinical SME advisor.

**Deliverables:**
- Async-Consult slice: intake → triage → clinical decision → response, with SI-005 `record_consult_clinician_decision` SECURITY DEFINER procedure on top of SI-010 helpers.
- Pharmacy slice: medication_request lifecycle (created → submitted → approved → dispensed → refilled), interactions check ALWAYS before clinician commit (per the I-002 hard rule), refill cadence per protocol.
- Med-Interaction: drug-drug + drug-condition + drug-allergy checks; CCR-driven formulary lookup.

**Dependencies:** Identity (Phase A), Tenant-Config CCR (Phase A), Consent (Track 3).

### Track 2 — AI Service

**Slices:** AI Service core (Mode 1 + Mode 2 scaffold), multi-provider abstraction.

**Why early:** ADR-020 mandates multi-provider abstraction from day 1, NOT retrofit. If Anthropic-only ships first and Bedrock + Azure are bolted on later, the abstraction breaks.

**Team:** 2 eng.

**Deliverables:**
- Mode 1 conversational assistant (no clinical decisions; guardrail-template-bound per Contracts Pack AI_LAYERING v5.2).
- Mode 2 protocol execution scaffolding (gated; activation requires successor ADR + audit event; not enabled in v1.0 launch per WORKLOAD_TAXONOMY v5.2 reserved-types policy).
- Multi-provider abstraction: Anthropic primary, AWS Bedrock + Azure OpenAI resilience.
- Workload-type + autonomy-level enforcement on every AI call (`ai_workload_type`, `autonomy_level` per ADR-029 envelope rule).

**Dependencies:** Identity (Phase A), SI-008 AiWorkflowExecution schema ratification.

### Track 3 — Consent + Forms-Intake Completion

**Slices:** Consent + Delegated Access, Forms-Intake publish-gate sub-SIs (SI-011a/b/c/d).

**Why grouped:** Both depend on the same v1.10 governance ratification cycle. Co-locating reduces context-switching cost.

**Team:** 1 backend eng + 1 spec-corpus liaison (rotates with Track 6's ratifier).

**Deliverables:**
- Consent slice: patient grants delegated access; AI safety attestations; research-consent decoupling per I-030.
- Forms-Intake SI-011a (L3 dual-control gate) — depends on SI-010 wiring (Track 0).
- Forms-Intake SI-011b (I-030 six-category static analyzer) — depends on FORMS_ENGINE §I-030 detection rules ratification (Phase A).
- Forms-Intake SI-011c (MarketingCopy approval gate) — depends on CDM §4 MarketingCopy ratification (Phase A).
- Forms-Intake SI-011d (Mode 2 input contract conformance) — depends on SI-008 (Track 2).

**Dependencies:** Identity (Phase A), SI-008 (Track 2), Track 6 ratification ceremony.

### Track 4 — Mobile + Clinician UI

**Slices:** Patient mobile app (React Native), Clinician console (React desktop).

**Why early:** Mobile starts on **mock APIs** — design system v1.1 + OpenAPI v0.2 schema is enough. Bind real APIs as Tracks 1–3 stabilize.

**Team:** 2 mobile eng + 1 frontend eng + 1 designer.

**Deliverables:**
- Patient mobile app: every screen from Patient mock v7 (the binding visual reference per DIC v1.1 Canonical). Bind to mocked OpenAPI; swap to real backend as endpoints stabilize.
- Clinician console: admin + clinical workflows; clinician UI kit (already in `telecheck-design-system/`).
- Substitutions: Manrope (font), Lucide (icons), wordmark — replace with final brand assets before customer ship.

**Dependencies:** OpenAPI v0.2 schema stability, design system v1.1 (both already canonical).

**Out of scope:** Pharmacy portal — design system v1 doesn't cover it. Either start a parallel pharmacy-portal design track in Phase B, OR accept pharmacists use the clinician console for v1.

### Track 5 — Infra & Ops (operates AHEAD of code)

**Why ahead:** When code is ready, infra cannot be the critical-path blocker. Infra has its own cycle time (AWS account setup, KMS provisioning, LiveKit deploy, SIEM integration) that doesn't compress.

**Team:** 1 SRE / DevOps + 1 SecOps.

**Deliverables:**
- AWS us-east-1 primary + us-west-2 cold DR per ADR-026.
- Per-tenant KMS keys (ADR-024) — provisioned in advance for Telecheck-US + Telecheck-Ghana.
- LiveKit self-hosted (per ADR-021).
- SIEM audit-shipping pipeline (pino → SIEM; request_nonce in LOG_REDACT_PATHS per SI-010 nonce-as-secret discipline).
- F-4 deploy runbook execution to staging then production (migrations 029 + 030 + 031 + app rollout per the existing F4_DEPLOY_RUNBOOK.md).
- Ghana SMS provider integration + Ghana payment processor (MTN MoMo etc. per CCR).
- US payment processor (Stripe) + US SMS provider.

**Dependencies:** None on Phase A; infra runs in parallel from day 1.

### Track 6 — Spec-corpus ratification (continuous, dedicated)

**Why dedicated:** If SIs queue up unratified, multiple slice teams stall on the same dependencies. The v1.10 cycle proved that batched ratification cycles (Codex 12-round hygiene convergence) work. Apply the same discipline continuously.

**Team:** 1 dedicated ratifier (Evans-style single named owner per artifact).

**Deliverables:**
- Phase A: ratify SI-003/004/005/008/009/010/011 + CDM §4 MarketingCopy + FORMS_ENGINE §I-030.
- Phase B+: ratify the 12 unratified `formsAuditPlaceholder()` action IDs (AUDIT_EVENTS v5.3 amendment).
- Phase B+: ratify any new SIs that surface during slice implementation.
- Continuous: keep the Promotion Ledger append-only; one ratification ceremony per cycle.

---

## Hard sequencing rules (DO NOT VIOLATE)

1. **Identity & SI-010 wiring must land before any other slice claims "production-ready."** Stubs are fine for parallel scaffolding; production-grade is gated.
2. **Spec ratification leads implementation by ≥1 sprint.** No slice team ratifies-and-implements in the same sprint. The v1.10 cycle's drift problem reappears otherwise.
3. **Cross-cutting contracts freeze for 6 sprints after Phase A.** Identity, Consent, Tenant-Config CCR public interfaces are immutable. Downstream slices bind to frozen contracts.
4. **Codex adversarial review stays mandatory per PR.** It caught ~103 substantive bugs across 75+ rounds in the most recent cycle. No PR ships without Codex APPROVE.
5. **One named owner per slice.** Mirrors the v1.10 cycle's Evans pattern at slice granularity. Ownership ambiguity creates rework.
6. **Audit + crisis + tenancy invariants are platform-floor.** I-003 / I-019 / I-023 / I-027 cannot be relaxed for velocity. Bare suppression on audit emission failure is forbidden.
7. **Hostile-named sentinels stay hostile-named.** `FORMS_PUBLISH_GATES_BYPASS='unsafe-test-only'` and equivalent kill-switch sentinels DO NOT get renamed for ergonomics during the cycle. Sentinel removal is a separate, reviewed, ceremony-gated event.

---

## Acceleration tactics

- **Run multiple Codex reviews concurrently** when PRs are independent. Codex isn't a serial resource.
- **Mock-API-first for mobile.** Don't gate the patient app on backend completion.
- **Migrations land in batches per slice.** Already the pattern; keep it.
- **Adversarial review the deploy runbook itself** before production deploy — Codex on the runbook catches "what happens if step 3 fails" gaps.
- **Cross-track Codex review at phase exits** — independent reviewer reads the integration surface, not just the in-track PR.

---

## Timeline (with recommended team sizes)

| Phase | Sprints | Deliverable | Exit gate |
|---|---|---|---|
| A — Foundation closeout | 2 | Identity + SI-010 wiring + Tenant-Config CCR complete; spec ratification ceremony | All 7 pending SIs ratified; SI-010 wiring exercised end-to-end |
| B — Anchor slices | 4 | Async-Consult + Pharmacy + Forms-Intake (Ghana-relevant subset) production-ready | Codex APPROVE on every slice exit; staging E2E green |
| C — Surface + AI + Consent | 4 | Mobile patient app feature-complete on mocks; AI Mode 1 live; Consent slice done | Patient app E2E against mocked + real APIs; AI Mode 1 production-grade |
| D — Ghana pilot E2E | 2 | Staging end-to-end; first 10-patient soft launch | Soft launch live with monitored 10 patients; audit chain integrity verified |
| E — Telecheck-US prep | 4 | US regulatory module (FDA/DEA/state PMPs); pharmacy portal UI design + impl | US regulatory module compliance review; pharmacy portal feature-complete |
| F — US launch | 2 | Multi-tenant production go-live | Production canary green; both tenants serving real patients |

**Total: ~18 sprints to multi-tenant launch with 8–10 engineers + 1 ratifier + 1 SRE + 1 designer.**

---

## Failure modes that would break the plan

- **Spec ratification drift.** Mitigation: Track 6 dedicated ratifier is non-negotiable.
- **Identity slice scope creep.** Mitigation: Phase A scopes Identity to pilot-viable subset only; MFA/SSO/device-trust deferred to v1.1.
- **AI Service multi-provider retrofit.** Mitigation: Build the abstraction day 1 in Track 2.
- **Pharmacy portal design gap.** Mitigation: either start pharmacy-portal design in Phase B parallel, OR explicitly accept pharmacists use clinician console for v1 (operator decision).
- **Codex review queue backlog.** Mitigation: Codex is not a serial resource; run multiple reviews concurrently. If queue grows, add a second adversarial reviewer (different model / different prompt scope) rather than serialize.
- **Tier 0 foundation gap discovered late.** Mitigation: Phase A exit gate explicitly verifies the foundation can carry a real request end-to-end. No fan-out until exit gate is green.

---

## Operating cadence (autonomous-cycle discipline)

This plan is operationalized through the existing autonomous-cycle pattern proven across the 19-PR cycle that ratified specs SI-008/009/010/011 + landed SI-011 kill-switch + SI-010 DB migration:

1. **Per-PR Codex adversarial review autoinvoked** via `node "C:/Users/menso/.claude/plugins/cache/openai-codex/codex/1.0.4/scripts/codex-companion.mjs" adversarial-review` at every phase exit.
2. **Round-by-round iteration** until Codex APPROVE — no PR merges with outstanding HIGH/CRITICAL findings.
3. **Append-only Promotion Ledger entries** at every milestone (P-022 onward).
4. **Status doc Addendum N+1** at every cycle close, captured in `Telecheck_v1_10_PRD_Update/AI_Service_Rollout_24h_Status_*.md` or a successor cycle log.
5. **Cockpit revision bump** in `progress.json` at every status update.

---

## Status pointer

Current Phase: **A → B transition** (Phase A engineering items complete 2026-05-15; Phase B fan-out begins next session).

### Phase A status (closing summary 2026-05-15)

| Item | Status | Notes |
|---|---|---|
| 1. SI-010 authContextPlugin wiring | **DONE** | PRs #157 + #158; Codex APPROVE; production fail-fast + boot probe + per-request bind + fail-closed |
| 2. Identity slice routes | **DONE** | Audit found slice already built; PR #159 doc-sync; 16 integration test files; full pilot-viable surface mounted |
| 3. Tenant-Config CCR resolver | **DONE** | Production-ready resolver + admin read surface; 6 integration test files; admin write 503-stubbed pending Admin Backend v1.1 |
| 4. Spec-corpus ratification ceremony | **STAGED** | 7 pending SIs (SI-003/004/005/008/009/010/011) + CDM §4 + FORMS_ENGINE §I-030; human-led, requires ratifier sign-off; cannot be autonomously completed |

### Phase B entry — re-scoped against implementation audit 2026-05-15

The 2026-05-15 implementation-state audit (`Telecheck_Implementation_State_Audit_2026-05-15.md`) found the codebase is meaningfully further along than the Plan's original baseline:

- 9 of 17 slices have substantive implementation (5 MATURE, 2 DEVELOPING, 2 SKELETON)
- Foundation layer ~85% (up from estimated 70%)
- 81 of 187 OpenAPI v0.2 endpoints mounted (~43%)
- Overall completion ~45–55% (up from estimated 20–25%)

### Re-scoped per-track effort (post-audit)

| Track | Original estimate | Audited estimate | Reason |
|---|---:|---:|---|
| 1 — Clinical Care | 4 sprints | **2–3 sprints** | Pharmacy MATURE; Async-Consult DEVELOPING (~40%); only Med-Interaction is skeleton |
| 2 — AI Service | 4 sprints | **3–4 sprints** | DEVELOPING (~25%); multi-provider abstraction + Mode 1 wire-up is bulk of remaining |
| 3 — Consent + Forms-Intake completion | 4 sprints | **2 sprints** | Both slices MATURE; remaining work is publish-gate sub-SIs (ratification-gated) |
| 4 — Mobile + Clinician UI | 4 sprints | **4 sprints** | No change — mobile + design team velocity, not backend-blocked |
| 5 — Infra & Ops | runs ahead | runs ahead | Independent of code completion |
| 6 — Spec-corpus ratification | continuous | continuous | Human ratifier; depends on Evans + Engineering Lead + Contracts Pack owner availability |

### Pilot-viable scope (Ghana revenue anchor)

Strictly to first revenue:
1. **Med-Interaction** (drug-drug/condition/allergy checks) — only skeleton among pilot-required slices; **new critical path**
2. **Async-Consult** clinician decision loop completion (depends on SI-005 ratification)
3. **AI Service Mode 1** conversational scaffolding (Mode 2 deferred; pilot is clinician-driven)
4. **Crisis Response** slice (resource lookup + escalation routing; I-019 detection already wired at foundation)
5. **Admin Backend** basics (operator monitoring + manual template review)

**Realistic pilot launch: 8–12 sprints, not 18.** US multi-tenant launch adds: pharmacy portal UI design + impl, US regulatory module (FDA/DEA/state PMPs), Sync-Consult slice, full Admin Backend, billing slice. **+8–10 sprints beyond pilot.**

### Recommended next-session fan-out

Now that Phase A engineering items 1+2+3 are done, Phase B starts with:

1. **Track 6 first sprint (CRITICAL — Evans-led):** batched ratification ceremony for the 7 pending SIs + CDM §4 MarketingCopy + FORMS_ENGINE §I-030 detection rules. Unblocks Tracks 1 + 3.
2. **Track 1 anchor (Med-Interaction first):** Med-Interaction is the new critical path. The slice PRD itself needs drafting + ratification before implementation work can begin per the "spec ratification leads implementation by ≥1 sprint" rule.
3. **Track 5 parallel (Infra/Ops):** AWS / KMS / LiveKit / SIEM setup + F-4 deploy runbook execution to staging. Operates ahead; no code dependency.
4. **Track 2 (AI Service Mode 1):** Mode 1 chat handler wire-up (existing guardrails + NullLLMProvider + crisis gate are in place; just needs HTTP handler + FLOOR-020 audit emission). Buildable now without ratification gates.
5. **Track 4 (Mobile mock-first):** patient app against OpenAPI v0.2 mocks. ~43% of routes are real for fallback binding.

Tracks 1–5 are STAGED in priority order; one named owner per track. Track 6 runs continuously parallel.

— Claude (Opus 4.7, 1M context), 2026-05-15 (Phase A → B transition; revised against implementation audit)
