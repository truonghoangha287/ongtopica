# Phase 0 Research: Vocab Progression Expansion

## Decision Log

### 1. Dexie schema migration shape (v1 → v2)

**Decision**: Use Dexie's `version(2).stores({...}).upgrade(async (tx) => {...})` API. Additive index-only changes (new fields not part of any index) require **no** `upgrade` callback — Dexie passes existing rows through verbatim and new fields land as `undefined`, which our code handles with `?? null`/`?? 1`.

**Rationale**: Minimum-churn migration. No row-by-row rewrite needed unless we want to back-fill `introducedAt` (FR-013); for the back-fill we do need a one-time `upgrade` callback that walks `wordProgress` and sets `introducedAt = lastReviewedAt` for any row whose `stage > 1`.

**Alternatives considered**:
- Drop-and-recreate v2: rejected — destroys existing progress, violates FR-013.
- Lazy back-fill on read: rejected — race conditions with concurrent reads, harder to test.

### 2. Where to persist the rotation cursor

**Decision**: New Dexie table `wordSetState` keyed by `${childId}:${wordSetId}`, fields `{ rotationCursor: number, lastUpdatedAt: number }`. Cursor stores the index into the WordSet's word list where the **next** Listen & Learn session should start.

**Rationale**: Per-child + per-set scope matches the spec. Co-locating cursor on `WordProgressRow` was rejected because the cursor is set-scoped, not word-scoped — putting it on every word row duplicates the same value 31× for Animals.

**Alternatives considered**:
- Zustand store (in-memory): rejected — would reset on app reload, breaking US-1 acceptance #1.
- Reuse a magic Word with id `:cursor`: rejected — pollutes the word-progress index and confuses the parent dashboard.

### 3. `introducedAt` field necessity

**Decision**: Add explicit `introducedAt: number | null` field on `WordProgressRow`. Cannot be derived from `stage > 1` alone because a word can be heard in Listen & Learn (stage stays at 1 — Listen & Learn is passive) but the child should still see 1 star and the "heard" counter should advance.

**Rationale**: The current code does **not** advance `stage` after Listen & Learn (it is passive, no answer feedback). Without an explicit field, we cannot distinguish "introduced via L&L" from "never seen" for the star row or the rotation indicator.

**Alternatives considered**:
- Use `lastReviewedAt` non-null as the proxy: rejected — `lastReviewedAt` is also set by Recognize/Unscramble/Fill-in-blank, but it being non-null does not say *which* stage was entered. The semantic mismatch makes FR-002 untestable.

### 4. Achievement catalog scope

**Decision**: 5 fixed achievement IDs hardcoded in `src/english/vocab/services/achievement-evaluator.ts` as a `const ACHIEVEMENTS` map:
- `first_listen` — heard at least 1 word
- `curious_ear:{wordSetId}` — heard every word in a WordSet (parameterized per set, 14 instances)
- `sharp_eye:{wordSetId}` — recognized every word in a WordSet
- `word_builder:{wordSetId}` — spelled every word in a WordSet (Unscramble clear)
- `set_master:{wordSetId}` — 4 stars on every word in a WordSet

**Rationale**: Spec caps at 5 in initial release. Per-set parameterization gives 1 + 4×14 = 57 distinct achievement IDs, but only 5 categories surface in the Achievements UI (one row per category with set badges underneath). Keeps the screen readable for a 6-year-old.

**Alternatives considered**:
- Runtime catalog from JSON: rejected — YAGNI. No live tuning expected.
- Global achievements only (no per-set): rejected — feels less rewarding; spec mentions "Set Mastered".

### 5. Achievement engine vs. pure function

**Decision**: Pure function `evaluateAchievements(progressMap, wordSets, earnedIds): string[]` returns IDs of newly-earned achievements. Called once at the end of every session (in `SessionPlayer`'s completion handler). Side effects (Dexie write + celebration animation) happen in the caller, not in the evaluator.

**Rationale**: KISS, fully unit-testable, no hidden state, no observers/listeners to wire. The evaluator is a pure function of (progressMap × wordSets × already-earned set) → newly-earned set.

**Alternatives considered**:
- Event-driven achievement engine: rejected — overengineered for 5 achievements, adds a publisher/subscriber dependency where none exists today.
- Per-answer evaluation: rejected — too noisy; most answers do not change achievement state, and end-of-session is when celebrations naturally fire anyway.

### 6. Rotation algorithm

**Decision**: For Listen & Learn (Stage 1), compose the session as:
1. Read `rotationCursor` (default 0) for the (child, set) pair.
2. From the set's word list, take a window of `ROTATION_BATCH_SIZE` (= 10) words starting at the cursor, wrapping around the end if needed.
3. Filter out words that no longer match stage-1 eligibility (rare — only happens if the child somehow advanced past stage 1 outside L&L; safety net).
4. If the window has fewer than 10 unique words because of wrap-around overlap with already-introduced items, prefer un-introduced items first (then fill from already-introduced).
5. After the session completes, write back `rotationCursor = (cursor + 10) mod set.words.length`.

**Rationale**: Predictable order (Assumption: JSON order = lesson order), simple integer state, no per-session shuffling. Wrap-around guarantees rotation.

**Alternatives considered**:
- Track set-of-heard-IDs and randomize remainder: rejected — random ordering makes it hard for parents to follow along.
- Move cursor by exactly the count of words newly introduced this session (excluding wrap-overlaps): rejected — added complexity, indistinguishable result for the child.

### 7. Per-word unlock check location

**Decision**: Compute eligibility inline in `WordSetPage.tsx` from the existing `progressMap` rather than a derived store slice. Single-pass: `Object.values(progressMap).some(p => p.stage > priorStage)` is O(n) on at most 31 entries; not worth memoizing.

**Rationale**: Keeps state local, no new selectors, no risk of stale derived state.

### 8. Star-row component reusability

**Decision**: New component `star-row.tsx` (≤ 50 LOC) takes `{ stars: number; max?: number = 4; size?: 'sm' | 'md' = 'sm' }`. Used in WordMap (size sm) and HomeProgressTile (size sm), can be reused later for AchievementsPage badges.

**Rationale**: Constitution VI requires reusable components with single responsibility. Star rendering is exactly one concern.

## NEEDS CLARIFICATION

None — all unknowns resolved.
