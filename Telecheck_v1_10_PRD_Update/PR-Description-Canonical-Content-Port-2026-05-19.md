# PR description (paste into GitHub web UI when opening the canonical content port PR)

**Branch:** `spec/canonical-content-port-si018-si017-supersessions-2026-05-19` → `main`
**Recommended merge style:** Squash-merge (10-commit chain → 1 commit on main)

---

## Title

```
spec: canonical content port — SI-018 + SI-017 + I-032 + P-018a/P-019a/P-021a supersessions (lockstep + R8 APPROVE)
```

## Body

Single lockstep PR-A2-class commit landing the canonical content port for Evans's 2026-05-19 specific per-item chat-message ratification of:

- **Cross-PR OQ3 Option A** (I-032 + tenant_guc_mismatch + STEP 0 on 4 SECURITY DEFINER procedures)
- **SI-017-OQ-MISMATCH A2+B2+C** (Sub-decision 4.5 + Cat A event + merge-blocking Test 7.X)
- **SI-018 partition rule** (two-tier hybrid P1 + P2)
- **SI-017** Phase 2 F-3 JWT session-liveness check
- **P-018a + P-019a + P-021a** supersessions with I-032 STEP 0

### Canonical artifacts amended

- INVARIANTS v5.2 → **v5.3** (I-032 added)
- AUDIT_EVENTS v5.3 → **v5.5** (SI-018 two-tier hybrid partition rule + 3 new action IDs)
- Promotion Ledger +5 entries (P-021a, P-019a, P-018a, P-027 SI-017, P-026 SI-018+I-032)
- Artifact Registry v2.12 → **v2.13**

### Codex pre-merge trail

8 rounds of iterate-to-asymptote prose-scrub closures (10 commits including lockstep base), 13 in-scope findings closed inline, **R8 APPROVE**. 1 self-caught hard-floor item 6 near-miss (platform-scope audit-chain partition tier attempt) reverted before commit a0c4835.

### Decision-of-record artifacts (on this branch)

- `Telecheck_v1_10_PRD_Update/Decision-Memo-Cross-PR-OQ3-Trust-Boundary-Equality-Guard-Option-A-Adopted-2026-05-19.md` (RATIFIED)
- `Telecheck_v1_10_PRD_Update/Decision-Memo-SI-017-OQ-MISMATCH-A2-B2-C-Adopted-2026-05-19.md` (RATIFIED)
- 4 Decision Briefs (SI-017, P-018a, P-019a, P-021a)
- SI-018 Decision Brief
- 6 PROPOSED-text supporting files

### Companion branches (open separately or sequence after this one)

| Branch | Purpose |
|---|---|
| `spec/oq3-decision-memo-and-cross-pr-resolution-2026-05-19` | Decision Memos (RATIFIED) — already in this branch as well; can close without merge |
| `spec/proposed-content-port-bundle-pre-ratification-2026-05-19` | PROPOSED bundle — files in this branch; can close without merge |
| `spec/cockpit-addendum-50-overnight-supersessions-2026-05-19` | Addendum 50 (overnight supersession authoring) |
| `spec/cockpit-addendum-51-si017-r2-stop-and-queue-2026-05-19` | Addendum 51 (SI-017 R2 STOP-and-queue + 2nd ratifier-decision item) |
| `spec/cockpit-addendum-52-proposed-content-port-bundle-2026-05-19` | Addendum 52 (PROPOSED bundle authored) |
| `spec/cockpit-addendum-53-canonical-content-port-landed-2026-05-19` | Addendum 53 (canonical content port landed + R8 APPROVE) — recommend merging AFTER this PR |

### Test plan

- [ ] Spot-check INVARIANTS I-032 text matches Decision Memo + procedure-amendments alignment
- [ ] Spot-check AUDIT_EVENTS §Hash chain §Partitioning two-tier hybrid + 3 new action IDs
- [ ] Spot-check Promotion Ledger 5 new entries with verbatim ratification quotes
- [ ] Spot-check Registry v2.13 + §2 Decision 1 + §3 inventory post-ceremony state
- [ ] Squash-merge the 10-commit chain to single commit on main

🤖 Generated with [Claude Code](https://claude.com/claude-code)
