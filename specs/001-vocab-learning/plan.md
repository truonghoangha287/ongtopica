# Implementation Plan: FR-003a & FR-003b — Unscramble & Fill-in-blank

**Branch**: `001-vocab-learning` | **Date**: 2026-05-11 | **Spec**: [spec.md](spec.md)  
**Input**: FR-003a (Stage 3: Unscramble) and FR-003b (Stage 4: Fill-in-blank)

## Summary

Both activity implementations exist. FR-003a (UnscrambleActivity) and FR-003b (FillInBlankActivity)
are coded but have failing integration tests. The plan covers root cause analysis, constitution
verification, and targeted test fixes to bring both phases to a passing checkpoint.

## Technical Context

**Language/Version**: TypeScript 5, React 18  
**Primary Dependencies**: Vite 6, Zustand, Dexie, Howler.js, Framer Motion, @dnd-kit/core, react-i18next  
**Storage**: Dexie (IndexedDB) — `wordProgress` table with composite indexes  
**Testing**: Vitest 3, @testing-library/react, jsdom, vitest-axe  
**Target Platform**: PWA — tablet (primary) + desktop; offline after first load  
**Project Type**: child learning web-app  
**Performance Goals**: Audio plays within 1s; activities load within 2s (SC-002)  
**Constraints**: Offline-capable, 48px+ touch targets, WCAG AA, zero external links (SC-006)  
**Scale/Scope**: 7 WordSets × 10 words = 70 entries; single-device profiles

## Constitution Check

*Re-evaluated against v1.0.0 after implementation scan.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Child-First UX | ✅ | Error state uses red border flash (~600ms) then resets — no lasting shame cue; Mascot encourages on incorrect |
| II. Accessibility by Default | ✅ | Tile buttons have `aria-label`, slot group has `role="group"`, letter buttons have `aria-label`; 48px+ min targets |
| III. Progressive Mastery | ✅ | MAX_RETRIES=1 enforced; retries reset on advance; stage advances via `applyCorrect` in `useWordProgress` |
| IV. Safe & Private Sandbox | ✅ | No external links, no analytics |
| V. Performance & Offline | ✅ | Service worker pre-caches MP3/WebP assets via vite-plugin-pwa |
| VI. Code Quality | ✅ | `MAX_RETRIES`, `ERROR_RESET_MS` as constants; files under 200 LOC; single responsibility |
| VII. Test Coverage | ❌ **BLOCKING** | 4 integration tests failing across T044 (Unscramble) and T047 (FillInBlank) — see Remaining Work |

**Gate result**: Principle VII violation. Must pass before these phases are complete.

## Project Structure

### Documentation (this feature)

```text
specs/001-vocab-learning/
├── plan.md         ← this file
├── research.md     ✅ done (2026-05-10)
├── data-model.md   ✅ done (2026-05-10)
├── quickstart.md   ✅ done (2026-05-10)
├── contracts/      ✅ done (activities.md, locale-keys.md, stores.md)
└── tasks.md        ✅ done (T042–T047 coded; tests failing)
```

### Source Code

```text
src/english/vocab/components/activities/
├── UnscrambleActivity.tsx   ← FR-003a implementation (134 LOC)
└── FillInBlankActivity.tsx  ← FR-003b implementation (89 LOC)

tests/integration/
├── unscramble-activity.test.tsx   ← 2 failing tests
└── fill-in-blank-activity.test.tsx ← 2 failing tests
```

## Phase 0: Research

**Status: COMPLETE** — see [research.md](research.md).  
No unknowns. Stack decisions (Vite + React 18, Howler.js, Dexie, @dnd-kit) are ratified.

## Phase 1: Design & Contracts

**Status: COMPLETE** — see [data-model.md](data-model.md), [contracts/](contracts/).  
`UnscrambleActivityProps` and `FillInBlankActivityProps` are defined in `contracts/activities.md`
and implemented in `src/english/vocab/types/vocab.types.ts`.

### Key Design Decisions (from spec session 2026-05-11)

**Unscramble tile UX (FR-003a)**:
- Tap tile → auto-fills next empty slot (left-to-right); no separate slot-tap needed
- Tap filled slot → returns letter to available pool (undo affordance)
- All tiles placed → auto-checks word
- On incorrect: slots flash red border `ERROR_RESET_MS=600ms` + tiles reset to scrambled
- 2 total attempts (`MAX_RETRIES=1`): 1st wrong → encourage + reset; 2nd wrong → reveal correct word

**Fill-in-blank letter choice (FR-003b)**:
- `word.blankLetterIndex` marks which letter is blanked (content-authored)
- `word.letterChoices` holds exactly `LETTER_CHOICE_COUNT=3` shuffled options (seeded)
- Correct tap → blank fills inline + celebration
- `MAX_RETRIES=1`: 1st wrong → encourage; 2nd wrong → correct fills with encouragement

## Remaining Work (Principle VII gate)

### Issue 1 — Missing Howler mock in Unscramble and FillInBlank test files

**Impact**: jsdom throws `HTMLMediaElement.prototype.play not implemented` on every render.
Tests do not assert audio, so this should be suppressed with a module mock identical to the
one already in `recognize-activity.test.tsx`:

```typescript
vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(() => ({
    play: vi.fn(), stop: vi.fn(), unload: vi.fn(), on: vi.fn(),
  })),
}));
```

**Files**: `tests/integration/unscramble-activity.test.tsx`, `tests/integration/fill-in-blank-activity.test.tsx`

---

### Issue 2 — `waitFor` + `vi.useFakeTimers()` timeout in Unscramble tests

**Tests**: line 85 (`shows error state and resets tiles on incorrect arrangement`) and line 100 (`calls onReveal after MAX_RETRIES exhausted`).

**Root cause**: `waitFor` polls using real `setTimeout` internally. When `vi.useFakeTimers()` replaces
all timers, `waitFor`'s own polling never fires → 5000ms test timeout.

**Fix**: Replace the `await waitFor(...)` pattern with synchronous assertion inside `act()`:

```typescript
// Before (broken)
act(() => { vi.advanceTimersByTime(700); });
await waitFor(() => { expect(emptySlots.length).toBe(3); });

// After (correct)
act(() => { vi.runAllTimers(); });
const emptySlots = screen.getAllByRole('button').filter(
  (b) => b.getAttribute('aria-label')?.startsWith('empty slot'),
);
expect(emptySlots.length).toBe(3);
```

Apply same fix to the onReveal test (line 100): replace `await waitFor(...)` for tile re-appearance
check with synchronous query after `act(() => { vi.runAllTimers(); })`.

**File**: `tests/integration/unscramble-activity.test.tsx`

---

### Issue 3 — `onAdvance` auto-advance mismatch in FillInBlank and Recognize tests

**Tests**: `fill-in-blank-activity.test.tsx` line 20 (`calls onCorrect + onAdvance on correct letter`), `recognize-activity.test.tsx` line 34 (`calls onCorrect and onAdvance when correct picture tapped`).

**Root cause**: Tests use `await waitFor(() => expect(callbacks.onAdvance).toHaveBeenCalledOnce(), { timeout: 1500 })`, expecting `onAdvance` to fire automatically after correct answer. Implementations show an explicit "Next" button — `onAdvance` only fires on user click.

**Decision**: Update tests to match the implemented "Next" button pattern (consistent with `UnscrambleActivity` test which already clicks Next explicitly). Auto-advance without user confirmation conflicts with the child-controlled pacing principle (Constitution I: "always-reachable exit control").

```typescript
// After correct tap, click the Next button that appears
fireEvent.click(screen.getByRole('button', { name: /next/i }));
expect(callbacks.onAdvance).toHaveBeenCalledOnce();
```

**Files**: `tests/integration/fill-in-blank-activity.test.tsx`, `tests/integration/recognize-activity.test.tsx`

---

### Implementation tasks (in order)

| Task | File | Action |
|------|------|--------|
| TA-1 | `tests/integration/unscramble-activity.test.tsx` | Add Howler mock block at top |
| TA-2 | `tests/integration/unscramble-activity.test.tsx` | Fix timer+waitFor in lines 85–98 and 100–114 |
| TA-3 | `tests/integration/fill-in-blank-activity.test.tsx` | Add Howler mock block at top |
| TA-4 | `tests/integration/fill-in-blank-activity.test.tsx` | Fix onAdvance assertion (click Next button) |
| TA-5 | `tests/integration/recognize-activity.test.tsx` | Fix onAdvance assertion (click Next button) |
| TA-6 | Verify | Run `pnpm test:int` — all 16 tests must pass |

## Success Criteria

- `pnpm test:int` passes all 16 integration tests (0 failures)
- `pnpm typecheck` passes clean
- `UnscrambleActivity`: tap-to-fill UX, error state, reveal path — all exercised by tests
- `FillInBlankActivity`: blank display, correct/incorrect/reveal paths — all exercised by tests
- Constitution Principle VII gate: ✅ resolved
