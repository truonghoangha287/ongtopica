import { describe, it, expect } from 'vitest';
import { isMastered, applyCorrect, applyIncorrect } from '@/math/services/math-scorer';
import { MATH_MASTERY_THRESHOLD } from '@/shared/constants/game-constants';
import type { MathProgressRow } from '@/shared/db/schema';

const row = (over: Partial<MathProgressRow> = {}): MathProgressRow => ({
  id: 'c:p1',
  childId: 'c',
  topicId: 'numbers',
  problemId: 'p1',
  consecutiveCorrect: 0,
  totalIncorrect: 0,
  mastered: false,
  lastReviewedAt: 0,
  ...over,
});

describe('math-scorer', () => {
  it('isMastered reflects the threshold and the sticky flag', () => {
    expect(isMastered(row({ consecutiveCorrect: 0 }))).toBe(false);
    expect(isMastered(row({ consecutiveCorrect: MATH_MASTERY_THRESHOLD }))).toBe(true);
    expect(isMastered(row({ consecutiveCorrect: 0, mastered: true }))).toBe(true);
  });

  it('applyCorrect increments the streak', () => {
    const next = applyCorrect(row({ consecutiveCorrect: 0 }));
    expect(next.consecutiveCorrect).toBe(1);
    expect(next.mastered).toBe(false);
  });

  it('applyCorrect sets mastered once the threshold is reached', () => {
    const next = applyCorrect(row({ consecutiveCorrect: MATH_MASTERY_THRESHOLD - 1 }));
    expect(next.consecutiveCorrect).toBe(MATH_MASTERY_THRESHOLD);
    expect(next.mastered).toBe(true);
  });

  it('applyIncorrect resets the streak and counts the miss', () => {
    const next = applyIncorrect(row({ consecutiveCorrect: 1, totalIncorrect: 2 }));
    expect(next.consecutiveCorrect).toBe(0);
    expect(next.totalIncorrect).toBe(3);
  });

  it('a wrong answer never revokes mastery already earned', () => {
    const next = applyIncorrect(row({ mastered: true, consecutiveCorrect: 0 }));
    // applyIncorrect does not touch `mastered`, so it stays true on the merged row.
    expect(next.mastered).toBeUndefined();
    expect(isMastered({ ...row({ mastered: true }), ...next })).toBe(true);
  });
});
