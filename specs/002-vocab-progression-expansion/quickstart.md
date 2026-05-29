# Quickstart: Verifying Vocab Progression Expansion

End-to-end manual + automated checks to run after `/speckit-tasks` produces the task list and implementation lands. Use this as the smoke test before merging.

## Setup

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm dev          # http://localhost:5173
```

## Path A — Listen & Learn rotation (US-1)

1. Open the app, pick a profile (create one if first run).
2. Open the **Animals** set (31 words).
3. Tap **Listen & Learn**. Verify:
   - 10 word cards play.
   - At end of session, the indicator on Animals tile reads `10 of 31 heard`.
   - WordMap shows 1 star on each of the 10 just-heard animals (rest at 0).
4. Tap **Listen & Learn** again. Verify:
   - A different 10 animals play (animals 11–20).
   - Indicator advances to `20 of 31 heard`.
5. Repeat once more → `30 of 31 heard` + 9 of the next session's words are already-heard wrap-overlaps + 1 un-introduced.
6. One more session → `31 of 31 heard`. Verify the **Curious Ear** achievement banner fires at session end with mascot.
7. Refresh the page. Verify the indicator and star rows persist (Dexie storage check).

**Expected automated tests** (under `tests/integration/listen-and-learn-rotation.test.tsx`):
- Across 4 simulated session completions on Animals, the union of presented `word.id` values equals all 31.

## Path B — Per-word unlock (US-3)

1. From Path A's state (10+ animals introduced), tap **Recognize** on Animals.
2. Verify:
   - The button is no longer locked (legacy 50% threshold not yet met).
   - The session contains exactly the words that have cleared Listen & Learn — ordered by struggle-priority (all priority 1.0 initially, so JSON order within eligible).
   - Session length matches eligible pool (10 if 10 introduced, etc.).
3. Answer all 10 correctly. Verify:
   - Star rows update to 2 stars on the 10 words that just cleared Recognize.
   - Achievement banner does **not** fire (only `set_master` / `sharp_eye` for full-set milestones).

**Expected automated tests** (under `tests/integration/per-word-unlock.test.tsx`):
- Given progressMap with 10 stage-2 entries on Animals → Recognize button is enabled.
- Composed session contains exactly those 10 words.
- `selectDistractors` still draws from the full WordSet (FR-014 unchanged).

## Path C — Star row + Home progress tile (US-2, US-5)

1. After Paths A and B, return to Home.
2. Verify each WordSet tile shows aggregate progress (e.g., Animals shows roughly `30 / 124` for 30 first-stars + 10 second-stars).
3. Open an animal that has 2 stars on its card. Verify the star-row visual: ★★☆☆ (filled to filled, then outline outline).
4. Open the Settings → Parent Dashboard. Verify the legacy per-word table still renders (no regression).

## Path D — Achievements screen (US-4)

1. From Home, tap the Achievements icon (new entry-point near Settings).
2. Verify:
   - **First Listen** earned (earned date shown).
   - **Curious Ear (Animals)** earned if you completed Path A.
   - Locked achievements are grayed out with a one-line hint.
3. Trigger a second `Curious Ear` for a different set (e.g., Weather — only 5 words, one L&L session covers all) — verify only that set's banner fires; previously-earned `Curious Ear (Animals)` does not re-celebrate.

## Path E — Migration / back-fill (FR-013)

1. Before deploying the change, capture a Dexie export of an existing profile mid-progression (use Settings → Parent Dashboard → "Export" if present, or use `await db.wordProgress.toArray()` in DevTools).
2. After deploying:
   - Open the same profile.
   - Verify any word with `stage > 1` now shows `introducedAt != null` (DevTools: `await db.wordProgress.where('childId').equals('<id>').toArray()`).
   - Verify the star rows on those words match their stage (no perceived regression).

**Expected automated test** (`tests/integration/dexie-migration-v1-v2.test.ts`):
- Seed a v1 schema with 5 rows at varying stages, open the v2 DB, assert post-upgrade rows have `introducedAt` populated wherever stage > 1.

## Path F — Constitution gates

```bash
pnpm test         # unit + integration must pass
pnpm test:a11y    # axe-core must pass for AchievementsPage
pnpm typecheck    # tsc --noEmit must be clean
pnpm build        # PWA build must complete and emit service worker
```

Manual axe check using browser devtools is also fine.

## Rollback

If any path fails after deploy and a rollback is needed:
- Dexie data is forward-compatible (v2 fields are additive and optional) — downgrading the app code does **not** corrupt v2 data; the older code simply ignores the new fields.
- The rotation cursor table and achievements table become unused but harmless.
- Star rows revert to single ⭐ on mastered words (legacy WordMap rendering).
