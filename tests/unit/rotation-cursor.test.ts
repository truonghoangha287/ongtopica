import { describe, it, expect } from 'vitest';
import { advanceCursor, buildBatchIndices } from '@/english/vocab/services/rotation-cursor';

describe('advanceCursor', () => {
  it('advances by batch size', () => {
    expect(advanceCursor(0, 31, 10)).toBe(10);
    expect(advanceCursor(10, 31, 10)).toBe(20);
    expect(advanceCursor(20, 31, 10)).toBe(30);
  });

  it('wraps around at end of word list', () => {
    expect(advanceCursor(30, 31, 10)).toBe(9); // (30+10) % 31 = 9
  });

  it('returns 0 when totalWords is 0', () => {
    expect(advanceCursor(0, 0, 10)).toBe(0);
  });

  it('works for small sets (size < batch)', () => {
    // Work set: 4 words, cursor 0 → (0+10) % 4 = 2
    expect(advanceCursor(0, 4, 10)).toBe(2);
  });
});

describe('buildBatchIndices', () => {
  const allFalse = (n: number) => Array(n).fill(false) as boolean[];

  it('returns first 10 indices for fresh 31-word set at cursor 0', () => {
    const result = buildBatchIndices(0, 31, allFalse(31), 10);
    expect(result).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('returns indices 10-19 at cursor 10', () => {
    const result = buildBatchIndices(10, 31, allFalse(31), 10);
    expect(result).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  });

  it('wraps around at end: cursor=30, set=31 → [30, 0..8]', () => {
    const result = buildBatchIndices(30, 31, allFalse(31), 10);
    expect(result).toEqual([30, 0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('returns all 4 words for small set (Work) — no duplicates', () => {
    const result = buildBatchIndices(0, 4, allFalse(4), 10);
    expect(result).toEqual([0, 1, 2, 3]);
    expect(result.length).toBe(4);
  });

  it('prefers un-introduced words first in wrap scenario', () => {
    // 31 words, cursor=30, first 9 already introduced (indices 0-8), rest fresh
    const flags = Array(31).fill(false);
    for (let i = 0; i <= 8; i++) flags[i] = true; // 0..8 introduced
    // Window: [30, 0,1,2,3,4,5,6,7,8] → unintroduced=[30], introduced=[0..8]
    const result = buildBatchIndices(30, 31, flags, 10);
    expect(result[0]).toBe(30); // un-introduced first
    expect(result.slice(1)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('returns empty array for 0-word set', () => {
    const result = buildBatchIndices(0, 0, [], 10);
    expect(result).toEqual([]);
  });

  it('deduplicates indices when set smaller than batch', () => {
    // 3-word set, cursor 0 — wrapping would repeat indices
    const result = buildBatchIndices(0, 3, allFalse(3), 10);
    const unique = new Set(result);
    expect(unique.size).toBe(result.length);
    expect(result.length).toBe(3);
  });

  it('maintains stable JSON order within each partition', () => {
    const flags = [false, true, false, true, false]; // 5 words
    // all in one window at cursor 0 → unintroduced: [0,2,4], introduced: [1,3]
    const result = buildBatchIndices(0, 5, flags, 10);
    expect(result).toEqual([0, 2, 4, 1, 3]);
  });
});
