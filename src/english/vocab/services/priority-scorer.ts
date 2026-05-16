import { MASTERY_THRESHOLD, CONFIDENCE_WEIGHT, STRUGGLE_WEIGHT } from '@/shared/constants/game-constants';
import type { WordProgressRow } from '@/shared/db/schema';

export function shouldAdvanceStage(progress: WordProgressRow): boolean {
  return progress.consecutiveCorrect >= MASTERY_THRESHOLD && progress.stage < 4;
}

export function applyCorrect(current: WordProgressRow): Partial<WordProgressRow> {
  const consecutiveCorrect = current.consecutiveCorrect + 1;
  const priorityScore = current.priorityScore / CONFIDENCE_WEIGHT;
  if (consecutiveCorrect >= MASTERY_THRESHOLD && current.stage < 4) {
    return {
      consecutiveCorrect: 0,
      priorityScore,
      stage: (current.stage + 1) as 1 | 2 | 3 | 4,
      lastReviewedAt: Date.now(),
    };
  }
  return { consecutiveCorrect, priorityScore, lastReviewedAt: Date.now() };
}

export function applyIncorrect(current: WordProgressRow): Partial<WordProgressRow> {
  return {
    consecutiveCorrect: 0,
    totalIncorrect: current.totalIncorrect + 1,
    priorityScore: current.priorityScore * STRUGGLE_WEIGHT,
    lastReviewedAt: Date.now(),
  };
}
