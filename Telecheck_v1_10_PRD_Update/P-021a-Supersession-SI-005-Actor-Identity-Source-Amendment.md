# Proposed Promotion Ledger entry P-021a — SI-005 actor-identity-source supersession (amends P-021 sub-decisions touching rejected SI-010 primitives onto the canonical middleware-GUC + JWT-verified-context model)

**Version:** 0.1 DRAFT
**Status:** BLOCKED-PENDING-SI-017-RATIFICATION + SI-018-RATIFICATION
**Authoring location:** `Telecheck_v1_10_PRD_Update/`
**Owner:** Engineering Lead + Async Consult slice owner
**Target P-NUM:** P-021a (supersession of P-021 SI-005)
**Related artifacts:**
- Promotion Ledger entry P-023a (SI-010 rejection)
- SI-017 v0.1 DRAFT (Phase 2 F-3 within canonical middleware-GUC model; prerequisite)
- SI-018 v0.2 DRAFT (audit-chain partition rule; prerequisite)
- P-018a + P-019a v0.1 DRAFTs (parallel supersessions; same pattern)
- Existing canonical P-021 entry — SI-005 `record_consult_clinician_decision()` + `rotate_consult_clinician_decision_kms()` SECURITY DEFINER procedures (line 491 of current ledger)

---

## 1. Why this supersession exists

Same trigger as P-018a / P-019a. SI-010 rejection per P-023a requires amending P-021's IMPL-readiness-blocking sub-decisions onto the canonical model. P-021 SI-005 has TWO SECURITY DEFINER procedures (`record_consult_clinician_decision()` + `rotate_consult_clinician_decision_kms()`); both reference SI-010 helpers and both need amending. Same single ratifier ceremony.

**Scope is explicitly narrow:** procedure design sub-decisions amended for actor-identity source + audit-emission location; all OTHER P-021 sub-decisions stand unchanged (including the 8-column flat KMS envelope mirroring SI-005's precedent, FK 6 + FK 7 triple-composite shapes, 5 clinician-decision column groups, two-tier append-only on consults, `consult_events` strict append-only via BEFORE UPDATE + BEFORE DELETE triggers, 11-step validation including auth-FIRST + advisory-lock for first-use idempotency-key race + idempotent-replay + audit-row consult-binding validation + atomic UPDATE + paired `consult_events` INSERT + unique_violation safety net, 7 rejection codes, etc.).

---

## 2. Proposed Promotion Ledger entry text

### Entry P-021a — 2026-05-19 (authored; ratification date TBD) — SI-005 actor-identity-source supersession: amend `record_consult_clinician_decision()` + `rotate_consult_clinician_decision_kms()` to source actor identity from canonical middleware-GUC + JWT-verified-context per SI-017 + SI-018 (supersedes P-021 sub-decision 8 portion + three-tier audit durability portion; preserves all other P-021 sub-decisions unchanged including the 11-step validation framework)

**Type:** Reconciliation entry (no Registry version bump).

**Status:** **RATIFIED IN INTENT [DATE TBD]**. **CANONICAL** after ratifier ceremony.

**Author:** Autonomous Claude (P-021a v0.1 DRAFT authored 2026-05-19).

**Trigger:** Same as P-018a / P-019a.

**Promotion class:** reconciliation.

**Sub-decision supersessions** (the only material changes vs the canonical P-021 entry):

1. **P-021 Sub-decision 8 (record_consult_clinician_decision() SECURITY DEFINER procedure 11-step validation) is AMENDED at the actor-identity-source step:** the procedure receives actor identity as parameters from JWT-verified application context (same pattern as P-018a / P-019a). The 11-step validation framework's auth-FIRST discipline is preserved unchanged at the policy level — the application middleware performs JWT verify + SI-017 liveness check + tenant resolution BEFORE the procedure is invoked, so the procedure's "auth-FIRST" step trusts the application-supplied parameters per I-023 layer 2. The advisory-lock + idempotent-replay + audit-row consult-binding validation + atomic UPDATE + paired `consult_events` INSERT + unique_violation safety net all preserved unchanged.
2. **`rotate_consult_clinician_decision_kms()` SECURITY DEFINER procedure is AMENDED (same actor-identity-source pattern as Sub-decision 8 above).** The KMS-rotation procedure trusts caller-supplied parameters from JWT context; does not re-verify identity at DB layer.
3. **P-021 three-tier audit durability sub-decision is AMENDED (same pattern as P-018a + P-019a):** Tier 1 audit emission moves to application-layer; Tiers 2 + 3 preserved; partition tier is **tier 2** per SI-018.

**Important preservation note for `consult_events` domain-event INSERT:** the P-021 procedure's "atomic UPDATE + paired `consult_events` INSERT" remains atomic INSIDE the procedure (per the original P-021 ratified design). `consult_events` is a DOMAIN-EVENT table (not the `audit_events` table); domain-event atomicity is a separate property from audit-event emission and stays inside the procedure. The amendment only moves the AUDIT-event emission (the `audit_events` table INSERT) to the application layer. This distinction is critical and matches the engineering-review answer's framing: application-transaction-level atomicity for audit; inside-procedure atomicity for domain events when needed.

**Preserved P-021 sub-decisions** (unchanged from the canonical P-021 entry):

- **CDM §4.27 Consult + §4.28 ConsultEvent entity expansions.**
- **2 triple-composite FKs (FK 6 + FK 7) referencing SI-008's `ai_workflow_executions` + SI-009's `sync_sessions`.**
- **5 clinician-decision column groups** (decided_by + class 5-value enum + at + audit_id + 8-column KMS envelope for rationale).
- **8-column flat KMS envelope mirroring SI-005's existing pattern.**
- **Two-tier append-only on consults clinician-decision columns** (Tier 0 identity immutable from INSERT + Tier 1 payload immutable post-decision; Tier 2 state-machine progression via guarded transitions).
- **CDM state-transition validator + strict append-only triggers** (`consults_state_transition_validator`, `consult_events_strict_append_only_*`).
- **7 rejection codes for the clinician-decision procedure.**
- All P-021 cross-artifact impact: CDM §4.27 + §4.28 entity expansions; AUDIT_EVENTS 3 net-new Cat A action IDs; DOMAIN_EVENTS v5.2 in-place 2 net-new types.

**Cluster B HARD-sequencing implication:** P-021a does NOT affect Cluster B HARD-sequencing closure (which already closed at SC3 P-021 ratification). The FK 6 + FK 7 references to SI-008 + SI-009 row shapes are unchanged.

**Engineering review grounding:** same as P-018a / P-019a — application-layer audit emission satisfies I-003 + HIPAA + BAA chain posture.

**Registry absorption:** No Registry version bump (reconciliation entry).

---

## 3. Sub-decisions for ratifier ceremony

Three sub-decisions, all APPROVED RECOMMENDATION:

### Sub-decision 1: Amend P-021 Sub-decision 8 (record_consult_clinician_decision() procedure actor-identity source)

Procedure receives actor identity as JWT-verified application-supplied parameters; 11-step validation framework preserved unchanged at policy level; auth-FIRST trust boundary is application middleware per I-023 layer 2.

**Recommendation: APPROVE.**

### Sub-decision 2: Amend rotate_consult_clinician_decision_kms() procedure (same pattern)

KMS-rotation procedure trusts caller-supplied parameters from JWT context.

**Recommendation: APPROVE.**

### Sub-decision 3: Amend P-021 three-tier audit durability sub-decision (audit-emission location)

Same as P-018a + P-019a. Important: domain-event (`consult_events`) atomicity stays inside procedure; audit-event (`audit_events`) emission moves to application layer.

**Recommendation: APPROVE.**

---

## 4. Open questions for ratifier

### Open Question 1: 11-step validation framework — does any step explicitly require server-trusted identity that the application layer can't satisfy?

The P-021 11-step validation framework's auth-FIRST step originally relied on SI-010 helpers for actor identity. With the supersession, the application performs JWT verify + SI-017 liveness check BEFORE invoking the procedure; the procedure's auth-FIRST step trusts the application-supplied parameters. Is this trust shift acceptable for the safety-critical clinical-decision-recording surface?

**Recommendation:** YES. The application-layer trust boundary is the canonical model's posture for every other clinical-decision-recording call (other slice PRDs follow this pattern). The 11-step validation's value is in the idempotency + concurrency + state-consistency checks (advisory-lock, CAS, append-only triggers), not in re-verifying the actor's identity at the DB layer — that's the application's job.

### Open Question 2: Codex pre-ratification target

**Recommendation:** 2 rounds + 1 verification. STOP-and-escalate per discipline floor.

---

## 5. Cross-artifact impact

Same as P-018a / P-019a — ZERO canonical contract amendments by P-021a directly.

---

## 6. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; **BLOCKED-PENDING-SI-017-RATIFICATION + SI-018-RATIFICATION.**

---

## 7. Sequence for ratification

Same as P-018a / P-019a — runs in parallel after SI-017 + SI-018 ratify.

---

**End of P-021a v0.1 DRAFT.**
