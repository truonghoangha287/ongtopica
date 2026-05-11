# Data Model: Vocabulary Learning

**Date**: 2026-05-10 | **Plan**: [plan.md](plan.md)

## Entities

### ChildProfile

Identifies a child for local progress isolation. Stored in Dexie `childProfiles` table.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` (UUID) | Primary key |
| `name` | `string` | Display name; read aloud on profile tap |
| `avatarId` | `string` | References a bundled avatar asset key |
| `createdAt` | `number` | Unix timestamp ms |

**Constraints**: No cloud sync; device-local only. Multiple profiles supported (e.g. siblings).

---

### WordSet

A named thematic group. Pre-bundled as JSON in `src/data/yle-starters/`. Not stored in Dexie
(static content). Loaded at runtime.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Slug, e.g. `"animals"` |
| `displayName` | `string` | i18n key, e.g. `"wordSets.animals"` |
| `words` | `Word[]` | Ordered list of words in this set |

---

### Word

A vocabulary entry. Part of WordSet static JSON; not stored in Dexie.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Unique across all sets, e.g. `"animals.cat"` |
| `text` | `string` | Display text, e.g. `"cat"` |
| `pictureAsset` | `string` | Asset path, e.g. `"/assets/images/cat.webp"` |
| `audioAsset` | `string` | Asset path, e.g. `"/assets/audio/cat.mp3"` |
| `wordSetId` | `string` | Parent WordSet id |
| `blankLetterIndex` | `number` | Index of the blanked letter for Fill-in-blank |
| `letterChoices` | `string[3]` | Exactly 3 letter options for Fill-in-blank (correct + 2 distractors) |

**Constraints**: `blankLetterIndex` and `letterChoices` are set at content-authoring time.
Each word has exactly one picture and one audio file (v1 scope).

---

### WordProgress

Tracks a child's mastery state for one Word. Persisted in Dexie `wordProgress` table.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | `{childId}:{wordId}` composite |
| `childId` | `string` | FK → ChildProfile.id |
| `wordId` | `string` | FK → Word.id |
| `wordSetId` | `string` | Denormalized for fast WordSet queries |
| `stage` | `1 \| 2 \| 3 \| 4` | Current activity stage (Introduce=1 … Fill-in-blank=4) |
| `consecutiveCorrect` | `number` | Resets to 0 on any incorrect answer; advances stage at MASTERY_THRESHOLD |
| `totalIncorrect` | `number` | Cumulative incorrect count; never decremented |
| `priorityScore` | `number` | Starts at INITIAL_PRIORITY; × STRUGGLE_WEIGHT on incorrect; ÷ CONFIDENCE_WEIGHT on correct |
| `lastReviewedAt` | `number \| null` | Unix timestamp ms of last session inclusion |

**Indexes**:
- `[childId+wordSetId]` — fetch all word progress for one child + one word set (word map)
- `[childId+stage]` — session composer filter by stage
- `childId` — fetch all progress for a child (parent dashboard)

**State transitions**:
- Incorrect answer: `consecutiveCorrect = 0`, `totalIncorrect++`, `priorityScore *= STRUGGLE_WEIGHT`
- Correct answer: `consecutiveCorrect++`, `priorityScore /= CONFIDENCE_WEIGHT`
- Stage advance: when `consecutiveCorrect >= MASTERY_THRESHOLD` → `stage++`, `consecutiveCorrect = 0`
- Stage 4 mastered: word is "learned" — shown as starred on WordMap

---

### Session (runtime only, not persisted)

Composed at session start by `session-composer.ts`. Held in Zustand `session-store` during play.
Not written to Dexie (only WordProgress updates are persisted mid-session).

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | UUID, used for deduplication |
| `childId` | `string` | FK → ChildProfile.id |
| `wordSetId` | `string` | Source WordSet |
| `items` | `SessionItem[]` | Ordered list of SESSION_WORD_COUNT items |
| `currentIndex` | `number` | Pointer to active item |
| `startedAt` | `number` | Unix timestamp ms |

---

### SessionItem (runtime only)

One word + its activity type within a session.

| Field | Type | Notes |
|-------|------|-------|
| `word` | `Word` | Resolved word object |
| `activityType` | `ActivityType` | Derived from word's current stage |
| `retryCount` | `number` | Starts at 0; max MAX_RETRIES before reveal |
| `answeredCorrectly` | `boolean \| null` | null = unanswered |

---

### ActivityType (enum)

```typescript
type ActivityType = 'introduce' | 'recognize' | 'unscramble' | 'fill-in-blank';
```

Maps to stage: `1 → introduce`, `2 → recognize`, `3 → unscramble`, `4 → fill-in-blank`.

---

## Dexie Schema

```typescript
// src/shared/db/schema.ts

interface ChildProfileRow {
  id: string;
  name: string;
  avatarId: string;
  createdAt: number;
}

interface WordProgressRow {
  id: string;           // composite: `${childId}:${wordId}`
  childId: string;
  wordId: string;
  wordSetId: string;
  stage: 1 | 2 | 3 | 4;
  consecutiveCorrect: number;
  totalIncorrect: number;
  priorityScore: number;
  lastReviewedAt: number | null;
}

// Dexie table declarations
// childProfiles: '++id, createdAt'  — auto-increment not used; UUID id
// wordProgress:  'id, childId, [childId+wordSetId], [childId+stage]'
```

---

## Named Constants

All live in `src/shared/constants/game-constants.ts`. No magic numbers elsewhere.

| Constant | Default | Description |
|----------|---------|-------------|
| `MASTERY_THRESHOLD` | `3` | Consecutive correct answers to advance stage |
| `SESSION_WORD_COUNT` | `10` | Words per session |
| `MAX_SESSION_MINUTES` | `8` | Soft target session duration |
| `MAX_RETRIES` | `1` | Incorrect attempts before correct answer revealed |
| `LETTER_CHOICE_COUNT` | `3` | Letter buttons shown in Fill-in-blank |
| `INITIAL_PRIORITY` | `1.0` | Starting priority score for new words |
| `STRUGGLE_WEIGHT` | `2.0` | Priority multiplier on incorrect answer |
| `CONFIDENCE_WEIGHT` | `1.5` | Priority divisor on correct answer |

---

## Word Set Completion States

| Condition | State | UI |
|-----------|-------|----|
| Some words at stage 1–4, not all mastered | In progress | Progress indicator |
| All words at stage 4 with mastery | Completed | "Completed!" badge + "Review All" mode |
| Word set not started | Not started | Default card |
