# ADR-027 + ADR-028 v0.2 — Codex Verification Pass

**Review date:** 2026-05-01
**Reviewer:** Codex (gpt-5.5 via OpenAI Codex CLI v0.125.0)
**Tokens used:** 22,438

**Bottom line (verbatim):** *"ADR-027 v0.2 is close but still needs cleanup before approval: the substantive controls are mostly fixed, but the document must remove bool remnants and resolve the contradiction about whether the molecule/program definition is accepted or still open. ADR-028 v0.2 is not approval-ready as a Phase 4 baseline because it contains direct internal contradictions on k-threshold, permitted data domains, and enum activation semantics. Planning Freeze v1.4 appears to close the invariant-ID hotfix. Overall: do not accept both ADRs yet; approve Planning Freeze v1.4 hotfix, then require a v0.3 consistency pass for ADR-027 and especially ADR-028."*

**Status:** Most prior findings CLOSED; several PARTIAL due to residue from v0.2 patches not propagating to "What is NOT decided" + "Open questions" sections. v0.3 cleanup in flight.

---

## Verification of v0.1 findings

### ADR-027

| # | Status | Note |
|---|---|---|
| HIGH-1 CCR typing | CLOSED | Enum `prohibited / pending_evidence / permitted`, default `prohibited` |
| HIGH-2 molecule/program boundary | PARTIAL | Decision §7 added definition; "What is NOT decided §2" + Open Questions still treat as unresolved (residue) |
| HIGH-3 regulatory mapping | CLOSED | `marketing_copy_governance_evidence` structured CCR key |
| MEDIUM-4 §21 supersession | CLOSED | Header quotes prior/replacement wording |
| MEDIUM-5 marketing-surface controls | CLOSED | Decision §5 binds version, reviewer IDs, surface_rendered + surface_drift audit events |
| MEDIUM-6 Phase 0 vs activation | CLOSED | Two-tier Activation requirements |
| LOW-7 §13.5 vs §13.6 | CLOSED | Decision §4 distinguishes |
| LOW-8 WORKLOAD_TAXONOMY future | PARTIAL | Decision §5 names class; Companion docs + Open Questions still say "(future)" / "defer" (residue) |

### ADR-028

| # | Status | Note |
|---|---|---|
| HIGH-1 invariant ID collision | CLOSED | I-029/030/031 across all sections; Planning Freeze v1.4 aligned |
| HIGH-2 k-threshold | REGRESSED/PARTIAL | Decision §4 pins k_min=11; "What is NOT decided §6" still says undecided (direct contradiction) |
| HIGH-3 consent timing | CLOSED | Three-state activation (`inactive`/`consent_only`/`active`) |
| HIGH-4 permitted domains | PARTIAL | Decision §6 closed enum; Open Questions still says "leave open subject to DSA scope" (contradicts) |
| HIGH-5 Posture B boundary | CLOSED | 6 explicit exclusions added |
| MEDIUM-6 ethics review body | CLOSED | Structured object replaces bare string |
| MEDIUM-7 audit category | CLOSED | I-031 high_pii sensitivity for exports |
| MEDIUM-8 v1.10 vs Release 2 | PARTIAL | Activation states separate them; "60% of v1.10 effort" still in Consequences (residue) |
| MEDIUM-9 [COUNSEL-REQUIRED] | PARTIAL | CCR key strengthened; Activation requirements §6 still uses [COUNSEL-REQUIRED] flag (residue) |
| LOW-10 entity list | CLOSED | DeIdentificationLevel = TYPES enum |
| LOW-11 Mode 2 derived summaries | CLOSED | Default-exclusion rule + per-DSA opt-in |

### Cross-coherence

| # | Status | Note |
|---|---|---|
| HIGH-1 invariant collision | CLOSED | Both ADRs aligned on I-023..I-027 = existing tenant/audit; new IDs I-029/030/031 for research |
| MEDIUM-2 third state | CLOSED | `consent_only` formally introduced |
| MEDIUM-3 fail-closed normalization | CLOSED | Both use enums + fail-closed defaults |
| MEDIUM-4 Phase 0 acceptance vs activation | PARTIAL | ADR-027 well-handled (Tier 1/Tier 2); ADR-028 still uses enum key incorrectly as `: true` (residue) |
| LOW-5 governance classes named | PARTIAL | ADR-027 names `protocol_authorized`; ADR-028 doesn't name class (residue) |

## NEW v0.2 issues

1. ADR-027 bool remnants — Activation mechanism uses `: true` for now-enum key
2. ADR-027 Ghana state contradiction — "What is NOT decided §3" says "false (or pending; effectively false)"
3. ADR-027 definition contradiction — Decision §7 vs "What is NOT decided §2" + Open Questions
4. ADR-028 k-threshold contradiction — Decision §4 vs "What is NOT decided §6"
5. ADR-028 permitted-domains contradiction — Decision §6 vs Open Questions
6. ADR-028 enum/bool mismatch — `research_data_partnership_active: true` vs enum
7. ADR-028 weak Supersedes — "Implicitly amends" remained while ADR-027 v0.2 strengthened to quote-style

---

## v0.3 patches applied 2026-05-01

All residue and new v0.2 issues fixed. Both ADRs now internally consistent.

**ADR-027 v0.3:**
- Bool remnants → `permitted` enum value throughout
- Ghana state in "What is NOT decided" → `pending_evidence`
- Open Questions → entries explicitly marked RESOLVED with v0.2/v0.3 reference
- Companion documents WORKLOAD_TAXONOMY → `protocol_authorized` named directly

**ADR-028 v0.3:**
- All `: true` references on enum key → `: active`
- "60% of v1.10 effort" → reframed as ~25 contract-edit rows + Release 2 implementation separate
- Activation requirements §6 [COUNSEL-REQUIRED] → structured CCR fields required
- "What is NOT decided" k-threshold → reframed as per-DSA increases (within bounds), k_min=11 decided
- Open Questions permitted-domains → marked RESOLVED with closed-enum reference
- WORKLOAD_TAXONOMY governance class → `autonomy_grant_required` named directly
- Supersedes → quote-style prior/replacement wording matching ADR-027

---

## Document control

- **v1.0 — 2026-05-01** — Codex verification pass on v0.2. Most prior findings CLOSED; 4 ADR-027 partial + 4 ADR-028 partial + 7 new v0.2 issues. Bottom line: not approval-ready; v0.3 cleanup required.
- **Status:** Delta artifact. v0.3 patches applied 2026-05-01. v0.3 verification pending.
