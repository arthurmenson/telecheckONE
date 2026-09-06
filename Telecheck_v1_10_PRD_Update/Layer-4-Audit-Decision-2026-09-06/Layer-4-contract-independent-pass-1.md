# Layer 4 contract assessment — independent Pass 1

**Verdict: recommend-pass-1 — implement the local protection within the existing scope; obtain a narrow audit-contract ratification before declaring Sprint 1.2b complete.**

This is an independent source-first consult, not an implementation review. I read app sources through `git show 9b9158d8f2f0bdafad096283faa32d501bcb7851:<path>` and canonical sources through `git show c75d23b55960094a8c0d56d8077218eaf92eb5dd:<path>`. I did not read the current draft vendor components, draft status documents, the parent's proposal, or other task outputs. No application/spec source was edited, and no external action was taken.

## 1. What is authorized, and what is missing

The takeover prompt §8 explicitly makes Sprint 1.2b the next, unblocked task: local sanitization at the clinical-provider resolver seam, protecting adapters by construction rather than relying on each handler. The app PII spec §Layer 4 already supplies the behavioral decision:

- Screen the assembled outbound prompt locally using regex only.
- Any high-confidence match prevents sending and returns HTTP 500 with `ai.provider.egress_blocked`; emit `pii.screener.egress_block`.
- Lower-confidence matches are replaced with `[REDACTED:PII]` before sending; emit `pii.screener.egress_redact`.
- The scope includes system scaffolding, prior turns, current turn, and tool inputs when present. Candidate text must never be sent to an external classifier.

That is adequate authority to build the sanitizer, resolver wrapper, safe error mapping, and tests. Wrapper composition, request copying, typed errors, and ordinary transaction composition do not create new platform architecture.

**The audit completion contract is not ratified in the pinned canonical corpus.** `git grep -n -F 'pii.screener' c75d23b55960094a8c0d56d8077218eaf92eb5dd -- '*.md'` returned no matches. I checked the canonical AUDIT_EVENTS file, its ratified batched amendment, relevant promotion entries, and SI-002 precedent. The app PII spec itself describes screener event registration as a Sprint 1 SI extension. It names the two Layer 4 events, but does not establish their category, deterministic partition, actor attribution, mandatory detail semantics, or retry unit.

AUDIT_EVENTS declares a complete action catalog. SI-002 explicitly identifies exact action strings, category, and mandatory `detail` as ratifier decisions even when the existing envelope and SQL table can already store the proposed event. A permissive JSON payload or TypeScript cast is not canonical authority. The existing `ai_chat_response_emitted` placeholder is evidence of historical debt, not a blanket delegation to mint more canonical events.

The takeover §6 hard floor and spec-repo `CLAUDE.md` require escalation for an unscoped canonical-contract amendment; agreement between reviewers does not waive that floor. The correct blocker is therefore **a small event-contract decision**, not permission to invent tables, DB roles, audit-chain partitions, or a new outbound-delivery architecture.

## 2. Independent options and recommendation

| Option | Strongest argument for | Strongest argument against / disposition |
|---|---|---|
| **A. Ratify the two already-specified Layer 4 event contracts, then finish using existing audit and transaction primitives. Recommended.** | Meets the declared control and durable-evidence requirement with little architectural expansion. The sanitizer and reviewable tests can be prepared under current scope. | Requires a real canonical decision on event semantics; calling the whole sprint complete before that decision would be premature. |
| **B. Ship protection as a explicitly incomplete interim, with existing operational logs and an open audit SI.** | Immediately reduces outbound exposure without claiming authority to define canonical records. | Does not satisfy the Layer 4 audit requirement. Pino output is not the immutable audit store. It cannot be represented as Sprint 1.2b completion or a Pilot 1 startup gate closure. |
| **C. Add a durable provider-attempt/delivery coordinator to prove every transport attempt and prevent duplicate external execution.** | Would address a broader distributed-effects problem that exists when external sends occur inside a rollbackable DB transaction. | Unnecessary for the specified sanitization layer and outside existing scope. It would need architectural ratification. Do not introduce a new ledger, role, outbox, or failure-state schema merely to close this sprint. |

I recommend A. For the ratifier's event classification choice, my preference is **unsampled Category B governance evidence** for both privacy-enforcement decisions, using an existing, deterministically chosen tenant-governance scope. These are records of a privacy control intervening, not evidence that a clinical response was delivered. The category choice affects retention/access and must be explicit; it is not implied by regex confidence. High-confidence versus low-confidence detection is independent of A/B/C classification.

The ratifier should resolve the two existing action names' exact meaning, category/sensitivity, actor and resource attribution, deterministic partition, PHI-free detail requirements, and retry unit together. I do not propose new envelope columns, tables, DB roles, or a new partition scheme. `standard` sensitivity is a reasonable recommendation for metadata-only records; the presence of suspected PII in the rejected candidate does not itself justify persisting that candidate or inventing an `elevated` sensitivity enum.

## 3. The smallest complete contract

### Screening boundary

The wrapper must own the request that reaches the adapter. Copy/validate the provider input into a stable snapshot; inspect that snapshot; pass only the approved or redacted snapshot onward. Caller mutation while the wrapper awaits an audit commit must not change what is sent. Avoid retaining raw candidate text in the thrown error, audit callback, logs, or response.

At baseline, `LLMCompletionRequest` carries `messages`, `workload_type`, `max_output_tokens`, `temperature`, and `tenant_id`. Message roles are system/user/assistant and content is text. There are no tool-input fields in this implemented interface. Do not add tools or conversation-history replay as part of Layer 4; ensure that a later addition cannot silently bypass screening.

Anthropic assembles all system messages with `join('\n\n')`, removes system messages from the turns array, and serializes a body containing model, generation parameters, messages, and optional system text. Validation must cover the **semantic text the adapter actually sends**, including its system-message assembly. Looking only at the current user's text is insufficient; looking only at individually isolated pieces can miss context-sensitive patterns created during assembly. Arbitrarily flattening all unrelated fields is not an accurate substitute for knowing this serialization.

The baseline chat sends the current turn only. This is important to preserve: crisis-path raw text is stored, but is not replayed in a later prompt. The wrapper must not introduce replay. The baseline Mode 2 registry returns NullLLMProvider, so wiring a real Mode 2 provider is outside this sprint.

There is one real direct-adapter caller outside `resolveClinicalProvider`: the admin credential-test handler sends the fixed literal `ping`. A resolver-only wrapper does not literally cover that call. The implementation should mechanically inventory and either route it through the same safe boundary or keep a demonstrably fixed, non-candidate probe with an explicit scope statement. It must not falsely report that every real adapter construction is resolver-owned. Do not manufacture a tenant or patient audit identity for the probe's existing `tenant_id: 'PLATFORM'` placeholder.

Use the pattern library's `confidence` axis for the Layer 4 decision, not Layer 3's `redactInLogs` axis. For example, IP patterns are excluded from log redaction but remain low-confidence vendor-payload matches; they must be redacted on outbound candidate text. Inspect the original snapshot for all high-confidence hits before applying low-confidence replacements so redaction cannot hide a blocking match. A mixed high/low candidate is one blocked candidate, with no provider call. The exact Layer 4 replacement is `[REDACTED:PII]`, not Layer 3's descriptive marker.

Malformed, unsupported, or incompletely inspected provider inputs must not be sent. Runtime validation, bounded work, immutable snapshots, and serializer-equivalence tests are ordinary implementation controls. Do not silently add new permitted free-text surfaces or trust unknown fields merely because TypeScript normally excludes them.

### Preserve the surrounding behavior

I-019 crisis detection remains first on raw input. Layer 1 remains after crisis detection and before non-crisis validation/persistence/provider work. Layer 4 lives immediately before provider egress on the non-crisis path. Crisis turns continue to bypass the provider; the explicitly accepted crisis-plus-PII persistence residual remains unchanged.

The Layer 4 block error must remain distinct from `LLMProviderUnavailableError`. `BaseLLMProvider.sendCompletion` wraps unknown errors as provider-unavailable, and chat catches that class and returns a fail-soft 200 with a persisted failure classified `during_llm`. A local privacy block is pre-send and must not be disguised as that successful fail-soft lifecycle. Mapping a dedicated error to the specified 500 while allowing the existing business transaction to roll back is the minimal consistent handler behavior. Do not add a new `turn_result.failure_class` enum or own-transaction terminal-row writer to represent it.

The PII spec's loose non-goal sentence saying the AI still receives a cleaned turn must be read alongside the explicit high-confidence blocking rule. It does not erase that rule. Likewise, Layer 4 is expressly regex-only; this sprint does not cure the known inert NER gap or authorize real-PHI processing. A test replay against the same incomplete classifier is not proof of universal zero-PHI coverage.

### Audit semantics to ratify

The durable event should describe the **local screening decision**, not external delivery or a committed chat turn. The fact that the provider was prevented from receiving a candidate, or that a candidate was sanitized before a permitted send, remains true when later work rolls back.

The existing envelope can carry tenant, authenticated/system attribution as ratified, existing resource identity, workload/autonomy context, timestamps, and the assigned category. Detail should contain only the minimum safe decision evidence: the Layer 4/vendor-outbound context, trusted provider/surface identity where known, pattern identifiers, match counts, and validated correlation to the logical request/resource. These are requirements to settle in the event contract, not a newly invented JSON schema in this assessment. No candidate snippets, whole prompts, matched tokens, raw unknown field names, or arbitrary provider error bodies belong in it.

`pii.screener.egress_redact` is also named by Layer 2 in the app spec. The event definition must distinguish vendor-bound input sanitization from model-output redaction; otherwise the same name gives ambiguous forensic evidence. Define that distinction now without expanding this implementation into all Layer 1/2/5 audit debt. A dedicated no-hit/pass event is not required by Layer 4's text; do not invent another event just to fill a dashboard.

## 4. Required transaction behavior

The baseline chat wraps admission, detector row, provider call, result row, response audit, and idempotency reservation/completion in one application transaction. A callback throw rolls back the DB work and reservation. An external request already sent cannot be rolled back. Therefore putting the Layer 4 event only in that business transaction loses evidence after a later DB/audit failure; waiting until after send to emit redaction evidence also leaves an unobserved-send crash window.

**Recommended sequence for a matching outbound candidate:**

1. Prepare and screen the stable candidate locally, after the crisis/detector prerequisites and before network activity.
2. Open a fresh audit transaction using existing facilities, with the real tenant context. Do not pass the business transaction as `externalTx`.
3. If deduping, claim the appropriate existing marker slot and emit the canonical event **inside that same fresh transaction**. Commit marker and event together. A prior matching committed marker is usable only under a caller discipline that makes it imply the corresponding event exists.
4. For a block, propagate the dedicated error after the audit commit. The business transaction and idempotency reservation roll back; the event remains.
5. For a redaction, send only the inspected sanitized snapshot after the audit transaction has committed. Proceed with the existing provider-failure and chat-persistence behavior.

Any failure to durably record a required Layer 4 decision fails closed before the provider send. Log only safe operational diagnostics, return a retryable failure, and preserve the distinction from a confirmed PII block. There is no general Layer 4 permission to borrow the crisis gate's special safety-first audit-failure exception. The exact error code for audit-infrastructure failure is an implementation mapping unless the ratified API/error contract further constrains it; do not invent an additional canonical event merely for the error.

| Scenario | Provider effect | Required durable evidence / DB result |
|---|---|---|
| No hit, normal success | Existing send proceeds | Normal chat lifecycle and response audit commit together. No new Layer 4 match event is needed. |
| High-confidence or mixed-confidence match | No send | Block decision committed independently; chat business work/reservation roll back; specified 500 is mapped. |
| Low-confidence only, provider succeeds | Only sanitized snapshot sent | Redaction decision already committed; chat/result/cache commit normally. |
| Low-confidence only, provider fails or times out | Sanitized send may have been attempted; receipt may be unknown | Redaction decision survives. Existing provider-unavailable lifecycle may commit; unhandled failures roll back the business transaction. The event makes no delivery claim. |
| Redaction audit commits, process crashes before send | No send or no evidence of send | Redaction-decision event remains truthful. It is not a delivered-to-vendor record. |
| Provider succeeds, then result/response-audit/cache work fails | External send cannot be undone | Redaction-decision event remains; business rows/cache roll back. Retry may perform another sanitized send. |
| Audit INSERT or audit COMMIT fails before send | No send | Neither marker nor event should be intentionally committed alone. Fail closed; retry can attempt recording again. A lost COMMIT acknowledgement is an ambiguous-commit case, not proof of absence. |
| Completed idempotent replay | No new send or screening run | Existing cached response is replayed after authorization. No new event is emitted. |
| Retry after business rollback | Re-screen; send only if current candidate passes/redacts | Deduplicate only an equivalent decision under the declared retry unit; do not skip the screening itself. |

A separate audit transaction is not a new DB architecture: the crisis gate already uses it for rollback-immune facts, and the identity catch-and-emit amendment establishes the same application-owned transaction principle. Extending the required **durability meaning** to these new action definitions should be explicit in their ratification. It does not require adding a DB procedure, role, or audit partition.

## 5. Retry, concurrency, and existing-helper traps

**Marker atomicity.** `claimAuditDedupeSlot` is a bare SQL helper; it does not commit by itself. The actual AI crisis gate puts tenant binding, claim, and audit INSERT in one `withTransaction(emit)` and commits after the callback. Its rollback behavior is the useful precedent. The marker helper/migration comments and the Group G test describe a marker committed without an event; that test deliberately performs precisely that misuse. They do not prove that one atomic transaction can persist a marker while rolling back its audit INSERT. Copy the real atomic caller pattern, not the stale prose. Do not create a compensating queue to fix a window that proper transaction composition eliminates.

**Retry identity.** Existing identity includes tenant, idempotency key, endpoint, actor, request-body hash, and audit action. Use the authenticated context and the helper's canonical endpoint/body hash, with a stable, non-PHI phase/surface discriminator where needed. Layer 2 and Layer 4 must not suppress each other; separate actions or a ratified stage discriminator must make those decisions distinguishable. Do not use a new random correlation ID on every retry if the event contract promises one logical decision.

The HTTP body hash alone does not identify future system scaffolding or history/tool input. If those change between retries, the old marker must not suppress materially different screening evidence. Resolve this within the declared event unit: stable candidate construction or an opaque candidate/decision discriminator inside the existing marker identity can support it without a new table. Do not claim per-transport-attempt auditing while deduping every retry into one request-level event. My recommended unit is an equivalent local screening decision for a logical outbound candidate, explicitly not proof of each send.

**Expiry.** The actual claim SQL has no expired-marker reclamation. It uses `ON CONFLICT DO NOTHING` even when `expires_at` is past; cleanup is separate. Meanwhile `withIdempotency` explicitly deletes expired cache rows and treats the same key as a new request. Thus the comment that an expired-cache retry cannot reach the emit path is false. Matching TTL durations also does not mean matching expiry instants. Layer 4 must not claim complete retry correctness while blindly relying on this behavior. Existing marker cleanup/claim composition can be repaired or used appropriately, with concurrency tests, without changing the canonical schema. Do not UPDATE or DELETE audit records; marker housekeeping is a different table and concern.

**Concurrency.** Competing identical HTTP requests serialize through the uncommitted unique idempotency reservation. On success the loser replays; on rollback a later request can execute. Independent marker claims also serialize on their unique key; marker+event must commit together so a loser never skips an uncommitted or failed event. These are database guarantees to prove using real separate connections. A nested independent audit transaction must not wait on locks already held by its parent on the same audit chain, nor require uncommitted parent rows via new FKs. At the baseline non-crisis send site, the response audit has not yet run. Keep that ordering and use existing stable identity metadata rather than adding a foreign key to an uncommitted admission row.

**External exactly-once is not provided.** Even correct marker dedupe cannot prevent a second external completion after a send succeeded but the business transaction rolled back. The requirement here is that every actual send is locally screened and safe, with truthful durable control evidence. Solving external exactly-once would be Option C and a separate architectural decision.

## 6. Acceptance evidence before completion

Tests should verify actual adapter-bound payloads with a fake transport, not merely that a screening callback ran. Cover system-message assembly, current/prior message roles supported by the interface, high/low/mixed hits, IP low-confidence behavior, canonical replacement marker, immutable snapshots across an awaited audit, malformed inputs, and the direct probe inventory. Do not send adversarial samples to a live provider.

Use real PostgreSQL connections to demonstrate block/redact event durability across a forced outer rollback, atomic marker rollback on audit failure, replay behavior, concurrent duplicate claims, differing bodies/actors/tenants/actions, and expired-marker recovery. Assert persisted `audit_records` and intact chains after commit, not the in-memory `assertAuditEmittedFor` log. The default integration pool translates transactions into nested savepoints on a shared connection; it cannot establish independent-commit survival or realistic cross-connection lock behavior.

Also pin the existing crisis-before-PII ordering and zero provider calls for crisis/high-confidence/audit-failure paths, plus unchanged fail-soft behavior for a true provider outage. The normal typecheck/lint/format/log-call-site/full CI gates remain applicable. This consult did not execute implementation tests because its scope is contract assessment against the pre-implementation baseline.

## 7. Source anchors and decision boundary

App at `9b9158d8f2f0bdafad096283faa32d501bcb7851`:

- `CLAUDE.md`; `docs/PROJECT_CONVENTIONS.md` §3.2, §3.7–§3.9; `docs/SCRUM_OPERATING_MODEL.md`.
- `docs/PII_SCREENING_AND_LOG_REDACTION_SPEC.md` Layers 1/2/4, audit-bound route, implementation order, metrics/non-goals.
- `docs/SI-002-AUDIT_EVENTS-Placeholder-Ratification.md` escalation, category/detail requirements, atomic cutover.
- `src/modules/ai-service/internal/providers/{types,anthropic-provider,resolve-clinical-provider,registry}.ts`.
- `src/modules/ai-service/internal/handlers/{chat,case-prep}.ts`; `src/modules/admin-backend/internal/handlers/ai-providers.ts` fixed probe.
- `src/modules/ai-service/audit.ts`; `internal/crisis/{gate,audit}.ts`.
- `src/lib/{audit,audit-dedupe,idempotency,idempotent-handler,db}.ts`; `src/lib/pii-screener/patterns.ts`; migration 022; `tests/integration/audit-dedupe.test.ts` Group G.

Spec corpus at `c75d23b55960094a8c0d56d8077218eaf92eb5dd`:

- `CLAUDE.md`; `_handoff_bundles/CODEX_TAKEOVER_PROMPT_2026-09-02.md` §§4, 6, 8, 11.
- Canonical bundle `Telecheck_Contracts_Pack_v5_00_AUDIT_EVENTS.md`, `...IDEMPOTENCY.md`, `...INVARIANTS.md`; `Telecheck_Contracts_Pack_v5_2_to_v5_3_Amendment.md` §3. Headers/amendment content, not filenames alone, establish the applicable versions.
- `Telecheck_Promotion_Ledger.md`, including P-014 intent/cutover and P-027 batched amendment; SI-002 closure artifact.
- `Telecheck_AI_Service_Mode_1_Handler_Spec_v1_0.md` audit/partition, detector-before-LLM, and retry/history requirements.
- `Telecheck_v1_10_PRD_Update/SI-018-Audit-Chain-Partition-Rule-for-Non-Patient-Governance-Events.md` and canonical Mode 1/amendment references to deterministic P1/P2 routing; no authorization to invent a third tenantless tier.
- Identity SI-017 amendment's fresh-transaction rejection-audit precedent and the I-003 application-transaction engineering-review references.

**Genuine decision blocker:** finish the missing canonical Layer 4 audit definitions and explicitly approve their decision-level, rollback-immune, pre-send semantics. **Ordinary implementation work:** local regex screening, provider wrapper/error handling, use of existing tenant-bound audit transactions and markers, fixing expiry behavior within those existing contracts, and failure/concurrency verification. **Outside this sprint:** new failure-state schemas, audit roles/partitions, provider delivery ledgers, real Mode 2 enablement, NER policy, Layer 5, and Pilot 1 startup authorization.
