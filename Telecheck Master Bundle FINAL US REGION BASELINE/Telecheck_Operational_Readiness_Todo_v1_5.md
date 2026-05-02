# Telecheck — Operational Readiness To-Do v1.5

**Version:** 1.5
**Status:** Canonical tracking document
**Owner:** Country Launch Director (overall) — individual items have named accountable roles
**Parent documents:** Master Platform PRD v1.10, ADR Addendum 016–019, ADR Addendum 020–025 (with ADR-025 superseded by ADR-026), ADR Addendum 026, ADR-027, ADR-028, ADR-029, Forms/Intake Engine Slice PRD v2.1, Pharmacy + Refill Slice PRD v2.1, Admin Backend Slice PRD v1.1, Future Scope: USSD + AI Bridge v0.1, Patient UI/UX Pressure Review (2026-04-25), Adversarial Counsel Review (2026-04-25), Red-Team Review v1.0, Flagged Items Resolution v1.0
**Companion documents:** Ghana Launch Playbook v1.2, Consolidated Launch Tracker v1.0, Market Rollout Cockpit Slice PRD v1.0
**Format:** Markdown (must remain markdown — this is a working tracker; status changes frequently)

---

## Purpose

This document tracks operational-readiness work that the design corpus has named as required but has not yet produced. It is the action register that pairs with the Artifact Registry: the Registry tracks *what artifacts exist*; this tracker captures *what operational evidence and decisions still need to land* before Ghana launch.

Items here come from three sources:

1. **Adversarial Counsel Review (2026-04-25)** — convergent findings across seven adversarial lenses
2. **Red-Team Review v1.0** items not yet closed
3. **Registry v2.9 §6 Recommended next actions**

This tracker does not replace the Consolidated Launch Tracker (open clinical/product questions) or the Cockpit's evidence locker (regulatory artifacts per market). It complements them by holding the *cross-functional operational gaps* that are owned across multiple roles.

---

## How to use

**For an operator opening this document:**
1. Find your role in the Owner column (§3) to see what is assigned to you
2. Each item has a defined-done state — that is the bar for marking it Resolved
3. Status transitions (Open → In Progress → Blocked → Resolved → Verified) are logged in §5
4. Items cannot be Resolved without their named evidence artifact existing
5. If you discover a new operational gap, propose an item via §6

**For the Country Launch Director:**
1. §2 ranks items by tier — Tier 0 is reviewer-blocking, Tier 1 is launch-blocking, Tier 2 is hardening, Tier 3 is post-launch follow-on
2. The launch go/no-go decision (Ghana Launch Playbook §6) cannot be Yes while any Tier 1 item is Open or Blocked
3. The cockpit's readiness checklist references items by ID below

---

## §1 Tiering and definitions

| Tier | Meaning | Effect of Open status |
|---|---|---|
| **0 — Reviewer-blocking** | External adversarial review (clinical, regulatory, security, AI, privacy) cannot meaningfully evaluate the design without this artifact | Blocks invitation of external reviewers |
| **1 — Launch-blocking** | Ghana launch cannot proceed without resolution; live patients would be at unacceptable risk | Blocks Pilot → Limited Launch transition (Cockpit §4.3) |
| **2 — Hardening** | Launch can proceed; absence creates known fragility under volume, language load, or staffing variance | Must be resolved before Limited Launch → Full Launch transition |
| **3 — Post-launch follow-on** | Improvement that reduces operational drift over time; not gating | Tracked in 90-day plan, not in launch readiness |

**Status values:**
- `Open` — not yet started
- `In Progress` — actively being worked
- `Blocked` — cannot proceed due to a named dependency
- `Resolved` — work complete and evidence artifact exists
- `Verified` — Resolved + the named verifier role has confirmed the evidence meets the defined-done bar

**Definition of done (DoD):** Each item names the specific artifact, decision, or operational state that must exist for Resolved status. "We discussed it" is never DoD.

---

## §2 Items by tier

### Tier 0 — Reviewer-blocking

| ID | Title | Source |
|---|---|---|
| OR-001 | Threat model (STRIDE + attack tree) | Counsel Security |
| OR-002 | DPIA (Data Protection Impact Assessment) — Ghana | Counsel Privacy, Counsel Regulatory |
| ~~OR-003~~ | ~~Named AI model + provider decision (Mode 1, Mode 2, Scribe)~~ | **RESOLVED 2026-04-25 by ADR-020 (Anthropic Claude primary with multi-provider abstraction). Implementation tasks delegated to OR-301 (LLMProvider abstraction launch readiness).** |
| OR-004 | Clinical safety case + FMEA per critical workflow | Counsel Clinical, Red Team #6 |
| OR-005 | AI bias and fairness assessment (West African genotype, accent, dialect) | Counsel AI |

### Tier 1 — Launch-blocking

| ID | Title | Source |
|---|---|---|
| OR-101 | Ghana legal entity stack — pharmacy license, superintendent pharmacist of record | Counsel Regulatory |
| OR-102 | Ghana MDC opinion on protocolized prescribing legality | Counsel Regulatory |
| ~~OR-103~~ | ~~Data residency answer + DPC registration if cross-border~~ | **RESOLVED 2026-04-25 by ADR-024 (per-tenant KMS keys, country-driven jurisdictional residency mechanism, Ghana DPC registration as documented operational item). Region pair updated 2026-04-26 by ADR-026 (us-east-1 primary, us-west-2 cold DR; supersedes af-south-1 framing in ADR-025). Implementation tasks delegated to OR-302 (Ghana DPC cross-border registration — Ghana data processed in us-east-1 per ADR-026), OR-303 (US BAA structure — standard HIPAA-region chain per ADR-026).** |
| OR-104 | Adverse-event reporting destination integration (FDA Ghana / pharmacovigilance) | Red Team Tier 1, Counsel Regulatory |
| ~~OR-105~~ | ~~Multilingual coverage spec~~ | **RESOLVED 2026-04-25 by ADR-018 (English-first launch posture). Track A is English-only. Multilingual coverage carried to Future Scope: USSD + AI Bridge v0.1 §4.3 for Track B.** |
| OR-106 | Protocol library content (Ghana) — refill renewals, dispensing release, emergency routing | Red Team Tier 1, Registry §6 |
| OR-107 | Guardrail template content + test suites (beyond Conservative Default) | Red Team Tier 1, Registry §6 |
| OR-108 | Ghana moderation policy content | Red Team Tier 1, Registry §6 |
| OR-109 | Pricing document + unit economics model — **scope expanded 2026-04-25 to include per-tenant unit economics (Telecheck-US [Heros Health DBA] + Telecheck-Ghana [Heros Health Ghana DBA]) and platform-fee model per Master PRD v1.10 §18** (per-tenant unit economics wording updated 2026-05-02 per v1.10.1 hygiene cycle Phase5 delta Row 45 — C3 brand-structure cascade applied) | Counsel Product, Registry §6, Master PRD v1.10 §18 |
| OR-110 | Knowledge-base sourcing decisions — drug interactions, herb-drug, fake-med | Red Team Tier 1, Registry §6 |
| OR-111 | Deployment specification — **topology PARTIALLY RESOLVED 2026-04-26 by ADR-026 (AWS us-east-1 primary, us-west-2 cold DR; supersedes ADR-025 af-south-1 framing). CI/CD, rollback procedures, monitoring runbooks, DR testing procedure REMAIN OPEN.** | Registry §6, ADR-026 (supersedes ADR-025) |
| OR-112 | Test strategy specification — integration, e2e, clinical safety, regression — **scope expanded 2026-04-25 to include multi-tenant isolation testing (cross-tenant access attempts, RLS policy validation, per-tenant KMS key isolation)** | Registry §6, ADR-023 |
| OR-219 | Patient research artifact set — usability testing in Ghana with target English-fluent users, before launch | Patient UI/UX Pressure Review |
| OR-227 | OTP-recovery and shared-phone identity flows — surfaced in Patient App IA, not just Identity Spec | Patient UI/UX Pressure Review |
| OR-234 | US legal entity stack for the **Telecheck-US tenant (Heros Health DBA; operated by Telecheck Health LLC)** — state telehealth registrations, LegitScript certification, BAA with AWS US (as subprocessor in the OR-303 canonical 3-party BAA chain Telecheck Health LLC → Telecheck parent/platform → AWS US per System Architecture v1.2 §11.4). *Updated 2026-05-02 per Codex Round-3 Scope 4 HIGH-2 finding to align with the canonical BAA chain.* | Master PRD v1.10 §4.1, ADR-024, ADR-026 |
| ~~OR-235~~ | ~~Heros migration project plan~~ — **REMOVED in v1.4** per HIGH-12 product decision (2026-04-25): Heros launches greenfield within Telecheck. No migration project. | — |
| OR-236 | Multi-tenant isolation security review — application-layer filtering, PostgreSQL RLS policies, per-tenant KMS keys, cross-tenant access attempt testing | ADR-023 implementation, Counsel Security |
| OR-237 | Tenant onboarding manual procedure — platform-admin runbook for creating tenants, configuring country, configuring brand, configuring adapters, seeding initial admin user (productized self-service deferred to Phase 2) | ADR-023, Master PRD v1.9 §2 |
| OR-238 | Per-tenant SOC 2 Type II evidence collection from day 1 — system architecture supports SOC 2 (per Master PRD v1.9 §4.1) but audit not pre-launch; operating evidence must accumulate from launch day | Master PRD v1.9 §4.1 |
| OR-239 | LiveKit production deployment — TURN servers, capacity planning, monitoring, runbook for incident response; LiveKit Cloud as documented operational fallback for first 90 days | ADR-021 |
| OR-240 | Faster-Whisper self-hosted GPU pipeline — only required after volume crosses ~1,500 consults/month; Deepgram managed STT for first 90 days | ADR-022 |
| OR-113 | **Marketing copy governance lead designation** — designate a Marketing copy governance lead (per Master PRD v1.10 §24 row 16; ADR-027 v0.6). Owner: Product Lead + Regulatory Affairs Lead. Required for emerging-market tenants where `molecule_level_marketing_permitted ∈ {pending_evidence, permitted}`; not required for tenants permanently locked at `prohibited` (e.g., Telecheck-US). _(Added 2026-05-02 per v1.10.1 hygiene cycle Phase5 delta Row 55 — C4 marketing posture.)_ | Master PRD v1.10 §24 row 16, ADR-027 v0.6 |
| OR-114 | **First molecule-level marketing copy approval — Ghana** — first molecule-level marketing copy run through §13.2 Governance review process and approved (per Master PRD v1.10 §24 row 17; ADR-027 v0.6). Owner: Marketing copy governance lead + Clinical Safety Officer + Regulatory Affairs Lead (triple sign-off). Gates Telecheck-Ghana transition from `pending_evidence` → `permitted` for the first molecule. _(Added 2026-05-02 per v1.10.1 hygiene cycle Phase5 delta Row 55 — C4 marketing posture.)_ | Master PRD v1.10 §24 row 17, ADR-027 v0.6 §13.2 |
| OR-115 | **CCR marketing key initial values per country** — populate CCR marketing block for each launch tenant (per Master PRD v1.10 §24 row 18; ADR-027 v0.6). Owner: Engineering + Regulatory Affairs Lead. Telecheck-US: `molecule_level_marketing_permitted = prohibited` (permanent; locked per regulatory posture). Telecheck-Ghana: `molecule_level_marketing_permitted = pending_evidence` pending regulatory engagement + `marketing_copy_governance_evidence` population per ADR-027 v0.6 + CCR_RUNTIME v5.2. _(Added 2026-05-02 per v1.10.1 hygiene cycle Phase5 delta Row 55 — C4 marketing posture.)_ | Master PRD v1.10 §24 row 18, ADR-027 v0.6, CCR_RUNTIME v5.2 |
| OR-116 | **Research Ethics Committee (REC) partnership designation — Ghana** — designate REC/IRB partner for Telecheck-Ghana 5th-tier research data-use consent oversight (per Master PRD v1.10 §24 row 11; ADR-028 v0.5 Activation requirements §2). Owner: Privacy Officer + Telecheck-Ghana team. Candidates: Ghana Health Service REC, Noguchi Memorial Institute IRB. **Required before per-country `inactive → consent_only` activation** (patch 2026-05-02 per Codex Round-5 Scope 3 HIGH-2 finding aligning with the Round-3/Round-4 patches that changed CCR launch defaults to `inactive`). Not a v1.0 launch prerequisite — Telecheck-Ghana launches with `research_data_partnership_active = inactive` and the 5th-tier prompt does NOT render at launch. Pre-launch designation effort is appropriate so the REC partnership is in hand for the activation review (alongside ethics-reviewed consent text per OR-117), but it does NOT block v1.0 launch itself. _(Added 2026-05-02 per v1.10.1 hygiene cycle Phase5 delta Row 75 — C5 research data partnership; gating language updated 2026-05-02 per Codex Round-5 Scope 3 HIGH-2.)_ | Master PRD v1.10 §24 row 11, ADR-028 v0.5 |
| OR-117 | **Research data-use consent text — drafted + ethics-reviewed** — draft 5th-tier consent text and run through REC/IRB ethics review (per Master PRD v1.10 §24 row 12; ADR-028 v0.5). Owner: Privacy Officer + Legal + REC partner. **Required before per-country `inactive → consent_only` activation** (patch 2026-05-02 per Codex Round-6 Scope 3 MEDIUM finding aligning with the Round-3/Round-4 patches that changed CCR launch defaults to `inactive` and the OR-116 gating update — same treatment as OR-116). Not a v1.0 launch prerequisite — countries launch with `research_data_partnership_active = inactive` and the 5th-tier consent prompt does NOT render at launch. Pre-launch authoring effort is appropriate so the consent text is in hand for the activation review (alongside REC partnership designation per OR-116), but it does NOT block v1.0 launch itself. Asymmetric retraction language explicit; optional, separately revocable, no care impact (per I-030 — applies once consent is active per country). _(Added 2026-05-02 per v1.10.1 hygiene cycle Phase5 delta Row 75 — C5 research data partnership; gating language updated 2026-05-02 per Codex Round-6 Scope 3 MEDIUM.)_ | Master PRD v1.10 §24 row 12, ADR-028 v0.5, INVARIANTS v5.2 I-030 |
| OR-118 | **Data Sharing Agreement (DSA) template — legal-reviewed** — author DSA template and run through legal review (per Master PRD v1.10 §24 row 13; ADR-028 v0.5 Activation requirements §4). Owner: Legal + Privacy Officer. Required before first DSA activation (Release 2). Stored at `Telecheck_DSA_Template.md` (placeholder until Release 2 activation engages). _(Added 2026-05-02 per v1.10.1 hygiene cycle Phase5 delta Row 75 — C5 research data partnership.)_ | Master PRD v1.10 §24 row 13, ADR-028 v0.5 |
| OR-119 | **De-identification standard — chosen + documented** — choose and document de-identification standard for research data exports (per Master PRD v1.10 §24 row 14; ADR-028 v0.5). Owner: Engineering + Privacy Officer. Default: HIPAA Safe Harbor + k-anonymity, k_min = 11 per CCR_RUNTIME v5.2 + INVARIANTS v5.2 I-029. Required pre-launch (configuration must exist before any export pipeline runs). _(Added 2026-05-02 per v1.10.1 hygiene cycle Phase5 delta Row 75 — C5 research data partnership.)_ | Master PRD v1.10 §24 row 14, ADR-028 v0.5, CCR_RUNTIME v5.2, INVARIANTS v5.2 I-029 |
| OR-120 | **Initial WHO/UN partner identification** — identify first WHO/UN research partner for Posture A Release 2 partnership (per Master PRD v1.10 §24 row 15; ADR-028 v0.5). Owner: Product Lead + External Comms. Strategic — first partnership scope shapes Release 2 architecture priorities. _(Added 2026-05-02 per v1.10.1 hygiene cycle Phase5 delta Row 75 — C5 research data partnership.)_ | Master PRD v1.10 §24 row 15, ADR-028 v0.5 |

### Tier 2 — Hardening

| ID | Title | Source |
|---|---|---|
| OR-201 | Protocol auto-deactivation contract (fallback rate ceilings, signal-override ceilings, Mode 2 auto-approve case-volume floor) | Counsel Clinical, Counsel AI |
| OR-202 | Advisory-to-actionable promotion contract (single contract for fake-med, PGx, herb-drug evidence) | Counsel Clinical, Counsel Product |
| OR-203 | Consent-revocation data-derivation graph per consent category | Counsel Privacy |
| OR-204 | Sensitive-category inference-leak handling (medication-class-aware delegate redaction) | Counsel Privacy |
| OR-205 | Right-to-erasure carve-out specification for AI conversation audit content | Counsel Privacy, Counsel Regulatory |
| OR-206 | Module-to-module authentication (mTLS, signed protocol invocations) | Counsel Security |
| OR-207 | Notification third-channel for safety-critical messages (voice / in-product banner) | Counsel Security, Counsel Operations |
| OR-208 | Data-level filtering implementation choice (RLS vs view vs app-layer) | Counsel Security |
| OR-209 | Crisis detection load + concurrency specification | Counsel Clinical |
| OR-210 | Disaster-recovery workflow-state-machine recovery procedure | Counsel Operations |
| OR-211 | Emergency Safe Mode clinician communication + briefing flow | Counsel Operations |
| OR-212 | Pediatric/pregnancy/lactation runtime detection at refill and prescribing | Counsel Clinical |
| OR-213 | Coercive-delegate audit visibility (read-not-acted access logs) | Counsel Privacy |
| OR-214 | Mode 2 auto-approve statistical power analysis (minimum case volume, agreement-rate CI, subgroup bias evaluation) | Counsel AI |
| OR-215 | Contractual phasing fallback rule — 7-days-before-T-0 deferral | Counsel Operations, Counsel Product |
| OR-216 | Build vs spec traceability matrix | Red Team Tier 4, Registry §6 |
| OR-217 | Penetration test scope definition (pre-launch external pen test) | Counsel Security |
| OR-218 | Performance and load test plan (interaction engine <2s, emergency <60s under p95 load) — **scope expanded 2026-04-25 to include AI lab interpretation accuracy regression per ADR-019** | Registry §6, ADR-019 |
| OR-220 | Honest-status patient-surface specification — visible patient states for each refill, consult, lab, RPM state machine, with copy and timing | Patient UI/UX Pressure Review |
| ~~OR-221~~ | ~~Lab extraction confirmation safety model~~ | **RESOLVED 2026-04-25 by ADR-019 (AI-first lab interpretation with explicit pending-review caveat). Implementation tasks delegated to Labs Slice update and Patient App IA Journey 4 update.** |
| OR-222 | Persistent UI element specification — thumb-zone hierarchy, emergency-as-visible-button, FAB collision resolution | Patient UI/UX Pressure Review |
| OR-223 | Delegate UX completeness spec — switch gesture, multi-patient list, on-behalf intake completion, delegate-led account setup, inference-leak mitigation for sensitive medication classes | Patient UI/UX Pressure Review |
| OR-224 | Critical-path / launch-scope reconciliation — either collapse to single launch-scope tier or update Master PRD §12 to accept staged delivery | Patient UI/UX Pressure Review |
| OR-225 | Empty-state copy and design library — specific copy for each of the 48 screens' empty/loading/failure/offline states (English-only per ADR-018) | Patient UI/UX Pressure Review |
| OR-226 | Notification deduplication policy across in-app + WhatsApp + SMS; cross-channel read-receipt semantics | Patient UI/UX Pressure Review |
| OR-228 | Identity model evolution plan — phone-number-as-identity at scale, including SIM recycling, shared phones, community-phone use | Future Scope: USSD + AI Bridge §9 |
| OR-229 | Audit envelope `interaction_surface` field added at Track A launch (`app`-only initially; values reserved: `app` / `whatsapp` / `ussd` / `voice` / `sms`) | Future Scope: USSD + AI Bridge §9 |
| OR-231 | Labs Slice §6.2 update — embed ADR-019 caveat language as canonical patient-facing copy; specify the regression metric for OCR-confirmed-then-clinician-corrected values | ADR-019 implementation |
| OR-232 | Patient App IA Journey 4 update — confirm Option B (AI-first interpretation with caveat) flow; remove ambiguous "AI interprets after clinician review" reading | ADR-019 implementation |
| OR-233 | Onboarding language scoping copy — explicit user-facing message that Telecheck is currently English-only with sign-up for future-language updates | ADR-018 implementation |
| OR-241 | Per-tenant audit log access UI for tenant admins — read-only view of tenant's audit trail with filtering by category, actor, time range | ADR-023 + RBAC v1.1 |
| OR-242 | Platform-admin "break-glass" implementation — time-bounded session, tenant-admin notification, full audit, post-session review workflow | RBAC v1.1 §4 |
| OR-243 | Tenant configuration UI — platform-admin view for managing tenants (create, configure country, configure brand, configure adapters); tenant-admin view for managing their own tenant's brand and adapter config | ADR-023, Master PRD v1.9 §2 |
| OR-244 | Provider abstraction conformance test suites — PaymentProvider, ClinicianNetworkProvider, PharmacyProvider, LLMProvider, NotificationChannelProvider; each adapter must pass conformance test before activation | System Architecture v1.2 §7 |
| OR-245 | LLMProvider switching playbook — graceful fallback from Anthropic Claude to OpenAI GPT (or alternate) on provider outage; per-route configuration; switching event audited | ADR-020 implementation |
| OR-246 | Stripe + Paystack integration test environments per tenant — sandbox accounts, test webhooks, dispute-handling flows | ADR-024 |
| OR-247 | Subscription state-machine implementation — pause/resume/switch/cancel mechanics for US tenants; per-tenant subscription event audit | Pharmacy + Refill Slice PRD v2.1 (Session 2) |
| OR-248 | Conversion-event taxonomy — every step of intake form emits structured events for funnel analysis (PostHog-backed); per-tenant variant testing | Forms/Intake Engine Slice PRD v2.1 (Session 2) |
| OR-249 | Affiliate program MVP launch readiness — UTM tracking, attribution windows, conversion crediting, Stripe Connect for US payouts, manual reconciliation for Ghana | Admin Backend Slice PRD v1.1 (Session 2) |
| OR-250 | Discount code engine launch readiness — single-use, multi-use, per-product, per-program, percentage or fixed amount, expiry rules, usage caps; per-tenant scoping | Admin Backend Slice PRD v1.1 (Session 2) |
| OR-251 | Conversion monitoring dashboards — Metabase / PostHog dashboards per tenant for conversion funnel, drop-off identification, cohort retention, revenue per cohort | Admin Backend Slice PRD v1.1 (Session 2) |
| OR-252 | LiveKit Agents integration for AI Scribe — STT runs as participant in WebRTC room; transcript ingestion; clinician-edit-rate metric; per ADR-021 architectural pattern | ADR-021 |
| OR-253 | PostgreSQL Row-Level Security policy linting — CI check verifies every tenant-scoped table has RLS policy enabled and the policy uses `current_setting('app.tenant_id')` | ADR-023 implementation |
| OR-254 | Per-tenant KMS key rotation policy — rotation cadence, key lifecycle management, audit of rotations | ADR-024, Canonical Data Model v1.2 §7 |
| OR-255 | Per-tenant rate limit policy — fair-share allocation across tenants; hot-tenant detection; alert workflow when one tenant disproportionately impacts platform performance | System Architecture v1.2 §10.2 |
| OR-256 | Native-first stack onboarding runbooks — for each self-hosted service (LiveKit, Whisper, PostHog, Meilisearch, Metabase, LGTM, Sentry, MinIO if elected): production setup runbook, monitoring runbook, incident response runbook, capacity planning runbook | ADR-022 implementation |
| OR-257 | Forms/Intake Engine v2.0 visual builder usability research — usability sessions with non-technical tenant marketing operators before launch; iterate on builder UX | Forms Engine v2.1 §6.4 |
| OR-258 | Subscription state machine implementation — full v2.0 state machine with pause/resume/switch/cancel; per-state copy validated; clinical-safety hooks (SAFETY_HOLD, bridge supply, payment-failed dunning) preserved from v1.0 | Pharmacy + Refill v2.1 §8 |
| OR-259 | Cancellation deflection content authoring — per-reason deflection scripts (side effects, financial, slow results, other); anti-coercion review per Master PRD §17 | Pharmacy + Refill v2.1 §10 |
| OR-260 | Multi-product cart implementation — cart entity, cart-item entity, expiration policy, cart-to-subscription handoff, cart-to-refill handoff for OTC items | Pharmacy + Refill v2.1 §11 |
| OR-261 | Pharmacy adapter conformance test suite — test battery every adapter (Truepill, Honeybee, Capsule, Alto, Ghana partners) must pass before activation; covers fulfillment, inventory, cancellation, webhooks, status mapping | Pharmacy + Refill v2.1 §6 |
| OR-262 | Discount code engine implementation — entity, validation rules, redemption tracking, anti-fraud (rate limiting per IP/account), audit | Admin Backend v1.1 §5.4.3 |
| OR-263 | Affiliate program MVP implementation — affiliate accounts, tracking links, attribution windows, conversion crediting, refund-aware reversal, Stripe Connect payout (US), manual reconciliation flow (Ghana) | Admin Backend v1.1 §5.5 |
| OR-264 | Conversion dashboard implementation — Metabase + PostHog integration; per-tenant scoped; funnel, cohort retention, attribution, per-product, custom reports | Admin Backend v1.1 §5.6 |
| OR-265 | AI-assisted operator features (non-clinical) — conversion anomaly detection, copy suggestions, cancellation reason clustering, inventory restock prediction; LLMProvider abstraction usage; audit per AI-LAYERING | Admin Backend v1.1 §5.7 |
| OR-266 | Carrier integration framework — UPS, USPS, FedEx, DHL Ghana tracking-number → status webhook → patient notification; for Ghana motorbike delivery: driver name + phone surfaced | Pharmacy + Refill v2.1 §12 |
| OR-267 | Inventory awareness implementation — pharmacy adapter inventory query, STOCKOUT state, auto-pause-on-stockout for subscriptions, alternate adapter routing | Pharmacy + Refill v2.1 §13 |
| OR-268 | Compounding-aware extension implementation — ProductCatalog flags, adapter capability declaration, regulatory-module gating per US state, audit envelope tagging | Pharmacy + Refill v2.1 §14 |
| OR-269 | Save-and-resume implementation — auto-save on field blur, explicit save-and-leave, anonymous resume token for pre-account, cross-device resume, 30-day default expiry, audit | Forms Engine v2.1 §8 |
| OR-270 | Abandonment recovery implementation — 1h/24h/7d/30d touch sequence, per-tenant configuration, copy variants, frequency caps, opt-out honoring, audit | Forms Engine v2.1 §16 |
| OR-271 | A/B testing infrastructure — variant model, PostHog feature flag integration, statistical significance computation, winner promotion workflow, variant retirement | Forms Engine v2.1 §14 |
| OR-272 | JSON import/export schema and validation — canonical schema documentation, validation engine. (~~tenant migration tooling for Heros~~ component REMOVED per HIGH-12 — Heros launches greenfield, no patient migration. JSON import/export remains for tenant onboarding catalog/forms population.) | Forms Engine v2.1 §15 |
| OR-273 | Trust block, pricing display, cart upsell element implementations — new form element types per Forms Engine v2.1 §4.1 | Forms Engine v2.1 §4.1 |
| OR-274 | Switch workflow clinical-review pathway — switch request → clinician review → approval/decline → subscription update; per-product switch eligibility rules | Pharmacy + Refill v2.1 §8.4 (switch) |
| OR-275 | Per-tenant audit log read UI for tenant admins — filterable by category/actor/time range/action; CSV export with PHI handling caveats | Admin Backend v1.1 §5.10 + RBAC v1.1 |
| OR-276 | Tenant brand and theming admin UI — logo upload, color picker, custom domain DNS verification, design tokens overrides, notification copy variant editor | Admin Backend v1.1 §5.8 |
| OR-277 | Cross-tenant comparison dashboard for Platform Admin — aggregate metrics, hot-tenant detection (per OR-255), per-tenant compliance status, MRR breakdown with FX conversion | Admin Backend v1.1 §5.2 |

### Tier 3 — Post-launch follow-on

| ID | Title | Source |
|---|---|---|
| OR-301 | LLMProvider abstraction launch readiness — Anthropic adapter production-ready; OpenAI alternative built and tested as failover; provider-swap audited | ADR-020 implementation |
| OR-302 | Ghana DPC cross-border registration — formal registration with Ghana Data Protection Commission for cross-border processing of Ghana patient data in us-east-1 (United States) per ADR-026 (supersedes ADR-025 af-south-1 framing). Specific contractual mechanism (jurisdictional instrument under Ghana DPC) **[COUNSEL-REQUIRED]**. Patient-facing privacy disclosure language **[COUNSEL-REQUIRED]**. Sub-processor list with AWS US **[COUNSEL-REQUIRED]** for completeness. | ADR-024 implementation, ADR-026 region |
| OR-303 | US BAA structure for us-east-1 processing — standard HIPAA-region BAA chain documentation for the **Telecheck-US tenant (Heros Health DBA)** patient data processed in us-east-1. Per ADR-026 + System Architecture v1.2 §11.4 (rewritten 2026-05-02 per Codex Round-2 Scope 4 HIGH-2 patch + restored to canonical 3-party form per Round-3 Scope 4 HIGH-2 finding — was `Heros → Telecheck → AWS US` and prior round-2 attempt at `Telecheck Health LLC → AWS US` dropped the platform tier), the canonical chain is: **Telecheck Health LLC (Telecheck-US tenant operator; Heros Health DBA consumer surface) → Telecheck parent/platform (separate business associate; data-plane operator + per-tenant KMS / RLS enforcement layer per ADR-023) → AWS US (subprocessor)**. **Definition of Done:** evidence collected for each party in the chain — (a) Telecheck Health LLC entity registration + tenant-operator BAA; (b) Telecheck parent/platform BAA covering multi-tenant data plane and per-tenant encryption keys; (c) AWS US subprocessor BAA. All-US-jurisdiction; simpler than prior cross-border framing under superseded ADR-025. | ADR-024 implementation, ADR-026 region; Codex Round-3 Scope 4 HIGH-2 patch 2026-05-02 |
| OR-304 | Cross-market data flow policy (Ghana ↔ Nigeria expansion) | Counsel Regulatory |
| OR-305 | Reviewer-feedback loop process for live operations | Cockpit §10 |
| OR-306 | Knowledge-base refresh cadence governance | Registry §6 |
| OR-307 | Cross-mode AI data flow policy (Mode 1 context to Mode 2 case prep) | AI Slice §15 Q6 |
| OR-308 | AI Mode 2 auto-approve activation playbook | Master PRD §11.2 #28 |
| OR-309 | Future Scope Track B PRD authorship trigger — when Track A reaches Limited Launch state, schedule Track B PRD work | Future Scope: USSD + AI Bridge §6 |
| OR-310 | Productized tenant self-service onboarding (Phase 2) — replacement for manual platform-admin tenant onboarding process | Master PRD v1.9 §19 |
| ~~OR-311~~ | ~~Heros migration tooling productization (Phase 2)~~ — **REMOVED in v1.4** per HIGH-12 product decision (2026-04-25): Heros launches greenfield. No source-tenant migration tooling needed. (Cross-tenant migration tooling for any future use case becomes a separate Phase 2 work stream if/when needed.) | — |
| OR-312 | Affiliate program advanced features (Phase 2) — multi-tier commissions, dedicated affiliate dashboards, affiliate marketplace | Admin Backend Slice PRD v1.1 (planned for Session 2) |
| OR-313 | US owned-pharmacy considerations (Phase 2, per-tenant decision) | Master PRD v1.9 §19 |
| OR-314 | Multi-region deployment readiness (Phase 2+) — multi-region capabilities deferred per ADR-026 (warm DR in us-west-2; regional media routing for Ghana sync video; active-active multi-region) | System Architecture v1.2 §11.6 |
| OR-315 | RBAC actor type `chw` reservation | Future Scope: USSD + AI Bridge §9 |
| OR-316 | Federated patient identity across tenants (post-launch consideration) — cross-tenant patient identity not in v1.1 scope; revisit when business case develops | ADR-023 |
| OR-317 | Faster-Whisper migration trigger — when consult volume crosses 1,500/month, migrate from Deepgram managed STT to self-hosted Faster-Whisper per ADR-022 cost-economics threshold | ADR-022 |
| OR-318 | LiveKit self-host migration trigger — if launch begins on LiveKit Cloud (managed), migrate to self-host once team has 90 days of operational experience per ADR-021 | ADR-021 |
| OR-319 | Commercial drug-interaction database evaluation (First Databank or Lexicomp) — defer until US scale justifies; build engine architecture against open-data sources only at launch | ADR-022 |

---

## §3 Item details

### OR-001 — Threat model (STRIDE + attack tree)

| Field | Value |
|---|---|
| Tier | 0 |
| Owner | Engineering Lead |
| Verifier | External security reviewer (TBD) |
| DoD | A threat model document covering: AI Mode 1 prompt injection, Mode 2 protocol-bypass via crafted intake, delegation chain attacks, OTP enumeration, crisis-detection bypass via adversarial paraphrasing, fake-medication detection adversarial inputs, audit-chain tampering on disaster recovery, module-to-module impersonation. Each threat: STRIDE category, asset, attack tree, mitigation, residual risk rating. |
| Dependencies | System Architecture v1.2, Identity & Authentication Spec v1.0 |
| Status | Open |

### OR-002 — DPIA (Ghana)

| Field | Value |
|---|---|
| Tier | 0 |
| Owner | Privacy / Compliance Lead (TBD per Flagged Items §1) |
| Verifier | External privacy counsel (Ghana-licensed) |
| DoD | A DPIA covering: data inventory, lawful basis per processing purpose, cross-border transfer mechanism (or in-country residency), retention schedule, data-subject rights workflows (access, rectification, erasure, portability, objection), risk register with mitigations, DPO contact, Ghana DPC registration evidence. |
| Dependencies | OR-103 (residency), Consent Slice v1.0, Audit Events contract |
| Status | Open |

### OR-003 — Named AI model + provider decision

| Field | Value |
|---|---|
| Tier | 0 |
| Owner | AI Safety Lead + Engineering Lead |
| Verifier | Clinical Governance Lead |
| DoD | Decision document naming: Mode 1 model + provider, Mode 2 model + provider, Scribe model + provider, fallback model per role, latency budgets per call class, monthly cost projection at launch volume, SLA expectations from provider, prompt-injection mitigation posture per provider, evaluation methodology for swap decisions. ADR records the decision as ADR-016. |
| Dependencies | None — this is the gating decision |
| Status | Open |

### OR-004 — Clinical safety case + FMEA per critical workflow

| Field | Value |
|---|---|
| Tier | 0 |
| Owner | Clinical Governance Lead |
| Verifier | Independent clinical safety reviewer |
| DoD | A clinical safety case document with FMEAs for each of: refill (clinician-review and protocol-authorized pathways), async consult (program-pathway and general), sync video, RPM alert, AI escalation, lab abnormal, herb-drug interaction, adverse-event handling. Each FMEA: failure mode, effect, severity (1-5), occurrence (1-5), detection (1-5), RPN, mitigation, residual risk. |
| Dependencies | All 17 slice PRDs (already canonical) |
| Status | Open |

### OR-005 — AI bias and fairness assessment

| Field | Value |
|---|---|
| Tier | 0 |
| Owner | AI Safety Lead |
| Verifier | Clinical Governance Lead + external clinical advisor |
| DoD | Assessment covering: West African genotype representation in PGx reference data, counterfeit medication image detection performance by phone camera quality stratum, AI scribe accuracy across English variants and accents (Ghanaian English, Nigerian English, US English baseline), Mode 2 recommendation parity across age, sex, and body-mass strata, guardrail refusal-rate parity across patient demographics. Document evaluation methodology, results, gaps, mitigation plan. |
| Dependencies | OR-003 (model decision) |
| Status | Open |

### OR-101 — Ghana legal entity stack

| Field | Value |
|---|---|
| Tier | 1 |
| Owner | Regulatory & Partner Affairs Lead |
| Verifier | Country Launch Director |
| DoD | Evidence in cockpit evidence locker: Ghana-registered operating entity, Pharmacy Council license number, named superintendent pharmacist, registered premises with inspection clearance, MDC clinician-employer registration, FDA premises license if applicable, telehealth-specific approvals where required. |
| Dependencies | OR-102 (MDC opinion may shape entity structure) |
| Status | Open |

### OR-102 — Ghana MDC opinion on protocolized prescribing legality

| Field | Value |
|---|---|
| Tier | 1 |
| Owner | Regulatory & Partner Affairs Lead |
| Verifier | External Ghana legal counsel |
| DoD | Written legal opinion from Ghana-licensed counsel addressing: (a) is protocol-authorized refill renewal legally permissible under MDC Act and Pharmacy Council regulations, (b) what accountability structure satisfies the law (named clinician per protocol, standing-order framework, etc.), (c) which medication classes require live clinician review under current law, (d) what disclosures or consents are required from patients. Opinion is filed in cockpit evidence locker. |
| Dependencies | None — gating |
| Status | Open |

### OR-103 — Data residency answer

| Field | Value |
|---|---|
| Tier | 1 |
| Owner | Engineering Lead + Regulatory & Partner Affairs Lead |
| Verifier | External privacy counsel |
| DoD | Decision document recording: physical storage location for Ghana patient data (in-country, regional, or cross-border), DPC registration if cross-border, contractual mechanism (SCCs, BCRs, or jurisdiction-specific), encryption-at-rest key custody, sub-processor list. Recorded as ADR-017 (originally) and superseded by ADR-024 + ADR-026. System Architecture v1.2 §11 reflects current canonical posture. |
| Dependencies | OR-002 (DPIA may dictate residency) |
| Status | Open |

### OR-104 — Adverse-event reporting destination integration

| Field | Value |
|---|---|
| Tier | 1 |
| Owner | Regulatory & Partner Affairs Lead + Pharmacy Operations Lead |
| Verifier | Country Launch Director |
| DoD | Decision recorded: who is reporter-of-record (Telecheck or partner pharmacy or clinician), submission channel (FDA portal API / email / paper), data flow from platform to FDA, WHO VigiBase pathway if applicable, retention obligation, patient-facing transparency about reporting. Adverse Event Slice updated. Integration tested end-to-end against FDA staging environment if available. |
| Dependencies | OR-101, FDA Ghana engagement |
| Status | Open |

### OR-105 — Multilingual coverage specification

| Field | Value |
|---|---|
| Tier | 1 |
| Owner | AI Safety Lead + Community Safety & Moderation Lead + Clinical Governance Lead |
| Verifier | Country Launch Director |
| DoD | Specification covering: (a) language inventory for Ghana launch (English + Twi + Akan + Pidgin minimum, additional per market data), (b) crisis-detection model coverage per language with precision/recall targets, (c) guardrail template language coverage and test-suite parity, (d) moderation Layer 1 keyword/model coverage per language, (e) UI translation scope, (f) operator language coverage in moderator and crisis-response staffing. Or — if launch is restricted to English-speakers — ADR-018 records that decision and the patient-facing acknowledgement. |
| Dependencies | OR-003 (model selection affects language capability) |
| Status | Open |

### OR-106 — Protocol library content (Ghana)

| Field | Value |
|---|---|
| Tier | 1 |
| Owner | Clinical Governance Lead |
| Verifier | Ghana MDC / Pharmacy Council per protocol |
| DoD | Per-protocol document for each launch protocol: refill renewal (per medication class), low-risk dispensing release, emergency routing pathway, async program-pathway protocols (GLP-1, ED, chronic care). Each contains: clinical envelope, eligibility criteria, exclusion criteria, lab/monitoring thresholds, signal-override-rate ceiling, fallback rate ceiling, named accountable clinician, review cadence, rollback procedure, test cases. Filed in cockpit evidence locker per market. |
| Dependencies | OR-102 (legal permission), OR-110 (knowledge base sources for thresholds) |
| Status | Open |

### OR-107 — Guardrail template content + test suites

| Field | Value |
|---|---|
| Tier | 1 |
| Owner | AI Safety Lead |
| Verifier | Clinical Governance Lead |
| DoD | Guardrail Templates v1.0 already includes Conservative Default. This item closes when: program-specific templates exist for each launch program (GLP-1, ED, chronic care, RPM), each has a passing test suite, each has multilingual test variants (per OR-105), each has a documented refusal-rate baseline against which deviation triggers review. |
| Dependencies | OR-003 (model decision affects template tuning), OR-105 (language coverage) |
| Status | Open |

### OR-108 — Ghana moderation policy content

| Field | Value |
|---|---|
| Tier | 1 |
| Owner | Community Safety & Moderation Lead |
| Verifier | Clinical Governance Lead |
| DoD | Ghana moderation policy document covering: community guidelines, prohibited content categories, action thresholds, escalation pathways, crisis-detection trigger taxonomy, language coverage (per OR-105), moderator training curriculum, moderator capacity model with absence handling, appeal process. Tested against the Community Slice §6.4 crisis-detection scenarios. |
| Dependencies | OR-105 |
| Status | Open |

### OR-109 — Pricing document + unit economics model

| Field | Value |
|---|---|
| Tier | 1 |
| Owner | Country Launch Director + (if exists) Finance Lead |
| Verifier | CEO / Founder |
| DoD | Two artifacts: (1) Ghana pricing document covering consult fees (async, sync), per-prescription medication margin model, RPM/CCM monthly subscription tiers, delivery fees, refund/cancellation rules; (2) Unit economics model showing per-patient gross margin, per-refill clinician-time cost, mobile-money fee impact, delivery cost, customer acquisition cost, break-even patient volume, sensitivity to clinician compensation rate. |
| Dependencies | None |
| Status | Open |

### OR-110 — Knowledge-base sourcing decisions

| Field | Value |
|---|---|
| Tier | 1 |
| Owner | Clinical Governance Lead + Pharmacy Operations Lead |
| Verifier | AI Safety Lead |
| DoD | Decision document for each of: drug-drug interactions (vendor / license / refresh cadence / evidence governance), drug-condition (same), drug-lab (same), genotype reference (same — explicitly West-African-aware sources or gap acknowledged), herb-drug interactions (Ghana-relevant phytochemical sources), counterfeit medication reference imagery (sourcing process for legitimate Ghana SKUs). Each decision captures: source, license cost, refresh cadence, evidence quality flag, fallback if vendor disruption. |
| Dependencies | None |
| Status | Open |

### OR-111 — Deployment specification

| Field | Value |
|---|---|
| Tier | 1 |
| Owner | Engineering Lead |
| Verifier | Country Launch Director |
| DoD | Document covering: deployment topology (region, AZ, redundancy), CI/CD pipeline stages, deployment cadence policy, rollback mechanics (timeline, automation), monitoring stack (metrics, logs, traces, alerts), on-call rotation, alert routing, SLO definitions per service, DR runbooks with quarterly testing schedule, secrets management. |
| Dependencies | OR-103 (residency affects topology) |
| Status | Open |

### OR-112 — Test strategy specification

| Field | Value |
|---|---|
| Tier | 1 |
| Owner | Engineering Lead + Clinical Governance Lead |
| Verifier | Country Launch Director |
| DoD | Document covering: unit-test expectations per module, integration-test scenarios across module boundaries, end-to-end test coverage of critical patient journeys (refill, async, sync video, lab upload, AI Mode 1, RPM alert), clinical safety regression suite (must pass before any deploy), guardrail regression suite (per template, per language), interaction engine regression suite (per check class), performance baseline tests (per OR-218), security regression (per OR-217). |
| Dependencies | OR-111 (CI/CD pipeline runs the suites) |
| Status | Open |

### OR-201 through OR-218 — Tier 2 items

(Detail records for Tier 2 items follow the same structure as above. Each is opened with Status: Open, Owner: as named in §2, Verifier: TBD per role assignment, DoD: derived from the corresponding Counsel finding in the 2026-04-25 review. Detail expansion is performed when the item is moved to In Progress.)

### OR-301 through OR-305 — Tier 3 items

(Tier 3 items are tracked but not detailed until Tier 0 and Tier 1 are largely Resolved. Detail expansion happens during the post-launch 90-day plan, per Ghana Launch Playbook §9.)

---

## §4 Cross-cutting dependency map

The following Tier 0 items are *upstream* of multiple Tier 1 items and should be resolved first:

```
OR-003 (AI model decision) ──┬──▶ OR-005 (bias assessment)
                             ├──▶ OR-105 (multilingual)
                             ├──▶ OR-107 (guardrail templates)
                             └──▶ OR-214 (Mode 2 statistical power)

OR-002 (DPIA) ────────────────┬──▶ OR-103 (data residency)
                              └──▶ OR-205 (right-to-erasure carve-out)

OR-102 (MDC opinion) ─────────┬──▶ OR-101 (legal entity)
                              └──▶ OR-106 (protocol library)

OR-105 (multilingual) ────────┬──▶ OR-107 (guardrail templates)
                              └──▶ OR-108 (moderation policy)
```

**Critical path:** Resolving OR-003, OR-002, and OR-102 unlocks the largest fraction of Tier 1 work. These three should be the first work taken on.

---

## §5 Status log

| Date | Item | Status change | Note |
|---|---|---|---|
| 2026-04-25 | All items | Created (Status: Open) | Initial tracker creation following Adversarial Counsel Review session |
| 2026-04-25 | OR-105 | Open → **Resolved** | ADR-018 ratified: English-first launch posture for Track A. Multilingual coverage carried into Future Scope: USSD + AI Bridge v0.1 §4.3 for Track B. |
| 2026-04-25 | OR-221 | Proposed → **Resolved** (never opened as separate item — the proposal in pressure review §"Items to add to the Operational Readiness tracker" was resolved at the same session) | ADR-019 ratified: AI-first lab interpretation with explicit pending-review caveat. Implementation tasks in OR-218 (scope expansion), OR-231, OR-232. |
| 2026-04-25 | OR-219, OR-227 | Proposed → **Open (Tier 1)** | Promoted to Tier 1 from the pressure review. Patient research and OTP-recovery flows are launch-blocking. |
| 2026-04-25 | OR-220, OR-222–OR-226 | Proposed → **Open (Tier 2)** | Added from Patient UI/UX Pressure Review. |
| 2026-04-25 | OR-228, OR-229 | Proposed → **Open (Tier 2)** | Added from Future Scope: USSD + AI Bridge §9. Track A items needed to support future Track B without rework. |
| 2026-04-25 | OR-230 | Proposed → **Open (Tier 3)** | Added from Future Scope: USSD + AI Bridge §9. RBAC actor type reservation. (Note: renumbered to OR-315 in v1.2 for tier consistency.) |
| 2026-04-25 | OR-231, OR-232, OR-233 | Created → **Open (Tier 2)** | Implementation tasks following ADR-018 and ADR-019 ratification. |
| 2026-04-25 | OR-306 | Created → **Open (Tier 3)** | Trigger to schedule Track B PRD authorship when Track A reaches Limited Launch. (Note: renumbered to OR-309 in v1.2.) |
| 2026-04-25 | OR-003 | Open → **Resolved** | ADR-020 ratified: Anthropic Claude primary with multi-provider abstraction. Implementation tasks delegated to OR-301 (LLMProvider abstraction launch readiness) and OR-245 (LLMProvider switching playbook). |
| 2026-04-25 | OR-103 | Open → **Resolved** | ADR-024 ratified: per-tenant KMS keys, AWS af-south-1 hosting per ADR-025. Cross-border processing addressed via Ghana DPC registration (OR-302) and US BAA structure (OR-303). |
| 2026-04-25 | OR-111 | Open → **Partially Resolved** | ADR-025 ratified: AWS af-south-1 primary, us-east-1 DR. Topology specified. CI/CD, rollback procedures, monitoring runbooks, DR testing procedure REMAIN OPEN within OR-111. |
| 2026-04-25 | OR-109, OR-112, OR-218 | Open → **Open (scope expanded)** | Scope additions reflecting multi-tenancy + dual-market launch + Tier-1 ecom: per-tenant unit economics, multi-tenant isolation testing, AI lab interpretation accuracy regression. |
| 2026-04-25 | OR-234 through OR-240 | Created → **Open (Tier 1)** | Multi-tenancy + dual-market + Tier-1 ecom launch-blocking work added: US legal entity, Heros migration project, multi-tenant security review, tenant onboarding manual procedure, SOC 2 evidence collection, LiveKit production deployment, Faster-Whisper pipeline. |
| 2026-04-25 | OR-241 through OR-256 | Created → **Open (Tier 2)** | Tier 2 hardening additions covering: per-tenant audit UI, break-glass implementation, tenant configuration UI, provider abstraction conformance, LLMProvider switching, payment integration testing, subscription state machine, conversion event taxonomy, affiliate MVP, discount engine, conversion dashboards, LiveKit Agents AI Scribe, RLS linting, KMS key rotation, per-tenant rate limits, native-first stack runbooks. |
| 2026-04-25 | OR-301 through OR-319 | Created or renumbered → **Open (Tier 3)** | Tier 3 expansion covering: LLMProvider launch readiness, Ghana DPC registration, US BAA structure, productized tenant onboarding, Heros migration tooling productization, affiliate advanced features, US owned-pharmacy considerations, multi-region readiness, federated patient identity, Faster-Whisper migration trigger, LiveKit self-host migration trigger, commercial drug-DB evaluation. |
| 2026-04-25 | OR-257 through OR-277 | Created → **Open (Tier 2)** | Session 2 of multi-tenancy + Tier-1 ecom + dual-market expansion. Implementation tasks identified by Forms/Intake Engine v2.0, Pharmacy + Refill v2.1, and Admin Backend v1.1 slice PRDs. Covers: visual builder usability research, subscription state machine, cancellation deflection content, multi-product cart, pharmacy adapter conformance, discount engine, affiliate MVP, conversion dashboards, AI-assisted operator features, carrier integration, inventory awareness, compounding extension, save-and-resume, abandonment recovery, A/B testing infrastructure, JSON import/export, new form element types, switch clinical-review pathway, per-tenant audit UI, brand/theming UI, cross-tenant comparison dashboard. |
| 2026-04-26 | OR-103 | Resolved (reframed) | Closing rationale updated under ADR-026 (supersedes ADR-025): per-tenant KMS abstraction unchanged; physical region updated from `af-south-1` to `us-east-1` primary with `us-west-2` cold DR. |
| 2026-04-26 | OR-111 | Partially Resolved (reframed) | Topology under ADR-026: AWS us-east-1 primary, us-west-2 cold DR. CI/CD, rollback procedures, monitoring runbooks, DR testing procedure REMAIN OPEN within OR-111. Note: DR posture is cold DR (RTO hours-to-low-tens-of-hours per System Architecture v1.2 §11.3); was warm-snapshot framing under ADR-025. |
| 2026-04-26 | OR-302 | Open (rescoped) | Ghana DPC cross-border registration: Ghana patient data is processed in us-east-1 (United States) per ADR-026. Specific contractual mechanism (jurisdictional instrument under Ghana DPC), patient-facing privacy disclosure language, and sub-processor list all carry **[COUNSEL-REQUIRED]** markers. Prior af-south-1 framing superseded. |
| 2026-04-26 | OR-303 | Open (simplified) | US BAA structure under ADR-026 is a standard HIPAA-region chain (Heros → Telecheck → AWS US, all US-jurisdiction). Was non-standard cross-border BAA framing under ADR-025; the cross-border concern is removed for the US tenant under ADR-026. **Superseded 2026-05-02 — see entry below.** |
| 2026-05-02 | OR-303 | Open (canonical 3-party chain) | **Supersedes the 2026-04-26 entry above per Codex Round-5 Scope 4 HIGH-3 finding aligning with System Architecture v1.2 §11.4 (rewritten 2026-05-02 per Codex Round-2 Scope 4 HIGH-2 + Round-3 Scope 4 HIGH-2 patches).** Canonical BAA chain under ADR-026: **Telecheck Health LLC (Telecheck-US tenant operator; Heros Health DBA consumer surface) → Telecheck parent/platform (separate business associate; data-plane operator + per-tenant KMS / RLS enforcement layer per ADR-023) → AWS US (subprocessor)**. The prior `Heros → Telecheck → AWS US` shorthand violated the C3 brand-structure rule (bare `Heros` as tenant identifier) AND collapsed two distinct business-associate parties into one (the operating tenant and the platform parent are separate BAA parties because the platform parent operates the multi-tenant data plane and per-tenant encryption keys). Definition of Done: evidence collected for each of the three parties; counsel review and subprocessor documentation reflect all three parties separately. |

---

## §6 Adding new items

When a new operational gap is identified:

1. Propose an item with: title, source (which review or finding), proposed tier, proposed owner, proposed DoD
2. Country Launch Director or designate confirms tier and owner
3. Item is added to §2 with the next sequential ID in its tier (Tier 0: OR-00X, Tier 1: OR-1XX, Tier 2: OR-2XX, Tier 3: OR-3XX)
4. Detail record added to §3
5. Status log entry added to §5

**Tier inflation discipline:** New items default to the lowest defensible tier. Promotions to Tier 0 or Tier 1 require Country Launch Director approval and a recorded rationale.

---

## §7 Counts and tracking

| Tier | Count | Status: Open | In Progress | Blocked | Resolved | Verified |
|---|---|---|---|---|---|---|
| Tier 0 | 4 (was 5, –1 OR-003 resolved by ADR-020) | 4 | 0 | 0 | 0 | 0 |
| Tier 1 | 19 (was 13, –1 OR-103 resolved by ADR-024, +7 OR-234 through OR-240 added for multi-tenancy + dual-market + Tier-1 ecom; OR-111 partially resolved) | 19 | 0 | 0 | 0 | 0 |
| Tier 2 | 64 (was 43, +21 OR-257 through OR-277 added in Session 2 for Tier-1 slice implementation) | 64 | 0 | 0 | 0 | 0 |
| Tier 3 | 19 (was 7, +12 OR-301 through OR-319 added for Phase 2 / post-launch follow-on) | 19 | 0 | 0 | 0 | 0 |
| **Total active** | **106** | **106** | **0** | **0** | **0** | **0** |
| **Resolved** | **4** (OR-003, OR-103, OR-105, OR-221) | — | — | — | — | — |
| **Partially resolved** | **1** (OR-111 — topology specified by ADR-025; CI/CD, runbooks, monitoring remain open) | — | — | — | — | — |

---

## §8 Relationship to other tracking documents

| Document | What it tracks | This tracker's relationship |
|---|---|---|
| Artifact Registry v2.10 (per v1.10 PRD Update Cycle Phase 6 promotion 2026-05-01) | Which versions of which artifacts are canonical | Disjoint — this tracker tracks operational evidence, not artifacts |
| Promotion Ledger v1.0 (P-001 through P-009) | User-requested promotion of artifacts to canonical | Disjoint — this tracker tracks operational gaps, not document promotions |
| Consolidated Launch Tracker v1.0 | Open clinical/product questions, pre-launch decisions | Partial overlap — items here that resolve open tracker questions are cross-referenced |
| Cockpit Evidence Locker | Per-market regulatory/clinical evidence artifacts | Downstream — operational evidence produced here is filed in the locker |
| Ghana Launch Playbook v1.1 | Launch sequence, go/no-go criteria | Upstream — Tier 1 items in this tracker map to go/no-go categories in §6 of the Playbook |
| Flagged Items Resolution v1.0 | Decisions that resolve flagged items from prior reviews | Historical — closed; new operational items go here |

---

## Document control

- **v1.5 cycle additions — 2026-05-02 (per v1.10.1 hygiene cycle physical merge of Phase5 delta Group 5D, Rows 45 + 55 + 75):** Row 45 — OR-109 wording updated for C3 brand-structure cascade ("per-tenant unit economics (Heros + Telecheck-Ghana)" → "per-tenant unit economics (Telecheck-US [Heros Health DBA] + Telecheck-Ghana [Heros Health Ghana DBA])"). Row 55 — added 3 new Tier 1 items per ADR-027 v0.6: OR-113 Marketing copy governance lead designation; OR-114 First molecule-level marketing copy approval — Ghana; OR-115 CCR marketing key initial values per country (US `prohibited` permanent; Ghana `pending_evidence`). Row 75 — added 5 new Tier 1 items per ADR-028 v0.5: OR-116 REC partnership designation — Ghana; OR-117 Research data-use consent text — drafted + ethics-reviewed; OR-118 DSA template — legal-reviewed; OR-119 De-identification standard — chosen + documented (Safe Harbor + k-anonymity, k_min = 11); OR-120 Initial WHO/UN partner identification. Net active items: +8 (was 103 at v1.5 baseline; now 111). Tier counts (§7) should be incremented by 8 in Tier 1 at next refresh. Parent-doc reference bumped Master PRD v1.9 → v1.10 in newly added items. Existing v1.5 baseline content otherwise unchanged.
- **v1.5** — Region migration per ADR-026 (supersedes ADR-025), Cycle U-003 of US Region Migration workstream. OR-103 closing rationale reframed under ADR-026 (per-tenant KMS unchanged; physical region updated). OR-111 topology framing reframed under ADR-026 (us-east-1 primary, us-west-2 cold DR; cold-DR posture noted; CI/CD, runbooks, monitoring remain open). OR-302 rescoped: Ghana DPC cross-border registration with Ghana data processed in us-east-1; specific contractual mechanism, patient-facing privacy disclosure language, and sub-processor list all marked **[COUNSEL-REQUIRED]**. OR-303 simplified: standard HIPAA-region BAA chain (Heros → Telecheck → AWS US, all US-jurisdiction); was non-standard cross-border framing under ADR-025. Status log entries appended for these 4 reframings (2026-04-26). Parent-document header bumped to Master PRD v1.9 / ADR Addendum 026 added; companion-doc Ghana Launch Playbook v1.1 → v1.2. No new items added; no items closed; net active items unchanged.
- **v1.4** — Remediation cycle revision per Adversarial Counsel Review v1.0 finding HIGH-12 product decision (Product Lead, 2026-04-25): Heros launches greenfield within Telecheck — no migration. Removes 3 Heros-migration-related items: OR-235 (Heros migration project plan), OR-311 (Heros migration tooling productization). Reframes OR-272 to remove Heros-migration component (JSON import/export remains for tenant onboarding). Net active items: 103 (was 106 in v1.3). All other items, sequencing, and tier classifications preserved.
- **v1.3** — Session 2 of multi-tenancy + Tier-1 ecom + dual-market expansion. Adds 21 new Tier 2 items (OR-257 through OR-277) covering implementation tasks identified by Forms/Intake Engine v2.0, Pharmacy + Refill v2.1, and Admin Backend v1.1 slice PRDs: visual builder usability research, subscription state machine, cancellation deflection, multi-product cart, pharmacy adapter conformance, discount engine, affiliate MVP, conversion dashboards, AI-assisted operator features, carrier integration, inventory awareness, compounding extension, save-and-resume, abandonment recovery, A/B testing infrastructure, JSON import/export, new form element types, switch clinical-review pathway, per-tenant audit UI, brand/theming UI, cross-tenant comparison dashboard. Total active items: 106.
- **v1.2** — Same-session patch following ratification of ADR-020 through ADR-025 (LLM provider, LiveKit self-hosted, native-first stack, multi-tenancy Model A, country-driven config, AWS hosting). Closes OR-003 (LLM decision), OR-103 (data residency). Partially closes OR-111 (topology specified). Expands scope of OR-109, OR-112, OR-218 for multi-tenancy and dual-market. Adds 33 new items (OR-234 through OR-256, OR-301 through OR-319) covering multi-tenancy implementation, US compliance, Heros migration, Tier-1 ecom hardening, native-first stack runbooks, Phase 2 capabilities. Total active items: 85.
- **v1.1** — Same-session patch following ratification of ADR-018 (English-first launch posture) and ADR-019 (AI-first lab interpretation with caveat), and integration of the Patient UI/UX Pressure Review findings and the Future Scope: USSD + AI Bridge document. Resolves OR-105 (carried to Track B scope) and OR-221 (closed by ADR-019). Adds 13 new items. Total active items: 52.
- **v1.0** — Initial Operational Readiness To-Do tracker. 40 items across 4 tiers, sourced from the 2026-04-25 Adversarial Counsel Review's convergent findings, unresolved Red-Team Review items, and Registry v2.3 §6 recommended next actions.
- **Update cadence:** Status log (§5) updated on every item state change. Counts (§7) updated weekly during launch preparation.
- **Change discipline:** New items follow §6. Tier changes require Country Launch Director approval and a logged rationale.
