import { describe, it, expect } from 'vitest';
import { applyCorrect, applyIncorrect, shouldAdvanceStage } from '@/english/vocab/services/priority-scorer';
import { MASTERY_THRESHOLD, CONFIDENCE_WEIGHT, STRUGGLE_WEIGHT } from '@/shared/constants/game-constants';
import type { WordProgressRow } from '@/shared/db/schema';

const base: WordProgressRow = {
  id: 'p1:w1',
  childId: 'p1',
  wordId: 'w1',
  wordSetId: 'animals',
  stage: 1,
  consecutiveCorrect: 0,
  totalIncorrect: 0,
  priorityScore: 1.0,
  lastReviewedAt: 0,
};

describe('priority-scorer', () => {
  it('applyCorrect increments consecutiveCorrect', () => {
    const r = applyCorrect(base);
    expect(r.consecutiveCorrect).toBe(1);
  });

  it('applyCorrect divides priorityScore by CONFIDENCE_WEIGHT', () => {
    const r = applyCorrect({ ...base, priorityScore: 3.0 });
    expect(r.priorityScore).toBeCloseTo(3.0 / CONFIDENCE_WEIGHT);
  });

  it('applyCorrect advances stage and resets consecutiveCorrect at MASTERY_THRESHOLD', () => {
    const r = applyCorrect({ ...base, consecutiveCorrect: MASTERY_THRESHOLD - 1 });
    expect(r.stage).toBe(2);
    expect(r.consecutiveCorrect).toBe(0);
  });

  it('applyCorrect does not advance stage beyond 4', () => {
    const r = applyCorrect({ ...base, stage: 4, consecutiveCorrect: MASTERY_THRESHOLD - 1 });
    // stage should not be present in partial update when already at 4
    expect(r.stage).toBeUndefined();
  });

  it('applyIncorrect resets consecutiveCorrect', () => {
    const r = applyIncorrect({ ...base, consecutiveCorrect: 2 });
    expect(r.consecutiveCorrect).toBe(0);
  });

  it('applyIncorrect multiplies priorityScore by STRUGGLE_WEIGHT', () => {
    const r = applyIncorrect({ ...base, priorityScore: 1.0 });
    expect(r.priorityScore).toBeCloseTo(STRUGGLE_WEIGHT);
  });

  it('shouldAdvanceStage returns true when consecutiveCorrect >= MASTERY_THRESHOLD and stage < 4', () => {
    expect(shouldAdvanceStage({ ...base, consecutiveCorrect: MASTERY_THRESHOLD })).toBe(true);
  });

  it('shouldAdvanceStage returns false at stage 4', () => {
    expect(shouldAdvanceStage({ ...base, stage: 4, consecutiveCorrect: MASTERY_THRESHOLD })).toBe(false);
  });
});
