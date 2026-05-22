# Engineering Review Request — P-042 R2 Decision-Wrapper Idempotency Ordering

**Authoring date:** 2026-05-22
**Workstream:** v1.10 PRD update + post-P-029 SI-spec-first promotion lineage
**Cycle context:** P-042 CDM v1.10 → v1.11 + AUDIT_EVENTS v5.12 → v5.13 + OpenAPI v0.5 → v0.6 + State Machines v1.4 → v1.5 + RBAC v1.4 → v1.5 amendment, R2 Codex adversarial review
**Spec branch:** `spec/p042-cdm-si023-landing`
**Author:** Claude (autonomous workstream operator per Evans's standing directive 2026-05-16+)
**Ratifier needed:** Evans (workstream lead) + Engineering Lead + CDM owner
**Discipline:** Hard-floor item 6 escalation per CLAUDE.md autonomous-work authorization; dual-recommendation + two-pass Codex consult required before ratifier decision per CLAUDE.md commits `f3a6469` + `4f42a00` + subsequent 2026-05-20 codification.

---

## 1. The triggering finding

P-042 v0.2 DRAFT (commit `82b9e16`) closed R1's three findings (Mode 1 view contract + 6 SECDEF bodies inlined + preflight DO block inlined). R2 Codex re-verification surfaced **1 HIGH finding** + flagged it as a hard-floor item 6 trigger:

> [high] Decision wrapper mutates template before durable idempotency reservation (Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_CDM_v1_10_to_v1_11_Amendment.md:798-837)
>
> Inferred from the inlined SQL: `record_forms_template_admin_decision()` records the lifecycle transition, then for `approve` updates `forms_template.status = 'published'`, and only after that attempts to insert the idempotency-key row. If the idempotency insert hits `unique_violation`, the handler raises `40001` after the publish update and audit emission are already part of the same function body. PostgreSQL will roll back the whole transaction only if the caller does not catch the exception, but this spec does not make that rollback boundary explicit and the stated contract is retry safety/idempotency. More importantly, the canonical idempotency pattern should reserve or verify the key before irreversible domain mutation, not after publishing.
>
> Recommendation: Escalate as an architectural-judgment item per hard-floor item 6. Rework the decision wrapper so the idempotency key is reserved/locked before lifecycle transition and template publication, then mark completion after the mutation, or otherwise specify an explicit transactional contract that makes rollback and retry behavior mechanically enforceable.

## 2. Why this is a hard-floor item 6 trigger

The wrapper body at §4.NEW8f of the P-042 amendment is a **verbatim lift from SI-023 v1.0 RATIFIED** (`Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_SI_023_Admin_Backend_Basics_v1_0.md` Sub-decision 4 `record_forms_template_admin_decision`). The SI-023 wrapper body converged through:

- **R1 HIGH-3 closure** — `SELECT...FOR UPDATE` on review row + idempotency-key check + latest-state derivation under lock
- **R2 MED-1 closure** — NOT NULL idempotency_key at wrapper signature + UNIQUE constraint on `admin_template_decision_idempotency_key` (`(tenant_id, review_id, idempotency_key)`)
- **R11 HIGH-1 closure** — shared parent-template `FOR UPDATE` serialization with submit wrapper (Step 0 read template_id → Step 1 parent forms_template FOR UPDATE → Step 2 review row FOR UPDATE)
- **R13 HIGH-2 closure** — explicit `unique_violation` EXCEPTION handler on idempotency-key INSERT; handler re-reads existing row + verifies decision matches + raises retry-safe `serialization_failure` on match OR `idempotency-key-decision-mismatch` on different decision

Codex APPROVED the SI-023 wrapper body at R17 (`Telecheck_SI_023_Admin_Backend_Basics_v1_0.md` HEAD `773af7c`). P-041 ratified the SI on 2026-05-22 via Codex R17 APPROVE + Claude READY-TO-MERGE auto-proceed.

**The P-042 amendment is a MECHANICAL consolidation of SI-023 v1.0 RATIFIED canonical content into bundle files.** Per CLAUDE.md "Hard editing rules":

> **Do NOT silently fork.** When a slice PRD disagrees with CDM / OpenAPI / State Machines, open a Spec Issue (per EHBG §12); do not edit the engineering spec to match the slice.

Reading the inverse direction: a CDM follow-on amendment cycle MUST NOT silently fork from the ratified SI. If the CDM amendment alters the wrapper body shape during the follow-on landing, it creates exactly the drift CLAUDE.md prohibits — the SI says one thing, the CDM/bundle says another.

Codex R2's recommendation — "Rework the decision wrapper so the idempotency key is reserved/locked before lifecycle transition and template publication" — proposes a **net-new amendment to the canonical contract surface** of the SI-023 ratified decision wrapper, which is BEYOND P-042's sub-decision scope. Per CLAUDE.md hard-floor item 6 discriminator (d): "any amendment to a canonical contract surface that the SI under review has not already scoped as a sub-decision" is hard-floor.

This therefore requires **ratifier escalation rather than inline closure**.

## 3. The architectural question

**Is the SI-023 ratified decision wrapper ordering — lifecycle transition INSERT → conditional publish UPDATE → idempotency-key INSERT with `unique_violation` handler — safe under the PostgreSQL semantics SI-023's contract assumes?**

Codex R2 claims it is NOT safe because "a partially handled exception or nonstandard caller transaction can create a user-visible publish attempt with no durable idempotency completion record."

The Claude-side reading of PostgreSQL semantics on the wrapper body:

- The wrapper executes as a SECURITY DEFINER PL/pgSQL function in the caller's transaction.
- The nested `BEGIN ... EXCEPTION WHEN unique_violation THEN ... RAISE EXCEPTION ... END;` block creates an implicit subtransaction (savepoint) around the idempotency-key INSERT.
- On `unique_violation`: the EXCEPTION handler catches it; re-reads existing decision; either RAISES `admin-template-decision-concurrent-same-key-retry-safe` (40001) on match or `idempotency-key-decision-mismatch` (40001) on mismatch.
- The 40001 propagates out of the wrapper.
- **Unless the caller catches the 40001 inside its own savepoint and commits**, the entire wrapper transaction rolls back: the lifecycle transition INSERT, the forms_template.status='published' UPDATE, the `admin.template_review_decision` audit emission, AND the `admin.template_published_via_review_workflow` audit emission are all reverted.
- The canonical caller pattern (per Telecheck's IDEMPOTENCY contract in Contracts Pack v5.3) is: open a SQL transaction → call the wrapper → on exception, ROLLBACK and surface error to the HTTP layer → the HTTP layer treats 40001 as retry-safe and re-issues the request.

Under that canonical caller pattern, the ordering IS safe. Codex's concern about "partially handled exception or nonstandard caller transaction" is contingent on a caller that violates the canonical contract — which is a separate class of defect than the wrapper-body ordering.

The Codex-side reading is that the ordering is **architecturally fragile**: it makes safety dependent on the caller's transactional discipline rather than enforcing safety structurally inside the wrapper. A safer ordering would reserve the idempotency-key row BEFORE the lifecycle transition INSERT and the publish UPDATE, so any subsequent failure rolls back the not-yet-mutated domain state.

Both readings are defensible. The architectural-judgment question is: do we accept the ratified canonical ordering as safe-enough under the canonical caller contract, or do we treat the structural-vs-contractual safety dependency as a defect requiring rework?

## 4. Options

### Option A — Close P-042 R2 with the SI-023 verbatim body; preserve SI-023 ratified architecture

- P-042 v0.3 reverts NO wrapper-body changes; the §4.NEW8f decision wrapper remains an exact verbatim lift of SI-023 v1.0 RATIFIED Sub-decision 4.
- Codex R2's finding documented in the P-042 cycle log as **rejected at ratifier** — the rejected finding is preserved with ratifier's rationale (Codex R2 disagreed with already-ratified SI-023 R1-R17 convergence on wrapper-body shape; the canonical caller-contract makes the ordering safe; restructuring would silently fork P-042 from SI-023 RATIFIED in violation of CLAUDE.md "do not silently fork").
- P-042 closes through standard R3 convergence after acknowledging the rejected finding.
- **Pros:** preserves SI-023 ratified architecture (matches CLAUDE.md "do not silently fork"); honors the R1-R17 SI-023 convergence + the P-041 P-008-class ratification; minimizes scope creep into P-042.
- **Cons:** Codex's structural-vs-contractual safety concern is NOT addressed in spec corpus; if Codex is correct about the architectural fragility, a future cycle will need to reopen the wrapper-body shape and we will have shipped P-042 with the known concern documented as rejected.
- **Net effect on SI-023:** UNCHANGED. SI-023 v1.0 RATIFIED stays at its current shape.

### Option B — Close P-042 R2 with verbatim body + open a Track 6 follow-on hygiene cycle (SI-023 v1.0 → v1.1 amendment)

- P-042 v0.3 reverts NO wrapper-body changes — same as Option A.
- P-042 closes through standard R3 convergence with Codex R2 finding documented as **deferred to Track 6 hygiene cycle**.
- A NEW Track 6 hygiene cycle is opened (SI-024 OR SI-023.1 OR direct v1.1 hygiene-cycle PR per the v1.10.1 precedent) to address the idempotency-ordering architectural concern at the SI-023 source: rework the decision wrapper so idempotency-key INSERT happens BEFORE the lifecycle transition INSERT + publish UPDATE.
- The Track 6 cycle would: (i) draft a v1.1 amendment to SI-023 §4 Sub-decision 4 wrapper body; (ii) re-converge through Codex adversarial review; (iii) ratify via a fresh P-N entry in the Promotion Ledger; (iv) trigger a CDM v1.11 → v1.12 follow-on amendment to land the v1.1 wrapper-body shape into bundle files.
- **Pros:** preserves P-042 scope discipline (no silent fork during the CDM follow-on landing); addresses Codex's structural-vs-contractual safety concern in the proper venue (SI authoring, not CDM follow-on); honors hard-floor item 6 discipline (ratifier-approved escalation rather than inline-amendment); maintains the SI-spec-first promotion pattern.
- **Cons:** delays the architectural fix by one hygiene cycle (1-2 weeks); ships P-042 with the known concern documented but not yet fixed; creates spec-corpus debt that must be paid down before telecheck-app implementation begins.
- **Net effect on SI-023:** open a Track 6 follow-on cycle (post-P-042); v1.0 RATIFIED preserved at current shape; v1.1 amendment in flight.

### Option C — Block P-042 + amend SI-023 RATIFIED inline before P-042 R3

- Pause P-042 R3 convergence.
- Author a hot-fix amendment to SI-023 Sub-decision 4 `record_forms_template_admin_decision` wrapper body restructuring the ordering: idempotency-key INSERT FIRST (under parent-template + review FOR UPDATE locks) → lifecycle transition INSERT → conditional publish UPDATE → audit emissions.
- Re-run Codex adversarial review on the SI-023 amendment until APPROVE.
- Ratify the SI-023 amendment via a P-041a supplemental Promotion Ledger entry (NOT a new P-N entry; treated as an in-flight hot-fix to the just-ratified P-041 ceremony).
- Re-cut P-042 v0.3 lifting the revised SI-023 wrapper body verbatim.
- Resume P-042 R3 Codex convergence with the amended body.
- **Pros:** addresses the architectural concern at the SI-023 source (proper venue); no spec-corpus debt; no Track 6 follow-on cycle needed.
- **Cons:** treats the just-ratified P-041 as still-amendable, which violates the Promotion Ledger immutability convention ("append-only; never edit prior entries"); the P-041 RATIFY commit `b8f12ec` + merge commit `97f5dc5` are already on `main` — amending SI-023 in place would require either (i) a P-041a supplemental entry (which is novel) or (ii) a Track 6 hygiene cycle (which IS Option B); creates ceremony-discipline ambiguity; delays P-042 by 1-2 days for the SI-023 hot-fix cycle.
- **Net effect on SI-023:** v1.0 RATIFIED hot-fixed in place; novel ratification ceremony shape.

## 5. Working recommendations (Claude side)

**Claude's recommendation: Option A.**

Rationale:
1. **CLAUDE.md "do not silently fork" discipline strongly applies.** The P-042 amendment cycle is a MECHANICAL consolidation of SI-023 v1.0 RATIFIED canonical content. Altering the wrapper body during the follow-on landing creates exactly the drift the rule prohibits — the SI would say one thing, the CDM/bundle would say another.

2. **The SI-023 wrapper body converged through 17 Codex rounds** including R1 HIGH-3 + R2 MED-1 + R11 HIGH-1 + R13 HIGH-2 closures specifically on the idempotency + ordering question. R13 HIGH-2 introduced the explicit `unique_violation` EXCEPTION handler that Codex R2 now questions. Codex APPROVED the SI-023 body at R17. P-041 ratified. The architectural decision is settled.

3. **Codex R2's finding is contingent on a caller violating the canonical IDEMPOTENCY contract.** Under the canonical caller pattern (single-transaction call + propagate exceptions → HTTP-layer retry on 40001), the ordering IS safe. If a future cycle wants to make safety **structural** rather than **contractual**, that is a proper Track 6 / SI-023 v1.1 concern — not a P-042 R2 inline closure.

4. **The Promotion Ledger immutability convention disfavors Option C** ("amend the just-ratified SI hot-style"). The convention is for follow-on amendments to land in NEW P-N entries with NEW spec branches, not as in-place hot-fixes to ratified prior entries.

5. **Option B is reasonable as a follow-on path** but adds spec-corpus debt before the pilot implementation begins. Defensible if the ratifier judges the architectural-fragility concern as material.

Recommendation: **Option A** to close R2 with verbatim SI-023 body + documented rejection of Codex R2 finding. If the ratifier deems the architectural concern material, **Option B** is the next-best path (preserves P-042 scope, defers to proper venue). **Option C** is not recommended due to ceremony-discipline novelty + Promotion Ledger immutability tension.

---

## 6. Ratifier decision

**[ ] Option A** — Close P-042 R2 with verbatim body; preserve SI-023 ratified architecture; document Codex R2 rejection in cycle log.

**[ ] Option B** — Close P-042 R2 with verbatim body; open Track 6 follow-on hygiene cycle for SI-023 v1.0 → v1.1 amendment.

**[ ] Option C** — Block P-042 + hot-fix SI-023 RATIFIED in place; novel P-041a supplemental ratification.

**Ratifier decision date:** ________________
**Ratifier signature(s):** ________________

---

## 7. Post-decision action steps

**If Option A chosen:**
1. P-042 v0.3 DRAFT: cycle log entry recording R2 finding as **rejected at ratifier** with rationale.
2. Re-run Codex R3 Codex adversarial review on v0.3.
3. Continue P-042 convergence to APPROVE.
4. P-042 ratification ceremony per established post-P-029 SI-spec-first pattern.

**If Option B chosen:**
1. Same as Option A for P-042 v0.3 — cycle log entry records R2 finding as **deferred to Track 6 cycle**.
2. Open Track 6 follow-on cycle spec branch (`spec/si-023-v1-1-decision-wrapper-idempotency-reordering` OR similar).
3. Track 6 cycle authors SI-023 §4 Sub-decision 4 v1.1 amendment.
4. Codex adversarial review on Track 6 cycle until APPROVE.
5. Promotion Ledger P-N entry for the Track 6 cycle.
6. Subsequent CDM follow-on amendment cycle (CDM v1.11 → v1.12) lands the v1.1 wrapper body.

**If Option C chosen:**
1. Pause P-042 R3.
2. Author SI-023 §4 Sub-decision 4 wrapper-body restructuring as a hot-fix amendment.
3. Codex adversarial review on the SI-023 hot-fix until APPROVE.
4. Promotion Ledger P-041a supplemental entry.
5. Re-cut P-042 v0.3 lifting revised body.
6. Resume P-042 R3 convergence.
