# SI-018 — Audit-chain partition rule for non-patient governance events

**Version:** 0.1 DRAFT
**Status:** Pre-Codex-pre-ratification; not yet routed to ratifier
**Authoring location:** `Telecheck_v1_10_PRD_Update/` (spec-repo workstream folder; to be ported to `arthurmenson/telecheck-app:docs/` after Codex pre-ratification cycle stabilizes per established SI source-file precedent)
**Owner:** Engineering Lead + Privacy/Compliance (joint owners — AUDIT_EVENTS §Partitioning amendment affects both)
**Related artifacts:**
- SI-017 v0.1 DRAFT (the SI that surfaced this gap via Codex PR #13 round-1 architectural-judgment finding)
- Codex PR #13 R1 finding: "Tenant-keyed audit hash chain is a new audit primitive, despite scope claiming only one Cat B event" — the canonical contract has no partition rule for non-patient events
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

**Amend AUDIT_EVENTS §Partitioning to define a three-tier hybrid fallback rule for the hash-chain partition key, when `target_patient_id` is N/A.** Specifically:

The hash-chain partition key is determined by the following ordered fallback:

1. **If `target_patient_id` is present (non-null and non-sentinel):** partition by `target_patient_id`. The existing canonical rule. GENESIS hash = `SHA-256("GENESIS:PATIENT:<patient_id>")`. (Note: the existing GENESIS format `SHA-256("GENESIS:<patient_id>")` is changed slightly to `SHA-256("GENESIS:PATIENT:<patient_id>")` for symmetry with the new tiers. **Open Question 6.1 below**: is this format change a breaking change for any deployed implementation? Answer pending verification but expected NO since spec-corpus has no deployed implementation yet.)
2. **Else if `tenant_id` is present (non-null):** partition by `tenant_id`. New rule. GENESIS hash = `SHA-256("GENESIS:TENANT:<tenant_id>")`. This handles tenant-scoped non-patient events like `protocol_activated`, `market_launch_approved`, `moderation_policy_changed`, `forms_eligibility_logic_edited`, and SI-017's `identity.session_liveness_check_failed`.
3. **Else (both target_patient_id and tenant_id are null):** partition by the literal sentinel `_PLATFORM_`. New rule. GENESIS hash = `SHA-256("GENESIS:_PLATFORM_")`. This handles the rare platform-scope events with no tenant target — the example v5.1 line-101 explicitly cites ("a Platform Admin creating a new tenant — that audit record has `tenant_id` set to the new tenant being created") would normally fall into tier 2; tier 3 covers the residual case of platform-level events that genuinely have no tenant attribution (e.g., a future event for platform-software-version-deployment).

**That is the entire substantive design.** Everything else in this SI is operational detail, retroactive normative pinning of the existing ~20 events, regression-test specification, or open-question scoping for ratifier review.

**Rationale:**

- **Tier 1 is backward-compatible** with the existing canonical contract for patient-scope events (the GENESIS format change is the only break — Open Question 6.1).
- **Tier 2 matches existing v5.1 line-101 tenant_id rules** — the contract already treats tenant_id as required-or-clear-substitute for governance events; tier 2 codifies that the partition key follows.
- **Tier 3 handles the edge** without inventing extra infrastructure — it's a constant sentinel value, not a new field or a new schema.
- **The hybrid avoids inventing new event-class distinctions or new envelope fields** — the partition key is computed from existing envelope fields by the rule itself.

---

## 4. Sub-decisions

### Sub-decision 1: Three-tier hybrid partition rule (APPROVED RECOMMENDATION)

As stated in §3 above. The single substantive sub-decision of SI-018.

### Sub-decision 2: GENESIS hash format extended to embed tier discriminator (APPROVED RECOMMENDATION)

Per §3 above:
- `SHA-256("GENESIS:PATIENT:<patient_id>")` for tier 1
- `SHA-256("GENESIS:TENANT:<tenant_id>")` for tier 2
- `SHA-256("GENESIS:_PLATFORM_")` for tier 3

The PATIENT prefix is added to the existing tier 1 format for symmetry. The format change is internal to the GENESIS-hash computation function; chain verification logic must compute the same value to verify the first record. No verified deployed implementation exists at the spec-corpus stage, so the format change has no implementation cost.

### Sub-decision 3: Retroactive normative pinning of the ~20 existing Cat B governance events (APPROVED RECOMMENDATION)

Each of the ~20 existing Cat B governance events is annotated with its tier per the new rule:

| Event | Tier | Partition key when emitted |
|---|---|---|
| `protocol_activated` / `protocol_deactivated` | 2 | `tenant_id` (the tenant in which the protocol is activated/deactivated) |
| `guardrail_template_deployed` | 2 | `tenant_id` (the tenant for which the template version is deployed) |
| `guardrail_template_rolled_back` | 2 | `tenant_id` |
| `guardrail_template_test_run` | 2 | `tenant_id` |
| `moderation_policy_changed` | 2 | `tenant_id` |
| `market_launch_approved` | 2 | `tenant_id` |
| `market_paused` | 2 | `tenant_id` |
| `market_retired` | 2 | `tenant_id` |
| `forms_eligibility_logic_edited` | 2 | `tenant_id` |
| `forms_approval_governance_edited` | 2 | `tenant_id` |
| `knowledge_base_updated` | 2 if tenant-scoped KB else 3 | `tenant_id` else `_PLATFORM_` (KB scoping is per-program; needs §6 open question for ratifier) |
| `clinical_exclusion_rule_changed` | 3 | `_PLATFORM_` (exclusion rules are platform-floor; not tenant-overridable per I-019) |
| `dual_control_approval` | 1 if has target_patient_id, else 2 | `target_patient_id` if patient-affecting; else `tenant_id` (approval target may or may not be patient-related — see §6 open question) |
| `fake_med_flag_raised` / `_resolved` | 1 if flag was from a patient's order; else 2 | `target_patient_id` if patient-traceable; else `tenant_id` |
| `config_change_validated` | 2 | `tenant_id` |
| `incident_opened` / `incident_resolved` | 2 | `tenant_id` (operational incidents are typically tenant-scoped) |
| `signal_enforcement_trigger` | Variable | tier 1/2/3 by case |
| `research.consent_granted` / `research.consent_revoked` | 1 | `target_patient_id` (consent is patient-scoped) |
| `research.dsa_activated` | 3 | `_PLATFORM_` (DSAs are platform-level per ADR-028) |
| `research.cohort_defined` | 2 | `tenant_id` (cohort definitions are tenant-scoped) |
| `research.export_initiated` / `research.export_completed` | 2 | `tenant_id` (operating tenant per existing v5.2 tenant-scope rule) |
| `marketing.surface_rendered` | 2 | `tenant_id` |
| `marketing.surface_drift` | 2 | `tenant_id` |

This table is normative — once SI-018 ratifies and lands, each event's tier becomes part of the canonical AUDIT_EVENTS contract. Future Cat B events MUST be annotated with their tier at ratification time.

### Sub-decision 4: §Partitioning + §Chain construction text amendment (APPROVED RECOMMENDATION)

Amend `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md`:

**Line 275 (§Partitioning):**

> Before: "Audit records are partitioned by `target_patient_id`. Each partition is an independent, ordered chain."
>
> After: "Audit records are partitioned by a three-tier hybrid fallback rule: (tier 1) if `target_patient_id` is present, partition by `target_patient_id`; (tier 2) else if `tenant_id` is present, partition by `tenant_id`; (tier 3) else partition by the literal sentinel `_PLATFORM_`. Each partition is an independent, ordered chain. Every Cat A audit event is tier 1 by construction (Cat A actions affect a specific patient). Cat B audit events span all three tiers per the per-event normative annotation in §Category B (table below). Cat C audit events span tier 1 and tier 2. Per-event tier is part of the canonical event definition."

**Line 282–286 (§Chain construction step 4):**

> Before: "For the first record in a partition, `previous_hash` = `SHA-256("GENESIS:<patient_id>")`"
>
> After: "For the first record in a partition, `previous_hash` is computed from the partition tier: tier 1 → `SHA-256("GENESIS:PATIENT:<patient_id>")`; tier 2 → `SHA-256("GENESIS:TENANT:<tenant_id>")`; tier 3 → `SHA-256("GENESIS:_PLATFORM_")`."

**New paragraph added to §Cross-partition checkpoint (line 297 area):**

> The 24-hour checkpoint hashes across **all** active partitions across all three tiers. The sorted_concat at line 299 includes tier-1 patient partitions, tier-2 tenant partitions, and the tier-3 `_PLATFORM_` partition, in deterministic sorted order. This ensures the global integrity anchor covers governance-event chains alongside patient-event chains.

**Envelope schema annotation (line 56 area):** add a clarifying note that `hash_chain.partition` is computed per the §Partitioning fallback rule and is not necessarily equal to `target_patient_id`.

### Sub-decision 5: I-027 amendment-or-not (APPROVED RECOMMENDATION: no amendment needed)

**INVARIANTS v5.2 I-027** ("Audit envelope carries tenant context") says: "Every audit record carries `tenant_id`, including audit records created by Platform Admin actions on a specific tenant (those records carry the target tenant's ID, not a null or platform-scope ID)."

SI-018's three-tier hybrid rule is CONSISTENT with I-027:
- Tier 2 events carry `tenant_id` per I-027.
- Tier 1 events also carry `tenant_id` (patient-scope events are tenant-scoped per I-023 + I-027).
- Tier 3 events have no tenant_id by definition — these are exactly the "events with no tenant target" carve-out that I-027 implicitly permits (the example v5.1 line-101 gives — "Platform Admin creating a new tenant" — would actually be tier 2 because the new tenant's ID IS the target; tier 3 covers a narrower residual).

**No I-027 amendment is needed.** The §Partitioning amendment alone is sufficient.

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

NONE per Sub-decision 5. The three-tier rule is consistent with I-027.

### System Architecture impact

NONE.

### RBAC impact

NONE.

---

## 6. Open questions (for Codex pre-ratification + ratifier review)

### Open Question 1: GENESIS hash format change

The tier 1 GENESIS format changes from `SHA-256("GENESIS:<patient_id>")` to `SHA-256("GENESIS:PATIENT:<patient_id>")` for symmetry with tier 2 / tier 3. Is this a breaking change for any deployed implementation?

**Expected answer:** NO — spec-corpus has no deployed implementation at the patient-audit-chain level yet (per the F-1/F-2/F-3/F-4 phase tracking, the audit-chain implementation is queued but not deployed). The format change is internal documentation only.

**If answer turns out to be YES** (deployed implementation exists somewhere I haven't found): adjust the SI to make tier 1 keep the existing GENESIS format `SHA-256("GENESIS:<patient_id>")` and only tier 2 / tier 3 get the new prefixes. Slight loss of format symmetry but preserves backward compatibility.

### Open Question 2: `knowledge_base_updated` tier — is the KB platform-scope or tenant-scope?

Sub-decision 3's table marks `knowledge_base_updated` as "tier 2 if tenant-scoped KB else tier 3." But the KB's actual scoping is per-program, and programs are tenant-scoped at the launch level. **Ratifier-decision needed:** is the KB tenant-scoped at the KB-version level (tier 2) or platform-scope at the KB-version level (tier 3)?

**Recommendation:** tier 2 (tenant_id is the operating tenant whose program activated the KB version). Mirror the per-tenant KB-version-management discipline established at v1.10 (Phase 3 KB versioning).

### Open Question 3: `dual_control_approval` tier — patient-affecting or not?

A `dual_control_approval` audit event records an approval action. The "target" of the approval is the action being approved, not a patient. **Ratifier-decision needed:** when the approved action affects a specific patient (e.g., approving a clinical decision for patient X), does the audit event get tier 1 (`target_patient_id` = the patient) or tier 2 (`tenant_id` only)? Both are defensible.

**Recommendation:** tier 1 when patient-affecting (preserves the per-patient-chain visibility for clinical-action approvals); tier 2 when policy/config-affecting (no patient target). The single audit event splits into two by event-instance, not into two action IDs.

### Open Question 4: `signal_enforcement_trigger` — variable tier?

Per Sub-decision 3's table, this event spans all three tiers depending on the triggered signal class. **Ratifier-decision needed:** is per-instance variable tier acceptable, or should this event split into multiple action IDs (`patient_signal_enforcement_trigger`, `tenant_signal_enforcement_trigger`, `platform_signal_enforcement_trigger`)?

**Recommendation:** keep single action ID; variable tier per-instance. The `signal_type` detail-payload field already discriminates the signal class; tier follows naturally.

### Open Question 5: Cross-partition checkpoint scope

Sub-decision 4 says the 24-hour checkpoint hashes across all three tiers. This means tier-3 `_PLATFORM_` partition is in every checkpoint, even if no platform events emitted in 24 hours. Is that acceptable, or should empty partitions be skipped?

**Recommendation:** include all known-active partitions; skip partitions that have ZERO records (no GENESIS yet). The `_PLATFORM_` partition exists only after its first emission; before that, it's not in the checkpoint computation.

### Open Question 6: Codex pre-ratification rounds — how many before ratifier ceremony?

**Recommendation:** target 2 rounds + 1 verification = 3 total. STOP and escalate at any architectural-judgment finding per the discipline floor.

---

## 7. Regression test obligations (merge-blocking for the SI-018 implementation PR)

1. **Tier 1 emission test:** emit a Cat A event with a specific patient — assert audit row's `hash_chain.partition` = `target_patient_id`; GENESIS for first-in-partition record = `SHA-256("GENESIS:PATIENT:<patient_id>")`.
2. **Tier 2 emission test:** emit a Cat B governance event (e.g., `protocol_activated`) with `target_patient_id = NULL` and `tenant_id = <tenant>` — assert partition = `tenant_id`; GENESIS = `SHA-256("GENESIS:TENANT:<tenant_id>")`.
3. **Tier 3 emission test:** emit a Cat B governance event with both `target_patient_id` and `tenant_id` NULL — assert partition = `_PLATFORM_`; GENESIS = `SHA-256("GENESIS:_PLATFORM_")`.
4. **Mixed-tier checkpoint test:** emit one event of each tier, run the 24-hour checkpoint, assert checkpoint hash includes all three partitions in deterministic sorted order.
5. **Chain verification test:** verify each tier's chain independently — assert tier-1 verification passes for patient-scope chain, tier-2 verification passes for tenant-scope chain, tier-3 verification passes for platform-scope chain.
6. **Cross-tier tamper detection test:** modify a tier-2 record — assert tier-2 chain detects break; tier-1 and tier-3 chains remain intact.
7. **GENESIS uniqueness test:** assert that the GENESIS hashes for tier-1 patient_id `X`, tier-2 tenant_id `X`, and tier-3 `_PLATFORM_` are all distinct (the PATIENT/TENANT/_PLATFORM_ prefixes ensure namespace separation).

All 7 are merge-blocking on the SI-018 implementation PR (not on the SI-018 ratification commit).

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

## 10. What ratifier needs to decide at SI-018 ceremony

**5 sub-decisions:**
1. Three-tier hybrid partition rule (APPROVED RECOMMENDATION as stated)
2. GENESIS hash format extension (APPROVED RECOMMENDATION as stated)
3. Per-event tier annotation table for the ~20 existing Cat B events (APPROVED RECOMMENDATION as stated; per-event ratifier review at Open Questions 2/3/4 may refine)
4. §Partitioning + §Chain construction + §Cross-partition checkpoint amendments (APPROVED RECOMMENDATION as stated)
5. I-027 amendment-or-not — RECOMMENDED: no amendment

**6 open questions:**
1. GENESIS format change is backward-compatible? (expected YES; verify)
2. `knowledge_base_updated` tier (tier 2 vs tier 3)
3. `dual_control_approval` tier (mixed tier 1/2 per-instance OK?)
4. `signal_enforcement_trigger` tier (mixed tier 1/2/3 per-instance OK?)
5. Cross-partition checkpoint scope (include zero-record partitions?)
6. Codex pre-ratification round count target

Estimated ratifier review time: ~30 minutes. The SI is narrow; the substantive decision is single (ratify the hybrid rule).

---

**End of SI-018 v0.1 DRAFT.**
