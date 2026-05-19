# PROPOSED Promotion Ledger entries — 5 new entries for the lockstep PR-A2-class commit (2026-05-19)

**Status:** PROPOSED — awaiting Evans's ratification of (a) SI-018 partition rule, (b) cross-PR OQ3 Option A (I-032), (c) SI-017-OQ-MISMATCH A2+B2+C, (d) SI-017 itself, (e) P-018a/P-019a/P-021a supersessions.
**Target file:** `Telecheck Master Bundle FINAL US REGION BASELINE/Telecheck_Promotion_Ledger.md` (append-only — NEVER edit existing entries).
**Authority:** application requires Evans's chat-message ratification per CLAUDE.md hard-floor item 3.
**P-NUM verification:** P-024 and P-025 are the next-available P-NUMs per `Telecheck_Artifact_Registry_v2_10.md`. Supersession entries use the established `-a` suffix pattern. Claude will verify P-NUM assignments are still correct at lockstep-commit time before apply.

---

## §P-024 — Entry text (SI-018 ratification)

> ### Entry P-024 — 2026-05-XX (DATE TBD at ratifier ceremony) — SI-018 ratification: canonical audit-chain partition rule (two-tier hybrid P1 patient-bound + P2 tenant-governance; Cluster B HARD-sequencing structurally orthogonal)
>
> **Type:** Content-change promotion — **ratification-intent recorded in PR-A2′′-class lockstep commit; physical content + Registry +1 minor bump LAND TOGETHER in this commit** per the lockstep invariant.
>
> **Status:** **RATIFIED 2026-05-XX** (workstream lead Evans chat-message sign-off via the SI-018 Decision Brief at `Telecheck_v1_10_PRD_Update/Decision-Brief-SI-018-Audit-Chain-Partition-Rule-2026-05-19.md`; Codex pre-ratification trail: 5 rounds R1→R5 with R5 APPROVE 2026-05-19 on PR #14).
>
> **Author:** Autonomous Claude (SI-018 v0.2 authored 2026-05-19 in PR #14 after the SI-010 trust-anchor rejection cycle clarified the audit-chain partition gap; Decision Brief authored same day; 5-round Codex convergence).
>
> **Trigger:** Codex R1 on SI-017 PR #13 (2026-05-19, review-mpckt9xo-nbawh9) flagged that SI-017 was inventing a tenant-keyed audit-chain partition outside the canonical AUDIT_EVENTS contract. The fix required a canonical-contract amendment authorizing the partition rule. SI-018 is that amendment.
>
> **Promotion class:** content-change. New AUDIT_EVENTS canonical text (§"Hash-chain partition rule") + new structural partition contract. Registry +1 minor bump applies in lockstep with this entry.
>
> **Ratifier sub-decisions explicitly approved IN P-024 scope (3 of 3):**
>
> - Sub-decision #1 Two-tier hybrid partition (P1 patient-bound + P2 tenant-governance) deterministic per-event: **APPROVED**
> - Sub-decision #2 Per-event partition tier enumerated in each AUDIT_EVENTS catalog row (no caller choice; no application-state-derived routing): **APPROVED**
> - Sub-decision #3 Independent hash chains per partition tier + per partition_key; cross-partition linkage NOT supported at envelope time: **APPROVED**
>
> **Changes (physical content landing IN this commit):**
>
> 1. **AUDIT_EVENTS §"Hash-chain partition rule"** — canonical text per `Proposed-AUDIT_EVENTS-Amendments-2026-05-19.md` §1. P1 = `SHA-256("GENESIS:PATIENT:<target_patient_id>")` if `target_patient_id IS NOT NULL`; P2 = `SHA-256("GENESIS:TENANT:<tenant_id>")` if `target_patient_id IS NULL`.
> 2. **AUDIT_EVENTS bump** v5.X → v5.X+1 (canonical text added; partition rule structural).
> 3. **Checkpoint format canonicalized**: `(tier, partition_key, latest_record_hash)` with integer-tier primary sort.
> 4. **I-027 preservation**: append-only invariant unchanged; partition rule does not allow rewriting historical partitions.
>
> **Codex pre-ratification trail (5 rounds; 5 substantive findings closed):**
>
> - R1 (review-mpcl…): variable-tier rows not deterministic + tier-3 violation of I-027. → Closed by dropping tier 3, deterministic two-tier hybrid.
> - R2-R3-R4: prose-consistency findings (missed tier-3 references; linked_events[] overloading; checkpoint sort ambiguity). → Closed inline.
> - R5: APPROVE clean.
>
> **Cross-artifact impact:** AUDIT_EVENTS canonical contract amendment (structural). NO CDM changes. NO State Machines changes. NO INVARIANTS changes (partition rule is AUDIT_EVENTS-internal).
>
> **Registry absorption:** v2.12 → v2.13 consolidated with SI-017 + I-032 + supersessions in single lockstep commit.

---

## §P-025 — Entry text (SI-017 ratification + Sub-decision 4.5)

> ### Entry P-025 — 2026-05-XX (DATE TBD) — SI-017 ratification: Phase 2 F-3 JWT session-liveness check within canonical app.tenant_id middleware-GUC + Sub-decision 4.5 mismatch path (A2+B2+C: separate Cat A event partitioned by session-row-tenant + merge-blocking regression test)
>
> **Type:** Content-change promotion.
>
> **Status:** **RATIFIED 2026-05-XX** (Evans chat-message sign-off via Decision Brief at `Decision-Brief-SI-017-Phase-2-F3-JWT-Liveness-2026-05-19.md` + Decision Memo at `Decision-Memo-SI-017-OQ-MISMATCH-A2-B2-C-Adopted-2026-05-19.md`).
>
> **Author:** Autonomous Claude. SI-017 v0.2 authored 2026-05-19 after SI-010 trust-anchor rejection (P-023a). Codex R1 closed by spawning SI-018 (parallel); Codex R2 HALTED at architectural-judgment per CLAUDE.md hard-floor item 6; resolved via SI-017-OQ-MISMATCH Decision Memo adopting A2+B2+C.
>
> **Trigger:** SI-010 (Session Actor Context DB Binding) was REJECTED per P-023a 2026-05-19. The canonical middleware-GUC tenant-binding pattern needed a replacement for the rejected DB-side trust anchor. SI-017 provides the canonical Phase 2 F-3 session-liveness check within the existing `app.tenant_id` middleware-GUC model (no DB-side trust anchor; application middleware is the single trust anchor per the canonical SI-017 authContextPlugin contract).
>
> **Promotion class:** content-change. AUDIT_EVENTS adds 2 new action IDs (1 Cat B + 1 Cat A).
>
> **Ratifier sub-decisions explicitly approved IN P-025 scope (6 of 6):**
>
> - Sub-decision #1 authContextPlugin liveness check fires per-request after JWT verify: **APPROVED**
> - Sub-decision #2 No cache at v1.0: **APPROVED**
> - Sub-decision #3 Fail-closed (UnauthenticatedError + 401): **APPROVED**
> - Sub-decision #4 `identity.session_liveness_check_failed` Cat B event, SI-018 P2 partition keyed on `tenant_id_claimed`: **APPROVED**
> - **Sub-decision #4.5** (NEW): `identity.session_jwt_tenant_id_mismatch` Cat A event, SI-018 P2 partition keyed on `auth.sessions.tenant_id` (session-row-tenant, NOT claim-side per B2), merge-blocking regression test per C: **APPROVED**
> - Sub-decision #5 Performance — no cache; revisit in v1.1: **APPROVED**
>
> **Changes (physical content landing IN this commit):**
>
> 1. **AUDIT_EVENTS Cat B `identity.session_liveness_check_failed`** — canonical text per `Proposed-AUDIT_EVENTS-Amendments-2026-05-19.md` §3.
> 2. **AUDIT_EVENTS Cat A `identity.session_jwt_tenant_id_mismatch`** — canonical text per §4.
> 3. **AUDIT_EVENTS bump** v5.X → v5.X+1 (consolidated with P-024's bump; v5.5 destination if both land in single lockstep commit).
> 4. **§7 Test 7.X (merge-blocking)** added — per `Proposed-SI-017-Sub-decision-4.5-Mismatch-Path-2026-05-19.md` §2.
>
> **Codex pre-ratification trail (2 rounds + escalation; 2 substantive findings):**
>
> - R1 (review-mpckt9xo-nbawh9): NO-SHIP; tenant-keyed audit primitive without canonical-contract authorization. → Closed via SI-018 spawn (P-024 above).
> - R2 (review-mpcpoqbq-qjpw0j): NO-SHIP; tenant-claim mismatch unresolved (architectural-judgment per hard-floor item 6). → HALTED at R2; escalated as SI-017-OQ-MISMATCH; resolved via A2+B2+C Decision Memo; Sub-decision 4.5 applied.
> - (R3 post-application verification: TO RUN at lockstep-commit time; expected APPROVE.)
>
> **Cross-artifact impact:** AUDIT_EVENTS +2 action IDs. NO CDM changes. NO State Machines changes. NO INVARIANTS changes from SI-017 itself (I-032 is the parallel cross-PR OQ3 contribution).
>
> **Unblocks:** P-018a + P-019a + P-021a supersession entries (they cite SI-017's canonical authContextPlugin contract).

---

## §P-018a — Entry text (SI-008 actor-identity-source supersession)

> ### Entry P-018a — 2026-05-XX (DATE TBD) — SI-008 actor-identity-source supersession: amend `record_workflow_pointer_swap()` to source actor identity from canonical middleware-GUC + JWT-verified-context per SI-017 + SI-018 + I-032 (supersedes P-018 Sub-decisions 8 + 10 portions; preserves all other P-018 sub-decisions unchanged)
>
> **Type:** Reconciliation entry (no Registry version bump from P-018a alone; lockstep bump is consolidated).
>
> **Status:** **RATIFIED 2026-05-XX** (Evans chat-message sign-off via Decision Brief at `Decision-Brief-P-018a-SI-008-Supersession-2026-05-19.md`).
>
> **Author:** Autonomous Claude. P-018a v0.1 authored 2026-05-19 in PR #16; Codex R2 APPROVE; retroactive OQ3 alignment commit f65069f; I-032 STEP 0 applied per `Proposed-SECURITY-DEFINER-Procedure-Amendments-2026-05-19.md` §SI-008.
>
> **Trigger:** SI-010 trust-anchor rejected per P-023a; P-018 Sub-decisions 8 + 10 referenced SI-010 primitives; must amend onto canonical model.
>
> **Promotion class:** reconciliation.
>
> **Sub-decision supersessions:**
>
> 1. **P-018 Sub-decision 8 (procedure design) AMENDED at actor-identity-source step:** caller-supplied JWT-verified actor parameters per SI-017; `current_actor_*()` helpers NOT used.
> 2. **P-018 Sub-decision 10 (three-tier audit durability) AMENDED:** audit-emission LOCATION moves to application-layer (D1 in renamed framework); D2 + D3 preserved; SI-018 P2 partition tier.
> 3. **NEW STEP 0 — I-032 Tenant-GUC equality guard** added to `record_workflow_pointer_swap()` procedure (rejects with `tenant_guc_mismatch` if `p_tenant_id <> current_setting('app.tenant_id', true)`).
>
> **Rejection code set update:** 5 → 6 codes (added `tenant_guc_mismatch`).
>
> **Preserved P-018 sub-decisions** (unchanged): all 5-state vocab + Pattern A pin + TOAST-BYTEA + 8-column KMS envelope + composite FK rules + bidirectional pointer invariant + CAS-and-supersession + supersedes_execution_id immutability + 5 original rejection codes + CDM §4.23 + AUDIT_EVENTS + DOMAIN_EVENTS amendments.
>
> **Codex pre-ratification trail:** R1 needs-attention (3 in-scope findings closed inline; commit 81457b5) → R2 APPROVE → retroactive OQ3 alignment commit f65069f.
>
> **Cross-artifact impact:** ZERO canonical-contract amendments by P-018a directly. Uses SI-017 + SI-018 + I-032 by reference.

---

## §P-019a — Entry text (SI-009 actor-identity-source supersession)

> ### Entry P-019a — 2026-05-XX (DATE TBD) — SI-009 actor-identity-source supersession: amend `record_consult_escalation_target_swap()` to source actor identity from canonical middleware-GUC + JWT-verified-context per SI-017 + SI-018 + I-032 (supersedes P-019 Sub-decisions 3 + 4 + three-tier audit durability sub-decision; preserves all other P-019 sub-decisions unchanged)
>
> **Type:** Reconciliation entry (no Registry version bump from P-019a alone; lockstep consolidated).
>
> **Status:** **RATIFIED 2026-05-XX** (Evans chat-message sign-off via Decision Brief at `Decision-Brief-P-019a-SI-009-Supersession-2026-05-19.md`).
>
> **Author:** Autonomous Claude. P-019a v0.1 authored 2026-05-19 in PR #17; Codex R2 APPROVE; retroactive OQ3 alignment commit 6298f8e; I-032 STEP 0 applied per `Proposed-SECURITY-DEFINER-Procedure-Amendments-2026-05-19.md` §SI-009.
>
> **Trigger:** SI-010 rejected per P-023a; P-019 Sub-decision 3 (procedure design) + Sub-decision 4 (Server-trusted actor identity via SET LOCAL-bound `_session_actor_context`) referenced SI-010 primitives; must amend onto canonical model.
>
> **Promotion class:** reconciliation.
>
> **Sub-decision supersessions:**
>
> 1. **P-019 Sub-decision 3 (procedure design) AMENDED:** caller-supplied JWT-verified actor parameters per SI-017.
> 2. **P-019 Sub-decision 4 (Server-trusted actor identity) SUPERSEDED ENTIRELY:** SI-010 primitives gone; replaced with canonical SI-017 authContextPlugin + pgbouncer transaction-mode + SET LOCAL discipline per System Architecture v1.2 §5.
> 3. **P-019 three-tier audit durability sub-decision AMENDED:** audit-emission LOCATION moves to application-layer; D1/D2/D3 relabeled; SI-018 P2 partition tier.
> 4. **NEW STEP 0 — I-032 Tenant-GUC equality guard** added to `record_consult_escalation_target_swap()`.
>
> **Rejection code set update:** add `tenant_guc_mismatch` to P-019's existing set.
>
> **Preserved P-019 sub-decisions:** 13-column SyncSession schema + 7-column livekit_room_id KMS envelope + four-predicate atomic UPDATE + 4-value cancellation_reason enum + triple-composite UNIQUE shape + FK 7 row shape unchanged.
>
> **Codex pre-ratification trail:** R1 needs-attention (HIGH-1 trust-boundary + MED-1 line citations; line citations closed inline at commit 9bc3011; HIGH-1 closed via cross-PR OQ3 Option A Decision Memo) → R2 APPROVE → retroactive OQ3 alignment commit 6298f8e.
>
> **Cross-artifact impact:** ZERO canonical-contract amendments by P-019a directly.

---

## §P-021a — Entry text (SI-005 actor-identity-source supersession)

> ### Entry P-021a — 2026-05-XX (DATE TBD) — SI-005 actor-identity-source supersession: amend `record_consult_clinician_decision()` + `rotate_consult_clinician_decision_kms()` to source actor identity from canonical middleware-GUC + JWT-verified-context per SI-017 + SI-018 + I-032 (supersedes P-021 Sub-decision #5 + audit-emission location; preserves 11-step validation framework + all other P-021 sub-decisions)
>
> **Type:** Reconciliation entry (no Registry version bump from P-021a alone; lockstep consolidated).
>
> **Status:** **RATIFIED 2026-05-XX** (Evans chat-message sign-off via Decision Brief at `Decision-Brief-P-021a-SI-005-Supersession-2026-05-19.md`).
>
> **Author:** Autonomous Claude. P-021a v0.1 authored 2026-05-19 in PR #18; 3-round Codex pre-ratification trail (R1 closure inline + R2 closure inline + R3 STOP-and-queue at hard-floor item 6); cross-PR OQ3 resolved via Decision Memo Option A; I-032 STEP 0 applied per `Proposed-SECURITY-DEFINER-Procedure-Amendments-2026-05-19.md` §SI-005-record + §SI-005-rotate.
>
> **Trigger:** SI-010 rejected per P-023a; P-021 Sub-decision #5 referenced SI-010 primitives; must amend onto canonical model.
>
> **Promotion class:** reconciliation.
>
> **Sub-decision supersessions:**
>
> 1. **P-021 Sub-decision #5 (record_consult_clinician_decision actor-identity source) AMENDED:** caller-supplied JWT-verified actor parameters per SI-017; 11-step validation framework's auth-FIRST trust boundary is application middleware per I-023 layer 2; advisory-lock + idempotent-replay + audit-row consult-binding + atomic UPDATE + paired `consult_events` INSERT + unique_violation safety net preserved unchanged.
> 2. **`rotate_consult_clinician_decision_kms()` procedure AMENDED** (same actor-identity-source pattern; not separately numbered in canonical P-021 but per P-023 lines 257 + 263 enumeration).
> 3. **Audit-emission LOCATION within Sub-decision #5's 11-step validation framework AMENDED:** moves to application-layer; D1/D2/D3 relabel; record_consult_clinician_decision audit lives in P1 (patient-bound).
> 4. **`rotate_consult_clinician_decision_kms()` audit partition tier NORMATIVELY BOUND to procedure-validated rotation scope:** `p_rotation_scope` MANDATORY closed enum + `p_target_patient_id` MANDATORY with scope-consistency CHECK + procedure returns `(affected_row_count, affected_patient_id_set)` for application-layer envelope construction. 3 new rejection codes (`invalid_rotation_scope`, `scope_target_mismatch`, `rotation_scope_violation`).
> 5. **NEW STEP 0 — I-032 Tenant-GUC equality guard** added to BOTH procedures.
>
> **Rejection code set update:**
> - `record_consult_clinician_decision`: 7 → 8 codes (added `tenant_guc_mismatch`).
> - `rotate_consult_clinician_decision_kms`: Sub-decision 4's 3 new codes + `tenant_guc_mismatch` = 4 codes for this procedure.
>
> **Preserved P-021 sub-decisions:** CDM §4.27 Consult + §4.28 ConsultEvent entity expansions + 2 triple-composite FKs (FK 6 + FK 7) + 5 clinician-decision column groups + 8-column flat KMS envelope + two-tier append-only on consults + CDM state-transition validator + strict append-only triggers + 7 original rejection codes + AUDIT_EVENTS 3 net-new Cat A action IDs + DOMAIN_EVENTS amendments.
>
> **Critical preservation note** (preserved verbatim from P-021a §2): the `consult_events` paired INSERT remains atomic INSIDE the procedure (per the unchanged "atomic UPDATE + paired `consult_events` INSERT" step). `consult_events` is a DOMAIN-EVENT table, not the `audit_events` table; domain-event atomicity is separate from audit-event emission and stays inside the procedure.
>
> **Codex pre-ratification trail:** R1 closure inline (rotate_kms partition normative; commit bbeefb7) → R2 closure inline (Sub-decision 4 tightening with mandatory enum + procedure-validated return; commit 4497668) → R3 STOP-and-queue at hard-floor item 6 (trust-boundary closure framing; commit 018ef75); resolved via cross-PR OQ3 Option A Decision Memo + I-032 STEP 0.
>
> **Cross-artifact impact:** ZERO canonical-contract amendments by P-021a directly.

---

## Consolidated Registry bump

A single Artifact Registry bump v2.12 → v2.13 in the lockstep PR-A2-class commit covers:

- P-024 (SI-018 partition rule) — AUDIT_EVENTS structural amendment
- P-025 (SI-017 + Sub-decision 4.5) — 2 new AUDIT_EVENTS action IDs
- I-032 (cross-PR OQ3 Option A) — INVARIANTS amendment + 1 new AUDIT_EVENTS action ID + 1 new rejection code on 4 SECURITY DEFINER procedures
- P-018a + P-019a + P-021a — reconciliation entries (no contract amendments themselves; ride the lockstep bump)

**Total new AUDIT_EVENTS action IDs:** 3 (1 Cat B `security.security_definer_tenant_guc_mismatch` + 1 Cat B `identity.session_liveness_check_failed` + 1 Cat A `identity.session_jwt_tenant_id_mismatch`).
**Total new INVARIANTS:** 1 (I-032).
**Total Promotion Ledger entries appended:** 5 (P-024 + P-025 + P-018a + P-019a + P-021a).

---

— Claude (Opus 4.7, 1M context), PROPOSED Promotion Ledger entry texts authored 2026-05-19 under non-ratification autonomous-work authorization.
