# Contract: Activity Components

**Date**: 2026-05-10 | **Plan**: [../plan.md](../plan.md)

All activity components live in `src/english/vocab/components/activities/`.
Each receives a `SessionItem` and reports outcomes via callbacks.
No activity component manages its own persistence — that belongs to `useSession`.

---

## Shared Types

```typescript
// src/english/vocab/types/vocab.types.ts

interface ActivityCallbacks {
  onCorrect: () => void;       // correct answer registered
  onIncorrect: () => void;     // incorrect answer registered (still within retries)
  onReveal: () => void;        // retries exhausted; correct answer shown
  onAdvance: () => void;       // activity complete; caller advances session
}
```

---

## IntroduceActivity

Stage 1. Passive exposure — no correct/incorrect judgment.

```typescript
interface IntroduceActivityProps {
  word: Word;
  onComplete: () => void;   // child viewed the word and taps "next" or sees it auto-advance
}
```

**Behavior**:
- Shows word picture (large) + display text
- Plays audio automatically on mount
- Replay button always visible
- "Next" button advances; no score recorded
- Completion triggers `onComplete`

---

## RecognizeActivity

Stage 2. Hear word → tap correct picture from 2×2 grid.

```typescript
interface RecognizeActivityProps {
  word: Word;
  distractors: Word[];        // exactly 3 distractor words (same WordSet preferred)
  callbacks: ActivityCallbacks;
}
```

**Behavior**:
- Audio plays automatically on mount
- 4 picture options shown in 2×2 grid (word + 3 distractors, shuffled)
- Tap correct → `onCorrect()` → celebration → `onAdvance()`
- Tap incorrect (1st) → `onIncorrect()` → gentle cue, retry enabled
- Tap incorrect (2nd, MAX_RETRIES=1 exhausted) → `onReveal()` → correct highlighted → `onAdvance()`

---

## UnscrambleActivity

Stage 3. See picture → arrange scrambled letter tiles into correct word.

```typescript
interface UnscrambleActivityProps {
  word: Word;
  callbacks: ActivityCallbacks;
}
```

**Behavior** *(updated 2026-05-11)*:
- Picture shown prominently
- Letter tiles displayed in random scrambled order (seeded shuffle, not random on re-render)
- **Tap-to-auto-fill**: tap a tile → it immediately fills the next empty answer slot (left-to-right); no separate slot-selection step
- Tap a filled slot → letter returns to the available tile pool (undo affordance)
- All tiles placed in correct order → auto-check → `onCorrect()` → celebration → `onAdvance()`
- Wrong order (within `MAX_RETRIES`) → error state: slots flash red border for ~600ms, mascot shows `encourage` → `onIncorrect()` fires → tiles reset to scrambled
- Wrong order (retries exhausted) → `onReveal()` → correct word snaps into slots → `onAdvance()`

**"Not remembered" mechanism**: `onIncorrect()` calls `recordIncorrect` in `useWordProgress`,
which multiplies `WordProgress.priorityScore` by `STRUGGLE_WEIGHT`. The session composer
selects highest-priority words first, so the word reappears in the next session automatically.

---

## FillInBlankActivity

Stage 4. See picture + partial word with one blank → tap correct letter from 3 choices.

```typescript
interface FillInBlankActivityProps {
  word: Word;      // word.blankLetterIndex and word.letterChoices used
  callbacks: ActivityCallbacks;
}
```

**Behavior**:
- Picture shown
- Word displayed as text with `word.text[blankLetterIndex]` replaced by `_`
- 3 large letter buttons shown (`word.letterChoices`, shuffled)
- Tap correct letter → blank fills → `onCorrect()` → celebration → `onAdvance()`
- Tap incorrect (1st) → `onIncorrect()` → gentle cue, retry
- Tap incorrect (2nd) → `onReveal()` → correct letter fills → `onAdvance()`

---

## SessionPlayer

Orchestrates the 10-word session flow. Lives in `src/english/vocab/components/SessionPlayer.tsx`.

```typescript
interface SessionPlayerProps {
  session: Session;
  onSessionComplete: () => void;   // all items answered → celebration screen
  onExit: () => void;              // child taps exit mid-session
}
```

**Behavior**:
- Renders the correct Activity component based on `session.items[currentIndex].activityType`
- On each callback (`onCorrect`, `onIncorrect`, `onReveal`, `onAdvance`):
  - Updates `WordProgress` in Dexie via `useWordProgress`
  - Updates `session-store` (retry count, answered state, currentIndex)
- On last item `onAdvance` → renders celebration screen → calls `onSessionComplete`
- Always-visible exit button triggers `onExit` (progress for completed items is saved)

---

## WordMap

Per-WordSet word map. Lives in `src/english/vocab/components/WordMap.tsx`.

```typescript
interface WordMapProps {
  wordSet: WordSet;
  progressMap: Record<string, WordProgressRow>;  // wordId → progress
  onWordTap?: (word: Word) => void;              // optional; for preview mode
}
```

**Behavior**:
- Displays all words in the set as cards
- Words with `stage === 4` and `consecutiveCorrect >= MASTERY_THRESHOLD` show a star
- Scope: only this WordSet's words (FR-013; no cross-set bleed)
