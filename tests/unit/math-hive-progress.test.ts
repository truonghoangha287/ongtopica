import { describe, it, expect } from 'vitest';
import {
  totalStars,
  isTopicUnlocked,
  hubSummary,
  currentTopic,
  mergeHiveResult,
  nextStreak,
} from '@/math/services/hive-progress';
import type { ProgressMap } from '@/math/services/hive-progress';
import { MATH_TOPICS, getTopic } from '@/math/data/topics';
import { LOGIC_UNLOCK_STARS } from '@/math/constants/math-constants';

const counting = getTopic('counting')!;
const logic = getTopic('logic')!;

describe('totalStars', () => {
  it('sums best stars across topics', () => {
    const p: ProgressMap = { counting: { stars: 3, level: 2 }, shapes: { stars: 2, level: 1 } };
    expect(totalStars(p)).toBe(5);
    expect(totalStars({})).toBe(0);
  });
});

describe('isTopicUnlocked', () => {
  it('always unlocks non-locked topics', () => {
    expect(isTopicUnlocked(counting, {})).toBe(true);
  });

  it('gates the locked Logic hex behind the star threshold', () => {
    expect(isTopicUnlocked(logic, {})).toBe(false);
    // Aggregate star counts above the per-topic max (3) are a test shortcut for
    // reaching the unlock threshold — cast past the 0 | StarRating field type.
    const almost: ProgressMap = { counting: { stars: (LOGIC_UNLOCK_STARS - 1) as 0 | 1 | 2 | 3, level: 1 } };
    expect(isTopicUnlocked(logic, almost)).toBe(false);
    const enough: ProgressMap = { counting: { stars: LOGIC_UNLOCK_STARS as 0 | 1 | 2 | 3, level: 1 } };
    expect(isTopicUnlocked(logic, enough)).toBe(true);
  });
});

describe('hubSummary', () => {
  it('counts fully-mastered (3★) cells out of the total', () => {
    const p: ProgressMap = { counting: { stars: 3, level: 2 }, shapes: { stars: 2, level: 1 } };
    expect(hubSummary(MATH_TOPICS, p)).toEqual({ mastered: 1, total: MATH_TOPICS.length });
  });
});

describe('currentTopic', () => {
  it('is the first unlocked, not-yet-mastered topic in ladder order', () => {
    // Fresh child → the very first topic.
    expect(currentTopic(MATH_TOPICS, {})?.id).toBe('counting');
    // Master counting → focus moves to the next ladder topic.
    const p: ProgressMap = { counting: { stars: 3, level: 2 } };
    expect(currentTopic(MATH_TOPICS, p)?.id).toBe(MATH_TOPICS[1].id);
  });

  it('is undefined once everything unlocked is mastered', () => {
    const p: ProgressMap = {};
    for (const t of MATH_TOPICS) {
      if (!t.locked) p[t.id] = { stars: 3, level: 2 };
    }
    // Logic is still locked (0 stars sum came only from unlocked ones = plenty),
    // so it may now be unlocked; mark it mastered too to be exhaustive.
    p.logic = { stars: 3, level: 2 };
    expect(currentTopic(MATH_TOPICS, p)).toBeUndefined();
  });
});

describe('mergeHiveResult', () => {
  it('keeps the best-ever stars and advances the level', () => {
    expect(mergeHiveResult(undefined, 2)).toEqual({ stars: 2, level: 2 });
    expect(mergeHiveResult({ stars: 3, level: 4 }, 1)).toEqual({ stars: 3, level: 5 });
    expect(mergeHiveResult({ stars: 1, level: 1 }, 3)).toEqual({ stars: 3, level: 2 });
  });
});

describe('nextStreak', () => {
  it('keeps the streak on a same-day replay', () => {
    expect(nextStreak(5, 100, 100)).toBe(5);
    expect(nextStreak(0, 100, 100)).toBe(1);
  });

  it('increments on the next consecutive day', () => {
    expect(nextStreak(5, 100, 101)).toBe(6);
  });

  it('resets to 1 after a gap (and for a first-ever completion)', () => {
    expect(nextStreak(5, 100, 103)).toBe(1);
    expect(nextStreak(0, 0, 20000)).toBe(1);
  });
});
