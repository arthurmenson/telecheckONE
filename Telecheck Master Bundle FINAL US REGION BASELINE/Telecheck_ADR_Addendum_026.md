# Telecheck — ADR Addendum: ADR-026

**Version:** 1.0
**Status:** Canonical
**Owner:** Engineering Lead + Platform Privacy Officer
**Date:** 2026-04-26
**Format:** Markdown
**Supersedes:** ADR-025 (AWS af-south-1 primary, us-east-1 DR)
**Companion documents:** ADR Set v1.0, ADR Addendum 016–019, ADR Addendum 020–025 (with ADR-025 superseded), System Architecture v1.2, Master Platform PRD v1.9, Operational Readiness To-Do v1.4 (to be bumped in U-003)

---

## ADR-026: Single-region US primary (us-east-1) with us-west-2 cold DR

### Status

**Accepted** — 2026-04-26.

This ADR supersedes ADR-025. ADR-025 is retained in the ADR Addendum 020–025 document for traceability with a "Superseded by ADR-026" marker.

### Context

ADR-025 (2026-04-25) ratified a single-region production deployment in AWS `af-south-1` (Cape Town) with disaster-recovery snapshots replicated to `us-east-1` (Virginia). The rationale at that time prioritized:
- Proximity to Telecheck-Ghana (the chronic-care anchor tenant)
- Distance from US for tenant-data isolation framing
- Single-region operational simplicity

Since ADR-025, the operating context has changed:
- Heros Health (US tenant) is now the launch-priority tenant alongside Telecheck-Ghana, with Tier-1 US DTC ecom scope (per Master PRD v1.9 §5.1)
- The bulk of patient volume, billing volume, and compliance surface area at launch is US-based
- US-based Heros operations require US-region processing for the cleanest HIPAA Business Associate Agreement chain (no non-standard region for US patient data)
- Telecheck-Ghana's operating posture, while real, is launch-pilot scale; the cross-border surface for Ghana data is a manageable jurisdictional question rather than a regional-architecture driver
- AWS service availability, partner integrations (Stripe, Twilio, payer-network adapters when relevant), and HIPAA-eligible service maturity are stronger in `us-east-1` than in `af-south-1`

### Decision

The Telecheck platform runs in a single AWS region:

- **Primary region:** `us-east-1` (Virginia)
- **Disaster recovery:** `us-west-2` (Oregon), **cold DR** (snapshot replication and infrastructure-as-code; no warm standby at launch)
- **Single shared primary stack:** Both Heros and Telecheck-Ghana run on the same primary stack. No per-tenant region split. No per-country database split. No per-country schema split.
- **Tenant isolation** continues to be enforced as previously specified: `tenant_id` on every record, PostgreSQL Row-Level Security policies, per-tenant KMS encryption keys (now resident in `us-east-1`), application-layer query filtering. The isolation mechanism does not depend on region; the region change does not weaken or strengthen tenant isolation.

### Consequences

#### Cross-border posture for Telecheck-Ghana data

Ghana patient data is processed in the United States (`us-east-1`). This is an explicit, accepted architectural posture. The implications:

- **Jurisdictional mechanism for Ghana data:** Ghana Data Protection Commission (DPC) registration as a controller using a non-Ghana sub-processor (AWS, US). The exact contractual mechanism (standard contractual clauses, jurisdictional carve-out, or a Ghana-DPC-specified mechanism) **[COUNSEL-REQUIRED]** must be confirmed by Ghana counsel before Telecheck-Ghana launch.
- **Patient-facing privacy disclosure:** Telecheck-Ghana patient privacy notice must disclose US processing. Specific disclosure language **[COUNSEL-REQUIRED]**.
- **Clinician onboarding disclosure:** Telecheck-Ghana clinicians must be informed that patient data is processed in the United States.
- **DPO contact and rights workflows:** No change to mechanism; rights requests (access, rectification, erasure) remain functional and unchanged in implementation.
- **Sub-processor list:** AWS US is a documented sub-processor for Telecheck-Ghana data processing. The list **[COUNSEL-REQUIRED]** for full enumeration of contracted sub-processors and their jurisdictional implications.

This posture is documented in:
- Master Platform PRD v1.9 §23 risk register (Ghana cross-border risk row added/updated)
- Ghana Launch Playbook v1.2 (forthcoming in Cycle U-003) — new "Data residency and cross-border posture" section
- Patient-facing privacy notice (operational artifact, not in this bundle scope; counsel-confirmed before launch)

#### HIPAA / US tenant posture for Heros

Heros patient data is processed in `us-east-1`. This is the standard HIPAA-region posture for US-based DTC operations. The Business Associate Agreement (BAA) chain becomes a standard chain (Heros → Telecheck (platform) → AWS US, all US-jurisdiction). No non-standard BAA structure is required.

This simplifies the work scope previously captured under OR-303 (US BAA structure for af-south-1 processing) — under ADR-026 that item reframes from "non-standard cross-border BAA" to "standard HIPAA-region BAA chain documentation."

#### Latency expectations

- **Heros (US-based patients and clinicians):** Latency to `us-east-1` is good. No degradation vs ADR-025; modest improvement.
- **Telecheck-Ghana (Ghana-based patients and clinicians):** Round-trip latency to `us-east-1` is materially worse than to `af-south-1`. Expected RTT increases from ~50–100ms (Ghana ↔ Cape Town) to ~150–250ms (Ghana ↔ Virginia), depending on patient connectivity. This is acceptable for asynchronous workflows (consult requests, refills, RPM data ingestion, lab uploads, messaging). For synchronous video, it is borderline at typical Ghana network conditions.
- **Mitigation for Ghana sync video:** See "Phase 2 / open options" below.

#### Disaster recovery posture

DR mode shifts from warm-snapshot-replication-to-`us-east-1` (under ADR-025) to **cold DR in `us-west-2`** under ADR-026. Specifics:

- **Cold DR** = snapshot replication (RDS automated snapshots, S3 cross-region replication to `us-west-2`), infrastructure-as-code maintained for `us-west-2`, but no running compute in `us-west-2` at launch.
- **RTO (recovery time objective)** is longer under cold DR than under a warm-standby model. The launch trade-off accepts longer RTO in exchange for lower run cost and operational simplicity. RTO target is hours-to-low-tens-of-hours for a full regional failover, not minutes.
- **Future tightening** to a warm standby in `us-west-2` is a Phase 2 capability if RTO requirements tighten.

#### Phase 2 / open options

The following are explicitly deferred capabilities. ADR-026 does not commit to any of them; it preserves architectural room.

1. **Regional media routing for Ghana sync video.** A LiveKit edge node in `af-south-1` or `eu-west-1` (London or Frankfurt) can route media (RTP/SRTP) for Ghana patients while the data plane (room state, recordings if any, signaling persistence) remains in `us-east-1`. This reduces media RTT for Ghana patients without changing the canonical data residency. To be designed in a Phase 2 cycle if Ghana sync video latency becomes a launch blocker.
2. **Warm DR in `us-west-2`.** Tighter RTO at higher run cost; design and validate when launch operations stabilize.
3. **Active-active multi-region.** Multi-region active-active is explicitly out of scope at launch and remains so unless a future ADR reopens it.
4. **Per-country physical region routing.** Out of scope at launch and explicitly precluded by the locked decisions of this workstream. Any future per-country physical-region routing requires a new ADR that supersedes the relevant clauses of ADR-026.

### Relationship to prior ADRs

- **ADR-024 (country-driven config + per-tenant KMS data residency):** **Not superseded.** The country-config abstractions (CCR runtime, per-tenant KMS keys, country adapters) remain canonical. ADR-024's *abstraction* layer survives ADR-026; only the launch-config region resolved by those abstractions changes.
- **ADR-023 (multi-tenancy Model A):** Not affected. Tenant isolation mechanism is unchanged.
- **ADR-022 (native-first stack):** Not affected.
- **ADR-021 (LiveKit self-hosted):** Not affected; LiveKit deployment moves to `us-east-1`. Phase 2 regional media routing for Ghana is an extension, not a replacement.
- **ADR-020 (Anthropic Claude primary LLM):** Not affected.
- **ADR-017 (data residency, originally reserved):** Was satisfied by ADR-024. ADR-026 changes the realized region but does not reopen ADR-017's question.
- **ADR-025 (af-south-1 primary, us-east-1 DR):** **Superseded by this ADR.** Marked superseded in ADR Addendum 020–025; content retained for traceability.

### Operational implications and downstream work

The following downstream items are flagged for Cycle U-003 or later:

- Operational Readiness Tracker: bump to v1.5 in U-003 with reframed OR-302 (Ghana DPC framing simplified — jurisdictional mechanism only, region driver removed), reframed OR-303 (US BAA simplified to standard HIPAA chain), new OR item for migration execution if pre-launch
- Engineering Handoff Build Guide: bump to v1.3 in U-003 with region pair updates throughout (RDS, S3, Sprint 0 day 2 task, hard rules)
- Ghana Launch Playbook: bump to v1.2 in U-003 with explicit cross-border posture section
- Tenant Threading Addendum §3.3 (Sync Video): Ghana media-routing Phase 2 note
- Contracts Pack `INVARIANTS`, `CCR_RUNTIME`, `GLOSSARY`: selective updates in U-003 to reflect that country-of-residence drives jurisdictional residency, not physical region (per locked decisions and `[COUNSEL-REQUIRED]` constraints)
- Contracts Pack `MARKET_LAUNCH`: reviewed in this cycle; no region edits required (file is governance-of-program-availability, not region-binding)
- Master PRD §23 risk register: row updated in this cycle (Step 5 below)

### Counsel-required items

The following items in this ADR carry `[COUNSEL-REQUIRED]` markers and must be resolved by qualified counsel before they can be written into operational artifacts:

1. Ghana DPC contractual mechanism for cross-border processing (specific instrument: SCC-equivalent, jurisdictional carve-out, or Ghana-DPC-specified mechanism)
2. Patient-facing privacy notice language for Telecheck-Ghana disclosing US processing
3. Sub-processor list and contractual disclosure obligations for Telecheck-Ghana
4. HIPAA BAA chain documentation specifics for the Heros / Telecheck / AWS US chain (standard HIPAA region; standard chain expected, but counsel-confirmed)

These are operational artifacts produced outside this documentation bundle. ADR-026 records the architectural decision; counsel-confirmed language is downstream.

### Decision date

2026-04-26.
