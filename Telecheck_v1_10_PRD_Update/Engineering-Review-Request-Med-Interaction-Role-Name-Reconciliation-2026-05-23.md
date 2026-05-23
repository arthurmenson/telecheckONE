# Engineering Review Request — Med-Interaction (SI-019) Migration Role-Name Reconciliation

**Status:** OPEN — ratifier decision required (hard-floor item 6 escalation)
**Date authored:** 2026-05-23
**Author:** Claude (Opus 4.7) — remote-cron autonomous firing
**Slice:** Medication Interaction Engine (SI-019; PRD v2.0 RATIFIED P-033; CDM v1.6→v1.7 P-034)
**Artifact type:** Engineering Review Request (ERR) per CLAUDE.md autonomous-work discipline §"Hard floor item 6"
**Codex dual-recommendation status:** **DEFERRED — Codex unavailable in this execution environment** (no `OPENAI_API_KEY`, no `codex` binary, Windows companion-script path `C:/Users/menso/...` not present on Linux container). The mandatory two-pass Codex consult (Pass-1 source-first independent + Pass-2 contrast-and-synthesize) **has not been run**. Per the auto-proceed rule, the agreement gate **cannot be evaluated** without Codex Pass-2; this escalation therefore STOPS for Evans's explicit chat-message ratification regardless of convergence.

---

## 1. Summary

Migrations `047`/`048`/`049`/`050` (Med-Interaction DB layer, merged to `telecheck-app:main` at `5da9766` during Evans's local session) GRANT/OWN/OWNED-BY **slice-prefixed** role names that **do not exist** in the migration chain. Migration `046` creates the roles in their **bare** form — which is the form the canonical spec (CDM v1.7 amendment §4.NEW3, P-034 §8) uses. A fresh `000 → 047` apply aborts:

```
ERROR: role "interaction_signal_override_wrapper_owner" does not exist
```

No production environment has applied these migrations (per Addendum 74), so fix-forward optionality across all options is preserved. The reconciliation **must land before Med-Interaction PR 7+** (Fastify handlers route EXECUTE grants through these roles).

## 2. The defect — exact role-name asymmetry

Migration `046` creates these **8 bare** infrastructure roles (matching spec P-034 §8):

| # | Bare role created in 046 | Slice-prefixed name referenced in 047–050 |
|---|---|---|
| 1 | `override_wrapper_owner` | `interaction_signal_override_wrapper_owner` |
| 2 | `lifecycle_transition_writer_owner` | `interaction_signal_lifecycle_transition_writer_owner` |
| 3 | `mv_refresh_owner` | `interaction_signal_mv_refresh_owner` |
| 4 | `emission_wrapper_owner` | `interaction_signal_emission_wrapper_owner` |
| 5 | `activation_wrapper_owner` | `interaction_signal_activation_wrapper_owner` |
| 6 | `superseded_wrapper_owner` | `interaction_signal_supersession_wrapper_owner` |
| 7 | `resolution_wrapper_owner` | `interaction_signal_resolution_wrapper_owner` |
| 8 | `expiry_wrapper_owner` | `interaction_signal_expiry_wrapper_owner` |

**NOTE the stem asymmetry on row 6:** the bare role is `superseded_wrapper_owner` but the prefixed reference is `interaction_signal_supersession_wrapper_owner` ("superseded" vs "supersession"). Any name-mapping fix must reconcile the **stem** too, not merely strip the `interaction_signal_` prefix. This rules out a naive prefix-strip script.

**Reference-site counts (current `main` @ `5da9766`):**

| File | Slice-prefixed reference sites |
|---|---|
| `migrations/047_med_interaction_entities.sql` | 6 |
| `migrations/048_med_interaction_view_mv_access_function.sql` | 15 |
| `migrations/049_med_interaction_raw_lifecycle_writer.sql` | 22 |
| `migrations/050_med_interaction_wrappers.sql` | 18 |
| `migrations/rollback/049_rollback.sql` | 8 |
| `migrations/rollback/050_rollback.sql` | 12 |
| **Total** | **81** |

(Rollback files 046/047/048 contain 0 prefixed references.)

## 3. KEY NEW FINDING — there is no recorded carryforward decision for slice-prefixing

Addendum 74 framed this as hard-floor item 6 partly on the premise that "the slice-prefixed role-name decision was recorded in `src/modules/med-interaction/README.md` as a cross-slice collision-safety choice." **This premise does not hold.** The README's Option-2 carryforward block (`src/modules/med-interaction/README.md` §"Option 2 ratifier decision") records a **role-naming** divergence, but it is exclusively about the two **dotted application-role** names (`medication_interaction.override_recorder` + `.knowledge_base_updater`) being realized as underscore forms because unquoted dotted identifiers are not valid PG roles. It says **nothing** about prefixing the wrapper-owner / writer / mv-refresh infrastructure roles.

Conversely, the canonical spec is unambiguous: CDM v1.7 amendment §4.NEW3 line 197 reads `GRANT INSERT ON interaction_signal_override TO override_wrapper_owner;` — **bare**. Migration `046` correctly creates the bare roles per that spec.

**Therefore the slice-prefixed references in 047–050 are most accurately characterized as a defect (inconsistent naming introduced during 047–050 authoring), not as the realization of a ratified design choice.** The spec-conformant end-state is the bare names. This materially shifts the recommendation away from Addendum 74's preliminary Option A.

## 4. Why this is still a hard-floor item 6 escalation (not a unilateral inline fix)

Although the spec points clearly at bare names, the *mechanism* of the fix is a genuine architectural/process judgment with two independent axes, each touching platform-floor primitives (DB roles) or merged-migration immutability:

- **Axis 1 — naming end-state:** bare (spec-conformant) vs slice-prefixed (introduces 8 net-new non-spec DB roles → hard-floor item 6 discriminator (c)).
- **Axis 2 — mechanism:** amend already-merged migrations in place (047–050 and/or 046) vs author a forward-fix migration 051 that leaves merged migrations untouched.

Choosing the slice-prefixed path (Axis 1) creates net-new platform-floor primitives beyond ratified scope. Choosing to amend merged migrations (Axis 2) is a process decision normally reserved for the pre-application window. Both are ratifier calls; Claude does not close them inline.

## 5. The four options

| Option | What | Naming end-state | Spec-conformant? | Migrations touched | Compatibility with open remote PR #192 |
|---|---|---|---|---|---|
| **A** | Forward-fix migration `051` creates the 8 slice-prefixed roles (as `IN ROLE bare_role` aliases or independent same-perm roles). 046–050 unchanged. | slice-prefixed (alongside bare) | NO — introduces 8 non-spec roles | +1 (051) | CLOSE #192 (its 047 rewrite becomes unnecessary) |
| **B** | Amend migration `046` in place to create the slice-prefixed roles instead of bare; re-author its verification block. 047–050 unchanged. | slice-prefixed | NO — diverges from spec §8 | 046 amend + 046 rollback amend | CLOSE #192 |
| **C** (remote-cron's choice) | Rewrite all GRANT/OWNER/OWNED-BY clauses in 047/048/049/050 (+ rollback 049/050) to the **bare** spec names. 046 unchanged. | bare | **YES** | 047+048+049+050 + rollback 049/050 (6 files, 81 sites) | EXPAND #192 to cover 048–050 + rollbacks (it currently fixes 047 + read-path 048 only) |
| **D** | Forward-fix migration `051` ALTER-ROLE-renames the 8 bare roles to slice-prefixed; update 046's verification block + add a 045-style operator note. | slice-prefixed | NO | +1 (051) + 046 verification update | CLOSE #192 |

## 6. Recommendations

### Claude's recommendation: **Option C** (spec-conformant bare-name reconciliation)

**Rationale (revised from Addendum 74's preliminary Option A):**

1. **Spec-conformance.** CDM v1.7 §4.NEW3 (P-034 §8) canonically uses bare names; migration 046 already creates them bare. Option C makes 047–050 match the ratified spec — it is the *least* architectural option (conform code to ratified spec), not the introduction of net-new primitives.
2. **No recorded justification for prefixing.** Per §3, the README records no slice-prefix carryforward decision. The prefixed references are a defect, not a design choice. Options A/B/D would *ratify a non-spec divergence* and create permanent spec-vs-code debt requiring a future hygiene reconciliation — the opposite of the Option-2 carryforward's stated goal of minimizing recorded divergences.
3. **No collision risk in practice.** Crisis Response and Admin Backend slices use their own role names (`crisis_*`, `admin_*` families); the bare Med-Interaction owner names (`override_wrapper_owner`, etc.) do not collide with them. The collision-safety rationale that *would* justify prefixing is hypothetical and unrecorded.
4. **Fix-forward window is open.** No environment has applied these migrations (Addendum 74), so amending 047–050 in place is low-risk and avoids leaving a known-broken chain in history that a forward-fix migration would paper over.

**Trade-off acknowledged:** Option C amends 4 already-merged migrations + 2 rollback files (81 sites). This is the most files touched. But the alternative (A/D forward-fix) leaves a chain in `main` history that aborts on fresh apply between 047 and 051 — meaning any partial replay (`000 → 049`) still fails. Amending in place is the only option that makes every prefix of the chain apply cleanly.

**Process-discipline note:** Option C requires amending merged migrations. This is acceptable **only** because no environment has applied them. The ratifier should confirm this precondition before authorizing C. If any environment HAS applied 047+, Option A (additive forward-fix) becomes mandatory and the naming question (bare-via-alias) must be revisited.

### Codex recommendation: **PENDING (deferred)**

Codex is unavailable in this remote-cron environment. The mandatory two-pass consult (Pass-1 source-first independent + Pass-2 contrast-and-synthesize) **must be run** — by Evans's local session (where the `codex@openai-codex` plugin is installed) or by a future remote firing in an environment provisioned with `OPENAI_API_KEY` — **before the ratifier decision is finalized**. Until both passes complete, the auto-proceed agreement gate cannot be evaluated and no fix may be executed.

## 7. Ratifier decision (to be completed)

> **Decision:** _pending_
> **Decided by:** _pending (Evans + Engineering Lead + CDM owner)_
> **Date:** _pending_
> **Codex Pass-1 verdict:** _pending_
> **Codex Pass-2 (synthesis) verdict:** _pending_
> **Promotion Ledger entry:** _pending_

## 8. Next steps (for the ratifier-executing session)

1. Run the Codex two-pass consult on this ERR (canonical incantations in CLAUDE.md §"Dual-recommendation process"). Surface Claude + Pass-1 + Pass-2 three-way.
2. Evans (with Engineering Lead + CDM owner) ratifies an option via chat-message. Record in §7 + a Promotion Ledger entry.
3. **Confirm the no-environment-has-applied precondition** before authorizing any amend-in-place option (B/C).
4. Execute the ratified option in a new PR cycle with full per-PR Codex APPROVE before merge.
5. Reconcile open remote PR #192 per the chosen option's compatibility column (EXPAND for C; CLOSE for A/B/D).
6. Land the fix, then resume Med-Interaction PR 7+ (Fastify handlers — currently blocked on this reconciliation).

---

*Filed per CLAUDE.md autonomous-work discipline. This ERR does NOT execute any fix; it tees up the ratifier decision. No production deploy, no schema ratification, no merge performed by the authoring firing.*
