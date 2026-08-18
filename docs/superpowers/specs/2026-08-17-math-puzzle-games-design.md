# Math Puzzle Games — Design

**Date:** 2026-08-17
**Status:** Approved, ready for planning

## Summary

Math World gains a third pillar, **Puzzles**, alongside the Skills Hive and the Bee
Olympiad. It holds four tap-to-solve games:

| Card | Id | Ops | Badge |
| --- | --- | --- | --- |
| Honey Pyramid | `pyramid` | `+` `−` | — |
| Number Chain | `chain` | `+` `−` | — |
| Times Pyramid | `pyramid-x` | `×` `÷` | 7+ |
| Times Chain | `chain-x` | `×` `÷` | 7+ |

A pyramid brick is the sum (or product) of the two bricks below it. A chain runs a
start number through a series of steps. The child fills blanks by tapping a blank
and then tapping a number tile from a tray.

Everything today in Math World is a four-option multiple-choice question
(`QuizQuestion` in `src/math/types/math.types.ts`). These puzzles are a different
interaction, so they get their own engine rather than being forced into the quiz
one.

## Decisions

Recorded because each one closed off alternatives that will look tempting again
later.

1. **A third hub pillar, not new question types inside the topic journeys.** The
   quiz engine, store, and bank generator all assume one prompt and four options.
   Teaching them a second, structural question shape would complicate the code
   path every existing question travels through.
2. **Tap-a-blank, tap-a-tile input.** Not drag-and-drop: small fingers miss small
   targets and it needs a keyboard fallback anyway. Not a keypad: too hard for a
   six-year-old. Not four options per blank: that is a quiz wearing a pyramid
   costume.
3. **`%` in the original request means division `÷`**, not percentage and not
   modulo.
4. **Four separate cards**, one per game-and-operation-family, rather than one
   card whose ladder silently turns into multiplication.
5. **The `×`/`÷` cards are always open, badged 7+.** No unlock threshold. An older
   sibling should not have to grind addition pyramids first, and a six-year-old
   who wanders in simply finds it hard and leaves. No new unlock state to store.
6. **Fill every blank, then Check.** Instant per-tile feedback turns a small tray
   into tap-every-tile-until-one-sticks, and the child never has to actually add.
7. **Five puzzles per run, level shown on the card.** No per-game journey page —
   the card carries "Level 4 of 12" and a progress bar. Puzzles are slower than
   MCQs, so five is roughly one twenty-question hive.
8. **Runtime seeded generators, no pre-generated JSON banks.** This diverges from
   the quiz banks (`scripts/generate-math-data.ts`) deliberately — see below.

### Why generators and not banks

The quiz banks exist because a hand-tuned distractor set cannot be verified by
construction; it has to be reviewed. A pyramid can: build it bottom-up from real
numbers and then blank cells out, and an inconsistent puzzle is not
representable. Given that, a bank would cost ~960 nested objects shipped to every
client, and would hand a child replaying level 3 the same twenty pyramids
forever.

The Grammar track already proves the pattern in this repo —
`buildItem(rule, rng)` in `src/english/grammar/services/games/index.ts`.

Note for future readers: the standing rule "math data is generated — edit the
generator script, not the JSON" applies to the *quiz banks*. Puzzles have no
bank.

## Game design

```
        [ ? ]                 7  →  +3  →  ? →  −4  →  ?
      [ 5 ] [ ? ]
    [ 2 ] [ 3 ] [ 4 ]
```

Generation is always: build a valid board from real numbers, then blank cells
out. **Where you blank chooses the operation.** A blank above known bricks needs
addition; a blank in the base, under a known parent, needs subtraction. Same for
the `×`/`÷` pair. That is how `−` and `÷` arrive without a second generator.

**Only numbers are ever blanked.** A chain's operators are always visible; there
is no "guess the operator" variant.

Blanks must be **uniquely determined**. `solver.ts` propagates known cells —
parent from two children, child from parent and sibling — until nothing more
resolves. A blank set that does not fully resolve is rejected and another drawn.

### The ladder

Twelve bands per game, matching the existing `TOPIC_LEVEL_COUNT`.

| Game | Bands 1–4 | Bands 5–8 | Bands 9–12 |
| --- | --- | --- | --- |
| Pyramid | 3 rows, base 1–5, 1 blank, addition only | 3 rows, base 1–9, 2 blanks; base blanks bring subtraction | 4 rows, base 1–9, 2–3 blanks mixed across rows |
| Chain | 2 steps, values ≤ 10, final result blank | 3 steps, ≤ 20, an intermediate result or an operand blank | 4 steps, ≤ 50, 2 blanks including the start (work backwards) |
| Times Pyramid | 3 rows, base 1–3, 1 blank, `×` only | 3 rows, base 1–5, base blank brings `÷` | 3 rows, base 1–5, 2 blanks |
| Times Chain | 2 steps, `×` only, operands 2–5 | 3 steps, `×` and `÷` | 4 steps, operands 2–9, 2 blanks |

Two guards:

- **The Times Pyramid stays at three rows at every band.** A four-row `×` pyramid
  reaches six figures. Any board whose apex exceeds `MAX_TIMES_PYRAMID_APEX` is
  rejected and regenerated.
- **Chains never produce a negative or fractional intermediate.** A `÷` step is
  only ever chosen by a factor the running value actually has. The per-band
  ceilings in the table above govern `chain`; `MAX_CHAIN_VALUE` is the backstop
  for `chain-x`, whose values are not otherwise bounded by its band spec.

The tray holds one tile per blank plus `PUZZLE_TRAY_DISTRACTORS` near-miss
distractors, shuffled. It is a multiset — two blanks sharing a value get two
tiles — and the distractors are drawn distinct from each other and from every
answer value, so the tray size always equals `blanks + PUZZLE_TRAY_DISTRACTORS`.

A tile's **identity** for placement and for the used/disabled state is its tray
index; its **correctness** is its label compared against the cell's value. The two
differ only when duplicate values exist, and keeping them separate is what makes
duplicates work.

## Architecture

### New files

```
src/math/types/puzzle.types.ts        PuzzleGameId, PuzzleCell, PyramidPuzzle,
                                      ChainPuzzle, Puzzle, PuzzleGame
src/math/services/puzzles/pyramid.ts  buildPyramid(band, rng) — both + and ×
src/math/services/puzzles/chain.ts    buildChain(band, rng)   — both +/− and ×/÷
src/math/services/puzzles/solver.ts   resolves a blank set; rejects non-unique ones
src/math/services/puzzles/index.ts    PUZZLE_GAMES registry + getPuzzleGame(id)
src/math/store/math-puzzle-store.ts   one run's transient state
src/math/pages/PuzzlePage.tsx         the run engine
src/math/components/PuzzleShelf.tsx   the third pillar — four cards
src/math/components/PyramidBoard.tsx  presentational
src/math/components/ChainBoard.tsx    presentational
src/math/components/TileTray.tsx      presentational
```

### Touched files

- `src/math/components/MathHub.tsx` — third pillar tab
- `src/App.tsx` — route `/math/puzzle/:gameId`
- `src/shared/db/db.ts` — schema v6
- `src/math/hooks/useMathProgress.ts` — puzzle progress + economy
- `src/math/constants/math-constants.ts` — new constants
- `src/locales/en/math.json` — a `puzzles.*` block

### The engine ↔ board boundary

`PuzzlePage` asks the registry for a game, builds `PUZZLES_PER_RUN` puzzles at the
child's band, and dispatches on `board.kind` to render a board. It owns hearts,
checking, scoring, and the reward screen, and knows nothing about pyramids.

Boards receive `(board, placements, graded)` and render buttons. They know nothing
about runs, hearts, or scoring.

Adding a fifth puzzle game later is one generator plus one board component, with
no engine change.

`PuzzlePage` reuses the hive quiz chrome wholesale: the ✕/progress/hearts top bar,
`BeeMascot`, the Check→Continue primary button, `MathRewardScreen`, the game-over
screen, and `computeStars`/`computeAccuracy` from
`src/math/services/quiz-scorer.ts` — those take `(correctCount, total)` and do not
care what a question was.

### Folded-in refactor

`src/english/grammar/services/rng.ts` is `makeRng` / `pickFrom` / `shuffle`, a
seeded-RNG utility with nothing grammar-specific in it, and the puzzle generators
need exactly it. Move it to `src/shared/utils/rng.ts` and update its nine
importers rather than let the third subject make a third copy.

### New constants

All in `math-constants.ts`, per the no-magic-numbers rule. Band count reuses the
existing `TOPIC_LEVEL_COUNT`.

| Constant | Value | Why |
| --- | --- | --- |
| `PUZZLES_PER_RUN` | 5 | Roughly one twenty-question hive in wall-clock time |
| `PUZZLE_TRAY_DISTRACTORS` | 3 | Matches the four-option feel of the quiz |
| `PUZZLE_MAX_RETRIES` | 1 | Same retry budget vocab already uses |
| `MAX_TIMES_PYRAMID_APEX` | 400 | A 1–5 base can reach 625; 400 trims the worst without starving the generator |
| `MAX_CHAIN_VALUE` | 200 | Keeps `chain-x` intermediates readable for a seven-year-old |
| `PUZZLE_BUILD_ATTEMPTS` | 50 | Rejection-sampling bound before the band-1 fallback |

## Data flow and persistence

Dexie goes to **v6** with one additive table — no data motion, exactly like the
v3/v4/v5 upgrades:

```
mathPuzzleProgress: 'id, childId, [childId+gameId]'
  { id: `${childId}:${gameId}`, childId, gameId, level, stars, updatedAt }
```

`{stars, level}` is structurally identical to `TopicProgress`, so **`mergeHiveResult`
is reused as-is**: best-ever stars are kept (a weak replay never lowers a rating)
and the level cursor advances by one. There is no per-level results table — the
card shows level and best stars, and a journey view can add one if it is ever
wanted.

`useMathProgress` gains `getPuzzleProgress()` and `recordPuzzleCleared(gameId,
stars)`. The latter calls the existing private `awardEconomy()`, so a puzzle run
pays the same `HONEY_PER_HIVE`, feeds the same streak, and fills the same
daily-goal ring as a hive. One economy, one place.

### A run

1. Puzzles tab → `PuzzleShelf` loads progress → four cards with level and stars.
   The card reads "Level N of 12" with N clamped to `TOPIC_LEVEL_COUNT`, so a
   child past the top of the ladder sees "Level 12 of 12" rather than "Level 15".
2. Tap → `/math/puzzle/pyramid`.
3. `PuzzlePage` reads the level, sets `band = min(level, TOPIC_LEVEL_COUNT)`, and
   builds `PUZZLES_PER_RUN` puzzles.
4. Placements live in the store as `Record<cellId, string>` — tap a blank to
   focus, tap a tile to fill, tap a filled blank to take it back.
5. Check grades all blanks; hearts and `correctCount` update; retry or advance.
6. After the fifth, `recordPuzzleCleared` → `MathRewardScreen`.

### Seeding

The run seed is `Date.now()`, not a function of `(gameId, band)`. Seeding by band
would hand the child the identical five pyramids on every replay — the exact
staleness that made runtime generation the better choice. Determinism lives one
level down: the generators are pure `(band, rng)` functions and the unit tests
pin them with fixed seeds.

Side effect worth keeping: the hive runs dry at level 12 because a band holds only
twenty questions, but a puzzle game at level 12 keeps serving fresh puzzles at
band 12 indefinitely.

## Feedback and grading

Check is disabled until every blank is filled — the same dimmed primary button the
quiz uses when nothing is selected.

**First Check**

- All right → `playWin`, mascot celebrates, the puzzle counts toward
  `correctCount`, button becomes Continue.
- Anything wrong → `playBuzz`, **one heart**, wrong bricks glow amber and their
  tiles return to the tray; correct bricks stay filled and lock. One retry.

**Retry Check**

- Right → gentle celebration and advance, but it does **not** count toward stars,
  and no second heart is taken.
- Wrong → the answers fill themselves in, encouraging message, Continue. Still no
  second heart.

Each counter therefore means exactly one thing: **hearts = puzzles not solved
first try** (at most one per puzzle), **stars = first-try accuracy over the five**.
Both feed the existing `nextHearts` and `computeStars` untouched. Three hearts
across five puzzles is gentler than the hive's three across twenty.

Running out of hearts drops to the same game-over screen the hive uses, with
nothing recorded.

## Edge cases

- **Generator cannot find a uniquely-solvable blank set** within
  `PUZZLE_BUILD_ATTEMPTS` → fall back to that game's band-1 spec rather than
  throw. A child never sees a broken or ambiguous board.
- **Unknown `gameId`** in the URL → the same not-found treatment `MathQuizPage`
  gives an unknown topic.
- **No active profile** → `useMathProgress` already returns defaults; the run
  plays at band 1 and records nothing. Existing behaviour, no new branch.
- **Two blanks with the same answer** → a tile is identified by its tray index,
  not its label, so two `6` tiles are distinct and both placeable.
- **Tapping a filled blank** returns its tile to the tray; used tiles render
  disabled.

## Accessibility

Every blank and every tile is a real `<button>`, so keyboard and screen-reader
support falls out of the markup rather than being retrofitted.

- Blanks are labelled positionally: "empty brick, row 2, position 1" becomes
  "brick, row 2, position 1, holds 8". Chain boxes read as "empty box after plus
  three".
- A `role="status"` region — the quiz already has one — announces each placement
  and each grading result.
- Amber is not load-bearing: wrong cells carry a marker and say "wrong" in their
  label, so the feedback survives colour-blindness.

All strings go through the new `puzzles.*` block in `src/locales/en/math.json`.

## Testing

The generators carry the risk — a subtly ambiguous pyramid or a chain landing on
7.5 is invisible in review and obvious to a frustrated child. Tests are written
first, in the order `solver → generators → store → engine → UI`.

**Unit — `solver.ts`.** A fully-known pyramid resolves; an under-determined blank
set is rejected; a uniquely-determined one is accepted; the
child-from-parent-and-sibling path has its own cases (it is the
subtraction/division branch).

**Unit — `pyramid.ts`**, across all twelve bands and many seeds, as property
checks:

- every non-blank relationship holds — `parent === a op b`
- the blank set is uniquely solvable, fed through the real solver
- row count, blank count, and base range match the band spec
- the `×` pyramid never exceeds `MAX_TIMES_PYRAMID_APEX` and never grows past
  three rows
- the tray holds one tile per blank plus exactly `PUZZLE_TRAY_DISTRACTORS`

**Unit — `chain.ts`**, same shape: every step's result is consistent, no negative
and no fractional intermediate ever, `÷` only by a factor the running value
actually has, values inside `MAX_CHAIN_VALUE`, step and blank counts per band.

**Unit — determinism and variety.** Same seed produces an identical puzzle. A
hundred different seeds at one band produce overwhelmingly distinct puzzles — this
is the test that catches a generator quietly collapsing onto one shape.

**Unit — `math-puzzle-store`.** Place, take back, grade, retry, heart accounting.

**Integration** (`fake-indexeddb` is already a dev dependency):

- a clean run of five through `PuzzlePage` — fill from the tray, Check, reach the
  reward screen, assert `mathPuzzleProgress.level` advanced and honey/streak moved
- a wrong-then-retry-right run: heart lost, star credit withheld
- hearts to zero: game-over, nothing written
- the hub: four cards, the two `×`/`÷` ones badged 7+, navigation lands correctly

**a11y:** `vitest-axe` on the puzzle page mid-run, with tiles placed.

Deliberately not tested: the exact content of any particular puzzle beyond the
seeded-determinism case. Pinning "band 4 seed 7 is this pyramid" would break on
every generator tweak while proving nothing the property checks do not already
cover.

## Delivery order

One feature, but it lands in two halves so the risky half is proven before the
easy half is duplicated:

1. **Shared spine plus the two `+`/`−` games.** The rng move, types, `solver.ts`,
   `pyramid.ts` and `chain.ts` at their `+`/`−` bands, the store, `PuzzlePage`,
   both boards, `TileTray`, the Dexie v6 table, `useMathProgress`, the Puzzles tab
   with two cards, and the full test suite.
2. **The two `×`/`÷` games.** New band specs inside the same two generators, the
   apex guard, the whole-number `÷` rule, and two more cards with the 7+ badge. No
   new components — if this step needs one, the boundary in step 1 was drawn
   wrong.

## Out of scope

Named because each was considered and set aside, not overlooked:

- Percentage and modulo puzzles — `%` in the original request meant `÷`.
- Pre-generated puzzle JSON banks.
- A per-game journey page like `TopicJourneyPage`.
- A per-level results table for puzzles.
- A parent-set age or difficulty tier, and any new field on `childProfiles`.
- Any change to the existing quiz engine, banks, or `generate-math-data.ts`.
- Locales beyond `en` — the repo ships `en` only today.
