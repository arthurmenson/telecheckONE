# Decision Brief — SI-018 ratifier ceremony: Audit-chain partition rule for non-patient governance events

**Date:** 2026-05-19
**Authored by:** Autonomous Claude (Decision Brief artifact; ratifier ceremony itself cannot run unilaterally per CLAUDE.md autonomous-work hard floor — awaits Evans + Engineering Lead + Privacy/Compliance + CDM/AUDIT_EVENTS owner quorum)
**Quorum required:** Evans (workstream lead) + Engineering Lead + Privacy/Compliance (I-027 + I-003 doc-control signatories; recommend additionally for safety per the canonical contract) + AUDIT_EVENTS owner
**Estimated review time:** ~25 minutes (5 sub-decisions, all APPROVED RECOMMENDATION; 4 remaining open questions, all narrow)
**Source artifact:** `Telecheck_v1_10_PRD_Update/SI-018-Audit-Chain-Partition-Rule-for-Non-Patient-Governance-Events.md` v0.2 (Codex-converged at round 5 APPROVE)
**Branch / PR:** `spec/si-018-audit-chain-partition-non-patient-governance-2026-05-19` / PR #14 (5 commits, Codex round 5 APPROVE)

---

## TL;DR

SI-018 fills a **pre-existing canonical-contract gap** in `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md`: the canonical contract partitions audit records by `target_patient_id`, but ~20 already-ratified Cat B governance events have no patient target. The gap predates the v1.10 cycle. SI-017's `identity.session_liveness_check_failed` was the 21st event to face the gap; Codex surfaced it on SI-017 PR #13 R1.

**The substantive decision is one sub-decision:** ratify the **two-tier hybrid partition rule** (tier 1 `target_patient_id` if present; tier 2 `tenant_id` always present per I-027). Tier 3 was considered in v0.1 and rejected per Codex R1 HIGH-2 closure because it would have permitted null `tenant_id` audit records, violating I-027.

**Cross-artifact impact is narrow:** AUDIT_EVENTS v5.3 → v5.4 (one §Partitioning amendment + §Chain construction + §Cross-partition checkpoint clarification + per-event tier annotation table); Registry v2.12 → v2.13. **No CDM, RBAC, State Machines, Identity Spec, System Architecture, or INVARIANTS changes.**

**Net new audit events:** zero. SI-018 amends the partition rule + annotates existing events; does not introduce new event IDs.

---

## §1 — Five sub-decisions to ratify

All five are APPROVED RECOMMENDATION at v0.2 post-Codex-R5-APPROVE. Ratifier reviews and either accepts the recommendations or surfaces specific overrides.

### Sub-decision 1: Two-tier hybrid partition rule

> **Tier 1:** if `target_patient_id` is present, partition by `target_patient_id`. (Existing canonical rule.)
> **Tier 2:** else, partition by `tenant_id` (always present per INVARIANTS I-027 — every audit record carries `tenant_id`).

**Why two tiers (not three):** v0.1 proposed a tier 3 `_PLATFORM_` sentinel partition for "events with no tenant target." Codex R1 HIGH-2 correctly flagged that this would have permitted null `tenant_id` audit records, violating I-027 verbatim ("Every audit record carries `tenant_id`... not a null or platform-scope ID"). The v0.2 revision dropped tier 3 entirely. The residual case ("Platform Admin creating a new tenant where no tenant exists yet") was already covered by v5.1 line-101 — the audit record carries the new tenant's ID, which is tier 2. No genuinely tenantless events exist in the current catalog.

**Recommendation: APPROVE.**

### Sub-decision 2: GENESIS hash format

> Tier 1 GENESIS: `SHA-256("GENESIS:PATIENT:<patient_id>")` (existing format symmetrized with explicit PATIENT prefix).
> Tier 2 GENESIS: `SHA-256("GENESIS:TENANT:<tenant_id>")` (new).

The PATIENT prefix is added to the existing tier-1 GENESIS format for symmetry with tier 2. Spec-corpus has no deployed implementation yet (per F-1/F-2/F-3/F-4 phase tracking; audit-chain implementation queued but not deployed); the format change has no implementation cost.

**Recommendation: APPROVE.**

### Sub-decision 3: Per-event deterministic tier annotation table

Every Cat B governance event in the canonical AUDIT_EVENTS file is annotated with its deterministic tier per the new rule. The full table is in SI-018 §4 Sub-decision 3. Key resolutions from v0.1 → v0.2:

- `knowledge_base_updated` → **tier 2** (one record per activating tenant; mirrors v5.2 research-export multi-tenant rule). v0.1 marked "tier 2 or 3 depending on scoping" — non-deterministic; corrected.
- `clinical_exclusion_rule_changed` → **tier 2** (one record per affected tenant). v0.1 marked tier 3; corrected (rule is platform-floor per I-019 but audit emission still has tenant attribution per I-027).
- `dual_control_approval` → **tier 2** governance audit + SEPARATE Cat A tier-1 patient audit when patient-affecting. v0.1 marked variable; resolved via dual-emission pattern. Forensic walks use timestamp+actor+tenant inference (NOT `linked_events[]` cross-reference — that field is canonically domain-event IDs).
- `fake_med_flag_raised` / `_resolved` → same dual-emission pattern as `dual_control_approval` when patient-traceable.
- `signal_enforcement_trigger` → same dual-emission pattern when signal references specific patient. v0.1 marked "Variable" — non-deterministic; corrected.
- `research.dsa_activated` → **tier 2** (operating tenant per v5.2 research-export tenant-scope rule). v0.1 marked tier 3; corrected.

All other rows in the table are tier 1 (consent events) or tier 2 (standard governance events) deterministically.

**Recommendation: APPROVE.**

### Sub-decision 4: §Partitioning + §Chain construction + §Cross-partition checkpoint amendments

Amend `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md`:

- **§Partitioning (line 275):** replace single-tier text with two-tier hybrid rule + dual-emission pattern annotation.
- **§Chain construction (line 286):** replace single-line GENESIS with tier-1 and tier-2 GENESIS formats.
- **§Cross-partition checkpoint (line 297 area):** add explicit canonical input format — sequence of `(tier, partition_key, latest_record_hash)` tuples sorted by integer tier (primary) + partition_key (secondary), with `|` field separator and `\n` tuple separator.
- **Envelope schema annotation (line 56 area):** add clarifying note that `hash_chain.partition` equals `target_patient_id` (tier 1) or `tenant_id` (tier 2) — not a prefixed string.

**Recommendation: APPROVE.**

### Sub-decision 5: I-027 amendment-or-not — NO amendment needed

The two-tier hybrid rule strictly preserves I-027 ("every audit record carries `tenant_id`... not a null or platform-scope ID"). Tier 1 events carry `tenant_id` (patient-scope events are tenant-scoped per I-023). Tier 2 events carry `tenant_id` as the partition key itself. No null-tenant case; tier 3 was rejected to preserve this.

**Recommendation: APPROVE — no I-027 amendment.**

---

## §2 — Four remaining open questions for ratifier

### Open Question 1: GENESIS format backward-compatibility

The tier 1 GENESIS format changes from `SHA-256("GENESIS:<patient_id>")` to `SHA-256("GENESIS:PATIENT:<patient_id>")`. Is this a breaking change for any deployed implementation?

**Expected answer:** NO (no deployed implementation yet per F-1/F-2/F-3/F-4 phase tracking).

**If YES** (deployed implementation found): keep tier 1 GENESIS format unchanged, only tier 2 gets the new `TENANT:` prefix. Slight asymmetry; preserves backward compatibility.

### Open Question 2: ~~Cross-partition checkpoint deterministic-sort prefix ordering~~ CLOSED at v0.2 R3 via integer-tier discriminator (no longer open)

### Open Question 3: Dual-emission canonical-pattern documentation

Should the dual-emission pattern (Cat B tier-2 governance + SEPARATE Cat A/C tier-1 patient, no envelope cross-reference, forensic-walk-by-inference) be documented as a canonical pattern in a new §"Dual-emission pattern" subsection of AUDIT_EVENTS, or is the per-event annotation in Sub-decision 3's table sufficient?

**Recommendation:** document as canonical pattern in a new subsection. Reusable for future Cat B events; +1 paragraph.

### Open Question 4: Codex pre-ratification rounds — how many before ratifier ceremony?

Already converged at round 5 APPROVE. No further pre-ratification rounds needed.

### Open Question 5: Cross-partition checkpoint amendment lands at SI-018 or split to follow-up?

Folded into SI-018 (Sub-decision 4) — the change is one paragraph and structurally coupled to the partition rule change. Already approved per Sub-decision 4.

---

## §3 — Ratifier decision summary table

| # | Decision | Recommendation |
|---|---|---|
| Sub-1 | Two-tier hybrid partition rule | APPROVE |
| Sub-2 | GENESIS format with PATIENT:/TENANT: prefixes | APPROVE |
| Sub-3 | Per-event deterministic tier table (revised v0.2) | APPROVE |
| Sub-4 | §Partitioning + §Chain construction + §Cross-partition checkpoint amendments | APPROVE |
| Sub-5 | No I-027 amendment | APPROVE |
| OQ-1 | GENESIS backward-compat (verify or fallback) | Expected NO breaking change |
| OQ-3 | Document dual-emission as canonical pattern | Recommend YES (+1 paragraph) |

Total ratifier decisions: **5 sub-decisions + 2 substantive open questions** = 7 items. Expected outcome: all 7 default-recommendations accepted.

---

## §4 — What happens after ratification

1. **Promotion Ledger entry P-026** (next available P-NUM after P-025) recorded with RATIFIED-IN-INTENT status documenting Evans's chat-message ratification.
2. **Canonical-content-port PR-A2/A3** lands the SI-018 content in the bundle: AUDIT_EVENTS v5.3 → v5.4 + Registry v2.12 → v2.13 + P-026 RATIFIED-IN-INTENT → CANONICAL.
3. **SI-017** (PR #13, currently paused at R1) unblocks: amend its Sub-decision 4 to cite SI-018's tier-2 rule for the `identity.session_liveness_check_failed` event; Codex round 2 closes R1 finding by reference; SI-017 then runs its own Decision Brief + ratifier ceremony cycle.
4. **P-018a / P-019a / P-021a supersession entries** (PR #15/#16/#17 in some order) unblock similarly: each cites SI-017 + SI-018 for the canonical actor-identity + audit-emission patterns; each runs its own Codex pre-ratification + ratifier ceremony cycle in parallel.

Estimated total time from SI-018 ratification to all four downstream (SI-017 + 3 supersessions) ratifying + landing: ~1 week if all converge cleanly.

---

## §5 — Risk + open-issue summary

**No known architectural risks** post-Codex-R5 convergence. The two-tier design strictly preserves I-027; no canonical contract amendments beyond the SI-018 scope.

**One operational consideration** worth flagging for Privacy/Compliance:
- The dual-emission pattern (no canonical cross-reference field) means forensic walks for governance+patient coupled audits rely on timestamp+actor+tenant+detail-context inference. This is the same pattern already used for other coupled audit events across the v1.10 catalog (e.g., `medication_request.*` event sequences); not a new requirement. But Privacy/Compliance should confirm this is acceptable for the I-003 audit-completeness review surface. If inference-based linkage is judged insufficient for HIPAA technical-safeguards review purposes, a future SI can add a `linked_audit_ids[]` envelope field — but SI-018 narrowly does NOT introduce this.

---

## §6 — Ratification confirmation template

Evans's chat-message ratification format (per established precedent from SC1–SC8):

> "I ratify SI-018 with the 5 sub-decisions and 2 open-question recommendations as documented in the Decision Brief at `Telecheck_v1_10_PRD_Update/Decision-Brief-SI-018-Audit-Chain-Partition-Rule-2026-05-19.md`."

Or with overrides:

> "I ratify SI-018 with all sub-decisions as recommended, EXCEPT [list overrides]. The overrides are: [specific decisions to override]."

Or with rejection:

> "Reject SI-018 as authored. [reason for rejection or required revisions]."

Autonomous Claude responds to ratification by:
1. Appending Promotion Ledger entry P-026 in RATIFIED-IN-INTENT state.
2. Filing the PR-A2/A3 canonical-content-port branch + commit + PR.
3. Running Codex per-PR adversarial review.
4. Merging after Codex APPROVE.
5. Cockpit Addendum 50 + revision bump.

---

**End of SI-018 Decision Brief.**
