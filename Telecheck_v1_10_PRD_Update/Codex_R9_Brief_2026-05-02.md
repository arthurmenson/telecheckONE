# Codex Round-9 Verification — v1.10.1 Hygiene Cycle Round-8 Patches

**Branch:** v1.10.1-hygiene-cycle | HEAD: 7a4a71a
**Path:** c4995db → c34ad24 → cb57d8b → 3984c9b → 02c91ca → e266e3a → 3e758b5 → 1eb97b0 → 7a4a71a
**Convergence:** R1 8 → R2 9 → R3 5 → R4 9 → R5 7 → R6 7 → R7 9 → R8 6 → R9 ?

## Round-8 patches landed (7a4a71a)

### Scope 1 (Clinical safety) HIGH
- WORKLOAD_TAXONOMY n/a sentinel description broadened to authoritative AUDIT_EVENTS I-012 action-class set.

### Scope 2 (Privacy) HIGH
- Master PRD I-029 invariant statement expanded from 3-condition to canonical 5-condition gate.

### Scope 3 (Regulatory) HIGH x2
- Registry CCR_RUNTIME launch defaults updated to `inactive`.
- REC_IRB_Engagement.md split into Stage 1 / Stage 2 duties.

### Scope 4 (Brand structure C3) HIGH+MEDIUM
- CDM §9 migration block rewritten for canonical `tenants` table + staged DDL + complete INSERT.
- STATE_MACHINES Subscription intro rewritten with operating-tenant + DBA framing.

## Verification ask per scope

For each, verify the round-8 patch closes the round-8 finding with no regression and no new HIGH/MEDIUM. **Per cycle convergence pattern (8 rounds, ~7 findings/round average), expect long-tail; if 0/0 not reached, accept residual MEDIUM/LOW as documentary-cycle minimum.**

If 0 HIGH / 0 MEDIUM across all 4 scopes → v1.10.1 hygiene cycle EXIT.
