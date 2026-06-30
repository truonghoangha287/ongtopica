import { describe, it, expect } from 'vitest';
import { pickMemoryWords, buildMemoryDeck } from '@/english/vocab/services/memory-match';
import type { WordSet } from '@/shared/types';
import type { WordProgressRow } from '@/shared/db/schema';

const makeWord = (id: string) => ({
  id,
  text: id,
  pictureAsset: `${id}.webp`,
  audioAsset: '',
  wordSetId: 'animals',
  blankLetterIndex: 0,
  letterChoices: ['a', 'b', 'c'] as [string, string, string],
});

const animals: WordSet = {
  id: 'animals',
  displayName: 'Animals',
  words: Array.from({ length: 10 }, (_, i) => makeWord(`a${i}`)),
};

const introduced = (wordId: string): WordProgressRow => ({
  id: `c:${wordId}`,
  childId: 'c',
  wordId,
  wordSetId: 'animals',
  stage: 1,
  consecutiveCorrect: 0,
  totalIncorrect: 0,
  priorityScore: 1,
  lastReviewedAt: 0,
  introducedAt: 1,
});

describe('pickMemoryWords', () => {
  it('prefers introduced words when enough exist', () => {
    const progress = Object.fromEntries(
      ['a2', 'a4', 'a6', 'a7', 'a8', 'a9'].map((id) => [id, introduced(id)]),
    );
    const words = pickMemoryWords(animals, progress, 6);
    expect(words.map((w) => w.id).sort()).toEqual(['a2', 'a4', 'a6', 'a7', 'a8', 'a9']);
  });

  it('falls back to the start of the set when too few are introduced', () => {
    const words = pickMemoryWords(animals, {}, 6);
    expect(words.map((w) => w.id)).toEqual(['a0', 'a1', 'a2', 'a3', 'a4', 'a5']);
  });

  it('never returns more than the available words', () => {
    const small: WordSet = { id: 'x', displayName: 'X', words: [makeWord('only')] };
    expect(pickMemoryWords(small, {}, 6)).toHaveLength(1);
  });
});

describe('buildMemoryDeck', () => {
  const words = [makeWord('a0'), makeWord('a1'), makeWord('a2')];

  it('produces exactly two cards (one picture, one word) per word', () => {
    const deck = buildMemoryDeck(words, 'seed');
    expect(deck).toHaveLength(6);
    for (const w of words) {
      const pair = deck.filter((c) => c.wordId === w.id);
      expect(pair).toHaveLength(2);
      expect(pair.map((c) => c.kind).sort()).toEqual(['picture', 'word']);
    }
  });

  it('is deterministic for a given seed', () => {
    const a = buildMemoryDeck(words, 'seed-1').map((c) => c.id);
    const b = buildMemoryDeck(words, 'seed-1').map((c) => c.id);
    expect(a).toEqual(b);
  });

  it('varies across seeds (not every seed yields the same order)', () => {
    const orders = ['s0', 's1', 's2', 's3', 's4', 's5'].map((s) =>
      buildMemoryDeck(words, s).map((c) => c.id).join(','),
    );
    expect(new Set(orders).size).toBeGreaterThan(1);
  });
});
