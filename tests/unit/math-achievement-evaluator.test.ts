import { describe, it, expect } from 'vitest';
import { evaluateMathAchievements } from '@/math/services/math-achievement-evaluator';
import { MATH_ACHIEVEMENT_IDS } from '@/shared/constants/game-constants';
import type { MathTopic, MathProgressMap } from '@/math/types/math.types';
import type { MathProgressRow } from '@/shared/db/schema';

const topic = (id: string, n: number): MathTopic => ({
  id,
  problems: Array.from({ length: n }, (_, i) => ({
    id: `${id}.${i}`,
    topicId: id,
    type: 'tap-number',
    prompt: { kind: 'numeral', value: i },
    choices: [{ id: 'c0' }, { id: 'c1' }, { id: 'c2' }],
    answerId: 'c0',
    narration: '',
  })),
});

const row = (problemId: string, topicId: string, over: Partial<MathProgressRow> = {}): MathProgressRow => ({
  id: `c:${problemId}`,
  childId: 'c',
  topicId,
  problemId,
  consecutiveCorrect: 0,
  totalIncorrect: 0,
  mastered: false,
  lastReviewedAt: 0,
  ...over,
});

const registry = [topic('numbers', 3), topic('counting', 3)];

describe('evaluateMathAchievements', () => {
  it('awards first steps on the first correct answer', () => {
    const map: MathProgressMap = { 'numbers.0': row('numbers.0', 'numbers', { consecutiveCorrect: 1 }) };
    const earned = evaluateMathAchievements(map, registry, new Set());
    expect(earned).toContain(MATH_ACHIEVEMENT_IDS.FIRST_STEPS);
  });

  it('does not re-award an already-earned achievement', () => {
    const map: MathProgressMap = { 'numbers.0': row('numbers.0', 'numbers', { consecutiveCorrect: 1 }) };
    const earned = evaluateMathAchievements(map, registry, new Set([MATH_ACHIEVEMENT_IDS.FIRST_STEPS]));
    expect(earned).not.toContain(MATH_ACHIEVEMENT_IDS.FIRST_STEPS);
  });

  it('awards topic master only when every problem in the topic is mastered', () => {
    const map: MathProgressMap = {};
    for (let i = 0; i < 3; i++) map[`numbers.${i}`] = row(`numbers.${i}`, 'numbers', { mastered: true });
    const earned = evaluateMathAchievements(map, registry, new Set());
    expect(earned).toContain(`${MATH_ACHIEVEMENT_IDS.TOPIC_MASTER}:numbers`);
    expect(earned).not.toContain(`${MATH_ACHIEVEMENT_IDS.TOPIC_MASTER}:counting`);
  });

  it('does not award topic master with a partially mastered topic', () => {
    const map: MathProgressMap = {
      'numbers.0': row('numbers.0', 'numbers', { mastered: true }),
      'numbers.1': row('numbers.1', 'numbers', { mastered: true }),
    };
    const earned = evaluateMathAchievements(map, registry, new Set());
    expect(earned).not.toContain(`${MATH_ACHIEVEMENT_IDS.TOPIC_MASTER}:numbers`);
  });
});
