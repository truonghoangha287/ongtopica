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

  it('produces many distinct values over many calls', () => {
    const rng = makeRng(99);
    const values = new Set<number>();
    for (let i = 0; i < 200; i++) {
      values.add(rng());
    }
    expect(values.size).toBeGreaterThan(100);
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

  it('returns different elements across multiple calls', () => {
    const arr = ['a', 'b', 'c', 'd', 'e'];
    const rng = makeRng(55);
    const results = new Set<string | undefined>();
    for (let i = 0; i < 50; i++) {
      results.add(pickFrom(arr, rng));
    }
    expect(results.size).toBeGreaterThan(1);
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

  it('produces different orderings across multiple shuffles', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const rng = makeRng(77);
    const orderings = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const shuffled = shuffle(arr, rng);
      orderings.add(JSON.stringify([...shuffled]));
    }
    expect(orderings.size).toBeGreaterThan(1);
  });
});
