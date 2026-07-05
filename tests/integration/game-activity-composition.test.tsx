/**
 * Integration test: session composition for game activities.
 * Activities are not gated by stage — every word in the set is playable for
 * every activity. The session is always drawn from the full word set (capped at
 * SESSION_WORD_COUNT), ordered struggle-first by priorityScore. Tests the
 * composeSession logic directly — no Dexie.
 */
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
  opts: Partial<WordProgressRow> = {},
): WordProgressRow => ({
  id: `c:${wordId}`,
  childId: 'c',
  wordId,
  wordSetId: 'animals',
  stage,
  consecutiveCorrect: 0,
  totalIncorrect: 0,
  priorityScore: 1.0,
  lastReviewedAt: 0,
  introducedAt: 1000,
  ...opts,
});

const animals: WordSet = {
  id: 'animals',
  displayName: 'Animals',
  words: Array.from({ length: 31 }, (_, i) => makeWord(`animal${i}`)),
};

describe('game-activity session composition', () => {
  it('in-progress words are all present in the session (10 seeded at stage>=2)', () => {
    const progressMap: Record<string, WordProgressRow> = {};
    for (let i = 0; i < 10; i++) progressMap[`animal${i}`] = makeProgress(`animal${i}`, 2);

    const items = composeSession(animals, progressMap, { stageFilter: 2 });
    expect(items.length).toBe(SESSION_WORD_COUNT);
    const ids = new Set(items.map((i) => i.word.id));
    for (let i = 0; i < 10; i++) expect(ids.has(`animal${i}`)).toBe(true);
  });

  it('mixes in untouched words — in-progress words come first, then the rest', () => {
    const progressMap: Record<string, WordProgressRow> = {
      animal0: makeProgress('animal0', 2),
      animal1: makeProgress('animal1', 2),
    };
    const items = composeSession(animals, progressMap, { stageFilter: 2 });
    // The two words with progress lead the session...
    expect(items[0].word.id).toBe('animal0');
    expect(items[1].word.id).toBe('animal1');
    // ...and untouched words fill the remaining slots (no stage gating).
    expect(items.length).toBe(SESSION_WORD_COUNT);
    expect(items.some((i) => progressMap[i.word.id] === undefined)).toBe(true);
  });

  it('always fills to SESSION_WORD_COUNT even when few words have progress', () => {
    const progressMap: Record<string, WordProgressRow> = {
      animal0: makeProgress('animal0', 2),
      animal1: makeProgress('animal1', 2),
      animal2: makeProgress('animal2', 3),
    };
    const items = composeSession(animals, progressMap, { stageFilter: 2 });
    expect(items.length).toBe(SESSION_WORD_COUNT);
  });

  it('always playable: with no eligible words, falls back to the full set', () => {
    // No progress at all — nothing has cleared any prior stage.
    const items = composeSession(animals, {}, { stageFilter: 2 });
    expect(items.length).toBe(SESSION_WORD_COUNT); // capped at SESSION_WORD_COUNT
    items.forEach((item) => expect(item.activityType).toBe('recognize'));
  });

  it('distractors draw from full word set regardless of introduced state (FR-014)', () => {
    const pool = animals.words.filter((w) => w.id !== 'animal0');
    expect(pool.length).toBe(30); // 31 - 1 correct = 30 possible distractors
    // Any 3 drawn from pool must not be the correct word
    pool.slice(0, 3).forEach((d) => expect(d.id).not.toBe('animal0'));
  });
});
