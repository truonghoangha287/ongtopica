import { describe, it, expect } from 'vitest';
import { composeSession } from '@/english/vocab/services/session-composer';
import { SESSION_WORD_COUNT } from '@/shared/constants/game-constants';
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

describe('composeSession — Mode B (single-activity, no stage gating)', () => {
  it('Recognize draws from the full set regardless of stage → capped at SESSION_WORD_COUNT', () => {
    const progressMap: Record<string, WordProgressRow> = {};
    for (let i = 0; i < 5; i++) progressMap[`animal${i}`] = makeProgress(`animal${i}`, 2);

    const items = composeSession(animals, progressMap, { stageFilter: 2 });
    expect(items.length).toBe(SESSION_WORD_COUNT);
    items.forEach((item) => expect(item.activityType).toBe('recognize'));
  });

  it('Unscramble includes words that never reached stage 3 (no gating)', () => {
    const progressMap: Record<string, WordProgressRow> = {};
    // Only stage-2 words exist — previously these were excluded from an unscramble session.
    for (let i = 0; i < 5; i++) progressMap[`animal${i}`] = makeProgress(`animal${i}`, 2);

    const items = composeSession(animals, progressMap, { stageFilter: 3 });
    expect(items.length).toBe(SESSION_WORD_COUNT);
    items.forEach((item) => expect(item.activityType).toBe('unscramble'));
  });

  it('with no progress at all, still returns a full session for a higher activity', () => {
    const items = composeSession(animals, {}, { stageFilter: 3 });
    expect(items.length).toBe(SESSION_WORD_COUNT);
    items.forEach((item) => expect(item.activityType).toBe('unscramble'));
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

  it('unstarted words (priorityScore 0) keep JSON order at the tail', () => {
    const progressMap: Record<string, WordProgressRow> = {
      animal5: makeProgress('animal5', 2, 2.0),
    };
    const items = composeSession(animals, progressMap, { stageFilter: 2 });
    // The one word with progress comes first; the rest follow in JSON order.
    expect(items[0].word.id).toBe('animal5');
    expect(items[1].word.id).toBe('animal0');
    expect(items[2].word.id).toBe('animal1');
  });

  it('activityType is always the target activity, not the word current stage', () => {
    const progressMap: Record<string, WordProgressRow> = {
      animal0: makeProgress('animal0', 3, 1.0), // stage 3 but session is recognize
      animal1: makeProgress('animal1', 4, 0.5),
    };
    const items = composeSession(animals, progressMap, { stageFilter: 2 });
    items.forEach((item) => expect(item.activityType).toBe('recognize'));
  });

  it('never returns more than SESSION_WORD_COUNT items', () => {
    const progressMap: Record<string, WordProgressRow> = {};
    for (let i = 0; i < 15; i++) progressMap[`animal${i}`] = makeProgress(`animal${i}`, 2);

    const items = composeSession(animals, progressMap, { stageFilter: 2 });
    expect(items.length).toBeLessThanOrEqual(SESSION_WORD_COUNT);
  });
});
