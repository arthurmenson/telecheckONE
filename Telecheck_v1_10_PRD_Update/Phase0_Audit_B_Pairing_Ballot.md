# Phase 0 Audit-B Pairing Ratification Ballot

**Purpose:** Async-ratify the 20 suggested 2nd approvers for audit-B single-owner rows, unblocking Phase 0 exit per I-015 dual-control invariant.

**How to use:** Each named approver reviews their assigned rows below and replies "ratify" or "amend: <proposed alternate>" by [DEADLINE — Evans to fill in]. Full ratification advances those rows to Approved; amendments queue for a 30-min sync mini-walk.

**Pairing rules** (per planning freeze v1.4 §3 Phase 0):

- Engineering-led contracts (F38, F39, F40, F10, F19, F41) → Engineering + Product Lead
- Product-led Registry rows → Product Lead + Engineering Lead
- Master PRD §10.5 program catalog → Product Lead + Clinical Lead
- Clinical Safety Officer rows → Clinical Safety Officer + Product Lead
- Country Launch Director rows → Country Launch Director + Product Lead
- Design Lead row → Design Lead + Product Lead

---

## The 20 rows requiring ratification

### Group 1 — Engineering Lead as 2nd approver (3 rows)

Asks Engineering Lead to ratify these as 2nd approver.

| Row | Change | File | Currently | Suggested final pair |
|---|---|---|---|---|
| 3 | C1 §21 Non-goals — ADR Set update | F02 (Telecheck_ADR_Set_v1_0.md) | Product Lead | Product Lead + Engineering Lead |
| 16 | C2 Emerging-markets reframe — Registry | F59 (Telecheck_Artifact_Registry_v2_9.md) | Product Lead | Product Lead + Engineering Lead |
| 25 | C3 Brand structure — Registry | F59 | Product Lead | Product Lead + Engineering Lead |
| 81 | C5 Research data — Registry | F59 | Product Lead | Product Lead + Engineering Lead |
| 90 | C6 Program catalog — Registry | F59 | Product Lead | Product Lead + Engineering Lead |

**☐ Engineering Lead: ratify all 5  ☐ amend specific rows: ___________**

### Group 2 — Product Lead as 2nd approver on Engineering-led rows (8 rows)

Asks Product Lead to ratify themselves as 2nd approver on Engineering-led contracts/specs.

| Row | Change | File | Currently | Suggested final pair |
|---|---|---|---|---|
| 27 | C3 Brand structure — CDM | F38 (Telecheck_Canonical_Data_Model_v1_2.md) | Engineering | Engineering + Product Lead |
| 28 | C3 Brand structure — OpenAPI | F40 (Telecheck_OpenAPI_v0_2.md) | Engineering | Engineering + Product Lead |
| 31 | C3 Brand structure — Tenant Threading Addendum | F48 | Engineering | Engineering + Product Lead |
| 65 | C5 Research data — Domain Events | F10 | Engineering | Engineering + Product Lead |
| 66 | C5 Research data — Types | F19 | Engineering | Engineering + Product Lead |
| 70 | C5 Research data — CDM | F38 | Engineering | Engineering + Product Lead |
| 71 | C5 Research data — State Machines | F39 | Engineering | Engineering + Product Lead |
| 72 | C5 Research data — System Architecture | F41 | Engineering Lead | Engineering Lead + Product Lead |
| 74 | C5 Research data — OpenAPI | F40 | Engineering | Engineering + Product Lead |

**☐ Product Lead: ratify all 9  ☐ amend specific rows: ___________**

### Group 3 — Design Lead pairing (1 row)

| Row | Change | File | Currently | Suggested final pair |
|---|---|---|---|---|
| 33 | C3 Brand structure — Design System | F54 (Telecheck_Design_System_v1_1.md) | Design Lead | Design Lead + Product Lead |

**☐ Design Lead: ratify  ☐ amend: ___________**
**☐ Product Lead: ratify  ☐ amend: ___________**

### Group 4 — Clinical Safety Officer pairing (1 row)

| Row | Change | File | Currently | Suggested final pair |
|---|---|---|---|---|
| 54 | C4 Marketing posture — Invariants | F16 (Telecheck_Contracts_Pack_v5_00_INVARIANTS.md) | Clinical Safety Officer | Clinical Safety Officer + Product Lead |

**☐ Clinical Safety Officer: ratify  ☐ amend: ___________**
**☐ Product Lead: ratify  ☐ amend: ___________**

### Group 5 — Country Launch Director pairing (2 rows)

| Row | Change | File | Currently | Suggested final pair |
|---|---|---|---|---|
| 55 | C4 Marketing posture — OR Tracker | F58 (Telecheck_Operational_Readiness_Todo_v1_5.md) | Country Launch Director | Country Launch Director + Product Lead |
| 56 | C4 Marketing posture — Cockpit | F33 (Telecheck_Market_Rollout_Cockpit_Slice_PRD_v1_0.md) | Country Launch Director | Country Launch Director + Product Lead |

**☐ Country Launch Director: ratify both  ☐ amend specific rows: ___________**

### Group 6 — Master PRD §10.5 program catalog (1 row, Clinical Lead pairing)

| Row | Change | File | Currently | Suggested final pair |
|---|---|---|---|---|
| 82 | C6 Program catalog — Master PRD §10.5 | F01 (Telecheck_Master_Platform_PRD_v1_9.md) | Product Lead | Product Lead + Clinical Lead |

**☐ Product Lead: ratify  ☐ amend: ___________**
**☐ Clinical Lead: ratify  ☐ amend: ___________**

### Group 7 — Forms Engine slice (1 row)

| Row | Change | File | Currently | Suggested final pair |
|---|---|---|---|---|
| 88 | C6 Program catalog — Forms Engine | F30 (Telecheck_Forms_Intake_Engine_Slice_PRD_v2_1.md) | Product Lead | Product Lead + Engineering |

**☐ Product Lead: ratify  ☐ amend: ___________**
**☐ Engineering Lead: ratify (as Engineering rep)  ☐ amend: ___________**

---

## Total ratification count needed

20 row-level approvals (some rows count once per approver; total signatures = ~30 across the 7 groups). Once all are "ratify" or amendments resolved, all 20 rows transition from "Not started" to "Approved" with the final pair recorded in Approval Owner column. Phase 0 BLOCKER per I-015 clears.

## Submission

Reply to this ballot with your group's results. Evans collates and updates the matrix in-place (Approval Owner column). Codex Phase 0 exit review fires after final ratification.

**Deadline:** [Evans to fill]
**Collation owner:** Evans
**Final apply target:** Matrix .xlsx, column J (Approval Owner), rows 3, 16, 25, 27, 28, 31, 33, 54, 55, 56, 65, 66, 70, 71, 72, 74, 81, 82, 88, 90.
