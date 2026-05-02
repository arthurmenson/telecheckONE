---
name: telecheck-design
description: Use this skill to generate well-branded interfaces and assets for Telecheck, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick facts about Telecheck
- AI-powered telehealth, pharmacy, and health-intelligence platform. Piloting in Ghana, global-first.
- Five user groups: patient, clinician, pharmacist, operator, delegate/family.
- Experience: **calm, not sterile**. **Premium but trustworthy, not luxury**. **Readable over decorative**.
- **AI content must be visually distinct from human content** — Iris accent + `ai-spark` glyph + "Telecheck AI" label. This is a hard UX rule (§12, §16), never optional.
- **Status is honest** — never show aspirational or softened statuses.
- **No emoji** in product UI.

## Files here
- `README.md` — the full system (tone, foundations, iconography).
- `colors_and_type.css` — all tokens; import before your own styles.
- `assets/` — logo placeholder, AI spark SVG.
- `preview/` — review cards for each aspect of the system.
- `ui_kits/patient_app/` — patient mobile UI kit (React).
- `ui_kits/clinician_console/` — clinician desktop UI kit (React).
