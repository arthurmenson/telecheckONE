# Codex Round-6 Verification — v1.10.1 Hygiene Cycle Round-5 Patches

**Branch:** v1.10.1-hygiene-cycle | HEAD: e266e3a
**Path:** c4995db → c34ad24 → cb57d8b → 3984c9b → 02c91ca → e266e3a
**Convergence:** R1 8 findings → R2 9 → R3 5 → R4 9 → R5 7 → R6 ?

## Round-5 patches landed (e266e3a)

### Scope 1 (Clinical safety) MEDIUM
AUDIT_EVENTS envelope enum strings updated to include `rejected_invalid_attempt` sentinel with explicit carve-out (valid only on `*.execution_rejected` envelope).

### Scope 2 (Privacy) HIGH
AUDIT_EVENTS two-event audit pattern for failed exports: MAY → MUST for both `research.export_completed(status=invalidated)` AND `signal_enforcement_trigger` paired-emit. Mirrored MUST in STATE_MACHINES + bare-suppression anti-pattern.

### Scope 3 (Regulatory) HIGH x2
- ADR-028 open question line 260 RESOLVED to gated-at-launch (replacing prior live-at-launch working answer).
- OR-116 REC partnership designation gating: required before per-country activation, not a launch prerequisite.

### Scope 4 (Brand structure C3) HIGH x3
- Registry line 134: `Heros (US tenant)` → `Telecheck-US (Heros Health DBA; operated by Telecheck Health LLC)` with full BAA chain.
- EHBG CLAUDE.md template (lines 669-671): operating-tenant + DBA + legal-entity + consumer-subdomain framing.
- OR-303 status history: appended 2026-05-02 supersession entry restating the canonical 3-party chain.

## Verification ask per scope

For each, verify the round-5 patch closes the round-5 finding with no regression and no new HIGH/MEDIUM. Cross-contract consistency check still required.

If 0 HIGH / 0 MEDIUM across all 4 scopes → v1.10.1 hygiene cycle EXIT.
