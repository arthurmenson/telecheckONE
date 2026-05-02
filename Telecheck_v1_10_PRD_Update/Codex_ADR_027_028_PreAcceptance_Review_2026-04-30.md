# ADR-027 + ADR-028 v0.1 — Codex Pre-Acceptance Review

**Review date:** 2026-04-30
**Reviewer:** Codex (gpt-5.5 via OpenAI Codex CLI v0.125.0)
**Tokens used:** 16,120
**Bottom line (verbatim):** *"Neither ADR is approval-ready as drafted. ADR-027 is closer but still needs v0.2 fixes before Phase 4 baseline. ADR-028 needs more substantial v0.2 repair, especially invariant numbering, Posture A boundary controls, consent timing, and cross-border/de-identification gates."*

---

## ADR-027 findings (8: 3 HIGH, 3 MEDIUM, 2 LOW)

### HIGH

1. **CCR typing inconsistency.** `Decision §1-2` defines `molecule_level_marketing_permitted: bool`, then sets Ghana to `pending`. A bool cannot represent `pending`. Fail-closed defense is broken. **Patch:** either use `false` plus separate evidence/status fields, or define an enum state machine.
2. **Molecule-level vs program-level marketing boundary open.** `What is NOT decided here §2` says working definition is "not blocking." Indefensible for an ADR whose core activation risk is molecule-level DTC marketing. **Patch:** provide working definition.
3. **Regulatory mapping under-specified.** Context asserts Ghana is "different and more permissive"; activation defers actual evidence to future artifacts. Too loose for activation gating. **Patch:** require documented legal/regulatory interpretation, jurisdiction, date, scope, and prohibited claim classes before any `true` activation.

### MEDIUM

4. "Implicitly amends Master PRD §21" weak document-control language. Phase 4 should say exactly what §21 text changes from/to.
5. Marketing-surface invariant/control surface thin. Decision §3 preserves I-019/I-012/I-023..I-027 in prose but doesn't bind marketing surfaces to audit events, copy versioning, reviewer identity, country policy version, or rendered-claim traceability.
6. Master PRD §24 rows 17, 18 dependency ambiguity vs Phase 0 scope-reconciliation rows. ADR should distinguish Phase 0 prerequisites for acceptance from per-country activation prerequisites.

### LOW

7. §13.5 vs §13.6 ambiguity in Decision §4.
8. WORKLOAD_TAXONOMY cited as "future" but C7 is finalized; cite governance class name directly.

---

## ADR-028 findings (11: 5 HIGH, 4 MEDIUM, 2 LOW)

### HIGH

1. **Invariant ID collision (BLOCKER).** ADR-028 Decision §4 creates "new I-024, I-025, I-026" but those IDs already exist in the canonical INVARIANTS contract for tenant isolation/audit (I-024 cross-tenant break-glass, I-025 information-leak prevention, I-026 tenant configuration governance, I-027 audit envelope). New research invariants need non-conflicting IDs. **Patch:** renumber to I-029, I-030, I-031 (next available after existing I-028 "Single physical region"). Planning Freeze v1.3 §3.7 + §4 has the same collision; v1.4 hotfix required.
2. **k-threshold undecided makes I-024/029 unenforceable.** Decision §1 says "Safe Harbor + k-anonymity"; What is NOT decided §6 leaves k threshold undecided. Acceptance must require a conservative minimum threshold and suppression rules.
3. **Consent timing double-binding.** Posture A scope says 5th consent tier "Active at v1.0 launch"; Activation requirements says ADR-028 is Release 2 capability. Consent gathered before any DSA/partner/de-id engine creates "future-use governance" gap. **Patch:** consent text must explicitly say no exports occur until later + name future-use governance model.
4. **Permitted data domains undefined.** Without permitted data domains, DSA minimum content, and prohibited secondary uses, Posture A can silently expand into general research brokerage.
5. **Posture B boundary hole.** Decision §1 permits partner-specified inclusion/exclusion criteria + longitudinal exports. Decision §2 doesn't exclude partner-driven protocolized cohort recruitment, prospective observational studies, post-market studies, partner requests altering care workflows. **Patch:** tighten Posture B exclusions.

### MEDIUM

6. `research_ethics_review_body: string` underspecified — needs structured identity, jurisdiction, approval/reference IDs, validity period, scope, per-DSA/export requirement.
7. "Audit Category B" may be too low for longitudinal health data exports under DSAs.
8. v1.10 vs Release 2 implementation scope conflation. Decision §10 + Consequences/Negative cited as 60% of v1.10 effort. Separate v1.10 canonical contract edits from Release 2 implementation obligations.
9. `[COUNSEL-REQUIRED]` insufficient as activation gate. Need counsel approval artifact IDs, transfer mechanism, recipient country, onward-transfer prohibition/allowance, DSA alignment.

### LOW

10. Entity list inconsistency (DeIdentificationLevel listed in Decision §7; not in Companion documents).
11. Mode 2 patient summary research data flows may include derived sensitive data.

---

## Cross-coherence findings (5)

### HIGH

1. **Invariant ID collision** — same as ADR-028 finding 1 above; ADR-027 correctly treats I-023..I-027 as existing tenant/audit invariants while ADR-028 doesn't.

### MEDIUM

2. Activation patterns similar but consent active at v1.0 in ADR-028 creates third state ("consent collected but research inactive") not mirrored in activation model.
3. Vocabulary mostly aligned but ADR-027 uses `pending` in bool field; normalize fail-closed configuration semantics.
4. Both ADRs rely on Phase 0 regulatory artifacts but neither states whether missing rows block ADR acceptance, v1.10 promotion, or only per-country runtime activation.

### LOW

5. Both reference WORKLOAD_TAXONOMY but avoid naming finalized governance classes.

---

## Status of v0.2 patches (applied 2026-04-30)

- **ADR-028 v0.2:** invariant renumbering (I-024/025/026 → I-029/030/031); k-anonymity threshold pinned; consent timing clarified; permitted data domains bounded; Posture B boundary tightened; ethics review body structured; cross-border activation gate hardened; entity list reconciled; AI-generated summary scope clarified.
- **ADR-027 v0.2:** CCR typing fixed (enum, not bool); molecule/program working definition added; regulatory evidence requirements specified; supersession language sharpened; marketing-surface controls bound to audit envelope; §24 row dependencies clarified; §13.5/§13.6 reconciled; WORKLOAD_TAXONOMY governance class named.
- **Planning Freeze v1.4 hotfix:** renumber I-024/025/026 → I-029/030/031 across §3.7, §4 New invariants, §6 dependency graph, §7 sign-off gates.
- Pending v0.2 verification pass.

---

## Document control

- **v1.0 — 2026-04-30** — Codex pre-acceptance review of ADR-027 v0.1 + ADR-028 v0.1. 8 + 11 + 5 findings. Bottom line: not approval-ready. v0.2 patches required before Phase 4 baseline.
- **Companion artifacts:** Codex_Tier2_v1_3_Verification_2026-04-29.md (most recent C7 review).
- **Status:** Delta artifact. v0.2 patches applied 2026-04-30. v0.2 verification pending.
