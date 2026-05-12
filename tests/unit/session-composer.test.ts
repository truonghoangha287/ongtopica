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
  wordSetId: 'test',
  blankLetterIndex: 0,
  letterChoices: ['a', 'b', 'c'] as [string, string, string],
});

const wordSet: WordSet = {
  id: 'test',
  displayName: 'Test',
  words: Array.from({ length: 15 }, (_, i) => makeWord(`word${i}`)),
};

describe('session-composer', () => {
  it('fills SESSION_WORD_COUNT slots', () => {
    const items = composeSession(wordSet, {}, { sessionWordCount: SESSION_WORD_COUNT });
    expect(items.length).toBe(SESSION_WORD_COUNT);
  });

  it('in-progress words come first, sorted by priorityScore DESC', () => {
    const progressMap: Record<string, WordProgressRow> = {
      word0: {
        id: 'p:word0',
        childId: 'p',
        wordId: 'word0',
        wordSetId: 'test',
        stage: 1,
        consecutiveCorrect: 0,
        totalIncorrect: 0,
        priorityScore: 2.0,
        lastReviewedAt: 0,
      },
      word1: {
        id: 'p:word1',
        childId: 'p',
        wordId: 'word1',
        wordSetId: 'test',
        stage: 1,
        consecutiveCorrect: 0,
        totalIncorrect: 0,
        priorityScore: 0.5,
        lastReviewedAt: 0,
      },
    };
    const items = composeSession(wordSet, progressMap, { sessionWordCount: 5 });
    expect(items[0].word.id).toBe('word0');
    expect(items[1].word.id).toBe('word1');
  });

  it('fills remaining slots with unstarted words at Stage 1 (introduce)', () => {
    const items = composeSession(wordSet, {}, { sessionWordCount: 3 });
    items.forEach((item) => expect(item.activityType).toBe('introduce'));
  });

  it('does not include words from other sets', () => {
    const items = composeSession(wordSet, {}, { sessionWordCount: SESSION_WORD_COUNT });
    items.forEach((item) => expect(item.word.wordSetId).toBe('test'));
  });
});
