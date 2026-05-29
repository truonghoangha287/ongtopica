import { describe, it, expect } from 'vitest';
import { composeSession } from '@/english/vocab/services/session-composer';
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

// 31-word Animals set
const animals: WordSet = {
  id: 'animals',
  displayName: 'Animals',
  words: Array.from({ length: 31 }, (_, i) => makeWord(`animal${i}`, 'animals')),
};

// 4-word Work set
const work: WordSet = {
  id: 'work',
  displayName: 'Work',
  words: Array.from({ length: 4 }, (_, i) => makeWord(`work${i}`, 'work')),
};

describe('composeSession — Mode A (Listen & Learn rotation)', () => {
  it('fixture: fresh profile, Animals, cursor=0 → first 10 animals in JSON order', () => {
    const items = composeSession(animals, {}, { stageFilter: 1, rotationCursor: 0 });
    expect(items.length).toBe(10);
    expect(items.map((i) => i.word.id)).toEqual(
      Array.from({ length: 10 }, (_, k) => `animal${k}`),
    );
    items.forEach((item) => expect(item.activityType).toBe('introduce'));
  });

  it('fixture: cursor=10 → animals[10..19]', () => {
    const items = composeSession(animals, {}, { stageFilter: 1, rotationCursor: 10 });
    expect(items.map((i) => i.word.id)).toEqual(
      Array.from({ length: 10 }, (_, k) => `animal${10 + k}`),
    );
  });

  it('fixture: cursor=20 → animals[20..29]', () => {
    const items = composeSession(animals, {}, { stageFilter: 1, rotationCursor: 20 });
    expect(items.map((i) => i.word.id)).toEqual(
      Array.from({ length: 10 }, (_, k) => `animal${20 + k}`),
    );
  });

  it('fixture: cursor=30 → animal30 (un-introduced) + animals[0..8] (fill)', () => {
    // animals 0-8 already introduced, animal30 is the only new one
    const progressMap: Record<string, WordProgressRow> = {};
    for (let i = 0; i <= 8; i++) {
      progressMap[`animal${i}`] = {
        id: `c:animal${i}`,
        childId: 'c',
        wordId: `animal${i}`,
        wordSetId: 'animals',
        stage: 1,
        consecutiveCorrect: 0,
        totalIncorrect: 0,
        priorityScore: 1.0,
        lastReviewedAt: 0,
        introducedAt: 1000,
      };
    }
    const items = composeSession(animals, progressMap, { stageFilter: 1, rotationCursor: 30 });
    expect(items.length).toBe(10);
    // un-introduced first
    expect(items[0].word.id).toBe('animal30');
    // then already-introduced in stable order
    expect(items.slice(1).map((i) => i.word.id)).toEqual(
      Array.from({ length: 9 }, (_, k) => `animal${k}`),
    );
  });

  it('fixture: Work (4 words) → returns 4 items (not padded to 10)', () => {
    const items = composeSession(work, {}, { stageFilter: 1, rotationCursor: 0 });
    expect(items.length).toBe(4);
    items.forEach((item) => expect(item.activityType).toBe('introduce'));
  });

  it('never returns duplicate word ids', () => {
    const items = composeSession(animals, {}, { stageFilter: 1, rotationCursor: 25 });
    const ids = items.map((i) => i.word.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
