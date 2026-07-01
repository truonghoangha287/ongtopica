# Contract: `composeMathSession`

`src/math/services/math-session-composer.ts`

## Signature

```ts
function composeMathSession(
  topic: MathTopic,
  progressMap: Record<string, MathProgressRow>, // keyed by problemId
  options?: { sessionSize?: number },
): MathProblem[];
```

## Behaviour

1. **Selection priority** (highest first):
   - **unmastered** problems with prior misses (`totalIncorrect > 0`, `!mastered`) — review struggles first;
   - **unseen / unmastered** problems (no row, or `!mastered`);
   - **mastered** problems (only used to top up if the topic is small).
2. **Size**: returns at most `options.sessionSize ?? MATH_SESSION_SIZE` problems. If the topic has
   fewer problems than the size, the session is the whole topic — **never padded with other topics'
   content** (Constitution III; FR-009 edge case).
3. **Order**: the selected problems are shuffled (no fixed positional bias). Within a single render
   the choice order inside each problem is preserved from the data (already pre-shuffled by the
   generator).
4. **Determinism**: pure function of its inputs except for the final shuffle. Selection *membership*
   (which problems are chosen) is deterministic given the inputs; only ordering is randomised, so
   membership assertions in tests are stable.
5. **No side effects**: reads nothing from Dexie, performs no writes, makes no network calls.

## Invariants (test assertions)

- `result.length <= sessionSize`.
- `result.length === min(topic.problems.length, sessionSize)`.
- Every returned problem belongs to `topic` (`problem.topicId === topic.id`).
- When some problems are unmastered, the result contains **only/most** unmastered ones before any
  mastered one is included (review-first).
- No duplicates: each problem appears at most once.

## Related: per-problem scoring (`math-scorer.ts`)

```ts
isMastered(row): boolean                       // row.consecutiveCorrect >= MATH_MASTERY_THRESHOLD
applyCorrect(row): Partial<MathProgressRow>     // streak++, set mastered when threshold reached
applyIncorrect(row): Partial<MathProgressRow>   // streak=0, totalIncorrect++, mastery never revoked
```

## Related: topic gating (`topic-progression.ts`)

```ts
topicMasteryFraction(topic, progressMap): number   // mastered / total (0..1)
isTopicUnlocked(index, registry, progressMap): boolean
//   index === 0 → true
//   else → topicMasteryFraction(registry[index-1], ...) >= MATH_TOPIC_UNLOCK_THRESHOLD
```
