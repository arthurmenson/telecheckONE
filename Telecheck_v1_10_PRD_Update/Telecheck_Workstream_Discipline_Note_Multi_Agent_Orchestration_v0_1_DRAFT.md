# Workstream Discipline Note — Multi-Agent Orchestration

**Version:** v0.1 DRAFT
**Status:** Proposed — Evans authorized adoption 2026-05-02 ("i agree" response to multi-agent expert workstream orchestration recommendation)
**Owner:** Workstream lead (Evans, via Claude proxy as orchestrator)
**Adversarial reviewer:** Codex (gpt-5.5)
**Scope:** Engineering / spec-corpus workstream practice — NOT a product-side architectural decision.

---

## 1. Purpose and scope

This note documents the **workstream-discipline** adoption of multi-agent orchestration for the Telecheck spec corpus and (when it materializes) the code repository.

**This is a process discipline, not a product capability.** It governs how engineering work is decomposed, dispatched, and reconciled. It does NOT activate any reserved AI workload type from ADR-029 (`autonomous_agent`, `multi_agent_supervisor`, `tool_using_agent`) — those reserved types govern *product-side* AI workloads that act on patient data and require the activation gates documented in WORKLOAD_TAXONOMY §3 + AUTONOMY_LEVELS §3.

The two layers are **orthogonal**:

| Layer | Governing artifact | Examples |
|---|---|---|
| **Product-side AI workloads** | ADR-029 + WORKLOAD_TAXONOMY contract + AUTONOMY_LEVELS contract + I-012 reject-unless rule | Mode 1 patient chat, Mode 2 protocol execution |
| **Workstream-side multi-agent orchestration** (this note) | Workstream discipline; not platform-floor; not a customer-facing capability | Spec-cycle parallel propagation, parallel adversarial review, parallel module audits |

This note may eventually graduate to a full ADR (candidate ID: ADR-035) if the project decides workstream practices warrant ADR-tier formalization. At v0.1 it is a discipline note, not an ADR.

---

## 2. Context — what triggered the adoption

The v1.10.1 hygiene cycle (physical merge of v1.10 PRD Update Cycle delta artifacts into bundle file bodies; cycle started 2026-05-02 per Evans's "use your recommended and go yolo mode" instruction) revealed two scaling pain points in the existing single-Claude-proxy + Codex-adversarial-reviewer pattern:

1. **Sequential propagation across independent files is slow.** Phase D of the hygiene cycle (~26 slice/OR/other docs) is a fan-out workload — most rows touch one file each. Sequential editing leaves wall-clock time on the table.
2. **Single-pass adversarial review bundles too many concerns.** Codex per-phase exit gates fire serially with one monolithic prompt. Specialty perspectives (clinical safety, privacy, regulatory, brand structure) get blended; findings come back in one stack.

Telecheck's spec corpus is well-suited to multi-agent fan-out because it has:
- Strict source-of-truth hierarchy (orchestrator can deterministically reconcile sub-agent outputs).
- 22+ named invariants (each can anchor a per-domain enforcement agent).
- Glossary v5.2 closed-vocabulary discipline (sub-agents have an unambiguous canonical vocabulary).
- Deterministic conflict-resolution rules (Slice vs CDM → CDM wins; Slice vs OpenAPI → OpenAPI wins; etc.).

---

## 3. The pattern

### 3.1 Roles

| Role | Description |
|---|---|
| **Orchestrator** | Single Claude conversation thread (the workstream lead's proxy). Decomposes large workloads into independent batches, dispatches sub-agents, reconciles their outputs against the source-of-truth hierarchy, surfaces conflicts to the workstream lead, holds the cycle's narrative thread. |
| **Sub-agent (expert)** | Domain- or batch-bounded sub-agent dispatched via `Agent` tool. Receives a self-contained brief (no inherited conversation context) with: scope, source delta artifacts, file paths, canonical vocabulary, constraints, and output format. Returns a concise report. |
| **Adversarial reviewer (Codex)** | Independent reviewer at phase-exit gates. With multi-agent adoption, MAY be fanned into multiple parallel scoped reviews (clinical-safety / privacy / regulatory / brand-structure). |
| **Workstream lead** | Human decision authority (Evans). Authorizes phase advances; resolves cross-batch conflicts the orchestrator surfaces. |

### 3.2 When to fan out (suitable workloads)

✅ **Fan out when** the workload is:
- **Mechanical propagation** across many files where each file's edit is independent of the others (e.g., the C3 brand-structure sweep across 29 rows).
- **Independent batch processing** where batches share a pattern but operate on disjoint file sets (e.g., the 6 cycle-batched Phase D dispatch).
- **Parallel adversarial review** scoped per concern (clinical safety / privacy / regulatory / brand structure / engineering).
- **Per-module spec-vs-code traceability** when the code repo materializes (one agent per module per ADR-001's 15-module map).

### 3.3 When NOT to fan out

❌ **Stay sequential when** the workload is:
- **Canonical authoring** (Master PRD section drafts; INVARIANTS new-invariant authoring; ADR new-decision authoring). These are single-thread tasks; multi-agent drafting introduces semantic drift faster than parallelism saves time.
- **Cross-batch reconciliation** that depends on outputs from earlier batches (sequence dependencies).
- **Trivially small workloads** where dispatch overhead exceeds the parallelism benefit.

### 3.4 Dispatch discipline

For each sub-agent dispatched:

1. **Self-contained brief.** The sub-agent has no inherited conversation context. Brief includes: cycle context, batch scope, source delta artifact paths, file paths to edit, canonical vocabulary references, constraints (especially invariants to preserve), output format.
2. **Bounded file set.** Sub-agents are told explicitly which files they may edit — no surprise scope expansion.
3. **No commits from sub-agents.** Only the orchestrator commits, after reconciliation.
4. **Concise return format.** Sub-agents return a focused report (typically under 500 words): files touched, edits made, anomalies. The orchestrator synthesizes the multi-agent reports into the cycle's status doc + Promotion Ledger.

### 3.5 Reconciliation discipline

After all sub-agents in a fan-out return:

1. **Cross-file consistency check.** The orchestrator scans the multi-agent diff for cross-file conflicts (e.g., two agents wrote conflicting v1.10 cycle additions sections in the same file).
2. **Invariant scan.** Confirms no sub-agent silently relaxed an invariant (especially I-012, I-019, I-023–I-027, I-029–I-031, audit append-only).
3. **Glossary/vocabulary scan.** Confirms canonical-term usage (no `prescription` outside §17 carve-outs; no bare `Heros`; etc.).
4. **Source-of-truth hierarchy enforcement.** If any sub-agent output disagrees with a higher-tier authority, the higher tier wins; orchestrator patches.
5. **Adversarial review.** Codex (or human) reviews the reconciled output. With multi-agent adoption, this MAY be fanned into per-domain scoped reviews.

---

## 4. Adoption phases

### 4.1 Pilot — v1.10.1 hygiene cycle Phase D (in progress 2026-05-02)

The remainder of the v1.10.1 hygiene cycle adopts this pattern:
- Phase A (Contracts Pack core 6 files) — orchestrator-sequential. ✅ Done.
- Phase B (Contracts Pack remainder 4 files) — orchestrator-sequential. ✅ Done.
- Phase C (engineering specs 6 files) — orchestrator-sequential (small cross-references; sequence dependencies). ✅ Done.
- Phase D (slice PRDs + OR Tracker + other docs ~26 rows) — **6 parallel sub-agents** (D1 C2 emerging-markets reframe, D2 C3 brand cascade slices, D3 C4 marketing posture, D4 C5 research + C6 program catalog, D5 C7 AI taxonomy slices, D6 DIC + Design + OR Tracker + Group 5E other docs + Group 5F country regulatory placeholders).
- Codex final EXIT — **4 parallel scoped reviews** (clinical-safety, privacy, regulatory, brand-structure).

### 4.2 Future cycles

If the pilot demonstrates value (measurable wall-clock improvement; no semantic drift; no missed conflicts), the pattern propagates to:
- Future v1.X cycles (post-1.10).
- Code-repo cycles when implementation begins (one agent per module per ADR-001's 15-module map).
- Continuous spec-vs-code traceability (per-invariant agent, per-ADR agent).

If the pilot reveals problems (cross-agent drift, missed conflicts, reconciliation overhead exceeding parallelism savings), the pattern is rolled back to single-thread orchestration.

---

## 5. Risks and mitigations

| Risk | Mitigation |
|---|---|
| **Sub-agent semantic drift.** Different sub-agents interpret the same source delta differently, producing divergent edits. | Self-contained briefs reference identical source delta artifacts; orchestrator runs cross-file consistency check at reconciliation; canonical vocabulary scan. |
| **Cross-file conflicts when multiple sub-agents touch the same file.** | Briefs explicitly enumerate when a file is touched by multiple sub-agents; instruction is "append additively, do not conflict"; orchestrator inspects merged diff. |
| **Hidden invariant relaxation.** A sub-agent inadvertently weakens an invariant. | Reconciliation includes an explicit invariant scan; Codex adversarial review at exit gate. |
| **Reconciliation overhead exceeds parallelism savings.** Wall-clock improvement is illusory. | Adopt incrementally; measure per-cycle. Roll back if measured cost exceeds benefit. |
| **Loss of cycle narrative coherence.** The orchestrator's status doc + Promotion Ledger entries become harder to write because the cycle's work is distributed. | Sub-agents return concise structured reports; orchestrator maintains narrative as before, treating sub-agent reports as input to the same status-doc discipline. |

---

## 6. Distinction from ADR-029 (product-side AI workloads)

This note governs **engineering process**: how the workstream is run.

ADR-029 governs **product-side AI workloads**: how AI capabilities act on patient data within the platform.

Both layers may coexist independently. Reserved workload types under ADR-029 (`autonomous_agent`, `multi_agent_supervisor`, `tool_using_agent`) require successor ADR + activation audit event; nothing in *this* note activates them. The Claude orchestrator and sub-agents in this workstream are "humans-with-keyboards-replacement-tools" — they do not access patient data, do not make clinical decisions, and do not interact with the runtime platform.

If the project later decides to use multi-agent orchestration *inside* the platform (e.g., a multi-agent supervisor that coordinates clinical workflows on patient data), that adoption is governed by ADR-029 + a successor ADR (ADR-030 / 031 / 033 as applicable) — separate from this note.

---

## 7. Open questions (to resolve at v0.2)

- Should this graduate to ADR-035 if the v1.10.1 pilot succeeds, or remain a workstream discipline note? (Open until pilot exit metrics are in.)
- What metrics define "pilot success"? Proposed: (a) wall-clock improvement vs sequential baseline; (b) zero invariant relaxations in reconciled output; (c) zero cross-file conflicts requiring human resolution; (d) Codex adversarial review HIGH/MEDIUM count not increased relative to sequential baseline.
- How does this interact with the Stop hook (`stop-review-gate-hook.mjs`) review gate? Currently the hook fires after every Claude turn; with multi-agent fan-out, the hook fires after the orchestrator's turn, not per sub-agent. (Acceptable — the hook is a backstop, not a per-batch gate.)

---

## 8. Document control

- **v0.1 — 2026-05-02** — Initial draft authored mid-v1.10.1 hygiene cycle Phase D dispatch. Captures the pattern as adopted; pilot in progress. Status: workstream discipline note; not ADR-tier yet. Awaiting pilot exit metrics for graduation decision.
- **v0.1-addendum-A — 2026-05-14** — Empirical data appended from the AI Service rollout 24-hour autonomous run (Pharmacy TLC-055 closure + AI Service PRs A–F + 16-round Codex cycle on PR F). See §9.
- **Next:** v0.2 after Phase D returns and reconciliation completes; adopt or roll back per measured outcome.
- **Cross-reference:** ADR-029 (AI workload taxonomy — product-side; orthogonal to this note); WORKLOAD_TAXONOMY contract; AUTONOMY_LEVELS contract; v1.10.1 hygiene cycle status doc; AI_Service_Rollout_24h_Status_2026-05-14.md.

---

## 9. Addendum A — empirical findings from the 2026-05-14 AI Service rollout run

This addendum captures lessons from the second large autonomous run after the v1.10.1 hygiene cycle Phase D pilot. The run is a complementary data point: it exercised the **sequential** orchestration pattern (not multi-agent fan-out), with Codex round-robin as the adversarial loop. This addendum is appended as input to v0.2; it does NOT modify the pattern documented in §3.

### 9.1 Scope of the run

- **Pharmacy TLC-055 closure**: PRs C–K merged sequentially (9 PRs). Sequential because each PR's diff sequences a state-machine transition that the next PR's tests assume.
- **AI Service module rollout**: PRs A–F. PRs A–E merged sequentially (each PR adds primitives the next assumes). PR F (crisis-detection gate) extended to 19 commits across 16 Codex adversarial-review rounds before convergence.
- **Cross-repo work**: cockpit auto-sync self-heal, platform-wide idempotency preHandler auth-bypass fix.

Total: 17 PRs merged or open at run close.

### 9.2 When sequential outperformed fan-out (this run's pattern)

The run stayed sequential for these reasons:

1. **Each PR's tests depended on the prior PR's state-machine writeback.** TLC-055 PR G (clinician_approve) tests assume PR F's clinician_discontinue + PR E's createDraft are durable. Fan-out would have required rolling test fixtures across agent boundaries — overhead exceeds parallelism benefit.
2. **AI Service primitive layering.** PR D's `BaseLLMProvider` fail-soft wrap is consumed by PR E's guardrail validator's `validatePlatformFloorCompliance`, which is consumed by PR F's gate. Fan-out across the layer boundary would have required interface stubs that the dispatching sub-agent would need to author, which is itself orchestrator work.
3. **One-thread narrative coherence.** Each PR's body + commit message refers to the prior PR's closure. The run produced 7 dovetailed PR descriptions; a multi-thread author pool would have re-derived the cross-references repeatedly.

The v0.1 §3.3 "stay sequential when" guidance correctly anticipated this. The PR-sequence cadence is in the same category as "canonical authoring" — single-thread.

### 9.3 The Codex round-robin's long-tail asymptote

PR F passed through 16 rounds of Codex adversarial review (R1 → R16), each closing exactly one or two `HIGH` findings before merge. Round-by-round closure summary:

| Round | HIGH(s) closed | Surface |
|---|---|---|
| R1 | 2 | FLOOR-020 envelope correctness; audit-dedupe wiring |
| R2 | 1 | Input vs output scan dedupe collision |
| R3 | 1 | Tenant-equality on dedupe marker |
| R4 | 1 | `externalTx` parameter removed (rollback durability) |
| R5 | 1 + 1M | Multi-resource dedupe; structured `audit_error` |
| R6 | 2 | `response_provided: null`; multi-segment discriminator |
| R7 | 1 | Case-prep discriminator fail-closed when missing |
| R8 | 1 | Discriminator shape regex |
| R9 | 1 | `response_provided` semantics (null vs false vs true) |
| R10 | 1 | Safety-first envelope (sentinel ALWAYS returns) |
| R11 | 1 | Unavoidable ops log on audit failure |
| R12 | 1 | Wiring errors fall through to fallback emit |
| R13 | 1 + 1M | Required-field validation; rollback test harness limitation |
| R14 | 1 | PHI leak into audit detail via rejected discriminator |
| R15 | 1 | Audit-emit-safe field substitution placeholders |
| R16 | 1 | Log-stream PHI leak via raw caller-supplied identifiers |

**Trajectory observation.** Round content evolved from structural correctness (R1–R5: envelope, dedupe, durability) through semantic correctness (R6–R9: observation timing, validation strictness) through safety-vs-audit ordering (R10–R13: who fails when) to PHI-leak surface narrowing (R14–R16: shape-metadata-only validation messages).

**Asymptote characteristics.** Each round in R10–R16 closed real, citable safety boundaries, but the marginal patient-impact of each closure narrowed: R10 (programmer wiring bug denying patient crisis-resource) → R16 (PHI in log fields a triager would see). All real; none patient-blocking on the canonical path. The pattern matches the v1.10.1 hygiene cycle's observation that "each round addresses real issues but yields diminishing returns; converge somewhere in the 10–15 range" — except the AI Service run extended to R16 because PR F covers a higher-risk surface (mandatory Category A audit with crisis-write exception) than typical Phase D row work.

**Convergence call.** R16 was a defensible stopping point because:
- Each subsequent edge would have been documented caller-side expectations (e.g., "callers SHALL pass non-PHI identifiers for ai_actor_id"), not API-shape guarantees.
- The Codex Verdict text in R16 explicitly framed the next-tier concern as a "caller responsibility" rather than a gate-side defense.
- The PR had grown to 19 commits + 700 test lines + a refreshed README; further commit churn was approaching review-burden negative-utility.

### 9.4 Recommended additions to §3 (for v0.2 consideration)

These are proposed additions, not commitments; v0.2 should decide whether to adopt them.

#### 9.4.1 PR-sequence cadence is single-thread (extends §3.3)

Add to v0.1 §3.3 "When NOT to fan out":

> - **PR-sequence cadence within a single module** where each PR builds on the prior PR's writeback / state machine / primitive layer. The narrative coherence + cross-PR test fixtures + commit-message cross-references make fan-out cost exceed parallelism benefit. This is the same category as "canonical authoring" already documented.

#### 9.4.2 Codex round-robin self-termination criteria (new §3.6)

Add a new section:

> **§3.6 Codex round-robin convergence criteria.** When the per-PR Codex adversarial-review loop becomes self-pacing (no human-driven phase boundary), convergence is signaled by ANY of:
>
> 1. **Caller-responsibility framing.** Codex's next-round verdict frames the next finding as "caller SHALL ..." rather than as a gate-side or API-surface defense.
> 2. **Diminishing patient-impact.** Each subsequent closure's worst-case is increasingly removed from the patient (PHI in log fields a triager sees > PHI in audit chain a compliance review sees > patient denied service). When the trajectory crosses "log-stream PHI" into pure log-field hardening with no observable patient-impact, convergence is reached.
> 3. **Trajectory asymptote.** Plot rounds 1..N's marginal patient-impact (subjective; on a 1–10 scale). When three consecutive rounds score < 3, convergence is reached.
> 4. **Review-burden negative utility.** When the diff size + commit-churn crosses the threshold where the marginal closure costs the reviewer more attention than the marginal patient-safety gain, convergence is reached.
>
> The convergence call is the **orchestrator's** decision, not Codex's. The orchestrator documents the convergence in the PR's status doc + the closing commit's body. Subsequent R17+ findings (if Codex is invoked again post-merge) become tickets for a successor PR rather than blocking the current PR.

#### 9.4.3 Codex autoinvocation scope clarification (extends §3.1 "Adversarial reviewer")

Add to v0.1 §3.1 row "Adversarial reviewer (Codex)":

> Autoinvocation scope per Evans 2026-04-28 directive: every v1.10 workstream phase/milestone exit. The 2026-05-14 AI Service rollout run applied this **by analogy** to implementation-repo PR exits, since each PR functioned as a workstream milestone in the same multi-agent orchestration pattern. The orchestrator should explicitly note in run-close documentation when autoinvocation is applied by analogy rather than per literal directive; v0.2 should clarify whether the directive's scope extends to all implementation-repo PRs going forward.

### 9.5 Metrics from the run (for v0.2 §7.b "metrics")

The v0.1 §7 open question proposes: "(a) wall-clock improvement vs sequential baseline; (b) zero invariant relaxations in reconciled output; (c) zero cross-file conflicts requiring human resolution; (d) Codex adversarial review HIGH/MEDIUM count not increased relative to sequential baseline."

Data point from this run (sequential pattern, not multi-agent):

- **(b) Invariant relaxations**: zero. All 16 R-closures on PR F preserved I-003, I-019, I-023..I-027, FLOOR-007..FLOOR-013, FLOOR-020. The R-closures *tightened* enforcement (e.g., R12 ensured I-019 audit emission holds across wiring-error paths it previously skipped).
- **(c) Cross-file conflicts**: zero (sequential pattern; not exercised).
- **(d) Codex HIGH count per round**: averaged 1.06 across 16 rounds (17 HIGHs + ~2 MEDIUMs / 16 rounds). Baseline TBD when a multi-agent fan-out run produces comparable data.

The (a) wall-clock metric is not applicable to a sequential run by definition. The Pharmacy TLC-055 run + AI Service A–F run took approximately one work-day of autonomous orchestrator time across both repos. A multi-agent fan-out comparison would need the same workload partitioned across sub-agents — left for a future cycle.

### 9.6 Carry-forwards for the next cycle

When the next major workstream cycle activates (v1.10.x hygiene; or the v1.11 cycle, whichever lands first), v0.2 should be ready with:

1. The §3.6 convergence-criteria text (above) so future orchestrators have an explicit shut-off signal for the Codex round-robin.
2. The §3.3 "PR-sequence cadence single-thread" guidance (above) so future code-repo cycles don't speculatively fan out cross-PR work.
3. Resolved §7 open question on ADR-035 graduation: defer until at least one full multi-agent fan-out run produces a wall-clock metric.

— Orchestrator (Claude Opus 4.7, 1M context) on the 2026-05-14 autonomous run
