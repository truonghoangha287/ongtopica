# Quickstart: Validate Math Foundations like a real child

This is the end-to-end path the integration tests automate (and a human can follow manually).

## Setup

```bash
pnpm install
pnpm exec tsx scripts/generate-math-data.ts   # (re)generate the 7 topic JSON files
pnpm dev                                       # open the app, pick a child profile
```

## Manual "play as a 6-year-old" path

1. **Home** → tap the **Math** subject tab. Only **Numbers** is unlocked; later topics show 🔒.
2. Tap **Numbers** → tap **Play**. A number prompt is spoken and shown.
3. Tap the correct numeral → confetti + happy chime + owl celebrates → **Next**.
4. Tap a wrong numeral once → gentle "try again", no red, owl encourages → tap correct → advance.
5. Finish 8 problems → celebration screen (with an achievement banner on the first correct ever).
6. Repeat Numbers until ≥ 50% mastered → return Home → **Counting** is now unlocked.
7. Tap a still-locked topic (e.g. Shapes) → its lock shakes and the prerequisite pulses (no dead-end).
8. Reload the browser → progress bars and unlocks are exactly as left (local persistence).

## Automated coverage (Vitest)

```bash
pnpm test:unit   # scorer, topic-progression, session-composer, achievement-evaluator
pnpm test:int    # one play-through per activity type + full session + unlock + migration
pnpm test:a11y   # axe on math screens
pnpm typecheck && pnpm lint
```

Key "real child" simulations:
- `math-session-playthrough.test.tsx`: renders a real `MathSessionPlayer` with a generated topic,
  taps correct answers through all problems, asserts the celebration screen appears and progress was
  recorded.
- `math-tap-number / count-objects / pick-next / tap-shape / odd-one-out`: each taps a wrong choice
  (gentle retry, no negative styling), then the correct one, asserting `onCorrect`/`onAdvance`.
- `math-topic-unlock.test.tsx`: with a progress map mastering ≥ 50% of Numbers, asserts Counting
  unlocks and Shapes stays locked.
- `dexie-migration-v2-v3.test.ts`: seeds v2 vocab progress, opens v3, asserts vocab rows intact and
  the `mathProgress` table exists.

## Done criteria (maps to Success Criteria)

- [ ] All 7 topics have ≥ 10 generated problems (SC-006).
- [ ] Every activity renderer has a passing play-through test (SC-002).
- [ ] Math screens: 0 axe violations (SC-003).
- [ ] Topics unlock strictly in order (SC-004).
- [ ] English vocab progress unchanged after migration (SC-005).
