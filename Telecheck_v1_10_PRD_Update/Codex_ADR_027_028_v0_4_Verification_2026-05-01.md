# ADR-027 + ADR-028 v0.4 — Codex Verification Pass

**Review date:** 2026-05-01
**Reviewer:** Codex (gpt-5.5 via OpenAI Codex CLI v0.125.0)
**Tokens used:** 3,813

**Bottom line (verbatim):** *"ADR-028 v0.4 is approval-ready for Phase 4 baseline. ADR-027 v0.4 is not quite approval-ready yet because Decision §7 still contains the stale 'open question pending finalization' phrase. Once that phrase is narrowed to 'borderline-case refinement only,' ADR-027 should be clean for approval."*

**Status:** ADR-028 v0.4 → APPROVAL-READY. ADR-027 v0.4 had one remaining stale phrase in Decision §7 Boundary cases intro; v0.5 micro-fix applied with Codex's exact recommended replacement.

## Verification of v0.3 residue items (2)

| Item | v0.4 status | Citation |
|---|---|---|
| ADR-027 §25 framing residue | PARTIAL | References + closing paragraph fixed; Decision §7 Boundary cases intro paragraph still had stale "Master PRD §25 open question pending finalization" phrase (v0.4 missed it). v0.5 fixes per Codex's exact replacement text. |
| ADR-028 [COUNSEL-REQUIRED] residue in Open Questions | **CLOSED** | Open Questions cross-border bullet now references structured `cross_border_research_transfer_permitted` CCR enum + companion fields; activation gate is structured-field completeness, not free-text [COUNSEL-REQUIRED] markers. |

## New v0.4 issues

None for ADR-028.

ADR-027: 1 stale-phrase residue (closed in v0.5).

## v0.5 patch applied (ADR-027 only)

Decision §7 Boundary cases intro replaced exactly per Codex's recommended text:

```
Boundary cases (apply working definition with §13.6 governance review;
Master PRD §25 tracks borderline-case refinement only):
```

After v0.5: ADR-027 §25 framing is fully consistent across Decision, References, and Open Questions sections. No remaining occurrences of "open question pending finalization" outside the v0.5 changelog (which intentionally documents what was removed).

## Convergence trajectory (full ADR-027 + ADR-028 cycle)

| Version | Open issues | Action |
|---|---|---|
| v0.1 (initial) | — | Drafted |
| v0.1 review | 24 (8+11+5) | Codex pre-acceptance review |
| v0.2 | 15 (8 partial + 7 new) | Most substantive issues closed; residue in "What is NOT decided" / Open Questions |
| v0.3 | 4 (2 partial + 2 new) | Residue cleanup |
| v0.4 | 1 (ADR-027 §25 stale phrase) | One missed instance in Boundary cases intro |
| **v0.5 (ADR-027) / v0.4 (ADR-028)** | **0** ✅ | **APPROVAL-READY** |

5 versions; 5 Codex review cycles. Same convergence shape as planning freeze (4 cycles) and C7 (4 cycles).

## Document control

- **v1.0 — 2026-05-01** — Codex verification on v0.4. ADR-028 v0.4 declared approval-ready. ADR-027 v0.4 had one residue item; v0.5 applied with Codex's exact recommended replacement.
- **Status:** Delta artifact. v0.5 applied. Both ADRs now Phase-4-baseline-ready.
