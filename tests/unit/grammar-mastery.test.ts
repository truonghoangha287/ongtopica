import { describe, it, expect } from 'vitest';
import {
  EMPTY_MASTERY,
  applyAttempt,
  accuracy,
  isWeak,
  isUnseen,
} from '@/english/grammar/services/mastery';
import type { RuleMastery } from '@/english/grammar/services/mastery';

const run = (results: boolean[]): RuleMastery =>
  results.reduce((m, correct) => applyAttempt(m, correct), EMPTY_MASTERY);

describe('applyAttempt', () => {
  it('counts a correct attempt', () => {
    expect(applyAttempt(EMPTY_MASTERY, true)).toEqual({
      attempts: 1, correct: 1, streak: 1, gold: false,
    });
  });

  it('resets the streak on a wrong answer', () => {
    const m = run([true, true, false]);
    expect(m.streak).toBe(0);
    expect(m.attempts).toBe(3);
    expect(m.correct).toBe(2);
  });

  it('does not mutate its input', () => {
    const before = { ...EMPTY_MASTERY };
    applyAttempt(before, true);
    expect(before).toEqual(EMPTY_MASTERY);
  });

  it('goes gold at 6 straight correct with 8+ attempts and 80%+ accuracy', () => {
    // 2 wrong then 8 correct → 10 attempts, 80% accuracy, streak 8.
    const m = run([false, false, ...Array(8).fill(true)]);
    expect(m.gold).toBe(true);
  });

  it('does not go gold on a 6-streak with too few attempts', () => {
    const m = run(Array(6).fill(true));
    expect(m.attempts).toBe(6);
    expect(m.gold).toBe(false);
  });

  it('does not go gold when lifetime accuracy is below 80%', () => {
    // 4 wrong then 6 correct → 10 attempts, 60% accuracy, streak 6.
    const m = run([...Array(4).fill(false), ...Array(6).fill(true)]);
    expect(m.streak).toBe(6);
    expect(m.gold).toBe(false);
  });

  it('keeps gold once earned, even after later mistakes', () => {
    let m = run([false, false, ...Array(8).fill(true)]);
    expect(m.gold).toBe(true);
    for (let i = 0; i < 10; i++) m = applyAttempt(m, false);
    expect(m.gold).toBe(true);
    expect(m.streak).toBe(0);
  });
});

describe('accuracy', () => {
  it('is 0 for an unseen rule', () => {
    expect(accuracy(EMPTY_MASTERY)).toBe(0);
  });

  it('is correct / attempts', () => {
    expect(accuracy(run([true, true, false, true]))).toBeCloseTo(0.75);
  });
});

describe('isWeak', () => {
  it('is false before enough attempts to judge', () => {
    expect(isWeak(run([false, false]))).toBe(false);
  });

  it('is true below 70% once there are enough attempts', () => {
    expect(isWeak(run([false, false, false, true]))).toBe(true);
  });

  it('is false at or above 70%', () => {
    expect(isWeak(run([true, true, true, false]))).toBe(false);
  });

  it('stays true for a slipping gold rule', () => {
    let m = run([false, false, ...Array(8).fill(true)]);
    for (let i = 0; i < 12; i++) m = applyAttempt(m, false);
    expect(m.gold).toBe(true);
    expect(isWeak(m)).toBe(true);
  });
});

/**
 * Each pair below straddles one threshold by exactly one step, so a `>` where
 * the code means `>=` (or the reverse) fails here rather than shipping.
 */
describe('threshold boundaries', () => {
  it('goes gold at a streak of exactly 6, not 7', () => {
    // 10 attempts, 8 correct (exactly 80%), streak exactly 6.
    expect(run([true, true, false, false, ...Array(6).fill(true)]).gold).toBe(true);
    // Same totals, streak 5 — one short.
    expect(run([true, true, true, false, false, ...Array(5).fill(true)]).gold).toBe(false);
  });

  it('goes gold at exactly 8 attempts, not 9', () => {
    // 8 attempts, 7 correct, streak 7.
    expect(run([false, ...Array(7).fill(true)]).gold).toBe(true);
    // 7 attempts, streak 6 — meets the streak, one attempt short.
    expect(run([false, ...Array(6).fill(true)]).gold).toBe(false);
  });

  it('goes gold at exactly 80% accuracy, not above it', () => {
    // 10 attempts, 8 correct = 80% on the nose, streak 8.
    expect(run([false, false, ...Array(8).fill(true)]).gold).toBe(true);
    // 10 attempts, 7 correct = 70%, streak 7.
    expect(run([false, false, false, ...Array(7).fill(true)]).gold).toBe(false);
  });

  it('judges weakness from exactly 4 attempts, not 5', () => {
    expect(isWeak(run([false, false, false, false]))).toBe(true);
    expect(isWeak(run([false, false, false]))).toBe(false);
  });

  it('treats exactly 70% as not weak', () => {
    // 10 attempts, 7 correct = 70% on the nose.
    expect(isWeak(run([...Array(7).fill(true), false, false, false]))).toBe(false);
    // One fewer correct = 60%.
    expect(isWeak(run([...Array(6).fill(true), false, false, false, false]))).toBe(true);
  });
});

describe('isUnseen', () => {
  it('is true for a missing rule', () => {
    expect(isUnseen(undefined)).toBe(true);
  });

  it('is false once attempted', () => {
    expect(isUnseen(run([false]))).toBe(false);
  });
});
