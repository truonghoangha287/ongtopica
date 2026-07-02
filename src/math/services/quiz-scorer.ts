import type { QuizQuestion, StarRating } from '@/math/types/math.types';
import { STARTING_HEARTS, TWO_STAR_FRACTION } from '@/math/constants/math-constants';

/**
 * Pure scoring helpers for a hive quiz. All progression-affecting maths lives
 * here (Constitution III + VII) so it can be unit-tested in isolation.
 */

/** True when the chosen option index matches the question's answer. */
export function isCorrect(selectedIndex: number | null, question: QuizQuestion): boolean {
  return selectedIndex !== null && selectedIndex === question.answer;
}

/**
 * Hearts remaining after answering. A correct answer keeps hearts; a wrong one
 * costs a heart but never drops below zero.
 */
export function nextHearts(hearts: number, correct: boolean): number {
  return correct ? hearts : Math.max(0, hearts - 1);
}

/**
 * Stars for a completed hive: 3★ for a clean run (all correct), 2★ for at
 * least half correct, otherwise 1★ (finishing always earns something).
 */
export function computeStars(correctCount: number, total: number): StarRating {
  if (total <= 0) return 1;
  if (correctCount >= total) return 3;
  if (correctCount >= Math.ceil(total * TWO_STAR_FRACTION)) return 2;
  return 1;
}

/** Accuracy as a whole-number percentage (0–100). */
export function computeAccuracy(correctCount: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correctCount / total) * 100);
}

/** Fraction (0–1) of the quiz completed, used for the progress bar. */
export function progressFraction(qIndex: number, checked: boolean, total: number): number {
  if (total <= 0) return 0;
  return (qIndex + (checked ? 1 : 0)) / total;
}

export { STARTING_HEARTS };
