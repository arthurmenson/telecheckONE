# Decision request — Sprint 1.2b Layer 4 audit contract

**Status: DRAFT / NOT RATIFIED.** Prepared 2026-09-06. The user's authorization to use fresh independent reviewers has been exercised; it does not itself approve this canonical amendment.

## Decision requested

Ratify **Option A in the [Pass 2 synthesis, §§3–5](Layer-4-contract-independent-pass-2.md)**: register `pii.screener.egress_block` and `pii.screener.egress_redact` with the concrete classifications, fields, attribution, and semantics specified there. The contract uses the existing audit envelope, tenant-governance partition, storage, and idempotency facilities.

The proposed events are unsampled Category B, system actor, standard sensitivity. For the existing Mode 1 path, they use the trusted tenant and `system:ai_mode_1`, existing workload/autonomy fields, conversation resource, and verified patient/turn identifiers in detail. They contain pattern identifiers/counts and a closed reason, never prompt text or matched values. Screening failure is explicitly an unassessed, fail-closed decision.

Required evidence commits independently before a blocked error is returned or a redacted request is sent. An audit failure prevents sending and uses the existing 503 audit-unavailable response; a recorded block uses the specified `500 ai.provider.egress_blocked`. Marker and event commit atomically. Retries deduplicate equivalent local decisions without suppressing changed candidates or post-expiry requests. These events do not attest vendor receipt or external exactly-once delivery.

The amendment also reconciles the unconditional-send non-goal with the detailed rule: clean requests proceed, lower-confidence hits are redacted, and high-confidence hits block. The exact Mode 1 mapping, action/reason combinations, count semantics, and retry boundary are in the linked synthesis; this summary does not replace those provisions.

## Three views preserved for the ratifier

| View | Recommendation and contribution |
|---|---|
| [Implementer's original recommendation](Layer-4-audit-contract-proposal.md) | Option A: narrowly register the two events and require durable pre-send evidence. This original is preserved unchanged, including its historical pending-review text. |
| [Fresh independent Pass 1](Layer-4-contract-independent-pass-1.md) | Independently agrees that a narrow ratification is needed. Adds marker expiry, atomicity, real-connection test requirements, fixed-probe scope, and the distinction between local decisions and provider delivery. It was completed before the reviewer saw the implementer's proposal. |
| [Independent Pass 2 synthesis](Layer-4-contract-independent-pass-2.md) | Recommends the concrete Option A above. Reconciles the two reads; specifies existing attribution/partition, correct workload field names, truthful failure/count meanings, correlation after rollback, and equivalent-decision retry semantics. |

The implementer adopts the synthesized Option A as the proposed next step while preserving the original recommendation for comparison. Agreement across the reviews is a recommendation, not a ratification.

An existing-action substitution remains an alternative only if a suitable meaning is identified and explicitly approved; neither independent assessment found one. Warning-only behavior cannot satisfy the current sprint acceptance criteria. A provider-delivery ledger or outbox is outside this request.

## Evidence and work already completed

- Streaming prerequisite [app PR #282](https://github.com/arthurmenson/telecheck-app/pull/282) was independently approved and merged as `bbfbe534bdfb111b824de3aa409a03259fb5756d`, with all four CI workflows green. The continuity record [spec PR #19](https://github.com/arthurmenson/telecheckONE/pull/19) was independently approved and merged as `9fd71a5553a401235205d36ce86698368cd451fd`: Addendum 366, cockpit revision 471.
- Layer 4 [draft app PR #283](https://github.com/arthurmenson/telecheck-app/pull/283) is at `15226aa83ec99f6091bfb83fb1c1556e3e0cef3d`, rebased onto the streaming fix. Fresh R1 found a redaction-boundary bypass; it was fixed and independently approved in a fresh R2 review of the full component diff.
- Corrected components: 78 tests pass; DB-free suite 235 passed / 5 documented expected failures; full PostgreSQL CI 185 files / 2,904 passed / 6 expected failures / 3 skipped / 30 TODOs. Static checks and all four CI workflows pass. These results certify the current components, not the missing production enforcement.
- Production resolver wiring, durable recording, HTTP mapping, and real-transaction acceptance tests remain open. The complete implementation will receive fresh independent review and full CI before merge.

## Why an explicit decision is required

The takeover contract §6 states: “Spec-corpus ratification ceremonies. You may file SIs and propose row shapes; you may NOT execute ratification.” The repository's hard floor also reserves canonical contract amendments outside existing ratified scope for the ratifier. Neither named Layer 4 event appears in the canonical audit catalog at the verified handoff baseline. Registration settles retention/access classification, attribution, and durable event meaning; it is not merely adding TypeScript strings.

Approval of Option A would authorize the bounded spec amendment and downstream implementation subject to normal review and CI. It would not authorize deployment, Pilot 1 Day-0, a NER policy change, new database schemas/roles/partitions, or an external delivery coordinator. The separate launch gates remain unchanged.

## Ratifier decision

Pending. No approval, rejection, or waiver has been supplied for this amendment.
