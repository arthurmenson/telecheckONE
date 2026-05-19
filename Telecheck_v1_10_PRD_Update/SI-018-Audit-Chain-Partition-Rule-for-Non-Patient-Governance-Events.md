# SI-018 — Audit-chain partition rule for non-patient governance events

**Version:** 0.2 DRAFT (revised 2026-05-19 per Codex PR #14 R1 closures: HIGH-1 variable-tier table → deterministic tier assignments; HIGH-2 tier-3 violates I-027 → tier 3 dropped entirely; revised design is two-tier hybrid with I-027 strictly preserved)
**Status:** Pre-Codex-round-2; not yet routed to ratifier
**Authoring location:** `Telecheck_v1_10_PRD_Update/` (spec-repo workstream folder; to be ported to `arthurmenson/telecheck-app:docs/` after Codex pre-ratification cycle stabilizes per established SI source-file precedent)
**Owner:** Engineering Lead + Privacy/Compliance (joint owners — AUDIT_EVENTS §Partitioning amendment affects both)
**Related artifacts:**
- SI-017 v0.1 DRAFT (the SI that surfaced this gap via Codex PR #13 round-1 architectural-judgment finding)
- Codex PR #13 R1 finding: "Tenant-keyed audit hash chain is a new audit primitive, despite scope claiming only one Cat B event" — the canonical contract has no partition rule for non-patient events
- Codex PR #14 R1 findings: HIGH-1 variable-tier table is not deterministic + HIGH-2 tier 3 violates I-027 — both closed via v0.1 → v0.2 revision per Evans's Option α direction 2026-05-19
- Promotion Ledger entry P-023a (the SI-010 rejection that prompted the SI-017 / SI-018 cleanup cycle)

---

## 1. Purpose

Fill a **pre-existing canonical-contract gap** in `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md` §Partitioning: the hash-chain partition rule is defined for events that carry a `target_patient_id` value, but is **silent on the partition behavior for events where `target_patient_id` is N/A** (non-patient governance events).

The gap predates the v1.10 cycle and predates SI-010 / SI-017. It affects approximately **20 already-ratified Cat B governance events** that live in the canonical AUDIT_EVENTS catalog without an explicit partition rule (enumerated in §3 below). SI-017's `identity.session_liveness_check_failed` would be the 21st event affected.

SI-018 establishes the canonical partition rule explicitly so that:
- The ~20 existing Cat B governance events have a defined partition home (retroactive normative pinning — none of these are implementation-deployed yet at the spec-corpus stage, so this is pure documentation; no chain migration required).
- SI-017 and any future non-patient audit event can cite a ratified canonical rule rather than re-inventing a partition primitive.
- The pre-existing gap that Codex surfaced via SI-017 is properly closed at the contract level, not patched per-event.

---

## 2. Trigger / problem statement

**The verified canonical-contract gap:**

`Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md` v5.3 (current canonical) states:

- Line 23 (envelope schema): `"target_patient_id": "<patient this action affects>"` — required field
- Line 56 (envelope schema, hash_chain subfield): `"partition": "<partition key = target_patient_id>"`
- Line 275 (§Hash chain / §Partitioning): "Audit records are partitioned by `target_patient_id`. Each partition is an independent, ordered chain."
- Line 286 (§Chain construction): "For the first record in a partition, `previous_hash` = `SHA-256("GENESIS:<patient_id>")`" — literally embeds patient_id in the GENESIS hash

**But the same canonical file** also defines a substantial Cat B governance-event catalog (lines 165–189) where the action semantics are platform-scope or tenant-scope, NOT patient-scope:

| Event | What it affects | Patient target? |
|---|---|---|
| `protocol_activated` / `protocol_deactivated` | Protocol availability | NO — protocol is platform-scope or tenant-scope; no specific patient |
| `guardrail_template_deployed` / `_rolled_back` / `_test_run` | AI guardrail template state | NO — template is platform-scope |
| `moderation_policy_changed` | Community moderation policy | NO — policy is tenant-scope |
| `market_launch_approved` / `market_paused` / `market_retired` | Market availability for a program | NO — market is tenant×country-scope |
| `forms_eligibility_logic_edited` / `forms_approval_governance_edited` | Forms Engine layer state | NO — form template is tenant-scope |
| `knowledge_base_updated` | Knowledge base version | NO — KB is platform-scope |
| `clinical_exclusion_rule_changed` | Clinical exclusion rule | NO — rule is platform-scope |
| `dual_control_approval` | Approval of a config change | NO — approval action is tenant-scope or platform-scope |
| `fake_med_flag_raised` / `fake_med_flag_resolved` | Pharmacy fraud signal | Sometimes — may reference a patient if the flag was from a patient's order |
| `config_change_validated` | Config validation result | NO — config is tenant-scope or platform-scope |
| `incident_opened` / `incident_resolved` | Operational incident | NO — incident is platform-scope or tenant-scope |
| `signal_enforcement_trigger` | Signal-based enforcement | Variable — may reference patient (e.g., crisis signal) or not (e.g., aggregate signal) |

**What the existing catalog does NOT define:** how to populate `target_patient_id` (and therefore which hash-chain partition to use) for these events. The canonical contract has no documented rule for "what does `target_patient_id` get set to when the action has no patient target?" and no documented partition fallback.

**This is the gap.** It's been sitting in the canonical AUDIT_EVENTS file since v5.0 (initial ratification). The v5.1 multi-tenancy threading (line 100–101) introduced rules for `tenant_id` null/non-null but did NOT extend §Partitioning to handle non-patient cases. The v5.2 research events + marketing events extensions did NOT address it either. SI-017's `identity.session_liveness_check_failed` was the 21st event to face the gap; Codex finally surfaced it at PR #13 R1.

---

## 3. Design decision (the single substantive sub-decision)

**Amend AUDIT_EVENTS §Partitioning to define a TWO-tier hybrid fallback rule for the hash-chain partition key, when `target_patient_id` is N/A.** Specifically:

The hash-chain partition key is determined by the following ordered fallback:

1. **If `target_patient_id` is present (non-null and non-sentinel):** partition by `target_patient_id`. The existing canonical rule. GENESIS hash = `SHA-256("GENESIS:PATIENT:<patient_id>")` (existing format symmetrized; see §6 Open Question 1).
2. **Else (`target_patient_id` is null but `tenant_id` is always present per I-027):** partition by `tenant_id`. New rule. GENESIS hash = `SHA-256("GENESIS:TENANT:<tenant_id>")`. This handles tenant-scoped non-patient events like `protocol_activated`, `market_launch_approved`, `moderation_policy_changed`, `forms_eligibility_logic_edited`, SI-017's `identity.session_liveness_check_failed`, and ALL existing Cat B governance events.

**Why only two tiers (Codex PR #14 R1 HIGH-2 closure 2026-05-19; revised from v0.1 three-tier design):** the v0.1 design added a tier 3 `_PLATFORM_` sentinel partition for "events with no tenant target." On Codex review, this **contradicted INVARIANTS v5.2 I-027** which states verbatim: *"Every audit record carries `tenant_id`, including audit records created by Platform Admin actions on a specific tenant (those records carry the target tenant's ID, **not a null or platform-scope ID**)."* Tier 3 would have permitted null `tenant_id` audit records, creating a cross-artifact contract conflict with I-027. Rather than amend I-027 (which would weaken a platform-floor invariant), the v0.2 design drops tier 3 entirely. The residual case ("Platform Admin creating a new tenant") was already covered by v5.1 line-101's existing rule that the record carries the new tenant's ID — i.e., always tier 2. No genuinely tenantless audit events exist in the current catalog, and any future such events would require an I-027 amendment ratified separately. The two-tier design strictly preserves I-027.

**That is the entire substantive design.** Everything else in this SI is operational detail, retroactive normative pinning of the existing ~20 events, regression-test specification, or open-question scoping for ratifier review.

**Rationale:**

- **Tier 1 is backward-compatible** with the existing canonical contract for patient-scope events (the GENESIS format change is the only break — §6 Open Question 1).
- **Tier 2 matches and strictly enforces existing v5.1 line-101 tenant_id rules** + I-027 — every audit record carries `tenant_id` (no null permitted); tier 2 codifies that the partition key follows that tenant_id.
- **The hybrid avoids inventing new event-class distinctions or new envelope fields** — the partition key is computed from existing envelope fields by the rule itself.
- **The two-tier design is consistent with I-027 without requiring an I-027 amendment** — tier 3 was the source of cross-artifact conflict and is removed.

---

## 4. Sub-decisions

### Sub-decision 1: Two-tier hybrid partition rule (APPROVED RECOMMENDATION — revised v0.2 from v0.1's three-tier design per Codex R1 HIGH-2 closure dropping tier 3 to preserve I-027)

As stated in §3 above. The single substantive sub-decision of SI-018.

### Sub-decision 2: GENESIS hash format extended to embed tier discriminator (APPROVED RECOMMENDATION — revised v0.2 per Codex R1 HIGH-2 closure removing tier 3 GENESIS format)

Per §3 above:
- `SHA-256("GENESIS:PATIENT:<patient_id>")` for tier 1
- `SHA-256("GENESIS:TENANT:<tenant_id>")` for tier 2

The PATIENT prefix is added to the existing tier 1 format for symmetry with the tier 2 TENANT prefix. The format change is internal to the GENESIS-hash computation function; chain verification logic must compute the same value to verify the first record. No verified deployed implementation exists at the spec-corpus stage, so the format change has no implementation cost. **No tier-3 GENESIS format is defined; the v0.1 `SHA-256("GENESIS:_PLATFORM_")` format is dropped per the Codex R1 HIGH-2 closure (I-027 preservation; see §3 rationale).**

### Sub-decision 3: Retroactive normative pinning of the ~20 existing Cat B governance events (APPROVED RECOMMENDATION — revised v0.2 per Codex PR #14 R1 HIGH-1 closure to make every row deterministic)

Each Cat B governance event is annotated with its **deterministic** tier per the new rule. The v0.1 design had three variable/conditional rows (`knowledge_base_updated`, `dual_control_approval`, `signal_enforcement_trigger`) which Codex correctly flagged as moving the gap from "no rule" to "ambiguous rule." The v0.2 revision resolves all three deterministically.

| Event | Tier | Partition key when emitted | Notes |
|---|---|---|---|
| `protocol_activated` / `protocol_deactivated` | 2 | `tenant_id` | Protocol activation is per-tenant per the existing v5.1 line-101 + I-027 rules |
| `guardrail_template_deployed` | 2 | `tenant_id` | Template deployment is per-tenant |
| `guardrail_template_rolled_back` | 2 | `tenant_id` | — |
| `guardrail_template_test_run` | 2 | `tenant_id` | — |
| `moderation_policy_changed` | 2 | `tenant_id` | Per-tenant moderation policy |
| `market_launch_approved` | 2 | `tenant_id` | Market launch is per-tenant×country |
| `market_paused` | 2 | `tenant_id` | — |
| `market_retired` | 2 | `tenant_id` | — |
| `forms_eligibility_logic_edited` | 2 | `tenant_id` | Forms versions are per-tenant |
| `forms_approval_governance_edited` | 2 | `tenant_id` | — |
| `knowledge_base_updated` | **2 (deterministic)** | `tenant_id` of the tenant whose program activated the KB version | **Revised v0.2 per Codex R1 HIGH-1 closure:** v0.1 marked this "tier 2 or 3 depending on scoping" — non-deterministic. Resolution: KB versions are always associated with a program activation, and programs are tenant-scoped per the v1.10 Phase 3 KB versioning discipline. Therefore `knowledge_base_updated` is ALWAYS tier 2 with `tenant_id` = the tenant whose program activated the KB version. If multiple tenants' programs activate the same KB version, emit one audit record per activating tenant (mirroring the v5.2 research-export tenant-scope rule for cross-tenant cohort definitions). Tier 3 was the wrong answer in v0.1; resolved to tier 2 in v0.2. |
| `clinical_exclusion_rule_changed` | **2 (deterministic)** | `tenant_id` of every tenant the rule applies to | **Revised v0.2 per Codex R1 HIGH-1 closure:** v0.1 marked this "tier 3 platform-scope." Revision: clinical exclusion rules are I-019 platform-floor but the audit emission for a rule change still has tenant attribution per I-027 (every affected tenant). Tier 3 was the wrong answer in v0.1; resolved to tier 2 with one audit record per affected tenant in v0.2. Mirrors the v5.2 research-export multi-tenant emission rule. |
| `dual_control_approval` | **2 (deterministic; SEPARATE patient-chain emission for clinical approvals)** | `tenant_id` of the approving authority | **Revised v0.2 per Codex R1 HIGH-1 closure:** v0.1 marked this "tier 1 or 2 by instance" — non-deterministic. Resolution: the `dual_control_approval` audit event records the governance action (the act of approval), which is ALWAYS tier 2 (tenant-scoped governance attribution). When the approved action is patient-affecting (e.g., approving a clinical decision for patient X), a SEPARATE Cat A patient-scope audit event (the action being approved, e.g., `prescribing.protocol_authorization_granted` for patient X) is ALSO emitted tier 1 in patient X's chain. The two events cross-reference via `audit_id` in `linked_events[]`. This preserves both governance-attribution-by-tenant and patient-chain-visibility-for-clinical-approvals without requiring per-instance variable tier on a single action ID. |
| `fake_med_flag_raised` / `_resolved` | **2 (deterministic; SEPARATE patient-chain emission when patient-traceable)** | `tenant_id` of the pharmacy operation | **Revised v0.2 per Codex R1 HIGH-1 closure:** same pattern as `dual_control_approval`. The fake-med flag event is governance-class (Cat B); always tier 2 with `tenant_id`. When the flag is traceable to a specific patient's order, a SEPARATE Cat C patient-event (`medication_request.flagged_for_fake_med` or equivalent) is ALSO emitted tier 1 in the patient's chain. Cross-reference via `linked_events[]`. |
| `config_change_validated` | 2 | `tenant_id` of the tenant whose config is validated | — |
| `incident_opened` / `incident_resolved` | 2 | `tenant_id` of the affected tenant | If incident spans multiple tenants, emit one audit record per affected tenant (mirrors research-export rule) |
| `signal_enforcement_trigger` | **2 (deterministic; SEPARATE patient-chain emission when signal references specific patient)** | `tenant_id` of the tenant where signal triggered | **Revised v0.2 per Codex R1 HIGH-1 closure:** v0.1 marked this "Variable" — non-deterministic. Resolution: the `signal_enforcement_trigger` audit event records the enforcement action (governance-class); always tier 2 with `tenant_id`. When the signal references a specific patient (e.g., crisis-detection signal for patient X), a SEPARATE Cat A patient-event (e.g., `crisis.escalation_destination_resolved` per SI-013) is ALSO emitted tier 1 in patient X's chain. Cross-reference via `linked_events[]`. The detail-payload `signal_type` field discriminates the signal class but does NOT determine the partition tier (which is always 2 for this action ID). |
| `research.consent_granted` / `research.consent_revoked` | 1 | `target_patient_id` (consent is patient-scoped) | — |
| `research.dsa_activated` | **2 (deterministic)** | `tenant_id` of the operating tenant whose patients are subject to the DSA | **Revised v0.2 per Codex R1 HIGH-1 closure:** v0.1 marked this "tier 3 platform-scope (DSAs are platform-level per ADR-028)." Revision: per the v5.2 research-export tenant-scope rule (which SI-018 v0.2 mirrors for consistency), DSA-related events carry the operating tenant's tenant_id even though the partnership is anchored at the platform level. The DSA reference (`dsa_id`) on the event identifies the parent-level partnership; the tenant scope identifies the data origin. Same pattern as `research.export_*` events. Tier 3 was the wrong answer in v0.1; resolved to tier 2 with one record per affected operating tenant. |
| `research.cohort_defined` | 2 | `tenant_id` (cohort definitions are tenant-scoped per the v5.2 rule) | — |
| `research.export_initiated` / `research.export_completed` | 2 | `tenant_id` (operating tenant per the v5.2 rule) | — |
| `marketing.surface_rendered` | 2 | `tenant_id` | Marketing surface events are tenant-scoped per ADR-027 |
| `marketing.surface_drift` | 2 | `tenant_id` | — |

**Every row is now deterministic.** Future Cat B events MUST be annotated with their deterministic tier at ratification time. If an event has dual scope (governance-class AND patient-affecting), the pattern is: emit a Cat B tier-2 audit for the governance action + a SEPARATE Cat A or Cat C tier-1 audit for the patient effect, cross-referenced via `linked_events[]`. This is the canonical pattern; no per-instance variable-tier ratification is permitted.

This table is normative — once SI-018 ratifies and lands, each event's tier becomes part of the canonical AUDIT_EVENTS contract.

### Sub-decision 4: §Partitioning + §Chain construction text amendment (APPROVED RECOMMENDATION — revised v0.2 per Codex PR #14 R1 HIGH-2 closure to drop tier 3 and strictly preserve I-027)

Amend `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md`:

**Line 275 (§Partitioning):**

> Before: "Audit records are partitioned by `target_patient_id`. Each partition is an independent, ordered chain."
>
> After: "Audit records are partitioned by a two-tier hybrid fallback rule: (tier 1) if `target_patient_id` is present, partition by `target_patient_id`; (tier 2) else, partition by `tenant_id` (which is always present per INVARIANTS I-027 — every audit record carries `tenant_id`). Each partition is an independent, ordered chain. Every Cat A audit event is tier 1 by construction (Cat A actions affect a specific patient). Cat B audit events are tier 1 (rare; consent-events only) or tier 2 (the canonical governance pattern); each Cat B event's tier is deterministically defined in the per-event annotation in §Category B (table below). Cat C audit events are tier 1 (the canonical patient-scope pattern) or tier 2. Per-event tier is part of the canonical event definition; no event may have variable tier per-instance. **Note (per SI-018 design):** dual-scope governance actions (e.g., approval of a patient-affecting clinical decision) emit BOTH a Cat B tier-2 governance-attribution event AND a SEPARATE Cat A/C tier-1 patient-effect event, cross-referenced via `linked_events[]`. This is the canonical pattern for events that touch both governance and patient surfaces."

**Line 282–286 (§Chain construction step 4):**

> Before: "For the first record in a partition, `previous_hash` = `SHA-256("GENESIS:<patient_id>")`"
>
> After: "For the first record in a partition, `previous_hash` is computed from the partition tier: tier 1 → `SHA-256("GENESIS:PATIENT:<patient_id>")`; tier 2 → `SHA-256("GENESIS:TENANT:<tenant_id>")`."

**New paragraph added to §Cross-partition checkpoint (line 297 area):**

> The 24-hour checkpoint hashes across **all** active partitions across both tiers. The sorted_concat at line 299 includes tier-1 patient partitions and tier-2 tenant partitions, in deterministic sorted order (lexicographic on the partition key, with `PATIENT:` prefix sorting before `TENANT:` prefix for determinism). This ensures the global integrity anchor covers governance-event chains alongside patient-event chains.

**Envelope schema annotation (line 56 area):** add a clarifying note that `hash_chain.partition` is computed per the §Partitioning fallback rule and is not necessarily equal to `target_patient_id`; it equals `target_patient_id` when present, else `tenant_id` (always present per I-027).

### Sub-decision 5: I-027 strictly preserved by two-tier design; no I-027 amendment needed (APPROVED RECOMMENDATION — confirmed by v0.2 revision per Codex PR #14 R1 HIGH-2 closure)

**INVARIANTS v5.2 I-027** ("Audit envelope carries tenant context") says verbatim: *"Every audit record carries `tenant_id`, including audit records created by Platform Admin actions on a specific tenant (those records carry the target tenant's ID, **not a null or platform-scope ID**)."*

SI-018 v0.2's two-tier hybrid rule **strictly preserves I-027**:
- **Tier 1** events carry `tenant_id` (patient-scope events are tenant-scoped per I-023 + I-027) AND a non-null `target_patient_id`.
- **Tier 2** events carry `tenant_id` (the partition key itself). No null-`tenant_id` case.
- **No tier 3.** The v0.1 design's `_PLATFORM_` sentinel partition (which would have permitted null `tenant_id` records) is dropped entirely. The v0.1 rationale ("rare platform-scope events with no tenant target") was based on a misread of v5.1 line-101: that line explicitly says Platform Admin creating a new tenant gets the new tenant's ID — which IS tier 2, not tier 3. No genuinely tenantless events exist in the current catalog.

**No I-027 amendment is needed.** The §Partitioning amendment alone is sufficient. The v0.2 design is structurally cleaner than v0.1 because it strictly preserves a platform-floor invariant rather than carving an exception.

**If a future audit event class genuinely requires no tenant attribution** (e.g., a future platform-software-version-deployment event), that would require an I-027 amendment ratified separately — but no such event is currently in the catalog or proposed in any pending SI, so SI-018 does NOT need to solve for this hypothetical.

---

## 5. Cross-artifact impact summary

### AUDIT_EVENTS impact

**Contracts Pack `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md`** (currently v5.3 canonical):

- **§Partitioning text amendment** (line 275 area; Sub-decision 4)
- **§Chain construction text amendment** (line 282–286; Sub-decision 4)
- **§Cross-partition checkpoint amendment** (line 297 area; Sub-decision 4)
- **Envelope schema annotation** on `hash_chain.partition` (line 56 area; Sub-decision 4)
- **Per-event tier annotation table** added to §Category B section (Sub-decision 3) — the table from Sub-decision 3 above lands as a new subsection in §Category B between line 188 and line 190.
- Version bump: **v5.3 → v5.4**. (This is the THIRD attempt at AUDIT_EVENTS v5.4 — the first was rejected SI-010, the second is queued SI-017. SI-018 takes the v5.4 slot since it ratifies first. SI-017 then takes v5.5 when it ratifies.)

### CDM impact

NONE. SI-018 amends only AUDIT_EVENTS; no CDM entity changes.

### State Machines impact

NONE.

### Identity Spec impact

NONE.

### Registry impact

**Artifact Registry `Telecheck_Artifact_Registry_v2_10.md`** (currently v2.12 canonical):

- Version bump: **v2.12 → v2.13**. SI-018's canonical-content-port lands one Registry +1 minor bump per the lockstep invariant.
- §3 row 64 (Promotion Ledger inventory) updated.
- §8 changelog new top row.

(Note: the rejected SI-010 attempt at v2.13 never landed; v2.13 is available for SI-018's bump. SI-017's later canonical-content-port lands v2.14. The three P-018a/P-019a/P-021a supersessions land v2.15/v2.16/v2.17 sequentially or v2.13→v2.15 if consolidated.)

### I-027 / INVARIANTS impact

NONE per Sub-decision 5. The two-tier rule strictly preserves I-027 (no null-tenant audit records permitted; tier 3 was dropped to eliminate the cross-artifact conflict that v0.1's three-tier design would have created).

### System Architecture impact

NONE.

### RBAC impact

NONE.

---

## 6. Open questions (for Codex pre-ratification + ratifier review)

**Revised v0.2 per Codex PR #14 R1 closures:** Open Questions 2, 3, 4 from v0.1 are CLOSED via the deterministic tier resolutions in Sub-decision 3. Open Question 5 from v0.1 (cross-partition checkpoint scope) is no longer relevant because tier 3 is dropped (no `_PLATFORM_` partition to consider). Remaining open questions:

### Open Question 1: GENESIS hash format change

The tier 1 GENESIS format changes from `SHA-256("GENESIS:<patient_id>")` to `SHA-256("GENESIS:PATIENT:<patient_id>")` for symmetry with tier 2. Is this a breaking change for any deployed implementation?

**Expected answer:** NO — spec-corpus has no deployed implementation at the patient-audit-chain level yet (per the F-1/F-2/F-3/F-4 phase tracking, the audit-chain implementation is queued but not deployed). The format change is internal documentation only.

**If answer turns out to be YES** (deployed implementation exists somewhere not yet found): adjust the SI to make tier 1 keep the existing GENESIS format `SHA-256("GENESIS:<patient_id>")` and only tier 2 gets the new `TENANT:` prefix. Slight loss of format symmetry but preserves backward compatibility.

### Open Question 2: Cross-partition checkpoint deterministic-sort prefix ordering

Sub-decision 4 specifies the checkpoint sorts partition keys lexicographically with `PATIENT:` prefix sorting before `TENANT:` prefix for determinism. Is the alphabetical `PATIENT < TENANT` ordering correct, or should there be a different determinism rule (e.g., tier-1-before-tier-2 regardless of prefix string)?

**Recommendation:** alphabetical `PATIENT < TENANT` works because the prefixes are part of the canonical GENESIS format and the sort is operating on those strings. No special-case ordering needed.

### Open Question 3: Dual-emission pattern for governance + patient events — should this be documented as a canonical pattern in AUDIT_EVENTS?

Sub-decision 3 establishes that dual-scope events (`dual_control_approval`, `fake_med_flag_*`, `signal_enforcement_trigger` when patient-referencing) emit a Cat B tier-2 governance audit AND a SEPARATE Cat A/C tier-1 patient audit, cross-referenced via `linked_events[]`. Should this dual-emission pattern be documented as a canonical pattern in the AUDIT_EVENTS file (e.g., a new §"Dual-emission pattern for governance+patient events" section), or is the per-event annotation in the Sub-decision 3 table sufficient?

**Recommendation:** document the canonical pattern in AUDIT_EVENTS as a new section (post-§Category B). This makes the pattern reusable for future Cat B events without re-establishing it per-event. Small addition; +1 paragraph.

### Open Question 4: Codex pre-ratification rounds — how many before ratifier ceremony?

**Recommendation:** target 2 rounds + 1 verification = 3 total. STOP and escalate at any architectural-judgment finding per the discipline floor.

### Open Question 5: Should the cross-partition checkpoint amendment land at SI-018 or separately?

Sub-decision 4's checkpoint amendment is a small text change but extends the existing checkpoint logic. Could be folded into SI-018 (current design) or split into a follow-up minor-amendment commit (cleaner SI-018 scope). **Recommendation:** fold into SI-018 — the change is one paragraph and is structurally coupled to the partition rule change. Splitting would create cross-amendment ordering dependency.

---

## 7. Regression test obligations (merge-blocking for the SI-018 implementation PR; revised v0.2)

1. **Tier 1 emission test:** emit a Cat A event with a specific patient — assert audit row's `hash_chain.partition` = `target_patient_id`; GENESIS for first-in-partition record = `SHA-256("GENESIS:PATIENT:<patient_id>")`.
2. **Tier 2 emission test:** emit a Cat B governance event (e.g., `protocol_activated`) with `target_patient_id = NULL` and `tenant_id = <tenant>` — assert partition = `tenant_id`; GENESIS = `SHA-256("GENESIS:TENANT:<tenant_id>")`.
3. **I-027 negative test (tier 3 forbidden):** attempt to emit an audit event with both `target_patient_id = NULL` and `tenant_id = NULL` — assert the emitter REJECTS the event with `I027_violation_no_tenant_attribution` error. The audit-writer layer MUST refuse to write records that violate I-027. (Tier 3 was rejected in the SI-018 v0.1 → v0.2 revision; this test is the negative-confirmation that the two-tier rule is enforced.)
4. **Mixed-tier checkpoint test:** emit one event of each tier (one tier-1 + one tier-2), run the 24-hour checkpoint, assert checkpoint hash includes both partitions in deterministic sorted order (`PATIENT:` prefix sorts before `TENANT:` prefix).
5. **Chain verification test:** verify each tier's chain independently — assert tier-1 verification passes for patient-scope chain, tier-2 verification passes for tenant-scope chain.
6. **Cross-tier tamper detection test:** modify a tier-2 record — assert tier-2 chain detects break; tier-1 chains remain intact.
7. **GENESIS uniqueness test:** assert that the GENESIS hashes for tier-1 patient_id `X` and tier-2 tenant_id `X` are distinct (the `PATIENT:` and `TENANT:` prefixes ensure namespace separation even if patient_id and tenant_id happen to collide as opaque strings).
8. **Dual-emission test (added v0.2):** emit a `dual_control_approval` event with `tenant_id = T` (Cat B tier-2 governance audit) AND a paired `prescribing.protocol_authorization_granted` event for patient X in tenant T (Cat A tier-1 patient audit); assert both rows exist with correct tier assignments + `linked_events[]` cross-references; assert tenant T's chain extends by 1 (governance event) AND patient X's chain extends by 1 (patient event); assert the two events share a common `correlation_id` for forensic walk.

All 8 are merge-blocking on the SI-018 implementation PR (not on the SI-018 ratification commit).

---

## 8. Codex pre-ratification status

**v0.1 DRAFT 2026-05-19:** pre-Codex-review. Codex pre-ratification cycle to run before Decision Brief authoring + ratifier ceremony.

**Estimated rounds:** 2 + 1 verification = 3 total. STOP-and-escalate at any architectural-judgment finding per discipline-floor cadence.

---

## 9. Relationship to SI-017 + the ~20 existing Cat B governance events

**SI-018 is a prerequisite for SI-017.** SI-017's `identity.session_liveness_check_failed` event is a tier-2 event under SI-018's rule. Once SI-018 ratifies + canonical-content-port lands, SI-017 amends its Sub-decision 4 to cite SI-018's tier-2 partition rule, and the Codex PR #13 R1 finding closes by reference.

**SI-018 ALSO retroactively pins the ~20 existing Cat B governance events** to their tier per Sub-decision 3's table. These events have been in the canonical AUDIT_EVENTS file since v5.0/v5.1/v5.2 ratifications without an explicit partition rule. SI-018's per-event tier annotation table is the first time the canonical contract states their partition behavior explicitly. **No implementation change is required** for the existing events because spec-corpus has no deployed implementation at the audit-chain level yet (per F-1/F-2/F-3/F-4 phase tracking).

**SI-018 does NOT introduce any new audit events.** It amends the partition rule and annotates existing events. Net new events from SI-018 itself: zero.

**Three SIs in flight after SI-018 ratifies, in recommended order:**
1. SI-018 (this SI): partition rule canonical-content-port → Registry v2.13.
2. SI-017: Phase 2 F-3 liveness check, cites SI-018's tier-2 rule → Registry v2.14.
3. P-018a / P-019a / P-021a supersessions in parallel: cite SI-017 + SI-018 → Registry v2.15/v2.16/v2.17 (or v2.13→v2.15 if consolidated).

---

## 10. What ratifier needs to decide at SI-018 ceremony (v0.2)

**5 sub-decisions (all APPROVED RECOMMENDATION at v0.2):**
1. **Two-tier hybrid partition rule** (tier 1 target_patient_id, tier 2 tenant_id; tier 3 dropped per Codex R1 HIGH-2 closure)
2. **GENESIS hash format extension** (PATIENT/TENANT prefixes; pending Open Question 1)
3. **Per-event deterministic tier annotation table** for the ~20+ Cat B events (no variable tiers; dual-emission pattern for governance+patient events)
4. **§Partitioning + §Chain construction + §Cross-partition checkpoint amendments** (two-tier text)
5. **I-027 strictly preserved by two-tier design; no I-027 amendment needed** (confirmed by v0.2 revision per Codex R1 HIGH-2 closure)

**5 open questions:**
1. GENESIS format change is backward-compatible? (expected YES; verify)
2. Cross-partition checkpoint deterministic-sort prefix ordering (`PATIENT:` < `TENANT:` lexicographic, or different rule?)
3. Dual-emission pattern documented as canonical AUDIT_EVENTS section, or per-event annotation only?
4. Codex pre-ratification round count target
5. Cross-partition checkpoint amendment lands at SI-018 or split to follow-up?

Estimated ratifier review time: ~25 minutes (slightly less than v0.1 because tier 3 + variable-tier questions are closed).

The SI is narrow; the substantive decision is single (ratify the two-tier hybrid rule). v0.2 is structurally simpler than v0.1.

---

**End of SI-018 v0.1 DRAFT.**
