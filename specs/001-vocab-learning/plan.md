# Implementation Plan: Vocabulary Learning — Unscramble Auto-Fill Update

**Branch**: `001-vocab-learning` | **Date**: 2026-05-11 | **Spec**: [spec.md](spec.md)
**Input**: Clarification — tap-to-auto-fill Unscramble interaction with error feedback and incorrect-word marking

## Summary

Update `UnscrambleActivity` (Stage 3) so that tapping a letter tile immediately places it in the
next empty answer slot — replacing the current two-tap select-then-place flow. When all slots are
filled incorrectly, show a visible error state before resetting tiles. The existing
`onIncorrect`/`onReveal` callback chain already writes `WordProgress` (priority boost) ensuring the
word resurfaces in the next session. No data-model changes required.

## Technical Context

**Language/Version**: TypeScript 5, React 18  
**Primary Dependencies**: Vite 5, Zustand, Dexie.js, Framer Motion, react-i18next  
**Storage**: IndexedDB via Dexie.js (no schema changes)  
**Testing**: Vitest + React Testing Library + axe-core  
**Target Platform**: Web PWA (tablet + desktop + mobile)  
**Project Type**: Web application (SPA)  
**Performance Goals**: 60fps animations, CLS=0  
**Constraints**: <200 lines per file, no magic numbers, all UI strings via i18n  
**Scale/Scope**: Single component change + contract update + tests

## Constitution Check

| Principle | Evaluation | Status |
|-----------|------------|--------|
| I. Child-First UX | Auto-fill (one tap) is simpler for 6-year-olds than select-then-place; error state is encouraging, never punishing | ✅ PASS |
| II. Accessibility | Tile buttons retain `aria-label`; `aria-live` region announces placement and error; keyboard nav preserved | ✅ PASS |
| III. Progressive Mastery | `onIncorrect`/`onReveal` callbacks unchanged; `recordIncorrect` multiplies priority ensuring reappearance | ✅ PASS |
| IV. Safe Sandbox | No external links; no user content | ✅ PASS |
| V. Performance | No new dependencies; CSS transition for error flash; CLS=0 maintained | ✅ PASS |
| VI. Code Quality | Named constants remain; file stays <200 lines; no magic numbers | ✅ PASS |
| VII. Test Coverage | New tap-to-fill and error-state paths require updated integration tests | ✅ PASS (tests required before merge) |

No violations. No Complexity Tracking entry needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-vocab-learning/
├── plan.md              ← this file
├── research.md          ← no changes (all decisions already resolved)
├── data-model.md        ← no changes (WordProgress + callbacks handle incorrect tracking)
├── contracts/
│   └── activities.md    ← UPDATED: UnscrambleActivity behavior section
└── quickstart.md        ← no changes
```

### Source Code (changes only)

```text
src/english/vocab/components/activities/
└── UnscrambleActivity.tsx        ← MODIFY: tap → auto-fill next slot + error state

tests/  (or co-located *.test.tsx)
└── UnscrambleActivity.test.tsx   ← UPDATE: cover new tap-to-fill and error-state flows
```

## Phase 0: Research

All tech decisions are already resolved in [research.md](research.md). No NEEDS CLARIFICATION items.

**Clarification captured** (2026-05-11):

| Question | Answer |
|----------|--------|
| What happens when user taps a tile? | Tile immediately fills the next empty slot (leftmost empty slot); no slot-selection step |
| What happens on incorrect full arrangement? | Show visible error (red border / shake on slots) with encouraging mascot cue, then reset tiles |
| What does "mark as not remembered" mean technically? | Existing `onIncorrect()` → `recordIncorrect()` → `priorityScore *= STRUGGLE_WEIGHT` already handles this; no new mechanism needed |
| Can user un-place a tile (tap a filled slot)? | Yes — tapping a filled slot returns the letter back to the available pool |

## Phase 1: Design & Contracts

### Behavior Change: UnscrambleActivity

**Old flow** (two-tap):
1. Tap tile → tile highlights (selected state)
2. Tap empty slot → tile moves to slot
3. All slots filled → auto-check

**New flow** (one-tap auto-fill):
1. Tap tile → tile immediately moves to next empty slot (left-to-right order)
2. Tap filled slot → tile returns to available pool
3. All slots filled → auto-check
4. Wrong answer → error state (red border flash + encouraging mascot) → reset after ~600ms

**Error state** (new):
- Slots render with red border for ~600ms (CSS `transition` on `border-color`)
- Mascot shows `encourage` reaction
- `callbacks.onIncorrect()` called (existing — triggers `recordIncorrect` → priority boost)
- After delay, slots reset to empty

**i18n** — no new keys needed; `activities.unscramble.tryAgain` already exists.

### Updated Contract

See [contracts/activities.md](contracts/activities.md) — `UnscrambleActivity` behavior section updated.

### Data Model

No changes. `WordProgress.priorityScore` is already multiplied by `STRUGGLE_WEIGHT` on each
`recordIncorrect` call, ensuring the word surfaces in the next session at higher priority.

## Implementation Steps

1. **Modify `UnscrambleActivity.tsx`**:
   - Remove `selectedKey` state (no longer needed)
   - `handleTileTap(key)` → finds first `null` in `placed` array → fills it
   - Add `errorState` boolean → drives red-border CSS on answer slots
   - In `checkAnswer`: on wrong answer, set `errorState = true`, call `onIncorrect()`, then after
     ~600ms reset `placed` and `errorState`
   - Filled-slot tap still returns tile to pool (keeps undo affordance)

2. **Update tests** (`UnscrambleActivity.test.tsx`):
   - Test: tile tap auto-fills next slot
   - Test: filled slot tap returns letter to pool
   - Test: wrong arrangement shows error state → resets
   - Test: correct arrangement triggers celebration
   - Test: retries exhausted → `onReveal()` called

3. **Verify axe-core** passes with updated interaction.

## Success Criteria

- [ ] Tapping a tile places it in the next empty slot without a second tap
- [ ] Tapping a filled slot returns the letter to the available pool
- [ ] Wrong full arrangement: error visual shown + encouraging mascot + tiles reset
- [ ] `onIncorrect()` fires on wrong arrangement (ensures `recordIncorrect` runs)
- [ ] `onReveal()` fires after `MAX_RETRIES` exhausted (word auto-revealed)
- [ ] All existing tests pass
- [ ] New tap-to-fill and error-state tests pass
- [ ] axe-core accessibility tests pass
