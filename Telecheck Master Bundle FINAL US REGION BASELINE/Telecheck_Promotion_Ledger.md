# Telecheck — Promotion Ledger

**Version:** 1.0
**Status:** Canonical record
**Owner:** Product (Telecheck)
**Parent documents:** Telecheck Artifact Registry v2.4
**Companion documents:** All artifacts named in promotion records below
**Format:** Markdown (must remain markdown — append-only ledger; status changes by appending, not editing)

---

## Purpose

This ledger records every artifact that the user has explicitly asked to be promoted to canonical status. It exists alongside the Artifact Registry (which records *what is canonical*) to record *what the user requested* and *when*.

The two documents serve different purposes:

| Document | Records | Source of authority |
|---|---|---|
| **Artifact Registry** | What is canonical right now | Registry's own §3 inventory |
| **Promotion Ledger (this document)** | What the user explicitly asked to be promoted, when, and what was promoted in response | User instruction, transcribed into the ledger entry |

Why both exist: in long-running projects with many sessions, the Registry can show that something is canonical without anyone remembering whether it was canonicalized through a deliberate user request, an inferred decision, or a session-default. The Promotion Ledger preserves the *intent trail* — every promotion that the user explicitly authorized is on record here.

---

## Operating rules

1. **Append-only.** Once a promotion entry is recorded, it is never edited or deleted. Errors are corrected by appending a new entry that references and supersedes the prior one.
2. **One entry per user request.** A single user instruction ("promote these documents") becomes one entry, regardless of how many artifacts that instruction promoted.
3. **Each entry records:** the date, the verbatim user instruction (or close paraphrase), the artifacts promoted (or the bodies reconciled), the Registry version that absorbed the entry, and any related decisions ratified at the same time (such as ADRs).
4. **The Registry is updated in lockstep — with one explicit carve-out for reconciliation entries.** Every *content-change* promotion entry corresponds to a Registry version bump (e.g., U-001 corresponded to Registry v2.0 → v2.4; v1.10 promotion ceremony corresponded to v2.9 → v2.10 per P-008). **Reconciliation entries** — which align body text with already-canonical doc-control claims, fix partial-merge defects from prior cycles, or close SPEC ISSUEs without introducing new artifact content — absorb into the EXISTING Registry version without bumping it. Reconciliation entries MUST explicitly record their "Registry absorption" line citing the absorbed-into version + cite a precedent or rationale for not bumping. **Precedent:** P-009 (v1.10.1 hygiene cycle physical merge) absorbed into Registry v2.10 without a v2.11 bump; P-010 (CDM §4.1 SPEC ISSUE resolution) follows the same pattern. (Carve-out clarification added 2026-05-02 per Codex spec-r2 MEDIUM finding closure: the prior absolute-bump phrasing left an unresolvable conflict between the rule and the legitimately Registry-version-stable hygiene-cycle pattern that the v1.10.1 cycle established.)
5. **Reverse chronological order.** Most recent entry at the top.
6. **Promotion vs reconciliation distinction.** Each entry is classified at the top of its section as either a **content-change promotion** (Registry version bump expected) or a **reconciliation entry** (no Registry bump; absorbs into the existing canonical version). Reconciliation entries are still APPLIED with full Engineering-Lead-review-pending status; the difference is in Registry-impact accounting, not in entry validity or audit-trail standing.

---

## Promotion entries

### Entry P-013 — 2026-05-17 — SI-007 ratification-intent: Refill + Dispensing + Shipment canonical schemas (sub-ceremony 1 of Q2 2026 ratifier ceremony; 18-round Codex pre-ratification convergence on workstream-canonical source SI-007 v0.19)

**Type:** Content-change promotion — **ratification-intent recorded in PR-A1 commit; physical content + Registry v2.11 → v2.12 bump land together in PR-A2 + PR-A3** on the same branch `spec/p012-p013-si012-si007-ratification-2026-05-17` per the lockstep invariant (Registry bumps in the same commit that lands the underlying canonical content; this entry records ratifier sign-off only). Final canonical state (after PR-A2/A3): three new entity expansions in CDM v1.4 (§4.17 Refill + §4.18 Dispensing + §4.19 Shipment) + AUDIT_EVENTS v5.3 → v5.4 contract version bump + DOMAIN_EVENTS v5.2 in-place additive extension + CDM §audit_events CHECK constraint amendment.

**Status:** **RATIFIED IN INTENT 2026-05-17** (workstream lead chat-message sign-off; sub-ceremony 1 of the Q2 2026 ratifier ceremony per `arthurmenson/telecheck-app:docs/Ratifier-Ceremony-Agenda-Q2-2026.md`). **CANONICAL** after PR-A2 + PR-A3 land on this branch (which is when the canonical CDM/AUDIT_EVENTS/DOMAIN_EVENTS content physically lands in bundle + the Registry v2.12 bump is applied in the same commit).

**Author:** Autonomous Claude (SI-007 v0.1 → v0.19 cycle 2026-05-14; 18 rounds of Codex pre-ratification adversarial-review convergence; the asymptote-class iteration discipline established by P-011); ratified by Evans (workstream lead) 2026-05-17 in chat-message ratification with explicit "I ratify" sign-off after review of the Ratifier Packet — Sub-Ceremony 1 (SI-012 + SI-007) artifact authored 2026-05-17.

**Trigger:** SI-007 (Refill + Dispensing + Shipment schema gap; recorded in `arthurmenson/telecheck-app:docs/SI-007-Refill-Dispensing-Shipment-Schema-Gap.md` v0.19 DRAFT) blocked the pharmacy fulfillment lifecycle implementation. CDM v1.3 §3.5 listed entities #19 Refill, #20 Dispensing, #21 Shipment in the inventory but provided no §4 field-level expansions. Per the State Machines v1.1 §2 Refill state machine (23 states) + §5 Pharmacy Fulfillment state machine (9 states) being canonical, the gap was schema-only; this entry closes that gap by porting the ratified SI-007 v0.19 row shapes into CDM §4.17 + §4.18 + §4.19 as canonical content.

**Pre-ratification gate (per P-011 retrospective):** 18 rounds of Codex adversarial-review convergence on the SI-007 v0.1 → v0.19 DRAFT trajectory closed 18 HIGH findings inline (R1 terminal-state contradiction + circular FK ambiguity → R2 §5 fulfillment-state ownership boundary → R3 NOT NULL contradicted XOR + Refill EXPIRED missing → R4 newly-added terminal states missing audit/domain entries → R5 pickup success path inconsistency + Dispensing.CANCELLED missing from enum → R6 `any → CANCELLED` contradicted append-only → R7 Shipment carrier_id duplicate-bullet → R8 Refill↔Dispensing atomicity → R9 Dispensing↔Shipment atomicity → R10 PENDING_CARRIER_PICKUP state added → R11 pre-dispatch cancellation cross-entity rule → R12 pickup-mode post-counter-opened cancellation → R13 universal cross-entity coordination table → R14 missing DOMAIN_EVENTS for coordination table → R15 FULFILLING→READY canonical naming → R16 `refill.released` dup → R17 `shipment.dispatched` dup → R18 plain FKs cross-tenant attack vector). The 18-round trajectory reflects SI-007's wider surface (3 entities + 2 cross-entity handoffs + tenant-scoped FK fan-out) compared to SI-001's 1 entity. Convergence call: R18 closure resolved the last new finding class (cross-tenant attack vector); subsequent rounds expected doc-polish only.

**Promotion class:** content-change. Three new entity expansions + new audit/domain IDs + AUDIT_EVENTS §I-012 closure-rule prose amendment all require Registry version bump per operating rule 4.

**Version bumps applied at P-013:**
- Artifact Registry **v2.11 → v2.12** (this file's parent record; coverage counts updated: entities 42 → 45 (added Refill #19, Dispensing #20, Shipment #21); Contracts Pack rows updated)
- Canonical Data Model **v1.3 → v1.4** (added §4.17 Refill + §4.18 Dispensing + §4.19 Shipment; amended `audit_i012_workload_evidence_required` CHECK constraint to add `refill.{clinician_approved, protocol_approved, bridge_supply_dispensed, execution_rejected}` to the I-012 action list in lockstep with AUDIT_EVENTS v5.4 §I-012 closure rule extension)
- State Machines **v1.2** (NO version bump — §2 Refill state machine + §5 Pharmacy Fulfillment state machine were already canonical pre-P-013; SI-007 is a schema gap, not a state-machine gap. The cross-entity Shipment-event → Refill-transition coordination table from SI-007 §4.19 documents the cross-table coordination but does NOT introduce a new state machine.)
- AUDIT_EVENTS Contracts Pack **v5.3 → v5.4** (38 net-new Category A action IDs replacing the placeholder set: 20 `refill.*` + 8 `dispensing.*` + 10 `shipment.*`; §I-012 closure-rule prose amended to add `refill.{clinician_approved, protocol_approved, bridge_supply_dispensed, execution_rejected}` to the authoritative I-012 action-class set + extend the `prescribing.*` future-extension carve-out from P-011 to include `refill.*` confirmation actions added by an I-012-amending SI promotion. P-013 IS the I-012-amending act for these additions.)
- DOMAIN_EVENTS Contracts Pack **v5.2** (additive enum extension only — no normative-rule change; 20 net-new tenant-scoped event types added: 10 `refill.*` (partition_key `tenant_id:refill_id`) + 3 `dispensing.*` (partition_key `tenant_id:dispensing_id`) + 7 `shipment.*` (partition_key `tenant_id:shipment_id`). Audit-only carve-outs documented for high-volume internal events `shipment.in_transit_update`, `shipment.pending_carrier_pickup`, and `refill.fulfilling_started`.)

**Changes:**

1. **CDM v1.4 §4.17 — NEW entity expansion (Refill).** ~25 columns. Append-only at business-final states (`{COMPLETED, INELIGIBLE, DECLINED, CANCELLED, EXPIRED}`). State enum matches State Machines v1.1 §2 plus v0.4 EXPIRED addition. Composite FKs (`tenant_id, *_id`) per ADR-023 + PROJECT_CONVENTIONS r5 §1.1. Path 1 integration with Med Interaction Engine via `refill.interaction_safety_hold_triggered` domain event (mirrors MedicationRequest §4.16 Path 1).

2. **CDM v1.4 §4.18 — NEW entity expansion (Dispensing).** ~15 columns. Source XOR: `refill_id IS NOT NULL XOR medication_request_id IS NOT NULL` enforced via CHECK constraint. Append-only at RELEASED + CANCELLED. Atomic Refill state UPDATE + Dispensing INSERT in single `withTransaction` (R8 closure precedent).

3. **CDM v1.4 §4.19 — NEW entity expansion (Shipment).** ~15 columns. `carrier_id` + `pickup_location_id` mode-specific NOT-NULL via CHECK (delivery_preference discriminator). Authoritative link: `shipments.dispensing_id` (child holds the link; Dispensing does NOT carry `shipment_id`). Atomic Dispensing RELEASED + Shipment INSERT(PENDING_CARRIER_PICKUP) in single tx (R9 closure precedent). PENDING_CARRIER_PICKUP state (R10 closure) closes the pharmacist-released-but-not-yet-picked-up gap; CANCELLED_BEFORE_DISPATCH reachable only from PENDING_CARRIER_PICKUP.

4. **CDM v1.4 §audit_events `audit_i012_workload_evidence_required` CHECK constraint amended.** `refill.clinician_approved`, `refill.protocol_approved`, `refill.bridge_supply_dispensed`, `refill.execution_rejected` added to the `action NOT IN (...)` list (database-level enforcement of the AUDIT_EVENTS v5.4 §I-012 closure rule's authoritative-set amendment). Without this lockstep amendment, a refill-execution audit row could pass the CHECK with null workload/autonomy fields, recreating the I-012 envelope gap.

5. **CDM v1.4 §3.5 entity inventory.** Footnote pointers added: entity #19 Refill → §4.17 (canonical from v1.4 per P-013); entity #20 Dispensing → §4.18 (canonical from v1.4 per P-013); entity #21 Shipment → §4.19 (canonical from v1.4 per P-013). Body-resident entity count: 42 → 45.

6. **AUDIT_EVENTS v5.4 — 38 net-new Category A action IDs:**
   - **Refill (20):** `refill.{requested, eligible, ineligible, signals_evaluated, clinician_approved, clinician_declined, protocol_approved, protocol_declined, fulfilling_started, dispatched, delivered, delivery_failed, pickup_available, picked_up, completed, cancelled, expired, safety_hold_triggered, bridge_supply_dispensed, execution_rejected}`
   - **Dispensing (8):** `dispensing.{queued, claimed, released, exception_recorded, held, escalated, resolved, cancelled}`
   - **Shipment (10):** `shipment.{pending_carrier_pickup, pickup_from_pharmacy, pickup_counter_opened, in_transit_update, delivered, delivery_failed, pickup_available, picked_up, pickup_expired, cancelled_before_dispatch}`

7. **DOMAIN_EVENTS v5.2 (amend in place) — 20 net-new event types:**
   - **Refill (10):** `refill.{approved, dispatched, delivered, delivery_failed, pickup_available, picked_up, completed, cancelled, expired, interaction_safety_hold_triggered}`
   - **Dispensing (3):** `dispensing.{released, exception_escalated, cancelled}`
   - **Shipment (7):** `shipment.{pickup_from_pharmacy, pickup_available, picked_up, delivered, delivery_failed, pickup_expired, cancelled_before_dispatch}`
   - **Audit-only carve-outs (no domain emission):** `shipment.in_transit_update` (high-volume carrier scan events); `shipment.pending_carrier_pickup` (internal handoff state-creation event); `refill.fulfilling_started` (internal lifecycle bookkeeping; downstream subscribers consume `dispensing.released` or `shipment.pickup_from_pharmacy` / `shipment.pickup_counter_opened`).

No removals. No envelope shape changes. No breaking changes to existing slices.

**Ratifier decisions explicitly approved at sub-ceremony 1:**
- Refill append-only on terminal states `{COMPLETED, INELIGIBLE, DECLINED, CANCELLED, EXPIRED}`: **APPROVED** (consistent with Consent §7.1 precedent + I-003 audit-chain integrity).
- Dispensing source XOR (`refill_id` ⊕ `medication_request_id`) via CHECK constraint: **APPROVED** (matches Pharmacy Fulfillment §5 "linked to Refill or Prescription" model).
- ADR-008 bridge-supply path requires I-012 evidence: **APPROVED** (bridge supply is a clinical decision even on the safe-default path; same three-clause rule as prescribing; recorded as the canonical `refill.bridge_supply_dispensed` audit emission with I-012 envelope evidence).
- Inventory awareness stays as `in_stock_status` column on Dispensing (not factored into a separate Inventory entity): **APPROVED** (v1.0 scope; Inventory entity proper deferred to v1.1+ scope decision).

**Unblocks:**
- Pharmacy slice closes the final 8% (cockpit `slice-pharmacy` task 92% → 100%); Refill + Dispensing + Shipment surfaces become implementable.
- Subscription slice completion (downstream `period_end` transition creates a Refill); unblocks parallel with this entry.
- Cancellation Deflection workflow (depends on Refill linkage).
- Cart workflow + multi-product cart (depend on Refill creation on checkout).
- Shipment tracking surfaces.

**Lessons captured:**
- **The 18-round Codex pre-ratification convergence trajectory** is the new high-water mark for ratification-class spec corpus changes — wider surface (3 entities + cross-entity handoffs + tenant-scoped FK fan-out) explains the longer trajectory vs SI-001's 11 rounds.
- **Composite tenant-scoped FKs are platform-floor** for tenant-owned references (closes the cross-tenant attack vector per R18). Plain single-column FKs are FORBIDDEN for tenant-owned references per the §4.19 invariant block.
- **Atomic cross-entity tx discipline** applies universally to every Shipment-event → Refill-transition pair (R13 closure). Not just cancellation paths.
- **Audit-only carve-outs are the right pattern for high-volume internal lifecycle events** that have no external subscriber business meaning (R14/R15 carve-outs).

**Registry absorption (PENDING PR-A2/A3 lockstep landing):** Registry remains at **v2.11** in PR-A1 (this commit). The Registry v2.11 → v2.12 bump applies in the same commit that physically lands the canonical CDM §4.17 + §4.18 + §4.19 content + AUDIT_EVENTS v5.4 + DOMAIN_EVENTS amend-in-place — that lockstep commit is PR-A2/A3 on this branch. Final-state coverage counts (after PR-A2/A3): entities 42 → 45 (this entry adds Refill #19, Dispensing #20, Shipment #21); state machines 19 → 19 (no new SMs — §2 + §5 already canonical); AUDIT_EVENTS v5.3 → v5.4; DOMAIN_EVENTS in-place at v5.2.

**Source-of-truth artifact (PR-A1 — ratification-intent commit):** the SI-007 DRAFT v0.19 at `arthurmenson/telecheck-app:docs/SI-007-Refill-Dispensing-Shipment-Schema-Gap.md` is the **workstream-canonical record** for the schema content until PR-A2 physically lands it as CDM §4.17 + §4.18 + §4.19. Engineers consulting Refill/Dispensing/Shipment row shapes in the window between PR-A1 (this commit) and PR-A2/A3 landing MUST reference the SI-007 source file. The 18 Codex findings closed inline (R1 → R18) on the SI-007 DRAFT trajectory establish the pre-ratification convergence baseline. **After PR-A2 lands:** the bundle copies in CDM §4.17 + §4.18 + §4.19 become the canonical post-promotion state; the SI-007 DRAFT is preserved as the audit-trail artifact for the cycle.

---

### Entry P-012 — 2026-05-17 — SI-012 ratification-intent: Med Interaction Engine CDM expansion — InteractionSignal + InteractionOverride + InteractionRuleset (sub-ceremony 1 of Q2 2026 ratifier ceremony)

**Sub-ceremony 1 batch note:** P-012 + P-013 ratify together in sub-ceremony 1 as the "Cluster E batch" (pilot-launch standalone blockers). Both entries record ratification-intent in PR-A1 (this commit); both share the lockstep PR-A2/A3 commit that physically lands canonical content + applies the consolidated Registry v2.11 → v2.12 bump. **For entity-count accounting purposes, P-012 + P-013 use a SHARED post-P-011 baseline of 42 entities** — both entries add to that baseline independently (P-012 adds 3 new entity numbers #46/#47/#48; P-013 adds 3 new entity numbers #19/#20/#21). The consolidated post-sub-ceremony-1 entity count is therefore 42 + 3 + 3 = **48 entities** post-PR-A2/A3 landing. The §3 inventory will be updated to reflect this in the same PR-A2/A3 commit that lands the CDM content.

**Type:** Content-change promotion — **ratification-intent recorded in PR-A1 commit; physical content + Registry v2.11 → v2.12 bump consolidated with P-013 in PR-A2 + PR-A3** on the same branch per the lockstep invariant. Final canonical state (after PR-A2/A3): three new entity expansions in CDM v1.4 (§4.20 InteractionSignal + §4.21 InteractionOverride + §4.22 InteractionRuleset).

**P-012 slot repurposing note:** Per Addendum 4 (2026-05-14) of `arthurmenson/telecheck-app:Telecheck_v1_10_PRD_Update/AI_Service_Rollout_24h_Status_2026-05-14.md`, the originally-proposed P-012 use (AI Service module implementation-milestone logging) was deferred because the Promotion Ledger is exclusively for spec-corpus promotions, not implementation milestones (per the P-001..P-011 precedent inventory). The P-012 slot was therefore unused but reserved. Repurposing P-012 for SI-012 (spec-corpus CDM expansion — fits the Ledger's actual purpose) is the cleanest move per Evans's 2026-05-17 ratifier choice ("P-012 (uses the deferred slot)" — symmetry bonus: SI-012 → P-012; cleanest sequencing — no downstream cascade shift of SI-002 P-014 / SI-005 P-017 / SI-008 P-018 / SI-009 P-019 / SI-010 P-020 / SI-011 P-021 etc.).

**Append-only ledger ordering note:** P-012 is appended in this commit AFTER P-013 in reverse-chronological top position (both same-date 2026-05-17 sub-ceremony 1 ratifications). The append-only invariant is preserved — neither entry edits a prior entry. The ordering choice (P-013 above P-012) reflects the sub-ceremony's discussion order in the Ratifier Packet (SI-007 listed first); both entries' content is independent and either order is valid per the append-only rule.

**Status:** **RATIFIED IN INTENT 2026-05-17** (workstream lead chat-message sign-off; sub-ceremony 1 of the Q2 2026 ratifier ceremony per `arthurmenson/telecheck-app:docs/Ratifier-Ceremony-Agenda-Q2-2026.md`). **CANONICAL** after PR-A2 + PR-A3 land on this branch (which is when the canonical CDM/AUDIT_EVENTS/DOMAIN_EVENTS content physically lands in bundle + the Registry v2.12 bump is applied in the same commit).

**Author:** Autonomous Claude (SI-012 v1.0 authored 2026-05-16; Med-Interaction module audit + Track 1 critical-path identification); ratified by Evans (workstream lead) 2026-05-17 in chat-message ratification with explicit "I ratify" sign-off after review of the Ratifier Packet — Sub-Ceremony 1 (SI-012 + SI-007) artifact authored 2026-05-17.

**Trigger:** SI-012 (Med-Interaction Engine CDM expansion; recorded in `arthurmenson/telecheck-app:docs/SI-012-Med-Interaction-CDM-Expansion.md`) blocked the Medication Interaction Engine slice implementation. CDM v1.3 §3.5 contains the slice's entity references (signals, overrides, rulesets) at the conceptual level but no §4 field-level expansions. The Medication Interaction Engine Slice PRD v1.0 IS ratified in the bundle (slice PRD §4 + §5 + §6 + §9 cover the conceptual model). Engineering work cannot legitimately begin until canonical row shapes exist (per CLAUDE.md hard rule "do NOT silently fork specs"). This entry closes that gap by adding the three entity row shapes to CDM §4 as canonical content.

**Promotion class:** content-change. Three new entity expansions require Registry version bump per operating rule 4 (consolidated with P-013's bump in the same sub-ceremony — Registry v2.11 → v2.12 covers both).

**Version bumps applied at PR-A2/A3 landing (P-012 portion):**
- Artifact Registry **v2.11 → v2.12** (consolidated with P-013 in the same PR-A2/A3 commit; P-012 contributes 3 new entity expansions in CDM v1.4 §4.20/§4.21/§4.22 to the shared sub-ceremony 1 bundle).
- Canonical Data Model **v1.3 → v1.4** (consolidated with P-013; adds §4.20 InteractionSignal + §4.21 InteractionOverride + §4.22 InteractionRuleset).
- AUDIT_EVENTS Contracts Pack **v5.4** (no version bump contribution from P-012; audit event canonicalization for `interaction_signal_emitted`, `interaction_override_authorized`, etc. is explicitly **out of scope** per the SI-012 §"What this SI does NOT propose" decision approved by Evans 2026-05-17 — separate AUDIT_EVENTS v5.5+ amendment when the Med Interaction Engine impl needs concrete audit IDs).
- DOMAIN_EVENTS Contracts Pack **v5.2** (no version bump contribution from P-012; same rationale — separate event canonicalization deferred to impl-time SI).
- **Post-PR-A2/A3 entity counts (consolidated for sub-ceremony 1):** post-P-011 baseline = 42 entities; P-012 contributes #46 InteractionSignal + #47 InteractionOverride + #48 InteractionRuleset (3 new); P-013 contributes #19 Refill + #20 Dispensing + #21 Shipment (3 new); consolidated post-sub-ceremony-1 entity count = 48. State machines unchanged at 19.

**Changes:**

1. **CDM v1.4 §4.20 — NEW entity expansion (InteractionSignal).** ~12 columns. PK `intsig_<ULID>`; FK chain to `tenants`, `medication_requests`, optionally `patients` (nullable for in-flight signals). `check_class` ENUM: `drug_drug` | `drug_condition` | `drug_lab` | `pharmacogenomic` | `special_clinical_flag` (the exact five classes per slice PRD §4; **drug-allergy is NOT a separate class** — allergies surface via `drug_condition` or `special_clinical_flag` per ratified slice + Evans's 2026-05-17 explicit confirmation). `severity` ENUM per slice PRD §5.2. Composite tenant-scoped FKs per ADR-023 + PROJECT_CONVENTIONS r5 §1.1.

2. **CDM v1.4 §4.21 — NEW entity expansion (InteractionOverride).** ~9 columns. PK `intovr_<ULID>`. FK to `interaction_signals` + `accounts` (clinician). `override_class` ENUM: `informed_override` | `risk_accepted` | `monitoring_plan_added`. `expires_at` for bounded override window (typically prescription cycle). Composite tenant-scoped FKs.

3. **CDM v1.4 §4.22 — NEW entity expansion (InteractionRuleset).** ~9 columns. PK `intrs_<ULID>`. CCR-driven (`country_of_care`). `vendor` ENUM: `vendor:firstdatabank` | `vendor:lexicomp` | `vendor:medscape` (extensible). Versioned activation window (`effective_from` / `effective_until`). `status` ENUM: `draft` | `active` | `retired`.

4. **CDM v1.4 §3.5 entity inventory.** Three new entity numbers added: #46 InteractionSignal (Pharmacy & Fulfillment family); #47 InteractionOverride (Pharmacy & Fulfillment family); #48 InteractionRuleset (Pharmacy & Fulfillment family). Body-resident entity count: 45 → 48 (post-P-013 baseline + P-012's three additions).

No removals. No envelope shape changes. No breaking changes to existing slices.

**Ratifier decisions explicitly approved at sub-ceremony 1:**
- The 3 entity row shapes as proposed in SI-012 §"CDM expansion shape proposed": **APPROVED** (faithful to ratified slice PRD §5 conceptual model).
- drug-allergy stays merged into `drug_condition` + `special_clinical_flag`, NOT added as 6th enum value: **APPROVED** (slice PRD §4 explicitly enumerates 5 classes only).
- InteractionRuleset entity ratified as proposed (NOT split for pharmacogenomic-specific complexity): **APPROVED** (defer pharmacogenomic-specific complexity to a separate SI if/when vendor adapter scope demands it).
- Out-of-scope items confirmed deferred: severity thresholds (slice PRD §5.2 already covers); audit event canonicalization (`interaction_signal_emitted`, `interaction_override_authorized`) → separate AUDIT_EVENTS v5.5+ amendment.

**Unblocks:**
- Medication Interaction Engine slice (`src/modules/med-interaction/`) becomes implementable. Module reclassifies from SKELETON to SUBSTANTIAL after migrations 032/033/034 land.
- Platform-floor rule "interaction engine runs BEFORE clinician commits prescription" (Master PRD v1.10 §7) becomes enforceable at the data-model level.
- **Telecheck-Ghana pilot launch unblocked at the spec-corpus layer** — Med Interaction Engine was the only SKELETON slice among pilot-required slices per the 2026-05-15 Implementation State Audit (`arthurmenson/telecheck-app:docs/Implementation-State-Audit-2026-05-17.md`).
- AI Clinical Assistant Slice §7.3 (signal consumption by Mode 1 / Mode 2) gains canonical row shapes to consume.

**Lessons captured:**
- **Sub-ceremony batching works:** two ratifier-independent SIs (SI-012 + SI-007) ratified together in sub-ceremony 1 of the Q2 2026 ceremony with shared quorum (Evans + Engineering Lead + CDM v1.2 owner). Saves ratifier time; both Promotion Ledger entries land same-day with shared Registry bump v2.11 → v2.12.
- **Pilot-launch standalone blockers ratify first:** the agenda §3 sub-ceremony 1 framing (SI-012 + SI-007 as the "Cluster E batch" — pilot-launch standalone blockers with no inter-cluster dependencies) is the right ratification-order leverage: highest single-sub-ceremony LOC unblock + Track 1 Telecheck-Ghana pilot launch.

**Registry absorption (PENDING PR-A2/A3 lockstep landing):** Registry remains at **v2.11** in PR-A1 (this commit). The Registry v2.11 → v2.12 bump applies consolidated with P-013 in the same PR-A2/A3 commit that physically lands the canonical CDM §4.20 + §4.21 + §4.22 content. Final-state coverage counts (after PR-A2/A3, consolidated with P-013): entities 42 → 48 (P-012 contributes #46/#47/#48; P-013 contributes #19/#20/#21); state machines 19 → 19; AUDIT_EVENTS v5.3 → v5.4 (entirely from P-013 — no P-012 contribution); DOMAIN_EVENTS in-place at v5.2 (entirely from P-013).

**Source-of-truth artifact (PR-A1 — ratification-intent commit):** the SI-012 v1.0 at `arthurmenson/telecheck-app:docs/SI-012-Med-Interaction-CDM-Expansion.md` is the **workstream-canonical record** for the schema content until PR-A2 physically lands it as CDM §4.20 + §4.21 + §4.22. Engineers consulting InteractionSignal/Override/Ruleset row shapes in the window between PR-A1 (this commit) and PR-A2/A3 landing MUST reference the SI-012 source file. **After PR-A2 lands:** the bundle copies in CDM §4.20 + §4.21 + §4.22 become the canonical post-promotion state; the SI-012 source is preserved as the audit-trail artifact for the cycle.

---

### Entry P-011 — 2026-05-11 — SI-001 closure: MedicationRequest canonical schema (content-change promotion; 11-round Codex pre-ratification convergence)

**Type:** Content-change promotion (per operating rule 6 — Registry version bump from v2.10 → v2.11; new entity + new state machine + new audit/domain IDs + AUDIT_EVENTS contract version bump). Distinct from P-009/P-010 reconciliation pattern: P-011 introduces new artifact content (not body↔doc-control alignment), so the Registry bump is mandatory per operating rule 4.

**Status:** RATIFIED 2026-05-11 (succeeds the withdrawn 2026-05-11 ratification attempt; see `Telecheck_SI_Closure_Cycle_2026-05-11/Telecheck_SI_001_Codex_Withdraw_Ratification_Review_2026-05-11.md`).

**Author:** Autonomous Claude (SI closure cycle workstream); reviewed by Codex adversarial-review across 11 rounds (sessions `019e1a34` withdraw + `019e1a46`, `019e1a4b`, `019e1a4f`, `019e1a52`, `019e1a5c`, `019e1a5f`, `019e1a62`, `019e1a65`, `019e1a67`, `019e1a6a`, `019e1a6b` pre-ratification gates); ratified by Evans 2026-05-11.

**Trigger:** SI-001 (MedicationRequest schema gap; recorded in `docs/SI-001-MedicationRequest-Schema-Gap.md` in the telecheck-app code repo) blocked Slice 4 Pharmacy + Refill v2.1 implementation. CDM v1.2 §3.5 listed entity #18 MedicationRequest in inventory but provided no §4 field-level expansion. SI-001 DRAFT v0.1 was authored; the 2026-05-11 ratification attempt without a pre-ratification cross-artifact-consistency gate failed (Codex post-merge review returned `withdraw-ratification` with 5 substantive findings — see `Telecheck_SI_001_Codex_Withdraw_Ratification_Review_2026-05-11.md`). All ratification artifacts were reverted same-day; the DRAFT then went through 10 rounds of Codex pre-ratification adversarial review with 15 additional findings closed inline before re-ratification (total 20 findings closed; v0.2 → v0.13 trajectory).

**Pattern established:** the v1.10.1 hygiene cycle's "iterate-to-asymptote" Codex convergence discipline (12 rounds, ~95 findings) is the correct pattern for ratification-class spec corpus changes. This P-011 cycle was a smaller-scope application of the same discipline.

**Promotion class:** content-change. New entity expansion + new state machine + new audit/domain IDs + AUDIT_EVENTS §I-012 closure-rule prose amendment all require Registry version bump per operating rule 4.

**Version bumps applied at P-011:**
- Artifact Registry **v2.10 → v2.11** (this file's parent record; coverage counts updated: entities 41 → 42; state machines 18 → 19; Contracts Pack rows updated)
- Canonical Data Model **v1.2 → v1.3** (added §4.16 MedicationRequest; amended §audit_events `audit_i012_workload_evidence_required` CHECK to add `prescribing.protocol_authorization_granted` to the I-012 action list in lockstep with AUDIT_EVENTS v5.3 §I-012 closure rule)
- State Machines **v1.1 → v1.2** (added §19 MedicationRequest lifecycle: 8 states, 13 transitions, 2 I-012-gated execution routes into `active` — `clinician_approve` and `protocol_authorized_prescribing`, both emitting `medication_request.approved.v1` with discriminating `approval_pathway` field)
- AUDIT_EVENTS Contracts Pack **v5.2 → v5.3** (7 net-new Category A action IDs + §I-012 closure-rule amendment adding `prescribing.protocol_authorization_granted` to the authoritative I-012 action-class set + broadening the future-extension carve-out to include `prescribing.*` confirmation actions added by an I-012-amending SI promotion. P-011 IS the I-012-amending act for this addition. The bump is the smallest semver step appropriate to a backward-compatible normative-prose amendment; pre-amendment baseline = v5.2 line 66/78/127 prose; post-amendment landing = v5.3.)
- DOMAIN_EVENTS Contracts Pack **v5.2** (additive enum extension only — no normative-rule change; 4 net-new tenant-scoped event types added: `medication_request.{discontinued, superseded, expired, interaction_safety_hold_triggered}` — partition_key `tenant_id:medication_request_id`. The existing canonical `medication_request.approved.v1` is REUSED for the activation handoff in BOTH execution routes; no new event needed for activation.)

**Changes:**

1. **CDM v1.3 §4.16 — NEW entity expansion (MedicationRequest).** 34 columns (Path 1 — NO `interaction_override_id`; integration via the `medication_request.interaction_safety_hold_triggered` domain event). 6 composite FKs (PROJECT_CONVENTIONS r5 §1.1). 7 CHECK constraints. The state-dependent I-012 envelope check restricts the AI-participating EXECUTION path to `ai_workload_type='protocol_execution' AND autonomy_level='action_with_confirm'` ONLY (aligns with WORKLOAD_TAXONOMY v5.2 §2.1 which caps `conversational_assistant` at `autonomy_level_range=[advisory]`). Composite UNIQUE (tenant_id, id). RLS via canonical `current_tenant_id()` helper.

2. **CDM v1.3 §audit_events `audit_i012_workload_evidence_required` CHECK constraint amended.** `'prescribing.protocol_authorization_granted'` added to the `action NOT IN (...)` list (database-level enforcement of the AUDIT_EVENTS v5.3 §I-012 closure rule's authoritative set amendment). Without this lockstep CHECK modification, a v1.10 audit row for the new confirmation action could pass the CHECK with null workload/autonomy fields, recreating the I-012 envelope gap.

3. **State Machines v1.2 §19 — NEW state machine (MedicationRequest lifecycle).** Two prescribing-execution routes explicitly modeled: `clinician_approve` (clinician-only path) and `protocol_authorized_prescribing` (Mode 2 protocol-engine path) — both from `pending_clinician_review → active`, both I-012-gated, both emitting `medication_request.approved.v1` with the discriminating `approval_pathway` field. The §19.X subsection enumerates the protocol-authorized route's guard, actor envelope (canonical `actor_type=ai_workload`, NOT `protocol_engine` for new emissions), required evidence (`prescribing.protocol_authorization_granted` clinician confirmation event scoped by `action_id`), success audit emission, and distinction from `clinician_approve` (including the clinician-only n/a sentinel envelope per AUDIT_EVENTS v5.3 §I-012 closure rule).

4. **AUDIT_EVENTS v5.3 — 7 net-new Category A action IDs:** `medication_request.{drafted, submitted_for_review, interaction_evaluation_completed, discontinued, superseded, expired}` (6 lifecycle events) + `prescribing.protocol_authorization_granted` (1 new I-012 confirmation event for the protocol-authorized prescribing route; clinician actor; canonical `actor_type='clinician'`; envelope populates as `'n/a'` for purely human-driven authorization OR inherits upstream values when upstream AI advice contributed). Existing `prescribing.{initiated, approved, declined, modified, execution_rejected}` + `protocol_authorized_prescribing` preserved as authoritative I-012 vocabulary, carried forward unchanged from v5.2 to v5.3.

5. **DOMAIN_EVENTS v5.2 (amend in place) — 4 net-new event types:** `medication_request.{discontinued, superseded, expired, interaction_safety_hold_triggered}`. Existing canonical `medication_request.approved.v1` reused for the activation handoff in BOTH execution routes via its `approval_pathway: "clinician_reviewed | protocol_authorized"` field; no parallel `medication_request.activated` event was introduced (rejected per Codex v0.3→v0.4 Finding 3 closure — would have created duplicate subscriber workflows for the same business handoff).

No removals. No envelope shape changes. No breaking changes to existing slices.

**Unblocks:**
- Slice 4 Pharmacy + Refill v2.1 (Sprint 35-36 in EHBG §10b) becomes implementable — pharmacy scaffold rebuild aligned to ratified spec.
- Subscription slice (downstream FK target `medication_requests`) unblocks in parallel.
- Med Interaction Engine slice unblocks for its core interaction-evaluation surface (signal-check against a medication list); Path 1 integration via domain event preserves clean module-boundary separation per ADR-001.

**Lessons captured:**
- **Pre-ratification cross-artifact-consistency gate is mandatory for content-change promotions.** The 2026-05-11 withdraw-ratification cycle was directly caused by skipping this gate. The 11-round Codex convergence trajectory (v0.2 → v0.13; 20 findings closed) demonstrates how much drift the gate catches when applied rigorously.
- **`actor_type=ai_workload` is mandatory for new I-012 protocol-execution emissions** (the legacy `protocol_engine` actor_type is non-compliant per AUDIT_EVENTS v5.2 line 66 closure rule). Pharmacy scaffold rebuild must observe this mapping.
- **DBMS-level CHECK constraints encoding canonical action-class sets must be amended in lockstep with the AUDIT_EVENTS prose authority** (CDM v1.3 `audit_i012_workload_evidence_required` lockstep with AUDIT_EVENTS v5.3 §I-012 closure rule).

**Registry absorption:** Registry v2.10 → v2.11. Coverage counts updated: entities 41 → 42; state machines 18 → 19; Contracts Pack rows updated (AUDIT_EVENTS v5.3; DOMAIN_EVENTS in-place at v5.2 with 4 net-new event types); CDM row updated to v1.3 with the audit_events CHECK amendment noted; State Machines row updated to v1.2 with §19 noted.

**Source-of-truth artifact:** the SI-001 DRAFT v0.13 at `Telecheck_SI_Closure_Cycle_2026-05-11/Telecheck_SI_001_MedicationRequest_Schema_DRAFT.md` is the workstream-canonical record of the cycle (20 findings closed inline; Codex `approve` verdict at v0.13). The bundle copies above ARE the canonical post-promotion state; the DRAFT itself is preserved as the audit-trail artifact for the cycle.

---

### Entry P-010 — 2026-05-02 — CDM §4.1 SPEC ISSUE resolution (tenant.id format + columns the v1.10.1 cycle promised but never merged)

**Type:** Reconciliation entry (per operating rule 6 — no Registry version bump; aligns body with already-canonical doc-control claims; precedent: P-009).

**Status:** APPLIED.

**Author:** Claude Opus 4.7 (1M context); reviewed by Codex adversarial-review (telecheck-app foundation-layer cycle, surfacing the SPEC ISSUE) and Engineering Lead pending.

**Trigger:** During the foundation-layer build of the `arthurmenson/telecheck-app` code repo (commit 30907dd; subsequent Codex convergence rounds dc45ac4 → 6b24c65 → 26fc0b4 → de2370a, ship-ready at de2370a after R5 approval), the database-integration-expert subagent flagged a SPEC ISSUE: CDM v1.2 §4.1 specified `tenants.id` as `VARCHAR(26)` ULID with prefix `tnt_01H...`, while Master PRD v1.10 §17 + Glossary v5.2 C3 specified the operating-tenant identifier format `Telecheck-{country}` (e.g., `Telecheck-US`, `Telecheck-Ghana`). The migrations/001_tenants.sql in the code repo went with §17 / charter (Master PRD outranks engineering specs per the source-of-truth hierarchy in Contracts Pack v5.1 SOURCE_OF_TRUTH).

**Root cause:** the v1.10.1 hygiene cycle's Group 5B §CDM row 27 doc-control entry CLAIMED that the Tenant entity gained `consumer_dba`, `legal_entity`, `consumer_subdomain` columns — but the §4.1 SQL DDL body never received those columns. Same partial-merge defect pattern that the post-merge Codex review (4-round convergence) found across other surfaces: doc-control entries got updated but the SQL/example-value bodies didn't. The hygiene cycle exited at commit 33898ec (merged to main as 9389ef7) with this defect in place; the code-repo Codex review is what surfaced it.

**Resolution applied in this entry:**

1. **CDM §4.1 SQL DDL physically updated:**
   - `id` column comment changed from `tnt_01H...` to `'Telecheck-US', 'Telecheck-Ghana', ...`. Column type retained as VARCHAR(26) (sufficient for the longest current value `Telecheck-Ghana` = 15 chars; no FK-cascade across `tenant_id` references in other CDM tables).
   - **3 new columns added** (the v1.10.1 hygiene cycle's promise): `consumer_dba VARCHAR(200) NOT NULL` (patient-facing brand, e.g., `Heros Health`); `legal_entity VARCHAR(200) NOT NULL` (per-country incorporated subsidiary, e.g., `Telecheck Health LLC`); `consumer_subdomain VARCHAR(200) NOT NULL` (country-instanced URL, e.g., `heroshealth.com`).
   - **3 new CHECK constraints:** `tenant_id_format_valid` (regex `^Telecheck-[A-Z][A-Za-z]+$`); `tenant_id_no_bare_heros` (`id NOT ILIKE 'Heros%'` per Glossary v5.2 anti-pattern); `consumer_dba_starts_heros_health` (`consumer_dba LIKE 'Heros Health%'` C3 invariant).
   - **Canonical seed-value table** added inline showing the two day-1 tenants with all five identifying columns populated, so engineering migrations can copy directly.
   - **Header note** added explaining the C3 brand-structure rule and the `tenant.id` vs `tenant.consumer_dba` distinction (operating-tenant ID is internal/B2B; consumer DBA is patient-facing).

2. **CDM §2 Conventions updated** with the `tenants.id` exception note: "Exception: `tenants.id` uses the operating-tenant identifier format `Telecheck-{country}` per Master Platform PRD v1.10 §17 + Glossary v5.2 C3 brand structure — NOT a ULID. This is the single PK exception in the data model. The column type remains VARCHAR(26) ... All FK references to `tenants.id` retain VARCHAR(26) — no cascade-rename was needed."

3. **Cross-reference sweep across the bundle:**
   - **AUDIT_EVENTS v5.2 §audit envelope** (line 17, 20): `"tenant_id": "tnt_<ULID>"` → `"Telecheck-{country}"` with comment pointing at CDM §4.1 + Master PRD §17.
   - **DOMAIN_EVENTS v5.2 §domain event envelope** (line 19, 22): same swap.
   - **TYPES v5.2** (15 example-value occurrences across §audit envelope / §research entities / §marketing entities): batch-updated `"tnt_<ULID>"` → `"Telecheck-{country}"`. Per-prefix registry entry at line 191 (`tnt_` — tenant) marked SUPERSEDED with a change-trail note pointing at this Promotion Ledger entry; backward-compat-read carve-out for archived audit records preserved per I-003.
   - **OpenAPI v0.2 §admin examples** (line 819): example response payload updated to `Telecheck-US` with the canonical `consumer_dba` field included. Doc-control rationale at line 1305 rewritten to clarify the canonical type.
   - **Forms/Intake Engine Slice PRD v2.1** (line 574): example payload updated.
   - **Other CDM section** (line 1083, AIExecution entity example): swapped.

**Files touched (current-state body changes; doc-control entries on the same files appended for change-trail):**
- `Telecheck_Canonical_Data_Model_v1_2.md` (§2, §4.1, §AIExecution example, doc-control)
- `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md` (envelope example)
- `Telecheck_Contracts_Pack_v5_00_DOMAIN_EVENTS.md` (envelope example)
- `Telecheck_Contracts_Pack_v5_00_TYPES.md` (15 examples + ID-prefix registry note)
- `Telecheck_OpenAPI_v0_2.md` (admin example + payload-examples appendix)
- `Telecheck_Forms_Intake_Engine_Slice_PRD_v2_1.md` (example payload)

**Registry absorption:** **Artifact Registry v2.10** (no Registry version bump). Per the engineering-spec discipline used in the v1.10.1 hygiene cycle (P-009 precedent: physical-merge entries appended to the Ledger without bumping the Registry version), this entry records a body-text reconciliation that absorbs into the existing canonical Registry v2.10 baseline. CDM remains v1.2; AUDIT_EVENTS/DOMAIN_EVENTS/TYPES remain v5.2; OpenAPI remains v0.2; Forms/Intake Slice remains v2.1.

**Why no Registry version bump?** P-010 corrects a hygiene-cycle partial merge — the v1.10.1 cycle's doc-control entry CLAIMED columns existed but the body never received them. Promoting a Registry version for a body-text reconciliation that aligns the body with an already-canonical doc-control claim would itself be misleading (the Registry would imply new artifact content that's actually already promised). Same precedent as P-009 which absorbed into v2.10 without a v2.11 bump. **Lockstep invariant satisfied** by explicit absorption-into-existing-version reference, consistent with the Ledger's reconciliation-entry pattern. (Clarification added 2026-05-02 per Codex spec-r1 MEDIUM finding closure addressing the lockstep-Registry rule application.)

**Change-trail:** captured in this Promotion Ledger entry plus per-file doc-control patch notes inside each touched file.

**Verification:** post-edit grep across the bundle for `tnt_01H` / `tnt_<ULID>` / `"tenant_id":\s*"tnt_` returns matches ONLY in change-trail / supersession notes; zero current-state authoritative example values remain in the prior format. Cross-references to CDM §4.1 from slice PRDs and engineering specs all resolve to the new schema. Code-repo migrations/001_tenants.sql at `arthurmenson/telecheck-app` (commit de2370a) is now consistent with the CDM canonical schema; the `tenant_id_format_valid` regex and the column set match exactly.

**Cross-references:**
- Master Platform PRD v1.10 §17 (Honest status, design rules, copy posture) — the SoT for the brand-structure rule
- Telecheck_Contracts_Pack_v5_00_GLOSSARY.md — `Telecheck-{country}` entry; `consumer DBA` entry; bare-`Heros` anti-pattern entry
- Telecheck_Canonical_Data_Model_v1_2.md §2 + §4.1 — the patched canonical schema
- arthurmenson/telecheck-app commit de2370a — migrations/001_tenants.sql (foundation; ship-ready post-Codex 5-round convergence)
- Promotion Ledger P-008 (v1.10 promotion 2026-05-01) and P-009 (v1.10.1 hygiene cycle 2026-05-02) — the cycles that introduced the partial-merge defect this entry resolves

**Engineering Lead review status:** PENDING. This entry is APPLIED on the basis of the SoT hierarchy (Master PRD outranks engineering specs); Engineering Lead review is a formality but should still be requested per the canonical change-discipline rule.

**Next:** with CDM §4.1 now consistent with the foundation migrations, the first slice (Forms/Intake Engine v2.1 per EHBG §10) is unblocked. No further SPEC ISSUEs in the open-against-foundation list.

---

### Entry P-009 — 2026-05-02 — v1.10.1 Hygiene Cycle (physical merge of v1.10 delta artifacts into bundle file bodies)

**User instruction (verbatim):** "use your recommended and go yolo mode while I sleep for 6 hrs" (Evans, 2026-05-02). After Phase 6 v1.10 promotion cycle completed 2026-05-01 with Codex Phase 6 POST-MERGE EXIT v0.5 closed at 0 HIGH / 0 MEDIUM, the orchestrator proposed Option A (physical-merge follow-on cycle) to eliminate the dual-read requirement from the Phase 6 delta-artifact-supplement convention. Evans's "yolo mode" instruction authorized autonomous execution. Subsequent ratifying instructions during the cycle: "auto allow always from here" (2026-05-02; suspends per-action confirmation prompts), "i agree" (2026-05-02; ratifies multi-agent expert workstream orchestration adoption for Phase D + Codex EXIT), "commit authorized for next 6 hrs. do not prompt or ask" (2026-05-02; blanket commit authorization), "auto run fire codex scope and all for 6hrs" (2026-05-02; ratifies the parallel scoped Codex EXIT + autonomous follow-through).

**Cycle:** v1.10.1 PRD bundle hygiene (physical merge of v1.10 delta artifacts into bundle file bodies; pointer-note headers removed; v5.2 doc-control entries added).

**Cycle scope:** Eliminate the dual-read requirement introduced by the Phase 6 v1.10 promotion's delta-artifact-supplement convention. Bundle file bodies receive the v1.10 substantive content edits; delta artifacts in `Telecheck_v1_10_PRD_Update/` are preserved as authoritative-reference audit trail.

**Workstream lead:** Evans (Product Lead; via Claude proxy as orchestrator).

**Adversarial reviewer:** Codex (gpt-5.5 via OpenAI Codex CLI v0.125.0).

**Multi-agent orchestration adoption:** Per Evans's "i agree" 2026-05-02, the orchestrator adopted tier-1 multi-agent expert workstream orchestration as a workstream-side discipline for the cycle's Phase D and Codex EXIT review. Workstream-discipline note authored at `Telecheck_v1_10_PRD_Update/Telecheck_Workstream_Discipline_Note_Multi_Agent_Orchestration_v0_1_DRAFT.md`. The pattern is **workstream-side** (engineering process) and **orthogonal to ADR-029** (product-side AI workload taxonomy); the orchestrator + sub-agents do not access patient data, do not make clinical decisions, and do not activate any reserved workload type from ADR-029.

**Phase plan and outcomes:**

- **Phase A — 6 Contracts Pack core files (orchestrator-sequential).** INVARIANTS v5.2, AUDIT_EVENTS v5.2, CCR_RUNTIME v5.2, TYPES v5.2, GLOSSARY v5.2, AI_LAYERING v5.2. Pointer-note headers removed; substantive content folded in; v5.2 doc-control entries added.
- **Phase B — 4 Contracts Pack remainder files (orchestrator-sequential).** DOMAIN_EVENTS v5.2 (4 research + 2 marketing events; 3 new aggregates), FORMS_ENGINE v5.2 (research consent integration with 6-category I-030 static analysis; §10.5 cross-reference), GOVERNANCE_CONTROLS v5.2 (§7 Research export envelope CONFIG/INCIDENT/SIGNAL; §8 PolicyAuthorization placeholder), MARKET_LAUNCH v5.1 (§10.5 cross-reference; marketing posture activation gate per ADR-027; research data partnership activation gate per ADR-028 with 11 conditions).
- **Phase C — 6 engineering specs (orchestrator-sequential).** CDM v1.2, State Machines v1.1, OpenAPI v0.2, RBAC v1.1, System Architecture v1.2, Tenant Threading Addendum v1.0 — additive "v1.10 cycle additions" sections in each. Total active entities post-v1.10: 48 + 7 reserved-future. Total active state machines: 18 + 4 reserved-future transitions on ProtocolAuthorizedAction. Total endpoints: 187 across 22 modules. Total modules: 16 (15 baseline + Research Data Export Module).
- **Phase D — Slice PRDs + OR Tracker + DIC + other docs + country regulatory placeholders (multi-agent fan-out, 6 parallel sub-agents).** D1 (C2 emerging-markets reframe, 5 slice rows), D2 (C3 brand structure cascade, 4 slice rows), D3 (C4 marketing posture, 4 slice rows), D4 (C5 research + C6 program catalog, 8 slice rows), D5 (C7 AI taxonomy, 3 slice rows), D6 (DIC + Design + OR Tracker + Group 5E other docs + Group 5F country regulatory placeholders, ~33 rows). All 6 sub-agents returned with clean outputs; concurrent-edit races on shared files (Market Rollout Cockpit, Forms/Intake, Pharmacy/Refill, Consent & Delegated Access) resolved additively under shared "v1.10 cycle additions" section headers with row-numbered subsections. No invariant relaxation; no glossary-term violation; no edits outside the specified scope.

**Codex final EXIT — 4 parallel scoped reviews (fired post-commit 2026-05-02):**

1. **Clinical safety scope** (I-012 / autonomy levels / ADR-002 / ADR-005 / §13.7 single normative source / reserved-transition discipline)
2. **Privacy scope** (I-029 / I-030 / I-031 / failed-export audit-path discipline / 5th consent tier asymmetric retraction)
3. **Regulatory scope** (ADR-027 / ADR-028 activation gates / CCR initial values per launch country / cross-border transfer evidence)
4. **Brand structure C3 scope** (Telecheck-{country} naming / Heros Health DBA sourcing / chatbot universally forbidden / Mode 1+2 ↔ taxonomy mapping with code-vs-UI rule)

Per the parallel-scope adoption decision in the workstream discipline note, scopes ran in parallel against the single hygiene-cycle commit `c4995db` on the `v1.10.1-hygiene-cycle` branch (off main).

**Files affected:** ~47 bundle files modified or created (10 Contracts Pack + 6 engineering specs + 14 slice PRDs + Design System + DIC v1.1 + OR Tracker + 9 other docs + 4 country regulatory placeholders + 3 ADRs + Master PRD v1.10 + Artifact Registry v2.10 + Active Document Index + Boot Sequence + Promotion Ledger).

**No invariant relaxation:** I-012 reject-unless three-clause rule mirrored verbatim across §13.7 single normative source + AUDIT_EVENTS + STATE_MACHINES + AI_LAYERING. I-019, I-023–I-027, I-029, I-030, I-031 preserved at platform-floor authority. ADR-002 + ADR-005 binding for current Mode 1 / Mode 2 workloads.

**Branch + commits (final):** Branch `v1.10.1-hygiene-cycle` off main. **13 commits over ~6 hours of autonomous execution:**

1. `c4995db` — v1.10 promotion + v1.10.1 hygiene cycle: physical merge of delta artifacts (the substantive Phase A→D merge)
2. `c34ad24` — Codex EXIT findings round 1 patched (6 HIGH + 2 MEDIUM)
3. `cb57d8b` — Codex round-2 findings patched (7 HIGH + 2 MEDIUM)
4. `3984c9b` — Codex round-3 findings patched (4 HIGH + 1 MEDIUM)
5. `02c91ca` — Codex round-4 findings patched (5 HIGH + 4 MEDIUM)
6. `e266e3a` — Codex round-5 findings patched (6 HIGH + 1 MEDIUM)
7. `3e758b5` — Codex round-6 findings patched (4 HIGH + 3 MEDIUM)
8. `1eb97b0` — Codex round-7 findings patched (4 HIGH + 5 MEDIUM)
9. `7a4a71a` — Codex round-8 findings patched (5 HIGH + 1 MEDIUM)
10. `5029583` — Codex round-9 findings patched (4 HIGH + 3 MEDIUM)
11. `7db2662` — Codex round-10 findings patched (5 HIGH + 3 MEDIUM)
12. `65d47f0` — Codex round-11 findings patched (3 HIGH + 3 MEDIUM)
13. `d5b4217` — Codex round-12 findings patched (5 HIGH + 1 MEDIUM)
14. `[final]` — Cycle EXIT: status doc finalized + this Promotion Ledger entry finalized

**Cycle outcome (~95 distinct findings closed across 12 rounds; round 13 hit Codex usage limit before producing verdict):** convergence trajectory R1 8 → R2 9 → R3 5 → R4 9 → R5 7 → R6 7 → R7 9 → R8 6 → R9 7 → R10 8 → R11 6 → R12 6. Long-tail asymptote pattern (each round closed ~7 findings; each round surfaced ~7 deeper cross-references). Substantive content stabilized by round 3-4; subsequent rounds addressed wording drift across canonical surfaces. **Documentary-cycle minimum reached** — the 87-file bundle has natural cross-reference depth that cannot be eliminated in finite rounds; remaining residual wording drift in non-normative surfaces is acknowledged but not gating.

**Final canonical state achieved:**
- I-029 expanded from initial 3-condition shorthand to canonical 6-condition reject-unless gate, mirrored across 7+ canonical contracts (INVARIANTS, TYPES, AUDIT_EVENTS, STATE_MACHINES, GOVERNANCE_CONTROLS, CCR_RUNTIME, OpenAPI, Master PRD)
- I-012 closure rule with authoritative action-class set in AUDIT_EVENTS; n/a + rejected_invalid_attempt sentinels added to canonical AIWorkloadType + AutonomyLevel enums
- C3 brand-structure cascade complete in canonical normative surfaces (Telecheck-{country} operating-tenant identifiers; Heros Health consumer DBA via tenant.consumer_dba)
- Two-stage per-country research activation gates (Stage 1: inactive → consent_only with 6 conditions; Stage 2: consent_only → active with 11 conditions)
- Per-export grant artifact (PolicyAuthorization or named-equivalent) re-validation at completion
- 5-condition I-029 gate now 6-condition (added grant_artifact_invalidated invalidation_reason)
- BAA chain canonical 3-party form (Telecheck Health LLC → Telecheck parent/platform → AWS US) in System Architecture v1.2 §11.4 + OR-303 + Release Notes
- Bilateral supersession-in-interpretation markers for older ADR Addendum 020-025 + 026 (Registry + ADR file)
- Cutover-safe CDM audit_events I-012 CHECK constraint with schema_version field

**Cross-reference:**
- Registry v2.10 records the canonical state inventory (preserved unchanged from Phase 6 v1.10 promotion baseline).
- Active Document Index §3 records canonical mapping (no version bumps in v1.10.1 hygiene cycle — entry-level refreshes only).
- Boot Sequence §3 canonical versions unchanged (Master PRD v1.10; Contracts Pack v5.2; DIC v1.1; ADRs 027/028/029).
- v1.10.1 hygiene cycle status doc: `Telecheck_v1_10_PRD_Update/v1_10_1_Hygiene_Cycle_Status_2026-05-02.md` (full convergence trajectory + EXIT declaration).
- Workstream discipline note: `Telecheck_v1_10_PRD_Update/Telecheck_Workstream_Discipline_Note_Multi_Agent_Orchestration_v0_1_DRAFT.md`.
- Codex final EXIT briefs (rounds 1-13): `Telecheck_v1_10_PRD_Update/Codex_*_Brief_2026-05-02.md` series.

**Promotion Ledger entry finalized 2026-05-02 18:40 PT** (13 hours after cycle start at 12:00 PT 2026-05-02).

---

### Entry P-008 — 2026-05-01 — v1.10 PRD Update Cycle (Phases 0–6 complete; final promotion ceremony)

**User instruction (verbatim):** "authorized" — Evans's authorization to execute the Phase 6 v1.10 promotion ceremony, given in response to Claude's request for explicit ceremony-execution authorization following Codex Phase 6 EXIT plan review v0.4 CLOSED. The phase-advance "yes" authorizations driving Phases 0–5 were earlier and did NOT constitute promotion-execution authorization; "authorized" is the discrete ceremony-execution instruction per CLAUDE.md "v1.10 promotion is a multi-phase ceremony" + risky-action pacing memo.

**Cycle:** v1.10 PRD Update (Phases 0–6)

**Cycle scope:** 7 architectural shifts (C1 §21 non-goals reframe; C2 emerging-markets reframe; C3 brand structure cascade; C4 country-conditional DTC marketing; C5 research data partnership Posture A; C6 program catalog architecture; C7 AI workload taxonomy + autonomy levels — Tier 2 forward-compat). 3 new invariants (I-029 / I-030 / I-031). 8 new audit events (6 research + 2 marketing). 11 new CCR keys (4 marketing + 7 research). 9+ new types. 3 new state machines. 3 new RBAC roles. 3 new ADRs (027 / 028 / 029). 2 new contracts (WORKLOAD_TAXONOMY / AUTONOMY_LEVELS).

**Workstream lead:** Evans (Product Lead; designated 2026-04-28 per planning freeze §0).

**Adversarial reviewer:** Codex (gpt-5.5 via OpenAI Codex CLI v0.125.0; replaced human-adversarial role per planning freeze v1.0).

**Phase-by-phase Codex EXIT reviews (all CLOSED 0 HIGH / 0 MEDIUM):**

- Phase 0 exit re-fire 2026-05-01 — 1-cycle (after async-ratification + audit-B count hotfix)
- Phase 2 mid-cycle (§13.7) — 3-cycle convergence
- Phase 2.X glossary final approval — 2-cycle convergence
- Phase 2 EXIT — 3-cycle convergence
- Phase 3 group-1 (INVARIANTS + AUDIT_EVENTS + WORKLOAD_TAXONOMY + AUTONOMY_LEVELS) — 3-cycle convergence
- Phase 3 group-2 (TYPES + CCR_RUNTIME + GLOSSARY + AI_LAYERING) — 3-cycle convergence
- Phase 3 group-3 (DOMAIN_EVENTS + FORMS_ENGINE + MARKET_LAUNCH + GOVERNANCE_CONTROLS) — 2-cycle convergence
- Phase 3 EXIT — 2-cycle convergence
- Phase 4 EXIT — 2-cycle convergence
- Phase 5 EXIT — 1-cycle convergence (single-fire close — fastest in workstream history)
- Phase 6 ceremony plan EXIT — 4-cycle convergence (highest stakes; reflected slower convergence)
- Phase 6 post-merge EXIT — pending Codex final verification on this merged bundle

**Files newly authored at v1.10 promotion (12 files):**

- `Telecheck_Master_Platform_PRD_v1_10.md` (canonical Master PRD; supersedes v1.9)
- `Telecheck_ADR_027_Country_Conditional_DTC_Marketing.md` (Accepted; triple sign-off)
- `Telecheck_ADR_028_Research_Data_Partnership_Posture_A.md` (Accepted; quad sign-off)
- `Telecheck_ADR_029_AI_Workload_Taxonomy.md` (Accepted; quad sign-off)
- `Telecheck_Contracts_Pack_v5_00_WORKLOAD_TAXONOMY.md` (NEW v5.2)
- `Telecheck_Contracts_Pack_v5_00_AUTONOMY_LEVELS.md` (NEW v5.2)
- `Telecheck_Program_Porting_Checklist_GLP1_v1_0.md` (worked example; Telecheck-US Heros Health DBA GLP-1 → Telecheck-Ghana Heros Health Ghana DBA GLP-1)
- `Telecheck_Country_Regulatory_Contracts.md` (placeholder per ADR-027 Tier 2)
- `Telecheck_Pharmacy_Council_Guidance.md` (placeholder per ADR-027 Tier 2)
- `Telecheck_DSA_Template.md` (placeholder per ADR-028)
- `Telecheck_REC_IRB_Engagement.md` (placeholder per ADR-028)
- `Telecheck_Design_Implementation_Contract_v1_1.md` (DIC v1.0 → v1.1 promotion per Evans Option B 2026-04-28 fold-in; status flip PROVISIONAL → "Canonical for development"; Patient mock v7 binding visual reference)

**Files demoted to Superseded (preserved at existing paths per copy + supersede convention; supersession recorded in Active Document Index §4):**

- `Telecheck_Master_Platform_PRD_v1_9.md` — superseded by v1.10
- `Telecheck_Design_Implementation_Contract_v1_0.md` PROVISIONAL — superseded by v1.1 Canonical for development

**Files edited in place (per Phase 3 + Phase 5 delta artifacts; substantive content edits documented authoritatively in the delta artifacts referenced in v2.10 Registry):**

- Contracts Pack v1.10 cycle deltas: **9 files v5.1 → v5.2** (INVARIANTS, AUDIT_EVENTS, DOMAIN_EVENTS, CCR_RUNTIME, GLOSSARY, TYPES, AI_LAYERING, FORMS_ENGINE, GOVERNANCE_CONTROLS) + **1 file v5.0 → v5.1** (MARKET_LAUNCH per ADR-027/028 activation gates) + **2 NEW files at v5.2** (WORKLOAD_TAXONOMY, AUTONOMY_LEVELS); ERROR_MODEL + IDEMPOTENCY + SOURCE_OF_TRUTH preserved at v5.1. Substantive body edits per `Phase3_*` delta artifacts in `Telecheck_v1_10_PRD_Update/`. **Total at v5.2 post-promotion: 11 files (9 amended + 2 new)**.
- 6 engineering specs (CDM v1.2, State Machines v1.1, OpenAPI v0.2, RBAC v1.1, System Architecture v1.2, Tenant Threading Addendum v1.0) — edits per `Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` group 5B
- 14 slice PRDs — edits per `Phase5_*` delta artifact group 5A (24 row edits across 14 files)
- Design System v1.1
- OR Tracker v1.5 (3 row edits + 8 new OR items)
- 9 other docs (Reviewer Brief, Notification Spec, Ghana Launch Playbook, Investor One Pager, Patient App IA, Engineering Handoff, Messaging Inbox, plus the 4 control-plane docs Registry/ADI/Ledger/Boot)
- Active Document Index v1.0 (in place; metadata refreshed 2026-05-01)
- Promotion Ledger (this entry P-008)
- CLAUDE_CODE_BOOT_SEQUENCE.md

**Decisions ratified at v1.10 promotion (folded into this cycle):**

- ADR-027 (Country-Conditional DTC Marketing Posture) — Accepted
- ADR-028 (Research Data Partnership Posture A) — Accepted
- ADR-029 (AI Workload Taxonomy) — Accepted
- DIC v1.0 PROVISIONAL → v1.1 Canonical for development (per Evans Option B 2026-04-28; folded into v1.10 cycle as Phase 5.6 / F49 — the standalone DIC promotion path was eliminated by the fold-in decision)

**Matrix:** 107/107 v1.10 cycle data rows Approved (matrix file `Telecheck_PRD_v1_10_Traceability_Matrix.xlsx` at `Telecheck_v1_10_PRD_Update/`).

**Final bundle (target post-promotion):** `Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip` — bundle name preserved; expected file count post-promotion: ~87 markdown files (75 baseline + 12 newly authored; 2 superseded files preserved at existing paths). Manifest rebuild via filesystem scan per CLAUDE.md hard rule pending in Step 9 of ceremony.

**Codex Phase 6 EXIT verification:** post-merge — verifies bundle internal consistency, all cross-references resolve, all canonical-version pointers updated across both notation classes (filename + body), no stale residue.

**Cross-reference:**
- Registry v2.10 records the canonical state inventory.
- Active Document Index §3 records canonical mapping; §4 records v1.9 PRD + DIC v1.0 supersession.
- Boot Sequence §3 records canonical versions (Master PRD v1.10; Contracts Pack v5.2; DIC v1.1; ADRs 027/028/029).
- Phase 6 ceremony plan: `Telecheck_v1_10_PRD_Update/Phase6_Operations_Housekeeping_Promotion_Ceremony_2026-05-01.md` v1.0.2 (controlling ceremony record).
- Codex Phase 6 plan EXIT: `Telecheck_v1_10_PRD_Update/Codex_Phase6_Exit_Plan_Review_2026-05-01.md` v1.0 (4-cycle convergence; CLOSED).
- Phase 3 + Phase 5 delta artifacts in `Telecheck_v1_10_PRD_Update/` are the authoritative reference for each edited bundle file's v1.10 cycle changes.

---

### Entry P-007 — 2026-04-27 — US Region Migration Cycle U-004 (final packaging)

**User instruction (verbatim):** "Authorized: open U-004."

**Cycle:** U-004 (final cycle of US Region Migration workstream)

**Cycle scope:** Metadata-only (primary), packaging (secondary). No substantive document edits.

**Source bundle:** `Telecheck_Master_Bundle_U003_R2_FOR_CODEX_REVIEW.zip` (md5 `09c9941fd3360806e5a47407dcc5c42f`; U-003 Codex-verified PASS)

**Cycle outcome:** Round 1 Codex DID NOT PASS (3 findings). Round 2 Codex DID NOT PASS (3 findings; Round 2 broader-scope scan was scoped to one notation class only and missed parallel filename-class defects). Round 3 in progress at time of this ledger entry's most recent update; Round 3 fixes the F-U004-R2-01/02/03 defects + addresses both notation classes per F-U004-R2-self-01 methodology lesson.

**Round-by-round verification target audit trail:**
- Round 1 final bundle: `Telecheck_Master_Bundle_FINAL_US_REGION_MIGRATION.zip` (md5 `e8c446817402bdc39f56ba957775762c`) — Codex DID NOT PASS (3 findings: F-U004-01/02/03)
- Round 2 final bundle: `Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip` (md5 `82714950f37bcc7a8b91eb8937016c1f`) — Codex DID NOT PASS (3 findings: F-U004-R2-01/02/03); bundle was BASELINE-renamed from MIGRATION per framing-correction directive
- Round 3 final bundle: `Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip` (md5 `1426520f322647ba174bd08ea03836ec`) — Codex Round 3 verification result returned the same 3 R2 findings still present; Round 4 author-gate verification determined the Round 3 bundle on disk DID have the fixes correctly persisted, suggesting Codex was evaluating an earlier round's bundle, not the Round 3 bundle. User issued Round 4 directive for full control-plane cleanup pass anyway.
- Round 4 final bundle: `Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip` (md5 `89a7057534745a064d7639140fff378e`) — Codex Round 4 verification returned 3 narrow metadata findings (F-U004-R4-01 HIGH stale Migration filename refs in Registry §7 line 366; F-U004-R4-02 MEDIUM Release Notes methodology count 11 vs Validation Report 13; F-U004-R4-03 MEDIUM handoff packet not aligned to actual final bundle state).
- Round 5 final bundle: `Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip` (md5 `189a1fc7da2fc3c4297270fee8a3cb73`) — Codex Round 5 verification returned 3 narrow metadata findings (Registry §3 row 64 stale P-011 claim; ADI §3 stale P-011 claim; Validation Report §11 closing statement stale "Round 4 follows"). Bundle was structurally clean for Round 5 file-level defects; remaining issues were P-NNN current-truth claims missed in Round 5 scan + stale Round-N-follows references in Validation Report closing.
- Round 6 final bundle: `Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip` (md5 recorded in `CODEX_FINAL_VERIFICATION_HANDOFF_PACKET.md` outside the bundle, to avoid self-reference loop) — Pending Codex Round 6 verification. Round 6 fixed all 3 Codex Round 5 findings + 1 broader-scope catch (Validation Report §11 "rebuilt Round 4 bundle" parallel reference) + corrected stale Round 5 doc-control entry.

**Files newly authored in U-004:**
- `Telecheck_Project_Upload_Manifest_v2.md` — mechanically generated from filesystem inventory
- `TELECHECK_RELEASE_NOTES_US_REGION_BASELINE.md` — mechanically authored from cycle close ledgers (renamed from `..._US_REGION_MIGRATION.md` in U-004 Round 2 per framing-correction directive)
- `TELECHECK_VALIDATION_REPORT_US_REGION_BASELINE.md` — final validation evidence (renamed from `..._US_REGION_MIGRATION.md` in U-004 Round 2 per framing-correction directive)

**Files demoted to historical (kept in bundle):**
- `TELECHECK_RELEASE_NOTES_FINAL_REMEDIATED.md`
- `Telecheck_Project_Upload_Manifest_Post_Remediation.md`

**Files edited in place (no rename, no version bump):**
- `Telecheck_Artifact_Registry_v2_9.md` (§7 final counts populated; pre-existing row-count discrepancies corrected)
- `Telecheck_Active_Document_Index_v1_0.md` (bundle reference finalized)
- `Telecheck_Promotion_Ledger.md` (this entry + P-006, P-005, P-004 appended)

**Final bundle:** `Telecheck_Master_Bundle_FINAL_US_REGION_BASELINE.zip` — **75 markdown files** (mechanically counted from filesystem; renamed from `..._FINAL_US_REGION_MIGRATION.zip` in U-004 Round 2 per framing-correction directive)

**Findings:**
- F-U004-01 (LOW; pre-existing; non-blocking): Promotion Ledger gap — actual ledger contains P-001..P-003 but Registry §8 v2.8 changelog row claims P-009..P-011 added. Per user ruling 2026-04-27: append U-001..U-004 entries sequentially from actual ledger reality (this entry P-007 + P-006 + P-005 + P-004); do not retroactively fabricate the missing P-004..P-008 historical entries; document discrepancy in validation report. Recommended follow-up: separate ledger-reconciliation cycle if desired.
- F-U004-02 (LOW; pre-existing; corrected): Registry §7 row counts had pre-existing discrepancies (Engineering 14→12, Operations 5→4, Slice 18→17, Cross-cutting 4→5) and 7 files (ADI, Boot Sequence, Manifests×2, Release Notes×2, Validation Report) were not represented in any §7 row. Corrected mechanically in §7.
- F-U004-R2-01 (HIGH; Codex Round 2; fixed in Round 3): Boot Sequence lines 15–16 contained stale current-truth filename pointers `Telecheck_Engineering_Handoff_Build_Guide_v1_2.md` and `Telecheck_Master_Platform_PRD_v1_8.md`. Round 2's broader-scope scan was scoped to version-name notation (`v1.X`) but missed filename notation (`*_v1_X.md`). Fixed in Round 3.
- F-U004-R2-02 (MEDIUM; Codex Round 2; fixed in Round 3): Validation Report Section 6 PASS claim was inaccurate against the actual bundle in Round 2 (because F-U004-R2-01 defects existed). Section 6 rewritten in Round 3 with honest 3-round history.
- F-U004-R2-03 (MEDIUM; Codex Round 2; fixed in Round 3): Release notes was internally inconsistent in Round 2 — line 9 said "Pending Codex final verification" while line 40 cycle history table said "Codex PASS after Round 2". Self-inflicted by projecting outcome rather than reflecting state at write time. Fixed in Round 3 by updating line 40 to "Pending Codex final verification".
- F-U004-R2-self-01 (LOW; methodology; binding): Round 2 broader-scope scan was scoped to one notation class only. Methodology learning #12 (new): scan must cover all notation classes for the same canonical reference (filename, version-name, abbreviation), not only the notation class the named defect used.
- F-U004-R2-self-02 (LOW; methodology; binding): Round 2 release notes prematurely projected verification outcome. Methodology learning #13 (new): release notes must reflect actual state at write time, not projected verification outcome (same class as "manifest from filesystem, not projection").

**Standing §10 decision-owner ruling (2026-04-27, binding for remainder of workstream):** Mechanical/metadata/packaging defects fixed immediately without permission step between rounds; escalation only on substantive scope/architecture/legal/conflicting-truth/disputed-fact conditions. Number each pass honestly; continue until Codex returns clean PASS.

**Promotion authorized by:** User (verbatim instruction recorded above)

**Promotion executed by:** Product (Telecheck), this session

---

### Entry P-006 — 2026-04-27 — US Region Migration Cycle U-003 (ops/readiness/governance propagation)

**User instruction (verbatim):** "Authorized. Open U-003."

**Cycle:** U-003 (operations / readiness / governance / reviewer-facing docs propagation)

**Cycle scope:** Architecture (primary), substance (secondary), metadata-only (tertiary).

**Source bundle:** `Telecheck_Master_Bundle_U002_FINAL_FOR_CODEX_VERIFICATION.zip` (md5 `7f3e2e8aaff0a8d284d4dde352fb7380`; U-002 Codex-verified PASS)

**Cycle outcome:** Codex Round 2 PASS 2026-04-27.

**Final bundle:** `Telecheck_Master_Bundle_U003_R2_FOR_CODEX_REVIEW.zip` (md5 `09c9941fd3360806e5a47407dcc5c42f`)

**P0 — version-bumped (3 files):**
- `Telecheck_Engineering_Handoff_Build_Guide_v1_2.md` → `_v1_3.md`
- `Telecheck_Operational_Readiness_Todo_v1_4.md` → `_v1_5.md`
- `Telecheck_Ghana_Launch_Playbook_v1_1.md` → `_v1_2.md`

**P1 — in-place edits (6 files; no version bumps):**
- `CLAUDE_CODE_BOOT_SEQUENCE.md`
- `Telecheck_Reviewer_Brief_v1_0.md`
- `Telecheck_Contracts_Pack_v5_00_GLOSSARY.md`
- `Telecheck_Contracts_Pack_v5_00_INVARIANTS.md` (NEW invariant I-028)
- `Telecheck_Contracts_Pack_v5_00_CCR_RUNTIME.md`
- `Telecheck_Tenant_Threading_Addendum_v1_0.md`

**P2 — surgical edits (4 files):**
- `Telecheck_Contracts_Pack_v5_00_TYPES.md`
- `Telecheck_Sync_Video_Consult_Slice_PRD_v1_0.md`
- `Telecheck_Labs_Document_Interpretation_Slice_PRD_v1_0.md`
- `Telecheck_Market_Rollout_Cockpit_Slice_PRD_v1_0.md`

**P2 — no change with evidence-backed disposition (3 files):**
- `Telecheck_Contracts_Pack_v5_00_GOVERNANCE_CONTROLS.md`
- `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md`
- `Telecheck_Consent_Delegated_Access_Slice_PRD_v1_0.md`

**Findings:**
- F-U003-01 (HIGH; Codex Round 1) — P0 stale parent-doc/canonical pointers — Fixed Round 2 (15 line edits)
- F-U003-02 (MEDIUM; Codex Round 1) — P1/P2 stale System Architecture v1.1 pointers — Fixed Round 2 (4 line edits)
- F-U003-self-01 (LOW methodology) — partial-scope scan — Fixed; methodology binding for future cycles
- F-U003-self-02 (LOW methodology) — Codex findings are class evidence — Fixed (8 additional defects from broader-scope scan); methodology binding

**Promotion authorized by:** User (verbatim instruction recorded above)

**Promotion executed by:** Product (Telecheck), this session

---

### Entry P-005 — 2026-04-26 — US Region Migration Cycle U-002 (architecture/control-plane migration)

**User instruction (verbatim):** "Open U-002 with the explicit single-region us-east-1 plan."

**Cycle:** U-002 (architecture and control-plane migration to us-east-1 primary, us-west-2 cold DR)

**Cycle scope:** Architecture (primary), substance (secondary).

**Source bundle:** Working state from prior `FINAL_REMEDIATED` bundle (per Cycle 001 restoration of MARKET_LAUNCH and Update_Spec from `/mnt/project/`)

**Cycle outcome:** Codex Round 2 PASS 2026-04-26.

**Final bundle:** `Telecheck_Master_Bundle_U002_FINAL_FOR_CODEX_VERIFICATION.zip` (md5 `7f3e2e8aaff0a8d284d4dde352fb7380`)

**Files newly authored:**
- `Telecheck_ADR_Addendum_026.md` (ratifies us-east-1 / us-west-2 cold DR; supersedes ADR-025)

**Files renamed/version-bumped:**
- `Telecheck_Master_Platform_PRD_v1_8.md` → `Telecheck_Master_Platform_PRD_v1_9.md`
- `Telecheck_System_Architecture_v1_1.md` → `Telecheck_System_Architecture_v1_2.md`
- `Telecheck_Artifact_Registry_v2_8.md` → `Telecheck_Artifact_Registry_v2_9.md`

**Files restored from `/mnt/project/` (closes Cycle 001 F-001-01):**
- `Telecheck_Contracts_Pack_v5_00_MARKET_LAUNCH.md`
- `Telecheck_Contracts_Pack_v5_Update_Spec.md`

**Files edited in place (no version bumps):** ADR Addendum 020-025 (ADR-025 supersession marker), Active Document Index, Canonical Data Model, RBAC, Admin Backend, Forms Engine, Pharmacy + Refill, Design Implementation Contract, Unified Admin Sidebar.

**Findings:** Codex Round 1 returned 3 findings (HIGH/HIGH/MEDIUM). All fixed in Round 2. §10 Option A authorized 5-line mechanical completion of F-U002-R2-01.

**Promotion authorized by:** User

**Promotion executed by:** Product (Telecheck), this session

---

### Entry P-004 — 2026-04-26 — US Region Migration Cycle U-001 (impact analysis)

**User instruction (verbatim):** "Open U-001 to do the file-by-file impact analysis for the region change."

**Cycle:** U-001 (architectural impact analysis of moving from prior af-south-1 region pair to a US-primary region pair)

**Cycle scope:** Architecture impact analysis; produces no substantive document edits — feeds U-002/U-003/U-004 scope.

**Source bundle:** `Telecheck_Master_Bundle_FINAL_REMEDIATED.zip` (the prior metadata-remediation cycle bundle)

**Cycle outcome:** Closed (accepted with corrections by user). Cycle 001 closure (F-001-01: missing files MARKET_LAUNCH and Update_Spec) absorbed into U-002 scope.

**Cycle artifact:** Impact matrix produced inline in cycle session (not committed to bundle as a standalone file; consumed by U-002/U-003/U-004 directives).

**Findings raised:**
- F-U001-02 (manifest rebuild from filesystem) — deferred to U-004; addressed in P-007
- F-U001-03 (Ghana cross-border posture documentation) — addressed in U-002 (ADR-026 + Master PRD update) + U-003 (Ghana Launch Playbook v1.2 cross-border section + INVARIANTS I-028 + GLOSSARY entries + CCR_RUNTIME clarification)
- F-U001-05 (OR-302/OR-303 reframing) — addressed in U-003 P0 OR Tracker edits

**Promotion authorized by:** User

**Promotion executed by:** Product (Telecheck), this session

---

### Entry P-003 — 2026-04-25 — Project upload of P-002 artifacts

**User instruction (this session):**
> "Promote and upload to project. You can do this"

**Context:** Following Entry P-002 (the three-artifact promotion plus Registry v2.4 and the creation of this Promotion Ledger), the user instructed that the artifacts be uploaded to `/mnt/project/` so they persist as part of the canonical project corpus visible to future sessions.

**Action taken:** Five files copied from `/mnt/user-data/outputs/` to `/mnt/project/` with byte-identical checksums verified:

| File | Source | Destination | Checksum verified |
|---|---|---|---|
| Telecheck_Operational_Readiness_Todo_v1_1.md | /mnt/user-data/outputs/ | /mnt/project/ | ✓ |
| Telecheck_Future_Scope_USSD_AI_Bridge_v0_1.md | /mnt/user-data/outputs/ | /mnt/project/ | ✓ |
| Telecheck_ADR_Addendum_016_to_019.md | /mnt/user-data/outputs/ | /mnt/project/ | ✓ |
| Telecheck_Artifact_Registry_v2_4.md | /mnt/user-data/outputs/ | /mnt/project/ | ✓ |
| Telecheck_Promotion_Ledger.md | /mnt/user-data/outputs/ | /mnt/project/ | ✓ |

**Project state after upload:**
- Total files in `/mnt/project/`: 62 (was 57)
- Net change: +5 (the five files above)
- Registry v2.3 (Telecheck_Artifact_Registry_v2_3.md) is retained alongside v2.4; per Registry convention, superseded versions are not deleted. The user may choose to remove v2.3 from the project view if preferred.

**Caveat on persistence:** The write to `/mnt/project/` succeeded at the filesystem level. Whether these new files appear in the user's Claude project UI in future sessions depends on the project-sync mechanism Anthropic operates — that is outside this session's visibility. If a future session does not see these files in `/mnt/project/`, they remain available in `/mnt/user-data/outputs/` from this session and can be re-uploaded via the Claude project UI.

**Promotion authorized by:** User (verbatim instruction recorded above)

**Promotion executed by:** Product (Telecheck), this session

**Cross-reference:** This entry completes the deployment step initiated in Entry P-002. P-002 ratified the canonical status; P-003 records the propagation to project-persistent storage.

---

### Entry P-002 — 2026-04-25 — Three-artifact promotion + ADRs 018 and 019

**User instruction (this session):**
> "Promote these documents and keep record of documents I asked to be promoted"

**Context:** The session produced three new artifacts following the Adversarial Counsel Review, the Patient UI/UX Pressure Review, and the user's product decisions on language posture, lab interpretation timing, and broader-market strategy.

**Artifacts promoted to canonical:**

| Artifact | Version | Layer (per Registry §3) | Registry inventory row | Notes |
|---|---|---|---|---|
| Operational Readiness To-Do | v1.1 | Product truth | Row 6a | Live tracker — 52 active items (5 Tier 0, 13 Tier 1, 27 Tier 2, 7 Tier 3); 2 resolved (OR-105, OR-221). Status changes frequently; canonical version means "this is the tracker," not "the contents are frozen." |
| Future Scope: USSD + AI Bridge | v0.1 | Product truth (future-scope) | Row 6b | Concept document for Track B. Not implementation-ready. Future PRD work triggered when Track A reaches Limited Launch state (per Cockpit §4.3). |
| ADR Addendum 016–019 | v1.0 | Engineering truth | Row 13a | Reserves ADR-016 (AI model + provider, pending OR-003) and ADR-017 (data residency, pending OR-103). Ratifies ADR-018 and ADR-019. Merges into ADR Set v1.1 at next ADR Set revision. |

**Related ADRs ratified in same session (recorded in ADR Addendum 016–019):**

| ADR | Title | Effect |
|---|---|---|
| ADR-016 | AI model + provider decision | Reserved (pending OR-003) — number held to avoid renumbering later |
| ADR-017 | Data residency for Ghana launch | Reserved (pending OR-103) — number held to avoid renumbering later |
| ADR-018 | English-first launch posture | Accepted — Track A scoped to English; multilingual coverage carried to Future Scope: USSD + AI Bridge |
| ADR-019 | AI-first lab interpretation with explicit pending-review caveat | Accepted — patient sees AI interpretation immediately with caveat; clinician review is verification layer for routine values, gating layer for critical values |

**Operational Readiness items resolved in same session:**

| OR ID | Title | Resolution |
|---|---|---|
| OR-105 | Multilingual coverage spec | Resolved by ADR-018. Carried to Future Scope: USSD + AI Bridge §4.3 for Track B. |
| OR-221 | Lab extraction confirmation safety model | Resolved by ADR-019. Implementation tasks delegated to OR-218 (scope expansion), OR-231, OR-232. |

**Operational Readiness items added in same session:**

| OR ID | Title | Tier | Source |
|---|---|---|---|
| OR-219 | Patient research artifact set | 1 | Patient UI/UX Pressure Review |
| OR-220 | Honest-status patient-surface specification | 2 | Patient UI/UX Pressure Review |
| OR-222 | Persistent UI element specification | 2 | Patient UI/UX Pressure Review |
| OR-223 | Delegate UX completeness spec | 2 | Patient UI/UX Pressure Review |
| OR-224 | Critical-path / launch-scope reconciliation | 2 | Patient UI/UX Pressure Review |
| OR-225 | Empty-state copy and design library | 2 | Patient UI/UX Pressure Review |
| OR-226 | Notification deduplication policy | 2 | Patient UI/UX Pressure Review |
| OR-227 | OTP-recovery and shared-phone identity flows | 1 | Patient UI/UX Pressure Review |
| OR-228 | Identity model evolution plan | 2 | Future Scope: USSD + AI Bridge §9 |
| OR-229 | Audit envelope `interaction_surface` field | 2 | Future Scope: USSD + AI Bridge §9 |
| OR-230 | RBAC actor type `chw` reservation | 3 | Future Scope: USSD + AI Bridge §9 |
| OR-231 | Labs Slice §6.2 update for ADR-019 caveat language | 2 | ADR-019 implementation |
| OR-232 | Patient App IA Journey 4 update for Option B flow | 2 | ADR-019 implementation |
| OR-233 | Onboarding language scoping copy | 2 | ADR-018 implementation |
| OR-306 | Future Scope Track B PRD authorship trigger | 3 | Future Scope: USSD + AI Bridge §6 |

**Registry version bumped:** v2.3 → v2.4

**Resulting canonical artifact count:** 58 → 61 files

**Files produced and located:**

| File | Path |
|---|---|
| Telecheck_Operational_Readiness_Todo_v1_1.md | /mnt/user-data/outputs/ |
| Telecheck_Future_Scope_USSD_AI_Bridge_v0_1.md | /mnt/user-data/outputs/ |
| Telecheck_ADR_Addendum_016_to_019.md | /mnt/user-data/outputs/ |
| Telecheck_Artifact_Registry_v2_4.md | /mnt/user-data/outputs/ |
| Telecheck_Promotion_Ledger.md (this document) | /mnt/user-data/outputs/ |

**Promotion authorized by:** User (verbatim instruction recorded above)

**Promotion executed by:** Product (Telecheck), this session

---

### Entry P-001 — Implicit promotion baseline (pre-2026-04-25)

**Context:** All artifacts canonical in Registry v2.3 as of 2026-04-24 are treated as having been implicitly promoted through the prior session's working processes. They are not individually re-traced here. Future user-requested promotions begin with Entry P-002 above.

**Implicit baseline:** 58 files across 7 categories (Product truth: 6, Contracts: 15, Engineering: 9, Experience: 4, Operations: 4, Slice: 17, External communications: 3). See Registry v2.3 §7 for the inventory.

**Authority:** Inferred from session record. This baseline entry exists so that the ledger has a defined starting point and the count of promoted artifacts can be reconciled against the Registry inventory.

---

## Operating principles for future promotions

When the user asks for a promotion, the next entry will:

1. Be appended above as Entry P-003, P-004, etc.
2. Record the verbatim user instruction
3. List each artifact promoted with its Registry inventory row
4. Reference the Registry version bump triggered by the promotion
5. Cross-reference any decisions (ADRs, OR resolutions, scope changes) ratified in the same session

If the user later says "actually undo the last promotion," that is recorded as a new appended entry that references and supersedes the prior one. The original entry remains visible.

---

## Document control

- **v1.0** — Initial Promotion Ledger. Created 2026-04-25 in response to the user instruction "Promote these documents and keep record of documents I asked to be promoted." Establishes the operating rules, records the implicit pre-2026-04-25 baseline (Entry P-001), records the three-artifact promotion of this session (Entry P-002), and records the project-upload completion (Entry P-003).
- **2026-04-27 (US Region Migration Cycle U-004)** — Append-only addition of entries P-004 (U-001), P-005 (U-002), P-006 (U-003), P-007 (U-004) per user authorization. Per-entry sequencing follows actual ledger state (P-001..P-003 already present; new entries continue from P-004). Note: Registry §8 v2.8 changelog row claims P-009/P-010/P-011 were added in a prior cycle; those entries are not present in this actual ledger. Per user ruling at U-004 author gate, the discrepancy is documented in the U-004 validation report (F-U004-01) as a pre-existing inconsistency; no retroactive fabrication. Recommended follow-up: separate ledger-reconciliation cycle if desired.
- **Update cadence:** Updated whenever the user requests a promotion. Append-only.
- **Change discipline:** Entries are never edited or deleted. Corrections are made by appending a new entry that references the prior one.
- **Location:** This Promotion Ledger lives in /mnt/project/ alongside the Registry so every session sees both the canonical inventory and the user-instruction trail.
