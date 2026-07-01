import { describe, it, expect } from 'vitest';
import {
  topicMasteryFraction,
  isTopicUnlocked,
  masteredCount,
} from '@/math/services/topic-progression';
import { MATH_TOPIC_UNLOCK_THRESHOLD } from '@/shared/constants/game-constants';
import type { MathTopic, MathProgressMap } from '@/math/types/math.types';
import type { MathProgressRow } from '@/shared/db/schema';

const makeTopic = (id: string, n: number): MathTopic => ({
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

const mastered = (problemId: string, topicId: string): MathProgressRow => ({
  id: `c:${problemId}`,
  childId: 'c',
  topicId,
  problemId,
  consecutiveCorrect: 2,
  totalIncorrect: 0,
  mastered: true,
  lastReviewedAt: 0,
});

const registry = [makeTopic('numbers', 10), makeTopic('counting', 10), makeTopic('addition', 10)];

describe('topic-progression', () => {
  it('topicMasteryFraction is mastered/total, 0 for an empty topic', () => {
    const map: MathProgressMap = {};
    for (let i = 0; i < 5; i++) map[`numbers.${i}`] = mastered(`numbers.${i}`, 'numbers');
    expect(topicMasteryFraction(registry[0], map)).toBe(0.5);
    expect(topicMasteryFraction(makeTopic('empty', 0), map)).toBe(0);
    expect(masteredCount(registry[0], map)).toBe(5);
  });

  it('first topic is always unlocked', () => {
    expect(isTopicUnlocked(0, registry, {})).toBe(true);
  });

  it('a later topic stays locked until the previous crosses the threshold', () => {
    const map: MathProgressMap = {};
    // 4/10 mastered = 0.4 < 0.5 → counting stays locked
    for (let i = 0; i < 4; i++) map[`numbers.${i}`] = mastered(`numbers.${i}`, 'numbers');
    expect(isTopicUnlocked(1, registry, map)).toBe(false);
    // add one more → 5/10 = 0.5 >= threshold → counting unlocks
    map['numbers.4'] = mastered('numbers.4', 'numbers');
    expect(topicMasteryFraction(registry[0], map)).toBeGreaterThanOrEqual(MATH_TOPIC_UNLOCK_THRESHOLD);
    expect(isTopicUnlocked(1, registry, map)).toBe(true);
  });

  it('mastering one topic does not unlock topics two steps ahead', () => {
    const map: MathProgressMap = {};
    for (let i = 0; i < 10; i++) map[`numbers.${i}`] = mastered(`numbers.${i}`, 'numbers');
    // counting (index 1) unlocks, but addition (index 2) needs counting mastery
    expect(isTopicUnlocked(1, registry, map)).toBe(true);
    expect(isTopicUnlocked(2, registry, map)).toBe(false);
  });
});
