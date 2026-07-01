/**
 * Integration test: the topic-unlock ladder over the REAL generated data
 * (Constitution III / SC-004 — no path reaches a topic whose prerequisite is
 * unmastered).
 */
import { describe, it, expect } from 'vitest';
import { mathTopicRegistry } from '@/data/math-starters/index';
import { isTopicUnlocked, topicMasteryFraction } from '@/math/services/topic-progression';
import { MATH_TOPIC_UNLOCK_THRESHOLD } from '@/shared/constants/game-constants';
import type { MathProgressMap } from '@/math/types/math.types';
import type { MathProgressRow } from '@/shared/db/schema';

const masterRow = (problemId: string, topicId: string): MathProgressRow => ({
  id: `c:${problemId}`,
  childId: 'c',
  topicId,
  problemId,
  consecutiveCorrect: 2,
  totalIncorrect: 0,
  mastered: true,
  lastReviewedAt: 0,
});

/** Master the first `count` problems of a topic into the map. */
function masterFirst(map: MathProgressMap, topicIndex: number, count: number) {
  const topic = mathTopicRegistry[topicIndex];
  topic.problems.slice(0, count).forEach((p) => {
    map[p.id] = masterRow(p.id, topic.id);
  });
}

describe('Math topic ladder (real data)', () => {
  it('expected ladder order', () => {
    expect(mathTopicRegistry.map((t) => t.id)).toEqual([
      'numbers', 'counting', 'addition', 'subtraction', 'patterns', 'shapes', 'logic',
    ]);
  });

  it('every topic ships at least 10 playable problems (SC-006)', () => {
    mathTopicRegistry.forEach((t) => expect(t.problems.length).toBeGreaterThanOrEqual(10));
  });

  it('on a fresh profile only Numbers is unlocked', () => {
    const map: MathProgressMap = {};
    expect(isTopicUnlocked(0, mathTopicRegistry, map)).toBe(true);
    for (let i = 1; i < mathTopicRegistry.length; i++) {
      expect(isTopicUnlocked(i, mathTopicRegistry, map)).toBe(false);
    }
  });

  it('mastering ≥ 50% of Numbers unlocks Counting but nothing further', () => {
    const map: MathProgressMap = {};
    const numbersTotal = mathTopicRegistry[0].problems.length;
    masterFirst(map, 0, Math.ceil(numbersTotal * MATH_TOPIC_UNLOCK_THRESHOLD));
    expect(topicMasteryFraction(mathTopicRegistry[0], map)).toBeGreaterThanOrEqual(MATH_TOPIC_UNLOCK_THRESHOLD);
    expect(isTopicUnlocked(1, mathTopicRegistry, map)).toBe(true); // counting
    expect(isTopicUnlocked(2, mathTopicRegistry, map)).toBe(false); // addition still locked
  });

  it('fully mastering Numbers still does not skip to Addition', () => {
    const map: MathProgressMap = {};
    masterFirst(map, 0, mathTopicRegistry[0].problems.length);
    expect(isTopicUnlocked(1, mathTopicRegistry, map)).toBe(true);
    expect(isTopicUnlocked(2, mathTopicRegistry, map)).toBe(false);
  });
});
