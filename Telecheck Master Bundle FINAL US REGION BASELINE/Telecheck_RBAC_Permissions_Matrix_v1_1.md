# Telecheck — RBAC Permissions Matrix

**Version:** 1.1
**Status:** Canonical for development
**Owner:** Engineering Lead + Product (Telecheck)
**Supersedes:** RBAC Permissions Matrix v1.0
**Parent documents:** Master Platform PRD v1.9, System Architecture v1.2, Canonical Data Model v1.2, ADR Addendum 020–025 (with ADR-025 superseded by ADR-026)

---

## Change log from v1.0

v1.1 reflects the multi-tenancy decision (ADR-023):

1. **Two role hierarchies introduced:** Platform Admin (Telecheck operating the platform) and Tenant Admin / Tenant Operator (per-tenant operators — e.g., the Telecheck-US tenant operator team trading as Heros Health DBA, and the Telecheck-Ghana tenant operator team trading as Heros Health Ghana DBA). **Updated 2026-05-02 per Codex Scope 4 HIGH-2 finding to use operating-tenant + consumer-DBA framing throughout role-hierarchy normative text.**
2. **Every existing role from v1.0 is implicitly tenant-scoped** — a clinician, a patient, a delegate exists within one tenant. Cross-tenant access is never permitted (per ADR-023).
3. **New role: Platform Admin** with cross-tenant aggregate visibility but no per-tenant PHI access.
4. **New role: Tenant Owner** — per-tenant superuser; e.g., the Telecheck-US tenant owner (Heros Health DBA scope) who manages the Telecheck-US tenant in totality, or the Telecheck-Ghana tenant owner (Heros Health Ghana DBA scope) who manages the Telecheck-Ghana tenant in totality.
5. **Tenant-scoped permissions enforced at three layers** — application middleware, database RLS, per-tenant KMS encryption keys.
6. **Special handling of platform admin operations** that target a specific tenant (audited, requires `X-Tenant-Id` header, tenant admin notified).

---

## 1. Two role hierarchies

### 1.1 Platform Admin hierarchy

These roles operate at the Telecheck platform level. Telecheck-the-company employees fill these roles. Platform admins do NOT see PHI of any tenant by default.

| Role | Scope | Sees aggregate cross-tenant metrics | Can act on a specific tenant | Can see PHI |
|---|---|---|---|---|
| Platform Owner | Cross-tenant, full | Yes | Yes (audited) | Only via "break-glass" emergency procedure with audit |
| Platform Admin | Cross-tenant, full | Yes | Yes (audited) | Only via "break-glass" |
| Platform Operator | Cross-tenant, limited | Yes | Limited (cannot suspend, cannot modify billing) | No |
| Platform Support | Cross-tenant, limited | Yes | Limited (read-only diagnostics) | No |
| Platform Read-Only Auditor | Cross-tenant, read-only | Yes (read-only) | No | Limited (audit log access only, not PHI) |

Platform admins authenticate without a `tenant_id`. Their operations on a specific tenant carry an `X-Tenant-Id` header, are audited as platform-admin actions, and trigger a notification to the affected tenant's tenant admins.

### 1.2 Tenant role hierarchy

These roles operate within a single tenant. The Telecheck-US tenant operator team (trading patient-facing as Heros Health DBA) holds these roles within the Telecheck-US tenant. The Telecheck-Ghana tenant operator team (trading patient-facing as Heros Health Ghana DBA) holds these roles within the Telecheck-Ghana tenant.

| Role | Scope | Sees this tenant's PHI | Can configure this tenant | Can manage other roles in this tenant |
|---|---|---|---|---|
| Tenant Owner | Full within tenant | Yes (with audit) | Yes (full) | Yes |
| Tenant Admin | Full within tenant | Yes (with audit) | Yes (full) | Yes (except cannot remove other Tenant Owner) |
| Tenant Operator | Operations within tenant | Yes (limited; operational records only) | Limited (cannot modify pricing, cannot configure adapters) | No |
| Tenant Billing | Billing/subscriptions within tenant | Limited (subscription/payment records only, not clinical) | Pricing and discount codes only | No |
| Tenant Clinical Lead | Clinical operations within tenant | Yes (with audit) | Limited (clinician config, protocol activation per tenant) | Can manage clinician role assignments |
| Tenant Marketing | Marketing/conversion within tenant | No (aggregate metrics only) | Limited (intake form copy, A/B test variants, affiliate accounts) | No |
| Tenant Support | Patient support within tenant | Yes (limited; support context only) | No | No |
| Clinician | Patient-facing within tenant | Yes (assigned cases + tenant-allowed contexts) | No | No |
| Patient | Their own data within tenant | Their own only | Their own profile only | No |
| Delegate | Patient's data within tenant + delegate scope | Per delegation grant per ADR-009 | No | No |
| AI Service (system actor) | Per-call within tenant | Yes (within call scope) | No | No |
| Protocol (system actor) | Per-execution within tenant | Yes (within execution scope) | No | No |

---

## 2. Per-resource permissions matrix

Each row is a resource type. Each column is a role. "Yes" means full CRUD; specific scopes (read-only, write-only, etc.) are noted.

| Resource | Platform Admin | Tenant Owner | Tenant Admin | Tenant Operator | Tenant Clinical Lead | Tenant Marketing | Clinician | Patient | Delegate |
|---|---|---|---|---|---|---|---|---|---|
| **Tenant entity** | Yes (cross) | Read this tenant | Read this tenant | Read this tenant | Read this tenant | Read this tenant | No | No | No |
| **TenantBrand** | Read (cross) | Yes | Yes | Read | Read | Yes (copy/visual) | Read | No | No |
| **CountryProfile** | Yes | Read | Read | Read | Read | Read | No | No | No |
| **CCRConfig** | Yes (cross, with audit) | Yes | Yes (with caveats) | No | No | No | No | No | No |
| **AdapterConfig** | Yes (cross, with audit) | Yes | Yes | Read | Read | No | No | No | No |
| **TenantUser** (platform/admin users) | Yes (platform users) | Yes (this tenant's users) | Yes (this tenant's users, with caveats) | No | No | No | No | No | No |
| **Account** (patient) | No (only via break-glass) | Read with audit | Read with audit | Read (limited) | Read with audit | Aggregate only | Read assigned | Their own | Per delegation |
| **Session** | No | Read with audit | Read with audit | Read | No | No | Their own | Their own | Per delegation |
| **OTP** | No | No | No | No | No | No | No | Their own (write only) | Per delegation |
| **Consent** | No | Read with audit | Read with audit | Read (limited) | Read with audit | No | Read for assigned | Their own | Per delegation |
| **Delegation** | No | Read with audit | Read with audit | Read | Read with audit | No | Read for context | Manage own | Read own |
| **Consult** | No | Read with audit | Read with audit | Limited (operational metadata) | Read with audit + manage | No | Read assigned + manage | Read own | Per delegation |
| **MedicationRequest** | No | Read with audit | Read with audit | Read (limited) | Read with audit + manage | No | Read assigned + manage | Read own | Per delegation |
| **Refill** | No | Read with audit | Read with audit | Limited | Read with audit + manage | No | Read assigned + manage | Read own | Per delegation |
| **Subscription** (NEW per slice v2.0) | No | Read with audit | Read with audit | Limited (operational) | No | No | Read assigned | Their own (manage state) | Per delegation |
| **Dispensing / Shipment** | No | Read with audit | Read with audit | Yes (operational) | Read | No | Read assigned | Read own | Per delegation |
| **InteractionSignal** | No | Read aggregate | Read aggregate | No | Read with audit | No | Read for assigned | No | No |
| **Protocol / ProtocolVersion** | Read | Yes | Yes | Read | Yes | No | Read | No | No |
| **GuardrailTemplate** | Read | Yes | Yes | Read | Yes | No | Read | No | No |
| **LabResult** | No | Read with audit | Read with audit | Read (limited) | Read with audit | No | Read assigned | Their own | Per delegation |
| **Document (uploaded by patient)** | No | Read with audit | Read with audit | Read (limited) | Read with audit | No | Read assigned | Their own | Per delegation |
| **RPMReading** | No | Read aggregate | Read aggregate | Read (limited) | Read with audit | No | Read assigned | Their own | Per delegation |
| **CommunityPost** | No | Read with audit | Read with audit | Read (limited) | Read | No | No (per ADR-007) | Their own + group context | Per delegation |
| **Notification** | No | Read aggregate | Read aggregate | Read (operational) | No | Read aggregate (delivery rates) | No | Their own | Per delegation |
| **Payment** | No | Read with audit | Read with audit | No | No | No | No | Their own | Per delegation |
| **DiscountCode** (NEW v1.1) | No | Yes | Yes | No | No | Yes (within tenant) | No | No (apply only) | No |
| **AffiliateAccount** (NEW v1.1) | No | Yes | Yes | No | No | Yes | No | No | No |
| **AffiliateConversion** (NEW v1.1) | No | Read aggregate | Read aggregate | No | No | Read aggregate | No | No | No |
| **AuditEvent** | Yes (cross, read-only with rationale) | Read this tenant | Read this tenant (limited) | Read (limited operational) | Read this tenant (clinical) | No | Read for assigned | Their own | Per delegation |

Notation:
- **"with audit"** — every read/write of this resource by this role generates an audit event
- **"(limited)"** — role-specific subset; details in slice PRDs
- **"break-glass"** — emergency-only access requiring justification, additional approval, and post-action review

---

## 3. Tenant isolation enforcement

### 3.1 Application layer

Every authenticated API request resolves a tenant via the Tenant Configuration module:
- Patient/clinician/delegate authentication carries `tenant_id` from the user's account
- Tenant admin authentication carries `tenant_id` from the TenantUser record
- Platform admin authentication has `tenant_id = NULL` and `platform_admin = true`

Every database query passes `tenant_id` to the repository layer:
```python
# GOOD
consults = consult_repo.list(tenant_id=ctx.tenant_id, status='pending')

# BAD - blocked by lint
consults = db.query("SELECT * FROM consults WHERE status = 'pending'")
```

### 3.2 Database layer

PostgreSQL Row-Level Security policies on every tenant-scoped table per Canonical Data Model v1.2 §5. The `app.tenant_id` setting is set per-connection by the application middleware after tenant resolution. RLS prevents cross-tenant access even if application-layer filtering fails.

Platform admin operations set `app.platform_admin = true` to bypass per-tenant RLS for explicitly platform-admin queries (limited scope: aggregate metrics, audit log access). Even with platform_admin set, individual PHI queries still trigger audit and require break-glass justification.

### 3.3 Encryption layer

Per ADR-024, each tenant has a unique KMS key. PHI columns are encrypted at the application layer with the tenant's key. A query that bypasses both application-layer filtering AND RLS would still receive ciphertext that requires the tenant's key to decrypt. Platform admin does not have direct access to per-tenant KMS keys; break-glass procedure includes KMS audit.

---

## 4. Platform admin "break-glass" procedure

For exceptional cases (legal subpoena, security incident, support investigation that requires PHI access), a platform admin can invoke break-glass:

1. Platform admin opens a break-glass session with: target tenant, justification, time-bounded scope (e.g., 4 hours)
2. Tenant admin(s) of target tenant are notified immediately
3. Break-glass session is logged as a Category A audit event with full context
4. Within the session, platform admin has tenant-admin-equivalent access to the named tenant
5. All actions during the session are audited
6. Session ends automatically at the time bound or on explicit close
7. Post-session review: platform admin must document what was accessed and why; reviewed by Platform Owner or Privacy Officer within 7 days

Break-glass is not normal-operation access. Routine platform-admin work uses aggregate-only views.

---

## 5. Tenant Owner / Tenant Admin distinction

Both have full access to their tenant. The distinction:

- **Tenant Owner** — can add or remove other Tenant Owners. The "root" tenant role. Typically 1-2 people per tenant (e.g., the Heros founder and the Heros COO). Cannot be removed except by Platform Admin via documented process (e.g., business-relationship dispute resolution).

- **Tenant Admin** — full access to the tenant, but cannot add or remove Tenant Owners. Can add/remove other Tenant Admins, Operators, Marketing, etc. Multiple Tenant Admins typical (e.g., the Heros operations team).

This allows a tenant to have multiple admins for operational coverage without making every admin able to lock the others out.

---

## 6. Clinician role within multi-tenant context

Clinicians are tenant-scoped. The same physician (in the real world) can be:
- A clinician in the Telecheck-Ghana tenant (Heros Health Ghana DBA scope; employed by Telecheck-Ghana Ltd. clinician panel)
- A clinician in the Telecheck-US tenant (Heros Health DBA scope; contracted via OpenLoop or Telecheck PLLC)

These are separate Clinician records in the platform — different tenant-scoped accounts, different patient panels, different audit trails. The platform does not federate clinician identity across tenants.

This matches the legal reality: the physician's relationship is with the tenant's medical entity (PC, PLLC, or partner network), not with Telecheck-the-platform directly.

---

## 7. Patient role within multi-tenant context

A patient is tenant-scoped. The same person (in the real world) using both Heros and Telecheck-Ghana would have two separate Patient/Account records — different tenant_ids, different account_ids, different patient profiles, different clinical histories.

Cross-tenant patient identity (federated identity) is explicitly out of scope per ADR-023. This is consistent with the Rimo / Healthie pattern.

---

## 8. AI Service and Protocol as system actors

Per AI-LAYERING contract, AI and Protocol are first-class actors with audit attribution. Per ADR-023, they operate within a tenant context — every AI call and protocol execution carries `tenant_id` and is audited within that tenant.

A protocol or AI cannot reach across tenants. If Tenant A has a custom protocol, only Tenant A's clinical actions invoke it. Platform-default protocols (where they exist) are still tenant-scoped at execution — each tenant's invocations are audited within their tenant.

---

## 9. Migration from v1.0

For an engineering team that has v1.0 RBAC partially in place:

1. Add `tenant_id` to all role assignments
2. Introduce platform-admin role hierarchy as new tables / new role types
3. Update authentication middleware to resolve tenant context
4. Update authorization checks to verify tenant alignment
5. Add platform-admin "break-glass" infrastructure (audit, notification, time-bound sessions)

---

## 10. What's NOT in this matrix

- **Cross-tenant role federation.** No role spans tenants except Platform Admin.
- **Tenant role inheritance from a parent tenant.** No tenant hierarchy.
- **Self-service tenant role management for tenant operators.** Initial setup is platform-admin-managed; routine role management within a tenant is tenant-owner/admin-managed.
- **Clinician licensing verification.** That's a clinician-network-adapter concern, not RBAC.

---

## v1.10 cycle additions (added 2026-05-02 per v1.10.1 hygiene cycle physical merge of `Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` Group 5B §RBAC rows 29, 73)

### Tenant scoping examples — C3 brand-structure refresh (Row 29)

All Tenant Admin role examples in this matrix that referenced `Heros tenant admin` are rewritten to `Telecheck-US tenant admin (Heros Health DBA scope)`. The role description's scope clarification distinguishes operating-tenant identifier (`Telecheck-US`) from the patient-facing consumer DBA (`Heros Health`). Same pattern applies to `Telecheck-Ghana tenant admin (Heros Health Ghana DBA scope)`.

### Research data roles (Row 73 — NEW per ADR-028)

Three new roles added to the **Tenant Admin hierarchy** (with Platform Admin oversight per existing dual-hierarchy rules):

| Role | Hierarchy | Permissions | Bound by |
|---|---|---|---|
| `Research Data Steward` | Tenant Admin | Define cohorts (`POST /research/cohort-definitions`); manage DSA lifecycle (excluding activation, which requires quad sign-off); initiate exports (`POST /research/exports/initiate`); read DSA + cohort audit chain at high_pii sensitivity. | I-029 (export gate) + I-031 (audit retention) audit obligations; tenant-scoped per I-023. Cannot single-handedly activate a DSA — activation is quad sign-off (Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer + Product Lead per ADR-028 v0.4) + REC concurrence per `research_ethics_review_body.per_dsa_review_required`. |
| `Research Ethics Committee Member` | External oversight (read-only, scoped) | Read research export audit chain (high_pii sensitivity); read consent text history (per CCR `research_ethics_review_body.approval_reference_id`); read DSA details. **Cannot modify state**; cannot initiate exports; cannot define cohorts. | Read-only oversight role; access logged per I-031 audit envelope. Per-DSA scope per `research_ethics_review_body.per_dsa_review_required`. |
| `External Research Partner` | External (highly scoped) | Receive delivered exports per signed DSA; read own DSA details. **Cannot access patient-level data**; cannot navigate to other partners' DSAs; cannot modify cohort definitions; cannot retrieve audit chain. | Strictly partner-scoped per signed DSA; per-DSA isolation enforced at API layer + data layer. No cross-DSA access. |

**Activation gate signers** for the `consent_only → active` CCR transition (per MARKET_LAUNCH v5.1 Research data partnership activation gate):
- Privacy Officer + Regulatory Affairs Lead + Clinical Safety Officer + Product Lead (quad sign-off per ADR-028 v0.4)
- REC concurrence per `research_ethics_review_body.per_dsa_review_required`
- Country Launch Director (per MARKET_LAUNCH v5.1 — separate from quad sign-off; per-country launch authority)

**Activation gate signers** for the marketing posture activation (per MARKET_LAUNCH v5.1 Marketing posture activation gate):
- Marketing copy governance lead + Clinical Safety Officer + Regulatory Affairs Lead (triple sign-off per ADR-027 v0.5/v0.6)
- Country Launch Director

### Role count post-v1.10

Total roles post-v1.10: **(v1.1 baseline roles) + 3 research roles**. Marketing copy governance lead is a workstream-discipline designation (not a new RBAC role; uses existing Marketing role with the governance-lead designation artifact ID per CCR `marketing_governance_lead_designation_artifact_id`).

---

## Document control

- **v1.1** — Two role hierarchies introduced (Platform Admin + Tenant). Platform Admin operations on specific tenants are audited and notify tenant admins. Tenant Owner / Tenant Admin distinction. Per-resource permissions matrix updated for multi-tenancy. Break-glass procedure documented. Migration notes from v1.0 included.
- **v1.1 (refreshed 2026-05-02 per v1.10.1 hygiene cycle physical merge of `Phase5_Slice_Engineering_Operations_Delta_2026-05-01.md` Group 5B §RBAC rows 29, 73)** — Additive content under "v1.10 cycle additions" section above. Tenant Admin role examples reframed to operating-tenant naming with consumer-DBA qualifier (`Telecheck-US tenant admin (Heros Health DBA scope)`, `Telecheck-Ghana tenant admin (Heros Health Ghana DBA scope)`) per C3 brand structure. 3 new research roles added per ADR-028: Research Data Steward (define cohorts, manage DSA lifecycle excluding activation, initiate exports — bound by I-029 / I-031); Research Ethics Committee Member (external oversight, read-only, scoped to per-DSA); External Research Partner (highly scoped, receives delivered exports per signed DSA only). Activation gate signers documented for marketing posture (ADR-027 v0.5/v0.6 triple sign-off + Country Launch Director per MARKET_LAUNCH v5.1) and research data partnership (ADR-028 v0.4 quad sign-off + REC concurrence + Country Launch Director per MARKET_LAUNCH v5.1). Per ADR-027 + ADR-028 + INVARIANTS v5.2 + AUDIT_EVENTS v5.2 + MARKET_LAUNCH v5.1. Existing v1.1 roles and break-glass procedure preserved without modification. No version-number bump (entry-level refresh).
- **v1.0** — Initial RBAC matrix (single-tenant assumption); superseded.
- **Next review:** after engineering implements the platform-admin / tenant-admin separation and runs a security review against the matrix.
- **Change discipline:** changes to roles, permissions, or break-glass procedure require Engineering Lead + Privacy Officer + Product Lead sign-off.
