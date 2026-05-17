# Phase 1 Data Model: Vocab Progression Expansion

## Dexie schema delta (v1 → v2)

```ts
// src/shared/db/db.ts
this.version(2)
  .stores({
    childProfiles: 'id, createdAt',
    wordProgress:  'id, childId, [childId+wordSetId], [childId+stage]', // unchanged indexes
    wordSetState:  'id, childId, [childId+wordSetId]',                  // NEW
    achievements:  'id, childId, [childId+earnedAt]',                   // NEW
  })
  .upgrade(async (tx) => {
    // FR-013 back-fill: any word past stage 1 was implicitly heard at some point.
    const wp = tx.table('wordProgress');
    await wp.toCollection().modify((row) => {
      if (row.stage > 1 && row.introducedAt == null) {
        row.introducedAt = row.lastReviewedAt ?? Date.now();
      }
    });
  });
```

## Updated entities

### `WordProgressRow` (extended)

```ts
export interface WordProgressRow {
  id: string;                  // existing: `${childId}:${wordId}`
  childId: string;
  wordId: string;
  wordSetId: string;
  stage: 1 | 2 | 3 | 4;
  consecutiveCorrect: number;
  totalIncorrect: number;
  priorityScore: number;
  lastReviewedAt: number;
  introducedAt: number | null; // NEW — timestamp first L&L session containing this word ended
}
```

**Validation**:
- `introducedAt` must be `≤ lastReviewedAt` when both are set.
- `introducedAt` MUST be set whenever a Listen & Learn session containing this word completes (FR-002).
- Back-fill: any pre-v2 row with `stage > 1` and `introducedAt == null` gets `introducedAt = lastReviewedAt ?? Date.now()` during the v2 upgrade (FR-013).

**Stars derived (not stored)** — pure function `starCount(progress?: WordProgressRow): 0|1|2|3|4`:
- 0 if `progress` is undefined or `introducedAt == null` and `stage === 1`
- 1 if `introducedAt != null` and `stage === 1`
- 2 if `stage === 2` OR (`stage === 3 || stage === 4`) — i.e., star count = `stage` once introduced
- Specifically: `Math.max(stage, progress.introducedAt ? 1 : 0)`

### `WordSetStateRow` (NEW)

```ts
export interface WordSetStateRow {
  id: string;                  // composite `${childId}:${wordSetId}`
  childId: string;
  wordSetId: string;
  rotationCursor: number;      // 0-based index into wordSet.words; next L&L batch starts here
  lastUpdatedAt: number;
}
```

**Validation**:
- `0 <= rotationCursor < wordSet.words.length` (enforced by wrap-around on write).
- One row per (child, set). Created lazily on first Listen & Learn session completion.

**Index**: `[childId+wordSetId]` for the only lookup pattern.

### `AchievementRow` (NEW)

```ts
export interface AchievementRow {
  id: string;                  // composite `${childId}:${achievementId}`
  childId: string;
  achievementId: string;       // e.g. 'first_listen', 'curious_ear:animals'
  earnedAt: number;
}
```

**Validation**:
- One row per (child, achievementId). PK collision = already earned = no celebration.
- Catalog of valid `achievementId` values is hardcoded in `achievement-evaluator.ts` (see research.md §4).

**Index**: `[childId+earnedAt]` to support a chronological "recently earned" list on the Achievements screen.

## Constant additions

```ts
// src/shared/constants/game-constants.ts
export const ROTATION_BATCH_SIZE = SESSION_WORD_COUNT; // == 10, but named for intent
export const ACHIEVEMENT_IDS = {
  FIRST_LISTEN: 'first_listen',
  CURIOUS_EAR: 'curious_ear',     // suffix `:${wordSetId}`
  SHARP_EYE: 'sharp_eye',         // suffix `:${wordSetId}`
  WORD_BUILDER: 'word_builder',   // suffix `:${wordSetId}`
  SET_MASTER: 'set_master',       // suffix `:${wordSetId}`
} as const;
```

## State transitions

### `introducedAt` lifecycle

```text
[unset / null]
     │
     │ Listen & Learn session containing this word completes
     ▼
[set to Date.now()]  (immutable thereafter)
```

### `rotationCursor` lifecycle

```text
[no row exists]
     │
     │ First L&L session completes for (child, set)
     ▼
[row created, cursor = 10 mod set.size]
     │
     │ Each subsequent L&L session completes
     ▼
[cursor = (cursor + ROTATION_BATCH_SIZE) mod set.size]
```

### Achievement lifecycle

```text
[unearned]
     │
     │ evaluateAchievements(...) returns this id after a session ends
     ▼
[row inserted, earnedAt = Date.now(), banner fires once]
     │
     │ Future sessions evaluate again — row already present → skip celebration
     ▼
[unearned again only if profile reset wipes all rows]
```

## Cross-entity invariants

1. A word with `stage > 1` MUST have `introducedAt != null` (enforced by back-fill + by the L&L completion handler).
2. `curious_ear:{setId}` MAY only be earned when every word in the set has `introducedAt != null`.
3. `set_master:{setId}` MAY only be earned when every word in the set has `stage === 4 AND consecutiveCorrect >= MASTERY_THRESHOLD`.
4. Each achievement fires AT MOST once per profile.
