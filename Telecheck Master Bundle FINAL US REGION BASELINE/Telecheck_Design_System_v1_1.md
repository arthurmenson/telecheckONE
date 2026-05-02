# Telecheck — Design System

**Version:** 1.1
**Status:** Canonical for development
**Owner:** Design Lead
**Parent documents:** Patient App IA v1.0, Clinician Portal IA v1.0, Master PRD v1.6 §17

---

## 1. Purpose

This document defines the visual language, component patterns, and interaction standards that turn the Patient App IA and Clinician Portal IA into a consistent, buildable product. Every screen, component, and interaction in Telecheck conforms to this system.

The Design System answers: What does it look like? How does it behave? What are the hard rules that no designer or engineer may break?

This is not a Figma file or a component library — those are downstream artifacts built from this specification. This is the source of truth for visual and interaction decisions.

---

## 2. Design principles (from Master PRD §17, operationalized)

| Principle | What it means for design |
|---|---|
| **Calm, not sterile** | Warm color palette, generous whitespace, rounded corners on cards, soft shadows. No clinical coldness. But no playfulness that undermines trust. |
| **Premium but trustworthy** | Quality signaled through typography hierarchy, consistent spacing, and honest status — not through decorative elements or marketing language. |
| **Readable, not decorative** | Body text at 16px minimum on mobile. High contrast ratios. Information hierarchy enforced through size and weight, not color alone. |
| **AI is visually distinct** | Every AI surface has a consistent visual treatment: teal accent + AI icon + "AI" label. Never mistaken for clinician content or peer content. |
| **Protocol-executed actions are flagged** | A distinct badge appears on any action processed by protocol rather than a clinician. Visible to both patient and clinician. |
| **Mobile-first** | Patient app designed for phone-first (375px–430px viewport). Clinician portal designed for tablet/desktop-first (1024px+ viewport). |

---

## 3. Color system

### 3.1 Primary palette

| Role | Name | Hex | Usage |
|---|---|---|---|
| **Brand primary** | Teal | `#0A7E8C` | Primary actions, AI surfaces, navigation active states, links |
| **Brand secondary** | Navy | `#1A3A5C` | Dark backgrounds, headers, clinician portal sidebar |
| **Accent warm** | Coral | `#D4553A` | Errors, critical signals, destructive actions, urgency |
| **Accent gold** | Gold | `#C9963A` | Warnings, attention, premium features, protocol badges |
| **Background dark** | Midnight | `#0F1B2D` | Dark-mode surfaces, login, splash |

### 3.2 Neutral palette

| Role | Hex | Usage |
|---|---|---|
| **White** | `#FFFFFF` | Primary background (patient app) |
| **Off-white** | `#F7F9FA` | Card backgrounds, secondary surfaces |
| **Light gray** | `#EDF1F4` | Borders, dividers, disabled states |
| **Mid gray** | `#94A3B8` | Placeholder text, tertiary text |
| **Dark gray** | `#475569` | Secondary text, descriptions |
| **Near-black** | `#1E293B` | Primary text |

### 3.3 Semantic colors

| Semantic role | Color | Hex | Usage |
|---|---|---|---|
| **Success** | Green | `#16A34A` | Confirmations, completed states, normal lab values |
| **Warning** | Amber | `#D97706` | Moderate signals, approaching thresholds, attention needed |
| **Error / Critical** | Red | `#DC2626` | Critical signals, errors, emergencies, block actions |
| **Info** | Blue | `#2563EB` | Informational callouts, links, neutral highlights |

### 3.4 Signal severity colors

Used exclusively for interaction engine signals, RPM alerts, and adverse events.

| Severity | Background | Border | Icon | Text label |
|---|---|---|---|---|
| **Critical** | `#FEF2F2` | `#DC2626` | Red filled circle with ! | "Critical" in red |
| **Major** | `#FFF7ED` | `#EA580C` | Orange filled triangle with ! | "Major" in orange |
| **Moderate** | `#FEFCE8` | `#CA8A04` | Yellow outlined circle with i | "Moderate" in amber |
| **Minor** | `#F0F9FF` | `#3B82F6` | Blue outlined circle with i | "Minor" in blue |

### 3.5 Content source colors

Used exclusively for content attribution indicators.

| Source | Accent color | Icon | Label |
|---|---|---|---|
| **AI-generated** | Teal `#0A7E8C` | Robot icon | "AI" |
| **Clinician-authored** | Navy `#1A3A5C` | Stethoscope icon | "Dr. [Name]" |
| **Clinician-reviewed** | Green `#16A34A` | Checkmark + stethoscope | "Reviewed by Dr. [Name]" |
| **Not yet reviewed** | Amber `#D97706` | Clock icon | "Not yet reviewed" |
| **Peer content** | Gray `#475569` | Person icon | Author name or "Anonymous" |
| **Expert content** | Gold `#C9963A` | Star + person icon | "Expert" badge |
| **Protocol-executed** | Gold `#C9963A` | Gear icon | "Care program" badge |
| **System** | Mid gray `#94A3B8` | — | No attribution |

### 3.6 Color accessibility rules

- All text meets WCAG AA contrast minimum (4.5:1 for body text, 3:1 for large text)
- Color is never the sole carrier of meaning — always paired with icon shape, text label, or position
- Severity indicators use background tint + border + icon + text label (four redundant signals)
- Interactive elements have visible focus states (2px teal outline, 2px offset)

---

## 4. Typography

### 4.1 Type scale

| Level | Size (mobile) | Size (desktop) | Weight | Line height | Usage |
|---|---|---|---|---|---|
| **Display** | 28px | 36px | Bold (700) | 1.2 | Screen titles, hero moments |
| **H1** | 24px | 28px | Bold (700) | 1.3 | Section headers |
| **H2** | 20px | 22px | Semibold (600) | 1.3 | Subsection headers, card titles |
| **H3** | 17px | 18px | Semibold (600) | 1.4 | Card subtitles, field group labels |
| **Body** | 16px | 16px | Regular (400) | 1.5 | Primary body text, descriptions |
| **Body small** | 14px | 14px | Regular (400) | 1.5 | Secondary descriptions, metadata |
| **Caption** | 12px | 12px | Regular (400) | 1.4 | Timestamps, labels, tertiary info |
| **Overline** | 11px | 12px | Semibold (600), uppercase, letter-spacing 0.5px | 1.3 | Category labels, status badges |

### 4.2 Font stack

**Primary:** Inter (variable weight, excellent screen readability, medical-grade clarity)

**Fallback:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif

**Monospace (clinical data):** "SF Mono", "Fira Code", "Consolas", monospace — used for lab values, medication codes, and technical identifiers only.

### 4.3 Typography rules

- Body text is never smaller than 16px on mobile (iOS zoom prevention, readability)
- Patient-facing clinical terms have inline explanations on first appearance
- Numbers in clinical context (lab values, vitals, dosing) use tabular figures for alignment
- Line length capped at 75 characters for body text (readability)

---

## 5. Spacing and layout

### 5.1 Spacing scale

Base unit: 4px. All spacing uses multiples of 4px.

| Token | Value | Usage |
|---|---|---|
| `space-1` | 4px | Tight internal padding (icon-to-text within a badge) |
| `space-2` | 8px | Internal component padding, inline element gaps |
| `space-3` | 12px | Card internal padding (compact), list item gaps |
| `space-4` | 16px | Standard card padding, section spacing within a card |
| `space-5` | 20px | Screen horizontal margin (mobile) |
| `space-6` | 24px | Section spacing between cards |
| `space-8` | 32px | Major section breaks |
| `space-10` | 40px | Screen vertical padding (top/bottom) |
| `space-12` | 48px | Large section separators |

### 5.2 Grid

**Patient app (mobile):** Single column, 20px horizontal margins, 16px gutter between cards.

**Clinician portal (desktop):** 12-column grid, 24px gutter, 32px horizontal margins. Three-panel case review uses a 4-4-4 or 5-4-3 column split depending on content density.

### 5.3 Touch targets

- Minimum touch target: 44x44px (Apple HIG / WCAG)
- Interactive elements have at least 8px clearance from adjacent interactive elements
- Primary action buttons: 48px height minimum, full-width on mobile

---

## 6. Component library

### 6.1 Buttons

| Type | Appearance | Usage |
|---|---|---|
| **Primary** | Teal background, white text, 8px radius, 48px height | Main actions: "Request Refill," "Submit," "Book Consult" |
| **Secondary** | White background, teal border, teal text, 8px radius | Alternative actions: "Cancel," "Save Draft" |
| **Destructive** | Coral background, white text, 8px radius | Dangerous actions: "Revoke Access," "Decline" |
| **Ghost** | No background, teal text, underline on hover | Inline text actions: "Learn more," "View details" |
| **Disabled** | Light gray background, mid-gray text, no interaction | When action is unavailable (with explanation tooltip) |

### 6.2 Cards

The primary container for grouped information. Used everywhere.

| Property | Value |
|---|---|
| Background | White (`#FFFFFF`) |
| Border | 1px `#EDF1F4` |
| Border radius | 12px |
| Shadow | 0px 1px 3px rgba(0,0,0,0.06) |
| Padding | 16px (mobile), 20px (desktop) |

**Card variants:**
- **Standard card** — white background, light border, subtle shadow
- **Elevated card** — white background, stronger shadow (0px 4px 12px rgba(0,0,0,0.08)) — for primary actions and focal content
- **Tinted card** — off-white (`#F7F9FA`) background — for secondary/supporting information
- **Alert card** — severity-tinted background with colored left border (4px) — for interaction signals, RPM alerts

### 6.3 Status badges

| Status | Background | Text | Shape |
|---|---|---|---|
| **Active** | `#DCFCE7` | Green `#166534` | Rounded pill |
| **Pending** | `#FEF9C3` | Amber `#854D0E` | Rounded pill |
| **In Progress** | `#DBEAFE` | Blue `#1E40AF` | Rounded pill |
| **Completed** | `#F1F5F9` | Gray `#475569` | Rounded pill |
| **Error / Failed** | `#FEE2E2` | Red `#991B1B` | Rounded pill |
| **Protocol** | `#FEF3C7` | Gold `#92400E` | Rounded pill with gear icon |

### 6.4 Content source indicator

Appears on every piece of content that has a source attribution.

```
┌───────────────────────────────────────┐
│ 🤖 AI  |  Reviewed by Dr. Mensah  ✓  │
├───────────────────────────────────────┤
│                                       │
│  [Content body]                       │
│                                       │
└───────────────────────────────────────┘
```

- AI content: teal left border (4px), robot icon, "AI" overline label
- Clinician content: navy left border, stethoscope icon, clinician name
- Reviewed content: green checkmark appended to the reviewed-by line
- Peer content: gray left border (1px only), person icon, name or "Anonymous"
- Expert content: gold left border, star badge, "Expert" label

### 6.5 Signal card

Used for interaction engine and herb-drug signals.

```
┌──────────────────────────────────────────┐
│ ⬤ Critical  │  Drug-Drug Interaction    │
│──────────────────────────────────────────│
│ Metformin + [Drug B]: CYP3A4 inhibition │
│ increases serum concentration.           │
│                                          │
│ Recommended: Block                       │
│ Evidence: PharmDB v3.2                   │
│                                          │
│ [Override]              [View Evidence]  │
└──────────────────────────────────────────┘
```

Left border color = severity color (4px). Background tint = severity tint. Icon = severity icon.

### 6.6 Medication detail card

```
┌──────────────────────────────────────┐
│  Metformin 500mg                     │
│  Tablet  •  1 twice daily            │
│                                      │
│  Refill due in 5 days    [Refill →]  │
│                                      │
│  🟡 1 interaction signal             │
│  ⚙️ Approved under care program      │
└──────────────────────────────────────┘
```

### 6.7 Navigation components

**Bottom tab bar (patient app):**
- 5 tabs, icon + label, 50px height
- Active: teal icon + teal label (semibold)
- Inactive: mid-gray icon + mid-gray label (regular)
- Badge: red dot with count for notifications

**Left sidebar (clinician portal):**
- 240px width, navy background
- Active item: teal left accent (4px) + white text
- Inactive item: mid-gray text
- Count badges: teal background, white text, rounded pill
- Clinician name and role at bottom

### 6.8 Form components

| Component | Specification |
|---|---|
| **Text input** | 48px height, 12px padding, 8px radius, 1px gray border, teal border on focus |
| **Select** | Same as text input, with chevron icon |
| **Checkbox** | 24x24px, 4px radius, teal fill when checked, checkmark icon |
| **Radio** | 24x24px, circle, teal fill when selected |
| **Toggle** | 48x24px, teal when on, gray when off |
| **Error state** | Red border, red caption text below field, shake animation |

---

## 7. Interaction patterns

### 7.1 Loading states

- **Skeleton screens** for content areas (gray pulse animation matching expected layout)
- **Spinner** (teal, 24px) only for inline actions (button loading, save confirmation)
- **Progressive loading** — content sections load independently; first-available content shows immediately
- Never a full-screen spinner blocking all interaction

### 7.2 Empty states

Every empty state has three elements:
1. **Illustration or icon** — relevant, not generic
2. **Explanation** — what this surface is for
3. **Action** — how to get started ("Upload your first lab results," "Start a consultation")

Empty states are never blank screens.

### 7.3 Error states

- **Inline errors** (form fields): red border + red message below the field
- **Section errors** (content failed to load): gray container with error message + retry button
- **Full-screen errors** (connectivity lost): persistent banner at top + cached content where available
- Error messages use plain language, never technical jargon ("We couldn't load your lab results" not "HTTP 500")

### 7.4 Offline behavior

- Persistent banner: "You're offline — some features are unavailable"
- Cached content displays with "Last updated [timestamp]" label
- Interactive elements that require connectivity show disabled state with explanation
- Emergency screen always available (fully cached)
- Queued actions show "Will send when connected" indicator

### 7.5 Transitions and animation

- **Screen transitions:** 200ms ease-out slide (mobile), 150ms fade (desktop)
- **Card expand/collapse:** 200ms ease-out height animation
- **Status updates:** brief green flash (success) or red flash (error) on the affected element
- **Respect reduce-motion:** all animations disabled when system prefers-reduced-motion is active
- No gratuitous animation. Every animation communicates a state change.

### 7.6 Haptic feedback (mobile)

- Light haptic on successful submission (refill requested, payment confirmed)
- Medium haptic on error or destructive action
- No haptic on routine navigation

---

## 8. Delegate overlay

When a user is acting as a delegate, the following visual changes apply globally:

| Element | Change |
|---|---|
| **Banner** | Persistent teal banner below the navigation: "Viewing: [Patient Name]  [Switch]" — 40px height, cannot be dismissed |
| **Background tint** | Subtle teal tint (`#F0FAFB`) on the screen background to visually distinguish delegate mode from own-account mode |
| **Disabled actions** | Actions outside the delegate's granted scope show as disabled (grayed out) with a tooltip: "You don't have permission for this action" |
| **Audit indicator** | Subtle "Acting as delegate" footer on every screen in delegate mode |

---

## 9. Emergency surface

The emergency screen is treated as a special-case design:

- **Always accessible** — one tap from any screen (persistent control)
- **High contrast** — large text, maximum contrast ratios, no subtle styling
- **Works offline** — all content cached locally, no server dependency
- **No loading state** — content is pre-rendered, never behind a spinner
- **Primary action button** — "Call Emergency Services" is full-width, 64px height, red background, white text, top of screen
- **Patient data section** — medications, allergies, conditions displayed below call buttons, always current to last sync

---

## 10. Dark mode

Dark mode is planned for post-launch. The color system is designed to support it:

- Neutral palette inverts (near-black becomes background, white becomes text)
- Brand colors (teal, coral, gold) remain constant but may shift to slightly lighter variants for contrast
- Semantic colors remain constant (red stays red, green stays green)
- Signal severity tints shift to darker variants
- Cards become dark gray (`#1E293B`) with lighter borders

The design system is dark-mode-ready but dark mode is not a launch requirement.

---

## 11. Iconography

**Icon set:** Lucide Icons (open source, consistent stroke width, medical-appropriate)

**Icon sizes:**
| Context | Size |
|---|---|
| Navigation tab | 24px |
| Inline with text | 16px |
| Card header | 20px |
| Feature illustration | 48px |
| Empty state illustration | 64px |

**Icon style rules:**
- Stroke weight: 1.5px (consistent with Lucide defaults)
- Color matches the text it accompanies (never decorative-only color)
- Interactive icons have 44x44px touch targets regardless of visual size

---

## 12. Platform-specific adaptations

### iOS
- Uses iOS system font (-apple-system) as fallback
- Bottom tab bar: iOS-native positioning below safe area
- Swipe-back gesture supported on all screens
- Respects Dynamic Type for text scaling

### Android
- Uses Roboto as fallback
- Bottom navigation follows Material Design 3 positioning
- System back button supported
- Respects system font size settings

### Web (clinician portal)
- Minimum viewport: 1024px width
- Responsive to 1920px+
- Keyboard navigation for all interactive elements
- Focus management follows WCAG 2.1 AA

---

## 13. Design tokens (implementation reference)

Design tokens are the engineering bridge between this specification and code. Every value in this document maps to a named token.

```
// Colors
--color-brand-primary: #0A7E8C;
--color-brand-secondary: #1A3A5C;
--color-accent-coral: #D4553A;
--color-accent-gold: #C9963A;
--color-bg-primary: #FFFFFF;
--color-bg-secondary: #F7F9FA;
--color-bg-dark: #0F1B2D;
--color-text-primary: #1E293B;
--color-text-secondary: #475569;
--color-text-tertiary: #94A3B8;
--color-border: #EDF1F4;
--color-success: #16A34A;
--color-warning: #D97706;
--color-error: #DC2626;
--color-info: #2563EB;

// Severity
--color-severity-critical-bg: #FEF2F2;
--color-severity-critical-border: #DC2626;
--color-severity-major-bg: #FFF7ED;
--color-severity-major-border: #EA580C;
--color-severity-moderate-bg: #FEFCE8;
--color-severity-moderate-border: #CA8A04;
--color-severity-minor-bg: #F0F9FF;
--color-severity-minor-border: #3B82F6;

// Spacing
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;

// Typography
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'SF Mono', 'Fira Code', Consolas, monospace;
--font-size-display: 28px;
--font-size-h1: 24px;
--font-size-h2: 20px;
--font-size-h3: 17px;
--font-size-body: 16px;
--font-size-body-sm: 14px;
--font-size-caption: 12px;
--font-size-overline: 11px;

// Radii
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-pill: 9999px;

// Shadows
--shadow-sm: 0px 1px 3px rgba(0,0,0,0.06);
--shadow-md: 0px 4px 12px rgba(0,0,0,0.08);
--shadow-lg: 0px 8px 24px rgba(0,0,0,0.12);

// Transitions
--transition-fast: 150ms ease-out;
--transition-normal: 200ms ease-out;
--transition-slow: 300ms ease-out;
```

---

## 14. Hard rules — non-negotiable

These rules cannot be broken under any circumstance:

1. **AI content is always labeled.** No AI-generated content appears without the AI source indicator. No exceptions.
2. **Protocol-executed actions are always flagged.** If a protocol approved it, the patient and clinician see the protocol badge.
3. **Color is never the sole carrier of meaning.** Every color-encoded signal has a text label, icon shape, and positional cue as redundant channels.
4. **Body text is never smaller than 16px on mobile.** Captions (12px) and overlines (11px) are for metadata only, never for content the patient must read to make a decision.
5. **Emergency is always one tap away.** The emergency control is never hidden, never behind a menu, never removed by scrolling.
6. **Delegate context is always visible.** When a user is in delegate mode, the delegate banner is visible on every screen. It cannot be dismissed.
7. **Empty states are designed.** No screen may ship with a blank/default empty state. Every empty state has an illustration, explanation, and action.
8. **Offline content is cached.** Emergency screen, active medications, allergies, and conditions are always available offline.
9. **Status is honest.** No aspirational status messages. "Delivering" means the package has left the pharmacy. "Approved" means a clinician or protocol has signed off.
10. **Errors are human-readable.** No error code, stack trace, or technical message is ever shown to a patient. Clinician portal may show error codes alongside human-readable messages.

---

## Document control

- **v1.1 cycle additions — 2026-05-02 (per v1.10.1 hygiene cycle, Phase5 delta Group 5C, Rows 20 + 33):** Row 20 reconciles the Tenant brand token overlay model with the C3 brand-structure cascade (per-tenant theming keys off consumer DBA, not operating-tenant ID; structured `consumer_dba` / `consumer_subdomain` / `primary_color` token namespace replaces ad-hoc bare-string tenant fields). Row 33 adds a new "Heros consumer-brand identity tokens" section (logo, colors, typography, voice, photography placeholder substitution rules; authoritative visual reference is `telecheck-design-system/project/Patient interactive mock v7.html`). Body file content otherwise unchanged at v1.1 baseline.
- **v1.1** — Adds Tenant brand token overlay model section per ADR-023 multi-tenancy and CRITICAL-05 / MEDIUM-17 remediation. Defines tenant-overridable vs platform-fixed tokens; runtime resolution rule; tenant brand authoring authority via Admin Backend; brand validation rules; accessibility floor enforcement. Threading remediation per Adversarial Counsel Review v1.0 finding MEDIUM-17. Existing color system, typography scale, spacing, component library, interaction patterns, delegate overlay, emergency surface, dark-mode readiness, iconography, platform adaptations, design tokens, and 10 hard rules preserved without modification.
- **v1.0** — Initial Design System. Defines color system (5 palettes, 8 content source indicators, 4 severity levels), typography (8-level type scale, Inter font), spacing (12-token scale), component library (8 component categories), interaction patterns (6 behavioral specifications), delegate overlay, emergency surface, dark-mode readiness, iconography, platform adaptations, design tokens, and 10 hard rules. Derived from Patient App IA v1.0, Clinician Portal IA v1.0, and Master PRD v1.6 §17.
- **Next review:** after Figma component library is built from this specification; after first design review with engineering; after first tenant brand customization rolled out.
- **Change discipline:** changes to the color system, typography scale, content source indicators, severity colors, or hard rules require design lead and product owner sign-off.

---

## Tenant brand token overlay model (added v1.1, per Design Implementation Contract v1.0 §5.2)

Per ADR-023 multi-tenancy Model A, the platform supports per-tenant brand customization within strict boundaries. Some tokens are **tenant-overridable** — tenants may customize them. Others are **platform-fixed** — they encode safety conventions and accessibility floors that cannot be tenant-overridden.

### Resolution rule

At runtime, when rendering any token-driven component:
1. If the token is on the **tenant-overridable** list AND the active tenant has authored an override, use the tenant override.
2. Otherwise, use the platform default.

This produces a deterministic, tenant-scoped visual identity. The same component renders with different colors / typography / logo per tenant.

### Tenant-overridable tokens (tenants MAY customize)

**Brand colors:**
- `--color-brand-primary` (the tenant's primary brand color; used in CTAs, navigation accents)
- `--color-brand-primary-pressed` (interaction state)
- `--color-brand-secondary` (secondary brand color; used in supporting elements)
- `--color-brand-accent` (accent color; used sparingly for emphasis)

**Brand identity:**
- `--brand-display-name` (tenant's display name in UI: "Heros" vs "Telecheck-Ghana")
- `--brand-logo-url` (tenant's logo asset)
- `--brand-logo-mark-url` (tenant's logo mark for compact use)

**Typography (within scale):**
- `--font-family-headings` (tenant may override default Inter for headings within an approved font list)
- `--font-family-body` (tenant may override default Inter for body within an approved font list)
- Approved font list: Inter (default), Sans-serif system fallbacks. Tenant may NOT introduce arbitrary fonts (file licensing, accessibility, performance reasons).

### Platform-fixed tokens (tenants MAY NOT customize)

**Severity colors (per Master PRD safety floor):**
- `--color-severity-critical` (red — encodes immediate-risk meaning across platform)
- `--color-severity-major` (orange — encodes major-risk)
- `--color-severity-moderate` (yellow — encodes moderate-risk)
- `--color-severity-minor` (gray — encodes minor advisory)
- `--color-severity-success` (green — encodes positive confirmation)
- These colors carry semantic meaning that must be consistent across tenants for clinical safety. A tenant rebranding "critical" as a different color would compromise patient safety across the platform.

**Content source indicators (per Master PRD §17 honest-status discipline):**
- `--color-source-clinician` (encodes "from your clinician")
- `--color-source-platform` (encodes "from Telecheck platform")
- `--color-source-ai` (encodes "AI-generated, not clinician reviewed")
- `--color-source-pharmacy` (encodes "from your pharmacy")
- `--color-source-engine` (encodes "from interaction engine")
- `--color-source-protocol` (encodes "protocol-authorized")
- `--color-source-tenant-ops` (encodes "from your care team operations")
- `--color-source-system` (encodes "system / automated")
- These visually communicate the source of every piece of information. Tenant override would dilute the honest-status guarantee.

**Semantic colors:**
- `--color-info`, `--color-warning`, `--color-error`, `--color-success` — platform-fixed for cross-tenant consistency.

**Accessibility floors:**
- `--font-size-min` (minimum readable size — 14px web, 16px native)
- `--touch-target-min` (44pt iOS, 48dp Android — accessibility requirement)
- `--contrast-ratio-floor` (WCAG 2.1 AA: 4.5:1 normal text, 3:1 large text — accessibility requirement)

### Tenant brand authoring

Tenant Admin (or Tenant Marketing within authority limits) authors tenant brand tokens via Admin Backend per Admin Backend Slice v1.X §5.8. The Admin Backend brand-authoring UI:
- Renders a live preview of how the brand will look in the patient app
- Validates accessibility floors at authoring time (e.g., rejects a primary color that fails 4.5:1 contrast against the white background it will sit against)
- Validates platform-fixed tokens are not being attempted (UI does not surface those token names as editable)
- Audits brand changes per AUDIT_EVENTS v5.1 Category C

### Validation rules

A tenant brand authoring submission is rejected if:
- Primary color contrast against `--color-bg-default` (white) fails 4.5:1 (text would be unreadable)
- Logo asset fails dimension or file-format requirements
- Display name contains profanity or spoofing of platform/another-tenant names
- Font family is not on the approved list

### Platform default brand

A "platform default brand" exists for the rare case where tenant context cannot be resolved at render time (error condition). Platform default uses Telecheck-Ghana's brand at launch (since that is the platform's home market and brand). The platform default is intentionally identifiable as the platform brand, not anonymized — operators should recognize "this is rendering platform default, tenant resolution failed."

### Cross-tenant brand isolation

A tenant cannot view or copy another tenant's brand tokens. Platform Admin can view all brands but cannot author on behalf of a tenant per the privacy boundary in Notification Spec v1.1 "Tenant-scoped variants and overrides — Variant authoring authority" rule.

### Brand transitions

When a tenant changes their brand (e.g., a refresh, a logo update), the change is staged and applied at the next user session per the runtime resolution rule. There is no "live brand swap" mid-session. Brand changes are audited per AUDIT_EVENTS v5.1.

---

## v1.10 cycle additions (added 2026-05-02 per v1.10.1 hygiene cycle physical merge of Phase5 delta Group 5C)

### Row 20 — Per-tenant theming reconciled with C3 brand-structure cascade

The Tenant brand token overlay model (above) accommodates the Master PRD §17 / ADR-027 v0.6 brand-structure cascade as follows:

- Per-tenant theming variables work with the **consumer DBA** at runtime, not the operating-tenant identifier. For Telecheck-US the consumer DBA is `Heros Health`; for Telecheck-Ghana the consumer DBA is `Heros Health Ghana`.
- Operating-tenant identifiers (`Telecheck-US`, `Telecheck-Ghana`) are **internal/B2B-only** and are not patient-facing. Design tokens key off `consumer_dba` (and downstream consumer-brand fields), not the operating tenant ID.
- The `--brand-display-name` example previously listed as `"Heros" vs "Telecheck-Ghana"` should be read as the consumer-DBA-instanced values: `"Heros Health"` (consumer DBA, US) vs `"Heros Health Ghana"` (consumer DBA, GH).
- The `tenant_brand` design token namespace is updated per the structured C3 vocabulary: `consumer_dba`, `consumer_subdomain`, `primary_color`, `secondary_color`, `logo_asset_id`, `logo_mark_asset_id`, `voice_profile_id` (replaces ad-hoc bare-string tenant fields).
- "Platform default brand" rule (above) preserved — platform default at launch surfaces the Telecheck-Ghana operating-tenant brand (instanced via Heros Health Ghana consumer DBA) as the canonical fallback.

### Row 33 — Heros consumer-brand identity tokens (NEW section)

This section specifies the canonical Heros Health consumer-brand identity that the Patient App and any consumer-facing surfaces render through the tenant-overridable token layer.

**Authoritative visual reference:** `telecheck-design-system/project/Patient interactive mock v7.html` (per CLAUDE.md "Authoritative mock" declaration; Patient mock v7 binding visual reference once v1.10 / DIC v1.1 promotes).

**Logo:**
- Primary wordmark: Heros Health full wordmark (placeholder asset in `telecheck-design-system/project/assets/logo/`; substitute before customer ship).
- Logo mark: Heros Health symbol/glyph (compact use; nav bar, app icon).
- Country-instanced lockups: `Heros Health` (US, default), `Heros Health Ghana` (GH). Country qualifier rendered in the tagline slot, not the wordmark itself.

**Colors (consumer-brand layer; tenant-overridable per overlay model):**
- `--color-brand-primary` — Heros Health primary (per Patient mock v7 token set).
- `--color-brand-primary-pressed` — interaction state derived per overlay model.
- `--color-brand-secondary` — Heros Health supporting brand color.
- `--color-brand-accent` — accent color (used sparingly).
- AI surfaces continue to use Iris (`#6E5BD6`) per Master PRD §16 — Iris is platform-fixed and not subject to consumer-brand override (see "Platform-fixed tokens" above; Iris is reserved exclusively for AI-authored content).

**Typography:**
- Default headings + body: Inter (platform default per §4.2 Font stack). Manrope is referenced in the design handoff as a placeholder substitution candidate; substitution occurs before customer ship per the design handoff substitution discipline.
- Tenant override permitted within approved font list per overlay model.

**Voice (consumer-brand layer):**
- Heros Health voice profile applies to consumer-facing copy: warm, plain-spoken, honest status.
- "Honest status" rule (Master PRD §16; §14 Hard rule 9 above): never aspirational, softened, or hedge-slop copy. "Submit prescription" not "Send for review" if the action commits.
- AI / human distinction enforced by three cues (color + glyph + label) — never relax to color-only. The `ai-spark` glyph and "Telecheck AI" label always accompany Iris on first reveal.

**Photography placeholder substitution rules:**
- All photography in the design handoff (`telecheck-design-system/project/`) is placeholder. Customer-shipped product MUST replace placeholder photography with licensed, approved imagery before customer ship.
- Substitution discipline: any image asset surfaced to a patient must be tagged `production-approved` in the asset registry. Assets tagged `placeholder` MUST NOT render in production builds.
- AI / human cues (color + glyph + label) are not affected by photography substitution.

**Cross-references:** Master PRD §16, §17; Design Implementation Contract v1.1 (Canonical for development) §103; ADR-027 v0.6 marketing copy governance posture; CLAUDE.md design handoff section (Authoritative mock = Patient interactive mock v7).

---
