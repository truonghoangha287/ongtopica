import { describe, it, expect } from 'vitest';
import { makeRng, pickFrom, shuffle } from '@/english/grammar/services/rng';

describe('makeRng', () => {
  it('is deterministic for a given seed', () => {
    const a = makeRng(42);
    const b = makeRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('produces different streams for different seeds', () => {
    expect(makeRng(1)()).not.toBe(makeRng(2)());
  });

  it('stays within [0, 1)', () => {
    const rng = makeRng(7);
    for (let i = 0; i < 500; i++) {
      const n = rng();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });
});

describe('pickFrom', () => {
  it('returns an element of the array', () => {
    const arr = ['a', 'b', 'c'];
    expect(arr).toContain(pickFrom(arr, makeRng(3)));
  });

  it('returns undefined for an empty array', () => {
    expect(pickFrom([], makeRng(1))).toBeUndefined();
  });
});

describe('shuffle', () => {
  it('keeps every element exactly once', () => {
    const arr = [1, 2, 3, 4, 5];
    const out = shuffle(arr, makeRng(9));
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('does not mutate the input', () => {
    const arr = [1, 2, 3, 4, 5];
    shuffle(arr, makeRng(9));
    expect(arr).toEqual([1, 2, 3, 4, 5]);
  });
});
