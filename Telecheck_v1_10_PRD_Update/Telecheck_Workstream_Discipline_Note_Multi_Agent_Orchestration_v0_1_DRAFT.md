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
- **Next:** v0.2 after Phase D returns and reconciliation completes; adopt or roll back per measured outcome.
- **Cross-reference:** ADR-029 (AI workload taxonomy — product-side; orthogonal to this note); WORKLOAD_TAXONOMY contract; AUTONOMY_LEVELS contract; v1.10.1 hygiene cycle status doc.
