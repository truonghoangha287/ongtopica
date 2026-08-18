# Word Game Hearts (Optional Challenge Mode)

**Date**: 2026-08-17
**Status**: Implemented — see `docs/superpowers/plans/2026-08-17-word-game-hearts.md`
**Scope**: `src/english/vocab` session activities only

## Problem

Vocab sessions have no stakes. A wrong answer shakes, retries once, reveals the
answer and moves on; nothing ends a round early. Some children want a game with
a real fail state. Others — and most six-year-olds learning their first words —
do not.

## Solution

An optional hearts mode. A grown-up turns it on in Settings and picks 3 or 5
hearts. Failing a word costs a heart. Running out ends the round on a friendly
screen, keeping every star already earned. Off by default, so nothing changes
for anyone who does not opt in.

## Decisions

| Question | Decision |
|---|---|
| What "live" means | Lives / hearts, not a timer and not multiplayer |
| Which games | The four answerable `SessionPlayer` activities only |
| On running out | Gentle end screen; progress already recorded is kept |
| What costs a heart | One heart per failed word, and the existing free retry survives — except Unscramble, see below |
| How many | Parent picks 3 or 5 |
| Where the control lives | Settings, behind the existing grown-ups math gate |
| Default | Off |
| Unscramble | One heart per shatter (it has no other fail state) |
| State location | Session-store slice + a pure settings module |

## Behaviour

### The setting

One new row in `src/pages/SettingsPage.tsx`, below the sound toggle and behind
the existing math gate: a three-way control **Off / 3 ❤️ / 5 ❤️**, defaulting to
Off. Persisted to `localStorage` under `heartsMode` as `"off" | "3" | "5"`,
mirroring the `audioEnabled` pattern.

The setting is global to the device, not per-profile. The vocab progression plan
notes one child profile is typically active per device session, and per-profile
difficulty is state nobody asked for.

### In a session

With hearts off, nothing renders and no new code path runs. With hearts on, a
row of ❤️ renders inside the existing `chrome` block, centered directly below the
progress dots. The dots stay where they are; the exit button (top-left) and the
owl (top-right) are untouched.

A heart is spent when:

| Activity | Costs a heart |
|---|---|
| Recognize, Listen & Match, Fill-in-blank | The second wrong tap — the one that reveals the answer. The first wrong tap still shakes and retries, free. |
| Unscramble | Each shatter: a wrong letter tapped while letters are already placed. A wrong tap on an empty board only shakes the tile, and stays free. |
| Introduce | Never — it is a listen-and-tap card with no wrong answer. |

At most one heart per word on the first three. Unscramble can drain faster; that
is the cost of it having unlimited retries and no reveal.

### Running out

The session stops and shows an out-of-hearts screen: mascot in `encourage`,
"Out of hearts!", and two buttons — **Try Again** (restarts the same session from
item 0 with a fresh heart pool) and **Go Home**.

Every `recordCorrect` already written to Dexie stays. Nothing is rolled back.

An interrupted session skips the completion block in `SessionPlayer`, so the
Listen & Learn rotation cursor does not advance and achievements are not
evaluated. This is deliberate — an unfinished round should not burn a rotation
batch. It means a child repeatedly running out could see the same batch again,
but Listen & Learn is `introduce`-only, which never costs a heart, so the case is
unreachable today. Documented, not built for.

## Architecture

### New files

| File | Purpose |
|---|---|
| `src/english/vocab/services/hearts-settings.ts` | The only place that touches `localStorage.heartsMode`. Exports `readHeartsMode()`, `writeHeartsMode(mode)`, `heartsCountFor(mode) → 0 \| 3 \| 5`. Pure and unit-testable. |
| `src/english/vocab/components/heart-row.tsx` | Visual primitive rendering full and spent hearts. Mirrors `star-row.tsx`. |
| `src/english/vocab/components/OutOfHeartsScreen.tsx` | The end screen. Parallel to `CelebrationScreen.tsx` — same shape, `encourage` mascot, no confetti. |

### Modified files

- **`src/english/vocab/store/session-store.ts`** — adds `heartsMax`,
  `heartsRemaining`, `loseHeart()`. `setSession(session, heartsMax)` takes the
  count as an argument so the store never touches `localStorage` and stays
  trivially testable. `restart()` reseeds `heartsRemaining` to `heartsMax`.
  `heartsMax: 0` means off, and every heart path becomes a no-op.
- **`src/english/vocab/types/vocab.types.ts`** — `ActivityCallbacks` gains
  `onShatter?: () => void`. Optional, so the three activities that never shatter
  are untouched and no existing test breaks.
- **`src/english/vocab/components/activities/UnscrambleActivity.tsx`** — one
  line, `callbacks.onShatter?.()` inside the existing shatter branch. The
  tile-shake branch below it is left alone.
- **`src/english/vocab/components/SessionPlayer.tsx`** — `loseHeart()` in the
  existing `onReveal`, a new `onShatter` in the same callbacks object,
  `<HeartRow>` in the `chrome` block, and a render branch to
  `OutOfHeartsScreen`. That branch is checked **before** the existing
  `isComplete` branch, so an exhausted session can never fall through to the
  celebration screen.
- **`src/pages/SettingsPage.tsx`** — the three-way control.
- **`src/shared/constants/game-constants.ts`** — `HEARTS_CHOICES = [3, 5]`. No
  magic numbers.
- **`src/locales/en/vocab.json`** — new `session.outOfHearts*` and
  `settings.hearts*` keys.

The other three activities, `useWordProgress`, `session-composer`, the Dexie
schema and Memory Match are untouched. No new dependencies, no migration.

### Why this shape

The `callbacks` object in `SessionPlayer` is already the single funnel every
activity outcome passes through, so hearts hook in at one place and no activity
needs to know hearts exist — except Unscramble, which needs a new signal
regardless. Store-held state survives `restart()` cleanly and is testable
without React.

Two alternatives were considered and rejected: a local `useHearts` hook inside
`SessionPlayer` (re-seeding on restart and on retry becomes manual, and
`SessionPlayer` is already long), and a generic "challenge modifiers" layer
(no second use case exists; extracting one later from this design is easy).

## Data flow

### Session start

`useSession` composes the session as it does now, then calls `readHeartsMode()`
→ `heartsCountFor(mode)` → `setSession(session, heartsMax)`. The setting is read
**once, here**. Changing it mid-session does not mutate a game in flight; it
applies to the next one.

`useSession` has two `setSession` call sites (lines 54 and 79) and both need the
new argument. They are the only callers in the codebase, so the signature change
is contained.

### Losing the last heart — ordering

Rendering `OutOfHeartsScreen` the instant `heartsRemaining` hits 0 would hide the
correct answer that was just revealed, which is the teaching moment. The swap is
deferred, and `SessionPlayer` holds a local `outOfHearts` flag:

- **Reveal path** (Recognize / Listen & Match / Fill-in-blank): `onReveal` spends
  the heart. The activity shows the answer and its Next button as it always has.
  The interception is in `onAdvance` — if hearts are exhausted, set `outOfHearts`
  instead of calling `advance()`. The child reads the answer, taps Next, then
  gets the end screen.
- **Shatter path** (Unscramble): there is no reveal and no Next button, so
  `onShatter` spends the heart and, if it was the last, sets `outOfHearts` after
  the existing 500 ms shatter animation, so the child sees the break land first.

### Try Again / Go Home

**Try Again** reuses the existing `handlePlayAgain` path: `restart()` (index → 0,
hearts → `heartsMax`), `completionHandled.current = false`, `outOfHearts = false`.
**Go Home** is the existing `handleExit`: `clearSession()` + `onExit()`.

### Hearts off

The null case throughout: `heartsMax === 0` makes `loseHeart()` a no-op,
`HeartRow` does not render, and `outOfHearts` can never be set. The path that
runs is the one that runs today.

## Error handling

`readHeartsMode()` returns `off` for an unset key, an unknown or corrupt stored
value, and a throwing `localStorage` (private-browsing mode). Failure always
degrades to today's behaviour, never to a broken game.

## Testing

### Unit (`tests/unit/`)

- `hearts-settings.test.ts` — unset key → `off`; round-trip of each mode; corrupt
  value → `off`; throwing `localStorage` → `off`.
- `session-store.hearts.test.ts` — `setSession` seeds both counts; `loseHeart`
  decrements and floors at 0; `loseHeart` is a no-op when `heartsMax === 0`;
  `restart` reseeds to full.

### Integration (`tests/integration/hearts-session.test.tsx`)

- Two wrong taps on a Recognize word cost exactly one heart, and the answer still
  reveals with its Next button.
- Tapping Next on the last heart shows the out-of-hearts screen instead of the
  next word. This is the Section-3 ordering rule and the most likely regression.
- An Unscramble shatter costs a heart.
- **Hearts off regression guard**: no heart row renders, and a failed word never
  ends a session.
- Try Again returns to item 0 with a full heart row.
- Words answered correctly before running out still have their Dexie rows.

These extend the existing `recognize-activity.test.tsx` and
`unscramble-activity.test.tsx` patterns rather than inventing new harness code.

### Accessibility (Constitution II)

- `tests/a11y/out-of-hearts-screen.test.tsx` — axe pass, same shape as
  `achievements-page.test.tsx`.
- `HeartRow` carries `role="status"` + `aria-live="polite"` with the label
  "2 of 3 hearts left", so losing one is announced; the ❤️ glyphs themselves are
  `aria-hidden`. Same approach the star row uses for "N of 4 stars earned".
- The Settings control is a `role="radiogroup"` of three options. The existing
  audio `aria-pressed` toggle is a two-state pattern that does not extend to
  three.
- Out-of-hearts buttons keep the 56 px minimum touch target used across session
  screens.
- The heart-loss animation gates on `useReducedMotion()`, as
  `answer-feedback.tsx` does.

## Out of scope (YAGNI)

Earning hearts back mid-session; hearts in Memory Match or grammar drills;
per-profile heart settings; streaks or scoring; heart-related achievements.
