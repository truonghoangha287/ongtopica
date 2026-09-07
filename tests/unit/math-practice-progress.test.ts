import { describe, it, expect } from 'vitest';
import {
  labSummary,
  mergeStageResult,
  parsePracticeRow,
  practiceTopicId,
  windowForAttempt,
} from '@/math/services/practice-progress';
import type { StageProgressMap } from '@/math/services/practice-progress';
import { PRACTICE_STAGES } from '@/math/data/number-lab';
import { PRACTICE_WINDOWS } from '@/math/constants/math-constants';

describe('practiceTopicId / parsePracticeRow', () => {
  it('round-trips a stage index through its stored row id', () => {
    for (const stage of PRACTICE_STAGES) {
      expect(parsePracticeRow(practiceTopicId(stage.index))).toBe(stage.index);
    }
  });

  it('ignores rows belonging to the Skills Hive', () => {
    expect(parsePracticeRow('addsub')).toBeUndefined();
    expect(parsePracticeRow('counting')).toBeUndefined();
  });

  it('ignores malformed rows rather than inventing a stage', () => {
    expect(parsePracticeRow('numberlab:')).toBeUndefined();
    expect(parsePracticeRow('numberlab:abc')).toBeUndefined();
    expect(parsePracticeRow('numberlab:0')).toBeUndefined();
    expect(parsePracticeRow('numberlab:-1')).toBeUndefined();
  });
});

describe('windowForAttempt', () => {
  it('cycles through every window then wraps', () => {
    for (let w = 0; w < PRACTICE_WINDOWS; w++) {
      expect(windowForAttempt(w + 1)).toBe(w);
    }
    expect(windowForAttempt(PRACTICE_WINDOWS + 1)).toBe(0);
  });

  it('clamps a missing or nonsensical attempt to the first window', () => {
    expect(windowForAttempt(0)).toBe(0);
    expect(windowForAttempt(-3)).toBe(0);
    expect(windowForAttempt(Number.NaN)).toBe(0);
  });
});

describe('mergeStageResult', () => {
  it('starts a stage at the earned stars and second attempt', () => {
    expect(mergeStageResult(undefined, 2)).toEqual({ stars: 2, attempt: 2 });
  });

  it('keeps the best-ever stars so a weaker replay never demotes a child', () => {
    expect(mergeStageResult({ stars: 3, attempt: 4 }, 1).stars).toBe(3);
  });

  it('raises stars when the replay is better', () => {
    expect(mergeStageResult({ stars: 1, attempt: 2 }, 3).stars).toBe(3);
  });

  it('advances the attempt cursor every time, so the window rotates', () => {
    expect(mergeStageResult({ stars: 3, attempt: 4 }, 1).attempt).toBe(5);
  });
});

describe('labSummary', () => {
  it('counts stages with at least one star', () => {
    const progress: StageProgressMap = {
      1: { stars: 3, attempt: 2 },
      2: { stars: 1, attempt: 2 },
      3: { stars: 0, attempt: 4 },
    };
    expect(labSummary(PRACTICE_STAGES, progress)).toEqual({
      cleared: 2,
      total: PRACTICE_STAGES.length,
    });
  });
});
