# Layer 4 audit contract — proposal for independent review and ratification

Status: DRAFT. No canonical contract changes or ratification have been made.

## Finding

Sprint 1.2b is authorized to enforce the local regex pass at the clinical provider resolver. Its governing PII specification requires `pii.screener.egress_block` and `pii.screener.egress_redact`. Neither action appears in the canonical AUDIT_EVENTS catalog, its bundle amendments, or the implementation's closed `AuditAction` union at the verified handoff commits.

The Layer 1 section explicitly says screener audit events require registration through an SI extension. The current input/output screeners emit warning logs; warning logs do not satisfy Layer 4's required append-only audit evidence.

There is also a durability requirement to resolve: `withIdempotentExecution` rolls back the business transaction before mapping an exception into an HTTP response. Recording a blocked-egress event in that transaction and then throwing would erase the event. Recording a redaction there would also lose evidence if the provider receives the sanitized payload and a later business operation fails.

## Proposed narrowly scoped amendment

Register the two already-specified event names, using the existing audit envelope and storage. Proposed classification is Category B, actor `system`, sensitivity `standard`: these events record enforcement of a privacy control, contain no candidate text, and use the existing operator/compliance access and retention policy. The ratifier must confirm this classification; it affects retention and access.

| Action | Meaning | Required detail fields proposed for approval |
|---|---|---|
| `pii.screener.egress_block` | The local outbound check refused a completion before provider dispatch. | `layer: 4`, `provider`, `workload_type`, `pattern_ids`, `hit_count`, `reason` |
| `pii.screener.egress_redact` | Lower-confidence matches were replaced and the sanitized request was authorized for dispatch. This does not attest successful delivery. | `layer: 4`, `provider`, `workload_type`, `pattern_ids`, `hit_count`, `reason` |

Proposed `reason` values: `high_confidence_match`, `low_confidence_redacted`, or `screening_failed` (block only). `pattern_ids` contains only identifiers from the checked-in pattern library; `hit_count` is a nonnegative integer. A screening failure supplies no raw exception message or candidate content.

Use existing envelope fields for tenant, country, actor, target patient, resource correlation, and request context. Do not copy candidate strings, matched values, prompt text, string-derived property names, credentials, or unscreened exception messages into detail, logs, or HTTP errors. No new top-level audit fields, DB tables, roles, partitions, or permissions are proposed.

Proposed durability semantics:

1. No provider dispatch on high-confidence detection or screening failure.
2. Required evidence must commit independently of a business transaction that can subsequently roll back. Reuse the existing transaction and audit-dedupe facilities demonstrated by the crisis gate; do not create another audit store or partition.
3. A low-confidence redaction must have durable audit evidence before dispatch. If audit recording fails, no dispatch occurs.
4. A blocked call returns the specified tenant-blind `500 ai.provider.egress_blocked` only after evidence is durable. Failure to record required evidence uses the established audit-unavailable failure path and still sends no provider request.
5. Retry deduplication is tenant-scoped and must not suppress evidence of a different decision. The implementation review must verify the identity, TTL, transaction ordering, and absence of self-deadlock against the existing dedupe contract before merge.

These are proposed semantics for ratifier review, not a claim that they are already registered.

## Resolve contradictory prose explicitly

The detailed Layer 4 section requires high-confidence BLOCK and low-confidence REDACT. The document's final non-goal says Layer 4 does not block provider access and always sends a cleaned turn. Proposed clarification: preserve the detailed decision table; clean requests are forwarded, low-confidence matches are redacted, and high-confidence matches are blocked. Remove the contradictory unconditional-send sentence during the ratified amendment.

## Options

| Option | Benefit | Cost / limitation |
|---|---|---|
| A — Ratify the narrow registration and durability semantics above (implementer recommendation) | Makes the required controls implementable with durable evidence and the existing audit machinery. | Requires contract-owner approval of category, detail, retry semantics, and error behavior. |
| B — Ratify a mapping to an existing audit action and payload | Might reduce catalog growth. | No matching mapping was found; the contract owner must explicitly approve a semantically correct one. |
| C — Implement warnings only or waive the event requirement | Shortest implementation. | Does not satisfy the current specification or this goal's definition of done; not recommended. |

## Independent recommendations

Pending. The implementation session has requested authorization to use fresh subagents. No independent approval is claimed, and no implementation-context analysis has been presented as a second opinion.

## Acceptance checks after ratification

- Resolver-owned enforcement covers every real clinical adapter returned, including credential and environment fallback paths; no per-handler screening dependency.
- Scan the full assembled system prompt, prior/current turns, and any supported tool content locally. Explicitly test boundaries where the adapter joins system messages.
- A high-confidence hit causes zero outbound calls and the specified error; low-confidence hits produce `[REDACTED:PII]` and forward only cleaned content.
- Capture actual serialized HTTP bodies with a local fake transport and replay all regex checks; test every pattern family and post-match validator.
- Screening failure and audit failure both prevent dispatch. No NER call or provider-based classification occurs.
- Audit evidence survives business rollback and post-send provider failure, remains tenant-scoped, deduplicates correctly, and contains no candidate text.
- The current NER limitation remains explicit: regex checks do not establish that names or prose addresses are absent. Pilot 1 Day-0 remains gated on the separate NER decision.
- Preserve crisis-before-input-screening ordering, append-only audit, tenant isolation, and existing error behavior for unrelated failures.
- Required local checks and full PostgreSQL CI pass; independent adversarial review approves the complete diff before merge.

## Sources inspected

- Specification commit `c75d23b55960094a8c0d56d8077218eaf92eb5dd`: takeover prompt §§3, 6, 7, 8; Addendum 365; canonical `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md` (header v5.4) and bundle amendments.
- Implementation baseline `9b9158d8f2f0bdafad096283faa32d501bcb7851`: `docs/PII_SCREENING_AND_LOG_REDACTION_SPEC.md` (Layer 4, Layer 1 audit registration, non-goals); `src/lib/audit.ts`; `src/lib/idempotent-handler.ts`; `src/lib/audit-dedupe.ts`; clinical resolver, Anthropic adapter, Mode 1 chat handler, and crisis gate.

## Required authorization

The takeover contract §6 says: “Spec-corpus ratification ceremonies. You may file SIs and propose row shapes; you may NOT execute ratification.” Its standing authorization also requires independent review before merge. This proposal is prepared for those gates; it does not execute them.
