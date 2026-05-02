# Patient app UI kit

Hi-fi mobile UI for the patient surface of Telecheck.

## Files
- `index.html` — runs the kit; four core screens as iOS device frames.
- `ios-frame.jsx` — device bezel + status bar primitives (starter component).
- `screens.jsx` — patient screens (`PAHome`, `PARefill`, `PAConsult`, `PARPM`) and shared bits (`Icon`, `AICard`, `StatusChip`, `TabBar`, `PASpark`).
- `patient.css` — local tokens + mobile classes, imports `../../colors_and_type.css`.

## Screens
1. **Home** — greeting, delegate banner ("You're also caring for Kojo"), today's refill status, AI lab interpretation card, vitals horizontal scroll, quick actions.
2. **Refill** — medication detail, AI safety check, delivery address, honest-status CTA ("Confirm & pay").
3. **Async consult intake** — one question per screen, AI safety reminder.
4. **RPM weekly check-in** — short question set, AI summary for the clinician.

## Disclaimers
- No product screenshots or codebase were provided. Content is reasoned from the PRD (§9, §12, §14, §15, §16).
- No real brand assets — logo placeholder, Google Fonts substitute typeface.
- Click-through is illustrative; tab bar and inline links are wired with React state, not real navigation.
