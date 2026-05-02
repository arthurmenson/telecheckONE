# v1.10 Planning Freeze — Codex Adversarial Review (Pre-Phase-0)

**Review date:** 2026-04-29
**Reviewer:** Codex (gpt-5.5 via OpenAI Codex CLI v0.125.0, ChatGPT-account auth)
**Invocation:** Direct `codex exec` with adapted adversarial framing piped via stdin. The plugin's `/codex:adversarial-review` working-tree scope exhausted the context window on the full repo (~14MB across spec bundle + design system + v1.10 folder); this run scoped strictly to `Telecheck_v1_10_Planning_Freeze.md` (~36KB) with the planning freeze treated as locked input.
**Tokens used:** 17,735
**Companion artifact:** [Adversarial_Review_Findings.md](Adversarial_Review_Findings.md) (Claude's prior review of the matrix, 2026-04-28). This file is a separate delta — focused on the planning freeze itself rather than the matrix.

**Bottom line:** Broad sequencing (Master PRD → contracts → slices) is directionally sound. Weak points are premature upstream approval, missing revalidation/rework loop, and a self-contradictory classification of Adversarial Review Finding 3. **9 findings (4 HIGH, 3 MEDIUM, 2 LOW)** — all addressable as targeted patches before Phase 0 walk; not a structural rewrite.

---

## HIGH

### 1. Phase 1 is ordered before its source of truth exists, creating canonical drift risk.

§3, Phase 1 says: *"These edits are the foundation everything else references. Land them first."* It then requires F13 Glossary to *"Add new entries from C1, C3, C4, C5 in one pass."*

But §3, Phase 2 says: *"The Master PRD is the apex of the cascade. Every slice PRD and contract references it. Edit Master PRD source first, then cascade."*

Those two statements conflict. The glossary is being treated as foundational, but many glossary definitions depend on Master PRD language that is not canonical until Phase 2, especially "Posture A / Posture B," "research data partnership," "consumer DBA," "two business lines," and "harm-reduction marketing posture." If Phase 2 edits change the wording, scope, or placement, Phase 1 can become stale immediately.

This is not just a sequencing nit. The plan explicitly allows Phase 1 to approve definitions before the canonical Master PRD exists. That violates the stated apex model in Phase 2.

**Recommended patch:** split Phase 1 into placeholders only, or move final glossary approval after Phase 2. Glossary entries can be drafted early, but should not be approved until Master PRD §7, §10, §13, §15, §21, and §X are canonical.

### 2. Finding 3 is incorrectly marked deferred despite being a Phase 0 exit prerequisite.

§5 says: *"Adversarial Review Findings 3, 4, 8, 9… Address during matrix walk; not blocking v1.10 execution."*

But §3, Phase 0 requires: *"Pair audit-B rows with single owners to designate the second approver per I-015,"* and its exit criteria say: *"Matrix has zero rows with status 'Not started' that lack a validated owner pair for audit-B items."*

That makes Finding 3 blocking for Phase 0 completion. The document cannot simultaneously say audit-B owner pairing is a Phase 0 exit criterion and "not blocking v1.10 execution." If 24 audit-B rows still need pairing decisions, Phase 0 cannot complete until they are resolved.

This is a hard invariant breach against I-015. The plan should remove Finding 3 from deferred scope and classify it as a Phase 0 blocker.

### 3. DIC v1.0 fold-in is structurally missing and should be patched before Phase 0 walk.

The document does mention F49 Design Implementation Contract in §3, Phase 5.6:

> "F49 (Design Implementation Contract) — required design-file content updated…"

But it does not mention DIC v1.0 promotion, fold-in, source status, version bump, or whether Evans's Option B 2026-04-28 changes are part of the canonical matrix. That is a structural omission if DIC v1.0 is externally agreed as part of the v1.10 corpus.

This matters because §6 sends operations artifacts to Phase 6 only after all PRD/spec edits. If DIC v1.0 promotion is not represented in the matrix, registry, active index, promotion ledger, or boot sequence, then the final "v1.10 LOCKED" state can falsely complete without the design contract being canonical.

**Recommended patch:** add DIC v1.0 fold-in explicitly to Phase 0 validation and Phase 6 promotion artifacts. At minimum, Phase 0 should verify whether F49 row(s) exist in the 90-row matrix and whether Evans's Option B is represented as a dependency or source decision.

### 4. Sign-off gates leak stale-approved rows; there is no rework/revalidation loop.

§7 requires: *"All 90 matrix rows reach status 'Approved'."* It also requires *"All cross-references resolve."*

But there is no rule for what happens when an approved upstream row is invalidated by a downstream edit. Example: Phase 1 glossary is approved, then Phase 2 Master PRD changes terminology. Or Phase 3 contracts are approved, then Phase 4 ADR text introduces a new activation requirement. Or Phase 5 slices reveal that Master PRD §10.5 cross-reference language is incomplete.

The status model appears monotonic: rows move to Approved and stay there. There is no "Needs rework," "Stale due to downstream change," "Reapproved after dependency change," or dependency-triggered revalidation.

This is a major gate defect because §3 admits dependencies are implicit: *"some rows must be approved before others can begin."* If dependencies are real, approval must be invalidatable. Otherwise §7 can pass with internally stale approvals.

**Recommended patch:** add a revalidation rule: any edit to a row that is depended on by approved downstream rows forces dependent rows into "Revalidation required," and any downstream edit that changes canonical terminology or behavior forces upstream glossary/Master/ADR references back through review.

---

## MEDIUM

### 5. The dependency graph is too coarse and hides circular dependencies between Master PRD, ADRs, contracts, and glossary.

§6 shows Phase 2 before Phase 3 and Phase 4 in parallel after Phase 2. But Phase 2 contains references to ADR-028 and ADR-027 before those ADRs exist:

- §3, Phase 2.14 says Research Data Governance should *"Cross-reference to ADR-028."*
- §3, Phase 2.12 and 2.13 add C4/C5 principles that depend on ADR semantics.
- §3, Phase 1 says ADR Set index points to ADRs that *"don't exist yet."*

The plan assumes placeholders are acceptable, but §7 later requires all cross-references resolve. That part is fine eventually, but the phase ordering means Phase 2 approval may happen against placeholder ADRs whose final wording lands in Phase 4. If ADR authoring changes activation requirements, consequences, or scope, the Master PRD approval is stale.

**Recommended patch:** either author ADR drafts before final Master PRD approval, or split Phase 2 into draft application and post-ADR reconciliation.

### 6. The 90-row / 44-file scope claim is unverifiable from this document and likely under-enumerated.

§1 claims: *"Total scope: 90 rows across 44 files."* §8 references the matrix as the authoritative source. But the freeze document itself does not enumerate 44 files or map 90 rows to phases. The listed phase file IDs are partial and non-contiguous.

Obvious risk areas that appear affected but are not clearly enumerated as work items:

- **Consent Slice** is referenced in ADR-028 references, but only F28 "Consent & Delegated Access Slice" is listed. If those are different artifacts, one is missing.
- **AI Slice** is referenced in §5 deferred decisions: *"Cross-mode AI data flow… Open per AI Slice §15 Q6,"* but no AI Slice update is listed despite §13 AI/clinical autonomy being changed.
- **Country regulatory contracts** are referenced as activation mechanisms for ADR-027, but no regulatory contract artifact is listed.
- **Pharmacy Council guidance documentation** is referenced in ADR-027, but no artifact update is listed.
- **DSA template** is a pre-launch decision and activation requirement, but no actual DSA template artifact is listed in new artifacts.
- **REC/IRB engagement** is a dependency, but no REC/IRB artifact or owner deliverable is listed beyond Master PRD wording.
- **DIC v1.0 fold-in** is absent as noted in Finding 3 above.

The plan may still match the matrix, but this document alone does not substantiate the 44-file / 90-row claim. For a freeze artifact, that is a material control gap.

### 7. Finding 9, depends-on tracking, is deferred even though the plan relies on implicit dependencies.

§3 says: *"The matrix has 90 rows, but they have an implicit ordering."* §5 says Finding 9, "depends-on tracking," is deferred to the walk and *"not blocking v1.10 execution."*

That is inconsistent. If row dependencies are implicit, the plan cannot reliably enforce sequencing, stale-row revalidation, or sign-off invalidation. This directly affects §7 gates.

Depends-on tracking does not have to be perfect before editing starts, but Phase 0 should not exit without at least dependency tagging for high-risk rows: glossary, Master PRD §10.5, Research Data Governance §X, ADR-027, ADR-028, contracts, F41 System Architecture, F48 Tenant Threading, F49 DIC, registry/index/ledger.

---

## LOW

### 8. Finding 4 is probably safe to handle in Phase 0, but not safe to leave as generally "deferred."

§3, Phase 0 includes *"Normalize edit-type vocabulary."* That directly addresses Finding 4. But §5 also lists Finding 4 under deferred and "not blocking v1.10 execution."

This is less severe than Finding 3 because vocabulary normalization is not necessarily a product invariant. Still, if edit-type is used to drive reviewer expectations, audit category, or sign-off workflow, it should be Phase 0 exit-controlled. The current wording weakens that control.

### 9. Findings 7 and 8 cannot be fully assessed from this document.

§8 says findings *"3, 4, 7, 8, 9 deferred to walk,"* while §5 lists *"3, 4, 8, 9"* and omits 7. That discrepancy is itself a control issue: the freeze document disagrees with itself about which findings are deferred.

Without the content of Finding 7, this review cannot validate whether it is blocking Phase 0. Finding 8 is described as "'tenant' terminology sweep," which seems material because C3 is the largest cascade and because tenant terminology is central to locked decisions in §2.1 and §2.4. It may not block the first walk, but it should not remain loosely deferred after Phase 0.

---

## Sound dimensions

The broad top-level sequencing of Master PRD before contracts/slices is directionally sound. Phase 2 before Phase 3 and Phase 5 makes sense because contracts and slices should resolve against the canonical PRD.

The weak point is not the general cascade shape; it is premature approval of upstream artifacts before their canonical sources exist, plus the absence of dependency-based revalidation once downstream edits expose stale assumptions.

---

## Severity-rolled summary

| # | Finding | Severity | Recommended action |
|---|---|---|---|
| 1 | Phase 1 (glossary) ordered before Master PRD canonical | **HIGH** | Split Phase 1 to drafts only; final approval after Phase 2 |
| 2 | Finding 3 (audit-B pairing) self-contradictorily deferred | **HIGH** | Reclassify as Phase 0 blocker |
| 3 | DIC v1.0 fold-in structurally missing | **HIGH** | Add to Phase 0 validation + Phase 6 promotion |
| 4 | Sign-off gates leak — no rework/revalidation loop | **HIGH** | Add "Revalidation required" status + dependency-triggered rework rule |
| 5 | Phase 2 references ADR-027/028 before Phase 4 authors them | MEDIUM | Author ADR drafts before final Master PRD approval, or split Phase 2 |
| 6 | 90-row / 44-file scope claim unverifiable; 7 missing items flagged | MEDIUM | Phase 0 walk reconciles freeze enumeration vs matrix |
| 7 | Finding 9 (depends-on tracking) deferred despite implicit dependencies | MEDIUM | Phase 0 minimum: dependency tagging for high-risk rows |
| 8 | Finding 4 (edit-type vocab) listed both as Phase 0 work and deferred | LOW | Reconcile §3 / §5 wording |
| 9 | §5 vs §8 disagree on which findings are deferred (Finding 7 mismatch) | LOW | Reconcile §5 and §8 |

**Total estimated patch effort:** 1–2 hours of structured editing on the planning freeze (or treatment as a delta to be incorporated during Phase 0 walk per Path 1 — see CLAUDE.md v1.10 workstream rules).

---

## Document control

- **v1.0 — 2026-04-29** — Initial Codex adversarial review of the v1.10 planning freeze. Pre-Phase-0 sanity check; first successful Codex run on this workstream after auth + context-window troubleshooting.
- **Companion artifacts:** Telecheck_v1_10_Planning_Freeze.md (the input under review); Adversarial_Review_Findings.md (Claude's prior review of the matrix, 2026-04-28); Telecheck_PRD_v1_10_Traceability_Matrix.xlsx (the matrix this review's findings would patch into).
- **Status:** All 4 HIGH and 3 MEDIUM findings incorporated into Planning Freeze v1.1 (2026-04-29) per Evans's directive 2026-04-29. LOW findings 8, 9 also reconciled. See Planning Freeze v1.1 §9 doc-control for the patch-by-patch changelog. This delta artifact is preserved as the audit trail of what was patched and why; it is not part of the canonical spec bundle.
