import { describe, it, expect } from 'vitest';
import {
  isCorrect,
  nextHearts,
  computeStars,
  computeAccuracy,
  progressFraction,
} from '@/math/services/quiz-scorer';
import type { QuizQuestion } from '@/math/types/math.types';

const q: QuizQuestion = {
  id: 'addsub-b1-0',
  band: 1,
  type: 'expr',
  promptKey: 'p',
  hintKey: 'h',
  expr: '7 + 5',
  options: ['11', '12', '13', '14'],
  answer: 1,
};

describe('isCorrect', () => {
  it('matches the answer index', () => {
    expect(isCorrect(1, q)).toBe(true);
    expect(isCorrect(0, q)).toBe(false);
    expect(isCorrect(null, q)).toBe(false);
  });
});

describe('nextHearts', () => {
  it('keeps hearts when correct, spends one when wrong, floors at zero', () => {
    expect(nextHearts(3, true)).toBe(3);
    expect(nextHearts(3, false)).toBe(2);
    expect(nextHearts(0, false)).toBe(0);
  });
});

describe('computeStars', () => {
  it('awards 3 for a clean run, 2 for at least half, else 1', () => {
    expect(computeStars(3, 3)).toBe(3);
    expect(computeStars(2, 3)).toBe(2);
    expect(computeStars(1, 3)).toBe(1);
    expect(computeStars(0, 3)).toBe(1);
  });

  it('never returns 0 — finishing always earns a star', () => {
    expect(computeStars(0, 0)).toBe(1);
  });
});

describe('computeAccuracy', () => {
  it('is a rounded percentage', () => {
    expect(computeAccuracy(2, 3)).toBe(67);
    expect(computeAccuracy(3, 3)).toBe(100);
    expect(computeAccuracy(0, 4)).toBe(0);
    expect(computeAccuracy(1, 0)).toBe(0);
  });
});

describe('progressFraction', () => {
  it('counts a graded question as complete', () => {
    expect(progressFraction(0, false, 3)).toBe(0);
    expect(progressFraction(0, true, 3)).toBeCloseTo(1 / 3);
    expect(progressFraction(2, true, 3)).toBe(1);
    expect(progressFraction(0, false, 0)).toBe(0);
  });
});
