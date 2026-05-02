# v1.10 Planning Freeze v1.1 — Codex Verification Pass

**Review date:** 2026-04-29 (second pass)
**Reviewer:** Codex (gpt-5.5 via OpenAI Codex CLI v0.125.0, ChatGPT-account auth)
**Invocation:** Direct `codex exec` with stdin pipe; fed both the v1.0 Codex review and the v1.1 patched planning freeze.
**Tokens used:** 23,326
**Companion artifacts:** [Codex_Adversarial_Review_2026-04-29.md](Codex_Adversarial_Review_2026-04-29.md) (v1.0 review). This file is the verification pass on the v1.1 patches.

**Bottom line (verbatim):** *"v1.1 should not proceed directly to Phase 0 walk as-is. Most prior HIGH/MEDIUM findings are closed or materially improved, but v1.1 introduced control issues around row-count stability, ADR draft gate consistency, and the scope of dependency-triggered revalidation. These are small v1.2 patches, not a structural rewrite, but they should be fixed before Phase 0 starts so the walk is not reconciling contradictions in the control document itself."*

**Status of original 9 findings:** 7 CLOSED, 2 PARTIAL. **NEW issues introduced by v1.1:** 5 (all small, control-document hygiene).

---

## Verification of prior findings

### 1. Phase 1 glossary ordered before source of truth exists — CLOSED

v1.1 directly changes Phase 1 to "glossary drafts only" and moves final approval to Phase 2.X. See §3 Phase 1:

> "Phase 1 produces glossary drafts only, not approved canonical entries."

And §3 Phase 2.X:

> "return to F13 Glossary drafts… reconcile every entry against canonical Master PRD wording. Approve final F13 entries here, not in Phase 1."

This closes the original canonical drift concern.

### 2. Finding 3 audit-B pairing incorrectly deferred — CLOSED

v1.1 reclassifies audit-B owner pairing as a Phase 0 blocker. See §3 Phase 0:

> "BLOCKER… Phase 0 cannot exit until every audit-B row has a validated owner pair."

The exit criteria also require:

> "Matrix has zero rows with status 'Not started' that lack a validated owner pair for audit-B items."

§5 also removes Finding 3 from deferred scope. This closes the contradiction.

### 3. DIC v1.0 fold-in structurally missing — CLOSED

v1.1 adds DIC fold-in in all required control points:

- §3 Phase 0: DIC v1.0 fold-in validation.
- §3 Phase 5.6: F49 DIC v1.0 → v1.1 promotion.
- §3 Phase 6: Registry, Active Document Index, Promotion Ledger P-008, Boot Sequence.
- §7: explicit DIC promotion sign-off gate.

This closes the structural omission.

### 4. No rework / revalidation loop — CLOSED

v1.1 adds a non-monotonic workflow in §7:

> "Approved → Revalidation required"

Triggers include upstream dependency edits, downstream changes to canonical terminology/scope/behavioral contracts, and later HIGH Codex findings. Reapproval requires the same dual-control owners.

This is enough to close the original stale-approved-row defect.

### 5. Phase 2 references ADRs before ADRs exist — PARTIAL

v1.1 improves this by requiring ADR-027 and ADR-028 drafts before relevant Phase 2 sections reach Approved. See §3 Phase 2 prerequisites and §6 dependency graph.

**Residual gap:** the required ADR drafts need only "Status, Context, Decision, and Consequences" by Phase 2 exit, while ADR-028's most operationally sensitive content includes "Activation requirements," "Posture A scope," and references. §3 Phase 2 says activation requirements, consequences, and scope must be drafted before approval, but the Phase 2 exit criteria only require Status, Context, Decision, and Consequences. That creates an internal mismatch.

So the patch addresses the main placeholder-ADR problem, but it leaves ambiguity over whether activation requirements and scope are hard Phase 2 approval prerequisites.

### 6. 90-row / 44-file scope claim unverifiable and likely under-enumerated — PARTIAL

v1.1 adds a Phase 0 scope reconciliation step naming the seven missing-risk items. See §3 Phase 0:

> "Verify the matrix actually contains rows for these 7 items…"

And §3 Phase 0 exit criteria require each item to have a row or explicit out-of-scope rationale.

**Residual gap:** §1 still states "90 rows across 44 files" as if fixed, but §3 Phase 0 now allows adding missing rows. §8 also says v1.1 patches require "add 7 scope-reconciliation rows," which would likely change the 90-row count unless existing rows already cover them. The document does not explain whether the scope remains 90 rows after reconciliation or becomes 90 plus any missing rows.

The original unverifiability is reduced, but the patched document introduces a row-count consistency problem.

### 7. Finding 9 dependency tracking deferred despite implicit dependencies — CLOSED

v1.1 reclassifies dependency tracking into Phase 0 high-risk dependency tagging. See §3 Phase 0:

> "Dependency tagging for high-risk rows…"

And §3 Phase 0 exit criteria:

> "High-risk rows carry dependency tags."

§5 also says Finding 9 is "NOT deferred." This closes the prior inconsistency at the planning-freeze level.

### 8. Finding 4 edit-type vocabulary both Phase 0 and deferred — CLOSED

v1.1 removes Finding 4 from the deferred list and keeps it as Phase 0 work. See §3 Phase 0:

> "Normalize edit-type vocabulary…"

And §5:

> "NOT deferred… Finding 4…"

This closes the §3 / §5 contradiction.

### 9. §5 vs §8 mismatch on deferred findings — CLOSED

v1.1 reconciles §5 and §8 to say only Adversarial Review Findings 7 and 8 remain deferred to the walk. See §5 and §8.

This closes the document-control mismatch from v1.0.

---

## New issues introduced by v1.1

### N1. Scope count is now internally unstable

§1 still says "90 rows across 44 files," but §3 Phase 0 says to add rows if any of seven scope-reconciliation items are missing. §8 goes further and says v1.1 patches require "add 7 scope-reconciliation rows."

If those rows are added, the corpus is no longer 90 rows. If they already exist, §8 should not say to add them. v1.1 needs a rule: either preserve 90 by confirming existing rows, or bump the row count after Phase 0 reconciliation.

### N2. ADR draft gate is inconsistent

§3 Phase 2 prerequisites require ADR drafts to include "activation requirements, consequences, and scope." But Phase 2 exit criteria require only "Status, Context, Decision, and Consequences."

That weakens the very control added to close Finding 5. Activation requirements and scope should be explicit Phase 2 approval prerequisites, especially for ADR-027/028.

### N3. "Frozen" status conflicts with Phase 0 row/schema mutation

The header says Status: Frozen, but v1.1 instructs Phase 0 to add matrix rows, add dependency tags, add a new status value, and possibly patch missing scope rows. That may be acceptable if only the planning document is frozen, but the document describes the whole execution plan as frozen while allowing structural changes to the matrix.

This needs cleaner language: planning freeze is frozen; matrix remains live and mutable under Phase 0 controls.

### N4. Revalidation rule depends on dependency tags that are only required for high-risk rows

§7 says upstream dependency edits can trigger revalidation "per Phase 0 dependency tags." But §3 Phase 0 only requires dependency tags for high-risk rows, not all 90 rows.

That means non-tagged rows can still become stale without a deterministic trigger. The patch closes the highest-risk version of the problem, but the new workflow overstates coverage unless it says dependency-triggered revalidation is guaranteed only for tagged rows, with manual review for the rest.

### N5. §5 still says Findings 7 and 8 are "Out of scope / Deferred" while also saying they are addressed during matrix walk and slice edits

§5 lists "Adversarial Review Findings 7, 8 only" under "Out of scope for v1.10 / Deferred," but the text says they are "addressed during matrix walk and slice edits." That is not cleanly out of scope. Finding 8's tenant terminology sweep also appears materially within Phase 5.1 and Phase 5.7.

This is less severe than the old Finding 3/Finding 4 contradiction, but v1.1 still blurs deferred-vs-in-scope handling for Findings 7 and 8.

---

## Severity-rolled summary

| # | Finding/Issue | Status | Recommended v1.2 patch |
|---|---|---|---|
| 1 | Phase 1 glossary ordering | CLOSED | None |
| 2 | Finding 3 (audit-B pairing) classification | CLOSED | None |
| 3 | DIC v1.0 fold-in | CLOSED | None |
| 4 | Revalidation loop | CLOSED | None |
| 5 | ADR ordering | PARTIAL | Phase 2 exit criteria — promote "activation requirements + scope" to hard prerequisites |
| 6 | Scope row-count | PARTIAL | §1 + §8 — explicit rule on whether 90 stays fixed or becomes post-Phase-0 count |
| 7 | Implicit dependencies | CLOSED | None |
| 8 | Finding 4 contradiction | CLOSED | None |
| 9 | §5/§8 mismatch | CLOSED | None |
| N1 | Row count instability | NEW | Same as #6 above |
| N2 | ADR draft gate inconsistency | NEW | Same as #5 above |
| N3 | "Frozen" vs matrix mutation | NEW | Header + §1 — split planning-freeze frozen from matrix live |
| N4 | Revalidation coverage overstated | NEW | §7 — dependency-triggered revalidation explicitly tagged-rows-only; manual review for rest |
| N5 | §5 deferred-vs-in-scope blur | NEW | §5 — split "Truly out of scope" from "Deferred to walk (will be addressed in cycle)" |

**Effort to v1.2:** ~30 minutes of focused editing on the planning freeze. No architectural rework; pure control-document hygiene.

---

## Document control

- **v1.0 — 2026-04-29** — Verification pass on Planning Freeze v1.1. Confirms 7 of 9 prior findings closed, 2 partial; flags 5 new issues introduced by v1.1 patches. Bottom line: needs v1.2 small patches before Phase 0 walk.
- **Companion artifacts:** Codex_Adversarial_Review_2026-04-29.md (v1.0 review of the original planning freeze v1.0); Telecheck_v1_10_Planning_Freeze.md (the v1.1 document under verification, in-place edited; v1.2 patches incoming).
- **Status:** All 2 PARTIAL closures and all 5 new issues (N1–N5) incorporated into Planning Freeze v1.2 (2026-04-29) per Evans's directive 2026-04-29. See Planning Freeze v1.2 §9 doc-control for the patch-by-patch changelog. This delta artifact is preserved as the audit trail. v1.2 verification pass to follow.
