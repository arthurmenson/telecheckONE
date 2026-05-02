# Codex Phase 3 GROUP-3 Review — 2026-05-01

**Review fired:** 2026-05-01 (Phase 3 — Contracts Pack edits, group 3 of 3)
**Reviewer:** Codex (gpt-5.5 via OpenAI Codex CLI v0.125.0)
**Scope:** 4 contracts — DOMAIN_EVENTS + FORMS_ENGINE + MARKET_LAUNCH + GOVERNANCE_CONTROLS (v5.1 → v5.2; MARKET_LAUNCH v5.0 → v5.1)
**Cycles:** 2 (v0.1 initial fire + v0.2 verification)

---

## Bottom line (verbatim, v0.2)

> "All v0.2 findings are closed. No new HIGH/MEDIUM found across `DOMAIN_EVENTS`, `FORMS_ENGINE`, `MARKET_LAUNCH`, or `GOVERNANCE_CONTROLS`. ... Bottom line: yes, all 4 group-3 contracts are ready for matrix advance."

**🟢 STATUS: 0 HIGH / 0 MEDIUM. PHASE 3 GROUP-3 CLOSED.**

---

## v0.1 fire — findings

> **HIGH-1 — FORMS_ENGINE I-030 under-enforced.** Static analysis only rejects L3/L4 dependencies on `research_consent_status`. I-030 also prohibits care-touching `BranchingLogic`, intake-flow gating, surface visibility, and copy variation. Patch to reject L2 branching and any patient-facing/care-delivery form rule dependency, except rendering the research-consent block itself from CCR state.
>
> **HIGH-2 — MARKET_LAUNCH research `active` gate is incomplete.** The 5-condition gate misses explicit de-identification-engine readiness and 5th-consent-tier/text deployment. That could let a market enter `active` while export machinery or consent text is not actually ready. Add DSA permitted-domain subset + `k_min_required >= CCR k_min_default` checks too.
>
> **MEDIUM-1 — DOMAIN_EVENTS consent payloads do not fully mirror AUDIT_EVENTS §5.** Export events are mostly aligned, but consent domain events lack audit fields such as `consent_type`, `version_presented`, and for revocation `scope` / `asymmetric_retraction_acknowledgment`.
>
> **MEDIUM-2 — MARKET_LAUNCH marketing gate is compressed too far.** Evidence + approved copy + triple signoff is close, but should explicitly include required Tier-2 regulatory/Pharmacy Council evidence where applicable and Country Launch Director activation signoff.
>
> **MEDIUM-3 — GOVERNANCE_CONTROLS incident semantics need one alignment pass.** "completion event MUST NOT emit" conflicts with the group-1 wording that completion records completion-time drift before invalidation. Define a clear failed/invalidated audit path, likely `signal_enforcement_trigger` plus no `research.export_completed`.

## v0.2 patches applied

**HIGH-1:** Static analysis at form-version-publish time now rejects 6 categories of dependency on `research_consent_status` — L2 BranchingLogic, L3 Eligibility, L4 ApprovalGovernance, L1 PresentationContent variation (except the consent block itself), intake-flow gating, surface visibility. Single permitted dependency: rendering the research-consent block from CCR state per condition 1.

**HIGH-2:** Activation gate expanded from 5 to 11 conditions: added DSA permitted-domain subset check (DSA cannot exceed country domain scope per ADR-028 Decision §6); `k_min_required >= CCR k_min_default` check; 5th consent tier deployment verification (consent text rendered + Forms Engine I-030 compliance); de-identification engine readiness (4-layer pipeline operational); audit pipeline at `high_pii` sensitivity verified per I-031; Country Launch Director activation sign-off (separate from quad sign-off).

**MEDIUM-1:** Added `consent_type`, `version_presented` to both consent events; added `scope` and `asymmetric_retraction_acknowledgment` to revoke event. Payload now mirrors AUDIT_EVENTS v5.2 §5 fully.

**MEDIUM-2:** Marketing activation gate expanded from 3 to 6 conditions: added Tier-2 regulatory evidence requirement (Pharmacy Council guidance for Ghana; analogous bodies for future markets); Country Launch Director activation sign-off; AUDIT_EVENTS marketing surface event emission paths operational.

**MEDIUM-3:** Incident response audit-path discipline section added — `research.export_completed` MAY emit with violated state recorded + `status = invalidated`; concurrent `signal_enforcement_trigger` Category B audit captures enforcement action. Bare suppression of completion event forbidden — silent invalidation is an audit gap per I-003. All 4 incident types reworded to align.

## v0.2 verification — clearance reasoning (verbatim)

> "All v0.2 findings are closed. No new HIGH/MEDIUM found across `DOMAIN_EVENTS`, `FORMS_ENGINE`, `MARKET_LAUNCH`, or `GOVERNANCE_CONTROLS`. One non-blocking cleanup: line 24 still says `research_export.delivered` is not emitted when conditions fail, while line 133 allows audit `research.export_completed` with `status = invalidated`. This is acceptable because domain delivered and audit completed are distinct, but a clarifying sentence would prevent future misread."

**Action taken on LOW non-blocking clarification:** Applied. The `research_export.delivered` row's Notes field now explicitly distinguishes the domain event (delivery did not occur → not emitted) from the audit-side `research.export_completed` event (MAY emit with `status = invalidated` to record the attempted-and-failed completion).

## Convergence trajectory — Phase 3 group-3

| Cycle | Findings | Action |
|---|---|---|
| v0.1 (initial fire) | 2 HIGH (FORMS_ENGINE I-030 under-enforcement; MARKET_LAUNCH research active gate incomplete) + 3 MEDIUM (DOMAIN_EVENTS consent payload incomplete; MARKET_LAUNCH marketing gate compressed; GOVERNANCE_CONTROLS incident semantics conflict) | All 5 patched |
| **v0.2 (verification fire)** | **0 HIGH / 0 MEDIUM. CLOSED.** + 1 LOW clarification | LOW applied |

Faster convergence than groups 1 and 2 (2-cycle vs 3-cycle) — group-3 patches landed cleanly without re-introducing inconsistencies on the v0.2 round.

## Matrix update applied

5 contract rows advanced from "Not started" → **Approved**:

| Row | File | Cycle | Edit Type |
|---|---|---|---|
| 63 | FORMS_ENGINE | C5 | Reference update — research consent integration |
| 65 | DOMAIN_EVENTS | C5 | New entry — 4 research events + 2 marketing events |
| 68 | GOVERNANCE_CONTROLS | C5 | New section — research export CONFIG/INCIDENT/SIGNAL + PolicyAuthorization placeholder |
| 83 | FORMS_ENGINE | C6 | Reference update — Master PRD §10.5 cross-reference |
| 84 | MARKET_LAUNCH | C6 | Reference update + activation gates — ADR-027 (6 conditions) + ADR-028 (11 conditions) |

Sentinel row 109 updated. Cumulative matrix progress: 29 Approved, 3 Edited, 75 Not started, 1 None.

## Phase 3 status

All 3 contract groups closed. Total Phase 3 progress:

- **Group 1** (INVARIANTS + AUDIT_EVENTS + WORKLOAD_TAXONOMY + AUTONOMY_LEVELS) — 6 matrix rows, 3-cycle convergence
- **Group 2** (TYPES + CCR_RUNTIME + GLOSSARY + AI_LAYERING) — 7 matrix rows, 3-cycle convergence
- **Group 3** (DOMAIN_EVENTS + FORMS_ENGINE + MARKET_LAUNCH + GOVERNANCE_CONTROLS) — 5 matrix rows, 2-cycle convergence
- **Total**: 18 contract rows Approved + 4 F13 glossary rows from Phase 2.X = 22 contract-related rows

ERROR_MODEL and IDEMPOTENCY require no v1.10 edits per matrix scan (no rows targeting them).

## Phase 3 EXIT review next

Per planning freeze §3 Phase 3 exit criteria, fire Codex Phase 3 EXIT review on the full Contracts Pack v1.10 set. Expected pattern: surface any cross-contract drift, any HIGH/MEDIUM that was missed in per-group reviews, any inconsistency between the contract deltas and the canonicalized Master PRD v1.10.

## Document control

- **v1.0 — 2026-05-01** — Codex Phase 3 group-3 review across 4 contracts. 2-cycle convergence: v0.1 (2 HIGH + 3 MEDIUM) → v0.2 (0 HIGH + 0 MEDIUM, CLOSED) + LOW clarification applied. 5 matrix rows advanced to Approved.
- **Companion artifacts:** `Phase3_Group3_Contracts_v1_10_Edits_2026-05-01.md` (delta artifact, v0.2 + LOW clarification patched).
- **Status:** Delta artifact. **Phase 3 group-3 CLOSED.** Phase 3 EXIT review pending.
