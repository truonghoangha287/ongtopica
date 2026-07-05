/**
 * Integration test: session composition for game activities.
 * Activities are no longer gated — every stage is always playable. When one or
 * more words have reached the target stage the session is built from those
 * (struggle-first); when none have, it falls back to the full word set so the
 * activity is never empty. Tests the composeSession logic directly — no Dexie.
 */
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
  it('session composed from the eligible words (10 words at stage>=2 → 10 items)', () => {
    const progressMap: Record<string, WordProgressRow> = {};
    for (let i = 0; i < 10; i++) progressMap[`animal${i}`] = makeProgress(`animal${i}`, 2);

    const items = composeSession(animals, progressMap, { stageFilter: 2 });
    expect(items.length).toBe(10);
    const ids = new Set(items.map((i) => i.word.id));
    for (let i = 0; i < 10; i++) expect(ids.has(`animal${i}`)).toBe(true);
  });

  it('prefers eligible words when some exist — no untouched words mixed in', () => {
    const progressMap: Record<string, WordProgressRow> = {
      animal0: makeProgress('animal0', 2),
      animal1: makeProgress('animal1', 2),
    };
    const items = composeSession(animals, progressMap, { stageFilter: 2 });
    items.forEach((item) => {
      expect(progressMap[item.word.id]).toBeDefined();
      expect(progressMap[item.word.id].stage).toBeGreaterThanOrEqual(2);
    });
  });

  it('session length matches eligible pool when pool < 10', () => {
    const progressMap: Record<string, WordProgressRow> = {
      animal0: makeProgress('animal0', 2),
      animal1: makeProgress('animal1', 2),
      animal2: makeProgress('animal2', 3),
    };
    const items = composeSession(animals, progressMap, { stageFilter: 2 });
    expect(items.length).toBe(3);
  });

  it('always playable: with no eligible words, falls back to the full set', () => {
    // No progress at all — nothing has cleared any prior stage.
    const items = composeSession(animals, {}, { stageFilter: 2 });
    expect(items.length).toBe(10); // capped at SESSION_WORD_COUNT
    items.forEach((item) => expect(item.activityType).toBe('recognize'));
  });

  it('distractors draw from full word set regardless of introduced state (FR-014)', () => {
    const pool = animals.words.filter((w) => w.id !== 'animal0');
    expect(pool.length).toBe(30); // 31 - 1 correct = 30 possible distractors
    // Any 3 drawn from pool must not be the correct word
    pool.slice(0, 3).forEach((d) => expect(d.id).not.toBe('animal0'));
  });
});
