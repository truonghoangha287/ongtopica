import type { RuleId } from '@/english/grammar/data/rules';

/**
 * Per-rule mastery maths. Only *first* attempts on an item reach these
 * functions — retry-until-right is good for morale but useless as a signal, so
 * the caller records the first tap and ignores the rest.
 */

export interface RuleMastery {
  attempts: number;
  correct: number;
  /** Consecutive first-attempt correct answers. */
  streak: number;
  gold: boolean;
}

export type MasteryMap = Partial<Record<RuleId, RuleMastery>>;

export const EMPTY_MASTERY: RuleMastery = {
  attempts: 0,
  correct: 0,
  streak: 0,
  gold: false,
};

export const GOLD_STREAK = 6;
export const GOLD_MIN_ATTEMPTS = 8;
export const GOLD_MIN_ACCURACY = 0.8;

export const WEAK_ACCURACY = 0.7;
export const WEAK_MIN_ATTEMPTS = 4;

export function accuracy(m: RuleMastery): number {
  return m.attempts === 0 ? 0 : m.correct / m.attempts;
}

export function isUnseen(m: RuleMastery | undefined): boolean {
  return !m || m.attempts === 0;
}

/**
 * Weak enough to deserve extra drilling. Judged on live accuracy, so a gold
 * rule that starts slipping quietly gets more questions while keeping its star.
 */
export function isWeak(m: RuleMastery | undefined): boolean {
  if (!m || m.attempts < WEAK_MIN_ATTEMPTS) return false;
  return accuracy(m) < WEAK_ACCURACY;
}

/**
 * Record one first-attempt result.
 *
 * Gold is **sticky**: once earned it is never removed. Taking back a star the
 * child already earned reads as punishment, and the star display is not where
 * accuracy needs to be strict — `isWeak` still tells the scheduler the truth.
 */
export function applyAttempt(m: RuleMastery, wasCorrect: boolean): RuleMastery {
  const next: RuleMastery = {
    attempts: m.attempts + 1,
    correct: m.correct + (wasCorrect ? 1 : 0),
    streak: wasCorrect ? m.streak + 1 : 0,
    gold: m.gold,
  };
  if (
    !next.gold &&
    next.streak >= GOLD_STREAK &&
    next.attempts >= GOLD_MIN_ATTEMPTS &&
    accuracy(next) >= GOLD_MIN_ACCURACY
  ) {
    next.gold = true;
  }
  return next;
}
