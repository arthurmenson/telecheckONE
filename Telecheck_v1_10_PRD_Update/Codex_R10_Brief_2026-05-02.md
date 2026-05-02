# Codex Round-10 Verification — v1.10.1 Hygiene Cycle Round-9 Patches

**Branch:** v1.10.1-hygiene-cycle | HEAD: 5029583
**Convergence:** R1 8 → R2 9 → R3 5 → R4 9 → R5 7 → R6 7 → R7 9 → R8 6 → R9 7 → R10 ?

## Round-9 patches landed (5029583)

- AUDIT_EVENTS §I-012 closure rule declares authoritative I-012 action-class set; WORKLOAD_TAXONOMY n/a sentinel points back to AUDIT_EVENTS.
- WORKLOAD_TAXONOMY field-name corrected `actor.type` → `actor_type`.
- Master PRD line 27 I-029 expanded to canonical 5-condition gate.
- STATE_MACHINES doc-control summary updated to 5-condition.
- CCR_RUNTIME v5.2 doc-control launch defaults updated from `consent_only` → `inactive`.
- REC_IRB engagement-protocol rewritten as two-step workflow (Step 1 BEFORE inactive→consent_only; Step 2 BEFORE consent_only→active).
- Registry rows 10 + 10a (ADR Addenda) added C3 + canonical-BAA-chain supersession-in-interpretation notes.

## Verification ask per scope

For each, verify the round-9 patch closes the round-9 finding with no regression. **Convergence pattern (9 rounds, ~7 findings/round): expect long-tail cross-references.** If 0/0 across 4 scopes → cycle EXIT.
