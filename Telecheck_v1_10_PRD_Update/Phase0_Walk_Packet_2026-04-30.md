# v1.10 Cycle — Phase 0 Walk Packet

**Walk date:** TBD (calendar with stakeholders)
**Workstream lead:** Evans (Product Lead)
**Adversarial reviewer:** Codex (autoinvoked at Phase 0 exit per CLAUDE.md cadence)
**Walk duration estimate:** 90–120 minutes
**Output:** Phase 0 exit-ready matrix; commit to v1.10 cycle Phase 1 work

---

## 1 · Pre-walk reading (required, ~30 minutes)

Walk participants must read these before convening:

1. **[Telecheck_v1_10_Planning_Freeze.md](Telecheck_v1_10_Planning_Freeze.md) v1.3** — top-to-bottom execution plan (Phase-0-ready per Codex 2026-04-29). Pay particular attention to §3 Phase 0, §5 scope handling, §7 sign-off gates with Revalidation rule.
2. **[Codex_Adversarial_Review_2026-04-29_v1_3_verification.md](Codex_Adversarial_Review_2026-04-29_v1_3_verification.md)** — confirms planning freeze v1.3 is Phase-0-ready.
3. **[Tier2_Matrix_Row_Additions_DRAFT.md](Tier2_Matrix_Row_Additions_DRAFT.md) v1.3** — C7 forward-compatibility row additions (10 rows) already pre-staged in matrix.
4. **[Codex_Tier2_v1_3_Verification_2026-04-29.md](Codex_Tier2_v1_3_Verification_2026-04-29.md)** — confirms C7 v1.3 ready for matrix commit.
5. **The pre-staged matrix:** [Telecheck_PRD_v1_10_Traceability_Matrix.xlsx](Telecheck_PRD_v1_10_Traceability_Matrix.xlsx) — open it before the walk; familiarize with the new rows (92–108) and the suggested 2nd-approver notes on rows 3, 16, 25, 27, 28, 31, 33, 54, 55, 56, 65, 66, 70, 71, 72, 74, 81, 82, 88, 90.

**Optional pre-reads (referenced during walk):**

- [Telecheck_ADR_027_Country_Conditional_DTC_Marketing_DRAFT.md](Telecheck_ADR_027_Country_Conditional_DTC_Marketing_DRAFT.md) — ADR-027 v0.1 draft authored as Phase 4 prep
- [Telecheck_ADR_028_Research_Data_Partnership_Posture_A_DRAFT.md](Telecheck_ADR_028_Research_Data_Partnership_Posture_A_DRAFT.md) — ADR-028 v0.1 draft authored as Phase 4 prep
- [Phase1_Glossary_Drafts_DRAFT.md](Phase1_Glossary_Drafts_DRAFT.md) — F13 glossary entries (37 terms) drafted as Phase 1 prep, parked at "Edited"

---

## 2 · Required attendees

Per planning freeze v1.3 §3 Phase 0:

| Role | Required for | Coverage |
|---|---|---|
| **Product Lead (Evans)** | Workstream lead; majority of Audit-B sign-offs | All rows |
| **Engineering Lead** | Audit-B sign-off on contracts, CDM, OpenAPI, state machines, system architecture | Engineering-led contracts (F08, F09, F10, F12, F14, F16, F17, F19), F38, F39, F40, F41, F48 |
| **Clinical Safety Officer** | Audit-B sign-off on AI-LAYERING, AUTONOMY_LEVELS, INVARIANTS, ADR-029, ADR-027/028 | F09, F-NEW-AL, F16, F-NEW-ADR-029, F-NEW-ADR-027 (drafted), F-NEW-ADR-028 (drafted) |
| **Privacy Officer** | Audit-B sign-off on AUDIT_EVENTS, GOVERNANCE_CONTROLS, ADR-028, research-data-related rows | F08, F14, F-NEW-ADR-028, all C5 rows |
| **Regulatory Affairs Lead** | Audit-B sign-off on §21 non-goals, ADR-027 marketing posture, country regulatory rows | F01 (§21), F-NEW-ADR-027, F-NEW-CRC, F-NEW-PCG, F-NEW-DSA |
| **Country Launch Director** | Audit-B sign-off on OR Tracker rows, Cockpit rows, country-conditional activation | F58, F33 |
| **Design Lead** | Audit-B sign-off on Design System and DIC fold-in | F54, F49 |
| **Marketing Lead** | Glossary review (terminology); marketing copy governance lead designation | F13 (when reconciliation lands at Phase 2.X) |
| **Legal** | DSA template review; consent text review | F-NEW-DSA, Master PRD §15.2 |
| **Codex** | Autoinvoked adversarial review at Phase 0 exit | Bash invocation at end of walk |

---

## 3 · Walk agenda (sequence the activities)

### 3.1 · Open and orient (5 min)

- Confirm attendees + roles
- Confirm walk lead (Evans)
- Confirm scribe / matrix-mutation operator (recommend Evans owns the matrix .xlsx; another participant can take meeting notes)
- Read aloud: planning freeze v1.3 status (Phase-0-ready) + C7 v1.3 status (matrix-commit-ready). Codex convergence trajectory: planning freeze 9 → 4 → 0; C7 15 → 7 → 1 → 0.

### 3.2 · BLOCKER: Audit-B owner pairing per I-015 (20 min)

The matrix has **20 audit-B single-owner rows** that must be paired before Phase 0 can exit. Each row already has a suggested 2nd approver in its Notes column (italicized: "[Phase 0 suggested 2nd approver per I-015 — confirm at walk: <name>; final pair: <pair>]").

**Walk step:** read each row's Change Name, current owner, and suggested 2nd approver. Confirm or override. Update Approval Owner column in-place to the final pair.

| Row | Change | File ID | Current Owner | Suggested 2nd | Final pair (confirm at walk) |
|---|---|---|---|---|---|
| 3 | C1 §21 Non-goals — ADR Set update | F02 | Product Lead | Engineering Lead | Product Lead + Engineering Lead |
| 16 | C2 Emerging-markets reframe — Registry | F59 | Product Lead | Engineering Lead | Product Lead + Engineering Lead |
| 25 | C3 Brand structure — Registry | F59 | Product Lead | Engineering Lead | Product Lead + Engineering Lead |
| 27 | C3 Brand structure — CDM | F38 | Engineering | Product Lead | Engineering + Product Lead |
| 28 | C3 Brand structure — OpenAPI | F40 | Engineering | Product Lead | Engineering + Product Lead |
| 31 | C3 Brand structure — Tenant Threading Addendum | F48 | Engineering | Product Lead | Engineering + Product Lead |
| 33 | C3 Brand structure — Design System | F54 | Design Lead | Product Lead | Design Lead + Product Lead |
| 54 | C4 Marketing posture — Invariants | F16 | Clinical Safety Officer | Product Lead | Clinical Safety Officer + Product Lead |
| 55 | C4 Marketing posture — OR Tracker | F58 | Country Launch Director | Product Lead | Country Launch Director + Product Lead |
| 56 | C4 Marketing posture — Cockpit | F33 | Country Launch Director | Product Lead | Country Launch Director + Product Lead |
| 65 | C5 Research data — Domain Events | F10 | Engineering | Product Lead | Engineering + Product Lead |
| 66 | C5 Research data — Types | F19 | Engineering | Product Lead | Engineering + Product Lead |
| 70 | C5 Research data — CDM | F38 | Engineering | Product Lead | Engineering + Product Lead |
| 71 | C5 Research data — State Machines | F39 | Engineering | Product Lead | Engineering + Product Lead |
| 72 | C5 Research data — System Architecture | F41 | Engineering Lead | Product Lead | Engineering Lead + Product Lead |
| 74 | C5 Research data — OpenAPI | F40 | Engineering | Product Lead | Engineering + Product Lead |
| 81 | C5 Research data — Registry | F59 | Product Lead | Engineering Lead | Product Lead + Engineering Lead |
| 82 | C6 Program catalog — Master PRD §10.5 | F01 | Product Lead | Clinical Lead | Product Lead + Clinical Lead |
| 88 | C6 Program catalog — Forms Engine | F30 | Product Lead | Engineering | Product Lead + Engineering |
| 90 | C6 Program catalog — Registry | F59 | Product Lead | Engineering Lead | Product Lead + Engineering Lead |

**Exit criterion (BLOCKER):** Every row above has Approval Owner showing 2 names. Phase 0 cannot exit until this is true for all 20 rows. **This is I-015 invariant compliance, not optional.**

### 3.3 · Verify C7 row additions (rows 92–101, 10 rows) (10 min)

Walk participants confirm C7 rows are appropriate for inclusion in v1.10. Each has been Codex-verified ready for matrix commit (4 review cycles).

**Walk step:** scroll through rows 92–101 in the .xlsx; confirm:
- Change ID = C7 ✓
- Edit Description matches C7 v1.3 framing
- Approval Owner pairs are appropriate
- Audit Cat = B (with one C: row 101 / T2-R10 slice terminology refresh)
- Status = Not started
- Dependency Tags populated

If any participant raises a substantive concern, capture as Notes + flip Status → Revalidation required + queue for follow-up. Otherwise, leave Not started; the rows are committed to v1.10 scope.

### 3.4 · Reconcile 7 scope-reconciliation rows (rows 102–108) (20 min)

Per Codex Adversarial Review MEDIUM-6 + planning freeze v1.3 §3 Phase 0, walk participants reconcile each of the 7 scope-reconciliation rows. For each, decision is one of:

- **Confirm** (verify the row is correct as drafted; leave as Not started; commit to v1.10 scope)
- **Replace** (substitute a different row that better captures the work; explain in Notes)
- **Close as out-of-scope** (mark Notes "OUT OF SCOPE for v1.10 per Phase 0 walk; rationale: <text>"; flip Status → Approved as a closure marker)

| Row | Change | File ID | Item | Decision (walk fills in) |
|---|---|---|---|---|
| 102 | C5 | F28 | Consent Slice update for ADR-028 (5th consent tier) | ☐ Confirm  ☐ Replace  ☐ Close OOS |
| 103 | C7 | F22 | AI Slice §13 alignment with §13.6 + §13.7 | ☐ Confirm  ☐ Replace  ☐ Close OOS |
| 104 | C4 | F-NEW-CRC | Country Regulatory Contracts artifact | ☐ Confirm  ☐ Replace  ☐ Close OOS |
| 105 | C4 | F-NEW-PCG | Pharmacy Council Guidance reference | ☐ Confirm  ☐ Replace  ☐ Close OOS |
| 106 | C5 | F-NEW-DSA | DSA Template artifact | ☐ Confirm  ☐ Replace  ☐ Close OOS |
| 107 | C5 | F-NEW-REC | REC/IRB Engagement deliverable | ☐ Confirm  ☐ Replace  ☐ Close OOS |
| 108 | C3 | F49 | DIC v1.0 → v1.1 fold-in (Evans Option B) | ☐ Confirm (recommended — already authorized) |

**Note on row 108 (DIC fold-in):** This is per Evans's 2026-04-28 Option B directive (already authorized). Recommend Confirm without further debate; the row captures what's already decided. Discussion at walk should focus on whether scope is correctly scoped (matrix row + Phase 5.6/F49 + Phase 6 promotion artifacts), not whether to do it.

**Exit criterion:** Every scope-reconciliation row has a confirmed decision (Confirm / Replace / Close OOS). Final matrix row count locks at this point.

### 3.5 · Verify dependency tags on high-risk rows (5 min)

Walk participants spot-check the new Dependency Tags column (column O). Pre-staged with high-risk row markers per planning freeze §3 Phase 0:

- Glossary (F13) — high-risk
- Master PRD §10.5 / §X — high-risk
- ADR-027 / ADR-028 (F-NEW-ADR-XXX) — high-risk
- Contracts (F08, F09, F10, F12, F14, F16, F17, F19) — high-risk
- F38 CDM, F39 State Machines, F40 OpenAPI — high-risk
- F41 System Architecture — high-risk
- F48 Tenant Threading Addendum — high-risk
- F49 DIC — high-risk
- F59 Registry, F60 Active Document Index, F61 Promotion Ledger — high-risk

**Walk step:** confirm tags are correctly populated on all rows where these file IDs appear. If any high-risk row is missing a tag, fix in-place. If any non-high-risk row has a tag, remove (or refine to a less-strong dependency descriptor).

**Exit criterion:** Phase 0 dependency tagging coverage matches the planning freeze §3 list.

### 3.6 · Normalize edit-type vocabulary (Adversarial Review Finding 4) (5 min)

The matrix currently has 12 distinct edit-type strings. Planning freeze v1.3 §3 Phase 0 requires normalization to a controlled vocabulary of 7:

**Approved values:**
- Reference update
- New entry
- New section
- Section rewrite
- Terminology rewrite
- Verification only
- New file authoring

**Walk step:** confirm the controlled vocabulary. Run a find/replace on Edit Type column G:
- "New entries" → "New entry" (8 rows)
- "Terminology rewrite (selective)" → "Terminology rewrite" (9 rows)
- "Brand framing + tenant identifier rename + uniform naming" → "Section rewrite" (1 row, row noting C3)
- "New section / reframe" → "Section rewrite" (1 row)
- "New section + rewrite" → "Section rewrite" (1 row)
- "New section + multiple updates" → "Section rewrite" (1 row, including C7 T2-R06)
- "No edit" → "Verification only" (1 row)

After normalization, all 14 columns have controlled vocabulary; no idiosyncratic types remain.

**Exit criterion:** Edit Type column has only the 7 approved values (or NULL for non-edit rows; should be none).

### 3.7 · Verify Status dropdown (1 min)

Confirm Status column M has the dropdown with 6 values (added to validation when matrix was pre-staged):

- Not started
- In progress
- Edited
- Reviewed
- Approved
- Revalidation required

**Walk step:** click any cell in column M; confirm dropdown appears. If a participant cannot see the dropdown in their copy of the file, advise them to open the file in Excel (or LibreOffice 7+); some Google Sheets imports drop validation.

### 3.8 · Lock final matrix row count (1 min)

After §3.4 closures, count the active rows (those not closed as out-of-scope):

- Baseline: 90 rows
- C7 additions: +10 rows
- Scope-reconciliation: +7 rows minus any closed as out-of-scope

**Walk step:** announce the final row count. This is the Phase 0 exit-locked count per planning freeze v1.2 row-count rule. All future references to "v1.10 matrix scope" use this number.

### 3.9 · Calendar dual-control review sessions (10 min)

For each high-risk row that requires dual-control review beyond the matrix walk's confirmation, schedule the review session.

**Walk step:** for each row in the new C7 + scope-reconciliation set that is audit-B (most of them), confirm review session timing. Recommend:
- Phase 1 glossary final approval session (Phase 2.X reconciliation) — 1 hour, Master PRD §13 must be canonical first
- Phase 3.X contract review session — 2 hours, contracts approved per dual-control
- Phase 4 ADR-027 / ADR-028 final acceptance session — 1 hour, after Phase 2 ends
- Phase 5 slice + spec review session — 2 hours
- Phase 6 promotion ceremony — 1 hour with all hands

Calendar these now to lock people's schedules.

### 3.10 · Codex adversarial review at Phase 0 exit (5 min wall-clock; ~30 min Codex runtime in background)

Per CLAUDE.md autoinvocation directive, Codex review fires at every phase exit. Phase 0 exit triggers a Codex adversarial review of the final-state matrix + planning freeze + C7 bundle.

**Walk step:** Evans (or an authorized session) runs:

```bash
node "C:/Users/menso/.claude/plugins/cache/openai-codex/codex/1.0.4/scripts/codex-companion.mjs" adversarial-review \
  "--background --scope working-tree Telecheck_v1_10_PRD_Update/ Phase 0 exit verification: confirm the matrix mutations applied during the walk match the planning freeze v1.3 Phase 0 exit criteria. Check audit-B owner pairings, scope reconciliation closures, dependency tagging, edit-type normalization, Status dropdown, final row count. Flag any HIGH-severity findings that require Phase 0 to remain in-progress."
```

**Exit criterion (per planning freeze §7 sign-off gates):** Codex returns no HIGH-severity findings. If HIGH findings, Phase 0 returns to in-progress; address findings; re-fire Codex; repeat until clean.

### 3.11 · Phase 0 exit declaration (2 min)

If all exit criteria are satisfied (per §3.2, §3.4, §3.5, §3.6, §3.7, §3.8, §3.10), Evans declares Phase 0 closed. Update planning freeze v1.3 §3 Phase 0 exit criteria checkboxes (in markdown source, on a v1.4 hotfix). Phase 1 work can begin.

---

## 4 · Phase 0 exit criteria checklist

Per planning freeze v1.3 §3 Phase 0 exit criteria (tightened per v1.1 patch):

- [ ] Matrix has zero rows with status "Not started" that lack a validated owner pair for audit-B items (per Finding 3 / I-015) — **§3.2**
- [ ] All 7 scope-reconciliation items either have matrix rows or are explicitly closed as out-of-scope with rationale in matrix Notes — **§3.4**
- [ ] DIC v1.0 fold-in row exists in the matrix and is dependency-linked from Phase 5.6 and Phase 6 — **row 108 confirmed in §3.4**
- [ ] High-risk rows carry dependency tags — **§3.5**
- [ ] Edit-type vocabulary is normalized — **§3.6**
- [ ] Status dropdown active with 6 values — **§3.7**
- [ ] Final row count locked — **§3.8**
- [ ] Codex adversarial review on Phase 0 outputs returns no HIGH-severity findings — **§3.10**

**Exit declared by:** Evans (workstream lead). Recorded in matrix Notes column on row 1 or in a Notes/Status worksheet.

---

## 5 · Phase 1 kickoff (post-Phase-0)

Once Phase 0 exits, Phase 1 work begins:

1. **F13 Glossary drafts** — already authored at [Phase1_Glossary_Drafts_DRAFT.md](Phase1_Glossary_Drafts_DRAFT.md). Phase 1 imports these into the F13 contract, parks at "Edited" status. Final approval moves to Phase 2.X reconciliation per planning freeze v1.1 patch.
2. **F02 ADR Set index** — placeholder entries for ADR-027, ADR-028, ADR-029. Authored alongside the actual ADR drafts ([ADR-027 DRAFT](Telecheck_ADR_027_Country_Conditional_DTC_Marketing_DRAFT.md), [ADR-028 DRAFT](Telecheck_ADR_028_Research_Data_Partnership_Posture_A_DRAFT.md), [ADR-029 DRAFT](Telecheck_ADR_029_AI_Workload_Taxonomy_DRAFT.md)) which are Phase 4 prep but baselined at Phase 4 entry per planning freeze v1.3 §3 Phase 4 two-stage activation.

**Phase 1 expected duration:** 1 day per planning freeze (drafts only; no approvals).

**Codex review fires at Phase 1 exit** per autoinvocation directive.

---

## 6 · Workstream telemetry

| Metric | Value |
|---|---|
| Cycle started | 2026-04-28 |
| Phase 0 walk date | TBD |
| Final v1.10 matrix row count | TBD (after §3.8 lock; estimated 100–107) |
| Estimated v1.10 cycle duration (Phase 0 → v1.10 LOCKED) | ~2-3 weeks structured editing per planning freeze §1, plus Phase 0 walk + dual-control review sessions |
| Adversarial review reviewer | Codex (gpt-5.5 via OpenAI Codex CLI v0.125.0; autoinvoked at every phase/milestone exit) |
| Codex review cycles to date | 8 (Planning Freeze: 4; C7 Tier 2: 4) |
| Codex convergence to date | 9 → 4 → 0 (planning freeze); 15 → 7 → 1 → 0 (C7 Tier 2) |
| Workstream lead | Evans (Product Lead) |
| Spec bundle status | FINAL US REGION BASELINE locked at v1.9; v1.10 lands on promotion |

---

## 7 · References

- **Planning Freeze v1.3:** [Telecheck_v1_10_Planning_Freeze.md](Telecheck_v1_10_Planning_Freeze.md)
- **Codex review series (planning freeze):** [v1.0](Codex_Adversarial_Review_2026-04-29.md), [v1.1](Codex_Adversarial_Review_2026-04-29_v1_1_verification.md), [v1.2](Codex_Adversarial_Review_2026-04-29_v1_2_verification.md), [v1.3 final](Codex_Adversarial_Review_2026-04-29_v1_3_verification.md)
- **C7 Tier 2 bundle:** [Tier2_Matrix_Row_Additions](Tier2_Matrix_Row_Additions_DRAFT.md), [WORKLOAD_TAXONOMY](Telecheck_Contracts_Pack_v5_00_WORKLOAD_TAXONOMY_DRAFT.md), [AUTONOMY_LEVELS](Telecheck_Contracts_Pack_v5_00_AUTONOMY_LEVELS_DRAFT.md), [ADR-029](Telecheck_ADR_029_AI_Workload_Taxonomy_DRAFT.md)
- **Codex review series (C7):** [v1.0 PreCommit](Codex_Tier2_PreCommit_Review_2026-04-29.md), [v1.1](Codex_Tier2_v1_1_Verification_2026-04-29.md), [v1.2](Codex_Tier2_v1_2_Verification_2026-04-29.md), [v1.3 final](Codex_Tier2_v1_3_Verification_2026-04-29.md)
- **Phase 4 prep (parallel-track):** [ADR-027 DRAFT](Telecheck_ADR_027_Country_Conditional_DTC_Marketing_DRAFT.md), [ADR-028 DRAFT](Telecheck_ADR_028_Research_Data_Partnership_Posture_A_DRAFT.md)
- **Phase 1 prep (parallel-track):** [Phase1_Glossary_Drafts_DRAFT.md](Phase1_Glossary_Drafts_DRAFT.md)
- **Pre-staged matrix:** [Telecheck_PRD_v1_10_Traceability_Matrix.xlsx](Telecheck_PRD_v1_10_Traceability_Matrix.xlsx) (108 rows, 15 columns; Status dropdown active; Dependency Tags column populated for high-risk rows; suggested 2nd approvers in Notes)
- **Companion HTML preview:** [Telecheck_Master_Platform_PRD_v1_10_Preview_PostDraft_2026-04-29.html](Telecheck_Master_Platform_PRD_v1_10_Preview_PostDraft_2026-04-29.html) (preview supplement showing PostDraft additions §27)
- **CLAUDE.md** at project root — Codex autoinvocation directive + workstream lead designation

---

## 8 · Document control

- **v1.0 — 2026-04-30** — Phase 0 walk packet authored as Phase 0 prep per Evans's directive 2026-04-30. Composes pre-walk reading list, attendee roles, agenda steps, exit criteria checklist, post-walk Phase 1 kickoff, and full reference index. Walk date TBD.
- **Status:** Walk-ready. Open the matrix .xlsx + planning freeze v1.3 in parallel during the walk; check off exit criteria as each agenda step completes.
- **Owner:** Evans (workstream lead). Modify as needed before convening; freeze for the actual walk.
