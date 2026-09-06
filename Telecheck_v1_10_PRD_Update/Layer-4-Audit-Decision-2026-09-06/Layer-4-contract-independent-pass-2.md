# Layer 4 contract — Pass 2 contrast and synthesis

**Verdict: recommend-pass-2 — recommend Option A, the narrow registration and durability amendment below, for explicit ratifier approval. Do not treat review agreement as ratification.**

This consult compares the independently written `Layer-4-contract-independent-pass-1.md` with the implementer's `Layer-4-audit-contract-proposal.md`. Both original files are preserved. Their SHA-256 digests at comparison time were respectively `E6A74479CAD213CFF5026483ECD3E9B21B2BE8D7E17AE7337FFCF4CCAA41F315` and `8EDE71B504B9FFFDFAF9F5CE9EC64D9C39C923A2453D0073CD0FCA452A918BA8`.

The source baselines remain app `9b9158d8f2f0bdafad096283faa32d501bcb7851` and spec `c75d23b55960094a8c0d56d8077218eaf92eb5dd`. This is contract synthesis, not approval of the current implementation diff. No application/spec source was modified and no ratification was performed. The user's authorization to obtain fresh independent reviews does not authorize this canonical amendment.

## 1. Where the independent assessments agree

Both find that the local regex sanitizer, clinical-resolver wrapper, and specified high-confidence block/low-confidence redaction behavior are already within Sprint 1.2b authority. Both independently find no canonical registration of `pii.screener.egress_block` or `pii.screener.egress_redact`, and reject logs as substitutes for the requested append-only evidence.

Both recommend Category B privacy-governance evidence and the existing audit machinery. Both require evidence to survive the business transaction's rollback, require durable redaction evidence before dispatch, prohibit candidate text from evidence/errors/logs, and distinguish sanitization from delivery. Both preserve crisis-first ordering, the regex-only Layer 4 scope, the known NER limitation, and the separate Pilot 1 startup gate.

The shared next step is a narrow ratifier decision, followed by implementation and independent validation. It is not permission to introduce a provider ledger, outbox, DB role, partition, or new lifecycle schema.

## 2. Differences, omissions, and corrections

| Topic | Implementer's independent proposal | Pass 1 | Synthesis |
|---|---|---|---|
| Classification | B / system / standard | B unsampled / standard preferred; attribution to be pinned | Keep B / system / standard and explicitly unsampled. Specify the existing tenant-governance partition and real operating-tenant attribution. |
| Event payload | Concrete six-field detail proposal | Semantic requirements, no exact detail schema | Use a small exact detail contract, remove duplicated workload naming, add the minimum stable subject/turn correlation needed when business rows roll back. |
| Screening failure | Proposes `screening_failed` under block | Says no dispatch on incomplete inspection; leaves event details open | Approve this as an explicit reason extension, not an already-ratified requirement. It is not evidence that PII was detected. |
| Counts | Any nonnegative integer | Flags truthful evidence but does not pin counting | Match reasons require positive observed-match counts; incomplete screening uses an unknown count, never a claimed zero-hit pass. Define overlap/count semantics. |
| Scope of `egress_redact` | `layer: 4` proposed | Flags name also used for Layer 2 | `layer: 4` makes this registration explicitly vendor-outbound. It does not implement or ratify Layer 2's missing emitter through implication. |
| Retry unit | Must not suppress a different decision | Equivalent local decision for a logical outbound candidate | Adopt the Pass 1 unit, with material candidate/decision changes excluded from dedupe. State clearly that the record is not per transport attempt. |
| Marker semantics | Reuse existing facilities; review TTL and ordering | Finds atomicity prose and expired-marker defects | Reuse the actual atomic caller pattern; verify/repair expiry handling within the existing schema. Do not import the stale claimed-marker-without-event limitation into the new contract. |
| Alternate options | Existing-action mapping; warnings/waiver | Interim incomplete control; broad delivery coordinator | Existing-action mapping remains possible only if a suitable meaning is actually identified and ratified. Neither assessment found one. Warnings-only cannot close the sprint; broad delivery coordination is excluded. |
| Verification | Fake HTTP bodies and full PostgreSQL CI | Adds real connections, rollback/commit proof, fixed ping inventory | Require both. A green suite using nested savepoints is insufficient evidence for independent durability. |

The proposal's phrase “use existing envelope fields for … request context” needs correction: the implemented `AuditEnvelope` has no general `request_id` or `correlation_id` field. Do not invent one or rely on stale skill examples. Existing resource fields and explicitly approved action detail provide correlation. Likewise, use the real `ai_workload_type` and `autonomy_level` envelope names rather than the request DTO's `workload_type` name duplicated in detail.

Pass 1 also needed tightening. It left category attribution and the retry unit somewhat abstract and offered several implementation possibilities. A ratifier should receive one concrete option, not have to infer these choices from that discussion. The option below supplies them. Its additional detail fields are a proposed definition of the two requested actions within the existing JSON `detail` surface, not new CDM columns or a new platform schema.

## 3. Option A — concrete, narrow proposal for approval

### A1. Purpose, scope, and classification

Register the two names already required by the Layer 4 spec as **unsampled Category B, `actor_type: system`, `audit_sensitivity_level: standard`** privacy-enforcement decision events. Use the **existing P2 tenant-governance scope**, deterministically, for both actions. No new partition algorithm or tenantless tier is authorized.

For the initial, currently implemented Mode 1 emitter:

- `tenant_id` and `country_of_care` come from the authenticated request's resolved operating-tenant context.
- Use the existing Mode 1 system identity `system:ai_mode_1`, with `actor_tenant_id` set to the real operating tenant. Do not label the patient's account ID as a system actor.
- `target_patient_id` is null for this P2 governance event. The affected patient remains explicitly correlated in the action detail below; P2 does not mean losing the subject.
- `resource_type` is the existing `ai_chat_session`; `resource_id` is the validated or server-derived conversation ID. It identifies the attempted context and need not imply that a conversation INSERT later committed.
- Populate existing envelope `ai_workload_type: conversational_assistant` and `autonomy_level: advisory`. These record the attempted workload context; the system actor describes the local control performing the decision.
- Use the existing envelope's other required fields with their existing meanings. No fabricated patient, tenant, credential, or missing-resource sentinel is permitted.

This initial emitter definition covers the live Mode 1 clinical completion path and adapters serving that path. It does not enable the currently Null-provider Mode 2 path or declare its attribution contract complete. New clinical call surfaces need their ordinary source/attribution mapping before becoming live; the resolver-owned sanitization control still remains mandatory.

The patient/nonpatient boundary is therefore explicit:

| Caller | Mapping and scope |
|---|---|
| Live Mode 1 patient completion | `system:ai_mode_1`; real tenant/country; `target_patient_id: null` for P2; `resource_type: ai_chat_session`, `resource_id: conversationId`; verified `patient_id` and deterministic `message_id` in detail; `conversational_assistant` / `advisory`. |
| Tenant-scoped nonpatient candidate completion | No such live candidate caller was found in the baseline. This option does not invent one or a default resource tuple. If one is later introduced, its existing ratified service actor and resource tuple must be supplied from trusted context; the tenant remains real and `target_patient_id` remains null. A caller without that mapping fails closed. Its slice contract must establish any necessary nonpatient detail variant before activation; that is not a decision needed to finish current Mode 1 Layer 4. |
| Existing platform-admin fixed `ping` probe | It sends no candidate content and is not a new tenant-scoped nonpatient candidate route. Keep its literal-only scope explicit. Do not emit a synthetic Layer 4 match event, populate patient/message IDs, or use the provider request's `PLATFORM` placeholder as an audit tenant. |
| Current Mode 2 case-prep | Null provider, hence no external send at baseline. The existing source maps its AI context to `protocol_execution` / `action_with_confirm` and uses `system:ai_mode_2_case_prep`; this option does not enable real Mode 2 or transplant Mode 1 conversation/message IDs onto a workflow resource. |

Choosing helper names, validating these already-established IDs, and projecting these constants from the current trusted call site are ordinary implementation work. Approving the event's deterministic P2 routing and the subject/turn evidence that remains after rollback is the canonical decision. It would be unnecessary expansion to ask the ratifier to invent actor/resource mappings for absent future callers now.

### A2. Exact detail and action/reason combinations

| Detail key | Proposed meaning / constraint |
|---|---|
| `layer` | Exactly `4`; means local vendor-outbound screening, distinct from Layer 2 model-output screening. |
| `provider` | One of the existing external clinical adapter identifiers: `anthropic`, `bedrock_claude`, `azure_openai`. Runtime emission uses the actually selected, trusted adapter name; only `anthropic` has a real adapter in the baseline. Do not mix credential-store aliases such as `aws_bedrock` with `bedrock_claude`, or copy an arbitrary caller string. `null` and `llama_self_hosted` are excluded from this external-clinical event definition. No provider/model is activated by allowing its existing name. |
| `patient_id` | Verified affected patient account ID, sourced from the current authenticated Mode 1 context; an ID, never patient text. |
| `message_id` | Existing deterministic Mode 1 turn/message ID. Together with the envelope's conversation resource, this keeps evidence attributable even if admission/result rows roll back. |
| `pattern_ids` | Sorted distinct identifiers from the checked-in regex library observed throughout the bounded inspection that reached a definitive block or sanitized result, including matches newly exposed in intermediate redacted text. No matched values or free-text property paths. Empty on `screening_failed`, meaning no completed decision's match inventory is asserted. |
| `hit_count` | Positive integer for a definitive match-based block or sanitized result; number of pattern-match observations across the bounded passes over the assembled candidate and its successive redacted forms. Each match occurrence reported in a pass contributes one observation; different patterns may overlap and later passes may expose additional matches. This is not a count of people, unique original PII tokens, or replacement operations. Null on `screening_failed`, meaning unassessed. |
| `reason` | Only the action-specific values below. No raw exception text. |

`workload_type` is omitted from detail: the envelope already carries `ai_workload_type` and `autonomy_level`. The two correlation key names above reuse existing Mode 1/crisis audit vocabulary rather than introducing new top-level request fields.

Allowed combinations are closed:

1. `pii.screener.egress_block` + `high_confidence_match`: local inspection reached a definitive blocking result by finding at least one high-confidence regex hit, whether in the original assembled text or exposed by a later rewrite; `hit_count > 0`, `pattern_ids` nonempty and includes at least one high-confidence pattern. Include earlier low-confidence observations and the newly exposed high-confidence observation in the aggregate. If low-confidence matches coexist, block still wins. No redaction event is required for a candidate that was never authorized to send.
2. `pii.screener.egress_block` + `screening_failed`: the control could not safely complete inspection or validate a supported provider candidate, including exhaustion of the bounded pass budget without reaching a match-free result or a definitive high-confidence block. `hit_count: null`, `pattern_ids: []`, even if partial passes observed low-confidence matches. This says the boundary failed closed; it does not claim a completed PII inventory or a zero-hit pass. This reason is expressly included in the proposed approval because the current detailed Layer 4 text only explicitly names match handling.
3. `pii.screener.egress_redact` + `low_confidence_redacted`: the full bounded inspection observed only lower-confidence matches, redacted them, and reached a final match-free pass on the candidate eligible for dispatch; `hit_count > 0`, all listed patterns low-confidence. Include lower-confidence matches newly exposed and removed on later passes. The record attests the local sanitization decision before possible dispatch, never successful dispatch, vendor receipt, or completed chat persistence.

There is no event for an initially no-hit candidate under this amendment, no fourth reason, and no best-effort sampling allowance. A scanner failure after partial work must not be mislabeled as a completed zero-hit inspection. “One inspection” means the full bounded screening process, not one regex pass on the original input. Its aggregate includes observations from the original assembled text and every successively redacted form inspected before the final decision. This is distinct from incorrectly adding duplicate statistics from both unassembled source components and the assembled original candidate. `pattern_ids` is deduplicated across the full process; `hit_count` counts the process's match observations rather than deduplicating them into unique original tokens.

**Clarification prompted by the independent component review:** redaction can create a new word boundary or context that exposes another pattern. For example, an IPv6-prefix redaction can expose an MRN (high-confidence: block) or a context-bound passport (low-confidence: redact and inspect again). Those newly exposed observations belong in the match-based decision's `pattern_ids` and `hit_count`. No candidate is released merely because its original text was scanned: release follows a match-free pass, with high-confidence detection at any pass taking precedence. A bounded algorithm and its pass limit are implementation controls for enforcing the existing clean-payload requirement; this clarification creates no new audit primitive or policy. The `screening_failed` unknown-count shape remains unchanged for a process that cannot reach a definitive safe result.

Do not store prompt text, matched strings, unknown field names, arbitrary error messages, API keys, raw request bodies, or standalone candidate-text hashes in these events. Candidate-derived fingerprints, if needed internally for dedupe, remain opaque within the existing marker key; they are not an additional audit payload field.

### A3. Durability and error behavior

The audited fact is the local refusal or sanitization decision. Its truth does not depend on the later business transaction committing. Before returning a handled block or dispatching a redacted candidate, the event must have committed in a **fresh tenant-bound audit transaction**, separate from the chat business transaction.

If deduping, claim the marker and INSERT the event within that same audit transaction; commit them together. Never independently commit a marker and then try to emit. A marker used as proof of prior evidence must be produced only by this atomic discipline. Use the existing audit table and hash-chain machinery without modification to partition algorithms or permissions.

- High-confidence block or screening failure: no provider call; after durable evidence, throw the local block error so the business transaction and reservation roll back; map to the already-specified tenant-blind `500 ai.provider.egress_blocked`.
- Redaction: after durable evidence, dispatch only the immutable, locally inspected sanitized snapshot. Later provider failure or business rollback cannot erase the decision record.
- Required audit cannot commit: no provider call and no successful block-recording claim. Use the existing audit-unavailable 503 path, with a safe generic message; do not route the failure through the provider-unavailable 200 fail-soft branch. The current Mode 1 handler's `ai_chat.audit_emission_unavailable` code can be reused for required-audit failure. Its wording can be generalized from “response audit” to “required audit” as an ordinary implementation edit.
- A lost audit COMMIT acknowledgement is an unknown commit outcome. Fail closed on that attempt. On retry, the atomic marker distinguishes a committed prior event from a rolled-back attempt without needing a new recovery store.

The crisis audit-failure exception does not extend to vendor dispatch. If storage is unavailable or a process dies before the independent audit commit, this amendment promises no dispatch, not impossible evidence durability during total database failure. The retry can later produce evidence. An audit outbox is not part of this option.

### A4. Retry semantics

The event unit is **one equivalent local screening decision for a logical outbound candidate within the existing endpoint's idempotency window**. It is not one record per HTTP invocation, network attempt, or possible vendor receipt.

- A completed idempotent replay performs no new send and emits no new Layer 4 decision.
- After business rollback, retry runs the screening again. A committed marker may suppress only an equivalent evidence emission, never the screening itself.
- Tenant, originating authenticated actor, endpoint, idempotency key, original request-body identity, Layer 4 surface/action, and material candidate/decision identity must distinguish unrelated evidence. A changed system prompt, history snapshot, supported tool content, provider, rule version, or decision must not be silently covered by a materially different old record.
- After the effective idempotency window expires and the same key is accepted as a new request, a stale marker must not suppress the new event. Equal TTL lengths do not by themselves establish equal expiry boundaries.
- Competing equivalent claims must commit at most one matching decision event; an audit failure rolls back the marker so a retry can emit. Distinct tenant/actor/body/action/candidate decisions remain independent.

The exact safe fingerprint construction, dedupe discriminator encoding, expiry-reclamation SQL, and transaction helper signature are implementation choices under this semantic contract. No new marker columns or generation ledger are requested. The existing helper's expiry defect must be fixed or avoided coherently and tested before claiming these semantics.

This does not provide external exactly-once. A sanitized send may succeed before the business transaction rolls back, and a retry may send another sanitized request. The audit record truthfully describes the local decision; it must not be presented as proof that no duplicate external completion occurred.

### A5. Prose clarification

Replace the PII spec's unconditional-send non-goal with the already-detailed rule: no-hit requests proceed, lower-confidence matches are redacted before possible send, and high-confidence matches are blocked. This reconciles conflicting prose; it does not authorize a different decision table, NER at Layer 4, clinical-content classification, or real-PHI processing.

## 4. Implementation and verification constraints, not extra ratifier questions

The following work follows from Option A and can be completed without asking the ratifier to design the code:

- Preserve the raw-text crisis gate, Layer 1 ordering, current-turn-only baseline prompt, supported request surface, and normal provider-outage behavior. Keep local block/audit errors outside the base provider's unknown-error-to-unavailable wrapping.
- Screen the stable, supported candidate the adapter actually serializes, including Anthropic's joined system text. Use regex confidence, not Layer 3's `redactInLogs` flag. Replacements use `[REDACTED:PII]` and a high-confidence hit dominates all low hits.
- Keep audit metadata sourced from trusted request/provider context. If no valid tenant attribution exists, do not invent a sentinel to force an audit row through; fail closed with safe operational diagnostics.
- Keep the fixed admin `ping` probe explicit in the boundary inventory. It is not a patient candidate, and its existing `PLATFORM` placeholder must not become a new Layer 4 audit tenant. No live-probe call is required for tests.
- Use the real crisis caller's atomic marker-plus-event pattern. Correct any misleading comments in files actually changed; do not rewrite historical migration scripts or expand the PR into general audit cleanup.
- Avoid parent/child transaction self-deadlock, including audit-chain locks held by the outer transaction, and do not require an independent audit INSERT to reference an uncommitted admission row through a new FK. Keep pre-send audit before outer response-audit writes.

The verification gate must include real independent PostgreSQL connections and committed fixtures. The default test pool translates transactions to savepoints on one shared connection, so it cannot prove an inner independent commit survives an outer rollback and cannot reproduce genuine lock contention. Use the existing real-pool test facility or a bounded dedicated integration fixture; choice of harness is ordinary engineering, not a new production infrastructure request.

Required evidence includes high/low/mixed and screening-failure decisions, safe payloads, audit-failure zero dispatch, marker rollback, lost-ack/retry behavior where practical, later outer rollback, send failure, completed replay, concurrent equivalent claims, distinct actor/body/tenant/candidate decisions, expiry recovery, and intact stored audit chains. Assert `audit_records` after actual commit rather than the process-local emission log. Transport tests capture actual serialized bodies locally, including joined-system boundaries and mutation attempts across the awaited audit. Preserve existing crisis-ordering regressions. Run normal CI and independent full-diff review before merge.

Pool demand is also a practical review concern: an outer transaction waiting for an independent audit connection uses two connections during the short audit phase. Exercise concurrency and timeout behavior so a saturated pool cannot become an unbounded self-wait. Address it using existing connection/transaction facilities; do not introduce a new pool service or permissions model within this amendment.

## 5. Exactly what the user is being asked to approve

**Recommended approval statement:**

> Approve Option A in the Layer 4 Pass 2 synthesis: register the two specified events as unsampled B/system/standard tenant-governance decision records with the stated Mode 1 attribution, detail fields, action-specific reasons, independent pre-send durability, and decision-level retry semantics; include `screening_failed` as a fail-closed reason; preserve the specified 500 block and existing 503 audit-unavailable behavior; and reconcile the contradictory unconditional-send sentence. Use only the existing audit envelope, storage, roles, partitions, and idempotency facilities.

This approval would authorize the bounded canonical event-contract amendment and its downstream implementation subject to the repository's spec-first, review, and CI gates. It would not authorize a production deploy, Pilot 1 Day-0, real-PHI processing, NER policy changes, new roles/permissions, new database schemas, an outbox, a provider-delivery ledger, or external exactly-once guarantees.

The user does **not** need to approve function names, TypeScript types, wrapper mechanics, safe request cloning, transaction helper composition, SQL expiry fixes within the existing contract, or test-harness choices. Those are implementation details to review and verify. If a chosen implementation unexpectedly needs a new canonical primitive, stop that extension and surface it separately rather than treating this option as blanket authority.

**Current status remains awaiting explicit ratifier approval.** The implementer and both review passes converge on the recommendation; convergence alone cannot cross the hard floor for this canonical amendment. The parent proposal's stale “independent recommendations pending” section is preserved as an independent record and is superseded for reporting purposes by these two review artifacts, not silently rewritten.

## 6. What changed from Pass 1

The recommendation did not change: narrow audit registration is required, local protection is already implementable, and no new platform architecture is needed. After seeing the implementer's independent proposal, I adopted its explicit system actor, retained its B/standard classification, made the failure-reason extension explicit, and converted the general Pass 1 metadata guidance into a concrete proposed action contract. I tightened counts, removed duplicate workload naming, and added explicit patient/turn correlation because independently durable governance evidence may outlive a rolled-back chat row.

Pass 1's transaction, marker atomicity, expiry, real-connection testing, probe inventory, and external-exactly-once limitations remain material. They supplement the proposal rather than overturning it. The remaining user decision is the bounded contract approval above, not selection among implementation architectures.
