import { describe, it, expect } from 'vitest';
import { evaluateAchievements } from '@/english/vocab/services/achievement-evaluator';
import { ACHIEVEMENT_IDS, MASTERY_THRESHOLD } from '@/shared/constants/game-constants';
import type { WordSet } from '@/shared/types';
import type { WordProgressRow } from '@/shared/db/schema';

const makeWord = (id: string, setId = 'animals') => ({
  id,
  text: id,
  pictureAsset: '',
  audioAsset: '',
  wordSetId: setId,
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
  consecutiveCorrect: stage === 4 ? MASTERY_THRESHOLD : 0,
  totalIncorrect: 0,
  priorityScore: 1.0,
  lastReviewedAt: 0,
  introducedAt: 1000,
  ...opts,
});

const smallSet: WordSet = {
  id: 'animals',
  displayName: 'Animals',
  words: [makeWord('a0'), makeWord('a1'), makeWord('a2')],
};

const weatherSet: WordSet = {
  id: 'weather',
  displayName: 'Weather',
  words: [makeWord('w0', 'weather'), makeWord('w1', 'weather')],
};

describe('evaluateAchievements', () => {
  it('returns first_listen when at least one word has introducedAt set', () => {
    const pm: Record<string, WordProgressRow> = {
      a0: makeProgress('a0', 1),
    };
    const result = evaluateAchievements(pm, [smallSet], new Set());
    expect(result).toContain(ACHIEVEMENT_IDS.FIRST_LISTEN);
  });

  it('does not return first_listen if no word is introduced', () => {
    const pm: Record<string, WordProgressRow> = {
      a0: makeProgress('a0', 1, { introducedAt: null }),
    };
    const result = evaluateAchievements(pm, [smallSet], new Set());
    expect(result).not.toContain(ACHIEVEMENT_IDS.FIRST_LISTEN);
  });

  it('does not re-earn already earned achievements', () => {
    const pm: Record<string, WordProgressRow> = {
      a0: makeProgress('a0', 1),
    };
    const alreadyEarned = new Set([ACHIEVEMENT_IDS.FIRST_LISTEN]);
    const result = evaluateAchievements(pm, [smallSet], alreadyEarned);
    expect(result).not.toContain(ACHIEVEMENT_IDS.FIRST_LISTEN);
  });

  it('returns curious_ear:{setId} when every word is introduced', () => {
    const pm: Record<string, WordProgressRow> = {
      a0: makeProgress('a0', 1),
      a1: makeProgress('a1', 1),
      a2: makeProgress('a2', 1),
    };
    const result = evaluateAchievements(pm, [smallSet], new Set());
    expect(result).toContain(`${ACHIEVEMENT_IDS.CURIOUS_EAR}:animals`);
  });

  it('does not return curious_ear if any word is unintroduced', () => {
    const pm: Record<string, WordProgressRow> = {
      a0: makeProgress('a0', 1),
      a1: makeProgress('a1', 1),
      // a2 missing → not introduced
    };
    const result = evaluateAchievements(pm, [smallSet], new Set());
    expect(result).not.toContain(`${ACHIEVEMENT_IDS.CURIOUS_EAR}:animals`);
  });

  it('returns sharp_eye:{setId} when all words at stage >= 2', () => {
    const pm: Record<string, WordProgressRow> = {
      a0: makeProgress('a0', 2),
      a1: makeProgress('a1', 3),
      a2: makeProgress('a2', 4),
    };
    const result = evaluateAchievements(pm, [smallSet], new Set());
    expect(result).toContain(`${ACHIEVEMENT_IDS.SHARP_EYE}:animals`);
  });

  it('returns word_builder:{setId} when all words at stage >= 3', () => {
    const pm: Record<string, WordProgressRow> = {
      a0: makeProgress('a0', 3),
      a1: makeProgress('a1', 4),
      a2: makeProgress('a2', 3),
    };
    const result = evaluateAchievements(pm, [smallSet], new Set());
    expect(result).toContain(`${ACHIEVEMENT_IDS.WORD_BUILDER}:animals`);
  });

  it('returns set_master:{setId} only when all words at stage 4 with mastery threshold', () => {
    const pm: Record<string, WordProgressRow> = {
      a0: makeProgress('a0', 4, { consecutiveCorrect: MASTERY_THRESHOLD }),
      a1: makeProgress('a1', 4, { consecutiveCorrect: MASTERY_THRESHOLD }),
      a2: makeProgress('a2', 4, { consecutiveCorrect: MASTERY_THRESHOLD }),
    };
    const result = evaluateAchievements(pm, [smallSet], new Set());
    expect(result).toContain(`${ACHIEVEMENT_IDS.SET_MASTER}:animals`);
  });

  it('does not return set_master if any word lacks mastery threshold', () => {
    const pm: Record<string, WordProgressRow> = {
      a0: makeProgress('a0', 4, { consecutiveCorrect: MASTERY_THRESHOLD }),
      a1: makeProgress('a1', 4, { consecutiveCorrect: MASTERY_THRESHOLD }),
      a2: makeProgress('a2', 4, { consecutiveCorrect: 0 }), // not mastered
    };
    const result = evaluateAchievements(pm, [smallSet], new Set());
    expect(result).not.toContain(`${ACHIEVEMENT_IDS.SET_MASTER}:animals`);
  });

  it('evaluates multiple word sets independently', () => {
    const pm: Record<string, WordProgressRow> = {
      w0: { ...makeProgress('w0', 1), wordSetId: 'weather', introducedAt: 1000 },
      w1: { ...makeProgress('w1', 1), wordSetId: 'weather', introducedAt: 1000 },
    };
    const result = evaluateAchievements(pm, [smallSet, weatherSet], new Set());
    expect(result).toContain(`${ACHIEVEMENT_IDS.CURIOUS_EAR}:weather`);
    expect(result).not.toContain(`${ACHIEVEMENT_IDS.CURIOUS_EAR}:animals`);
  });

  it('can earn multiple achievements in one evaluation', () => {
    const pm: Record<string, WordProgressRow> = {
      a0: makeProgress('a0', 1),
      a1: makeProgress('a1', 1),
      a2: makeProgress('a2', 1),
    };
    const result = evaluateAchievements(pm, [smallSet], new Set());
    expect(result).toContain(ACHIEVEMENT_IDS.FIRST_LISTEN);
    expect(result).toContain(`${ACHIEVEMENT_IDS.CURIOUS_EAR}:animals`);
  });

  it('returns empty array when no achievements newly earned', () => {
    const result = evaluateAchievements({}, [smallSet], new Set());
    expect(result).toEqual([]);
  });
});
