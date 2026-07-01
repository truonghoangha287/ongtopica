import { describe, it, expect } from 'vitest';
import { composeMathSession } from '@/math/services/math-session-composer';
import type { MathTopic, MathProgressMap } from '@/math/types/math.types';
import type { MathProgressRow } from '@/shared/db/schema';

const topic = (n: number): MathTopic => ({
  id: 'numbers',
  problems: Array.from({ length: n }, (_, i) => ({
    id: `numbers.${i}`,
    topicId: 'numbers',
    type: 'tap-number',
    prompt: { kind: 'numeral', value: i },
    choices: [{ id: 'c0' }, { id: 'c1' }, { id: 'c2' }],
    answerId: 'c0',
    narration: '',
  })),
});

const prog = (problemId: string, over: Partial<MathProgressRow> = {}): MathProgressRow => ({
  id: `c:${problemId}`,
  childId: 'c',
  topicId: 'numbers',
  problemId,
  consecutiveCorrect: 0,
  totalIncorrect: 0,
  mastered: false,
  lastReviewedAt: 0,
  ...over,
});

describe('composeMathSession', () => {
  it('never returns more than the session size', () => {
    const items = composeMathSession(topic(20), {}, { sessionSize: 8 });
    expect(items.length).toBe(8);
  });

  it('returns the whole topic when it is smaller than the session size', () => {
    const items = composeMathSession(topic(5), {}, { sessionSize: 8 });
    expect(items.length).toBe(5);
  });

  it('only includes problems from the given topic', () => {
    const items = composeMathSession(topic(12), {}, { sessionSize: 8 });
    items.forEach((p) => expect(p.topicId).toBe('numbers'));
  });

  it('has no duplicates', () => {
    const items = composeMathSession(topic(8), {}, { sessionSize: 8 });
    expect(new Set(items.map((p) => p.id)).size).toBe(items.length);
  });

  it('prioritises previously-missed and unmastered problems over mastered ones', () => {
    const t = topic(10);
    const map: MathProgressMap = {};
    // problems 0..6 mastered, 7 missed, 8 & 9 fresh (no row)
    for (let i = 0; i <= 6; i++) map[`numbers.${i}`] = prog(`numbers.${i}`, { mastered: true, consecutiveCorrect: 2 });
    map['numbers.7'] = prog('numbers.7', { totalIncorrect: 2 });
    const items = composeMathSession(t, map, { sessionSize: 3 });
    const ids = items.map((p) => p.id);
    // The 3 chosen should be the missed + the 2 fresh — no mastered ones yet.
    expect(ids).toContain('numbers.7');
    expect(ids).toContain('numbers.8');
    expect(ids).toContain('numbers.9');
    ids.forEach((id) => expect(map[id]?.mastered).not.toBe(true));
  });
});
