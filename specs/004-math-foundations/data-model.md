# Phase 1 Data Model: Math Foundations

## Content types (`src/math/types/math.types.ts`)

```ts
export type MathActivityType =
  | 'tap-number'    // recognise / add / subtract — tap the correct numeral
  | 'count-objects' // count a cluster — tap the count
  | 'pick-next'     // pattern — tap what comes next
  | 'tap-shape'     // tap the named shape
  | 'odd-one-out';  // logic — tap the item that does not belong

export type ShapeKind =
  | 'circle' | 'square' | 'triangle' | 'rectangle'
  | 'star' | 'heart' | 'diamond' | 'oval';

/** What the question shows above the choices. */
export interface PromptSpec {
  kind: 'numeral' | 'dots' | 'word' | 'expression' | 'shape-name' | 'sequence' | 'instruction';
  value?: string | number; // numeral value / word text / expression text / shape name
  count?: number;          // dots: how many dots
  emoji?: string;          // object glyph for dots/objects
  sequence?: ChoiceSpec[]; // pick-next: items to display, ending with a "?" placeholder
  i18nKey?: string;        // instruction prompts resolved from the math namespace
}

/** One tappable option. Exactly one per problem matches answerId. */
export interface ChoiceSpec {
  id: string;
  label?: string;     // numeral / text
  emoji?: string;     // object glyph
  shape?: ShapeKind;  // render via ShapeGlyph
  count?: number;     // a choice that is itself a cluster of N objects
}

export interface MathProblem {
  id: string;          // e.g. "numbers.07", "addition.2plus3"
  topicId: string;
  type: MathActivityType;
  prompt: PromptSpec;
  choices: ChoiceSpec[]; // length === MATH_CHOICE_COUNT
  answerId: string;      // must equal one choice.id
  narration: string;     // spoken aloud + shown as caption
}

export interface MathTopic {
  id: string;          // 'numbers' | 'counting' | ... | 'logic'
  problems: MathProblem[];
}
```

## Topic registry (`src/data/math-starters/index.ts`)

Fixed order = difficulty ladder (Constitution III):

| # | topicId | activity | icon | example problem |
|---|---|---|---|---|
| 1 | `numbers` | tap-number | 🔢 | numeral/dots/word → tap matching numeral |
| 2 | `counting` | count-objects | 🍎 | 🦆🦆🦆 → tap "3" |
| 3 | `addition` | tap-number | ➕ | `2 + 3` with objects → tap "5" |
| 4 | `subtraction` | tap-number | ➖ | `5 − 2` with objects → tap "3" |
| 5 | `patterns` | pick-next | 🔁 | 🔴🔵🔴🔵❓ → tap 🔴 |
| 6 | `shapes` | tap-shape | 🔺 | "Tap the triangle" → 3 shapes |
| 7 | `logic` | odd-one-out | 🧩 | 🍎🍎🍌🍎 → tap 🍌 |

```ts
export const mathTopicRegistry: MathTopic[] = [ numbers, counting, addition,
  subtraction, patterns, shapes, logic ];
export function getMathTopic(id: string): MathTopic | undefined;
export function topicIndex(id: string): number; // position in the ladder
```

## Progress storage (`src/shared/db/schema.ts`)

```ts
export interface MathProgressRow {
  id: string;             // `${childId}:${problemId}`
  childId: string;
  topicId: string;
  problemId: string;
  consecutiveCorrect: number;
  totalIncorrect: number;
  mastered: boolean;      // set true once consecutiveCorrect >= MATH_MASTERY_THRESHOLD
  lastReviewedAt: number;
}
export type MathProgressTable = Table<MathProgressRow, string>;
```

Dexie **v3** (additive):

```ts
this.version(3).stores({
  childProfiles: 'id, createdAt',
  wordProgress: 'id, childId, [childId+wordSetId], [childId+stage]',
  wordSetState: 'id, childId, [childId+wordSetId]',
  achievements: 'id, childId, [childId+earnedAt]',
  mathProgress: 'id, childId, [childId+topicId]',   // NEW
});
```

No `.upgrade()` data motion needed — adding a store preserves all existing rows (FR-012/SC-005).

## State transitions (per problem)

```
unseen ──correct──▶ consecutiveCorrect=1
   │                      │ correct (>= MATH_MASTERY_THRESHOLD)
   │ wrong                ▼
   ▼                  mastered=true  (terminal for unlock purposes)
totalIncorrect++ , consecutiveCorrect=0   ◀── wrong (resets streak, never un-masters)
```

- `applyCorrect(row)`: `consecutiveCorrect+1`; if it reaches `MATH_MASTERY_THRESHOLD` set
  `mastered=true`. `lastReviewedAt=now`.
- `applyIncorrect(row)`: `consecutiveCorrect=0`, `totalIncorrect+1`. Mastery, once earned, is not
  revoked (a child never "loses" a topic; Constitution I — never punish).

## Achievements (reused `achievements` table)

| achievementId | trigger |
|---|---|
| `math_first_steps` | first ever correct math answer |
| `topic_master:<topicId>` | every problem in that topic is `mastered` |

`evaluateMathAchievements(progressRows, registry, earnedSet)` → array of newly-earned ids (pure).
