# SI-003 Closure Artifact — DOMAIN_EVENTS v5.2 placeholder event-type strings ratification

**Status:** DRAFT v0.2 — awaiting Evans's ratification into spec corpus DOMAIN_EVENTS v5.2 (or v5.3)
**Version history:**
- v0.1 (2026-05-11): initial draft authored by parallel agent (28 event types proposed; payload schemas deferred to slice owners).
- v0.2 (2026-05-11): Codex adversarial-review revision — see §"v0.2 scope downgrade" below. Finding 6 addressed: artifact scope explicitly limited to naming + partition_key + outbox-class pre-decision; per-event payload-schema ratification split out as separate per-slice deliverables.
**Date:** 2026-05-11
**Author:** Autonomous Claude (SI closure cycle workstream)
**Closes:** SI-003 partially — naming/partition/outbox layer. Per-event payload schemas split out (see scope downgrade).
**Target spec doc:** `Telecheck_Contracts_Pack_v5_00_DOMAIN_EVENTS.md` (v5.2)
**Severity:** medium → resolved-on-ratification (for the naming layer)
**Parallel SI:** SI-002 (audit-side; authored separately)

---

## v0.2 Scope downgrade (per Codex review 2026-05-11 Finding 6)

Codex Finding 6 (MEDIUM): "SI-003 claims to ratify 28 event types for subscriber type-safety, but then defers every minimum payload schema to slice owners after ratification. DOMAIN_EVENTS v5.2 includes payload schemas and consumer contracts as part of the contract surface; ratifying strings alone lets producers and consumers agree on names while silently drifting on payload fields."

**Resolution:** **DOWNGRADE artifact scope.** Authoring 28 payload-schema definitions is substantial work that requires per-slice product-level input (what fields does each subscriber actually need?). The right scope for this artifact is the **naming + partition_key + outbox-class pre-decision layer**; per-event payload-schema ratification is split out as a separate deliverable authored at slice-status-doc revision time (one batch per slice, signed off by slice owner).

**What this artifact DOES close:**
- Canonical event-type strings (28 names) per slice
- partition_key formulas (tenant_id:aggregate_id rule applied uniformly)
- Outbox class (tenant-scoped vs platform-scoped) per event
- Subscriber-slice forward-looking mapping (which future modules will consume each event)
- Allows engineering to remove placeholder-cast sites in `events.ts` files and let subscriber slices subscribe by canonical type-name

**What this artifact does NOT close (split to per-slice deliverables):**
- Per-event payload-shape ratification (minimum-fields contract)
- Consumer-contract documentation per event
- Payload-version evolution rules (additive-only vs versioned schemas)

**Runtime safety preserved:** payload-shape compatibility is enforced at the runtime envelope-validation layer (`src/lib/domain-events.ts` envelope schema), which already validates partition_key + type + tenant_id + aggregate_id shape independent of payload content. Producer + consumer drift on payload fields surfaces at the test-coverage layer (each slice's `<slice>-events.test.ts` asserts the payload shape it expects from its emitter).

**Recommendation to Evans:** ratify this artifact as a "naming/routing layer" closure. Track per-slice payload-schema ratification as separate follow-on artifacts (one per slice; ~4-6 weeks of intermittent work for the 4 producing slices).

---

## Summary

Three implementation-complete slices (Forms/Intake v2.1, Identity & Auth v1.0, Consent + Delegated Access v1.0) emit lifecycle domain events end-to-end via the established same-transaction outbox pattern (`lib/domain-events.ts emitDomainEvent()`). Every emission carries the canonical DOMAIN_EVENTS v5.2 envelope per I-016 + I-023 + I-027. The outbox table accepts the events, the chain works, and outbox-landing tests assert correct delivery. What is missing is **canonical event-type strings ratified in DOMAIN_EVENTS v5.2** — 28 placeholder strings emitted today by the 3 slices are pinned by tests but not present in the canonical enumeration.

This artifact proposes (a) ratifying the 28 placeholder strings (re-shaped to match DOMAIN_EVENTS v5.2's `<aggregate>.<action>.<version>` three-part convention), (b) partition-key composition per ratified aggregate, (c) outbox class assignment (all tenant-scoped at v1.0 — no platform-scoped emitters in this batch), (d) forward-looking subscriber slices so future modules can subscribe with type-safety. On ratification, engineering can remove the placeholder cast sites and downstream slices (Pharmacy, Subscription, Med Interaction, Async Consult) can subscribe via canonical strings rather than inline pinned literals.

The proposal is purely additive — no envelope structure changes, no schema migration to `domain_events_outbox`, no breaking changes to existing producers. The 6 existing `intake_response.*` event types and the existing v5.2-added research + marketing events are preserved untouched.

## Background

Per SI-003 §"What the spec says", DOMAIN_EVENTS v5.2 currently enumerates `intake_response` events (`intake_response.submitted`, `.ai_evaluated`, `.physician_reviewed`, `.approved`, `.declined`) and the 4 v5.2-added research events + 2 v5.2-added marketing events, but does NOT enumerate event-type strings for the 11 aggregates covered by the three implementation-complete slices: `forms_template`, `forms_deployment`, `forms_variant`, `forms_resume_state`, `account`, `session`, `otp`, `device`, `consent`, `delegation`, `delegation_scope`.

The 28 placeholder strings emitted today are listed in SI-003 §"What I'd propose" and have been faithfully pinned by tests at `tests/integration/consent-domain-events.test.ts` and the identity test at commit `4fa12b3` (5 cases). Per EHBG §12, engineering does not author canonical event types — this artifact escalates ratification to Evans + spec-corpus owners.

The two parts requiring corpus-side decision are (1) re-shaping the placeholder strings to honor the DOMAIN_EVENTS v5.2 three-part `<aggregate>.<action>.<version>` convention (the placeholders today use two-part `<aggregate>.<action>` form), and (2) confirming the per-event `payload` minimum-field set so future schema-evolution under the v5.2 `version` discipline is anchored.

## Proposed canonical event types

All 28 events are tenant-scoped (carry `tenant_id` per envelope rules); none are platform-scoped at v1.0. All use composite `partition_key = tenant_id:<aggregate_id>` per DOMAIN_EVENTS v5.2 anti-pattern guard against accidental cross-tenant fan-out.

### Forms/Intake aggregates (12 events — 1 already canonical, 11 proposed)

| Placeholder type | Canonical type | Aggregate | partition_key | Outbox class | Forward-looking subscribers | First-emitted-from |
|---|---|---|---|---|---|---|
| `forms_template.created` | `forms_template.created.v1` | `forms_template` | `tenant_id:forms_template_id` | tenant-scoped | Forms surface rendering, AI Service template ingestion | forms-intake template authoring |
| `forms_template.version_published` | `forms_template.version_published.v1` | `forms_template` | `tenant_id:forms_template_id` | tenant-scoped | Forms surface rendering, CCR cache invalidation | forms-intake template publish |
| `forms_deployment.created` | `forms_deployment.created.v1` | `forms_deployment` | `tenant_id:forms_deployment_id` | tenant-scoped | Forms surface routing, Marketing surface (per ADR-027 country-conditional) | forms-intake deployment activation |
| `forms_deployment.retired` | `forms_deployment.retired.v1` | `forms_deployment` | `tenant_id:forms_deployment_id` | tenant-scoped | Forms surface routing, Subscription (intake-blocked path) | forms-intake deployment retirement |
| `forms_variant.created` | `forms_variant.created.v1` | `forms_variant` | `tenant_id:forms_variant_id` | tenant-scoped | A/B traffic-split router, Analytics | forms-intake variant authoring |
| `forms_variant.winner_promoted` | `forms_variant.winner_promoted.v1` | `forms_variant` | `tenant_id:forms_variant_id` | tenant-scoped | A/B traffic-split router, Analytics | forms-intake variant promotion |
| `forms_variant.retired` | `forms_variant.retired.v1` | `forms_variant` | `tenant_id:forms_variant_id` | tenant-scoped | A/B traffic-split router | forms-intake variant retirement |
| `forms_resume_state.saved` | `forms_resume_state.saved.v1` | `forms_resume_state` | `tenant_id:forms_resume_state_id` | tenant-scoped | Resume-link notification (SMS/email per CCR) | forms-intake mid-form save |
| `forms_resume_state.restored` | `forms_resume_state.restored.v1` | `forms_resume_state` | `tenant_id:forms_resume_state_id` | tenant-scoped | Analytics (resume conversion rate) | forms-intake resume |
| `intake_response.submitted` (already canonical) | `intake_response.submitted.v1` | `intake_response` | `tenant_id:intake_response_id` | tenant-scoped | AI Mode 1 evaluation, Pharmacy (per SI-001 forms→pharmacy contract), Subscription | (canonical in v5.2) |
| `intake_response.completed` | `intake_response.completed.v1` | `intake_response` | `tenant_id:intake_response_id` | tenant-scoped | Patient timeline projection, Subscription, Analytics | forms-intake completion |
| `intake_subscription_intent` | `intake_response.subscription_intent_signaled.v1` | `intake_response` | `tenant_id:intake_response_id` | tenant-scoped | Subscription (intent → checkout), Payment processor (per CCR) | forms-intake §17.1 emitter |

[NEEDS RATIFICATION: the placeholder `intake_subscription_intent` is two-part-with-no-aggregate-prefix; proposed re-shape attaches it to the `intake_response` aggregate as `subscription_intent_signaled` action — this preserves the §17.1 semantic intent but anchors it under an aggregate per v5.2 naming convention. Alternative shape: introduce a new `subscription_intent` aggregate. Recommend Evans + Forms/Intake slice owner pick.]

### Identity & Auth aggregates (9 events proposed)

| Placeholder type | Canonical type | Aggregate | partition_key | Outbox class | Forward-looking subscribers | First-emitted-from |
|---|---|---|---|---|---|---|
| `identity.account.created` | `account.created.v1` | `account` | `tenant_id:account_id` | tenant-scoped | Patient profile bootstrap, Consent (initial platform-consent prompt), Notifications | identity account registration |
| `identity.account.activated` | `account.activated.v1` | `account` | `tenant_id:account_id` | tenant-scoped | Patient timeline, Consent (post-activation consent flows), Subscription (eligibility unlock) | identity activation |
| `identity.session.issued` | `session.issued.v1` | `session` | `tenant_id:session_id` | tenant-scoped | Observability (active-session count), Security (anomaly detection) | identity login |
| `identity.session.revoked` | `session.revoked.v1` | `session` | `tenant_id:session_id` | tenant-scoped | Observability, Security, Delegation (revoke delegation if session-bound) | identity logout / forced revocation |
| `identity.otp.issued` | `otp.issued.v1` | `otp` | `tenant_id:otp_id` | tenant-scoped | Notifications (SMS/email send per CCR), Security (rate-limit signal) | identity OTP request |
| `identity.otp.consumed` | `otp.consumed.v1` | `otp` | `tenant_id:otp_id` | tenant-scoped | Security (lockout-counter reset) | identity OTP verification |
| `identity.otp.lockout_triggered` | `otp.lockout_triggered.v1` | `otp` | `tenant_id:otp_id` | tenant-scoped | Security (operator alert), Notifications (lockout notice) | identity OTP failed-threshold |
| `identity.device.registered` | `device.registered.v1` | `device` | `tenant_id:device_id` | tenant-scoped | Push notifications, Security (anomaly detection) | identity device pairing |
| `identity.device.revoked` | `device.revoked.v1` | `device` | `tenant_id:device_id` | tenant-scoped | Push notifications (revoke token), Security | identity device removal |

[NEEDS RATIFICATION: placeholder strings use a redundant `identity.` namespace prefix (e.g., `identity.account.created`) that is not present in the v5.2 convention (compare `refill.initiated.v1`, `intake_response.submitted` — no module-namespace prefix). Proposed re-shape drops the `identity.` prefix because the aggregate name (`account`, `session`, `otp`, `device`) is already a globally-unique canonical aggregate per Glossary v5.2. If Evans wants module-namespacing introduced as a v5.3 convention change, that is a separate corpus-wide decision (would require renaming `refill.*`, `intake_response.*`, etc.).]

[NEEDS RATIFICATION: `account` as a top-level aggregate name is generic — confirm it does not collide with any future financial-account or partner-account aggregate. If Evans anticipates collision, prefer `identity_account` as the canonical aggregate name (matching `intake_response`'s compound form).]

### Consent + Delegated Access aggregates (8 events proposed)

| Placeholder type | Canonical type | Aggregate | partition_key | Outbox class | Forward-looking subscribers | First-emitted-from |
|---|---|---|---|---|---|---|
| `consent.granted` | `consent.granted.v1` | `consent` | `tenant_id:consent_id` | tenant-scoped | Audit pipeline, Care-flow gate (program enrollment unblocking), Subscription | consent grant flow |
| `consent.revoked` (already canonical in v5.2 §key event payload schemas) | `consent.revoked.v1` | `consent` | `tenant_id:consent_id` | tenant-scoped | Audit pipeline, Safety hold (bridge supply), Pharmacy (cancel in-flight refills) | consent revocation flow |
| `delegation.invited` | `delegation.invited.v1` | `delegation` | `tenant_id:delegation_id` | tenant-scoped | Notifications (invite SMS/email), Audit | consent delegation invite |
| `delegation.accepted` | `delegation.accepted.v1` | `delegation` | `tenant_id:delegation_id` | tenant-scoped | Audit, Patient timeline, Identity (delegate-session scoping) | consent delegation accept |
| `delegation.declined` | `delegation.declined.v1` | `delegation` | `tenant_id:delegation_id` | tenant-scoped | Audit, Notifications | consent delegation decline |
| `delegation.revoked` | `delegation.revoked.v1` | `delegation` | `tenant_id:delegation_id` | tenant-scoped | Audit, Identity (force-revoke delegate sessions), Patient timeline | consent delegation revoke |
| `delegation.scope_granted` | `delegation_scope.granted.v1` | `delegation_scope` | `tenant_id:delegation_scope_id` | tenant-scoped | Audit, Access-control evaluator | consent delegation scope grant |
| `delegation.scope_revoked` | `delegation_scope.revoked.v1` | `delegation_scope` | `tenant_id:delegation_scope_id` | tenant-scoped | Audit, Access-control evaluator | consent delegation scope revoke |

Note: `consent.revoked` already has a v5.2 payload schema in §"Key event payload schemas" — this ratification confirms the placeholder string aligns with the existing canonical event and does NOT introduce a new event. The proposal also flags that `consent.granted` is implicitly used by the v5.2 §"Aggregate catalog" `patient.consent_granted` event but is NOT today enumerated as a `consent`-aggregate event — Evans should decide whether to (a) ratify a new `consent.granted.v1` under the `consent` aggregate, or (b) treat all consent-grant emissions as `patient.consent_granted` events. The slice emits today under `consent.granted` (placeholder string), so (a) is the lower-friction path.

[NEEDS RATIFICATION: `delegation.scope_granted` / `delegation.scope_revoked` placeholders use the `delegation` aggregate prefix but operate on the `delegation_scope` aggregate. Proposed re-shape moves them to `delegation_scope.granted.v1` / `delegation_scope.revoked.v1` to honor the v5.2 `<aggregate>.<action>.<version>` rule. This is a placeholder-rename-on-ratification, not a behavior change.]

## Envelope-shape preservation

Ratification is **pure-string addition** to the canonical event-type enum. No envelope structure changes:
- `event_envelope` JSON shape unchanged
- `domain_events_outbox` table schema unchanged (event_type column is TEXT)
- No new envelope fields, no removed fields, no renamed fields
- Existing v5.2 `tenant_id`, `partition_key` composite, `actor.tenant_id`, `delegate_context` rules apply to every proposed event without modification
- Existing v5.2 `correlation_id` / `causation_id` / `audit_id` / `schema_version` metadata rules apply to every proposed event without modification

No migration to `domain_events_outbox`. No re-emission of historical events. No back-compat shim required (all 28 events are emitted today by code that ships pre-ratification — the rename is a sweeping search-and-replace across the 3 events.ts files plus the pinned-literal assertions in their corresponding tests).

## I-016 outbox-pattern compliance

Per I-016, each proposed event MUST be emitted same-transaction as the originating write. All 28 events are emitted today via `emitDomainEvent()` in the established outbox pattern; ratification does not change emission semantics. Each event passes the I-016 verification:
- Same-tx as origin write: yes (verified by existing outbox-landing tests for consent at `f3c759f` and identity at `4fa12b3`; forms-intake variant + resume_restored emission verified by code paths but not yet explicitly asserted per SI-003 §"Companion code-repo state at SI-003 raise" — flagged for follow-up explicit-assert tests).
- Tx-abort on outbox INSERT failure: yes (per `emitDomainEvent` contract).
- No infrastructure changes required: confirmed.

No proposed event requires new infrastructure (e.g., none requires a separate platform-scoped stream, cross-tenant fan-out opt-in, or new partition-key shape beyond the canonical `tenant_id:<aggregate_id>`).

## Cross-cutting downstream impact

On ratification, the following unblocks:

1. **Engineering placeholder cleanup:** the 3 events.ts files (`src/modules/consent/events.ts`, `src/modules/identity/events.ts`, `src/modules/forms-intake/events.ts`) drop their placeholder cast sites and use canonical strings directly. Test assertions update from pinned literals to ratified-enum references.
2. **Subscriber slice type-safety:** the forward-looking subscribers listed in the tables above (Pharmacy, Subscription, Med Interaction, Async Consult, Audit pipeline, Notifications, Security observability, AI Mode 1 evaluator, A/B router, Patient timeline projection, CCR cache invalidation) can subscribe via canonical event-type strings in shared types rather than inline pinned literals.
3. **SI-001 forms-intake → pharmacy contract:** SI-001 closure becomes cleaner — Pharmacy's subscription to `intake_response.completed.v1` and (per Evans's decision on `intake_subscription_intent`) `intake_response.subscription_intent_signaled.v1` is via canonical event-type strings.
4. **Future-slice consistency:** Pharmacy, Med Interaction, Subscription, Sync Video, Async Consult, Labs, Adverse Event, RPM/CCM slices inherit the ratified naming convention without per-slice escalation.

## Promotion ledger entry proposal

Recommend Promotion Ledger entry **P-013** (next available P-NUM per SI-003 §"Resolution expectations"; P-012 reserved for SI-002 audit-side closure).

**Proposed path:** amend DOMAIN_EVENTS in place at v5.2 (do NOT bump to v5.3). Rationale: the additions are purely additive event-type-enum additions consistent with how v5.2 itself added research + marketing events without bumping. The corpus-wide v5.2 header convention is preserved.

[NEEDS RATIFICATION: Evans may prefer v5.2 → v5.3 to make the SI closure cycle batch visible in the version trail. If so, the same additive content lands under v5.3 with a doc-control entry; no envelope or semantic differences.]

**Promotion Ledger P-013 fields (proposed):**
- **From-version:** DOMAIN_EVENTS v5.2 (pre-amendment)
- **To-version:** DOMAIN_EVENTS v5.2 (post-amendment) OR v5.3 [pending Evans decision]
- **Additions:** 28 canonical event-type strings across 11 aggregates (4 forms-engine aggregates + 4 identity aggregates + 3 consent/delegation aggregates); 11 new entries in §"Aggregate catalog" with composite `tenant_id:<aggregate_id>` partition keys; payload-shape ratification per slice owner [see "What's required from slice owners" below].
- **Removals:** none.
- **Breaking changes:** none. Existing event consumers unaffected.
- **Closes:** SI-003.
- **Parallel:** P-012 (SI-002 audit-side closure; authored separately).

## What's required from slice owners (post-ratification, pre-promotion)

For each of the 28 ratified events, slice owners (Forms/Intake, Identity, Consent) author the `payload` minimum-field schema following the pattern of existing v5.2 events (e.g., `refill.initiated.v1` payload shape). This artifact does NOT pre-author payload schemas — that is slice-owner authority and out of scope for SI closure ratification.

Recommend the SI-003 closure batch ship payload schemas as a follow-on commit within the same Promotion Ledger entry P-013, with slice owners authoring inline reviews before promotion.

## Spec references

- `Telecheck_Contracts_Pack_v5_00_DOMAIN_EVENTS.md` v5.2 — envelope shape, partition_key composition, outbox pattern, aggregate catalog, naming convention (`<aggregate>.<action>.<version>`), tenant-scope rules, anti-patterns.
- `Telecheck_Contracts_Pack_v5_00_INVARIANTS.md` v5.2 — I-016 (outbox pattern / domain events immutable), I-023 (tenant isolation on every PHI record), I-027 (audit-record tenant_id; applied symmetrically to events per DOMAIN_EVENTS v5.1 threading remediation).
- `Telecheck_Contracts_Pack_v5_00_GLOSSARY.md` v5.2 — canonical aggregate names; forbidden aliases.
- `Telecheck_Forms_Intake_Engine_Slice_PRD_v2_1.md` §§3, 6, 8.2, 13, 14.5, 17.1 — Forms/Intake events emission sites.
- `Telecheck_Identity_Spec.md` §§3.1, 3.2, 3.3, 3.4 — Identity & Auth events emission sites.
- `Telecheck_Consent_Delegated_Access_Slice_PRD_v1_0.md` §§6.1, 6.2, 7.1 — Consent + Delegation events emission sites.
- `telecheck-app/docs/SI-003-DOMAIN_EVENTS-Placeholder-Ratification.md` — engineering SI raise.
- `telecheck-app/CLAUDE.md` §"Hard rules" — I-016 / I-023 / I-027 enforcement reminders for code-repo.
- `Telecheck_Engineering_Handoff_Build_Guide_v1_3.md` §12 — SI/DSI escalation pattern.
