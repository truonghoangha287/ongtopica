/**
 * Integration test: 4 consecutive L&L sessions on a 31-word Animals set
 * must collectively present every word at least once (SC-001).
 *
 * Tests the pure composeSession + advanceCursor pipeline without Dexie.
 */
import { describe, it, expect } from 'vitest';
import { composeSession } from '@/english/vocab/services/session-composer';
import { advanceCursor } from '@/english/vocab/services/rotation-cursor';
import { ROTATION_BATCH_SIZE } from '@/shared/constants/game-constants';
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

const animals: WordSet = {
  id: 'animals',
  displayName: 'Animals',
  words: Array.from({ length: 31 }, (_, i) => makeWord(`animal${i}`)),
};

describe('Listen & Learn rotation — 4 sessions cover all 31 animals (SC-001)', () => {
  it('union of all 4 session word ids equals all 31 animal ids', () => {
    const progressMap: Record<string, WordProgressRow> = {};
    let cursor = 0;
    const allPresented = new Set<string>();

    for (let session = 0; session < 4; session++) {
      const items = composeSession(animals, progressMap, {
        stageFilter: 1,
        rotationCursor: cursor,
        sessionWordCount: ROTATION_BATCH_SIZE,
      });

      items.forEach((item) => {
        allPresented.add(item.word.id);
        // Simulate marking as introduced after each session
        if (!progressMap[item.word.id]) {
          progressMap[item.word.id] = {
            id: `c:${item.word.id}`,
            childId: 'c',
            wordId: item.word.id,
            wordSetId: 'animals',
            stage: 1,
            consecutiveCorrect: 0,
            totalIncorrect: 0,
            priorityScore: 1.0,
            lastReviewedAt: Date.now(),
            introducedAt: Date.now(),
          };
        }
      });

      cursor = advanceCursor(cursor, animals.words.length, ROTATION_BATCH_SIZE);
    }

    const allAnimalIds = new Set(animals.words.map((w) => w.id));
    expect(allPresented).toEqual(allAnimalIds);
  });

  it('no session returns more than ROTATION_BATCH_SIZE items', () => {
    let cursor = 0;
    const progressMap: Record<string, WordProgressRow> = {};

    for (let session = 0; session < 4; session++) {
      const items = composeSession(animals, progressMap, {
        stageFilter: 1,
        rotationCursor: cursor,
        sessionWordCount: ROTATION_BATCH_SIZE,
      });
      expect(items.length).toBeLessThanOrEqual(ROTATION_BATCH_SIZE);
      cursor = advanceCursor(cursor, animals.words.length, ROTATION_BATCH_SIZE);
    }
  });

  it('small set (4 words) — one session covers all words', () => {
    const workWords: WordSet = {
      id: 'work',
      displayName: 'Work',
      words: Array.from({ length: 4 }, (_, i) => makeWord(`work${i}`)),
    };
    const items = composeSession(workWords, {}, { stageFilter: 1, rotationCursor: 0 });
    const allWorkIds = new Set(workWords.words.map((w) => w.id));
    const presentedIds = new Set(items.map((i) => i.word.id));
    expect(presentedIds).toEqual(allWorkIds);
  });

  it('rotation restarts predictably after all words heard', () => {
    // After 4 sessions the cursor wraps back; 5th session starts same as 1st
    let cursor = 0;
    for (let s = 0; s < 4; s++) {
      cursor = advanceCursor(cursor, animals.words.length, ROTATION_BATCH_SIZE);
    }
    // cursor after 4 sessions: (0 + 40) % 31 = 9
    expect(cursor).toBe(9);

    // 5th session starts at cursor=9 — different from cursor=0 (rotation continues)
    const items5 = composeSession(animals, {}, { stageFilter: 1, rotationCursor: cursor });
    expect(items5[0].word.id).toBe('animal9');
  });

  it('all items in L&L session have activityType introduce', () => {
    const items = composeSession(animals, {}, { stageFilter: 1, rotationCursor: 0 });
    items.forEach((item) => expect(item.activityType).toBe('introduce'));
  });
});
