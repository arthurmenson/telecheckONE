# Telecheck Design System

A design language for **Telecheck** — an AI-powered telehealth, pharmacy, and health-intelligence platform. Piloting in Ghana, designed global-first.

---

## What Telecheck is

Telecheck unifies five pillars patients and clinicians normally have to stitch together themselves:

1. **Telehealth care delivery** — sync + async consults, structured intake, follow-up.
2. **AI clinical support** — the "second brain" reading across labs, medications, conditions, food, fitness, symptoms, and history.
3. **Pharmacy & prescription commerce** — approval, dispensing, refills, delivery.
4. **Remote patient monitoring / chronic care** (RPM / CCM) — subscription-based in emerging markets.
5. **Advanced health intelligence** — medication interaction engine, herb–drug engine (v1.5), lab interpretation, food/fitness/pregnancy tracking, fake-medication detection, AI second opinion.

The tagline, per the PRD: *a smart digital healthcare platform that combines telemedicine, pharmacy, labs, monitoring, and AI into one system.*

## Who it's for

Five user groups — each has its own surface language but the system must feel like one product:

- **Patient** — calm, legible, reassuring. Primary mobile-first surface.
- **Clinician** — dense, auditable, time-pressured. Desktop.
- **Pharmacist / pharmacy operator** — queue-driven, workflow-heavy. Desktop.
- **Operator / admin** — oversight + compliance dashboards.
- **Family member / delegated caregiver** — same surfaces as patient, with visible "acting on behalf of" context everywhere.

## Products in this system

The core surfaces we recreate as UI kits:

- **Patient mobile app** — intake, refill, consult, labs, RPM check-ins, food/fitness/pregnancy tracking.
- **Clinician console** — web app for async queue, consult room, prescription decisions with AI interaction signals.
- **Pharmacy portal** — web app for dispense queue, refill logic, delivery handoff. (Scoped as a lighter kit in v1 of this design system.)

## Sources provided

- `uploads/Telecheck_Master_Platform_PRD_v1.2.md` — the master Platform PRD, v1.2 (draft for review).

No codebase, Figma files, logos, or visual assets were provided. The visual language in this design system is **derived from the PRD's experience principles (§16)** and inferred from the product thesis — not copied from an existing brand.

> **Ask to iterate:** if you have a logo, Figma, or any brand asset, please attach it — the current visuals are a reasoned first draft, not a reproduction.

---

## Content fundamentals

_(See CONTENT FUNDAMENTALS below.)_

## Visual foundations

_(See VISUAL FOUNDATIONS below.)_

## Iconography

_(See ICONOGRAPHY below.)_

---

## CONTENT FUNDAMENTALS

The PRD is unusually explicit about tone, so the system follows it closely.

### Voice
- **Calm, warm, honest.** Never sterile, never marketing-slick. "Premium but trustworthy, not luxury."
- **Status is honest** (§15). "Your prescription is approved" means approved. We never soften, hedge, or fake progress. If we don't know, we say so.
- **Clinical terms are explained** when they appear in patient-facing copy. Literacy-aware.
- **AI speaks differently from humans.** AI-authored copy is labeled, hedged where uncertain ("Likely…", "Based on your recent labs…"), and visually distinct.

### Person & address
- **Patient-facing:** second person. *"Your refill is ready for clinician review."* Never "the patient."
- **Clinician-facing:** third person about the patient. *"Ama requested a refill of metformin 500 mg."*
- **Delegate-facing:** explicit framing. *"You're acting for Kojo. Kojo will see this action in his record."*
- **System never uses "I."** No chat-persona. AI outputs are attributed ("Telecheck AI") or framed as analysis ("Interaction check found…").

### Casing
- **Sentence case** everywhere — buttons, titles, nav, menus. No Title Case, no ALL CAPS except small-caps badge labels (e.g. `AI`, `URGENT`, `OTC`).
- Medication names follow medical convention: generic lowercase (metformin), brand capitalized (Ozempic).

### Emoji
- **Not used** in product UI. They'd undercut the clinical tone and read differently across cultures in emerging markets. Use iconography instead.
- Acquisition modules (food, fitness, pregnancy) may use a slightly warmer illustration treatment, but still no emoji.

### Length & density
- **Short, ranked AI output** (§9, Calm intelligence). Bullets over paragraphs. One screen, one decision.
- Clinicians get denser surfaces; patients get one thing per screen wherever possible.

### Safety & emergency language
- Emergency copy is **direct, imperative, unambiguous** — not softened. *"Call emergency services now."*
- Never "please" in safety-critical copy.
- Never reversible-looking language for irreversible actions. "Submit prescription" not "Send for review" if the action commits.

### Examples

**Good — patient, calm, honest status**
> Your refill is with Dr. Mensah for review. You'll get a notification when it's approved — usually within 4 hours during clinic hours.

**Good — AI output, hedged, ranked, sourced**
> **Telecheck AI — lab interpretation**
> Your HbA1c is 7.8% — slightly above your target of 7.0%. Your clinician will review this before it reaches you.
> *Based on: labs from 14 Apr, your diabetes program, and last three readings.*

**Good — clinician, dense, auditable**
> Ama K. · refill · metformin 500 mg BID · last dispensed 22 Mar · 3 interaction signals · 1 drug–lab (eGFR 52)

**Good — delegate framing**
> You're acting for Kojo Owusu. Kojo will see this refill request in his account with your name attached.

**Avoid**
> Hey! 👋 We've got some news about your meds! — too casual, emoji, not honest about what the news is.
> Your results look great! — premature/aspirational status before clinician review.
> The system believes you may wish to consider… — hedge-slop, passive voice.

---

## VISUAL FOUNDATIONS

### Palette philosophy
A health-tech palette that reads **clinical but warm**, designed for emerging-market contexts where screen glare and low-cost displays are common (high contrast matters, pure whites are fine, thin pastel tints are not).

- **Neutrals** carry most of the UI. Warm-leaning grays (tinted slightly toward green/teal, not blue) so the system doesn't feel cold or corporate-tech.
- **Primary — Telecheck Teal** (`#0B7A6B`). Signals trust, care, action. Used for primary CTAs, active states, clinician-authored annotations, and the logo.
- **Secondary — Kente Gold** (`#C88A2B`). A nod to the Ghana pilot's visual heritage without being literal. Used sparingly for secondary actions, highlights, and acquisition-module accents.
- **AI accent — Iris** (`#6E5BD6`). A calm violet reserved exclusively for AI-authored content. This is the enforcement of §12: AI is visually distinct from human output, always. Iris never appears on human-authored surfaces.
- **Semantic colors** — success green, warning amber, danger red, info blue. Desaturated, WCAG AA against both white and the dark clinician surface.

### AI / human distinction
Non-negotiable per PRD §12. Three reinforcing cues (never color alone — PRD §16):
1. **Color** — Iris accent + left-edge indicator on AI content blocks.
2. **Icon** — a consistent `ai-spark` glyph preceding any AI-generated string.
3. **Label** — always the words "Telecheck AI" on first reveal of an AI block, plus a source-rationale disclosure.

### Typography
- **Display + UI: Manrope** — a warm, modern geometric sans with a slightly rounded terminal. Feels clinical without being cold. Good legibility at small sizes. _Substitution note: Manrope is a reasonable first choice; replace if the brand has a licensed face._
- **Body long-form: Source Serif 4** — used sparingly, for patient-facing educational content and consent documents where reading comfort matters.
- **Mono (audit artifacts, IDs, code, lab values): JetBrains Mono.**
- **Weights used:** 400 (body), 500 (UI emphasis), 600 (titles), 700 (display only).

**→ These are Google Fonts substitutions. Flag: if Telecheck has a licensed brand typeface, swap it in.**

### Type scale
A modular 1.200 scale, rounded to nice pixel values. Defined as CSS vars in `colors_and_type.css`.

### Spacing
A 4-pt base scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 96. No half-values. No 10px.

### Layout rules
- **Patient mobile:** single-column, 16 px gutters, 24 px safe-zone top/bottom, one primary action per screen.
- **Clinician desktop:** 12-col grid, 80 px sidebar, 1200 px max content. Dense tables honor a 40 px row height.
- **Status bars and alerts are fixed to the top** of the surface, above content. Emergency banners (§13) always outrank normal chrome.

### Corner radii
- 4 px — inputs, chips.
- 8 px — buttons, small cards.
- 12 px — content cards, modals.
- 20 px — mobile sheet containers.
- Full (9999 px) — avatars, status dots, AI attribution badges.

### Borders
- 1 px solid on structural dividers (`--border-subtle`).
- 1.5 px on focus rings — always using `--primary` at 40% alpha + a solid inner 2 px offset.
- 2 px left accent on AI content blocks in the Iris color.

### Shadows (elevation system)
- **E0** — flat, borders only.
- **E1** — `0 1px 2px rgba(10,30,40,0.06)` — resting cards.
- **E2** — `0 4px 12px rgba(10,30,40,0.08)` — hover / lifted cards.
- **E3** — `0 12px 32px rgba(10,30,40,0.12)` — modals, sheets.
- **E4** — `0 24px 64px rgba(10,30,40,0.18)` — full-screen takeovers, emergency cards.
- **Inner** — `inset 0 1px 0 rgba(255,255,255,0.6)` on primary buttons for a subtle top-highlight.

Shadows are cool-neutral (not pure black) to sit well on warm neutrals.

### Backgrounds & imagery
- Surfaces are **solid, matte, confident.** No gradient-washed hero backgrounds.
- Acquisition modules (food/fitness/pregnancy) allow soft **two-stop gradients** in Kente Gold or muted teal, only as full-bleed section backgrounds — never behind text.
- **Photography** skews warm, natural-light, documentary. Real Ghanaian contexts preferred for the pilot (clinics, homes, markets). No stock-medical blue-gloved-hands clichés.
- **No hand-drawn illustrations** in clinical surfaces. The acquisition modules may use light editorial illustration with a consistent thin-line + flat-fill style; always flagged as illustration, never as clinical imagery.
- **Grain/texture:** none in clinical UI. Subtle paper texture (1–2% noise) is OK on marketing surfaces only.

### Animation & motion
- **Restrained.** `cubic-bezier(0.2, 0, 0, 1)` is the house curve for almost everything. 180 ms for UI transitions, 240 ms for layout, 320 ms for sheets.
- **No bounces, no springs** on clinical surfaces. A bounce on a prescription approval reads as frivolous.
- **Fades over slides** for status changes — status changes are honest events, they shouldn't feel magical.
- **Loading:** a 3-dot pulse in the primary color or an indeterminate linear track. No full-screen spinners longer than 400 ms without a label.
- **AI "thinking":** a shimmer on the Iris left-accent only. Never blocks the UI.

### Hover / press states
- **Hover:** 4% overlay darker on the element's own fill (`color-mix` in CSS). Never brighten — health UIs shouldn't glow.
- **Press:** 8% overlay darker + scale(0.98) on pressable buttons only (not links, not rows). 80 ms press, 160 ms release.
- **Focus:** 1.5 px ring + 2 px offset, always visible for keyboard nav (WCAG AA, §16).
- **Disabled:** 40% opacity on text + foreground icon; background flattens to `--surface-2`. Never fully removed from tab order — always has a tooltip explaining why.

### Cards
Three card tiers:
1. **Flat card** — 1 px border, 0 shadow, radius 12. Default for list items.
2. **Lifted card** — E1 shadow, no border, radius 12. Default for standalone content.
3. **Focus card** — E2 shadow, 1 px border in primary at 20% alpha, radius 12. For the "what you should look at next" card.

### Transparency & blur
- **Used sparingly.** Bottom sheets on mobile use a 90% opaque surface over an 8 px backdrop blur of dimmed content.
- Clinician console uses no blur — dense surfaces need to stay crisp.
- Emergency banners are **never translucent.** Honest status means opaque status.

### Protection gradients vs capsules
- **Capsules** (pill-shaped containers) for metadata: status, severity, category, relationship type.
- **Protection gradients** only where content sits over imagery (rare — acquisition hero sections). Use a neutral-dark gradient with opacity, never the brand color.

### Borders for AI content
Every AI content block carries a 2 px Iris left-accent + the `ai-spark` glyph + the "Telecheck AI" label on first reveal. Three-cue rule.

---

## ICONOGRAPHY

### Approach
- **Line icons, 1.5 px stroke, round joins, round caps.** Warm, non-corporate, readable at 16 px. Matches the Manrope typeface's character.
- **20 px default size** in UI, 16 px inline with text, 24 px on mobile primary nav, 32 px+ on feature cards.
- Never fill-only; always outlined unless paired with a filled badge (e.g. notification indicator).
- **No emoji** anywhere in product UI. Not a style choice — a cross-market reliability choice.
- **No unicode glyphs as icons** (no `►`, `✓`, `★`). We use real icons.

### Icon set
We use **[Lucide](https://lucide.dev)** (the fork/successor of Feather) via CDN. Matches our line-weight and stroke-cap preferences exactly.

> **Flag:** this is a substitution. Telecheck may eventually want a custom icon set — especially for clinical glyphs (pill shapes, anatomy, lab vials) that Lucide doesn't carry with enough specificity. Lucide is a strong starting point; custom additions will slot in alongside.

### Custom icons
One custom icon is defined in-brand and lives in `assets/icons/`:
- **`ai-spark.svg`** — the Telecheck AI attribution glyph. A 4-point sparkle with an offset dot, 1.5 px stroke, Iris color. Used anywhere AI-authored content appears (§12, §16).

### Logo
Telecheck does not have a logo provided. A wordmark placeholder in Manrope 700 with a **teal circular "check + pulse"** mark sits in `assets/logo/`. **This is a placeholder and should be replaced with the real brand mark.**

### Imagery (beyond icons)
No photography was provided. Placeholders are clearly labeled in the UI kits. Do not ship to customers with placeholders.

---

## Index

Root files:
- `README.md` — this file.
- `SKILL.md` — Agent Skill front-matter, makes this directory usable as a Claude Code skill.
- `colors_and_type.css` — CSS variables (base + semantic) for color, type, spacing, radii, shadows.

Folders:
- `assets/` — logo placeholder, `ai-spark` icon, and a `README.md` pointing at Lucide for the rest.
- `fonts/` — font loading notes; Manrope, Source Serif 4, JetBrains Mono all via Google Fonts.
- `preview/` — the Design System review cards (colors, type, spacing, components, brand).
- `ui_kits/patient_app/` — patient mobile-app UI kit: intake, refill, consult, labs, RPM, acquisition.
- `ui_kits/clinician_console/` — clinician web console UI kit: queue, consult, prescription decision with AI signals.

Not included (and should be added when available):
- Real logo files
- Real brand photography
- Pharmacy portal UI kit (can be scaffolded next pass — scoped out of v1 of this design system)
- Slide template (no deck was provided, so none created)
