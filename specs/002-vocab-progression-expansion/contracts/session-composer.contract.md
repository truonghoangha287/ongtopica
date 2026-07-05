# Contract: Session Composer (v2)

Internal contract for `composeSession` in `src/english/vocab/services/session-composer.ts`. Consumed by `useSession` and (transitively) by `WordSetPage` / `SessionPlayer`. Backward-incompatible signature change documented here for the planning phase only.

## Signature

```ts
export function composeSession(
  wordSet: WordSet,
  progressMap: Record<string, WordProgressRow>,
  options: {
    sessionWordCount?: number;          // default SESSION_WORD_COUNT (10)
    stageFilter?: 1 | 2 | 3 | 4;        // required to enter "single-activity" mode
    rotationCursor?: number;            // ONLY honored when stageFilter === 1
  }
): SessionItem[];
```

`SessionItem` shape is unchanged: `{ word: Word; activityType: ActivityType }`.

## Behavior

### Mode A — Listen & Learn (`stageFilter === 1`)

1. Take a window of `sessionWordCount` words from `wordSet.words`, starting at index `rotationCursor ?? 0`, wrapping around the end of the array if necessary. Deduplicate by `word.id` (wrap can create overlaps when `set.size < sessionWordCount`).
2. Within the window, prefer words whose `progressMap[wordId]?.introducedAt == null` (un-introduced first), then already-introduced words to fill remaining slots. Stable sort — preserve JSON order within each subgroup.
3. Each item's `activityType = 'introduce'`.
4. Return at most `sessionWordCount` items; return fewer when `set.size < sessionWordCount` and there is nothing to wrap to.

**Caller responsibility**: after the session completes, the caller writes `rotationCursor := (rotationCursor + sessionWordCount) mod wordSet.words.length` and writes `introducedAt = Date.now()` for every word in the session whose `introducedAt` was null. The composer is pure — it does not mutate Dexie.

### Mode B — Single-activity session (`stageFilter ∈ {2, 3, 4}`)

1. Pool = the full `wordSet.words`. There is **no stage gating** — every word is playable for every activity, so a word never has to be "unlocked" by clearing an earlier stage.
2. Sort the pool by `priorityScore` descending; tie-break by JSON order (stable sort). Un-started words have score `0`, so they trail in-progress words but stay in JSON order among themselves.
3. Take the top `sessionWordCount` items (or all of them when the set is smaller).
4. Each item's `activityType = stageToActivity(stageFilter)` — the chosen activity, NOT the word's current stage.

### Mode C — Default (no `stageFilter`)

Unchanged from v1: spaced-repetition fill of in-progress words by `priorityScore`, top-up with un-started words at activityType `introduce`.

## Invariants

- Function is pure — no Dexie reads, no random except where called explicitly (distractor selection still uses `Math.random()` but lives in `selectDistractors`, not `composeSession`).
- Never returns more than `sessionWordCount` items.
- Never returns duplicate `word.id` values within one call.
- For `stageFilter === 1`, every returned item's `activityType === 'introduce'`.
- For `stageFilter ∈ {2,3,4}`, every returned item's `activityType === stageToActivity(stageFilter)`.

## Test fixtures

| Scenario | Input | Expected output |
|---|---|---|
| Fresh profile, Animals (31 words), L&L, cursor=0 | empty progressMap, stageFilter=1, rotationCursor=0 | first 10 animals in JSON order, all `introduce` |
| Same, second session, cursor=10 | empty progressMap, stageFilter=1, rotationCursor=10 | animals[10..19] |
| Same, fourth session, cursor=30 | empty progressMap, stageFilter=1, rotationCursor=30 | animals[30], wrap to animals[0..8] (9 distinct already-introduced + 1 un-introduced) — total 10 |
| Small set Work (4 words), L&L | empty progressMap, stageFilter=1, rotationCursor=0 | 4 items returned (not 10) |
| Recognize on Animals (31 words), 5 cleared L&L | progressMap with 5 entries at stage=2 | 10 items returned (capped), all `recognize`, in-progress words first by `priorityScore` desc |
| Unscramble with zero stage≥3 words | progressMap all stage=2 | 10 items returned (full set, no gating), all `unscramble` |
| Any single-activity call on a fresh profile | empty progressMap, stageFilter ∈ {2,3,4} | up to `sessionWordCount` items in JSON order, activityType = chosen activity |
