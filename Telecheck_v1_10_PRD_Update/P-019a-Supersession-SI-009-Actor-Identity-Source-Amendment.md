# Proposed Promotion Ledger entry P-019a — SI-009 actor-identity-source supersession (amends P-019 sub-decisions touching rejected SI-010 primitives onto the canonical middleware-GUC + JWT-verified-context model)

**Version:** 0.1 DRAFT
**Status:** BLOCKED-PENDING-SI-017-RATIFICATION + SI-018-RATIFICATION (the proposed supersession entry cites SI-017's canonical Phase 2 F-3 liveness pattern + SI-018's audit-chain partition rule; cannot ratify before its prerequisites ratify)
**Authoring location:** `Telecheck_v1_10_PRD_Update/` (workstream folder; the proposed entry text will be appended to `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Promotion_Ledger.md` when ratified)
**Owner:** Engineering Lead + Async Consult slice owner + Sync Consult slice owner
**Target P-NUM:** P-019a (supersession of P-019 SI-009; appended below P-019 in the canonical ledger per append-only discipline)
**Related artifacts:**
- Promotion Ledger entry P-023a (SI-010 rejection; explicitly queued P-018a/P-019a/P-021a supersession entries in §"Open follow-ups")
- SI-017 v0.1 DRAFT (Phase 2 F-3 within canonical middleware-GUC model; prerequisite)
- SI-018 v0.2 DRAFT (audit-chain partition rule; prerequisite)
- P-018a v0.1 DRAFT (parallel supersession; same pattern applied to SI-008 procedure)
- Existing canonical Promotion Ledger entry P-019 — SI-009 `record_consult_escalation_target_swap()` SECURITY DEFINER procedure (lines 575–576 of current ledger; the entry P-019a supersedes specific sub-decisions of)

---

## 1. Why this supersession exists

Same trigger as P-018a (see `P-018a-Supersession-SI-008-Actor-Identity-Source-Amendment.md` §1). The SI-010 trust-anchor layer rejection (per P-023a) requires amending the three downstream procedures' (P-018 / P-019 / P-021) IMPL-readiness-blocking sub-decisions onto the canonical middleware-GUC model.

P-019 SI-009 specifically has TWO sub-decisions referencing SI-010 primitives (more than P-018 or P-021 because P-019 line 576 explicitly enumerated the actor-identity-derivation in a separate sub-decision):

- **P-019 Sub-decision 3** (`record_consult_escalation_target_swap()` SECURITY DEFINER procedure): "DEFERRED to SI-010 landing per IMPL-readiness gate (the procedure cannot reference `_session_actor_context` helpers that don't exist...)"
- **P-019 Sub-decision 4** (Server-trusted actor identity via SET LOCAL-bound `_session_actor_context`): "caller-supplied actor identity REMOVED; procedure derives from `current_actor_*()` helpers... DEFERRED to SI-010 landing."

Both must be amended onto the canonical model. **Scope is explicitly narrow:** two sub-decisions change (procedure design + actor-identity-derivation); all other P-019 sub-decisions stand unchanged (including the 7-column `livekit_room_id` KMS envelope, four-predicate atomic UPDATE, 4-value cancellation_reason enum, etc.).

---

## 2. Proposed Promotion Ledger entry text

### Entry P-019a — 2026-05-19 (authored; ratification date TBD) — SI-009 actor-identity-source supersession: amend `record_consult_escalation_target_swap()` to source actor identity from canonical middleware-GUC + JWT-verified-context per SI-017 + SI-018 (supersedes P-019 sub-decisions 3 and 4; preserves all other P-019 sub-decisions unchanged)

**Type:** Reconciliation entry (no Registry version bump).

**Status:** **RATIFIED IN INTENT [DATE TBD]** (workstream lead chat-message sign-off pending; ratifier ceremony pending SI-017 + SI-018 ratification first). **CANONICAL** after ratifier ceremony.

**Author:** Autonomous Claude (P-019a v0.1 DRAFT authored 2026-05-19).

**Trigger:** Same as P-018a — SI-010 trust-anchor layer rejected per P-023a; P-019's references to SI-010 primitives must amend onto the canonical model.

**Promotion class:** reconciliation — supersedes specific sub-decisions of P-019, preserves all other P-019 sub-decisions, no new canonical content beyond SI-017 + SI-018.

**Sub-decision supersessions** (the only material changes vs the canonical P-019 entry):

1. **P-019 Sub-decision 3 (record_consult_escalation_target_swap() SECURITY DEFINER procedure) is AMENDED:** the procedure's actor-identity source changes from "SI-010 `current_actor_*()` helpers reading from `_session_actor_context` table" (rejected per P-023a) to **"caller-supplied actor identity parameters (p_account_id, p_tenant_id, p_role, p_admin_home_tenant_id, p_session_id) sourced from the authContextPlugin's JWT-verified middleware-resolved actor context per SI-017."** Application bears trust-boundary responsibility (same as every RPC per I-023 layer 2). Procedure does NOT re-verify identity at the DB layer.
2. **P-019 Sub-decision 4 (Server-trusted actor identity via SET LOCAL-bound _session_actor_context) is SUPERSEDED ENTIRELY:** the original sub-decision specifically named the SI-010 primitives (`_session_actor_context` table; `current_actor_*()` helpers; `SET LOCAL` binding pattern). The amendment replaces this with **"actor identity is supplied as procedure parameters by the application's JWT-verified middleware-resolved context per SI-017's Phase 2 F-3 canonical liveness check; cross-request bleed on pooled connections is prevented by pgbouncer transaction-mode + middleware that always issues SET LOCAL app.tenant_id per request (canonical model's existing guarantee per System Architecture v1.2 §5)."** The R5+R6 closures of SI-010's original Codex pre-ratification cycle (2026-05-15) that motivated the procedure-side trust-anchor are addressed differently: the canonical model's per-request SET LOCAL discipline (formalized in middleware) is the trust boundary; the procedure trusts caller-supplied parameters that the application has already JWT-verified.
3. **P-019 three-tier audit durability sub-decision is AMENDED (same pattern as P-018a):** Tier 1 audit emission moves from inside-procedure to application-layer immediately after procedure-success per the engineering-review-grounded canonical pattern. Tiers 2 + 3 preserved. Audit event partition tier is **tier 2** per SI-018's canonical rule (`tenant_id` of operating tenant; governance-class Cat B).

**Preserved P-019 sub-decisions** (unchanged from the canonical P-019 entry):

- **CDM v1.5 §4.24 NEW entity expansion (SyncSession)** — 13 columns per SI-009 v0.X plus 7 columns KMS envelope for `livekit_room_id` = 20 total. Triple-composite UNIQUE `(tenant_id, originating_consult_id, id)`. Forward pointer + four-predicate atomic UPDATE.
- **`livekit_room_id` encrypted at rest via 7-column KMS envelope** (privacy judgment ratified at SC2 sub-decision #5).
- **Cancellation reason 4-value enum**.
- All P-019 cross-artifact impact: CDM §4.24 SyncSession entity expansion; AUDIT_EVENTS 7 net-new Cat C action IDs (sync_session.*); DOMAIN_EVENTS amend-in-place 3 net-new event types.

**Changes (to be ratified at P-019a ratifier ceremony):**

```
BEFORE (referenced SI-010, now rejected):
  Procedure parameter / derivation:
    p_consult_id, p_new_sync_session_id, p_expected_prior_sync_session_id
    (no actor parameters; identity derived from SI-010 helpers)

  Inside procedure:
    actor_account_id := current_actor_account_id()
    actor_tenant_id  := current_actor_account_tenant_id()
    actor_role       := current_actor_role()
    -- helpers read from _session_actor_context table (SI-010)

AFTER (canonical middleware-GUC model per SI-017):
  Procedure parameters (extended):
    p_consult_id, p_new_sync_session_id, p_expected_prior_sync_session_id,
    p_account_id, p_tenant_id, p_role, p_admin_home_tenant_id, p_session_id
    (actor parameters caller-supplied from JWT context)

  Inside procedure:
    -- application is responsible for parameter validity per I-023 layer 2;
    -- procedure trusts parameters (same trust boundary as every other RPC)
    -- RLS via current_setting('app.tenant_id') enforces tenant isolation
    -- at the row level (canonical CDM v1.2 contract)
```

Three-tier audit durability amendment: same shape as P-018a §2 (Tier 1 moves to application; Tiers 2 + 3 unchanged; partition tier 2).

**Engineering review grounding:** same as P-018a — application-layer audit emission satisfies I-003 + HIPAA + BAA chain posture per the unanimous NO answer at `Telecheck_v1_10_PRD_Update/Engineering-Review-Request-I-003-Atomic-Audit-Inside-vs-Application-Layer-Audit-2026-05-19.md`.

**Cross-references:** same as P-018a (P-023a + SI-017 + SI-018 + Engineering Review Request).

**Cluster B HARD-sequencing implication:** P-019a does NOT affect Cluster B HARD-sequencing closure. SI-009's `sync_sessions` entity is canonical and SI-005's FK 7 references it; that cross-SI dependency is unchanged.

**Registry absorption:** No Registry version bump (reconciliation entry).

---

## 3. Sub-decisions for ratifier ceremony

Three sub-decisions, all APPROVED RECOMMENDATION:

### Sub-decision 1: Amend P-019 Sub-decision 3 (procedure design)

Same as P-018a Sub-decision 1 pattern, applied to `record_consult_escalation_target_swap()`.

**Recommendation: APPROVE.**

### Sub-decision 2: Supersede P-019 Sub-decision 4 ENTIRELY (Server-trusted actor identity)

The original sub-decision was named for SI-010 primitives. The supersession replaces it with the canonical middleware-GUC pattern + per-request SET LOCAL discipline.

**Recommendation: APPROVE.**

### Sub-decision 3: Amend P-019 three-tier audit durability sub-decision (audit-emission location)

Same as P-018a Sub-decision 2 pattern.

**Recommendation: APPROVE.**

---

## 4. Open questions for ratifier

### Open Question 1: Should SI-009.1 successor SI (multi-participant + recording scaffold) align with the same pattern?

SI-009.1 is a separate successor SI (P-020 target; pre-ratification gate pending; per Promotion Ledger P-019 cascade). If P-019a ratifies the new actor-identity-source pattern for SI-009 original-scope, should SI-009.1 align? Almost certainly YES, but the alignment lands at SI-009.1's own ratifier ceremony, not P-019a's.

**Recommendation:** flag for SI-009.1 ratifier ceremony; not gated on this P-019a.

### Open Question 2: Codex pre-ratification target

**Recommendation:** 2 rounds + 1 verification = 3 total. STOP-and-escalate per the discipline floor.

---

## 5. Cross-artifact impact

Same as P-018a — ZERO canonical contract amendments by P-019a directly.

---

## 6. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review; **BLOCKED-PENDING-SI-017-RATIFICATION + SI-018-RATIFICATION.**

---

## 7. Sequence for ratification

Same as P-018a (run in parallel with P-018a + P-021a after SI-018 + SI-017 ratify).

---

**End of P-019a v0.1 DRAFT.**
