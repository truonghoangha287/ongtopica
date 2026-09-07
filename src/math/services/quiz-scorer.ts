import type { QuizQuestion, StarRating } from '@/math/types/math.types';
import { STARTING_HEARTS, TWO_STAR_FRACTION } from '@/math/constants/math-constants';

/**
 * Pure scoring helpers for a hive quiz. All progression-affecting maths lives
 * here (Constitution III + VII) so it can be unit-tested in isolation.
 */

/**
 * True when the child's answer matches the question.
 *
 * `selected` carries the tapped VALUE for number-tile questions and an index
 * into `options` for every other question, so the comparison differs by input.
 */
export function isCorrect(selected: number | null, question: QuizQuestion): boolean {
  if (selected === null) return false;
  if (question.input === 'tiles') return selected === question.answerValue;
  return selected === question.answer;
}

/**
 * Whether a missed question should be re-asked later in the run. Only enabled
 * in practice modes, only on the first pass, and only once per question — so a
 * child always gets a second look but the queue can never loop.
 */
export function shouldRequeue(
  question: QuizQuestion | undefined,
  requeuedIds: readonly string[],
  isFirstPass: boolean,
  enabled: boolean,
): boolean {
  if (!enabled || !isFirstPass || !question) return false;
  return !requeuedIds.includes(question.id);
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
