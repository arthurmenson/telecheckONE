# Codex Round-5 Verification — v1.10.1 Hygiene Cycle Round-4 Patches

**Branch:** v1.10.1-hygiene-cycle | HEAD: 02c91ca
**Path:** c4995db → c34ad24 → cb57d8b → 3984c9b → 02c91ca

## Round-4 patches landed (02c91ca)

### Scope 1 (Clinical safety) — 2 MEDIUM
- Added `rejected_invalid_attempt` sentinel to canonical AIWorkloadType enum (WORKLOAD_TAXONOMY) + AutonomyLevel enum (AUTONOMY_LEVELS) + TYPES operative shapes.
- STATE_MACHINES ProtocolAuthorizedAction §10.4 envelope-population rule (envelope populated from attempted_* values; sentinel for null/unknown/reserved).

### Scope 2 (Privacy) — 2 HIGH
- GOVERNANCE_CONTROLS §7.2 rewritten to canonical 5-condition matrix matching AUDIT_EVENTS/TYPES/STATE_MACHINES/OpenAPI.
- INVARIANTS I-029 expanded from 3-condition to canonical 5-condition gate.

### Scope 3 (Regulatory) — 3 HIGH + 1 MEDIUM
- Master PRD §7.10 fifth-tier consent sentence rewritten "launch-active" → "gated at launch".
- ADR-028 in-scope table rows updated to `inactive at v1.0 launch`.
- Master PRD pre-launch row 12 reworded.
- Artifact Registry §6 entry 10 ADR-028 framing updated.

### Scope 4 (Brand structure C3) — N/A (round-4 EPERM-crashed; this is the first verification firing)

## Verification ask per scope

For each, verify the round-4 patch closes the round-4 finding with no regression. **Scope 4 is a fresh verify covering all round-3 brand-structure patches (Boot Sequence §6, OR-303 + OR-234) plus any other surviving bare-Heros or BAA-chain inconsistencies.**

If 0 HIGH / 0 MEDIUM across all 4 scopes → v1.10.1 hygiene cycle EXIT.
