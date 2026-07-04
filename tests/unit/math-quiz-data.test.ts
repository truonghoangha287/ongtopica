import { describe, it, expect } from 'vitest';
import { MATH_QUIZZES, getQuiz, getOlympiadQuiz, olympiadCount, bandForLevel } from '@/math/data/quizzes';
import { TOPIC_LEVEL_COUNT, OLYMPIAD_DAILY_COUNT } from '@/math/constants/math-constants';
import type { MathTopicId, QuizQuestion } from '@/math/types/math.types';
import mathEn from '@/locales/en/math.json';

const TOPICS = Object.keys(MATH_QUIZZES) as MathTopicId[];

/** Resolve a dotted i18n key against the en/math bundle, or undefined if missing. */
function i18nHas(key: string): boolean {
  let node: unknown = mathEn;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null || !(part in node)) return false;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string';
}

/** Structural + i18n integrity checks applied to every generated question. */
function assertQuestionShape(q: QuizQuestion) {
  expect(q.id, `id present`).toBeTruthy();
  expect(q.band, `${q.id} band in range`).toBeGreaterThanOrEqual(1);
  expect(q.band).toBeLessThanOrEqual(TOPIC_LEVEL_COUNT);
  expect(['seq', 'expr']).toContain(q.type);
  // Options: 2–4 choices, all unique, answer index valid.
  expect(q.options.length, `${q.id} option count`).toBeGreaterThanOrEqual(2);
  expect(q.options.length).toBeLessThanOrEqual(4);
  expect(new Set(q.options).size, `${q.id} options unique`).toBe(q.options.length);
  expect(q.answer, `${q.id} answer index`).toBeGreaterThanOrEqual(0);
  expect(q.answer).toBeLessThan(q.options.length);
  // seq questions carry known tiles; expr questions carry a string (may be '').
  if (q.type === 'seq') expect(q.seq && q.seq.length, `${q.id} seq tiles`).toBeGreaterThan(0);
  // Prompts/hints resolve in the locale bundle (hint may be an empty key '').
  expect(i18nHas(q.promptKey), `missing i18n ${q.promptKey}`).toBe(true);
  if (q.hintKey) expect(i18nHas(q.hintKey), `missing i18n ${q.hintKey}`).toBe(true);
}

/** Verify pure-arithmetic expressions actually equal their marked answer. */
function assertArithmetic(q: QuizQuestion) {
  if (q.type !== 'expr' || !q.expr) return;
  const correct = q.options[q.answer];
  const norm = q.expr.replace(/¢/g, '');
  let m: RegExpMatchArray | null;
  const num = (s: string) => Number(s.replace(/¢/g, ''));
  if ((m = norm.match(/^(\d+) \+ (\d+)$/))) expect(num(correct)).toBe(+m[1] + +m[2]);
  else if ((m = norm.match(/^(\d+) − (\d+)$/))) expect(num(correct)).toBe(+m[1] - +m[2]);
  else if ((m = norm.match(/^(\d+) × (\d+)$/))) expect(num(correct)).toBe(+m[1] * +m[2]);
  else if ((m = norm.match(/^(\d+) ÷ (\d+)$/))) expect(num(correct)).toBe(+m[1] / +m[2]);
  else if ((m = norm.match(/^(\d+) \+ ▢ = (\d+)$/))) expect(num(correct)).toBe(+m[2] - +m[1]);
}

describe('Math question banks', () => {
  it('has a substantial, well-formed bank per topic', () => {
    for (const topic of TOPICS) {
      const bank = MATH_QUIZZES[topic];
      // Enough content that levels do not feel like a fixed sample.
      expect(bank.length, `${topic} bank size`).toBeGreaterThanOrEqual(TOPIC_LEVEL_COUNT * 2);
      for (const q of bank) {
        assertQuestionShape(q);
        assertArithmetic(q);
      }
    }
  });

  it('fills every difficulty band 1..12 for every topic', () => {
    for (const topic of TOPICS) {
      for (let band = 1; band <= TOPIC_LEVEL_COUNT; band++) {
        const inBand = MATH_QUIZZES[topic].filter((q) => q.band === band);
        expect(inBand.length, `${topic} band ${band}`).toBeGreaterThan(0);
      }
    }
  });
});

describe('getQuiz level selection', () => {
  it('returns only the requested level band, and climbs with level', () => {
    for (const topic of TOPICS) {
      for (let level = 1; level <= TOPIC_LEVEL_COUNT; level++) {
        const qs = getQuiz(topic, level);
        expect(qs.length).toBeGreaterThan(0);
        expect(qs.every((q) => q.band === level), `${topic} L${level} band`).toBe(true);
      }
    }
  });

  it('clamps out-of-range levels into [1, TOPIC_LEVEL_COUNT]', () => {
    expect(bandForLevel(0)).toBe(1);
    expect(bandForLevel(-5)).toBe(1);
    expect(bandForLevel(999)).toBe(TOPIC_LEVEL_COUNT);
    expect(getQuiz('addsub', 0).every((q) => q.band === 1)).toBe(true);
    expect(getQuiz('addsub', 999).every((q) => q.band === TOPIC_LEVEL_COUNT)).toBe(true);
  });

  it('falls back to a non-empty quiz for an unknown topic', () => {
    expect(getQuiz('not-a-topic', 1).length).toBeGreaterThan(0);
  });
});

describe('Bee Olympiad banks', () => {
  it('serves a fixed-size daily set per track with valid, translated puzzles', () => {
    for (const track of ['kangaroo', 'sasmo'] as const) {
      const qs = getOlympiadQuiz(track);
      expect(qs.length).toBe(OLYMPIAD_DAILY_COUNT);
      expect(olympiadCount(track)).toBe(OLYMPIAD_DAILY_COUNT);
      for (const q of qs) {
        expect(q.track).toBe(track);
        assertQuestionShape(q);
        assertArithmetic(q);
      }
    }
  });
});
