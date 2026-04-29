# 00 · Market Launch

**Status:** canonical · **Version:** 5.0 · **Owner:** market operations lead + regulatory lead · **Consumers:** all program activation, all patient-facing surfaces

This document defines the Market Launch governance model — the sole authority for whether a program is available in a market. Per I-020, no other system overrides Market Launch's offerability decisions.

---

## Core principle

**Market Launch is the sole offerability authority.** Forms Engine, AI Layering, and Protocol Pack market lists are compatibility constraints, not offerability decisions. If Market Launch says "not available," the program is not available regardless of what other systems say.

---

## ProgramMarketPolicy

The canonical record for a program's availability in a market:

```
{
  "policy_id":          "pmp_<ULID>",
  "program_id":         "<program>",
  "market_code":        "<country_of_care>",
  "status":             "draft | pending_approval | approved | live | paused | retired",
  "launch_gates":       { <gate statuses> },
  "required_form_version": "frv_<ULID>",
  "required_protocol_version": "prt_<ULID>" | null,
  "required_agent_version": "agt_<ULID>" | null,
  "pricing_bundle_id":  "prb_<ULID>",
  "approved_by":        "<operator_id>",
  "approved_at":        "<ISO 8601>",
  "pause_reason":       null | { "code": "...", "detail": "..." },
  "retire_reason":      null | { "code": "...", "detail": "..." }
}
```

---

## Seven launch gates

A program must pass all seven gates before going live in a market:

| Gate | What it verifies | Approver |
|---|---|---|
| **Regulatory** | Regulatory clearance for this program in this market (pharmacy council, medical council, FDA equivalent) | Regulatory & Partner Affairs Lead |
| **Clinical** | Protocol library approved, clinician panel staffed, clinical safety review complete | Clinical Governance Lead |
| **Technical** | Required form version published, interaction engine coverage verified, notification channels configured | Engineering Lead |
| **Operational** | Pharmacy partners onboarded (or platform pharmacy ready), delivery partner contracted, support team briefed | Operations Lead |
| **Financial** | Pricing bundle configured, payment rails tested, unit economics reviewed | Finance Lead |
| **Legal** | Terms of service localized, consent copy reviewed, data processing agreements signed | Legal Lead |
| **Executive** | Final go/no-go sign-off | Country Launch Director |

All gates must be `approved` for the status to transition to `live`. Any gate can be `revoked` after approval, which forces the program back to `paused`.

---

## Status transitions

```
draft → pending_approval → approved → live → paused → live (resume)
                                          → retired
                                    paused → retired
```

### Pause

A program can be paused by any gate owner or the Country Launch Director. Pause takes effect immediately. Active patients in the program receive notification: "This program is temporarily paused. Your care team will contact you about next steps."

**Pause obligations:**
- Patients with active prescriptions continue to receive refills for the bridge period
- In-progress consultations complete
- Scheduled appointments are honored or rescheduled
- The platform does not accept new enrollments

If a pause exceeds a configurable hold duration (recommend 30 days), it auto-escalates to the Country Launch Director for retire-or-resume decision.

### Retire

Retirement is permanent for the current market activation. A retired program can be re-launched only through a new ProgramMarketPolicy with fresh gate approvals. Retire obligations include all pause obligations plus a sunset plan for existing patients (transfer to alternative programs or graceful exit with bridge supply).

---

## Compatibility checks (not offerability)

After Market Launch confirms a program is offerable, compatibility checks verify that the required infrastructure exists:

| Check | What it verifies |
|---|---|
| Form version | The required `intake_form_version_id` is published and not archived |
| Protocol version | The required protocol version is active and has a named accountable clinician |
| Agent version | The required AI agent version (guardrail template for Mode 1, protocol config for Mode 2) is deployed |
| Pricing bundle | The pricing bundle is configured for this market with valid payment rails |

**Missing compatibility is a deployment defect** — it pages on-call and shows the patient "we're temporarily unable to offer this; we've notified our team." It does not silently block the patient.

---

## Market Pack

Each market is represented as a structured Market Pack — a versioned container of:
- ProgramMarketPolicies for all programs in the market
- Protocol library assignments
- Formulary scope
- Guardrail template assignments
- Moderation policy configuration
- Partner relationships
- Evidence artifacts (regulatory approvals, clinical safety reviews)
- Rollout state

The Market Pack is managed through the Market Rollout Cockpit (Admin — Market Rollout Cockpit Slice PRD).
