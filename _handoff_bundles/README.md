# Track-4 app bundles — interim backup

These two apps are **not yet on GitHub** (no remote at handoff time). Each
`.bundle` is a **complete git repository with full history** in a single file —
a portable safety net so the code is not stranded on one machine.

Contents:
- `telecheck-patient-app.bundle` — Expo/React Native patient app
- `telecheck-clinician-console.bundle` — Vite/React clinician console

## Restore a bundle to a working clone

```
git clone telecheck-patient-app.bundle telecheck-patient-app
git clone telecheck-clinician-console.bundle telecheck-clinician-console
```

## Push to a real remote once the operator creates the GitHub repos

```
cd telecheck-patient-app
git remote set-url origin <new-github-url>   # or: git remote add origin <url>
git push -u origin main

cd ../telecheck-clinician-console
git remote set-url origin <new-github-url>
git push -u origin main
```

After both are pushed, delete this folder — GitHub becomes the source of truth.
These bundles carry NO secrets (the apps have no `.env`; they run mock-first).

*Regenerate anytime with:* `git -C <app> bundle create <app>.bundle --all`
