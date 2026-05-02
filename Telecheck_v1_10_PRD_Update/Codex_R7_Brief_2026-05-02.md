# Codex Round-7 Verification — v1.10.1 Hygiene Cycle Round-6 Patches

**Branch:** v1.10.1-hygiene-cycle | HEAD: 3e758b5
**Path:** c4995db → c34ad24 → cb57d8b → 3984c9b → 02c91ca → e266e3a → 3e758b5
**Convergence:** R1 8 → R2 9 → R3 5 → R4 9 → R5 7 → R6 7 → R7 ?

## Round-6 patches landed (3e758b5)

### Scope 1 (Clinical safety) — 2 MEDIUM
- AUDIT_EVENTS prescribing.approved + sibling rows now require ai_workload_type + autonomy_level for all I-012 actions (with "n/a" carve-out for clinician-only approvals).
- AUTONOMY_LEVELS §5 rules 1 and 3: `workload_type` → `ai_workload_type` (canonical field name alignment).

### Scope 2 (Privacy) — 2 HIGH
- GOVERNANCE_CONTROLS §7.2 audit-path discipline: MAY → MUST for both audit records.
- DOMAIN_EVENTS research_export.delivered notes: MAY → MUST for failed-completion audit emission.

### Scope 3 (Regulatory) — HIGH-1 + MEDIUM
- MARKET_LAUNCH: explicit Stage 1 `inactive → consent_only` activation gate added (6 conditions); prior gate renamed Stage 2 `consent_only → active`.
- OR-117 gating updated to per-country activation precondition (matches OR-116).

### Scope 4 (Brand structure C3) — HIGH x2
- Registry Decision 6 EHBG canonical version corrected v1.2 → v1.3.
- EHBG body line 61 (v1.3-summary item 9) rewritten with operating-tenant + DBA framing.

## Verification ask per scope

For each, verify the round-6 patch closes the round-6 finding with no regression and no new HIGH/MEDIUM. Cross-contract consistency check still required.

If 0 HIGH / 0 MEDIUM across all 4 scopes → v1.10.1 hygiene cycle EXIT.
