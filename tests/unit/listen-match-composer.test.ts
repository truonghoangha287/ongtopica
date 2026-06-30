import { describe, it, expect } from 'vitest';
import { composeListenMatchSession } from '@/english/vocab/services/session-composer';
import type { WordSet } from '@/shared/types';
import type { WordProgressRow } from '@/shared/db/schema';

const makeWord = (id: string, wordSetId = 'animals') => ({
  id,
  text: id,
  pictureAsset: '',
  audioAsset: '',
  wordSetId,
  blankLetterIndex: 0,
  letterChoices: ['a', 'b', 'c'] as [string, string, string],
});

const animals: WordSet = {
  id: 'animals',
  displayName: 'Animals',
  words: Array.from({ length: 8 }, (_, i) => makeWord(`animal${i}`)),
};

const introducedRow = (wordId: string): WordProgressRow => ({
  id: `c:${wordId}`,
  childId: 'c',
  wordId,
  wordSetId: 'animals',
  stage: 1,
  consecutiveCorrect: 0,
  totalIncorrect: 0,
  priorityScore: 1,
  lastReviewedAt: 0,
  introducedAt: 123,
});

describe('composeListenMatchSession', () => {
  it('only draws from introduced words when ≥2 are introduced', () => {
    const progress = {
      animal0: introducedRow('animal0'),
      animal3: introducedRow('animal3'),
      animal5: introducedRow('animal5'),
    };
    const items = composeListenMatchSession(animals, progress, 10);
    const ids = items.map((i) => i.word.id).sort();
    expect(ids).toEqual(['animal0', 'animal3', 'animal5']);
    items.forEach((i) => expect(i.activityType).toBe('listen-match'));
  });

  it('falls back to the full set when fewer than 2 words are introduced', () => {
    const progress = { animal0: introducedRow('animal0') };
    const items = composeListenMatchSession(animals, progress, 10);
    expect(items.length).toBe(8);
  });

  it('respects the session word-count limit', () => {
    const items = composeListenMatchSession(animals, {}, 5);
    expect(items.length).toBe(5);
  });
});
