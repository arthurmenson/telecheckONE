# SI-022 — Crisis Response Slice (Resource Lookup + Escalation Routing) Spec v1.0

**Version:** 0.43 DRAFT
**Status:** POST-R42 (2 HIGH closed inline: R42 HIGH-1 STEP 4b SQL block comment at line 343-345 still told implementers "sweep tier-advance uses INCREMENTED attempt_sequence via MAX+1 per-recipient lookup" — directly contradicted R39/R40/R41 sweep_cycle_counter contract. Replaced with sweep_cycle_counter UPDATE-RETURNING reference + explicit "MAX+1 model is FULLY SUPERSEDED" assertion. R42 HIGH-2 STEP 3 prose paragraph at line 563 still described a half-committed sweep retry seeing same sweep_cycle_id and no-oping inserts — contradicted R41 MED-1 single-atomic-transaction model. Removed half-committed paragraph; clarified the SOLE normative recovery contract: STEP 2-5 commit-or-rollback together; rollback discards everything atomically; post-commit ambiguity handled by outbox-worker dead-letter only. Previously POST-R41 (2 HIGH + 1 MED closed inline: R41 HIGH-1 Sub-decision 6 STEP 3 still had a live "Implementation: v_attempt_sequence := COALESCE((SELECT MAX(attempt_sequence)...), 0) + 1" paragraph contradicting R39/R40's sweep_cycle_counter contract. Removed entirely; replaced with sweep_cycle_counter-only language. R41 HIGH-2 test 16k still asserted "attempt_sequence = MAX(prior) + 1" — rewrote to assert sweep_cycle_id-based values (initial=1, first sweep=2, all recipients in a single sweep share same value). R41 MED-1 transaction model was contradictory (paragraph claimed half-committed sweep retry produces same value, but UPDATE-RETURNING semantics would actually increment). Clarified: STEP 2-5 are single atomic transaction; partial failure rolls back the increment too; post-commit failure is handled by canonical outbox-worker dead-letter SLO; no "half-committed" sweep state in the normative model. Previously POST-R40 (2 HIGH + 1 MED closed inline: R40 HIGH-1 sweep_cycle_counter DEFAULT 0 conflicted with initial attempt_sequence=1 — fixed to DEFAULT 1; initial detection STEP 2c INSERT establishes sweep_cycle_counter=1; STEP 4b initial dispatch uses attempt_sequence=1. First sweep increments to 2; subsequent sweeps increment to N+1. R40 HIGH-2 residual "attempt_sequence = MAX(prior) + 1" prose in §4.67 amendment-note contradicted R39 sweep_cycle_counter contract. Rewrote: attempt_sequence is now ALWAYS derived from sweep_cycle_counter (deprecated MAX+1 SUPERSEDED; do not implement against it anywhere). R40 MED-1 ROW_COUNT verification excluded emergency_contact rows (null principal_id) — fixed to count FULL mapping cardinality including emergency_contact; additional CHECK ensures principal-addressable rows have non-null principal_id. Previously POST-R39 (1 HIGH closed inline: R39 HIGH-1 R38's MAX+1 attempt_sequence recomputation was non-deterministic under retry — a sweep that partially committed could leave provider_attempt rows visible to a retry which would recompute MAX+1 and create new sequences (duplicate notifications) OR ON CONFLICT-noop while STEP 5 still advances tier (escalation state advances without recipient fan-out). Fix: extended notification_crisis_escalation_obligation with sweep_cycle_counter column; sweep transaction STEP 2 atomically increments + RETURNINGs v_sweep_cycle_id BEFORE fan-out; attempt_sequence = v_sweep_cycle_id (deterministic per-logical-sweep value); ON CONFLICT now correctly identifies same-logical-sweep retries; STEP 5 verifies expected ROW_COUNT before committing tier-advance (fewer rows = rollback + retry). Previously POST-R38 (1 HIGH closed inline: R38 HIGH-1 Sub-decision 6 STEP 3 sweep fan-out was prose-only — no normative INSERT statement, just rules. Implementer following the prose could create escalation-time provider_attempt rows without recipient_principal_id, causing R36 wrapper authorization to fail-closed for legitimate sweep-notified responders. Fix: added normative sweep INSERT statement to Sub-decision 6 STEP 3 mirroring STEP 4b's column list + ON CONFLICT contract; explicit MAX+1 attempt_sequence in SELECT projection; recipient_principal_id populated end-to-end. Added CHECK constraint requirement on provider_attempt asserting recipient_principal_id IS NOT NULL when recipient_role ∈ principal-addressable roles. Previously POST-R37 (1 HIGH closed inline: R37 HIGH-1 R36 wrapper authorization required provider_attempt.recipient_principal_id but STEP 4b + sweep INSERT contracts did not populate that column + compute_crisis_initial_recipient_mapping + compute_crisis_recipient_mapping output contracts did not return it. Legitimate responders would hit tier_ownership_unauthorized because no row had a principal_id binding to match against. Fix: (a) §4.67 amendment-prose extended with recipient_principal_id UUID NULL column (non-null for care_team/clinical_on_call/operator_escalation; nullable for emergency_contact); (b) STEP 4b INSERT now includes recipient_principal_id; (c) compute_crisis_initial_recipient_mapping + compute_crisis_recipient_mapping output contracts extended to return 4-tuple (channel, recipient_role, recipient_address, recipient_principal_id); (d) source derivation: tenant_account_membership.principal_id for care_team + clinical_on_call; tenant.operator_escalation_principal_id for operator_escalation; consent_grant.delegate_principal_id for delegate emergency_contact; (e) test 16l extended with assertion that provider_attempt rows from BOTH initial + sweep paths have non-null principal_id for principal-addressable roles + negative test for null-principal_id edge. Previously POST-R36 (2 HIGH + 1 MED closed inline: R36 HIGH-1 tier derivation only proved the principal was notified at SOME point, not that they own the current responsible tier — a care_team principal with an attempt row could still acknowledge after obligation advanced to clinical_on_call, repeatedly resetting deadlines and suppressing escalation pressure. Fix: added explicit "matched provider_attempt row's recipient_role MUST map to a tier ≥ current escalation_tier" check; lower-tier principals attempting acknowledge after advancement RAISE `tier_ownership_below_current_tier`. R36 HIGH-2 recipient_address equality fallback was inference-sensitive (address reuse, stale phone/email ownership, formatting aliases, shared mailboxes could match). Fix: extended provider_attempt with `recipient_principal_id UUID` (R28-style schema extension) populated at STEP 4 dispatch from immutable JWT-subject identity; wrapper lookup now matches `recipient_principal_id = JWT principal_id` (NOT raw address); address-equality fallback REMOVED. R36 MED-1 test ordering 16a-i then 16l-k-j. Fix: reordered to 16a-l sequential. Test 16l extended with negative variants for R36 HIGH-1 (lower-tier-after-advance) + R36 HIGH-2 (address-collision-with-different-principal). Previously POST-R35 (1 HIGH closed inline: R35 HIGH-1 R34 wrapper tier parameter was caller-controlled — a care-team-tier responder could pass acknowledging_tier='regulatory' and advance escalation_tier to skip clinical_on_call escalation pressure. Fix: removed caller-supplied tier parameter from both wrappers; tier is now DERIVED inside the SECURITY DEFINER wrapper from the JWT-bound principal by looking up the principal's recipient_role in the canonical notification_crisis_provider_attempt row (care_team → 'care_team', clinical_on_call → 'clinical_on_call', operator_escalation → 'regulatory'). If no eligible provider_attempt row exists for the JWT-verified principal, RAISES `tier_ownership_unauthorized`. Added test 16l (positive + negative variants asserting tier-ownership authorization). Test count 27 → 28 assertions; sub-cluster 16a-16k → 16a-16l. Previously POST-R34 (2 HIGH closed inline: R34 HIGH-1 test 16k contradicted R29/R30 MAX+1 escalation-time re-notification contract — said first sweep is idempotent on already-attempted tuples. Rewrote 16k assertion: first sweep MUST INSERT new provider_attempt rows with attempt_sequence=MAX+1 for EVERY clinical_on_call recipient including already-dispatched ones; ON CONFLICT DO NOTHING is for worker-retry only. R34 HIGH-2 acknowledge/respond wrappers left escalation_tier unchanged — a clinical_on_call recipient initially dispatched at R26 multi-tier detection-time acknowledging from their tier directly would have left escalation_tier='care_team' so subsequent no-response timeout advances from stale care_team instead of from the actual responsible tier (delaying regulatory pressure by one cycle). Fix: extended record_crisis_acknowledgement_claim(acknowledging_tier) + record_crisis_response(responding_tier) wrappers to accept tier parameter + set `escalation_tier = GREATEST(escalation_tier, acknowledging_tier)` so escalation_obligation tracks the actual responsible tier. Tier-ownership rule prevents post-ack/post-respond timer from advancing from a stale tier. Previously POST-R33 (1 HIGH closed inline: R33 HIGH-1 sweep compute_crisis_recipient_mapping source list did NOT include tenant.crisis.emergency_contact_channel after R31/R32 introduced it for STEP 4b initial-dispatch; the clinical_on_call sweep target_tier branch needs the same key to produce the emergency_contact tuple on a non-SMS configured channel. Implementer following the sweep function source list could pass preflight/runtime Part C yet still fail to route emergency-contact sweep notifications. Fix: added tenant.crisis.emergency_contact_channel to compute_crisis_recipient_mapping source list with explicit Part C cross-reference; extended target_tier='clinical_on_call' branch description to enumerate emergency_contact tuple (emergency_contact_channel, 'emergency_contact', emergency_contact_address) IFF active emergency_contact_share consent_grant — channel is tenant-configured (NOT hardcoded SMS). Previously POST-R32 (2 HIGH closed inline: R32 HIGH-1 R31 closure log claimed preflight + TLC-CRISIS-003 + runtime all enforce emergency_contact_channel, but ONLY TLC-CRISIS-003 had the new rule — preflight stayed two-part, runtime stayed two-part. Fix: added Part C to deployment preflight DO block + 3rd assertion to record_crisis_initiation() runtime validation matching the TLC-CRISIS-003 predicate exactly (emergency_contact_channel non-null + ∈ fanout_channels[] IFF emergency_contact_consent_enabled=true). R32 HIGH-2 Sub-decision 3 routing tree + OQ6 still hardcoded channel='sms' for emergency_contact dispatch — contradicted R31 introduction of tenant-configurable emergency_contact_channel; tenant configuring email/in_app_push for emergency_contact_channel would have been silently misrouted. Fix: replaced all SMS-hardcoded emergency_contact routing language with `crisis.emergency_contact_channel`; updated routing tree step 4, OQ6 (c), and Sub-decision 5 SQL comment. Previously POST-R31 (1 HIGH closed inline: R31 HIGH-1 emergency-contact dispatch could be silently skipped when tenant allows emergency_contact_share consent but has not configured an emergency_contact_channel in fanout_channels[] — STEP 4a only creates dispatch_ledger rows for configured channels, so emergency_contact provider_attempt rows would have zero parent dispatch_ledger row to attach to. Fix: added 5th canonical tenant config key `crisis.emergency_contact_channel` to OQ4; added 3rd rule set to TLC-CRISIS-003 + preflight + runtime enforcement requiring emergency_contact_channel non-null AND in fanout_channels[] IFF tenant `emergency_contact_consent_enabled=true` (the slice-level toggle for whether patients may grant emergency_contact_share consent). When true: emergency_contact_channel MUST be configured so an emergency-contact dispatch_ledger row exists at STEP 4a + the emergency-contact recipient is reachable. Previously POST-R30 (1 CRITICAL + 1 HIGH closed inline: R30 CRITICAL-1 STEP 4b SQL had a duplicate trailing `FROM compute_crisis_initial_recipient_mapping(...)` clause after the statement terminator — implementer copying the block hits PostgreSQL syntax error; outbox worker fails before any initial provider_attempt rows insert. Fix: removed the stale duplicate FROM line; STEP 4b is now exactly one complete INSERT ... SELECT ... FROM ... ON CONFLICT ... DO NOTHING statement. R30 HIGH-2 Sub-decision 5 idempotency-contract prose still said "initial-dispatch rows (attempt_sequence=1) collide with first-sweep tier-advance attempts on the same recipient and are silently no-op'd" — contradicts R29 HIGH-2 MAX+1 contract. Rewrote: ON CONFLICT is for worker-retry idempotency ONLY (same logical transaction re-running emits same tuple, correctly no-op'd); sweep tier-advance + final-tier recheck inserts compute attempt_sequence=MAX+1 so escalation-time re-notification is NEVER suppressed. Previously POST-R29 (2 HIGH closed inline: R29 HIGH-1 STEP 4b SQL had ON CONFLICT misplaced before FROM clause — not executable PostgreSQL. Fix: rewrote with canonical INSERT ... SELECT ... FROM ... ON CONFLICT ... DO NOTHING ordering. R29 HIGH-2 the R28 attempt_sequence=1 rule across both initial dispatch AND sweep tier-advance would have silently no-op'd escalation-time recipients already dispatched at detection (life-threatening: clinical_on_call notified at detection then NOT re-notified at first sweep tier-advance, hiding stale initial notification behind apparently-successful escalation). Fix: changed contract — attempt_sequence INCREMENTS on EVERY tier-advance AND every final-tier recheck via MAX+1 lookup per-recipient. Initial dispatch attempt_sequence=1; first sweep tier-advance = 2 for already-dispatched recipients (re-notify) + 1 for net-new recipients; subsequent advances/rechecks = N for already-dispatched + 1 for net-new. ON CONFLICT only fires on worker-retry idempotency within same transaction; escalation-time re-notification is GUARANTEED. Previously POST-R28 (1 HIGH closed inline: R28 HIGH-1 R27 idempotency key UNIQUE(tenant_id, crisis_event_id, channel, recipient_role, recipient_address, attempt_sequence) was not implementable — P-027 §4.67 provider_attempt schema does NOT have a crisis_event_id column, and the normative STEP 4b/sweep INSERTs did not populate it. ON CONFLICT target was undefined. Fix: this SI now extends P-027 §4.67 provider_attempt at the P-040 CDM follow-on amendment to add crisis_event_id UUID NOT NULL with composite FK; created canonical UNIQUE constraint name `notification_crisis_provider_attempt_idempotency_uk`; updated every provider_attempt INSERT in this SI to populate crisis_event_id AND use `ON CONFLICT ON CONSTRAINT notification_crisis_provider_attempt_idempotency_uk DO NOTHING`; idempotency contract now physically enforceable. Previously POST-R27 (1 HIGH closed inline: R27 HIGH-1 R26's immediate high-urgency dispatch at STEP 4b would have caused duplicate provider_attempt INSERTs at the first sweep (Sub-decision 6 STEP 3 re-inserting clinical_on_call/emergency_contact/operator_escalation rows already present from initial dispatch), producing either double-notifications or transaction rollback on uniqueness constraint. Fix: added normative idempotency contract — provider_attempt UNIQUE(tenant_id, crisis_event_id, channel, recipient_role, recipient_address, attempt_sequence); sweep tier-advance INSERTs use ON CONFLICT DO NOTHING against initial-dispatch rows (same attempt_sequence=1); final-tier recheck cycles compute v_attempt_sequence = MAX(prior) + 1 to enable intentional re-notification (recheck pressure). Previously POST-R26 (1 HIGH closed inline: R26 HIGH-1 R25's STEP 4b "target_tier='care_team' only" initial-fan-out canonical form contradicted Sub-decision 3 routing tree's IMMEDIATE high-urgency recipient dispatch — imminent/life-threatening events would have delayed clinical_on_call/emergency_contact/operator_escalation by 30s (life-threatening) or 60s (imminent) waiting for first sweep tier-advance. Fix: introduced separate `compute_crisis_initial_recipient_mapping(crisis_event_id, severity, regulatory_reporting)` function for STEP 4b initial dispatch that returns ALL Sub-decision 3 eligible recipients per severity/consent/regulatory_reporting AT DETECTION TIME. The existing `compute_crisis_recipient_mapping(..., target_tier)` remains for Sub-decision 6 sweep tier-advance ADDITIONS. Two-function separation discipline. Updated test 16k from "care_team only" to "all Sub-decision 3 eligible recipients at detection" with explicit per-severity assertions. Previously POST-R25 (1 HIGH closed inline: R25 HIGH-1 Sub-decision 5 STEP 4b call to compute_crisis_recipient_mapping still used 2-arg form `(v_crisis_event_id, v_severity)` while R24 contract immediately below + all sweep call sites in Sub-decision 6 use 3-arg form with target_tier. Implementer following STEP 4b SQL could either over-notify at detection or miss initial care-team fan-out. Fix: STEP 4b call updated to 3-arg `(v_crisis_event_id, v_severity, 'care_team')` for initial care-team-tier fan-out; explicit comment stating every normative call site MUST pass non-null target_tier. Added test 16k asserting initial STEP 4b produces ONLY care_team target_tier rows (not clinical_on_call/regulatory). Test count 26 → 27 assertions; sub-cluster 16a-16j → 16a-16k. Previously POST-R24 (1 HIGH closed inline: R24 HIGH-1 compute_crisis_recipient_mapping normative function contract listed input sources (fanout_channels, clinical_on_call_channel, care_team_member, consent_grant, severity) but did NOT include operator_escalation_channel/operator_escalation_recipient — implementer following Sub-decision 5 had no specified source for the regulatory target_tier provider_attempt row, so life-threatening regulatory final-tier exhaustion/rechecks could again produce no provider_attempt rows. Fix: extended compute_crisis_recipient_mapping source list to include operator_escalation_channel + operator_escalation_recipient + explicit target_tier branch contract enumerating per-tier output tuples (care_team → care-team-member tuples on configured channels; clinical_on_call → 1 tuple + emergency_contact IFF consent grant; regulatory → exactly 1 tuple (operator_escalation_channel, 'operator_escalation', operator_escalation_recipient) guaranteed non-null via Part B preflight). Previously POST-R23 (1 HIGH closed inline: R23 HIGH-1 enforcement points 1-3 still scoped to regulatory_reporting=true, contradicting R22's every-tenant rule for fanout_channels[]/clinical_on_call_channel. Rewrote all three enforcement-point bullets to SPLIT enforcement: Part A always-mandatory keys (fanout_channels[] + clinical_on_call_channel + clinical_on_call_channel ∈ fanout_channels[]) at every layer + Part B regulatory_reporting=true conditional keys (operator_escalation_channel + operator_escalation_recipient + operator_escalation_channel ∈ fanout_channels[]) at every layer. Preflight + TLC-CRISIS-003 + record_crisis_initiation() runtime all match this split scope. Previously POST-R22 (1 HIGH closed inline: R22 HIGH-1 OQ4 enforcement contract only made crisis.clinical_on_call_channel mandatory for regulatory_reporting=true tenants; a regulatory_reporting=false tenant with null clinical_on_call_channel could have advanced to clinical_on_call and produced empty fan-out at the terminal-risk state R16/R20/R21 protected. Fix: tightened R19 enforcement contract — fanout_channels[] + clinical_on_call_channel required on EVERY tenant; clinical_on_call_channel MUST be in fanout_channels[]; operator_escalation keys remain conditionally required on regulatory_reporting=true only. Added negative-config test 16j asserting preflight + TLC-CRISIS-003 + runtime validation all reject a tenant with null clinical_on_call_channel. Test count 25 → 26 assertions; sub-tests 16a-16i → 16a-16j. Previously POST-R21 (1 HIGH + 1 MED closed inline: R21 HIGH-1 STEP 5 still used non-tenant-aware next_tier(escalation_tier, severity) for the actual tier update — R20 only updated STEP 3 target_tier computation; implementer following STEP 5 could still advance regulatory_reporting=false life-threatening from clinical_on_call to regulatory or fail to mark clinical_on_call as final-tier exhausted. Fix: rewrote STEP 5 to use tenant-aware `next_tier(current_tier, severity, v_regulatory_reporting)` everywhere (escalation_tier advance + undeliverable_deadline CASE + final_tier_exhausted_at detection); explicit "v_regulatory_reporting read ONCE from tenant_config at sweep transaction start and reused for STEP 3 + STEP 5". R21 MED-1 test 16i was added at R20 but not enumerated in CI gate list — updated to "17 base entries with 16 expanded into 16a-16i (9 sub-tests)"; CI gate now lists 16i; total assertions 24 → 25. Test 16g explicitly scoped to regulatory_reporting=true tenants for life-threatening regulatory-tier path. Previously POST-R20 (1 HIGH closed inline: R20 HIGH-1 next_tier() function was not tenant-aware — for regulatory_reporting=false tenants whose operator_escalation keys MAY be null per R19, the unconditional clinical_on_call → regulatory advancement for life-threatening severity would have routed life-threatening crises into a regulatory tier with no configured operator_escalation recipient, reintroducing audit-only or runtime-failing final-tier path. Fix: next_tier() now takes a third argument `regulatory_reporting`; clinical_on_call → regulatory advancement requires `severity='life_threatening' AND regulatory_reporting=true`. For regulatory_reporting=false tenants, clinical_on_call becomes the de-facto final tier for ALL severities. v_target_tier computation in Sub-decision 6 STEP 3 updated to pass v_regulatory_reporting from tenant_config. Added test 16i covering regulatory_reporting=false life-threatening final-tier-at-clinical_on_call path. Previously POST-R19 (1 HIGH closed inline: R19 HIGH-1 OQ4 added the 2 new R18 operator_escalation tenant config keys but did NOT explicitly require them to be non-null/non-empty when regulatory_reporting=true — tenants could have regulatory_reporting=true while operator_escalation_channel/recipient is null, making final-tier rechecks audit-only or runtime-failing at the terminal-risk state R18 was meant to fix. Fix: OQ4 enforcement contract now explicitly forbids the 4 keys (fanout_channels[] + clinical_on_call_channel + operator_escalation_channel + operator_escalation_recipient) from being empty/null on regulatory_reporting=true tenants; operator_escalation_channel MUST be present in fanout_channels[] so the dispatch_ledger row is established at STEP 4a. Three enforcement points enumerated: (1) deployment preflight DO block, (2) extended static-analyzer rule TLC-CRISIS-003, (3) wrapper-procedure runtime validation in record_crisis_initiation(). For tenants with regulatory_reporting=false, operator_escalation keys MAY be null and clinical_on_call becomes the de-facto final tier for life-threatening crises. Previously POST-R18 (1 HIGH + 1 MED closed inline: R18 HIGH-1 regulatory tier was modeled in Sub-decision 3 as a downstream Adverse-Event consumer (not a direct dispatch_ledger recipient), but R16 required final-tier recheck fan-out to target regulatory with non-empty provider_attempt rows — implementer would have hit a contradictory contract. Fix: introduced `operator_escalation` recipient role at the regulatory tier (platform-operator on-call); added 2 tenant config keys to OQ4 (`crisis.operator_escalation_channel` + `crisis.operator_escalation_recipient`); compute_crisis_recipient_mapping(..., target_tier='regulatory') now returns the operator_escalation (channel, recipient_address) tuple so final-tier rechecks produce non-empty fan-out. Adverse-Event/regulatory-authority downstream notification remains via the existing `crisis.regulatory_threshold_reached` Cat A audit (separate from operator_escalation dispatch). R18 MED-1 test count contract was internally inconsistent: "17 (with 16 expanded into 16a-16d)" but enumerated 16a-16h. Updated count language: "17 base entries with 16 expanded into 16a-16h sub-cluster"; explicit CI gate language enumerating all 24 individual assertions (15 base + 8 sub-tests + 1 benchmark) required to PASS for merge. Previously POST-R17 (1 HIGH closed inline: R17 HIGH-1 Sub-decision 5 still embedded a stale pre-R13 inline sweep SQL summary that described next_tier=NULL as terminal exclusion + contradicted Sub-decision 6's R13/R16 final-tier-preservation contract. Implementer using Sub-decision 5's embedded sweep description as wire-up reference would recreate the R13 failure. Fix: removed the stale embedded sweep SQL summary from Sub-decision 5; replaced with a SHORTENED cross-reference block pointing to Sub-decision 6 as the SINGLE normative SQL contract for the no-ack sweep + enumerating which R-closures live where (R10/R11/R12 sweep predicate + STEP 1 mapping + R13/R14/R15/R16 final-tier preservation + ONLY-resolve terminalization). Anti-drift discipline: Sub-decision 6 is the single authoritative SQL contract; Sub-decision 5 no longer duplicates sweep logic. Previously POST-R16 (1 HIGH closed inline: R16 HIGH-1 final-tier exhaustion/recheck path passed NULL next_tier to compute_crisis_recipient_mapping → audit-only rechecks with no recipient fan-out at the exact unresolved terminal-risk state. Fix: introduced explicit `target_tier := COALESCE(next_tier(escalation_tier, severity), escalation_tier)` in STEP 3 so pre-exhaustion sweeps target the next tier (advance), while final-tier exhaustion + recheck sweeps target the CURRENT final tier (continuing pressure on terminal responsible tier). Final-tier rechecks produce non-empty provider_attempt fan-out (NOT audit-only). Added test 16h asserting non-imminent + imminent final-tier exhaustion fan-out targets clinical_on_call; updated 16g to assert regulatory-tier fan-out on life-threatening final-tier. Previously POST-R15 (1 HIGH closed inline: R15 HIGH-1 tests #9 + #10 still asserted pre-R13 terminal-tier behavior (set escalation_tier=NULL on final-tier exhaustion); for non-imminent/imminent crises whose final tier is clinical_on_call, the tests would have blessed permanent suppression of unresolved final-tier rechecks. Test #9 + #10 rewritten to match R13/R14 normative rule: final-tier exhaustion PRESERVES escalation_tier at terminal value (clinical_on_call for non-imminent/imminent; regulatory for life-threatening); final_tier_exhausted_at set once; INTERVAL_final_tier_recheck_window schedules continuing rechecks with is_final_tier_recheck=true payload; ONLY record_crisis_resolution() sets escalation_tier=NULL. Test #10 (e)/(f)/(g) explicit per-severity assertions added. Previously POST-R14 (1 HIGH closed inline: R14 HIGH-1 the multi-tier progression worked example in Sub-decision 6 still said sweep #3 sets escalation_tier=NULL — directly contradicting R13's split-tier-from-resolution-terminal closure. Implementer using the worked example as executable contract would recreate the R13 failure. Fix: rewrote the worked example to show sweep #3 preserving escalation_tier='regulatory' + setting final_tier_exhausted_at + emitting one-time crisis.final_tier_reached Cat A + scheduling INTERVAL_final_tier_recheck_window (life-threatening 5min); added sweep #4 showing the recheck cadence with is_final_tier_recheck=true payload; final paragraph showing only record_crisis_resolution() terminalizes by setting escalation_tier=NULL. Previously POST-R13 (1 HIGH closed inline: R13 HIGH-1 final-tier exhaustion incorrectly conflated tier-exhausted-but-unresolved with resolved-terminal by setting escalation_tier=NULL on next_tier=NULL. For life-threatening at regulatory or imminent/non-imminent at clinical_on_call, an acknowledged_no_response_timeout or responded_no_resolution_timeout would set escalation_tier=NULL, permanently excluding the unresolved row from sweep. Fix: split tier-exhaustion from resolution-terminal — at final-tier, escalation_tier is PRESERVED at its terminal value (not set to NULL); new column `final_tier_exhausted_at` tracks first exhaustion timestamp; new `crisis.final_tier_reached` Cat A audit emitted once at first exhaustion (AUDIT total 7 → 8 actions; 6 Cat A → 7 Cat A); subsequent re-sweeps fire on INTERVAL_final_tier_recheck_window cadence (non-imminent 30min / imminent 10min / life-threatening 5min) emitting standard crisis.no_acknowledgement_escalation Cat A with payload `is_final_tier_recheck=true`. ONLY record_crisis_resolution() setting escalation_tier=NULL terminalizes. Added test 16g for final-tier exhaustion + recheck. Previously POST-R12 (2 HIGH closed inline: R12 HIGH-1 Sub-decision 6 normative SQL block still had `current_state IN ('detected', 'escalated')` predicate from R10; an implementer following the SQL would miss the R11 acknowledged + responded eligibility extension. Fix: updated SQL predicate to `current_state IN ('detected', 'escalated', 'acknowledged', 'responded')` + inline comment enumerating the 4 valid escalated-to triples. R12 HIGH-2 per-row STEP 1 algorithm still only handled detected + escalated reason switching; implementer running sweep on acknowledged/responded would hit CHECK constraint violation. Fix: rewrote STEP 1 as a four-way table mapping (detected→no_acknowledgement_timeout / escalated→tier_progression_no_acknowledgement / acknowledged→acknowledged_no_response_timeout / responded→responded_no_resolution_timeout) + implementer pseudocode CASE statement; all 4 triples now enumerated in §6 + Sub-decision 4 + Sub-decision 6 + tests 16a-f. Previously POST-R11 (1 HIGH closed inline: R11 HIGH-1 R10's terminalization-on-acknowledge created an unbounded acknowledged-without-response hole — clinician acknowledges then never responds, sweep permanently disabled. Fix: revised wrapper contract so ONLY `record_crisis_resolution()` terminalizes; `record_crisis_acknowledgement_claim()` + `record_crisis_response()` instead RESET the deadline (to INTERVAL_for_severity_response_window and INTERVAL_for_severity_resolution_window respectively) + escalation_key=NULL; escalation_tier unchanged. Added 2 new transition triples to state machine: `acknowledged → escalated` (reason `acknowledged_no_response_timeout`) + `responded → escalated` (reason `responded_no_resolution_timeout`, distinct from existing `response_failed`). Sweep eligibility expanded to `current_state IN ('detected','escalated','acknowledged','responded')`. State-machine triple count: 9 (post-R8) → 11 (post-R11). Test 16 sub-cluster expanded from 16a-d to 16a-f (added 16e acknowledge-then-no-response timeout + 16f respond-then-no-resolution timeout). Previously POST-R10 (1 HIGH closed inline: R10 HIGH-1 no-ack sweep didn't exclude acknowledged/resolved lifecycle states — an already-acknowledged event whose obligation row was not terminalized would have been picked up by the sweep and attempted an invalid `acknowledged → escalated` transition (rolled-back transaction) OR escalated despite acknowledgement (wedging timer noise). Fix: added two-layer protection — (1) PRIMARY: terminalization contract requires `record_crisis_acknowledgement_claim()` + `record_crisis_response()` + `record_crisis_resolution()` wrappers to atomically set `escalation_tier = NULL` on the corresponding obligation row (BEFORE UPDATE trigger allows ONLY sweep-cycle tier advances or terminalization to NULL); (2) BACKSTOP: sweep predicate adds LATERAL JOIN against crisis_event_lifecycle_transition + filter `current_state IN ('detected', 'escalated')` so missed terminalizations cannot cause invalid transition attempts. Added 4 sub-tests 16a-d for terminalization-per-wrapper + lifecycle-eligibility backstop. Test count: 16 → 17 (16 expanded into 16a-d sub-cluster + #17 contention benchmark). Previously POST-R9 (1 HIGH closed inline: R9 HIGH-1 Sub-decision 4 lifecycle diagram still enumerated only 8 transition triples (omitted the 9th `escalated → escalated` triple added at R8 closure to §6 + Sub-decision 6) — implementer using Sub-decision 4 as state-machine source could have shipped the old 8-transition CHECK + rejected sweep #2 + #3 (the exact R8 failure scenario). Fix: added `escalated → escalated (tier_progression_no_acknowledgement)` to Sub-decision 4 diagram + updated "9 allowed triples" count with explicit R9 closure cross-reference to §6 + Sub-decision 6 STEP 1. All three normative state-machine locations now enumerate the same 9 triples. Previously POST-R8 (1 HIGH closed inline: R8 HIGH-1 multi-tier sweep tries to INSERT `escalated → escalated` lifecycle transitions but the state-machine transition triples table only permitted `detected → escalated` + `responded → escalated` (initial transitions into escalated); subsequent tier advances on sweep #2 + #3 would have failed CHECK constraint, rolling back the sweep transaction + wedging clinical_on_call/regulatory tier progression permanently — the exact R6 HIGH-1 failure mode resurfaced through a different mechanism (state-machine, not escalation_key). Fix: added 9th transition triple `escalated → escalated` with reason `tier_progression_no_acknowledgement` for multi-tier sweep advances; updated Sub-decision 6 STEP 1 normative contract to switch transition reason by current state ('no_acknowledgement_timeout' from 'detected', 'tier_progression_no_acknowledgement' from 'escalated'); updated state-machine §6 transition triples table to 9 enumerated triples. Previously POST-R7 (1 HIGH + 1 MED closed inline: R7 HIGH-1 Sub-decision 6 prose was the authoritative normative timer contract but still specified the pre-R6 one-shot escalation_key model (select where escalation_key IS NULL; set escalation_key one-way mutable; stop after first emit) — implementers could have shipped the exact clinical_on_call/regulatory timeout suppression R6 was supposed to close. Fix: rewrote Sub-decision 6 entirely as the normative tier-cycle resettable contract — sweep predicate adds `escalation_tier IS NOT NULL` terminal exclusion; per-row atomic 5-step closure with explicit STEP 5 reset (escalation_tier advance + escalation_key=NULL release + new deadline compute); explicit next_tier() + INTERVAL_for_severity_and_tier() canonical functions; multi-tier worked example showing 3 sweep cycles ending in terminal exclusion; explicit difference-from-one-shot-model paragraph. R7 MED-1 tests #9 + #10 still asserted pre-R6 one-shot idempotency — replaced with tier-cycle progression assertions: each tier transition fires in sequence (care_team → clinical_on_call → regulatory or terminal per severity); re-running sweep during in-flight cycle is no-op (claim lock); re-running after reset + before next deadline is no-op (deadline not expired); re-running after next deadline DOES advance; terminal exclusion. Previously POST-R6 (2 HIGH + 1 MED closed inline: R6 HIGH-1 escalation_key one-shot model suppressed all subsequent tier timeouts (clinical_on_call/regulatory no-ack would never be detected) — restructured Sub-decision 6 sweep contract as TIER-CYCLE resettable: per-row 5-step closure now (a) lifecycle transition INSERT, (b) escalation_key claim, (c) recipient fan-out via compute_crisis_recipient_mapping(crisis_event_id, severity, next_tier), (d) Cat A audit emit, (e) UPDATE escalation_obligation advancing escalation_tier + resetting escalation_key=NULL + computing new undeliverable_deadline = now() + INTERVAL_for_severity_and_tier; sweep predicate excludes terminal-tier rows where escalation_tier IS NULL (final tier reached). R6 HIGH-2 STEP 1 Cat A emit + STEP 2 row inserts were two separate transactions which would have allowed STEP 1 to commit durably while STEP 2 failed (audit-only crisis detections) — restructured ordering as ATOMIC: STEP 1 Cat A audit INSERT + STEP 2 sub-steps 2a-2d in a single BEGIN...COMMIT transaction via the canonical FLOOR-020 audit-co-transactional pattern; on rollback no Cat A row commits + ERROR surfaced + I-019 preserved. R6 MED-1 benchmark test #16 was claimed in R5 closure narrative but not actually in the Sub-decision 7 enumerated list (was "15 merge-blocking integration tests") — added test #16 with specific workload (1000 concurrent INSERTs across 50 tenants, 100 req/s sustained 10s) + pass/fail threshold (p99 ≤ 180ms across 5 consecutive runs) + isolation assumptions + CI gate; updated count to "16 merge-blocking integration tests". Previously POST-R5 (1 HIGH + 1 MED closed inline: R5 HIGH-1 STEP 2c escalation_obligation INSERT row shape was under-specified for the Sub-decision 6 sweep — only tenant_id/patient_id/server_signal_id/escalation_key/undeliverable_deadline persisted; sweep needed to either JOIN through server_signal_id or derive lifecycle state to recover crisis_event_id + severity + current escalation tier. Fix: this SI extends the P-027 §4.68 escalation_obligation row shape with explicit `crisis_event_id` (composite FK to crisis_event), `severity` (enum), and `escalation_tier` (enum {care_team, clinical_on_call, regulatory}) columns; Sub-decision 6 sweep contract now explicit on the SELECT predicate + 5-step closure per-row (transition INSERT + escalation_key UPDATE + escalation_tier advance + recipient fan-out via compute_crisis_recipient_mapping + Cat A audit emit). R5 MED-1 200ms SLO was asserted without per-operation budget + failure/timeout contract — added STEP 2 per-operation latency budget table (p50 + p99 + indexes + degraded behavior per operation; STEP 1+2+3 cumulative p99 ≤ 180ms); added merge-blocking benchmark test #16 under simulated contention; explicit fail-closed posture on any STEP 2 sub-step failure (transaction rollback + ERROR surfaced + no card render against partial state). Previously POST-R4 (3 HIGH closed inline: R4 HIGH-1 Sub-decision 3 had residual "executed at Sub-decision 2 STEP 2c-2d ... synchronous with STEP 2" text contradicting R3 HIGH-1 closure — rewrote routing tree as ELIGIBILITY only with execution explicitly delegated to STEP 4. R4 HIGH-2 Sub-decision 3 had stale "CCR resolvers at STEP 4 + hydration at STEP 5" mapping pre-R3 renumbering (post-R3 ordering: STEP 4 = dispatch setup, STEP 5 = CCR + hydration) — corrected mapping. R4 HIGH-3 (safety-critical) stuck STEP 4 outbox row would have denied the no-acknowledgement timer ever firing because escalation_obligation INSERT was at STEP 4c — moved escalation_obligation INSERT into STEP 2c (synchronous, in same transaction as Cat A audit + crisis_event INSERT) so the deadline source-of-truth row is guaranteed-armed; the Sub-decision 6 no-ack sweep now always has a row to find regardless of STEP 4 worker progress. Previously POST-R3 (1 HIGH + 1 MED closed inline: R3 HIGH-1 dispatch setup at STEP 2c-2e ahead of STEP 3 card render violated the 200ms patient-surface SLO under many recipients, transient DB contention, or provider-channel unavailability — moved dispatch setup to a new STEP 4 asynchronous bounded outbox worker invoked via same-tx outbox row from STEP 2 transaction; STEP 1+2+3 only is the synchronous patient-surface path (Cat A emit + crisis_event INSERT + card render); the 200ms SLO now applies to STEP 1-3 exclusively, with STEP 4 dispatch and STEP 5 CCR resolution out-of-band. R3 MED-1 SQL literal `VALUES (..., 'sms'), (..., 'email'), (..., 'in_app_push')` would have inserted unconditional rows for channels the tenant has not configured (false undeliverable_deadline misses + bogus dispatch_attempt_failed audit volume) — rewrote STEP 4a as SELECT-driven from `unnest(tenant.crisis.fanout_channels[])`; STEP 4b as SELECT-driven from a STABLE function `compute_crisis_recipient_mapping(crisis_event_id, severity)` that joins tenant config + care_team + consent_grant + severity for the exact recipient set; deployment preflight asserts `cardinality(tenant.crisis.fanout_channels[]) > 0` (I-019 platform-floor); worker FAILS CLOSED if empty at runtime. Previously POST-R2 (1 HIGH + 1 MED closed inline: R2 HIGH-1 Sub-decision 3 routing tree contradicted Sub-decision 2 STEP 1-5 emit ordering by listing "render card → Cat B emit → crisis_event INSERT" as the canonical sequence; implementer following Sub-decision 3 could reintroduce R1 HIGH-1 FLOOR-020 coupling. Fix: rewrote Sub-decision 3 to specify LOGICAL recipient routing only, with explicit execution-order assertion deferring entirely to Sub-decision 2 STEP 1-5; added "Sub-decision 2 is authoritative on emit ordering; Sub-decision 3 is authoritative on logical routing destinations only" anchor. R2 MED-1 audit category tally arithmetic ("5 Cat A + 0 Cat B + 2 Cat C" said but actual rows are 6 Cat A + 0 Cat B + 1 Cat C); corrected tally in §1 + §3 + R1 MED-1 log entry. Also fixed §8 SLO row "30 seconds of `crisis.no_acknowledgement_escalation` Cat B emit" → Cat A to match §3 table + Sub-decision 6 fail-closed claim. Previously POST-R1 (2 HIGH + 1 MED closed inline: R1 HIGH-1 CCR lookup was placed on FLOOR-020 synchronous emit path, contradicting non-blocking detection invariant — restructured Sub-decision 2 with explicit STEP 1-5 emit ordering placing Cat A `crisis_detection_trigger` synchronous and FLOOR-020 fail-closed; CCR resolution + `crisis.escalation_destination_resolved` Cat B explicitly DOWNSTREAM and asynchronous; Crisis Response Card MAY render with cached/generic content at STEP 3 then hydrate at STEP 5 after CCR resolution; resolver failure never blocks Cat A detection emission. R1 HIGH-2 dispatch_ledger UNIQUE(tenant_id, patient_id, server_signal_id, channel) cannot represent multi-recipient fan-out (care-team SMS + clinical-on-call SMS + emergency-contact SMS would collide on the channel-level UNIQUE) — restructured Sub-decision 5 to align with P-027 §4.66-4.67 canonical two-tier shape: §4.66 dispatch_ledger row per channel-class records the channel-level obligation; §4.67 provider_attempt row per (recipient_role, channel) tuple records per-recipient outcome; no schema amendment to P-027 required. R1 MED-1 Cat A vs Cat B mismatch on `crisis.no_acknowledgement_escalation` between Sub-decision 6 (claimed Cat A) and §3 AUDIT_EVENTS table (defined Cat B) — chose Cat A for safety-floor escalation fail-closed semantics; updated §1 in-scope tally from "4 Cat A + 1 Cat B + 2 Cat C" to "6 Cat A + 0 Cat B + 1 Cat C"; R2 Codex review queued)
**Authoring date:** 2026-05-21
**Trigger:** Master Completion Plan v1.0 pilot-viable scope item 4 (Crisis Response slice). Companion to AI Service Mode 1 Handler Spec v0.4 P-035 (FLOOR-020 crisis-detection emit path) and SI-013 P-025 (CCR crisis-helpline namespace).
**Owner:** Crisis Response slice owner + Platform AI Safety + Mode 1 AI Service owner + Notification slice owner + Adverse-Event slice owner + Audit owner.
**Companion documents:**
- I-019 Crisis detection cannot be configured away (Contracts Pack v5.3 INVARIANTS)
- P-025 SI-013 CCR crisis-helpline + AUDIT `crisis.escalation_destination_resolved` Cat B
- P-027 CDM v1.2 → v1.3 §4.66-4.68 notification_crisis_dispatch_ledger + provider_attempt + escalation_obligation entities
- P-035 AI Service Mode 1 Handler Spec v0.4 (FLOOR-020 always-on crisis-detection emit)
- P-031 SI-024.1 v0.8 (verify_session_jwt_and_extract_claims canonical trust anchor)
- P-027 I-019 + I-027 + I-032 v5.3 + I-035 platform-floor invariants

---

## 1. Purpose + scope

The Crisis Response slice defines the canonical platform-floor response surface for crisis events detected anywhere on the platform. Crisis-detection emission is already platform-floor (I-019; Mode 1 FLOOR-020; `crisis_detection_trigger` Cat A audit) — this SI specifies what happens AFTER detection:

1. **Patient-facing safety surface** — what the patient sees within ≤ 200ms of crisis detection (resources, helplines, emergency numbers, "you are not alone" copy).
2. **Resource lookup contract** — how CCR `crisis_helplines` array + `emergency_number` + 3 typed resolvers (per P-025) materialize on the patient surface; how unmapped-country fallback works.
3. **Escalation routing decision tree** — when does WHO get notified (care team, clinical-on-call, designated emergency contact, regulatory authority).
4. **Crisis lifecycle state machine** — the patient-bound crisis-event entity from detection → acknowledged → responded → resolved (Option A append-only-only per I-035; mirrors SI-019 + SI-020 patterns).
5. **Tenant/care-team notification fan-out** — wire-up between `crisis_detection_trigger` Cat A audit event + `notification_crisis_dispatch_ledger` (P-027 §4.66) channel-scoped obligation tracking.
6. **Operational obligations** — acknowledgement window, response-window SLOs, escalation-on-no-acknowledgement timer (uses P-027 §4.68 `notification_crisis_escalation_obligation` persisted deadline).
7. **Test scaffolding** — merge-blocking integration tests + static-analyzer rules preventing crisis-detection bypass.

**In scope:**
- 6 new CDM entities (1 crisis_event + 5 lifecycle/coordination entities)
- 8 new AUDIT_EVENTS action IDs (7 Cat A + 0 Cat B + 1 Cat C; R13 HIGH-1 closure 2026-05-21 added crisis.final_tier_reached Cat A; R1 MED-1 closure 2026-05-21 moved no_acknowledgement_escalation Cat B → Cat A) under `crisis.*` namespace EXTENDING the P-025 `crisis.escalation_destination_resolved` ratified Cat B scope
- 4 new DOMAIN_EVENTS event types (additive)
- 6 new OpenAPI endpoints under `/v1/crisis/*`
- 1 new state machine `crisis_event_lifecycle` (DERIVED from append-only per I-035)
- 7 new RBAC roles (3 application + 3 wrapper owners + 1 view owner)

**Out of scope:**
- AI Service Mode 1 crisis-detection logic (already ratified at P-035; this slice consumes the emission, does not redefine it)
- Crisis-detection model training, prompt-engineering, or thresholds (Platform AI Safety owns)
- CCR crisis_helpline namespace expansion beyond P-025 (only consumes the 3 typed resolvers)
- Regulatory reporting (Adverse-Event Reporting slice owns; this slice ONLY emits the trigger event when regulatory threshold met)
- Synchronous video escalation (Sync video consult slice; this slice references escalation_destination, does not implement the video bridge)
- INVARIANTS bump (no new platform-floor invariants from this slice; all closures align with I-019 + I-023 + I-027 + I-032 v5.3 + I-035)

---

## 2. Sub-decisions

### Sub-decision 1 — Patient-facing safety surface contract

**Decision:** Within ≤ 200ms of crisis detection emission (FLOOR-020 path or any other crisis-emitting surface), the patient-facing client renders the **canonical Crisis Response Card** containing:

| Slot | Content source | Fallback |
|---|---|---|
| Emergency number (large, dialable) | CCR resolver `resolveCrisisEmergencyNumber(country_of_care)` (P-025) | "Call your local emergency services" + `unmapped_country` audit |
| Crisis helpline (E.164 + display label) | CCR resolvers `resolveCrisisHelpline` + `resolveCrisisHelplineLabel(country_of_care)` (P-025) | null helpline; emergency_number remains visible |
| "You are not alone" supportive copy | localized message catalog (key `crisis.supportive_copy.v1`) | English fallback |
| Acknowledge-and-continue button | always present | n/a |
| Connect-to-clinician button (IF tenant has on-call) | derived from tenant config | hidden if no on-call |

The card MUST render BEFORE any other UI mutation (no race with chat-stream completion, no race with form-submit acknowledgement). On Mode 1 chat, the card displaces the assistant turn (the assistant turn is preserved in conversation history but the safety surface takes visual priority).

**Patient-surface-agreement contract (extends P-025 Rule 4):** the resolved card MAY render BEFORE the `crisis.escalation_destination_resolved` Cat B audit emits (Cat B fail-soft per P-025); the card MUST NOT block on Cat B success. The `crisis_detection_trigger` Cat A audit is on the synchronous emit path and uses standard Cat A fail-closed FLOOR-020 discipline.

### Sub-decision 2 — Resource lookup contract (CCR integration; DOWNSTREAM of FLOOR-020 emit)

**Decision:** All 3 P-025 typed resolvers are called in parallel during card resolution. The resolution outcome is recorded in a single `crisis.escalation_destination_resolved` Cat B audit row per P-025's 4-value `resolution_status` enum. Sub-decision 1's card consumes the resolution outcome:

| resolution_status | Card behavior |
|---|---|
| `'resolved'` | emergency_number + helpline + label all visible |
| `'partial_defaults'` | emergency_number visible (from country_profile default); helpline may be null |
| `'unmapped_country'` | "Call your local emergency services" fallback copy; helpline null |
| `'ccr_unavailable'` | fail-soft per P-025 Rule 4; cached-last-known values used if available; otherwise generic fallback |

**Critical FLOOR-020 invariant ordering (R1 HIGH-1 closure 2026-05-21):** CCR resource lookup MUST be **strictly downstream** of `crisis_detection_trigger` Cat A audit emission (the FLOOR-020 synchronous emit path) — NOT synchronous with it. This separation is required because:

1. **FLOOR-020 + I-019 platform-floor:** crisis detection emission must NEVER block on, latency-degrade with, or fail-with-cascade-from downstream response-surface work. CCR latency, DNS failures, or resolver retries must not delay or suppress the Cat A `crisis_detection_trigger` emit.
2. **Cat A vs Cat B fail-mode mismatch:** `crisis_detection_trigger` is Cat A (fail-closed; FLOOR-020 discipline); `crisis.escalation_destination_resolved` is Cat B (fail-soft per P-025 Rule 4). Co-placing on the same synchronous path would have forced Cat B to inherit Cat A's fail-closed semantics OR forced Cat A to inherit Cat B's fail-soft tolerance — neither is correct.
3. **Card render independence:** the Crisis Response Card MAY render with generic fallback copy (cached-last-known values OR "Call your local emergency services" + null helpline) BEFORE the CCR resolution completes, so the patient-facing safety surface is never blocked by resolver latency.

**Canonical emit ordering (R3 HIGH-1 + R4 HIGH-3 closure 2026-05-21: dispatch *recipient fan-out* moved out of the synchronous patient-surface path; BUT the escalation-deadline source-of-truth row stays in STEP 2 transaction so the no-acknowledgement timer is guaranteed-armed even if the STEP 4 worker stalls):**

```
STEP 1 + STEP 2 (ATOMIC — single database transaction; FLOOR-020 fail-closed; R6 HIGH-2 closure
2026-05-21: previously the spec said STEP 1 Cat A emit was a separate transactional commit from
STEP 2's row inserts, which would have allowed STEP 1 to commit durably while STEP 2 failed,
leaving audit-only crisis detections with no crisis_event row or escalation_obligation timer.
Fix: STEP 1 and STEP 2 sub-steps now run in a SINGLE atomic transaction; the Cat A audit row
INSERT is co-transactional with the 2a-2d application-table inserts. If any sub-step fails, the
transaction rolls back and NO Cat A audit row commits. This preserves FLOOR-020 fail-closed
discipline AND the no-partial-state guarantee. Implementer uses the canonical FLOOR-020
audit-co-transactional pattern (audit_events insert + application-table inserts in one BEGIN
... COMMIT; SAVEPOINT not used). On rollback: an ERROR is surfaced; no Cat A row is committed
(canonical I-019 platform-floor allows this because the crisis surface has not been delivered
to the patient yet; the patient sees an explicit error fallback per Sub-decision 1 generic
fallback copy):

STEP 1 (within atomic transaction; synchronous): crisis_detection_trigger Cat A audit INSERT
STEP 2 (within same atomic transaction; synchronous):
        2a. INSERT crisis_event row
        2b. INSERT initial 'detected' lifecycle transition
        2c. INSERT notification_crisis_escalation_obligation row with persisted undeliverable_deadline
            (severity-tiered: 30s / 60s / 5min). **This row is the source-of-truth for the no-ack
            timer (Sub-decision 6) and MUST be created in the STEP 2 transaction so the sweep has a
            row to find even if the STEP 4 worker stalls, crashes, or poison-rows.** Per R4 HIGH-3
            closure: a stuck outbox row before STEP 4c (recipient fan-out) cannot deny the
            no-acknowledgement timer; the escalation_obligation deadline exists in STEP 2 transaction
            unconditionally.
        2d. INSERT crisis_dispatch_outbox row (same-tx outbox enqueue for STEP 4 worker)
STEP 3 (synchronous; FLOOR-020 fail-closed; ≤ 200ms budget from STEP 1): render Crisis Response Card
        with cached/generic content. **STEP 2 sub-steps 2a-2d are bounded-cost row inserts only; the
        200ms SLO covers STEP 1+2+3 cumulatively.**
STEP 4 (asynchronous via bounded outbox worker; consumes the crisis_dispatch_outbox row from STEP 2d):
        recipient fan-out only — INSERT one notification_crisis_dispatch_ledger row per CONFIGURED
        channel-class in tenant `crisis.fanout_channels[]`; INSERT N provider_attempt rows per
        Sub-decision 3 logical routing tree. Worker emits crisis.dispatch_attempt_failed Cat C on
        each provider-level failure. **The escalation_obligation row is NO LONGER created at STEP 4
        — it is created at STEP 2c.** Worker uses idempotent retry against the same crisis_event_id
        + outbox row; partial fan-out is forbidden (per-batch single-transaction discipline). The
        no-acknowledgement sweep at Sub-decision 6 reads STEP 2c-created rows; STEP 4 stall does
        NOT silently skip escalation.
STEP 5 (asynchronous; Cat B fail-soft): call 3 CCR resolvers + emit crisis.escalation_destination_resolved
        Cat B (P-025); on resolution outcome, hydrate the already-rendered Crisis Response Card with
        resolved values via the patient client's normal reactive update path; otherwise the card stays
        at fallback content.
```

**Patient-surface SLO independence:** the 200ms card-render SLO in Sub-decision 1 applies to STEP 1+2+3 ONLY (Cat A emit + crisis_event/transition/escalation_obligation/outbox INSERT + card render). STEP 4 dispatch setup and STEP 5 CCR resolution are out-of-band from the patient-surface latency budget.

**STEP 2 per-operation latency contract (R5 MED-1 closure 2026-05-21):** the synchronous STEP 2 transaction has 4 row inserts. Per-operation budget at p99 + indexes/constraints + degraded behavior:

| Operation | p50 budget | p99 budget | Required indexes / constraints | Degraded behavior (timeout) |
|---|---|---|---|---|
| Cat A audit emit (STEP 1) | 5ms | 20ms | audit_events_partition write-path optimized via canonical FLOOR-020 pipeline | FAIL-CLOSED per FLOOR-020 (no card render; ERROR surfaced) |
| 2a crisis_event INSERT | 3ms | 15ms | PK (id); UNIQUE (tenant_id, server_signal_id) | STEP 2 transaction rollback; ERROR surfaced |
| 2b lifecycle_transition INSERT | 3ms | 15ms | PK (id); composite FK to crisis_event; trigger validates initial 'none → detected' triple | STEP 2 transaction rollback |
| 2c escalation_obligation INSERT | 3ms | 15ms | composite UNIQUE (tenant_id, patient_id, server_signal_id) per P-027 §4.68; composite FK (tenant_id, crisis_event_id) | STEP 2 transaction rollback |
| 2d crisis_dispatch_outbox INSERT | 3ms | 10ms | PK (id); index on (consumed_at, enqueued_at) for worker scheduling | STEP 2 transaction rollback |
| STEP 2 transaction total | 15ms | 60ms | — | Rollback releases all locks; outer STEP 1+2+3 budget remains under 200ms p99 |
| STEP 3 card render | 30ms | 100ms | client-side; payload already serialized in handler | Card renders with absolute generic fallback if any payload field is missing |
| **STEP 1+2+3 cumulative** | **50ms** | **180ms** | — | **STEP 2 rollback surfaces ERROR; card does NOT render against partial state** |

**Merge-blocking benchmark test (added to integration test scaffold at Sub-decision 7 test #16):** under simulated contention (1000 concurrent crisis_event INSERTs across 50 tenants), STEP 1+2+3 p99 latency MUST be ≤ 180ms. CI gates ship on benchmark green. Index plan + transaction isolation level documented in the P-040 follow-on amendment CDM cycle.

**STEP 2 fail-closed posture:** if ANY of STEP 1 / 2a / 2b / 2c / 2d fails (timeout or constraint violation), the entire STEP 2 transaction rolls back and an ERROR is surfaced to the originating handler. The Crisis Response Card does NOT render against partial state. FLOOR-020 fail-closed discipline preserves I-019 invariant — the patient sees a hard error (which routes to a generic "your message was received; please call emergency services if in crisis" sentinel) rather than a partially-armed crisis state.

**No platform admin can disable CCR lookup OR card rendering** (I-019 invariant). But resolver failure NEVER blocks Cat A detection emission, lifecycle row insertion, or card rendering. The 200ms render budget in Sub-decision 1 is for STEP 3 (cached/generic content), NOT STEP 5 (hydration of resolved values).

### Sub-decision 3 — Escalation routing decision tree

**Decision:** Crisis routing follows this fixed routing tree (NOT tenant-configurable per I-019). **The tree is LOGICAL routing — what recipients must receive dispatch under what conditions — NOT an alternate execution order.** The canonical execution order is Sub-decision 2's STEP 1-5 emit ordering (Cat A FLOOR-020 first; crisis_event + detected transition; fallback card render; dispatch obligation setup; CCR/Cat B async hydration last). Sub-decision 3 specifies which recipients land in the routing tree; Sub-decision 2 specifies WHEN each step executes relative to the Cat A FLOOR-020 emit.

**Recipient routing tree (logical):**

```
crisis_detection_trigger Cat A emitted (synchronous, FLOOR-020 fail-closed, Sub-decision 2 STEP 1)
    ↓
LOGICAL RECIPIENT 1 (always, executed at Sub-decision 2 STEP 3 — fallback card render):
   The patient receives the Crisis Response Card with cached/generic content
   (then hydrated reactively at STEP 5 after CCR resolution).
    ↓
LOGICAL RECIPIENTS 2-5 (eligibility-only; execution explicitly delegated to Sub-decision 2 STEP 4
   async bounded outbox worker — these recipients are NEVER on the synchronous STEP 1-3 patient-surface
   path; the routing tree only defines WHICH recipients are eligible, not WHEN they are dispatched):
2. ALL active care-team channels in tenant `crisis.fanout_channels[]` config
3. IF severity ∈ {imminent, life_threatening}: clinical-on-call recipient via tenant
   `crisis.clinical_on_call_channel` config; ALSO emit `emergency_escalation` Cat A at STEP 4
4. IF patient has designated emergency contact + consent grant scope ∈ {emergency_contact_share}:
   emergency contact recipient via `crisis.emergency_contact_channel` (R31 + R32 HIGH-2 closure
   2026-05-21: routing uses the tenant-configured channel-class — NOT hardcoded SMS; channel may
   be 'sms', 'email', or any configured channel-class; preflight Part C asserts emergency_contact_channel
   is present in fanout_channels[] IFF emergency_contact_consent_enabled=true so the matching
   dispatch_ledger row exists at STEP 4a)
5. IF severity ∈ {life_threatening} AND tenant has regulatory_reporting=true:
   emit `crisis.regulatory_threshold_reached` Cat A at STEP 4 (Adverse-Event slice picks up
   regulatory-authority downstream notification). **PLUS (R18 HIGH-1 closure 2026-05-21):** dispatch
   to the canonical `operator_escalation` recipient — tenant-configured per OQ4 via
   `tenant.crisis.operator_escalation_channel` (channel-class) + `tenant.crisis.operator_escalation_recipient`
   (recipient address). This is the platform-operator on-call recipient responsible for handling
   regulatory-threshold crises within the tenant; the regulatory tier is NOT a "ghost" tier — it
   IS a real dispatch_ledger/provider_attempt recipient via operator_escalation, with the
   Adverse-Event/regulatory-authority downstream notification handled separately via the Cat A
   audit. compute_crisis_recipient_mapping(..., target_tier='regulatory') therefore returns
   exactly the operator_escalation (channel, recipient_address) tuple (one provider_attempt row),
   NOT an empty set.
    ↓
LOGICAL ASYNC WORK ITEMS (delegated entirely to Sub-decision 2 STEP 4 + STEP 5; out-of-band from
   the patient-surface 200ms SLO; never blocks STEP 1-3):
- Dispatch obligation setup (notification_crisis_dispatch_ledger + provider_attempt fan-out for
  LOGICAL RECIPIENTS 2-5 above): executed at Sub-decision 2 STEP 4
- CCR resolvers + `crisis.escalation_destination_resolved` Cat B fail-soft per P-025: executed at
  Sub-decision 2 STEP 5
- Crisis Response Card hydration with resolved values (reactive client update): executed at
  Sub-decision 2 STEP 5; OR card stays at fallback content if CCR unavailable
```

**R4 HIGH-1 + HIGH-2 closure (2026-05-21):** prior text said "executed at Sub-decision 2 STEP 2c-2d ... synchronous with STEP 2" for logical recipients 2-5 (contradicting R3 HIGH-1 closure that moved dispatch to STEP 4 async); also said "CCR resolvers execute at Sub-decision 2 STEP 4 and hydration at STEP 5" (stale mapping pre-R3-renumbering: R3 made STEP 4 = dispatch setup, STEP 5 = CCR + hydration). Fix: removed all STEP 2c/2d references; CCR/hydration mapped to STEP 5 only; dispatch obligation setup explicitly at STEP 4 only; routing tree now reads as ELIGIBILITY only with execution explicitly delegated to Sub-decision 2.

**Execution-order assertion (R2 HIGH-1 closure 2026-05-21):** the routing tree above lists LOGICAL routing only. The canonical EXECUTION ORDER is exclusively Sub-decision 2's STEP 1-5 sequence. Specifically: CCR resolution + Cat B audit emission MUST be ASYNCHRONOUS and DOWNSTREAM of Cat A FLOOR-020 emit + crisis_event INSERT; never synchronous with them. An implementer treating the routing tree as an execution sequence (i.e., emitting Cat B BEFORE crisis_event INSERT) would reintroduce the R1 HIGH-1 FLOOR-020 coupling defect. Sub-decision 2 is authoritative on emit ordering; Sub-decision 3 is authoritative on logical routing destinations only.

**Routing decisions are NEVER tenant-overridable.** Tenants configure WHICH channels exist (sms provider, email provider) but NOT whether routing happens. Logical recipients 1 + 2 are I-019 platform-floor (always-on); 3, 4, 5 are conditional but conditional ONLY on severity/consent/regulatory_reporting facts, NOT on tenant administrator preference.

### Sub-decision 4 — Crisis event lifecycle (Option A append-only-only per I-035)

**Decision:** Same Option A append-only-only pattern as SI-019 (med-interaction signal lifecycle) and SI-020 (consult lifecycle):

**Entities (CDM v1.9 → v1.10 follow-on at P-040):**

1. `crisis_event` — durable record of a detected crisis event; immutable after INSERT
2. `crisis_event_lifecycle_transition` — append-only transition log; current state derived from latest row; CHECK constraint enumerates allowed transition triples
3. `crisis_acknowledgement_claim` — hybrid persistence (append-only identity + one-way mutable released_at) tracking which clinician/care-team-member is actively handling the crisis (mirrors SI-020 consult_review_claim pattern at P-037 R4)
4. `crisis_response_record` — append-only record of each response action taken (resource share, dispatch, escalation, dial-bridge)
5. `crisis_resolution` — terminal-state marker; INSERT triggers append-only transition to `resolved`; CHECK enforces only one resolution row per crisis_event
6. `crisis_outcome_summary_v` — caller-class-split derived view per P-038 R5 pattern (clinician-summary view for care team; patient-summary view restricted via verify_session_jwt_and_extract_claims to the patient's own crisis events)

**State machine `crisis_event_lifecycle` (DERIVED from append-only):**

```
none → detected
  detected → acknowledged   (clinician/care-team-member claims via crisis_acknowledgement_claim)
  detected → escalated      (no-acknowledgement timer fired; severity escalation)
  acknowledged → responded  (crisis_response_record INSERTed)
  responded → resolved      (crisis_resolution INSERTed)
  responded → escalated     (response_failed; clinician-initiated escalation)
  responded → escalated     (responded_no_resolution_timeout; R11 HIGH-1 closure 2026-05-21:
                             sweep-driven escalation when clinician records response but does
                             not resolve within INTERVAL_for_severity_resolution_window)
  acknowledged → escalated  (acknowledged_no_response_timeout; R11 HIGH-1 closure 2026-05-21:
                             sweep-driven escalation when clinician acknowledges but does not
                             record response within INTERVAL_for_severity_response_window;
                             ensures acknowledgement alone does not suppress escalation)
  escalated → acknowledged  (higher tier acknowledges)
  escalated → escalated     (tier_progression_no_acknowledgement; R8 HIGH-1 closure 2026-05-21:
                             multi-tier sweep advances; first care_team timeout uses
                             detected → escalated triple, subsequent tier advances use this
                             escalated → escalated triple)
  acknowledged → resolved   (acknowledged then directly resolved without separate response entity)
```

Transition triples enforced by CHECK on `crisis_event_lifecycle_transition` (NEW from_state, NEW to_state, NEW transition_reason). **11 allowed triples** (R11 HIGH-1 closure 2026-05-21: count + enumeration now matches §6 State Machines amendment table + Sub-decision 6 STEP 1 normative contract; added 2 sweep-driven triples for acknowledged → escalated + responded → escalated). Mirrors P-037 + P-038 patterns: per-event advisory lock + monotonic transition_at + state continuity validation in BEFORE INSERT trigger.

### Sub-decision 5 — Notification fan-out + dispatch obligation (R1 HIGH-2 closure 2026-05-21)

**Decision:** Crisis fan-out reuses the canonical P-027 §4.66-4.67 two-tier pattern unchanged:

- **§4.66 `notification_crisis_dispatch_ledger`** — channel-level OBLIGATION (one row per channel-class per crisis event). UNIQUE on `(tenant_id, patient_id, server_signal_id, channel)` per P-027 canonical schema. Records the obligation that "this crisis event MUST result in dispatch on this channel-class".
- **§4.67 `notification_crisis_provider_attempt`** — per-recipient ATTEMPT (one row per (recipient_role, recipient_address, channel) tuple). The child table is where multi-recipient fan-out is represented; multiple recipients on the same channel (e.g., care-team SMS + clinical-on-call SMS + emergency-contact SMS) are multiple provider_attempt rows under the same dispatch_ledger SMS row.

  **R27 HIGH-1 + R28 HIGH-1 + R36 HIGH-2 + R37 HIGH-1 closure 2026-05-21 (this SI extends P-027 §4.67 row shape):** the provider_attempt entity is amended at this SI's CDM follow-on amendment (P-040 target) to add:
   - `crisis_event_id UUID NOT NULL` — composite FK `(tenant_id, crisis_event_id) → crisis_event(tenant_id, id)` (ON DELETE NO ACTION; append-only platform-floor); enables the R27 idempotency key
   - `recipient_principal_id UUID NULL` (R36 HIGH-2 + R37 HIGH-1) — immutable JWT-subject identity captured at dispatch time. Non-null for care_team / clinical_on_call / operator_escalation roles (sourced from tenant_account_membership.principal_id / tenant.operator_escalation_principal_id / consent_grant.delegate_principal_id); nullable only for unauthenticated emergency_contact rows where principal identity is not knowable. Wrapper authorization in R36 looks up by recipient_principal_id (NOT raw recipient_address).
   - canonical UNIQUE constraint `notification_crisis_provider_attempt_idempotency_uk` ON `(tenant_id, crisis_event_id, channel, recipient_role, recipient_address, attempt_sequence)` — exact ON CONFLICT target name used by both STEP 4b initial fan-out + Sub-decision 6 STEP 3 sweep fan-out (recipient_principal_id NOT in idempotency key because the key is about per-attempt-sequence uniqueness, not per-principal; recipient_address remains in the key for emergency_contact paths where principal_id is null)
   - **Every provider_attempt INSERT in this SI's normative SQL MUST populate crisis_event_id non-null AND use `ON CONFLICT ON CONSTRAINT notification_crisis_provider_attempt_idempotency_uk DO NOTHING`.** R29 HIGH-2 + R30 HIGH-2 + R39 HIGH-1 + R40 HIGH-2 closure 2026-05-21 (UNIFIED CONTRACT): ON CONFLICT is for **worker-retry idempotency only** (same logical transaction emits the same tuple twice; second is no-op'd). **Sweep tier-advance + final-tier recheck inserts derive attempt_sequence = v_sweep_cycle_id from the escalation_obligation's sweep_cycle_counter (atomically incremented at the start of each sweep transaction via UPDATE-RETURNING per Sub-decision 6 STEP 2).** Initial detection STEP 4b uses sweep_cycle_counter=1 (DEFAULT). Each subsequent sweep increments + uses the returned value. Same-logical-sweep retries observe same value via transaction semantics — ON CONFLICT correctly no-ops; new sweeps get new value. **The deprecated MAX+1 contract is SUPERSEDED; do not implement against MAX+1 anywhere.** Escalation-time re-notification is guaranteed via the deterministic sweep_cycle_id increment, NOT via per-recipient MAX+1 lookup.

**R1 HIGH-2 closure:** prior draft proposed "one dispatch_ledger row per (recipient_role, channel) tuple" which would have required amending the P-027 §4.66 UNIQUE constraint to include `recipient_role` — that would have been a structural change to a ratified canonical schema (hard-floor item 6 territory). Closure: align with the existing two-tier shape per Codex's recommendation:

Wire-up via STEP 4 of Sub-decision 2 (asynchronous bounded outbox worker; downstream of synchronous Cat A emit + crisis_event INSERT + card render):

```sql
-- STEP 2 (synchronous, in same transaction as Cat A audit; ALL of 2a-2d atomic):
-- 2a. crisis_event INSERT (shown elsewhere)
-- 2b. crisis_event_lifecycle_transition INSERT (shown elsewhere)
-- 2c. escalation_obligation INSERT — guaranteed source-of-truth for no-ack timer (R4 HIGH-3 +
--     R5 HIGH-1 schema closure). This SI extends the P-027 §4.68 escalation_obligation row
--     shape with explicit columns the Sub-decision 6 sweep needs to drive lifecycle transitions
--     + next-tier fan-out without relying on server_signal_id joins or derived state:
INSERT INTO notification_crisis_escalation_obligation
    (tenant_id, patient_id, server_signal_id,
     crisis_event_id,                -- NEW: direct FK to crisis_event(id); sweep uses this for lifecycle
                                     --      transition INSERT without needing to JOIN through server_signal_id
     severity,                       -- NEW: enum {non_imminent, imminent, life_threatening}; determines
                                     --      severity-tiered fan-out at next tier
     escalation_tier,                -- NEW: enum {care_team, clinical_on_call, regulatory}; current tier
                                     --      to which fan-out has been applied; sweep advances to next tier
     escalation_key, undeliverable_deadline)
VALUES (v_tenant_id, v_patient_id, v_server_signal_id,
        v_crisis_event_id,
        v_severity,
        'care_team',                 -- initial tier; STEP 4 fan-out targets care_team channels first
        NULL,                        -- escalation_key NULL until sweep advances tier
        now() + INTERVAL_for_severity(v_severity));
-- UNIQUE (tenant_id, patient_id, server_signal_id) per P-027 §4.68 unchanged (one obligation row
-- per crisis_event); composite FK (tenant_id, crisis_event_id) → crisis_event(tenant_id, id)
-- enforces tenant-scoped referential integrity; ON DELETE NO ACTION (append-only platform-floor).
-- Sub-decision 6 sweep contract is the AUTHORITATIVE source-of-truth (R5/R6/R11/R12/R13/R15/R16
-- closures applied there); this Sub-decision 5 SQL comment block previously embedded a stale
-- pre-R13 inline sweep summary that contradicted the final-tier-exhausted-vs-resolved-terminal
-- model. R17 HIGH-1 closure 2026-05-21: this Sub-decision 5 comment block is now SHORTENED to a
-- single cross-reference to Sub-decision 6 to prevent further drift. Do NOT re-embed sweep SQL
-- here; Sub-decision 6 is the SINGLE normative SQL contract for the no-ack sweep.
-- See Sub-decision 6 for: (i) sweep SELECT predicate with LATERAL JOIN to crisis_event_lifecycle_transition
--   filtering current_state IN ('detected','escalated','acknowledged','responded') (R10/R11/R12 closures);
-- (ii) atomic 5-step per-row closure with STEP 1 four-way reason-mapping CASE (R12 closure),
--   STEP 3 explicit target_tier = COALESCE(next_tier(escalation_tier, severity), escalation_tier)
--   (R16 closure) so final-tier rechecks produce non-empty recipient fan-out, and STEP 5 final-tier
--   preservation (escalation_tier NOT set to NULL on next_tier=NULL; final_tier_exhausted_at set
--   once; crisis.final_tier_reached Cat A emitted once; INTERVAL_final_tier_recheck_window
--   scheduled for continuing rechecks) per R13/R14/R15;
-- (iii) ONLY record_crisis_resolution() sets escalation_tier=NULL (the sole terminalization path);
-- (iv) BEFORE UPDATE trigger constraints allowing only sweep-cycle tier advances/preservation,
--   wrapper-driven deadline resets, and resolve-driven terminalization.
-- 2d. crisis_dispatch_outbox row INSERT — same-tx outbox enqueue for STEP 4 fan-out worker:
INSERT INTO crisis_dispatch_outbox (tenant_id, crisis_event_id, enqueued_at)
VALUES (current_tenant_id_strict('crisis_dispatch_outbox'), v_crisis_event_id, now());

-- STEP 4 (asynchronous; bounded outbox worker; data-driven from tenant config; recipient fan-out only):
-- The worker reads tenant.crisis.fanout_channels[] (CCR key per OQ4) which enumerates the
-- channel-classes the tenant has provider configuration for (e.g., ['sms', 'in_app_push'] for
-- a tenant without an email provider). I-019 platform-floor requires fanout_channels[] to be
-- non-empty; deployment preflight asserts this; worker FAILS CLOSED if empty.

-- STEP 4a: INSERT one dispatch_ledger row PER CONFIGURED channel-class
-- (UNIQUE(tenant_id, patient_id, server_signal_id, channel) per P-027 §4.66 unchanged)
INSERT INTO notification_crisis_dispatch_ledger (tenant_id, patient_id, server_signal_id, channel, ...)
SELECT v_tenant_id, v_patient_id, v_server_signal_id, channel
FROM unnest(t.fanout_channels) AS channel
WHERE t.fanout_channels IS NOT NULL AND cardinality(t.fanout_channels) > 0;

-- STEP 4b: INSERT one provider_attempt row PER (recipient_role, channel) tuple where
-- recipient_role applies per Sub-decision 3 logical routing tree AND the channel is configured
-- AND the recipient_role has a resolvable recipient address for that channel
-- (e.g., emergency_contact only gets provider_attempt rows on tenant.crisis.emergency_contact_channel; clinical_on_call only
-- on the tenant.crisis.clinical_on_call_channel value per OQ4)
INSERT INTO notification_crisis_provider_attempt
    (tenant_id, patient_id, server_signal_id, crisis_event_id, channel, recipient_role, recipient_address, recipient_principal_id, attempt_sequence)
SELECT v_tenant_id, v_patient_id, v_server_signal_id, v_crisis_event_id, mapping.channel, mapping.recipient_role,
       mapping.recipient_address, mapping.recipient_principal_id, 1
FROM compute_crisis_initial_recipient_mapping(v_crisis_event_id, v_severity, v_regulatory_reporting) AS mapping
ON CONFLICT ON CONSTRAINT notification_crisis_provider_attempt_idempotency_uk DO NOTHING;
-- R37 HIGH-1 closure 2026-05-21: every provider_attempt INSERT — initial STEP 4b + sweep tier-advance
-- + final-tier recheck — populates recipient_principal_id (UUID, NULL only for unauthenticated emergency
-- contact rows where principal_id is not knowable; preflight Part C / runtime validation enforces non-NULL
-- for care_team / clinical_on_call / operator_escalation recipient_roles). Both compute_crisis_initial_recipient_mapping
-- AND compute_crisis_recipient_mapping(..., target_tier) RETURN recipient_principal_id alongside channel/
-- recipient_role/recipient_address tuples. Wrapper authorization in R36 closure is now physically backed
-- by inserts that actually populate the column.
-- R28 HIGH-1 + R29 HIGH-1 + R30 CRITICAL-1 closure 2026-05-21: crisis_event_id non-null + correct
-- SQL ordering (INSERT ... SELECT ... FROM ... ON CONFLICT ... DO NOTHING is a SINGLE statement
-- ending at the ';' on line above; the previously-trailing duplicate FROM clause has been removed).
-- Initial dispatch attempt_sequence=1 (from escalation_obligation.sweep_cycle_counter DEFAULT=1).
-- The ON CONFLICT clause only fires on worker-retry idempotency for the SAME initial-dispatch
-- transaction. Sweep tier-advance uses INCREMENTED attempt_sequence via the deterministic
-- sweep_cycle_counter UPDATE-RETURNING in Sub-decision 6 STEP 2 (R39/R40/R41 closure unified
-- contract — MAX+1 model is FULLY SUPERSEDED; do not implement against it anywhere) so
-- escalation-time recipients are ALWAYS re-notified at the new sweep_cycle_id.
--
-- R25 HIGH-1 + R26 HIGH-1 closure 2026-05-21: STEP 4b uses a DISTINCT initial-dispatch function
-- compute_crisis_initial_recipient_mapping(crisis_event_id, severity, regulatory_reporting) which
-- returns ALL Sub-decision 3 logical recipients eligible AT DETECTION TIME per severity/consent/
-- regulatory_reporting (NOT just care_team). This preserves the Sub-decision 3 routing tree
-- semantics: imminent/life-threatening crises notify clinical_on_call IMMEDIATELY at detection;
-- life-threatening + consent_grant emergency_contact_share IMMEDIATELY at detection;
-- life-threatening + regulatory_reporting=true notifies operator_escalation IMMEDIATELY at
-- detection (in addition to emitting crisis.regulatory_threshold_reached Cat A).
--
-- The OTHER function compute_crisis_recipient_mapping(crisis_event_id, severity, target_tier) is
-- ONLY called by Sub-decision 6 sweep STEP 3 to derive recipients for a NEW target_tier when the
-- escalation_tier advances (or stays at current final tier on recheck). It returns ONLY the
-- recipients to ADD for the specified target_tier, NOT the full initial-dispatch set.
--
-- Two-function separation discipline (R26 HIGH-1):
--   compute_crisis_initial_recipient_mapping → STEP 4b (initial dispatch; all eligible recipients)
--   compute_crisis_recipient_mapping(..., target_tier) → Sub-decision 6 STEP 3 sweep (tier-advance
--     additions; called per sweep cycle)
-- compute_crisis_recipient_mapping is a STABLE function that joins (R24 HIGH-1 + R33 HIGH-1
-- closure 2026-05-21 — added emergency_contact_channel to the source list for tenant-configurable
-- emergency-contact fan-out at sweep time):
--   tenant.crisis.fanout_channels[] (configured channel-classes)
--   tenant.crisis.clinical_on_call_channel (which channel for on-call escalation)
--   tenant.crisis.operator_escalation_channel (R24 HIGH-1: required for target_tier='regulatory' fan-out;
--     channel-class for platform-operator on-call; preflight enforces non-null + in fanout_channels[] per
--     R19/R22/R23 Part B contract on regulatory_reporting=true tenants)
--   tenant.crisis.operator_escalation_recipient (R24 HIGH-1: recipient address for platform-operator
--     on-call; required non-null on regulatory_reporting=true tenants)
--   tenant.crisis.emergency_contact_channel (R33 HIGH-1 closure 2026-05-21: channel-class for emergency-contact
--     dispatch in clinical_on_call target_tier branch when patient consent_grant scope='emergency_contact_share' exists;
--     preflight Part C enforces non-null + in fanout_channels[] IFF emergency_contact_consent_enabled=true)
--   care_team_member (rows for the patient's care team)
--   consent_grant (emergency_contact_share scope, if granted; emergency contact address resolved
--     from the consent_grant row's emergency_contact_address column or analogous Consent-slice column)
--   v_severity (filters imminent/life-threatening recipients per Sub-decision 3 logical tree)
-- and returns exactly the (channel, recipient_role, recipient_address, recipient_principal_id) tuples
-- to insert as provider_attempt rows for THIS crisis_event (R37 HIGH-1 closure 2026-05-21: function
-- output extended with recipient_principal_id derived from tenant_account_membership.principal_id /
-- consent_grant.delegate_principal_id / tenant.operator_escalation_principal_id; required non-null
-- for care_team, clinical_on_call, operator_escalation; nullable for unauthenticated emergency_contact
-- where principal identity is not knowable). Branches on target_tier:
--   target_tier = 'care_team' → returns care-team-member tuples on configured channels (each with
--                                principal_id from tenant_account_membership)
--   target_tier = 'clinical_on_call' → returns 1 tuple (clinical_on_call_channel, 'clinical_on_call',
--                                       clinical_on_call_address) + emergency_contact tuple
--                                       (emergency_contact_channel, 'emergency_contact', emergency_contact_address)
--                                       IFF active consent_grant scope='emergency_contact_share' exists
--                                       (R33 HIGH-1 closure 2026-05-21: emergency_contact_channel is the
--                                       tenant-configured key, NOT hardcoded SMS; Part C preflight guarantees
--                                       it's non-null + in fanout_channels[] when emergency_contact_consent_enabled=true)
--   target_tier = 'regulatory' → returns exactly 1 tuple
--                                       (operator_escalation_channel, 'operator_escalation',
--                                        operator_escalation_recipient)
-- Function is data-driven; literal channel enumerations NEVER appear in DDL or STEP 4 logic.
-- Channels the tenant has not configured produce zero rows for that channel-class. For regulatory
-- target_tier, the preflight (Part B contract) guarantees the operator_escalation tuple is non-null
-- AND its channel is in fanout_channels[] (so the corresponding dispatch_ledger row exists from STEP 4a).

-- (STEP 4c: NOT applicable post-R4 HIGH-3 closure 2026-05-21. The escalation_obligation INSERT
--  moved into STEP 2c per Sub-decision 2 ordering — the deadline source-of-truth row is created
--  in the STEP 2 synchronous transaction so the no-acknowledgement sweep (Sub-decision 6) ALWAYS
--  has a row to find even if the STEP 4 worker stalls or crashes before recipient fan-out
--  completes. R4 HIGH-3 safety-floor gap closed: a stuck outbox row can no longer deny the
--  acknowledgement timer.)

-- STEP 4 fail-closed posture: STEP 4a-b run in a single transaction. If either fails the
-- transaction rolls back; worker emits `crisis.dispatch_attempt_failed` Cat C per failure and
-- retries with exponential backoff under canonical outbox-worker semantics. The outbox row is
-- NOT marked "consumed" until STEP 4a-b succeed atomically; partial application is forbidden.
-- Even under indefinite worker stall, the escalation_obligation row from STEP 2c remains
-- in place + the Sub-decision 6 sweep operates on it; the no-acknowledgement Cat A
-- escalation will fire on schedule regardless of recipient-fan-out progress.
```

**R3 MED-1 closure (data-driven channel enumeration):** prior SQL literal `VALUES (..., 'sms'), (..., 'email'), (..., 'in_app_push')` would have inserted unconditional rows for channels the tenant has not configured, causing false undeliverable_deadline misses, noisy provider-failure attempts, and bogus `crisis.dispatch_attempt_failed` Cat C audit volume. Fixed: STEP 4a INSERTs are SELECT-driven from tenant `crisis.fanout_channels[]` CCR key (per OQ4) via `unnest()`. STEP 4b INSERTs are SELECT-driven from the `compute_crisis_recipient_mapping()` STABLE function which joins tenant config + care_team + consent_grant + severity to derive the exact recipient set. Channels the tenant has not provisioned produce zero rows for that channel-class. Deployment preflight asserts `cardinality(tenant.crisis.fanout_channels[]) > 0` (I-019 platform-floor); worker FAILS CLOSED if the array is empty at runtime.

**Channel-vs-recipient identity model:** dispatch_ledger tracks channel-level OBLIGATION (must dispatch on SMS at all); provider_attempt tracks per-recipient OUTCOME (each individual SMS recipient + their delivery status). This matches the P-027 R2 HIGH closure interpretation. Multiple SMS recipients = N provider_attempt rows under the single SMS dispatch_ledger row.

**Severity-tier deadlines:** 5-minute undeliverable_deadline is the canonical acknowledgement window for non-imminent severity. Imminent severity collapses to 60 seconds. Life-threatening collapses to 30 seconds.

### Sub-decision 6 — No-acknowledgement escalation timer (R7 HIGH-1 + R10 HIGH-1 closure 2026-05-21: tier-cycle resettable model + lifecycle-state eligibility filter + acknowledge/resolve terminalization)

**Decision:** A scheduled job (sweep every 30 seconds) reads `notification_crisis_escalation_obligation` rows where:

```sql
SELECT obligation.tenant_id, obligation.patient_id, obligation.server_signal_id,
       obligation.crisis_event_id, obligation.severity, obligation.escalation_tier
FROM notification_crisis_escalation_obligation AS obligation
JOIN LATERAL (
    -- R10 HIGH-1 + R11 HIGH-1 + R12 HIGH-1 closure: current lifecycle state lookup; sweep
    -- eligible for ALL non-resolved states. Matches the 4 from_state values that have valid
    -- 'escalated' to_state triples per §6 state-machine 11-triple enumeration:
    --   detected → escalated (no_acknowledgement_timeout)
    --   escalated → escalated (tier_progression_no_acknowledgement)
    --   acknowledged → escalated (acknowledged_no_response_timeout)
    --   responded → escalated (responded_no_resolution_timeout)
    SELECT to_state AS current_state
    FROM crisis_event_lifecycle_transition lt
    WHERE lt.tenant_id = obligation.tenant_id
      AND lt.crisis_event_id = obligation.crisis_event_id
    ORDER BY lt.transition_at DESC, lt.id DESC
    LIMIT 1
) AS lifecycle ON TRUE
WHERE now() > obligation.undeliverable_deadline
  AND obligation.escalation_key IS NULL       -- per-tier-cycle CLAIM lock (NULL = currently pending)
  AND obligation.escalation_tier IS NOT NULL  -- terminal-tier exclusion (NULL = no further escalation)
  AND lifecycle.current_state IN ('detected', 'escalated', 'acknowledged', 'responded')
  -- R11 HIGH-1 + R12 HIGH-1: eligibility expanded to ALL non-resolved states; 'resolved' is the
  -- only terminal-exclusion state. Excludes resolved events (terminalized via record_crisis_resolution
  -- wrapper which sets escalation_tier=NULL) AND defends against missed terminalizations.
FOR UPDATE SKIP LOCKED;
```

**R10 HIGH-1 + R11 HIGH-1 terminalization + post-acknowledgement timer contract (REVISED — only resolve terminalizes; acknowledge/respond reset the deadline):**

The three lifecycle wrappers update the obligation row differently per safety-criticality of the resulting lifecycle state:

| Wrapper | Effect on escalation_obligation row | Rationale |
|---|---|---|
| `record_crisis_acknowledgement_claim()` (R35 HIGH-1 + R36 HIGH-1/HIGH-2 closure 2026-05-21) | UPDATE obligation SET undeliverable_deadline = now() + INTERVAL_for_severity_response_window(severity); escalation_tier = GREATEST(escalation_tier, v_derived_tier); escalation_key = NULL. Wrapper authorization (SECURITY DEFINER tier-ownership): (a) v_jwt_principal_id := verify_session_jwt_and_extract_claims().principal_id; (b) lookup an eligible provider_attempt row with `tenant_id = current_tenant_id AND crisis_event_id = $1 AND recipient_principal_id = v_jwt_principal_id` (R36 HIGH-2: provider_attempt extended at the P-040 CDM follow-on with a `recipient_principal_id UUID NULL` column populated at STEP 4 dispatch time from the recipient's tenant_account_membership / consent_grant.delegate_id / tenant.operator_escalation_principal_id — an immutable JWT-subject-bound identity, NOT raw address equality); (c) the matched row's recipient_role MUST map to a tier ≥ current escalation_tier (R36 HIGH-1: tier-derivation requires the principal to OWN the current responsible tier or a tier above it; lower-tier principals attempting to acknowledge after the obligation has advanced higher RAISE `tier_ownership_below_current_tier`); (d) v_derived_tier comes from the matched row's recipient_role; (e) if no eligible row, RAISE `tier_ownership_unauthorized`. The recipient_address equality fallback from v0.36 is REMOVED to close the address-alias/reassignment/shared-mailbox loophole. | Acknowledgement is NOT safety-terminal. SECURITY DEFINER wrapper authoritatively derives tier from JWT-principal-bound provider_attempt row; current-tier-or-above ownership required. |
| `record_crisis_response()` (R35 HIGH-1 + R36 HIGH-1/HIGH-2 closure) | Same SECURITY DEFINER tier-ownership discipline as `record_crisis_acknowledgement_claim()`: JWT principal_id → matched provider_attempt row by recipient_principal_id → recipient_role must map to tier ≥ current escalation_tier → v_derived_tier from row; RAISE tier_ownership_unauthorized / tier_ownership_below_current_tier as applicable; UPDATE obligation SET undeliverable_deadline = now() + INTERVAL_for_severity_resolution_window(severity), escalation_tier = GREATEST(escalation_tier, v_derived_tier), escalation_key = NULL | Response is NOT safety-terminal. Same authorization model as acknowledgement wrapper. |
| `record_crisis_resolution()` | UPDATE obligation SET escalation_tier = NULL (TERMINAL) | Resolution IS safety-terminal — crisis closed. Sweep predicate `escalation_tier IS NOT NULL` permanently excludes the row. |

**`INTERVAL_for_severity_response_window` canonical (R11 HIGH-1):** non-imminent 5min / imminent 2min / life-threatening 30s. **`INTERVAL_for_severity_resolution_window` canonical:** non-imminent 30min / imminent 10min / life-threatening 5min.

**BEFORE UPDATE trigger on escalation_obligation allows ONLY:** (a) sweep-cycle tier advances (escalation_tier advance via next_tier()) + escalation_key reset; (b) wrapper-driven deadline reset + escalation_key reset (acknowledge / respond); (c) terminalization (escalation_tier any non-NULL → NULL) via resolve wrapper. Any other UPDATE is rejected.

**R11 HIGH-1 sweep contract update — lifecycle eligibility expanded to all non-resolved states:**

The sweep LATERAL JOIN predicate now reads `current_state IN ('detected', 'escalated', 'acknowledged', 'responded')` — i.e., everything except `resolved`. The STEP 1 transition reason switches by current_state:

- `detected` → `escalated` with reason `no_acknowledgement_timeout` (first care-team timeout)
- `escalated` → `escalated` with reason `tier_progression_no_acknowledgement` (subsequent tier advance per R8 closure)
- `acknowledged` → `escalated` with reason `acknowledged_no_response_timeout` (R11 HIGH-1 NEW triple; clinician acknowledged but did not respond within response window)
- `responded` → `escalated` with reason `responded_no_resolution_timeout` (R11 HIGH-1 NEW triple; clinician responded but crisis not resolved within resolution window; distinct from existing `responded → escalated / response_failed` which is clinician-initiated)

State-machine triple count: 9 (post-R8) → **11** (post-R11). The 2 new triples are added to §6 State Machines amendment table + Sub-decision 4 lifecycle diagram.

**Defense-in-depth: even if a wrapper procedure FAILS to update the deadline (partial transaction rollback before the obligation UPDATE), the sweep's LATERAL JOIN filter `current_state IN (...non-resolved...)` still excludes `resolved` events; the sweep transitions to `escalated` from any of the 4 non-resolved states; the new deadline-reset semantics mean clinicians cannot suppress escalation by acknowledging alone.

For each eligible row, the job runs the following atomic per-row transaction:

1. **Lifecycle transition INSERT:** crisis_event_lifecycle_transition. The from_state is the current to_state derived from the latest crisis_event_lifecycle_transition row. The to_state is `escalated`. **The transition reason is a four-way mapping by from_state (R8 HIGH-1 + R11 HIGH-1 + R12 HIGH-2 closure 2026-05-21; matches the 4 valid escalated-to triples in the 11-triple §6 enumeration):**

    | from_state | transition_reason | Source-of-truth scenario |
    |---|---|---|
    | `detected` | `no_acknowledgement_timeout` | first care-team timeout (initial deadline expiry) |
    | `escalated` | `tier_progression_no_acknowledgement` | subsequent tier advances (multi-tier sweep cycle) |
    | `acknowledged` | `acknowledged_no_response_timeout` | clinician acknowledged but did not record response within INTERVAL_for_severity_response_window |
    | `responded` | `responded_no_resolution_timeout` | clinician recorded response but did not record resolution within INTERVAL_for_severity_resolution_window; distinct from existing `responded → escalated / response_failed` which is clinician-initiated |

    The CHECK constraint on `crisis_event_lifecycle_transition` accepts all 4 (from_state, to_state='escalated', transition_reason) triples; any other reason for a given from_state is rejected. Implementer pseudocode:

    ```sql
    v_reason := CASE current_state
        WHEN 'detected' THEN 'no_acknowledgement_timeout'
        WHEN 'escalated' THEN 'tier_progression_no_acknowledgement'
        WHEN 'acknowledged' THEN 'acknowledged_no_response_timeout'
        WHEN 'responded' THEN 'responded_no_resolution_timeout'
    END;
    INSERT INTO crisis_event_lifecycle_transition (..., from_state, to_state, transition_reason)
    VALUES (..., current_state, 'escalated', v_reason);
    ```
2. **Tier CLAIM (acquire the per-tier-cycle lock):** UPDATE escalation_obligation SET escalation_key = gen_random_uuid(). BEFORE UPDATE trigger forbids non-NULL → non-NULL escalation_key transitions within the same tier (idempotency under retry within the in-flight cycle); only NULL → uuid permitted at this step.
3. **Recipient fan-out (with R27 HIGH-1 + R29 HIGH-2 + R38 HIGH-1 + R39 HIGH-1 closure 2026-05-21 deterministic-sweep-cycle-id idempotency + principal-id contract):** call `compute_crisis_recipient_mapping(crisis_event_id, severity, target_tier)`; the normative sweep INSERT uses a DETERMINISTIC per-sweep attempt_sequence captured BEFORE recipient fan-out (R39 HIGH-1: replaces non-deterministic MAX+1 recomputation):

```sql
-- R39 HIGH-1 + R40 HIGH-1 + R40 HIGH-2 closure 2026-05-21 (unified attempt_sequence contract):
-- notification_crisis_escalation_obligation has `sweep_cycle_counter INT NOT NULL DEFAULT 1`
-- (R40 HIGH-1: DEFAULT changed from 0 to 1 — initial detection STEP 2c INSERT establishes the
-- row with sweep_cycle_counter=1; STEP 4b initial dispatch uses attempt_sequence=1 from this).
-- Subsequent sweep transactions STEP 2 atomically increment + RETURNING:
UPDATE notification_crisis_escalation_obligation
SET sweep_cycle_counter = sweep_cycle_counter + 1
WHERE tenant_id = v_tenant_id AND crisis_event_id = v_crisis_event_id
RETURNING sweep_cycle_counter INTO v_sweep_cycle_id;
-- v_sweep_cycle_id is deterministic per-sweep-transaction. Initial dispatch = 1. First sweep = 2.
-- Each subsequent sweep = N+1. Same-logical-sweep retries observe same value (transaction semantics).
-- **R40 HIGH-2 closure: all `attempt_sequence = MAX(prior) + 1` prose elsewhere in the spec is
-- SUPERSEDED by this sweep_cycle_id-based contract.** Test 16k also asserts sweep_cycle_id-based
-- sequence values per the R40 closure (not MAX+1).

-- STEP 3 fan-out INSERT uses v_sweep_cycle_id directly as attempt_sequence (NOT MAX+1):
INSERT INTO notification_crisis_provider_attempt
    (tenant_id, patient_id, server_signal_id, crisis_event_id, channel, recipient_role,
     recipient_address, recipient_principal_id, attempt_sequence, sweep_cycle_id)
SELECT v_tenant_id, v_patient_id, v_server_signal_id, v_crisis_event_id, mapping.channel,
       mapping.recipient_role, mapping.recipient_address, mapping.recipient_principal_id,
       v_sweep_cycle_id, v_sweep_cycle_id
FROM compute_crisis_recipient_mapping(v_crisis_event_id, v_severity, v_target_tier) AS mapping
ON CONFLICT ON CONSTRAINT notification_crisis_provider_attempt_idempotency_uk DO NOTHING;
-- ON CONFLICT now correctly identifies same-logical-sweep retries (same sweep_cycle_id) as
-- duplicates and no-ops them; new sweeps with new sweep_cycle_id always create new rows.
-- attempt_sequence == sweep_cycle_id provides per-sweep deterministic ordering AND
-- escalation-time re-notification guarantee (each new sweep advances both).
--
-- STEP 5 final verification (R39 HIGH-1): before committing the tier-advance UPDATE,
-- verify that the expected principal-addressable recipient rows were INSERTed (i.e.,
-- @@ROW_COUNT or equivalent matches the FULL count of mapping rows returned by
-- compute_crisis_recipient_mapping — including emergency_contact rows where
-- recipient_principal_id IS NULL (R40 MED-1 closure 2026-05-21: previously only counted
-- principal-id-non-null rows, which allowed tier advancement when an emergency_contact
-- row failed to INSERT). The ROW_COUNT must equal cardinality of the mapping output
-- (all recipient_role variants). If zero rows INSERTed because all already existed at the
-- same sweep_cycle_id, the sweep is a worker retry — safe to no-op the tier UPDATE
-- (already committed in the prior attempt). If fewer rows than expected INSERTed,
-- ROLLBACK + emit crisis.dispatch_attempt_failed Cat C + retry under exponential backoff.
-- Additional CHECK: principal-addressable rows (recipient_role ∈ care_team/clinical_on_call/
-- operator_escalation) MUST have recipient_principal_id IS NOT NULL; emergency_contact MAY
-- have NULL. Both row-count and principal-id constraints must hold before tier-advance commit.
-- CHECK constraint on notification_crisis_provider_attempt asserts recipient_principal_id
-- IS NOT NULL when recipient_role ∈ {'care_team', 'clinical_on_call', 'operator_escalation'}.
```

This INSERT is the SOLE normative sweep fan-out spec. The deterministic v_sweep_cycle_id replaces non-deterministic MAX+1 recomputation. Retry safety is provided by the atomic-transaction model in the next paragraph (R41 MED-1 + R42 HIGH-2 closure: there is NO half-committed sweep state — STEP 2-5 commit-or-rollback together; the prior "half-committed sweep retry sees same sweep_cycle_id" wording is REMOVED as architecturally inconsistent with UPDATE-RETURNING semantics). The idempotency key UNIQUE on (tenant_id, crisis_event_id, channel, recipient_role, recipient_address, attempt_sequence) is preserved; attempt_sequence is now equal to sweep_cycle_id for sweep-driven INSERTs (initial STEP 4b INSERTs use attempt_sequence=1 + sweep_cycle_id=1 from the DEFAULT=1 value of the obligation row).

**R29 HIGH-2 + R41 HIGH-1 closure: attempt_sequence INCREMENTS on EVERY tier transition + every final-tier recheck via the sweep_cycle_counter atomic increment from STEP 2 (NOT MAX+1).** This guarantees escalation-time re-notification of recipients already dispatched at initial detection — initial dispatch attempt_sequence=1 (from sweep_cycle_counter=1 DEFAULT); first sweep tier-advance attempt_sequence=2 (sweep_cycle_counter incremented to 2 in STEP 2 of sweep transaction); second sweep=3; subsequent sweeps/rechecks=N. ALL provider_attempt rows from a single sweep transaction share the same v_sweep_cycle_id regardless of whether the recipient was previously notified or net-new at that tier; net-new recipients are NOT given attempt_sequence=1 — they use the same v_sweep_cycle_id as the rest of the sweep (R41 HIGH-1 closure: the per-recipient MAX+1 contract is FULLY REMOVED). The ON CONFLICT clause fires only on worker-retry idempotency for the SAME (recipient, attempt_sequence=v_sweep_cycle_id) tuple within a single sweep transaction.

**R41 MED-1 + R42 HIGH-2 transaction-model clarification (SOLE normative recovery contract):** the sweep STEP 2 sweep_cycle_counter increment + STEP 3 INSERT + STEP 4 Cat A audit + STEP 5 tier-advance UPDATE are ALL in a single atomic transaction. On pre-commit failure, the entire transaction rolls back (including the increment) — no provider_attempt rows are visible to a retry. A retry then re-increments and creates a NEW v_sweep_cycle_id (no overlap with the rolled-back attempt). On post-commit ambiguity (e.g., transient connection loss between COMMIT and worker ACK), the outbox-worker dead-letter SLO + outbox-row idempotency handle re-execution; no half-committed sweep state ever exists in the normative model. **No retry of an already-committed sweep can produce the same sweep_cycle_id** — committed sweeps are terminal; subsequent sweeps allocate the next value via the next atomic increment. **No retry of an in-flight sweep can leave dangling rows** — the rollback discards everything atomically.

**`target_tier` is explicitly defined to handle both pre-exhaustion and final-tier exhaustion/recheck paths (R16 HIGH-1 closure 2026-05-21):**

    ```sql
    v_target_tier := COALESCE(next_tier(escalation_tier, severity, v_regulatory_reporting), escalation_tier);
    -- (a) pre-exhaustion sweeps: next_tier is non-NULL → target the next tier (advance)
    -- (b) final-tier exhaustion sweep AND subsequent recheck sweeps: next_tier is NULL →
    --     target the CURRENT final tier (continuing pressure on the terminal responsible tier)
    -- The function NEVER receives NULL; final-tier rechecks continue to fan out to the
    -- terminal-tier recipients on the recheck cadence until record_crisis_resolution() runs.
    -- v_regulatory_reporting (R20 HIGH-1 closure 2026-05-21) is read from tenant_config and
    -- controls whether clinical_on_call advances to regulatory for life-threatening severity:
    -- - regulatory_reporting=true + severity='life_threatening': clinical_on_call → regulatory
    --   (operator_escalation recipient required by R19 enforcement contract)
    -- - regulatory_reporting=false (any severity) OR severity ∈ {non_imminent, imminent}:
    --   clinical_on_call is the de-facto final tier; operator_escalation may be unconfigured.
    ```

    `compute_crisis_recipient_mapping(crisis_event_id, severity, v_target_tier)` joins tenant config + care_team + consent_grant + severity + the explicit target_tier argument to return the exact (channel, recipient_role, recipient_address) tuples for the target tier's recipients. Final-tier exhaustion/recheck sweeps produce non-empty provider_attempt fan-out (NOT audit-only) — continuing pressure on the terminal tier is the explicit purpose of the recheck cadence per R13/R15 closure intent.
4. **Cat A audit emit:** `crisis.no_acknowledgement_escalation` Cat A audit row (co-transactional with the UPDATE above per FLOOR-020 fail-closed discipline).
5. **Tier ADVANCE + RESET (release the per-tier-cycle lock + compute next deadline; R13 HIGH-1 + R20 HIGH-1 + R21 HIGH-1 closure 2026-05-21: do NOT terminalize on final-tier exhaustion — only `record_crisis_resolution()` may terminalize via escalation_tier=NULL; ALL next_tier() invocations in STEP 5 use the tenant-aware 3-arg signature `next_tier(current_tier, severity, regulatory_reporting)` per R20/R21 closures; v_regulatory_reporting is read ONCE from tenant_config at sweep transaction start and reused for STEP 3 + STEP 5):** UPDATE escalation_obligation SET:
    - `escalation_tier`: if `next_tier(escalation_tier, severity, v_regulatory_reporting)` IS NOT NULL, advance to next tier; **else KEEP CURRENT TIER (final tier reached but unresolved; row remains sweep-visible)**. Tier exhaustion preserves escalation_tier at its terminal value: 'regulatory' for life_threatening on regulatory_reporting=true tenants; 'clinical_on_call' for life_threatening on regulatory_reporting=false tenants AND for non_imminent/imminent on ALL tenants.
    - `escalation_key = NULL` — releases the per-tier-cycle lock so the row is eligible for the NEXT deadline expiry (regardless of whether next_tier exists)
    - `undeliverable_deadline = CASE WHEN next_tier(escalation_tier, severity, v_regulatory_reporting) IS NOT NULL THEN now() + INTERVAL_for_severity_and_tier(severity, next_tier(escalation_tier, severity, v_regulatory_reporting)) ELSE now() + INTERVAL_final_tier_recheck_window(severity) END` — final-tier rows get the separate recheck window so they continue to fire periodically until resolved (canonical: non-imminent 30min / imminent 10min / life-threatening 5min recheck cycle).
    - `final_tier_exhausted_at`: set to now() the first time `next_tier(escalation_tier, severity, v_regulatory_reporting) IS NULL AND final_tier_exhausted_at IS NULL`; left unchanged on subsequent re-sweeps. First transition into final-tier-exhausted state emits an additional `crisis.final_tier_reached` Cat A audit; subsequent re-sweeps emit standard `crisis.no_acknowledgement_escalation` Cat A with payload field `is_final_tier_recheck=true`.

**R13 HIGH-1 semantic distinction:** `escalation_tier IS NULL` ⇔ resolved-terminal (via resolve wrapper). `escalation_tier = '<final tier>' AND final_tier_exhausted_at IS NOT NULL` ⇔ final-tier exhausted but unresolved (sweep continues to fire on recheck cadence until resolve wrapper terminalizes). Sweep predicate `escalation_tier IS NOT NULL` correctly excludes resolved rows AND includes both pre-exhaustion and post-exhaustion rows.

**`next_tier(current_tier, severity, regulatory_reporting)` canonical (R20 HIGH-1 closure 2026-05-21: function is now TENANT-AWARE via regulatory_reporting parameter so regulatory_reporting=false tenants stop at clinical_on_call as the de-facto final tier instead of advancing into a regulatory tier with no configured operator_escalation recipient):**
- `'care_team'` → `'clinical_on_call'` (always)
- `'clinical_on_call'` → `'regulatory'` IFF `severity = 'life_threatening' AND regulatory_reporting = true`, else `NULL` (clinical_on_call becomes the de-facto final tier for life-threatening severity on regulatory_reporting=false tenants AND for non-imminent/imminent severities on ALL tenants)
- `'regulatory'` → `NULL` (terminal; only reached when regulatory_reporting=true)

All call sites in Sub-decision 6 sweep contract (STEP 3 target_tier, STEP 5 escalation_tier advance) MUST pass the tenant's `regulatory_reporting` flag as the third argument; per-row sweep transaction reads `regulatory_reporting` once from tenant_config alongside severity and uses it for the per-row tier-advance computation.

**`INTERVAL_for_severity_and_tier()` canonical:** care_team 30s/60s/5min by severity; clinical_on_call adds 30s deadline after care_team timeout; regulatory adds 2min deadline after clinical_on_call timeout (per §8 operational obligations table).

**Multi-tier progression worked example (life-threatening severity, no acknowledgement at any tier; R14 HIGH-1 closure 2026-05-21: sweep #3 PRESERVES escalation_tier='regulatory' on final-tier exhaustion + sets final_tier_exhausted_at + emits crisis.final_tier_reached + schedules INTERVAL_final_tier_recheck_window; ONLY record_crisis_resolution() terminalizes):**
- t=0: STEP 2c INSERT escalation_obligation row with escalation_tier='care_team', final_tier_exhausted_at=NULL, escalation_key=NULL, undeliverable_deadline=t+30s.
- t=30s+ε: sweep #1 fires; performs steps 1-5; row now has escalation_tier='clinical_on_call', final_tier_exhausted_at=NULL, escalation_key=NULL, undeliverable_deadline=t+60s. Lifecycle transition: detected → escalated / no_acknowledgement_timeout.
- t=60s+ε: sweep #2 fires; performs steps 1-5; row now has escalation_tier='regulatory', final_tier_exhausted_at=NULL, escalation_key=NULL, undeliverable_deadline=t+180s (NOT yet final-tier; next_tier('regulatory', 'life_threatening')=NULL means regulatory IS the final tier). Lifecycle transition: escalated → escalated / tier_progression_no_acknowledgement.
- t=180s+ε: sweep #3 fires; row is at final tier (next_tier('regulatory', 'life_threatening')=NULL). Performs steps 1-5 with R13 final-tier-exhaustion semantics: **escalation_tier REMAINS 'regulatory'** (NOT NULL); final_tier_exhausted_at SET to now() (first exhaustion); escalation_key reset to NULL; undeliverable_deadline = now() + INTERVAL_final_tier_recheck_window('life_threatening') = t+180s + 5min = t+480s. **Emits one-time `crisis.final_tier_reached` Cat A audit** (in addition to standard `crisis.no_acknowledgement_escalation` Cat A); lifecycle transition: escalated → escalated / tier_progression_no_acknowledgement.
- t=480s+ε: sweep #4 fires (final-tier recheck); performs steps 1-5 but final_tier_exhausted_at is already set so does NOT re-emit `crisis.final_tier_reached`. Emits standard `crisis.no_acknowledgement_escalation` Cat A with payload `is_final_tier_recheck=true`; reschedules undeliverable_deadline = now() + INTERVAL_final_tier_recheck_window. Continues to fire on this recheck cadence indefinitely until record_crisis_resolution() runs.
- Eventually (clinician/operator intervention): `record_crisis_resolution()` runs; UPDATE escalation_obligation SET escalation_tier=NULL. Sweep predicate `escalation_tier IS NOT NULL` now excludes the row permanently. Lifecycle transition: escalated → resolved / resolution_recorded.

**Idempotency within a tier cycle:** between step 2 (escalation_key set) and step 5 (escalation_key reset to NULL), the row is excluded from the sweep predicate `escalation_key IS NULL`. The atomic per-row transaction commits all 5 steps together OR rolls all back; partial-state mid-cycle is impossible. Multiple concurrent sweep workers use `FOR UPDATE SKIP LOCKED` to prevent double-escalation.

**Difference from one-shot model (prior pre-R6 design that R7 HIGH-1 caught residual references to):** escalation_key is NOT a permanent terminal marker; it's a per-tier-cycle CLAIM lock that's released (NULL'd) at the end of each tier's atomic closure so the row is eligible for the next tier's deadline expiry. **Terminal exclusion is NOT determined by tier-exhaustion** (final-tier rows stay sweep-visible on a recheck cadence per R13 closure) — it is determined ONLY by record_crisis_resolution() setting escalation_tier=NULL.

### Sub-decision 7 — Test scaffolding (merge-blocking)

**Decision:** **17 merge-blocking integration tests** (R18+R21+R22+R25+R35 MED closures 2026-05-21: "17" counts numbered tests 1-15 + #17 contention benchmark; test 16 expanded into 12 sub-tests 16a-16l ALL merge-blocking; R10 added 16a-d; R11 added 16e-f; R13 added 16g; R16 added 16h; R20 added 16i; R22 added 16j; R25 added 16k; R35 added 16l tier-ownership authorization) + 3 static-analyzer rules:

**CI gate language (R18+R21+R22+R25+R35 MED):** merge gate requires ALL of tests 1-15 + 16a + 16b + 16c + 16d + 16e + 16f + 16g + 16h + 16i + 16j + 16k + 16l + 17 to PASS. Total **28 individual assertions** (15 base + 12 sub-tests + 1 benchmark).

**Integration tests (17 base entries, 16 expanded into 16a-16l sub-cluster):**
1. crisis_detection_trigger → Crisis Response Card renders within 200ms (latency budget)
2. Card renders even when CCR `crisis.escalation_destination_resolved` Cat B audit fails (Sub-decision 1 patient-surface-agreement)
3. `unmapped_country` resolution → fallback copy displayed
4. `partial_defaults` resolution → emergency_number visible; helpline null OK
5. `ccr_unavailable` → cached-last-known values used; generic fallback OK
6. Routing tree step 4 fan-out → all configured channels receive dispatch ledger rows
7. Imminent severity → clinical-on-call channel fanout AND `emergency_escalation` Cat A emitted
8. Life-threatening severity → regulatory_threshold_reached Cat A emitted; Adverse-Event picks up
9. No-acknowledgement timer — tier-cycle progression (R7 HIGH-1 + R13 HIGH-1 + R15 HIGH-1 closure 2026-05-21): from initial `escalation_tier='care_team'` row, after first undeliverable_deadline expiry, sweep performs atomic 5-step closure (lifecycle transition + escalation_key=uuid claim + recipient fan-out to next tier + Cat A audit emit + UPDATE: escalation_tier='clinical_on_call', escalation_key=NULL, new deadline). After second deadline expiry, second sweep: (a) IFF severity='life_threatening', advances escalation_tier to 'regulatory' (still not final-tier-exhausted); (b) IFF severity ∈ {'non_imminent', 'imminent'}, reaches final-tier-exhausted state — escalation_tier PRESERVED at 'clinical_on_call' (NOT NULL), final_tier_exhausted_at SET to now(), one-time `crisis.final_tier_reached` Cat A emitted, undeliverable_deadline rescheduled to now() + INTERVAL_final_tier_recheck_window. For life-threatening, third sweep reaches final-tier-exhausted state on 'regulatory'. Test asserts EACH tier transition fires in sequence + final-tier exhaustion preserves escalation_tier + emits crisis.final_tier_reached one-time.
10. Tier-cycle idempotency + final-tier non-terminalization (R7 HIGH-1 + R13 HIGH-1 + R15 HIGH-1 closure 2026-05-21): within a single tier cycle (between escalation_key=uuid and reset to NULL), re-running sweep is a no-op (predicate `escalation_key IS NULL` excludes it). After reset + tier advance OR final-tier exhaustion, the row becomes eligible for the NEXT deadline expiry. Test asserts: (a) re-running sweep during in-flight tier cycle does NOT double-escalate; (b) re-running sweep after tier advance + before next deadline does NOT escalate; (c) re-running sweep after next deadline DOES advance to next tier OR (if final-tier) fires a recheck-cadence sweep with payload `is_final_tier_recheck=true`; (d) **ONLY** rows where `escalation_tier IS NULL` (set exclusively by `record_crisis_resolution()`) are permanently excluded — final-tier-exhausted rows are NOT excluded, they continue to fire on INTERVAL_final_tier_recheck_window cadence; (e) for non-imminent severity, after 2 sweeps (care_team→clinical_on_call→final-tier-exhausted), the row preserves escalation_tier='clinical_on_call' indefinitely until resolve wrapper; (f) for imminent severity, same pattern (clinical_on_call is final tier for non-life-threatening); (g) for life-threatening severity, after 3 sweeps reaches final-tier-exhausted on 'regulatory'. None of (e)/(f)/(g) ever produce escalation_tier=NULL without an explicit resolve-wrapper call.
11. Crisis_event lifecycle state-machine: invalid transition triple (e.g., `resolved → detected`) rejected by CHECK constraint
12. Caller-class-split view: patient calling `crisis_outcome_summary_v` sees only their own crisis events (verify_session_jwt_and_extract_claims predicate)
13. Caller-class-split view: clinician/care-team calling sees tenant-wide crisis events
14. Mode 1 chat: Crisis Response Card displaces the assistant turn visually but assistant turn preserved in conversation history
15. Tenant cannot disable crisis detection: any attempt to set tenant.crisis_detection_enabled=false raises ERROR (I-019 platform-floor)
16a. **Deadline-reset on acknowledge (R10 HIGH-1 + R11 HIGH-1 closure 2026-05-21):** after `record_crisis_acknowledgement_claim()` runs, the obligation's undeliverable_deadline MUST be reset to now() + INTERVAL_for_severity_response_window(severity); escalation_tier left UNCHANGED (NOT terminalized); escalation_key reset to NULL. Sweep run BEFORE new deadline does NOT escalate; sweep run AFTER new deadline DOES advance via `acknowledged → escalated / acknowledged_no_response_timeout` triple.
16b. **Deadline-reset on respond (R11 HIGH-1):** after `record_crisis_response()` runs, undeliverable_deadline reset to now() + INTERVAL_for_severity_resolution_window(severity); escalation_tier unchanged; escalation_key=NULL. Sweep run BEFORE new deadline does NOT escalate; sweep run AFTER new deadline DOES advance via `responded → escalated / responded_no_resolution_timeout` triple.
16c. **Terminalization on resolve (R10 HIGH-1 + R11 HIGH-1):** after `record_crisis_resolution()` runs, escalation_tier MUST be NULL; sweep predicate `escalation_tier IS NOT NULL` permanently excludes the row.
16d. **Lifecycle-eligibility backstop (R10 HIGH-1):** simulate missed terminalization — manually transition crisis_event to 'resolved' without calling wrapper (or simulate wrapper failure after lifecycle transition but before obligation UPDATE); sweep run after undeliverable_deadline MUST exclude the row (LATERAL JOIN filter `current_state IN ('detected','escalated','acknowledged','responded')` excludes resolved state).
16e. **Acknowledge-then-no-response timeout (R11 HIGH-1):** clinician calls `record_crisis_acknowledgement_claim()` then takes no further action; after INTERVAL_for_severity_response_window elapses, sweep MUST emit the `acknowledged → escalated / acknowledged_no_response_timeout` transition + Cat A audit + recipient fan-out to next tier per Sub-decision 3 routing tree.
16f. **Respond-then-no-resolution timeout (R11 HIGH-1):** clinician calls `record_crisis_acknowledgement_claim()` + `record_crisis_response()` then takes no further action; after INTERVAL_for_severity_resolution_window elapses, sweep MUST emit the `responded → escalated / responded_no_resolution_timeout` transition + Cat A audit + recipient fan-out to next tier.
16g. **Final-tier exhaustion stays sweep-visible until resolved — regulatory_reporting=TRUE tenant life-threatening (R13 HIGH-1 + R16 HIGH-1 + R21 MED-1 closure 2026-05-21; scoped to regulatory_reporting=true per R20):** simulate a life-threatening crisis on a regulatory_reporting=true tenant through all 3 tiers (care_team → clinical_on_call → regulatory) without acknowledgement/response/resolution. After the third sweep, escalation_tier MUST remain at 'regulatory' (NOT NULL); final_tier_exhausted_at MUST be set to the timestamp of that third sweep; one-time `crisis.final_tier_reached` Cat A audit MUST be emitted at the third sweep. **Recipient fan-out for the third sweep AND every subsequent recheck sweep MUST produce non-empty provider_attempt rows targeting the regulatory tier (NOT audit-only)** — `compute_crisis_recipient_mapping(crisis_event_id, severity, COALESCE(next_tier(...), 'regulatory'))` resolves to 'regulatory' on final-tier exhaustion/recheck. After INTERVAL_final_tier_recheck_window elapses, sweep MUST fire AGAIN, emitting `crisis.no_acknowledgement_escalation` Cat A with payload `is_final_tier_recheck=true` + non-empty regulatory-tier fan-out. Only `record_crisis_resolution()` setting escalation_tier=NULL terminalizes the row.
16h. **Non-imminent + imminent final-tier exhaustion fan-out (R16 HIGH-1 closure 2026-05-21):** simulate non-imminent severity through 2 tiers (care_team → clinical_on_call) without acknowledgement; second sweep reaches final-tier exhaustion (clinical_on_call is final for non-life-threatening). Fan-out at sweep #2 AND every recheck sweep MUST produce non-empty provider_attempt rows targeting the clinical_on_call tier (continuing pressure; NOT audit-only). Same assertion for imminent severity.
16i. **regulatory_reporting=false tenant final-tier exhaustion at clinical_on_call (R20 HIGH-1 closure 2026-05-21):** simulate life-threatening severity on a tenant with regulatory_reporting=false through 2 tiers (care_team → clinical_on_call); second sweep reaches final-tier exhaustion at clinical_on_call (NOT regulatory) because next_tier('clinical_on_call', 'life_threatening', regulatory_reporting=false) returns NULL. final_tier_exhausted_at MUST be set at sweep #2; one-time crisis.final_tier_reached Cat A MUST be emitted at sweep #2; subsequent recheck sweeps MUST target clinical_on_call (NOT attempt regulatory advancement) AND MUST produce non-empty clinical_on_call provider_attempt fan-out (using the mandatory crisis.clinical_on_call_channel + the configured clinical-on-call recipient address — tenant preflight asserts this is non-null per R22 HIGH-1 enforcement). operator_escalation tenant config keys MAY be null on this tenant; preflight does NOT reject that. Only record_crisis_resolution() terminalizes via escalation_tier=NULL.
16j. **Negative-config preflight rejection — missing clinical_on_call on regulatory_reporting=false tenant (R22 HIGH-1 closure 2026-05-21):** attempt to deploy a tenant with regulatory_reporting=false AND crisis.clinical_on_call_channel=null. The deployment preflight DO block MUST raise EXCEPTION ('insufficient_configuration' SQLSTATE); TLC-CRISIS-003 static analyzer MUST flag the tenant config row at lint time; the record_crisis_initiation() wrapper MUST fail-closed at runtime emitting crisis.dispatch_attempt_failed Cat C. Three enforcement points all reject the bad configuration; no path allows the tenant to accept a crisis with missing clinical_on_call recipient.
16k. **Initial fan-out includes all Sub-decision 3 eligible recipients (R25 HIGH-1 + R26 HIGH-1 closure 2026-05-21):** simulate crisis_detection_trigger emission; verify STEP 4b uses `compute_crisis_initial_recipient_mapping(v_crisis_event_id, v_severity, v_regulatory_reporting)` and produces provider_attempt rows for ALL Sub-decision 3 logical recipients eligible at detection time. Specifically:
- **non_imminent severity:** care_team recipients only (recipient_role='care_team' on all configured channels).
- **imminent severity:** care_team recipients + 1 clinical_on_call recipient on `crisis.clinical_on_call_channel` + emergency_contact recipient IFF consent_grant emergency_contact_share scope.
- **life_threatening + regulatory_reporting=false:** care_team + clinical_on_call + emergency_contact IFF consent.
- **life_threatening + regulatory_reporting=true:** care_team + clinical_on_call + emergency_contact IFF consent + 1 operator_escalation recipient on `crisis.operator_escalation_channel`. AND `crisis.regulatory_threshold_reached` Cat A emitted at STEP 4 (separate from operator_escalation dispatch).
escalation_tier remains 'care_team' (initial value) — initial multi-tier dispatch does NOT skip care_team_no_acknowledgement_timeout deadline. First sweep at care_team deadline expiry uses the SEPARATE `compute_crisis_recipient_mapping(..., target_tier='clinical_on_call')` to compute the clinical_on_call recipient set. **R29 HIGH-2 + R30 HIGH-2 + R34 HIGH-1 + R41 HIGH-2 closure (UNIFIED sweep_cycle_id contract): initial dispatch rows have attempt_sequence=1 + sweep_cycle_id=1 (from escalation_obligation.sweep_cycle_counter DEFAULT=1). First sweep INSERTs all new provider_attempt rows with attempt_sequence=2 + sweep_cycle_id=2 (sweep_cycle_counter incremented atomically in sweep STEP 2 to 2) — for EVERY clinical_on_call recipient REGARDLESS of whether the recipient was previously dispatched at initial. Subsequent sweeps use 3, 4, N. ALL provider_attempt rows from a single sweep transaction share the same v_sweep_cycle_id (no per-recipient MAX+1 variance). ON CONFLICT DO NOTHING is for worker-retry idempotency on the SAME (recipient, sweep_cycle_id=v_sweep_cycle_id) tuple only; it does NOT suppress escalation-time re-notification of already-dispatched recipients (different sweep_cycle_id → no conflict → new row created).**
16l. **Tier-ownership authorization on acknowledge/respond wrappers (R35 HIGH-1 + R36 HIGH-1/HIGH-2 closure 2026-05-21):** simulate calls to `record_crisis_acknowledgement_claim()` under multiple JWT-bound principals with different recipient_role assignments. Positive variant: clinical_on_call-tier responder (matched provider_attempt.recipient_principal_id) calls acknowledge after escalation_tier already advanced to 'clinical_on_call' — wrapper derives v_derived_tier='clinical_on_call' from the row, asserts derived tier ≥ current escalation_tier (passes), advances escalation_tier accordingly + resets deadline. **R36 HIGH-1 negative variant:** care_team-tier responder calls acknowledge AFTER escalation_tier has advanced to 'clinical_on_call' (sweep already fired) — wrapper derives v_derived_tier='care_team' which is BELOW current escalation_tier; wrapper MUST RAISE `tier_ownership_below_current_tier` (no deadline reset; the lower-tier responder cannot suppress higher-tier escalation pressure). **R36 HIGH-2 negative variant:** responder with same address as a dispatched recipient but DIFFERENT JWT principal_id — wrapper MUST NOT match the provider_attempt row (lookup is by recipient_principal_id, NOT raw address); MUST RAISE `tier_ownership_unauthorized`. Caller-supplied tier parameter is REJECTED (function signature has no tier parameter). **R37 HIGH-1 additional assertion:** verify that provider_attempt rows produced by BOTH initial STEP 4b dispatch AND Sub-decision 6 STEP 3 sweep tier-advance fan-out have non-null recipient_principal_id for care_team / clinical_on_call / operator_escalation recipient_roles — wrapper authorization MUST be able to find a principal-bound row for any legitimate responder. Negative variant: simulate provider_attempt row INSERT with recipient_principal_id=NULL for care_team_role — wrapper MUST RAISE tier_ownership_unauthorized (the legitimate responder's matching row exists but has no principal_id binding, which is itself a runtime defect that should fail-closed rather than fall back to address equality).
17. **Contention benchmark (R5 MED-1 + R6 MED-1 closure 2026-05-21):** under simulated contention of 1000 concurrent crisis_event INSERTs across 50 tenants (20 events per tenant, isolation level READ COMMITTED, all 4 STEP 2 sub-step inserts atomic with Cat A audit emit per R6 HIGH-2 closure), the measured STEP 1+2+3 p99 latency MUST be ≤ 180ms. Pass/fail threshold: p99 ≤ 180ms across 5 consecutive runs. Workload: synthetic crisis_detection_trigger events emitted at 100 req/s sustained for 10 seconds. CI gate: merge BLOCKED if any of the 5 runs reports p99 > 180ms. Isolation assumption: dedicated benchmark database identical to production index plan; representative network latency between application layer and database.

**Static-analyzer rules (3):**
- TLC-CRISIS-001: no handler may catch+swallow a crisis_detection_trigger emission (would violate FLOOR-020); enforced by AST walker
- TLC-CRISIS-002: no DDL may DROP COLUMN on crisis_event or crisis_event_lifecycle_transition (append-only platform-floor); enforced by migration linter
- TLC-CRISIS-003: no tenant config row may have `crisis_*` keys set to false/null (I-019 enforcement); enforced by config-validation linter

---

## 3. AUDIT_EVENTS amendment (v5.11 → v5.12)

**8 new action IDs** under `crisis.*` namespace EXTENDING P-025 (which contributed `crisis.escalation_destination_resolved` Cat B): **7 Cat A + 0 Cat B + 1 Cat C** (R13 HIGH-1 closure 2026-05-21 added crisis.final_tier_reached Cat A; R1 MED-1 closure 2026-05-21 moved no_acknowledgement_escalation Cat B → Cat A):

| # | Action ID | Category | Sampling | Partition |
|---|---|---|---|---|
| 1 | `crisis.detected` | Cat A | NOT sampled (safety-floor) | P1 keyed by patient_id |
| 2 | `crisis.acknowledged` | Cat A | NOT sampled | P1 keyed by patient_id |
| 3 | `crisis.responded` | Cat A | NOT sampled | P1 keyed by patient_id |
| 4 | `crisis.resolved` | Cat A | NOT sampled | P1 keyed by patient_id |
| 5 | `crisis.no_acknowledgement_escalation` | Cat A | NOT sampled (safety-floor escalation; R1 MED-1 closure 2026-05-21: aligned with Sub-decision 6 Cat A claim — escalation evidence MUST be fail-closed audit-complete when a safety timeout fires; Cat B fail-soft tolerance would risk silent loss of escalation evidence during the exact failure mode the timer exists to catch) | P1 keyed by patient_id |
| 6 | `crisis.regulatory_threshold_reached` | Cat A | NOT sampled (safety-floor) | P1 keyed by patient_id |
| 7 | `crisis.dispatch_attempt_failed` | Cat C | high-volume sampled | P2 governance-partition |
| 8 | `crisis.final_tier_reached` | Cat A | NOT sampled (safety-floor; R13 HIGH-1 closure 2026-05-21: emitted once per crisis_event the first time escalation_tier reaches a tier where next_tier(escalation_tier, severity) IS NULL; ensures operators are alerted on first final-tier exhaustion; subsequent re-sweeps on final-tier rows emit standard `crisis.no_acknowledgement_escalation` Cat A with payload `is_final_tier_recheck=true`) | P1 keyed by patient_id |

Existing P-025 `crisis.escalation_destination_resolved` Cat B remains unchanged.
Existing `crisis_detection_trigger` Cat A (from baseline AUDIT_EVENTS) remains unchanged and emits at the FLOOR-020 path.

---

## 4. DOMAIN_EVENTS additive

**4 new event types** under `crisis.*` namespace (additive enum extension; no version bump):

1. `crisis.detected.v1` — payload: server_signal_id, patient_id, severity, source_surface (mode_1_chat / community / forms / messaging)
2. `crisis.acknowledged.v1` — payload: crisis_event_id, acknowledged_by, acknowledged_at
3. `crisis.responded.v1` — payload: crisis_event_id, response_type, responded_by
4. `crisis.resolved.v1` — payload: crisis_event_id, resolution_outcome, resolved_at

Domain events are emitted alongside Cat A audit (same-tx outbox pattern per Consent slice P-027 §4.66).

---

## 5. OpenAPI amendment (v0.4 → v0.5)

**6 new endpoints** under `/v1/crisis/*`:

| # | Method | Path | Caller role | Purpose |
|---|---|---|---|---|
| 1 | GET | `/v1/crisis/active` | clinician / care-team-member | List active crisis events in tenant (paginated; reads staff-summary view) |
| 2 | GET | `/v1/crisis/mine` | patient / delegate | List caller's own crisis events (reads patient-summary view; verify_session_jwt_and_extract_claims predicate) |
| 3 | POST | `/v1/crisis/:crisis_event_id/acknowledge` | clinician / care-team-member | Claim acknowledgement via crisis_acknowledgement_claim (calls SECURITY DEFINER wrapper) |
| 4 | POST | `/v1/crisis/:crisis_event_id/response` | clinician / care-team-member | Record response action (calls SECURITY DEFINER wrapper) |
| 5 | POST | `/v1/crisis/:crisis_event_id/resolve` | clinician / care-team-member | Mark resolved (terminal; calls SECURITY DEFINER wrapper; INSERT crisis_resolution row) |
| 6 | GET | `/v1/crisis/resources` | patient / delegate / unauthenticated-emergency | Resource lookup endpoint (calls 3 CCR resolvers; returns card payload); ONLY endpoint accessible without authenticated session for emergency fallback |

**Idempotency:** endpoints 3 + 4 + 5 use `Idempotency-Key` header per canonical IDEMPOTENCY contract.

**Endpoint 6 unauthenticated-emergency posture:** the resource-lookup endpoint is the ONLY platform endpoint accessible without a JWT-verified session. This is a deliberate I-019 safety-floor concession: a patient in crisis whose session has expired must still be able to retrieve emergency numbers. Rate-limited per IP (60 req/min); returns ONLY country-default crisis_helplines + emergency_number (NO patient-specific data); does NOT consume or emit Cat A audit (no patient identity available).

---

## 6. State Machines amendment (v1.3 → v1.4)

**1 new state machine `crisis_event_lifecycle`** described as DERIVED from append-only `crisis_event_lifecycle_transition` rows per Option A (mirrors SI-019 + SI-020 patterns).

**Allowed transition triples (11 enumerated via CHECK constraint; post-R11 HIGH-1 closure added 2 more triples: `acknowledged → escalated` with reason `acknowledged_no_response_timeout` + `responded → escalated` with reason `responded_no_resolution_timeout` (distinct from existing `responded → escalated / response_failed`); R8 HIGH-1 closure previously added the 9th triple `escalated → escalated / tier_progression_no_acknowledgement`):**

| from_state | to_state | transition_reason |
|---|---|---|
| none | detected | initial_detection |
| detected | acknowledged | clinician_claim |
| detected | escalated | no_acknowledgement_timeout |
| acknowledged | responded | response_action_recorded |
| acknowledged | escalated | acknowledged_no_response_timeout (R11 HIGH-1 closure 2026-05-21: required because R10 wrapper terminalization-on-acknowledge was reverted — acknowledge resets deadline but does NOT terminalize; if clinician acknowledges then fails to respond within INTERVAL_for_severity_response_window, sweep emits this transition) |
| responded | resolved | resolution_recorded |
| responded | escalated | response_failed (clinician-initiated; existing pre-R11 triple) |
| responded | escalated | responded_no_resolution_timeout (R11 HIGH-1 closure 2026-05-21: sweep-driven; distinct from response_failed which is clinician-initiated. If clinician records response but does not record resolution within INTERVAL_for_severity_resolution_window, sweep emits this transition) |
| escalated | acknowledged | higher_tier_claim |
| escalated | escalated | tier_progression_no_acknowledgement (R8 HIGH-1 closure 2026-05-21: required for multi-tier sweep; first care_team→clinical_on_call tier advance uses 'detected → escalated' triple, subsequent clinical_on_call→regulatory tier advance uses 'escalated → escalated' triple. CHECK constraint enumerates 11 triples total post-R11 closure.) |
| acknowledged | resolved | direct_resolution |

**R8 HIGH-1 closure 2026-05-21:** added `escalated → escalated` triple with reason `tier_progression_no_acknowledgement` so the multi-tier sweep can record SUBSEQUENT tier advances (sweep #2 from care_team-escalated to clinical_on_call-escalated; sweep #3 from clinical_on_call-escalated to regulatory-escalated). The FIRST tier advance still uses `detected → escalated` with reason `no_acknowledgement_timeout`. The reason field disambiguates intent: `no_acknowledgement_timeout` = first care-team timeout from `detected` baseline; `tier_progression_no_acknowledgement` = subsequent tier escalations from an already-escalated state. Sub-decision 6 STEP 1 normative contract: emit reason='no_acknowledgement_timeout' on the first sweep (current state='detected') and reason='tier_progression_no_acknowledgement' on subsequent sweeps (current state='escalated'). State machine triples count: 9 total (was 8 pre-R8 closure).

Current-state derivation: ORDER BY transition_at DESC, id DESC LIMIT 1 (with strict > monotonic ordering per P-038 R3 HIGH-2 pattern).

---

## 7. RBAC amendment (v1.3 → v1.4)

**7 new roles** (3 application + 3 wrapper owners + 1 view owner):

### Application roles (3)

| Role | Granted to |
|---|---|
| `crisis_event_patient_reader` | patient + delegate IFF emergency_contact_share scope (reads crisis_outcome_summary_patient_v ONLY; predicate via verify_session_jwt_and_extract_claims + consent_grant) |
| `crisis_event_staff_reader` | clinician + care-team-member + admin (reads crisis_outcome_summary_staff_v ONLY; tenant-wide visibility) |
| `crisis_event_responder` | clinician + care-team-member (calls acknowledge + response + resolve wrappers) |

### Wrapper owner roles (3)

| Role | Owns |
|---|---|
| `crisis_event_writer_owner` | raw record_crisis_event_lifecycle_transition() (owner-only EXECUTE; granted to the 3 reason-specific wrappers below) |
| `crisis_acknowledgement_wrapper_owner` | record_crisis_acknowledgement_claim() + record_crisis_response() |
| `crisis_resolution_wrapper_owner` | record_crisis_resolution() |

### View owner role (1)

| Role | Owns |
|---|---|
| `crisis_view_owner` | crisis_outcome_summary_patient_v + crisis_outcome_summary_staff_v (both non-BYPASSRLS; owner-only base-table SELECT grants) |

---

## 8. Operational obligations

| Obligation | Window | Source-of-truth |
|---|---|---|
| Patient Crisis Response Card render | ≤ 200ms from `crisis.detected` Cat A emit | latency budget; merge-blocking integration test |
| Care-team acknowledgement (non-imminent severity) | ≤ 5 minutes (= notification_crisis_escalation_obligation.undeliverable_deadline) | persisted deadline |
| Care-team acknowledgement (imminent severity) | ≤ 60 seconds | persisted deadline |
| Care-team acknowledgement (life-threatening severity) | ≤ 30 seconds | persisted deadline |
| Clinical-on-call escalation (after no-ack timeout) | within 30 seconds of `crisis.no_acknowledgement_escalation` Cat A emit (R2 MED-1 closure 2026-05-21: corrected Cat B → Cat A to match the §3 AUDIT_EVENTS table + Sub-decision 6 fail-closed claim) | scheduled job sweep at 30s granularity |
| Regulatory threshold reached → Adverse-Event picks up | ≤ 2 minutes from `crisis.regulatory_threshold_reached` Cat A emit | Adverse-Event slice SLO |

---

## 9. Cross-SI alignment

| Cross-SI surface | This SI's surface | Relationship |
|---|---|---|
| I-019 (Crisis detection always-on) | Sub-decisions 1, 2, 3, 7 | This SI is the response surface that I-019 anchors; never override I-019 |
| P-025 SI-013 CCR crisis-helpline + Cat B audit | Sub-decisions 1, 2; AUDIT preserves P-025 entries | This SI consumes the 3 typed resolvers and the Cat B audit unchanged |
| P-027 §4.66-4.68 notification_crisis_dispatch_ledger + provider_attempt + escalation_obligation | Sub-decision 5, 6 | This SI wires crisis_event INSERT to dispatch_ledger fan-out |
| P-035 AI Service Mode 1 FLOOR-020 crisis-detection emit | Sub-decision 3 (consumes the emission) | This SI is downstream of FLOOR-020; never blocks the emit path |
| P-031 SI-024.1 v0.8 JWT-binding canonical trust anchor | All RLS policies + SECURITY DEFINER procedures + view predicates | All new entities use canonical pattern; verify_session_jwt_and_extract_claims + current_tenant_id_strict |
| I-035 append-only invariant | Sub-decision 4 (all 6 entities) | crisis_event + lifecycle_transition + acknowledgement_claim (hybrid release) + response_record + resolution all append-only or hybrid per I-035 |
| Adverse-Event Reporting slice | Sub-decision 3 step 7 (regulatory_threshold_reached) | This SI emits the trigger event; Adverse-Event Reporting picks up |
| Sync Video Consult slice | Sub-decision 3 step 5 (clinical-on-call channel) | This SI references escalation_destination; sync video slice implements the bridge |
| INVARIANTS bump | NOT in this SI | No new platform-floor invariants; alignment with I-019 + I-023 + I-027 + I-032 v5.3 + I-035 |

---

## 10. Deployment prerequisites preflight

Required pre-existing roles (CREATE ROLE happens in a prior baseline DDL):

| Role | Purpose |
|---|---|
| `crisis_event_writer_owner` | Raw crisis_event_lifecycle_transition writer |
| `crisis_acknowledgement_wrapper_owner` | Acknowledge + response wrapper owner |
| `crisis_resolution_wrapper_owner` | Resolution wrapper owner |
| `crisis_view_owner` | Non-BYPASSRLS view owner (preflight asserts rolbypassrls=false) |
| `crisis_event_patient_reader` / `crisis_event_staff_reader` / `crisis_event_responder` | App roles |

Preflight DO block mirrors P-038 §10 deployment preflight pattern.

---

## 11. Open questions for ratifier (own ceremony)

1. **OQ1 — Codex pre-ratification target rounds.** Recommendation: 5-8 rounds + ship-it verification (smaller scope than P-037; only 6 new entities vs 7; reuses existing P-025 + P-027 infrastructure).
2. **OQ2 — Endpoint 6 unauthenticated-emergency posture.** This is the only platform endpoint accessible without JWT. Ratifier confirms: (a) IP-rate-limit at 60 req/min is canonical; (b) endpoint returns country-default helpline + emergency_number only (NO patient data); (c) no Cat A audit emission (no patient identity available); (d) endpoint NOT subject to I-024 tenant isolation (deliberately tenant-anonymous fallback).
3. **OQ3 — Severity classification source.** crisis_detection_trigger Cat A audit currently has `crisis_type` field but no `severity` field. Does crisis_detection emit set severity inline, or does this slice introduce a separate severity-classification step? Recommendation: Mode 1 FLOOR-020 emits with severity classified inline per the model's safety-tier output; this slice consumes the classified severity without re-classifying.
4. **OQ4 — Tenant configuration of fan-out channels.** Tenants configure WHICH channels exist (sms/email/in-app providers) but NOT whether fan-out happens. Ratifier confirms the canonical tenant_config keys: `crisis.fanout_channels[]` (allow-list per channel) + `crisis.clinical_on_call_channel` (which configured channel for clinical-on-call) + **(R18 HIGH-1 closure 2026-05-21)** `crisis.operator_escalation_channel` (channel-class for regulatory-tier operator on-call) + `crisis.operator_escalation_recipient` (recipient address for operator on-call) + **(R31 HIGH-1 closure 2026-05-21)** `crisis.emergency_contact_channel` (channel-class for emergency-contact dispatch when patient has active emergency_contact_share consent grant).

**R19 HIGH-1 + R22 HIGH-1 closure 2026-05-21 (enforcement contract):** I-019 platform-floor forbids the following keys from being empty/null on **EVERY** tenant (regardless of regulatory_reporting value), because every tenant's care_team → clinical_on_call advancement is unconditional + clinical_on_call may be the de-facto final tier for non-life-threatening severities + for life-threatening on regulatory_reporting=false:
- `crisis.fanout_channels[]` — MUST be a non-empty array (required for STEP 4a dispatch_ledger setup on the initial care_team tier emission)
- `crisis.clinical_on_call_channel` — MUST be a non-null channel-class **on ALL tenants** (R22 HIGH-1: previously only required for regulatory_reporting=true; tightened because clinical_on_call advancement is unconditional + may be final-tier-exhausted for non-life-threatening severities OR life-threatening on regulatory_reporting=false; missing clinical_on_call_channel would produce empty/failing fan-out at the exact terminal-risk state R16/R20/R21 were meant to protect)
- `crisis.clinical_on_call_channel` MUST be present in `crisis.fanout_channels[]` so the corresponding dispatch_ledger row is established at STEP 4a (R22 HIGH-1 cross-key consistency)

For tenants with `regulatory_reporting=true` (life-threatening crises CAN reach the regulatory tier on this tenant), the following keys are ALSO required to be non-null/non-empty:
- `crisis.operator_escalation_channel` — MUST be non-null AND MUST be present in `crisis.fanout_channels[]`
- `crisis.operator_escalation_recipient` — MUST be non-null and address-format-valid

For tenants with `regulatory_reporting=false`, the operator_escalation keys MAY be null (life-threatening crises will still escalate through care_team → clinical_on_call but will not reach the regulatory tier; canonical next_tier() returns NULL at clinical_on_call when severity='life_threatening' AND regulatory_reporting=false, treating clinical_on_call as the de-facto final tier; clinical_on_call recipient is still required per the every-tenant rule above).

**Enforcement points (R23 HIGH-1 closure 2026-05-21: SPLIT the always-mandatory keys from the regulatory_reporting-conditional keys at every enforcement layer, so the every-tenant rule is actually enforced):**

1. **Deployment preflight DO block** (§10) — fail-closed assertion in THREE parts:
   - **Part A (every tenant):** assert `cardinality(crisis.fanout_channels[]) > 0` AND `crisis.clinical_on_call_channel IS NOT NULL` AND `crisis.clinical_on_call_channel = ANY(crisis.fanout_channels[])` — applies regardless of regulatory_reporting value.
   - **Part B (regulatory_reporting=true tenants only):** assert `crisis.operator_escalation_channel IS NOT NULL` AND `crisis.operator_escalation_recipient IS NOT NULL` AND `crisis.operator_escalation_channel = ANY(crisis.fanout_channels[])`.
   - **Part C (R31 HIGH-1 + R32 HIGH-1 closure 2026-05-21 — emergency_contact_consent_enabled=true tenants only):** assert `crisis.emergency_contact_channel IS NOT NULL` AND `crisis.emergency_contact_channel = ANY(crisis.fanout_channels[])`. Tenants with emergency_contact_consent_enabled=false MAY leave emergency_contact_channel null (no emergency-contact dispatch possible; the routing tree's recipient 4 path is logically skipped).
2. **Static-analyzer rule TLC-CRISIS-003** (§7) — extended to validate THREE rule sets:
   - **(every tenant)** rejects ANY tenant config row where `fanout_channels[] IS NULL OR cardinality(fanout_channels[]) = 0 OR clinical_on_call_channel IS NULL OR NOT (clinical_on_call_channel = ANY(fanout_channels[]))`
   - **(regulatory_reporting=true conditional)** rejects tenant config rows where `regulatory_reporting=true AND (operator_escalation_channel IS NULL OR operator_escalation_recipient IS NULL OR NOT (operator_escalation_channel = ANY(fanout_channels[])))`
   - **(R31 HIGH-1 closure 2026-05-21 — emergency_contact_channel conditional)** rejects tenant config rows where `emergency_contact_consent_enabled=true AND (emergency_contact_channel IS NULL OR NOT (emergency_contact_channel = ANY(fanout_channels[])))`. The `emergency_contact_consent_enabled` tenant config flag is true IFF the tenant allows patients to grant emergency_contact_share consent (the slice-level toggle); when true, the emergency_contact_channel MUST be configured AND in fanout_channels[] so an emergency_contact dispatch_ledger row CAN exist at STEP 4a and the emergency_contact recipient CAN be reached.
3. **Wrapper-procedure runtime validation** — `record_crisis_initiation()` (Phase A implementation) at session-bind time:
   - ALWAYS asserts fanout_channels[] non-empty + clinical_on_call_channel non-null + clinical_on_call_channel ∈ fanout_channels[]; fail-closed emitting `crisis.dispatch_attempt_failed` Cat C if missing
   - ASSERTS operator_escalation keys IFF regulatory_reporting=true; same fail-closed behavior
   - **(R32 HIGH-1 closure 2026-05-21)** ASSERTS emergency_contact_channel non-null + ∈ fanout_channels[] IFF emergency_contact_consent_enabled=true; same fail-closed behavior

These three enforcement points apply matching scope: the every-tenant rule at all three layers + the conditional rule at all three layers. No layer leaves the every-tenant rule un-enforced.
5. **OQ5 — Hybrid persistence for crisis_acknowledgement_claim.** Same pattern as P-037 R4 consult_review_claim — append-only identity columns + one-way mutable released_at/released_reason via BEFORE UPDATE trigger. Confirm pattern applies; or should crisis acknowledgement be strict append-only (no claim release / no reassignment) given the safety-floor semantics? Recommendation: hybrid persistence is appropriate (a clinician who claims then becomes unavailable must be able to release the claim for re-assignment; the timeout-driven escalation in Sub-decision 6 also implies claim release).
6. **OQ6 — Designated emergency contact integration.** Sub-decision 3 step 6 fans out to designated emergency contact IFF Consent grant scope `emergency_contact_share`. Ratifier confirms (a) Consent slice canonical entity name (consent_grant per OQ4 from P-038); (b) the canonical scope literal value `emergency_contact_share`; (c) emergency contact dispatch is a separate (recipient_role='emergency_contact', channel=`tenant.crisis.emergency_contact_channel`) provider_attempt row under the matching channel-class dispatch_ledger row (R31 + R32 HIGH-2 closure 2026-05-21: channel is tenant-configurable, NOT hardcoded SMS).

---

## 12. Codex pre-ratification status

**v0.1 DRAFT 2026-05-21:** pre-Codex-review.
**v0.2 DRAFT 2026-05-21 — R1 closures applied (2 HIGH + 1 MED):**
- **R1 HIGH-1 closed:** CCR lookup was placed on FLOOR-020 synchronous emit path, contradicting non-blocking detection invariant + creating Cat A/Cat B fail-mode mismatch on the same path. Fix: restructured Sub-decision 2 with explicit STEP 1-5 ordering — STEP 1 Cat A `crisis_detection_trigger` synchronous FLOOR-020 fail-closed; STEP 2 crisis_event INSERT + initial transition; STEP 3 Crisis Response Card render with cached/generic content (≤ 200ms); STEP 4 ASYNCHRONOUS CCR resolvers + `crisis.escalation_destination_resolved` Cat B fail-soft per P-025; STEP 5 reactive card hydration after STEP 4 outcome. Resolver failure NEVER blocks Cat A emission.
- **R1 HIGH-2 closed:** Sub-decision 5 proposed "one dispatch_ledger row per (recipient_role, channel)" — would have required amending P-027 §4.66 UNIQUE(tenant_id, patient_id, server_signal_id, channel) constraint to include recipient_role (structural change to ratified canonical schema; hard-floor item 6 territory). Fix: aligned with existing P-027 two-tier shape per Codex's recommendation — §4.66 dispatch_ledger row per channel-class records channel-level OBLIGATION (preserves canonical UNIQUE); §4.67 provider_attempt row per (recipient_role, channel) tuple records per-recipient OUTCOME (multiple SMS recipients = N provider_attempt rows under single SMS dispatch_ledger row). No P-027 schema amendment required.
- **R1 MED-1 closed:** Sub-decision 6 claimed `crisis.no_acknowledgement_escalation` is Cat A; §3 AUDIT_EVENTS table defined the same action ID as Cat B. Chose Cat A — safety-floor escalation evidence MUST be fail-closed audit-complete when a safety timeout fires; Cat B fail-soft tolerance would risk silent loss of escalation evidence during the exact failure mode the timer exists to catch. Updated §3 table + §1 in-scope tally (4 Cat A + 1 Cat B + 2 Cat C → 6 Cat A + 0 Cat B + 1 Cat C).

Authored on `spec/SI-022-crisis-response-slice-2026-05-21` branch off main at `fab0615` (post-P-038 merge). v0.1 commit `e7a7ebb`. v0.2 commit `c2b9e15`. v0.3 commit `f4001d2`. v0.4 commit `6ec0cc9`. v0.5 commit `18ef338`. v0.6 commit `595db3c`. v0.7 commit `0e287b5`. v0.8 commit `e34bf69`. v0.9 commit `adafe4b`. v0.10 commit `88af316`. v0.11 commit `91ebc7c`. v0.12 commit `bef4682`. v0.13 commit `0db543b`. v0.14 commit `ff19084`. v0.15 commit `e20b00a`. v0.16 commit `44b283b`. v0.17 commit `fcded14`. v0.18 commit `37ae5ea`. v0.19 commit `34ea3af`. v0.20 commit `b210fa0`. v0.21 commit `72a49c8`. v0.22 commit `f542665`. v0.23 commit `23cad27`. v0.24 commit `1c3bf88`. v0.25 commit `a76ff62`. v0.26 commit `e03ef23`. v0.27 commit `20ce894`. v0.28 commit `c3ff7a7`. v0.29 commit `12bcb0f`. v0.30 commit `2a57218`. v0.31 commit `a1e1060`. v0.32 commit `d6ad512`. v0.33 commit `38f8698`. v0.34 commit `987e2ee`. v0.35 commit `7c22693`. v0.36 commit `43a844a`. v0.37 commit `4a61b24`. v0.38 commit `e2212f9`. v0.39 commit `f2d9b5d`. v0.40 commit `a677e41`. v0.41 commit `9b38c6b`. v0.42 commit `3f94899`. v0.43 commit pending push for R43 verification.

**v0.43 DRAFT 2026-05-21 — R42 closures applied (2 HIGH):**
- **R42 HIGH-1 closed:** removed residual MAX+1 line from STEP 4b comment block; replaced with sweep_cycle_counter UPDATE-RETURNING reference + explicit FULLY SUPERSEDED assertion.
- **R42 HIGH-2 closed:** removed half-committed sweep retry paragraph; clarified SOLE normative recovery contract (STEP 2-5 commit-or-rollback together; post-commit handled by outbox-worker dead-letter).

**v0.42 DRAFT 2026-05-21 — R41 closures applied (2 HIGH + 1 MED):**
- **R41 HIGH-1 closed:** removed live MAX+1 implementation paragraph from Sub-decision 6 STEP 3; replaced with sweep_cycle_counter-only language.
- **R41 HIGH-2 closed:** test 16k rewritten to assert sweep_cycle_id-based values (initial=1, first sweep=2; uniform across all recipients in a single sweep).
- **R41 MED-1 closed:** transaction model clarified — STEP 2-5 single atomic transaction; partial failure rolls back increment too; no "half-committed" sweep state in normative model; post-commit failures handled by outbox-worker dead-letter.

**v0.41 DRAFT 2026-05-21 — R40 closures applied (2 HIGH + 1 MED):**
- **R40 HIGH-1 closed:** sweep_cycle_counter DEFAULT changed 0 → 1 so initial dispatch attempt_sequence=1 + first sweep=2 are coherent across STEP 2/STEP 4b/Sub-decision 6.
- **R40 HIGH-2 closed:** removed residual MAX+1 prose from §4.67 amendment-note; unified contract: attempt_sequence ALWAYS derived from sweep_cycle_counter.
- **R40 MED-1 closed:** ROW_COUNT verification now counts FULL mapping cardinality (including emergency_contact null-principal rows); separate CHECK for principal-id non-null on principal-addressable roles.

**v0.40 DRAFT 2026-05-21 — R39 closure applied (1 HIGH):**
- **R39 HIGH-1 closed:** R38's MAX+1 recomputation was non-deterministic under retry. Extended escalation_obligation with sweep_cycle_counter; sweep transaction atomically increments + RETURNING v_sweep_cycle_id BEFORE fan-out; attempt_sequence = sweep_cycle_id provides deterministic per-logical-sweep identity; ON CONFLICT correctly identifies same-logical-sweep retries; STEP 5 verifies expected ROW_COUNT before committing tier-advance.

**v0.39 DRAFT 2026-05-21 — R38 closure applied (1 HIGH):**
- **R38 HIGH-1 closed:** added normative sweep INSERT statement to Sub-decision 6 STEP 3 with full column list including recipient_principal_id + MAX+1 attempt_sequence + ON CONFLICT idempotency clause. Added CHECK constraint requirement on provider_attempt for recipient_principal_id non-null on principal-addressable roles.

**v0.38 DRAFT 2026-05-21 — R37 closure applied (1 HIGH):**
- **R37 HIGH-1 closed:** R36's recipient_principal_id wrapper-lookup was not backed by inserts. Extended §4.67 amendment-prose with recipient_principal_id UUID NULL column; STEP 4b INSERT populates it; compute_crisis_initial_recipient_mapping + compute_crisis_recipient_mapping output contracts return 4-tuple (channel, recipient_role, recipient_address, recipient_principal_id); explicit per-recipient_role source derivation enumerated. Test 16l extended with principal_id-bound assertions.

**v0.37 DRAFT 2026-05-21 — R36 closures applied (2 HIGH + 1 MED):**
- **R36 HIGH-1 closed:** added "matched provider_attempt's recipient_role MUST map to tier ≥ current escalation_tier" check; lower-tier attempts after advancement RAISE tier_ownership_below_current_tier.
- **R36 HIGH-2 closed:** removed raw recipient_address equality; extended provider_attempt with recipient_principal_id (immutable JWT-subject id) populated at dispatch; wrapper lookup is principal_id-bound.
- **R36 MED-1 closed:** reordered tests 16a-l sequential. Test 16l extended with negative variants for R36 HIGH-1/HIGH-2.

**v0.36 DRAFT 2026-05-21 — R35 closure applied (1 HIGH):**
- **R35 HIGH-1 closed:** R34 wrapper tier parameter was caller-controlled — care-team responder could pass 'regulatory' to skip escalation pressure. Removed caller-supplied tier param from both wrappers; tier is now DERIVED inside the SECURITY DEFINER wrapper from JWT-bound principal's recipient_role in canonical provider_attempt row. RAISES tier_ownership_unauthorized if no eligible row exists. Added test 16l (positive + negative tier-ownership authorization variants).

**v0.35 DRAFT 2026-05-21 — R34 closures applied (2 HIGH):**
- **R34 HIGH-1 closed:** test 16k contradicted R29/R30 MAX+1 contract. Rewrote: first sweep MUST INSERT new provider_attempt rows with attempt_sequence=MAX+1 for already-dispatched recipients; ON CONFLICT for worker-retry only.
- **R34 HIGH-2 closed:** acknowledge/respond wrappers extended to take tier parameter + set `escalation_tier = GREATEST(escalation_tier, acknowledging_tier)`. Prevents post-ack timer from advancing from stale care_team after R26 immediate higher-tier dispatch + higher-tier acknowledgement.

**v0.34 DRAFT 2026-05-21 — R33 closure applied (1 HIGH):**
- **R33 HIGH-1 closed:** compute_crisis_recipient_mapping source list omitted emergency_contact_channel after R31/R32 introduced it. Added to source list + extended clinical_on_call target_tier branch description to explicitly enumerate emergency_contact tuple on tenant-configured channel.

**v0.33 DRAFT 2026-05-21 — R32 closures applied (2 HIGH):**
- **R32 HIGH-1 closed:** added Part C to deployment preflight + 3rd assertion to runtime validation; emergency_contact_channel rule now enforced at all 3 layers (not just TLC-CRISIS-003).
- **R32 HIGH-2 closed:** replaced all SMS-hardcoded emergency_contact routing language with tenant-configurable `crisis.emergency_contact_channel`; updated routing tree step 4, OQ6 (c), Sub-decision 5 SQL comment.

**v0.32 DRAFT 2026-05-21 — R31 closure applied (1 HIGH):**
- **R31 HIGH-1 closed:** emergency-contact dispatch could be silently skipped when tenant has emergency_contact_share consent enabled but no configured emergency_contact_channel. Added 5th tenant config key crisis.emergency_contact_channel; added 3rd rule set to enforcement (preflight + TLC-CRISIS-003 + runtime) requiring emergency_contact_channel non-null AND in fanout_channels[] IFF emergency_contact_consent_enabled=true.

**v0.31 DRAFT 2026-05-21 — R30 closures applied (1 CRITICAL + 1 HIGH):**
- **R30 CRITICAL-1 closed:** STEP 4b had a duplicate trailing FROM clause after the statement terminator (non-executable PostgreSQL). Removed; STEP 4b is one complete INSERT...SELECT...FROM...ON CONFLICT...DO NOTHING statement.
- **R30 HIGH-2 closed:** Sub-decision 5 idempotency contract prose still said initial-dispatch + first-sweep collide and are no-op'd, contradicting R29 MAX+1 rule. Rewrote: ON CONFLICT is for worker-retry idempotency ONLY; sweep tier-advance + recheck compute MAX+1 so escalation-time re-notification is NEVER suppressed.

**v0.30 DRAFT 2026-05-21 — R29 closures applied (2 HIGH):**
- **R29 HIGH-1 closed:** STEP 4b SQL had ON CONFLICT misplaced before FROM clause. Rewrote canonical INSERT ... SELECT ... FROM ... ON CONFLICT ... DO NOTHING ordering.
- **R29 HIGH-2 closed:** attempt_sequence=1 across initial + first-sweep would silently no-op escalation-time recipients already dispatched at detection. Changed contract: attempt_sequence INCREMENTS on EVERY tier-advance + every final-tier recheck via MAX+1 per-recipient lookup. Initial=1; tier-advance=N+1 for already-dispatched, =1 for net-new; rechecks=N+1. Escalation-time re-notification GUARANTEED.

**v0.29 DRAFT 2026-05-21 — R28 closure applied (1 HIGH):**
- **R28 HIGH-1 closed:** R27 idempotency key referenced provider_attempt.crisis_event_id which doesn't exist on P-027 §4.67 baseline schema. Extended provider_attempt with crisis_event_id UUID NOT NULL + composite FK to crisis_event at P-040 CDM follow-on; created canonical UNIQUE constraint name; updated every provider_attempt INSERT to populate crisis_event_id + use ON CONFLICT ON CONSTRAINT idempotency_uk DO NOTHING.

**v0.28 DRAFT 2026-05-21 — R27 closure applied (1 HIGH):**
- **R27 HIGH-1 closed:** provider_attempt idempotency contract added. UNIQUE(tenant_id, crisis_event_id, channel, recipient_role, recipient_address, attempt_sequence); sweep tier-advance uses ON CONFLICT DO NOTHING for already-dispatched recipients; final-tier recheck increments attempt_sequence for intentional re-notification pressure.

**v0.27 DRAFT 2026-05-21 — R26 closure applied (1 HIGH):**
- **R26 HIGH-1 closed:** R25's "STEP 4b target_tier='care_team' only" delayed high-urgency recipients (clinical_on_call/emergency_contact/operator_escalation) until first sweep tier-advance. Fix: split into TWO functions — `compute_crisis_initial_recipient_mapping(crisis_event_id, severity, regulatory_reporting)` for STEP 4b initial dispatch returning all Sub-decision 3 eligible recipients; `compute_crisis_recipient_mapping(..., target_tier)` retained for Sub-decision 6 sweep tier-advance additions. Updated test 16k to assert all-eligible-at-detection per severity/consent/regulatory_reporting.

**v0.26 DRAFT 2026-05-21 — R25 closure applied (1 HIGH):**
- **R25 HIGH-1 closed:** Sub-decision 5 STEP 4b call used 2-arg `compute_crisis_recipient_mapping(v_crisis_event_id, v_severity)` while R24 + Sub-decision 6 use 3-arg with target_tier. Updated to 3-arg `(v_crisis_event_id, v_severity, 'care_team')` for initial care-team-tier fan-out; explicit "every normative call site MUST pass non-null target_tier". Added test 16k for initial-fan-out target_tier='care_team' assertion. Test count 26 → 27; sub-cluster 16a-16j → 16a-16k.

**v0.25 DRAFT 2026-05-21 — R24 closure applied (1 HIGH):**
- **R24 HIGH-1 closed:** compute_crisis_recipient_mapping function contract did not include operator_escalation source keys. Extended source list + explicit per-target_tier branch contract enumerating outputs (care_team → care-team tuples; clinical_on_call → 1 tuple + emergency_contact IFF consent grant; regulatory → exactly 1 operator_escalation tuple).

**v0.24 DRAFT 2026-05-21 — R23 closure applied (1 HIGH):**
- **R23 HIGH-1 closed:** enforcement points 1-3 still scoped to regulatory_reporting=true only. Split into Part A (every-tenant always-mandatory: fanout_channels[] + clinical_on_call_channel) + Part B (regulatory_reporting=true conditional: operator_escalation keys) at all three enforcement layers (preflight + static analyzer + runtime).

**v0.23 DRAFT 2026-05-21 — R22 closure applied (1 HIGH):**
- **R22 HIGH-1 closed:** OQ4 enforcement contract only required clinical_on_call_channel on regulatory_reporting=true tenants. Tightened: fanout_channels[] + clinical_on_call_channel required on EVERY tenant (clinical_on_call_channel MUST be in fanout_channels[]); operator_escalation keys remain conditional on regulatory_reporting=true only. Added test 16j (negative-config: missing clinical_on_call_channel on regulatory_reporting=false tenant MUST be rejected by preflight + TLC-CRISIS-003 + runtime). Test count 25 → 26 assertions; sub-tests 16a-16i → 16a-16j.

**v0.22 DRAFT 2026-05-21 — R21 closures applied (1 HIGH + 1 MED):**
- **R21 HIGH-1 closed:** STEP 5 still used non-tenant-aware next_tier(escalation_tier, severity). Rewrote STEP 5 to use tenant-aware `next_tier(current_tier, severity, v_regulatory_reporting)` everywhere (escalation_tier advance + undeliverable_deadline CASE + final_tier_exhausted_at detection); v_regulatory_reporting read ONCE from tenant_config and reused for STEP 3 + STEP 5.
- **R21 MED-1 closed:** test 16i missing from CI gate list. Updated to "17 base + 16a-16i (9 sub-tests) = 25 individual assertions"; CI gate lists 16i; test 16g scoped to regulatory_reporting=true.

**v0.21 DRAFT 2026-05-21 — R20 closure applied (1 HIGH):**
- **R20 HIGH-1 closed:** next_tier() function was not tenant-aware. For regulatory_reporting=false tenants, the unconditional clinical_on_call → regulatory advancement for life-threatening severity would have routed crises into a regulatory tier with no configured operator_escalation recipient. Made next_tier(current_tier, severity, regulatory_reporting) tenant-aware; clinical_on_call → regulatory requires regulatory_reporting=true. Added test 16i for regulatory_reporting=false life-threatening final-tier-at-clinical_on_call path.

**v0.20 DRAFT 2026-05-21 — R19 closure applied (1 HIGH):**
- **R19 HIGH-1 closed:** OQ4 R18 operator_escalation keys were not explicitly required to be non-null on regulatory_reporting=true tenants. OQ4 enforcement contract added forbidding all 4 crisis keys (fanout_channels[] + clinical_on_call_channel + operator_escalation_channel + operator_escalation_recipient) from being empty/null on regulatory_reporting=true tenants. operator_escalation_channel MUST be in fanout_channels[]. Three enforcement points: deployment preflight DO block + extended TLC-CRISIS-003 static-analyzer rule + wrapper runtime validation in record_crisis_initiation().

**v0.19 DRAFT 2026-05-21 — R18 closures applied (1 HIGH + 1 MED):**
- **R18 HIGH-1 closed:** regulatory tier was modeled as downstream-only consumer but R16 required final-tier recheck fan-out. Introduced `operator_escalation` recipient_role at regulatory tier (platform-operator on-call); added 2 tenant config keys to OQ4 (`crisis.operator_escalation_channel` + `crisis.operator_escalation_recipient`); compute_crisis_recipient_mapping(..., 'regulatory') returns the operator_escalation tuple for non-empty fan-out. Adverse-Event/regulatory-authority downstream notification remains separate via Cat A audit.
- **R18 MED-1 closed:** test count "17 (with 16 expanded into 16a-16d)" contradicted enumerated 16a-16h. Updated to "17 base entries with 16 expanded into 16a-16h"; added explicit CI gate language enumerating all 24 individual assertions (15 base + 8 sub-tests + 1 benchmark) required to PASS.

**v0.18 DRAFT 2026-05-21 — R17 closure applied (1 HIGH):**
- **R17 HIGH-1 closed:** Sub-decision 5 still embedded a stale pre-R13 inline sweep SQL summary describing next_tier=NULL as terminal exclusion (contradicted R13/R16 final-tier preservation in Sub-decision 6). Removed the stale embedded SQL; replaced with a SHORTENED cross-reference block to Sub-decision 6 as the SINGLE normative SQL contract. Anti-drift discipline: Sub-decision 6 is sole authoritative SQL contract.

**v0.17 DRAFT 2026-05-21 — R16 closure applied (1 HIGH):**
- **R16 HIGH-1 closed:** final-tier exhaustion/recheck path passed NULL next_tier to compute_crisis_recipient_mapping → audit-only rechecks with no recipient fan-out at terminal-risk state. Fix: STEP 3 now uses explicit `target_tier := COALESCE(next_tier(escalation_tier, severity), escalation_tier)` — pre-exhaustion sweeps target next tier; final-tier exhaustion/recheck sweeps target current final tier (continuing pressure on terminal responsible tier). Added test 16h for non-imminent + imminent final-tier fan-out; expanded 16g to assert regulatory-tier fan-out.

**v0.16 DRAFT 2026-05-21 — R15 closure applied (1 HIGH):**
- **R15 HIGH-1 closed:** tests #9 + #10 still asserted pre-R13 terminal-tier behavior — for non-imminent/imminent crises (final tier = clinical_on_call), tests blessed permanent suppression of unresolved final-tier rechecks. Rewrote both tests to match R13/R14 normative rule: final-tier exhaustion PRESERVES escalation_tier at terminal value; final_tier_exhausted_at set once; INTERVAL_final_tier_recheck_window schedules continuing rechecks with is_final_tier_recheck=true; ONLY record_crisis_resolution() terminalizes via escalation_tier=NULL. Added test #10 (e)/(f)/(g) explicit per-severity assertions for non-imminent/imminent/life-threatening final-tier-exhausted-but-unresolved behavior.

**v0.15 DRAFT 2026-05-21 — R14 closure applied (1 HIGH):**
- **R14 HIGH-1 closed:** worked example sweep #3 still set escalation_tier=NULL (contradicted R13). Rewrote example: sweep #3 preserves escalation_tier='regulatory' + sets final_tier_exhausted_at + emits one-time crisis.final_tier_reached Cat A + schedules INTERVAL_final_tier_recheck_window=5min; sweep #4 shows recheck cadence with is_final_tier_recheck=true; only record_crisis_resolution() terminalizes.

**v0.14 DRAFT 2026-05-21 — R13 closure applied (1 HIGH):**
- **R13 HIGH-1 closed:** final-tier exhaustion incorrectly conflated tier-exhausted-but-unresolved with resolved-terminal. Fix: at final-tier, escalation_tier PRESERVED at terminal value; new column `final_tier_exhausted_at` tracks first exhaustion; new `crisis.final_tier_reached` Cat A audit emitted once (AUDIT 7 → 8 actions; 6 Cat A → 7 Cat A); subsequent re-sweeps fire on INTERVAL_final_tier_recheck_window emitting standard `crisis.no_acknowledgement_escalation` Cat A with `is_final_tier_recheck=true`. ONLY record_crisis_resolution() terminalizes. Added test 16g.

**v0.13 DRAFT 2026-05-21 — R12 closures applied (2 HIGH):**
- **R12 HIGH-1 closed:** Sub-decision 6 normative SQL block still had R10 predicate `current_state IN ('detected', 'escalated')`; updated to R11+R12 `current_state IN ('detected','escalated','acknowledged','responded')` + inline comments enumerating the 4 valid escalated-to triples.
- **R12 HIGH-2 closed:** per-row STEP 1 algorithm only handled detected + escalated reason switching; rewrote as four-way mapping table + implementer pseudocode CASE statement (detected→no_acknowledgement_timeout / escalated→tier_progression_no_acknowledgement / acknowledged→acknowledged_no_response_timeout / responded→responded_no_resolution_timeout).

**v0.12 DRAFT 2026-05-21 — R11 closure applied (1 HIGH):**
- **R11 HIGH-1 closed:** R10's terminalization-on-acknowledge created an unbounded acknowledged-without-response hole. Revised wrapper contract: only `record_crisis_resolution()` terminalizes; acknowledge + respond wrappers reset deadline + escalation_key=NULL; escalation_tier unchanged. Added 2 new sweep-driven transition triples (acknowledged → escalated / acknowledged_no_response_timeout; responded → escalated / responded_no_resolution_timeout). Sweep eligibility expanded to all non-resolved states. Triple count 9 → 11. Tests 16 sub-cluster expanded 16a-d → 16a-f.

**v0.11 DRAFT 2026-05-21 — R10 closure applied (1 HIGH):**
- **R10 HIGH-1 closed:** no-ack sweep didn't exclude acknowledged/resolved lifecycle states; safety-critical wedging risk on already-resolved crises. Two-layer fix: (1) terminalization contract — three lifecycle wrappers (acknowledge/respond/resolve) MUST set escalation_tier=NULL atomically on the obligation row; BEFORE UPDATE trigger only permits sweep-cycle advances or terminalization. (2) sweep predicate adds LATERAL JOIN to crisis_event_lifecycle_transition filtering current_state ∈ {detected, escalated} (defense-in-depth backstop). Added tests 16a-d (terminalization-per-wrapper + lifecycle-eligibility backstop).

**v0.10 DRAFT 2026-05-21 — R9 closure applied (1 HIGH):**
- **R9 HIGH-1 closed:** Sub-decision 4 lifecycle diagram still enumerated only 8 transition triples (omitted `escalated → escalated`). Added the 9th triple to Sub-decision 4 diagram + updated "9 allowed triples" count with R9 closure cross-reference to §6 + Sub-decision 6 STEP 1. All three normative state-machine locations now enumerate the same 9 triples.

**v0.9 DRAFT 2026-05-21 — R8 closure applied (1 HIGH):**
- **R8 HIGH-1 closed:** multi-tier sweep tries to INSERT `escalated → escalated` lifecycle transitions but state-machine transition triples table only permitted `detected → escalated` and `responded → escalated`; subsequent tier advances (sweep #2, #3) would fail CHECK + roll back, wedging tier progression — the same R6 HIGH-1 failure mode resurfaced via state-machine not escalation_key. Fix: added 9th triple `escalated → escalated` with reason `tier_progression_no_acknowledgement`; updated Sub-decision 6 STEP 1 normative contract to switch reason by current state ('no_acknowledgement_timeout' from 'detected', 'tier_progression_no_acknowledgement' from 'escalated').

**v0.8 DRAFT 2026-05-21 — R7 closures applied (1 HIGH + 1 MED):**
- **R7 HIGH-1 closed:** Sub-decision 6 prose still specified pre-R6 one-shot escalation_key model (only Sub-decision 5 SQL comments had the tier-cycle resettable model). Rewrote Sub-decision 6 as the authoritative normative tier-cycle contract — sweep predicate adds `escalation_tier IS NOT NULL` terminal exclusion; per-row atomic 5-step closure with explicit STEP 5 reset; canonical next_tier() + INTERVAL_for_severity_and_tier() definitions; multi-tier worked example through 3 sweep cycles ending in terminal exclusion.
- **R7 MED-1 closed:** tests #9 + #10 in Sub-decision 7 still asserted pre-R6 one-shot idempotency. Replaced with tier-cycle progression assertions: each tier transition fires in sequence; in-flight cycle re-runs are no-op (claim lock); post-reset pre-deadline re-runs are no-op (deadline not expired); post-next-deadline re-runs DO advance; terminal exclusion.

**v0.7 DRAFT 2026-05-21 — R6 closures applied (2 HIGH + 1 MED):**
- **R6 HIGH-1 closed:** escalation_key one-shot model suppressed all subsequent tier timeouts. Restructured Sub-decision 6 sweep as TIER-CYCLE resettable: per-row 5-step closure advances escalation_tier + resets escalation_key=NULL + computes new undeliverable_deadline; sweep predicate excludes terminal-tier rows where escalation_tier IS NULL.
- **R6 HIGH-2 closed:** STEP 1 Cat A emit + STEP 2 row inserts restructured as ATOMIC single BEGIN...COMMIT transaction via canonical FLOOR-020 audit-co-transactional pattern; on rollback no Cat A row commits + ERROR surfaced + I-019 preserved.
- **R6 MED-1 closed:** benchmark test #16 added to Sub-decision 7 enumerated list with workload (1000 concurrent INSERTs, 50 tenants, 100 req/s sustained 10s) + threshold (p99 ≤ 180ms across 5 runs) + CI gate; count updated to "16 merge-blocking integration tests".

**v0.6 DRAFT 2026-05-21 — R5 closures applied (1 HIGH + 1 MED):**
- **R5 HIGH-1 closed:** STEP 2c escalation_obligation INSERT row shape was under-specified for Sub-decision 6 sweep. This SI extends P-027 §4.68 row shape with `crisis_event_id` (composite FK), `severity` (enum), `escalation_tier` (enum {care_team, clinical_on_call, regulatory}). Sweep contract explicit: SELECT predicate `now() > undeliverable_deadline AND escalation_key IS NULL FOR UPDATE SKIP LOCKED`; 5-step per-row closure (lifecycle transition INSERT + escalation_key UPDATE one-way mutable + escalation_tier advance via next_tier() function + recipient fan-out via compute_crisis_recipient_mapping + Cat A audit emit).
- **R5 MED-1 closed:** added explicit STEP 2 per-operation latency contract — Cat A emit + 2a-2d INSERTs with p50/p99 budgets + indexes/constraints + degraded behavior; STEP 1+2+3 cumulative p99 ≤ 180ms (under 200ms patient-surface SLO). Added merge-blocking benchmark test #16 (1000 concurrent crisis_event INSERTs across 50 tenants under simulated contention). Explicit fail-closed posture: any STEP 2 sub-step failure rolls back the transaction + surfaces ERROR + the card does NOT render against partial state.

**v0.5 DRAFT 2026-05-21 — R4 closures applied (3 HIGH):**
- **R4 HIGH-1 closed:** Sub-decision 3 had residual "executed at Sub-decision 2 STEP 2c-2d ... synchronous with STEP 2" text that contradicted R3 HIGH-1 closure. Rewrote routing tree as ELIGIBILITY-only with explicit execution delegation to Sub-decision 2 STEP 4 (recipient fan-out) + STEP 5 (CCR + hydration). No STEP 2c-2d / "synchronous with STEP 2" language remains for logical recipients 2-5.
- **R4 HIGH-2 closed:** Sub-decision 3 had stale "CCR resolvers at STEP 4 + hydration at STEP 5" mapping pre-R3 renumbering. Corrected to canonical post-R3 STEP 4 = dispatch setup, STEP 5 = CCR + hydration.
- **R4 HIGH-3 closed (safety-critical):** stuck STEP 4 outbox row would have denied the no-acknowledgement timer ever firing because escalation_obligation INSERT was at STEP 4c. **Moved escalation_obligation INSERT into STEP 2c (synchronous, in same transaction as Cat A audit + crisis_event INSERT)** so the deadline source-of-truth row is guaranteed-armed; the Sub-decision 6 no-ack sweep now always has a row to find regardless of STEP 4 worker progress. STEP 2 sub-steps 2a (crisis_event) + 2b (lifecycle_transition) + 2c (escalation_obligation) + 2d (crisis_dispatch_outbox enqueue) all run in a single transaction; STEP 4 is recipient fan-out only.

**v0.4 DRAFT 2026-05-21 — R3 closures applied (1 HIGH + 1 MED):**
- **R3 HIGH-1 closed:** dispatch setup at STEP 2c-2e (synchronous; ahead of STEP 3 card render) violated the 200ms patient-surface SLO under many recipients, transient DB contention, or provider-channel unavailability. Fix: moved dispatch setup to a new STEP 4 asynchronous bounded outbox worker invoked via a same-tx outbox row inserted at STEP 2 (matches Consent slice domain-event same-tx outbox pattern from P-027 §4.66+); STEP 1+2+3 only is the synchronous patient-surface path (Cat A emit + crisis_event INSERT + card render); the 200ms SLO now applies to STEP 1-3 exclusively. STEP 4 worker emits `crisis.dispatch_attempt_failed` Cat C on provider failures + the no-ack sweep at Sub-decision 6 produces `crisis.no_acknowledgement_escalation` Cat A on deadline expiry. Outbox at-least-once + idempotent retry + dead-letter SLO captures stuck rows.
- **R3 MED-1 closed:** SQL literal channel-class enumeration (sms+email+in_app_push) would have unconditionally inserted dispatch_ledger rows for channels the tenant has not configured. Fix: STEP 4a INSERTs are SELECT-driven from `unnest(tenant.crisis.fanout_channels[])`; STEP 4b INSERTs are SELECT-driven from a STABLE function `compute_crisis_recipient_mapping(crisis_event_id, severity)` joining tenant config + care_team + consent_grant + severity. Deployment preflight asserts `cardinality(tenant.crisis.fanout_channels[]) > 0` (I-019 platform-floor); worker FAILS CLOSED if empty.

**v0.3 DRAFT 2026-05-21 — R2 closures applied (1 HIGH + 1 MED):**
- **R2 HIGH-1 closed:** Sub-decision 3 routing tree still had the old "render card → Cat B emit → crisis_event INSERT" sequence as the canonical decision tree, contradicting Sub-decision 2's STEP 1-5 emit ordering closure from R1. Implementer following Sub-decision 3 could reintroduce R1 HIGH-1 FLOOR-020 coupling (Cat B/resource lookup before durable crisis_event creation). Fix: rewrote Sub-decision 3 to specify LOGICAL recipient routing only (which recipients receive dispatch under what severity/consent/regulatory_reporting conditions); added explicit execution-order assertion deferring entirely to Sub-decision 2 STEP 1-5; added authority-of-each-Sub-decision anchor ("Sub-decision 2 is authoritative on emit ordering; Sub-decision 3 is authoritative on logical routing destinations only"). The routing tree is now unambiguously orthogonal to the emit-path independence model.
- **R2 MED-1 closed:** §1 + §3 audit category tally said "5 Cat A + 0 Cat B + 2 Cat C" but the §3 table actually lists 6 Cat A + 0 Cat B + 1 Cat C (my R1 MED-1 closure double-counted the Cat A move). Corrected tally arithmetic across §1 + §3 + the R1 MED-1 log entry. Also fixed §8 operational obligations row "30 seconds of `crisis.no_acknowledgement_escalation` Cat B emit" — R1 closure moved this action to Cat A but §8 SLO source text was missed in the sweep; corrected to Cat A. Audit category registry now internally consistent: 6 Cat A + 0 Cat B + 1 Cat C across §1, §3, §8, Sub-decision 6.

— Claude (Opus 4.7, 1M context), SI-022 Crisis Response Slice Spec v0.1 DRAFT authored 2026-05-21 per Master Completion Plan v1.0 Track 1 pilot-viable scope item 4 + established post-P-029 SI authoring pattern + CLAUDE.md autonomous-work + dual-recommendation + two-pass + auto-proceed + hard-floor item 6 disciplines + proactive application of all lessons-learned from P-031 through P-038 cycles. R1 Codex review queued.
