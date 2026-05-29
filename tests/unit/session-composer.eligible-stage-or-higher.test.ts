import { describe, it, expect } from 'vitest';
import { composeSession } from '@/english/vocab/services/session-composer';
import type { WordSet } from '@/shared/types';
import type { WordProgressRow } from '@/shared/db/schema';

const makeWord = (id: string) => ({
  id,
  text: id,
  pictureAsset: '',
  audioAsset: '',
  wordSetId: 'animals',
  blankLetterIndex: 0,
  letterChoices: ['a', 'b', 'c'] as [string, string, string],
});

const makeProgress = (
  wordId: string,
  stage: 1 | 2 | 3 | 4,
  priorityScore = 1.0,
): WordProgressRow => ({
  id: `c:${wordId}`,
  childId: 'c',
  wordId,
  wordSetId: 'animals',
  stage,
  consecutiveCorrect: 0,
  totalIncorrect: 0,
  priorityScore,
  lastReviewedAt: 0,
  introducedAt: 1000,
});

const animals: WordSet = {
  id: 'animals',
  displayName: 'Animals',
  words: Array.from({ length: 31 }, (_, i) => makeWord(`animal${i}`)),
};

describe('composeSession — Mode B (eligible stage >= target)', () => {
  it('fixture: Recognize with 5 words at stage=2 → 5 items, all recognize', () => {
    const progressMap: Record<string, WordProgressRow> = {};
    for (let i = 0; i < 5; i++) progressMap[`animal${i}`] = makeProgress(`animal${i}`, 2);

    const items = composeSession(animals, progressMap, { stageFilter: 2 });
    expect(items.length).toBe(5);
    items.forEach((item) => expect(item.activityType).toBe('recognize'));
  });

  it('fixture: Recognize with 5 at stage=2 and 3 at stage=4 → 8 items (stage>=2 rule)', () => {
    const progressMap: Record<string, WordProgressRow> = {};
    for (let i = 0; i < 5; i++) progressMap[`animal${i}`] = makeProgress(`animal${i}`, 2);
    for (let i = 5; i < 8; i++) progressMap[`animal${i}`] = makeProgress(`animal${i}`, 4, 0.1);

    const items = composeSession(animals, progressMap, { stageFilter: 2 });
    expect(items.length).toBe(8);
    items.forEach((item) => expect(item.activityType).toBe('recognize'));
    // mastered words (low priority) should be last; among equal-priority, stable sort preserves JSON order
    expect(items[7].word.id).toBe('animal7');
  });

  it('fixture: Unscramble with zero stage>=3 words → 0 items', () => {
    const progressMap: Record<string, WordProgressRow> = {};
    for (let i = 0; i < 5; i++) progressMap[`animal${i}`] = makeProgress(`animal${i}`, 2);

    const items = composeSession(animals, progressMap, { stageFilter: 3 });
    expect(items.length).toBe(0);
  });

  it('items are sorted by priorityScore desc (struggle-first)', () => {
    const progressMap: Record<string, WordProgressRow> = {
      animal0: makeProgress('animal0', 2, 3.0),
      animal1: makeProgress('animal1', 2, 1.0),
      animal2: makeProgress('animal2', 2, 2.0),
    };
    const items = composeSession(animals, progressMap, { stageFilter: 2 });
    expect(items[0].word.id).toBe('animal0');
    expect(items[1].word.id).toBe('animal2');
    expect(items[2].word.id).toBe('animal1');
  });

  it('stage=4 words are included in stage=2 session (stage>=2 rule)', () => {
    const progressMap: Record<string, WordProgressRow> = {
      animal0: makeProgress('animal0', 4, 0.1),
    };
    const items = composeSession(animals, progressMap, { stageFilter: 2 });
    expect(items.length).toBe(1);
    expect(items[0].activityType).toBe('recognize'); // target stage, not word's stage
  });

  it('activityType is always the target stage, not the word current stage', () => {
    const progressMap: Record<string, WordProgressRow> = {
      animal0: makeProgress('animal0', 3, 1.0), // stage 3 but session is recognize (stage 2)
      animal1: makeProgress('animal1', 4, 0.5),
    };
    const items = composeSession(animals, progressMap, { stageFilter: 2 });
    items.forEach((item) => expect(item.activityType).toBe('recognize'));
  });

  it('never returns more than SESSION_WORD_COUNT items', () => {
    const progressMap: Record<string, WordProgressRow> = {};
    for (let i = 0; i < 15; i++) progressMap[`animal${i}`] = makeProgress(`animal${i}`, 2);

    const items = composeSession(animals, progressMap, { stageFilter: 2 });
    expect(items.length).toBeLessThanOrEqual(10);
  });
});
