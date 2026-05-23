# Agentic Workforce Architecture — Ratifier-Ready Synthesis Recommendation

**Date:** 2026-05-23
**For:** Evans (ratifier)
**Decision class:** Hard-floor item 6 (platform-floor architectural decision)
**Source artifacts:**
- Design doc: `Telecheck_Agentic_Workforce_Architecture_v0_1_DRAFT.md` v0.2 (post Codex Pass-1 + Pass-2)
- Claude recommendation: `Agentic_Workforce_Claude_Recommendation_2026-05-23.md`
- Codex Pass-1 output: captured tail in chat (Option B+ verdict; 2 BLOCKING findings)
- Codex Pass-2 prompt: `Codex_Pass2_Prompt_AgenticWorkforce_2026-05-23.md`
- Codex Pass-2 output: captured tail in chat (Option B+ verdict reinforced; explicit patch-design-first directive)

## Three-way recommendation table

| Reviewer | Verdict | Key conditions |
|---|---|---|
| **Claude** | Option B (3-agent pilot) | Optimistic locking + 7-agent topology + multi-LLM Codex SPOF fallback + Engineering Lead delegation + Codex pre-approval on CRs + daily S3 snapshot |
| **Codex Pass-1 (independent)** | Option B+ | Append-only event log replaces multi-writer JSON; hard-stop expansion gates; severity-weighted defect metrics; tested rollback runbook; already-ratified narrow slice for first pilot |
| **Codex Pass-2 (synthesis)** | Option B+ | Same as Pass-1 + explicit directive: PATCH the design doc with concurrency model + hard-stop gates BEFORE surfacing ratifier-ready recommendation |

## Convergence

All three reviewers agree on:
- **Pilot-first.** Do NOT bootstrap full 8-agent workforce immediately. Validate convergence mechanics on smaller scope first.
- **Architectural patches required.** The v0.1 design's canonical.json multi-writer model is unsafe; rollback/success criteria are too weak.
- **Eventual full workforce.** After pilot validates, expand to 7-8 agents.
- **Option C (single-Claude + humans) is too slow** to fix the underlying bottleneck without parallelizing repos.

Pass-2 reconciled Claude's optimistic-locking mitigation into Codex's stronger append-only event log architecture — Codex's design subsumes Claude's (append-only naturally eliminates concurrent-write conflict). Net synthesis is Codex's architecture + Claude's operational mitigations.

## Final synthesized recommendation: **Option B+ executed against patched v0.2 design**

### What this means concretely

**Bootstrap path (Day 1–14 pilot):**

1. **Day 1–3:** Build the canonical event log + projection service + Orchestrator agent + Spec Corpus agent + bootstrap 1 implementation repo for the pilot slice.
2. **Day 4:** Bootstrap 1 implementation agent (Claude embedded in the pilot repo) + run rollback runbook dry-run on test bench.
3. **Day 5–14:** Pilot agent ships PRs on the chosen narrow slice. Daily metrics captured in canonical event log: throughput, Codex APPROVE rate, defect escapes, hard-stop gate triggers.
4. **Day 14:** Evaluation. If ALL 10 success criteria met AND ZERO hard-stop gates fired → expansion authorized to 7-8 agents (Week 3+). Else: retrospective + adjust + re-pilot or pivot.

**First-pilot-slice (must be already-ratified narrow slice with no open spec prereqs):**

Top candidate per Codex Pass-1 + Pass-2 criteria: **Forms/Intake Templates HTTP/Admin JWT slice.** Already-ratified spec; modest scope; AUDIT_EVENTS catalog already enumerates the action IDs; no fail-closed wrapper blockers; exercises canonical event log + cross-agent message flow + Codex review path.

Med-Interaction Sprint 2 is **NOT** the right pilot slice (Codex Pass-1 explicitly flagged this — `medication_interaction.*` AUDIT_EVENTS catalog amendment is pending; using Med-Int forces a spec-prereq dependency the pilot is supposed to be free of).

### What changed from Claude's original Option B to the synthesized Option B+

| Element | Claude original | Codex Pass-1/2 added | Net Option B+ |
|---|---|---|---|
| canonical.json concurrency | optimistic locking + version field | append-only event log + materialized projection | append-only event log (Codex's subsumes Claude's) |
| First-pilot-slice | Med-Interaction Sprint 2 | already-ratified narrow slice; Med-Int blocked by AUDIT_EVENTS pending amendment | Forms/Intake Templates HTTP/Admin JWT (top candidate) |
| Success criteria | 8 criteria | 2 added (defect escape rate, severity-weighted defect score) | 10 criteria |
| Failure response | "failure on 2+ triggers adjustment" | hard-stop expansion gates: 7 specific triggers that freeze expansion immediately | 7 hard-stop gates added |
| Rollback | "daily canonical.json S3 snapshot" | full rollback runbook + 3 consolidation paths + Day-0 dry-run | tested rollback runbook (3 paths: partial / full / pivot-to-humans) |
| Codex SPOF | multi-LLM fallback | workforce-pause-on-Codex-down ≤ 72h policy + multi-LLM fallback | combined |
| Cost analysis | $300k–550k/yr | likely 1.5–2x understated | $500k–800k/yr realistic |
| Topology Day 1 | 7 agents (merge QA into Orchestrator) | unchanged | 7 agents Day 1, split to 8 when scope demands |

## Auto-proceed check

**Claude's recommendation:** Option B with mitigations.
**Codex Pass-2 (canonical):** Option B+ with the patched v0.2 design + Forms/Intake Templates as first pilot slice.

**Agreement on next concrete step:** Yes, with one clarification — Codex Pass-2 explicitly required patching the design doc FIRST (now done in v0.2 commit `e65885d`). Both reviewers now agree the next step is **Evans ratifies Option B+ + Day 1–3 deliverables begin.**

**Hard-floor item 6 precedence:** This is a platform-floor architectural decision. Auto-proceed rule does NOT override the floor. Evans's chat-message ratification is required before Day 1–3 deliverables begin.

## What Evans needs to decide

**Question to ratifier:** Approve Option B+ as synthesized above + design doc v0.2?

**If APPROVE:**
- Claude begins Day 1–3 deliverables immediately:
  - canonical event log directory + JSON Schema per event type + signed-commit CI gate
  - Projection Service GitHub Action (events → canonical.json)
  - Orchestrator agent CLAUDE.md template
  - Spec Corpus agent CLAUDE.md template + CR protocol
  - 1 implementation repo bootstrap (`telecheck-forms-intake` or similar)
  - Rollback runbook + Day-0 dry-run test bench
- End of Week 1: pilot ready to begin (Day 4 onwards)
- Day 14: pilot evaluation
- Day 15: expansion decision OR pivot

**If APPROVE with modifications:** Specify which modifications; Claude updates v0.2 → v0.3; Codex re-verifies; surface again for ratification.

**If REJECT:** Continue current single-Claude trajectory; defer agentic workforce until later (Codex Pass-1 + Pass-2 both flagged this as too slow but it's a valid path).

**If REQUEST FURTHER ANALYSIS:** Specify which open questions need deeper treatment; Claude + Codex iterate.

## Estimated bootstrap commitment if APPROVED

- **Calendar:** ~14 days to pilot evaluation; 21 days to expanded workforce live (if pilot succeeds)
- **Compute cost:** ~$2-10k bootstrap + ~$500-800/yr/agent steady-state ≈ $3-6k/month for 7-agent workforce
- **Human attention (Evans):** ~5 hours/week during bootstrap + ratification ceremonies; ~2 hours/week steady-state
- **Reversibility:** High during pilot (rollback runbook tested Day 0); lower post-expansion (but rollback paths defined)

## Reference branches

- `design/agentic-workforce-architecture-v0-1` on `arthurmenson/telecheckONE`
  - `cd3a2f5` — v0.1 design doc
  - `726e999` — Claude recommendation
  - `57286ca` — Codex Pass-2 prompt
  - `e65885d` — v0.2 design doc (with Codex Pass-1 + Pass-2 closures)

---

**Awaiting Evans's chat-message ratification.**
