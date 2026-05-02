# Clinician console UI kit

Desktop web app for the clinician review and decision flow.

## Files
- `index.html` — runs the kit as a single desktop window.
- `screens.jsx` — `Sidebar`, `Topbar`, `Queue`, `Detail`, `CSpark`.
- `clinician.css` — local styles, imports `../../colors_and_type.css`.

## What's in it
- **Sidebar** — dark surface, program navigation, badge counters, clinician identity.
- **Top bar** — search placeholder, locale/market indicator (Ghana · Live).
- **Queue** — filterable list; every item shows severity signals and an AI tag where the engine produced output.
- **Detail (decision canvas)** — patient header with chips and delegate attribution; AI assessment panel (Iris accent + spark + source rationale); requested prescription; active medications; interaction signals from the Medication Interaction Engine (§10 Pillar 5); action bar with approve / block / send-to-pharmacist.
- **Emergency banner** is present at the top of the canvas even when no emergency is reported, honoring §13's override precedence.

## Disclaimers
No codebase or Figma was provided. Layout and component choices are derived from the PRD's clinician jobs-to-be-done (§7, §8) and the AI / audit rules (§12, §15). Dimensions and density are reasonable defaults; a real pilot would refine them against clinician task-time data.
