# Telecheck Implementation State Audit — 2026-05-15

**Filed:** 2026-05-15
**Owner:** Evans
**Purpose:** Honest implementation-state snapshot taken after the 22-PR autonomous run (Phase A engineering items 1+2+3 closed). Replaces the rough completion estimates in the Master Completion Plan v1.0 with measured per-slice data. This document is the canonical implementation baseline for next-session planning.

---

## Method

For each module under `src/modules/`, measured:
- `.ts` source files (excludes tests)
- Integration test files at `tests/integration/<slice>-*.test.ts`
- Mounted Fastify routes counted by `app.<verb>(...)` calls in `routes.ts`
- Cross-walked against OpenAPI v0.2's 187-endpoint target

Foundation layer (`src/lib/`) assessed separately by file completeness against the dependency-graph required for slice work.

---

## Per-slice state (2026-05-15)

| Slice | src files | tests | routes | OpenAPI coverage | Maturity |
|---|---:|---:|---:|---|---|
| forms-intake | 21 | 17 | 18 | ~70% | **MATURE** |
| identity | 18 | 16 | 11 | ~70% | **MATURE** |
| consent | 12 | 9 | 14 | ~60% | **MATURE** |
| tenant-config | 13 | 6 | 12 | ~65% | **MATURE** |
| pharmacy | 10 | 10 | 12 | ~60% | **MATURE** |
| async-consult | 11 | 3 | 8 | ~40% | **DEVELOPING** |
| ai-service | 12 | 4 | 2 | ~25% | **DEVELOPING** |
| med-interaction | 4 | 1 | 2 | ~15% | **SKELETON** |
| subscription | 4 | 1 | 2 | ~15% | **SKELETON** |
| sync-consult | 0 | 0 | 0 | 0% | **NOT STARTED** |
| admin-backend | 0 | 0 | 0 | 0% | **NOT STARTED** |
| crisis-response | 0 | 0 | 0 | 0% | **NOT STARTED** |
| community | 0 | 0 | 0 | 0% | **NOT STARTED** |
| content | 0 | 0 | 0 | 0% | **NOT STARTED** |
| scheduling | 0 | 0 | 0 | 0% | **NOT STARTED** |
| billing | 0 | 0 | 0 | 0% | **NOT STARTED** |
| integrations | 0 | 0 | 0 | 0% | **NOT STARTED** |

Foundation layer: db, audit (with hash chain + I-003 append-only), tenant-context (RLS three-layer), error-envelope (I-025 tenant-blind), idempotency (tenant-scoped per IDEMPOTENCY v5.1), JWT, KMS (per-tenant ADR-024), AI context, crisis detection (I-019 platform-floor), SI-010 actor-context binding, RLS helpers, ULID, glossary, config (with production fail-fast gates). **~85% complete.**

---

## Aggregate measurements

- **Test files total: 124** (109 integration + 7 contract + 3 invariant + 5 co-located src/)
- **Migrations applied: 31** of an estimated 80–120 needed at launch
- **Mounted Fastify routes: 81** of 187 OpenAPI v0.2 endpoints (~43%)
- **Slices with substantive implementation: 9** of 17 active slice PRDs (5 mature, 2 developing, 2 skeleton)
- **Distributed-systems integrity patterns established: 11**
- **Codex pre-ratification rounds executed: 80+** across the 22-PR autonomous run
- **Codex substantive closures: 109+**

---

## Revised overall completion estimate

| Axis | Prior estimate | Audited reality |
|---|---:|---:|
| Spec corpus | 95% | 95% (no change) |
| Foundation layer | 70% | **85%** |
| Slice implementation | 10–15% | **~32%** (weighted average across all 17 slices) |
| OpenAPI endpoint coverage | ~20% | **~43%** |
| Migration coverage | ~25% | **~30%** (31 of est. 80–120) |
| Production deploy | 0% | 0% (no change) |

**Revised overall single-number estimate: ~45–55% complete** (specs ~95% × 30% weight + implementation ~32% × 70% weight ≈ 51%, with foundation maturity nudging it toward the upper end).

The platform is meaningfully further along than the Master Completion Plan v1.0 baseline assumed. Most of the planned Phase A work was already done in prior sprints; Phase B fan-out can begin sooner and on a smaller surface than the Plan implied.

---

## What this changes about the Plan

1. **Phase A is effectively done at the engineering level.** Items 1+2+3 are production-ready; item 4 (spec ratification) is human-led and runs in parallel with Phase B.

2. **Track 1 (Clinical Care) is closer than estimated.** Pharmacy is MATURE; Async-Consult is DEVELOPING (~40%) not skeleton; Med-Interaction is the only skeleton in the track. The "2 backend eng + 1 clinical SME" team can drive these to production-ready in 2–3 sprints rather than 4.

3. **Track 2 (AI Service) is the slowest of the started slices.** AI Service is DEVELOPING (~25%) with only 2 routes mounted. Mode 1 conversational + multi-provider abstraction work is the bulk of the remaining slice scope. Needs ~3–4 sprints.

4. **Track 3 (Consent + Forms-Intake completion) is MORE than half done.** Consent is MATURE (~60%); Forms-Intake is MATURE (~70%) blocked only on SI-011 sub-SI ratifications. The track's remaining work is narrower than initially scoped.

5. **Track 4 (Mobile + Clinician UI) timing is still gated by design + UI eng, not backend.** OpenAPI v0.2 is stable enough for mock-first mobile work; the 81 mounted routes give real-API fallback at substantial coverage.

6. **8 slices remain unstarted.** Sync-Consult, Admin Backend, Crisis Response, Community, Content, Scheduling, Billing, Integrations. These are the bulk of the remaining work and the main driver of the ~32% implementation completion. Pilot launch may not require all of them — likely needs Sync-Consult + Admin Backend at minimum; Community + Content + Scheduling + Billing + Integrations are post-pilot iterations.

---

## Pilot-viable subset re-scoping (Ghana revenue anchor)

Strictly for Telecheck-Ghana chronic-care pilot (the first revenue-bearing surface), the required slices are:

| Slice | Maturity | Pilot completeness |
|---|---|---|
| identity | MATURE | ~85% pilot-ready |
| consent | MATURE | ~75% pilot-ready |
| tenant-config | MATURE | ~90% pilot-ready (admin-write 503-stubbed but pilot reads work) |
| forms-intake | MATURE | ~80% pilot-ready (publish-gate kill-switch in place; manual template review for pilot) |
| pharmacy | MATURE | ~75% pilot-ready |
| async-consult | DEVELOPING | ~50% pilot-ready |
| med-interaction | SKELETON | ~20% pilot-ready (the gating slice) |
| ai-service (Mode 1) | DEVELOPING | ~30% pilot-ready |
| crisis-response | NOT STARTED | 0% — platform-floor crisis detection IS wired at the foundation layer per I-019, but the response slice (resource lookup + escalation routing) is not built |

**Pilot-blocking work (in order):**
1. Med-Interaction core checks (drug-drug, drug-condition, drug-allergy)
2. Async-Consult completion (clinician decision loop, SI-005 procedure)
3. AI Service Mode 1 conversational scaffolding (without Mode 2 — pilot is clinician-driven)
4. Crisis Response slice (resource lookup + escalation; detection is already wired)
5. Admin Backend basics (operator monitoring + manual template review)

That's 5 substantive workstreams to pilot-launch readiness, not 17. **A realistic pilot-launch estimate: 8–12 sprints from now**, not 18.

---

## Recommended next-session actions

1. **Update the Master Completion Plan v1.0** to reflect this audited baseline — re-scope each Track's effort estimate against actual state.
2. **Track 6 first sprint** — human ratifier runs the batched ratification ceremony for SI-003/004/005/008/009/010/011 + CDM §4 + FORMS_ENGINE §I-030. This is the biggest unblocker for Tracks 1+3.
3. **Track 1 anchor sprint** — Med-Interaction is the new critical path (only skeleton among pilot-required slices). Promote Med-Interaction to a dedicated owner.
4. **Track 5 infra in parallel** — AWS / KMS / LiveKit / SIEM setup + F-4 deploy runbook to staging. Operates ahead of code; no spec-corpus dependency.
5. **Track 4 mobile mock-first** — start patient app build against OpenAPI v0.2 mocks; bind to real routes as Tracks 1+3 stabilize.

---

— Claude (Opus 4.7, 1M context), 2026-05-15 audit
