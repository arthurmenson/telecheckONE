# Telecheck — Tenant Threading Addendum

**Version:** 1.0
**Status:** Canonical — peer to the v1.0 slice PRDs and IA documents it extends
**Owner:** Product (Telecheck)
**Date:** 2026-04-25
**Origin:** Adversarial Counsel Review v1.0 finding CRITICAL-05 remediation
**Format:** Markdown

---

## 1. Purpose

This addendum threads multi-tenancy (per ADR-023) and country-driven configuration (per ADR-024) through the slice PRDs and IA documents that were not bumped to v2.0 / v1.1 in Sessions 1–3. The original Adversarial Counsel Review v1.0 finding CRITICAL-05 documented that 7 slice PRDs and 3 IA documents — collectively about 10 canonical artifacts — describe a single-tenant world despite the platform now being multi-tenant.

Three remediation options were considered (per finding CRITICAL-05): (a) bump every affected slice PRD and IA to v1.1 individually (heavyweight; estimated 2 sessions); (b) author this single cross-cutting addendum referenced by Registry as a peer to the unchanged slices (medium; estimated 1 session); (c) rely on Contracts Pack v5.1 alone (lightweight; risky). Product chose option (b) for this remediation cycle. If option (a) is desired in a future cycle, this addendum becomes the authoring template for the per-slice v1.1 bumps.

This addendum is canonical alongside the v1.0 slices it references. Until those slices are individually bumped to v1.1, this addendum's §3 rules govern how multi-tenancy applies.

---

## 2. Documents this addendum extends

| # | Document | Current version | This addendum's section | Notes |
|---|---|---|---|---|
| 1 | Telecheck_AI_Clinical_Assistant_Slice_PRD_v1_0.md | v1.0 | §3.1 | Mode 1 + Mode 2 architecture |
| 2 | Telecheck_Async_Consult_Slice_PRD_v1_0.md | v1.0 | §3.2 | Async consult workflow |
| 3 | Telecheck_Sync_Video_Consult_Slice_PRD_v1_0.md | v1.0 | §3.3 | Sync video via LiveKit |
| 4 | Telecheck_RPM_CCM_Slice_PRD_v1_0.md | v1.0 | §3.4 | Remote patient monitoring |
| 5 | Telecheck_Community_Platform_Slice_PRD_v1_0.md | v1.0 | §3.5 | Patient community |
| 6 | Telecheck_Adverse_Event_Reporting_Slice_PRD_v1_0.md | v1.0 | §3.6 | Adverse event reporting |
| 7 | Telecheck_Consent_Delegated_Access_Slice_PRD_v1_0.md | v1.0 | §3.7 | Consent and delegate access |
| 8 | Telecheck_Medication_Interaction_Engine_Slice_PRD_v1_0.md | v1.0 | §3.8 | Medication interactions |
| 9 | Telecheck_Herb_Drug_Interaction_Engine_Slice_PRD_v1_0.md | v1.0 | §3.9 | Herb-drug interactions |
| 10 | Telecheck_Labs_Document_Interpretation_Slice_PRD_v1_0.md | v1.0 | §3.10 | Lab document interpretation |
| 11 | Telecheck_Fake_Medication_Detection_Slice_PRD_v1_0.md | v1.0 | §3.11 | Fake med detection |
| 12 | Telecheck_Acquisition_Engagement_Tools_Slice_PRD_v1_0.md | v1.0 | §3.12 | Acquisition tools |
| 13 | Telecheck_Patient_App_IA_v1_0.md | v1.0 | §3.13 | Patient app IA |
| 14 | Telecheck_Clinician_Portal_IA_v1_0.md | v1.0 | §3.14 | Clinician portal IA |

---

## 3. Per-document tenant threading rules

### 3.1 AI Clinical Assistant Slice PRD v1.0

**Mode 1 conversational AI:**
- Every Mode 1 conversation is tenant-scoped per AI_LAYERING contract v5.1 §9. The conversation_session entity carries tenant_id; conversation history does not cross tenant boundaries even when the same human has accounts in multiple tenants.
- AI provider selection is platform-scoped per ADR-020. Tenants may not override LLM provider for clinical AI (Mode 1 or Mode 2). This is intentional — clinical behavior must be consistent across tenants.
- Crisis detection guardrails per I-019 are platform-scoped and cannot be weakened by any tenant.
- Tenant context (brand voice, tenant-specific copy variants) flows into Mode 1 system prompts via the Tenant Configuration module per System Architecture v1.2 §13.

**Mode 2 case prep AI:**
- Mode 2 protocol selection is tenant-scoped via the tenant's protocol library. A tenant in Ghana uses the Ghana Protocol Library; a US tenant uses the US Protocol Library when available. Per Operations Truth artifacts.
- Tenant Clinical Lead activates which protocols are available within their tenant via Admin Backend (per Admin Backend v1.1 §5).
- Mode 2 evaluations are stored tenant-scoped per CDM v1.3 §3.6 (Mode2Evaluation entity inheritance).
- Clinician sign-off on Mode 2 outputs is scoped to clinicians authorized for that tenant per RBAC v1.1.

**Audit:**
- Every AI action audited per AUDIT_EVENTS v5.3 (carries forward v5.1/v5.2 prose unchanged; live emissions resolve against v5.3 post-P-011 / SI-001 closure 2026-05-11) with tenant_id (Category A for clinical decisions; Category C for purely conversational interactions without clinical recommendations).

### 3.2 Async Consult Slice PRD v1.0

**Consult queue:**
- Async consults are tenant-scoped. A clinician sees consults from tenants they are authorized for per RBAC v1.1.
- A clinician may be authorized for multiple tenants (uncommon but supported; each authorization is independent and audited). When viewing the consult queue, the clinician explicitly selects tenant context — there is no merged-multi-tenant view at the workflow level.
- Tenant Operator sees only their tenant's consult queue.

**Intake data flow:**
- Intake data flowing into a consult is tenant-scoped per FORMS_ENGINE v5.1 contract. Same person across tenants has independent intake submissions per tenant.
- AI Mode 2 case prep operates on the tenant's data only.

**Clinician communication:**
- Patient-facing clinician messages render with tenant brand. The clinician's identity (name, photo, credentials) is consistent across tenants but the surrounding UI is tenant-themed.

**Audit:**
- Consult audit events carry tenant_id. Cross-tenant clinician activity (a single human clinician working consults across two tenants) produces tenant-scoped audit per consult, not merged.

### 3.3 Sync Video Consult Slice PRD v1.0

**LiveKit room scoping:**
- Each sync video consult creates a LiveKit room scoped to the consult, which is itself tenant-scoped. Room IDs include tenant context to prevent cross-tenant collision.
- Room access tokens are issued for the specific consult and validate against tenant scope at room-join time.

**Recording storage:**
- If session recording is enabled (per tenant policy), recordings are stored tenant-scoped in the encryption-keyed-by-tenant S3 bucket structure per CDM v1.3 §7.
- Cross-tenant recording access requires break-glass per I-024.

**Patient-facing UI:**
- Pre-call screen, in-call UI, and post-call screen render with tenant brand.
- Network quality indicators, fallback paths, and degraded-mode behavior per LiveKit are tenant-agnostic infrastructure.

**Per-country adapter notes:**
- Ghana market may experience higher network variance; the slice's degraded-mode behavior (audio-only fallback, per Sync Video Consult Slice v1.0) applies regardless of tenant but tenant copy variants per Notification Spec v1.1 may customize the patient-facing degraded-mode messaging.
- **Phase 2 / open option (per ADR-026):** Optional regional media routing for Ghana sync video — a LiveKit edge node in `af-south-1` (Cape Town) or `eu-west-1` (London/Frankfurt) can route media (RTP/SRTP) for Ghana patients while the data plane (room state, signaling persistence, recordings if any) remains in `us-east-1`. Reduces media RTT for Ghana patients (typical ~150–250ms RTT to us-east-1 vs ~50–100ms to af-south-1) without changing canonical data residency. Explicitly **Phase 2** capability; not launch scope. Triggers consideration if Ghana sync video latency becomes a launch issue per Sync Video Consult Slice degraded-mode metrics.

### 3.4 RPM/CCM Slice PRD v1.0

**Monitoring data:**
- RPMReading entity is tenant-scoped per CDM v1.3 §3.8. Patient readings in Tenant A are not visible in Tenant B even if the same human has readings in both.
- Device pairing is tenant-scoped (a Bluetooth glucometer paired in Telecheck-Ghana doesn't appear in Telecheck-US).

**Alerting:**
- Critical alerts (per RPM Alert state machine in State Machines v1.2 §7) escalate to the tenant's clinician on-call roster, not platform-wide.
- Alert thresholds may be tenant-customizable per protocol — Tenant Clinical Lead approval required.

**Care plan:**
- Care plans referenced by RPM are tenant-scoped per Care Delivery module.

### 3.5 Community Platform Slice PRD v1.0

**Communities at launch:**
- Communities are scoped to a single tenant at launch. A patient in Telecheck-Ghana sees only Telecheck-Ghana communities; same for Telecheck-US.
- Cross-tenant communities (e.g., a "GLP-1 patients across all tenants" community) are deferred to Phase 2 — not in launch scope.

**Moderation:**
- Tenant Operator with moderation role moderates their tenant's communities.
- Crisis detection per I-019 applies platform-wide; crisis-detected content escalates to the tenant's clinical safety contact and (in extreme cases) Platform AI Safety per RBAC v1.1.

**Identity in community:**
- Patient display names, avatars, and posting history are tenant-scoped. The same human's Telecheck-Ghana persona (Heros Health Ghana DBA surface) and Telecheck-US persona (Heros Health DBA surface) are independent (per ADR-023 — same person across tenants = separate accounts).

### 3.6 Adverse Event Reporting Slice PRD v1.0

**AE records:**
- Adverse Event entities are tenant-scoped per CDM v1.3 §3.10 (inherited entity tenant scoping).
- Tenant Clinical Lead is responsible for reviewing and escalating AEs in their tenant.
- Cross-tenant AE pattern detection (a defect appearing in multiple tenants — e.g., a GLP-1 product showing the same side effect across tenants) is performed at platform level by Platform Clinical Governance per GOVERNANCE_CONTROLS v5.1 §6.3.

**External reporting:**
- FDA MedWatch (US) reporting is per-tenant — Telecheck-US reports its AEs; if a future US tenant exists it reports its own.
- Ghana FDA reporting (where applicable) is per-tenant for Telecheck-Ghana.
- Platform Clinical Governance may aggregate cross-tenant AE patterns for internal safety review without disclosing tenant-specific data externally.

### 3.7 Consent & Delegated Access Slice PRD v1.0

**Consent records tenant scoping:**
- Consent records carry tenant_id per TYPES v5.1 ConsentRecord schema. A patient's consent in Tenant A does not transfer to Tenant B; if the same human registers in both tenants, they grant consent independently in each.
- Consent text variants per tenant are governed by Master PRD §15 progressive consent presentation; tenant_id-scoped variants per Notification Spec v1.1 tenant variant model apply.

**Delegate access tenant scoping:**
- Delegations carry tenant_id per TYPES v5.1 DelegateAccess schema. A delegate authorized for Patient X in Tenant A is not automatically authorized for Patient X's account in Tenant B (if it exists).
- Cross-tenant delegations (a single delegate managing one human's care across tenants) are not in launch scope.

**Bridge supply on consent revocation:**
- Per ADR-008 and I-021. When a patient revokes consent that affects an active subscription on an abrupt-discontinuation medication, the subscription transitions to SAFETY_HOLD per State Machines v1.2 §15, and a bridge supply is dispensed. This is tenant-scoped (the bridge supply originates from the same tenant's pharmacy adapter) but the invariant applies in every tenant identically.

### 3.8 Medication Interaction Engine Slice PRD v1.0

**Engine scope:**
- The medication interaction engine itself is platform-scoped infrastructure. The engine's knowledge base (RxNorm, drug-drug interaction database) is shared across tenants — there is no tenant-customized drug interaction logic at launch.
- Engine evaluations are tenant-scoped — each evaluation produces InteractionSignal records carrying tenant_id, tied to the patient's tenant-scoped MedicationRequest record.

**Override authority:**
- Clinician override of an interaction signal requires authorization for that tenant per RBAC v1.1.
- Override audit is Category A per AUDIT_EVENTS v5.3 (carries forward v5.1/v5.2 prose unchanged; live emissions resolve against v5.3 post-P-011 / SI-001 closure 2026-05-11).

**Tenant-specific configurations:**
- A tenant may add tenant-specific medication formulary restrictions (e.g., a Ghana tenant whose preferred pharmacy doesn't carry brand-name GLP-1) via ProductCatalog per CDM v1.3 §4.9. The interaction engine still evaluates the medication chemistry; the formulary restriction is a separate prescribability check.

### 3.9 Herb-Drug Interaction Engine Slice PRD v1.0

**Engine scope:**
- Herb-drug engine is platform-scoped infrastructure.
- Knowledge base content (herbal medicine entries and drug interactions) is platform-scoped at launch. Tenant Clinical Lead may submit additions/corrections via governance workflow per GOVERNANCE_CONTROLS.

**Tenant relevance:**
- The Telecheck-Ghana tenant relies heavily on this engine due to the prevalence of herbal medicine reporting in the Ghana intake flow. Telecheck-US tenant uses it less actively but the engine is available.

**Audit:**
- Herb-drug signal evaluations carry tenant_id; the patient context is always tenant-scoped.

### 3.10 Labs Document Interpretation Slice PRD v1.0

**Document scoping:**
- Patient lab documents are tenant-scoped per CDM v1.3 §3.7 Document entity.
- AI Mode 1 lab interpretation per ADR-019 happens within tenant context — interpretation copy reflects tenant brand voice via tenant copy variants.

**Provider integrations:**
- US: Quest Diagnostics, LabCorp integrations (when available) are per-tenant adapter selections. Ghana: locally-arranged lab partner integrations per Telecheck-Ghana operations.
- Lab values flow into the canonical Patient record tenant-scoped.

**Clinician review:**
- "Not yet reviewed by your doctor" caveat per ADR-019 applies in every tenant.
- Clinician review is by clinicians authorized for that tenant.

### 3.11 Fake Medication Detection Slice PRD v1.0

**Detection scope:**
- Fake medication detection is most relevant for the Telecheck-Ghana market per the Ghana Launch Playbook. The slice's photo-based detection workflow is available platform-wide but emphasized in Ghana.
- Detection signals (fake-med flags) are tenant-scoped — the patient who submitted the photo is in a specific tenant context.

**Reporting workflow:**
- Confirmed fake-med detections may be reported to local authorities per the tenant's regulatory profile (Ghana FDA for Telecheck-Ghana; US FDA for US tenants if applicable).
- Cross-tenant pattern detection (same fake-med distribution affecting multiple tenants) is platform-level analysis by Platform Operations.

### 3.12 Acquisition & Engagement Tools Slice PRD v1.0

**Tools tenant scoping:**
- All acquisition / engagement tools (referral programs, marketing campaigns, onboarding tour customizations) are tenant-scoped.
- A campaign authored by Telecheck-US marketing (Heros Health DBA consumer-surface scope) is not visible in Telecheck-Ghana and vice versa.
- Per-tenant marketing analytics dashboards per Admin Backend v1.1 §5.6.

**Affiliate program:**
- Affiliate accounts and conversions are tenant-scoped per CDM v1.3 §4.14-§4.15. Telecheck-US (Heros Health DBA scope) operates its own affiliate program; Telecheck-Ghana (Heros Health Ghana DBA scope) operates its own (manual reconciliation at launch).

**Cross-tenant marketing:**
- The Telecheck platform itself (as marketed for tenant onboarding) is not addressed in this slice — that is platform-level Sales/BD function.

### 3.13 Patient App IA v1.0

**Single brand per session:**
- The patient app is single-tenant from the patient's perspective — they sign in once and see their tenant's brand throughout the session.
- A human with accounts in both tenants must sign in to one or the other; no merged multi-tenant patient view at launch.
- Tenant context resolved at login per Identity & Auth Spec v1.0 (which itself is tenant-aware via the tenant_id on Account).

**App routing for human with multiple tenant accounts:**
- The patient app at launch supports one signed-in account per device session. Switching between tenant accounts requires sign-out and sign-in.
- Federated patient identity across tenants (a unified "switch tenant" toggle) is Phase 2 — not in launch scope.

**Brand rendering:**
- Logo, primary color, secondary color, accent color, typography overrides applied at app boot per tenant brand resolution.
- Default platform brand (Telecheck-Ghana's brand at launch, since that's the platform's own brand) renders if tenant context cannot be resolved (error condition).

**Notification copy:**
- In-app and push notification copy renders tenant-scoped variants per Notification Spec v1.1.

### 3.14 Clinician Portal IA v1.0

**Tenant authorization context:**
- Clinician sees only data for tenants they are authorized for per RBAC v1.1.
- A clinician authorized for one tenant only sees one tenant context; the UI does not surface other tenants.
- A clinician authorized for multiple tenants (rare) sees a tenant selector at the top of the portal; they explicitly select working context. No merged-tenant data views at the workflow level.

**Tenant context badge:**
- The clinician portal displays an active-tenant badge prominently in the header when the clinician has multi-tenant authorization. This is intentional friction per I-024 spirit — cross-tenant work should be visibly distinct.

**Brand rendering:**
- Clinician portal renders the tenant brand the clinician is currently working in. Switching tenant context re-themes the portal.

**Audit on tenant switch:**
- Each tenant switch by a clinician is audited per AUDIT_EVENTS v5.3 (carries forward v5.1/v5.2 prose unchanged; live emissions resolve against v5.3 post-P-011 / SI-001 closure 2026-05-11) Category C (operational); pattern detection on unusually frequent switches surfaces to Platform Privacy Officer.

---

## 4. Authority statement

This addendum is canonical at the same tier as the v1.0 slice PRDs and IA documents it extends. Per Source of Truth contract v5.1, when this addendum's §3 rules conflict with the literal text of the v1.0 documents, the addendum governs (because the addendum reflects the multi-tenancy architectural decisions ratified in ADR-023 and ADR-024 which are at higher precedence tier than the v1.0 documents that pre-date them).

Future remediation cycles may bump individual v1.0 documents to v1.1 incorporating their respective §3.X content from this addendum into the document itself. When that happens, the corresponding §3.X subsection here is marked "Superseded by [Document] v1.1 [corresponding section]" rather than removed (preserving traceability).

---

## 5. Open questions

1. **Federated patient identity across tenants** — when a single human has accounts in multiple tenants, can they get a unified view? Default proposal: not at launch; Phase 2 work.
2. **Cross-tenant communities** — patient communities spanning tenants for shared programs (e.g., GLP-1 across all tenants). Default proposal: not at launch; Phase 2.
3. **Cross-tenant clinician network** — a clinician authorized to work across many tenants efficiently. Default proposal: at launch, supported but rare; UX optimization Phase 2.
4. **Cross-tenant AE pattern detection automation** — currently a human-driven Platform Clinical Governance process. Could be partly automated. Default proposal: launch with human-driven; automate Phase 2.

---

## 6. Dependencies

- **ADR-023 multi-tenancy Model A** — origin of this addendum's necessity
- **ADR-024 country-driven config** — shapes tenant-country relationships
- **Contracts Pack v5.1** (INVARIANTS, AUDIT_EVENTS, DOMAIN_EVENTS, GLOSSARY, etc.) — substrate for the threading
- **CDM v1.3** — tenant-scoped entities
- **State Machines v1.2** — tenant-scoped state transitions
- **OpenAPI v0.2** — tenant-scoped endpoint contracts
- **RBAC v1.1** — dual hierarchy enforcement
- **Tenant Configuration module** per System Architecture v1.2 §13 — runtime tenant resolution
- **Notification Spec v1.1** (per MEDIUM-14 remediation) — tenant variant resolution
- **Design System v1.1** (per MEDIUM-17 remediation) — tenant brand token overlay

---

## v1.10 cycle additions (added 2026-05-02 per v1.10.1 hygiene cycle physical merge of `Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` Group 5B §Tenant_Threading row 31)

### Tenant ID examples sweep — C3 brand-structure refresh (Row 31)

All §3.X slice addenda using `Heros-Health` as the US tenant ID example are renamed to `Telecheck-US`. Where consumer-brand context is relevant (patient-facing surfaces, marketing copy, notification sender display name), the parenthetical qualifier "Heros Health DBA" is appended.

**Before / after pattern (applies wherever `Heros-Health` appeared as a tenant ID example in v1.0 §3.X content):**

| Before | After |
|---|---|
| `tenant_id: Heros-Health` | `tenant_id: Telecheck-US` |
| "the Heros tenant" | "the Telecheck-US tenant (Heros Health DBA)" |
| "Heros admin selects..." | "Telecheck-US tenant admin (Heros Health DBA scope) selects..." |
| `https://heros-health.example.com/...` | `https://heroshealth.com/...` (consumer subdomain per `tenant.consumer_subdomain`) |
| sender_display_name: "Heros" | sender_display_name: "Heros Health" (consumer DBA, sourced from `tenant.consumer_dba`, never from `tenant.id`) |

The same sweep applies symmetrically to Telecheck-Ghana: bare `Heros-Ghana` or `Telecheck Ghana` references in §3.X addenda are normalized to operating tenant `Telecheck-Ghana` with consumer DBA `Heros Health Ghana` where consumer-brand context applies.

**Cross-references:**
- Master PRD v1.10 §17 (canonical brand-vs-identifier rule)
- Glossary v5.2 §Brand and tenant terms
- CDM v1.3 v1.10 cycle additions §Tenant entity (consumer_dba, legal_entity, consumer_subdomain columns)
- RBAC v1.1 v1.10 cycle additions §Tenant scoping examples (Row 29)
- MARKET_LAUNCH v5.1 §Cross-reference to Master PRD §10.5 (program catalog architecture)

This sweep is **mechanical** (find-and-replace pattern with optional DBA qualifier where consumer-brand context applies). No semantic change to the tenant-threading model itself; only the example values change. The §3.X subsection structure and per-slice threading content remain valid.

---

## Document control

- **v1.0 (refreshed 2026-04-26 per ADR-026, US Region Migration Cycle U-003)** — Added single Phase 2 media-routing note in §3.3 Sync Video Consult Slice Per-country adapter notes: optional LiveKit edge node in af-south-1 or eu-west-1 for Ghana media RTT reduction while data plane remains us-east-1. Explicitly Phase 2; not launch scope. No other §3.X content modified; no broader topology change. No version bump (single additive note within an existing subsection; consistent with this addendum's per-section additive structure).
- **v1.0** — NEW addendum produced as remediation for Adversarial Counsel Review v1.0 finding CRITICAL-05. Threads multi-tenancy and country-driven configuration through 14 unchanged v1.0 slice PRDs and IA documents. Authoritative at the same tier as the documents it extends. May be superseded section-by-section as individual documents are bumped to v1.1 in future cycles.
- **v1.0 (refreshed 2026-05-02 per v1.10.1 hygiene cycle physical merge of `Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` Group 5B §Tenant_Threading row 31)** — Additive content under "v1.10 cycle additions" section above. Mechanical tenant-ID examples sweep per C3 brand structure: all `Heros-Health` US tenant ID examples → `Telecheck-US` with `Heros Health` DBA qualifier where consumer-brand context applies; symmetric refresh for Telecheck-Ghana / Heros Health Ghana. Sender display names sourced from `tenant.consumer_dba` per CDM v1.3 v1.10 cycle additions, never from `tenant.id`. No semantic change to tenant-threading model; example values only. Per Master PRD v1.10 §17 + Glossary v5.2 §Brand and tenant terms + CDM v1.3 v1.10 cycle additions + RBAC v1.1 v1.10 cycle additions. No version-number bump (entry-level refresh; addendum remains at v1.0).
- **Next review:** after the first individual v1.0 → v1.1 slice PRD bump completes, to verify the addendum's content was correctly absorbed and the §3.X subsection can be marked superseded.
- **Change discipline:** per-document additions to this addendum require Engineering Lead + Tenant Clinical Lead sign-off where the addition affects clinical workflow.
