# Contract: Stores & Hooks

**Date**: 2026-05-10 | **Plan**: [../plan.md](../plan.md)

---

## session-store (Zustand)

`src/english/vocab/store/session-store.ts`

Holds transient active-session state only. Not persisted to IndexedDB.
Cleared when session completes or user exits.

```typescript
interface SessionState {
  session: Session | null;
  currentIndex: number;
  retryCount: number;           // resets on each new item

  // actions
  setSession: (session: Session) => void;
  advance: () => void;          // currentIndex++, retryCount = 0
  incrementRetry: () => void;
  clearSession: () => void;
}
```

---

## profile-store (Zustand)

`src/shared/store/profile-store.ts`

Tracks the active child profile for the current app session.
Does not hold all profiles — those are fetched from Dexie on demand.

```typescript
interface ProfileState {
  activeProfileId: string | null;

  // actions
  setActiveProfile: (id: string) => void;
  clearActiveProfile: () => void;
}
```

---

## useWordProgress hook

`src/english/vocab/hooks/useWordProgress.ts`

CRUD interface over the `wordProgress` Dexie table for the active child.

```typescript
interface UseWordProgressReturn {
  // queries
  getProgress: (wordId: string) => Promise<WordProgressRow | undefined>;
  getWordSetProgress: (wordSetId: string) => Promise<WordProgressRow[]>;
  getAllProgress: () => Promise<WordProgressRow[]>;

  // mutations (call after each activity answer)
  recordCorrect: (wordId: string, wordSetId: string) => Promise<void>;
  recordIncorrect: (wordId: string, wordSetId: string) => Promise<void>;
}
```

`recordCorrect` / `recordIncorrect` apply the priority score formula and advance stage when
`consecutiveCorrect >= MASTERY_THRESHOLD`.

---

## useSessionComposer hook

`src/english/vocab/hooks/useSession.ts`

Composes a session for the active child from a given WordSet.

```typescript
interface UseSessionReturn {
  composeSession: (wordSet: WordSet) => Promise<Session>;
  isComposing: boolean;
}
```

Internally calls the pure `session-composer.ts` function after fetching `WordProgress` from Dexie.

---

## session-composer.ts (pure function)

`src/english/vocab/services/session-composer.ts`

Pure function — no side effects, no async, no DB access. Unit-testable in isolation.

```typescript
function composeSession(
  wordSet: WordSet,
  progressMap: Record<string, WordProgressRow>,   // wordId → progress (pre-fetched)
  options: { sessionWordCount: number }
): SessionItem[]
```

**Algorithm**:
1. Gather all in-progress words for this WordSet (words with existing progress rows)
2. Sort by `priorityScore` DESC (highest priority first)
3. Take up to `sessionWordCount` items
4. If slots remain, fill with next unstarted words from `wordSet.words` (in order) at Stage 1
5. Return `SessionItem[]` with `activityType` derived from each word's current stage

---

## priority-scorer.ts (pure functions)

`src/english/vocab/services/priority-scorer.ts`

```typescript
function applyCorrect(current: WordProgressRow): Partial<WordProgressRow>
function applyIncorrect(current: WordProgressRow): Partial<WordProgressRow>
function shouldAdvanceStage(progress: WordProgressRow): boolean
```

All three are pure, side-effect-free, and covered by unit tests.

---

## useAudio hook

`src/shared/hooks/useAudio.ts`

Thin wrapper around Howler.js.

```typescript
interface UseAudioReturn {
  play: (src: string) => void;
  stop: () => void;
  isPlaying: boolean;
  hasError: boolean;      // true if audio failed to load (triggers FR-015 offline state)
}
```

Respects the global `audioEnabled` setting from `SettingsPage` (stored in localStorage as a
simple boolean — too lightweight to warrant Dexie or Zustand).
