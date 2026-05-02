# ADR-027 + ADR-028 v0.3 — Codex Verification Pass

**Review date:** 2026-05-01
**Reviewer:** Codex (gpt-5.5 via OpenAI Codex CLI v0.125.0)
**Tokens used:** 23,891

**Bottom line (verbatim):** *"ADR-027 v0.3 is close, but I would not call it fully clean until the remaining Master PRD §25 wording is narrowed to 'borderline-case refinement' everywhere. ADR-028 v0.3 fixes the major k-threshold, domain-enum, activation-state, supersession, and Release 2/v1.10 issues, but it still has a stale `[COUNSEL-REQUIRED]` reference in Open questions that conflicts with the structured-field activation model. Net: both are substantially improved, but for a Phase 4 baseline I would require one final editorial cleanup pass before approval, especially ADR-028's cross-border open question."*

**Status:** Most v0.2 PARTIAL items + 7 new-v0.2 issues CLOSED. Two micro-residue items remain (1 per ADR). v0.4 micro-cleanup applied.

## Verification of v0.2 PARTIAL items

| Item | v0.3 status |
|---|---|
| ADR-027 HIGH-2 molecule/program | PARTIAL (residual §25 wording) |
| ADR-027 LOW-8 WORKLOAD_TAXONOMY | CLOSED |
| ADR-028 HIGH-2 k-threshold | CLOSED |
| ADR-028 HIGH-4 permitted domains | CLOSED |
| ADR-028 MEDIUM-8 v1.10 vs Release 2 | CLOSED |
| ADR-028 MEDIUM-9 [COUNSEL-REQUIRED] | PARTIAL (Open Questions residue) |
| Cross MEDIUM-4 acceptance vs activation | CLOSED |
| Cross LOW-5 governance classes | CLOSED |

## Verification of v0.2 new issues

| Issue | v0.3 status |
|---|---|
| 1. ADR-027 bool remnants | CLOSED |
| 2. ADR-027 Ghana state | CLOSED |
| 3. ADR-027 definition contradiction | PARTIAL (Decision §7 + References framing residue) |
| 4. ADR-028 k-threshold | CLOSED |
| 5. ADR-028 permitted domains | CLOSED |
| 6. ADR-028 enum/bool | CLOSED |
| 7. ADR-028 Supersedes | CLOSED |

## New v0.3 issues (2)

1. **ADR-027 §25 wording.** Decision §7 last paragraph still says "Master PRD §25 open question pending finalization." References still labels §25 as "Open questions (molecule-level vs program-level definition)." No hard contradiction but invites reopening already-decided base definition.

2. **ADR-028 [COUNSEL-REQUIRED] residue in Open Questions.** Activation requirements §6 correctly uses structured CCR fields, but Open Questions final bullet still says cross-border posture handled "with [COUNSEL-REQUIRED] markers" — contradicts the v0.3 cleanup.

## v0.4 patches (applied 2026-05-01)

- **ADR-027 v0.4:** Decision §7 last paragraph + References §25 entry rewritten to consistently frame §25 as "borderline-case refinement only" (base definition canonical per Decision §7).
- **ADR-028 v0.4:** Open Questions final bullet rewritten to reference structured `cross_border_research_transfer_permitted` CCR enum + companion fields per Decision §6 / Activation requirements §6.

## Document control

- **v1.0 — 2026-05-01** — Codex verification on v0.3. Most prior items CLOSED; 2 micro-residue items. Bottom line: substantially improved but not fully clean for Phase 4 baseline. v0.4 micro-cleanup required.
- **Status:** Delta artifact. v0.4 patches applied 2026-05-01. v0.4 verification pending.
