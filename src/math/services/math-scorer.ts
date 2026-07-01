import { MATH_MASTERY_THRESHOLD } from '@/shared/constants/game-constants';
import type { MathProgressRow } from '@/shared/db/schema';

/**
 * Per-problem scoring for the Math subject.
 *
 * Mastery rule (Constitution III — progression is the highest-risk logic, so it
 * lives in one tested place): a problem is mastered after MATH_MASTERY_THRESHOLD
 * consecutive correct answers. Mastery is never revoked by a later wrong answer —
 * a child must never feel they "lost" progress (Constitution I).
 */

export function isMastered(row: Pick<MathProgressRow, 'consecutiveCorrect' | 'mastered'>): boolean {
  return row.mastered || row.consecutiveCorrect >= MATH_MASTERY_THRESHOLD;
}

export function applyCorrect(current: MathProgressRow): Partial<MathProgressRow> {
  const consecutiveCorrect = current.consecutiveCorrect + 1;
  return {
    consecutiveCorrect,
    // Once earned, mastery stays earned (sticky true).
    mastered: current.mastered || consecutiveCorrect >= MATH_MASTERY_THRESHOLD,
    lastReviewedAt: Date.now(),
  };
}

export function applyIncorrect(current: MathProgressRow): Partial<MathProgressRow> {
  return {
    // Reset the streak but keep any mastery already earned.
    consecutiveCorrect: 0,
    totalIncorrect: current.totalIncorrect + 1,
    lastReviewedAt: Date.now(),
  };
}
