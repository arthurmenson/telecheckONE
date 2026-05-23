# Handoff — Telecheck Ops Cockpit

> ## ⚠️ DESIGN LOCKED — 1:1 IMPLEMENTATION, NO DRIFT
>
> **This design is final and approved.** Your job is to recreate it exactly in the production codebase. Do not "improve," reinterpret, restyle, restructure, simplify, or substitute components. No creative liberty. No "while I'm at it" polish.
>
> If something looks wrong, it is intentional unless this README or the user explicitly says otherwise. **When in doubt, match the prototype byte-for-byte and ask the user before deviating.**
>
> Specifically, do NOT:
> - Swap Manrope/Inter/JetBrains Mono for "system" fonts or whatever Next.js ships with by default
> - Substitute Lucide icons with Heroicons, Feather, or your own SVG redraws — use the exact icon set defined here
> - Re-pick colors "to match Tailwind's scale" — hex values are locked
> - Round corners differently than specified
> - Pick different shadow / elevation values
> - Skip the iris/AI-vs-human visual cue rules (color + glyph + label triple cue)
> - Rebuild the layout grid with Tailwind utility classes if the spacing diverges from the prototype's exact values
> - Replace the kanban with a "better" data table
> - Convert charts/sparklines to a chart library if that changes the visual treatment
> - Treat "comfortable" as "spacious" or vice versa — densities are tuned
> - Add hover/focus animations the prototype doesn't have
> - Re-author copy. Copy in the prototype is the copy.
>
> Pixel-perfect parity to the HTML prototypes in this folder is the acceptance criterion.

---

## Overview

The **Telecheck Ops Cockpit** is an agentic workforce operations cockpit — a web app that gives a founder/operator real-time visibility into autonomous AI agents working on a software project, plus the ability to intervene, ratify decisions, and chat naturally with the orchestrator.

Telecheck (multi-tenant telehealth platform, piloting in Ghana) is instance #1. The cockpit is **project-agnostic** so future startups, internal tools, or research projects can adopt it with no UI changes.

Mental model: *"Mission Control for a software company run mostly by AI agents."*

**Primary persona** — solo founder/ratifier. Time-pressed. Glance-then-act. Wants to know: *are we on track, what needs my decision, what's broken*.

---

## About the design files

The files in this folder are **design references created in HTML/React-via-Babel** — prototypes showing the intended look and behavior. They are not production code to copy verbatim.

Your task is to **recreate these HTML designs in the target codebase's chosen stack** (Next.js + React + Tailwind + shadcn/ui per the brief), using its established patterns and libraries — but **without drifting from the visual design**. Use the prototype CSS as the source of truth for tokens; build a real token system from it (CSS variables, Tailwind theme config, or your component library's equivalent). Do not approximate.

If the target codebase has a dev environment but no design system yet, scaffold one **from these prototypes**, not from a fresh shadcn theme.

---

## Fidelity

**High-fidelity (hifi), design-locked.**

- All colors, type sizes, weights, line-heights, spacings, radii, shadows are final.
- All copy is final.
- All layouts are final.
- All component states (hover, active, focus, disabled) follow the rules in the source CSS (`cockpit.css`).
- Both dark and light themes are required; dark is the default per the operator/Bloomberg-terminal aesthetic.
- AI-vs-human visual discipline is non-negotiable: iris accent (`--ai`), sparkle glyph, and the literal text "Telecheck AI" are the three-cue requirement on every AI-authored block. Never one or two of the three.

---

## Files in this folder

| File | What it is | Treat as |
|---|---|---|
| `Ops Cockpit.html` | App shell + tweaks panel + screen router | **Reference for app structure + screen wiring** |
| `cockpit.css` | All tokens (colors, type, spacing, radii, shadows) + component styles | **SOURCE OF TRUTH for visual tokens** |
| `cockpit-icons.jsx` | Custom 1.5px-stroke Lucide-style icon set | **SOURCE OF TRUTH for icons** — use these exact paths, or pull from Lucide where named identically |
| `cockpit-data.jsx` | Mock data (agents, PRs, events, ratifications, inventory) | Reference for data shape only; replace with real API |
| `cockpit-shell.jsx` | Sidebar, Topbar, PulseRibbon, Drawer, Modal, Sparkline | Components to recreate 1:1 |
| `cockpit-screen-cockpit.jsx` | Cockpit screen + 3 variants (dense/hybrid/glance) + metric cards | Components to recreate 1:1 |
| `cockpit-screens-2.jsx` | Agents, Work (Kanban), Spec Corpus screens | Components to recreate 1:1 |
| `cockpit-screens-3.jsx` | Inventory, Event Log, Chat, Settings, Mobile screens | Components to recreate 1:1 |
| `tweaks-panel.jsx` | Design-time controls — do NOT ship to production. Used for variant switching during review. | **Strip from production build** |
| `ios-frame.jsx` | iOS device chrome around mobile screens. Used for review only — mobile screens render in real device viewport in production. | **Strip from production build** |

To run the prototype locally for reference:
```sh
# from this folder, any static server works
python3 -m http.server 8000
# then open http://localhost:8000/Ops%20Cockpit.html
```

---

## Tech stack (per design brief)

- **Frontend:** Next.js + React + Tailwind
- **Components:** shadcn/ui (or equivalent unstyled-primitive library); style with the token system below
- **Backing API:** Fastify backend exposing REST + WebSocket endpoints (Claude wires this separately based on this UI spec)
- **Realtime:** WebSocket with optimistic local rendering
- **Fonts:** Manrope (display + UI), Inter (body fallback), JetBrains Mono (audit artifacts, IDs, code, lab values, all numeric strings)

**Performance:** Time-to-Interactive < 2 seconds on cable broadband.

**Accessibility:** WCAG AA. Keyboard-navigable. Screen-reader-friendly. Focus rings always visible.

**Responsive:**
- Desktop (≥1280px): primary, full functionality
- Tablet (768–1279px): full functionality, layouts compress
- Mobile (<768px): **read-only glance** view only — actions disabled

---

## Information architecture — 9 screens

### Navigation
A **fixed left sidebar (224px wide)** carries:
1. Brand mark + product name + build number
2. **Project switcher** (top of sidebar, below brand) — supports multiple projects (cockpit is multi-tenant)
3. **Workspace nav** (7 items): Cockpit, Agents, Work, Spec Corpus, Inventory, Event Log, Chat
4. **Other** section: Mobile (read-only preview), Settings
5. User chip (avatar, name, role, online dot) pinned to the bottom

Active item: white text + iris-soft background + 2px teal accent strip on the left edge.

### Topbar (48px tall, fixed)
Left → right: Live · WebSocket pulse indicator → divider → search field (`⌘K` to open command palette) → UTC clock (live, ticks every second) → refresh icon → notifications bell with badge → theme toggle (sun/moon)

### Persistent activity ribbon (28px tall)
Below the topbar on every screen except Chat and Mobile. Shows a 24-hour event histogram in primary color, with iris overlay representing AI-authored portion.

### 1. Cockpit (default)
High-level project status + blockers. **3 layout variants** the founder picked between in design — all three must be implemented and toggle-able (e.g., via user setting):

- **Dense** (Bloomberg style): 4 hero metric cards in one row + agent strip + 3 middle cards + 16-event live feed at bottom. Smaller type, packed.
- **Glance** (executive style): 4 hero metrics with very large numbers (64px). 3 middle cards. No live feed. Adds a single "today's most-important next action" CTA card.
- **Hybrid**: 4 hero metrics medium (48px). Agent strip dropped. 3 middle cards. 10-event live feed.

A small segmented control (`Dense / Hybrid / Glance`) sits in the page header's right side to switch.

### 2. Agents
Grid of agent cards (`auto-fill, minmax(320px, 1fr)`). Each card:
- Avatar gradient circle (initials) + name + AI sparkle + role description
- Status dot (lg size) right-aligned
- Focus block (mono-prefixed, on surface-2 background)
- 3 stat columns: Heartbeat / PRs · Codex / Scope %
- Scope progress bar (4px high, agent's color)
- 3 buttons: Pause / Restart / View logs
- Click card → opens **Agent drawer** (480px right-side drawer) with KV details, recent PRs list, and live reasoning trace (mono, iris-stamped timestamps)

Top-right: filter chips (All / Active / Stalled / Offline), Refresh, **+ Add agent** primary button → modal with name, role, model select, spawn behavior, and an iris-banded AI recommendation.

### 3. Work (Kanban)
4-column board, full available height:
1. **In Progress** (gray dot) — agent authoring
2. **In Codex Review** (amber dot) — adversarial pass
3. **Awaiting Ratifier** (red dot) — hard-floor #6 escalations
4. **Merged Today** (green dot) — shipped to canonical

Each PR card has a 2px iris left-border when AI-authored, repo color square, PR number, age, title, agent badge (status dot + name + sparkle), Codex round pill, CR ID pill, line-count meta.

Top-right: repo filter chips (each with its repo color), Filter, **Open in GitHub** button.

### 4. Spec Corpus
3-pane layout:
- **Left (280px):** tree of canonical artifacts (PRD, CDM, OpenAPI, State Machines, RBAC, Contracts Pack with 14 children, ADRs with 3 children, Slice PRDs with 5 children). Pending-CR count shown as a warning dot next to the row.
- **Center:** selected artifact details — title + version pill + pending-CR pill, KV metadata (path, last commit, promoted via, cross-refs), Recent promotion ledger card, iris-banded AI summary.
- **Right (320px):** Pending ratifications queue. Each row: CR ID, priority pill (p0/p1/p2), floor pill, age, title, filing agent. Click → **Ratify modal** (720px) with title, metadata, iris-banded Claude recommendation, two-column Codex pass-1 + pass-2 cards, diff preview (mono, surface-2 background), and 4 footer buttons: Cancel / Modify / Reject / Approve.

Top-right: Verify integrity / Export bundle buttons.

### 5. Inventory
- 4 type-totals cards (Tools / Skills / MCPs / Agents) — icon in a colored 38×38 square, large count, mono caption
- Filter chips (All / Tool / Skill / MCP / Agent) + secondary filters on the right
- Table with sticky header. Columns: Name (mono, bold) / Type (colored pill) / Owner agent (mono) / Status (ok/muted/bad pill) / 24h (mono, right-aligned) / 7d (mono dim, right-aligned) / Last used (mono dim).

### 6. Event Log
- Header status pill ("Integrity verified · 14:38 UTC") + Verify integrity + Export NDJSON buttons.
- Search input + filter chips per event type with mono counts.
- 4-column grid rows: `70px when` / `100px type` / `110px source` / `1fr summary`.
- Type pill uses event-class soft color (info=dep, warning=codex, success=pr-merged, primary=pr-open, ai=ratify, danger=hardstop, ai=dialogue, surface-3=heartbeat).
- Click row → expand to mono JSON detail in a sunken surface-2 strip below.

### 7. Chat
Claude.ai-style conversation UI but scoped to the project:
- Centered max-width (760px) stream
- Opening hero: small AI tag, "How can I help today?", subtitle
- Messages: 28px avatar (user=gold gradient, orch=iris gradient), name + AI badge + time, body. Code in backticks → inline `code` style. AI callout = iris-soft block with sparkle tag.
- Bottom: suggestion chips (e.g., "What needs my decision?", "Approve CR-094"), then input pill with `@orchestrator` routing badge (clicking an agent reroutes), textarea (Enter to send), voice toggle (mic icon → iris when active), send button (primary, disabled when empty).
- Voice input: Web Speech API. Voice output: system TTS (defer ElevenLabs to v1.1).
- Conversation persists per project as `human_orchestrator_dialogue` events on the canonical log.

### 8. Settings (admin-only)
2-column: 220px left nav + content. 5 tabs:
- **Project**: active project KV + all-projects table with Switch action + New project button
- **Agents & roles**: agent roster table
- **API keys**: provider table with Rotate action
- **Access & ratifiers**: floor-by-floor authority KV + iris-banded AI recommendation about delegation
- **Audit log**: cockpit-level audit (separate from canonical project event log)

### 9. Mobile (read-only glance) — Cockpit + Agents + Chat only
Single scrollable view per screen. Dark only (operator-style). Inside an iOS device frame at 402×874:
- **Mobile Cockpit:** all-systems-nominal banner, large 64px pilot %, 24h merges + queues cards, 3 awaiting-decision cards (read-only — tap goes to detail but cannot ratify on mobile), last 5 events, "Open desktop for full control" CTA
- **Mobile Agents:** stacked agent cards with status dot, name, sparkle, heartbeat, focus, scope bar
- **Mobile Chat:** orchestrator chat scoped down, mic-only voice input pill

---

## Design tokens — SOURCE OF TRUTH

These are lifted from `cockpit.css` verbatim. **Do not invent new tokens.** Add new ones only with user approval, and never override these.

### Neutrals (warm-leaning, slightly green-tinted, NOT blue-gray)
```
--n-0:#ffffff   --n-25:#fbfcfb   --n-50:#f5f7f6   --n-100:#eceeec
--n-200:#dde2e0 --n-300:#c6cdc9  --n-400:#9aa5a0  --n-500:#6f7a75
--n-600:#525b57 --n-700:#3a413e  --n-800:#242b28  --n-900:#131817
```

### Teal (primary — trust, action, clinician-authored)
```
--teal-50:#eaf5f2  --teal-100:#cfe8e2 --teal-200:#9dd2c6 --teal-300:#5fb3a0
--teal-400:#23947e --teal-500:#0b7a6b --teal-600:#06625a --teal-700:#054c47
--teal-800:#063735 --teal-900:#042322
```

### Gold (Kente — secondary, acquisition warmth)
```
--gold-50:#faf2e3 --gold-100:#f3e1bc --gold-200:#e9c884 --gold-300:#dcaa50
--gold-400:#c88a2b --gold-500:#a46f1f --gold-600:#7f5718 --gold-700:#5c3f11
```

### Iris (AI ACCENT — RESERVED EXCLUSIVELY FOR AI-AUTHORED CONTENT)
```
--iris-50:#f0edfb  --iris-100:#dfdaf7 --iris-200:#c3baef --iris-300:#9e92e3
--iris-400:#7e6fdc --iris-500:#6e5bd6 --iris-600:#5944b8 --iris-700:#433390
--iris-800:#2e2365
```
**Never use iris on human-authored UI surfaces.** Never use it as a "fun" accent. It is the visual contract that says *"this string came from an AI, and you should know it before you act on it."*

### Status dots (operator scheme — fixed across themes)
```
green  #10b981
amber  #f59e0b
red    #ef4444
gray   #9ca3af
```

### Semantic
```
success: #2a8a4a (light) / #34c777 (dark)
warning: #c28320 (light) / #f0a73a (dark)
danger:  #c8402f (light) / #f06351 (dark)
info:    #2b6cb0 (light) / #5b9bd9 (dark)
```

### Typography
- **Sans:** Manrope (400, 500, 600, 700, 800). Fallbacks: Inter, ui-sans-serif, system-ui.
- **Mono:** JetBrains Mono (400, 500, 600, 700). For all IDs, timestamps, code, numeric stats, paths, hashes, commit SHAs.
- **Body size:** 14px (operator-dense). Compact density drops to 13px.
- Type scale: `10 / 11 / 12 / 13 / 14 / 16 / 18 / 20 / 24 / 28 / 32 / 40 / 56`px.
- `font-feature-settings: "ss01","cv11","tnum"` everywhere — tabular numerics are required for the operator scan-readability.

### Spacing
4-pt scale: `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 96`. No 10px. No half-values.

### Radii
`xs:4 / sm:6 / md:10 / lg:14 / full:9999`. Inputs/chips=4. Buttons/small cards=6 or 8. Content cards/modals=10–14. Avatars/dots/pills=full.

### Borders
- 1px solid `--border-subtle` on structural dividers.
- 1.5px focus rings at 40% primary alpha + 2px offset.
- **2px iris left-border on every AI content block.** (See `.ai-band` / `.pr-card.ai`.)

### Shadows (cool-neutral, not pure black)
```
--shadow-1:  resting cards
--shadow-2:  hover/lifted cards
--shadow-3:  modals, sheets
--shadow-pop: full-screen takeovers, drawers
```
Dark theme shadows are pure-black tuned higher; light theme uses `rgba(10,30,40,...)` for cool-neutral cast.

### Motion
- Curve: `cubic-bezier(0.2, 0, 0, 1)` for everything.
- Durations: `120ms` (fast/hover), `180ms` (UI), `240ms` (layout), `320ms` (sheets/drawers).
- **No bounces. No springs.** Operator UI is honest about state changes.
- Fades over slides for status changes.
- AI "thinking" indicator = a shimmer on the iris left-accent only. Never blocks UI.

---

## Iconography — DO NOT SUBSTITUTE

`cockpit-icons.jsx` defines the icon set used throughout. Style:
- 1.5px stroke
- Round caps + joins
- 24×24 viewBox
- Default render at 16×16 (component sets this; CSS rules override per context: 14 in buttons, 16 in tb-iconbtn, 12 for `.spk` sparkle)
- Single color via `currentColor`

These are Lucide-aligned. If your codebase uses Lucide, you may import by name where the name matches. Where the icon is custom (`sparkle` / `ai-spark`, `cockpit`, `gate`, `queue`, `bot`, `branch`, `prMerge`, `prOpen`, `flow`, `block`), **use the exact SVG paths in `cockpit-icons.jsx`** — do not redraw or use a "similar" Lucide icon.

The **sparkle / `ai-spark`** glyph is the AI-attribution mark. It must appear before any AI-authored content string. Three-cue rule: color (iris) + glyph (sparkle) + label ("Telecheck AI" or agent name + sparkle).

---

## Component inventory

The prototype's components map 1:1 to what you should build. Component names and where they live:

### Shell (`cockpit-shell.jsx`)
- `Sparkline` — props: `data, color, ai, fill, height, width, smooth`. Generates a smooth quadratic-Bezier path + gradient fill + endpoint dot.
- `ProjectSwitcher` — sidebar dropdown.
- `Sidebar` — 224px fixed left nav.
- `Topbar` — 48px live ribbon, search, clock, refresh, bell, theme toggle.
- `PulseRibbon` — 24-bucket histogram with AI-authored overlay.
- `Drawer` — 480px right-side overlay with backdrop and Escape-to-close.
- `Modal` — centered with scrim, Escape-to-close, optional width.
- `AgentDot` — sized status indicator with halo glow.
- `AgentBadge` — dot + name + sparkle inline chip.

### Cockpit (`cockpit-screen-cockpit.jsx`)
- `MetricPilot, MetricThroughput, MetricQueues, MetricGates` — 4 hero metric cards. Each accepts a `variant` prop (`dense | hybrid | glance`) that changes the value font-size only.
- `BlockersCard, MilestonesCard, DecisionsCard, LiveEventsCard, AgentSnapshotRow` — middle/bottom row cards.
- `CockpitScreen` — orchestrates the layout per variant.

### Agents / Work / Spec (`cockpit-screens-2.jsx`)
- `AgentCard, AgentDrawer, AgentsScreen`
- `PrCard, WorkScreen`
- `SpecTree, SpecMain, SpecAside, SpecRatifyModal, SpecScreen`

### Inventory / Events / Chat / Settings / Mobile (`cockpit-screens-3.jsx`)
- `InventoryScreen`
- `EventLogScreen`
- `ChatScreen`
- `SettingsScreen` (5 tabs)
- `MobileScreen` → `MobileCockpit, MobileAgents, MobileChat`

### NOT to ship
- `tweaks-panel.jsx` — design-time control panel
- `ios-frame.jsx` — review-time iOS bezel (production mobile uses the real device viewport)

---

## State management

The prototype keeps state local (React `useState`). In production:

- **Realtime stream** (WebSocket) drives: agent heartbeats, event log, PR list updates, ratification queue updates, ribbon histogram bucket increments, project counts in sidebar.
- **Optimistic local rendering** on user actions (ratify, pause, restart, send chat) — fall back to authoritative server state if the WebSocket disagrees within ~2s.
- **Per-project state** — every screen scopes to the active project (selector in sidebar).
- **Cockpit variant** — persist user's preferred variant on the user profile, default to dense for new users.
- **Theme** — persist on user profile. Default dark.
- **Chat history** — persists per project as `human_orchestrator_dialogue` events on the canonical event log.

---

## Interactions & behavior

### Glance flow (most common)
Open cockpit → glance at hero metrics → close. Target time: <5 seconds. No clicks required to assess project health.

### Ratify flow
Notification → click → ratify modal opens with CR summary + Claude recommendation + Codex pass-1 + pass-2 side-by-side + diff preview → click Approve / Reject / Modify → modal closes, optimistic update on queue + event log → server confirms.

### Intervene flow
See stalled agent (red dot in sidebar count or agents grid) → click → drawer → Restart → confirm.

### Chat flow
Cmd-K or sidebar Chat → type or voice → orchestrator responds. Optionally `@agent` to reroute. Suggestion chips are clickable (and send immediately).

### Investigate flow
Cockpit anomaly → click drill-down → Event Log opens pre-filtered to source / time range → expand events for JSON detail.

### Cmd-K
Opens a search modal centered. Type-to-filter list of jump targets (queue, screens, agents, recent events). Esc closes.

### Hover / focus / disabled
- Hover: 4% darker overlay on element's own fill (never brighter). Use `color-mix` in CSS or pre-resolved tokens.
- Press: 8% darker + `scale(0.98)` on pressable buttons (not links, not rows). 80ms press, 160ms release.
- Focus: 1.5px ring + 2px offset, always visible for keyboard nav.
- Disabled: 40% opacity, background flattens to `--surface-2`. Stays in tab order with a tooltip explaining why.

---

## Voice & copy

- **Calm, warm, honest.** Status is honest — "approved" means approved.
- **Sentence case** everywhere (buttons, titles, nav, menus). No Title Case. ALL CAPS only on small-caps pill labels (`AI`, `URGENT`, `OTC`).
- **No emoji.** Cross-market reliability concern. Use icons.
- **No "I"** from the system. AI attributed as "Telecheck AI" or agent name. AI output is hedged where uncertain ("Likely…", "Based on your recent labs…").
- **Mono font for all IDs, timestamps, paths, line counts, commit SHAs** — anything that's a system-generated identifier or measurable scalar.
- **Operator copy is dense.** Don't pad with adjectives. The prototype's exact strings are the strings — see `cockpit-data.jsx` and the JSX files.

---

## Implementation guidance (Next.js + React + Tailwind + shadcn)

1. **Bootstrap the token system first.** Translate `cockpit.css` into:
   - `globals.css` with the full CSS variable block (root + `.theme-dark` + `.theme-light`)
   - A `tailwind.config.js` `theme.extend` that references those CSS variables (`primary: 'var(--primary)'`, etc.) so utility classes resolve correctly per theme
2. **Build shell first**, then screens in this order: Cockpit → Agents → Work → Event Log → Chat → Spec Corpus → Inventory → Settings → Mobile.
3. **shadcn/ui as primitives**, restyled. Buttons, dialog, dropdown-menu, tabs, table, scroll-area, command palette, popover, tooltip, sheet (use for the right-side Drawer). Do not accept shadcn's default Tailwind colors; rewire to the tokens.
4. **Sparklines:** the prototype's `Sparkline` is a smooth quadratic Bezier with a gradient fill. Keep that exact treatment. Don't sub in Recharts/Chart.js if it changes the visual.
5. **Kanban:** the columns are static (4 fixed statuses); cards within scroll independently. No drag-and-drop in v1 unless added later — cards are read-only "view in GitHub" links.
6. **Realtime:** drive via a single WebSocket connection multiplexing event types. Each screen subscribes to filtered slices via a React context or Zustand store.
7. **Speech:** Web Speech API for voice in/out. ElevenLabs voice output deferred to v1.1.
8. **Tests:** snapshot tests on every screen at the breakpoints + dark and light. Visual regression preferred (Chromatic, Playwright).

---

## Assets

- **Icons:** `cockpit-icons.jsx` — paths are inline SVG. No external asset files.
- **Fonts:** Manrope, Inter, JetBrains Mono — load via `next/font/google`.
- **Logo:** the prototype uses an inline placeholder SVG check-pulse mark in the sidebar's `.side-mark` div. **The real Telecheck wordmark / logo is not in this handoff.** Ask the user before shipping; until then, render the placeholder.
- **Photography:** none in the cockpit (operator surface, no marketing imagery).

---

## Accessibility checklist

- All interactive elements keyboard-reachable in DOM order
- Focus ring visible on every interactive element (1.5px ring + 2px offset, primary color at 40% alpha — never `outline: none` without replacement)
- ARIA labels on icon-only buttons (refresh, bell, theme toggle, drawer close)
- `role="dialog"` + `aria-modal="true"` on drawer and modal (the prototype sets these — keep them)
- Tables with proper `<th scope="col">`
- Sparklines need a text alt summary (e.g., `aria-label="7-day PR throughput: 9, 12, 8, 14, 17, 11, 18"`)
- Status dots are not sufficient alone — must be paired with text ("active", "stalled") for screen readers
- Color contrast: WCAG AA. Validate iris-on-dark and iris-on-light separately

---

## Deferred / not in this handoff

- ElevenLabs voice output (v1.1)
- Pharmacy portal UI kit (scoped out of v1 of the Telecheck design system)
- Real Telecheck logo + brand photography
- Drag-and-drop on the Kanban
- Inline event-log JSON editor (read-only for now)

---

## Open questions for the founder before shipping

(Leave these to the founder/ratifier — do not invent answers.)
- Should the cockpit variant be per-project or per-user?
- Does the founder want server-side rendering of the dashboard (Next.js app router) or strictly client-side with WebSocket hydration?
- What's the auth provider? (Brief mentions Supabase for RBAC — confirm same for cockpit.)
- Should the Mobile read-only view be a separate route at `/m/*` or device-detected at root?

---

## Final word

**Match the prototype exactly.** Every drift compounds. If a future redesign happens, it will happen as a new pass, not as silent re-interpretation during implementation. When you spot something you'd build differently — write it down, ship the design as-is, and propose it as a follow-up.
