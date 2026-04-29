# Telecheck — Design Implementation Contract

**Version:** 1.0
**Status:** ⚠️ PROVISIONAL — pending delivery of design files
**Owner:** Design Lead + Engineering Lead (joint)
**Parent documents:** Master Platform PRD v1.9 §5.4 (design contract decision), Design System v1.1, Patient App IA v1.0, Clinician Portal IA v1.0, Admin Operator IA v1.1, Forms/Intake Engine Slice PRD v2.1, Pharmacy + Refill Slice PRD v2.1, Admin Backend Slice PRD v1.1
**Companion documents:** Engineering Handoff & Build Guide v1.2, RBAC Permissions Matrix v1.1
**Format:** Markdown

---

## ⚠️ PROVISIONAL STATUS NOTICE (added 2026-04-25 per Adversarial Counsel Review v1.0 finding HIGH-11 remediation, decided by Product Lead)

**This document is PROVISIONAL** until the canonical design files referenced in §3 (Tier 1) and §4 (Claude-provided design files) are delivered.

**During the provisional period:**

- Frontend engineering proceeds based on **Design System v1.1 + IA documents alone** (Patient App IA v1.0, Clinician Portal IA v1.0, Admin Operator IA v1.1, plus Tenant Threading Addendum v1.0 §3.13 and §3.14 for IA tenant context).
- The pixel-exact-match requirement of §4.1 and §4.2 **does NOT apply** during the provisional period — engineering builds to Design System tokens and IA structure, with the visual quality bar set at "professionally consistent and accessible" rather than "pixel-exact match to design files that don't exist."
- Visual regression testing infrastructure per §7 **is still required** during the provisional period, but its baseline is the engineering implementation rather than design files.
- All other sections (token system §5, component review gate §6, design clarification process §9, accessibility §11, performance §10, decision rights §12, change management §13) remain in effect during the provisional period.

**When design files are delivered:**

1. Product Lead notifies Engineering Lead and Design Lead.
2. This document is bumped to v1.1 with status changed to "Canonical for development."
3. The pixel-exact-match requirement of §4.1 takes effect **prospectively** — newly-built screens conform from delivery date onward.
4. **Already-built screens enter a reimplementation queue.** Each screen is assessed for design-implementation drift; reimplementation prioritized by user-facing visibility (patient-facing surfaces first, then clinician portal, then admin backend).
5. Reimplementation timeline depends on volume of drift; engineering plans 2–4 weeks for a typical reimplementation pass per surface.

**What this means for engineering kickoff:**

The engineering team should not block on design file delivery. The engineering team should also expect reimplementation cycles for visual surfaces post-delivery. Architecture, data model, state machines, API contracts, and backend logic are not affected by this provisional status — those proceed at full quality bar from day one.

**Engineering Lead acknowledgment required:** before the first patient-app commit lands, Engineering Lead acknowledges in writing (via PR description, design-engineering tracker, or equivalent) that this provisional status is understood and that reimplementation cycles are budgeted in the project plan.

---

## 1. Purpose

This document defines the contract between design and engineering for Telecheck.

The user directive ratified during the multi-tenancy + Tier-1 ecom + dual-market scope expansion sessions was unambiguous: **the Claude-provided design files are canonical. Engineering implements them pixel-exact.** This contract operationalizes that directive — it specifies what "canonical" means in practice, what "pixel-exact match" means in practice, what counts as a design change requiring re-spec, and how the design-engineering handoff works day to day.

Without this contract, two failure modes are likely:
- **Quiet drift** — engineering interprets ambiguous design moments based on convenience, the product slowly diverges from the intended visual language, and 6 months in nobody knows which version is the "real" one.
- **Loud friction** — every micro-decision (the precise shadow on a card hover state, the exact easing curve of a transition) escalates to design review, slowing engineering to a crawl.

This contract draws the line between the two. Design owns the visual and interaction system; engineering owns the implementation; the contract specifies what each side must do to honor the other's ownership.

---

## 2. Traceability

| Master PRD reference | This contract addresses |
|---|---|
| §5.4 Design contract — Claude design canonical, pixel-exact match | This entire document |
| §5.1 Tier-1 ecom standard | UX must match Hims/Ro polish; this contract is the enforcement mechanism |
| §17 Honest status, copy posture, design rules | Hard rules on design behavior preserved |
| Design System v1.1 — design tokens | Tokens are the engineering implementation surface |
| Patient App IA, Clinician Portal IA, Admin Operator IA | Screen inventories enumerated; this contract governs how they're implemented |
| Forms Engine v2.1 §21 — accessibility WCAG 2.1 AA explicit | Accessibility is non-negotiable |
| Engineering Handoff & Build Guide v1.2 — sprint structure | Design review gates align with sprint structure |

---

## 3. What is canonical

### 3.1 The canonical design surface

The canonical design surface for Telecheck consists of:

1. **Claude-provided design files** — the visual designs delivered through this engagement. These are the authoritative reference for what every screen, component, and interaction looks like.
2. **Design System v1.1** — the rationalization layer. Defines color tokens, typography scale, spacing scale, component patterns, interaction standards, and the 10 hard rules. Where Claude design files and Design System diverge, the Design System wins for tokens and patterns; Claude design files win for layout and screen-specific composition.
3. **Patient App IA v1.0, Clinician Portal IA v1.0, Admin Operator IA v1.1** — the screen inventories. Define which screens exist, navigation patterns, role-scoped visibility, and screen-level requirements.
4. **Slice PRDs** — for screen-specific behavior (e.g., the Forms Engine v2.1 visual builder UX, the Pharmacy + Refill v2.1 cancellation deflection screens, the Admin Backend v1.1 dashboard layouts).

When these conflict, precedence is:
- Slice PRD behavior > Claude design layout > Design System tokens > IA navigation > engineering convenience

### 3.2 What "pixel-exact match" means in practice

"Pixel-exact match" does NOT mean:
- Every single pixel of a rendered screen must match the design file at every viewport, OS version, and font-rendering context. Sub-pixel rendering, OS-level font hinting, scrollbar appearance, and similar are out of scope.
- Engineers are forbidden from improving things they discover during implementation. They are not. They are required to flag improvements via the change process below rather than apply them silently.

"Pixel-exact match" DOES mean:
- **Spacing** matches the design tokens exactly. If a card has 16px internal padding in the design, the implementation has 16px internal padding (`var(--space-4)`).
- **Typography** matches the design tokens exactly. Font family, weight, size, line-height, letter-spacing all match.
- **Color** matches the design tokens exactly. No "close enough" hex values; tokens or nothing.
- **Layout structure** matches the design composition. If a panel has three columns at desktop, two columns at tablet, and one column at mobile in the design, the implementation has the same breakpoints and column counts.
- **Component variants** match the design patterns. A primary button looks like the primary button pattern; a secondary button looks like the secondary button pattern; a destructive button looks like the destructive button pattern. No reinterpretation.
- **Interaction states** (hover, focus, active, disabled, loading, error) match the design specifications. If the design specifies a hover treatment, the implementation includes it.
- **Iconography** uses the specified icons (Lucide Icons per Design System §11) at the specified sizes.

### 3.3 What "pixel-exact match" requires of the design files

The pixel-exact requirement places obligations on design as well:
- Design files must include all interaction states (hover, focus, active, disabled, loading, empty, error). Engineering is not expected to invent these.
- Design files must include all required viewport breakpoints (mobile 375px, tablet 768px, desktop 1024px+ minimum). Engineering is not expected to invent responsive behavior.
- Design files must include accessibility annotations for non-obvious cases (focus order, ARIA labels, screen-reader-only content, keyboard shortcuts).
- Design files must include data states (empty, loading, partial, full, error). Engineering is not expected to design empty states.
- Design files must include the multi-tenant brand variations: at minimum, neutral default + Heros brand + Telecheck-Ghana brand applied to the same screen, demonstrating how brand tokens substitute.

If a design file does not include the above for a given screen, the screen is **not ready for engineering implementation**. Engineering raises a `Design Spec Issue` (see §7) and waits for the design file to be completed.

---

## 4. Design tokens — the engineering implementation surface

Per Design System v1.1 §13, design tokens are the bridge between design and code. Engineering implements tokens as the single source of styling truth.

### 4.1 Token discipline

Hard rules:

1. **No raw values in component code.** Never `padding: 16px` — always `padding: var(--space-4)`. Never `color: #0A7E8C` — always `color: var(--color-brand-primary)`.
2. **No inline styles for token-able properties.** Color, spacing, typography, radii, shadows, transitions — all via tokens.
3. **Component-level overrides go through token variables, not raw CSS overrides.** If a screen needs a custom background, it gets a token (e.g., `--color-bg-tenant-accent`) and the token is set per tenant per the multi-tenant brand framework.
4. **New tokens require Design Lead approval.** Engineering does not invent tokens. If a screen needs a new spacing value or a new color, it goes through the design change process (§7).

### 4.2 Tenant-scoped token variants

Per ADR-023 multi-tenancy and the tenant configuration module:

- Brand-related tokens (primary color, secondary color, accent color, logo, brand typography overrides) are scoped per tenant
- Non-brand tokens (semantic colors, severity colors, spacing, type scale, radii, shadows, transitions) are platform-floor tokens shared across tenants
- The token resolution order: tenant brand override → platform default → fallback

Example:

```css
/* Platform default */
:root {
  --color-brand-primary: #0A7E8C;  /* Telecheck teal */
}

/* Heros tenant override */
[data-tenant="heros"] {
  --color-brand-primary: #1F3A5C;  /* Heros navy */
}

/* Telecheck-Ghana tenant — uses platform default; no override */
```

The tenant attribute is set at the document root by the application based on tenant resolution per System Architecture v1.2 §13.

### 4.3 Token implementation tech

Engineering implements tokens via CSS custom properties (CSS variables). Build-time tooling (e.g., Style Dictionary or equivalent) generates the token surface from a single source-of-truth token JSON file owned jointly by Design Lead + Engineering Lead.

Native mobile applications (if added post-launch) consume the same token JSON via platform-appropriate generation (Swift `enum`, Kotlin `object`).

---

## 5. Component implementation

### 5.1 The component library

Engineering builds a single component library — `@telecheck/ui` (or equivalent monorepo package) — used across:
- Patient App (web, mobile-first responsive)
- Clinician Portal (web, desktop-first responsive)
- Admin Backend (web, desktop-first responsive; mobile-responsive for triage surfaces per Admin Backend v1.1 §8)

The library implements every component in the Design System: buttons, inputs, selects, cards, badges, tabs, alerts, modals, drawers, navigation patterns, severity indicators, AI surfaces, delegate banner, emergency surface, etc.

Each component:
- Renders pixel-exact match to the design at all specified states and viewports
- Consumes design tokens (no hardcoded values)
- Supports tenant brand variants automatically (no per-component tenant logic)
- Is keyboard-accessible per WCAG 2.1 AA
- Has comprehensive Storybook stories covering every variant and state
- Has unit tests for behavior and visual regression tests for appearance

### 5.2 The Design–Engineering review cycle for new components

When a slice PRD or screen design introduces a new component:

1. **Design produces** the component spec: every variant, state, behavior, accessibility annotation, design tokens consumed, examples in context. Files reside in the canonical design location.
2. **Engineering reviews** the spec for ambiguity. Either implements as specified, or raises a `Design Spec Issue` (see §7) for clarification before implementing.
3. **Engineering implements** the component, including Storybook stories and visual regression tests.
4. **Design verifies** the implementation against the spec. Pixel diff is computed; deviations are documented and either accepted (for non-token-bearing visual moments) or fixed.
5. **Component released** to the library; consuming surfaces (Patient App, Clinician Portal, Admin Backend) update.

### 5.3 The Design–Engineering review cycle for new screens

Same shape as components, scaled to a full screen:

1. Design produces screen spec: layout at all breakpoints, all interaction states, all data states, accessibility annotations, slice-PRD-defined behavior, brand variant demonstration.
2. Engineering reviews; raises issues if needed.
3. Engineering implements.
4. Design verifies; pixel diff computed.
5. Screen ships to staging; QA validates behavior; product validates against acceptance criteria; design validates against design.

### 5.4 The handoff format

For screen-by-screen handoff, the design package for each screen contains:

- Screen image at each required breakpoint (mobile 375px, tablet 768px, desktop 1024px, desktop 1440px where layouts diverge)
- Interaction state mockups (default, hover, focus, active, disabled, loading, empty, error)
- Annotated callouts identifying tokens consumed
- Tenant brand variant demonstration (at minimum: Telecheck-Ghana applied + Heros applied)
- Accessibility annotations (focus order, ARIA labels, screen-reader-only content)
- Behavior spec link to relevant slice PRD section

---

## 6. Pixel-exact verification

### 6.1 Visual regression testing

Engineering implements visual regression testing infrastructure as part of the Tier 1 build (per OR Tracker v1.4). The infrastructure:

- Renders every Storybook story at every required viewport
- Captures pixel snapshots
- On every pull request, compares snapshots against baseline
- Fails the build if pixel diff exceeds threshold (default: 0.1% deviation per snapshot)
- Allows explicit acceptance of intentional changes via the design review process

Tooling: Chromatic, Percy, or Playwright-based visual diff (engineering choice; constrained by ADR-022 native-first/open-source-first preference — Playwright with custom diff is the open-source path).

### 6.2 Acceptance threshold

The 0.1% per-snapshot deviation threshold accommodates:
- Sub-pixel font rendering differences across browsers
- Anti-aliasing variation
- Image compression artifacts in baselines

It does NOT accommodate:
- A "close enough" color (token mismatch)
- A "close enough" spacing (token mismatch)
- A different layout
- A missing interaction state

When the threshold is exceeded, engineering MUST either fix the implementation or get explicit Design Lead approval to update the baseline.

### 6.3 Per-tenant visual regression

Visual regression runs on the platform-default tenant configuration AND on at least the two day-1 tenants (Heros, Telecheck-Ghana). This catches tenant-specific bugs (e.g., a brand color override producing illegible contrast, a custom logo breaking a layout).

### 6.4 Production visual smoke

Post-deploy, a smoke suite of critical screens is rendered against production and visually compared to staging baseline. Catches CDN/asset issues that local testing misses.

---

## 7. The Design Spec Issue process

When engineering encounters ambiguity, missing information, or a design constraint that cannot be implemented without compromise, the engineer raises a **Design Spec Issue** (DSI).

### 7.1 DSI template

```markdown
## DSI-[NUMBER] — [SCREEN OR COMPONENT NAME]

**Raised by:** [engineer name]
**Date:** [date]
**Severity:** [blocker | high | medium | low]
**Slice PRD reference:** [section]

## What I'm trying to implement
[brief description]

## What the design says
[link to design file or screenshot; describe what's specified]

## What's unclear or missing
[the actual question — be specific]
- Example: "The hover state for the secondary button in the dark-mode-ready surface is not specified."
- Example: "The empty state for the affiliate conversions table is not designed; the Admin Backend v1.1 §5.5 spec says 'show empty state' but doesn't specify the illustration or copy."

## What I'd propose
[engineer's proposed resolution; specifying this triggers the fastest design response — design just confirms or counter-proposes]

## What I'm doing in the meantime
[implementing with placeholder; blocking until resolved; etc.]

## Required from design
[specific deliverable — screenshot, copy, token, etc.]

## Resolution
[filled in when resolved; design lead documents decision]
```

### 7.2 DSI severity SLAs

| Severity | Response time | Resolution time |
|---|---|---|
| Blocker (engineer cannot continue) | 4 working hours | 1 working day |
| High (work-around possible but blocks shipping) | 1 working day | 3 working days |
| Medium (work-around in place; scheduled fix needed) | 3 working days | within sprint |
| Low (cosmetic improvement; no urgency) | within sprint | next sprint |

### 7.3 DSI logging and audit

Every DSI is logged in the engineering issue tracker with the design lead as a watcher. Resolved DSIs feed back into the Design System and design files as updates — preventing repeat issues.

---

## 8. Design changes after canonicalization

Once a design has been signed off as canonical and engineering has begun implementation, changes are governed.

### 8.1 What counts as a design change

| Change type | Process |
|---|---|
| New token | Design Lead approval; updates token JSON; engineering regenerates token surface |
| Existing token value change (e.g., primary color shift) | Design Lead approval; updates token JSON; communicates downstream impact (visual regression baselines updated) |
| New screen | Standard handoff process per §5.3 |
| Screen layout change | Design Lead + Engineering Lead joint approval; visual regression baselines updated |
| New component variant | Design Lead approval; engineering adds to library |
| New interaction state on existing component | Design Lead approval; engineering adds; visual regression baselines updated |
| Copy change in design (button label, helper text, etc.) | Tenant Marketing or Tenant Clinical Lead approval per content domain; design file updated; engineering pulls update; no engineering re-spec required |
| Brand token change for a specific tenant | Tenant Admin via Admin Backend v1.1 §5.8; no engineering re-spec required |
| Behavioral change (interaction logic) | Slice PRD update required first; design follows; engineering implements after both updated |

### 8.2 The change reflex

The natural reflex when a screen "looks slightly off" in production is to silently fix it. This contract prohibits that reflex. The correct reflex is:
- If it's a token mismatch: fix in the implementation, no design re-spec required (this is engineering correcting its own non-conformance)
- If it's a design intent question: raise a DSI
- If it's an improvement opportunity: file a design change request; design evaluates; ratifies or declines

The goal is to preserve a single source of truth. When code drifts from design without design knowing, the design ceases to be canonical.

---

## 9. Roles and responsibilities

### 9.1 Design Lead

- Owns the canonical design surface (Claude design files, Design System, IA documents)
- Owns design tokens
- Owns the component design specifications
- Approves design changes per §8
- Resolves DSIs per §7 SLAs
- Verifies pixel-exact implementation per §6
- Escalates to Engineering Lead when engineering practices threaten the design surface

### 9.2 Engineering Lead

- Owns the component library implementation
- Owns the visual regression infrastructure
- Owns token compilation and distribution to consuming surfaces
- Enforces token discipline in code review
- Raises DSIs when design ambiguous
- Approves implementation that meets pixel-exact criteria
- Escalates to Design Lead when design specifications are insufficient for implementation

### 9.3 Frontend Engineers

- Consume design tokens (never raw values)
- Build components per spec
- Build screens per spec
- Run visual regression locally before pushing
- Raise DSIs proactively rather than guess
- Never silently improve

### 9.4 Tenant Admins (per Admin Backend v1.1 §5.8)

- Configure their tenant's brand tokens within design system constraints
- Cannot modify component patterns, screen layouts, or accessibility behavior
- Cannot disable hard rules (per Design System §14)

### 9.5 Tenant Marketing (per Admin Backend v1.1)

- Author copy variants within Forms Engine v2.1 visual builder
- Cannot modify visual structure of forms beyond what builder allows
- Cannot bypass copy review (per RBAC v1.1)

### 9.6 Product Lead

- Owns slice PRDs (which include screen-level behavior)
- Coordinates between Design Lead and Engineering Lead on cross-cutting decisions
- Approves changes that span design + engineering + slice behavior

---

## 10. The 10 hard rules (preserved from Design System §14)

These are non-negotiable and enforced both in design and in implementation:

1. **AI content is always labeled.** No AI-generated content appears without the AI source indicator.
2. **Protocol-executed actions are always flagged.** Patient and clinician see the protocol badge.
3. **Color is never the sole carrier of meaning.** Every color-encoded signal has text label, icon shape, and positional cue.
4. **Body text is never smaller than 16px on mobile.** Captions and overlines for metadata only.
5. **Emergency is always one tap away.** Never hidden, never behind a menu.
6. **Delegate context is always visible.** Delegate banner cannot be dismissed.
7. **Empty states are designed.** No screen ships with a blank/default empty state.
8. **Offline content is cached.** Emergency, active medications, allergies, conditions always available offline.
9. **Status is honest.** Aspirational status messages prohibited; "Delivering" means left the pharmacy.
10. **Errors are human-readable.** No error code, stack trace, or technical message to a patient.

Visual regression and interaction tests verify these where automated verification is possible. Where verification is qualitative (e.g., "honest status"), design and product review during sprint demo.

---

## 11. Tenant brand boundaries

The platform supports multi-tenant brand variation per ADR-023 and Tenant Configuration per System Architecture v1.2 §13. Brand customization has limits to preserve product identity and accessibility:

### 11.1 What tenants can customize

- Brand name (display)
- Brand logo (within size and aspect-ratio constraints)
- Primary color (within contrast constraints — must pass WCAG AA against required surfaces)
- Secondary color (same constraints)
- Accent color (same constraints)
- Custom domain (with DNS verification)
- Notification copy variants (per template, per Notification Spec)
- Email-from address and reply-to
- Terms of Service URL, Privacy Policy URL

### 11.2 What tenants cannot customize

- Typography (font family, scale, weights) — platform-floor for legibility consistency
- Spacing scale — platform-floor for layout integrity
- Component patterns — platform-floor for behavioral consistency
- Severity color semantics — platform-floor for clinical safety (red always means critical)
- AI labeling — platform-floor for AI transparency
- Protocol badge appearance — platform-floor for clinician trust
- Delegate banner appearance — platform-floor per ADR-009
- Emergency surface — platform-floor per Master PRD
- Hard rules from §10 — platform-floor

### 11.3 Brand validation

When a tenant uploads brand assets via Admin Backend v1.1 §5.8, automatic validation runs:

- Color contrast checks against all surfaces the brand color appears on (text on brand-color-background must pass WCAG AA at minimum; text on white backgrounds with brand-color text must pass too)
- Logo dimensions and aspect ratio checks
- Custom domain DNS verification
- Live preview rendering across patient app, key surfaces, and brand showcase

If validation fails, tenant admin sees specific failure with suggested fix (e.g., "Your primary color #FFA500 produces 2.1:1 contrast against white text. WCAG AA requires 4.5:1. Suggested adjustments: [3 darker variants]").

---

## 12. Accessibility (per Forms Engine v2.1 §21 explicit; reinforced here)

WCAG 2.1 AA at minimum. Every component, every screen, every brand variant.

### 12.1 What this requires of design

- All design files include focus states (visible 2px outline; minimum 3:1 contrast against background)
- All design files include error states with text + icon + color (not color alone)
- All design files include keyboard navigation order annotations for non-trivial flows
- All design files include screen-reader-only content callouts where visual content needs textual equivalent
- All form designs include label-input association
- All interactive elements have minimum 44x44px touch targets at mobile

### 12.2 What this requires of engineering

- Every component implements ARIA attributes per spec
- Every form field has associated label (visually or screen-reader-only)
- Every interactive element is keyboard-accessible
- Every error message is announced to screen readers
- Every dynamic content update (loading, save, error) is announced
- Color is paired with text/icon/position
- Zoom to 200% works without horizontal scroll
- Tab order matches visual order
- Skip-to-main-content available on every page

### 12.3 Accessibility audit cadence

- Per-component: axe-core or equivalent automated check in component test suite
- Per-screen: manual screen reader walkthrough during sprint review
- Per-tenant brand: automated contrast check at tenant brand upload
- Pre-launch: third-party accessibility audit (per OR Tracker v1.4)
- Post-launch: quarterly accessibility regression audit

---

## 13. Mobile / desktop / tablet contract

### 13.1 Patient app

- Mobile-first design at 375px–430px width
- Tablet support 768px+ as enhancement
- Desktop support 1024px+ (some patients access via desktop browser; full feature parity)
- All critical-path patient flows must work at 375px width

### 13.2 Clinician portal

- Desktop-first design at 1024px+ width
- Tablet support 768px+ for limited scenarios (clinician on tablet between rooms)
- Mobile support 375px+ for read-only views and emergency triage only — full clinician work happens on desktop or tablet
- Critical-path clinician work (case review, consult, refill approval) must work at 1024px width

### 13.3 Admin Backend

- Desktop-primary at 1280px+ width (most admin work happens on a real screen)
- Mobile-responsive for triage surfaces per Admin Backend v1.1 §8 (refill exception queue, inventory status, audit log read, dashboard, discount code creation)
- Visual builder, complex configuration screens, conversion analytics: desktop-only at minimum 1280px width

### 13.4 Native mobile apps

- Out of launch scope per Master PRD v1.9 — patient app at launch is responsive web (PWA-grade)
- Native iOS / Android apps are Phase 2 per Master PRD §6
- When native apps are built, they share the design tokens and design specs; component implementations are platform-native (SwiftUI, Compose) but reference the same design source of truth

---

## 14. Performance contract

The design contract intersects with the performance contract because slow UX is bad UX no matter how pixel-perfect.

### 14.1 Design budgets that affect engineering

- **Largest Contentful Paint (LCP):** < 2.5s on mobile 3G (Forms Engine v2.1 §20 target: form initial render < 1.5s on mobile 3G)
- **First Input Delay (FID):** < 100ms (Forms Engine v2.1 §20 target: field-to-field navigation < 100ms)
- **Cumulative Layout Shift (CLS):** < 0.1
- **Time to Interactive (TTI):** < 3.5s on mobile 3G

If a design (e.g., a hero image, a video interstitial, a complex chart) makes these budgets hard to meet, design and engineering negotiate trade-offs (lazy-loading, lower-resolution variants, skeleton states).

### 14.2 Asset optimization

- Images: WebP with PNG fallback; responsive variants per breakpoint
- Logos: SVG preferred (scales perfectly; smaller payload than PNG at multiple sizes)
- Icons: Lucide via icon-font or SVG sprite (single payload, all icons)
- Fonts: Inter as variable font (single file all weights); subset to Latin + extended Latin at launch

### 14.3 Animation budget

- Transitions per Design System: 150ms / 200ms / 300ms
- Animations should use `transform` and `opacity` only (composited; no layout thrash)
- Reduced-motion media query honored: all non-essential animations suppressed when `prefers-reduced-motion: reduce`

---

## 15. Asset and design file management

### 15.1 Storage of canonical design files

Design files live in a single canonical location agreed upon by Design Lead + Engineering Lead. This is the URL or path that engineers reference when implementing.

For this engagement, the canonical location is wherever the user's Claude-provided design files reside (the user is the source of these and will provide access). Engineering does NOT cache or fork these files; they reference the canonical source.

### 15.2 Versioning of design files

- Each design file has a version stamp (date or version number)
- When a design changes, the new version is published to the canonical location with a changelog
- Engineering pulls the new version; the prior version is archived (not deleted; needed for retrospective)

### 15.3 Asset (image, illustration, video) storage

- Brand assets per tenant: stored in Telecheck S3 bucket (or equivalent per ADR-022) under tenant-scoped path
- Platform assets: stored in Telecheck S3 bucket under platform path
- All assets served via CDN per System Architecture
- Asset URLs are stable; never change once published (cache-bustable via versioned filename)

---

## 16. Engineering deliverables required by this contract

For Engineering Handoff & Build Guide v1.2 to satisfy this contract, engineering must produce:

| Deliverable | Owner | Status gate |
|---|---|---|
| Token JSON file (single source of truth for tokens) | Engineering Lead + Design Lead | Tier 1 |
| Token compilation pipeline (JSON → CSS variables → tenant overrides) | Engineering | Tier 1 |
| `@telecheck/ui` component library scaffold | Engineering | Tier 1 |
| Storybook for `@telecheck/ui` with all components and stories | Engineering | Tier 1 |
| Visual regression infrastructure (Playwright + diff or equivalent) | Engineering | Tier 1 |
| Per-tenant visual regression configuration | Engineering | Tier 1 |
| Accessibility automated test integration (axe-core in CI) | Engineering | Tier 1 |
| Performance budget enforcement in CI | Engineering | Tier 1 |
| Brand validation logic for Admin Backend v1.1 §5.8 brand upload | Engineering | Tier 1 (with Admin Backend slice) |
| DSI tracking template integrated into engineering issue tracker | Engineering Lead | Tier 0 (before sprint 1) |

---

## 17. Open questions (contract-level)

1. **Native app token sharing strategy** — when native iOS/Android apps are built (Phase 2), what's the technical pipeline from token JSON to platform-specific token surface? Default proposal: Style Dictionary (cross-platform) or equivalent. Out of v1.0 scope; documented for Phase 2 planning.
2. **Component library distribution** — `@telecheck/ui` versioning, breaking change policy, semver discipline. Default proposal: semver; breaking changes (token rename, component API change) bump major. Documented in Engineering Handoff & Build Guide v1.2.
3. **Design file format choice** — Figma vs other. The user has indicated Claude-provided design files specifically; if those are eventually exported to Figma for ongoing iteration, the contract still applies. Format-agnostic as long as the canonical surface is honored.
4. **Per-tenant component variants beyond brand tokens** — could a tenant request a custom component variant (e.g., a different cancellation deflection screen layout) beyond what brand tokens enable? Default at launch: no. Scope creep prevention. If genuine cross-tenant pattern emerges, lift it to platform via standard design change process.
5. **Designer-engineer pairing model** — should design and engineering pair real-time on complex screens? Default proposal: yes for Tier 1 screens (the high-traffic conversion screens, the high-stakes clinical screens). Documented in sprint structure.

---

## 18. Dependencies

- **Design System v1.1** — token definitions, component patterns, hard rules
- **Patient App IA v1.0** — patient-facing screen inventory (48 screens)
- **Clinician Portal IA v1.0** — clinician-facing screen inventory (34 screens)
- **Admin Operator IA v1.1** + Admin Backend Slice v1.0 — admin-facing screen inventory (36 + new Tier-1 ecom surfaces)
- **All slice PRDs** — screen-level behavior specifications
- **System Architecture v1.2 §13** — Tenant Configuration module (where brand tokens are resolved)
- **RBAC Permissions Matrix v1.1** — who can change what
- **Engineering Handoff & Build Guide v1.2** — engineering processes that satisfy this contract
- **OR Tracker v1.4** — operational items needed to deliver this contract (visual regression infra, accessibility audits, etc.)

---

## Document control

- **v1.0** — Initial Design Implementation Contract. Operationalizes the user-ratified directive that Claude-provided design files are canonical and engineering implements pixel-exact match. Defines: what is canonical (design files + Design System + IA + slice PRDs with explicit precedence), what pixel-exact match means in practice, design tokens as the engineering implementation surface, the component library, the design–engineering review cycle, the Design Spec Issue (DSI) process with severity SLAs, design change governance, roles and responsibilities, accessibility (WCAG 2.1 AA), mobile/desktop/tablet contract, performance budgets, asset and design file management, engineering deliverables required to satisfy the contract, and tenant brand boundaries (what tenants can and cannot customize). Preserves the 10 hard rules from Design System §14.
- **Next review:** after first sprint produces components against this contract; after first DSI is raised and resolved; after first tenant brand upload runs through validation.
- **Change discipline:** changes to the precedence order in §3.1, the DSI process in §7, the design change governance in §8, role responsibilities in §9, the 10 hard rules in §10, or the tenant brand boundaries in §11 require Design Lead + Engineering Lead + Product Lead joint sign-off.
