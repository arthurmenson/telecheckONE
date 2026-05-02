# Phase 0 Walk — Calendar Invitation (paste-ready)

## Subject line

> **[Telecheck v1.10] Phase 0 Walk — matrix ratification + Phase 1 unblock — 90 min**

## Body

Hi all,

We're convening the Phase 0 walk for the Telecheck v1.10 PRD update workstream. Pre-execution staging is complete: planning freeze v1.4 is Phase-0-ready (Codex 4-cycle convergence), the C7 forward-compatibility bundle is matrix-commit-ready (Codex 4-cycle convergence), ADR-027 + ADR-028 are Phase-4-baseline-ready (Codex 5-cycle convergence), and the 108-row matrix is pre-staged with C7 rows + scope-reconciliation rows + DIC fold-in row + Dependency Tags column + Status dropdown including `Revalidation required` + suggested 2nd approvers in Notes for 20 audit-B single-owner rows.

This walk's job is to **ratify the pre-staging** and unblock Phase 1. Total walk time ~90 minutes.

**Required attendees:**

- Evans (Product Lead, workstream lead) — **chair**
- Engineering Lead
- Clinical Safety Officer
- Privacy Officer
- Regulatory Affairs Lead
- Country Launch Director
- Design Lead
- Marketing Lead
- Legal

**Pre-walk reading** (~30 min, required):

1. `Telecheck_v1_10_Planning_Freeze.md` v1.4 — execution plan
2. `Phase0_Walk_Packet_2026-04-30.md` — 11-step agenda + exit-criteria checklist
3. `Tier2_Matrix_Row_Additions_DRAFT.md` v1.3 — C7 row additions (already in matrix)
4. `Telecheck_PRD_v1_10_Traceability_Matrix.xlsx` — open to Matrix tab; review rows 92–108 (the new ones) and the audit-B pairing suggestions in Notes column
5. Pick of: `Telecheck_ADR_027_*_DRAFT.md` v0.5, `Telecheck_ADR_028_*_DRAFT.md` v0.4 (your area of focus)

**Walk agenda** (per `Phase0_Walk_Packet_2026-04-30.md` §3):

1. Open and orient (5 min)
2. **BLOCKER: Audit-B owner pairing per I-015** — confirm 20 suggested 2nd approvers (20 min)
3. Verify C7 row additions (10 min)
4. Reconcile 7 scope-reconciliation rows (20 min)
5. Verify dependency tags (5 min)
6. Normalize edit-type vocabulary (5 min)
7. Verify Status dropdown (1 min)
8. Lock final matrix row count (1 min)
9. Calendar dual-control review sessions (10 min)
10. Fire Codex Phase 0 exit review (5 min wall; ~30 min background)
11. Phase 0 exit declaration (2 min)

**Exit criteria** (per planning freeze v1.4 §3 Phase 0 + §7):

- [ ] All 20 audit-B single-owner rows have validated owner pair (I-015)
- [ ] All 7 scope-reconciliation items confirmed or closed OOS
- [ ] DIC v1.0 fold-in row dependency-linked from Phase 5.6 + Phase 6
- [ ] High-risk rows carry dependency tags
- [ ] Edit-type vocabulary normalized
- [ ] Status dropdown active with 6 values
- [ ] Final row count locked
- [ ] Codex adversarial review on Phase 0 outputs returns no HIGH-severity findings

**Async option for owner-pairing ratification:**

If a 90-min synchronous walk is hard to convene, the audit-B pairing ratification (step 2 above) can run as an **async ballot**: each owner reviews the 20 suggested pairs in `Phase0_Audit_B_Pairing_Ballot.md` (companion artifact) and replies "ratify" or "amend with proposed alternate." Items with full ratification advance to Approved status; amendments queue for a 30-min sync mini-walk to resolve. This is the lowest-friction path if the full convening is hard to schedule.

**After Phase 0 exit:**

Phase 1 begins immediately (1 day estimated): F13 Glossary drafts (already authored at `Phase1_Glossary_Drafts_DRAFT.md`) park at "Edited" status; F02 ADR Set index entries for ADR-027/028/029 land. Final glossary approval moves to Phase 2.X reconciliation per planning freeze §3 Phase 1 ordering rule.

**Codex adversarial review** auto-fires at Phase 0 exit per CLAUDE.md autoinvocation cadence. HIGH findings, if any, force Phase 0 back to in-progress until cleared.

— Evans
